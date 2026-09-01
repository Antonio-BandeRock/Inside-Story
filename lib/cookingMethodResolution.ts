// Which reference-database row a builder ingredient should actually be
// scored against, given how the person said they were going to cook it.
//
// 2026-09-01, from a direct observation: "Broccoli (boiled) nutrients aren't
// going to be tallied the same as raw. It can't be used for their nutrient
// value unless they actually boil it and tell the app that they boiled it."
//
// The bug underneath that: every builder asks about preparation twice, in two
// different vocabularies, and only one of the two answers affects any data.
// FoodLookup's own prep picker chooses the reference row, which is what
// nutrients and condition scores are read from. The builder's separate Cook
// Prep field is stored beside it as description and read by nothing. So an
// ingredient picked as "Broccoli (raw)" and then marked Boiled kept raw
// nutrients on a boiled dish, silently, with both answers visible on screen
// and disagreeing.
//
// This module holds the pure half: what a builder's cooking word means in
// terms of the reference database's own prep_method vocabulary. The lookup
// that acts on it is resolveFoodForCookingMethod in lib/db.ts.

// What the stated cooking method implies about which row to use.
//
// 'unconstrained' is a real answer rather than a gap: 'N/A' genuinely says
// nothing, and a few methods ('Fermented', 'Chilled/Frozen') have no honest
// counterpart in this database's prep vocabulary. Forcing those toward a
// cooked row would be inventing a claim, so they leave the row alone.
export type CookingMethodIntent = 'raw' | 'cooked' | 'unconstrained';

// Maps each builder's own cooking word to the prep_method this database
// actually uses. The 11 builders each carry their own COOKING_METHODS list
// (a fermentation has 'Fermented', a soup has 'Simmered', a sauce has
// 'Reduced'), so this covers the union of all of them rather than any single
// builder's list.
//
// Three of these are deliberate approximations rather than exact matches,
// named here rather than left to be discovered: 'Simmered' and 'Reduced' both
// map to Boiled, because both are food held in liquid at heat and this
// database has no separate row for either; 'Toasted' maps to Baked as the
// nearest dry-heat method. All three only decide which cooked row is
// PREFERRED, and any cooked row is the fallback regardless, so the cost of
// getting one of them slightly wrong is small. That fallback rests on a
// finding already verified on 2026-08-27: every ingredient checked scored
// identically across its own non-Raw variants.
const COOKED_METHOD_TO_PREP: Record<string, string> = {
  'sautéed': 'Fried',
  'sauteed': 'Fried',
  'pan-fried': 'Fried',
  'deep-fried': 'Fried',
  'stir-fried': 'Fried',
  steamed: 'Steamed',
  boiled: 'Boiled',
  simmered: 'Boiled',
  reduced: 'Boiled',
  baked: 'Baked',
  toasted: 'Baked',
  roasted: 'Roasted',
  grilled: 'Grilled',
};

export function cookingMethodIntent(cookingMethod: string | null | undefined): CookingMethodIntent {
  const key = (cookingMethod ?? '').trim().toLowerCase();
  if (!key || key === 'n/a') return 'unconstrained';
  if (key === 'raw') return 'raw';
  if (COOKED_METHOD_TO_PREP[key]) return 'cooked';
  return 'unconstrained';
}

// The prep_method to try first for a cooked method, or null where the method
// is not one this maps.
export function preferredPrepMethodFor(cookingMethod: string | null | undefined): string | null {
  const key = (cookingMethod ?? '').trim().toLowerCase();
  return COOKED_METHOD_TO_PREP[key] ?? null;
}

// A row with no prep_method at all, or one tagged Raw, is raw for this
// purpose. 10,750 visible rows in this database carry no prep_method, so
// treating an untagged row as "not raw" would send most foods hunting for a
// cooked variant that does not exist.
export function isRawPrepMethod(prepMethod: string | null | undefined): boolean {
  const key = (prepMethod ?? '').trim().toLowerCase();
  return key === '' || key === 'raw' || key === 'unprepared';
}

// Says plainly when the numbers being used describe a different preparation
// from the one the person stated. Returns null when the two agree, so a
// caller renders nothing rather than reassurance nobody needs.
//
// Deliberately narrower than the row-selection rule above. It fires only
// when the row is EXPLICITLY tagged raw and the person said they were
// cooking, which is a real contradiction between two things the database
// does distinguish. A row with no prep_method at all is not claiming to be
// raw, it is a food this database never split by preparation (10,750 of the
// visible rows, which is every oil, salt and spice among them), so there is
// nothing there to contradict. Without that line, every sauteed dish would
// carry a note about its olive oil, its garlic and its salt, and a section
// that cries wolf on every dish stops being read at all.
export function describePrepMismatch(
  foodName: string,
  prepMethod: string | null | undefined,
  cookingMethod: string | null | undefined,
): string | null {
  const intent = cookingMethodIntent(cookingMethod);
  if (intent === 'unconstrained') return null;
  const tag = (prepMethod ?? '').trim().toLowerCase();
  if (tag === '') return null;
  if (intent === 'raw') {
    return isRawPrepMethod(tag)
      ? null
      : `Counted as ${tag} ${foodName}: this food database has no raw version of it.`;
  }
  if (!isRawPrepMethod(tag)) return null;
  return `Counted as raw ${foodName}: this food database has no cooked version of it, so any change from cooking is not reflected.`;
}
