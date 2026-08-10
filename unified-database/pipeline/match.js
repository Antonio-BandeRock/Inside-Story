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
      '-cmd', '.timeout 30000',
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
 * Reads every real, current member of every existing match group --
 * the data matchAgainstExistingGroups needs to let a newly-classified
 * row join a group formed by an EARLIER run, rather than only ever
 * matching against other rows from the SAME run (the real, honestly-
 * named limitation documented in run-source.js's own header comment,
 * and confirmed as the actual live blocker preventing any real
 * Norway<->Sweden match once Sweden's names were translated: 0 real
 * cross-source matches existed even after Sweden's own genuine, correct
 * classification, purely because nothing could reach into Norway's
 * already-formed groups from a later run).
 */
function fetchExistingGroupMembers(execFileSync, SQLITE_EXE, dbPath) {
  const raw = execFileSync(
    SQLITE_EXE,
    [
      '-cmd', '.timeout 30000',
      dbPath,
      '-json',
      `SELECT m.match_group_id, rf.raw_id, rf.name_english, rf.latin_name, rf.langual_codes, s.language AS source_language
       FROM food_match_members m
       JOIN raw_foods rf ON rf.raw_id = m.raw_id
       JOIN sources s ON s.source_code = rf.source_code;`,
    ],
    { encoding: 'utf8' }
  );
  return JSON.parse(raw || '[]');
}

/**
 * Real fix for the real gap above: checks each newly-unmatched row
 * against EVERY EXISTING group's own real members, using the exact
 * same tiered precedence and the exact same "a row with a known Latin
 * name is never matched by a weaker signal" protection already proven
 * for the peer-to-peer cascade in proposeMatches below -- this is
 * deliberately the SAME rules, just checked against a different, older
 * pool of candidates, not a separate, looser standard.
 *
 * Returns { statements, claimedRawIds } -- claimedRawIds must be
 * removed from whatever list gets passed into proposeMatches next, so
 * a row claimed here never ALSO gets a brand-new, redundant group.
 */
