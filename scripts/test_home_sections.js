// Checks the Home section grouping (lib/homeSections.ts): sections from
// the same tab sit together, and a person's own saved order survives that
// regrouping rather than being silently reset. Pure, so it runs here rather
// than needing a phone.
//
// Exits non-zero on any failure.

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
  new Function('exports', 'module', 'require', outputText)(module.exports, module, () => {
    throw new Error('lib/homeSections.ts must stay free of runtime imports');
  });
  return module.exports;
}

const { groupHomeSectionKeysByTab, HOME_SECTION_TAB_PATH } = load('lib/homeSections.ts');

let failures = 0;
let checks = 0;
function check(label, actual, expected) {
  checks += 1;
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failures += 1;
    console.error(`FAIL  ${label}`);
    console.error(`      expected ${JSON.stringify(expected)}`);
    console.error(`      got      ${JSON.stringify(actual)}`);
  }
}

// The keys the app actually declares, read from the type union in
// lib/visualPreferences.ts rather than retyped here, so a section added
// there without a tab mapping fails this suite instead of crashing Home.
const prefsSource = fs.readFileSync(path.join(__dirname, '..', 'lib/visualPreferences.ts'), 'utf8');
// Comment lines are dropped first: the union's own comments carry
// semicolons and quoted words that would otherwise end or pollute the match.
const unionMatch = prefsSource
  .split('\n')
  .filter((line) => !line.trim().startsWith('//'))
  .join('\n')
  .match(/export type HomeSectionKey =([\s\S]*?);/);
const declaredKeys = [...unionMatch[1].matchAll(/'([a-zA-Z]+)'/g)].map((m) => m[1]);
check('every declared section has a tab mapping', declaredKeys.filter((k) => !(k in HOME_SECTION_TAB_PATH)), []);
check('no mapping for a section that no longer exists', Object.keys(HOME_SECTION_TAB_PATH).filter((k) => !declaredKeys.includes(k)), []);

// The old default order, from before grouping existed, interleaved tabs:
// Signals, then Food, then Schedules, then Insights, then Home, then
// Signals again. Grouping pulls each tab's sections together where that tab
// first appeared.
const oldDefault = [
  'sharedFolderSetup',
  'symptomCheckinReminder',
  'todaysCheckin',
  'logAgain',
  'groceryList',
  'yourDay',
  'statTiles',
  'quickActions',
  'howYoureFeeling',
  'fuelGauges',
  'weekTrend',
  'digestCards',
];
check('interleaved order is regrouped', groupHomeSectionKeysByTab(oldDefault), [
  'sharedFolderSetup',
  'symptomCheckinReminder',
  'todaysCheckin',
  'howYoureFeeling',
  'logAgain',
  'groceryList',
  'yourDay',
  'statTiles',
  'fuelGauges',
  'quickActions',
  'weekTrend',
  'digestCards',
]);

// An already-grouped order comes back untouched.
const grouped = ['quickActions', 'logAgain', 'groceryList', 'yourDay', 'todaysCheckin', 'howYoureFeeling', 'fuelGauges'];
check('grouped order is unchanged', groupHomeSectionKeysByTab(grouped), grouped);

// Order inside a group is the person's own, not the default.
check(
  'within-group order is kept',
  groupHomeSectionKeysByTab(['yourDay', 'logAgain', 'groceryList']),
  ['yourDay', 'groceryList', 'logAgain'],
);

// Moving one section above another tab's section carries its group along:
// the group lands where its first member is.
check(
  'group lands at its first member',
  groupHomeSectionKeysByTab(['fuelGauges', 'yourDay', 'statTiles', 'groceryList']),
  ['fuelGauges', 'statTiles', 'yourDay', 'groceryList'],
);

// A section with no tab is its own group and stays put, even between two
// members of another group: it never gets pulled into one.
check(
  'a tabless section stays where it is',
  groupHomeSectionKeysByTab(['groceryList', 'sharedFolderSetup', 'yourDay']),
  ['groceryList', 'yourDay', 'sharedFolderSetup'],
);

// Nothing is dropped or invented.
const shuffled = ['digestCards', 'weekTrend', 'fuelGauges', 'statTiles', 'howYoureFeeling', 'todaysCheckin', 'symptomCheckinReminder', 'yourDay', 'groceryList', 'logAgain', 'quickActions', 'sharedFolderSetup'];
check('length is preserved', groupHomeSectionKeysByTab(shuffled).length, shuffled.length);
check('same members', [...groupHomeSectionKeysByTab(shuffled)].sort(), [...shuffled].sort());
check('empty stays empty', groupHomeSectionKeysByTab([]), []);

if (failures > 0) {
  console.error(`\n${failures} of ${checks} checks failed`);
  process.exit(1);
}
console.log(`All ${checks} checks passed`);
