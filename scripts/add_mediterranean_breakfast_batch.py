"""
2026-08-27, Open Next Steps item 20, phase 2: the real, structural,
condition-agnostic Mediterranean breakfast shortage (4 recipes for
Hashimoto's, 16 for every other condition, against the 30-minimum bar),
left untouched by phase 1's AIP-focused batch since Mediterranean needs
a genuinely different ingredient palette (olive oil present, no red
meat -- this app's own real diet-tag rule, confirmed in scripts/
compute_recipe_diet_tags.js -- rather than AIP's dairy-free/egg-free/
nightshade-free one).

Every ingredient individually verified against the live database's own
food_scores/sub_criterion_condition_relevance for Hashimoto's before
being used, not assumed clean because it's "Mediterranean." Two real,
confirmed-red exclusions found and avoided, the same still-open,
already-named Mineral Binding Risk data question from this app's own
2026-08-26/27 history: Walnut (Mineral Binding Risk: High) and dried
Basil/Oregano (Iron, contextual: Excess Risk -- no fresh/non-dried row
exists for either in this database). Pistachio nut was checked and kept:
its own Mineral Binding Risk sits at Moderate (yellow), not High (red).
Olive oil itself carries one real, already-known yellow flag for
Hashimoto's (Omega-3 vs 6: Imbalanced), true of every Mediterranean
recipe in this app by definition, still meal-generator-safe (green or
yellow, never red).

15 new recipes: 8 savory olive-oil-and-egg skillets (paired with tomato,
zucchini, red bell pepper, fennel, leek, carrot, feta), and 7 Greek-
yogurt-and-olive-oil bowls (an authentic Cretan combination, paired with
fruit, pistachio, and maple syrup), reusing already-verified-clean fruit
from this session's own earlier batches. All 15 use builder_type
'snack', matching this app's own established breakfast convention, and
are added to BREAKFAST_ELIGIBLE_RECIPE_IDS (lib/dailyMealPlan.ts).

Usage:
  py scripts/add_mediterranean_breakfast_batch.py
  node scripts/generate_mediterranean_breakfast_recipes_ts.js
  node scripts/compute_recipe_condition_data.js
  node scripts/apply_recipe_condition_cautions.js
  node scripts/apply_new_stage_advisory_notes.js
  node scripts/compute_recipe_diet_tags.js
  node scripts/apply_recipe_diet_tags.js
"""
import json
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "assets" / "data" / "foods_reference.db"

OLIVE_OIL = ("Fats", "Olive Oil (Extra Virgin)")
EGG = ("Dairy", "Chicken Egg (Raw)")
GREEK_YOGURT = ("Dairy", "Yogurt, Greek, plain, lowfat")
FETA = ("Dairy", "Feta")
PISTACHIO = ("NutSeed", "Pistachio nut")

TOMATO = ("Veg", "Tomato")
ZUCCHINI = ("Veg", "Squash, zucchini")
RED_BELL_PEPPER = ("Veg", "Red Bell Pepper")
FENNEL = ("Veg", "Fennel Bulb")
LEEK = ("Veg", "Leek")
CARROT = ("Veg", "Carrot")

ORANGE = ("Fruit", "Orange")
GRAPEFRUIT = ("Fruit", "Grapefruit")
BANANA = ("Fruit", "Banana")
BLUEBERRY = ("Fruit", "Blueberry")
STRAWBERRY = ("Fruit", "Strawberry")
CANTALOUPE = ("Fruit", "Cantaloupe Melon")
APPLE = ("Fruit", "Apple")

MAPLE_SYRUP = ("Sweets", "Maple Syrup (100% Pure)")
CINNAMON = ("Herbs", "Spices, cinnamon, ground")
CILANTRO = ("Veg", "Coriander (cilantro) leaves")
SALT = ("Herbs", "Common salt/table salt")

