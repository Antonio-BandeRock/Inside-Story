// Compare any two series, F16 (2026-10-01): two things the person records,
// drawn on one date axis with each on a separate scale, one read off the
// left edge and one off the right. Answers Cronometer's two-chart overlay.
//
// The rules held here, with no I/O so scripts/test_compare_series.js can
// check them:
//
//  1. A day with no reading is left out of a series, never drawn as zero,
//     and nothing joins two readings across a gap: the chart draws dots.
//  2. Each series keeps a range apart, so a weight in the seventies and a
//     nutrient near 100% of target both fill the height.
//  3. The caption counts the days each series has a reading and the days
//     that have both, and says moving together is not one causing the
//     other. No correlation figure is given: on one person's records it
//     would read as a finding.
//
// The loader is lib/compareSeriesDb.ts, the chart components/CompareTwoChart.tsx.
import { NUTRIENT_ANTAGONISM_RULES, NUTRIENT_SYNERGY_RULES, type NutrientPairRule } from './nutrientPairRules';

export const COMPARE_RANGES = [30, 90, 180, 365] as const;
export type CompareRange = (typeof COMPARE_RANGES)[number];
export const DEFAULT_COMPARE_RANGE: CompareRange = 90;

export type SeriesKind = 'nutrient' | 'weight' | 'steps' | 'sleep' | 'severity' | 'scale' | 'lab' | 'tracker' | 'weather';

export type SeriesChoice = {
  key: string;
  kind: SeriesKind;
  label: string;
  group: string;
  unit: string;
  decimals: number;
  // A scale with fixed ends draws against those ends rather than against
  // whatever the readings happened to span.
  fixedRange?: { yMin: number; yMax: number };
  // Several readings on one day: averaged, added, or the highest kept.
  perDay: 'average' | 'total' | 'highest';
};

export type ComparePoint = { date: string; value: number };

export type ChoiceSources = {
  nutrients: { code: string; label: string }[];
  labs: { code: string; label: string; unit: string }[];
  trackers: { id: string; name: string; unit: string; perDay: 'average' | 'total'; scale: boolean }[];
  weightUnit: 'kg' | 'lb';
  // F22: offered only once weather is turned on, in the person's units.
  weather?: { temp: 'C' | 'F'; pressure: 'hPa' | 'inHg'; rain: 'mm' | 'in' } | null;
};

export const COMPARE_GROUPS = ['Nutrients', 'Body', 'Sleep and movement', 'How you felt', 'Labs', 'Your trackers', 'Weather'] as const;

export function nutrientKey(code: string): string {
  return `nutrient:${code}`;
}

// Every series the person could pick, nutrients first, in the order the
// groups above are listed.
export function buildChoices(sources: ChoiceSources): SeriesChoice[] {
  const choices: SeriesChoice[] = [];
  for (const nutrient of sources.nutrients) {
    choices.push({
      key: nutrientKey(nutrient.code),
      kind: 'nutrient',
      label: `${nutrient.label}, % of target`,
      group: 'Nutrients',
      unit: '% of target',
      decimals: 0,
      perDay: 'average',
    });
  }
  choices.push({ key: 'weight', kind: 'weight', label: 'Weight', group: 'Body', unit: sources.weightUnit, decimals: 1, perDay: 'average' });
  choices.push({ key: 'sleep', kind: 'sleep', label: 'Sleep, hours a night', group: 'Sleep and movement', unit: 'hours', decimals: 1, perDay: 'total' });
  choices.push({ key: 'steps', kind: 'steps', label: 'Steps', group: 'Sleep and movement', unit: 'steps', decimals: 0, perDay: 'total' });
  choices.push({
    key: 'severity',
    kind: 'severity',
    label: 'Flare and reaction severity, 0 to 10',
    group: 'How you felt',
    unit: 'of 10',
    decimals: 0,
    fixedRange: { yMin: 0, yMax: 10 },
    perDay: 'highest',
  });
  for (const [key, label] of [
    ['mood', 'Mood'],
    ['energy', 'Energy'],
    ['stress', 'Stress'],
  ] as const) {
    choices.push({
      key: `scale:${key}`,
      kind: 'scale',
      label: `${label}, 1 to 5`,
      group: 'How you felt',
      unit: 'of 5',
      decimals: 1,
      fixedRange: { yMin: 1, yMax: 5 },
      perDay: 'average',
    });
  }
  for (const lab of sources.labs) {
    choices.push({ key: `lab:${lab.code}`, kind: 'lab', label: lab.label, group: 'Labs', unit: lab.unit, decimals: 2, perDay: 'average' });
  }
  for (const tracker of sources.trackers) {
    choices.push({
      key: `tracker:${tracker.id}`,
      kind: 'tracker',
      label: tracker.name,
      group: 'Your trackers',
      unit: tracker.unit,
      decimals: 1,
      fixedRange: tracker.scale ? { yMin: 1, yMax: 5 } : undefined,
      perDay: tracker.perDay,
    });
  }
  if (sources.weather) {
    const units = sources.weather;
    choices.push({ key: 'weather:pressure', kind: 'weather', label: 'Air pressure', group: 'Weather', unit: units.pressure, decimals: units.pressure === 'inHg' ? 2 : 0, perDay: 'average' });
    choices.push({ key: 'weather:high', kind: 'weather', label: 'The day’s high', group: 'Weather', unit: `°${units.temp}`, decimals: 1, perDay: 'average' });
    choices.push({ key: 'weather:humidity', kind: 'weather', label: 'Humidity', group: 'Weather', unit: '%', decimals: 0, perDay: 'average' });
    choices.push({ key: 'weather:rain', kind: 'weather', label: 'Rain', group: 'Weather', unit: units.rain, decimals: units.rain === 'in' ? 2 : 1, perDay: 'total' });
  }
  return choices;
}

