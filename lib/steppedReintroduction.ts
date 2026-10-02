// Stepped reintroduction, F7 (2026-10-01).
//
// One food brought back in three amounts, small, medium and large, each
// kept for a set number of days, then a washout with none of it. Each step
// is read on its own: the flares and reactions logged during it, beside a
// stretch before the first step of the same length as the washout.
//
// The person says when each step starts by pressing its button, so nothing
// here begins from a meal being logged. A step's days are what the person
// chose; a step ends when the next one is recorded, and the washout ends
// after its days.
//
// Pure, no I/O, so scripts/test_stepped_reintroduction.js can run it.

import { EXPERIMENT_LIMIT } from './foodExperiment';

export type StepKey = 'small' | 'medium' | 'large' | 'washout';
export type EatingStep = Exclude<StepKey, 'washout'>;

export const EATING_STEPS: EatingStep[] = ['small', 'medium', 'large'];
export const STEP_DAY_OPTIONS = [1, 2, 3] as const;
export const WASHOUT_DAY_OPTIONS = [2, 3, 5, 7] as const;
export const DEFAULT_STEP_DAYS = 1;
export const DEFAULT_WASHOUT_DAYS = 3;

export type RecordedStep = {
  step: StepKey;
  // Local 'YYYY-MM-DD'.
  startedOn: string;
};

export type StepAmounts = {
  small?: string | null;
  medium?: string | null;
  large?: string | null;
};

const STEP_WORD: Record<EatingStep, string> = { small: 'small', medium: 'medium', large: 'large' };

