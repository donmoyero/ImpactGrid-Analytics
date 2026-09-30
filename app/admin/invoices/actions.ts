"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminDb } from "@/lib/supabase/admin";
import { getPackage } from "@/lib/packages";
import { createInvoice, recordPayment, voidInvoice } from "@/lib/invoice/service";
import { emailInvoice } from "@/lib/invoice/email";

const UUID = /^[0-9a-f-]{36}$/i;
const NUMBER = /^IGA-\d{4}-\d{5}$/;
const str = (f: FormData, k: string) => (typeof f.get(k) === "string" ? (f.get(k) as string).trim() : "");
const gbp = (n: number | string) => `£${Number(n).toFixed(2)}`;

/** Runs an action, then returns to the invoices page with a message. redirect() must sit outside try/catch. */
async function run(fn: () => Promise<string>): Promise<never> {
  let ok = true;
  let msg: string;
  try {
    msg = await fn();
  } catch (e) {
    ok = false;
    msg = e instanceof Error ? e.message : "Something went wrong.";
  }
  revalidatePath("/admin/invoices");
  revalidatePath("/admin");
  redirect(`/admin/invoices?${ok ? "ok" : "err"}=${encodeURIComponent(msg)}`);
}

/** Create the website-build invoice for a project and email it (PDF attached). */
export async function sendBuildInvoiceAction(formData: FormData) {
  await requireAdmin();
  const projectId = str(formData, "projectId");
  await run(async () => {
    if (!UUID.test(projectId)) throw new Error("Invalid project.");
    const { invoice } = await createInvoice({ projectId });
    const to = await emailInvoice(invoice.invoice_number);
    return `Invoice ${invoice.invoice_number} (${gbp(invoice.amount)}) sent to ${to}.`;
  });
}

/** Create the yearly maintenance (Care Plan) invoice for a project and email it. */
export async function sendMaintenanceInvoiceAction(formData: FormData) {
  await requireAdmin();
  const projectId = str(formData, "projectId");
  await run(async () => {
    if (!UUID.test(projectId)) throw new Error("Invalid project.");
    const db = getAdminDb();
    const { data: project } = await db.from("projects").select("package").eq("id", projectId).maybeSingle();
    if (!project) throw new Error("Project not found.");
    const { data: cp } = await db.from("care_plans").select("price").eq("project_id", projectId).maybeSingle();
    const pkg = getPackage(project.package);
    const amount = Number(cp?.price ?? pkg?.carePlanYearly ?? 0);
    if (!(amount > 0)) throw new Error("No Care Plan price found for this project.");
    const { invoice } = await createInvoice({
      projectId,
      amount,
      allowAdditional: true,
      description: `Care Plan — yearly hosting and maintenance${pkg ? ` (${pkg.name} package)` : ""}`,
    });
    const to = await emailInvoice(invoice.invoice_number);
    return `Maintenance invoice ${invoice.invoice_number} (${gbp(invoice.amount)}) sent to ${to}.`;
  });
}

export async function resendInvoiceAction(formData: FormData) {
  await requireAdmin();
  const number = str(formData, "number");
  await run(async () => {
    if (!NUMBER.test(number)) throw new Error("Invalid invoice number.");
    const to = await emailInvoice(number);
    return `${number} sent again to ${to}.`;
  });
}

export async function recordPaymentAction(formData: FormData) {
  await requireAdmin();
  const number = str(formData, "number");
  const amount = Number(str(formData, "amount"));
  await run(async () => {
    if (!NUMBER.test(number)) throw new Error("Invalid invoice number.");
    if (!(amount > 0)) throw new Error("Enter the amount received.");
    const inv = await recordPayment(number, amount);
    return inv.status === "paid"
      ? `${number} is now PAID in full.`
      : `Recorded ${gbp(amount)} on ${number}. ${gbp(inv.amount_due)} still due.`;
  });
}

export async function voidInvoiceAction(formData: FormData) {
  await requireAdmin();
  const number = str(formData, "number");
  await run(async () => {
    if (!NUMBER.test(number)) throw new Error("Invalid invoice number.");
    await voidInvoice(number);
    return `${number} cancelled.`;
  });
}
