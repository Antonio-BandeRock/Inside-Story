// Reading and writing compost piles and what happens to them.
//
// Added 2026-09-20. Vocabulary and the summary a pile is read through are in
// lib/compost.ts with no database; this is the reading and writing.
//
// A bought material is the one place this touches money: addCompostEvent
// takes an optional cost, writes it as a growing cost (a finance_entries row
// in garden_supplies, kind 'compost_materials', tied to the pile) and keeps
// the entry id on the event, so the Growing Costs lens and the compost
// record agree about the same bale of straw. Kitchen scraps carry no cost
// and no entry.
//
// 2026-09-20, "Put compost pile costs under an area or group too": a pile
// feeds one area or one whole cost group (compost_piles.plot_id or
// cost_group_id). The cost row itself stays tied to the pile alone;
// lib/gardenMoneyDb.ts listGrowingCosts reads the pile's area or group onto
// it, so changing what a pile feeds moves everything it ever cost.

import { getDatabase } from './db';
import {
  COMPOST_EVENT_LABELS,
  COMPOST_MATERIAL_CLASSES,
  COMPOST_MOISTURE_LEVELS,
  COMPOST_PILE_KINDS,
  COMPOST_PILE_STATUSES,
  type CompostEvent,
  type CompostEventKind,
  type CompostMaterialClass,
  type CompostMoisture,
  type CompostPile,
  type CompostPileKind,
  type CompostPileStatus,
} from './compost';
import { deleteGrowingCost, recordGrowingCost } from './gardenMoneyDb';

function asPileKind(value: string): CompostPileKind {
  return COMPOST_PILE_KINDS.some((entry) => entry.code === value) ? (value as CompostPileKind) : 'pile';
}
function asPileStatus(value: string): CompostPileStatus {
  return COMPOST_PILE_STATUSES.some((entry) => entry.code === value) ? (value as CompostPileStatus) : 'active';
}
function asEventKind(value: string): CompostEventKind {
  return value in COMPOST_EVENT_LABELS ? (value as CompostEventKind) : 'note';
}
function asMaterialClass(value: string | null): CompostMaterialClass | null {
  return value && COMPOST_MATERIAL_CLASSES.some((entry) => entry.code === value) ? (value as CompostMaterialClass) : null;
}
function asMoisture(value: string | null): CompostMoisture | null {
  return value && COMPOST_MOISTURE_LEVELS.some((entry) => entry.code === value) ? (value as CompostMoisture) : null;
}

