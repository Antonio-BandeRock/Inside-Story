// How much of the calcium, iron and zinc eaten in a day the body is likely
// to take up (G13, 2026-09-27).
//
// Insights > Nutrients counts what was eaten. The body takes up only part of
// it, and for these three minerals the share moves a long way with what
// else is on the plate. Opening the calcium, iron or zinc row for a day now
// says about how much was taken up, worked by a published method, and
// always says it is an estimate, how it was worked and how strong the
// evidence behind it is. Food only: a supplement's uptake depends on its
// form and timing, which the app does not know.
//
// The three methods:
//
//  1. Calcium, by each food's oxalate tier (the Oxalate Level sub-criterion
//     in the reference database). Oxalate binds calcium in the same food.
//     Shares from single-food absorption studies, Weaver, Proulx and Heaney,
//     "Choices for achieving adequate dietary calcium with a vegetarian
//     diet", Am J Clin Nutr 1999;70(3 Suppl):543S-548S: milk 32.1%, beans
//     21.8% to 26.7%, almonds 21.2%, rhubarb 8.5%, spinach 5.1%. Low and
//     unassessed foods take the milk figure, although low-oxalate greens
//     such as kale (49.3%) and broccoli (61.3%) do better than milk, so the
//     estimate runs low for them rather than high.
//
//  2. Iron, by the Monsen meal model, Monsen et al., "Estimation of
//     available dietary iron", Am J Clin Nutr 1978;31(1):134-141, applied
//     meal by meal. 40% of the iron in meat, fish and poultry is heme iron,
//     taken up at 23%. The rest is nonheme iron, taken up at 3%, 5% or 8%
//     by how much meat, fish or poultry and vitamin C are in the same meal.
//     The model assumes iron stores of about 500 mg; somebody with low
//     stores takes up more, which is said on screen.
//
//  3. Zinc, by diet type, WHO/FAO "Vitamin and mineral requirements in
//     human nutrition", 2nd ed. 2004, and IZiNCG Technical Document 1, Food
//     Nutr Bull 2004;25(1 Suppl 2): about 50%, 30% or 15% of zinc taken up
//     as a diet runs from low to high in phytate. The database carries no
//     phytate figure, so a stand-in decides the diet type: the share of the
//     day's zinc coming from whole grains, legumes, nuts and seeds, which is
//     where phytate is. Leavened bread is left out of that group, since
//     yeast breaks much of its phytate down. The screen says phytate was
//     judged by kind of food, not measured.
//
// Pure: no database and no React, so scripts/test_mineral_absorption.js
// checks it directly. Nothing here says a food is good or bad for anybody.

import type { EvidenceTier } from './digest/types';

export const ABSORPTION_NUTRIENTS = ['calcium', 'iron', 'zinc'] as const;
export type AbsorptionNutrient = (typeof ABSORPTION_NUTRIENTS)[number];

export function isAbsorptionNutrient(code: string): code is AbsorptionNutrient {
  return (ABSORPTION_NUTRIENTS as readonly string[]).includes(code);
}

/** One food as eaten, with what the estimate needs to know about it. */
export type AbsorptionItem = {
  mealId: string;
  /** Grams this person ate. */
  grams: number;
  /** Mineral and vitamin C amounts this person ate from it, in mg. */
  totals: Record<string, number>;
  /** Reference database category, null when unknown. */
  category: string | null;
  /** Oxalate Level tier, null when the food has none. */
  oxalateTier: string | null;
};

export type AbsorptionEstimate = {
  nutrient: AbsorptionNutrient;
  eaten: number;
  absorbed: number;
  /** absorbed / eaten, 0 when nothing was eaten. */
  share: number;
  tier: EvidenceTier;
  /** How the figure was worked, one or two sentences. */
  method: string[];
};

// Calcium, by oxalate tier (Weaver, Proulx and Heaney 1999).
export const CALCIUM_SHARE_BY_OXALATE: Record<string, number> = {
  'Very High': 0.051,
  High: 0.085,
  Moderate: 0.22,
  Low: 0.321,
};
export const CALCIUM_SHARE_DEFAULT = 0.321;

