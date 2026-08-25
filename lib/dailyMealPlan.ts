// The Daily Meal Plan generator -- 2026-08-25, direct request: "do we
// have any way to use the RDA of nutrients to build full day meal plans
// from the recipes available... without sugars being used in breakfast
// so no smoothies for breakfast but for lunches along with sides if
// necessary, and a choice on carbs or no carbs or low carbs with
// appropriate information about the health rating of the day's
// ingestion, all based on their eating style and selected conditions."
//
// Scoped directly, confirmed before building: a new, standalone, dynamic
// generator, deliberately separate from the existing 6-Week Meal Plan
// (lib/mealPlan.ts, a fixed, hand-authored 42-day rotation that isn't
// aware of a specific declared condition at all). This generator picks
// fresh every time from the same "Meals You Can Eat" pool the Digest
// already computes, cross-filtered by every declared condition and diet
// preference at once, so it's automatically correct whenever either
// changes on Profile. The day's own health rating reuses the existing
// green/yellow/red condition-safety tiers already used everywhere else
// in this app (Meals You Can Eat, a recipe's own detail page), the worst
// tier among the day's own picks, rather than a new, separate rating
// system.
//
// Real infrastructure this reuses rather than rebuilds: getCuratedRecipe/
// getCuratedRecipeNutrientTotals/curatedRecipeContainsSweetenerIngredient
// (lib/db.ts, the same live nutrient-resolution pipeline Trends already
// uses for logged and projected meals), getDietaryReferenceIntakesForCurrentUser
// (real, age/sex-personalized NASEM DRI data), RecipeCard.safeForConditions/
// conditionCautions/dietTags (already computed for all 300 curated
// recipes), and recipeMatchesAllDietPreferences (lib/digest/types.ts).
//
// Two real gaps this file closes that didn't exist anywhere else in the
// app before this: which of the 300 curated recipes are actually
// breakfast-appropriate (BREAKFAST_ELIGIBLE_RECIPE_IDS below), and a
// real, cited definition of what "low carb" and "no carb" mean in grams
// per day.
//
// 2026-08-25, same-day direct follow-up: "we need to also follow
// specific timing for how often things should be eaten, such as fish
// twice a week... a real rotation of food randomly but also so they
// don't eat the same thing... wired to the 6 week, or really however
// many weeks up to 6." generateMealPlanDays (below) is the real
// multi-day generator this added: FREQUENCY_RULES (fish/red meat,
// tracked per calendar week) and RotationState (real day-to-day variety,
// never repeating a recipe until every real option has been used at
// least once) both thread through the same generateOneDay a plain
// single-day request already used, so single- and multi-day generation
// can never quietly drift apart into two different implementations.
import {
  curatedRecipeContainsAnyIngredient,
  curatedRecipeContainsSweetenerIngredient,
  getCuratedRecipeNutrientTotals,
  getDietaryReferenceIntakesForCurrentUser,
  type MealPlanDay,
  type MealPlanSlot,
} from './db';
import {
  getEntriesForCategory,
  isProblemFoodEntry,
  recipeMatchesAllDietPreferences,
  type AnyDigestEntry,
  type DigestEntry,
  type RecipeDietTag,
} from './digest';

// A recipe entry that's actually usable by this generator: not a
// ProblemFoodEntry, carries a real RecipeCard, and has both real fields
// (linkedCuratedRecipeId/linkedBuilderType) this whole file depends on --
// isProblemFoodEntry alone narrows AnyDigestEntry down to DigestEntry,
// but a plain .filter() callback returning boolean doesn't propagate
// that narrowing to the resulting array's own type, so this is a real
// type predicate, not just an equivalent-looking boolean check.
type EligibleRecipeEntry = DigestEntry & {
  linkedCuratedRecipeId: string;
  linkedBuilderType: NonNullable<DigestEntry['linkedBuilderType']>;
};

function isEligibleRecipeEntry(entry: AnyDigestEntry): entry is EligibleRecipeEntry {
  return !isProblemFoodEntry(entry) && !!entry.recipeCard && !!entry.linkedCuratedRecipeId && !!entry.linkedBuilderType;
}

