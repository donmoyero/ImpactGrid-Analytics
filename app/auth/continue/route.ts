import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminDb } from "@/lib/supabase/admin";
import { PLATFORM_URL } from "@/lib/platform";

export const dynamic = "force-dynamic";

/** Only /admin pages are valid destinations on this site; anything else falls back to /admin. */
function safeNext(raw: string | null): string {
  return raw && /^\/admin(\/|$)/.test(raw) ? raw : "/admin";
}

/**
 * Where to go right after signing in on the main site.
 * Admins (profiles.is_admin) land in /admin (the homepage editor); everyone else goes to the platform.
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const next = safeNext(searchParams.get("next"));

  const { data: { user } } = await createClient().auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);

  try {
    const { data } = await getAdminDb()
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (data?.is_admin) return NextResponse.redirect(`${origin}${next}`);
  } catch (e) {
    console.error("admin check failed:", e); // fall through to the platform
  }

  return NextResponse.redirect(PLATFORM_URL);
}