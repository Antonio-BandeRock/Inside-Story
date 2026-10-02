// Experiments: a trial set up as "make a change, then go back" (Phase B of
// the 2026-09-24 gap review, item 21; extended past foods by F5,
// 2026-10-01).
//
// A plain trial watches what happens after a food is eaten. An experiment
// adds the part that makes a comparison possible: the same number of days
// before, then days with the change, then going back and watching the usual
// observation days. The before period needs nothing new logged, since it is
// read from what was already on record.
//
// The change is a food left out, or since F5 anything else: a bedtime, a
// supplement left out or added, a walk after dinner. A food comes back by
// itself the next time a meal with it is logged; nothing in the app can see
// a bedtime or a walk end, so anything else comes back when the person
// presses Back to Usual.
//
// What the result says is counts per period, the flares and reactions
// logged in each, and for a food how many times it was eaten while it was
// meant to be left out. It never says the change does or does not cause
// anything: one run on one person, with everything else in life also
// changing, describes what happened. EXPERIMENT_LIMIT says so on every
// result, and a second run is what makes a result worth leaning on.
//
// Since F8 (2026-10-01) glucose can be the measure: each period then also
// says how many meals had readings before and after them and how far
// glucose rose after them on average, read by lib/mealGlucose.ts (F10). A
// period with no meal read says so rather than counting as no rise.
//
// Pure: no I/O and no runtime imports (scripts/test_phase_b_patterns.js
// holds it to that), so the one thing taken from lib/mealGlucose.ts is a type.

import type { MealGlucose } from './mealGlucose';

// 'stepped' is F7, a food brought back in three amounts (lib/steppedReintroduction.ts).
export type TrialDesign = 'watch' | 'remove_return' | 'stepped';

// What an experiment is about. Null on rows made before F5, which are all
// foods, so subjectOf reads null as a food.
export type ExperimentSubject = 'food' | 'bedtime' | 'supplement' | 'activity' | 'other';

export const SUBJECT_OPTIONS: { key: Exclude<ExperimentSubject, 'food'>; label: string; example: string }[] = [
  { key: 'bedtime', label: 'A bedtime', example: 'In bed by 10:30' },
  { key: 'supplement', label: 'A supplement', example: 'No evening magnesium' },
  { key: 'activity', label: 'A walk or movement', example: 'A 20 minute walk after dinner' },
  { key: 'other', label: 'Something else', example: 'No screens after 9' },
];

export function subjectOf(kind: string | null | undefined): ExperimentSubject {
  return kind === 'bedtime' || kind === 'supplement' || kind === 'activity' || kind === 'other' ? kind : 'food';
}

export function subjectLabel(kind: string | null | undefined): string {
  const subject = subjectOf(kind);
  return subject === 'food' ? 'A food' : SUBJECT_OPTIONS.find((option) => option.key === subject)!.label;
}

// The title on each evening check-in. "How did today go with In bed by
// 10:30?" does not read, so anything other than a food names the change.
export function experimentCheckinTitle(name: string, kind: string | null | undefined): string {
  return subjectOf(kind) === 'food' ? `How did today go with ${name}?` : `How did today go? Your experiment: ${name}`;
}

export const DEFAULT_REMOVAL_DAYS = 14;
export const REMOVAL_DAY_OPTIONS = [7, 14, 21, 28] as const;

// What the person says they will be watching. Stored as the label; the
// counts come from flares and reactions whatever is picked, and the result
// says that.
export const MEASURE_OPTIONS = [
  'Flares and reactions',
  'Digestion',
  'Energy',
  'Headaches',
  'Joint pain',
  'Mood',
  'Skin',
  'Sleep',
  'Glucose after meals',
] as const;

// F8: the one measure the app reads for itself rather than leaving beside
// the person's notes.
export const GLUCOSE_MEASURE = 'Glucose after meals';

export const GLUCOSE_MEASURE_HINT =
  'Read from the glucose readings a meter or sensor sends through Health Connect. The result gives the rise after meals in each period, and a period with no readings says so.';

export function isGlucoseMeasure(measure: string | null | undefined): boolean {
  return measure === GLUCOSE_MEASURE;
}

export const EXPERIMENT_LIMIT =
  'One run on one person, while everything else in life also changed, so this describes what happened rather than showing a cause. Running it a second time is what makes a result worth leaning on.';

