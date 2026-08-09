import type { DigestCategoryKey } from './digest';

// Maps the `conditions` reference table's own real, snake_case codes
// (confirmed directly against the live database, not guessed) to this
// app's own camelCase DigestCategoryKey -- the two naming conventions
// never lined up automatically (`chronic_kidney_disease` vs.
// `chronicKidneyDisease`), so this is a real, hand-verified lookup, not a
// derived transform.
//
// Originally a local const inside app/(tabs)/purple-digest.tsx (built for
// the "pin the person's own selected conditions to the top of LensHub"
// feature) -- pulled out into its own small, shared file 2026-08-09 once
// Profile's own new TabHub-icon picker needed the identical lookup, so
// there's one real source instead of two independently-maintained copies.
export const CONDITION_CODE_TO_DIGEST_KEY: Record<string, DigestCategoryKey> = {
  hashimotos: 'hashimotos',
  rheumatoid_arthritis: 'rheumatoidArthritis',
  psoriasis: 'psoriasis',
  graves: 'graves',
  type_1_diabetes: 'type1Diabetes',
  celiac: 'celiac',
  ibd: 'ibd',
  multiple_sclerosis: 'multipleSclerosis',
  lupus: 'lupus',
  sjogrens: 'sjogrens',
  pcos: 'pcos',
  chronic_kidney_disease: 'chronicKidneyDisease',
  fatty_liver_disease: 'fattyLiverDisease',
  type_2_diabetes: 'type2Diabetes',
  ibs: 'ibs',
  migraine: 'migraine',
  cardiovascular_disease: 'cardiovascularDisease',
  gout: 'gout',
  prostate_health: 'prostateHealth',
};
