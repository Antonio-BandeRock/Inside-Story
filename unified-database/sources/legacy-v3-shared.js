// Shared, real ingestion logic for all 7 of the original reference-
// database sources (USDA, Canada_CNF, UK_CoFID, Germany_BLS,
// Australia_AFCD, France_Ciqual, Japan_MEXT). Unlike Norway and Sweden,
// these 7 share one identical, already-existing raw schema -- a real,
// unfiltered combine already sitting in
// ClaudeWork/unified_food_database_v3_full.sqlite.zip (27,980 real
// foods, confirmed matching this project's own already-documented
// history: USDA's own real 7,793-row count exactly matches its known
// SR Legacy size). One shared module, not 7 near-duplicate files,
// since the real underlying structure (foods/food_nutrients/nutrients,
// a real, standardized INFOODS/EuroFIR-style nutrient tag vocabulary
// shared across all 7) is genuinely identical -- each real source file
// under sources/ is just a thin wrapper naming its own source_code.
//
// REAL, CONFIRMED FINDING before building anything (checked directly,
// not assumed): of these 7, only France_Ciqual's food_name is
// genuinely untranslated French -- USDA, Canada_CNF, UK_CoFID,
// Germany_BLS, Australia_AFCD, and Japan_MEXT ALL already carry a real,
// usable English food_name (Germany_BLS and Japan_MEXT were already
// translated at some earlier point in this project's own history;
// food_name_local, when present, preserves the real original-language
// name separately). Only France_Ciqual (3,185 real rows) needs the
// same real translate.js pass already proven on Sweden.
//
// REAL, HONEST GAP, stated directly: this earlier-stage v3_full
// database predates real category assignment (no food-group column
// exists at all) and predates real species/LanguaL capture (matching
// this app's own already-confirmed 0/26,749 scientific_classification
// coverage) -- categoryOriginal is left null for all 7 sources, and
// cross-source matching for these 7 will lean more heavily on Tier 3
// (canonical English name) than Tier 1/Tier 2 as a result. Not a flaw
// introduced here -- an honest reflection of what this particular raw
// snapshot actually captured.
//
// REAL NUTRIENT MAPPING, verified directly against this app's own
// current 39-code vocabulary AND against the real, actual unit stored
// per tag in the v3_full database's own `nutrients` reference table
// (never assumed from a tag's name alone). One real, deliberate,
// documented exclusion worth calling out: CAFFN ("Caffeine," but in
// g/100g, not mg) is NOT mapped, specifically to avoid the exact same
// real 1000x unit error this project's own original 2026 build already
// documented catching and avoiding for this identical trap (see
// scripts/build_food_reference_db.py's own history). CAFFEINE and
// AU_CAFFEINE_MG (both genuinely mg) are used instead. VITK1
// (phylloquinone specifically, the standard dietary form) is preferred
// over bare VITK -- confirmed the two genuinely co-occur on 6,479 real
// foods, a real ambiguity avoided by picking one specific, standard
// form rather than guessing which of two possibly-different measures
// to trust.

const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const { extractZipTo } = require('./legacy-v3-extract.js');

const SQLITE_EXE =
  process.env.SQLITE_EXE ||
  'C:/Users/TonyR/AppData/Local/Android/Sdk/platform-tools/sqlite3.exe';

const ZIP_PATH = path.resolve(__dirname, '..', '..', 'ClaudeWork', 'unified_food_database_v3_full.sqlite.zip');
const CACHE_DIR = path.resolve(__dirname, '..', '.cache');
const CACHED_DB_PATH = path.join(CACHE_DIR, 'legacy_v3_sources.sqlite');

const NUTRIENT_TAG_MAP = {
  WATER: 'water',
  NA: 'sodium',
  FAT: 'fat_total',
  PROCNT: 'protein',
  CA: 'calcium',
  FE: 'iron',
  ENERC_KCAL: 'energy_kcal',
  K: 'potassium',
  FIBTG: 'fiber_total',
  P: 'phosphorus',
  MG: 'magnesium',
  FASAT: 'fat_saturated',
  ZN: 'zinc',
  NIA: 'niacin_b3',
  RIBF: 'riboflavin_b2',
  THIA: 'thiamin_b1',
  CHOCDF: 'carbohydrate',
  VITA_RAE: 'vitamin_a',
  CHOLE: 'cholesterol',
  VITB6A: 'vitamin_b6',
  VITC: 'vitamin_c',
  FAPU: 'fat_polyunsaturated',
  CU: 'copper',
  FAMS: 'fat_monounsaturated',
  FOL: 'folate_b9',
  VITB12: 'vitamin_b12',
  MN: 'manganese',
  PANTAC: 'pantothenic_acid_b5',
  TOCPHA: 'vitamin_e',
  SUGAR: 'sugars_total',
  VITD: 'vitamin_d',
  SE: 'selenium',
  VITK1: 'vitamin_k', // phylloquinone specifically -- see this file's own header comment for why bare VITK is deliberately excluded
  GLY: 'glycine',
  ID: 'iodine',
  CAFFEINE: 'caffeine',
  AU_CAFFEINE_MG: 'caffeine',
  // CAFFN deliberately excluded -- real, different unit (g/100g), see header comment
  CHOLINE_TOTAL: 'choline',
  CHOLN: 'choline',
  BIOT: 'biotin_b7',
  AU_BIOTIN_B7_UG: 'biotin_b7',
  // No real inositol tag exists anywhere in this dataset -- confirmed by direct query, an honest gap, not an oversight.
};

