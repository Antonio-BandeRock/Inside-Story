// An optional calorie range and macro split for the meal plan generator (G37
// of the competitive build plan, 2026-09-27). Both are off unless the person
// chooses them on Schedules > Meal Plan, and neither is ever turned on for
// them.
//
// THE CALORIE RANGE. When a range is chosen, each main dish is picked from
// the half of its pool nearer to what is left of the range for the meals
// still to come. That is a lean and the words say so: the recipes are what
// they are, the side dish rule and the nutrient scoring still have their
// say, and the figures come from the recipes as written.
//
// UNDER-EATING. For celiac disease and IBD, eating too little is often the
// larger risk, since both can make it harder to absorb what is eaten. With either
// in the plan's conditions the lean only ever goes toward more food, to reach
// the low end of a range, and never toward less; the top of the range is
// reported and never steered for. The form says so beside the picker.
//
// THE MACRO SPLIT. Reported, not steered: the share of energy from protein,
// fat and carbohydrate, set beside the Acceptable Macronutrient Distribution
// Ranges for adults (Institute of Medicine, Dietary Reference Intakes for
// Energy, Carbohydrate, Fiber, Fat, Fatty Acids, Cholesterol, Protein, and
// Amino Acids, 2005). Carbohydrate is left out of the check when a carb level
// is set, since a low-carb day sits under 45% by design.
//
// Pure, with no React and no database, so scripts/test_energy_band.js checks
// it without a phone.

export const MACRO_RANGE_SOURCE = 'Institute of Medicine, Dietary Reference Intakes, 2005';

export type KcalRange = { min: number; max: number };

export type EnergySetting = {
  kcal: KcalRange | null;
  macros: boolean;
};

export const ENERGY_OFF: EnergySetting = { kcal: null, macros: false };

export function energySettingOn(setting: EnergySetting | null | undefined): setting is EnergySetting {
  return !!setting && (setting.kcal !== null || setting.macros);
}

