import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Only same-site relative paths are allowed as a post-login destination. */
function safeNext(raw: string | null): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/\\") ? raw : "/dashboard";
}

/** Escape LIKE wildcards so an email such as a_b@x.com only matches itself. */
const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

/**
 * Google sign-in and email-confirmation links both land here with ?code=...
 * We exchange the code for a session, then attach the user to the client record that was booked with the same email.
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));
  if (!code) return NextResponse.redirect(`${origin}/login?error=1`);

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(`${origin}/login?error=1`);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    // Only link when the provider has verified the email (Google always has; password sign-ups after they click the email link).
    // Otherwise someone could sign up with a customer's email address and claim their project.
    if (user?.email && user.email_confirmed_at) {
      await createServiceRoleClient()
        .from("clients")
        .update({ user_id: user.id })
        .is("user_id", null)
        .ilike("contact_email", escapeLike(user.email));
    }
  } catch (e) {
    console.error("client link failed:", e); // never block sign-in because linking failed
  }
  // /auth/continue sends admins to /admin and customers to /dashboard.
  return NextResponse.redirect(`${origin}/auth/continue?next=${encodeURIComponent(next)}`);
}
