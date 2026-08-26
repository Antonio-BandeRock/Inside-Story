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
  createIngredientResolutionCaches,
  curatedRecipeContainsAnyIngredient,
  curatedRecipeContainsSweetenerIngredient,
  getCuratedRecipeNutrientTotals,
  getDietaryReferenceIntakesForCurrentUser,
  getUserProfile,
  type DietaryReferenceIntake,
  type IngredientResolutionCaches,
  type MealPlanComponentRef,
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
// Nutrient pairing rules -- 2026-08-26, direct request: "taking into
// consideration the use of synergistic relationships and removing the
// problems of combining things that should not be combined ever."
//
// Deliberately a short, real, cited list, the same discipline
// FREQUENCY_RULES above already follows, not an invented long one. Every
// rule here checks real nutrient AMOUNTS already resolved for a
// candidate (getCuratedRecipeNutrientTotals), never ingredient identity
// or food type -- a vegan lentil dish rich in iron gets the exact same
// vitamin-C synergy bonus a lean beef dish would, and a calcium-fortified
// plant milk gets the exact same iron-antagonism check a dairy glass of
// milk would. This whole scoring layer is diet-style-agnostic by
// construction, not just in intent: it never asks what KIND of food a
// candidate is, only what it actually contains.
//
// Distinct from lib/interactionRules.ts's own nutrient-nutrient rows
// (calcium_iron_timing, calcium_zinc_timing, vitamin_a/d/e/k_dietary_fat)
// -- that system checks SUPPLEMENT dose timing against a person's actual
// schedule, a real but different question from whether two curated
// recipes' own real food-nutrient amounts, combined in the same
// generated meal, would help or hurt each other. The fat/fat-soluble-
// vitamin rule below is the same real fact already cited there, reused
// rather than re-cited a second time; the others are new to this file
// because they're about food combinations specifically, not supplement
// timing.
//
// "Meaningful source" (MEANINGFUL_SOURCE_THRESHOLD_PERCENT) reuses the
// FDA's own real nutrient-content-claim threshold (21 CFR 101.54) for
// when a single food can be labeled a "good source" of something: 10% or
// more of the daily target in one serving. A real, citable line instead
// of an invented one.
const MEANINGFUL_SOURCE_THRESHOLD_PERCENT = 10;

export type NutrientPairRule = {
  id: string;
  label: string;
  kind: 'synergy' | 'antagonism';
  nutrientA: string;
  // An array, not a single code -- the fat/fat-soluble-vitamin rule needs
  // to check dietary fat against any of four real vitamins (A, D, E, K)
  // at once, not just one.
  nutrientB: string[];
  citation: string;
  mechanism: string;
};

export const NUTRIENT_SYNERGY_RULES: NutrientPairRule[] = [
  {
    id: 'vitamin-c-iron',
    label: 'Vitamin C with iron',
    kind: 'synergy',
    nutrientA: 'vitamin_c',
    nutrientB: ['iron'],
    citation:
      'Effect of ascorbic acid intake on nonheme-iron absorption from a complete diet, Cook & Reddy, Am J Clin Nutr 2001, PMID 11124756 -- iron absorption from a mixed meal rose 1.65x to 9.57x depending on how much vitamin C was added.',
    mechanism:
      'Vitamin C reduces iron to the form the body absorbs more easily and keeps it soluble through the small intestine, directly countering the same plant compounds (phytates, polyphenols) that make iron from plant foods harder to absorb on its own -- the reason this matters most for whichever specific meal is actually carrying the iron, not just the day\'s total intake of either.',
  },
  {
    id: 'fat-fat-soluble-vitamins',
    label: 'Dietary fat with fat-soluble vitamins',
    kind: 'synergy',
    nutrientA: 'fat_total',
    nutrientB: ['vitamin_a', 'vitamin_d', 'vitamin_e', 'vitamin_k'],
    citation:
      'The same real fact already cited in this app\'s own interaction_rules table (vitamin_a_dietary_fat/vitamin_d_dietary_fat/vitamin_e_dietary_fat/vitamin_k_dietary_fat), reused here rather than cited a second time.',
    mechanism:
      'Vitamins A, D, E, and K are fat-soluble -- the body needs some dietary fat present in the same meal to absorb them well, regardless of the dose.',
  },
];

