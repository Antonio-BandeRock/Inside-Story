// Runs lib/growSetup.ts: an indoor grow's setup, its open lists, and the
// electricity it is measured against.
//
// Built 2026-09-21, from "If I have already chosen above that it is an
// indoor grow, the app should automatically assume that Indoor LED or other
// older or newer technology will be used, and it should be asked for, along
// with all of the details about the light source itself ... there needs to
// be a way to record the current electricity bill prior to starting their
// indoor grow."
//
// The rules checked:
//
//  1. Open lists: the built-ins come first in their order, the person's
//     terms after in the order added, retired terms are off the picker but
//     still read by label, a removed term reads as retired, the
//     replacement list leaves out the one going, and removal needs a move
//     only while current equipment reads the term.
//  2. Ongoing amounts convert to a month by cadence, and nothing converts
//     without both an amount and a cadence.
//  3. Draw: watts times quantity times hours a day over a month, with a
//     piece missing either counted as unmetered rather than guessed at,
//     and retired pieces left out.
//  4. A container's purchase is a containers cost; every other kind's is
//     an equipment cost.
//  5. Bills: a period counts both ends, the rate is total paid over total
//     kWh across the bills that state kWh, and the baseline is compared
//     with the bills since per day, so a 28-day bill and a 33-day bill
//     compare fairly.
//  6. The sentences say what they have: nothing recorded, a baseline
//     alone, bills since with no baseline, a difference above or below.
//
// Run with: node scripts/test_grow_setup.js
// Exits non-zero on any failure.

/* global __dirname */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function loadModule(relPath, deps = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    if (deps[name]) return deps[name];
    throw new Error(`unexpected import ${name}`);
  });
  return module.exports;
}

const H = loadModule('lib/harvestTrade.ts');
const C = loadModule('lib/choiceOrder.ts');
const S = loadModule('lib/growSetup.ts', { './harvestTrade': H, './choiceOrder': C });
const {
  GROW_EQUIPMENT_KINDS, LIGHT_TYPES, CONTAINER_MATERIALS, TERM_LIST_WORDS,
  termChoices, findTerm, termLabel, isRetiredTerm, replacementTermChoices, planTermRemoval,
  monthlyEquivalent, monthlyKwh, summarizeSetupPower, summarizeOngoing, costKindForEquipment, describeEquipment,
  billDays, electricityRate, compareElectricity, estimateMonthlyCost, describeSetupPower, describeElectricity,
} = S;

let failures = 0;
let checks = 0;
function check(label, actual, expected) {
  checks += 1;
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failures += 1;
    console.error(`FAIL  ${label}`);
    console.error(`      expected ${JSON.stringify(expected)}`);
    console.error(`      got      ${JSON.stringify(actual)}`);
  }
}
function checkTrue(label, actual) { check(label, actual === true, true); }
function near(label, actual, expected, tol = 0.01) {
  checks += 1;
  if (typeof actual !== 'number' || Math.abs(actual - expected) > tol) {
    failures += 1;
    console.error(`FAIL  ${label}\n      expected ~${expected}\n      got       ${actual}`);
  }
}

// --- 1. Open lists ------------------------------------------------------------

check('thirteen built-in kinds', GROW_EQUIPMENT_KINDS.length, 13);
check('six built-in light types, LED first', [LIGHT_TYPES.length, LIGHT_TYPES[0].code], [6, 'led']);
check('six built-in materials, fabric and terracotta named', CONTAINER_MATERIALS.slice(0, 2).map((m) => m.code), ['fabric', 'terracotta']);
checkTrue('every built-in has help', [...GROW_EQUIPMENT_KINDS, ...LIGHT_TYPES, ...CONTAINER_MATERIALS].every((e) => e.help.length > 0));
check('every list has words for its picker', Object.keys(TERM_LIST_WORDS).sort(), ['container_material', 'equipment_kind', 'light_type']);

