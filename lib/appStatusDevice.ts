// Reads everything the status page shows (see lib/appStatus.ts for what
// each line says and why). Nothing here writes.

import { Platform } from 'react-native';
import type { BackupCheckRecord } from './backupCheck';
import { getLastBackupCheck } from './backupCheckDb';
import { getDatabase } from './db';
import { isDesktopApp } from './desktop/bridge';
import { formatTime12 } from './timeOfDay';
import {
  hasReminderPermission,
  listQueuedReminders,
  LOOKAHEAD_DAYS,
  MAX_PENDING,
  type QueuedReminder,
} from './reminderNotifications';
import {
  ALL_REMINDER_KIND_KEYS,
  getReminderPreferences,
  isReminderKindEnabled,
  REMINDER_KIND_LABELS,
} from './reminderPreferences';
import type { ReminderFacts, SyncFacts } from './appStatus';
import { readSyncState } from './snapshotSyncDevice';

export type AppStatusFacts = {
  reminders: ReminderFacts;
  queued: QueuedReminder[];
  sync: SyncFacts;
  installedReference: string | null;
  lastBackupCheck: BackupCheckRecord | null;
};

async function installedReferenceVersion(): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>("SELECT value FROM app_meta WHERE key = 'reference_db_version'");
  return row?.value ?? null;
}

export async function readAppStatus(): Promise<AppStatusFacts> {
  const phone = (Platform.OS === 'android' || Platform.OS === 'ios') && !isDesktopApp();
  const [permission, preferences, queued, syncState, installedReference, lastBackupCheck] = await Promise.all([
    hasReminderPermission(),
    getReminderPreferences(),
    listQueuedReminders(),
    readSyncState(),
    installedReferenceVersion(),
    getLastBackupCheck(),
  ]);
  const quiet = preferences.quietHours;
  return {
    reminders: {
      phone,
      permission,
      kindsOff: ALL_REMINDER_KIND_KEYS.filter((key) => !isReminderKindEnabled(preferences, key)).map(
        (key) => REMINDER_KIND_LABELS[key],
      ),
      quietWindow: quiet ? `${formatTime12(quiet.start)} to ${formatTime12(quiet.end)}` : null,
      queued: queued.length,
      maxQueued: MAX_PENDING,
      lookaheadDays: LOOKAHEAD_DAYS,
      exactAlarmsAsked: Platform.OS === 'android' && Number(Platform.Version) >= 31,
    },
    queued,
    sync: {
      enabled: syncState.enabled,
      lastSavedAt: syncState.lastSavedAt,
      lastLoadedAt: syncState.lastLoadedAt,
      lastProblem: syncState.lastProblem,
    },
    installedReference,
    lastBackupCheck,
  };
}
