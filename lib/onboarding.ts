import { PLATFORM_URL } from "@/lib/platform";

/**
 * "Get started" questions. Answers travel to the platform as plain URL parameters (name, type, goals), inside the same
 * ?next= that already survives Google sign-in and the email-confirmation link, so nothing is stored on this site and
 * the flow still works if the confirmation email is opened on another device. The platform re-validates everything.
 */
export const BUSINESS_TYPES = [
  "Hair & beauty",
  "Barber shop",
  "Photography & media",
  "Fitness & wellness",
  "Restaurant & café",
  "Retail & products",
  "Health & clinic",
  "Consulting & services",
] as const;

/**
 * Everything a person can tick on the goals page. The first one they tick is where the platform starts them; the rest
 * are carried along too. Keep these ids in step with GOAL_IDS in the platform's lib/dashboard/self-serve.ts.
 */
export const GOALS = [
  { id: "bookings", label: "Get appointments" },
  { id: "website", label: "Get a website" },
  { id: "products", label: "Sell products" },
  { id: "services", label: "Sell services" },
  { id: "team", label: "Manage my team" },
  { id: "invoices", label: "Send invoices" },
  { id: "local", label: "Promote a physical business" },
  { id: "showcase", label: "Showcase work or expertise" },
  { id: "contact", label: "Offer a contact form" },
  { id: "blog", label: "Publish a blog or other media" },
  { id: "community", label: "Build community" },
  { id: "memberships", label: "Sell memberships" },
  { id: "courses", label: "Sell online courses" },
  { id: "videos", label: "Sell on-demand videos" },
  { id: "events", label: "Sell access to group events" },
  { id: "donations", label: "Collect donations" },
] as const;

export type GoalId = (typeof GOALS)[number]["id"];
export type OnboardingAnswers = { name: string; type: string; goals: string[] };
/** What the cleaners accept: goals as a list or a comma string, and the old single `goal` from links made before multiple goals. */
export type RawAnswers = { name?: string; type?: string; goals?: readonly string[] | string | null; goal?: string };

export const NAME_MAX = 80; // matches create_my_business()
export const TYPE_MAX = 60;

const GOAL_IDS: readonly string[] = GOALS.map((g) => g.id);

