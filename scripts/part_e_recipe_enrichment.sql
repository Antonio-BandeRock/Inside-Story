-- 2026-08-15, real reference-database patch (Part E of the Nutrient-trend
-- pass) -- direct feedback: "the meals you created are very lacking...
-- extremely minimal... I want this to be as if we are trying very hard to
-- include all of the colors of the rainbow." Investigated real, current
-- curated_recipes/curated_recipe_ingredients content via sqlite3.exe before
-- writing anything (not assumed): most recipes (salads, smoothies, soups,
-- sauces, handhelds, baked goods, snacks) already carry genuine, colorful
-- variety; the two yogurt/kombucha/sauerkraut fermentations are correctly
-- minimal (real strain data lives in curated_recipe_strains, not here, and
-- a plain yogurt genuinely is just milk + culture). The real, confirmed gap
-- was the Side builder's own 4 recipes -- every one is a single vegetable
-- plus oil/garlic/seasoning, exactly the "stir fried veggies can contain
-- several items in it" example named directly. Every ingredient below was
-- checked against a real, currently-visible (hidden=0) foods row before
-- being written in, same discipline as every prior reference-database
-- change in this project.

BEGIN TRANSACTION;

-- Enrichment 1: broccoli side -> a real, colorful roasted vegetable medley
-- (broccoli=green, carrot=orange, red bell pepper=red), not just broccoli
-- with seasoning.
UPDATE curated_recipes
SET name = 'Lemon Garlic Roasted Vegetable Medley',
    flavor_profile = 'Bright, garlicky, with a little char at the edges from roasting -- broccoli, carrot, and red bell pepper together, not just one vegetable.',
    health_benefit = 'Cruciferous fiber and vitamin C from the broccoli, beta-carotene from the carrot, and vitamin C from the bell pepper -- three real, differently-colored vegetables roasted together instead of one.'
WHERE id = 'curated_side_lemon_garlic_broccoli';

INSERT INTO curated_recipe_ingredients (recipe_id, category, base_name, quantity, unit, cut_prep, cooking_method, prep_note, sort_order) VALUES
  ('curated_side_lemon_garlic_broccoli', 'Veg', 'Carrot', 100.0, 'g', 'sliced', 'Roasted', NULL, 5),
  ('curated_side_lemon_garlic_broccoli', 'Veg', 'Red Bell Pepper', 100.0, 'g', 'sliced', 'Roasted', NULL, 6);

-- Enrichment 2: herb-roasted potatoes -> a real root-vegetable medley
-- (potato=tan, sweet potato=orange, onion), not just one root vegetable.
UPDATE curated_recipes
SET name = 'Herb-Roasted Root Vegetable Medley',
    flavor_profile = 'Crispy on the outside, tender inside, finished with rosemary and garlic -- potato and sweet potato roasted together with onion, not just one root vegetable.',
    health_benefit = 'Potassium and vitamin C from the potato and sweet potato alike (especially with skins left on), plus real beta-carotene from the sweet potato specifically -- a genuinely different nutrient profile than potato alone.'
WHERE id = 'curated_side_herb_roasted_potatoes';

INSERT INTO curated_recipe_ingredients (recipe_id, category, base_name, quantity, unit, cut_prep, cooking_method, prep_note, sort_order) VALUES
  ('curated_side_herb_roasted_potatoes', 'Veg', 'Sweet potato', 150.0, 'g', 'diced', 'Roasted', NULL, 6),
  ('curated_side_herb_roasted_potatoes', 'Veg', 'Onion', 60.0, 'g', 'sliced', 'Roasted', NULL, 7);

-- New recipe: a real, genuinely colorful stir-fry -- the direct, literal
-- answer to "stir fried veggies can contain several items in it."
INSERT INTO curated_recipes (id, builder_type, name, flavor_profile, health_benefit, servings, serving_size_amount, serving_size_unit, sort_order) VALUES
  ('curated_side_rainbow_stir_fry', 'side', 'Rainbow Stir-Fried Vegetables',
   'Fast, crisp-tender, and genuinely colorful -- broccoli, carrot, red and yellow bell pepper, and green beans, all in one pan with garlic, ginger, and soy sauce.',
   'Six real, differently-colored vegetables in one dish means a real spread of the vitamins/antioxidants each color tends to carry (green cruciferous fiber, orange beta-carotene, red and yellow vitamin C), not just whatever one vegetable happened to be on hand.',
   4.0, 1.0, 'cup', 5);

