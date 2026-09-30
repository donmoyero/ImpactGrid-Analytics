import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DOMAIN = /^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/;

/**
 * Is this domain already registered? Uses public RDAP (no key needed): 404 = not registered, 200 = registered.
 * Anything else (timeouts, unsupported extension) comes back as "unknown". Admin confirms availability before registering.
 * GET /api/domain-check?domain=yourbusiness.co.uk  ->  { status: "available" | "taken" | "unknown" }
 */
export async function GET(req: NextRequest) {
  const domain = (req.nextUrl.searchParams.get("domain") ?? "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!DOMAIN.test(domain)) return NextResponse.json({ status: "invalid" });

  try {
    const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
      redirect: "follow",
      cache: "no-store",
      headers: { Accept: "application/rdap+json" },
      signal: AbortSignal.timeout(5000),
    });
    if (res.status === 404) return NextResponse.json({ status: "available" });
    if (res.ok) return NextResponse.json({ status: "taken" });
    return NextResponse.json({ status: "unknown" });
  } catch {
    return NextResponse.json({ status: "unknown" });
  }
}
