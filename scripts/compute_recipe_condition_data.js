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
  hashimotos: "Hashimoto's Thyroiditis", // 2026-08-25: renamed from "Hashimoto's Disease" to match lib/conditionStages.ts
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

// 2026-08-26, direct correction: "high in oxalates doesn't equal they
// can't eat it. It means treat with care and make sure they are
// cooked... Aren't they flagged for a rule like that?" Correct, and a
// real bug, not a difference of opinion: Hashimoto's own D6 dimension
// carries THREE separate real sub-criteria for the same underlying fact
// -- Oxalate Level (a raw measurement: "High"/"Very High"), Oxalate Load
// Rank (the actual calibrated risk verdict: "Use Carefully"/"High
// Risk"), and Oxalate Tolerance Note (a real, cited, actionable per-food
// note: "Discard cooking water where applicable; pair with a calcium
// source"). Oxalate Level's own tier words happen to be the literal
// strings "High"/"Very High", which tierSeverity's generic RED_TIERS set
// treats as red for ANY sub-criterion using that vocabulary -- correct
// for a sub-criterion whose tier IS the verdict (Sodium: High really
// does mean "a lot of sodium"), wrong here, since Oxalate Level is a
// plain measurement that Oxalate Load Rank ALREADY translates into the
// real risk tier. Checking Oxalate Level as an independent hit meant a
// food rated only "Use Carefully" by the real, calibrated rank (amaranth,
// buckwheat, sweet potato -- genuinely a "cook it, pair with calcium"
// caution, not a serious concern) could still get captioned red purely
// from its own raw measurement label, exactly the "undue emergency
// status" described directly. Confirmed by direct query before fixing:
// spinach and chia seeds genuinely agree red across all three real
// measures (a real, serious caution, correctly still red), while
// amaranth/buckwheat/sweet potato disagree (Use Carefully on the
// calibrated rank, High/Very High only on the raw measurement) --
// exactly the distinction this fix restores. Oxalate Level is excluded
// from independently driving severity the same way NEAR_UNIVERSAL_
// SUB_CRITERIA already is, for a different but related reason: not
// near-universal noise, but a raw measurement duplicating a properly-
// calibrated sibling sub-criterion for the identical real fact.
// Oxalate Tolerance Note is excluded here too, for a related but
// distinct reason: it's a real, useful annotation (see
// TOLERANCE_NOTE_SUB_CRITERION_BY_RANK below), never meant to
// independently drive severity or get picked as its own hit -- tier
// values here are long, cited sentences ("High oxalate load (real cited
// value...). Boil and discard..."), and tierSeverity's own text-prefix
// matching for this field would otherwise let it compete on equal
// footing with Oxalate Load Rank's real short verdict tier for which one
// gets picked as the caption, occasionally winning and producing a
// garbled, doubly-nested sentence once run through the generic
// templated-caption builder, which has no idea this text is already a
// complete sentence.
const RAW_MEASUREMENT_SUB_CRITERIA = new Set(['Oxalate Level', 'Oxalate Tolerance Note']);

// The sub-criterion carrying the real, cited, actionable per-food
// cooking/handling guidance for a given risk-rank sub-criterion, keyed
// by that rank sub-criterion's own name -- used to prefer this genuinely
// useful text over the generic templated caution sentence when both
// exist for the same ingredient (see the caution-note-building code
// below). Not every risk-rank sub-criterion in this app has a matching
// note field yet; only real, confirmed pairs are listed here.
const TOLERANCE_NOTE_SUB_CRITERION_BY_RANK = { 'Oxalate Load Rank': 'Oxalate Tolerance Note' };

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
  if (subCriterion && RAW_MEASUREMENT_SUB_CRITERIA.has(subCriterion)) return false;
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

