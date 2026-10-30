import { NextRequest, NextResponse } from "next/server";
import { searchConfigured, searchDomains } from "@/lib/domains/namesilo";

export const dynamic = "force-dynamic";

// Small per-instance limiter so one visitor can't burn through our provider quota. (Serverless instances each keep their own count.)
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > 20;
}

export async function GET(req: NextRequest) {
  if (!searchConfigured()) return NextResponse.json({ error: "Domain search isn't available yet. Please check back soon." }, { status: 503 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (limited(ip)) return NextResponse.json({ error: "Too many searches. Please wait a minute and try again." }, { status: 429 });

  try {
    const out = await searchDomains(req.nextUrl.searchParams.get("q") ?? "");
    if (!out.ok) return NextResponse.json({ error: out.error }, { status: 400 });
    return NextResponse.json({ results: out.results });
  } catch (e) {
    console.error("domain search failed:", e);
    return NextResponse.json({ error: "Search failed. Please try again in a moment." }, { status: 502 });
  }
}
