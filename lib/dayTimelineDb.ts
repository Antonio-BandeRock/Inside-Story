// Gathers the rows lib/dayTimeline.ts lays out, for the days around today.
// Read-only: nothing here writes.

import { getCheckinTagDefinition } from './checkinTags';
import { getDatabase } from './db';
import {
  buildDayTimeline,
  dayStartMs,
  localDayOf,
  TIMELINE_DAYS_AHEAD,
  TIMELINE_DAYS_BACK,
  type DayTimelineView,
  type TimelineCheckinInput,
  type TimelineRunInput,
  type TimelineScheduleRow,
  type TimelineSleepInput,
} from './dayTimeline';
import { listDatedReminderSources } from './reminderSources';
import { getRoutines } from './routinesDb';

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

  const [schedule, runs, checkinRows, sleep, routines, dated] = await Promise.all([
    db.getAllAsync<TimelineScheduleRow>(
      `SELECT s.id, s.scheduled_for AS scheduledFor, s.item_type AS itemType, s.meal_type AS mealType,
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
    db.getAllAsync<Omit<TimelineCheckinInput, 'tags'>>(
      `SELECT id, logged_at AS loggedAt, checkin_type AS checkinType, valence, severity
         FROM wellbeing_checkins
        WHERE logged_at >= ? AND logged_at < ? AND checkin_type <> 'food_trial_daily'
        ORDER BY logged_at ASC`,
      utcFrom,
      utcTo,
    ),
    db.getAllAsync<TimelineSleepInput>(
      `SELECT id, started_at AS startedAt, ended_at AS endedAt
         FROM health_records
        WHERE record_type = 'sleep' AND started_at >= ? AND started_at < ?`,
      utcFrom,
      utcTo,
    ),
    getRoutines(),
    listDatedReminderSources(today),
  ]);

  const tags =
    checkinRows.length === 0
      ? []
      : await db.getAllAsync<{ checkinId: string; tagCode: string }>(
          `SELECT checkin_id AS checkinId, tag_code AS tagCode FROM checkin_tags
            WHERE checkin_id IN (${checkinRows.map(() => '?').join(', ')})`,
          ...checkinRows.map((row) => row.id),
        );
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
    })),
    runs,
    checkins,
    sleep,
    dated,
  });
}
