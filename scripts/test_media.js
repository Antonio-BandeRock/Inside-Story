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
// Photos in a report (lib/reportPhotos.ts) --------------------------------
const rp = load('lib/reportPhotos.ts');
{
  const items = [
    { id: 'media_1_a', fileName: 'a.jpg', takenOn: '2026-09-01', caption: null },
    { id: 'media_2_b', fileName: 'b.jpg', takenOn: '2026-09-10', caption: 'first flowers' },
    { id: 'media_3_c', fileName: 'c.jpg', takenOn: '2026-09-10', caption: null },
    { id: 'media_4_d', fileName: 'd.jpg', takenOn: '2026-10-02', caption: null },
  ];
  const picked = rp.choosePhotosForReport(items, '2026-09-01', '2026-09-30', 2);
  check('report photos: out-of-range left out of the total', picked.total === 3);
  check('report photos: newest first, capped', picked.chosen.map((i) => i.id).join() === 'media_3_c,media_2_b');
  check('report caption joins subject and caption', rp.reportPhotoCaption('2026-09-20', 'Tomato', 'first flowers') === '2026-09-20, Tomato: first flowers');
  check('report caption with nothing is the day', rp.reportPhotoCaption('2026-09-20', null, '  ') === '2026-09-20');
  check('report note says what was left out', rp.reportPhotoNote(12, 20, 0).includes('newest 12 of 20'));
  check('report note says what could not be read', rp.reportPhotoNote(3, 4, 1).includes('1 could not be read'));
  check('report text line singular', rp.reportPhotoTextLine(1) === '1 photo, shown in the PDF.');
}

// Photos between two people (lib/peerPhotos.ts) ------------------------------
const pp = load('lib/peerPhotos.ts');
{
  check('mobile with Wi-Fi only holds photos', pp.photosMayTravel('mobile', true) === false);
  check('Wi-Fi with Wi-Fi only sends', pp.photosMayTravel('wifi', true) === true);
  check('unknown network does not hold photos back', pp.photosMayTravel('unknown', true) === true);
  check('mobile with the switch off sends', pp.photosMayTravel('mobile', false) === true);

  const now = Date.parse('2026-09-26T12:00:00Z');
  const hourAgo = new Date(now - 3600 * 1000).toISOString();
  const twoDaysAgo = new Date(now - 48 * 3600 * 1000).toISOString();
  const thumbs = [
    { id: 'p_old', recipeId: 'r1', takenOn: '2026-09-01', base64Length: 40000 },
    { id: 'p_new', recipeId: 'r2', takenOn: '2026-09-20', base64Length: 40000 },
    { id: 'p_acked', recipeId: 'r3', takenOn: '2026-09-25', base64Length: 40000 },
    { id: 'p_recent', recipeId: 'r4', takenOn: '2026-09-24', base64Length: 40000 },
    { id: 'p_stale', recipeId: 'r5', takenOn: '2026-09-23', base64Length: 40000 },
  ];
  const thumbState = new Map([
    ['p_acked', { sentAt: twoDaysAgo, ackedAt: hourAgo }],
    ['p_recent', { sentAt: hourAgo, ackedAt: null }],
    ['p_stale', { sentAt: twoDaysAgo, ackedAt: null }],
  ]);
  const chosen = pp.choosePeerPhotos({
    thumbs, thumbState, requestedFull: [{ id: 'p_old', base64Length: 500000 }], fullState: new Map(), budget: 600000, now,
  });
  check('asked-for report size goes first', chosen.fullIds.join() === 'p_old');
  check('acknowledged and just-sent thumbnails wait; newest due ones fill what is left',
    chosen.thumbIds.join() === 'p_stale,p_new', );
  const relay = pp.choosePeerPhotos({ thumbs, thumbState: new Map(), requestedFull: [], fullState: new Map(), budget: 100000, now });
  check('a small budget takes only what fits', relay.thumbIds.length === 2 && relay.thumbIds[0] === 'p_acked');

  check('photos travel only beside a dish on the plan',
    pp.photosForPlan([{ recipeId: 'a' }, { recipeId: 'b' }], new Set(['b'])).length === 1);
  const newest = pp.newestPerRecipe([
    { id: 'x1', recipeId: 'a', takenOn: '2026-09-01' },
    { id: 'x2', recipeId: 'a', takenOn: '2026-09-05' },
    { id: 'x3', recipeId: 'b', takenOn: '2026-09-02' },
  ]);
  check('newest per dish', newest.map((p) => p.id).sort().join() === 'x2,x3');

  const clean = pp.cleanPeerPhotoPart({
    photos: [
      { id: 'media_1_a', recipeId: 'curated_smoothie_green_glow', takenOn: '2026-09-20', caption: ' lunch ', thumb: 'QUJD' },
      { id: 'bad id!', recipeId: 'r', takenOn: '2026-09-20', thumb: 'QUJD' },
      { id: 'media_2', recipeId: 'r', takenOn: 'yesterday', thumb: 'QUJD' },
      { id: 'media_3', recipeId: 'r', takenOn: '2026-09-20', thumb: 'not base64 at all' },
      { id: 'media_4', recipeId: 'r', takenOn: '2026-09-20', thumb: 'A'.repeat(pp.PEER_MAX_THUMB_BASE64 + 4) },
    ],
    photoFull: [{ id: 'media_1_a', data: 'QUJD' }, { id: 'media_1_a', data: 42 }],
    photoAcks: ['media_1_a', 'media_1_a', '../etc', 7],
    photoRequests: 'media_1_a',
  });
  check('only the well-formed thumbnail is kept', clean.photos && clean.photos.length === 1 && clean.photos[0].caption === 'lunch');
  check('only the well-formed full size is kept', clean.photoFull && clean.photoFull.length === 1);
  check('acks deduplicated and shape-checked', clean.photoAcks && clean.photoAcks.join() === 'media_1_a');
  check('a non-list of requests is dropped', clean.photoRequests === undefined);
  check('an empty payload gives an empty part', Object.keys(pp.cleanPeerPhotoPart({})).length === 0);
}

// The storage line with photos from other people.
check('storage line counts photos from others', m.photoStorageSentence(3, 3000000, { photos: 2, bytes: 90000 }).includes('2 photos from people you share meals with'));
check('storage line leaves others out when there are none', !m.photoStorageSentence(3, 3000000).includes('share meals'));

const FORBIDDEN = [
  'real', 'genuine', ' own ', '—', '–', ' -- ',
  'well done', 'good job', 'keep it up', 'great job', 'you should', 'normal', 'healthy',
  'caused', 'causes', 'because of', 'diagnos', 'too low', 'too high', 'ideal', 'optimal',
];
const sentences = [
  off, notYet, none, inStep, behind, problem,
  m.PHOTO_ON_THE_WAY, m.PHOTO_STRIP_EMPTY_LINE, m.photoRemovalSentence(),
  m.takenOnLabel('2026-09-03', '2026-09-26'), m.takenOnLabel('x', '2026-09-26'),
  m.photoStorageSentence(0, 0), m.photoStorageSentence(3, 3000000, { photos: 1, bytes: 40000 }),
  rp.reportPhotoNote(12, 20, 2), rp.reportPhotoNote(2, 2, 0), rp.reportPhotoTextLine(3),
  pp.PEER_PHOTO_TAP_LINE, pp.peerPhotoAskedLine('Sam'), pp.PEER_PHOTOS_WIFI_ONLY_LABEL, pp.PEER_PHOTOS_WIFI_ONLY_WHAT,
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
