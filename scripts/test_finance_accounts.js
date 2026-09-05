// Runs lib/financeAccounts.ts: net worth, budget limits, sinking funds, and
// the debt payoff simulation.
//
// Built 2026-09-05, pass 2 of the Finances rebuild.
//
// The payoff simulation carries almost all of the risk in this file. It is
// a month-by-month loop over compounding interest, and a wrong answer is a
// payoff date someone plans years around. Four things are checked hardest:
//
//  1. Avalanche is never beaten by snowball on interest. That is a
//     mathematical guarantee, so any case where it is means the simulation
//     is wrong, not that snowball got lucky.
//  2. A cleared debt's payment rolls into the next one. Without that both
//     strategies collapse into "pay the minimums" and every figure is far
//     too pessimistic.
//  3. Payments that do not cover interest are reported as never paying
//     off, not as a very large number of months, and never as an infinite
//     loop.
//  4. Signs. A credit card balance reduces net worth; an overdrawn
//     checking account also reduces it. Both are entered as the plain
//     number from a statement.
//
// Run with: node scripts/test_finance_accounts.js
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
const A = loadModule('lib/financeAccounts.ts', { financeCategories: categories });

const {
  netWorth, isLiability, accountKindLabel, ACCOUNT_KINDS,
  budgetProgress, sinkingFund,
  simulatePayoff, comparePayoffStrategies, describePayoff,
  accountKind, carriesMinimumPayment, rateKindFor,
  carryCost, totalMonthlyInterest, measuredChange, describeMeasuredChange,
  MIN_DAYS_FOR_MEASURED_CHANGE,
  formatAccountMoney, isSetAsideCategory,
} = A;

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
function near(label, actual, expected, tol = 0.5) {
  checks += 1;
  if (typeof actual !== 'number' || Math.abs(actual - expected) > tol) {
    failures += 1;
    console.error(`FAIL  ${label}\n      expected ~${expected}\n      got       ${actual}`);
  }
}
function checkTrue(label, actual) { check(label, actual === true, true); }

function acct(over = {}) {
  return { id: Math.random().toString(36).slice(2), name: 'Account', kind: 'checking', balance: 0, apr: null, minimumPayment: null, active: true, ...over };
}
function debt(over = {}) {
  return { id: over.id || Math.random().toString(36).slice(2), name: 'Debt', balance: 1000, apr: 12, minimumPayment: 50, ...over };
}

// --- 1. Net worth, and the signs -------------------------------------------

{
  const n = netWorth([
    acct({ kind: 'checking', balance: 2400 }),
    acct({ kind: 'savings', balance: 8000 }),
    acct({ kind: 'credit_card', balance: 1200 }),
    acct({ kind: 'mortgage', balance: 180000 }),
    acct({ kind: 'property', balance: 240000 }),
  ]);
  check('assets add up', n.assets, 250400);
  check('liabilities add up', n.liabilities, 181200);
  check('net worth is the difference', n.net, 69200);
  check('assets counted', n.assetCount, 3);
  check('liabilities counted', n.liabilityCount, 2);
}
{
  // A credit card balance is entered as the plain number from the
  // statement and still reduces net worth.
  check('a card alone is negative net worth', netWorth([acct({ kind: 'credit_card', balance: 500 })]).net, -500);
  // An overdrawn checking account is an asset with a negative balance, and
  // has to reduce net worth by the same amount rather than increase it.
  check('an overdrawn account reduces net worth', netWorth([acct({ kind: 'checking', balance: -50 })]).net, -50);
  // A card in credit means they owe you.
  check('a card in credit adds to net worth', netWorth([acct({ kind: 'credit_card', balance: -100 })]).net, 100);
}
{
  check('a closed account is left out', netWorth([acct({ kind: 'savings', balance: 500, active: false })]).net, 0);
  check('nothing at all is zero, not NaN', netWorth([]).net, 0);
}

