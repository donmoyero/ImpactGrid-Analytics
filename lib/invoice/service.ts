import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminDb } from "../supabase/admin";
import { addons, getPackage } from "../packages";
import type { Invoice, InvoiceLine } from "../../types";
import { generateInvoicePdf } from "./pdf";
import { loadInvoiceSettings } from "./settings";

export const INVOICE_BUCKET = "invoices";

/** Yearly maintenance invoices start their first line with this, which is how the system tells them from build invoices. */
export const CARE_PLAN_LINE_PREFIX = "Care Plan";
export const isCarePlanInvoice = (inv: { line_items?: InvoiceLine[] | null }) =>
  !!inv.line_items?.[0]?.description?.startsWith(CARE_PLAN_LINE_PREFIX);

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Package + add-ons as line items, but only if they add up to the invoice amount; otherwise one plain line. */
export function buildLineItems(packageId: string, addonIds: string[], total: number, businessName: string): InvoiceLine[] {
  const pkg = getPackage(packageId);
  const fallback: InvoiceLine[] = [
    { description: `Website build — ${businessName}${pkg ? ` (${pkg.name} package)` : ""}`, amount: round2(total) },
  ];
  if (!pkg) return fallback;

  const lines: InvoiceLine[] = [{ description: `${pkg.name} package — website build`, amount: pkg.price }];
  for (const id of addonIds) {
    const a = addons.find((x) => x.id === id);
    if (!a) return fallback;
    lines.push({ description: a.name, amount: a.price });
  }
  const sum = round2(lines.reduce((s, l) => s + l.amount, 0));
  return sum === round2(total) ? lines : fallback;
}

async function getInvoice(db: SupabaseClient, ref: string): Promise<Invoice> {
  const isUuid = /^[0-9a-f-]{36}$/i.test(ref);
  const { data, error } = await db.from("invoices").select("*").eq(isUuid ? "id" : "invoice_number", ref).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`Invoice ${ref} not found.`);
  return data as Invoice;
}

