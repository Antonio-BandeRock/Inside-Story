// Making a recipe for more than one: G5 of the competitive build plan
// (Phase 2, 2026-09-26). Two places ask "for how many?":
//
// 1. Build This Recipe. Every recipe that comes with the app is written for
//    one serving, so before it loads into a builder the person can say how
//    many they are making it for, and every amount arrives already
//    multiplied. The count travels to the builder through a one-shot hand-off
//    keyed by the recipe id (setPendingMakeFor, then takeMadeFor at load), so
//    the eleven builders each change one line and no route param is added.
//
// 2. A planned meal on Schedules. A meal can carry its own number of people,
//    and the grocery list multiplies that meal's lines by it. A meal with no
//    number of its own follows the list's number of people, which is how the
//    list worked before this.
//
// Pure apart from the hand-off map. Checked by scripts/test_make_it_for.js.

export const MAX_MAKE_FOR = 24;

export function clampMakeFor(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(MAX_MAKE_FOR, Math.max(1, Math.round(value)));
}

// Two decimals is finer than any kitchen measure, and stops 0.1 x 3 from
// arriving as 0.30000000000000004.
export function roundScaled(quantity: number): number {
  return Math.round(quantity * 100) / 100;
}

type Scalable = { servings: number; ingredients: { quantity: number }[] };

// The recipe as written for `makeFor` servings. Every ingredient amount is
// multiplied by makeFor / servings and the dish is recorded as making
// makeFor servings, so the builder's per-serving figures stay what they
// were. A recipe with no usable serving count is treated as one serving.
export function scaleRecipeFor<T extends Scalable>(recipe: T, makeFor: number): T {
  const base = recipe.servings > 0 ? recipe.servings : 1;
  const target = clampMakeFor(makeFor);
  if (target === base) return recipe;
  const factor = target / base;
  return {
    ...recipe,
    servings: target,
    ingredients: recipe.ingredients.map((ingredient) => ({ ...ingredient, quantity: roundScaled(ingredient.quantity * factor) })),
  };
}

const pending = new Map<string, number>();

export function setPendingMakeFor(recipeId: string, makeFor: number): void {
  pending.set(recipeId, clampMakeFor(makeFor));
}

// Read once: a later pick of the same recipe from inside the builder starts
// from the recipe as written again.
export function takePendingMakeFor(recipeId: string): number | null {
  const value = pending.get(recipeId);
  pending.delete(recipeId);
  return value ?? null;
}

export function takeMadeFor<T extends Scalable>(recipe: T | null, recipeId: string): T | null {
  const makeFor = takePendingMakeFor(recipeId);
  if (!recipe || makeFor === null) return recipe;
  return scaleRecipeFor(recipe, makeFor);
}

function people(count: number): string {
  return count === 1 ? '1 person' : `${count} people`;
}

// "Make it for 1 person", "Make it for 4 people"
export function makeForLabel(makeFor: number): string {
  return `Make it for ${people(clampMakeFor(makeFor))}`;
}

// Under the stepper, only once the count is above one.
export function makeForCaption(makeFor: number): string | null {
  const target = clampMakeFor(makeFor);
  if (target === 1) return null;
  return `Every amount opens multiplied by ${target}, and the dish is saved as ${target} servings.`;
}

// How many a planned meal's lines are multiplied by on the grocery list.
export function mealServingFactor(mealServings: number | null | undefined, listPeopleCount: number): number {
  if (mealServings != null && Number.isFinite(mealServings) && mealServings > 0) return mealServings;
  return Math.max(1, Math.round(listPeopleCount));
}

// On a planned meal's row. Null when the meal follows the list.
export function mealServingsLabel(mealServings: number | null | undefined): string | null {
  if (mealServings == null || !(mealServings > 0)) return null;
  return `For ${people(mealServings)}`;
}

// The choices offered on a planned meal: following the list, then 1 to 12.
export const MEAL_SERVING_CHOICES: { value: number | null; label: string }[] = [
  { value: null, label: 'Same as the grocery list' },
  ...Array.from({ length: 12 }, (_, index) => ({ value: index + 1, label: people(index + 1) })),
];
