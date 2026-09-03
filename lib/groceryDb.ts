// The Grocery List's own stored data: reading and writing grocery_lists and
// grocery_list_items. See those two tables' own CREATE TABLE comments in
// lib/db.ts (initializeDatabase) for why this is stored at all rather than
// recomputed the way Schedule's Shopping List lens does it.
//
// Kept out of lib/db.ts, which is already past 18,000 lines, following the
// precedent lib/dailyMealPlan.ts set: the schema stays in db.ts because
// that is where the database is created, and everything reading or writing
// it lives here, reaching the same connection through getDatabase().
//
// The pure arithmetic (what a price means, what a line comes to) is in
// lib/groceryList.ts, separately again, so it can be reasoned about and
// tested with no database at all.
import {
  getDatabase,
  getUpcomingShoppingList,
  listAvailableFermentationHarvests,
  listAvailableHarvests,
  type ShoppingListItem,
} from './db';
import {
  defaultGroceryListName,
  describeApproximateCount,
  GROCERY_PRICE_UNITS,
  KITCHEN_PURCHASE_RECENT_DAYS,
  kitchenCoverageFor,
  type GroceryPriceUnit,
  type KitchenCoverage,
  type KitchenStockEntry,
  type PurchaseForm,
} from './groceryList';

const PURCHASE_FORMS: PurchaseForm[] = ['count', 'weight', 'volume'];

// Its own category so anything added in the store groups together at the
// end of the list rather than being scattered through categories that came
// out of the schedule.
export const ADDED_BY_HAND_CATEGORY = 'Added While Shopping';

export type GroceryListStatus = 'active' | 'completed';

export type GroceryListRecord = {
  id: string;
  name: string;
  startDate: string;
  daysAhead: number;
  peopleCount: number;
  storeName: string | null;
  status: GroceryListStatus;
  createdAt: string;
  completedAt: string | null;
};

export type GroceryListItemRecord = {
  id: string;
  listId: string;
  category: string;
  foodName: string;
  unit: string;
  quantity: number;
  checked: boolean;
  checkedAt: string | null;
  price: number | null;
  priceUnit: GroceryPriceUnit | null;
  purchasedQuantity: number | null;
  scannedProductId: number | null;
  note: string | null;
  // Amounts that genuinely could not be added to the one above, because a
  // weight and a volume of the same food need a density the app does not
  // have. Shown beside it rather than dropped or guessed into it.
  extraAmounts: { quantity: number; unit: string }[];
  // The scheduled meals this line is for, so a line can be traced back to
  // what needs it before it is struck off.
  mealNames: string[];
  // 2026-09-01. How a store sells this, and roughly how many to pick up where
  // that can be worked out. Both are resolved when the list is built and then
  // kept, so a list still reads the same way in an aisle even if the reference
  // database changes underneath it.
  soldAs: string;
  approxAmount: string | null;
  // Kept on the line so the price-unit choices stay right even after the
  // reference database moves on, the same reason soldAs is kept.
  purchaseForm: PurchaseForm | null;
  // A sale price rather than the usual one. See describeSaleLabel for why the
  // distinction is kept rather than folded into the number.
  onSale: boolean;
  addedManually: boolean;
  sortOrder: number;
};

type GroceryListRow = Omit<GroceryListRecord, 'status'> & { status: string };

type GroceryListItemRow = Omit<
  GroceryListItemRecord,
  | 'checked'
  | 'addedManually'
  | 'priceUnit'
  | 'extraAmounts'
  | 'mealNames'
  | 'soldAs'
  | 'purchaseForm'
  | 'onSale'
> & {
  purchaseForm: string | null;
  onSale: number;
  checked: number;
  addedManually: number;
  priceUnit: string | null;
  extraAmountsJson: string | null;
  mealNamesJson: string | null;
  soldAs: string | null;
};

const GROCERY_LIST_COLUMNS = `
  id, name, start_date AS startDate, days_ahead AS daysAhead, people_count AS peopleCount,
  store_name AS storeName, status, created_at AS createdAt, completed_at AS completedAt
`;

