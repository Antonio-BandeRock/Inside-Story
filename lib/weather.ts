// Weather beside symptoms, F22 (2026-10-01). Pure: no imports from the
// database, so scripts/test_weather.js can check it.
//
// The source is NASA's POWER project (Langley Research Center), daily
// point API version 2: free, no key, worldwide, back decades, and with no
// fee or limit on commercial use named on its referencing page, which asks
// for a credit line naming the project, the service, its version and the
// date it was read. Open-Meteo, which Home's sky card still uses, was
// ruled out for this because its free service is for non-commercial use
// only (checked 2026-10-01). POWER runs about two days behind, which suits
// looking back at the days around a flare and is why it cannot give today.
//
// Only a coarsened point leaves the device: the postal code centre from
// Garden > My Zone, rounded to the nearest half degree (about 55 km), which
// is also about the size of POWER's weather grid, so nothing is lost by
// rounding. With no postal code, the phone can give its rough location
// instead (rebuild R1, lib/roughLocation.ts), rounded the same way before it
// is even kept. Fetching starts only once the person turns it on.

export const WEATHER_GRID_DEGREES = 0.5;
export const POWER_FILL_VALUE = -999;
export const POWER_API_VERSION = '2';

// The coarsened point, rounded to the half degree.
export function coarsenPoint(lat: number, lon: number): { lat: number; lon: number } {
  const round = (value: number) => Math.round(value / WEATHER_GRID_DEGREES) * WEATHER_GRID_DEGREES;
  const lat2 = Math.max(-90, Math.min(90, round(lat)));
  let lon2 = round(lon);
  if (lon2 > 180) lon2 -= 360;
  if (lon2 <= -180) lon2 += 360;
  return { lat: lat2 === 0 ? 0 : lat2, lon: lon2 === 0 ? 0 : lon2 };
}

// One day of weather where the person lives, as stored in daily_weather.
// Celsius, kilopascals, percent and millimetres; display converts.
export type WeatherDay = {
  date: string;
  tempMeanC: number | null;
  tempMinC: number | null;
  tempMaxC: number | null;
  humidity: number | null;
  pressureKpa: number | null;
  rainMm: number | null;
};

export const POWER_PARAMETERS = ['T2M', 'T2M_MIN', 'T2M_MAX', 'RH2M', 'PS', 'PRECTOTCORR'] as const;

function compact(date: string): string {
  return date.replace(/-/g, '');
}

export function powerUrl(lat: number, lon: number, start: string, end: string): string {
  const params = [
    `parameters=${POWER_PARAMETERS.join(',')}`,
    'community=AG',
    `longitude=${lon}`,
    `latitude=${lat}`,
    `start=${compact(start)}`,
    `end=${compact(end)}`,
    'format=JSON',
    'time-standard=LST',
  ];
  return `https://power.larc.nasa.gov/api/temporal/daily/point?${params.join('&')}`;
}

// POWER's answer as days. A day whose every figure is the fill value is not
// in yet and is left out, so it is fetched again later rather than stored
// as a blank; a single missing figure is stored as null.
export function parsePowerResponse(body: unknown): WeatherDay[] {
  const parameter = (body as { properties?: { parameter?: Record<string, Record<string, number>> } })?.properties?.parameter;
  if (!parameter || typeof parameter !== 'object') return [];
  const read = (code: string, key: string): number | null => {
    const value = parameter[code]?.[key];
    return typeof value === 'number' && Number.isFinite(value) && value > POWER_FILL_VALUE + 1 ? value : null;
  };
  const keys = new Set<string>();
  for (const code of POWER_PARAMETERS) for (const key of Object.keys(parameter[code] ?? {})) keys.add(key);
  const days: WeatherDay[] = [];
  for (const key of [...keys].sort()) {
    if (!/^\d{8}$/.test(key)) continue;
    const day: WeatherDay = {
      date: `${key.slice(0, 4)}-${key.slice(4, 6)}-${key.slice(6, 8)}`,
      tempMeanC: read('T2M', key),
      tempMinC: read('T2M_MIN', key),
      tempMaxC: read('T2M_MAX', key),
      humidity: read('RH2M', key),
      pressureKpa: read('PS', key),
      rainMm: read('PRECTOTCORR', key),
    };
    const any = [day.tempMeanC, day.tempMinC, day.tempMaxC, day.humidity, day.pressureKpa, day.rainMm].some((v) => v !== null);
    if (any) days.push(day);
  }
  return days;
}

