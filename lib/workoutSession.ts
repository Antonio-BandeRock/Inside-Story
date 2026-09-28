// Doing a workout, one set at a time (H11 part 2). Everything the player at
// app/workout.tsx decides or says, with no React and no database, so
// scripts/test_workout_session.js can check it without a phone.
//
// A workout is laid out as a list of sets in the order they are done: every
// set of the first exercise, then every set of the next. An exercise done on
// each side becomes two sets per round, left then right, and the rest comes
// after the right side, since resting between two sides of one round is not
// what anybody means by rest between sets.
//
// Planned against done. The plan is what the workout says; what was done is
// what the person enters as they go, starting from the plan so a set done as
// planned is one tap. Nothing here says a set was too little or too much:
// the comparison lists both and stops there.

import type { ExerciseMeasure } from './exerciseLibrary';
import { formatSeconds } from './exerciseLibrary';
import type { ExerciseView, Workout } from './workouts';

export type Side = 'left' | 'right';

export type SessionSet = {
  key: string;
  stepId: string;
  stepIndex: number;
  exerciseName: string;
  setNumber: number;
  setCount: number;
  side: Side | null;
  measure: ExerciseMeasure;
  plannedReps: number | null;
  plannedSeconds: number | null;
  plannedWeight: number | null;
  weightUnit: string | null;
  /** Seconds of rest once this set is done; null when none follows it. */
  restAfter: number | null;
  note: string | null;
};

export type SetResult = {
  key: string;
  status: 'done' | 'skipped';
  reps: number | null;
  seconds: number | null;
  weight: number | null;
  at: string;
};

export function buildSessionSets(
  workout: Workout,
  resolve: (source: 'library' | 'custom', id: string) => ExerciseView | null,
  missingName: (stepId: string) => string,
): SessionSet[] {
  const sets: SessionSet[] = [];
  workout.steps.forEach((step, stepIndex) => {
    const exercise = resolve(step.source, step.exerciseId);
    const name = exercise?.name ?? missingName(step.id);
    const measure: ExerciseMeasure = step.reps != null ? 'reps' : step.seconds != null ? 'time' : exercise?.measure ?? 'reps';
    const count = Math.max(1, step.sets);
    const sides: (Side | null)[] = step.perSide ? ['left', 'right'] : [null];
    for (let setNumber = 1; setNumber <= count; setNumber += 1) {
      sides.forEach((side, sideIndex) => {
        const lastSideOfRound = sideIndex === sides.length - 1;
        const rest = step.restSeconds != null && step.restSeconds > 0 ? step.restSeconds : null;
        sets.push({
          key: `${step.id}:${setNumber}:${side ?? 'both'}`,
          stepId: step.id,
          stepIndex,
          exerciseName: name,
          setNumber,
          setCount: count,
          side,
          measure,
          plannedReps: measure === 'reps' ? step.reps ?? 10 : null,
          plannedSeconds: measure === 'time' ? step.seconds ?? 30 : null,
          plannedWeight: step.weight != null && step.weight > 0 ? step.weight : null,
          weightUnit: step.weightUnit,
          restAfter: lastSideOfRound && setNumber < count ? rest : null,
          note: step.note,
        });
      });
    }
  });
  return sets;
}

/** "Set 2 of 3, left side". */
export function setHeading(set: SessionSet): string {
  const base = set.setCount <= 1 ? 'One set' : `Set ${set.setNumber} of ${set.setCount}`;
  return set.side ? `${base}, ${set.side} side` : base;
}

function weightText(weight: number | null, unit: string | null): string | null {
  return weight != null && weight > 0 ? `${weight} ${unit || 'kg'}` : null;
}

/** What the plan asks for this set: "10 times, 8 kg" or "30 seconds". */
export function plannedLine(set: SessionSet): string {
  const amount = set.measure === 'reps' ? `${set.plannedReps ?? 0} times` : formatSeconds(set.plannedSeconds ?? 0);
  const weight = weightText(set.plannedWeight, set.weightUnit);
  return weight ? `${amount}, ${weight}` : amount;
}

/** The starting values for what was done, which are the plan's. */
export function resultFromPlan(set: SessionSet): Omit<SetResult, 'status' | 'at'> {
  return {
    key: set.key,
    reps: set.plannedReps,
    seconds: set.plannedSeconds,
    weight: set.plannedWeight,
  };
}

/** Where to go after the set at `index`: the next set, or null at the end. */
export function nextIndex(sets: readonly SessionSet[], index: number): number | null {
  return index + 1 < sets.length ? index + 1 : null;
}