const terms = [
  { id: 'term_a', list: 'equipment_kind', name: 'CO2 tank', retiredAt: null },
  { id: 'term_b', list: 'equipment_kind', name: 'Trellis', retiredAt: '2026-09-21' },
  { id: 'term_c', list: 'light_type', name: 'Induction', retiredAt: null },
];
const kinds = termChoices('equipment_kind', terms);
const kindLabels = kinds.map((k) => k.label);
check('the list is alphabetical, mine merged in, retired left out', kindLabels, [...kindLabels].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())));
check('mine sits among the built-ins by name', kindLabels.indexOf('CO2 tank'), kindLabels.indexOf('Containers') - 1);
check('the retired one is out', kindLabels.includes('Trellis'), false);
check('mine flagged', kinds.find((k) => k.code === 'term_a').mine, true);
check('a built-in is not mine', kinds.find((k) => k.code === 'fan').mine, false);
check('other lists do not leak in', kinds.some((k) => k.code === 'term_c'), false);
check('a light type list has only light types', termChoices('light_type', terms).map((k) => k.code).sort(), ['cfl', 'cmh', 'hps', 'led', 'mh', 't5', 'term_c'].sort());
check('light types read alphabetically', termChoices('light_type', terms).map((k) => k.label), ['Ceramic metal halide (CMH, LEC)', 'CFL', 'HPS (high-pressure sodium)', 'Induction', 'LED', 'Metal halide', 'T5 fluorescent']);
check('a retired term still reads by label', termLabel('equipment_kind', 'term_b', terms), 'Trellis');
check('a built-in reads by label', termLabel('equipment_kind', 'fan', terms), 'Fan');
check('an unknown code reads null', termLabel('equipment_kind', 'gone', terms), null);
check('findTerm on a built-in carries help', findTerm('light_type', 'led', terms).help.length > 0, true);
check('retired: retired term, removed term, and not a built-in or a live term', [
  isRetiredTerm('equipment_kind', 'term_b', terms),
  isRetiredTerm('equipment_kind', 'gone', terms),
  isRetiredTerm('equipment_kind', 'fan', terms),
  isRetiredTerm('equipment_kind', 'term_a', terms),
  isRetiredTerm('equipment_kind', null, terms),
], [true, true, false, false, false]);
check('replacement list leaves out the one going', replacementTermChoices('equipment_kind', 'term_a', terms).some((k) => k.code === 'term_a'), false);
check('replacement list keeps everything else', replacementTermChoices('equipment_kind', 'term_a', terms).length, kinds.length - 1);
check('removal needs a move while current equipment reads it', planTermRemoval({ current: 2, past: 0 }, null), { ok: false, reason: 'needs_move' });
check('removal with a move goes, and drops the row when nothing retired reads it', planTermRemoval({ current: 2, past: 0 }, 'fan'), { ok: true, keepRow: false });
check('a term retired equipment reads keeps its row', planTermRemoval({ current: 0, past: 1 }, null), { ok: true, keepRow: true });
check('an unused term goes outright', planTermRemoval({ current: 0, past: 0 }, null), { ok: true, keepRow: false });

// --- 2. Ongoing amounts -------------------------------------------------------

near('weekly to a month', monthlyEquivalent(12, 'weekly'), 52);
near('monthly stays', monthlyEquivalent(30, 'monthly'), 30);
near('yearly to a month', monthlyEquivalent(120, 'yearly'), 10);
check('no amount, no figure', monthlyEquivalent(null, 'monthly'), null);
check('no cadence, no figure', monthlyEquivalent(30, null), null);
check('unknown cadence, no figure', monthlyEquivalent(30, 'daily'), null);

// --- 3. Draw --------------------------------------------------------------------