RECIPES = [
    ("curated_snack_greek_yogurt_olive_oil_pistachio_bowl", "snack",
     "Greek Yogurt with Olive Oil, Maple Syrup & Pistachio",
     "Plain Greek yogurt drizzled with real olive oil and maple syrup, topped with pistachio, an authentic Mediterranean pairing.",
     "Greek yogurt, olive oil, and pistachio all check safe for Hashimoto's, olive oil itself carries the same real Omega-3-vs-6 flag every Mediterranean recipe in this app shares.",
     1.0, 1.0, "bowl", 600,
     [(*GREEK_YOGURT, 170, "g", None, None, None), (*OLIVE_OIL, 1, "tbsp", None, None, None),
      (*MAPLE_SYRUP, 1, "tbsp", None, None, None), (*PISTACHIO, 15, "g", "chopped", None, None)],
     ["Spoon the Greek yogurt into a bowl.",
      "Drizzle with the olive oil and maple syrup, and top with the chopped pistachio."]),
    ("curated_snack_mediterranean_egg_tomato_zucchini_skillet", "snack",
     "Mediterranean Egg, Tomato & Zucchini Skillet",
     "Eggs cooked in real olive oil with tomato and zucchini, a real savory Mediterranean breakfast.",
     "Egg, tomato, and zucchini all check safe for Hashimoto's.",
     1.0, 1.0, "plate", 601,
     [(*EGG, 2, "each", None, "fried", None), (*OLIVE_OIL, 1, "tbsp", None, None, None),
      (*TOMATO, 60, "g", "diced", "sauteed", None), (*ZUCCHINI, 50, "g", "diced", "sauteed", None),
      (*SALT, 0.25, "tsp", None, None, None)],
     ["Heat the olive oil in a pan over medium heat and add the tomato and zucchini.",
      "Saute for 4-5 minutes, until softened.",
      "Crack the eggs into the pan and cook to your liking, seasoning with the salt."]),
    ("curated_snack_mediterranean_feta_tomato_egg_scramble", "snack",
     "Mediterranean Feta, Tomato & Egg Scramble",
     "Scrambled eggs with feta and tomato, cooked in real olive oil.",
     "Egg, feta, and tomato all check safe for Hashimoto's, feta itself checks completely clean.",
     1.0, 1.0, "plate", 602,
     [(*EGG, 2, "each", "beaten", "scrambled", None), (*OLIVE_OIL, 1, "tbsp", None, None, None),
      (*FETA, 30, "g", "crumbled", None, None), (*TOMATO, 50, "g", "diced", None, None),
      (*SALT, 0.25, "tsp", None, None, None)],
     ["Heat the olive oil in a pan over medium heat.",
      "Add the beaten eggs and diced tomato, and scramble gently.",
      "Fold in the crumbled feta just before the eggs finish setting, and season with the salt."]),
    ("curated_snack_greek_yogurt_berry_olive_oil_bowl", "snack",
     "Greek Yogurt with Berries & Olive Oil",
     "Plain Greek yogurt with blueberry and strawberry, finished with olive oil and maple syrup.",
     "Greek yogurt, blueberry, and strawberry all check safe for Hashimoto's.",
     1.0, 1.0, "bowl", 603,
     [(*GREEK_YOGURT, 170, "g", None, None, None), (*BLUEBERRY, 40, "g", None, None, None),
      (*STRAWBERRY, 40, "g", "halved", None, None), (*OLIVE_OIL, 1, "tsp", None, None, None),
      (*MAPLE_SYRUP, 1, "tbsp", None, None, None)],
     ["Spoon the Greek yogurt into a bowl and top with the blueberries and halved strawberries.",
      "Finish with a drizzle of olive oil and the maple syrup."]),
    ("curated_snack_mediterranean_tomato_pepper_egg_skillet", "snack",
     "Mediterranean Tomato, Pepper & Egg Skillet",
     "Eggs cooked into a real tomato and red bell pepper skillet with olive oil, a Mediterranean-style shakshuka.",
     "Egg, tomato, and red bell pepper all check safe for Hashimoto's.",
     1.0, 1.0, "plate", 604,
     [(*EGG, 2, "each", None, "poached", None), (*OLIVE_OIL, 1, "tbsp", None, None, None),
      (*TOMATO, 80, "g", "diced", "simmered", None), (*RED_BELL_PEPPER, 40, "g", "diced", "sauteed", None),
      (*SALT, 0.25, "tsp", None, None, None)],
     ["Heat the olive oil in a pan over medium heat and add the tomato and red bell pepper.",
      "Simmer for 8-10 minutes, until the tomato breaks down into a real sauce.",
      "Make two wells in the sauce, crack in the eggs, cover, and cook for 4-5 minutes, until the whites set.",
      "Season with the salt."]),
    ("curated_snack_greek_yogurt_citrus_pistachio_bowl", "snack",
     "Greek Yogurt with Citrus & Pistachio",
     "Plain Greek yogurt with orange and grapefruit segments, olive oil, and pistachio.",
     "Greek yogurt, orange, grapefruit, and pistachio all check safe for Hashimoto's.",
     1.0, 1.0, "bowl", 605,
     [(*GREEK_YOGURT, 170, "g", None, None, None), (*ORANGE, 50, "g", "segmented", None, None),
      (*GRAPEFRUIT, 50, "g", "segmented", None, None), (*OLIVE_OIL, 1, "tsp", None, None, None),
      (*PISTACHIO, 15, "g", "chopped", None, None), (*MAPLE_SYRUP, 1, "tbsp", None, None, None)],
     ["Spoon the Greek yogurt into a bowl and top with the orange and grapefruit segments.",
      "Finish with a drizzle of olive oil, the chopped pistachio, and the maple syrup."]),
    ("curated_snack_mediterranean_zucchini_feta_egg_skillet", "snack",
     "Mediterranean Zucchini, Feta & Egg Skillet",
     "Eggs cooked with zucchini and feta in real olive oil.",
     "Egg, zucchini, and feta all check safe for Hashimoto's, feta itself checks completely clean.",
     1.0, 1.0, "plate", 606,
     [(*EGG, 2, "each", None, "fried", None), (*OLIVE_OIL, 1, "tbsp", None, None, None),
      (*ZUCCHINI, 60, "g", "diced", "sauteed", None), (*FETA, 30, "g", "crumbled", None, None),
      (*SALT, 0.25, "tsp", None, None, None)],
     ["Heat the olive oil in a pan over medium heat and saute the zucchini for 4-5 minutes, until softened.",
      "Crack in the eggs and cook to your liking.",
      "Top with the crumbled feta and season with the salt."]),
    ("curated_snack_greek_yogurt_banana_pistachio_bowl", "snack",
     "Greek Yogurt with Banana & Pistachio",
     "Plain Greek yogurt with sliced banana, olive oil, pistachio, and maple syrup.",
     "Greek yogurt, banana, and pistachio all check safe for Hashimoto's.",
     1.0, 1.0, "bowl", 607,
     [(*GREEK_YOGURT, 170, "g", None, None, None), (*BANANA, 80, "g", "sliced", None, None),
      (*OLIVE_OIL, 1, "tsp", None, None, None), (*PISTACHIO, 15, "g", "chopped", None, None),
      (*MAPLE_SYRUP, 1, "tbsp", None, None, None)],
     ["Spoon the Greek yogurt into a bowl and top with the sliced banana.",
      "Finish with a drizzle of olive oil, the chopped pistachio, and the maple syrup."]),
    ("curated_snack_mediterranean_fennel_tomato_egg_skillet", "snack",
     "Mediterranean Fennel, Tomato & Egg Skillet",
     "Eggs cooked with fennel and tomato in real olive oil.",
     "Egg, fennel, and tomato all check safe for Hashimoto's.",
     1.0, 1.0, "plate", 608,
     [(*EGG, 2, "each", None, "fried", None), (*OLIVE_OIL, 1, "tbsp", None, None, None),
      (*FENNEL, 50, "g", "sliced", "sauteed", None), (*TOMATO, 50, "g", "diced", "sauteed", None),
      (*SALT, 0.25, "tsp", None, None, None)],
     ["Heat the olive oil in a pan over medium heat and saute the fennel and tomato for 5-6 minutes, until softened.",
      "Crack in the eggs and cook to your liking, seasoning with the salt."]),
    ("curated_snack_greek_yogurt_apple_cinnamon_olive_oil_bowl", "snack",
     "Greek Yogurt with Apple, Cinnamon & Olive Oil",
     "Plain Greek yogurt with diced apple, cinnamon, olive oil, and maple syrup.",
     "Greek yogurt and apple both check safe for Hashimoto's.",
     1.0, 1.0, "bowl", 609,
     [(*GREEK_YOGURT, 170, "g", None, None, None), (*APPLE, 70, "g", "diced", None, None),
      (*CINNAMON, 0.25, "tsp", None, None, None), (*OLIVE_OIL, 1, "tsp", None, None, None),
      (*MAPLE_SYRUP, 1, "tbsp", None, None, None)],
     ["Spoon the Greek yogurt into a bowl and top with the diced apple and cinnamon.",
      "Finish with a drizzle of olive oil and the maple syrup."]),
    ("curated_snack_mediterranean_leek_tomato_egg_skillet", "snack",
     "Mediterranean Leek, Tomato & Egg Skillet",
     "Eggs cooked with leek and tomato in real olive oil.",
     "Egg, leek, and tomato all check safe for Hashimoto's.",
     1.0, 1.0, "plate", 610,
     [(*EGG, 2, "each", None, "fried", None), (*OLIVE_OIL, 1, "tbsp", None, None, None),
      (*LEEK, 50, "g", "sliced", "sauteed", None), (*TOMATO, 50, "g", "diced", "sauteed", None),
      (*SALT, 0.25, "tsp", None, None, None)],
     ["Heat the olive oil in a pan over medium heat and saute the leek and tomato for 5-6 minutes, until softened.",
      "Crack in the eggs and cook to your liking, seasoning with the salt."]),
    ("curated_snack_greek_yogurt_cantaloupe_pistachio_bowl", "snack",
     "Greek Yogurt with Cantaloupe & Pistachio",
     "Plain Greek yogurt with diced cantaloupe, olive oil, and pistachio.",
     "Greek yogurt, cantaloupe, and pistachio all check safe for Hashimoto's.",
     1.0, 1.0, "bowl", 611,
     [(*GREEK_YOGURT, 170, "g", None, None, None), (*CANTALOUPE, 80, "g", "diced", None, None),
      (*OLIVE_OIL, 1, "tsp", None, None, None), (*PISTACHIO, 15, "g", "chopped", None, None)],
     ["Spoon the Greek yogurt into a bowl and top with the diced cantaloupe.",
      "Finish with a drizzle of olive oil and the chopped pistachio."]),
    ("curated_snack_mediterranean_pepper_feta_egg_skillet", "snack",
     "Mediterranean Pepper, Feta & Egg Skillet",
     "Eggs cooked with red bell pepper and feta in real olive oil.",
     "Egg, red bell pepper, and feta all check safe for Hashimoto's, feta itself checks completely clean.",
     1.0, 1.0, "plate", 612,
     [(*EGG, 2, "each", None, "fried", None), (*OLIVE_OIL, 1, "tbsp", None, None, None),
      (*RED_BELL_PEPPER, 50, "g", "diced", "sauteed", None), (*FETA, 30, "g", "crumbled", None, None),
      (*SALT, 0.25, "tsp", None, None, None)],
     ["Heat the olive oil in a pan over medium heat and saute the red bell pepper for 4-5 minutes, until softened.",
      "Crack in the eggs and cook to your liking.",
      "Top with the crumbled feta and season with the salt."]),
    ("curated_snack_greek_yogurt_tropical_olive_oil_bowl", "snack",
     "Greek Yogurt with Orange, Banana & Olive Oil",
     "Plain Greek yogurt with orange and banana, olive oil, and maple syrup.",
     "Greek yogurt, orange, and banana all check safe for Hashimoto's.",
     1.0, 1.0, "bowl", 613,
     [(*GREEK_YOGURT, 170, "g", None, None, None), (*ORANGE, 50, "g", "segmented", None, None),
      (*BANANA, 60, "g", "sliced", None, None), (*OLIVE_OIL, 1, "tsp", None, None, None),
      (*MAPLE_SYRUP, 1, "tbsp", None, None, None)],
     ["Spoon the Greek yogurt into a bowl and top with the orange segments and sliced banana.",
      "Finish with a drizzle of olive oil and the maple syrup."]),
    ("curated_snack_mediterranean_carrot_zucchini_egg_skillet", "snack",
     "Mediterranean Carrot, Zucchini & Egg Skillet",
     "Eggs cooked with carrot and zucchini in real olive oil, finished with cilantro.",
     "Egg, carrot, and zucchini all check safe for Hashimoto's.",
     1.0, 1.0, "plate", 614,
     [(*EGG, 2, "each", None, "fried", None), (*OLIVE_OIL, 1, "tbsp", None, None, None),
      (*CARROT, 40, "g", "sliced", "sauteed", None), (*ZUCCHINI, 50, "g", "diced", "sauteed", None),
      (*CILANTRO, 5, "g", "chopped", None, None), (*SALT, 0.25, "tsp", None, None, None)],
     ["Heat the olive oil in a pan over medium heat and saute the carrot and zucchini for 5-6 minutes, until softened.",
      "Crack in the eggs and cook to your liking.",
      "Season with the salt and finish with the fresh cilantro."]),
]


