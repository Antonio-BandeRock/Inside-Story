// Storage for "Pick a few things for today" (C15). See lib/todayPicks.ts for
// what a pick is and why whether it happened is never stored here.
import { getDatabase } from './db';
import { createDoneCheck, markDoneCheck, undoLastCheckMark } from './routinesDb';
import { canPickMore, latestMarkOnDay, type TodayPick } from './todayPicks';

function shiftDay(day: string, by: number): string {
  const [year, month, date] = day.split('-').map(Number);
  const when = new Date(Date.UTC(year, month - 1, date + by));
  return when.toISOString().slice(0, 10);
}

export async function listTodayPicks(day: string): Promise<TodayPick[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ checkId: string; name: string }>(
    `SELECT p.check_id AS checkId, c.name AS name
       FROM today_picks p JOIN done_checks c ON c.id = p.check_id
      WHERE p.day = ?
      ORDER BY p.position ASC, p.created_at ASC`,
    day,
  );
  if (rows.length === 0) return [];
  // A day past the range at both ends, then narrowed to the local day.
  const marks = await db.getAllAsync<{ checkId: string; markedAt: string }>(
    `SELECT check_id AS checkId, marked_at AS markedAt FROM done_check_marks
      WHERE check_id IN (${rows.map(() => '?').join(', ')})
        AND marked_at >= ? AND marked_at < ?`,
    ...rows.map((row) => row.checkId),
    shiftDay(day, -1),
    shiftDay(day, 2),
  );
  return rows.map((row) => ({
    checkId: row.checkId,
    name: row.name,
    doneAt: latestMarkOnDay(
      marks.filter((mark) => mark.checkId === row.checkId).map((mark) => mark.markedAt),
      day,
    ),
  }));
}

/** Pick an existing check for the day. False when the day is full or it is
 *  already picked. */
export async function pickForToday(day: string, checkId: string): Promise<boolean> {
  const db = await getDatabase();
  const count = await db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) AS n FROM today_picks WHERE day = ?`, day);
  if (!canPickMore(count?.n ?? 0)) return false;
  const result = await db.runAsync(
    `INSERT OR IGNORE INTO today_picks (id, day, check_id, position, created_at) VALUES (?, ?, ?, ?, ?)`,
    `${day}:${checkId}`,
    day,
    checkId,
    count?.n ?? 0,
    new Date().toISOString(),
  );
  return result.changes > 0;
}

/** Something new: made as a Did I Do It check with no set pattern, then
 *  picked. It stays on Life > Did I Do It afterwards like any other check. */
export async function pickNewForToday(day: string, name: string): Promise<boolean> {
  const id = await createDoneCheck(name, 'anytime');
  if (!id) return false;
  return pickForToday(day, id);
}

/** Take a pick off the day. The check and its marks stay. */
export async function unpickForToday(day: string, checkId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM today_picks WHERE day = ? AND check_id = ?`, day, checkId);
}

export async function markTodayPick(checkId: string): Promise<void> {
  await markDoneCheck(checkId, 'tap');
}

/** Take back a mark, only when the latest mark is from the day, so a tap
 *  here can never remove last week's record. */
export async function unmarkTodayPick(checkId: string, day: string): Promise<void> {
  const db = await getDatabase();
  const last = await db.getFirstAsync<{ id: string; markedAt: string }>(
    `SELECT id, marked_at AS markedAt FROM done_check_marks WHERE check_id = ? ORDER BY marked_at DESC, rowid DESC LIMIT 1`,
    checkId,
  );
  if (!last || latestMarkOnDay([last.markedAt], day) === null) return;
  await undoLastCheckMark(checkId);
}

/** The checks picked on the day before, still active, for "Pick yesterday's
 *  again". Offered, never copied by itself. */
export async function listPicksFromDay(day: string): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ checkId: string }>(
    `SELECT p.check_id AS checkId FROM today_picks p JOIN done_checks c ON c.id = p.check_id
      WHERE p.day = ? AND c.active = 1 ORDER BY p.position ASC`,
    day,
  );
  return rows.map((row) => row.checkId);
}

export function dayBefore(day: string): string {
  return shiftDay(day, -1);
}