/** Keeps only known goals, once each, in the order given. Accepts a list or a comma-separated string. */
export function cleanGoals(raw: readonly string[] | string | null | undefined): string[] {
  const list: readonly string[] = typeof raw === "string" ? raw.split(",") : raw ?? [];
  const out: string[] = [];
  for (const item of list) {
    const id = String(item).trim();
    if (GOAL_IDS.includes(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

/** Trims, caps lengths and drops unknown goals. Safe to call on anything. */
export function cleanAnswers(raw: RawAnswers): OnboardingAnswers {
  const name = String(raw.name ?? "").replace(/\s+/g, " ").trim().slice(0, NAME_MAX);
  const type = String(raw.type ?? "").replace(/\s+/g, " ").trim().slice(0, TYPE_MAX);
  let goals = cleanGoals(raw.goals);
  if (goals.length === 0 && raw.goal) goals = cleanGoals(raw.goal);
  return { name, type, goals };
}

/**
 * The platform page that finishes setup (and creates the business) once the person is signed in.
 * Sends every goal as `goals` (comma-separated, first = where to start) and the first one as `goal` too, so a platform
 * that has not been updated yet still lands them in the right place.
 */
export function buildStartUrl(answers: RawAnswers): string {
  const a = cleanAnswers(answers);
  const qs = new URLSearchParams();
  if (a.name) qs.set("name", a.name);
  if (a.type) qs.set("type", a.type);
  if (a.goals.length) {
    qs.set("goals", a.goals.join(","));
    qs.set("goal", a.goals[0]);
  }
  const q = qs.toString();
  return `${PLATFORM_URL}/start${q ? `?${q}` : ""}`;
}

/* ───────────── Step-by-step flow (one page per question) ─────────────
   Each step is its own page: /get-started, /get-started/goal, /get-started/name, /get-started/account.
   The answers so far ride along in the address (?type=…&goals=…&name=…), so the back button, a refresh and a
   shared link all behave, and nothing is stored on this site. Every page re-cleans what it reads. */

export const STEPS = [
  { id: "type", label: "Business", path: "/get-started" },
  { id: "goal", label: "Goal", path: "/get-started/goal" },
  { id: "name", label: "Name", path: "/get-started/name" },
  { id: "account", label: "Account", path: "/get-started/account" },
] as const;

export type StepIndex = 0 | 1 | 2 | 3;

export const NAME_MIN = 2;

/** Reads the answers from a page's ?search params. Safe on anything (arrays, missing values, junk). */
export function answersFromParams(params: Record<string, string | string[] | undefined>): OnboardingAnswers {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  return cleanAnswers({ name: one(params.name), type: one(params.type), goals: one(params.goals), goal: one(params.goal) });
}

/** The page for a step, carrying the answers given so far. */
export function stepUrl(step: number, answers: RawAnswers): string {
  const i = Math.min(Math.max(Math.trunc(step) || 0, 0), STEPS.length - 1);
  const a = cleanAnswers(answers);
  const qs = new URLSearchParams();
  if (a.type) qs.set("type", a.type);
  if (a.goals.length) qs.set("goals", a.goals.join(","));
  if (a.name) qs.set("name", a.name);
  const q = qs.toString();
  return `${STEPS[i].path}${q ? `?${q}` : ""}`;
}

/** Whether the answer a step asks for has been given. */
export function stepDone(step: number, answers: RawAnswers): boolean {
  const a = cleanAnswers(answers);
  if (step === 0) return a.type.length > 0;
  if (step === 1) return a.goals.length > 0;
  if (step === 2) return a.name.length >= NAME_MIN;
  return true;
}

/** The first earlier step still missing an answer, or null when it is fine to be on `step`. Used to send people back. */
export function firstMissingStep(step: number, answers: RawAnswers): number | null {
  for (let i = 0; i < step; i++) if (!stepDone(i, answers)) return i;
  return null;
}

/** What each goal adds to the live preview: a menu word, the main button and a headline. `{name}` is replaced by the business name. */
const PREVIEW: Record<string, { nav?: string; cta: string; headline: string }> = {
  bookings: { nav: "Appointments", cta: "Book now", headline: "Book your next visit in seconds" },
  website: { nav: "About", cta: "Get in touch", headline: "Welcome to {name}" },
  products: { nav: "Shop", cta: "Shop now", headline: "Made with care, ready when you are" },
  services: { nav: "Services", cta: "Enquire now", headline: "Services built around you" },
  team: { nav: "Our team", cta: "Contact us", headline: "A great team, well looked after" },
  invoices: { cta: "Get in touch", headline: "Welcome to {name}" },
  local: { nav: "Find us", cta: "Get directions", headline: "Come and see us" },
  showcase: { nav: "Our work", cta: "See our work", headline: "Work we are proud of" },
  contact: { nav: "Contact", cta: "Contact us", headline: "We would love to hear from you" },
  blog: { nav: "Blog", cta: "Read more", headline: "Stories and ideas worth sharing" },
  community: { nav: "Community", cta: "Join us", headline: "Better together" },
  memberships: { nav: "Membership", cta: "Join now", headline: "Become a member" },
  courses: { nav: "Courses", cta: "Start learning", headline: "Learn at your own pace" },
  videos: { nav: "Videos", cta: "Watch now", headline: "Watch whenever you like" },
  events: { nav: "Events", cta: "Get tickets", headline: "Join us at our next event" },
  donations: { nav: "Donate", cta: "Donate", headline: "Every contribution makes a difference" },
};

/** Words for the live site preview on the name step: the menu grows with each goal ticked, the first goal sets the button and headline. Plain text only; the page escapes it. */
export function previewCopy(answers: RawAnswers): { title: string; links: string[]; cta: string; headline: string; sub: string } {
  const a = cleanAnswers(answers);
  const title = a.name || "Your business";
  const first = PREVIEW[a.goals[0]] ?? { cta: "Get in touch", headline: "Welcome to {name}" };
  const links: string[] = [];
  for (const g of a.goals) {
    const nav = PREVIEW[g]?.nav;
    if (nav && !links.includes(nav)) links.push(nav);
  }
  for (const filler of ["About", "Contact"]) if (links.length < 3 && !links.includes(filler)) links.push(filler);
  return { title, links: links.slice(0, 4), cta: first.cta, headline: first.headline.replace("{name}", title), sub: a.type };
}
