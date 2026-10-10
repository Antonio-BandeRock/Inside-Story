// Checks lib/paidFeatures.ts, P27 (2026-10-09).
//
//   node scripts/test_paid_features.js
//
// 1. Every paid lens key exists on its tab's screen, so a renamed lens can
//    never quietly fall off the wall.
// 2. Nothing safety rests on, and neither privacy lens, is ever paid: P28
//    and decision U4.
// 3. The wall's words keep the house style (no dashes in place of
//    punctuation, no "real", "genuine" or "genuinely").
/* global __dirname */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'lib', 'paidFeatures.ts'), 'utf8');

const TAB_FILES = {
  Food: 'food.tsx',
  Schedules: 'schedule.tsx',
  Signals: 'log.tsx',
  Insights: 'insights.tsx',
  Trends: 'trends.tsx',
  Reports: 'reports.tsx',
  Garden: 'garden.tsx',
  Life: 'life.tsx',
};

// Lens keys that may never sit behind payment, by tab.
const NEVER_PAID = {
  Life: ['emergency', 'myMeds', 'groceryList', 'kitchen', 'routines'],
  Schedules: ['meds', 'appointments', 'meals', 'hydration'],
  Signals: ['flares', 'symptoms'],
};
const NEVER_PAID_WORDS = /emergency|allerg|vault|app lock|dose reminder|interaction/i;

let failures = 0;
function fail(message) {
  failures += 1;
  console.log('FAIL ' + message);
}

// Read the table by its shape: a tab title opening an object, then
// lens keys each opening an object holding board and gives.
const table = {};
let tab = null;
for (const line of source.split(/\r?\n/)) {
  const tabMatch = line.match(/^  ([A-Z][A-Za-z]+): \{$/);
  if (tabMatch) {
    tab = tabMatch[1];
    table[tab] = {};
    continue;
  }
  if (!tab) continue;
  const lensMatch = line.match(/^    '?([A-Za-z-]+)'?: \{(.*)$/);
  if (lensMatch) {
    const rest = lensMatch[2];
    const gives = (rest.match(/gives: '([^']+)'/) || [])[1];
    table[tab][lensMatch[1]] = { gives: gives || null };
    continue;
  }
  const givesMatch = line.match(/^      gives: '([^']+)'/);
  if (givesMatch) {
    const keys = Object.keys(table[tab]);
    table[tab][keys[keys.length - 1]].gives = givesMatch[1];
  }
  if (/^\};$/.test(line)) tab = null;
}

let count = 0;
for (const [tabTitle, lenses] of Object.entries(table)) {
  const file = TAB_FILES[tabTitle];
  if (!file) {
    fail(`${tabTitle} is not a tab this script knows`);
    continue;
  }
  let screen = fs.readFileSync(path.join(root, 'app', '(tabs)', file), 'utf8');
  // Reports draws its lenses from REPORT_KINDS rather than listing them.
  if (tabTitle === 'Reports') screen += fs.readFileSync(path.join(root, 'lib', 'reportKinds.ts'), 'utf8');
  for (const [key, info] of Object.entries(lenses)) {
    count += 1;
    if (!screen.includes(`'${key}'`)) fail(`${tabTitle}: lens '${key}' is not on ${file}`);
    if ((NEVER_PAID[tabTitle] || []).includes(key)) fail(`${tabTitle}: '${key}' is safety and must stay Free`);
    if (!info.gives) fail(`${tabTitle}: '${key}' says nothing about what it gives`);
    else {
      if (NEVER_PAID_WORDS.test(info.gives)) fail(`${tabTitle}: '${key}' reads as safety or privacy: ${info.gives}`);
      if (/[–—]| -- | - /.test(info.gives)) fail(`${tabTitle}: '${key}' uses a dash: ${info.gives}`);
      if (/\b(real|genuine|genuinely)\b/i.test(info.gives)) fail(`${tabTitle}: '${key}' uses a banned word`);
    }
  }
}

const wallText = source.slice(source.indexOf('export function paidWallWords'));
if (/[–—]| -- /.test(wallText)) fail('the wall words use a dash');
if (/\b(real|genuine|genuinely)\b/i.test(wallText)) fail('the wall words use a banned word');

if (count < 40) fail(`only ${count} paid lenses read; the table shape may have changed`);

console.log(failures === 0 ? `ok, ${count} paid lenses checked` : `${failures} failure(s)`);
process.exit(failures === 0 ? 0 : 1);
