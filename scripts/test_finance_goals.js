// Runs lib/financeGoals.ts: goal costs across money, time and goods.
//
// Built 2026-09-05, pass 3 of the Finances rebuild.
//
// Almost all of the risk here is one temptation: collapsing costs of
// different kinds into a single number. A goal needing $500 and 20 hours,
// with $250 and 10 hours in, is NOT 50% done, and $500 with no hours is
// not 50% either. Any single percentage for a goal would be inventing one
// figure out of two honest ones. So the checks weigh hardest on:
//
//  1. No blended percentage exists. A goal reports met-count and which
//     line is furthest behind, and nothing else.
//  2. "Furthest behind" is by SHARE, not amount, because 40 hours short
//     and $40 short are not orderable and 90% short and 10% short are.
//  3. Money is the only kind that gets summed across goals, precisely
//     because it is the only kind measured in one unit.
//  4. Pace refuses without a date rather than returning zero, and handles
//     a date this month without dividing by zero.
//
// Run with: node scripts/test_finance_goals.js
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

const G = loadModule('lib/financeGoals.ts');
const {
  GOAL_COST_KINDS, goalCostKindLabel, defaultUnitFor,
  costProgress, goalProgress, pace, isPaceRefusal,
  formatGoalAmount, describeCostProgress, describePace, describeGoalProgress,
  summarizeGoals, describeGoalsSummary,
} = G;

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

let costSeq = 0;
function cost(over = {}) {
  costSeq += 1;
  return { id: `c${costSeq}`, goalId: 'g1', kind: 'money', label: 'Cost', target: 100, unit: '', ...over };
}
function goal(over = {}) {
  return { id: 'g1', name: 'Goal', reason: null, targetDate: null, status: 'active', ...over };
}

// --- 1. One cost line at a time ---------------------------------------------

{
  const p = costProgress(cost({ target: 500 }), 125);
  check('remaining', p.remaining, 375);
  check('fraction for a bar', p.fraction, 0.25);
  check('not met', p.met, false);
  check('nothing over', p.over, 0);
}
{
  const p = costProgress(cost({ target: 500 }), 500);
  check('exactly on target counts as met', p.met, true);
  check('and nothing is left', p.remaining, 0);
}
{
  const p = costProgress(cost({ target: 500 }), 640);
  check('past target is still met', p.met, true);
  check('the bar does not overflow', p.fraction, 1);
  check('and the excess is kept rather than hidden', p.over, 140);
  check('remaining never goes negative', p.remaining, 0);
}
{
  // A target of zero is not a goal that is instantly complete; it is a
  // line nobody has costed yet, and calling it met would mark a goal done.
  const p = costProgress(cost({ target: 0 }), 0);
  check('a zero target is not met', p.met, false);
  check('and does not divide by zero', p.fraction, 0);
}

// --- 2. A goal never gets one percentage ------------------------------------

