// The REORDERING half of the Healing Stages feature -- 2026-08-09,
// explicitly requested, and explicitly deferred since this whole feature's
// first day (see CLAUDE.md's own "Deliberately, explicitly NOT done this
// pass" note from that original build: "the REORDERING half of the
// original decision ('stage-appropriate foods surface first in the
// pickers') -- the advisory/flagging half is real and complete, but
// reordering would mean touching the shared food-list-browsing path
// (FoodLookup.tsx/InlineSelectList.tsx/foodNameGrouping.ts), which this
// same session's own LensHub icon-sizing investigation already showed has
// real, hard-to-diagnose rendering-bug risk; deliberately deferred rather
// than rushed into the same pass as a brand-new feature area").
//
// Deliberately reuses the EXACT SAME advisory logic already proven for
// the tap-to-explain flags (getConditionStageAdvisory, the shared
// dispatcher every builder's own pending-ingredient card already calls)
// rather than a second, parallel reimplementation of six conditions' own
// flag conditions -- guarantees this can never drift out of sync with
// what a food's own advisory row actually says once picked. This file
// contains zero new advisory logic of its own.
//
// A real, deliberately conservative rule: a base_name can resolve to more
// than one real (food_id, source) row (raw vs. cooked, different national
// sources), and each one can carry a genuinely different real tier -- raw
// broccoli triggers Hashimoto's own Goitrogenic Load flag, cooked
// broccoli doesn't. A name is only deprioritized here if EVERY one of its
// real, resolvable variants would trigger a real advisory for the
// person's own declared stage(s) -- if even one variant is genuinely
// clean, the name isn't pushed down, since the person can still land on
// that clean variant via the existing prep-method step right after
// picking it. This avoids demoting a food that has a real, available safe
// option just because a different form of it doesn't.
//
// Advisory + reordering only, never gating, matching this whole feature's
// own standing rule from day one -- a deprioritized food is still fully
// selectable, just not artificially promoted to the top of the list.

import type { FoodScore } from './db';
import { getConditionStageAdvisory } from './conditionStageAdvisory';

// scoresByName comes straight from lib/db.ts's own getStageFlagScoresForNames
// -- one FoodScore[] per real, resolvable (food_id, source) variant a name
// has in the current browsing scope. declaredStages comes from
// getConditionStages(): condition code -> that condition's own declared
// stage code, exactly the same shape getConditionStageAdvisory already
// expects.
export function getStageDeprioritizedNames(
  scoresByName: Record<string, FoodScore[][]>,
  declaredStages: Record<string, string>,
): Set<string> {
  const deprioritized = new Set<string>();
  // No real declared stage at all -- the overwhelmingly common case for
  // anyone who hasn't opted into this feature by declaring one in Profile
  // -- means this whole feature is a real, guaranteed no-op: every food
  // picker looks and behaves exactly as it did before this feature
  // existed, the same "invisible by default" precedent already
  // established for this app's own visual-preferences/TabHub-icon work.
  if (Object.keys(declaredStages).length === 0) return deprioritized;

  for (const [name, variants] of Object.entries(scoresByName)) {
    if (variants.length === 0) continue;
    const everyVariantFlagged = variants.every(
      (scores) => getConditionStageAdvisory(scores, declaredStages) !== null,
    );
    if (everyVariantFlagged) deprioritized.add(name);
  }
  return deprioritized;
}
