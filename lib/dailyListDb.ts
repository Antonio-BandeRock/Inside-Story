// Where the daily list is kept (D6, lib/dailyList.ts). One app_meta row
// holding the tag codes in the order they were added. It travels with the
// person's other settings between their own devices, since it names
// symptoms rather than anything about the hardware.
import { getDatabase } from './db';
import { DAILY_LIST_META_KEY, parseDailyList, serializeDailyList } from './dailyList';

export async function getDailyList(): Promise<string[]> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_meta WHERE key = ?', DAILY_LIST_META_KEY);
  return parseDailyList(row?.value);
}

export async function saveDailyList(codes: string[]): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO app_meta (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    DAILY_LIST_META_KEY,
    serializeDailyList(codes),
    new Date().toISOString(),
  );
}