// The rate line is NOT the asset/liability line, and the two cases that
// prove it are the ones most likely to get quietly re-conflated: savings
// is an asset WITH a stated rate, and retirement is an asset with none.
check('savings has a stated rate even though it is an asset', accountKind('savings').rateKind, 'stated');
check('retirement has no rate to enter', accountKind('retirement').rateKind, 'market');
check('checking has no rate at all', accountKind('checking').rateKind, 'none');
checkTrue('every liability is asked for a rate', ACCOUNT_KINDS.filter((k) => k.side === 'liability').every((k) => k.rateKind === 'stated'));
checkTrue('no market-rate account is ever asked for one', ACCOUNT_KINDS.filter((k) => k.rateKind === 'market').every((k) => k.side === 'asset'));
checkTrue('only liabilities carry a minimum payment', ACCOUNT_KINDS.every((k) => carriesMinimumPayment(k.code) === (k.side === 'liability')));
check('an unknown kind is not assumed to have a rate', rateKindFor('nonsense'), 'none');
check('a card is a liability', isLiability('credit_card'), true);
check('savings is not', isLiability('savings'), false);
check('an unknown kind is not assumed to be debt', isLiability('nonsense'), false);
check('an unknown kind still gets a label', accountKindLabel('nonsense'), 'nonsense');

// --- 2. Budget limits -------------------------------------------------------

{
  const b = budgetProgress({ category: 'groceries', limit: 400, spent: 260, committed: 0 });
  check('remaining', b.remaining, 140);
  check('fraction for a bar', b.fraction, 0.65);
  check('not overspent', b.overspent, false);
}
{
  const b = budgetProgress({ category: 'groceries', limit: 400, spent: 470, committed: 0 });
  check('overspending is flagged', b.overspent, true);
  check('remaining goes negative rather than clamping to zero', b.remaining, -70);
  check('but the bar does not overflow', b.fraction, 1);
}
{
  // Committed and spent are deliberately separate. Adding them would
  // double-count the month a bill is both committed and recorded as paid.
  const b = budgetProgress({ category: 'subscriptions', limit: 50, spent: 10, committed: 80 });
  check('spending alone is under the limit', b.overspent, false);
  check('but the bills alone already break it', b.committedAlone, true);
  check('and committed is not folded into spent', b.spent, 10);
}
{
  const b = budgetProgress({ category: 'x', limit: 0, spent: 10, committed: 0 });
  check('a zero limit does not divide by zero', b.fraction, 0);
}

check('savings is a set-aside category', isSetAsideCategory('savings'), true);
check('groceries is not', isSetAsideCategory('groceries'), false);

// --- 3. Sinking funds -------------------------------------------------------

{
  const f = sinkingFund({ name: 'Car insurance', amount: 900, monthsBetween: 6, nextDue: '2026-12-01', today: '2026-09-05' });
  check('monthly set-aside is the bill split over its cycle', f.monthlySetAside, 150);
  check('months until due', f.monthsUntilDue, 3);
  // Three months of the six-month cycle have passed, so half should be by.
  check('what ought to be put by already', f.shouldHaveByNow, 450);
}
{
  const f = sinkingFund({ name: 'Property tax', amount: 2400, monthsBetween: 12, nextDue: '2026-10-01', today: '2026-09-05' });
  check('a yearly bill spreads over twelve', f.monthlySetAside, 200);
  check('due next month means eleven months should be by', f.shouldHaveByNow, 2200);
}
{
  const f = sinkingFund({ name: 'Due now', amount: 600, monthsBetween: 6, nextDue: '2026-09-20', today: '2026-09-05' });
  check('due this month means the whole amount should be by', f.shouldHaveByNow, 600);
  check('and it never exceeds the bill itself', f.shouldHaveByNow <= f.amount, true);
}
{
  const f = sinkingFund({ name: 'Unknown', amount: 600, monthsBetween: 12, nextDue: null, today: '2026-09-05' });
  check('a monthly figure is still given without a date', f.monthlySetAside, 50);
  check('but what should be by now is unknown rather than guessed', f.shouldHaveByNow, null);
}

// --- 4. Debt payoff ---------------------------------------------------------

{
  const r = simulatePayoff([], 100, 'avalanche');
  check('no debt clears in zero months', r.months, 0);
  check('with no interest', r.totalInterest, 0);
}
{
  // One debt, no interest, clean arithmetic: $1,200 at $100 a month is 12
  // months exactly.
  const r = simulatePayoff([debt({ balance: 1200, apr: 0, minimumPayment: 100 })], 0, 'avalanche');
  check('a zero-rate debt takes exactly the arithmetic', r.months, 12);
  check('and costs nothing in interest', Math.round(r.totalInterest), 0);
}
{
  const r = simulatePayoff([debt({ balance: 1200, apr: 0, minimumPayment: 100 })], 100, 'avalanche');
  check('doubling the payment halves the time', r.months, 6);
}
{
  // Interest makes it take longer than the plain division.
  const r = simulatePayoff([debt({ balance: 5000, apr: 18, minimumPayment: 200 })], 0, 'avalanche');
  checkTrue('interest pushes it past the 25 months plain division suggests', r.months > 25);
  checkTrue('but it still clears', r.months != null && !r.neverPaysOff);
  checkTrue('and interest is a real cost', r.totalInterest > 500);
}

