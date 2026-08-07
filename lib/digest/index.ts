import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { BIG_PICTURE_ENTRIES } from './bigPicture';
import { FERMENTED_FOODS_ENTRIES } from './fermentedFoods';
import { FOOD_ADDITIVES_ENTRIES } from './foodAdditives';
import { FOOD_INDUSTRY_HISTORY_ENTRIES } from './foodIndustryHistory';
import { GLOSSARY_ENTRIES } from './glossary';
import { GUT_MICROBIOME_ENTRIES } from './gutMicrobiome';
import { HEALING_STAGES_ENTRIES } from './healingStages';
import { HISTORY_ENTRIES } from './history';
import { LABS_MEDICATION_ENTRIES } from './labsMedication';
import { LIFESTYLE_ENVIRONMENT_ENTRIES } from './lifestyleEnvironment';
import { MITOCHONDRIA_METABOLISM_ENTRIES } from './mitochondriaMetabolism';
import { NUTRIENT_INTERACTIONS_ENTRIES } from './nutrientInteractions';
import { NUTRIENTS_ENTRIES } from './nutrients';
import { COMPLEMENTARY_THERAPIES_ENTRIES } from './complementaryTherapies';
import { ORGAN_SYSTEMS_ENTRIES } from './organSystems';
import { OTHER_AUTOIMMUNE_ENTRIES } from './otherAutoimmune';
import { PREGNANCY_FAMILY_PLANNING_ENTRIES } from './pregnancyFamilyPlanning';
import { PROBLEM_FOODS_ENTRIES } from './problemFoods';
import { RHEUMATOID_ARTHRITIS_ENTRIES } from './rheumatoidArthritis';
import { SELF_ADVOCACY_ENTRIES } from './selfAdvocacy';
import { isProblemFoodEntry, type AnyDigestEntry, type DigestEntryCategory } from './types';

export * from './types';

// A living, growing version marker, same pattern as REFERENCE_DB_VERSION
// (lib/referenceDbVersion.ts) -- bump whenever real content is added or
// changed, so a future "did this actually update" check has something
// concrete to compare, the same way the reference database's own version
// check already works. Format matches that file's own convention
// (YYYYMMDDHHMMSS, the moment this content was last meaningfully changed).
export const PURPLE_DIGEST_VERSION = '20260808020000';

