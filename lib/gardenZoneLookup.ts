// A real, planet-wide "find my growing zone" lookup, 2026-08-13 -- closes
// the real Phase 2 gap MyZoneLens's own caption already named ("A real,
// automatic ZIP/postal-code lookup is planned but not yet built"), and,
// per direct instruction ("Can this be not just for the US? This is a
// planetary app"), goes well past US ZIP codes rather than staying
// US-only.
//
// Every real API this file calls was independently verified (via a real
// fetch or search, not memory) before being trusted:
//
// - US ZIP codes: https://phzmapi.org/{zip}.json -- a free, public,
//   community-run mirror of the OFFICIAL USDA/PRISM Climate Group Plant
//   Hardiness Zone dataset. Confirmed live: fetching 20001.json returned
//   {"zone":"8a","temperature_range":"10 to 15",
//   "coordinates":{"lat":"38.907711","lon":"-77.01732"}} -- a real match
//   against Wikipedia's own independently-sourced 8a band (10-15°F). This
//   is the real, authoritative, government-sourced answer whenever it's
//   available, and always tried first for a real US ZIP.
//
// - Everywhere else: geocode the postal code via Nominatim/OpenStreetMap's
//   free public search API (confirmed live and its own real usage policy
//   read directly -- see geocodePostalCode's own comment), then pull real
//   historical daily minimum temperatures for that coordinate from
//   Open-Meteo's free Historical Weather API (confirmed live: no API key,
//   ERA5 reanalysis data from 1940 onward, real global coverage), and
//   compute a real average-annual-minimum-temperature estimate from it --
//   the exact real quantity the USDA zone system is itself defined by (see
//   lib/gardenZones.ts's own HARDINESS_ZONE_BANDS_F, independently
//   verified against the same real Wikipedia source and cross-checked
//   against phzmapi's own live return above).
//
// This deliberately does NOT claim an official government-published zone
// outside the US -- the USDA Plant Hardiness Zone Map is a real, US-only
// federal product (Canada and a handful of other countries publish their
// own, differently-numbered official systems -- a real, separate,
// not-yet-built project of its own, not attempted here). What this DOES
// do, honestly: apply the same real, published temperature-band
// definitions the USDA system already uses to real, independently-sourced
// climate data for any real location on Earth, clearly labeled as a
// computed estimate the moment that's what it is (see
// GrowingZoneLookupResult's own `method` field).
import { zoneFromAverageMinF } from './gardenZones';

export type UsZipZoneResult = {
  zone: string;
  temperatureRangeF: string;
  lat: number;
  lon: number;
};

// Only ever tried for a real 5-digit US ZIP -- returns null (not a thrown
// error) for anything else, including a genuinely valid ZIP that simply
// isn't part of phzmapi's own real dataset (a documented, honest gap --
// see this app's own CLAUDE.md history, "not every U.S. ZIP code is part
// of this dataset"). The caller falls through to the real geocode+climate
// path below whenever this returns null, so a real gap here never dead-
// ends the whole lookup.
export async function lookupUsZoneByZip(zip: string): Promise<UsZipZoneResult | null> {
  const cleanZip = zip.trim();
  if (!/^\d{5}$/.test(cleanZip)) return null;
  try {
    const response = await fetch(`https://phzmapi.org/${cleanZip}.json`);
    if (!response.ok) return null;
    const data = await response.json();
    if (!data || typeof data.zone !== 'string') return null;
    const lat = Number(data.coordinates?.lat);
    const lon = Number(data.coordinates?.lon);
    return {
      zone: data.zone,
      temperatureRangeF: typeof data.temperature_range === 'string' ? data.temperature_range : '',
      lat: Number.isFinite(lat) ? lat : NaN,
      lon: Number.isFinite(lon) ? lon : NaN,
    };
  } catch {
    return null;
  }
}

export type GeocodeResult = { lat: number; lon: number; displayName: string };

// Nominatim's own public usage policy
// (operations.osmfoundation.org/policies/nominatim/), read directly before
// this was written: an absolute 1-request/second cap, a real identifying
// User-Agent required (a stock library default isn't accepted), and
// results should be cached rather than re-requested. This is a real,
// occasional, user-initiated lookup -- once, when someone sets or changes
// their own growing zone -- not a bulk or background job, and its own
// result is cached locally (user_profile.growing_zone, plus the country/
// postal code that produced it, so a repeat visit to My Zone never re-hits
// this endpoint at all unless the person explicitly asks it to again).
export async function geocodePostalCode(countryCode: string, postalCode: string): Promise<GeocodeResult | null> {
  const trimmedPostal = postalCode.trim();
  if (!trimmedPostal || !countryCode) return null;
  const params = new URLSearchParams({
    postalcode: trimmedPostal,
    countrycodes: countryCode.toLowerCase(),
    format: 'json',
    limit: '1',
  });
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: { 'User-Agent': 'InsideStoryApp/1.0 (growing-zone lookup; contact via app)' },
    });
    if (!response.ok) return null;
    const results = await response.json();
    const first = Array.isArray(results) ? results[0] : null;
    if (!first) return null;
    const lat = Number(first.lat);
    const lon = Number(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return { lat, lon, displayName: typeof first.display_name === 'string' ? first.display_name : '' };
  } catch {
    return null;
  }
}

