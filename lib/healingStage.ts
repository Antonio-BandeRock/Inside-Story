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

// 2026-08-27, direct question: "many [difficulties] are also overcome as
// the user gets through the different stages of healing. Are we
// accounting for that throughout the entire stock of system recipes?"
// Investigated directly, not assumed: the honest answer was no --
// Rebalancing and Maintenance produced zero food-advisory output at all,
// so someone who'd fully healed and reintroduced everything saw the
// exact same red flags as someone just starting Digging. Extended here,
// reusing Rebalancing's and Maintenance's own already-published
// descriptions above ("less about strict food rules," "maintaining
// what's already working") as the real basis: lib/healingStageAdvisory.ts
// softens the GLUTEN/DAIRY/NIGHTSHADE reasons specifically for these two
// stages (the genuine elimination-diet reintroduction triggers Digging/
// Gut Repair exist to test), since those are the real candidates for
// being "overcome" through the process this app already models. The
// Goitrogenic(Raw)/Additives/Processing reasons are deliberately left
// firing with the same message at every stage -- they're not
// reintroduction-dependent trigger sensitivities, they're an ongoing
// biochemical mechanism (raw goitrogens/iodine uptake) or a general food-
// quality concern (additives/processing), neither of which resolves
// just because someone reached remission. Triage stays excluded, per the
// model's own real framing: it's about initial symptom relief and
// hormone stabilization, not diet, matching the pre-existing scoping
// note this file's own history already established.
export const FOOD_RELEVANT_HEALING_STAGES: HealingStage[] = ['digging', 'gut_repair', 'rebalancing', 'maintenance'];
