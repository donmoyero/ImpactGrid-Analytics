import { buildResults, candidatesFor, markupFromEnv, parseAvailability, parsePrices, type Result } from "./search";
import { singleDomain } from "./checkout";

/** Production by default. Set NAMESILO_API_URL=https://ote.namesilo.com/api to use NameSilo's test environment. */
const base = () => (process.env.NAMESILO_API_URL || "https://www.namesilo.com/api").replace(/\/+$/, "");

async function call(op: string, params: Record<string, string>, revalidate?: number): Promise<unknown> {
  const key = process.env.NAMESILO_API_KEY;
  if (!key) throw new Error("Domain search isn't set up yet.");
  const qs = new URLSearchParams({ version: "1", type: "json", key, ...params });
  const res = await fetch(`${base()}/${op}?${qs}`, revalidate ? { next: { revalidate } } : { cache: "no-store" });
  if (!res.ok) throw new Error(`Domain provider returned ${res.status}.`);
  return res.json();
}

export const searchConfigured = () => Boolean(process.env.NAMESILO_API_KEY);

/** Searches a name across our TLD list. Returns prices with our markup only. */
export async function searchDomains(query: string): Promise<{ ok: true; results: Result[] } | { ok: false; error: string }> {
  const parsedInput = candidatesFor(query);
  if (!parsedInput.ok) return parsedInput;

  const parsed = parseAvailability(await call("checkRegisterAvailability", { domains: parsedInput.candidates.map((c) => c.domain).join(",") }));

  // The availability reply usually carries prices; fall back to the (cached) price list only if some are missing.
  const needsList = parsed.available.some((a) => a.price === null);
  const prices = needsList ? parsePrices(await call("getPrices", {}, 3600)) : {};

  return { ok: true, results: buildResults(parsedInput.candidates, parsed, prices, markupFromEnv()) };
}

/** Re-checks one domain with the provider and returns our selling price, or null if it can't be sold right now. */
export async function quoteDomain(domain: string): Promise<{ domain: string; price: number } | null> {
  const one = singleDomain(domain);
  if (!one.ok) return null;
  const candidates = [{ domain: one.domain, tld: one.tld }];
  const parsed = parseAvailability(await call("checkRegisterAvailability", { domains: one.domain }));
  const needsList = parsed.available.some((a) => a.price === null);
  const prices = needsList ? parsePrices(await call("getPrices", {}, 3600)) : {};
  const r = buildResults(candidates, parsed, prices, markupFromEnv())[0];
  return r && r.available ? { domain: r.domain, price: r.price } : null;
}
