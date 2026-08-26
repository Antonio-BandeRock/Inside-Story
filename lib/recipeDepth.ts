// Live, on-device version of the same real depth every curated recipe
// carries (safeForConditions, conditionCautions, dietTags, stage-advisory
// notes) -- 2026-08-25, direct instruction after being asked whether the
// Food builders wire into all of this the same way curated recipes do
// (they didn't): "The builders all absolutely must match the depth as is
// provided to the recipes, and it should happen every time the user
// creates anything." Piloted on Side Builder first, per direct follow-up:
// "Pilot it on Side Builder first, choice to create the report or not but
// both paths route to saving it" -- the computation below always runs
// either way; what's optional is only whether the person actually looks
// at a report of it before saving (see components/RecipeDepthReport.tsx).
//
// This is orchestration over already-real, already-live primitives, not
// new scoring logic: getFoodScoresForCondition/getFoodScores (this file's
// own already-established condition-aware queries), isFlaggedTier/
// tierSeverity (lib/sixDimensionsReference.ts, the same tier vocabulary
// every dimension scorecard in this app already uses), and
// getConditionStageAdvisory (lib/conditionStageAdvisory.ts, the same
// per-ingredient dispatcher every Food builder's live preview already
// calls for the 6 staged conditions). The one real exception: the tier-
// caution wording and diet-tag rule constants below are a second,
// faithful copy of scripts/compute_recipe_condition_data.js's and
// scripts/compute_recipe_diet_tags.js's own constants, since a plain Node
// script can't import a .ts module without its own build step. A future
// change to either rule set needs updating in both places -- named
// directly here rather than hidden, matching the same accepted
// duplication this project already carries between those two scripts and
// their own real TS sources.

import { getConditionStages, getFoodScores, getFoodScoresForCondition, type MealIngredientInput } from './db';
import { getConditionStageAdvisory, type ConditionStageAdvisory } from './conditionStageAdvisory';
import { isFlaggedTier, tierSeverity, type TierSeverity } from './sixDimensionsReference';
import type { RecipeDietTag } from './digest/types';

// One real dimension's own worst severity for a condition, across this
// whole dish -- 2026-08-25, direct correction: "for Hashimoto's it should
// show how it does not cause problems or does cause them for the D1-D6."
// "D1-D6" is genuinely Hashimoto's own real 6-dimension framework, checked
// directly against the live database rather than assumed: every other
// tracked condition has its own, differently-named real dimension set (2
// to 5 real dimensions, not 6, and never called "D1-D6") -- see
// computeDimensionBreakdown's own comment for the full reasoning, this
// type is deliberately generic across whichever real dimension labels a
// given condition actually owns.
export type DimensionSeverity = { dimension: string; severity: TierSeverity };

export type RecipeDepthResult = {
  safeForConditions: string[];
  conditionCautions: Record<string, { severity: 'yellow' | 'red'; note: string }>;
  dietTags: RecipeDietTag[];
  stageNotes: ConditionStageAdvisory[];
  // conditionCode -> that condition's own real dimensions, each with this
  // dish's worst severity across every ingredient -- the data a per-
  // condition dimension chart (RecipeDepthReport's own DimensionRadar)
  // actually plots.
  dimensionBreakdown: Record<string, DimensionSeverity[]>;
};

// ---------------------------------------------------------------------
// Condition safety + cautions -- faithful port of the real logic in
// scripts/compute_recipe_condition_data.js (see that file's own header
// comment for the full reasoning behind severity tiers, near-universal
// exclusions, and absolute exclusions).

// Two sub-criteria that fire on roughly half of all 26,000+ foods in this
// database (a background signal, not a real per-dish concern) -- excluded
// from recipe-level cautions the same way the curated-recipe compute
// script already excludes them.
const NEAR_UNIVERSAL_SUB_CRITERIA = new Set(['Selenium & Zn synergy', 'Iron Presence']);