// Said on every result about something other than a food, since a meal log
// shows whether a food was eaten and nothing shows whether a bedtime was kept.
export const NOT_SEEN_LINE =
  'The app cannot see whether the change was kept each day, so this rests on how closely it was.';

// The three periods' names. A food is left out; anything else is a change.
export function periodLabels(subject: ExperimentSubject): { before: string; during: string; back: string } {
  return subject === 'food'
    ? { before: 'Before', during: 'Without it', back: 'Back' }
    : { before: 'Before', during: 'With the change', back: 'Back to usual' };
}

function addDays(date: string, offset: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const moved = new Date(y, m - 1, d + offset);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${moved.getFullYear()}-${pad(moved.getMonth() + 1)}-${pad(moved.getDate())}`;
}

// Whole days from `from` to `to`, both 'YYYY-MM-DD'.
function daysBetween(from: string, to: string): number {
  const [a, b] = [from, to].map((date) => {
    const [y, m, d] = date.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  });
  return Math.round((b - a) / 86400000);
}

// The days with the change run removalDays from the first. Still in them on
// any day before the day after the last.
export function removalEndsOn(removalStartedOn: string, removalDays: number): string {
  return addDays(removalStartedOn, removalDays);
}

export function isInRemoval(removalStartedOn: string | null, removalDays: number | null, today: string): boolean {
  if (!removalStartedOn || !removalDays) return false;
  return today >= removalStartedOn && today < removalEndsOn(removalStartedOn, removalDays);
}

// The line on a trial row while the food is left out or the change is kept.
export function removalProgressLine(
  removalStartedOn: string,
  removalDays: number,
  today: string,
  subject: ExperimentSubject = 'food',
): string {
  const day = daysBetween(removalStartedOn, today) + 1;
  const left = removalDays - day + 1;
  const counted = `day ${day} of ${removalDays}, ${left === 1 ? 'last day' : `${left} days to go`}`;
  return subject === 'food'
    ? `Without it: ${counted}. It comes back the next time it is logged after that.`
    : `With the change: ${counted}. Press Back to Usual once you have gone back to how it was.`;
}

// The line once those days are done and nothing has come back yet.
export function awaitingReturnLine(subject: ExperimentSubject): string {
  return subject === 'food'
    ? 'The days without it are done. It comes back the next time you log or schedule a meal with it.'
    : 'The days with the change are done. Press Back to Usual once you have gone back to how it was.';
}

export type ExperimentPeriod = {
  label: string;
  from: string;
  // Exclusive.
  until: string;
  days: number;
  events: number;
};

export type ExperimentInput = {
  removalStartedOn: string;
  removalDays: number;
  // When the food came back or the person went back; null while not yet.
  returnedOn: string | null;
  observationDays: number;
  today: string;
  // 'YYYY-MM-DD' of each flare or reaction logged.
  eventDates: string[];
  // 'YYYY-MM-DD' of each time the food was logged as eaten. Empty for
  // anything other than a food.
  eatenDates: string[];
  measure: string | null;
  // Missing or null reads as a food.
  subject?: ExperimentSubject | null;
  // F8: every meal with glucose readings near it across the experiment,
  // loaded only when glucose is the measure.
  mealGlucose?: MealGlucose[];
};

function periodOf(label: string, from: string, until: string, today: string, eventDates: string[]): ExperimentPeriod {
  const stop = until < addDays(today, 1) ? until : addDays(today, 1);
  const days = Math.max(0, daysBetween(from, stop));
  const events = eventDates.filter((date) => date >= from && date < stop).length;
  return { label, from, until: stop, days, events };
}

export function experimentPeriods(input: ExperimentInput): ExperimentPeriod[] {
  const beforeFrom = addDays(input.removalStartedOn, -input.removalDays);
  const removalUntil = removalEndsOn(input.removalStartedOn, input.removalDays);
  const labels = periodLabels(subjectOf(input.subject));
  const periods = [
    periodOf(labels.before, beforeFrom, input.removalStartedOn, input.today, input.eventDates),
    periodOf(labels.during, input.removalStartedOn, removalUntil, input.today, input.eventDates),
  ];
  if (input.returnedOn) {
    periods.push(
      periodOf(labels.back, input.returnedOn, addDays(input.returnedOn, input.observationDays), input.today, input.eventDates),
    );
  }
  return periods.filter((period) => period.days > 0);
}

export function eatenDuringRemoval(input: ExperimentInput): number {
  if (subjectOf(input.subject) !== 'food') return 0;
  const until = removalEndsOn(input.removalStartedOn, input.removalDays);
  return input.eatenDates.filter((date) => date >= input.removalStartedOn && date < until).length;
}

function times(n: number): string {
  return n === 1 ? 'once' : n === 2 ? 'twice' : `${n} times`;
}

// The result, one line per period and then the lines that qualify it.
export function experimentResultLines(input: ExperimentInput): string[] {
  const lines = experimentPeriods(input).map(
    (period) =>
      `${period.label} (${period.days} ${period.days === 1 ? 'day' : 'days'}): ${period.events} ${period.events === 1 ? 'flare or reaction' : 'flares and reactions'} logged.`,
  );
  if (subjectOf(input.subject) !== 'food') lines.push(NOT_SEEN_LINE);
  const eaten = eatenDuringRemoval(input);
  if (eaten > 0) {
    lines.push(`It was logged as eaten ${times(eaten)} during the days without it, which blurs the comparison.`);
  }
  if (isGlucoseMeasure(input.measure)) {
    lines.push(...glucoseResultLines(input));
  } else if (input.measure && input.measure !== MEASURE_OPTIONS[0]) {
    lines.push(
      `You set out to watch ${input.measure.toLowerCase()}. The counts above are every flare and reaction logged, so read them beside your notes on that.`,
    );
  }
  lines.push(EXPERIMENT_LIMIT);
  return lines;
}

export type GlucosePeriod = {
  label: string;
  // Meals with a reading before and after them.
  read: number;
  // Meals with readings near them that could not be read.
  unread: number;
  // Average of the rises; null when no meal in the period was read.
  averageRise: number | null;
};

// The rise after meals in each period. A rise below zero counts as it was,
// so the average describes every meal read.
export function glucosePeriods(input: ExperimentInput): GlucosePeriod[] {
  const reads = input.mealGlucose ?? [];
  return experimentPeriods(input).map((period) => {
    const inside = reads.filter((r) => r.meal.day >= period.from && r.meal.day < period.until);
    const rises = inside.flatMap((r) => (r.status === 'read' ? [r.rise] : []));
    return {
      label: period.label,
      read: rises.length,
      unread: inside.length - rises.length,
      averageRise: rises.length ? rises.reduce((sum, rise) => sum + rise, 0) / rises.length : null,
    };
  });
}

export const GLUCOSE_EXPERIMENT_NOTE =
  'Glucose is read around every meal logged in each period, whatever was in it, from the last reading in the hour before to the highest in the three hours after. Activity, sleep, stress, illness and medication move glucose too.';

// The same as formatRise in lib/mealGlucose.ts, which
// scripts/test_glucose_experiment.js checks: "2.1 mmol/L (38 mg/dL)".
export function formatGlucoseRise(mmol: number): string {
  const value = Math.abs(mmol);
  return `${Math.round(value * 10) / 10} mmol/L (${Math.round(value * 18.016)} mg/dL)`;
}

function meals(n: number): string {
  return `${n} ${n === 1 ? 'meal' : 'meals'}`;
}

export function glucoseResultLines(input: ExperimentInput): string[] {
  const periods = glucosePeriods(input);
  if (!periods.some((period) => period.read + period.unread > 0)) {
    return [
      'You set out to watch glucose after meals. No glucose readings came in around any meal in these periods, so there is nothing to compare yet.',
    ];
  }
  const lines = periods.map((period) => {
    const unread =
      period.unread > 0
        ? ` ${period.unread} more ${period.unread === 1 ? 'meal' : 'meals'} had readings that could not be read.`
        : '';
    if (period.averageRise === null) {
      return `${period.label}, glucose: no meal with readings before and after.${unread}`;
    }
    const change =
      period.averageRise <= 0
        ? 'did not rise above the level before on average'
        : `rose by ${formatGlucoseRise(period.averageRise)} on average`;
    return `${period.label}, glucose: ${meals(period.read)} read; after them it ${change}.${unread}`;
  });
  if (periods.some((period) => period.read > 0 && period.read < 3)) {
    lines.push('A period with only one or two meals read rests on very little.');
  }
  lines.push(GLUCOSE_EXPERIMENT_NOTE);
  return lines;
}
