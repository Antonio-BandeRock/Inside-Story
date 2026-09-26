// Reads for the nine Trends lenses in lib/trendsMore.ts, 1.0.52.7. Every
// query here is a SELECT: Trends never writes. Windows reach a day past
// the range at both ends so a UTC stamp that lands on a neighbouring local
// day is still read, and the builders narrow to the range themselves.
import { getDatabase } from './db';
import { addDays } from './eatingVariety';
import { listNocturiaNights } from './nocturiaDb';
import { getNutrientTrendSeriesForRange, getSleepTrendPoints } from './trendAnalysis';
import {
  buildBloodPressureView,
  buildCareView,
  buildDosesView,
  buildFermentsView,
  buildHydrationView,
  buildNightsView,
  buildPlannedView,
  buildReactionsView,
  buildWorkView,
  localDay,
  type DayRange,
} from './trendsMore';
import type { ReadingView } from './readingBands';
import { listWorkCheckins } from './workDb';

export type TrendsMoreLens =
  | 'hydration'
  | 'bloodPressure'
  | 'doses'
  | 'care'
  | 'work'
  | 'reactions'
  | 'nights'
  | 'ferments'
  | 'planned';

export const DOSE_ITEM_TYPES = ['supplement', 'prescription', 'otc'];

function todayString(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function rangeForDays(days: number, today = todayString()): DayRange {
  return { start: addDays(today, -(days - 1)), end: today };
}

export async function listMealsAround(range: DayRange): Promise<{ eatenAt: string; name: string; mealType: string }[]> {
  const db = await getDatabase();
  return db.getAllAsync(
    `SELECT eaten_at AS eatenAt, name, meal_type AS mealType FROM meals
     WHERE eaten_at >= ? AND eaten_at < ? ORDER BY eaten_at ASC`,
    addDays(range.start, -1),
    addDays(range.end, 2),
  );
}

export async function listBloodPressureReadings(): Promise<
  { loggedAt: string; systolic: number; diastolic: number; pulse: number | null }[]
> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ loggedAt: string; type: string; value: number }>(
    `SELECT logged_at AS loggedAt, measurement_type AS type, value FROM body_measurements
     WHERE measurement_type IN ('blood_pressure_systolic', 'blood_pressure_diastolic', 'heart_rate_bpm')
     ORDER BY logged_at ASC`,
  );
  // A reading is a systolic and a diastolic written at the same moment; a
  // pulse at that moment rides along, and one on its own is left out.
  const byMoment = new Map<string, { systolic?: number; diastolic?: number; pulse?: number }>();
  for (const row of rows) {
    const entry = byMoment.get(row.loggedAt) ?? {};
    if (row.type === 'blood_pressure_systolic') entry.systolic = row.value;
    else if (row.type === 'blood_pressure_diastolic') entry.diastolic = row.value;
    else entry.pulse = row.value;
    byMoment.set(row.loggedAt, entry);
  }
  return [...byMoment.entries()]
    .filter(([, entry]) => entry.systolic !== undefined && entry.diastolic !== undefined)
    .map(([loggedAt, entry]) => ({
      loggedAt,
      systolic: entry.systolic as number,
      diastolic: entry.diastolic as number,
      pulse: entry.pulse ?? null,
    }));
}

export async function listScheduledDoses(range: DayRange): Promise<{ scheduledFor: string; title: string; status: string }[]> {
  const db = await getDatabase();
  return db.getAllAsync(
    `SELECT scheduled_for AS scheduledFor, title, status FROM schedule_items
     WHERE item_type IN (${DOSE_ITEM_TYPES.map(() => '?').join(', ')})
       AND scheduled_for >= ? AND scheduled_for < ?
     ORDER BY scheduled_for ASC`,
    ...DOSE_ITEM_TYPES,
    addDays(range.start, -1),
    addDays(range.end, 2),
  );
}

export async function listAllAppointments(): Promise<
  { scheduledFor: string; title: string; providerName: string | null; appointmentType: string | null; status: string }[]
> {
  const db = await getDatabase();
  return db.getAllAsync(
    `SELECT scheduled_for AS scheduledFor, title, provider_name AS providerName,
            appointment_type AS appointmentType, status
     FROM schedule_items WHERE item_type = 'appointment' ORDER BY scheduled_for ASC`,
  );
}

