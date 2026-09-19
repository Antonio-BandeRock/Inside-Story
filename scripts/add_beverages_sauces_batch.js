/* global __dirname */
// 2026-09-19, direct request: "Add more beverages and sauces."
//
// Beverages held 4 recipes and Sauces held 4, the two thinnest bands on the
// System Recipes screen after the sides and snacks batch earlier the same
// day. This batch adds 20 beverages and 20 sauces, taking both bands to 24.
//
// THE PALETTE IS VERIFIED, NOT GUESSED, the same two ways as
// scripts/add_sides_snacks_batch.js:
//   1. Every (category, base_name) pair resolves to a row in `foods` with
//      hidden = 0, so the compute pipeline can score it.
//   2. Every pair was ranked against scripts/_recipe_condition_data_output.json.
//      A recipe that is clean for a condition has every ingredient clean for
//      that condition, and a caution names the ingredient that raised it, so
//      the union over shipped recipes gives a proven-clean floor and a
//      proven-dirty signal per pair. Lemon, lime, orange, apple, the berries,
//      pineapple, mango, cantaloupe, peach, cucumber, carrot, beet, tomato,
//      red bell pepper, coconut milk, whole milk, tahini, maple syrup, oats,
//      ginger, cinnamon, black tea, vegetable stock and water all came back
//      clean for all 19 conditions with no caution ever naming them. Garlic,
//      onion, black pepper, Greek yogurt, honey, cardamom, cloves, mint,
//      parsley, oregano and turmeric each carry one yellow Hashimoto's
//      caution (fermentability or contextual iron) and are already
//      load-bearing in dozens of shipped recipes, so they appear where a
//      drink or sauce needs them. Cumin (seven conditions), almond butter
//      (nine) and cider vinegar (two) were left out on that evidence.
//   Six pairs have no shipped recipe to prove them either way: the herbal
//   and hibiscus teas, brewed coffee, cocoa powder, sour cherries, cilantro
//   and arrowroot. They resolve, and the compute pipeline scores them on
//   their own merits like everything else.
//
// Run: node scripts/add_beverages_sauces_batch.js
// Then: node scripts/generate_beverages_sauces_recipes_ts.js
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SQLITE = 'C:/Users/TonyR/AppData/Local/Android/Sdk/platform-tools/sqlite3.exe';
const DB = path.join(__dirname, '..', 'assets', 'data', 'foods_reference.db');
const OUT = path.join(__dirname, '_beverages_sauces_batch_data.json');

// --- palette ------------------------------------------------------------
const OIL = ['Fats', 'Olive Oil (Extra Virgin)'];
const SALT = ['Herbs', 'Common salt/table salt'];
const PEPPER = ['Herbs', 'Pepper, black, ground'];
const GARLIC = ['Veg', 'Garlic'];
const ONION = ['Veg', 'Onion'];
const CARROT = ['Veg', 'Carrot'];
const BEETROOT = ['Veg', 'Beetroot'];
const CUCUMBER = ['Veg', 'Cucumber'];
const TOMATO = ['Veg', 'Tomato'];
const RED_PEPPER = ['Veg', 'Red Bell Pepper'];
const AVOCADO = ['Fruit', 'Avocado'];
const CILANTRO = ['Veg', 'Coriander (cilantro)'];
const LEMON = ['Fruit', 'Lemon'];
const LIME = ['Fruit', 'Lime'];
const ORANGE = ['Fruit', 'Orange'];
const APPLE = ['Fruit', 'Apple'];
const DATE = ['Fruit', 'Date'];
const MELON = ['Fruit', 'Cantaloupe Melon'];
const BLUEBERRY = ['Fruit', 'Blueberry'];
const STRAWBERRY = ['Fruit', 'Strawberry'];
const CRANBERRY = ['Fruit', 'Cranberry'];
const SOUR_CHERRY = ['Fruit', 'Sour Cherry'];
const PINEAPPLE = ['Fruit', 'Pineapple'];
const MANGO = ['Fruit', 'Mango'];
const PEACH = ['Fruit', 'Peach'];
const OATS = ['Grain', 'Oats'];
const COCONUT_MILK = ['NutSeed', 'Coconut milk'];
const MILK = ['Dairy', 'Milk, whole, 3.25% milkfat, with added vitamin D'];
const YOGURT = ['Dairy', 'Yogurt, Greek, plain, lowfat'];
const TAHINI = ['SaucesCondiments', 'Tahini'];
const MAPLE = ['Sweets', 'Maple Syrup (100% Pure)'];
const HONEY = ['Sweets', 'Standard Honey (Blossom Honey)'];
const CINNAMON = ['Herbs', 'Spices, cinnamon, ground'];
const CARDAMOM = ['Herbs', 'Spices, cardamom, ground'];
const CLOVES = ['Herbs', 'Spices, cloves, ground'];
const GINGER = ['Herbs', 'Ginger root'];
const TURMERIC = ['Herbs', 'Turmeric, dried, ground'];
const MINT = ['Herbs', 'Spices, spearmint, fresh'];
const PARSLEY = ['Herbs', 'Parsley Spices'];
const DILL = ['Herbs', 'Fresh Dill Weed'];
const OREGANO = ['Herbs', 'Oregano'];
const MUSTARD = ['Herbs', 'Mustard, prepared, yellow'];
const WATER = ['Bev', 'Water, tap'];
const STOCK = ['PantryStaples', 'Vegetable stock'];
const ARROWROOT = ['PantryStaples', 'Arrowroot flour'];
const BLACK_TEA = ['Brewing', 'Black Tea (Brewed)'];
const HERBAL_TEA = ['Brewing', 'Herbal Tea (Chamomile / Peppermint / Rooibos / Mate)'];
const HIBISCUS_TEA = ['Brewing', 'Hibiscus / Fruit Tea (Unsweetened)'];
const COFFEE = ['Brewing', 'Brewed Black Coffee'];
const COCOA = ['Brewing', 'Pure Cocoa / Cacao Powder (Unsweetened)'];

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

