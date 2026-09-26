// Reads for the six Insights lenses in lib/insightsMore.ts, 1.0.52.7. Every
// query here is a SELECT or a call to a reader that already exists:
// Insights never writes.
import { listCaptureNotes, getCaptureInboxCounts } from './captureNotesDb';
import { getCheckinTagDefinition } from './checkinTags';
import { getCostSummary } from './costOfEatingDb';
import { listEveryRunningCountdown } from './countdownDb';
import {
  getDatabase,
  getDayMealAndDoseTimeline,
  getDietaryReferenceIntakesForCurrentUser,
  getFoodNutrients,
  getLabTests,
  listLabResults,
} from './db';
import { buildDayTimeline } from './doseMealTiming';
import { addDays } from './eatingVariety';
import { budgetProgress } from './financeAccounts';
import { listBudgets } from './financeAccountsDb';
import { buildMonthPicture, summarizeRecurring, type RecurringItem } from './financeCore';
import { getFinanceMonth } from './financeDb';
import { describePlanStanding, planStanding } from './financeHealth';
import { getActiveInsurancePlan, listMedicalBills } from './financeHealthDb';
import { loadKitchenStock, stockIdKey, stockPairKey } from './groceryDb';
import {
  buildAppointmentView,
  buildGardenView,
  buildKitchenView,
  buildMoneyView,
  buildSignalsView,
  buildTodayView,
  type KitchenInputs,
  type SignalCheckin,
} from './insightsMore';
import { listKitchenInventory } from './kitchenDb';
import { buildMakePlan, type MakeIngredient } from './kitchenUsage';
import { analyzeNutrientIntake } from './nutrientAnalysis';
import { listOnHandHarvests } from './plateSourceDb';
import type { ReadingView } from './readingBands';
import { getDoneChecks, getRoutines } from './routinesDb';
import { listAllAppointments, listBloodPressureReadings, DOSE_ITEM_TYPES } from './trendsMoreDb';
import { convertToGrams, type MeasurementUnit } from './unitConversion';
import { upkeepStanding } from './upkeep';
import { listUpkeepItems } from './upkeepDb';

export type InsightsMoreLens = 'i-today' | 'i-signals' | 'i-appointment' | 'i-money' | 'i-kitchen' | 'i-garden';

function todayString(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

async function dayTimeline(date: string) {
  const data = await getDayMealAndDoseTimeline(date);
  return buildDayTimeline(data.meals, data.doses, data.rules, data.timings, data.nutrientNames);
}

async function listYesterdayOpen(today: string): Promise<{ scheduledFor: string; title: string; itemType: string }[]> {
  const db = await getDatabase();
  const types = ['meal', ...DOSE_ITEM_TYPES];
  return db.getAllAsync(
    `SELECT scheduled_for AS scheduledFor, title, item_type AS itemType FROM schedule_items
     WHERE status = 'planned' AND item_type IN (${types.map(() => '?').join(', ')})
       AND scheduled_for >= ? AND scheduled_for < ?
     ORDER BY scheduled_for ASC`,
    ...types,
    addDays(today, -1),
    today,
  );
}

async function listCheckinsAround(today: string): Promise<SignalCheckin[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    loggedAt: string;
    checkinType: string;
    valence: string | null;
    severity: number | null;
    notes: string | null;
    foodName: string | null;
  }>(
    `SELECT id, logged_at AS loggedAt, checkin_type AS checkinType, valence, severity, notes, food_name AS foodName
     FROM wellbeing_checkins WHERE logged_at >= ? AND logged_at < ? ORDER BY logged_at ASC`,
    addDays(today, -1),
    addDays(today, 2),
  );
  if (rows.length === 0) return [];
  const tags = await db.getAllAsync<{ checkinId: string; tagCode: string }>(
    `SELECT checkin_id AS checkinId, tag_code AS tagCode FROM checkin_tags
     WHERE checkin_id IN (${rows.map(() => '?').join(', ')})`,
    ...rows.map((row) => row.id),
  );
  return rows.map((row) => ({
    ...row,
    tags: tags
      .filter((tag) => tag.checkinId === row.id)
      .map((tag) => getCheckinTagDefinition(tag.tagCode)?.label ?? tag.tagCode),
  }));
}

async function loadAppointmentInputs(today: string) {
  const db = await getDatabase();
  const [appointments, labRows, labTests, flares, treatments, notes] = await Promise.all([
    listAllAppointments(),
    listLabResults(undefined, 200),
    getLabTests(),
    db.getAllAsync<{ loggedAt: string; severity: number | null; notes: string | null }>(
      `SELECT logged_at AS loggedAt, severity, notes FROM wellbeing_checkins WHERE checkin_type = 'flare' ORDER BY logged_at ASC`,
    ),
    db.getAllAsync<{
      name: string;
      treatmentType: string;
      startDate: string | null;
      endDate: string | null;
      updatedAt: string | null;
      doseAmount: number | null;
      doseUnit: string | null;
    }>(
      `SELECT name, treatment_type AS treatmentType, start_date AS startDate, end_date AS endDate,
              updated_at AS updatedAt, dose_amount AS doseAmount, dose_unit AS doseUnit
       FROM treatments ORDER BY name`,
    ),
    listCaptureNotes(365),
  ]);
  const names = new Map(labTests.map((test) => [test.code, test.displayName]));
  return {
    today,
    appointments,
    labs: labRows
      .map((lab) => ({
        displayName: names.get(lab.testCode) ?? lab.testCode,
        value: lab.value,
        unit: lab.unit,
        low: lab.labRangeLow,
        high: lab.labRangeHigh,
        testedAt: lab.testedAt,
      }))
      .sort((a, b) => a.testedAt.localeCompare(b.testedAt)),
    flares,
    treatments,
    healthNotes: notes
      .filter((note) => note.destination === 'health')
      .map((note) => ({ text: note.text, createdAt: note.createdAt, status: note.status })),
  };
}

