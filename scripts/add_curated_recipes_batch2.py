"""
Patches the already-built assets/data/foods_reference.db with a real, first
batch of 32 new curated starter recipes -- Phase 2 of the curated-recipe-
library expansion, extending curated_recipes/curated_recipe_ingredients
(built 2026-08-09, originally 6 salads + 6 smoothies) to the 8 remaining
direct-ingredient builders: Side, Fermentation, Beverage, Snack, Baked
Goods, Soup, Sauces, Handhelds -- 4 real recipes each.

Every single (category, base_name) pair used below was independently
verified against the live, bundled reference database via direct sqlite3
queries BEFORE being written in here -- the same discipline the original 12
recipes were held to (see lib/db.ts's own getCuratedRecipe()/
resolveCuratedRecipeIngredient() comments). A few real, honest substitutions
were made where the obvious ingredient didn't actually exist in this
database: no plain "corn flour"/masa harina exists anywhere, so the tortilla
recipes use the real "Wheat flour, white, tortilla mix, enriched" row
instead; no plain "chicken broth" exists as a standalone liquid, so the
chicken soup recipe uses the real "Chicken bouillon/stock/soup (stock
cubes, powder)" row (the same real precedent Soup Builder's own category
allowlist already established for bouillon); "Honey" as a bare word doesn't
exist, so every recipe needing honey uses the real "Honeydew honey (Forest
Honey)" row instead (a real floral honey variety, not a substitution of
substance). Two of the Baked Goods/Handhelds recipes reference real but
untranslated Nordic Baked-category rows (Sweden/Norway) -- Baked has no
translated English bread rows at all in this database (confirmed directly),
so a real, already-existing bread/tortilla row was used rather than
invented; this is a known, already-documented, deliberate scope boundary
(see lib/referenceDbVersion.ts's own translation-progress history), not a
new gap introduced here.

Fermentation recipes deliberately reference Phase 1's own
fermentation_strains catalog via curated_recipe_strains where a real,
citable strain applies (the two yogurts use the real Codex Alimentarius
S. thermophilus + L. bulgaricus starter pair, the probiotic yogurt adds
L. acidophilus + Bifidobacterium, sauerkraut uses L. mesenteroides +
L. plantarum) -- kombucha deliberately gets NO strain link, since none of
the 7 catalogued strains are the real SCOBY organisms (Acetobacter/
Brettanomyces and related yeasts), and forcing an inapplicable strain in
would misrepresent what's actually in that ferment.

A real, pre-existing bug in the ORIGINAL 12 recipes (built 2026-08-09) was
found and fixed as a direct side effect of verifying this batch's own new
ingredients: plain "Honey" (Sweets) and "Olive Oil" (Fats) no longer exist
as real base_name values anywhere in this database at all -- both were
silently resolving to nothing (resolveCuratedRecipeIngredient returning
null), meaning those two ingredients had been vanishing from 4 of the 6
original salads and 2 of the 6 original smoothies every time anyone picked
one. Fixed at the source here (UPDATE, run every time this script runs)
rather than only patched once by hand, so a fresh run of this script always
leaves the whole curated-recipe library, old and new alike, in a genuinely
resolvable state.

Safe to re-run: curated_recipes uses INSERT ... ON CONFLICT(id) DO UPDATE;
curated_recipe_ingredients/curated_recipe_strains have no real primary key
of their own, so each recipe's own rows are deleted and reinserted fresh
every run (the same real delete-then-insert pattern this app's own
lib/db.ts already uses for replaceMealItems); the Honey/Olive Oil fix below
is a plain UPDATE ... WHERE, itself idempotent.

Usage:
  py scripts/add_curated_recipes_batch2.py
"""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "assets" / "data" / "foods_reference.db"