{
  // The rolling payment. Two debts, and once the first clears its payment
  // must go to the second, or both strategies are just "pay the minimums".
  const debts = [
    debt({ id: 'small', name: 'Card', balance: 1000, apr: 0, minimumPayment: 100 }),
    debt({ id: 'big', name: 'Loan', balance: 2000, apr: 0, minimumPayment: 100 }),
  ];
  const r = simulatePayoff(debts, 0, 'snowball');
  // Total $3,000 at $200/month with no interest is 15 months, which only
  // happens if the cleared debt's $100 rolls onward.
  check('a cleared payment rolls into the next debt', r.months, 15);
  check('the smallest balance clears first under snowball', r.order[0].name, 'Card');
  check('both are eventually cleared', r.order.length, 2);
}
{
  // The two strategies only diverge when the smallest balance is NOT also
  // the highest rate, so the fixture is built to separate them: the small
  // debt is cheap and the large one is expensive. There also has to be
  // extra money, because with equal minimums and nothing spare both
  // strategies pay every debt the same and clear them in the same order
  // regardless of which is targeted.
  const debts = [
    debt({ id: 'small', name: 'Card', balance: 1000, apr: 5, minimumPayment: 100 }),
    debt({ id: 'big', name: 'Loan', balance: 2000, apr: 25, minimumPayment: 100 }),
  ];
  check('the highest rate clears first under avalanche',
    simulatePayoff(debts, 300, 'avalanche').order[0].name, 'Loan');
  check('the smallest balance clears first under snowball',
    simulatePayoff(debts, 300, 'snowball').order[0].name, 'Card');
}

{
  // The guarantee: avalanche can never cost more interest than snowball.
  // If it ever does, the simulation is wrong.
  // Deliberately built so the orders differ. A first attempt used a store
  // card that was both the highest rate AND the smallest balance, which
  // made both strategies pick the identical order and produce identical
  // interest. That was a bad fixture rather than a bug, and it would have
  // passed a weaker assertion while testing nothing.
  const debts = [
    debt({ id: 'a', name: 'Store card', balance: 1200, apr: 3, minimumPayment: 40 }),
    debt({ id: 'b', name: 'Credit line', balance: 11000, apr: 24.99, minimumPayment: 280 }),
    debt({ id: 'c', name: 'Student', balance: 6000, apr: 5.5, minimumPayment: 120 }),
  ];
  const c = comparePayoffStrategies(debts, 200);
  check('avalanche targets the expensive debt', c.avalanche.order[0].name, 'Credit line');
  check('snowball targets the small one', c.snowball.order[0].name, 'Store card');
  checkTrue('and the orders genuinely differ', c.avalanche.order[0].name !== c.snowball.order[0].name);
  checkTrue('so avalanche saves real money here', c.interestSavedByAvalanche > 100);
  checkTrue('avalanche never costs more interest than snowball', c.avalanche.totalInterest <= c.snowball.totalInterest + 0.01);
  checkTrue('the saving is reported as a positive number', c.interestSavedByAvalanche >= 0);
  checkTrue('both clear', c.avalanche.months != null && c.snowball.months != null);
  checkTrue('every debt appears in the payoff order', c.avalanche.order.length === 3);
  checkTrue('cleared months are in ascending order',
    c.avalanche.order.every((step, i, all) => i === 0 || step.clearedInMonth >= all[i - 1].clearedInMonth));

  const text = describePayoff(c);
  checkTrue('the wording names both orders', text.includes('Highest rate first') && text.includes('Smallest balance first'));
  checkTrue('and does not tell someone which to pick', !/you should|we recommend/i.test(text));

  // The same amount goes out each month either way, which makes it easy to
  // assume both orders finish together. They do not, because paying less
  // interest leaves less to pay, so time has to be reported and not
  // assumed equal.
  checkTrue('the cheaper order also finishes sooner here', c.avalanche.months < c.snowball.months);
  checkTrue(
    'and the wording says how many months sooner',
    text.includes(`${c.snowball.months - c.avalanche.months} months sooner`),
  );

  // The real trade-off, stated as a month rather than as a feeling.
  checkTrue('snowball clears its first debt sooner here', c.snowball.order[0].clearedInMonth < c.avalanche.order[0].clearedInMonth);
  checkTrue(
    'and the wording names both months',
    text.includes(`month ${c.snowball.order[0].clearedInMonth}`) && text.includes(`month ${c.avalanche.order[0].clearedInMonth}`),
  );
}

