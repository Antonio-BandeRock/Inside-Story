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
