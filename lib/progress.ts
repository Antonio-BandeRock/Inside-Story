// Your Progress: the arithmetic and every sentence, with no React and no
// database, so scripts/test_progress.js can run all of it. C17 of the
// competitive build plan, built 2026-09-27 from docs/progress-design.md
// after the owner approved its four decisions:
//
//  1. Growth is variety plus elapsed time. Each different thing counts once,
//     and a repetition counts once per week, never per entry.
//  2. A deleted record takes its piece with it, since everything here is
//     read fresh from the records, but a first stays (the registry keeps it).
//  3. The pictures are the ones section 4 lists: a pantry, a garden, a room,
//     a night sky, a day arc, a sharpening lens, a lengthening timeline.
//  4. A picture shows by default over the built-in backgrounds and not over
//     a photo the person added (lib/visualPreferences.ts decides that).
//
// Nothing here scores anybody. No streak, level, point, percentage or
// "in a row"; a week with nothing in it is simply not counted, never a
// break in anything; and no sentence praises or blames. The test sweeps
// every sentence for those words. Signals grows with check-ins, never with
// what was in them, or the app would reward being unwell.
import { MIN_CYCLES_FOR_AVERAGE } from './cycle';
import { addDays, daysBetween } from './eatingVariety';
import { MIN_DAYS_FOR_MEASURED_CHANGE } from './financeAccounts';
import { MIN_MONTHS_FOR_ESTIMATE_CHECK } from './financeIncome';
import { MIN_PATTERN_OCCURRENCES } from './patternBasis';
import { WEEKDAY_MIN_READINGS } from './periodAverages';
import { MIN_USUAL_READINGS } from './yourUsual';

export type ProgressTabPath = '/' | '/food' | '/schedule' | '/log' | '/insights' | '/trends' | '/reports' | '/garden' | '/life';

// ---------------------------------------------------------------------------
// Days
// ---------------------------------------------------------------------------

const PLAIN_DAY = /^\d{4}-\d{2}-\d{2}$/;
const SQLITE_UTC = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Any stored moment reduced to the local day it landed on. A plain date is
 * already a local day and is never passed through Date, which would read it
 * as UTC midnight and put it on the day before west of Greenwich. SQLite's
 * datetime('now') is UTC without a zone, so it gets one before parsing.
 */
export function localDay(value: string | null | undefined): string | null {
  if (!value) return null;
  const text = value.trim();
  if (PLAIN_DAY.test(text)) return text;
  const iso = SQLITE_UTC.test(text) ? `${text.replace(' ', 'T')}Z` : text;
  const when = new Date(iso);
  if (Number.isNaN(when.getTime())) return PLAIN_DAY.test(text.slice(0, 10)) ? text.slice(0, 10) : null;
  return `${when.getFullYear()}-${pad(when.getMonth() + 1)}-${pad(when.getDate())}`;
}

/** The local hour of a stored moment, or null for a plain date. */
export function localHour(value: string | null | undefined): number | null {
  if (!value) return null;
  const text = value.trim();
  if (PLAIN_DAY.test(text)) return null;
  const iso = SQLITE_UTC.test(text) ? `${text.replace(' ', 'T')}Z` : text;
  const when = new Date(iso);
  if (Number.isNaN(when.getTime())) return null;
  return when.getHours() + when.getMinutes() / 60;
}

