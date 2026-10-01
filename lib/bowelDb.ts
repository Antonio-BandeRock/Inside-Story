// Reading and writing bowel_movements (lib/db.ts), D10, 2026-09-30.
// Signals > Bowel Movements writes here; Trends > Symptoms & Flares and
// Pattern Finder read it through lib/bowel.ts. An entry is never edited:
// a mistaken one is removed and logged again.
import { getDatabase } from './db';
import type { BowelEntry, BristolType } from './bowel';

const COLUMNS =
  'id, occurred_at AS occurredAt, bristol_type AS bristolType, urgency, blood, pain, note';

export async function listBowelEntries(limit = 50): Promise<BowelEntry[]> {
  const db = await getDatabase();
  return db.getAllAsync<BowelEntry>(
    `SELECT ${COLUMNS} FROM bowel_movements ORDER BY occurred_at DESC, created_at DESC LIMIT ?`,
    limit,
  );
}

/** Every entry from `startDay` to `endDay`, both local dates, oldest first. */
export async function listBowelEntriesBetween(startDay: string, endDay: string): Promise<BowelEntry[]> {
  const db = await getDatabase();
  return db.getAllAsync<BowelEntry>(
    `SELECT ${COLUMNS} FROM bowel_movements WHERE occurred_at >= ? AND occurred_at < ? ORDER BY occurred_at ASC`,
    startDay,
    `${endDay}T99`,
  );
}

export async function addBowelEntry(input: {
  occurredAt: string;
  bristolType: BristolType;
  urgency: number | null;
  blood: number | null;
  pain: number | null;
  note: string | null;
}): Promise<void> {
  const db = await getDatabase();
  const note = input.note && input.note.trim() ? input.note.trim() : null;
  await db.runAsync(
    `INSERT INTO bowel_movements (id, occurred_at, bristol_type, urgency, blood, pain, note)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    `bowel_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    input.occurredAt,
    input.bristolType,
    input.urgency,
    input.blood,
    input.pain,
    note,
  );
}

export async function removeBowelEntry(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM bowel_movements WHERE id = ?', id);
}
