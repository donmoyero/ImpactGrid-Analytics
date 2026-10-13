import { PLATFORM_URL } from "@/lib/platform";

/**
 * "Get started" questions. Answers travel to the platform as plain URL parameters (name, type, goal), inside the same
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

export const GOALS = [
  { id: "bookings", label: "Take bookings", hint: "Services, appointments and your calendar" },
  { id: "website", label: "Get a website", hint: "A site for your business, ready to share" },
  { id: "products", label: "Sell products", hint: "Products, stock and photos" },
  { id: "team", label: "Manage my team", hint: "Staff, roles, time clock and pay" },
] as const;

export type GoalId = (typeof GOALS)[number]["id"];
export type OnboardingAnswers = { name: string; type: string; goal: string };

export const NAME_MAX = 80; // matches create_my_business()
export const TYPE_MAX = 60;

const GOAL_IDS: readonly string[] = GOALS.map((g) => g.id);

/** Trims, caps lengths and drops unknown goals. Safe to call on anything. */
export function cleanAnswers(raw: Partial<OnboardingAnswers>): OnboardingAnswers {
  const name = String(raw.name ?? "").replace(/\s+/g, " ").trim().slice(0, NAME_MAX);
  const type = String(raw.type ?? "").replace(/\s+/g, " ").trim().slice(0, TYPE_MAX);
  const goal = GOAL_IDS.includes(String(raw.goal ?? "")) ? String(raw.goal) : "";
  return { name, type, goal };
}

/** The platform page that finishes setup (and creates the business) once the person is signed in. */
export function buildStartUrl(answers: Partial<OnboardingAnswers>): string {
  const a = cleanAnswers(answers);
  const qs = new URLSearchParams();
  if (a.name) qs.set("name", a.name);
  if (a.type) qs.set("type", a.type);
  if (a.goal) qs.set("goal", a.goal);
  const q = qs.toString();
  return `${PLATFORM_URL}/start${q ? `?${q}` : ""}`;
}

/* ───────────── Step-by-step flow (one page per question) ─────────────
   Each step is its own page: /get-started, /get-started/goal, /get-started/name, /get-started/account.
   The answers so far ride along in the address (?type=…&goal=…&name=…), so the back button, a refresh and a
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
  return cleanAnswers({ name: one(params.name), type: one(params.type), goal: one(params.goal) });
}

/** The page for a step, carrying the answers given so far. */
export function stepUrl(step: number, answers: Partial<OnboardingAnswers>): string {
  const i = Math.min(Math.max(Math.trunc(step) || 0, 0), STEPS.length - 1);
  const a = cleanAnswers(answers);
  const qs = new URLSearchParams();
  if (a.type) qs.set("type", a.type);
  if (a.goal) qs.set("goal", a.goal);
  if (a.name) qs.set("name", a.name);
  const q = qs.toString();
  return `${STEPS[i].path}${q ? `?${q}` : ""}`;
}

/** Whether the answer a step asks for has been given. */
export function stepDone(step: number, answers: Partial<OnboardingAnswers>): boolean {
  const a = cleanAnswers(answers);
  if (step === 0) return a.type.length > 0;
  if (step === 1) return a.goal !== "";
  if (step === 2) return a.name.length >= NAME_MIN;
  return true;
}

/** The first earlier step still missing an answer, or null when it is fine to be on `step`. Used to send people back. */
export function firstMissingStep(step: number, answers: Partial<OnboardingAnswers>): number | null {
  for (let i = 0; i < step; i++) if (!stepDone(i, answers)) return i;
  return null;
}

/** Words for the live site preview on the name step. Plain text only; the page escapes it. */
export function previewCopy(answers: Partial<OnboardingAnswers>): { title: string; links: string[]; cta: string; headline: string; sub: string } {
  const a = cleanAnswers(answers);
  const title = a.name || "Your business";
  const byGoal: Record<string, { links: string[]; cta: string; headline: string }> = {
    bookings: { links: ["About", "Services", "Appointments"], cta: "Book now", headline: "Book your next visit in seconds" },
    website: { links: ["About", "Gallery", "Contact"], cta: "Get in touch", headline: `Welcome to ${title}` },
    products: { links: ["Shop", "About", "Contact"], cta: "Shop now", headline: "Made with care, ready when you are" },
    team: { links: ["About", "Services", "Contact"], cta: "Contact us", headline: "A great team, well looked after" },
  };
  const g = byGoal[a.goal] ?? { links: ["About", "Services", "Contact"], cta: "Get in touch", headline: `Welcome to ${title}` };
  return { title, links: g.links, cta: g.cta, headline: g.headline, sub: a.type };
}
