// The crop rotation note (I10, 1.0.55.24): when a planting is added to an
// area, what else from the same plant family grew in that area over the last
// three years. Pure, with no database and no React, so
// node scripts/test_crop_families.js can check it.
//
// A crop's family comes from its crop guide (lib/cropGuides.ts), matched on
// the planting's food name the same way How to grow is, and stays out of the
// database: BUILD-PLAN.md keeps crop family out of the DB. A food with no
// guide gets no note rather than a guessed family.
//
// The grouping is botanical family, which is what soil pests and diseases
// follow, rather than the RHS's five kitchen-garden groups, which put
// beetroot among the roots although it is in the amaranth family.
//
// Perennial crops (fruit, asparagus, rhubarb, the woody herbs) are left out
// on both sides, since nobody rotates an apple tree and a mint bed is meant
// to stay put.
//
// Nothing here tells anybody not to plant a crop. The note says what grew
// there and when, why gardeners rotate, and for four families the one soil
// problem the RHS names with how long it lasts. What to plant stays the
// person's call.

import { findCropGuide, type CropGuide } from './cropGuides';
import type { GuideSource } from './plantNutrients';

export const ROTATION_WINDOW_YEARS = 3;

export type RotationPlanting = {
  foodName: string;
  /** YYYY-MM-DD. */
  plantedAt: string;
  status: string;
};

export type RotationNote = {
  family: string;
  /** 'repeat' when the family grew here in the window, 'clear' when not. */
  kind: 'repeat' | 'clear';
  /** Years the family grew here, newest first. Empty when clear. */
  years: number[];
  /** The crops of this family that grew here, as their guides name them. */
  crops: string[];
  sentence: string;
  /** The soil problem this family carries, or null for families with none named. */
  carryover: string | null;
};

export const ROTATION_WHY =
  'Pests and diseases that live in the soil tend to feed on one plant family, and die back in the years that family grows somewhere else. The RHS gives three and four year rotation plans, so each group comes back to the same bed every third or fourth year.';

export const ROTATION_SOURCES: GuideSource[] = [
  { label: 'RHS: Crop rotation', url: 'https://www.rhs.org.uk/vegetables/crop-rotation' },
];

const CARRYOVER: Record<string, { text: string; source: GuideSource }> = {
  'Cabbage family': {
    text: 'Clubroot, which attacks the cabbage family and its weeds, leaves resting spores the RHS says can stay in the soil for up to 20 years. Liming an acid soil reduces it without clearing it.',
    source: { label: 'RHS: Club root', url: 'https://www.rhs.org.uk/disease/club-root' },
  },
  'Onion family': {
    text: 'Onion white rot, which attacks onions, garlic, leeks and the rest of the family, can stay in the soil for at least 15 years. The RHS says that makes rotation of little use against it once it has arrived.',
    source: { label: 'RHS: Onion white rot', url: 'https://www.rhs.org.uk/disease/onion-white-rot' },
  },
  'Nightshade family': {
    text: 'Potato cyst nematodes, which also feed on tomatoes and aubergines, leave eggs that can last up to ten years in some soils. Where they are a problem, the RHS gives five to six years between crops of this family.',
    source: { label: 'RHS: Potato cyst nematodes', url: 'https://www.rhs.org.uk/biodiversity/potato-cyst-nematodes' },
  },
  'Carrot family': {
    text: 'Carrot fly, which feeds on carrots, parsnips, parsley, celery and celeriac, spends the winter in the soil where they grew, as larvae or pupae.',
    source: { label: 'RHS: Carrot fly', url: 'https://www.rhs.org.uk/biodiversity/carrot-fly' },
  },
};

/** The crop guide for a food when it is a crop that gets rotated, or null
 *  for a food with no guide and for a perennial. */
export function rotatedCrop(foodName: string | null | undefined): CropGuide | null {
  const guide = findCropGuide(foodName);
  return guide && guide.season !== 'perennial' ? guide : null;
}

/** The first day of the window: the same date three years back. */
export function windowStart(today: string): string {
  return `${Number(today.slice(0, 4)) - ROTATION_WINDOW_YEARS}${today.slice(4)}`;
}

function familyPhrase(family: string): string {
  return `the ${family.charAt(0).toLowerCase()}${family.slice(1)}`;
}

export function joinWords(words: readonly string[]): string {
  if (words.length <= 1) return words[0] ?? '';
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

/** The note for adding foodName to an area whose plantings are given, or
 *  null when the food is not a rotated crop, or when the area has no
 *  planting in the window to say anything about. A planting still to be
 *  sown (status planned) has not been in the ground, so it is not counted. */
export function rotationNote(
  foodName: string | null | undefined,
  areaPlantings: readonly RotationPlanting[],
  today: string,
): RotationNote | null {
  const guide = rotatedCrop(foodName);
  if (!guide) return null;
  const from = windowStart(today);
  const inWindow = areaPlantings.filter(
    (planting) => planting.status !== 'planned' && planting.plantedAt >= from && planting.plantedAt <= today,
  );
  if (inWindow.length === 0) return null;
  const years = new Set<number>();
  const crops: string[] = [];
  for (const planting of inWindow) {
    const other = rotatedCrop(planting.foodName);
    if (!other || other.family !== guide.family) continue;
    years.add(Number(planting.plantedAt.slice(0, 4)));
    const name = other.name.toLowerCase();
    if (!crops.includes(name)) crops.push(name);
  }
  const family = familyPhrase(guide.family);
  const carryover = CARRYOVER[guide.family]?.text ?? null;
  if (years.size === 0) {
    return {
      family: guide.family,
      kind: 'clear',
      years: [],
      crops: [],
      sentence: `Nothing from ${family} is recorded in this area in the last ${ROTATION_WINDOW_YEARS} years.`,
      carryover,
    };
  }
  const newestFirst = [...years].sort((a, b) => b - a);
  return {
    family: guide.family,
    kind: 'repeat',
    years: newestFirst,
    crops,
    sentence: `${guide.name} ${guide.name.endsWith('s') ? 'are' : 'is'} in ${family}, which grew in this area in ${joinWords(newestFirst.map(String))}: ${joinWords(crops)}.`,
    carryover,
  };
}

/** The sources behind a note: the rotation page, and the soil problem's page
 *  where the family has one. */
export function rotationSources(family: string): GuideSource[] {
  const extra = CARRYOVER[family]?.source;
  return extra ? [...ROTATION_SOURCES, extra] : ROTATION_SOURCES;
}
