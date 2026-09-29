import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminDb } from "../supabase/admin";
import { adminEmail, sendEmail } from "../email";
import { nextAction, daysPastDue, RULES, type ReminderType } from "./schedule";

type OpenInvoice = {
  id: string;
  invoice_number: string;
  status: string;
  reminder_stage: number;
  due_at: string | null;
  amount: number;
  amount_paid: number;
  amount_due: number;
  project_id: string | null;
  client: { business_name: string; contact_email: string } | null;
};

export type CycleSummary = {
  reminded: string[];
  overdue: string[];
  failed: string[];
  errors: string[];
};

const gbp = (n: number | string) => `£${Number(n).toFixed(2)}`;
const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "");
const STALE_PENDING_MS = 60 * 60 * 1000;

function clientEmailFor(type: ReminderType, inv: OpenInvoice) {
  const name = inv.client?.business_name ?? "there";
  const balance = `Invoice ${inv.invoice_number}: total ${gbp(inv.amount)}, received ${gbp(inv.amount_paid)}, outstanding ${gbp(inv.amount_due)} (was due ${day(inv.due_at)}).`;
  const bank = "Our bank details are on the invoice PDF. Please use the invoice number as your payment reference.";
  const sign = "Thank you,\nImpactGrid Analytics\nhello@impactgridanalytics.com";
  switch (type) {
    case "reminder_1":
      return {
        subject: `Payment reminder: invoice ${inv.invoice_number}`,
        text: `Hi ${name},\n\nA friendly reminder that this invoice is now past its due date.\n\n${balance}\n\n${bank} If you've already paid, thank you, and please ignore this message.\n\n${sign}`,
      };
    case "reminder_2":
      return {
        subject: `Second reminder: invoice ${inv.invoice_number} is unpaid`,
        text: `Hi ${name},\n\nWe haven't yet received the outstanding balance on your invoice.\n\n${balance}\n\n${bank} If there's a problem, just reply to this email and we'll help.\n\n${sign}`,
      };
    case "final_reminder":
      return {
        subject: `FINAL reminder: invoice ${inv.invoice_number}`,
        text: `Hi ${name},\n\nThis is our final reminder. ${balance}\n\nIf payment isn't received within ${RULES.overdue - RULES.final} days the invoice will be marked overdue, and your website may be suspended until the balance is cleared.\n\n${bank} If you need to talk about payment, please reply now.\n\n${sign}`,
      };
  }
}

/** Reserve one reminder slot per invoice+type. Returns the row id if we own the send, else null. */
export async function claim(
  db: SupabaseClient,
  target: { column: "invoice_id" | "care_plan_id"; id: string },
  type: string
): Promise<string | null> {
  const nowIso = new Date().toISOString();
  const ins = await db
    .from("payment_reminders")
    .insert({ [target.column]: target.id, reminder_type: type, status: "pending", attempted_at: nowIso })
    .select("id")
    .maybeSingle();
  if (!ins.error && ins.data) return ins.data.id;
  if (ins.error && ins.error.code !== "23505") throw new Error(ins.error.message);

  // Already exists: retry only if the earlier attempt failed or is a stale, crashed 'pending'.
  const stale = new Date(Date.now() - STALE_PENDING_MS).toISOString();
  const retry = await db
    .from("payment_reminders")
    .update({ status: "pending", attempted_at: nowIso })
    .eq(target.column, target.id)
    .eq("reminder_type", type)
    .or(`status.eq.failed,and(status.eq.pending,attempted_at.lt.${stale})`)
    .select("id")
    .maybeSingle();
  if (retry.error) throw new Error(retry.error.message);
  return retry.data?.id ?? null;
}