// The picker reads groups in the order above. Labs and trackers arrive
// already alphabetical from the loader; nutrients keep the order the
// reference intakes list them in, which is the order Insights shows.
export function choiceOptions(choices: readonly SeriesChoice[]): { label: string; value: string }[] {
  return choices.map((choice) => ({ label: choice.label, value: choice.key }));
}

// ---- dates ----

function utcOf(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function shiftDate(date: string, days: number): string {
  const t = new Date(utcOf(date) + days * 86_400_000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

export function dayIndex(date: string, start: string): number {
  return Math.round((utcOf(date) - utcOf(start)) / 86_400_000);
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function sayDate(date: string): string {
  const t = new Date(utcOf(date));
  return `${WEEKDAYS[t.getUTCDay()]} ${t.getUTCDate()} ${MONTHS[t.getUTCMonth()]} ${t.getUTCFullYear()}`;
}

export function sayShortDate(date: string): string {
  const t = new Date(utcOf(date));
  return `${t.getUTCDate()} ${MONTHS[t.getUTCMonth()]}`;
}

// ---- readings ----

// One reading per day, oldest first, inside the range only.
export function oneReadingPerDay(
  points: readonly ComparePoint[],
  perDay: SeriesChoice['perDay'],
  start: string,
  end: string,
): ComparePoint[] {
  const byDay = new Map<string, number[]>();
  for (const point of points) {
    if (!Number.isFinite(point.value)) continue;
    if (point.date < start || point.date > end) continue;
    const list = byDay.get(point.date) ?? [];
    list.push(point.value);
    byDay.set(point.date, list);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, values]) => ({
      date,
      value:
        perDay === 'highest'
          ? Math.max(...values)
          : perDay === 'total'
            ? values.reduce((sum, v) => sum + v, 0)
            : values.reduce((sum, v) => sum + v, 0) / values.length,
    }));
}

export function seriesRange(choice: SeriesChoice, points: readonly ComparePoint[]): { yMin: number; yMax: number } {
  if (choice.fixedRange) {
    // A reading outside the fixed ends (a tracker scale used past 5)
    // still has to land on the chart.
    const values = points.map((p) => p.value);
    return {
      yMin: Math.min(choice.fixedRange.yMin, ...values),
      yMax: Math.max(choice.fixedRange.yMax, ...values),
    };
  }
  if (points.length === 0) return { yMin: 0, yMax: 1 };
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || Math.max(Math.abs(max) * 0.2, 1);
  const pad = span * 0.12;
  const yMin = min >= 0 && min - pad < 0 ? 0 : min - pad;
  return { yMin, yMax: max + pad };
}

export function formatValue(choice: SeriesChoice, value: number): string {
  const rounded = choice.decimals === 0 ? Math.round(value) : Number(value.toFixed(choice.decimals));
  const number = rounded.toLocaleString('en-US', { maximumFractionDigits: choice.decimals });
  if (choice.unit === '% of target') return `${number}% of target`;
  if (!choice.unit) return number;
  return `${number} ${choice.unit}`;
}

// An axis label: short, no unit words.
export function formatAxisValue(choice: SeriesChoice, value: number): string {
  const span = Math.abs(value);
  if (span >= 10_000) return `${Math.round(value / 1000)}k`;
  if (span >= 100 || choice.decimals === 0) return String(Math.round(value));
  if (span >= 10) return value.toFixed(0);
  return value.toFixed(1);
}

// ---- the comparison ----

export type Comparison = {
  start: string;
  end: string;
  days: number;
  a: { choice: SeriesChoice; points: ComparePoint[]; range: { yMin: number; yMax: number } };
  b: { choice: SeriesChoice; points: ComparePoint[]; range: { yMin: number; yMax: number } };
  daysA: number;
  daysB: number;
  daysBoth: number;
  sameSeries: boolean;
  summary: string;
  accessibilityLabel: string;
};

export const MOVING_TOGETHER_LINE =
  'Two series rising and falling together does not show that one is causing the other. Both can follow something else, such as a season, a busy week or a change in treatment, and with few shared days it can be chance.';

function dayWord(n: number): string {
  return n === 1 ? 'day' : 'days';
}

export function buildComparison(
  choiceA: SeriesChoice,
  rawA: readonly ComparePoint[],
  choiceB: SeriesChoice,
  rawB: readonly ComparePoint[],
  end: string,
  days: number,
): Comparison {
  const start = shiftDate(end, -(days - 1));
  const pointsA = oneReadingPerDay(rawA, choiceA.perDay, start, end);
  const pointsB = oneReadingPerDay(rawB, choiceB.perDay, start, end);
  const datesB = new Set(pointsB.map((p) => p.date));
  const daysBoth = pointsA.filter((p) => datesB.has(p.date)).length;
  const sameSeries = choiceA.key === choiceB.key;

  let summary: string;
  if (sameSeries) {
    summary = 'Both pickers hold the same thing. Pick something different in one of them to compare two.';
  } else if (pointsA.length === 0 && pointsB.length === 0) {
    summary = `Nothing is recorded for either in the last ${days} days.`;
  } else {
    const parts = [
      `${choiceA.label} has a reading on ${pointsA.length} of the last ${days} days, and ${choiceB.label} on ${pointsB.length}.`,
    ];
    if (pointsA.length > 0 && pointsB.length > 0) {
      parts.push(
        daysBoth === 0
          ? 'No day has both, so the two can only be read side by side, never day against day.'
          : `${daysBoth} ${dayWord(daysBoth)} ${daysBoth === 1 ? 'has' : 'have'} both.`,
      );
    }
    summary = parts.join(' ');
  }

  return {
    start,
    end,
    days,
    a: { choice: choiceA, points: pointsA, range: seriesRange(choiceA, pointsA) },
    b: { choice: choiceB, points: pointsB, range: seriesRange(choiceB, pointsB) },
    daysA: pointsA.length,
    daysB: pointsB.length,
    daysBoth,
    sameSeries,
    summary,
    accessibilityLabel: `${choiceA.label} as circles on the left scale and ${choiceB.label} as squares on the right scale, from ${sayDate(start)} to ${sayDate(end)}. ${summary}`,
  };
}

// What one day reads, both series named, for the line under the chart.
export function describeDay(comparison: Comparison, date: string): string {
  const read = (side: Comparison['a']) => {
    const point = side.points.find((p) => p.date === date);
    return `${side.choice.label} ${point ? formatValue(side.choice, point.value) : 'not recorded'}`;
  };
  return `${sayDate(date)}: ${read(comparison.a)}; ${read(comparison.b)}.`;
}

// ---- pairs with a known reason ----
//
// Two series are offered first when something published says why one
// would be read against the other. Everything else stays pickable, since
// a person may be looking for a pattern of their own nobody has written
// down, but such a pair is said to have no known link. The pairs read
// both ways. A tier says how much the reason rests on, and the `why`
// says what to expect on the chart, which for a slow marker is little
// day to day. A tracker is named by the person and has no known partner.

export type PairTier = 'strong' | 'moderate' | 'weak';

export const PAIR_TIER_WORDS: Record<PairTier, string> = {
  strong: 'Shown in trials or reviews of trials.',
  moderate: 'Well established, though slow or loose from one day to the next.',
  weak: 'A loose marker, so expect little to show.',
};

// `kind` is set on a pair that comes from a nutrient pair rule
// (lib/nutrientPairRules.ts): the intake of one nutrient against the lab
// that holds the store of the nutrient it helps or competes with.
export type PairKind = 'helps' | 'competes';

export const PAIR_KIND_WORDS: Record<PairKind, string> = {
  helps: 'Helps absorption',
  competes: 'Competes for absorption',
};

export type KnownPair = { a: string; b: string; why: string; tier: PairTier; source: string; kind?: PairKind };

const PAIR_RULES = [...NUTRIENT_SYNERGY_RULES, ...NUTRIENT_ANTAGONISM_RULES];

function kindOf(rule: NutrientPairRule): PairKind {
  return rule.kind === 'synergy' ? 'helps' : 'competes';
}

// Each rule's intake-against-lab pairs, so a rule added to
// lib/nutrientPairRules.ts reaches Compare Two without being typed twice.
const RULE_PAIRS: KnownPair[] = PAIR_RULES.flatMap((rule) =>
  rule.compare.labs.map((lab) => ({
    a: nutrientKey(rule.nutrientA),
    b: `lab:${lab.lab}`,
    why: lab.why,
    tier: lab.tier,
    source: lab.source,
    kind: kindOf(rule),
  })),
);

const HAND_PAIRS: readonly KnownPair[] = [


  {
    a: 'nutrient:iron',
    b: 'lab:ferritin',
    why: 'Ferritin is the body’s store of iron. Intake feeds it over months rather than days, and inflammation raises it too, so look for a slow drift between tests.',
    tier: 'moderate',
    source: 'WHO guideline on use of ferritin concentrations to assess iron status in individuals and populations, 2020.',
  },


  {
    a: 'nutrient:vitamin_d',
    b: 'lab:vitamin_d_test',
    why: 'Vitamin D from food and supplements raises the blood level over weeks. Sun on the skin is usually the larger source, so a season can move the test more than a menu.',
    tier: 'moderate',
    source: 'Institute of Medicine. Dietary Reference Intakes for Calcium and Vitamin D, 2011.',
  },
  {
    a: 'nutrient:vitamin_b12',
    b: 'lab:vitamin_b12_test',
    why: 'Intake feeds the blood level, though only when the gut can absorb it. Low stomach acid and autoimmune gastritis both stop that, whatever is eaten.',
    tier: 'moderate',
    source: 'NIH Office of Dietary Supplements, Vitamin B12 fact sheet for health professionals.',
  },
  {
    a: 'nutrient:selenium',
    b: 'lab:selenium_test',
    why: 'Serum selenium follows intake over the weeks before the test, food and supplements both.',
    tier: 'moderate',
    source: 'NIH Office of Dietary Supplements, Selenium fact sheet for health professionals.',
  },
  {
    a: 'nutrient:selenium',
    b: 'lab:tpo_ab',
    why: 'In trials in autoimmune thyroiditis, selenium supplements lowered TPO antibodies over three to twelve months. Food sources were not what those trials tested.',
    tier: 'strong',
    source: 'Wichman J et al. Thyroid 2016;26:1681-1692.',
  },
  {
    a: 'nutrient:zinc',
    b: 'lab:zinc_test',
    why: 'Serum zinc moves only a little with intake and also drops with inflammation and after meals.',
    tier: 'weak',
    source: 'NIH Office of Dietary Supplements, Zinc fact sheet for health professionals.',
  },
  {
    a: 'nutrient:magnesium',
    b: 'lab:magnesium_test',
    why: 'Almost all magnesium sits in bone and cells, and the serum level is held steady, so intake shows in it only weakly.',
    tier: 'weak',
    source: 'NIH Office of Dietary Supplements, Magnesium fact sheet for health professionals.',
  },
  {
    a: 'nutrient:iodine',
    b: 'lab:urine_iodine',
    why: 'Urine iodine reflects the iodine of the last day or two, so one spot test swings with what was eaten just before it.',
    tier: 'moderate',
    source: 'WHO, UNICEF, ICCIDD. Assessment of iodine deficiency disorders and monitoring their elimination, 2007.',
  },
  {
    a: 'nutrient:iodine',
    b: 'lab:tsh',
    why: 'The thyroid needs iodine to make its hormones, and both too little and too much can move TSH.',
    tier: 'moderate',
    source: 'NIH Office of Dietary Supplements, Iodine fact sheet for health professionals.',
  },
  {
    a: 'lab:tsh',
    b: 'lab:free_t4',
    why: 'The pituitary raises TSH when free T4 falls and lowers it when free T4 rises, so the two usually move in opposite directions.',
    tier: 'moderate',
    source: 'Hadlow NC et al. J Clin Endocrinol Metab 2013;98:2936-2943.',
  },
  {
    a: 'lab:tpo_ab',
    b: 'lab:tsh',
    why: 'TPO antibodies mark autoimmune thyroiditis, and people who carry them are more likely to see TSH rise over the years.',
    tier: 'moderate',
    source: 'Vanderpump MPJ et al. Clin Endocrinol 1995;43:55-68.',
  },
  {
    a: 'lab:tsh',
    b: 'weight',
    why: 'A higher TSH has gone with a somewhat higher weight in population studies. On one person’s chart, weight moves for many other reasons too.',
    tier: 'moderate',
    source: 'Knudsen N et al. J Clin Endocrinol Metab 2005;90:4019-4024.',
  },
  {
    a: 'lab:hscrp',
    b: 'severity',
    why: 'CRP rises with inflammation. It tracks flares in some conditions, such as Crohn’s disease and rheumatoid arthritis, and hardly at all in others.',
    tier: 'moderate',
    source: 'Vermeire S et al. Inflamm Bowel Dis 2004;10:661-665.',
  },
  {
    a: 'nutrient:fiber_total',
    b: 'severity',
    why: 'In IBS, soluble fibre such as psyllium eased symptoms in trials while bran did not. For other conditions the link is less settled.',
    tier: 'strong',
    source: 'Moayyedi P et al. Am J Gastroenterol 2014;109:1367-1374.',
  },
  {
    a: 'sleep',
    b: 'scale:mood',
    why: 'Of everything sleep loss was measured against in experiments, mood moved the most.',
    tier: 'strong',
    source: 'Pilcher JJ, Huffcutt AI. Sleep 1996;19:318-326.',
  },
  {
    a: 'sleep',
    b: 'scale:energy',
    why: 'Too little sleep shows the next day as tiredness and less energy.',
    tier: 'moderate',
    source: 'National Heart, Lung, and Blood Institute, Sleep Deprivation and Deficiency.',
  },
  {
    a: 'sleep',
    b: 'scale:stress',
    why: 'Stress and short or broken sleep go together in studies, and each can feed the other.',
    tier: 'moderate',
    source: 'Åkerstedt T. Scand J Work Environ Health 2006;32:493-501.',
  },
  {
    a: 'steps',
    b: 'sleep',
    why: 'Regular activity has improved sleep by a small to moderate amount in trials, more over weeks than on any one night.',
    tier: 'strong',
    source: 'Kredlow MA et al. J Behav Med 2015;38:427-449.',
  },
  // F22: weather where the person lives, beside how they felt.
  {
    a: 'weather:pressure',
    b: 'severity',
    why: 'In a study of people with migraine, attacks came more often on days air pressure fell. Studies of joint pain and other conditions disagree with each other, and many people notice nothing.',
    tier: 'weak',
    source: 'Kimoto K et al. Intern Med 2011;50:1923-1928.',
  },
  {
    a: 'weather:high',
    b: 'severity',
    why: 'In multiple sclerosis a rise in body heat, a hot day included, can bring earlier symptoms back for a while (Uhthoff’s phenomenon), and they usually ease as the body cools.',
    tier: 'moderate',
    source: 'Davis SL et al. J Appl Physiol 2010;109:1531-1537.',
  },
];

export const KNOWN_PAIRS: readonly KnownPair[] = [...HAND_PAIRS, ...RULE_PAIRS];

export type MealPair = { kind: PairKind; label: string; inAMeal: string; source: string };

// Two nutrients a pair rule connects. Their effect on each other happens
// inside one meal, so they are not a known pair to chart: two daily
// totals side by side cannot show it. The lens says so and points to
// Schedules > Today's Meals, which reads each meal.
export function mealPairFor(keyA: string, keyB: string): MealPair | null {
  if (!keyA.startsWith('nutrient:') || !keyB.startsWith('nutrient:')) return null;
  const a = keyA.slice('nutrient:'.length);
  const b = keyB.slice('nutrient:'.length);
  const rule = PAIR_RULES.find(
    (r) => (r.nutrientA === a && r.nutrientB.includes(b)) || (r.nutrientA === b && r.nutrientB.includes(a)),
  );
  return rule ? { kind: kindOf(rule), label: rule.label, inAMeal: rule.compare.inAMeal, source: rule.compare.source } : null;
}

export const MEAL_PAIR_LINE =
  'This happens inside one meal, so two daily totals side by side cannot show it: a day can hold both without them ever meeting on one plate. Today’s Meals reads each meal for this.';

export function pairFor(keyA: string, keyB: string): KnownPair | null {
  return KNOWN_PAIRS.find((p) => (p.a === keyA && p.b === keyB) || (p.a === keyB && p.b === keyA)) ?? null;
}

// The keys known to be read with this one, in the order listed above.
export function partnersOf(key: string): string[] {
  return KNOWN_PAIRS.filter((p) => p.a === key || p.b === key).map((p) => (p.a === key ? p.b : p.a));
}

export const NO_KNOWN_LINK_LINE =
  'Nothing known connects these two, so if they rise and fall together, chance is the likelier reading. The pair stays here to look at, since a pattern of yours may be one nobody has written down.';

// What the pickers hold once the records are read: only series with at
// least one reading in the range. A series already picked is kept even
// when it has none, so a picker never empties out under somebody.
export function choicesWithData(
  choices: readonly SeriesChoice[],
  keysWithData: ReadonlySet<string>,
  keep: readonly (string | null)[] = [],
): SeriesChoice[] {
  return choices.filter((c) => keysWithData.has(c.key) || keep.includes(c.key));
}

// The second picker's list: known partners of the first, then the rest.
export function secondOptions(choices: readonly SeriesChoice[], keyA: string | null): { label: string; value: string }[] {
  const partners = keyA ? partnersOf(keyA) : [];
  const known = partners.map((k) => choices.find((c) => c.key === k)).filter((c): c is SeriesChoice => !!c);
  const rest = choices.filter((c) => !partners.includes(c.key));
  return choiceOptions([...known, ...rest]);
}

// A lab nobody has a result for is not in the catalogue, so its name
// comes from here.
const LAB_NAMES: Record<string, string> = {
  ferritin: 'Ferritin',
  vitamin_d_test: 'Vitamin D (25-hydroxyvitamin D)',
  vitamin_b12_test: 'Vitamin B12',
  selenium_test: 'Selenium (serum)',
  tpo_ab: 'TPO antibodies',
  zinc_test: 'Zinc (serum)',
  magnesium_test: 'Magnesium (serum)',
  urine_iodine: 'Urine iodine',
  tsh: 'TSH',
  free_t4: 'Free T4',
  hscrp: 'hs-CRP',
};

// The first picker's known partners, split into those with readings in
// the range and those with nothing recorded yet, which are named so the
// person knows what would be worth recording.
export function partnerChoices(
  allChoices: readonly SeriesChoice[],
  shown: readonly SeriesChoice[],
  keyA: string | null,
): { ready: SeriesChoice[]; notYet: string[] } {
  if (!keyA) return { ready: [], notYet: [] };
  const ready: SeriesChoice[] = [];
  const notYet: string[] = [];
  for (const key of partnersOf(keyA)) {
    const choice = shown.find((c) => c.key === key);
    if (choice) ready.push(choice);
    else {
      const known = allChoices.find((c) => c.key === key)?.label;
      notYet.push(known ?? (key.startsWith('lab:') ? LAB_NAMES[key.slice(4)] ?? key.slice(4) : key));
    }
  }
  return { ready, notYet };
}
