// Runs lib/therapyResponse.ts against the cases that decide what the
// Therapy Response lens tells someone about their own hands-on sessions.
//
// Built 2026-09-04, alongside the hands-on therapy tracker itself.
//
// Every failure mode here is a silently wrong NUMBER rather than a crash,
// which is the same reason scripts/test_grocery_list_math.js and
// scripts/test_cooking_method_resolution.js exist. A wrong day count here
// would tell someone their adjustment holds for four days when their own
// logged data says two, and they would plan real appointments around it.
// The nearest-session and cross-therapy attribution rules are the two
// places where a plausible-looking wrong answer is easiest to produce, so
// both are covered directly rather than assumed correct from reading.
//
// Run with: node scripts/test_therapy_response.js
// Exits non-zero on any failure.

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const SOURCE = path.join(__dirname, '..', 'lib', 'therapyResponse.ts');

function loadModule() {
  const source = fs.readFileSync(SOURCE, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: 'therapyResponse.ts',
  });
  const module = { exports: {} };
  // eslint-disable-next-line no-new-func
  new Function('exports', 'module', outputText)(module.exports, module);
  return module.exports;
}

const {
  summarizeTherapyResponse,
  describeTherapyResponse,
  MAX_FOLLOW_UP_DAYS,
  MIN_SESSIONS,
  MIN_CHECKINS_PER_OFFSET,
  MIN_BASELINE_CHECKINS,
  MEANINGFUL_MARGIN,
} = loadModule();

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

function checkTrue(label, actual) {
  check(label, actual === true, true);
}

// Small builders so a test case reads as the story it is testing rather
// than as a wall of literal timestamps.
function session(date, therapyType = 'chiropractic') {
  return { performedAt: `${date}T10:00`, therapyType };
}
function neg(date, severity = 3) {
  return { loggedAt: `${date}T18:00`, valence: 'negative', severity };
}
function pos(date) {
  return { loggedAt: `${date}T18:00`, valence: 'positive', severity: null };
}

function summaryFor(result, therapyType) {
  return result.summaries.find((entry) => entry.therapyType === therapyType);
}

// --- The gates, checked before any arithmetic -------------------------------
// These exist so the lens cannot report a percentage off one good week.

{
  const result = summarizeTherapyResponse(
    [session('2026-06-01'), session('2026-06-08')],
    [pos('2026-06-01'), pos('2026-06-02'), neg('2026-06-20'), neg('2026-06-21'), neg('2026-06-22')],
  );
  const summary = summaryFor(result, 'chiropractic');
  check('two sessions is below the reporting bar', summary.hasEnoughData, false);
  checkTrue('and it says how many more are needed', summary.notEnoughDataReason.includes(String(MIN_SESSIONS)));
  check('the session count is still reported honestly', summary.sessionCount, 2);
}

{
  // Enough sessions, but almost every check-in sits inside a follow-up
  // window, so there is nothing ordinary left to compare against.
  const result = summarizeTherapyResponse(
    [session('2026-06-01'), session('2026-06-08'), session('2026-06-15')],
    [pos('2026-06-01'), pos('2026-06-02'), pos('2026-06-08'), pos('2026-06-09'), pos('2026-06-15')],
  );
  const summary = summaryFor(result, 'chiropractic');
  check('no baseline means nothing is claimed', summary.hasEnoughData, false);
  check('and no run of good days is asserted', summary.betterThanBaselineThroughDay, null);
  check('the baseline count is zero and says so', summary.baselineCheckinCount, 0);
  check('the baseline share is withheld, not zero', summary.baselineNegativeShare, null);
}

