// One line across all conditions for a person's own recipe (G26,
// 2026-09-27).
//
// Every curated recipe carries its condition checks for all 19 conditions,
// worked out offline by scripts/compute_recipe_condition_data.js. A
// person's own recipe carried them only for the conditions tracked on the
// day it was saved, and a recipe saved before the builders learned to
// check carried none at all, so the household line said "not checked" or,
// worse, read a family member's condition that was never checked as a
// miss. Now the saved recipe keeps the ingredients it was made from
// (RecipeCard.checkFrom) and the card checks them when it opens, against
// every condition anyone in the household tracks, with the same rules
// lib/recipeDepth.ts applies at save time.
//
// Reading only: the live result is never written back to the record.
//
// Pure, with no React and no database, so scripts/test_recipe_condition_line.js
// checks it without a phone.
import type { RecipeCard, RecipeCheckIngredient, RecipeDietTag } from './digest/types';
import { possessiveFor, whoFor, type HouseholdLine, type HouseholdPerson, type RecipeForFit } from './householdFit';

export type ConditionChecks = {
  safeForConditions: string[];
  conditionCautions: Record<string, { severity: 'yellow' | 'red'; note: string }>;
};

/** Every condition anyone in the household tracks, each once, in the order first met. */
export function conditionsForPeople(people: HouseholdPerson[]): { code: string; name: string }[] {
  const seen = new Map<string, string>();
  for (const person of people) {
    for (const condition of person.profile.trackedConditions) {
      if (!seen.has(condition.code)) seen.set(condition.code, condition.name);
    }
  }
  return Array.from(seen.entries()).map(([code, name]) => ({ code, name }));
}

/** How many of the recipe's ingredients carry a food from the database, and how many were typed by name. */
export function checkableCounts(checkFrom: { foodId?: string }[]): { checkable: number; typed: number } {
  const checkable = checkFrom.filter((ingredient) => Boolean(ingredient.foodId)).length;
  return { checkable, typed: checkFrom.length - checkable };
}

/**
 * The card with the live checks in place of whatever was saved. With no
 * ingredient to check, the condition fields are cleared, so every line
 * says the conditions were not checked rather than reading a pass. The
 * allergy and restriction words are matched against every ingredient
 * name, typed-in ones included, since the card's printed list leaves
 * those out. Diet tags worked out from the ingredients now stand in for
 * none saved.
 */
export function withLiveChecks<T extends RecipeForFit>(
  card: T,
  checkFrom: RecipeCheckIngredient[],
  live: ConditionChecks | null,
  dietTags?: RecipeDietTag[],
): T {
  const ingredients = checkFrom.map((ingredient) => ({ text: ingredient.foodName }));
  const tags = card.dietTags && card.dietTags.length > 0 ? card.dietTags : dietTags;
  if (!live) return { ...card, ingredients, dietTags: tags, safeForConditions: undefined, conditionCautions: undefined };
  return { ...card, ingredients, dietTags: tags, safeForConditions: live.safeForConditions, conditionCautions: live.conditionCautions };
}

export function typedIngredientsSentence(typed: number): string | null {
  if (typed <= 0) return null;
  return typed === 1
    ? 'One ingredient was typed in by name and could not be checked.'
    : `${typed} ingredients were typed in by name and could not be checked.`;
}

/** Adds the typed-in note to a line, after anything the line already could not check. */
export function withTypedNote(line: HouseholdLine, typed: number): HouseholdLine {
  const note = typedIngredientsSentence(typed);
  if (!note) return line;
  return { ...line, unchecked: line.unchecked ? `${line.unchecked} ${note}` : note };
}

export type ConditionRow = { name: string; tone: 'fits' | 'caution' | 'stop'; text: string };

/** One row per condition the person tracks, for the detail a tap opens. */
export function conditionRowsFor(
  person: HouseholdPerson,
  card: Pick<RecipeCard, 'safeForConditions' | 'conditionCautions'>,
): ConditionRow[] {
  if (card.safeForConditions === undefined) return [];
  return person.profile.trackedConditions.map((condition) => {
    const caution = card.conditionCautions?.[condition.code];
    if (caution) return { name: condition.name, tone: caution.severity === 'red' ? 'stop' : 'caution', text: caution.note };
    if (card.safeForConditions?.includes(condition.code)) {
      return { name: condition.name, tone: 'fits', text: 'Nothing in this recipe is flagged for it.' };
    }
    return {
      name: condition.name,
      tone: 'stop',
      text: 'It holds something this condition rules out at any amount, so it is left out of Meals You Can Eat for it.',
    };
  });
}

/** The title and body of the detail a tap on a line opens. */
export function conditionDetailFor(
  person: HouseholdPerson,
  line: HouseholdLine,
  card: Pick<RecipeCard, 'safeForConditions' | 'conditionCautions'>,
): { title: string; body: string } {
  const rows = conditionRowsFor(person, card);
  const parts: string[] = [];
  if (rows.length > 0) {
    parts.push(rows.map((row) => `${row.name}\n${row.text}`).join('\n\n'));
  } else if (person.profile.trackedConditions.length === 0) {
    parts.push(person.isYou ? 'No conditions chosen in Profile.' : `No conditions set for ${person.name}.`);
  } else {
    parts.push(`${possessiveFor(person).charAt(0).toUpperCase()}${possessiveFor(person).slice(1)} conditions were not checked for this one.`);
  }
  if (line.unchecked) parts.push(line.unchecked);
  parts.push('Checked from the ingredients each time the recipe opens, with the same rules the System Recipes use.');
  return { title: `${whoFor(person)}: ${line.phrase}`, body: parts.join('\n\n') };
}

export const HOUSEHOLD_TAP_CAPTION = 'Tap a line to see each condition.';

export const OWN_RECIPE_LINE_CAPTION =
  'Checked against what you set in Profile: conditions, allergies, eating style and food restrictions. Tap the line for each condition. Allergen-aware, not allergy-safe: a word can be missed, so the cook is the last word.';