# Real, confirmed (category, base_name) shorthand -- avoids retyping a long,
# verified string every time the same ingredient is reused across recipes.
POTATO = ("Veg", "Potato")
OLIVE_OIL = ("Fats", "Olive Oil (Extra Virgin)")
GARLIC = ("Veg", "Garlic")
ROSEMARY = ("Herbs", "Rosemary")
SALT = ("Herbs", "Common salt/table salt")
BLACK_PEPPER = ("Herbs", "Pepper, black, ground")
BROCCOLI = ("Veg", "Broccoli")
LEMON = ("Fruit", "Lemon")
CAULIFLOWER = ("Veg", "Cauliflower")
SPINACH = ("Veg", "Spinach")
WHOLE_WHEAT_FLOUR = ("PantryStaples", "Whole-Grain Wheat Flour")
WATER = ("Bev", "Water, tap")
BAKERS_YEAST = ("PantryStaples", "Baker's yeast")
HONEY = ("Sweets", "Honeydew honey (Forest Honey)")
TORTILLA_MIX = ("PantryStaples", "Wheat flour, white, tortilla mix, enriched")
BUTTER = ("Fats", "Butter, plain, salted")
BUTTERMILK = ("Dairy", "Buttermilk")
BAKING_POWDER = ("PantryStaples", "Baking powder")
OATS = ("Grain", "Oats")
FLAX_SEEDS = ("NutSeed", "Flax seeds")
EGG = ("Dairy", "Chicken Egg (Raw)")
BANANA = ("Fruit", "Banana")
CINNAMON = ("Herbs", "Spices, cinnamon, ground")
WHOLE_MILK = ("Dairy", "Milk, whole, 3.25% milkfat, with added vitamin D")
CABBAGE = ("Veg", "Cabbage")
BLACK_TEA_BREWED = ("Brewing", "Black Tea (Brewed)")
GREEN_TEA_BREWED = ("Brewing", "Green Tea (Brewed)")
SUGAR = ("Sweets", "Sugar (Cane / Granulated)")
GINGER_ROOT = ("Herbs", "Ginger root")
TURMERIC = ("Herbs", "Turmeric, dried, ground")
MINT = ("Herbs", "Spices, spearmint, fresh")
CHICKPEAS = ("Legume", "Chickpeas (garbanzo beans, bengal gram)")
PAPRIKA = ("Herbs", "Paprika")
CUMIN = ("Herbs", "Cumin (cummin) seed, dried, ground")
ALMONDS = ("NutSeed", "Almonds")
WALNUT = ("NutSeed", "Walnut")
RAISINS = ("Fruit", "Raisins, dark, seedless")
PUMPKIN_SEED = ("NutSeed", "Pumpkin seed")
APPLE = ("Fruit", "Apple")
ALMOND_BUTTER = ("NutSeed", "Nuts, almond butter, plain")
GREEK_YOGURT = ("Dairy", "Yogurt, Greek, plain, lowfat")
BLUEBERRY = ("Fruit", "Blueberry")
STRAWBERRY = ("Fruit", "Strawberry")
# NOTE: not the bare "Chicken breast" base_name -- that resolves to exactly
# one real row, a pre-cooked deli product ("Chicken breast, oven-roasted,
# fat-free, sliced"), confirmed via direct query. This base_name instead has
# both a real Raw row and a real Grilled row, matching what these two
# recipes actually need to cook from scratch.
CHICKEN_BREAST = ("Meat", "Chicken, broiler, breast, skinless, boneless, meat")
CARROT = ("Veg", "Carrot")
CELERY = ("Veg", "Celery")
ONION = ("Veg", "Onion")
CHICKEN_BOUILLON = ("Herbs", "Chicken bouillon/stock/soup (stock cubes, powder)")
VEGETABLE_STOCK = ("PantryStaples", "Vegetable stock")
BUTTERNUT_SQUASH = ("Veg", "Squash, winter, butternut")
NUTMEG = ("Herbs", "Spices, nutmeg, ground")
RED_LENTILS = ("Legume", "Lentil, red, hulled, dry")
TOMATO = ("Veg", "Tomato")
BASIL = ("Herbs", "Basil")
BALSAMIC_VINEGAR = ("Herbs", "Balsamic vinegar")
MUSTARD = ("Herbs", "Mustard, prepared, yellow")
PINE_NUT = ("NutSeed", "Pine nut")
PARMESAN = ("Dairy", "Parmesan")
TAHINI = ("SaucesCondiments", "Tahini")
TURKEY_BREAST = ("Meat", "Turkey Breast (Raw)")
AVOCADO = ("Fruit", "Avocado")
LETTUCE = ("Veg", "Lettuce, green leaf")
BLACK_BEANS = ("Legume", "Black Beans")
SWEET_POTATO = ("Veg", "Sweet potato")
LIME = ("Fruit", "Lime")
CILANTRO = ("Veg", "Coriander (cilantro) leaves")
MAYONNAISE = ("Herbs", "Dressing, mayonnaise, whole egg type")
# Real but untranslated Nordic Baked-category rows -- see this script's own
# docstring for why (no translated English bread row exists at all).
WHEAT_TORTILLA_WRAP = ("Baked", "Tortilla, wraps/burrito, hvetemel")
WHOLE_GRAIN_RYE_BREAD = ("Baked", "Bröd fullkorn vete råg fibrer ca 6%")