function piece(overrides) {
  return {
    id: 'e', plotId: 'p', kind: 'fan', name: null, quantity: 1, watts: null, hoursPerDay: null, onTimer: false,
    lightType: null, spectrum: null, plantStage: null, containerMaterial: null, containerSize: null,
    ongoingAmount: null, ongoingCadence: null, purchaseEntryId: null, notes: null, retiredAt: null, ...overrides,
  };
}
near('100 W for 12 h a day is 36.5 kWh a month', monthlyKwh(piece({ watts: 100, hoursPerDay: 12 })), 36.525, 0.001);
near('quantity multiplies', monthlyKwh(piece({ watts: 100, hoursPerDay: 12, quantity: 2 })), 73.05, 0.001);
check('no hours, no figure', monthlyKwh(piece({ watts: 100 })), null);
check('no watts, no figure', monthlyKwh(piece({ hoursPerDay: 12 })), null);
near('a zero quantity counts as one', monthlyKwh(piece({ watts: 100, hoursPerDay: 12, quantity: 0 })), 36.525, 0.001);

const setup = [
  piece({ id: 'light', kind: 'light', watts: 240, hoursPerDay: 16, ongoingAmount: null }),
  piece({ id: 'fan', watts: 30, hoursPerDay: 24, ongoingAmount: 5, ongoingCadence: 'monthly' }),
  piece({ id: 'pots', kind: 'container', quantity: 6 }),
  piece({ id: 'old', watts: 1000, hoursPerDay: 24, retiredAt: '2026-09-01', ongoingAmount: 100, ongoingCadence: 'monthly' }),
  piece({ id: 'filter', kind: 'air_filter', ongoingAmount: 60, ongoingCadence: 'yearly' }),
];
const power = summarizeSetupPower(setup);
near('setup draw sums the metered pieces in use', power.kwhPerMonth, (240 * 16 + 30 * 24) * 30.4375 / 1000, 0.01);
check('metered and unmetered counted, retired left out', [power.metered, power.unmetered], [2, 2]);
near('ongoing sums what is in use only', summarizeOngoing(setup), 10);

// --- 4. Purchases -----------------------------------------------------------------

check('a container is a containers cost', costKindForEquipment('container'), 'containers_structures');
check('a light is an equipment cost', costKindForEquipment('light'), 'tools_equipment');
check('a kind the person named is an equipment cost', costKindForEquipment('term_a'), 'tools_equipment');

// --- 5. The line a piece reads as --------------------------------------------------

const lightLine = describeEquipment(piece({ kind: 'light', lightType: 'led', spectrum: 'full', plantStage: 'seedlings', watts: 240, hoursPerDay: 16, onTimer: true }), terms);
checkTrue('a light names its type, spectrum, stage, watts, hours and timer', /Grow light · LED · Full spectrum · for seedlings and cuttings · 240 W · 16 h a day on a timer/.test(lightLine));
const potLine = describeEquipment(piece({ kind: 'container', quantity: 6, containerMaterial: 'fabric', containerSize: '5 gal' }), terms);
check('containers name the count, material and size', potLine, '6 × Containers · fabric · 5 gal');
check('a kind the person named reads by its name', describeEquipment(piece({ kind: 'term_a' }), terms), 'CO2 tank');
check('a retired kind still reads', describeEquipment(piece({ kind: 'term_b' }), terms), 'Trellis');
check('a kind nothing knows says so', describeEquipment(piece({ kind: 'gone' }), terms), 'Equipment no longer on the list');
checkTrue('an ongoing amount reads with its cadence', /a month$/.test(describeEquipment(piece({ ongoingAmount: 5, ongoingCadence: 'monthly' }), terms)));
check('a timer with no hours still reads', describeEquipment(piece({ onTimer: true }), terms), 'Fan · on a timer');

// --- 6. Bills -------------------------------------------------------------------

check('a period counts both ends', billDays({ periodStart: '2026-08-01', periodEnd: '2026-08-31' }), 31);
check('a one-day period is one day', billDays({ periodStart: '2026-08-01', periodEnd: '2026-08-01' }), 1);
check('a bad date is one day rather than a crash', billDays({ periodStart: 'x', periodEnd: '2026-08-01' }), 1);

