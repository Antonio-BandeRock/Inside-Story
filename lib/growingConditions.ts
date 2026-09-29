// Growing conditions as a record (2026-09-23, stage 0 of the sensor work).
//
// The reading is separated from the radio. A soil moisture figure is worth
// the same whether it arrived over Wi-Fi from a sensor somebody soldered or
// was read off a twelve-dollar meter pushed into the bed, and until this
// module there was nowhere in the app to put one at all: eleven garden
// tables held what was planted, spent, picked and eaten, and not one held a
// measurement of the conditions any of it grew in. Every later way of
// filling this record, discovered sensors on the local network, a camera, a
// commercial account, is an optional way of writing the same rows.
//
// Everything here is pure, so scripts/test_growing_conditions.js checks the
// arithmetic and every sentence without a phone.
//
// Four of the rules the cross-app push settled bind this file:
//   - A month with nothing measured is a GAP, never a zero. Every periodic
//     figure is `number | null` and a blank month says so in words.
//   - Units are never converted across kinds. Celsius and Fahrenheit are one
//     family and convert; a percentage and a centibar are two different
//     physical quantities and stay on separate lines, as do lux and PPFD.
//   - A figure is never guessed at. Nothing here interpolates a missing day
//     or carries a reading forward.
//   - Plain date columns need no local-day handling. `measured_on` is a
//     plain date, so nothing here goes through a Date for a day.

import { buildMonths, monthsBack, type PeriodRow, type YieldMonth } from './harvestYield';
import { LIGHT_METER_DEVICE_NAME } from './lightMeter';

export { buildMonths, monthsBack };
export type { PeriodRow, YieldMonth };

// ---------------------------------------------------------------------------
// Readings
// ---------------------------------------------------------------------------

/** How a reading arrived. 'hand' is somebody reading a meter and typing the
 *  figure in. 'device' is stage 1: a sensor on the local network. The second
 *  is not built, and the column exists now so it needs no migration and so a
 *  blank month can tell "nothing came in" from "nothing measured". */
export type ReadingSource = 'hand' | 'device';

export type GardenReading = {
  id: string;
  plotId: string | null;
  plotName: string | null;
  plantingId: string | null;
  measurement: string;
  value: number;
  unit: string;
  measuredOn: string;
  source: ReadingSource;
  deviceName: string | null;
  note: string | null;
  createdAt: string;
};

// ---------------------------------------------------------------------------
// Units
// ---------------------------------------------------------------------------

/** A group of units that mean the same physical quantity, so a figure in one
 *  can be shown in another. Anything outside a family stays on a line of its
 *  own: converting across kinds is how a chart starts lying. */
type UnitFamily = { units: string[]; toBase: Record<string, (value: number) => number>; fromBase: Record<string, (value: number) => number> };

const UNIT_FAMILIES: UnitFamily[] = [
  {
    units: ['°C', '°F'],
    toBase: { '°C': (v) => v, '°F': (v) => ((v - 32) * 5) / 9 },
    fromBase: { '°C': (v) => v, '°F': (v) => (v * 9) / 5 + 32 },
  },
  {
    units: ['mm', 'in'],
    toBase: { mm: (v) => v, in: (v) => v * 25.4 },
    fromBase: { mm: (v) => v, in: (v) => v / 25.4 },
  },
  {
    units: ['L', 'gal'],
    toBase: { L: (v) => v, gal: (v) => v * 3.785411784 },
    fromBase: { L: (v) => v, gal: (v) => v / 3.785411784 },
  },
  {
    units: ['mS/cm', 'µS/cm'],
    toBase: { 'mS/cm': (v) => v, 'µS/cm': (v) => v / 1000 },
    fromBase: { 'mS/cm': (v) => v, 'µS/cm': (v) => v * 1000 },
  },
];

function familyOf(unit: string): UnitFamily | null {
  return UNIT_FAMILIES.find((family) => family.units.includes(unit)) ?? null;
}

/** Whether two units can be added together and shown as one figure. A unit
 *  is always compatible with itself; two units are otherwise compatible only
 *  inside one family. */
export function unitsCompatible(a: string, b: string): boolean {
  if (a === b) return true;
  const family = familyOf(a);
  return !!family && family.units.includes(b);
}

/** A figure moved from one unit to another inside a family, or null where
 *  the two are different quantities. */
export function convertUnit(value: number, from: string, to: string): number | null {
  if (from === to) return value;
  const family = familyOf(from);
  if (!family || !family.units.includes(to)) return null;
  return family.fromBase[to](family.toBase[from](value));
}

/** The units offered for a measurement: the built-in ones for that kind,
 *  then any unit already recorded against it, then nothing else. A unit
 *  somebody typed needs no list of its own, since a unit is stored as text
 *  on the reading and is only ever read back beside the figure it belongs
 *  to, so there is nothing to orphan. */
