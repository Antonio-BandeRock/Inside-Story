// The phone's health store, read and written through Health Connect.
//
// Added 2026-09-14, the JS half of the 2026-09-14 rebuild that compiled in
// react-native-health-connect with 15 read and 3 write record types (see
// app.json). Everything here is Android only: Health Connect is built into
// Android 14 and installable from Android 9 up, and HealthKit on iPhone waits
// for an iOS build that does not exist yet. On any other platform every call
// answers 'unsupported' or an empty result and never throws.
//
// WHAT THIS FILE IS, AND IS NOT.
//
// It is the only place the library is called. It knows the record shapes, the
// permission list and the SDK status codes, and it turns each of them into a
// plain value the rest of the app can hold in state without importing anything
// from the library. It does no storage and no interpretation: lib/healthSync.ts
// decides what to keep and where, and the screens decide what to say.
//
// THE RULE THE WHOLE FEATURE RESTS ON: READ, NEVER INFER.
//
// Health Connect only holds what something wrote into it. A phone whose
// Samsung Health sync is off holds nothing, which is EMPTY, not zero, and a
// watch-only signal on a phone with no watch has NO SOURCE. So a read here
// answers with the records it found and nothing else; a missing day is a
// missing day, never a 0. The screens turn that into the honest empty states
// the Notion decision asked for ("nothing is being recorded, turn on step
// syncing in Samsung Health").
//
// STEPS ARE AGGREGATED, NOT SUMMED.
//
// A phone and a watch both write step records for the same minutes. Reading the
// raw records and adding them up would double count; Health Connect's aggregate
// call de-duplicates across sources. So daily steps and distance come from
// aggregateGroupByPeriod, and only the instantaneous signals (weight, a cuff
// reading, a glucose reading) and sessions (sleep, exercise) are read record
// by record.

import { Platform } from 'react-native';
import {
  SdkAvailabilityStatus,
  aggregateGroupByPeriod,
  getGrantedPermissions,
  getSdkStatus,
  initialize,
  insertRecords,
  openHealthConnectSettings,
  readRecords,
  requestPermission,
} from 'react-native-health-connect';
import type { Permission } from 'react-native-health-connect/lib/typescript/types';
import type {
  HealthConnectRecord,
  RecordType,
} from 'react-native-health-connect/lib/typescript/types/records.types';
import type { RecordResult } from 'react-native-health-connect/lib/typescript/types/results.types';
import type {
  AggregateResultRecordType,
  AggregationGroupResult,
} from 'react-native-health-connect/lib/typescript/types/aggregate.types';

export type HealthAvailability =
  /** Not Android: nothing here can work, and the screen says why. */
  | 'unsupported'
  /** Android, but Health Connect is not on the phone (older Android, never installed). */
  | 'not_installed'
  /** Health Connect is there but too old for this app's record types. */
  | 'update_required'
  | 'available';

// One signal per row on the Movement area. The key is what the rest of the
// app talks about; the record types are what Health Connect calls it. Ordered
// by the build order the Notion decision set: steps, glucose, sleep, cycle,
// then the scale and cuff, then the watch-only signals.
export type HealthSignalKey =
  | 'steps'
  | 'distance'
  | 'exercise'
  | 'glucose'
  | 'sleep'
  | 'cycle'
  | 'weight'
  | 'bloodPressure'
  | 'heartRate'
  | 'restingHeartRate'
  | 'hrv'
  | 'spo2'
  | 'skinTemperature';

export type HealthSignal = {
  key: HealthSignalKey;
  label: string;
  recordTypes: RecordType[];
  /** Who normally writes it, so a missing signal can say what is missing. */
  usualSource: 'phone' | 'app' | 'watch' | 'device';
  /** One line for the row's caption and the help text. */
  feeds: string;
};

