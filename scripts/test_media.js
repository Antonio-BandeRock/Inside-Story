// Checks the one photo layer (X1, lib/media.ts): names and ids, the local
// day a photo is filed under, the order photos show in, how "taken on"
// reads, what a pass of copying through the shared folder does (send, fetch,
// wait, and clear the folder only straight after this device saved), which
// local files no row refers to, and the status line Profile shows. Then
// every sentence the file writes is swept for verdict and praise words.
//
// Pure, so it runs here rather than needing a phone. Exits non-zero on any
// failure.

// eslint-config-expo lints this repo as app code, which has no __dirname.
// This is a plain Node script run with node, so it does.
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
  new Function('exports', 'module', 'require', outputText)(module.exports, module, () => {
    throw new Error(`${relPath} must stay free of runtime imports`);
  });
  return module.exports;
}

const m = load('lib/media.ts');

let failures = 0;
function check(label, ok) {
  if (ok) return;
  failures += 1;
  console.error('FAIL', label);
}

// Names.
const id = m.newMediaId(1790000000000, 'a1-B2.c3d4e5f6');
check(`id shape (${id})`, /^media_1790000000000_[a-zA-Z0-9]{1,8}$/.test(id));
check('file name', m.mediaFileName(id) === `${id}.jpg`);
check('copy name', m.photoCopyName(id) === `${id}.photo.json`);
check('copy name round trip', m.idFromPhotoCopyName(m.photoCopyName(id)) === id);
check('other files ignored', m.idFromPhotoCopyName('inside-story-sync.json') === null);
check('path characters refused', m.idFromPhotoCopyName('../x.photo.json') === null);
check('unsafe id cleaned in file name', !m.mediaFileName('a/b').includes('/'));

// Local day.
check('local day of an evening', m.localDay(new Date(2026, 8, 25, 23, 30)) === '2026-09-25');
check('local day padded', m.localDay(new Date(2026, 0, 5, 8)) === '2026-01-05');
check('isLocalDay accepts', m.isLocalDay('2026-02-28'));
check('isLocalDay refuses 30 Feb', !m.isLocalDay('2026-02-30'));
check('isLocalDay refuses a stamp', !m.isLocalDay('2026-02-28T10:00'));

// Order.
const item = (id, takenOn, createdAt) => ({ id, ownerKind: 'planting', ownerId: 'p', fileName: `${id}.jpg`, takenOn, caption: null, width: 10, height: 10, createdAt });
const sorted = m.sortMedia([
  item('a', '2026-09-01', '2026-09-01T10:00:00Z'),
  item('b', '2026-09-20', '2026-09-20T12:00:00Z'),
  item('c', '2026-09-20', '2026-09-20T09:00:00Z'),
]);
check('newest day first, then order added', sorted.map((x) => x.id).join() === 'c,b,a');

// Taken on.
check('today', m.takenOnLabel('2026-09-26', '2026-09-26') === 'Taken today');
check('yesterday', m.takenOnLabel('2026-09-25', '2026-09-26') === 'Taken yesterday');
check('yesterday across a month', m.takenOnLabel('2026-08-31', '2026-09-01') === 'Taken yesterday');
check('a date', m.takenOnLabel('2026-09-03', '2026-09-26') === 'Taken 3 September 2026');
check('not known', m.takenOnLabel('soon', '2026-09-26') === 'Date not known');

// A pass.
const copy = (x) => m.photoCopyName(x);
const plan = m.planPhotoSync({
  rowIds: ['here-only', 'both', 'folder-only-row', 'nowhere'],
  localFileIds: ['here-only', 'both'],
  folderNames: [copy('both'), copy('folder-only-row'), copy('removed'), 'inside-story-sync.json'],
  mayClearFolder: false,
});
check('uploads what the folder lacks', plan.upload.join() === 'here-only');
check('downloads what this device lacks', plan.download.join() === 'folder-only-row');
check('waits for what is nowhere yet', plan.waiting.join() === 'nowhere');
check('never clears unless allowed', plan.clearFromFolder.length === 0);
const afterSave = m.planPhotoSync({
  rowIds: ['both'],
  localFileIds: ['both'],
  folderNames: [copy('both'), copy('removed'), 'inside-story-sync.json'],
  mayClearFolder: true,
});
check('clears a copy no row refers to after saving', afterSave.clearFromFolder.join() === 'removed');
check('never clears a copy a row refers to', !afterSave.clearFromFolder.includes('both'));
check('nothing to do when in step', afterSave.upload.length === 0 && afterSave.download.length === 0);

// Local files.
check(
  'orphaned files',
  m.orphanedLocalFiles(['a.jpg', 'b.jpg'], ['a.jpg', 'gone.jpg', 'notes.txt']).join() === 'gone.jpg',
);

// Status line.
const off = m.photoSyncSentence(null, false, 'computer');
const notYet = m.photoSyncSentence(null, true, 'computer');
const none = m.photoSyncSentence({ onDevice: 0, waiting: 0, toCopy: 0, problem: null, checkedAt: 'x' }, true, 'computer');
const inStep = m.photoSyncSentence({ onDevice: 1, waiting: 0, toCopy: 0, problem: null, checkedAt: 'x' }, true, 'phone');
const behind = m.photoSyncSentence({ onDevice: 3, waiting: 2, toCopy: 1, problem: null, checkedAt: 'x' }, true, 'phone');
const problem = m.photoSyncSentence({ onDevice: 3, waiting: 0, toCopy: 0, problem: 'The folder could not be reached.', checkedAt: 'x' }, true, 'phone');
check('off says this device only', off.includes('this device only'));
check('in step singular', inStep === '1 photo on this device. Each one has an encrypted copy in the shared folder.');
check(`behind counts (${behind})`, behind.includes('3 photos on this device.') && behind.includes('1 photo is still to be copied.') && behind.includes('2 photos are on the way from your phone.'));
check('problem said', problem.includes('could not be copied this time'));

// Sweep.
const FORBIDDEN = [
  'real', 'genuine', ' own ', '—', '–', ' -- ',
  'well done', 'good job', 'keep it up', 'great job', 'you should', 'normal', 'healthy',
  'caused', 'causes', 'because of', 'diagnos', 'too low', 'too high', 'ideal', 'optimal',
];
const sentences = [
  off, notYet, none, inStep, behind, problem,
  m.PHOTO_ON_THE_WAY, m.PHOTO_STRIP_EMPTY_LINE, m.photoRemovalSentence(),
  m.takenOnLabel('2026-09-03', '2026-09-26'), m.takenOnLabel('x', '2026-09-26'),
];
for (const sentence of sentences) {
  const lower = ` ${String(sentence).toLowerCase()} `;
  for (const word of FORBIDDEN) check(`"${sentence}" avoids "${word}"`, !lower.includes(word));
}

if (failures) {
  console.error(`${failures} failure(s)`);
  process.exit(1);
}
console.log('media: all checks passed');
