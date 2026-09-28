// Home's Start a Workout card, H11 part 4. What is planned for today on
// Schedules > Exercise comes first, each with the one thing to do about it,
// and after it the workouts on Life > Workouts, the most recently done
// first. Nothing here counts days in a row or says how often anything was
// done, only when it was last done.
//
// Pure, with no database or React, so scripts/test_exercise_plan.js can
// check it without a phone. The card is components/StartWorkoutCard.tsx.

import { entryStatusLine, planDays, type ExercisePlan, type PlanEntry, type PlanMark } from './exercisePlan';

export type CardWorkout = { id: string; name: string; stepCount: number };

export type TodayItem = {
  entry: PlanEntry;
  status: string;
  /** Start opens the player; mark writes "Did it"; none when the day is marked. */
  action: 'start' | 'mark' | 'none';
};

export type OtherWorkout = { id: string; name: string; line: string };

export type StartWorkoutCardModel = {
  today: TodayItem[];
  others: OtherWorkout[];
  /** Workouts left off the card, counted so the link can say so. */
  heldBack: number;
  /** Set when there is nothing to start and nothing planned. */
  emptyLine: string | null;
};

export const OTHERS_LIMIT = 4;

export const EMPTY_LINE =
  'No workouts yet. Build one on Life > Workouts from the exercise library, with the sets, reps or time and rest for each, then start it here one set at a time.';

function dayNumber(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000;
}

/** "Last done today", "Last done yesterday", "Last done 4 days ago", or "Not done yet". */
export function lastDoneLine(finishedAt: string | null, now: Date): string {
  if (!finishedAt) return 'Not done yet';
  const then = new Date(finishedAt);
  if (!Number.isFinite(then.getTime())) return 'Done before';
  const days = dayNumber(now) - dayNumber(then);
  if (days <= 0) return 'Last done today';
  if (days === 1) return 'Last done yesterday';
  return `Last done ${days} days ago`;
}

export function exerciseCountText(count: number): string {
  return count === 1 ? '1 exercise' : `${count} exercises`;
}

export function startWorkoutCard(input: {
  plans: readonly ExercisePlan[];
  marks: readonly PlanMark[];
  workouts: readonly CardWorkout[];
  /** workout id to the newest finished_at of its sessions */
  lastDone: ReadonlyMap<string, string>;
  today: string;
  now: Date;
}): StartWorkoutCardModel {
  const names = new Map(input.workouts.map((workout) => [workout.id, workout.name]));
  const startable = new Set(input.workouts.filter((workout) => workout.stepCount > 0).map((workout) => workout.id));
  const days = planDays(input.plans, input.marks, names, input.today, input.today);
  const today: TodayItem[] = (days[0]?.entries ?? []).map((entry) => {
    const status = entryStatusLine(entry, input.today);
    if (entry.mark) return { entry, status, action: 'none' };
    if (entry.plan.workoutId) {
      return { entry, status, action: startable.has(entry.plan.workoutId) ? 'start' : 'none' };
    }
    return { entry, status, action: 'mark' };
  });
  const plannedToday = new Set(today.map((item) => item.entry.plan.workoutId).filter((id): id is string => Boolean(id)));
  const rest = input.workouts
    .filter((workout) => workout.stepCount > 0 && !plannedToday.has(workout.id))
    .sort((a, b) => {
      const at = input.lastDone.get(a.id) ?? '';
      const bt = input.lastDone.get(b.id) ?? '';
      if (at !== bt) return at < bt ? 1 : -1;
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
  const others = rest.slice(0, OTHERS_LIMIT).map((workout) => ({
    id: workout.id,
    name: workout.name,
    line: `${exerciseCountText(workout.stepCount)}. ${lastDoneLine(input.lastDone.get(workout.id) ?? null, input.now)}`,
  }));
  const nothing = today.length === 0 && others.length === 0;
  const onlyEmpty = input.workouts.length > 0 && input.workouts.every((workout) => workout.stepCount === 0);
  return {
    today,
    others,
    heldBack: rest.length - others.length,
    emptyLine: nothing
      ? onlyEmpty
        ? 'A workout needs at least one exercise before it can be started. Add them on Life > Workouts.'
        : EMPTY_LINE
      : null,
  };
}
