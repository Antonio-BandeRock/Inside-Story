// Checks lib/recordings.ts, the audio somebody brings in for Signals > Calm
// (2026-09-30, 1.0.57.23).
//
// 1. Ids and file names: random ids, only this app's files recognised in
//    the Recordings folder.
// 2. Kinds of file: by extension, or by type when the name carries none.
// 3. Names: taken from the picked file, never two alike.
// 4. What stops a file coming in: the wrong kind, too large, empty.
// 5. A pass: send what the folder lacks, clear the folder only after this
//    device saved last, and never touch a file somebody put there by hand.
// 6. The list reads alphabetically, and the play clock.
// 7. The recordings table syncs, the cache marks and limit stay here.
// 8. No word in the module judges, scores or claims to treat, and no long
//    dashes.
//
// Exits non-zero on any failure.

/* global __dirname */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const file = path.join(__dirname, '..', 'lib', 'recordings.ts');
const source = fs.readFileSync(file, 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});
const mod = { exports: {} };
new Function('exports', 'module', 'require', outputText)(mod.exports, mod, (name) => {
  throw new Error('lib/recordings.ts must stay free of imports (asked for ' + name + ')');
});
const R = mod.exports;

let failures = 0;
function check(ok, label) {
  if (ok) return;
  failures += 1;
  console.error('FAIL', label);
}

// 1. Ids and file names.
const id = R.newRecordingId(1700000000000, 'Ab-c.d123456789');
check(id === 'rec_1700000000000_Abcd1234', `id (${id})`);
const name = R.recordingFileName(id, 'mp3');
check(name === 'rec_1700000000000_Abcd1234.mp3', 'file name');
check(R.isRecordingFileName(name), 'own file recognised');
check(!R.isRecordingFileName('My rain sounds.mp3'), 'a file dropped in by hand is not ours');
check(!R.isRecordingFileName('rec_1_a.txt'), 'not an audio kind');

// 2. Kinds.
check(R.extensionOf('Rain.MP3') === 'mp3', 'extension lower case');
check(R.extensionOf('no extension') === null, 'no extension');
check(R.isRecordingExtension('m4a') && !R.isRecordingExtension('pdf') && !R.isRecordingExtension(null), 'kinds');
check(R.extensionForMime('audio/mpeg') === 'mp3' && R.extensionForMime('audio/x-m4a') === 'm4a', 'by type');
check(R.extensionForMime('audio/ogg; codecs=opus') === 'ogg', 'type with parameters');
check(R.extensionForMime('video/mp4') === null && R.extensionForMime(null) === null, 'not audio');
check(R.recordingMimeType('m4a') === 'audio/mp4', 'mime type');

// 3. Names.
check(R.nameFromPicked('Body_scan_evening.mp3') === 'Body scan evening', 'name from file');
check(R.nameFromPicked('.mp3') === 'Recording', 'empty name falls back');
check(R.nameFromPicked('x'.repeat(200) + '.mp3').length === R.RECORDING_NAME_MAX, 'name kept short');
check(R.recordingNameProblem('  ', []) !== null, 'empty name refused');
check(R.recordingNameProblem('Rain', ['rain']) !== null, 'duplicate refused, any case');
check(R.recordingNameProblem('Rain', ['Sea']) === null, 'new name accepted');
check(R.unusedRecordingName('Rain', ['Rain', 'Rain 2']) === 'Rain 3', 'number added');
check(R.unusedRecordingName('Rain', []) === 'Rain', 'unused kept');

// 4. What stops a file.
check(R.pickedFileProblem('notes.pdf', 10) !== null, 'wrong kind');
check(R.pickedFileProblem('big.mp3', R.RECORDING_MAX_BYTES + 1) !== null, 'too large');
check(R.pickedFileProblem('empty.mp3', 0) !== null, 'empty');
check(R.pickedFileProblem('fine.wav', 1000) === null && R.pickedFileProblem('fine.wav', null) === null, 'fine');

