// Made at home instead, G22 (2026-10-02). From a scanned packaged product,
// the recipes and whole foods of the same kind that clear the person's
// lists: a breakfast cereal brings up porridge recipes and oats, buckwheat
// and millet; a soda brings up kombucha and kvass; a jar of sauce brings
// up the sauce recipes and fresh herbs.
//
// What kind a product is comes from Open Food Facts' categories_tags or
// USDA's brandedFoodCategory, read most specific first, and from words in
// the product name when neither says (a product scanned before G22 was
// saved without its categories). When nothing matches, the band says the
// kind was not recognised and offers nothing rather than guessing.
//
// It never says a swap is safe or better. A recipe is offered only when the
// same check the recipe itself shows (recipeFitFor, lib/householdFit.ts)
// finds nothing on the person's lists and left nothing unchecked; a whole
// food only when it is in the scored set with nothing flagged for a tracked
// condition and clears the eating style and allergy lists. Lists can miss a
// word, which the caption says.
//
// Pure: no database, no React, checked by scripts/test_packaged_swap.js.

export type SwapFoodGroup = { category: string; words: string[] };

export type SwapKind = {
  key: string;
  /** How the product is named in the band: "a breakfast cereal". */
  label: string;
  /** Phrases looked for in a category tag, whole words, a plural allowed. */
  tagWords: string[];
  /** Phrases looked for in the product name when no tag matched. */
  nameWords: string[];
  foods: SwapFoodGroup[];
  recipes: { builders?: string[]; titleWords?: string[]; mains?: boolean };
};

