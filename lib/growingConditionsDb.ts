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

import { areaPath } from './gardenAreaNesting';
import { getDatabase, listGardenPlantings, listGardenPlots } from './db';
import type { GardenPlanting, GardenPlot } from './db';
import {
  buildDeviceDetail,
  buildMeasurementBand,
  buildMonths,
  buildVpdBand,
  describeAreaCoverage,
  describeMeasuredThings,
  pairVpdReadings,
  VPD_CODE,
  VPD_LABEL,
  type AreaCoverage,
  type DeviceDetail,
  type GardenReading,
  type MeasurementBand,
  type MeasuredThing,
  type ReadingHourRow,
  type ReadingSource,
} from './growingConditions';
import { termLabel, type CustomGardenTerm } from './growSetup';
import {
  combineGroups,
  deviceKeyOf,
  figureNote,
  hourReadingId,
  importedReadingId,
  type Sample,
  type SampleGroup,
} from './readingImport';
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

/** Brings in every row of a controller's history file (I19,
 *  lib/readingImport.ts). Each figure goes into garden_device_samples with
 *  its moment, where a figure already brought in for the same area,
 *  planting, device, measurement and moment is skipped rather than added
 *  twice. The hours and days those moments fall in are then worked out
 *  again from everything held for that device, so two files that overlap
 *  combine rather than one replacing the other: hours into
 *  garden_reading_hours, and one reading a day into garden_readings under a
 *  fixed id. Returns how many figures were new, how many were here already,
 *  and how many days and hours were written. */
export async function importDeviceReadings(
  samples: Sample[],
  where: { plotId: string | null; plantingId: string | null; deviceName: string; fileName: string },
): Promise<{ added: number; alreadyHere: number; days: number; hours: number }> {
  if (samples.length === 0) return { added: 0, alreadyHere: 0, days: 0, hours: 0 };
  const db = await getDatabase();
  const deviceName = where.deviceName.trim() || where.fileName;
  const target = { plotId: where.plotId, plantingId: where.plantingId, deviceName };
  const span = daySpanOf(samples);
  let added = 0;
  let worked = { days: 0, hours: 0 };
  await db.withTransactionAsync(async () => {
    added = await insertSamples(db, samples, target);
    worked = await reworkFigures(db, target, span.firstDay, span.lastDay);
  });
  return { added, alreadyHere: samples.length - added, days: worked.days, hours: worked.hours };
}

export type DeviceTarget = { plotId: string | null; plantingId: string | null; deviceName: string };

function daySpanOf(samples: Sample[]): { firstDay: string; lastDay: string } {
  let firstDay = samples[0].at.slice(0, 10);
  let lastDay = firstDay;
  for (const sample of samples) {
    const day = sample.at.slice(0, 10);
    if (day < firstDay) firstDay = day;
    if (day > lastDay) lastDay = day;
  }
  return { firstDay, lastDay };
}

type Db = Awaited<ReturnType<typeof getDatabase>>;

const CHUNK = 100;

/** Adds figures to garden_device_samples, skipping any moment already
 *  held for the same area, planting, device and measurement. Returns how
 *  many were new. The table stays on this device, so these writes are not
 *  something sync saves for (lib/databaseActivity.ts). */
async function insertSamples(db: Db, samples: Sample[], target: DeviceTarget): Promise<number> {
  const deviceKey = deviceKeyOf(target.deviceName);
  const plotKey = target.plotId ?? '';
  const plantingKey = target.plantingId ?? '';
  let added = 0;
  for (let start = 0; start < samples.length; start += CHUNK) {
    const chunk = samples.slice(start, start + CHUNK);
    const params: (string | number)[] = [];
    for (const sample of chunk) {
      params.push(plotKey, plantingKey, deviceKey, sample.measurement, sample.at, sample.unit, sample.value);
    }
    const result = await db.runAsync(
      `INSERT OR IGNORE INTO garden_device_samples (plot_id, planting_id, device_key, measurement, measured_at, unit, value)
       VALUES ${chunk.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ')}`,
      ...params,
    );
    added += result.changes;
  }
  return added;
}

/** Adds a sensor's latest figures (I20, an Ecowitt gateway) without working
 *  out the hours and days, which lib/ecowittDb.ts does once an hour rather
 *  than on every reading. */
export async function storeDeviceSamples(samples: Sample[], target: DeviceTarget): Promise<number> {
  if (samples.length === 0) return 0;
  const db = await getDatabase();
  let added = 0;
  await db.withTransactionAsync(async () => {
    added = await insertSamples(db, samples, target);
  });
  return added;
}

