// "Log your usual lunch?" (G25 of the competitive build plan, 2026-09-27).
// Most meals are a repeat, and a repeat at the time it is usually eaten is
// the most predictable of all, so around breakfast, lunch or dinner Home
// offers the one meal this person has logged most often in that slot, as a
// single tap that copies it at the present time (relogMeal in lib/db.ts).
//
// This half is pure: which slot the clock is in, whether anything counts as
// usual, and every sentence. The database half is lib/usualMealDb.ts.
//
// Silent unless every one of these holds, since a wrong guess offered daily
// would be worse than no offer:
// - the clock is near a usual breakfast, lunch or dinner time (the person's
//   own from Profile, or else the middle of the times they have logged it);
// - nothing is logged in that slot today and nothing is planned for it
//   (a planned meal is already the answer, and Schedules asks about it);
// - one meal was logged in that slot at least USUAL_MIN_TIMES times over the
//   last USUAL_LOOKBACK_DAYS days, and on at least a third of the days that
//   slot was logged at all, so a rotation of five lunches offers none;
// - "Not today" has not been pressed for this slot today.
// Snacks are left out: a snack has no set time of day to be near.

export const USUAL_LOOKBACK_DAYS = 28;
export const USUAL_MIN_TIMES = 3;

export type UsualSlot = 'breakfast' | 'lunch' | 'dinner';
export const USUAL_SLOTS: readonly UsualSlot[] = ['breakfast', 'lunch', 'dinner'];

// How close to a usual time the offer appears: from 45 minutes before it
// until two and a half hours after, so a late lunch still gets asked about.
const OPENS_BEFORE_MIN = 45;
const CLOSES_AFTER_MIN = 150;

export type UsualMealHistoryRow = {
  id: string;
  name: string;
  mealType: string;
  // "YYYY-MM-DDTHH:mm", local, as meals.eaten_at stores it.
  eatenAt: string;
};

export type UsualMealInputs = {
  // Meals over the lookback window, today included.
  history: UsualMealHistoryRow[];
  // "YYYY-MM-DD" and "HH:mm", local.
  today: string;
  nowTime: string;
  usualTimes: Record<UsualSlot, string | null>;
  // Meal types of today's scheduled meals that were not skipped.
  plannedToday: string[];
  // The stored "Not today" key, or null.
  dismissed: string | null;
};

export type UsualMealSuggestion = {
  slot: UsualSlot;
  // The latest meal carrying this name, which is what gets copied.
  sourceMealId: string;
  name: string;
  times: number;
  daysWithSlot: number;
  // "HH:mm", the middle of the times this meal was logged in the slot.
  usuallyAt: string;
  dismissKey: string;
};

