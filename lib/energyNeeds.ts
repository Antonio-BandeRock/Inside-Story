// Pure computation layer for a person's own estimated energy and portion
// needs -- BMR via the Mifflin-St Jeor equation, TDEE via a real
// activity-level multiplier, and macro targets built from real body weight
// (protein) plus NASEM's own AMDR ranges (fat/carbohydrate), plus USDA
// MyPlate's own cup-equivalent produce guidance scaled to the person's real
// calorie need. No DB/React dependency -- same "pure, trivially testable"
// shape as lib/nutrientAnalysis.ts; the caller (Insights' own Energy &
// Portions lens) supplies real profile/weight data and decides how to
// display or compare the result.
//
// Real sources this leans on, cited again in the companion Digest entries
// (Portions & Recommended Amounts):
// - BMR: Mifflin MD, St Jeor ST, Hill LA, Scott BJ, Daugherty SA, Koh YO.
//   "A new predictive equation for resting energy expenditure in healthy
//   individuals." Am J Clin Nutr. 1990;51(2):241-7.
// - Activity multipliers: the Physical Activity Level (PAL) framework from
//   FAO/WHO/UNU "Human Energy Requirements" (2001), applied to BMR the same
//   way most clinical dietetics practice already does.
// - Macronutrient percentage ranges (AMDR): NASEM's own 2002/2005 Dietary
//   Reference Intakes for Energy, Carbohydrate, Fiber, Fat, Fatty Acids,
//   Cholesterol, Protein, and Amino Acids report -- the same report already
//   cited for this app's fiber AI rows and its own existing
//   'portion-protein-real-need' Digest entry.
// - Protein-by-activity targets: Bauer J, et al. "Evidence-based
//   recommendations for optimal dietary protein intake in older people: a
//   position paper from the PROT-AGE Study Group." J Am Med Dir Assoc.
//   2013;14(8):542-59 (1.0-1.2 g/kg for general healthy-adult benefit,
//   already the same range this app's own protein Digest entry names);
//   Jäger R, et al. "International Society of Sports Nutrition Position
//   Stand: protein and exercise." J Int Soc Sports Nutr. 2017;14:20
//   (1.4-2.0 g/kg for regularly exercising adults, grounds the higher end
//   used for Very Active/Extra Active here).
// - Produce portions: USDA MyPlate's own published cup-equivalent amounts
//   at the 2,000-kcal reference level (2 cups fruit, 2.5 cups vegetables),
//   scaled proportionally to a person's own real TDEE -- deliberately not
//   backed out of a calorie percentage, which doesn't hold up for foods
//   this calorie-sparse and variable.
//
// Every condition-specific override lives in CONDITION_PROTEIN_OVERRIDES
// below, reusing figures already published and cited in this app's own
// Digest content (lib/ckdStageAdvisory.ts,
// lib/digest/chronicKidneyDisease.ts) rather than re-deriving them --
// currently just CKD's own pre-dialysis/on-dialysis reversal, the one
// condition this app has already built real, food-relevant staging for
// with a documented macro-specific number attached.
//
// Deliberately does NOT include a weight-loss/weight-gain deficit or
// surplus layer -- TDEE here always means maintenance calories. This app's
// own Digest content already covers real risk around aggressive
// restriction and cortisol/HPA-axis disruption in an autoimmune
// population, so a deliberate deficit/surplus feature needs its own
// careful pass, not something folded in blind alongside this one.

export type Sex = 'male' | 'female';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very_active' | 'extra_active';

export const ACTIVITY_LEVELS: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'very_active', 'extra_active'];

export type ActivityLevelInfo = {
  label: string;
  description: string;
  palMultiplier: number;
  // A per-kilogram protein target scaled with activity level -- see this
  // file's own header comment for where each number comes from.
  // Deliberately starts at the population RDA (0.8 g/kg) for Sedentary
  // rather than assuming everyone needs more than the bare minimum.
  proteinGramsPerKg: number;
};

export const ACTIVITY_LEVEL_INFO: Record<ActivityLevel, ActivityLevelInfo> = {
  sedentary: {
    label: 'Sedentary',
    description: 'Little to no exercise',
    palMultiplier: 1.2,
    proteinGramsPerKg: 0.8,
  },
  light: {
    label: 'Lightly Active',
    description: 'Light exercise 1-3 days a week',
    palMultiplier: 1.375,
    proteinGramsPerKg: 1.0,
  },
  moderate: {
    label: 'Moderately Active',
    description: 'Moderate exercise 3-5 days a week',
    palMultiplier: 1.55,
    proteinGramsPerKg: 1.2,
  },
  very_active: {
    label: 'Very Active',
    description: 'Hard exercise 6-7 days a week',
    palMultiplier: 1.725,
    proteinGramsPerKg: 1.6,
  },
  extra_active: {
    label: 'Extra Active',
    description: 'Very hard exercise, a physical job, or training twice a day',
    palMultiplier: 1.9,
    proteinGramsPerKg: 1.6,
  },
};

// Mifflin-St Jeor -- weight in kg, height in cm, age in whole years.
export function calculateBmr(sex: Sex, weightKg: number, heightCm: number, ageYears: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return sex === 'male' ? base + 5 : base - 161;
}

export function calculateTdee(bmr: number, activityLevel: ActivityLevel): number {
  return bmr * ACTIVITY_LEVEL_INFO[activityLevel].palMultiplier;
}

