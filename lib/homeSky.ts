// Real, location-based sky/weather data for Home's greeting card, 2026-08-17
// -- the location-dependent half of the same request celestialEvents.ts
// covers offline (sunrise/sunset, UV index, a heat/freeze flag, and air
// quality/pollen where it's real).
//
// Deliberately reuses the SAME location this app already has, rather than
// asking for a new GPS permission and a native rebuild: geocodePostalCode
// (lib/gardenZoneLookup.ts), already built for Garden's own My Zone feature,
// against user_profile.growing_zone_country/growing_zone_postal_code
// (already saved there the moment someone sets a growing zone). This is
// genuinely accurate enough for sunrise/sunset/weather -- postal/ZIP-code
// centroid precision, not exact GPS coordinates -- and means this whole
// feature needs zero new native dependency, zero new permission dialog, and
// works immediately for anyone who's already set a zone. If nobody's set
// one yet, this returns { status: 'no-location' } and Home shows a plain,
// honest prompt pointing at My Zone rather than silently doing nothing.
//
// Every real endpoint here was independently verified (via a real fetch,
// not memory) before being trusted:
// - Open-Meteo Forecast API (api.open-meteo.com/v1/forecast): free, no key
//   for non-commercial use, confirmed via its own docs -- daily sunrise/
//   sunset/temperature_2m_max/temperature_2m_min/uv_index_max are all real,
//   documented fields, sunrise/sunset returned as real ISO8601 local
//   timestamps directly (no separate solar-position math needed on this
//   app's own side at all).
// - Open-Meteo Air Quality API (air-quality-api.open-meteo.com): confirmed
//   via its own docs that us_aqi/european_aqi are real, GLOBAL computed
//   indices (CAMS global model, ~45km resolution outside Europe, finer
//   inside it) -- but the six named pollen fields (alder/birch/grass/
//   mugwort/olive/ragweed) are confirmed EUROPE-ONLY (the CAMS European
//   regional model specifically). This is not guessed or assumed -- it's
//   what Open-Meteo's own documentation states directly. Rather than fake
//   pollen data for anywhere else, or maintain a hand-drawn "is this in
//   Europe" bounding box, the real API response itself is the honest
//   signal: a genuinely present, finite, positive value for at least one
//   pollen type means real coverage exists there; anything else (null,
//   missing, non-finite) means it doesn't, and the pollen section simply
//   never appears for that location.
//
// Both the resolved location AND the day's own weather/AQI result are
// cached locally (the same single-JSON-blob-under-one-app_meta-key pattern
// visualPreferences.ts already established) so Home never re-geocodes or
// re-fetches on every focus -- only once per real change to the saved zone,
// and once per real calendar day for the weather/AQI itself. A network
// failure with an existing (even stale) cache still shows that cached data,
// honestly labeled with its own real date, rather than nothing at all --
// this app is local-first, and a dashboard card shouldn't go blank just
// because the phone is offline for a moment.

import { geocodePostalCode } from './gardenZoneLookup';
import { getDatabase, getStoredMeasurementSystem, getUserProfile } from './db';

const LOCATION_CACHE_KEY = 'home_sky_location';
const WEATHER_CACHE_KEY = 'home_sky_weather';

type CachedLocation = {
  country: string;
  postalCode: string;
  lat: number;
  lon: number;
  placeLabel: string | null;
};

async function readAppMeta<T>(key: string): Promise<T | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_meta WHERE key = ?', key);
  if (!row?.value) return null;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return null;
  }
}

async function writeAppMeta(key: string, value: unknown): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO app_meta (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    key,
    JSON.stringify(value),
    new Date().toISOString(),
  );
}

