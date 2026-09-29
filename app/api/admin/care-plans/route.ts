import { NextRequest, NextResponse } from "next/server";
import { hasBearer } from "@/lib/payments/auth";
import { describeCarePlan, getCarePlans } from "@/lib/care-plan/admin";

export const dynamic = "force-dynamic";

/** Admin Care Plan overview. Optional ?q=<business name>. Each plan includes the panel text as `summary`. */
export async function GET(req: NextRequest) {
  if (!hasBearer(req, "ADMIN_API_KEY")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const rows = await getCarePlans(req.nextUrl.searchParams.get("q") ?? undefined);
    return NextResponse.json({ carePlans: rows.map((r) => ({ ...r, summary: describeCarePlan(r) })) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
