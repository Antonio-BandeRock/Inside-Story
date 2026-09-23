// The reads behind Trends > Keeping Up.
//
// Everything that decides anything lives in lib/keepingUp.ts, which imports
// only the week arithmetic and is covered by scripts/test_keeping_up.js.
// This file fetches and nothing else.
//
// Five sources, and they are not equally old. done_check_marks, capture_notes
// and work_checkins have kept every row since the day they shipped, so those
// three bands can look back as far as somebody has been using the app.
// routine_runs and upkeep_doings started on 2026-09-23, because routines and
// upkeep each kept one stamp and overwrote it. Those two bands say so rather
// than drawing a chart of a range they cannot see into.
//
// One thing here is easy to get wrong and would quietly break every streak
// in the lens. done_check_marks, capture_notes and routine_runs all store
// `new Date().toISOString()`, which is UTC, so slicing the first ten
// characters off one gives the UTC day rather than the day the person was
// living in. Six hours west of Greenwich, everything marked after six in
// the evening would land on tomorrow, and a run of evening marks would read
// as no run at all. So a timestamp goes through a Date and comes back as
// the LOCAL day, which is what describeMarkMoment in lib/routines.ts has
// always done. upkeep_doings.done_on and work_checkins.week_of are already
// plain dates and need none of this.
//
// The same shift is why each SQL window reaches a day past the range at
// both ends: a row belonging to the first local day of the range can carry
// a UTC stamp before it. The extra rows are dropped by local day below.
//
// Two marks on one day are one day kept: nothing here counts taps.

import { getDatabase } from './db';
import { addDays } from './eatingVariety';
import {
  describeKeepingUpHome,
  readCadence,
  summarizeKeepingUp,
} from './keepingUp';
import type {
  KeepingUpCapture,
  KeepingUpCheck,
  KeepingUpHomeSummary,
  KeepingUpInputs,
  KeepingUpMark,
  KeepingUpRun,
  KeepingUpSummary,
  KeepingUpUpkeepDoing,
  KeepingUpUpkeepStanding,
  KeepingUpWorkCheckin,
} from './keepingUp';
import { upkeepStanding } from './upkeep';
import { listUpkeepItems } from './upkeepDb';

