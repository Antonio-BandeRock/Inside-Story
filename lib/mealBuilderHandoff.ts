// What another Food lens hands to Meal Builder when it wants a meal built
// from dishes it already has in front of it, 2026-09-13. Direct report on
// Log or Schedule a Meal: "There is no way to choose any of them to add to
// the meal builder... They could choose an entire meal or they could
// choose a few sides to make up a meal, but regardless they there to build
// a meal."
//
// Carried as one JSON string in a `/food` route param (`buildMealFrom`),
// the same mechanism "Use this Favorite" already uses to open Meal Builder
// with something loaded: a new param on the Food tab is what its focus
// effect reacts to. A dish is either one of this person's saved records
// (a favorite's or a logged meal's component) or a system recipe, which
// has no record yet and is made when Meal Builder loads it.
//
// Pure: no database, no React, so the parse can be checked without either.
import type { MealComponentType } from './db';

export type BuildMealItem =
  | { componentType: MealComponentType; componentId: string }
  | { curatedRecipeId: string };

export type BuildMealHandoff = {
  // Filled into Meal Builder's name and type only where the person has not
  // chosen one, so a meal already named there is not renamed underneath.
  name?: string;
  mealType?: string;
  items: BuildMealItem[];
  // Set by the sender so the same meal picked twice is two distinct
  // handoffs; the route param and the once-per-handoff check both key on
  // the whole value.
  nonce?: number;
};

export function encodeBuildMealHandoff(handoff: BuildMealHandoff): string {
  return JSON.stringify(handoff);
}

// Never throws: a stale or hand-typed param yields null and Meal Builder
// opens empty, which is what it did before this existed.
export function parseBuildMealHandoff(raw: string | undefined | null): BuildMealHandoff | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    const record = parsed as Record<string, unknown>;
    if (!Array.isArray(record.items)) return null;
    const items: BuildMealItem[] = [];
    for (const item of record.items) {
      if (!item || typeof item !== 'object') continue;
      const entry = item as Record<string, unknown>;
      if (typeof entry.curatedRecipeId === 'string' && entry.curatedRecipeId) {
        items.push({ curatedRecipeId: entry.curatedRecipeId });
      } else if (typeof entry.componentType === 'string' && typeof entry.componentId === 'string' && entry.componentId) {
        items.push({ componentType: entry.componentType as MealComponentType, componentId: entry.componentId });
      }
    }
    if (items.length === 0) return null;
    return {
      name: typeof record.name === 'string' && record.name.trim() ? record.name : undefined,
      mealType: typeof record.mealType === 'string' && record.mealType ? record.mealType : undefined,
      items,
      nonce: typeof record.nonce === 'number' ? record.nonce : undefined,
    };
  } catch {
    return null;
  }
}
