// Real, direct tests for match.js's grouping cascade -- run manually via
// `node match.test.js`.

const assert = require('assert');
const { normalizeForMatch, proposeMatches, matchAgainstExistingGroups } = require('./match.js');

let pass = 0;
let fail = 0;
function check(name, fn) {
  try {
    fn();
    console.log('PASS  ' + name);
    pass++;
  } catch (e) {
    console.log('FAIL  ' + name + '  ->  ' + e.message);
    fail++;
  }
}

check('normalizeForMatch strips accents and case', () => {
  assert.strictEqual(normalizeForMatch('Café Latte'), 'cafe latte');
});

check('normalizeForMatch collapses punctuation to spaces', () => {
  assert.strictEqual(normalizeForMatch("Agurk, syltet!"), 'agurk syltet');
});

check('Tier 1: two records with the identical Latin name match, even in different languages', () => {
  const rows = [
    { raw_id: 1, source_code: 'USDA', name_original: 'Adzuki beans, raw', name_english: null, latin_name: 'Vigna angularis', langual_codes: null, source_language: 'en' },
    { raw_id: 2, source_code: 'Norway_Matvaretabellen', name_original: 'Adzukibønner, tørr', name_english: null, latin_name: 'Vigna angularis', langual_codes: null, source_language: 'no' },
  ];
  const statements = proposeMatches(rows);
  const groupInsert = statements.find((s) => s.includes('food_match_groups'));
  assert.ok(groupInsert, 'expected a real food_match_groups insert');
  const memberInserts = statements.filter((s) => s.includes('food_match_members') && s.includes("'latin_name'"));
  assert.strictEqual(memberInserts.length, 2, 'expected both rows linked via latin_name');
});

check('Tier 3 fallback: two records with no Latin name but the same real English name still match', () => {
  const rows = [
    { raw_id: 3, source_code: 'USDA', name_original: 'Carrot, raw', name_english: null, latin_name: null, langual_codes: null, source_language: 'en' },
    { raw_id: 4, source_code: 'UK_CoFID', name_original: 'Carrot, raw', name_english: null, latin_name: null, langual_codes: null, source_language: 'en' },
  ];
  const statements = proposeMatches(rows);
  const memberInserts = statements.filter((s) => s.includes('food_match_members') && s.includes("'canonical_name'"));
  assert.strictEqual(memberInserts.length, 2);
});

