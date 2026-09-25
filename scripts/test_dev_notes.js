// Runs lib/devNotes.ts: every sentence a Tell Claude note reads through,
// and the file it is written to, without a phone.
//
// Built 2026-09-22, from "I would like to have the ability to have the long
// press 'Tell Claude' for development purposes only, just like me editing
// content, so I can directly interface with Claude to change something
// about it. A function with many steps gets one Tell Claude and it applies
// to all of them. It needs to know automatically when I am making the note
// from my mobile phone or the windows app."
//
// The rules checked:
//
//  1. A note that says nothing is refused, and anything typed is accepted.
//  2. Where a note was made reads as much as is known and no more: a tab
//     with no lens says only the tab, a band names the band, and a note
//     from nowhere still reads as a sentence.
//  3. The device says itself, in the words somebody would use.
//  4. The list line carries where, which device, which version, and the
//     version a shipped note went out in.
//  5. The count reads singular at one and names what has shipped.
//  6. The file: a note goes out as a line and comes back the same note.
//  7. A line this version cannot read is passed over rather than throwing,
//     since the file is appended to by whatever version was running.
//  8. Status lines: the later line for a note wins, and only an answer
//     that says something new is applied.
//  9. Publishing: a note the file has never carried goes out, one it
//     already has does not.
// 10. Editing words in place (1.0.51.12): the note an edit writes reads
//     without the screen, an edit that changes nothing is refused, the
//     latest open edit of the same words is the one shown, putting words
//     back removes the edit, a shipped note stops showing, and the words a
//     Text draws are read out of nested children as one sentence.
//
// Run with: node scripts/test_dev_notes.js
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
    throw new Error(`unexpected import ${name}`);
  });
  return module.exports;
}

const N = loadModule('lib/devNotes.ts');
const {
  DEV_NOTES_FILE_NAME, DEV_NOTE_KINDS, DEV_NOTE_LABELS, DEV_NOTE_CAPTIONS,
  devNoteProblem, describeDevNoteWhere, describeDevNoteDevice, describeDevNote, summariseDevNotes,
  devNoteToLine, devNoteStatusToLine, parseDevNoteLine, readStatusLines, statusesToApply,
  readNoteIds, notesToPublish,
  describeWordingChange, wordingEditProblem, editsFromNotes, flattenTextChildren,
} = N;

let passed = 0;
let failed = 0;
function check(name, actual, expected) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) passed += 1;
  else {
    failed += 1;
    console.log(`FAIL ${name}\n  expected ${JSON.stringify(expected)}\n  got      ${JSON.stringify(actual)}`);
  }
}

const note = {
  id: 'note_1',
  createdAt: '2026-09-22T09:15:00.000Z',
  device: 'phone',
  appVersion: '1.0.49.8',
  tab: 'Garden',
  lens: 'Growing Costs',
  bandId: 'electricity',
  bandTitle: 'Electricity',
  kind: 'wording',
  body: 'Say kilowatt hours rather than kWh on the first line.',
  originalText: null,
  newText: null,
  status: 'open',
  doneVersion: null,
  doneAt: null,
};

// 1. What a note has to carry.
check('nothing typed is refused', devNoteProblem(''), 'Say what you want changed.');
check('spaces alone are refused', devNoteProblem('   \n  '), 'Say what you want changed.');
check('something typed is accepted', devNoteProblem('Change this word.'), null);
check('the four kinds', DEV_NOTE_KINDS, ['wording', 'behaviour', 'bug', 'idea']);
check('every kind has a label', DEV_NOTE_KINDS.every((kind) => Boolean(DEV_NOTE_LABELS[kind])), true);
check('every kind has a caption', DEV_NOTE_KINDS.every((kind) => Boolean(DEV_NOTE_CAPTIONS[kind])), true);
check('the file has a fixed name', DEV_NOTES_FILE_NAME, 'inside-story-notes.jsonl');

// 2. Where it was made.
check('tab, lens and band', describeDevNoteWhere(note), 'Garden > Growing Costs, the Electricity band');
check('tab and lens, no band', describeDevNoteWhere({ ...note, bandTitle: null }), 'Garden > Growing Costs');
check('tab alone', describeDevNoteWhere({ tab: 'Home', lens: null, bandTitle: null }), 'Home');
check('a band with no place', describeDevNoteWhere({ tab: null, lens: null, bandTitle: 'Hydration' }), 'The Hydration band');
check('nothing known still reads', describeDevNoteWhere({ tab: null, lens: null, bandTitle: null }), 'Somewhere with no name on it');