const GROCERY_ITEM_COLUMNS = `
  id, list_id AS listId, category, food_name AS foodName, unit, quantity, checked,
  checked_at AS checkedAt, price, price_unit AS priceUnit, purchased_quantity AS purchasedQuantity,
  scanned_product_id AS scannedProductId, note, added_manually AS addedManually, sort_order AS sortOrder,
  extra_amounts_json AS extraAmountsJson, meal_names_json AS mealNamesJson,
  sold_as AS soldAs, approx_amount AS approxAmount, purchase_form AS purchaseForm, on_sale AS onSale
`;

function toPriceUnit(value: string | null | undefined): GroceryPriceUnit | null {
  // Anything unrecognized reads as no unit rather than being coerced into
  // one, so a price whose meaning is unknown stays out of the running total
  // (see groceryLineTotal) instead of being counted as a package price.
  return GROCERY_PRICE_UNITS.includes(value as GroceryPriceUnit) ? (value as GroceryPriceUnit) : null;
}

function mapGroceryList(row: GroceryListRow): GroceryListRecord {
  return { ...row, status: row.status === 'completed' ? 'completed' : 'active' };
}

// Malformed JSON reads as "none recorded" rather than throwing. A stored
// list is something someone is standing in a store holding; one bad row
// must not stop the whole list from opening.
function parseJsonArray<T>(value: string | null): T[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function mapGroceryItem(row: GroceryListItemRow): GroceryListItemRecord {
  const { extraAmountsJson, mealNamesJson, ...rest } = row;
  return {
    ...rest,
    checked: row.checked === 1,
    addedManually: row.addedManually === 1,
    priceUnit: toPriceUnit(row.priceUnit),
    extraAmounts: parseJsonArray<{ quantity: number; unit: string }>(extraAmountsJson),
    mealNames: parseJsonArray<string>(mealNamesJson),
    soldAs: row.soldAs ?? '',
    purchaseForm: PURCHASE_FORMS.includes(row.purchaseForm as PurchaseForm)
      ? (row.purchaseForm as PurchaseForm)
      : null,
    onSale: row.onSale === 1,
  };
}

// One place where a schedule-derived line becomes columns and values, so the
// two paths that write one cannot disagree about the order.
//
// 2026-09-03: they had disagreed since 1.0.32.9. createGroceryListFromSchedule
// bound item.purchaseForm where approx_amount belongs and the count string
// where purchase_form belongs, so every freshly built list read "count" where
// it should have read "about 2 stalks", and lost the purchase form that
// decides which price units a line offers, taking the olive-oil fix and the
// bottle-size field down with it. The rebuild path had it right, which is both
// why Refresh corrected a list and why this survived: the count was traced and
// confirmed before purchase_form existed, and adding that column underneath it
// is what transposed the two. Positional binding across two hand-maintained
// copies is what made it possible, so there is now one copy.
export const SCHEDULE_LINE_COLUMNS =
  'id, list_id, category, food_name, unit, quantity, sort_order, extra_amounts_json, ' +
  'meal_names_json, sold_as, approx_amount, purchase_form';

export const SCHEDULE_LINE_PLACEHOLDERS = '?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?';

export function scheduleLineValues(
  id: string,
  listId: string,
  category: string,
  item: ShoppingListItem,
  peopleCount: number,
  sortOrder: number,
): (string | number | null)[] {
  const scaledQuantity = item.quantity * peopleCount;
  return [
    id,
    listId,
    category,
    item.foodName,
    item.unit,
    scaledQuantity,
    sortOrder,
    // Every amount scales by the same head count, including the ones that had
    // to be kept separate from the main figure.
    JSON.stringify(item.extraAmounts.map((extra) => ({ ...extra, quantity: extra.quantity * peopleCount }))),
    JSON.stringify(item.mealNames),
    item.soldAs || null,
    // Worked out from the SCALED weight rather than by multiplying the
    // one-person count. 2026-09-01: the first version dropped the count
    // entirely above one person, on the reasoning that multiplying a rounded
    // number is bad arithmetic. That reasoning was right and the conclusion
    // was wrong: dividing 480 g by a 150 g avocado gives three directly, with
    // nothing rounded on the way. Reported plainly from a shopping trip: "it says
    // loose, by the piece, but it doesn't say, about 1, or about 2 or 3 of
    // them."
    describeApproximateCount(
      scaledQuantity,
      item.unit,
      item.foodName,
      item.unitLabel,
      item.unitLabelPlural,
      item.gramsPerUnit,
    ),
    item.purchaseForm,
  ];
}

// Builds a list from whatever is actually scheduled in the window, then
// stores it. peopleCount multiplies every quantity: see grocery_lists' own
// CREATE TABLE comment for why that is the right model rather than a guess.
//
// An empty schedule still creates the list rather than refusing to. Someone
// who shops from a blank list and adds what they need by hand is doing an
// ordinary thing, and a screen that will not open until the schedule is
// filled in first would be the app dictating how they have to work.
export async function createGroceryListFromSchedule(input: {
  daysAhead: number;
  peopleCount: number;
  name?: string;
  storeName?: string | null;
}): Promise<string> {
  const db = await getDatabase();
  const daysAhead = Math.max(1, Math.round(input.daysAhead));
  const peopleCount = Math.max(1, Math.round(input.peopleCount));
  const startDate = new Date().toISOString().slice(0, 10);
  const id = `grocery_list_${Date.now()}`;

  await db.runAsync(
    `INSERT INTO grocery_lists (id, name, start_date, days_ahead, people_count, store_name, status)
     VALUES (?, ?, ?, ?, ?, ?, 'active')`,
    id,
    input.name?.trim() || defaultGroceryListName(startDate),
    startDate,
    daysAhead,
    peopleCount,
    input.storeName?.trim() || null,
  );

  const sections = await getUpcomingShoppingList(daysAhead);
  let sortOrder = 0;
  for (const section of sections) {
    for (const item of section.items) {
      await db.runAsync(
        `INSERT INTO grocery_list_items (${SCHEDULE_LINE_COLUMNS})
         VALUES (${SCHEDULE_LINE_PLACEHOLDERS})`,
        ...scheduleLineValues(
          `grocery_item_${Date.now()}_${sortOrder}`,
          id,
          section.category,
          item,
          peopleCount,
          sortOrder,
        ),
      );
      sortOrder += 1;
    }
  }

  return id;
}

export async function getGroceryList(id: string): Promise<GroceryListRecord | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<GroceryListRow>(
    `SELECT ${GROCERY_LIST_COLUMNS} FROM grocery_lists WHERE id = ?`,
    id,
  );
  return row ? mapGroceryList(row) : null;
}

