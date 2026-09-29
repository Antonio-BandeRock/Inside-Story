// Your Progress: reading every record the page and the pictures are made
// of (C17). All of the arithmetic and every sentence is in lib/progress.ts
// and lib/progressScene.ts; this file only gathers, and hands each day over
// already reduced to the local day through localDay, since several of these
// columns hold UTC moments.
//
// Nothing here is stored except the "since you last looked" keys, which
// live in app_meta under PROGRESS_LAST_SEEN_META_KEY and are device-local
// (DEVICE_LOCAL_META_KEYS in lib/snapshotSync.ts), so opening the page on
// the computer does not clear what the phone has still to show.
import { ACHIEVEMENT_CRITERIA, evaluateAchievementCriteria } from './achievementCriteria';
import { cycleLengths, periodsFrom, type CycleDay } from './cycle';
import { getDatabaseWriteCount } from './databaseActivity';
import { getAchievedCriteriaDates, getDatabase, listFermentationStrains } from './db';
import {
  buildProgressBands,
  type FirstMet,
  localDay,
  localHour,
  type Named,
  type ProgressBand,
  type ProgressInputs,
  progressPieces,
} from './progress';
import { monthsBetweenInclusive } from './financeIncome';
import { REPORT_KINDS } from './reportKinds';

export const PROGRESS_LAST_SEEN_META_KEY = 'progress_last_seen';

type Db = Awaited<ReturnType<typeof getDatabase>>;

/** A read that treats a missing table or column as having nothing in it,
 *  so a database from before a table existed still opens the page. */
async function rows<T>(db: Db, sql: string, ...params: (string | number)[]): Promise<T[]> {
  try {
    return await db.getAllAsync<T>(sql, ...params);
  } catch {
    return [];
  }
}

function days(values: { at: string | null }[]): string[] {
  const out: string[] = [];
  for (const value of values) {
    const day = localDay(value.at);
    if (day) out.push(day);
  }
  return out;
}

function named(values: { name: string | null; at: string | null }[]): Named[] {
  const out: Named[] = [];
  for (const value of values) {
    const day = localDay(value.at);
    const name = value.name?.trim();
    if (day && name) out.push({ name, day });
  }
  return out;
}

function todayLocal(): string {
  return localDay(new Date().toISOString()) ?? new Date().toISOString().slice(0, 10);
}

