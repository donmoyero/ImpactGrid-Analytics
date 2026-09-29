import { NextRequest, NextResponse } from "next/server";
import { hasBearer } from "@/lib/payments/auth";
import { siteStatusForHost } from "@/lib/payments/suspension";

export const dynamic = "force-dynamic";

/**
 * For client sites hosted elsewhere: GET /api/site-status?host=example.com
 * with `Authorization: Bearer $SITE_STATUS_TOKEN`. Returns { host, status, suspended }.
 */
export async function GET(req: NextRequest) {
  if (!hasBearer(req, "SITE_STATUS_TOKEN")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const host = (req.nextUrl.searchParams.get("host") ?? "").trim().toLowerCase();
  if (!host || host.length > 253) return NextResponse.json({ error: "host is required." }, { status: 400 });
  try {
    const status = await siteStatusForHost(host);
    return NextResponse.json(
      { host, status, suspended: status === "suspended" },
      { headers: { "Cache-Control": "private, max-age=30" } }
    );
  } catch (e) {
    console.error("site-status lookup failed:", e);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
