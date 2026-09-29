import { createBrowserClient } from "@supabase/ssr";

/**
 * Use inside Client Components ("use client").
 * Reads the public URL + anon key from env — point these at your
 * existing Supabase project.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
