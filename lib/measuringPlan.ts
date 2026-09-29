// What is measured in each garden area, and whether for the area as a
// whole or for each planting in it (2026-09-28, 1.0.55.32).
//
// Asked for directly: "Growing conditions need to be more on a per area way
// of looking at it... the next question should be about which area or plant
// we are measuring for... and this should be part of the setting up the
// area, so there needs to be a process to follow on this."
//
// Air temperature and humidity are usually one figure for a whole room or
// tent, while soil readings, and often the light a plant sits under, are
// taken at each plant. So every area can carry a short plan: each
// measurement taken there, and at which of the two levels. The plan is a
// setting and not a record: it decides what the reading form offers first,
// and a reading taken outside it is saved the same as any other. Nothing
// here stores a reading.
//
// No database in this file; lib/measuringPlanDb.ts reads and writes
// garden_measure_plan.

import { areaDepth, areaPath, nestedOrder } from './gardenAreaNesting';
import type { GardenReading } from './growingConditions';

export type MeasureScope = 'area' | 'planting';

export type MeasurePlanRow = {
  id: string;
  plotId: string;
  measurement: string;
  scope: MeasureScope;
};

export type PlanChoice = { measurement: string; scope: MeasureScope };

type AreaKind = 'outdoor' | 'indoor' | 'greenhouse';

/** The id a plan row always has, so the same measurement set on the same
 *  area from two devices merges into one row rather than two. */
export function planRowId(plotId: string, measurement: string): string {
  return `plan_${plotId}_${measurement}`;
}

/** The level each built-in measurement is usually taken at. A measurement
 *  the person named is taken for the area as a whole until they say
 *  otherwise. */
const USUAL_SCOPE: Record<string, MeasureScope> = {
  air_temperature: 'area',
  humidity: 'area',
  co2: 'area',
  vpd: 'area',
  rainfall: 'area',
  light: 'planting',
  soil_moisture: 'planting',
  soil_temperature: 'planting',
  soil_ph: 'planting',
  soil_ec: 'planting',
  water_given: 'planting',
};

export function usualScope(measurement: string, kind: AreaKind, lit: boolean): MeasureScope {
  // Outdoors, and in a greenhouse with no lamps, the sun lights the whole
  // area at once.
  if (measurement === 'light' && (kind === 'outdoor' || !lit)) return 'area';
  return USUAL_SCOPE[measurement] ?? 'area';
}

/** What a new area starts with ticked, from where it is: a starting point
 *  the person changes, never a list of what ought to be measured. */
export function suggestedPlan(kind: AreaKind, lit: boolean): PlanChoice[] {
  const codes =
    kind === 'indoor'
      ? ['air_temperature', 'humidity', 'light', 'soil_moisture']
      : kind === 'greenhouse'
        ? ['air_temperature', 'humidity', 'soil_moisture', ...(lit ? ['light'] : [])]
        : ['rainfall', 'soil_moisture'];
  return codes.map((measurement) => ({ measurement, scope: usualScope(measurement, kind, lit) }));
}

export const PLAN_HOW =
  'Pick each thing you measure in this area, and whether it is one figure for the area as a whole (air temperature and humidity in a room or tent, rain on a bed) or one for each planting (soil readings, or the light a plant sits under). Recording a reading here then asks for the area first and offers these at the top. A reading of anything else can still be recorded.';

export function suggestionNote(kind: AreaKind): string {
  const where = kind === 'indoor' ? 'an indoor area' : kind === 'greenhouse' ? 'a greenhouse' : 'an outdoor area';
  return `Nothing is set for this area yet, so what is ticked is a starting point for ${where}. Change any of it, then save.`;
}

/** "The room as a whole" for an indoor area on its own; an area inside
 *  another one (a tent in the room) is "the area as a whole", since the room
 *  around it is measured on its own (1.0.55.33). */
