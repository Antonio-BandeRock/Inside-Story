// More restrictions to choose (G19, 2026-09-27).
//
// Six ways of eating a person can hold themselves to in Profile, beside
// allergies and diet preferences: low histamine, low salicylate, no
// sulfites, alpha-gal, no nightshades and low lectin. Each is tied to
// something the app can check:
//   Lectins: the reference database scores every food on "Lectins
//     (Legumes)" (sub_criteria id 6, D2), so a food looked up is judged by
//     its tier first and by its name only when it carries no score.
//   The other five have no property in the reference database, so they
//     are matched by the words in a food's name or on a label, the same way
//     the G18 label check (lib/ingredientFlags.ts) matches everything else.
//
// Evidence, stated plainly in each restriction's caption, since the six
// rest on very different ground:
//   Alpha-gal: an IgE allergy to galactose-alpha-1,3-galactose in the meat
//     of mammals, set off by tick bites. Commins SP et al. Delayed
//     anaphylaxis, angioedema, or urticaria after consumption of red meat
//     in patients with IgE antibodies specific for galactose-alpha-1,3-
//     galactose. J Allergy Clin Immunol 2009;123:426-433. Some people also
//     react to dairy, gelatin and carrageenan (Platts-Mills TAE et al.
//     J Allergy Clin Immunol Pract 2020;8:15-23).
//   Sulfites: labelled by law at 10 ppm or more (21 CFR 101.100(a)(4)) and
//     E220 to E228 in the EU. Reactions are documented, mostly in people
//     with asthma (Vally H, Misso NL. Adverse reactions to the sulphite
//     additives. Gastroenterol Hepatol Bed Bench 2012;5:16-23).
//   Histamine: Maintz L, Novak N. Am J Clin Nutr 2007;85:1185-96 and
//     Comas-Baste O et al. Biomolecules 2020;10:1181. Food lists disagree
//     with one another (Sanchez-Perez S et al. Nutrients 2021;13:1395).
//   Salicylates: amounts measured in Swain AR et al. Salicylates in foods.
//     J Am Diet Assoc 1985;85:950-960. Food salicylate intolerance is
//     poorly studied, and later measurements of the same foods vary widely
//     by variety and by lab.
//   Nightshades: left out on the Autoimmune Protocol (Konijeti GG et al.
//     Inflamm Bowel Dis 2017;23:2054-2060). No trial has tested them alone;
//     the psoriasis evidence is a survey of what people report (Afifi L et
//     al. Dermatol Ther 2017;7:227-242).
//   Lectins: raw or undercooked kidney beans cause poisoning through
//     phytohaemagglutinin (FDA Bad Bug Book, 2nd ed. 2012), and soaking and
//     boiling take most lectin activity away. That cooked lectins harm
//     people with an autoimmune condition has not been shown in trials.
//
// A restriction only ever marks and explains. Nothing is hidden, and the
// words say "on your list", never that a food is unsafe.
//
// Pure, with no React and no database, so scripts/test_food_restrictions.js
// checks it without a phone.

export type FoodRestrictionKey = 'histamine' | 'salicylate' | 'sulfite' | 'alpha_gal' | 'nightshade' | 'lectin';

/** An allergy stops; an intolerance or an elimination diet cautions. */
export type FoodRestrictionWeight = 'allergy' | 'intolerance' | 'elimination';

export type FoodRestriction = {
  key: FoodRestrictionKey;
  /** The Profile pill. */
  label: string;
  /** One line under the pill, including how strong the evidence is. */
  caption: string;
  weight: FoodRestrictionWeight;
  /** How firm the ground under this list is, in a few words. */
  evidence: string;
  /** Words that put a food or an ingredient on this list. */
  terms: string[];
  /** Words that only sometimes do, said as a weaker reason. */
  maybeTerms?: string[];
  /** Why a matched word is on the list. */
  why: string;
  maybeWhy?: string;
  /** Reference food categories that are on the list whatever the name says. */
  categories?: string[];
  readingId?: string;
};

