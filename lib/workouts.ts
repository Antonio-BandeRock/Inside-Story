// Workouts and the person's own exercises (H11, 2026-09-28): every decision
// and sentence, with no database, so scripts/test_exercise_library.js can
// check it. Reading and writing is lib/workoutsDb.ts; the built-in exercises
// are lib/exerciseLibrary.ts.
//
// One shape, ExerciseView, stands for a built-in exercise and one of the
// person's own alike, so the library, the builder and later the player
// never need to ask which kind they are holding.

import {
  describeAmount,
  EXERCISE_CATEGORIES,
  findLibraryExercise,
  formatSeconds,
  LIBRARY_EXERCISES,
  type Amount,
  type Demonstration,
  type Equipment,
  type ExerciseCategory,
  type ExerciseIntensity,
  type ExerciseMeasure,
  type ExerciseTag,
  type LibraryExercise,
} from './exerciseLibrary';

export type ExerciseSource = 'library' | 'custom';

export type CustomExercise = {
  id: string;
  name: string;
  category: ExerciseCategory;
  muscles: string;
  equipment: Equipment[];
  measure: ExerciseMeasure;
  sets: number;
  reps: number | null;
  seconds: number | null;
  perSide: boolean;
  steps: string[];
  safety: string[];
  mistakes: string[];
  easier: string;
  harder: string;
  gentle: boolean;
  videoUrl: string | null;
  notes: string | null;
  archivedAt: string | null;
};

export type ExerciseView = {
  source: ExerciseSource;
  id: string;
  name: string;
  category: ExerciseCategory;
  muscles: string;
  equipment: Equipment[];
  measure: ExerciseMeasure;
  sets: number;
  reps: number | null;
  seconds: number | null;
  perSide: boolean;
  steps: string[];
  safety: string[];
  mistakes: string[];
  easier: string;
  harder: string;
  gentle: boolean;
  intensity: ExerciseIntensity;
  tags: ExerciseTag[];
  demo: Demonstration | null;
  videoUrl: string | null;
  notes: string | null;
  retired: boolean;
};

export function libraryView(exercise: LibraryExercise): ExerciseView {
  return {
    source: 'library',
    id: exercise.id,
    name: exercise.name,
    category: exercise.category,
    muscles: exercise.muscles,
    equipment: exercise.equipment,
    measure: exercise.measure,
    sets: exercise.sets,
    reps: exercise.reps ?? null,
    seconds: exercise.seconds ?? null,
    perSide: exercise.perSide === true,
    steps: exercise.steps,
    safety: exercise.safety,
    mistakes: exercise.mistakes,
    easier: exercise.easier,
    harder: exercise.harder,
    gentle: exercise.gentle,
    intensity: exercise.intensity,
    tags: exercise.tags,
    demo: exercise.demo,
    videoUrl: null,
    notes: null,
    retired: false,
  };
}

/** A custom exercise carries no tags, so no condition note is guessed for it. */
export function customView(exercise: CustomExercise): ExerciseView {
  return {
    source: 'custom',
    id: exercise.id,
    name: exercise.name,
    category: exercise.category,
    muscles: exercise.muscles,
    equipment: exercise.equipment,
    measure: exercise.measure,
    sets: exercise.sets,
    reps: exercise.reps,
    seconds: exercise.seconds,
    perSide: exercise.perSide,
    steps: exercise.steps,
    safety: exercise.safety,
    mistakes: exercise.mistakes,
    easier: exercise.easier,
    harder: exercise.harder,
    gentle: exercise.gentle,
    intensity: exercise.category === 'stretch' || exercise.category === 'mobility' || exercise.category === 'balance' ? 'light' : 'moderate',
    tags: [],
    demo: null,
    videoUrl: exercise.videoUrl,
    notes: exercise.notes,
    retired: exercise.archivedAt != null,
  };
}

/** Every exercise to choose from: the library, then the person's own that are not retired, by name. */
export function allExerciseViews(custom: readonly CustomExercise[]): ExerciseView[] {
  const mine = custom.filter((exercise) => exercise.archivedAt == null).map(customView);
  return [...LIBRARY_EXERCISES.map(libraryView), ...mine].sort((a, b) => a.name.localeCompare(b.name));
}

export function resolveExercise(source: ExerciseSource, id: string, custom: readonly CustomExercise[]): ExerciseView | null {
  if (source === 'library') {
    const found = findLibraryExercise(id);
    return found ? libraryView(found) : null;
  }
  const found = custom.find((exercise) => exercise.id === id);
  return found ? customView(found) : null;
}

