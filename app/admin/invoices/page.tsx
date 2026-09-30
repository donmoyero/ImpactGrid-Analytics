import Link from "next/link";
import { getAdminDb } from "@/lib/supabase/admin";
import { getPackage } from "@/lib/packages";
import { isCarePlanInvoice, projectsAwaitingInvoice } from "@/lib/invoice/service";
import type { InvoiceLine } from "@/types";
import {
  recordPaymentAction,
  resendInvoiceAction,
  sendBuildInvoiceAction,
  sendMaintenanceInvoiceAction,
  voidInvoiceAction,
} from "./actions";

export const dynamic = "force-dynamic";

type OpenInvoice = {
  invoice_number: string;
  status: "issued" | "partially_paid" | "overdue";
  amount: number;
  amount_paid: number;
  amount_due: number;
  due_at: string | null;
  project_id: string | null;
  line_items: InvoiceLine[];
  client: { business_name: string } | null;
};

const gbp = (n: number | string) => `£${Number(n).toFixed(2).replace(/\.00$/, "")}`;
const date = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/London" }).format(new Date(iso)) : "—";
const STATUS: Record<string, { label: string; cls: string }> = {
  issued: { label: "Sent", cls: "text-slate" },
  partially_paid: { label: "Part paid", cls: "text-amber-700" },
  overdue: { label: "OVERDUE", cls: "font-medium text-red-700" },
};

