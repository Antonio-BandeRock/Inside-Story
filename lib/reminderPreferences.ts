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

export type ReminderKindKey = 'dose' | 'appointment' | 'meal' | 'hydration';

export const ALL_REMINDER_KIND_KEYS: ReminderKindKey[] = ['dose', 'appointment', 'meal', 'hydration'];

export const REMINDER_KIND_LABELS: Record<ReminderKindKey, string> = {
  dose: 'Medications & supplements',
  appointment: 'Appointments',
  meal: 'Meals',
  hydration: 'Water & drinks',
};

export const REMINDER_KIND_CAPTIONS: Record<ReminderKindKey, string> = {
  dose: 'Each dose time you set in Schedules > Meds, at the time it is due.',
  appointment: 'About an hour before an appointment starts.',
  meal: 'Each meal you have scheduled, at the time you planned it for.',
  hydration:
    'Every drink on your Hydration schedule. A day the Meal Plan has filled a water gap for can hold six of these, so this one starts off.',
};

// Defaults per kind rather than one blanket default, because they honestly
// differ. Doses and appointments keep the behaviour they already shipped
// with. Meals are on: they are the ones someone scheduled deliberately,
// there are only a few a day, and forgetting to eat is the problem this was
// asked for. Hydration is off until asked for, because it is the high-volume
// one and most of those rows were generated to close a water gap rather than
// chosen one at a time.
const DEFAULT_REMINDER_KIND_ENABLED: Record<ReminderKindKey, boolean> = {
  dose: true,
  appointment: true,
  meal: true,
  hydration: false,
};

export type ReminderPreferences = {
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
        loaded = { enabledKinds: { ...(parsed.enabledKinds ?? {}) } };
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
  const merged: ReminderPreferences = {
    enabledKinds: { ...current.enabledKinds, [key]: enabled },
  };

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
