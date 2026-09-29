import { NextRequest, NextResponse } from "next/server";
import { hasBearer } from "@/lib/payments/auth";
import { runPaymentCycle } from "@/lib/payments/reminders";

export const dynamic = "force-dynamic";

/** Daily job (see vercel.json): sends reminders 1, 2, final, then marks invoices overdue. Vercel sends CRON_SECRET automatically. */
export async function GET(req: NextRequest) {
  if (!hasBearer(req, "CRON_SECRET")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const summary = await runPaymentCycle();
    return NextResponse.json({ ok: summary.errors.length === 0, ...summary });
  } catch (e) {
    console.error("payment cycle failed:", e);
    return NextResponse.json({ error: "Payment cycle failed" }, { status: 500 });
  }
}