/** Works out the hours and the one reading a day for a device from every
 *  sample held for it between two days. */
export async function reworkDeviceFigures(target: DeviceTarget, firstDay: string, lastDay: string): Promise<{ days: number; hours: number }> {
  const db = await getDatabase();
  let worked = { days: 0, hours: 0 };
  await db.withTransactionAsync(async () => {
    worked = await reworkFigures(db, target, firstDay, lastDay);
  });
  return worked;
}

async function reworkFigures(db: Db, target: DeviceTarget, firstDay: string, lastDay: string): Promise<{ days: number; hours: number }> {
  let plotName: string | null = null;
  if (target.plotId) {
    const row = await db.getFirstAsync<{ name: string }>('SELECT name FROM garden_plots WHERE id = ?', target.plotId);
    plotName = row?.name ?? null;
  }
  const deviceName = target.deviceName;
  const deviceKey = deviceKeyOf(deviceName);
  const plotKey = target.plotId ?? '';
  const plantingKey = target.plantingId ?? '';
  const now = new Date().toISOString();

  // Every group in the span, worked out from all that is held.
  const groups = await db.getAllAsync<SampleGroup>(
    `SELECT measurement, unit, substr(measured_at, 1, 13) AS period,
            SUM(value) AS sum, COUNT(*) AS count, MIN(value) AS lowest, MAX(value) AS highest
       FROM garden_device_samples
      WHERE plot_id = ? AND planting_id = ? AND device_key = ?
        AND measured_at >= ? AND measured_at <= ?
      GROUP BY measurement, unit, period`,
    plotKey,
    plantingKey,
    deviceKey,
    firstDay,
    `${lastDay} 99`,
  );
  // A moment with no time is 'YYYY-MM-DD', so its period is ten
  // characters and it counts toward the day and no hour.
  const hourFigures = combineGroups(groups.filter((group) => group.period.length === 13));
  const dayGroups = new Map<string, SampleGroup>();
  for (const group of groups) {
    const key = `${group.measurement}|${group.unit}|${group.period.slice(0, 10)}`;
    const held = dayGroups.get(key);
    if (held) {
      held.sum += group.sum;
      held.count += group.count;
      held.lowest = Math.min(held.lowest, group.lowest);
      held.highest = Math.max(held.highest, group.highest);
    } else {
      dayGroups.set(key, { ...group, period: group.period.slice(0, 10) });
    }
  }
  const dayFigures = combineGroups([...dayGroups.values()]);

  for (let start = 0; start < hourFigures.length; start += CHUNK) {
    const chunk = hourFigures.slice(start, start + CHUNK);
    const params: (string | number | null)[] = [];
    for (const figure of chunk) {
      params.push(
        hourReadingId({ plotId: target.plotId, plantingId: target.plantingId, measurement: figure.measurement, hour: figure.period, deviceName }),
        target.plotId,
        plotName,
        target.plantingId,
        deviceName,
        figure.measurement,
        figure.unit,
        figure.period,
        Math.round(figure.average * 100) / 100,
        figure.lowest,
        figure.highest,
        figure.count,
        now,
      );
    }
    await db.runAsync(
      `INSERT OR REPLACE INTO garden_reading_hours
         (id, plot_id, plot_name, planting_id, device_name, measurement, unit, hour, average, lowest, highest, count, updated_at)
       VALUES ${chunk.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ')}`,
      ...params,
    );
  }

  for (const figure of dayFigures) {
    await db.runAsync(
      `INSERT OR REPLACE INTO garden_readings
         (id, plot_id, plot_name, planting_id, measurement, value, unit, measured_on, source, device_name, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'device', ?, ?, ?)`,
      importedReadingId({ plotId: target.plotId, plantingId: target.plantingId, measurement: figure.measurement, day: figure.period, deviceName }),
      target.plotId,
      plotName,
      target.plantingId,
      figure.measurement,
      Math.round(figure.average * 100) / 100,
      figure.unit,
      figure.period,
      deviceName,
      figureNote(figure, deviceName),
      now,
    );
  }
  return { days: dayFigures.length, hours: hourFigures.length };
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
  /** Hour by hour and day by day for the chosen measurement, from files
   *  brought in from a controller (I19). Null when none holds it. */
  device: DeviceDetail | null;
  /** True when nothing has ever been recorded, so the lens says what the
   *  record is for rather than drawing an empty chart. */
  empty: boolean;
};

