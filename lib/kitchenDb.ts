// What is in the kitchen right now: reading it, adding to it, using it up.
//
// 2026-09-05, asked for directly: "I shouldn't need to open the grocery list.
// It should live somewhere... The user needs a way to add to their inventory
// of on hand kitchen items, or mark them as expended, with them being able to
// quickly add the item to the list as they want to."
//
// Correct, and the gap was real. Kitchen inventory existed only as a
// read-through inside the grocery list (see kitchenCoverageFor in
// lib/groceryList.ts), computed from garden and fermentation harvests. There
// was nowhere to look at it, nothing to add to it, and no way to say something
// had run out.
//
// THREE SOURCES, ONE VIEW. Garden and fermentation harvests keep their own
// tables, deliberately: a harvest has a lifecycle a pantry item does not (a
// planting, a batch, a ready date), and folding them in here would flatten
// that away. kitchen_items is the third source, holding what someone entered
// and what a ticked grocery line put there. listKitchenInventory unions all
// three, and every one of them carries a remaining quantity in the same shape,
// so the draw-down arithmetic below never needs to know where a row came from.
//
// THE HONEST LIMIT, stated here because it is the whole risk of the feature:
// nothing decrements any of this as someone cooks. Logging a meal does not
// reach back into the pantry. An inventory left untended slowly claims food
// that was eaten weeks ago. Every row therefore carries the date it arrived,
// and the screen shows how long it has been sitting, because an amount the app
// cannot verify should at least say how old it is.
import {
  getDatabase,
  getReferenceDatabase,
  listAvailableFermentationHarvests,
  listAvailableHarvests,
  recordFermentationHarvestUsage,
  recordHarvestUsage,
} from './db';

export type KitchenItemSource = 'manual' | 'purchase' | 'garden' | 'fermentation';

// Two inventories, not one list with a filter on it. See kitchen_items' own
// column comment in lib/db.ts for why they are kept apart.
export type KitchenItemKind = 'food' | 'non_food';

export type KitchenInventoryItem = {
  // Prefixed by source, so one id space covers three tables and every action
  // below can route itself without a second field to carry around.
  id: string;
  source: KitchenItemSource;
  category: string;
  foodName: string;
  quantity: number;
  unit: string;
  quantityRemaining: number;
  kind: KitchenItemKind;
  // The reference row this is, where there is one. Null for a brand item, a
  // typed entry that resolved to nothing, and a fermentation (a drink someone
  // made is not a row in anyone's food database).
  foodId: string | null;
  note: string | null;
  // ISO date. What makes an unverifiable amount honest: the screen can say how
  // long this has been claimed rather than presenting it as current fact.
  addedAt: string;
};

type KitchenItemRow = {
  id: string;
  category: string;
  foodName: string;
  quantity: number;
  unit: string;
  quantityRemaining: number;
  source: string;
  kind: string;
  foodId: string | null;
  note: string | null;
  addedAt: string;
};

const COLUMNS = `
  id, category, food_name AS foodName, quantity, unit,
  quantity_remaining AS quantityRemaining, source, kind, food_id AS foodId, note, added_at AS addedAt
`;

