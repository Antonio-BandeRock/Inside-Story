// Checks lib/fuelGaugeGroups.ts (G32): every nutrient with a daily target
// sits in at least one body system, every grouping names a source, all 19
// conditions are present (the two without a cited list saying so), the
// supplement's share is named on a line, and no sentence grades the day.
// Run: node scripts/test_fuel_gauge_groups.js
const fs = require('fs');
/* global __dirname */
const path = require('path');
const ts = require('typescript');

function load(file) {
  const src = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', out.outputText)(mod, mod.exports, (name) => {
    throw new Error(`${file} imported ${name}, which this test does not allow`);
  });
  return mod.exports;
}
const g = load('lib/fuelGaugeGroups.ts');

let failures = 0;
function ok(label, condition, detail) {
  if (!condition) {
    failures++;
    console.log(`FAIL ${label}${detail ? `\n  ${detail}` : ''}`);
  }
}

// The 29 nutrient codes in dietary_reference_intakes (checked against
// assets/data/foods_reference.db on 2026-10-02).
const DRI = 'biotin_b7 calcium choline copper fiber_total folate_b9 iodine iron magnesium manganese niacin_b3 pantothenic_acid_b5 phosphorus potassium protein riboflavin_b2 selenium sodium thiamin_b1 vitamin_a vitamin_b12 vitamin_b6 vitamin_c vitamin_d vitamin_e vitamin_k water zinc'.split(' ');
const CONDITIONS = 'hashimotos rheumatoid_arthritis psoriasis graves type_1_diabetes celiac ibd multiple_sclerosis lupus sjogrens pcos chronic_kidney_disease fatty_liver_disease type_2_diabetes ibs migraine cardiovascular_disease gout prostate_health'.split(' ');

const allGroups = [...g.BODY_SYSTEM_GROUPS, ...Object.values(g.CONDITION_GROUPS)];
for (const group of allGroups) {
  for (const code of group.codes) ok(`${group.key}: ${code} is a nutrient with a daily target`, DRI.includes(code));
  ok(`${group.key}: no nutrient listed twice`, new Set(group.codes).size === group.codes.length);
  ok(`${group.key}: has a note`, group.note.length > 20);
  if (group.codes.length > 0) ok(`${group.key}: names a source`, group.citations.length > 0);
}
for (const code of DRI) {
  ok(`${code} sits in at least one body system`, g.BODY_SYSTEM_GROUPS.some((group) => group.codes.includes(code)));
}
ok('body system keys are unique', new Set(g.BODY_SYSTEM_GROUPS.map((x) => x.key)).size === g.BODY_SYSTEM_GROUPS.length);
ok('all 19 conditions present', CONDITIONS.every((code) => g.CONDITION_GROUPS[code]) && Object.keys(g.CONDITION_GROUPS).length === 19);
for (const [code, group] of Object.entries(g.CONDITION_GROUPS)) ok(`${code}: key matches`, group.key === code);

// Entries as analyzeNutrientIntake builds them.
const E = (code, name, percent, food, supp) => ({
  nutrientCode: code,
  displayName: name,
  percentOfTarget: percent,
  fromFood: food,
  fromSupplements: supp,
  combinedTotal: food + supp,
});
const entries = [
  E('iodine', 'Iodine', 40, 60, 0),
  E('selenium', 'Selenium', 120, 30, 36),
  E('vitamin_d', 'Vitamin D', 80, 0, 12),
  E('zinc', 'Zinc', NaN, 0, 0),
];
const sentences = [];
const say = (t) => {
  if (t) sentences.push(t);
  return t;
};

ok('food only', say(g.describeGroupedNutrient(entries[0])) === 'Iodine 40%');
const sel = say(g.describeGroupedNutrient(entries[1]));
ok('supplement share named', /Selenium 120%, 65% of that from a supplement/.test(sel), sel);
const vd = say(g.describeGroupedNutrient(entries[2]));
ok('all from a supplement said', /all of it from a supplement/.test(vd), vd);
ok('no target is said, never a number', /no daily target/.test(say(g.describeGroupedNutrient(entries[3]))));

const systems = g.groupBySystem(entries);
ok('one row per body system', systems.length === g.BODY_SYSTEM_GROUPS.length);
const thyroid = systems.find((r) => r.key === 'thyroid');
ok('thyroid row carries iodine and selenium in order', thyroid.nutrients.map((n) => n.code).join(',') === 'iodine,selenium', JSON.stringify(thyroid));
const gut = systems.find((r) => r.key === 'gut');
ok('a group with no entries says so', gut.nutrients.length === 0 && /no.*daily target/i.test(gut.emptyLine || ''), JSON.stringify(gut));

const byCondition = g.groupByCondition(['graves', 'not_a_condition', 'gout'], entries);
ok('unknown codes passed over, order kept', byCondition.map((r) => r.key).join(',') === 'graves,gout');
ok('gout says nothing is grouped', /Nothing grouped/.test(byCondition[1].emptyLine || ''));
ok('no conditions gives no rows', g.groupByCondition([], entries).length === 0);

for (const row of [...systems, ...g.groupByCondition(CONDITIONS, entries)]) {
  say(row.note);
  say(row.emptyLine);
  row.nutrients.forEach((n) => say(n.line));
}
[g.FUEL_GAUGE_GROUPS_INTRO, g.NO_CONDITIONS_LINE, g.GROUP_SOURCE_LINE, g.FUEL_GAUGE_GROUPS_TITLE].forEach(say);

// Nothing grades the person's day or a body system.
const VERDICT = /\b(low|deficient|deficiency|adequate|enough|optimal|ideal|normal|healthy|unhealthy|safe|unsafe|good|bad|poor|fine|too (low|high))\b/i;
const component = fs.readFileSync(path.join(__dirname, '..', 'components', 'FuelGaugeGroups.tsx'), 'utf8');
const componentStrings = component.match(/'[^'\n]{12,}'|>[^<>{}\n]{12,}</g) || [];
for (const sentence of [...sentences, ...componentStrings]) {
  ok(`no verdict words: ${sentence.slice(0, 70)}`, !VERDICT.test(sentence), sentence);
  ok(`no dashes: ${sentence.slice(0, 70)}`, !/[—–]| -- /.test(sentence), sentence);
}

if (failures) {
  console.log(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log(`test_fuel_gauge_groups: all passed (${sentences.length} sentences swept).`);
