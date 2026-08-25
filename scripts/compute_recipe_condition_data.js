// Computes, for all 300 curated recipes, real condition-safety and
// healing-stage data -- 2026-08-24, direct request: "there needs to be
// an association between the recipes and the conditions somehow, so
// that the user can look through their specific condition that will
// then show them meals they can eat, depending on the stage of their
// conditions."
//
// Everything here reuses this app's own already-built, already-verified
// condition-scoring and stage-advisory machinery, faithfully replicated
// against the live database via raw SQL rather than re-derived or
// guessed -- the exact same queries/rules lib/db.ts's own
// getFoodScoresForCondition/getFoodScores and the six per-condition
// stage-advisory files (lib/healingStageAdvisory.ts,
// lib/ibsPhaseAdvisory.ts, lib/celiacStageAdvisory.ts,
// lib/ibdStageAdvisory.ts, lib/ckdStageAdvisory.ts,
// lib/goutStageAdvisory.ts) already use in the running app, so a recipe
// tagged "safe" here means the exact same thing "no flag" already means
// everywhere else in this app.
//
// Three real, separate outputs per recipe:
//
//   safeForConditions: string[] -- condition codes (the live
//     `conditions` table's own snake_case codes) this recipe has ZERO
//     flagged (yellow/red-tier) ingredients for, scoped to that
//     condition's own real relevant sub-criteria (home_condition_code
//     OR sub_criterion_condition_relevance), exactly matching
//     getFoodScoresForCondition's own real scoping. Only computed for
//     conditions with real, non-empty scoring coverage in this
//     database. Migraine had ZERO home-owned or relevance-mapped
//     sub-criteria when this script was first written (2026-08-24),
//     excluded rather than trivially marked "safe" for everything --
//     later the same day, direct follow-up research (see
//     migraine-aip-elimination-diet-inflammation/-histamine-dao-
//     deficiency in lib/digest/migraine.ts) justified a real
//     Additives/Processing relevance mapping (see
//     scripts/add_migraine_condition_relevance.js), so Migraine now has
//     real coverage too -- all 19 tracked conditions do.
//
//   conditionCautions: {[conditionCode]: {severity, note}} -- 2026-08-24,
//     direct correction: the original version of this script used
//     safeForConditions as a hard include/exclude gate on "Meals You Can
//     Eat," which directly contradicted this app's own standing
//     healing-stage rule ("advisory and reordering only, never gating")
//     and, combined with a wide criteria net, meant only near-single-
//     ingredient recipes could ever pass for a condition like
//     Hashimoto's (confirmed directly: its own "safe" list was 18 of
//     300, every one a fermented drink, zero actual meals). A recipe
//     that trips a flag for a condition is no longer excluded -- it gets
//     a real, computed one-sentence caution here instead, naming the
//     specific flagged ingredient (the single most severe hit, red
//     before yellow) and what the flag means, built from the same tier
//     vocabulary the rest of this app already uses. One entry per
//     flagged condition; a condition absent here for a given recipe
//     means that recipe is genuinely clean for it (already reflected in
//     safeForConditions too).
//
//     2026-08-25, direct correction to the correction: "All of the
//     conditions list all 300 meals saying they can eat all of them.
//     That cannot be." Correct -- treating every caution as
//     interchangeable made a serious, well-documented concern (Gluten:
//     High Risk for Celiac, never safe in any amount) read the same as a
//     mild, portion-aware one (Sodium: Moderate). `severity` ('yellow' |
//     'red') is now recorded alongside `note`, the worse of the two
//     outcomes across every real hit for that condition (matching
//     pickCautionHit's own red-first rule), so the UI can group and
//     color genuinely differently instead of flattening every flag into
//     one undifferentiated "caution."
//
//   stageAdvisoryNotes: {condition, note}[] -- real, computed
//     RecipeConditionNote-shaped entries, one per (staged condition x
//     food-relevant stage) that actually fires for this recipe's own
//     ingredients, using the EXACT same rule logic as each condition's
//     own stage-advisory file (ported here as pure functions, not
//     reinvented). Only the 6 conditions with a real staging model
//     (lib/conditionStages.ts) produce anything. Deliberately additive
//     to recipes.ts's own existing hand-written conditionNotes, never
//     replacing them -- these are a real, different, mechanically
//     computed kind of note (stage-specific), appended alongside the
//     hand-verified general ones already there.
//
// Usage:
//   node scripts/compute_recipe_condition_data.js
// Writes scripts/_recipe_condition_data_output.json.

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SQLITE3 = 'C:/Users/TonyR/AppData/Local/Android/Sdk/platform-tools/sqlite3.exe';
const DB = path.join(__dirname, '..', 'assets', 'data', 'foods_reference.db');

