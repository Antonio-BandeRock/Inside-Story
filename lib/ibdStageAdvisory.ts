// A real, stage-aware advisory for Inflammatory Bowel Disease -- 2026-08-09,
// the fourth real condition built into the generalized multi-condition
// staging feature (see lib/conditionStages.ts's own header comment for the
// full "why this condition, why not most of the other 17" reasoning).
//
// The real, food-relevant framework here is IBD's own clinical Flare /
// Remission distinction -- NOT the Montreal classification (age at
// diagnosis, anatomical location, disease behavior for Crohn's; extent of
// inflammation for UC, see lib/digest/ibd.ts's own 'ibd-montreal-
// classification' entry), which is confirmed real and formal but a static,
// diagnostic classifier recorded once at diagnosis, not a food-relevant
// progression a person moves through, the same distinction already made
// for Celiac's own Marsh scale.
//
// Reuses this app's own already-published, already-cited IBD Digest
// content directly rather than re-researching it:
//   - Flare / Active Disease: reuses Additives and Processing (both
//     'High Risk'), grounded in this app's own already-cited Chassaing et
//     al. 2015 finding (carboxymethylcellulose and polysorbate 80 worsened
//     colitis specifically in susceptible mice) and the real, separate
//     ultra-processed-food/IBD-risk cohort data already backing this
//     app's own condition-level food-scoring reuse for IBD. Deliberately
//     does NOT flag fiber during a flare -- this app's own
//     'ibd-fiber-flare-myth' entry found real, surprisingly thin evidence
//     for the widely repeated "restrict fiber during a flare" advice (a
//     large real survey found HIGHER fiber intake tracking with LOWER
//     flare risk within six months), so flagging fiber negatively here
//     would directly contradict this app's own already-published, honest
//     correction.
//   - Remission: reuses the same two D5 "Digestive Tolerance &
//     Absorption" sub-criteria IBS's own advisory already uses (Excess
//     Fiber or Anti-Nutrients, Irritants, both tier 'Disruptive'), framed
//     around this app's own already-cited 'ibd-fodmap-remission-symptoms'
//     finding: real, ongoing digestive symptoms during confirmed remission
//     (normal calprotectin, no visible inflammation) often reflect a real,
//     separate, overlapping IBS-type issue rather than active disease
//     itself -- worth noticing, not a sign the IBD itself is flaring.
//
// Both stages produce a real, distinct flag -- unlike Hashimoto's/IBS/
// Celiac (which each have exactly one food-relevant stage), because IBD's
// own real evidence genuinely supports a food-relevant concern at both
// ends of the flare/remission cycle, not just one.
//
// Informational, never gating -- the same tap-to-explain shape every other
// advisory in this app already uses, not a blocking confirm.

import type { FoodScore } from './db';

export type IbdStage = 'flare' | 'remission';

export const IBD_STAGES: IbdStage[] = ['flare', 'remission'];

export const IBD_STAGE_INFO: Record<IbdStage, { label: string; shortDescription: string }> = {
  flare: {
    label: 'Flare / Active Disease',
    shortDescription: 'Active inflammation -- additive/processing-related concerns matter most here. Fiber is deliberately NOT restricted by default; real evidence for that is thin.',
  },
  remission: {
    label: 'Remission',
    shortDescription: 'Calprotectin normal, no visible inflammation -- real, ongoing symptoms here are often a separate, overlapping issue, not the IBD itself.',
  },
};

// Both stages produce a real, distinct flag -- see this file's own top
// comment for why, unlike every other condition built so far.
export const FOOD_RELEVANT_IBD_STAGES: IbdStage[] = ['flare', 'remission'];

export type IbdStageAdvisory = {
  title: string;
  message: string;
};

function findTier(scores: FoodScore[], subCriterion: string): string | null {
  return scores.find((score) => score.subCriterion === subCriterion)?.tier ?? null;
}

export function getIbdStageAdvisory(scores: FoodScore[], stage: IbdStage | null): IbdStageAdvisory | null {
  if (!stage || !FOOD_RELEVANT_IBD_STAGES.includes(stage)) return null;

  const reasons: string[] = [];

  if (stage === 'flare') {
    if (findTier(scores, 'Additives') === 'High Risk') {
      reasons.push(
        "Carries a flagged additive -- real research (Chassaing et al. 2015) found specific emulsifiers worsened colitis directly in susceptible mice, a mechanism worth extra attention during active disease specifically.",
      );
    }
    if (findTier(scores, 'Processing') === 'High Risk') {
      reasons.push(
        'Heavily processed -- real cohort data links ultra-processed food intake with higher IBD flare risk. This is NOT a fiber warning -- this app\'s own research found real evidence thin for the common "restrict fiber during a flare" advice, so fiber content isn\'t flagged here on purpose.',
      );
    }
  }

  if (stage === 'remission') {
    const excessFiberTier = findTier(scores, 'Excess Fiber or Anti-Nutrients');
    const irritantsTier = findTier(scores, 'Irritants');
    if (excessFiberTier === 'Disruptive' || irritantsTier === 'Disruptive') {
      reasons.push(
        "Flagged for a real, general digestive-tolerance concern -- if remission is confirmed (normal calprotectin, no visible inflammation) but symptoms persist, this is worth noticing as a possible separate, overlapping IBS-type issue, not necessarily active IBD itself.",
      );
    }
  }

  if (reasons.length === 0) return null;

  return {
    title: `IBD Stage: ${stage === 'flare' ? 'Flare / Active Disease' : 'Remission'}`,
    message:
      reasons.join('\n\n') +
      "\n\nThis is advisory only -- nothing in Inside Story hides or blocks a food based on your stage. See the Inflammatory Bowel Disease category in Digest for the full, cited evidence.",
  };
}