export const BUILT_IN_UNITS: Record<string, string[]> = {
  soil_moisture: ['%', 'cb'],
  soil_temperature: ['°C', '°F'],
  air_temperature: ['°C', '°F'],
  humidity: ['%'],
  soil_ph: ['pH'],
  light: ['lux', 'PPFD'],
  soil_ec: ['mS/cm', 'µS/cm'],
  rainfall: ['mm', 'in'],
  water_given: ['L', 'gal'],
  co2: ['ppm'],
  vpd: ['kPa'],
};

export function unitChoices(measurement: string, recorded: string[] = []): string[] {
  const out = [...(BUILT_IN_UNITS[measurement] ?? [])];
  for (const unit of recorded) {
    const trimmed = unit.trim();
    if (trimmed && !out.includes(trimmed)) out.push(trimmed);
  }
  return out;
}

// ---------------------------------------------------------------------------
// How a month is worked out
// ---------------------------------------------------------------------------

/** Whether a month's figure is what fell or was put on (a total), or what
 *  the conditions were like (an average). Rain and watering accumulate;
 *  everything else is a level at a moment, and adding up twelve temperature
 *  readings would produce a number that means nothing. Anything the person
 *  named is a level, since a level is what a meter reads. */
export function aggregateFor(measurement: string): 'total' | 'average' {
  return measurement === 'rainfall' || measurement === 'water_given' ? 'total' : 'average';
}

function roundTo(value: number, places: number): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

/** How many decimal places a unit reads naturally in. pH and EC are read to
 *  a tenth or better; a lux figure never is. */
export function placesFor(unit: string): number {
  if (unit === 'pH' || unit === 'mS/cm' || unit === 'kPa') return 2;
  if (unit === 'lux' || unit === 'PPFD' || unit === 'ppm' || unit === 'µS/cm' || unit === 'cb') return 0;
  return 1;
}

/** places is how far a unit is rounded, not how far it is padded: a pH of
 *  6.4 was read to a tenth and writing it as 6.40 claims a second place
 *  nobody measured. */
export function formatFigure(value: number, unit: string): string {
  const text = String(roundTo(value, placesFor(unit)));
  return unit === '°C' || unit === '°F' ? `${text}${unit}` : `${text} ${unit}`;
}

// ---------------------------------------------------------------------------
// One measurement over months
// ---------------------------------------------------------------------------

export type MeasurementMonth = {
  key: string;
  label: string;
  /** Null where nothing was measured that month. */
  figure: number | null;
  lowest: number | null;
  highest: number | null;
  readings: number;
  display: string;
};

export type MeasurementBand = {
  measurement: string;
  label: string;
  unit: string;
  aggregate: 'total' | 'average';
  headline: string;
  rows: PeriodRow[];
  months: MeasurementMonth[];
  /** Lines under the chart, each already a finished sentence. */
  notes: string[];
};

export type MeasurementBandInput = {
  measurement: string;
  label: string;
  readings: GardenReading[];
  months: YieldMonth[];
  /** Units recorded against this measurement outside the charted range, so
   *  the figures read in the unit the person uses now rather than the unit
   *  of the oldest reading in view. */
  preferredUnit?: string | null;
  /** What a blank month lacked, where "nothing was measured" would not be
   *  so: a worked-out figure is blank when its two readings never met. */
  blankReason?: string;
};

/** The unit a band reads in: the one given, or the unit of the newest
 *  reading, whichever is there. */
function chooseUnit(readings: GardenReading[], preferred: string | null | undefined): string | null {
  if (preferred) return preferred;
  let newest: GardenReading | null = null;
  for (const reading of readings) {
    if (!newest || reading.measuredOn > newest.measuredOn) newest = reading;
  }
  return newest ? newest.unit : null;
}

/** One measurement drawn month by month. Readings in a unit that cannot be
 *  moved into the band's unit are left out of the figures and counted in a
 *  note, never silently folded in. */
