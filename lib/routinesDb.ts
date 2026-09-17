// Reading and writing routines and the "did I already do it" record.
//
// Added 2026-09-17. Same split every other area here follows: the schema in
// lib/db.ts, the rules and the wording in lib/routines.ts with no database so
// they can be checked without one, and the reading and writing here.

import { getDatabase } from './db';
import {
  ALL_CHECK_CADENCES,
  ALL_ROUTINE_OCCASIONS,
  cleanRoutineText,
  isRoutineTextUsable,
  MAX_CHECK_NAME,
  MAX_ROUTINE_NAME,
  MAX_STEP_DETAIL,
  MAX_STEP_TEXT,
  type CheckCadence,
  type CheckMarkVia,
  type DoneCheck,
  type Routine,
  type RoutineOccasion,
  type RoutineStep,
} from './routines';

function newId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

function trimTo(value: string, limit: number): string {
  return cleanRoutineText(value).slice(0, limit);
}

// ------------------------------------------------------------------- checks

type CheckRow = {
  id: string;
  name: string;
  cadence: string;
  active: number;
  position: number;
  lastMarkedAt: string | null;
  lastMarkedVia: string | null;
};

function toCheck(row: CheckRow): DoneCheck {
  const cadence = ALL_CHECK_CADENCES.includes(row.cadence as CheckCadence)
    ? (row.cadence as CheckCadence)
    : 'daily';
  return {
    id: row.id,
    name: row.name,
    cadence,
    active: row.active !== 0,
    position: row.position,
    lastMarkedAt: row.lastMarkedAt,
    lastMarkedVia: row.lastMarkedVia === 'routine' ? 'routine' : row.lastMarkedVia === 'tap' ? 'tap' : null,
  };
}

const CHECK_COLUMNS = `id, name, cadence, active, position,
     last_marked_at AS lastMarkedAt, last_marked_via AS lastMarkedVia`;

export async function getDoneChecks(includeInactive = false): Promise<DoneCheck[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CheckRow>(
    `SELECT ${CHECK_COLUMNS} FROM done_checks
      ${includeInactive ? '' : 'WHERE active = 1'}
      ORDER BY position ASC, name ASC`,
  );
  return rows.map(toCheck);
}

export async function getDoneCheck(id: string): Promise<DoneCheck | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<CheckRow>(`SELECT ${CHECK_COLUMNS} FROM done_checks WHERE id = ?`, id);
  return row ? toCheck(row) : null;
}

export async function createDoneCheck(name: string, cadence: CheckCadence): Promise<string | null> {
  if (!isRoutineTextUsable(name)) return null;
  const db = await getDatabase();
  const id = newId('check');
  const next = await db.getFirstAsync<{ next: number }>(
    `SELECT COALESCE(MAX(position), -1) + 1 AS next FROM done_checks`,
  );
  await db.runAsync(
    `INSERT INTO done_checks (id, name, cadence, active, position, created_at)
     VALUES (?, ?, ?, 1, ?, ?)`,
    id,
    trimTo(name, MAX_CHECK_NAME),
    ALL_CHECK_CADENCES.includes(cadence) ? cadence : 'daily',
    next?.next ?? 0,
    new Date().toISOString(),
  );
  return id;
}

export async function updateDoneCheck(id: string, name: string, cadence: CheckCadence): Promise<boolean> {
  if (!isRoutineTextUsable(name)) return false;
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE done_checks SET name = ?, cadence = ? WHERE id = ?`,
    trimTo(name, MAX_CHECK_NAME),
    ALL_CHECK_CADENCES.includes(cadence) ? cadence : 'daily',
    id,
  );
  return true;
}

/** Retired rather than deleted, so a step still pointing at it keeps its
 *  history and the marks already written stay readable. */
export async function setDoneCheckActive(id: string, active: boolean): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`UPDATE done_checks SET active = ? WHERE id = ?`, active ? 1 : 0, id);
}

export async function deleteDoneCheck(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM done_checks WHERE id = ?`, id);
}

/**
 * Record that a thing has been done, now. Writes the history row and the
 * copy on the check in one go, since every screen reads the copy and nothing
 * yet reads the history.
 *
 * markedAt is passed in rather than taken here so that a routine finishing
 * seven steps stamps all seven marks with the one moment the walk ended,
 * instead of seven times a few milliseconds apart.
 */
