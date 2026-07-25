// Rough, explicitly-a-range estimate of fluid and electrolyte (sodium,
// potassium) loss from a workout's duration and intensity -- ties exercise
// logging into the electrolyte/hydration content already built in
// scripts/build_food_reference_db.py's nutrient_interactions and
// nutrient_system_effects tables (sodium/hydration via ADH, magnesium's
// role in the Na+/K+ pump, potassium and cardiac rhythm).
//
// Sweat rate and sweat electrolyte concentration are both genuinely,
// heavily individual -- documented sweat sodium concentration alone spans
// roughly 230-2,070 mg/L between people (Baker 2017), a nearly 9x range.
// This module intentionally returns a low/high band, not a single number,
// and every consumer of this data should present it as "a rough estimate,
// not a measurement" -- the only way to know an individual's actual sweat
// electrolyte loss is a real sweat test, which this app doesn't attempt to
// replace.

export type ExerciseIntensity = 'light' | 'moderate' | 'vigorous';

export type EstimateRange = { low: number; high: number };

export type SweatElectrolyteEstimate = {
  sweatVolumeLiters: EstimateRange;
  sodiumMg: EstimateRange;
  potassiumMg: EstimateRange;
  // Always surface this alongside the numbers -- individual sweat rate and
  // composition varies enormously (heat/humidity, fitness/heat
  // acclimation, sex, genetics, diet); these bands are illustrative, not
  // individualized.
  disclosure: string;
};

const DISCLOSURE =
  'Rough estimate based on typical ranges for this exercise intensity -- individual sweat rate and ' +
  'sodium/potassium concentration vary enormously between people (documented sweat sodium alone spans ' +
  'roughly 230-2,070 mg/L). Treat this as a ballpark, not a measurement.';

// Approximate sweat rate bands by intensity (liters/hour). General
// consensus ranges from ACSM/sports-medicine hydration guidance (e.g.
// Korey Stringer Institute); ACSM specifically notes sweat rates above
// ~2 L/hour are common in intense exercise and exceed what the stomach can
// realistically absorb during activity (~1.2 L/hour).
// Citation: American College of Sports Medicine position stand, "Exercise
// and Fluid Replacement," Med Sci Sports Exerc. 1996 (updated 2007).
const SWEAT_RATE_L_PER_HOUR: Record<ExerciseIntensity, EstimateRange> = {
  light: { low: 0.3, high: 0.5 },
  moderate: { low: 0.5, high: 1.0 },
  vigorous: { low: 1.0, high: 2.0 },
};

// Sweat sodium concentration rises with exercise intensity: documented
// averages were roughly 700 mg/L (30.6 mmol/L) at low intensity vs roughly
// 1,135 mg/L (49.4 mmol/L) at high intensity, inside a documented overall
// range of about 230-2,070 mg/L across individuals.
// Citation: Baker LB, "Sweating Rate and Sweat Sodium Concentration in
// Athletes: A Review of Methodology and Intra/Interindividual Variability,"
// Sports Med. 2017;47(Suppl 1):111-128.
const SWEAT_SODIUM_MG_PER_L: Record<ExerciseIntensity, EstimateRange> = {
  light: { low: 400, high: 800 },
  moderate: { low: 600, high: 1100 },
  vigorous: { low: 800, high: 1500 },
};

// Sweat potassium concentration is much less intensity-dependent than
// sodium in the available literature, so a single band is used across all
// intensities rather than one per tier.
// Citation: Baker LB, Sports Med. 2017;47(Suppl 1):111-128.
const SWEAT_POTASSIUM_MG_PER_L: EstimateRange = { low: 160, high: 320 };

export function estimateSweatElectrolyteLoss(input: {
  durationMinutes: number;
  intensity: ExerciseIntensity;
}): SweatElectrolyteEstimate {
  const hours = input.durationMinutes / 60;
  const rate = SWEAT_RATE_L_PER_HOUR[input.intensity];
  const sodiumConcentration = SWEAT_SODIUM_MG_PER_L[input.intensity];

  const volumeLow = rate.low * hours;
  const volumeHigh = rate.high * hours;

  return {
    sweatVolumeLiters: { low: volumeLow, high: volumeHigh },
    sodiumMg: { low: volumeLow * sodiumConcentration.low, high: volumeHigh * sodiumConcentration.high },
    potassiumMg: {
      low: volumeLow * SWEAT_POTASSIUM_MG_PER_L.low,
      high: volumeHigh * SWEAT_POTASSIUM_MG_PER_L.high,
    },
    disclosure: DISCLOSURE,
  };
}

function isExerciseIntensity(value: string | null): value is ExerciseIntensity {
  return value === 'light' || value === 'moderate' || value === 'vigorous';
}

// Convenience wrapper for an already-logged exercise_logs row -- returns
// null when duration or a recognized intensity weren't recorded, rather
// than guessing either.
export function estimateSweatElectrolyteLossForExercise(exercise: {
  durationMinutes: number | null;
  intensity: string | null;
}): SweatElectrolyteEstimate | null {
  if (!exercise.durationMinutes || !isExerciseIntensity(exercise.intensity)) return null;
  return estimateSweatElectrolyteLoss({ durationMinutes: exercise.durationMinutes, intensity: exercise.intensity });
}
