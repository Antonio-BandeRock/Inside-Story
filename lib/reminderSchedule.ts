// When a reminder speaks, for the things that carry a date rather than a
// time, and when one comes back, 2026-09-16.
//
// Everything lib/reminderNotifications.ts handled until now was a
// schedule_items row with a wall-clock time on it: a dose at 7:45, an
// appointment at 2pm. Bills, upkeep and expiring work benefits are not like
// that. They carry a DATE and nothing else, they live in their own tables in
// Life, and the useful reminder is not "now" but "a while before", because
// the whole point of knowing a bill is due on the 5th is having time to do
// something about it on the 2nd.
//
// So this file answers two questions and holds no data of its own:
//
//   1. Which days does a dated thing speak up on?
//   2. Does it come back after that, and for how long?
//
// It deliberately imports nothing. That is what lets scripts/test_reminder_
// coverage.js load it straight through the TypeScript transpiler and check
// the arithmetic on a PC, the same way scripts/test_home_sections.js checks
// the Home grouping. Reading the tables is lib/reminderSources.ts's job and
// scheduling the notification is lib/reminderNotifications.ts's.

/** Dated reminders fire at 9am local, the hour a day's admin gets looked at.
 *  A date has no time of its own, so one had to be picked; picking it once
 *  here means a bill and a service renewal do not arrive at different hours
 *  for no reason. */
export const REMINDER_HOUR = 9;

/** The kinds that carry a date instead of a time. The first three live in
 *  Life; a countdown is a Days Until counter in Garden > Plots & Plantings,
 *  which joined 2026-09-21 by direct request ("Add a reminder on the day for
 *  a Days Until counter"). */
export type DatedReminderKind = 'bill' | 'upkeep' | 'benefit' | 'countdown';

export const ALL_DATED_REMINDER_KINDS: DatedReminderKind[] = ['bill', 'upkeep', 'benefit', 'countdown'];

/**
 * How many days ahead of the date each kind speaks up, longest lead first.
 *
 * These are judgment calls, and they differ because the amount of warning
 * that is useful differs. A bill needs long enough to move money, so three
 * days and then the day itself. Upkeep is a job somebody has to book or
 * make time for, so two weeks, then three days, then the day. A work
 * benefit that resets with allowance still sitting in it needs long enough
 * to actually get an appointment, which is the slowest of the three, so a
 * month and then a week; there is no day-of reminder because being told on
 * the day that a physiotherapy allowance resets tonight is not a reminder,
 * it is bad news.
 *
 * A Days Until counter speaks on the day and only on the day, because the
 * day is the whole of what it holds: the person typed "14 days to
 * germination" so that the fourteenth day would be pointed out to them.
 * Nothing needs booking ahead of it, and a counter that lands unnoticed is
 * not a crisis, so there is no lead and no warning.
 */
export const LEAD_DAYS: Record<DatedReminderKind, number[]> = {
  bill: [3, 0],
  upkeep: [14, 3, 0],
  benefit: [30, 7],
  countdown: [0],
};

/**
 * Which dated kinds keep coming back once the date has passed, when nudging
 * is switched on.
 *
 * Only upkeep, and the reason is honest rather than arbitrary: marking an
 * upkeep item done moves last_done_on (or renews expires_on), which moves
 * the next date, which is how the reconcile knows to stop. Nothing in this
 * app records that one particular month of one particular recurring bill
 * got paid, and a work benefit is used down gradually rather than finished,
 * so for those two "until it is done" has nothing to read. Rather than
 * nagging about something it cannot tell the state of, neither one repeats.
 *
 * A countdown could honestly repeat (Done takes it out of the running list)
 * and deliberately does not: a counter past its day is meant to keep
 * counting on screen so the person can see how far past the mark the plant
 * is running, and that is a thing to look at, not a thing left undone.
 */
export const NUDGES_WHILE_OVERDUE: DatedReminderKind[] = ['upkeep'];

/** An overdue nudge gives up after two weeks. Something ignored for a
 *  fortnight is a decision, not a thing that was forgotten, and a daily
 *  notification for the rest of the year would only teach someone to swipe
 *  this app away without looking. */
export const MAX_OVERDUE_NUDGE_DAYS = 14;