export const FOOD_RESTRICTIONS: FoodRestriction[] = [
  {
    key: 'alpha_gal',
    label: 'Alpha-gal',
    caption: 'The meat of mammals, and for some people dairy and gelatin. A documented allergy, usually after a tick bite.',
    weight: 'allergy',
    evidence: 'A documented IgE allergy (Commins et al. 2009)',
    terms: [
      'beef', 'pork', 'lamb', 'mutton', 'veal', 'venison', 'goat', 'bison', 'buffalo', 'elk', 'moose', 'rabbit', 'horse',
      'boar', 'bacon', 'ham', 'hamburger', 'salami', 'pepperoni', 'prosciutto', 'chorizo', 'pancetta', 'bologna',
      'hot dog', 'frankfurter', 'lard', 'tallow', 'suet', 'beef broth', 'beef stock', 'bone broth', 'oxtail', 'brisket',
      'gelatin', 'gelatine', 'pork rind', 'pork rinds', 'red meat',
    ],
    maybeTerms: ['milk', 'cream', 'cheese', 'butter', 'yogurt', 'yoghurt', 'whey', 'casein', 'carrageenan', 'collagen', 'rennet'],
    why: 'Alpha-gal is in the meat and fat of mammals, and in gelatin made from them (Commins et al. 2009). You set Alpha-gal in Profile.',
    maybeWhy: 'Some people with alpha-gal also react to dairy, carrageenan or other parts taken from mammals (Platts-Mills et al. 2020). Many do not.',
  },
  {
    key: 'sulfite',
    label: 'No sulfites',
    caption: 'Sulfite preservatives, named on a label by law. Reactions are documented, most often in people with asthma.',
    weight: 'intolerance',
    evidence: 'Documented reactions, labelled by law',
    terms: [
      'sulfite', 'sulfites', 'sulphite', 'sulphites', 'sulfur dioxide', 'sulphur dioxide', 'sodium bisulfite',
      'sodium bisulphite', 'sodium metabisulfite', 'sodium metabisulphite', 'potassium metabisulfite',
      'potassium metabisulphite', 'potassium bisulfite', 'sodium sulfite', 'sodium sulphite', 'calcium sulfite',
      'e220', 'e221', 'e222', 'e223', 'e224', 'e225', 'e226', 'e227', 'e228',
    ],
    maybeTerms: [
      'wine', 'red wine', 'white wine', 'champagne', 'cider', 'dried apricot', 'dried apricots', 'dried fruit', 'raisins',
      'sultanas', 'golden raisins', 'molasses', 'bottled lemon juice', 'bottled lime juice', 'dehydrated potato',
      'instant potato', 'maraschino',
    ],
    why: 'A sulfite preservative. A US label has to name sulfites at 10 ppm or more (21 CFR 101.100). You set No sulfites in Profile.',
    maybeWhy: 'Often made with sulfites, which a label names when they are there. A food with no label, like a glass of wine or dried fruit from a bin, may carry them unsaid.',
    readingId: 'additive-sulfites',
  },
  {
    key: 'histamine',
    label: 'Low histamine',
    caption: 'Aged, fermented, cured and smoked foods, some fish and a few vegetables. Lists disagree, so it is a place to start.',
    weight: 'intolerance',
    evidence: 'Recognised, with food lists that disagree',
    terms: [
      'aged cheese', 'parmesan', 'cheddar', 'gouda', 'blue cheese', 'camembert', 'brie', 'salami', 'pepperoni', 'prosciutto',
      'chorizo', 'cured', 'smoked', 'sauerkraut', 'kimchi', 'soy sauce', 'tamari', 'miso', 'tempeh', 'fish sauce',
      'anchovy', 'anchovies', 'vinegar', 'wine', 'red wine', 'beer', 'kombucha', 'kefir', 'spinach', 'eggplant',
      'aubergine', 'tuna', 'mackerel', 'sardine', 'sardines', 'herring', 'yeast extract', 'fermented', 'pickled',
    ],
    maybeTerms: [
      'strawberry', 'strawberries', 'pineapple', 'papaya', 'citrus', 'lemon', 'lime', 'orange', 'grapefruit', 'tomato',
      'tomatoes', 'cocoa', 'chocolate', 'egg white', 'walnut', 'walnuts', 'cashew', 'cashews', 'peanut', 'peanuts',
    ],
    why: 'Fermented, aged, cured and some fish and vegetable foods carry more histamine than fresh ones (Maintz and Novak 2007). You set Low histamine in Profile.',
    maybeWhy: 'Named on low-histamine lists as a histamine liberator. A 2021 review (Sanchez-Perez, Nutrients) found little measured evidence behind that list.',
    categories: ['Alcohol'],
    readingId: 'problem-high-histamine',
  },
  {
    key: 'salicylate',
    label: 'Low salicylate',
    caption: 'Many spices, berries, dried fruit, tea and some nuts. Little studied, and amounts vary widely by variety.',
    weight: 'intolerance',
    evidence: 'Little studied; amounts vary by variety and lab',
    terms: [
      'curry', 'curry powder', 'paprika', 'cumin', 'turmeric', 'cinnamon', 'oregano', 'rosemary', 'thyme', 'dill',
      'mint', 'peppermint', 'spearmint', 'cloves', 'clove', 'aniseed', 'anise', 'allspice', 'cayenne', 'mustard',
      'garam masala', 'five spice', 'wintergreen', 'methyl salicylate', 'strawberry', 'strawberries', 'raspberry',
      'raspberries', 'blueberry', 'blueberries', 'blackberry', 'blackberries', 'cranberry', 'cranberries',
      'boysenberry', 'grape', 'grapes', 'raisin', 'raisins', 'sultana', 'sultanas', 'currant', 'currants', 'dates',
      'apricot', 'apricots', 'cherry', 'cherries', 'pineapple', 'orange', 'plum', 'plums', 'prune', 'prunes', 'guava',
      'almond', 'almonds', 'water chestnut', 'honey', 'tea', 'black tea', 'green tea', 'olive', 'olives',
      'tomato paste', 'tomato sauce', 'gherkin', 'worcestershire', 'licorice', 'liquorice',
    ],
    why: 'Measured among the higher salicylate foods (Swain et al. 1985). The amount in a food varies a lot by variety, ripeness and lab, so this is a guide. You set Low salicylate in Profile.',
  },
  {
    key: 'nightshade',
    label: 'No nightshades',
    caption: 'Tomatoes, white potatoes, eggplant, peppers and the spices made from them. Left out on AIP; not tested alone in a trial.',
    weight: 'elimination',
    evidence: 'An elimination diet choice; not tested alone',
    terms: [
      'tomato', 'tomatoes', 'tomato paste', 'tomato puree', 'tomato sauce', 'ketchup', 'salsa', 'potato', 'potatoes',
      'potato starch', 'potato flour', 'eggplant', 'aubergine', 'bell pepper', 'bell peppers', 'red pepper',
      'green pepper', 'yellow pepper', 'sweet pepper', 'peppers', 'paprika', 'chili', 'chilli', 'chile',
      'chilies', 'chillies', 'chili powder', 'chili flakes', 'red pepper flakes', 'cayenne', 'jalapeno', 'jalapeño',
      'chipotle', 'habanero', 'serrano', 'poblano', 'ancho', 'pimento', 'pimiento', 'tomatillo', 'tomatillos',
      'goji', 'goji berries', 'ashwagandha', 'hot sauce', 'sriracha', 'harissa',
    ],
    maybeTerms: ['pepper', 'spices', 'spice', 'seasoning', 'seasonings'],
    why: 'A nightshade, one of the plant family (Solanaceae) the Autoimmune Protocol leaves out. You set No nightshades in Profile.',
    maybeWhy: 'Spices a label does not name are often a mix that includes paprika or chili. Pepper on its own can mean black pepper, which is not a nightshade, or a sweet or hot pepper, which is.',
    readingId: 'problem-nightshades',
  },
  {
    key: 'lectin',
    label: 'Low lectin',
    caption: 'Beans, lentils, peas, soy and peanuts, scored in the food database. Cooking removes most lectin; raw kidney beans are the known harm.',
    weight: 'elimination',
    evidence: 'Harm shown for raw beans; weak for cooked',
    terms: [
      'bean', 'beans', 'kidney bean', 'kidney beans', 'black beans', 'pinto beans', 'navy beans', 'lima beans',
      'cannellini', 'mung', 'mung bean', 'fava', 'broad beans', 'lentil', 'lentils', 'chickpea', 'chickpeas',
      'chickpea flour', 'garbanzo', 'hummus', 'split peas', 'peas', 'pea protein', 'soy', 'soya', 'soybean',
      'soybeans', 'soy flour', 'soy protein', 'edamame', 'tofu', 'tempeh', 'peanut', 'peanuts', 'peanut butter',
      'peanut flour', 'lupin', 'wheat germ',
    ],
    why: 'A legume, the foods highest in lectin. Soaking and boiling take most of it away; raw or undercooked kidney beans are the documented harm. You set Low lectin in Profile.',
  },
];

