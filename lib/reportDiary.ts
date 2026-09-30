// The food and symptom diary in the Nutritionist report (K9, 2026-09-29).
// One row a day across the range: every meal as logged, with its time and
// foods, beside every flare and after-meal reaction logged that day, so a
// nutritionist can read the days in order without adding anything up.
//
// A run of days with nothing logged is one row saying so, never a day of
// eating nothing and never left out without a word. Sitting on the same
// day is a record, not a finding: nothing here says a food caused a
// symptom, which is Pattern Finder's job, and it says how far it can go.
//
// Pure: lib/reportDiaryDb.ts reads the records, lib/reportGenerator.ts
// hands them over, and scripts/test_report_diary.js checks this without a
// phone. Both meals.eaten_at and wellbeing_checkins.logged_at are stored
// as local 'YYYY-MM-DDTHH:mm', so the first ten characters are the day.

import type { ReportTableSection } from './reportGenerator';

export type DiaryMeal = {
  id: string;
  /** Local 'YYYY-MM-DDTHH:mm'. */
  eatenAt: string;
  mealType: string | null;
  name: string;
  foods: string[];
};

export type DiaryCheckin = {
  /** Local 'YYYY-MM-DDTHH:mm'. */
  loggedAt: string;
  kind: 'flare' | 'post_meal';
  severity: number | null;
  food: string | null;
  symptoms: string[];
  notes: string | null;
};

export const DIARY_HEADING = 'Food and symptom diary';

export const DIARY_NOTE =
  'Each day in the range, in order: every meal as logged with its foods, and every flare and after-meal reaction with its severity as rated at the time. A run of days with nothing logged is one row, and means nothing was recorded, not that nothing was eaten. Two things on the same day are shown side by side as a record; neither is offered as the cause of the other.';

export const DIARY_EMPTY = 'No meals, flares or reactions logged in this range.';

export const DIARY_COLUMNS = ['Day', 'What was eaten', 'Flares and reactions'];

/** Foods named in one meal before the rest are counted. */
export const FOODS_SHOWN = 10;

const NOTE_MAX = 100;

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
  drink: 'Drink',
};

const SEVERITY_LABELS = ['', 'mild', 'moderate', 'significant', 'severe'];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function parseDay(day: string): Date | null {
  const [y, m, d] = day.split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
}

function dayString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "Thu Sep 3, 2026" */
export function diaryDayLabel(day: string): string {
  const date = parseDay(day);
  if (!date) return day;
  return `${WEEKDAYS[date.getDay()]} ${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/** Every day from start to end, both counted. */
export function daysBetween(start: string, end: string): string[] {
  const first = parseDay(start);
  const last = parseDay(end);
  if (!first || !last || first > last) return [];
  const days: string[] = [];
  for (const d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) days.push(dayString(d));
  return days;
}

function shortNote(text: string | null): string | null {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim();
  if (!clean) return null;
  return clean.length > NOTE_MAX ? `${clean.slice(0, NOTE_MAX - 1).trimEnd()}…` : clean;
}

/** "08:10 Breakfast, Oat porridge: oats, blueberries, milk" */
export function describeMeal(meal: DiaryMeal): string {
  const time = meal.eatenAt.slice(11, 16);
  const type = meal.mealType ? MEAL_TYPE_LABELS[meal.mealType] ?? null : null;
  const name = meal.name.trim();
  const title = type && name && name.toLowerCase() !== type.toLowerCase() ? `${type}, ${name}` : name || type || 'Meal';
  const foods: string[] = [];
  const seen = new Set<string>();
  for (const food of meal.foods) {
    const clean = food.trim();
    if (!clean || seen.has(clean.toLowerCase())) continue;
    seen.add(clean.toLowerCase());
    foods.push(clean);
  }
  const shown = foods.slice(0, FOODS_SHOWN);
  const more = foods.length - shown.length;
  const list = shown.length > 0 ? `: ${shown.join(', ')}${more > 0 ? ` and ${more} more` : ''}` : '';
  return `${time ? `${time} ` : ''}${title}${list}`;
}

/** "14:20 Reaction (moderate) after Oat porridge: bloating, cramps. Note: worse after coffee" */
export function describeCheckin(entry: DiaryCheckin): string {
  const time = entry.loggedAt.slice(11, 16);
  const kind = entry.kind === 'flare' ? 'Flare' : 'Reaction';
  const severity = entry.severity != null ? SEVERITY_LABELS[entry.severity] ?? String(entry.severity) : null;
  const food = entry.food?.trim();
  const after = entry.kind === 'post_meal' && food ? ` after ${food}` : '';
  const symptoms = entry.symptoms.length > 0 ? `: ${entry.symptoms.join(', ')}` : '';
  const note = shortNote(entry.notes);
  return `${time ? `${time} ` : ''}${kind}${severity ? ` (${severity})` : ''}${after}${symptoms}${note ? `. Note: ${note}` : ''}`;
}

export function diarySection(
  meals: DiaryMeal[] | null,
  checkins: DiaryCheckin[] | null,
  rangeStart: string,
  rangeEnd: string,
): ReportTableSection {
  const base = { kind: 'table' as const, heading: DIARY_HEADING, columns: DIARY_COLUMNS };
  if (!meals || !checkins) return { ...base, rows: [], empty: 'Could not be read for this report.' };

  const mealsByDay = new Map<string, DiaryMeal[]>();
  for (const meal of [...meals].sort((a, b) => a.eatenAt.localeCompare(b.eatenAt))) {
    const day = meal.eatenAt.slice(0, 10);
    mealsByDay.set(day, [...(mealsByDay.get(day) ?? []), meal]);
  }
  const checkinsByDay = new Map<string, DiaryCheckin[]>();
  for (const entry of [...checkins].sort((a, b) => a.loggedAt.localeCompare(b.loggedAt))) {
    const day = entry.loggedAt.slice(0, 10);
    checkinsByDay.set(day, [...(checkinsByDay.get(day) ?? []), entry]);
  }

  const days = daysBetween(rangeStart, rangeEnd);
  const anything = days.some((day) => mealsByDay.has(day) || checkinsByDay.has(day));
  if (!anything) return { ...base, note: DIARY_NOTE, rows: [], empty: DIARY_EMPTY };

  const rows: string[][] = [];
  let gapStart: string | null = null;
  let gapEnd: string | null = null;
  const closeGap = () => {
    if (!gapStart || !gapEnd) return;
    const label = gapStart === gapEnd ? diaryDayLabel(gapStart) : `${diaryDayLabel(gapStart)} to ${diaryDayLabel(gapEnd)}`;
    rows.push([label, 'Nothing logged', '']);
    gapStart = null;
    gapEnd = null;
  };
  for (const day of days) {
    const dayMeals = mealsByDay.get(day) ?? [];
    const dayCheckins = checkinsByDay.get(day) ?? [];
    if (dayMeals.length === 0 && dayCheckins.length === 0) {
      gapStart = gapStart ?? day;
      gapEnd = day;
      continue;
    }
    closeGap();
    rows.push([
      diaryDayLabel(day),
      dayMeals.length > 0 ? dayMeals.map(describeMeal).join('; ') : 'No meals logged',
      dayCheckins.length > 0 ? dayCheckins.map(describeCheckin).join('; ') : 'None logged',
    ]);
  }
  closeGap();
  return { ...base, note: DIARY_NOTE, rows, empty: DIARY_EMPTY };
}
