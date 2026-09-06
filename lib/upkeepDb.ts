// Reading and writing upkeep: things that need doing again, and things that
// run out.
//
// Added 2026-09-05. Same split every other module here follows: schema in
// lib/db.ts, arithmetic and every refusal in lib/upkeep.ts with no database so
// they can be tested without one, and the reading and writing here.

import { getDatabase } from './db';
import { nextDueAfterDoing, type UpkeepCadence, type UpkeepCategory, type UpkeepItem } from './upkeep';

export async function upsertUpkeepItem(input: {
  id?: string;
  name: string;
  category: UpkeepCategory;
  cadence: UpkeepCadence;
  intervalMonths?: number | null;
  lastDoneOn?: string | null;
  expiresOn?: string | null;
  renewable?: boolean;
  cost?: number | null;
  notes?: string;
}): Promise<string> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  // Each cadence carries only the fields that mean anything for it, enforced
  // here rather than trusted from the form, so nothing downstream has to guard
  // against a recurring item with an expiry date on it.
  const recurring = input.cadence === 'recurring';
  const intervalMonths = recurring ? input.intervalMonths ?? null : null;
  const lastDoneOn = recurring ? input.lastDoneOn || null : null;
  const expiresOn = recurring ? null : input.expiresOn || null;
  // Renewable only means anything for something that expires. A service is
  // repeated by definition, so the question does not arise.
  const renewable = recurring ? 1 : input.renewable === false ? 0 : 1;

  if (input.id) {
    await db.runAsync(
      `
        UPDATE upkeep_items
        SET name = ?, category = ?, cadence = ?, interval_months = ?, last_done_on = ?,
            expires_on = ?, renewable = ?, cost = ?, notes = ?, updated_at = ?
        WHERE id = ?
      `,
      input.name.trim(), input.category, input.cadence, intervalMonths, lastDoneOn,
      expiresOn, renewable, input.cost ?? null, input.notes?.trim() || null, now, input.id,
    );
    return input.id;
  }

  const id = `upkeep_${Date.now()}`;
  await db.runAsync(
    `
      INSERT INTO upkeep_items
        (id, name, category, cadence, interval_months, last_done_on, expires_on,
         renewable, cost, active, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
    `,
    id, input.name.trim(), input.category, input.cadence, intervalMonths, lastDoneOn,
    expiresOn, renewable, input.cost ?? null, input.notes?.trim() || null, now, now,
  );
  return id;
}

/**
 * Record that a recurring thing was just done, which resets its clock.
 *
 * The next date is not stored: it is derived from last_done_on plus the
 * interval every time it is read, so there is one source for it and no chance
 * of a stored next date disagreeing with the two figures it came from.
 * nextDueAfterDoing exists for the screen to SHOW what the new date will be
 * before someone confirms, not to be written down.
 */
export async function markUpkeepDone(id: string, doneOn: string): Promise<{ nextDueOn: string | null }> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    id: string; name: string; category: string; cadence: string;
    intervalMonths: number | null; lastDoneOn: string | null; expiresOn: string | null;
    renewable: number; cost: number | null; active: number; notes: string | null;
  }>(
    `
      SELECT id, name, category, cadence, interval_months AS intervalMonths,
             last_done_on AS lastDoneOn, expires_on AS expiresOn, renewable, cost, active, notes
      FROM upkeep_items WHERE id = ?
    `,
    id,
  );
  if (!row) return { nextDueOn: null };

  await db.runAsync(
    'UPDATE upkeep_items SET last_done_on = ?, updated_at = ? WHERE id = ?',
    doneOn, new Date().toISOString(), id,
  );
  return { nextDueOn: nextDueAfterDoing({ ...toItem(row), lastDoneOn: doneOn }, doneOn) };
}

/** Renew something that expires, by pushing its date out. */
export async function renewUpkeepItem(id: string, newExpiresOn: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE upkeep_items SET expires_on = ?, updated_at = ? WHERE id = ?',
    newExpiresOn, new Date().toISOString(), id,
  );
}

export async function setUpkeepActive(id: string, active: boolean): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE upkeep_items SET active = ?, updated_at = ? WHERE id = ?',
    active ? 1 : 0, new Date().toISOString(), id,
  );
}

export async function deleteUpkeepItem(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM upkeep_items WHERE id = ?', id);
}

type UpkeepRow = {
  id: string; name: string; category: string; cadence: string;
  intervalMonths: number | null; lastDoneOn: string | null; expiresOn: string | null;
  renewable: number; cost: number | null; active: number; notes: string | null;
};

function toItem(row: UpkeepRow): UpkeepItem {
  return {
    id: row.id,
    name: row.name,
    category: (row.category as UpkeepCategory) ?? 'other',
    cadence: (row.cadence as UpkeepCadence) ?? 'recurring',
    intervalMonths: row.intervalMonths,
    lastDoneOn: row.lastDoneOn,
    expiresOn: row.expiresOn,
    // Number() rather than === 1, the same guard amountIsEstimate uses: a
    // column added by a generic TEXT migration would hand back the string.
    renewable: Number(row.renewable) === 1,
    cost: row.cost,
    active: Number(row.active) === 1,
    notes: row.notes,
  };
}

export async function listUpkeepItems(): Promise<UpkeepItem[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<UpkeepRow>(
    `
      SELECT id, name, category, cadence, interval_months AS intervalMonths,
             last_done_on AS lastDoneOn, expires_on AS expiresOn, renewable, cost, active, notes
      FROM upkeep_items
      ORDER BY active DESC, category, name
    `,
  );
  return rows.map(toItem);
}
