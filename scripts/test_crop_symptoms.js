// Checks lib/cropSymptoms.ts (I26): every crop problem is tagged with at
// least one known symptom and every tag names a problem that exists, and
// no symptom carries a reading of its own across crops.
//   node scripts/test_crop_symptoms.js

/* global __dirname */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function read(rel) {
  return fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
}
const cache = {};
function run(rel) {
  if (cache[rel]) return cache[rel];
  const js = ts.transpileModule(read(rel), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 } }).outputText;
  const mod = { exports: {} };
  cache[rel] = mod.exports;
  new Function('module', 'exports', 'require', js)(mod, mod.exports, (name) => {
    const base = name.replace(/^\.\//, 'lib/');
    return /^lib\//.test(base) ? run(base + '.ts') : {};
  });
  cache[rel] = mod.exports;
  return mod.exports;
}

let failures = 0;
let passes = 0;
function check(name, ok, detail) {
  if (ok) passes += 1;
  else {
    failures += 1;
    console.log('FAIL ' + name + (detail ? '\n     ' + detail : ''));
  }
}

const cs = run('lib/cropSymptoms.ts');
const { CROP_PROBLEMS } = run('lib/cropProblems.ts');
const { CROP_GUIDES } = run('lib/cropGuides.ts');
const keys = new Set(cs.SYMPTOMS.map((s) => s.key));

// 1. Every problem tagged, every tag real.
let problemCount = 0;
for (const [crop, problems] of Object.entries(CROP_PROBLEMS)) {
  const tags = cs.CROP_PROBLEM_SYMPTOMS[crop] || {};
  for (const problem of problems) {
    problemCount += 1;
    const list = tags[problem.label];
    check(`${crop} "${problem.label}" tagged`, Array.isArray(list) && list.length > 0);
    for (const tag of list || []) check(`${crop} "${problem.label}" tag ${tag} known`, keys.has(tag));
  }
  for (const label of Object.keys(tags)) {
    check(`${crop} tag "${label}" names a problem`, problems.some((p) => p.label === label));
  }
}
for (const crop of Object.keys(cs.CROP_PROBLEM_SYMPTOMS)) check(`${crop} is a crop with problems`, !!CROP_PROBLEMS[crop]);
check('every crop guide has problems tagged', CROP_GUIDES.every((g) => !!cs.CROP_PROBLEM_SYMPTOMS[g.key]));

// 2. No cross-crop reading of a symptom (removed 2026-09-29; a symptom's
// meaning comes only from lib/cropSigns.ts, crop by crop).
check('no generic reading', cs.SYMPTOMS.every((sym) => Object.keys(sym).sort().join() === 'key,label,phrase'));
check('no cross-crop helpers', !cs.symptomHeading && !cs.cropsWithSymptom && !cs.symptomSources && !cs.SYMPTOM_GUIDE_INTRO);

// 3. Wording.
const words = cs.SYMPTOMS.flatMap((sym) => [sym.label, sym.phrase]).join(' ');
for (const banned of [' real ', 'genuine', '\u2014', '\u2013', ' -- ']) {
  check(`wording free of ${JSON.stringify(banned)}`, !words.toLowerCase().includes(banned.toLowerCase()));
}
check('no colon in a label', cs.SYMPTOMS.every((sym) => !sym.label.includes(':')));
check('no service called', !/fetch\(|apiKey|api-key/i.test(read('lib/cropSymptoms.ts')));

console.log(`${problemCount} crop problems; ${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
