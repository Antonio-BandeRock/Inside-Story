"""
Patches assets/data/foods_reference.db with weeks 3-6 of the 6-Week
Whole-Food Meal Plan -- 2026-08-24, direct continuation of the same
request the first batch (scripts/add_meal_plan_recipes.py, weeks 1-2)
covered: "Keep going on weeks 3-6." 84 brand-new recipes (28 days x 3
meals), covering days 15-42 of lib/mealPlan.ts's own 42-day rotation.
Unlike weeks 1-2, no existing curated recipe was left to reuse (every
eligible Smoothie/Salad/Soup/Handheld/Side was already used exactly once
across days 1-14), so this batch is entirely new content.

Same discipline as every prior curated-recipe batch: every (category,
base_name) pair was independently verified against the live reference
database via direct sqlite3 queries before being written in here. This
batch deliberately reaches for whole foods days 1-14 never touched --
halibut, trout, tuna, sardine, mackerel, scallop, mussel, crab, lamb,
duck, bison, pork chop, pork loin, turkey thigh, kiwi, papaya, peach,
apricot, plum, nectarine, clementine, grapefruit, fig, date, watermelon,
cantaloupe, fennel, parsnip, leek, radish, turnip, collards, kohlrabi,
bok choy, okra, artichoke, snow peas, edamame, kidney beans, pinto beans,
lima beans, buckwheat, millet, spelt (a real, honestly-disclosed stand-in
for farro, since this database has no farro row of its own), bulgur,
wild rice, couscous, pistachio, and cashew -- alongside genuine repeats
of a handful of realistic everyday staples (chicken, turkey, salmon,
shrimp) in DIFFERENT dishes, the same way an actual person's own 6 weeks
of home cooking would.

builder_type follows the exact same real-11-builders discipline the
first batch's own docstring already explains (add_meal_plan_recipes.py)
-- 'side' for a genuinely composite main dish, no better real fit
existing; 'soup' for anything simmered and broth-based; 'salad' for a
real tossed or composed salad; 'snack' for a bowl-format breakfast;
'handheld' for a wrap.

Safe to re-run: same INSERT ... ON CONFLICT(id) DO UPDATE / delete-then-
reinsert pattern every prior curated-recipe batch script already uses.

Usage:
  py scripts/add_meal_plan_recipes_weeks3to6.py
"""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "assets" / "data" / "foods_reference.db"

# Verified (category, base_name) pairs.
CHICKEN_BREAST = ("Meat", "Chicken, broiler, breast, skinless, boneless, meat")
CHICKEN_THIGH = ("Meat", "Chicken, broiler, thigh, meat without skin")
TURKEY_BREAST = ("Meat", "Turkey Breast (Raw)")
TURKEY_THIGH = ("Meat", "Turkey Thigh (Raw)")
GROUND_TURKEY = ("Meat", "Ground Turkey (Raw)")
GROUND_BEEF = ("Meat", "Beef Top Sirloin (Raw)")
SALMON = ("Meat", "Salmon Fillet (Raw)")
COD = ("Meat", "Cod Fish")
SHRIMP = ("Meat", "Shrimp Crustaceans")
HALIBUT = ("Meat", "Halibut Fish (Raw)")
TROUT = ("Meat", "Trout Fish")
TUNA = ("Meat", "Tuna Fish")
SARDINE = ("Meat", "Sardine Fish")
MACKEREL = ("Meat", "Mackerel Fish")
SOLE = ("Meat", "Sole fillet")
SCALLOP = ("Meat", "Scallop Mollusks")
MUSSEL = ("Meat", "Mussel Mollusks")
CRAB = ("Meat", "Crab Crustaceans")
LAMB_FILLET = ("Meat", "Lamb Fillet (Raw)")
LAMB_CHOP = ("Meat", "Lamb Chop (Raw)")
DUCK = ("Meat", "Duck (Raw)")
BISON = ("Meat", "Bison Top Sirloin (Raw)")
PORK_CHOP = ("Meat", "Pork Chop (Raw)")
PORK_LOIN = ("Meat", "Pork Loin (Raw)")

EGG = ("Dairy", "Chicken Egg (Raw)")
GREEK_YOGURT = ("Dairy", "Yogurt, Greek, plain, lowfat")
COTTAGE_CHEESE = ("Dairy", "Cottage Cheese")
FETA = ("Dairy", "Feta")

FENNEL = ("Veg", "Fennel Bulb")
PARSNIP = ("Veg", "Parsnip")
LEEK = ("Veg", "Leek")
RADISH = ("Veg", "Radish")
TURNIP = ("Veg", "Turnip")
COLLARDS = ("Veg", "Collards")
SWISS_CHARD = ("Veg", "Swiss Chard")
BOK_CHOY = ("Veg", "Bok choy")
OKRA = ("Veg", "Okra")
ARTICHOKE = ("Veg", "Artichoke")
SNOW_PEAS = ("Veg", "Fresh Snow Pea")
KOHLRABI = ("Veg", "Kohlrabi")
EDAMAME = ("Veg", "Edamame")
KALE = ("Veg", "Kale")
SPINACH = ("Veg", "Spinach")
BEETS = ("Veg", "Beets")
BROCCOLI = ("Veg", "Broccoli")
CAULIFLOWER = ("Veg", "Cauliflower")
CABBAGE = ("Veg", "Cabbage")
CARROT = ("Veg", "Carrot")
CELERY = ("Veg", "Celery")
ONION = ("Veg", "Onion")
GARLIC = ("Veg", "Garlic")
TOMATO = ("Veg", "Tomato")
CUCUMBER = ("Veg", "Cucumber")
ZUCCHINI = ("Veg", "Zucchini, green skin, fresh, unpeeled")
EGGPLANT = ("Veg", "Eggplant")
RED_BELL_PEPPER = ("Veg", "Red Bell Pepper")
YELLOW_BELL_PEPPER = ("Veg", "Yellow Bell Pepper")
POTATO = ("Veg", "Potato")
SWEET_POTATO = ("Veg", "Sweet potato")
ASPARAGUS = ("Veg", "Asparagus")
BRUSSELS_SPROUTS = ("Veg", "Brussels sprout")
MUSHROOM = ("Veg", "Mushroom, common, fresh")
CORN = ("Veg", "Corn, sweet, yellow")
GREEN_PEAS = ("Veg", "Pea, green, fresh")
LETTUCE = ("Veg", "Lettuce, green leaf")
ARUGULA = ("Veg", "Arugula")
CILANTRO = ("Veg", "Coriander (cilantro) leaves")

KIWI = ("Fruit", "Kiwi fruit")
PAPAYA = ("Fruit", "Papaya")
PEACH = ("Fruit", "Peach")
APRICOT = ("Fruit", "Apricot")
PLUM = ("Fruit", "Plum")
NECTARINE = ("Fruit", "Nectarine")
CLEMENTINE = ("Fruit", "Clementine")
GRAPEFRUIT = ("Fruit", "Grapefruit")
FIG = ("Fruit", "Fig")
DATE = ("Fruit", "Date")
WATERMELON = ("Fruit", "Watermelon")
CANTALOUPE = ("Fruit", "Cantaloupe Melon")
MANGO = ("Fruit", "Mango")
PEAR = ("Fruit", "Pear")
APPLE = ("Fruit", "Apple")
BLUEBERRY = ("Fruit", "Blueberry")
BLACKBERRY = ("Fruit", "Blackberry")
ORANGE = ("Fruit", "Orange")
LEMON = ("Fruit", "Lemon")
LIME = ("Fruit", "Lime")
AVOCADO = ("Fruit", "Avocado")
SOUR_CHERRY = ("Fruit", "Sour Cherry")
CRANBERRY = ("Fruit", "Cranberry")

BUCKWHEAT = ("Grain", "Buckwheat")
MILLET = ("Grain", "Millet")
SPELT = ("Grain", "Spelt Grains")
COUSCOUS = ("Grain", "Couscous (durum wheat)")
BULGUR = ("Grain", "Bulgur")
WILD_RICE = ("Grain", "Grains, rice, wild, dry")
BROWN_RICE = ("Grain", "Grains, rice, brown, long-grain, dry")
QUINOA = ("Grain", "Quinoa")
OATS = ("Grain", "Oats")

PISTACHIO = ("NutSeed", "Pistachio nut")
CASHEW = ("NutSeed", "Cashew nut")
ALMONDS = ("NutSeed", "Almonds")
WALNUT = ("NutSeed", "Walnut")
PUMPKIN_SEED = ("NutSeed", "Pumpkin seed")
SESAME_SEED = ("NutSeed", "Sesame seed")
CHIA_SEEDS = ("NutSeed", "Chia seeds")
ALMOND_MILK = ("NutSeed", "Almond drink unsweetened")
COCONUT_MILK = ("NutSeed", "Coconut milk")
TAHINI = ("SaucesCondiments", "Tahini")

