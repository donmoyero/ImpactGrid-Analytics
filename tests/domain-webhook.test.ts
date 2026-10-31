import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { parseDomainOrder, parseRegisterReply, verifyStripeSignature } from "../lib/domains/webhook";

const secret = "whsec_test";
const sign = (body: string, t: number, s = secret) => `t=${t},v1=${createHmac("sha256", s).update(`${t}.${body}`).digest("hex")}`;

test("accepts a correctly signed body", () => {
  const body = '{"a":1}';
  assert.equal(verifyStripeSignature(body, sign(body, 1000), secret, 300, 1100), true);
});

test("rejects tampered bodies, wrong secrets, stale timestamps and junk headers", () => {
  const body = '{"a":1}';
  assert.equal(verifyStripeSignature('{"a":2}', sign(body, 1000), secret, 300, 1100), false);
  assert.equal(verifyStripeSignature(body, sign(body, 1000, "other"), secret, 300, 1100), false);
  assert.equal(verifyStripeSignature(body, sign(body, 1000), secret, 300, 2000), false);
  for (const h of [null, "", "garbage", "t=1000", "v1=abc", "t=x,v1=abc"]) assert.equal(verifyStripeSignature(body, h, secret, 300, 1100), false);
  assert.equal(verifyStripeSignature(body, sign(body, 1000), "", 300, 1100), false);
});

const session = (over: Record<string, unknown> = {}) => ({ type: "checkout.session.completed", data: { object: { id: "cs_1", payment_status: "paid", metadata: { domain: "MyShop.com" }, customer_details: { email: "a@b.co" }, ...over } } });

test("reads a paid domain order", () => {
  assert.deepEqual(parseDomainOrder(session()), { domain: "myshop.com", email: "a@b.co", sessionId: "cs_1" });
});

test("ignores anything that isn't a paid domain order", () => {
  assert.equal(parseDomainOrder(session({ payment_status: "unpaid" })), null);
  assert.equal(parseDomainOrder(session({ metadata: {} })), null);
  assert.equal(parseDomainOrder(session({ metadata: { domain: "not a domain" } })), null);
  assert.equal(parseDomainOrder({ ...session(), type: "payment_intent.succeeded" }), null);
  assert.equal(parseDomainOrder(null), null);
});

test("reads the registration reply", () => {
  assert.deepEqual(parseRegisterReply({ reply: { code: "300", detail: "success" } }), { ok: true });
  const bad = parseRegisterReply({ reply: { code: 280, detail: "Insufficient funds" } });
  assert.equal(bad.ok, false);
  assert.equal(parseRegisterReply({}).ok, false);
});
