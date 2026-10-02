// Reads for the nine Trends lenses in lib/trendsMore.ts, 1.0.52.7. Every
// query here is a SELECT: Trends never writes. Windows reach a day past
// the range at both ends so a UTC stamp that lands on a neighbouring local
// day is still read, and the builders narrow to the range themselves.
import { getDatabase, getLabTests, listLabResults } from './db';
import { addDays } from './eatingVariety';
import { planDays } from './exercisePlan';
import { listMealGlucose } from './mealGlucoseDb';
import { listExercisePlans, listPlanMarks } from './exercisePlanDb';
import { listNocturiaNights } from './nocturiaDb';
import { getNutrientTrendSeriesForRange, getSleepTrendPoints } from './trendAnalysis';
import {
  buildBloodPressureView,
  BODY_SIGNAL_ORDER,
  buildBodySignalsView,
  buildCareView,
  buildDosesView,
  buildFermentsView,
  buildHydrationView,
  buildNightsView,
  buildPlannedView,
  buildReactionsView,
  buildWorkView,
  buildWorkoutsView,
  localDay,
  type BodySignalKey,
  type BodySignalReading,
  type DayRange,
  type WorkoutsInputs,
} from './trendsMore';
import type { ReadingView } from './readingBands';
import { buildSinceLastVisitBand, buildSinceLastVisitView, type SinceLastVisitInputs } from './sinceLastVisit';
import { listWorkCheckins } from './workDb';
import { parseKeptSets } from './workoutSession';
import { getCheckinTagDefinition, getCustomCheckinTags } from './checkinTags';
import { buildPacingView, PACING_TAG_CODES, pacingTodayLines, type PacingInputs, type PacingTodayLine } from './pacing';
import { therapyTypeLabel } from './therapyTypes';
import { buildCycleTrendsView, CYCLE_TRENDS_MIN_DAYS, type CycleTrendsInputs } from './cycleTrends';
import { listAllCycleDays } from './cycleDb';

export type TrendsMoreLens =
  | 'hydration'
  | 'bloodPressure'
  | 'doses'
  | 'care'
  | 'work'
  | 'reactions'
  | 'nights'
  | 'ferments'
  | 'planned'
  | 'bodySignals'
  | 'workouts'
  | 'pacing'
  | 'cycle';

export const DOSE_ITEM_TYPES = ['supplement', 'prescription', 'otc'];

function todayString(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function rangeForDays(days: number, today = todayString()): DayRange {
  return { start: addDays(today, -(days - 1)), end: today };
}

export async function listMealsAround(range: DayRange): Promise<{ eatenAt: string; name: string; mealType: string }[]> {
  const db = await getDatabase();
  return db.getAllAsync(
    `SELECT eaten_at AS eatenAt, name, meal_type AS mealType FROM meals
     WHERE eaten_at >= ? AND eaten_at < ? ORDER BY eaten_at ASC`,
    addDays(range.start, -1),
    addDays(range.end, 2),
  );
}

export async function listBloodPressureReadings(): Promise<
  { loggedAt: string; systolic: number; diastolic: number; pulse: number | null }[]
> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ loggedAt: string; type: string; value: number }>(
    `SELECT logged_at AS loggedAt, measurement_type AS type, value FROM body_measurements
     WHERE measurement_type IN ('blood_pressure_systolic', 'blood_pressure_diastolic', 'heart_rate_bpm')
     ORDER BY logged_at ASC`,
  );
  // A reading is a systolic and a diastolic written at the same moment; a
  // pulse at that moment rides along, and one on its own is left out.
  const byMoment = new Map<string, { systolic?: number; diastolic?: number; pulse?: number }>();
  for (const row of rows) {
    const entry = byMoment.get(row.loggedAt) ?? {};
    if (row.type === 'blood_pressure_systolic') entry.systolic = row.value;
    else if (row.type === 'blood_pressure_diastolic') entry.diastolic = row.value;
    else entry.pulse = row.value;
    byMoment.set(row.loggedAt, entry);
  }
  return [...byMoment.entries()]
    .filter(([, entry]) => entry.systolic !== undefined && entry.diastolic !== undefined)
    .map(([loggedAt, entry]) => ({
      loggedAt,
      systolic: entry.systolic as number,
      diastolic: entry.diastolic as number,
      pulse: entry.pulse ?? null,
    }));
}

