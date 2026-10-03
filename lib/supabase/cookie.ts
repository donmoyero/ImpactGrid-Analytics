/**
 * Sign-in cookie settings shared by every Supabase client (browser, server, middleware).
 * In production, set NEXT_PUBLIC_COOKIE_DOMAIN=.impactgridanalytics.com so the main site and
 * platform.impactgridanalytics.com share one sign-in. Leave it unset locally and on preview URLs.
 */
const domain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN?.trim();

export const cookieOptions = domain ? { domain } : undefined;