// ---------------------------------------------------------------------
// Breakfast eligibility -- a real content judgment, not a nutrient
// computation, so it's a verified, named list rather than a live
// heuristic. Builder type alone is NOT a reliable signal here (confirmed
// directly: the 300-recipe corpus's own real breakfast dishes, yogurt
// bowls, overnight oats, chia pudding, warm porridge, egg/tofu scrambles,
// breakfast burritos, overwhelmingly sit under the 'snack' builder type,
// this app's own generic single-serving builder, not a dedicated
// breakfast type -- a plain builder-type filter would have missed nearly
// all of them). Found via a direct SQL keyword search against every
// curated recipe's own real name (egg, oat, yogurt, porridge, scramble,
// chia pudding, breakfast, and so on, checked for word-boundary false
// positives like "eggplant"), then individually reviewed by title before
// being written here -- all 48 confirmed to exist as a real
// linkedCuratedRecipeId in lib/digest/recipes.ts before shipping.
// Deliberately excludes the one chia-pudding recipe classified under the
// 'dessert' builder type (curated_dessert_mixed_berry_chia_pudding) --
// the only chia pudding of its kind not also tagged as a snack/breakfast
// item, treated as a real, deliberate "this one is a dessert" signal
// rather than folded in with the rest.
export const BREAKFAST_ELIGIBLE_RECIPE_IDS = new Set<string>([
  'curated_baked_oatmeal_cup_banana_cinnamon',
  'curated_vegan_baked_oatmeal_cup_banana_cinnamon',
  'curated_baked_banana_oat_cookies',
  'curated_handheld_breakfast_burrito_eggs_black_beans',
  'curated_vegan_breakfast_burrito_tofu_black_beans',
  'curated_snack_apricot_cashew_yogurt_bowl',
  'curated_snack_apricot_coconut_overnight_oats',
  'curated_vegan_apricot_coconut_overnight_oats',
  'curated_snack_berries_yogurt',
  'curated_snack_blackberry_almond_yogurt_bowl',
  'curated_snack_buckwheat_porridge_blueberries_walnuts',
  'curated_vegan_buckwheat_porridge_blueberries_walnuts',
  'curated_snack_clementine_almond_yogurt_bowl',
  'curated_snack_clementine_pistachio_yogurt_bowl',
  'curated_snack_date_cashew_breakfast_bowl',
  'curated_snack_date_walnut_breakfast_bowl',
  'curated_snack_fig_cashew_overnight_oats',
  'curated_vegan_fig_cashew_overnight_oats',
  'curated_snack_fig_pistachio_overnight_oats',
  'curated_vegan_fig_pistachio_overnight_oats',
  'curated_snack_fig_walnut_yogurt_bowl',
  'curated_snack_grapefruit_yogurt_honey',
  'curated_snack_grapefruit_pistachio_yogurt_bowl',
  'curated_snack_kiwi_coconut_chia_pudding',
  'curated_vegan_kiwi_coconut_chia_pudding',
  'curated_snack_kiwi_pistachio_yogurt_bowl',
  'curated_snack_mango_coconut_chia_pudding',
  'curated_vegan_mango_coconut_chia_pudding',
  'curated_snack_mango_pistachio_chia_pudding',
  'curated_vegan_mango_pistachio_chia_pudding',
  'curated_snack_nectarine_chia_pudding_cashews',
  'curated_vegan_nectarine_chia_pudding_cashews',
  'curated_snack_overnight_oats_chia_berries',
  'curated_vegan_overnight_oats_chia_berries',
  'curated_snack_papaya_lime_yogurt_bowl',
  'curated_snack_peach_almond_overnight_oats',
  'curated_vegan_peach_almond_overnight_oats',
  'curated_snack_pear_almond_yogurt_bowl',
  'curated_snack_pear_walnut_yogurt_bowl',
  'curated_snack_plum_walnut_overnight_oats',
  'curated_vegan_plum_walnut_overnight_oats',
  'curated_snack_savory_quinoa_bowl_fried_egg',
  'curated_vegan_savory_quinoa_bowl_tofu_scramble',
  'curated_vegan_tofu_scramble_potatoes',
  'curated_snack_veggie_cheddar_scramble_potatoes',
  'curated_snack_millet_porridge_apricots',
  'curated_vegan_millet_porridge_apricots',
  'curated_snack_watermelon_feta_bowl',
]);

// ---------------------------------------------------------------------
// Carb-level thresholds -- real, cited numbers, not invented ones.
// "No Carbs" uses the same very-low-carbohydrate/ketogenic range this
// app's own Popular Diets comparison entry already cites directly from
// StatPearls (NBK499830): "carbohydrate restriction below roughly 20 to
// 50 grams... serves as the primary trigger for ketosis." "Low Carb"
// uses the commonly-cited low-carbohydrate-diet threshold from a 2023
// scoping review of the clinical literature (Tandfonline, "Defining
// 'low-carb' in the scientific literature"): under 130g/day, roughly
// under 26% of energy. Both apply to the WHOLE day's total, not any one
// meal alone.
export const NO_CARB_MAX_GRAMS_PER_DAY = 50;
export const LOW_CARB_MAX_GRAMS_PER_DAY = 130;

export type CarbLevel = 'any' | 'low' | 'noCarb';

function carbCeilingForLevel(level: CarbLevel): number | null {
  if (level === 'noCarb') return NO_CARB_MAX_GRAMS_PER_DAY;
  if (level === 'low') return LOW_CARB_MAX_GRAMS_PER_DAY;
  return null;
}

