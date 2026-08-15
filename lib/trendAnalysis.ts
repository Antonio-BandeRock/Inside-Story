import {
  getBodyMeasurementTrend,
  getDailyNutrientBreakdown,
  getDailySixDimensionsBreakdown,
  listCheckins,
  type CheckinType,
} from './db';
import { analyzeNutrientIntake, type NutrientStatus } from './nutrientAnalysis';
import { isFlaggedTier } from './sixDimensionsReference';

// The "chart it over time" layer Trends needs -- lib/db.ts's own
// getDailyNutrientBreakdown/getDailySixDimensionsBreakdown are single-date
// only (confirmed: no batch/range variant exists), so a multi-day series
// means calling them once per day in a loop. Kept separate from
// app/(tabs)/trends.tsx the same way lib/nutrientAnalysis.ts and
// lib/sixDimensionsReference.ts already separate computation from the
// Insights UI -- the screen should only be responsible for rendering.

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

// Ascending, oldest -> today, inclusive of both ends.
function dateRangeStrings(days: number): string[] {
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    dates.push(dateStringDaysAgo(i));
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

// Skips any date with zero meals logged rather than plotting a false 0%
// "deficient" point -- a day before the person started using the app (or
// just didn't log) isn't the same thing as a day they ate nothing, and
// charting it as such would flood the trend with noise that has nothing to
// do with their actual intake.
export async function getNutrientTrendSeries(nutrientCode: string, days: number): Promise<NutrientTrendSeries> {
  const dates = dateRangeStrings(days);
  const points: TrendPoint[] = [];
  let latestStatus: NutrientStatus | null = null;
  let displayName: string | null = null;
  let unit: string | null = null;

  // Reported directly, 2026-08-15: "why does it take so long... for any
  // time frame." getDailyNutrientBreakdown is real, but genuinely heavy --
  // per day it queries every meal, then every meal item, then per-item
  // getFoodNutrients/getFoodUnitWeight/getFoodCategory calls, each a real
  // SQLite round-trip. This used to await that whole chain one day at a
  // time in a for-loop, so a 90-day range paid for 90 fully sequential
  // heavy queries even on a mostly-empty range. Every day's own breakdown
  // is genuinely independent of every other day's, so there's no reason to
  // serialize them -- fired concurrently instead, the same real Promise.all
  // pattern this app already uses everywhere else for independent reads.
  const breakdowns = await Promise.all(dates.map((date) => getDailyNutrientBreakdown(date)));

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    const breakdown = breakdowns[i];
    if (breakdown.meals.length === 0) continue;

    const entries = analyzeNutrientIntake(breakdown.driRows, breakdown.dayTotals, breakdown.supplementTotals);
    const entry = entries.find((e) => e.nutrientCode === nutrientCode);
    if (!entry || !Number.isFinite(entry.percentOfTarget)) continue;

    points.push({ date, value: entry.percentOfTarget });
    latestStatus = entry.status;
    displayName = entry.displayName;
    unit = entry.unit;
  }

  return { points, latestStatus, displayName, unit };
}

// Flagged D1-D6 tier count per day, same "skip days with no meals logged"
// rule as the nutrient series above, for the same reason.
export async function getSixDimensionsFlagTrendSeries(days: number): Promise<TrendPoint[]> {
  const dates = dateRangeStrings(days);
  const points: TrendPoint[] = [];

  // Same real fix as getNutrientTrendSeries just above -- each day's own
  // breakdown is independent, fired concurrently instead of one at a time.
  const breakdowns = await Promise.all(dates.map((date) => getDailySixDimensionsBreakdown(date)));

  for (let i = 0; i < dates.length; i++) {
    const breakdown = breakdowns[i];
    if (breakdown.meals.length === 0) continue;

    const flagCount = breakdown.day.filter((score) => score.entries.some((entry) => isFlaggedTier(entry.tier))).length;
    points.push({ date: dates[i], value: flagCount });
  }

  return points;
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
