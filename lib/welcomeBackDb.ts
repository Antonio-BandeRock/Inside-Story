// When the person last recorded anything, for the welcome-back line (C16).
// Reads the moment each kind of record was WRITTEN rather than the moment it
// is about, so a meal added today for last Tuesday still counts as today.
// See lib/welcomeBack.ts.
import { getDatabase } from './db';
import { latestStamp } from './welcomeBack';

// Table and the column holding when a row was written. A table missing on an
// older database is skipped rather than failing the line.
const RECORD_STAMPS: [string, string][] = [
  ['meals', 'created_at'],
  ['wellbeing_checkins', 'created_at'],
  ['exercise_logs', 'created_at'],
  ['body_measurements', 'created_at'],
  ['custom_tracker_entries', 'created_at'],
  ['capture_notes', 'created_at'],
  ['done_check_marks', 'marked_at'],
  ['routine_runs', 'started_at'],
  ['upkeep_doings', 'created_at'],
  ['garden_harvests', 'created_at'],
  ['finance_entries', 'occurred_on'],
  ['lab_results', 'created_at'],
];

export async function latestRecordMs(): Promise<number | null> {
  const db = await getDatabase();
  const stamps: (string | null)[] = [];
  for (const [table, column] of RECORD_STAMPS) {
    try {
      const row = await db.getFirstAsync<{ latest: string | null }>(`SELECT MAX(${column}) AS latest FROM ${table}`);
      stamps.push(row?.latest ?? null);
    } catch {
      // Not on this database yet.
    }
  }
  return latestStamp(stamps);
}