export async function getGrowingConditionsSummary(
  startDate: string,
  endDate: string,
  picked: string | null,
  pickedSource: string | null = null,
  pickedDay: string | null = null,
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
    return {
      band: null,
      measurements: [],
      things: [],
      coverage: { measured: [], unmeasured: [], note: 'Nothing is measured anywhere yet.' },
      device: null,
      empty: true,
    };
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
  // Air VPD (I18) is worked out rather than measured, so it is offered once
  // both of its readings have ever been recorded, last in the row so it is
  // never the one shown first.
  const measuredCodes = new Set(tallies.map((tally) => tally.measurement));
  if (measuredCodes.has('air_temperature') && measuredCodes.has('humidity')) {
    measurements.push({ code: VPD_CODE, label: VPD_LABEL });
  }
  const chosen = picked && measurements.some((entry) => entry.code === picked) ? picked : measurements[0].code;

  let band: MeasurementBand | null;
  if (chosen === VPD_CODE) {
    const pairable = await db.getAllAsync<GardenReading>(
      `SELECT ${READING_COLUMNS} FROM garden_readings
        WHERE measurement IN ('air_temperature', 'humidity') AND measured_on >= ? AND measured_on <= ?
        ORDER BY measured_on ASC`,
      startDate,
      endDate,
    );
    band = buildVpdBand({ pairing: pairVpdReadings(pairable), months: buildMonths(startDate, endDate) });
  } else {
    const readings = await db.getAllAsync<GardenReading>(
      `SELECT ${READING_COLUMNS} FROM garden_readings
        WHERE measurement = ? AND measured_on >= ? AND measured_on <= ?
        ORDER BY measured_on ASC`,
      chosen,
      startDate,
      endDate,
    );
    band = buildMeasurementBand({
      measurement: chosen,
      label: labelFor(chosen),
      readings,
      months: buildMonths(startDate, endDate),
      preferredUnit: await getCurrentUnit(chosen),
    });
  }

  const areas = await listGardenPlots(true);

  let device: DeviceDetail | null = null;
  if (chosen !== VPD_CODE) {
    const hourRows = await db.getAllAsync<ReadingHourRow>(
      `SELECT plot_id AS plotId, plot_name AS plotName, planting_id AS plantingId, device_name AS deviceName,
              unit, hour, average, lowest, highest, count
         FROM garden_reading_hours
        WHERE measurement = ? AND hour >= ? AND hour <= ?`,
      chosen,
      startDate,
      `${endDate} 99`,
    );
    if (hourRows.length > 0) {
      const plantings = await listGardenPlantings();
      device = buildDeviceDetail({
        rows: hourRows,
        labelOfSource: (row) => {
          const area = row.plotId && areas.some((entry) => entry.id === row.plotId) ? areaPath(row.plotId, areas) : row.plotName ?? 'No area';
          const planting = row.plantingId ? plantings.find((entry) => entry.id === row.plantingId) : undefined;
          return [area, planting?.foodName, row.deviceName].filter(Boolean).join(' › ');
        },
        pickedSource,
        pickedDay,
      });
    }
  }

  const forCoverage = await db.getAllAsync<{ plotId: string | null; plotName: string | null; measurement: string; measuredOn: string }>(
    'SELECT plot_id AS plotId, plot_name AS plotName, measurement, measured_on AS measuredOn FROM garden_readings',
  );
  const coverage = describeAreaCoverage({
    areas: areas.map((area) => ({ id: area.id, name: areaPath(area.id, areas) })),
    readings: forCoverage,
    today,
  });

  return { band, measurements, things, coverage, device, empty: false };
}

// This lamp's lux-to-PPFD ratio (1.0.55.21), remembered per area and kind of
// light under one app_meta row so the same panel over the same bed is not
// typed twice. It describes a lamp rather than this device, so it travels
// with the rest of the record.
const LAMP_RATIOS_KEY = 'garden_lamp_ratios';

export async function getLampRatios(): Promise<Record<string, number>> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_meta WHERE key = ?', LAMP_RATIOS_KEY);
  if (!row?.value) return {};
  try {
    const parsed = JSON.parse(row.value) as Record<string, unknown>;
    const out: Record<string, number> = {};
    for (const [key, value] of Object.entries(parsed)) if (typeof value === 'number') out[key] = value;
    return out;
  } catch {
    return {};
  }
}

/** Remembers a lamp's ratio, or forgets it when ratio is null. */
export async function saveLampRatio(key: string, ratio: number | null): Promise<void> {
  const ratios = await getLampRatios();
  if (ratio === null) delete ratios[key];
  else ratios[key] = ratio;
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO app_meta (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    LAMP_RATIOS_KEY,
    JSON.stringify(ratios),
    new Date().toISOString(),
  );
}
