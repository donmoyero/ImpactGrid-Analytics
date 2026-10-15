import type { NextRequest, NextResponse } from "next/server";
import { cookieOptions } from "@/lib/supabase/cookie";

/**
 * Every domain a sign-in cookie may have been stored under: this host only (no Domain), the shared domain from
 * NEXT_PUBLIC_COOKIE_DOMAIN, and each parent domain of this host. Cookies with the same name but a different Domain
 * are separate cookies, and the browser can only remove the one whose Domain matches, so sign-out removes all of them.
 */
export function cookieDomains(host: string): (string | undefined)[] {
  const out = new Set<string | undefined>([undefined]);
  if (cookieOptions?.domain) out.add(cookieOptions.domain);
  const parts = host.split(".");
  for (let i = 0; i <= parts.length - 2; i++) out.add(parts.slice(i).join("."));
  return [...out];
}

/** Expires every Supabase auth cookie (sb-...) the browser sent, under every domain it might have been set with. */
export function clearAuthCookies(req: NextRequest, res: NextResponse): void {
  const host = (req.headers.get("host") ?? req.nextUrl.hostname).replace(/:\d{1,5}$/, "").toLowerCase();
  const domains = cookieDomains(host);
  for (const { name } of req.cookies.getAll()) {
    if (!name.startsWith("sb-")) continue;
    for (const domain of domains) {
      res.cookies.set(name, "", { path: "/", maxAge: 0, expires: new Date(0), ...(domain ? { domain } : {}) });
    }
  }
}

/**
 * Sign-out is a POST, so another website cannot sign someone out with a link. Browsers say where a request came from in
 * Sec-Fetch-Site: our own pages (and our own sibling hosts, e.g. the main site and the platform) are allowed.
 * A browser that sends nothing is allowed (SameSite cookies still apply).
 */
export function isTrustedSignOut(req: NextRequest): boolean {
  const site = req.headers.get("sec-fetch-site");
  return !site || site === "same-origin" || site === "same-site" || site === "none";
}