function runSql(sql, params = []) {
  // Simple positional '?' substitution -- every value used here is a
  // controlled, internally-generated string/number, never external
  // input, so straightforward inline quoting is safe.
  let i = 0;
  const filled = sql.replace(/\?/g, () => {
    const v = params[i++];
    if (v === null || v === undefined) return 'NULL';
    if (typeof v === 'number') return String(v);
    return `'${String(v).replace(/'/g, "''")}'`;
  });
  const out = execFileSync(SQLITE3, ['-json', DB, filled], { maxBuffer: 1024 * 1024 * 128 });
  const text = out.toString('utf8').trim();
  return text ? JSON.parse(text) : [];
}

// ---------------------------------------------------------------------
// Condition labels (matching CONDITION_STAGING_MODELS' own conditionLabel
// and CONDITION_CODE_TO_DIGEST_KEY's own known 19 codes).
// ---------------------------------------------------------------------
const CONDITION_LABELS = {
  hashimotos: "Hashimoto's Disease",
  rheumatoid_arthritis: 'Rheumatoid Arthritis',
  psoriasis: 'Psoriasis',
  graves: "Graves' Disease",
  type_1_diabetes: 'Type 1 Diabetes',
  celiac: 'Celiac Disease',
  ibd: 'Inflammatory Bowel Disease',
  multiple_sclerosis: 'Multiple Sclerosis',
  lupus: 'Lupus',
  sjogrens: "Sjögren's Syndrome",
  pcos: 'PCOS',
  chronic_kidney_disease: 'Chronic Kidney Disease',
  fatty_liver_disease: 'Fatty Liver Disease',
  type_2_diabetes: 'Type 2 Diabetes',
  ibs: 'Irritable Bowel Syndrome',
  migraine: 'Migraine',
  cardiovascular_disease: 'Cardiovascular Disease',
  gout: 'Gout',
  prostate_health: 'Prostate Health',
};

// ---------------------------------------------------------------------
// Tier classification -- faithful port of lib/sixDimensionsReference.ts's
// own GREEN_TIERS/YELLOW_TIERS/RED_TIERS/tierSeverity/isFlaggedTier.
// ---------------------------------------------------------------------
const GREEN_TIERS = new Set([
  'Neutral', 'Ideal', 'Supportive', 'Minimal', 'Low', 'Safe',
  'Gluten-Free', 'None Detected', 'Enhancing', 'Protective', 'Fortified',
]);
const YELLOW_TIERS = new Set(['Use Carefully', 'Mild Risk', 'Moderate', 'Disruptive', 'Inhibiting', 'Imbalanced', 'Natural']);
const RED_TIERS = new Set(['Excess Risk', 'High Risk', 'High', 'Very High', 'Goitrogenic', 'Inflammatory', 'Present']);

function tierSeverity(tier) {
  if (tier.startsWith('No real, cited oxalate')) return 'unknown';
  if (tier.startsWith('Low oxalate')) return 'green';
  if (tier.startsWith('Moderate oxalate')) return 'yellow';
  if (tier.startsWith('Elevated oxalate')) return 'yellow';
  if (tier.startsWith('High oxalate')) return 'red';
  if (tier === 'Not Assessed') return 'unknown';
  const baseWord = tier.replace(/\s*\([^)]*\)\s*$/, '').trim();
  if (GREEN_TIERS.has(baseWord)) return 'green';
  if (YELLOW_TIERS.has(baseWord)) return 'yellow';
  if (RED_TIERS.has(baseWord)) return 'red';
  return 'unknown';
}

// Two sub-criteria excluded from the flagged-tier check entirely --
// found by direct query before trusting the first run's own results,
// which came back with ZERO recipes safe for Hashimoto's, a real red
// flag rather than a plausible outcome. "Selenium & Zn synergy:
// Inhibiting" turned out to hit ~50% of all 22,022 foods in this
// database, "Iron Presence: Inhibiting" a further ~5.5% -- matching a
// precedent already documented directly in this app's own recipes.ts
// header comment: "two of the most common real tags... turned out...
// to appear on nearly every single ingredient in nearly every recipe
// (a real, near-universal background signal in this app's own D1-D6
// mineral-absorption dimension, not a meaningful per-recipe caution)".
// Excluded here the same way that hand-written conditionNotes work
// already excluded them, not a new decision.
const NEAR_UNIVERSAL_SUB_CRITERIA = new Set(['Selenium & Zn synergy', 'Iron Presence']);