// The one still being shopped, newest first. There is deliberately no rule
// stopping a second active list from existing: two people in a household
// shopping two different stores on the same day is a real thing, and
// refusing it would be the app inventing a restriction nobody asked for.
export async function getActiveGroceryList(): Promise<GroceryListRecord | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<GroceryListRow>(
    `SELECT ${GROCERY_LIST_COLUMNS} FROM grocery_lists WHERE status = 'active' ORDER BY created_at DESC LIMIT 1`,
  );
  return row ? mapGroceryList(row) : null;
}

export async function listGroceryLists(limit: number = 30): Promise<GroceryListRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<GroceryListRow>(
    `SELECT ${GROCERY_LIST_COLUMNS} FROM grocery_lists ORDER BY created_at DESC LIMIT ?`,
    limit,
  );
  return rows.map(mapGroceryList);
}

// Category first, then the order the list was built in, so a list read in a
// store stays in the same order every time it is opened. Checking something
// off deliberately does not move it: a list that reorders itself under a
// thumb mid-aisle is the thing people hate about shopping apps.
export async function getGroceryListItems(listId: string): Promise<GroceryListItemRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<GroceryListItemRow>(
    `SELECT ${GROCERY_ITEM_COLUMNS} FROM grocery_list_items WHERE list_id = ? ORDER BY category COLLATE NOCASE, sort_order`,
    listId,
  );
  return rows.map(mapGroceryItem);
}

export async function getGroceryListItem(itemId: string): Promise<GroceryListItemRecord | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<GroceryListItemRow>(
    `SELECT ${GROCERY_ITEM_COLUMNS} FROM grocery_list_items WHERE id = ?`,
    itemId,
  );
  return row ? mapGroceryItem(row) : null;
}

export async function setGroceryItemChecked(itemId: string, checked: boolean): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE grocery_list_items SET checked = ?, checked_at = ? WHERE id = ?',
    checked ? 1 : 0,
    checked ? new Date().toISOString() : null,
    itemId,
  );
}

