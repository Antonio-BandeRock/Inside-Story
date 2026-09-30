// Checks K6 (What I have noticed in a report), lib/reportNoticed.ts
// (2026-09-29).
//
//  1. Every candidate is labelled a hypothesis and carries its count
//     against the flares and against any ordinary stretch.
//  2. The note says what the counts are measured against.
//  3. Empty and unreadable ranges say why, never a blank.
//  4. Experiments show only when their days touch the range, with the
//     one-run limit said once in the note rather than on every row.
//  5. No row claims a cause.
//
// Run with: node scripts/test_report_noticed.js

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

const N = load('lib/reportNoticed.ts');
const F = load('lib/foodExperiment.ts');

let checks = 0;
let failures = 0;
function ok(cond, label) {
  checks += 1;
  if (!cond) {
    failures += 1;
    console.error('FAIL: ' + label);
  }
}

const more = { beforeCount: 3, flaresWithMeals: 4, beforeShare: 0.75, usualCount: 5, usualWindows: 40, usualShare: 0.125, verdict: 'more' };
const same = { beforeCount: 2, flaresWithMeals: 4, beforeShare: 0.5, usualCount: 20, usualWindows: 40, usualShare: 0.5, verdict: 'same' };
const result = {
  totalSymptomInstances: 5,
  basis: { flares: 5, flaresWithMeals: 4, windowHours: 24, daysInRange: 30, daysWithMeals: 22 },
  context: ['Sleep was shorter than usual before 2 of the flares.'],
  foodCandidates: [{ kind: 'food', foodId: 1, source: 'USDA', foodName: 'Tomato', category: 'Veg', occurrenceCount: 3, comparison: more, delay: { medianHours: 5.2, count: 3 } }],
  dimensionCandidates: [{ kind: 'dimension', conditionCode: 'ibs', conditionName: 'IBS', dimension: 'D2', subCriterion: 'FODMAP', tier: 'High', occurrenceCount: 2, comparison: same }],
  categoryCandidates: [{ kind: 'category', category: 'Nightshades', occurrenceCount: 3, comparison: more }],
};

// 1. Candidates
const section = N.noticedSection(result);
ok(section.heading === 'What I have noticed', 'heading');
const candidateRows = section.rows.filter((row) => row.startsWith('Hypothesis: '));
ok(candidateRows.length === 3, 'one hypothesis row per candidate, got ' + candidateRows.length);
ok(candidateRows[0].includes('Tomato') && candidateRows[0].includes('3 of the 4') && candidateRows[0].includes('13% of any 24-hour stretch'), 'food row carries both counts: ' + candidateRows[0]);
ok(candidateRows[0].includes('median of 5 hours'), 'food row carries its delay');
ok(candidateRows[1].includes('relevant to IBS') && candidateRows[1].includes('says little'), 'dimension row names its condition and its same verdict: ' + candidateRows[1]);
ok(candidateRows[2].startsWith('Hypothesis: foods in Nightshades.'), 'category row');
ok(section.rows.some((row) => row.startsWith('Around the same flares: Sleep')), 'context lines carried');
ok(section.rows[section.rows.length - 1].includes('none of them is shown as the explanation'), 'context caveat last');

// 2. Note
ok(section.note.includes('hypothesis') && section.note.includes('Based on 5 flares and reactions, 4 of them'), 'note says what was counted: ' + section.note);
ok(section.note.includes('Two can be chance'), 'note carries the threshold sentence');

// 3. Empty and unreadable
ok(N.noticedSection(null).empty === 'Could not be read for this report.', 'unreadable');
ok(N.noticedSection({ ...result, totalSymptomInstances: 0 }).empty.includes('No flares or reactions'), 'no flares');
const none = N.noticedSection({ ...result, foodCandidates: [], dimensionCandidates: [], categoryCandidates: [] });
ok(none.rows.length === 0 && none.empty.includes('Nothing was eaten before 2 or more') && none.empty.includes('Based on 5'), 'nothing noticed still says what was counted');
ok(none.rows.length === 0 && !none.rows.some((row) => row.startsWith('Around')), 'no context rows without candidates');

// 4. Experiments
const input = { removalStartedOn: '2026-09-01', removalDays: 14, returnedOn: '2026-09-15', observationDays: 3, today: '2026-09-29', eventDates: ['2026-08-20', '2026-08-25', '2026-09-16'], eatenDates: [], measure: null };
const lines = F.experimentResultLines(input);
const finished = { foodName: 'Wheat bread', status: 'cleared', removalStartedOn: '2026-09-01', removalDays: 14, returnedOn: '2026-09-15', observationDays: 3, lines };
const old = { ...finished, foodName: 'Milk', removalStartedOn: '2026-05-01', returnedOn: '2026-05-15' };
const ongoing = { ...finished, foodName: 'Eggs', status: 'waiting', removalStartedOn: '2026-09-20', returnedOn: null, lines: F.experimentResultLines({ ...input, removalStartedOn: '2026-09-20', returnedOn: null }) };
const exp = N.experimentsSection([ongoing, old, finished], '2026-08-31', '2026-09-29');
ok(exp.rows.length === 2, 'an experiment outside the range is left out, got ' + exp.rows.length);
ok(exp.rows[0].startsWith('Wheat bread, left out from 2026-09-01, finished.'), 'sorted by start, stage said: ' + exp.rows[0]);
ok(exp.rows[0].includes('Before (14 days): 2 flares and reactions logged.') && exp.rows[0].includes('Back (3 days): 1 flare or reaction logged.'), 'periods carried');
ok(exp.rows[1].includes('Eggs') && exp.rows[1].includes('still being left out'), 'ongoing experiment: ' + exp.rows[1]);
ok(exp.rows.every((row) => !row.includes(F.EXPERIMENT_LIMIT)) && exp.note.includes(F.EXPERIMENT_LIMIT), 'limit said once, in the note');
ok(N.experimentsSection([], '2026-08-31', '2026-09-29').empty.startsWith('No food was left out'), 'no experiments');
ok(N.experimentsSection(null, '2026-08-31', '2026-09-29').empty === 'Could not be read for this report.', 'unreadable experiments');
ok(N.experimentInRange({ ...old, removalStartedOn: '2026-09-10', returnedOn: null }, '2026-08-31', '2026-09-29'), 'ongoing inside range');
ok(!N.experimentInRange({ ...old, removalStartedOn: '2026-10-20', returnedOn: null }, '2026-08-31', '2026-09-29'), 'starts after range');
ok(N.experimentInRange({ ...old, removalStartedOn: '2026-10-05', removalDays: 14, returnedOn: null }, '2026-08-31', '2026-09-29'), 'before period reaches into range');

// 5. No verdicts
const all = [section.note, ...section.rows, exp.note, ...exp.rows].join(' ');
for (const word of ['causes', 'caused by', 'trigger', 'intoleran', 'allergic to', 'you should', 'proves', 'confirmed']) {
  ok(!all.toLowerCase().includes(word), 'no verdict word: ' + word);
}

console.log((failures === 0 ? 'PASS' : 'FAIL') + ' ' + (checks - failures) + '/' + checks);
process.exit(failures === 0 ? 0 : 1);
