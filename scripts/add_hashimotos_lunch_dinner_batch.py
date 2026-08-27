"""
2026-08-27, direct follow-up after the cross-condition equity audit found
Hashimoto's itself (not any other condition) still short of the 30-
minimum bar for Vegan/Vegetarian/Paleo/AIP lunch and dinner, even after
the real legume-reference bug fix shipped the same day: "Let's tackle
the new lunch/dinner recipe batch next."

Confirmed via scripts/audit_meal_plan_recipe_coverage.js before writing
anything: Vegan lunch/dinner at 26 each (need +4), Vegetarian dinner at
28 (need +2, but automatically covered by any new Vegan recipe, since a
Vegan-tagged dish also satisfies a Vegetarian preference), Paleo lunch/
dinner at 26 each (need +4), AIP lunch/dinner at 22 each (need +8). AIP
recipes are ALWAYS also tagged Paleo by this app's own real
compute_recipe_diet_tags.js logic (AIP is checked only once Paleo's own
rules already pass), so a genuinely AIP-compliant batch closes both AIP
and Paleo gaps at once. LUNCH_MAIN_TYPES and DINNER_MAIN_TYPES both
include side/salad/soup/handheld, so any new recipe of one of those
four builder types counts toward both meals simultaneously -- no need
for separate lunch-only and dinner-only content.

Two real, distinct batches, following this app's own confirmed AIP rule
(lib/digest/types.ts / scripts/compute_recipe_diet_tags.js: Paleo's own
rules -- no grain/legume/dairy/refined-sugar/commercial-condiment --
plus no eggs, no NutSeed-category ingredient, no nightshade), checked
directly against the live database's own real food_scores/sub_
criterion_condition_relevance for Hashimoto's before writing a single
recipe, not assumed clean from general nutrition knowledge:

1. AIP-compliant (9 recipes): real animal protein (salmon, halibut,
   cod, shrimp, beef top sirloin, pork tenderloin -- confirmed genuinely
   CLEAN for Hashimoto's, zero flags at all, a real and better-than-
   expected finding) with AIP-safe, Hashimoto's-clean vegetables
   (broccoli, cabbage, kale, carrot, fennel, zucchini, all cooked where
   relevant), avocado as the one AIP-legal fat (coconut milk is
   category 'NutSeed' in this database, which the AIP rule's own
   NutSeed exclusion disqualifies outright, even though coconut itself
   is a real, standard AIP-allowed food -- a genuine, named quirk of
   this app's own category taxonomy, not something this batch works
   around by breaking the rule).
2. Vegan (6 recipes): reuses this same day's earlier verified-clean
   vegan palette (coconut milk, whole fruit, oats/rice/sorghum/
   cornmeal/tapioca, a handful of clean vegetables), scaled up to
   genuine savory lunch/dinner mains and soups rather than breakfast
   porridges.

Diet tags and condition safety/cautions are NOT hand-computed here --
scripts/compute_recipe_diet_tags.js and scripts/compute_recipe_
condition_data.js (already-established, already-idempotent machinery)
are run against this data afterward, exactly like every prior recipe
batch, so the real, final safe-for-Hashimoto's/AIP/Paleo/Vegan count is
verified, not assumed from this file's own reasoning above.

Usage:
  py scripts/add_hashimotos_lunch_dinner_batch.py
  node scripts/generate_hashimotos_lunch_dinner_recipes_ts.js
  node scripts/compute_recipe_condition_data.js
  node scripts/apply_recipe_condition_cautions.js
  node scripts/compute_recipe_diet_tags.js
  node scripts/apply_recipe_diet_tags.js
"""
import json
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "assets" / "data" / "foods_reference.db"

# --- Verified-clean protein palette (2026-08-27) ----------------------------
SALMON = ("Meat", "Salmon Fillet (Raw)")
HALIBUT = ("Meat", "Halibut Fish (Raw)")
COD = ("Meat", "Cod Fish")
SHRIMP = ("Meat", "Shrimp Crustaceans")
BEEF_SIRLOIN = ("Meat", "Beef Top Sirloin (Raw)")
PORK_TENDERLOIN = ("Meat", "Pork Fillet / Tenderloin (Raw)")

