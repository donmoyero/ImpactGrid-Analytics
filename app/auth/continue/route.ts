import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveDestination, safeDestination } from "@/lib/platform";

export const dynamic = "force-dynamic";

/**
 * Where to go right after signing in on the main site.
 * An explicit, validated ?next= wins (a path on this site, or a URL on the platform).
 * Otherwise everyone goes to the platform, which sends platform admins to /admin and everyone else to /dashboard.
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);
  return NextResponse.redirect(resolveDestination(safeDestination(searchParams.get("next")), origin));
}
