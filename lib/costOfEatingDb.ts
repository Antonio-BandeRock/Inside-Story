// The reads behind Trends > What It Costs.
//
// Everything that decides anything lives in lib/costOfEating.ts, which
// imports only pure helpers and is covered by scripts/test_cost_of_eating.js.
// This file fetches and nothing else.
//
// Phase 5 of the 2026-09-23 cross-app push, and the one with the most wiring
// per band: five tables across three tabs. It needed no new table, since
// Finances, the shopping lists, the garden and My Meds all keep their history
// already.
//
// Two things about dates. finance_entries.occurred_on, service_date,
// grocery checked_at and garden dates are all plain local 'YYYY-MM-DD', so a
// ten-character comparison is the day the person was living in.
// therapy_sessions.performed_at is 'YYYY-MM-DDTHH:mm', also local, so its
// first ten characters are that same day. Nothing here goes through a Date,
// which is what phase 3's UTC bug was about.
//
// One thing about what is counted. Only money somebody recorded on a date
// gets in: no repeating-bill projection, no budget, no plan. Life > Finances
// is where a rule about what happens every month belongs. Drawing a month by
// month history out of a rule would be inventing spending in months nobody
// entered any.

import {
  summarizeCosts,
  type CostInputs,
  type CostSummary,
  type FoodCoverage,
  type FoodCostRecord,
  type GroceryLine,
  type GrowingCostRecord,
  type HealthCostKind,
  type HealthCostRecord,
  type SupplementRun,
} from './costOfEating';
import { getDatabase, getStoredMeasurementSystem, listAllConditions } from './db';
import { getHarvestsForRange } from './harvestYieldDb';
import { getLastPaidPrices } from './harvestTradeDb';
import type { MeasureSystem } from './harvestYield';
import { getNutrientTrendSeriesForCodes } from './trendAnalysis';
import { addDays } from './eatingVariety';

/** How long a look back at what food is reaching runs. Short on purpose: the
 *  question is what food is supplying NOW, not what it supplied two years
 *  ago, and reading every day of a two-year range through the ingredient
 *  pass would be slow enough to notice on a phone. */
const COVERAGE_DAYS = 30;

/** The finance categories that are health money, and which kind each one is.
 *  The five match lib/financeCategories.ts's Health group exactly, which is
 *  why that group is finer-grained than the rest. */
const HEALTH_CATEGORY_KINDS: Record<string, HealthCostKind> = {
  health_insurance: 'insurance',
  medical_care: 'care',
  prescriptions: 'prescriptions',
  supplements: 'supplements',
  therapies: 'therapies',
};

// ---------------------------------------------------------------------------
// Band 1
// ---------------------------------------------------------------------------

async function readHealthCosts(startDate: string, endDate: string): Promise<HealthCostRecord[]> {
  const db = await getDatabase();

  const entries = await db.getAllAsync<{ occurredOn: string; amount: number; category: string; conditionCode: string | null }>(
    `
      SELECT occurred_on AS occurredOn, amount AS amount, category AS category, condition_code AS conditionCode
      FROM finance_entries
      WHERE occurred_on >= ? AND occurred_on <= ?
        AND direction = 'expense'
        AND category IN ('health_insurance', 'medical_care', 'prescriptions', 'supplements', 'therapies')
    `,
    startDate,
    endDate,
  );

  // A bill is counted at what was actually paid where that is known, and at
  // what is owed where it is not. Bills and entries have no link column
  // between them, so anything somebody recorded in both places is counted
  // from both, which the band says out loud rather than pretending to
  // de-duplicate.
  const bills = await db.getAllAsync<{ occurredOn: string; amount: number | null; conditionCode: string | null }>(
    `
      SELECT service_date AS occurredOn, COALESCE(paid_amount, you_owe) AS amount, condition_code AS conditionCode
      FROM finance_medical_bills
      WHERE service_date >= ? AND service_date <= ?
    `,
    startDate,
    endDate,
  );

  const sessions = await db.getAllAsync<{ performedAt: string; amount: number | null; conditionCode: string | null }>(
    `
      SELECT performed_at AS performedAt, cost AS amount, condition_code AS conditionCode
      FROM therapy_sessions
      WHERE performed_at >= ? AND performed_at <= ?
    `,
    startDate,
    `${endDate}T23:59`,
  );

  return [
    ...entries.map((row) => ({
      occurredOn: row.occurredOn,
      amount: row.amount ?? 0,
      kind: HEALTH_CATEGORY_KINDS[row.category] ?? 'care',
      conditionCode: row.conditionCode,
    })),
    ...bills.map((row) => ({
      occurredOn: row.occurredOn,
      amount: row.amount ?? 0,
      kind: 'care' as HealthCostKind,
      conditionCode: row.conditionCode,
    })),
    ...sessions.map((row) => ({
      occurredOn: row.performedAt.slice(0, 10),
      amount: row.amount ?? 0,
      kind: 'therapies' as HealthCostKind,
      conditionCode: row.conditionCode,
    })),
  ].filter((row) => row.amount > 0);
}