{
  // A single check-in at a day offset must never become "0% reported
  // something off." This is the specific case the null share exists for.
  const sessions = [session('2026-06-01'), session('2026-06-08'), session('2026-06-15')];
  const checkins = [
    pos('2026-06-01'),
    // Baseline days, well clear of every session's window.
    neg('2026-07-01'), neg('2026-07-02'), neg('2026-07-03'), pos('2026-07-04'), pos('2026-07-05'),
  ];
  const result = summarizeTherapyResponse(sessions, checkins);
  const summary = summaryFor(result, 'chiropractic');
  check('one check-in on day 0 yields no share', summary.byDayOffset[0].negativeShare, null);
  check('but its raw count is still reported', summary.byDayOffset[0].checkinCount, 1);
  check('a day with one check-in cannot start a run', summary.betterThanBaselineThroughDay, null);
}

// --- The real reading: a therapy that helps for a few days ------------------

{
  // Three sessions a fortnight apart. Days 0-2 after each are good, day 3
  // onward is back to normal. Baseline is a deliberately bad stretch so
  // the contrast is unambiguous.
  const sessions = [session('2026-06-01'), session('2026-06-15'), session('2026-07-01')];
  const checkins = [];
  for (const start of ['2026-06-01', '2026-06-15', '2026-07-01']) {
    const [y, m, d] = start.split('-').map(Number);
    for (let offset = 0; offset <= 3; offset += 1) {
      const day = new Date(y, m - 1, d + offset);
      const iso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
      // Days 0, 1, 2 good; day 3 bad, so the run has to stop at day 2.
      checkins.push(offset <= 2 ? pos(iso) : neg(iso));
    }
  }
  // Baseline: ten days nowhere near a session, mostly bad.
  for (let i = 10; i < 20; i += 1) {
    const iso = `2026-08-${String(i).padStart(2, '0')}`;
    checkins.push(i < 18 ? neg(iso) : pos(iso));
  }

  const result = summarizeTherapyResponse(sessions, checkins);
  const summary = summaryFor(result, 'chiropractic');

  check('three sessions clears the bar', summary.hasEnoughData, true);
  check('baseline counts every un-treated day', summary.baselineCheckinCount, 10);
  check('baseline share is 8 of 10', summary.baselineNegativeShare, 0.8);
  check('day 0 has one check-in per session', summary.byDayOffset[0].checkinCount, 3);
  check('day 0 reported nothing off', summary.byDayOffset[0].negativeShare, 0);
  check('day 3 reported something off every time', summary.byDayOffset[3].negativeShare, 1);
  check('the good run stops at day 2, not day 3', summary.betterThanBaselineThroughDay, 2);
  check('day 3 is named as worse than baseline', summary.worseThanBaselineDays, [3]);

  const sentence = describeTherapyResponse(summary, 'a chiropractic adjustment');
  checkTrue('the sentence names three days, not three sessions', sentence.includes('first 3 days'));
  checkTrue('the sentence states the baseline it compared against', sentence.includes('80%'));
  checkTrue('the sentence never claims causation', !/\bcaus/i.test(sentence));
}

// --- A therapy followed by worse days is reported, not hidden --------------

{
  const sessions = [session('2026-06-01'), session('2026-06-15'), session('2026-07-01')];
  const checkins = [];
  for (const start of ['2026-06-01', '2026-06-15', '2026-07-01']) {
    checkins.push(neg(start));
  }
  // A calm baseline, so the bad days after a session stand out.
  for (let i = 10; i < 20; i += 1) {
    checkins.push(pos(`2026-08-${String(i).padStart(2, '0')}`));
  }

  const result = summarizeTherapyResponse(sessions, checkins);
  const summary = summaryFor(result, 'chiropractic');
  check('a calm baseline reads as calm', summary.baselineNegativeShare, 0);
  check('day 0 is flagged worse', summary.worseThanBaselineDays, [0]);
  check('and no benefit window is claimed', summary.betterThanBaselineThroughDay, null);

  const sentence = describeTherapyResponse(summary, 'a chiropractic adjustment');
  checkTrue('the worse-days sentence says so plainly', sentence.includes('MORE often'));
  checkTrue('and points the person at their practitioner', sentence.includes('raising'));
}

// --- No difference is a real answer, not a missing one ---------------------

