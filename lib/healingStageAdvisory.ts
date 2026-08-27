// A real, stage-aware advisory for Hashimoto's Healing Stages -- 2026-08-09,
// direct request to build the "Healing Stages feature" (self-declaration +
// advisory/reordering, decided 2026-07-31, researched in full via a real,
// separate staged food guide, never wired into the app until now -- see
// CLAUDE.md's own "Healing-journey stages" section, and the Healing Stages
// category already published in Digest).
//
// Deliberately a real, dynamic, PURE function reading the same FoodScore[]
// every builder's own pending-ingredient card already fetches for
// DimensionFlags (lib/db.ts's getFoodScores) -- no new query, no new
// table. Real, evidence-tiered flag conditions, each traced directly to
// the already-published staged food guide's own real exclusion list
// (gluten/dairy, raw goitrogenic crucifers, the 15 flagged additives,
// nightshades -- the guide's own word, "tentative"):
//   - Gluten: 'High Risk' tier (sub-criterion "Gluten")
//   - Goitrogenic Load: 'Goitrogenic (Raw)' tier -- the guide's own
//     specific "raw goitrogenic crucifers" concern, not goitrogenic foods
//     in general (cooked goitrogens are a real, different, much smaller
//     concern the guide doesn't ask Stage 1/2 to avoid).
//   - Additives / Processing: 'High Risk' tier -- the guide's own
//     whole-food emphasis, tying directly to this app's already-published
//     Food Additives research.
//   - Dairy / Nightshade: reused from the RA-owned "Common Elimination-
//     Diet Trigger Food" sub-criterion (id 26) -- the same real per-food
//     tag already proven and reused by Psoriasis, now reused a third time
//     here. Nightshade fires a deliberately softer, "worth testing"
//     message, matching the guide's own explicit tentativeness about it
//     (real anti-inflammatory in-vitro data alongside real patient-
//     reported worsening, no RCT either way) -- not presented as a firm
//     rule the way gluten/dairy are.
//
// A real, honest overlap named directly rather than hidden: Gluten/
// Goitrogenic(Raw)/Additives/Processing's own 'High Risk' tiers are ALSO
// already red-severity flags DimensionFlags shows generically (see
// lib/sixDimensionsReference.ts's own RED_TIERS) -- this advisory doesn't
// duplicate that information, it adds the stage-specific reason it
// matters RIGHT NOW, the same way the existing coffee/juice advisories
// add real context alongside whatever DimensionFlags already shows.
// Dairy/Nightshade are genuinely new information -- neither tier word is
// part of DimensionFlags' own red/yellow/green vocabulary at all, so
// those two reasons were never visible anywhere in this app before this
// feature.
//
// Only ever returns non-null for the two food-relevant stages (Digging,
// Gut Repair) -- see FOOD_RELEVANT_HEALING_STAGES in lib/healingStage.ts.
// A food can trigger more than one real reason at once (e.g. a wheat
// bread with a flagged preservative is both Gluten AND Additives) -- every
// real reason that fires is included in one combined message, not just
// the first match, so nothing gets silently hidden behind another flag.
//
// Informational, never gating -- the same tap-to-explain shape every
// other advisory in this app (alcohol/coffee/juice) already uses, not a
// blocking confirm.

import type { FoodScore } from './db';
import { FOOD_RELEVANT_HEALING_STAGES, type HealingStage } from './healingStage';

export type HealingStageAdvisory = {
  title: string;
  message: string;
};

function findTier(scores: FoodScore[], subCriterion: string): string | null {
  return scores.find((score) => score.subCriterion === subCriterion)?.tier ?? null;
}

const STAGE_LABELS: Record<HealingStage, string> = {
  triage: 'Stage 1: Triage',
  digging: 'Stage 2: Digging (removing triggers)',
  gut_repair: 'Stage 3: Gut Repair (reintroduction)',
  rebalancing: 'Stage 4: Rebalancing',
  maintenance: 'Stage 5: Maintenance',
};

export function getHealingStageAdvisory(
  scores: FoodScore[],
  stage: HealingStage | null,
): HealingStageAdvisory | null {
  if (!stage || !FOOD_RELEVANT_HEALING_STAGES.includes(stage)) return null;

  const stageLabel = STAGE_LABELS[stage];
  const laterStage = stage === 'rebalancing' || stage === 'maintenance';
  const reasons: string[] = [];

  if (findTier(scores, 'Gluten') === 'High Risk') {
    if (stage === 'digging') {
      reasons.push('Contains gluten. One of the first things this stage typically removes.');
    } else if (stage === 'gut_repair') {
      reasons.push("Contains gluten. If you haven't reintroduced it yet, this is one to watch closely when you do.");
    } else {
      reasons.push(
        'Contains gluten. By this stage, food choices matter less than the broader lifestyle and hormone work ahead of you. ' +
          'If gluten was already reintroduced without a reaction, there is no reason to keep avoiding it here. ' +
          'If it was never tested, or did cause a reaction, it still belongs on the avoid list.',
      );
    }
  }

  if (findTier(scores, 'Goitrogenic Load') === 'Goitrogenic (Raw)') {
    reasons.push('Raw goitrogenic (cruciferous) food. The staged food guide flags these specifically raw; cooking largely resolves the concern.');
  }

  const eliminationTier = findTier(scores, 'Common Elimination-Diet Trigger Food');
  if (eliminationTier === 'Dairy') {
    if (stage === 'digging') {
      reasons.push('Dairy. The other food typically removed alongside gluten at this stage.');
    } else if (stage === 'gut_repair') {
      reasons.push("Dairy. If you haven't reintroduced it yet, this is a real one to test carefully, one food at a time.");
    } else {
      reasons.push(
        'Dairy. The same logic as gluten applies here: a food already tested and tolerated during Gut Repair ' +
          'does not need to keep being avoided at this stage. Still worth avoiding if it was never tested, or caused a reaction.',
      );
    }
  }
  if (eliminationTier === 'Nightshade') {
    if (laterStage) {
      reasons.push(
        "A nightshade. The staged food guide is honest that this one is unresolved either way. If it hasn't " +
          "bothered you through reintroduction, this stage's own broader focus means it's reasonable to stop treating it as a concern.",
      );
    } else {
      reasons.push(
        'A nightshade. The staged food guide is honest that this one is genuinely unresolved (real anti-inflammatory evidence exists alongside real patient-reported worsening, with no controlled trial either way). Worth testing for yourself, not a firm rule.',
      );
    }
  }

  if (findTier(scores, 'Additives') === 'High Risk') {
    reasons.push("Carries a flagged additive -- see this app's own Food Additives research (Digest) for the specific concern.");
  }

  if (findTier(scores, 'Processing') === 'High Risk') {
    reasons.push('Heavily processed -- the staged food guide leans toward whole, home-cooked foods, especially in this stage.');
  }

  if (reasons.length === 0) return null;

  return {
    title: `Healing Stage: ${stageLabel}`,
    message:
      reasons.join('\n\n') +
      "\n\nThis is advisory only -- nothing in Inside Story hides or blocks a food based on your stage. See the Healing Stages category in Digest for the full, cited guide.",
  };
}
