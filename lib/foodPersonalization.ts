// 2026-08-26 -- the shared core wiring a person's own tracked conditions,
// food allergies, and declared diet preference into tool areas that had
// never actually read any of them. Direct report: "we associated and
// wired up all of the conditions, food alergies, and general health
// specific tracking numbers. Those things didn't get wired through to the
// Insights tools. As well, when a user specifies their style of eating,
// all of the tools in the app need to follow those settings, just like
// their conditions, to only report back what is within the filter for
// their foods."
//
// Checked directly before writing anything: Insights (app/(tabs)/
// insights.tsx) never once called getUserConditions/getDietPreferences/
// listFoodAllergies anywhere, and components/FoodLookup.tsx (the shared
// picker every Food builder AND Insights' own Food Lookup lens both use)
// never imported anything condition-, diet-, or allergy-aware at all --
// only a plain, generic six-dimension flag (DimensionFlags, used inside
// every builder but never inside FoodLookup itself) existed anywhere near
// this. The one place real, condition-scoped food evaluation already
// existed was lib/recipeDepth.ts, built 2026-08-25 for the Food builders'
// own pre-save depth report -- this file reuses that exact engine rather
// than inventing a second, drifting copy of the same rules, the same
// "one shared engine" precedent recipeDepth.ts itself already set against
// the compute scripts it faithfully ports.
//
// A single food is a real, correct degenerate case of the same "whole
// dish" computation computeRecipeDepth/computeDietTags already do: a
// one-ingredient list. That's what every function below actually does --
// there is no second scoring engine here, only the plumbing to call the
// real one with a single food and the person's own real profile data.

import {
  getDietPreferences,
  getUserConditions,
  listAllConditions,
  listFoodAllergies,
  type MealIngredientInput,
} from './db';
import { computeDietTags, computeRecipeDepth, type RecipeDepthResult } from './recipeDepth';
import { recipeMatchesDietPreference, type RecipeDietTag } from './digest/types';

export type TrackedConditionRef = { code: string; name: string };

// The exact same two-query-plus-filter shape every Food builder already
// hand-rolls for itself (see e.g. SideBuilder.tsx's own trackedConditions
// effect) -- pulled out here as the one shared version, since Insights
// needed it fresh rather than copying a fourth or fifth instance of the
// same three lines.
export async function getTrackedConditionsWithNames(): Promise<TrackedConditionRef[]> {
  const [selectedCodes, allConditions] = await Promise.all([getUserConditions(), listAllConditions()]);
  const selected = new Set(selectedCodes);
  return allConditions
    .filter((condition) => selected.has(condition.code))
    .map((condition) => ({ code: condition.code, name: condition.name }));
}

// One place to load all three real personalization inputs at once -- a
// tool area wiring itself up for the first time needs exactly this, not a
// separate round trip per input.
export type PersonalizationProfile = {
  trackedConditions: TrackedConditionRef[];
  dietPreferences: RecipeDietTag[];
  foodAllergies: string[];
};

export async function getPersonalizationProfile(): Promise<PersonalizationProfile> {
  const [trackedConditions, dietPreferences, foodAllergies] = await Promise.all([
    getTrackedConditionsWithNames(),
    getDietPreferences(),
    listFoodAllergies(),
  ]);
  return { trackedConditions, dietPreferences: dietPreferences as RecipeDietTag[], foodAllergies };
}

function toSingleIngredient(foodId: number, source: string, category: string, baseName: string): MealIngredientInput {
  return { foodId: `${foodId}|${source}`, foodName: baseName, category, quantity: 1, unit: 'g' };
}

// Best-effort only -- allergies are free text (lib/db.ts's own
// user_food_allergies table), not linked to a real food row. Same real,
// already-shipped matching rule app/(tabs)/log.tsx's own allergyMatch
// already uses (a plain substring check), reused here rather than
// invented a second way to answer the same question.
export function foodMatchesAllergy(baseName: string, foodAllergies: string[]): string | null {
  return foodAllergies.find((name) => baseName.toLowerCase().includes(name.toLowerCase())) ?? null;
}

// Whether one food, on its own, would satisfy every one of the person's
// declared diet preferences -- computeDietTags on a real one-item
// ingredient list is exactly the same rule set a whole dish gets, applied
// to a "dish" of one food. Pure and synchronous: no DB round-trip, cheap
// enough to run per-row inside an already-fetched list (Nutrient Ranking,
// Healing Stage Food Finder) rather than only ever a single selected food.
export function foodMatchesDietPreferences(category: string, baseName: string, dietPreferences: RecipeDietTag[]): boolean {
  if (dietPreferences.length === 0) return true;
  const tags = computeDietTags([{ foodName: baseName, category, quantity: 1, unit: 'g' }]);
  return dietPreferences.every((preference) => recipeMatchesDietPreference(tags, preference));
}

// Real, full per-condition evaluation for one specific food -- the
// condition-safety half of what the Food builders' own depth report
// already computes for a whole dish (safeForConditions/conditionCautions/
// dimensionBreakdown), reused here for exactly one ingredient. Also folds
// in the diet-preference and allergy checks above so a caller gets the
// complete personalized picture from one function.
export type PersonalFoodEvaluation = {
  safeForConditions: string[];
  conditionCautions: RecipeDepthResult['conditionCautions'];
  dimensionBreakdown: RecipeDepthResult['dimensionBreakdown'];
  dietTags: RecipeDietTag[];
  dietViolations: RecipeDietTag[];
  allergyMatch: string | null;
};

export async function evaluateFoodForPerson(
  food: { foodId: number; source: string; category: string; baseName: string },
  profile: PersonalizationProfile,
): Promise<PersonalFoodEvaluation> {
  const ingredient = toSingleIngredient(food.foodId, food.source, food.category, food.baseName);
  const depth = await computeRecipeDepth([ingredient], profile.trackedConditions);
  const dietViolations = profile.dietPreferences.filter((preference) => !recipeMatchesDietPreference(depth.dietTags, preference));
  return {
    safeForConditions: depth.safeForConditions,
    conditionCautions: depth.conditionCautions,
    dimensionBreakdown: depth.dimensionBreakdown,
    dietTags: depth.dietTags,
    dietViolations,
    allergyMatch: foodMatchesAllergy(food.baseName, profile.foodAllergies),
  };
}
