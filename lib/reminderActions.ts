// Buttons on the notification itself (C1 of the competitive build plan,
// 2026-09-26). Until now every reminder carried the one Snooze button, so
// answering a dose reminder meant opening the app, finding Meds and tapping
// the dose, which is three steps too many for somebody whose hands were full
// when it arrived. Each kind now carries the one answer the app already
// knows how to record for it, beside Snooze.
//
// Pure on purpose, with no expo import and no database, so
// scripts/test_reminder_actions.js can check every kind without a phone.
// lib/reminderNotifications.ts registers the categories and does the writes.
//
// Every button opens the app for a moment (opensAppToForeground). A button
// that does not do so needs a background task to run anything at all, and
// expo-task-manager is not installed; adding it is a native rebuild. The
// same reason the Snooze button has always opened the app. It also means
// the person lands where the thing is kept and can see the answer went in.
//
// What gets a button, and what deliberately does not:
//   - A dose, a drink and a planned meal write the same schedule status the
//     Reconciliation screen writes for "Took it", "Drank it" and "Ate it".
//   - A garden task and a thing noted down in Capture write "completed",
//     the same as Reconciliation's "Did it".
//   - Upkeep on a cadence ("every six months") records a doing for today,
//     the same as the Upkeep lens. Something that EXPIRES does not get the
//     button, because renewing it needs the new expiry date, which a button
//     cannot ask for.
//   - A compost pile records a turn for today.
//   - The two check-in kinds open Signals: How are you on a general note,
//     Log a flare on Flares. Nothing is written by the button itself,
//     because how somebody feels is theirs to put into words.
//   - Appointments, bills, work benefits, Days Until counters and routines
//     keep Snooze only. Nothing in the app records a bill as paid or a
//     benefit as used, a counter is marked done where it lives, and a
//     routine is a walk of several steps that its tap already opens.

export type ReminderActionId =
  | 'snooze'
  | 'taken'
  | 'drank'
  | 'ate'
  | 'done'
  | 'doneToday'
  | 'turned'
  | 'howAreYou'
  | 'logFlare';

export type ReminderCategoryKey = 'plain' | 'dose' | 'hydration' | 'meal' | 'task' | 'upkeep' | 'compost' | 'checkin';

// 'plain' keeps the identifier the single category always had, so a
// Snooze-only reminder already queued is still correct and is left alone
// by the reconcile rather than replaced.
export const REMINDER_CATEGORY_IDS: Record<ReminderCategoryKey, string> = {
  plain: 'inside-story-reminder',
  dose: 'inside-story-reminder-dose',
  hydration: 'inside-story-reminder-drink',
  meal: 'inside-story-reminder-meal',
  task: 'inside-story-reminder-task',
  upkeep: 'inside-story-reminder-upkeep',
  compost: 'inside-story-reminder-compost',
  checkin: 'inside-story-reminder-checkin',
};

export const ALL_REMINDER_CATEGORY_KEYS = Object.keys(REMINDER_CATEGORY_IDS) as ReminderCategoryKey[];

export function reminderActionTitle(action: ReminderActionId, snoozeMinutes: number): string {
  switch (action) {
    case 'snooze':
      return `Snooze ${snoozeMinutes} min`;
    case 'taken':
      return 'Taken';
    case 'drank':
      return 'Drank it';
    case 'ate':
      return 'Ate it';
    case 'done':
      return 'Done';
    case 'doneToday':
      return 'Done today';
    case 'turned':
      return 'Turned it';
    case 'howAreYou':
      return 'How are you';
    case 'logFlare':
      return 'Log a flare';
  }
}

// Android shows three buttons at most, so no category may list more.
export const CATEGORY_ACTIONS: Record<ReminderCategoryKey, ReminderActionId[]> = {
  plain: ['snooze'],
  dose: ['taken', 'snooze'],
  hydration: ['drank', 'snooze'],
  meal: ['ate', 'snooze'],
  task: ['done', 'snooze'],
  upkeep: ['doneToday', 'snooze'],
  compost: ['turned', 'snooze'],
  checkin: ['howAreYou', 'logFlare', 'snooze'],
};

/**
 * Which set of buttons a reminder of this kind carries. `markable` is false
 * for the one case inside a kind that cannot be answered with a button: an
 * upkeep item that expires rather than recurs.
 */
