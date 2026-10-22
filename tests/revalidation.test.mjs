import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

// Exercise the actual route handlers with isolated Next cache and API dependencies.
function loadRoute(file, { env = {}, fetch, invalidate = () => {} } = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  vm.runInNewContext(code, {
    exports,
    process: { env },
    fetch,
    AbortSignal,
    URL,
    require(name) {
      if (name === "next/server")
        return {
          NextResponse: {
            json: (body, options) => ({ body, status: options?.status || 200 }),
          },
        };
      if (name === "next/cache")
        return {
          revalidatePath: (...args) => invalidate("path", ...args),
          revalidateTag: (...args) => invalidate("tag", ...args),
        };
      if (name === "@/config/config")
        return {
          default: {
            api_base_url: "http://api",
            client_base_url: "http://front",
            revalidate_secret: env.REVALIDATE_SECRET,
          },
        };
      if (name === "@/const/role")
        return {
          ROLES: { SUPER_ADMIN: "superAdmin", ADMIN: "admin", STAFF: "staff" },
        };
      throw new Error(`Unexpected import ${name}`);
    },
  });
  return exports;
}
const front = "apps/front/src/app/api/revalidate/route.ts";
const dashboard = "apps/dashboard/src/app/api/revalidate/route.ts";
function request(body, headers = {}) {
  return {
    headers: new Headers(headers),
    cookies: { get: () => undefined },
    json: async () => body,
  };
}

test("storefront rejects missing or wrong secret without invalidating", async () => {
  let calls = 0;
  for (const secret of [undefined, "wrong"]) {
    const route = loadRoute(front, {
      env: { REVALIDATE_SECRET: "secret" },
      invalidate: () => calls++,
    });
    assert.equal(
      (
        await route.POST(
          request(
            { all: true },
            secret ? { authorization: `Bearer ${secret}` } : {}
          )
        )
      ).status,
      401
    );
  }
  assert.equal(calls, 0);
});
test("storefront fails closed when secret is unconfigured", async () => {
  assert.equal(
    (
      await loadRoute(front).POST(
        request({ all: true }, { authorization: "Bearer undefined" })
      )
    ).status,
    401
  );
});
test("full revalidation invalidates the root layout", async () => {
  const calls = [];
  const route = loadRoute(front, {
    env: { REVALIDATE_SECRET: "secret" },
    invalidate: (...args) => calls.push(args),
  });
  const result = await route.POST(
    request({ all: true }, { authorization: "Bearer secret" })
  );
  assert.equal(result.status, 200);
  assert.deepEqual(calls, [["path", "/", "layout"]]);
  assert.equal(JSON.stringify(result.body).includes("secret"), false);
});
test("tag revalidation preserves dynamic product tags and rejects invalid payloads", async () => {
  const calls = [];
  const route = loadRoute(front, {
    env: { REVALIDATE_SECRET: "secret" },
    invalidate: (...args) => calls.push(args),
  });
  const headers = { authorization: "Bearer secret" };
  assert.equal(
    (
      await route.POST(
        request({ tags: ["products", "product-example"] }, headers)
      )
    ).status,
    200
  );
  assert.deepEqual(calls, [
    ["tag", "products"],
    ["tag", "product-example"],
  ]);
  for (const body of [
    {},
    { tags: [] },
    { tags: [12] },
    { tags: ["x".repeat(257)] },
  ]) {
    assert.equal((await route.POST(request(body, headers))).status, 400);
  }
});
test("dashboard rejects form submissions and unauthenticated requests before fetch", async () => {
  const route = loadRoute(dashboard, {
    env: { REVALIDATE_SECRET: "secret" },
    fetch: () => {
      throw new Error("Must not call API");
    },
  });
  assert.equal((await route.POST(request({ all: true }))).status, 403);
  assert.equal(
    (await route.POST(request({ all: true }, { "x-revalidate-request": "1" })))
      .status,
    401
  );
});
test("dashboard rejects invalid tokens and customer profiles", async () => {
  for (const profile of [
    { ok: false },
    { ok: true, json: async () => ({ data: { role: "customer" } }) },
  ]) {
    const route = loadRoute(dashboard, { env: { REVALIDATE_SECRET: "secret" }, fetch: async () => profile });
    const result = await route.POST(
      request(
        { all: true },
        { "x-revalidate-request": "1", authorization: "Bearer user-token" }
      )
    );
    assert.equal(result.status, profile.ok ? 403 : 401);
  }
});
test("dashboard authenticates each staff role and forwards only the server secret", async () => {
  for (const role of ["superAdmin", "admin", "staff"]) {
    const calls = [];
    const route = loadRoute(dashboard, {
      env: {
        REVALIDATE_SECRET: "server-secret",
        API_INTERNAL_URL: "http://server:5000/server-api/v1",
        STOREFRONT_INTERNAL_URL: "http://front:3000",
      },
      fetch: async (url, options) => {
        calls.push({ url, options });
        return calls.length === 1
          ? { ok: true, json: async () => ({ data: { role } }) }
          : { ok: true };
      },
    });
    assert.equal(
      (
        await route.POST(
          request(
            { all: true },
            { "x-revalidate-request": "1", authorization: "Bearer user-token" }
          )
        )
      ).status,
      200
    );
    assert.equal(calls[0].options.headers.authorization, "Bearer user-token");
    assert.equal(calls[0].options.cache, "no-store");
    assert.equal(calls[1].url, "http://front:3000/api/revalidate");
    assert.equal(
      calls[1].options.headers.authorization,
      "Bearer server-secret"
    );
    assert.deepEqual(JSON.parse(calls[1].options.body), { all: true });
  }
});
test("dashboard reports storefront failures instead of false success", async () => {
  let calls = 0;
  const route = loadRoute(dashboard, {
    env: { REVALIDATE_SECRET: "secret" },
    fetch: async () =>
      ++calls === 1
        ? { ok: true, json: async () => ({ data: { role: "admin" } }) }
        : { ok: false },
  });
  assert.equal(
    (
      await route.POST(
        request(
          { all: true },
          { "x-revalidate-request": "1", authorization: "Bearer token" }
        )
      )
    ).status,
    502
  );
});

