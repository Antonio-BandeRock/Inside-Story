// Checks how Profile > Reminders lays out its switches (1.0.60.3,
// lib/reminderKindGroups.ts): every kind of reminder has a tab and a lens,
// tabs run in TabHub's order, lenses and switches are alphabetical, and the
// waiting list's switches name each kind once. Exits non-zero on any failure.

// eslint-config-expo lints this repo as app code, which has no __dirname.
// This is a plain Node script run with node, so it does.
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
    throw new Error(relPath + ' must stay free of runtime imports, found ' + name);
  });
  return module.exports;
}

const g = load('lib/reminderKindGroups.ts');

let failures = 0;
let checks = 0;
function check(label, condition) {
  checks += 1;
  if (!condition) {
    failures += 1;
    console.error('FAIL ' + label);
  }
}

// The kinds and their labels, read from the preferences module's source,
// since that module opens the database.
const prefsSource = fs.readFileSync(path.join(__dirname, '..', 'lib', 'reminderPreferences.ts'), 'utf8');
const keyBlock = prefsSource.match(/export const ALL_REMINDER_KIND_KEYS: ReminderKindKey\[\] = \[([\s\S]*?)\n\];/)[1];
const keys = Array.from(keyBlock.matchAll(/^\s*'(\w+)',/gm), (m) => m[1]);
const labelBlock = prefsSource.match(/export const REMINDER_KIND_LABELS[^{]*\{([\s\S]*?)\n\};/)[1];
const labels = Object.fromEntries(Array.from(labelBlock.matchAll(/^\s*(\w+): (?:'([^']*)'|"([^"]*)"),/gm), (m) => [m[1], m[2] ?? m[3]]));

check('there are kinds to place', keys.length >= 26);
for (const key of keys) {
  check('a place for ' + key, !!g.REMINDER_KIND_PLACE[key]);
  check('a label for ' + key, typeof labels[key] === 'string');
}
check('no place for a kind that does not exist', Object.keys(g.REMINDER_KIND_PLACE).every((k) => keys.includes(k)));

// Tabs in the order TabHub has them.
const tabsSource = fs.readFileSync(path.join(__dirname, '..', 'constants', 'tabs.ts'), 'utf8');
const routes = tabsSource.match(/export const TAB_ROUTES: TabRoute\[\] = \[([\s\S]*?)\n\];/)[1];
const tabTitles = Array.from(routes.matchAll(/title: '([^']+)'/g), (m) => m[1]);
check('tab order is TabHub order', tabTitles.join(',') === g.TAB_ORDER.join(','));

const grouped = g.groupReminderKinds(keys, labels);
const tabsSeen = grouped.map((t) => t.tab);
check('tabs come in TabHub order', tabsSeen.join(',') === g.TAB_ORDER.filter((t) => tabsSeen.includes(t)).join(','));
check('a tab with nothing is left out', !tabsSeen.includes('Reports'));
check('every kind appears once', grouped.flatMap((t) => t.lenses.flatMap((l) => l.keys)).sort().join(',') === [...keys].sort().join(','));
for (const tab of grouped) {
  const lenses = tab.lenses.map((l) => l.lens);
  check(tab.tab + ' lenses are alphabetical', lenses.join('|') === [...lenses].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })).join('|'));
  for (const lens of tab.lenses) {
    const names = lens.keys.map((k) => labels[k]);
    check(tab.tab + ' > ' + lens.lens + ' switches are alphabetical', names.join('|') === [...names].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })).join('|'));
  }
}
const garden = grouped.find((t) => t.tab === 'Garden');
const sowing = garden && garden.lenses.find((l) => l.lens === 'Sowing Calendar');
check('three switches on Sowing Calendar', sowing && sowing.keys.length === 3);
check('a dose is on Schedules > Meds', g.REMINDER_KIND_PLACE.dose.tab === 'Schedules' && g.REMINDER_KIND_PLACE.dose.lens === 'Meds');
check('a refill is on Life > My Meds', g.REMINDER_KIND_PLACE.refill.lens === 'My Meds');

// The waiting list's switches.
check('each kind once, alphabetical', g.kindsShowing(['meal', 'dose', 'dose', 'refill'], labels).join(',') === 'meal,dose,refill');
check('an unknown kind gets no switch', g.kindsShowing(['', 'something-old'], labels).length === 0);

// Profile and the list use it.
const profile = fs.readFileSync(path.join(__dirname, '..', 'app', 'profile.tsx'), 'utf8');
check('Profile lays the switches out by tab and lens', profile.includes('groupReminderKinds(ALL_REMINDER_KIND_KEYS, REMINDER_KIND_LABELS)'));
check('each time picker sits under its switch', profile.includes('{on ? renderReminderTimes(key) : null}'));
check('Profile can be opened onto Reminders', profile.includes("openSection !== 'reminders'"));
const list = fs.readFileSync(path.join(__dirname, '..', 'components', 'WaitingAnswersList.tsx'), 'utf8');
check('the list has a switch per kind showing', list.includes('kindsShowing('));
check('a switch is followed by the reconcile', /setReminderKindEnabled\(key[\s\S]{0,80}await syncReminderNotifications\(\)/.test(list));
check('the list opens Profile onto Reminders', list.includes("params: { section: 'reminders' }"));

console.log(failures === 0 ? 'All ' + checks + ' checks passed.' : failures + ' of ' + checks + ' checks failed.');
process.exit(failures === 0 ? 0 : 1);