// Deliberately a short, named list: a condition where a flagged tier
// means "never actually safe," not "a matter of degree." Celiac's own
// relationship to gluten is the one real, established case today -- see
// compute_recipe_condition_data.js's own comment for why this app's other
// gluten/dairy flags (Hashimoto's included) stay ordinary cautions
// instead.
const ABSOLUTE_EXCLUSIONS: { conditionCode: string; subCriterion: string; tier: string }[] = [
  { conditionCode: 'celiac', subCriterion: 'Gluten', tier: 'High Risk' },
];

function isAbsoluteExclusion(conditionCode: string, subCriterion: string, tier: string): boolean {
  return ABSOLUTE_EXCLUSIONS.some(
    (exclusion) =>
      exclusion.conditionCode === conditionCode && exclusion.subCriterion === subCriterion && exclusion.tier === tier,
  );
}

const TIER_CAUTION_EXPLANATIONS: Record<string, string> = {
  Goitrogenic: 'Goitrogens can interfere with thyroid iodine uptake; cooking substantially reduces this for most foods.',
  'Use Carefully': 'This may need portion awareness or a doctor’s guidance.',
  'Excess Risk': 'Eating a lot of this could push the level above a healthy range.',
  'Mild Risk': 'A modest, generally minor concern.',
  'High Risk': 'A significant, well-documented concern.',
  Disruptive: 'This may work against or interfere with the process being measured.',
  High: 'A meaningfully high level for this measure.',
  'Very High': 'The highest tier used for this measure.',
  Inhibiting: 'This may reduce or block the process being measured.',
  Imbalanced: 'The ratio being measured skews unfavorably here.',
  Present: 'A measurable amount is present.',
  Moderate: 'A moderate level for this measure.',
  Natural: 'A naturally occurring form, treated differently from an industrially produced one.',
};

const TIER_CAUTION_QUALIFIERS: { pattern: RegExp; phrase: string }[] = [
  { pattern: /\(Raw\)/i, phrase: ' in its raw form' },
  { pattern: /\(Cooked\)/i, phrase: ' after cooking' },
];

function buildCautionSentence(baseName: string, subCriterion: string, tier: string): string {
  const baseWord = tier.replace(/\s*\([^)]*\)\s*$/, '').trim();
  const explanation = TIER_CAUTION_EXPLANATIONS[baseWord] ?? `Rated ${tier} for this factor.`;
  const alreadyNamesForm = /\((raw|cooked)\)/i.test(baseName);
  const qualifier = alreadyNamesForm ? '' : (TIER_CAUTION_QUALIFIERS.find(({ pattern }) => pattern.test(tier))?.phrase ?? '');
  return `${baseName}: rated ${tier} for ${subCriterion.toLowerCase()}${qualifier}. ${explanation}`;
}

function isNoteworthyForRecipe(subCriterion: string, tier: string): boolean {
  if (NEAR_UNIVERSAL_SUB_CRITERIA.has(subCriterion)) return false;
  return isFlaggedTier(tier);
}

function splitFoodId(foodId: string | undefined): { foodId: number; source: string } | null {
  if (!foodId) return null;
  const [foodIdStr, source] = foodId.split('|');
  const parsed = Number(foodIdStr);
  if (!source || Number.isNaN(parsed)) return null;
  return { foodId: parsed, source };
}

// Same "worst wins" reduction Insights' own 6 Dimensions lens already uses
// (app/(tabs)/insights.tsx's own worstTierSeverity) -- a faithful, small
// duplicate rather than importing from a screen file, red beats yellow
// beats green beats unknown, so one real concern anywhere in a dimension
// is never masked by everything else in it being fine or unassessed.
const DIMENSION_SEVERITY_RANK: Record<TierSeverity, number> = { unknown: 0, green: 1, yellow: 2, red: 3 };

function worseSeverity(a: TierSeverity, b: TierSeverity): TierSeverity {
  return DIMENSION_SEVERITY_RANK[b] > DIMENSION_SEVERITY_RANK[a] ? b : a;
}

