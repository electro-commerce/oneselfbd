import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readContainer = (file) => {
  const source = readFileSync(join(root, file), "utf8");
  assert.doesNotMatch(source, /techmela|G-GZERV29BVS|2188533918610069/i);
  return JSON.parse(source).containerVersion;
};
const web = readContainer("gtm-web-container-template.json");
const server = readContainer("gtm-server-container-template.json");
const byName = (items, name) => {
  const item = items.find((entry) => entry.name === name);
  assert.ok(item, `Missing ${name}`);
  return item;
};
const param = (tag, key) => {
  const value = tag.parameter.find((entry) => entry.key === key);
  assert.ok(value, `${tag.name} missing ${key}`);
  return value;
};
const table = (tag, key) =>
  Object.fromEntries(
    param(tag, key).list.map((entry) => {
      const cells = Object.fromEntries(entry.map.map((cell) => [cell.key, cell.value]));
      return [cells.parameter ?? cells.name, cells.parameterValue ?? cells.value];
    }),
  );
const variablePath = (container, name) => {
  const variable = byName(container.variable, name);
  return param(variable, variable.type === "v" ? "name" : "keyPath").value;
};

for (const [container, usage] of [[web, "WEB"], [server, "SERVER"]]) {
  assert.ok(container.container.usageContext.includes(usage));
  const variables = new Set(container.variable.map((variable) => variable.name));
  const triggers = new Set(container.trigger.map((trigger) => trigger.triggerId));
  for (const tag of container.tag) {
    assert.equal(tag.accountId, container.accountId);
    assert.equal(tag.containerId, container.containerId);
    for (const ref of JSON.stringify(tag).matchAll(/{{([^}]+)}}/g)) {
      assert.ok(
        variables.has(ref[1]) || ref[1].startsWith("_") ||
          ["Event Name", "Container ID", "Page URL", "Page Path", "Page Hostname", "Referrer", "Click URL", "Click Text", "Debug Mode"].includes(ref[1]),
        `${tag.name} has unresolved variable ${ref[1]}`,
      );
    }
    for (const id of tag.firingTriggerId ?? []) {
      assert.ok(triggers.has(id) || Number(id) > 1_000_000_000, `${tag.name} has missing trigger ${id}`);
    }
  }
}

for (const name of ["GA4", "Meta Pixel ="]) {
  assert.equal(param(byName(web.variable, name), "value").value, "", `${name} must use Oneself credentials`);
}
for (const name of ["FB - Pixel ID - REPLACE ME", "FB - Access Token - REPLACE ME", "FB - Test Event Code"]) {
  assert.equal(param(byName(server.variable, name), "value").value, "", `${name} must use Oneself credentials`);
}
assert.deepEqual(server.container.taggingServerUrls, ["https://tracking.oneselfbd.com"]);
assert.equal(variablePath(web, "DLV - ecommerce.items"), "ecommerce.items");
assert.equal(variablePath(web, "DLV - ecommerce.value"), "ecommerce.value");
assert.equal(variablePath(web, "DLV - ecommerce.currency"), "ecommerce.currency");
assert.equal(variablePath(server, "ED - Order ID"), "transaction_id");
assert.equal(variablePath(server, "ED - Payment Method"), "payment_type");
assert.equal(variablePath(server, "ED - User Email"), "meta_em");
assert.equal(variablePath(server, "ED - User Phone"), "meta_ph");

const commerce = ["view_item", "add_to_cart", "begin_checkout", "add_shipping_info", "add_payment_info", "purchase", "add_to_wishlist", "remove_from_cart"];
for (const tag of web.tag.filter((entry) => entry.name.startsWith("GA4 - "))) {
  const fields = table(tag, "eventSettingsTable");
  assert.ok(Object.keys(fields).length <= 25, `${tag.name} exceeds 25 event parameters`);
  assert.equal(fields.event_id, "{{DLV - eventModel.event_id}}");
  assert.ok(!("email" in fields || "phone" in fields || "user_data" in fields), `${tag.name} sends raw customer data`);
  if (commerce.some((event) => tag.name === `GA4 - ${event}`)) {
    assert.equal(fields.items, "{{DLV - ecommerce.items}}");
    assert.equal(fields.value, "{{DLV - ecommerce.value}}");
    assert.equal(fields.currency, "{{DLV - ecommerce.currency}}");
  }
}
assert.equal(table(byName(web.tag, "GA4 - purchase"), "eventSettingsTable").transaction_id, "{{DLV - ecommerce.transaction_id}}");
assert.equal(table(byName(web.tag, "GA4 - add_payment_info"), "eventSettingsTable").payment_type, "{{DLV - eventModel.payment_type}}");
assert.equal(table(byName(web.tag, "GA4 - add_shipping_info"), "eventSettingsTable").shipping_tier, "{{DLV - ecommerce.shipping_tier}}");
for (const tag of web.tag.filter((entry) => entry.name.startsWith("Meta Pixel "))) {
  assert.equal(param(tag, "eventId").value, "{{DLV - eventModel.event_id}}");
  assert.equal(param(tag, "useGA4Ecommerce").value, "true");
  assert.equal(param(tag, "disablePushState").value, "true");
  assert.equal(param(tag, "optInMetaCAPI").value, "false");
}
for (const tag of server.tag.filter((entry) => entry.name.startsWith("FB - "))) {
  assert.equal(param(tag, "autoMapCustomData").value, "true");
  assert.equal(table(tag, "serverEventDataList").event_id, "{{ED - Event ID}}");
  const custom = tag.parameter.find((entry) => entry.key === "customDataList");
  if (custom) {
    const fields = table(tag, "customDataList");
    for (const key of ["contents", "content_name", "content_category", "content_type"]) {
      assert.ok(!(key in fields), `${tag.name} overrides automatic ${key} mapping`);
    }
  }
}
console.log("GTM web/server container contract verified");
