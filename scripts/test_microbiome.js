// Checks lib/microbiome.ts (G30): a microbiome report read into rows the
// person confirms, the same result followed across tests in the units
// printed, the food log set beside each sample, and every sentence swept
// for words that would grade a result.
// Run: node scripts/test_microbiome.js
const fs = require('fs');
/* global __dirname */
const path = require('path');
const ts = require('typescript');

function load(file, deps) {
  const src = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', out.outputText)(mod, mod.exports, (name) => {
    if (deps[name]) return deps[name];
    throw new Error(`${file} imported ${name}, which this test does not allow`);
  });
  return mod.exports;
}

const lab = load('lib/labImport.ts', {});
const mb = load('lib/microbiome.ts', { './labImport': lab });

let failures = 0;
function ok(label, condition, detail) {
  if (!condition) {
    failures++;
    console.log(`FAIL ${label}${detail ? `\n  ${detail}` : ''}`);
  }
}
const sentences = [];
const say = (text) => {
  if (text) sentences.push(text);
  return text;
};

// --- Reading a report ------------------------------------------------------
const report = [
  'Sample collected: 14 Aug 2026',
  'Bacteria',
  'Akkermansia muciniphila 2.4 % 0.5 - 5.0',
  'Faecalibacterium prausnitzii 0.8 % 3 - 15 Low',
  'Bifidobacterium',
  '1.2',
  'Yeast and fungi',
  'Candida albicans: Not detected',
  'Calprotectin 35 ug/g <50',
].join('\n');
const drafts = mb.draftsFromText(report);
const named = (n) => drafts.find((d) => d.name === n);
ok('five rows read', drafts.length === 5, JSON.stringify(drafts.map((d) => d.name)));
const akk = named('Akkermansia muciniphila');
ok('Akkermansia read', akk && akk.valueText === '2.4' && akk.unit === '%' && akk.low === '0.5' && akk.high === '5', JSON.stringify(akk));
ok('Akkermansia under Bacteria', akk && akk.groupName === 'Bacteria', akk && akk.groupName);
ok('rows read wait to be confirmed', drafts.every((d) => d.source === 'read' && d.confirmed === false));
const fp = named('Faecalibacterium prausnitzii');
ok('printed flag kept as the report word', fp && /low/i.test(fp.flag), fp && fp.flag);
const bif = named('Bifidobacterium');
ok('a name and its number on two lines are joined', bif && bif.valueText === '1.2', JSON.stringify(bif));
const can = named('Candida albicans');
ok('a word result is kept as printed', can && can.valueText === 'Not detected' && can.groupName === 'Yeast and fungi', JSON.stringify(can));
const cal = named('Calprotectin');
ok('an upper-only range is read', cal && cal.high === '50' && cal.unit === 'ug/g', JSON.stringify(cal));

const date = mb.findSampleDate(report);
ok('sample date found', date.kind === 'found' && date.date === '2026-08-14', JSON.stringify(date));
say(mb.describeSampleDate(date));
say(mb.describeSampleDate({ kind: 'ambiguous', printed: '03/04/2026' }));
ok('ambiguous date not guessed', /could be/.test(mb.describeSampleDate({ kind: 'ambiguous', printed: '03/04/2026' })));

// --- Saving ----------------------------------------------------------------
ok('nothing saves until confirmed', mb.savesFromDrafts(drafts).length === 0);
const confirmed = drafts.map((d) => ({ ...d, confirmed: true }));
const saves = mb.savesFromDrafts(confirmed);
ok('all confirmed rows save', saves.length === 5);
const savedCan = saves.find((s) => s.name === 'Candida albicans');
ok('a word result saves with no number', savedCan && savedCan.value === null && savedCan.valueText === 'Not detected');
ok('a number saves its value', saves.find((s) => s.name === 'Akkermansia muciniphila').value === 2.4);
const lessThan = mb.savesFromDrafts([{ ...mb.blankDraft(), name: 'Clostridioides difficile toxin', valueText: '<0.01' }]);
ok('a < value keeps its text and number', lessThan[0].valueText === '<0.01' && lessThan[0].value === 0.01, JSON.stringify(lessThan));
ok('a typed row needs a name', mb.draftProblem({ ...mb.blankDraft(), valueText: '1' }) !== null);
ok('a typed row needs a result', mb.draftProblem({ ...mb.blankDraft(), name: 'x' }) !== null);
ok('range must run low to high', mb.draftProblem({ ...mb.blankDraft(), name: 'x', valueText: '1', low: '5', high: '2' }) !== null);
for (const d of [mb.blankDraft(), { ...mb.blankDraft(), valueText: '1' }, { ...mb.blankDraft(), name: 'x', valueText: '1', low: 'a' }]) say(mb.draftProblem(d));
say(mb.describeReadRows(drafts));
say(mb.describeReadRows(drafts.slice(0, 1)));
say(mb.describeUnsaved(drafts));
say(mb.describeUnsaved(drafts.slice(0, 1)));
for (const editing of [false, true]) for (const set of [[], confirmed.slice(0, 1), confirmed]) say(mb.describeSaveButton(set, editing));

// --- Open lists ------------------------------------------------------------
const kinds = mb.choicesFrom(mb.BUILT_IN_KINDS, ['stool analysis', 'Organic acids  test', '']);
ok('a used value matching a built-in is not repeated', kinds.filter((k) => k.toLowerCase() === 'stool analysis').length === 1, JSON.stringify(kinds));
ok('a new value is offered, tidied', kinds.includes('Organic acids test'));
ok('choices are alphabetical', kinds.join('|') === [...kinds].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })).join('|'));