export function scopeLabel(scope: MeasureScope, kind: AreaKind | null, nested = false): string {
  if (scope === 'planting') return 'Each planting';
  return kind === 'indoor' && !nested ? 'The room as a whole' : 'The area as a whole';
}

/** "the room" or "the area", for a sentence. */
export function wholeWord(kind: AreaKind | null, nested = false): string {
  return kind === 'indoor' && !nested ? 'the room' : 'the area';
}

function joinWords(words: string[]): string {
  if (words.length <= 1) return words.join('');
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

/** One line saying what an area's plan holds. */
export function planSummary(
  rows: PlanChoice[],
  labelOf: (code: string) => string,
  kind: AreaKind | null,
  nested = false,
): string {
  if (rows.length === 0) return 'Nothing set to be measured here yet';
  const whole = rows.filter((row) => row.scope === 'area').map((row) => labelOf(row.measurement).toLowerCase());
  const each = rows.filter((row) => row.scope === 'planting').map((row) => labelOf(row.measurement).toLowerCase());
  const parts: string[] = [];
  if (whole.length > 0) parts.push(`${joinWords(whole)} for ${wholeWord(kind, nested)} as a whole`);
  if (each.length > 0) parts.push(`${joinWords(each)} for each planting`);
  const line = parts.join('; ');
  return `Measured here: ${line}`;
}

/** The measurements planned at one level of one area, in the order the
 *  plan lists them, which is what the reading form offers first. */
export function plannedFor(rows: PlanChoice[], scope: MeasureScope): string[] {
  return rows.filter((row) => row.scope === scope).map((row) => row.measurement);
}

/** Choices set on screen turned into the rows to keep, one per
 *  measurement. A later choice for the same measurement replaces an
 *  earlier one. */
export function normalizePlan(choices: PlanChoice[]): PlanChoice[] {
  const byCode = new Map<string, MeasureScope>();
  for (const choice of choices) {
    if (!choice.measurement) continue;
    byCode.set(choice.measurement, choice.scope);
  }
  return [...byCode.entries()].map(([measurement, scope]) => ({ measurement, scope }));
}

// ---------------------------------------------------------------------------
// Readings, area by area
// ---------------------------------------------------------------------------

export type ReadingTarget = {
  /** Null for the area as a whole. */
  plantingId: string | null;
  name: string;
  measurements: { measurement: string; label: string; rows: GardenReading[] }[];
  count: number;
};

export type AreaReadings = {
  /** Null for readings recorded with no area. */
  plotId: string | null;
  /** The area's path, "Grow room › Tent 2" for an area inside another. */
  name: string;
  /** How many areas this one stands inside; 0 for an area on its own. */
  depth: number;
  /** True when the area has since been removed or moved to Past Areas. */
  removed: boolean;
  targets: ReadingTarget[];
  count: number;
  /** The newest day anything here was read, or null with nothing yet. */
  latest: string | null;
};

export const NO_AREA_NAME = 'No area in particular';

/** Every reading grouped by area, then by what in the area it was for (the
 *  area as a whole first, then each planting by name), then by
 *  measurement, newest first throughout. Every current area is listed,
 *  with nothing yet or not, so an area with no readings is plain to see.
 *  Current areas come first, newest reading first and unmeasured ones
 *  after by name; then areas since removed; then readings with no area. */
export function groupReadingsByArea(input: {
  readings: GardenReading[];
  areas: { id: string; name: string; locationType: AreaKind; insidePlotId?: string | null }[];
  plantings: { id: string; foodName: string }[];
  labelOf: (code: string) => string;
}): AreaReadings[] {
  const current = new Map(input.areas.map((area) => [area.id, area]));
  const plantingName = new Map(input.plantings.map((planting) => [planting.id, planting.foodName]));
  const byArea = new Map<string, GardenReading[]>();
  for (const reading of input.readings) {
    const key = reading.plotId ?? '';
    const bucket = byArea.get(key);
    if (bucket) bucket.push(reading);
    else byArea.set(key, [reading]);
  }

  const nestable = input.areas.map((area) => ({ id: area.id, name: area.name, insidePlotId: area.insidePlotId ?? null }));
  const build = (
    plotId: string | null,
    name: string,
    removed: boolean,
    kind: AreaKind | null,
    rows: GardenReading[],
    depth = 0,
  ): AreaReadings => {
    const byTarget = new Map<string, GardenReading[]>();
    for (const reading of rows) {
      const key = reading.plantingId ?? '';
      const bucket = byTarget.get(key);
      if (bucket) bucket.push(reading);
      else byTarget.set(key, [reading]);
    }
    const targets: ReadingTarget[] = [...byTarget.entries()].map(([key, targetRows]) => {
      const byMeasurement = new Map<string, GardenReading[]>();
      for (const reading of targetRows) {
        const bucket = byMeasurement.get(reading.measurement);
        if (bucket) bucket.push(reading);
        else byMeasurement.set(reading.measurement, [reading]);
      }
      const measurements = [...byMeasurement.entries()]
        .map(([measurement, measured]) => ({
          measurement,
          label: input.labelOf(measurement),
          rows: [...measured].sort(newestFirst),
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
      const plantingId = key || null;
      const targetName = plantingId
        ? plantingName.get(plantingId) ?? 'A planting since removed'
        : plotId
          ? scopeLabel('area', kind, depth > 0)
          : 'Not tied to a planting';
      return { plantingId, name: targetName, measurements, count: targetRows.length };
    });
    targets.sort((a, b) => {
      if (a.plantingId === null) return -1;
      if (b.plantingId === null) return 1;
      return a.name.localeCompare(b.name);
    });
    const latest = rows.reduce<string | null>((max, reading) => (max === null || reading.measuredOn > max ? reading.measuredOn : max), null);
    return { plotId, name, depth, removed, targets, count: rows.length, latest };
  };

  const out: AreaReadings[] = [];
  for (const area of input.areas) {
    const depth = areaDepth(area.id, nestable);
    out.push(build(area.id, areaPath(area.id, nestable), false, area.locationType, byArea.get(area.id) ?? [], depth));
  }
  const gone: AreaReadings[] = [];
  for (const [key, rows] of byArea.entries()) {
    if (!key || current.has(key)) continue;
    const name = rows.find((reading) => reading.plotName)?.plotName ?? 'An area since removed';
    gone.push(build(key, name, true, null, rows));
  }
  out.sort(byLatestThenName);
  // Each area is followed by the areas inside it, so a room's tents read
  // under the room.
  const parentOf = new Map(nestable.map((area) => [area.id, area.insidePlotId]));
  const nested = nestedOrder(out.map((area) => ({ ...area, id: area.plotId ?? '', insidePlotId: parentOf.get(area.plotId ?? '') ?? null })));
  out.splice(0, out.length, ...nested.map((area) => out.find((entry) => entry.plotId === area.id) as AreaReadings));
  gone.sort(byLatestThenName);
  const loose = byArea.get('');
  return [...out, ...gone, ...(loose ? [build(null, NO_AREA_NAME, false, null, loose)] : [])];
}

function newestFirst(a: GardenReading, b: GardenReading): number {
  return b.measuredOn.localeCompare(a.measuredOn) || b.createdAt.localeCompare(a.createdAt);
}

function byLatestThenName(a: AreaReadings, b: AreaReadings): number {
  if (a.latest && b.latest && a.latest !== b.latest) return b.latest.localeCompare(a.latest);
  if (a.latest && !b.latest) return -1;
  if (!a.latest && b.latest) return 1;
  return a.name.localeCompare(b.name);
}

/** What the first step of the reading form says it is recording for. */
export function whereLine(
  areaName: string | null,
  plantingName: string | null,
  kind: AreaKind | null,
  nested = false,
): string {
  if (!areaName) return `For: ${NO_AREA_NAME.toLowerCase()}`;
  return `For: ${areaName}, ${plantingName ?? scopeLabel('area', kind, nested).toLowerCase()}`;
}
