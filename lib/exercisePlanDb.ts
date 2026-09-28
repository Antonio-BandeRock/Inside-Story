// Reading and writing planned exercise (H11 part 3, Schedules > Exercise).
// Every decision and sentence is in lib/exercisePlan.ts; see exercise_plans
// in lib/db.ts for the two tables.

import { deleteExerciseLog, getDatabase, recordExercise } from './db';
import { weekdaysFromColumn, weekdaysToColumn, type RepeatConfig, type RepeatEndType, type RepeatType } from './repeatRule';
import { localDate, parseMinutes, planRemoval, type ExercisePlan, type PlanDraft, type PlanMark, type PlanMarkStatus } from './exercisePlan';

function newId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

type PlanRow = {
  id: string;
  workoutId: string | null;
  activity: string | null;
  startsOn: string;
  atTime: string | null;
  minutes: number | null;
  repeatType: string;
  repeatInterval: number | null;
  repeatWeekdays: string | null;
  repeatEndType: string | null;
  repeatCount: number | null;
  repeatUntil: string | null;
  remind: number;
  note: string | null;
  archivedAt: string | null;
};

const REPEAT_TYPES: RepeatType[] = ['none', 'daily', 'every_n_days', 'weekly', 'monthly'];
const END_TYPES: RepeatEndType[] = ['indefinite', 'count', 'until_date'];

function repeatFromRow(row: PlanRow): RepeatConfig {
  const type = REPEAT_TYPES.find((value) => value === row.repeatType) ?? 'none';
  if (type === 'none') return { type };
  return {
    type,
    endType: END_TYPES.find((value) => value === row.repeatEndType) ?? 'indefinite',
    count: row.repeatCount ?? undefined,
    until: row.repeatUntil ?? undefined,
    interval: row.repeatInterval ?? undefined,
    weekdays: weekdaysFromColumn(row.repeatWeekdays),
  };
}

function planFromRow(row: PlanRow): ExercisePlan {
  return {
    id: row.id,
    workoutId: row.workoutId,
    activity: row.activity,
    startsOn: row.startsOn,
    atTime: row.atTime,
    minutes: row.minutes,
    repeat: repeatFromRow(row),
    remind: row.remind === 1,
    note: row.note,
    archivedAt: row.archivedAt,
  };
}

const PLAN_COLUMNS = `id, workout_id AS workoutId, activity, starts_on AS startsOn, at_time AS atTime, minutes,
  repeat_type AS repeatType, repeat_interval AS repeatInterval, repeat_weekdays AS repeatWeekdays,
  repeat_end_type AS repeatEndType, repeat_count AS repeatCount, repeat_until AS repeatUntil,
  remind, note, archived_at AS archivedAt`;

/** Every plan, archived ones included, since their marked days are history. */
export async function listExercisePlans(): Promise<ExercisePlan[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<PlanRow>(`SELECT ${PLAN_COLUMNS} FROM exercise_plans ORDER BY starts_on, at_time`);
  return rows.map(planFromRow);
}

export async function getExercisePlan(id: string): Promise<ExercisePlan | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<PlanRow>(`SELECT ${PLAN_COLUMNS} FROM exercise_plans WHERE id = ?`, id);
  return row ? planFromRow(row) : null;
}

export async function listPlanMarks(from?: string, through?: string): Promise<PlanMark[]> {
  const db = await getDatabase();
  const where = from && through ? 'WHERE on_date BETWEEN ? AND ?' : '';
  const params = from && through ? [from, through] : [];
  return db.getAllAsync<PlanMark>(
    `SELECT plan_id AS planId, on_date AS onDate, status, workout_session_id AS workoutSessionId,
            exercise_log_id AS exerciseLogId, marked_at AS markedAt
     FROM exercise_plan_marks ${where} ORDER BY on_date`,
    ...params,
  );
}

function repeatColumns(repeat: RepeatConfig) {
  const repeating = repeat.type !== 'none';
  return [
    repeat.type,
    repeating ? repeat.interval ?? null : null,
    repeating && repeat.type === 'weekly' ? weekdaysToColumn(repeat.weekdays) : null,
    repeating ? repeat.endType ?? 'indefinite' : null,
    repeating && repeat.endType === 'count' ? repeat.count ?? null : null,
    repeating && repeat.endType === 'until_date' ? repeat.until ?? null : null,
  ];
}

