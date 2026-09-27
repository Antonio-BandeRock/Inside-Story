// "Pick a few things for today", C15 of the competitive build plan (Phase 2,
// 2026-09-26). The person picks a handful of Did I Do It checks for one day;
// whether each happened is read from that check's marks, so a mark made
// anywhere counts. Nothing here is a tally, a percentage or a verdict: a pick
// reads as done, with the time, or as nothing at all, and yesterday's picks
// never follow anybody into today unless they ask. Pure, so
// scripts/test_today_picks.js can check it without a phone.

/** A few, not a to-do list. */
export const MAX_TODAY_PICKS = 5;

export type TodayPick = {
  checkId: string;
  name: string;
  /** The time of the latest mark on this check that falls on the day, or
   *  null when there is none. ISO, as done_check_marks stores it. */
  doneAt: string | null;
};

/** The LOCAL day of a stored ISO stamp. done_check_marks.marked_at is UTC,
 *  so slicing ten characters off it would put every evening mark west of
 *  Greenwich on tomorrow (see dayOf in lib/keepingUpDb.ts). */
export function localDayOf(value: string | null | undefined): string | null {
  if (!value) return null;
  const when = new Date(value);
  if (Number.isNaN(when.getTime())) return null;
  return `${when.getFullYear()}-${`${when.getMonth() + 1}`.padStart(2, '0')}-${`${when.getDate()}`.padStart(2, '0')}`;
}

export function localDayKey(now: Date): string {
  return localDayOf(now.toISOString()) as string;
}

/** The latest of a check's marks that lands on the day, or null. */
export function latestMarkOnDay(marks: string[], day: string): string | null {
  let latest: string | null = null;
  for (const mark of marks) {
    if (localDayOf(mark) !== day) continue;
    if (latest === null || Date.parse(mark) > Date.parse(latest)) latest = mark;
  }
  return latest;
}

function clock(iso: string): string {
  const when = new Date(iso);
  const hour = when.getHours();
  const minute = `${when.getMinutes()}`.padStart(2, '0');
  const suffix = hour < 12 ? 'AM' : 'PM';
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelve}:${minute} ${suffix}`;
}

/** The line under a pick: when it was done, or nothing. */
export function describeTodayPick(pick: TodayPick): string | null {
  return pick.doneAt ? `Done at ${clock(pick.doneAt)}` : null;
}

/** Whether another pick can be added. */
export function canPickMore(count: number): boolean {
  return count < MAX_TODAY_PICKS;
}

/** The line at the top of the card before anything is picked. */
export const TODAY_PICKS_EMPTY =
  'Pick a few things you want to get to today. Each one is a Did I Do It check, so marking it here or anywhere else counts.';