check('An untranslated, non-English record with no Latin/LanguaL data becomes a real region-specific standalone, not silently dropped', () => {
  const rows = [
    { raw_id: 5, source_code: 'Norway_Matvaretabellen', name_original: 'Agurksalat', name_english: null, latin_name: null, langual_codes: null, source_language: 'no' },
  ];
  const statements = proposeMatches(rows);
  const groupInsert = statements.find((s) => s.includes('food_match_groups'));
  assert.ok(groupInsert && groupInsert.includes('is_region_specific, created_at)\n       VALUES') && groupInsert.match(/,\s*1,\s*'/), 'expected is_region_specific = 1 for a genuinely unmatched row');
  const memberInsert = statements.find((s) => s.includes('food_match_members'));
  assert.ok(memberInsert.includes("'unmatched_standalone'"));
});

check('A stronger tier claims a row before a weaker tier gets a chance -- Latin name wins over name-only coincidence', () => {
  // Two records share an English name string ("Pepper") but have
  // DIFFERENT real Latin names (bell pepper vs. black peppercorn) --
  // Tier 1 should never fire here (different species), so they should
  // NOT be forced together by Tier 3 either once Tier 1 has already
  // run and correctly found no match for either.
  const rows = [
    { raw_id: 6, source_code: 'USDA', name_original: 'Pepper, raw', name_english: null, latin_name: 'Capsicum annuum', langual_codes: null, source_language: 'en' },
    { raw_id: 7, source_code: 'France_Ciqual', name_original: 'Pepper, ground', name_english: null, latin_name: 'Piper nigrum', langual_codes: null, source_language: 'en' },
  ];
  const statements = proposeMatches(rows);
  const latinMemberInserts = statements.filter((s) => s.includes("'latin_name'"));
  assert.strictEqual(latinMemberInserts.length, 0, 'different species should never match on Tier 1');
  // Since their names differ too ("Pepper, raw" vs "Pepper, ground"),
  // Tier 3 shouldn't group them either -- both should end up standalone.
  const standaloneInserts = statements.filter((s) => s.includes("'unmatched_standalone'"));
  assert.strictEqual(standaloneInserts.length, 2, 'both should be standalone since neither species nor exact name matched');
});

check('REGRESSION: a real 4-member group (multiple apple varieties sharing one species) must ALL get the SAME group id, and never bleed into another group -- the exact bug found live against real Norwegian data, where last_insert_rowid() got corrupted after the first member insert', () => {
  const rows = [
    { raw_id: 10, source_code: 'Norway_Matvaretabellen', name_original: 'Apple, Granny Smith, raw', name_english: 'Apple, Granny Smith, raw', latin_name: 'Malus domestica Borkh.', langual_codes: null, source_language: 'en' },
    { raw_id: 11, source_code: 'Norway_Matvaretabellen', name_original: 'Apple, Ingrid Marie, raw', name_english: 'Apple, Ingrid Marie, raw', latin_name: 'Malus domestica Borkh.', langual_codes: null, source_language: 'en' },
    { raw_id: 12, source_code: 'Norway_Matvaretabellen', name_original: 'Apple, Pink Lady, raw', name_english: 'Apple, Pink Lady, raw', latin_name: 'Malus domestica Borkh.', langual_codes: null, source_language: 'en' },
    { raw_id: 13, source_code: 'Norway_Matvaretabellen', name_original: 'Apple, imported, raw', name_english: 'Apple, imported, raw', latin_name: 'Malus domestica Borkh.', langual_codes: null, source_language: 'en' },
    // A genuinely different species -- must NEVER end up sharing a group id with the apples above.
    { raw_id: 14, source_code: 'Norway_Matvaretabellen', name_original: 'Apricots, dried', name_english: 'Apricots, dried', latin_name: 'Prunus armeniaca L.', langual_codes: null, source_language: 'en' },
    { raw_id: 15, source_code: 'Norway_Matvaretabellen', name_original: 'Apricots, raw', name_english: 'Apricots, raw', latin_name: 'Prunus armeniaca L.', langual_codes: null, source_language: 'en' },
  ];
  const statements = proposeMatches(rows, 0);

  // Extract every real (match_group_id, raw_id) pair actually written,
  // by parsing the generated SQL directly -- the real, honest way to
  // check this, not just trusting the function's own return shape.
  const memberPairs = [];
  for (const s of statements) {
    const m = s.match(/INSERT INTO food_match_members \(match_group_id, raw_id,.*?\)\s*VALUES \((\d+), (\d+),/s);
    if (m) memberPairs.push({ groupId: Number(m[1]), rawId: Number(m[2]) });
  }

  const appleGroupIds = new Set(memberPairs.filter((p) => [10, 11, 12, 13].includes(p.rawId)).map((p) => p.groupId));
  const apricotGroupIds = new Set(memberPairs.filter((p) => [14, 15].includes(p.rawId)).map((p) => p.groupId));

  assert.strictEqual(appleGroupIds.size, 1, `all 4 real apple-variety rows must share exactly one group id, got ${appleGroupIds.size} distinct ids: ${[...appleGroupIds]}`);
  assert.strictEqual(apricotGroupIds.size, 1, `both real apricot rows must share exactly one group id, got ${apricotGroupIds.size}`);
  assert.notStrictEqual([...appleGroupIds][0], [...apricotGroupIds][0], 'apples and apricots are different real species and must never share a group id');
});

check('A real, non-zero startingGroupId (simulating a second run against an already-populated database) is honored, never colliding with existing ids', () => {
  const rows = [
    { raw_id: 20, source_code: 'USDA', name_original: 'Kiwi, raw', name_english: 'Kiwi, raw', latin_name: 'Actinidia deliciosa', langual_codes: null, source_language: 'en' },
    { raw_id: 21, source_code: 'Norway_Matvaretabellen', name_original: 'Kiwi, raw', name_english: 'Kiwi, raw', latin_name: 'Actinidia deliciosa', langual_codes: null, source_language: 'en' },
  ];
  const statements = proposeMatches(rows, 500); // pretend 500 real groups already exist
  const groupInsert = statements.find((s) => s.includes('food_match_groups'));
  const idMatch = groupInsert.match(/VALUES \((\d+),/);
  assert.ok(Number(idMatch[1]) > 500, `new group id must be greater than the real starting id of 500, got ${idMatch[1]}`);
});

check('REGRESSION: two real, different species sharing one ambiguous common English name must NOT be merged by Tier 3 -- the exact real-world case found live: highbush blueberry (Vaccinium corymbosum) vs. bilberry (Vaccinium myrtillus), both commonly called "Blueberries, raw," neither having a same-species sibling for Tier 1 to group', () => {
  const rows = [
    { raw_id: 30, source_code: 'USDA', name_original: 'Blueberries, raw', name_english: 'Blueberries, raw', latin_name: 'Vaccinium corymbosum', langual_codes: null, source_language: 'en' },
    { raw_id: 31, source_code: 'Norway_Matvaretabellen', name_original: 'Blueberries, raw', name_english: 'Blueberries, raw', latin_name: 'Vaccinium myrtillus L.', langual_codes: null, source_language: 'en' },
  ];
  const statements = proposeMatches(rows, 0);
  const canonicalNameMatches = statements.filter((s) => s.includes("'canonical_name'"));
  assert.strictEqual(canonicalNameMatches.length, 0, 'two rows with different confirmed Latin names must never be merged via the weaker English-name tier, even sharing an ambiguous common name');
  const standaloneInserts = statements.filter((s) => s.includes("'unmatched_standalone'"));
  assert.strictEqual(standaloneInserts.length, 2, 'both should end up standalone since they are genuinely different species with no real match');
});

check('A row with NO Latin name at all is still eligible for real Tier 3 English-name matching (the protection above only applies once a real species identity IS known)', () => {
  const rows = [
    { raw_id: 32, source_code: 'USDA', name_original: 'Carrot, raw', name_english: 'Carrot, raw', latin_name: null, langual_codes: null, source_language: 'en' },
    { raw_id: 33, source_code: 'UK_CoFID', name_original: 'Carrot, raw', name_english: 'Carrot, raw', latin_name: null, langual_codes: null, source_language: 'en' },
  ];
  const statements = proposeMatches(rows, 0);
  const canonicalNameMatches = statements.filter((s) => s.includes("'canonical_name'"));
  assert.strictEqual(canonicalNameMatches.length, 2, 'two Latin-name-less rows sharing a real English name should still match via Tier 3');
});

check('REGRESSION: two real, different species sharing an IDENTICAL LanguaL code set must NOT be merged by Tier 2 -- the exact real-world case found live: highbush blueberry and bilberry both coded as "fresh, raw, whole berry" etc., with no species-specific facet distinguishing them', () => {
  const rows = [
    { raw_id: 40, source_code: 'USDA', name_original: 'Blueberries, American, raw', name_english: null, latin_name: 'Vaccinium corymbosum', langual_codes: JSON.stringify(['A0142', 'B1274', 'C0205']), source_language: 'en' },
    { raw_id: 41, source_code: 'Norway_Matvaretabellen', name_original: 'Blueberries, raw', name_english: 'Blueberries, raw', latin_name: 'Vaccinium myrtillus L.', langual_codes: JSON.stringify(['A0142', 'B1274', 'C0205']), source_language: 'en' },
  ];
  const statements = proposeMatches(rows, 0);
  const langualMatches = statements.filter((s) => s.includes("'langual_code'"));
  assert.strictEqual(langualMatches.length, 0, 'two rows with different confirmed Latin names must never be merged via LanguaL codes alone, even an identical full set');
  const standaloneInserts = statements.filter((s) => s.includes("'unmatched_standalone'"));
  assert.strictEqual(standaloneInserts.length, 2);
});

check('A row with NO Latin name at all is still eligible for real Tier 2 LanguaL matching', () => {
  const rows = [
    { raw_id: 42, source_code: 'USDA', name_original: 'Some fish, raw', name_english: null, latin_name: null, langual_codes: JSON.stringify(['A0100', 'B0200']), source_language: 'en' },
    { raw_id: 43, source_code: 'Norway_Matvaretabellen', name_original: 'Some fish, raw', name_english: 'Some fish, raw', latin_name: null, langual_codes: JSON.stringify(['A0100', 'B0200']), source_language: 'en' },
  ];
  const statements = proposeMatches(rows, 0);
  const langualMatches = statements.filter((s) => s.includes("'langual_code'"));
  assert.strictEqual(langualMatches.length, 2, 'two Latin-name-less rows sharing an identical LanguaL set should still match via Tier 2');
});

check('REGRESSION (the real live blocker): a new row from a second source, with no Latin name, whose translated English name matches an existing group member, correctly JOINS that existing group instead of forming its own new, unlinked one -- the exact real gap that left Norway/Sweden showing zero cross-source matches even after Sweden was translated and correctly classified', () => {
  const existingMembers = [
    { match_group_id: 5, raw_id: 100, name_english: 'Apple, Granny Smith, raw', latin_name: 'Malus domestica Borkh.', langual_codes: null, source_language: 'en' },
    { match_group_id: 5, raw_id: 101, name_english: 'Apple juice', latin_name: 'Malus domestica Borkh.', langual_codes: null, source_language: 'en' },
  ];
  const newRows = [
    // No Latin name of its own (Sweden's real, honest limitation) --
    // but its machine-translated name matches an existing member's own name exactly.
    { raw_id: 200, source_code: 'Sweden_Livsmedelsverket', name_english: 'Apple juice', latin_name: null, langual_codes: null, source_language: 'sv' },
  ];
  const { statements, claimedRawIds } = matchAgainstExistingGroups(newRows, existingMembers);
  assert.ok(claimedRawIds.has(200), 'the new Swedish row should be claimed into the existing group');
  const memberInsert = statements.find((s) => s.includes('food_match_members'));
  assert.ok(memberInsert.includes('VALUES (5, 200,'), `expected the new row to join group 5, got: ${memberInsert}`);
  assert.ok(memberInsert.includes("'canonical_name'"));
  const regionUpdate = statements.find((s) => s.includes('UPDATE food_match_groups'));
  assert.ok(regionUpdate && regionUpdate.includes('is_region_specific = 0') && regionUpdate.includes('= 5'), 'the group must be marked no-longer-region-specific now that it has a real second source');
});

check('A row with a confirmed Latin name is STILL protected even when joining an existing group -- it will only join via a real species match, never by a weaker signal, same as the peer-to-peer cascade', () => {
  const existingMembers = [
    { match_group_id: 6, raw_id: 110, name_english: 'Blueberries, raw', latin_name: 'Vaccinium corymbosum', langual_codes: null, source_language: 'en' },
  ];
  const newRows = [
    // Same common name, but a REAL, different, known species -- must never join group 6.
    { raw_id: 210, source_code: 'TEST', name_english: 'Blueberries, raw', latin_name: 'Vaccinium myrtillus L.', langual_codes: null, source_language: 'en' },
  ];
  const { claimedRawIds } = matchAgainstExistingGroups(newRows, existingMembers);
  assert.ok(!claimedRawIds.has(210), 'a row with a real, different confirmed species must never join an existing group via name coincidence alone');
});

check('A row that matches nothing existing is correctly left unclaimed, ready for the normal peer-to-peer cascade', () => {
  const existingMembers = [
    { match_group_id: 7, raw_id: 120, name_english: 'Salmon, raw', latin_name: 'Salmo salar', langual_codes: null, source_language: 'en' },
  ];
  const newRows = [
    { raw_id: 220, source_code: 'TEST', name_english: 'Trout, raw', latin_name: 'Oncorhynchus mykiss', langual_codes: null, source_language: 'en' },
  ];
  const { statements, claimedRawIds } = matchAgainstExistingGroups(newRows, existingMembers);
  assert.strictEqual(claimedRawIds.size, 0);
  assert.strictEqual(statements.length, 0);
});

console.log('');
console.log(`${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