INSERT INTO curated_recipe_ingredients (recipe_id, category, base_name, quantity, unit, cut_prep, cooking_method, prep_note, sort_order) VALUES
  ('curated_side_rainbow_stir_fry', 'Veg', 'Broccoli', 150.0, 'g', 'chopped into florets', 'Stir-fried', NULL, 0),
  ('curated_side_rainbow_stir_fry', 'Veg', 'Carrot', 100.0, 'g', 'sliced', 'Stir-fried', NULL, 1),
  ('curated_side_rainbow_stir_fry', 'Veg', 'Red Bell Pepper', 100.0, 'g', 'sliced', 'Stir-fried', NULL, 2),
  ('curated_side_rainbow_stir_fry', 'Veg', 'Yellow Bell Pepper', 100.0, 'g', 'sliced', 'Stir-fried', NULL, 3),
  ('curated_side_rainbow_stir_fry', 'Veg', 'Snap Beans (Green Beans)', 100.0, 'g', 'trimmed', 'Stir-fried', NULL, 4),
  ('curated_side_rainbow_stir_fry', 'Veg', 'Onion', 60.0, 'g', 'sliced', 'Stir-fried', NULL, 5),
  ('curated_side_rainbow_stir_fry', 'Veg', 'Garlic', 8.0, 'g', 'minced', NULL, NULL, 6),
  ('curated_side_rainbow_stir_fry', 'Veg', 'Ginger, peeled, fresh', 8.0, 'g', 'minced', NULL, NULL, 7),
  ('curated_side_rainbow_stir_fry', 'Legume', 'Soy sauce made from soy and wheat (shoyu)', 30.0, 'ml', NULL, NULL, NULL, 8),
  ('curated_side_rainbow_stir_fry', 'NutSeed', 'Sesame seed', 8.0, 'g', NULL, NULL, 'as a finishing garnish', 9);

-- Real curated dessert recipes -- confirmed via direct query that zero
-- exist for builder_type='dessert' despite DessertBuilder.tsx (the app's
-- own 12th builder, shipped 2026-08-14) already having its own real "Or
-- Start From a Recipe" section wired up and waiting. Both real,
-- whole-food-forward desserts (fruit/nuts/spice, not candy), matching this
-- app's own already-established "home cooking over commercial/branded
-- products" direction.
INSERT INTO curated_recipes (id, builder_type, name, flavor_profile, health_benefit, servings, serving_size_amount, serving_size_unit, sort_order) VALUES
  ('curated_dessert_baked_cinnamon_apples', 'dessert', 'Baked Cinnamon Apples',
   'Warm, soft, and cinnamon-sweet, with a real crunch from the walnuts on top -- a real fruit dessert, not a pastry.',
   'Real fruit fiber from the apple itself, plus real omega-3 fat and protein from the walnuts -- sweetened with a small amount of honey rather than refined sugar.',
   4.0, 1.0, 'apple', 0),
  ('curated_dessert_mixed_berry_chia_pudding', 'dessert', 'Mixed Berry Chia Pudding',
   'Creamy and just barely sweet, with real whole berries folded through it -- closer to a real fruit-and-seed pudding than a sugary dessert.',
   'Chia seeds bring real omega-3 fat and fiber, and three real, differently-colored berries (blueberry, strawberry, raspberry) each carry their own real antioxidant profile.',
   4.0, 0.5, 'cup', 1);

INSERT INTO curated_recipe_ingredients (recipe_id, category, base_name, quantity, unit, cut_prep, cooking_method, prep_note, sort_order) VALUES
  ('curated_dessert_baked_cinnamon_apples', 'Fruit', 'Apple', 600.0, 'g', 'cored and sliced', 'Baked', NULL, 0),
  ('curated_dessert_baked_cinnamon_apples', 'Herbs', 'Cinnamon, dried, ground', 3.0, 'g', NULL, NULL, NULL, 1),
  ('curated_dessert_baked_cinnamon_apples', 'NutSeed', 'Walnut', 60.0, 'g', 'chopped', NULL, 'as a finishing topping', 2),
  ('curated_dessert_baked_cinnamon_apples', 'Sweets', 'Honeydew honey (Forest Honey)', 30.0, 'g', NULL, NULL, NULL, 3),
  ('curated_dessert_baked_cinnamon_apples', 'Fats', 'Butter, plain, salted', 15.0, 'g', NULL, NULL, NULL, 4);

INSERT INTO curated_recipe_ingredients (recipe_id, category, base_name, quantity, unit, cut_prep, cooking_method, prep_note, sort_order) VALUES
  ('curated_dessert_mixed_berry_chia_pudding', 'NutSeed', 'Chia seeds', 60.0, 'g', NULL, NULL, NULL, 0),
  ('curated_dessert_mixed_berry_chia_pudding', 'NutSeed', 'Almond drink unsweetened', 500.0, 'ml', NULL, NULL, 'as the liquid base', 1),
  ('curated_dessert_mixed_berry_chia_pudding', 'Herbs', 'Vanilla extract', 5.0, 'ml', NULL, NULL, NULL, 2),
  ('curated_dessert_mixed_berry_chia_pudding', 'Sweets', 'Honeydew honey (Forest Honey)', 20.0, 'g', NULL, NULL, NULL, 3),
  ('curated_dessert_mixed_berry_chia_pudding', 'Fruit', 'Blueberry', 75.0, 'g', 'whole', NULL, NULL, 4),
  ('curated_dessert_mixed_berry_chia_pudding', 'Fruit', 'Strawberry', 75.0, 'g', 'sliced', NULL, NULL, 5),
  ('curated_dessert_mixed_berry_chia_pudding', 'Fruit', 'Raspberry', 75.0, 'g', 'whole', NULL, NULL, 6);

COMMIT;