function matchAgainstExistingGroups(newRows, existingMembers) {
  const statements = [];
  const claimedRawIds = new Set();
  const nowIso = new Date().toISOString();

  const byLatin = new Map(); // normalized latin name -> group id
  const byLangual = new Map(); // sorted langual code set -> group id (only from members with NO latin_name of their own -- same real reason as Tier 2 below)
  const byName = new Map(); // normalized english name -> group id (from every real member with a resolved name)

  for (const m of existingMembers) {
    if (m.latin_name) {
      const key = normalizeForMatch(m.latin_name);
      if (!byLatin.has(key)) byLatin.set(key, m.match_group_id);
    }
    if (m.langual_codes && !m.latin_name) {
      try {
        const codes = JSON.parse(m.langual_codes);
        if (Array.isArray(codes) && codes.length > 0) {
          const key = [...codes].sort().join('|');
          if (!byLangual.has(key)) byLangual.set(key, m.match_group_id);
        }
      } catch {
        // real, malformed data -- skip this member as a lookup key rather than crash
      }
    }
    const name = resolvedEnglishName(m);
    if (name) {
      const key = normalizeForMatch(name);
      if (!byName.has(key)) byName.set(key, m.match_group_id);
    }
  }

  for (const row of newRows) {
    let groupId = null;
    let method = null;

    if (row.latin_name) {
      const hit = byLatin.get(normalizeForMatch(row.latin_name));
      if (hit) { groupId = hit; method = 'latin_name'; }
    }
    // Same real protection as Tier 2/Tier 3 below: a row that already
    // has a confirmed Latin name is NEVER matched into a different
    // group by a weaker signal, even if that group is pre-existing.
    if (!groupId && !row.latin_name && row.langual_codes) {
      try {
        const codes = JSON.parse(row.langual_codes);
        if (Array.isArray(codes) && codes.length > 0) {
          const hit = byLangual.get([...codes].sort().join('|'));
          if (hit) { groupId = hit; method = 'langual_code'; }
        }
      } catch {
        // malformed langual_codes on the incoming row -- skip, not a crash
      }
    }
    if (!groupId && !row.latin_name) {
      const name = resolvedEnglishName(row);
      if (name) {
        const hit = byName.get(normalizeForMatch(name));
        if (hit) { groupId = hit; method = 'canonical_name'; }
      }
    }

    if (groupId) {
      claimedRawIds.add(row.raw_id);
      statements.push(
        `INSERT INTO food_match_members (match_group_id, raw_id, match_method, match_confidence)
         VALUES (${groupId}, ${row.raw_id}, ${esc(method)}, 'proposed');`
      );
      // A group that just gained a real second (or third...) source is,
      // by definition, no longer region-specific.
      statements.push(
        `UPDATE food_match_groups SET is_region_specific = 0 WHERE match_group_id = ${groupId};`
      );
    }
  }

  return { statements, claimedRawIds, timestamp: nowIso };
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
 *
 * REAL BUG FOUND AND FIXED, worth documenting so it's never
 * reintroduced: the first version of this function relied on SQLite's
 * own `last_insert_rowid()` inside every food_match_members INSERT to
 * pick up the group id from the food_match_groups insert that preceded
 * it. That works for exactly the FIRST member of a group -- but every
 * INSERT statement, on ANY table, advances the connection's own single
 * `last_insert_rowid()` value. Once a group's SECOND member insert ran,
 * `last_insert_rowid()` had already been overwritten by the rowid of
 * the FIRST member's own row in food_match_members (a real, separate
 * rowid sequence, since that table isn't WITHOUT ROWID) -- not the
 * group's own id anymore. Confirmed via a real, live run against
 * Norway's actual data: apple varieties (all genuinely sharing the
 * Latin name "Malus domestica Borkh.") ended up scattered across
 * several different match_group_id values, several of which had also
 * picked up a completely unrelated food (apricots, bananas, barley --
 * whatever a nearby food_match_members insert's own rowid happened to
 * coincide with). Foreign key enforcement (which should have rejected
 * an invalid match_group_id outright) never caught this either, because
 * PRAGMA foreign_keys = ON only applies per-connection and was never
 * re-issued on the connections actually running these inserts.
 *
 * Fixed by never relying on last_insert_rowid() for this at all --
 * `startingGroupId` (the real, current MAX(match_group_id) in the
 * database, queried by the caller before calling this function, 0 for
 * a fresh database) is used to assign every new group's id explicitly,
 * in this function's own JS code, and that same literal integer is
 * embedded directly into every INSERT for that group. No ambiguity
 * possible, regardless of how many other inserts run in between.
 */
