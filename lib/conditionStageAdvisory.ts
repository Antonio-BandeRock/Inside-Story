// The generalized, multi-condition dispatcher for the Healing/Staging
// advisory feature -- 2026-08-09. Every Food builder calls this ONE
// function instead of a Hashimoto's-only getHealingStageAdvisory() call,
// so a person with multiple tracked conditions (each with their own real,
// declared stage) gets every real reason that fires, combined into one
// tappable row -- not just Hashimoto's own, and not one advisory silently
// hiding another's.
//
// Real, honest scope: only conditions with an actual entry in
// lib/conditionStages.ts's own CONDITION_STAGING_MODELS produce anything
// here (Hashimoto's, IBS, Celiac Disease as of this date) -- a condition
// with no declared stage, or no real staging model built for it yet,
// contributes nothing, silently and correctly, rather than a guessed
// placeholder.

import type { FoodScore } from './db';
import { getHealingStageAdvisory } from './healingStageAdvisory';
import type { HealingStage } from './healingStage';
import { getIbsPhaseAdvisory } from './ibsPhaseAdvisory';
import type { IbsPhase } from './ibsPhaseAdvisory';
import { getCeliacStageAdvisory } from './celiacStageAdvisory';
import type { CeliacStage } from './celiacStageAdvisory';

export type ConditionStageAdvisory = {
  title: string;
  message: string;
};

// declaredStages: condition code -> that condition's own declared stage
// code (from lib/db.ts's getConditionStages()). Any condition this
// dispatcher doesn't yet know how to advise on is simply ignored.
export function getConditionStageAdvisory(
  scores: FoodScore[],
  declaredStages: Record<string, string>,
): ConditionStageAdvisory | null {
  const parts: ConditionStageAdvisory[] = [];

  const hashimotosStage = declaredStages['hashimotos'];
  if (hashimotosStage) {
    const advisory = getHealingStageAdvisory(scores, hashimotosStage as HealingStage);
    if (advisory) parts.push(advisory);
  }

  const ibsPhase = declaredStages['ibs'];
  if (ibsPhase) {
    const advisory = getIbsPhaseAdvisory(scores, ibsPhase as IbsPhase);
    if (advisory) parts.push(advisory);
  }

  const celiacStage = declaredStages['celiac'];
  if (celiacStage) {
    const advisory = getCeliacStageAdvisory(scores, celiacStage as CeliacStage);
    if (advisory) parts.push(advisory);
  }

  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0];

  return {
    title: 'Condition Stage Notes',
    message: parts.map((part) => `${part.title}\n${part.message}`).join('\n\n---\n\n'),
  };
}
