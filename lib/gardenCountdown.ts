// A Days Until counter in the garden: the person names it, ties it to an
// area (and to one planting in it if they like), and starts it for so
// many days. Added 2026-09-21 by direct request: "create a Days Until
// counter the user can create, Name, and start a timer in days. All this
// to be tied to Plots & Planting. These will be available from the Home
// screen in Garden quick access."
//
// WHAT IT IS FOR. Days to germination, days to transplant, days to
// harvest, days until the cover comes off: whatever the seed packet or the
// person's own experience says, counted from the day they started it. It
// is a counter, not a task: nothing fires, nothing has to be marked done
// to keep the list honest, and a counter that reaches zero keeps counting
// so the person can see how far past the mark the plant is running.
//
// CALENDAR DAYS. The count is in whole calendar days between the start
// date and today, so a counter started at 11 pm and read at 7 am has
// moved one day, which is what a person counting on their fingers would
// say. No clock arithmetic and no time zones: dates are YYYY-MM-DD
// strings throughout, added and compared at noon so daylight-saving
// changes cannot move a boundary.
//
// NEVER ORPHANED. A counter belongs to its area and goes with it to Past
// Areas, staying readable there. It is the person's own note, nothing
// refers to it, so removing one deletes the row outright; marking it done
// keeps it under the area as a record of how long the thing took.
//
// No database in here: lib/gardenCountdownDb.ts reads and writes, and
// scripts/test_garden_countdown.js checks this file without a phone.

export type GardenCountdown = {
  id: string;
  plotId: string;
  /** The one planting the counter is for, or null for the whole area. */
  plantingId: string | null;
  name: string;
  /** YYYY-MM-DD, the day the counter started. */
  startedOn: string;
  days: number;
  /** Set when the person marks it done; the counter stops there. */
  doneAt: string | null;
};

/** A counter with the names Home and the area list show beside it. */
export type GardenCountdownRow = GardenCountdown & {
  plotName: string;
  plantingName: string | null;
};

export type CountdownState = 'ahead' | 'today' | 'over' | 'done';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole calendar days from one date to another, negative when b is
 *  earlier. Both at noon, so a daylight-saving change never rounds to a
 *  day short. */
export function calendarDaysBetween(a: string, b: string): number {
  const from = new Date(`${a}T12:00:00`).getTime();
  const to = new Date(`${b}T12:00:00`).getTime();
  return Math.round((to - from) / DAY_MS);
}

/** The date a number of days on from a start date, as YYYY-MM-DD. */
export function addCalendarDays(date: string, days: number): string {
  const at = new Date(`${date}T12:00:00`);
  at.setDate(at.getDate() + days);
  const y = at.getFullYear();
  const m = String(at.getMonth() + 1).padStart(2, '0');
  const d = String(at.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** The day the counter lands on. */
export function countdownDueDate(countdown: Pick<GardenCountdown, 'startedOn' | 'days'>): string {
  return addCalendarDays(countdown.startedOn, countdown.days);
}

/** Days left until the counter lands: positive ahead of it, zero on the
 *  day, negative once past it. */
export function daysUntil(countdown: Pick<GardenCountdown, 'startedOn' | 'days'>, today: string): number {
  return calendarDaysBetween(today, countdownDueDate(countdown));
}

export function countdownState(countdown: Pick<GardenCountdown, 'startedOn' | 'days' | 'doneAt'>, today: string): CountdownState {
  if (countdown.doneAt) return 'done';
  const left = daysUntil(countdown, today);
  if (left > 0) return 'ahead';
  if (left === 0) return 'today';
  return 'over';
}

/** The short figure a row leads with: "12 days", "1 day", "Today",
 *  "3 days over", "Done". */
export function countdownFigure(countdown: Pick<GardenCountdown, 'startedOn' | 'days' | 'doneAt'>, today: string): string {
  const state = countdownState(countdown, today);
  if (state === 'done') return 'Done';
  if (state === 'today') return 'Today';
  const left = daysUntil(countdown, today);
  const n = Math.abs(left);
  const unit = n === 1 ? 'day' : 'days';
  return state === 'ahead' ? `${n} ${unit}` : `${n} ${unit} over`;
}

/** The sentence under a counter in its area: where it stands and when it
 *  lands. */
export function describeCountdown(countdown: Pick<GardenCountdown, 'startedOn' | 'days' | 'doneAt'>, today: string): string {
  const due = countdownDueDate(countdown);
  const dueLabel = new Date(`${due}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const startLabel = new Date(`${countdown.startedOn}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const span = `${countdown.days} ${countdown.days === 1 ? 'day' : 'days'} from ${startLabel}`;
  const state = countdownState(countdown, today);
  if (state === 'done') {
    const doneOn = countdown.doneAt ? countdown.doneAt.slice(0, 10) : today;
    const took = calendarDaysBetween(countdown.startedOn, doneOn);
    return `${span}, marked done at ${took} ${took === 1 ? 'day' : 'days'}.`;
  }
  if (state === 'today') return `${span}: that is today.`;
  const left = daysUntil(countdown, today);
  if (left > 0) return `${span}, landing ${dueLabel}.`;
  return `${span}, landed ${dueLabel}.`;
}

/** How far along a counter is, 0 to 1, held at 1 once past its day. */
export function countdownProgress(countdown: Pick<GardenCountdown, 'startedOn' | 'days'>, today: string): number {
  if (countdown.days <= 0) return 1;
  const elapsed = calendarDaysBetween(countdown.startedOn, today);
  return Math.min(1, Math.max(0, elapsed / countdown.days));
}

/** The order a list of counters reads in: the ones still running by how
 *  soon they land (overdue first, since those want looking at), the done
 *  ones after, newest done first. */
export function sortCountdowns<T extends Pick<GardenCountdown, 'startedOn' | 'days' | 'doneAt'>>(items: readonly T[], today: string): T[] {
  return [...items].sort((a, b) => {
    const aDone = a.doneAt ? 1 : 0;
    const bDone = b.doneAt ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    if (aDone) return (b.doneAt ?? '').localeCompare(a.doneAt ?? '');
    return daysUntil(a, today) - daysUntil(b, today);
  });
}

/** What the form needs before a counter can start. Null when it can. */
export function countdownFormProblem(input: { name: string; days: string; startedOn: string }): string | null {
  if (!input.name.trim()) return 'Give the counter a name.';
  const days = Number(input.days);
  if (!input.days.trim() || !Number.isInteger(days) || days <= 0) return 'How many days? A whole number, at least 1.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.startedOn)) return 'Pick the day it started.';
  return null;
}
