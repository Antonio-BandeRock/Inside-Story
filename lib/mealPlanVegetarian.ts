// The Vegetarian Meal Plan track -- 2026-08-24, built alongside the
// Vegan Meal Plan (see mealPlanVegan.ts's own header comment for the
// full request and reasoning). This track needs far less new content
// than the vegan one: every one of MEAL_PLAN's own 42 breakfasts already
// became dairy/egg-based during the chrononutrition pass, so all 42
// reuse the omnivore breakfast lineup unchanged. Lunches and dinners
// reuse MEAL_PLAN's own dishes as-is wherever they were already
// vegetarian (including the 7 feta/egg dishes the vegan track had to
// build its own tofu-based substitute for, since dairy and egg are both
// fine for a vegetarian diet); only the real meat/fish dishes are
// swapped, reusing the exact same vegan substitute built for that slot
// in mealPlanVegan.ts (a vegan dish is automatically vegetarian-
// compatible too, so no separate, third recipe was needed).

import type { MealPlanDay } from './db';
import { ref } from './mealPlan';

export const VEGETARIAN_MEAL_PLAN: MealPlanDay[] = [
  {
    day: 1,
    breakfast: { main: ref('smoothie', 'curated_smoothie_green_glow') },
    lunch: { main: ref('salad', 'curated_salad_mediterranean_chickpea_feta') },
    dinner: {
      main: ref('side', 'curated_vegan_side_baked_tofu_lemon_dill'),
      side: ref('side', 'curated_side_herb_roasted_potatoes'),
    },
  },
  {
    day: 2,
    breakfast: { main: ref('smoothie', 'curated_smoothie_golden_turmeric') },
    lunch: { main: ref('handheld', 'curated_vegan_handheld_chickpea_avocado_wrap') },
    dinner: {
      main: ref('side', 'curated_vegan_side_herb_crusted_seitan_roast'),
      side: ref('side', 'curated_side_lemon_garlic_broccoli'),
    },
  },
  {
    day: 3,
    breakfast: { main: ref('smoothie', 'curated_smoothie_brazil_nut_selenium') },
    lunch: { main: ref('salad', 'curated_salad_kale_citrus_iron') },
    dinner: {
      main: ref('side', 'curated_vegan_side_baked_tofu_paprika_lemon'),
      side: ref('side', 'curated_side_garlic_mashed_cauliflower'),
    },
  },
  {
    day: 4,
    breakfast: { main: ref('smoothie', 'curated_smoothie_berry_antioxidant') },
    lunch: { main: ref('handheld', 'curated_vegan_handheld_grilled_tempeh_sandwich') },
    dinner: {
      main: ref('side', 'curated_vegan_side_lentil_walnut_meatballs_tomato_sauce'),
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
      main: ref('side', 'curated_vegan_side_ginger_soy_tempeh'),
      side: ref('salad', 'curated_salad_sesame_ginger_slaw'),
    },
    dinner: { main: ref('soup', 'curated_vegan_soup_white_bean_vegetable_soup') },
  },
  {
    day: 9,
    breakfast: { main: ref('snack', 'curated_snack_overnight_oats_chia_berries') },
    lunch: { main: ref('side', 'curated_vegan_side_one_pan_king_oyster_asparagus_rice') },
    dinner: { main: ref('salad', 'curated_salad_beet_walnut_arugula') },
  },
  {
    day: 10,
    breakfast: { main: ref('snack', 'curated_snack_soft_boiled_eggs_avocado_tomato') },
    lunch: { main: ref('side', 'curated_vegan_side_mushroom_walnut_stir_fry_rice') },
    dinner: { main: ref('soup', 'curated_soup_tomato_basil') },
  },
  {
    day: 11,
    breakfast: { main: ref('snack', 'curated_snack_savory_quinoa_bowl_fried_egg') },
    lunch: { main: ref('salad', 'curated_salad_spinach_strawberry_almond') },
    dinner: { main: ref('side', 'curated_vegan_side_baked_tempeh_brussels_sweet_potato') },
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
    dinner: { main: ref('side', 'curated_vegan_side_baked_seitan_zucchini_tomatoes') },
  },
  {
    day: 14,
    breakfast: { main: ref('bakedGoods', 'curated_baked_oatmeal_cup_banana_cinnamon') },
    lunch: { main: ref('handheld', 'curated_handheld_hummus_roasted_vegetable_wrap') },
    dinner: { main: ref('soup', 'curated_vegan_soup_lentil_black_bean_chili') },
  },
  {
    day: 15,
    breakfast: { main: ref('snack', 'curated_snack_kiwi_pistachio_yogurt_bowl') },
    lunch: { main: ref('salad', 'curated_vegan_salad_grilled_tofu_greens_salad') },
    dinner: { main: ref('side', 'curated_vegan_side_roast_tempeh_fennel_leeks') },
  },
  {
    day: 16,
    breakfast: { main: ref('snack', 'curated_snack_peach_almond_overnight_oats') },
    lunch: { main: ref('handheld', 'curated_vegan_handheld_tempeh_hummus_collard_wrap') },
    dinner: { main: ref('side', 'curated_vegan_side_baked_tempeh_parsnip_mash') },
  },
  {
    day: 17,
    breakfast: { main: ref('snack', 'curated_snack_papaya_cottage_cheese_bowl') },
    lunch: { main: ref('side', 'curated_vegan_side_tofu_skewers_couscous') },
    dinner: { main: ref('salad', 'curated_salad_spelt_roasted_vegetable_salad') },
  },
  {
    day: 18,
    breakfast: { main: ref('snack', 'curated_snack_buckwheat_porridge_blueberries_walnuts') },
    lunch: { main: ref('salad', 'curated_vegan_salad_chickpea_white_bean_salad') },
    dinner: { main: ref('side', 'curated_vegan_side_seitan_chop_brussels_apple') },
  },
  {
    day: 19,
    breakfast: { main: ref('snack', 'curated_snack_millet_porridge_apricots') },
    lunch: { main: ref('salad', 'curated_vegan_salad_king_oyster_watermelon_salad') },
    dinner: { main: ref('side', 'curated_vegan_side_king_oyster_scallops_asparagus_lemon') },
  },
  {
    day: 20,
    breakfast: { main: ref('snack', 'curated_snack_grapefruit_yogurt_honey') },
    lunch: { main: ref('side', 'curated_side_chickpea_spinach_curry_bowl') },
    dinner: { main: ref('side', 'curated_vegan_side_portobello_beets_orange') },
  },
  {
    day: 21,
    breakfast: { main: ref('snack', 'curated_snack_fig_walnut_yogurt_bowl') },
    lunch: { main: ref('salad', 'curated_salad_bulgur_tabbouleh_salad') },
    dinner: { main: ref('side', 'curated_vegan_side_tempeh_turnip_carrot') },
  },
  {
    day: 22,
    breakfast: { main: ref('snack', 'curated_snack_date_cashew_breakfast_bowl') },
    lunch: { main: ref('salad', 'curated_vegan_salad_smoky_tempeh_radish_salad') },
    dinner: { main: ref('side', 'curated_vegan_side_chickpea_okra_tomato_skillet') },
  },
  {
    day: 23,
    breakfast: { main: ref('snack', 'curated_snack_nectarine_chia_pudding_cashews') },
    lunch: { main: ref('side', 'curated_vegan_side_white_bean_tomato_bowl') },
    dinner: { main: ref('side', 'curated_vegan_side_braised_seitan_kohlrabi_carrot') },
  },
  {
    day: 24,
    breakfast: { main: ref('snack', 'curated_snack_clementine_almond_yogurt_bowl') },
    lunch: { main: ref('salad', 'curated_salad_roasted_artichoke_white_bean_salad') },
    dinner: { main: ref('side', 'curated_vegan_side_tofu_bok_choy_ginger') },
  },
  {
    day: 25,
    breakfast: { main: ref('snack', 'curated_snack_plum_walnut_overnight_oats') },
    lunch: { main: ref('salad', 'curated_vegan_salad_hearts_of_palm_avocado_salad') },
    dinner: { main: ref('side', 'curated_vegan_side_tempeh_root_vegetable_bowl') },
  },
  {
    day: 26,
    breakfast: { main: ref('snack', 'curated_snack_watermelon_feta_bowl') },
    lunch: { main: ref('side', 'curated_side_edamame_brown_rice_sesame_bowl') },
    dinner: { main: ref('soup', 'curated_vegan_soup_white_bean_tomato_garlic_broth') },
  },
  {
    day: 27,
    breakfast: { main: ref('snack', 'curated_snack_cantaloupe_cottage_cheese_bowl') },
    lunch: { main: ref('salad', 'curated_salad_pinto_bean_roasted_vegetable_bowl') },
    dinner: { main: ref('side', 'curated_vegan_side_tempeh_snow_peas_carrots') },
  },
  {
    day: 28,
    breakfast: { main: ref('snack', 'curated_snack_pear_walnut_yogurt_bowl') },
    lunch: { main: ref('salad', 'curated_salad_lima_bean_roasted_vegetable_salad') },
    dinner: { main: ref('side', 'curated_vegan_side_seitan_turnip_kale') },
  },
  {
    day: 29,
    breakfast: { main: ref('snack', 'curated_snack_fig_pistachio_overnight_oats') },
    lunch: { main: ref('salad', 'curated_vegan_salad_tofu_cucumber_dill_salad') },
    dinner: { main: ref('side', 'curated_vegan_side_lentil_meatloaf_parsnip_carrot') },
  },
  {
    day: 30,
    breakfast: { main: ref('snack', 'curated_snack_apricot_cashew_yogurt_bowl') },
    lunch: { main: ref('soup', 'curated_soup_white_bean_kale_soup') },
    dinner: { main: ref('side', 'curated_vegan_side_tofu_leeks_lemon') },
  },
  {
    day: 31,
    breakfast: { main: ref('snack', 'curated_snack_date_walnut_breakfast_bowl') },
    lunch: { main: ref('soup', 'curated_soup_lentil_kale_soup') },
    dinner: { main: ref('side', 'curated_vegan_side_seitan_chops_roasted_eggplant') },
  },
  {
    day: 32,
    breakfast: { main: ref('snack', 'curated_snack_mango_coconut_chia_pudding') },
    lunch: { main: ref('soup', 'curated_vegan_soup_hearts_of_palm_corn_chowder') },
    dinner: { main: ref('side', 'curated_vegan_side_tempeh_kohlrabi_apple') },
  },
  {
    day: 33,
    breakfast: { main: ref('snack', 'curated_snack_cottage_cheese_fig_honey') },
    lunch: { main: ref('side', 'curated_vegan_side_king_oyster_snow_pea_stir_fry_rice') },
    dinner: { main: ref('side', 'curated_vegan_side_baked_tofu_fennel_orange') },
  },
  {
    day: 34,
    breakfast: { main: ref('snack', 'curated_snack_pear_almond_yogurt_bowl') },
    lunch: { main: ref('side', 'curated_vegan_side_tempeh_cherry_wild_rice') },
    dinner: { main: ref('handheld', 'curated_vegan_handheld_seitan_roasted_vegetable_wrap') },
  },
  {
    day: 35,
    breakfast: { main: ref('snack', 'curated_snack_kiwi_coconut_chia_pudding') },
    lunch: { main: ref('soup', 'curated_soup_white_bean_swiss_chard_soup') },
    dinner: { main: ref('side', 'curated_vegan_side_tempeh_radish_carrot') },
  },
  {
    day: 36,
    breakfast: { main: ref('snack', 'curated_snack_papaya_lime_yogurt_bowl') },
    lunch: { main: ref('side', 'curated_vegan_side_tempeh_wild_rice_cranberries') },
    dinner: { main: ref('salad', 'curated_vegan_salad_white_bean_artichoke_salad') },
  },
  {
    day: 37,
    breakfast: { main: ref('snack', 'curated_snack_blackberry_almond_yogurt_bowl') },
    lunch: { main: ref('soup', 'curated_vegan_soup_white_bean_tomato_fennel_broth') },
    dinner: { main: ref('side', 'curated_vegan_side_tofu_leeks_peas') },
  },
  {
    day: 38,
    breakfast: { main: ref('snack', 'curated_snack_clementine_pistachio_yogurt_bowl') },
    lunch: { main: ref('side', 'curated_side_lentil_roasted_vegetable_tahini_bowl') },
    dinner: { main: ref('side', 'curated_vegan_side_chickpea_walnut_meatballs_tomato_sauce') },
  },
  {
    day: 39,
    breakfast: { main: ref('snack', 'curated_snack_apricot_coconut_overnight_oats') },
    lunch: { main: ref('salad', 'curated_vegan_salad_white_bean_roasted_pepper_salad') },
    dinner: { main: ref('side', 'curated_vegan_side_lemon_tofu_artichoke') },
  },
  {
    day: 40,
    breakfast: { main: ref('snack', 'curated_snack_fig_cashew_overnight_oats') },
    lunch: { main: ref('salad', 'curated_salad_kidney_bean_roasted_vegetable_salad') },
    dinner: { main: ref('side', 'curated_vegan_side_tempeh_radish_dill') },
  },
  {
    day: 41,
    breakfast: { main: ref('snack', 'curated_snack_mango_pistachio_chia_pudding') },
    lunch: { main: ref('soup', 'curated_vegan_soup_mushroom_white_bean_soup') },
    dinner: { main: ref('side', 'curated_vegan_side_braised_chickpea_fennel_orange') },
  },
  {
    day: 42,
    breakfast: { main: ref('snack', 'curated_snack_grapefruit_pistachio_yogurt_bowl') },
    lunch: { main: ref('side', 'curated_vegan_side_tofu_wild_rice_asparagus') },
    dinner: { main: ref('salad', 'curated_vegan_salad_hearts_of_palm_mango_salad') },
  },
];
