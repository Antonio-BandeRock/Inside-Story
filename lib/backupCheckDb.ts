// Where the last backup check is kept (see lib/backupCheck.ts). One
// app_meta row, and a device-local one (DEVICE_LOCAL_META_KEYS in
// lib/snapshotSync.ts), since "a backup on this device opens" says
// nothing about the other device's copy.

import { getDatabase } from './db';
import type { BackupCheckRecord } from './backupCheck';

export const BACKUP_CHECK_META_KEY = 'backup_last_check';

export async function getLastBackupCheck(): Promise<BackupCheckRecord | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_meta WHERE key = ?', BACKUP_CHECK_META_KEY);
  if (!row?.value) return null;
  try {
    const parsed = JSON.parse(row.value) as BackupCheckRecord;
    return typeof parsed.checkedAt === 'string' && typeof parsed.rows === 'number' ? parsed : null;
  } catch {
    return null;
  }
}

export async function saveBackupCheck(record: BackupCheckRecord): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `
      INSERT INTO app_meta (key, value, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `,
    BACKUP_CHECK_META_KEY,
    JSON.stringify(record),
    record.checkedAt,
  );
}

export async function currentTableNames(): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'",
  );
  return rows.map((row) => row.name);
}
