// Who a meal plan feeds, meal by meal (2026-09-27, direct request: "The meal
// plan needs to be able to adjust for after the user adds life partner, and
// they possibly have children together, so this should be always active but
// shows nothing about it until the user adds a partner and later children, or
// other people should also be able to be added. What if an aging mother or
// father has to live with their adult child and their family?").
//
// The answers given to the four questions that followed:
//   1. Main for most, own plate. The shared dish fits as many people at the
//      table as it can; each person it misses gets a plate of their own, sized
//      and named for them.
//   2. One serving each, adjustable. A person is one serving, or a smaller or
//      larger portion, and the shopping list follows the count.
//   3. Who eats which meal, lives with us from and until, soft or easy to
//      chew, and a side per person for a nutrient their day comes up short on.
//
// Pure, with no database and no React, so scripts/test_household_plan.js can
// check it without a phone. lib/dailyMealPlan.ts does the picking with it.
import { recipeMatchesDietPreference, type RecipeDietTag } from './digest/types';
import { restrictionHitsInText, type FoodRestrictionKey } from './foodRestrictions';

export type PlanMeal = 'breakfast' | 'lunch' | 'dinner';
export const PLAN_MEALS: PlanMeal[] = ['breakfast', 'lunch', 'dinner'];
export const PLAN_MEAL_LABELS: Record<PlanMeal, string> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' };

export type PortionSize = 'smaller' | 'regular' | 'larger';
export const PORTION_CHOICES: { key: PortionSize; label: string; factor: number }[] = [
  { key: 'smaller', label: 'A smaller portion (half)', factor: 0.5 },
  { key: 'regular', label: 'One serving', factor: 1 },
  { key: 'larger', label: 'A larger portion (one and a half)', factor: 1.5 },
];

export function portionFactor(portion: PortionSize | string | null | undefined): number {
  return PORTION_CHOICES.find((choice) => choice.key === portion)?.factor ?? 1;
}

export type AgeGroup = '1to3' | '4to8' | '9to13' | '14to18' | '19to50' | '51to70' | '71plus';
export const AGE_GROUP_CHOICES: { key: AgeGroup; label: string }[] = [
  { key: '1to3', label: '1 to 3 years' },
  { key: '4to8', label: '4 to 8 years' },
  { key: '9to13', label: '9 to 13 years' },
  { key: '14to18', label: '14 to 18 years' },
  { key: '19to50', label: '19 to 50 years' },
  { key: '51to70', label: '51 to 70 years' },
  { key: '71plus', label: '71 and over' },
];

export type PlanSex = 'male' | 'female';

/** One person a plan feeds. You are always one of them, with id YOU_EATER_ID. */
export type PlanEater = {
  id: string;
  name: string;
  isYou: boolean;
  conditionCodes: string[];
  dietTags: RecipeDietTag[];
  allergies: string[];
  restrictions: FoodRestrictionKey[];
  portion: PortionSize;
  /** Soft or easy to chew. */
  soft: boolean;
  /** Meals this person is usually not home for. */
  awayMeals: PlanMeal[];
  /** YYYY-MM-DD, inclusive; null for no limit on that side. */
  livesFrom: string | null;
  livesUntil: string | null;
  ageGroup: AgeGroup | null;
  sex: PlanSex | null;
};

export const YOU_EATER_ID = 'you';

/** Whether this person is at the table for this meal on this date. You always are. */
export function isHomeFor(eater: PlanEater, date: string | undefined, meal: PlanMeal): boolean {
  if (eater.isYou) return true;
  if (eater.awayMeals.includes(meal)) return false;
  if (date) {
    if (eater.livesFrom && date < eater.livesFrom) return false;
    if (eater.livesUntil && date > eater.livesUntil) return false;
  }
  return true;
}

export function eatersAt(eaters: PlanEater[], date: string | undefined, meal: PlanMeal): PlanEater[] {
  return eaters.filter((eater) => isHomeFor(eater, date, meal));
}

/** Servings for a dish shared by these people: one each, or their portion. */
export function servingsFor(eaters: PlanEater[]): number {
  const total = eaters.reduce((sum, eater) => sum + portionFactor(eater.portion), 0);
  return Math.round(total * 2) / 2;
}

/** What a recipe carries that a fit check reads. */
export type RecipeFacts = {
  dietTags: RecipeDietTag[] | undefined;
  ingredientText: string;
};

/**
 * Whether a dish fits one person: their conditions (through conditionOk, the
 * generator's own tier check), every eating style they set, none of their
 * allergies by name, and none of their food restrictions. Allergen-aware, not
 * allergy-safe: a name missing from the ingredient text is not a promise.
 */
