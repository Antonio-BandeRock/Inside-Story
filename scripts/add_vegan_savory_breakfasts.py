"""
2026-08-26, direct request after a real on-device report: "Why can't a
user have savory amaranth seed porridge with olive oil, salt, pepper and
fresh garlic for breakfast, with avocado, and mixed vegetables, if they
are vegan? There are plenty of options... make sure there are at least 30
total different vegan breakfast choices."

Confirmed directly, not guessed, via scripts/audit_meal_plan_recipe_
coverage.js before writing any of this: this corpus's own vegan-tagged
breakfast pool was 17 (of 48 breakfast-eligible recipes total), and every
one of the 16 dedicated "_vegan_" recipes in it is soy-based (tofu or soy
milk) -- the exact reason a real, whole-food, soy-free savory breakfast
like the one described didn't already exist as an option. This batch is
16 new, genuinely different vegan breakfast recipes, none of them soy-
based, built specifically to close that gap: 11 savory whole-grain/
legume/vegetable bowls (the amaranth porridge described directly, plus
millet, buckwheat, quinoa, oats, polenta, and bean-based versions) and 5
sweet ones using almond milk instead of soy milk, so the earlier "every
vegan sweet option uses soy milk" pattern doesn't repeat itself either.

Every ingredient verified against the live reference database before
being written in, same discipline as every other curated-recipe batch.
Diet tags and condition safety/cautions are NOT hand-computed here --
scripts/compute_recipe_diet_tags.js and scripts/compute_recipe_condition_
data.js (already-established, already-idempotent machinery) are run
against this data afterward, exactly like every prior recipe batch.

Usage:
  py scripts/add_vegan_savory_breakfasts.py
"""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "assets" / "data" / "foods_reference.db"

# 2026-08-26 fix: the originally chosen rows for amaranth, cornmeal, corn
# tortilla, and almond milk all turned out to carry hidden=1 in the live
# database (confirmed directly, not assumed) -- every real corn-tortilla
# row across all 4 sources that carry one, and all 3 real almond-milk
# rows in the whole database, are hidden, a genuine, broader data gap
# named directly rather than silently worked around. Amaranth and
# cornmeal each had a real, non-hidden alternative row; corn tortilla and
# almond milk did not, so the taco recipe below drops the tortilla for a
# bowl instead, and the three "almond milk" recipes use coconut milk
# instead, the only other real non-dairy, non-soy milk this database
# has a genuinely usable row for.
AMARANTH = ("Grain", "Grains, amaranth")
MILLET = ("Grain", "Millet")
BUCKWHEAT = ("Grain", "Buckwheat")
OATS = ("Grain", "Oats")
QUINOA = ("Grain", "Quinoa")
CORNMEAL = ("Grain", "Cornmeal, whole-grain, yellow")

CHICKPEA_FLOUR = ("NutSeed", "Chickpea flour")
CHICKPEAS = ("Legume", "Chickpeas (garbanzo beans, bengal gram)")
BLACK_BEANS = ("Legume", "Black Beans")
WHITE_BEANS = ("Legume", "White Beans")
LENTILS = ("Legume", "Lentils")

MUSHROOM = ("Veg", "Mushroom, common, fresh")
ZUCCHINI = ("Veg", "Squash, zucchini")
RED_BELL_PEPPER = ("Veg", "Red Bell Pepper")
SPINACH = ("Veg", "Spinach")
KALE = ("Veg", "Kale")
ONION = ("Veg", "Onion")
GARLIC = ("Veg", "Garlic")
SWEET_POTATO = ("Veg", "Sweet potato")
AVOCADO = ("Fruit", "Avocado")
LEMON = ("Fruit", "Lemon")
LIME = ("Fruit", "Lime")
CILANTRO = ("Veg", "Coriander (cilantro) leaves")

OLIVE_OIL = ("Fats", "Olive Oil (Extra Virgin)")
SALT = ("Herbs", "Common salt/table salt")
BLACK_PEPPER = ("Herbs", "Pepper, black, ground")
CUMIN = ("Herbs", "Cumin (cummin) seed, dried, ground")
TURMERIC = ("Herbs", "Turmeric, dried, ground")
CINNAMON = ("Herbs", "Spices, cinnamon, ground")
TAHINI = ("SaucesCondiments", "Tahini")
NUTRITIONAL_YEAST = ("Mushroom", "Yeast flakes/nutritional yeast")
COCONUT_MILK = ("NutSeed", "Coconut milk")
MAPLE_SYRUP = ("Sweets", "Maple Syrup (100% Pure)")

