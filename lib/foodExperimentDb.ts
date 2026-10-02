// Reads what an experiment's result is counted from (see
// lib/foodExperiment.ts for what it says). Nothing here writes.

import { getDatabase, listCheckins, type FoodTrialRecord } from './db';
import { experimentResultLines, removalEndsOn, subjectOf, type ExperimentInput } from './foodExperiment';
import {
  DEFAULT_STEP_DAYS,
  DEFAULT_WASHOUT_DAYS,
  steppedResultLines,
  type RecordedStep,
  type SteppedResultInput,
} from './steppedReintroduction';

function localToday(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export async function readExperimentInput(trial: FoodTrialRecord): Promise<ExperimentInput | null> {
  if (trial.design !== 'remove_return' || !trial.removalStartedOn || !trial.removalDays) return null;
  const [flares, reactions] = await Promise.all([
    listCheckins({ checkinType: 'flare', limit: 500 }),
    listCheckins({ checkinType: 'post_meal', limit: 500 }),
  ]);
  const db = await getDatabase();
  const subject = subjectOf(trial.subjectKind);
  const eaten =
    subject === 'food' && trial.foodId != null && trial.source
      ? await db.getAllAsync<{ eatenAt: string }>(
          `SELECT m.eaten_at AS eatenAt FROM meal_items mi JOIN meals m ON m.id = mi.meal_id
           WHERE mi.food_id = ? AND m.eaten_at >= ? AND m.eaten_at < ?`,
          `${trial.foodId}|${trial.source}`,
          trial.removalStartedOn,
          removalEndsOn(trial.removalStartedOn, trial.removalDays),
        )
      : [];
  return {
    removalStartedOn: trial.removalStartedOn,
    removalDays: trial.removalDays,
    returnedOn: trial.status === 'waiting' ? null : trial.startedAt.slice(0, 10),
    observationDays: trial.observationDays,
    today: localToday(),
    eventDates: [...flares, ...reactions].map((checkin) => checkin.loggedAt.slice(0, 10)),
    eatenDates: eaten.map((row) => row.eatenAt.slice(0, 10)),
    measure: trial.measure,
    subject,
  };
}

// F7: a stepped reintroduction, read from its recorded steps. Null until
// the first step is recorded.
export async function readSteppedInput(trial: FoodTrialRecord): Promise<SteppedResultInput | null> {
  if (trial.design !== 'stepped') return null;
  const db = await getDatabase();
  const steps = await db.getAllAsync<RecordedStep>(
    'SELECT step, started_on AS startedOn FROM trial_steps WHERE trial_id = ? ORDER BY started_on, created_at',
    trial.id,
  );
  if (!steps.length) return null;
  const [flares, reactions] = await Promise.all([
    listCheckins({ checkinType: 'flare', limit: 500 }),
    listCheckins({ checkinType: 'post_meal', limit: 500 }),
  ]);
  const eaten =
    trial.foodId != null && trial.source
      ? await db.getAllAsync<{ eatenAt: string }>(
          `SELECT m.eaten_at AS eatenAt FROM meal_items mi JOIN meals m ON m.id = mi.meal_id
           WHERE mi.food_id = ? AND m.eaten_at >= ?`,
          `${trial.foodId}|${trial.source}`,
          steps[0].startedOn,
        )
      : [];
  return {
    steps,
    stepDays: trial.stepDays ?? DEFAULT_STEP_DAYS,
    washoutDays: trial.washoutDays ?? DEFAULT_WASHOUT_DAYS,
    today: localToday(),
    amounts: { small: trial.amountSmall, medium: trial.amountMedium, large: trial.amountLarge },
    eventDates: [...flares, ...reactions].map((checkin) => checkin.loggedAt.slice(0, 10)),
    eatenDates: eaten.map((row) => row.eatenAt.slice(0, 10)),
  };
}

export async function readExperimentResult(trial: FoodTrialRecord): Promise<string[] | null> {
  if (trial.design === 'stepped') {
    const stepped = await readSteppedInput(trial);
    return stepped ? steppedResultLines(stepped) : null;
  }
  const input = await readExperimentInput(trial);
  return input ? experimentResultLines(input) : null;
}
