// The moon and the sun as a gardener's calendar (I5, 1.0.55.20). Direct
// request: "let's include things the Amish and others do using moon phases,
// equinox, and solstice as timing." This module works out the sky those
// traditions read, and lib/sowingTraditions.ts says what each tradition does
// with it and what the evidence says.
//
// Everything is worked out on the phone from the time alone, with no network:
//   - the moon's phase, how much of it is lit, and when the next new, first
//     quarter, full and last quarter moons fall;
//   - the sign of the zodiac the moon is passing through, in the tropical
//     zodiac the planting almanacs use (the Old Farmer's Almanac, and the
//     Pennsylvania German almanacs the Amish keep);
//   - the equinoxes and solstices, and the 24 solar terms of the Chinese and
//     Japanese farming calendar, which are the sun's path cut into 15° steps;
//   - Good Friday, which moves with the first full moon after the March
//     equinox and is the day a long tradition plants potatoes.
//
// The positions come from the low-precision series in Jean Meeus,
// Astronomical Algorithms (2nd ed., 1998), chapters 25 and 47, which put the
// moon within a fraction of a degree. A phase or an equinox found from them
// lands within about an hour of the published time, which is well inside a
// planting day. scripts/test_moon_sky.js checks them against published times.
//
// Pure, with no fetch and no database.

const DAY_MS = 86400000;
const J2000 = 2451545.0;
const RAD = Math.PI / 180;

export function julianDay(ms: number): number {
  return ms / DAY_MS + 2440587.5;
}

function norm360(deg: number): number {
  const r = deg % 360;
  return r < 0 ? r + 360 : r;
}

function sin(deg: number): number {
  return Math.sin(deg * RAD);
}

/** The sun's apparent longitude along the ecliptic, in degrees. */
export function sunLongitude(ms: number): number {
  const T = (julianDay(ms) - J2000) / 36525;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * sin(M) + (0.019993 - 0.000101 * T) * sin(2 * M) + 0.000289 * sin(3 * M);
  const omega = 125.04 - 1934.136 * T;
  return norm360(L0 + C - 0.00569 - 0.00478 * sin(omega));
}

/** The moon's apparent longitude along the ecliptic, in degrees. */
export function moonLongitude(ms: number): number {
  const T = (julianDay(ms) - J2000) / 36525;
  const Lp = 218.3164477 + 481267.88123421 * T;
  const D = 297.8501921 + 445267.1114034 * T;
  const M = 357.5291092 + 35999.0502909 * T;
  const Mp = 134.9633964 + 477198.8675055 * T;
  const F = 93.272095 + 483202.0175233 * T;
  const omega = 125.04 - 1934.136 * T;
  const lon =
    Lp +
    6.288774 * sin(Mp) +
    1.274027 * sin(2 * D - Mp) +
    0.658314 * sin(2 * D) +
    0.213618 * sin(2 * Mp) -
    0.185116 * sin(M) -
    0.114332 * sin(2 * F) +
    0.058793 * sin(2 * D - 2 * Mp) +
    0.057066 * sin(2 * D - M - Mp) +
    0.053322 * sin(2 * D + Mp) +
    0.045758 * sin(2 * D - M) -
    0.040923 * sin(M - Mp) -
    0.03472 * sin(D) -
    0.030383 * sin(M + Mp) +
    0.015327 * sin(2 * D - 2 * F) -
    0.012528 * sin(Mp + 2 * F) +
    0.01098 * sin(Mp - 2 * F) +
    0.010675 * sin(4 * D - Mp) +
    0.010034 * sin(3 * Mp) +
    0.008548 * sin(4 * D - 2 * Mp) -
    0.007888 * sin(2 * D + M - Mp) -
    0.006766 * sin(2 * D + M) -
    0.005163 * sin(D - Mp) +
    0.004987 * sin(D + M) +
    0.004036 * sin(2 * D - M + Mp);
  return norm360(lon - 0.00478 * sin(omega));
}

/** How far the moon is ahead of the sun: 0 new, 90 first quarter, 180
 *  full, 270 last quarter. */
export function moonElongation(ms: number): number {
  return norm360(moonLongitude(ms) - sunLongitude(ms));
}

export function moonIllumination(ms: number): number {
  return (1 - Math.cos(moonElongation(ms) * RAD)) / 2;
}

export type MoonPhaseKey = 'new' | 'firstQuarter' | 'full' | 'lastQuarter';

export const MOON_PHASE_NAMES: Record<MoonPhaseKey, string> = {
  new: 'New moon',
  firstQuarter: 'First quarter',
  full: 'Full moon',
  lastQuarter: 'Last quarter',
};

const PHASE_ANGLE: Record<MoonPhaseKey, number> = { new: 0, firstQuarter: 90, full: 180, lastQuarter: 270 };
const PHASE_ORDER: MoonPhaseKey[] = ['new', 'firstQuarter', 'full', 'lastQuarter'];

