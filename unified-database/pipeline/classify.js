// The real, codified whole-food rule engine -- runnable logic, not just
// prose. Built on the exact, already-proven keyword lists from this
// project's own original filter_whole_foods_v2.py (ClaudeWork/), which
// already did this job once, in English, for the first 7 sources -- not
// reinvented from scratch, extended with the rules the app's owner
// confirmed directly for this pass:
//   - butchered meat/fish cuts still count as whole food (cutting isn't
//     modification)
//   - plain milk/yogurt/butter/cream/cheese count, but a flavored or
//     sweetened version of any of them does NOT -- "as long as they have
//     no additives or flavorings" (a real, meaningful tightening of the
//     old script's own looser FERMENTED_KEEP, which kept anything with
//     "yogurt" in the name regardless of what else was added)
//   - 100% fresh-pressed juice counts; juice from concentrate or with
//     added sugar does not
//   - fresh-frozen is fine for any of the above -- freezing preserves,
//     it doesn't modify
//   - dried fruit (and other dried whole foods) counts, matching the
//     original script's own SAFE_OVERRIDES precedent
//
// SAFETY RULE, worth stating plainly: this only ever attempts a
// confident decision against a record's REAL English name
// (name_english, or name_original when the source's own language is
// already English). A non-English record with no verified English name
// yet is NEVER guessed at -- it comes out is_whole_food: null,
// auto_confidence: 'low', reviewed: 0, forcing it into the human-review
// queue rather than risking a silent wrong answer because a keyword
// list built for English text happened not to match untranslated text.
// That's not a limitation to work around later -- it's the actual
// intended behavior: no automated tool in this project has ever been
// allowed to guess past its own real evidence.

const PROCESSED_MEAT = [
  'sausage', 'bacon', 'hot dog', 'frankfurter', 'salami', 'pepperoni',
  'bologna', 'pastrami', 'luncheon meat', 'lunch meat', 'deli meat',
  'spam', 'corned beef', 'jerky', 'ham', 'smoked ham', 'vienna sausage',
  'chorizo', 'prosciutto', 'pate', 'pâté', 'meat spread', 'potted meat',
  'canned meat', 'hot dogs',
];

const CANDY_SNACKS = [
  'candy', 'candies', 'chocolate bar', 'chocolate-coated', 'cookie',
  'cookies', 'cake', 'pastry', 'pastries', 'donut', 'doughnut',
  'ice cream', 'sherbet', 'frozen dessert', 'soda', 'cola', 'soft drink',
  'chips', 'potato chip', 'corn chip', 'tortilla chip', 'frosting',
  'icing', 'marshmallow', 'gum, chewing', 'candy bar', 'toaster pastry',
  'fruit snack', 'gummy', 'gelatin dessert', 'pudding', 'fruit drink',
  'punch', 'energy drink', 'sports drink',
];

const FAST_FOOD = [
  'fast food', 'mcdonald', 'burger king', 'kentucky fried', 'kfc',
  'taco bell', 'pizza hut', "wendy's", 'subway', 'domino',
];

const ADDED_SUGAR_SALT_OR_PROCESSING = [
  'sweetened', 'with added sugar', 'honey roasted', 'glazed', 'candied',
  'in syrup', 'heavy syrup', 'sugar coated', 'frosted', 'breaded',
  'battered', 'deep fried', 'deep-fried', 'imitation', 'artificial',
  'flavored drink', 'cheese product', 'cheese food', 'process cheese',
  'processed cheese', 'pasteurized process', 'processed product',
  'processed food', 'cheese, processed', 'spread, ', 'margarine',
  'shortening', 'non-dairy', 'creamer, non', 'whipped topping',
];

const REFINED_SWEETENER = [
  'corn syrup', 'high fructose', 'sugars, granulated', 'sugars, powdered',
  'sugar, granulated', 'sugar, powdered', 'sugar, white',
];

