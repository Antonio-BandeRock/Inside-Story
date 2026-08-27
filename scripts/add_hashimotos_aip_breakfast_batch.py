"""
2026-08-27, direct follow-up: Open Next Steps item 20, the real,
structural, condition-agnostic AIP/Mediterranean/Paleo breakfast
shortage. Confirmed via scripts/audit_meal_plan_recipe_coverage.js
before writing anything: AIP breakfast sits at a uniform 2 recipes total
across EVERY one of the 19 tracked conditions (a genuine content gap,
not a per-condition safety gap -- the same low number repeats almost
everywhere because there are simply only 2 AIP-tagged breakfast recipes
in the whole corpus, and they happen to already be broadly safe).
Hashimoto's itself needs +28 to reach the 30-minimum bar; every other
condition needs +20 to +28. This is a genuinely large gap -- named
honestly as a real, phased first batch, not a full closure in one pass,
matching this project's own established precedent for oversized batches
(the 6-Week Meal Plan's own "first 2 weeks, then weeks 3-6" and the
vegan breakfast work's own "18 first, then 8 more").

15 new AIP-compliant breakfast recipes, reusing the exact same verified-
clean palette confirmed earlier the same day for the lunch/dinner batch
(salmon, halibut, cod, shrimp, beef top sirloin, pork tenderloin --
zero flags for Hashimoto's; broccoli, cabbage, kale, carrot, fennel,
zucchini, cooked; avocado as the one AIP-legal fat), reframed as smaller
breakfast portions, plus 3 fruit-only, no-cook breakfast bowls. Sweet
potato was considered and DELIBERATELY EXCLUDED after direct database
verification: it carries a genuine, real "Mineral Binding Risk: High"
flag for Hashimoto's across every real prep method (Raw/Baked/Boiled/
Canned/Fried alike, confirmed by direct query) -- this is the same
still-open, named data question from CLAUDE.md's own 2026-08-26 entry
("a related, genuinely open question... Mineral Binding Risk has no
calibrated rank or tolerance-note sibling the way Oxalate does"), not
resolved here, so sweet potato stays excluded from any Hashimoto's-
targeted batch until that question is answered. All 10 non-Apple fruits
used (banana, blueberry, cantaloupe, grapefruit, lemon, lime, orange,
papaya, pineapple, strawberry) confirmed by direct query to carry ZERO
real flagged tier for any Hashimoto's-home sub-criterion at all; apple
carries one real, mild yellow flag (Fermentability: Disruptive), still
meal-generator-safe (green-or-yellow, never red), used anyway since a
single mild yellow flag doesn't disqualify a genuinely useful fruit.

All 12 protein-based recipes use builder_type 'snack', matching this
app's own established convention that breakfast dishes overwhelmingly
sit under the generic single-serving builder (confirmed directly in
this project's own history, not guessed) -- every new id here is also
added to BREAKFAST_ELIGIBLE_RECIPE_IDS (lib/dailyMealPlan.ts), the
real, separate hand-maintained list the actual meal generator reads.

Usage:
  py scripts/add_hashimotos_aip_breakfast_batch.py
  node scripts/generate_hashimotos_aip_breakfast_recipes_ts.js
  node scripts/compute_recipe_condition_data.js
  node scripts/apply_recipe_condition_cautions.js
  node scripts/compute_recipe_diet_tags.js
  node scripts/apply_recipe_diet_tags.js
"""
import json
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "assets" / "data" / "foods_reference.db"

SALMON = ("Meat", "Salmon Fillet (Raw)")
HALIBUT = ("Meat", "Halibut Fish (Raw)")
COD = ("Meat", "Cod Fish")
SHRIMP = ("Meat", "Shrimp Crustaceans")
BEEF_SIRLOIN = ("Meat", "Beef Top Sirloin (Raw)")
PORK_TENDERLOIN = ("Meat", "Pork Fillet / Tenderloin (Raw)")

BROCCOLI = ("Veg", "Broccoli")
CABBAGE = ("Veg", "Cabbage")
KALE = ("Veg", "Kale")
CARROT = ("Veg", "Carrot")
FENNEL = ("Veg", "Fennel Bulb")
ZUCCHINI = ("Veg", "Squash, zucchini")

AVOCADO = ("Fruit", "Avocado")
LIME = ("Fruit", "Lime")
ORANGE = ("Fruit", "Orange")
GRAPEFRUIT = ("Fruit", "Grapefruit")
BANANA = ("Fruit", "Banana")
PINEAPPLE = ("Fruit", "Pineapple")
PAPAYA = ("Fruit", "Papaya")
BLUEBERRY = ("Fruit", "Blueberry")
STRAWBERRY = ("Fruit", "Strawberry")
CANTALOUPE = ("Fruit", "Cantaloupe Melon")