export function categoryKeyFor(kind: string, markable = true): ReminderCategoryKey {
  switch (kind) {
    case 'dose':
      return 'dose';
    case 'hydration':
      return 'hydration';
    case 'meal':
      return 'meal';
    case 'garden':
    case 'reminder':
      return 'task';
    case 'upkeep':
      return markable ? 'upkeep' : 'plain';
    case 'compost':
      return 'compost';
    case 'checkin':
    case 'afterMeal':
      return 'checkin';
    default:
      return 'plain';
  }
}

export type ReminderActionPlan =
  | { write: 'scheduleStatus'; status: 'logged' | 'completed'; lands: 'usual' }
  | { write: 'upkeepDone'; lands: 'usual' }
  | { write: 'compostTurned'; lands: 'usual' }
  | { write: null; lands: 'generalNote' | 'flares' };

/**
 * What a pressed button does. Null for Snooze (handled on its own), for a
 * plain tap, and for any pairing a notification should never carry, since
 * everything read here came off a notification the phone has been holding,
 * possibly since before an update.
 */
export function planReminderAction(kind: string, action: string): ReminderActionPlan | null {
  if (action === 'howAreYou' && (kind === 'checkin' || kind === 'afterMeal')) {
    return { write: null, lands: 'generalNote' };
  }
  if (action === 'logFlare' && (kind === 'checkin' || kind === 'afterMeal')) {
    return { write: null, lands: 'flares' };
  }
  if (action === 'taken' && kind === 'dose') return { write: 'scheduleStatus', status: 'logged', lands: 'usual' };
  if (action === 'drank' && kind === 'hydration') return { write: 'scheduleStatus', status: 'logged', lands: 'usual' };
  if (action === 'ate' && kind === 'meal') return { write: 'scheduleStatus', status: 'logged', lands: 'usual' };
  if (action === 'done' && (kind === 'garden' || kind === 'reminder')) {
    return { write: 'scheduleStatus', status: 'completed', lands: 'usual' };
  }
  if (action === 'doneToday' && kind === 'upkeep') return { write: 'upkeepDone', lands: 'usual' };
  if (action === 'turned' && kind === 'compost') return { write: 'compostTurned', lands: 'usual' };
  return null;
}

// --- The two check-in reminders ---------------------------------------------

/** Minutes after a meal was eaten that the after-meal question arrives. */
export const AFTER_MEAL_MINUTES = 120;

export type LoggedMealForNudge = {
  id: string;
  name: string;
  mealType: string;
  /** Local 'YYYY-MM-DDTHH:mm', as meals.eaten_at stores it. */
  eatenAt: string;
};

function parseLocal(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!match) return null;
  const [, y, mo, d, h, mi] = match;
  const date = new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi));
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * The one after-meal question worth asking, or null. Only the latest meal
 * eaten in the last two hours is asked about, because a coffee at ten and
 * lunch at eleven are one stretch of eating and two questions about it would
 * be nagging. A drink logged on its own is not a meal and asks nothing, and
 * nothing is asked once the person has already checked in since eating.
 */
export function planAfterMealNudge(
  meals: LoggedMealForNudge[],
  lastCheckinAt: string | null,
  now: Date,
): { meal: LoggedMealForNudge; fireAt: Date } | null {
  let latest: { meal: LoggedMealForNudge; eaten: Date } | null = null;
  for (const meal of meals) {
    if (meal.mealType === 'beverage') continue;
    const eaten = parseLocal(meal.eatenAt);
    if (!eaten || eaten.getTime() > now.getTime()) continue;
    if (!latest || eaten.getTime() > latest.eaten.getTime()) latest = { meal, eaten };
  }
  if (!latest) return null;
  const fireAt = new Date(latest.eaten.getTime() + AFTER_MEAL_MINUTES * 60_000);
  if (fireAt.getTime() <= now.getTime()) return null;
  const checked = lastCheckinAt ? parseLocal(lastCheckinAt) : null;
  if (checked && checked.getTime() >= latest.eaten.getTime()) return null;
  return { meal: latest.meal, fireAt };
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function localDay(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Every "How are you today?" moment inside the window, soonest first. Today's
 * is left out once anything has been checked in today, since the question
 * has been answered.
 */
export function planDailyCheckins(time: string, now: Date, days: number, checkedInToday: boolean): Date[] {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) return [];
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return [];
  const out: Date[] = [];
  for (let offset = 0; offset <= days; offset += 1) {
    const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, hour, minute);
    if (at.getTime() <= now.getTime()) continue;
    if (offset === 0 && checkedInToday) continue;
    out.push(at);
  }
  return out;
}