// Order matters: the first kind a tag matches wins, so a narrow kind (plant
// milk, nut butter, cereal bars) comes before the broad one it would
// otherwise fall into (milk, spreads, snacks).
export const SWAP_KINDS: SwapKind[] = [
  {
    key: 'plantMilk',
    label: 'a plant milk',
    tagWords: ['plant based milk', 'plant milk', 'almond milk', 'oat milk', 'soy milk', 'rice milk', 'coconut milk', 'non dairy milk', 'dairy substitute'],
    nameWords: ['almond milk', 'oat milk', 'soy milk', 'rice milk', 'cashew milk', 'oat drink', 'almond drink'],
    foods: [
      { category: 'NutSeed', words: ['almond', 'cashew', 'hazelnut', 'hemp'] },
      { category: 'Grain', words: ['oat'] },
    ],
    recipes: { titleWords: ['milk', 'latte'], builders: ['beverage'] },
  },
  {
    key: 'iceCream',
    label: 'an ice cream or frozen dessert',
    tagWords: ['ice cream', 'frozen dessert', 'sorbet', 'frozen yogurt', 'gelato'],
    nameWords: ['ice cream', 'sorbet', 'gelato', 'frozen yogurt'],
    foods: [{ category: 'Fruit', words: ['banana', 'mango', 'blueberr', 'raspberr', 'strawberr', 'cherr'] }],
    recipes: { builders: ['dessert', 'smoothie'] },
  },
  {
    key: 'yogurt',
    label: 'a yogurt or kefir',
    tagWords: ['yogurt', 'yoghurt', 'kefir', 'fermented milk', 'fermented dairy'],
    nameWords: ['yogurt', 'yoghurt', 'kefir', 'skyr'],
    foods: [{ category: 'Dairy', words: ['yogurt', 'kefir'] }],
    recipes: { builders: ['fermentation'], titleWords: ['yogurt', 'kefir'] },
  },
  {
    key: 'bar',
    label: 'a snack bar',
    tagWords: ['cereal bar', 'snack bar', 'protein bar', 'granola bar', 'energy bar', 'nut bar', 'fruit bar'],
    nameWords: ['bar', 'bars'],
    foods: [
      { category: 'NutSeed', words: ['almond', 'cashew', 'pumpkin', 'sunflower'] },
      { category: 'Fruit', words: ['date', 'apricot', 'fig'] },
    ],
    recipes: { builders: ['snack'] },
  },
  {
    key: 'nutButter',
    label: 'a nut or seed butter',
    tagWords: ['nut butter', 'peanut butter', 'almond butter', 'seed butter', 'hazelnut spread', 'tahini', 'nut and seed butter'],
    nameWords: ['peanut butter', 'almond butter', 'cashew butter', 'tahini', 'hazelnut spread', 'nut butter'],
    foods: [
      { category: 'NutSeed', words: ['almond', 'cashew', 'sesame', 'sunflower'] },
      { category: 'Legume', words: ['peanut'] },
    ],
    recipes: { titleWords: ['almond butter', 'nut butter'] },
  },
  {
    key: 'jam',
    label: 'a jam or fruit spread',
    tagWords: ['jam', 'marmalade', 'fruit preserve', 'fruit spread', 'jelly', 'jellies', 'compote'],
    nameWords: ['jam', 'marmalade', 'preserves', 'jelly', 'fruit spread'],
    foods: [{ category: 'Fruit', words: ['blueberr', 'raspberr', 'strawberr', 'apricot', 'plum', 'fig'] }],
    recipes: { titleWords: ['jam', 'compote', 'chia'] },
  },
  {
    key: 'breakfastCereal',
    label: 'a breakfast cereal',
    tagWords: ['breakfast cereal', 'cereal', 'granola', 'muesli', 'porridge', 'oat flake', 'cereal flake', 'puffed cereal'],
    nameWords: ['cereal', 'granola', 'muesli', 'porridge', 'cornflakes', 'oatmeal'],
    foods: [
      { category: 'Grain', words: ['oat', 'buckwheat', 'quinoa', 'millet', 'amaranth'] },
      { category: 'NutSeed', words: ['chia', 'flax', 'walnut', 'almond'] },
    ],
    recipes: { titleWords: ['oats', 'oatmeal', 'porridge', 'granola', 'muesli'] },
  },
  {
    key: 'juice',
    label: 'a juice',
    tagWords: ['fruit juice', 'juice', 'nectar', 'smoothie', 'vegetable juice', 'fruit drink'],
    nameWords: ['juice', 'nectar', 'smoothie'],
    foods: [{ category: 'Fruit', words: ['orange', 'apple', 'blueberr', 'raspberr', 'strawberr', 'grape', 'cherr'] }],
    recipes: { builders: ['smoothie', 'beverage'] },
  },
  {
    key: 'softDrink',
    label: 'a soft drink',
    tagWords: ['soda', 'soft drink', 'carbonated drink', 'sweetened beverage', 'energy drink', 'iced tea', 'lemonade', 'sport drink', 'sports drink', 'cola', 'flavored water', 'flavoured water'],
    nameWords: ['soda', 'cola', 'lemonade', 'energy drink', 'iced tea'],
    foods: [
      { category: 'Brewing', words: ['tea'] },
      { category: 'Fruit', words: ['lemon', 'lime'] },
      { category: 'Herbs', words: ['ginger', 'peppermint'] },
    ],
    recipes: { builders: ['beverage'], titleWords: ['kombucha', 'kvass', 'water kefir', 'ginger beer', 'lemonade', 'switchel'] },
  },
  {
    key: 'soup',
    label: 'a soup or broth',
    tagWords: ['soup', 'broth', 'bouillon', 'stock'],
    nameWords: ['soup', 'broth', 'bouillon', 'chowder', 'bisque'],
    foods: [
      { category: 'Veg', words: ['carrot', 'onion', 'celery', 'squash'] },
      { category: 'Legume', words: ['lentil'] },
    ],
    recipes: { builders: ['soup'] },
  },
  {
    key: 'sauce',
    label: 'a sauce, dressing or dip',
    tagWords: ['sauce', 'dressing', 'condiment', 'ketchup', 'mayonnaise', 'mustard', 'pesto', 'salsa', 'gravy', 'dip', 'hummus', 'vinaigrette', 'relish', 'barbecue sauce'],
    nameWords: ['sauce', 'dressing', 'ketchup', 'mayonnaise', 'mayo', 'pesto', 'salsa', 'gravy', 'dip', 'hummus', 'vinaigrette', 'relish'],
    foods: [
      { category: 'Herbs', words: ['basil', 'parsley', 'coriander', 'oregano', 'dill'] },
      { category: 'Veg', words: ['tomato', 'garlic'] },
    ],
    recipes: { builders: ['sauce'] },
  },
  {
    key: 'pickle',
    label: 'a pickle or fermented vegetable',
    tagWords: ['pickle', 'pickled', 'sauerkraut', 'kimchi', 'fermented vegetable', 'olive'],
    nameWords: ['pickle', 'pickles', 'pickled', 'sauerkraut', 'kimchi', 'gherkin', 'gherkins'],
    foods: [{ category: 'Veg', words: ['cabbage', 'cucumber', 'carrot', 'radish'] }],
    recipes: { builders: ['fermentation'], titleWords: ['sauerkraut', 'kimchi', 'pickle', 'pickled', 'fermented'] },
  },
  {
    key: 'sandwich',
    label: 'a sandwich or wrap',
    tagWords: ['sandwich', 'wrap', 'burrito', 'taco'],
    nameWords: ['sandwich', 'wrap', 'burrito'],
    foods: [{ category: 'Veg', words: ['lettuce', 'tomato', 'cucumber'] }],
    recipes: { builders: ['handheld'] },
  },
  {
    key: 'readyMeal',
    label: 'a ready meal',
    tagWords: ['meal', 'prepared meal', 'ready meal', 'frozen meal', 'frozen dinner', 'entree', 'pizza', 'lasagna', 'lasagne', 'pasta dish', 'instant noodle', 'dumpling', 'quiche', 'pie'],
    nameWords: ['pizza', 'lasagna', 'lasagne', 'curry', 'stew', 'casserole', 'dinner', 'entree', 'risotto', 'quiche'],
    foods: [
      { category: 'Veg', words: ['broccoli', 'carrot', 'spinach', 'bell pepper'] },
      { category: 'Legume', words: ['lentil', 'chickpea'] },
    ],
    recipes: { builders: ['salad', 'handheld'], mains: true },
  },
  {
    key: 'processedMeat',
    label: 'a processed meat',
    tagWords: ['sausage', 'ham', 'bacon', 'deli meat', 'prepared meat', 'salami', 'hot dog', 'hotdog', 'cold cut', 'meat product', 'nugget', 'brat', 'jerky', 'luncheon meat'],
    nameWords: ['sausage', 'sausages', 'ham', 'bacon', 'salami', 'hot dog', 'nuggets', 'jerky', 'pepperoni', 'bologna', 'frankfurter'],
    foods: [{ category: 'Meat', words: ['turkey breast', 'chicken', 'beef', 'salmon', 'cod'] }],
    recipes: { mains: true },
  },
  {
    key: 'cannedVeg',
    label: 'a tinned or jarred vegetable',
    tagWords: ['canned vegetable', 'canned legume', 'canned bean', 'canned tomato', 'baked bean', 'canned food', 'canned pulse'],
    nameWords: ['baked beans', 'canned', 'tinned'],
    foods: [
      { category: 'Legume', words: ['bean', 'lentil', 'chickpea'] },
      { category: 'Veg', words: ['tomato', 'sweet corn', 'green pea'] },
    ],
    recipes: { builders: ['side'] },
  },
  {
    key: 'pasta',
    label: 'a pasta or noodle',
    tagWords: ['pasta', 'noodle', 'spaghetti', 'macaroni'],
    nameWords: ['pasta', 'noodles', 'spaghetti', 'macaroni', 'penne', 'fusilli'],
    foods: [{ category: 'Grain', words: ['rice', 'quinoa', 'buckwheat', 'millet'] }],
    recipes: { titleWords: ['noodle', 'pasta', 'quinoa', 'rice'] },
  },
  {
    key: 'savourySnack',
    label: 'a savoury snack',
    tagWords: ['chip', 'crisp', 'salty snack', 'popcorn', 'cracker', 'pretzel', 'appetizer', 'savory snack', 'savoury snack', 'puff'],
    nameWords: ['chips', 'crisps', 'popcorn', 'crackers', 'pretzels', 'puffs'],
    foods: [
      { category: 'NutSeed', words: ['almond', 'pumpkin', 'sunflower', 'walnut'] },
      { category: 'Legume', words: ['chickpea'] },
    ],
    recipes: { builders: ['snack'] },
  },
  {
    key: 'sweet',
    label: 'a sweet or baked treat',
    tagWords: ['biscuit', 'cookie', 'cake', 'pastry', 'pastries', 'chocolate', 'candy', 'candies', 'confectionery', 'sweet snack', 'dessert', 'muffin', 'brownie', 'wafer', 'donut', 'doughnut'],
    nameWords: ['cookie', 'cookies', 'biscuit', 'biscuits', 'cake', 'chocolate', 'candy', 'muffin', 'brownie', 'wafer', 'donut', 'doughnut', 'pastry'],
    foods: [
      { category: 'Fruit', words: ['date', 'fig', 'apple', 'blueberr', 'raspberr', 'strawberr'] },
      { category: 'NutSeed', words: ['almond', 'walnut'] },
    ],
    recipes: { builders: ['dessert'], titleWords: ['cookie', 'cookies'] },
  },
  {
    key: 'bread',
    label: 'a bread',
    tagWords: ['bread', 'tortilla', 'bagel', 'bun', 'roll', 'flatbread', 'pita', 'baked good'],
    nameWords: ['bread', 'tortilla', 'tortillas', 'bagel', 'bagels', 'buns', 'rolls', 'flatbread', 'pita', 'loaf'],
    foods: [{ category: 'Grain', words: ['wheat', 'rye', 'spelt', 'buckwheat', 'oat'] }],
    recipes: { builders: ['bakedGoods'] },
  },
];

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** "en:breakfast-cereals" to "breakfast cereals". */
export function normaliseCategoryTag(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/^[a-z]{2}:/, '')
    .replace(/[-_,&/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Whether a phrase appears in the text as whole words, with a plural allowed. */
export function containsPhrase(text: string, phrase: string): boolean {
  const pattern = new RegExp(`(^|[^a-z])${escapeRegExp(phrase.toLowerCase())}(s|es)?($|[^a-z])`);
  return pattern.test(text.toLowerCase());
}

// Open Food Facts' broad parent tags, which name a whole aisle rather than
// a kind of product ("en:cereals-and-potatoes" sits above pasta, bread and
// breakfast cereal alike), so they are passed over.
export const BROAD_TAGS = new Set<string>([
  'cereals and potatoes',
  'cereals and their products',
  'plant based foods and beverages',
  'plant based foods',
  'fruits and vegetables based foods',
  'beverages',
  'snacks',
  'dairies',
  'groceries',
  'foods',
]);

export type SwapMatch = { kind: SwapKind; from: 'category' | 'name' };

/**
 * What kind of product this is, or null. Tags are read most specific first
 * (Open Food Facts lists them general to specific), then the name.
 */
export function swapKindFor(categoryTags: readonly string[], productName: string | null | undefined): SwapMatch | null {
  const tags = categoryTags
    .map(normaliseCategoryTag)
    .filter((tag) => tag && !BROAD_TAGS.has(tag))
    .reverse();
  for (const tag of tags) {
    const kind = SWAP_KINDS.find((candidate) => candidate.tagWords.some((phrase) => containsPhrase(tag, phrase)));
    if (kind) return { kind, from: 'category' };
  }
  const name = (productName ?? '').trim();
  if (name) {
    const kind = SWAP_KINDS.find((candidate) => candidate.nameWords.some((phrase) => containsPhrase(name, phrase)));
    if (kind) return { kind, from: 'name' };
  }
  return null;
}

export type SwapRecipeCandidate = { id: string; title: string; builder: string | undefined; curatedRecipeId: string | undefined };

/** How strongly a recipe answers the kind: 0 when it does not, higher first. */
export function recipeScoreFor(kind: SwapKind, recipe: SwapRecipeCandidate, isSideDish: (curatedRecipeId: string | undefined) => boolean): number {
  const { builders, titleWords, mains } = kind.recipes;
  const byBuilder = builders?.includes(recipe.builder ?? '') ?? false;
  const byTitle = titleWords?.some((word) => containsPhrase(recipe.title, word)) ?? false;
  const byMain = mains === true && recipe.builder === 'side' && !isSideDish(recipe.curatedRecipeId);
  if (byTitle && (byBuilder || byMain)) return 3;
  if (byTitle) return 2;
  if (byBuilder || byMain) return 1;
  return 0;
}

/**
 * The recipes to offer: those answering the kind and passing `clears`,
 * strongest match first, then by title, at most `limit`.
 */
export function pickSwapRecipes<T extends SwapRecipeCandidate>(
  kind: SwapKind,
  recipes: readonly T[],
  clears: (recipe: T) => boolean,
  isSideDish: (curatedRecipeId: string | undefined) => boolean,
  limit = 4,
): T[] {
  return recipes
    .map((recipe) => ({ recipe, score: recipeScoreFor(kind, recipe, isSideDish) }))
    .filter((entry) => entry.score > 0 && clears(entry.recipe))
    .sort((a, b) => b.score - a.score || a.recipe.title.localeCompare(b.recipe.title))
    .slice(0, limit)
    .map((entry) => entry.recipe);
}

// A name holding one of these is itself made or processed, and is passed
// over: "Turkey Bacon" is not what a swap for a packet of bacon offers,
// and "Rye Bread" is not a whole food in place of a loaf.
const MADE_WORDS = ['bacon', 'sausage', 'salami', 'ham', 'jerky', 'smoked', 'cured', 'bread', 'canned', 'sweetened', 'syrup', 'juice', 'nugget', 'stick', 'candied', 'cream style'];

/** Whether the word starts a word of the name ("oat" in "Oats", not "pea" in "Pepeao"). */
export function nameHoldsWord(name: string, word: string): boolean {
  return new RegExp(`(^|[^a-z])${escapeRegExp(word.toLowerCase())}`).test(name.toLowerCase());
}

/**
 * One food per word of a group, the shortest name that holds the word, so
 * a cereal brings up "Oats" and "Buckwheat" rather than five oat flours.
 * Foods arrive already cleared; the words are taken in order, and a name
 * that is itself a made food (MADE_WORDS) is passed over.
 */
export function pickSwapFoods<T extends { baseName: string; category: string }>(kind: SwapKind, foods: readonly T[], limit = 6): T[] {
  const out: T[] = [];
  const seen = new Set<string>();
  for (const group of kind.foods) {
    for (const word of group.words) {
      const holding = foods
        .filter(
          (food) =>
            food.category === group.category &&
            nameHoldsWord(food.baseName, word) &&
            !MADE_WORDS.some((made) => containsPhrase(food.baseName, made)) &&
            !seen.has(food.baseName.toLowerCase()),
        )
        .sort((a, b) => a.baseName.length - b.baseName.length || a.baseName.localeCompare(b.baseName));
      if (holding.length === 0) continue;
      seen.add(holding[0].baseName.toLowerCase());
      out.push(holding[0]);
      if (out.length >= limit) return out;
    }
  }
  return out;
}

export const SWAP_BAND_TITLE = 'Made at Home Instead';

/** The lead line, naming what kind the product was read as. */
export function swapLeadLine(match: SwapMatch): string {
  const how = match.from === 'category' ? 'listed as' : 'read from its name as';
  return `This product is ${how} ${match.kind.label}. Recipes and whole foods of the same kind:`;
}

export const SWAP_NO_KIND_LINE =
  'What kind of product this is was not recognised from its listing or its name, so nothing is offered in its place.';

/** Said when the kind is known and nothing cleared the lists. */
export function swapNothingClearsLine(match: SwapMatch): string {
  return `Nothing of the same kind as ${match.kind.label} cleared your lists here.`;
}

/**
 * The caption under the band: what each offer was checked against, and that
 * a list can miss a word.
 */
export function swapCaption(input: { conditions: number; eatingStyle: boolean; allergies: boolean; restrictions: boolean }): string {
  const checked: string[] = [];
  if (input.conditions > 0) checked.push(input.conditions === 1 ? 'your condition' : 'your conditions');
  if (input.eatingStyle) checked.push('your eating style');
  if (input.allergies) checked.push('your allergies');
  if (input.restrictions) checked.push('your food restrictions');
  if (checked.length === 0) {
    return 'Nothing is set in Profile to check these against, so they are only the same kind of food.';
  }
  const joined = checked.length === 1 ? checked[0] : `${checked.slice(0, -1).join(', ')} and ${checked[checked.length - 1]}`;
  return `Each one was checked against ${joined}, and nothing on them was found. A list can miss an ingredient, so read the recipe or the food before relying on it.`;
}
