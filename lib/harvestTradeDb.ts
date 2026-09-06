// Recording what happened to extra harvest, and moving the goods.
//
// Added 2026-09-05. Same split every other module here follows: the
// arithmetic and the honesty rules live in lib/harvestTrade.ts with no
// database, and this does the reading and writing.
//
// The one thing worth knowing before changing anything: a disposition is
// THREE moves at once, and they have to happen together or the record and the
// inventory disagree.
//
//   1. The harvest comes down, through the same consumeKitchenItem that
//      cooking already uses, so a harvest drawn down by trading and one drawn
//      down by eating go through one path.
//   2. For a trade, each thing received becomes a kitchen row, sourced
//      'trade' so the inventory can say how it got there.
//   3. For a sale, an income entry is written, tagged to a stream if one was
//      picked, so selling surplus reaches the income figures instead of
//      sitting in its own corner.

import { getDatabase } from './db';
import { createEntry } from './financeDb';
import { addKitchenItem, consumeKitchenItem } from './kitchenDb';
import type { DispositionKind, DispositionRecord, ReceivedGood, RecipientKind, RecordedPrice } from './harvestTrade';

export type RecordDispositionInput = {
  occurredOn: string;
  kind: DispositionKind;
  /** The kitchen inventory id the goods came from, prefixed the way
   *  listKitchenInventory returns them ("garden:123", "fermentation:4"). */
  inventoryId: string;
  foodName: string;
  quantityGiven: number;
  unit: string;
  withWhom?: string;
  notes?: string;
  /** Sales only. */
  amount?: number | null;
  incomeStreamId?: string | null;
  /** Trades only. Each becomes a kitchen row. */
  received?: ReceivedGood[];
  /** Gifts only. */
  recipientKind?: RecipientKind | null;
  receiptGiven?: boolean;
};

function sourceOf(inventoryId: string): { source: string; harvestId: string | null } {
  if (inventoryId.startsWith('garden:')) return { source: 'garden', harvestId: inventoryId.slice('garden:'.length) };
  if (inventoryId.startsWith('fermentation:')) {
    return { source: 'fermentation', harvestId: inventoryId.slice('fermentation:'.length) };
  }
  return { source: 'kitchen', harvestId: inventoryId };
}

export async function recordDisposition(input: RecordDispositionInput): Promise<string> {
  const db = await getDatabase();
  const id = `harv_disp_${Date.now()}`;
  const { source, harvestId } = sourceOf(input.inventoryId);

  await db.runAsync(
    `
      INSERT INTO harvest_dispositions
        (id, occurred_on, kind, source, harvest_id, food_name, quantity_given, unit,
         with_whom, amount, income_stream_id, recipient_kind, receipt_given, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    id,
    input.occurredOn,
    input.kind,
    source,
    harvestId,
    input.foodName.trim(),
    input.quantityGiven,
    input.unit.trim(),
    input.withWhom?.trim() || null,
    // Null rather than zero for a trade or a gift. Zero would read as sold
    // for nothing, which is a different and wrong statement.
    input.kind === 'sold' ? input.amount ?? null : null,
    input.kind === 'sold' ? input.incomeStreamId ?? null : null,
    // Only a gift has a recipient kind. A sale went to a buyer and a trade to
    // whoever traded, and neither raises the receipt question this is for.
    input.kind === 'given' ? input.recipientKind ?? null : null,
    input.kind === 'given' && input.receiptGiven ? 1 : 0,
    input.notes?.trim() || null,
  );

  // 1. The goods leave.
  await consumeKitchenItem(input.inventoryId, input.quantityGiven);

  // 2. For a trade, what came back goes into the kitchen. This is the part
  // the whole feature exists for: no money changed hands, and the food is
  // still real and still needs to be findable when someone cooks.
  if (input.kind === 'traded') {
    for (const good of input.received ?? []) {
      if (good.quantity <= 0) continue;
      const kitchenItemId = await addKitchenItem({
        foodName: good.foodName,
        quantity: good.quantity,
        unit: good.unit,
        category: good.category,
        foodId: good.foodId ?? null,
        source: 'trade',
        note: input.withWhom?.trim() ? `Traded with ${input.withWhom.trim()}` : 'Traded for surplus harvest',
      });
      await db.runAsync(
        `
          INSERT INTO harvest_disposition_receipts
            (id, disposition_id, food_name, quantity, unit, category, food_id, kitchen_item_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        `harv_recv_${Date.now()}_${good.foodName.slice(0, 6)}`,
        id,
        good.foodName.trim(),
        good.quantity,
        good.unit.trim(),
        good.category?.trim() || '',
        good.foodId ?? null,
        kitchenItemId,
      );
    }
  }

  // 3. For a sale, the money reaches the income figures rather than sitting
  // only on this record.
  if (input.kind === 'sold' && (input.amount ?? 0) > 0) {
    await createEntry({
      occurredOn: input.occurredOn,
      direction: 'income',
      amount: input.amount as number,
      category: 'goods_sold',
      description: `Sold ${input.quantityGiven} ${input.unit} ${input.foodName}`.trim(),
      incomeStreamId: input.incomeStreamId ?? null,
    });
  }

  return id;
}