// Iron (Monsen et al. 1978).
export const HEME_FRACTION_OF_MEAT_IRON = 0.4;
export const HEME_SHARE = 0.23;
export const NONHEME_SHARE = { low: 0.03, medium: 0.05, high: 0.08 } as const;

// Zinc (WHO/FAO 2004; IZiNCG 2004).
export const ZINC_SHARE = { low: 0.5, moderate: 0.3, high: 0.15 } as const;
export const PHYTATE_RICH_CATEGORIES = ['Grain', 'Legume', 'NutSeed'] as const;
/** At or past this share of zinc from phytate-rich foods, the day reads as a high-phytate diet. */
export const PHYTATE_HIGH_SHARE = 0.5;
/** Below this share it reads as a low-phytate diet. */
export const PHYTATE_LOW_SHARE = 0.25;

function amount(item: AbsorptionItem, code: string): number {
  const value = item.totals[code];
  return typeof value === 'number' && value > 0 ? value : 0;
}

export function calciumShareFor(oxalateTier: string | null): number {
  return (oxalateTier && CALCIUM_SHARE_BY_OXALATE[oxalateTier]) || CALCIUM_SHARE_DEFAULT;
}

/**
 * Monsen's nonheme level for one meal: high past 90 g of meat, fish or
 * poultry, or past 75 mg of vitamin C, or with a medium amount of both;
 * medium with 30 to 90 g or 25 to 75 mg; low below both.
 */
export function nonhemeLevel(meatGrams: number, vitaminC: number): keyof typeof NONHEME_SHARE {
  const meatMedium = meatGrams >= 30;
  const vitCMedium = vitaminC >= 25;
  if (meatGrams > 90 || vitaminC > 75 || (meatMedium && vitCMedium)) return 'high';
  if (meatMedium || vitCMedium) return 'medium';
  return 'low';
}

export function phytateLevel(phytateRichShare: number): keyof typeof ZINC_SHARE {
  if (phytateRichShare >= PHYTATE_HIGH_SHARE) return 'high';
  if (phytateRichShare < PHYTATE_LOW_SHARE) return 'low';
  return 'moderate';
}

function isMeat(item: AbsorptionItem): boolean {
  return item.category === 'Meat';
}

function isPhytateRich(item: AbsorptionItem): boolean {
  return item.category != null && (PHYTATE_RICH_CATEGORIES as readonly string[]).includes(item.category);
}

function pct(share: number): string {
  return `${Math.round(share * 100)}%`;
}

function estimateCalcium(items: AbsorptionItem[]): AbsorptionEstimate {
  let eaten = 0;
  let absorbed = 0;
  let bound = 0;
  for (const item of items) {
    const calcium = amount(item, 'calcium');
    if (calcium === 0) continue;
    const share = calciumShareFor(item.oxalateTier);
    eaten += calcium;
    absorbed += calcium * share;
    if (share < CALCIUM_SHARE_DEFAULT) bound += calcium;
  }
  const method = [
    'Each food is taken at the share measured for foods like it: about 32% for milk and other low-oxalate foods, less as oxalate rises, down to about 5% for spinach.',
  ];
  if (bound > 0) {
    method.push(`${pct(bound / eaten)} of the calcium eaten came from foods with moderate to very high oxalate.`);
  }
  return { nutrient: 'calcium', eaten, absorbed, share: eaten > 0 ? absorbed / eaten : 0, tier: 'moderate', method };
}

