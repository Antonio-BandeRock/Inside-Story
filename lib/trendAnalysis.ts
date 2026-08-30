import {
  getBodyMeasurementTrend,
  getNutrientTotalsByDateRange,
  getOutsideEatingWindowCountsByDateRange,
  getProjectedNutrientTotalsByDateRange,
  getProjectedSixDimensionsFlagCountsByDateRange,
  getSixDimensionsFlagCountsByDateRange,
  listCheckins,
  type CheckinType,
  type EatingWindowDayCount,
} from './db';
import { analyzeNutrientIntake, type NutrientStatus } from './nutrientAnalysis';

// The "chart it over time" layer Trends needs. Rebuilt 2026-08-15 -- the
// original version of this file called lib/db.ts's single-date
// getDailyNutrientBreakdown/getDailySixDimensionsBreakdown once per
// calendar day in a for-loop (later "fixed" to Promise.all, which only
// changed JS-side scheduling: expo-sqlite serializes every query against
// one shared connection regardless, so that never actually helped).
// Confirmed the real fix has to cut the number of underlying queries, not
// just reorder them -- lib/db.ts now has real range-scoped functions
// (getNutrientTotalsByDateRange, getSixDimensionsFlagCountsByDateRange, and
// their real future-projection counterparts) that do it in ~2 queries plus
// one lookup per DISTINCT food actually eaten in the whole range, not one
// full query chain per day. This file's own job stays the same as before:
// turn those raw totals into a real, chartable per-day series.

