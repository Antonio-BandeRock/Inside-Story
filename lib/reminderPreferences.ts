// Which kinds of reminder are allowed to fire, 2026-09-16.
//
// Until now lib/reminderNotifications.ts had exactly two kinds, doses and
// appointments, and both were on for anyone who granted the permission.
// Meals and hydration join them in the same pass, and they change the
// arithmetic enough that a switch stopped being optional: a day can hold
// three or four meals and, once the Daily Meal Plan has filled a water gap,
// up to six drink reminders on top of whatever doses are already scheduled.
// Sent unasked, that is the fastest way to make someone turn off
// notifications for this app altogether, which would silently take the dose
// reminders with it. So each kind gets its own switch, in Profile >
// Reminders.
//
// Same shape as lib/generalHealthPreferences.ts and lib/visualPreferences.ts
// (one JSON blob under a single app_meta key, a module-level cache and a
// subscriber list so a toggle reaches anything mounted without a restart),
// kept in its own file for the same reason that one is: it changes what the
// app does, not how it looks.

import { getDatabase } from './db';

export type ReminderKindKey =
  | 'dose'
  | 'appointment'
  | 'meal'
  | 'hydration'
  | 'garden'
  | 'bill'
  | 'upkeep'
  | 'benefit';

// Four more, 2026-09-16, direct request. Everything in Life that carries
// a date could be looked at and none of it could speak: a bill due on the
// 5th, a service six months after it was last done, a work allowance that
// resets with money still in it. Garden tasks joined them in the same pass
// and were the cheapest of the four, because a garden task already IS a
// schedule_items row (item_type 'garden') and only ever needed a kind.
//
// Order here is the order the switches appear in Profile > Reminders, so
// it runs from the timed things to the dated ones rather than by when
// each was built.
export const ALL_REMINDER_KIND_KEYS: ReminderKindKey[] = [
  'dose',
  'appointment',
  'meal',
  'hydration',
  'garden',
  'bill',
  'upkeep',
  'benefit',
];

export const REMINDER_KIND_LABELS: Record<ReminderKindKey, string> = {
  dose: 'Medications & supplements',
  appointment: 'Appointments',
  meal: 'Meals',
  hydration: 'Water & drinks',
  garden: 'Garden tasks',
  bill: 'Bills',
  upkeep: 'Upkeep & renewals',
  benefit: 'Work benefits',
};

export const REMINDER_KIND_CAPTIONS: Record<ReminderKindKey, string> = {
  dose: 'Each dose time you set in Schedules > Meds, at the time it is due.',
  appointment: 'About an hour before an appointment starts.',
  meal: 'Each meal you have scheduled, at the time you planned it for.',
  hydration:
    'Every drink on your Hydration schedule. A day the Meal Plan has filled a water gap for can hold six of these, so this one starts off.',
  garden: 'Anything planned in Garden > Upcoming Tasks, at the time it is set for.',
  bill:
    'A bill from Life > Finances, three days ahead and again on the day. Anything set to pay itself is left out.',
  upkeep:
    'Something from Life > Upkeep coming due or running out: two weeks ahead, three days ahead, then the day itself.',
  benefit:
    'A work benefit resetting with some of it unused, a month ahead and again a week ahead, while there is still time to book something.',
};

// Defaults per kind rather than one blanket default, because they honestly
// differ. Doses and appointments keep the behaviour they already shipped
// with. Meals are on: they are the ones someone scheduled deliberately,
// there are only a few a day, and forgetting to eat is the problem this was
// asked for. Hydration is off until asked for, because it is the high-volume
// one and most of those rows were generated to close a water gap rather than
// chosen one at a time.
//
// The four added in 1.0.39.8 are all on, and for one reason: they are all
// low volume and all of them are things somebody typed in precisely
// because they did not want to be the one holding it in their head. A
// handful of bills a month, a service or two a year, a benefit that resets
// once, and whatever garden work was deliberately scheduled. None of them
// can produce the six-in-a-day pile that made hydration start off.
const DEFAULT_REMINDER_KIND_ENABLED: Record<ReminderKindKey, boolean> = {
  dose: true,
  appointment: true,
  meal: true,
  hydration: false,
  garden: true,
  bill: true,
  upkeep: true,
  benefit: true,
};