export async function createCompostPile(input: {
  name: string;
  kind: CompostPileKind;
  startedOn: string;
  location?: string;
  notes?: string;
  plotId?: string | null;
  costGroupId?: string | null;
}): Promise<string> {
  const db = await getDatabase();
  const id = `compost_${Date.now()}`;
  await db.runAsync(
    `INSERT INTO compost_piles (id, name, kind, started_on, location, status, notes, plot_id, cost_group_id)
     VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
    id,
    input.name.trim(),
    input.kind,
    input.startedOn,
    input.location?.trim() || null,
    input.notes?.trim() || null,
    input.costGroupId ? null : input.plotId ?? null,
    input.costGroupId ?? null,
  );
  return id;
}

/** Sets what the pile feeds: one area, one whole group, or neither. Its
 *  bought materials count there from the next read of Growing Costs. */
export async function setCompostPileFeeds(id: string, feeds: { plotId: string | null; costGroupId: string | null }): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE compost_piles SET plot_id = ?, cost_group_id = ? WHERE id = ?',
    feeds.costGroupId ? null : feeds.plotId,
    feeds.costGroupId ?? null,
    id,
  );
}

/** Sets how often this pile should be turned. The turn reminder reads it,
 *  and so does the line on the pile's row, so the two cannot drift. */
export async function setCompostTurnInterval(id: string, days: number | null): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE compost_piles SET turn_interval_days = ? WHERE id = ?', days, id);
}

export async function setCompostPileStatus(id: string, status: CompostPileStatus): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE compost_piles SET status = ? WHERE id = ?', status, id);
}

/** Removes the pile and its events. A bought material's finance entry
 *  stays: the money was spent whether or not the record of the pile is. */
export async function deleteCompostPile(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM compost_events WHERE pile_id = ?', id);
  await db.runAsync('DELETE FROM compost_piles WHERE id = ?', id);
}

export async function listCompostPiles(): Promise<CompostPile[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    name: string;
    kind: string;
    startedOn: string;
    location: string | null;
    status: string;
    notes: string | null;
    plotId: string | null;
    costGroupId: string | null;
    turnIntervalDays: number | null;
  }>(
    `
      SELECT id, name, kind, started_on AS startedOn, location, status, notes,
             plot_id AS plotId, cost_group_id AS costGroupId,
             turn_interval_days AS turnIntervalDays
      FROM compost_piles
      ORDER BY CASE status WHEN 'active' THEN 0 WHEN 'curing' THEN 1 ELSE 2 END, started_on DESC
    `,
  );
  return rows.map((row) => ({
    ...row,
    kind: asPileKind(row.kind),
    status: asPileStatus(row.status),
  }));
}

/**
 * Every active pile with the day it was last turned, for the turn
 * reminder.
 *
 * Its own query rather than reading listCompostPiles and then every pile's
 * events, since the reminder pass runs at startup, on foreground and after
 * every schedule change, and a pile's whole history is not wanted for it.
 */
export async function listCompostPilesToTurn(): Promise<
  { pile: CompostPile; lastTurnedOn: string | null }[]
> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    name: string;
    kind: string;
    startedOn: string;
    location: string | null;
    status: string;
    notes: string | null;
    plotId: string | null;
    costGroupId: string | null;
    turnIntervalDays: number | null;
    lastTurnedOn: string | null;
  }>(
    `
      SELECT p.id, p.name, p.kind, p.started_on AS startedOn, p.location, p.status, p.notes,
             p.plot_id AS plotId, p.cost_group_id AS costGroupId,
             p.turn_interval_days AS turnIntervalDays,
             (SELECT MAX(e.occurred_on) FROM compost_events e
               WHERE e.pile_id = p.id AND e.kind = 'turned') AS lastTurnedOn
      FROM compost_piles p
      WHERE p.status = 'active'
      ORDER BY p.started_on DESC
    `,
  );
  return rows.map((row) => ({
    pile: {
      id: row.id,
      name: row.name,
      kind: asPileKind(row.kind),
      startedOn: row.startedOn,
      location: row.location,
      status: asPileStatus(row.status),
      notes: row.notes,
      plotId: row.plotId,
      costGroupId: row.costGroupId,
      turnIntervalDays: row.turnIntervalDays,
    },
    lastTurnedOn: row.lastTurnedOn,
  }));
}

export async function addCompostEvent(input: {
  pileId: string;
  occurredOn: string;
  kind: CompostEventKind;
  material?: string;
  materialClass?: CompostMaterialClass | null;
  amount?: number | null;
  unit?: string;
  temperature?: number | null;
  temperatureUnit?: 'c' | 'f' | null;
  moisture?: CompostMoisture | null;
  plotId?: string | null;
  note?: string;
  /** Set only when the material was bought. Becomes a growing cost. */
  cost?: number | null;
}): Promise<string> {
  const db = await getDatabase();
  let financeEntryId: string | null = null;
  if (input.kind === 'added' && input.cost && input.cost > 0) {
    financeEntryId = await recordGrowingCost({
      occurredOn: input.occurredOn,
      amount: input.cost,
      description: input.material?.trim() ? `${input.material.trim()} for compost` : 'Compost material',
      kind: 'compost_materials',
      compostPileId: input.pileId,
    });
  }
  const id = `compost_ev_${Date.now()}`;
  await db.runAsync(
    `
      INSERT INTO compost_events
        (id, pile_id, occurred_on, kind, material, material_class, amount, unit,
         temperature, temperature_unit, moisture, plot_id, finance_entry_id, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    id,
    input.pileId,
    input.occurredOn,
    input.kind,
    input.kind === 'added' ? input.material?.trim() || null : null,
    input.kind === 'added' ? input.materialClass ?? null : null,
    input.amount ?? null,
    input.unit?.trim() ?? '',
    input.kind === 'temperature' ? input.temperature ?? null : null,
    input.kind === 'temperature' ? input.temperatureUnit ?? null : null,
    input.kind === 'moisture' ? input.moisture ?? null : null,
    input.kind === 'applied' ? input.plotId ?? null : null,
    financeEntryId,
    input.note?.trim() || null,
  );
  return id;
}

/** Removes the event and, when it carried a purchase, that growing cost
 *  too, since the event is the only record that the purchase was compost. */
export async function deleteCompostEvent(id: string): Promise<void> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ financeEntryId: string | null }>(
    'SELECT finance_entry_id AS financeEntryId FROM compost_events WHERE id = ?',
    id,
  );
  await db.runAsync('DELETE FROM compost_events WHERE id = ?', id);
  if (row?.financeEntryId) await deleteGrowingCost(row.financeEntryId);
}

/** Newest first, every pile, so one query feeds every summary. */
export async function listCompostEvents(limit = 500): Promise<CompostEvent[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    pileId: string;
    occurredOn: string;
    kind: string;
    material: string | null;
    materialClass: string | null;
    amount: number | null;
    unit: string;
    temperature: number | null;
    temperatureUnit: string | null;
    moisture: string | null;
    plotId: string | null;
    financeEntryId: string | null;
    note: string | null;
  }>(
    `
      SELECT id, pile_id AS pileId, occurred_on AS occurredOn, kind, material, material_class AS materialClass,
             amount, unit, temperature, temperature_unit AS temperatureUnit, moisture, plot_id AS plotId,
             finance_entry_id AS financeEntryId, note
      FROM compost_events
      ORDER BY occurred_on DESC, created_at DESC
      LIMIT ?
    `,
    limit,
  );
  return rows.map((row) => ({
    ...row,
    kind: asEventKind(row.kind),
    materialClass: asMaterialClass(row.materialClass),
    temperatureUnit: row.temperatureUnit === 'c' || row.temperatureUnit === 'f' ? row.temperatureUnit : null,
    moisture: asMoisture(row.moisture),
  }));
}