WHITE_BEANS = ("Legume", "White Beans")
BLACK_BEANS = ("Legume", "Black Beans")
CHICKPEAS = ("Legume", "Chickpeas (garbanzo beans, bengal gram)")
KIDNEY_BEANS = ("Legume", "Kidney Beans")
PINTO_BEANS = ("Legume", "Pinto Beans")
LIMA_BEANS = ("Legume", "Lima Bean")
GREEN_LENTILS = ("Legume", "Lentil, green, hulled, dry")
RED_LENTILS = ("Legume", "Lentil, red, hulled, dry")
SOY_SAUCE = ("Legume", "Soy sauce made from soy and wheat (shoyu)")

OLIVE_OIL = ("Fats", "Olive Oil (Extra Virgin)")
SALT = ("Herbs", "Common salt/table salt")
BLACK_PEPPER = ("Herbs", "Pepper, black, ground")
GINGER_ROOT = ("Herbs", "Ginger root")
CINNAMON = ("Herbs", "Spices, cinnamon, ground")
PAPRIKA = ("Herbs", "Paprika")
CUMIN = ("Herbs", "Cumin (cummin) seed, dried, ground")
CURRY_POWDER = ("Herbs", "Curry powder")
OREGANO = ("Herbs", "Oregano")
FRESH_DILL = ("Herbs", "Fresh Dill Weed")
FRESH_THYME = ("Herbs", "Fresh Thyme")
FRESH_ROSEMARY = ("Herbs", "Rosemary")
BASIL = ("Herbs", "Basil")
PARSLEY = ("Herbs", "Parsley Spices")
HONEY = ("Sweets", "Honeydew honey (Forest Honey)")
TORTILLA_MIX = ("PantryStaples", "Wheat flour, white, tortilla mix, enriched")
VEGETABLE_STOCK = ("PantryStaples", "Vegetable stock")