CILANTRO = ("Veg", "Coriander (cilantro) leaves")
SALT = ("Herbs", "Common salt/table salt")

RECIPES = [
    ("curated_snack_beef_kale_breakfast_hash", "snack",
     "Beef & Kale Breakfast Hash",
     "A quick morning hash of seared beef, braised kale, and carrot, finished with avocado.",
     "Beef top sirloin, kale, and carrot all check completely clean for Hashimoto's, a real whole-food way to start the day without grains or eggs.",
     1.0, 1.0, "bowl", 500,
     [(*BEEF_SIRLOIN, 90, "g", None, "seared", None), (*KALE, 50, "g", "chopped", "braised", None),
      (*CARROT, 40, "g", "diced", "braised", None), (*AVOCADO, 30, "g", "sliced", None, None),
      (*SALT, 0.25, "tsp", None, None, None)],
     ["Combine the kale and carrot in a covered pan with a splash of water, and braise over medium-low heat for 8-10 minutes, until soft.",
      "Season the beef with the salt and sear in a dry, hot pan for 2-3 minutes per side, then slice thin.",
      "Serve the beef over the braised kale and carrot, topped with the sliced avocado."]),
    ("curated_snack_pork_cabbage_breakfast_skillet", "snack",
     "Pork & Cabbage Breakfast Skillet",
     "Pan-seared pork tenderloin with cabbage and carrot braised soft, a savory grain-free breakfast.",
     "Pork tenderloin, cabbage, and carrot all check completely clean for Hashimoto's.",
     1.0, 1.0, "bowl", 501,
     [(*PORK_TENDERLOIN, 90, "g", "sliced", "seared", None), (*CABBAGE, 50, "g", "shredded", "braised", None),
      (*CARROT, 40, "g", "sliced", "braised", None), (*SALT, 0.25, "tsp", None, None, None)],
     ["Combine the shredded cabbage and sliced carrot in a covered pan with a splash of water, and braise over medium-low heat for 10-12 minutes, until soft.",
      "Season the sliced pork with the salt and sear in a dry, hot pan for 2-3 minutes per side, until cooked through.",
      "Serve the pork over the braised cabbage and carrot."]),
    ("curated_snack_salmon_broccoli_breakfast_bowl", "snack",
     "Salmon & Broccoli Breakfast Bowl",
     "Baked salmon with roasted broccoli and carrot, finished with avocado, a real omega-3-rich start to the day.",
     "Salmon, broccoli, and carrot all check completely clean for Hashimoto's.",
     1.0, 1.0, "bowl", 502,
     [(*SALMON, 90, "g", None, "baked", None), (*BROCCOLI, 50, "g", "cut into florets", "baked", None),
      (*CARROT, 40, "g", "sliced", "roasted", None), (*AVOCADO, 30, "g", "sliced", None, None),
      (*SALT, 0.25, "tsp", None, None, None)],
     ["Preheat the oven to 400F (200C).",
      "Toss the broccoli and carrot with the salt and spread on a baking sheet.",
      "Roast for 12-15 minutes, adding the salmon fillet to the sheet halfway through, until it flakes easily.",
      "Serve with the sliced avocado."]),
    ("curated_snack_halibut_fennel_breakfast_bowl", "snack",
     "Halibut & Fennel Breakfast Bowl",
     "Baked halibut with roasted fennel and zucchini, finished with avocado.",
     "Halibut, fennel, and zucchini all check completely clean for Hashimoto's, a real light, savory breakfast.",
     1.0, 1.0, "bowl", 503,
     [(*HALIBUT, 90, "g", None, "baked", None), (*FENNEL, 50, "g", "sliced", "roasted", None),
      (*ZUCCHINI, 40, "g", "diced", "roasted", None), (*AVOCADO, 30, "g", "sliced", None, None),
      (*SALT, 0.25, "tsp", None, None, None)],
     ["Preheat the oven to 400F (200C).",
      "Toss the fennel and zucchini with the salt and spread on a baking sheet.",
      "Roast for 10 minutes, then add the halibut fillet to the sheet and roast for another 12-15 minutes, until it flakes easily.",
      "Serve with the sliced avocado."]),
    ("curated_snack_cod_cabbage_breakfast_skillet", "snack",
     "Cod & Cabbage Breakfast Skillet",
     "Pan-seared cod with cabbage and carrot braised soft, a real light way to start the day.",
     "Cod, cabbage, and carrot all check completely clean for Hashimoto's.",
     1.0, 1.0, "bowl", 504,
     [(*COD, 90, "g", None, "seared", None), (*CABBAGE, 50, "g", "shredded", "braised", None),
      (*CARROT, 40, "g", "sliced", "braised", None), (*SALT, 0.25, "tsp", None, None, None)],
     ["Combine the shredded cabbage and sliced carrot in a covered pan with a splash of water, and braise over medium-low heat for 10-12 minutes, until soft.",
      "Season the cod with the salt and sear in a dry, hot pan for 3-4 minutes per side, until it flakes easily.",
      "Serve the cod over the braised cabbage and carrot."]),
    ("curated_snack_shrimp_zucchini_breakfast_skillet", "snack",
     "Shrimp & Zucchini Breakfast Skillet",
     "Shrimp sauteed with zucchini and carrot in a splash of water, finished with lime and avocado.",
     "Shrimp, zucchini, and carrot all check completely clean for Hashimoto's.",
     1.0, 1.0, "bowl", 505,
     [(*SHRIMP, 90, "g", None, "sauteed", None), (*ZUCCHINI, 50, "g", "diced", "sauteed", None),
      (*CARROT, 40, "g", "julienned", "sauteed", None), (*AVOCADO, 30, "g", "sliced", None, None),
      (*LIME, 0.25, "each", "juiced", None, None), (*SALT, 0.25, "tsp", None, None, None)],
     ["Saute the zucchini and carrot in a splash of water over medium-high heat for 4-5 minutes, until just tender.",
      "Add the shrimp and cook for 2-3 minutes more, until pink and opaque all the way through.",
      "Stir in the lime juice and salt, and serve with the sliced avocado."]),
    ("curated_snack_beef_broccoli_breakfast_bowl", "snack",
     "Beef & Broccoli Breakfast Bowl",
     "Seared beef with roasted broccoli and carrot, a real protein-forward start to the day.",
     "Beef top sirloin, broccoli, and carrot all check completely clean for Hashimoto's.",
     1.0, 1.0, "bowl", 506,
     [(*BEEF_SIRLOIN, 90, "g", "sliced", "seared", None), (*BROCCOLI, 50, "g", "cut into florets", "roasted", None),
      (*CARROT, 40, "g", "sliced", "roasted", None), (*SALT, 0.25, "tsp", None, None, None)],
     ["Preheat the oven to 400F (200C).",
      "Toss the broccoli and carrot with half the salt and roast for 15 minutes, until tender.",
      "Season the sliced beef with the remaining salt and sear in a dry, hot pan for 2-3 minutes per side.",
      "Serve the beef over the roasted broccoli and carrot."]),
    ("curated_snack_pork_kale_breakfast_hash", "snack",
     "Pork & Kale Breakfast Hash",
     "A quick morning hash of seared pork tenderloin, braised kale, and carrot, finished with avocado.",
     "Pork tenderloin, kale, and carrot all check completely clean for Hashimoto's.",
     1.0, 1.0, "bowl", 507,
     [(*PORK_TENDERLOIN, 90, "g", "sliced", "seared", None), (*KALE, 50, "g", "chopped", "braised", None),
      (*CARROT, 40, "g", "diced", "braised", None), (*AVOCADO, 30, "g", "sliced", None, None),
      (*SALT, 0.25, "tsp", None, None, None)],
     ["Combine the kale and carrot in a covered pan with a splash of water, and braise over medium-low heat for 8-10 minutes, until soft.",
      "Season the sliced pork with the salt and sear in a dry, hot pan for 2-3 minutes per side, until cooked through.",
      "Serve the pork over the braised kale and carrot, topped with the sliced avocado."]),
    ("curated_snack_salmon_fennel_breakfast_bowl", "snack",
     "Salmon & Fennel Breakfast Bowl",
     "Baked salmon with roasted fennel and zucchini, a real light and savory breakfast.",
     "Salmon, fennel, and zucchini all check completely clean for Hashimoto's.",
     1.0, 1.0, "bowl", 508,
     [(*SALMON, 90, "g", None, "baked", None), (*FENNEL, 50, "g", "sliced", "roasted", None),
      (*ZUCCHINI, 40, "g", "diced", "roasted", None), (*SALT, 0.25, "tsp", None, None, None)],
     ["Preheat the oven to 400F (200C).",
      "Toss the fennel and zucchini with the salt and spread on a baking sheet.",
      "Roast for 10 minutes, then add the salmon fillet to the sheet and roast for another 12-15 minutes, until it flakes easily."]),
    ("curated_snack_halibut_cabbage_breakfast_skillet", "snack",
     "Halibut & Cabbage Breakfast Skillet",
     "Pan-seared halibut with cabbage and carrot braised soft, finished with avocado.",
     "Halibut, cabbage, and carrot all check completely clean for Hashimoto's.",
     1.0, 1.0, "bowl", 509,
     [(*HALIBUT, 90, "g", None, "seared", None), (*CABBAGE, 50, "g", "shredded", "braised", None),
      (*CARROT, 40, "g", "sliced", "braised", None), (*AVOCADO, 30, "g", "sliced", None, None),
      (*SALT, 0.25, "tsp", None, None, None)],
     ["Combine the shredded cabbage and sliced carrot in a covered pan with a splash of water, and braise over medium-low heat for 10-12 minutes, until soft.",
      "Season the halibut with the salt and sear in a dry, hot pan for 3-4 minutes per side, until it flakes easily.",
      "Serve the halibut over the braised cabbage and carrot, topped with the sliced avocado."]),
    ("curated_snack_cod_broccoli_breakfast_bowl", "snack",
     "Cod & Broccoli Breakfast Bowl",
     "Baked cod with roasted broccoli and carrot, a real light way to start the day.",
     "Cod, broccoli, and carrot all check completely clean for Hashimoto's.",
     1.0, 1.0, "bowl", 510,
     [(*COD, 90, "g", None, "baked", None), (*BROCCOLI, 50, "g", "cut into florets", "roasted", None),
      (*CARROT, 40, "g", "sliced", "roasted", None), (*SALT, 0.25, "tsp", None, None, None)],
     ["Preheat the oven to 400F (200C).",
      "Toss the broccoli and carrot with half the salt and roast for 12 minutes.",
      "Add the cod fillet, seasoned with the remaining salt, and roast for another 12-15 minutes, until it flakes easily."]),
    ("curated_snack_shrimp_cabbage_breakfast_bowl", "snack",
     "Shrimp & Cabbage Breakfast Bowl",
     "Shrimp sauteed with cabbage and carrot, finished with lime and avocado.",
     "Shrimp, cabbage, and carrot all check completely clean for Hashimoto's.",
     1.0, 1.0, "bowl", 511,
     [(*SHRIMP, 90, "g", None, "sauteed", None), (*CABBAGE, 50, "g", "shredded", "sauteed", None),
      (*CARROT, 40, "g", "julienned", "sauteed", None), (*AVOCADO, 30, "g", "sliced", None, None),
      (*LIME, 0.25, "each", "juiced", None, None), (*SALT, 0.25, "tsp", None, None, None)],
     ["Saute the cabbage and carrot in a splash of water over medium-high heat for 4-5 minutes, until just tender.",
      "Add the shrimp and cook for 2-3 minutes more, until pink and opaque all the way through.",
      "Stir in the lime juice and salt, and serve with the sliced avocado."]),
    ("curated_snack_citrus_avocado_breakfast_bowl", "snack",
     "Citrus & Avocado Breakfast Bowl",
     "Sliced avocado with orange and grapefruit segments, finished with lime and cilantro, a real no-cook morning bowl.",
     "Orange, grapefruit, and avocado all check completely clean for Hashimoto's.",
     1.0, 1.0, "bowl", 512,
     [(*ORANGE, 70, "g", "segmented", None, None), (*GRAPEFRUIT, 70, "g", "segmented", None, None),
      (*AVOCADO, 50, "g", "sliced", None, None), (*LIME, 0.25, "each", "juiced", None, None),
      (*CILANTRO, 5, "g", "chopped", None, None)],
     ["Arrange the orange and grapefruit segments with the sliced avocado in a bowl.",
      "Finish with the lime juice and cilantro."]),
    ("curated_snack_tropical_breakfast_fruit_bowl", "snack",
     "Tropical Breakfast Fruit Bowl",
     "Banana, pineapple, and papaya, a real quick no-cook breakfast.",
     "Banana, pineapple, and papaya all check completely clean for Hashimoto's.",
     1.0, 1.0, "bowl", 513,
     [(*BANANA, 80, "g", "sliced", None, None), (*PINEAPPLE, 70, "g", "diced", None, None),
      (*PAPAYA, 70, "g", "diced", None, None)],
     ["Combine the sliced banana, diced pineapple, and diced papaya in a bowl and serve right away."]),
    ("curated_snack_berry_melon_breakfast_bowl", "snack",
     "Berry & Melon Breakfast Bowl",
     "Blueberry, strawberry, and cantaloupe, a real quick no-cook breakfast.",
     "Blueberry, strawberry, and cantaloupe all check completely clean for Hashimoto's.",
     1.0, 1.0, "bowl", 514,
     [(*BLUEBERRY, 60, "g", None, None, None), (*STRAWBERRY, 60, "g", "halved", None, None),
      (*CANTALOUPE, 80, "g", "diced", None, None)],
     ["Combine the blueberries, halved strawberries, and diced cantaloupe in a bowl and serve right away."]),
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
    json_path = Path(__file__).resolve().parent / "_hashimotos_aip_breakfast_data.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2)
    print(f"Wrote {len(out)} recipes to {json_path}")


if __name__ == "__main__":
    main()
