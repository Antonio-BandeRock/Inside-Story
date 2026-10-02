// Runs lib/trialSeries.ts, the elimination series: F6, 2026-10-01.
//
// The rules checked:
//
//  1. One food at a time: the next food is queued only when nothing in the
//     series is open, the series is running, and something is still to come.
//  2. Skip is offered only on a food whose turn has not come or whose trial
//     is still waiting; a food being watched is ended like any trial.
//  3. The progress line and the summary say what happened to each food,
//     and the summary ends with the one-run limit once anything was tried.
//  4. The wiring: tables, advancing on resolve and on delete, removing a
//     plan never deleting a trial, sync registration, the Signals screen.
//  5. No dashes and no verdict words in anything said.
//
// Run with: node scripts/test_trial_series.js
// Exits non-zero on any failure.

/* global __dirname */
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
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    if (name === './foodExperiment') return loadModule('lib/foodExperiment.ts');
    throw new Error(`unexpected import ${name}`);
  });
  return module.exports;
}

const S = loadModule('lib/trialSeries.ts');
const E = loadModule('lib/foodExperiment.ts');

let passed = 0;
let failed = 0;
function check(label, ok) {
  if (ok) passed += 1;
  else {
    failed += 1;
    console.log(`FAIL: ${label}`);
  }
}

function item(position, foodName, trialStatus, extra = {}) {
  return {
    id: `i${position}`,
    position,
    foodName,
    trialId: trialStatus === undefined ? null : `t${position}`,
    trialStatus: trialStatus === undefined ? null : trialStatus,
    skippedAt: null,
    ...extra,
  };
}

// 1. Queueing.
const fresh = { stoppedAt: null, items: [item(1, 'Eggs'), item(2, 'Dairy'), item(3, 'Soy')] };
check('fresh series queues its first food', S.shouldQueueNext(fresh));
check('fresh series next is position 1', S.nextQueued(fresh.items).foodName === 'Eggs');
check('fresh series has nothing open', S.openItem(fresh.items) === null);

const waiting = { stoppedAt: null, items: [item(1, 'Eggs', 'waiting'), item(2, 'Dairy'), item(3, 'Soy')] };
check('a waiting trial blocks the next', !S.shouldQueueNext(waiting));
check('waiting trial is the open item', S.openItem(waiting.items).foodName === 'Eggs');

const watching = { stoppedAt: null, items: [item(1, 'Eggs', 'trialing'), item(2, 'Dairy'), item(3, 'Soy')] };
check('a trial being watched blocks the next', !S.shouldQueueNext(watching));

const oneDone = { stoppedAt: null, items: [item(1, 'Eggs', 'cleared'), item(2, 'Dairy'), item(3, 'Soy')] };
check('after a clear the next is queued', S.shouldQueueNext(oneDone));
check('after a clear next is Dairy', S.nextQueued(oneDone.items).foodName === 'Dairy');

const flaggedOne = { stoppedAt: null, items: [item(1, 'Eggs', 'flagged'), item(2, 'Dairy'), item(3, 'Soy')] };
check('after a flag the next is queued', S.shouldQueueNext(flaggedOne));

const removedOne = { stoppedAt: null, items: [item(1, 'Eggs', null), item(2, 'Dairy')] };
check('a deleted trial reads as removed', S.itemState(removedOne.items[0]) === 'removed');
check('after a removed trial the next is queued', S.shouldQueueNext(removedOne));

const skippedOne = {
  stoppedAt: null,
  items: [item(1, 'Eggs', undefined, { skippedAt: '2026-10-01' }), item(2, 'Dairy')],
};
check('a skipped food reads as skipped', S.itemState(skippedOne.items[0]) === 'skipped');
check('a skipped food is passed over', S.nextQueued(skippedOne.items).foodName === 'Dairy');

const stopped = { stoppedAt: '2026-10-01', items: [item(1, 'Eggs', 'cleared'), item(2, 'Dairy')] };
check('a stopped series queues nothing', !S.shouldQueueNext(stopped));

const outOfOrder = { stoppedAt: null, items: [item(3, 'Soy'), item(1, 'Eggs', 'cleared'), item(2, 'Dairy')] };
check('position decides the order, not the array', S.nextQueued(outOfOrder.items).foodName === 'Dairy');

const done = { stoppedAt: null, items: [item(1, 'Eggs', 'cleared'), item(2, 'Dairy', 'flagged')] };
check('all tried is finished', S.isFinished(done));
check('finished queues nothing', !S.shouldQueueNext(done));
check('open series is not finished', !S.isFinished(watching));

// 2. Skip.
check('skip a queued food', S.canSkip(item(2, 'Dairy')));
check('skip a waiting food', S.canSkip(item(1, 'Eggs', 'waiting')));
check('no skip while watched', !S.canSkip(item(1, 'Eggs', 'trialing')));
check('no skip once cleared', !S.canSkip(item(1, 'Eggs', 'cleared')));
check('no skip once flagged', !S.canSkip(item(1, 'Eggs', 'flagged')));
check('no skip twice', !S.canSkip(item(1, 'Eggs', undefined, { skippedAt: 'x' })));

// 3. Words.
check('progress so far', S.seriesProgressLine(oneDone) === '1 of 3 foods tried so far.');
check('progress finished', S.seriesProgressLine(done) === 'Finished: 2 of 2 foods tried.');
check('progress stopped', S.seriesProgressLine(stopped) === '1 of 2 foods tried, then stopped.');