// ---------------------------------------------------------------------
// Frequency rules -- 2026-08-25, direct request: "we need to also follow
// specific timing for how often things should be eaten, such as fish
// twice a week." Two real, cited rules, deliberately not a longer
// invented list: fish/seafood at least twice a week (the American Heart
// Association's own 2018 science advisory, real trial-and-cohort
// evidence behind a specific number) and red meat at most 3 times a
// week (the World Cancer Research Fund's standing guideline, with a
// real 2024 paper questioning how strong the evidence for that exact
// threshold actually is, named honestly here rather than presented as
// settled). Both apply per calendar week (days 1-7, 8-14, and so on
// within a generated range), the natural unit "twice a week" already
// means.
//
// Base-name lists verified the same way BREAKFAST_ELIGIBLE_RECIPE_IDS
// was: every one of the 24 real, distinct 'Meat'-category base_names
// actually used anywhere across all 300 curated recipes was pulled by
// direct query and classified by hand, not guessed. The reference
// database's own `foods.subcategory` column was checked first and
// rejected for this: real salmon rows carry subcategory 'Meat &
// Poultry', not 'Fish & Seafood', a genuine, confirmed data-quality
// inconsistency that would have silently missed this app's own most
// commonly used fish.
const FISH_SEAFOOD_BASE_NAMES = [
  'Cod Fish',
  'Crab Crustaceans',
  'Halibut Fish (Raw)',
  'Mackerel Fish',
  'Mussel Mollusks',
  'Salmon Fillet (Raw)',
  'Sardine Fish',
  'Scallop Mollusks',
  'Shrimp Crustaceans',
  'Sole fillet',
  'Trout Fish',
  'Tuna Fish',
];

// WCRF's own definition of red meat -- "all types of muscle meat from a
// mammal: beef, veal, pork, lamb, mutton, horse, and goat" -- checked
// directly against this app's own real 24-item ingredient list, not
// assumed. Poultry (chicken, turkey, duck) is excluded, matching that
// same definition.
const RED_MEAT_BASE_NAMES = [
  'Beef Top Sirloin (Raw)',
  'Bison Top Sirloin (Raw)',
  'Lamb Chop (Raw)',
  'Lamb Fillet (Raw)',
  'Pork Chop (Raw)',
  'Pork Fillet / Tenderloin (Raw)',
  'Pork Loin (Raw)',
];

export type FrequencyRule = {
  id: string;
  label: string;
  kind: 'atLeast' | 'atMost';
  timesPerWeek: number;
  citation: string;
  matches: (curatedRecipeId: string) => Promise<boolean>;
};

export const FREQUENCY_RULES: FrequencyRule[] = [
  {
    id: 'fish-seafood',
    label: 'Fish & seafood',
    kind: 'atLeast',
    timesPerWeek: 2,
    citation:
      'Seafood Long-Chain n-3 Polyunsaturated Fatty Acids and Cardiovascular Disease: A Science Advisory From the American Heart Association, Rimm et al., Circulation 2018, PMID 29773586 -- two servings of non-fried fish a week, preferably oily fish.',
    matches: (curatedRecipeId) => curatedRecipeContainsAnyIngredient(curatedRecipeId, 'Meat', FISH_SEAFOOD_BASE_NAMES),
  },
  {
    id: 'red-meat',
    label: 'Red meat',
    kind: 'atMost',
    timesPerWeek: 3,
    citation:
      'Limit red and processed meat, World Cancer Research Fund -- no more than roughly 3 servings (350-500g cooked weight) a week. A 2024 paper (PMID 38492553) questions how strong the evidence for this specific threshold actually is, named honestly rather than presented as settled.',
    matches: (curatedRecipeId) => curatedRecipeContainsAnyIngredient(curatedRecipeId, 'Meat', RED_MEAT_BASE_NAMES),
  },
];

// ---------------------------------------------------------------------
// Condition safety -- the same real severity data "Meals You Can Eat"
// already computes (RecipeCard.safeForConditions/conditionCautions),
// read directly here rather than through purple-digest.tsx (a screen
// file, not something a lib module should import from). An absent
// result for a declared condition (no safeForConditions entry, no
// conditionCautions entry) means either an absolute exclusion (Celiac +
// High-Risk Gluten, the one real case in this app) or a recipe this
// condition's own scoring never actually covers -- either way, treated
// as unsafe here rather than assumed clean, since a generator actively
// recommending a meal is a stronger claim than passively listing it.
function conditionTierForEntry(entry: AnyDigestEntry, conditionCode: string): 'green' | 'yellow' | 'red' | null {
  if (isProblemFoodEntry(entry) || !entry.recipeCard) return null;
  if (entry.recipeCard.safeForConditions?.includes(conditionCode)) return 'green';
  return entry.recipeCard.conditionCautions?.[conditionCode]?.severity ?? null;
}

