// Checks lib/labImport.ts (G28): a lab sheet read into rows the person
// confirms, test names matched, dates found, and the words swept.
// Run: node scripts/test_lab_import.js
const fs = require('fs');
/* global __dirname */
const path = require('path');
const ts = require('typescript');

function transpile(file) {
  const src = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', out.outputText)(mod, mod.exports, (name) => {
    throw new Error(`${file} must import nothing, imported ${name}`);
  });
  return mod.exports;
}

const lab = transpile('lib/labImport.ts');

let failures = 0;
function ok(label, condition, detail) {
  if (!condition) {
    failures++;
    console.log(`FAIL ${label}${detail ? `\n  ${detail}` : ''}`);
  }
}

// The reference database's 18 tests, as getLabTests returns them.
const T = (categoryCode, code, displayName, aliases, rangeUnit) => ({ categoryCode, code, displayName, aliases, rangeUnit });
const TESTS = [
  T('inflammation_metabolic', 'hscrp', 'hs-CRP (High-Sensitivity C-Reactive Protein)', 'CRP', 'mg/L'),
  T('nutrient_status', 'ferritin', 'Ferritin', null, 'ng/mL'),
  T('nutrient_status', 'vitamin_d_test', 'Vitamin D (25-Hydroxyvitamin D)', '25(OH)D', 'ng/mL'),
  T('nutrient_status', 'vitamin_b12_test', 'Vitamin B12', 'Cobalamin', 'pg/mL'),
  T('nutrient_status', 'selenium_test', 'Selenium', null, 'mcg/L'),
  T('nutrient_status', 'zinc_test', 'Zinc', null, 'mcg/dL'),
  T('nutrient_status', 'magnesium_test', 'Magnesium', 'RBC Magnesium', 'mg/dL'),
  T('nutrient_status', 'urine_iodine', 'Urinary Iodine', 'UIC', 'mcg/L'),
  T('thyroid_autoimmune', 'tpo_ab', 'Thyroid Peroxidase Antibodies (TPOAb)', 'Anti-TPO, TPOAb', 'IU/mL'),
  T('thyroid_autoimmune', 'tg_ab', 'Thyroglobulin Antibodies (TgAb)', 'Anti-Tg', 'IU/mL'),
  T('thyroid_autoimmune', 'tsi_trab', 'TSH Receptor Antibodies (TSI/TRAb)', 'TSI, TRAb, TSH-R Ab', 'IU/L'),
  T('thyroid_function', 'tsh', 'TSH (Thyroid-Stimulating Hormone)', 'Thyrotropin', 'mIU/L'),
  T('thyroid_function', 'free_t4', 'Free T4', 'FT4', 'ng/dL'),
  T('thyroid_function', 'free_t3', 'Free T3', 'FT3', 'pg/mL'),
  T('thyroid_function', 'total_t4', 'Total T4', 'TT4', 'mcg/dL'),
  T('thyroid_function', 'total_t3', 'Total T3', 'TT3', 'ng/dL'),
  T('thyroid_function', 'reverse_t3', 'Reverse T3', 'rT3', 'ng/dL'),
  T('thyroid_structural', 'thyroglobulin', 'Thyroglobulin', 'Tg', 'ng/mL'),
];
const OWN = { categoryCode: 'own', code: 'own_homocysteine', displayName: 'Homocysteine', aliases: null, rangeUnit: 'umol/L', isOwn: true };
const RETIRED = { categoryCode: 'own', code: 'own_old', displayName: 'Old Thing', aliases: null, rangeUnit: '', isOwn: true, retiredAt: '2026-09-01' };
const ALL = [...TESTS, OWN, RETIRED];

// --- Matching names ----------------------------------------------------------

const match = (name) => lab.matchLabTest(name, ALL);
const NAMES = {
  'TSH': 'tsh',
  'TSH, 3rd Generation': 'tsh',
  'Thyroid Stimulating Hormone': 'tsh',
  'T4, Free (Direct)': 'free_t4',
  'Free T4': 'free_t4',
  'Thyroxine (T4) Free, Direct': 'free_t4',
  'FT3': 'free_t3',
  'Triiodothyronine (T3), Free': 'free_t3',
  'T3, Total': 'total_t3',
  'T3 Reverse': 'reverse_t3',
  'Thyroid Peroxidase (TPO) Ab': 'tpo_ab',
  'Anti-TPO': 'tpo_ab',
  'Thyroglobulin Antibody': 'tg_ab',
  'Thyroglobulin Antibodies': 'tg_ab',
  'Thyroglobulin': 'thyroglobulin',
  'TSH Receptor Antibody': 'tsi_trab',
  'Vitamin D, 25-Hydroxy': 'vitamin_d_test',
  '25-OH Vitamin D': 'vitamin_d_test',
  'Vitamin B12': 'vitamin_b12_test',
  'Ferritin, Serum': 'ferritin',
  'C-Reactive Protein, Cardiac': 'hscrp',
  'hs-CRP': 'hscrp',
  'Magnesium, RBC': 'magnesium_test',
  'Homocysteine': 'own_homocysteine',
};
for (const [name, code] of Object.entries(NAMES)) ok(`match ${name}`, match(name) === code, String(match(name)));
ok('an unknown test matches nothing', match('Hemoglobin A1c') === null, String(match('Hemoglobin A1c')));
ok('a retired test of your own is not matched', match('Old Thing') === null);
ok('empty matches nothing', match('') === null);

