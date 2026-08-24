"""
Patches assets/data/foods_reference.db with the first real batch of the
6-Week Whole-Food Meal Plan's own new curated recipes -- 2026-08-24, direct
request: "at least 6 weeks worth of meals... a different meal set every day
without repeating meals... an array of all possible fruits and vegetables to
provide the largest different number of nutrients possible." 22 brand-new
recipes (7 breakfasts, 4 lunches, 11 dinners), covering days 1, 2, 8-14 of
lib/mealPlan.ts's own 42-day rotation; the other days reuse 20 of this
app's already-existing (already 1-person) curated recipes as-is, no new DB
rows needed for those.

Every (category, base_name) pair below was independently verified against
the live, bundled reference database via direct sqlite3 queries before being
written in, the same discipline every prior curated-recipe batch script has
followed. Two real, deliberate substitutions, named honestly rather than
silently made: no "salsa" row exists as a whole food (a jarred/commercial
product this app's own standing rule already steers away from -- "Home
cooking over commercial products"), so the breakfast burrito uses fresh
diced tomato, onion, cilantro, and lime instead; no sesame oil row exists at
all, so the fried rice leans on sesame seeds plus olive oil for that flavor
note instead of inventing a row. No whole-wheat sliced bread row exists
either (this database's own known, already-documented gap -- see
add_curated_recipes_batch2.py's own docstring), so nothing here needed
"toast": egg dishes are built as bowls instead.

builder_type is chosen from this app's own real 11 direct-ingredient
builders, not a new "meal" or "entree" type (none exists -- BuilderFavorite-
ItemType has no such value). Every genuinely composite dinner main
(salmon, pork, chicken, beef, tofu) uses 'side', this app's own genuinely
generic single-dish builder (its own real Food-tab copy describes it as
"any name/ingredients," never restricted to small vegetable portions --
see FOOD_LENS_COPY.sideBuilder in app/(tabs)/food.tsx), the closest real fit
among what actually exists. The two stews (green lentil, turkey black bean
chili) use 'soup', a genuine, better fit for a simmered, broth-based dish.

Safe to re-run: same INSERT ... ON CONFLICT(id) DO UPDATE / delete-then-
reinsert pattern every prior curated-recipe batch script already uses.

Usage:
  py scripts/add_meal_plan_recipes.py
"""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "assets" / "data" / "foods_reference.db"

# Verified (category, base_name) pairs.
SALMON = ("Meat", "Salmon Fillet (Raw)")
PORK_TENDERLOIN = ("Meat", "Pork Fillet / Tenderloin (Raw)")
COD = ("Meat", "Cod Fish")
GROUND_TURKEY = ("Meat", "Ground Turkey (Raw)")
SHRIMP = ("Meat", "Shrimp Crustaceans")
BEEF_SIRLOIN = ("Meat", "Beef Top Sirloin (Raw)")
CHICKEN_THIGH = ("Meat", "Chicken, broiler, thigh, meat without skin")
TURKEY_BREAST = ("Meat", "Turkey Breast (Raw)")
TOFU = ("Legume", "Tofu")
EGG = ("Dairy", "Chicken Egg (Raw)")
COTTAGE_CHEESE = ("Dairy", "Cottage Cheese")
CHEDDAR = ("Dairy", "Cheddar")
FETA = ("Dairy", "Feta")
GREEK_YOGURT = ("Dairy", "Yogurt, Greek, plain, lowfat")

