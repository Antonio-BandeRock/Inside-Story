// Checks lib/snapshotSync.ts, the decisions behind keeping a phone and a
// computer in step through one shared OneDrive folder (2026-09-21,
// 1.0.42.28; direct instruction: "They aren't intended to be using it at the
// same time. However, that doesn't mean we don't program around that
// possibility."):
//
// 1. A snapshot file is named for the device that saved it, and the record
//    in the folder is rejected unless every field is what the app wrote.
// 2. On arrival (startup, foreground): nothing happens while sync is off,
//    while there is no record, while the latest copy is this device's, or
//    while it is the copy already loaded; the first check after turning
//    sync on asks; a newer copy with unsaved changes here asks; a newer copy
//    with nothing unsaved here loads on its own.
// 3. Before a save: skipped while off or clean; a newer copy from the other
//    device that this device never loaded is a conflict rather than being
//    written over, unless the person chose to keep what is here (force).
// 4. Every sentence a person reads is free of the banned dashes and filler.
//
// The module imports nothing. Exits non-zero on any failure.

/* global __dirname */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function load(relPath) {
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    throw new Error(`${relPath} must stay free of runtime imports (asked for ${name})`);
  });
  return module.exports;
}

const sync = load('lib/snapshotSync.ts');

let checks = 0;
let failures = 0;
function check(condition, label) {
  checks += 1;
  if (!condition) {
    failures += 1;
    console.error('FAIL: ' + label);
  }
}

const phone = { kind: 'phone', fingerprint: 'abc123' };
const computer = { kind: 'computer', fingerprint: 'def456' };
const state = (patch) => ({ ...sync.EMPTY_SYNC_STATE, enabled: true, password: 'pw', ...patch });

// 1. Names and the record.
check(sync.snapshotFileName(phone) === 'inside-story-snapshot-phone-abc123.json', 'snapshot file named for the device');
check(sync.isSnapshotFileName('inside-story-snapshot-computer-x.json'), 'snapshot name recognised');
check(!sync.isSnapshotFileName('inside-story-backup-2026-09-21.json'), 'a manual backup is not a snapshot');
const record = sync.buildSnapshotRecord(computer, '2026-09-21T10:00:00.000Z');
check(record.version === 1 && record.latest.fileName === sync.snapshotFileName(computer), 'record names the file');
check(sync.parseSnapshotRecord(JSON.stringify(record)) !== null, 'record round-trips');
check(sync.parseSnapshotRecord('not json') === null, 'garbage rejected');
check(sync.parseSnapshotRecord('{"version":2}') === null, 'unknown version rejected');
check(
  sync.parseSnapshotRecord(
    JSON.stringify({ version: 1, latest: { fileName: 'a', savedAt: 'b', device: { kind: 'tablet', fingerprint: 'x' } } }),
  ) === null,
  'unknown device kind rejected',
);
check(
  sync.parseSnapshotRecord(
    JSON.stringify({ version: 1, latest: { fileName: 'a', savedAt: 'b', device: { kind: 'phone', fingerprint: '' } } }),
  ) === null,
  'empty fingerprint rejected',
);
check(sync.sameDevice(phone, { ...phone }) && !sync.sameDevice(phone, computer), 'sameDevice compares kind and fingerprint');

// 2. On arrival.
const arrive = (rec, st, me) => sync.planOnArrival(rec, st, me);
check(arrive(record, state({ enabled: false }), phone).action === 'nothing', 'off: nothing');
check(arrive(null, state({}), phone).reason === 'noRecord', 'no record: nothing');
check(arrive(sync.buildSnapshotRecord(phone, 't1'), state({}), phone).reason === 'mine', 'my own copy: nothing');
check(arrive(record, state({ loadedSavedAt: record.latest.savedAt }), phone).reason === 'current', 'already loaded: nothing');
const first = arrive(record, state({ loadedSavedAt: null }), phone);
check(first.action === 'conflict' && first.reason === 'firstTime', 'first time: ask');
const dirty = arrive(record, state({ loadedSavedAt: 'older', dirtySince: 'now' }), phone);
check(dirty.action === 'conflict' && dirty.reason === 'unsavedChanges', 'unsaved changes here: ask');
const clean = arrive(record, state({ loadedSavedAt: 'older', dirtySince: null }), phone);
check(clean.action === 'load' && clean.record === record, 'clean and newer: load');

