/** Homepage content: types, defaults (= the original copy), validation, and the public read. */

export const BUILTIN_TYPES = [
  "announcement", "hero", "stats", "idea", "domain", "how", "examples", "platform", "ai",
  "work", "reviews", "careplan", "services", "packages", "cta",
] as const;
export const WIDGET_TYPES = ["text", "imageText", "cards", "faq", "video", "gallery", "banner", "divider"] as const;
export type BuiltinType = (typeof BUILTIN_TYPES)[number];
export type WidgetType = (typeof WIDGET_TYPES)[number];

export type WidgetData =
  | { type: "text"; eyebrow: string; heading: string; body: string; buttonLabel: string; buttonHref: string; align: "left" | "center" }
  | { type: "imageText"; heading: string; body: string; imageUrl: string; imageSide: "left" | "right"; buttonLabel: string; buttonHref: string }
  | { type: "cards"; eyebrow: string; heading: string; items: { title: string; text: string }[] }
  | { type: "faq"; heading: string; items: { q: string; a: string }[] }
  | { type: "video"; heading: string; url: string }
  | { type: "gallery"; heading: string; images: string[] }
  | { type: "banner"; heading: string; text: string; buttonLabel: string; buttonHref: string }
  | { type: "divider" };

export type Block = { id: string; type: BuiltinType } | ({ id: string } & WidgetData);

export interface HomepageContent {
  announcement: { text: string; href: string };
  hero: { eyebrow: string; line1: string; line2: string; sub: string; primaryLabel: string; secondaryLabel: string; imageUrl: string };
  stats: { value: string; label: string }[];
  work: { title: string; category: string; url: string; imageUrl: string; blurb: string }[];
  reviews: { quote: string; name: string; role: string }[];
  cta: { heading: string; button: string };
  idea: { eyebrow: string; heading: string; items: { title: string; detail: string }[] };
  domain: { eyebrow: string; heading: string; text: string; label: string; placeholder: string; button: string };
  how: { eyebrow: string; steps: { label: string; detail: string }[] };
  ai: { eyebrow: string; heading: string; items: { area: string; prompt: string }[] };
  careplan: { eyebrow: string; heading: string; text: string; healthTitle: string; rows: { k: string; v: string }[] };
  services: { eyebrow: string; heading: string; linkLabel: string; items: { name: string; detail: string }[] };
  /** Ordered list of everything shown on the page. Delete a block to hide it; add it back from the picker. */
  blocks: Block[];
}

/** A lean homepage. How it works, Domain, Examples, Platform and AI live on their own pages; Packages and Care Plan live on Pricing. */
export const HOME_DEFAULT: BuiltinType[] = ["announcement", "hero", "stats", "idea", "work", "reviews", "cta"];
export const DEFAULT_BLOCKS: Block[] = HOME_DEFAULT.map((t) => ({ id: t, type: t }));
/** Standard sections that also appear on another page, so they can still be edited when they're not on the homepage. */
export const OTHER_PAGE: Partial<Record<BuiltinType, string>> = {
  how: "How it works page",
  domain: "How it works page",
  ai: "Services page",
};

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
  idea: {
    eyebrow: "Start with an idea",
    heading: "You bring the idea. We build the infrastructure.",
    items: [
      { title: "Tell us", detail: "Describe your business and what you need." },
      { title: "Show us", detail: "Upload a design, screenshot or inspiration." },
      { title: "Draw it", detail: "Sketch your idea and we build the prototype." },
    ],
  },
  domain: {
    eyebrow: "Your domain",
    heading: "Your website starts with the right address.",
    text: "Tell us the address you want. We check it and register it as part of your build.",
    label: "Domain you would like",
    placeholder: "yourbusiness.co.uk",
    button: "Continue",
  },
  how: {
    eyebrow: "How it works",
    steps: [
      { label: "Choose", detail: "Package and domain." },
      { label: "Show", detail: "Tell us what you want or draw your idea." },
      { label: "Approve", detail: "We review the project and issue your invoice." },
      { label: "Build", detail: "Design, development, testing." },
      { label: "Launch", detail: "Your website goes live." },
      { label: "Manage", detail: "You control your website through ImpactGrid Analytics where your package supports it." },
    ],
  },
  ai: {
    eyebrow: "AI, Business package",
    heading: "AI that works with your business.",
    items: [
      { area: "Content", prompt: "Write a product description." },
      { area: "Marketing", prompt: "Create a campaign for our weekend sale." },
      { area: "Products", prompt: "Suggest descriptions for these 20 products." },
      { area: "Website", prompt: "Create a new promotional section." },
      { area: "Business", prompt: "Summarise this month's sales." },
    ],
  },
  careplan: {
    eyebrow: "Care Plan",
    heading: "Your website stays looked after. First year included.",
    text: "Hosting, SSL, backups, security updates and monitoring.",
    healthTitle: "Website health",
    rows: [
      { k: "SSL", v: "Protected" },
      { k: "Hosting", v: "Active" },
      { k: "Backups", v: "Daily" },
      { k: "Monitoring", v: "Active" },
      { k: "Care Plan", v: "Active" },
    ],
  },
  services: {
    eyebrow: "What we build",
    heading: "One studio, every piece of your web presence.",
    linkLabel: "All services →",
    items: [
      { name: "Business websites", detail: "Clean, fast sites that convert visitors into enquiries." },
      { name: "E-commerce & booking", detail: "Sell products or take bookings without the friction." },
      { name: "Brand identity", detail: "Logo, colour, and voice, sorted before launch." },
      { name: "SEO & Google Business", detail: "Be findable the day your site goes live." },
    ],
  },
  blocks: DEFAULT_BLOCKS,
};

