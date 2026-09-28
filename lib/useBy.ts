// Use-by dates on what is in the kitchen (H2, 2026-09-28).
//
// A date is optional everywhere it is asked. Most of a kitchen has no date
// worth writing down, and a form that demanded one would cost more than the
// answer is worth. Where a date is given it does four things:
//
//   1. Life > Kitchen gathers what is coming up into a Use Soon band at the
//      top, soonest first, so the jar at the back is seen before it is lost.
//   2. A reminder the day before and on the day (Profile > reminders, "Use
//      it before its date"), landing on Life > Kitchen.
//   3. The meal plan generator, with its lean-on-the-kitchen switch on, picks
//      a dish using something with a date inside USE_BY_LEAN_DAYS ahead of
//      anything else, soonest date first.
//   4. Stock past its date is left out of what a new grocery list is built
//      around and out of the generator's lean. The app cannot see the food,
//      so it never says the food has gone off; it only stops counting on it,
//      and the row stays in the kitchen until the person says otherwise.
//
// Everything here is pure, so scripts/test_use_by.js can check it without a
// phone. Nothing here calls food unsafe, spoiled or fine: a use-by date is
// the label's word, and the person is the one who can look at the food.

/** How many days ahead the Use Soon band reaches. */
export const USE_SOON_DAYS = 3;

/** How many days ahead a date makes the meal plan generator reach for it. */
export const USE_BY_LEAN_DAYS = 7;

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function dayNumber(day: string): number {
  return Math.round(Date.parse(`${day}T00:00:00Z`) / 86400000);
}

/** Today as the phone's local calendar day, YYYY-MM-DD. */
export function localToday(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/** A day moved by some number of days, YYYY-MM-DD in and out. */
export function shiftUseByDay(day: string, days: number): string {
  const moved = new Date(Date.parse(`${day}T00:00:00Z`) + days * 86400000);
  return moved.toISOString().slice(0, 10);
}

/** Whether a stored value is a usable date at all. */
export function isUseByDate(value: string | null | undefined): value is string {
  if (!value || !ISO_DAY.test(value)) return false;
  return !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

/** Days from today to the date: 0 on the day, negative once it has gone by,
 *  null with no usable date. */
export function daysUntilUseBy(useBy: string | null | undefined, today: string): number | null {
  if (!isUseByDate(useBy)) return null;
  return dayNumber(useBy) - dayNumber(today);
}

/** True once the date has gone by. The day itself still counts as usable. */
export function isPastUseBy(useBy: string | null | undefined, today: string): boolean {
  const days = daysUntilUseBy(useBy, today);
  return days != null && days < 0;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Oct 2", from YYYY-MM-DD. */
export function formatUseByDay(day: string): string {
  const [, month, date] = day.split('-').map(Number);
  return `${MONTHS[month - 1]} ${date}`;
}

/**
 * The one line a row carries about its date, or null with none. Past the
 * date it says how long ago and leaves the judging to the person, who can
 * see and smell the food where the app cannot.
 */
export function describeUseBy(useBy: string | null | undefined, today: string): string | null {
  const days = daysUntilUseBy(useBy, today);
  if (days == null || !isUseByDate(useBy)) return null;
  if (days === 0) return 'Use by today';
  if (days === 1) return 'Use by tomorrow';
  if (days > 1 && days < 14) return `Use by ${formatUseByDay(useBy)}, in ${days} days`;
  if (days >= 14) return `Use by ${formatUseByDay(useBy)}`;
  const ago = days === -1 ? 'yesterday' : `${Math.abs(days)} days ago`;
  return `Its use-by date was ${ago}; worth a look before eating it`;
}

/**
 * What belongs in the Use Soon band: anything with a date inside
 * USE_SOON_DAYS, or past it, soonest (or longest gone) first. Items without a
 * date are never in it.
 */
export function selectUseSoon<T>(items: T[], dateOf: (item: T) => string | null | undefined, today: string): T[] {
  const dated: { item: T; days: number }[] = [];
  for (const item of items) {
    const days = daysUntilUseBy(dateOf(item), today);
    if (days != null && days <= USE_SOON_DAYS) dated.push({ item, days });
  }
  dated.sort((a, b) => a.days - b.days);
  return dated.map((entry) => entry.item);
}

/** The Use Soon band's heading line, or null with nothing in it. */
export function describeUseSoonCount(count: number, pastCount: number): string | null {
  if (count === 0) return null;
  const within = count - pastCount;
  const parts: string[] = [];
  if (within > 0) parts.push(`${within} ${within === 1 ? 'thing' : 'things'} to use in the next ${USE_SOON_DAYS} days`);
  if (pastCount > 0) parts.push(`${pastCount} past ${pastCount === 1 ? 'its date' : 'their dates'}`);
  return parts.join(', and ');
}

export type UseByChoice = { label: string; date: string };

/** The quick choices offered beside a typed date. */
export function choicesForUseBy(today: string): UseByChoice[] {
  return [
    { label: 'In 3 days', date: shiftUseByDay(today, 3) },
    { label: 'In a week', date: shiftUseByDay(today, 7) },
    { label: 'In 2 weeks', date: shiftUseByDay(today, 14) },
    { label: 'In a month', date: shiftUseByDay(today, 30) },
  ];
}

/**
 * A typed date, read as YYYY-MM-DD or as a number of days from today ("5").
 * Empty text reads as no date. Anything else is null, so the form can say it
 * did not understand rather than saving a guess.
 */
export function parseUseByInput(text: string, today: string): { date: string | null } | null {
  const trimmed = text.trim();
  if (!trimmed) return { date: null };
  if (/^\d{1,3}$/.test(trimmed)) return { date: shiftUseByDay(today, Number(trimmed)) };
  if (isUseByDate(trimmed)) return { date: trimmed };
  return null;
}

/** The soonest date among some stock, counting only dates from today on and
 *  inside `withinDays`, or null. What the generator ranks a dish by. */
export function soonestUseBy(dates: (string | null | undefined)[], today: string, withinDays: number): string | null {
  let soonest: string | null = null;
  for (const date of dates) {
    const days = daysUntilUseBy(date, today);
    if (days == null || days < 0 || days > withinDays) continue;
    if (soonest == null || (date as string) < soonest) soonest = date as string;
  }
  return soonest;
}
