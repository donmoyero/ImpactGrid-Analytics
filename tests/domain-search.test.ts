import { test } from "node:test";
import assert from "node:assert/strict";
import { buildResults, candidatesFor, DEFAULT_TLDS, parseAvailability, parsePrices, sellPrice } from "../lib/domains/search";

test("a bare name is checked across the default endings", () => {
  const r = candidatesFor("  MyBusiness ");
  assert.ok(r.ok);
  if (r.ok) {
    assert.equal(r.candidates.length, DEFAULT_TLDS.length);
    assert.equal(r.candidates[0].domain, "mybusiness.com");
  }
});

test("a typed ending is checked first, without duplicates", () => {
  const r = candidatesFor("https://www.Shop.co.uk/page?x=1");
  assert.ok(r.ok);
  if (r.ok) {
    assert.equal(r.candidates[0].domain, "shop.co.uk");
    assert.equal(r.candidates.filter((c) => c.domain === "shop.co.uk").length, 1);
    assert.equal(r.candidates[1].domain, "shop.com");
  }
});

test("rejects bad input", () => {
  for (const bad of ["", "   ", "-bad", "bad-", "has space.com", "a".repeat(64), "x".repeat(90), "ex ample", "über.com", "foo.c", "foo.com.com.com", "<script>"]) {
    assert.equal(candidatesFor(bad).ok, false, `should reject ${JSON.stringify(bad)}`);
  }
});

test("reads availability whether NameSilo sends one item or many", () => {
  const many = parseAvailability({ reply: { code: 300, available: { domain: [{ domain: "a.com", price: "10.99", premium: "0" }, { domain: "b.net", price: "12.00", premium: "1" }] }, unavailable: { domain: ["c.org", "d.io"] } } });
  assert.deepEqual(many.available.map((a) => a.domain), ["a.com", "b.net"]);
  assert.equal(many.available[1].premium, true);
  assert.deepEqual(many.unavailable, ["c.org", "d.io"]);

  const one = parseAvailability({ reply: { code: 300, available: { domain: { domain: "a.com", price: 9.5 } }, unavailable: { domain: "c.org" } } });
  assert.equal(one.available[0].price, 9.5);
  assert.deepEqual(one.unavailable, ["c.org"]);

  const none = parseAvailability({ reply: { code: 300 } });
  assert.deepEqual(none, { available: [], unavailable: [] });
});

test("provider errors and junk replies throw", () => {
  assert.throws(() => parseAvailability({ reply: { code: 280, detail: "Invalid API Key" } }));
  assert.throws(() => parseAvailability(null));
  assert.throws(() => parseAvailability("nope"));
});

test("price list is read per ending", () => {
  const p = parsePrices({ reply: { code: 300, com: { registration: "10.99", renew: "11.99" }, "co.uk": { registration: "7.00" }, detail: "success" } });
  assert.deepEqual(p.com, { registration: 10.99, renew: 11.99 });
  assert.deepEqual(p["co.uk"], { registration: 7, renew: null });
});

test("selling price adds the markup and always rounds up to the cent", () => {
  assert.equal(sellPrice(10, { percent: 30, fixed: 0 }), 13);
  assert.equal(sellPrice(10.99, { percent: 30, fixed: 0 }), 14.29); // 14.287
  assert.equal(sellPrice(10, { percent: 0, fixed: 2.5 }), 12.5);
  assert.equal(sellPrice(0.1, { percent: 10, fixed: 0 }), 0.11);
});

test("results never expose wholesale cost and skip what can't be sold", () => {
  const cands = ["a.com", "b.net", "c.org", "d.io"].map((d) => ({ domain: d, tld: d.split(".").slice(1).join(".") }));
  const parsed = parseAvailability({ reply: { code: 300, available: { domain: [{ domain: "a.com", price: "10.00" }, { domain: "b.net", price: "9", premium: "1" }, { domain: "d.io" }] }, unavailable: { domain: "c.org" } } });
  const out = buildResults(cands, parsed, {}, { percent: 50, fixed: 0 });
  assert.deepEqual(out[0], { domain: "a.com", available: true, price: 15, renewal: null });
  assert.deepEqual(out[1], { domain: "b.net", available: false }); // premium
  assert.deepEqual(out[2], { domain: "c.org", available: false }); // taken
  assert.deepEqual(out[3], { domain: "d.io", available: false }); // no price known
  assert.ok(!JSON.stringify(out).includes("cost"));
});

test("falls back to the price list when the reply has no price", () => {
  const cands = [{ domain: "a.io", tld: "io" }];
  const parsed = parseAvailability({ reply: { code: 300, available: { domain: { domain: "a.io" } } } });
  const out = buildResults(cands, parsed, { io: { registration: 30, renew: 40 } }, { percent: 10, fixed: 0 });
  assert.deepEqual(out[0], { domain: "a.io", available: true, price: 33, renewal: 44 });
});
