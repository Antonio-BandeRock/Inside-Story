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
// was chosen deliberately. Of the 131 recipes the Side Builder held when
// that was written, five were side dishes, so naming the five is
// reviewable in a way that naming the other 126 is not, and a recipe
// added to that builder later is far more likely to be another main than
// another vegetable side. A new side dish has to be added here, and
// scripts/audit_system_recipe_subgroups.js prints the split every time it
// runs so the number cannot drift unnoticed the way the builder-type
// counts did.
//
// 2026-09-19, 1.0.41.2: 25 more side dishes were written
// (scripts/add_sides_snacks_batch.js), taking this list from five to
// thirty against the same 126 mains. The short list is still the shorter
// one, so the direction of the rule is unchanged.
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

  // 2026-09-19, grouped here the way RECIPE_SUBGROUPS in
  // components/SystemRecipesView.tsx groups them on screen, so a change to
  // one of the two can be checked against the other by eye.
  // Roasted and baked vegetables.
  'curated_side_maple_roasted_carrots',
  'curated_side_roasted_brussels_lemon',
  'curated_side_roasted_butternut_cinnamon',
  'curated_side_roasted_beets_orange',
  'curated_side_roasted_fennel_pepper',
  'curated_side_roasted_turnips_rosemary',
  'curated_side_roasted_zucchini_garlic',
  'curated_side_roasted_cauliflower_turmeric',
  // Greens and skillet vegetables.
  'curated_side_sauteed_kale_lemon',
  'curated_side_braised_cabbage_apple',
  'curated_side_garlicky_green_beans',
  'curated_side_skillet_asparagus_lemon',
  'curated_side_sauteed_leeks_carrots',
  'curated_side_broccoli_ginger',
  // Grains and starchy sides.
  'curated_side_sweet_potato_wedges',
  'curated_side_lemon_herb_brown_rice',
  'curated_side_creamy_polenta',
  'curated_side_sorghum_pilaf',
  'curated_side_coconut_rice',
  'curated_side_mashed_sweet_potato_lime',
  // Slaws and cold sides.
  'curated_side_cabbage_carrot_slaw',
  'curated_side_cucumber_dill_salad',
  'curated_side_fennel_apple_slaw',
  // Beans and lentils. Both are here rather than in mains because each is
  // a cup of a single legume dressed simply, served beside something else,
  // and neither is somebody's lunch on its own.
  'curated_side_lemon_garlic_chickpeas',
  'curated_side_stewed_lentils_carrot',
]);

// True only for a dish meant to sit beside a main. Everything else the
// Side Builder makes, breakfast skillets and hashes included, is a main:
// a hash is the meal at breakfast, not an accompaniment to one.
export function isSideDish(curatedRecipeId: string | undefined): boolean {
  return curatedRecipeId !== undefined && SIDE_DISH_RECIPE_IDS.has(curatedRecipeId);
}