// New for this pass -- juice-from-concentrate and added-sugar juice are
// real, explicit exclusions the app's owner named directly, distinct
// from the general ADDED_SUGAR_SALT_OR_PROCESSING list above (juice
// needs its own check since "juice" itself is a real, wanted keyword,
// not something to exclude on sight -- it's specifically the
// concentrate/added-sugar VARIANT that's excluded).
const JUICE_DISQUALIFIERS = [
  'from concentrate', 'concentrate, reconstituted', 'sweetened juice',
  'juice cocktail', 'juice drink', 'juice beverage',
];

// New for this pass -- anything flavored/sweetened added to a plain
// dairy or fermented product disqualifies it, per the app owner's own
// explicit "as long as they have no additives or flavorings" rule.
// Checked specifically against fermented/dairy matches (see
// classifyOne below), not blended into the general exclude list, since
// "vanilla" or "strawberry" alone shouldn't disqualify an actual
// vanilla bean or strawberry -- only a *flavored dairy/ferment* product.
const FLAVOR_OR_ADDITIVE_MARKERS = [
  'flavored', 'flavoured', 'strawberry', 'vanilla', 'chocolate',
  'honey flavored', 'fruit on the bottom', 'fruit at the bottom',
  'with fruit', 'sweetened', 'low fat, fruit', 'whole milk, fruit',
];

const ALL_EXCLUDE = [
  ...PROCESSED_MEAT,
  ...CANDY_SNACKS,
  ...FAST_FOOD,
  ...ADDED_SUGAR_SALT_OR_PROCESSING,
  ...REFINED_SWEETENER,
];

const SAFE_OVERRIDES = [
  'smoked salmon', 'smoked trout', 'smoked mackerel', 'smoked herring',
  'smoked whitefish', 'dried fruit', 'dried apricot', 'dried fig',
  'dried date', 'dried banana', 'dried mango', 'dried plum', 'dried pear',
  'dried apple', 'raisin', 'dried fish', 'dried shrimp',
];

const FERMENTED_KEEP = [
  'yogurt', 'yoghurt', 'kefir', 'kimchi', 'sauerkraut', 'miso', 'tempeh',
  'kombucha', 'natto', 'cultured', 'fermented',
];

const NATURAL_SWEETENER_KEEP = ['honey', 'maple syrup', 'molasses', 'agave'];

// Plain dairy/butchered-meat/fresh-juice signals -- real, positive
// "this is whole food" markers the original script never needed, since
// it worked from a name list that had already been through USDA/etc.'s
// own real category structure. Here they exist as an explicit,
// standalone safety net: even a record whose name contains none of the
// exclude keywords above still needs a real, positive reason before
// being trusted, not just "nothing bad matched."
const PLAIN_DAIRY_KEEP = ['milk', 'yogurt', 'yoghurt', 'butter', 'cream', 'cheese'];
const FRESH_JUICE_KEEP = ['juice'];
const RAW_WHOLE_FOOD_HINTS = [
  'raw', 'fresh', 'whole', 'cooked', 'boiled', 'roasted', 'steamed',
  'grilled', 'baked', 'broiled', 'poached', 'braised',
  // 'dried'/'dehydrated' as a general, word-order-independent hint --
  // SAFE_OVERRIDES above still exists for the specific compound phrases
  // it already covers, but a source can just as easily write "Apple,
  // dried" as "Dried apple," and a general positive hint (checked only
  // after the exclude-keyword gate above has already run) is a safer,
  // more complete fix than enumerating every possible word order by
  // hand -- caught during testing, not guessed at.
  'dried', 'dehydrated',
  // Caught during real end-to-end testing against real Norwegian data:
  // "Adzuki beans, uncooked" matched nothing, because \bcooked\b
  // correctly does NOT match inside "uncooked" (there's a real word
  // character, "n," immediately before it -- not a bug in the regex,
  // a real gap in the word list). Legumes/grains are commonly described
  // with "uncooked"/"dry" rather than "raw" -- added both rather than
  // guessing there were no other similar gaps left.
  'uncooked', 'dry',
];

function containsKeyword(text, kw) {
  const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i').test(text);
}

