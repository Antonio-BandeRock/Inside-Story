// Checks lib/yourStory.ts, the guided way through the app laid out as the
// sections of a person's own paper (2026-09-24).
//
// What it holds to: an item is done when its record exists, a removed
// record reopens its item and says so, the current section is the first
// with something to do, nothing is numbered or scored, and no sentence
// praises, blames, diagnoses or promises a cause.
//
// The module imports nothing at runtime. Exits non-zero on any failure.

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

const story = load('lib/yourStory.ts');

let checks = 0;
let failures = 0;
function check(condition, label) {
  checks += 1;
  if (!condition) {
    failures += 1;
    console.error('FAIL: ' + label);
  }
}
function same(actual, expected, label) {
  check(JSON.stringify(actual) === JSON.stringify(expected), label + '\n  got      ' + JSON.stringify(actual) + '\n  expected ' + JSON.stringify(expected));
}

const archiveOff = { syncOn: false, syncSavedOn: null, syncLoadedOn: null, lastBackupOn: null };
function facts(overrides) {
  return {
    today: '2026-09-24',
    beats: [],
    doneOn: {},
    counts: {},
    seenOn: {},
    setAsideOn: {},
    archive: archiveOff,
    ...overrides,
  };
}
const sectionKeys = (view) => view.sections.map((section) => section.def.key);
const item = (view, key) => view.sections.flatMap((section) => section.items).find((entry) => entry.def.key === key);

// Definitions hold together.
same(story.ALL_BEATS.length, 9, 'nine parts of life');
check(story.ITEMS.every((def) => story.SECTIONS.some((section) => section.key === def.section)), 'every item names a section that exists');
check(new Set(story.ITEMS.map((def) => def.key)).size === story.ITEMS.length, 'item keys are unique');
check(story.ITEMS.filter((def) => def.kind === 'waiting').every((def) => def.need > 0 && typeof def.progress === 'function'), 'every waiting item says what it needs');
check(story.ITEMS.every((def) => def.beats.every((beat) => story.ALL_BEATS.includes(beat))), 'items name only known parts of life');
check(story.ITEMS.filter((def) => def.setAside).every((def) => def.kind === 'needed'), 'only a needed item can be set aside');
for (const beat of ['garden', 'money', 'home', 'work', 'family']) {
  check(story.ITEMS.some((def) => def.section === `${beat}Beat`), `the ${beat} page has items`);
}
same(story.normalizeBeatKeys(['work', 'nonsense', 'health', 'health']), ['health', 'work'], 'beats keep their order and drop unknowns');
same(story.beatListSentence(['health', 'food', 'garden']), 'Health, Food and Garden', 'a list of three reads plainly');

// Dates and the local-day rule.
same(story.localDayOf('2026-09-20'), '2026-09-20', 'a plain date is already a day');
same(story.localDayOf(null), null, 'nothing is null');
const utcEvening = story.localDayOf('2026-09-20 23:30:00');
same(utcEvening, story.dayKey(new Date(Date.UTC(2026, 8, 20, 23, 30))), 'a datetime(now) stamp is read as UTC');
same(story.localDayOf('2026-09-20T10:00:00'), '2026-09-20', 'an ISO time without a zone is local');
same(story.daysBetween('2026-08-25', '2026-09-24'), 30, 'days between counts calendar days');
same(story.storyDate('2026-09-04'), 'September 4, 2026', 'a date reads as words');

// A fresh start: only the question and the archive.
const fresh = story.buildYourStory(facts({}));
same(fresh.heading, story.HEADING_BEGINS, 'nothing set up begins here');
same(sectionKeys(fresh), ['frontPage', 'archive', 'insideStory'], 'before choosing, only the front page, archive and inside story show');
same(fresh.current, 'frontPage', 'the front page comes first');
same(fresh.nextItem.def.key, 'beats', 'the first thing is the question');
check(story.nextLine(fresh).startsWith('Next: Choose the parts of your life'), 'the folded line names it');
same(story.sectionSummary(fresh.sections[2]), story.INSIDE_STORY_EMPTY_LINE, 'an empty inside story says why');

