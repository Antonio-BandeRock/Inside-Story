// The three reads behind Trends > What You Eat.
//
// Everything that decides anything lives in lib/eatingVariety.ts, which has
// no imports and is covered by scripts/test_eating_variety.js. This file
// only fetches: logged meal items over the charted range, the reference
// database's answer for the ones that resolve to a real food, and the safe
// list plus the food trials for the last band.
//
// Two shapes matter here and both were decided against what the tables
// actually hold rather than against what would have been convenient:
//
// 1. An item nobody could resolve to a reference food STILL COUNTS. A meal
//    typed as free text is food somebody ate, so it keys on its own
//    lowercased name and counts toward how many different things they ate.
//    What it cannot do is say whether it was bought ready or made at home,
//    so it carries `packaged: 'unknown'` and the band says how many it
//    could not place.
// 2. Bought against home-made is read from the food's category, not from
//    `meals.source_type`, which is hard-coded 'manual' for every row and so
//    can tell those two apart for nobody. `CommercialPremade` covers the
//    reference database's ready-made entries and `MyProcessedFoods` is what
//    a barcode scan becomes, so those two read as bought and every other
//    resolved category reads as made at home.

import {
  endOfLocalDay,
  getMealItemsInWindow,
  getReferenceDatabase,
  listFoodTrials,
  listMySafeFoods,
} from './db';
import {
  addDays,
  buildWeeks,
  describeVarietyThisWeek,
  suggestNearThings,
  summarizeDistinctFoods,
} from './eatingVariety';
import type {
  FoodTrialInput,
  PackagedKind,
  SafeFoodInput,
  VarietyFoodRecord,
  VarietyInputs,
} from './eatingVariety';

// The two categories that mean somebody opened a package rather than
// cooked. MyProcessedFoods is what getFoodIdentity assigns to a barcode
// scan, so anything scanned off a label lands here by itself.
const BOUGHT_READY_CATEGORIES = new Set(['CommercialPremade', 'MyProcessedFoods']);

// Microbiome Effects, D5 Digestive Tolerance & Absorption. Already scored,
// already cited, already condition-mapped, so the gut-repair band reads the
// Rule Engine's existing answer instead of a list invented here.
const MICROBIOME_SUB_CRITERION_ID = 20;
const MICROBIOME_SUPPORTIVE_TIER = 'Supportive';

// Fermentation counted on top of the scored answer, since a food can be
// fermented without having been scored yet. Deliberately short and
// deliberately excluding "pickled": a cucumber in vinegar is preserved
// rather than fermented and carries none of the live culture the band is
// about. The lens says so in its help text rather than leaving somebody to
// guess why their pickles are missing.
const FERMENTED_NAME_HINTS = [
  'sauerkraut',
  'kimchi',
  'kefir',
  'yogurt',
  'yoghurt',
  'miso',
  'tempeh',
  'natto',
  'kombucha',
  'kvass',
  'sourdough',
];

function looksFermented(foodName: string, cookingMethod: string | null): boolean {
  if (cookingMethod === 'Fermented') return true;
  const lower = foodName.toLowerCase();
  return FERMENTED_NAME_HINTS.some((hint) => lower.includes(hint));
}

type ResolvedFood = { category: string | null; gutSupportive: boolean };

// One round trip per range rather than one per food, the same shape
// getFoodScoresBulk already uses. The left join keeps a food that has no
// Microbiome Effects row at all, which is most of them: 342 of the 22,022
// carry a Supportive tier, and the rest are Not Assessed rather than
// unsupportive.
async function lookUpFoods(pairs: { foodId: number; source: string }[]): Promise<Map<string, ResolvedFood>> {
  const result = new Map<string, ResolvedFood>();
  if (pairs.length === 0) return result;
  const db = await getReferenceDatabase();
  const placeholders = pairs.map(() => '(?, ?)').join(', ');
  const params = pairs.flatMap((p) => [p.foodId, p.source]);
  const rows = await db.getAllAsync<{ foodId: number; source: string; category: string | null; supportive: number }>(
    `
      SELECT f.food_id AS foodId, f.source AS source, f.category AS category,
             MAX(CASE WHEN fs.sub_criterion_id = ? AND fs.tier = ? THEN 1 ELSE 0 END) AS supportive
      FROM foods f
      LEFT JOIN food_scores fs ON fs.food_id = f.food_id AND fs.source = f.source
      WHERE (f.food_id, f.source) IN (${placeholders})
      GROUP BY f.food_id, f.source
    `,
    MICROBIOME_SUB_CRITERION_ID,
    MICROBIOME_SUPPORTIVE_TIER,
    ...params,
  );
  for (const row of rows) {
    result.set(`${row.foodId}|${row.source}`, {
      category: row.category ?? null,
      gutSupportive: row.supportive === 1,
    });
  }
  return result;
}

