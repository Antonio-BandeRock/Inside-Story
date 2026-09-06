// Runs lib/workBenefits.ts and lib/workMeaning.ts: what work gives you, and
// how work is actually going.
//
// Built 2026-09-05. The risks here are different in each half.
//
// In workBenefits the risk is claiming something. Every figure came from the
// person telling the app what their employer offers, so the checks weigh on:
// a perk with no number gets no arithmetic; a missing reset date produces null
// rather than a countdown; a match is never turned into an amount, because the
// app does not know anyone's pay.
//
// In workMeaning the risk is direction. Three of the four dimensions are better
// when high and the fourth is better when LOW, and getting that backwards would
// report a draining week as an improving one. That inversion is checked from
// both sides.
//
// Run with: node scripts/test_work.js
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

const B = loadModule('lib/workBenefits.ts');
const M = loadModule('lib/workMeaning.ts');
const P = loadModule('constants/workBenefitPrompts.ts');

const {
  BENEFIT_KINDS, benefitKindLabel, benefitUnit,
  benefitStanding, EXPIRY_WARNING_DAYS,
  matchGap, describeMatchGap,
  summarizeWork, describeWorkSummary,
  formatShare, formatBenefitAmount, describeBenefitStanding,
} = B;
const {
  WORK_DIMENSIONS, SDT_ATTRIBUTION, NO_SCORE_NOTE, SCALE_MIN, SCALE_MAX, SCALE_LABELS,
  buildWorkTrend, describeWorkTrend, describeDimensionTrend, dimensionLabel,
  MIN_CHECKINS_FOR_TREND, weekOf,
} = M;
const { WORK_PROMPT_GROUPS, WORK_PROMPT_COUNT, workPromptGroup } = P;

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

const TODAY = '2026-09-05';
const ben = (over = {}) => ({
  id: 'b1', name: 'Benefit', kind: 'allowance', total: 1000, used: 0,
  resets: 'yearly', resetOn: '2026-12-31', active: true, notes: null, ...over,
});

// --- 1. An allowance that runs down and then vanishes -----------------------

