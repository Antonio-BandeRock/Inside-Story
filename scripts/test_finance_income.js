// Runs lib/financeIncome.ts: variable income streams measured from what
// actually arrived, and whether the thing producing one has paid for itself.
//
// Built 2026-09-05, from a question about solar feed-in, harvest sales and
// side work. All three are income that varies, and the risk in this file is
// almost entirely in one decision:
//
//   The average divides by the whole span from first receipt to last, not
//   by the months that had money in them. A harvest-sale stream earning
//   nothing from October to April is earning nothing in those months, and
//   dividing only by the summer would turn "about $40 a month" into "about
//   $120 a month" by quietly dropping the winter.
//
// Everything else worth checking hardest: payback refuses on too little
// history rather than quoting a rate from two payouts, flags anything under
// a year because a seasonal stream has not shown its low season, and never
// presents the measured rate as a forecast.
//
// Run with: node scripts/test_finance_income.js
// Exits non-zero on any failure.

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function loadModule(relPath) {
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  // eslint-disable-next-line no-new-func
  new Function('exports', 'module', 'require', outputText)(module.exports, module, () => {
    throw new Error('unexpected import');
  });
  return module.exports;
}

const I = loadModule('lib/financeIncome.ts');
const {
  incomeStreamStats, describeIncomeStream,
  checkEstimate, describeEstimateCheck, MIN_MONTHS_FOR_ESTIMATE_CHECK,
  payback, describePayback, MIN_MONTHS_FOR_PAYBACK, MONTHS_FOR_FULL_SEASONS,
  buildIncomeMix, describeIncomeMix, CONCENTRATION_THRESHOLD,
  formatIncomeMoney,
} = I;

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

const r = (occurredOn, amount) => ({ occurredOn, amount });

// --- 1. Measuring a stream --------------------------------------------------

{
  // A solar credit: every month, but never the same amount.
  const stats = incomeStreamStats([
    r('2026-04-15', 62), r('2026-05-15', 78), r('2026-06-15', 91),
    r('2026-07-15', 96), r('2026-08-15', 88), r('2026-09-15', 71),
  ]);
  check('every payment counts', stats.receiptCount, 6);
  check('six months of history', stats.spanMonths, 6);
  check('all six had something in them', stats.monthsWithIncome, 6);
  check('so none were empty', stats.monthsWithNothing, 0);
  check('the total is the total', stats.total, 486);
  near('and the average is over the span', stats.averagePerMonth, 81);
  check('the best month is found', stats.bestMonth.month, '2026-07');
  check('and the leanest', stats.leanestMonth.month, '2026-04');
  check('first month', stats.firstMonth, '2026-04');
  check('last month', stats.lastMonth, '2026-09');
}
{
  // THE CASE THAT MATTERS. Harvest sales: nothing from October to April,
  // then three good months. Dividing by the months that earned would say
  // $120 a month. Dividing by the span says $40, which is the truth about
  // a year.
  const summerOnly = [r('2026-07-05', 150), r('2026-08-05', 120), r('2026-09-05', 90)];
  const summer = incomeStreamStats(summerOnly);
  check('three months of sales', summer.monthsWithIncome, 3);
  near('reads as $120 a month across the summer alone', summer.averagePerMonth, 120);

  // Same sales, but the history starts in April, so the quiet months are
  // inside the span and have to pull the average down.
  const withQuietMonths = incomeStreamStats([r('2026-04-05', 0.01), ...summerOnly]);
  check('the span now covers the quiet months too', withQuietMonths.spanMonths, 6);
  check('and they are reported as empty', withQuietMonths.monthsWithNothing, 2);
  checkTrue('so the average is far lower than the summer figure',
    withQuietMonths.averagePerMonth < summer.averagePerMonth / 1.5);
  near('specifically the total over the whole span', withQuietMonths.averagePerMonth, 360.01 / 6);
  checkTrue('and the wording says why empty months are counted',
    describeIncomeStream(withQuietMonths).includes('flattering summer'));
}
{
  const one = incomeStreamStats([r('2026-09-05', 200)]);
  check('one payment is one month, not zero', one.spanMonths, 1);
  near('and the average is that payment', one.averagePerMonth, 200);
  check('nothing empty', one.monthsWithNothing, 0);
}
{
  // Two payments in the same month must not read as two months.
  const same = incomeStreamStats([r('2026-09-02', 40), r('2026-09-20', 60)]);
  check('one month', same.spanMonths, 1);
  check('two payments', same.receiptCount, 2);
  near('and they add up within it', same.averagePerMonth, 100);
  check('best and leanest are the same month, so no range is claimed',
    same.bestMonth.month, same.leanestMonth.month);
  checkTrue('and the wording does not quote a best against a leanest',
    !describeIncomeStream(same).includes('Best month'));
}
{
  check('nothing recorded gives nothing rather than zeroes', incomeStreamStats([]), null);
  checkTrue('and the wording asks for receipts rather than reporting $0.00',
    describeIncomeStream(null).includes('Nothing recorded'));
}