export async function loadProgressInputs(): Promise<ProgressInputs> {
  try {
    await evaluateAchievementCriteria();
  } catch {
    // A first that cannot be checked now is checked on the next open.
  }
  const db = await getDatabase();
  const today = todayLocal();

  const met = await getAchievedCriteriaDates();
  const firsts: FirstMet[] = [];
  for (const criterion of ACHIEVEMENT_CRITERIA) {
    const at = met.get(criterion.key);
    const day = localDay(at ?? null);
    if (day) firsts.push({ key: criterion.key, label: criterion.label, tab: criterion.tab, day });
  }

  // Food
  const foodRows = await rows<{ name: string | null; grp: string | null; at: string | null }>(
    db,
    `SELECT mi.food_name AS name, mi.category AS grp, m.eaten_at AS at
       FROM meal_items mi JOIN meals m ON m.id = mi.meal_id
      WHERE mi.food_id IS NOT NULL AND mi.food_name IS NOT NULL`,
  );
  const wholeFoods = foodRows
    .map((row) => ({ name: row.name?.trim() ?? '', group: row.grp, day: localDay(row.at) ?? '' }))
    .filter((row) => row.name && row.day);
  const dishes = named(
    await rows(db, `SELECT mi.dish_name AS name, MIN(m.eaten_at) AS at FROM meal_items mi JOIN meals m ON m.id = mi.meal_id
      WHERE mi.dish_name IS NOT NULL AND TRIM(mi.dish_name) <> '' GROUP BY LOWER(TRIM(mi.dish_name))`),
  );
  const mealRows = await rows<{ at: string | null; type: string | null }>(db, 'SELECT eaten_at AS at, meal_type AS type FROM meals ORDER BY eaten_at');
  const mealDays = days(mealRows.filter((row) => row.type !== 'beverage'));

  const strainRows = await rows<{ strain: string; at: string | null }>(db, 'SELECT strain_id AS strain, MIN(created_at) AS at FROM fermentation_batch_strains GROUP BY strain_id');
  let strains: Named[] = [];
  if (strainRows.length > 0) {
    try {
      const reference = new Map((await listFermentationStrains()).map((strain) => [strain.id, strain.commonName || strain.scientificName]));
      strains = named(strainRows.map((row) => ({ name: reference.get(row.strain) ?? null, at: row.at })));
    } catch {
      strains = [];
    }
  }
  const fermentRows = await rows<{ name: string | null; started: string | null; stage: string; changed: string | null }>(
    db,
    `SELECT f.name AS name, b.started_at AS started, b.stage AS stage, b.stage_changed_at AS changed
       FROM fermentation_batches b LEFT JOIN fermentations f ON f.id = b.fermentation_id`,
  );
  const ferments = fermentRows
    .map((row) => ({ name: row.name?.trim() || 'A ferment', started: localDay(row.started) ?? '', stage: row.stage, changed: localDay(row.changed) }))
    .filter((row) => row.started);

  // Garden
  const plantingRows = await rows<{ name: string | null; area: string | null; planted: string | null; status: string; retired: string | null }>(
    db,
    `SELECT p.food_name AS name, g.name AS area, p.planted_at AS planted, p.status AS status, g.archived_at AS retired
       FROM garden_plantings p LEFT JOIN garden_plots g ON g.id = p.plot_id`,
  );
  const plantings = plantingRows
    .map((row) => ({
      name: row.name?.trim() ?? '',
      area: row.area?.trim() || 'a garden area',
      planted: localDay(row.planted) ?? '',
      status: row.status,
      areaRetired: Boolean(row.retired),
    }))
    .filter((row) => row.name && row.planted);
  const harvestRows = await rows<{ name: string | null; area: string | null; at: string | null }>(
    db,
    'SELECT h.food_name AS name, g.name AS area, h.harvested_at AS at FROM garden_harvests h LEFT JOIN garden_plots g ON g.id = h.plot_id',
  );
  const harvests = harvestRows
    .map((row) => ({ name: row.name?.trim() ?? '', area: row.area?.trim() || 'a garden area', day: localDay(row.at) ?? '' }))
    .filter((row) => row.name && row.day);
  const pileRows = await rows<{ name: string | null; started: string | null; status: string; additions: number }>(
    db,
    `SELECT p.name AS name, p.started_on AS started, p.status AS status,
            (SELECT COUNT(*) FROM compost_events e WHERE e.pile_id = p.id) AS additions
       FROM compost_piles p`,
  );
  const piles = pileRows
    .map((row) => ({ name: row.name?.trim() || 'A compost pile', started: localDay(row.started) ?? '', status: row.status, additions: Number(row.additions) || 0 }))
    .filter((row) => row.started);
  const gardenRecordDays = [
    ...plantings.map((row) => row.planted),
    ...harvests.map((row) => row.day),
    ...days(await rows(db, 'SELECT occurred_on AS at FROM compost_events')),
    ...days(await rows(db, 'SELECT measured_on AS at FROM garden_readings')),
    ...days(await rows(db, 'SELECT occurred_on AS at FROM garden_planting_events')),
  ];
  const seasonRows = await rows<{ area: string | null; years: number }>(
    db,
    `SELECT g.name AS area, COUNT(DISTINCT substr(h.harvested_at, 1, 4)) AS years
       FROM garden_harvests h JOIN garden_plots g ON g.id = h.plot_id
      WHERE g.archived_at IS NULL GROUP BY g.id`,
  );
  const harvestYearsByArea = seasonRows.filter((row) => row.area).map((row) => ({ area: row.area!.trim(), years: Number(row.years) || 0 }));

  // Life
  const routineRows = await rows<{ name: string | null; at: string | null }>(db, 'SELECT routine_name AS name, started_at AS at FROM routine_runs');
  const upkeepRows = await rows<{ name: string | null; at: string | null }>(db, 'SELECT item_name AS name, done_on AS at FROM upkeep_doings');
  const movementRows = await rows<{ name: string | null; at: string | null }>(db, 'SELECT exercise_type AS name, logged_at AS at FROM exercise_logs');
  const markDays = days(await rows(db, 'SELECT marked_at AS at FROM done_check_marks'));
  const workDays = days(await rows(db, 'SELECT week_of AS at FROM work_checkins'));
  const accountRows = await rows<{ name: string | null; first: string | null; last: string | null }>(
    db,
    `SELECT a.name AS name, MIN(h.recorded_on) AS first, MAX(h.recorded_on) AS last
       FROM finance_account_balance_history h JOIN finance_accounts a ON a.id = h.account_id
      WHERE a.active = 1 GROUP BY a.id`,
  );
  const accounts = accountRows
    .map((row) => ({ name: row.name?.trim() || 'An account', first: localDay(row.first) ?? '', last: localDay(row.last) ?? '' }))
    .filter((row) => row.first && row.last);
  const streamRows = await rows<{ first: string | null; last: string | null }>(
    db,
    `SELECT MIN(substr(occurred_on, 1, 7)) AS first, MAX(substr(occurred_on, 1, 7)) AS last FROM finance_entries
      WHERE direction = 'income' AND income_stream_id IS NOT NULL GROUP BY income_stream_id`,
  );

  // Signals
  const checkinDays = days(await rows(db, 'SELECT logged_at AS at FROM wellbeing_checkins'));
  const trackers = named(await rows(db, 'SELECT name, created_at AS at FROM custom_trackers'));
  const trackerEntryDays = days(await rows(db, 'SELECT logged_at AS at FROM custom_tracker_entries'));
  const trackerReadings = (
    await rows<{ name: string | null; count: number }>(
      db,
      `SELECT t.name AS name, COUNT(e.id) AS count FROM custom_trackers t
         LEFT JOIN custom_tracker_entries e ON e.tracker_id = t.id
        WHERE t.retired_at IS NULL GROUP BY t.id`,
    )
  )
    .filter((row) => row.name)
    .map((row) => ({ name: row.name!.trim(), count: Number(row.count) || 0 }));
  const trials = named(await rows(db, 'SELECT food_name AS name, started_at AS at FROM food_trials'));
  const cycleRows = await rows<CycleDay>(db, 'SELECT day, flow FROM cycle_days ORDER BY day ASC');
  const cycleCount = cycleRows.length > 0 ? cycleLengths(periodsFrom(cycleRows)).length : 0;

  // Schedules
  const doseRows = await rows<{ at: string | null }>(
    db,
    "SELECT updated_at AS at FROM schedule_items WHERE item_type IN ('supplement', 'prescription') AND status = 'logged' ORDER BY updated_at",
  );
  const doseDays = days(doseRows);
  const plannedThenEaten = named(
    await rows(
      db,
      `SELECT COALESCE(m.name, s.title) AS name, MIN(m.eaten_at) AS at FROM schedule_items s JOIN meals m ON m.id = s.linked_meal_id
        WHERE s.item_type = 'meal' AND s.status = 'logged' GROUP BY LOWER(TRIM(COALESCE(m.name, s.title)))`,
    ),
  );
  const marks: ProgressInputs['schedules']['marks'] = [];
  for (const row of mealRows.slice(-400)) {
    const day = localDay(row.at);
    const hour = localHour(row.at);
    if (day && hour !== null) marks.push({ day, hour, kind: 'meal' });
  }
  for (const row of doseRows.slice(-400)) {
    const day = localDay(row.at);
    const hour = localHour(row.at);
    if (day && hour !== null) marks.push({ day, hour, kind: 'dose' });
  }

  // Trends, Insights, Reports
  const weightReadings = (await rows<{ n: number }>(db, "SELECT COUNT(*) AS n FROM body_measurements WHERE measurement_type = 'weight'"))[0]?.n ?? 0;
  const stepDays = (await rows<{ n: number }>(db, 'SELECT COUNT(*) AS n FROM daily_step_counts WHERE step_count > 0'))[0]?.n ?? 0;
  const count = async (sql: string) => Number((await rows<{ n: number }>(db, sql))[0]?.n ?? 0);
  const activeTreatments = await count('SELECT COUNT(*) AS n FROM treatments WHERE active = 1');
  const filled: Record<string, boolean> = {
    nutrients: mealDays.length > 0,
    flags: mealDays.length > 0,
    symptoms: checkinDays.length > 0,
    meds: activeTreatments > 0,
    movement: movementRows.length > 0 || stepDays > 0,
    body: (await count('SELECT COUNT(*) AS n FROM body_measurements')) > 0,
    rules: (await count('SELECT COUNT(*) AS n FROM personal_rules WHERE active = 1')) > 0,
    labs: (await count('SELECT COUNT(*) AS n FROM lab_results')) > 0,
  };
  const captureDays = days(await rows(db, 'SELECT created_at AS at FROM capture_notes'));
  const lifeDays = [...days(routineRows), ...days(upkeepRows), ...markDays, ...workDays];
  const recordDays = [...mealDays, ...checkinDays, ...trackerEntryDays, ...doseDays, ...gardenRecordDays, ...lifeDays, ...days(movementRows), ...captureDays];

  return {
    today,
    firsts,
    food: { wholeFoods, dishes, strains, mealDays, ferments },
    garden: { plantings, harvests, piles, recordDays: gardenRecordDays, harvestYearsByArea },
    life: {
      routines: named(routineRows),
      upkeep: named(upkeepRows),
      movement: named(movementRows),
      routineDays: days(routineRows),
      markDays,
      upkeepDays: days(upkeepRows),
      workDays,
      accounts,
      // The span from first to last month, the way checkEstimate measures it.
      incomeStreamMonths: streamRows.map((row) => (row.first && row.last ? monthsBetweenInclusive(row.first, row.last) : 0)),
    },
    signals: { checkinDays, trackers, trackerEntryDays, trackerReadings, trials, cycleCount, hasCycleDays: cycleRows.length > 0 },
    schedules: { doseDays, mealDays, marks, plannedThenEaten },
    insights: { mealDays: new Set(mealDays).size, medsAndMealsSameDay: activeTreatments > 0 && mealDays.length > 0 },
    trends: { recordDays, weightReadings: Number(weightReadings) || 0, stepDays: Number(stepDays) || 0 },
    reports: { kinds: REPORT_KINDS.map((kind) => ({ label: kind.label, core: [...kind.core] })), filled },
    home: { captureDays },
  };
}