export const NUTRIENT_ANTAGONISM_RULES: NutrientPairRule[] = [
  {
    id: 'calcium-iron',
    label: 'Calcium with iron',
    kind: 'antagonism',
    nutrientA: 'calcium',
    nutrientB: ['iron'],
    citation:
      'Inhibition of haem-iron absorption in man by calcium, Hallberg et al., Br J Nutr 1993, PMID 8490006 -- a real, replicated finding (the exact transport-level mechanism is still debated; current thinking points to competition at the DMT1 transporter). The same real competition is already cited in this app\'s own interaction_rules table (calcium_iron_timing) for supplement timing specifically.',
    mechanism:
      'Calcium measurably reduces how much iron the body absorbs when both are present in the same meal, whether from food or a supplement.',
  },
  {
    id: 'zinc-copper',
    label: 'High zinc with copper',
    kind: 'antagonism',
    nutrientA: 'zinc',
    nutrientB: ['copper'],
    citation:
      'Copper and zinc absorption in the rat: mechanism of mutual antagonism, PMID 3968585; Linus Pauling Institute\'s own summary names this as clinically relevant mainly at supplement-level zinc intake (50mg/day or more) sustained over weeks, named honestly here rather than overstated for ordinary food-level amounts in one meal.',
    mechanism:
      'High zinc intake induces an intestinal protein (metallothionein) that binds copper in preference to zinc, trapping it in gut cells rather than letting it pass into circulation.',
  },
];

// Whether a candidate's own real amount of one nutrient clears the
// "meaningful source" bar above, relative to the person's own actual DRI
// target for it -- the exact per-food threshold food labeling itself
// already uses, not a per-day figure.
function isMeaningfulSource(
  totals: Record<string, number>,
  nutrientCode: string,
  driByCode: Map<string, DietaryReferenceIntake>,
): boolean {
  const target = driByCode.get(nutrientCode)?.amount;
  if (!target || target <= 0) return false;
  const amount = totals[nutrientCode] ?? 0;
  return (amount / target) * 100 >= MEANINGFUL_SOURCE_THRESHOLD_PERCENT;
}

const SYNERGY_BONUS = 15;
const ANTAGONISM_PENALTY = 15;

// Scores one candidate against whatever's already been picked for the
// SAME meal so far (not the whole day -- Hallberg's own finding is
// specifically about same-meal proximity, and the vitamin C/iron
// mechanism works the same way). A real, symmetric check both
// directions: the candidate can supply either half of a pair against
// what's already in the meal, or the meal-so-far can supply either half
// against what the candidate brings.
function scoreNutrientPairings(
  mealTotalsSoFar: Record<string, number>,
  candidateTotals: Record<string, number>,
  driByCode: Map<string, DietaryReferenceIntake>,
): number {
  let score = 0;
  for (const rule of [...NUTRIENT_SYNERGY_RULES, ...NUTRIENT_ANTAGONISM_RULES]) {
    const candidateHasA = isMeaningfulSource(candidateTotals, rule.nutrientA, driByCode);
    const candidateHasB = rule.nutrientB.some((code) => isMeaningfulSource(candidateTotals, code, driByCode));
    const mealHasA = isMeaningfulSource(mealTotalsSoFar, rule.nutrientA, driByCode);
    const mealHasB = rule.nutrientB.some((code) => isMeaningfulSource(mealTotalsSoFar, code, driByCode));
    const bothPresent = (candidateHasA && mealHasB) || (candidateHasB && mealHasA);
    if (!bothPresent) continue;
    score += rule.kind === 'synergy' ? SYNERGY_BONUS : -ANTAGONISM_PENALTY;
  }
  return score;
}

// How much a candidate actually closes the day's own remaining real gaps
// against RDA/AI targets -- credits only the part of its own amount that
// still fits under the remaining gap, so a nutrient already fully met
// gets no further credit for still more of the same (the real mechanism
// that keeps this from just picking whatever has the single highest
// amount of one nutrient, over and over, at the expense of everything
// else).
function scoreNutrientGapFilling(dayTotalsSoFar: Record<string, number>, candidateTotals: Record<string, number>, driRows: DietaryReferenceIntake[]): number {
  let score = 0;
  for (const row of driRows) {
    if (row.valueType !== 'RDA' && row.valueType !== 'AI') continue;
    if (!row.amount || row.amount <= 0) continue;
    const addition = candidateTotals[row.nutrientCode] ?? 0;
    if (addition <= 0) continue;
    const remainingGap = Math.max(0, row.amount - (dayTotalsSoFar[row.nutrientCode] ?? 0));
    const creditedAmount = Math.min(addition, remainingGap);
    score += (creditedAmount / row.amount) * 100;
  }
  return score;
}

// Whether adding a candidate would push any real nutrient's own running
// day-total past its own real Tolerable Upper Intake Level -- the
// upperLimit field getDietaryReferenceIntakesForCurrentUser already
// returns, unused anywhere in this generator before this pass.
function wouldExceedUpperLimit(dayTotalsSoFar: Record<string, number>, candidateTotals: Record<string, number>, driRows: DietaryReferenceIntake[]): boolean {
  return driRows.some((row) => {
    if (row.upperLimit == null || row.upperLimit <= 0) return false;
    const projected = (dayTotalsSoFar[row.nutrientCode] ?? 0) + (candidateTotals[row.nutrientCode] ?? 0);
    return projected > row.upperLimit;
  });
}

