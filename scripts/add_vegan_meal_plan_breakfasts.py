"""
Vegan Meal Plan track, breakfasts -- 2026-08-24, direct follow-up to the
chrononutrition pass: "Keep going straight into the vegan and vegetarian
tracks now." All 42 of the omnivore plan's breakfasts became dairy- or
egg-based during the chrononutrition pass (real Greek yogurt, cottage
cheese, or egg for real morning protein), which is exactly why none of
them carry over to a vegan track -- this batch is a full, parallel set of
42 vegan breakfasts, matching the same day-to-day fruit and format variety
the dairy version already established, so the two tracks read as genuine
counterparts of each other rather than an afterthought.

This database has no plain, unsweetened, non-branded soy or coconut
yogurt row (only flavored/sweetened commercial brands, which this app's
own standing rule already steers away from -- "Home cooking over
commercial products"), so the real vegan protein base here is silken tofu
(a genuine whole soy food, blended smooth with a little vanilla and a
touch of maple syrup into a real "tofu yogurt"), soy milk paired with a
nut butter for the overnight-oats/porridge formats, and a real turmeric-
and-nutritional-yeast tofu scramble standing in for the egg-based
breakfasts (nutritional yeast is a real, common vegan B12 fortification
source, not a flavor gimmick). One specific ingredient row, silken tofu,
is only available under a single retail brand in this database (MORI-NU)
-- named directly here since it's a real, unavoidable data gap, not a
commercial-product choice: any plain silken tofu brand works identically.

Every ingredient verified against the live reference database before
being written in, same discipline as every other batch.

Usage:
  py scripts/add_vegan_meal_plan_breakfasts.py
"""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "assets" / "data" / "foods_reference.db"

SILKEN_TOFU = ("Legume", "MORI-NU, Tofu, silken, firm")
TOFU = ("Legume", "Tofu")
NUTRITIONAL_YEAST = ("Mushroom", "Yeast flakes/nutritional yeast")
SOY_MILK = ("Legume", "Soybeans, soy milk, regular")
ALMOND_BUTTER = ("NutSeed", "Nuts, almond butter, plain")
PEANUT_BUTTER = ("Legume", "Peanut butter, chunk style, without salt")
BLACK_BEANS = ("Legume", "Black Beans")
CHIA_SEEDS = ("NutSeed", "Chia seeds")
OATS = ("Grain", "Oats")
BUCKWHEAT = ("Grain", "Buckwheat")
MILLET = ("Grain", "Millet")
QUINOA = ("Grain", "Quinoa")
ALMONDS = ("NutSeed", "Almonds")
WALNUT = ("NutSeed", "Walnut")
CASHEW = ("NutSeed", "Cashew nut")
PISTACHIO = ("NutSeed", "Pistachio nut")
COCONUT_MILK = ("NutSeed", "Coconut milk")
HEMP_SEED = ("NutSeed", "Hemp seeds")
FLAXSEED = ("NutSeed", "Flaxseed Seeds")
MAPLE_SYRUP = ("Sweets", "Maple Syrup (100% Pure)")
VANILLA = ("Herbs", "Vanilla extract")

SPINACH = ("Veg", "Spinach")
BANANA = ("Fruit", "Banana")
PINEAPPLE = ("Fruit", "Pineapple")
TURMERIC = ("Herbs", "Turmeric, dried, ground")
BLACK_PEPPER = ("Herbs", "Pepper, black, ground")
CINNAMON = ("Herbs", "Spices, cinnamon, ground")
BRAZIL_NUT = ("NutSeed", "Brazil nut")
BLUEBERRY = ("Fruit", "Blueberry")
STRAWBERRY = ("Fruit", "Strawberry")
ORANGE = ("Fruit", "Orange")
GINGER_ROOT = ("Herbs", "Ginger root")
LIME = ("Fruit", "Lime")
RASPBERRY = ("Fruit", "Raspberry")
RED_BELL_PEPPER = ("Veg", "Red Bell Pepper")
ONION = ("Veg", "Onion")
POTATO = ("Veg", "Potato")
OLIVE_OIL = ("Fats", "Olive Oil (Extra Virgin)")
SALT = ("Herbs", "Common salt/table salt")
BLACK_PEPPER_2 = ("Herbs", "Pepper, black, ground")
AVOCADO = ("Fruit", "Avocado")
TOMATO = ("Veg", "Tomato")
LEMON = ("Fruit", "Lemon")
TORTILLA_MIX = ("PantryStaples", "Wheat flour, white, tortilla mix, enriched")
CILANTRO = ("Veg", "Coriander (cilantro) leaves")
CHEDDAR_SKIP = None
KIWI = ("Fruit", "Kiwi fruit")
PEACH = ("Fruit", "Peach")
PAPAYA = ("Fruit", "Papaya")
GRAPEFRUIT = ("Fruit", "Grapefruit")
FIG = ("Fruit", "Fig")
DATE = ("Fruit", "Date")
NECTARINE = ("Fruit", "Nectarine")
CLEMENTINE = ("Fruit", "Clementine")
PLUM = ("Fruit", "Plum")
WATERMELON = ("Fruit", "Watermelon")
CANTALOUPE = ("Fruit", "Cantaloupe Melon")
PEAR = ("Fruit", "Pear")
MANGO = ("Fruit", "Mango")
BLACKBERRY = ("Fruit", "Blackberry")
APRICOT = ("Fruit", "Apricot")
MINT = ("Herbs", "Spices, spearmint, fresh")
GARLIC = ("Veg", "Garlic")

