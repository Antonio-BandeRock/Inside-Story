// Runs lib/financeCore.ts against the cases that decide what Finances
// tells someone about their own money.
//
// Built 2026-09-05 with the Life tab's first area.
//
// Every failure mode here is a silently wrong NUMBER rather than a crash,
// which is why this file exists at all, and the numbers are ones someone
// plans a month around. Three areas carry almost all of the risk and are
// covered hardest:
//
//  1. Cadence normalization. Weekly is 52/12 a month, not 4. Biweekly (26
//     a year) and semimonthly (24 a year) look interchangeable and are
//     not. Getting either wrong understates a year by thousands and looks
//     entirely reasonable on screen.
//  2. Day-of-month due dates. A bill due on the 31st has to land on the
//     30th in April and the 28th in February; unclamped it produces
//     2026-02-31, which downstream either rejects or rolls into March.
//  3. The refusal to estimate. A grocery line with no price and a therapy
//     session with no cost must never be filled in, and a total built over
//     them must say how many are missing.
//
// Run with: node scripts/test_finance_math.js
// Exits non-zero on any failure.

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

// financeCore imports financeCategories, so both are transpiled and the
// import is resolved by hand rather than pulling in a module loader.
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
const core = loadModule('lib/financeCore.ts', { financeCategories: categories });