// Matches lib/sixDimensionsReference.ts's own isFlaggedTier exactly
// (yellow OR red) once the near-universal exclusion above is applied --
// tried red-only first, specifically to investigate why a first run
// returned only 18 of 300 recipes safe for Hashimoto's, and reverted:
// red-only fixed Hashimoto's number but made 13 of the other 17 covered
// conditions trivially show ALL 300 recipes as "safe" (Lupus/PCOS/
// Sjögren's/etc. each own only 1-2 real relevant sub-criteria, and none
// of those specific ones ever reach red tier anywhere in this database,
// confirmed by direct query -- a red-only bar would silently stop
// discriminating anything for them at all). Hashimoto's own low count
// under yellow-or-red isn't a bug to correct: it owns 25 real
// sub-criteria, the most comprehensive real scoring of any condition in
// this app, and every other Hashimoto's-relevant sub-criterion's own
// flagged rate (checked individually, all under 16%) is a real,
// meaningfully selective signal, not background noise -- a smaller,
// more selective "safe" list is the honest, correct consequence of
// checking a wider, more rigorous net of real criteria, not something
// to water down for a rounder-looking number.
function isFlaggedTier(tier, subCriterion) {
  if (subCriterion && NEAR_UNIVERSAL_SUB_CRITERIA.has(subCriterion)) return false;
  const s = tierSeverity(tier);
  return s === 'yellow' || s === 'red';
}

// ---------------------------------------------------------------------
// Condition caution notes -- 2026-08-24, direct correction to the
// original "Meals You Can Eat" build: "What they can eat is exactly
// that, everything they can eat, at the levels of healing that they
// need to start from and achieve along the way." The original binary
// safeForConditions gate (a recipe is either fully included or fully
// excluded the moment ANY one ingredient trips ANY one relevant flag)
// directly contradicted this app's own standing healing-stage rule
// ("advisory and reordering only, never gating" -- CLAUDE.md), and
// combined badly with a wide criteria net (Hashimoto's own 25 relevant
// sub-criteria): more ingredients means more chances to trip one single
// flag somewhere, so only near-single-ingredient recipes (fermented
// drinks) could ever pass, exactly the reported symptom. Confirmed by
// direct count before writing any code: Hashimoto's own "safe" list was
// 18 of 300, every one of them a fermented drink, zero actual meals.
//
// Fix: safeForConditions is kept (a recipe with zero relevant flags is
// still worth marking as genuinely clean, for sorting), but a flagged
// recipe is no longer excluded -- it gets a real, computed caution
// sentence instead, naming the specific flagged ingredient and what the
// flag means, built from the exact same tier vocabulary and definitions
// already shown everywhere else in this app (a faithful port of
// lib/sixDimensionsReference.ts's own TIER_DEFINITIONS, phrased as a
// template so it reads naturally combined with a real ingredient name
// rather than the generic "this food"/"this factor" pronouns that
// module's own UI-context version uses).
// Deliberately structured as "Ingredient: rated Tier for factor. <plain
// explanation>" rather than making the ingredient name the grammatical
// subject of a verb -- a first version tried that ("Flax seeds skews
// unfavorably...") and broke on subject-verb agreement for any plural
// ingredient name, since there's no reliable way to detect an arbitrary
// base_name's grammatical number. The colon-plus-explanation form needs
// no agreement at all, and the explanation sentence uses "This," never
// the ingredient name, as its own subject for the same reason.
const TIER_CAUTION_EXPLANATIONS = {
  Goitrogenic: 'Goitrogens can interfere with thyroid iodine uptake; cooking substantially reduces this for most foods.',
  'Use Carefully': 'This may need portion awareness or a doctor’s guidance.',
  'Excess Risk': 'Eating a lot of this could push the level above a healthy range.',
  'Mild Risk': 'A modest, generally minor concern.',
  'High Risk': 'A significant, well-documented concern.',
  Disruptive: 'This may work against or interfere with the process being measured.',
  High: 'A meaningfully high level for this measure.',
  'Very High': 'The highest tier used for this measure.',
  Inhibiting: 'This may reduce or block the process being measured.',
  Imbalanced: 'The ratio being measured skews unfavorably here.',
  Present: 'A measurable amount is present.',
  Moderate: 'A moderate level for this measure.',
  Natural: 'A naturally occurring form, treated differently from an industrially produced one.',
};
const TIER_CAUTION_QUALIFIERS = [
  { pattern: /\(Raw\)/i, phrase: ' in its raw form' },
  { pattern: /\(Cooked\)/i, phrase: ' after cooking' },
];

