// Checks lib/snapshotChanges.ts, the words a person reads for what changed
// between the two devices (2026-09-22, direct report: the sync question
// "doesn't actually say what the change was that caused this update to
// synchronize from the other device. It should say what the change was that
// happened so the user can be reminded of it."):
//
// 1. A stamp: one entry per table, app_meta one entry per settings row.
// 2. What changed, said the way somebody would say it: singular and plural,
//    more and fewer, edits where a count would mean nothing, a supporting
//    table counted as part of the thing it belongs to rather than on its
//    own, and a table neither stamp has seen passed over.
// 3. Most of it first, and a tail of "N other things" past the fourth.
// 4. Reading back what was kept in app_meta and what rode in a snapshot,
//    including from a copy written by a version that had neither.
// 5. Every phrase is free of the banned dashes and filler.
//
// The module imports nothing. Exits non-zero on any failure.

/* global __dirname */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function load(relPath) {
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    throw new Error(`${relPath} must stay free of runtime imports (asked for ${name})`);
  });
  return module.exports;
}

const changes = load('lib/snapshotChanges.ts');

let checks = 0;
let failures = 0;
function check(condition, label) {
  checks += 1;
  if (!condition) {
    failures += 1;
    console.error('FAIL: ' + label);
  }
}
function same(actual, expected, label) {
  check(
    JSON.stringify(actual) === JSON.stringify(expected),
    label + ' (got ' + JSON.stringify(actual) + ', wanted ' + JSON.stringify(expected) + ')',
  );
}

// A hash standing in for fingerprintText: different text, different answer.
function hashText(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  }
  return (hash >>> 0).toString(16);
}

const rows = (n, seed) => Array.from({ length: n }, (_, i) => ({ id: i + 1, note: seed ?? 'x' }));
const stamp = (tables) => changes.stampTables(tables, hashText);

// 1. The stamp.
const first = stamp({
  meals: rows(3),
  meal_items: rows(9),
  app_meta: [
    { key: 'visual_preferences', value: '{"tabIcon":"leaf"}' },
    { key: 'home_sky_weather', value: 'cloudy' },
  ],
  notATable: 'nonsense',
});
check(first.meals.n === 3, 'a table is stamped with its row count');
check(typeof first.meals.h === 'string' && first.meals.h.length > 0, 'a table is stamped with a hash');
check(first['app_meta/visual_preferences'] !== undefined, 'app_meta is stamped one settings row at a time');
check(first.app_meta === undefined, 'app_meta is not stamped as a whole table');
check(first.notATable === undefined, 'anything that is not rows is passed over');
same(stamp({ meals: rows(3) }).meals, stamp({ meals: rows(3) }).meals, 'the same rows stamp the same way');
check(stamp({ meals: rows(3, 'a') }).meals.h !== stamp({ meals: rows(3, 'b') }).meals.h, 'changed rows stamp differently');

// 2. What changed.
same(changes.describeChanges(null, first), [], 'nothing is said before there is a stamp to compare against');
same(changes.describeChanges(first, first), [], 'nothing is said when nothing changed');

same(
  changes.describeChanges(stamp({ meals: rows(3) }), stamp({ meals: rows(6) })),
  ['3 more meals'],
  'more of something is counted',
);
same(
  changes.describeChanges(stamp({ meals: rows(3) }), stamp({ meals: rows(4) })),
  ['1 more meal'],
  'one of something is said in the singular',
);
same(
  changes.describeChanges(stamp({ garden_plots: rows(5) }), stamp({ garden_plots: rows(3) })),
  ['2 fewer garden areas'],
  'fewer of something is counted',
);
same(
  changes.describeChanges(stamp({ meals: rows(3, 'a') }), stamp({ meals: rows(3, 'b') })),
  ['edits to meals'],
  'the same number of rows, changed, reads as edits',
);

// A salad and its six ingredient rows are one salad.
same(
  changes.describeChanges(
    stamp({ salads: rows(1), salad_ingredients: rows(2) }),
    stamp({ salads: rows(2), salad_ingredients: rows(8) }),
  ),
  ['1 more salad'],
  'a supporting table does not add to the count',
);
same(
  changes.describeChanges(
    stamp({ salads: rows(2, 'a'), salad_ingredients: rows(8, 'a') }),
    stamp({ salads: rows(2, 'a'), salad_ingredients: rows(9, 'b') }),
  ),
  ['edits to salads'],
  'a supporting table on its own marks the area changed',
);

// Areas where a count would mean nothing.
same(
  changes.describeChanges(stamp({ user_profile: rows(1, 'a') }), stamp({ user_profile: rows(1, 'b') })),
  ['edits to profile details'],
  'a profile reads as edits rather than a number',
);
same(
  changes.describeChanges(stamp({ user_conditions: rows(2) }), stamp({ user_conditions: rows(5) })),
  ['edits to profile details'],
  'conditions are part of the profile, not a count of their own',
);

