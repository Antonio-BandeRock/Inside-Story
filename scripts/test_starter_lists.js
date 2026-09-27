// Checks lib/starterLists.ts (C13 of the competitive build plan, Phase 2,
// 2026-09-26): every starter is well formed, no copy doubles up on a name
// already held, and none of the words carries a verdict or a dash. Exits
// non-zero on any failure.

// eslint-config-expo lints this repo as app code, which has no __dirname.
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
    throw new Error(`${relPath} must stay free of runtime imports (${name})`);
  });
  return module.exports;
}

const s = load('lib/starterLists.ts');

let failures = 0;
let total = 0;
function check(name, actual, expected) {
  total += 1;
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    failures += 1;
    console.log(`FAIL  ${name}\n      expected ${e}\n      got      ${a}`);
  }
}

const OCCASIONS = ['morning', 'bedtime', 'leaving', 'other'];
const FORBIDDEN = /\b(streak|great job|well done|good job|failed|missed|behind|lazy|should have|real|genuine|genuinely|score|must|%)\b|[–—]| -- /i;

const routineKeys = new Set();
for (const r of s.STARTER_ROUTINES) {
  check(`${r.key}: key once`, routineKeys.has(r.key), false);
  routineKeys.add(r.key);
  check(`${r.key}: occasion is built in`, OCCASIONS.includes(r.occasion), true);
  check(`${r.key}: has steps`, r.steps.length >= 3, true);
  check(`${r.key}: steps differ`, new Set(r.steps).size, r.steps.length);
  for (const line of [r.name, r.about, ...r.steps]) check(`no verdict words: ${line}`, FORBIDDEN.test(line), false);
}
check('the hard starts are there', ['taxes', 'moving', 'doctorVisit', 'oneRoom'].every((k) => routineKeys.has(k)), true);

const upkeepKeys = new Set();
for (const group of s.STARTER_UPKEEP) {
  for (const item of group.items) {
    check(`${item.key}: key once`, upkeepKeys.has(item.key), false);
    upkeepKeys.add(item.key);
    check(`${item.key}: whole months`, Number.isInteger(item.intervalMonths) && item.intervalMonths > 0, true);
    for (const line of [item.name, item.notes ?? '']) check(`no verdict words: ${line}`, FORBIDDEN.test(line), false);
  }
}
check('kitchen and bathroom', s.STARTER_UPKEEP.map((g) => g.key), ['kitchen', 'bathroom']);

check('held matches without case', s.upkeepAlreadyHeld('Descale the kettle', ['descale the KETTLE ']), true);
check('not held', s.upkeepAlreadyHeld('Descale the kettle', ['Clean the oven']), false);
check('free name stays', s.freeRoutineName('Moving house', ['Morning']), 'Moving house');
check('free name counts on', s.freeRoutineName('Moving house', ['moving house', 'Moving house 2']), 'Moving house 3');

console.log(failures === 0 ? `All ${total} checks passed` : `\n${failures} of ${total} checks failed`);
process.exit(failures === 0 ? 0 : 1);