# (id, builder_type, name, flavor_profile, health_benefit, servings,
#  serving_size_amount, serving_size_unit, sort_order,
#  ingredients: [(category, base_name, quantity, unit, cut_prep, cooking_method, prep_note)],
#  strain_ids: [fermentation_strains.id, ...] or [])
RECIPES = [
    # --- Side (4) ---
    ("curated_side_herb_roasted_potatoes", "side", "Herb-Roasted Breakfast Potatoes",
     "Crispy on the outside, tender inside, finished with rosemary and garlic.",
     "A whole-food breakfast side: potato retains potassium and vitamin C, especially "
     "with the skin left on, unlike a processed hash-brown patty.",
     4.0, 1.0, "cup", 1,
     [
         (*POTATO, 300, "g", "diced", "Roasted", None),
         (*OLIVE_OIL, 15, "ml", None, None, None),
         (*GARLIC, 6, "g", "minced", None, None),
         (*ROSEMARY, 2, "g", "chopped", None, None),
         (*SALT, 2, "g", None, None, None),
         (*BLACK_PEPPER, 1, "g", None, None, None),
     ], []),
    ("curated_side_lemon_garlic_broccoli", "side", "Lemon Garlic Roasted Broccoli",
     "Bright, garlicky, with a little char at the edges from roasting.",
     "Cruciferous fiber and vitamin C, roasted rather than boiled so more of both stay in the "
     "food instead of the cooking water.",
     4.0, 1.0, "cup", 2,
     [
         (*BROCCOLI, 200, "g", "chopped", "Roasted", None),
         (*OLIVE_OIL, 15, "ml", None, None, None),
         (*GARLIC, 6, "g", "minced", None, None),
         (*LEMON, 30, "g", "juiced", None, None),
         (*SALT, 2, "g", None, None, None),
     ], []),
    ("curated_side_garlic_mashed_cauliflower", "side", "Garlic Mashed Cauliflower",
     "Creamy and garlicky: a whole-food stand-in for mashed potatoes.",
     "A way to keep dinner's own carbohydrate load lighter without giving up a creamy, mashed "
     "side dish.",
     4.0, 1.0, "cup", 3,
     [
         (*CAULIFLOWER, 300, "g", "chopped", "Boiled", None),
         (*GARLIC, 6, "g", "minced", "Boiled", None),
         (*OLIVE_OIL, 15, "ml", None, None, None),
         (*SALT, 2, "g", None, None, None),
         (*BLACK_PEPPER, 1, "g", None, None, None),
     ], []),
    ("curated_side_sauteed_spinach_garlic", "side", "Simple Sautéed Spinach with Garlic",
     "Quick, garlicky, and simple: an everyday green side.",
     "Iron- and folate-rich spinach, lightly wilted in a hot pan rather than boiled down to "
     "almost nothing.",
     4.0, 0.5, "cup", 4,
     [
         (*SPINACH, 200, "g", "whole", "Sauteed", None),
         (*OLIVE_OIL, 10, "ml", None, None, None),
         (*GARLIC, 4, "g", "minced", None, None),
         (*SALT, 1, "g", None, None, None),
         (*LEMON, 15, "g", "juiced", None, None),
     ], []),

    # --- Baked Goods (4) ---
    ("curated_baked_whole_wheat_bread", "bakedGoods", "Simple Whole Wheat Bread",
     "A dense, honest homemade loaf, crust and all.",
     "Whole-grain flour keeps fiber intact that white flour strips out during milling, worth "
     "knowing before reaching for a store loaf.",
     8.0, 1.0, "slice", 1,
     [
         (*WHOLE_WHEAT_FLOUR, 500, "g", None, "Baked", None),
         (*WATER, 300, "ml", None, None, None),
         (*BAKERS_YEAST, 7, "g", None, None, None),
         (*SALT, 6, "g", None, None, None),
         (*HONEY, 15, "g", None, None, None),
         (*OLIVE_OIL, 15, "ml", None, None, None),
     ], []),
    ("curated_baked_wheat_tortillas", "bakedGoods", "Homemade Wheat Tortillas",
     "Soft and made from scratch instead of a packaged stack.",
     "No preservatives or dough conditioners: just flour, fat, water, and salt, the same "
     "ingredients a homemade tortilla has always needed.",
     8.0, 1.0, "each", 2,
     [
         (*TORTILLA_MIX, 250, "g", None, "Baked", None),
         (*WATER, 150, "ml", None, None, None),
         (*OLIVE_OIL, 20, "ml", None, None, None),
         (*SALT, 3, "g", None, None, None),
     ], []),
    ("curated_baked_buttermilk_biscuits", "bakedGoods", "Whole Wheat Buttermilk Biscuits",
     "Flaky and tangy from buttermilk, a from-scratch take on a familiar comfort food.",
     "Whole wheat flour in place of white flour adds fiber to an otherwise-familiar biscuit.",
     8.0, 1.0, "each", 3,
     [
         (*WHOLE_WHEAT_FLOUR, 250, "g", None, "Baked", None),
         (*BUTTER, 60, "g", "cold, cubed", None, None),
         (*BUTTERMILK, 180, "ml", None, None, None),
         (*BAKING_POWDER, 10, "g", None, None, None),
         (*SALT, 3, "g", None, None, None),
     ], []),
    ("curated_baked_banana_oat_cookies", "bakedGoods", "Banana Oat Breakfast Cookies",
     "Naturally sweet from banana, a healthier stand-in for a dessert cookie.",
     "No added refined sugar. Ripe banana and a small amount of honey do the sweetening, with "
     "flaxseed fiber and omega-3s folded in.",
     12.0, 1.0, "each", 4,
     [
         (*OATS, 150, "g", None, "Baked", None),
         (*BANANA, 200, "g", "mashed", None, None),
         (*FLAX_SEEDS, 15, "g", "ground", None, None),
         (*HONEY, 20, "g", None, None, None),
         (*CINNAMON, 2, "g", None, None, None),
     ], []),

    # --- Fermentation (4) ---
    ("curated_ferment_plain_yogurt", "fermentation", "Homemade Plain Yogurt",
     "Tangy and thick, the classic homemade yogurt.",
     "Made with the same two starter cultures Codex Alimentarius requires for anything legally "
     "labeled yogurt: S. thermophilus and L. bulgaricus.",
     8.0, 1.0, "cup", 1,
     [
         (*WHOLE_MILK, 1000, "ml", None, "Fermented", None),
     ], ["strain_s_thermophilus", "strain_l_bulgaricus"]),
    ("curated_ferment_probiotic_yogurt", "fermentation", "Probiotic-Boosted Yogurt",
     "The same base yogurt, built with a broader culture blend.",
     "Adds L. acidophilus and Bifidobacterium species alongside the required yogurt starter pair, "
     "for a broader culture blend than a plain store yogurt typically carries.",
     8.0, 1.0, "cup", 2,
     [
         (*WHOLE_MILK, 1000, "ml", None, "Fermented", None),
     ], ["strain_s_thermophilus", "strain_l_bulgaricus", "strain_l_acidophilus", "strain_bifidobacterium"]),
    ("curated_ferment_sauerkraut", "fermentation", "Classic Sauerkraut",
     "Tangy and crunchy, a two-ingredient ferment.",
     "Fermentation, not vinegar-pickling: Leuconostoc mesenteroides kicks off the "
     "process, with Lactobacillus plantarum taking over as it sours.",
     8.0, 0.5, "cup", 3,
     [
         (*CABBAGE, 1000, "g", "shredded", "Fermented", None),
         (*SALT, 20, "g", None, None, None),
     ], ["strain_l_mesenteroides", "strain_l_plantarum"]),
    ("curated_ferment_kombucha", "fermentation", "Home-Brewed Kombucha",
     "Tangy, lightly fizzy, a fermented tea.",
     "A live SCOBY does the actual fermenting here (not one of this app's own catalogued "
     "single strains, deliberately left unlinked rather than guessed at). Start with brewed "
     "tea and sugar.",
     8.0, 1.0, "cup", 4,
     [
         (*BLACK_TEA_BREWED, 2000, "ml", None, "Fermented", None),
         (*SUGAR, 200, "g", None, None, None),
     ], []),

    # --- Beverage (4) ---
    ("curated_bev_ginger_turmeric_tonic", "beverage", "Ginger Turmeric Immunity Tonic",
     "Warming, spicy, and citrusy.",
     "A curcumin-and-piperine pairing already documented in this app's own Nutrient "
     "Interactions research: black pepper measurably improves how well turmeric's own curcumin "
     "actually absorbs.",
     4.0, 1.0, "cup", 1,
     [
         (*GINGER_ROOT, 15, "g", "grated", None, None),
         (*TURMERIC, 3, "g", None, None, None),
         (*LEMON, 30, "g", "juiced", None, None),
         (*HONEY, 15, "g", None, None, None),
         (*WATER, 500, "ml", None, None, None),
         (*BLACK_PEPPER, 1, "g", None, None, None),
     ], []),
    ("curated_bev_electrolyte_water", "beverage", "Electrolyte Recovery Water",
     "Light, a little salty-sweet, and citrusy.",
     "A simple homemade alternative to a commercial sports drink, with sodium and "
     "potassium-rich citrus, no artificial dye or flavoring.",
     1.0, 2.0, "cup", 2,
     [
         (*WATER, 500, "ml", None, None, None),
         (*SALT, 2, "g", None, None, None),
         (*LEMON, 30, "g", "juiced", None, None),
         (*HONEY, 10, "g", None, None, None),
     ], []),
    ("curated_bev_iced_green_tea_mint", "beverage", "Iced Green Tea with Mint",
     "Light, herbal, and refreshing.",
     "A plain brewed tea, no added sugar unless you choose to add it yourself.",
     4.0, 1.0, "cup", 3,
     [
         (*GREEN_TEA_BREWED, 1000, "ml", None, None, None),
         (*MINT, 5, "g", "torn", None, None),
     ], []),
    ("curated_bev_golden_milk", "beverage", "Golden Milk (Turmeric Latte)",
     "Warm, spiced, and creamy.",
     "The same curcumin-and-black-pepper pairing as the Ginger Turmeric Tonic above, in a warm, "
     "milk-based drink instead.",
     1.0, 1.25, "cup", 4,
     [
         (*WHOLE_MILK, 300, "ml", None, None, None),
         (*TURMERIC, 2, "g", None, None, None),
         (*CINNAMON, 1, "g", None, None, None),
         (*BLACK_PEPPER, 0.5, "g", None, None, None),
         (*HONEY, 10, "g", None, None, None),
     ], []),

    # --- Snack (4) ---
    ("curated_snack_roasted_chickpeas", "snack", "Roasted Chickpeas",
     "Crunchy, salty, a little smoky from paprika.",
     "A whole-legume alternative to a processed chip: fiber and plant protein in the "
     "same crunchy bite.",
     4.0, 0.5, "cup", 1,
     [
         (*CHICKPEAS, 200, "g", "drained", "Roasted", None),
         (*OLIVE_OIL, 10, "ml", None, None, None),
         (*SALT, 2, "g", None, None, None),
         (*PAPRIKA, 2, "g", None, None, None),
     ], []),
    ("curated_snack_trail_mix", "snack", "Simple Trail Mix",
     "A no-added-sugar mix of nuts, seeds, and dried fruit.",
     "Whole-food fats and protein from the nuts and seeds, with the dried fruit's own natural "
     "sugar the only sweetness here.",
     4.0, 0.25, "cup", 2,
     [
         (*ALMONDS, 40, "g", None, None, None),
         (*WALNUT, 40, "g", None, None, None),
         (*RAISINS, 40, "g", None, None, None),
         (*PUMPKIN_SEED, 30, "g", None, None, None),
     ], []),
    ("curated_snack_apple_almond_butter", "snack", "Apple Slices with Almond Butter",
     "Sweet, tart, and creamy.",
     "Whole apple fiber paired with almond butter's own protein and healthy fat, a more "
     "filling combination than fruit alone.",
     1.0, 1.0, "serving", 3,
     [
         (*APPLE, 150, "g", "sliced", None, None),
         (*ALMOND_BUTTER, 30, "g", None, None, None),
         (*CINNAMON, 1, "g", None, None, None),
     ], []),
    ("curated_snack_berries_yogurt", "snack", "Berries with Greek Yogurt",
     "Creamy, tangy, and naturally sweet.",
     "Protein-rich Greek yogurt paired with antioxidant-rich berries: far less added "
     "sugar than a flavored, pre-sweetened yogurt cup.",
     1.0, 1.0, "bowl", 4,
     [
         (*GREEK_YOGURT, 200, "g", None, None, None),
         (*BLUEBERRY, 75, "g", None, None, None),
         (*STRAWBERRY, 75, "g", "sliced", None, None),
         (*HONEY, 10, "g", None, None, None),
     ], []),

    # --- Soup (4) ---
    ("curated_soup_chicken_vegetable", "soup", "Simple Chicken Vegetable Soup",
     "A homey, everyday soup.",
     "Lean protein and vegetables in one bowl, without the added sodium load a canned soup "
     "usually carries.",
     4.0, 1.5, "cup", 1,
     [
         (*CHICKEN_BREAST, 200, "g", "diced", "Simmered", None),
         (*CARROT, 100, "g", "diced", None, None),
         (*CELERY, 80, "g", "diced", None, None),
         (*ONION, 100, "g", "diced", None, None),
         (*GARLIC, 6, "g", "minced", None, None),
         (*CHICKEN_BOUILLON, 10, "g", None, None, None),
         (*WATER, 1000, "ml", None, None, None),
         (*SALT, 3, "g", None, None, None),
     ], []),
    ("curated_soup_butternut_squash", "soup", "Butternut Squash Soup",
     "Creamy and naturally sweet, with a warm hint of nutmeg.",
     "A whole-vegetable soup with no added cream needed for its own naturally creamy texture "
     "once blended.",
     4.0, 1.5, "cup", 2,
     [
         (*BUTTERNUT_SQUASH, 500, "g", "cubed", "Simmered", None),
         (*ONION, 100, "g", "diced", None, None),
         (*GARLIC, 6, "g", "minced", None, None),
         (*VEGETABLE_STOCK, 15, "g", None, None, None),
         (*WATER, 750, "ml", None, None, None),
         (*OLIVE_OIL, 15, "ml", None, None, None),
         (*NUTMEG, 1, "g", None, None, None),
         (*SALT, 3, "g", None, None, None),
     ], []),
    ("curated_soup_red_lentil", "soup", "Red Lentil Soup",
     "Warm, earthy, and lightly spiced with cumin.",
     "Plant protein and fiber from the lentils, a filling, whole-food soup that needs no "
     "meat at all.",
     4.0, 1.5, "cup", 3,
     [
         (*RED_LENTILS, 200, "g", None, "Simmered", None),
         (*CARROT, 80, "g", "diced", None, None),
         (*CELERY, 60, "g", "diced", None, None),
         (*ONION, 100, "g", "diced", None, None),
         (*GARLIC, 6, "g", "minced", None, None),
         (*VEGETABLE_STOCK, 15, "g", None, None, None),
         (*WATER, 1000, "ml", None, None, None),
         (*CUMIN, 3, "g", None, None, None),
         (*SALT, 3, "g", None, None, None),
     ], []),
    ("curated_soup_tomato_basil", "soup", "Tomato Basil Soup",
     "Bright, herbal, and comforting.",
     "Whole tomatoes rather than a canned condensed soup base, with fresh basil instead "
     "of a dried seasoning packet.",
     4.0, 1.5, "cup", 4,
     [
         (*TOMATO, 600, "g", "chopped", "Simmered", None),
         (*ONION, 100, "g", "diced", None, None),
         (*GARLIC, 6, "g", "minced", None, None),
         (*BASIL, 5, "g", "chopped", None, None),
         (*OLIVE_OIL, 15, "ml", None, None, None),
         (*VEGETABLE_STOCK, 10, "g", None, None, None),
         (*WATER, 500, "ml", None, None, None),
         (*SALT, 3, "g", None, None, None),
     ], []),

    # --- Sauces (4) ---
    ("curated_sauce_basic_tomato", "sauce", "Basic Tomato Sauce",
     "Rich, garlicky, cooked-down tomato flavor.",
     "Built from whole tomatoes rather than a jarred sauce with added sugar or preservatives.",
     6.0, 0.5, "cup", 1,
     [
         (*TOMATO, 600, "g", "chopped", "Reduced", None),
         (*GARLIC, 6, "g", "minced", None, None),
         (*ONION, 80, "g", "diced", None, None),
         (*OLIVE_OIL, 20, "ml", None, None, None),
         (*BASIL, 5, "g", "chopped", None, None),
         (*SALT, 3, "g", None, None, None),
     ], []),
    ("curated_sauce_garlic_herb_vinaigrette", "sauce", "Garlic Herb Vinaigrette",
     "Tangy, garlicky, an everyday salad dressing.",
     "Olive oil and vinegar, no added sugar or stabilizers a bottled dressing typically carries.",
     8.0, 2.0, "tbsp", 2,
     [
         (*OLIVE_OIL, 60, "ml", None, None, None),
         (*BALSAMIC_VINEGAR, 30, "ml", None, None, None),
         (*GARLIC, 4, "g", "minced", None, None),
         (*MUSTARD, 5, "g", None, None, None),
         (*SALT, 1, "g", None, None, None),
         (*BLACK_PEPPER, 1, "g", None, None, None),
     ], []),
    ("curated_sauce_simple_pesto", "sauce", "Simple Pesto",
     "Herbal, nutty, and garlicky.",
     "Basil, pine nuts, and olive oil: a made-from-scratch pesto without the added oils "
     "and preservatives a jarred pesto usually carries.",
     8.0, 2.0, "tbsp", 3,
     [
         (*BASIL, 40, "g", None, None, None),
         (*PINE_NUT, 20, "g", None, None, None),
         (*GARLIC, 6, "g", None, None, None),
         (*OLIVE_OIL, 60, "ml", None, None, None),
         (*PARMESAN, 20, "g", "grated", None, None),
         (*SALT, 1, "g", None, None, None),
     ], []),
    ("curated_sauce_tahini_lemon", "sauce", "Tahini Lemon Sauce",
     "Creamy, nutty, and bright with lemon.",
     "A whole-sesame sauce with plant protein and healthy fat, versatile over roasted "
     "vegetables, a grain bowl, or a wrap.",
     6.0, 2.0, "tbsp", 4,
     [
         (*TAHINI, 60, "g", None, None, None),
         (*LEMON, 30, "g", "juiced", None, None),
         (*GARLIC, 3, "g", "minced", None, None),
         (*WATER, 60, "ml", None, None, None),
         (*SALT, 1, "g", None, None, None),
     ], []),

    # --- Handhelds (4) ---
    ("curated_handheld_turkey_avocado_wrap", "handheld", "Turkey & Avocado Wrap",
     "Fresh, light, and filling.",
     "Lean turkey and avocado's own healthy fat, in a whole-wheat wrap rather than a "
     "processed deli-counter build.",
     1.0, 1.0, "wrap", 1,
     [
         (*WHEAT_TORTILLA_WRAP, 1, "each", None, None, None),
         (*TURKEY_BREAST, 100, "g", "sliced", None, None),
         (*AVOCADO, 80, "g", "sliced", None, None),
         (*LETTUCE, 30, "g", None, None, None),
         (*TOMATO, 60, "g", "sliced", None, None),
     ], []),
    ("curated_handheld_grilled_chicken_sandwich", "handheld", "Grilled Chicken Sandwich",
     "Simple and filling.",
     "Grilled chicken breast on whole-grain bread, rather than a fried, breaded "
     "fast-food version.",
     1.0, 1.0, "sandwich", 2,
     [
         (*WHOLE_GRAIN_RYE_BREAD, 2, "slice", None, None, None),
         (*CHICKEN_BREAST, 120, "g", None, "Grilled", None),
         (*LETTUCE, 20, "g", None, None, None),
         (*TOMATO, 40, "g", "sliced", None, None),
         (*AVOCADO, 40, "g", "sliced", None, None),
     ], []),
    ("curated_handheld_black_bean_sweet_potato_tacos", "handheld", "Black Bean & Sweet Potato Tacos",
     "Warm, a little sweet, and satisfying.",
     "A plant-forward taco with legume protein and fiber from the black beans, and "
     "beta-carotene from the sweet potato.",
     2.0, 1.0, "taco", 3,
     [
         (*WHEAT_TORTILLA_WRAP, 2, "each", None, None, None),
         (*BLACK_BEANS, 150, "g", None, None, None),
         (*SWEET_POTATO, 150, "g", "cubed", "Roasted", None),
         (*AVOCADO, 60, "g", "sliced", None, None),
         (*LIME, 15, "g", "juiced", None, None),
         (*CILANTRO, 5, "g", "chopped", None, None),
     ], []),
    ("curated_handheld_egg_salad_lettuce_wraps", "handheld", "Egg Salad Lettuce Wraps",
     "Creamy, savory, and lighter than a bread-based sandwich.",
     "The same egg salad, in a lettuce wrap instead of bread, for anyone watching "
     "refined-carbohydrate intake.",
     2.0, 1.0, "wrap", 4,
     [
         (*EGG, 4, "each", None, "Boiled", None),
         (*MAYONNAISE, 30, "g", None, None, None),
         (*CELERY, 40, "g", "diced", None, None),
         (*LETTUCE, 60, "g", None, None, None),
         (*MUSTARD, 5, "g", None, None, None),
     ], []),
]


