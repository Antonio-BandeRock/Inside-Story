// Multi-condition staging registry -- 2026-08-09, direct instruction after
// Hashimoto's own Healing Stages feature shipped: "It sounds like it has
// only been built in for Hashimoto's. Healing stages for all 18 others
// need to have theirs built in too."
//
// A real, honest audit of all 18 non-Hashimoto's conditions (checking each
// condition's own already-published Purple Digest content, and the real
// underlying literature via WebSearch/WebFetch where the Digest didn't
// already settle it) found genuine, citable staged-food frameworks are NOT
// evenly distributed. Hashimoto's own five-stage Wentz framework is a real,
// specifically-named practitioner model built around this app's own
// original mission; most of the other 18 conditions have no comparable
// real, published staged-food framework at all, and forcing one in would
// mean fabricating structure that doesn't exist -- directly against this
// whole app's own standing citation discipline (see CLAUDE.md's own
// "Healing-journey stages" section and the many "don't force a citation
// that doesn't really support the claim" precedents throughout this
// codebase).
//
// This file is deliberately a real, honest REGISTRY, not a forced
// five-conditions-get-five-stages template -- each entry's own stage count,
// stage meaning, and even whether food-relevance applies at all is
// condition-specific, sourced from that condition's own real evidence, not
// copied from Hashimoto's shape. New entries should only be added here once
// a real, citable staged/phased structure has actually been found and
// verified -- see each entry's own header comment for its real source.
//
// A single, condition-agnostic ConditionStagingModel/ConditionStageDefinition
// shape lets Profile render one generic picker per condition the person has
// selected (see app/profile.tsx), and lets each condition's own advisory
// function (lib/healingStageAdvisory.ts for Hashimoto's, lib/ibsPhaseAdvisory.ts
// for IBS, more to follow as real frameworks are found) plug into the shared
// dispatcher in lib/conditionStageAdvisory.ts.

import { HEALING_STAGES, HEALING_STAGE_INFO, FOOD_RELEVANT_HEALING_STAGES } from './healingStage';
import { IBS_PHASES, IBS_PHASE_INFO, FOOD_RELEVANT_IBS_PHASES } from './ibsPhaseAdvisory';
import { CELIAC_STAGES, CELIAC_STAGE_INFO, FOOD_RELEVANT_CELIAC_STAGES } from './celiacStageAdvisory';
import { IBD_STAGES, IBD_STAGE_INFO, FOOD_RELEVANT_IBD_STAGES } from './ibdStageAdvisory';
import { CKD_STAGES, CKD_STAGE_INFO, FOOD_RELEVANT_CKD_STAGES } from './ckdStageAdvisory';

export type ConditionStageDefinition = {
  code: string;
  label: string;
  shortDescription: string;
};

export type ConditionStagingModel = {
  conditionCode: string;
  conditionLabel: string;
  // The real, named framework this staging is drawn from, and an honest
  // one-line note on its own evidence status -- shown directly in the
  // Profile picker so a person never mistakes a practitioner framework
  // (or, for IBS, a real clinical-guideline protocol) for something this
  // app invented or for settled medical consensus where it isn't.
  frameworkName: string;
  frameworkNote: string;
  stages: ConditionStageDefinition[];
  // Which of this condition's own stage codes actually drive a real food
  // advisory. Every real staging model has at least one, but not every
  // stage within a model necessarily does (mirrors Hashimoto's own
  // Triage/Rebalancing/Maintenance carrying no food-advisory output).
  foodRelevantStageCodes: string[];
};

export const CONDITION_STAGING_MODELS: ConditionStagingModel[] = [
  {
    conditionCode: 'hashimotos',
    conditionLabel: "Hashimoto's Disease",
    frameworkName: 'The Healing/Regression Stages (Dr. Izabella Wentz)',
    frameworkNote: 'A real, named practitioner framework -- not mainstream endocrinology consensus. See Purple Digest\'s own Healing Stages category for the full, cited guide.',
    stages: HEALING_STAGES.map((code) => ({
      code,
      label: HEALING_STAGE_INFO[code].label,
      shortDescription: HEALING_STAGE_INFO[code].shortDescription,
    })),
    foodRelevantStageCodes: FOOD_RELEVANT_HEALING_STAGES,
  },
  {
    conditionCode: 'ibs',
    conditionLabel: 'Irritable Bowel Syndrome',
    frameworkName: 'The Low-FODMAP Elimination / Reintroduction / Personalization Protocol',
    frameworkNote: 'A real, standard clinical protocol (Halmos & Gibson 2019, PMID 30945376) -- not specific to this app. See Purple Digest\'s own IBS category for the full, cited evidence.',
    stages: IBS_PHASES.map((code) => ({
      code,
      label: IBS_PHASE_INFO[code].label,
      shortDescription: IBS_PHASE_INFO[code].shortDescription,
    })),
    foodRelevantStageCodes: FOOD_RELEVANT_IBS_PHASES,
  },
  {
    conditionCode: 'celiac',
    conditionLabel: 'Celiac Disease',
    frameworkName: "The Real, Age-Dependent Villi-Healing Timeline",
    frameworkNote: 'A real, cited healing window (not the diagnostic Marsh biopsy scale) -- see Purple Digest\'s own Celiac Disease category for the full evidence, including why healing can take up to 2 years.',
    stages: CELIAC_STAGES.map((code) => ({
      code,
      label: CELIAC_STAGE_INFO[code].label,
      shortDescription: CELIAC_STAGE_INFO[code].shortDescription,
    })),
    foodRelevantStageCodes: FOOD_RELEVANT_CELIAC_STAGES,
  },
  {
    conditionCode: 'ibd',
    conditionLabel: 'Inflammatory Bowel Disease',
    frameworkName: 'The Real, Clinical Flare / Remission Distinction',
    frameworkNote: 'A real, standard clinical distinction (not the diagnostic Montreal classification, which is static) -- see Purple Digest\'s own Inflammatory Bowel Disease category for the full evidence.',
    stages: IBD_STAGES.map((code) => ({
      code,
      label: IBD_STAGE_INFO[code].label,
      shortDescription: IBD_STAGE_INFO[code].shortDescription,
    })),
    foodRelevantStageCodes: FOOD_RELEVANT_IBD_STAGES,
  },
  {
    // NOTE: 'chronic_kidney_disease', not 'chronicKidneyDisease' -- the
    // real conditions.code value (snake_case), confirmed via direct query,
    // NOT the Digest's own camelCase category key. Every other entry in
    // this registry happens to share one identical string between the two
    // naming conventions; CKD does not (see lib/conditionCodeMap.ts's own
    // header comment: "never lined up automatically").
    conditionCode: 'chronic_kidney_disease',
    conditionLabel: 'Chronic Kidney Disease',
    frameworkName: 'The Real Pre-Dialysis / On-Dialysis Dietary Reversal',
    frameworkNote: 'A real, cited clinical reversal (not the diagnostic KDIGO G/A staging grid, which is static) -- see Purple Digest\'s own Chronic Kidney Disease category for the full evidence.',
    stages: CKD_STAGES.map((code) => ({
      code,
      label: CKD_STAGE_INFO[code].label,
      shortDescription: CKD_STAGE_INFO[code].shortDescription,
    })),
    foodRelevantStageCodes: FOOD_RELEVANT_CKD_STAGES,
  },
];

export function getConditionStagingModel(conditionCode: string): ConditionStagingModel | null {
  return CONDITION_STAGING_MODELS.find((model) => model.conditionCode === conditionCode) ?? null;
}
