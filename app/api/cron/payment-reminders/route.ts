import { NextRequest, NextResponse } from "next/server";
import { hasBearer } from "@/lib/payments/auth";
import { runPaymentCycle } from "@/lib/payments/reminders";
import { runCarePlanCycle } from "@/lib/care-plan/cycle";

export const dynamic = "force-dynamic";

/**
 * Daily job (see vercel.json). Runs both chains independently, so one failing never blocks the other:
 *  - invoices:  reminder 1, reminder 2, final reminder, overdue
 *  - care plans: expiry, then grace period -> reminder -> final reminder -> maintenance mode
 * Vercel sends CRON_SECRET automatically.
 */
export async function GET(req: NextRequest) {
  if (!hasBearer(req, "CRON_SECRET")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [invoices, carePlans] = await Promise.allSettled([runPaymentCycle(), runCarePlanCycle()]);
  const fail = (r: PromiseRejectedResult) => (console.error("cycle failed:", r.reason), { error: "cycle failed" });
  const invoicesOut = invoices.status === "fulfilled" ? invoices.value : fail(invoices);
  const carePlansOut = carePlans.status === "fulfilled" ? carePlans.value : fail(carePlans);
  const ok = invoices.status === "fulfilled" && carePlans.status === "fulfilled" &&
    invoices.value.errors.length === 0 && carePlans.value.errors.length === 0;
  return NextResponse.json({ ok, invoices: invoicesOut, carePlans: carePlansOut }, { status: ok ? 200 : 207 });
}
