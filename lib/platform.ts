/**
 * Where the business platform lives. Every "Get started" / "Sign in" link on the public
 * site uses these, so when the domain changes later you only edit this file (or set
 * NEXT_PUBLIC_PLATFORM_URL in Vercel), not every page.
 */
export const PLATFORM_URL = (process.env.NEXT_PUBLIC_PLATFORM_URL || "https://platform.impactgridanalytics.com").replace(/\/+$/, "");
export const PLATFORM_LOGIN_URL = `${PLATFORM_URL}/login`;