function buildCautionSentence(baseName, subCriterion, tier) {
  const baseWord = tier.replace(/\s*\([^)]*\)\s*$/, '').trim();
  const explanation = TIER_CAUTION_EXPLANATIONS[baseWord] ?? `Rated ${tier} for this factor.`;
  // Skip the qualifier suffix when the ingredient's own base_name already
  // names the form directly (e.g. "Chicken Egg (Raw)" is a real, distinct
  // curated_recipe_ingredients.base_name in this database, not something
  // this script adds) -- otherwise it would read as a redundant "(Raw)...
  // in its raw form."
  const alreadyNamesForm = /\((raw|cooked)\)/i.test(baseName);
  const qualifier = alreadyNamesForm ? '' : (TIER_CAUTION_QUALIFIERS.find(({ pattern }) => pattern.test(tier))?.phrase ?? '');
  return `${baseName}: rated ${tier} for ${subCriterion.toLowerCase()}${qualifier}. ${explanation}`;
}

// Picks the single most useful hit to caption a flagged recipe with: red
// severity first (the more significant real concern), then the first one
// encountered in the recipe's own ingredient order -- one clear sentence
// reads better as a caption than a stacked list, and this is advisory
// text pointing at a real flag, not an exhaustive audit.
function pickCautionHit(hits) {
  const red = hits.find((h) => tierSeverity(h.tier) === 'red');
  return red ?? hits[0];
}

// ---------------------------------------------------------------------
// Ingredient resolution -- faithful port of resolveCuratedRecipeIngredient/
// resolveFoodChoice/buildScopeClause (lib/db.ts).
// ---------------------------------------------------------------------
function resolveViaPrep(category, baseName, prepMethod) {
  const normalizedPrep = prepMethod || 'Standard';
  const rows = runSql(
    `
      SELECT food_id, source, name
      FROM foods
      WHERE category = ? AND hidden = 0 AND base_name = ?
        AND COALESCE(prep_method, 'Standard') = ?
      ORDER BY
        CASE WHEN source IN ('USDA', 'Derived') THEN 0 ELSE 1 END,
        CASE
          WHEN name LIKE '%without salt%' OR name LIKE '%no salt added%' OR name LIKE '%unsalted%' THEN 0
          WHEN name LIKE '%with salt%' OR name LIKE '%salted%' THEN 2
          ELSE 1
        END,
        food_id
      LIMIT 1
    `,
    [category, baseName, normalizedPrep],
  );
  return rows[0] ?? null;
}

function resolveCuratedRecipeIngredient(category, baseName) {
  let row = resolveViaPrep(category, baseName, 'Raw');
  if (row) return row;
  row = resolveViaPrep(category, baseName, null);
  if (row) return row;
  const rows = runSql(
    `SELECT food_id, source FROM foods
     WHERE category = ? AND base_name = ? AND hidden = 0
     ORDER BY CASE WHEN source IN ('USDA', 'Derived') THEN 0 ELSE 1 END, food_id
     LIMIT 1`,
    [category, baseName],
  );
  return rows[0] ?? null;
}

// ---------------------------------------------------------------------
// Stage advisory logic -- faithful port of the 6 real per-condition
// stage-advisory files. Each takes a plain array of {dimension,
// subCriterion, tier} rows (one ingredient's full, unfiltered score set,
// the exact shape getFoodScores returns) and a stage code, returning a
// real reasons[] array (empty if nothing fires), matching each real
// file's own exact tier checks -- not reinvented.
// ---------------------------------------------------------------------
function findTier(scores, subCriterion) {
  const row = scores.find((s) => s.subCriterion === subCriterion);
  return row ? row.tier : null;
}

