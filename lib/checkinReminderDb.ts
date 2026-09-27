// The two reads the check-in reminders need (C1, 2026-09-26). The planning
// itself is in lib/reminderActions.ts, which has no database in it.

import { getDatabase } from './db';
import { localStampOf } from './dailyScales';
import type { LoggedMealForNudge } from './reminderActions';

export type CheckinReminderInputs = {
  /** Meals eaten from `since` on, as local 'YYYY-MM-DDTHH:mm'. */
  recentMeals: LoggedMealForNudge[];
  /** The latest check-in of any kind but the morning one, local
   *  'YYYY-MM-DDTHH:mm', or null. A morning answer about last night is not
   *  an answer to how the day went, so it leaves the evening question alone. */
  lastCheckinAt: string | null;
  /** The latest morning check-in (D7), local 'YYYY-MM-DDTHH:mm', or null. */
  lastMorningAt: string | null;
};

// meals.eaten_at and wellbeing_checkins.logged_at are both local wall-clock
// strings, so they compare as text against a local `since` with no time zone
// arithmetic.
export async function getCheckinReminderInputs(since: string): Promise<CheckinReminderInputs> {
  const db = await getDatabase();
  const [meals, last, morning] = await Promise.all([
    db.getAllAsync<LoggedMealForNudge>(
      `SELECT id, name, meal_type AS mealType, eaten_at AS eatenAt
         FROM meals
        WHERE eaten_at >= ?
        ORDER BY eaten_at DESC
        LIMIT 20`,
      since,
    ),
    db.getFirstAsync<{ at: string | null }>("SELECT MAX(logged_at) AS at FROM wellbeing_checkins WHERE checkin_type <> 'sleep'"),
    db.getFirstAsync<{ at: string | null }>("SELECT MAX(logged_at) AS at FROM wellbeing_checkins WHERE checkin_type = 'sleep'"),
  ]);
  // Home wrote UTC stamps before 1.0.53.4; localStampOf reads one back as
  // local time so it compares with the meals.
  return {
    recentMeals: meals,
    lastCheckinAt: last?.at ? localStampOf(last.at) : null,
    lastMorningAt: morning?.at ? localStampOf(morning.at) : null,
  };
}