{
  // The case the whole file exists for: half the money and half the hours
  // is two facts, not "50% done".
  const money = costProgress(cost({ kind: 'money', label: 'Lumber', target: 500 }), 250);
  const time = costProgress(cost({ kind: 'time', label: 'Building it', target: 20, unit: 'hours' }), 10);
  const p = goalProgress(goal(), [money, time]);
  check('neither line is met', p.costsMet, 0);
  check('both lines are counted', p.costsTotal, 2);
  check('so the goal is not done', p.allMet, false);
  checkTrue('no blended percentage is exposed anywhere on the goal',
    !('fraction' in p) && !('percent' in p) && !('progress' in p));
  checkTrue('and the wording never claims a single percentage',
    !/%/.test(describeGoalProgress(p)));
}
{
  // Money finished, work not started. Any blended figure would call this
  // half done. It is not half done in any useful sense.
  const money = costProgress(cost({ kind: 'money', label: 'Lumber', target: 500 }), 500);
  const time = costProgress(cost({ kind: 'time', label: 'Building it', target: 20, unit: 'hours' }), 0);
  const p = goalProgress(goal(), [money, time]);
  check('one of two costs met', p.costsMet, 1);
  check('the goal is not done', p.allMet, false);
  check('the unmet line is named as furthest behind', p.furthestBehind.cost.label, 'Building it');
  checkTrue('and the wording names the kind holding it up',
    describeGoalProgress(p).includes('time'));
  checkTrue('the shortfall is stated in that line own unit',
    describeGoalProgress(p).includes('20 hours'));
}
{
  // Furthest behind must be by share, not amount. 40 hours short and $40
  // short cannot be compared as numbers; 20% short and 90% short can.
  //
  // This fixture is built so the two rules DISAGREE, which the first
  // version did not: both its lines ranked the same way either way, so it
  // passed while testing nothing. Same bad-fixture trap already hit once
  // today in the payoff suite.
  //
  //   Delivery: 9 of 10 short   -> 10% done, the smaller amount
  //   Hours:  200 of 1000 short -> 80% done, the larger amount
  //
  // By share the delivery is furthest behind. By remaining amount the
  // hours would be picked, and that would be wrong.
  const small = costProgress(cost({ kind: 'money', label: 'Delivery', target: 10, unit: '' }), 1);
  const large = costProgress(cost({ kind: 'time', label: 'Hours', target: 1000, unit: 'hours' }), 800);
  checkTrue('the fixture genuinely separates share from amount', small.remaining < large.remaining);
  const p = goalProgress(goal(), [small, large]);
  check('the proportionally worst line is the laggard, not the biggest number',
    p.furthestBehind.cost.label, 'Delivery');

  // And the other way round, so the result is not just position in the list.
  const flipped = goalProgress(goal(), [
    costProgress(cost({ kind: 'money', label: 'Materials', target: 1000, unit: '' }), 800),
    costProgress(cost({ kind: 'time', label: 'Labour', target: 10, unit: 'hours' }), 1),
  ]);
  check('and it is not simply whichever came first', flipped.furthestBehind.cost.label, 'Labour');
}
{
  const all = [
    costProgress(cost({ target: 100 }), 100),
    costProgress(cost({ kind: 'goods', target: 40, unit: 'jars' }), 40),
  ];
  const p = goalProgress(goal(), all);
  check('every line met means the goal is met', p.allMet, true);
  check('and nothing is behind', p.furthestBehind, null);
  checkTrue('the wording says so plainly', describeGoalProgress(p).includes('all 2 costs met'));
}
{
  const p = goalProgress(goal(), []);
  check('a goal with no costs is not silently complete', p.allMet, false);
  check('and has nothing behind', p.furthestBehind, null);
  checkTrue('the wording says it is not trackable yet',
    describeGoalProgress(p).includes('Nothing costed yet'));
}
{
  const p = goalProgress(goal(), [costProgress(cost({ target: 100 }), 0)]);
  check('nothing in yet is flagged', p.notStarted, true);
  checkTrue('and reads as not started rather than as 0 of 1 met',
    describeGoalProgress(p).includes('Nothing put in yet'));
}

// --- 3. Pace, and its refusals ----------------------------------------------

{
  const p = costProgress(cost({ kind: 'money', target: 1200 }), 200);
  const r = pace(p, '2027-01-01', '2026-09-05');
  checkTrue('a real date gives a real figure', !isPaceRefusal(r));
  check('four months out', r.monthsLeft, 4);
  near('so a quarter of what is left each month', r.perMonth, 250);
  check('not overdue', r.overdue, false);
}
{
  // No date is not zero per month. It is unanswerable, and saying so is
  // the difference between a missing figure and a wrong one.
  const r = pace(costProgress(cost({ target: 500 }), 0), null, '2026-09-05');
  checkTrue('no date refuses', isPaceRefusal(r));
  check('and names the missing piece', r.reason, 'noDate');
  checkTrue('the wording asks for a date',
    describePace(costProgress(cost({ target: 500 }), 0), r).includes('Set a date'));
}
{
  const met = costProgress(cost({ target: 500 }), 500);
  const r = pace(met, '2027-01-01', '2026-09-05');
  checkTrue('an already-met line needs no pace', isPaceRefusal(r));
  check('for that reason specifically', r.reason, 'alreadyMet');
  check('and says nothing rather than something reassuring', describePace(met, r), null);
}
{
  const r = pace(costProgress(cost({ target: 0 }), 0), '2027-01-01', '2026-09-05');
  checkTrue('an uncosted line has no pace', isPaceRefusal(r));
  check('named as such', r.reason, 'noTarget');
}
{
  // Due this month. Dividing by zero months would give Infinity, so the
  // whole remainder is what falls now.
  const p = costProgress(cost({ target: 500 }), 100);
  const r = pace(p, '2026-09-30', '2026-09-05');
  checkTrue('this month does not divide by zero', !isPaceRefusal(r));
  check('the whole remainder falls now', r.perMonth, 400);
  check('zero months left', r.monthsLeft, 0);
  check('but it is not overdue', r.overdue, false);
  checkTrue('and the wording says it all lands now',
    describePace(p, r).includes('falls in this month'));
}
{
  // A date that has passed must not produce a negative monthly figure.
  const p = costProgress(cost({ target: 500 }), 100);
  const r = pace(p, '2026-06-01', '2026-09-05');
  check('a passed date is reported as overdue', r.overdue, true);
  checkTrue('and never as a negative amount per month', r.perMonth > 0);
  checkTrue('the wording says the date has gone',
    describePace(p, r).includes('date has passed'));
}
{
  // Pace works in the line's own unit, with no conversion anywhere.
  const p = costProgress(cost({ kind: 'time', target: 60, unit: 'hours' }), 0);
  const r = pace(p, '2026-12-05', '2026-09-05');
  near('twenty hours a month over three months', r.perMonth, 20);
  checkTrue('and it is described in hours, not dollars', describePace(p, r).includes('hours'));
}