// --- the 20 beverages ---------------------------------------------------
const BEVERAGES = [
  {
    id: 'curated_bev_cucumber_mint_water',
    name: 'Cucumber Mint Water',
    flavorProfile: 'Cool and faintly green, with mint and lime lifting plain water without sweetening it.',
    healthBenefit: 'Plain water with enough flavor that it gets drunk. No sugar, and a little potassium from the cucumber.',
    servings: 2.0,
    servingSizeAmount: 1.0,
    servingSizeUnit: 'glass',
    ingredients: [
      ing(WATER, 500, 'ml'),
      ing(CUCUMBER, 60, 'g', 'thinly sliced'),
      ing(MINT, 2.5, 'g', 'torn'),
      ing(LIME, 15, 'g', 'thinly sliced'),
    ],
    instructions: [
      'Put the cucumber, mint and lime slices in a jug and pour the water over them.',
      'Chill for at least an hour so the flavors move into the water.',
      'Drink within a day. The cucumber goes soft after that.',
    ],
  },
  {
    id: 'curated_bev_strawberry_lemon_water',
    name: 'Strawberry Lemon Water',
    flavorProfile: 'Lightly fruity and tart, with the strawberries coloring the water pink as they sit.',
    healthBenefit: 'A way to drink more water that carries almost none of the sugar of a fruit juice, since the berries flavor it rather than being blended into it.',
    servings: 2.0,
    servingSizeAmount: 1.0,
    servingSizeUnit: 'glass',
    ingredients: [
      ing(WATER, 500, 'ml'),
      ing(STRAWBERRY, 60, 'g', 'halved'),
      ing(LEMON, 20, 'g', 'thinly sliced'),
    ],
    instructions: [
      'Put the halved strawberries and lemon slices in a jug and press them once or twice with a spoon to release a little juice.',
      'Pour the water over and chill for at least an hour.',
      'Eat the strawberries once the water is gone.',
    ],
  },
  {
    id: 'curated_bev_warm_lemon_ginger',
    name: 'Warm Lemon Ginger Water',
    flavorProfile: 'Warm and sharp, with the ginger heat building as it steeps and the honey rounding the lemon.',
    healthBenefit: 'Ginger is one of the better-studied plant remedies for nausea, and a warm drink first thing tends to get drunk when a cold glass of water does not.',
    servingSizeAmount: 1.0,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(WATER, 250, 'ml'),
      ing(GINGER, 5, 'g', 'thinly sliced'),
      ing(LEMON, 15, 'g', 'juiced'),
      ing(HONEY, 5, 'g'),
    ],
    instructions: [
      'Heat the water until it is steaming but not boiling.',
      'Drop in the ginger slices and let them steep for 5 minutes.',
      'Stir in the lemon juice and honey once the water is cool enough to drink.',
    ],
  },
  {
    id: 'curated_bev_chamomile_honey_lemon',
    name: 'Chamomile Tea with Honey and Lemon',
    flavorProfile: 'Soft and apple-like, with a little honey and a squeeze of lemon on top.',
    healthBenefit: 'Caffeine-free, so it suits the last hour of the day. Chamomile has a small body of trial evidence for sleep and mild anxiety, most of it short and small.',
    servingSizeAmount: 1.0,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(HERBAL_TEA, 250, 'ml'),
      ing(HONEY, 5, 'g'),
      ing(LEMON, 7.5, 'g', 'juiced'),
    ],
    instructions: [
      'Brew a chamomile tea bag, or a heaped teaspoon of dried chamomile flowers, in 250ml of just-boiled water for 5 minutes with a saucer over the cup.',
      'Remove the bag or strain out the flowers.',
      'Stir in the honey and lemon juice once the tea has cooled enough to drink.',
    ],
  },
  {
    id: 'curated_bev_rooibos_cinnamon_latte',
    name: 'Rooibos Cinnamon Latte',
    flavorProfile: 'Rounded and slightly sweet, with the red tea tasting almost of vanilla under the warm milk.',
    healthBenefit: 'A caffeine-free latte. Rooibos brews strong without the tannin bitterness black tea gets, so it stands up to milk without sugar doing the work.',
    servingSizeAmount: 1.0,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(HERBAL_TEA, 150, 'ml'),
      ing(MILK, 100, 'ml'),
      ing(CINNAMON, 0.5, 'g'),
      ing(MAPLE, 5, 'g'),
    ],
    instructions: [
      'Brew two rooibos tea bags in 150ml of boiling water for 7 minutes, so the tea is strong enough to taste through the milk.',
      'Warm the milk in a small pan with the cinnamon until it steams, whisking to froth it.',
      'Remove the tea bags, stir in the maple syrup, and pour the milk over the tea.',
    ],
  },
  {
    id: 'curated_bev_hibiscus_lime_iced_tea',
    name: 'Hibiscus Lime Iced Tea',
    flavorProfile: 'Deep red, tart like cranberry, with lime sharpening it and honey taking the edge off.',
    healthBenefit: 'Hibiscus has several small trials behind a modest blood pressure reduction. The honey is light enough that a glass carries a fraction of the sugar in bottled iced tea.',
    servings: 2.0,
    servingSizeAmount: 1.0,
    servingSizeUnit: 'glass',
    ingredients: [
      ing(HIBISCUS_TEA, 500, 'ml'),
      ing(HONEY, 10, 'g'),
      ing(LIME, 15, 'g', 'juiced'),
    ],
    instructions: [
      'Brew two hibiscus tea bags, or a tablespoon of dried hibiscus flowers, in 500ml of boiling water for 10 minutes.',
      'Strain, and stir in the honey while the tea is still warm so it dissolves.',
      'Chill, then add the lime juice and serve over ice.',
    ],
  },
  {
    id: 'curated_bev_peach_iced_black_tea',
    name: 'Peach Iced Black Tea',
    flavorProfile: 'Brisk black tea with ripe peach sweetness steeped in, and no added sugar at all.',
    healthBenefit: 'The peach slices sweeten the tea while they sit in it, which is how this gets its flavor without a syrup. Brewed black tea carries polyphenols and about half the caffeine of coffee.',
    servings: 2.0,
    servingSizeAmount: 1.0,
    servingSizeUnit: 'glass',
    ingredients: [
      ing(BLACK_TEA, 500, 'ml'),
      ing(PEACH, 100, 'g', 'sliced'),
      ing(LEMON, 7.5, 'g', 'juiced'),
    ],
    instructions: [
      'Brew two black tea bags in 500ml of boiling water for 4 minutes and remove them, so the tea does not turn bitter.',
      'Drop the peach slices into the hot tea and leave it to cool on the counter.',
      'Chill for 2 hours, add the lemon juice, and serve over ice with the peach slices left in.',
    ],
  },
  {
    id: 'curated_bev_homemade_chai',
    name: 'Homemade Chai',
    flavorProfile: 'Warm and spiced, with ginger heat, cardamom and clove behind strong black tea and milk.',
    healthBenefit: 'Made at home, a cup of chai carries a teaspoon of honey. The coffee-shop version is built on a syrup concentrate that puts it closer to a dessert.',
    servingSizeAmount: 1.0,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(BLACK_TEA, 150, 'ml'),
      ing(MILK, 100, 'ml'),
      ing(GINGER, 5, 'g', 'sliced'),
      ing(CINNAMON, 0.5, 'g'),
      ing(CARDAMOM, 0.5, 'g'),
      ing(CLOVES, 0.25, 'g'),
      ing(HONEY, 5, 'g'),
    ],
    instructions: [
      'Simmer the ginger, cinnamon, cardamom and cloves in 150ml of water in a small pan for 5 minutes.',
      'Take the pan off the heat, add a black tea bag, and steep for 3 minutes.',
      'Remove the tea bag, add the milk, and warm gently without boiling.',
      'Strain into a cup and stir in the honey.',
    ],
  },
  {
    id: 'curated_bev_cinnamon_cardamom_coffee',
    name: 'Cinnamon Cardamom Coffee',
    flavorProfile: 'Ordinary drip coffee with a warm, faintly floral edge from spices brewed in with the grounds.',
    healthBenefit: 'The spices go into the filter, so the flavor comes through without any syrup. A splash of milk is the only thing added to the cup.',
    servingSizeAmount: 1.0,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(COFFEE, 250, 'ml'),
      ing(CINNAMON, 0.5, 'g'),
      ing(CARDAMOM, 0.25, 'g'),
      ing(MILK, 30, 'ml'),
    ],
    instructions: [
      'Stir the cinnamon and cardamom into the ground coffee before brewing, so they brew through with it.',
      'Brew as you normally would, by drip, pour-over or press.',
      'Add the milk to the cup.',
    ],
  },
  {
    id: 'curated_bev_stovetop_hot_cocoa',
    name: 'Stovetop Hot Cocoa',
    flavorProfile: 'Dark and chocolatey, less sweet than a packet mix, with a pinch of salt bringing the cocoa forward.',
    healthBenefit: 'Unsweetened cocoa is one of the denser sources of flavanols, and making it from powder means you decide the sugar: two teaspoons of maple syrup here, against three to four in a packet.',
    servingSizeAmount: 1.0,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(MILK, 250, 'ml'),
      ing(COCOA, 8, 'g'),
      ing(MAPLE, 10, 'g'),
      ing(CINNAMON, 0.25, 'g'),
      ing(SALT, 0.25, 'g'),
    ],
    instructions: [
      'Whisk the cocoa, cinnamon and salt with a splash of the milk in a small pan until there are no lumps.',
      'Add the rest of the milk and the maple syrup and warm over medium-low heat, whisking, until steaming.',
      'Do not let it boil. Pour into a cup.',
    ],
  },
  {
    id: 'curated_bev_stovetop_apple_cider',
    name: 'Stovetop Apple Cider',
    flavorProfile: 'Warm, sweet and spiced, tasting of the apples themselves rather than of a concentrate.',
    healthBenefit: 'Made from whole apples simmered and pressed, it has no added sugar and keeps some of the apple pectin that a filtered juice loses.',
    servings: 2.0,
    servingSizeAmount: 1.0,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(APPLE, 300, 'g', 'quartered', 'Simmered'),
      ing(WATER, 500, 'ml'),
      ing(CINNAMON, 1, 'g'),
      ing(CLOVES, 0.25, 'g'),
      ing(LEMON, 7.5, 'g', 'juiced'),
    ],
    instructions: [
      'Put the quartered apples, water, cinnamon and cloves in a pan and bring to a simmer.',
      'Simmer, covered, for 30 minutes, until the apples have collapsed.',
      'Mash the apples in the pan, then strain through a sieve, pressing to get the liquid out.',
      'Stir in the lemon juice and serve warm.',
    ],
  },
  {
    id: 'curated_bev_cranberry_orange_cooler',
    name: 'Cranberry Orange Cooler',
    flavorProfile: 'Tart and bright, with orange juice softening the cranberry bite.',
    healthBenefit: 'Bottled cranberry drinks are mostly sugar water because the fruit is so sour. Simmering whole berries and sweetening lightly keeps the fruit and cuts the sugar to a third.',
    servings: 2.0,
    servingSizeAmount: 1.0,
    servingSizeUnit: 'glass',
    ingredients: [
      ing(CRANBERRY, 100, 'g', null, 'Simmered'),
      ing(WATER, 400, 'ml'),
      ing(ORANGE, 80, 'g', 'juiced'),
      ing(MAPLE, 15, 'g'),
    ],
    instructions: [
      'Simmer the cranberries in the water for 10 minutes, until every berry has burst.',
      'Strain through a sieve, pressing the berries to get the liquid out, and stir in the maple syrup while it is warm.',
      'Chill, then add the orange juice and serve over ice.',
    ],
  },
  {
    id: 'curated_bev_tart_cherry_cooler',
    name: 'Tart Cherry Cooler',
    flavorProfile: 'Sour and deep, with lime and a little honey rounding it into something you want a second glass of.',
    healthBenefit: 'Sour cherries are the variety studied for muscle recovery and sleep, in small trials using concentrated juice. This is the whole fruit, lightly sweetened, at far less sugar than a bottled concentrate.',
    servings: 2.0,
    servingSizeAmount: 1.0,
    servingSizeUnit: 'glass',
    ingredients: [
      ing(SOUR_CHERRY, 150, 'g', 'pitted', 'Simmered'),
      ing(WATER, 400, 'ml'),
      ing(LIME, 15, 'g', 'juiced'),
      ing(HONEY, 10, 'g'),
    ],
    instructions: [
      'Simmer the pitted cherries in the water for 8 minutes, until they have softened and colored the water deep red.',
      'Strain, pressing the cherries, and stir in the honey while the liquid is warm.',
      'Chill, add the lime juice, and serve over ice.',
    ],
  },
  {
    id: 'curated_bev_cantaloupe_agua_fresca',
    name: 'Cantaloupe Lime Agua Fresca',
    flavorProfile: 'Light, sweet and melon-forward, thinned with water so it drinks like a cooler rather than a smoothie.',
    healthBenefit: 'Cantaloupe is one of the highest vitamin A fruits, and blending it with water rather than juicing it keeps the fiber in the glass.',
    servings: 2.0,
    servingSizeAmount: 1.0,
    servingSizeUnit: 'glass',
    ingredients: [
      ing(MELON, 300, 'g', 'cubed'),
      ing(WATER, 250, 'ml'),
      ing(LIME, 15, 'g', 'juiced'),
      ing(HONEY, 5, 'g'),
    ],
    instructions: [
      'Blend the cantaloupe, water, lime juice and honey until smooth.',
      'Taste. A ripe melon may not need the honey at all.',
      'Serve over ice. Stir before pouring if it has separated.',
    ],
  },
  {
    id: 'curated_bev_blueberry_lemonade',
    name: 'Blueberry Lemonade',
    flavorProfile: 'Tart lemonade turned purple by whole blueberries, sweeter from the fruit than from the syrup.',
    healthBenefit: 'A glass of standard lemonade carries about 25g of sugar. Blueberries do part of the sweetening here, which brings this to well under half that and adds their anthocyanins.',
    servings: 2.0,
    servingSizeAmount: 1.0,
    servingSizeUnit: 'glass',
    ingredients: [
      ing(BLUEBERRY, 100, 'g'),
      ing(LEMON, 60, 'g', 'juiced'),
      ing(WATER, 400, 'ml'),
      ing(MAPLE, 20, 'g'),
    ],
    instructions: [
      'Blend the blueberries with 100ml of the water until smooth, then strain through a sieve to catch the skins.',
      'Stir the blueberry juice, lemon juice, maple syrup and the rest of the water together.',
      'Serve over ice.',
    ],
  },
  {
    id: 'curated_bev_pineapple_ginger_juice',
    name: 'Pineapple Ginger Juice',
    flavorProfile: 'Sweet, tropical and hot at the back, with lime holding the pineapple sugar in check.',
    healthBenefit: 'Fresh pineapple carries bromelain, an enzyme that a pasteurized juice has lost, along with a full day of vitamin C in a glass. Blending and lightly straining keeps more fiber than a juicer would.',
    servings: 2.0,
    servingSizeAmount: 1.0,
    servingSizeUnit: 'glass',
    ingredients: [
      ing(PINEAPPLE, 250, 'g', 'cubed'),
      ing(GINGER, 5, 'g', 'peeled'),
      ing(LIME, 7.5, 'g', 'juiced'),
      ing(WATER, 100, 'ml'),
    ],
    instructions: [
      'Blend the pineapple, ginger, lime juice and water until smooth.',
      'Strain through a coarse sieve if you want it thinner, or drink it as it is.',
      'Serve cold.',
    ],
  },
  {
    id: 'curated_bev_carrot_orange_ginger_juice',
    name: 'Carrot Orange Ginger Juice',
    flavorProfile: 'Sweet and earthy from the carrot, bright from the orange, with a ginger kick.',
    healthBenefit: 'Two vegetables-worth of beta-carotene in a glass, and the orange supplies the vitamin C. No juicer needed: a blender and a sieve do it.',
    servings: 2.0,
    servingSizeAmount: 1.0,
    servingSizeUnit: 'glass',
    ingredients: [
      ing(CARROT, 150, 'g', 'chopped'),
      ing(ORANGE, 150, 'g', 'peeled and segmented'),
      ing(GINGER, 5, 'g', 'peeled'),
      ing(WATER, 150, 'ml'),
    ],
    instructions: [
      'Blend the carrot, orange, ginger and water on high for a full minute, until the carrot is completely broken down.',
      'Strain through a fine sieve, pressing the pulp with the back of a spoon.',
      'Serve cold. Stir before drinking.',
    ],
  },
  {
    id: 'curated_bev_beet_apple_lemon_juice',
    name: 'Beet Apple Lemon Juice',
    flavorProfile: 'Earthy and sweet, deep magenta, with lemon keeping the beet from tasting like soil.',
    healthBenefit: 'Beets are the food source of dietary nitrate that trials have tied to lower blood pressure and better exercise endurance. The apple sweetens it without any added sugar.',
    servings: 2.0,
    servingSizeAmount: 1.0,
    servingSizeUnit: 'glass',
    ingredients: [
      ing(BEETROOT, 100, 'g', 'peeled and chopped'),
      ing(APPLE, 150, 'g', 'cored and chopped'),
      ing(LEMON, 15, 'g', 'juiced'),
      ing(WATER, 150, 'ml'),
    ],
    instructions: [
      'Blend the beet, apple, lemon juice and water on high for a full minute.',
      'Strain through a fine sieve, pressing the pulp.',
      'Serve cold. Beet stains, so rinse the blender straight away.',
    ],
  },
  {
    id: 'curated_bev_homemade_oat_milk',
    name: 'Homemade Oat Milk',
    flavorProfile: 'Mild, faintly sweet and creamy, with none of the gums or oils a carton version carries.',
    healthBenefit: 'Two ingredients plus a date and a pinch of salt. Carton oat milk is usually made with added oil, and often with sugar released by enzymes. This has neither.',
    servings: 3.0,
    servingSizeAmount: 1.0,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(OATS, 80, 'g'),
      ing(WATER, 750, 'ml'),
      ing(DATE, 15, 'g', 'pitted'),
      ing(SALT, 0.5, 'g'),
    ],
    instructions: [
      'Blend the oats, cold water, date and salt for 30 seconds and no longer. Over-blending is what makes oat milk slimy.',
      'Pour through a fine sieve or a cloth into a jar without pressing the pulp, which would push the starch through.',
      'Keep refrigerated for up to 4 days. It separates, so shake before pouring.',
    ],
  },
  {
    id: 'curated_bev_mango_lassi',
    name: 'Mango Lassi',
    flavorProfile: 'Thick, cold and sweet, with cardamom giving the mango a floral edge.',
    healthBenefit: 'Greek yogurt gives this the protein a fruit juice lacks, so it holds you between meals. The mango does nearly all the sweetening.',
    servingSizeAmount: 1.0,
    servingSizeUnit: 'glass',
    ingredients: [
      ing(MANGO, 150, 'g', 'cubed'),
      ing(YOGURT, 120, 'g'),
      ing(MILK, 60, 'ml'),
      ing(HONEY, 5, 'g'),
      ing(CARDAMOM, 0.25, 'g'),
    ],
    instructions: [
      'Blend the mango, yogurt, milk, honey and cardamom until smooth.',
      'Add a splash more milk if it is too thick to pour.',
      'Serve cold.',
    ],
  },
];

