// Pack for tomorrow and standing meals (2026-09-27, part 2 of the usual
// meals redesign).
//
// A meal left open on the plan (lib/openMeals.ts) is not entered until the
// person decides it: the evening before, when they make tomorrow's lunch or
// decide to eat out, they choose it here. The choice can be anything: a meal
// on their usual list, from home or eaten out, one of their saved meals,
// tonight's leftovers, or something typed. Choosing writes a meal_packs row
// and a scheduled meal for tomorrow at their usual time, so Schedules shows
// it and Home offers it the next day as the meal to log. When it needs
// making, a reminder can be set for this evening or the morning.
//
// A standing meal is a usual meal the person has put on certain weekdays
// ("soup in a flask, Monday to Friday"). It takes that meal on those days
// without anything being written: the plan leaves the meal open on those
// weekdays, Home offers it on the day, and choosing something else for
// tomorrow replaces it for that one day.
//
// Home's order for a meal, and nothing here ever guesses past it: planned,
// then packed, then standing, then the usual list.
//
// This half is pure. The database half is lib/mealPackDb.ts.
import { WEEKDAY_NAMES, openMealsOn, weekdayOf, weekdaysPhrase, type OpenMealRule } from './openMeals';
import { clock12, eatenOutNote, type UsualMeal, type UsualMealKind, type UsualSlot, USUAL_SLOTS } from './usualMeal';

export type MealPackSource = 'usual' | 'favorite' | 'leftovers' | 'typed';

export type MealPack = {
  id: string;
  // "YYYY-MM-DD", the day it is for.
  date: string;
  mealType: UsualSlot;
  kind: UsualMealKind;
  source: MealPackSource;
  // Which usual meal it was chosen from, when it was.
  usualMealId: string | null;
  favoriteId: string | null;
  sourceMealId: string | null;
  name: string;
  place: string | null;
  foods: string[];
  scheduleItemId: string | null;
  prepReminderId: string | null;
  // "YYYY-MM-DDTHH:mm" of the reminder, while it is still waiting.
  prepAt: string | null;
  // The scheduled meal's status: planned until it is logged or skipped.
  status: 'planned' | 'logged' | 'skipped';
};

// A choice made on the picker, before it is written.
export type PackChoice =
  | { source: 'usual'; meal: UsualMeal }
  | { source: 'favorite'; favoriteId: string; name: string }
  | { source: 'leftovers'; dinnerName: string | null; dinnerId: string | null }
  | { source: 'typed'; name: string; kind: UsualMealKind; place: string | null; foods: string[] };

// From this time the evening card offers tomorrow.
export const EVENING_FROM = '16:00';

