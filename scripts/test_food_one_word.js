// Runs the one phrase shown for a food against the person's profile
// (lib/foodOneWord.ts, G15, 2026-09-27).
//
// The rules checked:
//
//  1. Nothing flagged reads "Fits all your conditions", or names the one
//     condition when only one is tracked.
//  2. An allergy outranks everything else.
//  3. Cautions are counted in words, never shown as a score.
//  4. A condition with no safe verdict and no caution reads as not suited.
//  5. The phrases carry no dashes, no digits and no verdict words.
//
// Run with: node scripts/test_food_one_word.js
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

const { foodOneWord } = loadModule('lib/foodOneWord.ts');

let failures = 0;
function check(label, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    failures++;
    console.log(`FAIL ${label}\n  expected ${e}\n  got      ${a}`);
  }
}

const HASH = { code: 'HASH', name: "Hashimoto's" };
const IBS = { code: 'IBS', name: 'IBS' };
const CEL = { code: 'CEL', name: 'Celiac' };
const base = { trackedConditions: [HASH, IBS], safeForConditions: ['HASH', 'IBS'], conditionCautions: {}, dietViolations: [], allergyMatch: null };

const cases = [
  ['all fit', base, { phrase: 'Fits all your conditions', tone: 'fits' }],
  ['one condition', { ...base, trackedConditions: [IBS], safeForConditions: ['IBS'] }, { phrase: 'Fits IBS', tone: 'fits' }],
  ['diet only', { ...base, trackedConditions: [], safeForConditions: [] }, { phrase: 'Fits your eating style', tone: 'fits' }],
  ['allergy wins', { ...base, allergyMatch: 'peanut', dietViolations: ['Vegan'] }, { phrase: 'Contains one of your allergies', tone: 'stop' }],
  [
    'one yellow caution',
    { ...base, safeForConditions: ['HASH'], conditionCautions: { IBS: { severity: 'yellow', note: 'x' } } },
    { phrase: 'One caution', tone: 'caution' },
  ],
  [
    'two cautions, one red',
    {
      ...base,
      safeForConditions: [],
      conditionCautions: { IBS: { severity: 'yellow', note: 'x' }, HASH: { severity: 'red', note: 'y' } },
    },
    { phrase: 'Two cautions', tone: 'stop' },
  ],
  [
    'not suited plus diet',
    { ...base, trackedConditions: [HASH, CEL], safeForConditions: ['HASH'], dietViolations: ['Paleo'] },
    { phrase: 'Not suited to Celiac and outside your eating style', tone: 'stop' },
  ],
  [
    'three parts',
    {
      ...base,
      trackedConditions: [HASH, IBS, CEL],
      safeForConditions: [],
      conditionCautions: { IBS: { severity: 'yellow', note: 'x' } },
      dietViolations: ['Vegan'],
    },
    { phrase: 'Not suited to two of your conditions, one caution and outside your eating style', tone: 'stop' },
  ],
  ['diet miss only', { ...base, dietViolations: ['Vegan'] }, { phrase: 'Outside your eating style', tone: 'caution' }],
];

const FORBIDDEN = /\b(good|bad|best|worst|healthy|unhealthy|should|clean|safe|real|genuine|genuinely|score)\b|[–—]| -- |\d/i;
for (const [label, input, expected] of cases) {
  const result = foodOneWord(input);
  check(label, result, expected);
  if (FORBIDDEN.test(result.phrase)) {
    failures++;
    console.log(`FAIL phrase: ${result.phrase}`);
  }
}

if (failures) {
  console.log(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log('food one word: all checks passed');