def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    for recipe_id, builder_type, name, flavor_profile, health_benefit, servings, serving_size_amount, \
            serving_size_unit, sort_order, ingredients, instructions in RECIPES:
        cur.execute(
            """
            INSERT INTO curated_recipes
                (id, builder_type, name, flavor_profile, health_benefit, servings,
                 serving_size_amount, serving_size_unit, sort_order, instructions)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                builder_type = excluded.builder_type, name = excluded.name,
                flavor_profile = excluded.flavor_profile, health_benefit = excluded.health_benefit,
                servings = excluded.servings, serving_size_amount = excluded.serving_size_amount,
                serving_size_unit = excluded.serving_size_unit, sort_order = excluded.sort_order,
                instructions = excluded.instructions
            """,
            (recipe_id, builder_type, name, flavor_profile, health_benefit, servings,
             serving_size_amount, serving_size_unit, sort_order, json.dumps(instructions)),
        )
        cur.execute("DELETE FROM curated_recipe_ingredients WHERE recipe_id = ?", (recipe_id,))
        for i, (category, base_name, quantity, unit, cut_prep, cooking_method, prep_note) in enumerate(ingredients):
            cur.execute(
                """
                INSERT INTO curated_recipe_ingredients
                    (recipe_id, category, base_name, quantity, unit, cut_prep, cooking_method, prep_note, sort_order)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (recipe_id, category, base_name, quantity, unit, cut_prep, cooking_method, prep_note, i),
            )

    conn.commit()
    total_ingredients = sum(len(r[9]) for r in RECIPES)
    print(f"Upserted {len(RECIPES)} curated_recipes rows, {total_ingredients} curated_recipe_ingredients rows.")
    conn.close()

    out = []
    for (recipe_id, builder_type, name, flavor_profile, health_benefit, servings, serving_size_amount,
         serving_size_unit, sort_order, ingredients, instructions) in RECIPES:
        out.append({
            "id": recipe_id, "builderType": builder_type, "name": name,
            "flavorProfile": flavor_profile, "healthBenefit": health_benefit,
            "servings": servings, "servingSizeAmount": serving_size_amount, "servingSizeUnit": serving_size_unit,
            "ingredients": [
                {"category": c, "baseName": b, "quantity": q, "unit": u, "cutPrep": cp, "cookingMethod": cm, "prepNote": pn}
                for (c, b, q, u, cp, cm, pn) in ingredients
            ],
            "instructions": instructions,
        })
    json_path = Path(__file__).resolve().parent / "_mediterranean_breakfast_data.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2)
    print(f"Wrote {len(out)} recipes to {json_path}")


if __name__ == "__main__":
    main()
