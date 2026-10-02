// The database half of lib/mealVariety.ts (2026-09-27): the meals in a
// range with where each came from and whether the plan held it, the Home
// line under a usual meal, and adding a plant to a meal already logged.
//
// Reading never writes. The one write is appendPlantToMeal, which runs on
// the person's tap.
import { appendMealItems, endOfLocalDay, getDatabase } from './db';
import { addDays } from './eatingVariety';
import { getEatingVarietyInputs } from './eatingVarietyDb';
import {
  LOOKBACK_DAYS,
  homeVarietyLine,
  plantsNotLately,
  slotPlantCount,
  summarizeMealVariety,
  type MealVarietySummary,
  type PlantNotLately,
  type VarietyMeal,
} from './mealVariety';
import { eatenOutOf } from './eatenOut';

export async function getVarietyMeals(startDate: string, endDate: string): Promise<VarietyMeal[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ id: string; name: string | null; meal_type: string | null; eaten_at: string; notes: string | null; eaten_out: number | null; planned: number }>(
    `SELECT m.id, m.name, m.meal_type, m.eaten_at, m.notes, m.eaten_out,
            EXISTS (SELECT 1 FROM schedule_items s WHERE s.linked_meal_id = m.id) AS planned
       FROM meals m
      WHERE m.eaten_at BETWEEN ? AND ?
      ORDER BY m.eaten_at`,
    startDate,
    endOfLocalDay(endDate),
  );
  return rows.map((row) => ({
    id: row.id,
    date: row.eaten_at.slice(0, 10),
    mealType: row.meal_type,
    name: row.name ?? '',
    eatenOut: eatenOutOf(row).eatenOut,
    planned: row.planned === 1,
  }));
}

export async function getMealVarietySummary(startDate: string, endDate: string): Promise<MealVarietySummary> {
  const [inputs, meals] = await Promise.all([getEatingVarietyInputs(startDate, endDate), getVarietyMeals(startDate, endDate)]);
  return summarizeMealVariety(inputs, meals);
}

export type HomeVariety = { line: string | null; plants: PlantNotLately[] };

// The line and the plants to offer under a usual meal on Home. Reads four
// months of meals, so Home asks only while the usual meal card is showing.
export async function getHomeVariety(today: string, slot: string): Promise<HomeVariety> {
  const inputs = await getEatingVarietyInputs(addDays(today, -(LOOKBACK_DAYS - 1)), today);
  const plants = plantsNotLately(inputs.records, today);
  return { line: homeVarietyLine(slot, slotPlantCount(inputs.records, slot, today), plants), plants };
}

// Adds one plant to a meal already logged, in the amount and unit it was
// last logged in, so a tap does not ask anything more.
export async function appendPlantToMeal(mealId: string, plant: PlantNotLately): Promise<void> {
  const db = await getDatabase();
  const last = await db.getFirstAsync<{ serving_size: number | null; serving_unit: string | null; cooking_method: string | null }>(
    `SELECT mi.serving_size, mi.serving_unit, mi.cooking_method
       FROM meal_items mi JOIN meals m ON m.id = mi.meal_id
      WHERE mi.food_id = ?
      ORDER BY m.eaten_at DESC LIMIT 1`,
    plant.foodId,
  );
  await appendMealItems(mealId, [
    {
      foodId: plant.foodId,
      foodName: plant.foodName,
      category: plant.category,
      quantity: last?.serving_size ?? 100,
      unit: last?.serving_unit ?? 'g',
      cookingMethod: last?.cooking_method ?? undefined,
    },
  ]);
}
