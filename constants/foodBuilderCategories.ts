// Curated per-builder subsets of the reference database's own 19 raw food
// category codes -- 2026-08-02, passed as FoodLookup's `allowedCategories`
// prop so each Food-tab builder only ever offers categories someone would
// actually put in that kind of dish (Beverage Builder never shows raw Meat;
// Side Builder never shows Alcohol), rather than every builder sharing the
// exact same unfiltered 19-category list regardless of what it builds.
//
// A shared file rather than each builder keeping its own local copy (unlike
// e.g. each builder's own COOKING_METHODS list, which deliberately stays
// per-file since those genuinely diverge builder to builder) -- this is a
// single food-taxonomy decision, not builder-specific cooking mechanics, so
// one source of truth is more maintainable than nine copies drifting apart.
//
// Deliberately generous, not minimal: a category is included if a real,
// common version of that builder's dish could plausibly draw from it, even
// if that's not the typical case (e.g. Alcohol in Soup/Sauces for deglazing
// and wine reductions). Getting one wrong for a real edge case is a one-line
// fix here, not a reason to make every builder see everything.
//
// Real data-quality quirks that shaped a few of these choices, confirmed
// directly against the reference database rather than assumed:
// - There is no separate "Water" category -- plain water only exists under
//   Bev's own "Water" subcategory. Any builder that needs a water base
//   (Beverage, Fermentation for kombucha/water kefir) needs Bev included
//   for that reason alone, not just for tea/coffee/juice.
// - Alcohol exists as both its own standalone category AND a "Bev >
//   Alcoholic" subcategory (overlapping data from different national
//   sources) -- builders that get Alcohol get it as the one category code,
//   which reaches both.
// - Plant milks (almond drink, soy cream alternatives) are inconsistently
//   filed under NutSeed rather than Bev or Dairy in the source data --
//   Beverage Builder includes NutSeed specifically so "almond milk" is
//   actually findable, not because nuts/seeds themselves belong in a drink.
// - SupplementPowder (protein/meal-replacement powders, fiber supplements
//   like psyllium) is its own category, separate from Bev's own "Protein &
//   Meal Replacement" subcategory (which holds the actual powder products) --
//   Smoothie/Beverage Builder get both routes to the same real ingredient.
export const SIDE_BUILDER_CATEGORIES = [
  'Veg', 'Fruit', 'Grain', 'Legume', 'NutSeed', 'Fats', 'Herbs', 'Dairy', 'Meat', 'Fish', 'Mushroom', 'Sprouts', 'Algae', 'Baked',
];

export const SALAD_BUILDER_CATEGORIES = [
  'Veg', 'Fruit', 'Grain', 'Legume', 'NutSeed', 'Fats', 'Herbs', 'Dairy', 'Meat', 'Fish', 'Mushroom', 'Sprouts', 'Algae',
];

export const SMOOTHIE_BUILDER_CATEGORIES = [
  'Fruit', 'Veg', 'Dairy', 'NutSeed', 'Bev', 'SupplementPowder', 'Sweets', 'Herbs',
];

export const FERMENTATION_BUILDER_CATEGORIES = [
  'Veg', 'Fruit', 'Dairy', 'Grain', 'Legume', 'Bev', 'Alcohol', 'Herbs', 'Sweets',
];

export const BEVERAGE_BUILDER_CATEGORIES = [
  'Bev', 'Alcohol', 'SupplementPowder', 'Fruit', 'Herbs', 'Dairy', 'Sweets', 'NutSeed',
];

export const SNACK_BUILDER_CATEGORIES = [
  'Fruit', 'Veg', 'NutSeed', 'Grain', 'Dairy', 'Meat', 'Fish', 'Legume', 'Sweets', 'Baked', 'Fats', 'Herbs', 'Mushroom',
];

export const BAKED_GOODS_BUILDER_CATEGORIES = [
  'Grain', 'Baked', 'Dairy', 'Fats', 'Sweets', 'NutSeed', 'Fruit', 'Herbs', 'Legume',
];

export const SOUP_BUILDER_CATEGORIES = [
  'Veg', 'Meat', 'Fish', 'Grain', 'Legume', 'Dairy', 'Fats', 'Herbs', 'Mushroom', 'NutSeed', 'Sprouts', 'Algae', 'Fruit', 'Alcohol',
];

export const SAUCES_BUILDER_CATEGORIES = [
  'Fats', 'Dairy', 'Fruit', 'Veg', 'Herbs', 'Sweets', 'Alcohol', 'NutSeed', 'Legume',
];