// --- 4. Across every goal ---------------------------------------------------

{
  const bed = goalProgress(
    goal({ id: 'g1', name: 'Garden bed', targetDate: '2026-12-05' }),
    [
      costProgress(cost({ goalId: 'g1', kind: 'money', label: 'Lumber', target: 600 }), 0),
      costProgress(cost({ goalId: 'g1', kind: 'time', label: 'Building', target: 30, unit: 'hours' }), 0),
    ],
  );
  const preserves = goalProgress(
    goal({ id: 'g2', name: 'A year of preserves', targetDate: null }),
    [
      costProgress(cost({ goalId: 'g2', kind: 'money', label: 'Jars', target: 90 }), 0),
      costProgress(cost({ goalId: 'g2', kind: 'goods', label: 'Tomatoes', target: 40, unit: 'kg' }), 0),
    ],
  );
  const done = goalProgress(
    goal({ id: 'g3', name: 'New boots', status: 'reached', targetDate: '2026-08-01' }),
    [costProgress(cost({ goalId: 'g3', target: 150 }), 150)],
  );

  const s = summarizeGoals([{ progress: bed }, { progress: preserves }, { progress: done }], '2026-09-05');
  check('two goals on the go', s.activeGoals, 2);
  check('one reached', s.reachedGoals, 1);
  // Only the dated money cost contributes: 600 over 3 months.
  near('money with a date is summed', s.monthlyMoneyNeeded, 200);
  check('money without a date is counted, not guessed at', s.moneyCostsWithoutDate, 1);
  check('time costs are counted', s.outstandingTimeCosts, 1);
  check('goods costs are counted', s.outstandingGoodsCosts, 1);

  const text = describeGoalsSummary(s);
  checkTrue('the summary gives a money figure', text.includes('$200.00'));
  checkTrue('names what is missing from it', text.includes('no date'));
  checkTrue('and says plainly that non-money costs are not added together',
    text.includes('not added into one number'));
  checkTrue('a reached goal contributes nothing to what is still needed',
    summarizeGoals([{ progress: done }], '2026-09-05').monthlyMoneyNeeded === 0);
}
{
  // A goal given up must not keep asking for money every month.
  const abandoned = goalProgress(
    goal({ status: 'given_up', targetDate: '2027-01-01' }),
    [costProgress(cost({ target: 1200 }), 0)],
  );
  const s = summarizeGoals([{ progress: abandoned }], '2026-09-05');
  check('a goal given up is not active', s.activeGoals, 0);
  check('and stops wanting money', s.monthlyMoneyNeeded, 0);
  check('and is not counted as reached either', s.reachedGoals, 0);
}
{
  const s = summarizeGoals([], '2026-09-05');
  check('no goals at all', s.activeGoals, 0);
  check('and no money wanted', s.monthlyMoneyNeeded, 0);
  checkTrue('with wording that does not pretend otherwise',
    describeGoalsSummary(s).includes('Nothing here yet'));
}

// --- 5. Formatting and vocabulary -------------------------------------------

check('money formats as currency', formatGoalAmount('money', 1234.5, ''), '$1,234.50');
check('a whole number of hours has no decimal', formatGoalAmount('time', 20, 'hours'), '20 hours');
check('but a half hour keeps it', formatGoalAmount('time', 20.5, 'hours'), '20.5 hours');
check('goods carry their own unit', formatGoalAmount('goods', 40, 'jars'), '40 jars');
check('a goods line with no unit is just the number', formatGoalAmount('goods', 40, ''), '40');
check('money ignores any unit it is handed', formatGoalAmount('money', 5, 'hours'), '$5.00');

check('three kinds and no more', GOAL_COST_KINDS.length, 3);
check('time defaults to hours', defaultUnitFor('time'), 'hours');
check('money has no unit of its own', defaultUnitFor('money'), '');
check('goods has none until told', defaultUnitFor('goods'), '');
check('a kind gets a label', goalCostKindLabel('goods'), 'Goods');
check('an unknown kind is not renamed', goalCostKindLabel('nonsense'), 'nonsense');

{
  const p = costProgress(cost({ kind: 'goods', label: 'Tomatoes', target: 40, unit: 'kg' }), 12);
  checkTrue('a cost describes itself in its own unit throughout',
    describeCostProgress(p) === '12 kg of 40 kg, 28 kg to go.');
  const doneLine = costProgress(cost({ kind: 'money', target: 100 }), 100);
  checkTrue('a met line says so', describeCostProgress(doneLine).includes('Done.'));
  const overLine = costProgress(cost({ kind: 'money', target: 100 }), 130);
  checkTrue('and an overshoot is stated rather than hidden',
    describeCostProgress(overLine).includes('$30.00 past it'));
}

console.log(`${checks - failures}/${checks} checks passed`);
if (failures > 0) {
  console.error(`${failures} FAILED`);
  process.exit(1);
}
