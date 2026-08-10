// Healing-journey stages -- decided 2026-07-31 (see CLAUDE.md's own
// "Healing-journey stages" section for the full framework/evidence-tier
// sourcing history), built for real 2026-08-09. A real, attributed,
// five-stage healing/regression model associated with Dr. Izabella Wentz
// -- a practitioner framework, NOT mainstream endocrinology consensus,
// and presented that way throughout this feature (see the Profile
// picker's own framing text).
//
// Advisory + reordering only, NEVER gating -- an explicit, standing
// product decision. Nothing in this app hides or blocks a food based on
// stage; a food genuinely questionable for the current stage gets a
// tappable flag with a real explanation (lib/healingStageAdvisory.ts),
// the same shape the existing alcohol/coffee/juice advisories already
// use.
//
// Only two of the five real stages meaningfully drive food decisions --
// Digging (removing triggers) and Gut Repair (reintroduction) -- per this
// app's own already-decided practical-scoping note. Triage/Rebalancing/
// Maintenance are real, named stages a person can still self-declare (the
// picker shows all five, honestly, since that is the real framework), but
// produce no food-advisory output of their own; see
// FOOD_RELEVANT_HEALING_STAGES below.
export type HealingStage = 'triage' | 'digging' | 'gut_repair' | 'rebalancing' | 'maintenance';

export const HEALING_STAGES: HealingStage[] = ['triage', 'digging', 'gut_repair', 'rebalancing', 'maintenance'];

export const HEALING_STAGE_INFO: Record<HealingStage, { label: string; shortDescription: string }> = {
  triage: {
    label: 'Stage 1: Triage',
    shortDescription: 'Symptom relief and hormone stabilization -- just starting out, or still finding your footing.',
  },
  digging: {
    label: 'Stage 2: Digging',
    shortDescription: 'Removing triggers -- most often gluten and dairy first. Food choices matter the most here.',
  },
  gut_repair: {
    label: 'Stage 3: Gut Repair',
    shortDescription: 'Intestinal permeability and reintroduction, one food at a time. Food choices still matter a lot here.',
  },
  rebalancing: {
    label: 'Stage 4: Rebalancing',
    shortDescription: 'Immune modulation and HPA/adrenal support -- broader lifestyle work, less about strict food rules.',
  },
  maintenance: {
    label: 'Stage 5: Maintenance',
    shortDescription: "Clinical remission, antibodies in range -- maintaining what's already working.",
  },
};

// Only these two stages produce a real food advisory (see
// lib/healingStageAdvisory.ts) -- matches this app's own standing,
// already-decided practical-scoping note ("only stages 2 and 3
// meaningfully drive food decisions").
export const FOOD_RELEVANT_HEALING_STAGES: HealingStage[] = ['digging', 'gut_repair'];