export async function listScheduledDoses(range: DayRange): Promise<{ scheduledFor: string; title: string; status: string }[]> {
  const db = await getDatabase();
  return db.getAllAsync(
    `SELECT scheduled_for AS scheduledFor, title, status FROM schedule_items
     WHERE item_type IN (${DOSE_ITEM_TYPES.map(() => '?').join(', ')})
       AND scheduled_for >= ? AND scheduled_for < ?
     ORDER BY scheduled_for ASC`,
    ...DOSE_ITEM_TYPES,
    addDays(range.start, -1),
    addDays(range.end, 2),
  );
}

export async function listAllAppointments(): Promise<
  { scheduledFor: string; title: string; providerName: string | null; appointmentType: string | null; status: string }[]
> {
  const db = await getDatabase();
  return db.getAllAsync(
    `SELECT scheduled_for AS scheduledFor, title, provider_name AS providerName,
            appointment_type AS appointmentType, status
     FROM schedule_items WHERE item_type = 'appointment' ORDER BY scheduled_for ASC`,
  );
}

// Every appointment, lab result, flare and med record, read once for F19's
// Since your last appointment and for Before an Appointment on Insights.
export async function loadVisitRecords(today: string): Promise<SinceLastVisitInputs> {
  const db = await getDatabase();
  const [appointments, labRows, labTests, flares, treatments] = await Promise.all([
    listAllAppointments(),
    listLabResults(undefined, 200),
    getLabTests(),
    db.getAllAsync<{ loggedAt: string; severity: number | null; notes: string | null }>(
      `SELECT logged_at AS loggedAt, severity, notes FROM wellbeing_checkins WHERE checkin_type = 'flare' ORDER BY logged_at ASC`,
    ),
    db.getAllAsync<SinceLastVisitInputs['treatments'][number]>(
      `SELECT name, treatment_type AS treatmentType, start_date AS startDate, end_date AS endDate,
              updated_at AS updatedAt, dose_amount AS doseAmount, dose_unit AS doseUnit
       FROM treatments ORDER BY name`,
    ),
  ]);
  const names = new Map(labTests.map((test) => [test.code, test.displayName]));
  return {
    today,
    appointments,
    labs: labRows
      .map((lab) => ({
        displayName: names.get(lab.testCode) ?? lab.testCode,
        value: lab.value,
        unit: lab.unit,
        low: lab.labRangeLow,
        high: lab.labRangeHigh,
        testedAt: lab.testedAt,
      }))
      .sort((a, b) => a.testedAt.localeCompare(b.testedAt)),
    flares,
    treatments,
  };
}

export async function loadSinceLastVisitView(): Promise<ReadingView> {
  return buildSinceLastVisitView(await loadVisitRecords(todayString()));
}

export async function listFlareDates(): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ loggedAt: string }>(
    `SELECT logged_at AS loggedAt FROM wellbeing_checkins WHERE checkin_type = 'flare' ORDER BY logged_at ASC`,
  );
  return rows.map((row) => localDay(row.loggedAt));
}

export async function listMealReactions(range: DayRange): Promise<{ loggedAt: string; severity: number | null; mealName: string | null }[]> {
  const db = await getDatabase();
  return db.getAllAsync(
    `SELECT c.logged_at AS loggedAt, c.severity AS severity, m.name AS mealName
     FROM wellbeing_checkins c LEFT JOIN meals m ON m.id = c.related_meal_id
     WHERE c.checkin_type = 'post_meal' AND c.valence = 'negative'
       AND c.logged_at >= ? AND c.logged_at < ?
     ORDER BY c.logged_at ASC`,
    addDays(range.start, -1),
    addDays(range.end, 2),
  );
}