// --- One line ----------------------------------------------------------------

const line = (text) => lab.parseLabLine(text, ALL);
const tsh = line('TSH  2.45  mIU/L  0.45-4.50');
ok('tsh line', tsh && tsh.testCode === 'tsh' && tsh.value === 2.45 && tsh.unit === 'mIU/L' && tsh.low === 0.45 && tsh.high === 4.5, JSON.stringify(tsh));
const tpo = line('Thyroid Peroxidase (TPO) Ab   95   High   IU/mL   0-34');
ok('tpo line with a flag word', tpo && tpo.testCode === 'tpo_ab' && tpo.value === 95 && tpo.flag === 'High' && tpo.high === 34, JSON.stringify(tpo));
const glued = line('Ferritin 12L ng/mL 15 - 150');
ok('a flag glued to the number', glued && glued.value === 12 && glued.flag === 'L' && glued.low === 15 && glued.high === 150, JSON.stringify(glued));
const below = line('hs-CRP <0.5 mg/L <1.0');
ok('a printed less-than', below && below.value === 0.5 && below.valueText === '<0.5' && below.high === 1 && below.low === null, JSON.stringify(below));
const comma = line('Vitamin D, 25-Hydroxy  31,4  ng/mL  30,0 - 100,0');
ok('decimal commas', comma && comma.testCode === 'vitamin_d_test' && comma.value === 31.4 && comma.low === 30 && comma.high === 100, JSON.stringify(comma));
const t4 = line('T4, Free (Direct)	1.21	ng/dL	0.82-1.77');
ok('a tab between fields, name with a digit', t4 && t4.testCode === 'free_t4' && t4.value === 1.21, JSON.stringify(t4));
const bars = line('Free T3 | 3.1 | pg/mL | 2.0-4.4');
ok('bars between fields', bars && bars.testCode === 'free_t3' && bars.value === 3.1 && bars.unit === 'pg/mL', JSON.stringify(bars));
const unknown = line('Hemoglobin A1c 5.4 % 4.8-5.6');
ok('an unknown test is still a row', unknown && unknown.testCode === null && unknown.name === 'Hemoglobin A1c' && unknown.unit === '%', JSON.stringify(unknown));
ok('a page line is not a result', line('Page 1 of 3') === null);
ok('a patient line is not a result', line('Patient: Jane Doe DOB 01/02/1970') === null);
ok('a collected line is not a result', line('Collected: 09/14/2026 07:45') === null);
ok('a bare number is not a result', line('2.45') === null);

// --- A whole sheet -----------------------------------------------------------

const SHEET = `LABCORP
Patient: Test Person
Date Collected: 09/14/2026
Test  Result  Flag  Units  Reference Interval
TSH  2.45    uIU/mL  0.450-4.500
T4,Free(Direct)  1.21    ng/dL  0.82-1.77
Thyroid Peroxidase (TPO) Ab  95  High  IU/mL  0-34
Thyroglobulin Antibody  <1.0    IU/mL  0.0-0.9
Vitamin D, 25-Hydroxy
31.4  ng/mL  30.0-100.0
Hemoglobin A1c  5.4  %  4.8-5.6
Page 1 of 1`;
const rows = lab.parseLabSheet(SHEET, ALL);
ok('six results on the sheet', rows.length === 6, JSON.stringify(rows.map((r) => r.name)));
ok('name on one line, number on the next', rows.some((r) => r.testCode === 'vitamin_d_test' && r.value === 31.4), JSON.stringify(rows.map((r) => [r.name, r.value])));
ok('T4,Free(Direct) squashed together', rows.some((r) => r.testCode === 'free_t4'), JSON.stringify(rows.map((r) => r.name)));
ok('the unit is kept as printed', rows.find((r) => r.testCode === 'tsh').unit === 'uIU/mL');

