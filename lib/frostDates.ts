// Last and first frost dates (I4, 1.0.55.19). A gardener plans the year
// around two dates: the last frost of spring, after which tender plants can
// go out, and the first frost of autumn, which ends their season. They are
// worked out here from the same Open-Meteo history the zone lookup already
// reads (lib/gardenZoneLookup.ts): the lowest air temperature of every day
// for the last 30 complete years at the place saved in My Zone.
//
// How the figures are made, following the way national weather services
// publish them (NOAA's freeze and frost tables give the 90%, 50% and 10%
// dates for 32°F and 28°F):
//   - A frost night is a day whose lowest temperature is at or below 0°C
//     (32°F). A hard freeze is at or below -2.2°C (28°F), cold enough to
//     kill most tender plants outright.
//   - The year is split at the height of summer (1 July north of the
//     equator, 1 January south of it), so a winter is never cut in two. The
//     last frost of a season is the last frost night before that point, and
//     the first frost is the first one after it.
//   - "Half the years" is the middle of the 30 dates. "9 in 10" is the date
//     only three of the 30 years went past: for the last frost that is the
//     later date, for the first frost the earlier one. A year with no frost
//     at all counts as having had none, which is how a warm place ends up
//     with no date.
//
// Two honest limits, said on screen: the figures are for the air two metres
// up over a large grid cell, so a low spot, a frost pocket or a clear still
// night can frost a plant when the air reads a degree or two above
// freezing; and the past 30 years are a guide to a coming spring, not a
// forecast of it. Nothing here says when to plant anything: the sowing
// calendar (I5) builds on these dates.
//
// Pure, with no fetch and no database, so scripts/test_frost_dates.js
// checks it without a network.

export const FROST_C = 0;
export const HARD_FREEZE_C = -2.2;
export const FROST_YEARS = 30;

export type DailyMinimum = { date: string; minC: number | null };

export type FrostThreshold = 'frost' | 'hardFreeze';

export type FrostSide = {
  /** Days from the height of summer; negative for a last frost. null when
   *  frost came in too few years to give the date. */
  half: number | null;
  nineInTen: number | null;
  /** The furthest from summer any year went: latest last frost, earliest
   *  first frost. null when no year had one. */
  extreme: number | null;
  extremeYear: number | null;
  /** How many of the seasons had one on this side at all. */
  years: number;
};

export type FrostSummary = {
  threshold: FrostThreshold;
  southern: boolean;
  seasons: number;
  seasonsWithFrost: number;
  firstYear: number;
  lastYear: number;
  last: FrostSide;
  first: FrostSide;
  /** Typical days between the last and first frost, in half the years. */
  frostFreeDays: number | null;
};

const DAY_MS = 86400000;

function seasonMidpoint(year: number, southern: boolean): number {
  return southern ? Date.UTC(year, 0, 1) : Date.UTC(year, 6, 1);
}

function dayOffset(date: string, midpoint: number): number {
  const [y, m, d] = date.split('-').map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - midpoint) / DAY_MS);
}

type Season = { year: number; last: number | null; first: number | null };

/** One season per complete summer: the last frost before its midpoint and
 *  the first after, each within half a year of it. */
export function frostSeasons(days: readonly DailyMinimum[], southern: boolean, thresholdC: number): Season[] {
  const valid = days
    .filter((day) => typeof day.minC === 'number' && Number.isFinite(day.minC) && /^\d{4}-\d{2}-\d{2}$/.test(day.date))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  if (valid.length === 0) return [];
  const years = valid.map((day) => Number(day.date.slice(0, 4)));
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  const seasons: Season[] = [];
  for (let year = minYear; year <= maxYear; year++) {
    const midpoint = seasonMidpoint(year, southern);
    // A season is the calendar year north of the equator and July to June
    // south of it, and needs most of its days: a year cut off by where the
    // data starts or ends is left out rather than read as frost-free.
    const start = southern ? `${year - 1}-07-01` : `${year}-01-01`;
    const end = southern ? `${year}-07-01` : `${year + 1}-01-01`;
    const inRange = valid.filter((day) => day.date >= start && day.date < end);
    if (inRange.length < 300) continue;
    let last: number | null = null;
    let first: number | null = null;
    for (const day of inRange) {
      if ((day.minC as number) > thresholdC) continue;
      const offset = dayOffset(day.date, midpoint);
      if (offset < 0) last = last === null ? offset : Math.max(last, offset);
      else first = first === null ? offset : Math.min(first, offset);
    }
    seasons.push({ year, last, first });
  }
  return seasons;
}

// The value at a share of the way through a sorted list, taking the nearer
// rank: with 30 years, 0.9 is the 27th, so three years went past it.
function atShare(sorted: readonly number[], share: number): number {
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(share * sorted.length) - 1));
  return sorted[index];
}

function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

