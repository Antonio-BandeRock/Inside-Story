// Every ingredient on a label checked, each with a named reason (G18,
// 2026-09-27).
//
// The scan report already says which additives and condition concerns
// the whole label carries. This goes one ingredient at a time, the way a
// person reads a label, and gives every ingredient either its reasons or
// the plain statement that nothing on these lists matched it. Each reason
// names the list it came from and the word that matched, so nothing is
// flagged without saying why.
//
// The lists and where each comes from:
//   Major allergens: the nine US major food allergens, Food Allergen
//     Labeling and Consumer Protection Act of 2004 (FALCPA) plus sesame
//     under the FASTER Act of 2021, effective 1 January 2023; celery,
//     mustard, lupin and molluscs from the fourteen in EU Regulation
//     1169/2011, Annex II. Coconut is left out, since FDA guidance of
//     January 2025 removed it from the tree nut list.
//   Gluten grains: wheat in all its named forms, barley, rye, triticale
//     and malt, the grains 21 CFR 101.91 (the FDA gluten-free rule) names.
//     "Flour" with no grain named is wheat flour under 21 CFR 137.105.
//     Oats sit in the unclear class because they are grown and milled
//     beside wheat (Thompson T. Gluten contamination of commercial oat
//     products in the United States. N Engl J Med 2004;351:2021-2022).
//   Diet lists: the definitions this app's meal planner already uses
//     (lib/mealPlanDiet.ts), which follow the Vegan Society's definition
//     of veganism and the Paleo and AIP elimination lists in
//     Konijeti GG et al. Efficacy of the Autoimmune Protocol Diet for
//     Inflammatory Bowel Disease. Inflamm Bowel Dis 2017;23:2054-2060.
//   FODMAP groups: lib/fodmapLabel.ts, which carries the citations.
//   Histamine: fermented, aged and cured foods from Maintz L, Novak N.
//     Histamine and histamine intolerance. Am J Clin Nutr 2007;85:1185-96,
//     and Comas-Baste O et al. Histamine Intolerance: The Current State
//     of the Art. Biomolecules 2020;10:1181. The "liberator" list is
//     labelled as weakly supported, since Sanchez-Perez S et al.
//     Low-Histamine Diets: Is the Exclusion of Foods Justified by Their
//     Histamine Content? Nutrients 2021;13:1395 found little measured
//     evidence behind it.
//   Additives and condition concerns: lib/scannedProductFlags.ts, passed
//     in as functions so this file stays pure.
//   Unclear source: FDA 21 CFR 101.22 lets "natural flavor" and "spices"
//     stand for parts a label need not name, and several common
//     ingredients (mono- and diglycerides, glycerin, stearic acid,
//     enzymes, vitamin D3) can come from a plant or an animal.
//
// Allergen-aware, never allergy-safe: a word can be missed, a label can
// leave a source unnamed, and a recipe can change, which the caption says.
//
// Pure, with no React and no database, so scripts/test_ingredient_flags.js
// checks it without a phone.
import { findFodmapIngredients, FODMAP_LABEL_CONDITIONS } from './fodmapLabel';
import { restrictionHitsInText, type FoodRestrictionKey } from './foodRestrictions';
import type { RecipeDietTag } from './digest/types';

export type IngredientReasonKind =
  | 'allergy'
  | 'allergen'
  | 'gluten'
  | 'diet'
  | 'condition'
  | 'fodmap'
  | 'histamine'
  | 'restriction'
  | 'additive'
  | 'unclear';

/**
 * yours: it touches something the person set (an allergy, a diet, a
 * condition). look: an additive worth a second look for anybody. note:
 * worth knowing, and tied to nothing the person set.
 */
export type IngredientReasonTone = 'yours' | 'look' | 'note';

export type IngredientReason = {
  kind: IngredientReasonKind;
  label: string;
  /** The words on the label that matched, as written. */
  matched: string;
  why: string;
  tone: IngredientReasonTone;
  readingId?: string;
};

export type CheckedIngredient = {
  /** The ingredient as it reads, without its parenthesised parts. */
  name: string;
  /** What the label lists inside its parentheses, if anything. */
  parts: string[];
  reasons: IngredientReason[];
};

export type IngredientCheckSettings = {
  conditions: string[];
  dietTags: RecipeDietTag[];
  allergies: string[];
  /** G19: Profile > Food Restrictions (lib/foodRestrictions.ts). */
  restrictions?: FoodRestrictionKey[];
  /** lib/scannedProductFlags.ts flagAdditivesInIngredients, or a stand-in. */
  additiveFlagsFor?: (text: string) => { severity: 'red' | 'yellow' | 'info'; label: string; matchedText: string; detail: string; digestEntryId?: string }[];
  /** lib/scannedProductFlags.ts flagConditionConcernsForConditions, already bound to the person's conditions. */
  conditionFlagsFor?: (text: string) => { conditionCode: string; label: string; matchedText: string; detail: string; digestEntryId?: string }[];
  conditionName?: (code: string) => string;
};

// ---------------------------------------------------------------------------
// Splitting a label into ingredients

