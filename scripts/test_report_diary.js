// Checks K9 (the food and symptom diary in the Nutritionist report),
// lib/reportDiary.ts (2026-09-29).
//
//  1. One row a day with something logged: meals with time, type, name and
//     foods; flares and reactions with time, severity, food and symptoms.
//  2. A run of empty days is one "Nothing logged" row, a single empty day
//     is named on its own, and a day with only one side says so.
//  3. Nothing at all gives the empty sentence; a failed read says so.
//  4. No verdict or cause words in what the section writes.
//
// Run with: node scripts/test_report_diary.js

/* global __dirname */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const ROOT = path.join(__dirname, '..');
const cache = {};
function load(relPath) {
  if (cache[relPath]) return cache[relPath].exports;
  const source = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  cache[relPath] = module;
  const dir = path.dirname(relPath);
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    if (!name.startsWith('.')) return {};
    if (name === './db') throw new Error(relPath + ' reaches the database');
    return load(path.join(dir, name + '.ts').replace(/\\/g, '/'));
  });
  return module.exports;
}

const D = load('lib/reportDiary.ts');

let checks = 0;
let failures = 0;
function same(a, b, label) {
  checks += 1;
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    failures += 1;
    console.error('FAIL: ' + label + '\n  got  ' + JSON.stringify(a) + '\n  want ' + JSON.stringify(b));
  }
}

const meal = (id, at, type, name, foods) => ({ id, eatenAt: at, mealType: type, name, foods });
const flare = (at, severity, symptoms, notes) => ({ loggedAt: at, kind: 'flare', severity, food: null, symptoms, notes: notes || null });
const reaction = (at, severity, food, symptoms) => ({ loggedAt: at, kind: 'post_meal', severity, food, symptoms, notes: null });

const meals = [
  meal('b', '2026-09-01T19:00', 'dinner', 'Dinner', ['Salmon', 'Rice', 'rice']),
  meal('a', '2026-09-01T08:10', 'breakfast', 'Oat porridge', ['Oats', 'Blueberries', 'Milk']),
  meal('c', '2026-09-06T12:30', 'lunch', 'Soup', []),
];
const checkins = [
  reaction('2026-09-01T09:30', 2, 'Oat porridge', ['Bloating', 'Cramps']),
  flare('2026-09-03T07:00', 4, ['Fatigue'], '  woke   tired '),
];

const section = D.diarySection(meals, checkins, '2026-09-01', '2026-09-07');
same(section.columns, D.DIARY_COLUMNS, 'columns');

// 1
same(section.rows[0], [
  'Tue Sep 1, 2026',
  '08:10 Breakfast, Oat porridge: Oats, Blueberries, Milk; 19:00 Dinner: Salmon, Rice',
  '09:30 Reaction (moderate) after Oat porridge: Bloating, Cramps',
], 'a full day, meals in time order, a repeated food once, a name that only repeats its type left off');

// 2
same(section.rows[1], ['Wed Sep 2, 2026', 'Nothing logged', ''], 'one empty day named alone');
same(section.rows[2], ['Thu Sep 3, 2026', 'No meals logged', '07:00 Flare (severe): Fatigue. Note: woke tired'], 'a flare with no meals');
same(section.rows[3], ['Fri Sep 4, 2026 to Sat Sep 5, 2026', 'Nothing logged', ''], 'two empty days are one row');
same(section.rows[4], ['Sun Sep 6, 2026', '12:30 Lunch, Soup', 'None logged'], 'a meal with no foods, no reactions');
same(section.rows[5], ['Mon Sep 7, 2026', 'Nothing logged', ''], 'an empty last day closes the range');
same(section.rows.length, 6, 'six rows for seven days');

const many = Array.from({ length: 13 }, (_, i) => 'Food ' + i);
same(D.describeMeal(meal('x', '2026-09-01T10:00', 'snack', '', many)), '10:00 Snack: Food 0, Food 1, Food 2, Food 3, Food 4, Food 5, Food 6, Food 7, Food 8, Food 9 and 3 more', 'long meals counted past ten');
same(D.describeCheckin({ loggedAt: '2026-09-01T10:00', kind: 'post_meal', severity: null, food: null, symptoms: [], notes: 'x'.repeat(150) }).length < 130, true, 'a long note is shortened');
same(D.daysBetween('2026-10-30', '2026-11-02'), ['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02'], 'days across a month end and a clock change');

// 3
const none = D.diarySection([], [], '2026-09-01', '2026-09-07');
same([none.rows.length, none.empty], [0, D.DIARY_EMPTY], 'nothing at all');
same(D.diarySection([meal('z', '2026-08-01T08:00', 'breakfast', 'Eggs', [])], [], '2026-09-01', '2026-09-07').rows.length, 0, 'a meal outside the range is not counted');
same(D.diarySection(null, [], '2026-09-01', '2026-09-07').empty, 'Could not be read for this report.', 'a failed read says so');

// 4
const words = [D.DIARY_NOTE, D.DIARY_EMPTY, ...section.rows.flat()].join(' ');
same(/\b(caused by|because of|triggered|trigger|abnormal|ideal|optimal|healthy|unhealthy|good|bad|should|real|genuine|genuinely)\b/i.test(words), false, 'no verdict, cause or filler words');

console.log((failures === 0 ? 'PASS' : 'FAIL') + ' ' + (checks - failures) + '/' + checks);
process.exit(failures === 0 ? 0 : 1);
