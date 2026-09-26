// Runs the output lenses built 1.0.52.7: the nine Trends lenses in
// lib/trendsMore.ts, the six Insights lenses in lib/insightsMore.ts, and
// the report sections in lib/reportKinds.ts.
//
// The rules checked:
//
//  1. Every builder runs on sample rows and on nothing at all without
//     throwing, and hands back a view whose shape the screen can draw.
//  2. Nothing recorded reads as the view's empty sentence, never as a band
//     of zeros.
//  3. A week with nothing in it is a gap: a row for it carries null, never 0.
//  4. No sentence any of them writes carries a word from
//     READING_FORBIDDEN_WORDS (praise, blame, a verdict, a cause, a dose
//     instruction), an em or en dash, or "real"/"genuine".
//  5. Every report kind has a title, a preface, help, and only core
//     sections that exist, and a report built from a lens says what the
//     lens says.
//
// Run with: node scripts/test_output_lenses.js
// Exits non-zero on any failure.

/* global __dirname */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const ROOT = path.join(__dirname, '..');
const cache = {};

// Loads lib/<name>.ts, transpiled, resolving its relative imports the same
// way. Packages are handed an empty object: every module read here is pure
// and only takes types from them.
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
    if (name === './db') throw new Error(`${relPath} reaches the database`);
    return load(path.join(dir, name + '.ts').replace(/\\/g, '/'));
  });
  return module.exports;
}

const T = load('lib/trendsMore.ts');
const I = load('lib/insightsMore.ts');
const R = load('lib/reportKinds.ts');
const { READING_FORBIDDEN_WORDS } = load('lib/readingBands.ts');

let passed = 0;
let failed = 0;
function check(ok, label) {
  if (ok) passed++;
  else {
    failed++;
    console.log('FAIL: ' + label);
  }
}

