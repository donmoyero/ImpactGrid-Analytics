/**
 * Pure helpers for domain search: turning what a visitor types into candidate domain names,
 * reading NameSilo's JSON replies, and adding our markup. No network calls in this file, so it is fully testable.
 */

/** TLDs checked when the visitor types only a name (no dot). Order = display order. */
export const DEFAULT_TLDS = ["com", "net", "org", "co", "io", "shop", "store", "online", "co.uk", "app"] as const;

const LABEL = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
const TLD = /^[a-z]{2,24}(\.[a-z]{2,24})?$/;

export type Candidate = { domain: string; tld: string };

/** Cleans the visitor's input and returns the domains to check, or an error message. */
export function candidatesFor(raw: string): { ok: true; candidates: Candidate[] } | { ok: false; error: string } {
  const text = (raw ?? "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0];
  if (!text) return { ok: false, error: "Type a name to search, like mybusiness or mybusiness.com." };
  if (text.length > 80) return { ok: false, error: "That name is too long." };

  const firstDot = text.indexOf(".");
  const label = firstDot === -1 ? text : text.slice(0, firstDot);
  const typedTld = firstDot === -1 ? "" : text.slice(firstDot + 1);

  if (!LABEL.test(label)) return { ok: false, error: "Use letters, numbers and hyphens only (no spaces), and don't start or end with a hyphen." };
  if (typedTld && !TLD.test(typedTld)) return { ok: false, error: "That ending doesn't look right. Try something like .com or .co.uk." };

  const tlds = typedTld ? [typedTld, ...DEFAULT_TLDS.filter((t) => t !== typedTld)] : [...DEFAULT_TLDS];
  return { ok: true, candidates: tlds.map((tld) => ({ domain: `${label}.${tld}`, tld })) };
}

export type Offer = { domain: string; available: true; price: number; renewal: number | null };
export type Taken = { domain: string; available: false };
export type Result = Offer | Taken;

type Json = Record<string, unknown>;
const isObj = (v: unknown): v is Json => typeof v === "object" && v !== null && !Array.isArray(v);
const num = (v: unknown): number | null => {
  const n = typeof v === "string" || typeof v === "number" ? Number(v) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : null;
};

/** NameSilo returns one item as an object and several as an array (and sometimes plain strings). */
function items(group: unknown): (string | Json)[] {
  if (!group) return [];
  const inner = isObj(group) && "domain" in group ? group.domain : group;
  const list = Array.isArray(inner) ? inner : [inner];
  return list.filter((x): x is string | Json => typeof x === "string" || isObj(x));
}
const nameOf = (x: string | Json) => (typeof x === "string" ? x : typeof x.domain === "string" ? x.domain : "").toLowerCase();

export type Parsed = {
  available: { domain: string; price: number | null; renewal: number | null; premium: boolean }[];
  unavailable: string[];
};

/** Reads a checkRegisterAvailability reply. Throws with a readable message if NameSilo reported an error. */
export function parseAvailability(body: unknown): Parsed {
  const reply = isObj(body) && isObj(body.reply) ? body.reply : null;
  if (!reply) throw new Error("Unexpected reply from the domain provider.");
  const code = Number(reply.code);
  if (code !== 300 && code !== 301 && code !== 302) throw new Error(`Domain provider error ${String(reply.code)}.`);

  const available = items(reply.available).map((x) => {
    const o = typeof x === "string" ? {} : x;
    return {
      domain: nameOf(x),
      price: num(o.price),
      renewal: num(o.renew ?? o.renewal),
      premium: String(o.premium ?? "0") === "1" || o.premium === true,
    };
  }).filter((x) => x.domain);
  const unavailable = [...items(reply.unavailable), ...items(reply.invalid)].map(nameOf).filter(Boolean);
  return { available, unavailable };
}

/** Reads a getPrices reply into { tld: { registration, renew } }. */
export function parsePrices(body: unknown): Record<string, { registration: number; renew: number | null }> {
  const reply = isObj(body) && isObj(body.reply) ? body.reply : null;
  if (!reply || Number(reply.code) !== 300) throw new Error("Couldn't read the price list.");
  const out: Record<string, { registration: number; renew: number | null }> = {};
  for (const [tld, v] of Object.entries(reply)) {
    if (!isObj(v)) continue;
    const registration = num(v.registration);
    if (registration !== null) out[tld.toLowerCase()] = { registration, renew: num(v.renew) };
  }
  return out;
}

export type Markup = { percent: number; fixed: number };

export function markupFromEnv(env: Record<string, string | undefined> = process.env): Markup {
  const p = Number(env.DOMAIN_MARKUP_PERCENT ?? "30");
  const f = Number(env.DOMAIN_MARKUP_FIXED ?? "0");
  return { percent: Number.isFinite(p) && p >= 0 ? p : 30, fixed: Number.isFinite(f) && f >= 0 ? f : 0 };
}

/** Our selling price from the wholesale cost, rounded UP to the next cent so we never undercharge by rounding. */
export function sellPrice(cost: number, m: Markup): number {
  return Math.ceil((cost * (1 + m.percent / 100) + m.fixed) * 100 - 1e-9) / 100;
}

/** Combines availability, the price list and our markup into what the visitor sees. Wholesale cost is never included. */
export function buildResults(
  candidates: Candidate[],
  parsed: Parsed,
  prices: Record<string, { registration: number; renew: number | null }>,
  markup: Markup
): Result[] {
  const avail = new Map(parsed.available.map((a) => [a.domain, a]));
  const results: Result[] = [];
  for (const c of candidates) {
    const a = avail.get(c.domain);
    if (!a || a.premium) {
      results.push({ domain: c.domain, available: false }); // premium names aren't offered
      continue;
    }
    const list = prices[c.tld];
    const cost = a.price ?? list?.registration ?? null;
    if (cost === null) {
      results.push({ domain: c.domain, available: false }); // can't price it safely, so don't sell it
      continue;
    }
    const renewCost = a.renewal ?? list?.renew ?? null;
    results.push({ domain: c.domain, available: true, price: sellPrice(cost, markup), renewal: renewCost === null ? null : sellPrice(renewCost, markup) });
  }
  return results;
}