// The fraction of a real, already-filtered candidate pool that stays in
// play after nutrient scoring, before the existing carb-bias/rotation
// pick runs -- a real ranking, not a single forced "best" answer, so
// day-to-day variety (already a standing requirement) survives layering
// nutrient awareness on top of it.
const NUTRIENT_SCORE_TOP_FRACTION = 0.34;

// The real bar an optional salad/beverage addition (see generateOneDay's
// own considerBonusComponent) has to clear before it's worth adding to a
// meal at all -- a named, first-pass judgment call, not a precise
// scientific threshold, the same honest "a real number, not an invented
// one, but still a call someone had to make" shape PAIR_WITH_SIDE_BELOW_KCAL
// already is elsewhere in this file. scoreNutrientGapFilling's own scale
// is percent-of-target-gap-closed summed across every real RDA/AI
// nutrient, so 20 means "closes real, meaningful ground on multiple
// nutrients at once," not just a trace amount of one.
const BONUS_COMPONENT_MIN_SCORE = 20;

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
  // salad/beverage, 2026-08-26 -- the real "combine across builders"
  // bonus roles (see CandidatePools' own comment); only ever added when
  // nutrient scoring shows a genuine benefit, never unconditionally.
  role: 'main' | 'side' | 'salad' | 'beverage';
  carbGrams: number;
};

export type DailyMealPlanNutrientCoverage = {
  nutrientCode: string;
  displayName: string;
  unit: string;
  amount: number;
  targetAmount: number | null;
  percentOfTarget: number | null;
  // 2026-08-26, direct report: "265% of the RDA for copper... I can't
  // understand how they could ever be so high." A real, honest
  // distinction this generic list was missing entirely: several trace
  // minerals (copper, manganese, potassium among them) carry a tiny real
  // RDA/AI next to a much larger real upper limit, so a whole-food diet,
  // vegan ones especially (nuts, seeds, legumes are all real, meaningful
  // sources of these), can legitimately clear 150-250% of the RDA while
  // sitting nowhere near the amount actually flagged as a concern.
  // upperLimit/percentOfUpperLimit (null when this nutrient has no
  // defined real ceiling, like potassium from food) let the UI show that
  // distinction honestly instead of treating every percentage past 100 as
  // equally alarming.
  upperLimit: number | null;
  percentOfUpperLimit: number | null;
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
  // 2026-08-26 -- the full real per-serving nutrient totals
  // getCuratedRecipeNutrientTotals already resolves for every candidate;
  // previously discarded right after carbGrams/kcal were pulled out of
  // it. Needed now for real nutrient-gap-filling, upper-limit, and
  // synergy/antagonism scoring -- no new query, this was already fetched.
  nutrientTotals: Record<string, number>;
};