{
  const s = benefitStanding(ben({ name: 'Dental max', total: 1500, used: 400 }), TODAY);
  check('what is left', s.remaining, 1100);
  near('and the share used', s.fraction, 400 / 1500);
  check('not untouched', s.untouched, false);
  check('days until it resets', s.daysUntilReset, 117);
  check('and 117 days out is not a warning yet', s.expiringUnused, false);
  checkTrue('the wording gives both figures', describeBenefitStanding(s).includes('$400.00 of $1,500.00'));
}
{
  // Close to the reset with money still on it. This is the case the whole
  // thing exists for.
  const s = benefitStanding(ben({ name: 'Wellness', total: 500, used: 100, resetOn: '2026-09-30' }), TODAY);
  check('25 days out', s.daysUntilReset, 25);
  check('and something left, so it is a warning', s.expiringUnused, true);
  checkTrue('the wording says it goes with the reset',
    describeBenefitStanding(s).includes('anything left goes with it'));
  checkTrue('the window is a real stretch of weeks, not a token', EXPIRY_WARNING_DAYS >= 30);
}
{
  // Fully used with a reset coming. Nothing to warn about.
  const s = benefitStanding(ben({ total: 500, used: 500, resetOn: '2026-09-10' }), TODAY);
  check('nothing left', s.remaining, 0);
  check('so no warning', s.expiringUnused, false);
  check('the bar is full but does not overflow', s.fraction, 1);
}
{
  const s = benefitStanding(ben({ total: 500, used: 640, resetOn: '2026-09-10' }), TODAY);
  check('used past the total still leaves nothing', s.remaining, 0);
  check('and the bar does not overflow', s.fraction, 1);
  check('and it is not flagged as expiring', s.expiringUnused, false);
}
{
  // No reset date. A countdown is impossible and null says so, rather than a
  // number that looks computed.
  const s = benefitStanding(ben({ resetOn: null }), TODAY);
  check('no date means no countdown', s.daysUntilReset, null);
  check('and no expiry warning', s.expiringUnused, false);
  checkTrue('the wording asks for the date rather than inventing one',
    describeBenefitStanding(s).includes('No reset date recorded'));
}
{
  const s = benefitStanding(ben({ resets: 'never', resetOn: null }), TODAY);
  check('something that never resets has no countdown', s.daysUntilReset, null);
  checkTrue('and says so', describeBenefitStanding(s).includes('does not reset'));
}
{
  // A stale record. Saying "resets in -40 days" would be nonsense.
  const s = benefitStanding(ben({ used: 100, resetOn: '2026-07-27' }), TODAY);
  checkTrue('a passed date is negative', s.daysUntilReset < 0);
  check('and is not reported as expiring soon', s.expiringUnused, false);
  checkTrue('the wording calls the figure stale',
    describeBenefitStanding(s).includes('probably stale'));
}
{
  // A perk has no quantity and must get no arithmetic at all.
  const s = benefitStanding(ben({ kind: 'perk', name: 'Fridge at work', total: null }), TODAY);
  check('no remaining', s.remaining, null);
  check('no fraction to draw', s.fraction, 0);
  check('never expiring', s.expiringUnused, false);
  check('and not counted as untouched, since there is nothing to touch', s.untouched, false);
  checkTrue('the wording says it is here to be remembered',
    describeBenefitStanding(s).includes('not forgotten'));
}
{
  const s = benefitStanding(ben({ kind: 'sessions', total: 6, used: 0, resetOn: '2026-12-31' }), TODAY);
  check('sessions count as untouched when none used', s.untouched, true);
  checkTrue('and read in sessions rather than dollars',
    describeBenefitStanding(s).includes('6 sessions'));
  checkTrue('the wording says none claimed', describeBenefitStanding(s).includes('none of it claimed'));
}

// --- 2. A match, which is not an allowance ----------------------------------

{
  const gap = matchGap(ben({ kind: 'match', name: 'Retirement', total: 5, used: 3 }));
  check('the threshold', gap.threshold, 5);
  check('what is going in', gap.contributing, 3);
  check('and the shortfall as a share', gap.shortBy, 2);
  check('not getting all of it', gap.gettingFullMatch, false);
  const text = describeMatchGap(gap);
  checkTrue('the wording gives the shortfall', text.includes('2%'));
  checkTrue('and says it is money being turned down', text.includes('turns down'));
  // The rule this file will not break.
  checkTrue('no amount is ever produced from a share', !/\$/.test(text));
  checkTrue('and it says why', text.includes('does not know what you earn'));
}
{
  const gap = matchGap(ben({ kind: 'match', total: 5, used: 6 }));
  check('paying in above the threshold is still full match', gap.gettingFullMatch, true);
  check('and the shortfall never goes negative', gap.shortBy, 0);
  checkTrue('the wording confirms it', describeMatchGap(gap).includes('getting all of it'));
}
{
  check('an allowance is not a match', matchGap(ben({ kind: 'allowance' })), null);
  check('a match with no threshold recorded cannot be judged', matchGap(ben({ kind: 'match', total: null })), null);
  check('and says nothing', describeMatchGap(null), null);
}
{
  // A match must never be treated as an allowance being used up.
  const s = benefitStanding(ben({ kind: 'match', total: 5, used: 3 }), TODAY);
  check('a match has no remaining', s.remaining, null);
  check('and no bar', s.fraction, 0);
  check('and never expires', s.expiringUnused, false);
}

// --- 3. Everything together -------------------------------------------------