// --- 2. The typed estimate against what arrived -----------------------------

{
  const stats = incomeStreamStats([r('2026-04-01', 40), r('2026-05-01', 40), r('2026-06-01', 40)]);
  const c = checkEstimate(40, stats);
  check('an accurate estimate is confirmed', c.direction, 'onTarget');
  check('and is not flagged', c.wayOff, false);
  checkTrue('the wording says it was right', describeEstimateCheck(c).includes('what it has actually done'));
}
{
  // Optimistic by a lot, which is the common way a solar estimate goes.
  const stats = incomeStreamStats([r('2026-04-01', 30), r('2026-05-01', 35), r('2026-06-01', 25)]);
  const c = checkEstimate(90, stats);
  check('measured below the estimate', c.direction, 'below');
  check('and far enough to flag', c.wayOff, true);
  near('the gap is reported', c.difference, 30 - 90);
  const text = describeEstimateCheck(c);
  checkTrue('the wording gives both figures', text.includes('$90.00') && text.includes('$30.00'));
  checkTrue('and says the estimate is worth correcting', text.includes('worth correcting'));
}
{
  const stats = incomeStreamStats([r('2026-04-01', 100), r('2026-05-01', 110), r('2026-06-01', 105)]);
  const c = checkEstimate(100, stats);
  check('measured above the estimate', c.direction, 'above');
  check('but only slightly, so not flagged', c.wayOff, false);
}
{
  // Not enough history. One month is not a trend and the comparison would
  // be a coin toss dressed as a finding.
  const thin = incomeStreamStats([r('2026-09-01', 30)]);
  check('one month refuses the comparison', checkEstimate(90, thin), null);
  check('and says nothing', describeEstimateCheck(null), null);
  checkTrue('the floor is a real few months', MIN_MONTHS_FOR_ESTIMATE_CHECK >= 3);
  check('no estimate to check against also refuses',
    checkEstimate(0, incomeStreamStats([r('2026-04-01', 1), r('2026-05-01', 1), r('2026-06-01', 1)])), null);
}

// --- 3. Has it paid for itself ----------------------------------------------

{
  // The solar question, asked directly. Cost from the goal, return measured.
  const stats = incomeStreamStats([
    r('2026-01-15', 60), r('2026-02-15', 55), r('2026-03-15', 70), r('2026-04-15', 85),
    r('2026-05-15', 95), r('2026-06-15', 105), r('2026-07-15', 110), r('2026-08-15', 100),
    r('2026-09-15', 80), r('2026-10-15', 65), r('2026-11-15', 50), r('2026-12-15', 45),
  ]);
  const p = payback({ cost: 9000, stats });
  check('a full year of history', p.monthsSoFar, 12);
  check('so seasons are covered', p.tooShortForSeasons, false);
  // 920 across the twelve, so about $76.67 a month. My first pass at this
  // fixture asserted 1020 and $85 from adding the list up wrongly; the code
  // was right and the expectation was not.
  check('returned so far is the measured total', p.returnedSoFar, 920);
  check('and what is left follows', p.stillToRecoup, 9000 - 920);
  near('at the measured monthly rate', p.averagePerMonth, 920 / 12);
  check('the remaining months are rounded up, never down', p.monthsAtThisRate, Math.ceil(8080 / (920 / 12)));
  checkTrue('rounding up is what makes it never optimistic', p.monthsAtThisRate * p.averagePerMonth >= p.stillToRecoup);
  check('not recouped yet', p.recouped, false);
  const text = describePayback(p, 'Solar');
  checkTrue('the wording states the rate as measured so far', text.includes('a month so far'));
  checkTrue('and frames the remainder as at that rate, not as a prediction',
    text.includes('At that rate'));
  checkTrue('no seasonal caveat once a year is covered', !text.includes('quiet season'));
}
{
  // Three summer months only. A rate from these would be flattering, so it
  // is quoted but explicitly flagged as not yet through a low season.
  const stats = incomeStreamStats([r('2026-06-15', 105), r('2026-07-15', 110), r('2026-08-15', 100)]);
  const p = payback({ cost: 9000, stats });
  check('short history is flagged', p.tooShortForSeasons, true);
  checkTrue('the wording says it has not seen its quiet season',
    describePayback(p, 'Solar').includes('quiet season'));
  checkTrue('and calls the figure early rather than settled',
    describePayback(p, 'Solar').includes('early rather than settled'));
}
{
  // Under three months there is no rate worth quoting at all.
  const stats = incomeStreamStats([r('2026-08-15', 100), r('2026-09-15', 110)]);
  check('two months refuses outright', payback({ cost: 9000, stats }), null);
  check('and says nothing rather than something', describePayback(null, 'Solar'), null);
  checkTrue('the floor is at least three months', MIN_MONTHS_FOR_PAYBACK >= 3);
  checkTrue('and a full year is what clears the seasonal flag', MONTHS_FOR_FULL_SEASONS === 12);
}
{
  const stats = incomeStreamStats([
    r('2026-01-15', 400), r('2026-02-15', 400), r('2026-03-15', 400),
    r('2026-04-15', 400), r('2026-05-15', 400),
  ]);
  const p = payback({ cost: 1500, stats });
  check('once the total passes the cost it has paid for itself', p.recouped, true);
  check('and nothing is left to recoup', p.stillToRecoup, 0);
  checkTrue('the wording says so', describePayback(p, 'Solar').includes('paid for itself'));
}
{
  check('no cost means no payback question', payback({ cost: 0, stats: incomeStreamStats([r('2026-01-01', 5), r('2026-02-01', 5), r('2026-03-01', 5)]) }), null);
  check('and no receipts means none either', payback({ cost: 9000, stats: null }), null);
}

