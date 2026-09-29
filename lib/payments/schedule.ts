/**
 * Pure payment-chain rules (no I/O), so they are easy to test and reason about.
 *
 *   issued / partially_paid
 *        -> reminder 1   (RULES.reminder1 days after due_at)
 *        -> reminder 2   (RULES.reminder2)
 *        -> final reminder (RULES.final)
 *        -> overdue      (RULES.overdue, and only once the final reminder has gone out)
 *
 * Only ONE step is taken per invoice per run, so a missed cron day never skips a reminder.
 */
export const RULES = { reminder1: 1, reminder2: 8, final: 15, overdue: 22 } as const;

export type ReminderType = "reminder_1" | "reminder_2" | "final_reminder";

const CHAIN: { stage: 1 | 2 | 3; type: ReminderType; day: number }[] = [
  { stage: 1, type: "reminder_1", day: RULES.reminder1 },
  { stage: 2, type: "reminder_2", day: RULES.reminder2 },
  { stage: 3, type: "final_reminder", day: RULES.final },
];

export type Action =
  | { kind: "none" }
  | { kind: "remind"; stage: 1 | 2 | 3; type: ReminderType }
  | { kind: "mark_overdue" };

export function daysPastDue(dueAt: string | Date, now: Date = new Date()): number {
  return Math.floor((now.getTime() - new Date(dueAt).getTime()) / 86_400_000);
}

export function nextAction(
  inv: { status: string; reminder_stage: number; due_at: string | null },
  now: Date = new Date()
): Action {
  if (!["issued", "partially_paid"].includes(inv.status) || !inv.due_at) return { kind: "none" };
  const d = daysPastDue(inv.due_at, now);
  if (inv.reminder_stage < 3) {
    const step = CHAIN[inv.reminder_stage];
    return d >= step.day ? { kind: "remind", stage: step.stage, type: step.type } : { kind: "none" };
  }
  return d >= RULES.overdue ? { kind: "mark_overdue" } : { kind: "none" };
}