// Everything on hand, newest first, across all three sources.
//
// Only rows with something left. A harvest drawn down to zero is finished, and
// a pantry item marked gone is gone; neither belongs in a list of what is
// available, and both are still on record in their own table.
export async function listKitchenInventory(kind: KitchenItemKind = 'food'): Promise<KitchenInventoryItem[]> {
  const db = await getDatabase();
  const items: KitchenInventoryItem[] = [];

  const rows = await db.getAllAsync<KitchenItemRow>(
    `SELECT ${COLUMNS} FROM kitchen_items WHERE quantity_remaining > 0 AND kind = ? ORDER BY added_at DESC`,
    kind,
  );
  for (const row of rows) {
    items.push({
      ...row,
      source: row.source === 'purchase' ? 'purchase' : 'manual',
      kind: row.kind === 'non_food' ? 'non_food' : 'food',
      note: row.note,
    });
  }

  // A harvest is food by definition, so neither source contributes anything to
  // the household side.
  if (kind === 'non_food') return items;

  for (const harvest of await listAvailableHarvests()) {
    items.push({
      id: `garden:${harvest.id}`,
      source: 'garden',
      kind: 'food',
      // A harvest knows exactly which food it is; that is what the planting
      // was picked as.
      foodId: String(harvest.foodId),
      category: '',
      foodName: harvest.foodName,
      quantity: harvest.quantity,
      unit: harvest.unit,
      quantityRemaining: harvest.quantityRemaining,
      note: harvest.notes,
      addedAt: harvest.harvestedAt.slice(0, 10),
    });
  }

  for (const harvest of await listAvailableFermentationHarvests()) {
    items.push({
      id: `fermentation:${harvest.id}`,
      source: 'fermentation',
      kind: 'food',
      foodId: null,
      category: '',
      foodName: harvest.drinkName,
      quantity: harvest.quantity,
      unit: harvest.unit,
      quantityRemaining: harvest.quantityRemaining,
      note: harvest.notes,
      addedAt: harvest.readyAt.slice(0, 10),
    });
  }

  items.sort((a, b) => (a.addedAt < b.addedAt ? 1 : a.addedAt > b.addedAt ? -1 : 0));
  return items;
}

export type PurchasableFood = {
  category: string;
  baseName: string;
  soldAs: string;
  form: string;
};

// Everything this app knows how to buy, for picking from rather than typing.
//
// food_purchase_forms is the right source and a hand-written staples list would
// be the wrong one: this is already the canonical purchasable set (212 foods,
// each with a category, a base name and how it is sold), it is what the grocery
// list itself groups on, and anything added from here therefore matches stock
// to a recipe by the canonical pair with no name-guessing at all.
export async function listPurchasableFoods(): Promise<PurchasableFood[]> {
  const db = await getReferenceDatabase();
  try {
    return await db.getAllAsync<PurchasableFood>(
      `SELECT category, base_name AS baseName, sold_as AS soldAs, form
       FROM food_purchase_forms ORDER BY category, base_name`,
    );
  } catch {
    // A device still on a reference database from before that table existed.
    // Adding by hand still works; only the picker is unavailable.
    return [];
  }
}

export async function addKitchenItem(input: {
  foodName: string;
  quantity: number;
  unit: string;
  category?: string;
  kind?: KitchenItemKind;
  // Set when the food was picked from the reference database rather than
  // typed. Null for a brand item or anything with no row of its own, which is
  // a real case rather than a failure: the name and category still identify it
  // for matching, and only the nutrient link is missing.
  foodId?: string | null;
  note?: string | null;
}): Promise<string> {
  const db = await getDatabase();
  const id = `kitchen_${Date.now()}`;
  const quantity = Math.max(0, input.quantity);
  await db.runAsync(
    `INSERT INTO kitchen_items (id, category, food_name, quantity, unit, quantity_remaining, source, note, food_id, kind)
     VALUES (?, ?, ?, ?, ?, ?, 'manual', ?, ?, ?)`,
    id,
    input.category?.trim() || '',
    input.foodName.trim(),
    quantity,
    input.unit.trim(),
    quantity,
    input.note?.trim() || null,
    input.foodId ?? null,
    input.kind ?? 'food',
  );
  return id;
}

