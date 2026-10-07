// Gathers the rows lib/dayTimeline.ts lays out, for the days around today.
// Read-only, apart from the one switch for showing the phone's calendar.
//
// The phone's calendar (B2) is read live each time and never copied in,
// and only when the person has turned it on for this device and the phone
// has given permission. The switch is device-bound (a computer has no
// phone calendar), so its app_meta key is in DEVICE_LOCAL_META_KEYS.
// Workouts and steps (B9) are the rows Health Connect has already filled
// in: every health_records row comes from that sync, and steps are only
// the days whose source says so.

import { Platform } from 'react-native';
import { getCheckinTagDefinition } from './checkinTags';
import { getDatabase } from './db';
import { isDesktopApp } from './desktop/bridge';
import { hasCalendarPermission, listDeviceEventsForTimeline } from './deviceCalendar';
import { EXERCISE_TYPE_NAMES } from './healthSync';
import {
  buildDayTimeline,
  dayStartMs,
  localDayOf,
  TIMELINE_DAYS_AHEAD,
  TIMELINE_DAYS_BACK,
  type DayTimelineView,
  type FilledInToday,
  type TimelineCalendarInput,
  type TimelineCheckinInput,
  type TimelineRunInput,
  type TimelineScheduleRow,
  type TimelineSleepInput,
  type TimelineStepsInput,
  type TimelineWorkoutInput,
  routineTotalMinutes,
} from './dayTimeline';
import { listDatedReminderSources } from './reminderSources';
import { getRoutines } from './routinesDb';
import { readOrClosed } from './vaultReads';

const CALENDAR_META_KEY = 'timeline_device_calendar';

/** Whether this device can show the phone's calendar at all. */
export function timelineCalendarSupported(): boolean {
  return !isDesktopApp() && (Platform.OS === 'android' || Platform.OS === 'ios');
}

export async function getTimelineCalendarOn(): Promise<boolean> {
  if (!timelineCalendarSupported()) return false;
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_meta WHERE key = ?', CALENDAR_META_KEY);
  return row?.value === '1';
}

export async function setTimelineCalendarOn(on: boolean): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO app_meta (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    CALENDAR_META_KEY,
    on ? '1' : '0',
    new Date().toISOString(),
  );
}

async function readCalendar(fromDay: string, dayAfterLast: string): Promise<TimelineCalendarInput[]> {
  try {
    if (!(await getTimelineCalendarOn())) return [];
    if (!(await hasCalendarPermission())) return [];
    const events = await listDeviceEventsForTimeline(new Date(dayStartMs(fromDay)), new Date(dayStartMs(dayAfterLast)));
    return events.map((event) => ({
      id: event.id,
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      allDay: event.allDay,
      location: event.location,
      calendarTitle: event.calendarTitle,
    }));
  } catch (error) {
    console.warn('[dayTimelineDb] Could not read the phone calendar', error);
    return [];
  }
}

type WorkoutRow = { id: string; startedAt: string; endedAt: string | null; minutes: number | null; exerciseType: number | null; detailJson: string | null };

function workoutName(row: WorkoutRow): string {
  try {
    const detail = row.detailJson ? (JSON.parse(row.detailJson) as { title?: string | null }) : null;
    if (detail?.title) return detail.title;
  } catch {
    // A detail that does not parse falls back to the exercise's name.
  }
  if (row.exerciseType !== null && EXERCISE_TYPE_NAMES[row.exerciseType]) return EXERCISE_TYPE_NAMES[row.exerciseType];
  return 'Workout';
}

function toWorkout(row: WorkoutRow): TimelineWorkoutInput {
  return { id: row.id, startedAt: row.startedAt, endedAt: row.endedAt, name: workoutName(row), minutes: row.minutes };
}

const WORKOUT_SQL = `SELECT id, started_at AS startedAt, ended_at AS endedAt, value AS minutes,
                            value2 AS exerciseType, detail_json AS detailJson
                       FROM health_records
                      WHERE record_type = 'exercise' AND started_at >= ? AND started_at < ?
                      ORDER BY started_at ASC`;

const TIMELINE_ITEM_TYPES = ['meal', 'supplement', 'prescription', 'otc', 'appointment', 'reminder', 'garden'];

