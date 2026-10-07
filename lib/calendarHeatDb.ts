// Reads a year of daily figures for the year in squares (F15,
// lib/calendarHeat.ts). Every query is a SELECT. Each window reaches a day
// past the year at both ends, so a UTC stamp landing on a neighbouring
// local day is still read, and lib/calendarHeat.ts narrows to the year.
import { getDatabase } from './db';
import {
  buildCalendarHeat,
  dayCounts,
  daySums,
  shiftDay,
  YEAR_DAYS,
  YEAR_SQUARE_SETS,
  YEAR_STRIPS,
  type CalendarHeat,
  type YearSquareSet,
  type YearStripSpec,
} from './calendarHeat';
import { formatTrackerValue } from './customTrackers';
import { getCustomTrackerSeries, getDailyScaleSeries, getStepTrendPoints } from './trendAnalysis';
import { localDay } from './trendsMore';
import { readOrClosed } from './vaultReads';

export type YearStrip = { spec: YearStripSpec; heat: CalendarHeat };

function todayString(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

async function mealDays(from: string, through: string): Promise<{ day: string; mealType: string }[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ eatenAt: string; mealType: string }>(
    `SELECT eaten_at AS eatenAt, meal_type AS mealType FROM meals WHERE eaten_at >= ? AND eaten_at < ?`,
    from,
    through,
  );
  return rows.map((row) => ({ day: localDay(row.eatenAt), mealType: row.mealType }));
}

async function checkinDays(from: string, through: string): Promise<{ day: string; type: string; valence: string | null }[]> {
  const db = await getDatabase();
  const rows = await readOrClosed(() => db.getAllAsync<{ loggedAt: string; type: string; valence: string | null }>(
    `SELECT logged_at AS loggedAt, checkin_type AS type, valence FROM wellbeing_checkins
     WHERE logged_at >= ? AND logged_at < ?`,
    from,
    through,
  ), []);
  return rows.map((row) => ({ day: localDay(row.loggedAt), type: row.type, valence: row.valence }));
}

function isReaction(row: { type: string; valence: string | null }): boolean {
  return row.type === 'post_meal' && row.valence === 'negative';
}

async function valuesFor(key: keyof typeof YEAR_STRIPS, from: string, through: string): Promise<Map<string, number>> {
  const db = await getDatabase();
  switch (key) {
    case 'drinks': {
      const meals = await mealDays(from, through);
      return dayCounts(
        meals.filter((m) => m.mealType === 'beverage').map((m) => m.day),
        meals.map((m) => m.day),
      );
    }
    case 'flares': {
      const [meals, checkins] = await Promise.all([mealDays(from, through), checkinDays(from, through)]);
      return dayCounts(
        checkins.filter((c) => c.type === 'flare' || isReaction(c)).map((c) => c.day),
        [...meals.map((m) => m.day), ...checkins.map((c) => c.day)],
      );
    }
    case 'reactions': {
      const [meals, checkins] = await Promise.all([mealDays(from, through), checkinDays(from, through)]);
      return dayCounts(checkins.filter(isReaction).map((c) => c.day), meals.map((m) => m.day));
    }
    case 'mood': {
      const scales = await getDailyScaleSeries(YEAR_DAYS + 1);
      return new Map(scales.mood.map((point) => [point.date, point.value]));
    }
    case 'nights': {
      const rows = await readOrClosed(() => db.getAllAsync<{ nightOf: string; times: number }>(
        `SELECT night_of AS nightOf, times FROM nocturia_nights WHERE night_of >= ? AND night_of < ?`,
        from,
        through,
      ), []);
      return new Map(rows.map((row) => [row.nightOf, row.times]));
    }
    case 'exercise': {
      const rows = await db.getAllAsync<{ loggedAt: string; minutes: number | null }>(
        `SELECT logged_at AS loggedAt, duration_minutes AS minutes FROM exercise_logs WHERE logged_at >= ? AND logged_at < ?`,
        from,
        through,
      );
      return daySums(rows.map((row) => ({ day: localDay(row.loggedAt), value: row.minutes })));
    }
    case 'steps': {
      const points = await getStepTrendPoints(YEAR_DAYS + 1);
      return new Map(points.map((p) => [p.date, p.value]));
    }
    case 'done': {
      // done_check_marks and routine_runs keep UTC ISO stamps; localDay
      // turns each into the local day it happened on.
      const [marks, runs, doings] = await Promise.all([
        db.getAllAsync<{ at: string }>(`SELECT marked_at AS at FROM done_check_marks WHERE marked_at >= ? AND marked_at < ?`, from, through),
        db.getAllAsync<{ at: string }>(`SELECT started_at AS at FROM routine_runs WHERE started_at >= ? AND started_at < ?`, from, through),
        db.getAllAsync<{ at: string }>(`SELECT done_on AS at FROM upkeep_doings WHERE done_on >= ? AND done_on < ?`, from, through),
      ]);
      return dayCounts([...marks, ...runs, ...doings].map((row) => localDay(row.at)));
    }
  }
}

// Every strip one lens shows, a year to today.
export async function loadYearStrips(set: YearSquareSet): Promise<YearStrip[]> {
  const end = todayString();
  const from = shiftDay(end, -YEAR_DAYS);
  const through = shiftDay(end, 2);
  const strips: YearStrip[] = [];
  for (const key of YEAR_SQUARE_SETS[set]) {
    if (key === 'trackers') {
      const series = await getCustomTrackerSeries(YEAR_DAYS + 1);
      for (const { tracker, points } of series) {
        const spec: YearStripSpec = {
          key: `tracker:${tracker.id}`,
          heading: tracker.name,
          describe: (value) => formatTrackerValue(tracker, value),
          scale: tracker.kind === 'scale' ? [1, 5] : undefined,
        };
        strips.push({ spec, heat: buildCalendarHeat(spec, new Map(points.map((p) => [p.date, p.value])), end) });
      }
      continue;
    }
    const spec = YEAR_STRIPS[key];
    strips.push({ spec, heat: buildCalendarHeat(spec, await valuesFor(key, from, through), end) });
  }
  return strips;
}
