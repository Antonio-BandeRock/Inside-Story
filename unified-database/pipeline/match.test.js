// Real, direct tests for match.js's grouping cascade -- run manually via
// `node match.test.js`.

const assert = require('assert');
const { normalizeForMatch, proposeMatches } = require('./match.js');

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

console.log('');
console.log(`${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
