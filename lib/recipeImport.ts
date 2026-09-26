// Import a recipe from a web link (G1, 1.0.53.12). Everything here is pure,
// with no imports, so scripts/test_recipe_import.js checks it without a
// phone, and the cookbook photo reader planned as G2 can hand its lines to
// the same parser.
//
// Three parts:
// 1. extractRecipeFromHtml reads the schema.org Recipe block that almost
//    every recipe site publishes as JSON-LD for search engines. It is the
//    one thing a page states about itself in a fixed shape, so nothing here
//    scrapes page layout, which changes without notice.
// 2. parseIngredientLine turns one line ("1 1/2 cups rolled oats, toasted")
//    into an amount, a unit the builders use, the food words to search for,
//    and the rest kept as a note. A line is never dropped: a heading is
//    marked as one, and a line with no amount says so.
// 3. toBuilderAmount puts an amount into the units the builders offer for
//    the person's measurement system.
//
// Nothing here decides which food a line is. That is the matcher's job, in
// lib/recipeImportDb.ts, and a line it is unsure of is shown to the person
// to pick rather than guessed.

export type ImportedRecipe = {
  name: string;
  author: string | null;
  yieldText: string | null;
  servings: number | null;
  ingredientLines: string[];
  instructions: string[];
  prepMinutes: number | null;
  cookMinutes: number | null;
  totalMinutes: number | null;
  sourceUrl: string;
  sourceSite: string;
};

/** The units a parsed line ends up in; every builder offers all of them. */
export type ImportUnit = 'g' | 'oz' | 'lb' | 'ml' | 'tsp' | 'tbsp' | 'cup' | 'piece';

export type ParsedIngredientLine = {
  /** The line as the recipe wrote it, kept for the note and the review list. */
  original: string;
  /** "For the sauce:" and the like; kept in order, never matched to a food. */
  isHeader: boolean;
  /** Null when the recipe gives no amount ("salt, to taste"). */
  quantity: number | null;
  unit: ImportUnit;
  /** The food words as written, cleaned of the amount and the note. */
  foodText: string;
  /** The food words with size, prep and filler words taken out, for search. */
  searchText: string;
  /** Anything after the first comma or in brackets. */
  prepNote: string;
  /** One of the builders' cut and prep choices, or 'N/A'. */
  cutPrep: string;
  optional: boolean;
  toTaste: boolean;
  /** Set when the recipe gave a range: "The recipe gives 2 to 3; 2.5 is used." */
  rangeNote: string | null;
};

// --- Text clean-up -----------------------------------------------------------

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', frac12: '½', frac14: '¼', frac34: '¾',
  frac13: '⅓', frac23: '⅔', frac18: '⅛', deg: '°', eacute: 'é', egrave: 'è', ntilde: 'ñ', uuml: 'ü',
  ouml: 'ö', auml: 'ä', ccedil: 'ç', rsquo: "'", lsquo: "'", rdquo: '"', ldquo: '"', ndash: '-',
  mdash: '-', hellip: '...', times: 'x', reg: '', trade: '', copy: '',
};

export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z0-9]+);/gi, (whole, body: string) => {
    if (body[0] === '#') {
      const code = body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : whole;
    }
    const named = NAMED_ENTITIES[body.toLowerCase()];
    return named === undefined ? whole : named;
  });
}

