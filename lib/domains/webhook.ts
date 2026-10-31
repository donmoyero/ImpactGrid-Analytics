/**
 * Pure helpers for the Stripe webhook that registers a domain once it has been paid for: checking Stripe's signature,
 * picking the order out of the event, and reading NameSilo's registration reply. No network calls in this file.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { singleDomain } from "./checkout";

/** Verifies a Stripe-Signature header against the exact raw request body. Rejects anything older than `toleranceSec`. */
export function verifyStripeSignature(rawBody: string, header: string | null, secret: string, toleranceSec = 300, nowSec = Math.floor(Date.now() / 1000)): boolean {
  if (!header || !secret) return false;
  let t = "";
  const sigs: string[] = [];
  for (const part of header.split(",")) {
    const [k, v] = part.split("=");
    if (k?.trim() === "t") t = (v ?? "").trim();
    else if (k?.trim() === "v1" && v) sigs.push(v.trim());
  }
  const ts = Number(t);
  if (!t || !Number.isFinite(ts) || sigs.length === 0) return false;
  if (Math.abs(nowSec - ts) > toleranceSec) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
  const a = Buffer.from(expected);
  return sigs.some((s) => {
    const b = Buffer.from(s);
    return a.length === b.length && timingSafeEqual(a, b);
  });
}

export type Order = { domain: string; email: string | null; sessionId: string };

/** Returns the paid domain order in a Stripe event, or null if the event isn't one (old payment links carry no domain). */
export function parseDomainOrder(event: unknown): Order | null {
  const e = event as { type?: unknown; data?: { object?: Record<string, unknown> } } | null;
  if (!e || e.type !== "checkout.session.completed") return null;
  const s = e.data?.object;
  if (!s || s.payment_status !== "paid") return null;
  const meta = s.metadata as { domain?: unknown } | null | undefined;
  const one = singleDomain(meta?.domain);
  if (!one.ok) return null;
  const email = (s.customer_details as { email?: unknown } | null | undefined)?.email;
  return { domain: one.domain, email: typeof email === "string" ? email : null, sessionId: typeof s.id === "string" ? s.id : "" };
}

/** Reads a NameSilo registerDomain reply. Code 300 means the domain was registered. */
export function parseRegisterReply(body: unknown): { ok: true } | { ok: false; error: string } {
  const reply = (body as { reply?: { code?: unknown; detail?: unknown } } | null)?.reply;
  if (!reply) return { ok: false, error: "Unexpected reply from the domain provider." };
  if (Number(reply.code) === 300) return { ok: true };
  return { ok: false, error: `Domain provider error ${String(reply.code)}: ${String(reply.detail ?? "no detail")}` };
}
