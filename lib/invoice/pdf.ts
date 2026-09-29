import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { InvoiceLine, InvoiceStatus } from "../../types";
import type { BankDetails, BusinessProfile } from "./settings";

export interface InvoicePdfInput {
  invoice: {
    invoice_number: string;
    status: InvoiceStatus;
    amount: number;
    amount_paid: number;
    amount_due: number;
    issued_at: string | null;
    due_at: string | null;
    line_items: InvoiceLine[];
  };
  client: {
    business_name: string;
    contact_email: string;
    contact_phone: string | null;
    billing_address: string | null;
  };
  projectName: string;
  packageName: string | null;
  bank: BankDetails;
  business: BusinessProfile;
}

const INK = rgb(0.06, 0.09, 0.16);
const MUTED = rgb(0.4, 0.44, 0.5);
const RULE = rgb(0.85, 0.87, 0.9);
const ACCENT = rgb(0.1, 0.35, 0.85);
const GREEN = rgb(0.05, 0.55, 0.3);

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const M = 50;

export function formatMoney(n: number): string {
  const [whole, dec] = n.toFixed(2).split(".");
  return `£${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${dec}`;
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Europe/London",
  }).format(new Date(iso));
}

/** Standard PDF fonts only cover WinAnsi; swap anything else for "?" instead of crashing. */
function safe(font: PDFFont, s: string): string {
  const ok = new Set(font.getCharacterSet());
  return Array.from(s.replace(/\r/g, ""))
    .map((c) => (c === "\n" || ok.has(c.codePointAt(0)!) ? c : "?"))
    .join("");
}

function wrap(font: PDFFont, size: number, text: string, maxWidth: number): string[] {
  const out: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) <= maxWidth) {
        line = next;
      } else {
        if (line) out.push(line);
        line = word;
      }
    }
    out.push(line);
  }
  return out;
}