export function buildMeasurementBand(input: MeasurementBandInput): MeasurementBand | null {
  const unit = chooseUnit(input.readings, input.preferredUnit);
  if (!unit) return null;
  const aggregate = aggregateFor(input.measurement);

  let setAside = 0;
  const setAsideUnits: string[] = [];
  const usable: { measuredOn: string; value: number; source: ReadingSource }[] = [];
  for (const reading of input.readings) {
    const moved = convertUnit(reading.value, reading.unit, unit);
    if (moved === null) {
      setAside += 1;
      if (!setAsideUnits.includes(reading.unit)) setAsideUnits.push(reading.unit);
      continue;
    }
    usable.push({ measuredOn: reading.measuredOn, value: moved, source: reading.source });
  }

  const months: MeasurementMonth[] = input.months.map((month) => {
    const inside = usable.filter((reading) => reading.measuredOn >= month.monthStart && reading.measuredOn <= month.monthEnd);
    if (inside.length === 0) {
      return { key: month.monthStart, label: month.label, figure: null, lowest: null, highest: null, readings: 0, display: '' };
    }
    const values = inside.map((reading) => reading.value);
    const total = values.reduce((sum, value) => sum + value, 0);
    const figure = aggregate === 'total' ? total : total / values.length;
    const lowest = Math.min(...values);
    const highest = Math.max(...values);
    return {
      key: month.monthStart,
      label: month.label,
      figure,
      lowest,
      highest,
      readings: inside.length,
      display: formatFigure(figure, unit),
    };
  });

  const measured = months.filter((month) => month.figure !== null);
  const blank = months.length - measured.length;
  // A phone's light meter is pressed by a person (I3), so a blank month of
  // those is nothing measured, the same as a meter read by hand.
  const anyFromDevice = input.readings.some(
    (reading) => reading.source === 'device' && reading.deviceName !== LIGHT_METER_DEVICE_NAME,
  );

  const notes: string[] = [];
  if (blank > 0) {
    const what = input.blankReason ?? (anyFromDevice ? 'nothing came in' : 'nothing was measured');
    notes.push(blank === 1 ? `One month is blank, because ${what} that month.` : `${blank} months are blank, because ${what} those months.`);
  }
  if (aggregate === 'average' && measured.length > 0) {
    const lowest = Math.min(...measured.map((month) => month.lowest as number));
    const highest = Math.max(...measured.map((month) => month.highest as number));
    notes.push(
      lowest === highest
        ? `Every reading came in at ${formatFigure(lowest, unit)}.`
        : `Each month is the average of what was read that month, and the readings ran from ${formatFigure(lowest, unit)} to ${formatFigure(highest, unit)}.`,
    );
  }
  if (setAside > 0) {
    notes.push(
      `${setAside === 1 ? '1 reading is' : `${setAside} readings are`} left out, recorded in ${setAsideUnits.join(' and ')}, which ${setAsideUnits.length === 1 ? 'is a different quantity from' : 'are different quantities from'} ${unit} rather than another way of writing it.`,
    );
  }

  return {
    measurement: input.measurement,
    label: input.label,
    unit,
    aggregate,
    headline: buildHeadline(input.label, unit, aggregate, measured, usable.length),
    rows: months.map((month) => ({ key: month.key, label: month.label, value: month.figure, display: month.display })),
    months,
    notes,
  };
}

function buildHeadline(
  label: string,
  unit: string,
  aggregate: 'total' | 'average',
  measured: MeasurementMonth[],
  readings: number,
): string {
  if (measured.length === 0) return `No ${label.toLowerCase()} recorded in this stretch.`;
  const count = readings === 1 ? '1 reading' : `${readings} readings`;
  const spread = measured.length === 1 ? 'in one month' : `across ${measured.length} months`;
  if (aggregate === 'total') {
    const total = measured.reduce((sum, month) => sum + (month.figure ?? 0), 0);
    return `${formatFigure(total, unit)} in all, from ${count} ${spread}.`;
  }
  const mean = measured.reduce((sum, month) => sum + (month.figure ?? 0), 0) / measured.length;
  return `${formatFigure(mean, unit)} on average, from ${count} ${spread}.`;
}

// ---------------------------------------------------------------------------
// What is being measured at all
// ---------------------------------------------------------------------------

export type MeasuredThing = {
  measurement: string;
  label: string;
  readings: number;
  lastOn: string;
  latest: string;
  bySensor: boolean;
  line: string;
  caption: string;
};

export type MeasuredThingInput = {
  measurement: string;
  label: string;
  readings: number;
  lastOn: string;
  latestValue: number;
  latestUnit: string;
  deviceReadings: number;
};

/** Every measurement with anything recorded against it, newest first, each
 *  saying how many readings it holds and what the last one was. */
export function describeMeasuredThings(input: MeasuredThingInput[], today: string): MeasuredThing[] {
  return [...input]
    .sort((a, b) => (a.lastOn === b.lastOn ? a.label.localeCompare(b.label) : b.lastOn.localeCompare(a.lastOn)))
    .map((thing) => {
      const bySensor = thing.deviceReadings > 0;
      const age = describeWhen(thing.lastOn, today);
      const parts = [thing.readings === 1 ? '1 reading' : `${thing.readings} readings`, `last ${age}`];
      if (bySensor) {
        parts.push(
          thing.deviceReadings === thing.readings
            ? 'all from a device'
            : `${thing.deviceReadings} from a device`,
        );
      }
      return {
        measurement: thing.measurement,
        label: thing.label,
        readings: thing.readings,
        lastOn: thing.lastOn,
        latest: formatFigure(thing.latestValue, thing.latestUnit),
        bySensor,
        line: `${thing.label}: ${formatFigure(thing.latestValue, thing.latestUnit)}`,
        caption: `${parts.join(', ')}.`,
      };
    });
}

/** How long ago a plain date was, in the words the rest of the app uses for
 *  a recorded day. */
export function describeWhen(date: string, today: string): string {
  const days = wholeDaysBetween(date, today);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return 'about a week ago';
  if (days < 31) return `${Math.round(days / 7)} weeks ago`;
  if (days < 365) {
    const months = Math.round(days / 30);
    return months === 1 ? 'about a month ago' : `about ${months} months ago`;
  }
  const years = Math.round(days / 365);
  return years === 1 ? 'about a year ago' : `about ${years} years ago`;
}