// 5. A pass.
const rows = [
  { id: 'a', fileName: 'rec_1_a.mp3' },
  { id: 'b', fileName: 'rec_2_b.mp3' },
  { id: 'c', fileName: 'rec_3_c.mp3' },
];
const folder = ['rec_2_b.mp3', 'rec_9_gone.mp3', 'Rain I added myself.mp3'];
const plan = R.planRecordingSync({ rows, localFileNames: ['rec_1_a.mp3', 'rec_2_b.mp3'], folderNames: folder, mayClearFolder: false });
check(plan.upload.join() === 'a', 'sends what the folder lacks');
check(plan.inFolder.join() === 'b', 'confirmed in the folder');
check(plan.missing.join() === 'c', 'on the way');
check(plan.clearFromFolder.length === 0, 'never clears unless this device saved last');
const after = R.planRecordingSync({ rows, localFileNames: [], folderNames: folder, mayClearFolder: true });
check(after.clearFromFolder.join() === 'rec_9_gone.mp3', 'clears a copy no row names, and nothing put there by hand');
check(R.orphanedRecordingFiles(['rec_1_a.mp3'], ['rec_1_a.mp3', 'rec_5_x.mp3', 'other.txt']).join() === 'rec_5_x.mp3', 'orphans here');

// 6. Order and clock.
const sorted = R.sortRecordings([
  { id: '1', name: 'sea', fileName: '', mimeType: '', sizeBytes: 0, createdAt: '' },
  { id: '2', name: 'Body scan', fileName: '', mimeType: '', sizeBytes: 0, createdAt: '' },
  { id: '3', name: 'rain', fileName: '', mimeType: '', sizeBytes: 0, createdAt: '' },
]);
check(sorted.map((r) => r.name).join() === 'Body scan,rain,sea', 'alphabetical');
check(R.playClock(65) === '1:05' && R.playClock(3725) === '1:02:05' && R.playClock(NaN) === '0:00', 'play clock');

// 7. Where things are kept.
{
  const sync = fs.readFileSync(path.join(__dirname, '..', 'lib', 'snapshotSync.ts'), 'utf8');
  const tables = sync.slice(sync.indexOf('DEVICE_LOCAL_TABLES'), sync.indexOf('DEVICE_LOCAL_TABLES') + 2000);
  check(!tables.includes("'recordings'"), 'the recordings table travels between devices');
  check(tables.includes("'media_cache_use'"), 'cache marks stay on the device');
  const db = fs.readFileSync(path.join(__dirname, '..', 'lib', 'db.ts'), 'utf8');
  check(db.includes('CREATE TABLE IF NOT EXISTS recordings'), 'recordings table made');
}

// 8. Words.
const item = { sizeBytes: 3 * 1024 * 1024, mimeType: 'audio/mpeg' };
const sentences = [
  R.recordingCaption(item, 'here'), R.recordingCaption(item, 'folder'), R.recordingCaption(item, 'both'), R.recordingCaption(item, 'nowhere'),
  R.recordingsLead(true, true), R.recordingsLead(false, false), R.RECORDINGS_EMPTY, R.RECORDING_NOT_REACHABLE, R.RECORDING_ON_THE_WAY,
  R.pickedFileProblem('a.pdf', 1), R.pickedFileProblem('a.mp3', R.RECORDING_MAX_BYTES + 1), R.recordingNameProblem('', []),
];
check(R.recordingCaption(item, 'here').startsWith('MP3, 3.0 MB.'), 'caption kind and size');
const FORBIDDEN = ['great', 'well done', 'streak', 'score', 'treat', 'cure', 'heal', 'should', 'real ', 'genuine', 'optimal', 'ideal'];
for (const sentence of sentences) {
  const lower = ` ${String(sentence).toLowerCase()} `;
  for (const word of FORBIDDEN) check(!lower.includes(word), `"${sentence}" avoids "${word}"`);
}
check(!/[–—]/.test(source), 'no long dashes');

if (failures) {
  console.error(`${failures} failure(s)`);
  process.exit(1);
}
console.log('recordings: all checks passed');