const freshLines = S.seriesSummaryLines(fresh);
check('fresh summary has no one-run line', !freshLines.includes(S.SERIES_LIMIT));
check('fresh summary names the next', freshLines.includes('Next: Eggs.'));
check('fresh summary lists after that', freshLines.includes('After that: Dairy and Soy.'));

const watchLines = S.seriesSummaryLines({
  stoppedAt: null,
  items: [item(1, 'Eggs', 'cleared'), item(2, 'Dairy', 'trialing'), item(3, 'Soy'), item(4, 'Corn')],
});
check('summary marks no problems', watchLines.includes('Marked no problems: Eggs.'));
check('summary now being watched', watchLines.includes('Now: Dairy, being watched.'));
check('summary next', watchLines.includes('Next: Soy.'));
check('summary after that', watchLines.includes('After that: Corn.'));
check('summary ends with the one-run limit', watchLines[watchLines.length - 1] === S.SERIES_LIMIT);

const waitLines = S.seriesSummaryLines(waiting);
check('summary now waiting', waitLines.includes('Now: Eggs, waiting to start.'));

const doneLines = S.seriesSummaryLines(done);
check('summary flagged', doneLines.includes('Flagged: Dairy.'));
check('summary every food had its turn', doneLines.includes('Every food in the series has had its turn.'));

const stoppedLines = S.seriesSummaryLines(stopped);
check('summary not tried before stop', stoppedLines.includes('Not tried before it stopped: Dairy.'));
check('stopped summary does not say Next', !stoppedLines.some((line) => line.startsWith('Next:')));
check('stopped summary does not claim every turn', !stoppedLines.includes('Every food in the series has had its turn.'));

check('summary skipped', S.seriesSummaryLines(skippedOne).includes('Skipped: Eggs.'));
check('summary removed', S.seriesSummaryLines(removedOne).includes('Trial removed: Eggs.'));
check('SERIES_LIMIT is the experiment limit', S.SERIES_LIMIT === E.EXPERIMENT_LIMIT);

// 4. Wiring.
const root = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const db = read('lib/db.ts');
const log = read('app/(tabs)/log.tsx');
const peers = read('lib/peerRelationships.ts');
const changes = read('lib/snapshotChanges.ts');

check('trial_series table', db.includes('CREATE TABLE IF NOT EXISTS trial_series ('));
check('trial_series_items table', db.includes('CREATE TABLE IF NOT EXISTS trial_series_items ('));
check('no cascade on the series tables', !/trial_series[\s\S]{0,1500}ON DELETE CASCADE/.test(db.slice(db.indexOf('CREATE TABLE IF NOT EXISTS trial_series ('), db.indexOf('CREATE TABLE IF NOT EXISTS trial_series (') + 1500)));
const resolveBody = db.slice(db.indexOf('export async function resolveFoodTrial'), db.indexOf('export async function resolveFoodTrial') + 4000);
check('resolving a trial advances its series', resolveBody.includes('advanceSeriesForTrial(id)'));
const deleteBody = db.slice(db.indexOf('export async function deleteFoodTrial'), db.indexOf('export async function deleteFoodTrial') + 3000);
check('deleting a trial advances its series', deleteBody.includes('advanceSeriesForTrial(id)'));
const removePlan = db.slice(db.indexOf('export async function deleteTrialSeries'), db.indexOf('export async function deleteTrialSeries') + 400);
check('removing a plan never deletes a trial', !removePlan.includes('food_trials'));
const advance = db.slice(db.indexOf('export async function advanceTrialSeries'), db.indexOf('export async function advanceTrialSeries') + 1500);
check('the queued trial waits', advance.includes("'waiting'"));
check('the queued trial is a watch', advance.includes("'watch'"));
check('advance checks shouldQueueNext', advance.includes('shouldQueueNext(series)'));
const skip = db.slice(db.indexOf('export async function skipTrialSeriesItem'), db.indexOf('export async function skipTrialSeriesItem') + 1200);
check('skip refuses a trial that is not waiting', skip.includes("trial.status !== 'waiting'"));

check('trial_series is personal health', /'trial_series',/.test(peers));
check('trial_series_items is personal health', /'trial_series_items',/.test(peers));
check('snapshot changes counts series', changes.includes("count: ['trial_series']"));
check('snapshot changes quiet on items', changes.includes("quiet: ['trial_series_items']"));

check('Signals has the plan button', log.includes('+ Plan a series of foods'));
check('Signals loads the series', log.includes('listTrialSeries()'));
check('Signals shows the summary', log.includes('seriesSummaryLines(row)'));
check('Signals offers Stop', log.includes('Stop the series'));
check('Signals offers Remove the plan', log.includes('Remove the plan (its trials stay)'));
check('series picker is outside the ScrollView', log.indexOf('if (pickingForSeries)') < log.indexOf('if (pickingFood)'));
check('a typed waiting food says Start now', log.includes('Waiting to start: press Start now on the day you first eat it'));

// 5. Words: no dashes, no verdicts.
const said = [
  ...freshLines,
  ...watchLines,
  ...waitLines,
  ...doneLines,
  ...stoppedLines,
  ...S.seriesSummaryLines(skippedOne),
  ...S.seriesSummaryLines(removedOne),
  S.seriesProgressLine(fresh),
  S.seriesProgressLine(done),
  S.seriesProgressLine(stopped),
];
const verdicts = /\b(safe|unsafe|tolerate[sd]?|intoleran\w*|trigger\w*|caus\w*|proves?|confirm\w*|allerg\w*)\b/i;
for (const line of said) {
  check(`no dash: ${line}`, !/[–—]| -- /.test(line));
  check(`no verdict: ${line}`, !verdicts.test(line) || line === S.SERIES_LIMIT);
}

console.log(`${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
