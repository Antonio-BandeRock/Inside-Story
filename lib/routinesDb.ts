// Reading and writing routines and the "did I already do it" record.
//
// Added 2026-09-17. Same split every other area here follows: the schema in
// lib/db.ts, the rules and the wording in lib/routines.ts with no database so
// they can be checked without one, and the reading and writing here.

import { getDatabase } from './db';
import {
  ALL_CHECK_CADENCES,
  cleanReminderTime,
  cleanRoutineText,
  hasRoutineReminder,
  isRoutineTextUsable,
  parseReminderDays,
  serializeReminderDays,
  MAX_CHECK_NAME,
  MAX_OCCASION_NAME,
  MAX_ROUTINE_NAME,
  MAX_STEP_DETAIL,
  MAX_STEP_TEXT,
  type CheckCadence,
  type CheckMarkVia,
  type CustomOccasion,
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
  // Its photos go with it (1.0.53.7), so none is left pointing at nothing.
  await (await import('./mediaDb')).removePhotosOf('done_check', id);
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

// --------------------------------------------------- when it happens, theirs
//
// 2026-09-17: "There needs to be a way for them to add a new When it happens
// so they can create a routine specific to something that isn't on the list,
// and when they create it, it can then be something that can be selected in
// the list again if they ever create another routine for work for instance
// that has a lot of routines."

type OccasionRow = {
  id: string;
  name: string;
  hourFrom: number | null;
  hourTo: number | null;
  position: number;
};

const OCCASION_COLUMNS = `id, name, hour_from AS hourFrom, hour_to AS hourTo, position`;

/** An hour as the database should hold it: a whole 0 to 23, or null for one
 *  that does not belong to a time of day. Anything else is somebody's typo
 *  and becomes null rather than a routine that sorts oddly forever. */
function cleanHour(hour: number | null): number | null {
  if (hour === null || !Number.isFinite(hour)) return null;
  const whole = Math.trunc(hour);
  if (whole < 0 || whole > 23) return null;
  return whole;
}

function toOccasion(row: OccasionRow): CustomOccasion {
  return {
    id: row.id,
    name: row.name,
    hourFrom: cleanHour(row.hourFrom),
    hourTo: cleanHour(row.hourTo),
    position: row.position,
  };
}

export async function getRoutineOccasions(): Promise<CustomOccasion[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<OccasionRow>(
    `SELECT ${OCCASION_COLUMNS} FROM routine_occasions ORDER BY position ASC, name ASC`,
  );
  return rows.map(toOccasion);
}

export async function createRoutineOccasion(
  name: string,
  hourFrom: number | null = null,
  hourTo: number | null = null,
): Promise<string | null> {
  if (!isRoutineTextUsable(name)) return null;
  const db = await getDatabase();
  const id = newId('occasion');
  const next = await db.getFirstAsync<{ next: number }>(
    `SELECT COALESCE(MAX(position), -1) + 1 AS next FROM routine_occasions`,
  );
  await db.runAsync(
    `INSERT INTO routine_occasions (id, name, hour_from, hour_to, position, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    id,
    trimTo(name, MAX_OCCASION_NAME),
    cleanHour(hourFrom),
    cleanHour(hourTo),
    next?.next ?? 0,
    new Date().toISOString(),
  );
  return id;
}

export async function updateRoutineOccasion(
  id: string,
  name: string,
  hourFrom: number | null = null,
  hourTo: number | null = null,
): Promise<boolean> {
  if (!isRoutineTextUsable(name)) return false;
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE routine_occasions SET name = ?, hour_from = ?, hour_to = ? WHERE id = ?`,
    trimTo(name, MAX_OCCASION_NAME),
    cleanHour(hourFrom),
    cleanHour(hourTo),
    id,
  );
  return true;
}

/** Removing one puts every routine that used it back on Something else, by
 *  hand, because routines.occasion holds built-in keys as well as these ids
 *  and so cannot carry a foreign key. Without this the routines would still
 *  be there and would still be walkable, but would be listed under a name
 *  nothing can look up. */
export async function deleteRoutineOccasion(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`UPDATE routines SET occasion = 'other' WHERE occasion = ?`, id);
  await db.runAsync(`DELETE FROM routine_occasions WHERE id = ?`, id);
}

export async function moveRoutineOccasion(id: string, direction: -1 | 1): Promise<void> {
  const db = await getDatabase();
  const occasions = await getRoutineOccasions();
  const index = occasions.findIndex((entry) => entry.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= occasions.length) return;
  const reordered = [...occasions];
  const [held] = reordered.splice(index, 1);
  reordered.splice(target, 0, held);
  for (let position = 0; position < reordered.length; position += 1) {
    await db.runAsync(`UPDATE routine_occasions SET position = ? WHERE id = ?`, position, reordered[position].id);
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
  reminderTime: string | null;
  reminderDays: string | null;
  reminderOn: number;
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

/** The occasion comes back exactly as it was written. It used to be forced
 *  to one of the four built-ins here, which would now throw away the id of
 *  every occasion somebody made. One that no longer exists is handled where
 *  it is read instead, by routineOccasionLabel falling back to Something
 *  else, so the routine keeps working either way. */
function toRoutine(row: RoutineRow, steps: RoutineStep[]): Routine {
  return {
    id: row.id,
    name: row.name,
    occasion: row.occasion,
    active: row.active !== 0,
    position: row.position,
    lastCompletedAt: row.lastCompletedAt,
    reminderTime: cleanReminderTime(row.reminderTime),
    reminderDays: parseReminderDays(row.reminderDays),
    // A switch that is on with no time is off, because there is nothing
    // for it to fire at. Resolved here rather than at each of the four
    // places that read it.
    reminderOn: row.reminderOn !== 0 && cleanReminderTime(row.reminderTime) !== null,
    steps,
  };
}

const ROUTINE_COLUMNS = `id, name, occasion, active, position,
     last_completed_at AS lastCompletedAt,
     reminder_time AS reminderTime, reminder_days AS reminderDays, reminder_on AS reminderOn`;

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
    occasion || 'other',
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
    occasion || 'other',
    id,
  );
  return true;
}