{
  // One debt, so both orders are the same plan. Nothing should be claimed
  // about clearing anything sooner, because nothing does.
  const single = comparePayoffStrategies([debt({ id: 'a', name: 'Card', balance: 1200, apr: 18, minimumPayment: 60 })], 100);
  check('one debt clears at the same speed either way', single.avalanche.months, single.snowball.months);
  check('and there is no interest difference to report', single.interestSavedByAvalanche, 0);
  checkTrue('so the wording says either order will do', /Either order/.test(describePayoff(single)));
}

{
  // Minimum payments below the monthly interest. This must be reported,
  // not looped over forever and not returned as a huge month count.
  const stuck = simulatePayoff([debt({ id: 's', name: 'Payday loan', balance: 5000, apr: 60, minimumPayment: 40 })], 0, 'avalanche');
  check('it is reported as never paying off', stuck.neverPaysOff, true);
  check('months is unknown rather than enormous', stuck.months, null);
  check('and so is the interest', stuck.totalInterest, null);
  check('the debt that is stuck is named', stuck.stuckDebts, ['Payday loan']);

  const text = describePayoff(comparePayoffStrategies([debt({ id: 's', name: 'Payday loan', balance: 5000, apr: 60, minimumPayment: 40 })], 0));
  checkTrue('the wording says what would change it', text.includes('Raising the payment'));
  checkTrue('and names the debt', text.includes('Payday loan'));
}
{
  // The same debt with enough extra put at it does clear, which confirms
  // the stuck detection is about the payment and not a broken loop.
  const freed = simulatePayoff([debt({ id: 's', name: 'Payday loan', balance: 5000, apr: 60, minimumPayment: 40 })], 400, 'avalanche');
  check('more money at it clears it', freed.neverPaysOff, false);
  checkTrue('in a plausible number of months', freed.months > 0 && freed.months < 60);
}
{
  // A zero balance is not a debt.
  const r = simulatePayoff([debt({ balance: 0, minimumPayment: 50 })], 100, 'avalanche');
  check('an already-cleared debt is ignored', r.months, 0);
}

// --- 6. What a rate is doing right now --------------------------------------

{
  // A card at 24.99% on 4,200. This is the number that turns a balance into
  // a bill, so it has to match a statement's own simple monthly finance
  // charge rather than a compounded effective rate. A figure that argued
  // with the paper in someone's hand would be worse than none.
  const cost = carryCost({ balance: 4200, apr: 24.99, side: 'liability' });
  checkTrue('a card with a rate has a carry cost', cost !== null);
  check('the yearly figure is balance times rate', Math.round(cost.yearly * 100) / 100, 1049.58);
  check('and the monthly figure is that over twelve', Math.round(cost.monthly * 100) / 100, 87.46);
  check('a debt costs rather than earns', cost.direction, 'costs');

  const earns = carryCost({ balance: 10000, apr: 4.5, side: 'asset' });
  check('savings earns rather than costs', earns.direction, 'earns');
  check('and the amount is a plain positive number', Math.round(earns.monthly * 100) / 100, 37.5);
}
{
  // Every refusal. Each of these would otherwise produce a confident wrong
  // number instead of an obviously missing one.
  check('no rate means no figure rather than zero interest', carryCost({ balance: 4200, apr: null, side: 'liability' }), null);
  check('a zero rate is not reported as a cost', carryCost({ balance: 4200, apr: 0, side: 'liability' }), null);
  check('a cleared balance costs nothing', carryCost({ balance: 0, apr: 24.99, side: 'liability' }), null);
  check('a card in credit is not reported as earning interest', carryCost({ balance: -100, apr: 24.99, side: 'liability' }), null);
}
{
  const accounts = [
    acct({ id: 'a', kind: 'credit_card', balance: 4200, apr: 24.99 }),
    acct({ id: 'b', kind: 'auto_loan', balance: 12000, apr: 6 }),
    acct({ id: 'c', kind: 'medical_debt', balance: 800, apr: null }),
    acct({ id: 'd', kind: 'savings', balance: 9000, apr: 4.5 }),
    acct({ id: 'e', kind: 'credit_card', balance: 3000, apr: 20, active: false }),
  ];
  const total = totalMonthlyInterest(accounts);
  check('two debts have a rate to count', total.countedAccounts, 2);
  check('the one without a rate is named rather than counted as free', total.missingRate, 1);
  check('the total is those two and nothing else', Math.round(total.monthly * 100) / 100, 147.46);
  checkTrue(
    'a paused debt is left out',
    total.monthly === totalMonthlyInterest(accounts.filter((a) => a.id !== 'e')).monthly,
  );
  checkTrue(
    'savings interest never lands in the debt total',
    total.monthly === totalMonthlyInterest(accounts.filter((a) => a.id !== 'd')).monthly,
  );
}