/** 1 to 4: the quarter of the month the moon is in, counted from new. */
export function moonQuarter(ms: number): 1 | 2 | 3 | 4 {
  return (Math.floor(moonElongation(ms) / 90) + 1) as 1 | 2 | 3 | 4;
}

export function isWaxing(ms: number): boolean {
  return moonElongation(ms) < 180;
}

/** The name for the moon as it is now, the way an almanac says it. */
export function moonPhaseName(ms: number): string {
  const e = moonElongation(ms);
  if (e < 6 || e >= 354) return 'New moon';
  if (e < 84) return 'Waxing crescent';
  if (e < 96) return 'First quarter';
  if (e < 174) return 'Waxing gibbous';
  if (e < 186) return 'Full moon';
  if (e < 264) return 'Waning gibbous';
  if (e < 276) return 'Last quarter';
  return 'Waning crescent';
}

// The angle between a body and a target, wrapped to -180..180, so a search
// can tell before from after.
function angleFrom(value: number, target: number): number {
  let d = (value - target) % 360;
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return d;
}

// Finds the moment after `fromMs` when `fn` reaches `target`, for a quantity
// that only ever increases (an elongation, a longitude), stepping by `stepMs`
// to bracket it and halving the bracket to about a minute.
function nextCrossing(fn: (ms: number) => number, target: number, fromMs: number, stepMs: number, limitMs: number): number | null {
  let a = fromMs;
  let fa = angleFrom(fn(a), target);
  for (let b = a + stepMs; b <= fromMs + limitMs; b += stepMs) {
    const fb = angleFrom(fn(b), target);
    if (fa < 0 && fb >= 0 && fb - fa < 180) {
      let lo = a;
      let hi = b;
      while (hi - lo > 60000) {
        const mid = (lo + hi) / 2;
        if (angleFrom(fn(mid), target) < 0) lo = mid;
        else hi = mid;
      }
      return (lo + hi) / 2;
    }
    a = b;
    fa = fb;
  }
  return null;
}

export type MoonEvent = { phase: MoonPhaseKey; at: number };

/** The next moment the moon reaches a phase, after `fromMs`. */
export function nextMoonPhase(phase: MoonPhaseKey, fromMs: number): number {
  return nextCrossing(moonElongation, PHASE_ANGLE[phase], fromMs, 6 * 3600000, 32 * DAY_MS) as number;
}

/** Every principal phase from `fromMs` to `untilMs`, in order. */
export function moonPhasesBetween(fromMs: number, untilMs: number): MoonEvent[] {
  const events: MoonEvent[] = [];
  let cursor = fromMs;
  let index = (moonQuarter(fromMs) % 4) as number;
  while (cursor < untilMs) {
    const phase = PHASE_ORDER[index];
    const at = nextMoonPhase(phase, cursor);
    if (at > untilMs) break;
    events.push({ phase, at });
    cursor = at + 3600000;
    index = (index + 1) % 4;
  }
  return events;
}

// ---------------------------------------------------------------------------
// The zodiac the almanacs read
// ---------------------------------------------------------------------------

export type ZodiacSign =
  | 'Aries'
  | 'Taurus'
  | 'Gemini'
  | 'Cancer'
  | 'Leo'
  | 'Virgo'
  | 'Libra'
  | 'Scorpio'
  | 'Sagittarius'
  | 'Capricorn'
  | 'Aquarius'
  | 'Pisces';

export const ZODIAC_SIGNS: ZodiacSign[] = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
];

/** The tropical sign: 30° steps counted from the March equinox point. */
export function moonSign(ms: number): ZodiacSign {
  return ZODIAC_SIGNS[Math.floor(moonLongitude(ms) / 30) % 12];
}

// How the planting almanacs class each sign. The water signs are the most
// fruitful, the earth signs Taurus and Capricorn productive, Libra
// semi-fruitful, and the fire and air signs with Virgo barren, kept for
// weeding, clearing and harvest. This is what the tradition holds, not a
// finding; lib/sowingTraditions.ts carries the evidence line.
export type SignClass = 'fruitful' | 'semiFruitful' | 'barren';

export const SIGN_CLASS: Record<ZodiacSign, SignClass> = {
  Aries: 'barren',
  Taurus: 'fruitful',
  Gemini: 'barren',
  Cancer: 'fruitful',
  Leo: 'barren',
  Virgo: 'barren',
  Libra: 'semiFruitful',
  Scorpio: 'fruitful',
  Sagittarius: 'barren',
  Capricorn: 'fruitful',
  Aquarius: 'barren',
  Pisces: 'fruitful',
};