// 3. The device.
check('a phone says phone', describeDevNoteDevice('phone'), 'the phone');
check('a computer says the Windows app', describeDevNoteDevice('computer'), 'the Windows app');

// 4. The line a note reads as.
check('an open note', describeDevNote(note), 'Garden > Growing Costs, the Electricity band. From the phone, 1.0.49.8.');
check(
  'a note from the Windows app',
  describeDevNote({ ...note, device: 'computer' }),
  'Garden > Growing Costs, the Electricity band. From the Windows app, 1.0.49.8.',
);
check(
  'a shipped note names the version it went out in',
  describeDevNote({ ...note, status: 'done', doneVersion: '1.0.49.9', doneAt: '2026-09-22T18:00:00.000Z' }),
  'Garden > Growing Costs, the Electricity band. From the phone, 1.0.49.8, shipped in 1.0.49.9.',
);
check(
  'done with no version still reads',
  describeDevNote({ ...note, status: 'done' }),
  'Garden > Growing Costs, the Electricity band. From the phone, 1.0.49.8, done.',
);

// 5. The count.
const done = { ...note, id: 'note_2', status: 'done', doneVersion: '1.0.49.9' };
check('nothing yet', summariseDevNotes([]), 'Nothing written down yet.');
check('one waiting', summariseDevNotes([note]), '1 waiting.');
check('several waiting', summariseDevNotes([note, { ...note, id: 'note_3' }]), '2 waiting.');
check('waiting and shipped', summariseDevNotes([note, done]), '1 waiting, 1 already shipped.');
check('all shipped', summariseDevNotes([done]), '0 waiting, 1 already shipped.');

// 6. Out to the file and back.
const line = devNoteToLine(note);
check('a line is one line', line.includes('\n'), false);
check('a note comes back whole', parseDevNoteLine(line), { type: 'note', note });
check(
  'a note carrying a newline in its body survives',
  parseDevNoteLine(devNoteToLine({ ...note, body: 'First line.\nSecond line.' })).note.body,
  'First line.\nSecond line.',
);
const statusLine = devNoteStatusToLine({ id: 'note_1', status: 'done', doneVersion: '1.0.49.9', doneAt: '2026-09-22T18:00:00.000Z' });
check('a status comes back whole', parseDevNoteLine(statusLine), {
  type: 'status',
  status: { id: 'note_1', status: 'done', doneVersion: '1.0.49.9', doneAt: '2026-09-22T18:00:00.000Z' },
});

// 7. A line that cannot be read is passed over.
check('a blank line', parseDevNoteLine(''), null);
check('spaces alone', parseDevNoteLine('    '), null);
check('not JSON at all', parseDevNoteLine('what happened here'), null);
check('JSON with no id', parseDevNoteLine('{"type":"note","body":"x"}'), null);
check('a note with no body', parseDevNoteLine('{"type":"note","id":"note_9"}'), null);
check('an unknown kind falls back to idea', parseDevNoteLine('{"type":"note","id":"n","body":"b","kind":"whatever"}').note.kind, 'idea');
check('an unknown device falls back to the phone', parseDevNoteLine('{"type":"note","id":"n","body":"b","device":"toaster"}').note.device, 'phone');
check('an unknown status falls back to open', parseDevNoteLine('{"type":"note","id":"n","body":"b","status":"maybe"}').note.status, 'open');
check('a field this version has never seen is ignored', parseDevNoteLine('{"type":"note","id":"n","body":"b","screenshot":"x"}').note.id, 'n');

// 8. Status lines, and which of them say anything new.
const file = [
  devNoteToLine(note),
  devNoteToLine({ ...note, id: 'note_2' }),
  devNoteStatusToLine({ id: 'note_1', status: 'done', doneVersion: '1.0.49.9', doneAt: '2026-09-22T18:00:00.000Z' }),
  'a line from some later version nobody here understands',
  devNoteStatusToLine({ id: 'note_1', status: 'open', doneVersion: null, doneAt: null }),
].join('\n');
const answers = readStatusLines(file);
check('one answer per note', answers.size, 1);
check('the later line wins', answers.get('note_1').status, 'open');

