// Whether Android lets reminders arrive at their time (2026-10-01).
//
// Direct report: "many times when I open the app, that is when an app
// notification happens." Android 14 and later do not let an app set an
// alarm to the minute until the person allows it under Alarms & reminders,
// and without that, expo-notifications falls back to the kind of alarm
// Android may hold while the phone sits idle, which then arrives the moment
// the phone is picked up. Battery restrictions can hold them back the same
// way. This module reads both through modules/reminder-timing, asks once
// (and again a week later if still off), and queues every reminder again
// the moment on-time alarms become allowed, since an alarm already queued
// keeps the kind it was set as.
//
// The native module is missing on a phone running a build from before
// 1.0.58.2, on iOS (which has no such setting) and on the desktop, and
// every reading here answers null for unknown rather than guessing.

import { Alert, Platform } from 'react-native';
import ReminderTiming from '../modules/reminder-timing';
import { getDatabase } from './db';
import { hasReminderPermission, rescheduleAllReminders } from './reminderNotifications';

// One device-local row (DEVICE_LOCAL_META_KEYS): when the question was last
// asked, and whether on-time alarms were allowed at the last reading, so a
// switch turned on in Settings while the app was closed is noticed at the
// next start and nothing is queued again when nothing changed.
export const REMINDER_TIMING_ASKED_META_KEY = 'reminder_timing_asked';

export type ReminderTimingRecord = { askedAt: string | null; exact: boolean | null };

export function parseTimingRecord(value: string | null | undefined): ReminderTimingRecord {
  if (!value) return { askedAt: null, exact: null };
  try {
    const parsed = JSON.parse(value) as Partial<ReminderTimingRecord>;
    return {
      askedAt: typeof parsed.askedAt === 'string' ? parsed.askedAt : null,
      exact: typeof parsed.exact === 'boolean' ? parsed.exact : null,
    };
  } catch {
    return { askedAt: null, exact: null };
  }
}

// How long a "Not now" holds before the question comes back.
export const ASK_AGAIN_DAYS = 7;

export type ReminderTimingStatus = {
  /** On-time alarms allowed; null where nobody can tell. */
  exact: boolean | null;
  /** Battery restrictions off for this app; null where nobody can tell. */
  battery: boolean | null;
};

export function reminderTimingStatus(): ReminderTimingStatus {
  if (Platform.OS !== 'android' || !ReminderTiming) return { exact: null, battery: null };
  let exact: boolean | null = null;
  let battery: boolean | null = null;
  try {
    exact = ReminderTiming.canScheduleExactAlarms();
  } catch {
    exact = null;
  }
  try {
    battery = ReminderTiming.isIgnoringBatteryOptimizations();
  } catch {
    battery = null;
  }
  return { exact, battery };
}

/** Whether this phone can open the two settings at all. */
export function canOpenReminderTimingSettings(): boolean {
  return Platform.OS === 'android' && ReminderTiming !== null;
}

export function openExactAlarmSettings(): void {
  ReminderTiming?.openExactAlarmSettings();
}

export function openBatterySettings(): void {
  ReminderTiming?.openAppSettings();
}

/** Whether to ask again, given when it was last asked. Pure, for the test. */
export function shouldAskAgain(lastAskedIso: string | null, now: Date): boolean {
  if (!lastAskedIso) return true;
  const last = Date.parse(lastAskedIso);
  if (Number.isNaN(last)) return true;
  return now.getTime() - last >= ASK_AGAIN_DAYS * 86_400_000;
}

/** Whether the allowed state changed in the way that needs a reschedule. Pure. */
export function becameExact(before: boolean | null, after: boolean | null): boolean {
  return before === false && after === true;
}

/** The line Profile > Reminders shows; null where there is nothing to say. Pure. */
export function reminderTimingLine(status: ReminderTimingStatus): string | null {
  if (status.exact === null) return null;
  const exact = status.exact
    ? 'Alarms & reminders is allowed, so each reminder is set for its minute.'
    : 'Alarms & reminders is not allowed for Lifestead, so Android may hold reminders back until the phone is picked up or the app is opened.';
  if (status.battery === null) return exact;
  const battery = status.battery
    ? 'Battery use is unrestricted, so Android does not put the app to sleep between reminders.'
    : 'Battery use is optimised, which can also hold reminders back on some phones. Unrestricted lets them through, at the cost of a little battery.';
  return `${exact} ${battery}`;
}

export const REMINDER_TIMING_TITLE = 'Let reminders arrive on time';
export const REMINDER_TIMING_MESSAGE =
  'Android is holding reminders back until the phone is picked up, which is why some arrive when you open the app. ' +
  'Allowing Alarms & reminders for Lifestead lets each one arrive at its time. The switch is on the next screen.';

let asking = false;

async function readRecord(): Promise<ReminderTimingRecord> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_meta WHERE key = ?', REMINDER_TIMING_ASKED_META_KEY);
  return parseTimingRecord(row?.value);
}

async function writeRecord(record: ReminderTimingRecord): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO app_meta (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    REMINDER_TIMING_ASKED_META_KEY,
    JSON.stringify(record),
    now,
  );
}

// Runs as the app opens and each time it comes back. Queues every reminder
// again when on-time alarms have just been allowed, and asks when they are
// off, reminders are allowed at all, and the last ask was a week ago or more.
export async function checkReminderTiming(): Promise<void> {
  const { exact } = reminderTimingStatus();
  if (exact === null) return;
  const record = await readRecord();
  if (record.exact !== exact) await writeRecord({ ...record, exact });
  // A first reading counts as off: every reminder queued before this
  // build was queued without on-time alarms.
  if (becameExact(record.exact ?? false, exact)) {
    await rescheduleAllReminders();
    return;
  }
  if (exact || asking) return;
  if (!(await hasReminderPermission())) return;
  const now = new Date();
  if (!shouldAskAgain(record.askedAt, now)) return;
  asking = true;
  await writeRecord({ askedAt: now.toISOString(), exact });
  Alert.alert(REMINDER_TIMING_TITLE, REMINDER_TIMING_MESSAGE, [
    { text: 'Not now', style: 'cancel', onPress: () => { asking = false; } },
    { text: 'Allow on-time reminders', onPress: () => { asking = false; openExactAlarmSettings(); } },
  ], { cancelable: true, onDismiss: () => { asking = false; } });
}
