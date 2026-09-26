// Runs the Phase 2 medication and emergency builders without a phone:
// lib/medSupply.ts (A3, A6), describeDoseDays in lib/trendsMore.ts (A12)
// and lib/emergencyOutside.ts (A17, A18, A19).
//
// The rules checked:
//
//  1. What is on hand is the count minus the doses marked taken since, the
//     pace comes from the week ahead on the schedule before the last two
//     weeks of marks, and with neither the sentence says how many are left
//     without inventing a number of days.
//  2. The refill reminder lands the lead days before the run-out day.
//  3. A phone number keeps a leading plus and its digits and nothing else.
//  4. Dose days are counted by day, with no share and no verdict.
//  5. The Medical ID lines, the wallet card and the lock-screen notice
//     leave out anything empty, never print "none", keep drug allergies
//     first, put the primary contact first, escape HTML, and show only the
//     parts picked.
//  6. None of it carries a score, praise, or a percentage.
//
// Run with: node scripts/test_med_supply.js
// Exits non-zero on any failure.

/* global __dirname */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const cache = new Map();
function load(relPath) {
  const full = path.join(__dirname, '..', relPath);
  if (cache.has(full)) return cache.get(full).exports;
  const source = fs.readFileSync(full, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  cache.set(full, module);
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    if (!name.startsWith('.')) throw new Error(`unexpected import ${name}`);
    return load(path.join(path.dirname(relPath), name + '.ts'));
  });
  return module.exports;
}

const M = load('lib/medSupply.ts');
const T = load('lib/trendsMore.ts');
const E = load('lib/emergencyOutside.ts');

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
function has(label, text, part) { check(`${label} contains "${part}"`, String(text).includes(part), true); }
function lacks(label, text, part) { check(`${label} lacks "${part}"`, String(text).includes(part), false); }

// --- 1 and 2. Supply -----------------------------------------------------------
const base = {
  onHand: 30, unit: 'tablets', perDose: 1, countedAt: '2026-09-20T08:00',
  takenSinceCount: 6, dueNext7Days: 7, takenPast14Days: 0, today: '2026-09-26', leadDays: 7,
};
const unc = M.readSupply({ ...base, onHand: null, countedAt: null });
check('uncounted remaining', unc.remaining, null);
check('uncounted short', unc.short, null);

const r = M.readSupply(base);
check('remaining', r.remaining, 24);
check('days left', r.daysLeft, 24);
check('runs out', r.runsOutOn, '2026-10-20');
check('remind on', r.remindOn, '2026-10-13');
check('short', r.short, 'About 24 days left (24 tablets)');
has('sentence', r.sentence, 'Oct 20');
has('sentence', r.sentence, 'A dose taken but not marked is still counted as there.');

const twice = M.readSupply({ ...base, perDose: 2, dueNext7Days: 14 });
check('two per dose, twice a day', twice.remaining, 18);
check('two per dose days', twice.daysLeft, 4);

const past = M.readSupply({ ...base, dueNext7Days: 0, takenPast14Days: 7 });
check('pace from the last two weeks', past.daysLeft, 48);

const noPace = M.readSupply({ ...base, dueNext7Days: 0, takenPast14Days: 0 });
check('no pace days', noPace.daysLeft, null);
check('no pace reminder', noPace.remindOn, null);
has('no pace sentence', noPace.sentence, 'Schedules > Meds');

const out = M.readSupply({ ...base, takenSinceCount: 40 });
check('run out remaining', out.remaining, 0);
check('run out remind today', out.remindOn, '2026-09-26');

check('refill line', M.describeRefillDue('Levothyroxine', r), 'Levothyroxine: about 24 days left. Time to ask for more.');
check('refill line, one day', M.describeRefillDue('X', { ...r, daysLeft: 1 }), 'X: about 1 day left. Time to ask for more.');
check('refill line, none', M.describeRefillDue('X', out), 'X: none left by the doses marked. Time to ask for more.');
check('refill line, no pace', M.describeRefillDue('X', noPace), 'X: time to ask for more.');
check('month edge', M.addDays('2026-01-31', 1), '2026-02-01');
check('short date', M.shortDate('2026-03-05'), 'Mar 5');

// --- 3. Phone numbers ------------------------------------------------------------
check('dial plus', M.dialable('+52 (322) 555-0100'), '+523225550100');
check('dial plain', M.dialable('322.555.0100'), '3225550100');
check('dial stray plus', M.dialable('555+0100'), '5550100');
check('dial empty', M.dialable(''), null);
check('dial words', M.dialable('ask at the desk'), null);

