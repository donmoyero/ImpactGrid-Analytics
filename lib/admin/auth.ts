import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminDb } from "@/lib/supabase/admin";
import { PLATFORM_CONTINUE_URL } from "@/lib/platform";

/**
 * Gate for every admin page AND every admin server action (actions are public POST endpoints, so they must re-check).
 * Signed out -> /login. Signed in but not profiles.is_admin -> the platform (their real dashboard).
 */
export async function requireAdmin(): Promise<{ id: string; email: string | null }> {
  const { data: { user } } = await createClient().auth.getUser(); // validated with Supabase, not just the cookie
  if (!user) redirect("/login?next=/admin");
  const { data } = await getAdminDb().from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
  if (!data?.is_admin) redirect(PLATFORM_CONTINUE_URL);
  return { id: user.id, email: user.email ?? null };
}