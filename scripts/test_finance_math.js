// Runs lib/financeCore.ts: the monthly summary, the month picture, and the
// wording built on both.
//
// Built 2026-09-05 with Finances, rewritten the same day when the due-date
// model was replaced. Cadence normalization and every date case moved to
// scripts/test_finance_schedule.js along with the rule that owns them; what
// is left here is the money arithmetic layered on top.
//
// Every failure mode is a silently wrong NUMBER rather than a crash, and
// the numbers are ones someone plans a month around. The cases weighted
// hardest are the three where a wrong answer looks entirely reasonable:
// savings counted as spending, a partial total presented as a complete
// one, and a bill that cannot be placed being dropped rather than named.
//
// Run with: node scripts/test_finance_math.js
// Exits non-zero on any failure.

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
  const require_ = (name) => {
    const key = name.replace('./', '');
    if (deps[key]) return deps[key];
    throw new Error(`unexpected import in ${relPath}: ${name}`);
  };
  // eslint-disable-next-line no-new-func
  new Function('exports', 'module', 'require', outputText)(module.exports, module, require_);
  return module.exports;
}

const categories = loadModule('lib/financeCategories.ts');
const schedule = loadModule('lib/financeSchedule.ts');
const core = loadModule('lib/financeCore.ts', { financeCategories: categories, financeSchedule: schedule });

const {
  summarizeRecurring, upcomingBills, buildMonthPicture, describeMonthPicture,
  formatFinanceMoney, describeDaysAway, itemMonthly, itemAnnual, itemMonthlyFactor,
  LEGACY_CADENCE_MONTHLY,
} = core;

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
function near(label, actual, expected, tol = 0.005) {
  checks += 1;
  if (typeof actual !== 'number' || Math.abs(actual - expected) > tol) {
    failures += 1;
    console.error(`FAIL  ${label}\n      expected ~${expected}\n      got       ${actual}`);
  }
}
function checkTrue(label, actual) { check(label, actual === true, true); }

const FRI = 5, TUE = 2;
const monthlyOn = (day) => ({ kind: 'dayOfMonth', months: 1, day });
const weeklyOn = (weekday, anchor = '2026-09-04') => ({ kind: 'everyNWeeks', weeks: 1, weekday, anchor });
const everyNWeeks = (weeks, weekday = FRI, anchor = '2026-09-04') => ({ kind: 'everyNWeeks', weeks, weekday, anchor });

function bill(over = {}) {
  return {
    id: over.id || Math.random().toString(36).slice(2),
    direction: 'expense',
    name: 'Bill',
    category: 'other_expense',
    amount: 100,
    rule: monthlyOn(1),
    legacyCadence: null,
    autopay: false,
    active: true,
    ...over,
  };
}

// --- Frequency comes from the rule, not from a second field ----------------

check('a monthly bill is its own amount', itemMonthly(bill({ amount: 200, rule: monthlyOn(1) })), 200);
near('a weekly bill is 4.33x, not 4x', itemMonthly(bill({ amount: 100, rule: weeklyOn(FRI) })), 433.33);
near('every 2 weeks is 2.167x', itemMonthly(bill({ amount: 100, rule: everyNWeeks(2) })), 216.67);
near('every 3 weeks is 1.444x', itemMonthly(bill({ amount: 100, rule: everyNWeeks(3) })), 144.44);
check('a yearly bill spreads over twelve months', itemMonthly(bill({ amount: 1200, rule: { kind: 'dayOfMonth', months: 12, day: 1, anchorMonth: '2026-03' } })), 100);
check('and its annual figure is the amount itself', itemAnnual(bill({ amount: 1200, rule: { kind: 'dayOfMonth', months: 12, day: 1, anchorMonth: '2026-03' } })), 1200);
check('every 4 weeks is 13 payments, not 12', itemAnnual(bill({ amount: 100, rule: everyNWeeks(4) })), 1300);

