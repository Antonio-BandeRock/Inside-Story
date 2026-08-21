// A real, curated, per-condition "known concerns" registry -- 2026-08-14,
// the onboarding-review half of the "already-tested foods" feature. Mirrors
// lib/conditionStages.ts's own CONDITION_STAGING_MODELS registry shape
// rather than inventing a new pattern: a small, hand-curated list of real,
// named foods/food-groups per condition, each linked to a real, already-
// cited Digest entry rather than a new, unverified claim.
//
// Deliberately NOT a bulk scan of every flagged food in the reference
// database -- confirmed directly with the app's own creator, since a raw
// scan risks repeating the exact two performance incidents already found
// and fixed this same session in this neighborhood (the eager Safe Foods
// full-table scan; the Nutrient Ranking freeze). A curated list is small
// and bounded by construction.
//
// Real, honest scope: only Hashimoto's is seeded here, the condition with
// by far the deepest already-researched, already-cited material to draw
// from (and the app creator's own given example). Real, curated lists for
// the other 18 conditions are a genuine, separate research effort -- named
// here, not silently dropped, matching this whole project's own already-
// established "wire the mechanism now, defer full depth" pattern (the same
// choice already made once this session for general-health-guidance
// depth). Every screen reading this registry works identically for any
// condition the moment a real entry exists here -- adding one is a pure
// data change, no code change needed anywhere that reads it.
//
// A ConditionFoodConcern deliberately carries no reference-database
// foodId/source of its own -- several of these are real food GROUPS
// ("Raw Cruciferous Vegetables"), not one single row, and food_trials'
// own food_id/source columns are already nullable for exactly this
// free-text-only case (a trial can be "just a name," the original,
// still-fully-supported design).
export type ConditionFoodConcern = {
  id: string;
  label: string;
  shortNote: string;
  // Optional link to the real, already-cited Digest entry covering
  // this concern in full depth -- every id below was independently
  // confirmed to exist in the live lib/digest/*.ts source before being
  // written in here, not guessed.
  digestEntryId?: string;
};

export type ConditionFoodConcernModel = {
  conditionCode: string;
  concerns: ConditionFoodConcern[];
};

export const CONDITION_FOOD_CONCERNS: ConditionFoodConcernModel[] = [
  {
    conditionCode: 'hashimotos',
    concerns: [
      {
        id: 'hashimotos-gluten',
        label: 'Gluten',
        shortNote: 'A real gut-permeability mechanism (gliadin/zonulin) this app already covers in depth.',
        digestEntryId: 'problem-gluten-grains',
      },
      {
        id: 'hashimotos-soy',
        label: 'Soy',
        shortNote: 'A real, condition-specific risk in people with existing subclinical hypothyroidism.',
        digestEntryId: 'problem-soy',
      },
      {
        id: 'hashimotos-raw-cruciferous',
        label: 'Raw Cruciferous Vegetables',
        shortNote: 'Raw goitrogenic vegetables (broccoli, cauliflower, cabbage, kale) can interfere with iodine uptake -- cooking mostly resolves it.',
        digestEntryId: 'problem-raw-cruciferous',
      },
      {
        id: 'hashimotos-kelp-iodine',
        label: 'Kelp / High-Iodine Sea Vegetables',
        shortNote: 'Iodine overload from kelp or sea-vegetable supplements can trigger or worsen a real Hashimoto’s flare.',
        digestEntryId: 'problem-excess-iodine-kelp',
      },
      {
        id: 'hashimotos-dairy',
        label: 'Dairy',
        shortNote: 'A real, commonly-flagged elimination-diet trigger food for autoimmune thyroid conditions.',
        digestEntryId: 'problem-conventional-dairy',
      },
      {
        id: 'hashimotos-alcohol',
        label: 'Alcohol',
        shortNote: 'A genuinely two-sided real evidence picture -- moderate intake isn’t clearly harmful, heavier/frequent intake carries real, cited concerns.',
        digestEntryId: 'lifestyle-alcohol-advisory',
      },
      {
        id: 'hashimotos-coffee-timing',
        label: 'Coffee (with levothyroxine)',
        shortNote: 'A real, documented absorption-timing interaction with levothyroxine -- a timing concern, not a strict avoid.',
        digestEntryId: 'problem-coffee-timing',
      },
    ],
  },
];

export function getConditionFoodConcerns(conditionCode: string): ConditionFoodConcern[] | null {
  return CONDITION_FOOD_CONCERNS.find((model) => model.conditionCode === conditionCode)?.concerns ?? null;
}