// Every category's own real content array, aggregated into one flat list.
// ProblemFoodEntry is included in the SAME flat list as DigestEntry (via
// AnyDigestEntry) -- category-specific screens tell the two apart with
// isProblemFoodEntry (types.ts) rather than the aggregator needing two
// parallel lists.
export const ALL_DIGEST_ENTRIES: AnyDigestEntry[] = [
  ...GLOSSARY_ENTRIES,
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
  ...FOOD_INDUSTRY_HISTORY_ENTRIES,
  ...BIG_PICTURE_ENTRIES,
  ...SELF_ADVOCACY_ENTRIES,
  ...PREGNANCY_FAMILY_PLANNING_ENTRIES,
  ...COMPLEMENTARY_THERAPIES_ENTRIES,
  ...RHEUMATOID_ARTHRITIS_ENTRIES,
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
  // 2026-08-07, same day, seventh addition: Glossary, placed FIRST -- a
  // deliberate, explicit exception to this array's own established
  // "append, never reorder" practice for every category before it (see the
  // healingStages/organSystems/history/nutrientInteractions block below,
  // and foodIndustryHistory/bigPicture after that, all appended in place).
  // The request here was specific about position, not just content: "It
  // might be a good idea to make it the first one at the top left." A
  // glossary is also genuinely the right thing to put first on the merits,
  // not just per instruction -- it's the one category meant to be reached
  // for constantly while reading any of the other fourteen, not read start
  // to finish on its own.
  {
    key: 'glossary',
    label: 'Glossary',
    icon: 'reader-outline',
    description: 'Every acronym and term used across this Digest, defined plainly: what it is, what it does in the body, and how it connects to Hashimoto\'s.',
  },
  {
    key: 'foodAdditives',
    label: 'Food Additives',
    icon: 'flask-outline',
    description: 'Dose and mechanism specifics for the additives that actually matter, and a few that don\'t.',
  },
  {
    key: 'problemFoods',
    label: 'Problem Foods & Swaps',
    icon: 'swap-horizontal-outline',
    description: 'Why a food is a problem, the mechanism behind it, and concrete substitutes.',
  },
  {
    key: 'gutMicrobiome',
    label: 'Gut & Microbiome',
    icon: 'git-network-outline',
    description: 'The mechanisms this app\'s own gut-healing mission keeps coming back to: SCFAs, zonulin, and repair evidence.',
  },
  {
    key: 'fermentedFoods',
    label: 'Fermented Foods',
    icon: 'beaker-outline',
    description: 'Verified bacterial strains, dosing science, and how to source starters that actually work.',
  },
  {
    key: 'nutrients',
    label: 'Nutrients & Micronutrients',
    icon: 'nutrition-outline',
    description: 'Selenium, iodine, vitamin D, and the rest, each tiered honestly by its own trial evidence.',
  },
  {
    key: 'labsMedication',
    label: 'Labs & Medication Timing',
    icon: 'medkit-outline',
    description: 'What actually interferes with a thyroid lab result or a levothyroxine dose, and the fix for each.',
  },
  {
    key: 'lifestyleEnvironment',
    label: 'Lifestyle & Environment',
    icon: 'earth-outline',
    description: 'Alcohol, coffee, sleep, stress, and environmental exposures, beyond what\'s on the plate.',
  },
  {
    key: 'mitochondriaMetabolism',
    label: 'Mitochondria & Metabolism',
    icon: 'flame-outline',
    description: 'Autophagy, visceral fat, and exercise: cellular-level mechanisms, including two genuine tensions worth knowing.',
  },
  {
    key: 'otherAutoimmune',
    label: 'Other Autoimmune Diseases',
    icon: 'shield-outline',
    description: 'Corroborating research from other autoimmune diseases, each one clearly labeled as exactly that, not Hashimoto\'s data.',
  },
  // 2026-08-07: four categories added in direct response to "this area
  // MUST include everything at all worth knowing" -- placed after the
  // original nine rather than interleaved, so the original build order
  // (and anyone's own muscle memory of where things are) stays intact.
  {
    key: 'healingStages',
    label: 'Healing Stages',
    icon: 'footsteps-outline',
    description: 'What to actually eat at each stage of the healing journey: foods, timelines, and milestones to graduate by.',
  },
  {
    key: 'organSystems',
    label: 'Organs & Body Systems',
    icon: 'body-outline',
    description: 'How Hashimoto\'s reaches beyond the thyroid, into the liver, heart, brain, and kidneys, and how treating them helps back.',
  },
  {
    key: 'history',
    label: 'History & Milestones',
    icon: 'time-outline',
    description: 'From the 1912 discovery to today\'s genetics: the dated turning points behind everything else in this app.',
  },
  {
    key: 'nutrientInteractions',
    label: 'Nutrient Interactions',
    icon: 'link-outline',
    description: 'Which nutrients help each other absorb, which ones compete, and the food-level moves that work with either.',
  },
  // 2026-08-07, same day, fifth addition: folds in the standalone "What
  // Happened to Food" research Artifact -- the correlational history of
  // food industrialization, soil decline, pesticides, and the four
  // wrongly-blamed whole foods -- as a real category, not an external link.
  {
    key: 'foodIndustryHistory',
    label: 'Food Industry & History',
    icon: 'trending-up-outline',
    description: 'How food itself changed over 150 years, against how autoimmune disease rose: the trends, the mechanisms, and a stated opinion open for debate.',
  },
  // 2026-08-07, same day, sixth addition: the cross-category short story --
  // see bigPicture.ts's own header comment and types.ts's own comment on
  // this key for the full reasoning. Placed last, matching this file's own
  // established practice of appending new categories rather than
  // reordering existing ones -- but genuinely readable at any point, not
  // just after every other category.
  {
    key: 'bigPicture',
    label: 'The Big Picture',
    icon: 'book-outline',
    description: 'One short story, one illustrative day, touching every other category in this Digest, a way to see how it all actually connects.',
  },
  // 2026-08-07, same day, eighth addition: Self Advocacy -- appended
  // normally, unlike Glossary's own explicit front-placement exception.
  // See selfAdvocacy.ts's own header comment for the full reasoning.
  {
    key: 'selfAdvocacy',
    label: 'Self Advocacy',
    icon: 'megaphone-outline',
    description: 'Which lab tests to actually ask for, why each one matters for Hashimoto\'s, and how often retesting is signal rather than noise.',
  },
  // 2026-08-07, same day, ninth addition: Pregnancy & Family Planning --
  // appended normally. See pregnancyFamilyPlanning.ts's own header comment.
  {
    key: 'pregnancyFamilyPlanning',
    label: 'Pregnancy & Family Planning',
    icon: 'flower-outline',
    description: 'What actually changes about managing Hashimoto\'s during pregnancy and after: TSH targets, postpartum thyroiditis, breastfeeding, and iodine needs.',
  },
  // 2026-08-07, same day, tenth addition: Complementary & Manual Therapies.
  // See complementaryTherapies.ts's own header comment.
  {
    key: 'complementaryTherapies',
    label: 'Complementary & Manual Therapies',
    icon: 'hand-left-outline',
    description: 'Chiropractic, acupuncture, massage, and heat/cold therapy, checked honestly against the evidence, including a null result and a contested claim, not just the encouraging findings.',
  },
  // 2026-08-08, eleventh addition, and the first genuinely new condition
  // this app has ever built out: Rheumatoid Arthritis. See
  // rheumatoidArthritis.ts's own header comment for the full reasoning.
  // Appended normally, matching every category's own standing practice
  // apart from Glossary's explicit front-placement exception.
  {
    key: 'rheumatoidArthritis',
    label: 'Rheumatoid Arthritis',
    icon: 'pulse-outline',
    description: 'Real food and medication guidance for RA on its own terms, including the most common real overlap with Hashimoto\'s of any two conditions in the research.',
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

// 2026-08-08, explicitly requested: "a way to search for things the person
// wants to read about in the Digest... draw from the entire list of all the
// available information." Every category's own list stays scoped to just
// that category (unchanged) -- this is a separate, cross-category search
// over ALL_DIGEST_ENTRIES at once, the same shape as Insights' own Food
// Lookup searching the whole reference database regardless of which
// category a food happens to sit in.
//
// A plain, in-memory, every-term-must-match-somewhere substring search --
// no SQL involved (this content lives in TS arrays, not the SQLite
// reference database), and with only a few hundred entries total, no
// indexing or debouncing is needed for this to feel instant. Matches
// against everything a person would actually recognize a topic by: the
// title/food name and one-line teaser (what shows on the collapsed card),
// the full summary/problem/mechanism/swaps text (so a search for a specific
// mechanism like "zonulin" or "deiodinase" finds entries that discuss it
// without naming it in the title), and each citation's own source text (so
// a remembered author/journal name works too).
function digestSearchHaystack(entry: AnyDigestEntry): string {
  const citationText = entry.citations.map((citation) => citation.source).join(' ');
  if (isProblemFoodEntry(entry)) {
    return [entry.foodName, entry.teaser, entry.problem, entry.mechanism, entry.swaps.join(' '), citationText]
      .join(' ')
      .toLowerCase();
  }
  return [entry.title, entry.teaser, entry.summary, citationText].join(' ').toLowerCase();
}

export function searchDigestEntries(query: string, limit = 60): AnyDigestEntry[] {
  const terms = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (terms.length === 0) return [];

  const matches: AnyDigestEntry[] = [];
  for (const entry of ALL_DIGEST_ENTRIES) {
    const haystack = digestSearchHaystack(entry);
    if (terms.every((term) => haystack.includes(term))) {
      matches.push(entry);
      if (matches.length >= limit) break;
    }
  }
  return matches;
}
