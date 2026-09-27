// How processed a scanned product is, and which additives it lists
// (G16, 2026-09-27).
//
// Open Food Facts returns two things on every product lookup that the
// scan never kept: `nova_group` (1 to 4, the NOVA classification) and
// `additives_tags` (E-numbers as tags like "en:e322i"). Both are filled
// in by the Open Food Facts community from the label, so the caption
// under them says where they came from. The scan stores them on the
// product and shows them, and every additive with a reading entry of its
// own links to it.
//
// A NOVA group describes how a food was made. It is never turned into a
// judgement of the food or of the person eating it.
//
// Pure, with no React and no database, so scripts/test_product_processing.js
// checks it without a phone.

export type NovaGroup = 1 | 2 | 3 | 4;

export const NOVA_GROUPS: Record<NovaGroup, { label: string; caption: string }> = {
  1: { label: 'Unprocessed or minimally processed', caption: 'A whole food, or one only dried, frozen, ground, pasteurised or similar.' },
  2: { label: 'Processed culinary ingredient', caption: 'Something taken from a food for cooking with, such as oil, butter, sugar or salt.' },
  3: { label: 'Processed food', caption: 'A whole food with salt, sugar, oil or vinegar added, the way a kitchen would, such as cheese, canned beans or bread.' },
  4: {
    label: 'Ultra-processed',
    caption: 'Made mostly from substances extracted from foods or made industrially, usually with additives a home kitchen would not use.',
  },
};

/** The reading entries a NOVA group opens. Group 4 also links the umbrella review on ultra-processed food. */
export function novaReadingIds(group: NovaGroup): string[] {
  return group === 4 ? ['glossary-nova-classification', 'additive-upf-convincing-evidence-class-i'] : ['glossary-nova-classification'];
}

export function parseNovaGroup(value: unknown): NovaGroup | null {
  const n = typeof value === 'string' ? Number(value) : value;
  return n === 1 || n === 2 || n === 3 || n === 4 ? n : null;
}

/** "en:e322i" becomes "E322i". Anything that is not an E-number tag is dropped. */
export function additiveCodeFromTag(tag: string): string | null {
  const match = /^(?:[a-z]{2}:)?e(\d{3,4})([a-z]*)$/i.exec(tag.trim());
  if (!match) return null;
  return `E${match[1]}${match[2].toLowerCase()}`;
}

function baseNumber(code: string): number {
  return Number(/^E(\d+)/.exec(code)?.[1] ?? NaN);
}

// Common names for the E-numbers that turn up most on labels. A code
// missing here still shows, by its number alone.
const ADDITIVE_NAMES: Record<number, string> = {
  100: 'Curcumin',
  101: 'Riboflavin',
  102: 'Tartrazine (Yellow 5)',
  104: 'Quinoline yellow',
  110: 'Sunset yellow (Yellow 6)',
  120: 'Carmine',
  122: 'Azorubine',
  124: 'Ponceau 4R',
  127: 'Erythrosine (Red 3)',
  129: 'Allura red (Red 40)',
  131: 'Patent blue V',
  132: 'Indigo carmine (Blue 2)',
  133: 'Brilliant blue (Blue 1)',
  140: 'Chlorophyll',
  141: 'Copper chlorophyll',
  150: 'Caramel colour',
  160: 'Carotenes and paprika extract',
  162: 'Beetroot red',
  163: 'Anthocyanins',
  170: 'Calcium carbonate',
  171: 'Titanium dioxide',
  200: 'Sorbic acid',
  202: 'Potassium sorbate',
  210: 'Benzoic acid',
  211: 'Sodium benzoate',
  220: 'Sulphur dioxide',
  221: 'Sodium sulphite',
  223: 'Sodium metabisulphite',
  224: 'Potassium metabisulphite',
  249: 'Potassium nitrite',
  250: 'Sodium nitrite',
  251: 'Sodium nitrate',
  252: 'Potassium nitrate',
  260: 'Acetic acid',
  270: 'Lactic acid',
  282: 'Calcium propionate',
  290: 'Carbon dioxide',
  296: 'Malic acid',
  300: 'Ascorbic acid (vitamin C)',
  301: 'Sodium ascorbate',
  306: 'Tocopherols (vitamin E)',
  307: 'Alpha-tocopherol',
  319: 'TBHQ',
  320: 'BHA',
  321: 'BHT',
  322: 'Lecithins',
  325: 'Sodium lactate',
  330: 'Citric acid',
  331: 'Sodium citrates',
  332: 'Potassium citrates',
  333: 'Calcium citrates',
  334: 'Tartaric acid',
  338: 'Phosphoric acid',
  339: 'Sodium phosphates',
  340: 'Potassium phosphates',
  341: 'Calcium phosphates',
  343: 'Magnesium phosphates',
  401: 'Sodium alginate',
  406: 'Agar',
  407: 'Carrageenan',
  410: 'Locust bean gum',
  412: 'Guar gum',
  414: 'Gum arabic',
  415: 'Xanthan gum',
  418: 'Gellan gum',
  420: 'Sorbitol',
  422: 'Glycerol',
  433: 'Polysorbate 80',
  435: 'Polysorbate 60',
  440: 'Pectin',
  450: 'Diphosphates',
  451: 'Triphosphates',
  452: 'Polyphosphates',
  460: 'Cellulose',
  466: 'Carboxymethylcellulose (cellulose gum)',
  471: 'Mono- and diglycerides of fatty acids',
  472: 'Esters of mono- and diglycerides',
  476: 'Polyglycerol polyricinoleate',
  481: 'Sodium stearoyl lactylate',
  500: 'Sodium carbonates (baking soda)',
  501: 'Potassium carbonates',
  503: 'Ammonium carbonates',
  508: 'Potassium chloride',
  509: 'Calcium chloride',
  551: 'Silicon dioxide',
  575: 'Glucono delta-lactone',
  621: 'Monosodium glutamate (MSG)',
  627: 'Disodium guanylate',
  631: 'Disodium inosinate',
  635: 'Disodium ribonucleotides',
  900: 'Dimethylpolysiloxane',
  903: 'Carnauba wax',
  904: 'Shellac',
  920: 'L-cysteine',
  924: 'Potassium bromate',
  927: 'Azodicarbonamide',
  950: 'Acesulfame K',
  951: 'Aspartame',
  952: 'Cyclamate',
  954: 'Saccharin',
  955: 'Sucralose',
  960: 'Steviol glycosides (stevia)',
  965: 'Maltitol',
  967: 'Xylitol',
  968: 'Erythritol',
  1422: 'Acetylated distarch adipate',
  1442: 'Hydroxypropyl distarch phosphate',
};

