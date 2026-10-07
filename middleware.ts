import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookieOptions } from "@/lib/supabase/cookie";

/**
 * Keeps a signed-in admin's session fresh on /admin pages (Server Components can't write refreshed cookies). Fails open.
 * Hostname-based suspension of business websites used to live here; it was removed with the old agency model and will be
 * rebuilt on the platform's businesses.status when business subdomains are served.
 */
export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return res;
  try {
    const supabase = createServerClient(url, anon, {
      cookieOptions,
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list: { name: string; value: string; options: CookieOptions }[]) => {
          list.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    });
    await supabase.auth.getUser();
  } catch (e) {
    console.error("session refresh failed:", e);
  }
  return res;
}

// Only the pages that read the session on the server.
export const config = { matcher: ["/admin/:path*", "/login", "/auth/:path*"] };
