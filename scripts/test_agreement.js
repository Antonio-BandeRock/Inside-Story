// Checks lib/agreement.ts (X2, the first-launch agreement): reading the
// stored record, when the screen asks again, the "agreed on" line, and
// that the wording carries every point the plan asks for with no dashes.
// Run: node scripts/test_agreement.js
/* global __dirname */
const path = require('path');
const ts = require('typescript');
const fs = require('fs');

const src = fs.readFileSync(path.join(__dirname, '..', 'lib', 'agreement.ts'), 'utf8');
const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const m = { exports: {} };
new Function('module', 'exports', 'require', js)(m, m.exports, require);
const A = m.exports;

let pass = 0;
let fail = 0;
function check(name, ok) {
  if (ok) pass++;
  else {
    fail++;
    console.log('FAIL', name);
  }
}

// parseAgreement
check('empty is null', A.parseAgreement(null) === null && A.parseAgreement('') === null);
check('bad json is null', A.parseAgreement('{nope') === null);
check('no version is null', A.parseAgreement(JSON.stringify({ agreedAt: '2026-09-29T10:00:00Z' })) === null);
check('version 0 is null', A.parseAgreement(JSON.stringify({ version: 0, agreedAt: '2026-09-29T10:00:00Z' })) === null);
check('bad date is null', A.parseAgreement(JSON.stringify({ version: 1, agreedAt: 'soon' })) === null);
const good = A.parseAgreement(JSON.stringify({ version: 1, agreedAt: '2026-09-29T10:00:00Z', appVersion: '1.0.56.22' }));
check('good parses', good && good.version === 1 && good.appVersion === '1.0.56.22');
const noApp = A.parseAgreement(JSON.stringify({ version: 1, agreedAt: '2026-09-29T10:00:00Z' }));
check('missing app version is empty', noApp && noApp.appVersion === '');

// current and reason
check('null is not current', !A.isAgreementCurrent(null));
check('same version is current', A.isAgreementCurrent(good, 1));
check('older version is not current', !A.isAgreementCurrent(good, 2));
check('first time', A.agreementReason(null, 1) === 'first');
check('changed wording', A.agreementReason(good, 2) === 'changed');
check('agreed', A.agreementReason(good, 1) === null);
check('current wording is agreed to by a record of it', A.agreementReason({ version: A.AGREEMENT_VERSION, agreedAt: '2026-09-29T10:00:00Z', appVersion: '' }) === null);

// agreedLine
check('not agreed line', A.agreedLine(null) === 'Not agreed to on this device yet.');
check('agreed line names version', /^Agreed on .+2026, in version 1\.0\.56\.22\.$/.test(A.agreedLine(good)));
check('agreed line without version', /^Agreed on .+2026\.$/.test(A.agreedLine(noApp)));

// wording covers the plan's points
const all = [A.AGREEMENT_INTRO, ...A.AGREEMENT_POINTS.flatMap((p) => [p.heading, p.body]), A.AGREEMENT_BUTTON, A.AGREEMENT_FOOTNOTE, A.AGREEMENT_CHANGED_LINE].join('\n');
check('not medical advice', /not medical advice/i.test(all));
check('not a diagnosis', /does not diagnose/i.test(all));
check('doctor or pharmacist', /doctor or pharmacist/i.test(all));
check('allergen-aware, never allergy-safe', /allergen-aware, never allergy-safe/i.test(all));
check('check with a doctor before medical decisions', /check with your doctor before making any medical decision/i.test(all));
check('no dashes', !/[–—]| -- | - /.test(all));
check('no filler words', !/\b(real|genuine|genuinely)\b/i.test(all));
check('legal links off until X3', A.LEGAL_PAGES_LIVE === false);
check('six points', A.AGREEMENT_POINTS.length === 6);

console.log(`${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
