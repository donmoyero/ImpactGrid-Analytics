import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeDestination } from "@/lib/platform";

export const dynamic = "force-dynamic";

/**
 * Google sign-in and email-confirmation links both land here with ?code=...
 * We exchange the code for a session, then hand off to /auth/continue (which re-validates ?next=).
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get("code");
  const next = safeDestination(searchParams.get("next"));
  if (!code) return NextResponse.redirect(`${origin}/login?error=1`);

  const { error } = await createClient().auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(`${origin}/login?error=1`);

  return NextResponse.redirect(`${origin}/auth/continue${next ? `?next=${encodeURIComponent(next)}` : ""}`);
}