/** Every condition's name, not only the ones currently tracked. A bill
 *  tagged to something the person has since stopped tracking still happened,
 *  and showing its code where its name belongs would be the app forgetting
 *  what somebody told it. */
async function readConditionNames(): Promise<Record<string, string>> {
  const conditions = await listAllConditions();
  const names: Record<string, string> = {};
  for (const condition of conditions) names[condition.code] = condition.name;
  return names;
}

// ---------------------------------------------------------------------------
// Band 2
// ---------------------------------------------------------------------------

async function readFoodCosts(startDate: string, endDate: string): Promise<FoodCostRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ occurredOn: string; amount: number; category: string }>(
    `
      SELECT occurred_on AS occurredOn, amount AS amount, category AS category
      FROM finance_entries
      WHERE occurred_on >= ? AND occurred_on <= ?
        AND direction = 'expense'
        AND category IN ('groceries', 'dining_out')
    `,
    startDate,
    endDate,
  );
  return rows
    .filter((row) => (row.amount ?? 0) > 0)
    .map((row) => ({
      occurredOn: row.occurredOn,
      amount: row.amount,
      kind: row.category === 'dining_out' ? 'diningOut' : 'groceries',
    }));
}

/** Shopping lines, for the half of band 2 Finances cannot see: which lines
 *  were covered out of the kitchen instead of bought, and which prices were
 *  sale prices. A line is dated by when it was ticked off, falling back to
 *  when its list was made, the same order harvestTradeDb uses. */
async function readGroceryLines(startDate: string, endDate: string): Promise<GroceryLine[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    foodName: string;
    on: string;
    price: number | null;
    priceUnit: string | null;
    purchasedQuantity: number | null;
    onSale: number;
    sourcedFromKitchen: number;
  }>(
    `
      SELECT i.food_name AS foodName,
             substr(COALESCE(i.checked_at, l.created_at), 1, 10) AS "on",
             i.price AS price,
             i.price_unit AS priceUnit,
             i.purchased_quantity AS purchasedQuantity,
             i.on_sale AS onSale,
             i.sourced_from_kitchen AS sourcedFromKitchen
      FROM grocery_list_items i
      JOIN grocery_lists l ON l.id = i.list_id
      WHERE substr(COALESCE(i.checked_at, l.created_at), 1, 10) >= ?
        AND substr(COALESCE(i.checked_at, l.created_at), 1, 10) <= ?
    `,
    startDate,
    endDate,
  );
  return rows.map((row) => ({
    foodName: row.foodName,
    on: row.on,
    price: row.price,
    priceUnit: row.priceUnit,
    purchasedQuantity: row.purchasedQuantity,
    onSale: row.onSale === 1,
    sourcedFromKitchen: row.sourcedFromKitchen === 1,
  }));
}

// ---------------------------------------------------------------------------
// Band 3
// ---------------------------------------------------------------------------

/** Growing money read from finance_entries rather than from
 *  garden_cost_details, which is only the garden's annotation on a row.
 *  A cost typed straight into Finances under Garden and growing supplies has
 *  no annotation at all, and leaving it out would quietly understate what the
 *  garden cost. The annotation is joined for the area name and nothing
 *  else. */
async function readGrowingCosts(startDate: string, endDate: string): Promise<GrowingCostRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ occurredOn: string; amount: number; plotName: string | null }>(
    `
      SELECT e.occurred_on AS occurredOn,
             e.amount AS amount,
             p.name AS plotName
      FROM finance_entries e
      LEFT JOIN garden_cost_details d ON d.finance_entry_id = e.id
      LEFT JOIN garden_plots p ON p.id = d.plot_id
      WHERE e.occurred_on >= ? AND e.occurred_on <= ?
        AND e.direction = 'expense'
        AND e.category = 'garden_supplies'
    `,
    startDate,
    endDate,
  );
  return rows.filter((row) => (row.amount ?? 0) > 0);
}

// ---------------------------------------------------------------------------
// Band 4
// ---------------------------------------------------------------------------

/** Every supplement the person has described, with the nutrients on its
 *  label. Nothing here records a dose being swallowed, so a run is what
 *  somebody wrote down rather than what happened, which is why the band says
 *  so. */