{
  const sessions = [session('2026-06-01'), session('2026-06-15'), session('2026-07-01')];
  const checkins = [];
  // Half bad on day 0 after each session (rounded to 1 of 3), and half bad
  // at baseline, so nothing clears the margin either way.
  checkins.push(neg('2026-06-01'), pos('2026-06-15'), pos('2026-07-01'));
  for (let i = 10; i < 20; i += 1) {
    checkins.push(i < 13 ? neg(`2026-08-${String(i).padStart(2, '0')}`) : pos(`2026-08-${String(i).padStart(2, '0')}`));
  }

  const result = summarizeTherapyResponse(sessions, checkins);
  const summary = summaryFor(result, 'chiropractic');
  check('baseline is 3 of 10', summary.baselineNegativeShare, 0.3);
  check('day 0 is 1 of 3', Math.round(summary.byDayOffset[0].negativeShare * 100) / 100, 0.33);
  check('nothing clears the margin, so no run is claimed', summary.betterThanBaselineThroughDay, null);
  check('and nothing is called worse either', summary.worseThanBaselineDays, []);

  const sentence = describeTherapyResponse(summary, 'a massage');
  checkTrue('a flat result says it is a real reading', sentence.includes('real reading'));
}

// --- Nearest-session attribution -------------------------------------------
// Weekly sessions mean most days sit after one session AND before the next.
// Counting a day under every session it trails would inflate every offset.

{
  const sessions = [session('2026-06-01'), session('2026-06-08'), session('2026-06-15')];
  const checkins = [
    pos('2026-06-09'), // 1 day after Jun 8, and 8 days after Jun 1 (out of window)
    pos('2026-06-14'), // 6 days after Jun 8, 1 day BEFORE Jun 15 -> belongs to day 6
    neg('2026-07-20'), neg('2026-07-21'), neg('2026-07-22'), pos('2026-07-23'), pos('2026-07-24'),
  ];
  const result = summarizeTherapyResponse(sessions, checkins);
  const summary = summaryFor(result, 'chiropractic');

  const totalAttributed = summary.byDayOffset.reduce((sum, day) => sum + day.checkinCount, 0);
  check('each check-in is counted exactly once across all offsets', totalAttributed, 2);
  check('Jun 9 lands on day 1', summary.byDayOffset[1].checkinCount, 1);
  check('Jun 14 lands on day 6, not day 13', summary.byDayOffset[6].checkinCount, 1);
  check('a day before every session is baseline, not a negative offset', summary.baselineCheckinCount, 5);
}

// --- Cross-therapy attribution ---------------------------------------------
// The bug this prevents: a massage the day after an adjustment has its own
// good day credited to the adjustment too, so both therapies look effective
// off one person's single good afternoon.

{
  const sessions = [
    session('2026-06-01', 'chiropractic'),
    session('2026-06-08', 'chiropractic'),
    session('2026-06-15', 'chiropractic'),
    session('2026-06-02', 'deep_tissue_massage'),
    session('2026-06-09', 'deep_tissue_massage'),
    session('2026-06-16', 'deep_tissue_massage'),
  ];
  const checkins = [pos('2026-06-02'), pos('2026-06-09'), pos('2026-06-16')];
  const result = summarizeTherapyResponse(sessions, checkins);

  const chiro = summaryFor(result, 'chiropractic');
  const massage = summaryFor(result, 'deep_tissue_massage');

  check('the massage day belongs to the massage, at day 0', massage.byDayOffset[0].checkinCount, 3);
  check('and is not also counted as the adjustment day 1', chiro.byDayOffset[1].checkinCount, 0);
  check('the adjustment gets no check-ins of its own here', chiro.byDayOffset.reduce((s, d) => s + d.checkinCount, 0), 0);
  check('both therapies are summarized separately', result.summaries.length, 2);
}

// --- Window edges ----------------------------------------------------------

