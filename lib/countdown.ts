// A Days Until counter: the person names something, says how many days,
// and the app counts them down. Added 2026-09-21 for the garden by direct
// request ("create a Days Until counter the user can create, Name, and
// start a timer in days. All this to be tied to Plots & Planting"), and
// opened up to anything at all on 2026-09-22: "Days Until should be
// something that is also available in a free form allowing the user to
// create their own Days Until for something that we don't have covered in
// the app in various places where it might be necessary or available."
//
// TWO KINDS, ONE ARITHMETIC. A garden counter belongs to an area and often
// to one planting in it (GardenCountdown, garden_countdowns). A free-form
// counter belongs to nothing: a passport in the post, a course starting, a
// cast coming off, a batch of cider (Countdown, countdowns). Everything
// below works on either, because none of it asks what the counter is about:
// a start date, a number of days, and whether it has been marked done are
// the whole of it. AnyCountdown is the shape a list holding both reads in.
//
// WHAT IT IS FOR. Whatever the seed packet, the letter, or the person's
// experience says, counted from the day they started it. It is a counter,
// not a task: nothing has to be marked done to keep the list honest, and a
// counter that reaches zero keeps counting so the person can see how far
// past the mark the thing is running.
//
// CALENDAR DAYS. The count is in whole calendar days between the start
// date and today, so a counter started at 11 pm and read at 7 am has
// moved one day, which is what a person counting on their fingers would
// say. No clock arithmetic and no time zones: dates are YYYY-MM-DD
// strings throughout, added and compared at noon so daylight-saving
// changes cannot move a boundary.
//
// NEVER ORPHANED. A garden counter belongs to its area and goes with it to
// Past Areas, staying readable there. A free-form counter refers to nothing
// and nothing refers to it. Either way removing one deletes the row
// outright; marking it done keeps it as the record of how long the thing
// took.
//
// No database in here: lib/gardenCountdownDb.ts and lib/countdownDb.ts read
// and write, and scripts/test_countdown.js checks this file without a
// phone.

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

/** A counter tied to nothing, for anything the app has no place for. The
 *  optional about line reads where the area and planting read on a garden
 *  counter. */
export type Countdown = {
  id: string;
  name: string;
  about: string | null;
  /** YYYY-MM-DD, the day the counter started. */
  startedOn: string;
  days: number;
  doneAt: string | null;
};

/** Either kind, in the shape a list holding both reads in. The where line
 *  under the name is the area and planting for a garden counter, the note
 *  the person added for a free-form one, and null when there is neither. */
export type AnyCountdown = {
  id: string;
  kind: 'garden' | 'free';
  name: string;
  where: string | null;
  startedOn: string;
  days: number;
  doneAt: string | null;
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

/** A garden counter in the shape a mixed list reads in. The option
 *  namesArea decides whether the area is named: a list covering one area
 *  already says which, so only the planting is added there. */
export function gardenAsAny(row: GardenCountdownRow, options?: { namesArea?: boolean }): AnyCountdown {
  const namesArea = options?.namesArea ?? true;
  const where = namesArea
    ? row.plantingName
      ? `${row.plantingName}, ${row.plotName}`
      : row.plotName
    : row.plantingName;
  return {
    id: row.id,
    kind: 'garden',
    name: row.name,
    where,
    startedOn: row.startedOn,
    days: row.days,
    doneAt: row.doneAt,
  };
}

/** A free-form counter in the same shape. */
export function freeAsAny(row: Countdown): AnyCountdown {
  return {
    id: row.id,
    kind: 'free',
    name: row.name,
    where: row.about && row.about.trim() ? row.about.trim() : null,
    startedOn: row.startedOn,
    days: row.days,
    doneAt: row.doneAt,
  };
}

/** Both kinds as one list, in the order a list of counters reads in. The
 *  two ids come from different tables, so a row carries its kind and every
 *  caller keys on both together. */
export function mergeCountdowns(free: readonly Countdown[], garden: readonly GardenCountdownRow[], today: string): AnyCountdown[] {
  return sortCountdowns([...free.map(freeAsAny), ...garden.map((row) => gardenAsAny(row))], today);
}
