// Plain-language dates (C4 of the competitive build plan, Phase 2,
// 2026-09-26). "Call the dentist Friday at 3", "passport runs out 3 March
// 2031", "in two weeks".
//
// The plan named chrono-node. This is a small reader of its own instead:
// chrono-node is a large package carrying a dozen locales the app has no
// use for yet, and the handful of shapes people actually write in a note
// fit in one file that scripts/test_plain_date.js can check line by line.
// It is also the start of what C9 (plan by sentence) will need.
//
// THE RULE IT KEEPS. A date read out of somebody's words is OFFERED and never
// applied. Nothing in this file writes anything, and every caller shows the
// reading in full ("Friday 3 October at 3:00 PM") beside a button, so a
// wrong reading is seen before it is used. That is the capture inbox's rule
// that the app does not choose a day for anybody, kept with the words doing
// the suggesting.
//
// What it leaves alone on purpose:
//   - 3/10 and 10/3. Day-first and month-first are both in daily use where
//     this app is used, and a guess between them is wrong half the time.
//   - A month with no day ("in March"), since "march" and "may" are verbs
//     too often for a bare month to mean a date.
//   - Short weekday names ("sat", "wed", "sun"), which are ordinary words.
//
// Pure: no database, no React.

export type Lean = 'future' | 'past';

export type PlainDate = {
  /** 'YYYY-MM-DD', local. */
  date: string;
  /** 'HH:mm', or null when the words named no time. */
  time: string | null;
  /** The words it was read from, as they appear in the text. */
  matched: string;
};

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];
const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
// Short month names are safe where short weekday names are not: "oct 3" and
// "3 sept" read one way only, and each needs a day number beside it anyway.
const MONTH_WORDS: Record<string, number> = {};
MONTHS.forEach((name, index) => {
  MONTH_WORDS[name] = index;
  MONTH_WORDS[name.slice(0, 3)] = index;
});
MONTH_WORDS.sept = 8;
const MONTH_PATTERN = Object.keys(MONTH_WORDS).sort((a, b) => b.length - a.length).join('|');

const NUMBER_WORDS: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
};

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function atDay(now: Date, offset: number): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
}

function readNumber(word: string): number | null {
  if (/^\d+$/.test(word)) return Number(word);
  return NUMBER_WORDS[word] ?? null;
}

// Whether a calendar date exists, so "31 February" is refused rather than
// rolled into March by the Date constructor.
function realDate(year: number, month: number, day: number): Date | null {
  const date = new Date(year, month, day);
  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day ? date : null;
}

// A day and month with no year: the next one coming when leaning forward,
// the last one gone when leaning back. Today counts either way.
function nearestYear(month: number, day: number, now: Date, lean: Lean): Date | null {
  const today = atDay(now, 0).getTime();
  const thisYear = realDate(now.getFullYear(), month, day);
  if (lean === 'future') {
    if (thisYear && thisYear.getTime() >= today) return thisYear;
    return realDate(now.getFullYear() + 1, month, day);
  }
  if (thisYear && thisYear.getTime() <= today) return thisYear;
  return realDate(now.getFullYear() - 1, month, day);
}

type Found = { date: Date; index: number; matched: string; time?: string };