// A real, food-relevant condition override for the activity-based protein
// default above. Checked against declaredConditionStages (the same
// Record<conditionCode, stageCode> shape lib/db.ts's own getConditionStages
// already returns) in order -- the first match wins, since a person is
// only expected to declare one CKD stage at a time.
export type ConditionProteinOverride = {
  conditionCode: string;
  stageCode: string;
  gramsPerKg: number;
  note: string;
};

export const CONDITION_PROTEIN_OVERRIDES: ConditionProteinOverride[] = [
  {
    conditionCode: 'chronic_kidney_disease',
    stageCode: 'pre_dialysis',
    gramsPerKg: 0.7,
    note: 'Using 0.7 g/kg, the midpoint of the 0.6-0.8 g/kg/day protein ceiling most pre-dialysis CKD guidance recommends, in place of your activity-based default. A renal dietitian can set your own exact target.',
  },
  {
    conditionCode: 'chronic_kidney_disease',
    stageCode: 'on_dialysis',
    gramsPerKg: 1.2,
    note: 'Using 1.2 g/kg. Dialysis itself removes protein that needs replacing, so the pre-dialysis ceiling above no longer applies once dialysis starts. See the Chronic Kidney Disease category in Digest for the full reversal.',
  },
];

export type ProteinTarget = {
  gramsPerKg: number;
  gramsPerDay: number;
  source: 'activity' | 'condition';
  note: string | null;
};

export function resolveProteinTarget(
  activityLevel: ActivityLevel,
  weightKg: number,
  declaredConditionStages: Record<string, string>,
): ProteinTarget {
  for (const override of CONDITION_PROTEIN_OVERRIDES) {
    if (declaredConditionStages[override.conditionCode] === override.stageCode) {
      return {
        gramsPerKg: override.gramsPerKg,
        gramsPerDay: override.gramsPerKg * weightKg,
        source: 'condition',
        note: override.note,
      };
    }
  }
  const gramsPerKg = ACTIVITY_LEVEL_INFO[activityLevel].proteinGramsPerKg;
  return { gramsPerKg, gramsPerDay: gramsPerKg * weightKg, source: 'activity', note: null };
}

const KCAL_PER_G_PROTEIN = 4;
const KCAL_PER_G_CARB = 4;
const KCAL_PER_G_FAT = 9;

// NASEM's own AMDR midpoints (fat 20-35%, carbohydrate 45-65%), applied to
// whatever calories are left once the real, weight-based protein target is
// subtracted -- not applied to total calories directly, since protein
// already claims a real share of the day and the three have to sum to
// exactly 100% of it, not float independently.
const AMDR_FAT_MIDPOINT = 0.275;
const AMDR_CARB_MIDPOINT = 0.55;

export type MacroTargets = {
  calories: number;
  proteinGrams: number;
  proteinSource: 'activity' | 'condition';
  proteinNote: string | null;
  proteinCalories: number;
  fatGrams: number;
  fatCalories: number;
  carbGrams: number;
  carbCalories: number;
};

export function calculateMacroTargets(
  calories: number,
  activityLevel: ActivityLevel,
  weightKg: number,
  declaredConditionStages: Record<string, string>,
): MacroTargets {
  const protein = resolveProteinTarget(activityLevel, weightKg, declaredConditionStages);
  const proteinCalories = protein.gramsPerDay * KCAL_PER_G_PROTEIN;
  const remainderCalories = Math.max(0, calories - proteinCalories);
  const fatShareOfRemainder = AMDR_FAT_MIDPOINT / (AMDR_FAT_MIDPOINT + AMDR_CARB_MIDPOINT);
  const fatCalories = remainderCalories * fatShareOfRemainder;
  const carbCalories = remainderCalories - fatCalories;

  return {
    calories,
    proteinGrams: protein.gramsPerDay,
    proteinSource: protein.source,
    proteinNote: protein.note,
    proteinCalories,
    fatGrams: fatCalories / KCAL_PER_G_FAT,
    fatCalories,
    carbGrams: carbCalories / KCAL_PER_G_CARB,
    carbCalories,
  };
}

// USDA MyPlate's own real, published cup-equivalent amounts at the
// 2,000-kcal reference level, scaled proportionally to this person's real
// TDEE.
const MYPLATE_REFERENCE_CALORIES = 2000;
const MYPLATE_REFERENCE_FRUIT_CUPS = 2;
const MYPLATE_REFERENCE_VEGETABLE_CUPS = 2.5;

export type ProduceTargets = {
  fruitCups: number;
  vegetableCups: number;
};

export function calculateProduceTargets(calories: number): ProduceTargets {
  const scale = calories / MYPLATE_REFERENCE_CALORIES;
  return {
    fruitCups: MYPLATE_REFERENCE_FRUIT_CUPS * scale,
    vegetableCups: MYPLATE_REFERENCE_VEGETABLE_CUPS * scale,
  };
}

// Splits any daily total evenly across a number of meals -- the honest
// version of "per-meal budget": a plain even split, not an attempt to model
// a person's own real, uneven distribution across the day (a bigger
// breakfast, a lighter dinner) that this app has no data to personalize yet.
export function perMealShare(dailyAmount: number, mealsPerDay: number): number {
  if (mealsPerDay <= 0) return dailyAmount;
  return dailyAmount / mealsPerDay;
}
