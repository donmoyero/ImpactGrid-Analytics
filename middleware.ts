import { NextRequest, NextResponse } from "next/server";

/**
 * Application-layer enforcement of website suspension.
 *
 * Every request for a hostname that belongs to a suspended website gets an HTTP 503 from the server,
 * before any page, API route or asset is served. The frontend can't bypass it.
 * The ImpactGrid site itself (NEXT_PUBLIC_APP_URL host, localhost, *.vercel.app, OWN_HOSTS) is never checked.
 *
 * Fails OPEN if the lookup errors (a database blip must not take every client site offline).
 */
const CACHE_MS = 30_000;
const LOOKUP_TIMEOUT_MS = 1_500;
const cache = new Map<string, { suspended: boolean; at: number }>();

const norm = (h: string) => h.toLowerCase().split(":")[0].replace(/\.$/, "").replace(/^www\./, "");

function isOwnHost(host: string): boolean {
  if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".vercel.app")) return true;
  const own = new Set<string>();
  try {
    if (process.env.NEXT_PUBLIC_APP_URL) own.add(norm(new URL(process.env.NEXT_PUBLIC_APP_URL).host));
  } catch {}
  own.add("impactgridanalytics.com");
  for (const h of (process.env.OWN_HOSTS ?? "").split(",")) if (h.trim()) own.add(norm(h.trim()));
  return own.has(host);
}

async function isSuspended(host: string): Promise<boolean> {
  const hit = cache.get(host);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.suspended;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return false;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), LOOKUP_TIMEOUT_MS);
  try {
    const res = await fetch(`${url}/rest/v1/rpc/site_status_for_host`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_host: host }),
      signal: ctrl.signal,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`lookup ${res.status}`);
    const suspended = (await res.json()) === "suspended";
    cache.set(host, { suspended, at: Date.now() });
    return suspended;
  } catch (e) {
    console.error("suspension lookup failed (failing open):", e);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

const PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Temporarily unavailable</title>
<style>body{font-family:system-ui,sans-serif;background:#0b1020;color:#e8ecf5;display:grid;place-items:center;min-height:100vh;margin:0;padding:1rem;text-align:center}
main{max-width:30rem}h1{font-size:1.5rem}p{color:#9aa4bd;line-height:1.5}</style></head>
<body><main><h1>This website is temporarily unavailable</h1>
<p>It has been taken offline for now. If you own this website, please contact your web provider.</p></main></body></html>`;

export async function middleware(req: NextRequest) {
  const host = norm(req.headers.get("host") ?? req.nextUrl.host);
  if (!host || isOwnHost(host)) return NextResponse.next();

  if (await isSuspended(host)) {
    return new NextResponse(PAGE, {
      status: 503,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Retry-After": "86400",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex",
      },
    });
  }
  return NextResponse.next();
}

// Everything except Next's own static assets.
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