// A recipe never gets actively recommended by the generator with a real
// red-severity flag for any declared condition, matching the same
// "actively recommending is a stronger claim than passively listing"
// reasoning above -- red-tier recipes still show in "Meals You Can Eat"
// itself, just never picked here. Returns the worst real tier actually
// found (green if every declared condition is clean, yellow if at least
// one carries a real, milder caution), or null if genuinely unsafe for
// at least one declared condition.
function recipeSafeAcrossConditions(entry: AnyDigestEntry, conditionCodes: string[]): 'green' | 'yellow' | null {
  let worst: 'green' | 'yellow' = 'green';
  for (const code of conditionCodes) {
    const tier = conditionTierForEntry(entry, code);
    if (tier === null || tier === 'red') return null;
    if (tier === 'yellow') worst = 'yellow';
  }
  return worst;
}

// ---------------------------------------------------------------------
// The generated plan's own shape.
// ---------------------------------------------------------------------
export type DailyMealPlanPick = {
  entry: EligibleRecipeEntry;
  role: 'main' | 'side';
  carbGrams: number;
};

export type DailyMealPlanNutrientCoverage = {
  nutrientCode: string;
  displayName: string;
  unit: string;
  amount: number;
  targetAmount: number | null;
  percentOfTarget: number | null;
};

export type DailyMealPlanResult = {
  breakfast: DailyMealPlanPick | null;
  lunch: DailyMealPlanPick[];
  dinner: DailyMealPlanPick[];
  // The worst real condition-safety tier across every pick in the whole
  // day, matching the confirmed design: the same green/yellow/red system
  // "Meals You Can Eat" already uses, not a new, separate rating scale.
  // Null only when nothing could be generated at all.
  healthRating: 'green' | 'yellow' | 'red' | null;
  nutrientTotals: Record<string, number>;
  nutrientCoverage: DailyMealPlanNutrientCoverage[];
  totalCarbGrams: number;
  carbCeiling: number | null;
  // Honest, plain-language notes about anything the generator couldn't
  // fully satisfy (no compliant breakfast found, couldn't stay under the
  // carb ceiling, and so on) -- surfaced directly rather than silently
  // returning a plan that quietly falls short of what was asked for.
  warnings: string[];
};

// A modest calorie floor below which a lunch or dinner main is paired
// with a real Side automatically -- "along with sides if necessary," a
// judgment call for what "necessary" means, named directly rather than
// left implicit: a main dish alone under roughly 400 kcal reads as
// light enough to reasonably want a side alongside it.
const PAIR_WITH_SIDE_BELOW_KCAL = 400;

function pickRandom<T>(items: T[]): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(Math.random() * items.length)];
}

// When a carb ceiling applies, bias selection toward the lower-carb half
// of a candidate pool rather than picking uniformly at random -- a
// simple, honest bias, not a full optimizer solving for the tightest
// possible day-total across every combination, which would be a much
// larger undertaking than this generator's own real scope.
function pickWithCarbBias<T extends { carbGrams: number }>(candidates: T[], carbCeiling: number | null): T | undefined {
  if (candidates.length === 0) return undefined;
  if (carbCeiling === null) return pickRandom(candidates);
  const sorted = [...candidates].sort((a, b) => a.carbGrams - b.carbGrams);
  const lowerHalf = sorted.slice(0, Math.max(1, Math.ceil(sorted.length / 2)));
  return pickRandom(lowerHalf);
}

type LoadedCandidate = {
  entry: EligibleRecipeEntry;
  carbGrams: number;
  kcal: number;
  hasSweetener: boolean;
  matchedRuleIds: Set<string>;
};

async function loadCandidate(entry: EligibleRecipeEntry): Promise<LoadedCandidate | null> {
  const totals = await getCuratedRecipeNutrientTotals(entry.linkedCuratedRecipeId);
  if (!totals) return null;
  const [hasSweetener, ruleMatches] = await Promise.all([
    curatedRecipeContainsSweetenerIngredient(entry.linkedCuratedRecipeId),
    Promise.all(FREQUENCY_RULES.map((rule) => rule.matches(entry.linkedCuratedRecipeId).then((matched) => (matched ? rule.id : null)))),
  ]);
  return {
    entry,
    carbGrams: totals.carbohydrate ?? 0,
    kcal: totals.energy_kcal ?? 0,
    hasSweetener,
    matchedRuleIds: new Set(ruleMatches.filter((id): id is string => id !== null)),
  };
}