function wholeDaysBetween(from: string, to: string): number {
  const a = Date.UTC(Number(from.slice(0, 4)), Number(from.slice(5, 7)) - 1, Number(from.slice(8, 10)));
  const b = Date.UTC(Number(to.slice(0, 4)), Number(to.slice(5, 7)) - 1, Number(to.slice(8, 10)));
  return Math.round((b - a) / 86400000);
}

// ---------------------------------------------------------------------------
// Which areas are measured
// ---------------------------------------------------------------------------

export type AreaCoverage = {
  plotId: string | null;
  name: string;
  readings: number;
  measurements: number;
  lastOn: string | null;
  line: string;
  caption: string;
};

export type AreaCoverageInput = {
  areas: { id: string; name: string }[];
  readings: { plotId: string | null; plotName: string | null; measurement: string; measuredOn: string }[];
  today: string;
};

/** Which areas have readings and which have none, plus anything recorded
 *  against no area at all, which happens when an area was deleted after the
 *  reading was taken or when a reading was never tied to one. */
export function describeAreaCoverage(input: AreaCoverageInput): { measured: AreaCoverage[]; unmeasured: string[]; note: string } {
  const measured: AreaCoverage[] = [];
  const unmeasured: string[] = [];

  for (const area of input.areas) {
    const mine = input.readings.filter((reading) => reading.plotId === area.id);
    if (mine.length === 0) {
      unmeasured.push(area.name);
      continue;
    }
    measured.push(coverageRow(area.id, area.name, mine, input.today));
  }

  const loose = input.readings.filter((reading) => !reading.plotId || !input.areas.some((area) => area.id === reading.plotId));
  if (loose.length > 0) {
    const named = loose.find((reading) => reading.plotName)?.plotName ?? null;
    measured.push(coverageRow(null, named ? `${named} (no longer a garden area)` : 'Not tied to an area', loose, input.today));
  }

  measured.sort((a, b) => b.readings - a.readings || a.name.localeCompare(b.name));
  unmeasured.sort((a, b) => a.localeCompare(b));

  let note: string;
  if (measured.length === 0) {
    note = 'Nothing is measured anywhere yet.';
  } else if (unmeasured.length === 0) {
    note = 'Every area has readings against it.';
  } else {
    note = unmeasured.length === 1
      ? `${unmeasured[0]} has nothing recorded against it.`
      : `${unmeasured.length} areas have nothing recorded against them.`;
  }

  return { measured, unmeasured, note };
}

function coverageRow(
  plotId: string | null,
  name: string,
  readings: { measurement: string; measuredOn: string }[],
  today: string,
): AreaCoverage {
  const kinds = new Set(readings.map((reading) => reading.measurement));
  const lastOn = readings.reduce<string | null>((latest, reading) => (!latest || reading.measuredOn > latest ? reading.measuredOn : latest), null);
  const counted = readings.length === 1 ? '1 reading' : `${readings.length} readings`;
  const kindWord = kinds.size === 1 ? '1 measurement' : `${kinds.size} measurements`;
  return {
    plotId,
    name,
    readings: readings.length,
    measurements: kinds.size,
    lastOn,
    line: name,
    caption: `${counted} of ${kindWord}, last ${lastOn ? describeWhen(lastOn, today) : 'never'}.`,
  };
}

// ---------------------------------------------------------------------------
// Saving a reading
// ---------------------------------------------------------------------------

export type ReadingDraft = {
  plotId: string | null;
  plantingId: string | null;
  measurement: string | null;
  value: string;
  unit: string | null;
  measuredOn: string;
  note: string;
};

export type ReadingCheck = { ok: true } | { ok: false; problem: string };

/** What a reading needs before it can be saved. A figure is never guessed
 *  at, so a blank or unreadable one is refused rather than stored as zero. */
export function checkReading(draft: ReadingDraft): ReadingCheck {
  if (!draft.measurement) return { ok: false, problem: 'Pick what you measured.' };
  const trimmed = draft.value.trim();
  if (!trimmed) return { ok: false, problem: 'Put in the figure you read.' };
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return { ok: false, problem: `"${trimmed}" is not a figure this can read.` };
  if (!draft.unit) return { ok: false, problem: 'Pick the unit it was read in.' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.measuredOn)) return { ok: false, problem: 'Put in the date as YYYY-MM-DD.' };
  return { ok: true };
}

/** What a saved reading reads back as on its own row. */
export function describeReading(reading: GardenReading, today: string): string {
  const parts = [formatFigure(reading.value, reading.unit), describeWhen(reading.measuredOn, today)];
  if (reading.source === 'device') parts.push(reading.deviceName ? `from ${reading.deviceName}` : 'from a device');
  return parts.join(', ');
}