const settled = readStatusLines(
  [
    devNoteStatusToLine({ id: 'note_1', status: 'done', doneVersion: '1.0.49.9', doneAt: '2026-09-22T18:00:00.000Z' }),
    devNoteStatusToLine({ id: 'note_2', status: 'done', doneVersion: '1.0.49.9', doneAt: '2026-09-22T18:00:00.000Z' }),
  ].join('\n'),
);
check('an answer the app has not taken in is applied', statusesToApply([note], settled).map((row) => row.id), ['note_1']);
check(
  'an answer already agreeing is left alone',
  statusesToApply([{ ...note, status: 'done', doneVersion: '1.0.49.9' }], settled),
  [],
);
check(
  'a note the file says nothing about is left alone',
  statusesToApply([{ ...note, id: 'note_7' }], settled),
  [],
);
check(
  'a changed version is an answer even when both say done',
  statusesToApply([{ ...note, status: 'done', doneVersion: '1.0.49.4' }], settled).map((row) => row.doneVersion),
  ['1.0.49.9'],
);

// 9. What still has to go out.
const published = readNoteIds(file);
check('ids the file already carries', [...published].sort(), ['note_1', 'note_2']);
check('a status line is not a note', readNoteIds(devNoteStatusToLine({ id: 'note_5', status: 'done', doneVersion: null, doneAt: null })).size, 0);
check(
  'only what has never gone out goes out',
  notesToPublish([note, { ...note, id: 'note_2' }, { ...note, id: 'note_3' }], published).map((row) => row.id),
  ['note_3'],
);
check('an empty file publishes everything', notesToPublish([note], new Set()).map((row) => row.id), ['note_1']);
check('nothing to publish is an empty list', notesToPublish([], published), []);

// 10. Editing words in place.
check('a change reads on its own', describeWordingChange('Grow Setup', 'Your Grow Setup'), 'Change "Grow Setup" to "Your Grow Setup".');
check('putting back reads on its own', describeWordingChange('Grow Setup', 'Grow Setup'), 'Put back as it was: "Grow Setup".');
check('no words to change', wordingEditProblem('', 'x', ''), 'There are no words there to change.');
check('nothing typed', wordingEditProblem('Grow Setup', '  ', 'Grow Setup'), 'Say what it should read, or tap Cancel.');
check('unchanged', wordingEditProblem('Grow Setup', 'Grow Setup', 'Grow Setup'), 'That is what it says already.');
check('a change is accepted', wordingEditProblem('Grow Setup', 'Your Grow Setup', 'Grow Setup'), null);
check('putting back an edit is accepted', wordingEditProblem('Grow Setup', 'Grow Setup', 'Your Grow Setup'), null);

const edit = (id, createdAt, from, to, extra) => ({
  ...note, id, createdAt, originalText: from, newText: to, body: describeWordingChange(from, to), ...extra,
});
const editNotes = [
  edit('e2', '2026-09-24T10:05:00.000Z', 'Grow Setup', 'Your Grow Setup'),
  edit('e1', '2026-09-24T10:00:00.000Z', 'Grow Setup', 'Setup'),
  edit('e3', '2026-09-24T10:00:00.000Z', 'Days Until', 'Counting Down'),
  edit('e4', '2026-09-24T10:10:00.000Z', 'Days Until', 'Days Until'),
  edit('e5', '2026-09-24T10:00:00.000Z', 'Electricity', 'Power', { status: 'done' }),
  edit('e6', '2026-09-24T10:00:00.000Z', 'Compost', 'Compost Piles', { kind: 'idea' }),
  note,
];
check('the latest edit wins, put back and shipped drop out', [...editsFromNotes(editNotes)], [['Grow Setup', 'Your Grow Setup']]);
check('no notes, no edits', editsFromNotes([]).size, 0);

const el = (children) => ({ type: 'Text', props: { children } });
check('a string', flattenTextChildren('Hello'), 'Hello');
check('a number', flattenTextChildren(42), '42');
check('nothing', [null, undefined, false, true].map(flattenTextChildren), ['', '', '', '']);
check('an array with a nested Text', flattenTextChildren(['Tap ', el('Save'), ' when done, ', 3, ' left', null]), 'Tap Save when done, 3 left');
check('an element with no children', flattenTextChildren(el(undefined)), '');
check('deeply nested', flattenTextChildren(el([el(['a', el('b')]), 'c'])), 'abc');
check(
  'an edit round-trips through the file',
  parseDevNoteLine(devNoteToLine(editNotes[0])).note.newText,
  'Your Grow Setup',
);

console.log(`${passed + failed} checks, ${failed} failures`);
process.exit(failed ? 1 : 0);