function estimateIron(items: AbsorptionItem[]): AbsorptionEstimate {
  const meals = new Map<string, AbsorptionItem[]>();
  for (const item of items) {
    if (!meals.has(item.mealId)) meals.set(item.mealId, []);
    meals.get(item.mealId)!.push(item);
  }
  let eaten = 0;
  let absorbed = 0;
  let heme = 0;
  const levels = { low: 0, medium: 0, high: 0 };
  for (const mealItems of meals.values()) {
    let meatGrams = 0;
    let vitaminC = 0;
    let hemeIron = 0;
    let nonhemeIron = 0;
    for (const item of mealItems) {
      const iron = amount(item, 'iron');
      vitaminC += amount(item, 'vitamin_c');
      if (isMeat(item)) {
        meatGrams += item.grams;
        hemeIron += iron * HEME_FRACTION_OF_MEAT_IRON;
        nonhemeIron += iron * (1 - HEME_FRACTION_OF_MEAT_IRON);
      } else {
        nonhemeIron += iron;
      }
    }
    if (hemeIron + nonhemeIron === 0) continue;
    const level = nonhemeLevel(meatGrams, vitaminC);
    levels[level]++;
    eaten += hemeIron + nonhemeIron;
    heme += hemeIron;
    absorbed += hemeIron * HEME_SHARE + nonhemeIron * NONHEME_SHARE[level];
  }
  const counted = levels.low + levels.medium + levels.high;
  const method = [
    'Worked meal by meal: iron from meat, fish and poultry is taken at about 23%, other iron at 3% to 8% by how much meat, fish, poultry and vitamin C share the meal.',
  ];
  if (counted > 0) {
    const parts: string[] = [];
    if (levels.high) parts.push(`${levels.high} at 8%`);
    if (levels.medium) parts.push(`${levels.medium} at 5%`);
    if (levels.low) parts.push(`${levels.low} at 3%`);
    method.push(
      `${counted === 1 ? '1 meal' : `${counted} meals`} with iron: ${parts.join(', ')}. ${pct(eaten > 0 ? heme / eaten : 0)} of the iron was heme iron.`,
    );
  }
  method.push('The model assumes typical iron stores; the body takes up more when stores run low.');
  return { nutrient: 'iron', eaten, absorbed, share: eaten > 0 ? absorbed / eaten : 0, tier: 'moderate', method };
}

function estimateZinc(items: AbsorptionItem[]): AbsorptionEstimate {
  let eaten = 0;
  let fromPhytateRich = 0;
  for (const item of items) {
    const zinc = amount(item, 'zinc');
    eaten += zinc;
    if (isPhytateRich(item)) fromPhytateRich += zinc;
  }
  const richShare = eaten > 0 ? fromPhytateRich / eaten : 0;
  const level = phytateLevel(richShare);
  const share = ZINC_SHARE[level];
  const levelWords = { low: 'a low-phytate day', moderate: 'a moderate-phytate day', high: 'a high-phytate day' }[level];
  const method = [
    `${pct(richShare)} of the zinc came from whole grains, legumes, nuts and seeds, which reads as ${levelWords}, so zinc is taken at about ${pct(share)}.`,
    'Phytate is judged by kind of food, not measured: soaking, sprouting and fermenting lower it, and the database does not record it.',
  ];
  return { nutrient: 'zinc', eaten, absorbed: eaten * share, share: eaten > 0 ? share : 0, tier: 'weak', method };
}

export function estimateAbsorption(nutrient: AbsorptionNutrient, items: AbsorptionItem[]): AbsorptionEstimate {
  if (nutrient === 'calcium') return estimateCalcium(items);
  if (nutrient === 'iron') return estimateIron(items);
  return estimateZinc(items);
}

/** The line at the top: the estimate and the words that it is one. */
export function absorptionHeadline(estimate: AbsorptionEstimate, format: (value: number) => string): string {
  if (estimate.eaten <= 0) return 'No food logged today carried any, so there is nothing to estimate.';
  return `Estimated taken up from food: about ${format(estimate.absorbed)} of the ${format(estimate.eaten)} eaten (${pct(estimate.share)}).`;
}

const TIER_WORDS: Record<EvidenceTier, string> = {
  strong: 'Evidence: strong.',
  moderate: 'Evidence: moderate. Published absorption figures, applied to your meals; each body varies.',
  weak: 'Evidence: weak. A diet-type figure with phytate guessed from kind of food; each body varies.',
};

export function absorptionTierLine(tier: EvidenceTier): string {
  return TIER_WORDS[tier];
}

/** Said when supplements added some of the day's amount, which the estimate leaves out. */
export function absorptionNotes(supplementAmount: number, format: (value: number) => string): string[] {
  if (supplementAmount <= 0) return [];
  return [`The ${format(supplementAmount)} from supplements is left out: how much of it is taken up depends on its form and when it is taken.`];
}
