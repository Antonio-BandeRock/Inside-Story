// Reading and writing the garden's money and the produce given to it.
//
// Added 2026-09-20. The arithmetic and the rules are in lib/gardenMoney.ts
// with no database; this is the reading and writing.
//
// A GROWING COST IS A FINANCE ENTRY. It is written through createEntry in
// the 'garden_supplies' category, which Finances has had since it was
// built, so the household budget sees it once and there is no second ledger
// to reconcile. garden_cost_details is the Garden tab's annotation on that
// row (what kind of input, which plot or compost pile). The total is read
// from finance_entries and never from the annotation, so a cost typed
// straight into Finances counts, and a row deleted there stops counting.
//
// A RECEIVED SHARE IS TWO ROWS. The food itself is a kitchen_items row with
// source 'gift', which is what every Food tool and the kitchen inventory
// reads; harvest_shares_received is who gave it and when, and is what My
// Whole Foods lists. Deleting the record does not take the food out of the
// kitchen, for the same reason deleteDisposition does not: the food is
// still on the shelf.

import { getDatabase, listGardenPlots, listHarvestsKeptOnHand, type GardenHarvest } from './db';
import { createEntry, deleteEntry } from './financeDb';
import { addKitchenItem } from './kitchenDb';
import {
  groupGardenMoneyByArea,
  summarizeGardenMoney,
  type CustomGrowingCostKind,
  type GardenAreaMoney,
  type GardenLocationMoney,
  type GardenMoneySummary,
} from './gardenMoney';
import { harvestUnitForPricing, valueReceivedGoods, type RecordedPrice, type ValuationResult } from './harvestTrade';
import { getLastPaidPrices } from './harvestTradeDb';

export const GARDEN_COST_CATEGORY = 'garden_supplies';

export type GrowingCostRecord = {
  id: string;
  occurredOn: string;
  amount: number;
  description: string;
  /** A built-in code, the id of a kind the person added, or 'other' for a
   *  cost whose kind was removed; null for an entry typed straight into
   *  Finances. growingCostKindLabel reads it. */
  kind: string | null;
  /** For a material bought for a compost pile, this is the area the pile
   *  feeds (compost_piles.plot_id), read at query time, since the cost row
   *  itself is tied to the pile alone. */
  plotId: string | null;
  plotName: string | null;
  /** Set when the cost was tied to a cost group as a whole rather than to
   *  one of its areas, or when it was bought for a pile that feeds a whole
   *  group. */
  costGroupId: string | null;
  costGroupName: string | null;
  compostPileId: string | null;
  compostPileName: string | null;
};

// --- Kinds the person added ------------------------------------------------

export async function listGardenCostKinds(): Promise<CustomGrowingCostKind[]> {
  const db = await getDatabase();
  return db.getAllAsync<CustomGrowingCostKind>('SELECT id, name FROM garden_cost_kinds ORDER BY created_at ASC, name ASC');
}

/** Adds a kind, or returns the one already there under the same name (the
 *  case and spacing aside), so typing Mulch twice makes one kind. Returns
 *  null for an empty name. */
export async function createGardenCostKind(name: string): Promise<string | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const db = await getDatabase();
  const existing = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM garden_cost_kinds WHERE lower(name) = lower(?) LIMIT 1',
    trimmed,
  );
  if (existing) return existing.id;
  const id = `cost_kind_${Date.now()}`;
  await db.runAsync(
    'INSERT INTO garden_cost_kinds (id, name, created_at) VALUES (?, ?, ?)',
    id,
    trimmed,
    new Date().toISOString(),
  );
  return id;
}

export async function renameGardenCostKind(id: string, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) return;
  const db = await getDatabase();
  await db.runAsync('UPDATE garden_cost_kinds SET name = ? WHERE id = ?', trimmed, id);
}

/** Removes the kind. Costs recorded under it keep their record and read as
 *  Something else from then on; none is deleted. */
export async function deleteGardenCostKind(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("UPDATE garden_cost_details SET kind = 'other' WHERE kind = ?", id);
  await db.runAsync('DELETE FROM garden_cost_kinds WHERE id = ?', id);
}

export async function recordGrowingCost(input: {
  occurredOn: string;
  amount: number;
  description: string;
  /** A built-in code or the id of a kind the person added. */
  kind: string;
  plotId?: string | null;
  costGroupId?: string | null;
  compostPileId?: string | null;
  notes?: string;
}): Promise<string> {
  const db = await getDatabase();
  const id = await createEntry({
    occurredOn: input.occurredOn,
    direction: 'expense',
    amount: input.amount,
    category: GARDEN_COST_CATEGORY,
    description: input.description,
    notes: input.notes,
  });
  await db.runAsync(
    `
      INSERT OR REPLACE INTO garden_cost_details (finance_entry_id, kind, plot_id, cost_group_id, compost_pile_id)
      VALUES (?, ?, ?, ?, ?)
    `,
    id,
    input.kind,
    input.plotId ?? null,
    input.costGroupId ?? null,
    input.compostPileId ?? null,
  );
  return id;
}

