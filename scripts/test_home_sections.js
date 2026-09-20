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

const {
  groupHomeSectionKeysByTab,
  groupHomeSectionsForDisplay,
  homeGroupIdOf,
  HOME_SECTION_TAB_PATH,
  reorderHomeGroups,
  reorderWithinHomeGroup,
} = load('lib/homeSections.ts');

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

// Home has a group again, 1.0.39.10, direct correction: "You removed the
// Home group from the Home screen. It should remain at the top in order of
// occurance in the TabHub menu." It held the one card that is not a window
// into another tab: the greeting, the date and the sky. The flip cards
// joined it for one release on 2026-09-19, when the Digest tab was taken
// apart, and left again the same day by direct correction: "they need to
// be out on their own together like they were before, and they should be
// listed in a group called Digest."
check('the home group holds only the today card', Object.keys(HOME_SECTION_TAB_PATH).filter((k) => HOME_SECTION_TAB_PATH[k] === '/'), ['today']);
check('the digest cards keep a group of their own', groupHomeSectionsForDisplay(['today', 'digestCards', 'groceryList']), [
  { kind: 'tab', path: '/', keys: ['today'] },
  { kind: 'tab', path: '/digest', keys: ['digestCards'] },
  { kind: 'tab', path: '/life', keys: ['groceryList'] },
]);

// And it leads, because Home leads TabHub’s own grid.
check('the home group comes first', groupHomeSectionsForDisplay(['today', 'logAgain'])[0], { kind: 'tab', path: '/', keys: ['today'] });

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
// (components/TabHub.tsx, lines 708-711). Info is a help sheet rather than a
// destination, so what is left is Home, Profile, and every tab after Home in
// TAB_ROUTES' own order. Read from both real files rather than retyped, so
// reordering either one fails here instead of quietly changing the page.
//
// One group is not in the menu at all: the Digest, since 2026-09-19. The
// tab went, the flip cards kept a group of their own by direct correction,
// and the same day's instruction put that group last: "Move Digest to the
// bottom, under Life for how it would be presented the first time someone
// opens the app."
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
const menuOrderWithDigest = [tabPaths[0], '/profile', ...tabPaths.slice(1), '/digest'];
check('default order runs in TabHub menu order, the Digest last', defaultGroupPaths, menuOrderWithDigest);

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

// --- Arranging Home from Home itself, 1.0.39.16 ---
//
// Dragging a group and dragging a card inside one are both rewrites of the
// single saved order, so the thing worth checking is that a rewrite never
// loses, duplicates or re-sorts anything it was not asked to move.

const arrangeGroups = groupHomeSectionsForDisplay(defaultOrder);
const groupCount = arrangeGroups.length;

// A group dragged to the top arrives at the top, whole, in one piece.
const toTop = reorderHomeGroups(defaultOrder, groupCount - 1, 0);
const toTopGroups = groupHomeSectionsForDisplay(toTop);
check('a group dragged to the top lands there', homeGroupIdOf(toTopGroups[0]), homeGroupIdOf(arrangeGroups[groupCount - 1]));
check('a group dragged to the top keeps its cards together', toTopGroups.length, groupCount);
check('a group drag loses nothing', [...toTop].sort(), [...defaultOrder].sort());

// And the groups it passed all moved down exactly one place.
check(
  'the groups it passed each moved one place',
  toTopGroups.slice(1).map(homeGroupIdOf),
  arrangeGroups.slice(0, groupCount - 1).map(homeGroupIdOf),
);

// A drag that ended outside the list meant nothing, so nothing changes.
check('a drag off the top does nothing', reorderHomeGroups(defaultOrder, 0, -1), defaultOrder);
check('a drag off the bottom does nothing', reorderHomeGroups(defaultOrder, 0, groupCount), defaultOrder);
check('a drag that did not move does nothing', reorderHomeGroups(defaultOrder, 2, 2), defaultOrder);

// A card dragged inside its group moves there, and no other group is
// touched: the group keeps its place because its first member does.
const multi = arrangeGroups.find((g) => g.kind === 'tab' && g.keys.length > 1);
const multiId = homeGroupIdOf(multi);
const movedInside = reorderWithinHomeGroup(defaultOrder, multiId, multi.keys.length - 1, 0);
const insideGroups = groupHomeSectionsForDisplay(movedInside);
check(
  'a card dragged to the top of its group lands there',
  insideGroups.find((g) => homeGroupIdOf(g) === multiId).keys[0],
  multi.keys[multi.keys.length - 1],
);
check('a card drag loses nothing', [...movedInside].sort(), [...defaultOrder].sort());
check('a card drag leaves every group where it was', insideGroups.map(homeGroupIdOf), arrangeGroups.map(homeGroupIdOf));

// A card can never be dragged out from under the name it sits beneath,
// and a group id nobody is holding is not a reason to rewrite anything.
check(
  'a card drag past the end of its group does nothing',
  reorderWithinHomeGroup(defaultOrder, multiId, 0, multi.keys.length),
  defaultOrder,
);
check('an unknown group does nothing', reorderWithinHomeGroup(defaultOrder, 'nope', 0, 1), defaultOrder);

if (failures > 0) {
  console.error(`\n${failures} of ${checks} checks failed`);
  process.exit(1);
}
console.log(`All ${checks} checks passed`);