function addDays(date: string, offset: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const moved = new Date(y, m - 1, d + offset);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${moved.getFullYear()}-${pad(moved.getMonth() + 1)}-${pad(moved.getDate())}`;
}

function daysBetween(from: string, to: string): number {
  const [a, b] = [from, to].map((date) => {
    const [y, m, d] = date.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  });
  return Math.round((b - a) / 86400000);
}

function times(n: number): string {
  if (n === 1) return 'once';
  if (n === 2) return 'twice';
  return `${n} times`;
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

// "Small amount" or "Small amount (1/4 cup)".
export function stepLabel(step: StepKey, amounts: StepAmounts = {}): string {
  if (step === 'washout') return 'Washout, none of it';
  const word = STEP_WORD[step];
  const amount = amounts[step]?.trim();
  const label = `${word.charAt(0).toUpperCase()}${word.slice(1)} amount`;
  return amount ? `${label} (${amount})` : label;
}

// In the order they were recorded, one of each at most.
export function orderedSteps(steps: RecordedStep[]): RecordedStep[] {
  const seen = new Set<StepKey>();
  const rank: Record<StepKey, number> = { small: 0, medium: 1, large: 2, washout: 3 };
  return [...steps]
    .sort((a, b) => a.startedOn.localeCompare(b.startedOn) || rank[a.step] - rank[b.step])
    .filter((entry) => {
      if (seen.has(entry.step)) return false;
      seen.add(entry.step);
      return true;
    });
}

export function lastStep(steps: RecordedStep[]): RecordedStep | null {
  const ordered = orderedSteps(steps);
  return ordered.length ? ordered[ordered.length - 1] : null;
}

// What the next button records: the next amount, the washout, or nothing
// once the washout has begun.
export function nextStep(steps: RecordedStep[]): StepKey | null {
  const last = lastStep(steps);
  if (!last) return 'small';
  if (last.step === 'small') return 'medium';
  if (last.step === 'medium') return 'large';
  if (last.step === 'large') return 'washout';
  return null;
}

// "Stop here and start the washout" is offered during the small and medium
// steps; after the large one the washout is the next step anyway.
export function canStopEarly(steps: RecordedStep[]): boolean {
  const last = lastStep(steps);
  return last?.step === 'small' || last?.step === 'medium';
}

export function nextStepButton(step: StepKey): string {
  return step === 'washout' ? 'Start the washout' : `Had the ${STEP_WORD[step]} amount today`;
}

export function washoutDone(steps: RecordedStep[], washoutDays: number, today: string): boolean {
  const last = lastStep(steps);
  return last?.step === 'washout' && daysBetween(last.startedOn, today) >= washoutDays;
}

export type SteppedProgressInput = {
  steps: RecordedStep[];
  stepDays: number;
  washoutDays: number;
  today: string;
  amounts?: StepAmounts;
};

// The line on the trial row saying where the reintroduction is.
export function steppedProgressLine(input: SteppedProgressInput): string {
  const amounts = input.amounts ?? {};
  const last = lastStep(input.steps);
  if (!last) {
    return `Waiting to start: press ${nextStepButton('small')} on the day you eat the ${stepLabel('small', amounts).toLowerCase()}.`;
  }
  const day = daysBetween(last.startedOn, input.today) + 1;
  if (last.step === 'washout') {
    if (day > input.washoutDays) return 'Washout done. Mark No problems or Flag it.';
    return `${stepLabel('washout')}: day ${day} of ${input.washoutDays}.`;
  }
  const following = nextStep(input.steps);
  const then = following === 'washout' ? 'Next, the washout.' : `Next, the ${following} amount.`;
  if (day > input.stepDays) {
    return `${stepLabel(last.step, amounts)}: its ${plural(input.stepDays, 'day', 'days')} ${input.stepDays === 1 ? 'is' : 'are'} done. ${then}`;
  }
  return `${stepLabel(last.step, amounts)}: day ${day} of ${input.stepDays}. ${then}`;
}

export type SteppedPeriod = {
  label: string;
  from: string;
  // Exclusive.
  until: string;
  days: number;
  events: number;
};

export type SteppedResultInput = SteppedProgressInput & {
  // 'YYYY-MM-DD' of each flare or reaction logged.
  eventDates: string[];
  // 'YYYY-MM-DD' of each time the food was logged as eaten.
  eatenDates: string[];
};

function periodOf(label: string, from: string, until: string, today: string, eventDates: string[]): SteppedPeriod {
  const tomorrow = addDays(today, 1);
  const stop = until < tomorrow ? until : tomorrow;
  const days = Math.max(0, daysBetween(from, stop));
  const events = eventDates.filter((date) => date >= from && date < stop).length;
  return { label, from, until: stop, days, events };
}

// Before, then each recorded step. An eating step runs until the next step
// was recorded (or until today while it is the last); the washout runs for
// its days.
export function steppedPeriods(input: SteppedResultInput): SteppedPeriod[] {
  const amounts = input.amounts ?? {};
  const ordered = orderedSteps(input.steps);
  if (!ordered.length) return [];
  const first = ordered[0].startedOn;
  const periods = [periodOf('Before', addDays(first, -input.washoutDays), first, input.today, input.eventDates)];
  ordered.forEach((entry, index) => {
    const until =
      entry.step === 'washout'
        ? addDays(entry.startedOn, input.washoutDays)
        : (ordered[index + 1]?.startedOn ?? addDays(input.today, 1));
    periods.push(periodOf(stepLabel(entry.step, amounts), entry.startedOn, until, input.today, input.eventDates));
  });
  return periods.filter((period) => period.days > 0);
}

export function eatenDuringWashout(input: SteppedResultInput): number {
  const washout = orderedSteps(input.steps).find((entry) => entry.step === 'washout');
  if (!washout) return 0;
  const until = addDays(washout.startedOn, input.washoutDays);
  return input.eatenDates.filter((date) => date >= washout.startedOn && date < until).length;
}

function joinWords(words: string[]): string {
  if (words.length <= 1) return words.join('');
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

export function steppedResultLines(input: SteppedResultInput): string[] {
  const ordered = orderedSteps(input.steps);
  if (!ordered.length) return [];
  const lines = steppedPeriods(input).map(
    (period) =>
      `${period.label} (${plural(period.days, 'day', 'days')}): ${period.events} ${period.events === 1 ? 'flare or reaction' : 'flares and reactions'} logged.`,
  );
  const eaten = ordered.filter((entry) => entry.step !== 'washout').map((entry) => entry.step as EatingStep);
  const hasWashout = ordered.some((entry) => entry.step === 'washout');
  if (hasWashout && eaten.length < EATING_STEPS.length) {
    const lastEaten = eaten[eaten.length - 1];
    const skipped = EATING_STEPS.slice(eaten.length);
    lines.push(
      `Stopped after the ${lastEaten} amount, so the ${joinWords(skipped)} ${skipped.length === 1 ? 'amount was' : 'amounts were'} not tried.`,
    );
  }
  if (eaten.length >= 2) {
    lines.push(
      'Each step follows the one before, so something logged during a step may be carrying over from the step before it.',
    );
  }
  const washoutEaten = eatenDuringWashout(input);
  if (washoutEaten > 0) {
    lines.push(`It was logged as eaten ${times(washoutEaten)} during the washout, which blurs it.`);
  }
  lines.push(EXPERIMENT_LIMIT);
  return lines;
}

// Where it stands, for a report row.
export function steppedStage(steps: RecordedStep[], washoutDays: number, today: string, status: string): string {
  const last = lastStep(steps);
  if (!last) return 'not started yet';
  if (status === 'cleared' || status === 'flagged') return 'finished';
  if (last.step === 'washout') return washoutDone(steps, washoutDays, today) ? 'washout done' : 'in the washout';
  return `at the ${last.step} amount`;
}