function thousands(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function kcalRangeLabel(range: KcalRange): string {
  return `${thousands(range.min)} to ${thousands(range.max)} kcal`;
}

/** The ranges offered on the form, 300 kcal wide, in order. */
export const KCAL_RANGE_CHOICES: KcalRange[] = [1200, 1500, 1800, 2100, 2400, 2700, 3000].map((min) => ({ min, max: min + 300 }));

export const KCAL_OFF_LABEL = 'Off';

export function kcalChoiceLabels(): string[] {
  return [KCAL_OFF_LABEL, ...KCAL_RANGE_CHOICES.map(kcalRangeLabel)];
}

export function kcalRangeFromLabel(label: string): KcalRange | null {
  return KCAL_RANGE_CHOICES.find((range) => kcalRangeLabel(range) === label) ?? null;
}

// --- Under-eating ---------------------------------------------------------------

const UNDER_EATING_RISK: Record<string, string> = { celiac: 'celiac disease', ibd: 'IBD' };

/** The plan's conditions where eating too little is the larger risk, by name. */
export function underEatingConditions(conditionCodes: string[]): string[] {
  const names: string[] = [];
  for (const code of conditionCodes) {
    const name = UNDER_EATING_RISK[code];
    if (name && !names.includes(name)) names.push(name);
  }
  return names;
}

/** Whether the lean may pick lighter mains to stay under the top of a range. */
export function mayLeanLighter(conditionCodes: string[]): boolean {
  return underEatingConditions(conditionCodes).length === 0;
}

export function underEatingNote(conditionCodes: string[]): string | null {
  const names = underEatingConditions(conditionCodes);
  if (names.length === 0) return null;
  const named = names.length === 1 ? names[0] : `${names[0]} and ${names[1]}`;
  return (
    `With ${named} among the conditions this plan is made for, eating too little is often the larger risk, since ${names.length === 1 ? 'it' : 'both'} can make it harder to absorb what is eaten. ` +
    'So the plan only ever leans toward more food to reach the low end of a range, never toward less, and a calorie figure is one to work out with your gastroenterologist or a dietitian.'
  );
}

export const KCAL_CAPTION =
  'Off unless you choose a range. The plan leans each main dish toward the range, using the energy in the recipes as written; it is a lean rather than a promise, and the day says where it landed. ' +
  'A calorie figure is one to work out with your doctor or a dietitian.';

export const MACRO_CAPTION =
  `Says what share of each day's energy comes from protein, fat and carbohydrate, beside the ranges for adults (${MACRO_RANGE_SOURCE}): protein 10 to 35%, fat 20 to 35%, carbohydrate 45 to 65%. ` +
  'It reports where the day lands and does not change what is picked.';

// --- The lean -------------------------------------------------------------------

/**
 * What the next meal would carry if what is left of the range's middle were
 * shared evenly over the meals still to come, this one included. Null with
 * no range or no meals left.
 */
export function mealEnergyTarget(range: KcalRange | null, kcalSoFar: number, mealsLeft: number): number | null {
  if (!range || mealsLeft <= 0) return null;
  const middle = (range.min + range.max) / 2;
  return Math.max(0, middle - Math.max(0, kcalSoFar)) / mealsLeft;
}

/**
 * The half of `pool` nearer to `target` in energy, never fewer than one.
 * With `allowLighter` false the pool is narrowed only when the target sits
 * above the pool's middle dish, so the lean never goes toward less food.
 */
export function leanTowardEnergy<T>(pool: T[], kcalOf: (item: T) => number, target: number | null, allowLighter: boolean): T[] {
  if (target === null || pool.length < 2) return pool;
  const byEnergy = [...pool].sort((a, b) => kcalOf(a) - kcalOf(b));
  const middle = kcalOf(byEnergy[Math.floor((byEnergy.length - 1) / 2)]);
  if (!allowLighter && target <= middle) return pool;
  const nearer = [...pool].sort((a, b) => Math.abs(kcalOf(a) - target) - Math.abs(kcalOf(b) - target));
  return nearer.slice(0, Math.max(1, Math.ceil(nearer.length / 2)));
}

// --- What the day says -----------------------------------------------------------

const MACRO_RANGES = {
  protein: { label: 'Protein', min: 10, max: 35 },
  fat: { label: 'Fat', min: 20, max: 35 },
  carbohydrate: { label: 'Carbohydrate', min: 45, max: 65 },
} as const;

export type MacroShares = { protein: number; fat: number; carbohydrate: number };

/** Each macro's share of the energy from the three, in whole percent. Null with none. */
export function macroShares(totals: Record<string, number>): MacroShares | null {
  const protein = Math.max(0, totals.protein ?? 0) * 4;
  const fat = Math.max(0, totals.fat_total ?? 0) * 9;
  const carbohydrate = Math.max(0, totals.carbohydrate ?? 0) * 4;
  const sum = protein + fat + carbohydrate;
  if (!(sum > 0)) return null;
  return {
    protein: Math.round((protein / sum) * 100),
    fat: Math.round((fat / sum) * 100),
    carbohydrate: Math.round((carbohydrate / sum) * 100),
  };
}

/**
 * The lines under a planned day: where its energy landed against the range,
 * and its macro split against the adult ranges. `carbLevelSet` leaves
 * carbohydrate out of the range check and says why.
 */
export function energyLines(totals: Record<string, number>, setting: EnergySetting | null | undefined, carbLevelSet: boolean): string[] {
  if (!energySettingOn(setting)) return [];
  const lines: string[] = [];
  if (setting.kcal) {
    const kcal = totals.energy_kcal ?? 0;
    const range = kcalRangeLabel(setting.kcal);
    if (!(kcal > 0)) {
      lines.push(`The recipes on this day carry no energy figure, so the day could not be checked against ${range}.`);
    } else if (kcal < setting.kcal.min) {
      lines.push(`The day comes to about ${thousands(kcal)} kcal, ${thousands(setting.kcal.min - kcal)} under the ${range} you chose.`);
    } else if (kcal > setting.kcal.max) {
      lines.push(`The day comes to about ${thousands(kcal)} kcal, ${thousands(kcal - setting.kcal.max)} over the ${range} you chose.`);
    } else {
      lines.push(`The day comes to about ${thousands(kcal)} kcal, within the ${range} you chose.`);
    }
  }
  if (setting.macros) {
    const shares = macroShares(totals);
    if (!shares) {
      lines.push('The recipes on this day carry no protein, fat or carbohydrate figures, so the split could not be worked out.');
    } else {
      lines.push(`Energy from protein ${shares.protein}%, fat ${shares.fat}%, carbohydrate ${shares.carbohydrate}%.`);
      for (const key of ['protein', 'fat', 'carbohydrate'] as const) {
        if (key === 'carbohydrate' && carbLevelSet) continue;
        const range = MACRO_RANGES[key];
        const share = shares[key];
        if (share < range.min) lines.push(`${range.label} at ${share}% sits below the ${range.min} to ${range.max}% range.`);
        else if (share > range.max) lines.push(`${range.label} at ${share}% sits above the ${range.min} to ${range.max}% range.`);
      }
      if (carbLevelSet) lines.push('Carbohydrate is left out of the range check, since a carb level is set for this plan.');
    }
  }
  return lines;
}
