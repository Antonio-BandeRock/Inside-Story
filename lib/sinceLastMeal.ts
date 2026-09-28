// Hours since the last meal logged (G33 of the competitive build plan,
// 2026-09-27). Home says when the last meal was logged and how long ago,
// read from meals.eaten_at, and, when the person has set an eating window
// in Profile, where the clock sits against that window.
//
// Two things this never does. It never says anything about fasting being
// good or bad for anybody, only where the clock is against a window the
// person chose. And it never reads a gap in logging as time without food:
// a meal not logged is not counted, and the caption says so.
//
// Pure, with no React and no database, so scripts/test_since_last_meal.js
// checks it without a phone. Times are local 'YYYY-MM-DDTHH:mm' strings,
// the way meals.eaten_at stores them.

export type EatingWindow = { start: string; end: string };

export type SinceLastMeal = {
  /** "3 hours 25 minutes", or the line for no meal logged. */
  headline: string;
  /** "Last meal logged today at 12:40 PM." */
  detail: string | null;
  /** Where the clock sits against the eating window, when one is set. */
  windowLine: string | null;
};

export const SINCE_LAST_MEAL_CAPTION = 'Counted from the meals you log, so a meal not logged is not counted.';
export const NO_WINDOW_LINE = 'No eating window set. You can set one in Profile.';

function minutesOfDay(hhmm: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** "12:40 PM" from "12:40". */
export function clockLabel(hhmm: string): string {
  const total = minutesOfDay(hhmm);
  if (total == null) return hhmm;
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${hours < 12 ? 'AM' : 'PM'}`;
}

/** "3 hours 25 minutes", "45 minutes", "2 days 4 hours". */
export function durationLabel(totalMinutes: number): string {
  const minutes = Math.max(0, Math.round(totalMinutes));
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
  if (minutes < 60) return plural(minutes, 'minute');
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const rest = minutes % 60;
  if (days > 0) return hours > 0 ? `${plural(days, 'day')} ${plural(hours, 'hour')}` : plural(days, 'day');
  return rest > 0 ? `${plural(hours, 'hour')} ${plural(rest, 'minute')}` : plural(hours, 'hour');
}

function parseLocal(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]));
}

/** The local 'YYYY-MM-DDTHH:mm' for a moment, the shape meals.eaten_at uses. */
export function localStamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function dayWords(eaten: Date, now: Date): string {
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(now) - startOf(eaten)) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `on ${WEEKDAYS[eaten.getDay()]}`;
  return `on ${MONTHS[eaten.getMonth()]} ${eaten.getDate()}`;
}

/**
 * Where the clock sits against the window. A window that starts later in
 * the day than it ends runs past midnight. A window whose start and end
 * are the same time is stated without a countdown, since it has no inside.
 */
export function eatingWindowLine(window: EatingWindow, now: Date): string | null {
  const start = minutesOfDay(window.start);
  const end = minutesOfDay(window.end);
  if (start == null || end == null) return null;
  const said = `Your eating window is ${clockLabel(window.start)} to ${clockLabel(window.end)}.`;
  if (start === end) return said;
  const current = now.getHours() * 60 + now.getMinutes();
  const inside = start < end ? current >= start && current < end : current >= start || current < end;
  if (inside) return `${said} It closes in ${durationLabel((end - current + 1440) % 1440)}.`;
  return `${said} It opens in ${durationLabel((start - current + 1440) % 1440)}.`;
}

export function sinceLastMeal(lastEatenAt: string | null, now: Date, window: EatingWindow | null): SinceLastMeal {
  const windowLine = window ? eatingWindowLine(window, now) : null;
  const eaten = lastEatenAt ? parseLocal(lastEatenAt) : null;
  if (!eaten) return { headline: 'No meal logged yet', detail: null, windowLine };
  const minutes = (now.getTime() - eaten.getTime()) / 60000;
  const time = clockLabel(lastEatenAt!.slice(11, 16));
  return {
    headline: minutes < 1 ? 'Just now' : `${durationLabel(minutes)} ago`,
    detail: `Last meal logged ${dayWords(eaten, now)} at ${time}.`,
    windowLine,
  };
}

/** The window from Profile, or null when fasting is off or either time is missing. */
export function windowFromProfile(profile: {
  fastingEnabled: boolean;
  eatingWindowStart: string | null;
  eatingWindowEnd: string | null;
}): EatingWindow | null {
  if (!profile.fastingEnabled || !profile.eatingWindowStart || !profile.eatingWindowEnd) return null;
  return { start: profile.eatingWindowStart, end: profile.eatingWindowEnd };
}
