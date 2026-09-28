// Your usual meals (2026-09-27, replacing the G25 guess of the same day).
//
// G25 first shipped as "Log your usual lunch?": Home counted the last four
// weeks and offered whichever meal came up most. The owner's objection, in
// their words: "The app is supposed to be helping people get more variety in
// their diet," and a meal inferred from repetition quietly rewards eating
// the same thing, while a person who packs a lunch or eats out at work is
// not using the planner for that meal at all. So the list is now CHOSEN:
// a short list per meal that the person fills from a starter list, from
// their saved meals, from what they log (offered, never added on its own),
// or by typing one. Meals eaten out are a second list beside the home one,
// "in place of lunch they bring from home."
//
// Home offers the list near a usual meal time only when nothing is planned
// or logged for that meal, and it never picks one for the person. A meal
// left open on the plan (lib/openMeals.ts) is where the list matters most,
// so an open meal with an empty list gets a line pointing at where to add.
//
// This half is pure: which slot the clock is in, the card, the suggestions
// drawn from history, the starter lists, and every sentence. The database
// half is lib/usualMealDb.ts.
import type { MealPack } from './mealPack';
import type { OpenMeal } from './openMeals';

export const USUAL_LOOKBACK_DAYS = 28;
// How many logged times make a meal worth offering as a suggestion. Twice is
// enough to ask about, and asking is all it does.
export const SUGGEST_MIN_TIMES = 2;
export const SUGGEST_MAX = 5;
// A short list is the point: past this, Home shows the ones used most lately.
export const HOME_LIST_MAX = 4;

export type UsualSlot = OpenMeal;
export const USUAL_SLOTS: readonly UsualSlot[] = ['breakfast', 'lunch', 'dinner'];

export type UsualMealKind = 'home' | 'out';
export type UsualMealSource = 'favorite' | 'meal' | 'typed' | 'leftovers';

export type UsualMeal = {
  id: string;
  mealType: UsualSlot;
  kind: UsualMealKind;
  source: UsualMealSource;
  name: string;
  favoriteId: string | null;
  sourceMealId: string | null;
  place: string | null;
  foods: string[];
  lastUsedAt: string | null;
  createdAt: string;
  // Weekdays (0 Sunday) this meal stands on: the meal plan leaves the meal
  // open on those days and Home offers this one (lib/mealPack.ts).
  standingWeekdays: number[];
};

// How close to a usual time the offer appears: from 45 minutes before it
// until two and a half hours after, so a late lunch still gets asked about.
const OPENS_BEFORE_MIN = 45;
const CLOSES_AFTER_MIN = 150;
// With no time set in Profile, this many logged times are needed before the
// middle of them is taken as the usual time.
const TIME_FROM_HISTORY_MIN = 3;

export type UsualMealHistoryRow = {
  id: string;
  name: string;
  mealType: string;
  // "YYYY-MM-DDTHH:mm", local, as meals.eaten_at stores it.
  eatenAt: string;
};