// --- A row written before the rule model ------------------------------------
// Its frequency is known because its owner chose it; only WHERE it lands is
// missing. It must keep counting rather than silently becoming zero.

{
  const legacy = bill({ amount: 100, rule: null, legacyCadence: 'weekly' });
  near('a legacy weekly row still counts at 4.33x', itemMonthly(legacy), 433.33);
  near('and its factor is reported', itemMonthlyFactor(legacy), 4.33333);
  check('the legacy table has not drifted from the rule model', LEGACY_CADENCE_MONTHLY.semimonthly, 2);
}
{
  const unknown = bill({ amount: 100, rule: null, legacyCadence: null });
  check('a row with neither contributes nothing rather than guessing', itemMonthly(unknown), 0);
  check('and says its factor is unknown', itemMonthlyFactor(unknown), null);
}

// --- The monthly summary ----------------------------------------------------

{
  const items = [
    bill({ direction: 'income', category: 'wages', amount: 2000, rule: everyNWeeks(2) }),
    bill({ category: 'housing', amount: 1400, rule: monthlyOn(1) }),
    bill({ category: 'electricity', amount: 90, rule: monthlyOn(12) }),
    bill({ category: 'car_insurance', amount: 720, rule: { kind: 'dayOfMonth', months: 6, day: 20, anchorMonth: '2026-02' } }),
    bill({ category: 'groceries', amount: 150, rule: weeklyOn(FRI) }),
    bill({ category: 'retirement', amount: 300, rule: monthlyOn(1) }),
    bill({ category: 'subscriptions', amount: 60, rule: monthlyOn(5), active: false }),
  ];
  const s = summarizeRecurring(items);

  near('income normalizes off an every-2-weeks paycheck', s.monthlyIncome, 4333.33);
  // 1400 + 90 + 120 (720/6) + 650 (150 * 52/12) = 2260
  near('committed excludes savings and the paused line', s.monthlyCommitted, 2260);
  check('savings is reported on its own', s.monthlySetAside, 300);
  near('what is left subtracts savings too', s.monthlyLeftOver, 4333.33 - 2260 - 300);
  check('a paused line is not counted', s.activeCount, 6);
  check('the biggest category leads', s.byCategory[0].category, 'housing');
  near('weekly groceries land at 650, not 600', s.byCategory.find((c) => c.category === 'groceries').monthly, 650);
  check('the biggest group leads', s.byGroup[0].group, 'home');
}

{
  // Savings must never read as an expense, or saving more looks like costs
  // rising, which would be exactly backwards.
  const s = summarizeRecurring([
    bill({ direction: 'income', category: 'wages', amount: 3000, rule: monthlyOn(1) }),
    bill({ category: 'savings', amount: 500, rule: monthlyOn(1) }),
  ]);
  check('saving is not committed spending', s.monthlyCommitted, 0);
  check('but it does come out of what is left', s.monthlyLeftOver, 2500);
  check('and it is named separately', s.monthlySetAside, 500);
}

check('an empty list summarizes to zero, not NaN', summarizeRecurring([]).monthlyLeftOver, 0);

// --- What is due soon, and what cannot be placed ---------------------------

