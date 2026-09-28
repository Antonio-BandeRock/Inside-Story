// Month view on Schedules > Meals (H8 of the competitive build plan,
// 2026-09-28: "Month view: a month grid from the same dot data"). The week
// strip shows seven days with a dot under a day that has a meal planned
// and a ring under a day that has a note (H7). The month grid is the same
// marks over a whole month, so somebody can see at a glance which days of
// the month are planned and which are open, then tap a day to open it.
//
// Weeks start on Sunday, the same as the week strip (startOfWeekLocal in
// app/(tabs)/schedule.tsx), so a row of the grid is exactly a week of the
// strip and tapping a day lands on the week it sits in. The grid runs from
// the Sunday on or before the first of the month to the Saturday on or
// after the last, so it has four to six rows; the days before and after
// the month are drawn muted and can still be tapped.
//
// A day is marked from what is stored for it and nothing else: no colour
// for a day with fewer meals than another, no count of open days, nothing
// that reads as a day done well or badly.
//
// Pure, with no React and no database, so scripts/test_month_grid.js
// checks it without a phone.

/** "YYYY-MM" for a "YYYY-MM-DD" day. */
export function monthOf(date: string): string {
  return date.slice(0, 7);
}

function toDate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function toDateString(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** The month `delta` months from "YYYY-MM". */
export function shiftMonth(month: string, delta: number): string {
  const [year, monthNumber] = month.split('-').map(Number);
  const moved = new Date(year, monthNumber - 1 + delta, 1);
  return toDateString(moved).slice(0, 7);
}

/** The weeks of the grid, Sunday first, each seven "YYYY-MM-DD" days. */
export function monthGridWeeks(month: string): string[][] {
  const [year, monthNumber] = month.split('-').map(Number);
  const first = new Date(year, monthNumber - 1, 1);
  const last = new Date(year, monthNumber, 0);
  const cursor = new Date(first);
  cursor.setDate(cursor.getDate() - cursor.getDay());
  const end = new Date(last);
  end.setDate(end.getDate() + (6 - end.getDay()));
  const weeks: string[][] = [];
  while (cursor <= end) {
    const week: string[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(toDateString(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

/** The first and last day the grid shows, for the one query that fills it. */
export function monthGridRange(month: string): { from: string; to: string } {
  const weeks = monthGridWeeks(month);
  return { from: weeks[0][0], to: weeks[weeks.length - 1][6] };
}

export function isInMonth(date: string, month: string): boolean {
  return monthOf(date) === month;
}

/** "September 2026". */
export function monthLabel(month: string): string {
  return toDate(`${month}-01`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

/** The seven column headings, Sunday first, one or two letters each. */
export function weekdayInitials(): string[] {
  const sunday = new Date(2026, 8, 27);
  const out: string[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(sunday);
    day.setDate(sunday.getDate() + i);
    out.push(day.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2));
  }
  return out;
}

export type DayMarks = { meals: number; notes: number };

/** How many meals and notes each day holds, from the records' own days. */
export function marksByDate(
  mealDays: readonly string[],
  noteDays: readonly string[],
): Map<string, DayMarks> {
  const map = new Map<string, DayMarks>();
  const bump = (day: string, key: keyof DayMarks) => {
    const date = day.slice(0, 10);
    const marks = map.get(date) ?? { meals: 0, notes: 0 };
    marks[key] += 1;
    map.set(date, marks);
  };
  for (const day of mealDays) bump(day, 'meals');
  for (const day of noteDays) bump(day, 'notes');
  return map;
}

export const WEEK_VIEW_LABEL = 'Week';
export const MONTH_VIEW_LABEL = 'Month';

/** The line under the grid. Always shown, since a month is a new way to read the marks. */
export const MONTH_GRID_KEY = 'A dot under a day is a meal planned; a ring is a note. Tap a day to open it.';

/** What a screen reader says for one day of the grid. */
export function monthDayAccessibilityLabel(date: string, marks: DayMarks | undefined): string {
  const day = toDate(date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const parts: string[] = [];
  const meals = marks?.meals ?? 0;
  const notes = marks?.notes ?? 0;
  if (meals > 0) parts.push(`${meals} ${meals === 1 ? 'meal' : 'meals'} planned`);
  if (notes > 0) parts.push(`${notes} ${notes === 1 ? 'note' : 'notes'}`);
  return parts.length > 0 ? `${day}: ${parts.join(', ')}` : `${day}: nothing planned`;
}