function minutesOf(time: string | null | undefined): number | null {
  if (!time) return null;
  const match = /^(\d{1,2}):(\d{2})/.exec(time.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function dayOf(row: UsualMealHistoryRow): string {
  return row.eatenAt.slice(0, 10);
}

function clockOf(row: UsualMealHistoryRow): number | null {
  return minutesOf(row.eatenAt.slice(11, 16));
}

function nameKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function dismissKeyFor(today: string, slot: UsualSlot): string {
  return `${today}:${slot}`;
}

// "Had something else" on a standing meal puts only that meal away for the
// day, so the usual list still shows.
export function standingDismissKeyFor(today: string, slot: UsualSlot): string {
  return `${today}:${slot}:standing`;
}

// The first day inside the lookback window, for the query.
export function lookbackStart(today: string): string {
  const start = new Date(`${today}T12:00:00`);
  start.setDate(start.getDate() - USUAL_LOOKBACK_DAYS);
  const month = String(start.getMonth() + 1).padStart(2, '0');
  const day = String(start.getDate()).padStart(2, '0');
  return `${start.getFullYear()}-${month}-${day}`;
}

// When this slot is usually eaten: the person's own time when set, else
// the middle of the times it has been logged, else nothing to go on.
export function usualTimeForSlot(
  slot: UsualSlot,
  usualTimes: Record<UsualSlot, string | null>,
  history: UsualMealHistoryRow[],
): number | null {
  const stated = minutesOf(usualTimes[slot]);
  if (stated != null) return stated;
  const logged = history
    .filter((row) => row.mealType === slot)
    .map(clockOf)
    .filter((value): value is number => value != null);
  if (logged.length < TIME_FROM_HISTORY_MIN) return null;
  return median(logged);
}

// Which slot the clock is near, the closest when two windows overlap.
export function slotNear(nowTime: string, usualTimes: Record<UsualSlot, string | null>, history: UsualMealHistoryRow[]): UsualSlot | null {
  const now = minutesOf(nowTime);
  if (now == null) return null;
  let best: { slot: UsualSlot; distance: number } | null = null;
  for (const slot of USUAL_SLOTS) {
    const usual = usualTimeForSlot(slot, usualTimes, history);
    if (usual == null) continue;
    if (now < usual - OPENS_BEFORE_MIN || now > usual + CLOSES_AFTER_MIN) continue;
    const distance = Math.abs(now - usual);
    if (!best || distance < best.distance) best = { slot, distance };
  }
  return best?.slot ?? null;
}

// Most lately used first, then the newest added, so the list a person keeps
// using stays on top without anything being counted.
export function orderUsualMeals(meals: UsualMeal[]): UsualMeal[] {
  return [...meals].sort((a, b) => {
    const used = (b.lastUsedAt ?? '').localeCompare(a.lastUsedAt ?? '');
    if (used !== 0) return used;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export type UsualMealsCardInputs = {
  // Meals over the lookback window, today included.
  history: UsualMealHistoryRow[];
  // "YYYY-MM-DD" and "HH:mm", local.
  today: string;
  nowTime: string;
  usualTimes: Record<UsualSlot, string | null>;
  // Meal types of today's scheduled meals that were not skipped.
  plannedToday: string[];
  // The stored "Not today" key, or null.
  dismissed: string | null;
  usualMeals: UsualMeal[];
  // Meals left open on the plan today (lib/openMeals.ts).
  openToday: UsualSlot[];
  // Meals chosen the evening before for today (lib/mealPack.ts), any status.
  packsToday?: MealPack[];
};

export type UsualMealsCard = {
  slot: UsualSlot;
  open: boolean;
  home: UsualMeal[];
  out: UsualMeal[];
  // How many more of each kind are kept than Home shows.
  moreHome: number;
  moreOut: number;
  dismissKey: string;
  // Chosen the evening before and not yet logged or passed over: Home
  // offers this one alone.
  packed: MealPack | null;
  // The standing meal for today, when nothing was chosen for it.
  standing: UsualMeal | null;
  standingDismissKey: string;
};

export function usualMealsCard(inputs: UsualMealsCardInputs): UsualMealsCard | null {
  const { history, today } = inputs;
  const slot = slotNear(inputs.nowTime, inputs.usualTimes, history.filter((row) => dayOf(row) < today));
  if (!slot) return null;
  const dismissKey = dismissKeyFor(today, slot);
  if (inputs.dismissed === dismissKey) return null;
  if (inputs.plannedToday.includes(slot)) return null;
  if (history.some((row) => row.mealType === slot && dayOf(row) === today)) return null;

  // Planned, then packed, then standing, then the usual list.
  const packs = (inputs.packsToday ?? []).filter((pack) => pack.mealType === slot && pack.date === today);
  const packed = packs.find((pack) => pack.status === 'planned') ?? null;
  const standingDismissKey = standingDismissKeyFor(today, slot);
  const weekday = new Date(`${today}T12:00:00`).getDay();
  const standing =
    packs.length === 0 && inputs.dismissed !== standingDismissKey
      ? (inputs.usualMeals.find((meal) => meal.mealType === slot && meal.standingWeekdays.includes(weekday)) ?? null)
      : null;

  const open = inputs.openToday.includes(slot) || standing != null;
  const mine = orderUsualMeals(inputs.usualMeals.filter((meal) => meal.mealType === slot));
  if (mine.length === 0 && !open && !packed) return null;
  const home = mine.filter((meal) => meal.kind === 'home');
  const out = mine.filter((meal) => meal.kind === 'out');
  return {
    slot,
    open,
    home: home.slice(0, HOME_LIST_MAX),
    out: out.slice(0, HOME_LIST_MAX),
    moreHome: Math.max(0, home.length - HOME_LIST_MAX),
    moreOut: Math.max(0, out.length - HOME_LIST_MAX),
    dismissKey,
    packed,
    standing: packed ? null : standing,
    standingDismissKey,
  };
}

// ---------------------------------------------------------------------------
// Suggestions from what is logged. Offered on the list screen with an Add
// button each; nothing here ever puts a meal on the list by itself.
// ---------------------------------------------------------------------------

export type UsualMealSuggestion = {
  slot: UsualSlot;
  name: string;
  // The latest meal carrying this name, which is what gets copied.
  sourceMealId: string;
  days: number;
};

export function historySuggestions(
  history: UsualMealHistoryRow[],
  today: string,
  usualMeals: UsualMeal[],
): Record<UsualSlot, UsualMealSuggestion[]> {
  const start = lookbackStart(today);
  const result: Record<UsualSlot, UsualMealSuggestion[]> = { breakfast: [], lunch: [], dinner: [] };
  for (const slot of USUAL_SLOTS) {
    const kept = new Set(usualMeals.filter((meal) => meal.mealType === slot).map((meal) => nameKey(meal.name)));
    const byName = new Map<string, { days: Set<string>; latest: UsualMealHistoryRow }>();
    for (const row of history) {
      if (row.mealType !== slot) continue;
      const day = dayOf(row);
      if (day >= today || day < start) continue;
      const key = nameKey(row.name);
      if (!key || kept.has(key)) continue;
      const entry = byName.get(key) ?? { days: new Set<string>(), latest: row };
      entry.days.add(day);
      if (row.eatenAt > entry.latest.eatenAt) entry.latest = row;
      byName.set(key, entry);
    }
    result[slot] = [...byName.values()]
      .filter((entry) => entry.days.size >= SUGGEST_MIN_TIMES)
      .sort((a, b) => b.days.size - a.days.size || b.latest.eatenAt.localeCompare(a.latest.eatenAt))
      .slice(0, SUGGEST_MAX)
      .map((entry) => ({ slot, name: entry.latest.name, sourceMealId: entry.latest.id, days: entry.days.size }));
  }
  return result;
}

// ---------------------------------------------------------------------------
// Starter lists. Home meals lean on whole foods that pack and travel; eaten
// out meals are the kinds of place people eat near work. Each is a name and
// a few foods, which the person can change before it goes on their list.
// ---------------------------------------------------------------------------

export type StarterMeal = {
  name: string;
  foods: string[];
  // 'leftovers' copies the latest dinner logged before the day it is used.
  source?: 'leftovers';
};

export const LEFTOVERS_NAME = "Last night's leftovers";

export const STARTER_USUAL_MEALS: Record<UsualSlot, Record<UsualMealKind, StarterMeal[]>> = {
  breakfast: {
    home: [
      { name: LEFTOVERS_NAME, foods: [], source: 'leftovers' },
      { name: 'Overnight oats', foods: ['Rolled oats', 'Milk or yogurt', 'Berries', 'Chia seeds'] },
      { name: 'Eggs and greens', foods: ['Eggs', 'Spinach', 'Tomato'] },
      { name: 'Yogurt, fruit and nuts', foods: ['Plain yogurt', 'Fruit', 'Walnuts'] },
      { name: 'Porridge with fruit', foods: ['Oats', 'Banana', 'Cinnamon'] },
      { name: 'Smoothie', foods: ['Frozen berries', 'Spinach', 'Yogurt'] },
    ],
    out: [
      { name: 'Café eggs and toast', foods: ['Eggs', 'Toast'] },
      { name: 'Breakfast burrito', foods: ['Tortilla', 'Eggs', 'Beans', 'Salsa'] },
      { name: 'Coffee and a pastry', foods: ['Coffee', 'Pastry'] },
      { name: 'Smoothie bar', foods: ['Fruit smoothie'] },
      { name: 'Bagel', foods: ['Bagel', 'Cream cheese'] },
    ],
  },
  lunch: {
    home: [
      { name: LEFTOVERS_NAME, foods: [], source: 'leftovers' },
      { name: 'Salad with a protein', foods: ['Salad greens', 'Vegetables', 'Chicken, eggs or beans', 'Olive oil'] },
      { name: 'Soup in a flask', foods: ['Vegetable soup'] },
      { name: 'Grain bowl', foods: ['Rice or quinoa', 'Roasted vegetables', 'Chicken, fish or beans'] },
      { name: 'Wrap', foods: ['Tortilla', 'Chicken or hummus', 'Salad vegetables'] },
      { name: 'Bento box', foods: ['Rice', 'Fish or egg', 'Vegetables', 'Fruit'] },
    ],
    out: [
      { name: 'Burrito bowl', foods: ['Rice', 'Beans', 'Chicken', 'Salsa'] },
      { name: 'Salad bar', foods: ['Salad greens', 'Vegetables', 'Dressing'] },
      { name: 'Sandwich', foods: ['Bread', 'Filling'] },
      { name: 'Sushi', foods: ['Sushi rice', 'Fish', 'Seaweed'] },
      { name: 'Pho', foods: ['Rice noodles', 'Beef broth', 'Beef', 'Herbs'] },
      { name: 'Poke bowl', foods: ['Rice', 'Raw fish', 'Vegetables'] },
      { name: 'Pizza', foods: ['Pizza'] },
      { name: 'Burger', foods: ['Burger', 'Bun'] },
    ],
  },
  dinner: {
    home: [
      { name: 'Stir fry', foods: ['Vegetables', 'Chicken, tofu or beef', 'Rice'] },
      { name: 'Roast vegetables and a protein', foods: ['Root vegetables', 'Chicken or fish'] },
      { name: 'Soup and bread', foods: ['Soup', 'Bread'] },
      { name: 'Omelette and salad', foods: ['Eggs', 'Salad greens', 'Vegetables'] },
      { name: 'Pasta with vegetables', foods: ['Pasta', 'Vegetables', 'Olive oil'] },
    ],
    out: [
      { name: 'Curry', foods: ['Curry', 'Rice'] },
      { name: 'Tacos', foods: ['Tortillas', 'Meat or beans', 'Salsa'] },
      { name: 'Pasta', foods: ['Pasta', 'Sauce'] },
      { name: 'Steak and vegetables', foods: ['Steak', 'Vegetables'] },
      { name: 'Ramen', foods: ['Noodles', 'Broth', 'Egg'] },
      { name: 'Pizza', foods: ['Pizza'] },
    ],
  },
};

// Starters not already on the person's list for that meal and kind.
export function startersToOffer(slot: UsualSlot, kind: UsualMealKind, usualMeals: UsualMeal[]): StarterMeal[] {
  const kept = new Set(usualMeals.filter((meal) => meal.mealType === slot && meal.kind === kind).map((meal) => nameKey(meal.name)));
  return STARTER_USUAL_MEALS[slot][kind].filter((starter) => !kept.has(nameKey(starter.name)));
}

// Foods as typed in one box, split on commas or new lines.
export function parseFoods(text: string): string[] {
  const seen = new Set<string>();
  const foods: string[] = [];
  for (const piece of text.split(/[,\n]/)) {
    const food = piece.trim().replace(/\s+/g, ' ');
    if (!food || seen.has(food.toLowerCase())) continue;
    seen.add(food.toLowerCase());
    foods.push(food.slice(0, 60));
  }
  return foods.slice(0, 20);
}

// ---------------------------------------------------------------------------
// Sentences
// ---------------------------------------------------------------------------

export const USUAL_MEAL_META_KEY = 'usual_meal_dismissed';
export const EATEN_OUT_NOTE = 'Eaten out.';

const MEAL_TITLE: Record<UsualSlot, string> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' };
const MEAL_PLURAL: Record<UsualSlot, string> = { breakfast: 'breakfasts', lunch: 'lunches', dinner: 'dinners' };

export function mealTitle(slot: UsualSlot): string {
  return MEAL_TITLE[slot];
}

export function usualMealsCardTitle(card: UsualMealsCard): string {
  return `Your usual ${MEAL_PLURAL[card.slot]}`;
}

export function usualMealsCardCaption(card: UsualMealsCard): string {
  if (card.open && card.home.length === 0 && card.out.length === 0) {
    return `${MEAL_TITLE[card.slot]} is left open on your plan today. Add a few usual ${MEAL_PLURAL[card.slot]}, from home or eaten out, and they will be here to log with one tap.`;
  }
  const why = card.open ? `${MEAL_TITLE[card.slot]} is left open on your plan today.` : `Nothing is planned or logged for ${card.slot} yet.`;
  return `${why} Tap the one you had to log it now, or leave it and log something else.`;
}

export function eatenOutNote(place: string | null | undefined): string {
  const at = place?.trim();
  return at ? `${EATEN_OUT_NOTE} ${at}.` : EATEN_OUT_NOTE;
}

// One muted line under a meal on the list screen.
export function usualMealDetail(meal: UsualMeal): string {
  if (meal.source === 'leftovers') return 'Copies the latest dinner logged before that day.';
  const parts: string[] = [];
  if (meal.kind === 'out' && meal.place) parts.push(meal.place);
  if (meal.source === 'favorite') parts.push('From your saved meals');
  else if (meal.source === 'meal') parts.push('Copies a meal you logged');
  else if (meal.foods.length > 0) parts.push(meal.foods.join(', '));
  return parts.join('. ');
}

export const TYPED_FOODS_NOTE =
  'Foods typed here are kept by name. Nutrients are counted only for foods picked from the food list, so a typed meal adds to your log and to your variety, not to your nutrient figures.';

export function suggestionCaption(suggestion: UsualMealSuggestion): string {
  return `Logged at ${suggestion.slot} on ${suggestion.days} days in the last four weeks.`;
}

export function clock12(time24: string): string {
  const minutes = minutesOf(time24);
  if (minutes == null) return '';
  const hours = Math.floor(minutes / 60);
  const suffix = hours >= 12 ? 'pm' : 'am';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${String(minutes % 60).padStart(2, '0')}${suffix}`;
}

export function usualMealLoggedSentence(name: string, time24: string): string {
  const at = clock12(time24);
  return at ? `${name} logged at ${at}.` : `${name} logged.`;
}

export const USUAL_MEAL_TRIAL_NOTE =
  'This started a food trial, so it cannot be undone from here. Past Meals can change or remove it.';

export const NO_LEFTOVERS_ERROR = 'No dinner is logged before today, so there is nothing to copy as leftovers.';