export async function markDoneCheck(
  checkId: string,
  via: CheckMarkVia = 'tap',
  routineId: string | null = null,
  markedAt: string = new Date().toISOString(),
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO done_check_marks (id, check_id, marked_at, via, routine_id) VALUES (?, ?, ?, ?, ?)`,
    newId('mark'),
    checkId,
    markedAt,
    via,
    routineId,
  );
  await db.runAsync(
    `UPDATE done_checks SET last_marked_at = ?, last_marked_via = ? WHERE id = ?`,
    markedAt,
    via,
    checkId,
  );
}

/**
 * Take back the most recent mark on a check, and put the one before it back
 * on the row. Here because a tap on the wrong line is the single likeliest
 * mistake on this screen, and a record you cannot correct is one people stop
 * trusting.
 */
export async function undoLastCheckMark(checkId: string): Promise<void> {
  const db = await getDatabase();
  const last = await db.getFirstAsync<{ id: string }>(
    `SELECT id FROM done_check_marks WHERE check_id = ? ORDER BY marked_at DESC, rowid DESC LIMIT 1`,
    checkId,
  );
  if (!last) return;
  await db.runAsync(`DELETE FROM done_check_marks WHERE id = ?`, last.id);
  const previous = await db.getFirstAsync<{ markedAt: string; via: string }>(
    `SELECT marked_at AS markedAt, via FROM done_check_marks
      WHERE check_id = ? ORDER BY marked_at DESC, rowid DESC LIMIT 1`,
    checkId,
  );
  await db.runAsync(
    `UPDATE done_checks SET last_marked_at = ?, last_marked_via = ? WHERE id = ?`,
    previous?.markedAt ?? null,
    previous?.via ?? null,
    checkId,
  );
}

export async function moveDoneCheck(id: string, direction: -1 | 1): Promise<void> {
  const db = await getDatabase();
  const checks = await getDoneChecks(true);
  const index = checks.findIndex((check) => check.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= checks.length) return;
  const reordered = [...checks];
  const [held] = reordered.splice(index, 1);
  reordered.splice(target, 0, held);
  for (let position = 0; position < reordered.length; position += 1) {
    await db.runAsync(`UPDATE done_checks SET position = ? WHERE id = ?`, position, reordered[position].id);
  }
}

// ------------------------------------------------------------------ routines

type RoutineRow = {
  id: string;
  name: string;
  occasion: string;
  active: number;
  position: number;
  lastCompletedAt: string | null;
};

type StepRow = {
  id: string;
  routineId: string;
  text: string;
  detail: string | null;
  position: number;
  checkId: string | null;
};

function toStep(row: StepRow): RoutineStep {
  return {
    id: row.id,
    routineId: row.routineId,
    text: row.text,
    detail: row.detail,
    position: row.position,
    checkId: row.checkId,
  };
}

function toRoutine(row: RoutineRow, steps: RoutineStep[]): Routine {
  const occasion = ALL_ROUTINE_OCCASIONS.includes(row.occasion as RoutineOccasion)
    ? (row.occasion as RoutineOccasion)
    : 'other';
  return {
    id: row.id,
    name: row.name,
    occasion,
    active: row.active !== 0,
    position: row.position,
    lastCompletedAt: row.lastCompletedAt,
    steps,
  };
}

const ROUTINE_COLUMNS = `id, name, occasion, active, position,
     last_completed_at AS lastCompletedAt`;

const STEP_COLUMNS = `id, routine_id AS routineId, text, detail, position, check_id AS checkId`;

/** Every routine with its steps already attached. Two queries rather than a
 *  join, because the steps come back in their own order and stitching them
 *  here is plainer to read than unpicking a joined result. */
export async function getRoutines(includeInactive = false): Promise<Routine[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<RoutineRow>(
    `SELECT ${ROUTINE_COLUMNS} FROM routines
      ${includeInactive ? '' : 'WHERE active = 1'}
      ORDER BY position ASC, name ASC`,
  );
  if (rows.length === 0) return [];
  const steps = await db.getAllAsync<StepRow>(
    `SELECT ${STEP_COLUMNS} FROM routine_steps ORDER BY position ASC, rowid ASC`,
  );
  return rows.map((row) =>
    toRoutine(
      row,
      steps.filter((step) => step.routineId === row.id).map(toStep),
    ),
  );
}

export async function getRoutine(id: string): Promise<Routine | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<RoutineRow>(`SELECT ${ROUTINE_COLUMNS} FROM routines WHERE id = ?`, id);
  if (!row) return null;
  const steps = await db.getAllAsync<StepRow>(
    `SELECT ${STEP_COLUMNS} FROM routine_steps WHERE routine_id = ? ORDER BY position ASC, rowid ASC`,
    id,
  );
  return toRoutine(row, steps.map(toStep));
}

export async function createRoutine(name: string, occasion: RoutineOccasion): Promise<string | null> {
  if (!isRoutineTextUsable(name)) return null;
  const db = await getDatabase();
  const id = newId('routine');
  const next = await db.getFirstAsync<{ next: number }>(
    `SELECT COALESCE(MAX(position), -1) + 1 AS next FROM routines`,
  );
  await db.runAsync(
    `INSERT INTO routines (id, name, occasion, active, position, created_at) VALUES (?, ?, ?, 1, ?, ?)`,
    id,
    trimTo(name, MAX_ROUTINE_NAME),
    ALL_ROUTINE_OCCASIONS.includes(occasion) ? occasion : 'other',
    next?.next ?? 0,
    new Date().toISOString(),
  );
  return id;
}

export async function updateRoutine(id: string, name: string, occasion: RoutineOccasion): Promise<boolean> {
  if (!isRoutineTextUsable(name)) return false;
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE routines SET name = ?, occasion = ? WHERE id = ?`,
    trimTo(name, MAX_ROUTINE_NAME),
    ALL_ROUTINE_OCCASIONS.includes(occasion) ? occasion : 'other',
    id,
  );
  return true;
}