/**
 * The time a routine speaks at, the days it speaks on, and whether it
 * speaks at all. Three columns written together because they only ever
 * mean anything together.
 *
 * The time survives the switch going off, so somebody who silences their
 * morning routine for a week away gets it back exactly as it was.
 *
 * Nothing is scheduled here. The caller reconciles afterwards with
 * syncReminderNotifications, the same contract lib/reminderPreferences.ts
 * keeps, so this file never imports the notification module.
 */
export async function setRoutineReminder(
  id: string,
  time: string | null,
  days: number[],
  on: boolean,
): Promise<void> {
  const db = await getDatabase();
  const cleaned = cleanReminderTime(time);
  await db.runAsync(
    `UPDATE routines SET reminder_time = ?, reminder_days = ?, reminder_on = ? WHERE id = ?`,
    cleaned,
    serializeReminderDays(days),
    cleaned && on ? 1 : 0,
    id,
  );
}

/**
 * Just enough of every routine that speaks to build its notifications:
 * the name, the time, the days, whether it has been walked today, and
 * whether it has any steps at all. The steps themselves are deliberately
 * not loaded, since a reminder never shows them.
 *
 * A routine with no steps is left out here rather than filtered later. A
 * notification that opens a walk with nothing to walk is worse than
 * silence, and it is the normal state of a routine somebody named and has
 * not finished writing.
 */
export async function listRoutineReminders(): Promise<Routine[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<RoutineRow>(
    `SELECT ${ROUTINE_COLUMNS} FROM routines
      WHERE active = 1 AND reminder_on = 1 AND reminder_time IS NOT NULL
      ORDER BY position ASC, name ASC`,
  );
  if (rows.length === 0) return [];
  const counts = await db.getAllAsync<{ routineId: string; total: number }>(
    `SELECT routine_id AS routineId, COUNT(*) AS total FROM routine_steps GROUP BY routine_id`,
  );
  const stepped = new Set(counts.filter((entry) => entry.total > 0).map((entry) => entry.routineId));
  return rows
    .map((row) => toRoutine(row, []))
    .filter((routine) => stepped.has(routine.id) && hasRoutineReminder(routine));
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
 * A routine reaching its last step. Stamps the routine, and nothing else.
 *
 * This used to gather up every step's check and write them all here, at the
 * end. 2026-09-17: "Did I do it is the user selecting to check the item off
 * as they are doing it." So the marks are written at the step now, by the
 * walking screen, the moment the person ticks one. That is both what they
 * asked for and the more honest record: somebody who takes their pill at
 * step two and then answers the door has still taken their pill, and used
 * to end up with no record of it at all.
 *
 * What is left here is the routine's own stamp, which still means what it
 * always meant: the last step was reached.
 */
export async function completeRoutine(routineId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE routines SET last_completed_at = ? WHERE id = ?`,
    new Date().toISOString(),
    routineId,
  );
}

// ------------------------------------------------- the record of each walk
//
// Added 2026-09-23 for Trends > Keeping Up, which had nothing to chart:
// routines.last_completed_at holds one timestamp and forgets the walk
// before it.
//
// The row is opened when the walk STARTS and moved along as it goes, so a
// walk somebody put down half way through still leaves the record of where
// they got to. Writing it only on completion would have missed the one
// case worth seeing.

export async function startRoutineRun(
  routineId: string,
  routineName: string,
  stepsTotal: number,
  firstStep: string | null,
): Promise<string | null> {
  if (stepsTotal <= 0) return null;
  const db = await getDatabase();
  const id = newId('run');
  await db.runAsync(
    `INSERT INTO routine_runs (id, routine_id, routine_name, started_at, steps_total, stopped_on_step, stopped_on_position)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id,
    routineId,
    routineName,
    new Date().toISOString(),
    stepsTotal,
    firstStep,
    0,
  );
  return id;
}

/** Where the walk has got to. Called on every move, so the row is right
 *  the moment somebody closes the screen rather than only at the end. */
export async function markRoutineRunProgress(
  runId: string | null,
  progress: { stepsDone: number; stepsSkipped: number; step: string | null; position: number },
): Promise<void> {
  if (!runId) return;
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE routine_runs SET steps_done = ?, steps_skipped = ?, stopped_on_step = ?, stopped_on_position = ?
     WHERE id = ?`,
    progress.stepsDone,
    progress.stepsSkipped,
    progress.step,
    progress.position,
    runId,
  );
}

/** The last step was reached. stopped_on_step goes back to null, since a
 *  finished walk stopped nowhere. */
export async function finishRoutineRun(
  runId: string | null,
  stepsDone: number,
  stepsSkipped: number,
): Promise<void> {
  if (!runId) return;
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE routine_runs SET completed_at = ?, steps_done = ?, steps_skipped = ?,
            stopped_on_step = NULL, stopped_on_position = NULL
     WHERE id = ?`,
    new Date().toISOString(),
    stepsDone,
    stepsSkipped,
    runId,
  );
}

// ------------------------------------------------------------ what Home reads

export async function getRoutinesHomeData(): Promise<{
  routines: Routine[];
  checks: DoneCheck[];
  occasions: CustomOccasion[];
}> {
  const [routines, checks, occasions] = await Promise.all([
    getRoutines(),
    getDoneChecks(),
    getRoutineOccasions(),
  ]);
  return { routines, checks, occasions };
}