{
  const items = [
    bill({ id: 'rent', category: 'housing', amount: 1400, rule: monthlyOn(1) }),
    bill({ id: 'power', category: 'electricity', amount: 90, rule: monthlyOn(12) }),
    bill({ id: 'gym', category: 'subscriptions', amount: 40, rule: { kind: 'nthWeekday', months: 1, week: 2, weekday: TUE } }),
    bill({ id: 'yearly', category: 'property_tax', amount: 900, rule: { kind: 'dayOfMonth', months: 12, day: 15, anchorMonth: '2027-03' } }),
    bill({ id: 'noanchor', category: 'phone', amount: 50, rule: { kind: 'everyNWeeks', weeks: 2, weekday: FRI, anchor: '' } }),
    bill({ id: 'norule', category: 'internet', amount: 70, rule: null, legacyCadence: 'weekly' }),
    bill({ id: 'off', category: 'pets', amount: 30, rule: monthlyOn(8), active: false }),
    bill({ id: 'pay', direction: 'income', category: 'wages', amount: 2000, rule: monthlyOn(10) }),
  ];
  const r = upcomingBills(items, '2026-09-05', 30);

  check('placeable bills, soonest first', r.bills.map((b) => b.item.id), ['gym', 'power', 'rent']);
  check('the 2nd Tuesday is nearest', r.bills[0].dueDate, '2026-09-08');
  check('rent rolls into next month', r.bills[2].dueDate, '2026-10-01');
  check('the window total adds only what is in it', r.total, 40 + 90 + 1400);
  checkTrue('a yearly bill months away is not in the window', !r.bills.some((b) => b.item.id === 'yearly'));
  checkTrue('nor is it wrongly called unplaceable', !r.needsSetup.some((i) => i.id === 'yearly'));
  check('bills that cannot be placed are named, not dropped', r.needsSetup.map((i) => i.id).sort(), ['noanchor', 'norule']);
  checkTrue('a paused bill is left out of both', !r.bills.some((b) => b.item.id === 'off') && !r.needsSetup.some((i) => i.id === 'off'));
  checkTrue('income is not a bill', !r.bills.some((b) => b.item.id === 'pay'));
}

{
  // The bug that prompted the rule model: a yearly bill appearing every
  // month. Checked here as well as in the schedule suite, because this is
  // the layer someone actually reads it from.
  const yearly = bill({ id: 'ins', amount: 900, rule: { kind: 'dayOfMonth', months: 12, day: 15, anchorMonth: '2026-03' } });
  check('not due in September', upcomingBills([yearly], '2026-09-05', 30).bills.length, 0);
  check('not due in April either', upcomingBills([yearly], '2026-04-01', 30).bills.length, 0);
  check('due in March', upcomingBills([yearly], '2026-03-01', 30).bills.map((b) => b.dueDate), ['2026-03-15']);
}

// --- Planned against actual, and the refusal to estimate --------------------

const NO_TRACKED = { grocerySpend: 0, groceryLinesWithoutPrice: 0, therapySpend: 0, therapySessionsWithoutCost: 0, kitchenCoveredLines: 0 };

{
  const recurring = [
    bill({ direction: 'income', category: 'wages', amount: 4000, rule: monthlyOn(1) }),
    bill({ category: 'housing', amount: 1400, rule: monthlyOn(1) }),
  ];
  const entries = [
    { occurredOn: '2026-09-02', direction: 'expense', amount: 42.5, category: 'dining_out' },
    { occurredOn: '2026-09-04', direction: 'expense', amount: 18, category: 'fuel' },
    { occurredOn: '2026-09-03', direction: 'income', amount: 200, category: 'other_income' },
    { occurredOn: '2026-08-30', direction: 'expense', amount: 999, category: 'dining_out' },
  ];
  const tracked = { grocerySpend: 210.4, groceryLinesWithoutPrice: 3, therapySpend: 80, therapySessionsWithoutCost: 1, kitchenCoveredLines: 6 };
  const p = buildMonthPicture('2026-09', recurring, entries, tracked);

  check('last month is not counted', p.loggedSpend, 60.5);
  check('logged income is separate from planned', p.loggedIncome, 200);
  near('known spend adds tracked money to logged money', p.knownSpendTotal, 350.9);
  check('missing amounts are counted, never filled in', p.incompleteRecords, 4);
  check('groceries reach the breakdown from their own table', p.byCategory.find((c) => c.category === 'groceries').monthly, 210.4);
  check('therapies too', p.byCategory.find((c) => c.category === 'therapies').monthly, 80);
  check('the largest category leads', p.byCategory[0].category, 'groceries');
  check('kitchen coverage stays a count', p.tracked.kitchenCoveredLines, 6);

  const text = describeMonthPicture(p);
  checkTrue('a partial total is called a floor', text.includes('floor rather than a total'));
  checkTrue('and says how many records are missing', text.includes('4 records'));
  checkTrue('no dollar figure is invented for kitchen coverage', !/\$\d+\.\d\d saved/.test(text));
}