// Health and Food chosen, nothing else yet.
const chosen = story.buildYourStory(facts({ beats: ['health', 'food'], doneOn: { beats: '2026-09-20' } }));
same(chosen.heading, story.HEADING_TAKING_SHAPE, 'something done and nothing to show yet is taking shape');
same(sectionKeys(chosen), ['frontPage', 'archive', 'onTheRecord', 'dailyReport', 'insideStory'], 'health and food show their sections');
same(chosen.current, 'frontPage', 'about you is still open on the front page');
same(item(chosen, 'beats').sentence, 'Following Health and Food.', 'the done beats item names what is followed');
same(item(chosen, 'beats').dateline, 'Since September 20, 2026', 'a done item carries a dateline');
check(item(chosen, 'conditions').state === 'open' && item(chosen, 'conditions').def.kind === 'optional', 'conditions is optional');
check(!chosen.sections.some((section) => section.def.key === 'calendar'), 'no calendar without routines, home, work or family');
same(chosen.newlySeen, [{ key: 'beats', day: '2026-09-20' }], 'a newly done item is handed back to be remembered');

// Setting aside.
// The chosen parts of life ride on the view, so a card past the Front Page
// can still say what it follows and reopen the chooser.
same(chosen.beats.join(','), 'health,food', 'the view carries the parts of life chosen');
same(story.followingLine(chosen.beats), 'Following Health and Food.', 'the way back to the chooser reads plainly');

const setAside = story.buildYourStory(
  facts({ beats: ['health'], doneOn: { beats: '2026-09-20' }, setAsideOn: { aboutYou: '2026-09-21' } }),
);
same(item(setAside, 'aboutYou').state, 'setAside', 'a set-aside item is not done');
same(setAside.current, 'archive', 'a set-aside item does not hold its section open');

// Optional items never hold a section open.
same(chosen.sections[0].openItems.map((entry) => entry.def.key), ['aboutYou'], 'only the needed item holds the front page');

// The archive.
same(story.backupDoneOn({ ...archiveOff, lastBackupOn: '2026-08-25' }, '2026-09-24'), '2026-08-25', 'a backup 30 days old still counts');
same(story.backupDoneOn({ ...archiveOff, lastBackupOn: '2026-08-24' }, '2026-09-24'), null, 'a backup 31 days old does not');
same(story.backupDoneOn({ ...archiveOff, syncOn: true, syncSavedOn: '2026-09-22' }, '2026-09-24'), '2026-09-22', 'automatic saving counts');
const staleBackup = story.buildYourStory(
  facts({
    beats: ['garden'],
    doneOn: { beats: '2026-09-01' },
    seenOn: { beats: '2026-09-01', backup: '2026-08-01' },
    archive: { ...archiveOff, lastBackupOn: '2026-08-01' },
  }),
);
const backup = item(staleBackup, 'backup');
same(backup.state, 'reopened', 'an old backup reopens the archive');
check(backup.note.includes('August 1, 2026') && backup.note.includes('54 days ago'), 'and says when the last one was');
same(staleBackup.current, 'archive', 'the card reopens to that section');

// A removed record reopens its item and says so.
const removed = story.buildYourStory(
  facts({
    beats: ['health'],
    doneOn: { beats: '2026-09-01', aboutYou: '2026-09-01' },
    seenOn: { beats: '2026-09-01', aboutYou: '2026-09-01', meds: '2026-09-02' },
    archive: { ...archiveOff, syncOn: true, syncSavedOn: '2026-09-24' },
  }),
);
const meds = item(removed, 'meds');
same(meds.state, 'reopened', 'a med list emptied reopens');
same(meds.note, 'This was on record on September 2, 2026, and the record is no longer there.', 'and says so plainly');
same(removed.current, 'onTheRecord', 'the reopened section becomes current');

// A capture note sorted and deleted does not reopen.
const captured = story.buildYourStory(
  facts({ beats: ['routines'], doneOn: { beats: '2026-09-01' }, seenOn: { capture: '2026-09-03' } }),
);
same(item(captured, 'capture').state, 'done', 'an emptied inbox stays done once seen');

// Waiting items say how close they are.
const waiting = story.buildYourStory(
  facts({
    beats: ['health'],
    doneOn: { beats: '2026-09-01', aboutYou: '2026-09-01', meds: '2026-09-01', meal: '2026-09-02', checkin: '2026-09-02' },
    counts: { patterns: 1 },
    archive: { ...archiveOff, syncOn: true, syncSavedOn: '2026-09-24' },
  }),
);
same(waiting.current, 'insideStory', 'with nothing left to do, the waiting section is current');
same(item(waiting, 'patterns').note, '1 of the 2 so far.', 'pattern finder says how close');
same(waiting.heading, story.HEADING_TAKING_SHAPE, 'nothing to show yet is still taking shape');
check(story.nextLine(waiting).includes('1 of the 2 so far'), 'the folded line carries the count');