function minutesOf(time: string | null | undefined): number | null {
  if (!time) return null;
  const match = /^(\d{1,2}):(\d{2})/.exec(time.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function timeOf(minutes: number): string {
  const whole = Math.round(minutes);
  return `${String(Math.floor(whole / 60)).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}`;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function dayOf(row: UsualMealHistoryRow): string {
  return row.eatenAt.slice(0, 10);
}

function clockOf(row: UsualMealHistoryRow): number | null {
  return minutesOf(row.eatenAt.slice(11, 16));
}

export function dismissKeyFor(today: string, slot: UsualSlot): string {
  return `${today}:${slot}`;
}

// The first day inside the lookback window, for the query.
export function lookbackStart(today: string): string {
  const start = new Date(`${today}T12:00:00`);
  start.setDate(start.getDate() - USUAL_LOOKBACK_DAYS);
  const month = String(start.getMonth() + 1).padStart(2, '0');
  const day = String(start.getDate()).padStart(2, '0');
  return `${start.getFullYear()}-${month}-${day}`;
}

// When this slot is usually eaten: the person's own time when set, else
// the middle of the times it has been logged, else nothing to go on.
export function usualTimeForSlot(
  slot: UsualSlot,
  usualTimes: Record<UsualSlot, string | null>,
  history: UsualMealHistoryRow[],
): number | null {
  const stated = minutesOf(usualTimes[slot]);
  if (stated != null) return stated;
  const logged = history
    .filter((row) => row.mealType === slot)
    .map(clockOf)
    .filter((value): value is number => value != null);
  if (logged.length < USUAL_MIN_TIMES) return null;
  return median(logged);
}

// Which slot the clock is near, the closest when two windows overlap.
export function slotNear(nowTime: string, usualTimes: Record<UsualSlot, string | null>, history: UsualMealHistoryRow[]): UsualSlot | null {
  const now = minutesOf(nowTime);
  if (now == null) return null;
  let best: { slot: UsualSlot; distance: number } | null = null;
  for (const slot of USUAL_SLOTS) {
    const usual = usualTimeForSlot(slot, usualTimes, history);
    if (usual == null) continue;
    if (now < usual - OPENS_BEFORE_MIN || now > usual + CLOSES_AFTER_MIN) continue;
    const distance = Math.abs(now - usual);
    if (!best || distance < best.distance) best = { slot, distance };
  }
  return best?.slot ?? null;
}

export function usualMealSuggestion(inputs: UsualMealInputs): UsualMealSuggestion | null {
  const { history, today } = inputs;
  const slot = slotNear(inputs.nowTime, inputs.usualTimes, history.filter((row) => dayOf(row) < today));
  if (!slot) return null;
  const dismissKey = dismissKeyFor(today, slot);
  if (inputs.dismissed === dismissKey) return null;
  if (inputs.plannedToday.includes(slot)) return null;
  if (history.some((row) => row.mealType === slot && dayOf(row) === today)) return null;

  const start = lookbackStart(today);
  const earlier = history.filter((row) => row.mealType === slot && dayOf(row) < today && dayOf(row) >= start);
  const daysWithSlot = new Set(earlier.map(dayOf)).size;
  if (daysWithSlot === 0) return null;

  // Counted once per day, so a lunch logged twice on one day is one lunch.
  const byName = new Map<string, { days: Set<string>; latest: UsualMealHistoryRow; clocks: number[] }>();
  for (const row of earlier) {
    const key = row.name.trim().toLowerCase();
    if (!key) continue;
    const entry = byName.get(key) ?? { days: new Set<string>(), latest: row, clocks: [] };
    entry.days.add(dayOf(row));
    if (row.eatenAt > entry.latest.eatenAt) entry.latest = row;
    const clock = clockOf(row);
    if (clock != null) entry.clocks.push(clock);
    byName.set(key, entry);
  }

  let top: { days: Set<string>; latest: UsualMealHistoryRow; clocks: number[] } | null = null;
  for (const entry of byName.values()) {
    if (
      !top ||
      entry.days.size > top.days.size ||
      (entry.days.size === top.days.size && entry.latest.eatenAt > top.latest.eatenAt)
    ) {
      top = entry;
    }
  }
  if (!top) return null;
  const times = top.days.size;
  if (times < USUAL_MIN_TIMES || times * 3 < daysWithSlot) return null;

  const middle = median(top.clocks);
  return {
    slot,
    sourceMealId: top.latest.id,
    name: top.latest.name,
    times,
    daysWithSlot,
    usuallyAt: middle == null ? '' : timeOf(middle),
    dismissKey,
  };
}

// ---------------------------------------------------------------------------
// Sentences
// ---------------------------------------------------------------------------

export const USUAL_MEAL_META_KEY = 'usual_meal_dismissed';

export function usualMealTitle(suggestion: UsualMealSuggestion): string {
  return `Log your usual ${suggestion.slot}?`;
}

function clock12(time24: string): string {
  const minutes = minutesOf(time24);
  if (minutes == null) return '';
  const hours = Math.floor(minutes / 60);
  const suffix = hours >= 12 ? 'pm' : 'am';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${String(minutes % 60).padStart(2, '0')}${suffix}`;
}

export function usualMealCaption(suggestion: UsualMealSuggestion): string {
  const days = suggestion.daysWithSlot === 1 ? '1 day' : `${suggestion.daysWithSlot} days`;
  const around = suggestion.usuallyAt ? `, usually around ${clock12(suggestion.usuallyAt)}` : '';
  return (
    `Logged at ${suggestion.slot} on ${suggestion.times} of the ${days} you logged a ${suggestion.slot} ` +
    `in the last four weeks${around}. One tap logs the same meal now.`
  );
}

export function usualMealLoggedSentence(name: string, time24: string): string {
  const at = clock12(time24);
  return at ? `${name} logged at ${at}.` : `${name} logged.`;
}

export const USUAL_MEAL_TRIAL_NOTE =
  'This started a food trial, so it cannot be undone from here. Past Meals can change or remove it.';
