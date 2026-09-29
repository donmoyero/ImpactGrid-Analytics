import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client for server-side and CLI work. Bypasses RLS — never import into a Client Component.
 * Kept separate from lib/supabase/server.ts so scripts can use it without loading next/headers.
 */
export function getAdminDb(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
