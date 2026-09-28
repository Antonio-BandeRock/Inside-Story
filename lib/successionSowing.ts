// Succession sowing (I6, 1.0.55.22).
//
// Sowing the same crop again every so many days, so lettuce, radishes or
// beans come in a few at a time rather than all at once. Saving a planting
// with "Sow again" on writes today's planting as growing and each later
// sowing as a planting with status 'planned', dated for the day it is due,
// plus a Days Until counter landing on that day. A planned sowing is not
// growing: everything that reads what is in the ground filters on
// 'growing' and so leaves it out, and it turns into a growing planting
// only when the person marks it sown, on whatever day that happens.
//
// The dates are plain calendar days (YYYY-MM-DD) with no clock in them, so
// the arithmetic is done in UTC where no daylight saving change can move a
// day. Nothing here says a crop should be sown on a day; the person picks
// the gap and how many more times.

export const SUCCESSION_EVERY_DEFAULT = 14;
export const SUCCESSION_TIMES_DEFAULT = 3;
export const SUCCESSION_EVERY_MIN = 1;
export const SUCCESSION_EVERY_MAX = 120;
export const SUCCESSION_TIMES_MIN = 1;
export const SUCCESSION_TIMES_MAX = 20;

/** A typed whole number inside a range, or null when blank or outside it. */
export function parseWhole(text: string, min: number, max: number): number | null {
  const trimmed = text.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return value >= min && value <= max ? value : null;
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const out = new Date(Date.UTC(y, m - 1, d + days));
  return out.toISOString().slice(0, 10);
}

/** Whole days from one calendar date to another. */
export function daysBetween(from: string, to: string): number {
  const [y1, m1, d1] = from.split('-').map(Number);
  const [y2, m2, d2] = to.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}

/** The later sowings after the first: every `everyDays` days, `times` more. */
export function successionDates(start: string, everyDays: number, times: number): string[] {
  const out: string[] = [];
  for (let i = 1; i <= times; i += 1) out.push(addDays(start, everyDays * i));
  return out;
}

/** The counter for one later sowing, numbered among all of them including
 *  the first, so the third of four reads "(3 of 4)". */
export function successionCounterName(foodName: string, index: number, total: number): string {
  return `Sow ${foodName.toLowerCase()} again (${index} of ${total})`;
}

/** Moves an expected date along by the days a sowing went in early or late,
 *  so a planned sowing marked sown keeps its harvest the same distance off. */
export function shiftDate(date: string | null, days: number): string | null {
  return date ? addDays(date, days) : null;
}

/** "12 Oct, 26 Oct and 9 Nov", from dates already put into words. */
export function joinDates(labels: string[]): string {
  if (labels.length <= 1) return labels.join('');
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
}
