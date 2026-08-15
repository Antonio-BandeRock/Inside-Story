// Purple Digest's "Recipes" category -- one real DigestEntry per curated
// recipe (curated_recipes/curated_recipe_ingredients in the bundled
// reference database), each linking back to the real builder that can
// actually assemble it (linkedCuratedRecipeId/linkedBuilderType) via a
// "Build This Recipe" button. Started 2026-08-14; grown to a genuine,
// detailed recipe card 2026-08-15, direct request: a full ingredient list
// scaled for 2 people with individual prep and quantity, clear combine/
// cook instructions, a real stated yield, a real nutrition "rating of
// sorts" (how much of a day's RDA the dish provides), a short, honest note
// on which of this app's 19 tracked conditions anything in the dish could
// be a problem for (and a real way to still enjoy it despite that), and a
// genuine flavor-palette description -- see RecipeCard's own comment in
// types.ts.
//
// title/teaser/summary still trace directly to the database's own real
// name/flavor_profile/health_benefit (so the Digest entry and the
// builder's own recipe card never drift apart on the basics) -- citations
// stays [] and overallTier 'strong' throughout, matching the same
// precedent already established for content describing this app's own
// real, already-built features (appHelps.ts) rather than external
// research: recipeCard's own real detail is built from this app's own
// bundled nutrient/DRI/6-DFF-condition data directly, verified through a
// real, one-off computation script (scripts/compute_recipe_data.js), not
// invented.
//
// 2-person scaling follows a real, deliberate rule, not a blind halving:
// a meal-type recipe (the dish IS the meal, eaten in one sitting -- most
// salads, soups, sides, smoothies, some snacks/handhelds/desserts) has its
// own real ingredient quantities scaled so the whole recipe yields exactly
// 2 real servings. A batch/pantry recipe (bread, tortillas, biscuits,
// cookies, both yogurts, sauerkraut, kombucha, all 4 sauces, trail mix,
// roasted chickpeas, and the 2 real pitcher-style beverages) keeps its
// own real, natural batch size instead -- its own yield line says so
// directly ("plenty for 2 people across a few days"), since a literal
// mathematical half-loaf of bread is an awkward, sometimes baking-ratio-
// risky yield, not what "enough for 2 people" actually means for a pantry
// item.
//
// conditionNotes deliberately doesn't repeat every real flagged sub-
// criterion this app's own 6-DFF/condition-scoring data returns for a
// given ingredient -- two of the most common real tags ("Selenium & Zn
// synergy: Inhibiting", "Iron Presence: Inhibiting") turned out, once the
// grounding script actually ran, to appear on nearly every single
// ingredient in nearly every recipe (a real, near-universal background
// signal in this app's own D1-D6 mineral-absorption dimension, not a
// meaningful per-recipe caution), so surfacing them here would have made
// this section read as noise rather than the short, genuinely useful
// "things to be aware of" the request asked for. Only genuinely specific,
// actionable, real flags are kept -- Gluten, raw Goitrogenic Load, high
// Oxalate Load, Lectins, Fermentability/Irritants tied to a condition that
// actually has it flagged, a genuinely prominent Omega-3 vs 6 imbalance,
// and excess Iodine.
//
// A real, separate finding surfaced while building this and is worth
// naming directly rather than quietly working around forever: Germany_BLS
// (one of this app's 9 real bundled national sources) carries a genuinely
// implausible vitamin_b6 value on essentially every one of its own food
// rows (e.g. "Chives" at 2000mg/100g, "Lobster" at ~1650mg/100g -- real
// foods, physically impossible amounts) -- a real, systemic reference-
// database data-quality bug, not something this pass introduced or fixed.
// The grounding script defends against it with a real, generous per-
// nutrient sanity ceiling (so this app's own already-verified, genuinely
// concentrated foods -- Brazil nut's real ~1917µg/100g selenium, already
// independently cited elsewhere in this Digest -- stay trusted while this
// one corrupted column doesn't corrupt anything written here), but the
// underlying Germany_BLS column itself is unfixed and worth a real,
// dedicated future investigation.
import type { DigestEntry } from './types';

