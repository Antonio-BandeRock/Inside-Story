// Movement beside symptoms, week by week (2026-09-14).
//
// The same shape as lib/workMeaning.ts's strain comparison, for the steps
// the phone's health store brought in: weeks with fewer steps a day than the
// person's average on one side, weeks with more on the other, and the flares
// or reactions logged in each. It says which side had more, and nothing
// about why. The direction is deliberately left open in the wording, since
// a low-step week can be the cause of a flare, the result of one, or
// neither, and this much data cannot tell those apart.
//
// A week only takes part when enough of its days were recorded. A week
// where the phone counted one day is not a week; it is one day and six
// unknowns, and treating the missing six as zero would put an ordinary week
// into the "less movement" group for no reason.

import { MIN_WEEKS_FOR_STRAIN_PATTERN, MIN_WEEKS_PER_GROUP, weekOf } from './workMeaning';

export type MovementWeek = {
  weekOf: string;
  /** Average over the days that were recorded, not over seven. */
  stepsPerDay: number;
  daysRecorded: number;
};

export type MovementComparison = {
  lowerWeeks: number;
  higherWeeks: number;
  /** Weeks sitting exactly on the average, in neither group. */
  setAside: number;
  /** The person's average across the weeks that took part. */
  averageStepsPerDay: number;
  symptomsPerWeekWhenLower: number;
  symptomsPerWeekWhenHigher: number;
  /** Lower minus higher. Positive means more symptoms in the weeks with
   *  fewer steps. */
  difference: number;
  /** Big enough to be worth a sentence rather than noise. */
  notable: boolean;
};

export type MovementRefusal = {
  reason: 'noSteps' | 'notEnoughWeeks' | 'noVariation' | 'groupTooSmall' | 'noSymptoms';
  weeksRecorded: number;
};

/** A week needs this many recorded days before its average means anything. */
export const MIN_DAYS_PER_WEEK = 4;
/** Same judgment call as work strain: below this gap in flares or reactions
 *  a week, the two groups are the same as far as anyone can tell. */
export const NOTABLE_STEP_DIFFERENCE = 0.5;

/** Groups daily step counts into weeks and drops the weeks too thin to
 *  count. Days come in as recorded, so a missing day is absent rather than
 *  zero. */
export function weeksFromDailySteps(days: { date: string; stepCount: number }[]): MovementWeek[] {
  const byWeek = new Map<string, { total: number; days: number }>();
  for (const day of days) {
    const week = weekOf(day.date);
    const entry = byWeek.get(week) ?? { total: 0, days: 0 };
    entry.total += day.stepCount;
    entry.days += 1;
    byWeek.set(week, entry);
  }
  return [...byWeek.entries()]
    .filter(([, entry]) => entry.days >= MIN_DAYS_PER_WEEK)
    .map(([week, entry]) => ({ weekOf: week, stepsPerDay: entry.total / entry.days, daysRecorded: entry.days }))
    .sort((a, b) => a.weekOf.localeCompare(b.weekOf));
}

export function compareMovementAgainstSymptoms(input: {
  weeks: MovementWeek[];
  symptomsByWeek: Map<string, number>;
}): MovementComparison | MovementRefusal {
  const usable = input.weeks;
  if (usable.length === 0) return { reason: 'noSteps', weeksRecorded: 0 };
  if (usable.length < MIN_WEEKS_FOR_STRAIN_PATTERN) {
    return { reason: 'notEnoughWeeks', weeksRecorded: usable.length };
  }
  const symptomsOf = (week: MovementWeek) => input.symptomsByWeek.get(week.weekOf) ?? 0;
  if (!usable.some((week) => symptomsOf(week) > 0)) {
    return { reason: 'noSymptoms', weeksRecorded: usable.length };
  }

  const mean = usable.reduce((sum, week) => sum + week.stepsPerDay, 0) / usable.length;
  if (!usable.some((week) => week.stepsPerDay !== usable[0].stepsPerDay)) {
    return { reason: 'noVariation', weeksRecorded: usable.length };
  }

  let lowerWeeks = 0;
  let lowerTotal = 0;
  let higherWeeks = 0;
  let higherTotal = 0;
  let setAside = 0;
  for (const week of usable) {
    if (week.stepsPerDay === mean) {
      setAside += 1;
      continue;
    }
    if (week.stepsPerDay < mean) {
      lowerWeeks += 1;
      lowerTotal += symptomsOf(week);
    } else {
      higherWeeks += 1;
      higherTotal += symptomsOf(week);
    }
  }
  if (lowerWeeks < MIN_WEEKS_PER_GROUP || higherWeeks < MIN_WEEKS_PER_GROUP) {
    return { reason: 'groupTooSmall', weeksRecorded: usable.length };
  }

  const perLower = lowerTotal / lowerWeeks;
  const perHigher = higherTotal / higherWeeks;
  return {
    lowerWeeks,
    higherWeeks,
    setAside,
    averageStepsPerDay: mean,
    symptomsPerWeekWhenLower: perLower,
    symptomsPerWeekWhenHigher: perHigher,
    difference: perLower - perHigher,
    notable: Math.abs(perLower - perHigher) >= NOTABLE_STEP_DIFFERENCE,
  };
}

export function isMovementRefusal(value: MovementComparison | MovementRefusal): value is MovementRefusal {
  return 'reason' in value;
}

export function describeMovementRefusal(refusal: MovementRefusal): string {
  switch (refusal.reason) {
    case 'noSteps':
      return `No week with ${MIN_DAYS_PER_WEEK} or more recorded days of steps in this range. Life > Movement brings steps in from the phone's health store; without that there is nothing to put beside your symptoms.`;
    case 'notEnoughWeeks':
      return `${refusal.weeksRecorded} of the ${MIN_WEEKS_FOR_STRAIN_PATTERN} recorded weeks needed. Below that there is nothing to split into a quieter half and a busier one.`;
    case 'noSymptoms':
      return 'No flares or reactions logged in the weeks with steps recorded, so there is nothing to compare them against. That is good news rather than a gap.';
    case 'noVariation':
      return 'Every recorded week has landed on the same daily average, so there is no quieter half and no busier half to tell apart.';
    case 'groupTooSmall':
      return `Not enough weeks on both sides yet. Each side needs at least ${MIN_WEEKS_PER_GROUP}, and so far one of them has fewer.`;
  }
}

export function describeMovementComparison(comparison: MovementComparison): string {
  const average = Math.round(comparison.averageStepsPerDay).toLocaleString();
  const lower = comparison.symptomsPerWeekWhenLower.toFixed(1);
  const higher = comparison.symptomsPerWeekWhenHigher.toFixed(1);
  const base = `Your average is ${average} steps a day. In the ${comparison.lowerWeeks} weeks below it, ${lower} flares or reactions a week. In the ${comparison.higherWeeks} weeks above it, ${higher}.`;
  if (!comparison.notable) {
    return `${base} Close enough that this does not say anything either way.`;
  }
  const direction =
    comparison.difference > 0
      ? 'More in the quieter weeks. A flare can keep someone off their feet as easily as sitting still can precede one, and this cannot tell which.'
      : 'More in the busier weeks. Doing more can wear someone down, or a good week can simply be one where more got done; this cannot tell which.';
  return `${base} ${direction}`;
}

export const MOVEMENT_CAVEAT =
  'This is your weeks side by side and nothing more. Steps are one rough measure of movement, they say nothing about how hard any of it was, and a handful of weeks split two ways will sometimes look meaningful by luck. A pattern worth mentioning to someone is as far as this goes.';