ALMOND_BUTTER = ("NutSeed", "Nuts, almond butter, plain")
WALNUT = ("NutSeed", "Walnut")
HEMP_SEED = ("NutSeed", "Hemp seeds")
CHIA_SEEDS = ("NutSeed", "Chia seeds")
FLAXSEED = ("NutSeed", "Flaxseed Seeds")
BLUEBERRY = ("Fruit", "Blueberry")
STRAWBERRY = ("Fruit", "Strawberry")
PEAR = ("Fruit", "Pear")

# (id, builder_type, name, flavor_profile, health_benefit, servings,
#  serving_size_amount, serving_size_unit, sort_order, ingredients)
# Each ingredient tuple: (category, base_name, quantity, unit, cut_prep,
# cooking_method, prep_note).
RECIPES = [
    ("curated_vegan_savory_amaranth_porridge_garlic_avocado", "snack",
     "Savory Amaranth Porridge with Garlic, Avocado & Mixed Vegetables",
     "A whole-grain savory porridge, simmered plain and finished with garlic, olive oil, and a real vegetable mix.",
     "Amaranth cooks up into a naturally creamy, protein-rich porridge without any dairy or soy at all, and a real vegetable mix keeps this genuinely a full breakfast rather than a plain bowl of grain.",
     1.0, 1.0, "bowl", 200,
     [(*AMARANTH, 45, "g", None, "simmered", None), (*ZUCCHINI, 60, "g", "diced", "sauteed", None),
      (*RED_BELL_PEPPER, 40, "g", "diced", "sauteed", None), (*SPINACH, 30, "g", "chopped", "wilted", None),
      (*GARLIC, 1, "each", "minced", None, None), (*OLIVE_OIL, 1, "tbsp", None, None, None),
      (*AVOCADO, 50, "g", "sliced", None, None), (*SALT, 0.25, "tsp", None, None, None),
      (*BLACK_PEPPER, 0.125, "tsp", None, None, "a pinch")]),
    ("curated_vegan_savory_oat_porridge_mushroom_spinach", "snack",
     "Savory Steel-Cut Oat Porridge with Mushrooms & Spinach",
     "A savory take on oatmeal, simmered plain and finished with sauteed mushroom and spinach in olive oil and garlic.",
     "Oats work just as well as a savory base as a sweet one, and mushroom brings a genuinely meaty depth without any meat at all.",
     1.0, 1.0, "bowl", 201,
     [(*OATS, 40, "g", None, "simmered", None), (*MUSHROOM, 70, "g", "sliced", "sauteed", None),
      (*SPINACH, 30, "g", "chopped", "wilted", None), (*GARLIC, 1, "each", "minced", None, None),
      (*OLIVE_OIL, 1, "tbsp", None, None, None), (*SALT, 0.25, "tsp", None, None, None),
      (*BLACK_PEPPER, 0.125, "tsp", None, None, "a pinch")]),
    ("curated_vegan_chickpea_flour_vegetable_scramble", "snack",
     "Chickpea Flour Vegetable Scramble",
     "Turmeric turns a simple chickpea-flour batter into a real, egg-like savory scramble, folded with real vegetables.",
     "Chickpea flour is a genuine, complete plant protein on its own, and nutritional yeast adds a real vitamin B12 source the same way it already does in this app's other savory scrambles.",
     1.0, 1.0, "plate", 202,
     [(*CHICKPEA_FLOUR, 50, "g", None, "whisked into a batter and cooked like a scramble", None),
      (*ONION, 30, "g", "diced", "sauteed", None), (*RED_BELL_PEPPER, 40, "g", "diced", "sauteed", None),
      (*SPINACH, 30, "g", "chopped", "wilted", None), (*TURMERIC, 0.25, "tsp", None, None, None),
      (*NUTRITIONAL_YEAST, 1, "tbsp", None, None, None), (*OLIVE_OIL, 1, "tbsp", None, None, None),
      (*SALT, 0.25, "tsp", None, None, None), (*BLACK_PEPPER, 0.125, "tsp", None, None, "a pinch")]),
    ("curated_vegan_savory_millet_bowl_roasted_vegetables_tahini", "snack",
     "Savory Millet Bowl with Roasted Vegetables & Tahini",
     "Fluffy simmered millet topped with roasted zucchini and bell pepper, finished with a real lemon-tahini drizzle.",
     "Millet is a genuinely different whole grain from oats or quinoa, and tahini brings real calcium and healthy fat to what would otherwise be a plain grain bowl.",
     1.0, 1.0, "bowl", 203,
     [(*MILLET, 45, "g", None, "simmered", None), (*ZUCCHINI, 60, "g", "diced", "roasted", None),
      (*RED_BELL_PEPPER, 40, "g", "diced", "roasted", None), (*TAHINI, 1, "tbsp", None, None, None),
      (*LEMON, 0.5, "each", "juiced", None, None), (*OLIVE_OIL, 1, "tsp", None, None, None),
      (*SALT, 0.25, "tsp", None, None, None)]),
    ("curated_vegan_black_bean_sweet_potato_breakfast_hash", "snack",
     "Black Bean & Sweet Potato Breakfast Hash",
     "A real, hearty savory hash: pan-cooked sweet potato and black beans with peppers, onion, and avocado on top.",
     "Black beans and sweet potato together bring real fiber and complex carbohydrate to a savory breakfast, no eggs, dairy, or soy needed at all.",
     1.0, 1.0, "plate", 204,
     [(*SWEET_POTATO, 100, "g", "diced", "pan-cooked", None), (*BLACK_BEANS, 80, "g", None, None, None),
      (*RED_BELL_PEPPER, 40, "g", "diced", "sauteed", None), (*ONION, 30, "g", "diced", "sauteed", None),
      (*AVOCADO, 50, "g", "sliced", None, None), (*OLIVE_OIL, 1, "tbsp", None, None, None),
      (*CUMIN, 0.25, "tsp", None, None, None), (*SALT, 0.25, "tsp", None, None, None)]),
    ("curated_vegan_lentil_spinach_bowl_lemon_tahini", "snack",
     "Lentil & Spinach Breakfast Bowl with Lemon-Tahini Dressing",
     "Simmered lentils and wilted spinach, finished with a bright, real lemon-tahini dressing.",
     "Lentils are a real, whole-food iron and protein source for a savory breakfast, and lemon alongside them helps the body absorb that non-heme iron more effectively.",
     1.0, 1.0, "bowl", 205,
     [(*LENTILS, 90, "g", None, "simmered", None), (*SPINACH, 40, "g", "chopped", "wilted", None),
      (*TAHINI, 1, "tbsp", None, None, None), (*LEMON, 0.5, "each", "juiced", None, None),
      (*GARLIC, 1, "each", "minced", None, None), (*OLIVE_OIL, 1, "tsp", None, None, None),
      (*SALT, 0.25, "tsp", None, None, None)]),
    ("curated_vegan_savory_buckwheat_porridge_mushroom_herbs", "snack",
     "Savory Buckwheat Porridge with Mushrooms & Herbs",
     "Simmered buckwheat groats finished savory, with sauteed mushroom, garlic, and olive oil rather than fruit and sugar.",
     "Buckwheat is a genuine gluten-free whole grain (no relation to wheat despite the name), and this savory version gives it a real second breakfast identity beyond the usual sweet porridge.",
     1.0, 1.0, "bowl", 206,
     [(*BUCKWHEAT, 45, "g", None, "simmered", None), (*MUSHROOM, 70, "g", "sliced", "sauteed", None),
      (*SPINACH, 30, "g", "chopped", "wilted", None), (*GARLIC, 1, "each", "minced", None, None),
      (*OLIVE_OIL, 1, "tbsp", None, None, None), (*SALT, 0.25, "tsp", None, None, None),
      (*BLACK_PEPPER, 0.125, "tsp", None, None, "a pinch")]),
    ("curated_vegan_quinoa_bowl_roasted_vegetables_hemp_seeds", "snack",
     "Quinoa Breakfast Bowl with Roasted Vegetables & Hemp Seeds",
     "Simmered quinoa topped with roasted zucchini and bell pepper, finished with hemp seeds and a squeeze of lemon.",
     "Hemp seeds add a real, complete plant protein and omega-3 boost on top of quinoa's own already-complete amino acid profile, no soy anywhere in this one.",
     1.0, 1.0, "bowl", 207,
     [(*QUINOA, 45, "g", None, "simmered", None), (*ZUCCHINI, 60, "g", "diced", "roasted", None),
      (*RED_BELL_PEPPER, 40, "g", "diced", "roasted", None), (*HEMP_SEED, 1, "tbsp", None, None, None),
      (*LEMON, 0.5, "each", "juiced", None, None), (*OLIVE_OIL, 1, "tsp", None, None, None),
      (*SALT, 0.25, "tsp", None, None, None)]),
    ("curated_vegan_white_bean_kale_breakfast_hash", "snack",
     "White Bean & Kale Breakfast Hash",
     "A real, garlicky savory hash: pan-cooked white beans and kale with bell pepper in olive oil.",
     "White beans bring genuine plant protein and fiber to a savory breakfast, and kale holds up well to a quick saute without turning bitter the way it can raw.",
     1.0, 1.0, "plate", 208,
     [(*WHITE_BEANS, 90, "g", None, None, None), (*KALE, 50, "g", "chopped", "sauteed", None),
      (*RED_BELL_PEPPER, 40, "g", "diced", "sauteed", None), (*GARLIC, 1, "each", "minced", None, None),
      (*OLIVE_OIL, 1, "tbsp", None, None, None), (*SALT, 0.25, "tsp", None, None, None),
      (*BLACK_PEPPER, 0.125, "tsp", None, None, "a pinch")]),
    ("curated_vegan_chickpea_spinach_breakfast_curry", "snack",
     "Chickpea & Spinach Breakfast Curry",
     "A real, mildly spiced curry built on chickpeas, spinach, and coconut milk -- a genuinely different way to start the day.",
     "Turmeric and cumin together give this a real, warming curry flavor, and coconut milk keeps it creamy without any dairy at all.",
     1.0, 1.0, "bowl", 209,
     [(*CHICKPEAS, 100, "g", None, None, None), (*SPINACH, 40, "g", "chopped", "wilted", None),
      (*COCONUT_MILK, 100, "ml", None, None, None), (*ONION, 30, "g", "diced", "sauteed", None),
      (*GARLIC, 1, "each", "minced", None, None), (*CUMIN, 0.25, "tsp", None, None, None),
      (*TURMERIC, 0.25, "tsp", None, None, None), (*SALT, 0.25, "tsp", None, None, None)]),
    ("curated_vegan_savory_polenta_bowl_mushroom_greens", "snack",
     "Savory Polenta Bowl with Sauteed Mushrooms & Greens",
     "Simmered cornmeal polenta topped with sauteed mushroom and wilted spinach in garlic and olive oil.",
     "Cornmeal polenta is a real, genuinely different whole-grain base from oats or rice, naturally gluten-free, and mushroom brings a savory depth on top of it.",
     1.0, 1.0, "bowl", 210,
     [(*CORNMEAL, 40, "g", None, "simmered", None), (*MUSHROOM, 70, "g", "sliced", "sauteed", None),
      (*SPINACH, 30, "g", "chopped", "wilted", None), (*GARLIC, 1, "each", "minced", None, None),
      (*OLIVE_OIL, 1, "tbsp", None, None, None), (*SALT, 0.25, "tsp", None, None, None),
      (*BLACK_PEPPER, 0.125, "tsp", None, None, "a pinch")]),
    ("curated_vegan_black_bean_breakfast_bowl_avocado", "snack",
     "Savory Black Bean Breakfast Bowl with Avocado & Lime",
     "Warmed black beans with avocado, onion, cilantro, and a real squeeze of lime.",
     "Black beans bring genuine plant protein and fiber to a real, quick savory breakfast, no soy or grain needed at all.",
     1.0, 1.0, "bowl", 211,
     [(*BLACK_BEANS, 120, "g", None, None, None),
      (*AVOCADO, 50, "g", "sliced", None, None), (*ONION, 20, "g", "diced", None, None),
      (*CILANTRO, 5, "g", "chopped", None, None), (*LIME, 0.5, "each", "juiced", None, None),
      (*SALT, 0.25, "tsp", None, None, None)]),
    ("curated_vegan_roasted_vegetable_white_bean_bowl_garlic_herb_oil", "snack",
     "Roasted Vegetable & White Bean Breakfast Bowl with Garlic-Herb Olive Oil",
     "Roasted zucchini, bell pepper, and white beans over wilted spinach, finished with a real garlic-infused olive oil.",
     "This is a genuinely vegetable-forward savory breakfast, closer to a small dinner plate than a bowl of grain, built entirely on real whole foods.",
     1.0, 1.0, "bowl", 212,
     [(*WHITE_BEANS, 90, "g", None, None, None), (*ZUCCHINI, 60, "g", "diced", "roasted", None),
      (*RED_BELL_PEPPER, 40, "g", "diced", "roasted", None), (*SPINACH, 30, "g", "chopped", "wilted", None),
      (*GARLIC, 1, "each", "minced", None, None), (*OLIVE_OIL, 1, "tbsp", None, None, None),
      (*SALT, 0.25, "tsp", None, None, None), (*BLACK_PEPPER, 0.125, "tsp", None, None, "a pinch")]),
    ("curated_vegan_coconut_milk_overnight_oats_blueberry_flax", "snack",
     "Coconut Milk Overnight Oats with Blueberries & Flax",
     "Creamy make-ahead oats built on coconut milk instead of soy milk, blueberries and flaxseed folded in.",
     "This is the same real overnight-oats format this app's other vegan breakfasts already use, with coconut milk standing in for soy milk for anyone wanting a soy-free option.",
     1.0, 1.0, "bowl", 213,
     [(*OATS, 40, "g", None, None, None), (*COCONUT_MILK, 120, "ml", None, None, None),
      (*BLUEBERRY, 60, "g", None, None, None), (*FLAXSEED, 1, "tbsp", "ground", None, None),
      (*MAPLE_SYRUP, 5, "g", None, None, "optional")]),
    ("curated_vegan_coconut_milk_chia_pudding_almond_butter_berries", "snack",
     "Coconut Milk Chia Pudding with Almond Butter & Berries",
     "A creamy chia pudding built on coconut milk, almond butter and strawberries stirred in.",
     "Coconut milk and almond butter together give this a real, different flavor and a genuinely soy-free alternative to this app's other chia puddings.",
     1.0, 1.0, "bowl", 214,
     [(*CHIA_SEEDS, 30, "g", None, None, None), (*COCONUT_MILK, 120, "ml", None, None, None),
      (*ALMOND_BUTTER, 15, "g", None, None, None), (*STRAWBERRY, 60, "g", "sliced", None, None),
      (*MAPLE_SYRUP, 5, "g", None, None, "optional")]),
    ("curated_vegan_buckwheat_porridge_coconut_milk_walnut_pear", "snack",
     "Buckwheat Porridge with Coconut Milk, Walnuts & Pear",
     "Warm simmered buckwheat porridge finished sweet, built on coconut milk with walnut and diced pear folded in.",
     "Buckwheat and coconut milk together give this a real, different texture and flavor from this app's other sweet oat- and soy-milk-based porridges.",
     1.0, 1.0, "bowl", 215,
     [(*BUCKWHEAT, 45, "g", None, "simmered", None), (*COCONUT_MILK, 100, "ml", None, None, None),
      (*PEAR, 70, "g", "diced", None, None), (*WALNUT, 15, "g", "chopped", None, None),
      (*CINNAMON, 0.25, "tsp", None, None, None), (*MAPLE_SYRUP, 5, "g", None, None, "optional")]),
]


def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    for recipe_id, builder_type, name, flavor_profile, health_benefit, servings, serving_size_amount, \
            serving_size_unit, sort_order, ingredients in RECIPES:
        cur.execute(
            """
            INSERT INTO curated_recipes
                (id, builder_type, name, flavor_profile, health_benefit, servings,
                 serving_size_amount, serving_size_unit, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                builder_type = excluded.builder_type, name = excluded.name,
                flavor_profile = excluded.flavor_profile, health_benefit = excluded.health_benefit,
                servings = excluded.servings, serving_size_amount = excluded.serving_size_amount,
                serving_size_unit = excluded.serving_size_unit, sort_order = excluded.sort_order
            """,
            (recipe_id, builder_type, name, flavor_profile, health_benefit, servings,
             serving_size_amount, serving_size_unit, sort_order),
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


if __name__ == "__main__":
    main()
