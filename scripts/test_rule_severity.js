// Checks the three levels on cited interaction rules (A9 of the
// competitive build plan, 2026-09-26): the order major, caution, note,
// what an unknown value reads as, the words each level carries, and that
// the reference database holds only those three levels with the regraded
// rules at major. Exits non-zero on any failure.

// eslint-config-expo lints this repo as app code, which has no __dirname.
/* global __dirname */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function load(file) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const mod = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(mod.exports, mod, (name) => {
    throw new Error(`${file} must stay free of runtime imports (${name})`);
  });
  return mod.exports;
}

const S = load('lib/ruleSeverity.ts');

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

// Order.
const mixed = [
  { id: 'a', severity: 'note' },
  { id: 'b', severity: 'caution' },
  { id: 'c', severity: 'major' },
  { id: 'd', severity: 'caution' },
  { id: 'e', severity: 'major' },
];
check('major first, then caution, then note, stable within a level', S.sortBySeverity(mixed).map((x) => x.id), ['c', 'e', 'b', 'd', 'a']);
check('sorting leaves the input alone', mixed.map((x) => x.id), ['a', 'b', 'c', 'd', 'e']);
check('empty list', S.sortBySeverity([]), []);

// Reading a stored value.
check('major', S.toRuleSeverity('major'), 'major');
check('note', S.toRuleSeverity('note'), 'note');
check('caution', S.toRuleSeverity('caution'), 'caution');
check('unknown reads as caution', S.toRuleSeverity('severe'), 'caution');
check('null reads as caution', S.toRuleSeverity(null), 'caution');

// Words.
check('labels', S.RULE_SEVERITIES.map(S.ruleSeverityLabel), ['Major', 'Caution', 'Note']);
check('prefix', S.withSeverityPrefix('major', 'Grapefruit and cyclosporine'), 'Major: Grapefruit and cyclosporine');
const FORBIDDEN = /\b(stop taking|safe to|nothing to worry|not an emergency|no need to|you should (stop|start|skip)|real|genuine|genuinely)\b|—|–| -- /i;
for (const level of S.RULE_SEVERITIES) {
  const meaning = S.ruleSeverityMeaning(level);
  check(`${level} meaning has no verdict words`, FORBIDDEN.test(meaning), false);
  check(`${level} meaning names the prescriber or pharmacist`, /prescriber|pharmacist/.test(meaning), true);
}
check('major meaning says not to change a medication without asking', /Do not stop or change a medication/.test(S.ruleSeverityMeaning('major')), true);

// The reference database, when it is present (a fresh clone has none).
const dbPath = path.join(__dirname, '..', 'assets', 'data', 'foods_reference.db');
if (fs.existsSync(dbPath)) {
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(dbPath, { readOnly: true });
  const levels = db.prepare('select distinct severity from interaction_rules order by severity').all().map((r) => r.severity);
  check('only the three levels are stored', levels.filter((l) => !S.RULE_SEVERITIES.includes(l)), []);
  const MAJOR = [
    'acitretin_alcohol_avoidance',
    'allopurinol_azathioprine_toxicity',
    'aspirin_pediatric_reyes_syndrome',
    'azathioprine_allopurinol_toxicity',
    'cyclosporine_grapefruit_avoidance',
    'methimazole_agranulocytosis_warning_signs',
    'natalizumab_immunosuppressant_pml_caution',
    'ptu_liver_injury_warning_signs',
    'spironolactone_potassium_caution',
    'type1_pediatric_dka_cerebral_edema',
  ];
  const stored = db.prepare("select id from interaction_rules where severity = 'major' order by id").all().map((r) => r.id);
  check('the regraded rules are major', stored, MAJOR);
  const STYLE = /\b(real|really|genuine|genuinely)\b|—|–| -- /i;
  const styleHits = db
    .prepare('select id, title, guidance, mechanism from interaction_rules')
    .all()
    .filter((r) => [r.title, r.guidance, r.mechanism].some((t) => t && STYLE.test(t)))
    .map((r) => r.id);
  check('rule text is clear of the style words', styleHits, []);
  db.close();
} else {
  console.log('(reference database not present, database checks skipped)');
}

console.log(`${total - failures} of ${total} passed`);
if (failures > 0) process.exit(1);
