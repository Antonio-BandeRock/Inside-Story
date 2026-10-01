// Checks lib/checkinFlow.ts, the one-step-at-a-time check-in (D8,
// 2026-09-30).
//
// 1. The steps run morning, feeling, flare, summary, and moving past either
//    end stays put.
// 2. Valence is worked out the way Home's Today's Check-In does it.
// 3. The morning energy carries into the feeling step only when the feeling
//    step has none of its own.
// 4. The summary names every step, says "Nothing entered." for a skipped
//    one, and says where a saved one went.
// 5. No word in the module scores, praises or keeps count.
//
// Exits non-zero on any failure.

/* global __dirname */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const file = path.join(__dirname, '..', 'lib', 'checkinFlow.ts');
const source = fs.readFileSync(file, 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});
const mod = { exports: {} };
new Function('exports', 'module', 'require', outputText)(mod.exports, mod, (name) => {
  throw new Error('lib/checkinFlow.ts must stay free of imports (asked for ' + name + ')');
});
const F = mod.exports;

let checks = 0;
let failures = 0;
function check(condition, label) {
  checks += 1;
  if (!condition) {
    failures += 1;
    console.error('FAIL: ' + label);
  }
}

// 1. Steps.
check(F.FLOW_STEPS.map((s) => s.key).join() === 'morning,feeling,flare,summary', 'the steps in order');
check(F.nextStep('morning') === 'feeling' && F.nextStep('flare') === 'summary', 'next moves on');
check(F.nextStep('summary') === 'summary', 'next from the summary stays there');
check(F.previousStep('morning') === 'morning' && F.previousStep('flare') === 'feeling', 'back moves back and stops at the start');
check(F.stepCaption('morning') === 'Step 1 of 3' && F.stepCaption('flare') === 'Step 3 of 3', 'the caption counts the three questions');
check(F.stepCaption('summary') === null, 'the summary has no step caption');

// 2. Valence.
const lean = { tired: 'negative', pain: 'negative', rested: 'positive' };
const leaningOf = (code) => lean[code];
check(F.valenceOfTags([], leaningOf) === 'neutral', 'nothing picked is neutral');
check(F.valenceOfTags(['tired', 'pain'], leaningOf) === 'negative', 'all negative is negative');
check(F.valenceOfTags(['rested'], leaningOf) === 'positive', 'all positive is positive');
check(F.valenceOfTags(['rested', 'tired'], leaningOf) === 'neutral', 'a mix is neutral');
check(F.valenceOfTags(['unknown'], leaningOf) === 'neutral', 'an unknown tag carries no leaning');

// 3. Energy.
check(F.carriedEnergy(null, 3) === 3, 'the morning energy carries over');
check(F.carriedEnergy(4, 3) === 4, 'the feeling step keeps its own');
check(F.carriedEnergy(null, null) === null, 'neither answered stays empty');

// 4. Summary.
const rows = F.summaryRows({
  morning: { saved: true, lines: ['Slept well.'] },
  feeling: { saved: false },
  flare: { saved: true, lines: [] },
});
check(rows.length === 3, 'one row per step asked');
check(rows[0].title === 'This Morning' && rows[0].where.includes('Home'), 'a saved step says where it went');
check(rows[1].lines.join() === 'Nothing entered.' && rows[1].where === null, 'a skipped step says nothing was entered');
check(rows[2].lines.join() === 'Answered.' && rows[2].where.includes('Signals'), 'a saved step with no words still reads');
check(F.flareLine('Moderate', null, []) === 'Moderate.', 'a flare line with only a step');
check(F.flareLine('Severe', 7, ['Headache']) === 'Severe, 7 out of 10, with Headache.', 'one symptom');
check(F.flareLine('Mild', null, ['A', 'B', 'C']) === 'Mild, with A, B and C.', 'several symptoms');

// 5. Words.
const code = source.replace(/^\s*\/\/.*$/gm, '');
for (const word of ['streak', 'score', 'well done', 'great job', 'in a row', 'missed', 'points', 'because', 'caused']) {
  check(!code.toLowerCase().includes(word), 'no "' + word + '" in the module');
}

console.log(`${checks - failures}/${checks} check-in flow checks passed`);
if (failures > 0) process.exit(1);
