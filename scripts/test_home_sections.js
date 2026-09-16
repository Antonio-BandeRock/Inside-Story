// Checks the Home section grouping (lib/homeSections.ts): sections from
// the same tab sit together, and a person's own saved order survives that
// regrouping rather than being silently reset. Pure, so it runs here rather
// than needing a phone.
//
// Exits non-zero on any failure.

// eslint-config-expo lints this repo as app code, which has no __dirname.
// This is a plain Node script run with node, so it does (2026-09-16).
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
  new Function('exports', 'module', 'require', outputText)(module.exports, module, () => {
    throw new Error('lib/homeSections.ts must stay free of runtime imports');
  });
  return module.exports;
}

const { groupHomeSectionKeysByTab, groupHomeSectionsForDisplay, HOME_SECTION_TAB_PATH } = load('lib/homeSections.ts');

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

// An order that interleaves tabs: Signals, then Food, then Schedules, then
// Insights, then Food again, then Signals again. Grouping pulls each tab's
// sections together where that tab first appeared.
const interleaved = [
  'sharedFolderSetup',
  'symptomCheckinReminder',
  'todaysCheckin',
  'logAgain',
  'yourDay',
  'worthALook',
  'scanProduct',
  'howYoureFeeling',
  'logFlare',
  'fuelGauges',
  'weekTrend',
  'groceryList',
  'digestCards',
];
check('interleaved order is regrouped', groupHomeSectionKeysByTab(interleaved), [
  'sharedFolderSetup',
  'symptomCheckinReminder',
  'todaysCheckin',
  'howYoureFeeling',
  'logFlare',
  'logAgain',
  'scanProduct',
  'yourDay',
  'worthALook',
  'fuelGauges',
  'weekTrend',
  'groceryList',
  'digestCards',
]);

// An already-grouped order comes back untouched.
const grouped = ['logAgain', 'scanProduct', 'yourDay', 'todaysCheckin', 'howYoureFeeling', 'fuelGauges', 'groceryList'];
check('grouped order is unchanged', groupHomeSectionKeysByTab(grouped), grouped);

// Order inside a group is the person's own, not the default.
check(
  'within-group order is kept',
  groupHomeSectionKeysByTab(['logExercise', 'logAgain', 'logFlare']),
  ['logExercise', 'logFlare', 'logAgain'],
);

// The Grocery List belongs to Life, not Schedules (2026-09-12), so it does
// not get pulled up next to Your Day.
check(
  'grocery list is not grouped with schedules',
  groupHomeSectionKeysByTab(['yourDay', 'weekTrend', 'groceryList']),
  ['yourDay', 'weekTrend', 'groceryList'],
);

// Moving one section above another tab's section carries its group along:
// the group lands where its first member is.
check(
  'group lands at its first member',
  groupHomeSectionKeysByTab(['fuelGauges', 'yourDay', 'worthALook', 'mealsLoggedToday']),
  ['fuelGauges', 'worthALook', 'yourDay', 'mealsLoggedToday'],
);

// A section with no tab is its own group and stays put, even between two
// members of another group: it never gets pulled into one.
check(
  'a tabless section stays where it is',
  groupHomeSectionKeysByTab(['todaysCheckin', 'sharedFolderSetup', 'logFlare']),
  ['todaysCheckin', 'logFlare', 'sharedFolderSetup'],
);

// Nothing is dropped or invented.
const shuffled = ['digestCards', 'weekTrend', 'fuelGauges', 'worthALook', 'mealsLoggedToday', 'howYoureFeeling', 'todaysCheckin', 'symptomCheckinReminder', 'yourDay', 'groceryList', 'logAgain', 'scanProduct', 'logFlare', 'logBloodPressure', 'logExercise', 'sharedFolderSetup'];
check('length is preserved', groupHomeSectionKeysByTab(shuffled).length, shuffled.length);
check('same members', [...groupHomeSectionKeysByTab(shuffled)].sort(), [...shuffled].sort());
check('empty stays empty', groupHomeSectionKeysByTab([]), []);

// The per-tab bands Home draws (2026-09-16). Each run of tab-mates
// becomes one group; a section with no tab is a row of its own.
check('display groups are one per tab', groupHomeSectionsForDisplay(['logAgain', 'scanProduct', 'yourDay']), [
  { kind: 'tab', path: '/food', keys: ['logAgain', 'scanProduct'] },
  { kind: 'tab', path: '/schedule', keys: ['yourDay'] },
]);

