"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminDb } from "@/lib/supabase/admin";

const str = (f: FormData, k: string) => (typeof f.get(k) === "string" ? (f.get(k) as string).trim() : "");
const MAX_LOGO = 400 * 1024;

async function existing(key: string): Promise<Record<string, unknown>> {
  const { data } = await getAdminDb().from("business_settings").select("value").eq("key", key).maybeSingle();
  return (data?.value ?? {}) as Record<string, unknown>;
}

/** Saves company details, bank details and (optionally) a new logo. Admin only; everything is validated here. */
export async function saveSettingsAction(formData: FormData) {
  await requireAdmin();
  let ok = true;
  let msg = "Saved. New invoices use these details.";
  try {
    const name = str(formData, "name");
    if (!name) throw new Error("Company name is required.");
    const sc = str(formData, "sort_code").replace(/[\s-]/g, "");
    const an = str(formData, "account_number").replace(/[\s-]/g, "");
    const accountName = str(formData, "account_name");
    if (sc || an || accountName) {
      if (!/^\d{6}$/.test(sc)) throw new Error("Sort code must be 6 digits, e.g. 12-34-56.");
      if (!/^\d{8}$/.test(an)) throw new Error("Account number must be 8 digits.");
      if (!accountName) throw new Error("Account name is required.");
    }

    const prev = await existing("business_profile");
    let logo_data = typeof prev.logo_data === "string" ? prev.logo_data : undefined;
    if (formData.get("remove_logo") === "on") logo_data = undefined;
    const file = formData.get("logo");
    if (file instanceof File && file.size > 0) {
      if (file.type !== "image/png" && file.type !== "image/jpeg") throw new Error("Logo must be a PNG or JPG.");
      if (file.size > MAX_LOGO) throw new Error("Logo is too big. Keep it under 400 KB.");
      const buf = Buffer.from(await file.arrayBuffer());
      logo_data = `data:${file.type};base64,${buf.toString("base64")}`;
    }

    const profile: Record<string, unknown> = {
      name,
      email: str(formData, "email"),
      website: str(formData, "website"),
      phone: str(formData, "phone"),
      address_lines: str(formData, "address").split(/\r?\n/).map((l) => l.trim()).filter(Boolean),
    };
    if (logo_data) profile.logo_data = logo_data;

    const now = new Date().toISOString();
    const db = getAdminDb();
    const rows: { key: string; value: Record<string, unknown>; updated_at: string }[] = [
      { key: "business_profile", value: profile, updated_at: now },
    ];
    if (sc) {
      rows.push({
        key: "bank_details",
        value: { account_name: accountName, sort_code: `${sc.slice(0, 2)}-${sc.slice(2, 4)}-${sc.slice(4, 6)}`, account_number: an, bank_name: str(formData, "bank_name") },
        updated_at: now,
      });
    }
    const { error } = await db.from("business_settings").upsert(rows, { onConflict: "key" });
    if (error) throw new Error(error.message);
  } catch (e) {
    ok = false;
    msg = e instanceof Error ? e.message : "Something went wrong.";
  }
  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  redirect(`/admin/settings?${ok ? "ok" : "err"}=${encodeURIComponent(msg)}`);
}
