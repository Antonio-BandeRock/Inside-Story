// Checks lib/standardQuestionnaires.ts, the published scales in the
// check-in (D13, 2026-09-30).
//
// 1. Every scale has the item count and maximum its authors published.
// 2. Each band boundary lands where the published table puts it.
// 3. A partial answer sheet gets no score and no band.
// 4. PEG is an average, MFIS-5 a sum, and neither names a band.
// 5. Any answer above "Not at all" on PHQ-9 item 9 brings the safety line,
//    which never says something is or is not an emergency.
// 6. The stored choice round-trips and ignores what it does not know.
// 7. No word in the module judges a score or claims a diagnosis.
//
// Exits non-zero on any failure.

/* global __dirname */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const file = path.join(__dirname, '..', 'lib', 'standardQuestionnaires.ts');
const source = fs.readFileSync(file, 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});
const mod = { exports: {} };
new Function('exports', 'module', 'require', outputText)(mod.exports, mod, (name) => {
  throw new Error('lib/standardQuestionnaires.ts must stay free of imports (asked for ' + name + ')');
});
const Q = mod.exports;

let checks = 0;
let failures = 0;
function check(condition, label) {
  checks += 1;
  if (!condition) {
    failures += 1;
    console.error('FAIL: ' + label);
  }
}

const scored = (q) => q.items.filter((i) => i.scored);
// Answers that add up to `total`, spread over the scored items.
function sheet(q, total) {
  const items = scored(q);
  const top = q.scale[q.scale.length - 1].value;
  let left = total;
  return items.map((item) => {
    const v = Math.min(top, left);
    left -= v;
    return { itemCode: item.code, value: v };
  });
}

// 1. Shapes.
const phq = Q.questionnaire('phq9');
const gad = Q.questionnaire('gad7');
const mfis = Q.questionnaire('mfis5');
const peg = Q.questionnaire('peg');
check(scored(phq).length === 9 && phq.maxScore === 27, 'PHQ-9 has 9 scored items, max 27');
check(scored(gad).length === 7 && gad.maxScore === 21, 'GAD-7 has 7 scored items, max 21');
check(scored(mfis).length === 5 && mfis.maxScore === 20, 'MFIS-5 has 5 items, max 20');
check(scored(peg).length === 3 && peg.maxScore === 10, 'PEG has 3 items');
check(mfis.items.map((i) => i.code).join() === 'mfis5_1,mfis5_9,mfis5_10,mfis5_17,mfis5_19', 'MFIS-5 is items 1, 9, 10, 17, 19');
check(phq.scale.length === 4 && phq.scale[3].label === 'Nearly every day', 'the four published answers');
check(Q.QUESTIONNAIRES.every((q) => q.source.length > 20), 'every scale names its source');
check(phq.source.includes('No permission required') && gad.source.includes('No permission required'), 'Pfizer statement carried');
const codes = Q.QUESTIONNAIRES.flatMap((q) => q.items.map((i) => i.code));
check(new Set(codes).size === codes.length, 'item codes are unique');
check(Q.questionnaireForItem('gad7_4') === gad && Q.questionnaireForItem('hypo_fatigue') === null, 'questionnaireForItem');

// 2. Bands.
const bandAt = (q, total) => Q.scoreQuestionnaire(q, sheet(q, total)).band?.label;
for (const [total, label] of [[0, 'minimal'], [4, 'minimal'], [5, 'mild'], [9, 'mild'], [10, 'moderate'], [14, 'moderate'], [15, 'moderately severe'], [19, 'moderately severe'], [20, 'severe'], [27, 'severe']]) {
  check(bandAt(phq, total) === label, `PHQ-9 ${total} is ${label}`);
}
for (const [total, label] of [[4, 'minimal'], [5, 'mild'], [10, 'moderate'], [15, 'severe'], [21, 'severe']]) {
  check(bandAt(gad, total) === label, `GAD-7 ${total} is ${label}`);
}
check(
  Q.scoreLine(phq, Q.scoreQuestionnaire(phq, sheet(phq, 12))) ===
    "Score 12 out of 27, in the band the scale's authors call moderate (10 to 14).",
  'PHQ-9 score line',
);

// 3. Partial.
const partial = Q.scoreQuestionnaire(phq, sheet(phq, 6).slice(0, 5));
check(partial.score === null && partial.band === null && partial.answered === 5, 'partial sheet has no score');
check(Q.scoreLine(phq, partial) === '5 of 9 answered. A score is worked out once all 9 are answered.', 'partial line');
check(Q.hasAnswers(phq, partial ? sheet(phq, 1) : []) && !Q.hasAnswers(gad, sheet(phq, 1)), 'hasAnswers');

// 4. Average and sum without bands.
const pegScore = Q.scoreQuestionnaire(peg, [
  { itemCode: 'peg_pain', value: 6 },
  { itemCode: 'peg_enjoyment', value: 4 },
  { itemCode: 'peg_activity', value: 5 },
]);
check(pegScore.score === 5 && pegScore.band === null, 'PEG averages');
check(Q.scoreLine(peg, pegScore) === 'Average 5.0 out of 10. Higher means more pain, or pain getting in the way more.', 'PEG line');
const mfisScore = Q.scoreQuestionnaire(mfis, sheet(mfis, 11));
check(mfisScore.score === 11 && mfisScore.band === null, 'MFIS-5 sums');
check(Q.bandNote(mfis).includes('no published bands'), 'no bands said plainly');
check(Q.bandNote(phq).includes('not a diagnosis') && Q.bandNote(phq).includes('clinician'), 'band note');
check(Q.lastTimeLine(phq, { score: 12, on: 'Sep 2, 2026' }) === 'Last time, on Sep 2, 2026: 12 out of 27.', 'last time');
check(Q.lastTimeLine(phq, null) === null, 'no last time');

// Difficulty item.
const withDifficulty = [...sheet(phq, 3), { itemCode: 'phq9_difficulty', value: 1 }];
check(Q.scoreQuestionnaire(phq, withDifficulty).difficulty === 'Somewhat difficult', 'difficulty is unscored words');
check(Q.scoreQuestionnaire(phq, withDifficulty).score === 3, 'difficulty adds nothing to the score');

// 5. Safety.
check(Q.needsSafetyLine([{ itemCode: 'phq9_9', value: 1 }]), 'item 9 above zero');
check(!Q.needsSafetyLine([{ itemCode: 'phq9_9', value: 0 }]), 'item 9 at zero');
check(/emergency number/.test(Q.SAFETY_LINE) && !/not an emergency|nothing to worry/i.test(Q.SAFETY_LINE), 'safety line wording');
check(Q.HELPLINE_URL.startsWith('https://'), 'helpline link');

// 6. Stored choice.
check(Q.parseChosen('peg,phq9,nonsense') .join() === 'phq9,peg', 'parse keeps list order and drops unknown');
check(Q.parseChosen(null).length === 0, 'nothing stored, nothing chosen');
check(Q.serializeChosen(['gad7', 'phq9']) === 'phq9,gad7', 'serialize');

// 7. Words.
const code = source.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*\*[\s\S]*?\*\//g, '');
for (const word of ['better', 'worse', 'improv', 'progress', 'normal', 'healthy', 'diagnosed', 'you have depression', 'you have anxiety', 'streak']) {
  // "better off dead" is the PHQ-9's published item 9 wording.
  const scan = code.replace(/better off dead/g, '');
  check(!new RegExp('\\b' + word, 'i').test(scan), 'no "' + word + '" in the module');
}

console.log(`${checks - failures}/${checks} standard questionnaire checks passed`);
if (failures > 0) process.exit(1);