// The person's own exercise, as typed.

export type CustomExerciseDraft = {
  name: string;
  category: ExerciseCategory;
  muscles: string;
  equipment: Equipment[];
  measure: ExerciseMeasure;
  sets: string;
  reps: string;
  seconds: string;
  perSide: boolean;
  steps: string;
  safety: string;
  mistakes: string;
  easier: string;
  harder: string;
  gentle: boolean;
  videoUrl: string;
  notes: string;
};

export function blankExerciseDraft(): CustomExerciseDraft {
  return {
    name: '',
    category: 'strength',
    muscles: '',
    equipment: [],
    measure: 'reps',
    sets: '2',
    reps: '10',
    seconds: '30',
    perSide: false,
    steps: '',
    safety: '',
    mistakes: '',
    easier: '',
    harder: '',
    gentle: false,
    videoUrl: '',
    notes: '',
  };
}

/** Starts a draft from any exercise, so a built-in one can be copied and changed. */
export function draftFromExercise(exercise: ExerciseView, copy: boolean): CustomExerciseDraft {
  return {
    name: copy ? `${exercise.name} (my version)` : exercise.name,
    category: exercise.category,
    muscles: exercise.muscles,
    equipment: exercise.equipment.filter((e) => e !== 'none'),
    measure: exercise.measure,
    sets: String(exercise.sets),
    reps: exercise.reps != null ? String(exercise.reps) : '10',
    seconds: exercise.seconds != null ? String(exercise.seconds) : '30',
    perSide: exercise.perSide,
    steps: exercise.steps.join('\n'),
    safety: exercise.safety.join('\n'),
    mistakes: exercise.mistakes.join('\n'),
    easier: exercise.easier,
    harder: exercise.harder,
    gentle: exercise.gentle,
    videoUrl: exercise.videoUrl ?? '',
    notes: exercise.notes ?? '',
  };
}

function wholeNumber(text: string): number | null {
  const trimmed = text.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  return Number(trimmed);
}

function lines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
    .filter(Boolean);
}

export function isVideoLink(text: string): boolean {
  return /^https?:\/\/\S+\.\S+/i.test(text.trim());
}

export function exerciseDraftProblem(draft: CustomExerciseDraft): string | null {
  if (!draft.name.trim()) return 'Give the exercise a name.';
  const sets = wholeNumber(draft.sets);
  if (sets == null || sets < 1 || sets > 20) return 'Sets is a whole number from 1 to 20.';
  if (draft.measure === 'reps') {
    const reps = wholeNumber(draft.reps);
    if (reps == null || reps < 1 || reps > 500) return 'Reps is a whole number from 1 to 500.';
  } else {
    const seconds = wholeNumber(draft.seconds);
    if (seconds == null || seconds < 1 || seconds > 4 * 60 * 60) return 'Time is a whole number of seconds, 1 or more.';
  }
  if (draft.videoUrl.trim() && !isVideoLink(draft.videoUrl)) return 'The video link starts with https:// (copy it from the address bar).';
  return null;
}

export type CustomExerciseFields = Omit<CustomExercise, 'id' | 'archivedAt'>;

export function exerciseDraftToFields(draft: CustomExerciseDraft): CustomExerciseFields {
  const reps = draft.measure === 'reps' ? wholeNumber(draft.reps) : null;
  const seconds = draft.measure === 'time' ? wholeNumber(draft.seconds) : null;
  return {
    name: draft.name.trim(),
    category: draft.category,
    muscles: draft.muscles.trim(),
    equipment: draft.equipment,
    measure: draft.measure,
    sets: wholeNumber(draft.sets) ?? 1,
    reps,
    seconds,
    perSide: draft.perSide,
    steps: lines(draft.steps),
    safety: lines(draft.safety),
    mistakes: lines(draft.mistakes),
    easier: draft.easier.trim(),
    harder: draft.harder.trim(),
    gentle: draft.gentle,
    videoUrl: draft.videoUrl.trim() || null,
    notes: draft.notes.trim() || null,
  };
}

// A workout and the exercises in it.

export type WorkoutStep = {
  id: string;
  workoutId: string;
  source: ExerciseSource;
  exerciseId: string;
  position: number;
  sets: number;
  reps: number | null;
  seconds: number | null;
  perSide: boolean;
  weight: number | null;
  weightUnit: string | null;
  restSeconds: number | null;
  note: string | null;
};

