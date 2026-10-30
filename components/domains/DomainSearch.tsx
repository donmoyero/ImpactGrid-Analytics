"use client";

import { useState } from "react";
import { Check, Loader2, Search, X } from "lucide-react";

type Result = { domain: string; available: true; price: number; renewal: number | null } | { domain: string; available: false };

const money = (n: number) => `$${n.toFixed(2)}`;

export default function DomainSearch() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [searched, setSearched] = useState("");
  const [buying, setBuying] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch(`/api/domains/search?q=${encodeURIComponent(q)}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong.");
        return setStatus("error");
      }
      setResults(json.results);
      setSearched(q.trim());
      setStatus("done");
    } catch {
      setError("Couldn't reach the search. Please try again.");
      setStatus("error");
    }
  }

  async function buy(domain: string) {
    setBuying(domain);
    setError("");
    try {
      const res = await fetch("/api/domains/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ domain }) });
      const json = await res.json();
      if (!res.ok || !json.url) {
        setError(json.error ?? "Couldn't start checkout. Please try again.");
        return setBuying("");
      }
      window.location.href = json.url;
    } catch {
      setError("Couldn't start checkout. Please try again.");
      setBuying("");
    }
  }

  const exact = results[0];
  const rest = results.slice(1);

  return (
    <div>
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row" role="search">
        <label htmlFor="domain-q" className="sr-only">Search for a domain</label>
        <input
          id="domain-q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="input flex-1"
          placeholder="Find your domain, e.g. mybusiness or mybusiness.com"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={80}
        />
        <button type="submit" disabled={status === "loading"} className="btn-premium justify-center">
          {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Search
        </button>
      </form>

      {(status === "error" || error) && <p className="mt-5 text-sm text-signal" role="alert">{error}</p>}

      {status === "done" && (
        <div className="mt-8" aria-live="polite">
          <p className="label-tag text-slateLight">Results for “{searched}”</p>
          <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-ink2">
            {[exact, ...rest].filter(Boolean).map((r) => (
              <li key={r.domain} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <span className="flex items-center gap-3">
                  {r.available ? <Check className="h-4 w-4 text-green-600" aria-label="Available" /> : <X className="h-4 w-4 text-slateLight" aria-label="Taken" />}
                  <span className={r.available ? "font-display text-lg" : "font-display text-lg text-slateLight line-through"}>{r.domain}</span>
                </span>
                {r.available ? (
                  <span className="flex items-center gap-4">
                    <span className="text-right">
                      <span className="block font-display text-lg">{money(r.price)}<span className="text-sm text-slate"> /first year</span></span>
                      {r.renewal !== null && <span className="block text-xs text-slateLight">then {money(r.renewal)}/year</span>}
                    </span>
                    <button type="button" onClick={() => buy(r.domain)} disabled={buying !== ""} className="btn-premium justify-center" aria-label={`Buy ${r.domain}`}>
                      {buying === r.domain ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Buy
                    </button>
                  </span>
                ) : (
                  <span className="text-sm text-slateLight">Not available</span>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slateLight">Prices in US dollars. Renewal prices can differ from the first-year price.</p>
        </div>
      )}
    </div>
  );
}
