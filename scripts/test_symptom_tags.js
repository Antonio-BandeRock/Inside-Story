// Checks D3, D4 and D5 of the competitive build plan (Phase 2, 2026-09-26):
// the person's own symptoms merge into the built-in list alphabetically and
// a retired one keeps its name on old check-ins without being offered, and
// the 0 to 10 severity maps onto the four named steps both ways. Also sweeps
// the new Signals and Trends wording for verdict words. Exits non-zero on
// any failure.

// eslint-config-expo lints this repo as app code, which has no __dirname.
/* global __dirname */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const loaded = {};
function load(relPath) {
  if (loaded[relPath]) return loaded[relPath];
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  loaded[relPath] = module.exports;
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    if (name === './choiceOrder') return load('lib/choiceOrder.ts');
    throw new Error(`${relPath} must stay free of runtime imports (${name})`);
  });
  return module.exports;
}

const sev = load('lib/severityScale.ts');
const tags = load('lib/checkinTags.ts');

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

// D5: every number lands in exactly one step, and the steps cover 0 to 10.
const seen = [];
for (let n = 0; n <= 10; n += 1) seen.push(sev.stepFromTen(n));
check('0 to 10 onto the steps', seen, [1, 1, 1, 1, 2, 2, 3, 3, 3, 4, 4]);
check('clamped high', sev.stepFromTen(14), 4);
check('clamped low', sev.stepFromTen(-2), 1);
check('word only sits mid-step', [1, 2, 3, 4].map((s) => sev.severityOnTen(s, null)), [1.5, 4.5, 7, 9.5]);
check('a number wins', sev.severityOnTen(1, 8), 8);
check('nothing', sev.severityOnTen(null, null), null);
check('word only reads as the word', sev.describeSeverity(3, null), 'Severe');
check('number reads with its word', sev.describeSeverity(3, 7), 'Severe, 7 of 10');
check('number decides the word', sev.describeSeverity(1, 9), 'Very severe, 9 of 10');
check('zero is a number', sev.describeSeverity(null, 0), 'Mild, 0 of 10');
for (const step of [1, 2, 3, 4]) {
  check(`midpoint of step ${step} maps back`, sev.stepFromTen(sev.severityOnTen(step, null)), step);
}

// D3: the person's symptoms merge alphabetically, retired ones stay named.
const own = tags.customTagFromRow({ id: 'a1', label: 'Ringing in the ears', category: 'nervous_system_mood', usual_valence: 'negative', retired_at: null });
const gone = tags.customTagFromRow({ id: 'b2', label: 'Aching wrists', category: 'pain_physical', usual_valence: 'negative', retired_at: '2026-09-26' });
const odd = tags.customTagFromRow({ id: 'c3', label: 'Odd', category: 'not_a_group', usual_valence: 'weird', retired_at: null });
check('code is prefixed', own.code, 'custom:a1');
check('unknown group falls back', odd.category, 'pain_physical');
check('unknown valence reads negative', odd.usualValence, 'negative');
check('retired flag', gone.retired, true);
tags.setCustomCheckinTags([own, gone, odd]);
const groups = tags.getCheckinTagsByCategory();
const offered = groups.flatMap((group) => group.tags.map((tag) => tag.code));
check('own symptom offered', offered.includes('custom:a1'), true);
check('retired not offered', offered.includes('custom:b2'), false);
check('retired still named', tags.getCheckinTagDefinition('custom:b2')?.label, 'Aching wrists');
for (const group of groups) {
  const labels = group.tags.map((tag) => tag.label);
  const sorted = [...labels].sort(load('lib/choiceOrder.ts').compareLabels);
  check(`${group.category} reads alphabetically`, labels, sorted);
}
check('no built-in code uses the prefix', groups.flatMap((g) => g.tags).filter((t) => !t.custom && t.code.startsWith(tags.CUSTOM_TAG_PREFIX)).length, 0);
tags.setCustomCheckinTags([]);

// Wording on the two screens touched, read through the parser so comments
// never count.
const FORBIDDEN = /\b(streak|great job|well done|good job|failed|lazy|should have|real|genuine|genuinely|score|diagnos\w*|caused by|worse than usual)\b|%|[–—]| -- /i;
const shown = [];
for (const rel of ['app/(tabs)/log.tsx', 'app/(tabs)/trends.tsx']) {
  const file = ts.createSourceFile(rel, fs.readFileSync(path.join(__dirname, '..', rel), 'utf8'), ts.ScriptTarget.ES2020, true, ts.ScriptKind.TSX);
  (function walk(node) {
    let text = null;
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) text = node.text;
    else if (ts.isJsxText(node)) text = node.text.trim();
    if (text && /(symptom|0 to 10|of 10|How bad)/i.test(text)) shown.push(text);
    ts.forEachChild(node, walk);
  })(file);
}
check('found the new wording', shown.length >= 4, true);
for (const line of shown) check(`no verdict words: ${line}`, FORBIDDEN.test(line), false);

console.log(failures === 0 ? `All ${total} checks passed` : `\n${failures} of ${total} checks failed`);
process.exit(failures === 0 ? 0 : 1);