export type Workout = {
  id: string;
  name: string;
  note: string | null;
  archivedAt: string | null;
  steps: WorkoutStep[];
};

export const WEIGHT_UNITS = ['kg', 'lb'] as const;

export function stepAmount(step: WorkoutStep, exercise: ExerciseView | null): Amount {
  return {
    measure: step.reps != null ? 'reps' : step.seconds != null ? 'time' : exercise?.measure ?? 'reps',
    sets: step.sets,
    reps: step.reps,
    seconds: step.seconds,
    perSide: step.perSide,
    weight: step.weight,
    weightUnit: step.weightUnit,
    restSeconds: step.restSeconds,
  };
}

export function describeStep(step: WorkoutStep, exercise: ExerciseView | null): string {
  return describeAmount(stepAmount(step, exercise));
}

/** The amount a step starts with when an exercise is added to a workout. */
export function newStepFields(exercise: ExerciseView): Omit<WorkoutStep, 'id' | 'workoutId' | 'position'> {
  return {
    source: exercise.source,
    exerciseId: exercise.id,
    sets: exercise.sets,
    reps: exercise.measure === 'reps' ? exercise.reps ?? 10 : null,
    seconds: exercise.measure === 'time' ? exercise.seconds ?? 30 : null,
    perSide: exercise.perSide,
    weight: null,
    weightUnit: null,
    restSeconds: exercise.sets > 1 ? 60 : null,
    note: null,
  };
}

export type StepDraft = {
  measure: ExerciseMeasure;
  sets: string;
  reps: string;
  seconds: string;
  perSide: boolean;
  weight: string;
  weightUnit: string;
  restSeconds: string;
  note: string;
};

export function stepDraftFrom(step: WorkoutStep, exercise: ExerciseView | null): StepDraft {
  const amount = stepAmount(step, exercise);
  return {
    measure: amount.measure,
    sets: String(step.sets),
    reps: step.reps != null ? String(step.reps) : '10',
    seconds: step.seconds != null ? String(step.seconds) : '30',
    perSide: step.perSide,
    weight: step.weight != null ? String(step.weight) : '',
    weightUnit: step.weightUnit ?? 'kg',
    restSeconds: step.restSeconds != null ? String(step.restSeconds) : '',
    note: step.note ?? '',
  };
}

export function stepDraftProblem(draft: StepDraft): string | null {
  const sets = wholeNumber(draft.sets);
  if (sets == null || sets < 1 || sets > 20) return 'Sets is a whole number from 1 to 20.';
  if (draft.measure === 'reps') {
    const reps = wholeNumber(draft.reps);
    if (reps == null || reps < 1 || reps > 500) return 'Reps is a whole number from 1 to 500.';
  } else {
    const seconds = wholeNumber(draft.seconds);
    if (seconds == null || seconds < 1) return 'Time is a whole number of seconds, 1 or more.';
  }
  if (draft.weight.trim()) {
    const weight = Number(draft.weight.trim().replace(',', '.'));
    if (!Number.isFinite(weight) || weight < 0 || weight > 1000) return 'Weight is a number, like 8 or 12.5.';
  }
  if (draft.restSeconds.trim()) {
    const rest = wholeNumber(draft.restSeconds);
    if (rest == null || rest > 60 * 60) return 'Rest is a whole number of seconds.';
  }
  return null;
}

export type StepFields = Pick<WorkoutStep, 'sets' | 'reps' | 'seconds' | 'perSide' | 'weight' | 'weightUnit' | 'restSeconds' | 'note'>;

export function stepDraftToFields(draft: StepDraft): StepFields {
  const weightText = draft.weight.trim().replace(',', '.');
  const weight = weightText ? Number(weightText) : null;
  return {
    sets: wholeNumber(draft.sets) ?? 1,
    reps: draft.measure === 'reps' ? wholeNumber(draft.reps) : null,
    seconds: draft.measure === 'time' ? wholeNumber(draft.seconds) : null,
    perSide: draft.perSide,
    weight: weight != null && weight > 0 ? weight : null,
    weightUnit: weight != null && weight > 0 ? (draft.weightUnit === 'lb' ? 'lb' : 'kg') : null,
    restSeconds: draft.restSeconds.trim() ? wholeNumber(draft.restSeconds) : null,
    note: draft.note.trim() || null,
  };
}