// --- 4. Dose days ------------------------------------------------------------------
check('no doses', T.describeDoseDays([]), 'No doses were due.');
const days = T.describeDoseDays([
  { date: '2026-09-20', mark: 'taken' }, { date: '2026-09-20', mark: 'taken' },
  { date: '2026-09-21', mark: 'taken' }, { date: '2026-09-21', mark: 'unmarked' },
  { date: '2026-09-22', mark: 'skipped' },
  { date: '2026-09-23', mark: 'unmarked' }, { date: '2026-09-23', mark: 'skipped' },
]);
has('dose days', days, 'Due on 4 days');
has('dose days', days, 'every dose marked taken on 1 day');
has('dose days', days, 'some marked taken on 1 day');
has('dose days', days, 'marked skipped on 1 day');
has('dose days', days, 'nothing marked taken on 1 day');
lacks('dose days', days, '%');

// --- 5. Emergency -----------------------------------------------------------------
const emptyProfile = {
  drugAllergies: '', bloodType: '', devices: '', doctorName: '', doctorPhone: '', preferredHospital: '',
  language: '', directiveLocation: '', otherNotes: '', confirmedAt: null,
};
const emptyApp = { displayName: '', conditions: [], medications: [], foodAllergies: [] };
const blank = { profile: emptyProfile, fromApp: emptyApp, contacts: [], today: '2026-09-26' };
check('empty medical id', E.medicalIdEntries(blank), []);
check('empty lock screen', E.lockScreenNotice(['drugAllergies', 'contact'], blank), null);
lacks('empty card', E.buildWalletCardHtml(blank), 'DRUG ALLERGIES');
has('empty card', E.buildWalletCardHtml(blank), 'Never confirmed as up to date');

const full = {
  profile: {
    ...emptyProfile, drugAllergies: 'Penicillin <hives>', bloodType: 'O+', devices: 'Pacemaker',
    doctorName: 'Dr. Ruiz', doctorPhone: '322 555 0101', language: 'Spanish', confirmedAt: '2026-09-25T10:00:00Z',
  },
  fromApp: {
    displayName: 'Ana', conditions: ["Hashimoto's", 'Celiac'],
    medications: [{ name: 'Levothyroxine', dose: '75 mcg' }, { name: 'Vitamin D', dose: null }],
    foodAllergies: ['Peanuts'],
  },
  contacts: [
    { id: 'b', name: 'Luis', relationship: '', phone: '322 555 0102', primary: false, notes: '' },
    { id: 'a', name: 'Tony', relationship: 'husband', phone: '322 555 0100', primary: true, notes: '' },
  ],
  today: '2026-09-26',
};
const ids = E.medicalIdEntries(full);
check('medical id fields', ids.map((e) => e.field), [
  'Name', 'Allergies and reactions', 'Medical conditions', 'Medications', 'Blood type', 'Medical notes', 'Emergency contacts',
]);
check('allergies drug first', ids[1].value, 'Drugs: Penicillin <hives>\nFoods: Peanuts');
check('medications with dose', ids[3].value, 'Levothyroxine (75 mcg), Vitamin D');
check('primary contact first', ids[6].value.split('\n')[0], 'Tony (husband): 322 555 0100');
has('notes', ids[5].value, 'Doctor: Dr. Ruiz, 322 555 0101');

const html = E.buildWalletCardHtml(full);
has('card escapes', html, 'Penicillin &lt;hives&gt;');
lacks('card escapes', html, '<hives>');
has('card', html, 'Tony (husband): 322 555 0100 (try first)');
has('card', html, 'Confirmed by the person on 2026-09-25. Printed 2026-09-26.');
has('card', html, 'Levothyroxine (75 mcg)');
has('card', html, "Hashimoto's");
check('card front before back', html.indexOf('DRUG ALLERGIES') < html.indexOf('TAKING NOW'), true);

const notice = E.lockScreenNotice(['bloodType', 'drugAllergies', 'contact'], full);
check('lock title', notice.title, 'In an emergency: Ana');
check('lock body in list order', notice.body, 'DRUG ALLERGIES: Penicillin <hives>\nCall Tony (husband): 322 555 0100\nBlood type: O+');
lacks('lock body picks only', notice.body, 'Levothyroxine');
check('parse parts', E.parseLockScreenParts('["contact","nonsense",3]'), ['contact']);
check('parse junk', E.parseLockScreenParts('{'), []);
check('parse null', E.parseLockScreenParts(null), []);
has('where android', E.medicalIdWhere('android'), 'Safety and emergency');
has('where ios', E.medicalIdWhere('ios'), 'Show When Locked');
has('warning', E.LOCK_SCREEN_WARNING, 'without unlocking');

// --- 6. Words --------------------------------------------------------------------
const words = [r.sentence, noPace.sentence, out.sentence, days, html, notice.body, E.LOCK_SCREEN_WARNING,
  E.medicalIdWhere('android'), E.medicalIdWhere('ios'), E.medicalIdWhere('other')].join(' ');
for (const bad of ['great job', 'well done', 'streak', 'score', 'you should stop', ' — ', ' – ', ' -- ', 'genuinely']) {
  lacks('words', words.toLowerCase(), bad);
}

console.log(`${checks - failures}/${checks} checks passed`);
process.exit(failures ? 1 : 0);
