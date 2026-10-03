// Weather beside symptoms, F22 (2026-10-01): reading and writing the
// daily_weather table, and the one request to NASA POWER that fills it.
// The arithmetic and every sentence live in lib/weather.ts.
//
// Nothing is fetched until the person turns weather on, and then only for
// the days a reader asks about. The table stays on this device (it is in
// DEVICE_LOCAL_TABLES), since each device can fetch the same public figures
// for itself and a snapshot has no need to carry them.
import { getDatabase, getStoredMeasurementSystem } from './db';
import { resolveHomeLocation } from './homeSky';
import { readRoughPoint } from './roughLocation';
import { coarsenPoint, parsePowerResponse, powerUrl, spanToFetch, unitsFor, type WeatherDay, type WeatherPlaceSource, type WeatherUnits } from './weather';

const WEATHER_ON_KEY = 'weather_beside_symptoms';
const LAST_FETCH_KEY = 'weather_last_fetch';
// A failed or empty request is not repeated for this long, so a screen
// opened many times in an afternoon asks NASA once.
const RETRY_AFTER_MS = 6 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 20000;

async function readMeta(key: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string | null }>('SELECT value FROM app_meta WHERE key = ?', key);
  return row?.value ?? null;
}

async function writeMeta(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO app_meta (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    key,
    value,
    new Date().toISOString(),
  );
}

export async function isWeatherOn(): Promise<boolean> {
  return (await readMeta(WEATHER_ON_KEY)) === '1';
}

export async function setWeatherOn(on: boolean): Promise<void> {
  await writeMeta(WEATHER_ON_KEY, on ? '1' : '0');
}

export async function getWeatherUnits(): Promise<WeatherUnits> {
  return unitsFor(await getStoredMeasurementSystem());
}

export type WeatherPoint = { lat: number; lon: number; from?: WeatherPlaceSource };

// The coarsened point for the postal code in Garden > My Zone, then the
// phone's rough location if the person gave it, or null when there is
// neither.
export async function weatherPoint(): Promise<WeatherPoint | null> {
  try {
    const home = await resolveHomeLocation();
    if (home) return { ...coarsenPoint(home.lat, home.lon), from: 'postal' };
  } catch {
    // Fall through to the phone's point.
  }
  const rough = await readRoughPoint();
  return rough ? { ...coarsenPoint(rough.lat, rough.lon), from: 'phone' } : null;
}

type WeatherRow = {
  date: string;
  temp_mean_c: number | null;
  temp_min_c: number | null;
  temp_max_c: number | null;
  humidity: number | null;
  pressure_kpa: number | null;
  rain_mm: number | null;
};

export async function listWeatherDays(start: string, end: string, point?: WeatherPoint | null): Promise<WeatherDay[]> {
  const at = point === undefined ? await weatherPoint() : point;
  if (!at) return [];
  const db = await getDatabase();
  const rows = await db.getAllAsync<WeatherRow>(
    `SELECT date, temp_mean_c, temp_min_c, temp_max_c, humidity, pressure_kpa, rain_mm
       FROM daily_weather WHERE lat = ? AND lon = ? AND date >= ? AND date <= ? ORDER BY date`,
    at.lat,
    at.lon,
    start,
    end,
  );
  return rows.map((r) => ({
    date: r.date,
    tempMeanC: r.temp_mean_c,
    tempMinC: r.temp_min_c,
    tempMaxC: r.temp_max_c,
    humidity: r.humidity,
    pressureKpa: r.pressure_kpa,
    rainMm: r.rain_mm,
  }));
}

// The local day the figures for this point were last read, for the credit line.
export async function weatherReadOn(point?: WeatherPoint | null): Promise<string | null> {
  const at = point === undefined ? await weatherPoint() : point;
  if (!at) return null;
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ fetched_at: string | null }>(
    'SELECT MAX(fetched_at) AS fetched_at FROM daily_weather WHERE lat = ? AND lon = ?',
    at.lat,
    at.lon,
  );
  if (!row?.fetched_at) return null;
  const d = new Date(row.fetched_at);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function localToday(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export type WeatherRefresh = { state: 'off' | 'no-place' | 'nothing-missing' | 'waiting' | 'error' } | { state: 'added'; days: number };

let inFlight: Promise<WeatherRefresh> | null = null;

// Fills in the days between start and end that are missing, in one request.
// One request at a time, and after a request that failed or brought nothing
// back, none for six hours for the same span.
export function refreshWeather(start: string, end: string): Promise<WeatherRefresh> {
  if (inFlight) return inFlight;
  inFlight = doRefresh(start, end).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function doRefresh(start: string, end: string): Promise<WeatherRefresh> {
  if (!(await isWeatherOn())) return { state: 'off' };
  const point = await weatherPoint();
  if (!point) return { state: 'no-place' };
  const have = new Set((await listWeatherDays(start, end, point)).map((d) => d.date));
  const span = spanToFetch(start, end, localToday(), have);
  if (!span) return { state: 'nothing-missing' };

  const attemptKey = `${point.lat},${point.lon},${span.start},${span.end}`;
  try {
    const last = JSON.parse((await readMeta(LAST_FETCH_KEY)) ?? 'null') as { key: string; at: number } | null;
    if (last && last.key === attemptKey && Date.now() - last.at < RETRY_AFTER_MS) return { state: 'waiting' };
  } catch {
    // A malformed note is treated as no note.
  }
  await writeMeta(LAST_FETCH_KEY, JSON.stringify({ key: attemptKey, at: Date.now() }));

  let days: WeatherDay[];
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const response = await fetch(powerUrl(point.lat, point.lon, span.start, span.end), { signal: controller.signal });
    clearTimeout(timer);
    if (!response.ok) return { state: 'error' };
    days = parsePowerResponse(await response.json());
  } catch {
    return { state: 'error' };
  }
  if (days.length === 0) return { state: 'error' };

  const db = await getDatabase();
  const fetchedAt = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    for (const day of days) {
      await db.runAsync(
        `INSERT OR REPLACE INTO daily_weather
           (date, lat, lon, temp_mean_c, temp_min_c, temp_max_c, humidity, pressure_kpa, rain_mm, fetched_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        day.date,
        point.lat,
        point.lon,
        day.tempMeanC,
        day.tempMinC,
        day.tempMaxC,
        day.humidity,
        day.pressureKpa,
        day.rainMm,
        fetchedAt,
      );
    }
  });
  return { state: 'added', days: days.length };
}
