// Finances' stored data: reading and writing finance_recurring and
// finance_entries, plus the rollup that pulls in money this app already
// collected elsewhere.
//
// Added 2026-09-05 with the Life tab's first area. Kept out of lib/db.ts,
// which is well past 18,000 lines, following the precedent lib/groceryDb.ts
// and lib/dailyMealPlan.ts already set: the schema stays in db.ts because
// that is where the database is created, everything reading or writing it
// lives here reaching the same connection through getDatabase(), and the
// pure arithmetic sits in lib/financeCore.ts with no database at all so it
// can be tested without one.
//
// THE PART WORTH READING BEFORE CHANGING ANYTHING HERE:
//
// getTrackedSpending below reads grocery_list_items and therapy_sessions
// directly and does NOT copy anything out of them. That is the whole
// design of "match life against finances": this app has been recording
// real, dated, priced grocery trips since 2026-09-01 and real therapy
// session costs since 2026-09-04, and a finance area that made someone
// retype all of it would be worse than useless. Copying those rows into
// finance_entries would be the obvious shortcut and the wrong one, because
// correcting a price on the grocery list would then leave a stale finance
// copy disagreeing with it, which is exactly the drift this project has
// had to unpick repeatedly elsewhere.

import { getDatabase } from './db';
import { groceryLineTotal, type GroceryPriceUnit } from './groceryList';
import type { TrackedSpending } from './financeCore';
import type { FinanceDirection } from './financeCategories';
import { parseDueRule, serializeDueRule, type DueRule } from './financeSchedule';

// finance_recurring.cadence is NOT NULL and predates the rule model. Every
// row written from now on stores this marker in it, meaning "the real
// answer is in due_rule_json". Nothing reads it back except the legacy
// fallback in financeCore, which deliberately does not recognize this
// value, so a current row always resolves through its rule.
const CADENCE_SUPERSEDED = 'rule';

export type FinanceRecurringRecord = {
  id: string;
  direction: FinanceDirection;
  name: string;
  category: string;
  amount: number;
  rule: DueRule | null;
  // Only ever non-null on a row written before 2026-09-05. See the
  // migration in lib/db.ts and LEGACY_CADENCE_MONTHLY in financeCore.
  legacyCadence: string | null;
  autopay: boolean;
  active: boolean;
  notes: string | null;
};

export type FinanceEntryRecord = {
  id: string;
  occurredOn: string;
  direction: FinanceDirection;
  amount: number;
  category: string;
  description: string | null;
  notes: string | null;
};

// --- Recurring: the bills and income that repeat ---------------------------

export async function createRecurring(input: {
  direction: FinanceDirection;
  name: string;
  category: string;
  amount: number;
  rule: DueRule;
  autopay?: boolean;
  notes?: string;
}): Promise<string> {
  const db = await getDatabase();
  const id = `fin_rec_${Date.now()}`;
  const now = new Date().toISOString();
  await db.runAsync(
    `
      INSERT INTO finance_recurring
        (id, direction, name, category, amount, cadence, due_rule_json, autopay, active, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
    `,
    id,
    input.direction,
    input.name.trim(),
    input.category,
    input.amount,
    CADENCE_SUPERSEDED,
    serializeDueRule(input.rule),
    input.autopay ? 1 : 0,
    input.notes?.trim() || null,
    now,
    now,
  );
  return id;
}

export async function updateRecurring(
  id: string,
  input: {
    direction: FinanceDirection;
    name: string;
    category: string;
    amount: number;
    rule: DueRule;
    autopay?: boolean;
    notes?: string;
  },
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `
      UPDATE finance_recurring
      SET direction = ?, name = ?, category = ?, amount = ?, cadence = ?,
          due_rule_json = ?, autopay = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `,
    input.direction,
    input.name.trim(),
    input.category,
    input.amount,
    CADENCE_SUPERSEDED,
    serializeDueRule(input.rule),
    input.autopay ? 1 : 0,
    input.notes?.trim() || null,
    new Date().toISOString(),
    id,
  );
}

// Pausing rather than deleting is its own action on purpose. A bill that
// stops for a few months (a gym membership over winter, a subscription on
// hold) should come back with its own amount and history intact rather
// than being retyped, and a paused row is excluded from every total by
// summarizeRecurring's own active filter.
export async function setRecurringActive(id: string, active: boolean): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE finance_recurring SET active = ?, updated_at = ? WHERE id = ?',
    active ? 1 : 0,
    new Date().toISOString(),
    id,
  );
}

export async function deleteRecurring(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM finance_recurring WHERE id = ?', id);
}

export async function listRecurring(): Promise<FinanceRecurringRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    direction: FinanceDirection;
    name: string;
    category: string;
    amount: number;
    cadence: string;
    dueRuleJson: string | null;
    autopay: number;
    active: number;
    notes: string | null;
  }>(
    `
      SELECT id, direction, name, category, amount, cadence,
             due_rule_json AS dueRuleJson, autopay, active, notes
      FROM finance_recurring
      ORDER BY direction DESC, active DESC, amount DESC
    `,
  );
  return rows.map((row) => {
    const rule = parseDueRule(row.dueRuleJson);
    return {
      id: row.id,
      direction: row.direction,
      name: row.name,
      category: row.category,
      amount: row.amount,
      rule,
      // Once a rule is present the cadence word is irrelevant, so it is
      // dropped here rather than carried around as a second answer.
      legacyCadence: rule ? null : row.cadence === CADENCE_SUPERSEDED ? null : row.cadence,
      autopay: row.autopay === 1,
      active: row.active === 1,
      notes: row.notes,
    };
  });
}

