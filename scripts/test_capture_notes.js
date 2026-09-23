// Checks the capture inbox's own rules (lib/captureNotes.ts): what counts as
// worth keeping, how a note's age is said out loud, and how sorted notes are
// gathered under the place they were sent to. Pure, so it runs here rather
// than needing a phone.
//
// Exits non-zero on any failure.

// eslint-config-expo lints this repo as app code, which has no __dirname.
// This is a plain Node script run with node, so it does (2026-09-16).
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
    throw new Error('lib/captureNotes.ts must stay free of runtime imports');
  });
  return module.exports;
}

const {
  ALL_CAPTURE_DESTINATION_KEYS,
  CAPTURE_DESTINATIONS,
  MAX_CAPTURE_LENGTH,
  captureDestination,
  cleanCaptureText,
  countCaptureNotes,
  describeCaptureAge,
  describeInbox,
  groupSortedByDestination,
  isCaptureTextUsable,
} = load('lib/captureNotes.ts');

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

// --- What gets kept, and in what words -------------------------------------

check('surrounding space goes', cleanCaptureText('  call the dentist  '), 'call the dentist');
check('the double spaces dictation leaves behind collapse', cleanCaptureText('call  the   dentist'), 'call the dentist');
check('a soft keyboard return becomes a space', cleanCaptureText('call the dentist\nabout Tuesday'), 'call the dentist about Tuesday');
check('a tab is space like any other', cleanCaptureText('call\tthe dentist'), 'call the dentist');
// The words themselves are never edited: a capture that quietly rewrites what
// someone said is worse than one that keeps a typo.
check('a typo survives', cleanCaptureText('call the dentsit'), 'call the dentsit');
check('capitalisation survives', cleanCaptureText('Call The Dentist'), 'Call The Dentist');
check('nothing is nothing', cleanCaptureText('   '), '');
check('a non-string is nothing rather than a crash', cleanCaptureText(null), '');
check('undefined is nothing too', cleanCaptureText(undefined), '');

const long = 'a'.repeat(MAX_CAPTURE_LENGTH + 50);
check('a long thought is trimmed, not refused', cleanCaptureText(long).length, MAX_CAPTURE_LENGTH);
check('a thought at the cap is untouched', cleanCaptureText('b'.repeat(MAX_CAPTURE_LENGTH)).length, MAX_CAPTURE_LENGTH);

check('a stray pocket tap is not worth a row', isCaptureTextUsable('a'), false);
check('empty is not worth a row', isCaptureTextUsable(''), false);
check('space is not worth a row', isCaptureTextUsable('    '), false);
check('an empty recognizer result is not worth a row', isCaptureTextUsable(null), false);
check('two characters is', isCaptureTextUsable('ok'), true);
check('two characters with space around them is', isCaptureTextUsable('  ok  '), true);

// --- How long it has been sitting there ------------------------------------

const now = new Date('2026-09-16T12:00:00.000Z');
function ago(ms) {
  return describeCaptureAge(new Date(now.getTime() - ms).toISOString(), now);
}
const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

check('this second', ago(0), 'just now');
check('under a minute', ago(59 * 1000), 'just now');
check('one minute', ago(MIN), '1 min ago');
check('fifty-nine minutes', ago(59 * MIN), '59 min ago');
check('one hour reads as words, not a 1', ago(HOUR), 'an hour ago');
check('two hours', ago(2 * HOUR), '2 hours ago');
check('twenty-three hours', ago(23 * HOUR), '23 hours ago');
check('a day', ago(DAY), 'yesterday');
check('two days', ago(2 * DAY), '2 days ago');
check('six days', ago(6 * DAY), '6 days ago');
check('seven days', ago(7 * DAY), 'a week ago');
check('two weeks', ago(14 * DAY), '2 weeks ago');
// The point of showing this at all: three weeks is telling you something the
// note itself is not.
check('three weeks', ago(21 * DAY), '3 weeks ago');
check('four weeks', ago(28 * DAY), '4 weeks ago');
check('five weeks is a month', ago(35 * DAY), 'a month ago');
check('sixty days is two months', ago(60 * DAY), '2 months ago');
check('a date nobody can parse says nothing', describeCaptureAge('not a date', now), '');
check('an empty date says nothing', describeCaptureAge('', now), '');

// --- Counting and grouping --------------------------------------------------

function note(id, status, destination) {
  return {
    id,
    text: id,
    source: 'typed',
    status,
    destination: destination ?? null,
    createdAt: now.toISOString(),
    sortedAt: null,
    doneAt: null,
  };
}

const pile = [
  note('w1', 'waiting'),
  note('w2', 'waiting'),
  note('s1', 'sorted', 'calendar'),
  note('s2', 'sorted', 'garden'),
  note('s3', 'sorted', 'calendar'),
  note('d1', 'done', 'money'),
];

check('the three piles are counted apart', countCaptureNotes(pile), { waiting: 2, sorted: 1 + 2, done: 1 });
check('nothing counts as nothing', countCaptureNotes([]), { waiting: 0, sorted: 0, done: 0 });