// --- 4. The mix of streams --------------------------------------------------

const stream = (over = {}) => ({ name: 'Stream', category: 'wages', monthly: 100, isMeasured: false, isEstimate: false, ...over });

{
  const mix = buildIncomeMix([
    stream({ name: 'Solar', monthly: 85, isMeasured: true }),
    stream({ name: 'Wages', monthly: 3200 }),
    stream({ name: 'Harvest sales', monthly: 40, isMeasured: true }),
  ]);
  check('total is every stream', mix.total, 3325);
  check('the biggest leads', mix.streams[0].name, 'Wages');
  near('and its share is worked out', mix.streams[0].share, 3200 / 3325);
  check('one stream dominating is flagged', mix.concentrated, true);
  const text = describeIncomeMix(mix);
  checkTrue('the wording names it', text.includes('Wages is 96%'));
  checkTrue('and says what that means', text.includes('one income with extras'));
}
{
  // Genuinely spread. Nothing should be flagged as concentrated.
  const mix = buildIncomeMix([
    stream({ name: 'Wages', monthly: 1000 }),
    stream({ name: 'Side work', monthly: 900 }),
    stream({ name: 'Solar', monthly: 800 }),
  ]);
  check('no stream dominates', mix.concentrated, false);
  checkTrue('and the wording does not claim otherwise', !describeIncomeMix(mix).includes('one income with extras'));
  checkTrue('the threshold is a stated judgment, not 100%',
    CONCENTRATION_THRESHOLD > 0.5 && CONCENTRATION_THRESHOLD < 1);
}
{
  // A single stream is not "concentrated", it is just the only one. Saying
  // one income is 100% of one income tells nobody anything.
  const mix = buildIncomeMix([stream({ name: 'Wages', monthly: 3000 })]);
  check('one stream alone is not flagged', mix.concentrated, false);
  near('even though its share is all of it', mix.streams[0].share, 1);
}
{
  const mix = buildIncomeMix([
    stream({ name: 'Solar', monthly: 90, isEstimate: true }),
    stream({ name: 'Side work', monthly: 200, isEstimate: true, isMeasured: true }),
    stream({ name: 'Wages', monthly: 3000 }),
  ]);
  check('only unchecked estimates are counted', mix.restingOnEstimates, 1);
  checkTrue('and the wording asks for the payments',
    describeIncomeMix(mix).includes('measured from what arrived'));
}
{
  const mix = buildIncomeMix([]);
  check('no streams is zero, not NaN', mix.total, 0);
  check('nothing resting on estimates', mix.restingOnEstimates, 0);
  check('and not concentrated', mix.concentrated, false);
  checkTrue('with honest wording', describeIncomeMix(mix).includes('No income added yet'));
}
{
  // Every stream at zero must not divide by zero when working out shares.
  const mix = buildIncomeMix([stream({ monthly: 0 }), stream({ monthly: 0 })]);
  check('total zero', mix.total, 0);
  check('shares are zero rather than NaN', mix.streams[0].share, 0);
}

// --- 5. Formatting ----------------------------------------------------------

check('money formats', formatIncomeMoney(1234.5), '$1,234.50');
check('and negatives keep the sign outside', formatIncomeMoney(-40), '-$40.00');
check('zero', formatIncomeMoney(0), '$0.00');

{
  // A payback longer than a year reads in years and months, since "187
  // months" is not a span anyone can picture.
  const stats = incomeStreamStats([
    r('2026-01-15', 50), r('2026-02-15', 50), r('2026-03-15', 50), r('2026-04-15', 50),
  ]);
  const p = payback({ cost: 1000, stats });
  const text = describePayback(p, 'Solar');
  checkTrue('a long remainder is given in years', text.includes('year'));
  checkTrue('and not as a bare month count', !/\b\d{2,} months\b/.test(text.split('At that rate')[1] ?? ''));
}

console.log(`${checks - failures}/${checks} checks passed`);
if (failures > 0) {
  console.error(`${failures} FAILED`);
  process.exit(1);
}
