import { test } from "node:test";
import assert from "node:assert/strict";
import { checkoutParams, referenceFor, singleDomain } from "../lib/domains/checkout";

test("accepts one full domain, rejects bare names and junk", () => {
  const ok = singleDomain(" MyShop.co.uk ");
  assert.ok(ok.ok);
  if (ok.ok) { assert.equal(ok.domain, "myshop.co.uk"); assert.equal(ok.tld, "co.uk"); }
  for (const bad of [undefined, 5, "", "myshop", "-bad.com", "a b.com", "<script>.com"]) assert.equal(singleDomain(bad).ok, false, `should reject ${JSON.stringify(bad)}`);
});

test("reference id has no dots", () => {
  assert.equal(referenceFor("my-shop.co.uk"), "my-shop_co_uk");
});

test("checkout params carry the server price in cents and the domain", () => {
  const p = checkoutParams("myshop.com", 12.99, "https://shopplug.uk/");
  assert.equal(p.get("line_items[0][price_data][unit_amount]"), "1299");
  assert.equal(p.get("line_items[0][price_data][currency]"), "usd");
  assert.equal(p.get("metadata[domain]"), "myshop.com");
  assert.equal(p.get("client_reference_id"), "myshop_com");
  assert.equal(p.get("success_url"), "https://shopplug.uk/domains?paid=1");
  assert.equal(p.get("cancel_url"), "https://shopplug.uk/domains");
  assert.equal(checkoutParams("a.com", 0.1 + 0.2, "x").get("line_items[0][price_data][unit_amount]"), "30");
});
