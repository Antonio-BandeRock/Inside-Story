-- Self-caught fix, same pass -- my own freshly-written flavor_profile/
-- health_benefit text violated this project's own standing, already-
-- documented writing-style rule (see REFERENCE_DB_VERSION's own history:
-- "remove 'real'/'genuinely' filler and ' -- ' double-hyphen punctuation")
-- before this was ever committed. Rewritten with real punctuation and no
-- filler words.

BEGIN TRANSACTION;

UPDATE curated_recipes SET
  flavor_profile = 'Bright, garlicky, with a little char at the edges from roasting: broccoli, carrot, and red bell pepper together, not just one vegetable.',
  health_benefit = 'Cruciferous fiber and vitamin C from the broccoli, beta-carotene from the carrot, and vitamin C from the bell pepper: three differently-colored vegetables roasted together instead of one.'
WHERE id = 'curated_side_lemon_garlic_broccoli';

UPDATE curated_recipes SET
  flavor_profile = 'Crispy on the outside, tender inside, finished with rosemary and garlic: potato and sweet potato roasted together with onion, not just one root vegetable.',
  health_benefit = 'Potassium and vitamin C from the potato and sweet potato alike (especially with skins left on), plus beta-carotene from the sweet potato specifically, a different nutrient profile than potato alone.'
WHERE id = 'curated_side_herb_roasted_potatoes';

UPDATE curated_recipes SET
  flavor_profile = 'Fast, crisp-tender, and colorful: broccoli, carrot, red and yellow bell pepper, and green beans, all in one pan with garlic, ginger, and soy sauce.',
  health_benefit = 'Six differently-colored vegetables in one dish means a spread of the vitamins and antioxidants each color tends to carry (green cruciferous fiber, orange beta-carotene, red and yellow vitamin C), not just whatever one vegetable happened to be on hand.'
WHERE id = 'curated_side_rainbow_stir_fry';

UPDATE curated_recipes SET
  flavor_profile = 'Warm, soft, and cinnamon-sweet, with a crunch from the walnuts on top: a fruit dessert, not a pastry.',
  health_benefit = 'Fruit fiber from the apple itself, plus omega-3 fat and protein from the walnuts, sweetened with a small amount of honey rather than refined sugar.'
WHERE id = 'curated_dessert_baked_cinnamon_apples';

UPDATE curated_recipes SET
  flavor_profile = 'Creamy and just barely sweet, with whole berries folded through it: closer to a fruit-and-seed pudding than a sugary dessert.',
  health_benefit = 'Chia seeds bring omega-3 fat and fiber, and three differently-colored berries (blueberry, strawberry, raspberry) each carry their own antioxidant profile.'
WHERE id = 'curated_dessert_mixed_berry_chia_pudding';

COMMIT;