export async function listFoodTrialsForTrends(): Promise<
  { foodName: string; status: string; startedAt: string; resolvedAt: string | null; design: string | null; subjectKind: string | null }[]
> {
  const db = await getDatabase();
  return db.getAllAsync(
    `SELECT food_name AS foodName, status, started_at AS startedAt, resolved_at AS resolvedAt, design, subject_kind AS subjectKind
     FROM food_trials ORDER BY started_at ASC`,
  );
}

export async function listFermentBatches(): Promise<{ fermentationName: string; startedAt: string; stage: string }[]> {
  const db = await getDatabase();
  return db.getAllAsync(
    `SELECT f.name AS fermentationName, b.started_at AS startedAt, b.stage AS stage
     FROM fermentation_batches b JOIN fermentations f ON f.id = b.fermentation_id
     ORDER BY b.started_at ASC`,
  );
}

export async function listFermentHarvests(): Promise<
  { drinkName: string; readyAt: string; quantity: number; quantityRemaining: number; unit: string }[]
> {
  const db = await getDatabase();
  return db.getAllAsync(
    `SELECT drink_name AS drinkName, ready_at AS readyAt, quantity, quantity_remaining AS quantityRemaining, unit
     FROM fermentation_harvests ORDER BY ready_at ASC`,
  );
}

export async function listPlannedMeals(range: DayRange): Promise<{ scheduledFor: string; status: string; mealType: string | null }[]> {
  const db = await getDatabase();
  return db.getAllAsync(
    `SELECT scheduled_for AS scheduledFor, status, meal_type AS mealType FROM schedule_items
     WHERE item_type = 'meal' AND scheduled_for >= ? AND scheduled_for < ?
     ORDER BY scheduled_for ASC`,
    addDays(range.start, -1),
    addDays(range.end, 2),
  );
}

// Trends > Workouts (1.0.55.14). exercise_logs.logged_at is a local
// 'YYYY-MM-DDTHH:mm'; workout_sessions.finished_at is an ISO stamp, so its
// window reaches a day past the range at both ends like every other one.
// A workout's name comes from the workouts table, archived ones included,
// so a plan for a workout since removed still reads by its name.
export async function loadWorkoutsInputs(range: DayRange, today: string): Promise<WorkoutsInputs> {
  const db = await getDatabase();
  const from = addDays(range.start, -1);
  const through = addDays(range.end, 2);
  const [logs, sessionRows, workoutRows, plans, marks] = await Promise.all([
    db.getAllAsync<{ loggedAt: string; exerciseType: string | null; minutes: number | null; intensity: string | null }>(
      `SELECT logged_at AS loggedAt, exercise_type AS exerciseType, duration_minutes AS minutes, intensity
       FROM exercise_logs WHERE logged_at >= ? AND logged_at < ? ORDER BY logged_at ASC`,
      from,
      through,
    ),
    db.getAllAsync<{ workoutName: string | null; finishedAt: string; setsJson: string | null }>(
      `SELECT workout_name AS workoutName, finished_at AS finishedAt, sets_json AS setsJson
       FROM workout_sessions WHERE finished_at >= ? AND finished_at < ? ORDER BY finished_at ASC`,
      from,
      through,
    ),
    db.getAllAsync<{ id: string; name: string }>(`SELECT id, name FROM workouts`),
    listExercisePlans(),
    listPlanMarks(range.start, range.end),
  ]);
  const names = new Map(workoutRows.map((row) => [row.id, row.name]));
  const upTo = today < range.end ? today : range.end;
  const plannedDays = upTo < range.start
    ? []
    : planDays(plans, marks, names, range.start, upTo).flatMap((day) =>
        day.entries.map((entry) => ({ date: entry.date, title: entry.title, mark: entry.mark?.status ?? null })),
      );
  return {
    range,
    today,
    logs: logs.map((log) => ({ ...log, exerciseType: log.exerciseType ?? '' })),
    sessions: sessionRows.map((row) => ({
      workoutName: row.workoutName ?? '',
      finishedAt: row.finishedAt,
      sets: parseKeptSets(row.setsJson),
    })),
    plannedDays,
  };
}