/** Seconds a rep takes, for the estimate only. */
const SECONDS_PER_REP = 3;
/** Getting from one exercise to the next. */
const CHANGEOVER_SECONDS = 30;

/** How long a workout is likely to take, in whole minutes, rest included. */
export function estimateMinutes(steps: readonly WorkoutStep[]): number {
  let seconds = 0;
  for (const step of steps) {
    const each = step.reps != null ? step.reps * SECONDS_PER_REP : step.seconds ?? 0;
    const sides = step.perSide ? 2 : 1;
    seconds += step.sets * each * sides;
    seconds += Math.max(0, step.sets - 1) * (step.restSeconds ?? 0);
    seconds += CHANGEOVER_SECONDS;
  }
  return Math.max(1, Math.round(seconds / 60));
}

export function describeWorkout(workout: Workout): string {
  const count = workout.steps.length;
  if (count === 0) return 'No exercises yet';
  const exercises = count === 1 ? '1 exercise' : `${count} exercises`;
  return `${exercises}, about ${estimateMinutes(workout.steps)} minutes`;
}

/** The hardest exercise in it, which is what a finished session is logged as. */
export function workoutIntensity(exercises: readonly (ExerciseView | null)[]): ExerciseIntensity {
  if (exercises.some((exercise) => exercise?.intensity === 'vigorous')) return 'vigorous';
  if (exercises.some((exercise) => exercise?.intensity === 'moderate')) return 'moderate';
  return 'light';
}

/** Moving a step up or down; returns the new order of ids. */
export function moveStep(ids: readonly string[], id: string, direction: -1 | 1): string[] {
  const index = ids.indexOf(id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= ids.length) return [...ids];
  const next = [...ids];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function workoutNameProblem(name: string, others: readonly string[]): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'Give the workout a name.';
  if (others.some((other) => other.trim().toLowerCase() === trimmed.toLowerCase())) return `There is already a workout called ${trimmed}.`;
  return null;
}

/** A missing exercise still has a row, named so the person can remove it. */
export function missingExerciseName(step: WorkoutStep): string {
  return step.source === 'library' ? `An exercise no longer in the library (${step.exerciseId})` : 'An exercise you wrote that was removed';
}

// Removing the person's own exercise.

export type ExerciseRemoval = 'delete' | 'retire';

/** Used in any workout: retired, so every workout keeps it. Otherwise deleted with its photos. */
export function planExerciseRemoval(usedIn: readonly string[]): ExerciseRemoval {
  return usedIn.length > 0 ? 'retire' : 'delete';
}

function nameList(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

export function exerciseRemovalMessage(name: string, usedIn: readonly string[]): string {
  if (planExerciseRemoval(usedIn) === 'retire') {
    return `${name} is in ${nameList(usedIn)}, so it stays there and leaves the list of exercises to add. Its photos and notes are kept.`;
  }
  return `${name} is in no workout. Removing it deletes it and its photos.`;
}

export function workoutRemovalMessage(workout: Workout): string {
  return `${workout.name} and the list of exercises in it will be deleted. Sessions already logged from it stay in your exercise log, and none of the exercises themselves are removed.`;
}

// Words for the lens.

export const WORKOUTS_INTRO =
  'Build a workout from the exercises here or from your own, each with its sets, reps or time, weight and rest. Every exercise opens to show how it is done, what to watch for, and an easier and a harder version.';

export const LIBRARY_INTRO =
  'Each exercise links to a page that shows it being done. Stop if something hurts in a sharp or unusual way, and ask your care team what fits you if you are unsure.';

export function libraryCountLine(shown: number, total: number): string {
  if (shown === total) return total === 1 ? '1 exercise' : `${total} exercises`;
  return `${shown} of ${total} exercises`;
}

export function exerciseMetaLine(exercise: ExerciseView): string {
  const category = EXERCISE_CATEGORIES.find((entry) => entry.key === exercise.category)?.label ?? exercise.category;
  const amount = describeAmount({
    measure: exercise.measure,
    sets: exercise.sets,
    reps: exercise.reps,
    seconds: exercise.seconds,
    perSide: exercise.perSide,
  });
  const parts = [category, exercise.muscles, amount].filter(Boolean);
  if (exercise.source === 'custom') parts.push('Yours');
  return parts.join(' · ');
}

export function restLine(seconds: number | null): string {
  return seconds != null && seconds > 0 ? `Rest ${formatSeconds(seconds)} between sets` : 'No set rest';
}