async function loadMoneyInputs(today: string) {
  const month = today.slice(0, 7);
  const [finance, budgets, bills, plan, cost] = await Promise.all([
    getFinanceMonth(month),
    listBudgets(),
    listMedicalBills(),
    getActiveInsurancePlan(),
    getCostSummary(`${month}-01`, today).catch(() => null),
  ]);
  const recurring: RecurringItem[] = finance.recurring.map((row) => ({ ...row }));
  const picture = buildMonthPicture(month, recurring, finance.entries, finance.tracked);
  const summary = summarizeRecurring(recurring);
  return {
    month,
    today,
    picture,
    budgets: budgets
      .filter((budget) => budget.active)
      .map((budget) =>
        budgetProgress({
          category: budget.category,
          limit: budget.monthlyLimit,
          spent: picture.byCategory.find((row) => row.category === budget.category)?.monthly ?? 0,
          committed: summary.byCategory.find((row) => row.category === budget.category)?.monthly ?? 0,
        }),
      ),
    bills,
    planLine: plan ? describePlanStanding(planStanding(plan, bills)) : null,
    cost,
  };
}

// Every saved recipe of the eleven kinds a Food builder makes, with its
// ingredients, read in one query per kind rather than one per recipe.
const RECIPE_KINDS: { table: string; ingredients: string; parent: string; label: string }[] = [
  { table: 'sides', ingredients: 'side_ingredients', parent: 'side_id', label: 'Side' },
  { table: 'salads', ingredients: 'salad_ingredients', parent: 'salad_id', label: 'Salad' },
  { table: 'smoothies', ingredients: 'smoothie_ingredients', parent: 'smoothie_id', label: 'Smoothie' },
  { table: 'fermentations', ingredients: 'fermentation_ingredients', parent: 'fermentation_id', label: 'Fermentation' },
  { table: 'beverages', ingredients: 'beverage_ingredients', parent: 'beverage_id', label: 'Drink' },
  { table: 'snacks', ingredients: 'snack_ingredients', parent: 'snack_id', label: 'Snack' },
  { table: 'baked_goods', ingredients: 'baked_goods_ingredients', parent: 'baked_good_id', label: 'Baked good' },
  { table: 'soups', ingredients: 'soup_ingredients', parent: 'soup_id', label: 'Soup' },
  { table: 'sauces', ingredients: 'sauce_ingredients', parent: 'sauce_id', label: 'Sauce' },
  { table: 'handhelds', ingredients: 'handheld_ingredients', parent: 'handheld_id', label: 'Handheld' },
  { table: 'desserts', ingredients: 'dessert_ingredients', parent: 'dessert_id', label: 'Dessert' },
];

async function loadRecipeCoverage(): Promise<KitchenInputs['recipes']> {
  const db = await getDatabase();
  const stock = await loadKitchenStock();
  const lookup = (ingredient: MakeIngredient) =>
    stock.get(stockIdKey(ingredient.foodId) ?? ' ') ??
    stock.get(stockPairKey(ingredient.category ?? '', ingredient.foodName)) ??
    stock.get(ingredient.foodName.trim().toLowerCase());
  const out: KitchenInputs['recipes'] = [];
  for (const kind of RECIPE_KINDS) {
    const rows = await db.getAllAsync<{
      recipeId: string;
      recipeName: string;
      foodId: string | null;
      foodName: string;
      category: string | null;
      quantity: number;
      unit: string;
    }>(
      `SELECT r.id AS recipeId, r.name AS recipeName, i.food_id AS foodId, i.food_name AS foodName,
              i.category AS category, i.quantity AS quantity, i.unit AS unit
       FROM ${kind.table} r JOIN ${kind.ingredients} i ON i.${kind.parent} = r.id
       ORDER BY r.name, i.sort_order`,
    );
    const byRecipe = new Map<string, { name: string; ingredients: MakeIngredient[] }>();
    for (const row of rows) {
      const entry = byRecipe.get(row.recipeId) ?? { name: row.recipeName, ingredients: [] };
      entry.ingredients.push({
        foodId: row.foodId === null ? null : String(row.foodId),
        foodName: row.foodName,
        category: row.category,
        quantity: row.quantity,
        unit: row.unit,
      });
      byRecipe.set(row.recipeId, entry);
    }
    for (const [id, recipe] of byRecipe) {
      const plan = buildMakePlan(recipe.ingredients, lookup);
      out.push({
        key: `${kind.table}-${id}`,
        name: recipe.name,
        kind: kind.label,
        covered: plan.lines.filter((line) => line.status === 'full').length,
        total: plan.lines.length,
        full: plan.fullyStocked,
      });
    }
  }
  return out;
}

