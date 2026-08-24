// Digest's "Recipes" category -- one real DigestEntry per curated
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
    summary: 'Whole-grain flour keeps fiber intact that white flour strips out during milling, useful to know before reaching for a store loaf.',
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
        { condition: 'Hashimoto\'s / Celiac / Psoriasis / Rheumatoid Arthritis', note: 'This is a full-gluten wheat loaf, so if gluten is something you avoid, this one isn\'t for you as written. The good news is it\'s an easy swap: a 1:1 gluten-free flour blend works in this same recipe, just expect a slightly denser, less springy crumb since it\'s missing gluten\'s stretch.' },
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
    summary: 'Green tea\'s catechin content is one of the most consistently studied plant compounds for antioxidant activity.',
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
    summary: 'Chia seeds bring omega-3 fat and fiber, and three differently-colored berries each carry their antioxidant profile.',
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
    summary: 'Lactobacillus delbrueckii subsp. bulgaricus and Streptococcus thermophilus are the two cultures Codex Alimentarius\'s international standard requires for something to legally be called yogurt.',
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
        'Massage and squeeze the cabbage with your hands for 5-10 minutes, until it releases its liquid and softens noticeably.',
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
    summary: 'Grilling chicken breast at high, dry heat produces measurably more advanced glycation end-products than gentler cooking methods, relevant if you eat grilled meat often, without meaning you need to avoid grilling altogether.',
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
    summary: 'Sweet potato\'s orange color comes from beta-carotene, which the body converts into vitamin A.',
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
    summary: 'Chickpeas bring plant protein and fiber together, a combination that helps slow how quickly the meal\'s carbohydrates raise blood sugar.',
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
      flavorNotes: 'Sweet, juicy strawberries against spinach\'s mild, slightly earthy leaves, with good crunch from the sliced almonds and a tangy balsamic dressing tying it all together: a classic combination for good reason.',
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
      flavorNotes: 'Simple and quick, with the garlic and a bright squeeze of lemon keeping the spinach\'s mild, earthy flavor from tasting flat. A classic, no-frills green side.',
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
    summary: 'Spinach\'s mild flavor gets almost entirely masked by the banana and pineapple here, an effective way to get a vegetable serving into a smoothie without tasting like a salad.',
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
    summary: 'Blueberries and strawberries each carry their distinct set of antioxidant compounds, so combining them broadens what you\'re getting rather than just doubling up on the same one.',
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
    summary: 'Red lentils cook down faster than most other legumes and thicken a soup on their as they break down, without needing any added cream or flour.',
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

  // -------------------------------------------------------------------
  // Fermented Drinks -- Wave 1, 2026-08-20, direct request built from two
  // shared Google AI Mode conversations about homemade fermented drinks
  // for gut health, joint pain, and sleep. Every claim below was
  // independently checked, not carried over from that conversation as-is
  // -- see the session's own plan file for the full per-claim tiering.
  // Nutrition highlights here are written qualitatively rather than as a
  // computed DRI percentage (unlike most of this file's other entries,
  // which trace to scripts/compute_recipe_data.js): a wild-fermented
  // batch's own final nutrient content shifts with fermentation time and
  // temperature in a way this app has no real way to measure per-batch,
  // so a fabricated precise percentage would be dishonest here in a way
  // it isn't for a fixed-recipe baked good or soup. Every one of these 22
  // recipes links to a real curated_recipes row seeded by
  // scripts/add_fermented_drink_recipes.py, buildable directly from
  // Fermentation Builder's own "Build This Recipe" flow. 19 more named
  // drinks from the same source conversations (Milk Kefir, Amazake,
  // Rejuvelac, Mauby, Calpis, Burdock & Dandelion Ale, Pozol, Sobia, Pine
  // Needle Cheong, Boza, Chicha, rye Kvass, Sake, Makgeolli, Ayran,
  // Lassi, Tarag, Pu-erh Tea, Palm Wine, Pulque) are a tracked backlog,
  // not built here -- see CLAUDE.md's Status snapshot.
  // -------------------------------------------------------------------
  {
    id: 'recipe-ferment-tonic-tart-cherry-ginger-turmeric',
    category: 'recipes',
    title: 'Wild-Fermented Tart Cherry, Ginger & Turmeric Tonic',
    teaser: 'A dairy-free, gluten-free bedtime tonic built around tart cherry\'s melatonin, with fermented ginger and turmeric for the joints and gut.',
    summary: 'Tart (Montmorency-type) cherries are one of the few food sources of measurable melatonin, and randomized trial data shows tart cherry juice can extend sleep time and improve sleep efficiency, though a 2022 trial found the sleep-quality benefit held even without a significant melatonin-level change, so the mechanism isn\'t fully settled. This tonic ferments the cherries whole rather than juicing them, using raw ginger and turmeric skins as a wild-yeast starter (no separate culture needed), with black pepper added for turmeric\'s well-documented curcumin-absorption boost.',
    citations: [
      { source: 'Howatson et al. 2011, European Journal of Nutrition: tart cherry juice, melatonin levels, and sleep quality', url: 'https://link.springer.com/article/10.1007/s00394-011-0263-7' },
      { source: 'Shoba et al. 1998, Planta Medica: piperine\'s effect on curcumin bioavailability', url: 'https://pubmed.ncbi.nlm.nih.gov/9619120/' },
    ],
    overallTier: 'moderate',
    linkedCuratedRecipeId: 'curated_ferment_tonic_tart_cherry_ginger_turmeric',
    linkedBuilderType: 'fermentation',
    stageNote: 'Most relevant once gluten and dairy are already ruled out as triggers, since the tonic is built specifically to avoid both.',
    relatedIds: [
      'fermentmethod-wild-tonics',
      'interaction-curcumin-piperine',
      'sleep-melatonin-real-dosing',
      'nutrients-fermented-drinks-hashimotos',
      'ra-fermented-drinks',
      'gout-fermented-drinks',
    ],
    recipeCard: {
      yield: 'Makes about 4 cups of finished tonic. A jar this size covers two people a 4-6 ounce evening pour for several nights.',
      ingredients: [
        { text: '2 cups (about 300g) tart cherries, fresh or thawed frozen, pitted and lightly crushed' },
        { text: '1 large thumb (about 20g) organic ginger, unpeeled, sliced' },
        { text: '1 small thumb (about 10g) organic turmeric, unpeeled, sliced (or 2 teaspoons ground if fresh isn\'t available)' },
        { text: '1/3 cup (about 65g) raw honey' },
        { text: '4 cups (950ml) filtered, unchlorinated water' },
        { text: 'A small pinch of black pepper' },
      ],
      instructions: [
        'Put the crushed cherries into a clean quart jar, then add the sliced ginger and turmeric and the black pepper.',
        'Dissolve the honey in the water, then pour it over the fruit and roots.',
        'Cover the jar mouth with a breathable cloth or coffee filter secured with a rubber band, not a sealed lid.',
        'Stir the mixture thoroughly twice a day, pushing any floating fruit back under the liquid to keep mold from starting.',
        'Let it ferment at room temperature for 2-4 days, until it tastes tart and only lightly sweet, with visible bubbling.',
        'Strain out the solids, bottle the liquid, and refrigerate. It keeps about 1-2 weeks refrigerated.',
      ],
      nutritionHighlights: [
        { nutrient: 'Melatonin & tryptophan', note: 'Tart cherries are one of the few whole foods that naturally contain measurable melatonin, the basis for this tonic\'s bedtime use.' },
        { nutrient: 'Anthocyanins', note: 'The same pigment compounds responsible for tart cherry\'s deep red color, with documented anti-inflammatory activity relevant to joint pain.' },
        { nutrient: 'Curcumin (from turmeric)', note: 'The added black pepper measurably increases how much of this gets absorbed, a documented pairing rather than a folk habit.' },
      ],
      conditionNotes: [
        { condition: 'Gout', note: 'Tart cherry has its separate evidence for lowering uric acid, on top of the sleep/joint framing here, relevant if gout is a factor.' },
        { condition: 'Migraine', note: 'A fully fermented batch (tart, not sweet) keeps histamine buildup lower than a short ferment, worth watching if fermented foods have triggered symptoms before.' },
      ],
      flavorNotes: 'Tart and lightly fizzy, with cherry\'s fruitiness upfront and a warm, earthy ginger-turmeric finish. Closer to a shrub than a soda: sip it, don\'t chug it.',
    },
  },
  {
    id: 'recipe-ferment-tonic-blueberry-ginger-turmeric',
    category: 'recipes',
    title: 'Wild-Fermented Blueberry, Ginger & Turmeric Tonic',
    teaser: 'The same wild-ferment method built around blueberry\'s anthocyanins, made more bioavailable by fermentation itself.',
    summary: 'Blueberries carry anthocyanins, the antioxidant pigments behind their color, and fermentation breaks down the fruit\'s own cell walls, which several studies suggest increases how much of that antioxidant content the body can actually absorb compared to eating the berries raw. Frozen blueberries work as well as fresh here since freezing already ruptures the cell walls, releasing juice faster once the ferment starts. This variant uses the same raw ginger-and-turmeric-skin wild-yeast method as the flagship tart cherry tonic.',
    citations: [
      { source: 'Potential health benefits of fermented blueberry: A review of current scientific evidence, ScienceDirect', url: 'https://www.sciencedirect.com/science/article/abs/pii/S092422442300002X' },
      { source: 'Shoba et al. 1998, Planta Medica: piperine\'s effect on curcumin bioavailability', url: 'https://pubmed.ncbi.nlm.nih.gov/9619120/' },
    ],
    overallTier: 'moderate',
    linkedCuratedRecipeId: 'curated_ferment_tonic_blueberry_ginger_turmeric',
    linkedBuilderType: 'fermentation',
    relatedIds: ['fermentmethod-wild-tonics', 'interaction-curcumin-piperine'],
    recipeCard: {
      yield: 'Makes about 4 cups of finished tonic, enough for two people across several days.',
      ingredients: [
        { text: '2 cups (about 300g) blueberries, fresh or frozen (no need to thaw first)' },
        { text: '1 large thumb (about 20g) organic ginger, unpeeled, sliced' },
        { text: '1 small thumb (about 10g) organic turmeric, unpeeled, sliced' },
        { text: '1/3 cup (about 65g) raw honey' },
        { text: '4 cups (950ml) filtered, unchlorinated water' },
        { text: 'A small pinch of black pepper' },
      ],
      instructions: [
        'Put the blueberries into a clean quart jar. If frozen, let them sit a few minutes and lightly crush with a spoon as they soften.',
        'Add the sliced ginger, turmeric, and black pepper.',
        'Dissolve the honey in the water and pour it over everything.',
        'Cover with a breathable cloth secured by a rubber band.',
        'Stir twice a day, pushing floating fruit back under the surface.',
        'Ferment 3-5 days at room temperature, until tangy with visible bubbling, then strain, bottle, and refrigerate.',
      ],
      nutritionHighlights: [
        { nutrient: 'Anthocyanins', note: 'Fermentation breaks down blueberry\'s own cell walls, a documented mechanism for improving how bioavailable this antioxidant becomes.' },
        { nutrient: 'Vitamin K', note: 'Blueberries are a meaningful whole-food source, relevant if you take a blood thinner and track vitamin K intake.' },
        { nutrient: 'Curcumin (from turmeric)', note: 'Boosted by the added black pepper, the same pairing already documented in this app\'s Nutrient Interactions research.' },
      ],
      conditionNotes: [
        { condition: 'Migraine', note: 'A short, under-fermented batch carries more residual histamine than a fully fermented one; let it run the full 3-5 days if fermented foods have been a trigger before.' },
      ],
      flavorNotes: 'Deep purple, tangy rather than sweet, with a mellow berry flavor and a warm ginger-turmeric background note.',
    },
  },
  {
    id: 'recipe-ferment-tonic-pomegranate-ginger-turmeric',
    category: 'recipes',
    title: 'Wild-Fermented Pomegranate, Ginger & Turmeric Tonic',
    teaser: 'A tart, dry wild ferment built on pomegranate\'s ellagitannins, with an honest caveat about what fermenting one actually delivers.',
    summary: 'Pomegranate carries ellagitannins, which certain gut bacteria convert into Urolithin A, a compound with double-blind human trial data for improving mitochondrial and muscle function. Those trials dosed purified Urolithin A directly (1000mg/day), not fermented pomegranate juice, and not everyone\'s gut bacteria are even capable of producing Urolithin A from ellagitannins at all. This tonic is a worthwhile antioxidant-rich drink either way, just not a guaranteed way to reach the dose those trials used.',
    citations: [
      { source: 'Andreux et al. 2019, Nature Metabolism: Urolithin A randomized controlled trial in humans', url: 'https://www.nature.com/articles/s42255-019-0073-4' },
    ],
    overallTier: 'moderate',
    linkedCuratedRecipeId: 'curated_ferment_tonic_pomegranate_ginger_turmeric',
    linkedBuilderType: 'fermentation',
    relatedIds: ['fermentmethod-wild-tonics', 'prostate-fermented-drinks'],
    recipeCard: {
      yield: 'Makes about 4 cups of finished tonic, enough for two people across several days.',
      ingredients: [
        { text: '1 1/4 cups (300ml) unsweetened pure pomegranate juice, or fresh arils pulsed in a food processor and strained' },
        { text: '1 large thumb (about 20g) organic ginger, unpeeled, sliced' },
        { text: '1 small thumb (about 10g) organic turmeric, unpeeled, sliced' },
        { text: '3 tablespoons (about 50g) raw honey' },
        { text: '2 3/4 cups (650ml) filtered, unchlorinated water' },
        { text: 'A small pinch of black pepper' },
      ],
      instructions: [
        'Combine the pomegranate juice, sliced ginger, turmeric, and black pepper in a clean quart jar.',
        'Dissolve the honey in the water and add it to the jar.',
        'Cover with a breathable cloth secured by a rubber band.',
        'Stir twice a day.',
        'Ferment 3-5 days at room temperature, tasting daily until it\'s tart and only lightly sweet.',
        'Strain out the ginger and turmeric, bottle the liquid, and refrigerate.',
      ],
      nutritionHighlights: [
        { nutrient: 'Ellagitannins', note: 'The raw material some gut bacteria convert into Urolithin A, though not everyone\'s microbiome can make that conversion.' },
        { nutrient: 'Vitamin C', note: 'Pomegranate is a solid whole-food source, though fermentation gradually reduces the vitamin C content over time.' },
      ],
      conditionNotes: [
        { condition: 'Type 2 Diabetes / PCOS', note: 'Let this ferment the full window so the microbes consume more of the juice\'s natural sugar before drinking it.' },
      ],
      flavorNotes: 'Tart, dry, and ruby-colored, closer to a dry wine cooler than a sweet juice drink, with a warm ginger-turmeric edge.',
    },
  },
  {
    id: 'recipe-ferment-tonic-cranberry-ginger-turmeric',
    category: 'recipes',
    title: 'Wild-Fermented Cranberry, Ginger & Turmeric Tonic',
    teaser: 'A sharply tart wild ferment built on cranberry\'s well-documented urinary tract benefit.',
    summary: 'Cranberries contain A-type proanthocyanidins, a compound structurally different from the proanthocyanidins in most other berries, with solid evidence for blocking E. coli and other bacteria from adhering to the urinary tract wall. Fermenting cranberries rather than drinking sweetened juice cocktail avoids the heavy added sugar most commercial cranberry juice relies on to offset the fruit\'s intense tartness.',
    citations: [
      { source: 'Howell et al. 2005, Phytochemistry: A-type cranberry proanthocyanidins and uropathogenic bacterial anti-adhesion activity', url: 'https://pubmed.ncbi.nlm.nih.gov/16055161/' },
    ],
    overallTier: 'moderate',
    linkedCuratedRecipeId: 'curated_ferment_tonic_cranberry_ginger_turmeric',
    linkedBuilderType: 'fermentation',
    relatedIds: ['fermentmethod-wild-tonics'],
    recipeCard: {
      yield: 'Makes about 4 cups of finished tonic, enough for two people across several days.',
      ingredients: [
        { text: '1 3/4 cups (about 250g) cranberries, fresh or frozen, pulsed in a food processor to break the skins' },
        { text: '1 large thumb (about 20g) organic ginger, unpeeled, sliced' },
        { text: '1 small thumb (about 10g) organic turmeric, unpeeled, sliced' },
        { text: '1/3 cup plus 1 tablespoon (about 85g) raw honey (cranberries need a bit more sweetener than most fruit here, given how tart they are)' },
        { text: '4 cups (950ml) filtered, unchlorinated water' },
        { text: 'A small pinch of black pepper' },
      ],
      instructions: [
        'Pulse the cranberries in a food processor just until the skins break, not into a full purée.',
        'Add them to a clean quart jar along with the ginger, turmeric, and black pepper.',
        'Dissolve the honey in the water and pour it over everything.',
        'Cover with a breathable cloth secured by a rubber band.',
        'Stir twice a day.',
        'Ferment 3-5 days, tasting daily. Strain, bottle, and refrigerate once tart and lightly fizzy.',
      ],
      nutritionHighlights: [
        { nutrient: 'A-type proanthocyanidins', note: 'A structurally distinct compound from most other berries, with documented evidence for blocking bacterial adhesion in the urinary tract.' },
        { nutrient: 'Vitamin C', note: 'Cranberries carry a meaningful amount, though fermentation and the honey needed to offset their tartness both affect the final sugar content.' },
      ],
      conditionNotes: [
        { condition: 'Chronic Kidney Disease', note: 'Cranberries are relatively low in potassium compared to many other fruits here, but check with your care team before adding any new fruit-based drink to a restricted diet.' },
      ],
      flavorNotes: 'Sharply tart and ruby-red, lightly fizzy, closer to a dry cranberry spritzer than a sweet juice.',
    },
  },
  {
    id: 'recipe-ferment-tonic-red-grape-ginger-turmeric',
    category: 'recipes',
    title: 'Wild-Fermented Red Grape, Ginger & Turmeric Tonic',
    teaser: 'A wine-adjacent wild ferment built on red grape skin\'s own resveratrol, with honest evidence caveats.',
    summary: 'Red grape skins carry resveratrol, an antioxidant compound most human interest in centers on cardiovascular and gut-lining health. The specific claim that resveratrol increases Akkermansia muciniphila, a bacterium linked to a healthy gut barrier, currently rests mostly on animal studies, with limited human interventional data so far. This is a worthwhile antioxidant-rich ferment either way, just one where the microbiome-specific benefit is still an early, not yet confirmed, finding.',
    citations: [
      { source: 'Resveratrol as a promising nutraceutical: gut microbiota modulation review, MDPI', url: 'https://www.mdpi.com/1422-0067/25/6/3370' },
    ],
    overallTier: 'weak',
    linkedCuratedRecipeId: 'curated_ferment_tonic_red_grape_ginger_turmeric',
    linkedBuilderType: 'fermentation',
    relatedIds: ['fermentmethod-wild-tonics', 'pcos-fermented-drinks', 'cvd-fermented-drinks'],
    recipeCard: {
      yield: 'Makes about 4 cups of finished tonic, enough for two people across several days.',
      ingredients: [
        { text: '2 cups (about 300g) red or purple grapes, halved' },
        { text: '1 large thumb (about 20g) organic ginger, unpeeled, sliced' },
        { text: '1 small thumb (about 10g) organic turmeric, unpeeled, sliced' },
        { text: '1/4 cup (about 50g) raw honey' },
        { text: '4 cups (950ml) filtered, unchlorinated water' },
        { text: 'A small pinch of black pepper' },
      ],
      instructions: [
        'Halve the grapes and place them in a clean quart jar along with the ginger, turmeric, and black pepper.',
        'Dissolve the honey in the water and pour it over the fruit.',
        'Cover with a breathable cloth secured by a rubber band.',
        'Stir twice a day, this one can ferment fast since grape sugar is highly fermentable.',
        'Check daily starting on day 2. Grapes often finish faster than other fruit here, sometimes in as little as 2-3 days.',
        'Strain, bottle, and refrigerate once tangy and lightly fizzy.',
      ],
      nutritionHighlights: [
        { nutrient: 'Resveratrol', note: 'Concentrated in the grape skin specifically, which is why this recipe keeps the fruit whole rather than juicing and straining it early.' },
      ],
      conditionNotes: [
        { condition: 'Type 2 Diabetes / PCOS / Gout', note: 'Grapes ferment unusually fast because their sugar is so readily available to wild yeast; let this one run its full course so as little residual sugar as possible remains.' },
      ],
      flavorNotes: 'Fruity and wine-adjacent, highly carbonated, with a warm ginger-turmeric background.',
    },
  },
  {
    id: 'recipe-ferment-tonic-hibiscus-ginger-turmeric',
    category: 'recipes',
    title: 'Wild-Fermented Hibiscus, Ginger & Turmeric Tonic',
    teaser: 'A cranberry-tart, floral wild ferment built on dried hibiscus, with trial evidence for a modest blood pressure benefit.',
    summary: 'Dried hibiscus (sold as Flor de Jamaica in many grocery stores) carries an antioxidant profile that compares favorably to berries, and has its separate randomized trial evidence for modestly lowering blood pressure. Because dried flowers rather than fresh fruit don\'t carry their live wild yeast, this variant steeps the hibiscus into a tea first, then ferments that tea using the ginger-and-turmeric-skin method, the same approach Fermentation Builder\'s Jun Tea and Kombucha recipes use for tea-based ferments.',
    citations: [
      { source: 'Systematic review and meta-analysis of the effects of Hibiscus sabdariffa on blood pressure and cardiometabolic markers, Nutrition Reviews', url: 'https://pubmed.ncbi.nlm.nih.gov/34927694/' },
    ],
    overallTier: 'moderate',
    linkedCuratedRecipeId: 'curated_ferment_tonic_hibiscus_ginger_turmeric',
    linkedBuilderType: 'fermentation',
    relatedIds: ['fermentmethod-wild-tonics', 'cvd-fermented-drinks'],
    recipeCard: {
      yield: 'Makes about 4 cups of finished tonic, enough for two people across several days.',
      ingredients: [
        { text: '1/2 cup dried hibiscus flowers (Flor de Jamaica)' },
        { text: '4 cups (900ml) boiling water, cooled to room temperature after steeping' },
        { text: '1 large thumb (about 20g) organic ginger, unpeeled, sliced' },
        { text: '1 small thumb (about 10g) organic turmeric, unpeeled, sliced' },
        { text: '1/3 cup (about 65g) raw honey' },
        { text: 'A small pinch of black pepper' },
      ],
      instructions: [
        'Steep the dried hibiscus in the boiling water for 10 minutes, then strain out the flowers and let the tea cool completely to room temperature.',
        'Stir the honey into the cooled tea until dissolved.',
        'Pour into a clean quart jar and add the sliced ginger, turmeric, and black pepper.',
        'Cover with a breathable cloth secured by a rubber band.',
        'Stir twice a day.',
        'Ferment 3-5 days at room temperature, then strain, bottle, and refrigerate.',
      ],
      nutritionHighlights: [
        { nutrient: 'Anthocyanins & polyphenols', note: 'Dried hibiscus carries a concentration that compares favorably to fresh berries, gram for gram.' },
      ],
      conditionNotes: [
        { condition: 'Hashimoto\'s / low blood pressure conditions', note: 'Hibiscus has documented blood-pressure-lowering activity, worth mentioning to your care team if you already take a blood pressure medication.' },
      ],
      flavorNotes: 'Deeply red, cranberry-tart, and floral, with a warm ginger-turmeric finish underneath.',
    },
  },
  {
    id: 'recipe-ferment-tonic-blackberry-raspberry-ginger-turmeric',
    category: 'recipes',
    title: 'Wild-Fermented Blackberry & Raspberry, Ginger & Turmeric Tonic',
    teaser: 'A jammy, deep-berry wild ferment built on ellagic acid and prebiotic fiber.',
    summary: 'Blackberries and raspberries carry more ellagic acid and prebiotic fiber than many other berries, both of which feed beneficial bifidobacteria directly in the large intestine rather than being absorbed higher up the digestive tract. Combining the two fruits gives a deeper, more complex flavor than either alone, using the same raw ginger-and-turmeric-skin wild-yeast method as the rest of this tonic family.',
    citations: [
      { source: 'Ellagic Acid and Gut Microbiota: Interactions, and Implications for Health, PMC', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11972986/' },
    ],
    overallTier: 'moderate',
    linkedCuratedRecipeId: 'curated_ferment_tonic_blackberry_raspberry_ginger_turmeric',
    linkedBuilderType: 'fermentation',
    relatedIds: ['fermentmethod-wild-tonics'],
    recipeCard: {
      yield: 'Makes about 4 cups of finished tonic, enough for two people across several days.',
      ingredients: [
        { text: '1 cup (about 150g) blackberries, fresh or frozen, lightly crushed' },
        { text: '1 cup (about 150g) raspberries, fresh or frozen, lightly crushed' },
        { text: '1 large thumb (about 20g) organic ginger, unpeeled, sliced' },
        { text: '1 small thumb (about 10g) organic turmeric, unpeeled, sliced' },
        { text: '1/3 cup (about 65g) raw honey' },
        { text: '4 cups (950ml) filtered, unchlorinated water' },
        { text: 'A small pinch of black pepper' },
      ],
      instructions: [
        'Lightly crush the berries in a clean quart jar, then add the ginger, turmeric, and black pepper.',
        'Dissolve the honey in the water and pour it over the fruit.',
        'Cover with a breathable cloth secured by a rubber band.',
        'Stir twice a day, keeping the fruit pushed under the liquid.',
        'Ferment 3-5 days at room temperature, tasting daily.',
        'Strain, bottle, and refrigerate once tangy and lightly fizzy.',
      ],
      nutritionHighlights: [
        { nutrient: 'Ellagic acid', note: 'Higher in blackberries and raspberries than in most other fruit in this tonic family.' },
        { nutrient: 'Prebiotic fiber', note: 'Feeds beneficial bifidobacteria directly in the large intestine, a distinct mechanism from the antioxidant framing most other entries here lead with.' },
      ],
      conditionNotes: [],
      flavorNotes: 'Deep, jammy berry flavor, tart and lightly fizzy, with a mellow ginger-turmeric background.',
    },
  },
  {
    id: 'recipe-ferment-tonic-elderberry-ginger-turmeric',
    category: 'recipes',
    title: 'Wild-Fermented Elderberry, Ginger & Turmeric Tonic',
    teaser: 'The traditional way elderberry is actually prepared: raw elderberries aren\'t safe to eat whole, so fermenting them is the point, not an option.',
    summary: 'Elderberry has its own body of research on supporting the immune response during upper-respiratory illness, distinct from the general antioxidant framing of the rest of this tonic family. Unlike every other fruit here, raw elderberries aren\'t safe eaten whole (they carry compounds that need heat or fermentation to break down), so this ferment is the traditional way elderberries get used at all, not a stylistic choice.',
    citations: [
      { source: 'Black elderberry (Sambucus nigra) supplementation effectively treats upper respiratory symptoms: a meta-analysis of randomized, controlled clinical trials, Complementary Therapies in Medicine', url: 'https://www.sciencedirect.com/science/article/abs/pii/S0965229918310240' },
    ],
    overallTier: 'moderate',
    linkedCuratedRecipeId: 'curated_ferment_tonic_elderberry_ginger_turmeric',
    linkedBuilderType: 'fermentation',
    relatedIds: ['fermentmethod-wild-tonics', 'lupus-fermented-drinks'],
    recipeCard: {
      yield: 'Makes about 4 cups of finished tonic, enough for two people across several days.',
      ingredients: [
        { text: '1 3/4 cups (about 250g) elderberries, stems removed, lightly crushed (fresh or frozen)' },
        { text: '1 large thumb (about 20g) organic ginger, unpeeled, sliced' },
        { text: '1 small thumb (about 10g) organic turmeric, unpeeled, sliced' },
        { text: '1/3 cup plus 2 teaspoons (about 75g) raw honey' },
        { text: '4 cups (950ml) filtered, unchlorinated water' },
        { text: 'A small pinch of black pepper' },
      ],
      instructions: [
        'Remove any stems from the elderberries (the stems themselves aren\'t used) and lightly crush the berries in a clean quart jar.',
        'Add the sliced ginger, turmeric, and black pepper.',
        'Dissolve the honey in the water and pour it over everything.',
        'Cover with a breathable cloth secured by a rubber band.',
        'Stir twice a day.',
        'Ferment 3-5 days at room temperature. Strain thoroughly through a fine-mesh cloth, bottle, and refrigerate.',
      ],
      nutritionHighlights: [
        { nutrient: 'Anthocyanins', note: 'Elderberry\'s deep purple color comes from a concentration of these compounds that rivals or exceeds most other dark berries.' },
      ],
      conditionNotes: [
        { condition: 'Any autoimmune condition', note: 'Elderberry\'s immune-stimulating effect is generally framed around fighting off a cold or flu; if you\'re on an immunosuppressant, mention this one to your care team before drinking it regularly.' },
      ],
      flavorNotes: 'Deep purple and tart, with a warmly spiced ginger-turmeric finish, closer to a mulled-wine flavor profile than a bright berry soda.',
    },
  },
  {
    id: 'recipe-ferment-tonic-apple-pear',
    category: 'recipes',
    title: 'Wild-Fermented Apple & Pear Tonic',
    teaser: 'A crisp, lightly fizzy wild ferment closest to homemade sparkling cider, built on apple and pear\'s pectin.',
    summary: 'Apples and pears both carry pectin, a soluble fiber lab-fermentation studies show feeds several beneficial gut bacteria species. That evidence so far comes from in-vitro fermentation studies of human stool samples, not completed human feeding trials, so pectin\'s prebiotic effect is a promising early finding rather than a settled one. Unlike the rest of this tonic family, this variant skips turmeric, since the mellow apple-pear flavor doesn\'t need turmeric\'s earthiness to balance it, though ginger still does the work of a wild-yeast starter.',
    citations: [
      { source: 'The Potential of Pectins to Modulate the Human Gut Microbiota Evaluated by In Vitro Fermentation: A Systematic Review, PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov/36079886/' },
    ],
    overallTier: 'weak',
    linkedCuratedRecipeId: 'curated_ferment_tonic_apple_pear',
    linkedBuilderType: 'fermentation',
    relatedIds: ['fermentmethod-wild-tonics'],
    recipeCard: {
      yield: 'Makes about 4 cups of finished tonic, enough for two people across several days.',
      ingredients: [
        { text: '1 medium apple (about 200g), unpeeled, grated' },
        { text: '1 medium pear (about 200g), unpeeled, grated' },
        { text: '1 medium thumb (about 15g) organic ginger, unpeeled, sliced' },
        { text: '1/4 cup (about 50g) raw honey' },
        { text: '4 cups (950ml) filtered, unchlorinated water' },
      ],
      instructions: [
        'Grate the unpeeled apple and pear directly into a clean quart jar.',
        'Add the sliced ginger.',
        'Dissolve the honey in the water and pour it over the fruit.',
        'Cover with a breathable cloth secured by a rubber band.',
        'Stir twice a day.',
        'Ferment 3-5 days at room temperature, tasting daily. Strain, bottle, and refrigerate once tangy and lightly fizzy.',
      ],
      nutritionHighlights: [
        { nutrient: 'Pectin', note: 'A soluble fiber with early, lab-based evidence for feeding beneficial gut bacteria, concentrated mostly in the peel, which is why this recipe keeps both fruits unpeeled.' },
      ],
      conditionNotes: [],
      flavorNotes: 'Crisp and mildly sweet with a gentle ginger warmth, the closest of this whole tonic family to a homemade sparkling cider.',
    },
  },
  {
    id: 'recipe-ferment-tonic-lemon-lime',
    category: 'recipes',
    title: 'Wild-Fermented Lemon-Lime Probiotic Soda',
    teaser: 'A bright, sharply citrusy wild ferment for when berries aren\'t in season, built on the same skin-yeast method.',
    summary: 'Lemons and limes lack the anthocyanin antioxidants the rest of this tonic family leans on, but they\'re available everywhere year-round, and citrus\'s bitter peel compounds have a traditional (though not rigorously trial-tested) reputation for supporting digestion. This is the simplest, most reliably available variant of the whole tonic family, worth keeping in rotation specifically because it never depends on a seasonal fruit.',
    citations: [],
    overallTier: 'weak',
    linkedCuratedRecipeId: 'curated_ferment_tonic_lemon_lime',
    linkedBuilderType: 'fermentation',
    relatedIds: ['fermentmethod-wild-tonics'],
    recipeCard: {
      yield: 'Makes about 4 cups of finished tonic, enough for two people across several days.',
      ingredients: [
        { text: '1 large lemon (about 150g), unpeeled, sliced' },
        { text: '1 large lime (about 100g), unpeeled, sliced' },
        { text: '1 large thumb (about 20g) organic ginger, unpeeled, sliced' },
        { text: '1/3 cup plus 2 teaspoons (about 75g) raw honey' },
        { text: '4 cups (950ml) filtered, unchlorinated water' },
      ],
      instructions: [
        'Slice the unpeeled lemon and lime and place them in a clean quart jar with the sliced ginger.',
        'Dissolve the honey in the water and pour it over the citrus.',
        'Cover with a breathable cloth secured by a rubber band.',
        'Stir twice a day.',
        'Ferment 3-5 days at room temperature, tasting daily.',
        'Strain, bottle, and refrigerate once tangy and lightly fizzy.',
      ],
      nutritionHighlights: [
        { nutrient: 'Vitamin C', note: 'A meaningful whole-food source, though some is lost gradually over the course of fermentation.' },
      ],
      conditionNotes: [],
      flavorNotes: 'Bright and sharply citrusy, highly carbonated, with a clean ginger bite. The closest of this family to a homemade probiotic lemon-lime soda.',
    },
  },
  {
    id: 'recipe-ferment-beet-kvass',
    category: 'recipes',
    title: 'Beet Kvass',
    teaser: 'A savory, low-sugar salt-brine ferment built on raw beets, closer to a tonic shot than a soda.',
    summary: 'Beet kvass is a short, salt-brine lacto-ferment rather than a wild-yeast fruit soda: the salt concentration favors naturally present Leuconostoc mesenteroides in its first days, the same organism that kicks off sauerkraut fermentation. Beets carry dietary nitrates, which the body converts into nitric oxide, supporting blood flow. Traditionally taken in small shots rather than full glasses, given its intensity.',
    citations: [
      { source: 'National Center for Home Food Preservation (University of Georgia) fermented vegetables guidance', url: 'https://nchfp.uga.edu/how/can_ferment.html' },
      { source: 'Dietary Nitrate from Beetroot Juice for Hypertension: A Systematic Review, PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov/30400267/' },
    ],
    overallTier: 'moderate',
    linkedCuratedRecipeId: 'curated_ferment_beet_kvass',
    linkedBuilderType: 'fermentation',
    relatedIds: [
      'fermentmethod-lacto-fermented-vegetables',
      'fermented-leuconostoc-mesenteroides',
      'nutrients-fermented-drinks-hashimotos',
      'ibd-fermented-drinks',
      'ckd-fermented-drinks',
      'type2-fermented-drinks',
      'cvd-fermented-drinks',
      'ibs-fermented-drinks',
    ],
    recipeCard: {
      yield: 'Makes about 6 cups. Traditionally taken as a 1-2 ounce shot rather than a full glass, so this batch lasts a good while.',
      ingredients: [
        { text: '1 pound (about 500g) beets, peeled and chopped into chunks' },
        { text: '6 cups (1.5 liters) filtered, unchlorinated water' },
        { text: '4 teaspoons (about 20g) non-iodized salt' },
      ],
      instructions: [
        'Put the chopped beets into a clean half-gallon jar.',
        'Dissolve the salt in the water and pour it over the beets, leaving at least an inch of headspace.',
        'Weigh the beets down so they stay submerged, if needed, and cover loosely with a lid (or an airlock if you have one).',
        'Let it ferment at room temperature for 5-7 days, until it tastes tangy and a little effervescent.',
        'Strain out the beets (they\'re still edible, just soft), and refrigerate the liquid. It keeps several weeks refrigerated.',
      ],
      nutritionHighlights: [
        { nutrient: 'Dietary nitrates', note: 'Beets are one of the richest whole-food sources, converted by the body into nitric oxide, which supports healthy blood flow.' },
        { nutrient: 'Folate', note: 'Beets carry a meaningful amount, though fermentation shifts the exact final content compared to raw beets.' },
      ],
      conditionNotes: [
        { condition: 'Chronic Kidney Disease', note: 'Beets are relatively high in potassium; check with your care team before adding this one if potassium is restricted.' },
        { condition: 'Gout', note: 'Beets carry a moderate oxalate load, worth being aware of alongside any other oxalate-rich foods already in your diet.' },
      ],
      flavorNotes: 'Earthy, salty, and tangy rather than sweet, an acquired taste for some, traditionally sipped in small amounts rather than drunk like a soda.',
    },
  },
  {
    id: 'recipe-ferment-kanji',
    category: 'recipes',
    title: 'Kanji (Fermented Carrot & Mustard Seed)',
    teaser: 'A traditional Indian winter lacto-ferment, sharp and lightly spiced with mustard seed.',
    summary: 'Kanji is a traditional Indian fermented drink, usually made with purple carrots for their distinctive color; this app\'s reference database doesn\'t carry a purple carrot variety, so this version uses ordinary carrots instead, still a lactic-acid-bacteria-rich ferment, just a different color than the traditional version. Mustard seed adds a sharp, slightly pungent note and its documented antimicrobial compounds that help guide the fermentation.',
    citations: [
      { source: 'National Center for Home Food Preservation (University of Georgia) fermented vegetables guidance', url: 'https://nchfp.uga.edu/how/can_ferment.html' },
    ],
    overallTier: 'moderate',
    linkedCuratedRecipeId: 'curated_ferment_kanji',
    linkedBuilderType: 'fermentation',
    relatedIds: ['fermentmethod-lacto-fermented-vegetables', 'fermented-leuconostoc-mesenteroides'],
    recipeCard: {
      yield: 'Makes about 6 cups. Traditionally taken as a small shot rather than a full glass.',
      ingredients: [
        { text: '1 pound (about 500g) carrots, peeled and sliced into batons' },
        { text: '2 teaspoons (about 10g) mustard seed, lightly crushed' },
        { text: '6 cups (1.5 liters) filtered, unchlorinated water' },
        { text: '4 teaspoons (about 20g) non-iodized salt' },
      ],
      instructions: [
        'Put the carrot batons and crushed mustard seed into a clean half-gallon jar.',
        'Dissolve the salt in the water and pour it over the carrots.',
        'Weigh the carrots down so they stay submerged, and cover loosely.',
        'Ferment at room temperature for 5-7 days, tasting after day 4.',
        'Strain and refrigerate once tangy and lightly effervescent. Keeps several weeks refrigerated.',
      ],
      nutritionHighlights: [
        { nutrient: 'Beta-carotene', note: 'Carrots are a rich whole-food source, the same nutrient responsible for their orange color.' },
      ],
      conditionNotes: [],
      flavorNotes: 'Sharp, tangy, and lightly spiced from the mustard seed, traditionally sipped as a small shot rather than a full glass.',
    },
  },
  {
    id: 'recipe-ferment-water-kefir',
    category: 'recipes',
    title: 'Water Kefir',
    teaser: 'A mild, dairy-free, naturally carbonated soda built on live water kefir grains.',
    summary: 'Water kefir grains are their distinct multi-species culture of bacteria and yeast, different from a kombucha SCOBY, not simply "kombucha without the tea." The ferment itself runs faster than kombucha, often finished in 24 to 48 hours, producing a milder, less acidic drink. Live water kefir grains (available from a fermentation supplier or a friend already brewing) are needed to start this, the same way a sourdough starter is needed to start bread.',
    citations: [
      { source: 'National Center for Home Food Preservation (University of Georgia) fermentation overview', url: 'https://nchfp.uga.edu/how/can_ferment.html' },
    ],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_ferment_water_kefir',
    linkedBuilderType: 'fermentation',
    relatedIds: [
      'fermentmethod-water-kefir',
      'fermented-water-kefir',
      'type1-fermented-drinks',
      'pcos-fermented-drinks',
      'type2-fermented-drinks',
      'migraine-fermented-drinks',
    ],
    recipeCard: {
      yield: 'Makes about 4 cups. A batch this size restarts easily every 1-2 days once the grains are active.',
      ingredients: [
        { text: '1/4 cup (about 60g) active water kefir grains' },
        { text: '1/4 cup (about 60g) sugar (the grains feed on this; very little remains in the finished drink)' },
        { text: '4 cups (1 liter) filtered, unchlorinated water' },
        { text: '1 lemon slice, for flavor' },
      ],
      instructions: [
        'Dissolve the sugar in the water in a clean quart jar.',
        'Add the water kefir grains and the lemon slice.',
        'Cover with a breathable cloth secured by a rubber band.',
        'Let it sit at room temperature for 24-48 hours, until lightly effervescent and less sweet.',
        'Strain out the grains (save them to start the next batch) and refrigerate the liquid, or bottle it sealed for 1-2 more days first to build extra carbonation.',
      ],
      nutritionHighlights: [
        { nutrient: 'Live cultures', note: 'A multi-species community of bacteria and yeast, distinct from kombucha\'s SCOBY culture.' },
      ],
      conditionNotes: [],
      flavorNotes: 'Mild, lightly tangy, and naturally fizzy, much less sour than kombucha, an easy entry point if fermented drinks are new to you.',
    },
  },
  {
    id: 'recipe-ferment-coconut-kefir',
    category: 'recipes',
    title: 'Coconut Kefir',
    teaser: 'The gut-healing benefits of kefir without dairy\'s casein protein, built on coconut water instead of milk.',
    summary: 'Coconut kefir uses the same kefir-grain culture as milk kefir, fermented in coconut water instead of dairy, avoiding casein and lactose entirely. Coconut itself contributes lauric acid, a fatty acid with documented antimicrobial properties that can help balance gut flora during the same fermentation that\'s already introducing beneficial bacteria.',
    citations: [
      { source: 'Biomedical Applications of Lauric Acid: A Narrative Review, PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov/39036266/' },
    ],
    overallTier: 'moderate',
    linkedCuratedRecipeId: 'curated_ferment_coconut_kefir',
    linkedBuilderType: 'fermentation',
    relatedIds: ['fermentmethod-water-kefir', 'nutrients-fermented-drinks-hashimotos', 'graves-fermented-drinks', 'sjogrens-fermented-drinks'],
    recipeCard: {
      yield: 'Makes about 4 cups. Restarts easily every 24-48 hours once the grains are active.',
      ingredients: [
        { text: '1/4 cup (about 60g) active water kefir grains (dairy-free, the same grains used for water kefir)' },
        { text: '4 cups (1 liter) unsweetened coconut water' },
      ],
      instructions: [
        'Put the coconut water and kefir grains in a clean quart jar.',
        'Cover with a breathable cloth secured by a rubber band.',
        'Let it sit at room temperature for 24-48 hours, until lightly tangy.',
        'Strain out the grains (rinse and refresh them in plain sugar water occasionally, since coconut water has less to feed on than sugar water) and refrigerate the liquid.',
      ],
      nutritionHighlights: [
        { nutrient: 'Lauric acid', note: 'A documented antimicrobial fatty acid from the coconut itself, on top of the live cultures from the kefir grains.' },
        { nutrient: 'Potassium', note: 'Coconut water is a well-known whole-food source, part of its traditional use as a hydration drink.' },
      ],
      conditionNotes: [
        { condition: 'Chronic Kidney Disease', note: 'Coconut water is high in potassium; check with your care team before making this a regular drink if potassium is restricted.' },
      ],
      flavorNotes: 'Mild, tangy, and a little sweet from the coconut water\'s natural sugar, lighter and less sour than dairy milk kefir.',
    },
  },
  {
    id: 'recipe-ferment-ginger-bug-soda',
    category: 'recipes',
    title: 'Ginger Bug Soda',
    teaser: 'A self-sustaining wild-yeast starter culture, fed daily, that doubles as a drinkable soda on its own.',
    summary: 'A ginger bug is a wild-yeast starter culture built from nothing more than fresh ginger, sugar, and water, fed daily until it becomes reliably active. Once established, the same culture works as the starter for any of this app\'s other wild-ferment drinks in place of relying on a fruit\'s skin yeast, useful when a fruit doesn\'t carry a strong enough wild culture on its own (frozen fruit, for instance, since freezing kills most of the yeast living on the skin).',
    citations: [
      { source: 'National Center for Home Food Preservation (University of Georgia) fermentation overview', url: 'https://nchfp.uga.edu/how/can_ferment.html' },
    ],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_ferment_ginger_bug_soda',
    linkedBuilderType: 'fermentation',
    relatedIds: ['fermentmethod-wild-tonics'],
    recipeCard: {
      yield: 'Makes a reusable starter culture plus about 4 cups of drinkable soda once active.',
      ingredients: [
        { text: '1/4 cup (about 60g) fresh organic ginger, grated, unpeeled, plus 1 tablespoon more added daily' },
        { text: '1/4 cup (about 60g) sugar, plus 1 tablespoon more added daily' },
        { text: '4 cups (1 liter) filtered, unchlorinated water' },
      ],
      instructions: [
        'Combine the ginger, sugar, and water in a clean quart jar.',
        'Cover with a breathable cloth secured by a rubber band.',
        'Each day for 5-7 days, add 1 tablespoon each of fresh grated ginger and sugar, stirring well.',
        'The bug is active once it bubbles vigorously within an hour of feeding and smells yeasty rather than off.',
        'Strain the liquid off (this is your drinkable ginger bug soda) and use the reserved grated pulp to start the next batch, or use the active liquid itself as a starter for another wild-ferment recipe.',
      ],
      nutritionHighlights: [
        { nutrient: 'Gingerol', note: 'The same active compound in raw ginger, made more available through fermentation, with a traditional reputation for easing nausea.' },
      ],
      conditionNotes: [],
      flavorNotes: 'Sharply spicy and warming, lightly sweet and naturally carbonated once fully active.',
    },
  },
  {
    id: 'recipe-ferment-ginger-beer-traditional',
    category: 'recipes',
    title: 'Traditional Fermented Ginger Beer',
    teaser: 'A sharply spicy, actually fermented ginger drink built from an active ginger bug, distinct from commercial ginger ale.',
    summary: 'This is an actively fermented drink, built from an active ginger bug starter (see the Ginger Bug Soda recipe), distinct from commercial ginger ale, which gets its carbonation from added CO2 rather than live fermentation. The lemon juice adds vitamin C and balances the ginger\'s heat with brightness.',
    citations: [
      { source: 'National Center for Home Food Preservation (University of Georgia) fermentation overview', url: 'https://nchfp.uga.edu/how/can_ferment.html' },
    ],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_ferment_ginger_beer_traditional',
    linkedBuilderType: 'fermentation',
    relatedIds: ['fermentmethod-wild-tonics'],
    recipeCard: {
      yield: 'Makes about 4 cups, enough for two people across a few days.',
      ingredients: [
        { text: '1/3 cup (about 80g) fresh ginger, grated, unpeeled' },
        { text: '1/4 cup (about 60g) lemon juice' },
        { text: '1/2 cup (about 100g) sugar' },
        { text: '4 cups (1 liter) filtered, unchlorinated water' },
        { text: '1/2 cup active ginger bug liquid (see Ginger Bug Soda recipe)' },
      ],
      instructions: [
        'Combine the grated ginger, lemon juice, sugar, and water in a saucepan and warm gently just until the sugar dissolves. Let it cool completely to room temperature.',
        'Strain into a clean quart jar and stir in the active ginger bug liquid.',
        'Cover with a breathable cloth secured by a rubber band and let ferment 24-48 hours at room temperature.',
        'Strain into flip-top bottles, seal, and leave at room temperature 1-3 more days to build carbonation, burping the bottles daily to check pressure.',
        'Refrigerate once carbonated to your taste.',
      ],
      nutritionHighlights: [
        { nutrient: 'Gingerol', note: 'The same active compound as fresh ginger, made more concentrated through the reduction step before fermenting.' },
        { nutrient: 'Vitamin C', note: 'From the added lemon juice, though fermentation gradually reduces it over time.' },
      ],
      conditionNotes: [],
      flavorNotes: 'Sharply spicy and warming, brightened by lemon, with a natural fizz built from live fermentation rather than added carbonation.',
    },
  },
  {
    id: 'recipe-ferment-turmeric-drink',
    category: 'recipes',
    title: 'Fermented Turmeric Drink',
    teaser: 'A dairy-free, fermented take on this app\'s Golden Milk recipe, with the same curcumin-and-pepper pairing.',
    summary: 'Fermenting turmeric alongside ginger breaks down the root\'s fibrous matrix, and the added black pepper measurably improves how well the curcumin inside actually absorbs, the same documented pairing already behind this app\'s Golden Milk beverage recipe, built here as a dairy-free, wild-fermented drink instead.',
    citations: [
      { source: 'Shoba et al. 1998, Planta Medica: piperine\'s effect on curcumin bioavailability', url: 'https://pubmed.ncbi.nlm.nih.gov/9619120/' },
    ],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_ferment_turmeric_drink',
    linkedBuilderType: 'fermentation',
    relatedIds: ['fermentmethod-wild-tonics', 'interaction-curcumin-piperine', 'ra-fermented-drinks', 'psoriasis-fermented-drinks'],
    recipeCard: {
      yield: 'Makes about 4 cups, enough for two people across a few days.',
      ingredients: [
        { text: '2 tablespoons (about 30g) fresh turmeric, grated, unpeeled' },
        { text: '1 large thumb (about 20g) fresh ginger, grated, unpeeled' },
        { text: '1/3 cup (about 65g) raw honey' },
        { text: '4 cups (1 liter) filtered, unchlorinated water' },
        { text: 'A small pinch of black pepper' },
      ],
      instructions: [
        'Combine the grated turmeric, ginger, and black pepper in a clean quart jar.',
        'Dissolve the honey in the water and pour it over everything.',
        'Cover with a breathable cloth secured by a rubber band.',
        'Stir twice a day.',
        'Ferment 3-5 days at room temperature, tasting daily. Strain, bottle, and refrigerate once tangy.',
      ],
      nutritionHighlights: [
        { nutrient: 'Curcumin', note: 'The active compound in turmeric, its absorption measurably boosted by the black pepper here, the same pairing behind this app\'s Golden Milk recipe.' },
      ],
      conditionNotes: [],
      flavorNotes: 'Earthy, warming, and lightly tangy, with turmeric\'s distinctive bitterness softened by the honey and fermentation.',
    },
  },
  {
    id: 'recipe-ferment-tepache',
    category: 'recipes',
    title: 'Tepache',
    teaser: 'A Mexican wild ferment built entirely on pineapple\'s rind, one of the most reliably active wild-yeast sources of any fruit.',
    summary: 'Tepache relies on pineapple rind\'s naturally heavy wild-yeast load, meaningfully higher than most other fruit skins, which is why it ferments reliably without a separate starter culture. Using the rind and core rather than the flesh means the edible fruit itself stays free for eating, while the parts that would otherwise be discarded do the fermenting.',
    citations: [
      { source: 'National Center for Home Food Preservation (University of Georgia) fermentation overview', url: 'https://nchfp.uga.edu/how/can_ferment.html' },
    ],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_ferment_tepache',
    linkedBuilderType: 'fermentation',
    relatedIds: ['fermentmethod-wild-tonics'],
    recipeCard: {
      yield: 'Makes about 6 cups, enough for two people across several days.',
      ingredients: [
        { text: 'Rind and core of 1 pineapple (about 600g), roughly chopped' },
        { text: '1/2 cup (about 100g) piloncillo, dark brown sugar, or molasses' },
        { text: '8 cups (2 liters) filtered, unchlorinated water' },
        { text: 'A cinnamon stick, optional' },
      ],
      instructions: [
        'Combine the pineapple rind and core, sweetener, and water in a clean half-gallon jar. Add the cinnamon stick if using.',
        'Cover with a breathable cloth secured by a rubber band.',
        'Let it ferment at room temperature for 2-3 days, stirring once a day.',
        'Strain out the solids once it tastes tangy and lightly fizzy, with visible bubbling.',
        'Refrigerate. Drink within a few days, as tepache continues fermenting even in the fridge.',
      ],
      nutritionHighlights: [
        { nutrient: 'Bromelain', note: 'An enzyme naturally present in pineapple, traditionally associated with aiding digestion and reducing inflammation.' },
      ],
      conditionNotes: [],
      flavorNotes: 'Sweet, tangy, and lightly spiced if using cinnamon, with pineapple\'s tropical brightness carried through the whole ferment.',
    },
  },
  {
    id: 'recipe-ferment-shrub',
    category: 'recipes',
    title: 'Shrub (Colonial Drinking Vinegar)',
    teaser: 'A sharply tart, sweet-and-sour fruit-and-vinegar syrup that predates refrigeration, meant to be diluted rather than drunk straight.',
    summary: 'A shrub is an acetic-acid-forward syrup, fruit and sugar macerated together with vinegar rather than a live culture doing the fermenting. This acetic-acid style of drink supports stomach acid production, relevant given how common low stomach acid is alongside hypothyroidism\'s effect on digestion. Traditionally diluted with still or sparkling water rather than drunk straight, given its intensity.',
    citations: [],
    overallTier: 'weak',
    linkedCuratedRecipeId: 'curated_ferment_shrub',
    linkedBuilderType: 'fermentation',
    relatedIds: ['fermentmethod-wild-tonics', 'sjogrens-fermented-drinks'],
    recipeCard: {
      yield: 'Makes about 2 cups of concentrated syrup, enough for many diluted glasses (1-2 tablespoons of syrup per glass of water).',
      ingredients: [
        { text: '2 cups (about 250g) blackberries, crushed' },
        { text: '1 cup (250ml) cider vinegar' },
        { text: '1 cup (about 200g) sugar' },
      ],
      instructions: [
        'Combine the crushed blackberries and sugar in a clean jar, cover, and let macerate at room temperature for 24 hours, stirring once or twice.',
        'Strain the fruit through a fine-mesh sieve, pressing to extract the juice, and discard the solids.',
        'Stir the cider vinegar into the strained juice.',
        'Let the mixture sit, covered, for another 1-2 days, tasting periodically until the flavor is balanced rather than sharply acidic.',
        'Strain again if needed, bottle, and refrigerate. Keeps for months given how much vinegar and sugar it carries.',
      ],
      nutritionHighlights: [
        { nutrient: 'Acetic acid', note: 'The same active compound in any vinegar, traditionally used to support digestion when diluted and taken before a meal.' },
      ],
      conditionNotes: [],
      flavorNotes: 'Sharply tart and sweet-and-sour, meant to be diluted with still or sparkling water rather than drunk straight from the bottle.',
    },
  },
  {
    id: 'recipe-ferment-switchel',
    category: 'recipes',
    title: 'Switchel',
    teaser: 'A colonial-era ginger-and-vinegar tonic, traditionally a quick mixed drink rather than a long culture.',
    summary: 'Switchel (also called a "haymaker\'s punch") is traditionally a quick mixed tonic, ginger, vinegar, and a mineral-rich sweetener stirred into water, closer to a shrub than a deeply cultured ferment, though it develops more character the longer it\'s allowed to sit. Molasses adds iron and trace minerals that plain sugar doesn\'t carry.',
    citations: [],
    overallTier: 'weak',
    linkedCuratedRecipeId: 'curated_ferment_switchel',
    linkedBuilderType: 'fermentation',
    relatedIds: ['fermentmethod-wild-tonics', 'sjogrens-fermented-drinks'],
    recipeCard: {
      yield: 'Makes about 6 cups, enough for two people across several days.',
      ingredients: [
        { text: '2 tablespoons (about 30g) fresh ginger, grated, unpeeled' },
        { text: '1/4 cup (60ml) cider vinegar' },
        { text: '1/4 cup (about 60g) molasses' },
        { text: '6 cups (1.5 liters) filtered water' },
      ],
      instructions: [
        'Combine the grated ginger, cider vinegar, and molasses in a clean jar or pitcher and stir until the molasses dissolves.',
        'Add the water and stir well.',
        'Cover and refrigerate for at least a few hours to let the ginger steep, or leave loosely covered at room temperature for 1-2 days for a more developed, lightly fermented flavor.',
        'Strain out the ginger before serving, if preferred, or leave it in.',
      ],
      nutritionHighlights: [
        { nutrient: 'Iron', note: 'Blackstrap-style molasses is a meaningful whole-food source, more than plain sugar carries.' },
      ],
      conditionNotes: [],
      flavorNotes: 'Tangy, gingery, and lightly sweet, refreshing over ice, traditionally drunk to replace minerals lost to sweat during hot outdoor work.',
    },
  },
  {
    id: 'recipe-ferment-jun-tea',
    category: 'recipes',
    title: 'Jun Tea',
    teaser: 'A lighter, more floral relative of kombucha, fermented from green tea and raw honey rather than black tea and cane sugar.',
    summary: 'Jun uses its distinct culture, fermenting green tea and raw honey specifically, not a kombucha SCOBY repurposed with different tea. This is a different ferment entirely, not a kombucha variant, and needs its jun culture to start (available from a fermentation supplier), the same way kombucha needs its SCOBY.',
    citations: [
      { source: 'National Center for Home Food Preservation (University of Georgia) fermentation overview', url: 'https://nchfp.uga.edu/how/can_ferment.html' },
    ],
    overallTier: 'moderate',
    linkedCuratedRecipeId: 'curated_ferment_jun_tea',
    linkedBuilderType: 'fermentation',
    relatedIds: ['fermentmethod-kombucha'],
    recipeCard: {
      yield: 'Makes about 8 cups, enough for two people across a week or more.',
      ingredients: [
        { text: '8 cups (2 liters) brewed green tea, cooled to room temperature' },
        { text: '1 cup (about 200g) raw honey' },
        { text: '1 jun culture (SCOBY) plus 1 cup starter liquid from a previous batch' },
      ],
      instructions: [
        'Brew the green tea and let it cool completely to room temperature.',
        'Stir in the raw honey until dissolved.',
        'Pour into a clean half-gallon jar and add the jun culture and starter liquid.',
        'Cover with a breathable cloth secured by a rubber band.',
        'Ferment at room temperature for 2-4 days, tasting daily, until tart and lightly effervescent.',
        'Remove the culture (set it aside with some starter liquid for the next batch), bottle the liquid, and refrigerate.',
      ],
      nutritionHighlights: [
        { nutrient: 'Live cultures', note: 'A distinct bacteria-and-yeast community from kombucha\'s SCOBY, fed on honey rather than cane sugar.' },
      ],
      conditionNotes: [],
      flavorNotes: 'Lighter and more floral than kombucha, with a honeyed finish and gentler tartness.',
    },
  },
  {
    id: 'recipe-ferment-garlic-honey-tonic',
    category: 'recipes',
    title: 'Fermented Garlic Honey Tonic',
    teaser: 'A slow-fermenting garlic-and-honey syrup, with an honest note that raw honey\'s antimicrobial nature makes this a different kind of ferment than the rest of this list.',
    summary: 'Raw honey\'s low water content is naturally antimicrobial, which is exactly why this ferments slowly and unpredictably compared to a water-based drink, garlic\'s moisture, released gradually as it macerates, is what actually feeds the process, producing occasional small bubbles over several weeks rather than the rapid fizz of a wild-fermented fruit tonic. Garlic itself carries allicin, released when the cloves are cut or crushed, with a well-documented traditional reputation for immune support.',
    citations: [],
    overallTier: 'weak',
    linkedCuratedRecipeId: 'curated_ferment_garlic_honey_tonic',
    linkedBuilderType: 'fermentation',
    relatedIds: ['fermentmethod-wild-tonics', 'lupus-fermented-drinks'],
    recipeCard: {
      yield: 'Makes about 1 1/2 cups of finished tonic, taken by the spoonful rather than as a drink.',
      ingredients: [
        { text: '1 cup (about 150g) garlic cloves, peeled and left whole' },
        { text: '1 1/2 cups (about 350g) raw honey' },
      ],
      instructions: [
        'Lightly crush each garlic clove with the flat of a knife (just enough to release some juice, not fully mashed) and place them in a clean pint jar.',
        'Pour the raw honey over the garlic, making sure every clove is fully submerged.',
        'Cover loosely (a lid that isn\'t fully airtight, since gas may build up as it ferments) and let it sit at room temperature.',
        'Burp the jar daily by opening it briefly, and turn or shake it gently to redistribute the honey around the cloves.',
        'Let it sit for at least 2-4 weeks. Small bubbles rising when you shake the jar mean it\'s actively fermenting; a strong off smell or visible mold means it should be discarded.',
        'Store at room temperature once active; it keeps for months given honey\'s natural preservation.',
      ],
      nutritionHighlights: [
        { nutrient: 'Allicin', note: 'Released when garlic is cut or crushed, with a traditional reputation for supporting the immune response, though this specific fermented preparation hasn\'t been separately trial-tested.' },
      ],
      conditionNotes: [],
      flavorNotes: 'Pungent and sweet-hot, syrupy in texture, traditionally taken by the spoonful rather than diluted into a drink.',
    },
  },

  // -------------------------------------------------------------------
  // Fermented Drinks -- Wave 2, 2026-08-20, same session, direct request:
  // "Finish the 19... this is no longer ONLY for people with these
  // conditions... if it is a healthy thing for an average nonconditional
  // person then it needs to be here, and if there are warnings that need
  // to be in place due to a condition, that also needs to be here." These
  // 19 entries are written for a general reader first, with genuine,
  // specific condition cautions layered in as conditionNotes rather than
  // as a reason to leave a drink out. Several needed a named ingredient
  // substitution (this database has no row for soldierwood bark, agave
  // sap, palm sap, pine needles, or mare's/camel's milk, and its only
  // plain dairy yogurt and agave syrup rows are entirely audit-hidden) --
  // every substitution is named directly in its own summary, never
  // presented as the authentic traditional ingredient. Every claim below
  // was independently checked via WebSearch before being written in, the
  // same discipline as Wave 1. Full reasoning for every substitution
  // lives in scripts/add_fermented_drink_recipes_wave2.py's own header
  // comment.
  // -------------------------------------------------------------------
  {
    id: 'recipe-ferment-milk-kefir',
    category: 'recipes',
    title: 'Milk Kefir',
    teaser: 'A tangy, effervescent dairy ferment with a broader live culture than yogurt, a good everyday probiotic for anyone who tolerates dairy well.',
    summary: 'Milk kefir grains carry a more varied community of bacteria and yeast species than yogurt\'s two-strain starter culture, fermenting at ordinary room temperature rather than yogurt\'s held warm temperature. For most people, this makes it one of the more microbially diverse fermented dairy options available at home.',
    citations: [
      { source: 'Microbiome and Metabiotic Properties of Kefir Grains and Kefirs Based on Them, PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov/35967129/' },
    ],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_ferment_milk_kefir',
    linkedBuilderType: 'fermentation',
    relatedIds: ['fermentmethod-milk-kefir-and-yogurt', 'recipe-ferment-coconut-kefir'],
    recipeCard: {
      yield: 'Makes about 4 cups. Restarts easily every 24 hours once the grains are active.',
      ingredients: [
        { text: '4 cups (1 liter) whole milk' },
        { text: '1/4 cup (about 60g) active milk kefir grains' },
      ],
      instructions: [
        'Put the milk kefir grains in a clean quart jar and pour the milk over them.',
        'Cover with a breathable cloth secured by a rubber band, not a sealed lid.',
        'Let it sit at room temperature for 24 hours, until thickened and lightly tangy.',
        'Strain out the grains (save them to start the next batch) and refrigerate the liquid.',
      ],
      nutritionHighlights: [
        { nutrient: 'Live cultures', note: 'A broader, more varied bacteria-and-yeast community than yogurt\'s required two-strain starter.' },
        { nutrient: 'Calcium', note: 'Carries whole milk\'s calcium content, relevant given calcium can interfere with thyroid medication absorption if taken too close together.' },
      ],
      conditionNotes: [
        { condition: 'Hashimoto\'s / Celiac / dairy sensitivity', note: 'This is a full dairy ferment: casein and lactose are both present, though fermentation reduces the lactose. If dairy is a trigger, Coconut Kefir (also in this app) gives a similar live-culture drink without it.' },
        { condition: 'Anyone taking levothyroxine', note: 'Its calcium content can block thyroid medication absorption if taken within about 4 hours of a dose; space this out from your morning pill.' },
      ],
      flavorNotes: 'Thin, tangy, and lightly effervescent, more sour and less thick than yogurt.',
    },
  },
  {
    id: 'recipe-ferment-amazake',
    category: 'recipes',
    title: 'Amazake',
    teaser: 'A naturally sweet Japanese rice ferment with no added sugar at all, its sweetness comes entirely from the fermentation itself.',
    summary: 'Koji mold breaks rice starch down into maltose as it ferments, which is where every bit of amazake\'s sweetness comes from, not an added sweetener. A pleasant everyday drink for most people, though its natural sugar content is concentrated enough to matter for anyone watching blood sugar.',
    citations: [
      { source: 'National Center for Home Food Preservation (University of Georgia) fermentation overview', url: 'https://nchfp.uga.edu/how/can_ferment.html' },
    ],
    overallTier: 'moderate',
    linkedCuratedRecipeId: 'curated_ferment_amazake',
    linkedBuilderType: 'fermentation',
    relatedIds: ['fermentmethod-dairy-free-gluten-free-survey', 'type1-fermented-drinks', 'type2-fermented-drinks'],
    recipeCard: {
      yield: 'Makes about 4 cups, enough for two people across several days.',
      ingredients: [
        { text: '1 cup (200g) rice, rinsed well' },
        { text: '3 1/3 cups (800ml) water' },
        { text: 'Koji rice culture, per package instructions (available from a fermentation or Japanese grocery supplier)' },
      ],
      instructions: [
        'Cook the rice with the water until soft, then let it cool to around 140°F (60°C), warm but not hot enough to kill the koji culture.',
        'Stir in the koji culture per its package instructions.',
        'Keep the mixture at a steady 130-140°F (54-60°C) for 8-10 hours, using a yogurt maker, rice cooker on "keep warm," or a warm oven with the door cracked.',
        'It\'s ready once noticeably sweet. Blend smooth if you prefer a thinner drink, or thin with a little extra water.',
        'Refrigerate. Keeps about a week.',
      ],
      nutritionHighlights: [
        { nutrient: 'Natural maltose', note: 'The entire sweetness of this drink, produced by koji breaking down the rice\'s starch, no added sugar involved.' },
      ],
      conditionNotes: [
        { condition: 'Type 2 Diabetes / PCOS', note: 'Amazake\'s natural sugar content is concentrated; treat it more like a dessert drink than an everyday beverage if blood sugar is a concern.' },
      ],
      flavorNotes: 'Thick, naturally sweet, and lightly tangy, closer to a rice pudding you drink than a soda.',
    },
  },
  {
    id: 'recipe-ferment-rejuvelac',
    category: 'recipes',
    title: 'Rejuvelac (Sprouted Quinoa)',
    teaser: 'A tart, mild sprouted-grain ferment, built gluten-free from the start rather than adapted from a wheat recipe afterward.',
    summary: 'Traditional rejuvelac uses sprouted wheat berries. This version uses quinoa instead, so it\'s gluten-free by design, not a wheat-based drink someone had to work around. Sprouting activates enzymes already present in the grain, and the wild fermentation that follows adds live bacteria on top of that.',
    citations: [
      { source: 'National Center for Home Food Preservation (University of Georgia) fermentation overview', url: 'https://nchfp.uga.edu/how/can_ferment.html' },
    ],
    overallTier: 'moderate',
    linkedCuratedRecipeId: 'curated_ferment_rejuvelac',
    linkedBuilderType: 'fermentation',
    relatedIds: ['fermentmethod-dairy-free-gluten-free-survey', 'celiac-fermented-drinks', 'lupus-fermented-drinks'],
    recipeCard: {
      yield: 'Makes about 6 cups, enough for two people across several days.',
      ingredients: [
        { text: '1 cup (200g) quinoa, sprouted (rinse and soak 8 hours, then drain and rinse twice daily for 2 days until small tails appear)' },
        { text: '6 cups (1.5 liters) filtered, unchlorinated water' },
      ],
      instructions: [
        'Once the quinoa has sprouted small tails, put it in a clean half-gallon jar.',
        'Add the water and cover with a breathable cloth secured by a rubber band.',
        'Let it ferment at room temperature for 2-3 days, until cloudy and pleasantly tart, with a lemony smell.',
        'Strain out the quinoa and refrigerate the liquid. Keeps about a week.',
      ],
      nutritionHighlights: [
        { nutrient: 'Live wild cultures', note: 'Sprouting first activates enzymes already present in the grain, and the fermentation that follows adds bacteria on top of that.' },
      ],
      conditionNotes: [],
      flavorNotes: 'Tart, lightly cloudy, and mild, closer to a very light lemon water than a fruit soda.',
    },
  },
  {
    id: 'recipe-ferment-mauby-burdock-tonic',
    category: 'recipes',
    title: 'Burdock Bark-Style Mauby Tonic',
    teaser: 'A bittersweet, warmly spiced digestive tonic, built from a bitter, available root instead of an unavailable tree bark.',
    summary: 'Traditional Mauby ferments the bark of the soldierwood tree, an ingredient this app\'s reference database has no matching row for at all. Burdock root fills the same bitter-tonic role and is a bitter root in its own right, paired here with the same warming spices (cinnamon, cloves) traditional Mauby uses. Bitter tonics have a long traditional reputation for stimulating digestion before a meal, though that specific traditional use hasn\'t been rigorously trial-tested the way many other claims in this app have been.',
    citations: [
      { source: 'National Center for Home Food Preservation (University of Georgia) fermentation overview', url: 'https://nchfp.uga.edu/how/can_ferment.html' },
    ],
    overallTier: 'weak',
    linkedCuratedRecipeId: 'curated_ferment_mauby_burdock_tonic',
    linkedBuilderType: 'fermentation',
    relatedIds: ['fermentmethod-dairy-free-gluten-free-survey'],
    recipeCard: {
      yield: 'Makes about 6 cups. Traditionally taken as a small glass rather than a full pitcher serving.',
      ingredients: [
        { text: '1/2 cup (100g) burdock root, sliced' },
        { text: '1 teaspoon (3g) cinnamon' },
        { text: '1/4 teaspoon (1g) ground cloves' },
        { text: '1/3 cup (about 65g) raw honey' },
        { text: '6 cups (1.5 liters) filtered, unchlorinated water' },
      ],
      instructions: [
        'Combine the sliced burdock root, cinnamon, and cloves in a clean half-gallon jar.',
        'Dissolve the honey in the water and pour it over everything.',
        'Cover with a breathable cloth secured by a rubber band.',
        'Ferment at room temperature for 3-5 days, tasting daily until bittersweet and lightly tangy.',
        'Strain and refrigerate. Keeps about 1-2 weeks.',
      ],
      nutritionHighlights: [
        { nutrient: 'Bitter root compounds', note: 'Burdock root carries its bitter compounds, the same traditional bitter-tonic role soldierwood bark plays in authentic Mauby.' },
      ],
      conditionNotes: [
        { condition: 'Gallbladder or bile duct conditions', note: 'Bitter tonics traditionally work by stimulating bile flow; check with your care team before making this a regular habit if you have a gallbladder or bile duct condition.' },
        { condition: 'Pregnancy', note: 'Concentrated bitter herbal ferments like this one are generally best discussed with your care provider before regular use during pregnancy.' },
      ],
      flavorNotes: 'Bittersweet and warmly spiced, an acquired taste, traditionally sipped rather than gulped.',
    },
  },
  {
    id: 'recipe-ferment-burdock-dandelion-ale',
    category: 'recipes',
    title: 'Burdock and Dandelion Ale',
    teaser: 'An earthy, bitter, lightly fizzy herbal ferment, built gluten-free by using honey instead of barley malt.',
    summary: 'Traditional versions use barley malt as the fermentable sugar for the yeast, which brings gluten along with it. This version uses honey instead, sidestepping the grain entirely rather than hunting for a malted gluten-free substitute. Dandelion has documented diuretic activity in one small human study, relevant if fluid balance matters to you.',
    citations: [
      { source: 'Clare et al. 2009, Journal of Alternative and Complementary Medicine: diuretic effect of dandelion leaf extract in human subjects', url: 'https://pubmed.ncbi.nlm.nih.gov/19678785/' },
    ],
    overallTier: 'moderate',
    linkedCuratedRecipeId: 'curated_ferment_burdock_dandelion_ale',
    linkedBuilderType: 'fermentation',
    relatedIds: ['fermentmethod-dairy-free-gluten-free-survey'],
    recipeCard: {
      yield: 'Makes about 6 cups, enough for two people across several days.',
      ingredients: [
        { text: '1/3 cup (80g) burdock root, sliced' },
        { text: '1 cup (60g) dandelion greens, chopped' },
        { text: '1/3 cup plus 1 tablespoon (about 85g) raw honey' },
        { text: '6 cups (1.5 liters) filtered, unchlorinated water' },
      ],
      instructions: [
        'Combine the burdock root and dandelion greens in a clean half-gallon jar.',
        'Dissolve the honey in the water and pour it over everything.',
        'Cover with a breathable cloth secured by a rubber band.',
        'Ferment at room temperature for 3-5 days, tasting daily.',
        'Strain and refrigerate once bitter, earthy, and lightly fizzy. Keeps about 1-2 weeks.',
      ],
      nutritionHighlights: [
        { nutrient: 'Inulin', note: 'Both burdock and dandelion root carry this prebiotic fiber, feeding beneficial gut bacteria.' },
      ],
      conditionNotes: [
        { condition: 'Chronic Kidney Disease / blood pressure medication', note: 'Dandelion has a documented diuretic effect; check with your care team before regular use if you take a diuretic medication or have kidney concerns.' },
      ],
      flavorNotes: 'Earthy and bitter with a lightly fizzy finish, closer to a craft root beer without the sweetness than an actual ale.',
    },
  },
  {
    id: 'recipe-ferment-pozol',
    category: 'recipes',
    title: 'Pozol',
    teaser: 'A tangy, filling Mesoamerican fermented corn drink, built on the same alkaline corn preparation that prevents pellagra.',
    summary: 'Pozol is built from nixtamalized corn, corn that\'s been soaked in an alkaline solution, the same preparation used to make tortillas and hominy. That process makes the corn\'s niacin dramatically more bioavailable than untreated corn, historically the difference between populations that relied on corn as a staple without developing pellagra (a niacin-deficiency disease) and those that didn\'t nixtamalize it at all.',
    citations: [
      { source: 'Nixtamalization: an overview, ScienceDirect Topics (compiling peer-reviewed food science literature)', url: 'https://www.sciencedirect.com/topics/food-science/nixtamalization' },
    ],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_ferment_pozol',
    linkedBuilderType: 'fermentation',
    relatedIds: ['fermentmethod-dairy-free-gluten-free-survey'],
    recipeCard: {
      yield: 'Makes about 6 cups, enough for two people across several days.',
      ingredients: [
        { text: '2 1/2 cups (400g) hominy (nixtamalized corn)' },
        { text: '6 cups (1.5 liters) filtered, unchlorinated water' },
      ],
      instructions: [
        'Blend the hominy with about a third of the water until it forms a thick, coarse paste.',
        'Shape into a ball or thick disc and wrap in a clean cloth.',
        'Let it ferment at room temperature for 3-5 days, until noticeably tangy and slightly bubbly when broken open.',
        'Whisk the fermented dough with the remaining water to your preferred consistency.',
        'Refrigerate. Drink within a few days, this ferments quickly once mixed with water.',
      ],
      nutritionHighlights: [
        { nutrient: 'Niacin (B3)', note: 'The alkaline nixtamalization process makes corn\'s niacin dramatically more absorbable than untreated corn.' },
      ],
      conditionNotes: [
        { condition: 'AIP / corn sensitivity', note: 'Corn is gluten-free but a known cross-reactive grain for some gluten-sensitive people, and is excluded from the strict Autoimmune Protocol elimination diet.' },
      ],
      flavorNotes: 'Tangy, thick, and filling, traditionally drunk cold as a hydrating, energizing field drink.',
    },
  },
  {
    id: 'recipe-ferment-sobia',
    category: 'recipes',
    title: 'Sobia (Dairy-Free)',
    teaser: 'A creamy, cardamom-spiced Saudi Arabian rice ferment, built dairy-free using coconut milk in place of traditional dairy.',
    summary: 'Traditional Sobia is often made with dairy milk. This version uses coconut milk instead, keeping the same creamy texture without dairy\'s casein and lactose, a pleasant everyday drink for most people either way. A traditional dairy-milk version is equally valid if dairy isn\'t a concern for you, just swap in whole milk for the coconut milk here.',
    citations: [
      { source: 'National Center for Home Food Preservation (University of Georgia) fermentation overview', url: 'https://nchfp.uga.edu/how/can_ferment.html' },
    ],
    overallTier: 'moderate',
    linkedCuratedRecipeId: 'curated_ferment_sobia',
    linkedBuilderType: 'fermentation',
    relatedIds: ['fermentmethod-dairy-free-gluten-free-survey'],
    recipeCard: {
      yield: 'Makes about 6 cups, enough for two people across several days.',
      ingredients: [
        { text: '2/3 cup (150g) rice, soaked several hours then blended smooth with a little water' },
        { text: '1 3/4 cups (400ml) coconut milk' },
        { text: '1/2 teaspoon (2g) ground cardamom' },
        { text: '2 1/2 tablespoons (about 50g) raw honey' },
        { text: '3 1/3 cups (800ml) filtered water' },
      ],
      instructions: [
        'Combine the blended rice, coconut milk, cardamom, and water in a clean half-gallon jar.',
        'Dissolve the honey in and stir well.',
        'Cover with a breathable cloth secured by a rubber band.',
        'Let it ferment at room temperature for 1-2 days, tasting periodically.',
        'Strain if you prefer a smoother texture, then refrigerate. Keeps about a week.',
      ],
      nutritionHighlights: [
        { nutrient: 'Lauric acid', note: 'From the coconut milk, a documented antimicrobial fatty acid, on top of whatever live culture develops during the short ferment.' },
      ],
      conditionNotes: [],
      flavorNotes: 'Creamy, spiced, and lightly sweet, closer to a chilled rice horchata than a tangy soda.',
    },
  },
  {
    id: 'recipe-ferment-rosemary-cheong',
    category: 'recipes',
    title: 'Rosemary Cheong (Pine Needle-Style)',
    teaser: 'A concentrated herbal sugar syrup-ferment, built from a confirmed edible herb instead of foraged pine needles, since not every pine species is safe to eat.',
    summary: 'Traditional Korean Pine Needle Cheong uses fresh pine needles. Not every pine species is actually safe to eat: ponderosa pine can act as an abortifacient in livestock, and yew trees, a toxic look-alike, get mistaken for pine by inexperienced foragers with serious consequences. Since this app has no way to confirm which conifer is growing in any one person\'s yard, this version uses rosemary instead, a confirmed culinary herb with a similar resinous character, rather than asking anyone to forage and identify a wild conifer themselves.',
    citations: [
      { source: 'Missouri Poison Center: Pine Needles safety guidance', url: 'https://missouripoisoncenter.org/is-this-a-poison/pine-needles/' },
    ],
    overallTier: 'moderate',
    linkedCuratedRecipeId: 'curated_ferment_rosemary_cheong',
    linkedBuilderType: 'fermentation',
    relatedIds: ['fermentmethod-dairy-free-gluten-free-survey'],
    recipeCard: {
      yield: 'Makes about 1 cup of finished syrup, used a spoonful at a time in water or tea.',
      ingredients: [
        { text: '1 cup (100g) fresh rosemary, roughly chopped' },
        { text: '1/2 cup (100g) sugar' },
      ],
      instructions: [
        'Layer the chopped rosemary and sugar in a clean pint jar, pressing down lightly as you go.',
        'Cover loosely (not fully airtight) and let it sit at room temperature.',
        'Shake or stir gently once a day. Osmotic pressure from the sugar draws liquid out of the rosemary over several days.',
        'Once a syrupy liquid has pooled at the bottom (about 5-7 days), strain out the rosemary.',
        'Store the syrup in the refrigerator. Use a spoonful stirred into water or tea.',
      ],
      nutritionHighlights: [
        { nutrient: 'Rosmarinic acid', note: 'Rosemary\'s signature polyphenol, with a traditional reputation for antioxidant activity.' },
      ],
      conditionNotes: [],
      flavorNotes: 'Herbal, resinous, and sweet, closer to a rosemary simple syrup than a fizzy drink, meant to be diluted rather than drunk straight.',
    },
  },
  {
    id: 'recipe-ferment-boza',
    category: 'recipes',
    title: 'Boza',
    teaser: 'A thick, tangy, mildly sweet Balkan and Turkish grain ferment, built on millet, one of its traditional grains.',
    summary: 'Boza is traditionally made from millet, wheat, or corn. This version uses millet, naturally gluten-free, so no substitution was actually needed here, just a choice among Boza\'s traditional options.',
    citations: [
      { source: 'National Center for Home Food Preservation (University of Georgia) fermentation overview', url: 'https://nchfp.uga.edu/how/can_ferment.html' },
    ],
    overallTier: 'moderate',
    linkedCuratedRecipeId: 'curated_ferment_boza',
    linkedBuilderType: 'fermentation',
    relatedIds: ['fermentmethod-dairy-free-gluten-free-survey'],
    recipeCard: {
      yield: 'Makes about 6 cups, enough for two people across several days.',
      ingredients: [
        { text: '2 cups (200g) puffed millet' },
        { text: '1/3 cup (80g) sugar' },
        { text: '6 cups (1.5 liters) filtered, unchlorinated water' },
      ],
      instructions: [
        'Simmer the puffed millet in the water for 15-20 minutes, until it breaks down into a thick, porridge-like consistency.',
        'Stir in the sugar and let it cool completely to room temperature.',
        'Transfer to a clean half-gallon jar, cover with a breathable cloth secured by a rubber band.',
        'Ferment at room temperature for 1-2 days, until tangy with a few visible bubbles.',
        'Refrigerate. Drink within a few days, stirring before serving since it settles.',
      ],
      nutritionHighlights: [
        { nutrient: 'Whole-grain fiber', note: 'A thicker, more filling drink than most other ferments here, from the millet\'s intact starch and fiber.' },
      ],
      conditionNotes: [],
      flavorNotes: 'Thick and tangy with a mild sweetness, closer to a drinkable porridge than a clear soda.',
    },
  },
  {
    id: 'recipe-ferment-chicha-de-jora',
    category: 'recipes',
    title: 'Chicha de Jora',
    teaser: 'A tangy, lightly fizzy Andean fermented corn drink, made the malted-corn way rather than the older saliva-started method.',
    summary: 'Chicha de Jora is built by sprouting corn before fermenting it (the \"jora\" malting step), the more common traditional method across the Andes today, distinct from the older saliva-started method some regional versions historically used. Sprouting develops natural enzymes that help convert the corn\'s starch into fermentable sugar.',
    citations: [
      { source: 'National Center for Home Food Preservation (University of Georgia) fermentation overview', url: 'https://nchfp.uga.edu/how/can_ferment.html' },
    ],
    overallTier: 'moderate',
    linkedCuratedRecipeId: 'curated_ferment_chicha',
    linkedBuilderType: 'fermentation',
    relatedIds: ['fermentmethod-dairy-free-gluten-free-survey'],
    recipeCard: {
      yield: 'Makes about 6 cups, enough for two people across several days.',
      ingredients: [
        { text: '2 1/2 cups (400g) hominy, sprouted (soak 24 hours, drain, and let sit covered until small sprouts appear, 2-3 days)' },
        { text: '1/4 cup (60g) sugar' },
        { text: '6 cups (1.5 liters) filtered, unchlorinated water' },
      ],
      instructions: [
        'Simmer the sprouted hominy in the water for 30-40 minutes, until softened.',
        'Stir in the sugar and let cool completely to room temperature.',
        'Strain, reserving the liquid, and transfer to a clean half-gallon jar.',
        'Cover with a breathable cloth secured by a rubber band.',
        'Ferment at room temperature for 2-4 days, tasting daily, until tangy and lightly fizzy.',
        'Refrigerate. Drink within a few days.',
      ],
      nutritionHighlights: [
        { nutrient: 'Resistant starch', note: 'Sprouting and fermenting the corn changes its starch structure, generally making it gentler on digestion than unsprouted corn.' },
      ],
      conditionNotes: [
        { condition: 'AIP / corn sensitivity', note: 'Corn is gluten-free but a known cross-reactive grain for some gluten-sensitive people, and this ferment can develop meaningful alcohol content if left fermenting several days.' },
      ],
      flavorNotes: 'Tangy and lightly effervescent, mildly sweet, traditionally served slightly chilled.',
    },
  },
  {
    id: 'recipe-ferment-rye-style-kvass-quinoa',
    category: 'recipes',
    title: 'Rye-Style Kvass (Toasted Quinoa)',
    teaser: 'A tangy, bready Russian and Ukrainian ferment tradition, built gluten-free with toasted quinoa standing in for rye bread.',
    summary: 'Traditional kvass ferments rye bread, distinct from this app\'s Beet Kvass (a root-vegetable ferment sharing only the name). This version toasts quinoa to develop a similar roasted, bready flavor without the gluten, the same substitution logic as this app\'s Rejuvelac recipe above.',
    citations: [
      { source: 'National Center for Home Food Preservation (University of Georgia) fermentation overview', url: 'https://nchfp.uga.edu/how/can_ferment.html' },
    ],
    overallTier: 'moderate',
    linkedCuratedRecipeId: 'curated_ferment_rye_style_kvass_quinoa',
    linkedBuilderType: 'fermentation',
    relatedIds: ['fermentmethod-dairy-free-gluten-free-survey', 'recipe-ferment-beet-kvass', 'celiac-fermented-drinks'],
    recipeCard: {
      yield: 'Makes about 6 cups, enough for two people across several days.',
      ingredients: [
        { text: '1 cup (200g) quinoa, toasted in a dry pan until fragrant and lightly browned' },
        { text: '1/3 cup (about 65g) raw honey' },
        { text: '6 cups (1.5 liters) filtered, unchlorinated water' },
      ],
      instructions: [
        'Toast the quinoa in a dry skillet over medium heat, stirring often, until fragrant and lightly browned, about 5-8 minutes.',
        'Let it cool, then put it in a clean half-gallon jar.',
        'Dissolve the honey in the water and pour it over the quinoa.',
        'Cover with a breathable cloth secured by a rubber band.',
        'Ferment at room temperature for 2-3 days, tasting daily, until tangy and lightly fizzy.',
        'Strain and refrigerate. Keeps about a week.',
      ],
      nutritionHighlights: [
        { nutrient: 'Live wild cultures', note: 'Wild yeast and bacteria already present on the quinoa and in the air do the fermenting, the same wild-ferment principle as this app\'s tonic family.' },
      ],
      conditionNotes: [],
      flavorNotes: 'Tangy and bready with a toasted, nutty background, closer to a light beer than a fruit soda.',
    },
  },
  {
    id: 'recipe-ferment-sake-style-rice-wine',
    category: 'recipes',
    title: 'Home-Style Rice Wine (Sake-Style)',
    teaser: 'A traditional Japanese rice ferment, actually alcoholic once fully fermented, good to know before trying it.',
    summary: 'Traditional sake production uses koji mold to convert rice starch into sugar before yeast converts that sugar into alcohol, a different two-step process from a beer or wine ferment, which starts from sugar that\'s already there. A simple home batch like this one stays comparatively low in alcohol, but it is an alcoholic ferment, not a soda.',
    citations: [
      { source: 'National Center for Home Food Preservation (University of Georgia) fermentation overview', url: 'https://nchfp.uga.edu/how/can_ferment.html' },
    ],
    overallTier: 'moderate',
    linkedCuratedRecipeId: 'curated_ferment_sake_style_rice_wine',
    linkedBuilderType: 'fermentation',
    relatedIds: ['fermentmethod-dairy-free-gluten-free-survey', 'lifestyle-alcohol-advisory'],
    recipeCard: {
      yield: 'Makes about 8 cups, meant to be sipped in small amounts given its alcohol content.',
      ingredients: [
        { text: '2 cups (400g) rice, rinsed well' },
        { text: '6 cups (1.5 liters) water' },
        { text: 'Koji rice culture and sake yeast, per package instructions (available from a fermentation supplier)' },
      ],
      instructions: [
        'Cook the rice with the water until soft, then let it cool to room temperature.',
        'Stir in the koji culture per its package instructions and let it sit 1-2 days until noticeably sweet, this is the starch-to-sugar step.',
        'Add the sake yeast and transfer to a clean half-gallon jar, cover loosely (not fully airtight, since gas builds up).',
        'Ferment at room temperature for 1-2 weeks, stirring daily, until fermentation activity slows and it tastes distinctly alcoholic rather than sweet.',
        'Strain through a cloth, pressing to extract the liquid, and refrigerate.',
      ],
      nutritionHighlights: [],
      conditionNotes: [
        { condition: 'Pregnancy / liver conditions / alcohol-avoidant', note: 'This is an alcoholic ferment, not a low-alcohol soda the way this app\'s wild-fermented tonics are. Skip it entirely if you avoid alcohol for any reason.' },
      ],
      flavorNotes: 'Cloudy, mildly sweet, and warming, with alcohol content that builds the longer it ferments.',
    },
  },
  {
    id: 'recipe-ferment-makgeolli',
    category: 'recipes',
    title: 'Makgeolli',
    teaser: 'A milky, lightly sparkling Korean rice wine, left unfiltered so it carries live lactic acid bacteria alongside its alcohol content.',
    summary: 'Unlike sake, which is typically strained clear, makgeolli is left unfiltered, so live lactic acid bacteria stay in the finished drink at levels comparable to yogurt, alongside the yeast doing the alcoholic fermentation. It\'s a different drink from sake for that reason, not just a cloudier version of it, though it\'s still an alcoholic beverage.',
    citations: [
      { source: 'Nile & Park 2015, Journal of the Institute of Brewing: nutritional, biochemical and health effects of makgeolli', url: 'https://onlinelibrary.wiley.com/doi/full/10.1002/jib.264' },
    ],
    overallTier: 'moderate',
    linkedCuratedRecipeId: 'curated_ferment_makgeolli',
    linkedBuilderType: 'fermentation',
    relatedIds: ['fermentmethod-dairy-free-gluten-free-survey', 'lifestyle-alcohol-advisory'],
    recipeCard: {
      yield: 'Makes about 8 cups, meant to be sipped in small amounts given its alcohol content.',
      ingredients: [
        { text: '2 cups (400g) rice, rinsed well' },
        { text: '6 cups (1.5 liters) water' },
        { text: 'Nuruk (Korean fermentation starter), per package instructions (available from a Korean grocery or fermentation supplier)' },
      ],
      instructions: [
        'Cook the rice with the water until soft, then let it cool to room temperature.',
        'Crumble in the nuruk per its package instructions and mix well.',
        'Transfer to a clean half-gallon jar, cover loosely (not fully airtight).',
        'Ferment at room temperature for 5-7 days, stirring daily, until it separates into a cloudy liquid layer and settled solids.',
        'Stir the whole batch together, strain through a cloth for a smoother drink or leave it thick and unstrained, and refrigerate.',
      ],
      nutritionHighlights: [
        { nutrient: 'Live lactic acid bacteria', note: 'Left in the drink specifically because it isn\'t filtered clear, at levels the cited research compares directly to yogurt.' },
      ],
      conditionNotes: [
        { condition: 'Pregnancy / liver conditions / alcohol-avoidant', note: 'This is an alcoholic ferment. Skip it entirely if you avoid alcohol for any reason.' },
      ],
      flavorNotes: 'Milky, tangy, and lightly sparkling, thicker and cloudier than sake, with a mild natural sweetness.',
    },
  },
  {
    id: 'recipe-ferment-ayran',
    category: 'recipes',
    title: 'Ayran',
    teaser: 'A salty, tangy, refreshing Turkish yogurt drink, about as simple as a fermented drink gets.',
    summary: 'Ayran is yogurt thinned with water and lightly salted, nothing more, keeping the same live cultures as the yogurt itself while lowering its overall calorie density. A traditionally savory drink rather than a sweet one, closer to a savory electrolyte drink than a smoothie.',
    citations: [
      { source: 'Codex Alimentarius (FAO/WHO) Standard for Fermented Milks, yogurt starter-culture requirement', url: 'https://www.fao.org/fao-who-codexalimentarius/sh-proxy/en/?lnk=1&url=https%253A%252F%252Fworkspace.fao.org%252Fsites%252Fcodex%252FStandards%252FCXS%2B243-2003%252FCXS_243e.pdf' },
    ],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_ferment_ayran',
    linkedBuilderType: 'fermentation',
    relatedIds: ['fermentmethod-milk-kefir-and-yogurt'],
    recipeCard: {
      yield: 'Makes about 4 cups, enough for two people.',
      ingredients: [
        { text: '1 1/4 cups (300g) plain yogurt' },
        { text: '3 cups (700ml) cold water' },
        { text: '1/2 teaspoon (3g) salt' },
        { text: 'A few fresh mint leaves, torn, optional garnish' },
      ],
      instructions: [
        'Whisk the yogurt and water together until smooth and frothy.',
        'Stir in the salt.',
        'Serve cold, garnished with torn mint if using.',
      ],
      nutritionHighlights: [
        { nutrient: 'Live cultures', note: 'Carries the same live yogurt cultures as the yogurt it\'s made from, just diluted.' },
        { nutrient: 'Sodium', note: 'Genuinely salty by design, traditionally drunk to help replace electrolytes lost to sweat in hot weather.' },
      ],
      conditionNotes: [
        { condition: 'Hashimoto\'s / Celiac / dairy sensitivity', note: 'This is a dairy drink; if dairy is a trigger, this one isn\'t easily made without it the way some other ferments here are.' },
        { condition: 'Chronic Kidney Disease / sodium-restricted diets', note: 'Its salt content is deliberate; adjust or skip if you\'re on a sodium-restricted diet.' },
      ],
      flavorNotes: 'Salty, tangy, and refreshing, savory rather than sweet, traditionally served ice-cold.',
    },
  },
  {
    id: 'recipe-ferment-mango-lassi',
    category: 'recipes',
    title: 'Mango Lassi',
    teaser: 'A creamy, fragrant Indian yogurt drink, the most familiar lassi variation, sweetened with whole fruit rather than syrup.',
    summary: 'Lassi can be sweet or savory; this is the mango version, the most widely recognized outside India. Built with whole mango and a small amount of honey rather than a sweetened syrup or artificial flavoring, so most of its sweetness comes from whole fruit.',
    citations: [
      { source: 'Codex Alimentarius (FAO/WHO) Standard for Fermented Milks, yogurt starter-culture requirement', url: 'https://www.fao.org/fao-who-codexalimentarius/sh-proxy/en/?lnk=1&url=https%253A%252F%252Fworkspace.fao.org%252Fsites%252Fcodex%252FStandards%252FCXS%2B243-2003%252FCXS_243e.pdf' },
    ],
    overallTier: 'strong',
    linkedCuratedRecipeId: 'curated_ferment_mango_lassi',
    linkedBuilderType: 'fermentation',
    relatedIds: ['fermentmethod-milk-kefir-and-yogurt', 'recipe-ferment-ayran'],
    recipeCard: {
      yield: 'Makes about 4 cups, enough for two people.',
      ingredients: [
        { text: '1 1/4 cups (300g) plain yogurt' },
        { text: '1 1/3 cups (200g) mango, diced' },
        { text: 'A pinch (1g) ground cardamom' },
        { text: '4 teaspoons (20g) raw honey' },
        { text: '3/4 cup (200ml) cold water' },
      ],
      instructions: [
        'Blend the yogurt, mango, cardamom, honey, and water together until smooth.',
        'Adjust thickness with a little more water if you prefer it thinner.',
        'Serve cold.',
      ],
      nutritionHighlights: [
        { nutrient: 'Vitamin C', note: 'From the whole mango, alongside the live cultures already present in the yogurt.' },
        { nutrient: 'Live cultures', note: 'Carries the same live yogurt cultures the ayran recipe above does, in a sweeter, fruitier form.' },
      ],
      conditionNotes: [
        { condition: 'Hashimoto\'s / Celiac / dairy sensitivity', note: 'This is a dairy drink, relevant if dairy is a trigger for you.' },
        { condition: 'Type 2 Diabetes / PCOS', note: 'Mango is a naturally sweet fruit; this is more of an occasional treat than an everyday drink if blood sugar is a concern.' },
      ],
      flavorNotes: 'Creamy, sweet, and fragrant with cardamom, a dessert-like drink rather than a tart one.',
    },
  },
  {
    id: 'recipe-ferment-tarag-style',
    category: 'recipes',
    title: 'Tarag-Style Fermented Milk',
    teaser: 'A tangy, effervescent Mongolian-style fermented milk drink, built with cow\'s milk since this app has no way to source mare\'s or camel\'s milk.',
    summary: 'Traditional Tarag ferments mare\'s or camel\'s milk, neither of which this app\'s reference database carries at all. This version uses cow\'s milk instead, the nearest available analogue: traditional Tarag\'s higher lactose content and different fat profile from mare\'s milk aren\'t reproduced here, this is a cow\'s-milk-kefir-style approximation of the idea, not the traditional drink itself.',
    citations: [
      { source: 'National Center for Home Food Preservation (University of Georgia) fermentation overview', url: 'https://nchfp.uga.edu/how/can_ferment.html' },
    ],
    overallTier: 'weak',
    linkedCuratedRecipeId: 'curated_ferment_tarag_style',
    linkedBuilderType: 'fermentation',
    relatedIds: ['fermentmethod-dairy-free-gluten-free-survey', 'recipe-ferment-milk-kefir'],
    recipeCard: {
      yield: 'Makes about 4 cups. Restarts easily every 24 hours once active.',
      ingredients: [
        { text: '4 cups (1 liter) whole milk' },
        { text: '1/4 cup (about 60g) active milk kefir grains, or 2 tablespoons plain live-culture yogurt as a starter' },
      ],
      instructions: [
        'Put the milk and starter in a clean quart jar.',
        'Cover with a breathable cloth secured by a rubber band.',
        'Let it sit at room temperature for 24-48 hours, until thickened, tangy, and lightly effervescent.',
        'Strain out any kefir grains if used, and refrigerate the liquid.',
      ],
      nutritionHighlights: [],
      conditionNotes: [
        { condition: 'Hashimoto\'s / Celiac / dairy sensitivity', note: 'This is a full dairy ferment, relevant if dairy is a trigger for you.' },
      ],
      flavorNotes: 'Tangy and slightly effervescent, thinner than yogurt, similar in spirit to milk kefir.',
    },
  },
  {
    id: 'recipe-ferment-puerh-style-tea',
    category: 'recipes',
    title: 'Pu-erh-Style Fermented Tea',
    teaser: 'A kombucha-style home ferment built to evoke pu-erh\'s fermented-tea tradition, since true pu-erh leaf isn\'t something this database carries.',
    summary: 'This database carries no true pu-erh tea leaf, so this version uses brewed black tea as the fermentable base for a home SCOBY ferment instead. True pu-erh is aged and fermented by microbes directly on the tea leaf over months or years, a process a quick home ferment doesn\'t actually replicate either way, so this is a home-kitchen homage to the idea, not a claim of authenticity. Pu-erh itself has separate, strong human trial evidence for improving cholesterol and liver fat, though this home version doesn\'t reproduce that specific research.',
    citations: [
      { source: 'Huang et al. 2019, Nature Communications: theabrownin from Pu-erh tea attenuates hypercholesterolemia via gut microbiota and bile acid metabolism, human and mouse data', url: 'https://pubmed.ncbi.nlm.nih.gov/31672964/' },
    ],
    overallTier: 'moderate',
    linkedCuratedRecipeId: 'curated_ferment_puerh_style_tea',
    linkedBuilderType: 'fermentation',
    relatedIds: ['fermentmethod-kombucha', 'fermentmethod-dairy-free-gluten-free-survey', 'masld-fermented-drinks', 'cvd-fermented-drinks'],
    recipeCard: {
      yield: 'Makes about 8 cups, enough for two people across a week or more.',
      ingredients: [
        { text: '8 cups (2 liters) brewed black tea, cooled to room temperature' },
        { text: '1 cup (200g) sugar' },
        { text: '1 SCOBY plus 1 cup starter liquid from a previous kombucha batch' },
      ],
      instructions: [
        'Brew the black tea strong and let it cool completely to room temperature.',
        'Stir in the sugar until dissolved.',
        'Pour into a clean half-gallon jar and add the SCOBY and starter liquid.',
        'Cover with a breathable cloth secured by a rubber band.',
        'Ferment at room temperature for 7-14 days, tasting periodically, until tart.',
        'Remove the SCOBY, bottle the liquid, and refrigerate.',
      ],
      nutritionHighlights: [],
      conditionNotes: [],
      flavorNotes: 'Tangy and lightly effervescent, deep and malty from the black tea base, closer to standard kombucha than to true aged pu-erh.',
    },
  },
  {
    id: 'recipe-ferment-coconut-palm-wine-style',
    category: 'recipes',
    title: 'Coconut Palm Wine-Style Ferment',
    teaser: 'A wild-fermented coconut water drink built to evoke traditional palm wine, mildly alcoholic once fully fermented.',
    summary: 'Traditional palm wine ferments sap tapped directly from a palm tree, which this database has no ingredient for. Coconut water (itself a palm-tree product, just not tapped sap) stands in instead, fermented longer than this app\'s Coconut Kefir to develop meaningfully more alcohol content, a different drink from that shorter, milder ferment.',
    citations: [
      { source: 'Biomedical Applications of Lauric Acid: A Narrative Review, PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov/39036266/' },
    ],
    overallTier: 'weak',
    linkedCuratedRecipeId: 'curated_ferment_coconut_palm_wine_style',
    linkedBuilderType: 'fermentation',
    relatedIds: ['fermentmethod-dairy-free-gluten-free-survey', 'recipe-ferment-coconut-kefir', 'lifestyle-alcohol-advisory'],
    recipeCard: {
      yield: 'Makes about 6 cups, meant to be sipped in small amounts given its alcohol content.',
      ingredients: [
        { text: '6 cups (1.5 liters) unsweetened coconut water' },
        { text: '1/2 cup (100g) sugar' },
      ],
      instructions: [
        'Combine the coconut water and sugar in a clean half-gallon jar, stirring to dissolve.',
        'Cover with a breathable cloth secured by a rubber band.',
        'Let it ferment at room temperature for 5-7 days, tasting periodically, until it develops a noticeably winy, less sweet flavor.',
        'Strain if needed, and refrigerate, or bottle sealed for another day or two to build carbonation first.',
      ],
      nutritionHighlights: [
        { nutrient: 'Lauric acid', note: 'From the coconut itself, a documented antimicrobial fatty acid, alongside whatever alcohol content the fermentation develops.' },
      ],
      conditionNotes: [
        { condition: 'Pregnancy / liver conditions / alcohol-avoidant', note: 'This is an alcoholic ferment once fully fermented, distinct from this app\'s milder Coconut Kefir. Skip it entirely if you avoid alcohol for any reason.' },
        { condition: 'Chronic Kidney Disease', note: 'Coconut water is high in potassium; check with your care team before making this a regular drink if potassium is restricted.' },
      ],
      flavorNotes: 'Tangy and winy, less sweet than fresh coconut water, with alcohol content that builds the longer it ferments.',
    },
  },
  {
    id: 'recipe-ferment-maple-pulque-style',
    category: 'recipes',
    title: 'Maple "Pulque-Style" Wild Ferment',
    teaser: 'A wild-fermented maple syrup drink built to evoke traditional pulque, mildly alcoholic once fully fermented.',
    summary: 'Traditional pulque ferments fresh agave sap (aguamiel). This database\'s agave syrup rows are entirely hidden as a data-quality decision, so this version uses maple syrup instead, the nearest available pure plant syrup, different in flavor from traditional pulque\'s distinctive tang.',
    citations: [
      { source: 'National Center for Home Food Preservation (University of Georgia) fermentation overview', url: 'https://nchfp.uga.edu/how/can_ferment.html' },
    ],
    overallTier: 'weak',
    linkedCuratedRecipeId: 'curated_ferment_maple_pulque_style',
    linkedBuilderType: 'fermentation',
    relatedIds: ['fermentmethod-dairy-free-gluten-free-survey', 'lifestyle-alcohol-advisory'],
    recipeCard: {
      yield: 'Makes about 6 cups, meant to be sipped in small amounts given its alcohol content.',
      ingredients: [
        { text: '2/3 cup (150g) pure maple syrup' },
        { text: '6 cups (1.5 liters) filtered, unchlorinated water' },
      ],
      instructions: [
        'Dissolve the maple syrup in the water in a clean half-gallon jar.',
        'Cover with a breathable cloth secured by a rubber band.',
        'Let it ferment at room temperature for 5-7 days, tasting periodically, until noticeably less sweet and tangy.',
        'Strain if needed, and refrigerate.',
      ],
      nutritionHighlights: [
        { nutrient: 'Manganese', note: 'Maple syrup is a well-known whole-food source, though fermentation and dilution both reduce the final concentration in this drink.' },
      ],
      conditionNotes: [
        { condition: 'Pregnancy / liver conditions / alcohol-avoidant', note: 'This is an alcoholic ferment once fully fermented. Skip it entirely if you avoid alcohol for any reason.' },
      ],
      flavorNotes: 'Tangy and less sweet than plain maple water, with alcohol content that builds the longer it ferments.',
    },
  },
];

