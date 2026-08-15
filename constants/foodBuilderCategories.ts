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
// - 'Brewing' (added 2026-08-02, split out of Bev per explicit request):
//   dry, not-yet-brewed tea/coffee-type products (instant powder, granules,
//   ground tea) -- you brew a drink FROM these, they aren't the drink
//   itself, unlike everything else still in Bev. Beverage Builder needs it
//   for the obvious reason (making a cup of tea/coffee); Fermentation
//   Builder needs it too since kombucha is literally brewed FROM tea.
// 'PantryStaples' (2026-08-03) is included in every builder below that
// already included 'Herbs' -- these dry, functional cooking ingredients
// (baking powder, gelatine, agar-agar, Konjac powder, etc.) used to be
// reachable through wherever they happened to sit (mostly Herbs, some
// Baked/Meat/Algae/Mixed), and every one of those homes was already in
// every builder's own allowlist. Adding the new category everywhere Herbs
// already was preserves that same reachability rather than silently
// making these ingredients unfindable in any builder that used them before.
// 'PastaNoodles' (2026-08-04) follows the identical logic against 'Grain'
// instead: pasta/noodles used to live almost entirely in Grain (204 of
// 204 distinct products), so it's added to exactly the builders that
// already had Grain -- Side, Salad, Fermentation, Snack, Baked Goods,
// Soup -- and skipped for the three that never had Grain (Smoothie,
// Beverage, Sauces), which never offered pasta before either.
// 'SaucesCondiments' (2026-08-04) is included in every builder below,
// same as PantryStaples -- these are exactly the kind of ingredient
// (ketchup, mustard, soy sauce, gravy, dressing, vinegar) any of the nine
// builders could plausibly reach for, and until this category existed
// they'd all been unreachable everywhere, sitting miscategorized in
// Mixed (excluded from every allowlist). See CATEGORY_DISPLAY_LABELS in
// FoodLookup.tsx and build_food_reference_db.py's own CATEGORY_OVERRIDES
// comment for what moved into it and why.
export const SIDE_BUILDER_CATEGORIES = [
  'Veg', 'Fruit', 'Grain', 'PastaNoodles', 'Legume', 'NutSeed', 'Fats', 'Herbs', 'PantryStaples', 'SaucesCondiments', 'Dairy', 'Meat', 'Mushroom', 'Sprouts', 'Algae', 'Baked',
];

export const SALAD_BUILDER_CATEGORIES = [
  'Veg', 'Fruit', 'Grain', 'PastaNoodles', 'Legume', 'NutSeed', 'Fats', 'Herbs', 'PantryStaples', 'SaucesCondiments', 'Dairy', 'Meat', 'Mushroom', 'Sprouts', 'Algae',
];

export const SMOOTHIE_BUILDER_CATEGORIES = [
  'Fruit', 'Veg', 'Dairy', 'NutSeed', 'Bev', 'SupplementPowder', 'Sweets', 'Herbs', 'PantryStaples', 'SaucesCondiments',
];

export const FERMENTATION_BUILDER_CATEGORIES = [
  'Veg', 'Fruit', 'Dairy', 'Grain', 'PastaNoodles', 'Legume', 'Bev', 'Brewing', 'Alcohol', 'Herbs', 'PantryStaples', 'SaucesCondiments', 'Sweets',
];

// 'Veg' added 2026-08-13, direct report -- Beverage Builder's own new
// subtype picker's Juices & Nectars option explicitly names "pressed
// fruits, VEGETABLES, and simple liquid blends," and Veg was never in this
// list at all until now (confirmed real, visible juicing vegetables exist
// -- carrot, beet, celery, cucumber). Added here too, not just to that
// one subtype's own narrower scoping (components/BeverageBuilder.tsx's
// own BEVERAGE_SUBTYPE_CONFIG), so editing an already-saved beverage has
// the same real access a fresh one now does.
export const BEVERAGE_BUILDER_CATEGORIES = [
  'Bev', 'Brewing', 'Alcohol', 'SupplementPowder', 'Fruit', 'Veg', 'Herbs', 'PantryStaples', 'SaucesCondiments', 'Dairy', 'Sweets', 'NutSeed',
];

export const SNACK_BUILDER_CATEGORIES = [
  'Fruit', 'Veg', 'NutSeed', 'Grain', 'PastaNoodles', 'Dairy', 'Meat', 'Legume', 'Sweets', 'Baked', 'Fats', 'Herbs', 'PantryStaples', 'SaucesCondiments', 'Mushroom',
];

