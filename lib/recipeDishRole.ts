// What part of a meal a curated recipe actually plays, which is not the
// same question as which builder assembles it.
//
// Direct instruction, 1.0.41.1: "Move the 91 mains out of Sides into their
// own group." The Side Builder is this app's generic single-dish tool, so
// everything from a roasted salmon fillet to a bowl of sauteed spinach was
// authored through it and carried linkedBuilderType 'side'. Grouping the
// screen by builder therefore filed 126 dishes that ARE the meal under a
// heading that says they sit beside one.
//
// The builder is still right and is not changed here: Build This Recipe on
// a salmon fillet still opens the Side Builder loaded with it, because
// that is the tool that edits it. What changes is only how the dish is
// described and grouped, the same separation BREAKFAST_DISH_RECIPE_IDS in
// lib/dailyMealPlan.ts already draws for a different question.
//
// The rule is stated as the short list rather than the long one: a
// side-builder recipe is a MAIN unless it is named below. That direction
// was chosen deliberately. Of the 131 recipes the Side Builder holds, five
// are side dishes, so naming the five is reviewable in a way that naming
// the other 126 is not, and a recipe added to that builder later is far
// more likely to be another main than another vegetable side. A new side
// dish has to be added here, and scripts/audit_system_recipe_subgroups.js
// prints the split every time it runs so the number cannot drift unnoticed
// the way the builder-type counts did.
//
// A side dish here means the whole dish: no meat, fish, egg, tofu, tempeh,
// seitan, bean or lentil anchoring it, and not enough on its own to be
// somebody's lunch. That test is what puts Portobello Mushroom with Beets
// and Orange in mains (it is the vegan counterpart to the chicken dish of
// the same shape) and Garlic Mashed Cauliflower here.

export const SIDE_DISH_RECIPE_IDS = new Set<string>([
  'curated_side_garlic_mashed_cauliflower',
  'curated_side_herb_roasted_potatoes',
  'curated_side_lemon_garlic_broccoli',
  'curated_side_rainbow_stir_fry',
  'curated_side_sauteed_spinach_garlic',
]);

// True only for a dish meant to sit beside a main. Everything else the
// Side Builder makes, breakfast skillets and hashes included, is a main:
// a hash is the meal at breakfast, not an accompaniment to one.
export function isSideDish(curatedRecipeId: string | undefined): boolean {
  return curatedRecipeId !== undefined && SIDE_DISH_RECIPE_IDS.has(curatedRecipeId);
}
