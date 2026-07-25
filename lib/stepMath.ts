// Pure step-counting math: distance and calorie estimates from a step
// count plus how long it took. No DB/React/device dependency -- the actual
// step count comes from lib/pedometer.ts (device sensor) or manual entry,
// this module only does the arithmetic on top of it.
//
// Every formula here is a real, citable estimate, not a fabricated
// constant -- and every result is explicitly an estimate, since none of
// these figures (stride length from height, MET from walking cadence) are
// exact for any one individual.

export type Sex = 'male' | 'female';

// Height-based stride estimate: step length (not full stride -- see note
// below) = height x 0.415 for men, x 0.413 for women. This ratio is
// dimensionless, so it applies directly to a height in cm without unit
// conversion. Consistent with ACSM-referenced pedometer methodology and
// widely used in exercise-science step-length estimation.
//
// "Stride length" in gait terminology is two steps (left + right); what
// this function returns is STEP length, which is what you multiply
// directly by a step COUNT to get distance -- using true stride length
// with a step count would double the distance.
export function estimateStepLengthCm(heightCm: number, sex: Sex): number {
  const multiplier = sex === 'male' ? 0.415 : 0.413;
  return heightCm * multiplier;
}

export function estimateDistanceKm(steps: number, stepLengthCm: number): number {
  return (steps * stepLengthCm) / 100_000;
}

export type CadenceIntensity = 'light' | 'moderate' | 'vigorous';

// Tudor-Locke's cadence-based intensity thresholds, validated in both
// 21-40 and 41-60 year-old adults: ~100 steps/min is the heuristic for
// moderate intensity (~3 METs), ~130 steps/min for vigorous (~6 METs).
// Citation: Tudor-Locke C et al., "How fast is fast enough? Walking
// cadence (steps/min) as a practical estimate of intensity in adults: a
// narrative review," Br J Sports Med. 2018; CADENCE-adults studies,
// Int J Behav Nutr Phys Act. 2019/2020.
const MODERATE_CADENCE_THRESHOLD = 100;
const VIGOROUS_CADENCE_THRESHOLD = 130;

export function classifyCadence(stepsPerMinute: number): CadenceIntensity {
  if (stepsPerMinute >= VIGOROUS_CADENCE_THRESHOLD) return 'vigorous';
  if (stepsPerMinute >= MODERATE_CADENCE_THRESHOLD) return 'moderate';
  return 'light';
}

// Within the validated 100-130+ steps/min range, each +10 steps/min was
// associated with roughly +1 MET (100/min=3 METs, 110=4, 120=5, 130=6) --
// same Tudor-Locke citation as classifyCadence. Returns null below 100
// steps/min rather than extrapolating a formula outside the range it was
// actually studied in; callers should fall back to a flat light-intensity
// MET estimate for slower cadences (see LIGHT_INTENSITY_MET_FALLBACK).
export function estimateMetsFromCadence(stepsPerMinute: number): number | null {
  if (stepsPerMinute < MODERATE_CADENCE_THRESHOLD) return null;
  const mets = 3 + (stepsPerMinute - MODERATE_CADENCE_THRESHOLD) / 10;
  return Math.min(mets, 12); // cap -- cadence-MET linearity wasn't validated into sprinting territory
}

// Slow/leisurely walking (<100 steps/min) approximate MET value, used as
// the fallback when estimateMetsFromCadence returns null. Consistent with
// the Compendium of Physical Activities' slow-walking entries (roughly
// 2.0-2.8 METs for walking under ~2.5 mph).
// Citation: Herrmann SD et al., "2024 Adult Compendium of Physical
// Activities," (updates Ainsworth BE et al. 2011).
const LIGHT_INTENSITY_MET_FALLBACK = 2.3;

export type CalorieEstimate = {
  calories: number;
  metsUsed: number;
  cadenceStepsPerMinute: number;
};

// Standard exercise-physiology calorie formula: Calories = METs x weight
// (kg) x duration (hours). Returns null if weight or duration are missing
// /zero -- rather than silently guessing a default body weight, this
// should prompt the caller to ask the person to log a weight first (see
// body_measurements).
export function estimateCaloriesFromSteps(input: {
  steps: number;
  durationMinutes: number;
  weightKg: number | null;
}): CalorieEstimate | null {
  if (!input.weightKg || input.durationMinutes <= 0) return null;

  const cadenceStepsPerMinute = input.steps / input.durationMinutes;
  const metsUsed = estimateMetsFromCadence(cadenceStepsPerMinute) ?? LIGHT_INTENSITY_MET_FALLBACK;
  const calories = metsUsed * input.weightKg * (input.durationMinutes / 60);

  return { calories, metsUsed, cadenceStepsPerMinute };
}
