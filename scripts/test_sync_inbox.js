// Runs lib/syncInbox.ts: how files in a shared folder are named and addressed.
//
// Built 2026-09-06, after the OneDrive API route was ruled out on evidence
// (Graph's createLink needs full read and write to somebody's entire OneDrive
// for a personal account, which is disproportionate for a few hundred bytes).
// The carrier instead is a folder the person picks, with whatever sync app owns
// that folder moving the bytes.
//
// The risks, in order:
//
//  1. READING SOMEBODY ELSE'S FILE. A household folder holds everybody's files.
//     If the recipient half of a name is ignored, one device downloads and
//     attempts another person's payloads. The encryption would refuse them, but
//     relying on that alone means the addressing is doing no work at all, and a
//     listing already reveals who is talking to whom.
//  2. BELIEVING A FILENAME. Nothing stops a file being named as though it came
//     from someone. The name decides what is worth opening; the sealed payload
//     decides who actually wrote it, and a disagreement has to be refused rather
//     than attributed to the wrong person.
//  3. NOT RECOGNISING OUR OWN FILES. A name written by one device and not
//     matched by the other is a silent failure: nothing errors, the plan simply
//     never arrives.
//  4. MATCHING WHAT IS NOT OURS. A synced folder is full of other things,
//     including the temporary and conflict copies sync services make out of the
//     very files this app wrote.
//
// Run with: node scripts/test_sync_inbox.js
// Exits non-zero on any failure.

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const LIB = path.join(__dirname, '..', 'lib');

function throwingStub(what) {
  return new Proxy(
    {},
    {
      get(_unused, prop) {
        if (prop === '__esModule') return true;
        if (prop === 'default') return throwingStub(what);
        throw new Error(`This harness stubs ${what}; it cannot provide ${String(prop)}.`);
      },
    },
  );
}

function loadModule(name, cache = new Map()) {
  if (cache.has(name)) return cache.get(name);
  const source = fs.readFileSync(path.join(LIB, `${name}.ts`), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    fileName: `${name}.ts`,
  });
  const module = { exports: {} };
  cache.set(name, module.exports);
  const localRequire = (request) => {
    if (request === 'tweetnacl') return require(request);
    if (!request.startsWith('./')) return throwingStub(request);
    const target = request.slice(2);
    if (target === 'db') return throwingStub('lib/db.ts');
    return loadModule(target, cache);
  };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, localRequire);
  cache.set(name, module.exports);
  return module.exports;
}

const {
  SYNC_FILE_PREFIX,
  SYNC_FILE_EXTENSION,
  compactFingerprint,
  buildSyncFileName,
  parseSyncFileName,
  incomingFilesFor,
  resolveSender,
  outgoingFileNames,
} = loadModule('syncInbox');

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
function checkFalse(label, actual) { check(label, actual === false, true); }

// Three real-shaped fingerprints, deliberately different at every position so an
// off-by-one or a transposition cannot pass by coincidence. This is the fourth
// time in this project a fixture uniform enough to satisfy two rules has tested
// neither, so these are varied on purpose.
const MINE = 'A1B2C3D4E5F67890';
const LISA = 'FEDCBA9876543210';
const CHILD = '0123456789ABCDEF';
const MINE_DISPLAY = 'A1B2 C3D4 E5F6 7890';

// -- compactFingerprint ------------------------------------------------------

check('display spacing comes out', compactFingerprint(MINE_DISPLAY), MINE);
check('an already-compact fingerprint passes through', compactFingerprint(MINE), MINE);
check('lower case is normalised up', compactFingerprint('a1b2c3d4e5f67890'), MINE);
check('mixed and irregular spacing still resolves', compactFingerprint('  a1b2 C3D4E5F6 7890 '), MINE);
check('too short is refused', compactFingerprint('A1B2C3D4E5F6789'), null);
check('too long is refused', compactFingerprint('A1B2C3D4E5F678901'), null);
check('non-hex is refused', compactFingerprint('A1B2C3D4E5F6789G'), null);
check('empty is refused', compactFingerprint(''), null);
check('a name is not a fingerprint', compactFingerprint('Lisa'), null);

// -- buildSyncFileName -------------------------------------------------------

const TO_LISA = buildSyncFileName(LISA, MINE);
check('a filename is built from recipient then sender', TO_LISA, `is-sync-${LISA}-${MINE}.json`);
check('the display form builds the same name', buildSyncFileName(LISA, MINE_DISPLAY), TO_LISA);
check('nothing addresses itself', buildSyncFileName(MINE, MINE), null);
check('a bad recipient builds no name', buildSyncFileName('Lisa', MINE), null);
check('a bad sender builds no name', buildSyncFileName(LISA, 'me'), null);
check('the declared prefix is the one used', TO_LISA.startsWith(`${SYNC_FILE_PREFIX}-`), true);
check('the declared extension is the one used', TO_LISA.endsWith(SYNC_FILE_EXTENSION), true);