// --- One test's rows -------------------------------------------------------
const R = (testId, name, valueText, unit, extra = {}) => ({
  id: `${testId}_${name}`,
  testId,
  groupName: '',
  name,
  valueText,
  value: Number.isFinite(Number(valueText)) ? Number(valueText) : null,
  unit,
  low: null,
  high: null,
  printedFlag: null,
  sortOrder: 0,
  ...extra,
});
const groups = mb.groupResults([R('a', 'One', '1', '%', { groupName: 'Bacteria', sortOrder: 1 }), R('a', 'Two', '2', '%', { sortOrder: 0 })]);
ok('rows without a group go under the no-group heading', groups.some((g) => g.groupName === mb.NO_GROUP));
const described = say(mb.describeResult(R('a', 'F', '0.8', '%', { low: 3, high: 15, printedFlag: 'Low' })));
ok('a printed flag is attributed to the report', /marked Low on the report/.test(described), described);
say(mb.describeResult(R('a', 'F', 'Not detected', '')));
say(mb.describeResult(R('a', 'F', '35', 'ug/g', { high: 50 })));
say(mb.describeResult(R('a', 'F', '35', 'ug/g', { low: 2 })));

// --- Across tests ----------------------------------------------------------
const tests = [
  { id: 'a', sampledOn: '2026-02-01', provider: 'ZOE', kind: '', note: null },
  { id: 'b', sampledOn: '2026-08-14', provider: 'ZOE', kind: '', note: null },
  { id: 'c', sampledOn: '2026-09-20', provider: 'Viome', kind: '', note: null },
];
const across = mb.acrossTests(tests, [
  R('b', 'Akkermansia muciniphila', '2.4', '%'),
  R('a', 'akkermansia  muciniphila', '1.1', '%'),
  R('a', 'Shannon diversity', '3.1', ''),
  R('b', 'Bifidobacterium', '1.2', '%'),
  R('c', 'Bifidobacterium', '12000', 'reads'),
  R('c', 'Only once', '1', ''),
]);
ok('only names on two or more tests', across.length === 2 && !across.some((a) => a.name === 'Only once' || a.name === 'Shannon diversity'), JSON.stringify(across.map((a) => a.name)));
const akkAcross = across.find((a) => /akkermansia/i.test(a.name));
ok('matched ignoring case and spacing, oldest first', akkAcross && akkAcross.units[0].points.map((p) => p.valueText).join(',') === '1.1,2.4', JSON.stringify(akkAcross));
ok('same company, no comparability note', akkAcross && !akkAcross.providersDiffer && akkAcross.notes.length === 0);
const bifAcross = across.find((a) => a.name === 'Bifidobacterium');
ok('different units stay apart, none converted', bifAcross && bifAcross.units.length === 2);
ok('different companies are said to be not compared', bifAcross && bifAcross.providersDiffer && bifAcross.notes.includes(mb.DIFFERENT_COMPANIES_NOTE));
ok('different units are said', bifAcross && bifAcross.notes.includes(mb.DIFFERENT_UNITS_NOTE));
for (const a of across) {
  say(a.line);
  a.notes.forEach(say);
}

// --- Eating before ---------------------------------------------------------
const none = say(mb.describeEatingBefore(null));
ok('nothing logged reads as a gap, never as zero plants', /No meals are logged/.test(none) && !/\b0\b/.test(none), none);
say(mb.describeEatingBefore({ plants: 0, gutFoods: 0, fermentedEntries: 0, daysLogged: 0 }));
const some = say(mb.describeEatingBefore({ plants: 31, gutFoods: 1, fermentedEntries: 6, daysLogged: 20 }));
ok('eating before names its counts and days', /31 different plants/.test(some) && /1 gut-feeding food\b/.test(some) && /20 of the 28 days/.test(some), some);
say(mb.EATING_BEFORE_NOTE);
ok('the eating line is never offered as the reason', /not offered as the reason/.test(mb.EATING_BEFORE_NOTE));

// --- Headings and the standing words ---------------------------------------
say(mb.describeTestHeading(tests[0]));
say(mb.describeTestHeading({ ...tests[0], provider: '' }));
say(mb.describeTestMeta(tests[0], 0));
say(mb.describeTestMeta({ ...tests[0], kind: 'Stool analysis' }, 1));
say(mb.describeTestMeta(tests[0], 4));
[mb.MICROBIOME_INTRO, mb.MICROBIOME_NOTE, mb.MICROBIOME_TEXT_HINT, mb.DIFFERENT_COMPANIES_NOTE, mb.DIFFERENT_UNITS_NOTE].forEach(say);
ok('the note says there is no agreed healthy microbiome', /no agreed healthy microbiome/.test(mb.MICROBIOME_NOTE));

// The app never grades a result in its own voice. The one allowed use is
// the note saying there is no agreed healthy microbiome.
const VERDICT = /\b(normal|abnormal|optimal|ideal|too (low|high)|safe|unsafe|good|bad|poor|excellent|deficient|imbalance|dysbiosis|healthy|unhealthy)\b/i;
for (const sentence of sentences) {
  const checked = sentence.replace('no agreed healthy microbiome', '');
  ok(`no verdict words: ${sentence.slice(0, 70)}`, !VERDICT.test(checked), sentence);
  ok(`no dashes: ${sentence.slice(0, 70)}`, !/[—–]| -- /.test(sentence), sentence);
}
// The component's own sentences, swept the same way.
const component = fs.readFileSync(path.join(__dirname, '..', 'components', 'MicrobiomeTestsSection.tsx'), 'utf8');
const strings = component.match(/'[^'\n]{12,}'|>[^<>{}\n]{12,}</g) || [];
for (const raw of strings) {
  ok(`component has no verdict words: ${raw.slice(0, 70)}`, !VERDICT.test(raw), raw);
}

if (failures) {
  console.log(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log(`All microbiome checks passed (${sentences.length} sentences swept).`);
