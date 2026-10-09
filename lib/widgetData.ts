// Gathers what the home screen widgets show (L2, rebuild R1, 2026-10-02).
// The words are decided in lib/widgetContent.ts; this only reads the rows,
// through the same functions the screens use, so a widget never says
// something its screen would not. Glass writes through createMeal, the
// same drink the Hydration button logs.
import { isAppLockedError, isLockedNow } from './appLockSession';
import { analyzeNutrientIntake } from './nutrientAnalysis';
import { createMeal, getDatabase, getNutrientTotalsByDateRange } from './db';
import { loadDayTimeline } from './dayTimelineDb';
import { pickFuelGauges } from './fuelGaugeChoice';
import { getFuelGaugeChoice } from './fuelGaugeChoiceDb';
import { getActiveGroceryList, getGroceryListItems } from './groceryDb';
import { QUICK_DRINKS, quickDrinkMeal } from './quickDrinks';
import {
  captureContent,
  fuelContent,
  glassContent,
  groceryContent,
  localDayOf,
  nextDoseContent,
  nextThingContent,
  routineStepContent,
  WIDGET_HIDE_HEALTH_META_KEY,
  type WidgetContent,
  type WidgetName,
  type WidgetRoutineRun,
  type WidgetTimelineItem,
} from './widgetContent';

export async function getWidgetHideHealth(): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_meta WHERE key = ?', WIDGET_HIDE_HEALTH_META_KEY);
  return row?.value === '1';
}

export async function setWidgetHideHealth(on: boolean): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO app_meta (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    WIDGET_HIDE_HEALTH_META_KEY,
    on ? '1' : '0',
    new Date().toISOString(),
  );
}

async function timelineItems(now: number): Promise<WidgetTimelineItem[]> {
  const view = await loadDayTimeline(now);
  return view.items;
}

async function groceryList(): Promise<{ name: string; stillToGet: string[]; total: number } | null> {
  const list = await getActiveGroceryList();
  if (!list) return null;
  const items = await getGroceryListItems(list.id);
  return {
    name: list.name,
    stillToGet: items.filter((item) => !item.checked).map((item) => item.foodName),
    total: items.length,
  };
}

async function gauges(now: number) {
  const date = localDayOf(now);
  const [totals, codes] = await Promise.all([getNutrientTotalsByDateRange(date, date), getFuelGaugeChoice()]);
  const entries = analyzeNutrientIntake(totals.driRows, totals.dayTotals[date] ?? {}, totals.supplementTotals);
  return pickFuelGauges(codes, entries);
}

async function latestRoutineRun(): Promise<WidgetRoutineRun | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    routineId: string;
    routineName: string;
    startedAt: string;
    stepsTotal: number;
    position: number | null;
    step: string | null;
  }>(
    `SELECT routine_id AS routineId, routine_name AS routineName, started_at AS startedAt,
            steps_total AS stepsTotal, stopped_on_position AS position, stopped_on_step AS step
       FROM routine_runs
      WHERE completed_at IS NULL
      ORDER BY started_at DESC
      LIMIT 1`,
  );
  if (!row) return null;
  const startedAt = new Date(row.startedAt).getTime();
  if (!Number.isFinite(startedAt)) return null;
  return { ...row, startedAt };
}

const GLASS = QUICK_DRINKS[0];

async function lastGlassAt(now: number): Promise<number | null> {
  const db = await getDatabase();
  const today = localDayOf(now);
  const row = await db.getFirstAsync<{ eatenAt: string | null }>(
    `SELECT MAX(eaten_at) AS eatenAt FROM meals WHERE name = ? AND meal_type = 'beverage' AND substr(eaten_at, 1, 10) = ?`,
    GLASS.label,
    today,
  );
  if (!row?.eatenAt) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(row.eatenAt);
  if (!match) return null;
  const [, y, m, d, h, min] = match.map(Number);
  return new Date(y, m - 1, d, h, min).getTime();
}

/** Logs one glass, exactly as Schedules > Hydration's Glass of water button does. */
export async function logWidgetGlass(now: Date = new Date()): Promise<void> {
  await createMeal(quickDrinkMeal(GLASS, now));
}

/** What one widget shows right now. Never throws: a widget that cannot be
 *  read says so and still opens the app. */
const LOCKED_CONTENT: WidgetContent = {
  heading: 'Lifestead',
  lines: ['Locked. Tap to open the app.'],
  caption: null,
  uri: 'hashimotosapp://',
};

export async function widgetContentFor(name: WidgetName, now: number = Date.now()): Promise<WidgetContent> {
  try {
    if (name === 'Capture') return captureContent();
    // App Lock on and nobody unlocked: the records cannot be read, and the
    // widget says only that, with nothing from them.
    if (isLockedNow()) return LOCKED_CONTENT;
    if (name === 'Grocery') return groceryContent(await groceryList());
    if (name === 'RoutineStep') return routineStepContent(await latestRoutineRun(), now);
    if (name === 'Glass') return glassContent(await lastGlassAt(now), now);
    const hideHealth = await getWidgetHideHealth();
    if (name === 'FuelGauges') return fuelContent(hideHealth ? [] : await gauges(now), hideHealth);
    const items = await timelineItems(now);
    if (name === 'NextDose') return nextDoseContent(items, now, hideHealth);
    return nextThingContent(items, now, hideHealth);
  } catch (error) {
    if (isAppLockedError(error)) return LOCKED_CONTENT;
    console.error('[widgetData] could not read', name, error);
    return { heading: 'Lifestead', lines: ['Could not be read just now. Tap to open the app.'], caption: null, uri: 'hashimotosapp://' };
  }
}
