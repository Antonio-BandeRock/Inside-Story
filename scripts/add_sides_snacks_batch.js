/* global __dirname */
// 2026-09-19, direct request: "Add more side dishes and snacks."
//
// Sides held 5 recipes and Snacks held 4. Both were content gaps of the same
// class: a band on the System Recipes screen with too little in it to be worth
// opening, and in the case of Sides, a meal-plan pairing pool of five dishes
// that has to cover every diet and all 19 conditions. This batch adds 25 side
// dishes and 20 snacks, taking the two bands to 30 and 24.
//
// THE PALETTE IS VERIFIED, NOT GUESSED. Every (category, base_name) pair below
// was checked two ways before a recipe was written:
//   1. It resolves to a row in `foods` with hidden = 0, so the compute
//      pipeline can score it. An ingredient that does not resolve silently
//      contributes nothing and the recipe gets tagged as if it were absent.
//   2. It was ranked against scripts/_recipe_condition_data_output.json, the
//      shipped pipeline's own output. If a recipe is clean for a condition,
//      every ingredient in it is clean for that condition, so the union over
//      all recipes containing an ingredient is a proven-clean lower bound;
//      and a caution names the ingredient that flagged it, which is a proven
//      dirty signal for that same pair. 55 pairs came back clean for all 19
//      conditions and were never named as a flagger. Those are the core here.
//      Garlic, onion, black pepper, chickpeas, tahini, Greek yogurt and honey
//      sit one condition short of the top and are already load-bearing in
//      dozens of shipped recipes, so they appear where a dish needs them.
//
// Written in Node rather than Python, which every earlier batch used, because
// Python is not installed on this machine. The insert goes through the sqlite3
// CLI in one transaction.
//
// Run: node scripts/add_sides_snacks_batch.js
// Then: node scripts/generate_sides_snacks_recipes_ts.js
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SQLITE = 'C:/Users/TonyR/AppData/Local/Android/Sdk/platform-tools/sqlite3.exe';
const DB = path.join(__dirname, '..', 'assets', 'data', 'foods_reference.db');
const OUT = path.join(__dirname, '_sides_snacks_batch_data.json');

// --- palette ------------------------------------------------------------
const OIL = ['Fats', 'Olive Oil (Extra Virgin)'];
const SALT = ['Herbs', 'Common salt/table salt'];
const PEPPER = ['Herbs', 'Pepper, black, ground'];
const GARLIC = ['Veg', 'Garlic'];
const ONION = ['Veg', 'Onion'];
const LEEK = ['Veg', 'Leek'];
const CARROT = ['Veg', 'Carrot'];
const BROCCOLI = ['Veg', 'Broccoli'];
const CAULIFLOWER = ['Veg', 'Cauliflower'];
const BRUSSELS = ['Veg', 'Brussels sprout'];
const CABBAGE = ['Veg', 'Cabbage'];
const KALE = ['Veg', 'Kale'];
const ZUCCHINI = ['Veg', 'Squash, zucchini'];
const BUTTERNUT = ['Veg', 'Squash, winter, butternut'];
const BEETROOT = ['Veg', 'Beetroot'];
const FENNEL = ['Veg', 'Fennel Bulb'];
const TURNIP = ['Veg', 'Turnip'];
const SWEET_POTATO = ['Veg', 'Sweet potato'];
const GREEN_BEANS = ['Veg', 'Snap Beans (Green Beans)'];
const ASPARAGUS = ['Veg', 'Asparagus'];
const RED_PEPPER = ['Veg', 'Red Bell Pepper'];
const CUCUMBER = ['Veg', 'Cucumber'];
const LEMON = ['Fruit', 'Lemon'];
const LIME = ['Fruit', 'Lime'];
const ORANGE = ['Fruit', 'Orange'];
const APPLE = ['Fruit', 'Apple'];
const PEAR = ['Fruit', 'Pear'];
const BANANA = ['Fruit', 'Banana'];
const DATE = ['Fruit', 'Date'];
const MELON = ['Fruit', 'Cantaloupe Melon'];
const BLUEBERRY = ['Fruit', 'Blueberry'];
const STRAWBERRY = ['Fruit', 'Strawberry'];
const GRAPEFRUIT = ['Fruit', 'Grapefruit'];
const AVOCADO = ['Fruit', 'Avocado'];
const BROWN_RICE = ['Grain', 'Grains, rice, brown, long-grain, dry'];
const WHITE_RICE = ['Grain', 'Rice, long grain, paddy rice, well-milled, raw'];
const CORNMEAL = ['Grain', 'Cornmeal, whole-grain, yellow'];
const SORGHUM = ['Grain', 'Sorghum grain'];
const OATS = ['Grain', 'Oats'];
const CHICKPEAS = ['Legume', 'Chickpeas (garbanzo beans, bengal gram)'];
const LENTILS = ['Legume', 'Lentils'];
const COCONUT_MILK = ['NutSeed', 'Coconut milk'];
const YOGURT = ['Dairy', 'Yogurt, Greek, plain, lowfat'];
const TAHINI = ['SaucesCondiments', 'Tahini'];
const MAPLE = ['Sweets', 'Maple Syrup (100% Pure)'];
const HONEY = ['Sweets', 'Standard Honey (Blossom Honey)'];
const CINNAMON = ['Herbs', 'Spices, cinnamon, ground'];
const GINGER = ['Herbs', 'Ginger root'];
const ROSEMARY = ['Herbs', 'Rosemary'];
const PARSLEY = ['Herbs', 'Parsley Spices'];
const DILL = ['Herbs', 'Fresh Dill Weed'];
const TURMERIC = ['Herbs', 'Turmeric, dried, ground'];
const CIDER_VINEGAR = ['Herbs', 'Vinegar, cider'];
const WATER = ['Bev', 'Water, tap'];

// ingredient: [palette pair, quantity, unit, cutPrep, cookingMethod]
const ing = (pair, quantity, unit, cutPrep, cookingMethod) => ({
  category: pair[0],
  baseName: pair[1],
  quantity,
  unit,
  cutPrep: cutPrep || null,
  cookingMethod: cookingMethod || null,
  prepNote: null,
});