const {
  MONTHLY_FACTOR, ANNUAL_FACTOR, toMonthly, toAnnual,
  nextDueDate, daysInMonth, daysBetween, monthKey,
  summarizeRecurring, upcomingBills, buildMonthPicture,
  describeMonthPicture, formatFinanceMoney, describeDaysAway,
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
function near(label, actual, expected, tolerance = 0.005) {
  checks += 1;
  if (typeof actual !== 'number' || Math.abs(actual - expected) > tolerance) {
    failures += 1;
    console.error(`FAIL  ${label}`);
    console.error(`      expected ~${expected}`);
    console.error(`      got       ${actual}`);
  }
}
function checkTrue(label, actual) { check(label, actual === true, true); }

function bill(over, extra = {}) {
  return {
    id: extra.id || Math.random().toString(36).slice(2),
    direction: 'expense', name: 'Bill', category: 'other_expense',
    amount: 100, cadence: 'monthly', dueDay: null, autopay: false, active: true,
    ...over, ...extra,
  };
}

// --- 1. Cadence normalization ----------------------------------------------
// The heart of it. A month is not four weeks.

near('weekly is 52/12 a month, not 4', MONTHLY_FACTOR.weekly, 4.33333);
near('every 2 weeks is 26/12 a month, not 2', MONTHLY_FACTOR.biweekly, 2.16667);
check('twice a month is exactly 2', MONTHLY_FACTOR.semimonthly, 2);
check('monthly is 1', MONTHLY_FACTOR.monthly, 1);
near('quarterly is a third of a month', MONTHLY_FACTOR.quarterly, 0.33333);
near('twice a year is a sixth', MONTHLY_FACTOR.semiannual, 0.16667);
near('yearly is a twelfth', MONTHLY_FACTOR.annual, 0.08333);

// The error this guards against, stated as money: a $100 weekly bill.
near('$100 weekly is $433.33 a month, not $400', toMonthly(100, 'weekly'), 433.33);
check('$100 weekly is $5,200 a year', toAnnual(100, 'weekly'), 5200);
checkTrue('the naive x4 answer would understate the year by $400', toAnnual(100, 'weekly') - 100 * 4 * 12 === 400);

// Biweekly vs semimonthly, the pair that looks identical and is not.
check('every 2 weeks is 26 payments a year', ANNUAL_FACTOR.biweekly, 26);
check('twice a month is 24 payments a year', ANNUAL_FACTOR.semimonthly, 24);
checkTrue('so they differ by two whole payments a year', ANNUAL_FACTOR.biweekly - ANNUAL_FACTOR.semimonthly === 2);
near('a $1,500 biweekly paycheck is $3,250 a month', toMonthly(1500, 'biweekly'), 3250);
check('the same amount twice a month is $3,000', toMonthly(1500, 'semimonthly'), 3000);

// --- 2. Due dates, and the month-length clamp -------------------------------

check('January has 31 days', daysInMonth(2026, 1), 31);
check('April has 30', daysInMonth(2026, 4), 30);
check('February 2026 has 28', daysInMonth(2026, 2), 28);
check('February 2028 has 29 (leap year)', daysInMonth(2028, 2), 29);

check('a due day later this month lands this month', nextDueDate(15, '2026-09-05'), '2026-09-15');
check('the due day itself counts as due today', nextDueDate(5, '2026-09-05'), '2026-09-05');
check('a due day already past rolls to next month', nextDueDate(1, '2026-09-05'), '2026-10-01');

// The clamp. Without it these produce impossible dates.
check('the 31st in a 30-day month clamps to the 30th', nextDueDate(31, '2026-04-10'), '2026-04-30');
check('the 31st rolling into February clamps to the 28th', nextDueDate(31, '2026-02-01'), '2026-02-28');
check('the 30th in February clamps too', nextDueDate(30, '2026-02-15'), '2026-02-28');
check('February in a leap year clamps to the 29th', nextDueDate(31, '2028-02-01'), '2028-02-29');
check('rolling from January 31 lands on February 28', nextDueDate(31, '2026-01-31'), '2026-01-31');
check('December rolls into the next year', nextDueDate(3, '2026-12-10'), '2027-01-03');

check('no due day means no date, not a guessed one', nextDueDate(null, '2026-09-05'), null);
check('a nonsense due day is refused', nextDueDate(45, '2026-09-05'), null);
check('a nonsense from-date is refused', nextDueDate(15, 'not-a-date'), null);
check('a date that does not exist is refused', nextDueDate(15, '2026-02-30'), null);

check('days between two dates', daysBetween('2026-09-05', '2026-09-15'), 10);
check('days across a month boundary', daysBetween('2026-09-28', '2026-10-02'), 4);
check('month key', monthKey('2026-09-05'), '2026-09');

// --- 3. The monthly summary -------------------------------------------------

{
  const items = [
    bill({ direction: 'income', category: 'wages', amount: 2000, cadence: 'biweekly' }),
    bill({ category: 'housing', amount: 1400, cadence: 'monthly' }),
    bill({ category: 'electricity', amount: 90, cadence: 'monthly' }),
    bill({ category: 'car_insurance', amount: 720, cadence: 'semiannual' }),
    bill({ category: 'groceries', amount: 150, cadence: 'weekly' }),
    bill({ category: 'retirement', amount: 300, cadence: 'monthly' }),
    bill({ category: 'subscriptions', amount: 60, cadence: 'monthly', active: false }),
  ];
  const s = summarizeRecurring(items);

  near('income normalizes off a biweekly paycheck', s.monthlyIncome, 4333.33);
  // 1400 + 90 + 120 (720/6) + 650 (150 * 52/12) = 2260
  near('committed excludes savings and the inactive line', s.monthlyCommitted, 2260);
  check('savings is reported on its own', s.monthlySetAside, 300);
  near('what is left subtracts savings too', s.monthlyLeftOver, 4333.33 - 2260 - 300);
  check('an inactive line is not counted', s.activeCount, 6);
  check('the biggest category leads', s.byCategory[0].category, 'housing');
  near('weekly groceries land at 650, not 600', s.byCategory.find((c) => c.category === 'groceries').monthly, 650);
  check('the biggest group leads', s.byGroup[0].group, 'home');
}

{
  // Savings must never read as an expense, or saving more looks like
  // costs rising.
  const s = summarizeRecurring([
    bill({ direction: 'income', category: 'wages', amount: 3000, cadence: 'monthly' }),
    bill({ category: 'savings', amount: 500, cadence: 'monthly' }),
  ]);
  check('saving is not committed spending', s.monthlyCommitted, 0);
  check('but it does come out of what is left', s.monthlyLeftOver, 2500);
  check('and it is named', s.monthlySetAside, 500);
}

check('an empty list summarizes to zero, not NaN', summarizeRecurring([]).monthlyLeftOver, 0);

// --- 4. What is due soon ----------------------------------------------------

{
  const items = [
    bill({ id: 'rent', category: 'housing', amount: 1400, dueDay: 1 }),
    bill({ id: 'power', category: 'electricity', amount: 90, dueDay: 12 }),
    bill({ id: 'far', category: 'internet', amount: 70, dueDay: 28 }),
    bill({ id: 'weekly', category: 'groceries', amount: 150, cadence: 'weekly', dueDay: null }),
    bill({ id: 'off', category: 'phone', amount: 50, dueDay: 8, active: false }),
    bill({ id: 'pay', direction: 'income', category: 'wages', amount: 2000, dueDay: 10 }),
  ];
  // 30 days, wide enough to reach a bill whose day-of-month has already
  // passed and therefore rolls into next month.
  const soon = upcomingBills(items, '2026-09-05', 30);

  check('three bills land inside the window, soonest first', soon.map((b) => b.item.id), ['power', 'far', 'rent']);
  check('the nearest is 7 days out', soon[0].daysAway, 7);
  check('rent rolls to next month', soon[2].dueDate, '2026-10-01');
  check('and is 26 days away, not negative', soon[2].daysAway, 26);
  checkTrue('a cadence with no due day is left out rather than guessed', !soon.some((b) => b.item.id === 'weekly'));
  checkTrue('an inactive bill is left out', !soon.some((b) => b.item.id === 'off'));
  checkTrue('income is not a bill', !soon.some((b) => b.item.id === 'pay'));
}

// --- 5. Planned against actual, and the refusal to estimate -----------------

const NO_TRACKED = { grocerySpend: 0, groceryLinesWithoutPrice: 0, therapySpend: 0, therapySessionsWithoutCost: 0, kitchenCoveredLines: 0 };

{
  const recurring = [
    bill({ direction: 'income', category: 'wages', amount: 4000, cadence: 'monthly' }),
    bill({ category: 'housing', amount: 1400, cadence: 'monthly' }),
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
  // Nothing missing: the wording must stop hedging.
  const p = buildMonthPicture(
    '2026-09',
    [bill({ direction: 'income', category: 'wages', amount: 3000, cadence: 'monthly' }), bill({ category: 'housing', amount: 1000 })],
    [{ occurredOn: '2026-09-02', direction: 'expense', amount: 50, category: 'fuel' }],
    NO_TRACKED,
  );
  const text = describeMonthPicture(p);
  checkTrue('a complete total is stated plainly', text.includes('Recorded spending this month is'));
  checkTrue('and does not call itself a floor', !text.includes('floor'));
  checkTrue('what is left over is named', text.includes('$2,000.00'));
}

{
  // Bills exceeding income is the case a person most needs stated clearly.
  const p = buildMonthPicture(
    '2026-09',
    [bill({ direction: 'income', category: 'wages', amount: 2000, cadence: 'monthly' }), bill({ category: 'housing', amount: 2400 })],
    [], NO_TRACKED,
  );
  const text = describeMonthPicture(p);
  checkTrue('going over is said plainly', text.includes('more than your income'));
  checkTrue('by how much', text.includes('$400.00'));
}

{
  const p = buildMonthPicture('2026-09', [], [], NO_TRACKED);
  checkTrue('an empty setup invites the first entry', describeMonthPicture(p).includes('Add what comes in'));
}

{
  const p = buildMonthPicture('2026-09', [bill({ category: 'housing', amount: 1000 })], [], NO_TRACKED);
  checkTrue('bills without income says so rather than showing a scary negative', describeMonthPicture(p).includes('no income is'));
}

// --- 6. Money formatting ----------------------------------------------------

check('thousands are separated', formatFinanceMoney(4333.33), '$4,333.33');
check('and millions', formatFinanceMoney(1234567.5), '$1,234,567.50');
check('small amounts keep two places', formatFinanceMoney(7.5), '$7.50');
check('zero', formatFinanceMoney(0), '$0.00');
check('negative sits outside the symbol', formatFinanceMoney(-250), '-$250.00');
check('rounding is to cents', formatFinanceMoney(0.005), '$0.01');

check('today', describeDaysAway(0), 'today');
check('tomorrow', describeDaysAway(1), 'tomorrow');
check('later', describeDaysAway(9), 'in 9 days');

// --- 7. The category vocabulary --------------------------------------------

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
checkTrue('every cadence has a monthly factor', categories.FINANCE_CADENCES.every((c) => typeof MONTHLY_FACTOR[c] === 'number'));
checkTrue('every cadence says whether it has a due day', categories.FINANCE_CADENCES.every((c) => typeof categories.CADENCE_HAS_DUE_DAY[c] === 'boolean'));
checkTrue('the cadences without a due day are the drifting ones',
  ['weekly', 'biweekly', 'semimonthly'].every((c) => categories.CADENCE_HAS_DUE_DAY[c] === false));

console.log(`${checks - failures}/${checks} checks passed`);
if (failures > 0) {
  console.error(`${failures} FAILED`);
  process.exit(1);
}