RECIPES = [
    ("curated_vegan_smoothie_green_glow", "smoothie", "Green Glow Vegan Protein Smoothie",
     "A vegetable-forward green smoothie, built on silken tofu for real morning protein.",
     "Silken tofu blends completely smooth into a fruit smoothie, adding real plant protein without changing the texture the way a scoop of protein powder would.",
     1.0, 2.0, "cup", 1,
     [(*SPINACH, 1.5, "cup", None, None, None), (*BANANA, 1, "each", "sliced", None, None),
      (*PINEAPPLE, 0.5, "cup", "diced", None, None), (*SILKEN_TOFU, 150, "g", None, None, None),
      (*CHIA_SEEDS, 1, "tbsp", None, None, None)]),
    ("curated_vegan_smoothie_golden_turmeric", "smoothie", "Golden Turmeric Vegan Protein Smoothie",
     "A creamy, spiced smoothie built around turmeric, with silken tofu for real morning protein.",
     "Black pepper noticeably improves how well the body absorbs turmeric's curcumin, and silken tofu keeps this a real protein breakfast rather than a fruit-and-spice drink.",
     1.0, 2.0, "cup", 2,
     [(*TURMERIC, 0.5, "tsp", None, None, None), (*BANANA, 1, "each", "sliced", None, None),
      (*SILKEN_TOFU, 150, "g", None, None, None), (*BLACK_PEPPER, 0.125, "tsp", None, None, "a pinch"),
      (*CINNAMON, 0.25, "tsp", None, None, None), (*MAPLE_SYRUP, 1, "tsp", None, None, "optional")]),
    ("curated_vegan_smoothie_brazil_nut_selenium", "smoothie", "Brazil Nut Selenium Vegan Protein Smoothie",
     "A notably selenium-rich smoothie built around Brazil nuts, with silken tofu for real morning protein.",
     "Brazil nuts are one of the most concentrated food sources of selenium that exists, just a couple of nuts can cover a full day's worth, and silken tofu keeps this a real protein breakfast.",
     1.0, 2.0, "cup", 3,
     [(*BRAZIL_NUT, 2, "each", None, None, None), (*PINEAPPLE, 1, "cup", "diced", None, None),
      (*SILKEN_TOFU, 120, "g", None, None, None), (*COCONUT_MILK, 60, "ml", None, None, None),
      (*BANANA, 1, "each", "sliced", None, None)]),
    ("curated_vegan_smoothie_berry_antioxidant", "smoothie", "Berry Antioxidant Vegan Protein Smoothie",
     "A vibrant double-berry smoothie, built on silken tofu for real morning protein.",
     "Blueberries and strawberries each carry their distinct set of antioxidant compounds, and silken tofu keeps this a real protein breakfast rather than a fruit punch.",
     1.0, 2.0, "cup", 4,
     [(*BLUEBERRY, 1, "cup", "whole", None, None), (*STRAWBERRY, 1, "cup", "whole", None, None),
      (*FLAXSEED, 1, "tbsp", "whole", None, None), (*SILKEN_TOFU, 150, "g", None, None, None),
      (*MAPLE_SYRUP, 1, "tsp", None, None, "optional")]),
    ("curated_vegan_smoothie_iron_vitamin_c", "smoothie", "Iron & Vitamin C Vegan Protein Smoothie",
     "An iron-and-vitamin-C-paired fruit and greens smoothie, built on silken tofu for real morning protein.",
     "Vitamin C measurably improves how well the body absorbs the non-heme iron found in plant foods like spinach and tofu alike, which is exactly why they're paired here.",
     1.0, 2.0, "cup", 5,
     [(*SPINACH, 1, "cup", "whole", None, None), (*ORANGE, 1, "each", "quartered", None, None),
      (*STRAWBERRY, 1, "cup", "whole", None, None), (*BANANA, 1, "each", "sliced", None, None),
      (*SILKEN_TOFU, 150, "g", None, None, None)]),
    ("curated_vegan_smoothie_tropical_ginger", "smoothie", "Tropical Ginger Vegan Protein Smoothie",
     "A bright, gingery tropical smoothie, built on silken tofu for real morning protein.",
     "Fresh ginger has a long-documented history of settling an upset stomach, and silken tofu keeps this a real protein breakfast rather than a fruit drink.",
     1.0, 2.0, "cup", 6,
     [(*PINEAPPLE, 1.5, "cup", "diced", None, None), (*GINGER_ROOT, 1, "tsp", "grated", None, None),
      (*BANANA, 1, "each", "sliced", None, None), (*SILKEN_TOFU, 150, "g", None, None, None),
      (*LIME, 1, "tbsp", "juiced", None, None)]),
    ("curated_vegan_berries_silken_tofu_cream", "snack", "Berries with Silken Tofu Cream",
     "Sweet berries over a whipped silken tofu cream, a real vegan stand-in for a yogurt bowl.",
     "Blended silken tofu, a little vanilla, and a touch of maple syrup whip up into a genuinely creamy, spoonable base, the same real protein-forward format this plan's dairy version uses.",
     1.0, 1.0, "bowl", 7,
     [(*SILKEN_TOFU, 150, "g", None, None, "blended smooth"), (*VANILLA, 0.5, "tsp", None, None, None),
      (*MAPLE_SYRUP, 1, "tsp", None, None, None), (*BLUEBERRY, 40, "g", "whole", None, None),
      (*STRAWBERRY, 40, "g", "sliced", None, None), (*ALMONDS, 10, "g", "sliced", None, None)]),
    ("curated_vegan_tofu_scramble_potatoes", "snack", "Tofu Scramble with Veggies and Roasted Potatoes",
     "Turmeric and nutritional yeast turn crumbled tofu into a real, egg-like savory scramble.",
     "Nutritional yeast is a genuine, common whole-food fortification source of vitamin B12 for a vegan diet, not just a flavor trick, and turmeric gives the tofu its own real egg-yellow color.",
     1.0, 1.0, "plate", 8,
     [(*POTATO, 100, "g", "diced", "Roasted", None), (*OLIVE_OIL, 10, "ml", None, None, None),
      (*TOFU, 150, "g", "crumbled", "Sauteed", None), (*TURMERIC, 1, "g", None, None, None),
      (*NUTRITIONAL_YEAST, 5, "g", None, None, None), (*RED_BELL_PEPPER, 40, "g", "diced", None, None),
      (*ONION, 20, "g", "diced", None, None), (*SALT, 1, "g", None, None, None)]),
    ("curated_vegan_overnight_oats_chia_berries", "snack", "Overnight Oats with Chia, Soy Milk, and Mixed Berries",
     "Creamy make-ahead oats, built on real soy milk and almond butter for real morning protein.",
     "Chia and rolled oats both bring soluble fiber, and almond butter stirred into soy milk brings real plant protein and healthy fat, the same real breakfast principle this plan's dairy version follows.",
     1.0, 1.0, "bowl", 9,
     [(*OATS, 40, "g", None, None, None), (*CHIA_SEEDS, 10, "g", None, None, None),
      (*SOY_MILK, 150, "ml", None, None, None), (*ALMOND_BUTTER, 15, "g", None, None, None),
      (*MAPLE_SYRUP, 5, "g", None, None, "optional"), (*BLUEBERRY, 30, "g", "whole", None, None),
      (*RASPBERRY, 30, "g", "whole", None, None)]),
    ("curated_vegan_tofu_avocado_tomato", "snack", "Marinated Tofu with Avocado and Tomato",
     "Pan-seared marinated tofu against cool avocado and juicy tomato.",
     "Tofu takes on whatever it's seasoned with, and a quick soy-and-lemon marinade gives it a real savory depth close to the egg dish it's standing in for.",
     1.0, 1.0, "plate", 10,
     [(*TOFU, 150, "g", "cubed", "Sauteed", None), (*AVOCADO, 60, "g", "sliced", None, None),
      (*TOMATO, 60, "g", "sliced", None, None), (*LEMON, 5, "g", "juiced", None, None),
      (*OLIVE_OIL, 5, "ml", None, None, None), (*SALT, 0.5, "g", None, None, None)]),
    ("curated_vegan_savory_quinoa_bowl_tofu_scramble", "snack", "Savory Breakfast Quinoa Bowl with Tofu Scramble and Spinach",
     "A savory grain bowl, turmeric-tofu scramble and wilted spinach over quinoa.",
     "A whole grain, a leafy green, and a real plant protein together for breakfast, not just at dinner.",
     1.0, 1.0, "bowl", 11,
     [(*QUINOA, 75, "g", "cooked", None, None), (*TOFU, 100, "g", "crumbled", "Sauteed", None),
      (*TURMERIC, 0.5, "g", None, None, None), (*SPINACH, 30, "g", "whole", "Sauteed", None),
      (*RED_BELL_PEPPER, 15, "g", "diced", None, None), (*OLIVE_OIL, 5, "ml", None, None, None),
      (*SALT, 0.5, "g", None, None, None)]),
    ("curated_vegan_cashew_cream_pineapple_walnuts", "snack", "Silken Tofu Cream with Pineapple and Walnuts",
     "Cool, thick silken tofu cream against sweet pineapple and crunchy walnut.",
     "Silken tofu is a notably concentrated plant protein source for its calorie count, and walnuts are one of the few whole foods carrying meaningful omega-3 fat.",
     1.0, 1.0, "bowl", 12,
     [(*SILKEN_TOFU, 150, "g", None, None, "blended smooth"), (*VANILLA, 0.5, "tsp", None, None, None),
      (*PINEAPPLE, 75, "g", "diced", None, None), (*WALNUT, 15, "g", "chopped", None, None),
      (*MAPLE_SYRUP, 5, "g", None, None, "optional")]),
    ("curated_vegan_breakfast_burrito_tofu_black_beans", "handheld", "Vegan Breakfast Burrito with Tofu Scramble and Black Beans",
     "Turmeric tofu scramble and black beans wrapped up with a fresh, homemade pico.",
     "Beans alongside a tofu scramble turns this into a genuinely complete plant protein, carrying real fiber a processed vegan sausage substitute wouldn't.",
     1.0, 1.0, "burrito", 13,
     [(*TORTILLA_MIX, 60, "g", None, "Baked", None), (*TOFU, 120, "g", "crumbled", "Sauteed", None),
      (*TURMERIC, 0.5, "g", None, None, None), (*NUTRITIONAL_YEAST, 5, "g", None, None, None),
      (*BLACK_BEANS, 60, "g", None, None, None), (*TOMATO, 30, "g", "diced", None, "for a fresh pico"),
      (*ONION, 10, "g", "diced", None, "for a fresh pico"), (*CILANTRO, 3, "g", "chopped", None, "for a fresh pico"),
      (*LIME, 5, "g", "juiced", None, "for a fresh pico")]),
    ("curated_vegan_baked_oatmeal_cup_banana_cinnamon", "bakedGoods", "Baked Oatmeal Cup with Banana, Cinnamon, and Flax Egg",
     "A single-serving baked oatmeal, a real flax egg standing in for the usual chicken egg.",
     "A flaxseed-and-water \"flax egg,\" left to sit until it gels, is a genuine, common whole-food binder in vegan baking, not an artificial substitute.",
     1.0, 1.0, "cup", 14,
     [(*OATS, 50, "g", None, "Baked", None), (*FLAXSEED, 7, "g", "ground, mixed with 21g water", None, "as a flax egg"),
      (*BANANA, 100, "g", "mashed", None, None), (*SOY_MILK, 100, "ml", None, None, None),
      (*CINNAMON, 2, "g", None, None, None), (*MAPLE_SYRUP, 5, "g", None, None, "optional")]),
    ("curated_vegan_kiwi_almond_tofu_bowl", "snack", "Kiwi and Almond Butter Tofu Bowl",
     "Bright green kiwi against a creamy almond-butter silken tofu base.",
     "Kiwi carries more vitamin C gram for gram than an orange, and almond butter stirred into silken tofu brings real plant protein and healthy fat together.",
     1.0, 1.0, "bowl", 15,
     [(*SILKEN_TOFU, 120, "g", None, None, "blended smooth"), (*ALMOND_BUTTER, 15, "g", None, None, None),
      (*KIWI, 100, "g", "sliced", None, None), (*MAPLE_SYRUP, 5, "g", None, None, "optional")]),
    ("curated_vegan_peach_almond_overnight_oats", "snack", "Peach and Almond Soy Milk Overnight Oats",
     "Creamy make-ahead oats, sliced peach folded through, built on soy milk and almond butter.",
     "Peach brings a different, gentler fiber profile than the berries most overnight-oats recipes default to, and almond butter keeps this a real protein breakfast.",
     1.0, 1.0, "bowl", 16,
     [(*OATS, 40, "g", None, None, None), (*SOY_MILK, 150, "ml", None, None, None),
      (*CHIA_SEEDS, 8, "g", None, None, None), (*PEACH, 75, "g", "diced", None, None),
      (*ALMOND_BUTTER, 12, "g", None, None, None), (*MAPLE_SYRUP, 5, "g", None, None, "optional")]),
    ("curated_vegan_papaya_cashew_tofu_bowl", "snack", "Papaya and Cashew Tofu Bowl",
     "Sweet, soft papaya against a creamy cashew silken tofu base.",
     "Papaya carries papain, a digestive enzyme unique among common breakfast fruit, and blended silken tofu keeps this a real protein breakfast.",
     1.0, 1.0, "bowl", 17,
     [(*SILKEN_TOFU, 120, "g", None, None, "blended smooth"), (*PAPAYA, 100, "g", "diced", None, None),
      (*CASHEW, 10, "g", "chopped", None, None), (*LIME, 5, "g", "juiced", None, None)]),
    ("curated_vegan_buckwheat_porridge_blueberries_walnuts", "snack", "Buckwheat Porridge with Blueberries, Walnuts, and Almond Butter",
     "A warm, nutty porridge, buckwheat groats standing in for oats, finished with real almond butter for protein.",
     "Buckwheat is naturally gluten-free despite its name, and almond butter stirred in once the porridge is off the heat adds real plant protein without needing dairy at all.",
     1.0, 1.0, "bowl", 18,
     [(*BUCKWHEAT, 45, "g", "cooked", None, None), (*SOY_MILK, 150, "ml", None, None, None),
      (*ALMOND_BUTTER, 15, "g", None, None, "stirred in at the end"), (*BLUEBERRY, 40, "g", "whole", None, None),
      (*WALNUT, 15, "g", "chopped", None, None), (*CINNAMON, 1, "g", None, None, None),
      (*MAPLE_SYRUP, 5, "g", None, None, "optional")]),
    ("curated_vegan_millet_porridge_apricots", "snack", "Warm Spiced Millet Porridge with Apricots and Almond Butter",
     "A creamy, gently spiced porridge built on millet instead of oats, finished with real almond butter for protein.",
     "Millet is a whole grain most Western breakfasts never reach for, and almond butter stirred in once the porridge is off the heat adds real plant protein.",
     1.0, 1.0, "bowl", 19,
     [(*MILLET, 45, "g", "cooked", None, None), (*SOY_MILK, 150, "ml", None, None, None),
      (*ALMOND_BUTTER, 15, "g", None, None, "stirred in at the end"), (*APRICOT, 60, "g", "diced", None, None),
      (*CINNAMON, 1, "g", None, None, None), (*MAPLE_SYRUP, 5, "g", None, None, "optional")]),
    ("curated_vegan_grapefruit_tofu_maple", "snack", "Grapefruit and Silken Tofu Bowl with Maple",
     "Tart, juicy grapefruit against cool, thick silken tofu cream.",
     "Grapefruit is a real, concentrated vitamin C source with a genuinely different flavor profile than orange, worth rotating in for variety alone.",
     1.0, 1.0, "bowl", 20,
     [(*SILKEN_TOFU, 150, "g", None, None, "blended smooth"), (*VANILLA, 0.5, "tsp", None, None, None),
      (*GRAPEFRUIT, 100, "g", "segmented", None, None), (*MAPLE_SYRUP, 5, "g", None, None, None)]),
    ("curated_vegan_fig_walnut_tofu_bowl", "snack", "Fig and Walnut Tofu Bowl",
     "Sweet, chewy fig against crunchy walnut and creamy silken tofu.",
     "Fresh fig carries real potassium and fiber, and blended silken tofu keeps this a real protein breakfast rather than fruit alone.",
     1.0, 1.0, "bowl", 21,
     [(*SILKEN_TOFU, 150, "g", None, None, "blended smooth"), (*FIG, 80, "g", "quartered", None, None),
      (*WALNUT, 15, "g", "chopped", None, None), (*MAPLE_SYRUP, 5, "g", None, None, "optional")]),
    ("curated_vegan_date_cashew_tofu_bowl", "snack", "Date and Cashew Tofu Bowl",
     "Naturally sweet date pieces against crunchy cashew and creamy silken tofu.",
     "Dates concentrate a real amount of potassium and fiber into a small amount of fruit, unusual for something this sweet.",
     1.0, 1.0, "bowl", 22,
     [(*SILKEN_TOFU, 150, "g", None, None, "blended smooth"), (*DATE, 40, "g", "chopped", None, None),
      (*CASHEW, 15, "g", "chopped", None, None), (*CINNAMON, 1, "g", None, None, None)]),
    ("curated_vegan_nectarine_chia_pudding_cashews", "snack", "Nectarine Chia Pudding with Cashews",
     "A creamy chia pudding, diced nectarine and toasted cashew folded in, built on real soy milk.",
     "Nectarine carries the same nutrient profile as peach, and soy milk is one of the few plant milks carrying a real, complete protein of its own.",
     1.0, 1.0, "bowl", 23,
     [(*CHIA_SEEDS, 30, "g", None, None, None), (*SOY_MILK, 150, "ml", None, None, None),
      (*NECTARINE, 75, "g", "diced", None, None), (*CASHEW, 15, "g", "chopped", None, None),
      (*MAPLE_SYRUP, 5, "g", None, None, "optional")]),
    ("curated_vegan_clementine_almond_tofu_bowl", "snack", "Clementine and Almond Tofu Bowl",
     "Sweet clementine segments against creamy silken tofu and sliced almond.",
     "Clementine is one of the easiest citrus fruits to actually eat whole rather than juice, keeping its own fiber intact.",
     1.0, 1.0, "bowl", 24,
     [(*SILKEN_TOFU, 150, "g", None, None, "blended smooth"), (*CLEMENTINE, 100, "g", "segmented", None, None),
      (*ALMONDS, 15, "g", "sliced", None, None), (*MAPLE_SYRUP, 5, "g", None, None, "optional")]),
    ("curated_vegan_plum_walnut_overnight_oats", "snack", "Plum and Walnut Soy Milk Overnight Oats",
     "Creamy make-ahead oats, sliced plum and walnut folded in, built on soy milk.",
     "Plum's own skin carries a real concentration of the same antioxidant pigments found in blueberry, and soy milk keeps this a real protein breakfast.",
     1.0, 1.0, "bowl", 25,
     [(*OATS, 40, "g", None, None, None), (*SOY_MILK, 150, "ml", None, None, None),
      (*PLUM, 75, "g", "sliced", None, None), (*WALNUT, 15, "g", "chopped", None, None),
      (*MAPLE_SYRUP, 5, "g", None, None, "optional")]),
    ("curated_vegan_watermelon_tofu_bowl", "snack", "Watermelon and Marinated Tofu Bowl",
     "A savory-sweet breakfast: cool watermelon against salty, lime-marinated tofu cubes.",
     "Marinated tofu standing in for feta brings the same real salty contrast against sweet watermelon, without the dairy.",
     1.0, 1.0, "bowl", 26,
     [(*WATERMELON, 150, "g", "cubed", None, None), (*TOFU, 60, "g", "cubed", None, "marinated in lime and salt"),
      (*LIME, 5, "g", "juiced", None, None), (*OLIVE_OIL, 5, "ml", None, None, None),
      (*MINT, 2, "g", "chopped", None, None), (*SALT, 0.5, "g", None, None, None)]),
    ("curated_vegan_cantaloupe_tofu_maple", "snack", "Cantaloupe and Silken Tofu Bowl with Maple",
     "Sweet, fragrant cantaloupe against cool, thick silken tofu cream.",
     "Cantaloupe is a genuinely concentrated whole-food source of vitamin A, and blended silken tofu keeps this a real protein breakfast.",
     1.0, 1.0, "bowl", 27,
     [(*SILKEN_TOFU, 150, "g", None, None, "blended smooth"), (*CANTALOUPE, 100, "g", "cubed", None, None),
      (*MAPLE_SYRUP, 5, "g", None, None, None)]),
    ("curated_vegan_pear_walnut_tofu_bowl", "snack", "Pear and Walnut Tofu Bowl",
     "Sliced pear and crunchy walnut against creamy silken tofu.",
     "Pear's own skin carries most of its fiber, worth leaving on rather than peeling away.",
     1.0, 1.0, "bowl", 28,
     [(*SILKEN_TOFU, 150, "g", None, None, "blended smooth"), (*PEAR, 100, "g", "sliced", None, None),
      (*WALNUT, 15, "g", "chopped", None, None), (*CINNAMON, 1, "g", None, None, None)]),
    ("curated_vegan_fig_pistachio_overnight_oats", "snack", "Fig and Pistachio Soy Milk Overnight Oats",
     "Creamy make-ahead oats, chopped fig and pistachio folded in, built on soy milk.",
     "Fig and pistachio are a genuinely traditional Mediterranean pairing, and soy milk keeps this a real protein breakfast.",
     1.0, 1.0, "bowl", 29,
     [(*OATS, 40, "g", None, None, None), (*SOY_MILK, 150, "ml", None, None, None),
      (*FIG, 60, "g", "chopped", None, None), (*PISTACHIO, 15, "g", "chopped", None, None),
      (*MAPLE_SYRUP, 5, "g", None, None, "optional")]),
    ("curated_vegan_apricot_cashew_tofu_bowl", "snack", "Apricot and Cashew Tofu Bowl",
     "Sliced apricot and toasted cashew against creamy silken tofu.",
     "Apricot is a genuinely concentrated whole-food source of vitamin A, from the same beta-carotene family behind its own orange color.",
     1.0, 1.0, "bowl", 30,
     [(*SILKEN_TOFU, 150, "g", None, None, "blended smooth"), (*APRICOT, 80, "g", "sliced", None, None),
      (*CASHEW, 15, "g", "chopped", None, None), (*MAPLE_SYRUP, 5, "g", None, None, "optional")]),
    ("curated_vegan_date_walnut_tofu_bowl", "snack", "Date and Walnut Tofu Bowl",
     "Chopped date and walnut folded through creamy silken tofu.",
     "Date and walnut together bring natural sweetness and healthy fat into the same bowl, without any added sugar doing the work.",
     1.0, 1.0, "bowl", 31,
     [(*SILKEN_TOFU, 150, "g", None, None, "blended smooth"), (*DATE, 40, "g", "chopped", None, None),
      (*WALNUT, 15, "g", "chopped", None, None), (*CINNAMON, 1, "g", None, None, None)]),
    ("curated_vegan_mango_coconut_chia_pudding", "snack", "Mango and Coconut Chia Pudding with Hemp Seeds",
     "A creamy, tropical chia pudding, coconut milk and diced mango folded in, hemp seeds for real protein.",
     "Hemp seeds are a real, complete plant protein on their own, an easy way to boost a coconut-milk pudding without needing dairy or soy.",
     1.0, 1.0, "bowl", 32,
     [(*CHIA_SEEDS, 30, "g", None, None, None), (*COCONUT_MILK, 150, "ml", None, None, None),
      (*HEMP_SEED, 15, "g", None, None, None), (*MANGO, 75, "g", "diced", None, None),
      (*MAPLE_SYRUP, 5, "g", None, None, "optional")]),
    ("curated_vegan_cashew_ricotta_fig_maple", "snack", "Silken Tofu Ricotta with Fig and Maple",
     "A firmer, lemon-brightened silken tofu \"ricotta\" against sliced fig and maple.",
     "A little lemon juice thickens blended silken tofu into something closer to ricotta than a smoothie base, a genuinely different texture from this plan's other tofu bowls.",
     1.0, 1.0, "bowl", 33,
     [(*SILKEN_TOFU, 150, "g", None, None, "blended smooth"), (*LEMON, 5, "g", "juiced", None, None),
      (*FIG, 60, "g", "sliced", None, None), (*MAPLE_SYRUP, 5, "g", None, None, None)]),
    ("curated_vegan_pear_almond_tofu_bowl", "snack", "Pear and Almond Tofu Bowl",
     "Sliced pear and toasted almond against creamy silken tofu.",
     "Pear and almond together bring a mild, real sweetness balanced against almond's own gentle crunch and fat.",
     1.0, 1.0, "bowl", 34,
     [(*SILKEN_TOFU, 150, "g", None, None, "blended smooth"), (*PEAR, 100, "g", "sliced", None, None),
      (*ALMONDS, 15, "g", "sliced", None, None), (*MAPLE_SYRUP, 5, "g", None, None, "optional")]),
    ("curated_vegan_kiwi_coconut_chia_pudding", "snack", "Kiwi and Coconut Chia Pudding with Hemp Seeds",
     "A creamy, tropical chia pudding, sliced kiwi folded through coconut milk, hemp seeds for real protein.",
     "Kiwi's own black seeds are entirely edible, and hemp seeds add a real, complete plant protein without needing dairy or soy.",
     1.0, 1.0, "bowl", 35,
     [(*CHIA_SEEDS, 30, "g", None, None, None), (*COCONUT_MILK, 150, "ml", None, None, None),
      (*HEMP_SEED, 15, "g", None, None, None), (*KIWI, 75, "g", "sliced", None, None),
      (*MAPLE_SYRUP, 5, "g", None, None, "optional")]),
    ("curated_vegan_papaya_lime_tofu_bowl", "snack", "Papaya and Lime Tofu Bowl",
     "Soft, sweet papaya brightened with fresh lime against creamy silken tofu.",
     "Lime juice over papaya is a real, traditional pairing found across Latin American and Southeast Asian cooking alike.",
     1.0, 1.0, "bowl", 36,
     [(*SILKEN_TOFU, 150, "g", None, None, "blended smooth"), (*PAPAYA, 100, "g", "diced", None, None),
      (*LIME, 5, "g", "juiced", None, None)]),
    ("curated_vegan_blackberry_almond_tofu_bowl", "snack", "Blackberry and Almond Tofu Bowl",
     "Tart blackberries and toasted almond against creamy silken tofu.",
     "Blackberries carry a genuinely high fiber content for a fruit this size, most of it concentrated in their own small seeds.",
     1.0, 1.0, "bowl", 37,
     [(*SILKEN_TOFU, 150, "g", None, None, "blended smooth"), (*BLACKBERRY, 80, "g", "whole", None, None),
      (*ALMONDS, 15, "g", "sliced", None, None), (*MAPLE_SYRUP, 5, "g", None, None, "optional")]),
    ("curated_vegan_clementine_pistachio_tofu_bowl", "snack", "Clementine and Pistachio Tofu Bowl",
     "Sweet clementine segments and crunchy pistachio against creamy silken tofu.",
     "Clementine and pistachio together bring a genuinely different citrus-and-nut pairing than this plan's earlier kiwi bowl.",
     1.0, 1.0, "bowl", 38,
     [(*SILKEN_TOFU, 150, "g", None, None, "blended smooth"), (*CLEMENTINE, 100, "g", "segmented", None, None),
      (*PISTACHIO, 15, "g", "chopped", None, None), (*MAPLE_SYRUP, 5, "g", None, None, "optional")]),
    ("curated_vegan_apricot_coconut_overnight_oats", "snack", "Apricot and Coconut Soy Milk Overnight Oats",
     "Creamy make-ahead oats, coconut milk and diced apricot folded in, soy milk for real protein.",
     "Coconut milk brings a genuinely different, richer fat profile to overnight oats, and soy milk keeps real, complete protein in the mix.",
     1.0, 1.0, "bowl", 39,
     [(*OATS, 40, "g", None, None, None), (*COCONUT_MILK, 75, "ml", None, None, None),
      (*SOY_MILK, 75, "ml", None, None, None), (*APRICOT, 70, "g", "diced", None, None),
      (*MAPLE_SYRUP, 5, "g", None, None, "optional")]),
    ("curated_vegan_fig_cashew_overnight_oats", "snack", "Fig and Cashew Soy Milk Overnight Oats",
     "Creamy make-ahead oats, chopped fig and cashew folded in, built on soy milk.",
     "This plan's own closing week reaches for fig and cashew together, and soy milk keeps every one of them a real protein breakfast.",
     1.0, 1.0, "bowl", 40,
     [(*OATS, 40, "g", None, None, None), (*SOY_MILK, 150, "ml", None, None, None),
      (*FIG, 60, "g", "chopped", None, None), (*CASHEW, 15, "g", "chopped", None, None),
      (*MAPLE_SYRUP, 5, "g", None, None, "optional")]),
    ("curated_vegan_mango_pistachio_chia_pudding", "snack", "Mango and Pistachio Tofu Chia Pudding",
     "A creamy chia pudding, diced mango and chopped pistachio folded in, built on silken tofu.",
     "Mango and pistachio together bring a real, different texture contrast from this plan's earlier mango-and-coconut version.",
     1.0, 1.0, "bowl", 41,
     [(*CHIA_SEEDS, 30, "g", None, None, None), (*SILKEN_TOFU, 100, "g", None, None, "blended smooth"),
      (*SOY_MILK, 60, "ml", None, None, None), (*MANGO, 75, "g", "diced", None, None),
      (*PISTACHIO, 15, "g", "chopped", None, None), (*MAPLE_SYRUP, 5, "g", None, None, "optional")]),
    ("curated_vegan_grapefruit_pistachio_tofu_bowl", "snack", "Grapefruit and Pistachio Tofu Bowl",
     "A bright, tart closing breakfast: grapefruit segments and pistachio against creamy silken tofu.",
     "Grapefruit and pistachio together close this plan's own 6 weeks with the same real citrus-and-nut pairing pattern it opened with.",
     1.0, 1.0, "bowl", 42,
     [(*SILKEN_TOFU, 150, "g", None, None, "blended smooth"), (*GRAPEFRUIT, 100, "g", "segmented", None, None),
      (*PISTACHIO, 15, "g", "chopped", None, None), (*MAPLE_SYRUP, 5, "g", None, None, "optional")]),
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