export function eaterFits(eater: PlanEater, facts: RecipeFacts, conditionOk: (codes: string[]) => boolean): boolean {
  if (eater.conditionCodes.length > 0 && !conditionOk(eater.conditionCodes)) return false;
  if (!eater.dietTags.every((tag) => recipeMatchesDietPreference(facts.dietTags, tag))) return false;
  const lower = facts.ingredientText.toLowerCase();
  if (eater.allergies.some((name) => name.trim() && lower.includes(name.trim().toLowerCase()))) return false;
  if (eater.restrictions.length > 0 && restrictionHitsInText(facts.ingredientText, eater.restrictions).length > 0) return false;
  return true;
}

// Words in an ingredient line that usually mean chewing: whole nuts and seeds,
// raw hard vegetables, crusts, tough cuts and dried meat. A word list reads
// the recipe as written, not as cooked, so a match is a note for the cook
// rather than a rule, and a dish with none of them is preferred when someone
// at the table eats soft food.
const HARD_TO_CHEW: { pattern: RegExp; word: string; unless?: RegExp }[] = [
  { pattern: /\bwhole (almonds|nuts|cashews|walnuts|pecans|hazelnuts)\b/i, word: 'whole nuts' },
  {
    pattern: /\b(almonds?|walnuts?|pecans?|hazelnuts?|cashews?|peanuts?|pistachios?|macadamias?)\b/i,
    word: 'nuts',
    unless: /\b(butter|flour|milk|meal|ground|paste)\b/i,
  },
  {
    pattern: /\b(sunflower|pumpkin|sesame|chia|flax|hemp) seeds?\b/i,
    word: 'seeds',
    unless: /\b(ground|milled|butter|paste|tahini)\b/i,
  },
  { pattern: /\braw (carrots?|celery|broccoli|cauliflower|kale|cabbage)\b/i, word: 'raw hard vegetables' },
  { pattern: /\b(crusty|toasted|baguette|croutons?)\b/i, word: 'crusts' },
  { pattern: /\b(steak|jerky|biltong)\b/i, word: 'a tough cut of meat' },
  { pattern: /\b(popcorn|granola|crackers?|chips)\b/i, word: 'something crunchy' },
];

/** The chewing words found in a dish's ingredients, each named once. */
export function hardToChewWords(ingredientText: string): string[] {
  const found: string[] = [];
  // One ingredient line at a time, so ground flax on one line does not
  // excuse whole almonds on the next.
  const lines = ingredientText.split(/[,;\n]/);
  for (const { pattern, word, unless } of HARD_TO_CHEW) {
    if (found.includes(word)) continue;
    if (lines.some((line) => pattern.test(line) && !(unless && unless.test(line)))) found.push(word);
  }
  return found;
}

// Per-day targets for the nutrients a growing child or an older adult most
// often comes up short on, from the Dietary Reference Intakes (National
// Academies of Sciences, Engineering, and Medicine; RDA, or AI where no RDA
// exists: fiber). The reference database carries adult rows only, so the
// children's values live here. Where sex is not set, the higher of the two.
// Units match the recipe nutrient totals: mg, µg and g.
type TargetRow = { code: string; name: string; unit: string; byGroup: Record<AgeGroup, [number, number]> };
const KEY_TARGETS: TargetRow[] = [
  { code: 'calcium', name: 'Calcium', unit: 'mg', byGroup: { '1to3': [700, 700], '4to8': [1000, 1000], '9to13': [1300, 1300], '14to18': [1300, 1300], '19to50': [1000, 1000], '51to70': [1000, 1200], '71plus': [1200, 1200] } },
  { code: 'iron', name: 'Iron', unit: 'mg', byGroup: { '1to3': [7, 7], '4to8': [10, 10], '9to13': [8, 8], '14to18': [11, 15], '19to50': [8, 18], '51to70': [8, 8], '71plus': [8, 8] } },
  { code: 'vitamin_d', name: 'Vitamin D', unit: 'µg', byGroup: { '1to3': [15, 15], '4to8': [15, 15], '9to13': [15, 15], '14to18': [15, 15], '19to50': [15, 15], '51to70': [15, 15], '71plus': [20, 20] } },
  { code: 'protein', name: 'Protein', unit: 'g', byGroup: { '1to3': [13, 13], '4to8': [19, 19], '9to13': [34, 34], '14to18': [52, 46], '19to50': [56, 46], '51to70': [56, 46], '71plus': [56, 46] } },
  { code: 'fiber_total', name: 'Fiber', unit: 'g', byGroup: { '1to3': [19, 19], '4to8': [25, 25], '9to13': [31, 26], '14to18': [38, 26], '19to50': [38, 25], '51to70': [30, 21], '71plus': [30, 21] } },
  { code: 'vitamin_b12', name: 'Vitamin B12', unit: 'µg', byGroup: { '1to3': [0.9, 0.9], '4to8': [1.2, 1.2], '9to13': [1.8, 1.8], '14to18': [2.4, 2.4], '19to50': [2.4, 2.4], '51to70': [2.4, 2.4], '71plus': [2.4, 2.4] } },
];