export const RECIPES_ENTRIES: DigestEntry[] = [
  // -------------------------------------------------------------------
  // Baked Goods -- all 4 are real, batch/pantry-style recipes (bread,
  // tortillas, biscuits, cookies): the kind of thing you bake once and eat
  // from over several days, so the yield stays at its own natural,
  // baking-ratio-safe batch size rather than a forced half-loaf.
  // -------------------------------------------------------------------
  {
    id: 'recipe-baked-whole-wheat-bread',
    category: 'recipes',
    title: 'Simple Whole Wheat Bread',
    teaser: 'A dense, honest homemade loaf, crust and all.',
    summary: 'Whole-grain flour keeps fiber intact that white flour strips out during milling, worth knowing before reaching for a store loaf.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_baked_whole_wheat_bread',
    linkedBuilderType: 'bakedGoods',
    recipeCard: {
      yield: 'Makes one 8-slice loaf. A whole loaf sliced and stored well keeps two people in bread for the better part of a week.',
      ingredients: [
        { text: '500g (about 4 cups) whole-grain wheat flour' },
        { text: '300ml warm water' },
        { text: '7g (about 2 teaspoons) active dry yeast' },
        { text: '6g (about 1 teaspoon) salt' },
        { text: '15g (about 1 tablespoon) honey' },
        { text: '15ml (about 1 tablespoon) olive oil' },
      ],
      instructions: [
        'Dissolve the yeast and honey in the warm water and let it sit for about 5 minutes, until it looks foamy on top. That foam is how you know the yeast is actually alive.',
        'In a large bowl, whisk the flour and salt together, then make a well in the center and pour in the yeast mixture and the olive oil.',
        'Mix until a shaggy dough forms, then turn it out and knead for 8-10 minutes, until it feels smooth and springs back when you poke it.',
        'Place the dough in an oiled bowl, cover, and let it rise somewhere warm for about an hour, until roughly doubled.',
        'Punch the dough down, shape it into a loaf, and set it in a greased loaf pan. Cover again and let it rise a second time, about 30-40 minutes.',
        'Bake at 375°F (190°C) for 35-40 minutes, until the crust is deep golden and the loaf sounds hollow when you tap the bottom.',
        'Let it cool completely on a rack before slicing. Cutting it warm makes the crumb gummy.',
      ],
      nutritionHighlights: [
        { nutrient: 'Manganese', note: 'A single slice covers well over 100% of a day\'s worth, part of what whole wheat holds onto that refined white flour loses.' },
        { nutrient: 'Fiber', note: 'Around a quarter of a day\'s fiber target per slice, from the intact wheat bran.' },
        { nutrient: 'Thiamin (B1)', note: 'Close to 30% of a day\'s worth per slice, one of the B vitamins wheat is naturally rich in.' },
        { nutrient: 'Magnesium', note: 'Roughly a quarter of a day\'s target per slice.' },
      ],
      conditionNotes: [
        { condition: 'Hashimoto\'s / Celiac / Psoriasis / Rheumatoid Arthritis', note: 'This is a full-gluten wheat loaf, so if gluten is something you avoid, this one isn\'t for you as written. The good news is it\'s an easy swap: a 1:1 gluten-free flour blend works in this same recipe, just expect a slightly denser, less springy crumb since it\'s missing gluten\'s own stretch.' },
      ],
      flavorNotes: 'This bakes up hearty and a little nutty, the way whole wheat always does, with a firm, chewy crumb rather than the airy softness of a white sandwich loaf. The crust turns deep golden and properly crackly right out of the oven. It\'s a plain, honest bread built for actual use: toast, sandwiches, or torn straight off the loaf and dipped in olive oil, not a delicate bakery showpiece.',
    },
  },
  {
    id: 'recipe-baked-wheat-tortillas',
    category: 'recipes',
    title: 'Homemade Wheat Tortillas',
    teaser: 'Soft, pliable, and ready in under 30 minutes.',
    summary: 'A homemade tortilla has three or four ingredients instead of the dozen-plus stabilizers and preservatives on a store-bought package.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_baked_wheat_tortillas',
    linkedBuilderType: 'bakedGoods',
    recipeCard: {
      yield: 'Makes 8 tortillas. Two people can get through these across a couple of days of wraps and tacos.',
      ingredients: [
        { text: '250g (about 2 cups) white flour tortilla mix (or all-purpose flour)' },
        { text: '150ml warm water' },
        { text: '20ml (about 1½ tablespoons) olive oil' },
        { text: '3g (about ½ teaspoon) salt' },
      ],
      instructions: [
        'Whisk the flour and salt together in a large bowl.',
        'Add the olive oil and rub it into the flour with your fingers until the mixture looks like coarse crumbs.',
        'Pour in the warm water and mix until a soft dough comes together. Knead it for 2-3 minutes, just until smooth.',
        'Divide the dough into 8 equal pieces, roll each into a ball, cover with a towel, and let them rest for 15 minutes. This relaxes the gluten so they roll out easily instead of springing back.',
        'On a lightly floured surface, roll each ball into a thin, roughly 8-inch circle.',
        'Cook each tortilla in a dry, hot skillet for about 30-45 seconds per side, until it puffs slightly and picks up light golden spots.',
        'Stack the cooked tortillas under a clean towel to keep them soft and warm while you finish the rest.',
      ],
      nutritionHighlights: [
        { nutrient: 'Thiamin (B1)', note: 'About 20% of a day\'s worth per tortilla, from the enriched flour.' },
        { nutrient: 'Iron', note: 'Around 12-28% of a day\'s target per tortilla, depending on sex.' },
        { nutrient: 'Manganese and Riboflavin (B2)', note: 'Each around 14% of a day\'s worth per tortilla.' },
      ],
      conditionNotes: [
        { condition: 'Hashimoto\'s / Celiac / Psoriasis / Rheumatoid Arthritis', note: 'This is an ordinary wheat-flour tortilla, so the gluten content is unavoidable as written. A gluten-free tortilla-style flour blend can be substituted directly in this same recipe. It rolls out a little more delicately, so handle it gently when you flip it in the pan.' },
      ],
      flavorNotes: 'Fresh tortillas taste like almost nothing else: a little toasty, a little chewy, soft in a way that a package sitting on a shelf for weeks just can\'t match. Warm, straight out of the skillet, they don\'t even need a filling to be good on their own.',
    },
  },
  {
    id: 'recipe-baked-buttermilk-biscuits',
    category: 'recipes',
    title: 'Whole Wheat Buttermilk Biscuits',
    teaser: 'Flaky layers from cold butter and buttermilk tang.',
    summary: 'Buttermilk\'s acidity reacts with baking powder for extra lift, and cold butter creates the steam pockets that make a biscuit flaky rather than dense.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_baked_buttermilk_biscuits',
    linkedBuilderType: 'bakedGoods',
    recipeCard: {
      yield: 'Makes 8 biscuits. Two people can eat 2 apiece over breakfast and still have a couple left for later.',
      ingredients: [
        { text: '250g (about 2 cups) whole-grain wheat flour' },
        { text: '60g (about 4 tablespoons) cold salted butter, cubed' },
        { text: '180ml buttermilk' },
        { text: '10g (about 2½ teaspoons) baking powder' },
        { text: '3g (about ½ teaspoon) salt' },
      ],
      instructions: [
        'Preheat the oven to 425°F (220°C).',
        'Whisk the flour, baking powder, and salt together in a large bowl.',
        'Add the cold, cubed butter and cut it into the flour with your fingers or a pastry cutter, until the mixture looks like coarse, pea-sized crumbs. Keeping the butter cold and in visible pieces is what actually makes the layers.',
        'Pour in the buttermilk and stir just until the dough comes together. Overmixing here is the most common way to end up with a tough biscuit, so stop as soon as it\'s combined.',
        'Turn the dough onto a floured surface and pat it into a rectangle about ¾-inch thick. Fold it in thirds like a letter, then pat it out again. This is what actually builds the flaky layers.',
        'Cut out biscuits with a round cutter, pressing straight down without twisting (twisting seals the edges and stops them from rising evenly).',
        'Place the biscuits close together on a baking sheet and bake for 12-15 minutes, until the tops are golden.',
      ],
      nutritionHighlights: [
        { nutrient: 'Manganese', note: 'Around 55-71% of a day\'s worth per biscuit, from the whole wheat flour.' },
        { nutrient: 'Magnesium and Thiamin (B1)', note: 'Each roughly 15% of a day\'s target per biscuit.' },
        { nutrient: 'Fiber', note: 'About 13% of a day\'s worth per biscuit.' },
      ],
      conditionNotes: [
        { condition: 'Hashimoto\'s / Celiac / Psoriasis / Rheumatoid Arthritis', note: 'This is a full-gluten wheat recipe. A gluten-free flour blend built for baking can generally stand in 1:1, though you may need a touch more buttermilk since gluten-free blends often absorb liquid differently.' },
      ],
      flavorNotes: 'Warm from the oven, these have a good tang from the buttermilk balanced against rich, salty butter, with a craggy golden top and layers that actually pull apart. Split one open and it\'s begging for more butter or a spoonful of jam.',
    },
  },
  {
    id: 'recipe-baked-banana-oat-cookies',
    category: 'recipes',
    title: 'Banana Oat Breakfast Cookies',
    teaser: 'Soft, naturally sweetened, and perfectly fine for breakfast.',
    summary: 'Ripe banana replaces most of the added sugar and fat a standard cookie recipe would need, so most of what\'s here is whole-food fiber and natural sweetness.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_baked_banana_oat_cookies',
    linkedBuilderType: 'bakedGoods',
    recipeCard: {
      yield: 'Makes 12 cookies. Two people can eat a couple each and still have breakfast covered for a few more days.',
      ingredients: [
        { text: '150g (about 1½ cups) rolled oats' },
        { text: '200g (about 2 medium) ripe bananas, mashed' },
        { text: '15g (about 2 tablespoons) ground flax seeds' },
        { text: '20g (about 1 tablespoon) honey' },
        { text: '2g (about ½ teaspoon) ground cinnamon' },
      ],
      instructions: [
        'Preheat the oven to 350°F (175°C) and line a baking sheet with parchment paper.',
        'Mash the bananas well in a large bowl, until mostly smooth with just a few small lumps.',
        'Stir in the oats, ground flax, honey, and cinnamon until everything is evenly combined. The mixture should hold together when pressed.',
        'Let the mixture sit for 5-10 minutes, giving the oats a chance to soften and soak up some of the banana\'s moisture.',
        'Scoop rounded spoonfuls onto the baking sheet and flatten each one slightly with the back of a spoon, since these won\'t spread much on their own.',
        'Bake for 15-18 minutes, until the edges are lightly golden.',
        'Let them cool on the sheet for a few minutes before moving them. They firm up as they cool.',
      ],
      nutritionHighlights: [
        { nutrient: 'Manganese', note: 'About a third to nearly half a day\'s worth per cookie, mostly from the oats.' },
        { nutrient: 'Magnesium', note: 'Around 8-10% of a day\'s target per cookie.' },
        { nutrient: 'Fiber', note: 'Roughly 6-9% of a day\'s worth per cookie, from oats and banana together.' },
      ],
      conditionNotes: [],
      flavorNotes: 'These taste like banana bread in cookie form: soft, a little chewy, warm with cinnamon, and sweet from ripe banana rather than a cup of sugar. They\'re dense enough to actually be filling, which is exactly what a good breakfast cookie should be.',
    },
  },

  // -------------------------------------------------------------------
  // Beverages -- a mixed group: two are pitcher-style batches you make
  // once and drink from over a couple of days (the ginger tonic, the iced
  // tea), so they keep their own natural batch size; the other two
  // (electrolyte water, golden milk) already write up as one glass for
  // one person, so they're doubled to make two real glasses.
  // -------------------------------------------------------------------
  {
    id: 'recipe-bev-ginger-turmeric-tonic',
    category: 'recipes',
    title: 'Ginger Turmeric Immunity Tonic',
    teaser: 'A warming, spicy-sweet sipper you can make ahead.',
    summary: 'Black pepper\'s piperine measurably improves how well the body absorbs turmeric\'s curcumin, which is why this combination shows up together so often.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_bev_ginger_turmeric_tonic',
    linkedBuilderType: 'beverage',
    recipeCard: {
      yield: 'Makes about 4 cups. This is a pitcher-style drink, so brew the whole batch and keep it in the fridge, plenty for 2 people across a couple of days.',
      ingredients: [
        { text: '15g (about 1 tablespoon) fresh ginger root, grated' },
        { text: '3g (about 1 teaspoon) ground turmeric' },
        { text: '30g (juice of about 1 lemon)' },
        { text: '15g (about 1 tablespoon) honey' },
        { text: '500ml water' },
        { text: '1g (a pinch) ground black pepper' },
      ],
      instructions: [
        'Bring the water to a simmer in a small pot.',
        'Add the grated ginger and turmeric, and let it simmer gently for 10 minutes so the flavors actually infuse into the water rather than just floating on top.',
        'Remove from heat and stir in the lemon juice, honey, and black pepper.',
        'Strain out the solids if you\'d rather have a smooth drink, or leave them in for a more rustic tonic.',
        'Serve warm, or let it cool and refrigerate to drink over ice.',
      ],
      nutritionHighlights: [
        { nutrient: 'Manganese', note: 'Around 18-23% of a day\'s worth per cup, mostly from the turmeric and ginger.' },
        { nutrient: 'Vitamin C', note: 'A modest 5-6% of a day\'s target per cup, from the fresh lemon juice.' },
      ],
      conditionNotes: [],
      flavorNotes: 'This is warm, peppery, and a little sharp from fresh ginger, balanced by honey\'s sweetness and a bright hit of lemon at the end. The black pepper is barely noticeable on its own but gives the whole drink a little more depth and bite.',
    },
  },
  {
    id: 'recipe-bev-electrolyte-water',
    category: 'recipes',
    title: 'Electrolyte Recovery Water',
    teaser: 'A simple homemade alternative to bottled sports drinks.',
    summary: 'Most commercial electrolyte drinks are built around added dyes and a lot of sugar. This is the same sodium-plus-fluid idea without either.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_bev_electrolyte_water',
    linkedBuilderType: 'beverage',
    recipeCard: {
      yield: 'Makes about 4 cups (1000ml), 2 2-cup glasses, one for each person.',
      ingredients: [
        { text: '1000ml water' },
        { text: '4g (about ¾ teaspoon) salt' },
        { text: '60g (juice of about 2 lemons)' },
        { text: '20g (about 4 teaspoons) honey' },
      ],
      instructions: [
        'Combine the water, salt, lemon juice, and honey in a large pitcher or jug.',
        'Stir or whisk until the salt and honey are fully dissolved.',
        'Chill before serving, or serve over ice.',
      ],
      nutritionHighlights: [
        { nutrient: 'Vitamin C', note: 'About 18-22% of a day\'s worth per glass, from the lemon juice.' },
      ],
      conditionNotes: [],
      flavorNotes: 'This tastes like a light, gently salty lemonade, refreshing rather than sweet, with the salt working in the background to make it thirst-quenching rather than just sugary.',
    },
  },
  {
    id: 'recipe-bev-iced-green-tea-mint',
    category: 'recipes',
    title: 'Iced Green Tea with Mint',
    teaser: 'A simple, refreshing steeped tea with fresh mint.',
    summary: 'Green tea\'s own catechin content is one of the most consistently studied plant compounds for antioxidant activity.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_bev_iced_green_tea_mint',
    linkedBuilderType: 'beverage',
    recipeCard: {
      yield: 'Makes about 4 cups. A pitcher-style drink: brew it once, keep it cold, and it\'ll cover 2 people for a couple of days.',
      ingredients: [
        { text: '1000ml brewed green tea, cooled' },
        { text: '5g (a small handful) fresh spearmint leaves, torn' },
      ],
      instructions: [
        'Brew the green tea according to the package (usually 2-3 minutes in water just under a boil, since fully boiling water can make green tea taste bitter).',
        'Let it cool to room temperature.',
        'Tear the mint leaves to release their oils and stir them into the tea.',
        'Refrigerate for at least an hour so the mint flavor has time to steep in, then serve over ice.',
      ],
      nutritionHighlights: [
        { nutrient: 'Manganese', note: 'Around 48-62% of a day\'s worth per cup.' },
        { nutrient: 'Riboflavin (B2)', note: 'About 11-13% of a day\'s target per cup.' },
      ],
      conditionNotes: [],
      flavorNotes: 'Cold, lightly grassy green tea with a cooling lift from fresh mint, crisp and clean rather than sweet, closer to a herbal refresher than a soft drink.',
    },
  },
  {
    id: 'recipe-bev-golden-milk',
    category: 'recipes',
    title: 'Golden Milk (Turmeric Latte)',
    teaser: 'A warm, spiced milk drink built around turmeric and pepper.',
    summary: 'Whole milk\'s fat helps the body absorb turmeric\'s curcumin better than turmeric taken in water alone.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_bev_golden_milk',
    linkedBuilderType: 'beverage',
    recipeCard: {
      yield: 'Makes about 2½ cups, 2 mugs, one for each person.',
      ingredients: [
        { text: '600ml whole milk' },
        { text: '4g (about 1½ teaspoons) ground turmeric' },
        { text: '2g (about ½ teaspoon) ground cinnamon' },
        { text: '1g (a pinch) ground black pepper' },
        { text: '20g (about 4 teaspoons) honey' },
      ],
      instructions: [
        'Warm the milk in a small pot over medium-low heat. Don\'t let it come to a full boil.',
        'Whisk in the turmeric, cinnamon, and black pepper until fully combined, with no dry clumps left.',
        'Let it simmer gently for 3-5 minutes so the spices actually infuse into the milk.',
        'Remove from heat and stir in the honey.',
        'Pour into mugs and, if you like a frothier texture, give it a quick whisk right before serving.',
      ],
      nutritionHighlights: [
        { nutrient: 'Riboflavin (B2)', note: 'About 40-47% of a day\'s worth per mug, from the milk.' },
        { nutrient: 'Calcium', note: 'Around 36% of a day\'s target per mug.' },
        { nutrient: 'Vitamin A', note: 'Roughly 15-20% of a day\'s worth per mug.' },
      ],
      conditionNotes: [],
      flavorNotes: 'This drinks like a warm, spiced dessert: earthy turmeric, sweet cinnamon, a gentle honey sweetness, and just enough black pepper in the background to add warmth without any actual heat. Closer to a comfort drink than a health shot.',
    },
  },

  // -------------------------------------------------------------------
  // Desserts -- both real, whole-food-forward treats, sized to yield
  // exactly 2 real servings.
  // -------------------------------------------------------------------
  {
    id: 'recipe-dessert-baked-cinnamon-apples',
    category: 'recipes',
    title: 'Baked Cinnamon Apples',
    teaser: 'Warm, soft fruit dessert with a walnut crunch on top.',
    summary: 'Fruit fiber from the apple itself, plus omega-3 fat and protein from the walnuts, sweetened with a small amount of honey rather than refined sugar.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_dessert_baked_cinnamon_apples',
    linkedBuilderType: 'dessert',
    recipeCard: {
      yield: 'Makes 2 baked apple halves-worth (about 300g apple total), 1 serving per person.',
      ingredients: [
        { text: '300g (about 2 medium) apples, cored and sliced' },
        { text: '1.5g (about ¼ teaspoon) ground cinnamon' },
        { text: '30g (about ¼ cup) walnuts, chopped, for topping' },
        { text: '15g (about 1 tablespoon) honey' },
        { text: '7.5g (about ½ tablespoon) salted butter' },
      ],
      instructions: [
        'Preheat the oven to 375°F (190°C).',
        'Arrange the sliced apples in a small baking dish.',
        'Sprinkle the cinnamon evenly over the apples and drizzle with the honey.',
        'Dot the butter over the top in small pieces.',
        'Bake for 20-25 minutes, until the apples are tender when pierced with a fork and the edges are just starting to caramelize.',
        'Scatter the chopped walnuts over the top right before serving, so they stay crunchy rather than softening in the oven.',
      ],
      nutritionHighlights: [
        { nutrient: 'Manganese', note: 'Around 20-26% of a day\'s worth per serving.' },
        { nutrient: 'Fiber', note: 'About 11-16% of a day\'s target per serving, from the apple itself.' },
      ],
      conditionNotes: [
        { condition: 'Chronic Kidney Disease (and anyone managing kidney stones)', note: 'Walnuts carry a notably high oxalate load. This is a small topping amount, so it\'s unlikely to matter for most people, but if oxalate is something you\'re actively watching, pairing this with a calcium source (a scoop of Greek yogurt alongside it works well) helps offset it.' },
      ],
      flavorNotes: 'Soft, warm, and cinnamon-sweet, with crunch from the walnuts on top. This eats like a fruit dessert rather than a pastry, closer to the inside of an apple pie without the crust.',
    },
  },
  {
    id: 'recipe-dessert-mixed-berry-chia-pudding',
    category: 'recipes',
    title: 'Mixed Berry Chia Pudding',
    teaser: 'A creamy, fiber-rich pudding you make the night before.',
    summary: 'Chia seeds bring omega-3 fat and fiber, and three differently-colored berries each carry their own antioxidant profile.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_dessert_mixed_berry_chia_pudding',
    linkedBuilderType: 'dessert',
    recipeCard: {
      yield: 'Makes about 1 cup, 2 ½-cup servings.',
      ingredients: [
        { text: '30g (about 2 tablespoons) chia seeds' },
        { text: '250ml unsweetened almond milk' },
        { text: '2.5ml (about ½ teaspoon) vanilla extract' },
        { text: '10g (about 2 teaspoons) honey' },
        { text: '37.5g (about ¼ cup) blueberries, whole' },
        { text: '37.5g (about ¼ cup) strawberries, sliced' },
        { text: '37.5g (about ¼ cup) raspberries, whole' },
      ],
      instructions: [
        'Whisk the chia seeds, almond milk, vanilla extract, and honey together in a bowl or jar.',
        'Let it sit for 5 minutes, then whisk again. This breaks up any clumps of chia seeds that try to settle together.',
        'Cover and refrigerate for at least 4 hours, or overnight, until it\'s thickened to a proper pudding consistency.',
        'Give it one more stir before serving, then top with the blueberries, strawberries, and raspberries.',
      ],
      nutritionHighlights: [
        { nutrient: 'Manganese', note: 'Around 49-63% of a day\'s worth per serving.' },
        { nutrient: 'Fiber', note: 'About 22-33% of a day\'s target per serving, mostly from the chia seeds.' },
        { nutrient: 'Vitamin C', note: 'Roughly 20-24% of a day\'s worth per serving, from the berries.' },
      ],
      conditionNotes: [
        { condition: 'Chronic Kidney Disease (and anyone managing kidney stones)', note: 'Chia seeds carry a notably high oxalate load. Pairing this pudding with a calcium source (the almond milk already helps a little, or add a spoonful of yogurt) helps offset it if oxalate is something you\'re watching.' },
      ],
      flavorNotes: 'This lands closer to a fruit-and-seed pudding than a sugary dessert: creamy and just barely sweet, with the tiny chia seeds giving it a tapioca-like texture, and whole berries folded through for bright bursts of tartness.',
    },
  },

  // -------------------------------------------------------------------
  // Fermentations -- all 4 are real, batch/pantry-style ferments (2
  // yogurts, sauerkraut, kombucha): naturally made in a real batch over a
  // real fermentation window, then portioned out over days or weeks, so
  // they all keep their own natural batch size. See lib/digest/
  // fermentedFoods.ts for the real strain-level science behind each
  // culture used here.
  // -------------------------------------------------------------------
  {
    id: 'recipe-ferment-plain-yogurt',
    category: 'recipes',
    title: 'Homemade Plain Yogurt',
    teaser: 'Two live cultures, a warm spot, and time.',
    summary: 'Lactobacillus delbrueckii subsp. bulgaricus and Streptococcus thermophilus are the two cultures Codex Alimentarius\'s own international standard requires for something to legally be called yogurt.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_ferment_plain_yogurt',
    linkedBuilderType: 'fermentation',
    recipeCard: {
      yield: 'Makes about 8 cups. A batch meant to last 2 people a week or more in the fridge, the way a jar of yogurt would.',
      ingredients: [
        { text: '1000ml whole milk, plus 2 tablespoons of a plain live-culture yogurt as your starter' },
      ],
      instructions: [
        'Heat the milk in a pot to about 180°F (82°C), stirring occasionally to keep it from scorching on the bottom. This step denatures the milk proteins, which is what lets the finished yogurt set to a thick texture.',
        'Let the milk cool to about 110-115°F (43-46°C), warm to the touch but not hot enough to burn your finger.',
        'Whisk in the 2 tablespoons of starter yogurt until it\'s fully combined.',
        'Pour into a clean jar or container, cover, and keep it somewhere warm (an oven with just the light on, or a yogurt maker) for 6-12 hours. The longer it sits, the tangier it gets.',
        'Once it\'s thickened and set, refrigerate it for at least a few hours before eating. It firms up further as it chills.',
      ],
      nutritionHighlights: [
        { nutrient: 'Riboflavin (B2)', note: 'Around 16-19% of a day\'s worth per cup.' },
        { nutrient: 'Calcium', note: 'About 14% of a day\'s target per cup.' },
        { nutrient: 'Protein', note: 'Roughly 7-9% of a day\'s worth per cup.' },
      ],
      conditionNotes: [],
      flavorNotes: 'Homemade yogurt tastes noticeably tangier and less sweet than most store-bought tubs, with a thinner, more natural set unless you strain it Greek-style. It\'s a different product from a sweetened commercial cup: plain, a little sour, and ready to be built on with fruit or honey.',
    },
  },
  {
    id: 'recipe-ferment-probiotic-yogurt',
    category: 'recipes',
    title: 'Probiotic-Boosted Yogurt',
    teaser: 'The same base yogurt, with Bifidobacterium and L. acidophilus added in.',
    summary: 'Adding Bifidobacterium species and Lactobacillus acidophilus to a standard yogurt culture is a way to broaden the range of live strains reaching your gut beyond the two cultures required for something to legally be called yogurt at all.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_ferment_probiotic_yogurt',
    linkedBuilderType: 'fermentation',
    recipeCard: {
      yield: 'Makes about 8 cups. A batch meant to last 2 people a week or more in the fridge.',
      ingredients: [
        { text: '1000ml whole milk, plus a starter culture blend containing S. thermophilus, L. bulgaricus, L. acidophilus, and Bifidobacterium species (a probiotic-labeled starter yogurt or a powdered starter blend both work)' },
      ],
      instructions: [
        'Heat the milk in a pot to about 180°F (82°C), stirring occasionally to keep it from scorching.',
        'Let it cool to about 110-115°F (43-46°C).',
        'Whisk in the starter culture blend until fully combined.',
        'Pour into a clean jar or container, cover, and keep it somewhere warm for 8-12 hours, a little longer than a plain culture, since Bifidobacterium species tend to grow more slowly and benefit from the extra time.',
        'Refrigerate once set, for at least a few hours before eating.',
      ],
      nutritionHighlights: [
        { nutrient: 'Riboflavin (B2)', note: 'Around 16-19% of a day\'s worth per cup.' },
        { nutrient: 'Calcium', note: 'About 14% of a day\'s target per cup.' },
        { nutrient: 'Protein', note: 'Roughly 7-9% of a day\'s worth per cup.' },
      ],
      conditionNotes: [],
      flavorNotes: 'Tastes very close to the plain version, tangy and thick, not sweet, though the extra culture blend can give it a slightly softer set and a touch more sourness depending on how long it ferments.',
    },
  },
  {
    id: 'recipe-ferment-sauerkraut',
    category: 'recipes',
    title: 'Classic Sauerkraut',
    teaser: 'Cabbage and salt, fermented by the wild bacteria already on the leaves.',
    summary: 'Documented microbial succession happens in a fermenting brine: Leuconostoc mesenteroides gets things started, then Lactobacillus plantarum takes over and dominates the finished ferment.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_ferment_sauerkraut',
    linkedBuilderType: 'fermentation',
    recipeCard: {
      yield: 'Makes about 4 cups. A fermented batch, kept in the fridge, easily lasts 2 people several weeks as a regular side.',
      ingredients: [
        { text: '1000g (about 1 medium head) cabbage, shredded' },
        { text: '20g (about 1½ tablespoons) salt' },
      ],
      instructions: [
        'Toss the shredded cabbage with the salt in a large bowl.',
        'Massage and squeeze the cabbage with your hands for 5-10 minutes, until it releases its own liquid and softens noticeably.',
        'Pack the cabbage tightly into a clean jar, pressing down firmly so the liquid rises above the cabbage itself. This liquid is what keeps oxygen out and lets fermentation happen safely.',
        'Weigh the cabbage down (a smaller jar filled with water, or a fermentation weight, works) so it stays fully submerged.',
        'Cover loosely (a ferment needs to release gas) and leave it at room temperature for 1-4 weeks, tasting every few days until it reaches the tang you like.',
        'Once it tastes right, move it to the fridge, which slows the fermentation way down and lets you keep it for months.',
      ],
      nutritionHighlights: [
        { nutrient: 'Vitamin K', note: 'A striking 79-106% of a day\'s worth per half-cup serving.' },
        { nutrient: 'Vitamin C', note: 'Around 51-61% of a day\'s target per serving.' },
        { nutrient: 'Fiber', note: 'About 8-13% of a day\'s worth per serving.' },
      ],
      conditionNotes: [
        { condition: 'Hashimoto\'s', note: 'Raw cabbage carries a goitrogenic compound that can interfere with the thyroid\'s own iodine uptake in large, regular raw amounts. Fermentation helps here: the fermentation process itself, and the acidity it produces, measurably reduces this compound compared to eating the cabbage fully raw, which is part of why fermented cabbage is generally treated more leniently than a raw cabbage salad.' },
      ],
      flavorNotes: 'Homemade sauerkraut is noticeably sour and a little effervescent, with a crunch that store-bought pasteurized kraut (which kills off the live cultures and softens the texture) just doesn\'t have. The exact tang and complexity shift as it ferments longer, so tasting along the way is part of the process.',
    },
  },
  {
    id: 'recipe-ferment-kombucha',
    category: 'recipes',
    title: 'Home-Brewed Kombucha',
    teaser: 'Sweetened tea, fermented by a SCOBY culture.',
    summary: 'A SCOBY (symbiotic culture of bacteria and yeast) eats most of the added sugar during fermentation, converting it into acids and a small amount of natural carbonation.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_ferment_kombucha',
    linkedBuilderType: 'fermentation',
    recipeCard: {
      yield: 'Makes about 8 cups. A batch meant to be brewed once and shared across a week or more between 2 people.',
      ingredients: [
        { text: '2000ml brewed black tea, cooled to room temperature' },
        { text: '200g (about 1 cup) cane sugar' },
        { text: 'A SCOBY (symbiotic culture of bacteria and yeast), plus about 1 cup of starter liquid from a previous batch or a bottle of plain, unflavored, unpasteurized kombucha' },
      ],
      instructions: [
        'Brew the black tea strong and dissolve the sugar into it while it\'s still hot, then let it cool completely to room temperature. Adding a SCOBY to hot tea will kill it.',
        'Pour the sweetened tea into a large glass jar and add the SCOBY and starter liquid.',
        'Cover the jar with a breathable cloth, not an airtight lid, since the culture needs some airflow, and secure it with a rubber band.',
        'Let it sit somewhere out of direct sunlight for 7-14 days, tasting it every couple of days starting around day 7 until it reaches a balance of sweet and tart that you like.',
        'For a fizzier drink, bottle it in a sealed bottle for another 2-3 days at room temperature (this second, sealed ferment is what builds carbonation), then refrigerate.',
      ],
      nutritionHighlights: [
        { nutrient: 'Manganese', note: 'Around 32-40% of a day\'s worth per cup.' },
      ],
      conditionNotes: [],
      flavorNotes: 'Homemade kombucha lands somewhere between a tart apple cider vinegar and a light, effervescent soda: tangy, a little funky, and alive in a way flat, shelf-stable drinks aren\'t. The exact flavor shifts with brew time, so a shorter ferment stays sweeter and a longer one gets noticeably more sour.',
    },
  },

  // -------------------------------------------------------------------
  // Handhelds -- 4 real sandwiches/wraps/tacos, each scaled to feed 2.
  // -------------------------------------------------------------------
  {
    id: 'recipe-handheld-turkey-avocado-wrap',
    category: 'recipes',
    title: 'Turkey & Avocado Wrap',
    teaser: 'A lean, protein-forward wrap built around sliced turkey.',
    summary: 'Turkey breast is one of the leanest common protein sources available, delivering protein and B vitamins without much saturated fat.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_handheld_turkey_avocado_wrap',
    linkedBuilderType: 'handheld',
    recipeCard: {
      yield: 'Makes 2 wraps, 1 wrap per person.',
      ingredients: [
        { text: '2 large flour tortillas' },
        { text: '200g (about 7oz) turkey breast, sliced' },
        { text: '160g (about 1 large) avocado, sliced' },
        { text: '60g (about 2 cups) green leaf lettuce' },
        { text: '120g (about 1 large) tomato, sliced' },
      ],
      instructions: [
        'Lay each tortilla flat and layer the lettuce down the center first, so it acts as a barrier that keeps the tortilla from getting soggy from the tomato.',
        'Add the sliced turkey, avocado, and tomato on top of the lettuce.',
        'Fold in the two sides of the tortilla, then roll it tightly from the bottom up, tucking the filling in as you go.',
        'Slice each wrap in half on a diagonal before serving.',
      ],
      nutritionHighlights: [
        { nutrient: 'Niacin (B3)', note: 'A striking 76-87% of a day\'s worth per wrap, mostly from the turkey.' },
        { nutrient: 'Vitamin B6', note: 'Around 81% of a day\'s target per wrap.' },
        { nutrient: 'Vitamin K', note: 'About 49-65% of a day\'s worth per wrap, from the greens.' },
        { nutrient: 'Protein', note: 'Roughly half a day\'s target per wrap.' },
      ],
      conditionNotes: [],
      flavorNotes: 'Fresh, clean, and satisfying: lean turkey and creamy avocado against crisp lettuce and juicy tomato, all wrapped up in a soft tortilla. This is straightforward, deli-counter-quality flavor with nothing to hide behind.',
    },
  },
  {
    id: 'recipe-handheld-grilled-chicken-sandwich',
    category: 'recipes',
    title: 'Grilled Chicken Sandwich',
    teaser: 'A grilled chicken breast on whole-grain bread.',
    summary: 'Grilling chicken breast at high, dry heat produces measurably more advanced glycation end-products than gentler cooking methods, worth knowing if you eat grilled meat often, without meaning you need to avoid grilling altogether.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_handheld_grilled_chicken_sandwich',
    linkedBuilderType: 'handheld',
    recipeCard: {
      yield: 'Makes 2 sandwiches, 1 sandwich per person.',
      ingredients: [
        { text: '4 slices whole-grain bread' },
        { text: '240g (about 2 breasts) chicken breast, skinless and boneless, grilled' },
        { text: '40g (about 1½ cups) green leaf lettuce' },
        { text: '80g (about ¾ large) tomato, sliced' },
        { text: '80g (about ½ large) avocado, sliced' },
      ],
      instructions: [
        'Season the chicken breasts with salt and pepper (or your own preferred spices) and grill over medium-high heat for about 6-7 minutes per side, until the internal temperature reaches 165°F (74°C) and the juices run clear.',
        'Let the chicken rest for 5 minutes before slicing. This keeps it juicy rather than letting the juices run out the moment you cut it.',
        'Slice the rested chicken and layer it onto the bread with the lettuce, tomato, and avocado.',
        'Assemble the sandwiches and serve.',
      ],
      nutritionHighlights: [
        { nutrient: 'Vitamin B6', note: 'A striking 123% of a day\'s worth per sandwich.' },
        { nutrient: 'Niacin (B3)', note: 'Around 103-117% of a day\'s target per sandwich.' },
        { nutrient: 'Protein', note: 'About 79-96% of a day\'s worth per sandwich.' },
        { nutrient: 'Fiber', note: 'Roughly 28-42% of a day\'s target per sandwich, from the whole-grain bread.' },
      ],
      conditionNotes: [
        { condition: 'Hashimoto\'s / Celiac / Psoriasis / Rheumatoid Arthritis', note: 'This uses whole-grain bread, so it carries gluten as written. Swapping in a gluten-free sandwich bread works directly in this same recipe.' },
      ],
      flavorNotes: 'Smoky, charred edges on the chicken from the grill, layered with creamy avocado and fresh, juicy tomato: a hearty sandwich that eats more like a meal than a snack.',
    },
  },
  {
    id: 'recipe-handheld-black-bean-sweet-potato-tacos',
    category: 'recipes',
    title: 'Black Bean & Sweet Potato Tacos',
    teaser: 'Roasted sweet potato and black beans in a warm tortilla.',
    summary: 'Sweet potato\'s own orange color comes from beta-carotene, which the body converts into vitamin A.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_handheld_black_bean_sweet_potato_tacos',
    linkedBuilderType: 'handheld',
    recipeCard: {
      yield: 'Makes 2 tacos, 1 taco per person.',
      ingredients: [
        { text: '2 small flour tortillas' },
        { text: '150g (about ¾ cup) black beans' },
        { text: '150g (about 1 medium) sweet potato, cubed and roasted' },
        { text: '60g (about ½ small) avocado, sliced' },
        { text: '15g (juice of about 1 lime)' },
        { text: '5g (a small handful) fresh cilantro leaves, chopped' },
      ],
      instructions: [
        'Preheat the oven to 400°F (200°C). Toss the cubed sweet potato with a little oil and salt, spread on a baking sheet, and roast for 20-25 minutes, until fork-tender and caramelized at the edges.',
        'Warm the black beans in a small pot, or in the microwave, until heated through.',
        'Warm the tortillas briefly in a dry skillet, about 30 seconds per side, until pliable.',
        'Fill each tortilla with roasted sweet potato and black beans.',
        'Top with sliced avocado and chopped cilantro, and finish with a squeeze of fresh lime juice.',
      ],
      nutritionHighlights: [
        { nutrient: 'Vitamin A', note: 'A striking 81-104% of a day\'s worth per serving, from the sweet potato.' },
        { nutrient: 'Thiamin (B1)', note: 'Around 70-76% of a day\'s target per serving.' },
        { nutrient: 'Fiber', note: 'About 46-69% of a day\'s worth per serving.' },
      ],
      conditionNotes: [
        { condition: 'Inflammatory Bowel Disease / Irritable Bowel Syndrome / Celiac', note: 'Black beans carry a fair amount of fermentable fiber that some people with an already-sensitive gut find harder to digest. If that\'s you, a smaller portion of beans, or swapping in a well-rinsed canned bean (which reduces some of the fermentable content), can make this easier on the gut.' },
        { condition: 'Chronic Kidney Disease (and anyone managing kidney stones)', note: 'Sweet potato carries a notably elevated oxalate content. Pairing it with a calcium source at the same meal helps offset it if that\'s something you\'re watching.' },
      ],
      flavorNotes: 'Sweet, caramelized roasted sweet potato against the earthiness of black beans, brightened by fresh lime and cilantro: a satisfying vegetarian taco with plenty of textural contrast between the soft filling and the creamy avocado on top.',
    },
  },
  {
    id: 'recipe-handheld-egg-salad-lettuce-wraps',
    category: 'recipes',
    title: 'Egg Salad Lettuce Wraps',
    teaser: 'A low-carb take on classic egg salad.',
    summary: 'Egg yolks are one of the most concentrated food sources of choline, a nutrient most people don\'t get enough of.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_handheld_egg_salad_lettuce_wraps',
    linkedBuilderType: 'handheld',
    recipeCard: {
      yield: 'Makes 2 wraps, 1 wrap per person.',
      ingredients: [
        { text: '4 eggs, hard-boiled' },
        { text: '30g (about 2 tablespoons) mayonnaise' },
        { text: '40g (about ¼ cup) celery, diced' },
        { text: '60g (about 2 large leaves) green leaf lettuce' },
        { text: '5g (about 1 teaspoon) prepared yellow mustard' },
      ],
      instructions: [
        'Bring a pot of water to a boil, gently lower in the eggs, and boil for 10-12 minutes for a fully set yolk.',
        'Transfer the eggs immediately to an ice bath to stop them cooking further, then peel once cool.',
        'Chop the peeled eggs and combine them in a bowl with the mayonnaise, diced celery, and mustard.',
        'Mix until well combined, mashing the yolks slightly to help everything bind together.',
        'Spoon the egg salad into the lettuce leaves and fold or roll them like a wrap.',
      ],
      nutritionHighlights: [
        { nutrient: 'Choline', note: 'A solid 54-71% of a day\'s worth per wrap, mostly from the egg yolks.' },
        { nutrient: 'Vitamin K', note: 'Around 50-67% of a day\'s target per wrap.' },
        { nutrient: 'Riboflavin (B2)', note: 'About 43-51% of a day\'s worth per wrap.' },
        { nutrient: 'Protein', note: 'Roughly a quarter of a day\'s target per wrap.' },
      ],
      conditionNotes: [],
      flavorNotes: 'Creamy, savory egg salad with a little tang from the mustard and a good crunch from the celery, wrapped in cool, crisp lettuce instead of bread. Lighter than a sandwich but every bit as filling.',
    },
  },

  // -------------------------------------------------------------------
  // Salads -- all 6 already yield exactly 2 real servings as written, no
  // scaling needed.
  // -------------------------------------------------------------------
  {
    id: 'recipe-salad-mediterranean-chickpea-feta',
    category: 'recipes',
    title: 'Mediterranean Chickpea & Feta',
    teaser: 'A hearty, protein-rich salad built on chickpeas and feta.',
    summary: 'Chickpeas bring plant protein and fiber together, a combination that helps slow how quickly the meal\'s own carbohydrates raise blood sugar.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_salad_mediterranean_chickpea_feta',
    linkedBuilderType: 'salad',
    recipeCard: {
      yield: 'Makes about 4 cups, 2 2-cup servings.',
      ingredients: [
        { text: '1 cup chickpeas, whole' },
        { text: '½ cup feta, crumbled' },
        { text: '1 cup cucumber, diced' },
        { text: '1 cup tomato, diced' },
        { text: '¼ cup onion, diced' },
        { text: '2 tablespoons olive oil' },
        { text: '1 tablespoon lemon juice' },
        { text: '1 teaspoon dried oregano' },
      ],
      instructions: [
        'Combine the chickpeas, feta, cucumber, tomato, and onion in a large bowl.',
        'Whisk the olive oil, lemon juice, and oregano together in a small bowl to make the dressing.',
        'Pour the dressing over the salad and toss gently to combine, being careful not to break up the feta too much.',
        'Let it sit for 5-10 minutes before serving, if you have the time. This gives the flavors a chance to meld together.',
      ],
      nutritionHighlights: [
        { nutrient: 'Vitamin B6', note: 'A striking 179% of a day\'s worth per serving.' },
        { nutrient: 'Manganese', note: 'Around 85-109% of a day\'s target per serving.' },
        { nutrient: 'Fiber', note: 'About 51-78% of a day\'s worth per serving, from the chickpeas.' },
        { nutrient: 'Iron', note: 'Roughly 25-57% of a day\'s target per serving.' },
      ],
      conditionNotes: [
        { condition: 'Inflammatory Bowel Disease / Irritable Bowel Syndrome / Celiac', note: 'Chickpeas carry a fair amount of fermentable fiber that can be harder on an already-sensitive gut. A smaller portion, or a well-rinsed canned chickpea, tends to sit easier if that\'s a concern for you.' },
      ],
      flavorNotes: 'Bright and tangy from the lemon and oregano, with salty richness from the feta against the cool crunch of cucumber and tomato: a simple, no-cook Mediterranean-style salad that tastes like it took more effort than it actually did.',
    },
  },
  {
    id: 'recipe-salad-kale-citrus-iron',
    category: 'recipes',
    title: 'Kale & Citrus Iron Boost',
    teaser: 'Raw kale paired with orange for a vitamin C boost.',
    summary: 'Vitamin C measurably improves how well the body absorbs the non-heme iron found in plant foods, which is exactly why the orange is paired with the kale here.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_salad_kale_citrus_iron',
    linkedBuilderType: 'salad',
    recipeCard: {
      yield: 'Makes about 4 cups, 2 2-cup servings.',
      ingredients: [
        { text: '3 cups kale, chopped' },
        { text: '1 orange, sliced' },
        { text: '2 tablespoons onion, sliced' },
        { text: '2 tablespoons pumpkin seeds, whole' },
        { text: '1 tablespoon olive oil' },
        { text: '1 tablespoon lemon juice' },
      ],
      instructions: [
        'Massage the chopped kale with a small pinch of salt and a few drops of the olive oil for about 2 minutes, until it visibly softens and darkens slightly. This simple step breaks down kale\'s naturally tough texture and makes it far more pleasant to eat raw.',
        'Add the sliced orange, onion, and pumpkin seeds to the massaged kale.',
        'Whisk the remaining olive oil with the lemon juice and drizzle it over the salad.',
        'Toss well and serve.',
      ],
      nutritionHighlights: [
        { nutrient: 'Vitamin K', note: 'An exceptional 326-435% of a day\'s worth per serving, from the kale.' },
        { nutrient: 'Vitamin C', note: 'A striking 147-176% of a day\'s target per serving.' },
        { nutrient: 'Manganese', note: 'Around 57-72% of a day\'s worth per serving.' },
        { nutrient: 'Vitamin A', note: 'About 28-36% of a day\'s target per serving.' },
      ],
      conditionNotes: [
        { condition: 'Hashimoto\'s', note: 'Raw kale carries a goitrogenic compound that can interfere with the thyroid\'s own iodine uptake when eaten raw and often. It\'s well tolerated in normal portions like this one for most people, but if you\'re eating raw cruciferous vegetables like this daily, lightly steaming the kale first is an easy way to reduce that compound while keeping most of the nutrition.' },
      ],
      flavorNotes: 'Earthy, slightly bitter kale balanced against sweet, juicy orange segments and a little sharpness from raw onion, with pumpkin seeds adding good crunch. The massage step noticeably changes kale\'s texture from tough to tender, which makes a big difference here.',
    },
  },
  {
    id: 'recipe-salad-sesame-ginger-slaw',
    category: 'recipes',
    title: 'Sesame Ginger Cabbage & Carrot Slaw',
    teaser: 'A crunchy raw slaw with sesame and ginger flavor.',
    summary: 'Rice vinegar\'s acidity, plus the natural crunch of raw cabbage and carrot, makes this a light, low-calorie side with good texture.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_salad_sesame_ginger_slaw',
    linkedBuilderType: 'salad',
    recipeCard: {
      yield: 'Makes about 4 cups, 2 2-cup servings.',
      ingredients: [
        { text: '3 cups cabbage, shredded' },
        { text: '1 cup carrot, grated' },
        { text: '1 tablespoon sesame seeds, whole' },
        { text: '1 teaspoon fresh ginger, grated' },
        { text: '2 tablespoons rice vinegar' },
        { text: '1 teaspoon honey' },
        { text: '1 tablespoon olive oil' },
      ],
      instructions: [
        'Combine the shredded cabbage, grated carrot, and sesame seeds in a large bowl.',
        'Whisk the grated ginger, rice vinegar, honey, and olive oil together in a small bowl to make the dressing.',
        'Pour the dressing over the slaw and toss well to coat everything evenly.',
        'Let it sit for at least 10 minutes before serving. The cabbage softens slightly and takes on more of the dressing\'s flavor the longer it sits.',
      ],
      nutritionHighlights: [
        { nutrient: 'Vitamin K', note: 'A solid 93-124% of a day\'s worth per serving.' },
        { nutrient: 'Vitamin C', note: 'Around 56-67% of a day\'s target per serving.' },
        { nutrient: 'Vitamin A', note: 'About 44-57% of a day\'s worth per serving.' },
      ],
      conditionNotes: [
        { condition: 'Hashimoto\'s', note: 'Raw cabbage carries a goitrogenic compound relevant to thyroid iodine uptake, and this is a fairly large raw cabbage portion. If you eat cabbage this way often, occasionally swapping in a lightly steamed slaw keeps the crunch while reducing that compound.' },
        { condition: 'Irritable Bowel Syndrome', note: 'Vinegar-based dressings are a known digestive irritant for some people with IBS. If that\'s you, a milder dressing built on a splash of orange or lime juice instead of vinegar can be substituted directly.' },
      ],
      flavorNotes: 'Crisp and crunchy from the raw cabbage and carrot, with a sharp gingery bite and a savory-sweet dressing that balances the vinegar\'s sharpness. The toasted flavor of the sesame seeds ties the whole thing together.',
    },
  },
  {
    id: 'recipe-salad-beet-walnut-arugula',
    category: 'recipes',
    title: 'Roasted Beet, Walnut & Arugula',
    teaser: 'Sweet roasted beets against sharp, peppery arugula.',
    summary: 'Roasting beets concentrates their natural sweetness in a way boiling doesn\'t, since less of their natural sugar leaches out into the cooking water.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_salad_beet_walnut_arugula',
    linkedBuilderType: 'salad',
    recipeCard: {
      yield: 'Makes about 4 cups, 2 2-cup servings.',
      ingredients: [
        { text: '1½ cups beets, diced and roasted' },
        { text: '¼ cup walnuts, chopped' },
        { text: '2 cups arugula, whole' },
        { text: '¼ cup feta, crumbled' },
        { text: '1 tablespoon balsamic vinegar' },
        { text: '1 tablespoon olive oil' },
      ],
      instructions: [
        'Preheat the oven to 400°F (200°C). Toss the diced beets with a little oil, spread on a baking sheet, and roast for 25-30 minutes, until fork-tender.',
        'Let the roasted beets cool slightly.',
        'Arrange the arugula on a plate or in a bowl and top with the roasted beets, walnuts, and feta.',
        'Whisk the balsamic vinegar and olive oil together and drizzle over the salad right before serving, so the arugula doesn\'t wilt too early.',
      ],
      nutritionHighlights: [
        { nutrient: 'Manganese', note: 'Around 35-45% of a day\'s worth per serving.' },
        { nutrient: 'Vitamin K', note: 'About 19-25% of a day\'s target per serving, from the arugula.' },
        { nutrient: 'Iron', note: 'Roughly 9-21% of a day\'s worth per serving.' },
      ],
      conditionNotes: [
        { condition: 'Hashimoto\'s', note: 'Raw arugula carries a goitrogenic compound relevant to thyroid iodine uptake, though it\'s a smaller amount than a food like raw kale or cabbage and is generally well tolerated in a normal portion like this one.' },
        { condition: 'Chronic Kidney Disease (and anyone managing kidney stones)', note: 'Walnuts carry a notably elevated oxalate load. Pairing them with a calcium source (the feta in this same salad already helps) is an easy way to offset it.' },
        { condition: 'Irritable Bowel Syndrome', note: 'Balsamic vinegar is a known digestive irritant for some people with IBS. A citrus-based dressing can be substituted directly if vinegar tends to bother you.' },
      ],
      flavorNotes: 'Earthy, sweet roasted beets against arugula\'s peppery bite, with salty feta and a good crunch from the walnuts: a fine balance of sweet, sharp, salty, and crunchy all in one bowl.',
    },
  },
  {
    id: 'recipe-salad-southwest-quinoa-black-bean',
    category: 'recipes',
    title: 'Southwest Quinoa & Black Bean',
    teaser: 'A hearty grain-and-bean salad with southwest flavor.',
    summary: 'Quinoa is a complete plant protein, containing all nine essential amino acids, which is uncommon among plant foods.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_salad_southwest_quinoa_black_bean',
    linkedBuilderType: 'salad',
    recipeCard: {
      yield: 'Makes about 4 cups, 2 2-cup servings.',
      ingredients: [
        { text: '1½ cups quinoa, cooked' },
        { text: '1 cup black beans, whole' },
        { text: '¾ cup sweet corn, whole kernels' },
        { text: '1 avocado, diced' },
        { text: '½ cup red bell pepper, diced' },
        { text: '2 tablespoons lime juice' },
        { text: '2 tablespoons fresh cilantro, chopped' },
        { text: '½ teaspoon ground cumin' },
      ],
      instructions: [
        'Cook the quinoa according to the package (usually a 2:1 ratio of water to quinoa, simmered covered for about 15 minutes, then rested off heat for 5 more).',
        'Let the cooked quinoa cool to room temperature.',
        'Combine the cooled quinoa, black beans, corn, avocado, and red bell pepper in a large bowl.',
        'Whisk the lime juice and cumin together, then pour over the salad.',
        'Toss gently, fold in the fresh cilantro, and serve.',
      ],
      nutritionHighlights: [
        { nutrient: 'Manganese', note: 'A solid 66-84% of a day\'s worth per serving.' },
        { nutrient: 'Fiber', note: 'Around 48-73% of a day\'s target per serving.' },
        { nutrient: 'Magnesium', note: 'About 50-65% of a day\'s worth per serving.' },
        { nutrient: 'Iron', note: 'Roughly 32-71% of a day\'s target per serving.' },
      ],
      conditionNotes: [
        { condition: 'Inflammatory Bowel Disease / Irritable Bowel Syndrome / Celiac', note: 'Black beans carry a fair amount of fermentable fiber that can be harder on an already-sensitive gut. A smaller bean portion tends to sit easier if that\'s a concern.' },
      ],
      flavorNotes: 'Nutty quinoa, earthy black beans, and sweet corn come together with a bright, citrusy lime dressing and a warm hit of cumin: creamy avocado ties the whole thing together into a filling southwest-style bowl.',
    },
  },
  {
    id: 'recipe-salad-spinach-strawberry-almond',
    category: 'recipes',
    title: 'Spinach, Strawberry & Almond',
    teaser: 'A classic sweet-and-savory salad pairing.',
    summary: 'Strawberries are one of the few fruits that rival citrus for vitamin C content per serving.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_salad_spinach_strawberry_almond',
    linkedBuilderType: 'salad',
    recipeCard: {
      yield: 'Makes about 4 cups, 2 2-cup servings.',
      ingredients: [
        { text: '3 cups spinach, whole' },
        { text: '1 cup strawberries, sliced' },
        { text: '¼ cup almonds, sliced' },
        { text: '2 tablespoons onion, sliced' },
        { text: '1 tablespoon balsamic vinegar' },
        { text: '1 tablespoon olive oil' },
      ],
      instructions: [
        'Combine the spinach, sliced strawberries, sliced almonds, and onion in a large bowl.',
        'Whisk the balsamic vinegar and olive oil together to make the dressing.',
        'Drizzle the dressing over the salad right before serving and toss gently, so the spinach doesn\'t wilt too far ahead of time.',
      ],
      nutritionHighlights: [
        { nutrient: 'Vitamin K', note: 'An exceptional 183-243% of a day\'s worth per serving, from the spinach.' },
        { nutrient: 'Vitamin C', note: 'A solid 65-77% of a day\'s target per serving.' },
        { nutrient: 'Manganese', note: 'Around 44-56% of a day\'s worth per serving.' },
      ],
      conditionNotes: [
        { condition: 'Chronic Kidney Disease (and anyone managing kidney stones)', note: 'Both raw spinach and almonds carry a notably high oxalate load, and this salad has meaningful amounts of both. Pairing this with a calcium source at the same meal (a side of yogurt, or a sprinkle of cheese) is a practical way to help offset it if oxalate is something you\'re watching.' },
        { condition: 'Irritable Bowel Syndrome', note: 'Balsamic vinegar is a known digestive irritant for some people with IBS. A squeeze of fresh orange juice makes an easy substitute in the dressing.' },
      ],
      flavorNotes: 'Sweet, juicy strawberries against spinach\'s own mild, slightly earthy leaves, with good crunch from the sliced almonds and a tangy balsamic dressing tying it all together: a classic combination for good reason.',
    },
  },

  // -------------------------------------------------------------------
  // Sauces -- all 4 are real, batch/pantry-style condiments made once and
  // used from over several meals, so they keep their own natural batch
  // size.
  // -------------------------------------------------------------------
  {
    id: 'recipe-sauce-basic-tomato',
    category: 'recipes',
    title: 'Basic Tomato Sauce',
    teaser: 'A simple tomato sauce built from scratch.',
    summary: 'Cooking tomatoes actually increases how available their lycopene is for the body to absorb, unlike most nutrients, which cooking tends to reduce.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_sauce_basic_tomato',
    linkedBuilderType: 'sauce',
    recipeCard: {
      yield: 'Makes about 3 cups. A batch condiment meant to cover 2 people over multiple meals.',
      ingredients: [
        { text: '600g (about 4 cups) tomatoes, chopped' },
        { text: '6g (about 2 cloves) garlic, minced' },
        { text: '80g (about ½ cup) onion, diced' },
        { text: '20ml (about 1½ tablespoons) olive oil' },
        { text: '5g (a small handful) fresh basil, chopped' },
        { text: '3g (about ½ teaspoon) salt' },
      ],
      instructions: [
        'Heat the olive oil in a pot over medium heat and sauté the onion for 4-5 minutes, until soft and translucent.',
        'Add the garlic and cook for another minute, just until fragrant. Garlic burns quickly, so don\'t walk away here.',
        'Add the chopped tomatoes and salt, and bring to a simmer.',
        'Let it simmer uncovered for 25-30 minutes, stirring occasionally, until it\'s reduced and thickened to a proper sauce consistency.',
        'Stir in the fresh basil right at the end, off the heat, so it stays bright and doesn\'t turn bitter from prolonged cooking.',
        'For a smoother sauce, blend it with an immersion blender once cooked.',
      ],
      nutritionHighlights: [
        { nutrient: 'Vitamin C', note: 'Around 22-27% of a day\'s worth per half-cup serving.' },
        { nutrient: 'Vitamin K', note: 'About 17-23% of a day\'s target per serving.' },
      ],
      conditionNotes: [],
      flavorNotes: 'Bright tomato flavor with a natural sweetness that develops as it simmers and reduces, rounded out by garlic and fresh basil at the end. This is closer to an Italian nonna\'s weeknight sauce than a jarred version: simple, honest, and versatile.',
    },
  },
  {
    id: 'recipe-sauce-garlic-herb-vinaigrette',
    category: 'recipes',
    title: 'Garlic Herb Vinaigrette',
    teaser: 'A whisked-from-scratch salad dressing.',
    summary: 'Mustard acts as an emulsifier here, helping the oil and vinegar stay combined instead of separating the way a plain oil-and-vinegar dressing does.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_sauce_garlic_herb_vinaigrette',
    linkedBuilderType: 'sauce',
    recipeCard: {
      yield: 'Makes about 1 cup. A batch dressing meant to cover 2 people\'s salads for a week or more.',
      ingredients: [
        { text: '60ml (about ¼ cup) olive oil' },
        { text: '30ml (about 2 tablespoons) balsamic vinegar' },
        { text: '4g (about 1 clove) garlic, minced' },
        { text: '5g (about 1 teaspoon) prepared yellow mustard' },
        { text: '1g (a pinch) salt' },
        { text: '1g (a pinch) ground black pepper' },
      ],
      instructions: [
        'Combine the balsamic vinegar, minced garlic, mustard, salt, and pepper in a jar or bowl.',
        'While whisking constantly (or with the jar sealed and shaking), slowly stream in the olive oil.',
        'Keep whisking or shaking until the dressing looks smooth and combined rather than separated.',
        'Store in a sealed jar in the fridge, and give it a good shake before each use, since it will naturally separate a little as it sits.',
      ],
      nutritionHighlights: [],
      conditionNotes: [
        { condition: 'Irritable Bowel Syndrome', note: 'Balsamic vinegar is a known digestive irritant for some people with IBS. Substituting fresh citrus juice for the vinegar keeps this same dressing structure while avoiding that trigger.' },
      ],
      flavorNotes: 'Sharp and tangy from the balsamic, mellowed by garlic and a touch of mustard, this coats a salad without drowning it. A handy, all-purpose dressing worth keeping stocked in the fridge.',
    },
  },
  {
    id: 'recipe-sauce-simple-pesto',
    category: 'recipes',
    title: 'Simple Pesto',
    teaser: 'Fresh basil, pine nuts, and Parmesan, blended together.',
    summary: 'Fresh basil is a concentrated source of vitamin K, and this whole sauce is built around it rather than the small amount most dishes get from a garnish sprig.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_sauce_simple_pesto',
    linkedBuilderType: 'sauce',
    recipeCard: {
      yield: 'Makes about 1 cup. A batch sauce meant to cover 2 people\'s meals for a week or more.',
      ingredients: [
        { text: '40g (about 2 cups packed) fresh basil' },
        { text: '20g (about 2 tablespoons) pine nuts' },
        { text: '6g (about 2 cloves) garlic' },
        { text: '60ml (about ¼ cup) olive oil' },
        { text: '20g (about 3 tablespoons) Parmesan, grated' },
        { text: '1g (a pinch) salt' },
      ],
      instructions: [
        'Combine the basil, pine nuts, garlic, and salt in a food processor or blender.',
        'Pulse a few times to break everything down, then, with the machine running, slowly stream in the olive oil until it comes together into a smooth, thick sauce.',
        'Stir in the grated Parmesan by hand at the end (rather than blending it in) so it doesn\'t turn gluey.',
        'Taste and adjust salt as needed. Store in a sealed jar with a thin layer of olive oil on top to help it keep its bright green color longer.',
      ],
      nutritionHighlights: [
        { nutrient: 'Vitamin K', note: 'A striking 72-97% of a day\'s worth per 2-tablespoon serving.' },
        { nutrient: 'Iron', note: 'Around 26-58% of a day\'s target per serving.' },
        { nutrient: 'Manganese', note: 'About 30-39% of a day\'s worth per serving.' },
      ],
      conditionNotes: [
        { condition: 'Chronic Kidney Disease (and anyone managing kidney stones)', note: 'Pine nuts carry a notably elevated oxalate load. Pairing pesto-topped dishes with a calcium source (the Parmesan already in this recipe helps some) is one way to offset it if oxalate is a concern for you.' },
      ],
      flavorNotes: 'Bright, herbaceous, and properly garlicky, with a rich nuttiness from the pine nuts and a savory, salty finish from the Parmesan. This tastes distinctly fresher and more vivid than a jarred pesto that\'s been sitting on a shelf.',
    },
  },
  {
    id: 'recipe-sauce-tahini-lemon',
    category: 'recipes',
    title: 'Tahini Lemon Sauce',
    teaser: 'A creamy, nutty sauce built on sesame paste.',
    summary: 'Tahini is a concentrated source of zinc and magnesium, both minerals many people don\'t get enough of.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_sauce_tahini_lemon',
    linkedBuilderType: 'sauce',
    recipeCard: {
      yield: 'Makes about ¾ cup. A batch sauce meant to cover 2 people\'s meals for a week or more.',
      ingredients: [
        { text: '60g (about ¼ cup) tahini' },
        { text: '30g (juice of about 1 lemon)' },
        { text: '3g (about 1 clove) garlic, minced' },
        { text: '60ml (about ¼ cup) water' },
        { text: '1g (a pinch) salt' },
      ],
      instructions: [
        'Combine the tahini, lemon juice, garlic, and salt in a bowl.',
        'Whisk together. It will look like it\'s seizing up and getting thick and clumpy at first, which is normal.',
        'Slowly whisk in the water, a little at a time, until it loosens back into a smooth, pourable sauce.',
        'Taste and adjust salt or lemon as needed, and thin with a bit more water if you want it looser.',
      ],
      nutritionHighlights: [
        { nutrient: 'Magnesium', note: 'Around 9-11% of a day\'s worth per 2-tablespoon serving.' },
        { nutrient: 'Zinc', note: 'About 6-9% of a day\'s target per serving.' },
      ],
      conditionNotes: [],
      flavorNotes: 'Nutty and rich from the tahini, cut through with bright lemon acidity and a little bite from the garlic: a versatile sauce that works equally well drizzled over roasted vegetables, a grain bowl, or falafel.',
    },
  },

  // -------------------------------------------------------------------
  // Sides -- all 5 originally serve 4, scaled down to 2 real servings.
  // -------------------------------------------------------------------
  {
    id: 'recipe-side-herb-roasted-root-vegetables',
    category: 'recipes',
    title: 'Herb-Roasted Root Vegetable Medley',
    teaser: 'Potato, sweet potato, and onion roasted together.',
    summary: 'Potassium and vitamin C from the potato and sweet potato alike (especially with skins left on), plus beta-carotene from the sweet potato specifically, a different nutrient profile than potato alone.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_side_herb_roasted_potatoes',
    linkedBuilderType: 'side',
    recipeCard: {
      yield: 'Makes about 2 cups, 2 1-cup servings.',
      ingredients: [
        { text: '150g (about 1 medium) potato, diced' },
        { text: '7.5ml (about 1½ teaspoons) olive oil' },
        { text: '3g (about 1 clove) garlic, minced' },
        { text: '1g (about ½ teaspoon) fresh rosemary, chopped' },
        { text: '1g (a pinch) salt' },
        { text: '0.5g (a pinch) ground black pepper' },
        { text: '75g (about ½ small) sweet potato, diced' },
        { text: '30g (about ¼ small) onion, sliced' },
      ],
      instructions: [
        'Preheat the oven to 425°F (220°C).',
        'Toss the diced potato, sweet potato, and sliced onion with the olive oil, garlic, rosemary, salt, and pepper.',
        'Spread the vegetables in a single layer on a baking sheet. Crowding them will make them steam instead of roast, so use two sheets if needed.',
        'Roast for 25-30 minutes, flipping halfway through, until tender inside and golden and crisp at the edges.',
      ],
      nutritionHighlights: [
        { nutrient: 'Vitamin A', note: 'Around 40-52% of a day\'s worth per serving, from the sweet potato.' },
        { nutrient: 'Potassium', note: 'About 17-22% of a day\'s target per serving.' },
        { nutrient: 'Fiber', note: 'Roughly 10-15% of a day\'s worth per serving.' },
      ],
      conditionNotes: [
        { condition: 'Chronic Kidney Disease (and anyone managing kidney stones)', note: 'Sweet potato carries a notably elevated oxalate content. Pairing this side with a calcium-containing dish at the same meal helps offset it if that\'s something you\'re watching.' },
      ],
      flavorNotes: 'Crispy, caramelized edges on the outside with a soft, tender bite inside, seasoned simply with rosemary and garlic: a comforting side that goes with almost anything.',
    },
  },
  {
    id: 'recipe-side-lemon-garlic-roasted-vegetable-medley',
    category: 'recipes',
    title: 'Lemon Garlic Roasted Vegetable Medley',
    teaser: 'Roasted broccoli, carrot, and red bell pepper together.',
    summary: 'Cruciferous fiber and vitamin C from the broccoli, beta-carotene from the carrot, and vitamin C from the bell pepper: three differently-colored vegetables roasted together instead of one.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_side_lemon_garlic_broccoli',
    linkedBuilderType: 'side',
    recipeCard: {
      yield: 'Makes about 2 cups, 2 1-cup servings.',
      ingredients: [
        { text: '100g (about 1½ cups) broccoli, chopped' },
        { text: '7.5ml (about 1½ teaspoons) olive oil' },
        { text: '3g (about 1 clove) garlic, minced' },
        { text: '15g (juice of about ½ lemon)' },
        { text: '1g (a pinch) salt' },
        { text: '50g (about ⅓ cup) carrot, sliced' },
        { text: '50g (about ⅓ cup) red bell pepper, sliced' },
      ],
      instructions: [
        'Preheat the oven to 425°F (220°C).',
        'Toss the broccoli, carrot, and red bell pepper with the olive oil, garlic, and salt.',
        'Spread in a single layer on a baking sheet.',
        'Roast for 18-22 minutes, until the broccoli edges are lightly charred and the vegetables are tender.',
        'Squeeze the fresh lemon juice over everything right before serving.',
      ],
      nutritionHighlights: [
        { nutrient: 'Vitamin C', note: 'A solid 53-64% of a day\'s worth per serving.' },
        { nutrient: 'Vitamin K', note: 'Around 38-51% of a day\'s target per serving.' },
        { nutrient: 'Vitamin A', note: 'About 26-33% of a day\'s worth per serving.' },
      ],
      conditionNotes: [
        { condition: 'Hashimoto\'s', note: 'Raw broccoli carries a goitrogenic compound relevant to thyroid iodine uptake, but roasting measurably reduces this compound compared to eating it raw, which is exactly why this side is roasted rather than served as a raw salad.' },
      ],
      flavorNotes: 'A good roasty char on the broccoli florets pairs with sweet roasted carrot and bell pepper, all brightened at the end by fresh lemon juice and garlic: simple, colorful, and easy to crave for a vegetable side.',
    },
  },
  {
    id: 'recipe-side-garlic-mashed-cauliflower',
    category: 'recipes',
    title: 'Garlic Mashed Cauliflower',
    teaser: 'A lower-carb alternative to mashed potatoes.',
    summary: 'Cauliflower delivers vitamin C and fiber for far fewer carbohydrates than an equivalent portion of mashed potatoes.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_side_garlic_mashed_cauliflower',
    linkedBuilderType: 'side',
    recipeCard: {
      yield: 'Makes about 2 cups, 2 1-cup servings.',
      ingredients: [
        { text: '150g (about 2 cups) cauliflower, chopped' },
        { text: '3g (about 1 clove) garlic, minced' },
        { text: '7.5ml (about 1½ teaspoons) olive oil' },
        { text: '1g (a pinch) salt' },
        { text: '0.5g (a pinch) ground black pepper' },
      ],
      instructions: [
        'Bring a pot of water to a boil and add the chopped cauliflower and minced garlic.',
        'Boil for 10-12 minutes, until the cauliflower is very tender and easily pierced with a fork.',
        'Drain well, pressing out as much excess water as you can. Cauliflower holds onto water, and skipping this makes for a watery mash.',
        'Transfer to a food processor or blender with the olive oil, salt, and pepper, and blend until smooth.',
        'Alternatively, mash by hand with a potato masher for a chunkier, more rustic texture.',
      ],
      nutritionHighlights: [
        { nutrient: 'Vitamin C', note: 'A solid 37-44% of a day\'s worth per serving.' },
        { nutrient: 'Vitamin K', note: 'Around 9-12% of a day\'s target per serving.' },
      ],
      conditionNotes: [],
      flavorNotes: 'Creamy and garlicky, this stands in nicely for mashed potatoes, with a similar smooth texture but a lighter, slightly sweeter, more vegetal flavor underneath.',
    },
  },
  {
    id: 'recipe-side-sauteed-spinach-garlic',
    category: 'recipes',
    title: 'Simple Sautéed Spinach with Garlic',
    teaser: 'Fresh spinach, wilted quickly with garlic and lemon.',
    summary: 'Spinach cooks down dramatically. A full pound of raw spinach shrinks to just a few tablespoons once wilted, which is why this recipe starts with so much more raw spinach than it looks like it needs.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_side_sauteed_spinach_garlic',
    linkedBuilderType: 'side',
    recipeCard: {
      yield: 'Makes about 1 cup, 2 ½-cup servings.',
      ingredients: [
        { text: '100g (about 3½ cups) fresh spinach, whole' },
        { text: '5ml (about 1 teaspoon) olive oil' },
        { text: '2g (about ½ clove) garlic, minced' },
        { text: '0.5g (a pinch) salt' },
        { text: '7.5g (juice of about ¼ lemon)' },
      ],
      instructions: [
        'Heat the olive oil in a large skillet over medium heat.',
        'Add the minced garlic and cook for about 30 seconds, just until fragrant.',
        'Add the spinach in batches if needed (it will look like a lot at first, but wilts down quickly) and toss with tongs as it cooks.',
        'Cook for 2-3 minutes total, just until fully wilted. Overcooking spinach makes it mushy and dulls its color.',
        'Season with salt and finish with a squeeze of fresh lemon juice right before serving.',
      ],
      nutritionHighlights: [
        { nutrient: 'Vitamin K', note: 'An exceptional 284-378% of a day\'s worth per serving.' },
        { nutrient: 'Vitamin C', note: 'A solid 40-48% of a day\'s target per serving.' },
        { nutrient: 'Vitamin A', note: 'Around 28-36% of a day\'s worth per serving.' },
      ],
      conditionNotes: [
        { condition: 'Chronic Kidney Disease (and anyone managing kidney stones)', note: 'Spinach carries a notably high oxalate load, cooked or raw. Pairing it with a calcium source at the same meal is a practical way to help offset it if oxalate is something you\'re watching.' },
      ],
      flavorNotes: 'Simple and quick, with the garlic and a bright squeeze of lemon keeping the spinach\'s own mild, earthy flavor from tasting flat. A classic, no-frills green side.',
    },
  },
  {
    id: 'recipe-side-rainbow-stir-fried-vegetables',
    category: 'recipes',
    title: 'Rainbow Stir-Fried Vegetables',
    teaser: 'Six differently-colored vegetables in one fast pan.',
    summary: 'Six differently-colored vegetables in one dish means a wide spread of the vitamins and antioxidants each color tends to carry, not just whatever one vegetable happened to be on hand.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_side_rainbow_stir_fry',
    linkedBuilderType: 'side',
    recipeCard: {
      yield: 'Makes about 2 cups, 2 1-cup servings.',
      ingredients: [
        { text: '75g (about 1 cup) broccoli, chopped into florets' },
        { text: '50g (about ⅓ cup) carrot, sliced' },
        { text: '50g (about ⅓ cup) red bell pepper, sliced' },
        { text: '50g (about ⅓ cup) yellow bell pepper, sliced' },
        { text: '50g (about ⅓ cup) green beans, trimmed' },
        { text: '30g (about ¼ small) onion, sliced' },
        { text: '4g (about 1 clove) garlic, minced' },
        { text: '4g (about 1 teaspoon) fresh ginger, minced' },
        { text: '15ml (about 1 tablespoon) soy sauce' },
        { text: '4g (about 1 teaspoon) sesame seeds' },
      ],
      instructions: [
        'Heat a splash of oil in a wok or large skillet over high heat until it\'s shimmering.',
        'Add the onion, garlic, and ginger, and stir-fry for about 30 seconds, until fragrant.',
        'Add the broccoli, carrot, and green beans first, since they take a little longer to cook, and stir-fry for 2-3 minutes.',
        'Add the red and yellow bell peppers and continue stir-frying for another 2-3 minutes, until all the vegetables are crisp-tender. You want some bite left, not fully soft.',
        'Add the soy sauce and toss to coat everything evenly.',
        'Sprinkle the sesame seeds over the top right before serving.',
      ],
      nutritionHighlights: [
        { nutrient: 'Vitamin K', note: 'A striking 132-176% of a day\'s worth per serving.' },
        { nutrient: 'Vitamin C', note: 'Around 123-147% of a day\'s target per serving.' },
        { nutrient: 'Vitamin A', note: 'About 52-67% of a day\'s worth per serving.' },
      ],
      conditionNotes: [
        { condition: 'Hashimoto\'s / Celiac / Psoriasis / Rheumatoid Arthritis', note: 'Regular soy sauce is brewed from wheat and carries gluten. Tamari (a traditionally gluten-free soy sauce) or coconut aminos both swap in directly for the same salty, savory flavor without the gluten.' },
      ],
      flavorNotes: 'Fast, crisp-tender, and vibrant with color, the vegetables stay bright and retain good crunch rather than going soft, tied together with a savory, gingery, garlicky sauce.',
    },
  },

  // -------------------------------------------------------------------
  // Smoothies -- all 6 originally make 1 real 2-cup serving, doubled here
  // to make 2 real servings, one glass per person.
  // -------------------------------------------------------------------
  {
    id: 'recipe-smoothie-green-glow',
    category: 'recipes',
    title: 'Green Glow',
    teaser: 'A vegetable-forward green smoothie.',
    summary: 'Spinach\'s own mild flavor gets almost entirely masked by the banana and pineapple here, an effective way to get a vegetable serving into a smoothie without tasting like a salad.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_smoothie_green_glow',
    linkedBuilderType: 'smoothie',
    recipeCard: {
      yield: 'Makes about 4 cups, 2 2-cup servings.',
      ingredients: [
        { text: '3 cups spinach, whole' },
        { text: '2 bananas, sliced' },
        { text: '1 cup pineapple, diced' },
        { text: '2 cups unsweetened almond milk' },
        { text: '2 tablespoons chia seeds' },
      ],
      instructions: [
        'Combine all the ingredients in a blender.',
        'Blend on high for 45-60 seconds, until completely smooth with no visible spinach flecks.',
        'Pour into glasses and drink right away. The chia seeds start to thicken the smoothie the longer it sits.',
      ],
      nutritionHighlights: [
        { nutrient: 'Vitamin K', note: 'A striking 184-246% of a day\'s worth per serving.' },
        { nutrient: 'Manganese', note: 'Around 127-163% of a day\'s target per serving.' },
        { nutrient: 'Vitamin C', note: 'About 41-49% of a day\'s worth per serving.' },
      ],
      conditionNotes: [
        { condition: 'Chronic Kidney Disease (and anyone managing kidney stones)', note: 'Both spinach and chia seeds carry a notably high oxalate load, and this smoothie has meaningful amounts of both. Blending in a spoonful of plain yogurt for a calcium boost is one way to help offset it if that\'s a concern.' },
      ],
      flavorNotes: 'Fruity and sweet, with the banana and pineapple doing most of the talking. The spinach adds color and nutrition without adding much flavor of its own, which is exactly the point.',
    },
  },
  {
    id: 'recipe-smoothie-golden-turmeric',
    category: 'recipes',
    title: 'Golden Turmeric Anti-Inflammatory',
    teaser: 'A creamy, spiced smoothie built around turmeric.',
    summary: 'Black pepper noticeably improves how well the body absorbs turmeric\'s curcumin, which is why it shows up here even in a small pinch.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_smoothie_golden_turmeric',
    linkedBuilderType: 'smoothie',
    recipeCard: {
      yield: 'Makes about 4 cups, 2 2-cup servings.',
      ingredients: [
        { text: '1 teaspoon ground turmeric' },
        { text: '2 bananas, sliced' },
        { text: '2 cups unsweetened almond milk' },
        { text: '¼ teaspoon ground black pepper' },
        { text: '½ teaspoon ground cinnamon' },
        { text: '2 teaspoons honey' },
      ],
      instructions: [
        'Combine all the ingredients in a blender.',
        'Blend on high for 30-45 seconds, until smooth and creamy.',
        'Pour into glasses and serve right away.',
      ],
      nutritionHighlights: [
        { nutrient: 'Vitamin B6', note: 'A solid 37% of a day\'s worth per serving.' },
        { nutrient: 'Manganese', note: 'Around 19-24% of a day\'s target per serving.' },
        { nutrient: 'Potassium', note: 'About 17-22% of a day\'s worth per serving.' },
      ],
      conditionNotes: [],
      flavorNotes: 'Warm, spiced flavor from the turmeric and cinnamon against the natural sweetness and creaminess of the banana. This drinks more like a dessert smoothie than a health-food shot, with just enough black pepper in the background to notice without any actual heat.',
    },
  },
  {
    id: 'recipe-smoothie-brazil-nut-selenium',
    category: 'recipes',
    title: 'Brazil Nut Tropical Selenium Support',
    teaser: 'A notably selenium-rich smoothie built around Brazil nuts.',
    summary: 'Brazil nuts are one of the most concentrated food sources of selenium that exists. Just a couple of nuts can cover a full day\'s worth.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_smoothie_brazil_nut_selenium',
    linkedBuilderType: 'smoothie',
    recipeCard: {
      yield: 'Makes about 4 cups, 2 2-cup servings.',
      ingredients: [
        { text: '4 Brazil nuts, whole' },
        { text: '2 cups pineapple, diced' },
        { text: '1½ cups coconut milk' },
        { text: '2 bananas, sliced' },
      ],
      instructions: [
        'Combine all the ingredients in a blender.',
        'Blend on high for 45-60 seconds, until completely smooth. The Brazil nuts take a little longer to break down fully than softer ingredients, so blend a bit longer than you might expect.',
        'Pour into glasses and serve.',
      ],
      nutritionHighlights: [
        { nutrient: 'Manganese', note: 'An exceptional 168-215% of a day\'s worth per serving.' },
        { nutrient: 'Vitamin C', note: 'A solid 45-54% of a day\'s target per serving.' },
        { nutrient: 'Fiber', note: 'Around 32-48% of a day\'s worth per serving.' },
      ],
      conditionNotes: [
        { condition: 'Chronic Kidney Disease (and anyone managing kidney stones)', note: 'Brazil nuts carry a notably elevated oxalate load. Pairing this with a calcium source at the same meal helps offset it if that\'s a concern for you.' },
      ],
      flavorNotes: 'Rich and creamy from the coconut milk and Brazil nuts, with plenty of tropical sweetness from the pineapple and banana. This drinks thick and indulgent, closer to a milkshake than a light fruit smoothie.',
    },
  },
  {
    id: 'recipe-smoothie-berry-antioxidant',
    category: 'recipes',
    title: 'Berry Antioxidant Blast',
    teaser: 'A vibrant double-berry smoothie.',
    summary: 'Blueberries and strawberries each carry their own distinct set of antioxidant compounds, so combining them broadens what you\'re getting rather than just doubling up on the same one.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_smoothie_berry_antioxidant',
    linkedBuilderType: 'smoothie',
    recipeCard: {
      yield: 'Makes about 4 cups, 2 2-cup servings.',
      ingredients: [
        { text: '2 cups blueberries, whole' },
        { text: '2 cups strawberries, whole' },
        { text: '2 tablespoons flaxseed, whole' },
        { text: '2 cups coconut water' },
        { text: '2 teaspoons honey' },
      ],
      instructions: [
        'Combine all the ingredients in a blender.',
        'Blend on high for 30-45 seconds, until smooth.',
        'Pour into glasses and serve right away.',
      ],
      nutritionHighlights: [
        { nutrient: 'Manganese', note: 'A striking 180-230% of a day\'s worth per serving.' },
        { nutrient: 'Vitamin C', note: 'An exceptional 171-205% of a day\'s target per serving.' },
        { nutrient: 'Fiber', note: 'Around 29-44% of a day\'s worth per serving.' },
      ],
      conditionNotes: [],
      flavorNotes: 'Bright and fruity, with plenty of natural sweetness from the berries and a light, refreshing base from the coconut water. This tastes closer to a fruit punch than a health smoothie.',
    },
  },
  {
    id: 'recipe-smoothie-iron-vitamin-c',
    category: 'recipes',
    title: 'Iron & Vitamin C Boost',
    teaser: 'An iron-and-vitamin-C-paired fruit and greens smoothie.',
    summary: 'Vitamin C measurably improves how well the body absorbs the non-heme iron found in plant foods like spinach, which is exactly why they\'re paired here.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_smoothie_iron_vitamin_c',
    linkedBuilderType: 'smoothie',
    recipeCard: {
      yield: 'Makes about 4 cups, 2 2-cup servings.',
      ingredients: [
        { text: '2 cups spinach, whole' },
        { text: '2 oranges, quartered' },
        { text: '2 cups strawberries, whole' },
        { text: '2 bananas, sliced' },
      ],
      instructions: [
        'Combine all the ingredients in a blender.',
        'Blend on high for 45-60 seconds, until completely smooth with no visible spinach flecks.',
        'Pour into glasses and serve right away.',
      ],
      nutritionHighlights: [
        { nutrient: 'Vitamin C', note: 'An exceptional 253-303% of a day\'s worth per serving.' },
        { nutrient: 'Vitamin K', note: 'A striking 126-167% of a day\'s target per serving.' },
        { nutrient: 'Manganese', note: 'Around 67-85% of a day\'s worth per serving.' },
      ],
      conditionNotes: [
        { condition: 'Chronic Kidney Disease (and anyone managing kidney stones)', note: 'Spinach carries a notably high oxalate load. Blending in a spoonful of plain yogurt is an easy way to add calcium and help offset it if that\'s a concern.' },
      ],
      flavorNotes: 'Sweet and citrusy from the orange, with strawberry and banana rounding it out. The spinach disappears almost entirely into the flavor, leaving a fruity, refreshing smoothie behind.',
    },
  },
  {
    id: 'recipe-smoothie-tropical-ginger',
    category: 'recipes',
    title: 'Tropical Ginger Digestive Soother',
    teaser: 'A bright, gingery tropical smoothie.',
    summary: 'Fresh ginger has a long-documented history of settling an upset stomach, which is exactly the idea behind pairing it with tropical fruit here.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_smoothie_tropical_ginger',
    linkedBuilderType: 'smoothie',
    recipeCard: {
      yield: 'Makes about 4 cups, 2 2-cup servings.',
      ingredients: [
        { text: '3 cups pineapple, diced' },
        { text: '2 teaspoons fresh ginger, grated' },
        { text: '2 bananas, sliced' },
        { text: '2 cups coconut water' },
        { text: '2 tablespoons lime juice' },
      ],
      instructions: [
        'Combine all the ingredients in a blender.',
        'Blend on high for 45-60 seconds, until smooth.',
        'Pour into glasses and serve right away.',
      ],
      nutritionHighlights: [
        { nutrient: 'Manganese', note: 'An exceptional 293-374% of a day\'s worth per serving.' },
        { nutrient: 'Vitamin C', note: 'A solid 63-76% of a day\'s target per serving.' },
        { nutrient: 'Vitamin B6', note: 'Around 60% of a day\'s worth per serving.' },
      ],
      conditionNotes: [],
      flavorNotes: 'Bright, tropical, and properly zingy from the fresh ginger and lime, with pineapple and banana giving it plenty of sweetness underneath. Refreshing rather than heavy, closer to a tropical drink than a typical fruit smoothie.',
    },
  },

  // -------------------------------------------------------------------
  // Snacks -- 2 (roasted chickpeas, trail mix) are real batch/pantry
  // items that keep their own natural size; the other 2 (already
  // single-serving) are doubled to make 2 real servings.
  // -------------------------------------------------------------------
  {
    id: 'recipe-snack-roasted-chickpeas',
    category: 'recipes',
    title: 'Roasted Chickpeas',
    teaser: 'A crunchy, savory whole-food snack.',
    summary: 'Roasting chickpeas turns them into a crunchy, chip-like snack while keeping the fiber and protein a bag of chips doesn\'t have.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_snack_roasted_chickpeas',
    linkedBuilderType: 'snack',
    recipeCard: {
      yield: 'Makes about 2 cups. A batch snack meant to last 2 people several days.',
      ingredients: [
        { text: '200g (about 1½ cups) chickpeas, drained' },
        { text: '10ml (about 2 teaspoons) olive oil' },
        { text: '2g (about ⅓ teaspoon) salt' },
        { text: '2g (about 1 teaspoon) paprika' },
      ],
      instructions: [
        'Preheat the oven to 400°F (200°C).',
        'Pat the drained chickpeas dry with a clean towel. Getting them properly dry is what makes them crisp up in the oven instead of steaming.',
        'Toss the chickpeas with the olive oil, salt, and paprika.',
        'Spread them in a single layer on a baking sheet.',
        'Roast for 30-35 minutes, shaking the pan every 10 minutes or so, until deeply golden and audibly crunchy.',
        'Let them cool completely before eating. They continue to crisp up as they cool, and they soften again once stored, so eat them the same day for the best crunch.',
      ],
      nutritionHighlights: [
        { nutrient: 'Manganese', note: 'Around 23-29% of a day\'s worth per half-cup serving.' },
        { nutrient: 'Fiber', note: 'About 10-16% of a day\'s target per serving.' },
        { nutrient: 'Protein', note: 'Roughly 8-10% of a day\'s worth per serving.' },
      ],
      conditionNotes: [],
      flavorNotes: 'Crunchy and savory with a smoky warmth from the paprika, this is a satisfying stand-in for chips or crackers with a lot more staying power in your stomach.',
    },
  },
  {
    id: 'recipe-snack-trail-mix',
    category: 'recipes',
    title: 'Simple Trail Mix',
    teaser: 'A no-added-sugar mix of nuts, seeds, and dried fruit.',
    summary: 'Combining nuts, seeds, and dried fruit means fat, protein, and natural sugar together, which digests more slowly than dried fruit eaten alone.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_snack_trail_mix',
    linkedBuilderType: 'snack',
    recipeCard: {
      yield: 'Makes about 1½ cups. A batch snack meant to last 2 people several days.',
      ingredients: [
        { text: '40g (about ¼ cup) almonds' },
        { text: '40g (about ¼ cup) walnuts' },
        { text: '40g (about ¼ cup) dark seedless raisins' },
        { text: '30g (about ¼ cup) pumpkin seeds' },
      ],
      instructions: [
        'Combine all the ingredients in a bowl or jar.',
        'Stir or shake to mix evenly.',
        'Store in a sealed container. It keeps well for a couple of weeks at room temperature.',
      ],
      nutritionHighlights: [
        { nutrient: 'Manganese', note: 'Around 37-47% of a day\'s worth per quarter-cup serving.' },
        { nutrient: 'Magnesium', note: 'About 17-22% of a day\'s target per serving.' },
        { nutrient: 'Protein', note: 'Roughly 11-14% of a day\'s worth per serving.' },
      ],
      conditionNotes: [
        { condition: 'Chronic Kidney Disease (and anyone managing kidney stones)', note: 'Both almonds and walnuts carry a notably elevated oxalate load. If oxalate is something you\'re watching, keeping portions moderate and pairing this snack with a calcium source helps offset it.' },
      ],
      flavorNotes: 'A classic mix of crunchy nuts, seeds, and chewy sweetness from the raisins, satisfying and portable, without any added sugar coating or chocolate to distract from the ingredients themselves.',
    },
  },
  {
    id: 'recipe-snack-apple-almond-butter',
    category: 'recipes',
    title: 'Apple Slices with Almond Butter',
    teaser: 'A simple, protein-paired fruit snack.',
    summary: 'Pairing a carbohydrate-rich fruit like apple with almond butter\'s fat and protein noticeably slows down how fast the fruit\'s sugar hits your bloodstream.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_snack_apple_almond_butter',
    linkedBuilderType: 'snack',
    recipeCard: {
      yield: 'Makes 2 servings, 1 apple\'s worth per person.',
      ingredients: [
        { text: '300g (about 2 medium) apples, sliced' },
        { text: '60g (about ¼ cup) almond butter' },
        { text: '2g (about ½ teaspoon) ground cinnamon' },
      ],
      instructions: [
        'Core and slice the apples.',
        'Arrange the slices on a plate and either dollop the almond butter alongside for dipping, or spread it directly onto each slice.',
        'Sprinkle the cinnamon over the top and serve right away, before the apple slices start to brown.',
      ],
      nutritionHighlights: [
        { nutrient: 'Manganese', note: 'A solid 37-48% of a day\'s worth per serving.' },
        { nutrient: 'Magnesium', note: 'Around 23-30% of a day\'s target per serving.' },
        { nutrient: 'Fiber', note: 'About 18-27% of a day\'s worth per serving.' },
      ],
      conditionNotes: [
        { condition: 'Chronic Kidney Disease (and anyone managing kidney stones)', note: 'Almond butter carries a notably elevated oxalate load. If that\'s something you\'re watching, keeping the portion moderate and pairing it with a calcium source at the same meal helps offset it.' },
      ],
      flavorNotes: 'Crisp, sweet apple against creamy, nutty almond butter, with a warm hit of cinnamon over the top: a simple snack that still feels like a treat.',
    },
  },
  {
    id: 'recipe-snack-berries-yogurt',
    category: 'recipes',
    title: 'Berries with Greek Yogurt',
    teaser: 'A protein-rich fruit and yogurt bowl.',
    summary: 'Greek yogurt is strained further than regular yogurt, which concentrates its protein content noticeably higher per serving.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_snack_berries_yogurt',
    linkedBuilderType: 'snack',
    recipeCard: {
      yield: 'Makes 2 bowls, 1 per person.',
      ingredients: [
        { text: '400g (about 1⅔ cups) Greek yogurt, plain' },
        { text: '150g (about 1 cup) blueberries' },
        { text: '150g (about 1 cup) strawberries, sliced' },
        { text: '20g (about 4 teaspoons) honey' },
      ],
      instructions: [
        'Divide the Greek yogurt between two bowls.',
        'Top each with the blueberries and sliced strawberries.',
        'Drizzle the honey over the top and serve.',
      ],
      nutritionHighlights: [
        { nutrient: 'Vitamin C', note: 'A solid 59-71% of a day\'s worth per bowl.' },
        { nutrient: 'Riboflavin (B2)', note: 'Around 40-47% of a day\'s target per bowl.' },
        { nutrient: 'Protein', note: 'About 37-46% of a day\'s worth per bowl.' },
      ],
      conditionNotes: [],
      flavorNotes: 'Cool, creamy, and tangy from the Greek yogurt, sweetened just enough by the honey and the berries themselves: a satisfying snack that reads more like a dessert than a health food.',
    },
  },

  // -------------------------------------------------------------------
  // Soups -- all 4 originally serve 4, scaled down to 2 real servings.
  // -------------------------------------------------------------------
  {
    id: 'recipe-soup-chicken-vegetable',
    category: 'recipes',
    title: 'Simple Chicken Vegetable Soup',
    teaser: 'A classic chicken soup built from scratch.',
    summary: 'Homemade chicken soup avoids the heavy sodium load that most canned versions carry, since you control exactly how much salt goes in.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_soup_chicken_vegetable',
    linkedBuilderType: 'soup',
    recipeCard: {
      yield: 'Makes about 3 cups, 2 1½-cup servings.',
      ingredients: [
        { text: '100g (about ⅔ cup) chicken breast, skinless and boneless, diced' },
        { text: '50g (about ⅓ cup) carrot, diced' },
        { text: '40g (about ¼ cup) celery, diced' },
        { text: '50g (about ⅓ cup) onion, diced' },
        { text: '3g (about 1 clove) garlic, minced' },
        { text: '5g (about 1½ teaspoons) chicken bouillon' },
        { text: '500ml water' },
        { text: '1.5g (a pinch) salt' },
      ],
      instructions: [
        'Combine the water and chicken bouillon in a pot and bring to a simmer.',
        'Add the diced chicken, carrot, celery, onion, and garlic.',
        'Simmer for 20-25 minutes, until the chicken is fully cooked through and the vegetables are tender.',
        'Taste and add salt as needed, keeping in mind the bouillon already carries a fair amount of sodium.',
      ],
      nutritionHighlights: [
        { nutrient: 'Vitamin B6', note: 'A solid 51% of a day\'s worth per serving.' },
        { nutrient: 'Manganese', note: 'Around 39-50% of a day\'s target per serving.' },
        { nutrient: 'Niacin (B3)', note: 'About 40-45% of a day\'s worth per serving.' },
        { nutrient: 'Protein', note: 'Roughly 29-35% of a day\'s target per serving.' },
      ],
      conditionNotes: [
        { condition: 'Graves\' Disease', note: 'Bouillon cubes are an easy-to-overlook source of concentrated iodine, which can matter for someone actively managing Graves\' disease. Using a homemade, unsalted stock instead of a bouillon cube, or a low-iodine bouillon alternative, keeps this soup\'s flavor while cutting that iodine load substantially.' },
      ],
      flavorNotes: 'A comforting, classic chicken soup: savory broth, tender chicken, and soft vegetables, the kind of thing that feels like it\'s doing something good for you while you eat it.',
    },
  },
  {
    id: 'recipe-soup-butternut-squash',
    category: 'recipes',
    title: 'Butternut Squash Soup',
    teaser: 'A creamy, dairy-free squash soup.',
    summary: 'Butternut squash\'s orange color signals substantial beta-carotene content, which the body converts into vitamin A.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_soup_butternut_squash',
    linkedBuilderType: 'soup',
    recipeCard: {
      yield: 'Makes about 3 cups, 2 1½-cup servings.',
      ingredients: [
        { text: '250g (about 2 cups) butternut squash, cubed' },
        { text: '50g (about ⅓ cup) onion, diced' },
        { text: '3g (about 1 clove) garlic, minced' },
        { text: '7.5g (about 1½ teaspoons) vegetable stock' },
        { text: '375ml water' },
        { text: '7.5ml (about 1½ teaspoons) olive oil' },
        { text: '0.5g (a pinch) ground nutmeg' },
        { text: '1.5g (a pinch) salt' },
      ],
      instructions: [
        'Heat the olive oil in a pot over medium heat and sauté the onion for 4-5 minutes, until soft.',
        'Add the garlic and cook for another minute, just until fragrant.',
        'Add the cubed squash, vegetable stock, and water, and bring to a simmer.',
        'Cover and simmer for 20-25 minutes, until the squash is completely fork-tender.',
        'Blend the soup with an immersion blender (or carefully in a regular blender, in batches) until fully smooth.',
        'Stir in the nutmeg and salt, tasting and adjusting as needed.',
      ],
      nutritionHighlights: [
        { nutrient: 'Vitamin A', note: 'A striking 78-100% of a day\'s worth per serving.' },
        { nutrient: 'Manganese', note: 'Around 37-48% of a day\'s target per serving.' },
        { nutrient: 'Vitamin C', note: 'About 24-29% of a day\'s worth per serving.' },
      ],
      conditionNotes: [],
      flavorNotes: 'Naturally sweet and creamy from the squash itself, with warm background notes from the nutmeg: rich-tasting without needing any cream at all to get there.',
    },
  },
  {
    id: 'recipe-soup-red-lentil',
    category: 'recipes',
    title: 'Red Lentil Soup',
    teaser: 'A hearty plant-protein soup.',
    summary: 'Red lentils cook down faster than most other legumes and thicken a soup on their own as they break down, without needing any added cream or flour.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_soup_red_lentil',
    linkedBuilderType: 'soup',
    recipeCard: {
      yield: 'Makes about 3 cups, 2 1½-cup servings.',
      ingredients: [
        { text: '100g (about ½ cup) red lentils' },
        { text: '40g (about ¼ cup) carrot, diced' },
        { text: '30g (about ⅓ cup) celery, diced' },
        { text: '50g (about ⅓ cup) onion, diced' },
        { text: '3g (about 1 clove) garlic, minced' },
        { text: '7.5g (about 1½ teaspoons) vegetable stock' },
        { text: '500ml water' },
        { text: '1.5g (about ¼ teaspoon) ground cumin' },
        { text: '1.5g (a pinch) salt' },
      ],
      instructions: [
        'Combine the red lentils, carrot, celery, onion, garlic, vegetable stock, and water in a pot.',
        'Bring to a boil, then reduce to a simmer and cook for 20-25 minutes, until the lentils are completely soft and starting to break down.',
        'Stir in the cumin and salt.',
        'For a smoother soup, blend part or all of it with an immersion blender. Red lentils naturally break down enough that this step is optional.',
      ],
      nutritionHighlights: [
        { nutrient: 'Iron', note: 'A striking 29-66% of a day\'s worth per serving, one of the strongest plant-based iron sources in this whole recipe set.' },
        { nutrient: 'Manganese', note: 'Around 38-49% of a day\'s target per serving.' },
        { nutrient: 'Fiber', note: 'About 22-33% of a day\'s worth per serving.' },
        { nutrient: 'Protein', note: 'Roughly 22-27% of a day\'s target per serving.' },
      ],
      conditionNotes: [],
      flavorNotes: 'Warm and earthy with a good hit of cumin, this soup thickens into something hearty and satisfying as the lentils break down, filling enough to work as a full meal on its own.',
    },
  },
  {
    id: 'recipe-soup-tomato-basil',
    category: 'recipes',
    title: 'Tomato Basil Soup',
    teaser: 'A classic comfort soup made from scratch.',
    summary: 'Cooking tomatoes actually increases how available their lycopene is for the body to absorb, unlike most nutrients, which cooking tends to reduce.',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_soup_tomato_basil',
    linkedBuilderType: 'soup',
    recipeCard: {
      yield: 'Makes about 3 cups, 2 1½-cup servings.',
      ingredients: [
        { text: '300g (about 2 cups) tomatoes, chopped' },
        { text: '50g (about ⅓ cup) onion, diced' },
        { text: '3g (about 1 clove) garlic, minced' },
        { text: '2.5g (a small handful) fresh basil, chopped' },
        { text: '7.5ml (about 1½ teaspoons) olive oil' },
        { text: '5g (about 1 teaspoon) vegetable stock' },
        { text: '250ml water' },
        { text: '1.5g (a pinch) salt' },
      ],
      instructions: [
        'Heat the olive oil in a pot over medium heat and sauté the onion for 4-5 minutes, until soft.',
        'Add the garlic and cook for another minute, just until fragrant.',
        'Add the chopped tomatoes, vegetable stock, and water, and bring to a simmer.',
        'Simmer for 20-25 minutes, until the tomatoes have broken down.',
        'Blend with an immersion blender until smooth, then stir in the fresh basil and salt.',
      ],
      nutritionHighlights: [
        { nutrient: 'Vitamin C', note: 'A solid 34-41% of a day\'s worth per serving.' },
        { nutrient: 'Manganese', note: 'Around 32-41% of a day\'s target per serving.' },
        { nutrient: 'Vitamin K', note: 'About 25-34% of a day\'s worth per serving.' },
      ],
      conditionNotes: [],
      flavorNotes: 'Bright, tangy tomato flavor rounded out by sweet sautéed onion and fragrant fresh basil: a classic comfort soup that tastes noticeably fresher than anything from a can.',
    },
  },
];

