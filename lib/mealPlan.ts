// The 6-Week Whole-Food Meal Plan's own real day-by-day rotation --
// 2026-08-24, direct request: "at least 6 weeks worth of meals that can be
// automatically loaded... A different meal set every day without
// repeating meals within that 6 weeks or more... an array of all possible
// fruits and vegetables to provide the largest different number of
// nutrients possible and still gives them as close to the RDA for all
// nutrients." Deliberately kept separate from lib/digest/recipes.ts: this
// file is only real REFERENCES (which curated recipe fills which slot on
// which day), recipes.ts still owns the actual recipe CONTENT, so
// extending the rotation to more weeks later never means touching a
// single recipe's own text, just adding more MealPlanDay entries below.
//
// Every lunch and dinner slot can carry an optional second "side"
// component (see MealPlanSlot's own comment in lib/db.ts) so a real
// dinner reads like an actual plate, a main dish plus a distinct
// vegetable side, without forcing every dinner to be one monolithic
// recipe. This also means the same small pool of real side dishes can
// pair with several different mains across the plan without that
// counting as "the same meal" repeating -- no two days below share the
// same overall breakfast/lunch/dinner combination, which is what
// "without repeating meals" means in the way an actual person plans a
// week of dinners, not that no single ingredient or side dish can ever
// reappear.
//
// Produce variety was tracked by hand while writing this batch, reaching
// for an unused whole fruit or vegetable each time rather than repeating
// the same handful -- the real, practical version of "maximize nutrient
// variety" a single session can deliver. This is NOT a mathematical RDA
// optimizer (that would be its own separate, much larger undertaking) --
// it's genuine, deliberate variety across dozens of real whole foods,
// each recipe's own nutritionHighlights in recipes.ts naming what that
// specific dish actually contributes.
//
// STATUS: 14 of 42 days built so far (days 1-14, a full 2 weeks). The
// remaining 28 days (weeks 3-6) are a real, tracked continuation, not
// forgotten -- see CLAUDE.md's own Status snapshot. Extending the
// rotation is purely additive: write more recipes.ts entries (or reuse
// ones already here that a later week hasn't touched yet), then append
// more MealPlanDay entries below. No architecture changes needed.
//
// Reuse tally for days 1-14, so a future session extending this can see
// at a glance what's already spoken for: all 6 Smoothies (breakfast, days
// 1-6), all 6 Salads (lunch, days 1/3/5/9/11, plus one as a day-8 lunch
// side), all 4 Soups (days 6/7/8/10), all 4 Handhelds (days 2/4/6/7), and
// all 5 Sides (paired as dinner sides, days 1-5) are now used exactly
// once each. Every recipe referenced below appears on exactly one day.

import type { MealPlanDay, MealPlanComponentRef } from './db';

function ref(builderType: MealPlanComponentRef['builderType'], curatedRecipeId: string): MealPlanComponentRef {
  return { builderType, curatedRecipeId };
}

