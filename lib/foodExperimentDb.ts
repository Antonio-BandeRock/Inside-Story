// Reads what an experiment's result is counted from (see
// lib/foodExperiment.ts for what it says). Nothing here writes.

import { getDatabase, listCheckins, type FoodTrialRecord } from './db';
import { experimentResultLines, removalEndsOn, type ExperimentInput } from './foodExperiment';

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
  const eaten =
    trial.foodId != null && trial.source
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
  };
}

export async function readExperimentResult(trial: FoodTrialRecord): Promise<string[] | null> {
  const input = await readExperimentInput(trial);
  return input ? experimentResultLines(input) : null;
}