export async function deleteDisposition(id: string): Promise<void> {
  const db = await getDatabase();
  // Deliberately does NOT put the harvest back or remove the kitchen row it
  // created. Deleting the note of an event does not un-happen it: the corn is
  // in the kitchen and the potatoes are gone. Reversing either would edit an
  // inventory to match a record, which is the wrong way round.
  await db.runAsync('DELETE FROM harvest_disposition_receipts WHERE disposition_id = ?', id);
  await db.runAsync('DELETE FROM harvest_dispositions WHERE id = ?', id);
}

export async function listDispositions(limit = 100): Promise<DispositionRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string; occurredOn: string; kind: string; foodName: string;
    quantityGiven: number; unit: string; withWhom: string | null; amount: number | null;
    recipientKind: string | null; receiptGiven: number;
  }>(
    `
      SELECT id, occurred_on AS occurredOn, kind, food_name AS foodName,
             quantity_given AS quantityGiven, unit, with_whom AS withWhom, amount,
             recipient_kind AS recipientKind, receipt_given AS receiptGiven
      FROM harvest_dispositions
      ORDER BY occurred_on DESC, rowid DESC
      LIMIT ?
    `,
    limit,
  );
  if (rows.length === 0) return [];

  const receiptRows = await db.getAllAsync<{
    dispositionId: string; foodName: string; quantity: number; unit: string; category: string; foodId: string | null;
  }>(
    `
      SELECT disposition_id AS dispositionId, food_name AS foodName, quantity, unit, category, food_id AS foodId
      FROM harvest_disposition_receipts
      ORDER BY rowid
    `,
  );
  const byDisposition: Record<string, ReceivedGood[]> = {};
  for (const row of receiptRows) {
    (byDisposition[row.dispositionId] ??= []).push({
      foodName: row.foodName,
      quantity: row.quantity,
      unit: row.unit,
      category: row.category,
      foodId: row.foodId,
    });
  }

  return rows.map((row) => ({
    id: row.id,
    occurredOn: row.occurredOn,
    kind: row.kind as DispositionKind,
    foodName: row.foodName,
    quantityGiven: row.quantityGiven,
    unit: row.unit,
    withWhom: row.withWhom,
    amount: row.amount,
    received: byDisposition[row.id] ?? [],
    recipientKind: (row.recipientKind as RecipientKind | null) ?? null,
    // Number() rather than === 1, for the same reason amountIsEstimate does
    // it: a column added by the generic TEXT migration would hand back "1".
    receiptGiven: Number(row.receiptGiven) === 1,
  }));
}

/**
 * The most recent price actually paid for each food, keyed by lower-cased
 * name, for valuing what a trade brought back.
 *
 * Read from grocery lines rather than any separate store, so it is genuinely
 * what this person paid. Only rows with both a price and a price unit are
 * usable, since a price with no unit cannot be matched against a quantity.
 *
 * The alias is paidOn rather than on because ON is a reserved word in SQL and
 * "AS on" is a syntax error SQLite raises only when the statement is prepared,
 * which tsc cannot see. Verified against a scratch database.
 */
/**
 * Money given away, from ordinary spending in the Gifts and giving category.
 *
 * Its own small query rather than folded into the disposition read, because it
 * answers a different question and comes from a different table. It is never
 * added to the produce figures: kilos and dollars have no shared total, and
 * combining them would require pricing the produce.
 */
export async function getMoneyGiven(sinceDate: string): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ total: number | null }>(
    `
      SELECT SUM(amount) AS total
      FROM finance_entries
      WHERE direction = 'expense' AND category = 'gifts_giving' AND occurred_on >= ?
    `,
    sinceDate,
  );
  return row?.total ?? 0;
}

export async function getLastPaidPrices(): Promise<Record<string, RecordedPrice>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ foodName: string; price: number; priceUnit: string; paidOn: string }>(
    `
      SELECT i.food_name AS foodName, i.price AS price, i.price_unit AS priceUnit,
             COALESCE(i.checked_at, l.created_at) AS paidOn
      FROM grocery_list_items i
      JOIN grocery_lists l ON l.id = i.list_id
      WHERE i.price IS NOT NULL AND i.price > 0 AND i.price_unit IS NOT NULL
      ORDER BY COALESCE(i.checked_at, l.created_at) ASC
    `,
  );
  // Ascending, so a later row overwrites an earlier one and what remains is
  // the most recent price for each food.
  const byFood: Record<string, RecordedPrice> = {};
  for (const row of rows) {
    byFood[row.foodName.toLowerCase()] = {
      price: row.price,
      unit: normalizePriceUnit(row.priceUnit),
      on: row.paidOn.slice(0, 10),
    };
  }
  return byFood;
}

/**
 * The grocery list's own price units are shapes like 'per_lb' and 'per_kg',
 * and a trade's quantity is in a plain unit like 'kg'. Mapped rather than
 * pattern-matched loosely, and anything unrecognised is passed through so it
 * simply fails to match, which is the safe direction: a failed match reports
 * "not priced" instead of pricing something wrongly.
 */
function normalizePriceUnit(priceUnit: string): string {
  const map: Record<string, string> = {
    per_kg: 'kg',
    per_lb: 'lb',
    per_l: 'l',
    per_litre: 'l',
    per_oz: 'oz',
    per_floz: 'floz',
    each: 'each',
  };
  return map[priceUnit] ?? priceUnit;
}