/** The first set of the next exercise, for "Skip the rest of this exercise". */
export function nextExerciseIndex(sets: readonly SessionSet[], index: number): number | null {
  const current = sets[index];
  if (!current) return null;
  for (let at = index + 1; at < sets.length; at += 1) {
    if (sets[at].stepIndex !== current.stepIndex) return at;
  }
  return null;
}

/** "Exercise 2 of 5". */
export function exerciseProgressLine(sets: readonly SessionSet[], index: number): string {
  const current = sets[index];
  const total = sets.length === 0 ? 0 : sets[sets.length - 1].stepIndex + 1;
  if (!current) return '';
  return `Exercise ${current.stepIndex + 1} of ${total}`;
}

/** What comes after the set at `index`, for the rest screen. */
export function upNextLine(sets: readonly SessionSet[], index: number): string | null {
  const next = sets[index + 1];
  if (!next) return null;
  return `Next: ${next.exerciseName}, ${setHeading(next).toLowerCase()}, ${plannedLine(next)}`;
}

/** Whole seconds left on a timer ending at `endsAt`, never below zero. */
export function secondsLeft(endsAt: number, now: number): number {
  return Math.max(0, Math.ceil((endsAt - now) / 1000));
}

/** "1:05", for a timer counting. */
export function clockText(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(whole / 60);
  const rest = whole % 60;
  return `${minutes}:${rest < 10 ? '0' : ''}${rest}`;
}

/** A whole number from what was typed, or null. */
export function parseCount(text: string): number | null {
  const value = Number(text.replace(',', '.').trim());
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value);
}

/** A weight from what was typed, to one decimal place, or null. */
export function parseWeight(text: string): number | null {
  const trimmed = text.replace(',', '.').trim();
  if (trimmed === '') return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 10) / 10;
}

// The finished workout.

function doneAmount(set: SessionSet, result: SetResult): string {
  return set.measure === 'reps' ? `${result.reps ?? 0}` : formatSeconds(result.seconds ?? 0);
}

export type ExerciseComparison = {
  stepId: string;
  name: string;
  planned: string;
  done: string;
};

/**
 * One line pair per exercise: what was planned and what was done. A set
 * nobody reached is left out of what was done rather than counted as zero,
 * and said so.
 */
export function compareExercises(sets: readonly SessionSet[], results: Readonly<Record<string, SetResult>>): ExerciseComparison[] {
  const byStep = new Map<string, SessionSet[]>();
  for (const set of sets) {
    const list = byStep.get(set.stepId) ?? [];
    list.push(set);
    byStep.set(set.stepId, list);
  }
  const lines: ExerciseComparison[] = [];
  for (const [stepId, stepSets] of byStep) {
    const first = stepSets[0];
    const sidesPerRound = first.side ? 2 : 1;
    const plannedEach = first.measure === 'reps' ? `${first.plannedReps ?? 0}` : formatSeconds(first.plannedSeconds ?? 0);
    const plannedWeight = weightText(first.plannedWeight, first.weightUnit);
    const sideWord = first.side ? ' each side' : '';
    const planned =
      first.setCount <= 1
        ? `${plannedEach}${first.measure === 'reps' ? ' times' : ''}${sideWord}${plannedWeight ? `, ${plannedWeight}` : ''}`
        : `${first.setCount} sets of ${plannedEach}${sideWord}${plannedWeight ? `, ${plannedWeight}` : ''}`;

    const done: string[] = [];
    let skipped = 0;
    let notReached = 0;
    const weights = new Set<string>();
    for (const set of stepSets) {
      const result = results[set.key];
      if (!result) {
        notReached += 1;
        continue;
      }
      if (result.status === 'skipped') {
        skipped += 1;
        continue;
      }
      const amount = doneAmount(set, result);
      done.push(set.side ? `${amount} ${set.side}` : amount);
      const weight = weightText(result.weight, set.weightUnit);
      if (weight) weights.add(weight);
    }
    const parts: string[] = [];
    if (done.length > 0) {
      const count = done.length / sidesPerRound;
      const setsWord = Number.isInteger(count) ? (count === 1 ? '1 set' : `${count} sets`) : done.length === 1 ? '1 side' : `${done.length} sides`;
      parts.push(`${setsWord}: ${done.join(', ')}`);
      if (weights.size > 0) parts.push([...weights].join(' and '));
    } else {
      parts.push('None done');
    }
    if (skipped > 0) parts.push(skipped === 1 ? '1 skipped' : `${skipped} skipped`);
    if (notReached > 0) parts.push(notReached === 1 ? '1 not reached' : `${notReached} not reached`);
    lines.push({ stepId, name: first.exerciseName, planned, done: parts.join(', ') });
  }
  return lines;
}

