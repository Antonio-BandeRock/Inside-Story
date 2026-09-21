// Reading and writing a grow's setup, the open lists it reads, and the
// electricity bills it is measured against.
//
// Added 2026-09-21. The vocabulary and arithmetic are in lib/growSetup.ts
// with no database; this is the reading and writing. See the three tables
// (garden_equipment, garden_custom_terms, electricity_bills) in lib/db.ts.
//
// A PURCHASE IS A GROWING COST. Adding a piece with what it cost writes the
// same finance_entries row Growing Costs writes (recordGrowingCost), tied
// to the piece's area and to the kind its purchase falls under, so the
// household budget sees the money once and By Area sets it against the
// area's harvests. The equipment row remembers which entry that was.
//
// REMOVAL NEVER ORPHANS. A piece with a purchase recorded, or one that has
// been retired, is part of the area's record and is never deleted; it is
// marked no longer in use. A piece with no cost behind it (the one added by
// mistake) can be removed outright. A term the person named is moved off
// current equipment before it goes, retired if retired equipment still
// reads it, and dropped only when nothing does.

import { getDatabase } from './db';
import { recordGrowingCost } from './gardenMoneyDb';
import {
  costKindForEquipment,
  planTermRemoval,
  termLabel,
  type CustomGardenTerm,
  type ElectricityBill,
  type GardenTermList,
  type GrowEquipment,
} from './growSetup';

// --- Terms the person named -------------------------------------------------

/** Every term the person has named, on every list, retired ones included
 *  when asked for (a retired piece of equipment still reads its label). */
export async function listGardenTerms(includeRetired = false): Promise<CustomGardenTerm[]> {
  const db = await getDatabase();
  return db.getAllAsync<CustomGardenTerm>(
    `SELECT id, list, name, retired_at AS retiredAt FROM garden_custom_terms ${includeRetired ? '' : 'WHERE retired_at IS NULL'} ORDER BY created_at ASC, name ASC`,
  );
}

/** Adds a term to a list, or returns the one already there under the same
 *  name (case and spacing aside), un-retiring it if it had been retired.
 *  Returns null for an empty name. */
export async function createGardenTerm(list: GardenTermList, name: string): Promise<string | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const db = await getDatabase();
  const existing = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM garden_custom_terms WHERE list = ? AND lower(name) = lower(?) LIMIT 1',
    list,
    trimmed,
  );
  if (existing) {
    await db.runAsync('UPDATE garden_custom_terms SET retired_at = NULL WHERE id = ?', existing.id);
    return existing.id;
  }
  const id = `term_${list}_${Date.now()}`;
  await db.runAsync(
    'INSERT INTO garden_custom_terms (id, list, name, created_at) VALUES (?, ?, ?, ?)',
    id,
    list,
    trimmed,
    new Date().toISOString(),
  );
  return id;
}

export async function renameGardenTerm(id: string, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) return;
  const db = await getDatabase();
  await db.runAsync('UPDATE garden_custom_terms SET name = ? WHERE id = ?', trimmed, id);
}

/** Which garden_equipment column each list is stored in. Adding a list
 *  means adding its column here. */
const TERM_COLUMNS: Record<GardenTermList, string> = {
  equipment_kind: 'kind',
  light_type: 'light_type',
  container_material: 'container_material',
};

/** How many pieces of equipment read a term: current ones, which have to be
 *  moved before it goes, and retired ones, which keep it as their record. */
export async function countEquipmentUnderTerm(list: GardenTermList, id: string): Promise<{ current: number; past: number }> {
  const db = await getDatabase();
  const column = TERM_COLUMNS[list];
  const row = await db.getFirstAsync<{ current: number; past: number }>(
    `
      SELECT SUM(CASE WHEN retired_at IS NULL THEN 1 ELSE 0 END) AS current,
             SUM(CASE WHEN retired_at IS NOT NULL THEN 1 ELSE 0 END) AS past
      FROM garden_equipment WHERE ${column} = ?
    `,
    id,
  );
  return { current: row?.current ?? 0, past: row?.past ?? 0 };
}