// The biodynamic calendar reads the same idea through the constellations as
// they stand in the sky now (the sidereal zodiac), about 24° behind the
// tropical signs, and groups them by element: earth for roots, water for
// leaves, air for flowers, fire for fruit and seed. The two calendars
// therefore disagree about the sign on most days, which is said on screen
// rather than silently picking one.
export const SIGN_ELEMENT: Record<ZodiacSign, 'earth' | 'water' | 'air' | 'fire'> = {
  Aries: 'fire',
  Taurus: 'earth',
  Gemini: 'air',
  Cancer: 'water',
  Leo: 'fire',
  Virgo: 'earth',
  Libra: 'air',
  Scorpio: 'water',
  Sagittarius: 'fire',
  Capricorn: 'earth',
  Aquarius: 'air',
  Pisces: 'water',
};

export type SignSpan = { sign: ZodiacSign; from: number; until: number };

/** The signs the moon passes through between two moments, each with when it
 *  enters and leaves. The moon spends about two and a half days in each. */
export function moonSignSpans(fromMs: number, untilMs: number): SignSpan[] {
  const spans: SignSpan[] = [];
  let start = fromMs;
  let sign = moonSign(fromMs);
  while (start < untilMs) {
    const index = ZODIAC_SIGNS.indexOf(sign);
    const boundary = ((index + 1) % 12) * 30;
    const next = nextCrossing(moonLongitude, boundary, start, 3 * 3600000, 4 * DAY_MS) ?? untilMs;
    spans.push({ sign, from: start, until: Math.min(next, untilMs) });
    start = next;
    sign = ZODIAC_SIGNS[(index + 1) % 12];
  }
  return spans;
}

// ---------------------------------------------------------------------------
// The sun: equinoxes, solstices and the solar terms
// ---------------------------------------------------------------------------

/** The moment in a calendar year the sun reaches a longitude. */
export function sunReaches(longitude: number, year: number): number {
  // The sun moves about a degree a day and passes 0° near 20 March, so the
  // search starts two weeks before the rough date.
  const approxDays = ((longitude - 0 + 360) % 360) * (365.2422 / 360) + 79;
  const start = Date.UTC(year, 0, 1) + (approxDays - 14) * DAY_MS;
  return nextCrossing(sunLongitude, longitude, start, DAY_MS, 30 * DAY_MS) as number;
}

export type SeasonMarkerKey = 'marchEquinox' | 'juneSolstice' | 'septemberEquinox' | 'decemberSolstice';

export type SeasonMarker = { key: SeasonMarkerKey; at: number; name: string; note: string };

/** The equinoxes and solstices of a year, named for the hemisphere: the June
 *  solstice is the longest day north of the equator and the shortest south
 *  of it. */
export function seasonMarkers(year: number, southern: boolean): SeasonMarker[] {
  const spring = southern ? 'Autumn' : 'Spring';
  const autumn = southern ? 'Spring' : 'Autumn';
  return [
    { key: 'marchEquinox', at: sunReaches(0, year), name: 'March equinox', note: `${spring} equinox: day and night about equal.` },
    {
      key: 'juneSolstice',
      at: sunReaches(90, year),
      name: 'June solstice',
      note: southern ? 'The shortest day of the year here.' : 'The longest day of the year here.',
    },
    { key: 'septemberEquinox', at: sunReaches(180, year), name: 'September equinox', note: `${autumn} equinox: day and night about equal.` },
    {
      key: 'decemberSolstice',
      at: sunReaches(270, year),
      name: 'December solstice',
      note: southern ? 'The longest day of the year here.' : 'The shortest day of the year here.',
    },
  ];
}

// The 24 solar terms (二十四节气, jiéqì; in Japan, nijūshi sekki), inscribed
// by UNESCO in 2016 as intangible cultural heritage. Each begins when the
// sun reaches a multiple of 15°, starting from Spring Equinox at 0°. Their
// names describe the weather and farm work of the middle Yellow River
// valley, where they were set down; elsewhere the dates keep their place in
// the sun's year and the weather they name may not match.
export type SolarTerm = { longitude: number; name: string; chinese: string; meaning: string };

