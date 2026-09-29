// What is wrong with this plant (I25, 2026-09-29), under each planting in
// Garden > Plots & Plantings.
//
// The build plan named a paid diagnosis service or a vision model. Both
// fail the standing rule that nothing in the app may cost a subscription or
// a charge, and both answer from a photo alone. So the app narrows the
// question the way a grower does, from what is already in it: the three
// problems that crop is known for (lib/cropProblems.ts), then where the
// trouble shows first, which picks out the nutrients that show there
// (lib/plantNutrients.ts) and the things that look like a shortage and are
// not (NUTRIENT_LOOK_ALIKES). When none of that matches, it hands off to
// the free Google Lens app, the same way What Plant Is This does
// (lib/plantIdentify.ts), and to the people in WHERE_TO_ASK who answer
// gardening questions for free.
//
// Every list here is the likeliest causes, never a diagnosis, and the
// words say so. What the person decides it looked like can be written down
// as a Something wrong seen entry on the planting (I14), in their words.
//
// Pure: no React and no database, so scripts/test_plant_trouble.js can
// check it directly.

import type { PlantNutrientKey } from './plantNutrients';

export type TroubleWhere = 'older' | 'newer' | 'spots' | 'fruit' | 'whole';

export const TROUBLE_WHERE_OPTIONS: { value: TroubleWhere; label: string }[] = [
  { value: 'older', label: 'The older, lower leaves' },
  { value: 'newer', label: 'The newest leaves and the tips' },
  { value: 'spots', label: 'Spots, patches or mottling on the leaves' },
  { value: 'fruit', label: 'The fruit, the flowers or the roots' },
  { value: 'whole', label: 'The whole plant wilts, stalls or stays small' },
];

type TroubleSet = { nutrients: PlantNutrientKey[]; lookAlikes: string[] };

// Headings must match NUTRIENT_LOOK_ALIKES in lib/plantNutrients.ts, and
// each nutrient is listed where its own `looks` says it shows; the test
// checks both.
const BY_WHERE: Record<TroubleWhere, TroubleSet> = {
  older: {
    nutrients: ['N', 'P', 'K', 'Mg', 'Mo'],
    lookAlikes: ['Old leaves doing what old leaves do', 'Too dry or too wet', 'Cold'],
  },
  newer: {
    nutrients: ['S', 'Fe', 'Mn', 'Zn', 'B', 'Cu'],
    lookAlikes: ['Weedkiller drift', 'Too dry or too wet'],
  },
  spots: {
    nutrients: ['Mn', 'Mg'],
    lookAlikes: ['Virus', 'Too much feed'],
  },
  fruit: {
    nutrients: ['Ca', 'B', 'K'],
    lookAlikes: ['Too dry or too wet', 'Damaged roots'],
  },
  whole: {
    nutrients: ['N', 'P'],
    lookAlikes: ['Too dry or too wet', 'Damaged roots', 'Cold', 'Too much feed'],
  },
};

export function troubleFor(where: TroubleWhere): TroubleSet {
  return BY_WHERE[where];
}

export function troubleWhereLabel(where: TroubleWhere): string {
  return TROUBLE_WHERE_OPTIONS.find((option) => option.value === where)?.label ?? '';
}

/** The planting entry's code (lib/growSetup.ts PLANTING_EVENT_KINDS). */
export const TROUBLE_EVENT_KIND = 'problem_seen';

/** The note written on the planting when the person says it looked like
 *  one of the problems listed. */
export function troubleNote(label: string): string {
  return `Looked like ${label.trim().replace(/\.$/, '')}.`;
}

export const TROUBLE_INTRO =
  'Start with what this crop is known for, then pick where the trouble shows first, since that alone rules out half the list.';

export const TROUBLE_NO_CROP_INTRO =
  'There is no crop guide for this plant yet. Pick where the trouble shows first, since that alone rules out half the list.';

export const TROUBLE_CAUTION =
  'These are the likeliest causes, not a diagnosis. Check the soil a finger deep before anything else, since too dry and too wet copy most shortages.';

export const TROUBLE_LENS_INTRO =
  'Nothing here matches? Google Lens can suggest what a spot, a pest or a mould is from a photo. It is free, and it opens in the Google Lens app. Its answer is a likely match, so read the page it points to before acting on it.';

export const TROUBLE_ASK_INTRO = 'People who answer gardening questions for free, with a photo of the plant:';