export const FOOD_RESTRICTION_KEYS: FoodRestrictionKey[] = FOOD_RESTRICTIONS.map((restriction) => restriction.key);

export function restrictionByKey(key: string): FoodRestriction | undefined {
  return FOOD_RESTRICTIONS.find((restriction) => restriction.key === key);
}

/** Only the keys this app knows, in list order, whatever was stored. */
export function knownRestrictions(keys: readonly string[]): FoodRestrictionKey[] {
  const held = new Set(keys);
  return FOOD_RESTRICTION_KEYS.filter((key) => held.has(key));
}

// ---------------------------------------------------------------------------
// Matching words

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * The words in `text` that match `term` on word boundaries, skipping the
 * readings that mean something else: "gluten-free", "sweet potato",
 * "black pepper", "kidney" the organ against "kidney beans", "peppermint".
 */
export function findRestrictionTerm(text: string, term: string): string | null {
  const pattern = new RegExp(`\\b${escapeRegExp(term)}\\b`, 'gi');
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const before = text.slice(0, match.index);
    const after = text.slice(match.index + match[0].length);
    if (/^[\s-]*free\b/i.test(after)) continue;
    if (/\b(no|without)\s+(added\s+)?$/i.test(before)) continue;
    const lower = term.toLowerCase();
    if ((lower === 'potato' || lower === 'potatoes') && /\bsweet\s*$/i.test(before)) continue;
    if ((lower === 'pepper' || lower === 'peppers') && /\b(black|white|pink|sichuan|szechuan)\s*$/i.test(before)) continue;
    if ((lower === 'pepper' || lower === 'peppers') && /^\s*corns?\b/i.test(after)) continue;
    if ((lower === 'bean' || lower === 'beans') && /\b(vanilla|coffee|cocoa|cacao|jelly)\s*$/i.test(before)) continue;
    if ((lower === 'orange' || lower === 'lime' || lower === 'lemon') && /^\s*(roughy|zest oil)\b/i.test(after)) continue;
    if (lower === 'tea' && /^\s*(spoon|spoons)\b/i.test(after)) continue;
    if (lower === 'mint' && /\bpepper$/i.test(before)) continue;
    if (lower === 'horse' && /^\s*radish\b/i.test(after)) continue;
    if (lower === 'buffalo' && /^\s*(wing|wings|sauce|style)\b/i.test(after)) continue;
    if (lower === 'cream' && /^\s+of\s+tartar\b/i.test(after)) continue;
    if (['milk', 'cream', 'butter', 'cheese', 'yogurt', 'yoghurt'].includes(lower) && /\b(coconut|almond|oat|soy|soya|rice|cashew|peanut|nut|seed|cocoa|shea|apple|sunflower|pea|hemp|vegan|plant)\s*$/i.test(before)) continue;
    return match[0];
  }
  return null;
}

