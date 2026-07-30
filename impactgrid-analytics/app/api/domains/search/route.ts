import { NextRequest, NextResponse } from "next/server";
import { DomainSearchResult } from "@/types";

/**
 * Stub endpoint. Swap the body of this handler for a real call to
 * OpenSRS / ResellerClub / OpenProvider (see DOMAIN_REGISTRAR_API_URL
 * in .env.example) when you're ready to automate registration.
 */
export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim().toLowerCase();

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const base = query.replace(/[^a-z0-9-]/g, "");
  const tlds = [".co.uk", ".com", ".uk", ".shop"];

  const results: DomainSearchResult[] = tlds.map((tld, i) => ({
    domain: `${base}${tld}`,
    available: i !== 1, // demo data — replace with real registrar lookup
    price: tld === ".com" ? 12.99 : 9.99,
    currency: "GBP",
  }));

  return NextResponse.json({ results });
}