async function loadCandidate(entry: EligibleRecipeEntry, sharedCaches: IngredientResolutionCaches): Promise<LoadedCandidate | null> {
  const totals = await getCuratedRecipeNutrientTotals(entry.linkedCuratedRecipeId, sharedCaches);
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
    nutrientTotals: totals,
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

// The person's own real DRI rows, keyed for the O(1) per-candidate
// lookups scoreNutrientPairings/scoreNutrientGapFilling/
// wouldExceedUpperLimit all need -- built once per generation run
// (buildCandidatePools below), not once per pick.
type NutrientContext = {
  dayTotalsSoFar: Record<string, number>;
  mealTotalsSoFar: Record<string, number>;
  driRows: DietaryReferenceIntake[];
  driByCode: Map<string, DietaryReferenceIntake>;
};

// The one real selection function every meal slot ultimately goes
// through: frequency rules narrow the pool first (when rotation state
// and a days-remaining count are given -- single-day generation passes
// neither, leaving every candidate eligible, exactly its original
// behavior), then rotation prefers whatever's been used least so far,
// then nutrient scoring ranks whatever's left (when a nutrientContext is
// given -- 2026-08-26, the real "obtain the best array of beneficial
// nutrients... as close to what they need without going too far over"
// request), then the existing carb bias makes the final pick among
// whatever survives.
//
// Every scoring input here (nutrientTotals, driRows) is real, resolved
// per-candidate nutrient amounts and the person's own DRI targets --
// nothing about diet style, ingredient identity, or builder type feeds
// into this at all, so this ranks identically for a vegan candidate pool
// and an omnivore one built from the exact same real logic.
function pickCandidate(
  candidates: LoadedCandidate[],
  carbCeiling: number | null,
  rotation?: { state: RotationState; daysRemainingInWeekIncludingToday: number; applyFrequency: boolean },
  nutrientContext?: NutrientContext,
): LoadedCandidate | undefined {
  if (candidates.length === 0) return undefined;
  let pool = rotation?.applyFrequency ? applyFrequencyRules(candidates, rotation.state, rotation.daysRemainingInWeekIncludingToday) : candidates;
  if (rotation) {
    const minUsage = Math.min(...pool.map((c) => rotation.state.usageCount.get(c.entry.linkedCuratedRecipeId) ?? 0));
    pool = pool.filter((c) => (rotation.state.usageCount.get(c.entry.linkedCuratedRecipeId) ?? 0) === minUsage);
  }

  if (nutrientContext) {
    // Fails open, the same "a target is worth nudging toward, not worth
    // serving nothing over" rule FREQUENCY_RULES already follows -- an
    // upper-limit concern is real, but every real candidate pushing past
    // it (a realistic outcome on a day already close to a limit) should
    // never mean generating nothing at all for that slot.
    const withinLimits = pool.filter((c) => !wouldExceedUpperLimit(nutrientContext.dayTotalsSoFar, c.nutrientTotals, nutrientContext.driRows));
    if (withinLimits.length > 0) pool = withinLimits;

    const scored = pool
      .map((candidate) => ({
        candidate,
        score:
          scoreNutrientGapFilling(nutrientContext.dayTotalsSoFar, candidate.nutrientTotals, nutrientContext.driRows) +
          scoreNutrientPairings(nutrientContext.mealTotalsSoFar, candidate.nutrientTotals, nutrientContext.driByCode),
      }))
      .sort((a, b) => b.score - a.score);
    const topCount = Math.max(1, Math.ceil(scored.length * NUTRIENT_SCORE_TOP_FRACTION));
    pool = scored.slice(0, topCount).map((s) => s.candidate);
  }

  return pickWithCarbBias(pool, carbCeiling);
}

type CandidatePools = {
  breakfastCandidates: LoadedCandidate[];
  lunchMainCandidates: LoadedCandidate[];
  dinnerMainCandidates: LoadedCandidate[];
  sideCandidates: LoadedCandidate[];
  // 2026-08-26 -- the two real "combine across builders" bonus roles
  // this pass adds (see generateOneDay's own pickBonusComponent): a
  // separate salad and a separate beverage, on top of whatever's already
  // picked as the main/side, added only when doing so genuinely helps
  // close a real nutrient gap. Deliberately not soup/sauce/dessert yet --
  // named directly as a real, scoped-down first pass rather than a
  // silent gap, since salad and beverage are this corpus's two builder
  // types most likely to carry a meaningfully different micronutrient
  // profile from whatever the main dish already supplies.
  saladCandidates: LoadedCandidate[];
  beverageCandidates: LoadedCandidate[];
  // The person's own real DRI rows, fetched once per run (not once per
  // day) since they don't change day to day -- driByCode is the same
  // rows, keyed for the repeated per-candidate lookups scoring needs.
  driRows: DietaryReferenceIntake[];
  driByCode: Map<string, DietaryReferenceIntake>;
  // 2026-08-26 -- true whenever Profile is missing sex and/or birth date,
  // the same real completeness check every other DRI-consuming function
  // in lib/db.ts already exposes as its own profileComplete flag (see
  // e.g. the direct-ingredient builders' own SixDimensionsBreakdown
  // functions). Every nutrient-target number this generator computes is
  // only as personalized as that data allows -- surfaced as a plain
  // warning rather than silently guessed at, see driByCode's own comment
  // in buildCandidatePools for why this matters beyond just labeling.
  profileIncomplete: boolean;
};

// getDietaryReferenceIntakesForCurrentUser deliberately returns EVERY row
// that could apply when sex and/or birth date aren't set in Profile (its
// own doc comment: "the caller/UI should show side by side, not
// collapse"), since a nutrient like iron genuinely has different real
// targets by sex and age. A plain `new Map(driRows.map(row =>
// [row.nutrientCode, row]))` silently kept whichever row happened to sort
// last for a given nutrient code -- for iron specifically, that's the
// MALE row (RDA 8mg) even for a person whose real target is the female
// 19-50 row (RDA 18mg), a genuine, silent mismatch that would read as
// "175% of the RDA" for an amount that's actually closer to 80% of the
// correct one. Root-caused directly against a reported "265% copper/175%
// iron/180% manganese/178% potassium" result -- confirmed real by reading
// this exact collapse, not guessed. Fixed by merging every colliding row
// per nutrient into one conservative row instead of picking one
// arbitrarily: the HIGHEST real amount (so gap-filling scoring never
// credits a target as "met" using a lower bar than might actually apply)
// and the LOWEST real, defined upper limit (so the exceeds-UL guard never
// lets a genuine overshoot through using a more permissive ceiling than
// might actually apply). This can't retroactively make the numbers
// exactly right for someone whose profile is incomplete -- only a real
// sex and birth date can -- but it can guarantee the generator always
// errs toward the SAFER, more conservative reading rather than an
// arbitrary one, and profileIncomplete (above) is what tells the UI to
// say so honestly rather than presenting an approximate number as exact.
function buildConservativeDriByCode(driRows: DietaryReferenceIntake[]): Map<string, DietaryReferenceIntake> {
  const byCode = new Map<string, DietaryReferenceIntake>();
  for (const row of driRows) {
    const existing = byCode.get(row.nutrientCode);
    if (!existing) {
      byCode.set(row.nutrientCode, row);
      continue;
    }
    const mergedUpperLimit =
      existing.upperLimit == null ? row.upperLimit : row.upperLimit == null ? existing.upperLimit : Math.min(existing.upperLimit, row.upperLimit);
    byCode.set(row.nutrientCode, {
      ...existing,
      amount: Math.max(existing.amount, row.amount),
      upperLimit: mergedUpperLimit,
    });
  }
  return byCode;
}

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
  const saladPoolEntries = pool.filter((entry) => entry.linkedBuilderType === 'salad');
  const beveragePoolEntries = pool.filter((entry) => entry.linkedBuilderType === 'beverage');

  // 2026-08-26 perf fix -- a recipe can legitimately belong to more than
  // one of the 6 pools above at once (a 'side' is a real lunch/dinner
  // main candidate AND its own dedicated side candidate; a 'salad' is
  // both a main candidate and the salad-bonus candidate), and
  // loadCandidate does real, per-ingredient database resolution, several
  // actual queries deep, not a cheap in-memory computation. Loading each
  // pool independently meant a 'side' or 'salad' recipe's own nutrient
  // totals were being resolved two or three separate times over, once per
  // pool it happens to belong to -- confirmed as the real cause of a
  // reported ~5-minute single-day generation time, not guessed: this
  // corpus's most heavily reused builder type ('side', this app's own
  // generic single-dish builder) was the single biggest multiplier.
  // Fixed by resolving every DISTINCT recipe id referenced by any pool
  // exactly once into a shared map, then building each pool by reading
  // from that map instead of re-resolving. A second, compounding
  // inefficiency fixed in the same pass: getCuratedRecipeNutrientTotals
  // used to build itself a fresh, empty ingredient-resolution cache per
  // call, so a common ingredient (olive oil, garlic, salt) used across
  // dozens of different recipes had its own nutrient/category/unit-weight
  // data re-queried once per recipe that uses it, even within this one
  // run. One shared IngredientResolutionCaches, built once here and
  // passed into every loadCandidate call, makes that lookup happen once
  // per ingredient for the whole run instead.
  const uniqueEntries = new Map<string, EligibleRecipeEntry>();
  for (const entry of pool) uniqueEntries.set(entry.linkedCuratedRecipeId, entry);
  const uniqueEntryList = Array.from(uniqueEntries.values());
  const sharedCaches = createIngredientResolutionCaches();

  const [loadedCandidates, driRows, profile] = await Promise.all([
    Promise.all(uniqueEntryList.map((entry) => loadCandidate(entry, sharedCaches))),
    getDietaryReferenceIntakesForCurrentUser(),
    getUserProfile(),
  ]);
  const candidateById = new Map<string, LoadedCandidate>();
  uniqueEntryList.forEach((entry, index) => {
    const candidate = loadedCandidates[index];
    if (candidate) candidateById.set(entry.linkedCuratedRecipeId, candidate);
  });
  function poolFrom(entries: EligibleRecipeEntry[]): LoadedCandidate[] {
    return entries.map((entry) => candidateById.get(entry.linkedCuratedRecipeId)).filter((c): c is LoadedCandidate => c !== undefined);
  }

  const breakfastCandidates = poolFrom(breakfastPoolEntries);
  const lunchMainCandidates = poolFrom(lunchMainPoolEntries);
  const dinnerMainCandidates = poolFrom(dinnerMainPoolEntries);
  const sideCandidates = poolFrom(sidePoolEntries);
  const saladCandidates = poolFrom(saladPoolEntries);
  const beverageCandidates = poolFrom(beveragePoolEntries);
  const driByCode = buildConservativeDriByCode(driRows);
  const profileIncomplete = profile.sex == null || profile.birthDate == null;
  return {
    breakfastCandidates,
    lunchMainCandidates,
    dinnerMainCandidates,
    sideCandidates,
    saladCandidates,
    beverageCandidates,
    driRows,
    driByCode,
    profileIncomplete,
  };
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
  limitAddedSugar: boolean,
  rotation?: { state: RotationState; daysRemainingInWeekIncludingToday: number },
): Promise<DailyMealPlanResult> {
  const carbCeiling = carbCeilingForLevel(carbLevel);
  const warnings: string[] = [];
  if (pools.profileIncomplete) {
    warnings.push(
      'Your Profile is missing a sex and/or birth date, so the nutrient targets below use the most conservative real DRI value available rather than one built specifically for you. Add both in Profile for a more accurately personalized plan.',
    );
  }
  const { breakfastCandidates, lunchMainCandidates, dinnerMainCandidates, sideCandidates, saladCandidates, beverageCandidates, driRows, driByCode } =
    pools;

  let totalCarbGrams = 0;
  const nutrientTotals: Record<string, number> = {};
  // Reset at the start of each meal's own assembly below -- the
  // synergy/antagonism rules are specifically about same-MEAL proximity
  // (Hallberg's own calcium-iron finding is stated that way directly),
  // not the day's running total, so this has to be a separate, shorter-
  // lived accumulator from nutrientTotals rather than reusing it.
  let mealTotals: Record<string, number> = {};
  function addPick(totals: Record<string, number>) {
    for (const [code, amount] of Object.entries(totals)) {
      nutrientTotals[code] = (nutrientTotals[code] ?? 0) + amount;
      mealTotals[code] = (mealTotals[code] ?? 0) + amount;
    }
  }
  function recordIfRotating(candidate: LoadedCandidate) {
    if (rotation) recordUsage(rotation.state, candidate);
  }
  function currentNutrientContext(): NutrientContext {
    return { dayTotalsSoFar: nutrientTotals, mealTotalsSoFar: mealTotals, driRows, driByCode };
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
  mealTotals = {};
  const noSugarBreakfastCandidates = breakfastCandidates.filter((c) => !c.hasSweetener);
  let breakfast: DailyMealPlanPick | null = null;
  {
    // 2026-08-26: fall back to a breakfast that DOES carry an added
    // sweetener rather than failing outright once every genuinely
    // sugar-free option has already been ruled out -- root-caused
    // directly against a reported "no compliant option found" for a
    // vegan Hashimoto's search: this corpus's real breakfast recipes are
    // almost entirely tofu/soy-based (red-flagged for Hashimoto's) or
    // fruit-and-oat/porridge/chia-pudding (nearly all carrying at least
    // an optional sweetener line), so a hard "never show a sweetened
    // breakfast" rule combined with a narrow diet+condition pool could
    // genuinely empty out every real option, exactly this app's own
    // standing "advisory, never a hard gate that produces nothing at
    // all" rule already applies everywhere else (see Standing rules,
    // Healing-journey stages). "No sugar by default" stays the FIRST
    // choice; a real, edible breakfast beats no breakfast at all.
    const candidatePool = noSugarBreakfastCandidates.length > 0 ? noSugarBreakfastCandidates : breakfastCandidates;
    const usedSweetenedFallback = noSugarBreakfastCandidates.length === 0 && breakfastCandidates.length > 0;
    const withinBudget = carbCeiling === null ? candidatePool : candidatePool.filter((c) => c.carbGrams <= carbCeiling);
    const rotationArg = rotation ? { state: rotation.state, daysRemainingInWeekIncludingToday: rotation.daysRemainingInWeekIncludingToday, applyFrequency: false } : undefined;
    const chosen = pickCandidate(withinBudget.length > 0 ? withinBudget : candidatePool, carbCeiling, rotationArg, currentNutrientContext());
    if (chosen) {
      breakfast = { entry: chosen.entry, role: 'main', carbGrams: chosen.carbGrams };
      totalCarbGrams += chosen.carbGrams;
      addPick(chosen.nutrientTotals);
      recordIfRotating(chosen);
      if (usedSweetenedFallback) {
        warnings.push('No sugar-free breakfast option matched your declared condition(s) and diet preference(s), so this pick carries an optional sweetener you can simply leave out.');
      }
      if (withinBudget.length === 0 && carbCeiling !== null) {
        warnings.push(`No breakfast option stayed under the ${carbCeiling}g daily carb ceiling on its own; the closest option was used instead.`);
      }
    } else {
      // A genuine, verified content gap, not a generic failure: named
      // directly rather than left as an unexplained dead end. Confirmed
      // 2026-08-26 that every one of this corpus's own vegan-tagged
      // breakfast recipes is red-flagged for Hashimoto's specifically
      // (soy, mainly tofu and soy milk) -- a real gap in the recipe
      // library, not a filtering bug, for that one exact combination.
      warnings.push('No breakfast recipe in this app\'s current recipe library complies with both your declared condition(s) and diet preference(s) at once. This is a real gap in the recipe library itself, not a setting to adjust: a compliant recipe needs to be added.');
    }
  }

  // Lunch/dinner: a main, plus a side when the main alone reads light,
  // then a real chance at a salad and/or a beverage -- combining across
  // builders, 2026-08-26, direct request -- staying under whatever carb
  // budget remains for the day. Rotation and FREQUENCY_RULES both apply
  // to the main pick only -- sides/salads/beverages in this corpus are
  // overwhelmingly vegetable- or fruit-based, not realistic fish/red-meat
  // candidates, and still get real day-to-day rotation of their own via
  // the same pickCandidate call.
  async function pickMealWithOptionalSide(mainCandidates: LoadedCandidate[], excludeId: string | undefined, applyFrequency: boolean): Promise<DailyMealPlanPick[]> {
    mealTotals = {};
    const remainingBudget = carbCeiling === null ? null : Math.max(0, carbCeiling - totalCarbGrams);
    let eligible = mainCandidates.filter((c) => c.entry.linkedCuratedRecipeId !== excludeId);
    // 2026-08-26, direct request: "less than a certain amount of sugar."
    // This corpus has no real per-recipe added-sugar-gram figure that's
    // separable from a food's own natural sugar (a whole recipe's total
    // sugars mixes both together, and this app already has a standing,
    // named reason not to build a raw gram threshold on that combined
    // number -- it would equally penalize a recipe whose only sugar is
    // real fruit already in it, the same reasoning "no sugar at
    // breakfast" was built around in the first place). What IS real and
    // structural: whether a recipe adds an actual sweetener ingredient at
    // all (hasSweetener, the same check breakfast already uses, now
    // correctly ignoring an optional line someone can just leave out).
    // limitAddedSugar extends that same structural preference to lunch
    // and dinner mains too, with the identical graceful fallback: prefer
    // a sugar-free option, only fall back to a sweetened one if nothing
    // else in the eligible pool qualifies at all.
    if (limitAddedSugar) {
      const withoutSweetener = eligible.filter((c) => !c.hasSweetener);
      if (withoutSweetener.length > 0) {
        eligible = withoutSweetener;
      } else if (eligible.some((c) => c.hasSweetener)) {
        warnings.push('No added-sugar-free option matched everything else required for this meal, so this pick carries an optional sweetener you can simply leave out.');
      }
    }
    const withinBudget = remainingBudget === null ? eligible : eligible.filter((c) => c.carbGrams <= remainingBudget);
    const mainRotationArg = rotation ? { state: rotation.state, daysRemainingInWeekIncludingToday: rotation.daysRemainingInWeekIncludingToday, applyFrequency } : undefined;
    const chosen = pickCandidate(withinBudget.length > 0 ? withinBudget : eligible, remainingBudget, mainRotationArg, currentNutrientContext());
    if (!chosen) return [];
    const picks: DailyMealPlanPick[] = [{ entry: chosen.entry, role: 'main', carbGrams: chosen.carbGrams }];
    totalCarbGrams += chosen.carbGrams;
    addPick(chosen.nutrientTotals);
    recordIfRotating(chosen);
    const usedIds = new Set([chosen.entry.linkedCuratedRecipeId]);

    if (chosen.kcal < PAIR_WITH_SIDE_BELOW_KCAL) {
      const sideBudget = carbCeiling === null ? null : Math.max(0, carbCeiling - totalCarbGrams);
      const sideEligible = sideCandidates.filter((c) => !usedIds.has(c.entry.linkedCuratedRecipeId));
      const sideWithinBudget = sideBudget === null ? sideEligible : sideEligible.filter((c) => c.carbGrams <= sideBudget);
      const sideRotationArg = rotation ? { state: rotation.state, daysRemainingInWeekIncludingToday: rotation.daysRemainingInWeekIncludingToday, applyFrequency: false } : undefined;
      const chosenSide = pickCandidate(sideWithinBudget, sideBudget, sideRotationArg, currentNutrientContext());
      if (chosenSide) {
        picks.push({ entry: chosenSide.entry, role: 'side', carbGrams: chosenSide.carbGrams });
        totalCarbGrams += chosenSide.carbGrams;
        addPick(chosenSide.nutrientTotals);
        recordIfRotating(chosenSide);
        usedIds.add(chosenSide.entry.linkedCuratedRecipeId);
      }
    }

    // The real "combine across builders" bonus roles -- added only when
    // nutrient scoring shows a genuine benefit (see
    // BONUS_COMPONENT_MIN_SCORE's own comment), never unconditionally.
    // No rotation/frequency narrowing here: these are "only if it helps"
    // extras, not meal-defining picks that need their own standing
    // variety guarantee the way a main does.
    async function considerBonusComponent(role: 'salad' | 'beverage', candidates: LoadedCandidate[]) {
      const budget = carbCeiling === null ? null : Math.max(0, carbCeiling - totalCarbGrams);
      const eligibleBonus = candidates.filter((c) => !usedIds.has(c.entry.linkedCuratedRecipeId));
      const bonusWithinBudget = budget === null ? eligibleBonus : eligibleBonus.filter((c) => c.carbGrams <= budget);
      const withinLimits = bonusWithinBudget.filter((c) => !wouldExceedUpperLimit(nutrientTotals, c.nutrientTotals, driRows));
      const scored = withinLimits
        .map((candidate) => ({
          candidate,
          score: scoreNutrientGapFilling(nutrientTotals, candidate.nutrientTotals, driRows) + scoreNutrientPairings(mealTotals, candidate.nutrientTotals, driByCode),
        }))
        .sort((a, b) => b.score - a.score);
      const best = scored[0];
      if (!best || best.score < BONUS_COMPONENT_MIN_SCORE) return;
      picks.push({ entry: best.candidate.entry, role, carbGrams: best.candidate.carbGrams });
      totalCarbGrams += best.candidate.carbGrams;
      addPick(best.candidate.nutrientTotals);
      usedIds.add(best.candidate.entry.linkedCuratedRecipeId);
    }
    await considerBonusComponent('salad', saladCandidates);
    await considerBonusComponent('beverage', beverageCandidates);

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
  // targets -- 2026-08-26, no longer purely informational (see
  // pickCandidate's own use of scoreNutrientGapFilling/
  // wouldExceedUpperLimit above), but still reported here in full
  // regardless of how close the day actually landed, an honest account
  // rather than only ever showing success.
  // Reads from driByCode (already deduped to one conservative row per
  // nutrient, see buildConservativeDriByCode) rather than mapping the raw
  // driRows array directly -- when Profile is missing a sex/birth date,
  // driRows genuinely carries more than one real row for a nutrient like
  // iron, and mapping it directly used to show that same nutrient twice
  // over, each with a different target, rather than the one conservative
  // figure this run's own scoring actually used throughout.
  const nutrientCoverage: DailyMealPlanNutrientCoverage[] = Array.from(driByCode.values())
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
        upperLimit: row.upperLimit,
        percentOfUpperLimit: row.upperLimit != null && row.upperLimit > 0 ? Math.round((amount / row.upperLimit) * 100) : null,
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
  // Optional and defaulted to false so every pre-existing caller keeps
  // behaving exactly as before.
  limitAddedSugar?: boolean;
}): Promise<DailyMealPlanResult> {
  const pools = await buildCandidatePools(options.conditionCodes, options.dietPreferences);
  return generateOneDay(pools, options.conditionCodes, options.carbLevel, options.limitAddedSugar ?? false);
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
  limitAddedSugar?: boolean;
}): Promise<DailyMealPlanResult[]> {
  const days = Math.max(1, Math.min(42, Math.round(options.days)));
  const pools = await buildCandidatePools(options.conditionCodes, options.dietPreferences);
  const rotationState = newRotationState();
  const results: DailyMealPlanResult[] = [];
  for (let dayIndex = 0; dayIndex < days; dayIndex++) {
    const dayOfWeek = dayIndex % 7;
    if (dayOfWeek === 0) rotationState.weekFrequency.clear();
    const daysRemainingInWeekIncludingToday = 7 - dayOfWeek;
    const result = await generateOneDay(pools, options.conditionCodes, options.carbLevel, options.limitAddedSugar ?? false, {
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

  function toRef(pick: DailyMealPlanPick | undefined): MealPlanComponentRef | undefined {
    return pick ? { builderType: pick.entry.linkedBuilderType, curatedRecipeId: pick.entry.linkedCuratedRecipeId } : undefined;
  }

  // Matched by role, not array position, 2026-08-26 -- a meal's own
  // picks array can now hold main+side, main+salad, main+side+beverage,
  // or any other real combination considerBonusComponent decided on, so
  // the old "picks[0] is the main, picks[1] is the side" assumption no
  // longer holds once more than two roles are possible.
  function toSlot(picks: DailyMealPlanPick[]): MealPlanSlot {
    const main = toRef(picks.find((p) => p.role === 'main'));
    if (!main) throw new Error('[dailyMealPlanToMealPlanDay] A meal slot with real picks always includes a main.');
    return {
      main,
      side: toRef(picks.find((p) => p.role === 'side')),
      salad: toRef(picks.find((p) => p.role === 'salad')),
      beverage: toRef(picks.find((p) => p.role === 'beverage')),
    };
  }

  return {
    day: dayNumber,
    breakfast: toSlot([result.breakfast]),
    lunch: toSlot(result.lunch),
    dinner: toSlot(result.dinner),
  };
}