// Prefers a hit's own real, cited tolerance-note text (see
// TOLERANCE_NOTE_SUB_CRITERION_BY_RANK) over the generic templated
// sentence when one exists -- it already says the actionable, useful
// thing (cook it, discard the water, pair with calcium) rather than just
// naming a tier. The internal "(real cited value, see Oxalate Level
// note)" aside is stripped: it is a real, correct citation-bookkeeping
// pointer between this database's own sub-criteria, not something a
// person reading this caption has any way to act on.
function buildCautionSentenceForHit(hit) {
  if (hit.toleranceNote && !hit.toleranceNote.startsWith('No real, cited') && hit.toleranceNote !== 'Not Assessed') {
    const cleaned = hit.toleranceNote.replace(/\s*\(real cited value[^)]*\)/i, '');
    return `${hit.baseName}: ${cleaned}`;
  }
  return buildCautionSentence(hit.baseName, hit.subCriterion, hit.tier);
}

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
// Absolute exclusions -- 2026-08-25, direct correction: "If they cannot
// eat it at all, it should not be listed in the safe zone for them at
// all." Correct, and a real, distinct category the yellow/red severity
// split above doesn't cover: "yellow" and "red" both still describe a
// real recipe under "Meals You Can Eat," just with more or less caution
// attached, which is honest for the overwhelming majority of this app's
// own flags (a matter of degree, timing, or individual trial, e.g.
// sodium, additives, most elimination-diet triggers). Celiac disease's
// own relationship to gluten is categorically different: gluten triggers
// a real, ongoing autoimmune reaction that damages the gut lining at ANY
// amount, with no dose, portion, or preparation that makes it safe --
// this is established medical consensus, not a matter of degree the way
// almost every other flag in this app is. Listing a gluten-containing
// recipe under "Meals You Can Eat" for Celiac at all, however it's
// captioned, contradicts what the topic's own name says.
//
// This list is deliberately short and named, not a blanket policy --
// checked directly against this app's own real, already-published
// Digest research for every other condition before writing it, and no
// other (condition, sub-criterion, tier) combination in this whole
// scoring system represents a genuinely absolute, zero-tolerance rule
// the way this one does. Hashimoto's own gluten/dairy flags, for
// example, are explicitly framed throughout this app's own content as a
// real, individually-reintroducible elimination-diet trial, not a
// permanent, no-exceptions ban -- so gluten does NOT get excluded there,
// only for Celiac specifically. A recipe matching an entry here is
// skipped entirely for that one condition below: no safeForConditions
// entry, no conditionCautions entry, genuinely invisible under that
// condition's own "Meals You Can Eat," not merely captioned.
const ABSOLUTE_EXCLUSIONS = [{ conditionCode: 'celiac', subCriterion: 'Gluten', tier: 'High Risk' }];