function proposeMatches(rows, startingGroupId = 0) {
  const statements = [];
  const nowIso = new Date().toISOString();
  const alreadyGrouped = new Set(); // raw_id -> claimed by an earlier, stronger tier this same run
  let nextGroupId = startingGroupId;

  function recordGroup(group) {
    const unclaimed = group.members.filter((m) => !alreadyGrouped.has(m.raw_id));
    if (unclaimed.length < 2) return; // everything in this group already got claimed by a stronger tier
    const canonicalName =
      resolvedEnglishName(unclaimed[0]) || unclaimed[0].name_original;
    const canonicalLatin = unclaimed.find((m) => m.latin_name)?.latin_name || null;
    nextGroupId += 1;
    const groupId = nextGroupId;
    statements.push(
      `INSERT INTO food_match_groups (match_group_id, canonical_english_name, canonical_latin_name, is_region_specific, created_at)
       VALUES (${groupId}, ${esc(canonicalName)}, ${esc(canonicalLatin)}, 0, ${esc(nowIso)});`
    );
    for (const m of unclaimed) {
      alreadyGrouped.add(m.raw_id);
      statements.push(
        `INSERT INTO food_match_members (match_group_id, raw_id, match_method, match_confidence)
         VALUES (${groupId}, ${m.raw_id}, ${esc(group.matchMethod)}, 'proposed');`
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
  // conservative -- see this file's own header comment). Same real
  // protection as Tier 3 below, and for the identical, now-confirmed
  // reason: rows WITH a known Latin name are excluded here too. Found
  // live, not theoretical -- highbush blueberry (Vaccinium corymbosum)
  // and bilberry (Vaccinium myrtillus L.), two real, different species,
  // turned out to share an IDENTICAL full LanguaL code set (both
  // "fresh, raw, whole berry," etc. -- LanguaL's own facets describe
  // food FORM, not necessarily exact species), so this tier merged them
  // even though Tier 1 had already correctly, independently confirmed
  // they're different species. A row with a real Latin name always has
  // the strongest, most reliable signal already available (Tier 1) --
  // LanguaL should only ever fill in for rows with no species data at
  // all, never risk contradicting what Tier 1 already established.
  const langualGroups = groupByKey(
    rows.filter((r) => r.langual_codes && !r.latin_name),
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

  // Tier 3: canonical English name -- only rows with a real, resolved
  // English name reach this tier (non-English, untranslated rows simply
  // don't produce a key and fall through to the region-specific pass
  // below, same as classify.js's own refusal to guess), AND, critically,
  // only rows with NO known real Latin name. A real bug found and fixed
  // via direct verification against real Norwegian data: two genuinely
  // different real species -- Vaccinium corymbosum (highbush blueberry)
  // vs. Vaccinium myrtillus L. (bilberry), and separately Cucurbita
  // moschata vs. Cucurbita maxima (two different squash species) --
  // each carry a real, confirmed, DIFFERENT Latin name, correctly kept
  // apart by Tier 1 (neither had a same-species sibling to group with,
  // so Tier 1 correctly left both unclaimed rather than guessing), but
  // then got incorrectly merged anyway by Tier 3 purely because they
  // share the same ambiguous common English name ("Blueberries, raw").
  // Once a row's real species identity is KNOWN via a confirmed Latin
  // name, it should ONLY ever be matched by a species-level signal
  // (Tier 1/Tier 2) -- never overridden by the weaker English-name
  // fallback, which has no way to tell two same-named-but-different
  // species apart. A row with no Latin name at all has no such
  // protection to lose, so it's still eligible here as before.
  const nameGroups = groupByKey(
    rows.filter((r) => resolvedEnglishName(r) && !r.latin_name),
    (r) => normalizeForMatch(resolvedEnglishName(r)),
    'canonical_name'
  );
  nameGroups.forEach(recordGroup);

  // Final pass: everything still unclaimed becomes its own real,
  // single-member, region-specific group. Same explicit-id discipline
  // as recordGroup above -- no last_insert_rowid() anywhere in this
  // file anymore, after the real bug that method caused.
  for (const row of rows) {
    if (alreadyGrouped.has(row.raw_id)) continue;
    const canonicalName = resolvedEnglishName(row) || row.name_original;
    nextGroupId += 1;
    const groupId = nextGroupId;
    statements.push(
      `INSERT INTO food_match_groups (match_group_id, canonical_english_name, canonical_latin_name, is_region_specific, created_at)
       VALUES (${groupId}, ${esc(canonicalName)}, ${esc(row.latin_name)}, 1, ${esc(nowIso)});`
    );
    statements.push(
      `INSERT INTO food_match_members (match_group_id, raw_id, match_method, match_confidence)
       VALUES (${groupId}, ${row.raw_id}, 'unmatched_standalone', 'proposed');`
    );
    alreadyGrouped.add(row.raw_id);
  }

  return statements;
}

module.exports = { normalizeForMatch, groupByKey, proposeMatches, resolvedEnglishName, fetchUnmatchedWholeFoods, fetchExistingGroupMembers, matchAgainstExistingGroups };