test("dashboard public secret revalidates without a login cookie or profile request", async () => {
  for (const env of [
    { NEXT_PUBLIC_REVALIDATE_SECRET: "shared-secret" },
    { REVALIDATE_SECRET: "shared-secret", NEXT_PUBLIC_REVALIDATE_SECRET: "shared-secret" },
  ]) {
    const calls = [];
    const route = loadRoute(dashboard, {
      env,
      fetch: async (url, options) => {
        calls.push({ url, options });
        return { ok: true };
      },
    });
    const result = await route.POST(request({ tags: ["products"] }, {
      "x-revalidate-request": "1",
      "x-revalidate-secret": "shared-secret",
    }));
    assert.equal(result.status, 200);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].options.headers.authorization, "Bearer shared-secret");
    assert.deepEqual(JSON.parse(calls[0].options.body), { tags: ["products"] });
  }
});
test("dashboard rejects a wrong public secret without a login", async () => {
  const route = loadRoute(dashboard, {
    env: { NEXT_PUBLIC_REVALIDATE_SECRET: "secret" },
    fetch: () => { throw new Error("Must not forward"); },
  });
  assert.equal((await route.POST(request({ all: true }, {
    "x-revalidate-request": "1", "x-revalidate-secret": "wrong",
  }))).status, 401);
});

// Browser fetch does not automatically prepend the Next.js basePath.
test("dashboard client sends tag and full invalidation to its /admin API route", async () => {
  const calls = [];
  const client = loadRoute("apps/dashboard/src/utilities/revalidate.ts", {
    env: { NEXT_PUBLIC_REVALIDATE_SECRET: "shared-secret" },
    fetch: async (url, options) => {
      calls.push({ url, options });
      return { ok: true };
    },
  });
  await client.revalidateTag(["products", "product-example"]);
  await client.revalidateStorefront();
  for (const call of calls) {
    assert.equal(call.url, "/admin/api/revalidate");
    assert.equal(call.options.headers["x-revalidate-secret"], "shared-secret");
  }
  assert.deepEqual(JSON.parse(calls[0].options.body), { tags: ["products", "product-example"] });
  assert.deepEqual(JSON.parse(calls[1].options.body), { all: true });
});