function isAbsoluteExclusion(conditionCode, subCriterion, tier) {
  return ABSOLUTE_EXCLUSIONS.some((e) => e.conditionCode === conditionCode && e.subCriterion === subCriterion && e.tier === tier);
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
// Real per-recipe prep-method overrides -- 2026-08-25, direct
// instruction: "You said 'fixing it for real would mean going through
// roughly 2,000 ingredient rows across 300 recipes and tagging each one
// against what the recipe's own instructions actually do.' Fix it."
//
// resolveCuratedRecipeIngredient above always tries the 'Raw' prep-method
// row first, the same real, already-shipped behavior lib/db.ts's own
// getCuratedRecipe uses (curated_recipe_ingredients stores only a
// category and base_name, never a real per-recipe prep method) -- for
// most ingredients this doesn't matter at all (no other prep-method row
// exists, or every real variant scores identically), but for a real,
// checkable subset it does: a recipe that actually cooks a goitrogenic
// vegetable, or cooks/cans a legume (raw dried legumes are genuinely
// high in lectins; cooking is what makes them edible at all), was being
// scored against its RAW profile regardless of what the recipe's own
// instructions say.
//
// Scope, found by direct query before writing a single override, not
// guessed: of the 210 distinct (category, base_name) ingredient pairs
// actually used across all 300 curated recipes, only 39 have a real,
// flag-crossing difference between their Raw row and any other real
// prep-method row (checked against every sub-criterion, excluding the
// two already-documented near-universal ones) -- everything else is
// either raw-only, has no cooked variant in this database at all, or
// scores identically either way. Of those 39, only the ones actually
// used in a recipe that demonstrably cooks them needed a real override;
// every recipe below was individually read (its own real ingredients
// list and its own real instructions, both in this file's sibling
// lib/digest/recipes.ts) to confirm what it actually does, not assumed
// from the recipe's own name. A recipe using a sensitive ingredient
// genuinely raw (a kale salad that only massages the kale, a smoothie
// that blends spinach raw, a collard leaf used as an uncooked wrap) is
// correctly left OUT of this map -- the existing Raw-first resolution is
// already right for those.
//
// Each entry names the real prep method that recipe's own instructions
// describe (Baked/Boiled/Steamed/Pickled, matching this database's own
// real prep_method vocabulary) purely for auditability -- functionally,
// resolveWithPrepOverride below falls back to ANY available non-Raw
// variant if the named one doesn't resolve, since every one of these 39
// ingredients was individually confirmed (see this script's own
// investigation) to score identically across every one of its own real
// non-Raw variants for the specific sub-criteria that actually differ
// from Raw.
const RECIPE_PREP_OVERRIDES = {
  // 2026-08-27, the new AIP-target lunch/dinner batch: 4 of the 9 new
  // recipes were flagging red for a raw-goitrogenic vegetable despite
  // their own real instructions baking/braising/sauteing it, the exact
  // same class of bug this override mechanism already exists to fix.
  curated_side_baked_salmon_broccoli_carrots: { 'Veg|Broccoli': 'Baked' },
  curated_side_halibut_braised_cabbage_carrots: { 'Veg|Cabbage': 'Boiled' },
  curated_side_shrimp_cabbage_carrot_stir_fry: { 'Veg|Cabbage': 'Boiled' },
  curated_side_beef_sirloin_kale_carrots: { 'Veg|Kale': 'Boiled' },
  curated_side_pork_tenderloin_braised_cabbage_apple: { 'Veg|Cabbage': 'Boiled' },
  // 2026-08-27, the new AIP breakfast batch (Open Next Steps item 20,
  // phase 1): the same class of fix, applied before it could ever ship
  // wrong, since the offline pipeline was just proven to need it 9 times
  // out of 9 in the immediately preceding lunch/dinner batch.
  curated_snack_beef_kale_breakfast_hash: { 'Veg|Kale': 'Boiled' },
  curated_snack_pork_cabbage_breakfast_skillet: { 'Veg|Cabbage': 'Boiled' },
  curated_snack_salmon_broccoli_breakfast_bowl: { 'Veg|Broccoli': 'Baked' },
  curated_snack_cod_cabbage_breakfast_skillet: { 'Veg|Cabbage': 'Boiled' },
  curated_snack_beef_broccoli_breakfast_bowl: { 'Veg|Broccoli': 'Baked' },
  curated_snack_pork_kale_breakfast_hash: { 'Veg|Kale': 'Boiled' },
  curated_snack_halibut_cabbage_breakfast_skillet: { 'Veg|Cabbage': 'Boiled' },
  curated_snack_cod_broccoli_breakfast_bowl: { 'Veg|Broccoli': 'Baked' },
  curated_snack_shrimp_cabbage_breakfast_bowl: { 'Veg|Cabbage': 'Boiled' },
  // 2026-08-27, the second AIP breakfast batch (Open Next Steps item 20,
  // closing the remaining Hashimoto's/IBD/CKD Paleo gap): same class of
  // fix, applied before shipping.
  curated_snack_chicken_broccoli_breakfast_bowl: { 'Veg|Broccoli': 'Baked' },
  curated_snack_chicken_cabbage_breakfast_skillet: { 'Veg|Cabbage': 'Boiled' },
  curated_snack_chicken_kale_breakfast_hash: { 'Veg|Kale': 'Boiled' },
  curated_snack_turkey_broccoli_breakfast_bowl: { 'Veg|Broccoli': 'Baked' },
  curated_snack_turkey_cabbage_breakfast_skillet: { 'Veg|Cabbage': 'Boiled' },
  curated_snack_turkey_kale_breakfast_hash: { 'Veg|Kale': 'Boiled' },
  curated_snack_pork_broccoli_breakfast_skillet: { 'Veg|Broccoli': 'Baked' },
  curated_snack_salmon_kale_breakfast_bowl: { 'Veg|Kale': 'Boiled' },
  curated_snack_halibut_broccoli_breakfast_bowl: { 'Veg|Broccoli': 'Baked' },
  curated_snack_cod_kale_breakfast_skillet: { 'Veg|Kale': 'Boiled' },
  curated_salad_southwest_quinoa_black_bean: { 'Legume|Black Beans': 'Boiled' },
  curated_side_lemon_garlic_broccoli: { 'Veg|Broccoli': 'Baked' },
  curated_side_garlic_mashed_cauliflower: { 'Veg|Cauliflower': 'Boiled' },
  curated_side_sauteed_spinach_garlic: { 'Veg|Spinach': 'Boiled' },
  curated_ferment_sauerkraut: { 'Veg|Cabbage': 'Pickled' },
  curated_snack_roasted_chickpeas: { 'Legume|Chickpeas (garbanzo beans, bengal gram)': 'Boiled' },
  curated_handheld_black_bean_sweet_potato_tacos: { 'Legume|Black Beans': 'Boiled' },
  curated_side_rainbow_stir_fry: { 'Veg|Broccoli': 'Fried Without Fat (Pan)', 'Veg|Snap Beans (Green Beans)': 'Boiled' },
  curated_snack_savory_quinoa_bowl_fried_egg: { 'Veg|Spinach': 'Boiled' },
  curated_handheld_breakfast_burrito_eggs_black_beans: { 'Legume|Black Beans': 'Boiled' },
  curated_side_white_bean_roasted_vegetable_bowl: { 'Legume|White Beans': 'Boiled' },
  curated_side_baked_chicken_thighs_brussels_sweet_potato: { 'Veg|Brussels sprout': 'Baked' },
  curated_handheld_hummus_roasted_vegetable_wrap: { 'Legume|Chickpeas (garbanzo beans, bengal gram)': 'Boiled' },
  curated_soup_turkey_black_bean_chili: { 'Legume|Black Beans': 'Boiled' },
  curated_handheld_turkey_hummus_collard_wrap: { 'Legume|Chickpeas (garbanzo beans, bengal gram)': 'Boiled' },
  curated_salad_tuna_white_bean_salad: { 'Legume|White Beans': 'Boiled' },
  curated_side_pork_chop_brussels_apple: { 'Veg|Brussels sprout': 'Baked' },
  curated_side_chickpea_spinach_curry_bowl: { 'Legume|Chickpeas (garbanzo beans, bengal gram)': 'Boiled', 'Veg|Spinach': 'Boiled' },
  curated_side_turkey_thigh_turnip_carrot: { 'Veg|Turnip': 'Baked' },
  curated_side_sardine_white_bean_bowl: { 'Legume|White Beans': 'Boiled' },
  curated_side_braised_beef_kohlrabi_carrot: { 'Veg|Kohlrabi': 'Boiled' },
  curated_salad_roasted_artichoke_white_bean_salad: { 'Legume|White Beans': 'Boiled' },
  curated_side_sole_bok_choy_ginger: { 'Veg|Bok choy': 'Steamed' },
  curated_side_bison_root_vegetable_bowl: { 'Veg|Turnip': 'Baked' },
  curated_salad_pinto_bean_roasted_vegetable_bowl: { 'Legume|Pinto Beans': 'Boiled' },
  curated_side_pork_loin_turnip_kale: { 'Veg|Turnip': 'Baked', 'Veg|Kale': 'Boiled' },
  curated_soup_white_bean_kale_soup: { 'Legume|White Beans': 'Boiled', 'Veg|Kale': 'Boiled' },
  curated_soup_lentil_kale_soup: { 'Veg|Kale': 'Boiled', 'Legume|Lentils': 'Boiled' },
  curated_side_chicken_thighs_kohlrabi_apple: { 'Veg|Kohlrabi': 'Baked' },
  curated_soup_white_bean_swiss_chard_soup: { 'Legume|White Beans': 'Boiled' },
  curated_side_pork_loin_radish_carrot: { 'Veg|Radish': 'Baked' },
  curated_salad_kidney_bean_roasted_vegetable_salad: { 'Legume|Kidney Beans': 'Boiled' },
  curated_side_trout_radish_dill: { 'Veg|Radish': 'Baked' },
  curated_soup_turkey_white_bean_soup: { 'Legume|White Beans': 'Boiled' },
  curated_vegan_savory_quinoa_bowl_tofu_scramble: { 'Veg|Spinach': 'Boiled' },
  curated_vegan_breakfast_burrito_tofu_black_beans: { 'Legume|Black Beans': 'Boiled' },
  curated_vegan_handheld_chickpea_avocado_wrap: { 'Legume|Chickpeas (garbanzo beans, bengal gram)': 'Boiled' },
  curated_vegan_handheld_tempeh_hummus_collard_wrap: { 'Legume|Chickpeas (garbanzo beans, bengal gram)': 'Boiled' },
  curated_vegan_handheld_chickpea_egg_salad_lettuce_wraps: { 'Legume|Chickpeas (garbanzo beans, bengal gram)': 'Boiled' },
  curated_vegan_salad_white_bean_roasted_pepper_salad: { 'Legume|White Beans': 'Boiled' },
  curated_vegan_salad_white_bean_artichoke_salad: { 'Legume|White Beans': 'Boiled' },
  curated_vegan_salad_chickpea_white_bean_salad: {
    'Legume|Chickpeas (garbanzo beans, bengal gram)': 'Boiled',
    'Legume|White Beans': 'Boiled',
  },
  curated_vegan_salad_mediterranean_chickpea_tofu: { 'Legume|Chickpeas (garbanzo beans, bengal gram)': 'Boiled' },
  curated_vegan_salad_roasted_artichoke_white_bean_tofu: { 'Legume|White Beans': 'Boiled' },
  curated_vegan_side_baked_tempeh_brussels_sweet_potato: { 'Veg|Brussels sprout': 'Baked' },
  curated_vegan_side_tempeh_root_vegetable_bowl: { 'Veg|Turnip': 'Baked' },
  curated_vegan_side_braised_seitan_kohlrabi_carrot: { 'Veg|Kohlrabi': 'Boiled' },
  curated_vegan_side_chickpea_okra_tomato_skillet: { 'Legume|Chickpeas (garbanzo beans, bengal gram)': 'Boiled' },
  curated_vegan_side_tempeh_kohlrabi_apple: { 'Veg|Kohlrabi': 'Baked' },
  curated_vegan_side_braised_chickpea_fennel_orange: { 'Legume|Chickpeas (garbanzo beans, bengal gram)': 'Boiled' },
  curated_vegan_side_seitan_chop_brussels_apple: { 'Veg|Brussels sprout': 'Baked' },
  curated_vegan_side_tempeh_radish_carrot: { 'Veg|Radish': 'Baked' },
  curated_vegan_side_seitan_turnip_kale: { 'Veg|Turnip': 'Baked', 'Veg|Kale': 'Boiled' },
  curated_vegan_side_white_bean_tomato_bowl: { 'Legume|White Beans': 'Boiled' },
  curated_vegan_side_tofu_bok_choy_ginger: { 'Veg|Bok choy': 'Steamed' },
  curated_vegan_side_tempeh_radish_dill: { 'Veg|Radish': 'Baked' },
  curated_vegan_side_chickpea_walnut_meatballs_tomato_sauce: { 'Legume|Chickpeas (garbanzo beans, bengal gram)': 'Boiled' },
  curated_vegan_side_tempeh_turnip_carrot: { 'Veg|Turnip': 'Baked' },
  curated_vegan_side_white_bean_roasted_vegetable_tofu_bowl: { 'Legume|White Beans': 'Boiled' },
  curated_vegan_soup_white_bean_vegetable_soup: { 'Legume|White Beans': 'Boiled' },
  curated_vegan_soup_white_bean_tomato_fennel_broth: { 'Legume|White Beans': 'Boiled' },
  curated_vegan_soup_white_bean_tomato_garlic_broth: { 'Legume|White Beans': 'Boiled' },
  curated_vegan_soup_lentil_black_bean_chili: { 'Legume|Black Beans': 'Boiled', 'Legume|Lentils': 'Boiled' },
  // 2026-08-27, direct follow-up after auditing every diet type against
  // every condition (not just vegan): confirmed 9 recipes were
  // referencing an under-specified lentil/chickpea/lima-bean base_name
  // with no real cooked variant to redirect to at all in this database
  // (a genuinely different, deeper issue than the raw-vs-cooked
  // resolution question the rest of this map answers) -- fixed at the
  // source by switching each ingredient row itself to the richer
  // base_name that already exists elsewhere in this app's own recipes
  // and does carry a real Boiled/Canned variant (see the direct SQL fix
  // this same day). These entries are the remaining half of that fix:
  // selecting the specific cooked variant each of these dishes actually
  // uses (a soup/stew/meatball/meatloaf simmers its own legumes; a
  // Mediterranean chickpea salad and a roasted-vegetable lima bean
  // salad both use canned, the standard real-world preparation for
  // either dish).
  curated_soup_red_lentil: { 'Legume|Lentils': 'Boiled' },
  curated_soup_green_lentil_vegetable_stew: { 'Legume|Lentils': 'Boiled' },
  curated_side_lentil_roasted_vegetable_tahini_bowl: { 'Legume|Lentils': 'Boiled' },
  curated_vegan_side_lentil_meatloaf_parsnip_carrot: { 'Legume|Lentils': 'Boiled' },
  curated_vegan_side_lentil_walnut_meatballs_tomato_sauce: { 'Legume|Lentils': 'Boiled' },
  curated_salad_mediterranean_chickpea_feta: { 'Legume|Chickpeas (garbanzo beans, bengal gram)': 'Canned' },
  curated_salad_lima_bean_roasted_vegetable_salad: { 'Legume|Lima beans, large': 'Canned' },
  curated_vegan_soup_mushroom_white_bean_soup: { 'Legume|White Beans': 'Boiled' },
  // 2026-08-26, the new savory vegan breakfast batch -- every one of
  // these actually simmers/cooks its own legume (confirmed directly
  // against each recipe's own real instructions in lib/digest/
  // recipes.ts, the same discipline as every override above), so the
  // default Raw-first resolution was scoring a real lectin concern that
  // doesn't apply once cooked.
  curated_vegan_lentil_spinach_bowl_lemon_tahini: { 'Legume|Lentils': 'Boiled' },
  // 2026-08-26, direct follow-up: this recipe's own instructions saute
  // the kale (a real cruciferous vegetable), but the default Raw-first
  // resolution was scoring its real, well-documented raw-goitrogenic
  // flag as if it were never cooked at all -- the same class of bug
  // already fixed for legumes above, now confirmed for a goitrogenic
  // vegetable in this same batch.
  curated_vegan_white_bean_kale_breakfast_hash: { 'Legume|White Beans': 'Boiled', 'Veg|Kale': 'Boiled' },
  curated_vegan_chickpea_spinach_breakfast_curry: { 'Legume|Chickpeas (garbanzo beans, bengal gram)': 'Boiled' },
  curated_vegan_black_bean_breakfast_bowl_avocado: { 'Legume|Black Beans': 'Boiled' },
  curated_vegan_roasted_vegetable_white_bean_bowl_garlic_herb_oil: { 'Legume|White Beans': 'Boiled' },
  curated_vegan_black_bean_sweet_potato_breakfast_hash: { 'Legume|Black Beans': 'Boiled' },
};

// Resolves one recipe's own ingredient with its real prep method applied
// when one exists in RECIPE_PREP_OVERRIDES above -- tries the named prep
// method first, falls back to ANY available non-Raw variant (every one
// of the 39 sensitive ingredients was individually confirmed to score
// identically across its own real non-Raw variants, see this script's
// own investigation above), and only falls back to the ordinary
// Raw-first resolver if truly no non-Raw row exists at all.
function resolveWithPrepOverride(recipeId, category, baseName) {
  const preferredPrep = RECIPE_PREP_OVERRIDES[recipeId]?.[`${category}|${baseName}`];
  if (!preferredPrep) return resolveCuratedRecipeIngredient(category, baseName);
  const named = resolveViaPrep(category, baseName, preferredPrep);
  if (named) return named;
  const anyNonRaw = runSql(
    `SELECT food_id, source, name FROM foods
     WHERE category = ? AND base_name = ? AND hidden = 0
       AND prep_method IS NOT NULL AND prep_method != 'Raw'
     ORDER BY CASE WHEN source IN ('USDA', 'Derived') THEN 0 ELSE 1 END, food_id
     LIMIT 1`,
    [category, baseName],
  );
  if (anyNonRaw[0]) return anyNonRaw[0];
  return resolveCuratedRecipeIngredient(category, baseName);
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
// 2026-08-27, direct question: "many [difficulties] are also overcome as
// the user gets through the different stages of healing. Are we
// accounting for that throughout the entire stock of system recipes?"
// Investigated directly: no, Rebalancing/Maintenance produced zero food
// advisory output at all. Extended to mirror lib/healingStage.ts's own
// real fix (see that file's own comment for the full reasoning): Gluten/
// Dairy/Nightshade (the genuine elimination-diet reintroduction triggers)
// get a softened, stage-appropriate message for these two later stages;
// Goitrogenic(Raw)/Additives/Processing keep firing with the same message
// at every stage, since they're not reintroduction-dependent sensitivities.
const FOOD_RELEVANT_HEALING_STAGES = ['digging', 'gut_repair', 'rebalancing', 'maintenance'];
function healingStageReasons(scores, stage) {
  if (!FOOD_RELEVANT_HEALING_STAGES.includes(stage)) return [];
  const laterStage = stage === 'rebalancing' || stage === 'maintenance';
  const reasons = [];
  if (findTier(scores, 'Gluten') === 'High Risk') {
    if (stage === 'digging') {
      reasons.push('Contains gluten, one of the first things this stage typically removes.');
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
    reasons.push('A raw goitrogenic (cruciferous) food. The staged food guide flags these specifically raw; cooking largely resolves the concern.');
  }
  const eliminationTier = findTier(scores, 'Common Elimination-Diet Trigger Food');
  if (eliminationTier === 'Dairy') {
    if (stage === 'digging') {
      reasons.push('Dairy, the other food typically removed alongside gluten at this stage.');
    } else if (stage === 'gut_repair') {
      reasons.push("Dairy. If you haven't reintroduced it yet, this is one to test carefully, one food at a time.");
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
      reasons.push('A nightshade. The staged food guide is honest that this one is unresolved (anti-inflammatory evidence alongside patient-reported worsening). Worth testing for yourself, not a firm rule.');
    }
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
    label: "Hashimoto's Thyroiditis", // 2026-08-25: renamed from "Hashimoto's Disease"
    stages: [
      { code: 'digging', label: 'Stage 2: Digging' },
      { code: 'gut_repair', label: 'Stage 3: Gut Repair' },
      // 2026-08-27: Rebalancing/Maintenance added -- see lib/healingStage.ts's
      // own comment for the full reasoning (a real, direct answer to
      // "are we accounting for stages people have already gotten through").
      { code: 'rebalancing', label: 'Stage 4: Rebalancing' },
      { code: 'maintenance', label: 'Stage 5: Maintenance' },
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

// Real per-recipe prep-method overrides -- see RECIPE_PREP_OVERRIDES' own
// header comment above. Resolved separately from the shared resolvedByKey
// cache above, since the whole point is that the SAME (category,
// baseName) pair needs to resolve DIFFERENTLY in a recipe that cooks it
// versus one that doesn't -- a single global cache keyed only by
// ingredient pair can't represent that at all.
console.log('Resolving per-recipe prep-method overrides...');
const resolvedByRecipeAndKey = new Map(); // "recipeId|category|baseName" -> resolved row
let overridesResolved = 0;
for (const [recipeId, overrides] of Object.entries(RECIPE_PREP_OVERRIDES)) {
  for (const key of Object.keys(overrides)) {
    const [category, baseName] = key.split('|');
    const resolved = resolveWithPrepOverride(recipeId, category, baseName);
    if (resolved) {
      resolvedByRecipeAndKey.set(`${recipeId}|${key}`, resolved);
      overridesResolved++;
    } else {
      console.warn(`  UNRESOLVED OVERRIDE: ${recipeId} / ${key}`);
    }
  }
}
console.log(`Resolved ${overridesResolved} per-recipe prep-method overrides.`);

console.log('Loading food_scores for every resolved ingredient...');
const scoresByFoodKey = new Map(); // "foodId|source" -> [{dimension, subCriterion, tier, subCriterionId}]
const neededFoodKeys = new Set([
  ...Array.from(resolvedByKey.values()).map((r) => `${r.food_id}|${r.source}`),
  ...Array.from(resolvedByRecipeAndKey.values()).map((r) => `${r.food_id}|${r.source}`),
]);
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
let totalAbsoluteExclusions = 0;
for (const [recipeId, ingredients] of ingredientsByRecipe.entries()) {
  const resolvedIngredientScores = [];
  // Parallel array to resolvedIngredientScores -- each ingredient's own
  // real base_name, so a flagged hit can be captioned with the actual
  // ingredient responsible, not just "something in this recipe."
  const resolvedIngredientNames = [];
  for (const ing of ingredients) {
    const key = `${ing.category}|${ing.baseName}`;
    // A real per-recipe prep-method override (RECIPE_PREP_OVERRIDES)
    // takes priority over the shared, ingredient-pair-wide resolution --
    // see resolvedByRecipeAndKey's own comment above for why the same
    // ingredient pair needs to resolve differently depending on which
    // recipe it's in.
    const resolved = resolvedByRecipeAndKey.get(`${recipeId}|${key}`) ?? resolvedByKey.get(key);
    if (!resolved) continue;
    const foodKey = `${resolved.food_id}|${resolved.source}`;
    resolvedIngredientScores.push(scoresByFoodKey.get(foodKey) ?? []);
    resolvedIngredientNames.push(ing.baseName);
  }

  // --- safeForConditions + conditionCautions ---
  const safeForConditions = [];
  const conditionCautions = {};
  const excludedForConditions = [];
  for (const conditionCode of coveredConditions) {
    const hits = [];
    let absoluteExclusion = false;
    for (let i = 0; i < resolvedIngredientScores.length; i++) {
      const scores = resolvedIngredientScores[i];
      const baseName = resolvedIngredientNames[i];
      for (const row of scores) {
        if (isRelevantToCondition(row.subCriterionId, conditionCode) && isFlaggedTier(row.tier, row.subCriterion)) {
          // A real, cited, actionable per-food note (see
          // TOLERANCE_NOTE_SUB_CRITERION_BY_RANK's own comment) for this
          // exact ingredient, when this hit's own sub-criterion has one --
          // preferred over the generic templated sentence in
          // buildCautionSentence below, since it already says the real,
          // useful thing ("cook it, discard the water, pair with
          // calcium") rather than just naming the tier.
          const noteSubCriterion = TOLERANCE_NOTE_SUB_CRITERION_BY_RANK[row.subCriterion];
          const toleranceNoteRow = noteSubCriterion ? scores.find((s) => s.subCriterion === noteSubCriterion) : undefined;
          hits.push({ baseName, subCriterion: row.subCriterion, tier: row.tier, toleranceNote: toleranceNoteRow?.tier });
          if (isAbsoluteExclusion(conditionCode, row.subCriterion, row.tier)) absoluteExclusion = true;
        }
      }
    }
    // See ABSOLUTE_EXCLUSIONS' own comment above -- a genuinely
    // never-safe trigger means this recipe is skipped entirely for this
    // one condition: no safeForConditions entry, no conditionCautions
    // entry, correctly invisible under "Meals You Can Eat" for it,
    // exactly like a condition this recipe has no real coverage for at
    // all. Checked FIRST, before either of the two ordinary outcomes
    // below, so it always wins regardless of what else this recipe's
    // ingredients also happen to trip.
    if (absoluteExclusion) {
      excludedForConditions.push(conditionCode);
      continue;
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
      conditionCautions[conditionCode] = { severity, note: buildCautionSentenceForHit(hit) };
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
  if (excludedForConditions.length > 0) totalAbsoluteExclusions += excludedForConditions.length;
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
console.log('Total absolute-exclusion (never-safe) recipe/condition pairs:', totalAbsoluteExclusions);
