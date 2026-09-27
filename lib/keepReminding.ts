// Keep reminding me until I mark it (C2 of the competitive build plan,
// Phase 2, 2026-09-26).
//
// Until now one switch in Profile > Reminders decided, for every reminder at
// once, whether it came back: three follow-ups at 15, 45 and 90 minutes.
// Somebody who needs the morning pill repeated every ten minutes and never
// wants the bins repeated at all had to pick one answer for both. Each
// routine, each Did I Do It check and each reminder somebody sets now
// carries a choice of its own:
//
//   null  follow the Profile switch (the old behaviour, and the default)
//   0     once, never again, whatever the switch says
//   N     every N minutes, whatever the switch says, because asking for it
//         on this one thing is the request
//
// A follow-up stops the moment the thing is marked, because every reminder
// that uses these is rebuilt from the record at the next reconcile and a
// marked thing has nothing left to build from. It also stops by itself
// after KEEP_REMINDING_SPAN_MINUTES, so a phone left in a drawer is not
// buzzing all afternoon about a pill from breakfast.
//
// Pure on purpose, with no expo import and no database, so
// scripts/test_keep_reminding.js can check it without a phone.

import { NUDGE_FOLLOW_UP_MINUTES } from './reminderSchedule';
import type { DoneCheck } from './routines';

export type KeepReminding = number | null;

/** How long any one reminder keeps coming back, at most. */
export const KEEP_REMINDING_SPAN_MINUTES = 120;
/** And how many times, at most, whatever the interval. */
export const KEEP_REMINDING_MAX_REPEATS = 8;

export const KEEP_REMINDING_INTERVALS = [5, 10, 15, 30, 60];

const FOLLOW_SWITCH = 'switch';
const ONCE = '0';

export const KEEP_REMINDING_OPTIONS: { label: string; value: string }[] = [
  { label: 'As set in Profile', value: FOLLOW_SWITCH },
  { label: 'Once only', value: ONCE },
  ...KEEP_REMINDING_INTERVALS.map((minutes) => ({ label: `Every ${describeInterval(minutes)}`, value: String(minutes) })),
];

function describeInterval(minutes: number): string {
  if (minutes === 60) return 'hour';
  return `${minutes} minutes`;
}

/** Whatever was stored, as one of the choices above. Anything else is null. */
export function cleanKeepReminding(value: unknown): KeepReminding {
  if (value === null || value === undefined) return null;
  const number = Number(value);
  if (number === 0) return 0;
  return KEEP_REMINDING_INTERVALS.includes(number) ? number : null;
}

export function keepRemindingValue(choice: KeepReminding): string {
  return choice === null ? FOLLOW_SWITCH : String(choice);
}

export function readKeepReminding(value: string): KeepReminding {
  return value === FOLLOW_SWITCH ? null : cleanKeepReminding(value);
}

/**
 * The minutes after the first reminder at which it comes back. Empty for
 * once only, and for "as set in Profile" while that switch is off.
 */
export function followUpMinutes(choice: KeepReminding, switchOn: boolean): number[] {
  if (choice === null) return switchOn ? [...NUDGE_FOLLOW_UP_MINUTES] : [];
  if (choice === 0) return [];
  const minutes: number[] = [];
  for (let at = choice; at <= KEEP_REMINDING_SPAN_MINUTES && minutes.length < KEEP_REMINDING_MAX_REPEATS; at += choice) {
    minutes.push(at);
  }
  return minutes;
}

/** The longest any follow-up can trail its first reminder, for how far back
 *  the reconcile has to look for something still outstanding. */
export const KEEP_REMINDING_LOOKBACK_MINUTES = Math.max(KEEP_REMINDING_SPAN_MINUTES, ...NUDGE_FOLLOW_UP_MINUTES);

/** The helper line under the picker. */
export function describeKeepReminding(choice: KeepReminding, switchOn: boolean): string {
  if (choice === 0) return 'It says it once and leaves it there.';
  if (choice === null) {
    return switchOn
      ? 'It comes back 15, 45 and 90 minutes later until you mark it, the way Profile > Reminders is set.'
      : 'It says it once, the way Profile > Reminders is set. Pick an interval to have this one come back until you mark it.';
  }
  const count = followUpMinutes(choice, switchOn).length;
  return `It comes back every ${describeInterval(choice)} until you mark it, ${count} more times at most.`;
}

// --- Did I Do It checks that speak -------------------------------------------

export type CheckReminder = {
  /** 'HH:mm', or null for a check nothing speaks about. */
  time: string | null;
  /** 0 is Sunday. Empty means every day. */
  days: number[];
  on: boolean;
};

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date: Date): Date {
  const day = startOfDay(date);
  const offset = (day.getDay() + 6) % 7;
  day.setDate(day.getDate() - offset);
  return day;
}

/** The start of the period a moment falls in, the same periods
 *  checkStanding in lib/routines.ts reads a check against. */
function periodOf(cadence: DoneCheck['cadence'], date: Date): number | null {
  if (cadence === 'daily') return startOfDay(date).getTime();
  if (cadence === 'weekly') return startOfWeek(date).getTime();
  if (cadence === 'monthly') return new Date(date.getFullYear(), date.getMonth(), 1).getTime();
  return null;
}

function cleanTime(time: string | null): [number, number] | null {
  if (!time) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return [hour, minute];
}

/**
 * Every moment a check should speak between the start of today and the
 * horizon, in order, including today's when it has already gone by, since
 * that is the one its follow-ups hang from. A day inside a period the check
 * is already marked in is skipped: a weekly check marked on Tuesday says
 * nothing on Thursday. A check with no period ('anytime') never speaks,
 * because there is nothing for it to be due in.
 */
export function checkReminderTimes(check: DoneCheck, reminder: CheckReminder, now: Date, withinDays: number): Date[] {
  if (!reminder.on || check.cadence === 'anytime' || !check.active) return [];
  const clock = cleanTime(reminder.time);
  if (!clock) return [];
  const marked = check.lastMarkedAt ? new Date(check.lastMarkedAt) : null;
  const markedPeriod = marked && !Number.isNaN(marked.getTime()) ? periodOf(check.cadence, marked) : null;
  const times: Date[] = [];
  for (let offset = 0; offset <= withinDays; offset += 1) {
    const day = startOfDay(now);
    day.setDate(day.getDate() + offset);
    if (reminder.days.length > 0 && !reminder.days.includes(day.getDay())) continue;
    if (markedPeriod !== null && periodOf(check.cadence, day) === markedPeriod) continue;
    times.push(new Date(day.getFullYear(), day.getMonth(), day.getDate(), clock[0], clock[1], 0, 0));
  }
  return times;
}

/**
 * Today's moment for a routine or a check that has already gone by and is
 * still outstanding, so its follow-ups survive a reconcile. Null when there
 * is none, or when it went by longer ago than any follow-up could trail it.
 */
export function outstandingSince(fireAt: Date | null, now: Date): Date | null {
  if (!fireAt) return null;
  const gap = now.getTime() - fireAt.getTime();
  if (gap <= 0 || gap > KEEP_REMINDING_LOOKBACK_MINUTES * 60_000) return null;
  return fireAt;
}