/** The Monday of a local day's week. */
export function weekOf(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const back = (date.getDay() + 6) % 7;
  return addDays(day, -back);
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Mar 4, 2026": progress spans years, so the year is always said. */
export function spokenDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return `${MONTH_NAMES[m - 1] ?? m} ${d}, ${y}`;
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

// ---------------------------------------------------------------------------
// Inputs, as progressDb.ts gathers them. Every day is already a local day.
// ---------------------------------------------------------------------------

export type Named = { name: string; day: string };
export type FoodEaten = Named & { group: string | null };

export type FirstMet = { key: string; label: string; tab: ProgressTabPath; day: string };

export type FermentKept = { name: string; started: string; stage: string; changed: string | null };
export type PlantingKept = { name: string; area: string; planted: string; status: string; areaRetired: boolean };
export type HarvestMade = Named & { area: string };
export type PileKept = { name: string; started: string; status: string; additions: number };
export type AccountBalances = { name: string; first: string; last: string };
export type TrackerReadings = { name: string; count: number };
export type TimedMark = { day: string; hour: number; kind: 'meal' | 'dose' };
export type ReportKindInput = { label: string; core: string[] };

export type ProgressInputs = {
  today: string;
  firsts: FirstMet[];
  food: {
    wholeFoods: FoodEaten[];
    dishes: Named[];
    strains: Named[];
    mealDays: string[];
    ferments: FermentKept[];
  };
  garden: {
    plantings: PlantingKept[];
    harvests: HarvestMade[];
    piles: PileKept[];
    recordDays: string[];
    harvestYearsByArea: { area: string; years: number }[];
  };
  life: {
    routines: Named[];
    upkeep: Named[];
    movement: Named[];
    routineDays: string[];
    markDays: string[];
    upkeepDays: string[];
    workDays: string[];
    accounts: AccountBalances[];
    incomeStreamMonths: number[];
  };
  signals: {
    checkinDays: string[];
    trackers: Named[];
    trackerEntryDays: string[];
    trackerReadings: TrackerReadings[];
    trials: Named[];
    cycleCount: number;
    hasCycleDays: boolean;
  };
  schedules: {
    doseDays: string[];
    mealDays: string[];
    marks: TimedMark[];
    plannedThenEaten: Named[];
  };
  insights: { mealDays: number; medsAndMealsSameDay: boolean };
  trends: { recordDays: string[]; weightReadings: number; stepDays: number };
  reports: { kinds: ReportKindInput[]; filled: Record<string, boolean> };
  home: { captureDays: string[] };
};

// ---------------------------------------------------------------------------
// Variety: each different thing once, by name
// ---------------------------------------------------------------------------

/** Above this a list of names stops being readable, so a count leads. */
export const VARIETY_LIST_LIMIT = 30;
/** How many of the most recent names follow the count. */
export const VARIETY_RECENT_SHOWN = 8;

export type Variety = {
  title: string;
  count: number;
  /** Every different name, alphabetical, each at its first day. */
  names: Named[];
  sentence: string;
};

export function sameName(name: string): string {
  return name.trim().toLowerCase();
}

/** Each different name once, at the first day it turned up. */
export function distinctByName<T extends Named>(items: T[]): T[] {
  const first = new Map<string, T>();
  for (const item of items) {
    const key = sameName(item.name);
    if (!key) continue;
    const held = first.get(key);
    if (!held || item.day < held.day) first.set(key, { ...item, name: item.name.trim() });
  }
  return [...first.values()];
}

function alphabetical<T extends Named>(items: T[]): T[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}

export function variety(title: string, items: Named[], emptyLine: string): Variety {
  const names = alphabetical(distinctByName(items));
  let sentence: string;
  if (names.length === 0) {
    sentence = emptyLine;
  } else if (names.length <= VARIETY_LIST_LIMIT) {
    sentence = names.map((item) => item.name).join(', ');
  } else {
    const recent = [...names]
      .sort((a, b) => (a.day === b.day ? a.name.localeCompare(b.name) : b.day.localeCompare(a.day)))
      .slice(0, VARIETY_RECENT_SHOWN)
      .map((item) => item.name);
    sentence = `${names.length} different. The most recent: ${recent.join(', ')}.`;
  }
  return { title, count: names.length, names, sentence };
}

// ---------------------------------------------------------------------------
// Weeks kept: a week counts once, however much is in it
// ---------------------------------------------------------------------------

export type WeeksKept = { weeks: number; firstWeek: string | null; sentence: string };

export function weeksKept(what: string, days: string[], emptyLine: string): WeeksKept {
  const weeks = new Set(days.filter(Boolean).map(weekOf));
  if (weeks.size === 0) return { weeks: 0, firstWeek: null, sentence: emptyLine };
  const firstWeek = [...weeks].sort()[0];
  return {
    weeks: weeks.size,
    firstWeek,
    sentence: `${what} in ${plural(weeks.size, 'week', 'different weeks')}, the first in the week of ${spokenDay(firstWeek)}.`,
  };
}

// ---------------------------------------------------------------------------
// Kept alive: how long a living thing has been going
// ---------------------------------------------------------------------------

function elapsed(from: string, to: string): string {
  const days = Math.max(0, daysBetween(from, to));
  if (days === 0) return 'since today';
  if (days < 60) return `for ${plural(days, 'day', 'days')}`;
  const months = Math.floor(days / 30.44);
  if (months < 24) return `for ${plural(months, 'month', 'months')}`;
  return `for ${plural(Math.floor(days / 365.25), 'year', 'years')}`;
}

export function fermentLines(ferments: FermentKept[], today: string): string[] {
  return [...ferments]
    .sort((a, b) => a.started.localeCompare(b.started))
    .map((batch) =>
      batch.stage === 'finished'
        ? `${batch.name}: started ${spokenDay(batch.started)}, finished${batch.changed ? ` ${spokenDay(batch.changed)}` : ''}.`
        : `${batch.name}: going ${elapsed(batch.started, today)}, since ${spokenDay(batch.started)}.`,
    );
}

export function plantingLines(plantings: PlantingKept[], today: string): string[] {
  return [...plantings]
    .filter((planting) => planting.status === 'growing' && !planting.areaRetired)
    .sort((a, b) => a.planted.localeCompare(b.planted))
    .map((planting) => `${planting.name} in ${planting.area}: tended ${elapsed(planting.planted, today)}.`);
}

export function pileLines(piles: PileKept[], today: string): string[] {
  return [...piles]
    .sort((a, b) => a.started.localeCompare(b.started))
    .map((pile) =>
      pile.status === 'finished'
        ? `${pile.name}: finished, started ${spokenDay(pile.started)}.`
        : `${pile.name}: going ${elapsed(pile.started, today)}, with ${plural(pile.additions, 'addition', 'additions')} recorded.`,
    );
}

// ---------------------------------------------------------------------------
// Ready to answer: what an analysis needs, stated plainly
// ---------------------------------------------------------------------------

/** ready is null for a line that states a requirement and counts nothing. */
export type ReadyLine = { text: string; ready: boolean | null };

/** Pattern Finder's requirement, stated without counting any flares. */
export const PATTERN_FINDER_READY_LINE =
  `Pattern Finder can say something about a food once it has turned up before at least ${MIN_PATTERN_OCCURRENCES} flares, with meals logged in the day before each.`;

export function usualRangeLine(what: string, readings: number): ReadyLine {
  if (readings >= MIN_USUAL_READINGS) {
    return { text: `${what}: your usual range can be drawn from the readings so far.`, ready: true };
  }
  return {
    text: `${what}: your usual range shows once there are ${MIN_USUAL_READINGS} readings. There ${readings === 1 ? 'is' : 'are'} ${readings} so far.`,
    ready: false,
  };
}

export function weekdayLine(what: string, readings: number): ReadyLine {
  if (readings >= WEEKDAY_MIN_READINGS) {
    return { text: `${what}: the weekday pattern can be shown.`, ready: true };
  }
  return {
    text: `${what}: a weekday pattern shows once there are ${WEEKDAY_MIN_READINGS} readings. There ${readings === 1 ? 'is' : 'are'} ${readings} so far.`,
    ready: false,
  };
}

export function cycleLine(cycles: number): ReadyLine {
  if (cycles >= MIN_CYCLES_FOR_AVERAGE) return { text: 'The average cycle can be worked out from the cycles recorded.', ready: true };
  return {
    text: `The average cycle shows once ${MIN_CYCLES_FOR_AVERAGE} cycles are recorded, start to start. ${cycles === 0 ? 'None is complete' : `${plural(cycles, 'is', 'are')} complete`} so far.`,
    ready: false,
  };
}

export function accountLine(account: AccountBalances): ReadyLine {
  const span = daysBetween(account.first, account.last);
  if (span >= MIN_DAYS_FOR_MEASURED_CHANGE) {
    return { text: `${account.name}: its measured change can be worked out from the balances recorded.`, ready: true };
  }
  return {
    text: `${account.name}: a measured change shows once recorded balances span ${MIN_DAYS_FOR_MEASURED_CHANGE} days. They span ${plural(Math.max(0, span), 'day', 'days')} so far.`,
    ready: false,
  };
}

export function incomeLine(streamMonths: number[]): ReadyLine | null {
  if (streamMonths.length === 0) return null;
  const most = Math.max(...streamMonths);
  if (most >= MIN_MONTHS_FOR_ESTIMATE_CHECK) {
    return { text: 'An income estimate can be set beside what came in.', ready: true };
  }
  return {
    text: `An income estimate is set beside what came in once one stream's payments span ${MIN_MONTHS_FOR_ESTIMATE_CHECK} months. The longest so far spans ${most}.`,
    ready: false,
  };
}

export function seasonLines(areas: { area: string; years: number }[]): ReadyLine[] {
  return [...areas]
    .sort((a, b) => a.area.localeCompare(b.area))
    .map((entry) =>
      entry.years >= 2
        ? { text: `${entry.area}: one season's harvest can be set beside another.`, ready: true }
        : { text: `A second season in ${entry.area} lets this season be set beside the last.`, ready: false },
    );
}

const CORE_SECTION_WORDS: Record<string, string> = {
  nutrients: 'nutrients',
  flags: 'food flags',
  symptoms: 'symptoms',
  meds: 'medicines',
  movement: 'movement',
  body: 'body measurements',
  rules: 'personal rules',
  labs: 'lab results',
};

export function reportLines(kinds: ReportKindInput[], filled: Record<string, boolean>): ReadyLine[] {
  const lines: ReadyLine[] = [];
  for (const kind of kinds) {
    const checked = kind.core.filter((id) => id in CORE_SECTION_WORDS);
    if (checked.length === 0) continue;
    const empty = checked.filter((id) => !filled[id]);
    lines.push(
      empty.length === 0
        ? { text: `${kind.label}: every section it carries has something in it.`, ready: true }
        : { text: `${kind.label}: nothing recorded yet for ${joinWords(empty.map((id) => CORE_SECTION_WORDS[id]))}.`, ready: false },
    );
  }
  return lines;
}

function joinWords(words: string[]): string {
  if (words.length <= 1) return words.join('');
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

// ---------------------------------------------------------------------------
// The bands of Your Progress, one per tab
// ---------------------------------------------------------------------------

export type ProgressBand = {
  tab: ProgressTabPath;
  firsts: { label: string; day: string }[];
  varieties: Variety[];
  weeks: WeeksKept[];
  keptAlive: string[];
  ready: ReadyLine[];
  /** One plain line for a tab that records nothing of its own. */
  note: string | null;
};

function firstsFor(tab: ProgressTabPath, firsts: FirstMet[]): { label: string; day: string }[] {
  return firsts
    .filter((first) => first.tab === tab)
    .sort((a, b) => (a.day === b.day ? a.label.localeCompare(b.label) : a.day.localeCompare(b.day)))
    .map((first) => ({ label: first.label, day: first.day }));
}

export function buildProgressBands(inputs: ProgressInputs): ProgressBand[] {
  const { today, firsts, food, garden, life, signals, schedules, insights, trends, reports, home } = inputs;

  const homeBand: ProgressBand = {
    tab: '/',
    firsts: firstsFor('/', firsts),
    varieties: [],
    weeks: [weeksKept('Quick notes written', home.captureDays, 'No quick notes written yet.')],
    keptAlive: [],
    ready: [],
    note: null,
  };

  const foodBand: ProgressBand = {
    tab: '/food',
    firsts: firstsFor('/food', firsts),
    varieties: [
      variety('Whole foods eaten', food.wholeFoods, 'No whole foods logged in a meal yet.'),
      variety('Dishes made', food.dishes, 'No named dishes logged yet.'),
      variety('Ferment strains', food.strains, 'No strains added to a ferment yet.'),
    ],
    weeks: [weeksKept('Meals logged', food.mealDays, 'No meals logged yet.')],
    keptAlive: fermentLines(food.ferments, today),
    ready: [],
    note: 'What is recorded here also feeds Insights and Trends.',
  };

  const gardenBand: ProgressBand = {
    tab: '/garden',
    firsts: firstsFor('/garden', firsts),
    varieties: [
      variety('Crops grown', garden.plantings.map((p) => ({ name: p.name, day: p.planted })), 'No plantings recorded yet.'),
      variety('Crops harvested', garden.harvests, 'No harvests recorded yet.'),
    ],
    weeks: [weeksKept('Something recorded in the garden', garden.recordDays, 'Nothing recorded in the garden yet.')],
    keptAlive: [...plantingLines(garden.plantings, today), ...pileLines(garden.piles, today)],
    ready: seasonLines(garden.harvestYearsByArea),
    note: null,
  };

  const lifeReady: ReadyLine[] = life.accounts.map(accountLine);
  const income = incomeLine(life.incomeStreamMonths);
  if (income) lifeReady.push(income);
  const lifeBand: ProgressBand = {
    tab: '/life',
    firsts: firstsFor('/life', firsts),
    varieties: [
      variety('Routines walked through', life.routines, 'No routines walked through yet.'),
      variety('Upkeep jobs done', life.upkeep, 'No upkeep jobs done yet.'),
      variety('Kinds of movement', life.movement, 'No movement logged yet.'),
    ],
    weeks: [
      weeksKept('A routine walked through', life.routineDays, 'No routine walked through yet.'),
      weeksKept('Something marked in Did I Do It', life.markDays, 'Nothing marked in Did I Do It yet.'),
      weeksKept('Upkeep done', life.upkeepDays, 'No upkeep done yet.'),
      weeksKept('A work check-in', life.workDays, 'No work check-ins yet.'),
    ],
    keptAlive: [],
    ready: lifeReady,
    note: null,
  };

  const signalsReady: ReadyLine[] = [{ text: PATTERN_FINDER_READY_LINE, ready: null }];
  if (signals.hasCycleDays) signalsReady.push(cycleLine(signals.cycleCount));
  for (const tracker of [...signals.trackerReadings].sort((a, b) => a.name.localeCompare(b.name))) {
    signalsReady.push(usualRangeLine(tracker.name, tracker.count));
  }
  const signalsBand: ProgressBand = {
    tab: '/log',
    firsts: firstsFor('/log', firsts),
    varieties: [
      variety('New foods tried', signals.trials, 'No new foods tried yet.'),
      variety('Trackers named', signals.trackers, 'No trackers named yet.'),
    ],
    weeks: [
      weeksKept('A check-in made', signals.checkinDays, 'No check-ins yet.'),
      weeksKept('A tracker entry made', signals.trackerEntryDays, 'No tracker entries yet.'),
    ],
    keptAlive: [],
    ready: signalsReady,
    note: null,
  };

  const schedulesBand: ProgressBand = {
    tab: '/schedule',
    firsts: firstsFor('/schedule', firsts),
    varieties: [variety('Planned meals that were then eaten', schedules.plannedThenEaten, 'No planned meals eaten yet.')],
    weeks: [
      weeksKept('A dose marked taken', schedules.doseDays, 'No doses marked taken yet.'),
      weeksKept('A meal placed on the day', schedules.mealDays, 'No meals placed yet.'),
    ],
    keptAlive: [],
    ready: [],
    note: null,
  };

  const insightsBand: ProgressBand = {
    tab: '/insights',
    firsts: firstsFor('/insights', firsts),
    varieties: [],
    weeks: [],
    keptAlive: [],
    ready: [
      insights.mealDays > 0
        ? { text: 'Nutrients has whole days of meals to read against targets.', ready: true }
        : { text: 'Nutrients reads against targets once a day of meals is logged.', ready: false },
      insights.medsAndMealsSameDay
        ? { text: "Today's Advisories has meals and medicines on the same day to read.", ready: true }
        : { text: "Today's Advisories reads once meals and medicines are on the same day.", ready: false },
    ],
    note: null,
  };

  const span = trends.recordDays.length > 0 ? [...trends.recordDays].sort()[0] : null;
  const trendsReady: ReadyLine[] = [];
  if (trends.weightReadings > 0) {
    trendsReady.push(usualRangeLine('Weight', trends.weightReadings), weekdayLine('Weight', trends.weightReadings));
  }
  if (trends.stepDays > 0) {
    trendsReady.push(usualRangeLine('Steps', trends.stepDays), weekdayLine('Steps', trends.stepDays));
  }
  const trendsBand: ProgressBand = {
    tab: '/trends',
    firsts: [],
    varieties: [],
    weeks: [weeksKept('Something recorded anywhere in the app', trends.recordDays, 'Nothing recorded yet.')],
    keptAlive: [],
    ready: trendsReady,
    note: span
      ? `The records now reach back to ${spokenDay(span)}, and every lens here reads from then to today.`
      : 'Trends reads what the other tabs record, so it fills in as they do.',
  };

  const reportsBand: ProgressBand = {
    tab: '/reports',
    firsts: [],
    varieties: [],
    weeks: [],
    keptAlive: [],
    ready: reportLines(reports.kinds, reports.filled),
    note: 'Reports makes documents when asked and keeps no record of having made them.',
  };

  return [homeBand, foodBand, schedulesBand, signalsBand, insightsBand, trendsBand, reportsBand, gardenBand, lifeBand];
}

// ---------------------------------------------------------------------------
// Since you last looked
// ---------------------------------------------------------------------------

/** One key per piece, so two looks can be compared. */
export function progressPieces(inputs: ProgressInputs): Map<string, string> {
  const pieces = new Map<string, string>();
  for (const first of inputs.firsts) pieces.set(`first:${first.key}`, `First: ${first.label.charAt(0).toLowerCase()}${first.label.slice(1)}`);
  const add = (prefix: string, items: Named[], phrase: (name: string) => string) => {
    for (const item of distinctByName(items)) pieces.set(`${prefix}:${sameName(item.name)}`, phrase(item.name));
  };
  add('food', inputs.food.wholeFoods, (name) => `${name} joined the pantry`);
  add('dish', inputs.food.dishes, (name) => `${name} was made for the first time`);
  add('strain', inputs.food.strains, (name) => `${name} went into a ferment`);
  add('crop', inputs.garden.plantings.map((p) => ({ name: p.name, day: p.planted })), (name) => `${name} was planted`);
  add('harvest', inputs.garden.harvests, (name) => `${name} was harvested for the first time`);
  add('routine', inputs.life.routines, (name) => `${name} was walked through for the first time`);
  add('upkeep', inputs.life.upkeep, (name) => `${name} was done for the first time`);
  add('movement', inputs.life.movement, (name) => `${name} was logged for the first time`);
  add('trial', inputs.signals.trials, (name) => `${name} was tried`);
  add('tracker', inputs.signals.trackers, (name) => `A tracker for ${name} was named`);
  return pieces;
}

export const SINCE_LAST_LOOKED_LIMIT = 12;

/**
 * What is new since the stored keys. With nothing stored this is the first
 * look on this device, which lists nothing rather than everything.
 */
export function sinceLastLooked(previous: string[] | null, pieces: Map<string, string>): { lines: string[]; more: number; firstLook: boolean } {
  if (previous === null) return { lines: [], more: 0, firstLook: true };
  const seen = new Set(previous);
  const fresh = [...pieces.entries()].filter(([key]) => !seen.has(key)).map(([, phrase]) => phrase);
  return {
    lines: fresh.slice(0, SINCE_LAST_LOOKED_LIMIT),
    more: Math.max(0, fresh.length - SINCE_LAST_LOOKED_LIMIT),
    firstLook: false,
  };
}

export function sinceLastLookedSentence(result: { lines: string[]; more: number; firstLook: boolean }): string | null {
  if (result.firstLook) return 'From the next visit on, what was added since this page was last opened on this device is listed here.';
  if (result.lines.length === 0) return 'Nothing added since this page was last opened.';
  return result.more > 0 ? `And ${plural(result.more, 'other thing', 'other things')}.` : null;
}
