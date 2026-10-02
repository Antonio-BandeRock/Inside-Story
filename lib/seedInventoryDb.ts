// Reading and writing the seed inventory (I9, 2026-10-02). The tables are
// garden_seeds, garden_seed_uses and garden_seed_tests in lib/db.ts; every
// sentence and figure is worked out in lib/seedInventory.ts.

import { getDatabase } from './db';
import { canDeletePacket, SEED_STOCK_OWNER_KIND, type SeedPacket, type SeedTest, type SeedUnit, type SeedUse } from './seedInventory';

function newId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const PACKET_COLUMNS = `id, food_id AS foodId, source, food_name AS foodName, variety, from_where AS fromWhere,
  packed_on AS packedOn, amount, amount_unit AS amountUnit, packet_days AS packetDays, notes,
  finished_at AS finishedAt, created_at AS createdAt`;

/** Every packet, on hand first and then put away, each group by crop. */
export async function listSeedPackets(): Promise<SeedPacket[]> {
  const db = await getDatabase();
  return db.getAllAsync<SeedPacket>(
    `SELECT ${PACKET_COLUMNS} FROM garden_seeds
      ORDER BY finished_at IS NOT NULL, food_name COLLATE NOCASE, variety COLLATE NOCASE, created_at`,
  );
}

export type SeedPacketDraft = {
  foodId: number | null;
  source: string | null;
  foodName: string;
  variety: string | null;
  fromWhere: string | null;
  packedOn: string | null;
  amount: number | null;
  amountUnit: SeedUnit | null;
  packetDays: number | null;
  notes: string | null;
};

export function newSeedPacketId(): string {
  return newId('garden_seed');
}

export async function saveSeedPacket(id: string, draft: SeedPacketDraft): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO garden_seeds (id, food_id, source, food_name, variety, from_where, packed_on, amount, amount_unit, packet_days, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET food_id = excluded.food_id, source = excluded.source, food_name = excluded.food_name,
       variety = excluded.variety, from_where = excluded.from_where, packed_on = excluded.packed_on,
       amount = excluded.amount, amount_unit = excluded.amount_unit, packet_days = excluded.packet_days,
       notes = excluded.notes, updated_at = datetime('now')`,
    id,
    draft.foodId,
    draft.source,
    draft.foodName,
    draft.variety,
    draft.fromWhere,
    draft.packedOn,
    draft.amount,
    draft.amountUnit,
    draft.packetDays,
    draft.notes,
  );
}

/** Put a packet away, or bring it back with `finished` false. */
export async function setSeedPacketPutAway(id: string, finished: boolean): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE garden_seeds SET finished_at = ${finished ? "datetime('now')" : 'NULL'}, updated_at = datetime('now') WHERE id = ?`,
    id,
  );
}

/** Deletes a packet only when nothing is recorded against it; otherwise
 *  it is put away. Returns which happened. */
export async function removeSeedPacket(id: string): Promise<'deleted' | 'putAway'> {
  const db = await getDatabase();
  const uses = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM garden_seed_uses WHERE seed_id = ?', id);
  const tests = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM garden_seed_tests WHERE seed_id = ?', id);
  if (!canDeletePacket(uses?.n ?? 0, tests?.n ?? 0)) {
    await setSeedPacketPutAway(id, true);
    return 'putAway';
  }
  await db.runAsync('DELETE FROM garden_seeds WHERE id = ?', id);
  const media = await import('./mediaDb');
  await media.removePhotosOf(SEED_STOCK_OWNER_KIND, id);
  return 'deleted';
}

/** Every use, with the planting's crop and area when it is still there. */
export async function listSeedUses(): Promise<SeedUse[]> {
  const db = await getDatabase();
  return db.getAllAsync<SeedUse>(
    `SELECT u.id, u.seed_id AS seedId, u.planting_id AS plantingId, u.used_on AS usedOn, u.amount,
            CASE WHEN p.id IS NULL THEN NULL ELSE COALESCE(pl.name, '') END AS plantingLabel
       FROM garden_seed_uses u
       LEFT JOIN garden_plantings p ON p.id = u.planting_id
       LEFT JOIN garden_plots pl ON pl.id = p.plot_id
      ORDER BY u.used_on DESC, u.created_at DESC`,
  );
}

export async function addSeedUse(use: { seedId: string; plantingId: string | null; usedOn: string; amount: number | null }): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO garden_seed_uses (id, seed_id, planting_id, used_on, amount) VALUES (?, ?, ?, ?, ?)',
    newId('garden_seed_use'),
    use.seedId,
    use.plantingId,
    use.usedOn,
    use.amount,
  );
}

export async function listSeedTests(): Promise<SeedTest[]> {
  const db = await getDatabase();
  return db.getAllAsync<SeedTest>(
    `SELECT id, seed_id AS seedId, tested_on AS testedOn, sown, sprouted
       FROM garden_seed_tests ORDER BY tested_on DESC, created_at DESC`,
  );
}

export async function addSeedTest(test: { seedId: string; testedOn: string; sown: number; sprouted: number }): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO garden_seed_tests (id, seed_id, tested_on, sown, sprouted) VALUES (?, ?, ?, ?, ?)',
    newId('garden_seed_test'),
    test.seedId,
    test.testedOn,
    test.sown,
    test.sprouted,
  );
}

export async function deleteSeedTest(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM garden_seed_tests WHERE id = ?', id);
}