async function computeConditionSafetyAndCautions(
  ingredients: MealIngredientInput[],
  trackedConditions: { code: string; name: string }[],
): Promise<Pick<RecipeDepthResult, 'safeForConditions' | 'conditionCautions' | 'dimensionBreakdown'>> {
  const safeForConditions: string[] = [];
  const conditionCautions: RecipeDepthResult['conditionCautions'] = {};
  const dimensionBreakdown: RecipeDepthResult['dimensionBreakdown'] = {};

  const resolved = ingredients
    .map((ingredient) => {
      const split = splitFoodId(ingredient.foodId);
      return split ? { ...split, foodName: ingredient.foodName } : null;
    })
    .filter((ingredient): ingredient is { foodId: number; source: string; foodName: string } => ingredient !== null);

  for (const condition of trackedConditions) {
    type Hit = { baseName: string; subCriterion: string; tier: string; severity: 'yellow' | 'red'; excluded: boolean };
    const hits: Hit[] = [];
    // Every real dimension this condition actually scores anything under,
    // in the order first encountered -- a Map (not a plain object) so that
    // order is preserved, since a chart reads better with a stable axis
    // order than one that reshuffles between renders.
    const dimensionSeverities = new Map<string, TierSeverity>();

    for (const ingredient of resolved) {
      const scores = await getFoodScoresForCondition(ingredient.foodId, ingredient.source, condition.code);
      for (const score of scores) {
        // The dimension chart wants every real severity (green and
        // unknown included, not just flagged ones) -- excluded here only
        // for the same near-universal, background-signal sub-criteria
        // the caution logic below already excludes, so the two views of
        // this same dish never quietly disagree about what counts.
        if (!NEAR_UNIVERSAL_SUB_CRITERIA.has(score.subCriterion)) {
          const severity = tierSeverity(score.tier);
          const current = dimensionSeverities.get(score.dimension) ?? 'unknown';
          dimensionSeverities.set(score.dimension, worseSeverity(current, severity));
        }

        if (!isNoteworthyForRecipe(score.subCriterion, score.tier)) continue;
        const severity = tierSeverity(score.tier);
        if (severity !== 'yellow' && severity !== 'red') continue;
        hits.push({
          baseName: ingredient.foodName,
          subCriterion: score.subCriterion,
          tier: score.tier,
          severity,
          excluded: isAbsoluteExclusion(condition.code, score.subCriterion, score.tier),
        });
      }
    }

    dimensionBreakdown[condition.code] = Array.from(dimensionSeverities.entries()).map(([dimension, severity]) => ({
      dimension,
      severity,
    }));

    // A genuine, never-safe-at-any-dose match: invisible for this
    // condition entirely, no safeForConditions entry and no caution --
    // matching how the curated-recipe compute script treats the same
    // case (see ABSOLUTE_EXCLUSIONS' own comment above).
    if (hits.some((hit) => hit.excluded)) continue;

    if (hits.length === 0) {
      safeForConditions.push(condition.code);
      continue;
    }

    const worst = hits.find((hit) => hit.severity === 'red') ?? hits[0];
    conditionCautions[condition.code] = {
      severity: worst.severity,
      note: buildCautionSentence(worst.baseName, worst.subCriterion, worst.tier),
    };
  }

  return { safeForConditions, conditionCautions, dimensionBreakdown };
}

// ---------------------------------------------------------------------
// Stage-specific advisory notes -- reuses the already-live, already-
// shared per-ingredient dispatcher every Food builder's own live preview
// already calls (lib/conditionStageAdvisory.ts), just aggregated across a
// whole ingredient list instead of one food at a time.

