// The newest meal logged at or before now, for Home's Since Your Last Meal
// card (G33, lib/sinceLastMeal.ts). A meal logged ahead of time, later
// today, is not the last meal yet, so the read stops at now. One indexed
// read; nothing is written.
import { getDatabase } from './db';
import { localStamp } from './sinceLastMeal';

export async function getLastMealEatenAt(now: Date = new Date()): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ eaten_at: string | null }>(
    'SELECT MAX(eaten_at) AS eaten_at FROM meals WHERE eaten_at <= ?',
    localStamp(now),
  );
  return row?.eaten_at ?? null;
}
