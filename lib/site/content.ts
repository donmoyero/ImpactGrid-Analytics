/** Homepage content: types, defaults (= the original copy), validation, and the public read. */
export interface HomepageContent {
  announcement: { text: string; href: string };
  hero: { eyebrow: string; line1: string; line2: string; sub: string; primaryLabel: string; secondaryLabel: string; imageUrl: string };
  stats: { value: string; label: string }[];
  work: { title: string; category: string; url: string; imageUrl: string; blurb: string }[];
  reviews: { quote: string; name: string; role: string }[];
  cta: { heading: string; button: string };
}

export const DEFAULT_HOMEPAGE: HomepageContent = {
  announcement: { text: "", href: "" },
  hero: {
    eyebrow: "Website studio",
    line1: "Your business.",
    line2: "Built for the web.",
    sub: "Websites, e-commerce and digital business systems designed around how you actually work.",
    primaryLabel: "Start building",
    secondaryLabel: "Explore packages",
    imageUrl: "",
  },
  stats: [],
  work: [],
  reviews: [],
  cta: { heading: "Tell us what you do. We'll take it from there.", button: "Start your project" },
};

export const LIMITS = { stats: 4, work: 6, reviews: 6 };

const req = (v: unknown, max: number, def: string) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : def);
const opt = (v: unknown, max: number, def = "") => (typeof v === "string" ? v.trim().slice(0, max) : def);
/** Only http(s) or same-site paths: blocks javascript: and other schemes. */
const href = (v: unknown) => {
  const t = opt(v, 500);
  return /^https?:\/\//i.test(t) || (t.startsWith("/") && !t.startsWith("//")) ? t : "";
};
const img = (v: unknown) => {
  const t = opt(v, 600);
  return /^https:\/\//i.test(t) ? t : "";
};
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
function list<T>(v: unknown, max: number, map: (x: Record<string, unknown>) => T | null): T[] {
  if (!Array.isArray(v)) return [];
  return v.slice(0, max).map((x) => map(obj(x))).filter((x): x is T => x !== null);
}

/** Accepts anything (database value or admin form) and returns safe, complete content. Used on both write and read. */
export function sanitizeHomepage(input: unknown): HomepageContent {
  const d = DEFAULT_HOMEPAGE;
  const i = obj(input);
  const a = obj(i.announcement);
  const h = obj(i.hero);
  const c = obj(i.cta);
  const text = opt(a.text, 140);
  return {
    announcement: { text, href: text ? href(a.href) : "" },
    hero: {
      eyebrow: opt(h.eyebrow, 40, d.hero.eyebrow),
      line1: req(h.line1, 60, d.hero.line1),
      line2: req(h.line2, 60, d.hero.line2),
      sub: req(h.sub, 260, d.hero.sub),
      primaryLabel: req(h.primaryLabel, 30, d.hero.primaryLabel),
      secondaryLabel: opt(h.secondaryLabel, 30, d.hero.secondaryLabel),
      imageUrl: img(h.imageUrl),
    },
    stats: list(i.stats, LIMITS.stats, (x) => {
      const value = opt(x.value, 16), label = opt(x.label, 50);
      return value && label ? { value, label } : null;
    }),
    work: list(i.work, LIMITS.work, (x) => {
      const title = opt(x.title, 80);
      return title ? { title, category: opt(x.category, 40), url: href(x.url), imageUrl: img(x.imageUrl), blurb: opt(x.blurb, 200) } : null;
    }),
    reviews: list(i.reviews, LIMITS.reviews, (x) => {
      const quote = opt(x.quote, 400), name = opt(x.name, 60);
      return quote && name ? { quote, name, role: opt(x.role, 60) } : null;
    }),
    cta: { heading: req(c.heading, 120, d.cta.heading), button: req(c.button, 30, d.cta.button) },
  };
}

/** Public read (anon key, cached 60s, refreshed instantly when the admin saves). Falls back to the defaults on any error. */
export async function getHomepageContent(): Promise<HomepageContent> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return DEFAULT_HOMEPAGE;
  try {
    const res = await fetch(`${url}/rest/v1/site_content?key=eq.homepage&select=value`, {
      headers: { apikey: anon, Authorization: `Bearer ${anon}` },
      next: { revalidate: 60, tags: ["homepage"] },
    });
    if (!res.ok) return DEFAULT_HOMEPAGE;
    const rows = (await res.json()) as { value: unknown }[];
    return rows.length ? sanitizeHomepage(rows[0].value) : DEFAULT_HOMEPAGE;
  } catch {
    return DEFAULT_HOMEPAGE;
  }
}