// Hashimoto's -- lib/healingStageAdvisory.ts. Reasons rewritten to plain
// punctuation and stripped of "real"/"genuinely"/redundant-"own" filler
// per this app's own standing writing-style rule -- the SOURCE file
// itself still uses " -- " and "real" as filler throughout (a real,
// separate cleanup this pass found but didn't fix, since it's outside
// today's own scope); the underlying factual claim in each reason is
// unchanged from that file's own real logic, just reworded.
const FOOD_RELEVANT_HEALING_STAGES = ['digging', 'gut_repair'];
function healingStageReasons(scores, stage) {
  if (!FOOD_RELEVANT_HEALING_STAGES.includes(stage)) return [];
  const reasons = [];
  if (findTier(scores, 'Gluten') === 'High Risk') {
    reasons.push(
      stage === 'digging'
        ? 'Contains gluten, one of the first things this stage typically removes.'
        : "Contains gluten. If you haven't reintroduced it yet, this is one to watch closely when you do.",
    );
  }
  if (findTier(scores, 'Goitrogenic Load') === 'Goitrogenic (Raw)') {
    reasons.push('A raw goitrogenic (cruciferous) food. The staged food guide flags these specifically raw; cooking largely resolves the concern.');
  }
  const eliminationTier = findTier(scores, 'Common Elimination-Diet Trigger Food');
  if (eliminationTier === 'Dairy') {
    reasons.push(
      stage === 'digging'
        ? 'Dairy, the other food typically removed alongside gluten at this stage.'
        : "Dairy. If you haven't reintroduced it yet, this is one to test carefully, one food at a time.",
    );
  }
  if (eliminationTier === 'Nightshade') {
    reasons.push('A nightshade. The staged food guide is honest that this one is unresolved (anti-inflammatory evidence alongside patient-reported worsening). Worth testing for yourself, not a firm rule.');
  }
  if (findTier(scores, 'Additives') === 'High Risk') {
    reasons.push("Carries a flagged additive; see this app's Food Additives research (Digest) for the specific concern.");
  }
  if (findTier(scores, 'Processing') === 'High Risk') {
    reasons.push('Heavily processed. The staged food guide leans toward whole, home-cooked foods, especially in this stage.');
  }
  return reasons;
}

// IBS -- lib/ibsPhaseAdvisory.ts
const FOOD_RELEVANT_IBS_PHASES = ['elimination'];
function ibsPhaseReasons(scores, phase) {
  if (!FOOD_RELEVANT_IBS_PHASES.includes(phase)) return [];
  const reasons = [];
  if (findTier(scores, 'Excess Fiber or Anti-Nutrients') === 'Disruptive') {
    reasons.push('Flagged for excess fiber/anti-nutrient load, a digestive-tolerance concern worth noticing during a restriction period.');
  }
  if (findTier(scores, 'Irritants') === 'Disruptive') {
    reasons.push('Flagged as a digestive irritant, worth noticing during a restriction period for the same reason.');
  }
  return reasons;
}

// Celiac -- lib/celiacStageAdvisory.ts
const FOOD_RELEVANT_CELIAC_STAGES = ['actively_healing'];
function celiacStageReasons(scores, stage) {
  if (!FOOD_RELEVANT_CELIAC_STAGES.includes(stage)) return [];
  const reasons = [];
  if (findTier(scores, 'Gluten') === 'High Risk') {
    reasons.push('Contains gluten. Strict avoidance matters most during this often-long healing window; even small, repeated exposure can keep the gut from healing.');
  }
  if (findTier(scores, 'Common Elimination-Diet Trigger Food') === 'Dairy') {
    reasons.push('Dairy. Secondary lactose intolerance is a well-documented finding at celiac diagnosis. Worth noticing if dairy still bothers you, not a lifelong rule.');
  }
  return reasons;
}

// IBD -- lib/ibdStageAdvisory.ts
const FOOD_RELEVANT_IBD_STAGES = ['flare', 'remission'];
function ibdStageReasons(scores, stage) {
  if (!FOOD_RELEVANT_IBD_STAGES.includes(stage)) return [];
  const reasons = [];
  if (stage === 'flare') {
    if (findTier(scores, 'Additives') === 'High Risk') {
      reasons.push('Carries a flagged additive. Research found specific emulsifiers worsened colitis directly in susceptible mice, worth extra attention during active disease.');
    }
    if (findTier(scores, 'Processing') === 'High Risk') {
      reasons.push('Heavily processed. Cohort data links ultra-processed food intake with higher IBD flare risk (not a fiber warning).');
    }
  }
  if (stage === 'remission') {
    const excessFiberTier = findTier(scores, 'Excess Fiber or Anti-Nutrients');
    const irritantsTier = findTier(scores, 'Irritants');
    if (excessFiberTier === 'Disruptive' || irritantsTier === 'Disruptive') {
      reasons.push('Flagged for a digestive-tolerance concern, worth noticing as a possible separate, overlapping IBS-type issue if remission is confirmed but symptoms persist.');
    }
  }
  return reasons;
}

