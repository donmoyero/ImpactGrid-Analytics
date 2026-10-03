import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Only same-site relative paths are allowed as a post-login destination. */
function safeNext(raw: string | null): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/\\") ? raw : "/admin";
}

/**
 * Google sign-in and email-confirmation links both land here with ?code=...
 * We exchange the code for a session, then hand off to /auth/continue.
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));
  if (!code) return NextResponse.redirect(`${origin}/login?error=1`);

  const { error } = await createClient().auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(`${origin}/login?error=1`);

  // /auth/continue sends admins to /admin and everyone else to the platform.
  return NextResponse.redirect(`${origin}/auth/continue?next=${encodeURIComponent(next)}`);
}