export function findAnyRestrictionTerm(text: string, terms: readonly string[]): string | null {
  const longestFirst = [...terms].sort((a, b) => b.length - a.length);
  for (const term of longestFirst) {
    const hit = findRestrictionTerm(text, term);
    if (hit) return hit;
  }
  return null;
}

// ---------------------------------------------------------------------------
// What a restriction says about one text

export type RestrictionHit = {
  key: FoodRestrictionKey;
  label: string;
  /** 'list': the word is on the list. 'maybe': it sometimes is. 'score': the database scores it. */
  strength: 'list' | 'maybe' | 'score';
  matched: string;
  why: string;
  weight: FoodRestrictionWeight;
  readingId?: string;
};

/** The restrictions `text` falls on, strongest match per restriction, in list order. */
export function restrictionHitsInText(text: string, restrictions: readonly FoodRestrictionKey[]): RestrictionHit[] {
  const hits: RestrictionHit[] = [];
  for (const restriction of FOOD_RESTRICTIONS) {
    if (!restrictions.includes(restriction.key)) continue;
    const hit = findAnyRestrictionTerm(text, restriction.terms);
    if (hit) {
      hits.push({ key: restriction.key, label: restriction.label, strength: 'list', matched: hit, why: restriction.why, weight: restriction.weight, readingId: restriction.readingId });
      continue;
    }
    const maybe = restriction.maybeTerms ? findAnyRestrictionTerm(text, restriction.maybeTerms) : null;
    if (maybe) {
      hits.push({
        key: restriction.key,
        label: restriction.label,
        strength: 'maybe',
        matched: maybe,
        why: restriction.maybeWhy ?? restriction.why,
        weight: restriction.weight === 'allergy' ? 'intolerance' : restriction.weight,
        readingId: restriction.readingId,
      });
    }
  }
  return hits;
}