function minutesOf(time: string | null | undefined): number | null {
  if (!time) return null;
  const match = /^(\d{1,2}):(\d{2})/.exec(time.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// ---------------------------------------------------------------------------
// Standing meals
// ---------------------------------------------------------------------------

// The standing meal for this meal on this date, if one is set for the day.
export function standingMealFor(usualMeals: UsualMeal[], date: string, slot: UsualSlot): UsualMeal | null {
  const day = weekdayOf(date);
  return usualMeals.find((meal) => meal.mealType === slot && meal.standingWeekdays.includes(day)) ?? null;
}

// The open-meal rules with every standing meal's weekdays added, which is
// what the meal plan generator is given: a meal that already has its food
// on a weekday is not planned for on that weekday.
export function withStandingMeals(rules: OpenMealRule[], usualMeals: UsualMeal[]): OpenMealRule[] {
  const days = new Map<UsualSlot, Set<number>>();
  for (const rule of rules) days.set(rule.meal, new Set(rule.weekdays));
  for (const meal of usualMeals) {
    if (meal.standingWeekdays.length === 0) continue;
    const set = days.get(meal.mealType) ?? new Set<number>();
    for (const day of meal.standingWeekdays) set.add(day);
    days.set(meal.mealType, set);
  }
  return USUAL_SLOTS.filter((slot) => days.has(slot) && (days.get(slot) as Set<number>).size > 0).map((slot) => ({
    meal: slot,
    weekdays: [...(days.get(slot) as Set<number>)].sort((a, b) => a - b),
  }));
}

// One line under the open-meal picker naming the standing meals that also
// leave a meal open, or null when there are none.
export function standingMealsLine(usualMeals: UsualMeal[]): string | null {
  const standing = usualMeals.filter((meal) => meal.standingWeekdays.length > 0);
  if (standing.length === 0) return null;
  const parts = standing.map((meal) => `${meal.name} (${meal.mealType}, ${weekdaysPhrase(meal.standingWeekdays)})`);
  return `Also left open for your standing meals: ${parts.join('; ')}. Change these on Your Usual Meals.`;
}

// Weekdays another standing meal already holds for the same meal, which the
// picker shows as taken rather than silently moving.
export function takenWeekdays(usualMeals: UsualMeal[], meal: UsualMeal): Map<number, string> {
  const taken = new Map<number, string>();
  for (const other of usualMeals) {
    if (other.id === meal.id || other.mealType !== meal.mealType) continue;
    for (const day of other.standingWeekdays) taken.set(day, other.name);
  }
  return taken;
}

export function standingPhrase(meal: UsualMeal): string | null {
  if (meal.standingWeekdays.length === 0) return null;
  const when = weekdaysPhrase(meal.standingWeekdays);
  return when.startsWith('on ') ? `Standing ${meal.mealType} ${when}.` : `Standing ${meal.mealType}, ${when}.`;
}

// ---------------------------------------------------------------------------
// Tomorrow
// ---------------------------------------------------------------------------

export type TomorrowSlot = {
  date: string;
  slot: UsualSlot;
  // What has been chosen already, or null.
  pack: MealPack | null;
  // The standing meal for that day, when no pack replaces it.
  standing: UsualMeal | null;
};

export type TomorrowInputs = {
  today: string;
  nowTime: string;
  openRules: OpenMealRule[];
  usualMeals: UsualMeal[];
  // Meal types of tomorrow's scheduled meals that are not packs and not
  // skipped: a meal already planned needs no choosing.
  plannedTomorrow: string[];
  packsTomorrow: MealPack[];
  // Ignore the clock (the Your Usual Meals screen shows tomorrow at any hour).
  anyTime?: boolean;
};

// The meals tomorrow that are left open, or held by a standing meal, and
// are not planned: each is somewhere to choose what it will be.
export function tomorrowSlots(inputs: TomorrowInputs): TomorrowSlot[] {
  if (!inputs.anyTime) {
    const now = minutesOf(inputs.nowTime);
    const from = minutesOf(EVENING_FROM) as number;
    if (now == null || now < from) return [];
  }
  const date = addDays(inputs.today, 1);
  const open = new Set(openMealsOn(withStandingMeals(inputs.openRules, inputs.usualMeals), date));
  const result: TomorrowSlot[] = [];
  for (const slot of USUAL_SLOTS) {
    if (!open.has(slot)) continue;
    if (inputs.plannedTomorrow.includes(slot)) continue;
    const pack = inputs.packsTomorrow.find((row) => row.mealType === slot && row.status !== 'skipped') ?? null;
    result.push({ date, slot, pack, standing: pack ? null : standingMealFor(inputs.usualMeals, date, slot) });
  }
  return result;
}

// ---------------------------------------------------------------------------
// Turning a choice into what gets written
// ---------------------------------------------------------------------------

export type PackRow = Omit<MealPack, 'id' | 'date' | 'mealType' | 'scheduleItemId' | 'prepReminderId' | 'prepAt' | 'status'> & {
  // What the scheduled meal carries, so settlePastScheduledMeals can log a
  // meal whose foods are known, and leaves the rest for the person.
  scheduleFavoriteId: string | null;
  scheduleMealId: string | null;
  scheduleNotes: string;
};

export const LEFTOVERS_PREFIX = 'Leftovers';

export function leftoversName(dinnerName: string | null): string {
  return dinnerName ? `${LEFTOVERS_PREFIX}: ${dinnerName}` : "Tonight's leftovers";
}

export function packRowFor(choice: PackChoice): PackRow {
  if (choice.source === 'usual') {
    const meal = choice.meal;
    const out = meal.kind === 'out';
    // A meal eaten out waits for the person to say they had it, so it keeps
    // "Eaten out." in its notes; that is why it never carries a source here.
    return {
      kind: meal.kind,
      source: 'usual',
      usualMealId: meal.id,
      favoriteId: meal.favoriteId,
      sourceMealId: meal.sourceMealId,
      name: meal.name,
      place: meal.place,
      foods: meal.foods,
      scheduleFavoriteId: !out && meal.source === 'favorite' ? meal.favoriteId : null,
      scheduleMealId: !out && meal.source === 'meal' ? meal.sourceMealId : null,
      scheduleNotes: out ? eatenOutNote(meal.place) : packNote(meal.foods),
    };
  }
  if (choice.source === 'favorite') {
    return {
      kind: 'home',
      source: 'favorite',
      usualMealId: null,
      favoriteId: choice.favoriteId,
      sourceMealId: null,
      name: choice.name,
      place: null,
      foods: [],
      scheduleFavoriteId: choice.favoriteId,
      scheduleMealId: null,
      scheduleNotes: packNote([]),
    };
  }
  if (choice.source === 'leftovers') {
    return {
      kind: 'home',
      source: 'leftovers',
      usualMealId: null,
      favoriteId: null,
      sourceMealId: choice.dinnerId,
      name: leftoversName(choice.dinnerName),
      place: null,
      foods: [],
      scheduleFavoriteId: null,
      scheduleMealId: choice.dinnerId,
      scheduleNotes: packNote([]),
    };
  }
  const out = choice.kind === 'out';
  return {
    kind: choice.kind,
    source: 'typed',
    usualMealId: null,
    favoriteId: null,
    sourceMealId: null,
    name: choice.name.trim().slice(0, 80),
    place: out && choice.place?.trim() ? choice.place.trim().slice(0, 80) : null,
    foods: choice.foods,
    scheduleFavoriteId: null,
    scheduleMealId: null,
    scheduleNotes: out ? eatenOutNote(choice.place) : packNote(choice.foods),
  };
}

export const PACKED_NOTE = 'Chosen the evening before.';

function packNote(foods: string[]): string {
  return foods.length > 0 ? `${PACKED_NOTE} ${foods.join(', ')}.` : PACKED_NOTE;
}

// ---------------------------------------------------------------------------
// The reminder to make it
// ---------------------------------------------------------------------------

export type PrepOption = { key: string; label: string; scheduledFor: string };

function at(date: string, minutes: number): string {
  return `${date}T${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

// When to be reminded to make tomorrow's meal: this evening at 8, or in half
// an hour once 8 has gone by, and tomorrow morning at 7, or half an hour
// before breakfast when that comes first.
export function prepOptions(today: string, nowTime: string, usualTime: string | null): PrepOption[] {
  const now = minutesOf(nowTime) ?? 0;
  const options: PrepOption[] = [];
  const evening = 20 * 60;
  if (now < evening - 15) {
    options.push({ key: 'evening', label: `This evening, ${clock12('20:00')}`, scheduledFor: at(today, evening) });
  } else if (now < 23 * 60) {
    const soon = Math.ceil((now + 30) / 5) * 5;
    options.push({ key: 'soon', label: 'In half an hour', scheduledFor: at(today, soon) });
  }
  let morning = 7 * 60;
  const mealAt = minutesOf(usualTime);
  if (mealAt != null && mealAt - 30 < morning) morning = Math.max(5 * 60, mealAt - 30);
  const tomorrow = addDays(today, 1);
  const morningClock = `${pad(Math.floor(morning / 60))}:${pad(morning % 60)}`;
  options.push({ key: 'morning', label: `Tomorrow morning, ${clock12(morningClock)}`, scheduledFor: at(tomorrow, morning) });
  return options;
}

export function prepReminderTitle(slot: UsualSlot, name: string): string {
  return `Make tomorrow's ${slot}: ${name}`;
}

// ---------------------------------------------------------------------------
// Sentences
// ---------------------------------------------------------------------------

export function tomorrowTitle(slot: UsualSlot): string {
  return `Tomorrow's ${slot}`;
}

export function tomorrowCaption(entry: TomorrowSlot): string {
  const dayName = WEEKDAY_NAMES[weekdayOf(entry.date)];
  if (entry.pack) {
    const how = entry.pack.kind === 'out' ? `eating out${entry.pack.place ? ` at ${entry.pack.place}` : ''}` : 'from home';
    return `${entry.pack.name}, ${how}. It is on your schedule for ${dayName}.`;
  }
  if (entry.standing) {
    return `${entry.standing.name} is your standing ${entry.slot} on ${dayName}s. Choose something else for this ${dayName} if you like.`;
  }
  return `${entry.slot[0].toUpperCase()}${entry.slot.slice(1)} is left open on your plan for ${dayName}. Choose what it will be: something you will make or pack, or where you will eat out.`;
}

export function prepSetSentence(prepAt: string): string {
  const time = clock12(prepAt.slice(11, 16));
  return `A reminder to make it is set for ${time}.`;
}

export function packedTitle(pack: MealPack): string {
  return pack.kind === 'out' ? `Your ${pack.mealType} out today` : `Your packed ${pack.mealType}`;
}

export function packedCaption(pack: MealPack): string {
  const where = pack.kind === 'out' && pack.place ? ` at ${pack.place}` : '';
  return `You chose ${pack.name}${where} for today. Tap I had it once you have, or Had something else if the day went another way.`;
}

export function standingTitle(meal: UsualMeal): string {
  return `Your standing ${meal.mealType}`;
}

export function standingCaption(meal: UsualMeal, date: string): string {
  const dayName = WEEKDAY_NAMES[weekdayOf(date)];
  return `${meal.name} is your ${meal.mealType} on ${dayName}s. Tap I had it once you have, or Had something else if the day went another way.`;
}

export const NO_SAVED_MEALS = 'Nothing saved yet. Meals you save from the builders will be here.';
