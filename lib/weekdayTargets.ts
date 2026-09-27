// Different targets on different weekdays: F21 of the competitive build
// plan (Phase 2, 2026-09-26). A personal nutrient target set on Profile >
// Nutrient Targets can carry a different number on chosen days of the week,
// for somebody who trains on Saturdays or works nights midweek. A weekday
// row replaces the every-day row for that nutrient on that day only, one
// side at a time, and a side the weekday row leaves blank falls back to the
// every-day figure and then to the published default.
//
// Pure. Read by the Daily Meal Plan generator (lib/dailyMealPlan.ts), which
// works out each planned day's targets from its calendar date, and by the
// Profile card. Checked by scripts/test_weekday_targets.js.

export type NutrientTargetOverride = { nutrientCode: string; targetAmount: number | null; limitAmount: number | null };
export type WeekdayTargetOverride = NutrientTargetOverride & { weekday: number };

// The nutrients Profile > Nutrient Targets lets somebody set. nutrientCode
// matches dietary_reference_intakes; isCeiling picks which side a field
// edits (target_amount for a floor, limit_amount for a ceiling).
export type NutrientTargetField = { nutrientCode: string; label: string; unit: string; isCeiling: boolean };
export const NUTRIENT_TARGET_FIELDS: NutrientTargetField[] = [
  { nutrientCode: 'protein', label: 'Protein', unit: 'g', isCeiling: false },
  { nutrientCode: 'fiber_total', label: 'Fiber', unit: 'g', isCeiling: false },
  { nutrientCode: 'sodium', label: 'Sodium', unit: 'mg', isCeiling: true },
];

// JavaScript's numbering (0 is Sunday), listed Monday first.
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
export const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function weekdayOf(date: string): number {
  const [y, m, d] = date.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

// A calendar date some whole days on, as YYYY-MM-DD, counted in local days
// so a change of clocks never skips or repeats a date.
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.slice(0, 10).split('-').map(Number);
  const next = new Date(y, m - 1, d + days);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`;
}

export function isPlainDate(date: string | null | undefined): date is string {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  return addDays(date, 0) === date;
}

// The overrides that hold on one calendar date: the every-day rows, with
// any side a weekday row sets for that date's weekday taking its place.
export function overridesForDate(
  everyDay: NutrientTargetOverride[],
  weekdayRows: WeekdayTargetOverride[],
  date: string,
): NutrientTargetOverride[] {
  const weekday = weekdayOf(date);
  const byCode = new Map<string, NutrientTargetOverride>();
  for (const row of everyDay) byCode.set(row.nutrientCode, { ...row });
  for (const row of weekdayRows) {
    if (row.weekday !== weekday) continue;
    const base = byCode.get(row.nutrientCode);
    byCode.set(row.nutrientCode, {
      nutrientCode: row.nutrientCode,
      targetAmount: row.targetAmount ?? base?.targetAmount ?? null,
      limitAmount: row.limitAmount ?? base?.limitAmount ?? null,
    });
  }
  return [...byCode.values()];
}

// The weekday rows for one nutrient, Monday first, each with the one side
// its field edits.
export function weekdayValuesFor(
  weekdayRows: WeekdayTargetOverride[],
  nutrientCode: string,
  isCeiling: boolean,
): { weekday: number; name: string; value: number }[] {
  return WEEKDAY_ORDER.flatMap((weekday) => {
    const row = weekdayRows.find((r) => r.nutrientCode === nutrientCode && r.weekday === weekday);
    const value = row ? (isCeiling ? row.limitAmount : row.targetAmount) : null;
    return value == null ? [] : [{ weekday, name: WEEKDAY_NAMES[weekday], value }];
  });
}

// One sentence per nutrient a planned day's weekday changes, for the day's
// report: "Saturday's protein target used: 120 g."
export function weekdayTargetNotes(
  weekdayRows: WeekdayTargetOverride[],
  date: string,
  fields: NutrientTargetField[] = NUTRIENT_TARGET_FIELDS,
): string[] {
  const weekday = weekdayOf(date);
  const name = WEEKDAY_NAMES[weekday];
  return fields.flatMap((field) => {
    const row = weekdayRows.find((r) => r.nutrientCode === field.nutrientCode && r.weekday === weekday);
    const value = row ? (field.isCeiling ? row.limitAmount : row.targetAmount) : null;
    if (value == null) return [];
    return [`${name}'s ${field.label.toLowerCase()} ${field.isCeiling ? 'ceiling' : 'target'} used: ${value} ${field.unit}.`];
  });
}

// Whether two start dates fall on the same weekday, so a plan made for one
// can be put on the calendar from the other without its targets moving.
export function sameWeekday(a: string, b: string): boolean {
  return weekdayOf(a) === weekdayOf(b);
}