/** The lectin tiers the reference database gives, "Lectins (Legumes)". */
export const LECTIN_SUB_CRITERION = 'Lectins (Legumes)';

/**
 * The restrictions one reference food falls on. Lectins are read from the
 * database score when the food has one: High Risk and Mild Risk are on the
 * list, Neutral is not, whatever the name says. The rest go by name and
 * category.
 */
export function restrictionHitsForFood(
  food: { baseName: string; category: string | null; lectinTier?: string | null },
  restrictions: readonly FoodRestrictionKey[],
): RestrictionHit[] {
  const byName = restrictionHitsInText(food.baseName, restrictions.filter((key) => key !== 'lectin' || !food.lectinTier));
  const hits = [...byName];
  for (const restriction of FOOD_RESTRICTIONS) {
    if (!restrictions.includes(restriction.key) || hits.some((hit) => hit.key === restriction.key)) continue;
    if (restriction.categories && food.category && restriction.categories.includes(food.category)) {
      hits.push({ key: restriction.key, label: restriction.label, strength: 'list', matched: food.category, why: restriction.why, weight: restriction.weight, readingId: restriction.readingId });
    }
  }
  if (restrictions.includes('lectin') && food.lectinTier && food.lectinTier !== 'Neutral') {
    const lectin = restrictionByKey('lectin')!;
    hits.push({
      key: 'lectin',
      label: lectin.label,
      strength: 'score',
      matched: food.lectinTier,
      why:
        food.lectinTier === 'High Risk'
          ? 'The food database scores this food high for lectins. Soaking and boiling take most of it away. You set Low lectin in Profile.'
          : 'The food database scores this food as carrying some lectin. Soaking and boiling take most of it away. You set Low lectin in Profile.',
      weight: lectin.weight,
    });
  }
  const order = new Map(FOOD_RESTRICTION_KEYS.map((key, index) => [key, index]));
  return hits.sort((a, b) => (order.get(a.key) ?? 0) - (order.get(b.key) ?? 0));
}

/** One line per hit for the Why panel: "Low histamine: smoked". */
export function describeRestrictionHit(hit: RestrictionHit): string {
  if (hit.strength === 'score') return `${hit.label}: scored ${hit.matched.toLowerCase()} in the food database`;
  if (hit.strength === 'maybe') return `${hit.label}, sometimes: ${hit.matched}`;
  return `${hit.label}: ${hit.matched}`;
}

export const FOOD_RESTRICTIONS_HELP =
  'Pick any you hold yourself to. Food Lookup, a scanned label and Check a Label then mark a food or ingredient that is on the list and say why. Nothing is hidden. Matching goes by words, so a label is the last word, and each list says how strong the evidence behind it is.';