export const LIMITS = { services: 8, health: 8, stats: 4, work: 6, reviews: 6, blocks: 40, cards: 6, faq: 10, gallery: 8 };

export const BUILTIN_LABELS: Record<BuiltinType, string> = {
  announcement: "Announcement bar", hero: "Top section", stats: "Numbers", idea: "Start with an idea",
  domain: "Domain search", how: "How it works", examples: "Industry examples", platform: "Business platform",
  ai: "AI examples", work: "Our work", reviews: "Client reviews", careplan: "Care Plan",
  services: "What we build", packages: "Packages", cta: "Bottom call to action",
};
/** Built-ins whose words you can edit here. Industry examples, Business platform and Packages stay fixed (Packages follows your prices in code). */
export const EDITABLE_BUILTINS: BuiltinType[] = ["announcement", "hero", "stats", "idea", "domain", "how", "ai", "work", "reviews", "careplan", "services", "cta"];

export const WIDGET_LABELS: Record<WidgetType, { name: string; hint: string }> = {
  text: { name: "Text", hint: "Heading, paragraph and optional button." },
  imageText: { name: "Image + text", hint: "A photo beside a heading and paragraph." },
  cards: { name: "Feature cards", hint: "A grid of up to 6 cards with a title and short text." },
  faq: { name: "FAQ", hint: "Questions that open to show the answer." },
  video: { name: "Video", hint: "A YouTube or Vimeo video." },
  gallery: { name: "Photo gallery", hint: "Up to 8 photos in a grid." },
  banner: { name: "Banner", hint: "A dark call-out with a button." },
  divider: { name: "Spacer", hint: "Empty space between sections." },
};

export function newWidget(type: WidgetType): Block {
  const id = `w-${Math.random().toString(36).slice(2, 10)}`;
  switch (type) {
    case "text": return { id, type, eyebrow: "", heading: "", body: "", buttonLabel: "", buttonHref: "", align: "left" };
    case "imageText": return { id, type, heading: "", body: "", imageUrl: "", imageSide: "right", buttonLabel: "", buttonHref: "" };
    case "cards": return { id, type, eyebrow: "", heading: "", items: [{ title: "", text: "" }] };
    case "faq": return { id, type, heading: "", items: [{ q: "", a: "" }] };
    case "video": return { id, type, heading: "", url: "" };
    case "gallery": return { id, type, heading: "", images: [] };
    case "banner": return { id, type, heading: "", text: "", buttonLabel: "", buttonHref: "" };
    case "divider": return { id, type };
  }
}

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

/** YouTube / Vimeo link -> safe embed URL, or "" for anything else. */
export function videoEmbedUrl(raw: string): string {
  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, "");
    let id = "";
    if (host === "youtu.be") id = u.pathname.slice(1);
    else if (host === "youtube.com" || host === "m.youtube.com") id = u.pathname === "/watch" ? u.searchParams.get("v") ?? "" : u.pathname.split("/").filter(Boolean).pop() ?? "";
    if (id && /^[\w-]{6,20}$/.test(id)) return `https://www.youtube-nocookie.com/embed/${id}`;
    if (host === "vimeo.com") {
      const v = u.pathname.split("/").filter(Boolean).pop() ?? "";
      if (/^\d{5,12}$/.test(v)) return `https://player.vimeo.com/video/${v}`;
    }
  } catch {}
  return "";
}

function sanitizeWidget(type: WidgetType, x: Record<string, unknown>): WidgetData {
  switch (type) {
    case "text":
      return { type, eyebrow: opt(x.eyebrow, 40), heading: opt(x.heading, 120), body: opt(x.body, 1500), buttonLabel: opt(x.buttonLabel, 30), buttonHref: href(x.buttonHref), align: x.align === "center" ? "center" : "left" };
    case "imageText":
      return { type, heading: opt(x.heading, 120), body: opt(x.body, 1200), imageUrl: img(x.imageUrl), imageSide: x.imageSide === "left" ? "left" : "right", buttonLabel: opt(x.buttonLabel, 30), buttonHref: href(x.buttonHref) };
    case "cards":
      return { type, eyebrow: opt(x.eyebrow, 40), heading: opt(x.heading, 120), items: list(x.items, LIMITS.cards, (i) => { const title = opt(i.title, 60), text = opt(i.text, 240); return title || text ? { title, text } : null; }) };
    case "faq":
      return { type, heading: opt(x.heading, 120), items: list(x.items, LIMITS.faq, (i) => { const q = opt(i.q, 160), a = opt(i.a, 800); return q && a ? { q, a } : null; }) };
    case "video":
      return { type, heading: opt(x.heading, 120), url: videoEmbedUrl(opt(x.url, 300)) ? opt(x.url, 300) : "" };
    case "gallery":
      return { type, heading: opt(x.heading, 120), images: (Array.isArray(x.images) ? x.images : []).slice(0, LIMITS.gallery).map(img).filter(Boolean) };
    case "banner":
      return { type, heading: opt(x.heading, 120), text: opt(x.text, 300), buttonLabel: opt(x.buttonLabel, 30), buttonHref: href(x.buttonHref) };
    case "divider":
      return { type };
  }
}