async function readSupplements(): Promise<SupplementRun[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    name: string;
    startDate: string | null;
    endDate: string | null;
    active: number;
  }>(
    `
      SELECT id, name, start_date AS startDate, end_date AS endDate, active
      FROM treatments
      WHERE treatment_type = 'supplement'
      ORDER BY name
    `,
  );
  const nutrients = await db.getAllAsync<{ treatmentId: string; nutrientCode: string }>(
    'SELECT treatment_id AS treatmentId, nutrient_code AS nutrientCode FROM treatment_nutrients',
  );
  const byTreatment = new Map<string, string[]>();
  for (const row of nutrients) {
    const list = byTreatment.get(row.treatmentId) ?? [];
    if (!list.includes(row.nutrientCode)) list.push(row.nutrientCode);
    byTreatment.set(row.treatmentId, list);
  }
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    startDate: row.startDate,
    endDate: row.endDate,
    active: row.active === 1,
    nutrientCodes: byTreatment.get(row.id) ?? [],
  }));
}

async function readSupplementSpend(startDate: string, endDate: string): Promise<{ occurredOn: string; amount: number }[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ occurredOn: string; amount: number }>(
    `
      SELECT occurred_on AS occurredOn, amount AS amount
      FROM finance_entries
      WHERE occurred_on >= ? AND occurred_on <= ?
        AND direction = 'expense'
        AND category = 'supplements'
    `,
    startDate,
    endDate,
  );
  return rows.filter((row) => (row.amount ?? 0) > 0);
}

/**
 * What food by itself has been reaching lately, for the nutrients carried by
 * supplements that ended inside the range.
 *
 * Only those nutrients, and only over a short recent window. Reading every
 * nutrient over two years would mean the ingredient pass for every day in the
 * range, and Reports already proved on a phone what that costs. One call to
 * getNutrientTrendSeriesForCodes does a single pass and answers for all of
 * them, rather than one pass each.
 *
 * foodPoints is the food-alone series the Nutrients lens already draws, so
 * this figure means the same thing there as here.
 */
async function readFoodCoverage(codes: string[], endDate: string): Promise<FoodCoverage[]> {
  if (codes.length === 0) return [];
  const start = addDays(endDate, -(COVERAGE_DAYS - 1));
  const series = await getNutrientTrendSeriesForCodes(codes, start, endDate);
  const coverage: FoodCoverage[] = [];
  for (const code of codes) {
    const found = series.get(code);
    if (!found || found.foodPoints.length === 0) continue;
    const total = found.foodPoints.reduce((sum, point) => sum + point.value, 0);
    coverage.push({
      nutrientCode: code,
      displayName: found.displayName ?? code,
      averagePercent: total / found.foodPoints.length,
      days: found.foodPoints.length,
    });
  }
  return coverage;
}

// ---------------------------------------------------------------------------
// The whole lens
// ---------------------------------------------------------------------------

/** The earliest day any money was recorded, for the Everything range pill.
 *  Money rather than garden, since this lens is about money: a garden logged
 *  since 2019 with a first receipt entered last month should not draw six
 *  blank years. */
export async function getEarliestMoneyDate(): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ earliest: string | null }>(
    `
      SELECT MIN(earliest) AS earliest FROM (
        SELECT MIN(occurred_on) AS earliest FROM finance_entries
        UNION ALL SELECT MIN(service_date) FROM finance_medical_bills
        UNION ALL SELECT MIN(substr(performed_at, 1, 10)) FROM therapy_sessions
      )
    `,
  );
  return row?.earliest ?? null;
}

export async function getCostSummary(startDate: string, endDate: string): Promise<CostSummary> {
  const storedSystem = await getStoredMeasurementSystem();
  const system: MeasureSystem = storedSystem === 'imperial' ? 'imperial' : 'metric';

  const [health, conditionNames, food, groceryLines, growing, harvests, lastPaid, supplements, supplementSpend] =
    await Promise.all([
      readHealthCosts(startDate, endDate),
      readConditionNames(),
      readFoodCosts(startDate, endDate),
      readGroceryLines(startDate, endDate),
      readGrowingCosts(startDate, endDate),
      getHarvestsForRange(startDate, endDate),
      getLastPaidPrices(),
      readSupplements(),
      readSupplementSpend(startDate, endDate),
    ]);

  // Only the nutrients belonging to supplements that ended inside this
  // range, which is what band 4 has anything to say about.
  const endedCodes = [
    ...new Set(
      supplements
        .filter((run) => run.endDate !== null && run.endDate >= startDate && run.endDate <= endDate)
        .flatMap((run) => run.nutrientCodes),
    ),
  ];
  const foodCoverage = await readFoodCoverage(endedCodes, endDate);

  const inputs: CostInputs = {
    startDate,
    endDate,
    system,
    health,
    conditionNames,
    food,
    groceryLines,
    growing,
    harvests,
    lastPaid,
    supplements,
    supplementSpend,
    foodCoverage,
    coverageDays: COVERAGE_DAYS,
  };
  return summarizeCosts(inputs);
}