MUSHROOM = ("Veg", "Mushroom, common, fresh")
BRUSSELS_SPROUTS = ("Veg", "Brussels sprout")
GREEN_PEAS = ("Veg", "Pea, green, fresh")
ZUCCHINI = ("Veg", "Zucchini, green skin, fresh, unpeeled")
ASPARAGUS = ("Veg", "Asparagus")
EGGPLANT = ("Veg", "Eggplant")
RED_BELL_PEPPER = ("Veg", "Red Bell Pepper")
POTATO = ("Veg", "Potato")
SWEET_POTATO = ("Veg", "Sweet potato")
ONION = ("Veg", "Onion")
GARLIC = ("Veg", "Garlic")
CARROT = ("Veg", "Carrot")
CELERY = ("Veg", "Celery")
TOMATO = ("Veg", "Tomato")
SPINACH = ("Veg", "Spinach")
CORN = ("Veg", "Corn, sweet, yellow")
CILANTRO = ("Veg", "Coriander (cilantro) leaves")

GREEN_LENTILS = ("Legume", "Lentil, green, hulled, dry")
WHITE_BEANS = ("Legume", "White Beans")
BLACK_BEANS = ("Legume", "Black Beans")
QUINOA = ("Grain", "Quinoa")
BROWN_RICE = ("Grain", "Grains, rice, brown, long-grain, dry")
OATS = ("Grain", "Oats")
CHIA_SEEDS = ("NutSeed", "Chia seeds")
WALNUT = ("NutSeed", "Walnut")
SESAME_SEED = ("NutSeed", "Sesame seed")
ALMOND_MILK = ("NutSeed", "Almond drink unsweetened")
PINEAPPLE = ("Fruit", "Pineapple")
BANANA = ("Fruit", "Banana")
BLUEBERRY = ("Fruit", "Blueberry")
RASPBERRY = ("Fruit", "Raspberry")
LEMON = ("Fruit", "Lemon")
LIME = ("Fruit", "Lime")
AVOCADO = ("Fruit", "Avocado")

OLIVE_OIL = ("Fats", "Olive Oil (Extra Virgin)")
SALT = ("Herbs", "Common salt/table salt")
BLACK_PEPPER = ("Herbs", "Pepper, black, ground")
GINGER_ROOT = ("Herbs", "Ginger root")
CINNAMON = ("Herbs", "Spices, cinnamon, ground")
PAPRIKA = ("Herbs", "Paprika")
CUMIN = ("Herbs", "Cumin (cummin) seed, dried, ground")
OREGANO = ("Herbs", "Oregano")
FRESH_DILL = ("Herbs", "Fresh Dill Weed")
FRESH_THYME = ("Herbs", "Fresh Thyme")
FRESH_ROSEMARY = ("Herbs", "Rosemary")
BASIL = ("Herbs", "Basil")
HONEY = ("Sweets", "Honeydew honey (Forest Honey)")
PARMESAN = ("Dairy", "Parmesan")

SOY_SAUCE = ("Legume", "Soy sauce made from soy and wheat (shoyu)")
TORTILLA_MIX = ("PantryStaples", "Wheat flour, white, tortilla mix, enriched")
VEGETABLE_STOCK = ("PantryStaples", "Vegetable stock")