// CKD -- lib/ckdStageAdvisory.ts
const FOOD_RELEVANT_CKD_STAGES = ['pre_dialysis', 'on_dialysis'];
function ckdStageReasons(scores, stage) {
  if (!FOOD_RELEVANT_CKD_STAGES.includes(stage)) return [];
  const proteinTier = findTier(scores, 'Protein Density');
  const reasons = [];
  if (stage === 'pre_dialysis') {
    if (proteinTier === 'High Protein Density' || proteinTier === 'Very High Protein Density') {
      reasons.push('A protein-dense food, worth watching against the 0.6-0.8g/kg/day ceiling most pre-dialysis CKD guidance recommends.');
    }
  } else {
    if (proteinTier === 'Low Protein Density') {
      reasons.push('A protein-light food. Dialysis itself removes protein your body now needs replaced, not restricted.');
    }
  }
  return reasons;
}

// Gout -- lib/goutStageAdvisory.ts
const FOOD_RELEVANT_GOUT_STAGES = ['acute_flare', 'intercritical'];
function goutStageReasons(scores, stage) {
  if (!FOOD_RELEVANT_GOUT_STAGES.includes(stage)) return [];
  const flagged = findTier(scores, 'Additives') === 'High Risk' || findTier(scores, 'Processing') === 'High Risk';
  if (!flagged) return [];
  return [
    stage === 'acute_flare'
      ? 'Heavily processed or sugar-sweetened. A large study found 2+ sugary drinks a day carrying an 85% higher gout risk, worth extra attention during an active flare.'
      : "Heavily processed or sugar-sweetened. Worth staying just as mindful of here; the intercritical stage isn't a true remission, and crystal deposition continues even though nothing hurts.",
  ];
}

// 2026-08-24, direct correction: these stage labels were hand-typed
// against a rough memory of each condition's own real stage names rather
// than copied from the actual canonical source (lib/conditionStages.ts's
// own CONDITION_STAGING_MODELS, and each stage's own real *_STAGE_INFO/
// *_PHASE_INFO object), and 3 of the 6 drifted from what Profile's own
// stage picker actually shows: Hashimoto's 'Digging (Removing Triggers)'
// / 'Gut Repair (Reintroduction)' should have been 'Stage 2: Digging' /
// 'Stage 3: Gut Repair' (lib/healingStage.ts), Gout's 'Acute Flare' /
// 'Intercritical (Between Flares)' should have been 'Stage 2: Acute
// Flare' / 'Stage 3: Intercritical (Between Flares)' (lib/goutStageAdvisory.ts),
// and IBS's 'Elimination Phase' should have been 'Phase 1: Elimination'
// (lib/ibsPhaseAdvisory.ts) -- found only once a real caller
// (app/(tabs)/purple-digest.tsx's own stageNoteKeyFor, built against the
// real canonical labels) needed the exact stored note.condition string
// to match and silently didn't for these three. Corrected here to the
// real, verified label text (confirmed via direct grep against each
// source file, not re-guessed); the already-applied text in recipes.ts
// itself was corrected separately, by a targeted string replace, not by
// re-running this script's own apply step (see CLAUDE.md's own note on
// why that step isn't safe to re-run). Celiac/IBD/CKD were already
// correct, confirmed the same way.
const STAGED_CONDITIONS = [
  {
    code: 'hashimotos',
    label: "Hashimoto's Disease",
    stages: [
      { code: 'digging', label: 'Stage 2: Digging' },
      { code: 'gut_repair', label: 'Stage 3: Gut Repair' },
    ],
    reasonsFor: healingStageReasons,
  },
  {
    code: 'ibs',
    label: 'Irritable Bowel Syndrome',
    stages: [{ code: 'elimination', label: 'Phase 1: Elimination' }],
    reasonsFor: ibsPhaseReasons,
  },
  {
    code: 'celiac',
    label: 'Celiac Disease',
    stages: [{ code: 'actively_healing', label: 'Newly Diagnosed / Actively Healing' }],
    reasonsFor: celiacStageReasons,
  },
  {
    code: 'ibd',
    label: 'Inflammatory Bowel Disease',
    stages: [
      { code: 'flare', label: 'Flare / Active Disease' },
      { code: 'remission', label: 'Remission' },
    ],
    reasonsFor: ibdStageReasons,
  },
  {
    code: 'chronic_kidney_disease',
    label: 'Chronic Kidney Disease',
    stages: [
      { code: 'pre_dialysis', label: 'Pre-Dialysis' },
      { code: 'on_dialysis', label: 'On Dialysis' },
    ],
    reasonsFor: ckdStageReasons,
  },
  {
    code: 'gout',
    label: 'Gout',
    stages: [
      { code: 'acute_flare', label: 'Stage 2: Acute Flare' },
      { code: 'intercritical', label: 'Stage 3: Intercritical (Between Flares)' },
    ],
    reasonsFor: goutStageReasons,
  },
];

