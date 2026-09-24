// The reads and writes behind the growing-conditions record.
//
// Everything that decides anything lives in lib/growingConditions.ts, which
// imports only pure helpers and is covered by
// scripts/test_growing_conditions.js. This file fetches, inserts and deletes,
// and nothing else.
//
// garden_readings is append-only in the sense the other history tables are:
// nothing rewrites a reading in place, and a row carries plot_name so an area
// moved to Past Areas or deleted leaves its readings readable as the record
// of what that ground was like. A reading can be deleted outright, because a
// mistyped figure has to be fixable and nothing refers to one.
//
// measured_on is a plain local date, so a ten-character comparison is the day
// the person was living in and none of the local-day machinery in
// lib/keepingUpDb.ts is needed here.

import { getDatabase, listGardenPlantings, listGardenPlots } from './db';
import type { GardenPlanting, GardenPlot } from './db';
import {
  buildMeasurementBand,
  buildMonths,
  describeAreaCoverage,
  describeMeasuredThings,
  type AreaCoverage,
  type GardenReading,
  type MeasurementBand,
  type MeasuredThing,
  type ReadingSource,
} from './growingConditions';
import { termLabel, type CustomGardenTerm } from './growSetup';
import { listGardenTerms } from './growSetupDb';

const READING_COLUMNS = `
  id, plot_id AS plotId, plot_name AS plotName, planting_id AS plantingId, measurement,
  value, unit, measured_on AS measuredOn, source, device_name AS deviceName, note, created_at AS createdAt
`;

function todayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Writing
// ---------------------------------------------------------------------------

export type NewReading = {
  plotId: string | null;
  plantingId: string | null;
  measurement: string;
  value: number;
  unit: string;
  measuredOn: string;
  note?: string | null;
  /** Stage 1 fills these; by hand they stay at their defaults. */
  source?: ReadingSource;
  deviceName?: string | null;
};

export async function addGardenReading(reading: NewReading): Promise<string> {
  const db = await getDatabase();
  const id = `reading_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  // The area's name is copied onto the row rather than joined at read time,
  // so the reading still says where it was taken after the area goes.
  let plotName: string | null = null;
  if (reading.plotId) {
    const row = await db.getFirstAsync<{ name: string }>('SELECT name FROM garden_plots WHERE id = ?', reading.plotId);
    plotName = row?.name ?? null;
  }
  await db.runAsync(
    `INSERT INTO garden_readings
       (id, plot_id, plot_name, planting_id, measurement, value, unit, measured_on, source, device_name, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    reading.plotId,
    plotName,
    reading.plantingId,
    reading.measurement,
    reading.value,
    reading.unit,
    reading.measuredOn,
    reading.source ?? 'hand',
    reading.deviceName ?? null,
    reading.note?.trim() ? reading.note.trim() : null,
    new Date().toISOString(),
  );
  return id;
}

export async function deleteGardenReading(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM garden_readings WHERE id = ?', id);
}

// ---------------------------------------------------------------------------
// Reading back
// ---------------------------------------------------------------------------

export async function listGardenReadings(options: { plotId?: string | null; measurement?: string; limit?: number } = {}): Promise<GardenReading[]> {
  const db = await getDatabase();
  const where: string[] = [];
  const args: (string | null)[] = [];
  if (options.plotId !== undefined) {
    where.push('plot_id IS ?');
    args.push(options.plotId);
  }
  if (options.measurement) {
    where.push('measurement = ?');
    args.push(options.measurement);
  }
  const clause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const limit = options.limit ? `LIMIT ${Math.floor(options.limit)}` : '';
  return db.getAllAsync<GardenReading>(
    `SELECT ${READING_COLUMNS} FROM garden_readings ${clause} ORDER BY measured_on DESC, created_at DESC ${limit}`,
    ...args,
  );
}

/** Every unit already recorded against a measurement, so the unit picker
 *  offers what the person actually uses without a term list of its own. */
export async function listRecordedUnits(measurement: string): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ unit: string }>(
    'SELECT DISTINCT unit FROM garden_readings WHERE measurement = ? ORDER BY unit ASC',
    measurement,
  );
  return rows.map((row) => row.unit);
}

/** The unit the person is using for a measurement now: the one on the newest
 *  reading, which is what the charted figures read in. */
export async function getCurrentUnit(measurement: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ unit: string }>(
    'SELECT unit FROM garden_readings WHERE measurement = ? ORDER BY measured_on DESC, created_at DESC LIMIT 1',
    measurement,
  );
  return row?.unit ?? null;
}