export async function loadDayTimeline(now: number = Date.now()): Promise<DayTimelineView> {
  const db = await getDatabase();
  const today = localDayOf(now);
  const firstDay = localDayOf(dayStartMs(today, -TIMELINE_DAYS_BACK));
  const dayAfterLast = localDayOf(dayStartMs(today, TIMELINE_DAYS_AHEAD + 1));
  // The UTC columns are read a day wider at both ends and narrowed by local
  // day in the builder, since an evening entry west of Greenwich carries
  // tomorrow's date in UTC.
  const utcFrom = new Date(dayStartMs(firstDay, -1)).toISOString();
  const utcTo = new Date(dayStartMs(dayAfterLast, 1)).toISOString();

  const [schedule, runs, checkinRows, sleep, routines, dated, workoutRows, steps, calendar] = await Promise.all([
    db.getAllAsync<TimelineScheduleRow & { durationMinutes: number | null }>(
      `SELECT s.id, s.scheduled_for AS scheduledFor, s.duration_minutes AS durationMinutes, s.item_type AS itemType, s.meal_type AS mealType,
              COALESCE(s.title, '') AS title, s.status, s.provider_name AS providerName, s.location,
              t.name AS treatmentName
         FROM schedule_items s
         LEFT JOIN treatments t ON t.id = s.linked_treatment_id
        WHERE s.item_type IN (${TIMELINE_ITEM_TYPES.map(() => '?').join(', ')})
          AND substr(s.scheduled_for, 1, 10) >= ? AND substr(s.scheduled_for, 1, 10) < ?
          AND (s.item_type NOT IN ('supplement', 'prescription', 'otc') OR t.active = 1)
        ORDER BY s.scheduled_for ASC`,
      ...TIMELINE_ITEM_TYPES,
      firstDay,
      dayAfterLast,
    ),
    db.getAllAsync<TimelineRunInput>(
      `SELECT id, routine_id AS routineId, routine_name AS routineName, completed_at AS completedAt
         FROM routine_runs
        WHERE completed_at IS NOT NULL AND completed_at >= ? AND completed_at < ?`,
      utcFrom,
      utcTo,
    ),
    readOrClosed(() => db.getAllAsync<Omit<TimelineCheckinInput, 'tags'>>(
      `SELECT id, logged_at AS loggedAt, checkin_type AS checkinType, valence, severity
         FROM wellbeing_checkins
        WHERE logged_at >= ? AND logged_at < ? AND checkin_type <> 'food_trial_daily'
        ORDER BY logged_at ASC`,
      utcFrom,
      utcTo,
    ), []),
    readOrClosed(() => db.getAllAsync<TimelineSleepInput>(
      `SELECT id, started_at AS startedAt, ended_at AS endedAt
         FROM health_records
        WHERE record_type = 'sleep' AND started_at >= ? AND started_at < ?`,
      utcFrom,
      utcTo,
    ), []),
    getRoutines(),
    listDatedReminderSources(today),
    readOrClosed(() => db.getAllAsync<WorkoutRow>(WORKOUT_SQL, utcFrom, utcTo), []),
    db.getAllAsync<TimelineStepsInput>(
      `SELECT date, step_count AS steps FROM daily_step_counts
        WHERE source = 'health_connect' AND date >= ? AND date < ?`,
      firstDay,
      dayAfterLast,
    ),
    readCalendar(firstDay, dayAfterLast),
  ]);
  const scheduleMinutes: Record<string, number> = {};
  for (const row of schedule) {
    if (row.durationMinutes !== null && row.durationMinutes > 0) scheduleMinutes[row.id] = row.durationMinutes;
  }

  const tags =
    checkinRows.length === 0
      ? []
      : await readOrClosed(() => db.getAllAsync<{ checkinId: string; tagCode: string }>(
          `SELECT checkin_id AS checkinId, tag_code AS tagCode FROM checkin_tags
            WHERE (severity IS NULL OR severity > 0) AND checkin_id IN (${checkinRows.map(() => '?').join(', ')})`,
          ...checkinRows.map((row) => row.id),
        ), []);
  const checkins: TimelineCheckinInput[] = checkinRows.map((row) => ({
    ...row,
    tags: tags
      .filter((tag) => tag.checkinId === row.id)
      .map((tag) => getCheckinTagDefinition(tag.tagCode)?.label ?? tag.tagCode),
  }));

  return buildDayTimeline({
    now,
    schedule,
    routines: routines.map((routine) => ({
      id: routine.id,
      name: routine.name,
      reminderTime: routine.reminderTime,
      reminderDays: routine.reminderDays,
      reminderOn: routine.reminderOn,
      totalMinutes: routineTotalMinutes(routine.steps),
    })),
    runs,
    checkins,
    sleep,
    dated,
    calendar,
    workouts: workoutRows.map(toWorkout),
    steps,
    scheduleMinutes,
  });
}

/**
 * What Health Connect has filled in for today (B9), for the Home check-in:
 * the longest sleep ending today, today's steps and today's workouts.
 */
export async function loadFilledInToday(now: number = Date.now()): Promise<FilledInToday> {
  const db = await getDatabase();
  const today = localDayOf(now);
  const utcFrom = new Date(dayStartMs(today, -1)).toISOString();
  const utcTo = new Date(dayStartMs(today, 2)).toISOString();
  const [sleepRows, stepsRow, workoutRows] = await Promise.all([
    readOrClosed(() => db.getAllAsync<{ startedAt: string; endedAt: string | null }>(
      `SELECT started_at AS startedAt, ended_at AS endedAt FROM health_records
        WHERE record_type = 'sleep' AND ended_at >= ? AND ended_at < ?`,
      utcFrom,
      utcTo,
    ), []),
    db.getFirstAsync<{ steps: number }>(
      `SELECT step_count AS steps FROM daily_step_counts WHERE date = ? AND source = 'health_connect'`,
      today,
    ),
    readOrClosed(() => db.getAllAsync<WorkoutRow>(WORKOUT_SQL, utcFrom, utcTo), []),
  ]);
  let sleepMinutes: number | null = null;
  for (const row of sleepRows) {
    if (!row.endedAt || localDayOf(Date.parse(row.endedAt)) !== today) continue;
    const minutes = (Date.parse(row.endedAt) - Date.parse(row.startedAt)) / 60000;
    if (Number.isFinite(minutes) && minutes > 0 && (sleepMinutes === null || minutes > sleepMinutes)) sleepMinutes = minutes;
  }
  const workouts = workoutRows
    .filter((row) => localDayOf(Date.parse(row.startedAt)) === today)
    .map((row) => {
      const workout = toWorkout(row);
      return { name: workout.name, minutes: workout.minutes };
    });
  return { sleepMinutes, steps: stepsRow?.steps ?? null, workouts };
}
