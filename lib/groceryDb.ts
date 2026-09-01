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
import { getDatabase, getUpcomingShoppingList } from './db';
import { defaultGroceryListName, GROCERY_PRICE_UNITS, type GroceryPriceUnit } from './groceryList';

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
  addedManually: boolean;
  sortOrder: number;
};

type GroceryListRow = Omit<GroceryListRecord, 'status'> & { status: string };

type GroceryListItemRow = Omit<
  GroceryListItemRecord,
  'checked' | 'addedManually' | 'priceUnit' | 'extraAmounts' | 'mealNames'
> & {
  checked: number;
  addedManually: number;
  priceUnit: string | null;
  extraAmountsJson: string | null;
  mealNamesJson: string | null;
};

const GROCERY_LIST_COLUMNS = `
  id, name, start_date AS startDate, days_ahead AS daysAhead, people_count AS peopleCount,
  store_name AS storeName, status, created_at AS createdAt, completed_at AS completedAt
`;

const GROCERY_ITEM_COLUMNS = `
  id, list_id AS listId, category, food_name AS foodName, unit, quantity, checked,
  checked_at AS checkedAt, price, price_unit AS priceUnit, purchased_quantity AS purchasedQuantity,
  scanned_product_id AS scannedProductId, note, added_manually AS addedManually, sort_order AS sortOrder,
  extra_amounts_json AS extraAmountsJson, meal_names_json AS mealNamesJson
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
  };
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
        `INSERT INTO grocery_list_items
           (id, list_id, category, food_name, unit, quantity, sort_order, extra_amounts_json, meal_names_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        `grocery_item_${Date.now()}_${sortOrder}`,
        id,
        section.category,
        item.foodName,
        item.unit,
        item.quantity * peopleCount,
        sortOrder,
        // Every amount scales by the same head count, including the ones
        // that had to be kept separate from the main figure.
        JSON.stringify(item.extraAmounts.map((extra) => ({ ...extra, quantity: extra.quantity * peopleCount }))),
        JSON.stringify(item.mealNames),
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
};

type GroceryPricePointRow = Omit<GroceryPricePoint, 'priceUnit'> & { priceUnit: string | null };

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
        i.purchased_quantity AS purchasedQuantity
      FROM grocery_list_items i
      JOIN grocery_lists l ON l.id = i.list_id
      WHERE i.food_name = ? COLLATE NOCASE AND i.price IS NOT NULL
      ORDER BY date ASC
    `,
    foodName,
  );
  return rows.map((row) => ({ ...row, priceUnit: toPriceUnit(row.priceUnit) }));
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