// Health Connect's record types, as healthSync.ts stores them, to the
// signal each one is read as on Trends > Body Signals.
const BODY_SIGNAL_RECORD_TYPES: Record<string, BodySignalKey> = {
  resting_heart_rate: 'restingHeartRate',
  heart_rate: 'heartRate',
  hrv: 'hrv',
  spo2: 'spo2',
  glucose: 'glucose',
  skin_temperature: 'skinTemperature',
};

function readMinMax(detailJson: string | null): { low: number | null; high: number | null } {
  if (!detailJson) return { low: null, high: null };
  try {
    const detail = JSON.parse(detailJson) as { min?: unknown; max?: unknown };
    return {
      low: typeof detail.min === 'number' ? detail.min : null,
      high: typeof detail.max === 'number' ? detail.max : null,
    };
  } catch {
    return { low: null, high: null };
  }
}

export async function listBodySignalReadings(): Promise<BodySignalReading[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    recordType: string;
    localDate: string;
    startedAt: string;
    value: number | null;
    value2: number | null;
    detailJson: string | null;
  }>(
    `SELECT record_type AS recordType, local_date AS localDate, started_at AS startedAt,
            value, value2, detail_json AS detailJson
     FROM health_records
     WHERE record_type IN (${Object.keys(BODY_SIGNAL_RECORD_TYPES).map(() => '?').join(', ')})
     ORDER BY started_at ASC`,
    ...Object.keys(BODY_SIGNAL_RECORD_TYPES),
  );
  const readings: BodySignalReading[] = [];
  for (const row of rows) {
    const signal = BODY_SIGNAL_RECORD_TYPES[row.recordType];
    if (!signal || typeof row.value !== 'number' || !Number.isFinite(row.value)) continue;
    const reading: BodySignalReading = { signal, date: row.localDate, at: row.startedAt, value: row.value };
    if (signal === 'heartRate') Object.assign(reading, readMinMax(row.detailJson));
    if (signal === 'glucose') reading.mgdl = row.value2;
    readings.push(reading);
  }
  return readings;
}

// F2, 1.0.57.27. Which body readings have anything recorded, so Pattern
// Finder offers only those as outcomes.
export async function listRecordedBodySignals(): Promise<BodySignalKey[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ recordType: string }>(
    `SELECT DISTINCT record_type AS recordType FROM health_records
     WHERE record_type IN (${Object.keys(BODY_SIGNAL_RECORD_TYPES).map(() => '?').join(', ')}) AND value IS NOT NULL`,
    ...Object.keys(BODY_SIGNAL_RECORD_TYPES),
  );
  const found = new Set(rows.map((row) => BODY_SIGNAL_RECORD_TYPES[row.recordType]).filter(Boolean));
  return BODY_SIGNAL_ORDER.filter((signal) => found.has(signal));
}

// F2: one signal's readings from a local day on, for Pattern Finder.
export async function listBodySignalReadingsFrom(signal: BodySignalKey, fromDate: string): Promise<BodySignalReading[]> {
  const recordTypes = Object.keys(BODY_SIGNAL_RECORD_TYPES).filter((type) => BODY_SIGNAL_RECORD_TYPES[type] === signal);
  if (recordTypes.length === 0) return [];
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ localDate: string; startedAt: string; value: number | null }>(
    `SELECT local_date AS localDate, started_at AS startedAt, value
     FROM health_records
     WHERE record_type IN (${recordTypes.map(() => '?').join(', ')}) AND local_date >= ?
     ORDER BY started_at ASC`,
    ...recordTypes,
    fromDate,
  );
  return rows
    .filter((row) => typeof row.value === 'number' && Number.isFinite(row.value))
    .map((row) => ({ signal, date: row.localDate, at: row.startedAt, value: row.value as number }));
}

