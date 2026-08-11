// Real, cited data behind Insights' own "Cooking Impact" lens -- 2026-08-10.
// Answers a different question than the reference database's own real,
// lab-measured prep_method rows (Raw vs. Boiled vs. Canned, etc., picked
// during food selection -- see resolveFoodChoice in lib/db.ts) or a
// builder's own free-standing "Cook Prep" ingredient field (stored as
// descriptive metadata only, never read by any nutrient/scoring query --
// see each builder's own MealIngredientInput-style types). Neither of
// those currently lets someone ask "how much of this nutrient/compound
// survives THIS specific cooking method," independent of any one already-
// logged ingredient. This is a standalone, informational reference --
// same non-gating, doesn't-touch-tracked-totals shape as the alcohol
// calculator (components/AlcoholCalculator.tsx) and lib/alcoholCalculator.ts's
// own header comment on why that boundary matters.
//
// Deliberately NOT a single formula the way ethanol calorie math is.
// Nutrient degradation genuinely doesn't reduce to one clean equation
// across nutrient classes -- water-soluble vitamins leach into water and
// degrade with heat; fat-soluble vitamins are largely heat-stable and
// don't leach; minerals are elements heat can't destroy, only leach away;
// enzyme-dependent compounds (goitrogens, lectins) depend on deactivating
// a specific enzyme, not on generic heat exposure. So this is a curated,
// per-compound reference table instead, each entry marked honestly by
// confidence:
//   'measured'  -- a real, cited study measured this exact combination.
//   'reasoned'  -- no dedicated study found for this exact combination;
//                  a defensible inference from the SAME compound's own
//                  real, cited mechanism (leaches into water / heat-stable
//                  / enzyme-dependent), not a guess with nothing behind it.
//   'baseline'  -- the raw/uncooked reference point everything else in
//                  that compound's own row is compared against.
//
// Three of the six compounds below (Goitrogens, Lectins, and the general
// mineral-leaching mechanism) reuse citations already verified and shipped
// elsewhere in this exact app (lib/sixDimensionsReference.ts's own
// SUB_CRITERION_SOURCES and selectPrepTips) -- reused directly rather than
// re-derived, so this doesn't present a second, different number for a
// claim this app already makes elsewhere. Vitamin C and Folate are new
// citations, independently verified via WebSearch/WebFetch against the
// real primary papers (not a secondary aggregator) before being written
// in here.

export type CookingImpactMethod = {
  id: string;
  label: string;
};

// Ordered by real water/heat exposure, "Raw" first as the real baseline
// every other row is compared against, matching this app's own standing
// "a real answer, not an absent one" convention for a first list entry.
export const COOKING_IMPACT_METHODS: CookingImpactMethod[] = [
  { id: 'raw', label: 'Raw / No Cook' },
  { id: 'steamed', label: 'Steamed' },
  { id: 'microwaved', label: 'Microwaved' },
  { id: 'boiled_drained', label: 'Boiled, Liquid Discarded' },
  { id: 'boiled_kept', label: 'Boiled/Simmered, Liquid Kept (Soup/Stew)' },
  { id: 'baked_roasted', label: 'Baked / Roasted' },
  { id: 'sauteed', label: 'Sauteed / Pan-Fried' },
  { id: 'grilled_broiled', label: 'Grilled / Broiled' },
];

export type CookingImpactConfidence = 'measured' | 'reasoned' | 'baseline';

export type CookingImpactEntry = {
  methodId: string;
  confidence: CookingImpactConfidence;
  summary: string;
};

export type CookingImpactCompound = {
  id: string;
  label: string;
  mechanism: string;
  citation: string;
  byMethod: CookingImpactEntry[];
};

