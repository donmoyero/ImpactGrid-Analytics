/**
 * Sign-in cookie settings shared by every Supabase client (browser, server, middleware).
 * In production, set NEXT_PUBLIC_COOKIE_DOMAIN=.shopplug.uk so the main site and
 * platform.shopplug.uk share one sign-in. Leave it unset locally and on preview URLs.
 */
const domain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN?.trim();

export const cookieOptions = domain ? { domain } : undefined;
