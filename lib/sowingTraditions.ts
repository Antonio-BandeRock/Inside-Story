// Planting by tradition (I5, 1.0.55.20): the ways people have timed sowing
// by the moon, the stars, the sun's turning points, the saints' days and
// the plants around them, told the way their keepers tell them, each with
// what research has found. By direct request, 2026-09-28: "let's include
// things the Amish and others do using moon phases, equinox, and solstice
// as timing."
//
// The standing rule for this module is the living-with-nature principle in
// CLAUDE.md: every tradition is described fairly and never mocked, and the
// evidence line under each says plainly what trials have and have not
// found. Nothing here tells anyone to plant on a given day; the frost dates
// and the soil do that, and a tradition is something a person may choose
// to keep beside them.
//
// Pure, with no fetch and no database. The astronomy is in lib/moonSky.ts.

import type { CropGuide } from './cropGuides';
import type { GuideSource } from './plantNutrients';
import { moonPhasesBetween, moonSignSpans, SIGN_CLASS, type MoonPhaseKey, type ZodiacSign } from './moonSky';

// ---------------------------------------------------------------------------
// The moon's quarters, the way the almanacs assign crops to them
// ---------------------------------------------------------------------------

/** Which quarter of the moon the almanac tradition gives a crop:
 *  leafy crops that seed outside a fruit in the first, crops that seed
 *  inside a fruit in the second, and roots, bulbs, perennials and trees in
 *  the third. The fourth is kept for weeding, turning the soil and harvest. */
export type MoonCropKind = 'leafy' | 'fruiting' | 'root';

export const MOON_KIND_QUARTER: Record<MoonCropKind, 1 | 2 | 3> = { leafy: 1, fruiting: 2, root: 3 };

export const MOON_KIND_LABELS: Record<MoonCropKind, string> = {
  leafy: 'leafy crops and grains, sown from the new moon to the first quarter',
  fruiting: 'crops that carry their seed inside a fruit or pod, sown from the first quarter to the full moon',
  root: 'roots, bulbs, perennials and trees, planted from the full moon to the last quarter',
};

export const QUARTER_LABELS: Record<1 | 2 | 3 | 4, string> = {
  1: 'First quarter (new moon to first quarter, waxing)',
  2: 'Second quarter (first quarter to full moon, waxing)',
  3: 'Third quarter (full moon to last quarter, waning)',
  4: 'Fourth quarter (last quarter to new moon, waning)',
};

export const QUARTER_WORK: Record<1 | 2 | 3 | 4, string> = {
  1: 'Leafy crops and grains.',
  2: 'Crops that carry seed inside a fruit or pod.',
  3: 'Roots, bulbs, perennials and trees.',
  4: 'No sowing: weeding, turning the soil, clearing and harvest.',
};

const FRUITING = new Set([
  'tomato', 'pepper', 'aubergine', 'cucumber', 'courgette', 'squash', 'melon', 'peas', 'greenbeans', 'runnerbeans',
  'broadbeans', 'okra', 'roselle', 'pigeonpea', 'chayote',
]);
const ROOT = new Set([
  'potato', 'carrot', 'beetroot', 'radish', 'turnip', 'parsnip', 'onion', 'shallot', 'garlic', 'sweetpotato', 'cassava',
  'malanga', 'jerusalemartichoke',
]);

/** The almanac's kind for a crop. Fruit, perennials and anything not a
 *  root or a fruit-bearing annual follow the usual placing: perennials and
 *  trees with the roots, the rest with the leafy crops. */
export function moonKindFor(guide: Pick<CropGuide, 'key' | 'group' | 'season'>): MoonCropKind {
  if (FRUITING.has(guide.key)) return 'fruiting';
  if (ROOT.has(guide.key)) return 'root';
  if (guide.group === 'fruit' || guide.season === 'perennial') return 'root';
  return 'leafy';
}

const QUARTER_OF: Record<MoonPhaseKey, 1 | 2 | 3 | 4> = { new: 1, firstQuarter: 2, full: 3, lastQuarter: 4 };
const DAY_MS = 86400000;

export type QuarterSpan = { quarter: 1 | 2 | 3 | 4; from: number; until: number };

/** The moon's quarters between two moments, each clipped to the range. */
export function quarterSpans(fromMs: number, untilMs: number): QuarterSpan[] {
  const events = moonPhasesBetween(fromMs - 9 * DAY_MS, untilMs + 9 * DAY_MS);
  const spans: QuarterSpan[] = [];
  for (let i = 0; i + 1 < events.length; i++) {
    const from = Math.max(events[i].at, fromMs);
    const until = Math.min(events[i + 1].at, untilMs);
    if (until > from) spans.push({ quarter: QUARTER_OF[events[i].phase], from, until });
  }
  return spans;
}