// --- the 25 side dishes -------------------------------------------------
const SIDES = [
  {
    id: 'curated_side_maple_roasted_carrots',
    name: 'Maple Roasted Carrots',
    flavorProfile: 'Sweet and caramelized at the edges, with the maple browning rather than sitting on top.',
    healthBenefit: 'Beta-carotene from the carrots, which the body converts to vitamin A, and a roasting method that needs very little added fat to work.',
    servingSizeAmount: 1.0,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(CARROT, 110, 'g', 'cut into sticks', 'Roasted'),
      ing(OIL, 3.75, 'ml'),
      ing(MAPLE, 5, 'g'),
      ing(SALT, 0.5, 'g'),
      ing(PEPPER, 0.25, 'g'),
    ],
    instructions: [
      'Preheat the oven to 425°F (220°C).',
      'Toss the carrot sticks with the olive oil, maple syrup, salt and pepper until they are evenly coated.',
      'Spread them in a single layer on a baking sheet, leaving space between the pieces so they roast instead of steaming.',
      'Roast for 20 to 25 minutes, turning once halfway through, until the edges are browned and a fork slides in easily.',
    ],
  },
  {
    id: 'curated_side_roasted_brussels_lemon',
    name: 'Roasted Brussels Sprouts with Lemon',
    flavorProfile: 'Nutty and crisp on the cut side, sharpened by lemon juice added off the heat.',
    healthBenefit: 'A cruciferous vegetable with fiber and vitamin K, roasted rather than boiled so the flavor compounds stay in the pan instead of the water.',
    servingSizeAmount: 1.0,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(BRUSSELS, 100, 'g', 'halved', 'Roasted'),
      ing(OIL, 3.75, 'ml'),
      ing(LEMON, 7.5, 'g', 'juiced'),
      ing(SALT, 0.5, 'g'),
      ing(PEPPER, 0.25, 'g'),
    ],
    instructions: [
      'Preheat the oven to 425°F (220°C).',
      'Toss the halved sprouts with the olive oil, salt and pepper.',
      'Lay them cut side down on a baking sheet, which is what gives you the browned face.',
      'Roast for 20 to 24 minutes, until the cut sides are deep brown and the outer leaves have crisped.',
      'Squeeze the lemon juice over them as soon as they come out of the oven.',
    ],
  },
  {
    id: 'curated_side_roasted_butternut_cinnamon',
    name: 'Cinnamon Roasted Butternut Squash',
    flavorProfile: 'Soft and sweet inside, with warm cinnamon and a little salt keeping it from tasting like dessert.',
    healthBenefit: 'One of the densest vitamin A sources in the vegetable aisle, with potassium and fiber alongside it.',
    servingSizeAmount: 1.0,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(BUTTERNUT, 120, 'g', 'cubed', 'Roasted'),
      ing(OIL, 3.75, 'ml'),
      ing(CINNAMON, 0.5, 'g'),
      ing(SALT, 0.5, 'g'),
    ],
    instructions: [
      'Preheat the oven to 400°F (200°C).',
      'Toss the squash cubes with the olive oil, cinnamon and salt.',
      'Spread them on a baking sheet in one layer.',
      'Roast for 25 to 30 minutes, turning once, until the cubes are tender and browned at the corners.',
    ],
  },
  {
    id: 'curated_side_roasted_beets_orange',
    name: 'Roasted Beets with Orange',
    flavorProfile: 'Earthy and sweet, cut through by orange juice and zest stirred in at the end.',
    healthBenefit: 'Beets carry dietary nitrates and folate, and the vitamin C in the orange helps with the iron the beets bring.',
    servingSizeAmount: 1.0,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(BEETROOT, 110, 'g', 'peeled and cubed', 'Roasted'),
      ing(ORANGE, 30, 'g', 'juiced'),
      ing(OIL, 3.75, 'ml'),
      ing(SALT, 0.5, 'g'),
    ],
    instructions: [
      'Preheat the oven to 400°F (200°C).',
      'Toss the beet cubes with the olive oil and salt.',
      'Wrap them loosely in foil or cover the baking dish, so they steam as they roast and stay moist.',
      'Roast for 35 to 40 minutes, until a knife goes through without resistance.',
      'Uncover, pour the orange juice over them, and stir to coat.',
    ],
  },
  {
    id: 'curated_side_roasted_fennel_pepper',
    name: 'Roasted Fennel and Red Pepper',
    flavorProfile: 'The anise edge of raw fennel turns mild and sweet in the oven, and the pepper adds color and juice.',
    healthBenefit: 'Fennel brings fiber and potassium, and red bell pepper is one of the highest vitamin C vegetables by weight.',
    servingSizeAmount: 1.0,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(FENNEL, 75, 'g', 'sliced', 'Roasted'),
      ing(RED_PEPPER, 50, 'g', 'sliced', 'Roasted'),
      ing(OIL, 3.75, 'ml'),
      ing(SALT, 0.5, 'g'),
      ing(PEPPER, 0.25, 'g'),
    ],
    instructions: [
      'Preheat the oven to 425°F (220°C).',
      'Toss the sliced fennel and red pepper with the olive oil, salt and pepper.',
      'Spread them on a baking sheet in one layer.',
      'Roast for 22 to 26 minutes, until the fennel edges have browned and the pepper has softened.',
    ],
  },
  {
    id: 'curated_side_roasted_turnips_rosemary',
    name: 'Rosemary Roasted Turnips',
    flavorProfile: 'Peppery when raw, mellow and faintly sweet once roasted, with rosemary crisping against the cut faces.',
    healthBenefit: 'A lower-starch root than potato, with vitamin C and fiber, useful when you want a roasted root without the carbohydrate load.',
    servingSizeAmount: 1.0,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(TURNIP, 120, 'g', 'peeled and cubed', 'Roasted'),
      ing(OIL, 3.75, 'ml'),
      ing(ROSEMARY, 0.5, 'g', 'chopped'),
      ing(SALT, 0.5, 'g'),
      ing(PEPPER, 0.25, 'g'),
    ],
    instructions: [
      'Preheat the oven to 425°F (220°C).',
      'Toss the turnip cubes with the olive oil, rosemary, salt and pepper.',
      'Spread them on a baking sheet in one layer.',
      'Roast for 25 to 30 minutes, turning once, until the outsides are browned and the middles are soft.',
    ],
  },
  {
    id: 'curated_side_sweet_potato_wedges',
    name: 'Baked Sweet Potato Wedges',
    flavorProfile: 'Crisp along the skin, soft through the middle, salted while still hot.',
    healthBenefit: 'Vitamin A and fiber, with the skin left on, which is where a good share of the fiber sits.',
    servingSizeAmount: 1.0,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(SWEET_POTATO, 130, 'g', 'cut into wedges', 'Baked'),
      ing(OIL, 5, 'ml'),
      ing(SALT, 0.5, 'g'),
      ing(PEPPER, 0.25, 'g'),
    ],
    instructions: [
      'Preheat the oven to 425°F (220°C).',
      'Scrub the sweet potato and cut it into wedges, leaving the skin on.',
      'Toss the wedges with the olive oil and pepper.',
      'Lay them skin side down on a baking sheet and bake for 25 to 30 minutes, until the edges are browned.',
      'Salt them while they are still hot, so it sticks.',
    ],
  },
  {
    id: 'curated_side_roasted_zucchini_garlic',
    name: 'Garlic Roasted Zucchini',
    flavorProfile: 'Browned on the cut faces, garlicky, and light enough to sit beside anything.',
    healthBenefit: 'A high-water, low-calorie vegetable that adds volume to a plate, with potassium and a little vitamin C.',
    servingSizeAmount: 1.0,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(ZUCCHINI, 130, 'g', 'sliced into half moons', 'Roasted'),
      ing(OIL, 3.75, 'ml'),
      ing(GARLIC, 1.5, 'g', 'minced'),
      ing(SALT, 0.5, 'g'),
      ing(PEPPER, 0.25, 'g'),
    ],
    instructions: [
      'Preheat the oven to 425°F (220°C).',
      'Toss the zucchini with the olive oil, garlic, salt and pepper.',
      'Spread the pieces on a baking sheet without overlapping them, or the zucchini will release water and steam.',
      'Roast for 18 to 22 minutes, until the cut faces have browned.',
    ],
  },
  {
    id: 'curated_side_sauteed_kale_lemon',
    name: 'Sautéed Kale with Lemon',
    flavorProfile: 'Softened but still with some chew, garlicky, finished with lemon juice off the heat.',
    healthBenefit: 'Kale carries vitamin K, vitamin C and calcium, and the lemon juice added at the end keeps the vitamin C from cooking away.',
    servingSizeAmount: 1.0,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(KALE, 75, 'g', 'stems removed, torn', 'Sauteed'),
      ing(OIL, 3.75, 'ml'),
      ing(GARLIC, 1.5, 'g', 'minced'),
      ing(LEMON, 7.5, 'g', 'juiced'),
      ing(SALT, 0.5, 'g'),
    ],
    instructions: [
      'Strip the kale leaves off their stems and tear them into pieces.',
      'Warm the olive oil in a wide pan over medium heat and cook the garlic for about 30 seconds, until it smells sweet.',
      'Add the kale and the salt, and turn it with tongs for 4 to 6 minutes, until it has wilted and darkened.',
      'Take the pan off the heat and squeeze the lemon juice over the top.',
    ],
  },
  {
    id: 'curated_side_braised_cabbage_apple',
    name: 'Braised Cabbage with Apple',
    flavorProfile: 'Sweet and slightly tart, cooked down until the cabbage is silky and the apple has gone soft.',
    healthBenefit: 'Cabbage fiber plus apple pectin, a soluble fiber that feeds gut bacteria, in a dish that cooks gently enough to stay easy on digestion.',
    servingSizeAmount: 1.0,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(CABBAGE, 110, 'g', 'shredded', 'Braised'),
      ing(APPLE, 50, 'g', 'diced', 'Braised'),
      ing(WATER, 60, 'ml'),
      ing(OIL, 3.75, 'ml'),
      ing(SALT, 0.5, 'g'),
    ],
    instructions: [
      'Warm the olive oil in a lidded pan over medium heat.',
      'Add the shredded cabbage and the diced apple and stir for 2 minutes to coat them.',
      'Pour in the water, add the salt, and bring it to a simmer.',
      'Cover and cook for 18 to 22 minutes, stirring once or twice, until the cabbage is soft and most of the liquid has gone.',
    ],
  },
  {
    id: 'curated_side_garlicky_green_beans',
    name: 'Garlicky Green Beans',
    flavorProfile: 'Still snappy in the middle, with browned garlic and salt clinging to the outside.',
    healthBenefit: 'Fiber, vitamin K and folate, cooked briefly so the beans keep their texture and their vitamin C.',
    servingSizeAmount: 1.0,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(GREEN_BEANS, 110, 'g', 'trimmed', 'Sauteed'),
      ing(OIL, 3.75, 'ml'),
      ing(GARLIC, 2, 'g', 'sliced'),
      ing(SALT, 0.5, 'g'),
      ing(PEPPER, 0.25, 'g'),
    ],
    instructions: [
      'Trim the stem ends off the beans.',
      'Warm the olive oil in a wide pan over medium-high heat.',
      'Add the beans and cook them for 5 to 7 minutes, shaking the pan, until they are blistered in places and still firm in the middle.',
      'Add the sliced garlic, salt and pepper, and cook for one more minute, until the garlic is golden.',
    ],
  },
  {
    id: 'curated_side_skillet_asparagus_lemon',
    name: 'Skillet Asparagus with Lemon',
    flavorProfile: 'Grassy and bright, cooked just long enough to lose the raw edge.',
    healthBenefit: 'Asparagus carries folate and inulin, a prebiotic fiber that gut bacteria ferment, and it cooks in under five minutes.',
    servingSizeAmount: 1.0,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(ASPARAGUS, 110, 'g', 'trimmed', 'Sauteed'),
      ing(OIL, 3.75, 'ml'),
      ing(LEMON, 7.5, 'g', 'juiced'),
      ing(SALT, 0.5, 'g'),
      ing(PEPPER, 0.25, 'g'),
    ],
    instructions: [
      'Snap or cut the woody ends off the asparagus.',
      'Warm the olive oil in a wide pan over medium-high heat.',
      'Lay the spears in one layer and cook for 4 to 5 minutes, rolling them once, until they are bright green and lightly browned.',
      'Season with the salt and pepper, take the pan off the heat, and squeeze the lemon juice over them.',
    ],
  },
  {
    id: 'curated_side_sauteed_leeks_carrots',
    name: 'Sautéed Leeks and Carrots',
    flavorProfile: 'Gentle and sweet, the leek going soft and silky while the carrot keeps a little bite.',
    healthBenefit: 'Leeks bring prebiotic fructans that feed gut bacteria, and the carrot adds beta-carotene, which absorbs better with the oil present.',
    servingSizeAmount: 1.0,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(LEEK, 70, 'g', 'sliced into rings', 'Sauteed'),
      ing(CARROT, 60, 'g', 'sliced', 'Sauteed'),
      ing(OIL, 3.75, 'ml'),
      ing(WATER, 30, 'ml'),
      ing(SALT, 0.5, 'g'),
    ],
    instructions: [
      'Slice the leek into rings and rinse them well, since grit collects between the layers.',
      'Warm the olive oil in a pan over medium heat and add the leek and carrot.',
      'Cook for 5 minutes, stirring, then add the water and the salt.',
      'Cover and cook for another 6 to 8 minutes, until the leek is soft and the carrot is tender but not mushy.',
    ],
  },
  {
    id: 'curated_side_broccoli_ginger',
    name: 'Ginger Skillet Broccoli',
    flavorProfile: 'Warm ginger against bright green broccoli, cooked fast so the florets stay firm.',
    healthBenefit: 'Broccoli is a source of sulforaphane precursors and vitamin C, and a short cook keeps more of both than boiling does.',
    servingSizeAmount: 1.0,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(BROCCOLI, 110, 'g', 'cut into florets', 'Sauteed'),
      ing(OIL, 3.75, 'ml'),
      ing(GINGER, 3, 'g', 'grated'),
      ing(WATER, 30, 'ml'),
      ing(SALT, 0.5, 'g'),
    ],
    instructions: [
      'Warm the olive oil in a wide pan over medium-high heat and add the grated ginger for about 20 seconds.',
      'Add the broccoli florets and toss them to coat.',
      'Pour in the water, cover the pan, and steam for 3 minutes.',
      'Uncover, add the salt, and cook for one more minute until the water has gone and the florets are bright green.',
    ],
  },
  {
    id: 'curated_side_roasted_cauliflower_turmeric',
    name: 'Turmeric Roasted Cauliflower',
    flavorProfile: 'Golden all over, earthy from the turmeric, with browned crisp edges on the flat faces.',
    healthBenefit: 'A cruciferous vegetable with fiber and vitamin C, roasted with turmeric, whose curcumin absorbs better alongside fat.',
    servingSizeAmount: 1.0,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(CAULIFLOWER, 120, 'g', 'cut into florets', 'Roasted'),
      ing(OIL, 5, 'ml'),
      ing(TURMERIC, 0.5, 'g'),
      ing(SALT, 0.5, 'g'),
      ing(PEPPER, 0.25, 'g'),
    ],
    instructions: [
      'Preheat the oven to 425°F (220°C).',
      'Toss the cauliflower florets with the olive oil, turmeric, salt and pepper until they are evenly yellow.',
      'Spread them on a baking sheet, cut side down where you can.',
      'Roast for 22 to 28 minutes, until the flat faces are deeply browned.',
    ],
  },
  {
    id: 'curated_side_lemon_herb_brown_rice',
    name: 'Lemon Herb Brown Rice',
    flavorProfile: 'Nutty and chewy, loosened with lemon juice and parsley stirred through at the end.',
    healthBenefit: 'Whole-grain rice keeps its bran, which is where the fiber, magnesium and B vitamins are, and the lemon goes in off the heat.',
    servingSizeAmount: 1.0,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(BROWN_RICE, 60, 'g', '', 'Boiled'),
      ing(WATER, 180, 'ml'),
      ing(LEMON, 7.5, 'g', 'juiced'),
      ing(PARSLEY, 1, 'g', 'chopped'),
      ing(OIL, 3.75, 'ml'),
      ing(SALT, 0.5, 'g'),
    ],
    instructions: [
      'Rinse the brown rice until the water runs clear.',
      'Bring the water to a boil with the salt, add the rice, cover, and lower the heat.',
      'Simmer for 40 to 45 minutes, until the water is absorbed and the grains are tender.',
      'Take it off the heat and let it sit covered for 5 minutes.',
      'Fork through the olive oil, lemon juice and parsley.',
    ],
  },
  {
    id: 'curated_side_creamy_polenta',
    name: 'Creamy Polenta',
    flavorProfile: 'Soft and loose, corn-sweet, finished with a spoon of olive oil rather than butter.',
    healthBenefit: 'Whole-grain cornmeal keeps the germ and bran, which is where its fiber and magnesium sit, and it is naturally gluten-free.',
    servingSizeAmount: 1.0,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(CORNMEAL, 40, 'g', '', 'Simmered'),
      ing(WATER, 240, 'ml'),
      ing(OIL, 5, 'ml'),
      ing(SALT, 0.75, 'g'),
      ing(PEPPER, 0.25, 'g'),
    ],
    instructions: [
      'Bring the water to a boil with the salt.',
      'Pour the cornmeal in slowly while whisking, so it does not clump.',
      'Lower the heat and cook for 20 to 25 minutes, stirring every few minutes, until it pulls away from the side of the pan.',
      'Stir in the olive oil and the pepper, and serve it while it is still loose.',
    ],
  },
  {
    id: 'curated_side_sorghum_pilaf',
    name: 'Herbed Sorghum Pilaf',
    flavorProfile: 'Chewy and a little nutty, with softened onion through it and parsley stirred in at the end.',
    healthBenefit: 'Sorghum is a gluten-free whole grain with more fiber than white rice and a low enough glycemic response to sit well beside a light main.',
    servingSizeAmount: 1.0,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(SORGHUM, 55, 'g', '', 'Boiled'),
      ing(WATER, 220, 'ml'),
      ing(ONION, 25, 'g', 'diced', 'Sauteed'),
      ing(OIL, 3.75, 'ml'),
      ing(PARSLEY, 1, 'g', 'chopped'),
      ing(SALT, 0.5, 'g'),
    ],
    instructions: [
      'Rinse the sorghum and drain it.',
      'Warm the olive oil in a saucepan over medium heat and cook the diced onion for 4 minutes, until it turns clear.',
      'Add the sorghum and stir for a minute to coat the grains.',
      'Pour in the water, add the salt, and simmer covered for 50 to 60 minutes, until the grains are tender and chewy.',
      'Drain off any water left over and stir the parsley through.',
    ],
  },
  {
    id: 'curated_side_coconut_rice',
    name: 'Coconut Rice',
    flavorProfile: 'Fragrant and faintly sweet, with the coconut cooked into the grains rather than poured over them.',
    healthBenefit: 'A dairy-free way to get a rich rice side, useful when a main is spicy or acidic and needs something plain beside it.',
    servingSizeAmount: 1.0,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(WHITE_RICE, 60, 'g', '', 'Boiled'),
      ing(COCONUT_MILK, 100, 'ml'),
      ing(WATER, 60, 'ml'),
      ing(SALT, 0.5, 'g'),
    ],
    instructions: [
      'Rinse the rice until the water runs clear, which keeps the grains separate.',
      'Combine the coconut milk, water and salt in a saucepan and bring them to a simmer.',
      'Add the rice, cover, and lower the heat to its lowest setting.',
      'Cook for 15 to 18 minutes, then leave it covered off the heat for 5 more minutes before forking it through.',
    ],
  },
  {
    id: 'curated_side_mashed_sweet_potato_lime',
    name: 'Mashed Sweet Potato with Lime',
    flavorProfile: 'Smooth and sweet, with lime juice keeping it from tasting flat.',
    healthBenefit: 'Vitamin A and potassium in a soft-textured side, which helps when chewing or digestion is difficult.',
    servingSizeAmount: 1.0,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(SWEET_POTATO, 140, 'g', 'peeled and cubed', 'Boiled'),
      ing(WATER, 300, 'ml'),
      ing(LIME, 7.5, 'g', 'juiced'),
      ing(OIL, 3.75, 'ml'),
      ing(SALT, 0.5, 'g'),
    ],
    instructions: [
      'Put the sweet potato cubes in a saucepan and cover them with the water.',
      'Bring it to a boil and simmer for 12 to 15 minutes, until a fork goes through easily.',
      'Drain them well and return them to the dry pan for a moment so the last of the water steams off.',
      'Mash with the olive oil, lime juice and salt until smooth.',
    ],
  },
  {
    id: 'curated_side_cabbage_carrot_slaw',
    name: 'Cabbage and Carrot Slaw',
    flavorProfile: 'Crunchy and sharp, dressed with lemon and oil instead of mayonnaise.',
    healthBenefit: 'Raw cabbage and carrot keep their vitamin C, which cooking would reduce, and the oil helps the carrot beta-carotene absorb.',
    servingSizeAmount: 1.0,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(CABBAGE, 80, 'g', 'finely shredded'),
      ing(CARROT, 50, 'g', 'grated'),
      ing(LEMON, 10, 'g', 'juiced'),
      ing(OIL, 5, 'ml'),
      ing(SALT, 0.5, 'g'),
      ing(PEPPER, 0.25, 'g'),
    ],
    instructions: [
      'Shred the cabbage as finely as you can and grate the carrot.',
      'Whisk the lemon juice, olive oil, salt and pepper together.',
      'Toss the vegetables in the dressing.',
      'Let it stand for 10 minutes before serving, which softens the cabbage slightly and pulls the dressing in.',
    ],
  },
  {
    id: 'curated_side_cucumber_dill_salad',
    name: 'Cucumber Dill Side Salad',
    flavorProfile: 'Cold, crisp and sour, with fresh dill through it.',
    healthBenefit: 'A high-water side that adds volume and cooling to a heavy plate, with almost nothing in the way of calories.',
    servingSizeAmount: 1.0,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(CUCUMBER, 130, 'g', 'thinly sliced'),
      ing(DILL, 1.5, 'g', 'chopped'),
      ing(CIDER_VINEGAR, 7.5, 'ml'),
      ing(OIL, 3.75, 'ml'),
      ing(SALT, 0.5, 'g'),
    ],
    instructions: [
      'Slice the cucumber as thinly as you can.',
      'Toss the slices with the salt and leave them in a colander for 10 minutes, then pat them dry.',
      'Whisk the cider vinegar and olive oil together.',
      'Toss the cucumber and chopped dill in the dressing and chill for 15 minutes before serving.',
    ],
  },
  {
    id: 'curated_side_fennel_apple_slaw',
    name: 'Fennel and Apple Slaw',
    flavorProfile: 'Crisp and aromatic, the anise of raw fennel against sweet-tart apple.',
    healthBenefit: 'Raw fennel keeps its fiber and potassium, and the lemon juice stops the apple browning without adding anything to it.',
    servingSizeAmount: 1.0,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(FENNEL, 80, 'g', 'thinly sliced'),
      ing(APPLE, 60, 'g', 'julienned'),
      ing(LEMON, 10, 'g', 'juiced'),
      ing(OIL, 3.75, 'ml'),
      ing(SALT, 0.5, 'g'),
    ],
    instructions: [
      'Slice the fennel bulb as thinly as possible and cut the apple into matchsticks.',
      'Toss them with the lemon juice straight away, which keeps the apple from browning.',
      'Add the olive oil and salt and toss again.',
      'Serve it cold, within an hour, while the fennel is still crisp.',
    ],
  },
  {
    id: 'curated_side_lemon_garlic_chickpeas',
    name: 'Lemon Garlic Chickpeas',
    flavorProfile: 'Warm, garlicky and lemony, with some of the chickpeas crushed so the dish holds together.',
    healthBenefit: 'Plant protein and soluble fiber in a side that can carry a meal when the main is light.',
    servingSizeAmount: 1.0,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(CHICKPEAS, 130, 'g', 'cooked and drained', 'Sauteed'),
      ing(OIL, 5, 'ml'),
      ing(GARLIC, 2, 'g', 'minced'),
      ing(LEMON, 10, 'g', 'juiced'),
      ing(SALT, 0.5, 'g'),
      ing(PARSLEY, 1, 'g', 'chopped'),
    ],
    instructions: [
      'Warm the olive oil in a pan over medium heat and cook the garlic for 30 seconds.',
      'Add the drained chickpeas and the salt and cook for 5 minutes, stirring.',
      'Crush about a third of the chickpeas against the side of the pan with the back of a spoon.',
      'Take the pan off the heat, stir in the lemon juice and parsley, and serve warm.',
    ],
  },
  {
    id: 'curated_side_stewed_lentils_carrot',
    name: 'Stewed Lentils with Carrot',
    flavorProfile: 'Soft and savory, the lentils holding their shape with sweet carrot through them.',
    healthBenefit: 'Lentils bring plant protein, iron and soluble fiber, and the carrot adds vitamin A to a side substantial enough to stand in for a starch.',
    servingSizeAmount: 1.0,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(LENTILS, 55, 'g', 'rinsed', 'Simmered'),
      ing(WATER, 250, 'ml'),
      ing(CARROT, 50, 'g', 'diced', 'Simmered'),
      ing(ONION, 25, 'g', 'diced', 'Sauteed'),
      ing(OIL, 3.75, 'ml'),
      ing(SALT, 0.75, 'g'),
    ],
    instructions: [
      'Warm the olive oil in a saucepan and cook the diced onion for 4 minutes, until it turns clear.',
      'Add the carrot and cook for 2 more minutes.',
      'Add the rinsed lentils and the water and bring it to a simmer.',
      'Cook uncovered for 22 to 28 minutes, until the lentils are tender and most of the liquid has gone.',
      'Stir in the salt at the end, since salting early can keep lentils firm.',
    ],
  },
];

