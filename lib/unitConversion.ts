// Converts a logged meal-ingredient quantity ("2 tbsp", "6 oz") into grams,
// which is what lib/nutrientAnalysis.ts's sumFoodNutrientTotals needs to
// scale a food's per-100g nutrient values.
//
// Mass units convert exactly -- no food-specific data needed, it's just
// unit math. Volume units genuinely need a food's density (g/mL) to become
// a weight, and that's where this stays deliberately narrow: a handful of
// real physical/food-science density constants cover liquids that are
// uniform enough across a whole category (water-based beverages, oils and
// fats). Solid foods measured by volume ("1 cup chopped broccoli", "1
// medium apple") vary far too much by cut, ripeness, and packing for a
// single constant to be honest -- USDA's own household-measure gram
// weights for those are empirically weighed per food, not computed from a
// formula, and this app doesn't have that data yet (a real future import
// target: USDA FoodData Central's food_portion table). Guessing a
// category-average density for solids would be exactly the kind of
// fabricated, uncited figure this project has deliberately avoided
// everywhere else -- so that case returns an explicit "not supported"
// result instead of a silently wrong number.

export type MassUnit = 'g' | 'kg' | 'oz' | 'lb';
// pint/quart/gallon added 2026-08-02, alongside the liquid-builders' own
// Units picker no longer branching on the person's profile measurement
// system (see BeverageBuilder.tsx's own unitsForSystem comment) -- real
// liquid quantities (a batch of kombucha, a jug of iced tea) commonly run
// past a single cup/liter. US customary values throughout, matching the
// fl_oz conversion already established here (not UK imperial, which uses a
// different fl oz).
export type VolumeUnit = 'ml' | 'l' | 'tsp' | 'tbsp' | 'fl_oz' | 'cup' | 'pint' | 'quart' | 'gallon';
export type MeasurementUnit = MassUnit | VolumeUnit;

export const MASS_UNITS: readonly MassUnit[] = ['g', 'kg', 'oz', 'lb'];
export const VOLUME_UNITS: readonly VolumeUnit[] = ['ml', 'l', 'tsp', 'tbsp', 'fl_oz', 'cup', 'pint', 'quart', 'gallon'];

function isMassUnit(unit: string): unit is MassUnit {
  return (MASS_UNITS as readonly string[]).includes(unit);
}

function isVolumeUnit(unit: string): unit is VolumeUnit {
  return (VOLUME_UNITS as readonly string[]).includes(unit);
}

const MASS_TO_GRAMS: Record<MassUnit, number> = {
  g: 1,
  kg: 1000,
  oz: 28.3495,
  lb: 453.592,
};

const VOLUME_TO_ML: Record<VolumeUnit, number> = {
  ml: 1,
  l: 1000,
  tsp: 4.92892,
  tbsp: 14.7868,
  fl_oz: 29.5735,
  cup: 236.588,
  pint: 473.176,
  quart: 946.353,
  gallon: 3785.41,
};

export type DensityClass = 'water_like' | 'oil_fat';

// Real, citable physical/food-science density constants -- deliberately
// the only two classes uniform enough to trust a single number across an
// entire food category.
const DENSITY_G_PER_ML: Record<DensityClass, number> = {
  water_like: 1.0, // water, juice, coffee/tea, milk, most beverages, diluted alcohol
  oil_fat: 0.92, // cooking oils and solid fats (butter, lard, shortening) cluster in a narrow ~0.90-0.92 g/mL band regardless of physical state at room temperature
};

// Only these `foods.category` values are uniform enough in density to
// resolve a densityClass automatically. Everything else (Veg, Fruit,
// Dairy, Meat, Grain, Sweets, etc.) genuinely mixes liquid and solid or
// varies too much by preparation -- the caller must pass an explicit
// densityClass or the food must be logged by weight instead.
const CATEGORY_DENSITY_CLASS: Record<string, DensityClass> = {
  Bev: 'water_like',
  Alcohol: 'water_like',
  Fats: 'oil_fat',
};

// Added 2026-08-10 for the Alcohol Content Calculator (lib/
// alcoholCalculator.ts) -- that feature needs to convert an ingredient's
// already-chosen quantity/unit (e.g. "1/2 cup") into milliliters, to
// prefill its own Volume field, without a second, hand-copied unit table.
// Deliberately narrower than convertToGrams: this only ever answers "how
// many mL," never needs a food's density, so it works for every volume
// unit unconditionally (unlike convertToGrams's own volume branch, which
// needs a densityClass first). Same normalization as lib/db.ts's own
// normalizeUnitForConversion (trim/lowercase/replace whitespace with
// underscore), so a builder's own "fl oz" (space) resolves the same way
// "fl_oz" does.
export function volumeToMl(amount: number, unit: string): number | null {
  const normalized = unit.trim().toLowerCase().replace(/\s+/g, '_');
  if (!isVolumeUnit(normalized)) return null;
  return amount * VOLUME_TO_ML[normalized];
}

export type GramConversionResult =
  | { ok: true; grams: number }
  | { ok: false; reason: 'unsupported_unit' | 'volume_needs_density' };

export function convertToGrams(
  amount: number,
  unit: MeasurementUnit,
  options: { densityClass?: DensityClass; foodCategory?: string } = {},
): GramConversionResult {
  if (isMassUnit(unit)) {
    return { ok: true, grams: amount * MASS_TO_GRAMS[unit] };
  }

  if (isVolumeUnit(unit)) {
    const densityClass = options.densityClass
      ?? (options.foodCategory ? CATEGORY_DENSITY_CLASS[options.foodCategory] : undefined);

    if (!densityClass) {
      return { ok: false, reason: 'volume_needs_density' };
    }

    const milliliters = amount * VOLUME_TO_ML[unit];
    return { ok: true, grams: milliliters * DENSITY_G_PER_ML[densityClass] };
  }

  return { ok: false, reason: 'unsupported_unit' };
}
