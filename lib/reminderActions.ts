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
// No button opens the app (1.0.53.10, direct instruction 2026-09-26: "it
// should just do it rather than take the user to the app to do it there").
// The press is recorded where the notification sits and the reminder goes
// away. Until 1.0.53.9 every button opened the app for a moment. Nothing is
// shown afterwards (direct instruction, 2026-09-27): the person pressed the
// button, so a notification saying so is one more thing to clear.
//
// Android hands a press to the app's JavaScript whenever the app is still
// running in the background, which is most of the time. When the phone has
// closed the app completely, the press is kept and recorded the next time
// the app opens; recording it at once in that case needs expo-task-manager,
// which is a native rebuild and is on the list for the next one.
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
//   - A crop in My Crops (2026-10-01): Prepped on the get-ready reminder and
//     Sown on the sowing one record that step for that window, which is
//     what quiets it, the same as the buttons on the crop's row.
//   - The two check-in kinds take a typed reply on the notification itself:
//     Add a note saves the words as a general note in Signals, Log a flare
//     saves a flare with the words as its note. How somebody feels is
//     theirs to put into words, so the reply box is where the words come
//     from and no button supplies any. A note with no words saves nothing;
//     a flare with no words is still a flare, since pressing it was the
//     answer.
//   - The morning check-in asks how somebody slept with three of the sleep
//     scale's own words (direct instruction, 2026-10-01: a question on a
//     notification must be answerable on it, or its tap must open the place
//     it is answered). A press saves the word and brings up the energy
//     question with three of the energy scale's own words. Android shows
//     three buttons at most, so neither carries Snooze; the tap opens the
//     check-in on the sleep question, where all five words and a note are.
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
  | 'logFlare'
  | 'sleptPoorly'
  | 'sleptOkay'
  | 'sleptWell'
  | 'energyLow'
  | 'energySome'
  | 'energyPlenty'
  | 'prepped'
  | 'sown';

export type ReminderCategoryKey =
  | 'plain'
  | 'dose'
  | 'hydration'
  | 'meal'
  | 'task'
  | 'upkeep'
  | 'compost'
  | 'checkin'
  | 'morning'
  | 'energy'
  | 'cropPrep'
  | 'cropSow';

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
  morning: 'inside-story-reminder-morning',
  energy: 'inside-story-reminder-energy',
  cropPrep: 'inside-story-reminder-crop-prep',
  cropSow: 'inside-story-reminder-crop-sow',
};

// The 1 to 5 value each morning button saves. Each title is that value's
// word on its scale (SLEEP_QUALITY_WORDS in lib/morningCheckin.ts, the
// energy words in lib/dailyScales.ts), which scripts/test_reminder_actions.js
// checks, so a button never says one thing and saves another.
export const MORNING_BUTTON_VALUES: Partial<Record<ReminderActionId, number>> = {
  sleptPoorly: 2,
  sleptOkay: 3,
  sleptWell: 4,
  energyLow: 2,
  energySome: 3,
  energyPlenty: 5,
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
      return 'Add a note';
    case 'logFlare':
      return 'Log a flare';
    case 'sleptPoorly':
      return 'Poorly';
    case 'sleptOkay':
      return 'Okay';
    case 'sleptWell':
      return 'Well';
    case 'energyLow':
      return 'Low';
    case 'energySome':
      return 'Some';
    case 'energyPlenty':
      return 'Plenty';
    case 'prepped':
      return 'Prepped';
    case 'sown':
      return 'Sown';
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
  morning: ['sleptPoorly', 'sleptOkay', 'sleptWell'],
  energy: ['energyLow', 'energySome', 'energyPlenty'],
  cropPrep: ['prepped', 'snooze'],
  cropSow: ['sown', 'snooze'],
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
    case 'check':
    case 'todo':
      return 'task';
    case 'upkeep':
      return markable ? 'upkeep' : 'plain';
    case 'compost':
      return 'compost';
    case 'checkin':
    case 'afterMeal':
      return 'checkin';
    case 'morning':
      return 'morning';
    case 'cropPrep':
      return 'cropPrep';
    case 'cropSow':
      return 'cropSow';
    default:
      return 'plain';
  }
}

/**
 * The two buttons that take a typed reply instead of a plain press. Android
 * and iPhone both open a small text box on the notification itself.
 */
