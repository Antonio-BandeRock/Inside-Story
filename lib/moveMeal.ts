// Moving one planned meal to another day (H5 of the competitive build plan,
// 2026-09-28: "Move a meal to another day: a day picker on one occurrence").
// A planned meal on Schedules > Meals carries Move, which opens a day picker
// over the next four weeks. The meal keeps its time and its kind, and only
// that one occurrence moves: the rest of a repeating series stays where it
// was, the same as an edit of one occurrence always has.
//
// LEFTOVERS HOLD TOGETHER. A later meal eating leftovers (H3) can only move
// to a day in the week after its cooking, and a cooked meal with leftovers
// planned can only move to a day on or before the first of them and within
// a week of the last, so nothing ends up eaten before it is cooked. The
// picker offers only those days and says why in one line.
//
// Pure, with no React and no database, so scripts/test_move_meal.js checks
// it without a phone.

import { formatTime12 } from './timeOfDay';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** How many days from today the picker offers. */
export const MOVE_DAY_SPAN = 28;
/** How far past the cooking a leftover can be eaten; the same week lib/leftovers.ts offers. */
const LEFTOVER_WEEK = 7;

export const MOVE_LABEL = 'Move';

function parseDate(date: string): Date {
  const [y, m, d] = date.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function shiftDay(date: string, days: number): string {
  const out = parseDate(date);
  out.setUTCDate(out.getUTCDate() + days);
  return out.toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string): number {
  return Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / 86400000);
}

/** "Tue Sep 29". */
export function shortDay(date: string): string {
  const d = parseDate(date);
  return `${WEEKDAYS[d.getUTCDay()].slice(0, 3)} ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

/** "Today", "Tomorrow", "Yesterday" or "Tue Sep 29". */
export function relativeDay(date: string, today: string): string {
  const gap = daysBetween(today, date);
  if (gap === 0) return 'Today';
  if (gap === 1) return 'Tomorrow';
  if (gap === -1) return 'Yesterday';
  return shortDay(date);
}

/** "today", "tomorrow", "yesterday" or "on Tue Sep 29", to sit inside a sentence. */
function dayPhrase(date: string, today: string): string {
  const when = relativeDay(date, today);
  return when === shortDay(date) ? `on ${when}` : when.toLowerCase();
}

export type MoveBounds = { earliest: string | null; latest: string | null; reason: string | null };

/**
 * The days a meal can move to without putting leftovers before their
 * cooking. cookScheduledFor is set when the meal eats leftovers;
 * leftoverTimes lists the planned meals eating leftovers of this one.
 */
export function moveBounds(input: { cookScheduledFor: string | null; leftoverTimes: string[] }): MoveBounds {
  if (input.cookScheduledFor) {
    const cookDay = input.cookScheduledFor.slice(0, 10);
    return {
      earliest: cookDay,
      latest: shiftDay(cookDay, LEFTOVER_WEEK),
      reason: `This eats leftovers cooked on ${shortDay(cookDay)}, so it can move to a day in the week after that.`,
    };
  }
  const days = [...new Set(input.leftoverTimes.map((time) => time.slice(0, 10)))].sort();
  if (days.length === 0) return { earliest: null, latest: null, reason: null };
  const first = days[0];
  const last = days[days.length - 1];
  const reason =
    first === last
      ? `Leftovers of it are planned on ${shortDay(first)}, so it can move to a day on or before then and no more than a week before.`
      : `Leftovers of it are planned from ${shortDay(first)} to ${shortDay(last)}, so it can move to a day on or before ${shortDay(first)} and no more than a week before ${shortDay(last)}.`;
  return { earliest: shiftDay(last, -LEFTOVER_WEEK), latest: first, reason };
}

export type MoveDayChoice = { date: string; label: string };

/**
 * Every day the meal can move to, from today for four weeks, leaving out
 * the day it is on now and any day outside its bounds. Each label says
 * what is planned there already, so a day with that meal taken shows it.
 */
export function moveDayChoices(input: {
  fromDate: string;
  today: string;
  mealType: string | null;
  bounds: MoveBounds;
  planned: { date: string; mealType: string | null }[];
}): MoveDayChoice[] {
  const out: MoveDayChoice[] = [];
  for (let offset = 0; offset < MOVE_DAY_SPAN; offset += 1) {
    const date = shiftDay(input.today, offset);
    if (date === input.fromDate.slice(0, 10)) continue;
    if (input.bounds.earliest && date < input.bounds.earliest) continue;
    if (input.bounds.latest && date > input.bounds.latest) continue;
    const there = input.planned.filter((meal) => meal.date === date);
    const same = input.mealType ? there.filter((meal) => meal.mealType === input.mealType).length : 0;
    let count: string;
    if (there.length === 0) count = 'nothing planned';
    else {
      count = there.length === 1 ? '1 meal planned' : `${there.length} meals planned`;
      if (same > 0 && input.mealType) count += there.length === 1 ? `, a ${input.mealType}` : `, ${same === 1 ? 'a' : same} ${input.mealType}${same === 1 ? '' : 's'} among them`;
    }
    const when = relativeDay(date, input.today);
    const name = when === shortDay(date) ? when : `${when}, ${shortDay(date)}`;
    out.push({ date, label: `${name} (${count})` });
  }
  return out;
}

/**
 * The time on the new day, checked against the cooking and the leftovers.
 * Only a same-day clash can get past the day list, since the meal keeps its
 * time: a leftover moved onto its cooking day at an earlier hour, or a
 * cooked meal moved onto the day of its first leftover at a later one.
 */
export function moveProblem(newScheduledFor: string, input: { cookScheduledFor: string | null; leftoverTimes: string[] }): string | null {
  if (input.cookScheduledFor && newScheduledFor <= input.cookScheduledFor) {
    return `On that day this comes before the meal where it is cooked, at ${formatTime12(input.cookScheduledFor.slice(11, 16))}. Change its time with Edit, or pick a later day.`;
  }
  const first = [...input.leftoverTimes].sort()[0];
  if (first && newScheduledFor >= first) {
    return `On that day this comes after a meal eating its leftovers, at ${formatTime12(first.slice(11, 16))}. Change its time with Edit, or pick an earlier day.`;
  }
  return null;
}

/** The new scheduled_for: the new day at the time the meal had. */
export function movedScheduledFor(scheduledFor: string, date: string): string {
  const time = scheduledFor.split('T')[1] ?? '12:00';
  return `${date}T${time}`;
}

export function moveIntro(title: string, scheduledFor: string, today: string): string {
  const time = scheduledFor.split('T')[1] ?? '';
  const at = time ? ` at ${formatTime12(time.slice(0, 5))}` : '';
  return `"${title}" is planned ${dayPhrase(scheduledFor, today)}${at}. Pick the day to move it to; it keeps its time and stays the same meal.`;
}

export function movedMessage(title: string, scheduledFor: string, today: string): string {
  const time = scheduledFor.split('T')[1] ?? '';
  const when = relativeDay(scheduledFor, today);
  return `"${title}" moved to ${when === shortDay(scheduledFor) ? when : when.toLowerCase()}${time ? `, still at ${formatTime12(time.slice(0, 5))}` : ''}.`;
}

export const MOVE_SERIES_NOTE = 'Only this one moves; the rest of the series stays on its days.';