export function summarizeFrost(days: readonly DailyMinimum[], southern: boolean, threshold: FrostThreshold): FrostSummary | null {
  const seasons = frostSeasons(days, southern, threshold === 'frost' ? FROST_C : HARD_FREEZE_C);
  if (seasons.length === 0) return null;
  const n = seasons.length;
  // A season with no last frost sorts earliest; with no first frost, latest.
  const lasts = seasons.map((s) => (s.last === null ? Number.NEGATIVE_INFINITY : s.last)).sort((a, b) => a - b);
  const firsts = seasons.map((s) => (s.first === null ? Number.POSITIVE_INFINITY : s.first)).sort((a, b) => a - b);
  const finite = (value: number) => (Number.isFinite(value) ? value : null);

  const withLast = seasons.filter((s) => s.last !== null);
  const withFirst = seasons.filter((s) => s.first !== null);
  const latestLast = withLast.reduce<Season | null>((best, s) => (best === null || (s.last as number) > (best.last as number) ? s : best), null);
  const earliestFirst = withFirst.reduce<Season | null>((best, s) => (best === null || (s.first as number) < (best.first as number) ? s : best), null);

  return {
    threshold,
    southern,
    seasons: n,
    seasonsWithFrost: seasons.filter((s) => s.last !== null || s.first !== null).length,
    firstYear: seasons[0].year,
    lastYear: seasons[n - 1].year,
    last: {
      half: finite(atShare(lasts, 0.5)),
      nineInTen: finite(atShare(lasts, 0.9)),
      extreme: latestLast ? (latestLast.last as number) : null,
      extremeYear: latestLast ? latestLast.year : null,
      years: withLast.length,
    },
    first: {
      half: finite(atShare(firsts, 0.5)),
      nineInTen: finite(atShare(firsts, 0.1)),
      extreme: earliestFirst ? (earliestFirst.first as number) : null,
      extremeYear: earliestFirst ? earliestFirst.year : null,
      years: withFirst.length,
    },
    frostFreeDays: median(seasons.filter((s) => s.last !== null && s.first !== null).map((s) => (s.first as number) - (s.last as number))),
  };
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** A day offset from the height of summer, written as a month and day. */
export function frostDateLabel(offset: number, southern: boolean): string {
  // 2001 is not a leap year, and a midpoint in it keeps February at 28.
  const date = new Date((southern ? Date.UTC(2001, 0, 1) : Date.UTC(2001, 6, 1)) + offset * DAY_MS);
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}`;
}

/** The month and day as a date in a given year, for a counter or a plan. */
export function frostDateInYear(offset: number, southern: boolean, year: number): string {
  const date = new Date((southern ? Date.UTC(year, 0, 1) : Date.UTC(year, 6, 1)) + offset * DAY_MS);
  return date.toISOString().slice(0, 10);
}

export function thresholdLabel(threshold: FrostThreshold, fahrenheit: boolean): string {
  if (threshold === 'frost') return fahrenheit ? 'Frost (32°F)' : 'Frost (0°C)';
  return fahrenheit ? 'Hard freeze (28°F)' : 'Hard freeze (-2°C)';
}

/** The sentences for one threshold, in order: the last frost, the first,
 *  and the stretch between. */
export function describeFrost(summary: FrostSummary): string[] {
  const { southern, seasons: n } = summary;
  const noun = summary.threshold === 'frost' ? 'frost' : 'hard freeze';
  const span = `${summary.firstYear} to ${summary.lastYear}`;
  const date = (offset: number) => frostDateLabel(offset, southern);

  if (summary.seasonsWithFrost === 0) {
    return [`No night fell to a ${noun} in any of the ${n} years from ${span}, so there is no ${noun} date here.`];
  }
  // Each side is said on its own: a southern winter can bring a spring frost
  // in most years while the autumn one lands before the midpoint in only a
  // few, and one side too thin to date should not hide the other.
  const lines: string[] = [];
  const { last, first } = summary;
  if (last.half !== null) {
    lines.push(
      `Last ${noun} of spring: by ${date(last.half)} in half the years, and by ${date(last.nineInTen as number)} in 9 years out of 10. The latest was ${date(last.extreme as number)}, in ${last.extremeYear}.`,
    );
  } else if (last.years > 0) {
    lines.push(
      `A ${noun} in winter or spring came in ${last.years} of the ${n} years from ${span}, too few to give a usual last date. The latest was ${date(last.extreme as number)}, in ${last.extremeYear}.`,
    );
  } else {
    lines.push(`No ${noun} came in winter or spring in any of the ${n} years from ${span}.`);
  }
  if (first.half !== null) {
    lines.push(
      `First ${noun} after summer: by ${date(first.half)} in half the years, and not before ${date(first.nineInTen as number)} in 9 years out of 10. The earliest was ${date(first.extreme as number)}, in ${first.extremeYear}.`,
    );
  } else if (first.years > 0) {
    lines.push(
      `A ${noun} after summer came in ${first.years} of the ${n} years, too few to give a usual first date. The earliest was ${date(first.extreme as number)}, in ${first.extremeYear}.`,
    );
  } else {
    lines.push(`No ${noun} came after summer in any of the ${n} years.`);
  }
  if (last.half !== null && first.half !== null && summary.frostFreeDays !== null) {
    lines.push(`Between them, the stretch without a ${noun} has run about ${summary.frostFreeDays} days in half the years.`);
  }
  if (summary.seasonsWithFrost < n) {
    lines.push(`${n - summary.seasonsWithFrost} of the ${n} years had no ${noun} at all.`);
  }
  return lines;
}

export const FROST_DATES_LIMITS =
  'These are for the air two metres up, averaged over a few kilometres. A low spot, a frost pocket or a clear, still night can frost a plant when the air reads a degree or two above freezing, and a sheltered wall or a city can hold it off, so the dates from a nearby weather station can differ by a week or two. The past 30 years are a guide to the coming season, not a forecast of it.';

export const FROST_DATES_SOURCE =
  "From Open-Meteo's historical weather (ERA5), the lowest temperature of each day for the last 30 complete years at the place saved above. The half and 9 in 10 dates are worked out the way national weather services publish freeze dates.";