// ---------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------
console.log('Loading sub_criteria and relevance tables...');
const subCriteriaRows = runSql('SELECT id, dimension, sub_criterion AS subCriterion, home_condition_code AS homeConditionCode FROM sub_criteria');
const subCriteriaById = new Map(subCriteriaRows.map((r) => [r.id, r]));

const relevanceRows = runSql('SELECT sub_criterion_id AS subCriterionId, condition_code AS conditionCode FROM sub_criterion_condition_relevance');
const relevanceBySubCriterion = new Map();
for (const row of relevanceRows) {
  if (!relevanceBySubCriterion.has(row.subCriterionId)) relevanceBySubCriterion.set(row.subCriterionId, new Set());
  relevanceBySubCriterion.get(row.subCriterionId).add(row.conditionCode);
}

// Real conditions with at least one real, relevant sub-criterion --
// dynamic, not a hardcoded 18-of-19 list, so a later real coverage
// addition (Migraine's own Additives/Processing mapping, added
// 2026-08-24, see add_migraine_condition_relevance.js) is picked up
// automatically on the next run without touching this script.
const coveredConditions = new Set();
for (const row of subCriteriaRows) {
  if (row.homeConditionCode) coveredConditions.add(row.homeConditionCode);
}
for (const set of relevanceBySubCriterion.values()) {
  for (const code of set) coveredConditions.add(code);
}
console.log(`Covered conditions (${coveredConditions.size}):`, Array.from(coveredConditions).sort().join(', '));

function isRelevantToCondition(subCriterionId, conditionCode) {
  const sc = subCriteriaById.get(subCriterionId);
  if (!sc) return false;
  if (sc.homeConditionCode === conditionCode) return true;
  const relevantSet = relevanceBySubCriterion.get(subCriterionId);
  return relevantSet ? relevantSet.has(conditionCode) : false;
}

console.log('Loading recipe ingredients...');
const ingredientRows = runSql('SELECT recipe_id AS recipeId, category, base_name AS baseName FROM curated_recipe_ingredients ORDER BY recipe_id, sort_order');

console.log('Resolving distinct ingredients to real food rows...');
const distinctPairs = new Map();
for (const row of ingredientRows) {
  distinctPairs.set(`${row.category}|${row.baseName}`, { category: row.category, baseName: row.baseName });
}
const resolvedByKey = new Map();
let unresolved = 0;
for (const [key, { category, baseName }] of distinctPairs) {
  const resolved = resolveCuratedRecipeIngredient(category, baseName);
  if (!resolved) {
    unresolved++;
    console.warn(`  UNRESOLVED: ${key}`);
    continue;
  }
  resolvedByKey.set(key, resolved);
}
console.log(`Resolved ${resolvedByKey.size} of ${distinctPairs.size} distinct ingredients (${unresolved} unresolved).`);

console.log('Loading food_scores for every resolved ingredient...');
const scoresByFoodKey = new Map(); // "foodId|source" -> [{dimension, subCriterion, tier, subCriterionId}]
const neededFoodKeys = new Set(Array.from(resolvedByKey.values()).map((r) => `${r.food_id}|${r.source}`));
for (const foodKey of neededFoodKeys) {
  const [foodId, source] = foodKey.split('|');
  const rows = runSql(
    'SELECT fs.sub_criterion_id AS subCriterionId, sc.dimension AS dimension, sc.sub_criterion AS subCriterion, fs.tier AS tier FROM food_scores fs JOIN sub_criteria sc ON sc.id = fs.sub_criterion_id WHERE fs.food_id = ? AND fs.source = ?',
    [Number(foodId), source],
  );
  scoresByFoodKey.set(foodKey, rows);
}

// Group ingredient rows by recipe.
const ingredientsByRecipe = new Map();
for (const row of ingredientRows) {
  if (!ingredientsByRecipe.has(row.recipeId)) ingredientsByRecipe.set(row.recipeId, []);
  ingredientsByRecipe.get(row.recipeId).push(row);
}

