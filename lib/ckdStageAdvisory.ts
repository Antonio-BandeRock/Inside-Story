// A real, stage-aware advisory for Chronic Kidney Disease -- 2026-08-09,
// the fifth real condition built into the generalized multi-condition
// staging feature (see lib/conditionStages.ts's own header comment for the
// full "why this condition, why not most of the other 17" reasoning).
//
// The real, food-relevant framework here is CKD's own already-published,
// already-cited pre-dialysis-vs-dialysis dietary reversal (see
// lib/digest/chronicKidneyDisease.ts's own 'ckd-dialysis-diet-reversal'
// entry, NIDDK) -- NOT the real KDIGO G/A staging "heat map"
// ('ckd-g-a-staging-heat-map'), which is confirmed real and genuinely
// useful but is a diagnostic risk-stratification grid computed from lab
// values (eGFR + albuminuria) at a point in time, not a food-relevant
// progression a person self-declares -- the same distinction already made
// for Celiac's Marsh scale and IBD's Montreal classification.
//
// Real, cited reversal (reused, not re-researched): this app's own
// already-published protein-restriction guidance (0.6-0.8g/kg/day) applies
// specifically to PRE-dialysis CKD, protecting remaining kidney function.
// Once dialysis starts, that logic genuinely REVERSES -- dialysis itself
// strips real protein directly out of the blood during each treatment
// (peritoneal dialysis removing measurably more than hemodialysis), so
// current real guidance calls for MORE protein on dialysis, not less
// (NIDDK, "Healthy Eating for Adults with Chronic Kidney Disease").
//
// Real, direct reuse of CKD's own condition-owned "Protein Density" sub-
// criterion (id 28, dimension "Renal Nutrient Load," home_condition_code
// 'chronic_kidney_disease' -- confirmed via direct query against the
// bundled reference database before writing this: real tiers 'Very High
// Protein Density' / 'High Protein Density' / 'Moderate Protein Density'
// / 'Low Protein Density' / 'Not Assessed'), the SAME sub-criterion this
// app already scores every food against for CKD, now read in two
// genuinely OPPOSITE directions depending on stage -- the clearest real
// demonstration in this whole feature of why staging changes what the
// same food-level data actually means. Deliberately does NOT add a
// potassium flag: this app's own CKD food-scoring already declined to
// build a potassium sub-criterion at all, since real evidence for blanket
// potassium restriction is itself thin (see 'ckd-potassium-restriction-
// reconsidered') -- forcing a potassium flag into this stage advisory
// would contradict that same, already-published restraint.
//
// Informational, never gating -- the same tap-to-explain shape every other
// advisory in this app already uses, not a blocking confirm.

import type { FoodScore } from './db';

export type CkdStage = 'pre_dialysis' | 'on_dialysis';

export const CKD_STAGES: CkdStage[] = ['pre_dialysis', 'on_dialysis'];

export const CKD_STAGE_INFO: Record<CkdStage, { label: string; shortDescription: string }> = {
  pre_dialysis: {
    label: 'Pre-Dialysis',
    shortDescription: 'The real 0.6-0.8 g/kg/day protein ceiling applies here, protecting remaining kidney function.',
  },
  on_dialysis: {
    label: 'On Dialysis',
    shortDescription: 'The protein rule genuinely reverses -- dialysis itself removes real protein that now needs replacing, not restricting.',
  },
};

// Both stages produce a real, distinct flag -- the same sub-criterion, read
// in opposite directions, matching IBD's own two-stage shape.
export const FOOD_RELEVANT_CKD_STAGES: CkdStage[] = ['pre_dialysis', 'on_dialysis'];

export type CkdStageAdvisory = {
  title: string;
  message: string;
};

function findTier(scores: FoodScore[], subCriterion: string): string | null {
  return scores.find((score) => score.subCriterion === subCriterion)?.tier ?? null;
}

export function getCkdStageAdvisory(scores: FoodScore[], stage: CkdStage | null): CkdStageAdvisory | null {
  if (!stage || !FOOD_RELEVANT_CKD_STAGES.includes(stage)) return null;

  const proteinTier = findTier(scores, 'Protein Density');
  const reasons: string[] = [];

  if (stage === 'pre_dialysis') {
    if (proteinTier === 'High Protein Density' || proteinTier === 'Very High Protein Density') {
      reasons.push(
        'A real, protein-dense food -- worth watching against the real 0.6-0.8g/kg/day ceiling most pre-dialysis CKD guidance recommends, ideally with a renal dietitian setting your own exact real target.',
      );
    }
  } else {
    if (proteinTier === 'Low Protein Density') {
      reasons.push(
        'A real, protein-light food -- dialysis itself removes real protein your body now needs replaced, not restricted. Worth knowing this specific pre-dialysis instinct genuinely reverses once dialysis starts.',
      );
    }
  }

  if (reasons.length === 0) return null;

  return {
    title: `CKD Stage: ${stage === 'pre_dialysis' ? 'Pre-Dialysis' : 'On Dialysis'}`,
    message:
      reasons.join('\n\n') +
      "\n\nThis is advisory only -- nothing in Inside Story hides or blocks a food based on your stage. See the Chronic Kidney Disease category in Purple Digest for the full, cited evidence.",
  };
}
