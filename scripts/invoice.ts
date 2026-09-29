/**
 * Invoice CLI — run from the project folder:
 *
 *   npx tsx scripts/invoice.ts pending                       projects that still need an invoice
 *   npx tsx scripts/invoice.ts create "ABC Fashion"          invoice a project (name or id) for its pending order
 *   npx tsx scripts/invoice.ts create "ABC Fashion" 950      ...or for a custom amount
 *   npx tsx scripts/invoice.ts list                          recent invoices
 *   npx tsx scripts/invoice.ts pdf IGA-2026-00001            save the PDF to invoices-out\
 *   npx tsx scripts/invoice.ts pay IGA-2026-00001 400        record a bank-transfer payment
 *   npx tsx scripts/invoice.ts void IGA-2026-00001
 *
 * Reads Supabase keys from .env.local. PDFs are saved to invoices-out\ (git-ignored).
 */
import fs from "node:fs";
import path from "node:path";

function loadEnvLocal() {
  const file = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = raw.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m || raw.trim().startsWith("#")) continue;
    const value = m[2].replace(/\s+#.*$/, "").replace(/^["']|["']$/g, "");
    if (process.env[m[1]] === undefined) process.env[m[1]] = value;
  }
}

function savePdf(invoiceNumber: string, pdf: Uint8Array) {
  const dir = path.join(process.cwd(), "invoices-out");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${invoiceNumber}.pdf`);
  fs.writeFileSync(file, pdf);
  return file;
}

const gbp = (n: number | string) => `£${Number(n).toFixed(2)}`;

async function main() {
  loadEnvLocal();
  const svc = await import("../lib/invoice/service");
  const [cmd, a, b] = process.argv.slice(2);

  switch (cmd) {
    case "pending": {
      const rows = await svc.projectsAwaitingInvoice();
      if (!rows.length) return console.log("Nothing waiting for an invoice.");
      for (const o of rows as any[]) {
        console.log(`${o.project?.business_name ?? "?"}  (${o.project?.package})  ${gbp(o.total)}  id=${o.project_id}`);
      }
      return;
    }
    case "create": {
      if (!a) throw new Error('Usage: create "<business name or project id>" [amount]');
      const projectId = await svc.resolveProject(a);
      const amount = b !== undefined ? Number(b) : undefined;
      if (b !== undefined && !(amount! > 0)) throw new Error(`"${b}" is not a valid amount.`);
      const { invoice, pdf } = await svc.createInvoice({ projectId, amount });
      console.log(`Issued ${invoice.invoice_number}  ${gbp(invoice.amount)}  due ${invoice.due_at?.slice(0, 10)}`);
      console.log(`PDF saved: ${savePdf(invoice.invoice_number, pdf)}`);
      return;
    }
    case "list": {
      const rows = (await svc.listInvoices()) as any[];
      if (!rows.length) return console.log("No invoices yet.");
      for (const r of rows) {
        console.log(
          `${r.invoice_number}  ${String(r.status).padEnd(14)} ${gbp(r.amount).padStart(10)}  due ${gbp(r.amount_due).padStart(10)}  ${r.client?.business_name ?? ""}`
        );
      }
      return;
    }
    case "pdf": {
      if (!a) throw new Error("Usage: pdf <invoice number>");
      const { invoice, pdf } = await svc.storeInvoicePdf(a);
      console.log(`PDF saved: ${savePdf(invoice.invoice_number, pdf)}`);
      return;
    }
    case "pay": {
      const amount = Number(b);
      if (!a || !(amount > 0)) throw new Error("Usage: pay <invoice number> <amount>");
      const inv = await svc.recordPayment(a, amount);
      console.log(`${inv.invoice_number}: ${inv.status.toUpperCase()}  paid ${gbp(inv.amount_paid)}, still due ${gbp(inv.amount_due)}`);
      return;
    }
    case "void": {
      if (!a) throw new Error("Usage: void <invoice number>");
      const inv = await svc.voidInvoice(a);
      console.log(`${inv.invoice_number} is now ${inv.status}.`);
      return;
    }
    default:
      console.log("Commands: pending | create <project> [amount] | list | pdf <number> | pay <number> <amount> | void <number>");
  }
}

main().catch((e) => {
  console.error(`Error: ${e instanceof Error ? e.message : e}`);
  process.exit(1);
});