export default async function InvoicesPage({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  const db = getAdminDb();
  let loadError: string | null = null;

  let awaiting: Awaited<ReturnType<typeof projectsAwaitingInvoice>> = [];
  let open: OpenInvoice[] = [];
  let paid: { invoice_number: string; amount: number; paid_at: string | null; client: { business_name: string } | null }[] = [];
  let plans: { project_id: string; price: number | null; plan: string; renewal_at: string | null; project: { business_name: string } | null }[] = [];

  try {
    awaiting = await projectsAwaitingInvoice(db);
    const [o, p, c] = await Promise.all([
      db
        .from("invoices")
        .select("invoice_number, status, amount, amount_paid, amount_due, due_at, project_id, line_items, client:clients(business_name)")
        .in("status", ["issued", "partially_paid", "overdue"])
        .order("due_at", { ascending: true }),
      db.from("invoices").select("invoice_number, amount, paid_at, client:clients(business_name)").eq("status", "paid").order("paid_at", { ascending: false }).limit(10),
      db
        .from("care_plans")
        .select("project_id, price, plan, renewal_at, project:projects(business_name)")
        .in("status", ["trialing", "active", "past_due"])
        .not("renewal_at", "is", null)
        .lte("renewal_at", new Date(Date.now() + 45 * 86_400_000).toISOString())
        .order("renewal_at", { ascending: true }),
    ]);
    for (const r of [o, p, c]) if (r.error) throw new Error(r.error.message);
    open = (o.data ?? []) as unknown as OpenInvoice[];
    paid = (p.data ?? []) as unknown as typeof paid;
    plans = (c.data ?? []) as unknown as typeof plans;
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Couldn't load invoices.";
  }

  // Projects that already have an unpaid maintenance invoice: don't offer to send another.
  const maintenanceOpen = new Set(open.filter((i) => isCarePlanInvoice(i)).map((i) => i.project_id));
  const overdue = open.filter((i) => i.status === "overdue");

  return (
    <div>
      <h1 className="font-display text-3xl md:text-4xl">Invoices</h1>
      <p className="mt-1 text-slate">Send invoices, record bank transfers, and see who hasn't paid.</p>

      {searchParams.ok && <p role="status" className="mt-6 rounded-xl border border-line2 bg-sand px-4 py-3 text-sm">{searchParams.ok}</p>}
      {searchParams.err && <p role="alert" className="mt-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{searchParams.err}</p>}
      {loadError && <p role="alert" className="mt-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{loadError}</p>}

      {overdue.length > 0 && (
        <div role="alert" className="mt-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
          <p className="font-medium">{overdue.length} overdue invoice{overdue.length > 1 ? "s" : ""}. Reminders have been sent.</p>
          <p className="mt-1">To stop a site for non-payment, open the customer and use Manage → Suspend website:</p>
          <ul className="mt-2 list-disc pl-5">
            {overdue.map((i) => (
              <li key={i.invoice_number}>
                <Link className="underline" href={`/admin?q=${encodeURIComponent(i.client?.business_name ?? "")}`}>{i.client?.business_name ?? i.invoice_number}</Link>{" "}
                — {gbp(i.amount_due)} ({i.invoice_number})
              </li>
            ))}
          </ul>
        </div>
      )}

      <Section title={`Website build: needs an invoice (${awaiting.length})`}>
        {awaiting.length === 0 ? (
          <Empty>Nothing waiting. Approved bookings show up here.</Empty>
        ) : (
          <List>
            {awaiting.map((o) => {
              const project = (Array.isArray(o.project) ? o.project[0] : o.project) as { business_name: string; package: string } | null;
              return (
                <Row key={String(o.project_id)}>
                  <span>
                    <span className="font-medium">{project?.business_name ?? "Project"}</span>{" "}
                    <span className="text-slate">{getPackage(project?.package ?? "")?.name ?? project?.package} · {gbp(o.total)}</span>
                  </span>
                  <form action={sendBuildInvoiceAction}>
                    <input type="hidden" name="projectId" value={String(o.project_id)} />
                    <button className="rounded-full bg-signal px-4 py-1.5 text-xs font-medium text-ink">Send build invoice</button>
                  </form>
                </Row>
              );
            })}
          </List>
        )}
      </Section>

      <Section title={`Maintenance (Care Plan): due within 45 days (${plans.length})`}>
        {plans.length === 0 ? (
          <Empty>No maintenance renewals coming up.</Empty>
        ) : (
          <List>
            {plans.map((p) => {
              const overdueDays = p.renewal_at ? Math.floor((Date.now() - new Date(p.renewal_at).getTime()) / 86_400_000) : 0;
              return (
                <Row key={p.project_id}>
                  <span>
                    <span className="font-medium">{p.project?.business_name ?? "Project"}</span>{" "}
                    <span className="text-slate">
                      {p.price != null ? `${gbp(p.price)}/year` : ""} · {overdueDays > 0 ? `renewal was due ${date(p.renewal_at)}` : `renews ${date(p.renewal_at)}`}
                    </span>
                  </span>
                  {maintenanceOpen.has(p.project_id) ? (
                    <span className="text-xs text-slateLight">Invoice already sent</span>
                  ) : (
                    <form action={sendMaintenanceInvoiceAction}>
                      <input type="hidden" name="projectId" value={p.project_id} />
                      <button className="rounded-full bg-signal px-4 py-1.5 text-xs font-medium text-ink">Send maintenance invoice</button>
                    </form>
                  )}
                </Row>
              );
            })}
          </List>
        )}
      </Section>

      <Section title={`Unpaid invoices (${open.length})`}>
        {open.length === 0 ? (
          <Empty>No unpaid invoices.</Empty>
        ) : (
          <List>
            {open.map((i) => {
              const st = STATUS[i.status];
              return (
                <li key={i.invoice_number} className="px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                      <span className="font-medium">{i.client?.business_name ?? "—"}</span>{" "}
                      <span className="text-slate">{i.invoice_number} · {isCarePlanInvoice(i) ? "maintenance" : "website build"}</span>
                    </span>
                    <span>
                      <span className={st.cls}>{st.label}</span>{" "}
                      <span className="text-slate">· {gbp(i.amount_due)} due {date(i.due_at)}</span>
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-start gap-3">
                    <form action={recordPaymentAction} className="flex items-center gap-2">
                      <input type="hidden" name="number" value={i.invoice_number} />
                      <input name="amount" type="number" step="0.01" min="0.01" defaultValue={Number(i.amount_due)} className="input w-28 py-1.5 text-xs" aria-label="Amount received" />
                      <button className="rounded-full border border-line2 px-3 py-1.5 text-xs font-medium hover:bg-sand">Record payment</button>
                    </form>
                    <form action={resendInvoiceAction}>
                      <input type="hidden" name="number" value={i.invoice_number} />
                      <button className="rounded-full border border-line2 px-3 py-1.5 text-xs font-medium hover:bg-sand">Resend</button>
                    </form>
                    <a href={`/api/admin/invoices/${i.invoice_number}/pdf`} target="_blank" rel="noreferrer" className="rounded-full border border-line2 px-3 py-1.5 text-xs font-medium hover:bg-sand">PDF</a>
                    <form action={voidInvoiceAction}>
                      <input type="hidden" name="number" value={i.invoice_number} />
                      <button className="rounded-full border border-red-300 px-3 py-1.5 text-xs font-medium text-red-800 hover:bg-red-50">Cancel invoice</button>
                    </form>
                  </div>
                </li>
              );
            })}
          </List>
        )}
      </Section>

      {paid.length > 0 && (
        <Section title="Recently paid">
          <List>
            {paid.map((i) => (
              <Row key={i.invoice_number}>
                <span><span className="font-medium">{i.client?.business_name ?? "—"}</span> <span className="text-slate">{i.invoice_number}</span></span>
                <span className="text-green-700">Paid {gbp(i.amount)} · {date(i.paid_at)}</span>
              </Row>
            ))}
          </List>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
const List = ({ children }: { children: React.ReactNode }) => (
  <ul className="divide-y divide-line rounded-2xl border border-line bg-ink2">{children}</ul>
);
const Row = ({ children }: { children: React.ReactNode }) => (
  <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">{children}</li>
);
const Empty = ({ children }: { children: React.ReactNode }) => (
  <p className="rounded-2xl border border-line bg-ink2 px-4 py-6 text-center text-sm text-slate">{children}</p>
);
