"""
2026-08-26, direct follow-up to the 2026-08-26 vegan-breakfast batch's own
named next step (CLAUDE.md Open Next Steps #15 at the time): "Let's tackle
the Hashimoto's-vegan-breakfast batch next," with a shared Google AI Mode
conversation of generic vegan breakfast ideas for creative reference
(https://share.google/aimode/kG4gqelMOU5XGglp0).

The prior batch closed the general vegan-breakfast gap (17 to 33 recipes)
but left the narrower Hashimoto's+vegan+breakfast combination at only 5
of 30, confirmed at the time to be a second, real constraint beyond soy:
most of those recipes are genuinely oxalate- and/or phytate-flagged for
Hashimoto's (amaranth, spinach, sweet potato, buckwheat, chia are all
real, legitimately high-oxalate whole foods; nuts, seeds, and legumes
independently carry a real, still-unresolved "Mineral Binding Risk" flag
-- see CLAUDE.md's own "genuinely open question" note on that
sub-criterion). The AI Mode conversation's own ideas (tofu scrambles,
nut-butter toasts, bean hashes, chia pudding, nutritional-yeast
scrambles) were checked directly against Hashimoto's real 24 relevant
sub-criteria before writing anything, not assumed usable just because
they're vegan -- confirmed unusable here for exactly the reasons above,
plus two less obvious ones this pass found directly, not guessed:
- Every real cooking oil/fat row in this database (olive, coconut,
  avocado) is flagged Omega-3-vs-6 Imbalanced or Oxidation Risk
  Imbalanced for Hashimoto's specifically -- confirmed by direct query,
  not assumed. Whole avocado itself scores clean; pressed oils don't.
- Turmeric and black pepper, a very common savory-breakfast pairing (and
  used in several of this app's own existing vegan breakfast recipes),
  are each independently flagged under "Iron (contextual)" for
  Hashimoto's. Nutritional yeast is flagged under Zinc. All three are
  deliberately absent from this batch.

Every one of the ~85 candidate ingredients below was checked directly
against the live database's own food_scores/sub_criterion_condition_
relevance data before being used (not assumed clean from general
nutrition knowledge), the same way every prior curated-recipe batch in
this app verifies against the reference database rather than guessing.
The confirmed-clean palette turned out narrow and real, not padded:
whole fruit, oats/rice/sorghum/cornmeal/tapioca as the only clean whole-
grain-family bases (millet, quinoa, buckwheat, and amaranth are all
independently oxalate- and/or mineral-binding-flagged), coconut milk and
whole avocado as the only clean fat/creaminess sources, maple syrup as
the only clean sweetener, and a handful of clean vegetables (zucchini,
bell pepper, tomato, leek, fennel, cilantro, fresh ginger) for a few
genuinely savory options. A real, honest tradeoff follows directly from
this: with every common plant-protein source (legumes, nuts, seeds, soy)
independently flagged, these recipes run low in protein compared to a
typical vegan breakfast -- named directly here, not hidden, since it's a
real property of what "the narrowest possible reading of genuinely
clean" actually allows, not an oversight.

Diet tags and condition safety/cautions are NOT hand-computed here --
scripts/compute_recipe_diet_tags.js and scripts/compute_recipe_condition_
data.js (already-established, already-idempotent machinery) are run
against this data afterward, exactly like every prior recipe batch, so
the real, final safe-for-Hashimoto's count is verified, not assumed from
this file's own reasoning above.

Each recipe's own real `instructions` are written directly into this
script's own INSERT (the curated_recipes.instructions column added
2026-08-26 to fix the "steps aren't showing up" bug) -- deliberately the
one, single source of truth for this batch. A companion script,
generate_hashimotos_vegan_breakfast_recipes_ts.js, reads this same
RECIPES list (via an intermediate JSON dump this script can also
produce, see its own header) and writes the matching lib/digest/
recipes.ts DigestEntry blocks, specifically so the database and the
Digest text can never drift apart the way the earlier bug proved they
can.

Usage:
  py scripts/add_hashimotos_safe_vegan_breakfasts.py
  node scripts/generate_hashimotos_vegan_breakfast_recipes_ts.js
  node scripts/compute_recipe_condition_data.js
  node scripts/apply_recipe_condition_cautions.js
  node scripts/compute_recipe_diet_tags.js
  node scripts/apply_recipe_diet_tags.js
"""
import json
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "assets" / "data" / "foods_reference.db"

