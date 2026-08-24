#!/usr/bin/env python3
"""Rescale every curated_recipes/curated_recipe_ingredients row from its own
prior 2-person (or 4-serving, for the 5 Sides/4 Soups/2 Desserts whose DB
rows were never updated during an earlier 4-to-2 rescale) design down to a
genuine 1-person baseline, matching the same 2026-08-24 direct request and
per-recipe scaling decisions already applied to lib/digest/recipes.ts's own
recipeCard content: "reduce the size for each recipe to be only for one
person... The app can do the math to increase the ingredients to
accommodate for additional people."

Every recipe in this database gets exactly one of three treatments, decided
by cross-referencing this script's own author (Claude) against the actual
values it had just written into recipes.ts for every one of the 88 curated
recipes, not guessed from serving-count math alone:

  - MULTIPLY 0.5: the ordinary case. Recipes.ts and this database already
    agreed on a 2-person (or 2-serving-batch) design, so every ingredient's
    quantity is halved and curated_recipes.servings is halved to match,
    leaving serving_size_amount/serving_size_unit untouched (the SIZE of
    one serving doesn't change; only how many the recipe now yields does).
  - MULTIPLY 0.25: the 5 Sides, 4 Soups, and 2 Desserts whose database rows
    were left at their original 4-serving design during an earlier session's
    2026-08-2x rescale from 4 servings down to 2 (recipes.ts was updated
    then; this database wasn't). Recipes.ts is now at 1 serving, a quarter
    of this database's still-stale 4-serving values.
  - NO CHANGE: 15 recipes where recipes.ts's own new 1-person values already
    match this database exactly, and no recipes.ts edit was needed at all --
    the 6 Smoothies and 2 Beverages (Electrolyte Water, Golden Milk) whose
    database rows already held their original pre-doubling single-serving
    values, the Turkey Wrap and Grilled Chicken Sandwich handhelds whose
    database rows already modeled 1 wrap/1 sandwich as a single serving, the
    2 already-single-serving Snacks (Apple Almond Butter, Berries with Greek
    Yogurt), and 3 small-dose/concentrate ferments (Garlic Honey Tonic,
    Rosemary Cheong, Shrub) that were never written for a 2-person yield to
    begin with.

Run once, from the repo root: py scripts/rescale_curated_recipes_to_1_person.py
"""
import sqlite3

DB_PATH = "assets/data/foods_reference.db"

# recipe_id -> multiplier. Every id in curated_recipes must appear exactly
# once across these three sets; the script asserts that at the end.
HALVE = [
    "curated_baked_whole_wheat_bread",
    "curated_baked_wheat_tortillas",
    "curated_baked_buttermilk_biscuits",
    "curated_baked_banana_oat_cookies",
    "curated_bev_ginger_turmeric_tonic",
    "curated_bev_iced_green_tea_mint",
    "curated_ferment_plain_yogurt",
    "curated_ferment_probiotic_yogurt",
    "curated_ferment_sauerkraut",
    "curated_ferment_kombucha",
    "curated_handheld_black_bean_sweet_potato_tacos",
    "curated_handheld_egg_salad_lettuce_wraps",
    "curated_salad_mediterranean_chickpea_feta",
    "curated_salad_kale_citrus_iron",
    "curated_salad_sesame_ginger_slaw",
    "curated_salad_beet_walnut_arugula",
    "curated_salad_southwest_quinoa_black_bean",
    "curated_salad_spinach_strawberry_almond",
    "curated_sauce_basic_tomato",
    "curated_sauce_garlic_herb_vinaigrette",
    "curated_sauce_simple_pesto",
    "curated_sauce_tahini_lemon",
    "curated_snack_roasted_chickpeas",
    "curated_snack_trail_mix",
    "curated_ferment_tonic_tart_cherry_ginger_turmeric",
    "curated_ferment_tonic_blueberry_ginger_turmeric",
    "curated_ferment_tonic_pomegranate_ginger_turmeric",
    "curated_ferment_tonic_cranberry_ginger_turmeric",
    "curated_ferment_tonic_red_grape_ginger_turmeric",
    "curated_ferment_tonic_hibiscus_ginger_turmeric",
    "curated_ferment_tonic_blackberry_raspberry_ginger_turmeric",
    "curated_ferment_tonic_elderberry_ginger_turmeric",
    "curated_ferment_tonic_apple_pear",
    "curated_ferment_tonic_lemon_lime",
    "curated_ferment_beet_kvass",
    "curated_ferment_kanji",
    "curated_ferment_water_kefir",
    "curated_ferment_coconut_kefir",
    "curated_ferment_ginger_bug_soda",
    "curated_ferment_ginger_beer_traditional",
    "curated_ferment_turmeric_drink",
    "curated_ferment_tepache",
    "curated_ferment_switchel",
    "curated_ferment_jun_tea",
    "curated_ferment_milk_kefir",
    "curated_ferment_amazake",
    "curated_ferment_rejuvelac",
    "curated_ferment_mauby_burdock_tonic",
    "curated_ferment_burdock_dandelion_ale",
    "curated_ferment_pozol",
    "curated_ferment_sobia",
    "curated_ferment_boza",
    "curated_ferment_chicha",
    "curated_ferment_rye_style_kvass_quinoa",
    "curated_ferment_sake_style_rice_wine",
    "curated_ferment_makgeolli",
    "curated_ferment_ayran",
    "curated_ferment_mango_lassi",
    "curated_ferment_tarag_style",
    "curated_ferment_puerh_style_tea",
    "curated_ferment_coconut_palm_wine_style",
    "curated_ferment_maple_pulque_style",
]