// Nudging is off, and that is the whole reason it is a switch. A reminder
// that keeps coming back until the thing is marked done is the difference
// between a reminder and nothing at all for somebody whose hands were full
// when it arrived. For everybody else it is nagging, and nagging is how an
// app gets its notifications switched off completely.
const DEFAULT_NUDGE_UNTIL_DONE = false;

export type ReminderPreferences = {
  // Whether a reminder comes back until the thing is marked done, rather
  // than firing once and being gone. Undefined means the default above.
  // See lib/reminderSchedule.ts for what "comes back" means for each kind,
  // and for which kinds honestly cannot do it because nothing in the app
  // records that they were finished.
  nudgeUntilDone?: boolean;
  // Only what the person has actually changed. A key missing here means
  // "whatever DEFAULT_REMINDER_KIND_ENABLED says," so a kind added later
  // picks up its own default without needing a migration, and so changing a
  // default is a one-line change that reaches everyone who never touched
  // that switch.
  enabledKinds: Partial<Record<ReminderKindKey, boolean>>;
};

const DEFAULT_REMINDER_PREFERENCES: ReminderPreferences = { enabledKinds: {} };

const REMINDER_PREFERENCES_KEY = 'reminder_preferences';

let cached: ReminderPreferences | null = null;
let loadingPromise: Promise<ReminderPreferences> | null = null;
const listeners = new Set<(prefs: ReminderPreferences) => void>();

function notifyListeners() {
  if (!cached) return;
  const snapshot = cached;
  listeners.forEach((listener) => listener(snapshot));
}

export function isReminderKindEnabled(prefs: ReminderPreferences, key: ReminderKindKey): boolean {
  return prefs.enabledKinds[key] ?? DEFAULT_REMINDER_KIND_ENABLED[key];
}

export function isNudgeUntilDoneEnabled(prefs: ReminderPreferences): boolean {
  return prefs.nudgeUntilDone ?? DEFAULT_NUDGE_UNTIL_DONE;
}

// A synchronous answer for a first render, before the load below resolves.
// Returns the cached value once there is one, otherwise the defaults, which
// is what the reconcile would have done anyway.
export function getCachedReminderPreferences(): ReminderPreferences {
  return cached ?? DEFAULT_REMINDER_PREFERENCES;
}

export async function getReminderPreferences(): Promise<ReminderPreferences> {
  if (cached) return cached;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM app_meta WHERE key = ?',
      REMINDER_PREFERENCES_KEY,
    );

    let loaded = DEFAULT_REMINDER_PREFERENCES;
    if (row?.value) {
      try {
        const parsed = JSON.parse(row.value) as Partial<ReminderPreferences>;
        loaded = {
          enabledKinds: { ...(parsed.enabledKinds ?? {}) },
          nudgeUntilDone: typeof parsed.nudgeUntilDone === 'boolean' ? parsed.nudgeUntilDone : undefined,
        };
      } catch {
        // A blob that will not parse falls back to defaults rather than
        // throwing. This is a preference, not health data.
        loaded = DEFAULT_REMINDER_PREFERENCES;
      }
    }

    cached = loaded;
    return loaded;
  })();

  const result = await loadingPromise;
  loadingPromise = null;
  return result;
}

// Writes one kind's switch, leaving the others alone. The caller is the one
// that reconciles afterwards (syncReminderNotifications), so that this file
// never has to import the notification module it is a setting for.
export async function setReminderKindEnabled(
  key: ReminderKindKey,
  enabled: boolean,
): Promise<ReminderPreferences> {
  const current = await getReminderPreferences();
  return persist({ ...current, enabledKinds: { ...current.enabledKinds, [key]: enabled } });
}

// Same contract as the kind switches: written here, reconciled by the
// caller, so this file never imports the notification module it is a
// setting for.
export async function setNudgeUntilDone(enabled: boolean): Promise<ReminderPreferences> {
  const current = await getReminderPreferences();
  return persist({ ...current, nudgeUntilDone: enabled });
}

async function persist(merged: ReminderPreferences): Promise<ReminderPreferences> {
  cached = merged;
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `
      INSERT INTO app_meta (key, value, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `,
    REMINDER_PREFERENCES_KEY,
    JSON.stringify(merged),
    now,
  );

  notifyListeners();
  return merged;
}

export function subscribeToReminderPreferences(listener: (prefs: ReminderPreferences) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