// --- the 20 sauces ------------------------------------------------------
const SAUCES = [
  {
    id: 'curated_sauce_lemon_mustard_vinaigrette',
    name: 'Lemon Mustard Vinaigrette',
    flavorProfile: 'Sharp and clean, with the mustard holding the oil and lemon together so it coats rather than puddles.',
    healthBenefit: 'A bottled dressing lists sugar, thickeners and refined oil; this is olive oil and lemon. The oil helps the fat-soluble vitamins in whatever you pour it over absorb.',
    servings: 4.0,
    servingSizeAmount: 1.0,
    servingSizeUnit: 'tbsp',
    ingredients: [
      ing(OIL, 45, 'ml'),
      ing(LEMON, 22.5, 'g', 'juiced'),
      ing(MUSTARD, 5, 'g'),
      ing(SALT, 0.5, 'g'),
      ing(PEPPER, 0.25, 'g'),
    ],
    instructions: [
      'Put everything in a small jar with a tight lid.',
      'Shake hard for 20 seconds, until it turns cloudy and thick.',
      'Keeps refrigerated for a week. Shake again before each use.',
    ],
  },
  {
    id: 'curated_sauce_orange_ginger_dressing',
    name: 'Orange Ginger Dressing',
    flavorProfile: 'Sweet and citrusy with a ginger bite, lighter than a vinaigrette because orange juice makes up half of it.',
    healthBenefit: 'The orange juice replaces vinegar, which matters if vinegar bothers your stomach, and it carries the sweetness so no sugar is added.',
    servings: 4.0,
    servingSizeAmount: 1.0,
    servingSizeUnit: 'tbsp',
    ingredients: [
      ing(ORANGE, 60, 'g', 'juiced'),
      ing(LIME, 7.5, 'g', 'juiced'),
      ing(OIL, 30, 'ml'),
      ing(GINGER, 3, 'g', 'grated'),
      ing(SALT, 0.5, 'g'),
    ],
    instructions: [
      'Whisk the orange juice, lime juice, ginger and salt together.',
      'Whisk in the olive oil in a thin stream so it comes together.',
      'Use the same day, while the orange is fresh.',
    ],
  },
  {
    id: 'curated_sauce_carrot_ginger_dressing',
    name: 'Carrot Ginger Dressing',
    flavorProfile: 'Bright orange, sweet and gingery, thick enough to cling to a salad the way the Japanese restaurant version does.',
    healthBenefit: 'A whole carrot blended into the dressing, so the beta-carotene comes with the oil that helps it absorb.',
    servings: 6.0,
    servingSizeAmount: 2.0,
    servingSizeUnit: 'tbsp',
    ingredients: [
      ing(CARROT, 60, 'g', 'chopped'),
      ing(GINGER, 5, 'g', 'peeled'),
      ing(LIME, 15, 'g', 'juiced'),
      ing(OIL, 30, 'ml'),
      ing(WATER, 30, 'ml'),
      ing(MAPLE, 5, 'g'),
      ing(SALT, 0.5, 'g'),
    ],
    instructions: [
      'Blend the carrot, ginger, lime juice, water, maple syrup and salt until completely smooth, scraping down the sides once.',
      'Add the olive oil and blend again briefly.',
      'Thin with a little more water if it is thicker than you want. Keeps refrigerated for 5 days.',
    ],
  },
  {
    id: 'curated_sauce_yogurt_ranch',
    name: 'Yogurt Ranch Dressing',
    flavorProfile: 'Cool, herby and tangy, with the dill and garlic doing what the packet does without the powder.',
    healthBenefit: 'Greek yogurt in place of the mayonnaise and buttermilk base, which swaps most of the fat for protein and adds live cultures.',
    servings: 4.0,
    servingSizeAmount: 2.0,
    servingSizeUnit: 'tbsp',
    ingredients: [
      ing(YOGURT, 120, 'g'),
      ing(WATER, 15, 'ml'),
      ing(LEMON, 7.5, 'g', 'juiced'),
      ing(GARLIC, 1.5, 'g', 'minced'),
      ing(DILL, 2, 'g', 'chopped'),
      ing(PARSLEY, 2, 'g', 'chopped'),
      ing(SALT, 0.5, 'g'),
      ing(PEPPER, 0.25, 'g'),
    ],
    instructions: [
      'Stir the yogurt, water and lemon juice together until smooth.',
      'Stir in the garlic, dill, parsley, salt and pepper.',
      'Let it sit for 15 minutes before using so the garlic mellows. Keeps refrigerated for 4 days.',
    ],
  },
  {
    id: 'curated_sauce_ginger_lime_marinade',
    name: 'Ginger Lime Marinade',
    flavorProfile: 'Sharp, hot and a little sweet, for chicken, fish, tofu or vegetables headed for the grill.',
    healthBenefit: 'Enough acid and oil to season and tenderize 500g of protein or vegetables, without the soy sauce and sugar a bottled marinade is built on.',
    servings: 4.0,
    servingSizeAmount: 1.0,
    servingSizeUnit: 'tbsp',
    ingredients: [
      ing(LIME, 30, 'g', 'juiced'),
      ing(GINGER, 7.5, 'g', 'grated'),
      ing(GARLIC, 3, 'g', 'minced'),
      ing(OIL, 30, 'ml'),
      ing(MAPLE, 5, 'g'),
      ing(SALT, 1, 'g'),
    ],
    instructions: [
      'Whisk everything together in a bowl.',
      'Pour over 500g of chicken, fish, tofu or sliced vegetables and turn to coat.',
      'Marinate fish for 20 minutes and anything else for 1 to 4 hours in the fridge, then cook. Discard what the raw food sat in.',
    ],
  },
  {
    id: 'curated_sauce_lemon_garlic_herb_marinade',
    name: 'Lemon Garlic Herb Marinade',
    flavorProfile: 'Lemony and green, with garlic and fresh herbs, for chicken, fish or vegetables.',
    healthBenefit: 'Marinating in lemon and olive oil before grilling has been shown to reduce the formation of heterocyclic amines, the compounds that form when meat chars.',
    servings: 4.0,
    servingSizeAmount: 1.0,
    servingSizeUnit: 'tbsp',
    ingredients: [
      ing(LEMON, 30, 'g', 'juiced'),
      ing(OIL, 45, 'ml'),
      ing(GARLIC, 3, 'g', 'minced'),
      ing(DILL, 2, 'g', 'chopped'),
      ing(PARSLEY, 2, 'g', 'chopped'),
      ing(SALT, 1, 'g'),
      ing(PEPPER, 0.5, 'g'),
    ],
    instructions: [
      'Whisk everything together in a bowl.',
      'Pour over 500g of chicken, fish or sliced vegetables and turn to coat.',
      'Marinate fish for 20 minutes and chicken for 1 to 4 hours in the fridge, then cook. Discard what the raw food sat in.',
    ],
  },
  {
    id: 'curated_sauce_tzatziki',
    name: 'Tzatziki',
    flavorProfile: 'Cold, thick and garlicky, with grated cucumber and dill through it.',
    healthBenefit: 'Mostly Greek yogurt and cucumber, so it carries protein and live cultures where a mayonnaise-based dip carries fat. Squeezing the cucumber is what keeps it thick.',
    servings: 6.0,
    servingSizeAmount: 0.25,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(YOGURT, 200, 'g'),
      ing(CUCUMBER, 100, 'g', 'grated and squeezed dry'),
      ing(GARLIC, 1.5, 'g', 'minced'),
      ing(DILL, 3, 'g', 'chopped'),
      ing(LEMON, 7.5, 'g', 'juiced'),
      ing(OIL, 5, 'ml'),
      ing(SALT, 1, 'g'),
    ],
    instructions: [
      'Grate the cucumber, toss it with the salt, and leave it in a sieve for 10 minutes. Squeeze it in your hands until no more water comes out.',
      'Stir the cucumber into the yogurt with the garlic, dill, lemon juice and olive oil.',
      'Chill for 30 minutes before serving. Keeps refrigerated for 3 days.',
    ],
  },
  {
    id: 'curated_sauce_cucumber_mint_raita',
    name: 'Cucumber Mint Raita',
    flavorProfile: 'Cool and mild, with mint and lime, made to sit beside something hot and spiced.',
    healthBenefit: 'The cooling side dish of Indian cooking, and the reason a spiced meal is easier on the stomach. Yogurt protein and cucumber water, nothing else to speak of.',
    servings: 4.0,
    servingSizeAmount: 0.25,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(YOGURT, 200, 'g'),
      ing(CUCUMBER, 80, 'g', 'finely diced'),
      ing(MINT, 3, 'g', 'chopped'),
      ing(LIME, 7.5, 'g', 'juiced'),
      ing(SALT, 0.5, 'g'),
    ],
    instructions: [
      'Stir the yogurt until smooth.',
      'Fold in the cucumber, mint, lime juice and salt.',
      'Serve cold, the same day.',
    ],
  },
  {
    id: 'curated_sauce_avocado_lime',
    name: 'Avocado Lime Sauce',
    flavorProfile: 'Smooth, green and tangy, thin enough to drizzle over tacos, bowls or grilled fish.',
    healthBenefit: 'Avocado supplies the creaminess with monounsaturated fat and potassium, and a spoonful of yogurt thins it without any oil.',
    servings: 4.0,
    servingSizeAmount: 0.25,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(AVOCADO, 100, 'g'),
      ing(LIME, 15, 'g', 'juiced'),
      ing(YOGURT, 60, 'g'),
      ing(WATER, 30, 'ml'),
      ing(CILANTRO, 3, 'g'),
      ing(SALT, 0.5, 'g'),
    ],
    instructions: [
      'Blend the avocado, lime juice, yogurt, water, cilantro and salt until smooth.',
      'Add water a spoonful at a time until it pours.',
      'Use the same day. It browns at the surface after that, though it is still fine underneath.',
    ],
  },
  {
    id: 'curated_sauce_tahini_ginger',
    name: 'Tahini Ginger Sauce',
    flavorProfile: 'Nutty, sharp and a little sweet, the sauce a grain bowl or a tray of roasted vegetables usually gets from peanuts.',
    healthBenefit: 'Sesame in place of peanuts, so it is safe for a peanut allergy and brings calcium and magnesium along with the fat.',
    servings: 4.0,
    servingSizeAmount: 2.0,
    servingSizeUnit: 'tbsp',
    ingredients: [
      ing(TAHINI, 45, 'g'),
      ing(WATER, 45, 'ml'),
      ing(LIME, 15, 'g', 'juiced'),
      ing(GINGER, 5, 'g', 'grated'),
      ing(GARLIC, 1.5, 'g', 'minced'),
      ing(MAPLE, 5, 'g'),
      ing(SALT, 0.5, 'g'),
    ],
    instructions: [
      'Stir the tahini and lime juice together. It will seize and thicken; keep stirring.',
      'Add the water a little at a time, stirring, until it loosens into a pourable sauce.',
      'Stir in the ginger, garlic, maple syrup and salt. Keeps refrigerated for a week and thickens as it sits.',
    ],
  },
  {
    id: 'curated_sauce_fresh_tomato_salsa',
    name: 'Fresh Tomato Salsa',
    flavorProfile: 'Chunky, juicy and sharp, with raw onion, cilantro and lime.',
    healthBenefit: 'Raw tomato, onion and lime, with the salt in your control. Jarred salsa can carry more sodium per serving than a bag of chips.',
    servings: 4.0,
    servingSizeAmount: 0.25,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(TOMATO, 250, 'g', 'diced'),
      ing(ONION, 40, 'g', 'finely diced'),
      ing(CILANTRO, 5, 'g', 'chopped'),
      ing(LIME, 15, 'g', 'juiced'),
      ing(SALT, 1, 'g'),
    ],
    instructions: [
      'Stir the tomato, onion, cilantro, lime juice and salt together in a bowl.',
      'Let it sit for 15 minutes so the salt draws the juice out of the tomato.',
      'Best the same day. Drain off the extra liquid if it sits longer.',
    ],
  },
  {
    id: 'curated_sauce_mango_salsa',
    name: 'Mango Salsa',
    flavorProfile: 'Sweet, sharp and crunchy, with red pepper and lime against ripe mango.',
    healthBenefit: 'A fruit salsa that brings vitamin C from both the mango and the pepper, and turns plain grilled fish or chicken into a meal without a sauce.',
    servings: 4.0,
    servingSizeAmount: 0.25,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(MANGO, 200, 'g', 'diced'),
      ing(RED_PEPPER, 50, 'g', 'finely diced'),
      ing(ONION, 25, 'g', 'finely diced'),
      ing(CILANTRO, 4, 'g', 'chopped'),
      ing(LIME, 15, 'g', 'juiced'),
      ing(SALT, 0.5, 'g'),
    ],
    instructions: [
      'Stir the mango, red pepper, onion, cilantro, lime juice and salt together.',
      'Let it sit for 10 minutes before serving.',
      'Best the same day.',
    ],
  },
  {
    id: 'curated_sauce_parsley_chimichurri',
    name: 'Parsley Garlic Chimichurri',
    flavorProfile: 'Green, garlicky and sharp, loose enough to spoon over grilled meat or roasted vegetables.',
    healthBenefit: 'A whole bunch of parsley goes into a small batch, which makes this one of the few sauces that counts as a serving of leafy greens. Lemon stands in for the usual vinegar.',
    servings: 6.0,
    servingSizeAmount: 1.0,
    servingSizeUnit: 'tbsp',
    ingredients: [
      ing(PARSLEY, 30, 'g', 'finely chopped'),
      ing(OREGANO, 2, 'g'),
      ing(GARLIC, 6, 'g', 'minced'),
      ing(OIL, 60, 'ml'),
      ing(LEMON, 15, 'g', 'juiced'),
      ing(SALT, 1, 'g'),
      ing(PEPPER, 0.25, 'g'),
    ],
    instructions: [
      'Stir the parsley, oregano, garlic, salt and pepper together in a bowl.',
      'Stir in the olive oil and lemon juice. It should be loose and spoonable, not a paste.',
      'Let it sit for 30 minutes before serving. Keeps refrigerated for 3 days.',
    ],
  },
  {
    id: 'curated_sauce_roasted_tomato_garlic',
    name: 'Roasted Tomato Garlic Sauce',
    flavorProfile: 'Deeper and sweeter than a stovetop tomato sauce, with the garlic gone soft and mellow in the oven.',
    healthBenefit: 'Roasting concentrates the tomatoes and makes their lycopene more available than it is raw, and the olive oil they roast in helps it absorb.',
    servings: 4.0,
    servingSizeAmount: 0.5,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(TOMATO, 400, 'g', 'halved', 'Roasted'),
      ing(GARLIC, 6, 'g', 'whole cloves, peeled', 'Roasted'),
      ing(OIL, 15, 'ml'),
      ing(SALT, 1, 'g'),
      ing(PEPPER, 0.25, 'g'),
    ],
    instructions: [
      'Preheat the oven to 400°F (200°C).',
      'Lay the tomato halves cut side up on a baking sheet with the garlic cloves tucked between them. Drizzle with the olive oil and sprinkle with the salt and pepper.',
      'Roast for 35 to 40 minutes, until the tomato edges have browned and the garlic is soft.',
      'Blend everything from the sheet, juices included, until smooth. Keeps refrigerated for 5 days.',
    ],
  },
  {
    id: 'curated_sauce_roasted_red_pepper',
    name: 'Roasted Red Pepper Sauce',
    flavorProfile: 'Smoky-sweet and smooth, the color of paprika, good on eggs, grains, fish or pasta.',
    healthBenefit: 'Red bell peppers carry more vitamin C by weight than oranges, and roasting them adds sweetness with no sugar.',
    servings: 4.0,
    servingSizeAmount: 0.25,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(RED_PEPPER, 300, 'g', 'halved and seeded', 'Roasted'),
      ing(GARLIC, 3, 'g', 'minced'),
      ing(OIL, 15, 'ml'),
      ing(LEMON, 7.5, 'g', 'juiced'),
      ing(SALT, 1, 'g'),
    ],
    instructions: [
      'Roast the pepper halves skin side up under a hot broiler, or at 450°F (230°C), for 15 to 20 minutes, until the skins are blackened in patches.',
      'Put them in a covered bowl for 10 minutes, then slip the skins off.',
      'Blend the peppers with the garlic, olive oil, lemon juice and salt until smooth. Keeps refrigerated for 5 days.',
    ],
  },
  {
    id: 'curated_sauce_coconut_ginger',
    name: 'Coconut Ginger Sauce',
    flavorProfile: 'Rich, gently spiced and golden, a quick curry sauce for vegetables, fish or chickpeas.',
    healthBenefit: 'Coconut milk gives it body without cream or flour, and the turmeric and ginger bring the pair of anti-inflammatory spices that the most trials have looked at.',
    servings: 4.0,
    servingSizeAmount: 0.25,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(OIL, 5, 'ml'),
      ing(GINGER, 7.5, 'g', 'grated'),
      ing(GARLIC, 3, 'g', 'minced'),
      ing(TURMERIC, 1, 'g'),
      ing(COCONUT_MILK, 200, 'ml', null, 'Simmered'),
      ing(LIME, 15, 'g', 'juiced'),
      ing(SALT, 1, 'g'),
    ],
    instructions: [
      'Warm the oil in a small pan and cook the ginger, garlic and turmeric for 1 minute, until fragrant.',
      'Pour in the coconut milk and simmer for 5 minutes, until slightly thickened.',
      'Take it off the heat and stir in the lime juice and salt.',
    ],
  },
  {
    id: 'curated_sauce_onion_gravy',
    name: 'Onion Gravy',
    flavorProfile: 'Dark, sweet from slow-cooked onions, and thick enough to pour over mash or roasted vegetables.',
    healthBenefit: 'Built on slowly browned onions and vegetable stock rather than meat drippings and flour, so it is gluten-free and carries a fraction of the saturated fat.',
    servings: 4.0,
    servingSizeAmount: 0.25,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(ONION, 150, 'g', 'thinly sliced', 'Sauteed'),
      ing(OIL, 10, 'ml'),
      ing(STOCK, 300, 'ml'),
      ing(ARROWROOT, 8, 'g'),
      ing(SALT, 0.5, 'g'),
      ing(PEPPER, 0.5, 'g'),
    ],
    instructions: [
      'Cook the onions in the olive oil over medium-low heat for 20 minutes, stirring now and then, until they are deep golden and soft.',
      'Add all but 2 tablespoons of the stock and simmer for 5 minutes.',
      'Stir the arrowroot into the reserved cold stock, then stir it into the pan. Simmer gently for 1 minute, until it thickens. Do not boil it hard, which thins arrowroot back out.',
      'Season with the salt and pepper.',
    ],
  },
  {
    id: 'curated_sauce_applesauce',
    name: 'Unsweetened Applesauce',
    flavorProfile: 'Soft, warm and tasting of apples and cinnamon, with a little lemon keeping it bright.',
    healthBenefit: 'Jarred applesauce is often sweetened; this one takes all its sugar from the fruit and keeps the pectin, a soluble fiber that gut bacteria feed on.',
    servings: 4.0,
    servingSizeAmount: 0.5,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(APPLE, 500, 'g', 'peeled, cored and chopped', 'Simmered'),
      ing(WATER, 60, 'ml'),
      ing(CINNAMON, 1, 'g'),
      ing(LEMON, 7.5, 'g', 'juiced'),
    ],
    instructions: [
      'Put the apples, water and cinnamon in a pan, cover, and simmer over low heat for 15 to 20 minutes, until the apples fall apart.',
      'Mash with a fork for a chunky sauce or blend for a smooth one.',
      'Stir in the lemon juice. Keeps refrigerated for a week.',
    ],
  },
  {
    id: 'curated_sauce_cranberry_orange',
    name: 'Cranberry Orange Sauce',
    flavorProfile: 'Tart, jammy and bright with orange, for roast poultry, a grain bowl or stirred into yogurt.',
    healthBenefit: 'The canned version is around a third sugar by weight. Here the maple syrup is a fifth of that, and the whole berries and orange do the rest.',
    servings: 6.0,
    servingSizeAmount: 0.25,
    servingSizeUnit: 'cup',
    ingredients: [
      ing(CRANBERRY, 200, 'g', null, 'Simmered'),
      ing(ORANGE, 60, 'g', 'juiced, zest reserved'),
      ing(MAPLE, 30, 'g'),
      ing(WATER, 60, 'ml'),
    ],
    instructions: [
      'Put the cranberries, orange juice, maple syrup and water in a pan and bring to a simmer.',
      'Simmer for 10 to 12 minutes, stirring, until the berries have burst and the sauce has thickened.',
      'Stir in the orange zest and let it cool. It thickens further as it cools. Keeps refrigerated for 10 days.',
    ],
  },
  {
    id: 'curated_sauce_blueberry_maple',
    name: 'Blueberry Maple Sauce',
    flavorProfile: 'Warm, glossy and purple, with whole berries in a light syrup, for pancakes, oatmeal or yogurt.',
    healthBenefit: 'A tablespoon of maple syrup across the batch, so a serving carries about a teaspoon of added sugar next to a half cup of berries.',
    servings: 4.0,
    servingSizeAmount: 2.0,
    servingSizeUnit: 'tbsp',
    ingredients: [
      ing(BLUEBERRY, 150, 'g', null, 'Simmered'),
      ing(MAPLE, 15, 'g'),
      ing(LEMON, 7.5, 'g', 'juiced'),
      ing(WATER, 30, 'ml'),
    ],
    instructions: [
      'Put the blueberries, maple syrup, lemon juice and water in a small pan.',
      'Simmer for 5 to 7 minutes, stirring, until some of the berries have burst and the liquid has turned syrupy.',
      'Serve warm or cold. Keeps refrigerated for 5 days.',
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
for (const [list, builderType] of [[BEVERAGES, 'beverage'], [SAUCES, 'sauce']]) {
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
  "SELECT builder_type AS b, COUNT(*) AS n FROM curated_recipes WHERE builder_type IN ('beverage','sauce') GROUP BY b",
);
console.log(`inserted ${RECIPES.length} recipes (${BEVERAGES.length} beverages, ${SAUCES.length} sauces)`);
for (const row of after) console.log(`  ${row.b}: ${row.n} recipes now`);
console.log(`wrote ${path.relative(path.join(__dirname, '..'), OUT)}`);
