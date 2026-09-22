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
// 5. Each of those sentences says what actually changed, on each side, in
//    the words lib/snapshotChanges.ts hands it.
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

// Timing (1.0.42.29, shortened 1.0.42.30): a periodic check while the app
// sits open, quiet for a while after a write, and the save debounce
// shorter than both.
check(sync.CHECK_INTERVAL_MS >= 20 * 1000, 'periodic check is not so often it hammers the folder');
check(sync.CHECK_INTERVAL_MS <= 60 * 1000, 'periodic check is at most a minute apart');
check(sync.CHECK_QUIET_MS > sync.SAVE_DEBOUNCE_MS, 'the quiet period outlasts the save debounce');
check(sync.CHECK_INTERVAL_MS > sync.CHECK_QUIET_MS, 'a check waits longer than the quiet period');

// What never travels inside a snapshot (1.0.42.30). The shared folder is
// addressed one way on a phone and another on a computer, so a copy
// carrying it left the other device with no folder it could use.
check(sync.DEVICE_LOCAL_META_KEYS.includes('onedrive_folder'), 'the shared folder is device local');
check(sync.DEVICE_LOCAL_META_KEYS.includes('reference_db_version'), 'the reference database marker is device local');
check(sync.isDeviceLocalMetaKey('sync_folder_uri'), 'an Android folder permission is device local');
check(!sync.isDeviceLocalMetaKey('visual_preferences'), 'settings still travel');
check(!sync.isDeviceLocalMetaKey(undefined), 'a missing key is not device local');
const strippedTables = sync.withoutDeviceLocalRows({
  app_meta: [
    { key: 'onedrive_folder', value: '{}' },
    { key: 'visual_preferences', value: '{}' },
    { key: 'reference_db_version', value: '5' },
  ],
  meals: [{ id: 1 }],
});
check(strippedTables.app_meta.length === 1, 'device local rows are taken out');
check(strippedTables.app_meta[0].key === 'visual_preferences', 'the settings row is the one kept');
check(strippedTables.meals.length === 1, 'every other table is untouched');
const noMeta = { meals: [{ id: 1 }] };
check(sync.withoutDeviceLocalRows(noMeta) === noMeta, 'tables without app_meta come back as they were');

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

// 5. Saying what changed.
check(sync.CHANGE_BASELINE_META_KEY === 'sync_change_baseline', 'the baseline is kept under its own key');
check(sync.DEVICE_LOCAL_META_KEYS.includes(sync.CHANGE_BASELINE_META_KEY), 'the change baseline never travels');
check(sync.listPhrases([]) === '', 'nothing to say reads as nothing');
check(sync.listPhrases(['3 more meals']) === '3 more meals', 'one phrase stands alone');
check(sync.listPhrases(['a', 'b']) === 'a and b', 'two phrases are joined with and');
check(sync.listPhrases(['a', 'b', 'c']) === 'a, b and c', 'three phrases read as a list');

const notes = { there: ['3 more meals', 'edits to your schedule'], here: ['1 more capture'] };
const both = sync.conflictMessage(dirty, phone, notes);
check(
  both.includes('What that copy brings: 3 more meals and edits to your schedule.'),
  'the question says what the copy that arrived brings',
);
check(both.includes('Not saved here yet: 1 more capture.'), 'the question says what is waiting here');
check(
  both.indexOf('What that copy brings') < both.indexOf('Not saved here yet'),
  'what arrived is said before what is waiting here',
);
check(
  both.indexOf('saved a copy on') < both.indexOf('What that copy brings'),
  'what changed comes after the opening',
);
check(both.endsWith('save it over that copy.'), 'the choice is still the last thing said');
check(
  sync.conflictMessage(dirty, phone) === sync.conflictMessage(dirty, phone, {}),
  'a question with nothing to add reads as it did before',
);
check(
  !sync.conflictMessage(dirty, phone, { there: [] }).includes('What that copy brings'),
  'a copy that changed nothing worth saying is left unsaid',
);
check(
  !sync.conflictMessage(dirty, phone, { here: ['1 more capture'] }).includes('What that copy brings'),
  'only the side that is known yet is spoken for',
);
check(
  sync.conflictMessage(first, phone, notes).includes('What that copy brings: 3 more meals'),
  'the first check after turning sync on says it too',
);

const refused = sync.saveConflictMessage(record, phone, notes);
check(
  refused.includes('What that copy brings: 3 more meals and edits to your schedule.'),
  'a refused save says what the copy in the folder brings',
);
check(refused.includes('Not saved here yet: 1 more capture.'), 'a refused save says what is waiting here');

check(
  sync.loadedNotice(record, ['3 more meals']).endsWith('What came over: 3 more meals.'),
  'the notice after a load says what came over',
);
check(sync.loadedNotice(record, []) === sync.loadedNotice(record), 'nothing to say leaves the notice as it was');
check(
  sync.loadedNotice(record, ['a', 'b', 'c']).includes('What came over: a, b and c.'),
  'the notice lists everything that came over',
);

for (const sentence of [both, refused, sync.loadedNotice(record, ['3 more meals', '2 fewer garden areas'])]) {
  check(!banned.test(sentence), 'sentence clean: ' + sentence.slice(0, 60));
  check(!/\.\s*\./.test(sentence), 'sentence has no doubled full stop: ' + sentence.slice(0, 60));
  check(!/ {2}/.test(sentence), 'sentence has no doubled space: ' + sentence.slice(0, 60));
}

if (failures > 0) {
  console.error(`${failures} of ${checks} checks failed`);
  process.exit(1);
}
console.log(`snapshotSync: ${checks} checks passed`);
