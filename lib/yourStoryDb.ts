// Your Story's database side (lib/yourStory.ts holds every decision and
// every sentence). Three jobs: the chosen parts of life, the little Your
// Story remembers about itself, and looking for each item's record.
//
// An item is done when its record exists, so nothing here stores "done".
// Each lookup asks for the EARLIEST record of its kind, which becomes the
// item's dateline, and returns null when there is none. Timestamps come in
// three shapes across these tables (a plain date, SQLite's UTC
// datetime('now'), and ISO or local date-time strings), so every one goes
// through localDayOf rather than being sliced.

import { dayKey, localDayOf, normalizeBeatKeys, buildYourStory } from './yourStory';
import type { ArchiveFacts, BeatKey, YourStoryFacts, YourStoryItemKey, YourStoryView } from './yourStory';
import { getDatabase } from './db';
import { BACKUP_LAST_SAVED_META_KEY, listLocalBackupFiles } from './dataBackup';
import { readSyncState } from './snapshotSyncDevice';

type Db = Awaited<ReturnType<typeof getDatabase>>;

// THE CHOSEN PARTS OF LIFE.

export async function listBeats(): Promise<BeatKey[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ beat_key: string }>('SELECT beat_key FROM user_beats');
  return normalizeBeatKeys(rows.map((row) => row.beat_key));
}

export async function addBeat(key: BeatKey): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('INSERT OR IGNORE INTO user_beats (beat_key) VALUES (?)', key);
}

export async function removeBeat(key: BeatKey): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM user_beats WHERE beat_key = ?', key);
}

// WHAT YOUR STORY REMEMBERS.

type ItemRow = { item_key: string; seen_done_on: string | null; set_aside_on: string | null };

async function readItemRows(db: Db): Promise<ItemRow[]> {
  return db.getAllAsync<ItemRow>('SELECT item_key, seen_done_on, set_aside_on FROM your_story_items');
}

// Written once, the first day an item is seen done, and never moved after,
// so a record removed later can say when it had been there.
export async function markYourStorySeen(key: YourStoryItemKey, day: string = dayKey(new Date())): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `
      INSERT INTO your_story_items (item_key, seen_done_on) VALUES (?, ?)
      ON CONFLICT(item_key) DO UPDATE SET seen_done_on = excluded.seen_done_on
      WHERE your_story_items.seen_done_on IS NULL
    `,
    key,
    day,
  );
}

export async function setYourStoryItemAside(key: YourStoryItemKey): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `
      INSERT INTO your_story_items (item_key, set_aside_on) VALUES (?, ?)
      ON CONFLICT(item_key) DO UPDATE SET set_aside_on = excluded.set_aside_on
    `,
    key,
    dayKey(new Date()),
  );
}

export async function bringYourStoryItemBack(key: YourStoryItemKey): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE your_story_items SET set_aside_on = NULL WHERE item_key = ?', key);
}

// LOOKING FOR THE RECORDS.

async function earliest(db: Db, sql: string, ...params: (string | number)[]): Promise<string | null> {
  const row = await db.getFirstAsync<{ at: string | null }>(sql, ...params);
  return localDayOf(row?.at ?? null);
}

function earliestOf(...days: (string | null)[]): string | null {
  const present = days.filter((day): day is string => !!day).sort();
  return present.length > 0 ? present[0] : null;
}

async function distinctDays(db: Db, sql: string): Promise<Set<string>> {
  const rows = await db.getAllAsync<{ at: string | null }>(sql);
  const days = new Set<string>();
  for (const row of rows) {
    const day = localDayOf(row.at);
    if (day) days.add(day);
  }
  return days;
}

