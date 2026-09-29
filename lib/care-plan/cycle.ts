import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminDb } from "../supabase/admin";
import { adminEmail, sendEmail } from "../email";
import { claim } from "../payments/reminders";
import { maintenanceDate, nextCareAction, type CareReminderType } from "./schedule";

export type CareCycleSummary = { reminded: string[]; maintenance: string[]; expired: string[]; failed: string[]; errors: string[] };

type Row = {
  id: string;
  project_id: string;
  plan: string;
  price: number | null;
  status: string;
  renewal_at: string | null;
  grace_period_ends_at: string | null;
  project: { business_name: string; client: { business_name: string; contact_email: string } | null } | null;
};

const gbp = (n: number | null) => (n == null ? "" : `£${Number.isInteger(Number(n)) ? Number(n) : Number(n).toFixed(2)}/year`);
const longDate = (d: Date | string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
const SIGN = "Thank you,\nImpactGrid Analytics\nhello@impactgridanalytics.com";

function reminderEmail(type: CareReminderType, row: Row) {
  const name = row.project?.client?.business_name ?? row.project?.business_name ?? "there";
  const when = row.grace_period_ends_at ? longDate(maintenanceDate(row.grace_period_ends_at)) : "soon";
  const what = `We couldn't collect the yearly Care Plan payment${row.price ? ` (${gbp(row.price)})` : ""} for ${row.project?.business_name ?? "your website"}. The Care Plan covers hosting, SSL, backups and updates.`;
  if (type === "care_plan_reminder") {
    return {
      subject: "Your Care Plan payment didn't go through",
      text: `Hi ${name},\n\n${what}\n\nPlease reply to this email and we'll help you update your card. If we still can't collect payment, your website will be put into maintenance mode on ${when}.\n\n${SIGN}`,
    };
  }
  return {
    subject: "FINAL notice: Care Plan payment outstanding",
    text: `Hi ${name},\n\nThis is our final notice. ${what}\n\nUnless payment is resolved, your website will go into maintenance mode on ${when} and visitors will see a "temporarily unavailable" page. It comes back automatically as soon as the payment succeeds.\n\nPlease reply to this email now if you need help.\n\n${SIGN}`,
  };
}

/** One pass of the Care Plan chain. Safe to run repeatedly (daily cron). */
export async function runCarePlanCycle(
  opts: { dryRun?: boolean; now?: Date } = {},
  db: SupabaseClient = getAdminDb()
): Promise<CareCycleSummary> {
  const now = opts.now ?? new Date();
  const s: CareCycleSummary = { reminded: [], maintenance: [], expired: [], failed: [], errors: [] };
  const select =
    "id, project_id, plan, price, status, renewal_at, grace_period_ends_at, project:projects(business_name, client:clients(business_name, contact_email))";

  // 1. Expiry: a cancelled plan whose paid period has ended becomes expired.
  {
    const { data, error } = await db.from("care_plans").select(select).eq("status", "cancelled").not("renewal_at", "is", null).lte("renewal_at", now.toISOString());
    if (error) throw new Error(error.message);
    for (const row of (data ?? []) as unknown as Row[]) {
      const label = row.project?.business_name ?? row.id;
      try {
        if (opts.dryRun) { s.expired.push(`${label}: would mark expired`); continue; }
        const { data: done, error: e } = await db.from("care_plans").update({ status: "expired" }).eq("id", row.id).eq("status", "cancelled").select("id").maybeSingle();
        if (e) throw new Error(e.message);
        if (!done) continue;
        s.expired.push(`${label}: Care Plan expired`);
        await sendEmail({
          to: adminEmail(),
          subject: `Care Plan expired: ${label}`,
          text: `${label}'s cancelled Care Plan ran out on ${longDate(row.renewal_at!)}. Their website has NOT been changed automatically.\n\nDecide whether to keep hosting it, or put it in maintenance:\n  npx tsx scripts/website.ts maintenance "${label}" on`,
        });
      } catch (e) {
        s.errors.push(`${label}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  // 2. Past-due chain.
  const { data, error } = await db.from("care_plans").select(select).eq("status", "past_due").not("grace_period_ends_at", "is", null);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as unknown as Row[];
  if (!rows.length) return s;

  const { data: sentRows, error: sErr } = await db
    .from("payment_reminders")
    .select("care_plan_id, reminder_type")
    .in("care_plan_id", rows.map((r) => r.id))
    .eq("status", "sent");
  if (sErr) throw new Error(sErr.message);

  for (const row of rows) {
    const label = row.project?.business_name ?? row.id;
    try {
      const sent = new Set((sentRows ?? []).filter((r) => r.care_plan_id === row.id).map((r) => r.reminder_type as string));
      const action = nextCareAction(row, sent, now);
      if (action.kind === "none") continue;

      if (action.kind === "remind") {
        if (opts.dryRun) { s.reminded.push(`${label}: would send ${action.type}`); continue; }
        const to = row.project?.client?.contact_email;
        if (!to) throw new Error("client has no email");

        const claimId = await claim(db, { column: "care_plan_id", id: row.id }, action.type);
        if (!claimId) continue;

        // The card may have just been fixed: re-read before emailing.
        const { data: fresh } = await db.from("care_plans").select("status").eq("id", row.id).single();
        if (fresh?.status !== "past_due") {
          await db.from("payment_reminders").delete().eq("id", claimId);
          continue;
        }
        const ok = await sendEmail({ to, replyTo: adminEmail(), ...reminderEmail(action.type, row) });
        await db.from("payment_reminders").update({ status: ok ? "sent" : "failed", sent_at: ok ? new Date().toISOString() : null }).eq("id", claimId);
        (ok ? s.reminded : s.failed).push(`${label}: ${action.type}${ok ? " sent" : " email failed"}`);
        continue;
      }

      // maintenance: only reachable once the final reminder has been sent.
      if (opts.dryRun) { s.maintenance.push(`${label}: would enter maintenance mode`); continue; }
      const { data: site } = await db.from("websites").select("status").eq("project_id", row.project_id).maybeSingle();
      if (site && ["maintenance", "suspended"].includes(site.status)) continue; // already offline: nothing to do, no repeat emails
      const { data: changed, error: rpcErr } = await db.rpc("put_website_in_maintenance", {
        p_project_id: row.project_id,
        p_reason: "Care Plan payment overdue",
        p_care_plan_id: row.id,
      });
      if (rpcErr) throw new Error(rpcErr.message);
      if (changed !== true) { s.errors.push(`${label}: website isn't live, so maintenance mode was not applied`); continue; }
      s.maintenance.push(`${label}: website in maintenance mode`);

      await sendEmail({
        to: adminEmail(),
        subject: `${label}: website put in maintenance mode (Care Plan unpaid)`,
        text: `${label}'s Care Plan is still unpaid after the grace period and both reminders, so their website is now in maintenance mode.\n\nIt returns automatically when the payment succeeds, or manually with:\n  npx tsx scripts/website.ts maintenance "${label}" off`,
      });
      const to = row.project?.client?.contact_email;
      if (to) {
        await sendEmail({
          to,
          replyTo: adminEmail(),
          subject: "Your website is now in maintenance mode",
          text: `Hi ${row.project?.client?.business_name ?? "there"},\n\nBecause your Care Plan payment is still outstanding, your website is in maintenance mode and visitors currently see a "temporarily unavailable" page. It will come back automatically as soon as payment succeeds. Reply to this email and we'll help you sort it out.\n\n${SIGN}`,
        });
      }
    } catch (e) {
      s.errors.push(`${label}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return s;
}