// 2026-08-25, real rotation across a multi-day generation run --
// direct request: "we are also trying to provide a real rotation of
// food randomly but also so they don't eat the same thing." usageCount
// tracks how many times each curated recipe has already been picked
// this run; picking always prefers whatever's been used the FEWEST
// times so far, the same "deal from a shuffled deck, don't reshuffle
// until every card's been dealt once" rotation a real weekly menu
// follows, rather than independent random picks each day that could
// easily repeat the same breakfast three days running. weekFrequency
// tracks FREQUENCY_RULES progress (fish, red meat) for the CURRENT
// 7-day week only, reset at the start of each new week.
type RotationState = {
  usageCount: Map<string, number>;
  weekFrequency: Map<string, number>;
};

function newRotationState(): RotationState {
  return { usageCount: new Map(), weekFrequency: new Map() };
}

function recordUsage(state: RotationState, candidate: LoadedCandidate) {
  const id = candidate.entry.linkedCuratedRecipeId;
  state.usageCount.set(id, (state.usageCount.get(id) ?? 0) + 1);
  for (const ruleId of candidate.matchedRuleIds) {
    state.weekFrequency.set(ruleId, (state.weekFrequency.get(ruleId) ?? 0) + 1);
  }
}

// Narrows a candidate pool by FREQUENCY_RULES before the ordinary
// rotation/carb pick runs, scoped to whichever meal slot is calling it
// (only ever lunch/dinner mains -- breakfast and sides are excluded on
// purpose, fish and red meat aren't realistic candidates in either
// pool in this corpus). Two real effects, matching each rule's own
// kind: an 'atMost' rule (red meat) hard-excludes anything that would
// push the week over its cap; an 'atLeast' rule (fish) forces a
// matching pick once the days remaining in the week no longer leave
// room to skip one and still hit the target. Always fails open (never
// returns an empty pool) -- a frequency target is worth nudging toward,
// not worth serving nothing over.
function applyFrequencyRules(candidates: LoadedCandidate[], state: RotationState, daysRemainingInWeekIncludingToday: number): LoadedCandidate[] {
  let pool = candidates.filter((c) => {
    for (const rule of FREQUENCY_RULES) {
      if (rule.kind !== 'atMost' || !c.matchedRuleIds.has(rule.id)) continue;
      if ((state.weekFrequency.get(rule.id) ?? 0) >= rule.timesPerWeek) return false;
    }
    return true;
  });
  if (pool.length === 0) pool = candidates;

  for (const rule of FREQUENCY_RULES) {
    if (rule.kind !== 'atLeast') continue;
    const needed = rule.timesPerWeek - (state.weekFrequency.get(rule.id) ?? 0);
    if (needed <= 0 || needed < daysRemainingInWeekIncludingToday) continue;
    const forced = pool.filter((c) => c.matchedRuleIds.has(rule.id));
    if (forced.length > 0) pool = forced;
  }
  return pool;
}

// The one real selection function every meal slot ultimately goes
// through: frequency rules narrow the pool first (when rotation state
// and a days-remaining count are given -- single-day generation passes
// neither, leaving every candidate eligible, exactly its original
// behavior), then rotation prefers whatever's been used least so far,
// then the existing carb bias picks among whatever's left.
function pickCandidate(
  candidates: LoadedCandidate[],
  carbCeiling: number | null,
  rotation?: { state: RotationState; daysRemainingInWeekIncludingToday: number; applyFrequency: boolean },
): LoadedCandidate | undefined {
  if (candidates.length === 0) return undefined;
  let pool = rotation?.applyFrequency ? applyFrequencyRules(candidates, rotation.state, rotation.daysRemainingInWeekIncludingToday) : candidates;
  if (rotation) {
    const minUsage = Math.min(...pool.map((c) => rotation.state.usageCount.get(c.entry.linkedCuratedRecipeId) ?? 0));
    pool = pool.filter((c) => (rotation.state.usageCount.get(c.entry.linkedCuratedRecipeId) ?? 0) === minUsage);
  }
  return pickWithCarbBias(pool, carbCeiling);
}

type CandidatePools = {
  breakfastCandidates: LoadedCandidate[];
  lunchMainCandidates: LoadedCandidate[];
  dinnerMainCandidates: LoadedCandidate[];
  sideCandidates: LoadedCandidate[];
};