const CSV = `Test Name,Result,Units,Reference Range,Flag,Collected
TSH,2.45,mIU/L,0.45-4.50,,2026-09-14
"Free T4",1.21,ng/dL,0.82-1.77,,2026-09-14
TPO Antibodies,95,IU/mL,<35,H,2026-09-14
Notes about nothing,,,,,`;
const csv = lab.parseLabSheet(CSV, ALL);
ok('csv with a header', csv.length === 3, JSON.stringify(csv));
ok('csv range read', csv[0].low === 0.45 && csv[0].high === 4.5, JSON.stringify(csv[0]));
ok('csv less-than range', csv[2].high === 35 && csv[2].low === null && csv[2].flag === 'H', JSON.stringify(csv[2]));
ok('csv date column', csv[1].testedAt === '2026-09-14', JSON.stringify(csv[1]));
ok('csv quoted name matched', csv[1].testCode === 'free_t4');
ok('semicolon csv', lab.parseLabSheet('Prueba;Resultado;Unidades\nTSH;2,1;mUI/L', ALL)[0].value === 2.1);
ok('empty sheet', lab.parseLabSheet('', ALL).length === 0);

// --- A photo's lines put back into rows --------------------------------------

const columns = [
  { text: 'TSH', x: 10, y: 100, height: 20 },
  { text: 'Free T4', x: 10, y: 130, height: 20 },
  { text: '2.45', x: 200, y: 102, height: 20 },
  { text: '1.21', x: 200, y: 131, height: 20 },
  { text: 'mIU/L 0.45-4.50', x: 300, y: 99, height: 20 },
  { text: 'ng/dL 0.82-1.77', x: 300, y: 129, height: 20 },
];
const rebuilt = lab.rowsFromPositionedLines(columns);
ok('columns become rows', rebuilt === 'TSH  2.45  mIU/L 0.45-4.50\nFree T4  1.21  ng/dL 0.82-1.77', JSON.stringify(rebuilt));
ok('rebuilt rows parse', lab.parseLabSheet(rebuilt, ALL).length === 2);
ok('no lines, no rows', lab.rowsFromPositionedLines([]) === '');

// --- Dates -------------------------------------------------------------------

ok('iso date', lab.readPrintedDate('2026-09-14') === '2026-09-14');
ok('us date with a day over 12', lab.readPrintedDate('09/14/2026') === '2026-09-14');
ok('day-first date with a day over 12', lab.readPrintedDate('14/09/2026') === '2026-09-14');
ok('03/04 is never guessed', lab.readPrintedDate('03/04/2026') === 'ambiguous');
ok('month name', lab.readPrintedDate('Sep 14, 2026') === '2026-09-14');
ok('day and month name', lab.readPrintedDate('14 Sep 2026') === '2026-09-14');
ok('spanish month', lab.readPrintedDate('14 de septiembre de 2026') === '2026-09-14', String(lab.readPrintedDate('14 de septiembre de 2026')));
ok('two-digit year', lab.readPrintedDate('9/14/26') === '2026-09-14');
const found = lab.findSheetDate(SHEET);
ok('sheet date found', found.kind === 'found' && found.date === '2026-09-14', JSON.stringify(found));
ok('ambiguous sheet date', lab.findSheetDate('Collected: 03/04/2026').kind === 'ambiguous');
ok('no sheet date', lab.findSheetDate('TSH 2.4').kind === 'none');
ok('spanish sheet date', lab.findSheetDate('Fecha de toma: 20/09/2026').kind === 'found');

// --- Drafts and saving -------------------------------------------------------

const drafts = lab.draftsFromRows(rows, ALL);
ok('read rows wait for confirming', drafts.every((d) => !d.confirmed && d.source === 'read'));
const a1c = drafts.find((d) => d.ownName === 'Hemoglobin A1c');
ok('an unknown test becomes one of your own', a1c && a1c.testCode === lab.OWN_TEST, JSON.stringify(a1c));
ok('nothing confirmed, nothing saved', lab.savesFromDrafts(drafts, '2026-09-20').length === 0);
ok('nothing confirmed button', lab.describeSaveButton(drafts) === 'Nothing Confirmed Yet');
const confirmed = drafts.map((d) => ({ ...d, confirmed: true }));
const saves = lab.savesFromDrafts(confirmed, '2026-09-20');
ok('every confirmed row saved', saves.length === rows.length, String(saves.length));
ok('panel date used', saves.every((s) => s.testedAt === '2026-09-20'));
const tg = saves.find((s) => s.testCode === 'tg_ab');
ok('less-than kept in the note', tg && tg.value === 1 && tg.notes === 'Printed as <1.0', JSON.stringify(tg));
const tpoSave = saves.find((s) => s.testCode === 'tpo_ab');
ok('the flag kept in the note', tpoSave && tpoSave.notes === 'Marked High on the sheet' && tpoSave.labRangeHigh === 34, JSON.stringify(tpoSave));
ok('own name carried', saves.find((s) => s.ownName === 'Hemoglobin A1c') !== undefined);
ok('csv row date beats the panel date', lab.savesFromDrafts(lab.draftsFromRows(csv, ALL).map((d) => ({ ...d, confirmed: true })), '2026-01-01')[0].testedAt === '2026-09-14');

