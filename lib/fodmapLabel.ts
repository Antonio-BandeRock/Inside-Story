// FODMAP ingredients named on a scanned product's label (added beside G23 of
// the competitive build plan, 2026-09-26). Presence only: which ingredients
// in the list are known sources of each FODMAP group, never how much of any
// of them the product carries, because a label does not say and the amount
// is what decides whether a food bothers somebody. The amount-aware half of
// G23 waits on USDA FoodData Central sugars and published measurements
// reaching the reference database (unified database Phase 5).
//
// Which ingredients belong to which group comes from the published FODMAP
// literature, not from any app's food list:
//   Gibson PR, Shepherd SJ. Evidence-based dietary management of functional
//     gastrointestinal symptoms: the FODMAP approach. J Gastroenterol
//     Hepatol 2010;25:252-258 (the five groups and their main food sources).
//   Muir JG et al. Fructan and free fructose content of common Australian
//     vegetables and fruit. J Agric Food Chem 2007;55:6619-6627.
//   Biesiekierski JR et al. Quantification of fructans, galacto-
//     oligosacharides and other short-chain carbohydrates in processed
//     grains and cereals. J Hum Nutr Diet 2011;24:154-176.
//   Yao CK, Tan HL, van Langenberg DR et al. Dietary sorbitol and mannitol:
//     food content and distinct absorption patterns between healthy
//     individuals and patients with irritable bowel syndrome. J Hum Nutr
//     Diet 2014;27 Suppl 2:263-275.
//
// Matching is whole-word, the same rule lib/scannedProductFlags.ts holds
// ("malt" must never match inside "maltose"), and a plant milk or a
// "-free" claim is not read as the thing it says it is free of.
//
// Pure: no database and no React, so scripts/test_fodmap_label.js can check
// it directly.

export type FodmapGroup = 'fructans' | 'gos' | 'lactose' | 'fructose' | 'polyols';

export type FodmapLabelMatch = {
  group: FodmapGroup;
  groupLabel: string;
  /** The ingredient words found, as written on the label, each once. */
  found: string[];
};

type GroupWords = { group: FodmapGroup; label: string; words: string[] };

const GROUPS: GroupWords[] = [
  {
    group: 'fructans',
    label: 'Fructans',
    words: [
      'garlic', 'onion', 'onions', 'shallot', 'shallots', 'leek', 'leeks', 'inulin', 'chicory root',
      'chicory root fiber', 'chicory root fibre', 'fructooligosaccharides', 'fructo-oligosaccharides',
      'oligofructose', 'fos', 'wheat', 'rye', 'barley',
    ],
  },
  {
    group: 'gos',
    label: 'Galacto-oligosaccharides (GOS)',
    words: [
      'chickpea', 'chickpeas', 'chickpea flour', 'lentil', 'lentils', 'kidney bean', 'kidney beans',
      'black bean', 'black beans', 'navy bean', 'navy beans', 'baked beans', 'split peas',
      'galactooligosaccharides', 'galacto-oligosaccharides',
    ],
  },
  {
    group: 'lactose',
    label: 'Lactose',
    words: [
      'milk', 'lactose', 'milk solids', 'milk powder', 'skim milk', 'whole milk', 'buttermilk',
      'condensed milk', 'evaporated milk', 'yogurt', 'yoghurt', 'ice cream',
    ],
  },
  {
    group: 'fructose',
    label: 'Fructose in excess of glucose',
    words: [
      'honey', 'agave', 'agave syrup', 'agave nectar', 'high fructose corn syrup', 'high-fructose corn syrup',
      'fructose', 'crystalline fructose', 'fructose syrup', 'apple juice concentrate', 'pear juice concentrate',
    ],
  },
  {
    group: 'polyols',
    label: 'Polyols',
    words: [
      'sorbitol', 'mannitol', 'xylitol', 'maltitol', 'isomalt', 'lactitol',
      'e420', 'e421', 'e953', 'e965', 'e966', 'e967',
    ],
  },
];

// A plant milk carries no lactose, so "coconut milk" is not read as milk.
const PLANT_MILK_BEFORE = /\b(coconut|almond|oat|rice|soy|soya|cashew|hemp|pea|macadamia|hazelnut)\s*$/i;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findWord(text: string, word: string): string | null {
  const pattern = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'gi');
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const after = text.slice(match.index + match[0].length);
    // "lactose-free", "lactose free", "gluten and wheat free" style claims.
    if (/^[\s-]*free\b/i.test(after)) continue;
    if (/^\s+and\s+\w+[\s-]*free\b/i.test(after)) continue;
    // "lactose-free milk" names a product made free of the group's sugar.
    if (/[a-z]+[ -]free *$/i.test(text.slice(0, match.index))) continue;
    if (/milk/i.test(word) && PLANT_MILK_BEFORE.test(text.slice(0, match.index))) continue;
    return match[0];
  }
  return null;
}

/**
 * Every FODMAP group with at least one of its ingredient words on the
 * label, in the order the groups are listed above. A longer word that
 * holds a shorter one ("onion powder" holds "onion") is reported once.
 */
export function findFodmapIngredients(ingredientsText: string): FodmapLabelMatch[] {
  const text = ingredientsText.trim();
  if (!text) return [];
  const out: FodmapLabelMatch[] = [];
  for (const group of GROUPS) {
    const found: string[] = [];
    const seen = new Set<string>();
    const longestFirst = [...group.words].sort((a, b) => b.length - a.length);
    for (const word of longestFirst) {
      const hit = findWord(text, word);
      if (!hit) continue;
      const key = hit.toLowerCase();
      if ([...seen].some((earlier) => earlier.includes(key))) continue;
      seen.add(key);
      found.push(hit.toLowerCase());
    }
    if (found.length > 0) {
      const inLabelOrder = found.sort((a, b) => text.toLowerCase().indexOf(a) - text.toLowerCase().indexOf(b));
      out.push({ group: group.group, groupLabel: group.label, found: inLabelOrder });
    }
  }
  return out;
}

/** The conditions whose reading covers FODMAPs, so the card is shown to people tracking them. */
export const FODMAP_LABEL_CONDITIONS: Record<string, string> = {
  ibs: 'ibs-low-fodmap-diet',
  ibd: 'ibd-fodmap-remission-symptoms',
};

/** Whether any tracked condition makes the card worth showing. */
export function showsFodmapCard(selectedConditions: string[]): boolean {
  return selectedConditions.some((code) => code in FODMAP_LABEL_CONDITIONS);
}

/** One line per group for the card: "Fructans: garlic, onion powder". */
export function describeFodmapLine(match: FodmapLabelMatch): string {
  return `${match.groupLabel}: ${match.found.join(', ')}`;
}

/** The sentence under the card's lines, or the card's only line when nothing matched. */
export function describeFodmapCaption(matches: FodmapLabelMatch[]): string {
  if (matches.length === 0) {
    return 'No known FODMAP ingredient words were found on this label. A label in another language, or one read from a blurry photo, can hide one, and the list alone says nothing about amounts.';
  }
  return 'These ingredients are known FODMAP sources. The label gives no amounts, and the amount in a serving is what decides whether a food bothers someone, so this says what is in the product and not how much.';
}

/** What Read This to Me says about the card. */
export function describeFodmapSpoken(matches: FodmapLabelMatch[]): string {
  if (matches.length === 0) return 'No known FODMAP ingredient words on the label.';
  const lines = matches.map(describeFodmapLine).join('. ');
  return `FODMAP ingredients on the label, with no amounts given. ${lines}.`;
}