// Adds what a ticked grocery line actually bought.
//
// Keyed on the grocery line rather than inserting blindly, which is what makes
// unticking and re-ticking safe: the same purchase must not appear twice
// because someone changed their mind at the till.
//
// It updates rather than refuses when the row already exists, because the two
// moments this is called from arrive in that order. Ticking an item comes
// first, carrying only what the list asked for; entering the size in the price
// panel comes second and is the real figure. So a second call with a better
// number corrects the first.
//
// With one exception: a row already drawn down is left alone. Someone has
// started using it, and rewriting the amount underneath them would discard
// what they recorded. The list is a record of shopping; the kitchen is a
// record of what is left, and the second outranks the first once it has been
// touched.
//
// Refuses rather than guesses when there is no size at all. A line ticked with
// no amount is a real purchase of an unknown quantity, and inventing one would
// put a number on a shelf nobody measured. Those keep the older "you bought
// this N days ago, worth checking" reading instead.
export async function addKitchenItemFromPurchase(input: {
  groceryItemId: string;
  foodName: string;
  category: string;
  foodId: string | null;
  quantity: number | null;
  unit: string;
}): Promise<boolean> {
  if (input.quantity == null || input.quantity <= 0 || !input.unit.trim()) return false;
  const db = await getDatabase();
  const existing = await db.getFirstAsync<{ id: string; quantity: number; quantityRemaining: number }>(
    'SELECT id, quantity, quantity_remaining AS quantityRemaining FROM kitchen_items WHERE grocery_item_id = ?',
    input.groceryItemId,
  );
  if (existing) {
    const untouched = existing.quantityRemaining >= existing.quantity;
    if (!untouched) return false;
    if (existing.quantity === input.quantity) return false;
    await db.runAsync(
      'UPDATE kitchen_items SET quantity = ?, quantity_remaining = ?, unit = ? WHERE id = ?',
      input.quantity,
      input.quantity,
      input.unit,
      existing.id,
    );
    return true;
  }

  await db.runAsync(
    `INSERT INTO kitchen_items
       (id, category, food_name, quantity, unit, quantity_remaining, source, grocery_item_id, food_id)
     VALUES (?, ?, ?, ?, ?, ?, 'purchase', ?, ?)`,
    `kitchen_${Date.now()}_${input.groceryItemId}`,
    input.category,
    input.foodName,
    input.quantity,
    input.unit,
    input.quantity,
    input.groceryItemId,
    input.foodId,
  );
  return true;
}

// Uses some of something, whichever of the three tables it lives in. Clamped at
// zero by each underlying call, so an amount larger than what is left empties
// the row rather than going negative.
export async function consumeKitchenItem(id: string, amountUsed: number): Promise<void> {
  if (amountUsed <= 0) return;
  if (id.startsWith('garden:')) return recordHarvestUsage(id.slice('garden:'.length), amountUsed);
  if (id.startsWith('fermentation:')) {
    return recordFermentationHarvestUsage(id.slice('fermentation:'.length), amountUsed);
  }
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE kitchen_items SET quantity_remaining = MAX(0, quantity_remaining - ?) WHERE id = ?',
    amountUsed,
    id,
  );
}

// "It is gone." Zeroes the remaining amount rather than deleting the row, so
// what was bought and when stays on record; the same choice
// markFermentationHarvestFinished already makes for a ferment.
export async function markKitchenItemGone(id: string): Promise<void> {
  if (id.startsWith('garden:')) return recordHarvestUsage(id.slice('garden:'.length), Number.MAX_SAFE_INTEGER);
  if (id.startsWith('fermentation:')) {
    return recordFermentationHarvestUsage(id.slice('fermentation:'.length), Number.MAX_SAFE_INTEGER);
  }
  const db = await getDatabase();
  await db.runAsync('UPDATE kitchen_items SET quantity_remaining = 0 WHERE id = ?', id);
}

// Removes a pantry row outright, for something entered by mistake. A harvest is
// not deletable from here: it belongs to a planting or a batch and is deleted
// from Garden or the Fermentation Tracker, where the rest of its history lives.
export async function deleteKitchenItem(id: string): Promise<boolean> {
  if (id.startsWith('garden:') || id.startsWith('fermentation:')) return false;
  const db = await getDatabase();
  await db.runAsync('DELETE FROM kitchen_items WHERE id = ?', id);
  return true;
}

// How long something has been claimed, in words. The counterweight to an amount
// nothing can verify: "3 weeks ago" is the app being honest about how much
// trust the number beside it has earned.
export function describeKitchenAge(addedAt: string, today: string = new Date().toISOString().slice(0, 10)): string {
  const then = Date.parse(`${addedAt.slice(0, 10)}T00:00:00Z`);
  const now = Date.parse(`${today}T00:00:00Z`);
  if (Number.isNaN(then) || Number.isNaN(now)) return '';
  const days = Math.round((now - then) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.round(days / 7)} weeks ago`;
  return `${Math.round(days / 30)} months ago`;
}