async function computeStageNotes(
  ingredients: MealIngredientInput[],
  trackedConditions: { code: string; name: string }[],
): Promise<ConditionStageAdvisory[]> {
  const trackedCodes = new Set(trackedConditions.map((condition) => condition.code));
  const declaredStages = await getConditionStages();
  const relevantStages = Object.fromEntries(Object.entries(declaredStages).filter(([code]) => trackedCodes.has(code)));
  if (Object.keys(relevantStages).length === 0) return [];

  const resolved = ingredients
    .map((ingredient) => {
      const split = splitFoodId(ingredient.foodId);
      return split ? { ...split, foodName: ingredient.foodName } : null;
    })
    .filter((ingredient): ingredient is { foodId: number; source: string; foodName: string } => ingredient !== null);

  // 2026-08-25, direct report: "it listed the same warning twice... we
  // don't want to list it twice, we want to list the ingredients that
  // each match it." getConditionStageAdvisory produces the identical
  // {title, message} pair whenever two different ingredients trip the
  // exact same real advisory (its own wording is generic, never tied to
  // one specific ingredient) -- deduping by that exact pair and naming
  // every ingredient that actually matched is the real fix, not just
  // hiding the repeat.
  const notesByKey = new Map<string, { title: string; message: string; ingredientNames: string[] }>();
  for (const ingredient of resolved) {
    const scores = await getFoodScores(ingredient.foodId, ingredient.source);
    const advisory = getConditionStageAdvisory(scores, relevantStages);
    if (!advisory) continue;
    const key = `${advisory.title}|${advisory.message}`;
    const existing = notesByKey.get(key);
    if (existing) {
      existing.ingredientNames.push(ingredient.foodName);
    } else {
      notesByKey.set(key, { title: advisory.title, message: advisory.message, ingredientNames: [ingredient.foodName] });
    }
  }

  return Array.from(notesByKey.values()).map(({ title, message, ingredientNames }) => ({
    title,
    message: `${message} Matches: ${ingredientNames.join(', ')}.`,
  }));
}

// ---------------------------------------------------------------------
// Diet-compatibility tags -- faithful port of scripts/
// compute_recipe_diet_tags.js's own classifyRecipe (see that file's
// header comment for the full, auditable rule set this mirrors).
// Ingredient matching is by exact base_name, the same real column
// curated_recipe_ingredients.base_name uses -- MealIngredientInput's own
// foodName is already the raw base_name here (SideBuilder's own live
// preview builds it from ingredient.resolved.baseName, not a display
// summary string), the same convention this reuses.

const RED_MEATS = new Set([
  'Beef Top Sirloin (Raw)',
  'Bison Top Sirloin (Raw)',
  'Lamb Chop (Raw)',
  'Lamb Fillet (Raw)',
  'Pork Chop (Raw)',
  'Pork Fillet / Tenderloin (Raw)',
  'Pork Loin (Raw)',
]);

const GLUTEN_INGREDIENTS = new Set([
  'Bröd fullkorn vete råg fibrer ca 6%',
  'Tortilla, wraps/burrito, hvetemel',
  'Bulgur',
  'Couscous (durum wheat)',
  'Meat substitute containing gluten (seitan)',
  'Spelt Grains',
  'Soy sauce made from soy and wheat (shoyu)',
  'Wheat flour, white, tortilla mix, enriched',
  'Whole-Grain Wheat Flour',
]);

const PROTEIN_LEGUMES = new Set([
  'MORI-NU, Tofu, silken, firm',
  'Tofu',
  'Tempeh',
  'Black Beans',
  'Chickpea',
  'Chickpeas (garbanzo beans, bengal gram)',
  'Kidney Beans',
  'Lentil, green, hulled, dry',
  'Lentil, red, hulled, dry',
  'Lima Bean',
  'Pinto Beans',
  'White Beans',
  'Edamame',
]);

const HIGH_PROTEIN_DAIRY = new Set(['Yogurt, Greek, plain, lowfat', 'Cottage Cheese', 'Cheddar', 'Feta', 'Parmesan']);
const NIGHTSHADES = new Set(['Tomato', 'Potato', 'Eggplant', 'Red Bell Pepper', 'Yellow Bell Pepper']);
const NIGHTSHADE_SPICES = new Set(['Paprika']);
const REFINED_SUGAR = new Set(['Sugar (Cane / Granulated)']);
const COMMERCIAL_CONDIMENTS = new Set(['Dressing, mayonnaise, whole egg type']);

