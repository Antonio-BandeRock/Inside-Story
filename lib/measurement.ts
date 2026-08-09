import * as Localization from 'expo-localization';

export type MeasurementSystem = 'metric' | 'imperial';

// The only countries where imperial (not metric) is the everyday standard.
const IMPERIAL_REGIONS = new Set(['US', 'LR', 'MM']);

export function detectMeasurementSystemFromLocale(): MeasurementSystem {
  const regionCode = Localization.getLocales()[0]?.regionCode;
  return regionCode && IMPERIAL_REGIONS.has(regionCode) ? 'imperial' : 'metric';
}

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches - feet * 12);
  // Rounding inches up to 12 (e.g. 5'12") should carry into the next foot.
  return inches === 12 ? { feet: feet + 1, inches: 0 } : { feet, inches };
}

export function feetInchesToCm(feet: number, inches: number): number {
  return (feet * 12 + inches) * 2.54;
}

// 2026-08-09, added for Profile's own new Weight field -- derived from the
// exact same real grams-per-pound figure lib/unitConversion.ts's own
// MASS_TO_GRAMS already uses (453.592) rather than a second, independently
// sourced decimal, so the two files can never disagree by a rounding
// difference on the same real conversion.
const GRAMS_PER_KG = 1000;
const GRAMS_PER_LB = 453.592;
const KG_TO_LB = GRAMS_PER_KG / GRAMS_PER_LB;

export function kgToLb(kg: number): number {
  return kg * KG_TO_LB;
}

export function lbToKg(lb: number): number {
  return lb / KG_TO_LB;
}

// Every "how much" pill picker in the Food tab's builders (Servings,
// Serving Size, per-ingredient Quantity) shows fractions as home cooking
// actually talks about them ("a quarter cup," not "0.25 cup") -- see
// SideBuilder.tsx's own AMOUNT_PICKER_VALUES for why. That's purely a
// display/entry format; anywhere the value needs to be stored or used in
// real math (saving a side, a future nutrient calculation) needs a plain
// number instead. Only ever needs to handle a single "n/d" fraction or a
// bare integer -- the picker never offers anything more complex (no mixed
// numbers like "1 1/2") -- so this doesn't try to be a general fraction
// parser.
export function parseAmountValue(value: string): number {
  const [numerator, denominator] = value.split('/');
  return denominator ? Number(numerator) / Number(denominator) : Number(numerator);
}
