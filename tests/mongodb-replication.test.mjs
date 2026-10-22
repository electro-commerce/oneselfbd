import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(
  "deployment/vps/mongodb/init-replica-set.js",
  "utf8"
);
const hosts = ["mongodb:27017"];
function initialize({
  existing = [],
  primaryHost = hosts[0],
  failed = false,
} = {}) {
  let config = existing.length
    ? {
        _id: "rs0",
        version: 7,
        settings: { preserved: true },
        members: existing.map((host, _id) => ({ host, _id })),
      }
    : null;
  let initiations = 0;
  const changes = [];
  let exitCode;
  const exit = new Error("shell exit");
  try {
    vm.runInNewContext(source, {
      Mongo: function (uri) {
        const host = new URL(uri).host;
        if (failed) throw new Error("unavailable");
        return {
          getDB: () => ({
            runCommand(command) {
              if (command.hello)
                return {
                  setName: config ? "rs0" : undefined,
                  isWritablePrimary: !!config && host === primaryHost,
                };
              if (command.replSetInitiate) {
                config = structuredClone(command.replSetInitiate);
                config.version = 1;
                initiations++;
                return { ok: 1 };
              }
              if (command.replSetGetConfig)
                return { ok: 1, config: structuredClone(config) };
              if (command.replSetReconfig) {
                changes.push(
                  command.replSetReconfig.members.length - config.members.length
                );
                config = structuredClone(command.replSetReconfig);
                return { ok: 1 };
              }
              if (command.replSetGetStatus)
                return {
                  ok: 1,
                  members: config.members.map((m) => ({
                    name: m.host,
                    health: 1,
                    state: m.host === primaryHost ? 1 : 2,
                  })),
                };
              throw new Error("Unexpected command");
            },
          }),
        };
      },
      print() {
        if (exitCode !== undefined) throw exit;
      },
      sleep() {},
      quit(code) {
        exitCode = code;
        throw exit;
      },
    });
  } catch (error) {
    if (error !== exit) throw error;
  }
  return { config, initiations, changes, exitCode };
}

test("fresh installation initializes one rs0 member", () => {
  const result = initialize();
  assert.equal(result.exitCode, 0);
  assert.equal(result.initiations, 1);
  assert.deepEqual(
    result.config.members.map((m) => m.host),
    hosts
  );
});
test("existing single-node set preserves configuration and data", () => {
  const result = initialize({ existing: hosts });
  assert.equal(result.exitCode, 0);
  assert.equal(result.initiations, 0);
  assert.deepEqual(result.changes, []);
  assert.equal(result.config.settings.preserved, true);
});
test("multi-member set requires explicit migration rather than forced reset", () => {
  const result = initialize({
    existing: [
      ...hosts,
      "mongodb-secondary-1:27017",
      "mongodb-secondary-2:27017",
    ],
  });
  assert.equal(result.exitCode, 1);
  assert.equal(result.initiations, 0);
  assert.deepEqual(result.changes, []);
});
test("unavailable database fails initialization rather than starting the API", () => {
  assert.equal(initialize({ failed: true }).exitCode, 1);
});