// What was actually paid, and how much was actually bought. Every field is
// optional and passing null clears it, so a price entered by mistake can be
// taken back off rather than only ever corrected to another wrong number.
export async function updateGroceryItemPurchase(
  itemId: string,
  input: {
    price?: number | null;
    priceUnit?: GroceryPriceUnit | null;
    purchasedQuantity?: number | null;
    scannedProductId?: number | null;
    note?: string | null;
    onSale?: boolean;
  },
): Promise<void> {
  const db = await getDatabase();
  const fields: string[] = [];
  const params: (string | number | null)[] = [];
  if (input.price !== undefined) {
    fields.push('price = ?');
    params.push(input.price);
  }
  if (input.priceUnit !== undefined) {
    fields.push('price_unit = ?');
    params.push(input.priceUnit);
  }
  if (input.purchasedQuantity !== undefined) {
    fields.push('purchased_quantity = ?');
    params.push(input.purchasedQuantity);
  }
  if (input.scannedProductId !== undefined) {
    fields.push('scanned_product_id = ?');
    params.push(input.scannedProductId);
  }
  if (input.note !== undefined) {
    fields.push('note = ?');
    params.push(input.note);
  }
  if (input.onSale !== undefined) {
    fields.push('on_sale = ?');
    params.push(input.onSale ? 1 : 0);
  }
  if (fields.length === 0) return;
  await db.runAsync(`UPDATE grocery_list_items SET ${fields.join(', ')} WHERE id = ?`, ...params, itemId);
}