/**
 * Minutes after a timed reminder that it comes back, when nudging is on.
 *
 * Direct request: "a reminder that comes back until it is marked done,
 * rather than firing once and being gone. Someone who swipes a notification
 * away with their hands full has lost the thought entirely, so one-shot is
 * the same as none."
 *
 * Three follow-ups over an hour and a half, spreading out rather than
 * drumming, so the last one lands while the thing is still worth doing. They
 * stop because they are cancelled, not because they run out: marking the
 * dose taken or the task done takes the row out of the candidate list, and
 * the next reconcile clears whatever it had queued. Opening the app is what
 * triggers that reconcile, and opening the app is also how something gets
 * marked done, so the two happen together.
 */
export const NUDGE_FOLLOW_UP_MINUTES = [15, 45, 90];

// --- Dates ------------------------------------------------------------------
// Plain local 'YYYY-MM-DD' throughout, never `new Date(str)`, which parses a
// bare date as UTC midnight and shifts the day west of Greenwich. Same
// convention and reasoning as lib/financeSchedule.ts and lib/upkeep.ts.

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function parts(dateStr: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.slice(0, 10));
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return { y, m, d };
}

export function addDaysToDate(dateStr: string, days: number): string | null {
  const p = parts(dateStr);
  if (!p) return null;
  const moved = new Date(Date.UTC(p.y, p.m - 1, p.d));
  moved.setUTCDate(moved.getUTCDate() + days);
  return `${moved.getUTCFullYear()}-${pad(moved.getUTCMonth() + 1)}-${pad(moved.getUTCDate())}`;
}

/** Whole days from `a` to `b`, positive when `b` is later. Null when either
 *  side is not a date, which is a real answer rather than a zero. */
export function daysBetweenDates(a: string, b: string): number | null {
  const pa = parts(a);
  const pb = parts(b);
  if (!pa || !pb) return null;
  const ta = Date.UTC(pa.y, pa.m - 1, pa.d);
  const tb = Date.UTC(pb.y, pb.m - 1, pb.d);
  return Math.round((tb - ta) / 86400000);
}

// --- What speaks, and when --------------------------------------------------

export type DatedReminderDay = {
  /** The day this one fires on, 'YYYY-MM-DD'. */
  on: string;
  /** Days between firing and the date itself: 3 means three days ahead, 0
   *  the day itself, and a negative number is an overdue nudge. This is what
   *  the notification wording is built from, so the same day can honestly say
   *  "in three days" or "still not done". */
  lead: number;
};

/**
 * Every day one dated thing should speak on, soonest first, including days
 * already past: filtering those out needs the current clock rather than the
 * current date, so lib/reminderNotifications.ts does it.
 *
 * `nudge` only ever adds days, and only for a kind in NUDGES_WHILE_OVERDUE.
 * With it off, a dated reminder has its say on its lead days and then goes
 * quiet, leaving an overdue item to the Life screen that already lists it.
 * That is exactly what the switch means, so nobody gets nagged who did not
 * ask to be.
 */
export function datedReminderDays(
  kind: DatedReminderKind,
  dueOn: string,
  today: string,
  nudge: boolean,
): DatedReminderDay[] {
  if (!parts(dueOn) || !parts(today)) return [];

  const byDay = new Map<string, number>();
  for (const lead of LEAD_DAYS[kind]) {
    const on = addDaysToDate(dueOn, -lead);
    if (on) byDay.set(on, lead);
  }

  if (nudge && NUDGES_WHILE_OVERDUE.includes(kind)) {
    const overdueBy = daysBetweenDates(dueOn, today);
    // Zero counts: the day itself is already a lead day, and starting the
    // run at today rather than at dueOn keeps the count of nudges honest
    // for something that has been overdue since before the app was opened.
    if (overdueBy != null && overdueBy >= 0) {
      const remaining = MAX_OVERDUE_NUDGE_DAYS - overdueBy;
      for (let i = 0; i < remaining; i += 1) {
        const on = addDaysToDate(today, i);
        if (!on || byDay.has(on)) continue;
        const lead = daysBetweenDates(on, dueOn);
        if (lead != null) byDay.set(on, lead);
      }
    }
  }

  return [...byDay.entries()]
    .map(([on, lead]) => ({ on, lead }))
    .sort((a, b) => (a.on < b.on ? -1 : a.on > b.on ? 1 : 0));
}

/** "in 3 days", "today", "3 days ago". The wording a dated reminder leads
 *  with, so one line says both what it is and how much room is left. */
export function describeLead(lead: number): string {
  if (lead === 0) return 'today';
  if (lead === 1) return 'tomorrow';
  if (lead > 1) return `in ${lead} days`;
  if (lead === -1) return 'yesterday';
  return `${Math.abs(lead)} days ago`;
}