{
  const summary = summarizeWork(
    [
      ben({ id: 'a', name: 'Wellness', total: 500, used: 100, resetOn: '2026-09-30' }),
      ben({ id: 'b', name: 'Dental max', total: 1500, used: 0, resetOn: '2026-10-05' }),
      ben({ id: 'c', name: 'Retirement', kind: 'match', total: 5, used: 3, resets: 'never', resetOn: null }),
      ben({ id: 'd', name: 'Training', total: 800, used: 0, resets: 'yearly', resetOn: null }),
      ben({ id: 'e', name: 'Nurse line', kind: 'perk', total: null, resets: 'never', resetOn: null }),
      ben({ id: 'f', name: 'Old scheme', total: 200, used: 0, resetOn: '2026-09-10', active: false }),
    ],
    TODAY,
  );
  check('inactive is left out of the count', summary.recorded, 5);
  check('two are expiring with something left', summary.expiringUnused.length, 2);
  check('soonest first', summary.expiringUnused[0].benefit.name, 'Wellness');
  check('the match short is reported', summary.matchesShort.length, 1);
  // Two, not three: the match is set aside before "untouched" is even asked,
  // and the perk has no quantity to leave unclaimed. My first pass at this
  // expected three by counting both of those, and the code was right.
  check('two are recorded and never claimed', summary.untouched.length, 2);
  checkTrue('the match is not among them', !summary.untouched.some((s) => s.benefit.kind === 'match'));
  checkTrue('and neither is the perk', !summary.untouched.some((s) => s.benefit.kind === 'perk'));
  check('one has no reset date to count down', summary.missingResetDate, 1);

  const text = describeWorkSummary(summary);
  checkTrue('the soonest is named with its days', text.includes('Wellness in 25 days'));
  checkTrue('the declined share is named', text.includes('2%'));
  checkTrue('and the missing date is admitted', text.includes('no reset date recorded'));
}
{
  const summary = summarizeWork([], TODAY);
  check('nothing recorded', summary.recorded, 0);
  checkTrue('and the wording asks for the questions to be worked through',
    describeWorkSummary(summary).includes('Nothing recorded yet'));
}
{
  // All in order. Should say so plainly rather than finding something to warn
  // about.
  const summary = summarizeWork(
    [ben({ name: 'Dental', total: 1500, used: 900, resetOn: '2027-06-30' })],
    TODAY,
  );
  check('nothing expiring', summary.expiringUnused.length, 0);
  check('nothing untouched', summary.untouched.length, 0);
  checkTrue('and the wording is calm', describeWorkSummary(summary).includes('nothing sitting unclaimed'));
}

// --- 4. How work feels, and the direction that inverts ----------------------

const ci = (over = {}) => ({
  id: 'c1', weekOf: '2026-08-03', autonomy: 3, competence: 3, relatedness: 3, drain: 3, note: null, ...over,
});

