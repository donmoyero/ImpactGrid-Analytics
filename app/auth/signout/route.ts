import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { clearAuthCookies, isTrustedSignOut } from "@/lib/supabase/signout";

export const dynamic = "force-dynamic";

/**
 * Signs the person out on the server and removes every sign-in cookie on this host, whatever Domain it was set with.
 * Used by this site's Sign out button, and by the platform's, which posts here after clearing its own cookies.
 */
export async function POST(req: NextRequest) {
  if (!isTrustedSignOut(req)) return new NextResponse("Forbidden", { status: 403 });
  try {
    await createClient().auth.signOut();
  } catch {
    // clear the cookies anyway
  }
  const res = NextResponse.redirect(`${req.nextUrl.origin}/`, 303);
  clearAuthCookies(req, res);
  return res;
}