// ---------------------------------------------------------------------------
// Air VPD, worked out from readings already entered (I18, 2026-09-28)
// ---------------------------------------------------------------------------
//
// Vapour pressure deficit is the figure indoor growers steer by: how much
// more water the air could hold at its temperature than it holds now. It is
// never typed in and never stored. It is worked out from an air temperature
// reading and a humidity reading recorded for the same area on the same day,
// so correcting or deleting either reading changes it with no second record
// to keep in step.
//
// A reading carries a day and no time of day, so where an area has several
// of each on one day the two entered nearest together are taken as a pair,
// and each reading is used once. Leaf temperature is not recorded, so this
// is the air's VPD with the leaf taken to be at the air's temperature, and
// every place it is shown says so. No figure is called right or wrong: what a
// crop wants differs with the crop and its stage.

export const VPD_CODE = 'derived_vpd';
export const VPD_LABEL = 'Air VPD';
export const VPD_UNIT = 'kPa';

export const VPD_HOW =
  'Worked out from an air temperature and a humidity reading recorded for the same area on the same day. Air can hold water vapour up to its saturation vapour pressure, 0.6108 × e^(17.27 × T ÷ (T + 237.3)) kPa with T in °C (the Tetens formula), and VPD is that figure times the share it is not holding: 100 minus the humidity, divided by 100.';
export const VPD_LEAF_NOTE =
  'Leaf temperature is not recorded, so the leaf is taken to be at the air temperature. A leaf a degree or two cooler than the air, which is common under lights, gives a lower figure than the one shown.';
export const VPD_PAIRING_NOTE =
  'A reading has a day and no time of day, so where an area has several of each on one day, the two entered nearest together are taken as a pair, and each reading is used once.';

/** The kPa of water vapour air at this temperature can hold (Tetens). */
export function saturationVapourPressure(celsius: number): number {
  return 0.6108 * Math.exp((17.27 * celsius) / (celsius + 237.3));
}

/** The temperatures the Tetens formula is read over here, in °C. A figure
 *  outside them is left out and counted rather than worked through. */
export const VPD_LOWEST_C = -50;
export const VPD_HIGHEST_C = 70;

/** Air VPD in kPa, or null where the two figures cannot be read as an air
 *  temperature in °C and a relative humidity. */
export function airVpd(celsius: number, humidity: number): number | null {
  if (!Number.isFinite(celsius) || !Number.isFinite(humidity)) return null;
  if (humidity < 0 || humidity > 100) return null;
  if (celsius < VPD_LOWEST_C || celsius > VPD_HIGHEST_C) return null;
  return saturationVapourPressure(celsius) * (1 - humidity / 100);
}

export type VpdPair = {
  plotId: string;
  plotName: string | null;
  measuredOn: string;
  celsius: number;
  /** The temperature as it was recorded, in its own unit. */
  temperature: string;
  humidity: number;
  vpd: number;
  temperatureId: string;
  humidityId: string;
  /** Set when both readings came from the same device. */
  deviceName: string | null;
};

export type VpdPairing = {
  /** Newest day first. */
  pairs: VpdPair[];
  unpairedTemperature: number;
  unpairedHumidity: number;
  noArea: number;
  unreadable: number;
  /** Each already a finished sentence. */
  notes: string[];
};

function timeOf(stamp: string): number {
  const time = Date.parse(stamp);
  return Number.isFinite(time) ? time : Number.POSITIVE_INFINITY;
}

function countOf(count: number, one: string, many: string): string {
  return count === 1 ? `1 ${one}` : `${count} ${many}`;
}

/** Every air temperature reading paired with a humidity reading from the
 *  same area on the same day. Soil temperature is a different thing and is
 *  never used. */
