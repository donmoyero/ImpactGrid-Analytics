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
      "Bank details are not set. Fill in supabase/business-settings.example.sql with your real details and run it in the Supabase SQL editor."
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
    },
  };
}