# --- Verified-clean ingredient palette (2026-08-26) -------------------------
# Every one of these checked directly against food_scores/sub_criterion_
# condition_relevance for condition_code='hashimotos' before being used:
# zero yellow or red hits on any of Hashimoto's real 24 relevant sub-
# criteria (Selenium & Zn synergy and Iron Presence excluded as this app's
# own established near-universal background signal; Oxalate Level and
# Oxalate Tolerance Note excluded as raw-measurement duplicates of the
# calibrated Oxalate Load Rank, per the 2026-08-26 oxalate-severity fix).
OATS = ("Grain", "Oats")
RICE = ("Grain", "Grains, rice, brown, long-grain, dry")
SORGHUM = ("Grain", "Sorghum grain")
CORNMEAL = ("Grain", "Cornmeal, whole-grain, yellow")
TAPIOCA = ("Grain", "Tapioca, pearl, dry")

COCONUT_MILK = ("NutSeed", "Coconut milk")
AVOCADO = ("Fruit", "Avocado")

BANANA = ("Fruit", "Banana")
BLUEBERRY = ("Fruit", "Blueberry")
STRAWBERRY = ("Fruit", "Strawberry")
RASPBERRY = ("Fruit", "Raspberry")
BLACKBERRY = ("Fruit", "Blackberry")
APPLE = ("Fruit", "Apple")
PEAR = ("Fruit", "Pear")
DATE = ("Fruit", "Date")
PINEAPPLE = ("Fruit", "Pineapple")
GRAPEFRUIT = ("Fruit", "Grapefruit")
PAPAYA = ("Fruit", "Papaya")
PEACH = ("Fruit", "Peach")
APRICOT = ("Fruit", "Apricot")
ORANGE = ("Fruit", "Orange")
CRANBERRY = ("Fruit", "Cranberry")
LIME = ("Fruit", "Lime")
LEMON = ("Fruit", "Lemon")

ZUCCHINI = ("Veg", "Squash, zucchini")
RED_BELL_PEPPER = ("Veg", "Red Bell Pepper")
TOMATO = ("Veg", "Tomato")
LEEK = ("Veg", "Leek")
FENNEL = ("Veg", "Fennel Bulb")
CILANTRO = ("Veg", "Coriander (cilantro) leaves")
GINGER = ("Veg", "Ginger, peeled, fresh")

CANTALOUPE = ("Fruit", "Cantaloupe Melon")

WATER = ("Bev", "Water, tap")
MAPLE_SYRUP = ("Sweets", "Maple Syrup (100% Pure)")
CINNAMON = ("Herbs", "Spices, cinnamon, ground")
SALT = ("Herbs", "Common salt/table salt")