# --- Verified-clean AIP-safe vegetables --------------------------------------
BROCCOLI = ("Veg", "Broccoli")
CABBAGE = ("Veg", "Cabbage")
KALE = ("Veg", "Kale")
CARROT = ("Veg", "Carrot")
FENNEL = ("Veg", "Fennel Bulb")
ZUCCHINI = ("Veg", "Squash, zucchini")
LEEK = ("Veg", "Leek")
LETTUCE = ("Veg", "Lettuce, green leaf")
TOMATO = ("Veg", "Tomato")
RED_BELL_PEPPER = ("Veg", "Red Bell Pepper")

AVOCADO = ("Fruit", "Avocado")
LEMON = ("Fruit", "Lemon")
LIME = ("Fruit", "Lime")
ORANGE = ("Fruit", "Orange")
GRAPEFRUIT = ("Fruit", "Grapefruit")
APPLE = ("Fruit", "Apple")

GINGER = ("Veg", "Ginger, peeled, fresh")
CILANTRO = ("Veg", "Coriander (cilantro) leaves")
SALT = ("Herbs", "Common salt/table salt")
CINNAMON = ("Herbs", "Spices, cinnamon, ground")
WATER = ("Bev", "Water, tap")
VEGETABLE_STOCK = ("PantryStaples", "Vegetable stock")

RICE = ("Grain", "Grains, rice, brown, long-grain, dry")
SORGHUM = ("Grain", "Sorghum grain")
COCONUT_MILK = ("NutSeed", "Coconut milk")

