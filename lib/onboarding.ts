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