// Cost groups, 2026-09-20: "Allow the growing areas to also be combined if
// necessary as one cost group." The group is a name plus the areas in it
// (garden_plots.cost_group_id). See garden_cost_groups in lib/db.ts.

export type GardenCostGroup = {
  id: string;
  name: string;
  /** The areas combined into this group, in area order. */
  memberIds: string[];
  memberNames: string[];
};

export async function listGardenCostGroups(): Promise<GardenCostGroup[]> {
  const db = await getDatabase();
  const groups = await db.getAllAsync<{ id: string; name: string }>(
    'SELECT id, name FROM garden_cost_groups ORDER BY created_at ASC, name ASC',
  );
  if (groups.length === 0) return [];
  const members = await db.getAllAsync<{ id: string; name: string; costGroupId: string }>(
    `SELECT id, name, cost_group_id AS costGroupId FROM garden_plots
     WHERE cost_group_id IS NOT NULL AND archived_at IS NULL
     ORDER BY created_at ASC`,
  );
  return groups.map((group) => {
    const own = members.filter((member) => member.costGroupId === group.id);
    return { id: group.id, name: group.name, memberIds: own.map((m) => m.id), memberNames: own.map((m) => m.name) };
  });
}

/** Moving an area into this group takes it out of any other, since an area
 *  belongs to one group at most; that is what keeps a cost from counting
 *  twice. Areas left out of memberIds are taken out of the group. */