const ready = story.buildYourStory(
  facts({
    beats: ['health'],
    doneOn: { beats: '2026-09-01', aboutYou: '2026-09-01', meds: '2026-09-01', meal: '2026-09-02', checkin: '2026-09-02' },
    counts: { patterns: 2, trends: 7 },
    archive: { ...archiveOff, syncOn: true, syncSavedOn: '2026-09-24' },
  }),
);
same(ready.heading, story.HEADING_CONTINUES, 'something to show continues');
same(ready.settled, true, 'nothing open settles the card');
same(story.nextLine(ready), story.HEADING_CONTINUES, 'a settled card is one line');
same(item(ready, 'patterns').dateline, 'Ready since September 24, 2026', 'a waiting item that fills reads as ready');

// A part of life chosen later adds its section, and something to do beats
// something waiting.
const later = story.buildYourStory(
  facts({
    beats: ['health', 'garden'],
    doneOn: { beats: '2026-09-01', aboutYou: '2026-09-01', meds: '2026-09-01', meal: '2026-09-02', checkin: '2026-09-02' },
    counts: { patterns: 1 },
    archive: { ...archiveOff, syncOn: true, syncSavedOn: '2026-09-24' },
  }),
);
same(later.current, 'gardenBeat', 'a new page with something to do comes before a count');
check(sectionKeys(later).indexOf('gardenBeat') > sectionKeys(later).indexOf('insideStory'), 'extra pages come after the first edition');
same(story.sectionSummary(later.sections.find((section) => section.def.key === 'insideStory')), '1 of the 2 so far.', 'a waiting section behind the current one shows its count');

// Help lines.
check(story.tabStoryLine('/life', removed).includes('Next here: Add the medicines'), 'the life help line names the next thing there');
same(story.tabStoryLine('/nowhere', null), null, 'an unknown tab has no line');

// Writing: nothing here scores, praises, blames, numbers steps, diagnoses
// or promises a cause, and the house rules hold.
const written = [];
for (const def of story.ITEMS) {
  written.push(def.todo, def.done, def.why);
  if (def.setAside) written.push(def.setAside.label, def.setAside.line);
  if (def.progress) written.push(def.progress(1, def.need), def.progress(0, def.need));
}
for (const section of story.SECTIONS) written.push(section.name, section.caption);
written.push(
  ...Object.values(story.BEAT_LABELS),
  ...Object.values(story.BEAT_CAPTIONS),
  ...Object.values(story.TAB_STORY_LINES),
  story.BEATS_QUESTION,
  story.BEATS_NOTE,
  story.INSIDE_STORY_EMPTY_LINE,
  story.HEADING_BEGINS,
  story.HEADING_TAKING_SHAPE,
  story.HEADING_CONTINUES,
  story.OPTIONAL_LABEL,
  story.WAITING_LABEL,
  story.WHY_LABEL,
  story.BRING_BACK_LABEL,
  backup.note,
  meds.note,
  ...[fresh, chosen, waiting, ready, later].map(story.nextLine),
);
const allText = written.join(' ');
const lower = allText.toLowerCase();
for (const word of [
  'well done', 'good job', 'great job', 'keep it up', 'congrat', 'streak', 'you should', 'you failed', 'behind',
  'percent', '%', 'step ', 'beat', 'causes', 'caused by', 'trigger', 'diagnos', 'cure', 'treat ', 'healing', 'heals',
  'abnormal', 'ideal', 'optimal',
]) {
  check(!lower.includes(word), `no "${word}" in Your Story`);
}
check(!/\bstep\s*\d|\d+\s*of\s*\d+\s*steps/i.test(allText), 'no step numbers');
check(!/[–—]/.test(allText) && !allText.includes(' -- '), 'no dashes in Your Story');
check(!/\b(?:real|genuine|genuinely)\b/i.test(allText), 'no filler words in Your Story');
// "On their own" is the idiom the house rule keeps.
check(!/\bown\b/i.test(allText.replace(/on their own/g, '')), 'no redundant own');

console.log(`${checks - failures}/${checks} checks passed`);
if (failures > 0) process.exit(1);