async function lookForRecords(db: Db): Promise<Partial<Record<YourStoryItemKey, string | null>>> {
  const beatsOn = await earliest(db, 'SELECT MIN(added_at) AS at FROM user_beats');
  const aboutYou = await earliest(
    db,
    `SELECT MIN(updated_at) AS at FROM user_profile
     WHERE birth_date IS NOT NULL AND TRIM(birth_date) <> '' AND sex IS NOT NULL AND TRIM(sex) <> ''`,
  );
  const emergencyProfile = await earliest(
    db,
    `SELECT MIN(created_at) AS at FROM emergency_profile
     WHERE COALESCE(drug_allergies, blood_type, devices, doctor_name, doctor_phone, preferred_hospital,
                    directive_location, other_notes) IS NOT NULL`,
  );
  const emergencyContacts = await earliest(db, 'SELECT MIN(created_at) AS at FROM emergency_contacts');
  const countdown = await earliest(db, 'SELECT MIN(created_at) AS at FROM countdowns');
  const gardenCountdown = await earliest(db, 'SELECT MIN(created_at) AS at FROM garden_countdowns');

  return {
    beats: beatsOn,
    aboutYou,
    conditions: await earliest(db, 'SELECT MIN(selected_at) AS at FROM user_conditions'),
    allergies: await earliest(db, 'SELECT MIN(added_at) AS at FROM user_food_allergies'),
    eatingStyle: await earliest(db, 'SELECT MIN(selected_at) AS at FROM diet_preferences'),
    neuro: await earliest(db, 'SELECT MIN(added_at) AS at FROM user_neuro_profile'),
    meds: await earliest(db, 'SELECT MIN(created_at) AS at FROM treatments'),
    emergency: earliestOf(emergencyProfile, emergencyContacts),
    capture: await earliest(db, 'SELECT MIN(created_at) AS at FROM capture_notes'),
    routine: await earliest(db, 'SELECT MIN(created_at) AS at FROM routines'),
    didIDoIt: await earliest(db, 'SELECT MIN(created_at) AS at FROM done_checks'),
    daysUntil: earliestOf(countdown, gardenCountdown),
    meal: await earliest(db, "SELECT MIN(eaten_at) AS at FROM meals WHERE meal_type <> 'beverage'"),
    checkin: await earliest(db, 'SELECT MIN(logged_at) AS at FROM wellbeing_checkins'),
    water: await earliest(db, "SELECT MIN(eaten_at) AS at FROM meals WHERE meal_type = 'beverage'"),
    exercise: await earliest(db, 'SELECT MIN(logged_at) AS at FROM exercise_logs'),
    gardenArea: await earliest(db, 'SELECT MIN(created_at) AS at FROM garden_plots'),
    planting: await earliest(db, 'SELECT MIN(created_at) AS at FROM garden_plantings'),
    harvest: await earliest(db, 'SELECT MIN(harvested_at) AS at FROM garden_harvests'),
    bills: await earliest(db, "SELECT MIN(created_at) AS at FROM finance_recurring WHERE direction = 'expense'"),
    spending: await earliest(db, "SELECT MIN(created_at) AS at FROM finance_entries WHERE direction = 'expense'"),
    upkeep: await earliest(db, 'SELECT MIN(created_at) AS at FROM upkeep_items'),
    kitchen: await earliest(
      db,
      "SELECT MIN(COALESCE(location_set_at, added_at)) AS at FROM kitchen_items WHERE location IS NOT NULL AND TRIM(location) <> ''",
    ),
    workCheckin: await earliest(db, 'SELECT MIN(created_at) AS at FROM work_checkins'),
    workBenefits: await earliest(db, 'SELECT MIN(created_at) AS at FROM work_benefits'),
    familyMember: await earliest(db, 'SELECT MIN(created_at) AS at FROM family_members'),
    familyConditions: await earliest(db, 'SELECT MIN(selected_at) AS at FROM family_member_conditions'),
  };
}