export async function generateInvoicePdf(input: InvoicePdfInput): Promise<Uint8Array> {
  const { invoice, client, bank, business } = input;
  const doc = await PDFDocument.create();
  doc.setTitle(`Invoice ${invoice.invoice_number}`);
  doc.setAuthor(business.name);
  doc.setCreator(business.name);

  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page: PDFPage = doc.addPage([PAGE_W, PAGE_H]);

  const text = (
    s: string,
    x: number,
    y: number,
    o: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb>; align?: "left" | "right" } = {}
  ) => {
    const font = o.font ?? regular;
    const size = o.size ?? 10;
    const clean = safe(font, s);
    const w = font.widthOfTextAtSize(clean, size);
    page.drawText(clean, { x: o.align === "right" ? x - w : x, y, size, font, color: o.color ?? INK });
  };
  const rule = (y: number, color = RULE) =>
    page.drawLine({ start: { x: M, y }, end: { x: PAGE_W - M, y }, thickness: 0.75, color });

  // ---- Header ----
  let y = PAGE_H - M - 10;
  text(business.name.toUpperCase(), M, y, { size: 14, font: bold });
  text("INVOICE", PAGE_W - M, y - 2, { size: 26, font: bold, align: "right", color: ACCENT });
  y -= 18;
  for (const l of [...business.address_lines, business.email, business.website].filter(Boolean) as string[]) {
    text(l, M, y, { size: 9, color: MUTED });
    y -= 12;
  }

  // Status stamp
  if (invoice.status === "paid" || invoice.status === "void") {
    const label = invoice.status === "paid" ? "PAID" : "VOID";
    text(label, PAGE_W - M, PAGE_H - M - 42, {
      size: 16,
      font: bold,
      align: "right",
      color: invoice.status === "paid" ? GREEN : MUTED,
    });
  }

  y = Math.min(y, PAGE_H - M - 90) - 14;
  rule(y);
  y -= 26;

  // ---- Bill to (left) / invoice meta (right) ----
  const blockTop = y;
  text("BILL TO", M, y, { size: 8, font: bold, color: MUTED });
  y -= 15;
  text(client.business_name, M, y, { size: 12, font: bold });
  y -= 15;
  const billLines = [
    client.contact_email,
    client.contact_phone,
    ...(client.billing_address ? wrap(regular, 10, safe(regular, client.billing_address), 240) : []),
  ].filter(Boolean) as string[];
  for (const l of billLines) {
    text(l, M, y, { size: 10 });
    y -= 13;
  }

  const meta: [string, string][] = [
    ["Invoice", invoice.invoice_number],
    ["Date", formatDate(invoice.issued_at)],
    ["Due", formatDate(invoice.due_at)],
  ];
  let my = blockTop;
  for (const [k, v] of meta) {
    text(k.toUpperCase(), 360, my, { size: 8, font: bold, color: MUTED });
    text(v, PAGE_W - M, my, { size: 10, font: bold, align: "right" });
    my -= 18;
  }
  y = Math.min(y, my) - 22;

  // ---- Line items ----
  const colAmount = PAGE_W - M;
  page.drawRectangle({ x: M, y: y - 6, width: PAGE_W - 2 * M, height: 22, color: rgb(0.95, 0.96, 0.98) });
  text("DESCRIPTION", M + 8, y, { size: 8, font: bold, color: MUTED });
  text("AMOUNT", colAmount - 8, y, { size: 8, font: bold, color: MUTED, align: "right" });
  y -= 26;

  const lines: InvoiceLine[] = invoice.line_items.length
    ? invoice.line_items
    : [{ description: `Website build — ${input.projectName}`, amount: invoice.amount }];

  // Project / package context above the lines
  text(`Project: ${input.projectName}`, M + 8, y, { size: 10, font: bold });
  y -= 14;
  if (input.packageName) {
    text(`Package: ${input.packageName}`, M + 8, y, { size: 10, color: MUTED });
    y -= 20;
  } else {
    y -= 6;
  }

  for (const line of lines) {
    const wrapped = wrap(regular, 10, safe(regular, line.description), 340);
    wrapped.forEach((w, i) => text(w, M + 8, y - i * 13, { size: 10 }));
    text(formatMoney(line.amount), colAmount - 8, y, { size: 10, align: "right" });
    const ruleY = y - (wrapped.length - 1) * 13 - 8;
    rule(ruleY);
    y = ruleY - 16;
  }

  // ---- Totals ----
  y -= 12;
  const labelX = 380;
  text("Total", labelX, y, { size: 11, font: bold });
  text(formatMoney(invoice.amount), colAmount - 8, y, { size: 13, font: bold, align: "right" });
  if (invoice.amount_paid > 0) {
    y -= 18;
    text("Paid", labelX, y, { size: 10, color: MUTED });
    text(`-${formatMoney(invoice.amount_paid)}`, colAmount - 8, y, { size: 10, align: "right", color: MUTED });
    y -= 18;
    text("Amount due", labelX, y, { size: 11, font: bold });
    text(formatMoney(invoice.amount_due), colAmount - 8, y, {
      size: 13,
      font: bold,
      align: "right",
      color: invoice.amount_due > 0 ? ACCENT : GREEN,
    });
  }

  // ---- Payment details ----
  y -= 44;
  rule(y + 20);
  text("PAYMENT", M, y, { size: 8, font: bold, color: MUTED });
  y -= 18;
  text("Payment method", M, y, { size: 10, color: MUTED });
  text("Bank transfer", M + 130, y, { size: 10, font: bold });
  const rows: [string, string][] = [
    ["Account name", bank.account_name],
    ["Sort code", bank.sort_code],
    ["Account number", bank.account_number],
    ...(bank.bank_name ? ([["Bank", bank.bank_name]] as [string, string][]) : []),
    ["Payment reference", invoice.invoice_number],
  ];
  for (const [k, v] of rows) {
    y -= 16;
    text(k, M, y, { size: 10, color: MUTED });
    text(v, M + 130, y, { size: 10, font: bold });
  }
  y -= 26;
  const note = wrap(
    regular,
    9,
    "Please use the payment reference above so we can match your payment to this invoice.",
    PAGE_W - 2 * M
  );
  note.forEach((l, i) => text(l, M, y - i * 12, { size: 9, color: MUTED }));

  // ---- Footer ----
  text(`${business.name}${business.website ? `  ·  ${business.website}` : ""}`, PAGE_W - M, M - 10, {
    size: 8,
    color: MUTED,
    align: "right",
  });
  page.drawText(safe(regular, `${invoice.invoice_number}`), {
    x: M,
    y: M - 10,
    size: 8,
    font: regular,
    color: MUTED,
  });

  return doc.save();
}
