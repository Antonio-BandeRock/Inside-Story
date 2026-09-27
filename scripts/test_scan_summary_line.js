// Checks lib/scanSummaryLine.ts (G17): the one line at the top of a scan.
// Run: node scripts/test_scan_summary_line.js
const fs = require('fs');
/* global __dirname */
const path = require('path');
const ts = require('typescript');

function loadModule(file) {
  const src = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', out.outputText)(mod, mod.exports, () => {
    throw new Error('scanSummaryLine.ts must import nothing');
  });
  return mod.exports;
}

const { scanSummaryLine } = loadModule('lib/scanSummaryLine.ts');
let failures = 0;
const texts = [];
function check(label, got, want) {
  texts.push(got.text);
  const ok = got.text === want.text && got.tone === want.tone;
  if (!ok) {
    failures++;
    console.log(`FAIL ${label}\n  got:  ${JSON.stringify(got)}\n  want: ${JSON.stringify(want)}`);
  }
}

const names = { hashimotos: "Hashimoto's", celiac: 'Celiac disease', ibs: 'IBS' };
const base = { hasIngredients: true, additiveFlags: [], conditionFlags: [], fodmapMatched: false, conditionName: (c) => names[c] ?? c };

check('two conditions', scanSummaryLine({
  ...base,
  conditionFlags: [{ conditionCode: 'hashimotos', label: 'Sodium' }, { conditionCode: 'celiac', label: 'Gluten' }],
  additiveFlags: [{ severity: 'yellow', label: 'Carrageenan' }],
}), { text: 'Worth a second look for two of your conditions: sodium, gluten and carrageenan.', tone: 'yellow' });

check('one condition named', scanSummaryLine({
  ...base,
  conditionFlags: [{ conditionCode: 'celiac', label: 'Gluten' }],
}), { text: 'Worth a second look for Celiac disease: gluten.', tone: 'yellow' });

check('additive only, red first', scanSummaryLine({
  ...base,
  additiveFlags: [{ severity: 'yellow', label: 'Carrageenan' }, { severity: 'red', label: 'Potassium bromate' }],
}), { text: 'Worth a second look: potassium bromate and carrageenan.', tone: 'red' });

check('dedupe across conditions', scanSummaryLine({
  ...base,
  conditionFlags: [{ conditionCode: 'hashimotos', label: 'Gluten' }, { conditionCode: 'celiac', label: 'gluten' }],
}), { text: 'Worth a second look for two of your conditions: gluten.', tone: 'yellow' });

check('and N more', scanSummaryLine({
  ...base,
  additiveFlags: ['Nitrites', 'Carrageenan', 'Sucralose', 'Aspartame', 'Sulfites'].map((label) => ({ severity: 'yellow', label })),
  fodmapMatched: true,
}), { text: 'Worth a second look: nitrites, carrageenan, sucralose and three more.', tone: 'yellow' });

check('info only reads as nothing', scanSummaryLine({
  ...base,
  additiveFlags: [{ severity: 'info', label: 'MSG' }],
}), { text: 'Nothing on this label matched your conditions or the additives worth a second look.', tone: 'none' });

check('no ingredients', scanSummaryLine({ ...base, hasIngredients: false }),
  { text: 'No ingredients to check yet.', tone: 'none' });

check('acronym kept', scanSummaryLine({
  ...base,
  additiveFlags: [{ severity: 'yellow', label: 'CMC and polysorbate 80' }],
}), { text: 'Worth a second look: CMC and polysorbate 80.', tone: 'yellow' });

check('FODMAP alone', scanSummaryLine({ ...base, fodmapMatched: true }),
  { text: 'Worth a second look: FODMAP ingredients.', tone: 'yellow' });

const FORBIDDEN = /[–—]| -- |\b(real|genuine|genuinely|safe|unsafe|bad|good|healthy|unhealthy|avoid|toxic|dangerous|should)\b/i;
for (const text of texts) {
  if (FORBIDDEN.test(text)) {
    failures++;
    console.log(`FAIL forbidden wording: ${text}`);
  }
}

if (failures) {
  console.log(`${failures} failure(s).`);
  process.exit(1);
}
console.log(`scanSummaryLine: ${texts.length} cases pass.`);