// Which E-numbers have a reading entry of their own in the Food
// Additives category, matched by base number so E407a and E450i land on
// the same entry as E407 and E450. The same entries the ingredient-text
// flags in lib/scannedProductFlags.ts already point at.
const READING_BY_NUMBER: [number[], string][] = [
  [[249, 250, 251, 252], 'additive-nitrates-nitrites'],
  [[924], 'additive-potassium-bromate'],
  [[102, 104, 110, 122, 124, 127, 129, 131, 132, 133, 142, 151, 155], 'additive-synthetic-dyes'],
  [[433, 435, 466], 'additive-emulsifiers-cmc-polysorbate80'],
  [[407], 'additive-carrageenan'],
  [[621], 'additive-msg'],
  [[951], 'additive-aspartame'],
  [[955], 'additive-sucralose'],
  [[220, 221, 222, 223, 224, 225, 226, 227, 228], 'additive-sulfites'],
  [[927], 'additive-azodicarbonamide'],
  [[338, 339, 340, 341, 343, 450, 451, 452], 'additive-phosphates'],
  [[320, 321], 'additive-bha-bht'],
  [[412, 415], 'additive-xanthan-guar-gum'],
];

const READING_LOOKUP = new Map<number, string>();
for (const [numbers, id] of READING_BY_NUMBER) for (const n of numbers) READING_LOOKUP.set(n, id);

export type ProductAdditive = { code: string; name: string | null; readingId: string | null };

/** Tags as Open Food Facts sends them, turned into one row per additive in E-number order. */
export function describeAdditives(tags: readonly string[]): ProductAdditive[] {
  const seen = new Set<string>();
  const rows: ProductAdditive[] = [];
  for (const tag of tags) {
    const code = additiveCodeFromTag(tag);
    if (!code || seen.has(code)) continue;
    seen.add(code);
    const n = baseNumber(code);
    rows.push({ code, name: ADDITIVE_NAMES[n] ?? null, readingId: READING_LOOKUP.get(n) ?? null });
  }
  return rows.sort((a, b) => baseNumber(a.code) - baseNumber(b.code) || a.code.localeCompare(b.code));
}

export function additiveRowLabel(additive: ProductAdditive): string {
  return additive.name ? `${additive.code} ${additive.name}` : additive.code;
}

/** The line above the additive list. */
export function describeAdditiveCount(count: number): string {
  if (count === 0) return 'No additives listed.';
  return count === 1 ? 'One additive listed.' : `${count} additives listed.`;
}

export const PROCESSING_SOURCE_CAPTION =
  'From Open Food Facts, where volunteers fill these in from the label. A product nobody has classified yet shows no group.';

/** The tags as stored on scanned_products.additives_json. Anything unreadable reads as not stored. */
export function parseStoredAdditiveTags(json: string | null): string[] | null {
  if (json == null) return null;
  try {
    const parsed: unknown = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.filter((tag): tag is string => typeof tag === 'string') : null;
  } catch {
    return null;
  }
}

/** Open Food Facts' raw fields, as the barcode lookup reads them. */
export function readOpenFoodFactsProcessing(product: { nova_group?: unknown; additives_tags?: unknown }): {
  novaGroup: NovaGroup | null;
  additiveTags: string[];
} {
  const tags = Array.isArray(product.additives_tags) ? product.additives_tags.filter((tag): tag is string => typeof tag === 'string') : [];
  return { novaGroup: parseNovaGroup(product.nova_group), additiveTags: tags };
}