{
  const sessions = [session('2026-06-01'), session('2026-07-01'), session('2026-08-01')];
  const checkins = [
    pos('2026-06-08'), // exactly MAX_FOLLOW_UP_DAYS after -> inside
    pos('2026-06-09'), // one past the window -> baseline
    neg('2026-06-20'), neg('2026-06-21'), neg('2026-06-22'), neg('2026-06-23'),
  ];
  const result = summarizeTherapyResponse(sessions, checkins);
  const summary = summaryFor(result, 'chiropractic');
  check('day 7 is inside the window', summary.byDayOffset[MAX_FOLLOW_UP_DAYS].checkinCount, 1);
  check('day 8 falls out to baseline', summary.baselineCheckinCount, 5);
}

// --- Bad input is dropped, never guessed -----------------------------------

{
  const result = summarizeTherapyResponse(
    [session('2026-06-01'), { performedAt: 'not-a-date', therapyType: 'chiropractic' }, session('2026-06-15')],
    [{ loggedAt: '2026-02-31T10:00', valence: 'negative', severity: 2 }, pos('2026-06-01')],
  );
  check('an unparseable session date is dropped', result.totalSessions, 2);
  check('a nonexistent calendar date is dropped rather than rolled forward', result.totalCheckins, 1);
}

// --- A run cannot skip a day it knows nothing about ------------------------

{
  // Days 0 and 2 are clearly good; day 1 has a single check-in, so its
  // share is null. The run must stop at day 0 rather than jumping the gap.
  const sessions = [session('2026-06-01'), session('2026-06-15'), session('2026-07-01')];
  const checkins = [
    pos('2026-06-01'), pos('2026-06-15'), pos('2026-07-01'), // day 0, three check-ins
    pos('2026-06-02'), // day 1, only one
    pos('2026-06-03'), pos('2026-06-17'), pos('2026-07-03'), // day 2, three check-ins
  ];
  for (let i = 10; i < 20; i += 1) {
    checkins.push(neg(`2026-08-${String(i).padStart(2, '0')}`));
  }
  const result = summarizeTherapyResponse(sessions, checkins);
  const summary = summaryFor(result, 'chiropractic');
  check('baseline is entirely bad days', summary.baselineNegativeShare, 1);
  check('day 1 has too few check-ins to score', summary.byDayOffset[1].negativeShare, null);
  check('the run stops at the unknown day rather than skipping it', summary.betterThanBaselineThroughDay, 0);
}

// --- Severity is averaged over negative check-ins only ---------------------

{
  const sessions = [session('2026-06-01'), session('2026-06-15'), session('2026-07-01')];
  const checkins = [neg('2026-06-01', 2), neg('2026-06-15', 4), pos('2026-07-01')];
  for (let i = 10; i < 20; i += 1) {
    checkins.push(pos(`2026-08-${String(i).padStart(2, '0')}`));
  }
  const result = summarizeTherapyResponse(sessions, checkins);
  const summary = summaryFor(result, 'chiropractic');
  check('mean severity ignores the positive check-in', summary.byDayOffset[0].meanNegativeSeverity, 3);
  check('an offset with no negatives has no mean severity', summary.byDayOffset[4].meanNegativeSeverity, null);
}

// --- The constants themselves ----------------------------------------------
// Guards against a future tweak silently loosening the honesty gates.

check('the follow-up window is a week', MAX_FOLLOW_UP_DAYS, 7);
check('at least three sessions are required', MIN_SESSIONS, 3);
check('at least three check-ins per day offset', MIN_CHECKINS_PER_OFFSET, 3);
check('at least five baseline check-ins', MIN_BASELINE_CHECKINS, 5);
check('the margin is fifteen percentage points', MEANINGFUL_MARGIN, 0.15);

// --- Nothing logged at all -------------------------------------------------

{
  const result = summarizeTherapyResponse([], []);
  check('an empty log produces no summaries', result.summaries, []);
  check('and no session count', result.totalSessions, 0);
}

console.log(`${checks - failures}/${checks} checks passed`);
if (failures > 0) {
  console.error(`${failures} FAILED`);
  process.exit(1);
}
