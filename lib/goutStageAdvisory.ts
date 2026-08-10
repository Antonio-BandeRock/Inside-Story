// A real, stage-aware advisory for Gout -- 2026-08-09, the sixth real
// condition built into the generalized multi-condition staging feature
// (see lib/conditionStages.ts's own header comment for the full "why this
// condition, why not most of the other 17" reasoning).
//
// The real, food-relevant framework here is gout's own already-published,
// already-cited four-stage natural history (see lib/digest/gout.ts's own
// 'gout-four-stage-natural-history' entry, StatPearls NBK546606): Stage 1
// Asymptomatic Hyperuricemia (silent, typically undiagnosed, not
// meaningfully self-declarable) -> Stage 2 Acute Gouty Arthritis (the
// real, sudden flare) -> Stage 3 Intercritical Gout (the real, deceptively
// quiet period between flares, where the disease "doesn't actually pause
// just because the pain does") -> Stage 4 Chronic Tophaceous Gout (the
// real, most severe stage, developing after years of inadequately
// controlled uric acid). All four real stages are shown in the picker,
// matching the same honest-completeness practice already used for
// Hashimoto's own five stages, even though only two produce a food
// advisory.
//
// A real, DIFFERENT shape from every prior condition in this feature:
// gout's own real dietary triggers don't change direction between Flare
// and Intercritical the way IBD's fiber guidance or CKD's protein
// guidance do -- uric acid management is a real, continuous concern
// either way. What genuinely differs is the MESSAGE, not the underlying
// flag: this app's own already-cited research states directly that the
// real danger of the intercritical stage is precisely that people relax
// vigilance because they feel fine, even though crystal deposition
// continues silently. Both food-relevant stages therefore reuse the SAME
// already-scored sub-criteria, with stage-specific framing on why it
// still matters.
//
// Reuses Additives and Processing (both 'High Risk'), the exact same two
// sub-criteria this app's own condition-level Gout food-scoring already
// reuses under the real "Processed & Sugar-Sweetened Food Pattern"
// dimension label (confirmed via direct query of
// sub_criterion_condition_relevance before writing this) -- an honest,
// directional proxy for the real, cited sugar-sweetened-beverage finding
// (a large prospective study found 2+ daily servings carrying an 85%
// higher gout risk, PMID 18244959) and the real Western-diet-pattern
// finding, not a literal purine measurement. Deliberately does NOT flag
// dairy or any elimination-diet-style tag: this app's own gout research
// found dairy intake tracks with LOWER gout risk (a real, protective
// finding), so no existing elimination-trigger sub-criterion (which tiers
// dairy as a concern) is reusable here without contradicting that finding.
// No purine-specific or meat/seafood-specific sub-criterion exists in this
// app's reference database at all (confirmed during this app's own
// original Gout food-scoring build -- no purine nutrient_code exists in
// any of the 7 national source datasets), so those real, well-documented
// triggers (meat/seafood, beer specifically) can't be flagged at the
// individual-food level here; this app's own Gout Digest category covers
// them in full narrative detail instead.
//
// Informational, never gating -- the same tap-to-explain shape every other
// advisory in this app already uses, not a blocking confirm.

import type { FoodScore } from './db';

export type GoutStage = 'asymptomatic_hyperuricemia' | 'acute_flare' | 'intercritical' | 'chronic_tophaceous';

export const GOUT_STAGES: GoutStage[] = [
  'asymptomatic_hyperuricemia',
  'acute_flare',
  'intercritical',
  'chronic_tophaceous',
];

export const GOUT_STAGE_INFO: Record<GoutStage, { label: string; shortDescription: string }> = {
  asymptomatic_hyperuricemia: {
    label: 'Stage 1: Asymptomatic Hyperuricemia',
    shortDescription: 'Elevated uric acid, no symptoms yet -- silent crystal formation may already be starting. Usually not something someone knows they have.',
  },
  acute_flare: {
    label: 'Stage 2: Acute Flare',
    shortDescription: 'The real, sudden, intensely painful attack -- typically 3-10 days untreated, pain peaking in the first 24 hours.',
  },
  intercritical: {
    label: 'Stage 3: Intercritical (Between Flares)',
    shortDescription: "Feeling fine -- but real research confirms this isn't remission. Crystal deposition continues silently underneath.",
  },
  chronic_tophaceous: {
    label: 'Stage 4: Chronic Tophaceous',
    shortDescription: 'The real, most severe stage -- ongoing joint pain and visible deformity from accumulated urate crystals, usually after years of inadequate control.',
  },
};

// Only Stages 2 and 3 produce a real food advisory -- see this file's own
// top comment for why Stage 1 (typically undiagnosed) and Stage 4 (same
// ongoing management as Stage 3, no genuinely distinct food guidance)
// deliberately don't.
export const FOOD_RELEVANT_GOUT_STAGES: GoutStage[] = ['acute_flare', 'intercritical'];

export type GoutStageAdvisory = {
  title: string;
  message: string;
};

function findTier(scores: FoodScore[], subCriterion: string): string | null {
  return scores.find((score) => score.subCriterion === subCriterion)?.tier ?? null;
}

export function getGoutStageAdvisory(scores: FoodScore[], stage: GoutStage | null): GoutStageAdvisory | null {
  if (!stage || !FOOD_RELEVANT_GOUT_STAGES.includes(stage)) return null;

  const flagged = findTier(scores, 'Additives') === 'High Risk' || findTier(scores, 'Processing') === 'High Risk';
  if (!flagged) return null;

  const message =
    stage === 'acute_flare'
      ? "Heavily processed or sugar-sweetened -- a real, large study found 2+ sugary drinks a day carrying an 85% higher gout risk, worth extra attention during an active flare specifically."
      : "Heavily processed or sugar-sweetened -- worth staying just as mindful of here as during a flare. Real research confirms the intercritical stage isn't a true remission; crystal deposition and risk continue even though nothing hurts right now.";

  return {
    title: `Gout Stage: ${stage === 'acute_flare' ? 'Acute Flare' : 'Intercritical (Between Flares)'}`,
    message:
      message +
      "\n\nThis app can't flag purine-heavy meat/seafood or beer directly at the individual-food level (no reference source measures purine content) -- see the Gout category in Purple Digest for that full, cited detail. This is advisory only -- nothing in Inside Story hides or blocks a food based on your stage.",
  };
}
