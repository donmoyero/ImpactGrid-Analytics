import type { SupabaseClient } from "@supabase/supabase-js";

export interface BankDetails {
  account_name: string;
  sort_code: string; // formatted 12-34-56
  account_number: string;
  bank_name?: string;
}

export interface BusinessProfile {
  name: string;
  email?: string;
  website?: string;
  address_lines: string[];
  phone?: string;
  /** Logo as a data URL (png/jpeg), set in Admin → Settings. */
  logo_data?: string;
}

/** Decodes a stored logo data URL into bytes the PDF can embed. Returns null if missing or unusable. */
export function decodeLogo(dataUrl?: string): { bytes: Uint8Array; type: "png" | "jpg" } | null {
  const m = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl ?? "");
  if (!m) return null;
  return { bytes: new Uint8Array(Buffer.from(m[2], "base64")), type: m[1] === "png" ? "png" : "jpg" };
}

/** Raw settings for the admin Settings form. Never throws on missing rows. */
export async function loadSettingsForEdit(db: SupabaseClient) {
  const { data } = await db.from("business_settings").select("key, value").in("key", ["bank_details", "business_profile"]);
  const byKey = Object.fromEntries((data ?? []).map((r) => [r.key, (r.value ?? {}) as Record<string, unknown>]));
  const b = byKey["bank_details"] ?? {};
  const p = byKey["business_profile"] ?? {};
  const s = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    name: s(p.name) || "ImpactGrid Analytics",
    email: s(p.email),
    website: s(p.website),
    phone: s(p.phone),
    address: Array.isArray(p.address_lines) ? (p.address_lines as unknown[]).map(String).join("\n") : "",
    hasLogo: !!decodeLogo(s(p.logo_data) || undefined),
    account_name: s(b.account_name),
    sort_code: s(b.sort_code),
    account_number: s(b.account_number),
    bank_name: s(b.bank_name),
  };
}

/**
 * Bank details and business profile live in the admin-only `business_settings` table
 * (see supabase/business-settings.example.sql) and are injected into each generated invoice.
 * Refuses to continue rather than print a wrong or placeholder account on an invoice.
 */
export async function loadInvoiceSettings(db: SupabaseClient): Promise<{ bank: BankDetails; business: BusinessProfile }> {
  const { data, error } = await db
    .from("business_settings")
    .select("key, value")
    .in("key", ["bank_details", "business_profile"]);
  if (error) throw new Error(`Couldn't read business settings: ${error.message}`);

  const byKey = Object.fromEntries((data ?? []).map((r) => [r.key, r.value as Record<string, unknown>]));
  const b = byKey["bank_details"];
  if (!b) {
    throw new Error(
      "Bank details are not set. Go to Admin → Settings, enter your bank details and save."
    );
  }

  const digits = (v: unknown) => String(v ?? "").replace(/[\s-]/g, "");
  const sc = digits(b.sort_code);
  const an = digits(b.account_number);
  if (!/^\d{6}$/.test(sc)) throw new Error(`Bank details: sort code must be 6 digits (got "${b.sort_code}").`);
  if (!/^\d{8}$/.test(an)) throw new Error(`Bank details: account number must be 8 digits (got "${b.account_number}").`);
  const accountName = String(b.account_name ?? "").trim();
  if (!accountName || /^REPLACE/i.test(accountName)) throw new Error("Bank details: account name is missing.");

  const p = byKey["business_profile"] ?? {};
  const lines = Array.isArray(p.address_lines) ? (p.address_lines as unknown[]).map(String) : [];
  if (lines.some((l) => /^REPLACE/i.test(l))) throw new Error("Business profile still contains placeholder text.");

  return {
    bank: {
      account_name: accountName,
      sort_code: `${sc.slice(0, 2)}-${sc.slice(2, 4)}-${sc.slice(4, 6)}`,
      account_number: an,
      bank_name: b.bank_name && !/^REPLACE/i.test(String(b.bank_name)) ? String(b.bank_name) : undefined,
    },
    business: {
      name: String(p.name ?? "ImpactGrid Analytics"),
      email: p.email ? String(p.email) : undefined,
      website: p.website ? String(p.website) : undefined,
      address_lines: lines,
      phone: p.phone ? String(p.phone) : undefined,
      logo_data: p.logo_data ? String(p.logo_data) : undefined,
    },
  };
}
