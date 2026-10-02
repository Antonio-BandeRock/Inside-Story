// Companion planting (I7, 2026-10-02): which plants gardeners and trials
// say grow well beside one another, and which they keep apart. Pure, with no
// database and no React, so node scripts/test_companion_pairs.js can check
// it.
//
// Every pair carries an evidence tier, because most companion planting
// advice is tradition nobody has tested, a little of it is extension advice
// from what growers have seen, and a few pairings have been measured in a
// field or glasshouse trial. The tier is said beside the pair every time it
// is shown, so a tradition never reads like a finding.
//
// It is a caption, never a block. Nothing here stops a planting being saved,
// hides a crop, or reorders anything. It says what is said about two plants
// growing near each other, and leaves the choice with the person.
//
// A plant is a crop guide (lib/cropGuides.ts), matched on a planting's food
// name the way How to grow is, or one of the three flowers below, matched on
// words in its name. A food with neither gets no note rather than a guess.

import { findCropGuide, findCropGuideByKey } from './cropGuides';
import type { GuideSource } from './plantNutrients';

export type CompanionTier = 'trial' | 'extension' | 'tradition';
export type CompanionRelation = 'together' | 'apart';

export type CompanionPair = {
  a: string;
  b: string;
  relation: CompanionRelation;
  tier: CompanionTier;
  why: string;
  sources: GuideSource[];
};

/** One side of a pair as seen from the other: the plant beside it and what is said. */
export type CompanionNote = {
  key: string;
  name: string;
  relation: CompanionRelation;
  tier: CompanionTier;
  why: string;
  sources: GuideSource[];
};

type Flower = { key: string; name: string; words: string[] };

/** Flowers named by a source with a measured effect. They have no crop guide,
 *  so they are matched on words in a planting's name. */
export const COMPANION_FLOWERS: Flower[] = [
  { key: 'frenchmarigold', name: 'French marigold', words: ['marigold', 'tagetes'] },
  { key: 'nasturtium', name: 'Nasturtium', words: ['nasturtium', 'tropaeolum'] },
  { key: 'sweetalyssum', name: 'Sweet alyssum', words: ['alyssum', 'lobularia'] },
];

const GROWPERMA: GuideSource = {
  label: 'GrowPerma: The science of companion planting',
  url: 'https://growperma.com/blog/the-science-of-companion-planting-what-actually-works',
};
const UF_IFAS: GuideSource = {
  label: 'UF/IFAS Extension: Companion planting to reduce insecticide use',
  url: 'https://blogs.ifas.ufl.edu/duvalco/2026/03/02/companion-planting-can-help-reduce-or-eliminate-insecticide-use-in-the-garden/',
};
const WVU: GuideSource = {
  label: 'WVU Extension: Companion planting',
  url: 'https://extension.wvu.edu/lawn-gardening-pests/news/2021/07/01/companion-planting',
};
const CONBOY_2019: GuideSource = {
  label: 'Conboy et al. 2019, PLOS ONE: French marigolds protect tomatoes from glasshouse whitefly',
  url: 'https://doi.org/10.1371/journal.pone.0213071',
};
const UVAH_COAKER_1984: GuideSource = {
  label: 'Uvah and Coaker 1984, Entomologia Experimentalis et Applicata: mixed cropping of carrots and onions',
  url: 'https://doi.org/10.1111/j.1570-7458.1984.tb03422.x',
};
const FINCH_COLLIER_2000: GuideSource = {
  label: 'Finch and Collier 2000, Entomologia Experimentalis et Applicata: appropriate and inappropriate landings',
  url: 'https://doi.org/10.1046/j.1570-7458.2000.00684.x',
};
const RHS_BLIGHT: GuideSource = { label: 'RHS: Potato and tomato blight', url: 'https://www.rhs.org.uk/disease/potato-blight' };

const THREE_SISTERS =
  'Two of the Three Sisters. Corn gives climbing beans a stalk to climb, squash leaves shade the soil, and the three root at different depths. Grown together they gave a land equivalent ratio of 1.2 to 1.4, the harvest that would otherwise take 20 to 40% more ground. Only 2 to 8% of the nitrogen beans fix reaches their neighbours in the same season; most of it comes later, as the bean plants break down.';

const ALLIUM_LEGUME =
  'Listed by WVU Extension as a pair to keep apart, saying onions, garlic and shallots hinder the growth of beans and peas. No reason or trial is given.';

const WVU_TOGETHER = 'Listed by WVU Extension as growing well together. No reason or trial is given.';

const ALLIUMS = ['onion', 'garlic', 'shallot', 'leek'];
const LEGUMES = ['peas', 'greenbeans', 'runnerbeans', 'broadbeans', 'drybeans'];

