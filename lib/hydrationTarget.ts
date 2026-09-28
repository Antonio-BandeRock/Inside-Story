// Water reminders stop at the target (G35 of the competitive build plan,
// 2026-09-27). Once the water logged today reaches the day's target, the
// rest of today's hydration reminders are left out of the queue, and they
// come back the next morning with a new day's total.
//
// The total is the same one the Hydration lens shows: water from every
// drink and food logged today, measured against the person's daily target.
// A drink that was scheduled but not logged adds nothing, so a reminder is
// only dropped on what was logged. Nothing here says a day's water is
// enough or too little for anybody; it only reports where the logged total
// sits against the target the person has.
//
// Pure, with no React and no database, so scripts/test_hydration_target.js
// checks it without a phone.

export type WaterTotal = { combinedTotal: number; target: number };

/** True once today's logged water has reached a target above zero. */
export function waterTargetReached(entry: WaterTotal | null | undefined): boolean {
  if (!entry) return false;
  if (!Number.isFinite(entry.target) || entry.target <= 0) return false;
  if (!Number.isFinite(entry.combinedTotal)) return false;
  return entry.combinedTotal >= entry.target;
}

function sameLocalDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/**
 * Whether a hydration reminder due at `fireAt` is left out. Only today's
 * are, since tomorrow starts from nothing logged; a reminder from earlier
 * today that is still being followed up is left out too.
 */
export function skipHydrationReminder(fireAt: Date, now: Date, reached: boolean): boolean {
  return reached && sameLocalDay(fireAt, now);
}

/**
 * The line under Today's water on the Hydration lens. `remindersOn` is the
 * Water & drinks switch in Profile; with it off there is nothing to stop,
 * so nothing is said about reminders.
 */
export function hydrationReminderLine(entry: WaterTotal | null | undefined, remindersOn: boolean): string | null {
  if (!remindersOn || !entry || !(entry.target > 0)) return null;
  if (waterTargetReached(entry)) {
    return "Today's water target is reached, so the rest of today's water reminders are off. They start again tomorrow.";
  }
  return "Water reminders stop for the rest of the day once today's target is reached.";
}