export const COOKING_IMPACT_COMPOUNDS: CookingImpactCompound[] = [
  {
    id: 'vitamin_c',
    label: 'Vitamin C',
    mechanism:
      'Water-soluble and heat-sensitive -- it degrades with heat, and separately leaches directly into any cooking water.',
    citation:
      'Lee, Choi, Jeong, Lee & Sung, "Effect of different cooking methods on the content of vitamins and true retention in selected vegetables," Food Science and Biotechnology, 2017;27(2):333-342.',
    byMethod: [
      { methodId: 'raw', confidence: 'baseline', summary: 'Full amount present -- the reference point every other row is measured against.' },
      {
        methodId: 'steamed',
        confidence: 'measured',
        summary: "Real retention ranged 0-89% across the vegetables tested -- generally the best of the wet-heat methods, since there's little direct water contact.",
      },
      {
        methodId: 'microwaved',
        confidence: 'measured',
        summary: 'Best-performing method tested: over 90% retained in spinach, carrots, sweet potato, and broccoli.',
      },
      {
        methodId: 'boiled_drained',
        confidence: 'measured',
        summary: 'Real retention ranged 0-74% across the vegetables tested -- the worst method tested, since vitamin C leaches into the water and that water is then poured away.',
      },
      {
        methodId: 'boiled_kept',
        confidence: 'reasoned',
        summary: "The same leaching happens, but if the liquid is eaten too (a soup, a braise), most of what leached out is still consumed. No dedicated study measured this exact case, but the mechanism supports it.",
      },
      {
        methodId: 'baked_roasted',
        confidence: 'reasoned',
        summary: 'Dry heat, no water contact -- loss should sit closer to steaming/microwaving than boiling, but this specific method wasn\'t directly measured in the cited study.',
      },
      {
        methodId: 'sauteed',
        confidence: 'reasoned',
        summary: 'Brief, mostly dry heat -- likely moderate loss, closer to baking than boiling, but not directly measured in the cited study.',
      },
      {
        methodId: 'grilled_broiled',
        confidence: 'reasoned',
        summary: 'Dry, direct heat -- likely similar to baking/roasting, but not directly measured in the cited study.',
      },
    ],
  },
  {
    id: 'folate',
    label: 'Folate (Vitamin B9)',
    mechanism: 'Water-soluble; loses to cooking mostly through leaching into water, not heat degradation on its own.',
    citation:
      'McKillop, Pentieva, Daly, McPartlin, Hughes, Strain, Scott & McNulty, "The effect of different cooking methods on folate retention in various foods...," British Journal of Nutrition, 2002;88(6):681-8 (spinach and broccoli).',
    byMethod: [
      { methodId: 'raw', confidence: 'baseline', summary: 'Full amount present.' },
      {
        methodId: 'steamed',
        confidence: 'measured',
        summary: 'No significant loss measured for spinach (up to 4.5 min) or broccoli (up to 15 min) -- steaming has minimal direct water contact, and leaching is the real mechanism here.',
      },
      {
        methodId: 'microwaved',
        confidence: 'reasoned',
        summary: 'Not directly tested in this study, but the same low-water-contact reasoning as steaming should apply.',
      },
      {
        methodId: 'boiled_drained',
        confidence: 'measured',
        summary: 'Spinach: 49% retained. Broccoli: 44% retained -- more than half lost, leached directly into the water and poured away.',
      },
      {
        methodId: 'boiled_kept',
        confidence: 'reasoned',
        summary: 'Same real leaching, but consuming the liquid (soup, stew) keeps most of what leached out in the meal. Not directly tested.',
      },
      {
        methodId: 'baked_roasted',
        confidence: 'reasoned',
        summary: "No direct water contact -- likely closer to steaming's real retention than boiling's, but not directly measured.",
      },
      {
        methodId: 'sauteed',
        confidence: 'reasoned',
        summary: 'Minimal water contact -- likely well retained, but not directly measured.',
      },
      {
        methodId: 'grilled_broiled',
        confidence: 'reasoned',
        summary: 'Dry heat, no water contact -- likely well retained, but not directly measured.',
      },
    ],
  },
  {
    id: 'goitrogens',
    label: 'Goitrogens (Raw Cruciferous Vegetables)',
    mechanism:
      'Raw cruciferous vegetables contain glucosinolates that break down into compounds competing with thyroid iodine uptake. Cooking deactivates the enzyme responsible for that breakdown.',
    citation:
      "Felker, Bunch & Leung, \"Concentrations of thiocyanate and goitrin in human plasma...,\" Nutrition Reviews, 2016;74(4):248-58, PMID 26946249 -- the same citation already behind this app's own Goitrogenic Load scoring. Meaningful interference generally requires large intakes plus pre-existing iodine insufficiency.",
    byMethod: [
      {
        methodId: 'raw',
        confidence: 'baseline',
        summary: "Full goitrogenic effect present -- this is the one condition this app's own Goitrogenic Load dimension actually flags.",
      },
      { methodId: 'steamed', confidence: 'measured', summary: 'Real cooking -- steaming, boiling, or roasting -- deactivates roughly 90% of the effect.' },
      { methodId: 'microwaved', confidence: 'measured', summary: 'Same roughly 90% reduction as any real cooking method.' },
      { methodId: 'boiled_drained', confidence: 'measured', summary: 'Same roughly 90% reduction as any real cooking method.' },
      { methodId: 'boiled_kept', confidence: 'measured', summary: 'Same roughly 90% reduction as any real cooking method.' },
      { methodId: 'baked_roasted', confidence: 'measured', summary: 'Same roughly 90% reduction as any real cooking method.' },
      { methodId: 'sauteed', confidence: 'measured', summary: 'Same roughly 90% reduction as any real cooking method.' },
      { methodId: 'grilled_broiled', confidence: 'measured', summary: 'Same roughly 90% reduction as any real cooking method.' },
    ],
  },
  {
    id: 'lectins',
    label: 'Lectins (Raw/Undercooked Legumes)',
    mechanism: 'Legume lectins (e.g. phytohemagglutinin in raw/undercooked kidney beans) are heat-labile, but not uniformly so.',
    citation:
      "\"Assessment of Lectin Inactivation by Heat and Digestion,\" PMID 21374488 -- the same citation already behind this app's own Lectins (Legumes) scoring.",
    byMethod: [
      { methodId: 'raw', confidence: 'baseline', summary: 'Full lectin content present -- raw or undercooked legumes can genuinely irritate the gut.' },
      {
        methodId: 'boiled_drained',
        confidence: 'measured',
        summary: 'A real, extended soak-and-boil (not just a quick rinse or a light simmer) is needed to fully deactivate lectins -- undercooked beans stay a real risk even after some heat.',
      },
      {
        methodId: 'boiled_kept',
        confidence: 'measured',
        summary: 'Same requirement -- a real, extended boil, not just a brief simmer, whether or not the liquid is kept.',
      },
      {
        methodId: 'steamed',
        confidence: 'reasoned',
        summary: 'Steaming alone is not the tested method here -- legumes need a real boil, not steaming, to reliably deactivate lectins.',
      },
      { methodId: 'microwaved', confidence: 'reasoned', summary: 'Not the tested method -- a real boil is the established, reliable approach for legumes specifically.' },
      {
        methodId: 'baked_roasted',
        confidence: 'reasoned',
        summary: 'Not the tested method for raw legumes -- a real soak-and-boil first is still the reliable approach.',
      },
      {
        methodId: 'sauteed',
        confidence: 'reasoned',
        summary: 'Brief, direct heat alone is not established as reliable for legume lectins -- a real soak-and-boil first is the tested approach.',
      },
      { methodId: 'grilled_broiled', confidence: 'reasoned', summary: 'Not the tested method for raw legumes.' },
    ],
  },
  {
    id: 'minerals',
    label: 'Minerals (Potassium, Magnesium, etc.)',
    mechanism: 'Minerals are elements -- heat itself cannot destroy them. Real loss only happens through leaching into cooking water that then gets discarded.',
    citation: "Established food-science mechanism, not one specific study -- minerals genuinely can't be broken down by heat the way a vitamin molecule can.",
    byMethod: [
      { methodId: 'raw', confidence: 'baseline', summary: 'Full mineral content present.' },
      { methodId: 'steamed', confidence: 'reasoned', summary: 'Minimal water contact -- minerals should stay largely in the food.' },
      { methodId: 'microwaved', confidence: 'reasoned', summary: 'Minimal water contact -- minerals should stay largely in the food.' },
      { methodId: 'boiled_drained', confidence: 'reasoned', summary: 'A real, meaningful portion leaches into the water, and is then lost when that water is poured away.' },
      {
        methodId: 'boiled_kept',
        confidence: 'reasoned',
        summary: 'The same leaching happens, but nothing is actually lost if the liquid is eaten too (a soup, a braise) -- minerals stay in the meal.',
      },
      { methodId: 'baked_roasted', confidence: 'reasoned', summary: 'No water contact -- minerals should stay largely in the food.' },
      { methodId: 'sauteed', confidence: 'reasoned', summary: 'Minimal water contact -- minerals should stay largely in the food.' },
      { methodId: 'grilled_broiled', confidence: 'reasoned', summary: 'No water contact -- minerals should stay largely in the food.' },
    ],
  },
  {
    id: 'fat_soluble_vitamins',
    label: 'Fat-Soluble Vitamins (A, D, E, K)',
    mechanism: "Comparatively heat-stable, and they don't leach into water the way water-soluble vitamins do.",
    citation: 'Established food-science principle -- fat-soluble vitamins are consistently reported as more heat-stable across the nutrition literature than water-soluble ones.',
    byMethod: [
      { methodId: 'raw', confidence: 'baseline', summary: 'Full amount present.' },
      { methodId: 'steamed', confidence: 'reasoned', summary: "Generally well retained -- these vitamins are heat-stable and don't leach into water." },
      { methodId: 'microwaved', confidence: 'reasoned', summary: 'Generally well retained.' },
      {
        methodId: 'boiled_drained',
        confidence: 'reasoned',
        summary: "Generally well retained despite the water contact -- these vitamins don't leach the way water-soluble ones do.",
      },
      { methodId: 'boiled_kept', confidence: 'reasoned', summary: 'Generally well retained.' },
      { methodId: 'baked_roasted', confidence: 'reasoned', summary: 'Generally well retained, though very high heat over a long time can start to degrade them.' },
      {
        methodId: 'sauteed',
        confidence: 'reasoned',
        summary: 'Generally well retained -- and cooking with a fat can actually improve absorption, since these vitamins need dietary fat present to absorb well in the first place.',
      },
      { methodId: 'grilled_broiled', confidence: 'reasoned', summary: 'Generally well retained, though very high, direct heat can degrade some of it.' },
    ],
  },
];
