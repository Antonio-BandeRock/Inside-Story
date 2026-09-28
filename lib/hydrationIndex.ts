// How each drink holds on to water, and a water target that moves with the
// day's activity (G36 of the competitive build plan, 2026-09-27).
//
// PER DRINK. The Beverage Hydration Index (Maughan et al., Am J Clin Nutr
// 2016;103:717-723) compared how much of a litre of each of 13 drinks the
// body still held four hours later, against the same litre of still water
// (index 1). Three drinks came out higher by a margin the trial could show:
// oral rehydration solution (1.54), full-fat milk (1.50) and skimmed milk
// (1.58). Coffee, tea, cola, diet cola, sparkling water, a sports drink and
// a 4% lager were not measurably different from water at that volume. This
// table says only what the trial measured, for the drinks it measured, and
// every line names the trial's limits: a litre drunk within half an hour,
// measured over four hours, in 72 healthy young men. A drink the trial did
// not test gets no figure rather than a guess. Orange juice is left out on
// purpose, since how its result is read differs between summaries and this
// table carries only the findings that are not in question.
//
// The index never changes the water total. The total counts the water in
// what was logged; the index is about how much of it the body kept, and
// mixing the two would count one drink twice over.
//
// THE MOVING TARGET. On a day with logged activity the Hydration target
// rises by a working figure of 500 ml for each hour. Sweat losses during
// exercise run from about 0.3 to 2.4 litres an hour depending on the
// person, the effort and the heat (American College of Sports Medicine
// position stand, Sawka et al., Med Sci Sports Exerc 2007;39:377-390), so
// 500 ml an hour sits near the low end and the words say it is a working
// figure. Heat is not counted, since the app does not read the weather yet
// (F22); `heatWaterMl` is where it joins when it does. A clinician's fluid
// limit always comes first, which matters most for kidney disease, and the
// caption says so.
//
// Pure, with no React and no database, so scripts/test_hydration_index.js
// checks it without a phone.

export const HYDRATION_INDEX_SOURCE = 'Maughan and colleagues, American Journal of Clinical Nutrition, 2016';
export const ACTIVITY_WATER_SOURCE = 'American College of Sports Medicine position stand on fluid replacement, 2007';

export type DrinkIndex = {
  key: string;
  /** What the drink is called in the line. */
  label: string;
  /** "1.54", or null for a drink measured as no different from water. */
  index: string | null;
  line: string;
};

type Entry = DrinkIndex & { test: (name: string) => boolean };

const PLANT_MILK = /\b(almond|soy|soya|oat|rice|coconut|cashew|hemp|pea|macadamia|hazelnut|flax)\b/i;
const FLAVOURED_MILK = /\b(chocolate|strawberry|malted|shake|condensed|evaporated|powder|dry|dried)\b/i;
const isCowMilk = (name: string) => /\bmilk\b/i.test(name) && !PLANT_MILK.test(name) && !FLAVOURED_MILK.test(name);

const SAME_AS_WATER = 'In a trial of 13 drinks this one held on to water about as well as still water did, with no measurable difference.';

const ENTRIES: Entry[] = [
  {
    key: 'ors',
    label: 'Oral rehydration solution',
    index: '1.54',
    test: (name) => /\b(oral rehydration|rehydration solution|pedialyte|electrolyte solution)\b/i.test(name),
    line: 'In a trial of 13 drinks, the body still held about 1.54 times as much of an oral rehydration solution four hours later as of still water.',
  },
  {
    key: 'skim-milk',
    label: 'Skimmed milk',
    index: '1.58',
    test: (name) => isCowMilk(name) && /\b(skim|skimmed|nonfat|non-fat|fat free|fat-free)\b/i.test(name),
    line: 'In a trial of 13 drinks, the body still held about 1.58 times as much skimmed milk four hours later as still water.',
  },
  {
    key: 'whole-milk',
    label: 'Full-fat milk',
    index: '1.50',
    test: (name) => isCowMilk(name) && /\b(whole|full fat|full-fat|3\.25%|3\.3%|3\.5%)\b/i.test(name),
    line: 'In a trial of 13 drinks, the body still held about 1.50 times as much full-fat milk four hours later as still water.',
  },
  {
    key: 'milk',
    label: 'Milk',
    index: '1.50 to 1.58',
    test: (name) => isCowMilk(name),
    line: 'The trial measured full-fat milk at 1.50 and skimmed milk at 1.58 against still water; milk between the two was not tested on its own.',
  },
  {
    key: 'coffee',
    label: 'Coffee',
    index: null,
    test: (name) => /\bcoffee\b/i.test(name) && !/\b(liqueur|ice cream|cake)\b/i.test(name),
    line: SAME_AS_WATER,
  },
  {
    key: 'tea',
    label: 'Tea',
    index: null,
    test: (name) => /\btea\b/i.test(name) && !/\b(cake|biscuit|bread)\b/i.test(name),
    line: SAME_AS_WATER,
  },
  {
    key: 'cola',
    label: 'Cola',
    index: null,
    test: (name) => /\bcola\b/i.test(name),
    line: SAME_AS_WATER,
  },
  {
    key: 'sparkling-water',
    label: 'Sparkling water',
    index: null,
    test: (name) => /\bwater\b/i.test(name) && /\b(sparkling|carbonated|soda water|club soda|seltzer)\b/i.test(name),
    line: SAME_AS_WATER,
  },
  {
    key: 'sports-drink',
    label: 'Sports drink',
    index: null,
    test: (name) => /\b(sports drink|isotonic|gatorade|powerade)\b/i.test(name),
    line: SAME_AS_WATER,
  },
  {
    key: 'lager',
    label: 'Beer',
    index: null,
    test: (name) => /\b(beer|lager)\b/i.test(name) && !/\b(root beer|ginger beer)\b/i.test(name),
    line: 'The trial tested a 4% lager, which held on to water about as well as still water did. Stronger drinks were not tested and may differ.',
  },
  {
    key: 'water',
    label: 'Water',
    index: '1',
    test: (name) => /\bwater\b/i.test(name) && !/\b(coconut|melon|chestnut|cress|tonic|sparkling|carbonated|soda|seltzer)\b/i.test(name),
    line: 'Still water is what every other drink in the trial was measured against, at 1.',
  },
];