// Every string anywhere inside a value.
function strings(value, out = []) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((item) => strings(item, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((item) => strings(item, out));
  return out;
}

const BANNED = [...READING_FORBIDDEN_WORDS, '—', '–', ' -- ', 'genuine'];
function sweep(label, value) {
  for (const text of strings(value)) {
    const lower = text.toLowerCase();
    for (const word of BANNED) check(!lower.includes(word), `${label}: no "${word}" in "${text}"`);
    check(!/\breal\b/i.test(text), `${label}: no "real" in "${text}"`);
  }
}

function checkView(label, view, expectAnything) {
  check(!!view && typeof view.hasAnything === 'boolean', `${label}: says whether it has anything`);
  check(typeof view.empty === 'string' && (view.hasAnything || view.empty.length > 10), `${label}: says so when there is nothing`);
  check(Array.isArray(view.bands), `${label}: has bands`);
  if (expectAnything === false) {
    check(!view.hasAnything, `${label}: nothing recorded reads as nothing`);
    check(view.bands.length === 0, `${label}: nothing recorded draws no bands`);
  }
  if (expectAnything === true) check(view.hasAnything && view.bands.length > 0, `${label}: sample rows draw bands`);
  for (const band of view.bands || []) {
    check(!!band.id && !!band.title && !!band.icon, `${label}/${band.id}: band has id, title and icon`);
    check(Array.isArray(band.lines), `${label}/${band.id}: band has lines`);
    for (const row of band.rows || []) {
      check(row.value === null || typeof row.value === 'number', `${label}/${band.id}: row value is a number or a gap`);
      if (row.value === null) check(row.display !== '0', `${label}/${band.id}: a gap does not display as 0`);
    }
  }
  sweep(label, view);
}

function run(label, build, input, expectAnything) {
  let view;
  try {
    view = build(input);
  } catch (error) {
    check(false, `${label}: threw ${error && error.message}`);
    return null;
  }
  checkView(label, view, expectAnything);
  return view;
}

// Four weeks ending 2026-09-24, with the second week left blank.
const range = { start: '2026-08-28', end: '2026-09-24' };
const today = '2026-09-24';
const at = (day, hour) => new Date(`${day}T${String(hour).padStart(2, '0')}:15:00`).toISOString();
const days = ['2026-08-28', '2026-08-29', '2026-08-31', '2026-09-12', '2026-09-15', '2026-09-20', '2026-09-23'];

// Trends
run('hydration', T.buildHydrationView, {
  range,
  meals: days.flatMap((day) => [
    { eatenAt: at(day, 8), name: 'Oatmeal', mealType: 'breakfast' },
    { eatenAt: at(day, 10), name: 'Water', mealType: 'drink' },
  ]),
  waterPercentByDay: days.map((date, index) => ({ date, value: 60 + index * 5 })),
}, true);
run('hydration empty', T.buildHydrationView, { range, meals: [], waterPercentByDay: [] }, false);

const bp = [];
for (let n = 0; n < 20; n++) bp.push({ loggedAt: at(n < 10 ? '2026-07-0' + ((n % 9) + 1) : days[n % days.length], 7), systolic: 118 + (n % 7), diastolic: 76 + (n % 5), pulse: 64 + n });
bp.sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
run('bloodPressure', T.buildBloodPressureView, { range, readings: bp }, true);
run('bloodPressure empty', T.buildBloodPressureView, { range, readings: [] }, false);

const doseStatuses = ['taken', 'skipped', 'planned', 'taken'];
run('doses', T.buildDosesView, {
  range,
  today,
  doses: days.map((day, index) => ({ scheduledFor: at(day, 7), title: 'Selenium', status: doseStatuses[index % 4] })),
}, true);
run('doses empty', T.buildDosesView, { range, today, doses: [] }, false);

run('care', T.buildCareView, {
  range,
  today,
  appointments: [
    { scheduledFor: at('2026-09-01', 9), title: 'Thyroid follow-up', providerName: 'Dr. Lee', appointmentType: 'doctor', status: 'completed' },
    { scheduledFor: at('2026-09-18', 14), title: 'Dietitian', providerName: null, appointmentType: null, status: 'cancelled' },
    { scheduledFor: at('2026-10-02', 11), title: 'Blood draw', providerName: 'Lab', appointmentType: 'lab', status: 'planned' },
  ],
}, true);
run('care empty', T.buildCareView, { range, today, appointments: [] }, false);

run('work', T.buildWorkView, {
  range,
  checkins: [
    { weekOf: '2026-08-31', autonomy: 3, competence: 4, relatedness: 2, drain: 3 },
    { weekOf: '2026-09-14', autonomy: 2, competence: 3, relatedness: 3, drain: 4 },
    { weekOf: '2026-09-21', autonomy: 4, competence: 4, relatedness: 4, drain: 2 },
  ],
  sleep: days.map((date, index) => ({ date, value: 6 + (index % 3) })),
  flareDates: ['2026-09-15'],
}, true);
run('work empty', T.buildWorkView, { range, checkins: [], sleep: [], flareDates: [] }, false);

run('reactions', T.buildReactionsView, {
  range,
  mealDates: days,
  reactions: [
    { loggedAt: at('2026-09-12', 13), severity: 3, mealName: 'Lentil soup' },
    { loggedAt: at('2026-09-20', 19), severity: null, mealName: null },
  ],
  trials: [
    { foodName: 'Eggs', status: 'active', startedAt: '2026-09-10', resolvedAt: null, design: 'reintroduce' },
    { foodName: 'Dairy', status: 'resolved', startedAt: '2026-08-20', resolvedAt: '2026-09-05', design: 'removal' },
  ],
}, true);
run('reactions empty', T.buildReactionsView, { range, mealDates: [], reactions: [], trials: [] }, false);

run('nights', T.buildNightsView, {
  range,
  nights: days.map((nightOf, index) => ({ nightOf, times: index % 3, firstWake: index % 2 ? '03:10' : null })),
  meals: days.flatMap((day, index) => [
    { eatenAt: at(day, 18), mealType: 'dinner' },
    ...(index % 2 ? [{ eatenAt: at(day, 20), mealType: 'drink' }] : []),
  ]),
}, true);
run('nights empty', T.buildNightsView, { range, nights: [], meals: [] }, false);

run('ferments', T.buildFermentsView, {
  range,
  batches: [
    { fermentationName: 'Sauerkraut', startedAt: at('2026-09-01', 10), stage: 'fermenting' },
    { fermentationName: 'Yogurt', startedAt: at('2026-09-15', 10), stage: 'done' },
  ],
  harvests: [{ drinkName: 'Kombucha', readyAt: at('2026-09-20', 10), quantity: 2, quantityRemaining: 1, unit: 'L' }],
}, true);
run('ferments empty', T.buildFermentsView, { range, batches: [], harvests: [] }, false);

run('planned', T.buildPlannedView, {
  range,
  today,
  planned: days.map((day, index) => ({ scheduledFor: at(day, 12), status: index % 3 ? 'completed' : 'planned', mealType: 'lunch' })),
}, true);
run('planned empty', T.buildPlannedView, { range, today, planned: [] }, false);

// A week with nothing logged is a gap, never a zero.
const hydration = T.buildHydrationView({
  range,
  meals: [{ eatenAt: at('2026-08-28', 8), name: 'Oatmeal', mealType: 'breakfast' }],
  waterPercentByDay: [{ date: '2026-08-28', value: 50 }],
});
const gapRows = hydration.bands.flatMap((band) => band.rows || []);
check(gapRows.some((row) => row.value === null), 'hydration: a week with nothing logged is a gap');

// Insights
const now = new Date(`${today}T09:30:00`);
run('i-today', I.buildTodayView, {
  today,
  now,
  timeline: [],
  routines: [],
  checks: [],
  upkeep: [],
  appointments: [{ scheduledFor: at(today, 15), title: 'Physio', providerName: 'Clinic', status: 'planned' }],
  countdowns: [],
  yesterdayOpen: [{ scheduledFor: at('2026-09-23', 20), title: 'Magnesium', itemType: 'supplement' }],
  captureWaiting: 2,
}, true);
run('i-today empty', I.buildTodayView, {
  today, now, timeline: [], routines: [], checks: [], upkeep: [], appointments: [], countdowns: [], yesterdayOpen: [], captureWaiting: 0,
});

run('i-signals', I.buildSignalsView, {
  today,
  timeline: [],
  checkins: [
    { loggedAt: at(today, 8), checkinType: 'flare', valence: 'negative', severity: 2, notes: 'Joint ache', foodName: null, tags: ['tired'] },
    { loggedAt: at(today, 13), checkinType: 'reaction', valence: null, severity: 1, notes: null, foodName: 'Rye bread', tags: [] },
  ],
  bloodPressure: [{ loggedAt: at(today, 7), systolic: 121, diastolic: 79, pulse: 66 }],
}, true);
run('i-signals empty', I.buildSignalsView, { today, timeline: [], checkins: [], bloodPressure: [] }, false);

run('i-appointment', I.buildAppointmentView, {
  today,
  appointments: [
    { scheduledFor: at('2026-08-20', 9), title: 'Thyroid follow-up', providerName: 'Dr. Lee', status: 'completed' },
    { scheduledFor: at('2026-10-01', 9), title: 'Thyroid follow-up', providerName: 'Dr. Lee', status: 'planned' },
  ],
  labs: [{ displayName: 'TSH', value: 2.1, unit: 'mIU/L', low: 0.4, high: 4.0, testedAt: '2026-09-10' }],
  flares: [{ loggedAt: at('2026-09-12', 8), severity: 3, notes: 'Fatigue' }],
  treatments: [{ name: 'Levothyroxine', treatmentType: 'prescription', startDate: '2026-01-01', endDate: null, updatedAt: '2026-09-02', doseAmount: 50, doseUnit: 'mcg' }],
  healthNotes: [{ text: 'Ask about ferritin', createdAt: at('2026-09-14', 10), status: 'open' }],
}, true);
run('i-appointment empty', I.buildAppointmentView, { today, appointments: [], labs: [], flares: [], treatments: [], healthNotes: [] }, false);

const picture = {
  month: '2026-09',
  plannedIncome: 3000,
  plannedCommitted: 1400,
  plannedSetAside: 200,
  loggedIncome: 1500,
  loggedSpend: 900,
  tracked: { grocerySpend: 250, therapySpend: 60 },
  knownSpendTotal: 1210,
  incompleteRecords: 1,
  byCategory: [{ category: 'groceries', monthly: 250 }],
};
run('i-money', I.buildMoneyView, {
  month: '2026-09',
  today,
  picture,
  budgets: [{ category: 'groceries', limit: 400, spent: 250, committed: 0, remaining: 150, fraction: 0.625, overspent: false, committedAlone: false }],
  bills: [{
    id: 'b1', serviceDate: '2026-09-03', provider: 'Clinic', description: null, billed: 180, allowed: 120, insurancePaid: 90, youOwe: 30, paidAmount: null,
    status: 'unpaid', appliedToDeductible: 30, appliedToOutOfPocket: 30, conditionCode: null,
  }],
  planLine: 'Deductible: $470 of $1,500 met.',
  cost: null,
}, true);

run('i-kitchen', I.buildKitchenView, {
  today,
  items: [
    { id: 'k1', foodName: 'Spinach', category: 'Veg', quantity: 1, unit: 'bag', quantityRemaining: 1, location: 'Fridge', addedAt: at('2026-09-20', 10) },
    { id: 'k2', foodName: 'Brown rice', category: null, quantity: null, unit: null, quantityRemaining: null, location: null, addedAt: at('2026-07-01', 10) },
  ],
  recipes: [
    { key: 'r1', name: 'Rice bowl', kind: 'meal', covered: 3, total: 3, full: true },
    { key: 'r2', name: 'Green salad', kind: 'salad', covered: 2, total: 5, full: false },
  ],
}, true);
run('i-kitchen empty', I.buildKitchenView, { today, items: [], recipes: [] }, false);

run('i-garden', I.buildGardenView, {
  today,
  plantings: [{ foodName: 'Tomato', plotName: 'Back bed', expectedStart: '2026-09-20', expectedEnd: '2026-10-10', status: 'growing' }],
  onHand: [{ foodName: 'Zucchini', quantityRemaining: 3, unit: 'count', harvestedOn: '2026-09-21', plotName: 'Back bed' }],
  weekUses: [{ foodName: 'Zucchini', quantity: 1, unit: 'count', usedOn: '2026-09-22' }],
  nutrientShare: [{ displayName: 'Vitamin C', unit: 'mg', fromGarden: 40, weekTarget: 525 }],
  usesUncounted: 1,
}, true);
run('i-garden empty', I.buildGardenView, { today, plantings: [], onHand: [], weekUses: [], nutrientShare: [], usesUncounted: 0 }, false);

// Reports
const CORE = ['conditions', 'nutrients', 'flags', 'symptoms', 'meds', 'movement', 'body', 'rules', 'labs'];
check(R.REPORT_KINDS.length === 8, 'eight reports');
check(R.REPORT_KINDS[0].key === 'overview', 'the Overview comes first');
check(R.REPORT_KIND_BY_KEY.overview.core.length === CORE.length, 'the Overview carries every core section');
for (const def of R.REPORT_KINDS) {
  check(!!def.title && !!def.label && !!def.icon, `${def.key}: has a title, label and icon`);
  check(Array.isArray(def.preface) && def.preface.length > 0, `${def.key}: has a preface`);
  check(typeof def.help === 'string' && def.help.length > 20, `${def.key}: has help`);
  for (const id of def.core) check(CORE.includes(id), `${def.key}: core section ${id} exists`);
  check(R.REPORT_KIND_BY_KEY[def.key] === def, `${def.key}: found by key`);
  sweep(`report ${def.key}`, def);
}

const care = T.buildCareView({ range, today, appointments: [{ scheduledFor: at('2026-09-01', 9), title: 'Thyroid follow-up', providerName: 'Dr. Lee', appointmentType: 'doctor', status: 'completed' }] });
const fromLens = R.sectionsFromReading('Appointments and care', care);
check(fromLens.length === care.bands.length, 'a report takes one section per band');
const lensText = strings(care.bands.map((band) => band.lines));
const sectionText = strings(fromLens).join('\n');
check(lensText.every((line) => sectionText.includes(line)), 'a report built from a lens says what the lens says');
const emptySections = R.sectionsFromReading('Nights', T.buildNightsView({ range, nights: [], meals: [] }));
check(emptySections.length === 1 && emptySections[0].empty.length > 10, 'a lens with nothing reads as one section saying so');

const bills = R.medicalBillsSection([
  { id: 'b1', serviceDate: '2026-09-03', provider: 'Clinic', description: null, billed: 180, allowed: 120, insurancePaid: 90, youOwe: 30, paidAmount: null, status: 'unpaid', appliedToDeductible: null, appliedToOutOfPocket: null, conditionCode: null },
  { id: 'b2', serviceDate: '2025-01-03', provider: 'Old', description: null, billed: 50, allowed: null, insurancePaid: null, youOwe: null, paidAmount: null, status: 'paid', appliedToDeductible: null, appliedToOutOfPocket: null, conditionCode: null },
], range.start, range.end);
check(bills.rows.length === 1, 'the bills table holds only bills in the range');
sweep('report bills', bills);
sweep('report insurance', R.insuranceSection(null));
sweep('report cost', R.costSections(null));
sweep('report eating cost', R.eatingCostSection(null));

console.log(`${passed}/${passed + failed} checks passed`);
if (failed) process.exit(1);