// Same 'YYYY-MM-DD' local-time helper (and same reasoning) duplicated in
// index.tsx (Home)/food.tsx/insights.tsx/schedule.tsx/log.tsx: UTC's calendar date is wrong
// for anyone not on UTC, especially in the evening.
function todayDateString(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function dateStringDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Real, plain calendar-date arithmetic on a 'YYYY-MM-DD' string -- used for
// both "N days back" and "N days ahead" (a negative offset), so the same
// helper covers the past-range/future-range/Yesterday/Tomorrow picker
// options in app/(tabs)/trends.tsx without a second, separate function.
export function dateStringOffsetFrom(dateStr: string, offsetDays: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const next = new Date(y, m - 1, d + offsetDays);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`;
}

// Every real calendar date from startDate through endDate, inclusive,
// ascending -- the (year, month, day+1) constructor form correctly rolls
// over month/year boundaries without any DST-related surprise a repeated
// setDate(getDate()+1) mutation could introduce.
function dateRangeStringsBetween(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const [sy, sm, sd] = startDate.split('-').map(Number);
  const [ey, em, ed] = endDate.split('-').map(Number);
  const pad = (n: number) => String(n).padStart(2, '0');
  let cursor = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);
  while (cursor.getTime() <= end.getTime()) {
    dates.push(`${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}-${pad(cursor.getDate())}`);
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
  }
  return dates;
}

export type TrendPoint = { date: string; value: number };

export type NutrientTrendSeries = {
  points: TrendPoint[]; // percentOfTarget per day, one entry per day that actually had a meal logged
  latestStatus: NutrientStatus | null;
  displayName: string | null;
  unit: string | null;
};

// The real, general range version -- handles a range sitting entirely in
// the past (real logged data), entirely in the future (projected from what's
// genuinely scheduled), or straddling today (both, merged -- today's own
// point always comes from real logged data, never a projection, since
// getNutrientTotalsByDateRange's own end never extends past today here).
// Skips any date with no real data at all rather than plotting a false 0%
// "deficient" point -- a day before logging started, or a day nothing is
// scheduled for yet, isn't the same thing as a day of zero intake, and
// charting it as such would flood the trend with noise that has nothing to
// do with real intake.
export async function getNutrientTrendSeriesForRange(nutrientCode: string, startDate: string, endDate: string): Promise<NutrientTrendSeries> {
  const today = todayDateString();
  const dayTotals: Record<string, Record<string, number>> = {};
  let driRows: Awaited<ReturnType<typeof getNutrientTotalsByDateRange>>['driRows'] = [];
  let supplementTotals: Record<string, number> = {};

  if (startDate <= today) {
    const actual = await getNutrientTotalsByDateRange(startDate, endDate <= today ? endDate : today);
    Object.assign(dayTotals, actual.dayTotals);
    driRows = actual.driRows;
    supplementTotals = actual.supplementTotals;
  }
  if (endDate > today) {
    const projectedStart = startDate > today ? startDate : dateStringOffsetFrom(today, 1);
    const projected = await getProjectedNutrientTotalsByDateRange(projectedStart, endDate);
    Object.assign(dayTotals, projected.dayTotals);
    if (driRows.length === 0) driRows = projected.driRows;
    if (Object.keys(supplementTotals).length === 0) supplementTotals = projected.supplementTotals;
  }

  const points: TrendPoint[] = [];
  let latestStatus: NutrientStatus | null = null;
  let displayName: string | null = null;
  let unit: string | null = null;

  for (const date of dateRangeStringsBetween(startDate, endDate)) {
    const totals = dayTotals[date];
    if (!totals) continue;

    const entries = analyzeNutrientIntake(driRows, totals, supplementTotals);
    const entry = entries.find((e) => e.nutrientCode === nutrientCode);
    if (!entry || !Number.isFinite(entry.percentOfTarget)) continue;

    points.push({ date, value: entry.percentOfTarget });
    latestStatus = entry.status;
    displayName = entry.displayName;
    unit = entry.unit;
  }

  return { points, latestStatus, displayName, unit };
}

// A plain "last N days ending today" convenience wrapper over the general
// range version above -- kept so Home's own 14-day flag trend and
// lib/reportGenerator.ts's own report window (both real, existing callers,
// neither needing past/future picker support) don't need to change at all;
// both get the real performance fix for free since the range version
// underneath them is what actually got fast.
export async function getNutrientTrendSeries(nutrientCode: string, days: number): Promise<NutrientTrendSeries> {
  return getNutrientTrendSeriesForRange(nutrientCode, dateStringDaysAgo(days - 1), todayDateString());
}

// Same real shape as getNutrientTrendSeriesForRange, for the flag count
// instead of a specific nutrient's percent-of-target.
//
// conditionCodes, 2026-08-26 -- optional, defaults to [] so an existing
// caller not yet updated keeps the old, generic-across-every-scored-
// sub-criterion behavior; passed straight through to both real/projected
// halves so a trend line never mixes a condition-scoped day with a
// generic one.
export async function getSixDimensionsFlagTrendSeriesForRange(
  startDate: string,
  endDate: string,
  conditionCodes: string[] = [],
): Promise<TrendPoint[]> {
  const today = todayDateString();
  let counts: Record<string, number> = {};

  if (startDate <= today) {
    const actual = await getSixDimensionsFlagCountsByDateRange(startDate, endDate <= today ? endDate : today, conditionCodes);
    counts = { ...counts, ...actual };
  }
  if (endDate > today) {
    const projectedStart = startDate > today ? startDate : dateStringOffsetFrom(today, 1);
    const projected = await getProjectedSixDimensionsFlagCountsByDateRange(projectedStart, endDate, conditionCodes);
    counts = { ...counts, ...projected };
  }

  const points: TrendPoint[] = [];
  for (const date of dateRangeStringsBetween(startDate, endDate)) {
    if (counts[date] == null) continue;
    points.push({ date, value: counts[date] });
  }
  return points;
}

export async function getSixDimensionsFlagTrendSeries(days: number, conditionCodes: string[] = []): Promise<TrendPoint[]> {
  return getSixDimensionsFlagTrendSeriesForRange(dateStringDaysAgo(days - 1), todayDateString(), conditionCodes);
}

// Weight's own trend series -- getBodyMeasurementTrend('weight') already
// returns real, chronological, one-row-per-reading history (built for
// exactly this on 2026-08-09 alongside Profile's own Weight field, per
// that function's own comment), never previously read by any real chart.
// Always stored in kg (recordBodyMeasurement's own established convention,
// same as Profile's own Weight field) -- kept that way here too, so
// imperial-vs-metric display conversion stays the screen's own job, the
// same split every other unit-aware value in this app already uses.
// loggedAt is sliced to its first 10 characters so a value saved with a
// full ISO datetime (rather than a bare 'YYYY-MM-DD') still produces a
// real, valid date TrendLineChart's own formatShortDate can parse --
// that function assumes exactly 3 dash-separated parts.
export async function getWeightTrendPoints(days: number): Promise<TrendPoint[]> {
  const rangeStart = dateStringDaysAgo(days - 1);
  const rows = await getBodyMeasurementTrend('weight');
  return rows
    .map((row) => ({ date: row.loggedAt.slice(0, 10), value: row.value }))
    .filter((point) => point.date >= rangeStart);
}

// Eating-window exceptions over time -- 2026-08-30, closing the gap the
// "Add Meal Anyway" work named directly: the flag was stored and shown on
// its own row, but nothing read it, so calling it trend data was a claim
// the app could not back.
//
// One point per day that actually had a scheduled meal, valued by how
// many of that day's meals were deliberate outside-the-window exceptions.
// A day with meals and no exceptions is a real zero and is plotted; a day
// with no scheduled meals at all is genuinely nothing to say and is left
// out, the same rule getNutrientTrendSeriesForRange already follows for
// days with nothing logged.
export type EatingWindowTrend = {
  points: TrendPoint[];
  // Carried alongside the plotted points so the screen can say "3 of 26
  // meals" rather than only charting a line. Summed over the same range.
  totalExceptions: number;
  totalMeals: number;
  daysWithExceptions: number;
  byDay: EatingWindowDayCount[];
};

export async function getEatingWindowTrendForRange(startDate: string, endDate: string): Promise<EatingWindowTrend> {
  const byDay = await getOutsideEatingWindowCountsByDateRange(startDate, endDate);
  return {
    points: byDay.map((day) => ({ date: day.date, value: day.outsideCount })),
    totalExceptions: byDay.reduce((sum, day) => sum + day.outsideCount, 0),
    totalMeals: byDay.reduce((sum, day) => sum + day.totalMeals, 0),
    daysWithExceptions: byDay.filter((day) => day.outsideCount > 0).length,
    byDay,
  };
}

export async function getEatingWindowTrend(days: number): Promise<EatingWindowTrend> {
  return getEatingWindowTrendForRange(dateStringDaysAgo(days - 1), todayDateString());
}

// A weight or lab-result trend genuinely benefits from an axis padded
// tightly around the real values, not the 0-anchored range the Nutrients/
// 6 Dimensions charts correctly use (those are real counts/percentages
// where 0 is a meaningful floor) -- a person's own real weight or hormone
// level pinned against a 0 floor would render as a visually flat, useless
// line for the small, real swings that actually matter day to day. Real,
// simple padding: 10% of the observed span on each side, with a small
// fixed floor (2 units) for the rare case every point is identical.
export function paddedTrendRange(values: number[]): { yMin: number; yMax: number } {
  if (values.length === 0) return { yMin: 0, yMax: 1 };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 2);
  const pad = span * 0.1;
  return { yMin: min - pad, yMax: max + pad };
}

export type CheckinSeverityPoint = {
  date: string;
  severity: number;
  checkinType: CheckinType;
  label: string;
};

// Flares/reactions are sparse, real events -- not a daily metric -- so
// unlike the two series above this doesn't loop dates or fill in gaps, it
// just fetches and filters to the window. listCheckins has no date-range
// parameter, so a generous limit is fetched per type and then trimmed
// client-side to the requested window.
export async function getCheckinSeverityTrendSeries(checkinTypes: CheckinType[], days: number): Promise<CheckinSeverityPoint[]> {
  const rangeStart = dateStringDaysAgo(days - 1);
  const results = await Promise.all(checkinTypes.map((checkinType) => listCheckins({ checkinType, limit: 200 })));

  const points: CheckinSeverityPoint[] = [];
  for (const entries of results) {
    for (const entry of entries) {
      if (entry.severity == null) continue;
      const date = entry.loggedAt.slice(0, 10);
      if (date < rangeStart) continue;
      points.push({
        date,
        severity: entry.severity,
        checkinType: entry.checkinType,
        label: entry.foodName ?? (entry.checkinType === 'flare' ? 'Flare' : 'Reaction'),
      });
    }
  }

  points.sort((a, b) => a.date.localeCompare(b.date));
  return points;
}