export type KeyTarget = { code: string; name: string; unit: string; amount: number };

/** This person's day targets; an adult's (19 to 50) when no age group is set. */
export function keyTargetsFor(eater: Pick<PlanEater, 'ageGroup' | 'sex'>): KeyTarget[] {
  const group = eater.ageGroup ?? '19to50';
  return KEY_TARGETS.map((row) => {
    const [male, female] = row.byGroup[group];
    const amount = eater.sex === 'male' ? male : eater.sex === 'female' ? female : Math.max(male, female);
    return { code: row.code, name: row.name, unit: row.unit, amount };
  });
}

/** Below this share of a target, a day earns one side for that person. */
export const GAP_SIDE_THRESHOLD = 0.5;

/**
 * The target this person's day falls furthest short on, when it is under
 * half. mealsHome scales every target to the meals they eat here, since
 * nothing is known about a meal eaten elsewhere.
 */
export function shortestTarget(
  eater: Pick<PlanEater, 'ageGroup' | 'sex'>,
  totals: Record<string, number>,
  mealsHome: number,
): { target: KeyTarget; share: number } | null {
  if (mealsHome <= 0) return null;
  let worst: { target: KeyTarget; share: number } | null = null;
  for (const target of keyTargetsFor(eater)) {
    const scaled = (target.amount * mealsHome) / 3;
    const share = (totals[target.code] ?? 0) / scaled;
    if (share < GAP_SIDE_THRESHOLD && (!worst || share < worst.share)) worst = { target, share };
  }
  return worst;
}

/** "Sam", "Sam and Ada", "Sam, Ada and Lee". */
export function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/**
 * Of the people at a meal, who the shared dish can be made for. Starts with
 * everybody; while nothing fits them all, leaves out the one person whose
 * absence opens up the most dishes, and so on. You are never left out, since
 * the plan is yours. Returns who the shared dish covers and who needs a plate
 * of their own.
 */
export function coverTable<T>(
  present: PlanEater[],
  candidates: T[],
  fits: (eater: PlanEater, candidate: T) => boolean,
): { covered: PlanEater[]; ownPlate: PlanEater[]; matching: T[] } {
  let covered = [...present];
  const ownPlate: PlanEater[] = [];
  const matchingFor = (people: PlanEater[]) => candidates.filter((c) => people.every((eater) => fits(eater, c)));
  let matching = matchingFor(covered);
  while (matching.length === 0 && covered.some((eater) => !eater.isYou)) {
    let best: { eater: PlanEater; matching: T[] } | null = null;
    for (const eater of covered) {
      if (eater.isYou) continue;
      const without = matchingFor(covered.filter((other) => other !== eater));
      if (!best || without.length > best.matching.length) best = { eater, matching: without };
    }
    if (!best) break;
    covered = covered.filter((other) => other !== best!.eater);
    ownPlate.push(best.eater);
    matching = best.matching;
  }
  return { covered, ownPlate, matching };
}

/**
 * One sentence about who the plan feeds, or empty when it feeds only you.
 * Names each person with the meals they are home for when that is not all
 * three, and the dates they live with you when set.
 */
export function describeHousehold(eaters: PlanEater[]): string {
  const others = eaters.filter((eater) => !eater.isYou);
  if (others.length === 0) return '';
  const parts = others.map((eater) => {
    const home = PLAN_MEALS.filter((meal) => !eater.awayMeals.includes(meal));
    let part = eater.name;
    if (home.length === 0) part += ' (away for every meal)';
    else if (home.length < 3) part += ` (${joinNames(home.map((meal) => meal))} only)`;
    if (eater.livesFrom && eater.livesUntil) part += `, living here ${eater.livesFrom} to ${eater.livesUntil}`;
    else if (eater.livesFrom) part += `, living here from ${eater.livesFrom}`;
    else if (eater.livesUntil) part += `, living here until ${eater.livesUntil}`;
    return part;
  });
  return `Meals are made for you and ${joinNames(parts)}. A shared dish fits everyone at that meal where one can; anyone it does not fit gets a plate of their own, and each dish is sized to who eats it.`;
}
