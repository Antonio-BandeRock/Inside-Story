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
  if (unit === 'pH' || unit === 'mS/cm') return 2;
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
  const anyFromDevice = input.readings.some((reading) => reading.source === 'device');

  const notes: string[] = [];
  if (blank > 0) {
    const what = anyFromDevice ? 'nothing came in' : 'nothing was measured';
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