// D16, 1.0.57.24. The tags that count for pacing: the fixed ones, plus any
// symptom the person named under Energy or Sensory & Regulation that points
// the unwelcome way.
export function pacingTagCodes(): string[] {
  const own = getCustomCheckinTags()
    .filter((tag) => (tag.category === 'energy' || tag.category === 'sensory_regulation') && tag.usualValence === 'negative')
    .map((tag) => tag.code);
  return [...PACING_TAG_CODES, ...own];
}

// Every record Pacing reads, for the range. Windows reach a day past each
// end so a UTC stamp landing on a neighbouring local day is still read,
// then each row is put on its local day and narrowed by the builder.
// D16, Home's Pacing Today card: thirty days of the same records, so the
// usual range has enough days behind it, and only today's lines kept.
export async function getPacingHomeLines(today: string): Promise<PacingTodayLine[]> {
  return pacingTodayLines(await loadPacingInputs(rangeForDays(30, today), today));
}

export async function loadPacingInputs(range: DayRange, today: string): Promise<PacingInputs> {
  const db = await getDatabase();
  const from = addDays(range.start, -1);
  const through = addDays(range.end, 2);
  const codes = pacingTagCodes();
  const [stepRows, exerciseRows, therapyRows, tagRows] = await Promise.all([
    db.getAllAsync<{ date: string; value: number }>(
      `SELECT date, step_count AS value FROM daily_step_counts WHERE date >= ? AND date <= ? ORDER BY date ASC`,
      range.start,
      range.end,
    ),
    db.getAllAsync<{ loggedAt: string; name: string | null; minutes: number | null }>(
      `SELECT logged_at AS loggedAt, exercise_type AS name, duration_minutes AS minutes
       FROM exercise_logs WHERE logged_at >= ? AND logged_at < ? ORDER BY logged_at ASC`,
      from,
      through,
    ),
    db.getAllAsync<{ performedAt: string; therapyType: string; minutes: number | null }>(
      `SELECT performed_at AS performedAt, therapy_type AS therapyType, duration_minutes AS minutes
       FROM therapy_sessions WHERE performed_at >= ? AND performed_at < ? ORDER BY performed_at ASC`,
      from,
      through,
    ),
    db.getAllAsync<{ loggedAt: string; code: string }>(
      `SELECT c.logged_at AS loggedAt, t.tag_code AS code
       FROM checkin_tags t JOIN wellbeing_checkins c ON c.id = t.checkin_id
       WHERE c.logged_at >= ? AND c.logged_at < ? AND t.tag_code IN (${codes.map(() => '?').join(', ')})
       ORDER BY c.logged_at ASC`,
      from,
      through,
      ...codes,
    ),
  ]);
  return {
    range,
    today,
    steps: stepRows.filter((row) => typeof row.value === 'number'),
    exercise: exerciseRows.map((row) => ({ date: localDay(row.loggedAt), name: row.name ?? 'Exercise', minutes: row.minutes })),
    therapy: therapyRows.map((row) => ({ date: localDay(row.performedAt), label: therapyTypeLabel(row.therapyType), minutes: row.minutes })),
    tagged: tagRows.map((row) => ({
      date: localDay(row.loggedAt),
      code: row.code,
      label: getCheckinTagDefinition(row.code)?.label ?? row.code,
    })),
  };
}