/** Removes a term. Current equipment reading it moves to moveTo, which has
 *  to be given when there is any (returns false otherwise, and changes
 *  nothing). Retired equipment keeps the term, so the row is retired rather
 *  than deleted; with nothing reading it, the row goes. */
export async function removeGardenTerm(list: GardenTermList, id: string, moveTo: string | null): Promise<boolean> {
  const db = await getDatabase();
  const counts = await countEquipmentUnderTerm(list, id);
  const plan = planTermRemoval(counts, moveTo);
  if (!plan.ok) return false;
  const column = TERM_COLUMNS[list];
  if (counts.current > 0) {
    await db.runAsync(`UPDATE garden_equipment SET ${column} = ?, updated_at = ? WHERE ${column} = ? AND retired_at IS NULL`, moveTo, new Date().toISOString(), id);
  }
  if (plan.keepRow) await db.runAsync('UPDATE garden_custom_terms SET retired_at = ? WHERE id = ?', new Date().toISOString(), id);
  else await db.runAsync('DELETE FROM garden_custom_terms WHERE id = ?', id);
  return true;
}

// --- Equipment --------------------------------------------------------------

const EQUIPMENT_COLUMNS = `
  id, plot_id AS plotId, kind, name, quantity, watts, hours_per_day AS hoursPerDay, on_timer AS onTimer,
  light_type AS lightType, spectrum, plant_stage AS plantStage, container_material AS containerMaterial,
  container_size AS containerSize, ongoing_amount AS ongoingAmount, ongoing_cadence AS ongoingCadence,
  purchase_entry_id AS purchaseEntryId, notes, retired_at AS retiredAt
`;

function rowToEquipment(row: Omit<GrowEquipment, 'onTimer'> & { onTimer: number }): GrowEquipment {
  return { ...row, onTimer: row.onTimer === 1 };
}

/** A setup, in use first, then what has been retired, each in the order
 *  it was added. */
export async function listGrowEquipment(plotId: string): Promise<GrowEquipment[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Omit<GrowEquipment, 'onTimer'> & { onTimer: number }>(
    `SELECT ${EQUIPMENT_COLUMNS} FROM garden_equipment WHERE plot_id = ? ORDER BY (retired_at IS NOT NULL), created_at ASC`,
    plotId,
  );
  return rows.map(rowToEquipment);
}

/** Every piece in use across every area, for the whole-garden electricity
 *  estimate. */
export async function listAllGrowEquipmentInUse(): Promise<GrowEquipment[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Omit<GrowEquipment, 'onTimer'> & { onTimer: number }>(
    `SELECT ${EQUIPMENT_COLUMNS} FROM garden_equipment WHERE retired_at IS NULL ORDER BY created_at ASC`,
  );
  return rows.map(rowToEquipment);
}

export type GrowEquipmentInput = {
  plotId: string;
  kind: string;
  name?: string | null;
  quantity?: number | null;
  watts?: number | null;
  hoursPerDay?: number | null;
  onTimer?: boolean;
  lightType?: string | null;
  spectrum?: string | null;
  plantStage?: string | null;
  containerMaterial?: string | null;
  containerSize?: string | null;
  ongoingAmount?: number | null;
  ongoingCadence?: string | null;
  notes?: string | null;
  /** What it cost to buy, recorded as a growing cost under the area. */
  purchase?: { amount: number; occurredOn: string } | null;
  /** The terms the person has named, for the cost's description. */
  terms?: CustomGardenTerm[];
};

/** Adds a piece to an area's setup, and its purchase to Growing Costs when
 *  one is given. Returns the equipment id. */