/** One pass of the payment chain. Safe to run repeatedly (daily cron). */
export async function runPaymentCycle(
  opts: { dryRun?: boolean; now?: Date } = {},
  db: SupabaseClient = getAdminDb()
): Promise<CycleSummary> {
  const now = opts.now ?? new Date();
  const summary: CycleSummary = { reminded: [], overdue: [], failed: [], errors: [] };

  const { data, error } = await db
    .from("invoices")
    .select("id, invoice_number, status, reminder_stage, due_at, amount, amount_paid, amount_due, project_id, client:clients(business_name, contact_email)")
    .in("status", ["issued", "partially_paid"])
    .not("due_at", "is", null)
    .lte("due_at", now.toISOString());
  if (error) throw new Error(error.message);

  for (const inv of (data ?? []) as unknown as OpenInvoice[]) {
    try {
      const action = nextAction(inv, now);
      if (action.kind === "none") continue;

      if (action.kind === "remind") {
        if (opts.dryRun) {
          summary.reminded.push(`${inv.invoice_number}: would send ${action.type}`);
          continue;
        }
        if (!inv.client?.contact_email) throw new Error(`${inv.invoice_number}: client has no email`);

        const claimId = await claim(db, { column: "invoice_id", id: inv.id }, action.type);
        if (!claimId) continue; // someone else sent it, or it's already done

        // Re-read so a payment that landed a moment ago doesn't trigger a reminder.
        const { data: fresh } = await db.from("invoices").select("status, amount_due").eq("id", inv.id).single();
        if (!fresh || !["issued", "partially_paid"].includes(fresh.status)) {
          await db.from("payment_reminders").delete().eq("id", claimId);
          continue;
        }

        const mail = clientEmailFor(action.type, { ...inv, amount_due: Number(fresh.amount_due) });
        const ok = await sendEmail({ to: inv.client.contact_email, replyTo: adminEmail(), ...mail });
        await db
          .from("payment_reminders")
          .update({ status: ok ? "sent" : "failed", sent_at: ok ? new Date().toISOString() : null })
          .eq("id", claimId);
        if (!ok) {
          summary.failed.push(`${inv.invoice_number}: ${action.type} email failed`);
          continue;
        }
        await db.from("invoices").update({ reminder_stage: action.stage }).eq("id", inv.id).lt("reminder_stage", action.stage);
        summary.reminded.push(`${inv.invoice_number}: ${action.type} sent`);
        continue;
      }

      // mark_overdue: only reachable once reminder_stage = 3 (final reminder sent).
      if (opts.dryRun) {
        summary.overdue.push(`${inv.invoice_number}: would mark overdue`);
        continue;
      }
      const { data: flipped, error: upErr } = await db
        .from("invoices")
        .update({ status: "overdue" })
        .eq("id", inv.id)
        .eq("reminder_stage", 3)
        .in("status", ["issued", "partially_paid"])
        .select("id")
        .maybeSingle();
      if (upErr) throw new Error(upErr.message);
      if (!flipped) continue;
      summary.overdue.push(`${inv.invoice_number}: marked overdue`);

      const name = inv.client?.business_name ?? "Client";
      await sendEmail({
        to: adminEmail(),
        subject: `ACTION: ${name} payment overdue: suspend website?`,
        text:
          `${name} — invoice ${inv.invoice_number} is now OVERDUE (${daysPastDue(inv.due_at!, now)} days past due).\n` +
          `Total ${gbp(inv.amount)}, received ${gbp(inv.amount_paid)}, outstanding ${gbp(inv.amount_due)}.\n\n` +
          `Admin action available: SUSPEND WEBSITE\n` +
          `  npx tsx scripts/website.ts suspend "${name}"\n\n` +
          `The site is restored automatically when the invoice is paid in full.`,
      });
      if (inv.client?.contact_email) {
        await sendEmail({
          to: inv.client.contact_email,
          replyTo: adminEmail(),
          subject: `Payment overdue: invoice ${inv.invoice_number}`,
          text:
            `Hi ${name},\n\nInvoice ${inv.invoice_number} is now overdue. Outstanding: ${gbp(inv.amount_due)}.\n\n` +
            `Your website may be suspended until the balance is cleared. It will be restored as soon as payment is received in full. ` +
            `Please reply to this email if you'd like to discuss it.\n\nImpactGrid Analytics`,
        });
      }
    } catch (e) {
      summary.errors.push(`${inv.invoice_number}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return summary;
}