// The same real cross-filter "Meals You Can Eat" already applies:
// genuinely safe (green or yellow, never a real red flag) for every
// declared condition at once, compliant with every declared diet
// preference at once. Built once and reused across every day of a
// multi-day run -- 2026-08-25, this used to be recomputed fresh inside
// generateDailyMealPlan every single call; now shared so generating a
// 42-day range resolves each real candidate's nutrient totals/sweetener/
// frequency-rule data exactly once, not once per day it's considered on.
async function buildCandidatePools(conditionCodes: string[], dietPreferences: RecipeDietTag[]): Promise<CandidatePools> {
  const pool = getEntriesForCategory('recipes').filter(isEligibleRecipeEntry).filter((entry) => {
    if (recipeSafeAcrossConditions(entry, conditionCodes) === null) return false;
    if (!recipeMatchesAllDietPreferences(entry, dietPreferences)) return false;
    return true;
  });

  const breakfastPoolEntries = pool.filter((entry) => BREAKFAST_ELIGIBLE_RECIPE_IDS.has(entry.linkedCuratedRecipeId));
  const lunchMainTypes = new Set(['side', 'salad', 'soup', 'handheld', 'smoothie']);
  const dinnerMainTypes = new Set(['side', 'salad', 'soup', 'handheld']);
  const lunchMainPoolEntries = pool.filter((entry) => lunchMainTypes.has(entry.linkedBuilderType));
  const dinnerMainPoolEntries = pool.filter((entry) => dinnerMainTypes.has(entry.linkedBuilderType));
  const sidePoolEntries = pool.filter((entry) => entry.linkedBuilderType === 'side');

  async function loadAll(entries: EligibleRecipeEntry[]) {
    const loaded = await Promise.all(entries.map(loadCandidate));
    return loaded.filter((c): c is LoadedCandidate => c !== null);
  }

  const [breakfastCandidates, lunchMainCandidates, dinnerMainCandidates, sideCandidates] = await Promise.all([
    loadAll(breakfastPoolEntries),
    loadAll(lunchMainPoolEntries),
    loadAll(dinnerMainPoolEntries),
    loadAll(sidePoolEntries),
  ]);
  return { breakfastCandidates, lunchMainCandidates, dinnerMainCandidates, sideCandidates };
}

