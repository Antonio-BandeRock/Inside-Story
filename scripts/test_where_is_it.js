// Runs lib/whereIsIt.ts: how a search for where something was left is
// scored, ordered, and how old an answer is allowed to get before the screen
// says so.
//
// Built 2026-09-23, phase 1 of the cross-app push.
//
// The rules checked:
//
//  1. A place name is cleaned and capped, and two characters is enough,
//     because somebody who labels freezer drawers A1 and B2 is doing it
//     right.
//  2. Searching folds case and punctuation but leaves accents alone, since
//     this app ships in languages where folding them merges different words.
//  3. Every typed word has to appear somewhere, so more words narrows.
//  4. A match on the thing outranks a match on the place, and a match at the
//     start of a word outranks one buried inside it.
//  5. Equal answers are ordered by which was confirmed most recently.
//  6. An empty query lists rather than refuses.
//  7. Age is described in the words somebody would use, and an answer old
//     enough to have gone wrong says so without claiming anything moved.
//  8. Suggested places are deduped case-insensitively, keeping the most
//     recent spelling, so one cupboard does not become two.
//  9. An empty store and a search that missed get different sentences.
//
// Run with: node scripts/test_where_is_it.js
// Exits non-zero on any failure.

/* global __dirname */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function loadModule(relPath) {
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    throw new Error(`unexpected import ${name}`);
  });
  return module.exports;
}

const W = loadModule('lib/whereIsIt.ts');
const {
  PLACE_NAME_MAX,
  cleanPlaceName,
  isPlaceNameUsable,
  normalizeForSearch,
  searchWords,
  scorePlaceRecord,
  searchPlaces,
  placeConfidence,
  describePlaceAge,
  describePlaceLine,
  stalePrompt,
  suggestPlaces,
  describeNoResults,
  describeWhereIsItRow,
} = W;

let passed = 0;
let failed = 0;
function check(name, actual, expected) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) passed += 1;
  else {
    failed += 1;
    console.log(`FAIL ${name}\n  expected ${JSON.stringify(expected)}\n  got      ${JSON.stringify(actual)}`);
  }
}
function checkTrue(name, actual) {
  check(name, actual === true, true);
}

function record(fields) {
  return {
    id: 'kitchen:1',
    kind: 'kitchen',
    what: 'Thing',
    place: 'Somewhere',
    detail: null,
    placedOn: '2026-09-01',
    editable: true,
    ...fields,
  };
}

// 1. Cleaning a place name.
check('space is collapsed and trimmed', cleanPlaceName('  chest   freezer '), 'chest freezer');
check('a long place is capped', cleanPlaceName('x'.repeat(200)).length, PLACE_NAME_MAX);
check('a non-string is empty', cleanPlaceName(null), '');
checkTrue('two characters is a usable place', isPlaceNameUsable('A1'));
check('one character is not', isPlaceNameUsable('A'), false);
check('space alone is not', isPlaceNameUsable('   '), false);

// 2. Normalizing for search.
check('case is folded', normalizeForSearch('Chest Freezer'), 'chest freezer');
check('punctuation becomes space', normalizeForSearch("Juan's chest-freezer"), 'juan s chest freezer');
check('accents survive', normalizeForSearch('Crème fraîche'), 'crème fraîche');
check('words are split', searchWords('  hall  cupboard '), ['hall', 'cupboard']);
check('an empty query has no words', searchWords('   '), []);

// 3. Every word has to appear somewhere.
const batteries = record({ what: 'Spare batteries', place: 'Hall cupboard' });
checkTrue('one matching word scores', scorePlaceRecord(batteries, 'batteries') > 0);
checkTrue('both matching words score', scorePlaceRecord(batteries, 'spare batteries') > 0);
check('a word that appears nowhere misses', scorePlaceRecord(batteries, 'batteries torch'), null);
check(
  'a word can match the place instead of the thing',
  scorePlaceRecord(batteries, 'batteries cupboard') > 0,
  true,
);

// 4. Where the word appears separates the hits.
const thing = record({ what: 'Freezer bags', place: 'Drawer' });
const place = record({ what: 'Ice cream', place: 'Chest freezer' });
checkTrue(
  'a match on the thing outranks a match on the place',
  scorePlaceRecord(thing, 'freezer') > scorePlaceRecord(place, 'freezer'),
);
const peas = record({ what: 'Peas', place: 'Freezer' });
const chickpeas = record({ what: 'Chickpeas', place: 'Freezer' });
checkTrue(
  'a word at the start of a word outranks one inside it',
  scorePlaceRecord(peas, 'peas') > scorePlaceRecord(chickpeas, 'peas'),
);
const detailOnly = record({ what: 'Stock', place: 'Freezer', detail: 'Two litres of chicken' });
checkTrue('a detail match still counts', scorePlaceRecord(detailOnly, 'chicken') > 0);
checkTrue(
  'a detail match ranks below a name match',
  scorePlaceRecord(detailOnly, 'chicken') < scorePlaceRecord(record({ what: 'Chicken' }), 'chicken'),
);