function hasCategory(ingredients: MealIngredientInput[], category: string): boolean {
  return ingredients.some((ingredient) => ingredient.category === category);
}
function hasIngredient(ingredients: MealIngredientInput[], category: string, baseName: string): boolean {
  return ingredients.some((ingredient) => ingredient.category === category && ingredient.foodName === baseName);
}
function hasNameMatch(ingredients: MealIngredientInput[], pattern: RegExp): boolean {
  return ingredients.some((ingredient) => pattern.test(ingredient.foodName));
}
function hasAnyFromSet(ingredients: MealIngredientInput[], names: Set<string>): boolean {
  return ingredients.some((ingredient) => names.has(ingredient.foodName));
}
function hasRedMeat(ingredients: MealIngredientInput[]): boolean {
  return ingredients.some((ingredient) => ingredient.category === 'Meat' && RED_MEATS.has(ingredient.foodName));
}

function computeDietTags(ingredients: MealIngredientInput[]): RecipeDietTag[] {
  const tags: RecipeDietTag[] = [];

  const hasMeat = hasCategory(ingredients, 'Meat');
  const hasDairy = hasCategory(ingredients, 'Dairy');
  const hasEgg = hasNameMatch(ingredients, /\begg\b/i);
  let baseTag: RecipeDietTag;
  if (hasMeat) baseTag = 'Omnivore';
  else if (hasDairy || hasEgg) baseTag = 'Vegetarian';
  else baseTag = 'Vegan';
  tags.push(baseTag);

  const onlyLighterMeat = hasMeat && !hasRedMeat(ingredients);
  if (baseTag === 'Vegan' || baseTag === 'Vegetarian' || onlyLighterMeat) {
    tags.push('Plant-Based/Flexitarian');
  }

  const hasOliveOil = hasIngredient(ingredients, 'Fats', 'Olive Oil (Extra Virgin)');
  if (hasOliveOil && !hasRedMeat(ingredients)) {
    tags.push('Mediterranean');
  }

  if (!hasAnyFromSet(ingredients, GLUTEN_INGREDIENTS)) {
    tags.push('Gluten-Free');
  }

  if (!hasDairy) {
    tags.push('Dairy-Free');
  }

  const hasGrain = hasCategory(ingredients, 'Grain');
  const hasLegume = hasCategory(ingredients, 'Legume');
  const hasBaked = hasCategory(ingredients, 'Baked');
  const hasRefinedSugar = hasAnyFromSet(ingredients, REFINED_SUGAR);
  const hasCommercialCondiment = hasAnyFromSet(ingredients, COMMERCIAL_CONDIMENTS);
  const hasGrainProduct = hasGrain || hasBaked || hasAnyFromSet(ingredients, GLUTEN_INGREDIENTS);
  const isPaleo = !hasGrainProduct && !hasLegume && !hasDairy && !hasRefinedSugar && !hasCommercialCondiment;
  if (isPaleo) tags.push('Paleo');

  if (isPaleo) {
    const hasNutSeed = hasCategory(ingredients, 'NutSeed');
    const hasNightshade = hasAnyFromSet(ingredients, NIGHTSHADES) || hasAnyFromSet(ingredients, NIGHTSHADE_SPICES);
    if (!hasEgg && !hasNutSeed && !hasNightshade) tags.push('AIP');
  }

  const hasProteinLegume = hasAnyFromSet(ingredients, PROTEIN_LEGUMES);
  const hasHighProteinDairy = hasAnyFromSet(ingredients, HIGH_PROTEIN_DAIRY);
  if (hasMeat || hasProteinLegume || hasEgg || hasHighProteinDairy) tags.push('High-Protein');

  return tags;
}

// ---------------------------------------------------------------------
// The one real entry point every Food builder should call, once ingredients
// are final and before persisting -- the computation itself is never
// optional (see this file's own header comment); a builder's own UI is
// free to show or skip a report of the result.
export async function computeRecipeDepth(
  ingredients: MealIngredientInput[],
  trackedConditions: { code: string; name: string }[],
): Promise<RecipeDepthResult> {
  const [{ safeForConditions, conditionCautions, dimensionBreakdown }, stageNotes] = await Promise.all([
    computeConditionSafetyAndCautions(ingredients, trackedConditions),
    computeStageNotes(ingredients, trackedConditions),
  ]);
  const dietTags = computeDietTags(ingredients);
  return { safeForConditions, conditionCautions, dietTags, stageNotes, dimensionBreakdown };
}