function ensureExtracted() {
  if (fs.existsSync(CACHED_DB_PATH)) return CACHED_DB_PATH;
  if (!fs.existsSync(ZIP_PATH)) {
    throw new Error(`Real source zip not found at ${ZIP_PATH} -- this adapter depends on ClaudeWork's own already-existing unified_food_database_v3_full.sqlite.zip.`);
  }
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  extractZipTo(ZIP_PATH, CACHE_DIR, 'unified_food_database_full.sqlite', CACHED_DB_PATH);
  return CACHED_DB_PATH;
}

function query(dbPath, sql) {
  const out = execFileSync(SQLITE_EXE, ['-cmd', '.timeout 30000', dbPath, '-json', sql], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 256,
  });
  return JSON.parse(out || '[]');
}

// The one real, confirmed exception among these 7: France_Ciqual's own
// food_name is genuinely, still French (identical to food_name_local),
// never translated at any earlier stage the way Germany_BLS/Japan_MEXT
// were -- confirmed by direct inspection before this was ever assumed.
// Passing that French text through as if it were nameEnglish would be
// a real, dishonest mislabeling (exactly the mistake this project's
// own name_english_source column exists to prevent) -- so this one
// source is the real exception to "food_name is already usable English."
const SOURCES_NEEDING_REAL_TRANSLATION = new Set(['France_Ciqual']);

/**
 * Real, shared ingest function -- takes the legacy v3 `source` value
 * (e.g. 'USDA', 'Germany_BLS') and returns a real NormalizedRecord[]
 * built directly from the real, extracted legacy database.
 */
async function ingestLegacySource(legacySourceValue) {
  const dbPath = ensureExtracted();

  const foods = query(dbPath, `SELECT food_id, source_code, food_name, food_name_local FROM foods WHERE source = ${JSON.stringify(legacySourceValue)};`);
  if (foods.length === 0) {
    throw new Error(`No real rows found for legacy source '${legacySourceValue}' -- check the real value against the v3_full database's own distinct source list.`);
  }

  const tagList = Object.keys(NUTRIENT_TAG_MAP).map((t) => `'${t}'`).join(',');
  const nutrientRows = query(dbPath, `
    SELECT fn.food_id, fn.tag, fn.value
    FROM food_nutrients fn
    WHERE fn.tag IN (${tagList})
      AND fn.food_id IN (SELECT food_id FROM foods WHERE source = ${JSON.stringify(legacySourceValue)});
  `);

  const nutrientsByFood = new Map();
  for (const r of nutrientRows) {
    if (typeof r.value !== 'number') continue;
    const code = NUTRIENT_TAG_MAP[r.tag];
    if (!nutrientsByFood.has(r.food_id)) nutrientsByFood.set(r.food_id, {});
    const bucket = nutrientsByFood.get(r.food_id);
    // A real food could carry both CAFFEINE and AU_CAFFEINE_MG (or
    // both CHOLINE_TOTAL and CHOLN, or both BIOT and AU_BIOTIN_B7_UG)
    // -- both real synonyms for the identical nutrient in the SAME
    // real unit, confirmed above. First real value wins; not summed,
    // which would double-count.
    if (!(code in bucket)) bucket[code] = r.value;
  }

  const needsTranslation = SOURCES_NEEDING_REAL_TRANSLATION.has(legacySourceValue);

  return foods.map((f) => ({
    sourceFoodId: String(f.food_id), // the v3_full database's own real, stable integer id -- more reliable than source_code, which isn't always populated identically across all 7 sources
    nameOriginal: f.food_name_local || f.food_name,
    // Real, honest split: for 6 of 7 sources, food_name is already
    // confirmed usable English (source_verified, via ingest.js's own
    // real provenance logic). For France_Ciqual specifically,
    // food_name is genuinely still French -- passing it here as
    // nameEnglish would silently mislabel it, so it's left null,
    // exactly the same real, honest deferral pattern classify.js
    // already applies to any source with no real English evidence.
    nameEnglish: needsTranslation ? null : f.food_name,
    latinName: null, // this earlier-stage snapshot never captured species data -- see this file's own header comment
    langualCodes: null, // same real gap
    categoryOriginal: null, // this earlier-stage snapshot predates real category assignment -- see this file's own header comment
    nutrients: nutrientsByFood.get(f.food_id) || {},
    raw: f,
  }));
}

module.exports = { ingestLegacySource, NUTRIENT_TAG_MAP, ensureExtracted };