/** Tags out, entities decoded, runs of space collapsed. Dashes become hyphens. */
export function cleanText(text: string): string {
  return decodeEntities(String(text).replace(/<[^>]*>/g, ' '))
    .replace(/[‒-―−]/g, '-')
    .replace(/[   ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function siteNameFromUrl(url: string): string {
  const match = /^[a-z][a-z0-9+.-]*:\/\/([^/?#:]+)/i.exec(url.trim());
  if (!match) return '';
  return match[1].toLowerCase().replace(/^www\./, '');
}

/** Only an http or https address is fetched. */
export function isFetchableUrl(url: string): boolean {
  return /^https?:\/\/[^\s/?#]+\.[^\s/?#]+/i.test(url.trim());
}

// --- The schema.org Recipe block ----------------------------------------------

type JsonNode = Record<string, unknown>;

function isObject(value: unknown): value is JsonNode {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function typesOf(node: JsonNode): string[] {
  const type = node['@type'];
  if (typeof type === 'string') return [type];
  if (Array.isArray(type)) return type.filter((item): item is string => typeof item === 'string');
  return [];
}

function isRecipeNode(node: JsonNode): boolean {
  return typesOf(node).some((type) => type.replace(/^.*[/:]/, '').toLowerCase() === 'recipe');
}

/** Walks arrays, @graph and mainEntity to find the first Recipe node. */
function findRecipeNode(value: unknown, depth = 0): JsonNode | null {
  if (depth > 8) return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findRecipeNode(item, depth + 1);
      if (found) return found;
    }
    return null;
  }
  if (!isObject(value)) return null;
  if (isRecipeNode(value)) return value;
  for (const key of ['@graph', 'mainEntity', 'mainEntityOfPage', 'itemListElement', 'item']) {
    const found = findRecipeNode(value[key], depth + 1);
    if (found) return found;
  }
  return null;
}

function parseJsonLoosely(text: string): unknown {
  const trimmed = text.trim().replace(/^<!--/, '').replace(/-->$/, '').replace(/^\/\*<!\[CDATA\[\*\//, '').replace(/\/\*\]\]>\*\/$/, '');
  try {
    return JSON.parse(trimmed);
  } catch {
    // Some sites leave raw line breaks inside strings or a trailing comma.
    try {
      return JSON.parse(trimmed.replace(/[\u0000-\u001f]+/g, ' ').replace(/,\s*([}\]])/g, '$1'));
    } catch {
      return null;
    }
  }
}

function textList(value: unknown): string[] {
  if (value === null || value === undefined) return [];
  if (typeof value === 'string' || typeof value === 'number') return [String(value)];
  if (Array.isArray(value)) return value.flatMap((item) => textList(item));
  if (isObject(value)) {
    if (typeof value.name === 'string') return [value.name];
    if (typeof value.text === 'string') return [value.text];
  }
  return [];
}

function instructionList(value: unknown, depth = 0): string[] {
  if (depth > 6 || value === null || value === undefined) return [];
  if (typeof value === 'string') {
    // One block of text: split on line breaks or on list items the site left in.
    const withBreaks = value.replace(/<\/(p|li|div)>|<br\s*\/?>/gi, '\n');
    return withBreaks.split(/\n+/).map(cleanText).filter(Boolean);
  }
  if (Array.isArray(value)) return value.flatMap((item) => instructionList(item, depth + 1));
  if (!isObject(value)) return [];
  const types = typesOf(value).map((type) => type.toLowerCase());
  if (types.includes('howtosection') || (value.itemListElement && !value.text)) {
    const steps = instructionList(value.itemListElement, depth + 1);
    const heading = typeof value.name === 'string' ? cleanText(value.name) : '';
    return heading ? [`${heading}:`, ...steps] : steps;
  }
  const text = typeof value.text === 'string' ? value.text : typeof value.name === 'string' ? value.name : '';
  return instructionList(text, depth + 1);
}

/** PT1H30M to 90. Null for anything that is not an ISO 8601 duration. */
export function parseIsoDuration(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const match = /^P(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i.exec(value.trim());
  if (!match || value.trim().length <= 2) return null;
  const [, days, hours, minutes, seconds] = match;
  const total =
    Number(days ?? 0) * 1440 + Number(hours ?? 0) * 60 + Number(minutes ?? 0) + Number(seconds ?? 0) / 60;
  return total > 0 ? Math.round(total) : null;
}

function yieldOf(value: unknown): { yieldText: string | null; servings: number | null } {
  const texts = textList(value).map(cleanText).filter(Boolean);
  if (texts.length === 0) return { yieldText: null, servings: null };
  // Prefer the entry that carries words ("4 servings") over a bare "4".
  const yieldText = texts.find((text) => /[a-z]/i.test(text)) ?? texts[0];
  const number = texts.map((text) => /(\d+)/.exec(text)).find((match) => match);
  const servings = number ? Number(number[1]) : null;
  return { yieldText, servings: servings && servings > 0 && servings < 1000 ? servings : null };
}

function titleFromHtml(html: string): string {
  const og = /<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']*)["']/i.exec(html)
    ?? /<meta[^>]+content=["']([^"']*)["'][^>]*property=["']og:title["']/i.exec(html);
  if (og) return cleanText(og[1]);
  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  return title ? cleanText(title[1]) : '';
}

/** Every JSON-LD block on the page, parsed; ones that fail to parse are skipped. */
export function jsonLdBlocks(html: string): unknown[] {
  const blocks: unknown[] = [];
  const pattern = /<script[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    const parsed = parseJsonLoosely(match[1]);
    if (parsed !== null) blocks.push(parsed);
  }
  return blocks;
}

/**
 * The recipe a page describes, or null when it carries no Recipe block. The
 * page title is still handed back through `pageTitle` so the paste fallback
 * can start with a name.
 */
export function extractRecipeFromHtml(html: string, url: string): ImportedRecipe | null {
  const node = findRecipeNode(jsonLdBlocks(html));
  if (!node) return null;
  const ingredientLines = textList(node.recipeIngredient ?? node.ingredients)
    .map(cleanText)
    .filter(Boolean);
  const { yieldText, servings } = yieldOf(node.recipeYield ?? node.yield);
  const authorNames = textList(node.author).map(cleanText).filter(Boolean);
  const name = cleanText(typeof node.name === 'string' ? node.name : '') || titleFromHtml(html) || 'Imported recipe';
  return {
    name,
    author: authorNames.length > 0 ? authorNames.join(', ') : null,
    yieldText,
    servings,
    ingredientLines,
    instructions: instructionList(node.recipeInstructions),
    prepMinutes: parseIsoDuration(node.prepTime),
    cookMinutes: parseIsoDuration(node.cookTime),
    totalMinutes: parseIsoDuration(node.totalTime),
    sourceUrl: url.trim(),
    sourceSite: siteNameFromUrl(url),
  };
}

/** The page's title, for a page with no Recipe block. */
export function pageTitleFromHtml(html: string): string {
  return titleFromHtml(html);
}

// --- One ingredient line ------------------------------------------------------

const UNICODE_FRACTIONS: Record<string, number> = {
  '½': 1 / 2, '⅓': 1 / 3, '⅔': 2 / 3, '¼': 1 / 4, '¾': 3 / 4, '⅕': 1 / 5, '⅖': 2 / 5, '⅗': 3 / 5,
  '⅘': 4 / 5, '⅙': 1 / 6, '⅚': 5 / 6, '⅛': 1 / 8, '⅜': 3 / 8, '⅝': 5 / 8, '⅞': 7 / 8,
};

/** "1½" and "1 ½" to "1.5", "½" to "0.5", so one number pattern reads them all. */
function normalizeFractions(text: string): string {
  return text
    .replace(/(\d+)\s*([½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])/g, (_, whole: string, frac: string) =>
      String(Number(whole) + UNICODE_FRACTIONS[frac]),
    )
    .replace(/[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g, (frac) => String(UNICODE_FRACTIONS[frac]))
    .replace(/⁄/g, '/');
}

const NUMBER = String.raw`(?:\d+\s+\d+\/\d+|\d+\/\d+|\d*\.\d+|\d+)`;

function readNumber(text: string): number {
  const trimmed = text.trim();
  const mixed = /^(\d+)\s+(\d+)\/(\d+)$/.exec(trimmed);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const fraction = /^(\d+)\/(\d+)$/.exec(trimmed);
  if (fraction) return Number(fraction[2]) === 0 ? NaN : Number(fraction[1]) / Number(fraction[2]);
  return Number(trimmed);
}

type UnitRule = { unit: ImportUnit; factor: number };

// Longest spellings first where one is the start of another.
const UNIT_WORDS: [RegExp, UnitRule][] = [
  [/^(?:fl\.?\s*oz|fluid\s+ounces?)\b\.?/i, { unit: 'ml', factor: 29.5735 }],
  [/^(?:kilograms?|kilos?|kgs?)\b\.?/i, { unit: 'g', factor: 1000 }],
  [/^(?:grams?|grammes?|gr|g)\b\.?/i, { unit: 'g', factor: 1 }],
  [/^(?:milligrams?|mg)\b\.?/i, { unit: 'g', factor: 0.001 }],
  [/^(?:ounces?|oz)\b\.?/i, { unit: 'oz', factor: 1 }],
  [/^(?:pounds?|lbs?)\b\.?/i, { unit: 'lb', factor: 1 }],
  [/^(?:millilit(?:er|re)s?|mls?)\b\.?/i, { unit: 'ml', factor: 1 }],
  [/^(?:centilit(?:er|re)s?|cl)\b\.?/i, { unit: 'ml', factor: 10 }],
  [/^(?:decilit(?:er|re)s?|dl)\b\.?/i, { unit: 'ml', factor: 100 }],
  [/^(?:lit(?:er|re)s?|l)\b\.?/i, { unit: 'ml', factor: 1000 }],
  [/^(?:tablespoons?|tbsps?|tbls?|tbs)\b\.?/i, { unit: 'tbsp', factor: 1 }],
  [/^(?:teaspoons?|tsps?)\b\.?/i, { unit: 'tsp', factor: 1 }],
  [/^(?:cups?|c)\b\.?/i, { unit: 'cup', factor: 1 }],
  [/^(?:pints?|pts?)\b\.?/i, { unit: 'cup', factor: 2 }],
  [/^(?:quarts?|qts?)\b\.?/i, { unit: 'cup', factor: 4 }],
  [/^(?:gallons?|gals?)\b\.?/i, { unit: 'cup', factor: 16 }],
  [/^(?:sticks?)\b(?:\s+of)?/i, { unit: 'tbsp', factor: 8 }],
  [/^(?:pinch(?:es)?)\b/i, { unit: 'tsp', factor: 1 / 16 }],
  [/^(?:dash(?:es)?)\b/i, { unit: 'tsp', factor: 1 / 8 }],
  [/^(?:cloves?|slices?|pieces?|pcs?|each|whole|heads?|bunch(?:es)?|sprigs?|stalks?|ribs?|leaves|fillets?|breasts?|thighs?|cans?|jars?|packages?|pkgs?|packets?|bags?|boxes|box|cartons?|bottles?|handfuls?|large|medium|small|med|lg|sm)\b\.?/i, { unit: 'piece', factor: 1 }],
];

// "T" and "t" are the one place case decides the unit.
function caseSensitiveSpoon(rest: string): UnitRule | null {
  const match = /^(T|t)\b\.?/.exec(rest);
  if (!match) return null;
  return match[1] === 'T' ? { unit: 'tbsp', factor: 1 } : { unit: 'tsp', factor: 1 };
}

function readUnit(rest: string): { rule: UnitRule; length: number } | null {
  const spoon = caseSensitiveSpoon(rest);
  if (spoon) return { rule: spoon, length: /^(T|t)\b\.?/.exec(rest)![0].length };
  for (const [pattern, rule] of UNIT_WORDS) {
    const match = pattern.exec(rest);
    if (match) return { rule, length: match[0].length };
  }
  return null;
}

// Words mapped to the builders' cut and prep choices.
const CUT_PREP_WORDS: [RegExp, string][] = [
  [/\bjulienned?\b/i, 'Julienned'],
  [/\bminced\b/i, 'Minced'],
  [/\bdiced\b/i, 'Diced'],
  [/\bcubed\b|\bcubes\b/i, 'Cubed'],
  [/\bchopped\b/i, 'Chopped'],
  [/\bsliced\b/i, 'Sliced'],
  [/\bgrated\b|\bzested\b/i, 'Grated'],
  [/\bshredded\b/i, 'Shredded'],
  [/\bcrushed\b/i, 'Crushed'],
  [/\bsmashed\b/i, 'Smashed'],
  [/\bmuddled\b/i, 'Muddled'],
  [/\bmashed\b/i, 'Mashed'],
  [/\bpur[eé]ed?\b/i, 'Pureed'],
  [/\btorn\b/i, 'Torn'],
  [/\bhalved\b/i, 'Halved'],
  [/\bquartered\b/i, 'Quartered'],
];

// Words that describe how much, how fresh or how prepared, rather than which
// food. Taken out of the search words only; the line itself keeps them.
const DESCRIPTIVE_WORDS = new Set([
  'large', 'medium', 'small', 'extra', 'big', 'jumbo', 'heaping', 'heaped', 'level', 'scant', 'generous',
  'packed', 'loosely', 'firmly', 'lightly', 'about', 'approximately', 'roughly', 'finely', 'coarsely', 'thinly',
  'thickly', 'freshly', 'fresh', 'ripe', 'good', 'quality', 'best', 'organic', 'softened', 'melted', 'cold',
  'warm', 'hot', 'room', 'temperature', 'chopped', 'diced', 'minced', 'sliced', 'grated', 'shredded', 'crushed',
  'smashed', 'mashed', 'pureed', 'puréed', 'julienned', 'cubed', 'halved', 'quartered', 'torn', 'zested',
  'peeled', 'seeded', 'deseeded', 'cored', 'trimmed', 'rinsed', 'drained', 'divided', 'plus', 'more', 'for',
  'serving', 'garnish', 'optional', 'of', 'the', 'a', 'an', 'and', 'or', 'to', 'taste', 'needed', 'as', 'some',
  'few', 'handful', 'pinch', 'dash', 'splash', 'cup', 'cups', 'whole', 'can', 'jar', 'package',
]);

const HEADER_PATTERN = /^(?:for\s+(?:the\s+)?[^,]{1,40}|[a-z][a-z &'-]{1,40}):$/i;

/** Splits "a, b (c)" into the food part and everything that reads as a note. */
function splitNote(text: string): { food: string; note: string } {
  const notes: string[] = [];
  let depth = 0;
  let food = '';
  let cut = -1;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '(') depth += 1;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    else if (ch === ',' && depth === 0) {
      cut = i;
      break;
    }
  }
  food = cut >= 0 ? text.slice(0, cut) : text;
  const after = cut >= 0 ? text.slice(cut + 1).trim() : '';
  food = food.replace(/\(([^)]*)\)/g, (_, inner: string) => {
    if (inner.trim()) notes.push(inner.trim());
    return ' ';
  });
  if (after) notes.push(after);
  return { food: food.replace(/\s+/g, ' ').trim(), note: notes.join('; ') };
}

function round(value: number, places = 3): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

export function parseIngredientLine(line: string): ParsedIngredientLine {
  const original = cleanText(line);
  const base: ParsedIngredientLine = {
    original,
    isHeader: false,
    quantity: null,
    unit: 'piece',
    foodText: '',
    searchText: '',
    prepNote: '',
    cutPrep: 'N/A',
    optional: false,
    toTaste: false,
    rangeNote: null,
  };
  if (!original) return { ...base, isHeader: true };
  if (HEADER_PATTERN.test(original) && !/\d/.test(original)) {
    return { ...base, isHeader: true, foodText: original.replace(/:$/, '') };
  }

  let text = normalizeFractions(original)
    .replace(/^[-*•▢□☐✓◦·]+\s*/, '')
    .trim();
  const optional = /\boptional\b/i.test(text);
  const toTaste = /\bto\s+taste\b|\bas\s+needed\b|\bfor\s+serving\b|\bfor\s+garnish\b/i.test(text);

  // A weight in brackets is the most exact amount a recipe gives: "1 cup (120 g) flour".
  const bracketWeight = new RegExp(String.raw`\((?:about\s+|approx\.?\s+)?(${NUMBER})\s*(g|grams?|kg|ml|millilit(?:er|re)s?)\b\.?\)`, 'i').exec(text);

  let quantity: number | null = null;
  let unit: ImportUnit = 'piece';
  let rangeNote: string | null = null;

  text = text.replace(/^(?:about|approx\.?|approximately|around|scant|heaping)\s+/i, '');
  const range = new RegExp(String.raw`^(${NUMBER})\s*(?:-|to|or)\s*(${NUMBER})\s*`, 'i').exec(text);
  const single = new RegExp(String.raw`^(${NUMBER})\s*`).exec(text);
  let rest = text;
  if (range) {
    const low = readNumber(range[1]);
    const high = readNumber(range[2]);
    if (Number.isFinite(low) && Number.isFinite(high) && high > low) {
      quantity = (low + high) / 2;
      rangeNote = `The recipe gives ${formatNumber(low)} to ${formatNumber(high)}; ${formatNumber(quantity)} is used.`;
    } else {
      quantity = low;
    }
    rest = text.slice(range[0].length);
  } else if (single) {
    quantity = readNumber(single[1]);
    rest = text.slice(single[0].length);
  } else if (/^(?:a|an|one)\s+/i.test(text)) {
    const afterArticle = text.replace(/^(?:a|an|one)\s+/i, '');
    if (readUnit(afterArticle)) {
      quantity = 1;
      rest = afterArticle;
    }
  }

  // "1 (14 oz) can tomatoes": the size in brackets times the count.
  let containerSize: { value: number; rule: UnitRule } | null = null;
  const sizeMatch = new RegExp(String.raw`^\((${NUMBER})\s*-?\s*([^)]+)\)\s*`).exec(rest);
  if (sizeMatch && quantity !== null) {
    const sizeUnit = readUnit(sizeMatch[2].trim());
    if (sizeUnit && sizeUnit.rule.unit !== 'piece') {
      containerSize = { value: readNumber(sizeMatch[1]), rule: sizeUnit.rule };
      rest = rest.slice(sizeMatch[0].length);
    }
  }

  if (quantity !== null) {
    const found = readUnit(rest);
    if (containerSize) {
      quantity = quantity * containerSize.value * containerSize.rule.factor;
      unit = containerSize.rule.unit;
      if (found && found.rule.unit === 'piece') rest = rest.slice(found.length);
    } else if (found) {
      quantity = quantity * found.rule.factor;
      unit = found.rule.unit;
      // A size word like "large" stays in the food words too, as a note.
      rest = rest.slice(found.length);
    }
  }

  if (bracketWeight && !containerSize) {
    const weight = readNumber(bracketWeight[1]);
    const inUnit = bracketWeight[2].toLowerCase();
    if (Number.isFinite(weight) && weight > 0) {
      if (inUnit.startsWith('kg')) {
        quantity = weight * 1000;
        unit = 'g';
      } else if (inUnit.startsWith('m')) {
        quantity = weight;
        unit = 'ml';
      } else {
        quantity = weight;
        unit = 'g';
      }
    }
    rest = rest.replace(bracketWeight[0], ' ');
  }

  rest = rest.replace(/^of\s+/i, '').trim();
  const { food, note } = splitNote(rest);
  const foodText = food.replace(/\s*\b(?:optional|to taste)\b\s*/gi, ' ').replace(/\s+/g, ' ').trim();

  let cutPrep = 'N/A';
  for (const [pattern, value] of CUT_PREP_WORDS) {
    if (pattern.test(food) || pattern.test(note)) {
      cutPrep = value;
      break;
    }
  }

  const searchWords = foodText
    .toLowerCase()
    .replace(/[^a-zà-ÿ' -]/g, ' ')
    .split(/\s+/)
    .filter((word) => word && !DESCRIPTIVE_WORDS.has(word));
  const searchText = searchWords.join(' ') || foodText.toLowerCase();

  return {
    ...base,
    quantity: quantity !== null && Number.isFinite(quantity) && quantity > 0 ? round(quantity) : null,
    unit,
    foodText,
    searchText,
    prepNote: note,
    cutPrep,
    optional,
    toTaste: toTaste && quantity === null,
    rangeNote,
  };
}

/**
 * A pasted block of ingredients, one per line. Bullets and "1." numbering
 * come off; a line that is only a number (a list count) is dropped.
 */
export function splitPastedIngredients(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*•▢□☐✓◦·]+|\d+[.)](?=\s))\s*/, '').trim())
    .filter((line) => line.length > 0 && !/^\d+$/.test(line));
}

// --- Amounts for the builders --------------------------------------------------

function formatNumber(value: number): string {
  return String(round(value, 2));
}

/**
 * An amount in the units the builders offer for this measurement system.
 * Every builder offers tsp, tbsp, cup and piece, and grams (metric) or
 * ounces and pounds (imperial). Millilitres are metric only in some
 * builders, so under imperial they become cups or spoons.
 */
export function toBuilderAmount(
  quantity: number,
  unit: ImportUnit,
  system: 'metric' | 'imperial',
): { quantity: number; unit: ImportUnit } {
  if (unit === 'g' || unit === 'oz' || unit === 'lb') {
    const grams = unit === 'g' ? quantity : unit === 'oz' ? quantity * 28.3495 : quantity * 453.592;
    if (system === 'metric') return { quantity: round(grams, 1), unit: 'g' };
    const ounces = grams / 28.3495;
    return ounces >= 16 ? { quantity: round(ounces / 16, 2), unit: 'lb' } : { quantity: round(ounces, 2), unit: 'oz' };
  }
  if (unit === 'ml' && system === 'imperial') {
    if (quantity >= 59) return { quantity: round(quantity / 236.588, 2), unit: 'cup' };
    if (quantity >= 14.5) return { quantity: round(quantity / 14.787, 2), unit: 'tbsp' };
    return { quantity: round(quantity / 4.929, 2), unit: 'tsp' };
  }
  return { quantity: round(quantity, 3), unit };
}

const UNIT_WORDS_FOR_SENTENCE: Record<ImportUnit, [string, string]> = {
  g: ['g', 'g'], oz: ['oz', 'oz'], lb: ['lb', 'lb'], ml: ['ml', 'ml'], tsp: ['tsp', 'tsp'],
  tbsp: ['tbsp', 'tbsp'], cup: ['cup', 'cups'], piece: ['piece', 'pieces'],
};

/** "1.5 cups", "200 g", or "No amount given" for the review list. */
export function describeAmount(quantity: number | null, unit: ImportUnit): string {
  if (quantity === null) return 'No amount given';
  const [one, many] = UNIT_WORDS_FOR_SENTENCE[unit];
  return `${formatNumber(quantity)} ${quantity === 1 ? one : many}`;
}

// --- Whether an import is ready for a builder -----------------------------------

export type ImportLineStatus = {
  isHeader: boolean;
  leftOut: boolean;
  matched: boolean;
  quantity: number | null;
};

export type ImportReadiness = {
  ready: boolean;
  toMatch: number;
  toAmount: number;
  included: number;
  leftOut: number;
  sentence: string;
};

/**
 * An import goes to a builder only when every line is either matched to a
 * food with an amount, or deliberately left out. Nothing unsure slips
 * through, since the builder scores what it is given.
 */
export function importReadiness(lines: ImportLineStatus[]): ImportReadiness {
  const foodLines = lines.filter((line) => !line.isHeader);
  const leftOut = foodLines.filter((line) => line.leftOut).length;
  const kept = foodLines.filter((line) => !line.leftOut);
  const toMatch = kept.filter((line) => !line.matched).length;
  const toAmount = kept.filter((line) => line.matched && !(line.quantity !== null && line.quantity > 0)).length;
  const included = kept.length - toMatch - toAmount;
  const ready = kept.length > 0 && toMatch === 0 && toAmount === 0;
  let sentence: string;
  if (foodLines.length === 0) {
    sentence = 'No ingredient lines yet.';
  } else if (kept.length === 0) {
    sentence = 'Every line is left out, so there is nothing to build.';
  } else if (ready) {
    sentence = `${included} ${included === 1 ? 'ingredient is' : 'ingredients are'} matched${leftOut > 0 ? ` and ${leftOut} left out` : ''}. The builder scores them before anything is saved.`;
  } else {
    const parts: string[] = [];
    if (toMatch > 0) parts.push(`${toMatch} ${toMatch === 1 ? 'line needs' : 'lines need'} a food picked or left out`);
    if (toAmount > 0) parts.push(`${toAmount} ${toAmount === 1 ? 'needs' : 'need'} an amount`);
    sentence = `${parts.join(', and ')}.`;
  }
  return { ready, toMatch, toAmount, included, leftOut, sentence };
}

/** Said when a page has no Recipe block. */
export function noRecipeFoundSentence(site: string): string {
  const where = site ? `${site} does not` : 'This page does not';
  return `${where} describe a recipe in the standard form recipe sites use. Paste the ingredient list below instead, one per line.`;
}

/** The attribution line kept with the recipe and shown in the builder's notes. */
export function attributionLine(recipe: Pick<ImportedRecipe, 'sourceSite' | 'sourceUrl' | 'author'>): string {
  const by = recipe.author ? ` by ${recipe.author}` : '';
  const from = recipe.sourceSite || recipe.sourceUrl;
  return from ? `Imported from ${from}${by}.` : `Imported${by}.`;
}

// --- What an import holds while it is reviewed -------------------------------

export type RecipeImportMatch = {
  foodId: number;
  source: string;
  foodName: string;
  category: string;
  /** How closely the name matched the line, 0 to 1; null when the person searched and picked it. */
  score: number | null;
  /** True once the person chose it; a confident automatic match is false. */
  picked: boolean;
};

export type RecipeImportLine = ParsedIngredientLine & {
  leftOut: boolean;
  match: RecipeImportMatch | null;
  /** Filled when the import is opened in a builder, in the builder's units. */
  builderQuantity?: number | null;
  builderUnit?: string | null;
};

export function newImportLine(text: string): RecipeImportLine {
  return { ...parseIngredientLine(text), leftOut: false, match: null };
}

export function lineStatus(line: RecipeImportLine): ImportLineStatus {
  return { isHeader: line.isHeader, leftOut: line.leftOut, matched: line.match !== null, quantity: line.quantity };
}