export const COMPANION_PAIRS: CompanionPair[] = [
  ...['greenbeans', 'runnerbeans', 'drybeans', 'squash'].map(
    (other): CompanionPair => ({ a: 'sweetcorn', b: other, relation: 'together', tier: 'trial', why: THREE_SISTERS, sources: [GROWPERMA] }),
  ),
  {
    a: 'carrot',
    b: 'onion',
    relation: 'together',
    tier: 'trial',
    why: 'In a field trial, carrots grown among onions had less carrot fly damage than carrots grown alone, and the onions less onion thrips. It worked while the onions were young and leafy, more with more onions to each carrot, and hardly at all once the onions began to bulb. The onion scent seems to confuse the fly looking for carrots.',
    sources: [UVAH_COAKER_1984],
  },
  {
    a: 'tomato',
    b: 'frenchmarigold',
    relation: 'together',
    tier: 'trial',
    why: 'In a glasshouse trial, French marigolds grown among tomatoes from the start held glasshouse whitefly numbers down, through limonene given off by the flowers. Brought in once the tomatoes were already heavily infested, they did little. Outdoors, field trials found no difference in pest numbers from marigolds above ground; as a crop grown before another, their roots reduced soil nematodes.',
    sources: [CONBOY_2019, GROWPERMA],
  },
  {
    a: 'squash',
    b: 'courgette',
    relation: 'together',
    tier: 'trial',
    why: 'Blue Hubbard squash, grown round the edge of a bed and sown a couple of weeks ahead, is used as a trap crop: squash bugs and squash vine borers go to it rather than to courgettes and summer squash. Replicated trials found 30 to 50% less infestation on the main crop. This is the Blue Hubbard variety in particular.',
    sources: [UF_IFAS, GROWPERMA],
  },
  {
    a: 'aubergine',
    b: 'radish',
    relation: 'together',
    tier: 'extension',
    why: 'UF/IFAS Extension says radishes dotted through an aubergine bed trap the flea beetles that would otherwise feed on the aubergines.',
    sources: [UF_IFAS],
  },
  {
    a: 'tomato',
    b: 'potato',
    relation: 'apart',
    tier: 'extension',
    why: 'Both are hosts of late blight, so an infection on one can spread to the other. The spores travel on the wind, so distance within one garden narrows this only a little.',
    sources: [RHS_BLIGHT, WVU],
  },
  {
    a: 'tomato',
    b: 'sweetcorn',
    relation: 'apart',
    tier: 'extension',
    why: 'WVU Extension says the same caterpillar feeds on both, the corn earworm, which is also called the tomato fruitworm.',
    sources: [WVU],
  },
  {
    a: 'tomato',
    b: 'basil',
    relation: 'together',
    tier: 'tradition',
    why: 'Said to improve the flavour of tomatoes. No controlled trial has shown basil growing nearby changes what is in the fruit.',
    sources: [GROWPERMA],
  },
  {
    a: 'tomato',
    b: 'carrot',
    relation: 'together',
    tier: 'tradition',
    why: 'Often listed as a pair that grows well together. GrowPerma finds no scientific support for it.',
    sources: [GROWPERMA, WVU],
  },
  ...['asparagus', 'celery', 'cucumber', 'lettuce', 'onion', 'parsley', 'pepper'].map(
    (other): CompanionPair => ({ a: 'tomato', b: other, relation: 'together', tier: 'tradition', why: WVU_TOGETHER, sources: [WVU] }),
  ),
  ...['greenbeans', 'cabbage', 'sweetcorn', 'aubergine', 'peas'].map(
    (other): CompanionPair => ({ a: 'potato', b: other, relation: 'together', tier: 'tradition', why: WVU_TOGETHER, sources: [WVU] }),
  ),
  ...ALLIUMS.flatMap((allium) =>
    LEGUMES.map((legume): CompanionPair => ({ a: allium, b: legume, relation: 'apart', tier: 'tradition', why: ALLIUM_LEGUME, sources: [WVU] })),
  ),
  {
    a: 'dill',
    b: 'carrot',
    relation: 'apart',
    tier: 'tradition',
    why: 'Listed by WVU Extension as a pair to keep apart. They are in the same family and can cross if both flower. No trial is given.',
    sources: [WVU],
  },
  {
    a: 'sage',
    b: 'cucumber',
    relation: 'apart',
    tier: 'tradition',
    why: 'Listed by WVU Extension as a pair to keep apart. No reason or trial is given.',
    sources: [WVU],
  },
  {
    a: 'greenbeans',
    b: 'beetroot',
    relation: 'apart',
    tier: 'tradition',
    why: 'Listed by WVU Extension as a pair to keep apart, for climbing beans and beetroot. No reason or trial is given.',
    sources: [WVU],
  },
];