export const BAKED_GOODS_BUILDER_CATEGORIES = [
  'Grain', 'PastaNoodles', 'Baked', 'Dairy', 'Fats', 'Sweets', 'NutSeed', 'Fruit', 'Herbs', 'PantryStaples', 'SaucesCondiments', 'Legume',
];

export const SOUP_BUILDER_CATEGORIES = [
  'Veg', 'Meat', 'Grain', 'PastaNoodles', 'Legume', 'Dairy', 'Fats', 'Herbs', 'PantryStaples', 'SaucesCondiments', 'Mushroom', 'NutSeed', 'Sprouts', 'Algae', 'Fruit', 'Alcohol',
];

export const SAUCES_BUILDER_CATEGORIES = [
  'Fats', 'Dairy', 'Fruit', 'Veg', 'Herbs', 'PantryStaples', 'SaucesCondiments', 'Sweets', 'Alcohol', 'NutSeed', 'Legume',
];

// Handhelds (sandwiches, wraps, burgers, tacos), 2026-08-04 -- the
// eleventh builder, covering all four the same way ("outer casing ->
// primary protein -> toppings -> condiment/spread" is the same real
// assembly logic for all of them). Deliberately mirrors
// SIDE_BUILDER_CATEGORIES exactly rather than a narrower hand-picked
// list: a sandwich/wrap/burger/taco can genuinely draw on almost any real
// food category as an ingredient (Baked for bread/buns, Grain for
// tortillas/rice paper, Meat/Legume/NutSeed for protein (Fish merged into
// Meat/"Animal Protein" 2026-08-05, see lib/db.ts's own comment), Fats/Dairy/
// SaucesCondiments for spreads and condiments, Veg/Fruit/Mushroom/Sprouts/
// Algae for toppings), the same "deliberately generous" reasoning this
// whole file already documents at its own top. Alcohol/Bev/Brewing/
// Sweets/SupplementPowder/CommercialPremade excluded, same as Side.
export const HANDHELDS_BUILDER_CATEGORIES = [
  'Veg', 'Fruit', 'Grain', 'PastaNoodles', 'Legume', 'NutSeed', 'Fats', 'Herbs', 'PantryStaples', 'SaucesCondiments', 'Dairy', 'Meat', 'Mushroom', 'Sprouts', 'Algae', 'Baked',
];

// Dessert (sweets, baked treats, custards, frozen/chilled desserts,
// 2026-08-14, the twelfth builder). Deliberately generous, same standard as
// every other builder above: Sweets is the obvious core (sugar, chocolate,
// candy); Baked covers pie crusts/pastry bases; Dairy covers milk/cream/
// butter/eggs (eggs are filed under Dairy in this database, see the
// 2026-08-02 chicken-egg-labeling work); Fats covers butter/oil where it
// isn't already under Dairy; NutSeed covers nuts/seeds/nut butters used as
// toppings or ground into a base; Fruit and Veg both included -- fruit is
// obvious, but so is Veg (carrot cake, pumpkin pie, beet-based red velvet
// are all real, common desserts built from real vegetables); Grain covers
// flours/oats/rice used in puddings and baked bases; Herbs covers spices
// and extracts (vanilla, cinnamon, nutmeg all live there, same category
// convention as every other builder); PantryStaples covers gelatine/agar-
// agar/baking powder/cornstarch, real functional-setting ingredients a
// custard or jelly-style dessert genuinely needs; SaucesCondiments covers
// chocolate/caramel/fruit sauces and honey used as a topping or drizzle;
// Legume covers a real, if less obvious, dessert tradition (red bean
// paste, chickpea-flour barfi, black bean brownies); Alcohol covers real
// boozy desserts (rum cake, tiramisu, bourbon pecan pie, brandy-soaked
// fruitcake) -- the reason this builder also gets the same alcohol
// calculator/advisory every other Alcohol-including builder already has;
// Brewing covers dry cocoa/instant-coffee/espresso powder (mocha and
// tiramisu-style flavoring); Bev covers a real brewed-liquid ingredient
// (coffee, tea) some of those same desserts actually call for, and is also
// what brings the juice/coffee GeneralHealthAdvisories rules into scope
// here the same way it does for Beverage/Fermentation/Smoothie Builder.
// PastaNoodles/Mushroom/Sprouts/Meat/SupplementPowder/CommercialPremade are
// all deliberately excluded -- none of them have a real, common place in a
// dessert.
export const DESSERT_BUILDER_CATEGORIES = [
  'Sweets', 'Baked', 'Dairy', 'Fats', 'NutSeed', 'Fruit', 'Veg', 'Grain', 'Herbs', 'PantryStaples', 'SaucesCondiments', 'Legume', 'Alcohol', 'Brewing', 'Bev',
];
