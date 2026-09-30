// The period a report covers (K1 of the competitive build plan, 2026-09-29).
// buildReport takes a number of days ending today; this works out that
// number for the longer presets on the Reports tab: six months, a year, and
// since the last appointment. Pure, so scripts/test_report_range.js checks
// it without a phone.
//
// Six months and a year are calendar months back from today, not 182 and
// 365 days, so a report made on the 29th starts on a 29th. A month too
// short for the day lands on its last day (31 August back six months is
// 28 February, or the 29th in a leap year).
//
// Since your last appointment starts the day after the visit, the same way
// F19's band on Trends counts from it: what happened at the visit was seen
// there. The visit itself is lastVisit in lib/sinceLastVisit.ts, the most
// recent one dated before today that was not skipped.

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function parts(day: string): [number, number, number] {
  const [y, m, d] = day.split('-').map(Number);
  return [y, m, d];
}

function format(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** The same day of the month `months` calendar months before `today`, held
 *  to the last day of a shorter month. */
export function monthsBefore(today: string, months: number): string {
  const [y, m, d] = parts(today);
  const index = y * 12 + (m - 1) - months;
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  const lastDay = new Date(year, month, 0).getDate();
  return format(year, month, Math.min(d, lastDay));
}

/** The day after `day`. */
export function dayAfter(day: string): string {
  const [y, m, d] = parts(day);
  const next = new Date(y, m - 1, d + 1);
  return format(next.getFullYear(), next.getMonth() + 1, next.getDate());
}

/** Days from `start` through `today`, counting both ends, never below one. */
export function daysFromThrough(start: string, today: string): number {
  const [ys, ms, ds] = parts(start);
  const [yt, mt, dt] = parts(today);
  const span = Math.round((Date.UTC(yt, mt - 1, dt) - Date.UTC(ys, ms - 1, ds)) / 86400000) + 1;
  return Math.max(1, span);
}

/** "September 3, 2026" */
export function longDate(day: string): string {
  const [y, m, d] = parts(day);
  return `${MONTH_NAMES[m - 1]} ${d}, ${y}`;
}

export type LastVisitForRange = { date: string; title: string; providerName: string | null };

/** Where a since-the-last-visit report starts: the day after the visit,
 *  or today when the visit was yesterday. */
export function sinceVisitStart(visit: LastVisitForRange): string {
  return dayAfter(visit.date);
}

/** One line under the pills saying what the preset covers. */
export function describeRange(start: string, today: string, visit?: LastVisitForRange | null): string {
  const days = daysFromThrough(start, today);
  const span = `${days} ${days === 1 ? 'day' : 'days'}`;
  if (visit) {
    const title = visit.title.trim() || 'your appointment';
    const provider = visit.providerName?.trim();
    const who = provider ? `${title} with ${provider}` : title;
    return `Since ${who} on ${longDate(visit.date)}: ${longDate(start)} through today, ${span}.`;
  }
  return `${longDate(start)} through today, ${span}.`;
}