export async function listFlareDates(): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ loggedAt: string }>(
    `SELECT logged_at AS loggedAt FROM wellbeing_checkins WHERE checkin_type = 'flare' ORDER BY logged_at ASC`,
  );
  return rows.map((row) => localDay(row.loggedAt));
}

export async function listMealReactions(range: DayRange): Promise<{ loggedAt: string; severity: number | null; mealName: string | null }[]> {
  const db = await getDatabase();
  return db.getAllAsync(
    `SELECT c.logged_at AS loggedAt, c.severity AS severity, m.name AS mealName
     FROM wellbeing_checkins c LEFT JOIN meals m ON m.id = c.related_meal_id
     WHERE c.checkin_type = 'post_meal' AND c.valence = 'negative'
       AND c.logged_at >= ? AND c.logged_at < ?
     ORDER BY c.logged_at ASC`,
    addDays(range.start, -1),
    addDays(range.end, 2),
  );
}

export async function listFoodTrialsForTrends(): Promise<
  { foodName: string; status: string; startedAt: string; resolvedAt: string | null; design: string | null }[]
> {
  const db = await getDatabase();
  return db.getAllAsync(
    `SELECT food_name AS foodName, status, started_at AS startedAt, resolved_at AS resolvedAt, design
     FROM food_trials ORDER BY started_at ASC`,
  );
}

export async function listFermentBatches(): Promise<{ fermentationName: string; startedAt: string; stage: string }[]> {
  const db = await getDatabase();
  return db.getAllAsync(
    `SELECT f.name AS fermentationName, b.started_at AS startedAt, b.stage AS stage
     FROM fermentation_batches b JOIN fermentations f ON f.id = b.fermentation_id
     ORDER BY b.started_at ASC`,
  );
}

export async function listFermentHarvests(): Promise<
  { drinkName: string; readyAt: string; quantity: number; quantityRemaining: number; unit: string }[]
> {
  const db = await getDatabase();
  return db.getAllAsync(
    `SELECT drink_name AS drinkName, ready_at AS readyAt, quantity, quantity_remaining AS quantityRemaining, unit
     FROM fermentation_harvests ORDER BY ready_at ASC`,
  );
}

export async function listPlannedMeals(range: DayRange): Promise<{ scheduledFor: string; status: string; mealType: string | null }[]> {
  const db = await getDatabase();
  return db.getAllAsync(
    `SELECT scheduled_for AS scheduledFor, status, meal_type AS mealType FROM schedule_items
     WHERE item_type = 'meal' AND scheduled_for >= ? AND scheduled_for < ?
     ORDER BY scheduled_for ASC`,
    addDays(range.start, -1),
    addDays(range.end, 2),
  );
}

export async function loadTrendsMoreView(lens: TrendsMoreLens, days: number): Promise<ReadingView> {
  const today = todayString();
  const range = rangeForDays(days, today);
  switch (lens) {
    case 'hydration': {
      const [meals, water] = await Promise.all([
        listMealsAround(range),
        getNutrientTrendSeriesForRange('water', range.start, range.end),
      ]);
      return buildHydrationView({ range, meals, waterPercentByDay: water.points });
    }
    case 'bloodPressure':
      return buildBloodPressureView({ range, readings: await listBloodPressureReadings() });
    case 'doses':
      return buildDosesView({ range, today, doses: await listScheduledDoses(range) });
    case 'care':
      return buildCareView({ range, today, appointments: await listAllAppointments() });
    case 'work': {
      const [checkins, sleep, flareDates] = await Promise.all([
        listWorkCheckins(260),
        getSleepTrendPoints(days + 7),
        listFlareDates(),
      ]);
      return buildWorkView({ range, checkins, sleep, flareDates });
    }
    case 'reactions': {
      const [meals, reactions, trials] = await Promise.all([
        listMealsAround(range),
        listMealReactions(range),
        listFoodTrialsForTrends(),
      ]);
      return buildReactionsView({ range, mealDates: meals.map((m) => localDay(m.eatenAt)), reactions, trials });
    }
    case 'nights': {
      const [nights, meals] = await Promise.all([listNocturiaNights(400), listMealsAround(range)]);
      return buildNightsView({ range, nights, meals });
    }
    case 'ferments': {
      const [batches, harvests] = await Promise.all([listFermentBatches(), listFermentHarvests()]);
      return buildFermentsView({ range, batches, harvests });
    }
    case 'planned':
      return buildPlannedView({ range, today, planned: await listPlannedMeals(range) });
  }
}