const LABEL_LEAD = /^\s*(ingredients?|ingr[eé]dients?|zutaten|ingredientes)\s*[:.]\s*/i;
const LESS_THAN_LEAD =
  /^\s*(and\s+)?(contains\s+)?(less\s+than\s+)?\d+(\.\d+)?\s*%\s*(or\s+less\s+)?(of\s*)?(each\s+of\s+)?(the\s+following\s*)?:?\s*/i;
const STATEMENT_LEAD = /^\s*(contains|may\s+contain|made\s+in\s+a\s+facility|manufactured\s+(in|on)|processed\s+in|produced\s+in)\b/i;

/** Splits on commas, semicolons and sentence ends outside any brackets. */
function splitTopLevel(text: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let current = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    if ((ch === ')' || ch === ']' || ch === '}') && depth > 0) depth--;
    const sentenceEnd = ch === '.' && depth === 0 && (i === text.length - 1 || /\s/.test(text[i + 1]));
    if (depth === 0 && (ch === ',' || ch === ';' || sentenceEnd)) {
      out.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  out.push(current);
  return out.map((piece) => piece.trim()).filter((piece) => piece.length > 0);
}

function stripBrackets(text: string): { name: string; inner: string } {
  let depth = 0;
  let name = '';
  let inner = '';
  for (const ch of text) {
    if (ch === '(' || ch === '[' || ch === '{') {
      if (depth > 0) inner += ch;
      depth++;
      continue;
    }
    if ((ch === ')' || ch === ']' || ch === '}') && depth > 0) {
      depth--;
      if (depth > 0) inner += ch;
      else inner += ', ';
      continue;
    }
    if (depth > 0) inner += ch;
    else name += ch;
  }
  return { name: name.replace(/\s+/g, ' ').trim(), inner };
}

export type SplitIngredient = { name: string; parts: string[]; text: string };

/**
 * The label split into one entry per ingredient. A "Contains" or "May
 * contain" sentence stays whole, since it names allergens as a group.
 */
export function splitIngredientList(labelText: string): SplitIngredient[] {
  const text = labelText.replace(/\s+/g, ' ').replace(LABEL_LEAD, '').trim();
  if (!text) return [];
  const out: SplitIngredient[] = [];
  let inStatement = false;
  for (const raw of splitTopLevel(text)) {
    if (STATEMENT_LEAD.test(raw) && !LESS_THAN_LEAD.test(raw)) inStatement = true;
    if (inStatement) {
      const previous = out[out.length - 1];
      if (previous && previous.parts.length === 0 && STATEMENT_LEAD.test(previous.name) && !STATEMENT_LEAD.test(raw)) {
        previous.name = `${previous.name}, ${raw}`;
        previous.text = previous.name;
      } else {
        out.push({ name: raw.replace(/[*†]+/g, '').trim(), parts: [], text: raw });
      }
      continue;
    }
    const cleaned = raw.replace(LESS_THAN_LEAD, '').replace(/[*†]+/g, '').trim();
    if (!cleaned) continue;
    const { name, inner } = stripBrackets(cleaned);
    const parts = splitTopLevel(inner).map((part) => part.replace(LESS_THAN_LEAD, '').trim()).filter(Boolean);
    out.push({ name: name || parts.join(', '), parts, text: cleaned });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Matching

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// A plant milk, butter or cream is not dairy, and "cream of tartar" is a
// salt of tartaric acid.
const NOT_DAIRY_BEFORE =
  /\b(coconut|almond|oat|rice|soy|soya|cashew|hemp|pea|macadamia|hazelnut|peanut|cocoa|cacao|shea|apple|nut|seed|sunflower|pumpkin|mango|pistachio|walnut)\s*$/i;
const NOT_WHEAT_FLOUR_BEFORE =
  /\b(rice|almond|coconut|corn|maize|oat|chickpea|gram|tapioca|cassava|potato|buckwheat|sorghum|teff|quinoa|millet|banana|soy|soya|pea|lentil|bean|arrowroot|tigernut|hemp|flax|flaxseed|sunflower|chestnut|amaranth|plantain|cricket|carob|lupin|cauliflower|acorn|fava|besan)\s*$/i;

const DAIRY_WORDS = new Set(['milk', 'butter', 'cream', 'buttermilk', 'milk powder', 'milk solids']);

/** The first whole-word match of any term, skipping "-free" claims and plant look-alikes. */
function findTerm(text: string, term: string): string | null {
  const pattern = new RegExp(`\\b${escapeRegExp(term)}\\b`, 'gi');
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const before = text.slice(0, match.index);
    const after = text.slice(match.index + match[0].length);
    if (/^[\s-]*free\b/i.test(after)) continue;
    if (/^\s+and\s+\w+[\s-]*free\b/i.test(after)) continue;
    if (/\b[a-z]+[ -]free\s*$/i.test(before)) continue;
    if (/^\s*-?\s*free\b/i.test(after)) continue;
    const lower = term.toLowerCase();
    if (DAIRY_WORDS.has(lower) && NOT_DAIRY_BEFORE.test(before)) continue;
    if (lower === 'cream' && /^\s+of\s+tartar\b/i.test(after)) continue;
    if (lower === 'flour' && NOT_WHEAT_FLOUR_BEFORE.test(before)) continue;
    if (lower === 'potato' && /\bsweet\s*$/i.test(before)) continue;
    if (lower === 'rennet' && /\b(microbial|vegetable|vegetarian|plant)\s*$/i.test(before)) continue;
    if (lower === 'pepper' && /\b(black|white|green|pink)\s*$/i.test(before)) continue;
    return match[0];
  }
  return null;
}

/** The longest term on the list that the text holds, or null. */
function findAny(text: string, terms: readonly string[]): string | null {
  const longestFirst = [...terms].sort((a, b) => b.length - a.length);
  for (const term of longestFirst) {
    const hit = findTerm(text, term);
    if (hit) return hit;
  }
  return null;
}

// ---------------------------------------------------------------------------
// The lists

type AllergenGroup = {
  key: string;
  label: string;
  /** Words a person might type into Profile > Food Allergies for this group. */
  aliases: string[];
  terms: string[];
  scope: 'us' | 'eu';
};

const MILK_TERMS = [
  'milk', 'whey', 'casein', 'caseinate', 'caseinates', 'sodium caseinate', 'calcium caseinate', 'lactose', 'butter',
  'buttermilk', 'butterfat', 'butter oil', 'cream', 'sour cream', 'cheese', 'yogurt', 'yoghurt', 'ghee', 'milk solids',
  'milk powder', 'lactalbumin', 'lactoglobulin', 'curds', 'curd', 'kefir', 'dairy', 'ice cream', 'paneer', 'ricotta',
  'mozzarella', 'parmesan', 'cheddar', 'quark',
];
const EGG_TERMS = ['egg', 'eggs', 'egg white', 'egg whites', 'egg yolk', 'egg yolks', 'albumen', 'ovalbumin', 'lysozyme', 'mayonnaise', 'meringue', 'dried egg'];
const FISH_TERMS = [
  'fish', 'anchovy', 'anchovies', 'cod', 'salmon', 'tuna', 'tilapia', 'pollock', 'haddock', 'sardine', 'sardines',
  'mackerel', 'trout', 'halibut', 'herring', 'catfish', 'bonito', 'fish sauce', 'fish oil', 'fish gelatin',
];
const CRUSTACEAN_TERMS = ['shrimp', 'prawn', 'prawns', 'crab', 'lobster', 'crayfish', 'crawfish', 'krill', 'langoustine', 'shellfish'];
const TREE_NUT_TERMS = [
  'almond', 'almonds', 'walnut', 'walnuts', 'cashew', 'cashews', 'pecan', 'pecans', 'pistachio', 'pistachios',
  'hazelnut', 'hazelnuts', 'macadamia', 'brazil nut', 'brazil nuts', 'pine nut', 'pine nuts', 'filbert', 'filberts',
  'tree nuts', 'praline', 'marzipan', 'gianduja',
];
const PEANUT_TERMS = ['peanut', 'peanuts', 'groundnut', 'groundnuts', 'peanut butter', 'peanut oil', 'arachis oil'];
const WHEAT_TERMS = [
  'wheat', 'wheat flour', 'whole wheat', 'wheat starch', 'wheat gluten', 'vital wheat gluten', 'durum', 'semolina',
  'spelt', 'kamut', 'khorasan', 'farro', 'einkorn', 'emmer', 'bulgur', 'couscous', 'seitan', 'graham', 'triticale',
  'flour', 'breadcrumbs', 'bread crumbs', 'panko',
];
const SOY_TERMS = [
  'soy', 'soya', 'soybean', 'soybeans', 'soy lecithin', 'soy protein', 'soy flour', 'soy sauce', 'tofu', 'tempeh',
  'edamame', 'miso', 'tamari', 'textured vegetable protein', 'natto',
];
const SESAME_TERMS = ['sesame', 'sesame seed', 'sesame seeds', 'sesame oil', 'tahini', 'benne'];

const ALLERGEN_GROUPS: AllergenGroup[] = [
  { key: 'milk', label: 'Milk', aliases: ['milk', 'dairy', 'cow milk', "cow's milk", 'casein', 'whey'], terms: MILK_TERMS, scope: 'us' },
  { key: 'egg', label: 'Egg', aliases: ['egg', 'eggs'], terms: EGG_TERMS, scope: 'us' },
  { key: 'fish', label: 'Fish', aliases: ['fish'], terms: FISH_TERMS, scope: 'us' },
  { key: 'crustacean', label: 'Crustacean shellfish', aliases: ['shellfish', 'crustacean', 'crustaceans', 'shrimp', 'crab', 'lobster', 'prawn'], terms: CRUSTACEAN_TERMS, scope: 'us' },
  { key: 'treeNuts', label: 'Tree nuts', aliases: ['tree nut', 'tree nuts', 'nut', 'nuts', ...TREE_NUT_TERMS], terms: TREE_NUT_TERMS, scope: 'us' },
  { key: 'peanut', label: 'Peanuts', aliases: ['peanut', 'peanuts', 'groundnut'], terms: PEANUT_TERMS, scope: 'us' },
  { key: 'wheat', label: 'Wheat', aliases: ['wheat', 'gluten'], terms: WHEAT_TERMS, scope: 'us' },
  { key: 'soy', label: 'Soy', aliases: ['soy', 'soya', 'soybean', 'soybeans'], terms: SOY_TERMS, scope: 'us' },
  { key: 'sesame', label: 'Sesame', aliases: ['sesame'], terms: SESAME_TERMS, scope: 'us' },
  { key: 'celery', label: 'Celery', aliases: ['celery', 'celeriac'], terms: ['celery', 'celeriac', 'celery seed', 'celery salt'], scope: 'eu' },
  { key: 'mustard', label: 'Mustard', aliases: ['mustard'], terms: ['mustard', 'mustard seed', 'mustard flour'], scope: 'eu' },
  { key: 'lupin', label: 'Lupin', aliases: ['lupin', 'lupine'], terms: ['lupin', 'lupine', 'lupin flour'], scope: 'eu' },
  {
    key: 'molluscs',
    label: 'Molluscs',
    aliases: ['mollusc', 'molluscs', 'mollusk', 'mollusks', 'clam', 'mussel', 'oyster', 'scallop', 'squid'],
    terms: ['clam', 'clams', 'mussel', 'mussels', 'oyster', 'oysters', 'oyster sauce', 'scallop', 'scallops', 'squid', 'calamari', 'octopus', 'snail', 'snails', 'escargot', 'abalone'],
    scope: 'eu',
  },
];

const GLUTEN_TERMS = [...WHEAT_TERMS.filter((term) => term !== 'graham'), 'barley', 'barley malt', 'rye', 'malt', 'malt extract', 'malt vinegar', 'malted barley', "brewer's yeast", 'graham'];

type DietList = { tag: RecipeDietTag; label: string; terms: string[]; readingId: string };

const MEAT_TERMS = [
  'beef', 'pork', 'chicken', 'turkey', 'lamb', 'mutton', 'veal', 'duck', 'goose', 'venison', 'goat', 'bacon', 'ham',
  'salami', 'pepperoni', 'prosciutto', 'chorizo', 'sausage', 'meat', 'gelatin', 'gelatine', 'collagen', 'lard',
  'tallow', 'suet', 'bone broth', 'chicken broth', 'beef broth', 'chicken stock', 'beef stock', 'chicken fat',
  'isinglass', 'rennet', 'carmine', 'cochineal',
];
const RED_MEAT_TERMS = ['beef', 'pork', 'lamb', 'mutton', 'veal', 'venison', 'goat', 'bacon', 'ham', 'salami', 'pepperoni', 'prosciutto', 'chorizo'];
const OTHER_ANIMAL_TERMS = ['honey', 'beeswax', 'shellac', 'lanolin', 'royal jelly', 'propolis', 'confectioner\'s glaze'];
const GRAIN_TERMS = [
  ...WHEAT_TERMS, 'barley', 'rye', 'malt', 'oat', 'oats', 'rice', 'brown rice', 'rice flour', 'corn', 'cornmeal',
  'corn flour', 'cornstarch', 'corn starch', 'maize', 'millet', 'sorghum', 'quinoa', 'buckwheat', 'amaranth', 'teff',
];
const LEGUME_TERMS = [
  ...SOY_TERMS, ...PEANUT_TERMS, 'bean', 'beans', 'black beans', 'kidney beans', 'pinto beans', 'navy beans',
  'lentil', 'lentils', 'chickpea', 'chickpeas', 'chickpea flour', 'pea protein', 'split peas', 'peas', 'garbanzo',
  'fava', 'lupin', 'hummus',
];
const REFINED_SUGAR_TERMS = [
  'sugar', 'cane sugar', 'brown sugar', 'powdered sugar', 'corn syrup', 'high fructose corn syrup', 'glucose syrup',
  'dextrose', 'invert sugar', 'rice syrup', 'glucose-fructose syrup',
];
const NIGHTSHADE_TERMS = [
  'tomato', 'tomatoes', 'tomato paste', 'tomato puree', 'potato', 'potatoes', 'potato starch', 'eggplant', 'aubergine',
  'bell pepper', 'bell peppers', 'red pepper', 'green pepper', 'pepper', 'peppers', 'paprika', 'chili', 'chilli',
  'chile', 'chili powder', 'cayenne', 'jalapeno', 'jalapeño', 'chipotle', 'pimento', 'pimiento', 'tomatillo', 'goji',
];
const SEED_TERMS = [
  ...SESAME_TERMS, 'sunflower', 'sunflower seed', 'sunflower seeds', 'sunflower oil', 'pumpkin seed', 'pumpkin seeds',
  'chia', 'chia seed', 'flax', 'flaxseed', 'linseed', 'hemp seed', 'hemp seeds', 'poppy seed', 'poppy seeds',
  'mustard', 'mustard seed', 'cumin', 'coriander seed', 'fennel seed', 'nutmeg', 'cocoa', 'cacao', 'chocolate', 'coffee',
];
const SEED_OIL_TERMS = ['canola oil', 'rapeseed oil', 'soybean oil', 'vegetable oil', 'corn oil', 'cottonseed oil', 'sunflower oil', 'safflower oil'];

const DIET_LISTS: DietList[] = [
  { tag: 'Vegan', label: 'From an animal, left out of Vegan', terms: [...MEAT_TERMS, ...FISH_TERMS, ...CRUSTACEAN_TERMS, ...MILK_TERMS, ...EGG_TERMS, ...OTHER_ANIMAL_TERMS], readingId: 'diet-vegan' },
  { tag: 'Vegetarian', label: 'Meat, fish or made from them, left out of Vegetarian', terms: [...MEAT_TERMS, ...FISH_TERMS, ...CRUSTACEAN_TERMS], readingId: 'diet-vegetarian' },
  { tag: 'Dairy-Free', label: 'Dairy, left out of Dairy-Free', terms: MILK_TERMS, readingId: 'diet-dairy-free' },
  { tag: 'Mediterranean', label: 'Red meat, left out of Mediterranean as this app plans it', terms: RED_MEAT_TERMS, readingId: 'diet-mediterranean' },
  { tag: 'Plant-Based/Flexitarian', label: 'Red meat, left out of Plant-Based / Flexitarian', terms: RED_MEAT_TERMS, readingId: 'diet-plant-based-flexitarian' },
  { tag: 'Paleo', label: 'Grain, legume, dairy or refined sugar, left out of Paleo', terms: [...GRAIN_TERMS, ...LEGUME_TERMS, ...MILK_TERMS, ...REFINED_SUGAR_TERMS, ...SEED_OIL_TERMS], readingId: 'diet-paleo' },
  {
    tag: 'AIP',
    label: 'Left out of AIP (grains, legumes, dairy, eggs, nuts, seeds or nightshades)',
    terms: [...GRAIN_TERMS, ...LEGUME_TERMS, ...MILK_TERMS, ...REFINED_SUGAR_TERMS, ...SEED_OIL_TERMS, ...EGG_TERMS, ...TREE_NUT_TERMS, ...SEED_TERMS, ...NIGHTSHADE_TERMS],
    readingId: 'diet-aip',
  },
];

const DIET_WHY: Partial<Record<RecipeDietTag, string>> = {
  Vegan: 'Your diet preference is Vegan, and this ingredient comes from an animal.',
  Vegetarian: 'Your diet preference is Vegetarian, and this ingredient is meat or fish, or is made from an animal in a way vegetarians usually leave out (gelatin, animal rennet, carmine).',
  'Dairy-Free': 'Your diet preference is Dairy-Free, and this ingredient is made from milk.',
  Mediterranean: 'Your diet preference is Mediterranean, which this app plans without red meat.',
  'Plant-Based/Flexitarian': 'Your diet preference is Plant-Based / Flexitarian, which this app plans without red meat.',
  Paleo: 'Your diet preference is Paleo, which leaves out grains, legumes, dairy, refined sugar and refined seed oils.',
  AIP: 'Your diet preference is AIP, which leaves out everything Paleo does plus eggs, nuts, seeds, seed spices and nightshades.',
};

const HIGH_HISTAMINE_TERMS = [
  'aged cheese', 'parmesan', 'cheddar', 'gouda', 'blue cheese', 'salami', 'pepperoni', 'prosciutto', 'chorizo',
  'cured', 'smoked', 'sauerkraut', 'kimchi', 'soy sauce', 'tamari', 'miso', 'tempeh', 'fish sauce', 'anchovy',
  'anchovies', 'vinegar', 'wine', 'red wine', 'beer', 'kombucha', 'spinach', 'eggplant', 'aubergine', 'tuna',
  'mackerel', 'sardine', 'sardines', 'yeast extract', 'fermented',
];
const LIBERATOR_TERMS = [
  'strawberry', 'strawberries', 'pineapple', 'papaya', 'citrus', 'lemon', 'lime', 'orange', 'grapefruit', 'tomato',
  'tomatoes', 'cocoa', 'chocolate', 'egg white', 'walnut', 'walnuts', 'cashew', 'cashews', 'peanut', 'peanuts',
];

type UnclearItem = { terms: string[]; label: string; why: string; affects: ('animal' | 'gluten' | 'allergy')[]; readingId?: string };

const UNCLEAR_ITEMS: UnclearItem[] = [
  {
    terms: ['natural flavor', 'natural flavors', 'natural flavour', 'natural flavours', 'natural flavoring', 'natural flavouring', 'flavoring', 'flavouring', 'flavor', 'flavors', 'flavour', 'flavours'],
    label: 'A flavour whose parts the label does not name',
    why: 'US rules (21 CFR 101.22) let a flavour stand for many parts without naming them, and a natural flavour can come from a plant or an animal. A major US allergen inside it still has to be named, but nothing else does.',
    affects: ['animal', 'allergy'],
    readingId: 'label-allergen-statements',
  },
  {
    terms: ['spices', 'spice', 'seasoning', 'seasonings', 'spice extract', 'spice extracts'],
    label: 'Spices the label does not name',
    why: 'A label can say "spices" without naming them. Celery and mustard, both major allergens in the EU, are not on the US list, so a US label need not name them.',
    affects: ['allergy'],
  },
  {
    terms: ['mono- and diglycerides', 'mono and diglycerides', 'monoglycerides', 'diglycerides', 'glycerin', 'glycerine', 'glycerol', 'stearic acid', 'magnesium stearate', 'calcium stearate', 'shortening', 'e471', 'e422', 'e570'],
    label: 'Could come from a plant or an animal',
    why: 'This can be made from plant oils or from animal fat, and the label does not say which.',
    affects: ['animal'],
  },
  {
    terms: ['enzymes', 'enzyme', 'rennet', 'lipase'],
    label: 'Enzymes from an unnamed source',
    why: 'Enzymes can come from an animal, a plant or a microbe, and the label does not say which. Traditional rennet comes from a calf stomach.',
    affects: ['animal'],
  },
  {
    terms: ['vitamin d3', 'cholecalciferol'],
    label: 'Vitamin D3, usually from sheep wool',
    why: 'Vitamin D3 is most often made from lanolin in sheep wool. A lichen source exists, and a label that uses it usually says so.',
    affects: ['animal'],
  },
  {
    terms: ['l-cysteine', 'cysteine', 'e920'],
    label: 'L-cysteine from an unnamed source',
    why: 'L-cysteine, used in bread dough, is made from feathers or hair or by fermentation, and the label does not say which.',
    affects: ['animal'],
  },
  {
    terms: ['oats', 'oat', 'oat flour', 'rolled oats', 'oat fiber', 'oat fibre', 'oatmeal'],
    label: 'Oats, often grown and milled beside wheat',
    why: 'Oats carry no gluten, but a 2004 test of US oat products (Thompson, N Engl J Med) found most had wheat, barley or rye in them. Only oats labelled gluten-free are tested for it.',
    affects: ['gluten'],
    readingId: 'celiac-oats-controversy',
  },
  {
    terms: ['modified food starch', 'modified starch', 'food starch', 'starch', 'dextrin'],
    label: 'Starch from an unnamed plant',
    why: 'Starch is usually from corn or potato. In the US a wheat starch has to say wheat; outside the US it may not.',
    affects: ['gluten'],
  },
  {
    terms: ['yeast extract', 'autolyzed yeast', 'autolyzed yeast extract', 'hydrolyzed vegetable protein', 'hydrolysed vegetable protein', 'hydrolyzed protein'],
    label: 'Could be made from barley or wheat',
    why: 'Yeast extract can be made from spent brewer\'s yeast grown on barley, and hydrolyzed vegetable protein from wheat or soy. The label does not always say which.',
    affects: ['gluten'],
  },
];

// ---------------------------------------------------------------------------
// The check

const GLUTEN_CONDITIONS = new Set(['celiac']);

function holdsGlutenSetting(settings: IngredientCheckSettings): boolean {
  return (
    settings.dietTags.includes('Gluten-Free') ||
    settings.conditions.some((code) => GLUTEN_CONDITIONS.has(code)) ||
    settings.allergies.some((name) => /\b(wheat|gluten)\b/i.test(name))
  );
}

function holdsAnimalSetting(settings: IngredientCheckSettings): boolean {
  return settings.dietTags.includes('Vegan') || settings.dietTags.includes('Vegetarian');
}

function singular(word: string): string {
  const lower = word.trim().toLowerCase();
  return lower.length > 3 && lower.endsWith('s') ? lower.slice(0, -1) : lower;
}

/** The declared allergy a group covers, if any. */
function allergyForGroup(group: AllergenGroup, allergies: string[]): string | null {
  const aliases = new Set(group.aliases.map(singular));
  return allergies.find((name) => aliases.has(singular(name))) ?? null;
}

const TONE_ORDER: Record<IngredientReasonTone, number> = { yours: 0, look: 1, note: 2 };

function checkOne(item: SplitIngredient, settings: IngredientCheckSettings): IngredientReason[] {
  const text = item.text;
  const reasons: IngredientReason[] = [];
  const seen = new Set<string>();
  const add = (key: string, reason: IngredientReason) => {
    if (seen.has(key)) return;
    seen.add(key);
    reasons.push(reason);
  };

  // Allergies the person declared, first by major allergen group, then by
  // the plain word they typed, which covers anything off the lists.
  const coveredAllergies = new Set<string>();
  for (const group of ALLERGEN_GROUPS) {
    const hit = findAny(text, group.terms);
    if (!hit) continue;
    const declared = allergyForGroup(group, settings.allergies);
    if (declared) {
      coveredAllergies.add(declared.toLowerCase());
      add(`allergy:${group.key}`, {
        kind: 'allergy',
        label: `${group.label}, in your allergies`,
        matched: hit,
        why: `You listed ${declared} in Profile > Food Allergies, and this ingredient is or contains ${group.label.toLowerCase()}. This check matches words and can miss an ingredient a label does not name, so the package itself is the last word.`,
        tone: 'yours',
        readingId: 'label-allergen-statements',
      });
    } else {
      add(`allergen:${group.key}`, {
        kind: 'allergen',
        label: group.scope === 'us' ? `${group.label}, a major allergen` : `${group.label}, a major allergen in the EU`,
        matched: hit,
        why:
          group.scope === 'us'
            ? `${group.label} is one of the nine major food allergens US labels have to name (FALCPA 2004, with sesame added by the FASTER Act from 2023).`
            : `${group.label} is one of the fourteen allergens EU labels have to name (Regulation 1169/2011), and is not on the US list.`,
        tone: 'note',
        readingId: 'label-allergen-statements',
      });
    }
  }
  for (const declared of settings.allergies) {
    const word = declared.trim();
    if (!word || coveredAllergies.has(word.toLowerCase())) continue;
    const hit = findTerm(text, word) ?? (word.length > 3 ? findTerm(text, `${word}s`) : null);
    if (!hit) continue;
    add(`allergy:own:${word.toLowerCase()}`, {
      kind: 'allergy',
      label: `${word}, in your allergies`,
      matched: hit,
      why: `You listed ${word} in Profile > Food Allergies, and the label names it here. This check matches words and can miss an ingredient a label does not name, so the package itself is the last word.`,
      tone: 'yours',
    });
  }

  const glutenHit = findAny(text, GLUTEN_TERMS);
  if (glutenHit) {
    const flourAlone = glutenHit.toLowerCase() === 'flour';
    add('gluten', {
      kind: 'gluten',
      label: 'A gluten grain',
      matched: glutenHit,
      why: flourAlone
        ? 'On a US label, flour with no grain named is wheat flour (21 CFR 137.105), and wheat carries gluten.'
        : 'Wheat, barley, rye, triticale and malt carry gluten, the protein celiac disease reacts to (21 CFR 101.91).',
      tone: holdsGlutenSetting(settings) ? 'yours' : 'note',
      readingId: settings.conditions.includes('celiac') ? 'celiac-cross-contamination' : 'problem-gluten-grains',
    });
  }

  // Vegan already covers Vegetarian's list, so a vegan is not told twice.
  const vegan = settings.dietTags.includes('Vegan');
  for (const diet of DIET_LISTS) {
    if (!settings.dietTags.includes(diet.tag)) continue;
    if (diet.tag === 'Vegetarian' && vegan) continue;
    const hit = findAny(text, diet.terms);
    if (!hit) continue;
    add(`diet:${diet.tag}`, {
      kind: 'diet',
      label: diet.label,
      matched: hit,
      why: DIET_WHY[diet.tag] ?? `Your diet preference is ${diet.tag}.`,
      tone: 'yours',
      readingId: diet.readingId,
    });
  }

  for (const flag of settings.conditionFlagsFor?.(text) ?? []) {
    const name = settings.conditionName?.(flag.conditionCode) ?? flag.conditionCode.replace(/_/g, ' ');
    add(`condition:${flag.conditionCode}:${flag.label}`, {
      kind: 'condition',
      label: `${flag.label}, noted for ${name}`,
      matched: flag.matchedText,
      why: flag.detail,
      tone: 'yours',
      readingId: flag.digestEntryId,
    });
  }

  const fodmapForYou = settings.conditions.find((code) => code in FODMAP_LABEL_CONDITIONS);
  for (const match of findFodmapIngredients(text)) {
    add(`fodmap:${match.group}`, {
      kind: 'fodmap',
      label: `FODMAP: ${match.groupLabel.toLowerCase()}`,
      matched: match.found.join(', '),
      why: 'A known source of this FODMAP group (Gibson and Shepherd 2010). The label gives no amount, and the amount in a serving is what decides whether it bothers someone.',
      tone: fodmapForYou ? 'yours' : 'note',
      readingId: fodmapForYou ? FODMAP_LABEL_CONDITIONS[fodmapForYou] : 'glossary-fodmap',
    });
  }

  // G19: the restrictions set in Profile. Histamine is held by the two
  // histamine reasons below, which turn to the person's own when it is set,
  // so it is not said twice.
  const restrictions = settings.restrictions ?? [];
  const holdsHistamine = restrictions.includes('histamine');
  for (const hit of restrictionHitsInText(text, restrictions.filter((key) => key !== 'histamine'))) {
    add(`restriction:${hit.key}`, {
      kind: 'restriction',
      label: hit.strength === 'maybe' ? `Sometimes on your ${hit.label} list` : `On your ${hit.label} list`,
      matched: hit.matched,
      why: hit.why,
      tone: 'yours',
      readingId: hit.readingId,
    });
  }

  const highHistamine = findAny(text, HIGH_HISTAMINE_TERMS);
  if (highHistamine) {
    add('histamine:high', {
      kind: 'histamine',
      label: 'Higher in histamine',
      matched: highHistamine,
      why: holdsHistamine
        ? 'Fermented, aged, cured and some fish and vegetable foods carry more histamine than fresh ones (Maintz and Novak 2007). You set Low histamine in Profile.'
        : 'Fermented, aged, cured and some fish and vegetable foods carry more histamine than fresh ones (Maintz and Novak 2007). This matters to people who react to histamine and to nobody else.',
      tone: holdsHistamine ? 'yours' : 'note',
      readingId: 'problem-high-histamine',
    });
  }
  const liberator = findAny(text, LIBERATOR_TERMS);
  if (liberator) {
    add('histamine:liberator', {
      kind: 'histamine',
      label: 'On low-histamine lists as a histamine liberator',
      matched: liberator,
      why: 'Low-histamine lists name this as a food that may release histamine in the body. A 2021 review (Sanchez-Perez, Nutrients) found little measured evidence behind that list, so this is a weak reason.',
      tone: holdsHistamine ? 'yours' : 'note',
      readingId: 'glossary-dao-histamine',
    });
  }

  for (const flag of settings.additiveFlagsFor?.(text) ?? []) {
    add(`additive:${flag.label}`, {
      kind: 'additive',
      label: flag.label,
      matched: flag.matchedText,
      why: flag.detail,
      tone: flag.severity === 'info' ? 'note' : 'look',
      readingId: flag.digestEntryId,
    });
  }

  for (const item of UNCLEAR_ITEMS) {
    const hit = findAny(text, item.terms);
    if (!hit) continue;
    // "Wheat starch" names its plant, and "gluten-free oats" were tested.
    if (item.affects.includes('gluten') && item.terms.includes('starch') && /\b(wheat|corn|maize|potato|tapioca|rice|pea|cassava|arrowroot)\b/i.test(text)) continue;
    const yours =
      (item.affects.includes('animal') && holdsAnimalSetting(settings)) ||
      (item.affects.includes('gluten') && holdsGlutenSetting(settings)) ||
      (item.affects.includes('allergy') && settings.allergies.length > 0);
    add(`unclear:${item.label}`, {
      kind: 'unclear',
      label: item.label,
      matched: hit,
      why: item.why,
      tone: yours ? 'yours' : 'note',
      readingId: item.readingId,
    });
  }

  return reasons.sort((a, b) => TONE_ORDER[a.tone] - TONE_ORDER[b.tone]);
}

/** Every ingredient on the label, each with its reasons, in label order. */
export function checkIngredients(labelText: string, settings: IngredientCheckSettings): CheckedIngredient[] {
  return splitIngredientList(labelText).map((item) => ({ name: item.name, parts: item.parts, reasons: checkOne(item, settings) }));
}

// ---------------------------------------------------------------------------
// Words

const COUNT_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

function count(n: number, one: string, many: string): string {
  return `${COUNT_WORDS[n] ?? String(n)} ${n === 1 ? one : many}`;
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** The line above the list: how many were checked and how many touch what the person set. */
export function describeIngredientCheck(rows: CheckedIngredient[]): string {
  if (rows.length === 0) return 'No ingredients to check yet.';
  const yours = rows.filter((row) => row.reasons.some((reason) => reason.tone === 'yours')).length;
  const look = rows.filter((row) => !row.reasons.some((reason) => reason.tone === 'yours') && row.reasons.some((reason) => reason.tone === 'look')).length;
  const clear = rows.filter((row) => row.reasons.length === 0).length;
  const lead = `${capitalise(count(rows.length, 'ingredient', 'ingredients'))} checked.`;
  const parts: string[] = [];
  if (yours > 0) parts.push(`${count(yours, 'touches', 'touch')} something you set in Profile`);
  if (look > 0) parts.push(`${count(look, 'is an additive', 'are additives')} worth a second look`);
  if (clear > 0) parts.push(`${count(clear, 'matched', 'matched')} none of the lists`);
  if (parts.length === 0) return `${lead} Every one carries a note worth knowing and nothing you set in Profile.`;
  const sentence = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
  return `${lead} ${capitalise(sentence)}.`;
}

/** Under an ingredient with no reasons. Never "safe", since a list can miss a word. */
export const NO_REASON_LINE = 'Nothing on the lists this app checks.';

/** One line per reason: "A gluten grain: wheat flour". */
export function describeReason(reason: IngredientReason): string {
  return `${reason.label}: ${reason.matched}`;
}

export const INGREDIENT_CHECK_CAPTION =
  'Allergen-aware, not allergy-safe. This matches the words on the label against named lists: major allergens, gluten grains, your diet preferences and food restrictions, FODMAP groups, histamine, additives and ingredients whose source a label need not name. A word can be missed, a label can leave a source unnamed, and a recipe can change, so the package is the last word for anything you react to.';

export const INGREDIENT_CHECK_SOURCES: string[] = [
  'Major allergens: FALCPA 2004 and the FASTER Act 2021 (US); Regulation (EU) 1169/2011, Annex II.',
  'Gluten grains: 21 CFR 101.91; flour with no grain named, 21 CFR 137.105; oats, Thompson, N Engl J Med 2004.',
  'FODMAP groups: Gibson and Shepherd, J Gastroenterol Hepatol 2010.',
  'Histamine: Maintz and Novak, Am J Clin Nutr 2007; Comas-Baste et al., Biomolecules 2020; Sanchez-Perez et al., Nutrients 2021.',
  'Alpha-gal: Commins et al., J Allergy Clin Immunol 2009; Platts-Mills et al., J Allergy Clin Immunol Pract 2020.',
  'Sulfites: 21 CFR 101.100(a)(4); Vally and Misso, Gastroenterol Hepatol Bed Bench 2012.',
  'Salicylates: Swain et al., J Am Diet Assoc 1985.',
  'Nightshades: Konijeti et al., Inflamm Bowel Dis 2017. Lectins: FDA Bad Bug Book, 2012.',
  'Flavours and spices: 21 CFR 101.22.',
];

/** What Read This to Me says: the count line, then each ingredient with a reason for the person. */
export function describeIngredientCheckSpoken(rows: CheckedIngredient[]): string {
  const yours = rows.filter((row) => row.reasons.some((reason) => reason.tone === 'yours'));
  const lines = yours.map((row) => {
    const labels = row.reasons.filter((reason) => reason.tone === 'yours').map((reason) => reason.label);
    return `${row.name}: ${labels.join('; ')}`;
  });
  return [describeIngredientCheck(rows), ...lines].join(' ');
}