// Settings, one row at a time.
same(
  changes.describeChanges(
    stamp({ app_meta: [{ key: 'visual_preferences', value: 'a' }] }),
    stamp({ app_meta: [{ key: 'visual_preferences', value: 'b' }] }),
  ),
  ['edits to how the app looks'],
  'a settings row changing is said by name',
);
same(
  changes.describeChanges(stamp({ app_meta: [] }), stamp({ app_meta: [{ key: 'measurement_system', value: 'metric' }] })),
  ['edits to your measurement units'],
  'a setting written for the first time is still a change somebody made',
);
same(
  changes.describeChanges(
    stamp({ app_meta: [{ key: 'home_sky_weather', value: 'a' }] }),
    stamp({ app_meta: [{ key: 'home_sky_weather', value: 'b' }] }),
  ),
  [],
  'a cached setting is not worth saying',
);
same(
  changes.describeChanges(
    stamp({ app_meta: [{ key: 'whatever_comes_later', value: 'a' }] }),
    stamp({ app_meta: [{ key: 'whatever_comes_later', value: 'b' }] }),
  ),
  ['edits to app settings'],
  'a setting nothing names yet reads as app settings',
);

// Bookkeeping, and a table neither side has seen.
same(
  changes.describeChanges(stamp({ activity_log: rows(2) }), stamp({ activity_log: rows(90) })),
  [],
  'the log of what happened is not worth saying',
);
same(
  changes.describeChanges(stamp({ meals: rows(3) }), stamp({ meals: rows(3), something_new: rows(40) })),
  [],
  'a table this stamp has never seen is passed over',
);
same(
  changes.describeChanges(stamp({ meals: rows(3), retired_table: rows(4) }), stamp({ meals: rows(3) })),
  [],
  'a table that has gone away is passed over',
);

// A table nothing names yet, once both stamps have it.
same(
  changes.describeChanges(stamp({ moon_phases: rows(1) }), stamp({ moon_phases: rows(3) })),
  ['2 more moon phases'],
  'a table nothing names yet is still counted, in its own words',
);

// 3. Most of it first, then the tail.
const before = stamp({
  meals: rows(10),
  lab_results: rows(10),
  capture_notes: rows(10),
  kitchen_items: rows(10),
  favorites: rows(10),
  connections: rows(10),
});
const after = stamp({
  meals: rows(12),
  lab_results: rows(19),
  capture_notes: rows(15),
  kitchen_items: rows(13),
  favorites: rows(11),
  connections: rows(20),
});
const many = changes.describeChanges(before, after);
check(many.length === changes.MOST_CHANGES_SAID + 1, 'past the fourth phrase the rest are counted');
same(
  many,
  ['10 more connections', '9 more lab results', '5 more captures', '3 more kitchen items', '2 other things'],
  'the biggest changes are said first',
);
const fiveAreas = changes.describeChanges(
  stamp({ meals: rows(10), lab_results: rows(10), capture_notes: rows(10), kitchen_items: rows(10), favorites: rows(10) }),
  stamp({ meals: rows(12), lab_results: rows(19), capture_notes: rows(15), kitchen_items: rows(13), favorites: rows(11) }),
);
check(fiveAreas[fiveAreas.length - 1] === '1 other thing', 'one left over is one thing, not one things');

// 4. Reading back.
same(changes.parseStamps(JSON.stringify(first)), first, 'a stamp survives being written and read back');
check(changes.parseStamps(null) === null, 'no stamp reads as no stamp');
check(changes.parseStamps('not json') === null, 'nonsense reads as no stamp');
check(changes.parseStamps('{}') === null, 'an empty stamp reads as no stamp');
check(changes.parseStamps('[1,2]') === null, 'a list is not a stamp');
same(changes.parseStamps('{"meals":{"n":3,"h":"aa"},"bad":{"n":"3"}}'), { meals: { n: 3, h: 'aa' } }, 'a broken entry is dropped');
same(changes.parseChangeList(['3 more meals', '', 7]), ['3 more meals'], 'only phrases come back');
same(changes.parseChangeList(undefined), [], 'a copy saved before this feature brings no phrases');

// 5. The words themselves.
const banned = /[–—]| -- |\b(real|genuine|genuinely)\b/i;
const everyPhrase = [
  ...many,
  ...changes.describeChanges(stamp({ meals: rows(1) }), stamp({ meals: rows(2) })),
  ...changes.describeChanges(stamp({ user_profile: rows(1, 'a') }), stamp({ user_profile: rows(1, 'b') })),
];
for (const phrase of everyPhrase) {
  check(!banned.test(phrase), 'phrase clean: ' + phrase);
  check(phrase === phrase.trim() && phrase.length > 0, 'phrase is a plain run of words: ' + phrase);
}

// Every area reads differently from every other, so two of them can never
// collapse into one line a person cannot tell apart.
const source = fs.readFileSync(path.join(__dirname, '..', 'lib/snapshotChanges.ts'), 'utf8');
const plurals = [...source.matchAll(/many: '([^']+)'/g)].map((match) => match[1]);
check(plurals.length > 40, 'the areas are all here (' + plurals.length + ')');
check(new Set(plurals).size === plurals.length, 'no two areas read the same way');
for (const plural of plurals) check(!banned.test(plural), 'area name clean: ' + plural);

if (failures > 0) {
  console.error(`${failures} of ${checks} checks failed`);
  process.exit(1);
}
console.log(`snapshotChanges: ${checks} checks passed`);
