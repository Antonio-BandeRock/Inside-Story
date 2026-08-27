"""
2026-08-27, direct follow-up: "Now close the remaining Hashimoto's/IBD/
CKD Mediterranean and Paleo breakfast gaps." Checked directly before
writing anything, not assumed: all 15 phase-1 AIP breakfast recipes are
already safe (green or yellow, never red) for IBD and Chronic Kidney
Disease too, since IBD's own relevant sub-criteria (Additives, Excess
Fiber or Anti-Nutrients, Oxalate x3, Processing) and CKD's own (Protein
Density, Oxalate x3) never fire on whole meat/vegetable ingredients.
Since every AIP recipe also auto-earns the Paleo tag, closing the
GENERAL AIP-breakfast gap (17 of 30, uniform across all 19 conditions)
directly closes the Paleo-breakfast gap for Hashimoto's/IBD/CKD (21 of
30 each) in the same motion -- the most efficient single action, not
three separate targeted batches.

13 new recipes, closing the general AIP-breakfast gap to exactly 30 (17
+ 13). Two new proteins verified completely clean (zero flags at all)
for Hashimoto's, IBD, and CKD alike: Chicken Breast (without skin) and
Turkey Breast (Raw), both Raw. Reuses the exact same already-
verified vegetable palette from the first AIP batch (broccoli, cabbage,
kale -- all needing a matching RECIPE_PREP_OVERRIDES entry since they're
cooked in these dishes -- carrot, fennel, zucchini, all raw-safe), in
combinations genuinely distinct from that first batch's own 12
protein-vegetable pairings.

Usage:
  py scripts/add_aip_breakfast_batch2.py
  node scripts/generate_aip_breakfast_batch2_recipes_ts.js
"""
import json
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "assets" / "data" / "foods_reference.db"

CHICKEN_BREAST = ("Meat", "Chicken Breast (without skin)")
TURKEY_BREAST = ("Meat", "Turkey Breast (Raw)")
BEEF_SIRLOIN = ("Meat", "Beef Top Sirloin (Raw)")
PORK_TENDERLOIN = ("Meat", "Pork Fillet / Tenderloin (Raw)")
SALMON = ("Meat", "Salmon Fillet (Raw)")
HALIBUT = ("Meat", "Halibut Fish (Raw)")
COD = ("Meat", "Cod Fish")

BROCCOLI = ("Veg", "Broccoli")
CABBAGE = ("Veg", "Cabbage")
KALE = ("Veg", "Kale")
CARROT = ("Veg", "Carrot")
FENNEL = ("Veg", "Fennel Bulb")
ZUCCHINI = ("Veg", "Squash, zucchini")

AVOCADO = ("Fruit", "Avocado")
LIME = ("Fruit", "Lime")
SALT = ("Herbs", "Common salt/table salt")