// 3. Before a save.
const before = (rec, st, me, opts) => sync.planBeforeSave(rec, st, me, opts);
check(before(record, state({ enabled: false, dirtySince: 'now' }), phone).reason === 'off', 'off: skip');
check(before(record, state({ dirtySince: null }), phone).reason === 'clean', 'clean: skip');
check(before(null, state({ dirtySince: 'now' }), phone).action === 'save', 'no record: save');
check(before(sync.buildSnapshotRecord(phone, 't1'), state({ dirtySince: 'now' }), phone).action === 'save', 'over my own copy: save');
check(
  before(record, state({ dirtySince: 'now', loadedSavedAt: record.latest.savedAt }), phone).action === 'save',
  'over the copy I loaded: save',
);
const clash = before(record, state({ dirtySince: 'now', loadedSavedAt: 'older' }), phone);
check(clash.action === 'conflict' && clash.record === record, 'over a copy I never loaded: conflict');
check(
  before(record, state({ dirtySince: 'now', loadedSavedAt: 'older' }), phone, { force: true }).action === 'save',
  'forced: save anyway',
);
check(
  before(record, state({ dirtySince: null, loadedSavedAt: record.latest.savedAt }), phone, { force: true }).action === 'save',
  'forced while clean: save',
);

// Timing (1.0.42.29): a periodic check while the app sits open, quiet for
// a while after a write, and the save debounce shorter than both.
check(sync.CHECK_INTERVAL_MS >= 60 * 1000, 'periodic check is at least a minute apart');
check(sync.CHECK_QUIET_MS > sync.SAVE_DEBOUNCE_MS, 'the quiet period outlasts the save debounce');
check(sync.CHECK_INTERVAL_MS > sync.CHECK_QUIET_MS, 'a check waits longer than the quiet period');

// Fingerprint.
check(sync.fingerprintText('abc') === sync.fingerprintText('abc'), 'fingerprint stable');
check(sync.fingerprintText('abc') !== sync.fingerprintText('abd'), 'fingerprint differs');
check(/^[a-z0-9]+$/.test(sync.fingerprintText('anything')), 'fingerprint is a plain token');

// 4. Sentences.
const banned = /[–—]| -- |\b(real|genuine|genuinely)\b/i;
const sentences = [
  sync.conflictMessage(first, phone),
  sync.conflictMessage(dirty, phone),
  sync.saveConflictMessage(record, phone),
  sync.loadedNotice(record),
  sync.describeSyncStatus(sync.EMPTY_SYNC_STATE, 'computer'),
  sync.describeSyncStatus(
    state({
      lastSavedAt: '2026-09-21T10:00:00.000Z',
      lastLoadedAt: '2026-09-21T09:00:00.000Z',
      dirtySince: 'x',
      lastProblem: 'The folder could not be reached.',
    }),
    'phone',
  ),
  sync.describeSyncStatus(state({}), 'phone'),
];
for (const sentence of sentences) {
  check(typeof sentence === 'string' && sentence.length > 20, 'sentence present: ' + String(sentence).slice(0, 40));
  check(!banned.test(sentence), 'sentence clean: ' + sentence.slice(0, 60));
}
check(sync.conflictMessage(first, phone).includes('your computer'), 'conflict message names the other device');
check(sync.describeSyncStatus(sync.EMPTY_SYNC_STATE, 'computer').startsWith('Off.'), 'status starts with Off when off');
check(sync.describeSyncStatus(state({}), 'phone').includes('Nothing saved from here yet'), 'status before the first save');

if (failures > 0) {
  console.error(`${failures} of ${checks} checks failed`);
  process.exit(1);
}
console.log(`snapshotSync: ${checks} checks passed`);
