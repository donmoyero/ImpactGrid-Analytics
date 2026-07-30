"use client";

import { useState } from "react";
import { Search, Check, X, Loader2 } from "lucide-react";
import { DomainSearchResult } from "@/types";
import { cn, formatGBP } from "@/lib/utils";
import Link from "next/link";

export default function DomainSearchBox({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DomainSearchResult[] | null>(null);

  const light = variant === "light";

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResults(null);
    try {
      const res = await fetch(`/api/domains/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={cn(
        "crosshair w-full rounded-2xl border p-1.5",
        light ? "crosshair-light border-line2 bg-white/60" : "border-line bg-ink2"
      )}
    >
      <form onSubmit={handleSearch} className="flex flex-col gap-1.5 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-xl px-4 py-3">
          <Search className={cn("h-4 w-4 shrink-0", light ? "text-slateLight" : "text-slate")} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="yourbusiness"
            className={cn(
              "w-full bg-transparent font-mono text-sm outline-none placeholder:text-slate/60",
              light ? "text-ink" : "text-paper"
            )}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl bg-signal px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-blueprint2 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Search domains
        </button>
      </form>

      {results && (
        <div className="mt-1.5 space-y-1 p-1.5">
          {results.map((r) => (
            <div
              key={r.domain}
              className={cn(
                "flex items-center justify-between rounded-xl px-4 py-3 font-mono text-sm",
                light ? "bg-white" : "bg-ink"
              )}
            >
              <div className="flex items-center gap-3">
                {r.available ? (
                  <Check className="h-4 w-4 text-blueprint2" />
                ) : (
                  <X className="h-4 w-4 text-slate" />
                )}
                <span className={light ? "text-ink" : "text-paper"}>{r.domain}</span>
              </div>
              {r.available ? (
                <Link
                  href={`/book-project?domain=${encodeURIComponent(r.domain)}`}
                  className="flex items-center gap-3 text-slate hover:text-signal"
                >
                  {formatGBP(r.price)}/yr <span className="label-tag">Add to order →</span>
                </Link>
              ) : (
                <span className="label-tag text-slate">Taken</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