// Every date phrase in the text, each with where it starts, so the earliest
// mention leads and one phrase is never read twice by two patterns.
function findDates(lower: string, original: string, now: Date, lean: Lean): Found[] {
  const found: Found[] = [];
  const taken: [number, number][] = [];
  const add = (match: RegExpExecArray, date: Date | null, time?: string) => {
    if (!date) return;
    const start = match.index;
    const end = start + match[0].length;
    if (taken.some(([a, b]) => start < b && end > a)) return;
    taken.push([start, end]);
    found.push({ date, index: start, matched: original.slice(start, end).trim(), time });
  };
  const each = (pattern: RegExp, fn: (match: RegExpExecArray) => void) => {
    const re = new RegExp(pattern.source, 'g');
    let match: RegExpExecArray | null;
    while ((match = re.exec(lower)) !== null) fn(match);
  };

  // Written out in full, 2026-10-03. Checked first so nothing else nibbles
  // at its digits.
  each(/\b(\d{4})-(\d{2})-(\d{2})\b/, (m) => add(m, realDate(Number(m[1]), Number(m[2]) - 1, Number(m[3]))));

  // "3 October", "3rd of Oct 2027", "October 3", "Oct 3rd, 2027".
  each(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?(?:\\s+of)?\\s+(${MONTH_PATTERN})\\.?(?:,?\\s+(\\d{4}))?\\b`), (m) => {
    const day = Number(m[1]);
    const month = MONTH_WORDS[m[2]];
    add(m, m[3] ? realDate(Number(m[3]), month, day) : nearestYear(month, day, now, lean));
  });
  each(new RegExp(`\\b(${MONTH_PATTERN})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b(?:,?\\s+(\\d{4})\\b)?`), (m) => {
    const month = MONTH_WORDS[m[1]];
    const day = Number(m[2]);
    add(m, m[3] ? realDate(Number(m[3]), month, day) : nearestYear(month, day, now, lean));
  });

  each(/\bday after tomorrow\b/, (m) => add(m, atDay(now, 2)));
  each(/\bday before yesterday\b/, (m) => add(m, atDay(now, -2)));
  each(/\b(?:tomorrow|tmrw|tmw)\b/, (m) => add(m, atDay(now, 1)));
  each(/\byesterday\b/, (m) => add(m, atDay(now, -1)));
  each(/\btonight\b/, (m) => add(m, atDay(now, 0), '19:00'));
  each(/\btoday\b/, (m) => add(m, atDay(now, 0)));

  // "in 3 days", "in two weeks", "in a month", "in 2 years".
  each(/\bin\s+(\d+|a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(day|week|month|year)s?\b/, (m) => {
    const n = readNumber(m[1]);
    if (n === null) return;
    if (m[2] === 'day') add(m, atDay(now, n));
    else if (m[2] === 'week') add(m, atDay(now, n * 7));
    else if (m[2] === 'month') add(m, monthsOn(now, n));
    else add(m, monthsOn(now, n * 12));
  });
  // "3 days ago", "two weeks ago".
  each(/\b(\d+|a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(day|week|month|year)s?\s+ago\b/, (m) => {
    const n = readNumber(m[1]);
    if (n === null) return;
    if (m[2] === 'day') add(m, atDay(now, -n));
    else if (m[2] === 'week') add(m, atDay(now, -n * 7));
    else if (m[2] === 'month') add(m, monthsOn(now, -n));
    else add(m, monthsOn(now, -n * 12));
  });

  // Weekdays. Bare, "this" or "on" means the next one to come (today counts
  // only with "this"); "next" means the one in next week when this week's
  // is still ahead; "last" means the one gone.
  each(/\b(?:(this|next|last|on)\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/, (m) => {
    const target = WEEKDAYS.indexOf(m[2]);
    const today = now.getDay();
    const modifier = m[1] ?? '';
    if (modifier === 'last' || (lean === 'past' && modifier !== 'next' && modifier !== 'this')) {
      const back = ((today - target + 7) % 7) || 7;
      add(m, atDay(now, -back));
      return;
    }
    let ahead = (target - today + 7) % 7;
    if (ahead === 0 && modifier !== 'this') ahead = 7;
    if (modifier === 'next') {
      // Monday-start weeks: this week's Friday seen on a Tuesday is "this
      // Friday", so "next Friday" is the one after it.
      const daysLeftInWeek = (7 - ((today + 6) % 7)) - 1;
      if (ahead <= daysLeftInWeek) ahead += 7;
    }
    add(m, atDay(now, ahead));
  });

  each(/\b(?:this\s+)?weekend\b/, (m) => {
    const ahead = ((6 - now.getDay() + 7) % 7) || 7;
    add(m, atDay(now, now.getDay() === 0 ? 6 : ahead));
  });
  each(/\bnext week\b/, (m) => add(m, atDay(now, ((1 - now.getDay() + 7) % 7) || 7)));
  each(/\bnext month\b/, (m) => add(m, new Date(now.getFullYear(), now.getMonth() + 1, 1)));
  each(/\bnext year\b/, (m) => add(m, new Date(now.getFullYear() + 1, 0, 1)));

  // "the 15th": the next 15th coming, or the last one gone.
  each(/\bthe\s+(\d{1,2})(?:st|nd|rd|th)\b/, (m) => {
    const day = Number(m[1]);
    if (day < 1 || day > 31) return;
    const today = atDay(now, 0).getTime();
    for (let step = 0; step < 13; step += 1) {
      const offset = lean === 'future' ? step : -step;
      const month = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      const shifted = realDate(month.getFullYear(), month.getMonth(), day);
      if (!shifted) continue;
      if (lean === 'future' ? shifted.getTime() >= today : shifted.getTime() <= today) {
        add(m, shifted);
        return;
      }
    }
  });

  return found.sort((a, b) => a.index - b.index);
}

// Months on from today, landing on the same day of the month or the last
// day of a shorter one, so "in a month" from 31 January is 28 February.
function monthsOn(now: Date, months: number): Date {
  const first = new Date(now.getFullYear(), now.getMonth() + months, 1);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  return new Date(first.getFullYear(), first.getMonth(), Math.min(now.getDate(), last));
}

// The first time of day named. "at 3" with no am or pm is read the way it is
// usually meant: 7 to 11 in the morning, 12 as noon, 1 to 6 in the
// afternoon. It is shown in full beside its button, so a wrong reading is
// seen before it is used.
function findTime(lower: string): { time: string; minutesFromNow?: number } | null {
  const inMinutes = /\bin\s+(\d+|a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|half an)\s+(minute|min|hour|hr)s?\b/.exec(lower);
  if (inMinutes) {
    const n = inMinutes[1] === 'half an' ? 0.5 : readNumber(inMinutes[1]);
    if (n !== null) {
      const unit = inMinutes[2].startsWith('h') ? 60 : 1;
      return { time: '', minutesFromNow: Math.round(n * unit) };
    }
  }
  const clock = /\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)(?![a-z])/.exec(lower)
    ?? /\b(?:at\s+)?(\d{1,2}):(\d{2})\b()/.exec(lower)
    ?? /\bat\s+(\d{1,2})\b(?!\s*(?:days?|weeks?|months?|years?|%|kg|g\b|lb))()()/.exec(lower);
  if (clock) {
    let hour = Number(clock[1]);
    const minute = clock[2] ? Number(clock[2]) : 0;
    const half = (clock[3] ?? '').replace(/\./g, '');
    if (hour > 23 || minute > 59) return null;
    if (half === 'pm' && hour < 12) hour += 12;
    else if (half === 'am' && hour === 12) hour = 0;
    else if (!half && !clock[2] && hour >= 1 && hour <= 6) hour += 12;
    else if (half && hour > 12) return null;
    return { time: `${pad(hour)}:${pad(minute)}` };
  }
  if (/\bnoon\b|\bmidday\b/.test(lower)) return { time: '12:00' };
  if (/\bmidnight\b/.test(lower)) return { time: '00:00' };
  if (/\bmorning\b/.test(lower)) return { time: '09:00' };
  if (/\bafternoon\b/.test(lower)) return { time: '15:00' };
  if (/\bevening\b|\btonight\b/.test(lower)) return { time: '19:00' };
  return null;
}

/**
 * Every date the words name, earliest mention first, at most three, each
 * carrying the time of day the words name (the same time for all of them,
 * since a note naming two days and one time rarely means otherwise).
 *
 * A time with no day ("at 3") is read as the next time that clock comes
 * round: today if it is still ahead, tomorrow if not. "In 20 minutes" is
 * read from now.
 */
export function readPlainDates(text: string, now: Date, lean: Lean = 'future'): PlainDate[] {
  if (typeof text !== 'string' || !text.trim()) return [];
  const lower = text.toLowerCase();
  const time = findTime(lower);
  const dates = findDates(lower, text, now, lean);

  if (time?.minutesFromNow !== undefined && dates.length === 0) {
    const at = new Date(now.getTime() + time.minutesFromNow * 60_000);
    return [{ date: dateKey(at), time: `${pad(at.getHours())}:${pad(at.getMinutes())}`, matched: '' }];
  }
  const clock = time && time.minutesFromNow === undefined ? time.time : null;

  if (dates.length === 0) {
    if (!clock || lean === 'past') return [];
    const [h, m] = clock.split(':').map(Number);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
    const day = today.getTime() > now.getTime() ? today : atDay(now, 1);
    return [{ date: dateKey(day), time: clock, matched: '' }];
  }

  const seen = new Set<string>();
  const out: PlainDate[] = [];
  for (const found of dates) {
    const key = dateKey(found.date);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ date: key, time: clock ?? found.time ?? null, matched: found.matched });
    if (out.length === 3) break;
  }
  return out;
}

/**
 * For a date box: the words in the box read as one date, or null. A box
 * already holding 'YYYY-MM-DD' gives null, since there is nothing to offer.
 */
export function readPlainDateField(text: string, now: Date, lean: Lean): PlainDate | null {
  if (typeof text !== 'string') return null;
  const trimmed = text.trim();
  if (!trimmed || /^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  return readPlainDates(trimmed, now, lean)[0] ?? null;
}

function clockLabel(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`;
}

/** "Today at 3:00 PM", "Tomorrow", "Friday 3 October", "Monday 3 March 2031". */
export function describePlainDate(found: PlainDate, now: Date): string {
  const [y, mo, d] = found.date.split('-').map(Number);
  const date = new Date(y, mo - 1, d);
  const todayKey = dateKey(now);
  let day: string;
  if (found.date === todayKey) day = 'Today';
  else if (found.date === dateKey(atDay(now, 1))) day = 'Tomorrow';
  else if (found.date === dateKey(atDay(now, -1))) day = 'Yesterday';
  else {
    day = `${WEEKDAY_LABELS[date.getDay()]} ${date.getDate()} ${MONTH_LABELS[date.getMonth()]}`;
    if (date.getFullYear() !== now.getFullYear()) day += ` ${date.getFullYear()}`;
  }
  return found.time ? `${day} at ${clockLabel(found.time)}` : day;
}

/** 'YYYY-MM-DDTHH:mm' for a reminder, using the given hour when the words
 *  named no time. */
export function plainDateToLocalDateTime(found: PlainDate, fallbackTime = '09:00'): string {
  return `${found.date}T${found.time ?? fallbackTime}`;
}

/** Whole days from today to the date, for a Days Until counter. */
export function daysFromToday(found: PlainDate, now: Date): number {
  const [y, mo, d] = found.date.split('-').map(Number);
  const target = new Date(y, mo - 1, d).getTime();
  return Math.round((target - atDay(now, 0).getTime()) / 86_400_000);
}