ok('problem: no test', lab.draftProblem({ ...confirmed[0], testCode: null }) !== null);
ok('problem: own with no name', lab.draftProblem({ ...confirmed[0], testCode: lab.OWN_TEST, ownName: ' ' }) !== null);
ok('problem: no value', lab.draftProblem({ ...confirmed[0], value: '' }) === 'Type the result.');
ok('problem: not a number', lab.draftProblem({ ...confirmed[0], value: 'abc' }) !== null);
ok('problem: range upside down', lab.draftProblem({ ...confirmed[0], low: '5', high: '1' }) !== null);
ok('a row with a problem is not saved', lab.savesFromDrafts([{ ...confirmed[0], value: 'abc' }], '2026-09-20').length === 0);

// --- Panels ------------------------------------------------------------------

ok('thyroid panel', lab.panelTestCodes('thyroid', ALL, []).join() === 'tsh,free_t4,free_t3,tpo_ab,tg_ab');
ok('every thyroid test', lab.panelTestCodes('thyroidEvery', ALL, []).length === 10);
ok('nutrient panel', lab.panelTestCodes('nutrients', ALL, []).length === 7);
ok('tests you added leaves the retired out', lab.panelTestCodes('mine', ALL, []).join() === 'own_homocysteine');
ok('last time keeps only live tests', lab.panelTestCodes('lastTime', ALL, ['tsh', 'own_old', 'gone']).join() === 'tsh');
ok('every test', lab.panelTestCodes('every', ALL, []).length === 19);
const panel = lab.draftsForPanel(['tsh', 'free_t4'], ALL);
ok('panel rows carry the unit', panel[0].unit === 'mIU/L' && panel[0].source === 'form');
ok('a blank panel row is not saved', lab.savesFromDrafts(panel, '2026-09-20').length === 0);
ok('a typed panel row is saved', lab.savesFromDrafts([{ ...panel[0], value: '1.9' }], '2026-09-20').length === 1);

// --- Words -------------------------------------------------------------------

const sentences = [
  lab.LAB_SHEET_TITLE,
  lab.LAB_SHEET_INTRO,
  lab.LAB_TEXT_HINT,
  lab.LAB_PANEL_HINT,
  lab.LAB_SHEET_CAPTION,
  ...lab.LAB_PANELS.map((p) => p.label),
  lab.describeReadRows([]),
  lab.describeReadRows(drafts),
  lab.describeReadRows(drafts.filter((d) => d.testCode !== lab.OWN_TEST)),
  lab.describeReadRows(drafts.filter((d) => d.testCode === lab.OWN_TEST)),
  lab.describeSaveButton(confirmed),
  lab.describeSaveButton(confirmed.slice(0, 1)),
  lab.describeUnsaved(drafts),
  lab.describeUnsaved([...confirmed.slice(0, 2), { ...confirmed[0], value: 'x' }, drafts[0]]),
  lab.describeSheetDate(found),
  lab.describeSheetDate({ kind: 'ambiguous', printed: 'Collected: 03/04/2026' }),
  lab.describeUnitDifference('uIU/mL', 'mIU/L', 'TSH'),
  ...saves.map((s) => s.notes).filter(Boolean),
  ...['Pick which test this is.', lab.draftProblem({ ...confirmed[0], low: '5', high: '1' })],
].filter((s) => s != null);
ok('read line, mixed', lab.describeReadRows(drafts) === 'Six lines read as results. Five name tests the app knows, and one can be added as a new test or left out.', lab.describeReadRows(drafts));
ok('read line, all known', /Each one names/.test(lab.describeReadRows(drafts.filter((d) => d.testCode !== lab.OWN_TEST))));
ok('save button counts', lab.describeSaveButton(confirmed) === 'Save 6 Results');
ok('unsaved line', lab.describeUnsaved(drafts) === 'Six rows are not confirmed yet, so they are left out of the save.', lab.describeUnsaved(drafts));
ok('nothing unsaved', lab.describeUnsaved(confirmed) === null);
ok('same unit, no note', lab.describeUnitDifference('mIU/L', 'mIU/L', 'TSH') === null);

const FORBIDDEN = /\b(normal|abnormal|safe|healthy|unhealthy|optimal|ideal|too high|too low|worrying|nothing to worry|real|genuine|genuinely|causes?|diagnos\w*)\b|[—–]| -- /i;
for (const sentence of sentences) ok(`no forbidden words: ${sentence}`, !FORBIDDEN.test(sentence));

if (failures > 0) {
  console.log(`\n${failures} failed`);
  process.exit(1);
}
console.log(`All lab import checks passed (${sentences.length} sentences swept).`);