// Parses the local date-time strings meals and check-ins carry, and the
// ISO ones, into a moment. Null when the string is not a time at all.
function momentOf(stamp: string): number | null {
  const trimmed = stamp.trim();
  const iso = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(trimmed) ? trimmed.replace(' ', 'T') + 'Z' : trimmed;
  const ms = new Date(iso).getTime();
  return Number.isNaN(ms) ? null : ms;
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Pattern Finder's population (lib/patternFinder.ts): flares and meal
// reactions carrying a severity. One counts here when a meal was logged in
// the 24 hours before it, the shortest window Pattern Finder offers.
async function countFlaresWithMealsBefore(db: Db): Promise<number> {
  const symptoms = await db.getAllAsync<{ logged_at: string }>(
    "SELECT logged_at FROM wellbeing_checkins WHERE checkin_type IN ('flare', 'post_meal') AND severity IS NOT NULL",
  );
  if (symptoms.length === 0) return 0;
  const meals = await db.getAllAsync<{ eaten_at: string }>('SELECT eaten_at FROM meals');
  const mealTimes = meals
    .map((meal) => momentOf(meal.eaten_at))
    .filter((ms): ms is number => ms != null)
    .sort((a, b) => a - b);
  let count = 0;
  for (const symptom of symptoms) {
    const at = momentOf(symptom.logged_at);
    if (at == null) continue;
    if (mealTimes.some((ms) => ms <= at && ms >= at - DAY_MS)) count += 1;
  }
  return count;
}

async function countWaiting(db: Db): Promise<Partial<Record<YourStoryItemKey, number>>> {
  const mealDays = await distinctDays(db, "SELECT eaten_at AS at FROM meals WHERE meal_type <> 'beverage'");
  const movementDays = await distinctDays(db, 'SELECT logged_at AS at FROM exercise_logs');
  const keepingUpDays = new Set<string>([
    ...(await distinctDays(db, 'SELECT marked_at AS at FROM done_check_marks')),
    ...(await distinctDays(db, 'SELECT started_at AS at FROM routine_runs')),
    ...(await distinctDays(db, 'SELECT done_on AS at FROM upkeep_doings')),
  ]);
  const spendingDays = await distinctDays(db, "SELECT occurred_on AS at FROM finance_entries WHERE direction = 'expense'");
  const spendingMonths = new Set(Array.from(spendingDays).map((day) => day.slice(0, 7)));
  return {
    patterns: await countFlaresWithMealsBefore(db),
    trends: mealDays.size,
    movementTrend: movementDays.size,
    keepingUp: keepingUpDays.size,
    whatItCosts: spendingMonths.size,
  };
}

// THE ARCHIVE, which is per device.

async function lastBackupDay(db: Db): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_meta WHERE key = ?', BACKUP_LAST_SAVED_META_KEY);
  const recorded = localDayOf(row?.value ?? null);
  // A backup file written before the date was being recorded still counts.
  const files = await listLocalBackupFiles();
  const newestFile = files[0]?.modificationTimeMs;
  const fromFile = newestFile ? dayKey(new Date(newestFile)) : null;
  const both = [recorded, fromFile].filter((day): day is string => !!day).sort();
  return both.length > 0 ? both[both.length - 1] : null;
}

async function readArchive(db: Db): Promise<ArchiveFacts> {
  const sync = await readSyncState();
  return {
    syncOn: sync.enabled,
    syncSavedOn: localDayOf(sync.lastSavedAt),
    syncLoadedOn: localDayOf(sync.lastLoadedAt),
    lastBackupOn: await lastBackupDay(db),
  };
}

export async function loadYourStoryFacts(): Promise<YourStoryFacts> {
  const db = await getDatabase();
  const [beats, doneOn, counts, rows, archive] = await Promise.all([
    listBeats(),
    lookForRecords(db),
    countWaiting(db),
    readItemRows(db),
    readArchive(db),
  ]);
  const seenOn: YourStoryFacts['seenOn'] = {};
  const setAsideOn: YourStoryFacts['setAsideOn'] = {};
  for (const row of rows) {
    const key = row.item_key as YourStoryItemKey;
    if (row.seen_done_on) seenOn[key] = row.seen_done_on;
    if (row.set_aside_on) setAsideOn[key] = row.set_aside_on;
  }
  return { today: dayKey(new Date()), beats, doneOn, counts, seenOn, setAsideOn, archive };
}

// Builds the view and remembers anything seen done for the first time, so
// its record being removed later can be said to have been there.
export async function loadYourStory(): Promise<YourStoryView> {
  const facts = await loadYourStoryFacts();
  const view = buildYourStory(facts);
  for (const seen of view.newlySeen) {
    await markYourStorySeen(seen.key, seen.day);
  }
  return view;
}
