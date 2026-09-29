import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminDb } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** Only same-site relative paths are allowed as a post-login destination. */
function safeNext(raw: string | null): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/\\") ? raw : "/dashboard";
}

/**
 * Where to go right after signing in.
 * Admins (profiles.is_admin) land in /admin; everyone else lands in /dashboard.
 * If a specific page was asked for (e.g. /login?next=/book-project) that page wins.
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const next = safeNext(searchParams.get("next"));

  const { data: { user } } = await createClient().auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);

  if (next === "/dashboard") {
    try {
      const { data } = await getAdminDb().from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
      if (data?.is_admin) return NextResponse.redirect(`${origin}/admin`);
    } catch (e) {
      console.error("admin check failed:", e); // fall through to the customer dashboard
    }
  }
  return NextResponse.redirect(`${origin}${next}`);
}