export async function saveGardenCostGroup(input: { id?: string; name: string; memberIds: string[] }): Promise<string> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const id = input.id ?? `gcg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  if (input.id) {
    await db.runAsync('UPDATE garden_cost_groups SET name = ?, updated_at = ? WHERE id = ?', input.name.trim(), now, id);
  } else {
    await db.runAsync(
      'INSERT INTO garden_cost_groups (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)',
      id,
      input.name.trim(),
      now,
      now,
    );
  }
  await db.runAsync('UPDATE garden_plots SET cost_group_id = NULL, updated_at = ? WHERE cost_group_id = ?', now, id);
  for (const memberId of input.memberIds) {
    await db.runAsync('UPDATE garden_plots SET cost_group_id = ?, updated_at = ? WHERE id = ?', id, now, memberId);
  }
  return id;
}

/** Ungroups the areas, unties the costs and the compost piles feeding the
 *  group; deletes nothing else. */
export async function deleteGardenCostGroup(id: string): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync('UPDATE garden_plots SET cost_group_id = NULL, updated_at = ? WHERE cost_group_id = ?', now, id);
  await db.runAsync('UPDATE garden_cost_details SET cost_group_id = NULL WHERE cost_group_id = ?', id);
  await db.runAsync('UPDATE compost_piles SET cost_group_id = NULL WHERE cost_group_id = ?', id);
  await db.runAsync('DELETE FROM garden_cost_groups WHERE id = ?', id);
}

export async function deleteGrowingCost(financeEntryId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM garden_cost_details WHERE finance_entry_id = ?', financeEntryId);
  await deleteEntry(financeEntryId);
}

/** Newest first. Every garden_supplies expense, whether or not the Garden
 *  tab annotated it; one typed straight into Finances shows with no kind. */
export async function listGrowingCosts(limit = 200): Promise<GrowingCostRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    occurredOn: string;
    amount: number;
    description: string | null;
    kind: string | null;
    plotId: string | null;
    plotName: string | null;
    costGroupId: string | null;
    costGroupName: string | null;
    compostPileId: string | null;
    compostPileName: string | null;
    pilePlotId: string | null;
    pilePlotName: string | null;
    pileGroupId: string | null;
    pileGroupName: string | null;
  }>(
    `
      SELECT e.id AS id, e.occurred_on AS occurredOn, e.amount AS amount, e.description AS description,
             d.kind AS kind, d.plot_id AS plotId, p.name AS plotName,
             d.cost_group_id AS costGroupId, g.name AS costGroupName,
             d.compost_pile_id AS compostPileId, c.name AS compostPileName,
             c.plot_id AS pilePlotId, pp.name AS pilePlotName,
             c.cost_group_id AS pileGroupId, pg.name AS pileGroupName
      FROM finance_entries e
      LEFT JOIN garden_cost_details d ON d.finance_entry_id = e.id
      LEFT JOIN garden_plots p ON p.id = d.plot_id
      LEFT JOIN garden_cost_groups g ON g.id = d.cost_group_id
      LEFT JOIN compost_piles c ON c.id = d.compost_pile_id
      LEFT JOIN garden_plots pp ON pp.id = c.plot_id
      LEFT JOIN garden_cost_groups pg ON pg.id = c.cost_group_id
      WHERE e.category = ? AND e.direction = 'expense'
      ORDER BY e.occurred_on DESC, e.created_at DESC
      LIMIT ?
    `,
    GARDEN_COST_CATEGORY,
    limit,
  );
  return rows.map((row) => {
    // A cost with no area or group of its own takes the pile's, when it was
    // bought for a pile. A pile feeding a whole group counts as the group,
    // never also as one of the group's areas.
    const viaPile = !row.plotId && !row.costGroupId && Boolean(row.compostPileId);
    const groupId = row.costGroupId ?? (viaPile ? row.pileGroupId : null);
    const plotId = row.plotId ?? (viaPile && !groupId ? row.pilePlotId : null);
    return {
      id: row.id,
      occurredOn: row.occurredOn,
      amount: row.amount,
      description: row.description ?? '',
      kind: row.kind ?? null,
      plotId,
      plotName: plotId ? (row.plotName ?? row.pilePlotName) : null,
      costGroupId: groupId,
      costGroupName: groupId ? (row.costGroupName ?? row.pileGroupName) : null,
      compostPileId: row.compostPileId,
      compostPileName: row.compostPileName,
    };
  });
}

/** All time. The netting is against everything the garden has given back,
 *  which is also all time, so the two sides cover the same window. */
export async function getGrowingCostTotal(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ total: number | null }>(
    `SELECT SUM(amount) AS total FROM finance_entries WHERE category = ? AND direction = 'expense'`,
    GARDEN_COST_CATEGORY,
  );
  return row?.total ?? 0;
}

// --- Produce someone gave you --------------------------------------------

export type ReceivedShareRecord = {
  id: string;
  receivedOn: string;
  fromWhom: string | null;
  foodName: string;
  quantity: number;
  unit: string;
  category: string;
  foodId: string | null;
  kitchenItemId: string | null;
  /** What is left in the kitchen. Null when the kitchen row is gone, which
   *  reads as used up. */
  quantityRemaining: number | null;
  notes: string | null;
};

export async function recordReceivedShare(input: {
  receivedOn: string;
  fromWhom?: string;
  foodName: string;
  quantity: number;
  unit: string;
  category?: string;
  foodId?: string | null;
  notes?: string;
}): Promise<string> {
  const db = await getDatabase();
  const from = input.fromWhom?.trim() || null;
  const kitchenItemId = await addKitchenItem({
    foodName: input.foodName,
    quantity: input.quantity,
    unit: input.unit,
    category: input.category,
    foodId: input.foodId ?? null,
    source: 'gift',
    note: from ? `Given to you by ${from}` : 'Given to you from another garden',
  });
  const id = `harv_gift_${Date.now()}`;
  await db.runAsync(
    `
      INSERT INTO harvest_shares_received
        (id, received_on, from_whom, food_name, quantity, unit, category, food_id, kitchen_item_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    id,
    input.receivedOn,
    from,
    input.foodName.trim(),
    input.quantity,
    input.unit.trim(),
    input.category?.trim() || '',
    input.foodId ?? null,
    kitchenItemId,
    input.notes?.trim() || null,
  );
  return id;
}

/** Removes the record only. The food stays in the kitchen, where it can be
 *  removed on its own if it never existed. */
export async function deleteReceivedShare(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM harvest_shares_received WHERE id = ?', id);
}

/** Oldest first, so a summary can name when the first one was. */
export async function listReceivedShares(limit = 200): Promise<ReceivedShareRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    receivedOn: string;
    fromWhom: string | null;
    foodName: string;
    quantity: number;
    unit: string;
    category: string;
    foodId: string | null;
    kitchenItemId: string | null;
    quantityRemaining: number | null;
    notes: string | null;
  }>(
    `
      SELECT s.id AS id, s.received_on AS receivedOn, s.from_whom AS fromWhom, s.food_name AS foodName,
             s.quantity AS quantity, s.unit AS unit, s.category AS category, s.food_id AS foodId,
             s.kitchen_item_id AS kitchenItemId, k.quantity_remaining AS quantityRemaining, s.notes AS notes
      FROM harvest_shares_received s
      LEFT JOIN kitchen_items k ON k.id = s.kitchen_item_id
      ORDER BY s.received_on ASC, s.created_at ASC
      LIMIT ?
    `,
    limit,
  );
  return rows;
}

// --- Both sides at once ---------------------------------------------------