// --- Entries: what actually happened ---------------------------------------

export async function createEntry(input: {
  occurredOn: string;
  direction: FinanceDirection;
  amount: number;
  category: string;
  description?: string;
  notes?: string;
}): Promise<string> {
  const db = await getDatabase();
  const id = `fin_ent_${Date.now()}`;
  const now = new Date().toISOString();
  await db.runAsync(
    `
      INSERT INTO finance_entries
        (id, occurred_on, direction, amount, category, description, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    id,
    input.occurredOn,
    input.direction,
    input.amount,
    input.category,
    input.description?.trim() || null,
    input.notes?.trim() || null,
    now,
    now,
  );
  return id;
}

export async function deleteEntry(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM finance_entries WHERE id = ?', id);
}

/** Newest first. `month` is 'YYYY-MM' and matches on occurred_on's prefix. */
export async function listEntries(filters: { month?: string; limit?: number } = {}): Promise<FinanceEntryRecord[]> {
  const db = await getDatabase();
  const where = filters.month ? "WHERE occurred_on LIKE ? || '%'" : '';
  const params: (string | number)[] = filters.month ? [filters.month] : [];
  const rows = await db.getAllAsync<FinanceEntryRecord>(
    `
      SELECT id, occurred_on AS occurredOn, direction, amount, category, description, notes
      FROM finance_entries
      ${where}
      ORDER BY occurred_on DESC, created_at DESC
      LIMIT ?
    `,
    ...params,
    filters.limit ?? 300,
  );
  return rows;
}

// --- The money this app already had ----------------------------------------

/**
 * Grocery and hands-on therapy spending for one month, read from the
 * tables that own it.
 *
 * Grocery lines are totalled with groceryLineTotal, the grocery list's own
 * function, rather than a second copy of that arithmetic here. That
 * matters more than it looks: a price can be per pound, per litre or for
 * the whole line, and the rules for which of those needs a purchased
 * quantity before it means anything are already settled and already
 * tested. A separate implementation would be a second thing to keep
 * correct and a second thing to get wrong.
 *
 * A line whose total comes back null is counted, never estimated. That is
 * the same refusal the grocery list itself makes when a per-pound price
 * has no weight entered, and the reason is the same: a wrong number in a
 * total someone is reading to decide what they can afford is worse than a
 * total that admits it is incomplete.
 *
 * The month is matched on checked_at, not on when the list was created: a
 * line belongs to the month it was actually bought in, and a list built at
 * the end of August and shopped in September is September's money.
 */
export async function getTrackedSpending(month: string): Promise<TrackedSpending> {
  const db = await getDatabase();

  const groceryRows = await db.getAllAsync<{
    price: number | null;
    priceUnit: GroceryPriceUnit | null;
    purchasedQuantity: number | null;
    quantity: number;
    sourcedFromKitchen: number;
  }>(
    `
      SELECT price, price_unit AS priceUnit, purchased_quantity AS purchasedQuantity,
             quantity, sourced_from_kitchen AS sourcedFromKitchen
      FROM grocery_list_items
      WHERE checked = 1 AND checked_at IS NOT NULL AND checked_at LIKE ? || '%'
    `,
    month,
  );

  let grocerySpend = 0;
  let groceryLinesWithoutPrice = 0;
  let kitchenCoveredLines = 0;

  for (const row of groceryRows) {
    // A line taken from the garden or a ferment carries no price because
    // nothing was spent. Counting it as a missing price would be wrong:
    // there is no gap in what the app knows, the answer is genuinely zero
    // money. It is reported as its own count instead.
    if (row.sourcedFromKitchen === 1) {
      kitchenCoveredLines += 1;
      continue;
    }
    const total = groceryLineTotal({
      price: row.price,
      priceUnit: row.priceUnit,
      purchasedQuantity: row.purchasedQuantity,
      quantity: row.quantity,
    });
    if (total == null) groceryLinesWithoutPrice += 1;
    else grocerySpend += total;
  }

  const therapyRows = await db.getAllAsync<{ cost: number | null }>(
    `
      SELECT cost
      FROM therapy_sessions
      WHERE performed_at LIKE ? || '%'
    `,
    month,
  );

  let therapySpend = 0;
  let therapySessionsWithoutCost = 0;
  for (const row of therapyRows) {
    if (row.cost == null) therapySessionsWithoutCost += 1;
    else therapySpend += row.cost;
  }

  return {
    grocerySpend,
    groceryLinesWithoutPrice,
    therapySpend,
    therapySessionsWithoutCost,
    kitchenCoveredLines,
  };
}

/**
 * Everything one screen needs for a month, fetched together so nothing
 * ends up comparing a plan from one moment against a record from another.
 */
export async function getFinanceMonth(month: string): Promise<{
  recurring: FinanceRecurringRecord[];
  entries: FinanceEntryRecord[];
  tracked: TrackedSpending;
}> {
  const [recurring, entries, tracked] = await Promise.all([
    listRecurring(),
    listEntries({ month }),
    getTrackedSpending(month),
  ]);
  return { recurring, entries, tracked };
}