export function shiftDay(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

// POWER has nothing for the last two days, so a request ends there.
export const POWER_LAG_DAYS = 2;
// The furthest back one request reaches, so a long Pattern Finder range
// or an old flare does not ask for decades.
export const MAX_WEATHER_DAYS = 400;

// The one span to ask for: from the first day missing to the last day
// missing, inside start to the last day POWER can have. Null when nothing
// is missing.
export function spanToFetch(start: string, end: string, today: string, have: ReadonlySet<string>): { start: string; end: string } | null {
  const lastAvailable = shiftDay(today, -POWER_LAG_DAYS);
  const stop = end < lastAvailable ? end : lastAvailable;
  const earliest = shiftDay(stop, -(MAX_WEATHER_DAYS - 1));
  let day = start > earliest ? start : earliest;
  let first: string | null = null;
  let last: string | null = null;
  while (day <= stop) {
    if (!have.has(day)) {
      if (first === null) first = day;
      last = day;
    }
    day = shiftDay(day, 1);
  }
  return first && last ? { start: first, end: last } : null;
}

// ---- display ----

export type TempUnit = 'C' | 'F';
export type PressureUnit = 'hPa' | 'inHg';
export type RainUnit = 'mm' | 'in';

export type WeatherUnits = { temp: TempUnit; pressure: PressureUnit; rain: RainUnit };

export function unitsFor(system: 'metric' | 'imperial' | null): WeatherUnits {
  return system === 'imperial' ? { temp: 'F', pressure: 'inHg', rain: 'in' } : { temp: 'C', pressure: 'hPa', rain: 'mm' };
}

export function tempIn(unit: TempUnit, celsius: number): number {
  return unit === 'F' ? celsius * 1.8 + 32 : celsius;
}

export function pressureIn(unit: PressureUnit, kpa: number): number {
  return unit === 'inHg' ? kpa * 0.2953 : kpa * 10;
}

export function rainIn(unit: RainUnit, mm: number): number {
  return unit === 'in' ? mm / 25.4 : mm;
}

export function sayTemp(unit: TempUnit, celsius: number): string {
  return `${(Math.round(tempIn(unit, celsius) * 10) / 10).toFixed(1)}°${unit}`;
}

export function sayPressure(unit: PressureUnit, kpa: number): string {
  return unit === 'inHg' ? `${pressureIn(unit, kpa).toFixed(2)} inHg` : `${Math.round(pressureIn(unit, kpa))} hPa`;
}

export function sayPressureChange(unit: PressureUnit, kpa: number): string {
  return unit === 'inHg' ? `${pressureIn(unit, kpa).toFixed(2)} inHg` : `${(Math.round(pressureIn(unit, kpa) * 10) / 10).toFixed(1)} hPa`;
}

export type WeatherPlaceSource = 'postal' | 'phone';

export function weatherCredit(readOn: string | null, from: WeatherPlaceSource = 'postal'): string {
  const read = readOn ? `, read ${readOn}` : '';
  const around = from === 'phone' ? "this phone's rough location" : 'the postal code in Garden > My Zone';
  return `Weather from NASA Langley Research Center's POWER project (daily point API version ${POWER_API_VERSION}${read}), for an area about 55 km across around ${around}. It arrives about two days late.`;
}

export const WEATHER_OFFER =
  'Add the weather to Pattern Finder and Compare Two: air pressure, the day’s high and humidity, from NASA. Only a point rounded to about 55 km around your postal code in Garden > My Zone is sent, never your exact place.';

export const WEATHER_NO_PLACE =
  'Weather needs a place. Set a postal code in Garden > My Zone and it will be added here.';

// On the phone, which can also give its rough location.
export const WEATHER_NO_PLACE_PHONE =
  'Weather needs a place. Set a postal code in Garden > My Zone, or use this phone’s rough location. Either way the point is rounded to about 55 km before it is kept or sent.';