export async function getEarliestReadingDate(): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ earliest: string | null }>('SELECT MIN(measured_on) AS earliest FROM garden_readings');
  return row?.earliest ?? null;
}

// ---------------------------------------------------------------------------
// What the Garden lens needs
// ---------------------------------------------------------------------------

export type ConditionsSetup = {
  areas: GardenPlot[];
  plantings: GardenPlanting[];
  terms: CustomGardenTerm[];
};

export async function getConditionsSetup(): Promise<ConditionsSetup> {
  const [areas, plantings, terms] = await Promise.all([
    listGardenPlots(),
    listGardenPlantings(),
    listGardenTerms(),
  ]);
  return { areas, plantings, terms };
}

// ---------------------------------------------------------------------------
// What the Trends lens needs
// ---------------------------------------------------------------------------

export type GrowingConditionsSummary = {
  /** Null when nothing at all has been measured. */
  band: MeasurementBand | null;
  /** Every measurement with anything against it, which is what the picker
   *  above the chart offers. */
  measurements: { code: string; label: string }[];
  things: MeasuredThing[];
  coverage: { measured: AreaCoverage[]; unmeasured: string[]; note: string };
  /** True when nothing has ever been recorded, so the lens says what the
   *  record is for rather than drawing an empty chart. */
  empty: boolean;
};

export async function getGrowingConditionsSummary(
  startDate: string,
  endDate: string,
  picked: string | null,
): Promise<GrowingConditionsSummary> {
  const db = await getDatabase();
  const today = todayDateString();
  const terms = await listGardenTerms(true);
  const labelFor = (code: string) => termLabel('measurement_kind', code, terms) ?? code;

  // Every measurement with anything recorded against it, with the figures
  // the "what you are measuring" band reads.
  const tallies = await db.getAllAsync<{
    measurement: string;
    readings: number;
    lastOn: string;
    deviceReadings: number;
  }>(
    `SELECT measurement,
            COUNT(*) AS readings,
            MAX(measured_on) AS lastOn,
            SUM(CASE WHEN source = 'device' THEN 1 ELSE 0 END) AS deviceReadings
       FROM garden_readings
      GROUP BY measurement`,
  );

  if (tallies.length === 0) {
    return { band: null, measurements: [], things: [], coverage: { measured: [], unmeasured: [], note: 'Nothing is measured anywhere yet.' }, empty: true };
  }

  const latest = await Promise.all(
    tallies.map(async (tally) => {
      const row = await db.getFirstAsync<{ value: number; unit: string }>(
        'SELECT value, unit FROM garden_readings WHERE measurement = ? ORDER BY measured_on DESC, created_at DESC LIMIT 1',
        tally.measurement,
      );
      return {
        measurement: tally.measurement,
        label: labelFor(tally.measurement),
        readings: tally.readings,
        lastOn: tally.lastOn,
        latestValue: row?.value ?? 0,
        latestUnit: row?.unit ?? '',
        deviceReadings: tally.deviceReadings,
      };
    }),
  );

  const things = describeMeasuredThings(latest, today);
  const measurements = things.map((thing) => ({ code: thing.measurement, label: thing.label }));
  const chosen = picked && measurements.some((entry) => entry.code === picked) ? picked : measurements[0].code;

  const readings = await db.getAllAsync<GardenReading>(
    `SELECT ${READING_COLUMNS} FROM garden_readings
      WHERE measurement = ? AND measured_on >= ? AND measured_on <= ?
      ORDER BY measured_on ASC`,
    chosen,
    startDate,
    endDate,
  );

  const band = buildMeasurementBand({
    measurement: chosen,
    label: labelFor(chosen),
    readings,
    months: buildMonths(startDate, endDate),
    preferredUnit: await getCurrentUnit(chosen),
  });

  const areas = await listGardenPlots(true);
  const forCoverage = await db.getAllAsync<{ plotId: string | null; plotName: string | null; measurement: string; measuredOn: string }>(
    'SELECT plot_id AS plotId, plot_name AS plotName, measurement, measured_on AS measuredOn FROM garden_readings',
  );
  const coverage = describeAreaCoverage({
    areas: areas.map((area) => ({ id: area.id, name: area.name })),
    readings: forCoverage,
    today,
  });

  return { band, measurements, things, coverage, empty: false };
}
