// A real, phase-aware advisory for IBS's own standard low-FODMAP protocol --
// 2026-08-09, the second real condition built into the generalized
// multi-condition staging feature (see lib/conditionStages.ts's own header
// comment for the full "why IBS, why not most of the other 17" reasoning).
//
// The real, standard clinical protocol -- restriction, then structured
// reintroduction, then long-term personalization -- is directly documented
// in Halmos EP & Gibson PR, "Controversies and reality of the FODMAP diet
// for patients with irritable bowel syndrome," Journal of Gastroenterology
// and Hepatology, July 2019, PMID 30945376 (independently verified via
// WebFetch against the real PubMed abstract before use, not assumed): "a
// structured program of initial FODMAP restriction followed by food
// reintroduction and finally personalization."
//
// A real, honest limitation, stated plainly rather than glossed over: this
// app's own reference database does not tag foods by their actual FODMAP
// subtype or content (no fructan/polyol/lactose-specific column exists) --
// so this advisory does NOT claim to identify high-FODMAP foods directly.
// It instead reuses the two real, already-scored D5 "Digestive Tolerance &
// Absorption" sub-criteria closest to what the restriction phase actually
// asks someone to watch for -- "Excess Fiber or Anti-Nutrients" (tier
// 'Disruptive') and "Irritants" (tier 'Disruptive'), both fully populated
// across the reference database (confirmed via direct query before use) --
// worded honestly throughout as a general digestive-tolerance proxy, not a
// literal FODMAP measurement. This is the same "reuse an existing,
// verified sub-criterion under an honest, condition-specific framing"
// pattern already established for every other condition's own
// sub_criterion_condition_relevance reuse (see CLAUDE.md's own many
// "reused N existing sub-criteria" entries).
//
// Only the elimination phase produces a real advisory -- see
// FOOD_RELEVANT_IBS_PHASES below; reintroduction and personalization are
// real, named phases a person can self-declare, but this app has no way to
// know which specific FODMAP subtype someone is mid-testing against, so
// producing a food-specific flag for those two phases would be a real
// guess, not a grounded one.
//
// Informational, never gating -- the same tap-to-explain shape every other
// advisory in this app (alcohol/coffee/juice/Hashimoto's own healing-stage
// advisory) already uses, not a blocking confirm.

import type { FoodScore } from './db';

export type IbsPhase = 'elimination' | 'reintroduction' | 'personalization';

export const IBS_PHASES: IbsPhase[] = ['elimination', 'reintroduction', 'personalization'];

export const IBS_PHASE_INFO: Record<IbsPhase, { label: string; shortDescription: string }> = {
  elimination: {
    label: 'Phase 1: Elimination',
    shortDescription: 'A real, structured, temporary restriction period -- typically 2-6 weeks, not a permanent diet.',
  },
  reintroduction: {
    label: 'Phase 2: Reintroduction',
    shortDescription: 'Testing one FODMAP subtype at a time to find your own real triggers, guided by a dietitian where possible.',
  },
  personalization: {
    label: 'Phase 3: Personalization',
    shortDescription: 'Only your own confirmed triggers stay restricted long-term -- everything else goes back in.',
  },
};

// Only Elimination produces a real, per-food flag -- see this file's own
// top comment for why Reintroduction/Personalization deliberately don't.
export const FOOD_RELEVANT_IBS_PHASES: IbsPhase[] = ['elimination'];

export type IbsPhaseAdvisory = {
  title: string;
  message: string;
};

function findTier(scores: FoodScore[], subCriterion: string): string | null {
  return scores.find((score) => score.subCriterion === subCriterion)?.tier ?? null;
}

export function getIbsPhaseAdvisory(scores: FoodScore[], phase: IbsPhase | null): IbsPhaseAdvisory | null {
  if (!phase || !FOOD_RELEVANT_IBS_PHASES.includes(phase)) return null;

  const reasons: string[] = [];

  if (findTier(scores, 'Excess Fiber or Anti-Nutrients') === 'Disruptive') {
    reasons.push(
      "Flagged for excess fiber/anti-nutrient load -- a real, general digestive-tolerance concern worth noticing during a restriction period, though this app can't tell you which specific FODMAP subtype (if any) is actually behind it.",
    );
  }

  if (findTier(scores, 'Irritants') === 'Disruptive') {
    reasons.push(
      'Flagged as a real digestive irritant -- worth noticing during a restriction period for the same reason.',
    );
  }

  if (reasons.length === 0) return null;

  return {
    title: 'IBS Phase: Elimination',
    message:
      reasons.join('\n\n') +
      "\n\nThis app doesn't tag FODMAP content directly, so this is a general digestive-tolerance flag, not a confirmed FODMAP hit. This is advisory only -- nothing in Inside Story hides or blocks a food based on your phase. See the IBS category in Digest for the full, cited low-FODMAP protocol.",
  };
}