export const HEALTH_SIGNALS: HealthSignal[] = [
  { key: 'steps', label: 'Steps', recordTypes: ['Steps'], usualSource: 'phone', feeds: 'Trends and Pattern Finder, as movement per day.' },
  { key: 'distance', label: 'Distance', recordTypes: ['Distance'], usualSource: 'phone', feeds: 'Shown beside steps.' },
  { key: 'exercise', label: 'Workouts', recordTypes: ['ExerciseSession'], usualSource: 'app', feeds: 'Recent sessions, with type and length.' },
  { key: 'glucose', label: 'Blood glucose', recordTypes: ['BloodGlucose'], usualSource: 'device', feeds: 'Readings from a meter or sensor, kept with their time.' },
  { key: 'sleep', label: 'Sleep', recordTypes: ['SleepSession'], usualSource: 'phone', feeds: 'Hours per night, in Trends.' },
  { key: 'cycle', label: 'Cycle', recordTypes: ['MenstruationFlow'], usualSource: 'app', feeds: 'Flow days, ready for the cycle work Pattern Finder is due to get.' },
  { key: 'weight', label: 'Weight', recordTypes: ['Weight'], usualSource: 'device', feeds: 'The same record Log Weight writes to.' },
  { key: 'bloodPressure', label: 'Blood pressure', recordTypes: ['BloodPressure'], usualSource: 'device', feeds: 'The same record Log Blood Pressure writes to.' },
  { key: 'heartRate', label: 'Heart rate', recordTypes: ['HeartRate'], usualSource: 'watch', feeds: 'A daily low, average and high.' },
  { key: 'restingHeartRate', label: 'Resting heart rate', recordTypes: ['RestingHeartRate'], usualSource: 'watch', feeds: 'One figure per day.' },
  { key: 'hrv', label: 'Heart rate variability', recordTypes: ['HeartRateVariabilityRmssd'], usualSource: 'watch', feeds: 'Kept, not interpreted.' },
  { key: 'spo2', label: 'Blood oxygen', recordTypes: ['OxygenSaturation'], usualSource: 'watch', feeds: 'Kept as read.' },
  { key: 'skinTemperature', label: 'Skin temperature', recordTypes: ['SkinTemperature'], usualSource: 'watch', feeds: 'Overnight change from baseline, kept as read.' },
];

export function isHealthConnectPlatform(): boolean {
  return Platform.OS === 'android';
}

export async function getHealthAvailability(): Promise<HealthAvailability> {
  if (!isHealthConnectPlatform()) return 'unsupported';
  try {
    const status = await getSdkStatus();
    if (status === SdkAvailabilityStatus.SDK_AVAILABLE) return 'available';
    if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) return 'update_required';
    return 'not_installed';
  } catch {
    return 'not_installed';
  }
}

let initialized = false;

// initialize() is cheap but not free, and the library needs it before any
// other call. Remembered per process; a failure is not remembered, so the
// next call tries again.
async function ensureInitialized(): Promise<boolean> {
  if (initialized) return true;
  if (!isHealthConnectPlatform()) return false;
  try {
    initialized = Boolean(await initialize());
  } catch {
    initialized = false;
  }
  return initialized;
}

function readPermissionsFor(signals: HealthSignal[]): Permission[] {
  return signals.flatMap((signal) =>
    signal.recordTypes.map((recordType) => ({ accessType: 'read' as const, recordType })),
  );
}

const WRITE_PERMISSIONS: Permission[] = [
  { accessType: 'write', recordType: 'Hydration' },
  { accessType: 'write', recordType: 'Nutrition' },
];

export type GrantedHealthAccess = {
  /** Signals every one of whose record types is readable. */
  readable: Set<HealthSignalKey>;
  canWriteHydration: boolean;
  canWriteNutrition: boolean;
};

function accessFromPermissions(granted: { accessType: string; recordType: string }[]): GrantedHealthAccess {
  const has = (accessType: 'read' | 'write', recordType: string) =>
    granted.some((permission) => permission.accessType === accessType && permission.recordType === recordType);
  const readable = new Set<HealthSignalKey>();
  for (const signal of HEALTH_SIGNALS) {
    if (signal.recordTypes.every((recordType) => has('read', recordType))) readable.add(signal.key);
  }
  return {
    readable,
    canWriteHydration: has('write', 'Hydration'),
    canWriteNutrition: has('write', 'Nutrition'),
  };
}

export function noHealthAccess(): GrantedHealthAccess {
  return { readable: new Set(), canWriteHydration: false, canWriteNutrition: false };
}

export async function getGrantedHealthAccess(): Promise<GrantedHealthAccess> {
  if (!(await ensureInitialized())) return noHealthAccess();
  try {
    return accessFromPermissions(await getGrantedPermissions());
  } catch {
    return noHealthAccess();
  }
}

// One system dialog listing every signal at once. Health Connect lets the
// person tick some and not others, and whatever they leave off simply reads
// as "not granted" on its row; nothing here nags for the rest.
export async function requestHealthAccess(): Promise<GrantedHealthAccess> {
  if (!(await ensureInitialized())) return noHealthAccess();
  try {
    const granted = await requestPermission([...readPermissionsFor(HEALTH_SIGNALS), ...WRITE_PERMISSIONS]);
    return accessFromPermissions(granted);
  } catch {
    return getGrantedHealthAccess();
  }
}

