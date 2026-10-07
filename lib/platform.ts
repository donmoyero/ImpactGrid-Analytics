/**
 * The main site is the single front door: people sign in / create an account HERE (LOGIN_URL),
 * then are handed to the platform, which is the dashboard for every role (owner, admin, staff...).
 *
 * Every "Get started" / "Sign in" link on the public site uses these, so when a domain changes
 * you only edit this file (or set NEXT_PUBLIC_PLATFORM_URL in Vercel), not every page.
 */
export const PLATFORM_URL = (process.env.NEXT_PUBLIC_PLATFORM_URL || "https://platform.impactgridanalytics.com").replace(/\/+$/, "");

/** The main site's own sign-in / create-account page. */
export const LOGIN_URL = "/login";

/**
 * Where a signed-in person goes to use the platform. The platform's /auth/continue decides the rest
 * (platform admins -> /admin, everyone else -> /dashboard).
 */
export const PLATFORM_CONTINUE_URL = `${PLATFORM_URL}/auth/continue`;

/**
 * The only places a post-login redirect may go: a path on this site, or a URL on the platform.
 * Anything else (another host, "//evil.com", "/\evil.com", control characters) returns null, and the
 * caller falls back to the default. This is the open-redirect guard for /login, /auth/callback and /auth/continue.
 */
export function safeDestination(raw: string | null | undefined): string | null {
  if (!raw || /[\u0000-\u001f\u007f]/.test(raw)) return null;
  if (raw.startsWith("/")) return raw.startsWith("//") || raw.startsWith("/\\") ? null : raw;
  try {
    const url = new URL(raw);
    const platform = new URL(PLATFORM_URL);
    const web = url.protocol === "https:" || url.protocol === "http:";
    if (web && url.origin === platform.origin && !url.username && !url.password) return url.toString();
  } catch {
    // not a URL: refuse
  }
  return null;
}

/** Turns a safe destination into an absolute URL for a redirect response. */
export const resolveDestination = (dest: string | null, origin: string) =>
  dest ? (dest.startsWith("/") ? `${origin}${dest}` : dest) : PLATFORM_CONTINUE_URL;