{
  const p = buildMonthPicture(
    '2026-09',
    [bill({ direction: 'income', category: 'wages', amount: 3000, rule: monthlyOn(1) }), bill({ category: 'housing', amount: 1000 })],
    [{ occurredOn: '2026-09-02', direction: 'expense', amount: 50, category: 'fuel' }],
    NO_TRACKED,
  );
  const text = describeMonthPicture(p);
  checkTrue('a complete total is stated plainly', text.includes('Recorded spending this month is'));
  checkTrue('and does not call itself a floor', !text.includes('floor'));
  checkTrue('what is left over is named', text.includes('$2,000.00'));
}

{
  const p = buildMonthPicture(
    '2026-09',
    [bill({ direction: 'income', category: 'wages', amount: 2000, rule: monthlyOn(1) }), bill({ category: 'housing', amount: 2400 })],
    [], NO_TRACKED,
  );
  const text = describeMonthPicture(p);
  checkTrue('going over is said plainly', text.includes('more than your income'));
  checkTrue('by how much', text.includes('$400.00'));
}

checkTrue('an empty setup invites the first entry', describeMonthPicture(buildMonthPicture('2026-09', [], [], NO_TRACKED)).includes('Add what comes in'));
checkTrue('bills without income says so rather than showing a scary negative',
  describeMonthPicture(buildMonthPicture('2026-09', [bill({ category: 'housing', amount: 1000 })], [], NO_TRACKED)).includes('no income is'));

// --- Money formatting -------------------------------------------------------

check('thousands are separated', formatFinanceMoney(4333.33), '$4,333.33');
check('and millions', formatFinanceMoney(1234567.5), '$1,234,567.50');
check('small amounts keep two places', formatFinanceMoney(7.5), '$7.50');
check('zero', formatFinanceMoney(0), '$0.00');
check('negative sits outside the symbol', formatFinanceMoney(-250), '-$250.00');
check('rounding is to cents', formatFinanceMoney(0.005), '$0.01');

check('today', describeDaysAway(0), 'today');
check('tomorrow', describeDaysAway(1), 'tomorrow');
check('later', describeDaysAway(9), 'in 9 days');

// --- The category vocabulary ------------------------------------------------

check('groceries is flagged as already tracked', categories.getFinanceCategory('groceries').alreadyTracked, 'groceries');
check('therapies too', categories.getFinanceCategory('therapies').alreadyTracked, 'therapies');
checkTrue('rent is not', categories.getFinanceCategory('housing').alreadyTracked === undefined);
check('savings sits in the set-aside group', categories.financeCategoryGroup('savings'), 'setAside');
check('an unknown code degrades to other rather than throwing', categories.financeCategoryGroup('nonsense'), 'other');
check('an unknown code still gets a label', categories.financeCategoryLabel('nonsense'), 'nonsense');
checkTrue('every expense category has a real label', categories.FINANCE_EXPENSE_CATEGORIES.every((c) => c.label && c.code));
checkTrue('every income category does too', categories.FINANCE_INCOME_CATEGORIES.every((c) => c.label && c.code));
checkTrue('category codes are unique across both directions', (() => {
  const all = [...categories.FINANCE_EXPENSE_CATEGORIES, ...categories.FINANCE_INCOME_CATEGORIES].map((c) => c.code);
  return new Set(all).size === all.length;
})());

console.log(`${checks - failures}/${checks} checks passed`);
if (failures > 0) {
  console.error(`${failures} FAILED`);
  process.exit(1);
}
