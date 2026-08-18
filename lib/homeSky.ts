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
//   regional model specifically). This was checked a second time,
//   2026-08-17, directly in response to being asked whether that was
//   really true -- it is: no other genuinely free, keyless, verified-
//   reliable pollen source with real US coverage was found (Achoo is real
//   and keyless but Germany-only; Atmospore claims global coverage but
//   requires a real account/API key for anything past a limited demo, with
//   no verifiable rate-limit or coverage detail; the one credible global
//   option, Google's own Pollen API, needs a real Google Cloud API key tied
//   to a billing account, a genuinely different kind of dependency than
//   anything else this app uses -- named as a real, open follow-up, not
//   silently built in). This is not a limitation baked into this app's own
//   code -- pollen is requested and shown for ANY resolved location; it
//   only ever appears where the real API response itself actually has
//   something to report, not where a hand-drawn "is this Europe" check
//   allows it to.
//
// Both the resolved location AND the day's own weather/AQI result are
// cached locally (the same single-JSON-blob-under-one-app_meta-key pattern
// visualPreferences.ts already established) so Home never re-geocodes or
// re-fetches on every focus -- only once per real change to the saved zone,
// and once per real calendar day for the weather/AQI itself.
//
// 2026-08-17, direct correction: a failed fetch used to silently fall back
// to whatever was cached from a prior day, with only a small "as of..."
// caption -- reported directly as dishonest, and it was. A failed fetch now
// produces a real, distinct 'error' result naming what actually happened
// (no network reachable vs. the service itself returning an error vs. an
// unexpected response), never quietly dressed up as today's real reading.
// Any stale cached data is still surfaced, but only as an explicitly-labeled
// "last successful check was X" note inside that same honest error message,
// never rendered as if it were today's live numbers.

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
  // 2026-08-18: added directly in response to "I don't see temp and
  // humidity" -- humidityMean is a real daily mean (relative_humidity_2m_mean,
  // confirmed directly against Open-Meteo's own docs before use, not
  // guessed), the one representative number for the day rather than
  // separately showing max/min the way temperature does.
  humidityMean: number | null;
  uvIndexMax: number | null;
  usAqi: number | null;
  // Only ever populated with real, positive, finite values -- see this
  // file's own header comment on why an empty/absent array (not a
  // guessed region check) is what "not available here" looks like.
  pollen: PollenReading[];
};

// A real, honest classification of why a fetch didn't produce data --
// distinguished by what actually happened at the network layer, not
// guessed. React Native's own fetch throws a real TypeError (its message
// includes "Network request failed") when the request can't even be
// dispatched -- no DNS, no route, airplane mode, etc. -- which is the
// closest honest signal to "you appear to be offline" available without
// adding a new native dependency (NetInfo) just for this. A response that
// comes back but isn't ok is the weather service itself reporting a
// problem (rate limit, outage); anything else unexpected (bad JSON,
// missing fields) is reported as exactly that rather than folded into
// either of the other two.
export type SkyFetchFailureReason = 'offline' | 'service-error' | 'unexpected';

type FetchAttempt<T> = { ok: true; data: T } | { ok: false; reason: SkyFetchFailureReason; detail: string };

function classifyFetchError(error: unknown): { reason: SkyFetchFailureReason; detail: string } {
  const message = error instanceof Error ? error.message : String(error);
  if (/network request failed/i.test(message) || /failed to fetch/i.test(message)) {
    return { reason: 'offline', detail: message };
  }
  return { reason: 'unexpected', detail: message };
}

async function fetchWeather(
  lat: number,
  lon: number,
  tempUnit: 'F' | 'C',
): Promise<FetchAttempt<Omit<HomeSkyData, 'placeLabel' | 'pollen' | 'usAqi'>>> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    daily: 'sunrise,sunset,temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean,uv_index_max',
    forecast_days: '1',
    timezone: 'auto',
    temperature_unit: tempUnit === 'F' ? 'fahrenheit' : 'celsius',
  });
  let response: Response;
  try {
    response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  } catch (error) {
    return { ok: false, ...classifyFetchError(error) };
  }
  if (!response.ok) {
    return { ok: false, reason: 'service-error', detail: `HTTP ${response.status}` };
  }
  try {
    const data = await response.json();
    const daily = data?.daily;
    if (!daily) return { ok: false, reason: 'unexpected', detail: 'no daily forecast in the response' };
    const at0 = (arr: unknown): number | null => (Array.isArray(arr) && typeof arr[0] === 'number' && Number.isFinite(arr[0]) ? arr[0] : null);
    const stringAt0 = (arr: unknown): string | null => (Array.isArray(arr) && typeof arr[0] === 'string' ? arr[0] : null);
    return {
      ok: true,
      data: {
        fetchedForDate: todayLocalDateString(),
        sunrise: stringAt0(daily.sunrise),
        sunset: stringAt0(daily.sunset),
        tempMax: at0(daily.temperature_2m_max),
        tempMin: at0(daily.temperature_2m_min),
        tempUnit,
        humidityMean: at0(daily.relative_humidity_2m_mean),
        uvIndexMax: at0(daily.uv_index_max),
      },
    };
  } catch (error) {
    return { ok: false, ...classifyFetchError(error) };
  }
}

// Air quality/pollen is treated as a real, secondary layer on top of the
// core weather fetch above -- its own failure (or the honest absence of
// pollen data outside Europe) never blocks showing sunrise/sunset/UV, and
// isn't reported through the same 'error' state as a genuine weather-fetch
// failure. A missing AQI number reads the same honest way every other
// optional value in this app already does: absent, not shown, not guessed.
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
  | { status: 'error'; reason: SkyFetchFailureReason; message: string }
  | { status: 'ready'; data: HomeSkyData };

function failureMessage(reason: SkyFetchFailureReason, detail: string, lastKnownDate: string | null): string {
  let base: string;
  if (reason === 'offline') {
    base = "Couldn't reach the weather service. You may be offline.";
  } else if (reason === 'service-error') {
    base = `The weather service returned an error (${detail}).`;
  } else {
    base = "Got an unexpected response from the weather service.";
  }
  return lastKnownDate ? `${base} Last successful check was ${lastKnownDate}.` : base;
}

export async function getHomeSkyData(): Promise<HomeSkyResult> {
  const location = await resolveHomeLocation();
  if (!location) return { status: 'no-location' };

  const today = todayLocalDateString();
  const cached = await readAppMeta<HomeSkyData>(WEATHER_CACHE_KEY);
  if (cached && cached.fetchedForDate === today) {
    return { status: 'ready', data: cached };
  }

  const system = await getStoredMeasurementSystem();
  const tempUnit: 'F' | 'C' = system === 'metric' ? 'C' : 'F';

  const [weatherAttempt, airQuality] = await Promise.all([
    fetchWeather(location.lat, location.lon, tempUnit),
    fetchAirQuality(location.lat, location.lon),
  ]);

  if (!weatherAttempt.ok) {
    // Honest, not silent: names what actually went wrong, and -- only as an
    // explicitly-labeled note inside that same message, never as if it were
    // today's live reading -- when the last real successful check was.
    return {
      status: 'error',
      reason: weatherAttempt.reason,
      message: failureMessage(weatherAttempt.reason, weatherAttempt.detail, cached?.fetchedForDate ?? null),
    };
  }

  const fresh: HomeSkyData = {
    placeLabel: location.placeLabel,
    ...weatherAttempt.data,
    usAqi: airQuality.usAqi,
    pollen: airQuality.pollen,
  };
  await writeAppMeta(WEATHER_CACHE_KEY, fresh);
  return { status: 'ready', data: fresh };
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