// Generates one real day from already-loaded candidate pools. rotation
// is undefined for a plain single-day request (every candidate stays
// eligible, no frequency-rule narrowing, no cross-day memory -- the
// exact original single-day behavior); a multi-day run passes real
// state through and records what it picked before moving to the next
// day (see generateMealPlanDays below).
async function generateOneDay(
  pools: CandidatePools,
  conditionCodes: string[],
  carbLevel: CarbLevel,
  rotation?: { state: RotationState; daysRemainingInWeekIncludingToday: number },
): Promise<DailyMealPlanResult> {
  const carbCeiling = carbCeilingForLevel(carbLevel);
  const warnings: string[] = [];
  const { breakfastCandidates, lunchMainCandidates, dinnerMainCandidates, sideCandidates } = pools;

  let totalCarbGrams = 0;
  const nutrientTotals: Record<string, number> = {};
  function addPick(totals: Record<string, number>) {
    for (const [code, amount] of Object.entries(totals)) {
      nutrientTotals[code] = (nutrientTotals[code] ?? 0) + amount;
    }
  }
  function recordIfRotating(candidate: LoadedCandidate) {
    if (rotation) recordUsage(rotation.state, candidate);
  }

  // Breakfast: real candidates only, then the direct "no sugar" rule --
  // never a candidate with an actual sweetener ingredient added,
  // regardless of carb level (this rule is a standing meal-slot rule,
  // not tied to the carb choice at all). Smoothies are already excluded
  // from breakfastPoolEntries entirely (BREAKFAST_ELIGIBLE_RECIPE_IDS
  // contains no smoothie builder-type ids), matching the direct
  // instruction that smoothies belong at lunch now, not breakfast.
  // Rotation applies here too (real day-to-day variety), frequency
  // rules never do (fish/red meat aren't realistic breakfast picks in
  // this corpus).
  const noSugarBreakfastCandidates = breakfastCandidates.filter((c) => !c.hasSweetener);
  let breakfast: DailyMealPlanPick | null = null;
  {
    const withinBudget = carbCeiling === null ? noSugarBreakfastCandidates : noSugarBreakfastCandidates.filter((c) => c.carbGrams <= carbCeiling);
    const rotationArg = rotation ? { state: rotation.state, daysRemainingInWeekIncludingToday: rotation.daysRemainingInWeekIncludingToday, applyFrequency: false } : undefined;
    const chosen = pickCandidate(withinBudget.length > 0 ? withinBudget : noSugarBreakfastCandidates, carbCeiling, rotationArg);
    if (chosen) {
      breakfast = { entry: chosen.entry, role: 'main', carbGrams: chosen.carbGrams };
      totalCarbGrams += chosen.carbGrams;
      const totals = await getCuratedRecipeNutrientTotals(chosen.entry.linkedCuratedRecipeId);
      if (totals) addPick(totals);
      recordIfRotating(chosen);
      if (withinBudget.length === 0 && carbCeiling !== null) {
        warnings.push(`No sugar-free breakfast option stayed under the ${carbCeiling}g daily carb ceiling on its own; the closest option was used instead.`);
      }
    } else {
      warnings.push('No breakfast recipe currently complies with both the declared condition(s) and diet preference(s).');
    }
  }

  // Lunch/dinner: a main, plus a side when the main alone reads light,
  // staying under whatever carb budget remains for the day. Rotation
  // and FREQUENCY_RULES both apply to the main pick only -- sides in
  // this corpus are overwhelmingly vegetable-based, not realistic fish/
  // red-meat candidates, and still get real day-to-day rotation of
  // their own via the same pickCandidate call.
  async function pickMealWithOptionalSide(mainCandidates: LoadedCandidate[], excludeId: string | undefined, applyFrequency: boolean): Promise<DailyMealPlanPick[]> {
    const remainingBudget = carbCeiling === null ? null : Math.max(0, carbCeiling - totalCarbGrams);
    const eligible = mainCandidates.filter((c) => c.entry.linkedCuratedRecipeId !== excludeId);
    const withinBudget = remainingBudget === null ? eligible : eligible.filter((c) => c.carbGrams <= remainingBudget);
    const mainRotationArg = rotation ? { state: rotation.state, daysRemainingInWeekIncludingToday: rotation.daysRemainingInWeekIncludingToday, applyFrequency } : undefined;
    const chosen = pickCandidate(withinBudget.length > 0 ? withinBudget : eligible, remainingBudget, mainRotationArg);
    if (!chosen) return [];
    const picks: DailyMealPlanPick[] = [{ entry: chosen.entry, role: 'main', carbGrams: chosen.carbGrams }];
    totalCarbGrams += chosen.carbGrams;
    const mainTotals = await getCuratedRecipeNutrientTotals(chosen.entry.linkedCuratedRecipeId);
    if (mainTotals) addPick(mainTotals);
    recordIfRotating(chosen);

    if (chosen.kcal < PAIR_WITH_SIDE_BELOW_KCAL) {
      const sideBudget = carbCeiling === null ? null : Math.max(0, carbCeiling - totalCarbGrams);
      const sideEligible = sideCandidates.filter((c) => c.entry.linkedCuratedRecipeId !== chosen.entry.linkedCuratedRecipeId);
      const sideWithinBudget = sideBudget === null ? sideEligible : sideEligible.filter((c) => c.carbGrams <= sideBudget);
      const sideRotationArg = rotation ? { state: rotation.state, daysRemainingInWeekIncludingToday: rotation.daysRemainingInWeekIncludingToday, applyFrequency: false } : undefined;
      const chosenSide = pickCandidate(sideWithinBudget, sideBudget, sideRotationArg);
      if (chosenSide) {
        picks.push({ entry: chosenSide.entry, role: 'side', carbGrams: chosenSide.carbGrams });
        totalCarbGrams += chosenSide.carbGrams;
        const sideTotals = await getCuratedRecipeNutrientTotals(chosenSide.entry.linkedCuratedRecipeId);
        if (sideTotals) addPick(sideTotals);
        recordIfRotating(chosenSide);
      }
    }
    return picks;
  }

  const lunch = await pickMealWithOptionalSide(lunchMainCandidates, undefined, true);
  if (lunch.length === 0) warnings.push('No lunch recipe currently complies with both the declared condition(s) and diet preference(s).');

  const dinner = await pickMealWithOptionalSide(dinnerMainCandidates, lunch[0]?.entry.linkedCuratedRecipeId, true);
  if (dinner.length === 0) warnings.push('No dinner recipe currently complies with both the declared condition(s) and diet preference(s).');

  if (carbCeiling !== null && totalCarbGrams > carbCeiling) {
    warnings.push(`The day's total (${Math.round(totalCarbGrams)}g) came in above the ${carbCeiling}g target; not every meal slot had a low-enough-carb option available today.`);
  }

  // The day's own health rating: green only while every real pick is
  // clean for every declared condition, yellow the moment any pick
  // carries a real, milder caution for one of them. Red is structurally
  // impossible here -- recipeSafeAcrossConditions never returns 'red',
  // and a recipe that would have earned one was already excluded from
  // the whole pool upstream, matching the confirmed design: the
  // generator only ever actively recommends what "Meals You Can Eat"
  // itself would show as safe or cautioned, never a real red flag.
  const allPicks = [breakfast, ...lunch, ...dinner].filter((p): p is DailyMealPlanPick => p !== null);
  const healthRating: 'green' | 'yellow' | 'red' | null =
    allPicks.length === 0 ? null : allPicks.every((p) => recipeSafeAcrossConditions(p.entry, conditionCodes) === 'green') ? 'green' : 'yellow';

  // Real nutrient-coverage figures against the person's own actual DRI
  // targets, informational rather than a second rating -- the confirmed
  // design keeps the health rating itself to the existing green/yellow/
  // red condition-safety system, but "using the RDA of nutrients" still
  // deserves a real, visible answer, not just a silent input to
  // selection.
  const driRows = await getDietaryReferenceIntakesForCurrentUser();
  const nutrientCoverage: DailyMealPlanNutrientCoverage[] = driRows
    .filter((row) => row.valueType === 'RDA' || row.valueType === 'AI')
    .map((row) => {
      const amount = nutrientTotals[row.nutrientCode] ?? 0;
      return {
        nutrientCode: row.nutrientCode,
        displayName: row.displayName,
        unit: row.unit,
        amount,
        targetAmount: row.amount,
        percentOfTarget: row.amount > 0 ? Math.round((amount / row.amount) * 100) : null,
      };
    });

  return {
    breakfast,
    lunch,
    dinner,
    healthRating,
    nutrientTotals,
    nutrientCoverage,
    totalCarbGrams,
    carbCeiling,
    warnings,
  };
}