// -- parseSyncFileName -------------------------------------------------------

check('a built name parses back to the same pair', parseSyncFileName(TO_LISA), {
  toFingerprint: LISA,
  fromFingerprint: MINE,
});

// A folder chosen through Android's Storage Access Framework lists its contents
// as content:// URIs with the name percent-encoded inside the document id, so
// this is the shape a real listing hands over, not a convenient one.
const SAF_URI =
  'content://com.android.externalstorage.documents/tree/primary%3ASync/document/primary%3ASync%2F' +
  encodeURIComponent(TO_LISA);
check('a SAF content URI parses to the same pair', parseSyncFileName(SAF_URI), {
  toFingerprint: LISA,
  fromFingerprint: MINE,
});
check('a plain posix path parses', parseSyncFileName(`/storage/emulated/0/Sync/${TO_LISA}`), {
  toFingerprint: LISA,
  fromFingerprint: MINE,
});
check('a windows path parses', parseSyncFileName(`C:\\Users\\Tony\\OneDrive\\Sync\\${TO_LISA}`), {
  toFingerprint: LISA,
  fromFingerprint: MINE,
});
check('a case-folded name still parses, since some file systems fold case',
  parseSyncFileName(TO_LISA.toLowerCase()), { toFingerprint: LISA, fromFingerprint: MINE });

// Things a real synced folder actually contains.
check('an ordinary photo is not ours', parseSyncFileName('IMG_20260906_101500.jpg'), null);
check('another app json is not ours', parseSyncFileName('settings.json'), null);
check('a name that merely starts similarly is not ours',
  parseSyncFileName('is-syncing-notes.json'), null);
check('the prefix alone is not ours', parseSyncFileName('is-sync.json'), null);
check('one fingerprint is not enough', parseSyncFileName(`is-sync-${LISA}.json`), null);
check('three segments are not ours', parseSyncFileName(`is-sync-${LISA}-${MINE}-${CHILD}.json`), null);
check('a self-addressed name is refused on read too',
  parseSyncFileName(`is-sync-${MINE}-${MINE}.json`), null);
check('a garbled fingerprint is refused', parseSyncFileName('is-sync-NOTAKEY-ALSONOT.json'), null);

// The temporary and conflict copies sync services make out of our own files.
// These matter because they carry a valid pair inside a name that is no longer
// the file we wrote, and reading a half-written temp file as a payload is worse
// than ignoring it.
check('a partial download is not ours', parseSyncFileName(`${TO_LISA}.tmp`), null);
// A five-character extension is the case that isolates the extension check from
// the slice arithmetic: removing five characters from the end of these lands
// exactly on a valid pair, so only refusing the wrong suffix catches them. .part
// is what several downloaders name a file that is still arriving.
check('a .part file still arriving is not ours',
  parseSyncFileName(`is-sync-${LISA}-${MINE}.part`), null);
check('a same-named file with another five-letter extension is not ours',
  parseSyncFileName(`is-sync-${LISA}-${MINE}.data`), null);
check('no extension at all is not ours',
  parseSyncFileName(`is-sync-${LISA}-${MINE}`), null);
check('a OneDrive conflict copy is not ours',
  parseSyncFileName(`is-sync-${LISA}-${MINE}-DESKTOP.json`), null);
check('a Dropbox conflict copy is not ours',
  parseSyncFileName(`is-sync-${LISA}-${MINE} (conflicted copy).json`), null);
check('a numbered duplicate is not ours',
  parseSyncFileName(`is-sync-${LISA}-${MINE} (1).json`), null);

// Never throws, whatever it is handed. This sits where another device's folder
// listing arrives.
for (const [label, value] of [
  ['an empty string', ''],
  ['a lone dot', '.'],
  ['a lone slash', '/'],
  ['a stray percent sign', 'is-sync-%-%.json'],
  ['a truncated escape', `${SYNC_FILE_PREFIX}-%A-%B.json`],
]) {
  checks += 1;
  try {
    parseSyncFileName(value);
  } catch (error) {
    failures += 1;
    console.error(`FAIL  ${label} must not throw`);
    console.error(`      ${error.message}`);
  }
}

// -- incomingFilesFor: the privacy-relevant one ------------------------------