export type SignDay = { from: number; until: number; sign: ZodiacSign };

/** The times in a quarter span when the moon is also in a fruitful sign,
 *  which is when both almanac rules agree. */
export function fruitfulWithin(span: { from: number; until: number }): SignDay[] {
  return moonSignSpans(span.from, span.until)
    .filter((s) => SIGN_CLASS[s.sign] === 'fruitful')
    .map((s) => ({ from: s.from, until: s.until, sign: s.sign }));
}

/** The next spans the almanac tradition gives a kind of crop, from `fromMs`
 *  for `days` days, each with the fruitful-sign days inside it. */
export function moonDaysFor(kind: MoonCropKind, fromMs: number, days: number): { span: QuarterSpan; fruitful: SignDay[] }[] {
  const quarter = MOON_KIND_QUARTER[kind];
  return quarterSpans(fromMs, fromMs + days * DAY_MS)
    .filter((s) => s.quarter === quarter)
    .map((span) => ({ span, fruitful: fruitfulWithin(span) }));
}

export const SIGN_CLASS_LABELS: Record<'fruitful' | 'semiFruitful' | 'barren', string> = {
  fruitful: 'a fruitful sign in the almanacs',
  semiFruitful: 'a semi-fruitful sign in the almanacs',
  barren: 'a barren sign in the almanacs, kept for weeding and clearing',
};

// ---------------------------------------------------------------------------
// The traditions
// ---------------------------------------------------------------------------

export type EvidenceTier = 'supported' | 'mixed' | 'notFound' | 'regional';

export const EVIDENCE_TIER_LABELS: Record<EvidenceTier, string> = {
  supported: 'Supported by research',
  mixed: 'Some trials found an effect, others did not',
  notFound: 'Trials have not found a consistent effect',
  regional: 'Sound for the climate it came from',
};

export type SowingTradition = {
  key: string;
  name: string;
  whoKeeps: string;
  says: string[];
  tier: EvidenceTier;
  evidence: string;
  sources: GuideSource[];
};

const CHALKER_SCOTT: GuideSource = {
  label: 'Linda Chalker-Scott, Washington State University Extension, The Garden Professors: "Lunar control? Or lunacy?"',
  url: 'https://gardenprofessors.com/lunar-control-or-lunacy/',
};
const KOLLERSTROM: GuideSource = {
  label: 'Kollerstrom N, Staudenmaier G. Evidence for lunar-sidereal rhythms in crop yield: a review. Biological Agriculture & Horticulture 2001;19(3):247-259',
  url: 'https://www.tandfonline.com/doi/abs/10.1080/01448765.2001.9754928',
};

