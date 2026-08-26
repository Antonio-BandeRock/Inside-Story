// A person's own tracked conditions, each scored on its own real
// dimension set, replacing the single generic (condition-agnostic) six-
// dimension breakdown Insights and every saved-dish detail view used to
// share. Built 2026-08-26 after confirming, condition by condition against
// the live database, that only one tracked condition actually owns all six
// dimensions with independently-scored data of its own; every other
// tracked condition has its own, smaller, differently-named real dimension
// set, built from a mix of sub-criteria it owns outright and ones it
// shares with real, cited relevance.
//
// This file owns no scoring rules of its own -- getFoodScoresForCondition/
// getConditionScoresForFoodsBulk (lib/db.ts) already compute exactly which
// sub-criteria apply to a given condition and what tier a food lands on.
// What lives here is aggregation: turning a list of already-scored foods
// into one condition's own worst-case-per-dimension summary, plus the
// per-sub-criterion detail (which foods actually triggered it) that a
// drill-down view needs. Callable once per scope (a single ingredient, a
// side, a meal, a whole day, or one saved dish) with no extra query cost,
// since the scores themselves are already fetched in bulk before this
// runs.

// Type-only -- lib/db.ts's own getConditionScoresForFoodsBulk/
// computeConditionDimensionsForFoods import real functions FROM this file
// (buildPerConditionSummaries), so this stays a type-only import
// specifically to avoid a real circular runtime dependency, the same
// precedent lib/recipeDepth.ts's own type-only import of db.ts already
// established.
import type { ConditionFoodScore } from './db';
import { tierSeverity, type TierSeverity } from './sixDimensionsReference';

// Kept in sync by hand with lib/recipeDepth.ts's own identical set --
// see that file's own comment for why this small, 2-entry duplication is
// accepted rather than imported (a plain background signal on roughly
// half of all foods, not a real per-dish or per-day concern for anyone).
const NEAR_UNIVERSAL_SUB_CRITERIA = new Set(['Selenium & Zn synergy', 'Iron Presence']);

const SEVERITY_RANK: Record<TierSeverity, number> = { unknown: 0, green: 1, yellow: 2, red: 3 };
function worseSeverity(a: TierSeverity, b: TierSeverity): TierSeverity {
  return SEVERITY_RANK[b] > SEVERITY_RANK[a] ? b : a;
}

export type ConditionDimensionSeverity = { dimension: string; severity: TierSeverity };

export type ConditionDimensionSubCriterionDetail = {
  dimension: string;
  subCriterion: string;
  severity: TierSeverity;
  relevanceNote: string | null;
  citation: string | null;
  entries: { foodName: string; tier: string }[];
};

export type ConditionDimensionSummary = {
  dimensions: ConditionDimensionSeverity[];
  subCriteria: ConditionDimensionSubCriterionDetail[];
};

const EMPTY_SUMMARY: ConditionDimensionSummary = { dimensions: [], subCriteria: [] };

// One condition's own summary, built from foods already scored against
// that exact condition (see getConditionScoresForFoodsBulk). Pure and
// synchronous -- safe to call once per scope level with no extra cost.
export function buildConditionDimensionSummary(foods: { foodName: string; scores: ConditionFoodScore[] }[]): ConditionDimensionSummary {
  if (foods.length === 0) return EMPTY_SUMMARY;

  const dimensionSeverities = new Map<string, TierSeverity>();
  const subCriteriaByName = new Map<string, ConditionDimensionSubCriterionDetail>();

  for (const food of foods) {
    for (const score of food.scores) {
      if (NEAR_UNIVERSAL_SUB_CRITERIA.has(score.subCriterion)) continue;
      const severity = tierSeverity(score.tier);
      dimensionSeverities.set(score.dimension, worseSeverity(dimensionSeverities.get(score.dimension) ?? 'unknown', severity));

      if (!subCriteriaByName.has(score.subCriterion)) {
        subCriteriaByName.set(score.subCriterion, {
          dimension: score.dimension,
          subCriterion: score.subCriterion,
          severity: 'unknown',
          relevanceNote: score.relevanceNote,
          citation: score.citation,
          entries: [],
        });
      }
      const detail = subCriteriaByName.get(score.subCriterion)!;
      detail.severity = worseSeverity(detail.severity, severity);
      detail.entries.push({ foodName: food.foodName, tier: score.tier });
    }
  }

  return {
    dimensions: Array.from(dimensionSeverities.entries()).map(([dimension, severity]) => ({ dimension, severity })),
    subCriteria: Array.from(subCriteriaByName.values()),
  };
}

// Every one of a person's tracked conditions, each with its own summary,
// built from one already-fetched bulk score map (see
// getConditionScoresForFoodsBulk) rather than a fetch per condition. The
// one reusable step every scope level below (item/side/meal/day, or a
// saved dish's own item/whole-dish levels) shares in common.
export function buildPerConditionSummaries(
  foods: { foodName: string; foodId: number; source: string }[],
  trackedConditions: { code: string; name: string }[],
  scoresByFood: Map<string, Map<string, ConditionFoodScore[]>>,
): Record<string, ConditionDimensionSummary> {
  const result: Record<string, ConditionDimensionSummary> = {};
  for (const condition of trackedConditions) {
    const perFood = foods.map((food) => ({
      foodName: food.foodName,
      scores: scoresByFood.get(`${food.foodId}|${food.source}`)?.get(condition.code) ?? [],
    }));
    result[condition.code] = buildConditionDimensionSummary(perFood);
  }
  return result;
}