/** What is said about a whole family rather than one pair. */
const FAMILY_NOTES: Record<string, { tier: CompanionTier; text: string; sources: GuideSource[] }> = {
  'Cabbage family': {
    tier: 'trial',
    text: 'Pests of the cabbage family, such as cabbage root fly, need several landings on the right plant before they lay. Surrounded by other plants they land on the wrong ones, and in one study 7% laid eggs on plants among companions against 36% on the same plant in bare soil. Which neighbour matters less than there being one.',
    sources: [FINCH_COLLIER_2000, UF_IFAS],
  },
};

/** Said under every crop's list: flowers that bring the insects that eat pests. */
export const COMPANION_FLOWERS_NOTE =
  'Flowers among vegetables bring the insects that eat pests. Sweet alyssum went with 50 to 70% fewer aphids in trials, nasturtiums are used as a trap crop for aphids, and dill, fennel and milkweed feed ladybirds.';
export const COMPANION_FLOWERS_SOURCES: GuideSource[] = [GROWPERMA, UF_IFAS];

export const COMPANION_INTRO =
  'What trials, extension services and gardeners say about growing this beside other plants. Each says how far it has been tested. It is there to help choose, and nothing here stops a planting.';

export const COMPANION_NONE = 'Nothing is recorded about growing this beside other plants.';

const TIER_LABEL: Record<CompanionTier, string> = {
  trial: 'Tested in a trial',
  extension: 'Advised by an extension service',
  tradition: "Gardeners' tradition, not tested",
};
const TIER_ORDER: Record<CompanionTier, number> = { trial: 0, extension: 1, tradition: 2 };

export function describeTier(tier: CompanionTier): string {
  return TIER_LABEL[tier];
}

export function describeRelation(relation: CompanionRelation): string {
  return relation === 'together' ? 'Grown beside it' : 'Kept apart from it';
}

/** The plant key for a planting's food name: a crop guide's key, a flower's
 *  key, or null. */
export function companionPlantFor(foodName: string | null | undefined): string | null {
  const guide = findCropGuide(foodName);
  if (guide) return guide.key;
  const name = (foodName ?? '').toLowerCase();
  if (!name) return null;
  const flower = COMPANION_FLOWERS.find((f) => f.words.some((word) => name.includes(word)));
  return flower ? flower.key : null;
}

export function plantName(key: string): string {
  return findCropGuideByKey(key)?.name ?? COMPANION_FLOWERS.find((f) => f.key === key)?.name ?? key;
}

/** Every pair naming this plant, seen from it: trials first, then extension
 *  advice, then tradition, and within a tier by the other plant's name. */
export function companionsFor(key: string | null): CompanionNote[] {
  if (!key) return [];
  const notes: CompanionNote[] = [];
  for (const pair of COMPANION_PAIRS) {
    const other = pair.a === key ? pair.b : pair.b === key ? pair.a : null;
    if (!other) continue;
    notes.push({ key: other, name: plantName(other), relation: pair.relation, tier: pair.tier, why: pair.why, sources: pair.sources });
  }
  return notes.sort((x, y) => TIER_ORDER[x.tier] - TIER_ORDER[y.tier] || x.name.localeCompare(y.name));
}

/** The family-wide note for this plant, or null. */
export function familyCompanionNote(key: string | null): { tier: CompanionTier; text: string; sources: GuideSource[] } | null {
  const family = findCropGuideByKey(key)?.family;
  return family ? FAMILY_NOTES[family] ?? null : null;
}

export type CompanionPlanting = { id?: string; foodName: string; status: string };

/** A planting is in the ground, or about to be, while it is to sow or growing. */
export function plantingIsCurrent(status: string): boolean {
  return status === 'growing' || status === 'planned';
}

/** The pairs between this food and the plantings now in the same area, one
 *  per other plant, leaving out the planting itself (by id) and plantings
 *  that are harvested, pulled out or failed. */
export function neighbourNotes(
  foodName: string | null | undefined,
  areaPlantings: readonly CompanionPlanting[],
  selfId?: string,
): CompanionNote[] {
  const key = companionPlantFor(foodName);
  if (!key) return [];
  const here = new Set<string>();
  for (const planting of areaPlantings) {
    if (selfId && planting.id === selfId) continue;
    if (!plantingIsCurrent(planting.status)) continue;
    const other = companionPlantFor(planting.foodName);
    if (other) here.add(other);
  }
  return companionsFor(key).filter((note) => here.has(note.key));
}

/** One line for a neighbour: "Potato: kept apart from it. Advised by an extension service." */
export function describeNeighbour(note: CompanionNote): string {
  const relation = describeRelation(note.relation);
  return `${note.name}: ${relation.charAt(0).toLowerCase()}${relation.slice(1)}. ${describeTier(note.tier)}.`;
}
