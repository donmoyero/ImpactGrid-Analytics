import { getAdminOverview, type AdminRow } from "@/lib/admin/data";
import { getPackage } from "@/lib/packages";
import { linkAccountAction, websiteAction } from "./actions";
import type { CarePlanStatus } from "@/types";

export const dynamic = "force-dynamic";

const SITE: Record<string, { label: string; dot: string }> = {
  live: { label: "Live", dot: "bg-green-600" },
  building: { label: "Being built", dot: "bg-blueprint2" },
  maintenance: { label: "Maintenance", dot: "bg-amber-500" },
  suspended: { label: "Suspended", dot: "bg-red-600" },
  none: { label: "No website yet", dot: "bg-slateLight" },
};
const CARE: Record<CarePlanStatus, string> = {
  trialing: "Free year", active: "Active", past_due: "Past due", cancelled: "Cancelled", expired: "Expired", suspended: "Suspended",
};
const date = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/London" }).format(new Date(iso)) : "—";

export default async function AdminPage({ searchParams }: { searchParams: { q?: string; ok?: string; err?: string } }) {
  const { rows, orphans } = await getAdminOverview(searchParams.q);
  const count = (f: (r: AdminRow) => boolean) => rows.filter(f).length;

  return (
    <div>
      <h1 className="font-display text-3xl md:text-4xl">Customers</h1>
      <p className="mt-1 text-slate">Every customer, their website and their Care Plan.</p>

      {searchParams.ok && <p role="status" className="mt-6 rounded-xl border border-line2 bg-sand px-4 py-3 text-sm">{searchParams.ok}</p>}
      {searchParams.err && <p role="alert" className="mt-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{searchParams.err}</p>}

      <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-5">
        <Tile label="Customers" value={rows.length} />
        <Tile label="Live" value={count((r) => r.websiteStatus === "live")} />
        <Tile label="Maintenance" value={count((r) => r.websiteStatus === "maintenance")} />
        <Tile label="Suspended" value={count((r) => r.websiteStatus === "suspended")} />
        <Tile label="Care Plan past due" value={count((r) => r.carePlanStatus === "past_due")} />
      </dl>

      <form className="mt-8 flex gap-3" role="search">
        <input name="q" defaultValue={searchParams.q ?? ""} placeholder="Search business, email or domain" className="input max-w-md" aria-label="Search customers" />
        <button className="rounded-full bg-signal px-5 py-2 text-sm font-medium text-ink">Search</button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-ink2">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-line text-slateLight">
            <tr>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Package</th>
              <th className="px-4 py-3 font-medium">Website</th>
              <th className="px-4 py-3 font-medium">Care Plan</th>
              <th className="px-4 py-3 font-medium">Manage</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate">No customers found.</td></tr>
            )}
            {rows.map((r) => {
              const site = SITE[r.websiteStatus];
              return (
                <tr key={r.projectId} className="border-b border-line align-top last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.businessName}</p>
                    <p className="text-slate">{r.contactEmail ?? "No client record"}</p>
                    {!r.linked && <p className="mt-1 text-xs text-amber-700">No account linked</p>}
                  </td>
                  <td className="px-4 py-3">{getPackage(r.tier)?.name ?? r.tier}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${site.dot}`} aria-hidden />{site.label}</span>
                    <p className="text-slate">{r.domain ?? "No domain"}</p>
                  </td>
                  <td className="px-4 py-3">
                    {r.carePlanStatus ? CARE[r.carePlanStatus] : "Not set up"}
                    <p className="text-slate">
                      {r.daysPastDue != null ? `${r.daysPastDue} days overdue` : `Renews ${date(r.renewalAt)}`}
                    </p>
                  </td>
                  <td className="px-4 py-3"><Manage r={r} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {orphans.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl">Clients with no project</h2>
          <p className="mt-1 text-sm text-slate">These have a client record but haven't booked a project, so their dashboard has nothing to show yet.</p>
          <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-ink2">
            {orphans.map((o) => (
              <li key={o.clientId} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                <span><span className="font-medium">{o.businessName}</span> <span className="text-slate">{o.contactEmail}</span></span>
                <span className="text-xs text-slateLight">{o.linked ? "Account linked" : "No account linked"}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-ink2 p-4">
      <dt className="text-sm text-slateLight">{label}</dt>
      <dd className="mt-1 font-display text-2xl">{value}</dd>
    </div>
  );
}

function Manage({ r }: { r: AdminRow }) {
  const s = r.websiteStatus;
  const btn = "rounded-full border border-line2 px-3 py-1.5 text-xs font-medium hover:bg-sand";
  const danger = "rounded-full border border-red-300 px-3 py-1.5 text-xs font-medium text-red-800 hover:bg-red-50";
  return (
    <details>
      <summary className="cursor-pointer text-sm underline">Manage</summary>
      <div className="mt-3 w-64 space-y-4">
        {s === "none" && <Act id={r.projectId} action="create_site" label="Create website record" cls={btn} />}
        {s === "building" && <Act id={r.projectId} action="go_live" label="Mark website live" cls={btn} />}
        {s === "maintenance" && <Act id={r.projectId} action="maintenance_off" label="End maintenance" cls={btn} />}
        {s === "suspended" && <Act id={r.projectId} action="restore" label="Restore website" cls={btn} />}

        {s === "live" && (
          <form action={websiteAction} className="space-y-2">
            <input type="hidden" name="projectId" value={r.projectId} />
            <input type="hidden" name="action" value="maintenance_on" />
            <input name="reason" placeholder="Reason (optional)" className="input py-2 text-xs" />
            <button className={btn}>Start maintenance</button>
          </form>
        )}

        {(s === "live" || s === "maintenance") && (
          <form action={websiteAction} className="space-y-2">
            <input type="hidden" name="projectId" value={r.projectId} />
            <input type="hidden" name="action" value="suspend" />
            <input name="reason" placeholder="Reason for suspending" className="input py-2 text-xs" />
            <label className="flex items-center gap-2 text-xs text-slate">
              <input type="checkbox" name="force" /> Even if no invoice is overdue
            </label>
            <button className={danger}>Suspend website</button>
          </form>
        )}

        {r.clientId && !r.linked && (
          <form action={linkAccountAction} className="space-y-2 border-t border-line pt-3">
            <input type="hidden" name="clientId" value={r.clientId} />
            <input name="email" type="email" required placeholder="Their sign-up email" defaultValue={r.contactEmail ?? ""} className="input py-2 text-xs" />
            <button className={btn}>Link their account</button>
          </form>
        )}
      </div>
    </details>
  );
}

function Act({ id, action, label, cls }: { id: string; action: string; label: string; cls: string }) {
  return (
    <form action={websiteAction}>
      <input type="hidden" name="projectId" value={id} />
      <input type="hidden" name="action" value={action} />
      <button className={cls}>{label}</button>
    </form>
  );
}