/** Creates the invoice for a project's build fee and issues it (assigns number, dates, PDF). */
export async function createInvoice(
  opts: { projectId: string; amount?: number; allowAdditional?: boolean; description?: string },
  db: SupabaseClient = getAdminDb()
): Promise<{ invoice: Invoice; pdf: Uint8Array }> {
  // Fail fast: don't create or number an invoice we can't render (missing/placeholder bank details).
  await loadInvoiceSettings(db);

  const { data: project, error: pErr } = await db
    .from("projects")
    .select("id, client_id, business_name, package")
    .eq("id", opts.projectId)
    .maybeSingle();
  if (pErr) throw new Error(pErr.message);
  if (!project) throw new Error(`Project ${opts.projectId} not found.`);
  if (!project.client_id) throw new Error("Project has no client.");

  const { data: existing, error: eErr } = await db
    .from("invoices")
    .select("invoice_number, status")
    .eq("project_id", project.id)
    .neq("status", "void");
  if (eErr) throw new Error(eErr.message);
  if (existing?.length && !opts.allowAdditional) {
    throw new Error(
      `${project.business_name} already has invoice ${existing[0].invoice_number} (${existing[0].status}). ` +
        `Pass allowAdditional to raise another.`
    );
  }

  const { data: order } = await db
    .from("orders")
    .select("total, addon_ids")
    .eq("project_id", project.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const amount = opts.amount ?? (order ? Number(order.total) : 0);
  if (!(amount > 0)) throw new Error("No amount to invoice: the project has no pending order. Pass an amount.");

  const lineItems = opts.description
    ? [{ description: opts.description, amount: round2(amount) }]
    : buildLineItems(project.package, opts.amount === undefined && order ? order.addon_ids ?? [] : [], amount, project.business_name);

  const { data: draft, error: iErr } = await db
    .from("invoices")
    .insert({
      client_id: project.client_id,
      project_id: project.id,
      amount: round2(amount),
      line_items: lineItems,
      status: "draft",
    })
    .select()
    .single();
  if (iErr) throw new Error(`Couldn't create invoice: ${iErr.message}`);

  return issueInvoice(draft.id, db);
}

/** draft -> issued (idempotent for already-issued invoices), then (re)generates and stores the PDF. */
export async function issueInvoice(
  ref: string,
  db: SupabaseClient = getAdminDb()
): Promise<{ invoice: Invoice; pdf: Uint8Array }> {
  const inv = await getInvoice(db, ref);
  if (inv.status === "draft") {
    await loadInvoiceSettings(db);
    const { error } = await db.from("invoices").update({ status: "issued" }).eq("id", inv.id).eq("status", "draft");
    if (error) throw new Error(`Couldn't issue invoice: ${error.message}`);
  }
  return storeInvoicePdf(inv.id, db);
}

/** Renders the PDF from the current invoice row and uploads it (overwriting any earlier version). */
export async function storeInvoicePdf(
  ref: string,
  db: SupabaseClient = getAdminDb()
): Promise<{ invoice: Invoice; pdf: Uint8Array }> {
  const inv = await getInvoice(db, ref);
  if (inv.status === "draft") throw new Error("Draft invoices have no PDF. Issue it first.");

  const [{ data: client, error: cErr }, { data: project }, settings] = await Promise.all([
    db.from("clients").select("business_name, contact_email, contact_phone, billing_address").eq("id", inv.client_id).single(),
    inv.project_id
      ? db.from("projects").select("business_name, package").eq("id", inv.project_id).maybeSingle()
      : Promise.resolve({ data: null }),
    loadInvoiceSettings(db),
  ]);
  if (cErr || !client) throw new Error(`Couldn't load client: ${cErr?.message ?? "not found"}`);

  const pdf = await generateInvoicePdf({
    invoice: inv,
    client,
    projectName: project?.business_name ?? client.business_name,
    packageName: project ? getPackage(project.package)?.name ?? null : null,
    bank: settings.bank,
    business: settings.business,
  });

  const year = new Date(inv.issued_at ?? inv.created_at).getUTCFullYear();
  const path = `${year}/${inv.invoice_number}.pdf`;
  const { error: uErr } = await db.storage.from(INVOICE_BUCKET).upload(path, pdf, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (uErr) throw new Error(`Couldn't upload PDF: ${uErr.message}`);

  const { data: updated, error: sErr } = await db
    .from("invoices")
    .update({ pdf_url: path })
    .eq("id", inv.id)
    .select()
    .single();
  if (sErr) throw new Error(sErr.message);
  return { invoice: updated as Invoice, pdf };
}

/**
 * Records a bank-transfer payment against an invoice. The database moves the status
 * (issued -> partially_paid -> paid) and rejects overpayment. When the invoice is fully paid the
 * project's build fee and pending order are marked paid too.
 */
export async function recordPayment(
  ref: string,
  amount: number,
  db: SupabaseClient = getAdminDb()
): Promise<Invoice> {
  if (!(amount > 0)) throw new Error("Payment amount must be greater than zero.");
  const inv = await getInvoice(db, ref);
  if (!["issued", "partially_paid", "overdue"].includes(inv.status)) {
    throw new Error(`Invoice ${inv.invoice_number} is ${inv.status}; it can't take a payment.`);
  }
  if (round2(amount) > round2(Number(inv.amount_due))) {
    throw new Error(`£${amount} is more than the £${inv.amount_due} still due on ${inv.invoice_number}.`);
  }

  // Compare-and-set on amount_paid so two simultaneous payments can't overwrite each other.
  const { data: updated, error } = await db
    .from("invoices")
    .update({ amount_paid: round2(Number(inv.amount_paid) + amount) })
    .eq("id", inv.id)
    .eq("amount_paid", inv.amount_paid)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!updated) throw new Error("The invoice changed while recording this payment. Try again.");

  const { error: payErr } = await db.from("payments").insert({
    client_id: inv.client_id,
    project_id: inv.project_id,
    invoice_id: inv.id,
    amount: round2(amount),
    currency: inv.currency,
    status: "paid",
    method: "bank_transfer",
  });
  if (payErr) console.error("Payment recorded on invoice but payments row failed:", payErr.message);

  if (updated.status === "paid" && inv.project_id) {
    if (isCarePlanInvoice(inv)) {
      await renewCarePlan(inv.project_id, db); // yearly maintenance paid: another year
    } else {
      await db.from("projects").update({ payment_status: "paid" }).eq("id", inv.project_id);
      await db.from("orders").update({ status: "paid" }).eq("project_id", inv.project_id).eq("status", "pending");
    }
  }

  // Keep the stored PDF showing the current balance. Non-fatal.
  try {
    const { invoice } = await storeInvoicePdf(inv.id, db);
    return invoice;
  } catch (e) {
    console.error("Payment saved but PDF refresh failed:", e);
    return updated as Invoice;
  }
}

/** A paid maintenance invoice renews the Care Plan for another year (from the current renewal date, or today if it has lapsed). */
async function renewCarePlan(projectId: string, db: SupabaseClient) {
  const { data: cp } = await db.from("care_plans").select("id, renewal_at").eq("project_id", projectId).maybeSingle();
  if (!cp) return;
  const base = cp.renewal_at && new Date(cp.renewal_at).getTime() > Date.now() ? new Date(cp.renewal_at) : new Date();
  const next = new Date(base.getTime() + 365 * 86_400_000).toISOString();
  const { error } = await db.from("care_plans").update({ status: "active", renewal_at: next, grace_period_ends_at: null }).eq("id", cp.id);
  if (error) console.error("Invoice paid but Care Plan renewal failed:", error.message);
}

export async function voidInvoice(ref: string, db: SupabaseClient = getAdminDb()): Promise<Invoice> {
  const inv = await getInvoice(db, ref);
  const { data, error } = await db.from("invoices").update({ status: "void" }).eq("id", inv.id).select().single();
  if (error) throw new Error(error.message);
  try {
    if (inv.status !== "draft") return (await storeInvoicePdf(inv.id, db)).invoice;
  } catch (e) {
    console.error("Invoice voided but PDF refresh failed:", e);
  }
  return data as Invoice;
}

export async function downloadInvoicePdf(ref: string, db: SupabaseClient = getAdminDb()): Promise<Uint8Array> {
  const inv = await getInvoice(db, ref);
  if (!inv.pdf_url) throw new Error(`Invoice ${inv.invoice_number} has no PDF yet.`);
  const { data, error } = await db.storage.from(INVOICE_BUCKET).download(inv.pdf_url);
  if (error || !data) throw new Error(`Couldn't download PDF: ${error?.message ?? "empty"}`);
  return new Uint8Array(await data.arrayBuffer());
}

export async function listInvoices(db: SupabaseClient = getAdminDb()) {
  const { data, error } = await db
    .from("invoices")
    .select("invoice_number, status, amount, amount_paid, amount_due, due_at, client:clients(business_name)")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Projects with an unpaid build order and no live invoice yet, i.e. what still needs invoicing. */
export async function projectsAwaitingInvoice(db: SupabaseClient = getAdminDb()) {
  const { data: orders, error } = await db
    .from("orders")
    .select("total, project_id, created_at, project:projects(id, business_name, package)")
    .eq("status", "pending")
    .not("project_id", "is", null)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const ids = Array.from(new Set((orders ?? []).map((o) => o.project_id)));
  if (!ids.length) return [];
  const { data: invs, error: iErr } = await db
    .from("invoices")
    .select("project_id")
    .in("project_id", ids)
    .neq("status", "void");
  if (iErr) throw new Error(iErr.message);
  const invoiced = new Set((invs ?? []).map((i) => i.project_id));
  return (orders ?? []).filter((o) => !invoiced.has(o.project_id));
}

/** Resolves a project by uuid or by a unique part of its business name. */
export async function resolveProject(ref: string, db: SupabaseClient = getAdminDb()): Promise<string> {
  if (/^[0-9a-f-]{36}$/i.test(ref)) return ref;
  const { data, error } = await db.from("projects").select("id, business_name").ilike("business_name", `%${ref}%`);
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error(`No project matches "${ref}".`);
  if (data.length > 1) {
    throw new Error(`"${ref}" matches ${data.length} projects: ${data.map((p) => p.business_name).join(", ")}. Be more specific.`);
  }
  return data[0].id;
}