export const SOWING_TRADITIONS: SowingTradition[] = [
  {
    key: 'moonPhase',
    name: 'Planting by the moon',
    whoKeeps:
      'Amish, Mennonite and many rural growers across North America and Europe, and The Old Farmer’s Almanac, published since 1792, which prints moon planting days.',
    says: [
      'While the moon waxes, from new to full, moisture is held to rise in the soil and the plant’s growth to go upward, so crops grown for what is above ground go in then.',
      'Leafy crops and grains that carry their seed outside a fruit go in during the first quarter: lettuce, spinach, cabbage, celery, broccoli.',
      'Crops that carry their seed inside a fruit or pod go in during the second quarter: beans, peas, peppers, squash, melons, tomatoes.',
      'While the moon wanes, from full to new, growth is held to go down, so roots, bulbs, perennials and trees go in during the third quarter: potatoes, carrots, onions, garlic, fruit trees.',
      'The fourth quarter is a resting time for sowing, kept for weeding, turning the soil, clearing and harvest.',
    ],
    tier: 'notFound',
    evidence:
      'Plants respond clearly to the length of the day and to the seasons. Controlled trials of the moon’s phase have not found a consistent effect on how seed comes up or how much a crop yields, and moonlight is far too faint to drive growth. Keeping a moon calendar costs nothing and many growers find it a steady rhythm for the work; the frost dates and a warm soil decide more about how a sowing does.',
    sources: [
      { label: 'The Old Farmer’s Almanac: Planting by the Moon Phase', url: 'https://www.almanac.com/planting-by-the-moon' },
      CHALKER_SCOTT,
    ],
  },
  {
    key: 'signs',
    name: 'Planting by the signs',
    whoKeeps:
      'Pennsylvania German (Pennsylvania Dutch) and Amish farm families, Appalachian and Southern gardeners, and the almanacs they buy, among them Baer’s Agricultural Almanac, printed in Lancaster, Pennsylvania, since 1825.',
    says: [
      'The moon passes through all twelve signs of the zodiac every month, about two and a half days in each, and each sign is held to favour some work and not others. The almanac’s "Man of Signs" drawing maps each sign to a part of the body.',
      'The water signs, Cancer, Scorpio and Pisces, are the most fruitful, and the earth signs Taurus and Capricorn are productive, especially for roots. Libra is semi-fruitful.',
      'Aries, Gemini, Leo, Virgo, Sagittarius and Aquarius are barren, kept for weeding, clearing brush and harvest.',
      'The best days join both rules: the right quarter of the moon for the crop, with the moon in a fruitful sign.',
      'Pennsylvania German lore adds its own particulars: potatoes planted in the waning moon, and in Libra rather than Cancer, where they are said to grow too deep; fence posts and roof shingles set in the waning moon so they lie flat and stay put.',
    ],
    tier: 'notFound',
    evidence:
      'No trial has shown the sign the moon is in to change how a crop grows. The signs here are the tropical ones the almanacs print, counted from the March equinox, which no longer line up with the constellations of the same names. The practice is a living part of Pennsylvania German and Appalachian culture and is recorded here for that.',
    sources: [
      { label: 'Anabaptist Historians: Reading the Signs of Nature in Traditional Pennsylvania Dutch Culture', url: 'https://anabaptisthistorians.org/2019/02/07/reading-the-signs-of-nature-in-traditional-pennsylvania-dutch-culture/' },
      { label: 'Southern Cultures: Sown in the Stars', url: 'https://www.southerncultures.org/article/sown-in-the-stars/' },
      CHALKER_SCOTT,
    ],
  },
  {
    key: 'biodynamic',
    name: 'The biodynamic calendar',
    whoKeeps:
      'Biodynamic farmers, vineyards and gardeners, following the calendar Maria Thun and her family published every year from 1963, now printed in many languages.',
    says: [
      'Each day is a root, leaf, flower or fruit day by the constellation the moon stands in: earth constellations for roots, water for leaves, air for flowers, fire for fruit and seed.',
      'The constellations are read as they stand in the sky now, so a biodynamic day and a Pennsylvania almanac day often name different signs for the same moon. Both are shown as their keepers read them, and this app does not compute the biodynamic days; the published calendar gives them.',
      'Some hours are left unplanted: around the moon’s nodes, its nearest and farthest points, and eclipses.',
    ],
    tier: 'mixed',
    evidence:
      'A 2001 review gathered trials, many by Thun and her colleagues, that reported yield differences by the moon’s constellation; other trials, including independent ones, found none, and no consistent effect has been confirmed. The long field trials that compare biodynamic with other farming test the whole system of compost and preparations, not the sowing calendar.',
    sources: [
      { label: 'Biodynamic Association (UK): The biodynamic sowing and planting calendar', url: 'https://www.biodynamic.org.uk/the-biodynamic-sowing-and-planting-calendar/' },
      KOLLERSTROM,
    ],
  },
  {
    key: 'sunDays',
    name: 'The solstices, the equinoxes and the holy days',
    whoKeeps: 'Gardeners across Britain, Ireland, Europe and North America, handed down as sayings rather than written rules.',
    says: [
      'Garlic goes in on the shortest day and comes out on the longest.',
      'Potatoes go in on Good Friday. Good Friday moves with the moon, since Easter falls on the Sunday after the first full moon on or after the March equinox.',
      'Peas go in on St Patrick’s Day, March 17.',
      'Asparagus is cut until Midsummer Day, June 24, and then left to grow and feed the crowns for next year.',
      'The equinoxes mark the year’s turning: in spring the soil begins to warm, and in autumn the time to sow for winter is closing.',
    ],
    tier: 'regional',
    evidence:
      'These sayings fit the climate they came from. Garlic does need a cold spell to form a bulb, and peas and potatoes do go in about four to six weeks before the last frost in much of Britain and the eastern United States. In a warmer or colder place the same date can be too early or too late, so the frost dates for where a person lives are the better guide, and the sayings travel as reminders.',
    sources: [
      { label: 'Royal Horticultural Society: How to grow garlic', url: 'https://www.rhs.org.uk/vegetables/garlic/grow-your-own' },
      { label: 'Royal Horticultural Society: How to grow asparagus', url: 'https://www.rhs.org.uk/vegetables/asparagus/grow-your-own' },
    ],
  },
  {
    key: 'phenology',
    name: 'Reading the plants around you',
    whoKeeps:
      'Farmers everywhere before printed calendars, and now extension services and the USA National Phenology Network, whose volunteers record when lilacs and other plants leaf and flower.',
    says: [
      'Sow peas, lettuce and onions when the forsythia blooms.',
      'Sow cool-season crops when lilac leaves are the size of a mouse’s ear, and set out squash and other tender plants when the lilacs are in full bloom.',
      'Plant sweetcorn when oak leaves are the size of a squirrel’s ear.',
      'Plant potatoes when the first dandelions bloom.',
    ],
    tier: 'supported',
    evidence:
      'Of the folk methods, this is the best supported. A shrub or tree that has been through the same winter and spring as the garden is responding to the same warmth, so its leafing and flowering track the season where a person lives, including a late spring or an early one. Researchers use the same plants, lilacs above all, to follow how spring is shifting.',
    sources: [
      { label: 'USA National Phenology Network: Cloned and Common Lilacs', url: 'https://www.usanpn.org/nn/lilacs' },
      { label: 'The Old Farmer’s Almanac: Phenology in the Garden', url: 'https://www.almanac.com/phenology-garden-planting-natures-signs' },
    ],
  },
  {
    key: 'solarTerms',
    name: 'The 24 solar terms',
    whoKeeps:
      'Farmers across China for more than two thousand years, and in Japan, Korea and Vietnam; inscribed by UNESCO in 2016 on the list of the intangible cultural heritage of humanity.',
    says: [
      'The year is divided into 24 terms of about fifteen days, each starting when the sun reaches a set point on its path, so they fall on nearly the same dates every year.',
      'Their names say what the farm needs then: Rain Water, Awakening of Insects, Clear and Bright for planting, Grain Rain for sowing grain, Grain in Ear for sowing and harvest together, Frost’s Descent.',
    ],
    tier: 'regional',
    evidence:
      'They follow the sun faithfully, which is what drives the seasons, and their names describe the weather of the middle Yellow River valley where they were set down. The dates are right everywhere; the weather they name may not be, above all south of the equator, where the seasons are reversed.',
    sources: [
      { label: 'UNESCO: The Twenty-Four Solar Terms', url: 'https://ich.unesco.org/doc/src/30595.pdf' },
    ],
  },
  {
    key: 'rains',
    name: 'San Isidro and the rains',
    whoKeeps:
      'Farmers in Spain, Mexico, New Mexico and across Latin America, and the growers of the milpa, the field of maize, beans and squash planted together.',
    says: [
      'May 15 is the feast of San Isidro Labrador, patron of farmers, when seed and fields are blessed and the saint is carried through them.',
      'Where summer brings the rains, the milpa is sown when the rains arrive, not on a fixed date, so the seed comes up with the water.',
    ],
    tier: 'regional',
    evidence:
      'Sowing on the arrival of the rains is sound wherever rain rather than frost decides the season, which is most of the tropics. The feast day falls after the last frost across much of the land where it is kept.',
    sources: [
      { label: 'Wikipedia: Feast of Saint Isidore the Laborer', url: 'https://en.wikipedia.org/wiki/Feast_of_Saint_Isidore_the_Laborer' },
      { label: 'University of Florida IFAS: Florida Vegetable Gardening Guide (rain and heat as the season)', url: 'https://ask.ifas.ufl.edu/publication/VH021' },
    ],
  },
  {
    key: 'maramataka',
    name: 'The maramataka',
    whoKeeps: 'Māori in Aotearoa New Zealand, whose knowledge of it is held by iwi and hapū and differs from place to place.',
    says: [
      'The maramataka is a lunar calendar of named nights, read together with the stars and the signs of the land and sea, used to time planting, harvesting and fishing.',
      'Every night of the moon’s month has a name and a character; some are good for planting and some are rest days.',
    ],
    tier: 'regional',
    evidence:
      'It is a whole way of reading the local environment over many generations rather than a single rule, and it belongs to the people who keep it. This app describes it only in general terms; its particulars are for iwi and hapū to teach.',
    sources: [
      { label: 'Te Ara, the Encyclopedia of New Zealand: Maramataka, the lunar calendar', url: 'https://teara.govt.nz/en/maramataka-the-lunar-calendar' },
      { label: 'Te Papa: The Maramataka', url: 'https://tepapa.govt.nz/discover-collections/read-watch-play/maori/maramataka-maori-calendar' },
    ],
  },
];

export const TRADITIONS_INTRO =
  'People have timed their sowing by the moon, the stars, the sun’s turning points and the plants around them for as long as there have been gardens. Each is told here the way its keepers tell it, with what research has found beside it. The frost dates and a warm soil still decide the most about how a sowing does.';