// --- 7. Measured change, for accounts with no stated rate -------------------

const point = (date, balance, contribution = 0) => ({ date, balance, contribution });

{
  // The case the whole thing exists for, and the one most likely to be
  // reported wrongly: money paid in looks exactly like growth.
  const raw = measuredChange([point('2026-03-01', 40000), point('2026-09-01', 46000)]);
  checkTrue('two points a few months apart can be measured', raw !== null);
  check('and the span is counted in real days', raw.days, 184);
  check('with no contribution recorded it is not called a return', raw.isReturn, false);
  check('so the whole rise is reported as the change', raw.gain, 6000);
  checkTrue('and the wording says contributions are in it', describeMeasuredChange(raw).includes('anything you paid in'));
  checkTrue('it never calls itself a return', !/a return\b/.test(describeMeasuredChange(raw).replace('rather than a return', '')));

  // Same balances, but 5,000 of the rise was money paid in. The real return
  // is a sixth of what the raw change suggests.
  const real = measuredChange([point('2026-03-01', 40000), point('2026-09-01', 46000, 5000)]);
  check('a recorded contribution makes it a return', real.isReturn, true);
  check('and it is taken out of the growth', real.gain, 1000);
  checkTrue('so the rate is far below the raw change', real.annualizedPercent < raw.annualizedPercent / 4);
  checkTrue('the wording says what was put in', describeMeasuredChange(real).includes('you put in'));
}
{
  // A withdrawal is the same mechanism in reverse: a balance that fell can
  // still have grown.
  const drawn = measuredChange([point('2026-01-01', 20000), point('2026-07-01', 18000, -4000)]);
  check('money taken out is added back before measuring', drawn.gain, 2000);
  checkTrue('so a falling balance can still read as growth', drawn.annualizedPercent > 0);
  checkTrue('and the wording says it was taken out', describeMeasuredChange(drawn).includes('you took out'));
}
{
  const loss = measuredChange([point('2026-01-01', 20000), point('2026-07-01', 17000)]);
  checkTrue('a real loss is reported as a loss', loss.gain < 0 && loss.annualizedPercent < 0);
  checkTrue('and the rate carries the direction too', describeMeasuredChange(loss).includes('a fall of about'));
  checkTrue('so it is never dressed up as a rise', !describeMeasuredChange(loss).includes('a rise'));
}
{
  // Every refusal. Each would otherwise produce a number that looks
  // authoritative and means nothing.
  check('one point is not a trend', measuredChange([point('2026-03-01', 40000)]), null);
  check('no points at all', measuredChange([]), null);
  check('a few days cannot be annualized', measuredChange([point('2026-03-01', 40000), point('2026-03-08', 41000)]), null);
  check('a starting balance of zero has no ratio to grow by', measuredChange([point('2026-03-01', 0), point('2026-09-01', 5000)]), null);
  checkTrue('the day floor is a real month rather than a token gap', MIN_DAYS_FOR_MEASURED_CHANGE >= 28);
}
{
  // Points arriving out of order must not invert the measurement, since
  // the first and last are what the whole calculation rests on.
  const shuffled = measuredChange([point('2026-09-01', 46000), point('2026-03-01', 40000), point('2026-06-01', 43000)]);
  check('the earliest point is the start whatever order they arrive in', shuffled.startBalance, 40000);
  check('and the latest is the end', shuffled.endBalance, 46000);
}

// --- 5. Money formatting ----------------------------------------------------

check('thousands separated', formatAccountMoney(69200), '$69,200.00');
check('negative net worth reads as negative', formatAccountMoney(-1200.5), '-$1,200.50');
check('zero', formatAccountMoney(0), '$0.00');

console.log(`${checks - failures}/${checks} checks passed`);
if (failures > 0) {
  console.error(`${failures} FAILED`);
  process.exit(1);
}
