// Reads the two series Trends > Compare Two draws (F16, lib/compareSeries.ts).
// Every read goes through a reader the other Trends lenses already use, so a
// figure here is the same figure that series shows on its home lens. Nothing writes.
import { sortByLabel } from './choiceOrder';
import { getCheckinTagDefinition } from './checkinTags';
import { buildChoices, nutrientKey, oneReadingPerDay, shiftDate, type ComparePoint, type SeriesChoice } from './compareSeries';
import { dailyMode } from './customTrackers';
import { listCustomTrackers } from './customTrackersDb';
import { getDatabase, getDietaryReferenceIntakesForCurrentUser, getLabResultTrend, getLabTests } from './db';
import { kgToLb } from './measurement';
import { tagDays, type TagMarkRow } from './tagMarks';
import { pressureIn, rainIn, tempIn } from './weather';
import { getWeatherUnits, isWeatherOn, listWeatherDays, refreshWeather } from './weatherDb';
import {
  getCheckinSeverityTrendSeries,
  getCustomTrackerSeries,
  getDailyScaleSeries,
  getNutrientTrendSeriesForCodes,
  getNutrientTrendSeriesForRange,
  getSleepTrendPoints,
  getStepTrendPoints,
  getWeightTrendPoints,
} from './trendAnalysis';

export async function loadCompareChoices(weightUnit: 'kg' | 'lb'): Promise<SeriesChoice[]> {
  const db = await getDatabase();
  const [intakes, testedRows, tests, trackers, weatherOn] = await Promise.all([
    getDietaryReferenceIntakesForCurrentUser(),
    db.getAllAsync<{ code: string; unit: string }>(
      `SELECT test_code AS code, unit FROM lab_results GROUP BY test_code ORDER BY MAX(tested_at) DESC`,
    ),
    getLabTests(),
    listCustomTrackers(),
    isWeatherOn(),
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
  const weather = weatherOn ? await getWeatherUnits() : null;
  return buildChoices({ nutrients, labs, trackers: shownTrackers, weightUnit, weather });
}

// Which series hold at least one reading in the range, so the pickers
// offer only those. Every nutrient comes from one pass over the meals,
// the same pass Reports uses for several nutrients at once, rather than
// one pass per nutrient.
export async function loadKeysWithData(choices: readonly SeriesChoice[], end: string, start: string, days: number): Promise<Set<string>> {
  const nutrientCodes = choices.filter((c) => c.kind === 'nutrient').map((c) => c.key.slice('nutrient:'.length));
  const others = choices.filter((c) => c.kind !== 'nutrient');
  // Missing weather days are asked for once before anything is read, so
  // the weather series are offered as soon as NASA has them.
  if (choices.some((c) => c.kind === 'weather')) await refreshWeather(shiftDate(start, -1), end).catch(() => null);
  const [nutrients, otherPoints] = await Promise.all([
    nutrientCodes.length > 0 ? getNutrientTrendSeriesForCodes(nutrientCodes, start, end) : Promise.resolve(new Map()),
    Promise.all(others.map((choice) => loadSeriesPoints(choice, end, start, days).catch(() => [] as ComparePoint[]))),
  ]);
  const keys = new Set<string>();
  for (const code of nutrientCodes) {
    if (oneReadingPerDay(nutrients.get(code)?.points ?? [], 'average', start, end).length > 0) keys.add(nutrientKey(code));
  }
  others.forEach((choice, i) => {
    if (oneReadingPerDay(otherPoints[i], choice.perDay, start, end).length > 0) keys.add(choice.key);
  });
  return keys;
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
    case 'weather': {
      const days = await listWeatherDays(shiftDate(start, -1), end);
      const field = choice.key.slice('weather:'.length);
      const read = (day: (typeof days)[number]): number | null => {
        if (field === 'pressure') return day.pressureKpa === null ? null : pressureIn(choice.unit === 'inHg' ? 'inHg' : 'hPa', day.pressureKpa);
        if (field === 'high') return day.tempMaxC === null ? null : tempIn(choice.unit === '°F' ? 'F' : 'C', day.tempMaxC);
        if (field === 'humidity') return day.humidity;
        if (field === 'rain') return day.rainMm === null ? null : rainIn(choice.unit === 'in' ? 'in' : 'mm', day.rainMm);
        return null;
      };
      return days.flatMap((day) => {
        const value = read(day);
        return value === null ? [] : [{ date: day.date, value }];
      });
    }
  }
}

// Every check-in tag logged from start to end (F18), for the marks under
// the chart. logged_at is UTC, so the window reaches a day past the range
// at both ends and lib/tagMarks.ts narrows it by the local day. A tag
// marked as not present (severity 0) is left out, as Signals leaves it out.
export async function loadTagDays(start: string, end: string): Promise<TagMarkRow[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ loggedAt: string; tagCode: string }>(
    `SELECT c.logged_at AS loggedAt, t.tag_code AS tagCode
       FROM checkin_tags t JOIN wellbeing_checkins c ON c.id = t.checkin_id
      WHERE c.logged_at >= ? AND c.logged_at < ?
        AND (t.severity IS NULL OR t.severity > 0)`,
    shiftDate(start, -1),
    shiftDate(end, 2),
  );
  return tagDays(rows, start, end, (code) => getCheckinTagDefinition(code)?.label);
}
