// A real, stage-aware advisory for Celiac Disease -- 2026-08-09, the third
// real condition built into the generalized multi-condition staging
// feature (see lib/conditionStages.ts's own header comment for the full
// "why this condition, why not most of the other 17" reasoning).
//
// The real, food-relevant framework here is celiac's own already-published,
// already-cited villi-healing timeline (see lib/digest/celiac.ts's own
// 'celiac-villi-healing-timeline' entry) -- NOT the Marsh histological
// staging scale (0 through 3c), which is a real, formal biopsy-severity
// classification but is diagnostic, not a food-relevant recovery window
// (confirmed directly before building this: Marsh staging measures how
// much tissue damage a biopsy shows AT ONE POINT, it doesn't describe a
// progression a person moves through with food choices the way the
// villi-healing timeline does).
//
// Real, cited healing timeline (already independently verified and
// published in this app's own Digest, reused here rather than
// re-researched): children/younger adults typically fully heal within 3-6
// months on a strict gluten-free diet; older adults can take up to 2
// years, with people 30-60 showing real but incomplete recovery and people
// over 60 showing no statistically significant healing in the same
// studies (PMC9504881; Outcomes in Adults with Celiac Disease Following a
// Gluten-Free Diet, MDPI 2077-0383/14/14/5144). Only about 34% of adults
// reach full mucosal healing within 2 years, rising to about 66% by 5
// years -- meaning "actively healing" is a real, honestly long window for
// many adults, not a quick early phase.
//
// Two real, food-relevant stages, matching this app's own standing
// "only stages that meaningfully change food guidance get built" practice:
//   - Newly Diagnosed / Actively Healing: the real window above, where
//     strict gluten avoidance matters most and secondary lactose
//     intolerance is a real, common, well-documented finding (StatPearls,
//     "Celiac Disease," Daley & Haseeb, NCBI Bookshelf NBK441900, updated
//     2025-02-04 -- independently verified via WebFetch before use: "Lactose
//     intolerance... can occur in celiac disease due to villous atrophy").
//     Honestly worded: that same source does NOT explicitly state secondary
//     lactose intolerance resolves as the gut heals -- this advisory
//     presents that as a reasonable, physiologically-grounded expectation
//     (lactase is produced by the same brush-border cells that regenerate
//     as villi heal), not as a separately, directly cited fact, since a
//     dedicated resolution-timeline study could not be located this session
//     (WebSearch exhausted; several targeted WebFetch attempts against
//     PubMed came back empty or off-target).
//   - Healed / Long-Term Maintenance: no dedicated flag of its own --
//     ordinary, strict gluten avoidance is still the standing rule, and
//     DimensionFlags already surfaces the Gluten tier on every food
//     regardless of declared stage.
//
// Reuses two already-scored sub-criteria, no new food-level data needed:
// Gluten ('High Risk') and the RA-owned "Common Elimination-Diet Trigger
// Food" sub-criterion (id 26, tier 'Dairy') -- the same real tag already
// reused by Hashimoto's own healing-stage advisory for the identical
// 'Dairy' tier, reused here a fourth time under celiac's own honest
// lactose-specific framing.
//
// Informational, never gating -- the same tap-to-explain shape every other
// advisory in this app already uses, not a blocking confirm.

import type { FoodScore } from './db';

export type CeliacStage = 'actively_healing' | 'maintenance';

export const CELIAC_STAGES: CeliacStage[] = ['actively_healing', 'maintenance'];

export const CELIAC_STAGE_INFO: Record<CeliacStage, { label: string; shortDescription: string }> = {
  actively_healing: {
    label: 'Newly Diagnosed / Actively Healing',
    shortDescription:
      'The real, often-long healing window -- 3-6 months for children/younger adults, up to 2 years for older adults. Strict avoidance matters most here.',
  },
  maintenance: {
    label: 'Healed / Long-Term Maintenance',
    shortDescription: "Mucosal healing has settled in -- ordinary, strict gluten avoidance remains the standing rule either way.",
  },
};

// Only Actively Healing produces a real, per-food flag -- see this file's
// own top comment for why Maintenance deliberately doesn't need one.
export const FOOD_RELEVANT_CELIAC_STAGES: CeliacStage[] = ['actively_healing'];

export type CeliacStageAdvisory = {
  title: string;
  message: string;
};

function findTier(scores: FoodScore[], subCriterion: string): string | null {
  return scores.find((score) => score.subCriterion === subCriterion)?.tier ?? null;
}

export function getCeliacStageAdvisory(scores: FoodScore[], stage: CeliacStage | null): CeliacStageAdvisory | null {
  if (!stage || !FOOD_RELEVANT_CELIAC_STAGES.includes(stage)) return null;

  const reasons: string[] = [];

  if (findTier(scores, 'Gluten') === 'High Risk') {
    reasons.push(
      'Contains gluten -- strict avoidance matters most during this real, often-long healing window; even small, repeated exposure can keep the gut from healing.',
    );
  }

  if (findTier(scores, 'Common Elimination-Diet Trigger Food') === 'Dairy') {
    reasons.push(
      "Dairy -- secondary lactose intolerance is a real, well-documented finding at celiac diagnosis (villous atrophy damages the same gut-lining cells that produce lactase). It's reasonable to expect this to improve as the gut heals, though the exact resolution timeline hasn't been separately tracked the way villous healing itself has. Worth noticing if dairy still bothers you, not a lifelong rule.",
    );
  }

  if (reasons.length === 0) return null;

  return {
    title: 'Celiac Stage: Newly Diagnosed / Actively Healing',
    message:
      reasons.join('\n\n') +
      "\n\nThis is advisory only -- nothing in Inside Story hides or blocks a food based on your stage. See the Celiac Disease category in Digest for the full, cited healing timeline.",
  };
}