/** The trial's finding for a drink by its name, or null when the trial did not test it. */
export function drinkIndexFor(name: string): DrinkIndex | null {
  const found = ENTRIES.find((entry) => entry.test(name));
  if (!found) return null;
  return { key: found.key, label: found.label, index: found.index, line: found.line };
}

/**
 * One line per kind of drink logged today, in the order first logged, and
 * the names the trial did not test, so the band can say it has nothing on
 * them rather than leave them out silently.
 */
export function drinkIndexLines(names: string[]): { found: DrinkIndex[]; untested: string[] } {
  const found: DrinkIndex[] = [];
  const untested: string[] = [];
  const seenKeys = new Set<string>();
  const seenNames = new Set<string>();
  for (const raw of names) {
    const name = raw.trim();
    if (!name || seenNames.has(name.toLowerCase())) continue;
    seenNames.add(name.toLowerCase());
    const entry = drinkIndexFor(name);
    if (!entry) {
      untested.push(name);
      continue;
    }
    if (seenKeys.has(entry.key)) continue;
    seenKeys.add(entry.key);
    found.push(entry);
  }
  return { found, untested };
}

export const DRINK_INDEX_CAPTION =
  `From ${HYDRATION_INDEX_SOURCE}: a litre of each drink within half an hour, measured over four hours, in 72 healthy young men. ` +
  'The water total above counts the water in each drink, and this figure does not change it.';

// --- The moving target --------------------------------------------------------

/** Working figure: extra water per hour of logged activity. */
export const ACTIVITY_WATER_ML_PER_HOUR = 500;

/** Extra water for the day's activity, rounded to 50 ml. Zero with no activity. */
export function activityWaterMl(activeMinutes: number): number {
  if (!Number.isFinite(activeMinutes) || activeMinutes <= 0) return 0;
  return Math.round(((activeMinutes / 60) * ACTIVITY_WATER_ML_PER_HOUR) / 50) * 50;
}

/** Heat joins here once the app reads the weather (F22). Zero until then. */
export function heatWaterMl(): number {
  return 0;
}

/**
 * Today's activity minutes, counted once. Health Connect sessions and
 * workouts logged in the app may be the same workout, so the larger of the
 * two totals is used rather than their sum.
 */
export function activeMinutesToday(healthConnectMinutes: number[], loggedMinutes: number[]): { minutes: number; source: 'health' | 'logged' | null } {
  const sum = (list: number[]) => list.reduce((total, value) => total + (Number.isFinite(value) && value > 0 ? value : 0), 0);
  const health = sum(healthConnectMinutes);
  const logged = sum(loggedMinutes);
  if (health <= 0 && logged <= 0) return { minutes: 0, source: null };
  return health >= logged ? { minutes: health, source: 'health' } : { minutes: logged, source: 'logged' };
}

export type MovedTarget = {
  baseMl: number;
  activityMl: number;
  targetMl: number;
  activeMinutes: number;
  /** "Includes 250 ml for 30 minutes of activity from Health Connect." Null on a day with none. */
  line: string | null;
};

function minutesWords(minutes: number): string {
  const rounded = Math.round(minutes);
  if (rounded < 60) return `${rounded} minute${rounded === 1 ? '' : 's'}`;
  const hours = Math.floor(rounded / 60);
  const rest = rounded % 60;
  const hourWords = `${hours} hour${hours === 1 ? '' : 's'}`;
  return rest > 0 ? `${hourWords} ${rest} minute${rest === 1 ? '' : 's'}` : hourWords;
}

export function movedWaterTarget(baseMl: number, active: { minutes: number; source: 'health' | 'logged' | null }): MovedTarget {
  const base = Number.isFinite(baseMl) && baseMl > 0 ? baseMl : 0;
  const activityMl = base > 0 ? activityWaterMl(active.minutes) + heatWaterMl() : 0;
  const from = active.source === 'health' ? ' from Health Connect' : active.source === 'logged' ? ' you logged' : '';
  return {
    baseMl: base,
    activityMl,
    targetMl: base + activityMl,
    activeMinutes: active.minutes,
    line: activityMl > 0 ? `Includes ${activityMl} ml for ${minutesWords(active.minutes)} of activity${from}.` : null,
  };
}

export const MOVED_TARGET_CAPTION =
  `On a day with activity the target adds a working figure of ${ACTIVITY_WATER_ML_PER_HOUR} ml an hour. ` +
  `Sweat losses run from about 0.3 to 2.4 litres an hour depending on the person, the effort and the heat (${ACTIVITY_WATER_SOURCE}), and the weather is not counted yet. ` +
  'If a clinician has set a fluid limit for you, their figure comes first.';
