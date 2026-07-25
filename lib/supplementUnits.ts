// Converts a supplement label's amount+unit into whatever unit this app's
// own food/DRI data already uses for that nutrient (see the `nutrients`
// table's `unit` column), so a supplement's contribution can be added
// directly to a food total instead of silently comparing mismatched units
// -- the same class of bug the copper RDA row briefly had before it was
// unit-matched against `nutrients`.

export type NormalizedSupplementAmount =
  | { ok: true; amount: number }
  | { ok: false; reason: 'iu_conversion_unavailable' | 'unknown_unit' | 'unit_mismatch' };

function baseUnitToken(unit: string): string {
  return unit.trim().split(/\s+/)[0].toLowerCase();
}

const MASS_UNIT_ALIASES: Record<string, 'g' | 'mg' | 'µg'> = {
  g: 'g',
  gram: 'g',
  grams: 'g',
  mg: 'mg',
  milligram: 'mg',
  milligrams: 'mg',
  mcg: 'µg',
  'µg': 'µg',
  ug: 'µg',
  microgram: 'µg',
  micrograms: 'µg',
};

const MASS_TO_MG: Record<'g' | 'mg' | 'µg', number> = { g: 1000, mg: 1, 'µg': 0.001 };

// Official FDA/USP International Unit -> mass conversion factors.
// Deliberately short -- only nutrients with one unambiguous, universally
// agreed factor are listed. Vitamin E is intentionally omitted: its IU
// value depends on whether the product uses natural (d-alpha-tocopherol,
// 1 IU = 0.67 mg) or synthetic (dl-alpha-tocopherol, 1 IU = 0.45 mg)
// tocopherol, so silently picking one would misrepresent whatever the
// label actually means -- callers get iu_conversion_unavailable instead.
const IU_TO_MG: Partial<Record<string, { mgPerIU: number; citation: string }>> = {
  vitamin_d: { mgPerIU: 0.000025, citation: '1 IU vitamin D2/D3 = 0.025 mcg (FDA 21 CFR 101.9 / USP).' },
  vitamin_a: {
    mgPerIU: 0.0003,
    citation: '1 IU preformed vitamin A (retinol) = 0.3 mcg RAE (FDA); does not apply to beta-carotene-sourced IU.',
  },
};

export function normalizeSupplementAmount(
  nutrientCode: string,
  amount: number,
  labelUnit: string,
  canonicalUnit: string,
): NormalizedSupplementAmount {
  const canonicalMassUnit = MASS_UNIT_ALIASES[baseUnitToken(canonicalUnit)];

  if (baseUnitToken(labelUnit).toUpperCase() === 'IU' || labelUnit.trim().toUpperCase() === 'IU') {
    const conversion = IU_TO_MG[nutrientCode];
    if (!conversion) {
      return { ok: false, reason: 'iu_conversion_unavailable' };
    }
    if (!canonicalMassUnit) {
      return { ok: false, reason: 'unit_mismatch' };
    }
    const amountInMg = amount * conversion.mgPerIU;
    return { ok: true, amount: amountInMg / MASS_TO_MG[canonicalMassUnit] };
  }

  const labelMassUnit = MASS_UNIT_ALIASES[baseUnitToken(labelUnit)];
  if (labelMassUnit && canonicalMassUnit) {
    const amountInMg = amount * MASS_TO_MG[labelMassUnit];
    return { ok: true, amount: amountInMg / MASS_TO_MG[canonicalMassUnit] };
  }

  return { ok: false, reason: 'unknown_unit' };
}