// --- the 20 snacks ------------------------------------------------------
const SNACKS = [
  {
    id: 'curated_snack_kale_chips',
    name: 'Kale Chips',
    flavorProfile: 'Thin, salty and brittle, breaking apart the moment you bite one.',
    healthBenefit: 'A whole-leaf alternative to a packaged chip, with vitamin K and a fraction of the salt a bagged snack carries.',
    servings: 2.0,
    servingSizeAmount: 1.0,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(KALE, 60, 'g', 'stems removed, torn', 'Baked'),
      ing(OIL, 5, 'ml'),
      ing(SALT, 0.5, 'g'),
    ],
    instructions: [
      'Preheat the oven to 300°F (150°C).',
      'Strip the leaves off the stems, tear them into chip-sized pieces, and dry them thoroughly. Any water left on them will steam instead of crisping.',
      'Massage the olive oil into the leaves with your hands until every piece has a thin coat.',
      'Spread them on a baking sheet without overlapping and bake for 20 to 25 minutes, until they are dry and crisp at the edges.',
      'Salt them as they come out of the oven.',
    ],
  },
  {
    id: 'curated_snack_zucchini_chips',
    name: 'Baked Zucchini Chips',
    flavorProfile: 'Crisp and faintly sweet, browned at the rim with a chewier center.',
    healthBenefit: 'A low-calorie, high-water snack baked rather than fried, so the fat is whatever you brushed on.',
    servings: 2.0,
    servingSizeAmount: 1.0,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(ZUCCHINI, 150, 'g', 'thinly sliced', 'Baked'),
      ing(OIL, 5, 'ml'),
      ing(SALT, 0.5, 'g'),
      ing(PEPPER, 0.25, 'g'),
    ],
    instructions: [
      'Preheat the oven to 225°F (110°C).',
      'Slice the zucchini as thinly as you can, then lay the slices on paper towel and press another sheet on top to draw out water.',
      'Toss the dried slices with the olive oil, salt and pepper.',
      'Spread them on a lined baking sheet in one layer and bake for 90 minutes to 2 hours, turning once, until they are dry and crisp.',
    ],
  },
  {
    id: 'curated_snack_sweet_potato_chips',
    name: 'Baked Sweet Potato Chips',
    flavorProfile: 'Sweet, salty and snappy, with the edges curling as they crisp.',
    healthBenefit: 'Vitamin A and fiber in a chip you bake at home, which keeps the oil to a teaspoon instead of a deep fryer.',
    servings: 2.0,
    servingSizeAmount: 1.0,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(SWEET_POTATO, 150, 'g', 'thinly sliced', 'Baked'),
      ing(OIL, 7.5, 'ml'),
      ing(SALT, 0.5, 'g'),
    ],
    instructions: [
      'Preheat the oven to 250°F (120°C).',
      'Slice the sweet potato into rounds as thin as you can manage, ideally with a mandoline.',
      'Toss the slices with the olive oil until each one has a thin coat.',
      'Spread them on lined baking sheets in one layer and bake for 1 hour to 90 minutes, turning once, until they are crisp through.',
      'Salt them while they are hot and let them cool before storing.',
    ],
  },
  {
    id: 'curated_snack_cucumber_tahini_rounds',
    name: 'Cucumber Rounds with Tahini',
    flavorProfile: 'Cold and crunchy under a nutty, slightly bitter spoon of sesame.',
    healthBenefit: 'Tahini brings calcium, magnesium and sesame fat to a vegetable that otherwise carries almost no calories, so the snack holds you longer.',
    servings: 1.0,
    servingSizeAmount: 1.0,
    servingSizeUnit: 'serving',
    ingredients: [
      ing(CUCUMBER, 150, 'g', 'cut into thick rounds'),
      ing(TAHINI, 25, 'g'),
      ing(LEMON, 7.5, 'g', 'juiced'),
      ing(SALT, 0.25, 'g'),
    ],
    instructions: [
      'Cut the cucumber into rounds about a centimeter thick.',
      'Stir the tahini with the lemon juice and salt. It will seize and go stiff first, which is normal.',
      'Add a teaspoon of water at a time, stirring, until it loosens into a spoonable cream.',
      'Spoon a little onto each cucumber round.',
    ],
  },
  {
    id: 'curated_snack_rosemary_oat_crackers',
    name: 'Rosemary Oat Crackers',
    flavorProfile: 'Dry, savory and herbal, snapping cleanly when you break one.',
    healthBenefit: 'Oats bring beta-glucan, a soluble fiber tied to cholesterol handling, in a cracker with three ingredients instead of a label full of them.',
    servings: 3.0,
    servingSizeAmount: 6.0,
    servingSizeUnit: 'each',
    ingredients: [
      ing(OATS, 90, 'g', 'ground to flour', 'Baked'),
      ing(WATER, 60, 'ml'),
      ing(OIL, 15, 'ml'),
      ing(ROSEMARY, 1, 'g', 'chopped'),
      ing(SALT, 1, 'g'),
    ],
    instructions: [
      'Preheat the oven to 350°F (175°C).',
      'Grind the oats to a coarse flour in a blender or food processor.',
      'Mix the oat flour with the rosemary and salt, then work in the olive oil and water until it forms a stiff dough.',
      'Roll the dough out between two sheets of parchment until it is about 3mm thick, then cut it into squares.',
      'Bake for 18 to 22 minutes, until the edges have browned, and let them cool completely so they crisp.',
    ],
  },
  {
    id: 'curated_snack_frozen_banana_coins',
    name: 'Frozen Banana Coins',
    flavorProfile: 'Cold and creamy, closer to ice cream than to fruit once they are frozen through.',
    healthBenefit: 'Potassium and fiber from one whole banana, frozen so it eats slowly and satisfies a craving for something cold and sweet.',
    servings: 1.0,
    servingSizeAmount: 1.0,
    servingSizeUnit: 'serving',
    ingredients: [
      ing(BANANA, 120, 'g', 'sliced into coins', 'Frozen'),
      ing(CINNAMON, 0.5, 'g'),
    ],
    instructions: [
      'Slice the banana into coins about a centimeter thick.',
      'Lay them on a parchment-lined tray so they are not touching, and dust them with the cinnamon.',
      'Freeze for at least 2 hours, until they are solid.',
      'Move them to a container once frozen, and eat them straight from the freezer.',
    ],
  },
  {
    id: 'curated_snack_apple_cinnamon_slices',
    name: 'Cinnamon Apple Slices',
    flavorProfile: 'Warm and soft, the apple collapsing slightly with cinnamon through it.',
    healthBenefit: 'Apple pectin is a soluble fiber that feeds gut bacteria, and warming the fruit makes it easier to digest than eating it raw.',
    servings: 1.0,
    servingSizeAmount: 1.0,
    servingSizeUnit: 'serving',
    ingredients: [
      ing(APPLE, 160, 'g', 'sliced', 'Sauteed'),
      ing(CINNAMON, 1, 'g'),
      ing(WATER, 30, 'ml'),
    ],
    instructions: [
      'Core the apple and slice it thinly, leaving the skin on.',
      'Put the slices in a small pan with the water and the cinnamon.',
      'Cover and cook over medium-low heat for 6 to 8 minutes, stirring once, until the slices are soft but still hold together.',
      'Eat them warm, or chill them and eat them cold.',
    ],
  },
  {
    id: 'curated_snack_orange_date_bites',
    name: 'Orange and Date Bites',
    flavorProfile: 'Very sweet and chewy, with orange zest cutting the sugar.',
    healthBenefit: 'Dates carry potassium and fiber alongside their sugar, so the sweetness arrives with something slowing it down.',
    servings: 2.0,
    servingSizeAmount: 3.0,
    servingSizeUnit: 'each',
    ingredients: [
      ing(DATE, 80, 'g', 'pitted'),
      ing(ORANGE, 40, 'g', 'zested and juiced'),
    ],
    instructions: [
      'Zest the orange, then juice it.',
      'Blend the pitted dates with the orange zest and a tablespoon of the juice until a thick paste forms.',
      'Roll the paste into small balls with wet hands.',
      'Chill for 30 minutes before eating, and keep them in the fridge.',
    ],
  },
  {
    id: 'curated_snack_melon_lime_cups',
    name: 'Melon and Lime Cups',
    flavorProfile: 'Cold, juicy and sharp, with the lime keeping the melon from tasting flat.',
    healthBenefit: 'Cantaloupe is one of the highest vitamin A fruits, and the whole cup is mostly water, which helps on a day you are behind on drinking.',
    servings: 1.0,
    servingSizeAmount: 1.0,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(MELON, 160, 'g', 'cubed'),
      ing(LIME, 7.5, 'g', 'juiced'),
    ],
    instructions: [
      'Cut the cantaloupe into bite-sized cubes.',
      'Squeeze the lime juice over them and toss.',
      'Chill for 15 minutes before eating.',
    ],
  },
  {
    id: 'curated_snack_berry_coconut_cups',
    name: 'Berry and Coconut Cups',
    flavorProfile: 'Tart berries under a spoonful of thick, unsweetened coconut.',
    healthBenefit: 'Berry anthocyanins with no added sugar, and coconut milk in place of dairy for anyone avoiding it.',
    servings: 1.0,
    servingSizeAmount: 1.0,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(BLUEBERRY, 75, 'g'),
      ing(STRAWBERRY, 75, 'g', 'halved'),
      ing(COCONUT_MILK, 40, 'ml'),
    ],
    instructions: [
      'Chill the can of coconut milk for a few hours and spoon the thick part off the top.',
      'Put the blueberries and halved strawberries in a cup.',
      'Spoon the thick coconut milk over them and eat cold.',
    ],
  },
  {
    id: 'curated_snack_pear_ginger_yogurt',
    name: 'Pear with Ginger Yogurt',
    flavorProfile: 'Soft, sweet pear against cold tangy yogurt with a warm ginger edge.',
    healthBenefit: 'Protein from the yogurt with pear fiber, and ginger, which has a long record of settling an unsettled stomach.',
    servings: 1.0,
    servingSizeAmount: 1.0,
    servingSizeUnit: 'bowl',
    ingredients: [
      ing(PEAR, 140, 'g', 'diced'),
      ing(YOGURT, 150, 'g'),
      ing(GINGER, 2, 'g', 'grated'),
    ],
    instructions: [
      'Stir the grated ginger into the yogurt and leave it for 5 minutes so the flavor spreads.',
      'Dice the pear, leaving the skin on for the fiber.',
      'Spoon the yogurt into a bowl and top it with the pear.',
    ],
  },
  {
    id: 'curated_snack_grapefruit_honey',
    name: 'Grapefruit with Honey',
    flavorProfile: 'Sour and bitter, softened by a thin drizzle of honey rather than a spoonful of sugar.',
    healthBenefit: 'A serving of grapefruit covers most of a day of vitamin C, and the honey is there in a small enough amount to change the taste without the sugar load.',
    servings: 1.0,
    servingSizeAmount: 1.0,
    servingSizeUnit: 'serving',
    ingredients: [
      ing(GRAPEFRUIT, 180, 'g', 'segmented'),
      ing(HONEY, 8, 'g'),
    ],
    instructions: [
      'Cut the grapefruit in half and run a knife around each segment to free it.',
      'Drizzle the honey over the cut face.',
      'Eat it with a spoon, or lift the segments out into a bowl first.',
    ],
  },
  {
    id: 'curated_snack_carrot_tahini_dip',
    name: 'Carrot Sticks with Tahini Dip',
    flavorProfile: 'Sweet crunch against a nutty, lemony dip thick enough to hold on the stick.',
    healthBenefit: 'Beta-carotene from the carrot absorbs better with the sesame fat in the tahini alongside it, which is why the pairing works beyond taste.',
    servings: 1.0,
    servingSizeAmount: 1.0,
    servingSizeUnit: 'serving',
    ingredients: [
      ing(CARROT, 130, 'g', 'cut into sticks'),
      ing(TAHINI, 30, 'g'),
      ing(LEMON, 10, 'g', 'juiced'),
      ing(GARLIC, 1, 'g', 'minced'),
      ing(SALT, 0.25, 'g'),
    ],
    instructions: [
      'Cut the carrots into sticks.',
      'Stir the tahini with the lemon juice, garlic and salt. It will thicken and seize first.',
      'Loosen it with water, a teaspoon at a time, until it is a dip rather than a paste.',
      'Serve the sticks alongside the bowl.',
    ],
  },
  {
    id: 'curated_snack_hummus_cucumber',
    name: 'Hummus with Cucumber Spears',
    flavorProfile: 'Smooth and lemony, scooped up with cold cucumber instead of bread.',
    healthBenefit: 'Plant protein and fiber from the chickpeas, with the cucumber standing in for a cracker, which is where most of the salt in this snack would otherwise come from.',
    servings: 2.0,
    servingSizeAmount: 1.0,
    servingSizeUnit: 'serving',
    ingredients: [
      ing(CHICKPEAS, 160, 'g', 'cooked and drained'),
      ing(TAHINI, 30, 'g'),
      ing(LEMON, 15, 'g', 'juiced'),
      ing(GARLIC, 2, 'g', 'minced'),
      ing(OIL, 10, 'ml'),
      ing(WATER, 30, 'ml'),
      ing(SALT, 0.75, 'g'),
      ing(CUCUMBER, 150, 'g', 'cut into spears'),
    ],
    instructions: [
      'Blend the chickpeas, tahini, lemon juice, garlic and salt until they are grainy.',
      'With the blender running, pour in the olive oil and then the water until it turns smooth and pale.',
      'Taste it and add lemon juice or salt if it needs it.',
      'Cut the cucumber into spears and serve them with the bowl.',
    ],
  },
  {
    id: 'curated_snack_beet_yogurt_dip',
    name: 'Beet Yogurt Dip with Pepper Strips',
    flavorProfile: 'Bright pink and earthy-sweet, with the yogurt keeping it tangy and cool.',
    healthBenefit: 'Beet nitrates and yogurt protein together, dipped with red pepper, which is one of the highest vitamin C vegetables by weight.',
    servings: 2.0,
    servingSizeAmount: 1.0,
    servingSizeUnit: 'serving',
    ingredients: [
      ing(BEETROOT, 100, 'g', 'peeled and cubed', 'Roasted'),
      ing(YOGURT, 150, 'g'),
      ing(LEMON, 7.5, 'g', 'juiced'),
      ing(SALT, 0.5, 'g'),
      ing(RED_PEPPER, 120, 'g', 'cut into strips'),
    ],
    instructions: [
      'Roast the beet cubes, covered, at 400°F (200°C) for 35 minutes, until a knife goes through easily, and let them cool.',
      'Blend the cooled beet with the yogurt, lemon juice and salt until smooth.',
      'Chill the dip for 30 minutes so it firms up.',
      'Cut the red pepper into strips and serve them alongside.',
    ],
  },
  {
    id: 'curated_snack_avocado_lime_bowl',
    name: 'Avocado with Lime and Black Pepper',
    flavorProfile: 'Rich and buttery, sharpened by lime and lifted by a heavy grind of pepper.',
    healthBenefit: 'Monounsaturated fat and potassium, with enough fat to stop a snack turning into hunger an hour later.',
    servings: 1.0,
    servingSizeAmount: 1.0,
    servingSizeUnit: 'serving',
    ingredients: [
      ing(AVOCADO, 100, 'g', 'halved'),
      ing(LIME, 7.5, 'g', 'juiced'),
      ing(PEPPER, 0.5, 'g'),
      ing(SALT, 0.25, 'g'),
    ],
    instructions: [
      'Halve the avocado and take the stone out.',
      'Squeeze the lime juice into the hollow.',
      'Grind the pepper over it and add the salt.',
      'Eat it straight out of the skin with a spoon.',
    ],
  },
  {
    id: 'curated_snack_date_oat_bites',
    name: 'Date and Oat Bites',
    flavorProfile: 'Dense, chewy and caramel-sweet, with the oats giving them body.',
    healthBenefit: 'Oat beta-glucan and date fiber together, which slows how fast the sugar in the dates arrives.',
    servings: 3.0,
    servingSizeAmount: 3.0,
    servingSizeUnit: 'each',
    ingredients: [
      ing(DATE, 120, 'g', 'pitted'),
      ing(OATS, 60, 'g'),
      ing(CINNAMON, 1, 'g'),
      ing(WATER, 15, 'ml'),
    ],
    instructions: [
      'Soak the pitted dates in warm water for 10 minutes if they are dry, then drain them.',
      'Blend the dates, oats and cinnamon until the mixture clumps together.',
      'Add the water a little at a time if it stays crumbly.',
      'Roll into balls and chill for an hour before eating.',
    ],
  },
  {
    id: 'curated_snack_banana_oat_bars',
    name: 'Banana Oat Bars',
    flavorProfile: 'Soft and cakey, sweet from the banana rather than from added sugar.',
    healthBenefit: 'Two ingredients carry this: oat fiber and banana potassium, with maple syrup as the only sweetener and very little of it.',
    servings: 4.0,
    servingSizeAmount: 1.0,
    servingSizeUnit: 'each',
    ingredients: [
      ing(BANANA, 240, 'g', 'mashed', 'Baked'),
      ing(OATS, 120, 'g', '', 'Baked'),
      ing(MAPLE, 15, 'g'),
      ing(CINNAMON, 1, 'g'),
    ],
    instructions: [
      'Preheat the oven to 350°F (175°C).',
      'Mash the bananas until almost no lumps are left.',
      'Stir in the oats, maple syrup and cinnamon until the mixture is evenly wet.',
      'Press it into a lined small baking dish and bake for 22 to 26 minutes, until the top springs back.',
      'Let it cool completely in the dish before cutting, or the bars will fall apart.',
    ],
  },
  {
    id: 'curated_snack_coconut_date_balls',
    name: 'Coconut Date Balls',
    flavorProfile: 'Sweet and rich, with coconut running through the chew.',
    healthBenefit: 'Fiber and potassium from the dates, with coconut fat slowing the sugar, and no dairy or grain in it at all.',
    servings: 3.0,
    servingSizeAmount: 3.0,
    servingSizeUnit: 'each',
    ingredients: [
      ing(DATE, 130, 'g', 'pitted'),
      ing(COCONUT_MILK, 30, 'ml'),
      ing(OATS, 40, 'g'),
    ],
    instructions: [
      'Blend the pitted dates with the oats until the mixture is grainy and sticky.',
      'Add the coconut milk a little at a time until it holds together when squeezed.',
      'Roll into balls with wet hands.',
      'Chill for an hour, and keep them in the fridge.',
    ],
  },
  {
    id: 'curated_snack_maple_oat_clusters',
    name: 'Maple Oat Clusters',
    flavorProfile: 'Toasted and crunchy, breaking into clumps rather than loose grains.',
    healthBenefit: 'A granola you control the sugar in: one tablespoon of maple syrup across the whole batch instead of what a boxed one carries.',
    servings: 4.0,
    servingSizeAmount: 0.25,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(OATS, 140, 'g', '', 'Baked'),
      ing(MAPLE, 20, 'g'),
      ing(OIL, 10, 'ml'),
      ing(CINNAMON, 1, 'g'),
      ing(SALT, 0.5, 'g'),
    ],
    instructions: [
      'Preheat the oven to 325°F (160°C).',
      'Stir the oats with the maple syrup, olive oil, cinnamon and salt until every oat is coated.',
      'Press the mixture into a flat layer on a lined baking sheet, which is what makes it clump instead of scatter.',
      'Bake for 18 to 22 minutes without stirring, until it is golden.',
      'Let it cool completely on the sheet, then break it into clusters.',
    ],
  },
];