export type LoadedProgress = { inputs: ProgressInputs; bands: ProgressBand[] };

export async function loadProgress(): Promise<LoadedProgress> {
  const inputs = await loadProgressInputs();
  return { inputs, bands: buildProgressBands(inputs) };
}

/** The keys seen the last time the page was opened on this device, or null
 *  when it never has been. */
export async function readLastSeenPieces(): Promise<string[] | null> {
  const db = await getDatabase();
  const row = (await rows<{ value: string }>(db, 'SELECT value FROM app_meta WHERE key = ?', PROGRESS_LAST_SEEN_META_KEY))[0];
  if (!row) return null;
  try {
    const parsed = JSON.parse(row.value);
    return Array.isArray(parsed) ? parsed.filter((key): key is string => typeof key === 'string') : null;
  } catch {
    return null;
  }
}

export async function saveLastSeenPieces(inputs: ProgressInputs): Promise<void> {
  const db = await getDatabase();
  const keys = [...progressPieces(inputs).keys()];
  await db.runAsync(
    'INSERT INTO app_meta (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at',
    PROGRESS_LAST_SEEN_META_KEY,
    JSON.stringify(keys),
    new Date().toISOString(),
  );
}

// Nine tab screens each draw a picture from the same records, so they share
// one load. It is reused until something in the database changes or the
// day turns over; evaluateAchievementCriteria may itself write a first, so
// the write count is taken once the load has finished rather than before.
let shared: { writes: number; day: string; load: Promise<LoadedProgress> } | null = null;

export function loadProgressShared(): Promise<LoadedProgress> {
  const day = todayLocal();
  if (shared && shared.day === day && shared.writes === getDatabaseWriteCount()) return shared.load;
  const entry = { writes: -1, day, load: loadProgress() };
  shared = entry;
  entry.load.then(
    () => {
      entry.writes = getDatabaseWriteCount();
    },
    () => {
      if (shared === entry) shared = null;
    },
  );
  return entry.load;
}