RECIPES = [
    ("curated_snack_chicken_broccoli_breakfast_bowl", "snack",
     "Chicken & Broccoli Breakfast Bowl",
     "Baked chicken breast with roasted broccoli and carrot, finished with avocado.",
     "Chicken breast, broccoli, and carrot all check completely clean for Hashimoto's, IBD, and CKD alike.",
     1.0, 1.0, "bowl", 700,
     [(*CHICKEN_BREAST, 100, "g", None, "baked", None), (*BROCCOLI, 50, "g", "cut into florets", "roasted", None),
      (*CARROT, 40, "g", "sliced", "roasted", None), (*AVOCADO, 30, "g", "sliced", None, None),
      (*SALT, 0.25, "tsp", None, None, None)],
     ["Preheat the oven to 400F (200C).",
      "Toss the broccoli and carrot with the salt and roast for 12-15 minutes.",
      "Add the chicken breast to the sheet and bake for another 15-18 minutes, until cooked through.",
      "Slice the chicken and serve over the roasted vegetables with the sliced avocado."]),
    ("curated_snack_chicken_cabbage_breakfast_skillet", "snack",
     "Chicken & Cabbage Breakfast Skillet",
     "Seared chicken breast with cabbage and carrot braised soft.",
     "Chicken breast, cabbage, and carrot all check completely clean for Hashimoto's, IBD, and CKD alike.",
     1.0, 1.0, "bowl", 701,
     [(*CHICKEN_BREAST, 100, "g", "sliced", "seared", None), (*CABBAGE, 50, "g", "shredded", "braised", None),
      (*CARROT, 40, "g", "sliced", "braised", None), (*SALT, 0.25, "tsp", None, None, None)],
     ["Combine the cabbage and carrot in a covered pan with a splash of water, and braise over medium-low heat for 10-12 minutes.",
      "Season the sliced chicken with the salt and sear in a dry, hot pan for 4-5 minutes per side, until cooked through.",
      "Serve the chicken over the braised cabbage and carrot."]),
    ("curated_snack_chicken_kale_breakfast_hash", "snack",
     "Chicken & Kale Breakfast Hash",
     "A quick morning hash of seared chicken breast, braised kale, and carrot, finished with avocado.",
     "Chicken breast, kale, and carrot all check completely clean for Hashimoto's, IBD, and CKD alike.",
     1.0, 1.0, "bowl", 702,
     [(*CHICKEN_BREAST, 100, "g", "sliced", "seared", None), (*KALE, 50, "g", "chopped", "braised", None),
      (*CARROT, 40, "g", "diced", "braised", None), (*AVOCADO, 30, "g", "sliced", None, None),
      (*SALT, 0.25, "tsp", None, None, None)],
     ["Combine the kale and carrot in a covered pan with a splash of water, and braise over medium-low heat for 8-10 minutes.",
      "Season the sliced chicken with the salt and sear in a dry, hot pan for 4-5 minutes per side, until cooked through.",
      "Serve the chicken over the braised kale and carrot, topped with the sliced avocado."]),
    ("curated_snack_chicken_zucchini_breakfast_skillet", "snack",
     "Chicken & Zucchini Breakfast Skillet",
     "Chicken breast sauteed with zucchini and carrot, finished with lime.",
     "Chicken breast, zucchini, and carrot all check completely clean for Hashimoto's, IBD, and CKD alike.",
     1.0, 1.0, "bowl", 703,
     [(*CHICKEN_BREAST, 100, "g", "diced", "sauteed", None), (*ZUCCHINI, 50, "g", "diced", "sauteed", None),
      (*CARROT, 40, "g", "julienned", "sauteed", None), (*LIME, 0.25, "each", "juiced", None, None),
      (*SALT, 0.25, "tsp", None, None, None)],
     ["Saute the diced chicken in a splash of water over medium-high heat for 6-7 minutes, until cooked through.",
      "Add the zucchini and carrot and saute for another 4-5 minutes, until tender.",
      "Stir in the lime juice and salt just before serving."]),
    ("curated_snack_turkey_broccoli_breakfast_bowl", "snack",
     "Turkey & Broccoli Breakfast Bowl",
     "Baked turkey breast with roasted broccoli and carrot, finished with avocado.",
     "Turkey breast, broccoli, and carrot all check completely clean for Hashimoto's, IBD, and CKD alike.",
     1.0, 1.0, "bowl", 704,
     [(*TURKEY_BREAST, 100, "g", None, "baked", None), (*BROCCOLI, 50, "g", "cut into florets", "roasted", None),
      (*CARROT, 40, "g", "sliced", "roasted", None), (*AVOCADO, 30, "g", "sliced", None, None),
      (*SALT, 0.25, "tsp", None, None, None)],
     ["Preheat the oven to 400F (200C).",
      "Toss the broccoli and carrot with the salt and roast for 12-15 minutes.",
      "Add the turkey breast to the sheet and bake for another 15-18 minutes, until cooked through.",
      "Slice the turkey and serve over the roasted vegetables with the sliced avocado."]),
    ("curated_snack_turkey_cabbage_breakfast_skillet", "snack",
     "Turkey & Cabbage Breakfast Skillet",
     "Seared turkey breast with cabbage and carrot braised soft.",
     "Turkey breast, cabbage, and carrot all check completely clean for Hashimoto's, IBD, and CKD alike.",
     1.0, 1.0, "bowl", 705,
     [(*TURKEY_BREAST, 100, "g", "sliced", "seared", None), (*CABBAGE, 50, "g", "shredded", "braised", None),
      (*CARROT, 40, "g", "sliced", "braised", None), (*SALT, 0.25, "tsp", None, None, None)],
     ["Combine the cabbage and carrot in a covered pan with a splash of water, and braise over medium-low heat for 10-12 minutes.",
      "Season the sliced turkey with the salt and sear in a dry, hot pan for 4-5 minutes per side, until cooked through.",
      "Serve the turkey over the braised cabbage and carrot."]),
    ("curated_snack_turkey_kale_breakfast_hash", "snack",
     "Turkey & Kale Breakfast Hash",
     "A quick morning hash of seared turkey breast, braised kale, and carrot, finished with avocado.",
     "Turkey breast, kale, and carrot all check completely clean for Hashimoto's, IBD, and CKD alike.",
     1.0, 1.0, "bowl", 706,
     [(*TURKEY_BREAST, 100, "g", "sliced", "seared", None), (*KALE, 50, "g", "chopped", "braised", None),
      (*CARROT, 40, "g", "diced", "braised", None), (*AVOCADO, 30, "g", "sliced", None, None),
      (*SALT, 0.25, "tsp", None, None, None)],
     ["Combine the kale and carrot in a covered pan with a splash of water, and braise over medium-low heat for 8-10 minutes.",
      "Season the sliced turkey with the salt and sear in a dry, hot pan for 4-5 minutes per side, until cooked through.",
      "Serve the turkey over the braised kale and carrot, topped with the sliced avocado."]),
    ("curated_snack_turkey_fennel_breakfast_bowl", "snack",
     "Turkey & Fennel Breakfast Bowl",
     "Baked turkey breast with roasted fennel and zucchini.",
     "Turkey breast, fennel, and zucchini all check completely clean for Hashimoto's, IBD, and CKD alike.",
     1.0, 1.0, "bowl", 707,
     [(*TURKEY_BREAST, 100, "g", None, "baked", None), (*FENNEL, 50, "g", "sliced", "roasted", None),
      (*ZUCCHINI, 40, "g", "diced", "roasted", None), (*SALT, 0.25, "tsp", None, None, None)],
     ["Preheat the oven to 400F (200C).",
      "Toss the fennel and zucchini with the salt and roast for 10 minutes.",
      "Add the turkey breast to the sheet and bake for another 15-18 minutes, until cooked through."]),
    ("curated_snack_beef_fennel_breakfast_bowl", "snack",
     "Beef & Fennel Breakfast Bowl",
     "Seared beef sirloin with roasted fennel and zucchini, finished with avocado.",
     "Beef top sirloin, fennel, and zucchini all check completely clean for Hashimoto's, IBD, and CKD alike.",
     1.0, 1.0, "bowl", 708,
     [(*BEEF_SIRLOIN, 90, "g", "sliced", "seared", None), (*FENNEL, 50, "g", "sliced", "roasted", None),
      (*ZUCCHINI, 40, "g", "diced", "roasted", None), (*AVOCADO, 30, "g", "sliced", None, None),
      (*SALT, 0.25, "tsp", None, None, None)],
     ["Preheat the oven to 400F (200C) and roast the fennel and zucchini with the salt for 15-18 minutes.",
      "Season the sliced beef and sear in a dry, hot pan for 2-3 minutes per side.",
      "Serve the beef over the roasted vegetables, topped with the sliced avocado."]),
    ("curated_snack_pork_broccoli_breakfast_skillet", "snack",
     "Pork & Broccoli Breakfast Skillet",
     "Seared pork tenderloin with roasted broccoli and carrot.",
     "Pork tenderloin, broccoli, and carrot all check completely clean for Hashimoto's, IBD, and CKD alike.",
     1.0, 1.0, "bowl", 709,
     [(*PORK_TENDERLOIN, 90, "g", "sliced", "seared", None), (*BROCCOLI, 50, "g", "cut into florets", "roasted", None),
      (*CARROT, 40, "g", "sliced", "roasted", None), (*SALT, 0.25, "tsp", None, None, None)],
     ["Preheat the oven to 400F (200C) and roast the broccoli and carrot with the salt for 15 minutes.",
      "Season the sliced pork and sear in a dry, hot pan for 2-3 minutes per side.",
      "Serve the pork over the roasted broccoli and carrot."]),
    ("curated_snack_salmon_kale_breakfast_bowl", "snack",
     "Salmon & Kale Breakfast Bowl",
     "Baked salmon with braised kale and carrot, finished with avocado.",
     "Salmon, kale, and carrot all check completely clean for Hashimoto's, IBD, and CKD alike.",
     1.0, 1.0, "bowl", 710,
     [(*SALMON, 90, "g", None, "baked", None), (*KALE, 50, "g", "chopped", "braised", None),
      (*CARROT, 40, "g", "diced", "braised", None), (*AVOCADO, 30, "g", "sliced", None, None),
      (*SALT, 0.25, "tsp", None, None, None)],
     ["Combine the kale and carrot in a covered pan with a splash of water, and braise over medium-low heat for 8-10 minutes.",
      "Season the salmon with the salt and bake at 400F (200C) for 12-15 minutes, until it flakes easily.",
      "Serve the salmon over the braised kale and carrot, topped with the sliced avocado."]),
    ("curated_snack_halibut_broccoli_breakfast_bowl", "snack",
     "Halibut & Broccoli Breakfast Bowl",
     "Baked halibut with roasted broccoli and carrot.",
     "Halibut, broccoli, and carrot all check completely clean for Hashimoto's, IBD, and CKD alike.",
     1.0, 1.0, "bowl", 711,
     [(*HALIBUT, 90, "g", None, "baked", None), (*BROCCOLI, 50, "g", "cut into florets", "roasted", None),
      (*CARROT, 40, "g", "sliced", "roasted", None), (*SALT, 0.25, "tsp", None, None, None)],
     ["Preheat the oven to 400F (200C) and toss the broccoli and carrot with the salt.",
      "Roast for 12 minutes, then add the halibut fillet and roast for another 12-15 minutes, until it flakes easily."]),
    ("curated_snack_cod_kale_breakfast_skillet", "snack",
     "Cod & Kale Breakfast Skillet",
     "Pan-seared cod with braised kale and carrot.",
     "Cod, kale, and carrot all check completely clean for Hashimoto's, IBD, and CKD alike.",
     1.0, 1.0, "bowl", 712,
     [(*COD, 90, "g", None, "seared", None), (*KALE, 50, "g", "chopped", "braised", None),
      (*CARROT, 40, "g", "diced", "braised", None), (*SALT, 0.25, "tsp", None, None, None)],
     ["Combine the kale and carrot in a covered pan with a splash of water, and braise over medium-low heat for 8-10 minutes.",
      "Season the cod with the salt and sear in a dry, hot pan for 3-4 minutes per side, until it flakes easily.",
      "Serve the cod over the braised kale and carrot."]),
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
    json_path = Path(__file__).resolve().parent / "_aip_breakfast_batch2_data.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2)
    print(f"Wrote {len(out)} recipes to {json_path}")


if __name__ == "__main__":
    main()
