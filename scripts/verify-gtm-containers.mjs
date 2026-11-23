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
const webFile = process.argv[2] ?? "GTM/GTM-5DN7NRZL_WEB_CONTAINER.json";
const web = readContainer(webFile);
const server = readContainer("GTM/GTM-WP3WDF7L_SERVER_CONTAINER.json");
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

const googleTag = byName(web.tag, "Google Tag");
assert.equal(googleTag.type, "googtag");
assert.deepEqual(googleTag.firingTriggerId, ["2147479573"]);
assert.equal(googleTag.priority?.value, "100");
assert.equal(
  table(googleTag, "configSettingsTable").server_container_url,
  "{{Const - Server Container URL}}",
);
assert.equal(table(googleTag, "configSettingsTable").send_page_view, "false");
assert.equal(
  param(byName(web.variable, "Const - Server Container URL"), "value").value,
  "https://tracking.oneselfbd.com",
);

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

for (const name of ["GA4", "Meta Pixel ID"]) {
  const val = param(byName(web.variable, name), "value").value;
  assert.ok(val && val.length > 0, `${name} must be non-empty`);
}
const pixelId = param(byName(server.variable, "FB - Pixel ID - REPLACE ME"), "value").value;
assert.match(pixelId, /^\d+$/, "Meta Pixel ID must be numeric");
const accessToken = param(byName(server.variable, "FB - Access Token - REPLACE ME"), "value").value;
assert.ok(
  accessToken === "REPLACE_WITH_META_CAPI_ACCESS_TOKEN" || accessToken.length >= 20,
  "Meta access token must be a clear placeholder or a plausible token",
);
const testEventCode = byName(server.variable, "FB - Test Event Code");
assert.equal(testEventCode.type, "ed");
assert.equal(
  param(testEventCode, "keyPath").value,
  "meta_test_event_code_disabled",
  "Production export must not set a Meta test event code",
);
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
const triggerFilter = (container, id) => {
  const trigger = container.trigger.find((entry) => entry.triggerId === id);
  assert.ok(trigger, `Missing trigger ${id}`);
  const filter = trigger.customEventFilter?.[0];
  assert.ok(filter, `Trigger ${id} missing customEventFilter`);
  const arg0 = filter.parameter.find((p) => p.key === "arg0")?.value;
  const arg1 = filter.parameter.find((p) => p.key === "arg1")?.value;
  return { type: filter.type, arg0, arg1 };
};

assert.deepEqual(triggerFilter(web, "158"), {
  type: "MATCH_REGEX",
  arg0: "{{_event}}",
  arg1: "^(begin_checkout|initiate_checkout)$",
});
assert.deepEqual(triggerFilter(web, "176"), {
  type: "MATCH_REGEX",
  arg0: "{{_event}}",
  arg1: "^(view_item|view_content)$",
});
assert.deepEqual(triggerFilter(web, "133"), {
  type: "MATCH_REGEX",
  arg0: "{{_event}}",
  arg1: "^(page_view|custom_page_view)$",
});
assert.deepEqual(triggerFilter(server, "53"), {
  type: "MATCH_REGEX",
  arg0: "{{_event}}",
  arg1: "^(view_item|view_content)$",
});
assert.deepEqual(triggerFilter(server, "49"), {
  type: "MATCH_REGEX",
  arg0: "{{_event}}",
  arg1: "^(begin_checkout|initiate_checkout)$",
});
assert.deepEqual(triggerFilter(server, "50"), {
  type: "MATCH_REGEX",
  arg0: "{{_event}}",
  arg1: "^(page_view|custom_page_view)$",
});

assert.ok(
  server.builtInVariable.some(
    (variable) => variable.name === "Client Name" && variable.type === "CLIENT_NAME",
  ),
);
const ga4ClientTrigger = byName(server.trigger, "GA4 Client");
assert.equal(ga4ClientTrigger.type, "ALWAYS");
assert.deepEqual(
  ga4ClientTrigger.filter[0].parameter.map((entry) => entry.value),
  ["{{Client Name}}", "GA4"],
);
const ga4Forwarding = byName(server.tag, "GA4 - All Events");
assert.equal(ga4Forwarding.type, "sgtmgaaw");
assert.deepEqual(ga4Forwarding.firingTriggerId, [ga4ClientTrigger.triggerId]);
assert.equal(param(ga4Forwarding, "isMeasurementIdMandatory").value, "true");
const excludedFields = new Set(
  param(ga4Forwarding, "epToExclude").list.map(
    (entry) => entry.map.find((cell) => cell.key === "fieldName")?.value,
  ),
);
const metaMatchingFields = new Set(
  web.tag
    .filter((entry) => entry.name.startsWith("GA4 - "))
    .flatMap((entry) =>
      Object.keys(table(entry, "eventSettingsTable")).filter((field) =>
        field.startsWith("meta_"),
      ),
    ),
);
for (const field of [
  "event_id",
  "email",
  "phone",
  "fbp",
  "fbc",
  "external_id",
  ...metaMatchingFields,
]) {
  assert.ok(excludedFields.has(field), `GA4 forwarding leaks ${field}`);
}

if (webFile === "GTM/ONESELF_WEB_SERVER_ROUTING_FIX.json") {
  for (const tag of web.tag.filter((entry) => entry.type === "gaawe")) {
    assert.deepEqual(tag.setupTag, [
      { tagName: googleTag.name, stopOnSetupFailure: true },
    ]);
  }
  for (const variable of web.variable.filter((entry) =>
    entry.name.startsWith("DLV - eventModel."),
  )) {
    assert.equal(
      param(variable, "name").value,
      variable.name.replace("DLV - eventModel.", "oneself_event."),
      `${variable.name} must read the application's stable payload`,
    );
  }
}

process.stdout.write(`GTM web/server container contract verified: ${webFile}\n`);