console.log('Computing per-recipe condition safety, cautions, and stage advisories...');
const output = {};
for (const [recipeId, ingredients] of ingredientsByRecipe.entries()) {
  const resolvedIngredientScores = [];
  // Parallel array to resolvedIngredientScores -- each ingredient's own
  // real base_name, so a flagged hit can be captioned with the actual
  // ingredient responsible, not just "something in this recipe."
  const resolvedIngredientNames = [];
  for (const ing of ingredients) {
    const key = `${ing.category}|${ing.baseName}`;
    const resolved = resolvedByKey.get(key);
    if (!resolved) continue;
    const foodKey = `${resolved.food_id}|${resolved.source}`;
    resolvedIngredientScores.push(scoresByFoodKey.get(foodKey) ?? []);
    resolvedIngredientNames.push(ing.baseName);
  }

  // --- safeForConditions + conditionCautions ---
  const safeForConditions = [];
  const conditionCautions = {};
  for (const conditionCode of coveredConditions) {
    const hits = [];
    for (let i = 0; i < resolvedIngredientScores.length; i++) {
      const scores = resolvedIngredientScores[i];
      const baseName = resolvedIngredientNames[i];
      for (const row of scores) {
        if (isRelevantToCondition(row.subCriterionId, conditionCode) && isFlaggedTier(row.tier, row.subCriterion)) {
          hits.push({ baseName, subCriterion: row.subCriterion, tier: row.tier });
        }
      }
    }
    if (hits.length === 0) {
      safeForConditions.push(conditionCode);
    } else {
      const hit = pickCautionHit(hits);
      // 2026-08-25, direct correction: "All of the conditions list all
      // 300 meals saying they can eat all of them. That cannot be."
      // Correct -- a caption alone doesn't say how serious the flag is,
      // and a plain "here's every recipe" list reads the same whether
      // the one hit is a mild, portion-aware note or an absolute,
      // well-documented concern (Gluten: High Risk for Celiac is never
      // "fine in moderation" the way Sodium: Moderate might be). severity
      // records the real, worse of the two possible outcomes across every
      // hit for this condition (matching pickCautionHit's own red-first
      // rule), so the UI can group and color genuinely differently rather
      // than treating every caution as interchangeable.
      const severity = hits.some((h) => tierSeverity(h.tier) === 'red') ? 'red' : 'yellow';
      conditionCautions[conditionCode] = { severity, note: buildCautionSentence(hit.baseName, hit.subCriterion, hit.tier) };
    }
  }
  safeForConditions.sort();

  // --- stageAdvisoryNotes ---
  const stageAdvisoryNotes = [];
  for (const staged of STAGED_CONDITIONS) {
    for (const stage of staged.stages) {
      const allReasons = [];
      for (const scores of resolvedIngredientScores) {
        const reasons = staged.reasonsFor(scores, stage.code);
        for (const r of reasons) {
          if (!allReasons.includes(r)) allReasons.push(r);
        }
      }
      if (allReasons.length > 0) {
        stageAdvisoryNotes.push({
          condition: `${staged.label}: ${stage.label}`,
          note: `${allReasons.join(' ')} This is advisory only, based on this recipe's flagged ingredients: nothing here is hidden or blocked.`,
        });
      }
    }
  }

  output[recipeId] = { safeForConditions, conditionCautions, stageAdvisoryNotes };
}

const outPath = path.join(__dirname, '_recipe_condition_data_output.json');
fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8');
console.log(`Wrote ${Object.keys(output).length} recipes -> ${outPath}`);

// Summary counts.
const conditionCounts = {};
const yellowCautionCounts = {};
const redCautionCounts = {};
let totalStageNotes = 0;
for (const { safeForConditions, conditionCautions, stageAdvisoryNotes } of Object.values(output)) {
  for (const c of safeForConditions) conditionCounts[c] = (conditionCounts[c] || 0) + 1;
  for (const [c, caution] of Object.entries(conditionCautions)) {
    const counts = caution.severity === 'red' ? redCautionCounts : yellowCautionCounts;
    counts[c] = (counts[c] || 0) + 1;
  }
  totalStageNotes += stageAdvisoryNotes.length;
}
console.log('Recipes safe (zero flags) per condition:', conditionCounts);
console.log('Recipes with a yellow (moderate) caution per condition:', yellowCautionCounts);
console.log('Recipes with a red (serious) caution per condition:', redCautionCounts);
console.log('Total real stage-advisory notes generated:', totalStageNotes);