export type GardenMoneyPicture = {
  summary: GardenMoneySummary;
  harvests: GardenHarvest[];
  harvestValuation: ValuationResult;
  shares: ReceivedShareRecord[];
  shareValuation: ValuationResult;
  /** One figure per growing area that has a cost or a harvest, so a grow
   *  tent under an LED light and the beds out back each stand alone.
   *  Added 2026-09-20; see PER AREA in lib/gardenMoney.ts. */
  areas: GardenAreaMoney[];
  /** Costs tied to no area, plus produce given to you. Null when empty. */
  unassigned: GardenAreaMoney | null;
  /** Areas rolled up as indoors, greenhouse and outdoors. */
  byLocation: GardenLocationMoney[];
};

/** What one item would have cost at a recorded price, or null when it has
 *  none. Runs the same valuation as the totals, one item at a time, so the
 *  per-area figures follow exactly the rule the whole-garden figure does. */
function amountAtRecordedPrice(
  item: { foodName: string; quantity: number; unit: string },
  lastPaid: Record<string, RecordedPrice | undefined>,
): number | null {
  const result = valueReceivedGoods([item], lastPaid);
  return result.valued.length === 1 ? result.valued[0].amount : null;
}

/** A harvest's area: its plot, or the plot of the planting it came from. */
async function resolveHarvestPlotIds(harvests: GardenHarvest[]): Promise<Map<string, string | null>> {
  const db = await getDatabase();
  const resolved = new Map<string, string | null>();
  const plantingIds = Array.from(new Set(harvests.filter((h) => !h.plotId && h.plantingId).map((h) => h.plantingId as string)));
  const plantingPlot = new Map<string, string>();
  if (plantingIds.length > 0) {
    const rows = await db.getAllAsync<{ id: string; plotId: string }>(
      `SELECT id, plot_id AS plotId FROM garden_plantings WHERE id IN (${plantingIds.map(() => '?').join(', ')})`,
      ...plantingIds,
    );
    for (const row of rows) plantingPlot.set(row.id, row.plotId);
  }
  for (const harvest of harvests) {
    resolved.set(harvest.id, harvest.plotId ?? (harvest.plantingId ? plantingPlot.get(harvest.plantingId) ?? null : null));
  }
  return resolved;
}

/**
 * Everything the net figure is made of, read once so My Whole Foods on Food
 * and Growing Costs on Garden show the same number. Every kept harvest and
 * every gift is valued whole, whether or not it has been eaten yet: the
 * money was not spent on the day it arrived.
 */
export async function loadGardenMoneyPicture(): Promise<GardenMoneyPicture> {
  const [harvests, shares, lastPaid, growingCosts, plots, costRows, groups] = await Promise.all([
    listHarvestsKeptOnHand(),
    listReceivedShares(),
    getLastPaidPrices(),
    getGrowingCostTotal(),
    listGardenPlots(),
    listGrowingCosts(5000),
    listGardenCostGroups(),
  ]);
  const harvestPlot = await resolveHarvestPlotIds(harvests);
  const harvestValuation = valueReceivedGoods(
    harvests.map((harvest) => ({ foodName: harvest.foodName, quantity: harvest.quantity, unit: harvestUnitForPricing(harvest.unit) })),
    lastPaid,
  );
  const shareValuation = valueReceivedGoods(
    shares.map((share) => ({ foodName: share.foodName, quantity: share.quantity, unit: harvestUnitForPricing(share.unit) })),
    lastPaid,
  );
  const summary = summarizeGardenMoney({
    harvestsAvoided: harvestValuation.avoidedCost,
    receivedAvoided: shareValuation.avoidedCost,
    growingCosts,
    unpricedCount: harvestValuation.unvalued.length + shareValuation.unvalued.length,
  });
  const grouped = groupGardenMoneyByArea({
    areas: plots.map((plot) => ({ id: plot.id, name: plot.name, locationType: plot.locationType, lightSource: plot.lightSource })),
    harvests: harvests.map((harvest) => ({
      plotId: harvestPlot.get(harvest.id) ?? null,
      amount: amountAtRecordedPrice(
        { foodName: harvest.foodName, quantity: harvest.quantity, unit: harvestUnitForPricing(harvest.unit) },
        lastPaid,
      ),
    })),
    gifts: shares.map((share) => ({
      amount: amountAtRecordedPrice(
        { foodName: share.foodName, quantity: share.quantity, unit: harvestUnitForPricing(share.unit) },
        lastPaid,
      ),
    })),
    groups: groups.map((group) => ({ id: group.id, name: group.name, memberIds: group.memberIds })),
    costs: costRows.map((cost) => ({ plotId: cost.plotId, groupId: cost.costGroupId, amount: cost.amount })),
  });
  return {
    summary,
    harvests,
    harvestValuation,
    shares,
    shareValuation,
    areas: grouped.areas,
    unassigned: grouped.unassigned,
    byLocation: grouped.byLocation,
  };
}