export async function setRoutineActive(id: string, active: boolean): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`UPDATE routines SET active = ? WHERE id = ?`, active ? 1 : 0, id);
}

export async function deleteRoutine(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM routines WHERE id = ?`, id);
}

export async function moveRoutine(id: string, direction: -1 | 1): Promise<void> {
  const db = await getDatabase();
  const routines = await getRoutines(true);
  const index = routines.findIndex((routine) => routine.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= routines.length) return;
  const reordered = [...routines];
  const [held] = reordered.splice(index, 1);
  reordered.splice(target, 0, held);
  for (let position = 0; position < reordered.length; position += 1) {
    await db.runAsync(`UPDATE routines SET position = ? WHERE id = ?`, position, reordered[position].id);
  }
}

// --------------------------------------------------------------------- steps

export async function addRoutineStep(
  routineId: string,
  text: string,
  detail: string | null,
  checkId: string | null,
): Promise<string | null> {
  if (!isRoutineTextUsable(text)) return null;
  const db = await getDatabase();
  const id = newId('step');
  const next = await db.getFirstAsync<{ next: number }>(
    `SELECT COALESCE(MAX(position), -1) + 1 AS next FROM routine_steps WHERE routine_id = ?`,
    routineId,
  );
  const cleanedDetail = detail ? trimTo(detail, MAX_STEP_DETAIL) : '';
  await db.runAsync(
    `INSERT INTO routine_steps (id, routine_id, text, detail, position, check_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id,
    routineId,
    trimTo(text, MAX_STEP_TEXT),
    cleanedDetail.length > 0 ? cleanedDetail : null,
    next?.next ?? 0,
    checkId,
    new Date().toISOString(),
  );
  return id;
}

export async function updateRoutineStep(
  id: string,
  text: string,
  detail: string | null,
  checkId: string | null,
): Promise<boolean> {
  if (!isRoutineTextUsable(text)) return false;
  const db = await getDatabase();
  const cleanedDetail = detail ? trimTo(detail, MAX_STEP_DETAIL) : '';
  await db.runAsync(
    `UPDATE routine_steps SET text = ?, detail = ?, check_id = ? WHERE id = ?`,
    trimTo(text, MAX_STEP_TEXT),
    cleanedDetail.length > 0 ? cleanedDetail : null,
    checkId,
    id,
  );
  return true;
}

export async function deleteRoutineStep(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM routine_steps WHERE id = ?`, id);
}

/** Save a whole reordered list at once. lib/routines.ts moveRoutineStep
 *  works out the new order, so nothing here has to think about it. */
export async function saveStepOrder(steps: RoutineStep[]): Promise<void> {
  const db = await getDatabase();
  for (let position = 0; position < steps.length; position += 1) {
    await db.runAsync(`UPDATE routine_steps SET position = ? WHERE id = ?`, position, steps[position].id);
  }
}

// ------------------------------------------------------------- finishing one

/**
 * A routine reaching its last step. Stamps the routine, then marks every
 * check any step pointed at with the same moment, which is the join the
 * whole design rests on: walking the morning routine answers "did I take my
 * pill" without being recorded twice.
 *
 * Steps that were skipped are passed in as skippedStepIds and mark nothing,
 * because a skipped step is the person saying they did not do that one, and
 * recording it anyway would make the record worse than useless.
 */
export async function completeRoutine(routineId: string, skippedStepIds: string[] = []): Promise<void> {
  const db = await getDatabase();
  const finishedAt = new Date().toISOString();
  await db.runAsync(`UPDATE routines SET last_completed_at = ? WHERE id = ?`, finishedAt, routineId);
  const steps = await db.getAllAsync<{ id: string; checkId: string | null }>(
    `SELECT id, check_id AS checkId FROM routine_steps WHERE routine_id = ? AND check_id IS NOT NULL`,
    routineId,
  );
  const skipped = new Set(skippedStepIds);
  for (const step of steps) {
    if (skipped.has(step.id) || !step.checkId) continue;
    await markDoneCheck(step.checkId, 'routine', routineId, finishedAt);
  }
}

// ------------------------------------------------------------ what Home reads

export async function getRoutinesHomeData(): Promise<{ routines: Routine[]; checks: DoneCheck[] }> {
  const [routines, checks] = await Promise.all([getRoutines(), getDoneChecks()]);
  return { routines, checks };
}