async function loadGardenInputs(today: string) {
  const db = await getDatabase();
  const weekStart = addDays(today, -6);
  const [plantings, onHand, uses, dri] = await Promise.all([
    db.getAllAsync<{ foodName: string; plotName: string | null; expectedStart: string | null; expectedEnd: string | null; status: string }>(
      `SELECT pl.food_name AS foodName, p.name AS plotName, pl.expected_harvest_start AS expectedStart,
              pl.expected_harvest_end AS expectedEnd, pl.status AS status
       FROM garden_plantings pl LEFT JOIN garden_plots p ON p.id = pl.plot_id
       WHERE pl.status = 'growing'`,
    ),
    listOnHandHarvests(),
    db.getAllAsync<{ foodId: number | null; source: string | null; foodName: string; quantity: number; unit: string; usedOn: string }>(
      `SELECT food_id AS foodId, source, food_name AS foodName, quantity_used AS quantity, unit, used_on AS usedOn
       FROM harvest_uses WHERE meal_id IS NOT NULL AND used_on >= ? AND used_on <= ? ORDER BY used_on ASC`,
      weekStart,
      today,
    ),
    getDietaryReferenceIntakesForCurrentUser(),
  ]);

  // The garden's share of the week: every use turned into grams and then
  // into nutrients from the reference database, summed, and set against
  // seven days of the person's targets.
  const totals: Record<string, number> = {};
  let usesUncounted = 0;
  const nutrientCache = new Map<string, Awaited<ReturnType<typeof getFoodNutrients>>>();
  for (const use of uses) {
    if (use.foodId === null || !use.source) {
      usesUncounted += 1;
      continue;
    }
    const grams = convertToGrams(use.quantity, use.unit as MeasurementUnit);
    if (!grams.ok) {
      usesUncounted += 1;
      continue;
    }
    const cacheKey = `${use.source}:${use.foodId}`;
    let nutrients = nutrientCache.get(cacheKey);
    if (!nutrients) {
      nutrients = await getFoodNutrients(use.foodId, use.source);
      nutrientCache.set(cacheKey, nutrients);
    }
    if (nutrients.length === 0) {
      usesUncounted += 1;
      continue;
    }
    for (const nutrient of nutrients) {
      totals[nutrient.code] = (totals[nutrient.code] ?? 0) + (nutrient.amountPer100g * grams.grams) / 100;
    }
  }
  const analysis = analyzeNutrientIntake(dri, totals);
  return {
    today,
    plantings,
    onHand,
    weekUses: uses.map((use) => ({ foodName: use.foodName, quantity: use.quantity, unit: use.unit, usedOn: use.usedOn })),
    nutrientShare: analysis.map((entry) => ({
      displayName: entry.displayName,
      unit: entry.unit,
      fromGarden: entry.fromFood,
      weekTarget: entry.target * 7,
    })),
    usesUncounted,
  };
}

export async function loadInsightsMoreView(lens: InsightsMoreLens): Promise<ReadingView> {
  const today = todayString();
  switch (lens) {
    case 'i-today': {
      const [timeline, routines, checks, upkeep, appointments, countdowns, yesterdayOpen, capture] = await Promise.all([
        dayTimeline(today),
        getRoutines(),
        getDoneChecks(),
        listUpkeepItems(),
        listAllAppointments(),
        listEveryRunningCountdown(today),
        listYesterdayOpen(today),
        getCaptureInboxCounts(),
      ]);
      return buildTodayView({
        today,
        now: new Date(),
        timeline,
        routines,
        checks,
        upkeep: upkeep.map((item) => upkeepStanding(item, today)),
        appointments,
        countdowns,
        yesterdayOpen,
        captureWaiting: capture.waiting,
      });
    }
    case 'i-signals': {
      const [timeline, checkins, bloodPressure] = await Promise.all([
        dayTimeline(today),
        listCheckinsAround(today),
        listBloodPressureReadings(),
      ]);
      return buildSignalsView({ today, timeline, checkins, bloodPressure });
    }
    case 'i-appointment':
      return buildAppointmentView(await loadAppointmentInputs(today));
    case 'i-money':
      return buildMoneyView(await loadMoneyInputs(today));
    case 'i-kitchen': {
      const [items, recipes] = await Promise.all([listKitchenInventory('food'), loadRecipeCoverage()]);
      return buildKitchenView({
        today,
        items: items.map((item) => ({
          id: item.id,
          foodName: item.foodName,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          quantityRemaining: item.quantityRemaining,
          location: item.location,
          addedAt: item.addedAt,
        })),
        recipes,
      });
    }
    case 'i-garden':
      return buildGardenView(await loadGardenInputs(today));
  }
}