// Something remembered in the aisle, or a scanned product being added to the
// list. Lands at the end, marked as added by hand so the list can still say
// which part of it came from the schedule and which part did not.
export async function addGroceryListItem(
  listId: string,
  input: {
    category?: string;
    foodName: string;
    unit?: string;
    quantity?: number;
    scannedProductId?: number | null;
    price?: number | null;
    priceUnit?: GroceryPriceUnit | null;
    note?: string | null;
  },
): Promise<string> {
  const db = await getDatabase();
  const id = `grocery_item_${Date.now()}`;
  const maxRow = await db.getFirstAsync<{ maxOrder: number | null }>(
    'SELECT MAX(sort_order) AS maxOrder FROM grocery_list_items WHERE list_id = ?',
    listId,
  );
  await db.runAsync(
    `INSERT INTO grocery_list_items
       (id, list_id, category, food_name, unit, quantity, price, price_unit, scanned_product_id, note, added_manually, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    id,
    listId,
    input.category?.trim() || ADDED_BY_HAND_CATEGORY,
    input.foodName.trim(),
    input.unit?.trim() || '',
    input.quantity ?? 1,
    input.price ?? null,
    input.priceUnit ?? null,
    input.scannedProductId ?? null,
    input.note?.trim() || null,
    (maxRow?.maxOrder ?? 0) + 1,
  );
  return id;
}

export async function deleteGroceryListItem(itemId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM grocery_list_items WHERE id = ?', itemId);
}

export async function updateGroceryListDetails(
  id: string,
  input: { name?: string; storeName?: string | null },
): Promise<void> {
  const db = await getDatabase();
  const fields: string[] = [];
  const params: (string | null)[] = [];
  if (input.name !== undefined) {
    fields.push('name = ?');
    params.push(input.name.trim() || 'Groceries');
  }
  if (input.storeName !== undefined) {
    fields.push('store_name = ?');
    params.push(input.storeName?.trim() || null);
  }
  if (fields.length === 0) return;
  await db.runAsync(`UPDATE grocery_lists SET ${fields.join(', ')} WHERE id = ?`, ...params, id);
}

// Finishing a list keeps it rather than deleting it: its prices are the only
// record of what things cost on that trip, and the price history below is
// built entirely out of lists that have already been shopped.
export async function setGroceryListStatus(id: string, status: GroceryListStatus): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE grocery_lists SET status = ?, completed_at = ? WHERE id = ?',
    status,
    status === 'completed' ? new Date().toISOString() : null,
    id,
  );
}

// Cascades through grocery_list_items, which declares ON DELETE CASCADE and
// runs with PRAGMA foreign_keys ON.
export async function deleteGroceryList(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM grocery_lists WHERE id = ?', id);
}

export type GroceryPricePoint = {
  listId: string;
  listName: string;
  storeName: string | null;
  // When the thing was actually bought where that is known, and when the
  // list was made otherwise. A price belongs to the day it was paid.
  date: string;
  price: number;
  priceUnit: GroceryPriceUnit | null;
  quantity: number;
  purchasedQuantity: number | null;
  // So a chart can show an offer as an offer rather than as the price falling.
  onSale: boolean;
};

type GroceryPricePointRow = Omit<GroceryPricePoint, 'priceUnit' | 'onSale'> & {
  priceUnit: string | null;
  onSale: number;
};

// Every price ever recorded for one food, oldest first, matching the point
// order TrendLineChart already expects everywhere else in this app.
//
// Matched by name because that is the only identity a grocery line has:
// items arrive from resolved recipe ingredients, from a barcode, or from
// someone typing in an aisle, and only the first of those carries a
// reference-database id. The match is exact (case-insensitive), so two
// spellings of one food read as two foods, which is honest about what the
// app actually knows rather than guessing that they are the same thing.
export async function getGroceryPriceHistory(foodName: string): Promise<GroceryPricePoint[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<GroceryPricePointRow>(
    `
      SELECT
        l.id AS listId,
        l.name AS listName,
        l.store_name AS storeName,
        COALESCE(i.checked_at, l.created_at) AS date,
        i.price AS price,
        i.price_unit AS priceUnit,
        i.quantity AS quantity,
        i.purchased_quantity AS purchasedQuantity,
        i.on_sale AS onSale
      FROM grocery_list_items i
      JOIN grocery_lists l ON l.id = i.list_id
      WHERE i.food_name = ? COLLATE NOCASE AND i.price IS NOT NULL
      ORDER BY date ASC
    `,
    foodName,
  );
  return rows.map((row) => ({ ...row, priceUnit: toPriceUnit(row.priceUnit), onSale: row.onSale === 1 }));
}

export type GroceryFoodSummary = {
  foodName: string;
  category: string;
  // How many separate lists this food has appeared on, which is the honest
  // measure of how often it actually gets bought. Counting rows instead
  // would let one list that happened to split a food across two lines read
  // as two separate shopping trips.
  timesListed: number;
  timesPriced: number;
  lastPrice: number | null;
  lastPriceUnit: GroceryPriceUnit | null;
  lastSeen: string;
};

type GroceryFoodSummaryRow = Omit<GroceryFoodSummary, 'lastPrice' | 'lastPriceUnit'>;

// Everything ever put on a grocery list, most often bought first: the "usage
// over time" half of what this was asked to feed into Trends.
export async function listGroceryFoodSummaries(limit: number = 200): Promise<GroceryFoodSummary[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<GroceryFoodSummaryRow>(
    `
      SELECT
        i.food_name AS foodName,
        MIN(i.category) AS category,
        COUNT(DISTINCT i.list_id) AS timesListed,
        SUM(CASE WHEN i.price IS NOT NULL THEN 1 ELSE 0 END) AS timesPriced,
        MAX(COALESCE(i.checked_at, l.created_at)) AS lastSeen
      FROM grocery_list_items i
      JOIN grocery_lists l ON l.id = i.list_id
      GROUP BY i.food_name COLLATE NOCASE
      ORDER BY timesListed DESC, foodName COLLATE NOCASE
      LIMIT ?
    `,
    limit,
  );

  // The most recent price is fetched per food rather than squeezed into the
  // aggregate above. A bare price column alongside MAX(date) in a GROUP BY
  // is not guaranteed to come from the same row the MAX picked, and a price
  // history that quietly reports the wrong trip's price is worse than one
  // that reports nothing.
  const summaries: GroceryFoodSummary[] = [];
  for (const row of rows) {
    const latest = await db.getFirstAsync<{ price: number; priceUnit: string | null }>(
      `
        SELECT i.price AS price, i.price_unit AS priceUnit
        FROM grocery_list_items i
        JOIN grocery_lists l ON l.id = i.list_id
        WHERE i.food_name = ? COLLATE NOCASE AND i.price IS NOT NULL
        ORDER BY COALESCE(i.checked_at, l.created_at) DESC
        LIMIT 1
      `,
      row.foodName,
    );
    summaries.push({
      ...row,
      lastPrice: latest?.price ?? null,
      lastPriceUnit: toPriceUnit(latest?.priceUnit),
    });
  }
  return summaries;
}

export type GroceryListSummary = {
  list: GroceryListRecord;
  itemCount: number;
  checkedCount: number;
};

// What Home needs to say something useful about a list in progress, in one
// call rather than a list fetch plus an item fetch. Counts are done in SQL
// because Home has no use for the rows themselves, and loading every line of
// a grocery list to count them would put real work on the screen that opens
// first (see this project's own 2026-08-28 cold-start investigation).
export async function getActiveGroceryListSummary(): Promise<GroceryListSummary | null> {
  const list = await getActiveGroceryList();
  if (!list) return null;
  const db = await getDatabase();
  const counts = await db.getFirstAsync<{ itemCount: number; checkedCount: number }>(
    `SELECT COUNT(*) AS itemCount, SUM(CASE WHEN checked = 1 THEN 1 ELSE 0 END) AS checkedCount
     FROM grocery_list_items WHERE list_id = ?`,
    list.id,
  );
  return {
    list,
    itemCount: counts?.itemCount ?? 0,
    // SUM over no rows is null rather than 0 in SQLite, so this defaults
    // rather than trusting the aggregate to always hand back a number.
    checkedCount: counts?.checkedCount ?? 0,
  };
}


// --- What is already in the kitchen -----------------------------------------
//
// Gathers the three things the app knows about already having a food, and
// hands them to kitchenCoverageFor, which decides what may be said about
// each. See that function's comment for why a harvest is a
// measured amount and a past purchase is not.
//
// Matched on food name, exactly and case-insensitively, the same as
// getGroceryPriceHistory: a grocery line's only identity is its name, and a
// fuzzy match here would tell someone they already have something they do
// not.

// Everything currently in the kitchen, keyed by lower-cased food name.
async function loadKitchenStock(excludeListId: string): Promise<Map<string, KitchenStockEntry[]>> {
  const db = await getDatabase();
  const stock = new Map<string, KitchenStockEntry[]>();
  const add = (name: string, entry: KitchenStockEntry) => {
    const key = name.trim().toLowerCase();
    if (!key) return;
    const existing = stock.get(key);
    if (existing) existing.push(entry);
    else stock.set(key, [entry]);
  };

  // Both of these already return only what still has something left
  // (quantity_remaining > 0), drawn down as it gets used.
  for (const harvest of await listAvailableHarvests()) {
    add(harvest.foodName, {
      source: 'garden',
      quantity: harvest.quantityRemaining,
      unit: harvest.unit,
      date: harvest.harvestedAt.slice(0, 10),
    });
  }
  for (const harvest of await listAvailableFermentationHarvests()) {
    add(harvest.drinkName, {
      source: 'fermentation',
      quantity: harvest.quantityRemaining,
      unit: harvest.unit,
      date: harvest.readyAt.slice(0, 10),
    });
  }

  // A purchase is a date, not an amount. The current list is excluded: ticking
  // something off the list being shopped must not then report it back as
  // already in the kitchen.
  const since = new Date(Date.now() - KITCHEN_PURCHASE_RECENT_DAYS * 86400000).toISOString().slice(0, 10);
  const rows = await db.getAllAsync<{ foodName: string; unit: string; quantity: number; date: string }>(
    `
      SELECT i.food_name AS foodName, i.unit AS unit, i.quantity AS quantity,
             COALESCE(i.checked_at, l.created_at) AS date
      FROM grocery_list_items i
      JOIN grocery_lists l ON l.id = i.list_id
      WHERE i.checked = 1 AND i.list_id != ? AND COALESCE(i.checked_at, l.created_at) >= ?
    `,
    excludeListId,
    since,
  );
  for (const row of rows) {
    add(row.foodName, {
      source: 'purchase',
      quantity: row.quantity,
      unit: row.unit,
      date: (row.date ?? '').slice(0, 10),
    });
  }

  return stock;
}

// One coverage verdict per line, keyed by grocery_list_items.id.
//
// Computed on demand rather than stored: a stored list must not rewrite itself
// in an aisle, but what is in the kitchen changes as things get used, so this
// is the one part of a line that should be current every time it is read.
//
// Takes the lines it should work from rather than re-reading them, since every
// caller already has them on screen. A second read of the same rows on every
// focus is exactly the kind of quiet duplicated query this app has had to
// track down before.
export async function getKitchenCoverageForItems(
  listId: string,
  items: GroceryListItemRecord[],
): Promise<Map<string, KitchenCoverage>> {
  const stock = await loadKitchenStock(listId);
  const today = new Date().toISOString().slice(0, 10);
  const coverage = new Map<string, KitchenCoverage>();
  for (const item of items) {
    const entries = stock.get(item.foodName.trim().toLowerCase());
    if (!entries || entries.length === 0) continue;
    const result = kitchenCoverageFor(item.quantity, item.unit, entries, today);
    if (result.level !== 'none') coverage.set(item.id, result);
  }
  return coverage;
}

export type GroceryRebuildResult = {
  carriedOver: number;
  added: number;
  removed: number;
  keptByHand: number;
};

// Rebuilds a list's schedule-derived lines from the schedule as it stands now,
// keeping the list itself, anything added by hand, and every price and tick
// that still has a line to belong to.
//
// 2026-09-01, from a direct on-device report: "A lot of this looks the same as
// it did before the update." Correct, and the fault was mine. A list stores
// its lines when it is built, which is right for shopping (a list must not
// rewrite itself while someone is holding it) and leaves no way to pick up a
// later fix. A list built before the prep-name and duplicate fixes still read
// "Broccoli (boiled)" and still listed it twice, permanently.
//
// Matching old lines to new ones is by name, case-insensitively, and it is
// imperfect on purpose rather than by oversight: the lines most changed by
// those fixes are exactly the ones whose names changed, so a line that used to
// say "Broccoli (boiled)" cannot be matched to "Broccoli" without pretending
// to know they are the same. Those start fresh, and the result says how many
// did, so the caller can tell someone plainly rather than letting them notice
// a missing tick in a shop.
export async function rebuildGroceryListFromSchedule(listId: string): Promise<GroceryRebuildResult> {
  const db = await getDatabase();
  const list = await getGroceryList(listId);
  if (!list) throw new Error('That grocery list no longer exists.');

  const existing = await getGroceryListItems(listId);
  const byHand = existing.filter((item) => item.addedManually);
  const fromSchedule = existing.filter((item) => !item.addedManually);
  const previous = new Map(fromSchedule.map((item) => [item.foodName.trim().toLowerCase(), item]));

  const sections = await getUpcomingShoppingList(list.daysAhead);

  // Cleared and rewritten rather than reconciled row by row: the whole point
  // is that the shape of the list may have changed, with two old lines now
  // being one. Anything added by hand is untouched by this delete.
  await db.runAsync('DELETE FROM grocery_list_items WHERE list_id = ? AND added_manually = 0', listId);

  let carriedOver = 0;
  let added = 0;
  let sortOrder = 0;
  for (const section of sections) {
    for (const item of section.items) {
      const key = item.foodName.trim().toLowerCase();
      const prior = previous.get(key);
      if (prior) carriedOver += 1;
      else added += 1;
      await db.runAsync(
        `INSERT INTO grocery_list_items
           (${SCHEDULE_LINE_COLUMNS}, checked, checked_at, price, price_unit, purchased_quantity,
            scanned_product_id, note, on_sale)
         VALUES (${SCHEDULE_LINE_PLACEHOLDERS}, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ...scheduleLineValues(
          `grocery_item_${Date.now()}_${sortOrder}`,
          listId,
          section.category,
          item,
          list.peopleCount,
          sortOrder,
        ),
        prior?.checked ? 1 : 0,
        prior?.checkedAt ?? null,
        prior?.price ?? null,
        prior?.priceUnit ?? null,
        prior?.purchasedQuantity ?? null,
        prior?.scannedProductId ?? null,
        prior?.note ?? null,
        prior?.onSale ? 1 : 0,
      );
      previous.delete(key);
      sortOrder += 1;
    }
  }

  // Whatever the schedule no longer calls for. Counted rather than silently
  // dropped, since a line disappearing from under someone is worth saying.
  const removed = previous.size;
  return { carriedOver, added, removed, keptByHand: byHand.length };
}
