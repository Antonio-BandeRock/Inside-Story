-- 2026-08-27: real ingredient-reference fix, not a prep-method override
-- alone -- these 9 recipes were referencing an under-specified legume
-- base_name (e.g. "Lentil, green, hulled, dry", "Chickpea", "Lima Bean")
-- that has no real cooked/raw variant to redirect to at all in this
-- database. A richer base_name for the identical real food ("Lentils",
-- "Chickpeas (garbanzo beans, bengal gram)", "Lima beans, large")
-- already exists elsewhere in this app's own recipes and DOES carry a
-- real Boiled/Canned variant, confirmed directly to score Lectins
-- (Legumes) as Mild Risk (yellow) instead of High Risk (red) once
-- resolved that way. Every one of these dishes is a soup, stew,
-- meatball, meatloaf, or salad that genuinely cooks (or uses canned)
-- legumes -- confirmed against each recipe's own real instructions
-- before touching anything, not assumed from the dish name alone.
UPDATE curated_recipe_ingredients SET base_name = 'Lentils', cooking_method = 'Simmered'
WHERE recipe_id = 'curated_soup_red_lentil' AND base_name = 'Lentil, red, hulled, dry';

UPDATE curated_recipe_ingredients SET base_name = 'Lentils', cooking_method = 'Simmered'
WHERE recipe_id = 'curated_soup_green_lentil_vegetable_stew' AND base_name = 'Lentil, green, hulled, dry';

UPDATE curated_recipe_ingredients SET base_name = 'Lentils', cooking_method = 'Simmered'
WHERE recipe_id = 'curated_soup_lentil_kale_soup' AND base_name = 'Lentil, red, hulled, dry';

UPDATE curated_recipe_ingredients SET base_name = 'Lentils', cooking_method = 'Simmered'
WHERE recipe_id = 'curated_side_lentil_roasted_vegetable_tahini_bowl' AND base_name = 'Lentil, green, hulled, dry';

UPDATE curated_recipe_ingredients SET base_name = 'Lentils', cooking_method = 'Simmered'
WHERE recipe_id = 'curated_vegan_side_lentil_meatloaf_parsnip_carrot' AND base_name = 'Lentil, green, hulled, dry';

UPDATE curated_recipe_ingredients SET base_name = 'Lentils', cooking_method = 'Simmered'
WHERE recipe_id = 'curated_vegan_side_lentil_walnut_meatballs_tomato_sauce' AND base_name = 'Lentil, green, hulled, dry';

UPDATE curated_recipe_ingredients SET base_name = 'Lentils', cooking_method = 'Simmered'
WHERE recipe_id = 'curated_vegan_soup_lentil_black_bean_chili' AND base_name = 'Lentil, green, hulled, dry';

UPDATE curated_recipe_ingredients SET base_name = 'Chickpeas (garbanzo beans, bengal gram)', cooking_method = 'Canned'
WHERE recipe_id = 'curated_salad_mediterranean_chickpea_feta' AND base_name = 'Chickpea';

UPDATE curated_recipe_ingredients SET base_name = 'Lima beans, large', cooking_method = 'Canned'
WHERE recipe_id = 'curated_salad_lima_bean_roasted_vegetable_salad' AND base_name = 'Lima Bean';
