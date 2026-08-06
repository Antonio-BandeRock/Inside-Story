import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { FERMENTED_FOODS_ENTRIES } from './fermentedFoods';
import { FOOD_ADDITIVES_ENTRIES } from './foodAdditives';
import { GUT_MICROBIOME_ENTRIES } from './gutMicrobiome';
import { HEALING_STAGES_ENTRIES } from './healingStages';
import { HISTORY_ENTRIES } from './history';
import { LABS_MEDICATION_ENTRIES } from './labsMedication';
import { LIFESTYLE_ENVIRONMENT_ENTRIES } from './lifestyleEnvironment';
import { MITOCHONDRIA_METABOLISM_ENTRIES } from './mitochondriaMetabolism';
import { NUTRIENT_INTERACTIONS_ENTRIES } from './nutrientInteractions';
import { NUTRIENTS_ENTRIES } from './nutrients';
import { ORGAN_SYSTEMS_ENTRIES } from './organSystems';
import { OTHER_AUTOIMMUNE_ENTRIES } from './otherAutoimmune';
import { PROBLEM_FOODS_ENTRIES } from './problemFoods';
import type { AnyDigestEntry, DigestEntryCategory } from './types';

export * from './types';

// A living, growing version marker, same pattern as REFERENCE_DB_VERSION
// (lib/referenceDbVersion.ts) -- bump whenever real content is added or
// changed, so a future "did this actually update" check has something
// concrete to compare, the same way the reference database's own version
// check already works. Format matches that file's own convention
// (YYYYMMDDHHMMSS, the moment this content was last meaningfully changed).
export const PURPLE_DIGEST_VERSION = '20260807120000';

// Every category's own real content array, aggregated into one flat list.
// ProblemFoodEntry is included in the SAME flat list as DigestEntry (via
// AnyDigestEntry) -- category-specific screens tell the two apart with
// isProblemFoodEntry (types.ts) rather than the aggregator needing two
// parallel lists.
export const ALL_DIGEST_ENTRIES: AnyDigestEntry[] = [
  ...FOOD_ADDITIVES_ENTRIES,
  ...FERMENTED_FOODS_ENTRIES,
  ...PROBLEM_FOODS_ENTRIES,
  ...GUT_MICROBIOME_ENTRIES,
  ...NUTRIENTS_ENTRIES,
  ...LABS_MEDICATION_ENTRIES,
  ...LIFESTYLE_ENVIRONMENT_ENTRIES,
  ...MITOCHONDRIA_METABOLISM_ENTRIES,
  ...OTHER_AUTOIMMUNE_ENTRIES,
  ...HEALING_STAGES_ENTRIES,
  ...ORGAN_SYSTEMS_ENTRIES,
  ...HISTORY_ENTRIES,
  ...NUTRIENT_INTERACTIONS_ENTRIES,
];

export type DigestCategoryKey = DigestEntryCategory | 'problemFoods';

// One row per LensHub option -- label/icon/description for each of the
// nine real categories, in the fixed order the picker shows them. Order
// here IS the order LensHub's own grid renders in (options.map, no
// separate sort) -- Food Additives first, matching this session's own
// build sequencing (it was populated first, being the most consumer-
// legible), Problem Foods & Swaps placed centrally rather than at the very
// end, since it's the one category explicitly meant to feel like a
// practical, everyday-use entry point rather than reference reading.
export const DIGEST_CATEGORY_META: {
  key: DigestCategoryKey;
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  description: string;
}[] = [
  {
    key: 'foodAdditives',
    label: 'Food Additives',
    icon: 'flask-outline',
    description: 'Real dose and mechanism specifics for the additives that actually matter -- and a few that don\'t.',
  },
  {
    key: 'problemFoods',
    label: 'Problem Foods & Swaps',
    icon: 'swap-horizontal-outline',
    description: 'Why a food is a problem, the real mechanism behind it, and real, concrete substitutes.',
  },
  {
    key: 'gutMicrobiome',
    label: 'Gut & Microbiome',
    icon: 'git-network-outline',
    description: 'The mechanisms this app\'s own gut-healing mission keeps coming back to -- SCFAs, zonulin, and real repair evidence.',
  },
  {
    key: 'fermentedFoods',
    label: 'Fermented Foods',
    icon: 'beaker-outline',
    description: 'Verified bacterial strains, real dosing science, and how to source starters that actually work.',
  },
  {
    key: 'nutrients',
    label: 'Nutrients & Micronutrients',
    icon: 'nutrition-outline',
    description: 'Selenium, iodine, vitamin D, and the rest -- each tiered honestly by its own real trial evidence.',
  },
  {
    key: 'labsMedication',
    label: 'Labs & Medication Timing',
    icon: 'medkit-outline',
    description: 'What actually interferes with a thyroid lab result or a levothyroxine dose -- and the real fix for each.',
  },
  {
    key: 'lifestyleEnvironment',
    label: 'Lifestyle & Environment',
    icon: 'earth-outline',
    description: 'Alcohol, coffee, sleep, stress, and real environmental exposures -- beyond what\'s on the plate.',
  },
  {
    key: 'mitochondriaMetabolism',
    label: 'Mitochondria & Metabolism',
    icon: 'flame-outline',
    description: 'Autophagy, visceral fat, and exercise -- real cellular-level mechanisms, including two genuine tensions worth knowing.',
  },
  {
    key: 'otherAutoimmune',
    label: 'Other Autoimmune Diseases',
    icon: 'shield-outline',
    description: 'Real corroborating research from other autoimmune diseases -- each one clearly labeled as exactly that, not Hashimoto\'s data.',
  },
  // 2026-08-07: four categories added in direct response to "this area
  // MUST include everything at all worth knowing" -- placed after the
  // original nine rather than interleaved, so the original build order
  // (and anyone's own muscle memory of where things are) stays intact.
  {
    key: 'healingStages',
    label: 'Healing Stages',
    icon: 'footsteps-outline',
    description: 'What to actually eat at each stage of the healing journey -- real foods, real timelines, real milestones to graduate by.',
  },
  {
    key: 'organSystems',
    label: 'Organs & Body Systems',
    icon: 'body-outline',
    description: 'How Hashimoto\'s reaches beyond the thyroid -- the liver, heart, brain, kidneys, and more -- and how treating them helps back.',
  },
  {
    key: 'history',
    label: 'History & Milestones',
    icon: 'time-outline',
    description: 'From the 1912 discovery to today\'s genetics -- the real, dated turning points behind everything else in this app.',
  },
  {
    key: 'nutrientInteractions',
    label: 'Nutrient Interactions',
    icon: 'link-outline',
    description: 'Which nutrients help each other absorb, which ones compete -- and the real food-level moves that work with either.',
  },
];

export function getEntriesForCategory(category: DigestCategoryKey): AnyDigestEntry[] {
  return ALL_DIGEST_ENTRIES.filter((entry) => entry.category === category);
}

export function findDigestEntryById(id: string): AnyDigestEntry | undefined {
  return ALL_DIGEST_ENTRIES.find((entry) => entry.id === id);
}

export function findDigestEntriesByIds(ids: string[]): AnyDigestEntry[] {
  return ids
    .map((id) => findDigestEntryById(id))
    .filter((entry): entry is AnyDigestEntry => entry != null);
}