/** A stored UTC timestamp reduced to the local day it landed on. */
function dayOf(value: string | null | undefined): string | null {
  if (!value) return null;
  const when = new Date(value);
  if (Number.isNaN(when.getTime())) return null;
  const year = when.getFullYear();
  const month = `${when.getMonth() + 1}`.padStart(2, '0');
  const day = `${when.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** True when a local day falls inside the charted range. */
function inRange(day: string, startDate: string, endDate: string): boolean {
  return day >= startDate && day <= endDate;
}

async function readUpkeepStanding(today: string): Promise<KeepingUpUpkeepStanding> {
  const items = await listUpkeepItems();
  let overdue = 0;
  let dueSoon = 0;
  let settled = 0;
  let worstName: string | null = null;
  let worstDaysLate: number | null = null;

  for (const item of items) {
    if (!item.active) continue;
    const standing = upkeepStanding(item, today);
    // Something with no date at all is counted nowhere. It is not overdue,
    // it is not settled, and calling it either would be the app inventing a
    // schedule nobody set.
    if (standing.daysAway == null) continue;
    if (standing.overdue) {
      overdue += 1;
      const late = -standing.daysAway;
      if (worstDaysLate == null || late > worstDaysLate) {
        worstDaysLate = late;
        worstName = item.name;
      }
    } else if (standing.dueSoon) {
      dueSoon += 1;
    } else {
      settled += 1;
    }
  }

  return { overdue, dueSoon, settled, worstName, worstDaysLate };
}

export async function getKeepingUpInputs(startDate: string, endDate: string): Promise<KeepingUpInputs> {
  const db = await getDatabase();
  // A day wider than the range at both ends, then narrowed by local day.
  const from = addDays(startDate, -1);
  const until = `${addDays(endDate, 1)}T23:59:59.999Z`;

  const [checkRows, markRows, runRows, captureRows, doingRows, workRows, standing] = await Promise.all([
    db.getAllAsync<{ id: string; name: string; cadence: string }>(
      `SELECT id, name, cadence FROM done_checks WHERE active = 1 ORDER BY position, name`,
    ),
    db.getAllAsync<{ checkId: string; markedAt: string }>(
      `SELECT check_id AS checkId, marked_at AS markedAt
         FROM done_check_marks
        WHERE marked_at >= ? AND marked_at <= ?`,
      from,
      until,
    ),
    db.getAllAsync<{
      routineId: string; routineName: string; startedAt: string; completedAt: string | null;
      stepsDone: number; stepsTotal: number; stoppedOnStep: string | null;
    }>(
      `SELECT routine_id AS routineId, routine_name AS routineName, started_at AS startedAt,
              completed_at AS completedAt, steps_done AS stepsDone, steps_total AS stepsTotal,
              stopped_on_step AS stoppedOnStep
         FROM routine_runs
        WHERE started_at >= ? AND started_at <= ?`,
      from,
      until,
    ),
    db.getAllAsync<{
      createdAt: string; sortedAt: string | null; doneAt: string | null; status: string;
    }>(
      `SELECT created_at AS createdAt, sorted_at AS sortedAt, done_at AS doneAt, status
         FROM capture_notes
        WHERE created_at >= ? AND created_at <= ?`,
      from,
      until,
    ),
    db.getAllAsync<{ itemName: string; doneOn: string; dueOn: string | null }>(
      `SELECT item_name AS itemName, done_on AS doneOn, due_on AS dueOn
         FROM upkeep_doings
        WHERE done_on >= ? AND done_on <= ?
        ORDER BY done_on`,
      startDate,
      endDate,
    ),
    db.getAllAsync<{
      weekOf: string; autonomy: number; competence: number; relatedness: number; drain: number;
    }>(
      `SELECT week_of AS weekOf, autonomy, competence, relatedness, drain
         FROM work_checkins
        WHERE week_of >= ? AND week_of <= ?
        ORDER BY week_of`,
      startDate,
      endDate,
    ),
    readUpkeepStanding(endDate),
  ]);

  const checks: KeepingUpCheck[] = checkRows.map((row) => ({
    id: row.id,
    name: row.name,
    cadence: readCadence(row.cadence),
  }));

  const marks: KeepingUpMark[] = [];
  for (const row of markRows) {
    const date = dayOf(row.markedAt);
    if (date && inRange(date, startDate, endDate)) marks.push({ checkId: row.checkId, date });
  }

  const runs: KeepingUpRun[] = [];
  for (const row of runRows) {
    const date = dayOf(row.startedAt);
    if (!date || !inRange(date, startDate, endDate)) continue;
    runs.push({
      routineId: row.routineId,
      routineName: row.routineName,
      date,
      completed: row.completedAt != null,
      stepsDone: row.stepsDone ?? 0,
      stepsTotal: row.stepsTotal ?? 0,
      // A finished walk stopped nowhere, and the column is null for one, so
      // this carries through as null without a second rule here.
      stoppedOnStep: row.stoppedOnStep,
    });
  }

  const captures: KeepingUpCapture[] = [];
  for (const row of captureRows) {
    const date = dayOf(row.createdAt);
    if (!date || !inRange(date, startDate, endDate)) continue;
    captures.push({
      date,
      sortedDate: dayOf(row.sortedAt),
      doneDate: dayOf(row.doneAt),
      waiting: row.status === 'waiting',
    });
  }

  const upkeepDoings: KeepingUpUpkeepDoing[] = doingRows.map((row) => ({
    itemName: row.itemName,
    doneOn: row.doneOn.slice(0, 10),
    dueOn: dayOf(row.dueOn),
  }));

  const workCheckins: KeepingUpWorkCheckin[] = workRows.map((row) => ({
    weekOf: row.weekOf.slice(0, 10),
    autonomy: row.autonomy,
    competence: row.competence,
    relatedness: row.relatedness,
    drain: row.drain,
  }));

  return {
    startDate,
    endDate,
    checks,
    marks,
    runs,
    captures,
    upkeepDoings,
    upkeepStanding: standing,
    workCheckins,
  };
}

export async function getKeepingUpSummary(startDate: string, endDate: string): Promise<KeepingUpSummary> {
  return summarizeKeepingUp(await getKeepingUpInputs(startDate, endDate));
}

// How far back the Home card looks. Long enough for a streak to have built
// up, short enough that the card is about now.
const HOME_RANGE_DAYS = 56;

export async function getKeepingUpHomeSummary(today: string): Promise<KeepingUpHomeSummary> {
  const summary = await getKeepingUpSummary(addDays(today, -(HOME_RANGE_DAYS - 1)), today);
  return describeKeepingUpHome(summary);
}