check('a tabless section is a group of its own', groupHomeSectionsForDisplay(['sharedFolderSetup', 'logAgain']), [
  { kind: 'solo', key: 'sharedFolderSetup' },
  { kind: 'tab', path: '/food', keys: ['logAgain'] },
]);

// Low Stimulation is a Profile setting surfaced on Home, so it lands in
// Profile's group rather than beside another tab's cards (1.0.39.7; it
// was Home's own group for the day between).
check('low stimulation sits in the profile group', groupHomeSectionsForDisplay(['logAgain', 'lowStimulation']), [
  { kind: 'tab', path: '/food', keys: ['logAgain'] },
  { kind: 'tab', path: '/profile', keys: ['lowStimulation'] },
]);

// Home itself has no group: nothing maps to it. A Home group inside
// Home could only ever have meant "the rest".
check('nothing maps to home itself', Object.values(HOME_SECTION_TAB_PATH).filter((p) => p === '/'), []);

// Garden and Reports, 1.0.39.7. Each needed a card of its own before a
// group would appear at all, since renderHomeTabGroup drops an empty one.
check('garden sections share one group', groupHomeSectionsForDisplay(['gardenTasks', 'logHarvest']), [
  { kind: 'tab', path: '/garden', keys: ['gardenTasks', 'logHarvest'] },
]);
check('make a report is reports own group', groupHomeSectionsForDisplay(['weekTrend', 'makeReport']), [
  { kind: 'tab', path: '/trends', keys: ['weekTrend'] },
  { kind: 'tab', path: '/reports', keys: ['makeReport'] },
]);

// The default order comes out in TabHub menu order, 2026-09-16, direct
// instruction: "Put them into the order they exist in the TabHub menu."
// That menu is Home, Profile, Info, then TAB_ROUTES minus Home
// (components/TabHub.tsx, lines 708-711). Home has no group and Info is
// a help sheet rather than a destination, so what is left is Profile
// followed by every tab after Home, in TAB_ROUTES' own order. Read from
// both real files rather than retyped, so reordering either one fails
// here instead of quietly changing the page.
const tabsSource = fs.readFileSync(path.join(__dirname, '..', 'constants/tabs.ts'), 'utf8');
const tabPaths = [...tabsSource.matchAll(/\{ path: '([^']+)'/g)].map((m) => m[1]);
const orderMatch = prefsSource.match(/export const ALL_HOME_SECTION_KEYS: HomeSectionKey\[\] = \[([\s\S]*?)\n\];/);
const defaultOrder = orderMatch[1]
  .split('\n')
  .filter((line) => !line.trim().startsWith('//'))
  .join('\n')
  .match(/'([a-zA-Z]+)'/g)
  .map((s) => s.replace(/'/g, ''))
  .filter((key) => key !== 'weather');
const defaultGroupPaths = groupHomeSectionsForDisplay(defaultOrder)
  .filter((g) => g.kind === 'tab')
  .map((g) => g.path);
check('default order runs in TabHub menu order', defaultGroupPaths, ['/profile', ...tabPaths.slice(1)]);

// Every declared section is in the default order, and nothing is in it
// twice: a key added to the union but left out of the list would land at
// the bottom of Home on a fresh install and nowhere near its tab-mates.
check('default order holds every section', [...defaultOrder, 'weather'].sort(), [...declaredKeys].sort());
check('default order has no duplicates', defaultOrder.length, new Set(defaultOrder).size);

// An interleaved order regroups first, so one tab never gets two bands.
const interleavedPaths = groupHomeSectionsForDisplay(interleaved).filter((g) => g.kind === 'tab').map((g) => g.path);
check('no tab gets two bands', interleavedPaths.length, new Set(interleavedPaths).size);

// Nothing is dropped on the way into groups.
const regrouped = groupHomeSectionsForDisplay(shuffled)
  .flatMap((g) => (g.kind === 'tab' ? g.keys : [g.key]));
check('display grouping keeps every section', [...regrouped].sort(), [...shuffled].sort());
check('display grouping of nothing is nothing', groupHomeSectionsForDisplay([]), []);

if (failures > 0) {
  console.error(`\n${failures} of ${checks} checks failed`);
  process.exit(1);
}
console.log(`All ${checks} checks passed`);