const bills = [
  { id: 'b1', periodStart: '2026-07-01', periodEnd: '2026-07-28', kwh: 280, amount: 56, beforeGrow: true, notes: null },
  { id: 'b2', periodStart: '2026-08-01', periodEnd: '2026-09-02', kwh: 495, amount: 99, beforeGrow: false, notes: null },
];
near('rate is total paid over total kWh', electricityRate(bills), 0.2);
check('no kWh, no rate', electricityRate([{ ...bills[0], kwh: null }]), null);
check('a bill without kWh is left out of the rate', electricityRate([bills[0], { ...bills[1], kwh: null }]), 0.2);

const cmp = compareElectricity(bills);
near('baseline per day', cmp.baseline.amountPerDay, 2);
near('since per day, 33 days', cmp.since.amountPerDay, 3);
near('extra per month is the per-day difference over a month', cmp.extraPerMonth, 30.4375);
near('extra kWh per month', cmp.extraKwhPerMonth, (15 - 10) * 30.4375);
check('without both sides there is no difference', compareElectricity([bills[0]]).extraPerMonth, null);
check('kWh difference needs kWh on both sides', compareElectricity([{ ...bills[0], kwh: null }, bills[1]]).extraKwhPerMonth, null);
near('two baseline bills pool per day', compareElectricity([bills[0], { ...bills[0], id: 'b3', periodStart: '2026-06-01', periodEnd: '2026-06-30', amount: 90, kwh: 300 }]).baseline.amountPerDay, (56 + 90) / (28 + 30));

near('estimate prices a draw at the rate', estimateMonthlyCost(100, 0.2), 20);
check('no rate, no estimate', estimateMonthlyCost(100, null), null);

// --- 7. The sentences ------------------------------------------------------------

check('no equipment', describeSetupPower({ kwhPerMonth: 0, metered: 0, unmetered: 0 }, null), 'Nothing recorded here yet.');
checkTrue('unmetered only asks for wattage and hours', /Add wattage and hours/.test(describeSetupPower({ kwhPerMonth: 0, metered: 0, unmetered: 2 }, null)));
checkTrue('metered without a rate points at the bills', /Record an electricity bill under Growing Costs/.test(describeSetupPower({ kwhPerMonth: 100, metered: 1, unmetered: 0 }, null)));
checkTrue('metered with a rate prices it', /about \$20\.00 a month/.test(describeSetupPower({ kwhPerMonth: 100, metered: 1, unmetered: 0 }, 0.2)));
checkTrue('unmetered pieces are named beside the figure', /1 piece has no wattage or hours recorded and is not in that figure/.test(describeSetupPower({ kwhPerMonth: 100, metered: 1, unmetered: 1 }, 0.2)));
checkTrue('no bills asks for the one before the grow', /before the grow starts/.test(describeElectricity(compareElectricity([]))));
checkTrue('baseline alone says what it is and what comes next', /Before the grow: \$2\.00 a day, 10 kWh a day, from one bill\. Record the bills/.test(describeElectricity(compareElectricity([bills[0]]))));
checkTrue('since alone asks for a baseline', /No bill from before the grow/.test(describeElectricity(compareElectricity([bills[1]]))));
checkTrue('a difference above reads as the grow\'s cost with kWh', /running about \$30\.44 a month in electricity, 152\.2 kWh a month\.$/.test(describeElectricity(cmp)));
checkTrue('a difference below says the grow is not showing yet', /under the baseline, so the grow is not showing on the meter yet\.$/.test(describeElectricity(compareElectricity([{ ...bills[0], beforeGrow: false }, { ...bills[1], beforeGrow: true }]))));

console.log(`${checks} checks, ${failures} failures`);
process.exit(failures === 0 ? 0 : 1);
