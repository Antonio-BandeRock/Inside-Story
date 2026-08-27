"""
2026-08-27, direct follow-up: "Now close the remaining Hashimoto's/IBD/
CKD Mediterranean and Paleo breakfast gaps." Confirmed via scripts/
audit_meal_plan_recipe_coverage.js before writing anything: Mediterranean
breakfast sat at hashimotos=19 (need +11), ibd=24 (need +6),
chronic_kidney_disease=24 (need +6). All 15 phase-1 Mediterranean
breakfast recipes were checked directly and found safe (green or
yellow, never red) for IBD and CKD too, so this second batch reuses the
exact same already-verified-clean palette (egg, feta, Greek yogurt,
olive oil, pistachio, tomato, zucchini, red bell pepper, fennel, leek,
carrot, and already-verified fruit) in 11 new combinations, genuinely
distinct from the first batch's own 15.

11 new recipes closes Hashimoto's own Mediterranean-breakfast gap
outright (19 + 11 = 30) and over-closes IBD/CKD's (24 + 11 = 35, past
their own +6 need).

Usage:
  py scripts/add_mediterranean_breakfast_batch2.py
  node scripts/generate_mediterranean_breakfast_batch2_recipes_ts.js
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

STRAWBERRY = ("Fruit", "Strawberry")
BLUEBERRY = ("Fruit", "Blueberry")
GRAPEFRUIT = ("Fruit", "Grapefruit")
APPLE = ("Fruit", "Apple")
CANTALOUPE = ("Fruit", "Cantaloupe Melon")

MAPLE_SYRUP = ("Sweets", "Maple Syrup (100% Pure)")
SALT = ("Herbs", "Common salt/table salt")

RECIPES = [
    ("curated_snack_mediterranean_fennel_feta_egg_skillet", "snack",
     "Mediterranean Fennel, Feta & Egg Skillet",
     "Eggs cooked with fennel and feta in real olive oil.",
     "Egg, fennel, and feta all check safe for Hashimoto's, IBD, and CKD alike, feta itself checks completely clean.",
     1.0, 1.0, "plate", 800,
     [(*EGG, 2, "each", None, "fried", None), (*OLIVE_OIL, 1, "tbsp", None, None, None),
      (*FENNEL, 50, "g", "sliced", "sauteed", None), (*FETA, 30, "g", "crumbled", None, None),
      (*SALT, 0.25, "tsp", None, None, None)],
     ["Heat the olive oil in a pan over medium heat and saute the fennel for 5-6 minutes, until softened.",
      "Crack in the eggs and cook to your liking.",
      "Top with the crumbled feta and season with the salt."]),
    ("curated_snack_mediterranean_leek_feta_egg_skillet", "snack",
     "Mediterranean Leek, Feta & Egg Skillet",
     "Eggs cooked with leek and feta in real olive oil.",
     "Egg, leek, and feta all check safe for Hashimoto's, IBD, and CKD alike, feta itself checks completely clean.",
     1.0, 1.0, "plate", 801,
     [(*EGG, 2, "each", None, "fried", None), (*OLIVE_OIL, 1, "tbsp", None, None, None),
      (*LEEK, 50, "g", "sliced", "sauteed", None), (*FETA, 30, "g", "crumbled", None, None),
      (*SALT, 0.25, "tsp", None, None, None)],
     ["Heat the olive oil in a pan over medium heat and saute the leek for 5-6 minutes, until softened.",
      "Crack in the eggs and cook to your liking.",
      "Top with the crumbled feta and season with the salt."]),
    ("curated_snack_mediterranean_carrot_tomato_egg_skillet", "snack",
     "Mediterranean Carrot, Tomato & Egg Skillet",
     "Eggs cooked with carrot and tomato in real olive oil.",
     "Egg, carrot, and tomato all check safe for Hashimoto's, IBD, and CKD alike.",
     1.0, 1.0, "plate", 802,
     [(*EGG, 2, "each", None, "fried", None), (*OLIVE_OIL, 1, "tbsp", None, None, None),
      (*CARROT, 40, "g", "sliced", "sauteed", None), (*TOMATO, 50, "g", "diced", "sauteed", None),
      (*SALT, 0.25, "tsp", None, None, None)],
     ["Heat the olive oil in a pan over medium heat and saute the carrot and tomato for 5-6 minutes, until softened.",
      "Crack in the eggs and cook to your liking, seasoning with the salt."]),
    ("curated_snack_mediterranean_zucchini_tomato_feta_skillet", "snack",
     "Mediterranean Zucchini, Tomato & Feta Skillet",
     "Eggs cooked with zucchini, tomato, and feta in real olive oil.",
     "Egg, zucchini, tomato, and feta all check safe for Hashimoto's, IBD, and CKD alike.",
     1.0, 1.0, "plate", 803,
     [(*EGG, 2, "each", None, "fried", None), (*OLIVE_OIL, 1, "tbsp", None, None, None),
      (*ZUCCHINI, 50, "g", "diced", "sauteed", None), (*TOMATO, 40, "g", "diced", "sauteed", None),
      (*FETA, 30, "g", "crumbled", None, None), (*SALT, 0.25, "tsp", None, None, None)],
     ["Heat the olive oil in a pan over medium heat and saute the zucchini and tomato for 5-6 minutes, until softened.",
      "Crack in the eggs and cook to your liking.",
      "Top with the crumbled feta and season with the salt."]),
    ("curated_snack_mediterranean_pepper_zucchini_egg_skillet", "snack",
     "Mediterranean Pepper & Zucchini Egg Skillet",
     "Eggs cooked with red bell pepper and zucchini in real olive oil.",
     "Egg, red bell pepper, and zucchini all check safe for Hashimoto's, IBD, and CKD alike.",
     1.0, 1.0, "plate", 804,
     [(*EGG, 2, "each", None, "fried", None), (*OLIVE_OIL, 1, "tbsp", None, None, None),
      (*RED_BELL_PEPPER, 40, "g", "diced", "sauteed", None), (*ZUCCHINI, 50, "g", "diced", "sauteed", None),
      (*SALT, 0.25, "tsp", None, None, None)],
     ["Heat the olive oil in a pan over medium heat and saute the red bell pepper and zucchini for 5-6 minutes, until softened.",
      "Crack in the eggs and cook to your liking, seasoning with the salt."]),
    ("curated_snack_mediterranean_fennel_zucchini_egg_skillet", "snack",
     "Mediterranean Fennel & Zucchini Egg Skillet",
     "Eggs cooked with fennel and zucchini in real olive oil.",
     "Egg, fennel, and zucchini all check safe for Hashimoto's, IBD, and CKD alike.",
     1.0, 1.0, "plate", 805,
     [(*EGG, 2, "each", None, "fried", None), (*OLIVE_OIL, 1, "tbsp", None, None, None),
      (*FENNEL, 40, "g", "sliced", "sauteed", None), (*ZUCCHINI, 50, "g", "diced", "sauteed", None),
      (*SALT, 0.25, "tsp", None, None, None)],
     ["Heat the olive oil in a pan over medium heat and saute the fennel and zucchini for 5-6 minutes, until softened.",
      "Crack in the eggs and cook to your liking, seasoning with the salt."]),
    ("curated_snack_greek_yogurt_strawberry_pistachio_bowl", "snack",
     "Greek Yogurt with Strawberry, Pistachio & Olive Oil",
     "Plain Greek yogurt with strawberry, olive oil, and pistachio.",
     "Greek yogurt, strawberry, and pistachio all check safe for Hashimoto's, IBD, and CKD alike.",
     1.0, 1.0, "bowl", 806,
     [(*GREEK_YOGURT, 170, "g", None, None, None), (*STRAWBERRY, 60, "g", "halved", None, None),
      (*OLIVE_OIL, 1, "tsp", None, None, None), (*PISTACHIO, 15, "g", "chopped", None, None),
      (*MAPLE_SYRUP, 1, "tbsp", None, None, None)],
     ["Spoon the Greek yogurt into a bowl and top with the halved strawberries.",
      "Finish with a drizzle of olive oil, the chopped pistachio, and the maple syrup."]),
    ("curated_snack_greek_yogurt_blueberry_olive_oil_bowl", "snack",
     "Greek Yogurt with Blueberry & Olive Oil",
     "Plain Greek yogurt with blueberry, olive oil, and maple syrup.",
     "Greek yogurt and blueberry both check safe for Hashimoto's, IBD, and CKD alike.",
     1.0, 1.0, "bowl", 807,
     [(*GREEK_YOGURT, 170, "g", None, None, None), (*BLUEBERRY, 70, "g", None, None, None),
      (*OLIVE_OIL, 1, "tsp", None, None, None), (*MAPLE_SYRUP, 1, "tbsp", None, None, None)],
     ["Spoon the Greek yogurt into a bowl and top with the blueberries.",
      "Finish with a drizzle of olive oil and the maple syrup."]),
    ("curated_snack_greek_yogurt_grapefruit_olive_oil_bowl", "snack",
     "Greek Yogurt with Grapefruit & Olive Oil",
     "Plain Greek yogurt with grapefruit segments, olive oil, and maple syrup.",
     "Greek yogurt and grapefruit both check safe for Hashimoto's, IBD, and CKD alike.",
     1.0, 1.0, "bowl", 808,
     [(*GREEK_YOGURT, 170, "g", None, None, None), (*GRAPEFRUIT, 80, "g", "segmented", None, None),
      (*OLIVE_OIL, 1, "tsp", None, None, None), (*MAPLE_SYRUP, 1, "tbsp", None, None, None)],
     ["Spoon the Greek yogurt into a bowl and top with the grapefruit segments.",
      "Finish with a drizzle of olive oil and the maple syrup."]),
    ("curated_snack_greek_yogurt_apple_pistachio_bowl", "snack",
     "Greek Yogurt with Apple & Pistachio",
     "Plain Greek yogurt with diced apple, olive oil, and pistachio.",
     "Greek yogurt, apple, and pistachio all check safe for Hashimoto's, IBD, and CKD alike.",
     1.0, 1.0, "bowl", 809,
     [(*GREEK_YOGURT, 170, "g", None, None, None), (*APPLE, 70, "g", "diced", None, None),
      (*OLIVE_OIL, 1, "tsp", None, None, None), (*PISTACHIO, 15, "g", "chopped", None, None),
      (*MAPLE_SYRUP, 1, "tbsp", None, None, None)],
     ["Spoon the Greek yogurt into a bowl and top with the diced apple.",
      "Finish with a drizzle of olive oil, the chopped pistachio, and the maple syrup."]),
    ("curated_snack_greek_yogurt_cantaloupe_olive_oil_bowl", "snack",
     "Greek Yogurt with Cantaloupe & Olive Oil",
     "Plain Greek yogurt with diced cantaloupe, olive oil, and maple syrup.",
     "Greek yogurt and cantaloupe both check safe for Hashimoto's, IBD, and CKD alike.",
     1.0, 1.0, "bowl", 810,
     [(*GREEK_YOGURT, 170, "g", None, None, None), (*CANTALOUPE, 80, "g", "diced", None, None),
      (*OLIVE_OIL, 1, "tsp", None, None, None), (*MAPLE_SYRUP, 1, "tbsp", None, None, None)],
     ["Spoon the Greek yogurt into a bowl and top with the diced cantaloupe.",
      "Finish with a drizzle of olive oil and the maple syrup."]),
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
    json_path = Path(__file__).resolve().parent / "_mediterranean_breakfast_batch2_data.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2)
    print(f"Wrote {len(out)} recipes to {json_path}")


if __name__ == "__main__":
    main()