{
  check('four dimensions', WORK_DIMENSIONS.length, 4);
  check('three come from the named framework', WORK_DIMENSIONS.filter((d) => d.source === 'sdt').length, 3);
  check('and one is this app own question', WORK_DIMENSIONS.filter((d) => d.source === 'app').length, 1);
  // The fourth is the one that inverts, and it must be the app's own.
  const inverted = WORK_DIMENSIONS.filter((d) => !d.higherIsBetter);
  check('exactly one dimension is better when low', inverted.length, 1);
  check('and it is the drain question', inverted[0].code, 'drain');
  checkTrue('the attribution names the framework and its authors',
    SDT_ATTRIBUTION.includes('Self-Determination Theory') && SDT_ATTRIBUTION.includes('Deci and Ryan'));
  checkTrue('and says the fourth is not part of it',
    SDT_ATTRIBUTION.includes('fourth question this app adds'));
  checkTrue('the no-score note refuses to interpret', NO_SCORE_NOTE.includes('There is no score here'));
  checkTrue('and admits the evidence cuts both ways', NO_SCORE_NOTE.includes('found no link'));
  check('a short scale', SCALE_MAX - SCALE_MIN, 4);
  check('every point on it is labelled', Object.keys(SCALE_LABELS).length, SCALE_MAX);
}
{
  // The inversion, from the good side. Drain falling is an improvement even
  // though the number went down.
  const trend = buildWorkTrend([
    ci({ weekOf: '2026-08-03', drain: 5, autonomy: 2 }),
    ci({ weekOf: '2026-08-10', drain: 4, autonomy: 3 }),
    ci({ weekOf: '2026-08-17', drain: 2, autonomy: 4 }),
  ]);
  const drain = trend.dimensions.find((d) => d.dimension === 'drain');
  check('drain fell', drain.change, -3);
  check('and falling is the better direction for it', drain.improving, true);
  const autonomy = trend.dimensions.find((d) => d.dimension === 'autonomy');
  check('autonomy rose', autonomy.change, 2);
  check('and rising is better for that one', autonomy.improving, true);
  check('so nothing is worsening', trend.worsening, null);
  checkTrue('and the wording says so', describeWorkTrend(trend).includes('Nothing has moved in the wrong direction'));
}
{
  // The inversion, from the bad side. Drain rising is worse even though the
  // number went up, which is the thing most likely to be coded backwards.
  const trend = buildWorkTrend([
    ci({ weekOf: '2026-08-03', drain: 1, relatedness: 5 }),
    ci({ weekOf: '2026-08-10', drain: 3, relatedness: 4 }),
    ci({ weekOf: '2026-08-17', drain: 5, relatedness: 4 }),
  ]);
  const drain = trend.dimensions.find((d) => d.dimension === 'drain');
  check('drain rose', drain.change, 4);
  check('and rising is the worse direction for it', drain.improving, false);
  check('so it is the thing getting worse', trend.worsening.dimension, 'drain');
  const text = describeWorkTrend(trend);
  checkTrue('and the wording says it moved UP, not down', text.includes('moved up the most'));
  checkTrue('naming both ends', text.includes('from 1 to 5'));
}
{
  // Where two things worsen, the bigger move wins, and size is by magnitude
  // so an inverted dimension is comparable with a normal one.
  const trend = buildWorkTrend([
    ci({ weekOf: '2026-08-03', drain: 1, competence: 5 }),
    ci({ weekOf: '2026-08-10', drain: 2, competence: 3 }),
    ci({ weekOf: '2026-08-17', drain: 2, competence: 1 }),
  ]);
  check('competence fell furthest', trend.worsening.dimension, 'competence');
  checkTrue('even though drain also worsened',
    trend.dimensions.find((d) => d.dimension === 'drain').improving === false);
  checkTrue('the wording says a higher-is-better dimension moved DOWN',
    describeWorkTrend(trend).includes('moved down the most'));
}
{
  const trend = buildWorkTrend([ci(), ci({ weekOf: '2026-08-10' }), ci({ weekOf: '2026-08-17' })]);
  check('no movement at all', trend.worsening, null);
  const flat = trend.dimensions[0];
  check('and a flat dimension is neither improving nor worsening', flat.improving, null);
  checkTrue('the wording does not call it an improvement',
    describeDimensionTrend(flat).includes('the same now as when you started'));
}
{
  near('the average is across the weeks given',
    buildWorkTrend([
      ci({ weekOf: '2026-08-03', autonomy: 1 }),
      ci({ weekOf: '2026-08-10', autonomy: 3 }),
      ci({ weekOf: '2026-08-17', autonomy: 5 }),
    ]).dimensions.find((d) => d.dimension === 'autonomy').average,
    3);
}
{
  check('two weeks is not a trend', buildWorkTrend([ci(), ci({ weekOf: '2026-08-10' })]), null);
  check('nor is one', buildWorkTrend([ci()]), null);
  check('nor none', buildWorkTrend([]), null);
  checkTrue('the floor is at least three weeks', MIN_CHECKINS_FOR_TREND >= 3);
  checkTrue('and the wording says how many are needed',
    describeWorkTrend(null).includes(String(MIN_CHECKINS_FOR_TREND)));
}
{
  // Out of order must not invert first and latest, which the whole change
  // calculation rests on.
  const trend = buildWorkTrend([
    ci({ weekOf: '2026-08-17', autonomy: 5 }),
    ci({ weekOf: '2026-08-03', autonomy: 1 }),
    ci({ weekOf: '2026-08-10', autonomy: 3 }),
  ]);
  const autonomy = trend.dimensions.find((d) => d.dimension === 'autonomy');
  check('the earliest week is first whatever order they arrive in', autonomy.first, 1);
  check('and the latest is last', autonomy.latest, 5);
}

