import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminDb } from "../supabase/admin";
import { maintenanceDate } from "./schedule";

export type CarePlanRow = {
  care_plan_id: string;
  project_id: string;
  business_name: string;
  status: string;
  price: number | null;
  renewal_date: string | null;
  grace_period_ends_at: string | null;
  days_past_due: number | null;
  website_status: string | null;
  reminders_sent: string | null;
};

const longDate = (d: string | Date) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
const priceLabel = (n: number | null) => (n == null ? "" : `£${Number.isInteger(Number(n)) ? Number(n) : Number(n).toFixed(2)}/year`);

const LABEL: Record<string, string> = {
  trialing: "Trialing (first year free)",
  active: "Active",
  past_due: "PAST DUE",
  cancelled: "Cancelled",
  expired: "Expired",
  suspended: "Suspended",
};

/** The admin panel text, e.g.  Care Plan / Active / Renews: 29 September 2027 / £200/year */
export function describeCarePlan(r: CarePlanRow): string[] {
  const lines = ["Care Plan", LABEL[r.status] ?? r.status];
  if (r.renewal_date) lines.push(`${r.status === "cancelled" || r.status === "expired" ? "Ends" : "Renews"}: ${longDate(r.renewal_date)}`);
  if (r.price != null) lines.push(priceLabel(r.price));

  if (r.status === "past_due" && r.grace_period_ends_at) {
    const sent = new Set((r.reminders_sent ?? "").split(",").filter(Boolean));
    const graceEnd = new Date(r.grace_period_ends_at);
    lines.push(
      `Grace period: ${graceEnd.getTime() > Date.now() ? `until ${longDate(graceEnd)}` : "ended"}`,
      `Reminder: ${sent.has("care_plan_reminder") ? "sent" : "due " + longDate(graceEnd)}`,
      `Final reminder: ${sent.has("care_plan_final") ? "sent" : "due " + longDate(new Date(graceEnd.getTime() + 7 * 86_400_000))}`,
      `Website maintenance mode: ${r.website_status === "maintenance" ? "ON" : "on " + longDate(maintenanceDate(graceEnd))}`
    );
  } else if (r.website_status === "maintenance") {
    lines.push("Website maintenance mode: ON");
  }
  return lines;
}

export async function getCarePlans(ref?: string, db: SupabaseClient = getAdminDb()): Promise<CarePlanRow[]> {
  let q = db.from("care_plan_admin").select("*");
  if (ref) q = q.ilike("business_name", `%${ref}%`);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as CarePlanRow[];
}