export function pairVpdReadings(readings: GardenReading[]): VpdPairing {
  type Temp = { reading: GardenReading; celsius: number };
  const groups = new Map<string, { temps: Temp[]; hums: GardenReading[] }>();
  let noArea = 0;
  let unreadable = 0;
  const groupFor = (reading: GardenReading) => {
    const key = `${reading.plotId}|${reading.measuredOn}`;
    let group = groups.get(key);
    if (!group) {
      group = { temps: [], hums: [] };
      groups.set(key, group);
    }
    return group;
  };

  for (const reading of readings) {
    if (reading.measurement !== 'air_temperature' && reading.measurement !== 'humidity') continue;
    if (!reading.plotId) {
      noArea += 1;
      continue;
    }
    if (reading.measurement === 'air_temperature') {
      const celsius = convertUnit(reading.value, reading.unit, '°C');
      if (celsius === null || airVpd(celsius, 50) === null) {
        unreadable += 1;
        continue;
      }
      groupFor(reading).temps.push({ reading, celsius });
    } else {
      if (reading.unit.trim() !== '%' || airVpd(20, reading.value) === null) {
        unreadable += 1;
        continue;
      }
      groupFor(reading).hums.push(reading);
    }
  }

  const pairs: VpdPair[] = [];
  let unpairedTemperature = 0;
  let unpairedHumidity = 0;
  for (const group of groups.values()) {
    const candidates: { temp: Temp; hum: GardenReading; gap: number }[] = [];
    for (const temp of group.temps) {
      for (const hum of group.hums) {
        candidates.push({ temp, hum, gap: Math.abs(timeOf(temp.reading.createdAt) - timeOf(hum.createdAt)) });
      }
    }
    // Nearest together first. A stamp that cannot be read sorts last, and
    // the ids settle a tie so the same readings always make the same pairs.
    const gapOf = (gap: number) => (Number.isNaN(gap) ? Number.POSITIVE_INFINITY : gap);
    candidates.sort((a, b) => {
      const x = gapOf(a.gap);
      const y = gapOf(b.gap);
      if (x !== y) return x < y ? -1 : 1;
      return a.temp.reading.id.localeCompare(b.temp.reading.id) || a.hum.id.localeCompare(b.hum.id);
    });
    const usedTemps = new Set<string>();
    const usedHums = new Set<string>();
    for (const { temp, hum } of candidates) {
      if (usedTemps.has(temp.reading.id) || usedHums.has(hum.id)) continue;
      usedTemps.add(temp.reading.id);
      usedHums.add(hum.id);
      const sameDevice =
        temp.reading.source === 'device' && hum.source === 'device' && temp.reading.deviceName === hum.deviceName
          ? temp.reading.deviceName
          : null;
      pairs.push({
        plotId: temp.reading.plotId as string,
        plotName: temp.reading.plotName ?? hum.plotName,
        measuredOn: temp.reading.measuredOn,
        celsius: temp.celsius,
        temperature: formatFigure(temp.reading.value, temp.reading.unit),
        humidity: hum.value,
        vpd: airVpd(temp.celsius, hum.value) as number,
        temperatureId: temp.reading.id,
        humidityId: hum.id,
        deviceName: sameDevice,
      });
    }
    unpairedTemperature += group.temps.length - usedTemps.size;
    unpairedHumidity += group.hums.length - usedHums.size;
  }
  pairs.sort((a, b) => b.measuredOn.localeCompare(a.measuredOn) || a.temperatureId.localeCompare(b.temperatureId));

  const notes: string[] = [];
  if (unpairedTemperature > 0 || unpairedHumidity > 0) {
    const parts: string[] = [];
    if (unpairedTemperature > 0) parts.push(countOf(unpairedTemperature, 'air temperature reading', 'air temperature readings'));
    if (unpairedHumidity > 0) parts.push(countOf(unpairedHumidity, 'humidity reading', 'humidity readings'));
    const many = unpairedTemperature + unpairedHumidity > 1;
    notes.push(
      `${parts.join(' and ')} ${many ? 'have' : 'has'} no reading of the other kind for the same area on the same day, so ${many ? 'they give' : 'it gives'} no VPD.`,
    );
  }
  if (noArea > 0) {
    notes.push(
      `${countOf(noArea, 'reading was', 'readings were')} recorded with no area, so there is nothing to pair ${noArea === 1 ? 'it' : 'them'} by.`,
    );
  }
  if (unreadable > 0) {
    notes.push(
      `${countOf(unreadable, 'reading is', 'readings are')} left out: humidity is read here as a percentage from 0 to 100, and an air temperature in °C or °F between ${VPD_LOWEST_C}°C and ${VPD_HIGHEST_C}°C.`,
    );
  }
  return { pairs, unpairedTemperature, unpairedHumidity, noArea, unreadable, notes };
}

/** What one worked-out VPD reads back as on its own row. */
export function describeVpdPair(pair: VpdPair, today: string): string {
  const parts = [
    formatFigure(pair.vpd, VPD_UNIT),
    describeWhen(pair.measuredOn, today),
    `from ${pair.temperature} and ${Math.round(pair.humidity * 10) / 10}% humidity`,
  ];
  if (pair.deviceName) parts.push(`both from ${pair.deviceName}`);
  return parts.join(', ');
}

/** Air VPD month by month, as a band the same shape as a measurement's. A
 *  month is blank when no temperature and humidity met on one area and day,
 *  which is a different thing from nothing being measured. */
export function buildVpdBand(input: { pairing: VpdPairing; months: YieldMonth[] }): MeasurementBand {
  const readings: GardenReading[] = input.pairing.pairs.map((pair) => ({
    id: `${pair.temperatureId}+${pair.humidityId}`,
    plotId: pair.plotId,
    plotName: pair.plotName,
    plantingId: null,
    measurement: VPD_CODE,
    value: pair.vpd,
    unit: VPD_UNIT,
    measuredOn: pair.measuredOn,
    source: 'hand',
    deviceName: null,
    note: null,
    createdAt: '',
  }));
  const band = buildMeasurementBand({
    measurement: VPD_CODE,
    label: VPD_LABEL,
    readings,
    months: input.months,
    preferredUnit: VPD_UNIT,
    blankReason: 'no air temperature and humidity were recorded for the same area on the same day',
  }) as MeasurementBand;

  const measured = band.months.filter((month) => month.figure !== null);
  const pairsInRange = measured.reduce((sum, month) => sum + month.readings, 0);
  let headline: string;
  if (measured.length === 0) {
    headline = 'No air VPD in this stretch, since no air temperature and humidity were recorded for the same area on the same day.';
  } else {
    const mean = measured.reduce((sum, month) => sum + (month.figure ?? 0), 0) / measured.length;
    const spread = measured.length === 1 ? 'in one month' : `across ${measured.length} months`;
    headline = `${formatFigure(mean, VPD_UNIT)} on average, from ${countOf(pairsInRange, 'pair of readings', 'pairs of readings')} ${spread}.`;
  }
  return {
    ...band,
    headline,
    notes: [...band.notes, ...input.pairing.notes, VPD_HOW, VPD_LEAF_NOTE, VPD_PAIRING_NOTE],
  };
}