function sanitizeBlocks(v: unknown): Block[] {
  if (!Array.isArray(v)) return DEFAULT_BLOCKS; // older saves have no layout: show the original page
  const seen = new Set<string>();
  const seenBuiltin = new Set<string>();
  const out: Block[] = [];
  for (const raw of v.slice(0, LIMITS.blocks)) {
    const b = obj(raw);
    const type = String(b.type ?? "");
    if ((BUILTIN_TYPES as readonly string[]).includes(type)) {
      if (seenBuiltin.has(type)) continue; // each standard section can appear once
      seenBuiltin.add(type);
      out.push({ id: type, type: type as BuiltinType });
    } else if ((WIDGET_TYPES as readonly string[]).includes(type)) {
      const id = /^[\w-]{1,40}$/.test(String(b.id ?? "")) ? String(b.id) : `w-${Math.random().toString(36).slice(2, 10)}`;
      if (seen.has(id)) continue;
      seen.add(id);
      out.push({ id, ...sanitizeWidget(type as WidgetType, b) } as Block);
    }
  }
  return out;
}

/** Fixed-length list: keeps the layout's item count, takes any edited text, never lets a field go blank. */
function fixedList<T extends Record<string, string>>(v: unknown, defaults: T[], max: Record<keyof T, number>): T[] {
  const src = Array.isArray(v) ? v : [];
  return defaults.map((d, i) => {
    const x = obj(src[i]);
    const out = {} as Record<string, string>;
    for (const k of Object.keys(d)) out[k] = req(x[k], max[k as keyof T], d[k]);
    return out as T;
  });
}

/** Accepts anything (database value or admin form) and returns safe, complete content. Used on both write and read. */
export function sanitizeHomepage(input: unknown): HomepageContent {
  const d = DEFAULT_HOMEPAGE;
  const i = obj(input);
  const a = obj(i.announcement);
  const h = obj(i.hero);
  const c = obj(i.cta);
  const id = obj(i.idea), dm = obj(i.domain), hw = obj(i.how), ai = obj(i.ai), cp = obj(i.careplan), sv = obj(i.services);
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
    idea: {
      eyebrow: opt(id.eyebrow, 40, d.idea.eyebrow),
      heading: req(id.heading, 120, d.idea.heading),
      items: fixedList(id.items, d.idea.items, { title: 40, detail: 140 }),
    },
    domain: {
      eyebrow: opt(dm.eyebrow, 40, d.domain.eyebrow),
      heading: req(dm.heading, 120, d.domain.heading),
      text: req(dm.text, 260, d.domain.text),
      label: req(dm.label, 60, d.domain.label),
      placeholder: req(dm.placeholder, 60, d.domain.placeholder),
      button: req(dm.button, 30, d.domain.button),
    },
    how: { eyebrow: opt(hw.eyebrow, 40, d.how.eyebrow), steps: fixedList(hw.steps, d.how.steps, { label: 24, detail: 140 }) },
    ai: {
      eyebrow: opt(ai.eyebrow, 40, d.ai.eyebrow),
      heading: req(ai.heading, 120, d.ai.heading),
      items: fixedList(ai.items, d.ai.items, { area: 24, prompt: 120 }),
    },
    careplan: {
      eyebrow: opt(cp.eyebrow, 40, d.careplan.eyebrow),
      heading: req(cp.heading, 120, d.careplan.heading),
      text: req(cp.text, 260, d.careplan.text),
      healthTitle: req(cp.healthTitle, 40, d.careplan.healthTitle),
      rows: Array.isArray(cp.rows)
        ? list(cp.rows, LIMITS.health, (x) => { const k = opt(x.k, 30), v = opt(x.v, 30); return k && v ? { k, v } : null; })
        : d.careplan.rows,
    },
    services: {
      eyebrow: opt(sv.eyebrow, 40, d.services.eyebrow),
      heading: req(sv.heading, 120, d.services.heading),
      linkLabel: opt(sv.linkLabel, 30, d.services.linkLabel),
      items: Array.isArray(sv.items)
        ? list(sv.items, LIMITS.services, (x) => { const name = opt(x.name, 50), detail = opt(x.detail, 160); return name ? { name, detail } : null; })
        : d.services.items,
    },
    blocks: sanitizeBlocks(i.blocks),
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
