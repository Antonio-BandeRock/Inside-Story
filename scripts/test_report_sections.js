// Checks K10 (choose the sections of a report), lib/reportKinds.ts
// (2026-09-29).
//
//  1. Every report's tick list is its core sections then its extras, in
//     the order the report carries them, each with a name.
//  2. What is left out is cleaned: unknown ids dropped, the report's order
//     kept, and never everything, since a report needs something in it.
//  3. The stored choice reads back, and anything unreadable is none.
//  4. The preface line counts what was left out without naming it, and
//     the button says how many sections are in.
//
// Run with: node scripts/test_report_sections.js

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

const R = load('lib/reportKinds.ts');

let checks = 0;
let failures = 0;
function same(a, b, label) {
  checks += 1;
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    failures += 1;
    console.error('FAIL: ' + label + '\n  got  ' + JSON.stringify(a) + '\n  want ' + JSON.stringify(b));
  }
}

// 1. The tick list
for (const def of R.REPORT_KINDS) {
  const ids = R.reportSectionChoices(def.key).map((choice) => choice.id);
  same(ids, [...def.core, ...def.extras], def.key + ': choices are core then extras, in order');
  same(R.reportSectionChoices(def.key).every((choice) => choice.label.length > 0), true, def.key + ': every choice named');
}
same(R.reportSectionChoices('r-doctor').find((c) => c.id === 'labs').label, 'Most recent lab results', 'a core section named as its heading');
same(R.reportSectionChoices('r-trainer').find((c) => c.id === 'nights').label, 'Nights', 'an extra named as its heading');

// 2. Cleaning
same(R.cleanLeftOut('r-doctor', ['labs', 'hydration', 'nonsense', 'glance']), ['glance', 'labs'], 'only this report\'s sections, in its order');
same(R.cleanLeftOut('r-medical-costs', ['bills', 'costs']), [], 'leaving everything out leaves nothing out');
same(R.cleanLeftOut('r-medical-costs', ['bills']), ['bills'], 'all but one is allowed');
same(R.cleanLeftOut('overview', []), [], 'nothing left out');

// 3. Stored
same(R.leftOutMetaKey('r-care'), 'report_left_out:r-care', 'one row per report');
same(R.parseLeftOut('r-care', '["meds","today","zzz"]'), ['meds', 'today'], 'the stored choice read back, cleaned');
same([R.parseLeftOut('r-care', null), R.parseLeftOut('r-care', ''), R.parseLeftOut('r-care', 'not json'), R.parseLeftOut('r-care', '{"x":1}')], [[], [], [], []], 'anything unreadable is none left out');

// 4. Words
same(R.leftOutPrefaceLine(0), null, 'no line when nothing was left out');
same(R.leftOutPrefaceLine(1), 'One section this report usually carries was left out of this copy by the person who shared it.', 'one section');
same(R.leftOutPrefaceLine(3), '3 sections this report usually carries were left out of this copy by the person who shared it.', 'several sections');
const total = R.reportSectionChoices('r-doctor').length;
same(R.sectionCountLabel('r-doctor', []), 'All ' + total + ' sections', 'all in');
same(R.sectionCountLabel('r-doctor', ['labs', 'meds']), (total - 2) + ' of ' + total + ' sections', 'some left out');
same(R.sectionCountLabel('r-variety', []), 'The one section', 'a report of one section');
const words = [R.leftOutPrefaceLine(1), R.leftOutPrefaceLine(4), ...Object.values(R.SECTION_LABELS)].join(' ');
same(/\b(real|genuine|genuinely|should|must|hide|hidden)\b/i.test(words), false, 'no filler, no instruction, nothing said to be hidden');
same(/[–—]/.test(words), false, 'no dashes');

console.log((failures === 0 ? 'PASS' : 'FAIL') + ' ' + (checks - failures) + '/' + checks);
process.exit(failures === 0 ? 0 : 1);
