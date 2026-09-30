import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminDb } from "../supabase/admin";
import { adminEmail, sendEmail } from "../email";
import { downloadInvoicePdf, isCarePlanInvoice } from "./service";
import type { InvoiceLine } from "../../types";

const gbp = (n: number | string) => `£${Number(n).toFixed(2)}`;
const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "");

/** Emails an invoice (PDF attached) to the client. Throws if it can't be sent, so the admin sees the problem. */
export async function emailInvoice(ref: string, db: SupabaseClient = getAdminDb()): Promise<string> {
  const isUuid = /^[0-9a-f-]{36}$/i.test(ref);
  const { data, error } = await db
    .from("invoices")
    .select("invoice_number, amount, amount_due, due_at, line_items, client:clients(business_name, contact_email)")
    .eq(isUuid ? "id" : "invoice_number", ref)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`Invoice ${ref} not found.`);

  const client = data.client as unknown as { business_name: string; contact_email: string } | null;
  if (!client?.contact_email) throw new Error("This customer has no email address.");

  const pdf = await downloadInvoicePdf(data.invoice_number, db);
  const maintenance = isCarePlanInvoice({ line_items: data.line_items as InvoiceLine[] });
  const what = maintenance ? "your yearly Care Plan (hosting, SSL, backups, updates and small edits)" : "your website build";

  const ok = await sendEmail({
    to: client.contact_email,
    replyTo: adminEmail(),
    subject: `Invoice ${data.invoice_number} from ImpactGrid Analytics: ${gbp(data.amount)}`,
    text:
      `Hi ${client.business_name},\n\nPlease find attached invoice ${data.invoice_number} for ${what}.\n\n` +
      `Amount due: ${gbp(data.amount_due)}\nDue by: ${day(data.due_at)}\n\n` +
      `You can pay by bank transfer. Our bank details are on the invoice, and please use ${data.invoice_number} as the payment reference.\n\n` +
      `Thank you,\nImpactGrid Analytics\nhello@impactgridanalytics.com`,
    attachments: [{ filename: `${data.invoice_number}.pdf`, content: Buffer.from(pdf).toString("base64") }],
  });
  if (!ok) throw new Error(`Invoice ${data.invoice_number} was created but the email failed to send. Check RESEND_API_KEY, then use Resend on the Invoices page.`);
  return client.contact_email;
}