// ---------------------------------------------------------------------------
// Hour by hour and day by day from a device (I19)
// ---------------------------------------------------------------------------
//
// A file brought in from a controller keeps every figure with its time on
// the device that imported it, and garden_reading_hours carries each hour's
// average, lowest, highest and count everywhere. This band reads the hours:
// one source at a time (an area or a planting, and the device that logged
// it), the latest month of days in the range, and the 24 hours of one day.
// An hour or day with nothing logged is a gap, never a zero.

export type ReadingHourRow = {
  plotId: string | null;
  plotName: string | null;
  plantingId: string | null;
  deviceName: string;
  unit: string;
  /** 'YYYY-MM-DD HH'. */
  hour: string;
  average: number;
  lowest: number;
  highest: number;
  count: number;
};

export type DeviceSource = { key: string; label: string };

export type DeviceDetail = {
  sources: DeviceSource[];
  sourceKey: string;
  headline: string;
  days: PeriodRow[];
  dayOptions: { label: string; value: string }[];
  day: string;
  hoursHeadline: string;
  hours: PeriodRow[];
  notes: string[];
};

export function deviceSourceKey(row: { plotId: string | null; plantingId: string | null; deviceName: string }): string {
  return [row.plotId ?? '', row.plantingId ?? '', row.deviceName.trim().toLowerCase()].join('|');
}

export const DEVICE_DAYS_SHOWN = 31;

function shiftDay(day: string, by: number): string {
  const [y, m, d] = day.split('-').map(Number);
  const moved = new Date(y, m - 1, d + by);
  return `${moved.getFullYear()}-${String(moved.getMonth() + 1).padStart(2, '0')}-${String(moved.getDate()).padStart(2, '0')}`;
}

function shortDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function longDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
}

function spreadDisplay(average: number, lowest: number, highest: number, unit: string): string {
  const places = placesFor(unit);
  if (roundTo(lowest, places) === roundTo(highest, places)) return formatFigure(average, unit);
  return `${formatFigure(average, unit)}, ${roundTo(lowest, places)} to ${roundTo(highest, places)}`;
}

type Tally = { sum: number; count: number; lowest: number; highest: number };

function addTo(tallies: Map<string, Tally>, key: string, row: { average: number; lowest: number; highest: number; count: number }) {
  const held = tallies.get(key);
  if (held) {
    held.sum += row.average * row.count;
    held.count += row.count;
    held.lowest = Math.min(held.lowest, row.lowest);
    held.highest = Math.max(held.highest, row.highest);
  } else {
    tallies.set(key, { sum: row.average * row.count, count: row.count, lowest: row.lowest, highest: row.highest });
  }
}

function tallyRow(key: string, label: string, tally: Tally | undefined, unit: string): PeriodRow {
  return {
    key,
    label,
    value: tally ? tally.sum / tally.count : null,
    display: tally ? spreadDisplay(tally.sum / tally.count, tally.lowest, tally.highest, unit) : 'not logged',
  };
}

