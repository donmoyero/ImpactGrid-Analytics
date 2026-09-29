import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminDb } from "../supabase/admin";

/** Overdue invoices and what the admin can do about each (backed by the payment_suspension_queue view). */
export async function getSuspensionQueue(db: SupabaseClient = getAdminDb()) {
  const { data, error } = await db.from("payment_suspension_queue").select("*");
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Admin action. Refused by the database unless the project has an overdue invoice (or force is set). */
export async function suspendWebsite(
  projectId: string,
  reason?: string,
  opts: { force?: boolean } = {},
  db: SupabaseClient = getAdminDb()
) {
  const { data, error } = await db.rpc("suspend_website", {
    p_project_id: projectId,
    p_reason: reason ?? null,
    p_force: !!opts.force,
  });
  if (error) throw new Error(error.message);
  return data;
}

/** Manual restore. (Full payment of the overdue invoice restores automatically via a database trigger.) */
export async function restoreWebsite(projectId: string, db: SupabaseClient = getAdminDb()) {
  const { data, error } = await db
    .from("websites")
    .update({ status: "live" })
    .eq("project_id", projectId)
    .eq("status", "suspended")
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("That website isn't suspended.");
  return data;
}

/** Status for a hostname: 'live' | 'suspended' | ... | null when we don't manage that host. */
export async function siteStatusForHost(host: string, db: SupabaseClient = getAdminDb()): Promise<string | null> {
  const { data, error } = await db.rpc("site_status_for_host", { p_host: host });
  if (error) throw new Error(error.message);
  return (data as string | null) ?? null;
}
