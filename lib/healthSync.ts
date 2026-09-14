// Pulling the phone's health store into this app's tables.
//
// Added 2026-09-14. lib/healthConnect.ts talks to Health Connect; this file
// decides what window to read, which table each signal lands in, and how a
// record becomes a row. Runs when the Movement area opens (if syncing is on)
// and when its Sync Now button is tapped. Nothing here runs in the
// background: Android throttles that, and a pull on open is enough for data
// that changes over hours.
//
// THE WINDOW. The first pull takes the last 90 days, which is as far back
// as Trends and Pattern Finder look. Every later pull starts seven days
// before the previous one finished, since a watch that was off the wrist
// or out of Bluetooth range writes its records late, and the replace-on-id
// storage makes re-reading a week cheap and harmless.
//
// WHAT IS NOT PULLED. Hydration and Nutrition, which this app writes to the
// store: reading them back would count a logged glass of water twice. Rows
// the store has since deleted are not removed here either; that needs the
// changes API and is a named follow-up.

import {
  countHealthRecords,
  getHealthSyncState,
  recordSyncedBodyMeasurement,
  recordSyncedStepCount,
  renameSyncedBodyMeasurementType,
  setHealthSyncLastSyncAt,
  upsertHealthRecords,
  type HealthRecordInput,
  type HealthRecordType,
} from './db';
import {
  type GrantedHealthAccess,
  type HealthSignalKey,
  localDateOf,
  readAllRecords,
  readDailyDistanceKm,
  readDailySteps,
} from './healthConnect';

const FIRST_PULL_DAYS = 90;
const OVERLAP_DAYS = 7;

export type HealthSyncCounts = Partial<Record<HealthSignalKey, number>>;