# (id, builder_type, name, flavor_profile, health_benefit, servings,
#  serving_size_amount, serving_size_unit, sort_order,
#  ingredients: [(category, base_name, quantity, unit, cut_prep, cooking_method, prep_note)])
RECIPES = [
    # ================= WEEK 3 (days 15-21) =================
    ("curated_snack_kiwi_pistachio_yogurt_bowl", "snack", "Kiwi and Pistachio Yogurt Bowl",
     "Bright green kiwi against creamy yogurt and crunchy pistachio.",
     "Kiwi carries more vitamin C gram for gram than an orange, an easy way to work in a fruit most breakfasts skip entirely.",
     1.0, 1.0, "bowl", 15,
     [(*GREEK_YOGURT, 150, "g", None, None, None), (*KIWI, 100, "g", "sliced", None, None),
      (*PISTACHIO, 15, "g", "chopped", None, None), (*HONEY, 5, "g", None, None, None)]),
    ("curated_salad_grilled_halibut_greens", "salad", "Grilled Halibut and Mixed Greens Salad",
     "Flaky grilled halibut over a simple, bright green salad.",
     "Halibut is a notably lean whitefish, delivering complete protein for very little saturated fat.",
     1.0, 1.0, "plate", 16,
     [(*HALIBUT, 150, "g", None, "Grilled", None), (*LETTUCE, 60, "g", "whole", None, None),
      (*ARUGULA, 30, "g", "whole", None, None), (*CUCUMBER, 50, "g", "sliced", None, None),
      (*TOMATO, 50, "g", "sliced", None, None), (*OLIVE_OIL, 10, "ml", None, None, None),
      (*LEMON, 10, "g", "juiced", None, None), (*SALT, 1, "g", None, None, None)]),
    ("curated_side_roast_chicken_fennel_leeks", "side", "Roast Chicken Breast with Fennel and Leeks",
     "Roasted chicken breast over softened, lightly caramelized fennel and leek.",
     "Fennel carries a real, distinct fiber and potassium profile from the vegetables already common in this Digest, worth folding in for variety alone.",
     1.0, 1.0, "plate", 17,
     [(*CHICKEN_BREAST, 150, "g", None, "Roasted", None), (*FENNEL, 100, "g", "sliced", "Roasted", None),
      (*LEEK, 60, "g", "sliced", "Roasted", None), (*OLIVE_OIL, 10, "ml", None, None, None),
      (*GARLIC, 3, "g", "minced", None, None), (*SALT, 1, "g", None, None, None), (*BLACK_PEPPER, 0.5, "g", None, None, None)]),

    ("curated_snack_peach_almond_overnight_oats", "snack", "Peach and Almond Overnight Oats",
     "Creamy make-ahead oats, sliced peach folded through in the morning.",
     "Peach brings a different, gentler fiber profile than the berries most overnight-oats recipes default to.",
     1.0, 1.0, "bowl", 18,
     [(*OATS, 40, "g", None, None, None), (*ALMOND_MILK, 150, "ml", None, None, None),
      (*CHIA_SEEDS, 8, "g", None, None, None), (*PEACH, 75, "g", "diced", None, None),
      (*ALMONDS, 10, "g", "sliced", None, None), (*HONEY, 5, "g", None, None, None)]),
    ("curated_handheld_turkey_hummus_collard_wrap", "handheld", "Turkey and Hummus Collard Wrap",
     "A real, sturdy collard leaf standing in for a tortilla, wrapped around turkey and homemade hummus.",
     "A collard leaf wrap swaps in an actual vegetable for the usual starch, a genuinely different way to build a wrap rather than just a gluten-free substitution.",
     1.0, 1.0, "wrap", 19,
     [(*TURKEY_BREAST, 100, "g", "sliced", None, None), (*COLLARDS, 2, "each", "large leaf, stem trimmed", None, None),
      (*CHICKPEAS, 40, "g", None, None, "blended into hummus"), (*TAHINI, 10, "g", None, None, "blended into hummus"),
      (*LEMON, 5, "g", "juiced", None, "blended into hummus"), (*GARLIC, 1.5, "g", "minced", None, "blended into hummus"),
      (*TOMATO, 40, "g", "sliced", None, None), (*SALT, 0.5, "g", None, None, None)]),
    ("curated_side_baked_trout_parsnip_mash", "side", "Baked Trout with Parsnip Mash",
     "Simple baked trout over a creamy, garlicky parsnip mash.",
     "Parsnip mashes into a naturally sweet, creamy side without needing much added fat to get there, a real alternative to potato.",
     1.0, 1.0, "plate", 20,
     [(*TROUT, 150, "g", None, "Baked", None), (*PARSNIP, 150, "g", "chopped", "Boiled", None),
      (*GARLIC, 3, "g", "minced", "Boiled", None), (*OLIVE_OIL, 10, "ml", None, None, None),
      (*LEMON, 10, "g", "juiced", None, None), (*SALT, 1, "g", None, None, None), (*BLACK_PEPPER, 0.5, "g", None, None, None)]),

    ("curated_snack_papaya_cottage_cheese_bowl", "snack", "Papaya and Cottage Cheese Bowl",
     "Sweet, soft papaya against cool, protein-rich cottage cheese.",
     "Papaya carries papain, a digestive enzyme unique among common breakfast fruit.",
     1.0, 1.0, "bowl", 21,
     [(*COTTAGE_CHEESE, 150, "g", None, None, None), (*PAPAYA, 100, "g", "diced", None, None),
      (*PUMPKIN_SEED, 10, "g", None, None, None), (*LIME, 5, "g", "juiced", None, None)]),
    ("curated_salad_spelt_roasted_vegetable_salad", "salad", "Spelt and Roasted Vegetable Salad",
     "A hearty grain salad built on spelt instead of the usual quinoa or rice.",
     "This uses spelt, a real, whole ancient grain, as the closest available stand-in for farro (this database carries no farro row of its own), not a lesser substitute in nutrition terms.",
     1.0, 1.0, "bowl", 22,
     [(*SPELT, 75, "g", "cooked", None, None), (*PARSNIP, 80, "g", "diced", "Roasted", None),
      (*CARROT, 60, "g", "diced", "Roasted", None), (*FETA, 20, "g", "crumbled", None, None),
      (*OLIVE_OIL, 10, "ml", None, None, None), (*LEMON, 10, "g", "juiced", None, None)]),
    ("curated_side_lamb_skewers_couscous", "side", "Lamb and Vegetable Skewers with Couscous",
     "Grilled lamb and vegetable skewers over lightly seasoned couscous.",
     "Lamb is a genuinely concentrated source of zinc and vitamin B12, both nutrients this Digest's own new recipes so far have leaned on beef and poultry for.",
     1.0, 1.0, "plate", 23,
     [(*LAMB_FILLET, 130, "g", "cubed", "Grilled", None), (*ZUCCHINI, 60, "g", "cubed", "Grilled", None),
      (*RED_BELL_PEPPER, 50, "g", "cubed", "Grilled", None), (*COUSCOUS, 60, "g", "cooked", None, None),
      (*OLIVE_OIL, 8, "ml", None, None, None), (*LEMON, 10, "g", "juiced", None, None),
      (*SALT, 1, "g", None, None, None), (*CUMIN, 1, "g", None, None, None)]),

    ("curated_snack_buckwheat_porridge_blueberries_walnuts", "snack", "Buckwheat Porridge with Blueberries and Walnuts",
     "A warm, nutty porridge, buckwheat groats standing in for oats.",
     "Buckwheat is naturally gluten-free despite its name, and carries a distinctly different fiber and mineral profile from oats.",
     1.0, 1.0, "bowl", 24,
     [(*BUCKWHEAT, 45, "g", "cooked", None, None), (*ALMOND_MILK, 150, "ml", None, None, None),
      (*BLUEBERRY, 40, "g", "whole", None, None), (*WALNUT, 15, "g", "chopped", None, None),
      (*CINNAMON, 1, "g", None, None, None), (*HONEY, 5, "g", None, None, None)]),
    ("curated_salad_tuna_white_bean_salad", "salad", "Tuna and White Bean Salad",
     "Flaked tuna and creamy white beans over peppery arugula.",
     "Tuna and white beans together bring both animal and plant protein into one bowl, a real combination Italian coastal cooking has leaned on for generations.",
     1.0, 1.0, "bowl", 25,
     [(*TUNA, 120, "g", None, "Grilled", None), (*WHITE_BEANS, 80, "g", None, None, None),
      (*ARUGULA, 50, "g", "whole", None, None), (*ONION, 20, "g", "thinly sliced", None, None),
      (*OLIVE_OIL, 10, "ml", None, None, None), (*LEMON, 10, "g", "juiced", None, None), (*SALT, 1, "g", None, None, None)]),
    ("curated_side_pork_chop_brussels_apple", "side", "Baked Pork Chop with Roasted Brussels Sprouts and Apple",
     "A savory-sweet dinner: pork chop against caramelized brussels sprouts and apple.",
     "Apple roasted alongside a savory main is a real, traditional pairing, its own natural sugar balancing the pork's own richness.",
     1.0, 1.0, "plate", 26,
     [(*PORK_CHOP, 150, "g", None, "Baked", None), (*BRUSSELS_SPROUTS, 100, "g", "halved", "Roasted", None),
      (*APPLE, 80, "g", "sliced", "Roasted", None), (*OLIVE_OIL, 10, "ml", None, None, None),
      (*SALT, 1, "g", None, None, None), (*BLACK_PEPPER, 0.5, "g", None, None, None)]),

    ("curated_snack_millet_porridge_apricots", "snack", "Warm Spiced Millet Porridge with Apricots",
     "A creamy, gently spiced porridge built on millet instead of oats.",
     "Millet is a whole grain most Western breakfasts never reach for, carrying its own distinct mineral profile alongside real fiber.",
     1.0, 1.0, "bowl", 27,
     [(*MILLET, 45, "g", "cooked", None, None), (*ALMOND_MILK, 150, "ml", None, None, None),
      (*APRICOT, 60, "g", "diced", None, None), (*CINNAMON, 1, "g", None, None, None), (*HONEY, 5, "g", None, None, None)]),
    ("curated_salad_shrimp_watermelon_salad", "salad", "Grilled Shrimp and Watermelon Salad",
     "A real summer combination: juicy watermelon, salty feta, and grilled shrimp.",
     "Watermelon carries citrulline, a compound the body converts toward nitric oxide, supporting blood flow, alongside real hydration from its own high water content.",
     1.0, 1.0, "bowl", 28,
     [(*SHRIMP, 130, "g", None, "Grilled", None), (*WATERMELON, 100, "g", "cubed", None, None),
      (*FETA, 20, "g", "crumbled", None, None), (*LIME, 10, "g", "juiced", None, None),
      (*OLIVE_OIL, 5, "ml", None, None, None), (*SALT, 0.5, "g", None, None, None)]),
    ("curated_side_scallops_asparagus_lemon", "side", "Pan-Seared Scallops with Asparagus and Lemon",
     "Quickly seared scallops over crisp-tender asparagus.",
     "Scallops are a notably lean shellfish, carrying real vitamin B12 and selenium for very little fat.",
     1.0, 1.0, "plate", 29,
     [(*SCALLOP, 150, "g", None, "Sauteed", None), (*ASPARAGUS, 100, "g", "trimmed", "Sauteed", None),
      (*OLIVE_OIL, 10, "ml", None, None, None), (*GARLIC, 3, "g", "minced", None, None),
      (*LEMON, 10, "g", "juiced", None, None), (*SALT, 1, "g", None, None, None)]),

    ("curated_snack_grapefruit_yogurt_honey", "snack", "Grapefruit and Greek Yogurt with Honey",
     "Tart, juicy grapefruit against cool, thick yogurt.",
     "Grapefruit is a real, concentrated vitamin C source with a genuinely different flavor profile than orange, worth rotating in for variety alone.",
     1.0, 1.0, "bowl", 30,
     [(*GREEK_YOGURT, 150, "g", None, None, None), (*GRAPEFRUIT, 100, "g", "segmented", None, None), (*HONEY, 5, "g", None, None, None)]),
    ("curated_side_chickpea_spinach_curry_bowl", "side", "Chickpea and Spinach Curry Bowl with Brown Rice",
     "A gently spiced chickpea and spinach curry over whole-grain rice.",
     "Curry powder is a real spice blend, not one single spice, and often includes turmeric, giving this bowl the same real curcumin this Digest already documents elsewhere.",
     1.0, 1.0, "bowl", 31,
     [(*CHICKPEAS, 120, "g", None, None, None), (*SPINACH, 40, "g", "whole", "Sauteed", None),
      (*COCONUT_MILK, 100, "ml", None, None, None), (*ONION, 30, "g", "diced", None, None),
      (*GARLIC, 3, "g", "minced", None, None), (*CURRY_POWDER, 3, "g", None, None, None),
      (*BROWN_RICE, 75, "g", "cooked", None, None), (*OLIVE_OIL, 5, "ml", None, None, None), (*SALT, 1, "g", None, None, None)]),
    ("curated_side_duck_beets_orange", "side", "Baked Duck Breast with Roasted Beets and Orange",
     "Rich duck breast against sweet roasted beets and bright orange segments.",
     "Duck carries meaningfully more iron than chicken breast, a real trade-off against its own higher fat content.",
     1.0, 1.0, "plate", 32,
     [(*DUCK, 150, "g", None, "Baked", None), (*BEETS, 100, "g", "diced", "Roasted", None),
      (*ORANGE, 60, "g", "segmented", None, None), (*OLIVE_OIL, 8, "ml", None, None, None),
      (*SALT, 1, "g", None, None, None), (*BLACK_PEPPER, 0.5, "g", None, None, None)]),

    ("curated_snack_fig_walnut_yogurt_bowl", "snack", "Fig and Walnut Yogurt Bowl",
     "Sweet, chewy fig against crunchy walnut and thick yogurt.",
     "Fresh fig carries real potassium and fiber that dried fig, the more common form on a store shelf, has already concentrated down from a different starting balance.",
     1.0, 1.0, "bowl", 33,
     [(*GREEK_YOGURT, 150, "g", None, None, None), (*FIG, 80, "g", "quartered", None, None),
      (*WALNUT, 15, "g", "chopped", None, None), (*HONEY, 5, "g", None, None, None)]),
    ("curated_salad_bulgur_tabbouleh_salad", "salad", "Bulgur Tabbouleh-Style Salad",
     "A parsley-forward grain salad, bulgur standing in for the usual quinoa base.",
     "This leans on fresh parsley as a real vegetable-quantity ingredient, not a garnish, the way traditional tabbouleh actually treats it.",
     1.0, 1.0, "bowl", 34,
     [(*BULGUR, 60, "g", "cooked", None, None), (*TOMATO, 60, "g", "diced", None, None),
      (*CUCUMBER, 50, "g", "diced", None, None), (*PARSLEY, 15, "g", "chopped", None, None),
      (*OLIVE_OIL, 10, "ml", None, None, None), (*LEMON, 15, "g", "juiced", None, None), (*SALT, 1, "g", None, None, None)]),
    ("curated_side_turkey_thigh_turnip_carrot", "side", "Herb-Roasted Turkey Thighs with Turnip and Carrot",
     "A hearty roasted turkey thigh, turnip and carrot roasted alongside.",
     "Turkey thigh carries more iron and zinc than turkey breast, the same real trade-off dark meat already offers in this Digest's own chicken recipes.",
     1.0, 1.0, "plate", 35,
     [(*TURKEY_THIGH, 150, "g", None, "Roasted", None), (*TURNIP, 100, "g", "diced", "Roasted", None),
      (*CARROT, 60, "g", "diced", "Roasted", None), (*OLIVE_OIL, 10, "ml", None, None, None),
      (*FRESH_ROSEMARY, 2, "g", "chopped", None, None), (*SALT, 1, "g", None, None, None), (*BLACK_PEPPER, 0.5, "g", None, None, None)]),

    # ================= WEEK 4 (days 22-28) =================
    ("curated_snack_date_cashew_breakfast_bowl", "snack", "Date and Cashew Breakfast Bowl",
     "Naturally sweet date pieces against thick yogurt and crunchy cashew.",
     "Dates concentrate a real amount of potassium and fiber into a small amount of fruit, unusual for something this sweet.",
     1.0, 1.0, "bowl", 36,
     [(*GREEK_YOGURT, 150, "g", None, None, None), (*DATE, 40, "g", "chopped", None, None),
      (*CASHEW, 15, "g", "chopped", None, None), (*CINNAMON, 1, "g", None, None, None)]),
    ("curated_salad_mackerel_radish_salad", "salad", "Mackerel and Radish Salad",
     "Rich, oily mackerel against crisp, peppery radish.",
     "Mackerel is one of the more concentrated whole-food omega-3 sources available, alongside salmon and sardine.",
     1.0, 1.0, "bowl", 37,
     [(*MACKEREL, 130, "g", None, "Grilled", None), (*RADISH, 60, "g", "sliced", None, None),
      (*LETTUCE, 50, "g", "whole", None, None), (*OLIVE_OIL, 10, "ml", None, None, None),
      (*LEMON, 10, "g", "juiced", None, None), (*SALT, 1, "g", None, None, None)]),
    ("curated_side_chicken_okra_tomato_skillet", "side", "Chicken and Okra Skillet with Tomato",
     "A one-pan skillet, chicken thigh simmered with okra and tomato.",
     "Okra is a real, distinct source of soluble fiber, part of what gives a simmered okra dish its own naturally thickened texture.",
     1.0, 1.0, "plate", 38,
     [(*CHICKEN_THIGH, 150, "g", "cubed", "Sauteed", None), (*OKRA, 80, "g", "sliced", "Sauteed", None),
      (*TOMATO, 100, "g", "diced", None, None), (*ONION, 30, "g", "diced", None, None),
      (*GARLIC, 3, "g", "minced", None, None), (*OLIVE_OIL, 8, "ml", None, None, None),
      (*PAPRIKA, 1, "g", None, None, None), (*SALT, 1, "g", None, None, None)]),

    ("curated_snack_nectarine_chia_pudding_cashews", "snack", "Nectarine Chia Pudding with Cashews",
     "A creamy chia pudding, diced nectarine and toasted cashew folded in.",
     "Nectarine carries the same real nutrient profile as peach, in a fruit with a smooth rather than fuzzy skin, worth knowing they're genuinely the same species.",
     1.0, 1.0, "bowl", 39,
     [(*CHIA_SEEDS, 30, "g", None, None, None), (*ALMOND_MILK, 150, "ml", None, None, None),
      (*NECTARINE, 75, "g", "diced", None, None), (*CASHEW, 15, "g", "chopped", None, None), (*HONEY, 5, "g", None, None, None)]),
    ("curated_side_sardine_white_bean_bowl", "side", "Sardine and White Bean Bowl",
     "Whole sardines over creamy white beans and fresh tomato.",
     "Sardines are eaten bones and all, making them one of the few whole-food sources of calcium that isn't dairy.",
     1.0, 1.0, "bowl", 40,
     [(*SARDINE, 120, "g", None, None, None), (*WHITE_BEANS, 100, "g", None, None, None),
      (*TOMATO, 60, "g", "diced", None, None), (*PARSLEY, 10, "g", "chopped", None, None),
      (*OLIVE_OIL, 10, "ml", None, None, None), (*LEMON, 10, "g", "juiced", None, None), (*SALT, 1, "g", None, None, None)]),
    ("curated_side_braised_beef_kohlrabi_carrot", "side", "Braised Beef with Kohlrabi and Carrot",
     "Slow-braised beef, tender kohlrabi and carrot soaking up the same broth.",
     "Kohlrabi is a real, underused cruciferous vegetable, the same broader family broccoli and cabbage belong to, with a milder, sweeter flavor of its own.",
     1.0, 1.5, "cup", 41,
     [(*GROUND_BEEF, 150, "g", "cubed", "Braised", None), (*KOHLRABI, 100, "g", "diced", None, None),
      (*CARROT, 60, "g", "diced", None, None), (*ONION, 40, "g", "diced", None, None),
      (*GARLIC, 3, "g", "minced", None, None), (*VEGETABLE_STOCK, 7.5, "g", None, None, None),
      (*OLIVE_OIL, 8, "ml", None, None, None), (*SALT, 1.5, "g", None, None, None)]),

    ("curated_snack_clementine_almond_yogurt_bowl", "snack", "Clementine and Almond Yogurt Bowl",
     "Sweet, easy-to-peel clementine segments against thick yogurt.",
     "Clementine is one of the easiest citrus fruits to actually eat whole rather than juice, keeping its own fiber intact in a way juice never does.",
     1.0, 1.0, "bowl", 42,
     [(*GREEK_YOGURT, 150, "g", None, None, None), (*CLEMENTINE, 100, "g", "segmented", None, None),
      (*ALMONDS, 15, "g", "sliced", None, None), (*HONEY, 5, "g", None, None, None)]),
    ("curated_salad_roasted_artichoke_white_bean_salad", "salad", "Roasted Artichoke and White Bean Salad",
     "Roasted artichoke hearts against creamy white beans and salty feta.",
     "Artichoke carries a real, distinct prebiotic fiber (inulin) that feeds beneficial gut bacteria, a different mechanism than the soluble fiber in beans alongside it.",
     1.0, 1.0, "bowl", 43,
     [(*ARTICHOKE, 100, "g", "quartered", "Roasted", None), (*WHITE_BEANS, 80, "g", None, None, None),
      (*FETA, 20, "g", "crumbled", None, None), (*OLIVE_OIL, 10, "ml", None, None, None),
      (*LEMON, 10, "g", "juiced", None, None), (*SALT, 1, "g", None, None, None)]),
    ("curated_side_sole_bok_choy_ginger", "side", "Pan-Seared Sole with Bok Choy and Ginger",
     "A light, delicate white fish over gingery, quickly-cooked bok choy.",
     "Sole is one of the mildest, leanest whitefish available, a real, gentle introduction for anyone who finds a stronger fish off-putting.",
     1.0, 1.0, "plate", 44,
     [(*SOLE, 150, "g", None, "Sauteed", None), (*BOK_CHOY, 100, "g", "chopped", "Sauteed", None),
      (*GINGER_ROOT, 5, "g", "grated", None, None), (*GARLIC, 3, "g", "minced", None, None),
      (*SOY_SAUCE, 10, "ml", None, None, None), (*OLIVE_OIL, 8, "ml", None, None, None)]),

    ("curated_snack_plum_walnut_overnight_oats", "snack", "Plum and Walnut Overnight Oats",
     "Creamy make-ahead oats, sliced plum and walnut folded in.",
     "Plum's own skin carries a real concentration of the same antioxidant pigments found in blueberry, easy to miss if the skin gets peeled away.",
     1.0, 1.0, "bowl", 45,
     [(*OATS, 40, "g", None, None, None), (*ALMOND_MILK, 150, "ml", None, None, None),
      (*PLUM, 75, "g", "sliced", None, None), (*WALNUT, 15, "g", "chopped", None, None), (*HONEY, 5, "g", None, None, None)]),
    ("curated_salad_crab_avocado_salad", "salad", "Crab and Avocado Salad",
     "Sweet crab meat against cool, creamy avocado.",
     "Crab is a genuinely lean source of complete protein and vitamin B12, closer to whitefish than to red meat in its own fat content.",
     1.0, 1.0, "bowl", 46,
     [(*CRAB, 120, "g", None, None, None), (*AVOCADO, 80, "g", "diced", None, None),
      (*LETTUCE, 50, "g", "whole", None, None), (*LIME, 10, "g", "juiced", None, None),
      (*OLIVE_OIL, 5, "ml", None, None, None), (*SALT, 1, "g", None, None, None)]),
    ("curated_side_bison_root_vegetable_bowl", "side", "Bison and Roasted Root Vegetable Bowl",
     "Lean bison over a mix of roasted root vegetables.",
     "Bison is a real, notably lean red meat, carrying beef's own concentrated iron for meaningfully less fat.",
     1.0, 1.0, "bowl", 47,
     [(*BISON, 150, "g", "sliced", "Sauteed", None), (*PARSNIP, 60, "g", "diced", "Roasted", None),
      (*CARROT, 60, "g", "diced", "Roasted", None), (*TURNIP, 60, "g", "diced", "Roasted", None),
      (*OLIVE_OIL, 10, "ml", None, None, None), (*FRESH_THYME, 1, "g", "chopped", None, None), (*SALT, 1, "g", None, None, None)]),

    ("curated_snack_watermelon_feta_bowl", "snack", "Watermelon and Feta Breakfast Bowl",
     "A savory-sweet, real Mediterranean pairing, cool watermelon against salty feta.",
     "Pairing a sweet fruit with a salty cheese is a genuine, traditional combination, not an unusual one, common across Mediterranean cooking.",
     1.0, 1.0, "bowl", 48,
     [(*WATERMELON, 150, "g", "cubed", None, None), (*FETA, 25, "g", "crumbled", None, None),
      (*OLIVE_OIL, 5, "ml", None, None, None), (*BASIL, 2, "g", "chopped", None, None)]),
    ("curated_side_edamame_brown_rice_sesame_bowl", "side", "Edamame and Brown Rice Bowl with Sesame",
     "Whole edamame beans folded through warm brown rice and toasted sesame.",
     "Edamame is a whole, immature soybean, carrying its own intact fiber that a processed soy product often loses.",
     1.0, 1.0, "bowl", 49,
     [(*EDAMAME, 100, "g", None, None, None), (*BROWN_RICE, 100, "g", "cooked", None, None),
      (*CARROT, 40, "g", "diced", None, None), (*SESAME_SEED, 5, "g", None, None, None),
      (*SOY_SAUCE, 10, "ml", None, None, None), (*OLIVE_OIL, 5, "ml", None, None, None)]),
    ("curated_soup_mussels_tomato_garlic_broth", "soup", "Mussels in Tomato and Garlic Broth",
     "Whole mussels, steamed open in a real, from-scratch tomato and garlic broth.",
     "Mussels are a notably concentrated whole-food source of vitamin B12 and iron, both for very little fat.",
     1.0, 1.5, "cup", 50,
     [(*MUSSEL, 200, "g", None, "Steamed", None), (*TOMATO, 100, "g", "diced", None, None),
      (*ONION, 30, "g", "diced", None, None), (*GARLIC, 4, "g", "minced", None, None),
      (*VEGETABLE_STOCK, 5, "g", None, None, None), (*OLIVE_OIL, 8, "ml", None, None, None),
      (*PARSLEY, 5, "g", "chopped", None, None), (*SALT, 1, "g", None, None, None)]),

    ("curated_snack_cantaloupe_cottage_cheese_bowl", "snack", "Cantaloupe and Cottage Cheese Bowl",
     "Sweet, fragrant cantaloupe against cool cottage cheese.",
     "Cantaloupe is a genuinely concentrated whole-food source of vitamin A, from the same beta-carotene family behind its own orange color.",
     1.0, 1.0, "bowl", 51,
     [(*COTTAGE_CHEESE, 150, "g", None, None, None), (*CANTALOUPE, 100, "g", "cubed", None, None), (*HONEY, 5, "g", None, None, None)]),
    ("curated_salad_pinto_bean_roasted_vegetable_bowl", "salad", "Pinto Bean and Roasted Vegetable Salad",
     "Creamy pinto beans over a real mix of roasted vegetables.",
     "Pinto beans carry a real, distinct antioxidant profile from their own mottled skin, a different pigment family than black or white beans.",
     1.0, 1.0, "bowl", 52,
     [(*PINTO_BEANS, 100, "g", None, None, None), (*ZUCCHINI, 60, "g", "diced", "Roasted", None),
      (*RED_BELL_PEPPER, 50, "g", "diced", "Roasted", None), (*OLIVE_OIL, 10, "ml", None, None, None),
      (*LIME, 10, "g", "juiced", None, None), (*CILANTRO, 5, "g", "chopped", None, None), (*SALT, 1, "g", None, None, None)]),
    ("curated_side_chicken_breast_snow_peas_carrots", "side", "Baked Chicken Breast with Snow Peas and Carrots",
     "Roasted chicken breast alongside quickly cooked snow peas and carrot.",
     "Snow peas are eaten pod and all, a real, whole-vegetable way to get more fiber than shelled peas alone would carry.",
     1.0, 1.0, "plate", 53,
     [(*CHICKEN_BREAST, 150, "g", None, "Baked", None), (*SNOW_PEAS, 80, "g", "trimmed", "Sauteed", None),
      (*CARROT, 60, "g", "sliced", "Sauteed", None), (*OLIVE_OIL, 10, "ml", None, None, None),
      (*GINGER_ROOT, 3, "g", "grated", None, None), (*SALT, 1, "g", None, None, None)]),

    ("curated_snack_pear_walnut_yogurt_bowl", "snack", "Pear and Walnut Yogurt Bowl",
     "Sliced pear and crunchy walnut against thick, tangy yogurt.",
     "Pear's own skin carries most of its fiber, worth leaving on rather than peeling away.",
     1.0, 1.0, "bowl", 54,
     [(*GREEK_YOGURT, 150, "g", None, None, None), (*PEAR, 100, "g", "sliced", None, None),
      (*WALNUT, 15, "g", "chopped", None, None), (*CINNAMON, 1, "g", None, None, None)]),
    ("curated_salad_lima_bean_roasted_vegetable_salad", "salad", "Lima Bean and Roasted Vegetable Salad",
     "Buttery lima beans against a real mix of roasted vegetables.",
     "Lima beans are a genuinely underused legume, carrying real plant protein and fiber most weekly meal plans never reach for.",
     1.0, 1.0, "bowl", 55,
     [(*LIMA_BEANS, 100, "g", None, None, None), (*EGGPLANT, 70, "g", "diced", "Roasted", None),
      (*TOMATO, 50, "g", "diced", None, None), (*OLIVE_OIL, 10, "ml", None, None, None),
      (*LEMON, 10, "g", "juiced", None, None), (*OREGANO, 1, "g", None, None, None), (*SALT, 1, "g", None, None, None)]),
    ("curated_side_pork_loin_turnip_kale", "side", "Roast Pork Loin with Turnip and Kale",
     "Roasted pork loin over sauteed kale, turnip roasted alongside.",
     "Pork loin is a genuinely different, leaner cut than pork chop or tenderloin, this Digest's own two other pork recipes.",
     1.0, 1.0, "plate", 56,
     [(*PORK_LOIN, 150, "g", None, "Roasted", None), (*TURNIP, 80, "g", "diced", "Roasted", None),
      (*KALE, 40, "g", "whole", "Sauteed", None), (*OLIVE_OIL, 10, "ml", None, None, None),
      (*GARLIC, 3, "g", "minced", None, None), (*SALT, 1, "g", None, None, None), (*BLACK_PEPPER, 0.5, "g", None, None, None)]),

    # ================= WEEK 5 (days 29-35) =================
    ("curated_snack_fig_pistachio_overnight_oats", "snack", "Fig and Pistachio Overnight Oats",
     "Creamy make-ahead oats, chopped fig and pistachio folded in.",
     "Fig and pistachio are a genuinely traditional Mediterranean pairing, not an invented combination.",
     1.0, 1.0, "bowl", 57,
     [(*OATS, 40, "g", None, None, None), (*ALMOND_MILK, 150, "ml", None, None, None),
      (*FIG, 60, "g", "chopped", None, None), (*PISTACHIO, 15, "g", "chopped", None, None), (*HONEY, 5, "g", None, None, None)]),
    ("curated_salad_trout_cucumber_salad", "salad", "Trout and Cucumber Salad",
     "Flaked trout against cool, crisp cucumber and fresh dill.",
     "Trout carries a similar omega-3 profile to salmon, from a fish that spends its own life in fresh rather than salt water.",
     1.0, 1.0, "bowl", 58,
     [(*TROUT, 130, "g", None, "Baked", None), (*CUCUMBER, 80, "g", "sliced", None, None),
      (*LETTUCE, 40, "g", "whole", None, None), (*FRESH_DILL, 3, "g", "chopped", None, None),
      (*OLIVE_OIL, 10, "ml", None, None, None), (*LEMON, 10, "g", "juiced", None, None), (*SALT, 1, "g", None, None, None)]),
    ("curated_side_turkey_meatloaf_parsnip_carrot", "side", "Turkey Meatloaf with Roasted Parsnip and Carrot",
     "A real, single-serving turkey meatloaf, roasted parsnip and carrot alongside.",
     "A meatloaf-style preparation is a genuinely different way to cook ground turkey than the meatballs already elsewhere in this plan, distributing seasoning all the way through.",
     1.0, 1.0, "plate", 59,
     [(*GROUND_TURKEY, 150, "g", None, "Baked", None), (*EGG, 0.5, "each", "whisked", None, "as a binder"),
      (*ONION, 30, "g", "diced", None, None), (*PARSNIP, 70, "g", "diced", "Roasted", None),
      (*CARROT, 60, "g", "diced", "Roasted", None), (*OLIVE_OIL, 8, "ml", None, None, None), (*SALT, 1, "g", None, None, None)]),

    ("curated_snack_apricot_cashew_yogurt_bowl", "snack", "Apricot and Cashew Yogurt Bowl",
     "Sliced apricot and toasted cashew against thick, tangy yogurt.",
     "Apricot is a genuinely concentrated whole-food source of vitamin A, the same beta-carotene family behind its own orange color.",
     1.0, 1.0, "bowl", 60,
     [(*GREEK_YOGURT, 150, "g", None, None, None), (*APRICOT, 80, "g", "sliced", None, None),
      (*CASHEW, 15, "g", "chopped", None, None), (*HONEY, 5, "g", None, None, None)]),
    ("curated_soup_white_bean_kale_soup", "soup", "White Bean and Kale Soup",
     "A simple, hearty soup, white beans and kale simmered together.",
     "Kale simmered into a soup wilts down dramatically, letting far more of it fit into one bowl than eating it raw ever would.",
     1.0, 1.5, "cup", 61,
     [(*WHITE_BEANS, 100, "g", None, None, None), (*KALE, 50, "g", "chopped", None, None),
      (*CARROT, 50, "g", "diced", None, None), (*ONION, 40, "g", "diced", None, None),
      (*GARLIC, 3, "g", "minced", None, None), (*VEGETABLE_STOCK, 7.5, "g", None, None, None),
      (*OLIVE_OIL, 8, "ml", None, None, None), (*SALT, 1.5, "g", None, None, None)]),
    ("curated_side_salmon_leeks_lemon", "side", "Baked Salmon with Leeks and Lemon",
     "A different salmon dinner from this plan's own first week: leeks instead of a roasted root vegetable.",
     "Leek carries a real, milder allium flavor than onion, softening down into something almost creamy once cooked through.",
     1.0, 1.0, "plate", 62,
     [(*SALMON, 150, "g", None, "Baked", None), (*LEEK, 100, "g", "sliced", "Sauteed", None),
      (*OLIVE_OIL, 10, "ml", None, None, None), (*LEMON, 15, "g", "juiced", None, None), (*SALT, 1, "g", None, None, None)]),

    ("curated_snack_date_walnut_breakfast_bowl", "snack", "Date and Walnut Breakfast Bowl",
     "Chopped date and walnut folded through thick, tangy yogurt.",
     "Date and walnut together bring natural sweetness and healthy fat into the same bowl, without any added sugar doing the work.",
     1.0, 1.0, "bowl", 63,
     [(*GREEK_YOGURT, 150, "g", None, None, None), (*DATE, 40, "g", "chopped", None, None),
      (*WALNUT, 15, "g", "chopped", None, None), (*CINNAMON, 1, "g", None, None, None)]),
    ("curated_soup_lentil_kale_soup", "soup", "Lentil and Kale Soup",
     "A thick, hearty soup, red lentils and kale simmered together.",
     "Red lentils break down as they simmer, thickening this soup on their own without any added cream or flour.",
     1.0, 1.5, "cup", 64,
     [(*RED_LENTILS, 75, "g", None, None, None), (*KALE, 40, "g", "chopped", None, None),
      (*CARROT, 50, "g", "diced", None, None), (*ONION, 40, "g", "diced", None, None),
      (*GARLIC, 3, "g", "minced", None, None), (*VEGETABLE_STOCK, 7.5, "g", None, None, None),
      (*CUMIN, 1.5, "g", None, None, None), (*SALT, 1.5, "g", None, None, None)]),
    ("curated_side_lamb_chops_roasted_eggplant", "side", "Grilled Lamb Chops with Roasted Eggplant",
     "Grilled lamb chops against sweet, softened roasted eggplant.",
     "Lamb chop is a genuinely different cut from the fillet already used elsewhere in this plan, carrying its own bone-in richness.",
     1.0, 1.0, "plate", 65,
     [(*LAMB_CHOP, 150, "g", None, "Grilled", None), (*EGGPLANT, 100, "g", "sliced", "Roasted", None),
      (*OLIVE_OIL, 10, "ml", None, None, None), (*GARLIC, 3, "g", "minced", None, None),
      (*FRESH_ROSEMARY, 2, "g", "chopped", None, None), (*SALT, 1, "g", None, None, None)]),

    ("curated_snack_mango_coconut_chia_pudding", "snack", "Mango and Coconut Chia Pudding",
     "A creamy, tropical chia pudding, coconut milk and diced mango folded in.",
     "Coconut milk brings its own fat profile, distinct from the almond milk most of this plan's other puddings use.",
     1.0, 1.0, "bowl", 66,
     [(*CHIA_SEEDS, 30, "g", None, None, None), (*COCONUT_MILK, 150, "ml", None, None, None),
      (*MANGO, 75, "g", "diced", None, None), (*HONEY, 5, "g", None, None, None)]),
    ("curated_soup_crab_corn_chowder", "soup", "Crab and Corn Chowder-Style Soup",
     "A lighter, dairy-forward chowder built on sweet corn and crab.",
     "Crab and corn together bring a real, traditional coastal pairing, sweet corn balancing crab's own natural brininess.",
     1.0, 1.5, "cup", 67,
     [(*CRAB, 120, "g", None, None, None), (*CORN, 100, "g", None, None, None),
      (*ONION, 40, "g", "diced", None, None), (*CELERY, 30, "g", "diced", None, None),
      (*COCONUT_MILK, 150, "ml", None, None, None), (*VEGETABLE_STOCK, 5, "g", None, None, None),
      (*OLIVE_OIL, 8, "ml", None, None, None), (*SALT, 1, "g", None, None, None)]),
    ("curated_side_chicken_thighs_kohlrabi_apple", "side", "Roast Chicken Thighs with Kohlrabi and Apple",
     "Roasted chicken thigh against a milder, sweeter cousin of cabbage.",
     "Kohlrabi and apple roasted together bring out kohlrabi's own natural sweetness, a real complement rather than a contrast.",
     1.0, 1.0, "plate", 68,
     [(*CHICKEN_THIGH, 150, "g", None, "Roasted", None), (*KOHLRABI, 90, "g", "diced", "Roasted", None),
      (*APPLE, 60, "g", "sliced", "Roasted", None), (*OLIVE_OIL, 10, "ml", None, None, None), (*SALT, 1, "g", None, None, None)]),

    ("curated_snack_cottage_cheese_fig_honey", "snack", "Cottage Cheese with Fig and Honey",
     "Sliced fig and a drizzle of honey over cool, protein-rich cottage cheese.",
     "Cottage cheese and fig together bring a real balance of protein and natural sweetness without needing a sweetened yogurt to get there.",
     1.0, 1.0, "bowl", 69,
     [(*COTTAGE_CHEESE, 150, "g", None, None, None), (*FIG, 60, "g", "sliced", None, None), (*HONEY, 5, "g", None, None, None)]),
    ("curated_side_shrimp_snow_pea_stir_fry_rice", "side", "Shrimp and Snow Pea Stir-Fry Bowl with Brown Rice",
     "Quick-cooked shrimp and snow peas over whole-grain rice.",
     "Snow peas cook in barely a minute or two, keeping far more of their own crunch and vitamin C intact than a longer-simmered vegetable would.",
     1.0, 1.0, "bowl", 70,
     [(*SHRIMP, 150, "g", None, "Sauteed", None), (*SNOW_PEAS, 80, "g", "trimmed", "Sauteed", None),
      (*BROWN_RICE, 75, "g", "cooked", None, None), (*GARLIC, 3, "g", "minced", None, None),
      (*GINGER_ROOT, 4, "g", "grated", None, None), (*SOY_SAUCE, 10, "ml", None, None, None), (*OLIVE_OIL, 5, "ml", None, None, None)]),
    ("curated_side_baked_cod_fennel_orange", "side", "Baked Cod with Fennel and Orange",
     "A different cod dinner from this plan's own first week: fennel and orange instead of paprika and cauliflower.",
     "Fennel and orange together bring a genuinely different, brighter flavor pairing than this plan's earlier, more everyday cod preparation.",
     1.0, 1.0, "plate", 71,
     [(*COD, 150, "g", None, "Baked", None), (*FENNEL, 90, "g", "sliced", "Roasted", None),
      (*ORANGE, 50, "g", "segmented", None, None), (*OLIVE_OIL, 10, "ml", None, None, None), (*SALT, 1, "g", None, None, None)]),

    ("curated_snack_pear_almond_yogurt_bowl", "snack", "Pear and Almond Yogurt Bowl",
     "Sliced pear and toasted almond against thick, tangy yogurt.",
     "Pear and almond together bring a mild, real sweetness balanced against almond's own gentle crunch and fat.",
     1.0, 1.0, "bowl", 72,
     [(*GREEK_YOGURT, 150, "g", None, None, None), (*PEAR, 100, "g", "sliced", None, None),
      (*ALMONDS, 15, "g", "sliced", None, None), (*HONEY, 5, "g", None, None, None)]),
    ("curated_handheld_bison_roasted_vegetable_wrap", "handheld", "Bison and Roasted Vegetable Wrap",
     "Sliced bison and roasted vegetables wrapped up together.",
     "Bison wrapped instead of plated is a real, different way to eat the same lean, iron-rich meat this plan already documents elsewhere.",
     1.0, 1.0, "wrap", 73,
     [(*BISON, 120, "g", "sliced", "Sauteed", None), (*TORTILLA_MIX, 60, "g", None, "Baked", None),
      (*RED_BELL_PEPPER, 50, "g", "sliced", "Roasted", None), (*ONION, 30, "g", "sliced", "Roasted", None),
      (*LETTUCE, 20, "g", "whole", None, None), (*OLIVE_OIL, 8, "ml", None, None, None), (*SALT, 1, "g", None, None, None)]),
    ("curated_side_duck_cherry_wild_rice", "side", "Pan-Seared Duck Breast with Cherry Sauce and Wild Rice",
     "Seared duck breast with a real, tart cherry pan sauce over wild rice.",
     "Wild rice is a genuinely different grass seed than ordinary rice, carrying more protein and a distinctly chewier texture.",
     1.0, 1.0, "plate", 74,
     [(*DUCK, 150, "g", None, "Sauteed", None), (*SOUR_CHERRY, 60, "g", "pitted", None, None),
      (*WILD_RICE, 70, "g", "cooked", None, None), (*OLIVE_OIL, 8, "ml", None, None, None), (*SALT, 1, "g", None, None, None)]),

    ("curated_snack_kiwi_coconut_chia_pudding", "snack", "Kiwi and Coconut Chia Pudding",
     "A creamy, tropical chia pudding, sliced kiwi folded through coconut milk.",
     "Kiwi's own black seeds are entirely edible, a real, easy-to-miss source of extra fiber and omega-3 fat most people never think to check for.",
     1.0, 1.0, "bowl", 75,
     [(*CHIA_SEEDS, 30, "g", None, None, None), (*COCONUT_MILK, 150, "ml", None, None, None),
      (*KIWI, 75, "g", "sliced", None, None), (*HONEY, 5, "g", None, None, None)]),
    ("curated_soup_white_bean_swiss_chard_soup", "soup", "White Bean and Swiss Chard Soup",
     "A simple, hearty soup, white beans and swiss chard simmered together.",
     "Swiss chard's own stems carry real fiber and minerals most recipes discard, worth chopping and cooking in rather than throwing away.",
     1.0, 1.5, "cup", 76,
     [(*WHITE_BEANS, 100, "g", None, None, None), (*SWISS_CHARD, 60, "g", "chopped, stems included", None, None),
      (*CARROT, 50, "g", "diced", None, None), (*ONION, 40, "g", "diced", None, None),
      (*GARLIC, 3, "g", "minced", None, None), (*VEGETABLE_STOCK, 7.5, "g", None, None, None),
      (*OLIVE_OIL, 8, "ml", None, None, None), (*SALT, 1.5, "g", None, None, None)]),
    ("curated_side_pork_loin_radish_carrot", "side", "Grilled Pork Loin with Roasted Radish and Carrot",
     "Grilled pork loin against roasted radish, its own peppery bite mellowing considerably once cooked.",
     "Roasting radish changes its own texture and flavor completely, mellowing from sharp and peppery raw into something closer to a mild turnip.",
     1.0, 1.0, "plate", 77,
     [(*PORK_LOIN, 150, "g", None, "Grilled", None), (*RADISH, 80, "g", "halved", "Roasted", None),
      (*CARROT, 60, "g", "sliced", "Roasted", None), (*OLIVE_OIL, 10, "ml", None, None, None), (*SALT, 1, "g", None, None, None)]),

    # ================= WEEK 6 (days 36-42) =================
    ("curated_snack_papaya_lime_yogurt_bowl", "snack", "Papaya and Lime Yogurt Bowl",
     "Soft, sweet papaya brightened with fresh lime against thick yogurt.",
     "Lime juice over papaya is a real, traditional pairing found across Latin American and Southeast Asian cooking alike.",
     1.0, 1.0, "bowl", 78,
     [(*GREEK_YOGURT, 150, "g", None, None, None), (*PAPAYA, 100, "g", "diced", None, None), (*LIME, 5, "g", "juiced", None, None)]),
    ("curated_salad_tuna_artichoke_salad", "salad", "Tuna and Artichoke Salad",
     "Flaked tuna against roasted artichoke and peppery arugula.",
     "Tuna and artichoke together bring a real, classic Mediterranean pantry pairing into one fresh bowl.",
     1.0, 1.0, "bowl", 79,
     [(*TUNA, 120, "g", None, "Grilled", None), (*ARTICHOKE, 80, "g", "quartered", "Roasted", None),
      (*ARUGULA, 50, "g", "whole", None, None), (*OLIVE_OIL, 10, "ml", None, None, None),
      (*LEMON, 10, "g", "juiced", None, None), (*SALT, 1, "g", None, None, None)]),
    ("curated_side_turkey_wild_rice_cranberries", "side", "Roast Turkey Breast with Wild Rice and Cranberries",
     "Roasted turkey breast over wild rice, whole cranberries folded through.",
     "Turkey and cranberry together bring a real, familiar pairing outside of just one holiday meal, cranberry's own tartness cutting through the turkey's richness.",
     1.0, 1.0, "plate", 80,
     [(*TURKEY_BREAST, 150, "g", None, "Roasted", None), (*WILD_RICE, 70, "g", "cooked", None, None),
      (*CRANBERRY, 40, "g", "whole", None, None), (*OLIVE_OIL, 8, "ml", None, None, None), (*SALT, 1, "g", None, None, None)]),

    ("curated_snack_blackberry_almond_yogurt_bowl", "snack", "Blackberry and Almond Yogurt Bowl",
     "Tart blackberries and toasted almond against thick, tangy yogurt.",
     "Blackberries carry a genuinely high fiber content for a fruit this size, most of it concentrated in their own small seeds.",
     1.0, 1.0, "bowl", 81,
     [(*GREEK_YOGURT, 150, "g", None, None, None), (*BLACKBERRY, 80, "g", "whole", None, None),
      (*ALMONDS, 15, "g", "sliced", None, None), (*HONEY, 5, "g", None, None, None)]),
    ("curated_soup_mussels_tomato_fennel_broth", "soup", "Mussels in Tomato Fennel Broth",
     "A different mussel preparation from earlier in this plan: fennel replacing the plain garlic broth.",
     "Fennel's own anise-like flavor is a real, traditional pairing with shellfish across Mediterranean coastal cooking.",
     1.0, 1.5, "cup", 82,
     [(*MUSSEL, 200, "g", None, "Steamed", None), (*TOMATO, 90, "g", "diced", None, None),
      (*FENNEL, 60, "g", "sliced", None, None), (*GARLIC, 3, "g", "minced", None, None),
      (*VEGETABLE_STOCK, 5, "g", None, None, None), (*OLIVE_OIL, 8, "ml", None, None, None), (*SALT, 1, "g", None, None, None)]),
    ("curated_side_halibut_leeks_peas", "side", "Baked Halibut with Leeks and Peas",
     "A different halibut dinner from earlier in this plan: leeks and green peas instead of a mixed-greens salad.",
     "Green peas bring real plant protein alongside their own fiber, unusual for a vegetable most people treat as an afterthought side.",
     1.0, 1.0, "plate", 83,
     [(*HALIBUT, 150, "g", None, "Baked", None), (*LEEK, 80, "g", "sliced", "Sauteed", None),
      (*GREEN_PEAS, 50, "g", None, None, None), (*OLIVE_OIL, 10, "ml", None, None, None), (*SALT, 1, "g", None, None, None)]),

    ("curated_snack_clementine_pistachio_yogurt_bowl", "snack", "Clementine and Pistachio Yogurt Bowl",
     "Sweet clementine segments and crunchy pistachio against thick yogurt.",
     "Clementine and pistachio together bring a genuinely different citrus-and-nut pairing than this plan's earlier kiwi-and-pistachio bowl.",
     1.0, 1.0, "bowl", 84,
     [(*GREEK_YOGURT, 150, "g", None, None, None), (*CLEMENTINE, 100, "g", "segmented", None, None),
      (*PISTACHIO, 15, "g", "chopped", None, None), (*HONEY, 5, "g", None, None, None)]),
    ("curated_side_lentil_roasted_vegetable_tahini_bowl", "side", "Lentil and Roasted Vegetable Bowl with Tahini",
     "Green lentils and roasted vegetables tied together with a real tahini drizzle.",
     "Tahini's own fat helps the body absorb more of the fat-soluble nutrients in the roasted vegetables alongside it.",
     1.0, 1.0, "bowl", 85,
     [(*GREEN_LENTILS, 75, "g", "cooked", None, None), (*ZUCCHINI, 70, "g", "diced", "Roasted", None),
      (*RED_BELL_PEPPER, 50, "g", "diced", "Roasted", None), (*TAHINI, 15, "g", None, None, None),
      (*LEMON, 10, "g", "juiced", None, None), (*OLIVE_OIL, 8, "ml", None, None, None), (*SALT, 1, "g", None, None, None)]),
    ("curated_side_bison_meatballs_herb_tomato_sauce", "side", "Bison Meatballs in Herb Tomato Sauce",
     "Lean bison meatballs, simmered in a real, herb-forward tomato sauce.",
     "Bison meatballs are a genuinely different preparation from this plan's earlier turkey meatballs, a leaner red meat rather than poultry.",
     1.0, 1.0, "serving", 86,
     [(*BISON, 150, "g", None, "Baked", None), (*EGG, 0.5, "each", "whisked", None, "as a binder"),
      (*GARLIC, 3, "g", "minced", None, None), (*TOMATO, 180, "g", "crushed", "Simmered", None),
      (*ONION, 30, "g", "diced", None, None), (*BASIL, 2, "g", "chopped", None, None),
      (*OLIVE_OIL, 5, "ml", None, None, None), (*SALT, 1, "g", None, None, None)]),

    ("curated_snack_apricot_coconut_overnight_oats", "snack", "Apricot and Coconut Overnight Oats",
     "Creamy make-ahead oats, coconut milk and diced apricot folded in.",
     "Coconut milk brings a genuinely different, richer fat profile to overnight oats than the almond milk most of this plan's other versions use.",
     1.0, 1.0, "bowl", 87,
     [(*OATS, 40, "g", None, None, None), (*COCONUT_MILK, 150, "ml", None, None, None),
      (*APRICOT, 70, "g", "diced", None, None), (*HONEY, 5, "g", None, None, None)]),
    ("curated_salad_sardine_roasted_pepper_salad", "salad", "Sardine and Roasted Pepper Salad",
     "Whole sardines against sweet roasted bell pepper and peppery arugula.",
     "Sardine and roasted pepper together bring real, complementary flavors, the pepper's own sweetness balancing sardine's natural brininess.",
     1.0, 1.0, "bowl", 88,
     [(*SARDINE, 120, "g", None, None, None), (*YELLOW_BELL_PEPPER, 60, "g", "sliced", "Roasted", None),
      (*ARUGULA, 40, "g", "whole", None, None), (*OLIVE_OIL, 10, "ml", None, None, None),
      (*LEMON, 10, "g", "juiced", None, None), (*SALT, 1, "g", None, None, None)]),
    ("curated_side_chicken_breast_artichoke_lemon", "side", "Roast Chicken Breast with Artichoke and Lemon",
     "A different chicken breast dinner from earlier in this plan: roasted artichoke and lemon instead of fennel and leek.",
     "Artichoke's own real prebiotic fiber pairs here with a simple roasted chicken breast, a genuinely different vegetable than this plan's earlier chicken dinners used.",
     1.0, 1.0, "plate", 89,
     [(*CHICKEN_BREAST, 150, "g", None, "Roasted", None), (*ARTICHOKE, 90, "g", "quartered", "Roasted", None),
      (*OLIVE_OIL, 10, "ml", None, None, None), (*LEMON, 15, "g", "juiced", None, None), (*SALT, 1, "g", None, None, None)]),

    ("curated_snack_fig_cashew_overnight_oats", "snack", "Fig and Cashew Overnight Oats",
     "Creamy make-ahead oats, chopped fig and cashew folded in.",
     "This plan's own closing week reaches for fig and cashew together, a real, deliberately different combination from its earlier fig-and-walnut and fig-and-pistachio bowls.",
     1.0, 1.0, "bowl", 90,
     [(*OATS, 40, "g", None, None, None), (*ALMOND_MILK, 150, "ml", None, None, None),
      (*FIG, 60, "g", "chopped", None, None), (*CASHEW, 15, "g", "chopped", None, None), (*HONEY, 5, "g", None, None, None)]),
    ("curated_salad_kidney_bean_roasted_vegetable_salad", "salad", "Kidney Bean and Roasted Vegetable Salad",
     "Hearty kidney beans against a real mix of roasted root vegetables.",
     "Kidney beans carry a real, distinct antioxidant profile from their own deep red skin, a different pigment family than pinto or white beans elsewhere in this plan.",
     1.0, 1.0, "bowl", 91,
     [(*KIDNEY_BEANS, 100, "g", None, None, None), (*CARROT, 60, "g", "diced", "Roasted", None),
      (*RED_BELL_PEPPER, 50, "g", "diced", "Roasted", None), (*OLIVE_OIL, 10, "ml", None, None, None),
      (*LIME, 10, "g", "juiced", None, None), (*CILANTRO, 5, "g", "chopped", None, None), (*SALT, 1, "g", None, None, None)]),
    ("curated_side_trout_radish_dill", "side", "Baked Trout with Radish and Dill",
     "A different trout dinner from earlier in this plan: roasted radish instead of parsnip mash.",
     "Roasting radish alongside a mild fish mellows its own sharp, peppery raw bite into something closer to a delicate turnip.",
     1.0, 1.0, "plate", 92,
     [(*TROUT, 150, "g", None, "Baked", None), (*RADISH, 90, "g", "halved", "Roasted", None),
      (*FRESH_DILL, 3, "g", "chopped", None, None), (*OLIVE_OIL, 10, "ml", None, None, None),
      (*LEMON, 10, "g", "juiced", None, None), (*SALT, 1, "g", None, None, None)]),

    ("curated_snack_mango_pistachio_chia_pudding", "snack", "Mango and Pistachio Chia Pudding",
     "A creamy chia pudding, diced mango and chopped pistachio folded in.",
     "Mango and pistachio together bring a real, different texture contrast from this plan's earlier mango-and-coconut version.",
     1.0, 1.0, "bowl", 93,
     [(*CHIA_SEEDS, 30, "g", None, None, None), (*ALMOND_MILK, 150, "ml", None, None, None),
      (*MANGO, 75, "g", "diced", None, None), (*PISTACHIO, 15, "g", "chopped", None, None), (*HONEY, 5, "g", None, None, None)]),
    ("curated_soup_turkey_white_bean_soup", "soup", "Turkey and White Bean Soup",
     "A lighter, brothy soup, ground turkey and white beans simmered together.",
     "This is a genuinely different turkey dish from this plan's own chili and meatloaf, a plain, brothy soup rather than a thick, spiced one.",
     1.0, 1.5, "cup", 94,
     [(*GROUND_TURKEY, 120, "g", None, "Simmered", None), (*WHITE_BEANS, 80, "g", None, None, None),
      (*CARROT, 50, "g", "diced", None, None), (*CELERY, 40, "g", "diced", None, None),
      (*ONION, 40, "g", "diced", None, None), (*GARLIC, 3, "g", "minced", None, None),
      (*VEGETABLE_STOCK, 7.5, "g", None, None, None), (*SALT, 1.5, "g", None, None, None)]),
    ("curated_side_lamb_fennel_orange", "side", "Grilled Lamb with Roasted Fennel and Orange",
     "A different lamb dinner from earlier in this plan: roasted fennel and orange instead of couscous and zucchini.",
     "Fennel and orange together bring a bright, aromatic pairing that cuts through lamb's own richness.",
     1.0, 1.0, "plate", 95,
     [(*LAMB_FILLET, 150, "g", None, "Grilled", None), (*FENNEL, 90, "g", "sliced", "Roasted", None),
      (*ORANGE, 50, "g", "segmented", None, None), (*OLIVE_OIL, 10, "ml", None, None, None), (*SALT, 1, "g", None, None, None)]),

    ("curated_snack_grapefruit_pistachio_yogurt_bowl", "snack", "Grapefruit and Pistachio Yogurt Bowl",
     "A bright, tart closing breakfast: grapefruit segments and pistachio against thick yogurt.",
     "Grapefruit and pistachio together close this plan's own 6 weeks with the same real citrus-and-nut pairing pattern it opened with, using two ingredients this specific combination hadn't paired together yet.",
     1.0, 1.0, "bowl", 96,
     [(*GREEK_YOGURT, 150, "g", None, None, None), (*GRAPEFRUIT, 100, "g", "segmented", None, None),
      (*PISTACHIO, 15, "g", "chopped", None, None), (*HONEY, 5, "g", None, None, None)]),
    ("curated_salad_crab_mango_salad", "salad", "Crab and Mango Salad",
     "Sweet crab meat against juicy mango and peppery arugula.",
     "Crab and mango together bring a genuinely bright, different pairing to close this plan's own final week, sweet fruit balancing the crab's natural brininess.",
     1.0, 1.0, "bowl", 97,
     [(*CRAB, 120, "g", None, None, None), (*MANGO, 80, "g", "diced", None, None),
      (*ARUGULA, 50, "g", "whole", None, None), (*LIME, 10, "g", "juiced", None, None),
      (*OLIVE_OIL, 5, "ml", None, None, None), (*SALT, 1, "g", None, None, None)]),
    ("curated_side_salmon_wild_rice_asparagus", "side", "Herb-Roasted Salmon with Wild Rice and Asparagus",
     "A real, closing dinner: herb-roasted salmon over wild rice, asparagus alongside.",
     "This is salmon's third appearance across this whole 6-week plan, each time in a genuinely different dish, the same way an actual person's real diet returns to a favorite fish more than once without ever repeating the exact same meal.",
     1.0, 1.0, "plate", 98,
     [(*SALMON, 150, "g", None, "Roasted", None), (*WILD_RICE, 70, "g", "cooked", None, None),
      (*ASPARAGUS, 90, "g", "trimmed", "Roasted", None), (*OLIVE_OIL, 10, "ml", None, None, None),
      (*FRESH_DILL, 2, "g", "chopped", None, None), (*SALT, 1, "g", None, None, None)]),
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