// --- 5. Weeks -----------------------------------------------------------------

check('a Wednesday belongs to its Monday', weekOf('2026-09-02'), '2026-08-31');
check('a Monday is its own week', weekOf('2026-08-31'), '2026-08-31');
// The one that catches a naive implementation: Sunday is day 0, so counting
// back "day - 1" would move it forward a day instead of back six.
check('a Sunday belongs to the Monday before it, not the one after', weekOf('2026-09-06'), '2026-08-31');
check('a Saturday too', weekOf('2026-09-05'), '2026-08-31');
checkTrue('two days in one week land on the same key', weekOf('2026-09-01') === weekOf('2026-09-04'));
checkTrue('and two days in different weeks do not', weekOf('2026-08-30') !== weekOf('2026-08-31'));

// --- 6. The questions, which must claim nothing ------------------------------

{
  checkTrue('there are several groups', WORK_PROMPT_GROUPS.length >= 5);
  checkTrue('and a real number of questions', WORK_PROMPT_COUNT >= 25);
  check('a group can be found by code', workPromptGroup('time').label, 'Time, and what protects it');
  check('and an unknown code returns nothing', workPromptGroup('nonsense'), undefined);

  const everything = WORK_PROMPT_GROUPS.flatMap((group) => [
    group.label,
    group.why,
    ...group.prompts.flatMap((prompt) => [prompt.ask, prompt.note ?? '']),
  ]).join(' ');

  // The rule this file exists to hold. Nothing may name a country's scheme or
  // statute, because this app is used in more than one country and the same
  // benefit does not exist, or works differently, in each.
  const named = ['FMLA', 'ADA', '401', 'HSA', 'FSA', 'ACA', 'Medicare', 'Medicaid', 'IRS', 'HMRC', 'IMSS', 'INFONAVIT'];
  for (const term of named) {
    checkTrue(`no question names ${term}`, !new RegExp(`\\b${term}`, 'i').test(everything));
  }
  checkTrue('and nothing claims an entitlement outright',
    !/you are entitled|you qualify|by law you/i.test(everything));
  // Almost every question should be phrased as a question.
  const asks = WORK_PROMPT_GROUPS.flatMap((group) => group.prompts.map((prompt) => prompt.ask));
  checkTrue('every prompt is actually a question', asks.every((ask) => ask.trim().endsWith('?')));
}

// --- 7. Vocabulary and formatting -------------------------------------------

check('five kinds of thing', BENEFIT_KINDS.length, 5);
check('a kind has a label', benefitKindLabel('sessions'), 'A number of sessions');
check('an unknown kind is not renamed', benefitKindLabel('nonsense'), 'nonsense');
check('an allowance has no unit of its own', benefitUnit('allowance'), '');
check('sessions do', benefitUnit('sessions'), 'sessions');
check('a share formats as a percent', formatShare(2.5), '2.5%');
check('and a whole one has no decimal', formatShare(5), '5%');
check('an allowance formats as money', formatBenefitAmount('allowance', 1500), '$1,500.00');
check('sessions as a count', formatBenefitAmount('sessions', 6), '6 sessions');
check('days as days', formatBenefitAmount('days', 15), '15 days');
check('a match as a share', formatBenefitAmount('match', 5), '5%');
check('a dimension has a label', dimensionLabel('drain'), 'What it took out of you');

console.log(`${checks - failures}/${checks} checks passed`);
if (failures > 0) {
  console.error(`${failures} FAILED`);
  process.exit(1);
}