// E3, 1.0.57.25. Every period day ever logged, so a start before the range
// still numbers the days in it, and the check-ins and tags in the range.
// A tag saved as None today (severity 0) is not a tag and is left out.
export async function loadCycleTrendsInputs(range: DayRange, today: string): Promise<CycleTrendsInputs> {
  const db = await getDatabase();
  const from = addDays(range.start, -1);
  const through = addDays(range.end, 2);
  const [cycleDays, checkinRows, tagRows] = await Promise.all([
    listAllCycleDays(),
    db.getAllAsync<{ loggedAt: string; type: string; mood: number | null; energy: number | null; stress: number | null }>(
      `SELECT logged_at AS loggedAt, checkin_type AS type, mood, energy, stress
       FROM wellbeing_checkins WHERE logged_at >= ? AND logged_at < ? ORDER BY logged_at ASC`,
      from,
      through,
    ),
    db.getAllAsync<{ loggedAt: string; code: string }>(
      `SELECT c.logged_at AS loggedAt, t.tag_code AS code
       FROM checkin_tags t JOIN wellbeing_checkins c ON c.id = t.checkin_id
       WHERE c.logged_at >= ? AND c.logged_at < ? AND (t.severity IS NULL OR t.severity > 0)
       ORDER BY c.logged_at ASC`,
      from,
      through,
    ),
  ]);
  const inRange = (date: string) => date >= range.start && date <= range.end;
  return {
    range,
    today,
    cycleDays,
    checkins: checkinRows
      .map((row) => ({ date: localDay(row.loggedAt), type: row.type, mood: row.mood, energy: row.energy, stress: row.stress }))
      .filter((row) => inRange(row.date)),
    tagged: tagRows
      .map((row) => ({ date: localDay(row.loggedAt), label: getCheckinTagDefinition(row.code)?.label ?? row.code }))
      .filter((row) => inRange(row.date)),
  };
}

export async function loadTrendsMoreView(lens: TrendsMoreLens, days: number): Promise<ReadingView> {
  const today = todayString();
  const range = rangeForDays(days, today);
  switch (lens) {
    case 'hydration': {
      const [meals, water] = await Promise.all([
        listMealsAround(range),
        getNutrientTrendSeriesForRange('water', range.start, range.end),
      ]);
      return buildHydrationView({ range, meals, waterPercentByDay: water.points });
    }
    case 'bloodPressure':
      return buildBloodPressureView({ range, readings: await listBloodPressureReadings() });
    case 'doses':
      return buildDosesView({ range, today, doses: await listScheduledDoses(range) });
    case 'care':
    {
      const records = await loadVisitRecords(today);
      return buildCareView({ range, today, appointments: records.appointments, sinceLast: buildSinceLastVisitBand(records) });
    }
    case 'work': {
      const [checkins, sleep, flareDates] = await Promise.all([
        listWorkCheckins(260),
        getSleepTrendPoints(days + 7),
        listFlareDates(),
      ]);
      return buildWorkView({ range, checkins, sleep, flareDates });
    }
    case 'reactions': {
      const [meals, reactions, trials] = await Promise.all([
        listMealsAround(range),
        listMealReactions(range),
        listFoodTrialsForTrends(),
      ]);
      return buildReactionsView({ range, mealDates: meals.map((m) => localDay(m.eatenAt)), reactions, trials });
    }
    case 'nights': {
      const [nights, meals] = await Promise.all([listNocturiaNights(400), listMealsAround(range)]);
      return buildNightsView({ range, nights, meals });
    }
    case 'ferments': {
      const [batches, harvests] = await Promise.all([listFermentBatches(), listFermentHarvests()]);
      return buildFermentsView({ range, batches, harvests });
    }
    case 'planned':
      return buildPlannedView({ range, today, planned: await listPlannedMeals(range) });
    case 'bodySignals': {
      // Ninety days before the range as well, so the usual rise after a
      // meal can draw on more than the range itself.
      const [readings, mealGlucose] = await Promise.all([
        listBodySignalReadings(),
        listMealGlucose(addDays(range.start, -90), range.end),
      ]);
      return buildBodySignalsView({ range, readings, mealGlucose });
    }
    case 'workouts':
      return buildWorkoutsView(await loadWorkoutsInputs(range, today));
    case 'cycle':
      return buildCycleTrendsView(
        await loadCycleTrendsInputs(rangeForDays(Math.max(days, CYCLE_TRENDS_MIN_DAYS), today), today),
      );
    case 'pacing':
      return buildPacingView(await loadPacingInputs(range, today));
  }
}
