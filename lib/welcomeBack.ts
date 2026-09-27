// Coming back after a gap, C16 of the competitive build plan (Phase 2,
// 2026-09-26), and the one clear next thing on Home, C18. When the last
// thing recorded anywhere is days old, Home says so in one sentence with one
// easy thing to do, and says nothing about the days in between: no count of
// what was not logged, no "missed", no catching up asked for. Otherwise the
// same card names the first Your Story item not done yet. Pure, so
// scripts/test_welcome_back.js can check it without a phone.

/** How many whole days without a record before the line appears. */
export const WELCOME_BACK_AFTER_DAYS = 3;

/** Stamps arrive in three shapes: an ISO string ('2026-09-26T14:05:00.000Z'),
 *  SQLite's datetime('now') ('2026-09-26 14:05:00', UTC with no zone
 *  marker), or a bare date ('2026-09-26', a local day). Returns ms, or null. */
export function parseRecordStamp(value: string | null | undefined): number | null {
  if (!value) return null;
  const text = value.trim();
  let ms: number;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [year, month, date] = text.split('-').map(Number);
    ms = new Date(year, month - 1, date, 12, 0).getTime();
  } else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(text)) {
    ms = Date.parse(`${text.replace(' ', 'T')}Z`);
  } else {
    ms = Date.parse(text);
  }
  return Number.isNaN(ms) ? null : ms;
}

/** The latest of several stamps, or null when there are none. */
export function latestStamp(values: (string | null | undefined)[]): number | null {
  let latest: number | null = null;
  for (const value of values) {
    const ms = parseRecordStamp(value);
    if (ms !== null && (latest === null || ms > latest)) latest = ms;
  }
  return latest;
}

/** Whole calendar days between the local day of `then` and the local day of
 *  `now`, so a record at 11 PM and a look at 1 AM are one day apart. */
export function calendarDaysBetween(then: number, now: number): number {
  const a = new Date(then);
  const b = new Date(now);
  const dayA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const dayB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((dayB - dayA) / 86_400_000);
}

export type WelcomeBack = {
  sentence: string;
  action: string;
};

/** The line, or null when there is nothing to come back from: no records at
 *  all (a first day is Your Story's to greet) or a record within the last
 *  couple of days. */
export function welcomeBackFor(latest: number | null, now: number): WelcomeBack | null {
  if (latest === null) return null;
  const days = calendarDaysBetween(latest, now);
  if (days < WELCOME_BACK_AFTER_DAYS) return null;
  const when = days < 14 ? `${days} days ago` : days < 60 ? `${Math.floor(days / 7)} weeks ago` : 'a while back';
  return {
    sentence: `The last thing recorded here was ${when}. Picking up from today works, and nothing in between needs filling in.`,
    action: 'Jot down how today is going',
  };
}
