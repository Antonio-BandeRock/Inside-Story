// Reading and writing workouts and the person's own exercises (H11). Every
// decision and sentence is in lib/workouts.ts with no database; see
// custom_exercises in lib/db.ts for how the three tables fit together.

import { getDatabase, recordExercise } from './db';
import {
  EXERCISE_CATEGORIES,
  EQUIPMENT_LABELS,
  type Equipment,
  type ExerciseCategory,
  type ExerciseIntensity,
} from './exerciseLibrary';
import { parseKeptSets, type KeptSet } from './workoutSession';
import { removePhotosOf } from './mediaDb';
import {
  exerciseDraftToFields,
  planExerciseRemoval,
  type CustomExercise,
  type CustomExerciseDraft,
  type ExerciseRemoval,
  type ExerciseSource,
  type StepFields,
  type Workout,
  type WorkoutStep,
} from './workouts';

export const EXERCISE_PHOTO_OWNER = 'exercise';

function newId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function parseList(json: string | null): string[] {
  if (!json) return [];
  try {
    const parsed: unknown = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function isCategory(value: string): value is ExerciseCategory {
  return EXERCISE_CATEGORIES.some((entry) => entry.key === value);
}

function isEquipment(value: string): value is Equipment {
  return Object.prototype.hasOwnProperty.call(EQUIPMENT_LABELS, value);
}

type CustomRow = {
  id: string;
  name: string;
  category: string;
  muscles: string | null;
  equipmentJson: string | null;
  measure: string;
  sets: number;
  reps: number | null;
  seconds: number | null;
  perSide: number;
  stepsJson: string | null;
  safetyJson: string | null;
  mistakesJson: string | null;
  easier: string | null;
  harder: string | null;
  gentle: number;
  videoUrl: string | null;
  notes: string | null;
  archivedAt: string | null;
};

function customFromRow(row: CustomRow): CustomExercise {
  return {
    id: row.id,
    name: row.name,
    category: isCategory(row.category) ? row.category : 'strength',
    muscles: row.muscles ?? '',
    equipment: parseList(row.equipmentJson).filter(isEquipment),
    measure: row.measure === 'time' ? 'time' : 'reps',
    sets: row.sets,
    reps: row.reps,
    seconds: row.seconds,
    perSide: row.perSide === 1,
    steps: parseList(row.stepsJson),
    safety: parseList(row.safetyJson),
    mistakes: parseList(row.mistakesJson),
    easier: row.easier ?? '',
    harder: row.harder ?? '',
    gentle: row.gentle === 1,
    videoUrl: row.videoUrl,
    notes: row.notes,
    archivedAt: row.archivedAt,
  };
}

/** Retired ones too, since a workout may still hold one. */
export async function listCustomExercises(): Promise<CustomExercise[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CustomRow>(
    `SELECT id, name, category, muscles, equipment_json AS equipmentJson, measure, sets, reps, seconds,
            per_side AS perSide, steps_json AS stepsJson, safety_json AS safetyJson, mistakes_json AS mistakesJson,
            easier, harder, gentle, video_url AS videoUrl, notes, archived_at AS archivedAt
     FROM custom_exercises ORDER BY name COLLATE NOCASE`,
  );
  return rows.map(customFromRow);
}

export async function saveCustomExercise(id: string | null, draft: CustomExerciseDraft): Promise<string> {
  const fields = exerciseDraftToFields(draft);
  const db = await getDatabase();
  const now = new Date().toISOString();
  const values = [
    fields.name,
    fields.category,
    fields.muscles || null,
    JSON.stringify(fields.equipment),
    fields.measure,
    fields.sets,
    fields.reps,
    fields.seconds,
    fields.perSide ? 1 : 0,
    JSON.stringify(fields.steps),
    JSON.stringify(fields.safety),
    JSON.stringify(fields.mistakes),
    fields.easier || null,
    fields.harder || null,
    fields.gentle ? 1 : 0,
    fields.videoUrl,
    fields.notes,
  ];
  if (id) {
    await db.runAsync(
      `UPDATE custom_exercises
       SET name = ?, category = ?, muscles = ?, equipment_json = ?, measure = ?, sets = ?, reps = ?, seconds = ?,
           per_side = ?, steps_json = ?, safety_json = ?, mistakes_json = ?, easier = ?, harder = ?, gentle = ?,
           video_url = ?, notes = ?, updated_at = ?
       WHERE id = ?`,
      ...values,
      now,
      id,
    );
    return id;
  }
  const newExerciseId = newId('exercise_mine');
  await db.runAsync(
    `INSERT INTO custom_exercises
       (id, name, category, muscles, equipment_json, measure, sets, reps, seconds, per_side, steps_json, safety_json,
        mistakes_json, easier, harder, gentle, video_url, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    newExerciseId,
    ...values,
    now,
    now,
  );
  return newExerciseId;
}

/** The names of the workouts an exercise is in. */
export async function workoutsUsingExercise(source: ExerciseSource, exerciseId: string): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ name: string }>(
    `SELECT DISTINCT w.name AS name FROM workout_exercises we JOIN workouts w ON w.id = we.workout_id
     WHERE we.exercise_source = ? AND we.exercise_id = ? ORDER BY w.name COLLATE NOCASE`,
    source,
    exerciseId,
  );
  return rows.map((row) => row.name);
}

/** Retired when a workout holds it, deleted with its photos when none does. */
export async function removeCustomExercise(id: string): Promise<ExerciseRemoval> {
  const usedIn = await workoutsUsingExercise('custom', id);
  const plan = planExerciseRemoval(usedIn);
  const db = await getDatabase();
  if (plan === 'retire') {
    const now = new Date().toISOString();
    await db.runAsync('UPDATE custom_exercises SET archived_at = ?, updated_at = ? WHERE id = ?', now, now, id);
  } else {
    await removePhotosOf(EXERCISE_PHOTO_OWNER, id);
    await db.runAsync('DELETE FROM custom_exercises WHERE id = ?', id);
  }
  return plan;
}

export async function restoreCustomExercise(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE custom_exercises SET archived_at = NULL, updated_at = ? WHERE id = ?', new Date().toISOString(), id);
}

// Workouts.

type StepRow = {
  id: string;
  workoutId: string;
  source: string;
  exerciseId: string;
  position: number;
  sets: number;
  reps: number | null;
  seconds: number | null;
  perSide: number;
  weight: number | null;
  weightUnit: string | null;
  restSeconds: number | null;
  note: string | null;
};

function stepFromRow(row: StepRow): WorkoutStep {
  return {
    id: row.id,
    workoutId: row.workoutId,
    source: row.source === 'custom' ? 'custom' : 'library',
    exerciseId: row.exerciseId,
    position: row.position,
    sets: row.sets,
    reps: row.reps,
    seconds: row.seconds,
    perSide: row.perSide === 1,
    weight: row.weight,
    weightUnit: row.weightUnit,
    restSeconds: row.restSeconds,
    note: row.note,
  };
}

export async function listWorkouts(): Promise<Workout[]> {
  const db = await getDatabase();
  const workouts = await db.getAllAsync<{ id: string; name: string; note: string | null; archivedAt: string | null }>(
    `SELECT id, name, note, archived_at AS archivedAt FROM workouts
     WHERE archived_at IS NULL ORDER BY sort_order, name COLLATE NOCASE`,
  );
  const steps = await db.getAllAsync<StepRow>(
    `SELECT id, workout_id AS workoutId, exercise_source AS source, exercise_id AS exerciseId, position, sets, reps,
            seconds, per_side AS perSide, weight, weight_unit AS weightUnit, rest_seconds AS restSeconds, note
     FROM workout_exercises ORDER BY position`,
  );
  return workouts.map((workout) => ({
    ...workout,
    steps: steps.filter((step) => step.workoutId === workout.id).map(stepFromRow),
  }));
}

export async function getWorkout(id: string): Promise<Workout | null> {
  return (await listWorkouts()).find((workout) => workout.id === id) ?? null;
}

export async function createWorkout(name: string, note: string | null): Promise<string> {
  const db = await getDatabase();
  const id = newId('workout');
  const now = new Date().toISOString();
  const last = await db.getFirstAsync<{ n: number | null }>('SELECT MAX(sort_order) AS n FROM workouts');
  await db.runAsync(
    'INSERT INTO workouts (id, name, note, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    id,
    name.trim(),
    note?.trim() || null,
    (last?.n ?? 0) + 1,
    now,
    now,
  );
  return id;
}

export async function renameWorkout(id: string, name: string, note: string | null): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE workouts SET name = ?, note = ?, updated_at = ? WHERE id = ?', name.trim(), note?.trim() || null, new Date().toISOString(), id);
}

/** Removes the workout and its list; the exercises and any logged sessions stay. */
export async function removeWorkout(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM workout_exercises WHERE workout_id = ?', id);
  await db.runAsync('DELETE FROM workouts WHERE id = ?', id);
}

async function touchWorkout(workoutId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE workouts SET updated_at = ? WHERE id = ?', new Date().toISOString(), workoutId);
}

export async function addWorkoutStep(workoutId: string, fields: Omit<WorkoutStep, 'id' | 'workoutId' | 'position'>): Promise<string> {
  const db = await getDatabase();
  const id = newId('workout_step');
  const now = new Date().toISOString();
  const last = await db.getFirstAsync<{ n: number | null }>('SELECT MAX(position) AS n FROM workout_exercises WHERE workout_id = ?', workoutId);
  await db.runAsync(
    `INSERT INTO workout_exercises
       (id, workout_id, exercise_source, exercise_id, position, sets, reps, seconds, per_side, weight, weight_unit,
        rest_seconds, note, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    workoutId,
    fields.source,
    fields.exerciseId,
    (last?.n ?? 0) + 1,
    fields.sets,
    fields.reps,
    fields.seconds,
    fields.perSide ? 1 : 0,
    fields.weight,
    fields.weightUnit,
    fields.restSeconds,
    fields.note,
    now,
    now,
  );
  await touchWorkout(workoutId);
  return id;
}

export async function updateWorkoutStep(step: WorkoutStep, fields: StepFields): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE workout_exercises
     SET sets = ?, reps = ?, seconds = ?, per_side = ?, weight = ?, weight_unit = ?, rest_seconds = ?, note = ?, updated_at = ?
     WHERE id = ?`,
    fields.sets,
    fields.reps,
    fields.seconds,
    fields.perSide ? 1 : 0,
    fields.weight,
    fields.weightUnit,
    fields.restSeconds,
    fields.note,
    new Date().toISOString(),
    step.id,
  );
  await touchWorkout(step.workoutId);
}

export async function removeWorkoutStep(step: WorkoutStep): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM workout_exercises WHERE id = ?', step.id);
  await touchWorkout(step.workoutId);
}

/** Writes the order given, 1 upward. */
export async function reorderWorkoutSteps(workoutId: string, orderedIds: readonly string[]): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  for (let index = 0; index < orderedIds.length; index += 1) {
    await db.runAsync('UPDATE workout_exercises SET position = ?, updated_at = ? WHERE id = ? AND workout_id = ?', index + 1, now, orderedIds[index], workoutId);
  }
  await touchWorkout(workoutId);
}

// Sessions, H11 part 2: a workout done, from app/workout.tsx.

/**
 * Keeps a session and writes it to the exercise log as one entry named for
 * the workout, so Movement and everything that reads exercise_logs sees it.
 */
export async function saveWorkoutSession(input: {
  workoutId: string;
  workoutName: string;
  startedAt: string;
  finishedAt: string;
  sets: KeptSet[];
  minutes: number;
  intensity: ExerciseIntensity;
  notes: string;
  note: string | null;
}): Promise<{ id: string; logId: string }> {
  const logId = await recordExercise({
    loggedAt: localStamp(new Date(input.startedAt)),
    exerciseType: input.workoutName,
    durationMinutes: input.minutes,
    intensity: input.intensity,
    notes: input.notes,
  });
  const db = await getDatabase();
  const id = newId('workout_session');
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO workout_sessions
       (id, workout_id, workout_name, started_at, finished_at, exercise_log_id, sets_json, note, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.workoutId,
    input.workoutName,
    input.startedAt,
    input.finishedAt,
    logId,
    JSON.stringify(input.sets),
    input.note?.trim() || null,
    now,
    now,
  );
  return { id, logId };
}

/** The latest session of a workout, for "last time" on each exercise. */
export async function lastWorkoutSession(workoutId: string): Promise<{ finishedAt: string; sets: KeptSet[] } | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ finishedAt: string; setsJson: string }>(
    `SELECT finished_at AS finishedAt, sets_json AS setsJson FROM workout_sessions
     WHERE workout_id = ? ORDER BY finished_at DESC LIMIT 1`,
    workoutId,
  );
  return row ? { finishedAt: row.finishedAt, sets: parseKeptSets(row.setsJson) } : null;
}

/** The same shape the quick log writes: local date and time, no zone. */
function localStamp(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
