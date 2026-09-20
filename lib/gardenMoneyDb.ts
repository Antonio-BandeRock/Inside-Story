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

import { getDatabase, listHarvestsKeptOnHand, type GardenHarvest } from './db';
import { createEntry, deleteEntry } from './financeDb';
import { addKitchenItem } from './kitchenDb';
import { isGrowingCostKind, summarizeGardenMoney, type GardenMoneySummary, type GrowingCostKind } from './gardenMoney';
import { harvestUnitForPricing, valueReceivedGoods, type ValuationResult } from './harvestTrade';
import { getLastPaidPrices } from './harvestTradeDb';

export const GARDEN_COST_CATEGORY = 'garden_supplies';

export type GrowingCostRecord = {
  id: string;
  occurredOn: string;
  amount: number;
  description: string;
  kind: GrowingCostKind | null;
  plotId: string | null;
  plotName: string | null;
  compostPileId: string | null;
  compostPileName: string | null;
};

export async function recordGrowingCost(input: {
  occurredOn: string;
  amount: number;
  description: string;
  kind: GrowingCostKind;
  plotId?: string | null;
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
      INSERT OR REPLACE INTO garden_cost_details (finance_entry_id, kind, plot_id, compost_pile_id)
      VALUES (?, ?, ?, ?)
    `,
    id,
    input.kind,
    input.plotId ?? null,
    input.compostPileId ?? null,
  );
  return id;
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
    compostPileId: string | null;
    compostPileName: string | null;
  }>(
    `
      SELECT e.id AS id, e.occurred_on AS occurredOn, e.amount AS amount, e.description AS description,
             d.kind AS kind, d.plot_id AS plotId, p.name AS plotName,
             d.compost_pile_id AS compostPileId, c.name AS compostPileName
      FROM finance_entries e
      LEFT JOIN garden_cost_details d ON d.finance_entry_id = e.id
      LEFT JOIN garden_plots p ON p.id = d.plot_id
      LEFT JOIN compost_piles c ON c.id = d.compost_pile_id
      WHERE e.category = ? AND e.direction = 'expense'
      ORDER BY e.occurred_on DESC, e.created_at DESC
      LIMIT ?
    `,
    GARDEN_COST_CATEGORY,
    limit,
  );
  return rows.map((row) => ({
    id: row.id,
    occurredOn: row.occurredOn,
    amount: row.amount,
    description: row.description ?? '',
    kind: row.kind && isGrowingCostKind(row.kind) ? row.kind : null,
    plotId: row.plotId,
    plotName: row.plotName,
    compostPileId: row.compostPileId,
    compostPileName: row.compostPileName,
  }));
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
};

/**
 * Everything the net figure is made of, read once so My Whole Foods on Food
 * and Growing Costs on Garden show the same number. Every kept harvest and
 * every gift is valued whole, whether or not it has been eaten yet: the
 * money was not spent on the day it arrived.
 */
export async function loadGardenMoneyPicture(): Promise<GardenMoneyPicture> {
  const [harvests, shares, lastPaid, growingCosts] = await Promise.all([
    listHarvestsKeptOnHand(),
    listReceivedShares(),
    getLastPaidPrices(),
    getGrowingCostTotal(),
  ]);
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
  return { summary, harvests, harvestValuation, shares, shareValuation };
}
