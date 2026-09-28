/* global __dirname */
// Checks notes on the calendar (H7, 2026-09-28): the time box, the day a
// note with no time lands on, the order notes read in, that a note is
// never planned (so nothing reminds about it or asks whether it happened),
// and that no sentence passes a verdict.
//
// USAGE
//   node scripts/test_calendar_notes.js
'use strict';

const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const Module = require('module');

const ROOT = path.resolve(__dirname, '..');

function load(rel) {
  const file = path.join(ROOT, rel);
  const out = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = new Module(file, module);
  mod.filename = file;
  mod.paths = Module._nodeModulePaths(path.dirname(file));
  mod.require = (request) => {
    if (request.startsWith('./')) return load(path.join(path.dirname(rel), request + '.ts'));
    return Module.prototype.require.call(mod, request);
  };
  mod._compile(out, file);
  return mod.exports;
}

const N = load('lib/calendarNotes.ts');

let failures = 0;
function ok(condition, label) {
  if (condition) console.log('  ok  ' + label);
  else {
    failures += 1;
    console.log('  FAIL ' + label);
  }
}

const FORBIDDEN = /\b(safe|unsafe|bad|should|must|missed|failed|overdue|late|real|genuine|genuinely|better|worse)\b|[–—]| -- /i;
const sentences = [];
const clean = (text) => {
  if (text != null) sentences.push(text);
  return text;
};

// --- 1. The time box --------------------------------------------------------------
const time = (text) => N.parseNoteTime(text).time;
ok(N.parseNoteTime('').time === null && N.parseNoteTime('  ').problem === null, 'an empty box is no time, and no problem');
ok(time('18:30') === '18:30', '18:30');
ok(time('6:30 pm') === '18:30' && time('6:30pm') === '18:30' && time('6:30 p.m.') === '18:30', '6:30 pm in its spellings');
ok(time('6pm') === '18:00' && time('6 PM') === '18:00', '6pm');
ok(time('12 am') === '00:00' && time('12pm') === '12:00' && time('9') === '09:00', 'midnight, noon and a bare hour');
for (const wrong of ['25:00', '13 pm', '6:75', 'tea time']) {
  const parsed = N.parseNoteTime(wrong);
  ok(parsed.time === null && clean(parsed.problem) !== null, `"${wrong}" is not read as a time`);
}

// --- 2. Where it is stored -------------------------------------------------------
ok(N.noteScheduledFor('2026-09-30', null) === '2026-09-30', 'a note with no time is the bare day, not midnight');
ok(N.noteScheduledFor('2026-09-30', '18:30') === '2026-09-30T18:30', 'a timed note carries its time');
ok(N.noteDate('2026-09-30') === '2026-09-30' && N.noteDate('2026-09-30T18:30') === '2026-09-30', 'either reads back to its day');
ok(N.noteTimeLabel('2026-09-30') === N.NOTE_ANY_TIME && N.noteTimeLabel('2026-09-30T18:30') === '6:30 PM', 'Any time, or the time');

// --- 3. The text -------------------------------------------------------------------
ok(clean(N.noteTextProblem('   ')) !== null, 'an empty note is stopped');
ok(N.noteTextProblem('Out for dinner') === null, 'a note is fine');
ok(clean(N.noteTextProblem('x'.repeat(N.NOTE_MAX_LENGTH + 1))) !== null, 'a note past the length is stopped, with the count');

// --- 4. Order and the strip ---------------------------------------------------------
const notes = [
  { id: 'a', scheduledFor: '2026-09-30T18:30', text: 'Dinner out' },
  { id: 'b', scheduledFor: '2026-09-30', text: 'Sam away' },
  { id: 'c', scheduledFor: '2026-09-30T07:00', text: 'Shop early' },
  { id: 'd', scheduledFor: '2026-10-01', text: 'Market day' },
  { id: 'e', scheduledFor: '2026-09-30', text: 'Bins out' },
];
const byDay = N.notesByDate(notes);
ok(byDay.get('2026-09-30').map((n) => n.id).join() === 'b,e,c,a', 'no time first in the order written, then by time');
ok(byDay.get('2026-10-01').length === 1 && !byDay.has('2026-10-02'), 'each note on its own day only');
ok(N.weekStripKey(false) === null, 'a week with no note shows no key');
clean(N.weekStripKey(true));
clean(N.NOTES_INTRO);
clean(N.noNotesLine('today'));
ok(clean(N.noteSavedMessage('2026-09-30T18:30', 'tomorrow', false)) === 'Note added on tomorrow at 6:30 PM.', 'the saved line names the time');
clean(N.noteSavedMessage('2026-09-30', 'Wednesday, September 30', true));
ok(clean(N.removeNoteMessage('y'.repeat(120))).includes('...'), 'a long note is shortened when asking to remove it');

// --- 5. Never planned -----------------------------------------------------------------
ok(N.NOTE_STATUS !== 'planned' && N.NOTE_ITEM_TYPE === 'note', 'a note is written with its own status, never planned');
const dbSrc = fs.readFileSync(path.join(ROOT, 'lib/calendarNotesDb.ts'), 'utf8');
ok(/INSERT INTO schedule_items[\s\S]*NOTE_STATUS/.test(dbSrc) && !/VALUES[^;]*'planned'/.test(dbSrc), 'the insert uses the note status');
ok(/DELETE FROM schedule_items WHERE id = \? AND item_type = \?/.test(dbSrc), 'removing a note can only remove a note');
const db = fs.readFileSync(path.join(ROOT, 'lib/db.ts'), 'utf8');
const open = db.slice(db.indexOf('export async function listOpenScheduleItems'), db.indexOf('export async function listOpenScheduleItems') + 600);
ok(open.includes("WHERE status = 'planned'"), 'what asks whether something happened reads planned rows only');
const move = fs.readFileSync(path.join(ROOT, 'lib/moveToTomorrowDb.ts'), 'utf8');
ok(move.includes("status = 'planned'"), 'move to tomorrow reads planned rows only');

// --- 6. The screen ------------------------------------------------------------------------
const src = fs.readFileSync(path.join(ROOT, 'app/(tabs)/schedule.tsx'), 'utf8');
ok(src.includes('listCalendarNotes(weekStart, weekEnd)'), 'the week strip reads the notes for the week it shows');
ok(src.includes('styles.weekDayRing'), 'a day with a note is ringed in the strip');
ok(src.includes('<CalendarNotesBand') && src.includes('id="schedule:meals:notes"'), 'the selected day has a Notes band');
ok(sentences.length >= 10, 'enough sentences were gathered to sweep');
for (const text of sentences) ok(!FORBIDDEN.test(text), 'no verdict words or dashes: ' + String(text).slice(0, 70));

console.log(failures === 0 ? `\nAll passed (${sentences.length} sentences swept).` : `\n${failures} failed.`);
if (failures > 0) process.exit(1);