function packagedFromCategory(category: string | null): PackagedKind {
  if (!category) return 'unknown';
  return BOUGHT_READY_CATEGORIES.has(category) ? 'bought' : 'home';
}

// Every meal item logged in the range, turned into the flat record shape
// lib/eatingVariety.ts works on, plus the set of dates that had any meal at
// all. That second list is what keeps a week nobody logged from drawing as
// a week of eating nothing.
export async function getEatingVarietyInputs(startDate: string, endDate: string): Promise<VarietyInputs> {
  const items = await getMealItemsInWindow(startDate, endOfLocalDay(endDate));

  const loggedDates = new Set<string>();
  const pairKeys = new Set<string>();
  const pairs: { foodId: number; source: string }[] = [];

  type Pending = VarietyFoodRecord & { lookupKey: string | null };
  const pending: Pending[] = [];

  for (const item of items) {
    const date = item.eatenAt.slice(0, 10);
    loggedDates.add(date);

    const foodName = (item.foodName ?? '').trim();
    if (!foodName) continue;

    let lookupKey: string | null = null;
    if (item.foodId) {
      const [foodIdStr, source] = item.foodId.split('|');
      const foodId = Number(foodIdStr);
      if (Number.isFinite(foodId) && source) {
        lookupKey = `${foodId}|${source}`;
        if (!pairKeys.has(lookupKey)) {
          pairKeys.add(lookupKey);
          pairs.push({ foodId, source });
        }
      }
    }

    pending.push({
      date,
      // A food nobody resolved keys on its name, so two spellings of the
      // same thing count twice and the same spelling counts once. That is
      // the most honest answer available without guessing.
      foodKey: lookupKey ?? foodName.toLowerCase(),
      foodName,
      category: item.category ?? null,
      cookingMethod: item.cookingMethod ?? null,
      packaged: 'unknown',
      gutSupportive: false,
      fermented: looksFermented(foodName, item.cookingMethod ?? null),
      lookupKey,
    });
  }

  const resolved = await lookUpFoods(pairs);

  const records: VarietyFoodRecord[] = pending.map((entry) => {
    const found = entry.lookupKey ? resolved.get(entry.lookupKey) : undefined;
    const category = found?.category ?? entry.category;
    return {
      date: entry.date,
      foodKey: entry.foodKey,
      foodName: entry.foodName,
      category,
      cookingMethod: entry.cookingMethod,
      packaged: found ? packagedFromCategory(found.category) : 'unknown',
      gutSupportive: found?.gutSupportive ?? false,
      fermented: entry.fermented,
    };
  });

  return {
    records,
    loggedDates: Array.from(loggedDates).sort(),
    startDate,
    endDate,
  };
}

// Band 6's two reads. The safe list and the trials are both small enough to
// take whole, and both are cumulative rather than ranged, so the range gets
// applied by lib/eatingVariety.ts rather than by the query.
export async function getSafeListInputs(): Promise<{ safeFoods: SafeFoodInput[]; trials: FoodTrialInput[] }> {
  const [safeRows, trialRows] = await Promise.all([listMySafeFoods(), listFoodTrials(500)]);
  return {
    safeFoods: safeRows.map((row) => ({
      foodName: row.foodName,
      verdict: row.verdict,
      addedAt: row.addedAt ?? null,
    })),
    trials: trialRows.map((row) => ({
      foodName: row.foodName,
      status: row.status,
      startedAt: row.startedAt,
    })),
  };
}

// ---------------------------------------------------------------------------
// Home
// ---------------------------------------------------------------------------

// Four weeks rather than the lens's own range: the card compares this week
// against the recent ones, and three earlier weeks is enough to average
// without reading a quarter of the meal history every time Home opens.
const HOME_RANGE_DAYS = 28;

export type VarietyHomeSummary = {
  line: string;
  // One food off the safe list that has not been eaten in the range. Home
  // shows one where the lens shows three, since a card is a nudge rather
  // than a list. Null when the safe list has nothing to offer.
  nearThing: string | null;
  distinctThisWeek: number | null;
};

export async function getVarietyHomeSummary(today: string): Promise<VarietyHomeSummary> {
  const startDate = addDays(today, -(HOME_RANGE_DAYS - 1));
  const [inputs, safe] = await Promise.all([getEatingVarietyInputs(startDate, today), getSafeListInputs()]);
  const weeks = buildWeeks(inputs.startDate, inputs.endDate, inputs.loggedDates);
  const distinct = summarizeDistinctFoods(inputs, weeks);
  const nearThings = suggestNearThings(safe.safeFoods, inputs.records, 1);
  return {
    line: describeVarietyThisWeek(distinct),
    nearThing: nearThings[0] ?? null,
    distinctThisWeek: distinct.latest,
  };
}
