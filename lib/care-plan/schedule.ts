/**
 * Pure Care Plan chain rules (no I/O).
 *
 *   past_due -> grace period (ends at grace_period_ends_at, set by the database, 7 days)
 *            -> reminder            (when the grace period ends)
 *            -> final reminder      (+FINAL_AFTER_GRACE days)
 *            -> maintenance mode    (+MAINTENANCE_AFTER_GRACE days, and only once the final reminder was sent)
 */
export const CARE_RULES = { finalAfterGraceDays: 7, maintenanceAfterGraceDays: 14 } as const;

export type CareReminderType = "care_plan_reminder" | "care_plan_final";

export type CareAction =
  | { kind: "none" }
  | { kind: "remind"; type: CareReminderType }
  | { kind: "maintenance" };

const DAY = 86_400_000;

export function maintenanceDate(graceEnd: string | Date): Date {
  return new Date(new Date(graceEnd).getTime() + CARE_RULES.maintenanceAfterGraceDays * DAY);
}

export function nextCareAction(
  plan: { status: string; grace_period_ends_at: string | null },
  sent: ReadonlySet<string>,
  now: Date = new Date()
): CareAction {
  if (plan.status !== "past_due" || !plan.grace_period_ends_at) return { kind: "none" };
  const elapsed = (now.getTime() - new Date(plan.grace_period_ends_at).getTime()) / DAY; // negative while in grace

  if (!sent.has("care_plan_reminder")) {
    return elapsed >= 0 ? { kind: "remind", type: "care_plan_reminder" } : { kind: "none" };
  }
  if (!sent.has("care_plan_final")) {
    return elapsed >= CARE_RULES.finalAfterGraceDays ? { kind: "remind", type: "care_plan_final" } : { kind: "none" };
  }
  return elapsed >= CARE_RULES.maintenanceAfterGraceDays ? { kind: "maintenance" } : { kind: "none" };
}