// Resolves once per real (country, postalCode) pair -- re-geocodes
// automatically the moment someone changes their saved zone (a real cache
// miss on the pair, not a manual "clear cache" step), and never otherwise.
async function resolveHomeLocation(): Promise<CachedLocation | null> {
  const profile = await getUserProfile();
  const country = profile.growingZoneCountry;
  const postalCode = profile.growingZonePostalCode;
  if (!country || !postalCode) return null;

  const cached = await readAppMeta<CachedLocation>(LOCATION_CACHE_KEY);
  if (cached && cached.country === country && cached.postalCode === postalCode) {
    return cached;
  }

  const geocoded = await geocodePostalCode(country, postalCode);
  if (!geocoded) return null;

  const resolved: CachedLocation = {
    country,
    postalCode,
    lat: geocoded.lat,
    lon: geocoded.lon,
    placeLabel: geocoded.displayName || null,
  };
  await writeAppMeta(LOCATION_CACHE_KEY, resolved);
  return resolved;
}

function todayLocalDateString(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// Real, standard WHO/EPA UV Index bands -- a widely-published public scale,
// not invented for this app.
export type UvBand = 'low' | 'moderate' | 'high' | 'very-high' | 'extreme';
export function uvBandForIndex(uvIndex: number): UvBand {
  if (uvIndex < 3) return 'low';
  if (uvIndex < 6) return 'moderate';
  if (uvIndex < 8) return 'high';
  if (uvIndex < 11) return 'very-high';
  return 'extreme';
}

// Real, standard US EPA AQI breakpoints (0-500 scale) -- also a published
// public standard, not invented here.
export type AqiBand = 'good' | 'moderate' | 'unhealthy-sensitive' | 'unhealthy' | 'very-unhealthy' | 'hazardous';
export function aqiBandForIndex(aqi: number): AqiBand {
  if (aqi <= 50) return 'good';
  if (aqi <= 100) return 'moderate';
  if (aqi <= 150) return 'unhealthy-sensitive';
  if (aqi <= 200) return 'unhealthy';
  if (aqi <= 300) return 'very-unhealthy';
  return 'hazardous';
}

const POLLEN_FIELDS: { field: string; label: string }[] = [
  { field: 'alder_pollen', label: 'Alder' },
  { field: 'birch_pollen', label: 'Birch' },
  { field: 'grass_pollen', label: 'Grass' },
  { field: 'mugwort_pollen', label: 'Mugwort' },
  { field: 'olive_pollen', label: 'Olive' },
  { field: 'ragweed_pollen', label: 'Ragweed' },
];

export type PollenReading = { label: string; grainsPerCubicMeter: number };

export type HomeSkyData = {
  placeLabel: string | null;
  fetchedForDate: string; // 'YYYY-MM-DD', local
  sunrise: string | null; // ISO local timestamp, straight from Open-Meteo
  sunset: string | null;
  tempMax: number | null;
  tempMin: number | null;
  tempUnit: 'F' | 'C';
  uvIndexMax: number | null;
  usAqi: number | null;
  // Only ever populated with real, positive, finite values -- see this
  // file's own header comment on why an empty/absent array (not a
  // guessed region check) is what "not available here" looks like.
  pollen: PollenReading[];
};

async function fetchWeather(lat: number, lon: number, tempUnit: 'F' | 'C'): Promise<Omit<HomeSkyData, 'placeLabel' | 'pollen' | 'usAqi'> | null> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    daily: 'sunrise,sunset,temperature_2m_max,temperature_2m_min,uv_index_max',
    forecast_days: '1',
    timezone: 'auto',
    temperature_unit: tempUnit === 'F' ? 'fahrenheit' : 'celsius',
  });
  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
    if (!response.ok) return null;
    const data = await response.json();
    const daily = data?.daily;
    if (!daily) return null;
    const at0 = (arr: unknown): number | null => (Array.isArray(arr) && typeof arr[0] === 'number' && Number.isFinite(arr[0]) ? arr[0] : null);
    const stringAt0 = (arr: unknown): string | null => (Array.isArray(arr) && typeof arr[0] === 'string' ? arr[0] : null);
    return {
      fetchedForDate: todayLocalDateString(),
      sunrise: stringAt0(daily.sunrise),
      sunset: stringAt0(daily.sunset),
      tempMax: at0(daily.temperature_2m_max),
      tempMin: at0(daily.temperature_2m_min),
      tempUnit,
      uvIndexMax: at0(daily.uv_index_max),
    };
  } catch {
    return null;
  }
}