# (id, builder_type, name, flavor_profile, health_benefit, servings,
#  serving_size_amount, serving_size_unit, sort_order, ingredients,
#  instructions)
RECIPES = [
    # --- AIP-compliant, real animal protein, all confirmed clean for Hashimoto's ---
    ("curated_side_baked_salmon_broccoli_carrots", "side",
     "Baked Salmon with Broccoli & Carrots",
     "A simple baked salmon fillet with roasted broccoli and carrots, finished with lemon and avocado.",
     "Salmon, broccoli, and carrot all check completely clean for Hashimoto's in this app's own reference database, and avocado stands in for any pressed oil, which never does.",
     1.0, 1.0, "plate", 400,
     [(*SALMON, 130, "g", None, "baked", None), (*BROCCOLI, 80, "g", "cut into florets", "baked", None),
      (*CARROT, 50, "g", "sliced", "roasted", None), (*AVOCADO, 40, "g", "sliced", None, None),
      (*LEMON, 10, "g", "juiced", None, None), (*SALT, 0.25, "tsp", None, None, None)],
     ["Preheat the oven to 400F (200C).",
      "Toss the broccoli and carrot with a squeeze of the lemon juice and half the salt, and spread on a baking sheet.",
      "Roast for 15 minutes, then push the vegetables to one side and add the salmon fillet to the sheet, seasoned with the remaining salt.",
      "Bake for another 12-15 minutes, until the salmon flakes easily and the vegetables are tender.",
      "Serve with the sliced avocado and any remaining lemon juice."]),
    ("curated_side_halibut_braised_cabbage_carrots", "side",
     "Halibut with Braised Cabbage & Carrots",
     "Baked halibut over cabbage and carrots braised soft, finished with lime and avocado.",
     "Halibut, cabbage, and carrot all check completely clean for Hashimoto's, and braising the cabbage (rather than serving it raw) is what keeps its own real goitrogenic flag from applying here.",
     1.0, 1.0, "plate", 401,
     [(*HALIBUT, 130, "g", None, "baked", None), (*CABBAGE, 70, "g", "shredded", "braised", None),
      (*CARROT, 50, "g", "sliced", "braised", None), (*AVOCADO, 30, "g", "sliced", None, None),
      (*LIME, 0.25, "each", "juiced", None, None), (*SALT, 0.25, "tsp", None, None, None)],
     ["Combine the shredded cabbage and sliced carrot in a covered pan with a splash of water, and braise over medium-low heat for 12-15 minutes, until soft.",
      "Meanwhile, season the halibut with half the salt and bake at 400F (200C) for 12-15 minutes, until it flakes easily.",
      "Season the braised vegetables with the remaining salt and the lime juice.",
      "Serve the halibut over the braised cabbage and carrots, topped with the sliced avocado."]),
    ("curated_side_cod_roasted_fennel_zucchini", "side",
     "Cod with Roasted Fennel & Zucchini",
     "Baked cod fillet with roasted fennel and zucchini, finished with lemon and avocado.",
     "Cod, fennel, and zucchini all check completely clean for Hashimoto's, a genuinely light, real whole-food plate.",
     1.0, 1.0, "plate", 402,
     [(*COD, 130, "g", None, "baked", None), (*FENNEL, 60, "g", "sliced", "roasted", None),
      (*ZUCCHINI, 60, "g", "diced", "roasted", None), (*AVOCADO, 30, "g", "sliced", None, None),
      (*LEMON, 10, "g", "juiced", None, None), (*SALT, 0.25, "tsp", None, None, None)],
     ["Preheat the oven to 400F (200C).",
      "Toss the fennel and zucchini with half the salt and spread on a baking sheet.",
      "Roast for 10 minutes, then push the vegetables to one side and add the cod fillet, seasoned with the remaining salt.",
      "Bake for another 12-15 minutes, until the cod flakes easily and the vegetables are tender.",
      "Serve with the sliced avocado and a squeeze of lemon."]),
    ("curated_side_shrimp_cabbage_carrot_stir_fry", "side",
     "Shrimp & Cabbage Stir-Fry",
     "Shrimp stir-fried with cabbage, carrot, and fresh ginger in a splash of water, finished with lime.",
     "Shrimp, cabbage, and carrot all check completely clean for Hashimoto's, cooked entirely without any pressed oil.",
     1.0, 1.0, "bowl", 403,
     [(*SHRIMP, 130, "g", None, "sauteed", None), (*CABBAGE, 70, "g", "shredded", "sauteed", None),
      (*CARROT, 50, "g", "julienned", "sauteed", None), (*GINGER, 3, "g", "grated", None, None),
      (*WATER, 30, "ml", None, None, None), (*LIME, 0.25, "each", "juiced", None, None),
      (*SALT, 0.25, "tsp", None, None, None)],
     ["Heat the water in a wide pan over medium-high heat and add the cabbage, carrot, and ginger.",
      "Stir-fry for 4-5 minutes, until the vegetables begin to soften, adding a splash more water if the pan gets dry.",
      "Add the shrimp and cook for 2-3 minutes more, until pink and opaque all the way through.",
      "Stir in the lime juice and salt just before serving."]),
    ("curated_side_beef_sirloin_kale_carrots", "side",
     "Beef Sirloin with Braised Kale & Carrots",
     "Seared beef sirloin with kale and carrots braised soft, finished with avocado.",
     "Beef top sirloin, kale, and carrot all check completely clean for Hashimoto's, braising the kale rather than serving it raw is what keeps its own real goitrogenic flag from applying here.",
     1.0, 1.0, "plate", 404,
     [(*BEEF_SIRLOIN, 130, "g", None, "seared", None), (*KALE, 60, "g", "chopped", "braised", None),
      (*CARROT, 50, "g", "sliced", "braised", None), (*AVOCADO, 30, "g", "sliced", None, None),
      (*SALT, 0.25, "tsp", None, None, None)],
     ["Combine the kale and carrot in a covered pan with a splash of water, and braise over medium-low heat for 10-12 minutes, until soft.",
      "Meanwhile, season the beef with the salt and sear in a dry, hot pan for 3-4 minutes per side for medium, then rest for a few minutes before slicing.",
      "Serve the sliced beef over the braised kale and carrots, topped with the sliced avocado."]),
    ("curated_side_pork_tenderloin_braised_cabbage_apple", "side",
     "Pork Tenderloin with Braised Cabbage & Apple",
     "Baked pork tenderloin with cabbage and apple braised soft together, finished with cinnamon.",
     "Pork tenderloin, cabbage, and apple all check completely clean for Hashimoto's, a real, classic pairing built entirely from whole foods.",
     1.0, 1.0, "plate", 405,
     [(*PORK_TENDERLOIN, 130, "g", None, "baked", None), (*CABBAGE, 70, "g", "shredded", "braised", None),
      (*APPLE, 60, "g", "diced", "braised", None), (*CINNAMON, 0.25, "tsp", None, None, None),
      (*SALT, 0.25, "tsp", None, None, None)],
     ["Combine the shredded cabbage, diced apple, and cinnamon in a covered pan with a splash of water, and braise over medium-low heat for 12-15 minutes, until soft.",
      "Meanwhile, season the pork tenderloin with the salt and bake at 400F (200C) for 20-25 minutes, until cooked through, then rest for a few minutes before slicing.",
      "Serve the sliced pork over the braised cabbage and apple."]),
    ("curated_soup_salmon_fennel_leek_soup", "soup",
     "Salmon, Fennel & Leek Soup",
     "A light soup of salmon simmered with fennel, leek, and carrot in a real vegetable broth.",
     "Salmon, fennel, leek, and carrot all check completely clean for Hashimoto's, a genuinely light whole-food soup.",
     1.0, 1.0, "bowl", 406,
     [(*SALMON, 100, "g", "cubed", "simmered", None), (*FENNEL, 60, "g", "sliced", "simmered", None),
      (*LEEK, 50, "g", "sliced", "simmered", None), (*CARROT, 40, "g", "sliced", "simmered", None),
      (*VEGETABLE_STOCK, 5, "g", None, None, None), (*WATER, 250, "ml", None, None, None),
      (*CILANTRO, 5, "g", "chopped", None, None), (*SALT, 0.25, "tsp", None, None, None)],
     ["Combine the fennel, leek, carrot, vegetable stock, and filtered water in a pot and bring to a simmer.",
      "Cook for 12-15 minutes, until the vegetables are tender.",
      "Add the cubed salmon and simmer for another 4-5 minutes, until it's just cooked through.",
      "Stir in the salt, and finish with the fresh cilantro."]),
    ("curated_handheld_shrimp_lettuce_wraps_avocado", "handheld",
     "Shrimp Lettuce Wraps with Avocado & Lime",
     "Shrimp cooked in a splash of water, wrapped in lettuce with sliced avocado and a squeeze of lime.",
     "Shrimp, lettuce, and avocado all check completely clean for Hashimoto's, and the lettuce leaf stands in for a wrap without any grain at all.",
     1.0, 1.0, "wrap", 407,
     [(*SHRIMP, 120, "g", None, "sauteed", None), (*LETTUCE, 40, "g", "leaves separated", None, None),
      (*AVOCADO, 50, "g", "sliced", None, None), (*LIME, 0.25, "each", "juiced", None, None),
      (*CILANTRO, 5, "g", "chopped", None, None), (*SALT, 0.25, "tsp", None, None, None)],
     ["Cook the shrimp in a splash of water in a pan over medium-high heat for 3-4 minutes, until pink and opaque all the way through, then season with the salt.",
      "Spoon the shrimp into the lettuce leaves along with the sliced avocado and cilantro.",
      "Finish with a squeeze of lime juice and serve right away."]),
    ("curated_salad_beef_carrot_fennel_salad", "salad",
     "Beef, Carrot & Fennel Salad",
     "Seared beef sliced over a raw carrot and fennel salad, finished with lemon and avocado.",
     "Beef top sirloin, carrot, and fennel all check completely clean for Hashimoto's, and neither carrot nor fennel carries any real raw-goitrogenic concern, so this salad genuinely works served raw.",
     1.0, 1.0, "bowl", 408,
     [(*BEEF_SIRLOIN, 120, "g", None, "seared", None), (*CARROT, 50, "g", "shredded", None, None),
      (*FENNEL, 50, "g", "shaved", None, None), (*AVOCADO, 40, "g", "sliced", None, None),
      (*LEMON, 10, "g", "juiced", None, None), (*CILANTRO, 5, "g", "chopped", None, None),
      (*SALT, 0.25, "tsp", None, None, None)],
     ["Season the beef with the salt and sear in a dry, hot pan for 3-4 minutes per side for medium, then rest for a few minutes before slicing thin.",
      "Toss the shredded carrot and shaved fennel with the lemon juice in a bowl.",
      "Top with the sliced beef, avocado, and cilantro."]),
    # --- Vegan, savory lunch/dinner mains and soups (same day's earlier clean palette) ---
    ("curated_vegan_side_coconut_rice_roasted_vegetable_bowl", "side",
     "Coconut Rice Bowl with Roasted Zucchini, Pepper & Tomato",
     "Rice simmered in coconut milk, topped with roasted zucchini, bell pepper, and tomato.",
     "Rice, coconut milk, zucchini, bell pepper, and tomato all check completely clean for Hashimoto's, a genuinely hearty vegan main.",
     1.0, 1.0, "bowl", 409,
     [(*RICE, 45, "g", None, "simmered", None), (*COCONUT_MILK, 150, "ml", None, None, None),
      (*ZUCCHINI, 60, "g", "diced", "roasted", None), (*RED_BELL_PEPPER, 40, "g", "diced", "roasted", None),
      (*TOMATO, 50, "g", "diced", None, None), (*CILANTRO, 5, "g", "chopped", None, None),
      (*LIME, 0.25, "each", "juiced", None, None), (*SALT, 0.25, "tsp", None, None, None)],
     ["Combine the rice and coconut milk in a saucepan and bring to a gentle simmer.",
      "Cover and cook for 30-35 minutes, until the rice is tender.",
      "Meanwhile, roast the zucchini and bell pepper at 400F (200C) for 15-18 minutes, until tender.",
      "Spoon the roasted vegetables and diced tomato over the rice, finish with the cilantro, lime juice, and salt."]),
    ("curated_vegan_soup_coconut_fennel_leek_vegetable_soup", "soup",
     "Coconut Vegetable Soup with Fennel & Leek",
     "A light coconut-milk soup of fennel, leek, zucchini, and carrot, finished with fresh ginger.",
     "Coconut milk, fennel, leek, zucchini, and carrot all check completely clean for Hashimoto's, a genuinely warming vegan soup.",
     1.0, 1.0, "bowl", 410,
     [(*COCONUT_MILK, 200, "ml", None, None, None), (*FENNEL, 60, "g", "sliced", "simmered", None),
      (*LEEK, 50, "g", "sliced", "simmered", None), (*ZUCCHINI, 50, "g", "diced", "simmered", None),
      (*CARROT, 40, "g", "sliced", "simmered", None), (*GINGER, 3, "g", "grated", None, None),
      (*WATER, 100, "ml", None, None, None), (*SALT, 0.25, "tsp", None, None, None)],
     ["Combine the coconut milk, filtered water, fennel, leek, zucchini, carrot, and ginger in a pot.",
      "Bring to a gentle simmer and cook for 15-18 minutes, until the vegetables are tender.",
      "Stir in the salt just before serving."]),
    ("curated_vegan_salad_avocado_fennel_citrus_salad", "salad",
     "Avocado, Fennel & Citrus Salad",
     "Sliced avocado and shaved fennel with orange and grapefruit segments, finished with lime.",
     "Avocado, fennel, orange, and grapefruit all check completely clean for Hashimoto's, a genuinely bright, no-cook salad.",
     1.0, 1.0, "bowl", 411,
     [(*AVOCADO, 60, "g", "sliced", None, None), (*FENNEL, 50, "g", "shaved", None, None),
      (*ORANGE, 60, "g", "segmented", None, None), (*GRAPEFRUIT, 60, "g", "segmented", None, None),
      (*LIME, 0.25, "each", "juiced", None, None), (*CILANTRO, 5, "g", "chopped", None, None),
      (*SALT, 0.25, "tsp", None, None, None)],
     ["Arrange the sliced avocado and shaved fennel with the orange and grapefruit segments in a bowl.",
      "Finish with the lime juice, cilantro, and a pinch of salt."]),
    ("curated_vegan_side_sorghum_roasted_vegetable_bowl", "side",
     "Sorghum Bowl with Roasted Zucchini & Bell Pepper",
     "Sorghum simmered in coconut milk, topped with roasted zucchini and bell pepper.",
     "Sorghum, coconut milk, zucchini, and bell pepper all check completely clean for Hashimoto's, a genuinely different whole-grain base from rice.",
     1.0, 1.0, "bowl", 412,
     [(*SORGHUM, 50, "g", None, "simmered", None), (*COCONUT_MILK, 100, "ml", None, None, None),
      (*ZUCCHINI, 60, "g", "diced", "roasted", None), (*RED_BELL_PEPPER, 40, "g", "diced", "roasted", None),
      (*CILANTRO, 5, "g", "chopped", None, None), (*LIME, 0.25, "each", "juiced", None, None),
      (*SALT, 0.25, "tsp", None, None, None)],
     ["Combine the sorghum and coconut milk in a saucepan and bring to a gentle simmer.",
      "Cover and cook for 40-45 minutes, stirring occasionally and adding a splash of water if it gets too thick, until the sorghum is tender.",
      "Meanwhile, roast the zucchini and bell pepper at 400F (200C) for 15-18 minutes, until tender.",
      "Spoon the roasted vegetables over the sorghum, finish with the cilantro, lime juice, and salt."]),
    ("curated_vegan_soup_tomato_fennel_coconut_soup", "soup",
     "Tomato Fennel Coconut Soup",
     "A creamy coconut-milk soup of tomato and fennel, finished with leek and fresh cilantro.",
     "Tomato, fennel, coconut milk, and leek all check completely clean for Hashimoto's, a genuinely rich vegan soup.",
     1.0, 1.0, "bowl", 413,
     [(*TOMATO, 150, "g", "diced", "simmered", None), (*FENNEL, 60, "g", "sliced", "simmered", None),
      (*COCONUT_MILK, 150, "ml", None, None, None), (*LEEK, 40, "g", "sliced", "simmered", None),
      (*CILANTRO, 5, "g", "chopped", None, None), (*SALT, 0.25, "tsp", None, None, None)],
     ["Combine the tomato, fennel, and leek in a pot with the coconut milk.",
      "Bring to a gentle simmer and cook for 15-18 minutes, until the vegetables are soft.",
      "Stir in the salt and finish with the fresh cilantro."]),
    ("curated_vegan_handheld_avocado_rice_lettuce_wraps", "handheld",
     "Avocado & Rice Lettuce Wraps",
     "Simmered rice and sliced avocado wrapped in lettuce with diced tomato and lime.",
     "Rice, avocado, lettuce, and tomato all check completely clean for Hashimoto's, and the lettuce leaf stands in for a wrap without any gluten at all.",
     1.0, 1.0, "wrap", 414,
     [(*RICE, 40, "g", None, "simmered", None), (*AVOCADO, 60, "g", "sliced", None, None),
      (*LETTUCE, 40, "g", "leaves separated", None, None), (*TOMATO, 40, "g", "diced", None, None),
      (*LIME, 0.25, "each", "juiced", None, None), (*CILANTRO, 5, "g", "chopped", None, None),
      (*SALT, 0.25, "tsp", None, None, None)],
     ["Combine the rice with a pinch of the salt in simmering water and cook until tender, about 30-35 minutes.",
      "Spoon the rice into the lettuce leaves along with the sliced avocado, diced tomato, and cilantro.",
      "Finish with a squeeze of lime juice and serve right away."]),
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
    json_path = Path(__file__).resolve().parent / "_hashimotos_lunch_dinner_data.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2)
    print(f"Wrote {len(out)} recipes to {json_path}")


if __name__ == "__main__":
    main()