export async function openHealthSettings(): Promise<boolean> {
  if (!(await ensureInitialized())) return false;
  try {
    await openHealthConnectSettings();
    return true;
  } catch {
    return false;
  }
}

// --- Reads -----------------------------------------------------------------

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function localDateOf(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function localMidnight(date: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

export type DailyTotal = {
  date: string;
  value: number;
  /** Package names of whatever wrote the records, e.g. com.sec.android.app.shealth.
   *  Empty means nothing contributed, which is how a day with no data is told
   *  apart from a day of zero. */
  sources: string[];
};

// The group boundaries come back as local date-times ("2026-09-14T00:00"),
// since the period slicer works in the phone's zone, so the date is the first
// ten characters.
async function readDailyAggregate<T extends AggregateResultRecordType>(
  recordType: T,
  fromDate: string,
  toDate: string,
  pick: (result: AggregationGroupResult<T>['result']) => number,
): Promise<DailyTotal[]> {
  if (!(await ensureInitialized())) return [];
  try {
    const start = localMidnight(fromDate);
    const end = localMidnight(toDate);
    end.setDate(end.getDate() + 1);
    const groups = await aggregateGroupByPeriod({
      recordType,
      timeRangeFilter: { operator: 'between', startTime: start.toISOString(), endTime: end.toISOString() },
      timeRangeSlicer: { period: 'DAYS', length: 1 },
    });
    return groups
      .map((group) => ({
        date: group.startTime.slice(0, 10),
        value: pick(group.result),
        sources: (group.result as { dataOrigins?: string[] }).dataOrigins ?? [],
      }))
      .filter((entry) => entry.sources.length > 0);
  } catch {
    return [];
  }
}

export function readDailySteps(fromDate: string, toDate: string): Promise<DailyTotal[]> {
  return readDailyAggregate('Steps', fromDate, toDate, (result) => Math.round(result.COUNT_TOTAL));
}

export function readDailyDistanceKm(fromDate: string, toDate: string): Promise<DailyTotal[]> {
  return readDailyAggregate('Distance', fromDate, toDate, (result) => result.DISTANCE.inKilometers);
}

// Every record of one type in a window, following the page token until the
// store runs out. pageSize is the library's cap per call, not a limit on how
// many come back.
export async function readAllRecords<T extends RecordType>(
  recordType: T,
  fromIso: string,
  toIso: string,
): Promise<RecordResult<T>[]> {
  if (!(await ensureInitialized())) return [];
  const all: RecordResult<T>[] = [];
  let pageToken: string | undefined;
  try {
    do {
      const page = await readRecords(recordType, {
        timeRangeFilter: { operator: 'between', startTime: fromIso, endTime: toIso },
        ascendingOrder: true,
        pageSize: 1000,
        pageToken,
      });
      all.push(...page.records);
      pageToken = page.pageToken || undefined;
    } while (pageToken && all.length < 20000);
  } catch {
    // Whatever came back before the failure still stands; the caller treats
    // a short list the same as a complete one.
  }
  return all;
}

// --- Writes ----------------------------------------------------------------

// Written under a clientRecordId per day, so sending the same day twice
// replaces the earlier record instead of stacking a second one on top: a
// re-send after logging one more glass is a correction, not a duplicate.
// clientRecordVersion has to rise for Health Connect to take the replacement,
// and the send time does that.
function dayRecordMetadata(kind: string, date: string) {
  return {
    clientRecordId: `inside-story-${kind}-${date}`,
    clientRecordVersion: Date.now(),
    recordingMethod: 3, // RECORDING_METHOD_MANUAL_ENTRY: typed into this app, not sensed.
  };
}

function dayWindow(date: string): { startTime: string; endTime: string } {
  const start = localMidnight(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  // A day still in progress ends now, so the record never claims the future.
  const cappedEnd = end.getTime() > Date.now() ? new Date() : end;
  return { startTime: start.toISOString(), endTime: cappedEnd.toISOString() };
}

export async function writeDayHydration(date: string, milliliters: number): Promise<boolean> {
  if (!(await ensureInitialized())) return false;
  if (!(milliliters > 0)) return false;
  try {
    const record: HealthConnectRecord = {
      recordType: 'Hydration',
      ...dayWindow(date),
      volume: { value: Math.round(milliliters), unit: 'milliliters' },
      metadata: dayRecordMetadata('hydration', date),
    };
    const ids = await insertRecords([record]);
    return ids.length > 0;
  } catch {
    return false;
  }
}

// Whole-day totals keyed by this app's nutrient codes (the reference
// database's nutrients.code, as lib/nutrientAnalysis reports them). Only the
// codes Health Connect has a field for are sent; anything else (choline,
// glycine, lycopene) stays here because the store has nowhere to put it.
export type DayNutritionTotals = Record<string, number>;

const NUTRITION_FIELDS: { code: string; field: string; unit: 'grams' | 'milligrams' | 'micrograms' | 'kilocalories' }[] = [
  { code: 'energy_kcal', field: 'energy', unit: 'kilocalories' },
  { code: 'protein', field: 'protein', unit: 'grams' },
  { code: 'fat_total', field: 'totalFat', unit: 'grams' },
  { code: 'carbohydrate', field: 'totalCarbohydrate', unit: 'grams' },
  { code: 'fiber_total', field: 'dietaryFiber', unit: 'grams' },
  { code: 'sugars_total', field: 'sugar', unit: 'grams' },
  { code: 'fat_saturated', field: 'saturatedFat', unit: 'grams' },
  { code: 'fat_monounsaturated', field: 'monounsaturatedFat', unit: 'grams' },
  { code: 'fat_polyunsaturated', field: 'polyunsaturatedFat', unit: 'grams' },
  { code: 'cholesterol', field: 'cholesterol', unit: 'milligrams' },
  { code: 'vitamin_a', field: 'vitaminA', unit: 'micrograms' },
  { code: 'vitamin_c', field: 'vitaminC', unit: 'milligrams' },
  { code: 'vitamin_d', field: 'vitaminD', unit: 'micrograms' },
  { code: 'vitamin_e', field: 'vitaminE', unit: 'milligrams' },
  { code: 'vitamin_k', field: 'vitaminK', unit: 'micrograms' },
  { code: 'thiamin_b1', field: 'thiamin', unit: 'milligrams' },
  { code: 'riboflavin_b2', field: 'riboflavin', unit: 'milligrams' },
  { code: 'niacin_b3', field: 'niacin', unit: 'milligrams' },
  { code: 'pantothenic_acid_b5', field: 'pantothenicAcid', unit: 'milligrams' },
  { code: 'vitamin_b6', field: 'vitaminB6', unit: 'milligrams' },
  { code: 'biotin_b7', field: 'biotin', unit: 'micrograms' },
  { code: 'folate_b9', field: 'folate', unit: 'micrograms' },
  { code: 'vitamin_b12', field: 'vitaminB12', unit: 'micrograms' },
  { code: 'caffeine', field: 'caffeine', unit: 'milligrams' },
  { code: 'calcium', field: 'calcium', unit: 'milligrams' },
  { code: 'iron', field: 'iron', unit: 'milligrams' },
  { code: 'magnesium', field: 'magnesium', unit: 'milligrams' },
  { code: 'phosphorus', field: 'phosphorus', unit: 'milligrams' },
  { code: 'potassium', field: 'potassium', unit: 'milligrams' },
  { code: 'sodium', field: 'sodium', unit: 'milligrams' },
  { code: 'zinc', field: 'zinc', unit: 'milligrams' },
  { code: 'copper', field: 'copper', unit: 'milligrams' },
  { code: 'manganese', field: 'manganese', unit: 'milligrams' },
  { code: 'selenium', field: 'selenium', unit: 'micrograms' },
  { code: 'iodine', field: 'iodine', unit: 'micrograms' },
];

export function nutritionFieldsCovered(totals: DayNutritionTotals): number {
  return NUTRITION_FIELDS.filter((entry) => (totals[entry.code] ?? 0) > 0).length;
}

export async function writeDayNutrition(date: string, totals: DayNutritionTotals): Promise<boolean> {
  if (!(await ensureInitialized())) return false;
  const fields: Record<string, unknown> = {};
  for (const entry of NUTRITION_FIELDS) {
    const amount = totals[entry.code];
    if (!(amount > 0)) continue;
    fields[entry.field] = { value: amount, unit: entry.unit };
  }
  if (Object.keys(fields).length === 0) return false;
  try {
    const record = {
      recordType: 'Nutrition',
      ...dayWindow(date),
      ...fields,
      metadata: dayRecordMetadata('nutrition', date),
    } as HealthConnectRecord;
    const ids = await insertRecords([record]);
    return ids.length > 0;
  } catch {
    return false;
  }
}