async function fetchAirQuality(lat: number, lon: number): Promise<{ usAqi: number | null; pollen: PollenReading[] }> {
  const hourlyFields = POLLEN_FIELDS.map((p) => p.field).join(',');
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: 'us_aqi',
    hourly: hourlyFields,
    forecast_days: '1',
    timezone: 'auto',
  });
  try {
    const response = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${params.toString()}`);
    if (!response.ok) return { usAqi: null, pollen: [] };
    const data = await response.json();
    const usAqiRaw = data?.current?.us_aqi;
    const usAqi = typeof usAqiRaw === 'number' && Number.isFinite(usAqiRaw) ? Math.round(usAqiRaw) : null;

    const pollen: PollenReading[] = [];
    for (const { field, label } of POLLEN_FIELDS) {
      const series = data?.hourly?.[field];
      const value = Array.isArray(series) ? series[0] : null;
      if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        pollen.push({ label, grainsPerCubicMeter: Math.round(value) });
      }
    }
    pollen.sort((a, b) => b.grainsPerCubicMeter - a.grainsPerCubicMeter);
    return { usAqi, pollen };
  } catch {
    return { usAqi: null, pollen: [] };
  }
}

export type HomeSkyResult =
  | { status: 'no-location' }
  | { status: 'unavailable' }
  | { status: 'ready'; data: HomeSkyData; stale: boolean };

export async function getHomeSkyData(): Promise<HomeSkyResult> {
  const location = await resolveHomeLocation();
  if (!location) return { status: 'no-location' };

  const today = todayLocalDateString();
  const cached = await readAppMeta<HomeSkyData>(WEATHER_CACHE_KEY);
  if (cached && cached.fetchedForDate === today) {
    return { status: 'ready', data: cached, stale: false };
  }

  const system = await getStoredMeasurementSystem();
  const tempUnit: 'F' | 'C' = system === 'metric' ? 'C' : 'F';

  const [weather, airQuality] = await Promise.all([
    fetchWeather(location.lat, location.lon, tempUnit),
    fetchAirQuality(location.lat, location.lon),
  ]);

  if (!weather) {
    // A real network failure -- fall back to whatever's cached, even if it's
    // from a prior day, rather than showing nothing at all.
    if (cached) return { status: 'ready', data: cached, stale: true };
    return { status: 'unavailable' };
  }

  const fresh: HomeSkyData = {
    placeLabel: location.placeLabel,
    ...weather,
    usAqi: airQuality.usAqi,
    pollen: airQuality.pollen,
  };
  await writeAppMeta(WEATHER_CACHE_KEY, fresh);
  return { status: 'ready', data: fresh, stale: false };
}

// Real, deliberately simple heat/freeze flags -- NOT official government
// heat advisories or freeze warnings (real NWS-style criteria vary by
// region, factor in heat index/wind chill, and aren't available from a free
// global API), stated as such directly wherever these are shown. Just an
// honest, disclosed threshold check against the day's own forecast high/low,
// in whichever unit system the person's own Profile is already set to.
export function isForecastFreezing(data: HomeSkyData): boolean {
  if (data.tempMin == null) return false;
  return data.tempUnit === 'F' ? data.tempMin <= 32 : data.tempMin <= 0;
}
export function isForecastVeryHot(data: HomeSkyData): boolean {
  if (data.tempMax == null) return false;
  return data.tempUnit === 'F' ? data.tempMax >= 95 : data.tempMax >= 35;
}