// --- assemble -----------------------------------------------------------
const runSql = (sql) =>
  execFileSync(SQLITE, [DB, '-json', sql], { encoding: 'utf8', maxBuffer: 1 << 28 }).trim();
const query = (sql) => { const out = runSql(sql); return out ? JSON.parse(out) : []; };
const esc = (value) => String(value).replace(/'/g, "''");

const existingIds = new Set(query('SELECT id FROM curated_recipes').map((row) => row.id));
const RECIPES = [];
for (const [list, builderType] of [[SIDES, 'side'], [SNACKS, 'snack']]) {
  for (const recipe of list) {
    RECIPES.push({
      ...recipe,
      builderType,
      servings: recipe.servings === undefined ? 1.0 : recipe.servings,
    });
  }
}

let problems = 0;
const seen = new Set();
for (const recipe of RECIPES) {
  if (existingIds.has(recipe.id)) { console.error(`id already in the database: ${recipe.id}`); problems += 1; }
  if (seen.has(recipe.id)) { console.error(`duplicate id in this batch: ${recipe.id}`); problems += 1; }
  seen.add(recipe.id);
  for (const item of recipe.ingredients) {
    const rows = query(
      `SELECT COUNT(*) AS n FROM foods WHERE category = '${esc(item.category)}' ` +
        `AND base_name = '${esc(item.baseName)}' AND hidden = 0`,
    );
    if (rows[0].n === 0) {
      console.error(`${recipe.id}: ${item.category} | ${item.baseName} resolves to no visible food`);
      problems += 1;
    }
  }
}
if (problems > 0) { console.error(`${problems} problems, nothing written`); process.exit(1); }

// sort_order continues after the highest already in that builder type.
const nextSort = {};
for (const row of query('SELECT builder_type AS b, MAX(sort_order) AS m FROM curated_recipes GROUP BY builder_type')) {
  nextSort[row.b] = row.m + 1;
}

const statements = ['BEGIN;'];
for (const recipe of RECIPES) {
  const sortOrder = nextSort[recipe.builderType];
  nextSort[recipe.builderType] += 1;
  recipe.sortOrder = sortOrder;
  statements.push(
    `INSERT INTO curated_recipes (id, builder_type, name, flavor_profile, health_benefit, servings, ` +
      `serving_size_amount, serving_size_unit, sort_order, instructions) VALUES (` +
      `'${esc(recipe.id)}', '${esc(recipe.builderType)}', '${esc(recipe.name)}', ` +
      `'${esc(recipe.flavorProfile)}', '${esc(recipe.healthBenefit)}', ${recipe.servings}, ` +
      `${recipe.servingSizeAmount}, '${esc(recipe.servingSizeUnit)}', ${sortOrder}, ` +
      `'${esc(JSON.stringify(recipe.instructions))}');`,
  );
  recipe.ingredients.forEach((item, index) => {
    const nullable = (value) => (value ? `'${esc(value)}'` : 'NULL');
    statements.push(
      `INSERT INTO curated_recipe_ingredients (recipe_id, category, base_name, quantity, unit, ` +
        `cut_prep, cooking_method, prep_note, sort_order) VALUES (` +
        `'${esc(recipe.id)}', '${esc(item.category)}', '${esc(item.baseName)}', ${item.quantity}, ` +
        `'${esc(item.unit)}', ${nullable(item.cutPrep)}, ${nullable(item.cookingMethod)}, ` +
        `${nullable(item.prepNote)}, ${index});`,
    );
  });
}
statements.push('COMMIT;');

execFileSync(SQLITE, [DB], { input: statements.join('\n'), encoding: 'utf8' });

fs.writeFileSync(OUT, JSON.stringify(RECIPES, null, 2), 'utf8');

const after = query(
  "SELECT builder_type AS b, COUNT(*) AS n FROM curated_recipes WHERE builder_type IN ('side','snack') GROUP BY b",
);
console.log(`inserted ${RECIPES.length} recipes (${SIDES.length} sides, ${SNACKS.length} snacks)`);
for (const row of after) console.log(`  ${row.b}: ${row.n} recipes now`);
console.log(`wrote ${path.relative(path.join(__dirname, '..'), OUT)}`);
