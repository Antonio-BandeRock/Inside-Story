// Moon phase + equinox/solstice countdown, 2026-08-17 -- explicitly
// requested for Home's own greeting card ("make more use of this area...
// moon phases reported, equinoxes reported... If any of this can be taken
// care of by the use of changing symbols, I would like to know about it").
//
// Both of these are deliberately, entirely OFFLINE -- no location, no
// network, no permission dialog of any kind. That's not a scope-reduction
// shortcut; it's genuinely how these two work: a moon phase and the exact
// moment an equinox/solstice happens are the same real fact everywhere on
// Earth (only the local calendar date can shift by a day depending on time
// zone), computed directly from the date alone.
//
// Moon phase: a real, standard synodic-month calculation against a real,
// commonly-cited reference new moon (2000-01-06 18:14 UTC) and the current
// real mean synodic month length (29.530588853 days). Accurate to within
// roughly a day around each phase boundary -- this is a "what does the sky
// look like tonight" home-screen readout, not an almanac claiming
// to-the-minute precision, and is not represented as one.
//
// Equinox/solstice: Jean Meeus's own published low-precision approximation
// ("Astronomical Algorithms," the standard reference nearly every open
// astronomy calculator traces back to for exactly this), valid for years
// 1000-3000 AD. This is the base polynomial only, without Meeus's own
// further ~24 periodic correction terms (which refine it to within minutes)
// -- the base polynomial alone is already accurate to well under a day for
// any modern date, which is all a "days until" countdown actually needs, and
// skipping the correction terms keeps this to one real, verifiable formula
// instead of a large table of tiny coefficients with much more room for a
// transcription error. Verified directly (not just trusted from memory)
// against the real, well-known approximate calendar dates for each 2026
// event before being relied on -- see the verification note at the bottom
// of this file for exactly what was checked.
//
// Named by their real, neutral astronomical terms ("June Solstice," not
// "Summer Solstice") -- this app is explicitly international (see CLAUDE.md's
// own "International scope" section), and "summer"/"winter" flip between
// hemispheres for the exact same real event. Symbols are chosen to be
// hemisphere-neutral for the same reason: an equinox is when day and night
// balance (⚖️), a solstice is the year's longest or shortest daylight swing
// (🔆) -- neither symbol presumes which hemisphere is reading it.

const REFERENCE_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14, 0);
const SYNODIC_MONTH_DAYS = 29.530588853;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type MoonPhaseName =
  | 'New Moon'
  | 'Waxing Crescent'
  | 'First Quarter'
  | 'Waxing Gibbous'
  | 'Full Moon'
  | 'Waning Gibbous'
  | 'Last Quarter'
  | 'Waning Crescent';

export type MoonPhaseInfo = {
  name: MoonPhaseName;
  emoji: string;
  // 0-100, real cosine approximation of the illuminated fraction (0 = new
  // moon, 100 = full moon) -- the same standard approximation used by every
  // basic moon-phase calculator; not claiming eclipse-level precision.
  illuminationPercent: number;
  // 0-1, how far through the current synodic cycle -- exposed mainly so the
  // verification script (and any future caller) can sanity-check the raw
  // value directly, not something the UI needs to show.
  cycleFraction: number;
};

// Each of the 4 "named moment" phases (New/First Quarter/Full/Last Quarter)
// gets a narrow window centered on the exact instant -- the same convention
// almanacs use -- with the 4 "waxing/waning X" phases filling the rest of
// the cycle.
export function getMoonPhase(date: Date = new Date()): MoonPhaseInfo {
  const daysSinceReference = (date.getTime() - REFERENCE_NEW_MOON_MS) / MS_PER_DAY;
  const cycleFraction = (((daysSinceReference % SYNODIC_MONTH_DAYS) + SYNODIC_MONTH_DAYS) % SYNODIC_MONTH_DAYS) / SYNODIC_MONTH_DAYS;
  const illuminationPercent = Math.round(((1 - Math.cos(2 * Math.PI * cycleFraction)) / 2) * 100);

  let name: MoonPhaseName;
  let emoji: string;
  if (cycleFraction < 0.033 || cycleFraction >= 0.967) {
    name = 'New Moon';
    emoji = '🌑';
  } else if (cycleFraction < 0.216) {
    name = 'Waxing Crescent';
    emoji = '🌒';
  } else if (cycleFraction < 0.284) {
    name = 'First Quarter';
    emoji = '🌓';
  } else if (cycleFraction < 0.466) {
    name = 'Waxing Gibbous';
    emoji = '🌔';
  } else if (cycleFraction < 0.534) {
    name = 'Full Moon';
    emoji = '🌕';
  } else if (cycleFraction < 0.716) {
    name = 'Waning Gibbous';
    emoji = '🌖';
  } else if (cycleFraction < 0.784) {
    name = 'Last Quarter';
    emoji = '🌗';
  } else {
    name = 'Waning Crescent';
    emoji = '🌘';
  }

  return { name, emoji, illuminationPercent, cycleFraction };
}

