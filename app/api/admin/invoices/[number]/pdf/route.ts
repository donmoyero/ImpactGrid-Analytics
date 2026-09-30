import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { downloadInvoicePdf } from "@/lib/invoice/service";

export const dynamic = "force-dynamic";

/** Admin-only PDF download of an invoice. */
export async function GET(_req: Request, { params }: { params: { number: string } }) {
  await requireAdmin();
  if (!/^IGA-\d{4}-\d{5}$/.test(params.number)) return NextResponse.json({ error: "Invalid invoice number." }, { status: 400 });
  try {
    const pdf = await downloadInvoicePdf(params.number);
    return new NextResponse(Buffer.from(pdf), {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${params.number}.pdf"`, "Cache-Control": "no-store" },
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Not found." }, { status: 404 });
  }
}