export type HealthSyncResult = {
  ok: boolean;
  /** Rows written per signal. A signal with access but no rows is 0; one without access is absent. */
  counts: HealthSyncCounts;
  finishedAt: string;
};

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function shiftIso(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function laterOf(a: string, b: string): string {
  return a > b ? a : b;
}

function localDateOfIso(iso: string): string {
  return localDateOf(new Date(iso));
}

function hoursBetween(startIso: string, endIso: string): number {
  return Math.max(0, (new Date(endIso).getTime() - new Date(startIso).getTime()) / 3_600_000);
}

// Sleep stage codes as the library reports them.
const SLEEP_STAGE_NAMES: Record<number, string> = {
  0: 'unknown',
  1: 'awake',
  2: 'sleeping',
  3: 'out_of_bed',
  4: 'light',
  5: 'deep',
  6: 'rem',
};

// The exercise types this app can name. Anything else is shown by its code.
export const EXERCISE_TYPE_NAMES: Record<number, string> = {
  0: 'Workout',
  2: 'Badminton',
  4: 'Baseball',
  5: 'Basketball',
  8: 'Biking',
  9: 'Stationary biking',
  10: 'Boot camp',
  11: 'Boxing',
  13: 'Calisthenics',
  14: 'Cricket',
  16: 'Dancing',
  25: 'Elliptical',
  26: 'Exercise class',
  27: 'Fencing',
  28: 'Football (American)',
  29: 'Football (Australian)',
  31: 'Frisbee',
  32: 'Golf',
  33: 'Guided breathing',
  34: 'Gymnastics',
  35: 'Handball',
  36: 'High intensity interval training',
  37: 'Hiking',
  38: 'Ice hockey',
  39: 'Ice skating',
  44: 'Martial arts',
  46: 'Paddling',
  47: 'Paragliding',
  48: 'Pilates',
  50: 'Racquetball',
  51: 'Rock climbing',
  52: 'Roller hockey',
  53: 'Rowing',
  54: 'Rowing machine',
  55: 'Rugby',
  56: 'Running',
  57: 'Treadmill running',
  58: 'Sailing',
  59: 'Scuba diving',
  60: 'Skating',
  61: 'Skiing',
  62: 'Snowboarding',
  63: 'Snowshoeing',
  64: 'Soccer',
  65: 'Softball',
  66: 'Squash',
  68: 'Stair climbing',
  69: 'Stair climbing machine',
  70: 'Strength training',
  71: 'Stretching',
  72: 'Surfing',
  73: 'Open water swimming',
  74: 'Pool swimming',
  75: 'Table tennis',
  76: 'Tennis',
  78: 'Volleyball',
  79: 'Walking',
  80: 'Water polo',
  81: 'Weightlifting',
  82: 'Wheelchair',
  83: 'Yoga',
};

function metaSource(metadata: { dataOrigin?: string } | undefined): string | null {
  return metadata?.dataOrigin || null;
}

function metaId(metadata: { id?: string } | undefined, fallback: string): string {
  return metadata?.id || fallback;
}

function recordRow(
  recordType: HealthRecordType,
  externalId: string,
  startedAt: string,
  endedAt: string | null,
  value: number | null,
  value2: number | null,
  unit: string | null,
  detail: Record<string, unknown> | null,
  sourceApp: string | null,
): HealthRecordInput {
  return {
    id: `hc_${recordType}_${externalId}`,
    recordType,
    startedAt,
    endedAt,
    localDate: localDateOfIso(startedAt),
    value,
    value2,
    unit,
    detailJson: detail ? JSON.stringify(detail) : null,
    sourceApp,
    externalId,
  };
}

async function syncSteps(fromIso: string, toIso: string): Promise<number> {
  const days = await readDailySteps(localDateOfIso(fromIso), localDateOfIso(toIso));
  for (const day of days) await recordSyncedStepCount(day.date, day.value);
  return days.length;
}

async function syncDistance(fromIso: string, toIso: string): Promise<number> {
  const days = await readDailyDistanceKm(localDateOfIso(fromIso), localDateOfIso(toIso));
  const rows = days.map((day) =>
    recordRow('distance', day.date, `${day.date}T00:00:00`, null, day.value, null, 'km', null, day.sources[0] ?? null),
  );
  await upsertHealthRecords(rows);
  return rows.length;
}

async function syncSleep(fromIso: string, toIso: string): Promise<number> {
  const sessions = await readAllRecords('SleepSession', fromIso, toIso);
  const rows = sessions.map((session, index) => {
    const stageHours: Record<string, number> = {};
    for (const stage of session.stages ?? []) {
      const name = SLEEP_STAGE_NAMES[stage.stage] ?? String(stage.stage);
      stageHours[name] = (stageHours[name] ?? 0) + hoursBetween(stage.startTime, stage.endTime);
    }
    const asleep = (stageHours.sleeping ?? 0) + (stageHours.light ?? 0) + (stageHours.deep ?? 0) + (stageHours.rem ?? 0);
    const total = hoursBetween(session.startTime, session.endTime);
    // A night is dated by the morning it ends on, so "last night" reads as
    // today's row rather than yesterday's.
    const row = recordRow(
      'sleep',
      metaId(session.metadata, `${session.startTime}_${index}`),
      session.startTime,
      session.endTime,
      total,
      asleep > 0 ? asleep : null,
      'hours',
      Object.keys(stageHours).length > 0 ? { stageHours, title: session.title ?? null } : session.title ? { title: session.title } : null,
      metaSource(session.metadata),
    );
    row.localDate = localDateOfIso(session.endTime);
    return row;
  });
  await upsertHealthRecords(rows);
  return rows.length;
}

// Heart rate arrives as thousands of samples. One row per day carrying the
// average, low and high is what any chart here would want, and it keeps
// the table small.
async function syncHeartRate(fromIso: string, toIso: string): Promise<number> {
  const records = await readAllRecords('HeartRate', fromIso, toIso);
  const byDay = new Map<string, { sum: number; count: number; min: number; max: number; source: string | null }>();
  for (const record of records) {
    for (const sample of record.samples) {
      const date = localDateOfIso(sample.time);
      const bucket = byDay.get(date) ?? { sum: 0, count: 0, min: Infinity, max: -Infinity, source: metaSource(record.metadata) };
      bucket.sum += sample.beatsPerMinute;
      bucket.count += 1;
      bucket.min = Math.min(bucket.min, sample.beatsPerMinute);
      bucket.max = Math.max(bucket.max, sample.beatsPerMinute);
      byDay.set(date, bucket);
    }
  }
  const rows = [...byDay.entries()]
    .filter(([, bucket]) => bucket.count > 0)
    .map(([date, bucket]) =>
      recordRow(
        'heart_rate',
        date,
        `${date}T00:00:00`,
        null,
        Math.round(bucket.sum / bucket.count),
        bucket.max,
        'bpm',
        { min: bucket.min, max: bucket.max, samples: bucket.count },
        bucket.source,
      ),
    );
  await upsertHealthRecords(rows);
  return rows.length;
}

async function syncRestingHeartRate(fromIso: string, toIso: string): Promise<number> {
  const records = await readAllRecords('RestingHeartRate', fromIso, toIso);
  const rows = records.map((record, index) =>
    recordRow(
      'resting_heart_rate',
      metaId(record.metadata, `${record.time}_${index}`),
      record.time,
      null,
      record.beatsPerMinute,
      null,
      'bpm',
      null,
      metaSource(record.metadata),
    ),
  );
  await upsertHealthRecords(rows);
  return rows.length;
}

async function syncHrv(fromIso: string, toIso: string): Promise<number> {
  const records = await readAllRecords('HeartRateVariabilityRmssd', fromIso, toIso);
  const rows = records.map((record, index) =>
    recordRow(
      'hrv',
      metaId(record.metadata, `${record.time}_${index}`),
      record.time,
      null,
      record.heartRateVariabilityMillis,
      null,
      'ms',
      null,
      metaSource(record.metadata),
    ),
  );
  await upsertHealthRecords(rows);
  return rows.length;
}

async function syncSpo2(fromIso: string, toIso: string): Promise<number> {
  const records = await readAllRecords('OxygenSaturation', fromIso, toIso);
  const rows = records.map((record, index) =>
    recordRow(
      'spo2',
      metaId(record.metadata, `${record.time}_${index}`),
      record.time,
      null,
      record.percentage,
      null,
      '%',
      null,
      metaSource(record.metadata),
    ),
  );
  await upsertHealthRecords(rows);
  return rows.length;
}

async function syncGlucose(fromIso: string, toIso: string): Promise<number> {
  const records = await readAllRecords('BloodGlucose', fromIso, toIso);
  const rows = records.map((record, index) =>
    recordRow(
      'glucose',
      metaId(record.metadata, `${record.time}_${index}`),
      record.time,
      null,
      record.level.inMillimolesPerLiter,
      record.level.inMilligramsPerDeciliter,
      'mmol/L',
      { specimenSource: record.specimenSource, mealType: record.mealType, relationToMeal: record.relationToMeal },
      metaSource(record.metadata),
    ),
  );
  await upsertHealthRecords(rows);
  return rows.length;
}

// One row per night's reading: the average delta from baseline, with the
// baseline kept in detail when the watch reported one.
async function syncSkinTemperature(fromIso: string, toIso: string): Promise<number> {
  const records = await readAllRecords('SkinTemperature', fromIso, toIso);
  const rows = records
    .filter((record) => record.deltas.length > 0)
    .map((record, index) => {
      const mean = record.deltas.reduce((sum, delta) => sum + delta.delta.inCelsius, 0) / record.deltas.length;
      return recordRow(
        'skin_temperature',
        metaId(record.metadata, `${record.startTime}_${index}`),
        record.startTime,
        record.endTime,
        Math.round(mean * 100) / 100,
        record.baseline ? record.baseline.inCelsius : null,
        'celsius_delta',
        { readings: record.deltas.length },
        metaSource(record.metadata),
      );
    });
  await upsertHealthRecords(rows);
  return rows.length;
}

async function syncMenstruation(fromIso: string, toIso: string): Promise<number> {
  const records = await readAllRecords('MenstruationFlow', fromIso, toIso);
  const rows = records.map((record, index) =>
    recordRow(
      'menstruation',
      metaId(record.metadata, `${record.time}_${index}`),
      record.time,
      null,
      record.flow ?? 0,
      null,
      'flow',
      null,
      metaSource(record.metadata),
    ),
  );
  await upsertHealthRecords(rows);
  return rows.length;
}

async function syncExercise(fromIso: string, toIso: string): Promise<number> {
  const records = await readAllRecords('ExerciseSession', fromIso, toIso);
  const rows = records.map((record, index) =>
    recordRow(
      'exercise',
      metaId(record.metadata, `${record.startTime}_${index}`),
      record.startTime,
      record.endTime,
      Math.round(hoursBetween(record.startTime, record.endTime) * 60),
      record.exerciseType,
      'minutes',
      { exerciseType: record.exerciseType, title: record.title ?? null, notes: record.notes ?? null },
      metaSource(record.metadata),
    ),
  );
  await upsertHealthRecords(rows);
  return rows.length;
}

async function syncWeight(fromIso: string, toIso: string): Promise<number> {
  const records = await readAllRecords('Weight', fromIso, toIso);
  let written = 0;
  for (const [index, record] of records.entries()) {
    const added = await recordSyncedBodyMeasurement({
      externalId: metaId(record.metadata, `weight_${record.time}_${index}`),
      loggedAt: record.time,
      measurementType: 'weight',
      value: Math.round(record.weight.inKilograms * 100) / 100,
      unit: 'kg',
      sourceApp: metaSource(record.metadata),
    });
    if (added) written += 1;
  }
  return written;
}

// A cuff reading is two figures, and body_measurements holds one per row,
// so it becomes two rows sharing a record id with a suffix each. The type
// names are the ones Home and Life type readings in under, so the report
// and Life's history see both kinds (2026-09-14; the first sync used
// shorter names, folded in here on the next pull).
async function syncBloodPressure(fromIso: string, toIso: string): Promise<number> {
  await renameSyncedBodyMeasurementType('systolic', 'blood_pressure_systolic');
  await renameSyncedBodyMeasurementType('diastolic', 'blood_pressure_diastolic');
  const records = await readAllRecords('BloodPressure', fromIso, toIso);
  let written = 0;
  for (const [index, record] of records.entries()) {
    const baseId = metaId(record.metadata, `bp_${record.time}_${index}`);
    const source = metaSource(record.metadata);
    const systolic = await recordSyncedBodyMeasurement({
      externalId: `${baseId}:systolic`,
      loggedAt: record.time,
      measurementType: 'blood_pressure_systolic',
      value: Math.round(record.systolic.inMillimetersOfMercury),
      unit: 'mmHg',
      sourceApp: source,
    });
    const diastolic = await recordSyncedBodyMeasurement({
      externalId: `${baseId}:diastolic`,
      loggedAt: record.time,
      measurementType: 'blood_pressure_diastolic',
      value: Math.round(record.diastolic.inMillimetersOfMercury),
      unit: 'mmHg',
      sourceApp: source,
    });
    if (systolic || diastolic) written += 1;
  }
  return written;
}

const SYNCERS: { key: HealthSignalKey; run: (fromIso: string, toIso: string) => Promise<number> }[] = [
  { key: 'steps', run: syncSteps },
  { key: 'distance', run: syncDistance },
  { key: 'exercise', run: syncExercise },
  { key: 'glucose', run: syncGlucose },
  { key: 'sleep', run: syncSleep },
  { key: 'cycle', run: syncMenstruation },
  { key: 'weight', run: syncWeight },
  { key: 'bloodPressure', run: syncBloodPressure },
  { key: 'heartRate', run: syncHeartRate },
  { key: 'restingHeartRate', run: syncRestingHeartRate },
  { key: 'hrv', run: syncHrv },
  { key: 'spo2', run: syncSpo2 },
  { key: 'skinTemperature', run: syncSkinTemperature },
];

let inFlight: Promise<HealthSyncResult> | null = null;

// Pull everything the person has granted. Safe to call twice at once (the
// second caller shares the first pull) and safe to call with no access at
// all (every signal is skipped and nothing is written).
export function syncHealthConnect(access: GrantedHealthAccess): Promise<HealthSyncResult> {
  if (inFlight) return inFlight;
  inFlight = runSync(access).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function runSync(access: GrantedHealthAccess): Promise<HealthSyncResult> {
  const state = await getHealthSyncState();
  const toIso = new Date().toISOString();
  const floor = isoDaysAgo(FIRST_PULL_DAYS);
  const fromIso = state.lastSyncAt ? laterOf(floor, shiftIso(state.lastSyncAt, -OVERLAP_DAYS)) : floor;
  const counts: HealthSyncCounts = {};
  let ok = true;
  for (const syncer of SYNCERS) {
    if (!access.readable.has(syncer.key)) continue;
    try {
      counts[syncer.key] = await syncer.run(fromIso, toIso);
    } catch {
      ok = false;
      counts[syncer.key] = 0;
    }
  }
  if (ok) await setHealthSyncLastSyncAt(toIso);
  return { ok, counts, finishedAt: toIso };
}

// How much of each signal this app now holds, for the rows on the Movement
// area to say "nothing in the last 90 days" honestly.
export async function countStoredHealthRecords(): Promise<Partial<Record<HealthRecordType, number>>> {
  const types: HealthRecordType[] = [
    'distance', 'sleep', 'heart_rate', 'resting_heart_rate', 'hrv', 'spo2', 'glucose', 'skin_temperature', 'menstruation', 'exercise',
  ];
  const result: Partial<Record<HealthRecordType, number>> = {};
  for (const type of types) result[type] = await countHealthRecords(type);
  return result;
}