def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Real, pre-existing bug fix (see this script's own docstring) -- run
    # first, unconditionally, before the new batch below.
    cur.execute(
        "UPDATE curated_recipe_ingredients SET base_name = ? WHERE category = 'Sweets' AND base_name = 'Honey'",
        ("Honeydew honey (Forest Honey)",),
    )
    honey_fixed = cur.rowcount
    cur.execute(
        "UPDATE curated_recipe_ingredients SET base_name = ? WHERE category = 'Fats' AND base_name = 'Olive Oil'",
        ("Olive Oil (Extra Virgin)",),
    )
    oil_fixed = cur.rowcount
    print(f"Fixed {honey_fixed} pre-existing 'Honey' rows and {oil_fixed} pre-existing 'Olive Oil' rows "
          f"(both previously unresolvable base_names) in the original 12 recipes.")

    for recipe_id, builder_type, name, flavor_profile, health_benefit, servings, serving_size_amount, \
            serving_size_unit, sort_order, ingredients, strain_ids in RECIPES:
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

        cur.execute("DELETE FROM curated_recipe_strains WHERE recipe_id = ?", (recipe_id,))
        for strain_id in strain_ids:
            cur.execute(
                "INSERT INTO curated_recipe_strains (recipe_id, strain_id) VALUES (?, ?)",
                (recipe_id, strain_id),
            )

    conn.commit()

    total_ingredients = sum(len(r[9]) for r in RECIPES)
    total_strain_links = sum(len(r[10]) for r in RECIPES)
    print(f"Upserted {len(RECIPES)} curated_recipes rows, {total_ingredients} curated_recipe_ingredients rows, "
          f"{total_strain_links} curated_recipe_strains rows.")

    conn.close()


if __name__ == "__main__":
    main()