# (id, builder_type, name, flavor_profile, health_benefit, servings,
#  serving_size_amount, serving_size_unit, sort_order, ingredients,
#  instructions)
# Each ingredient tuple: (category, base_name, quantity, unit, cut_prep,
# cooking_method, prep_note).
RECIPES = [
    ("curated_vegan_blueberry_cinnamon_oatmeal", "snack",
     "Blueberry Cinnamon Oatmeal",
     "Creamy coconut-milk oatmeal simmered plain, topped with warm blueberries and a real hit of cinnamon.",
     "Oats and coconut milk alone, with warm blueberries and cinnamon stirred through, a genuinely whole-food breakfast built entirely from ingredients that check clean for Hashimoto's, not just soy-free.",
     1.0, 1.0, "bowl", 300,
     [(*OATS, 40, "g", None, "simmered", None), (*COCONUT_MILK, 150, "ml", None, None, None),
      (*BLUEBERRY, 70, "g", None, None, None), (*CINNAMON, 0.5, "tsp", None, None, None),
      (*MAPLE_SYRUP, 5, "g", None, None, "optional")],
     ["Combine the oats and coconut milk in a small saucepan and bring to a gentle simmer.",
      "Cook, stirring occasionally, for 5-7 minutes, until thick and creamy.",
      "Fold in the blueberries and cinnamon, and cook 1-2 minutes more, just until the berries soften and release a little juice.",
      "Drizzle with maple syrup if you'd like a touch of sweetness, and serve warm."]),
    ("curated_vegan_strawberry_banana_oatmeal", "snack",
     "Strawberry Banana Oatmeal",
     "Coconut-milk oatmeal with sliced banana stirred in and fresh strawberries piled on top.",
     "A simple, classic pairing built on the same clean oats-and-coconut-milk base, with real whole fruit doing all the sweetening work.",
     1.0, 1.0, "bowl", 301,
     [(*OATS, 40, "g", None, "simmered", None), (*COCONUT_MILK, 150, "ml", None, None, None),
      (*BANANA, 60, "g", "sliced", None, None), (*STRAWBERRY, 60, "g", "sliced", None, None),
      (*MAPLE_SYRUP, 5, "g", None, None, "optional")],
     ["Combine the oats and coconut milk in a small saucepan and bring to a gentle simmer.",
      "Cook, stirring occasionally, for 5-7 minutes, until thick and creamy.",
      "Stir in half the banana slices during the last minute of cooking, so they warm through and soften slightly.",
      "Top with the remaining banana and the fresh strawberries, and a drizzle of maple syrup if using."]),
    ("curated_vegan_baked_apple_cinnamon_oatmeal_cup", "snack",
     "Baked Apple Cinnamon Oatmeal Cup",
     "A single-serving baked oatmeal cup, sweetened only by diced apple and a real dose of cinnamon.",
     "Baking the oats concentrates the apple's natural sweetness instead of relying on any added sugar, and this whole dish is built from a genuinely clean, whole-food ingredient list.",
     1.0, 1.0, "cup", 302,
     [(*OATS, 45, "g", None, None, None), (*COCONUT_MILK, 120, "ml", None, None, None),
      (*APPLE, 70, "g", "diced small", None, None), (*CINNAMON, 0.5, "tsp", None, None, None),
      (*MAPLE_SYRUP, 5, "g", None, None, "optional")],
     ["Preheat the oven to 350F (175C).",
      "Stir the oats, coconut milk, diced apple, and cinnamon together in a small oven-safe ramekin or cup.",
      "Bake for 25-30 minutes, until set and lightly golden on top.",
      "Let cool for a couple of minutes before eating, and drizzle with maple syrup if you'd like."]),
    ("curated_vegan_date_cinnamon_overnight_oats", "snack",
     "Date & Cinnamon Overnight Oats",
     "No-cook overnight oats soaked in coconut milk, sweetened only by chopped dates and cinnamon.",
     "A real make-ahead option built on the same clean base as this batch's other oat dishes, ready to eat straight from the fridge.",
     1.0, 1.0, "jar", 303,
     [(*OATS, 40, "g", None, None, None), (*COCONUT_MILK, 130, "ml", None, None, None),
      (*DATE, 30, "g", "chopped", None, None), (*CINNAMON, 0.5, "tsp", None, None, None)],
     ["Combine the oats, coconut milk, chopped dates, and cinnamon in a jar or container.",
      "Stir well, cover, and refrigerate overnight (at least 6 hours).",
      "Stir again before eating; add a splash more coconut milk if you prefer it looser."]),
    ("curated_vegan_orange_cranberry_rice_pudding", "snack",
     "Orange Cranberry Rice Pudding",
     "Brown rice simmered slowly in coconut milk until creamy, finished with fresh orange segments and cranberries.",
     "A real rice pudding, built entirely on clean, whole-food ingredients, with orange and cranberry's natural tartness balancing the coconut milk's richness.",
     1.0, 1.0, "bowl", 304,
     [(*RICE, 35, "g", None, "simmered", None), (*COCONUT_MILK, 250, "ml", None, None, None),
      (*ORANGE, 60, "g", "segmented", None, None), (*CRANBERRY, 30, "g", None, None, None),
      (*MAPLE_SYRUP, 5, "g", None, None, "optional")],
     ["Combine the rice and coconut milk in a saucepan and bring to a gentle simmer.",
      "Cook uncovered, stirring often, for 30-35 minutes, until the rice is fully tender and the mixture is thick and creamy.",
      "Stir in the cranberries during the last 5 minutes so they soften and release some color.",
      "Top with the fresh orange segments just before serving, warm or chilled."]),
    ("curated_vegan_ginger_pear_rice_pudding", "snack",
     "Ginger Pear Rice Pudding",
     "Creamy coconut-milk rice pudding with fresh ginger and warm cinnamon, topped with sliced pear.",
     "Fresh ginger gives this rice pudding real warmth without needing any of the spices flagged for Hashimoto's in this app's reference database.",
     1.0, 1.0, "bowl", 305,
     [(*RICE, 35, "g", None, "simmered", None), (*COCONUT_MILK, 250, "ml", None, None, None),
      (*GINGER, 3, "g", "grated", None, None), (*CINNAMON, 0.25, "tsp", None, None, None),
      (*PEAR, 70, "g", "sliced", None, None), (*MAPLE_SYRUP, 5, "g", None, None, "optional")],
     ["Combine the rice, coconut milk, grated ginger, and cinnamon in a saucepan and bring to a gentle simmer.",
      "Cook uncovered, stirring often, for 30-35 minutes, until the rice is fully tender and the mixture is thick and creamy.",
      "Top with the fresh sliced pear just before serving, warm or chilled."]),
    ("curated_vegan_peach_sorghum_porridge", "snack",
     "Peach Sorghum Porridge",
     "Whole-grain sorghum simmered in coconut milk until tender and creamy, topped with warm sliced peach and cinnamon.",
     "Sorghum is a real, genuinely different whole grain from oats or rice, and one of the few this database scores completely clean for Hashimoto's.",
     1.0, 1.0, "bowl", 306,
     [(*SORGHUM, 45, "g", None, "simmered", None), (*COCONUT_MILK, 180, "ml", None, None, None),
      (*PEACH, 80, "g", "sliced", None, None), (*CINNAMON, 0.5, "tsp", None, None, None),
      (*MAPLE_SYRUP, 5, "g", None, None, "optional")],
     ["Combine the sorghum and coconut milk in a saucepan and bring to a gentle simmer.",
      "Cover and cook for 40-45 minutes, stirring occasionally and adding a splash of water if it gets too thick, until the sorghum is tender.",
      "Stir in the cinnamon, top with the warm sliced peach, and drizzle with maple syrup if using."]),
    ("curated_vegan_raspberry_lime_sorghum_porridge", "snack",
     "Raspberry Lime Sorghum Porridge",
     "Creamy sorghum porridge finished with fresh raspberries and a bright squeeze of lime.",
     "A genuinely different flavor direction from this batch's other porridges, real citrus brightening a rich, whole-grain base.",
     1.0, 1.0, "bowl", 307,
     [(*SORGHUM, 45, "g", None, "simmered", None), (*COCONUT_MILK, 180, "ml", None, None, None),
      (*RASPBERRY, 60, "g", None, None, None), (*LIME, 0.25, "each", "juiced", None, None),
      (*MAPLE_SYRUP, 5, "g", None, None, "optional")],
     ["Combine the sorghum and coconut milk in a saucepan and bring to a gentle simmer.",
      "Cover and cook for 40-45 minutes, stirring occasionally and adding a splash of water if it gets too thick, until the sorghum is tender.",
      "Stir in the lime juice, top with the fresh raspberries, and drizzle with maple syrup if using."]),
    ("curated_vegan_sweet_polenta_apricot_compote", "snack",
     "Sweet Polenta with Warm Apricot Compote",
     "Creamy coconut-milk polenta topped with apricots stewed soft with cinnamon.",
     "Cornmeal polenta makes a genuinely different sweet breakfast base from any grain elsewhere in this batch, entirely clean for Hashimoto's.",
     1.0, 1.0, "bowl", 308,
     [(*CORNMEAL, 40, "g", None, "simmered", None), (*COCONUT_MILK, 180, "ml", None, None, None),
      (*APRICOT, 80, "g", "sliced", "stewed", None), (*CINNAMON, 0.5, "tsp", None, None, None),
      (*MAPLE_SYRUP, 5, "g", None, None, "optional")],
     ["Whisk the cornmeal into the coconut milk in a saucepan and bring to a gentle simmer, whisking often to prevent lumps.",
      "Cook for 8-10 minutes, until thick and smooth.",
      "Meanwhile, gently stew the sliced apricot with the cinnamon and a splash of water in a small pan for 5 minutes, until soft.",
      "Spoon the warm apricot compote over the polenta and drizzle with maple syrup if using."]),
    ("curated_vegan_banana_polenta_porridge", "snack",
     "Banana Polenta Porridge",
     "Smooth coconut-milk polenta with mashed banana stirred through and cinnamon on top.",
     "A genuinely different texture from oatmeal or rice pudding, sweetened almost entirely by real banana.",
     1.0, 1.0, "bowl", 309,
     [(*CORNMEAL, 40, "g", None, "simmered", None), (*COCONUT_MILK, 180, "ml", None, None, None),
      (*BANANA, 70, "g", "mashed", None, None), (*CINNAMON, 0.25, "tsp", None, None, None),
      (*MAPLE_SYRUP, 5, "g", None, None, "optional")],
     ["Whisk the cornmeal into the coconut milk in a saucepan and bring to a gentle simmer, whisking often to prevent lumps.",
      "Cook for 8-10 minutes, until thick and smooth.",
      "Stir in the mashed banana during the last minute of cooking.",
      "Top with a dusting of cinnamon and a drizzle of maple syrup if using."]),
    ("curated_vegan_pineapple_coconut_tapioca_pudding", "snack",
     "Pineapple Coconut Tapioca Pudding",
     "Small tapioca pearls simmered slowly in coconut milk until glossy and thick, topped with fresh pineapple.",
     "A genuinely different texture from a porridge or rice pudding, real tapioca pearls cooked low and slow in coconut milk alone.",
     1.0, 1.0, "bowl", 310,
     [(*TAPIOCA, 30, "g", None, "simmered", None), (*COCONUT_MILK, 220, "ml", None, None, None),
      (*PINEAPPLE, 70, "g", "diced", None, None), (*MAPLE_SYRUP, 5, "g", None, None, "optional")],
     ["Combine the tapioca pearls and coconut milk in a saucepan and let sit for 10 minutes to soften.",
      "Bring to a gentle simmer, stirring frequently, and cook for 15-20 minutes, until the pearls turn translucent and the mixture thickens.",
      "Let cool slightly (it will continue to thicken as it cools), then top with the fresh diced pineapple.",
      "Drizzle with maple syrup if using, and serve warm or chilled."]),
    ("curated_vegan_mixed_berry_coconut_tapioca_pudding", "snack",
     "Mixed Berry Coconut Tapioca Pudding",
     "Coconut-milk tapioca pudding topped with fresh blackberries and raspberries.",
     "The same clean tapioca-and-coconut-milk base as this batch's pineapple version, with a genuinely different, tart-berry finish.",
     1.0, 1.0, "bowl", 311,
     [(*TAPIOCA, 30, "g", None, "simmered", None), (*COCONUT_MILK, 220, "ml", None, None, None),
      (*BLACKBERRY, 40, "g", None, None, None), (*RASPBERRY, 40, "g", None, None, None),
      (*MAPLE_SYRUP, 5, "g", None, None, "optional")],
     ["Combine the tapioca pearls and coconut milk in a saucepan and let sit for 10 minutes to soften.",
      "Bring to a gentle simmer, stirring frequently, and cook for 15-20 minutes, until the pearls turn translucent and the mixture thickens.",
      "Let cool slightly (it will continue to thicken as it cools), then top with the fresh blackberries and raspberries.",
      "Drizzle with maple syrup if using, and serve warm or chilled."]),
    ("curated_vegan_tropical_fruit_bowl_coconut", "snack",
     "Tropical Fruit Bowl with Coconut",
     "A no-cook bowl of banana, pineapple, papaya, and orange, drizzled with a little coconut milk.",
     "A genuinely raw, no-cook option built entirely from real whole fruit, ready in minutes with nothing to simmer.",
     1.0, 1.0, "bowl", 312,
     [(*BANANA, 60, "g", "sliced", None, None), (*PINEAPPLE, 60, "g", "diced", None, None),
      (*PAPAYA, 60, "g", "diced", None, None), (*ORANGE, 60, "g", "segmented", None, None),
      (*COCONUT_MILK, 30, "ml", None, None, None)],
     ["Slice or dice all the fruit and arrange it together in a bowl.",
      "Drizzle the coconut milk over the top just before serving."]),
    ("curated_vegan_citrus_avocado_breakfast_bowl", "snack",
     "Citrus Avocado Breakfast Bowl",
     "Sliced avocado with orange and grapefruit segments, a squeeze of lime, and a pinch of salt.",
     "A genuinely savory-leaning, no-cook breakfast built on whole avocado, the one fat source in this batch that scores completely clean for Hashimoto's, unlike any pressed oil.",
     1.0, 1.0, "bowl", 313,
     [(*AVOCADO, 80, "g", "sliced", None, None), (*ORANGE, 60, "g", "segmented", None, None),
      (*GRAPEFRUIT, 60, "g", "segmented", None, None), (*LIME, 0.25, "each", "juiced", None, None),
      (*SALT, 0.125, "tsp", None, None, None)],
     ["Arrange the sliced avocado with the orange and grapefruit segments in a bowl.",
      "Squeeze the lime juice over the top and finish with a pinch of salt."]),
    ("curated_vegan_berry_banana_coconut_smoothie", "snack",
     "Berry Banana Coconut Smoothie",
     "A thick, no-cook smoothie of banana, blueberry, and strawberry blended with coconut milk and a splash of lime.",
     "A genuinely quick option for a busy morning, built entirely from this batch's clean fruit-and-coconut-milk palette.",
     1.0, 1.0, "glass", 314,
     [(*BANANA, 80, "g", None, None, None), (*BLUEBERRY, 50, "g", None, None, None),
      (*STRAWBERRY, 50, "g", None, None, None), (*COCONUT_MILK, 180, "ml", None, None, None),
      (*LIME, 0.25, "each", "juiced", None, None)],
     ["Combine the banana, blueberry, strawberry, coconut milk, and lime juice in a blender.",
      "Blend until smooth, adding a splash more coconut milk if you prefer it thinner.",
      "Pour into a glass and drink right away."]),
    ("curated_vegan_savory_rice_bowl_zucchini_pepper_tomato", "snack",
     "Savory Rice Bowl with Zucchini, Pepper & Tomato",
     "Simmered rice topped with zucchini, bell pepper, and tomato cooked soft in a splash of water, finished with fresh cilantro and lime.",
     "A genuinely savory option built without any oil at all, since every real cooking oil in this app's reference database is flagged for Hashimoto's -- the vegetables are cooked in a splash of water instead, a real, workable technique, not a compromise.",
     1.0, 1.0, "bowl", 315,
     [(*RICE, 45, "g", None, "simmered", None), (*WATER, 150, "ml", None, None, None),
      (*ZUCCHINI, 60, "g", "diced", "sauteed", None), (*RED_BELL_PEPPER, 40, "g", "diced", "sauteed", None),
      (*TOMATO, 50, "g", "diced", None, None), (*CILANTRO, 5, "g", "chopped", None, None),
      (*LIME, 0.25, "each", "juiced", None, None), (*SALT, 0.25, "tsp", None, None, None)],
     ["Combine the rice and filtered water in a saucepan, bring to a boil, then cover and simmer for 30-35 minutes, until tender.",
      "Meanwhile, cook the zucchini and bell pepper in a splash of water in a covered pan over medium heat for 5-7 minutes, until soft, adding a little more water if the pan gets dry.",
      "Stir in the diced tomato and cook 1-2 minutes more, just until warmed through.",
      "Spoon the vegetables over the rice, finish with the cilantro, lime juice, and salt."]),
    ("curated_vegan_savory_polenta_leeks_tomato", "snack",
     "Savory Polenta with Leeks & Tomato",
     "Smooth water-based polenta topped with leeks and tomato cooked soft, finished with fresh cilantro and lime.",
     "A genuinely different savory grain base from the rice bowl in this same batch, still built entirely without any pressed oil.",
     1.0, 1.0, "bowl", 316,
     [(*CORNMEAL, 40, "g", None, "simmered", None), (*WATER, 180, "ml", None, None, None),
      (*LEEK, 50, "g", "sliced", "sauteed", None), (*TOMATO, 50, "g", "diced", None, None),
      (*CILANTRO, 5, "g", "chopped", None, None), (*LIME, 0.25, "each", "juiced", None, None),
      (*SALT, 0.25, "tsp", None, None, None)],
     ["Whisk the cornmeal into the filtered water in a saucepan and bring to a gentle simmer, whisking often to prevent lumps.",
      "Cook for 8-10 minutes, until thick and smooth, and season with half the salt.",
      "Meanwhile, cook the sliced leek in a splash of water in a covered pan over medium heat for 6-8 minutes, until soft.",
      "Stir in the diced tomato and cook 1-2 minutes more, just until warmed through.",
      "Spoon the leek and tomato over the polenta, finish with the cilantro, lime juice, and remaining salt."]),
    ("curated_vegan_zucchini_fennel_hash_avocado", "snack",
     "Zucchini & Fennel Breakfast Hash with Avocado",
     "Zucchini and fennel cooked soft with tomato, topped with sliced avocado, cilantro, and lime.",
     "A genuinely different vegetable combination from this batch's other savory dishes, with real sliced avocado standing in for the richness a pressed oil would normally add.",
     1.0, 1.0, "plate", 317,
     [(*ZUCCHINI, 70, "g", "diced", "sauteed", None), (*FENNEL, 50, "g", "sliced", "sauteed", None),
      (*TOMATO, 40, "g", "diced", None, None), (*AVOCADO, 50, "g", "sliced", None, None),
      (*CILANTRO, 5, "g", "chopped", None, None), (*LIME, 0.25, "each", "juiced", None, None),
      (*SALT, 0.25, "tsp", None, None, None)],
     ["Cook the zucchini and fennel in a splash of water in a covered pan over medium heat for 7-9 minutes, until soft, adding a little more water if the pan gets dry.",
      "Stir in the diced tomato and cook 1-2 minutes more, just until warmed through, then season with the salt.",
      "Transfer to a plate and top with the sliced avocado, cilantro, and a squeeze of lime."]),
    # 2026-08-26, same-day follow-up: the first 18 brought Hashimoto's-
    # vegan-breakfast coverage from 5 to 24 (confirmed via scripts/
    # audit_meal_plan_recipe_coverage.js), a real improvement but still
    # short of the 30-minimum bar. These 8 close the remaining gap using
    # the exact same verified-clean palette above -- no new ingredient
    # needed checking, every one of these was already confirmed clean.
    ("curated_vegan_cranberry_orange_oatmeal", "snack",
     "Cranberry Orange Oatmeal",
     "Coconut-milk oatmeal finished with fresh cranberries and orange segments.",
     "Cranberry's tartness against orange's sweetness gives this oatmeal a genuinely different flavor from this batch's other fruit pairings.",
     1.0, 1.0, "bowl", 318,
     [(*OATS, 40, "g", None, "simmered", None), (*COCONUT_MILK, 150, "ml", None, None, None),
      (*CRANBERRY, 40, "g", None, None, None), (*ORANGE, 50, "g", "segmented", None, None),
      (*MAPLE_SYRUP, 5, "g", None, None, "optional")],
     ["Combine the oats and coconut milk in a small saucepan and bring to a gentle simmer.",
      "Cook, stirring occasionally, for 5-7 minutes, until thick and creamy, stirring in the cranberries during the last 2 minutes so they soften.",
      "Top with the fresh orange segments and a drizzle of maple syrup if using."]),
    ("curated_vegan_papaya_lime_smoothie_bowl", "snack",
     "Papaya Lime Smoothie Bowl",
     "A thick, no-cook smoothie bowl of papaya and banana blended with coconut milk and fresh lime.",
     "A genuinely different fruit base from this batch's berry-forward smoothie, ready in minutes with nothing to cook.",
     1.0, 1.0, "bowl", 319,
     [(*PAPAYA, 100, "g", None, None, None), (*BANANA, 60, "g", None, None, None),
      (*COCONUT_MILK, 120, "ml", None, None, None), (*LIME, 0.25, "each", "juiced", None, None)],
     ["Combine the papaya, banana, coconut milk, and lime juice in a blender.",
      "Blend until smooth and thick, adding a splash more coconut milk if needed.",
      "Pour into a bowl and eat with a spoon."]),
    ("curated_vegan_cantaloupe_grapefruit_breakfast_bowl", "snack",
     "Cantaloupe & Grapefruit Breakfast Bowl",
     "A no-cook bowl of fresh cantaloupe and grapefruit with a squeeze of lime.",
     "A genuinely light, refreshing option built entirely from real whole fruit, with no grain or coconut milk at all.",
     1.0, 1.0, "bowl", 320,
     [(*CANTALOUPE, 100, "g", "diced", None, None), (*GRAPEFRUIT, 80, "g", "segmented", None, None),
      (*LIME, 0.25, "each", "juiced", None, None)],
     ["Combine the diced cantaloupe and grapefruit segments in a bowl.",
      "Squeeze the lime juice over the top just before serving."]),
    ("curated_vegan_apple_rice_pudding_cinnamon", "snack",
     "Apple Rice Pudding with Cinnamon",
     "Creamy coconut-milk rice pudding with diced apple and cinnamon stirred through.",
     "A genuinely different fruit pairing from this batch's other rice puddings, apple and cinnamon a classic, simple combination.",
     1.0, 1.0, "bowl", 321,
     [(*RICE, 35, "g", None, "simmered", None), (*COCONUT_MILK, 250, "ml", None, None, None),
      (*APPLE, 70, "g", "diced small", None, None), (*CINNAMON, 0.5, "tsp", None, None, None),
      (*MAPLE_SYRUP, 5, "g", None, None, "optional")],
     ["Combine the rice and coconut milk in a saucepan and bring to a gentle simmer.",
      "Cook uncovered, stirring often, for 30-35 minutes, until the rice is fully tender and the mixture is thick and creamy, stirring in the apple and cinnamon during the last 10 minutes.",
      "Drizzle with maple syrup if using, and serve warm or chilled."]),
    ("curated_vegan_date_sorghum_porridge", "snack",
     "Date Sorghum Porridge",
     "Whole-grain sorghum simmered in coconut milk with chopped dates and cinnamon.",
     "A genuinely different sweetener direction from this batch's other sorghum porridge, real dates doing most of the sweetening.",
     1.0, 1.0, "bowl", 322,
     [(*SORGHUM, 45, "g", None, "simmered", None), (*COCONUT_MILK, 180, "ml", None, None, None),
      (*DATE, 30, "g", "chopped", None, None), (*CINNAMON, 0.25, "tsp", None, None, None)],
     ["Combine the sorghum and coconut milk in a saucepan and bring to a gentle simmer.",
      "Cover and cook for 40-45 minutes, stirring occasionally and adding a splash of water if it gets too thick, until the sorghum is tender.",
      "Stir in the chopped dates and cinnamon during the last 5 minutes, so the dates soften slightly."]),
    ("curated_vegan_savory_fennel_tomato_rice_bowl", "snack",
     "Savory Fennel & Tomato Rice Bowl",
     "Simmered rice topped with fennel and tomato cooked soft in a splash of water, finished with fresh cilantro and lime.",
     "A genuinely different savory vegetable pairing from this batch's other rice bowl, still built entirely without any pressed oil.",
     1.0, 1.0, "bowl", 323,
     [(*RICE, 45, "g", None, "simmered", None), (*WATER, 150, "ml", None, None, None),
      (*FENNEL, 60, "g", "sliced", "sauteed", None), (*TOMATO, 50, "g", "diced", None, None),
      (*CILANTRO, 5, "g", "chopped", None, None), (*LIME, 0.25, "each", "juiced", None, None),
      (*SALT, 0.25, "tsp", None, None, None)],
     ["Combine the rice and filtered water in a saucepan, bring to a boil, then cover and simmer for 30-35 minutes, until tender.",
      "Meanwhile, cook the fennel in a splash of water in a covered pan over medium heat for 6-8 minutes, until soft, adding a little more water if the pan gets dry.",
      "Stir in the diced tomato and cook 1-2 minutes more, just until warmed through.",
      "Spoon the vegetables over the rice, finish with the cilantro, lime juice, and salt."]),
    ("curated_vegan_pear_ginger_overnight_oats", "snack",
     "Pear Ginger Overnight Oats",
     "No-cook overnight oats soaked in coconut milk with fresh ginger and diced pear.",
     "A genuinely different overnight-oats flavor from this batch's date-and-cinnamon version, fresh ginger giving it real warmth without needing any of the spices flagged for Hashimoto's in this app's reference database.",
     1.0, 1.0, "jar", 324,
     [(*OATS, 40, "g", None, None, None), (*COCONUT_MILK, 130, "ml", None, None, None),
      (*PEAR, 60, "g", "diced", None, None), (*GINGER, 2, "g", "grated", None, None)],
     ["Combine the oats, coconut milk, diced pear, and grated ginger in a jar or container.",
      "Stir well, cover, and refrigerate overnight (at least 6 hours).",
      "Stir again before eating; add a splash more coconut milk if you prefer it looser."]),
    ("curated_vegan_blackberry_lime_rice_pudding", "snack",
     "Blackberry Lime Rice Pudding",
     "Creamy coconut-milk rice pudding topped with fresh blackberries and a squeeze of lime.",
     "A genuinely different berry pairing from this batch's other rice puddings, lime brightening the blackberries' natural tartness.",
     1.0, 1.0, "bowl", 325,
     [(*RICE, 35, "g", None, "simmered", None), (*COCONUT_MILK, 250, "ml", None, None, None),
      (*BLACKBERRY, 60, "g", None, None, None), (*LIME, 0.25, "each", "juiced", None, None),
      (*MAPLE_SYRUP, 5, "g", None, None, "optional")],
     ["Combine the rice and coconut milk in a saucepan and bring to a gentle simmer.",
      "Cook uncovered, stirring often, for 30-35 minutes, until the rice is fully tender and the mixture is thick and creamy.",
      "Stir in the lime juice, top with the fresh blackberries, and drizzle with maple syrup if using."]),
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

    # Real intermediate JSON dump for generate_hashimotos_vegan_breakfast_
    # recipes_ts.js to read -- kept out of git (a derived file, regenerated
    # by this same script every time it runs), same reasoning as every
    # other scripts/_*.json intermediate in this project.
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
    json_path = Path(__file__).resolve().parent / "_hashimotos_vegan_breakfast_data.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2)
    print(f"Wrote {len(out)} recipes to {json_path}")


if __name__ == "__main__":
    main()