export async function saveExercisePlan(id: string | null, draft: PlanDraft): Promise<string> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const fields = [
    draft.workoutId,
    draft.workoutId ? null : draft.activity.trim(),
    draft.startsOn,
    draft.atTime,
    parseMinutes(draft.minutes),
    ...repeatColumns(draft.repeat),
    draft.remind && draft.atTime ? 1 : 0,
    draft.note.trim() || null,
  ];
  if (id) {
    await db.runAsync(
      `UPDATE exercise_plans SET workout_id = ?, activity = ?, starts_on = ?, at_time = ?, minutes = ?,
         repeat_type = ?, repeat_interval = ?, repeat_weekdays = ?, repeat_end_type = ?, repeat_count = ?, repeat_until = ?,
         remind = ?, note = ?, updated_at = ? WHERE id = ?`,
      ...fields,
      now,
      id,
    );
    return id;
  }
  const newPlanId = newId('exercise_plan');
  await db.runAsync(
    `INSERT INTO exercise_plans
       (id, workout_id, activity, starts_on, at_time, minutes, repeat_type, repeat_interval, repeat_weekdays,
        repeat_end_type, repeat_count, repeat_until, remind, note, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    newPlanId,
    ...fields,
    now,
    now,
  );
  return newPlanId;
}

/** Deleted when no day was ever marked, otherwise archived so the marks keep their plan. */
export async function removeExercisePlan(plan: ExercisePlan): Promise<'delete' | 'archive'> {
  const db = await getDatabase();
  const marks = await db.getAllAsync<PlanMark>(
    `SELECT plan_id AS planId, on_date AS onDate, status, workout_session_id AS workoutSessionId,
            exercise_log_id AS exerciseLogId, marked_at AS markedAt
     FROM exercise_plan_marks WHERE plan_id = ?`,
    plan.id,
  );
  const outcome = planRemoval(plan, marks);
  const now = new Date().toISOString();
  if (outcome === 'delete') {
    await db.runAsync(`DELETE FROM exercise_plans WHERE id = ?`, plan.id);
  } else {
    await db.runAsync(`UPDATE exercise_plans SET archived_at = ?, updated_at = ? WHERE id = ?`, now, now, plan.id);
  }
  return outcome;
}

async function writeMark(input: {
  planId: string;
  onDate: string;
  status: PlanMarkStatus;
  workoutSessionId: string | null;
  exerciseLogId: string | null;
}): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO exercise_plan_marks
       (id, plan_id, on_date, status, workout_session_id, exercise_log_id, marked_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(plan_id, on_date) DO UPDATE SET status = excluded.status,
       workout_session_id = excluded.workout_session_id, exercise_log_id = excluded.exercise_log_id,
       marked_at = excluded.marked_at, updated_at = excluded.updated_at`,
    newId('exercise_plan_mark'),
    input.planId,
    input.onDate,
    input.status,
    input.workoutSessionId,
    input.exerciseLogId,
    now,
    now,
    now,
  );
}

/** The workout player finished a planned day. */
export async function markPlanDoneFromSession(planId: string, onDate: string, workoutSessionId: string, exerciseLogId: string | null): Promise<void> {
  await writeMark({ planId, onDate, status: 'done', workoutSessionId, exerciseLogId });
}

function localStamp(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${localDate(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Marks a day done without the player, and writes it to the exercise log so
 * Movement, Trends and Reports see it: today at the moment it was marked,
 * an earlier day at its planned time, or midday when it had none.
 */
export async function markPlanDone(plan: ExercisePlan, title: string, onDate: string, now: Date = new Date()): Promise<void> {
  const loggedAt = onDate === localDate(now) ? localStamp(now) : `${onDate}T${plan.atTime ?? '12:00'}`;
  const exerciseLogId = await recordExercise({
    loggedAt,
    exerciseType: title,
    durationMinutes: plan.minutes ?? undefined,
    notes: 'Marked done on Schedules > Exercise',
  });
  await writeMark({ planId: plan.id, onDate, status: 'done', workoutSessionId: null, exerciseLogId });
}

export async function markPlanSkipped(planId: string, onDate: string): Promise<void> {
  await writeMark({ planId, onDate, status: 'skipped', workoutSessionId: null, exerciseLogId: null });
}

/**
 * Clears a day's mark. A log entry the mark wrote itself goes with it; a
 * workout session stays, since the workout was done whatever the plan says.
 */
export async function clearPlanMark(mark: PlanMark): Promise<void> {
  const db = await getDatabase();
  if (mark.exerciseLogId && !mark.workoutSessionId) await deleteExerciseLog(mark.exerciseLogId);
  await db.runAsync(`DELETE FROM exercise_plan_marks WHERE plan_id = ? AND on_date = ?`, mark.planId, mark.onDate);
}
