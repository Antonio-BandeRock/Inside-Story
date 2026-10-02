// Reads the two series Trends > Compare Two draws (F16, lib/compareSeries.ts).
// Every read goes through a reader the other Trends lenses already use, so a
// figure here is the same figure that series shows on its home lens. Nothing writes.
import { sortByLabel } from './choiceOrder';
import { buildChoices, type ComparePoint, type SeriesChoice } from './compareSeries';
import { dailyMode } from './customTrackers';
import { listCustomTrackers } from './customTrackersDb';
import { getDatabase, getDietaryReferenceIntakesForCurrentUser, getLabResultTrend, getLabTests } from './db';
import { kgToLb } from './measurement';
import {
  getCheckinSeverityTrendSeries,
  getCustomTrackerSeries,
  getDailyScaleSeries,
  getNutrientTrendSeriesForRange,
  getSleepTrendPoints,
  getStepTrendPoints,
  getWeightTrendPoints,
} from './trendAnalysis';

export async function loadCompareChoices(weightUnit: 'kg' | 'lb'): Promise<SeriesChoice[]> {
  const db = await getDatabase();
  const [intakes, testedRows, tests, trackers] = await Promise.all([
    getDietaryReferenceIntakesForCurrentUser(),
    db.getAllAsync<{ code: string; unit: string }>(
      `SELECT test_code AS code, unit FROM lab_results GROUP BY test_code ORDER BY MAX(tested_at) DESC`,
    ),
    getLabTests(),
    listCustomTrackers(),
  ]);
  const seen = new Set<string>();
  const nutrients = intakes
    .filter((row) => (seen.has(row.nutrientCode) ? false : (seen.add(row.nutrientCode), true)))
    .map((row) => ({ code: row.nutrientCode, label: row.displayName }));
  const testNames = new Map(tests.map((test) => [test.code, test.displayName]));
  const labs = sortByLabel(
    testedRows.map((row) => ({ code: row.code, label: testNames.get(row.code) ?? row.code, unit: row.unit })),
  );
  const shownTrackers = sortByLabel(
    trackers
      .filter((tracker) => !tracker.retiredAt || tracker.entryCount > 0)
      .map((tracker) => ({ ...tracker, label: tracker.name })),
  ).map((tracker) => ({
    id: tracker.id,
    name: tracker.name,
    unit: tracker.kind === 'duration' ? 'minutes' : tracker.kind === 'scale' ? 'of 5' : tracker.unit ?? '',
    perDay: dailyMode(tracker.kind),
    scale: tracker.kind === 'scale',
  }));
  return buildChoices({ nutrients, labs, trackers: shownTrackers, weightUnit });
}

// The readings for one series across the last `days` days to `end`.
// Each reader is asked for a day more than the range, so a reading on the
// first day is never cut; lib/compareSeries.ts narrows to the range.
export async function loadSeriesPoints(choice: SeriesChoice, end: string, start: string, days: number): Promise<ComparePoint[]> {
  const reach = days + 1;
  switch (choice.kind) {
    case 'nutrient': {
      const series = await getNutrientTrendSeriesForRange(choice.key.slice('nutrient:'.length), start, end);
      return series.points;
    }
    case 'weight': {
      const points = await getWeightTrendPoints(reach);
      return choice.unit === 'lb' ? points.map((p) => ({ date: p.date, value: kgToLb(p.value) })) : points;
    }
    case 'steps':
      return getStepTrendPoints(reach);
    case 'sleep':
      return getSleepTrendPoints(reach);
    case 'severity': {
      const points = await getCheckinSeverityTrendSeries(['flare', 'post_meal'], reach);
      return points.map((p) => ({ date: p.date, value: p.onTen }));
    }
    case 'scale': {
      const scales = await getDailyScaleSeries(reach);
      const key = choice.key.slice('scale:'.length) as keyof typeof scales;
      return scales[key] ?? [];
    }
    case 'lab': {
      const results = await getLabResultTrend(choice.key.slice('lab:'.length));
      return results.map((result) => ({ date: result.testedAt.slice(0, 10), value: result.value }));
    }
    case 'tracker': {
      const series = await getCustomTrackerSeries(reach);
      const id = choice.key.slice('tracker:'.length);
      return series.find((entry) => entry.tracker.id === id)?.points ?? [];
    }
  }
}