export async function addGrowEquipment(input: GrowEquipmentInput): Promise<string> {
  const db = await getDatabase();
  const id = `equip_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const now = new Date().toISOString();
  let purchaseEntryId: string | null = null;
  if (input.purchase && input.purchase.amount > 0) {
    const kindLabel = termLabel('equipment_kind', input.kind, input.terms ?? []) ?? 'Equipment';
    purchaseEntryId = await recordGrowingCost({
      occurredOn: input.purchase.occurredOn,
      amount: input.purchase.amount,
      description: input.name?.trim() ? `${kindLabel}: ${input.name.trim()}` : kindLabel,
      kind: costKindForEquipment(input.kind),
      plotId: input.plotId,
    });
  }
  await db.runAsync(
    `
      INSERT INTO garden_equipment (
        id, plot_id, kind, name, quantity, watts, hours_per_day, on_timer, light_type, spectrum, plant_stage,
        container_material, container_size, ongoing_amount, ongoing_cadence, purchase_entry_id, notes,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    id,
    input.plotId,
    input.kind,
    input.name?.trim() || null,
    input.quantity && input.quantity > 0 ? input.quantity : 1,
    input.watts ?? null,
    input.hoursPerDay ?? null,
    input.onTimer ? 1 : 0,
    input.lightType ?? null,
    input.spectrum ?? null,
    input.plantStage ?? null,
    input.containerMaterial ?? null,
    input.containerSize?.trim() || null,
    input.ongoingAmount ?? null,
    input.ongoingCadence ?? null,
    purchaseEntryId,
    input.notes?.trim() || null,
    now,
    now,
  );
  return id;
}

/** Marks a piece no longer in use, or back in use. The row stays either way. */
export async function retireGrowEquipment(id: string, retired: boolean): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync('UPDATE garden_equipment SET retired_at = ?, updated_at = ? WHERE id = ?', retired ? now : null, now, id);
}

/** Removes a piece outright, only when no purchase is recorded for it and
 *  it has not been retired (the one added by mistake). Returns false, and
 *  changes nothing, otherwise. The purchase itself is deleted from Growing
 *  Costs, never from here. */
export async function deleteGrowEquipment(id: string): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ purchaseEntryId: string | null; retiredAt: string | null }>(
    'SELECT purchase_entry_id AS purchaseEntryId, retired_at AS retiredAt FROM garden_equipment WHERE id = ?',
    id,
  );
  if (!row) return true;
  if (row.purchaseEntryId || row.retiredAt) return false;
  await db.runAsync('DELETE FROM garden_equipment WHERE id = ?', id);
  return true;
}

// --- Electricity bills ------------------------------------------------------

export async function listElectricityBills(): Promise<ElectricityBill[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Omit<ElectricityBill, 'beforeGrow'> & { beforeGrow: number }>(
    `
      SELECT id, period_start AS periodStart, period_end AS periodEnd, kwh, amount, before_grow AS beforeGrow, notes
      FROM electricity_bills ORDER BY period_end DESC, period_start DESC
    `,
  );
  return rows.map((row) => ({ ...row, beforeGrow: row.beforeGrow === 1 }));
}

export async function addElectricityBill(input: {
  periodStart: string;
  periodEnd: string;
  kwh: number | null;
  amount: number;
  beforeGrow: boolean;
  notes?: string | null;
}): Promise<string> {
  const db = await getDatabase();
  const id = `bill_${Date.now()}`;
  await db.runAsync(
    'INSERT INTO electricity_bills (id, period_start, period_end, kwh, amount, before_grow, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    id,
    input.periodStart,
    input.periodEnd,
    input.kwh,
    input.amount,
    input.beforeGrow ? 1 : 0,
    input.notes?.trim() || null,
    new Date().toISOString(),
  );
  return id;
}

/** Flips whether a bill counts as from before the grow. */
export async function setElectricityBillBaseline(id: string, beforeGrow: boolean): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE electricity_bills SET before_grow = ? WHERE id = ?', beforeGrow ? 1 : 0, id);
}

/** Nothing references a bill, so deleting one is plain. */
export async function deleteElectricityBill(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM electricity_bills WHERE id = ?', id);
}