/** Null when no device has logged this measurement by the hour. */
export function buildDeviceDetail(input: {
  rows: ReadingHourRow[];
  labelOfSource: (row: ReadingHourRow) => string;
  pickedSource: string | null;
  pickedDay: string | null;
  /** Rain (I21): an hour holds what fell in it, with the day's total by the
   *  end of the hour as its highest, so a day is its last hour's total rather
   *  than an average. */
  total?: boolean;
}): DeviceDetail | null {
  if (input.rows.length === 0) return null;
  const sourceRows = new Map<string, ReadingHourRow[]>();
  const sources: DeviceSource[] = [];
  for (const row of input.rows) {
    const key = deviceSourceKey(row);
    const list = sourceRows.get(key);
    if (list) list.push(row);
    else {
      sourceRows.set(key, [row]);
      sources.push({ key, label: input.labelOfSource(row) });
    }
  }
  sources.sort((a, b) => a.label.localeCompare(b.label));
  const sourceKey = input.pickedSource && sourceRows.has(input.pickedSource) ? input.pickedSource : sources[0].key;
  const rows = [...(sourceRows.get(sourceKey) ?? [])].sort((a, b) => a.hour.localeCompare(b.hour));

  // The unit the latest hour was logged in. Hours in another unit of the
  // same quantity are moved into it, and any that cannot be are set aside.
  const unit = rows[rows.length - 1].unit;
  let setAside = 0;
  const moved: ReadingHourRow[] = [];
  for (const row of rows) {
    const average = convertUnit(row.average, row.unit, unit);
    const lowest = convertUnit(row.lowest, row.unit, unit);
    const highest = convertUnit(row.highest, row.unit, unit);
    if (average === null || lowest === null || highest === null) {
      setAside += 1;
      continue;
    }
    moved.push({ ...row, unit, average, lowest, highest });
  }
  if (moved.length === 0) return null;

  const byDay = new Map<string, Tally>();
  const byHour = new Map<string, Tally>();
  for (const row of moved) {
    addTo(byDay, row.hour.slice(0, 10), row);
    addTo(byHour, row.hour, row);
  }
  const loggedDays = [...byDay.keys()].sort();
  const lastDay = loggedDays[loggedDays.length - 1];
  const earliestShown = shiftDay(lastDay, -(DEVICE_DAYS_SHOWN - 1));
  const firstShown = loggedDays[0] > earliestShown ? loggedDays[0] : earliestShown;
  // For rain, each day's total as of its latest hour.
  const dayTotals = new Map<string, { hour: string; total: number }>();
  if (input.total) {
    for (const row of moved) {
      const day = row.hour.slice(0, 10);
      const held = dayTotals.get(day);
      if (!held || row.hour > held.hour) dayTotals.set(day, { hour: row.hour, total: row.highest });
    }
  }
  const dayRow = (key: string, label: string, tally: Tally | undefined): PeriodRow => {
    if (!input.total) return tallyRow(key, label, tally, unit);
    const held = dayTotals.get(key);
    return held
      ? { key, label, value: held.total, display: formatFigure(held.total, unit) }
      : { key, label, value: null, display: 'not logged' };
  };
  const hourRow = (key: string, label: string, tally: Tally | undefined): PeriodRow => {
    if (!input.total || !tally) return tallyRow(key, label, tally, unit);
    // The tally weights by readings; an hour of rain is the rise the hour row holds.
    const fell = tally.sum / tally.count;
    return {
      key,
      label,
      value: fell,
      display: `${formatFigure(fell, unit)} fell, ${formatFigure(tally.highest, unit)} for the day by then`,
    };
  };
  const days: PeriodRow[] = [];
  let blankDays = 0;
  for (let day = firstShown; day <= lastDay; day = shiftDay(day, 1)) {
    const tally = byDay.get(day);
    if (!tally) blankDays += 1;
    days.push(dayRow(day, shortDay(day), tally));
  }

  const day = input.pickedDay && byDay.has(input.pickedDay) ? input.pickedDay : lastDay;
  const hours: PeriodRow[] = [];
  let loggedHours = 0;
  let figures = 0;
  for (let h = 0; h < 24; h += 1) {
    const key = `${day} ${String(h).padStart(2, '0')}`;
    const tally = byHour.get(key);
    if (tally) {
      loggedHours += 1;
      figures += tally.count;
    }
    hours.push(hourRow(key, `${String(h).padStart(2, '0')}:00`, tally));
  }

  const headline = input.total
    ? days.length === 1
      ? `${longDay(lastDay)}, the one day logged in this range: the day's rain as last read.`
      : `Day by day, ${longDay(firstShown)} to ${longDay(lastDay)}, latest first: each day's rain as last read that day.`
    : days.length === 1
      ? `${longDay(lastDay)}, the one day logged in this range.`
      : `Day by day, ${longDay(firstShown)} to ${longDay(lastDay)}, latest first: each day's average, then its lowest to highest.`;
  const notes: string[] = [];
  if (blankDays > 0) {
    notes.push(`${blankDays} ${blankDays === 1 ? 'day' : 'days'} in that stretch had nothing logged, and ${blankDays === 1 ? 'reads' : 'read'} as a gap.`);
  }
  if (firstShown > loggedDays[0]) notes.push(`The latest ${DEVICE_DAYS_SHOWN} days are shown here; the months above cover the whole range.`);
  if (setAside > 0) {
    notes.push(`${setAside} ${setAside === 1 ? 'hour was' : 'hours were'} logged in a unit that cannot be turned into ${unit}, and ${setAside === 1 ? 'is' : 'are'} left out here.`);
  }
  if (input.total) {
    notes.push(
      "An hour is how far the gauge's total for the day rose in it. Rain that had fallen before the first reading of a day counts toward the day and no hour, and rain after the last reading of a day is not in that day's figure.",
    );
  } else {
    notes.push('A day or an hour is the average of every figure logged in it, with the lowest and highest beside it.');
  }

  return {
    sources,
    sourceKey,
    headline,
    days: days.reverse(),
    dayOptions: [...loggedDays].reverse().map((value) => ({ label: longDay(value), value })),
    day,
    hoursHeadline: `Hour by hour on ${longDay(day)}: ${figures.toLocaleString('en-US')} ${figures === 1 ? 'figure' : 'figures'} over ${loggedHours} ${loggedHours === 1 ? 'hour' : 'hours'}.`,
    hours,
    notes,
  };
}
