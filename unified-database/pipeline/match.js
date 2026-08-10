// The real cross-source matching cascade -- strongest, most
// language-independent signal first, exactly as discussed and agreed:
//   Tier 1: exact species/Latin name match
//   Tier 2: LanguaL classification-code overlap
//   Tier 3: canonical English name match
//   (Tier 4, manual, isn't code -- it's a real person using the audit
//   tool for whatever's left)
//
// EVERY automated match this produces is written as match_confidence =
// 'proposed', never 'confirmed' -- matching this project's own
// standing, unbroken discipline (every hide/move/rename decision across
// 10,000+ real rows has always gone through a real person before being
// trusted). A strong, exact species match is still just the tool's own
// best guess until someone looks at it.
//
// HONEST LIMITATION, stated directly rather than hidden: real LanguaL
// facet documentation (which code prefixes mean "biological source" vs.
// "physical state" vs. "cooking method," and therefore which real
// overlap threshold actually indicates "same food, different prep")
// isn't available to verify this session -- WebSearch has been
// exhausted the whole session this was built in. Tier 2 here is
// deliberately the most conservative possible starting rule (an EXACT,
// full-set match on the langual_codes array) rather than a confident-
// looking overlap heuristic built without the real facet reference to
// validate it against. Worth revisiting once that documentation is
// actually checked.
//
// After all three tiers run, every remaining is_whole_food=1 row that
// matched nothing becomes its own real, single-member match_group with
// is_region_specific=1 -- so "is this food region-specific" always has
// one place to look (food_match_groups), never two different code
// paths depending on whether a food happened to match anything.

function normalizeForMatch(text) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip accents, e.g. "café" -> "cafe" -- a real, deliberate choice so near-identical spellings across sources aren't treated as different foods purely over an accent mark
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function esc(s) {
  return s === null || s === undefined ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`;
}

/**
 * Reads every whole-food-classified raw_foods row (is_whole_food = 1)
 * that isn't already a member of some match_group -- so re-running this
 * after a new source is added never disturbs groups a real person has
 * already reviewed.
 */
function fetchUnmatchedWholeFoods(execFileSync, SQLITE_EXE, dbPath) {
  const raw = execFileSync(
    SQLITE_EXE,
    [
      dbPath,
      '-json',
      `SELECT rf.raw_id, rf.source_code, rf.name_original, rf.name_english,
              rf.latin_name, rf.langual_codes, s.language AS source_language
       FROM raw_foods rf
       JOIN sources s ON s.source_code = rf.source_code
       JOIN whole_food_classifications wfc ON wfc.raw_id = rf.raw_id
       WHERE wfc.is_whole_food = 1
         AND rf.raw_id NOT IN (SELECT raw_id FROM food_match_members);`,
    ],
    { encoding: 'utf8' }
  );
  return JSON.parse(raw || '[]');
}

function resolvedEnglishName(row) {
  return row.name_english || (row.source_language === 'en' ? row.name_original : null);
}

/**
 * Builds real match groups from a list of candidate rows, grouped by a
 * caller-supplied real key function. Only groups of 2+ become a real,
 * proposed multi-member match -- a lone row under a given key isn't a
 * match, it's just one row, and is left for a later tier or the final
 * region-specific pass to handle.
 */
function groupByKey(rows, keyFn, matchMethod) {
  const buckets = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (!key) continue;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(row);
  }
  const groups = [];
  for (const [key, members] of buckets.entries()) {
    if (members.length >= 2) {
      groups.push({ key, members, matchMethod });
    }
  }
  return groups;
}

/**
 * Runs the full cascade against the given database and returns the real
 * SQL statements needed to record the results -- callable, testable,
 * and inspectable before ever being run against a real database file.
 */
function proposeMatches(rows) {
  const statements = [];
  const nowIso = new Date().toISOString();
  const alreadyGrouped = new Set(); // raw_id -> claimed by an earlier, stronger tier this same run

  function recordGroup(group) {
    const unclaimed = group.members.filter((m) => !alreadyGrouped.has(m.raw_id));
    if (unclaimed.length < 2) return; // everything in this group already got claimed by a stronger tier
    const canonicalName =
      resolvedEnglishName(unclaimed[0]) || unclaimed[0].name_original;
    const canonicalLatin = unclaimed.find((m) => m.latin_name)?.latin_name || null;
    statements.push(
      `INSERT INTO food_match_groups (canonical_english_name, canonical_latin_name, is_region_specific, created_at)
       VALUES (${esc(canonicalName)}, ${esc(canonicalLatin)}, 0, ${esc(nowIso)});`
    );
    for (const m of unclaimed) {
      alreadyGrouped.add(m.raw_id);
      statements.push(
        `INSERT INTO food_match_members (match_group_id, raw_id, match_method, match_confidence)
         VALUES (last_insert_rowid(), ${m.raw_id}, ${esc(group.matchMethod)}, 'proposed');`
      );
    }
  }

  // Tier 1: exact species/Latin name.
  const latinGroups = groupByKey(
    rows.filter((r) => r.latin_name),
    (r) => normalizeForMatch(r.latin_name),
    'latin_name'
  );
  latinGroups.forEach(recordGroup);

  // Tier 2: exact, full-set LanguaL code overlap (deliberately
  // conservative -- see this file's own header comment).
  const langualGroups = groupByKey(
    rows.filter((r) => r.langual_codes),
    (r) => {
      try {
        const codes = JSON.parse(r.langual_codes);
        if (!Array.isArray(codes) || codes.length === 0) return null;
        return [...codes].sort().join('|');
      } catch {
        return null;
      }
    },
    'langual_code'
  );
  langualGroups.forEach(recordGroup);

  // Tier 3: canonical English name (only rows with a real, resolved
  // English name reach this tier -- non-English, untranslated rows
  // simply don't produce a key and fall through to the region-specific
  // pass below, same as classify.js's own refusal to guess).
  const nameGroups = groupByKey(
    rows.filter((r) => resolvedEnglishName(r)),
    (r) => normalizeForMatch(resolvedEnglishName(r)),
    'canonical_name'
  );
  nameGroups.forEach(recordGroup);

  // Final pass: everything still unclaimed becomes its own real,
  // single-member, region-specific group.
  for (const row of rows) {
    if (alreadyGrouped.has(row.raw_id)) continue;
    const canonicalName = resolvedEnglishName(row) || row.name_original;
    statements.push(
      `INSERT INTO food_match_groups (canonical_english_name, canonical_latin_name, is_region_specific, created_at)
       VALUES (${esc(canonicalName)}, ${esc(row.latin_name)}, 1, ${esc(nowIso)});`
    );
    statements.push(
      `INSERT INTO food_match_members (match_group_id, raw_id, match_method, match_confidence)
       VALUES (last_insert_rowid(), ${row.raw_id}, 'unmatched_standalone', 'proposed');`
    );
    alreadyGrouped.add(row.raw_id);
  }

  return statements;
}

module.exports = { normalizeForMatch, groupByKey, proposeMatches, resolvedEnglishName };
