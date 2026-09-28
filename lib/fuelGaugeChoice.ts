// Which nutrients Today's Fuel Gauges on Home show (G31 of the competitive
// build plan, 2026-09-27). Until now the app chose nine for everybody; the
// person now picks their own, and the nine stay as what a person who never
// chose sees.
//
// One app_meta row holding nutrient codes in the order they were added. It
// travels between the person's devices with their other settings, since it
// names nutrients rather than anything about the hardware, so the key stays
// off DEVICE_LOCAL_META_KEYS.
//
// An empty list is a choice too: somebody who takes every gauge off sees a
// line saying none are chosen rather than the nine coming back unasked.
//
// Pure and free of runtime imports (scripts/test_fuel_gauge_choice.js loads
// it directly).

export const FUEL_GAUGE_META_KEY = 'fuel_gauge_nutrients';

// The nine a person sees until they choose. Tied to thyroid hormone
// production and conversion (iodine, selenium, zinc, iron, copper), bone
// health (vitamin D, calcium, magnesium) and B12. Trends and the Overview
// report read the same nine, and keep reading them whatever Home shows.
export const DEFAULT_FUEL_GAUGE_CODES: readonly string[] = [
  'iodine',
  'selenium',
  'zinc',
  'iron',
  'vitamin_d',
  'calcium',
  'magnesium',
  'copper',
  'vitamin_b12',
];

/** The stored list, or the nine when nothing was ever stored or the row cannot be read. */
export function parseFuelGaugeChoice(raw: string | null | undefined): string[] {
  if (raw == null) return [...DEFAULT_FUEL_GAUGE_CODES];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...DEFAULT_FUEL_GAUGE_CODES];
    const seen = new Set<string>();
    for (const code of parsed) if (typeof code === 'string' && code) seen.add(code);
    return [...seen];
  } catch {
    return [...DEFAULT_FUEL_GAUGE_CODES];
  }
}

export function serializeFuelGaugeChoice(codes: string[]): string {
  return JSON.stringify([...new Set(codes)]);
}

export function isDefaultFuelGaugeChoice(codes: string[]): boolean {
  return codes.length === DEFAULT_FUEL_GAUGE_CODES.length && codes.every((code, index) => code === DEFAULT_FUEL_GAUGE_CODES[index]);
}

export function addFuelGauge(codes: string[], code: string): string[] {
  return codes.includes(code) ? codes : [...codes, code];
}

export function removeFuelGauge(codes: string[], code: string): string[] {
  return codes.filter((entry) => entry !== code);
}

/** One place earlier (-1) or later (+1); a move past either end leaves the list as it was. */
export function moveFuelGauge(codes: string[], code: string, step: -1 | 1): string[] {
  const from = codes.indexOf(code);
  const to = from + step;
  if (from < 0 || to < 0 || to >= codes.length) return codes;
  const next = [...codes];
  next[from] = codes[to];
  next[to] = code;
  return next;
}

/**
 * The gauges to draw, in the order chosen. A chosen nutrient the reference
 * data has no target for is left out, since a ring needs a target to fill
 * against.
 */
export function pickFuelGauges<T extends { nutrientCode: string }>(codes: string[], entries: T[]): T[] {
  return codes.map((code) => entries.find((entry) => entry.nutrientCode === code)).filter((entry): entry is T => entry != null);
}

/** Everything that could go on the dashboard and is not on it yet. */
export function addableFuelGauges(
  codes: string[],
  entries: { nutrientCode: string; displayName: string }[],
): { label: string; value: string }[] {
  return entries
    .filter((entry) => !codes.includes(entry.nutrientCode))
    .map((entry) => ({ label: entry.displayName, value: entry.nutrientCode }));
}

export function fuelGaugeChoiceCaption(codes: string[]): string {
  if (codes.length === 0) return 'No nutrients chosen for the gauges. Add one below.';
  if (isDefaultFuelGaugeChoice(codes)) {
    return 'These are the nine the app starts with. Add any nutrient that has a daily target, take one off, or move one along the row.';
  }
  return codes.length === 1
    ? 'One nutrient chosen. Add another, or put back the nine the app starts with.'
    : `${codes.length} nutrients chosen, in the order they sit on the row.`;
}

export const FUEL_GAUGE_EMPTY_LINE = 'No nutrients chosen for the gauges. Tap Choose nutrients to pick some.';