// 5 and 6. Ordering, and an empty query.
const older = record({ id: 'kitchen:old', what: 'Bin bags', place: 'Under sink', placedOn: '2026-01-04' });
const newer = record({ id: 'kitchen:new', what: 'Bin bags', place: 'Utility room', placedOn: '2026-09-10' });
check(
  'equal answers are ordered by what was confirmed most recently',
  searchPlaces([older, newer], 'bin bags').map((hit) => hit.record.id),
  ['kitchen:new', 'kitchen:old'],
);
check(
  'a match on the thing sorts above a match on the place',
  searchPlaces([place, thing], 'freezer').map((hit) => hit.record.what),
  ['Freezer bags', 'Ice cream'],
);
check('an empty query lists everything', searchPlaces([older, newer], '').length, 2);
check('a query that matches nothing returns nothing', searchPlaces([older, newer], 'passport').length, 0);

// 7. Age, and the warning on an answer that has had time to go wrong.
check('the same day reads as today', describePlaceAge('2026-09-23', '2026-09-23'), 'today');
check('one day back', describePlaceAge('2026-09-22', '2026-09-23'), 'yesterday');
check('under a fortnight counts days', describePlaceAge('2026-09-14', '2026-09-23'), '9 days ago');
check('under two months counts weeks', describePlaceAge('2026-08-20', '2026-09-23'), '5 weeks ago');
check('beyond that counts months', describePlaceAge('2026-04-23', '2026-09-23'), '5 months ago');
check('an unparseable date says nothing', describePlaceAge('not a date', '2026-09-23'), '');
check('this month is fresh', placeConfidence('2026-09-10', '2026-09-23'), 'fresh');
check('two months on is aging', placeConfidence('2026-07-20', '2026-09-23'), 'aging');
check('half a year on is stale', placeConfidence('2026-03-01', '2026-09-23'), 'stale');
check('an unparseable date is treated as stale', placeConfidence('nonsense', '2026-09-23'), 'stale');
check('a fresh answer carries no warning', stalePrompt('fresh'), null);
check(
  'a stale answer asks to be checked without claiming anything moved',
  stalePrompt('stale'),
  'Written down a while ago. Worth checking before you count on it.',
);
checkTrue('no warning claims the thing has moved', !String(stalePrompt('aging')).includes('moved'));
check(
  'the caption gives the place and how old it is',
  describePlaceLine(record({ place: 'Chest freezer', placedOn: '2026-09-16' }), '2026-09-23'),
  'Chest freezer · 7 days ago',
);
check(
  'a caption with an unreadable date falls back to the place alone',
  describePlaceLine(record({ place: 'Chest freezer', placedOn: 'nonsense' }), '2026-09-23'),
  'Chest freezer',
);

// 8. The suggested places.
const forChips = [
  record({ id: 'a', place: 'chest freezer', placedOn: '2026-09-20' }),
  record({ id: 'b', place: 'Chest Freezer', placedOn: '2026-09-22' }),
  record({ id: 'c', place: 'Hall cupboard', placedOn: '2026-09-21' }),
  record({ id: 'd', place: '', placedOn: '2026-09-23' }),
];
check(
  'places dedupe case-insensitively, keeping the most recent spelling',
  suggestPlaces(forChips),
  ['Chest Freezer', 'Hall cupboard'],
);
check('an empty place is never suggested', suggestPlaces(forChips).includes(''), false);
check('the list is capped', suggestPlaces(forChips, 1), ['Chest Freezer']);

// 9. What the screen says when there is nothing to show.
checkTrue('an empty store is told how to fill it', describeNoResults('batteries', 0).includes('Capture'));
checkTrue(
  'a store that missed is told how to search it better',
  describeNoResults('batteries', 12).includes('name of the place'),
);
check('an empty query over a full store says nothing', describeNoResults('', 12), '');
check('nothing stored reads plainly', describeWhereIsItRow(0), 'Nothing has a place written down yet.');
check('one reads singular', describeWhereIsItRow(1), '1 thing has a place written down.');
check('many read plural', describeWhereIsItRow(14), '14 things have a place written down.');
checkTrue('the Home line names nothing anybody stored', !describeWhereIsItRow(14).includes('freezer'));

console.log(`${passed + failed} checks, ${failed} failures`);
process.exit(failed ? 1 : 0);