export async function generateDailyMealPlan(options: {
  conditionCodes: string[];
  dietPreferences: RecipeDietTag[];
  carbLevel: CarbLevel;
}): Promise<DailyMealPlanResult> {
  const pools = await buildCandidatePools(options.conditionCodes, options.dietPreferences);
  return generateOneDay(pools, options.conditionCodes, options.carbLevel);
}

// 2026-08-25, direct request: "it all needs to be wired to the 6 week,
// or really however many weeks up to 6, of days worth of meals... a
// real rotation of food randomly but also so they don't eat the same
// thing," plus "specific timing for how often things should be eaten,
// such as fish twice a week." The multi-day generator: candidate pools
// are resolved once (buildCandidatePools), then generateOneDay runs
// once per day with one shared RotationState threaded through, so
// picking never forgets what already happened earlier in the same run.
// Real rotation: every meal slot's own pickCandidate call always
// prefers whatever curated recipe has been used the fewest times so
// far this run, only repeating once every real option in that pool has
// already been used at least once. Real frequency targets: lunch and
// dinner mains are the only slots FREQUENCY_RULES narrow, reset at the
// start of each new 7-day week (days 1-7, 8-14, and so on within
// whatever range is requested).
//
// days is capped at 42 (6 weeks), matching the existing 6-Week Meal
// Plan's own real ceiling -- "however many weeks up to 6" is a real,
// user-facing choice (1 to 42 days), not a hardcoded 42.
export async function generateMealPlanDays(options: {
  conditionCodes: string[];
  dietPreferences: RecipeDietTag[];
  carbLevel: CarbLevel;
  days: number;
}): Promise<DailyMealPlanResult[]> {
  const days = Math.max(1, Math.min(42, Math.round(options.days)));
  const pools = await buildCandidatePools(options.conditionCodes, options.dietPreferences);
  const rotationState = newRotationState();
  const results: DailyMealPlanResult[] = [];
  for (let dayIndex = 0; dayIndex < days; dayIndex++) {
    const dayOfWeek = dayIndex % 7;
    if (dayOfWeek === 0) rotationState.weekFrequency.clear();
    const daysRemainingInWeekIncludingToday = 7 - dayOfWeek;
    const result = await generateOneDay(pools, options.conditionCodes, options.carbLevel, {
      state: rotationState,
      daysRemainingInWeekIncludingToday,
    });
    results.push(result);
  }
  return results;
}

// 2026-08-25, real scheduling for a generated day: converts a
// DailyMealPlanResult into the exact same MealPlanSlot/MealPlanDay shape
// the existing 6-Week Meal Plan already uses (lib/db.ts's own
// scheduleMealPlanSlot/addMealPlanDayToSchedule), so "add this to my
// schedule" reuses that already-built, already-working machinery
// directly rather than a second, parallel scheduling path. Returns null
// when the day isn't complete enough to schedule (no breakfast, or no
// main for lunch/dinner) -- the UI should check for this and explain
// why, not silently attempt a broken schedule.
export function dailyMealPlanToMealPlanDay(result: DailyMealPlanResult, dayNumber: number): MealPlanDay | null {
  if (!result.breakfast || result.lunch.length === 0 || result.dinner.length === 0) return null;
  function toSlot(main: DailyMealPlanPick, side?: DailyMealPlanPick): MealPlanSlot {
    return {
      main: { builderType: main.entry.linkedBuilderType, curatedRecipeId: main.entry.linkedCuratedRecipeId },
      side: side ? { builderType: side.entry.linkedBuilderType, curatedRecipeId: side.entry.linkedCuratedRecipeId } : undefined,
    };
  }
  return {
    day: dayNumber,
    breakfast: toSlot(result.breakfast),
    lunch: toSlot(result.lunch[0], result.lunch[1]),
    dinner: toSlot(result.dinner[0], result.dinner[1]),
  };
}
