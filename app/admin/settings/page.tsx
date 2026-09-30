import { getAdminDb } from "@/lib/supabase/admin";
import { loadSettingsForEdit } from "@/lib/invoice/settings";
import { saveSettingsAction } from "./actions";

export const dynamic = "force-dynamic";

const input = "mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink";
const label = "block text-sm font-medium";

export default async function SettingsPage({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  const s = await loadSettingsForEdit(getAdminDb());
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl">Settings</h1>
      <p className="mt-2 text-sm text-slate">Used on every new invoice and email. Stored in Supabase, never in the code. Change anything here at any time.</p>
      {searchParams.ok && <p role="status" className="mt-6 rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800">{searchParams.ok}</p>}
      {searchParams.err && <p role="alert" className="mt-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{searchParams.err}</p>}

      <form action={saveSettingsAction} encType="multipart/form-data" className="mt-8 space-y-10">
        <section className="space-y-4">
          <h2 className="font-display text-xl">Company</h2>
          <label className={label}>Company name<input name="name" defaultValue={s.name} required className={input} /></label>
          <label className={label}>Address (one line per row)<textarea name="address" defaultValue={s.address} rows={4} className={input} /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={label}>Email<input name="email" type="email" defaultValue={s.email} className={input} /></label>
            <label className={label}>Phone<input name="phone" defaultValue={s.phone} className={input} /></label>
          </div>
          <label className={label}>Website<input name="website" defaultValue={s.website} className={input} /></label>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl">Logo</h2>
          {s.hasLogo && (
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/api/brand-logo" alt="Current logo" className="h-12 w-auto rounded border border-line bg-white p-1" />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="remove_logo" /> Remove logo</label>
            </div>
          )}
          <label className={label}>{s.hasLogo ? "Replace logo" : "Upload logo"} (PNG or JPG, under 400 KB)
            <input name="logo" type="file" accept="image/png,image/jpeg" className="mt-1 block text-sm" />
          </label>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl">Bank details (shown on invoices)</h2>
          <label className={label}>Account name<input name="account_name" defaultValue={s.account_name} className={input} /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={label}>Sort code<input name="sort_code" defaultValue={s.sort_code} placeholder="12-34-56" className={input} /></label>
            <label className={label}>Account number<input name="account_number" defaultValue={s.account_number} inputMode="numeric" className={input} /></label>
          </div>
          <label className={label}>Bank name (optional)<input name="bank_name" defaultValue={s.bank_name} className={input} /></label>
        </section>

        <button type="submit" className="rounded-lg bg-signal px-5 py-2.5 text-sm font-medium text-ink">Save settings</button>
      </form>
    </div>
  );
}