export const ACTION_TEXT_INPUT: Partial<Record<ReminderActionId, { submitButtonTitle: string; placeholder: string }>> = {
  howAreYou: { submitButtonTitle: 'Save', placeholder: 'How are you? In your words' },
  logFlare: { submitButtonTitle: 'Save', placeholder: 'What is flaring? A few words is fine' },
};

export type ReminderActionPlan =
  | { write: 'scheduleStatus'; status: 'logged' | 'completed' }
  | { write: 'checkMarked' }
  | { write: 'upkeepDone' }
  | { write: 'compostTurned' }
  | { write: 'todoDone' }
  | { write: 'cropStep'; step: 'prepped' | 'sown' }
  | { write: 'checkinNote' }
  | { write: 'flare' }
  | { write: 'sleepQuality'; value: number }
  | { write: 'morningEnergy'; value: number };

/**
 * What a pressed button does. Null for Snooze (handled on its own), for a
 * plain tap, and for any pairing a notification should never carry, since
 * everything read here came off a notification the phone has been holding,
 * possibly since before an update.
 */
export function planReminderAction(kind: string, action: string): ReminderActionPlan | null {
  if (action === 'howAreYou' && (kind === 'checkin' || kind === 'afterMeal')) return { write: 'checkinNote' };
  if (action === 'logFlare' && (kind === 'checkin' || kind === 'afterMeal')) return { write: 'flare' };
  // The energy question is a morning reminder too, raised by the sleep
  // press with the energy buttons rather than planned on its own.
  const morningValue = MORNING_BUTTON_VALUES[action as ReminderActionId];
  if (kind === 'morning' && morningValue !== undefined) {
    return action.startsWith('slept') ? { write: 'sleepQuality', value: morningValue } : { write: 'morningEnergy', value: morningValue };
  }
  if (action === 'taken' && kind === 'dose') return { write: 'scheduleStatus', status: 'logged' };
  if (action === 'drank' && kind === 'hydration') return { write: 'scheduleStatus', status: 'logged' };
  if (action === 'ate' && kind === 'meal') return { write: 'scheduleStatus', status: 'logged' };
  if (action === 'done' && (kind === 'garden' || kind === 'reminder')) return { write: 'scheduleStatus', status: 'completed' };
  if (action === 'done' && kind === 'check') return { write: 'checkMarked' };
  if (action === 'doneToday' && kind === 'upkeep') return { write: 'upkeepDone' };
  if (action === 'turned' && kind === 'compost') return { write: 'compostTurned' };
  if (action === 'done' && kind === 'todo') return { write: 'todoDone' };
  if (action === 'prepped' && kind === 'cropPrep') return { write: 'cropStep', step: 'prepped' };
  if (action === 'sown' && kind === 'cropSow') return { write: 'cropStep', step: 'sown' };
  return null;
}

// --- What a reminder says, and what a press says back -----------------------

/**
 * The one sentence a reminder's body uses to say what its button records
 * and where, so nobody has to guess what pressing it will do. Null for a
 * reminder whose only button is Snooze.
 */
export function answerLine(kind: string, markable = true): string | null {
  switch (categoryKeyFor(kind, markable)) {
    case 'dose':
      return 'Taken marks it taken on Meds.';
    case 'hydration':
      return 'Drank it marks it on Hydration.';
    case 'meal':
      return "Ate it marks it eaten on Today's Meals.";
    case 'task':
      if (kind === 'garden') return 'Done marks it done in Upcoming Tasks.';
      if (kind === 'check') return 'Done marks it on Did I Do It.';
      if (kind === 'todo') return 'Done marks it done on your list.';
      return 'Done marks it done.';
    case 'upkeep':
      return 'Done today records it in Upkeep.';
    case 'compost':
      return 'Turned it records a turn for today.';
    case 'cropPrep':
      return 'Prepped records it in My Crops.';
    case 'cropSow':
      return 'Sown records it in My Crops.';
    case 'checkin':
      return 'Add a note or log a flare right here, in your words.';
    case 'morning':
      return 'Pick one here and the energy question follows, or tap for every answer and a note.';
    default:
      return null;
  }
}

// The question a sleep press brings up, answered with the energy buttons.
export const MORNING_ENERGY_TITLE = 'How much energy do you have?';
export const MORNING_ENERGY_BODY = 'Pick one here and it is saved with how you slept, or tap to add a note.';

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