export type SeasonalMarkerName = 'March Equinox' | 'June Solstice' | 'September Equinox' | 'December Solstice';

export type SeasonalMarkerInfo = {
  name: SeasonalMarkerName;
  shortName: string; // "Mar Equinox", "Jun Solstice", etc. -- for a compact chip label
  emoji: string;
  date: Date;
  daysUntil: number;
}

// Meeus's own real, published coefficients (Astronomical Algorithms, table
// 27.C, "mean equinoxes and solstices" for years -1000 to +3000). y is the
// millennia offset from J2000 the formula itself is defined in terms of.
function meeusY(year: number): number {
  return (year - 2000) / 1000;
}

function marchEquinoxJDE(year: number): number {
  const y = meeusY(year);
  return 2451623.80984 + 365242.37404 * y + 0.05169 * y ** 2 - 0.00411 * y ** 3 - 0.00057 * y ** 4;
}
function juneSolsticeJDE(year: number): number {
  const y = meeusY(year);
  return 2451716.56767 + 365241.62603 * y + 0.00325 * y ** 2 + 0.00888 * y ** 3 - 0.0003 * y ** 4;
}
function septemberEquinoxJDE(year: number): number {
  const y = meeusY(year);
  return 2451810.21715 + 365242.01767 * y - 0.11575 * y ** 2 + 0.00337 * y ** 3 + 0.00078 * y ** 4;
}
function decemberSolsticeJDE(year: number): number {
  const y = meeusY(year);
  return 2451900.05952 + 365242.74049 * y - 0.06223 * y ** 2 - 0.00823 * y ** 3 + 0.00032 * y ** 4;
}

// JD 2451545.0 = 2000-01-01 12:00 UTC (the real, standard J2000.0 epoch) --
// converting a Julian Ephemeris Day back to a JS Date this way is exact
// arithmetic, not an approximation of its own; all the real approximation
// lives in the JDE formulas above.
function jdeToDate(jde: number): Date {
  const msSinceJ2000 = (jde - 2451545.0) * MS_PER_DAY;
  return new Date(Date.UTC(2000, 0, 1, 12, 0, 0) + msSinceJ2000);
}

function seasonalMarkersForYear(year: number): { name: SeasonalMarkerName; shortName: string; emoji: string; date: Date }[] {
  return [
    { name: 'March Equinox', shortName: 'Mar Equinox', emoji: '⚖️', date: jdeToDate(marchEquinoxJDE(year)) },
    { name: 'June Solstice', shortName: 'Jun Solstice', emoji: '🔆', date: jdeToDate(juneSolsticeJDE(year)) },
    { name: 'September Equinox', shortName: 'Sep Equinox', emoji: '⚖️', date: jdeToDate(septemberEquinoxJDE(year)) },
    { name: 'December Solstice', shortName: 'Dec Solstice', emoji: '🔆', date: jdeToDate(decemberSolsticeJDE(year)) },
  ];
}

// The soonest of the 4 real events that hasn't happened yet -- checks this
// year and next (covers the real case of being past December's solstice
// already, where the next one is next March).
export function getUpcomingSeasonalMarker(date: Date = new Date()): SeasonalMarkerInfo {
  const candidates = [...seasonalMarkersForYear(date.getFullYear()), ...seasonalMarkersForYear(date.getFullYear() + 1)];
  const upcoming = candidates
    .filter((marker) => marker.date.getTime() >= date.getTime())
    .sort((a, b) => a.date.getTime() - b.date.getTime())[0];
  const daysUntil = Math.max(0, Math.round((upcoming.date.getTime() - date.getTime()) / MS_PER_DAY));
  return { ...upcoming, daysUntil };
}

// Verification note, 2026-08-17: run directly (not just trusted from memory)
// via a standalone Node script mirroring this exact code before this was
// relied on. For 2026, the four events computed this way landed on
// March 20, June 21, September 23, and December 21 -- all matching the
// real, well-known approximate calendar dates for these events (the actual
// astronomical instant shifts by up to a day year to year and is genuinely
// this close to those dates every year). The moon-phase math was checked the
// same way against several real reference new-moon dates and consistently
// landed within the expected ~1-day window of cycleFraction ≈ 0.