export const SOLAR_TERMS: SolarTerm[] = [
  { longitude: 315, name: 'Start of Spring', chinese: 'Lìchūn 立春', meaning: 'The traditional start of the farming year.' },
  { longitude: 330, name: 'Rain Water', chinese: 'Yǔshuǐ 雨水', meaning: 'Snow gives way to rain.' },
  { longitude: 345, name: 'Awakening of Insects', chinese: 'Jīngzhé 惊蛰', meaning: 'Thunder wakes what wintered in the soil; spring ploughing begins.' },
  { longitude: 0, name: 'Spring Equinox', chinese: 'Chūnfēn 春分', meaning: 'Day and night equal.' },
  { longitude: 15, name: 'Pure Brightness', chinese: 'Qīngmíng 清明', meaning: 'Clear, mild days; a time for sowing and for tending family graves.' },
  { longitude: 30, name: 'Grain Rain', chinese: 'Gǔyǔ 谷雨', meaning: 'Rain that brings on the sown grain.' },
  { longitude: 45, name: 'Start of Summer', chinese: 'Lìxià 立夏', meaning: 'Crops grow fast.' },
  { longitude: 60, name: 'Grain Buds', chinese: 'Xiǎomǎn 小满', meaning: 'Grain begins to fill.' },
  { longitude: 75, name: 'Grain in Ear', chinese: 'Mángzhǒng 芒种', meaning: 'Wheat harvested and rice planted.' },
  { longitude: 90, name: 'Summer Solstice', chinese: 'Xiàzhì 夏至', meaning: 'The longest day north of the equator.' },
  { longitude: 105, name: 'Minor Heat', chinese: 'Xiǎoshǔ 小暑', meaning: 'The heat builds.' },
  { longitude: 120, name: 'Major Heat', chinese: 'Dàshǔ 大暑', meaning: 'The hottest stretch of the year.' },
  { longitude: 135, name: 'Start of Autumn', chinese: 'Lìqiū 立秋', meaning: 'The turn toward harvest.' },
  { longitude: 150, name: 'End of Heat', chinese: 'Chǔshǔ 处暑', meaning: 'The heat eases.' },
  { longitude: 165, name: 'White Dew', chinese: 'Báilù 白露', meaning: 'Dew forms on cool nights.' },
  { longitude: 180, name: 'Autumn Equinox', chinese: 'Qiūfēn 秋分', meaning: 'Day and night equal again.' },
  { longitude: 195, name: 'Cold Dew', chinese: 'Hánlù 寒露', meaning: 'Cold dew; the late harvest.' },
  { longitude: 210, name: 'Frost Descent', chinese: 'Shuāngjiàng 霜降', meaning: 'The first frosts.' },
  { longitude: 225, name: 'Start of Winter', chinese: 'Lìdōng 立冬', meaning: 'Crops stored for winter.' },
  { longitude: 240, name: 'Minor Snow', chinese: 'Xiǎoxuě 小雪', meaning: 'The first light snow.' },
  { longitude: 255, name: 'Major Snow', chinese: 'Dàxuě 大雪', meaning: 'Heavier snow.' },
  { longitude: 270, name: 'Winter Solstice', chinese: 'Dōngzhì 冬至', meaning: 'The shortest day north of the equator.' },
  { longitude: 285, name: 'Minor Cold', chinese: 'Xiǎohán 小寒', meaning: 'The cold deepens.' },
  { longitude: 300, name: 'Major Cold', chinese: 'Dàhán 大寒', meaning: 'The coldest stretch of the year.' },
];

export type SolarTermEvent = SolarTerm & { at: number };

/** The solar term the sun is in now, and the next one to begin. */
export function solarTermNow(ms: number): { current: SolarTermEvent; next: SolarTermEvent } {
  const lon = sunLongitude(ms);
  const step = Math.floor(lon / 15) * 15;
  const current = SOLAR_TERMS.find((t) => t.longitude === step) as SolarTerm;
  const nextLon = (step + 15) % 360;
  const nextTerm = SOLAR_TERMS.find((t) => t.longitude === nextLon) as SolarTerm;
  const nextAt = nextCrossing(sunLongitude, nextLon, ms, DAY_MS, 20 * DAY_MS) as number;
  // The current term began when the sun reached its longitude, within the
  // last 16 days or so.
  const began = nextCrossing(sunLongitude, step, ms - 18 * DAY_MS, DAY_MS, 18 * DAY_MS) ?? ms;
  return { current: { ...current, at: began }, next: { ...nextTerm, at: nextAt } };
}

// ---------------------------------------------------------------------------
// Good Friday
// ---------------------------------------------------------------------------

/** Western Easter Sunday, by the Anonymous Gregorian algorithm (Meeus,
 *  chapter 8). It falls on the first Sunday after the ecclesiastical full
 *  moon on or after 21 March, which is why the potato tradition tied to
 *  Good Friday follows the moon and the equinox together. */
export function easterSunday(year: number): string {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function goodFriday(year: number): string {
  const [y, m, d] = easterSunday(year).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d) - 2 * DAY_MS).toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Local dates, for the screen
// ---------------------------------------------------------------------------

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** A moment as the local day it falls on: "Thursday, October 2". */
export function localDayLabel(ms: number): string {
  const d = new Date(ms);
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** A moment as a local YYYY-MM-DD. */
export function localDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** A YYYY-MM-DD read as "October 2". */
export function dateLabel(date: string): string {
  const [, m, d] = date.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}`;
}