export type SessionTotals = { done: number; skipped: number; notReached: number };

export function sessionTotals(sets: readonly SessionSet[], results: Readonly<Record<string, SetResult>>): SessionTotals {
  let done = 0;
  let skipped = 0;
  for (const set of sets) {
    const result = results[set.key];
    if (result?.status === 'done') done += 1;
    else if (result?.status === 'skipped') skipped += 1;
  }
  return { done, skipped, notReached: sets.length - done - skipped };
}

/** Whole minutes between start and finish, never below one. */
export function sessionMinutes(startedAt: string, finishedAt: string): number {
  const span = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  if (!Number.isFinite(span) || span <= 0) return 1;
  return Math.max(1, Math.round(span / 60000));
}

/** "12 sets done, 1 skipped". */
export function totalsLine(totals: SessionTotals): string {
  const parts = [totals.done === 1 ? '1 set done' : `${totals.done} sets done`];
  if (totals.skipped > 0) parts.push(`${totals.skipped} skipped`);
  if (totals.notReached > 0) parts.push(`${totals.notReached} not reached`);
  return parts.join(', ');
}

/** What goes into the exercise log's notes, so Movement shows the detail. */
export function logNotes(comparisons: readonly ExerciseComparison[], note: string | null): string {
  const lines = comparisons.map((line) => `${line.name}: ${line.done} (planned ${line.planned})`);
  if (note && note.trim()) lines.push(note.trim());
  return lines.join('\n');
}

export const PLAYER_FOOT =
  'What you enter for each set is kept beside what the workout planned. Stopping early keeps what you did if you choose to save it.';

export const TIMER_FOOT =
  'A timer keeps counting if the phone locks, and when this app may send notifications it tells you when rest is over.';

// What is kept for a session, and read back as "last time".

export type KeptSet = {
  stepId: string;
  exerciseName: string;
  setNumber: number;
  side: Side | null;
  measure: ExerciseMeasure;
  plannedReps: number | null;
  plannedSeconds: number | null;
  plannedWeight: number | null;
  weightUnit: string | null;
  status: 'done' | 'skipped' | 'not reached';
  reps: number | null;
  seconds: number | null;
  weight: number | null;
};

export function keptSets(sets: readonly SessionSet[], results: Readonly<Record<string, SetResult>>): KeptSet[] {
  return sets.map((set) => {
    const result = results[set.key];
    return {
      stepId: set.stepId,
      exerciseName: set.exerciseName,
      setNumber: set.setNumber,
      side: set.side,
      measure: set.measure,
      plannedReps: set.plannedReps,
      plannedSeconds: set.plannedSeconds,
      plannedWeight: set.plannedWeight,
      weightUnit: set.weightUnit,
      status: result ? result.status : 'not reached',
      reps: result?.status === 'done' ? result.reps : null,
      seconds: result?.status === 'done' ? result.seconds : null,
      weight: result?.status === 'done' ? result.weight : null,
    };
  });
}

export function parseKeptSets(json: string | null): KeptSet[] {
  if (!json) return [];
  try {
    const parsed: unknown = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is KeptSet =>
        typeof entry === 'object' && entry !== null && typeof (entry as KeptSet).stepId === 'string',
    );
  } catch {
    return [];
  }
}

/**
 * "Last time, 3 days ago: 10, 10, 8 at 8 kg", from the latest session that
 * did this step. Null when no session has done it.
 */
export function lastTimeLine(stepId: string, kept: readonly KeptSet[], finishedAt: string, now: Date): string | null {
  const done = kept.filter((set) => set.stepId === stepId && set.status === 'done');
  if (done.length === 0) return null;
  const amounts = done.map((set) => {
    const amount = set.measure === 'reps' ? `${set.reps ?? 0}` : formatSeconds(set.seconds ?? 0);
    return set.side ? `${amount} ${set.side}` : amount;
  });
  const weights = [...new Set(done.map((set) => weightText(set.weight, set.weightUnit)).filter((text): text is string => !!text))];
  const when = daysAgoText(finishedAt, now);
  return `Last time, ${when}: ${amounts.join(', ')}${weights.length > 0 ? ` at ${weights.join(' and ')}` : ''}`;
}

function localDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function daysAgoText(iso: string, now: Date): string {
  const then = new Date(iso);
  if (!Number.isFinite(then.getTime())) return 'before';
  const days = Math.round((localDay(now) - localDay(then)) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}
