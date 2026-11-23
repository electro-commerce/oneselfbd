import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const front = join(root, "apps/front");
const frontRequire = createRequire(join(front, "package.json"));
const load = (relative, mocks = {}) => {
  const file = resolve(front, relative);
  const source = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  const module = { exports: {} };
  runInNewContext(source, {
    module,
    exports: module.exports,
    require: (name) => {
      if (name in mocks) return mocks[name];
      if (name.startsWith(".")) {
        return load(resolve(dirname(file), `${name}.ts`), mocks);
      }
      return frontRequire(name);
    },
  });
  return module.exports;
};

test("transport defaults enter the queue before GTM initialization", () => {
  const { default: InitGTM, getGTMTransportScript } = load(
    "src/components/GTM/InitGTM.tsx",
    {
      "@/config/config": {
        __esModule: true,
        default: {
          gtm_id: "GTM-5DN7NRZL",
          gtm_server_url: "https://tracking.oneselfbd.com",
        },
      },
    }
  );
  assert.equal(InitGTM().props.gtmId, "GTM-5DN7NRZL");
  const window = {};
  runInNewContext(getGTMTransportScript(), { window });
  window.dataLayer.push({ event: "gtm.js" });
  assert.equal(window.dataLayer[0][0], "set");
  assert.equal(
    window.dataLayer[0][1].server_container_url,
    "https://tracking.oneselfbd.com"
  );
  assert.equal(window.dataLayer[0][1].send_page_view, false);
});

test("container preserves purchase IDs and matching data when GTM clears eventModel", () => {
  const { buildGTMEventPayload } = load("src/tracking/gtm/gtm.builder.ts");
  const hash = "a".repeat(64);
  const purchase = buildGTMEventPayload(
    {
      event_name: "purchase",
      event_id: "purchase_test_123",
      event_time: 1795440000,
      event_source_url: "https://oneselfbd.com/checkout",
      user_data: { em: [hash], ph: [hash], external_id: [hash] },
      custom_data: {
        value: 500,
        currency: "BDT",
        order_id: "order_test_123",
        shipping: 80,
        contents: [{ id: "test_product", item_price: 250, quantity: 2 }],
      },
    },
    { em: "buyer@example.com", ph: "8801700000000" }
  );
  const dataModel = { ...purchase };
  delete dataModel.eventModel;
  const container = JSON.parse(
    readFileSync(join(root, "GTM/ONESELF_WEB_SERVER_ROUTING_FIX.json"), "utf8")
  ).containerVersion;
  const resolveVariable = (ref) => {
    const variable = container.variable.find(
      (entry) => entry.name === ref.slice(2, -2)
    );
    const path = variable.parameter.find((entry) => entry.key === "name").value;
    return path.split(".").reduce((value, key) => value?.[key], dataModel);
  };
  const tag = container.tag.find((entry) => entry.name === "GA4 - purchase");
  const params = Object.fromEntries(
    tag.parameter
      .find((entry) => entry.key === "eventSettingsTable")
      .list.map((row) => {
        const key = row.map.find((cell) => cell.key === "parameter").value;
        const ref = row.map.find((cell) => cell.key === "parameterValue").value;
        return [key, resolveVariable(ref)];
      })
  );
  assert.equal(params.event_id, "purchase_test_123");
  assert.equal(params.transaction_id, "order_test_123");
  assert.equal(params.value, 500);
  assert.equal(params.shipping, 80);
  assert.equal(params.items[0].quantity, 2);
  assert.equal(params.meta_em, hash);
  assert.equal(params.meta_ph, hash);
  assert.equal(params.meta_external_id, hash);
  assert.equal("email" in params, false);

  const pushes = [];
  const { pushGTMEvent } = load("src/tracking/gtm/gtm.push.ts", {
    "@next/third-parties/google": {
      sendGTMEvent: (event) => pushes.push(event),
    },
  });
  pushGTMEvent(purchase);
  assert.equal(pushes[0].oneself_event, null);
  assert.equal(pushes[0].ecommerce, null);
  assert.equal(pushes[1].oneself_event.event_id, params.event_id);
});
