import { getAdminDb } from "@/lib/supabase/admin";
import { addons, getPackage } from "@/lib/packages";
import { approveBookingAction, declineBookingAction } from "./actions";

export const dynamic = "force-dynamic";

type Booking = {
  id: string;
  business_name: string;
  contact_email: string;
  contact_phone: string | null;
  package: string;
  addon_ids: string[];
  domain: string | null;
  palette: string | null;
  notes: string | null;
  total: number;
  status: "pending" | "approved" | "declined";
  decline_reason: string | null;
  created_at: string;
  decided_at: string | null;
};

const gbp = (n: number | string) => `£${Number(n).toFixed(2).replace(/\.00$/, "")}`;
const when = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" }).format(new Date(iso)) : "";

export default async function BookingsPage({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  const { data, error } = await getAdminDb().from("booking_requests").select("*").order("created_at", { ascending: false }).limit(100);
  const setupNeeded = error?.code === "42P01" || /booking_requests/.test(error?.message ?? "");
  const rows = (data ?? []) as Booking[];
  const pending = rows.filter((r) => r.status === "pending");
  const decided = rows.filter((r) => r.status !== "pending").slice(0, 20);

  return (
    <div>
      <h1 className="font-display text-3xl md:text-4xl">Bookings</h1>
      <p className="mt-1 text-slate">New website requests. Approve one and the customer is emailed a link to see their project.</p>

      {searchParams.ok && <p role="status" className="mt-6 rounded-xl border border-line2 bg-sand px-4 py-3 text-sm">{searchParams.ok}</p>}
      {searchParams.err && <p role="alert" className="mt-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{searchParams.err}</p>}
      {setupNeeded && (
        <p role="alert" className="mt-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          The bookings table doesn't exist yet. Run <code>supabase/migrations-bookings.sql</code> once in the Supabase SQL editor.
        </p>
      )}

      <h2 className="mt-10 font-display text-xl">Waiting for you ({pending.length})</h2>
      {pending.length === 0 && !setupNeeded && (
        <p className="mt-3 rounded-2xl border border-line bg-ink2 px-4 py-8 text-center text-slate">No requests waiting.</p>
      )}
      <ul className="mt-4 space-y-4">
        {pending.map((b) => (
          <li key={b.id} className="rounded-2xl border border-line bg-ink2 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-lg">{b.business_name}</p>
                <p className="text-sm text-slate">{b.contact_email}{b.contact_phone ? ` · ${b.contact_phone}` : ""}</p>
              </div>
              <p className="text-sm text-slateLight">{when(b.created_at)}</p>
            </div>

            <dl className="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
              <Item label="Package">{getPackage(b.package)?.name ?? b.package} · {gbp(b.total)} build</Item>
              <Item label="Add-ons">{b.addon_ids?.length ? b.addon_ids.map((id) => addons.find((a) => a.id === id)?.name ?? id).join(", ") : "None"}</Item>
              <Item label="Domain">{b.domain ?? "To be chosen"}</Item>
              <Item label="Palette">{b.palette ?? "—"}</Item>
            </dl>

            <div className="mt-4">
              <p className="text-sm text-slateLight">What they want</p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{b.notes ?? "Nothing added."}</p>
            </div>

            <div className="mt-5 flex flex-wrap items-start gap-3 border-t border-line pt-4">
              <form action={approveBookingAction}>
                <input type="hidden" name="id" value={b.id} />
                <button className="rounded-full bg-signal px-5 py-2 text-sm font-medium text-ink">Approve</button>
              </form>
              <details>
                <summary className="cursor-pointer rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-50">Decline</summary>
                <form action={declineBookingAction} className="mt-3 w-72 space-y-2">
                  <input type="hidden" name="id" value={b.id} />
                  <textarea name="reason" rows={3} placeholder="Message to them (optional)" className="input text-xs" />
                  <button className="rounded-full border border-red-300 px-4 py-1.5 text-xs font-medium text-red-800 hover:bg-red-50">Decline and email</button>
                </form>
              </details>
            </div>
          </li>
        ))}
      </ul>

      {decided.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-xl">Recently handled</h2>
          <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-ink2">
            {decided.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <span><span className="font-medium">{b.business_name}</span> <span className="text-slate">{b.contact_email}</span></span>
                <span className={b.status === "approved" ? "text-green-700" : "text-red-700"}>
                  {b.status === "approved" ? "Approved" : "Declined"} · {when(b.decided_at)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-slateLight">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
