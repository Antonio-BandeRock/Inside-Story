import type { DietaryReferenceIntake, FoodNutrient } from './db';

// Pure computation layer: given what a meal (or a whole day) actually
// contains, plus a resolved set of Dietary Reference Intakes for one
// person's sex/age, works out where that intake stands against the
// medical-consensus target for each nutrient -- the "is anything missing,
// and is fixing it through food realistic, or does a supplement need to
// cover the gap" analysis the app is meant to do on the user's behalf.
// Deliberately has no dependency on SQLite/React -- callers in lib/db.ts
// and the UI supply already-resolved data, so this stays trivially testable.

export type NutrientIntakeItem = {
  // Grams of the food actually consumed -- unit-to-grams conversion (cups,
  // ounces, etc. -> grams) is a separate, not-yet-built piece; callers must
  // supply grams already.
  gramsConsumed: number;
  nutrients: Pick<FoodNutrient, 'code' | 'amountPer100g'>[];
};

// Sums per-100g nutrient values across every ingredient in a meal (or every
// meal in a day), scaled by how much of each was actually eaten. Purely
// additive -- nutrients don't interact with each other at the summation
// stage, only later when compared against a DRI (that comparison is what
// analyzeNutrientIntake below is for).
export function sumFoodNutrientTotals(items: NutrientIntakeItem[]): Record<string, number> {
  const totals: Record<string, number> = {};

  for (const item of items) {
    const scale = item.gramsConsumed / 100;
    for (const nutrient of item.nutrients) {
      totals[nutrient.code] = (totals[nutrient.code] ?? 0) + nutrient.amountPer100g * scale;
    }
  }

  return totals;
}

export type NutrientStatus = 'deficient' | 'low' | 'adequate' | 'excess_risk' | 'within_limit';

// The same green/yellow/red severity language used across the whole app
// for status coloring (see lib/sixDimensionsReference.ts's tierSeverity
// for the D1-D6 rubric's own version) -- 'low' is the one genuinely
// in-between state (a real but mild shortfall, worth watching rather than
// alarming about); 'deficient' and 'excess_risk' are both real problems
// worth the same red regardless of which direction they're wrong in.
export type StatusSeverity = 'green' | 'yellow' | 'red';

export function nutrientStatusSeverity(status: NutrientStatus): StatusSeverity {
  if (status === 'deficient' || status === 'excess_risk') return 'red';
  if (status === 'low') return 'yellow';
  return 'green';
}

export type NutrientGapEntry = {
  nutrientCode: string;
  displayName: string;
  unit: string;
  fromFood: number;
  fromSupplements: number;
  combinedTotal: number;
  target: number;
  targetType: DietaryReferenceIntake['valueType'];
  upperLimit: number | null;
  // NaN when target is 0 (shouldn't happen with real DRI data, guarded anyway).
  percentOfTarget: number;
  status: NutrientStatus;
  sourceAgency: string;
  citation: string | null;
  notes: string | null;
};

const DEFICIENT_THRESHOLD = 0.5;
const LOW_THRESHOLD = 0.9;

// These four nutrients' upper limits are, per NASEM's own guidance (see
// each one's `notes` in dietary_reference_intakes), only meaningful for
// supplement/fortified/pharmacological intake -- not food naturally eaten.
// A normal varied diet routinely exceeds these thresholds from food alone
// with no actual safety concern (magnesium from nuts/greens, niacin and
// folate from whole grains/greens, vitamin E from nuts/oils), so only the
// supplement contribution is checked against them here, not the combined
// total. (vitamin_a's UL has a similar food/supplement split -- it applies
// to preformed retinol, not plant carotenoids -- but this app's food data
// reports vitamin A as a single RAE-converted total that already mixes
// both, so that one can't be split out with the data available; it's still
// checked against combinedTotal, which will over-flag a carotenoid-heavy
// diet until the food data separates the two.)
const UPPER_LIMIT_SUPPLEMENT_ONLY = new Set(['magnesium', 'folate_b9', 'niacin_b3', 'vitamin_e']);

// The core gap analysis: for every nutrient with a known DRI, combines food
// + supplement intake and classifies it. Sodium (the one CDRR/ceiling-type
// row) is inverted on purpose -- for every other nutrient "more" moves
// toward adequate, but for sodium "more" moves toward excess_risk.
export function analyzeNutrientIntake(
  driRows: DietaryReferenceIntake[],
  foodTotals: Record<string, number>,
  supplementTotals: Record<string, number> = {},
): NutrientGapEntry[] {
  return driRows.map((dri) => {
    const fromFood = foodTotals[dri.nutrientCode] ?? 0;
    const fromSupplements = supplementTotals[dri.nutrientCode] ?? 0;
    const combinedTotal = fromFood + fromSupplements;
    const percentOfTarget = dri.amount > 0 ? (combinedTotal / dri.amount) * 100 : NaN;
    const upperLimitCheckAmount = UPPER_LIMIT_SUPPLEMENT_ONLY.has(dri.nutrientCode) ? fromSupplements : combinedTotal;

    let status: NutrientStatus;
    if (dri.valueType === 'CDRR') {
      status = combinedTotal > dri.amount ? 'excess_risk' : 'within_limit';
    } else if (dri.upperLimit != null && upperLimitCheckAmount > dri.upperLimit) {
      status = 'excess_risk';
    } else if (percentOfTarget < DEFICIENT_THRESHOLD * 100) {
      status = 'deficient';
    } else if (percentOfTarget < LOW_THRESHOLD * 100) {
      status = 'low';
    } else {
      status = 'adequate';
    }

    return {
      nutrientCode: dri.nutrientCode,
      displayName: dri.displayName,
      unit: dri.unit,
      fromFood,
      fromSupplements,
      combinedTotal,
      target: dri.amount,
      targetType: dri.valueType,
      upperLimit: dri.upperLimit,
      percentOfTarget,
      status,
      sourceAgency: dri.sourceAgency,
      citation: dri.citation,
      notes: dri.notes,
    };
  });
}

// Convenience filters for the two questions the user actually asked: "is
// anything missing" and "are we at risk of too much."
export function findNutrientGaps(entries: NutrientGapEntry[]): NutrientGapEntry[] {
  return entries.filter((entry) => entry.status === 'deficient' || entry.status === 'low');
}

export function findExcessRisks(entries: NutrientGapEntry[]): NutrientGapEntry[] {
  return entries.filter((entry) => entry.status === 'excess_risk');
}