# (id, builder_type, name, flavor_profile, health_benefit, servings,
#  serving_size_amount, serving_size_unit, sort_order,
#  ingredients: [(category, base_name, quantity, unit, cut_prep, cooking_method, prep_note)])
RECIPES = [
    # --- Breakfasts (7) ---
    ("curated_snack_veggie_cheddar_scramble_potatoes", "snack", "Veggie & Cheddar Scrambled Eggs with Roasted Potatoes",
     "Creamy scrambled eggs against crisp, golden roasted potato.",
     "A savory, protein-forward start to the day: whole eggs, real cheese, and roasted potato with its skin left on, instead of a processed breakfast sandwich.",
     1.0, 1.0, "plate", 1,
     [
         (*POTATO, 100, "g", "diced", "Roasted", None),
         (*OLIVE_OIL, 8, "ml", None, None, None),
         (*EGG, 2, "each", "whisked", "Scrambled", None),
         (*CHEDDAR, 20, "g", "shredded", None, None),
         (*RED_BELL_PEPPER, 40, "g", "diced", None, None),
         (*ONION, 20, "g", "diced", None, None),
         (*SALT, 1, "g", None, None, None),
         (*BLACK_PEPPER, 0.5, "g", None, None, None),
     ]),
    ("curated_snack_overnight_oats_chia_berries", "snack", "Overnight Oats with Chia and Mixed Berries",
     "Creamy, make-ahead oats, ready the moment you wake up.",
     "Chia and rolled oats both bring soluble fiber, and two differently-colored berries mean two distinct sets of antioxidant compounds instead of just one.",
     1.0, 1.0, "bowl", 2,
     [
         (*OATS, 40, "g", None, None, None),
         (*CHIA_SEEDS, 10, "g", None, None, None),
         (*ALMOND_MILK, 150, "ml", None, None, None),
         (*HONEY, 5, "g", None, None, None),
         (*BLUEBERRY, 30, "g", "whole", None, None),
         (*RASPBERRY, 30, "g", "whole", None, None),
     ]),
    ("curated_snack_soft_boiled_eggs_avocado_tomato", "snack", "Soft-Boiled Eggs with Avocado and Tomato",
     "Runny yolks against cool avocado and juicy tomato.",
     "Egg yolks are one of the most concentrated whole-food sources of choline, and avocado's fat helps the body absorb more of tomato's lycopene alongside it.",
     1.0, 1.0, "plate", 3,
     [
         (*EGG, 2, "each", None, "Boiled", None),
         (*AVOCADO, 60, "g", "sliced", None, None),
         (*TOMATO, 60, "g", "sliced", None, None),
         (*LEMON, 5, "g", "juiced", None, None),
         (*SALT, 0.5, "g", None, None, None),
         (*BLACK_PEPPER, 0.5, "g", None, None, None),
     ]),
    ("curated_snack_savory_quinoa_bowl_fried_egg", "snack", "Savory Breakfast Quinoa Bowl with Fried Egg and Spinach",
     "A savory grain bowl instead of a sweet one, wilted greens and a runny egg on top.",
     "A whole grain and a leafy green together for breakfast, not just at dinner: quinoa's complete plant protein plus spinach's iron and folate.",
     1.0, 1.0, "bowl", 4,
     [
         (*QUINOA, 75, "g", "cooked", None, None),
         (*EGG, 1, "each", None, "Fried", None),
         (*SPINACH, 30, "g", "whole", "Sauteed", None),
         (*RED_BELL_PEPPER, 15, "g", "diced", None, None),
         (*OLIVE_OIL, 5, "ml", None, None, None),
         (*SALT, 0.5, "g", None, None, None),
         (*BLACK_PEPPER, 0.5, "g", None, None, None),
     ]),
    ("curated_snack_cottage_cheese_pineapple_walnuts", "snack", "Cottage Cheese with Pineapple and Walnuts",
     "Cool, tangy cottage cheese against sweet pineapple and crunchy walnut.",
     "Cottage cheese is a notably concentrated protein source for its calorie count, and walnuts are one of the few whole-food sources carrying meaningful omega-3 fat.",
     1.0, 1.0, "bowl", 5,
     [
         (*COTTAGE_CHEESE, 150, "g", None, None, None),
         (*PINEAPPLE, 75, "g", "diced", None, None),
         (*WALNUT, 15, "g", "chopped", None, None),
         (*HONEY, 5, "g", None, None, None),
     ]),
    ("curated_handheld_breakfast_burrito_eggs_black_beans", "handheld", "Breakfast Burrito with Eggs and Black Beans",
     "Scrambled eggs and black beans wrapped up with a fresh, homemade pico.",
     "Beans alongside eggs turns a normally protein-only breakfast into a fiber source too, something most breakfast sandwiches skip entirely.",
     1.0, 1.0, "burrito", 6,
     [
         (*TORTILLA_MIX, 60, "g", None, "Baked", None),
         (*EGG, 2, "each", "whisked", "Scrambled", None),
         (*BLACK_BEANS, 60, "g", None, None, None),
         (*CHEDDAR, 15, "g", "shredded", None, None),
         (*TOMATO, 30, "g", "diced", None, "for a fresh pico"),
         (*ONION, 10, "g", "diced", None, "for a fresh pico"),
         (*CILANTRO, 3, "g", "chopped", None, "for a fresh pico"),
         (*LIME, 5, "g", "juiced", None, "for a fresh pico"),
     ]),
    ("curated_baked_oatmeal_cup_banana_cinnamon", "bakedGoods", "Baked Oatmeal Cup with Banana and Cinnamon",
     "A single-serving baked oatmeal, more like a soft muffin than a bowl of porridge.",
     "The same whole-grain oat fiber as a stovetop bowl, baked instead, with ripe banana doing most of the sweetening rather than added sugar.",
     1.0, 1.0, "cup", 7,
     [
         (*OATS, 50, "g", None, "Baked", None),
         (*EGG, 1, "each", "whisked", None, None),
         (*BANANA, 100, "g", "mashed", None, None),
         (*ALMOND_MILK, 100, "ml", None, None, None),
         (*CINNAMON, 2, "g", None, None, None),
         (*HONEY, 5, "g", None, None, None),
     ]),

    # --- Lunches (3) ---
    ("curated_side_ginger_soy_chicken_thighs", "side", "Ginger Soy Glazed Chicken Thighs",
     "A sticky-sweet, gingery glaze over juicy roasted chicken thigh.",
     "Chicken thigh carries more iron and zinc than breast meat, a real, often-overlooked trade-off worth knowing about beyond just fat content.",
     1.0, 1.0, "plate", 8,
     [
         (*CHICKEN_THIGH, 150, "g", None, "Roasted", None),
         (*SOY_SAUCE, 15, "ml", None, None, None),
         (*HONEY, 10, "g", None, None, None),
         (*GINGER_ROOT, 5, "g", "grated", None, None),
         (*GARLIC, 3, "g", "minced", None, None),
         (*OLIVE_OIL, 5, "ml", None, None, None),
     ]),
    ("curated_side_white_bean_roasted_vegetable_bowl", "side", "Mediterranean White Bean and Roasted Vegetable Bowl",
     "Creamy white beans against sweet roasted zucchini and eggplant.",
     "White beans bring plant protein and fiber together, a combination that slows how fast a meal's own carbohydrates raise blood sugar.",
     1.0, 1.0, "bowl", 9,
     [
         (*WHITE_BEANS, 100, "g", None, None, None),
         (*ZUCCHINI, 100, "g", "diced", "Roasted", None),
         (*EGGPLANT, 80, "g", "diced", "Roasted", None),
         (*TOMATO, 50, "g", "diced", None, None),
         (*FETA, 15, "g", "crumbled", None, None),
         (*OLIVE_OIL, 10, "ml", None, None, None),
         (*LEMON, 10, "g", "juiced", None, None),
         (*OREGANO, 1, "g", None, None, None),
     ]),
    ("curated_side_egg_vegetable_fried_rice", "side", "Egg and Vegetable Fried Rice",
     "Whole-grain fried rice, real vegetables folded through scrambled egg.",
     "Brown rice keeps its own bran layer intact, carrying fiber and B vitamins a white-rice fried rice would already have milled away.",
     1.0, 1.0, "bowl", 10,
     [
         (*BROWN_RICE, 100, "g", "cooked", None, None),
         (*EGG, 1, "each", "whisked", None, None),
         (*GREEN_PEAS, 40, "g", None, None, None),
         (*CARROT, 40, "g", "diced", None, None),
         (*ONION, 20, "g", "diced", None, None),
         (*SOY_SAUCE, 10, "ml", None, None, None),
         (*SESAME_SEED, 5, "g", None, None, None),
         (*OLIVE_OIL, 5, "ml", None, None, None),
     ]),

    # --- Dinners (11) ---
    ("curated_side_baked_salmon_lemon_dill", "side", "Baked Salmon with Lemon and Dill",
     "Flaky baked salmon, bright with fresh lemon and dill.",
     "Salmon is one of the more concentrated whole-food sources of long-chain omega-3 fat, the kind most Western diets fall short on.",
     1.0, 1.0, "fillet", 11,
     [
         (*SALMON, 150, "g", None, "Baked", None),
         (*OLIVE_OIL, 10, "ml", None, None, None),
         (*LEMON, 15, "g", "juiced, plus a few slices", None, None),
         (*FRESH_DILL, 3, "g", "chopped", None, None),
         (*SALT, 1, "g", None, None, None),
         (*BLACK_PEPPER, 0.5, "g", None, None, None),
     ]),
    ("curated_side_herb_crusted_pork_tenderloin", "side", "Herb-Crusted Pork Tenderloin",
     "Roasted pork tenderloin, rubbed with garlic, rosemary, and thyme.",
     "Pork tenderloin is one of the leaner cuts of pork available, closer to chicken breast in fat content than most other pork cuts.",
     1.0, 1.0, "serving", 12,
     [
         (*PORK_TENDERLOIN, 150, "g", None, "Roasted", None),
         (*OLIVE_OIL, 8, "ml", None, None, None),
         (*GARLIC, 3, "g", "minced", None, None),
         (*FRESH_ROSEMARY, 2, "g", "chopped", None, None),
         (*FRESH_THYME, 1, "g", "chopped", None, None),
         (*SALT, 1, "g", None, None, None),
         (*BLACK_PEPPER, 0.5, "g", None, None, None),
     ]),
    ("curated_side_baked_cod_paprika_lemon", "side", "Baked Cod with Paprika and Lemon",
     "A simple, flaky white fish, warmed through with paprika.",
     "Cod is a notably lean source of complete protein, delivering it for far less saturated fat than a red-meat dinner would.",
     1.0, 1.0, "fillet", 13,
     [
         (*COD, 150, "g", None, "Baked", None),
         (*OLIVE_OIL, 8, "ml", None, None, None),
         (*PAPRIKA, 2, "g", None, None, None),
         (*LEMON, 15, "g", "juiced", None, None),
         (*SALT, 1, "g", None, None, None),
         (*BLACK_PEPPER, 0.5, "g", None, None, None),
     ]),
    ("curated_side_turkey_meatballs_tomato_sauce", "side", "Turkey Meatballs in Tomato Sauce",
     "Lean turkey meatballs, simmered in a real, from-scratch tomato sauce.",
     "Ground turkey breast carries meaningfully less saturated fat than an equivalent amount of ground beef, without losing out on protein.",
     1.0, 1.0, "serving", 14,
     [
         (*GROUND_TURKEY, 150, "g", None, "Baked", None),
         (*EGG, 0.5, "each", "whisked", None, "as a binder"),
         (*PARMESAN, 10, "g", "grated", None, None),
         (*GARLIC, 3, "g", "minced", None, None),
         (*TOMATO, 200, "g", "crushed", "Simmered", None),
         (*ONION, 30, "g", "diced", None, None),
         (*OLIVE_OIL, 5, "ml", None, None, None),
         (*BASIL, 2, "g", "chopped", None, None),
         (*SALT, 1, "g", None, None, None),
     ]),
    ("curated_side_teriyaki_baked_tofu", "side", "Teriyaki-Style Baked Tofu",
     "Baked tofu cubes in a sticky, gingery glaze.",
     "Tofu is a complete plant protein carrying all nine essential amino acids, uncommon among plant foods.",
     1.0, 1.0, "serving", 15,
     [
         (*TOFU, 150, "g", "cubed", "Baked", None),
         (*SOY_SAUCE, 15, "ml", None, None, None),
         (*HONEY, 10, "g", None, None, None),
         (*GINGER_ROOT, 5, "g", "grated", None, None),
         (*GARLIC, 3, "g", "minced", None, None),
         (*SESAME_SEED, 5, "g", None, None, None),
     ]),
    ("curated_side_one_pan_shrimp_asparagus_rice", "side", "One-Pan Shrimp and Asparagus with Brown Rice",
     "Quick-cooked shrimp and asparagus over whole-grain rice.",
     "Shrimp is a notably lean, fast-cooking protein, and asparagus brings folate that most everyday dinner vegetables don't carry in the same amount.",
     1.0, 1.0, "bowl", 16,
     [
         (*SHRIMP, 150, "g", None, "Sauteed", None),
         (*ASPARAGUS, 100, "g", "trimmed", "Sauteed", None),
         (*BROWN_RICE, 75, "g", "cooked", None, None),
         (*OLIVE_OIL, 10, "ml", None, None, None),
         (*GARLIC, 3, "g", "minced", None, None),
         (*LEMON, 10, "g", "juiced", None, None),
         (*SALT, 1, "g", None, None, None),
     ]),
    ("curated_side_beef_mushroom_stir_fry_rice", "side", "Beef and Mushroom Stir-Fry with Brown Rice",
     "Thin-sliced beef and mushroom, stir-fried fast over high heat.",
     "Beef is one of the more concentrated whole-food sources of easily-absorbed heme iron, a different, better-absorbed form than the iron in plant foods.",
     1.0, 1.0, "bowl", 17,
     [
         (*BEEF_SIRLOIN, 130, "g", "sliced thin", "Sauteed", None),
         (*MUSHROOM, 100, "g", "sliced", "Sauteed", None),
         (*ONION, 50, "g", "sliced", None, None),
         (*GARLIC, 3, "g", "minced", None, None),
         (*GINGER_ROOT, 5, "g", "grated", None, None),
         (*SOY_SAUCE, 15, "ml", None, None, None),
         (*BROWN_RICE, 75, "g", "cooked", None, None),
         (*OLIVE_OIL, 5, "ml", None, None, None),
     ]),
    ("curated_side_baked_chicken_thighs_brussels_sweet_potato", "side", "Baked Chicken Thighs with Brussels Sprouts and Sweet Potato",
     "A real sheet-pan dinner: chicken thigh, brussels sprouts, and sweet potato roasted together.",
     "Brussels sprouts are cruciferous, carrying the same fiber and vitamin K family as broccoli and kale, in a dinner that doesn't already lean on either.",
     1.0, 1.0, "plate", 18,
     [
         (*CHICKEN_THIGH, 150, "g", None, "Baked", None),
         (*BRUSSELS_SPROUTS, 100, "g", "halved", "Roasted", None),
         (*SWEET_POTATO, 100, "g", "diced", "Roasted", None),
         (*OLIVE_OIL, 10, "ml", None, None, None),
         (*GARLIC, 3, "g", "minced", None, None),
         (*FRESH_ROSEMARY, 2, "g", "chopped", None, None),
         (*SALT, 1, "g", None, None, None),
         (*BLACK_PEPPER, 0.5, "g", None, None, None),
     ]),
    ("curated_soup_green_lentil_vegetable_stew", "soup", "Green Lentil and Vegetable Stew",
     "A thick, hearty stew, green lentils holding their shape better than red.",
     "Green lentils keep their structure through a long simmer, unlike red lentils, which break down and thicken a pot instead of staying whole.",
     1.0, 1.5, "cup", 19,
     [
         (*GREEN_LENTILS, 75, "g", None, None, None),
         (*CARROT, 50, "g", "diced", None, None),
         (*CELERY, 40, "g", "diced", None, None),
         (*ONION, 50, "g", "diced", None, None),
         (*GARLIC, 3, "g", "minced", None, None),
         (*TOMATO, 100, "g", "diced", None, None),
         (*VEGETABLE_STOCK, 7.5, "g", None, None, None),
         (*CUMIN, 2, "g", None, None, None),
         (*SALT, 1.5, "g", None, None, None),
     ]),
    ("curated_side_baked_turkey_breast_zucchini_tomatoes", "side", "Baked Turkey Breast with Zucchini and Tomatoes",
     "A light, herby sheet-pan dinner built around lean turkey breast.",
     "Turkey breast is one of the leanest common whole-food proteins available, delivering protein and B vitamins without much saturated fat alongside it.",
     1.0, 1.0, "plate", 20,
     [
         (*TURKEY_BREAST, 150, "g", None, "Baked", None),
         (*ZUCCHINI, 100, "g", "sliced", "Baked", None),
         (*TOMATO, 100, "g", "sliced", None, None),
         (*OLIVE_OIL, 10, "ml", None, None, None),
         (*GARLIC, 3, "g", "minced", None, None),
         (*OREGANO, 2, "g", None, None, None),
         (*SALT, 1, "g", None, None, None),
         (*BLACK_PEPPER, 0.5, "g", None, None, None),
     ]),
    ("curated_handheld_hummus_roasted_vegetable_wrap", "handheld", "Hummus and Roasted Vegetable Wrap",
     "A creamy, homemade chickpea hummus wrapped up with roasted vegetables.",
     "Whole chickpeas blended into hummus keep their own fiber intact, something a smooth, strained commercial hummus has often already lost.",
     1.0, 1.0, "wrap", 22,
     [
         (*TORTILLA_MIX, 60, "g", None, "Baked", None),
         (*("Legume", "Chickpeas (garbanzo beans, bengal gram)"), 60, "g", None, None, "blended into hummus"),
         (*("SaucesCondiments", "Tahini"), 15, "g", None, None, "blended into hummus"),
         (*LEMON, 8, "g", "juiced", None, "blended into hummus"),
         (*GARLIC, 1.5, "g", "minced", None, "blended into hummus"),
         (*ZUCCHINI, 60, "g", "sliced", "Roasted", None),
         (*RED_BELL_PEPPER, 40, "g", "sliced", "Roasted", None),
         (*ONION, 20, "g", "sliced", "Roasted", None),
         (*SPINACH, 20, "g", "whole", None, None),
         (*SALT, 0.5, "g", None, None, None),
     ]),
    ("curated_soup_turkey_black_bean_chili", "soup", "Turkey and Black Bean Chili",
     "A warming, one-pot chili built on lean ground turkey and black beans.",
     "Black beans bring fiber and plant protein alongside the turkey's own animal protein, a combination that stretches a smaller amount of meat further.",
     1.0, 1.5, "cup", 21,
     [
         (*GROUND_TURKEY, 130, "g", None, "Simmered", None),
         (*BLACK_BEANS, 100, "g", None, None, None),
         (*TOMATO, 100, "g", "diced", None, None),
         (*ONION, 40, "g", "diced", None, None),
         (*RED_BELL_PEPPER, 40, "g", "diced", None, None),
         (*CORN, 30, "g", None, None, None),
         (*GARLIC, 3, "g", "minced", None, None),
         (*CUMIN, 2, "g", None, None, None),
         (*PAPRIKA, 2, "g", None, None, None),
         (*VEGETABLE_STOCK, 5, "g", None, None, None),
         (*SALT, 1.5, "g", None, None, None),
     ]),
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
                builder_type = excluded.builder_type,
                name = excluded.name,
                flavor_profile = excluded.flavor_profile,
                health_benefit = excluded.health_benefit,
                servings = excluded.servings,
                serving_size_amount = excluded.serving_size_amount,
                serving_size_unit = excluded.serving_size_unit,
                sort_order = excluded.sort_order
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