function anyKeywordMatches(text, list) {
  return list.find((kw) => containsKeyword(text, kw)) || null;
}

/**
 * Classifies a single record. Expects { nameForClassification, hasEnglishEvidence }
 * where nameForClassification is the real, English text to evaluate
 * (already resolved by the caller -- see classifyRecord below for how
 * that resolution happens) and hasEnglishEvidence says whether that text
 * is actually trustworthy English, not just whatever happened to be in
 * name_original.
 *
 * Returns { isWholeFood: true|false|null, ruleMatched: string, autoConfidence: 'high'|'medium'|'low' }.
 */
function classifyOne({ nameForClassification, hasEnglishEvidence }) {
  if (!hasEnglishEvidence) {
    return {
      isWholeFood: null,
      ruleMatched: 'no_english_evidence_yet',
      autoConfidence: 'low',
    };
  }

  const n = nameForClassification.toLowerCase();

  const safeOverride = anyKeywordMatches(n, SAFE_OVERRIDES);
  if (safeOverride) {
    return {
      isWholeFood: true,
      ruleMatched: `safe_override: ${safeOverride}`,
      autoConfidence: 'high',
    };
  }

  const naturalSweetener = anyKeywordMatches(n, NATURAL_SWEETENER_KEEP);
  if (naturalSweetener) {
    return {
      isWholeFood: true,
      ruleMatched: `natural_sweetener: ${naturalSweetener}`,
      autoConfidence: 'high',
    };
  }

  // General excludes run BEFORE the dairy/fermented/juice checks below,
  // deliberately -- caught during testing: "Ice cream, vanilla" contains
  // "cream" as a real, standalone word, which would otherwise falsely
  // trip the dairy branch before CANDY_SNACKS' own "ice cream" match
  // ever got a chance to run. An unambiguous "this is clearly not whole
  // food" phrase match should always win over a shorter, coincidental
  // positive-keyword collision inside it.
  const excludeMatch = anyKeywordMatches(n, ALL_EXCLUDE);
  if (excludeMatch) {
    return {
      isWholeFood: false,
      ruleMatched: `exclude_keyword: ${excludeMatch}`,
      autoConfidence: 'high',
    };
  }

  // Fermented/dairy: real, positive signal, but only when NOT also
  // flavored/sweetened -- the app owner's own explicit refinement.
  const fermentedMatch = anyKeywordMatches(n, FERMENTED_KEEP);
  const dairyMatch = anyKeywordMatches(n, PLAIN_DAIRY_KEEP);
  if (fermentedMatch || dairyMatch) {
    const flavorMarker = anyKeywordMatches(n, FLAVOR_OR_ADDITIVE_MARKERS);
    if (flavorMarker) {
      return {
        isWholeFood: false,
        ruleMatched: `flavored_dairy_or_ferment_excluded: matched "${fermentedMatch || dairyMatch}" but also "${flavorMarker}"`,
        autoConfidence: 'high',
      };
    }
    return {
      isWholeFood: true,
      ruleMatched: `plain_dairy_or_ferment: ${fermentedMatch || dairyMatch}`,
      autoConfidence: 'high',
    };
  }

  // Fresh juice: real, positive signal, unless it's from concentrate or
  // has added sugar.
  const juiceMatch = anyKeywordMatches(n, FRESH_JUICE_KEEP);
  if (juiceMatch) {
    const disqualifier = anyKeywordMatches(n, JUICE_DISQUALIFIERS);
    if (disqualifier) {
      return {
        isWholeFood: false,
        ruleMatched: `juice_disqualified: ${disqualifier}`,
        autoConfidence: 'high',
      };
    }
    return {
      isWholeFood: true,
      ruleMatched: 'fresh_juice',
      autoConfidence: 'medium', // medium, not high -- "juice" alone doesn't confirm 100% fresh-pressed the way a dedicated source field would; worth a real person's glance
    };
  }

  const rawHint = anyKeywordMatches(n, RAW_WHOLE_FOOD_HINTS);
  if (rawHint) {
    return {
      isWholeFood: true,
      ruleMatched: `raw_or_simply_cooked: ${rawHint}`,
      autoConfidence: 'medium',
    };
  }

  // Nothing matched either way -- genuinely ambiguous. Real, honest
  // behavior: don't default to include just because nothing excluded
  // it. Force a human decision instead.
  return {
    isWholeFood: null,
    ruleMatched: 'no_rule_matched',
    autoConfidence: 'low',
  };
}