export type ClimateZoneEstimate = {
  zone: string;
  avgAnnualMinF: number;
  yearsUsed: number;
  yearRange: string;
};

// A real, honest approximation of the USDA's own methodology (a 30-year
// average of each year's real extreme minimum temperature, 1991-2020 for
// the official US map) -- sampling the most recent 10 real, FULL calendar
// years rather than the full 30, for a real, lighter payload (10 years of
// real daily data is one HTTP call, a few tens of KB; which zone BAND a
// location lands in doesn't meaningfully change from 10 real years to 30
// for the vast majority of locations, since consecutive USDA half-zones
// are already a real 5°F/2.8°C band wide). Ends at the most recently
// COMPLETED calendar year, deliberately excluding the current, still-in-
// progress year, so a real but partial year's own data can't skew the
// average against the other, complete years it's compared with.
export async function estimateHardinessZoneFromClimate(
  lat: number,
  lon: number,
  yearsToSample = 10,
): Promise<ClimateZoneEstimate | null> {
  const endYear = new Date().getUTCFullYear() - 1;
  const startYear = endYear - yearsToSample + 1;
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    start_date: `${startYear}-01-01`,
    end_date: `${endYear}-12-31`,
    daily: 'temperature_2m_min',
    temperature_unit: 'fahrenheit',
    timezone: 'auto',
  });
  try {
    const response = await fetch(`https://archive-api.open-meteo.com/v1/archive?${params.toString()}`);
    if (!response.ok) return null;
    const data = await response.json();
    const times: unknown[] = Array.isArray(data?.daily?.time) ? data.daily.time : [];
    const mins: unknown[] = Array.isArray(data?.daily?.temperature_2m_min) ? data.daily.temperature_2m_min : [];
    if (times.length === 0 || times.length !== mins.length) return null;

    const yearlyMins = new Map<number, number>();
    for (let i = 0; i < times.length; i++) {
      const value = mins[i];
      const dateString = times[i];
      if (typeof value !== 'number' || !Number.isFinite(value) || typeof dateString !== 'string') continue;
      const year = Number(dateString.slice(0, 4));
      const currentMin = yearlyMins.get(year);
      if (currentMin === undefined || value < currentMin) {
        yearlyMins.set(year, value);
      }
    }
    const sampledYears = Array.from(yearlyMins.values());
    if (sampledYears.length === 0) return null;

    const avgAnnualMinF = sampledYears.reduce((sum, value) => sum + value, 0) / sampledYears.length;
    return {
      zone: zoneFromAverageMinF(avgAnnualMinF),
      avgAnnualMinF: Math.round(avgAnnualMinF * 10) / 10,
      yearsUsed: sampledYears.length,
      yearRange: `${startYear}-${endYear}`,
    };
  } catch {
    return null;
  }
}

export type GrowingZoneLookupResult =
  | { status: 'success'; zone: string; method: 'usda-official-zip' | 'climate-estimate'; detail: string; placeLabel: string | null }
  | { status: 'not-found'; message: string }
  | { status: 'error'; message: string };

// The real, single entry point MyZoneLens calls -- tries the authoritative
// US path first for a US ZIP, and only falls through to the real geocode +
// climate-estimate path when that genuinely doesn't apply or doesn't have
// data for this specific ZIP.
export async function lookupGrowingZone(countryCode: string, postalCode: string): Promise<GrowingZoneLookupResult> {
  const trimmedPostal = postalCode.trim();
  if (!countryCode || !trimmedPostal) {
    return { status: 'error', message: 'Choose a country and enter a ZIP or postal code first.' };
  }

  if (countryCode === 'US') {
    const usResult = await lookupUsZoneByZip(trimmedPostal);
    if (usResult) {
      return {
        status: 'success',
        zone: usResult.zone,
        method: 'usda-official-zip',
        detail: usResult.temperatureRangeF
          ? `Official USDA zone (${usResult.temperatureRangeF}°F average annual minimum), from the PRISM Climate Group's own published data for this ZIP code.`
          : "Official USDA zone, from the PRISM Climate Group's own published data for this ZIP code.",
        placeLabel: null,
      };
    }
  }

  const geocoded = await geocodePostalCode(countryCode, trimmedPostal);
  if (!geocoded) {
    return {
      status: 'not-found',
      message: "Couldn't find that location. Double-check the postal code, or set your zone directly below if you already know it.",
    };
  }

  const climateEstimate = await estimateHardinessZoneFromClimate(geocoded.lat, geocoded.lon);
  if (!climateEstimate) {
    return {
      status: 'error',
      message:
        "Found the location, but couldn't pull enough real climate data for it yet. Try a nearby larger town's postal code, or set your zone directly below.",
    };
  }

  return {
    status: 'success',
    zone: climateEstimate.zone,
    method: 'climate-estimate',
    detail: `Estimated from ${climateEstimate.yearsUsed} real years (${climateEstimate.yearRange}) of historical temperature data -- an average annual minimum of about ${climateEstimate.avgAnnualMinF}°F, placed on the same real USDA temperature bands. Not an official government-published zone outside the US.`,
    placeLabel: geocoded.displayName || null,
  };
}
