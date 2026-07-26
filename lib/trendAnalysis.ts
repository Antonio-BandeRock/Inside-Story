import {
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
// home.tsx/insights.tsx/schedule.tsx/log.tsx: UTC's calendar date is wrong
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

  for (const date of dates) {
    const breakdown = await getDailyNutrientBreakdown(date);
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

  for (const date of dates) {
    const breakdown = await getDailySixDimensionsBreakdown(date);
    if (breakdown.meals.length === 0) continue;

    const flagCount = breakdown.day.filter((score) => score.entries.some((entry) => isFlaggedTier(entry.tier))).length;
    points.push({ date, value: flagCount });
  }

  return points;
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