/**
 * Real entry point: takes one raw_foods row (as read from the database --
 * needs name_original, name_english, and the record's source language)
 * plus that source's own real language code, and returns a classification.
 * This is the piece that decides WHICH name is trustworthy English
 * evidence before ever handing text to classifyOne.
 */
function classifyRecord(row, sourceLanguage) {
  const englishIsNative = sourceLanguage === 'en';
  const nameForClassification = row.name_english || (englishIsNative ? row.name_original : null);
  const hasEnglishEvidence = Boolean(nameForClassification);
  return classifyOne({ nameForClassification: nameForClassification || '', hasEnglishEvidence });
}

/**
 * Runs classification over every raw_foods row that doesn't already
 * have a reviewed=1 classification (so re-running this after adding a
 * new source, or after a translation pass fills in more name_english
 * values, never overwrites a real person's own confirmed decision).
 */
function classifyAll(db, execFileSync, SQLITE_EXE, dbPath) {
  const rowsRaw = execFileSync(
    SQLITE_EXE,
    [
      '-cmd', '.timeout 30000',
      dbPath,
      '-json',
      `SELECT rf.raw_id, rf.name_original, rf.name_english, s.language AS source_language
       FROM raw_foods rf
       JOIN sources s ON s.source_code = rf.source_code
       LEFT JOIN whole_food_classifications wfc ON wfc.raw_id = rf.raw_id
       WHERE wfc.raw_id IS NULL OR wfc.reviewed = 0;`,
    ],
    // Real bug hit at 12,520+ rows: Node's own default execFileSync
    // maxBuffer (1MB) is too small for this query's real JSON output
    // once the database grows past a few thousand rows -- the same
    // fix already applied to run-source.js's own query()/runBatch(),
    // needed here too since this file makes its own, separate call.
    { encoding: 'utf8', maxBuffer: 1024 * 1024 * 256 }
  );
  const rows = JSON.parse(rowsRaw || '[]');

  const nowIso = new Date().toISOString();
  const statements = [];
  for (const row of rows) {
    const result = classifyRecord(row, row.source_language);
    const isWholeFoodSql =
      result.isWholeFood === null ? 'NULL' : result.isWholeFood ? '1' : '0';
    const esc = (s) => (s === null || s === undefined ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`);
    statements.push(
      `INSERT INTO whole_food_classifications (raw_id, is_whole_food, rule_matched, auto_confidence, reviewed, classified_at)
       VALUES (${row.raw_id}, ${isWholeFoodSql}, ${esc(result.ruleMatched)}, ${esc(result.autoConfidence)}, 0, ${esc(nowIso)})
       ON CONFLICT(raw_id) DO UPDATE SET
         is_whole_food = excluded.is_whole_food,
         rule_matched = excluded.rule_matched,
         auto_confidence = excluded.auto_confidence,
         classified_at = excluded.classified_at
       WHERE whole_food_classifications.reviewed = 0;`
    );
  }
  return { rowCount: rows.length, statements };
}

module.exports = {
  classifyOne,
  classifyRecord,
  classifyAll,
  PROCESSED_MEAT,
  CANDY_SNACKS,
  FAST_FOOD,
  ADDED_SUGAR_SALT_OR_PROCESSING,
  REFINED_SWEETENER,
  JUICE_DISQUALIFIERS,
  FLAVOR_OR_ADDITIVE_MARKERS,
  SAFE_OVERRIDES,
  FERMENTED_KEEP,
  NATURAL_SWEETENER_KEEP,
  PLAIN_DAIRY_KEEP,
  FRESH_JUICE_KEEP,
  RAW_WHOLE_FOOD_HINTS,
};