const groups = groupSortedByDestination(pile);
check('only destinations with something under them appear', groups.map((g) => g.destination.key), ['calendar', 'garden']);
check('a group holds its own notes in the order given', groups[0].notes.map((n) => n.id), ['s1', 's3']);
// A done note carries a destination too, and must not reappear in the sorted
// list under it: it has been dealt with.
check('a done note is not grouped', groups.some((g) => g.destination.key === 'money'), false);
check('a waiting note is not grouped', groups.flatMap((g) => g.notes).map((n) => n.id), ['s1', 's3', 's2']);

// Headings must not shuffle as notes come and go, so the order is
// CAPTURE_DESTINATIONS' own, never the order the notes happen to arrive in.
const reversed = groupSortedByDestination([note('g', 'sorted', 'garden'), note('c', 'sorted', 'calendar')]);
check('heading order follows the destination list, not the notes', reversed.map((g) => g.destination.key), ['calendar', 'garden']);
check('nothing sorted is no groups', groupSortedByDestination([]), []);

// --- What the Home card says ------------------------------------------------

// An empty inbox is the normal state, and a card announcing "0 waiting" every
// morning is noise.
check('an empty inbox says nothing at all', describeInbox({ waiting: 0, sorted: 0, done: 0 }), '');
check('done alone still says nothing', describeInbox({ waiting: 0, sorted: 0, done: 9 }), '');
check('waiting alone', describeInbox({ waiting: 3, sorted: 0, done: 0 }), '3 waiting to be sorted.');
check('sorted alone', describeInbox({ waiting: 0, sorted: 2, done: 0 }), '2 sorted, not done.');
check('both', describeInbox({ waiting: 1, sorted: 2, done: 5 }), '1 waiting to be sorted, 2 sorted, not done.');

// --- The destination list itself --------------------------------------------

check('every key is unique', ALL_CAPTURE_DESTINATION_KEYS.length, new Set(ALL_CAPTURE_DESTINATION_KEYS).size);
check('the key list matches the list it is built from', ALL_CAPTURE_DESTINATION_KEYS, CAPTURE_DESTINATIONS.map((d) => d.key));
check('every destination has a label and a hint', CAPTURE_DESTINATIONS.filter((d) => !d.label || !d.hint).map((d) => d.key), []);
check('a known key resolves', captureDestination('garden').label, 'In the garden');
check('an unknown key resolves to nothing rather than throwing', captureDestination('nowhere'), null);
check('no key at all resolves to nothing', captureDestination(null), null);

// Sorting is a handoff to a place that already exists. A destination pointing
// at a route the app does not have would be a label with nothing behind it.
const tabsSource = fs.readFileSync(path.join(__dirname, '..', 'constants/tabs.ts'), 'utf8');
const realTabPaths = [...tabsSource.matchAll(/path:\s*'([^']+)'/g)].map((m) => m[1]);
check(
  'every destination tab is a tab the app has',
  CAPTURE_DESTINATIONS.filter((d) => d.tabPath && !realTabPaths.includes(d.tabPath)).map((d) => d.key),
  [],
);
// A destination belonging to a tab opens that tab. 'place' is the one that
// belongs to no tab and still opens something: where a thing was put is a fact
// about the house rather than about Food, Garden or Life, so it opens the
// standalone screen built for it. Checked against the file rather than waved
// through, so a typo in the route still fails here.
check(
  'a destination on a tab opens that tab',
  CAPTURE_DESTINATIONS.filter((d) => d.open && d.tabPath && d.open.pathname !== d.tabPath).map((d) => d.key),
  [],
);
check(
  'a destination off any tab opens a screen the app has',
  CAPTURE_DESTINATIONS.filter(
    (d) => d.open && !d.tabPath && !fs.existsSync(path.join(__dirname, '..', 'app', `${d.open.pathname.slice(1)}.tsx`)),
  ).map((d) => d.key),
  [],
);
// The one that belongs nowhere opens nothing, which is the honest answer for a
// thought being kept as a thought.
check('the thought destination opens nothing', captureDestination('thought').open, null);
check('the thought destination belongs to no tab', captureDestination('thought').tabPath, null);
check(
  'every other destination opens somewhere',
  CAPTURE_DESTINATIONS.filter((d) => d.key !== 'thought' && !d.open).map((d) => d.key),
  [],
);

// The screen draws one pill per destination, each with its own icon. A
// destination added here without one would render blank.
const screenSource = fs.readFileSync(path.join(__dirname, '..', 'app/capture.tsx'), 'utf8');
const iconBlock = screenSource.match(/DESTINATION_ICONS[\s\S]*?\{([\s\S]*?)\};/);
const iconKeys = [...iconBlock[1].matchAll(/^\s*([a-zA-Z]+):/gm)].map((m) => m[1]);
check('every destination has an icon on the screen', ALL_CAPTURE_DESTINATION_KEYS.filter((k) => !iconKeys.includes(k)), []);
check('no icon for a destination that no longer exists', iconKeys.filter((k) => !ALL_CAPTURE_DESTINATION_KEYS.includes(k)), []);

if (failures > 0) {
  console.error(`\n${failures} of ${checks} checks failed`);
  process.exit(1);
}
console.log(`All ${checks} checks passed`);
