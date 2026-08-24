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
// STATUS: all 42 days built (2026-08-24, direct follow-up: "Keep going on
// weeks 3-6"). Days 1-14 (weeks 1-2) reuse 20 of the pre-existing 88
// curated recipes; days 15-42 (weeks 3-6) are entirely new content, since
// every eligible Smoothie/Salad/Soup/Handheld/Side had already been used
// exactly once by day 14. Weeks 3-6 deliberately reach for whole foods the
// first two weeks never touched -- halibut, trout, tuna, sardine,
// mackerel, scallop, mussel, crab, lamb, duck, bison, pork chop, pork
// loin, turkey thigh, kiwi, papaya, peach, apricot, plum, nectarine,
// clementine, grapefruit, fig, date, watermelon, cantaloupe, fennel,
// parsnip, leek, radish, turnip, collards, kohlrabi, bok choy, okra,
// artichoke, snow peas, edamame, kidney beans, pinto beans, lima beans,
// buckwheat, millet, spelt, bulgur, wild rice, couscous, pistachio, and
// cashew -- alongside genuine repeats of a handful of realistic everyday
// staples (chicken, turkey, salmon, shrimp) in different dishes, the same
// way an actual person's own 6 weeks of home cooking would.
//
// Reuse tally for days 1-14, so a future session extending this can see
// at a glance what's already spoken for: all 6 Smoothies (breakfast, days
// 1-6), all 6 Salads (lunch, days 1/3/5/9/11, plus one as a day-8 lunch
// side), all 4 Soups (days 6/7/8/10), all 4 Handhelds (days 2/4/6/7), and
// all 5 Sides (paired as dinner sides, days 1-5) are now used exactly
// once each. Every recipe referenced below appears on exactly one day.
//
// CHRONONUTRITION PASS, 2026-08-24, direct follow-up: "It seems like you
// used a smoothie for breakfast more often than not... we need to follow a
// very chrononutrition style of eating." An audit found the real gap
// wasn't just the 6 Smoothies (all clustered at the very start of the
// plan, days 1-6, which is what made it feel more frequent than its true
// 6-of-42 rate) -- 13 more breakfasts (every overnight-oats, warm
// porridge, and chia-pudding recipe) used almond or coconut milk as their
// own liquid base too, carrying almost no protein and no fermented
// element either. All 19 were fixed the same way, at the recipe level
// (see recipes.ts's own per-recipe edits and
// scripts/chrononutrition_breakfast_protein_boost.py): swapped to a real
// Greek yogurt base, adding real protein and making the breakfast itself
// a fermented food, matching this app's own new Basic Health research on
// why a protein-and-fermented-food breakfast measurably helps same-day
// blood sugar and gut health. Every recipe id below still resolves to the
// exact same dish; only that dish's own ingredients changed.
//
// Separately, 6 days (9, 10, 17, 34, 36, 42) had their lunch and dinner
// SWAPPED: each one's dinner slot held a dedicated grain (brown rice,
// wild rice, or couscous) while its own lunch was a lighter, grain-free
// salad or soup. Real cohort and trial evidence (a 103,000-person cohort,
// Nature Communications 2023; early-time-restricted-feeding RCTs) points
// the other way: insulin sensitivity is highest earlier in the day, and a
// lighter, lower-starch dinner eaten well before bed is associated with
// better cardiometabolic outcomes. Moving the grain-based dish to lunch
// and the lighter dish to dinner on those 6 days needed no new recipes at
// all, just reassigning which existing dish fills which slot. Whole-food
// starchy VEGETABLES at dinner (potato, sweet potato, parsnip, turnip)
// were deliberately left alone rather than swapped -- treated as a real,
// fiber-rich food, not the same concern as a dedicated refined-grain side,
// a distinction this app's own new chrononutrition research names
// directly rather than treating every carbohydrate source as equivalent.

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
    // Chrononutrition swap, 2026-08-24: the brown-rice dish moved to
    // midday (insulin sensitivity is highest then) and the lighter,
    // starch-free salad moved to evening -- see this file's own header
    // comment for the full reasoning.
    lunch: { main: ref('side', 'curated_side_one_pan_shrimp_asparagus_rice') },
    dinner: { main: ref('salad', 'curated_salad_beet_walnut_arugula') },
  },
  {
    day: 10,
    breakfast: { main: ref('snack', 'curated_snack_soft_boiled_eggs_avocado_tomato') },
    lunch: { main: ref('side', 'curated_side_beef_mushroom_stir_fry_rice') },
    dinner: { main: ref('soup', 'curated_soup_tomato_basil') },
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

  // Weeks 3-6 (days 15-42), all-new content -- see this file's own header
  // comment for the full reasoning.
  {
    day: 15,
    breakfast: { main: ref('snack', 'curated_snack_kiwi_pistachio_yogurt_bowl') },
    lunch: { main: ref('salad', 'curated_salad_grilled_halibut_greens') },
    dinner: { main: ref('side', 'curated_side_roast_chicken_fennel_leeks') },
  },
  {
    day: 16,
    breakfast: { main: ref('snack', 'curated_snack_peach_almond_overnight_oats') },
    lunch: { main: ref('handheld', 'curated_handheld_turkey_hummus_collard_wrap') },
    dinner: { main: ref('side', 'curated_side_baked_trout_parsnip_mash') },
  },
  {
    day: 17,
    breakfast: { main: ref('snack', 'curated_snack_papaya_cottage_cheese_bowl') },
    lunch: { main: ref('side', 'curated_side_lamb_skewers_couscous') },
    dinner: { main: ref('salad', 'curated_salad_spelt_roasted_vegetable_salad') },
  },
  {
    day: 18,
    breakfast: { main: ref('snack', 'curated_snack_buckwheat_porridge_blueberries_walnuts') },
    lunch: { main: ref('salad', 'curated_salad_tuna_white_bean_salad') },
    dinner: { main: ref('side', 'curated_side_pork_chop_brussels_apple') },
  },
  {
    day: 19,
    breakfast: { main: ref('snack', 'curated_snack_millet_porridge_apricots') },
    lunch: { main: ref('salad', 'curated_salad_shrimp_watermelon_salad') },
    dinner: { main: ref('side', 'curated_side_scallops_asparagus_lemon') },
  },
  {
    day: 20,
    breakfast: { main: ref('snack', 'curated_snack_grapefruit_yogurt_honey') },
    lunch: { main: ref('side', 'curated_side_chickpea_spinach_curry_bowl') },
    dinner: { main: ref('side', 'curated_side_duck_beets_orange') },
  },
  {
    day: 21,
    breakfast: { main: ref('snack', 'curated_snack_fig_walnut_yogurt_bowl') },
    lunch: { main: ref('salad', 'curated_salad_bulgur_tabbouleh_salad') },
    dinner: { main: ref('side', 'curated_side_turkey_thigh_turnip_carrot') },
  },
  {
    day: 22,
    breakfast: { main: ref('snack', 'curated_snack_date_cashew_breakfast_bowl') },
    lunch: { main: ref('salad', 'curated_salad_mackerel_radish_salad') },
    dinner: { main: ref('side', 'curated_side_chicken_okra_tomato_skillet') },
  },
  {
    day: 23,
    breakfast: { main: ref('snack', 'curated_snack_nectarine_chia_pudding_cashews') },
    lunch: { main: ref('side', 'curated_side_sardine_white_bean_bowl') },
    dinner: { main: ref('side', 'curated_side_braised_beef_kohlrabi_carrot') },
  },
  {
    day: 24,
    breakfast: { main: ref('snack', 'curated_snack_clementine_almond_yogurt_bowl') },
    lunch: { main: ref('salad', 'curated_salad_roasted_artichoke_white_bean_salad') },
    dinner: { main: ref('side', 'curated_side_sole_bok_choy_ginger') },
  },
  {
    day: 25,
    breakfast: { main: ref('snack', 'curated_snack_plum_walnut_overnight_oats') },
    lunch: { main: ref('salad', 'curated_salad_crab_avocado_salad') },
    dinner: { main: ref('side', 'curated_side_bison_root_vegetable_bowl') },
  },
  {
    day: 26,
    breakfast: { main: ref('snack', 'curated_snack_watermelon_feta_bowl') },
    lunch: { main: ref('side', 'curated_side_edamame_brown_rice_sesame_bowl') },
    dinner: { main: ref('soup', 'curated_soup_mussels_tomato_garlic_broth') },
  },
  {
    day: 27,
    breakfast: { main: ref('snack', 'curated_snack_cantaloupe_cottage_cheese_bowl') },
    lunch: { main: ref('salad', 'curated_salad_pinto_bean_roasted_vegetable_bowl') },
    dinner: { main: ref('side', 'curated_side_chicken_breast_snow_peas_carrots') },
  },
  {
    day: 28,
    breakfast: { main: ref('snack', 'curated_snack_pear_walnut_yogurt_bowl') },
    lunch: { main: ref('salad', 'curated_salad_lima_bean_roasted_vegetable_salad') },
    dinner: { main: ref('side', 'curated_side_pork_loin_turnip_kale') },
  },
  {
    day: 29,
    breakfast: { main: ref('snack', 'curated_snack_fig_pistachio_overnight_oats') },
    lunch: { main: ref('salad', 'curated_salad_trout_cucumber_salad') },
    dinner: { main: ref('side', 'curated_side_turkey_meatloaf_parsnip_carrot') },
  },
  {
    day: 30,
    breakfast: { main: ref('snack', 'curated_snack_apricot_cashew_yogurt_bowl') },
    lunch: { main: ref('soup', 'curated_soup_white_bean_kale_soup') },
    dinner: { main: ref('side', 'curated_side_salmon_leeks_lemon') },
  },
  {
    day: 31,
    breakfast: { main: ref('snack', 'curated_snack_date_walnut_breakfast_bowl') },
    lunch: { main: ref('soup', 'curated_soup_lentil_kale_soup') },
    dinner: { main: ref('side', 'curated_side_lamb_chops_roasted_eggplant') },
  },
  {
    day: 32,
    breakfast: { main: ref('snack', 'curated_snack_mango_coconut_chia_pudding') },
    lunch: { main: ref('soup', 'curated_soup_crab_corn_chowder') },
    dinner: { main: ref('side', 'curated_side_chicken_thighs_kohlrabi_apple') },
  },
  {
    day: 33,
    breakfast: { main: ref('snack', 'curated_snack_cottage_cheese_fig_honey') },
    lunch: { main: ref('side', 'curated_side_shrimp_snow_pea_stir_fry_rice') },
    dinner: { main: ref('side', 'curated_side_baked_cod_fennel_orange') },
  },
  {
    day: 34,
    breakfast: { main: ref('snack', 'curated_snack_pear_almond_yogurt_bowl') },
    lunch: { main: ref('side', 'curated_side_duck_cherry_wild_rice') },
    dinner: { main: ref('handheld', 'curated_handheld_bison_roasted_vegetable_wrap') },
  },
  {
    day: 35,
    breakfast: { main: ref('snack', 'curated_snack_kiwi_coconut_chia_pudding') },
    lunch: { main: ref('soup', 'curated_soup_white_bean_swiss_chard_soup') },
    dinner: { main: ref('side', 'curated_side_pork_loin_radish_carrot') },
  },
  {
    day: 36,
    breakfast: { main: ref('snack', 'curated_snack_papaya_lime_yogurt_bowl') },
    lunch: { main: ref('side', 'curated_side_turkey_wild_rice_cranberries') },
    dinner: { main: ref('salad', 'curated_salad_tuna_artichoke_salad') },
  },
  {
    day: 37,
    breakfast: { main: ref('snack', 'curated_snack_blackberry_almond_yogurt_bowl') },
    lunch: { main: ref('soup', 'curated_soup_mussels_tomato_fennel_broth') },
    dinner: { main: ref('side', 'curated_side_halibut_leeks_peas') },
  },
  {
    day: 38,
    breakfast: { main: ref('snack', 'curated_snack_clementine_pistachio_yogurt_bowl') },
    lunch: { main: ref('side', 'curated_side_lentil_roasted_vegetable_tahini_bowl') },
    dinner: { main: ref('side', 'curated_side_bison_meatballs_herb_tomato_sauce') },
  },
  {
    day: 39,
    breakfast: { main: ref('snack', 'curated_snack_apricot_coconut_overnight_oats') },
    lunch: { main: ref('salad', 'curated_salad_sardine_roasted_pepper_salad') },
    dinner: { main: ref('side', 'curated_side_chicken_breast_artichoke_lemon') },
  },
  {
    day: 40,
    breakfast: { main: ref('snack', 'curated_snack_fig_cashew_overnight_oats') },
    lunch: { main: ref('salad', 'curated_salad_kidney_bean_roasted_vegetable_salad') },
    dinner: { main: ref('side', 'curated_side_trout_radish_dill') },
  },
  {
    day: 41,
    breakfast: { main: ref('snack', 'curated_snack_mango_pistachio_chia_pudding') },
    lunch: { main: ref('soup', 'curated_soup_turkey_white_bean_soup') },
    dinner: { main: ref('side', 'curated_side_lamb_fennel_orange') },
  },
  {
    day: 42,
    breakfast: { main: ref('snack', 'curated_snack_grapefruit_pistachio_yogurt_bowl') },
    lunch: { main: ref('side', 'curated_side_salmon_wild_rice_asparagus') },
    dinner: { main: ref('salad', 'curated_salad_crab_mango_salad') },
  },
];