export const MEAL_PLAN: MealPlanDay[] = [
  {
    day: 1,
    breakfast: { main: ref('smoothie', 'curated_smoothie_green_glow') },
    lunch: { main: ref('salad', 'curated_salad_mediterranean_chickpea_feta') },
    dinner: {
      main: ref('side', 'curated_side_baked_salmon_lemon_dill'),
      side: ref('side', 'curated_side_herb_roasted_potatoes'),
    },
  },
  {
    day: 2,
    breakfast: { main: ref('smoothie', 'curated_smoothie_golden_turmeric') },
    lunch: { main: ref('handheld', 'curated_handheld_turkey_avocado_wrap') },
    dinner: {
      main: ref('side', 'curated_side_herb_crusted_pork_tenderloin'),
      side: ref('side', 'curated_side_lemon_garlic_broccoli'),
    },
  },
  {
    day: 3,
    breakfast: { main: ref('smoothie', 'curated_smoothie_brazil_nut_selenium') },
    lunch: { main: ref('salad', 'curated_salad_kale_citrus_iron') },
    dinner: {
      main: ref('side', 'curated_side_baked_cod_paprika_lemon'),
      side: ref('side', 'curated_side_garlic_mashed_cauliflower'),
    },
  },
  {
    day: 4,
    breakfast: { main: ref('smoothie', 'curated_smoothie_berry_antioxidant') },
    lunch: { main: ref('handheld', 'curated_handheld_grilled_chicken_sandwich') },
    dinner: {
      main: ref('side', 'curated_side_turkey_meatballs_tomato_sauce'),
      side: ref('side', 'curated_side_sauteed_spinach_garlic'),
    },
  },
  {
    day: 5,
    breakfast: { main: ref('smoothie', 'curated_smoothie_iron_vitamin_c') },
    lunch: { main: ref('salad', 'curated_salad_southwest_quinoa_black_bean') },
    dinner: {
      main: ref('side', 'curated_side_teriyaki_baked_tofu'),
      side: ref('side', 'curated_side_rainbow_stir_fry'),
    },
  },
  {
    day: 6,
    breakfast: { main: ref('smoothie', 'curated_smoothie_tropical_ginger') },
    lunch: { main: ref('handheld', 'curated_handheld_black_bean_sweet_potato_tacos') },
    dinner: { main: ref('soup', 'curated_soup_red_lentil') },
  },
  {
    day: 7,
    breakfast: { main: ref('snack', 'curated_snack_berries_yogurt') },
    lunch: { main: ref('handheld', 'curated_handheld_egg_salad_lettuce_wraps') },
    dinner: { main: ref('soup', 'curated_soup_butternut_squash') },
  },
  {
    day: 8,
    breakfast: { main: ref('snack', 'curated_snack_veggie_cheddar_scramble_potatoes') },
    lunch: {
      main: ref('side', 'curated_side_ginger_soy_chicken_thighs'),
      side: ref('salad', 'curated_salad_sesame_ginger_slaw'),
    },
    dinner: { main: ref('soup', 'curated_soup_chicken_vegetable') },
  },
  {
    day: 9,
    breakfast: { main: ref('snack', 'curated_snack_overnight_oats_chia_berries') },
    lunch: { main: ref('salad', 'curated_salad_beet_walnut_arugula') },
    dinner: { main: ref('side', 'curated_side_one_pan_shrimp_asparagus_rice') },
  },
  {
    day: 10,
    breakfast: { main: ref('snack', 'curated_snack_soft_boiled_eggs_avocado_tomato') },
    lunch: { main: ref('soup', 'curated_soup_tomato_basil') },
    dinner: { main: ref('side', 'curated_side_beef_mushroom_stir_fry_rice') },
  },
  {
    day: 11,
    breakfast: { main: ref('snack', 'curated_snack_savory_quinoa_bowl_fried_egg') },
    lunch: { main: ref('salad', 'curated_salad_spinach_strawberry_almond') },
    dinner: { main: ref('side', 'curated_side_baked_chicken_thighs_brussels_sweet_potato') },
  },
  {
    day: 12,
    breakfast: { main: ref('snack', 'curated_snack_cottage_cheese_pineapple_walnuts') },
    lunch: { main: ref('side', 'curated_side_white_bean_roasted_vegetable_bowl') },
    dinner: { main: ref('soup', 'curated_soup_green_lentil_vegetable_stew') },
  },
  {
    day: 13,
    breakfast: { main: ref('handheld', 'curated_handheld_breakfast_burrito_eggs_black_beans') },
    lunch: { main: ref('side', 'curated_side_egg_vegetable_fried_rice') },
    dinner: { main: ref('side', 'curated_side_baked_turkey_breast_zucchini_tomatoes') },
  },
  {
    day: 14,
    breakfast: { main: ref('bakedGoods', 'curated_baked_oatmeal_cup_banana_cinnamon') },
    lunch: { main: ref('handheld', 'curated_handheld_hummus_roasted_vegetable_wrap') },
    dinner: { main: ref('soup', 'curated_soup_turkey_black_bean_chili') },
  },
];