QUARTER = [
    "curated_side_herb_roasted_potatoes",
    "curated_side_lemon_garlic_broccoli",
    "curated_side_garlic_mashed_cauliflower",
    "curated_side_sauteed_spinach_garlic",
    "curated_side_rainbow_stir_fry",
    "curated_soup_chicken_vegetable",
    "curated_soup_butternut_squash",
    "curated_soup_red_lentil",
    "curated_soup_tomato_basil",
    "curated_dessert_baked_cinnamon_apples",
    "curated_dessert_mixed_berry_chia_pudding",
]

NO_CHANGE = [
    "curated_bev_electrolyte_water",
    "curated_bev_golden_milk",
    "curated_handheld_turkey_avocado_wrap",
    "curated_handheld_grilled_chicken_sandwich",
    "curated_smoothie_green_glow",
    "curated_smoothie_golden_turmeric",
    "curated_smoothie_brazil_nut_selenium",
    "curated_smoothie_berry_antioxidant",
    "curated_smoothie_iron_vitamin_c",
    "curated_smoothie_tropical_ginger",
    "curated_snack_apple_almond_butter",
    "curated_snack_berries_yogurt",
    "curated_ferment_garlic_honey_tonic",
    "curated_ferment_rosemary_cheong",
    "curated_ferment_shrub",
]


def round_sensible(value: float) -> float:
    """Round to a clean value without collapsing small amounts to 0."""
    rounded = round(value, 3)
    if rounded == 0 and value != 0:
        return value
    return rounded


def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("SELECT id FROM curated_recipes")
    all_ids = {row[0] for row in cur.fetchall()}
    covered = set(HALVE) | set(QUARTER) | set(NO_CHANGE)
    missing = all_ids - covered
    extra = covered - all_ids
    if missing:
        raise SystemExit(f"Recipe ids present in DB but not classified: {sorted(missing)}")
    if extra:
        raise SystemExit(f"Classified ids that don't exist in DB: {sorted(extra)}")
    if len(all_ids) != 88:
        raise SystemExit(f"Expected 88 curated recipes, found {len(all_ids)}")

    changed_recipes = 0
    changed_ingredients = 0

    for recipe_id, multiplier in [(r, 0.5) for r in HALVE] + [(r, 0.25) for r in QUARTER]:
        cur.execute("SELECT servings FROM curated_recipes WHERE id = ?", (recipe_id,))
        row = cur.fetchone()
        if row is None:
            raise SystemExit(f"Missing curated_recipes row: {recipe_id}")
        old_servings = row[0]
        new_servings = round_sensible(old_servings * multiplier)
        cur.execute(
            "UPDATE curated_recipes SET servings = ? WHERE id = ?",
            (new_servings, recipe_id),
        )
        changed_recipes += 1

        cur.execute(
            "SELECT rowid, quantity FROM curated_recipe_ingredients WHERE recipe_id = ?",
            (recipe_id,),
        )
        ingredient_rows = cur.fetchall()
        for rowid, quantity in ingredient_rows:
            new_quantity = round_sensible(quantity * multiplier)
            cur.execute(
                "UPDATE curated_recipe_ingredients SET quantity = ? WHERE rowid = ?",
                (new_quantity, rowid),
            )
            changed_ingredients += 1

    conn.commit()

    # Bump REFERENCE_DB_VERSION marker table if one exists in this schema;
    # the app-side constant is bumped separately in lib/db.ts by hand, per
    # this project's own standing convention for any live-DB content change.

    print(f"Recipes rescaled: {changed_recipes} ({len(HALVE)} halved, {len(QUARTER)} quartered)")
    print(f"No-change recipes (already correct): {len(NO_CHANGE)}")
    print(f"Ingredient rows updated: {changed_ingredients}")
    print(f"Total recipes accounted for: {changed_recipes + len(NO_CHANGE)} / 88")

    conn.close()


if __name__ == "__main__":
    main()