const FOLDER = [
  buildSyncFileName(MINE, LISA), // for me, from Lisa
  buildSyncFileName(MINE, CHILD), // for me, from a child
  buildSyncFileName(LISA, MINE), // written by me, for Lisa
  buildSyncFileName(LISA, CHILD), // Lisa's mail from a child: not mine to open
  buildSyncFileName(CHILD, LISA), // a child's mail from Lisa: not mine to open
  'IMG_20260906_101500.jpg',
  'Shopping list.docx',
];

const mine = incomingFilesFor(FOLDER, MINE);
check('only the files addressed to me come back', mine.length, 2);
check('and each one names who it is from',
  mine.map((f) => f.fromFingerprint).sort(), [CHILD, LISA].sort());
checkFalse('nothing I wrote is read back as incoming',
  mine.some((f) => f.entry === buildSyncFileName(LISA, MINE)));
checkFalse("Lisa's mail from a child is not mine",
  mine.some((f) => f.entry === buildSyncFileName(LISA, CHILD)));
checkFalse("a child's mail from Lisa is not mine",
  mine.some((f) => f.entry === buildSyncFileName(CHILD, LISA)));
check('the original entry is handed back so it can be read',
  mine.every((f) => FOLDER.includes(f.entry)), true);

check("Lisa's own view of the same folder is her own mail",
  incomingFilesFor(FOLDER, LISA).map((f) => f.fromFingerprint).sort(), [CHILD, MINE].sort());
check('a device nobody has written to sees nothing',
  incomingFilesFor(FOLDER, '00000000000000AA'), []);
check('a folder of nothing relevant yields nothing',
  incomingFilesFor(['IMG_1.jpg', 'notes.txt'], MINE), []);
check('an empty folder yields nothing', incomingFilesFor([], MINE), []);
check('an unusable fingerprint reads nothing rather than everything',
  incomingFilesFor(FOLDER, 'Tony'), []);

// SAF listings go through the same path.
check('a folder listed as SAF URIs resolves the same way',
  incomingFilesFor(
    FOLDER.map((name) => `content://x/tree/y/document/y%2F${encodeURIComponent(name)}`),
    MINE,
  ).map((f) => f.fromFingerprint).sort(),
  [CHILD, LISA].sort());

// Two files from one sender should not both come back, since one file per
// direction is the whole design and a duplicate means something went wrong.
check('a duplicate from one sender is taken once',
  incomingFilesFor([buildSyncFileName(MINE, LISA), `/other/${buildSyncFileName(MINE, LISA)}`], MINE).length,
  1);

// -- resolveSender: the name is not evidence ---------------------------------

check('a matching pair is trusted', resolveSender(LISA, LISA), { trusted: true, fingerprint: LISA });
check('the display form on either side still matches',
  resolveSender('FEDC BA98 7654 3210', LISA), { trusted: true, fingerprint: LISA });

const spoofed = resolveSender(LISA, CHILD);
checkFalse('a file naming Lisa but written by another device is refused', spoofed.trusted);
checkTrue('and it says the name and the contents disagree',
  spoofed.trusted === false && spoofed.reason.includes('disagree'));

const noPayloadId = resolveSender(LISA, '');
checkFalse('a payload with no sender is refused', noPayloadId.trusted);
checkTrue('and it says the file did not say who wrote it',
  noPayloadId.trusted === false && noPayloadId.reason.includes('did not say which device'));

const noNameId = resolveSender('', LISA);
checkFalse('a name with no sender is refused', noNameId.trusted);

checkFalse('case is not what makes them differ',
  resolveSender(LISA.toLowerCase(), LISA).trusted === false);

// -- outgoingFileNames -------------------------------------------------------

check('one name per recipient', outgoingFileNames(MINE, [LISA, CHILD]),
  [buildSyncFileName(LISA, MINE), buildSyncFileName(CHILD, MINE)]);
check('a recipient that is me is skipped', outgoingFileNames(MINE, [LISA, MINE]),
  [buildSyncFileName(LISA, MINE)]);
check('an unusable recipient is skipped rather than named badly',
  outgoingFileNames(MINE, [LISA, 'Lisa']), [buildSyncFileName(LISA, MINE)]);
check('no recipients means nothing to write', outgoingFileNames(MINE, []), []);
check('every name I would write is one I would recognise as mine',
  outgoingFileNames(MINE, [LISA, CHILD]).every((name) => {
    const parsed = parseSyncFileName(name);
    return parsed !== null && parsed.fromFingerprint === MINE;
  }),
  true);
checkFalse('and none of them would be read back into my own inbox',
  incomingFilesFor(outgoingFileNames(MINE, [LISA, CHILD]), MINE).length > 0);

if (failures) {
  console.error(`\n${failures} of ${checks} checks failed`);
  process.exit(1);
}
console.log(`${checks}/${checks} checks passed`);
