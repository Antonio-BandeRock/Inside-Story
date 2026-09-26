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

function load(relPath, allowed = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    if (allowed[name]) return allowed[name];
    throw new Error(`${relPath} must stay free of runtime imports (asked for ${name})`);
  });
  return module.exports;
}

const story = load('lib/yourStory.ts');
// The guides may lean on lib/yourStory.ts and nothing else.
const guides = load('lib/yourStoryGuides.ts', { './yourStory': story });

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

// "Continues" waits until nothing is left to set up, even once Trends has
// something to show (the heading read Continues over a card with most of
// it untouched, 2026-09-25).
const showsButOpen = story.buildYourStory(
  facts({
    beats: story.ALL_BEATS,
    doneOn: { beats: '2026-09-01', aboutYou: '2026-09-01', meal: '2026-09-02' },
    counts: { trends: 7 },
  }),
);
same(showsButOpen.heading, story.HEADING_TAKING_SHAPE, 'something to show with setup still open is taking shape');

// By tab (lib/yourStoryTabs.ts).
const tabs = load('lib/yourStoryTabs.ts', { './yourStory': story });
const tabsSource = fs.readFileSync(path.join(__dirname, '..', 'constants', 'tabs.ts'), 'utf8');
const tabPaths = [...tabsSource.matchAll(/path: '([^']+)'/g)].map((match) => match[1]).filter((p) => p !== '/');
same(tabs.TAB_GUIDES.map((def) => def.path).sort(), tabPaths.slice().sort(), 'every tab but Home has a row');
check(tabs.TAB_GUIDES.every((def) => def.needs.every((key) => story.ITEM_BY_KEY[key])), 'every tab names items that exist');
check(Object.entries(tabs.FILLED_BY).every(([waitingKey, feeder]) => story.ITEM_BY_KEY[waitingKey].kind === 'waiting' && story.ITEM_BY_KEY[feeder].kind === 'needed'), 'a waiting item is filled by something to do');
const groups = tabs.TAB_GUIDES.map((def) => def.group);
same(groups.lastIndexOf('goesIn') < groups.indexOf('givesBack'), true, 'records go in before they give back');
const tabRow = (guide, pathName) => guide.tabs.find((tab) => tab.def.path === pathName);

const freshTabs = tabs.buildTabGuide(fresh);
same(freshTabs.before.map((entry) => entry.def.key), ['beats', 'backup'], 'before choosing, the question and a backup come first');
same(freshTabs.tabs.length, 8, 'every tab is listed from the start');
check(freshTabs.tabs.every((tab) => tab.status === 'waitingOnChoice'), 'each tab waits on the question');
same(freshTabs.startHere, null, 'nothing marked start here while the question is open');
check(tabs.tabGuideLine(freshTabs, '').startsWith('First: Choose the parts of your life'), 'the folded line asks the question');

// Everything chosen, the question answered and backed up, nothing else.
const everything = story.buildYourStory(
  facts({
    beats: story.ALL_BEATS,
    doneOn: { beats: '2026-09-01', aboutYou: '2026-09-01' },
    archive: { ...archiveOff, syncOn: true, syncSavedOn: '2026-09-24' },
  }),
);
const everythingTabs = tabs.buildTabGuide(everything);
same(everythingTabs.before, [], 'nothing left before every tab');
same(everythingTabs.startHere.def.path, '/life', 'Life is where to start');
same(tabRow(everythingTabs, '/life').item.def.key, 'meds', 'Life asks for medicines first');
same(tabRow(everythingTabs, '/schedule').item.def.key, 'meal', 'Schedules asks for a meal');
same(tabRow(everythingTabs, '/insights').status, 'first', 'Insights needs something first');
same(tabRow(everythingTabs, '/insights').item.def.key, 'meal', 'and names the meal, which goes in on Schedules');
check(tabRow(everythingTabs, '/insights').line.includes('in Schedules under Meals'), 'the line says where it goes in');
same(tabRow(everythingTabs, '/trends').item.def.key, 'meal', 'Trends needs a meal first');
same(tabRow(everythingTabs, '/food').status, 'ready', 'Food works from the start');
check(tabRow(everythingTabs, '/food').note.startsWith(tabs.MORE_LABEL), 'and says what would make it say more');
same(everythingTabs.tabs.filter((tab) => tab.startHere).length, 1, 'only one start here');

// Meals on three days: Trends fills in and sends the person to log.
const filling = story.buildYourStory(
  facts({
    beats: ['health', 'food'],
    doneOn: { beats: '2026-09-01', aboutYou: '2026-09-01', meal: '2026-09-02', checkin: '2026-09-02', meds: '2026-09-02' },
    counts: { trends: 3, patterns: 2 },
    archive: { ...archiveOff, syncOn: true, syncSavedOn: '2026-09-24' },
  }),
);
const fillingTrends = tabRow(tabs.buildTabGuide(filling), '/trends');
same(fillingTrends.status, 'filling', 'Trends fills in with time');
same(fillingTrends.goLabel, 'Log some more', 'and sends the person to log');
same(fillingTrends.go.params.openScheduleLens, 'meals', 'where meals go in');
check(fillingTrends.note.includes('3 of the 7') && fillingTrends.note.includes('Already showing: Pattern Finder'), 'it says how close, and what already shows');
same(tabRow(tabs.buildTabGuide(filling), '/reports').status, 'ready', 'Reports is ready once medicines, a meal and a check-in are there');
same(tabRow(tabs.buildTabGuide(filling), '/garden').status, 'notChosen', 'a tab outside the parts chosen still shows');

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
for (const def of tabs.TAB_GUIDES) written.push(def.title, def.gives, def.readyLine);
written.push(
  ...Object.values(tabs.TAB_GROUP_HEADINGS),
  ...Object.values(tabs.TAB_GROUP_CAPTIONS),
  ...Object.values(tabs.SHOWS_AS),
  tabs.BEFORE_ANYTHING_HEADING,
  tabs.BEFORE_ANYTHING_CAPTION,
  tabs.START_HERE_LABEL,
  tabs.FIRST_LABEL,
  tabs.FILLING_LABEL,
  tabs.READY_LABEL,
  tabs.MORE_LABEL,
  tabs.NOT_CHOSEN_LINE,
  tabs.NOTHING_CHOSEN_LINE,
  tabs.NOTHING_NEEDED_LINE,
);
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

// THE GUIDES (lib/yourStoryGuides.ts, 1.0.51.7).

// Every Your Story item that applies to a part of life has a place in that
// part's guide or in The Basics, so no item is left without instructions.
for (const beat of story.ALL_BEATS) {
  same(guides.itemsWithoutAGuide([beat]), [], `every item for ${beat} is in its guide or The Basics`);
}
same(guides.itemsWithoutAGuide([]), [], 'every item for nobody in particular is in The Basics');
same(
  guides.guidesFor(['garden', 'health']).map((guide) => guide.key),
  ['basics', 'health', 'garden'],
  'The Basics first, then the chosen guides in the order the parts are listed',
);
for (const beat of story.ALL_BEATS) check(!!guides.GUIDE_BY_KEY[beat], `a guide for ${beat}`);
for (const guide of guides.GUIDES) {
  const keys = guide.entries.map((entry) => entry.key);
  check(new Set(keys).size === keys.length, `entry keys unique in ${guide.key}`);
  check(guide.entries.length >= 3, `${guide.key} walks through more than a couple of things`);
}

// Every destination is a screen that exists, and every lens a key that
// screen knows.
const TAB_FILES = {
  '/life': ['openLifeLens', 'life.tsx'],
  '/schedule': ['openScheduleLens', 'schedule.tsx'],
  '/trends': ['openTrendsLens', 'trends.tsx'],
  '/garden': ['openGardenLens', 'garden.tsx'],
  '/insights': ['openInsightsLens', 'insights.tsx'],
  '/food': ['openFoodLens', 'food.tsx'],
  '/log': ['openSignalsLens', 'log.tsx'],
};
const tabSource = {};
for (const guide of guides.GUIDES) {
  for (const entry of guide.entries) {
    const destination = entry.destination;
    if (destination.kind !== 'route') continue;
    const tab = TAB_FILES[destination.pathname];
    if (tab) {
      const [param, file] = tab;
      tabSource[file] = tabSource[file] || fs.readFileSync(path.join(__dirname, '..', 'app', '(tabs)', file), 'utf8');
      const lens = destination.params && destination.params[param];
      check(!!lens, `${guide.key}/${entry.key} names a lens with ${param}`);
      if (lens) check(tabSource[file].includes(`'${lens}'`), `${guide.key}/${entry.key}: ${file} has a lens ${lens}`);
    } else {
      const name = destination.pathname.slice(1);
      check(
        fs.existsSync(path.join(__dirname, '..', 'app', name + '.tsx')) ||
          fs.existsSync(path.join(__dirname, '..', 'app', '(tabs)', name + '.tsx')),
        `${guide.key}/${entry.key}: a screen at ${destination.pathname}`,
      );
    }
  }
}

// Ticking follows the item or the record, and reading is never ticked.
const guideFacts = facts({ beats: ['health'], doneOn: { meds: '2026-09-20' } });
const built = guides.buildGuides(guideFacts, { doseTimes: '2026-09-21' });
const health = built.find((guide) => guide.def.key === 'health');
const entryState = (key) => health.entries.find((entry) => entry.entry.key === key);
same(entryState('item:meds').state, 'done', 'an item entry is done when its item is');
same(entryState('doseTimes').state, 'done', 'a record entry is done when its record exists');
check(!!entryState('doseTimes').dateline, 'a done record entry carries its date');
same(entryState('personalRule').state, 'open', 'a record entry with no record is open');
same(entryState('interactions').state, 'reading', 'a reading entry is never ticked');
// With nothing done the next thing is the backup, which is The Basics;
// once it is kept, the next thing is in the Health guide.
same(guides.currentGuideKey(story.buildYourStory(guideFacts), built), 'basics', 'the backup comes first, in The Basics');
const kept = facts({
  beats: ['health'],
  doneOn: { beats: '2026-09-20', meds: '2026-09-20' },
  archive: { ...archiveOff, lastBackupOn: '2026-09-23' },
});
same(
  guides.currentGuideKey(story.buildYourStory(kept), guides.buildGuides(kept, {})),
  'health',
  'the card points into the guide holding the next thing',
);

// 1.0.51.8: every step says when it belongs, every guide says what comes
// first, and Step by step can say how to reach every destination.
for (const guide of guides.GUIDES) {
  check(!!guide.firstResult && guide.firstResult.startsWith('What you get first'), `${guide.key} says what comes first`);
  check(guide.entries.some((entry) => entry.when === 'start' || entry.when === 'daily'), `${guide.key} has a first or everyday step`);
  for (const entry of guide.entries) {
    check(guides.GUIDE_WHEN_ORDER.includes(entry.when), `${guide.key}/${entry.key} says when it belongs`);
    check(!!guides.cadenceLine(entry), `${guide.key}/${entry.key} has a cadence line`);
    if (entry.destination.kind !== 'beats') {
      check(!!guides.navigationLine(entry.destination), `${guide.key}/${entry.key} says how to get there`);
    }
    const tabParam = entry.destination.kind === 'route' && TAB_FILES[entry.destination.pathname];
    if (tabParam) {
      const lens = entry.destination.params[tabParam[0]];
      check(
        !!(guides.LENS_NAMES[entry.destination.pathname] || {})[lens],
        `${guide.key}/${entry.key}: the lens ${lens} has a name to say`,
      );
    }
  }
}
// Each lens name the navigation line says is what the tab screen shows.
for (const [pathname, lenses] of Object.entries(guides.LENS_NAMES)) {
  const tab = TAB_FILES[pathname];
  if (!tab) continue;
  const file = tab[1];
  tabSource[file] = tabSource[file] || fs.readFileSync(path.join(__dirname, '..', 'app', '(tabs)', file), 'utf8');
  for (const [lens, name] of Object.entries(lenses)) {
    check(tabSource[file].includes(`'${lens}'`), `${file} knows the lens ${lens}`);
    check(tabSource[file].includes(`'${name}'`) || tabSource[file].includes(`"${name}"`), `${file} calls ${lens} ${name}`);
  }
}
same(
  guides.navigationLine({ kind: 'route', pathname: '/life', params: { openLifeLens: 'routines' } }),
  'Tap the round button at the bottom of the screen and choose Life. Then tap the button in the bottom-left corner and choose Routines.',
  'the way to a lens names the tab and the lens',
);
same(guides.cadenceLine({ when: 'daily', takes: 'Under a minute' }), 'Every day. Under a minute.', 'the cadence line says how often and how long');

// A step two guides share is written out in the first guide shown and
// pointed to from the rest, and the card never points into a pointer.
const sharedBuilt = guides.buildGuides(facts({ beats: ['health', 'food', 'routines'] }), {});
const byKey = (key) => sharedBuilt.find((guide) => guide.def.key === key);
same(byKey('health').entries.find((entry) => entry.entry.key === 'item:aboutYou').sharedWith, null, 'written out in the first guide');
same(byKey('food').entries.find((entry) => entry.entry.key === 'item:aboutYou').sharedWith, 'health', 'pointed to from a later guide');
same(byKey('routines').entries.find((entry) => entry.entry.key === 'item:capture').sharedWith, 'basics', 'Capture points back to The Basics');
// Entries read in group order, Start here first.
for (const guide of sharedBuilt) {
  const order = guide.entries.map((entry) => guides.GUIDE_WHEN_ORDER.indexOf(entry.entry.when));
  check(order.every((value, index) => index === 0 || value >= order[index - 1]), `${guide.def.key} reads in group order`);
}
check(guides.isGuideStyle('short') && guides.isGuideStyle('steps') && !guides.isGuideStyle('other'), 'the two ways of writing');

for (const guide of guides.GUIDES) {
  written.push(guide.name, guide.title, guide.opening);
  written.push(guide.firstResult);
  for (const entry of guide.entries) {
    written.push(entry.doThis, entry.forYou, entry.leadsTo || '', entry.takes || '', ...(entry.taps || []));
    written.push(guides.cadenceLine(entry), guides.navigationLine(entry.destination) || '');
  }
  written.push(guides.sharedLine(guide.key), guides.alsoInLine(guide.key));
  written.push(guides.openGuideLabel(guide.key), guides.guideCardLine(guide.key));
}
written.push(guides.GUIDES_HEADING, guides.GUIDES_LEAD, guides.READ_LABEL);
written.push(
  ...Object.values(guides.GUIDE_WHEN_HEADINGS),
  guides.GUIDE_STYLE_QUESTION,
  ...Object.values(guides.GUIDE_STYLE_LABELS),
  ...Object.values(guides.GUIDE_STYLE_CAPTIONS),
  guides.GUIDE_STYLE_CHANGE_LINE,
  guides.STEP_NEXT_LABEL,
  guides.STEP_BACK_LABEL,
  guides.SHOW_ALL_LABEL,
  guides.SHOW_ONE_LABEL,
  guides.HOW_TO_GET_THERE,
  guides.ONCE_THERE,
);

// "Healing Stage" is the name of an Insights lens, and a guide has to call

// The way back to Your Story (lib/storyReturn.ts, 1.0.51.9). Hidden until
// the person has left where they set out from, shown everywhere else, and
// forgotten once they are back on Home's card or the Your Story page.
const back = load('lib/storyReturn.ts');
{
  const fromHome = { origin: { kind: 'home' }, left: false };
  same(back.storyReturnOnPath(null, '/life'), { show: false, next: null }, 'no way back, no button');
  same(back.storyReturnOnPath(fromHome, '/'), { show: false, next: fromHome }, 'not shown before leaving Home');
  const away = back.storyReturnOnPath(fromHome, '/life');
  same(away, { show: true, next: { origin: { kind: 'home' }, left: true } }, 'shown on the tab a Home line opened');
  same(back.storyReturnOnPath(away.next, '/capture'), { show: true, next: away.next }, 'still shown on the next screen');
  same(back.storyReturnOnPath(away.next, '/'), { show: false, next: null }, 'forgotten once back on Home');
  same(back.storyReturnOnPath(away.next, '/your-story'), { show: false, next: null }, 'never shown on the Your Story page');
  const fromPage = { origin: { kind: 'page', guide: 'food' }, left: true };
  same(back.storyReturnOnPath(fromPage, '/'), { show: true, next: fromPage }, 'shown on Home when the page sent them there');
  same(back.storyReturnTarget({ kind: 'home' }), { pathname: '/', params: { openHomeSection: 'yourStory' } }, 'Home target opens the card');
  same(back.storyReturnTarget(fromPage.origin), { pathname: '/your-story', params: { guide: 'food' } }, 'page target reopens the guide');
  same(back.storyReturnTarget({ kind: 'page', guide: null }), { pathname: '/your-story', params: {} }, 'page target with no guide');
  written.push(back.STORY_RETURN_LABEL, back.STORY_RETURN_CLOSE_LABEL);
}
// Walk me through it (lib/storyWalk.ts, 1.0.51.10). Getting there moves on by
// itself as the screen and lens are reached, falls back when the person
// wanders off, and Next can always pass a line so a walk never sticks.
{
  const walk = load('lib/storyWalk.ts', { './yourStoryGuides': guides });
  for (const def of guides.GUIDES) {
    for (const entry of def.entries) {
      const steps = walk.walkSteps(entry);
      if (entry.destination.kind !== 'beats') check(steps.length > 0, `${def.key}/${entry.key} has a walk`);
      for (const step of steps) {
        check(typeof step.say === 'string' && step.say.trim().length > 0, `${def.key}/${entry.key} walk line has words`);
        written.push(step.say);
      }
    }
  }
  const routine = guides.GUIDE_BY_KEY.routines.entries.find((entry) => entry.key === 'routineRun');
  const steps = walk.walkSteps(routine);
  check(steps[0].say.endsWith('choose Life.') && steps[0].point === 'hub', 'routine walk starts at the round button');
  check(steps[1].say.includes('choose Routines') && steps[1].until.lens === 'Routines', 'then the lens');
  same(steps[2].say, 'Tap Walk it on the routine.', 'then the taps');
  const nowhere = { pathname: '/garden', tab: 'Garden', lens: null };
  const onLife = { pathname: '/life', tab: 'Life', lens: 'Grocery List' };
  const onRoutines = { pathname: '/life', tab: 'Life', lens: 'Routines' };
  same(walk.walkPosition(steps, 0, [], nowhere), 0, 'elsewhere: choose Life');
  same(walk.walkPosition(steps, 0, [], onLife), 1, 'on Life: choose Routines');
  same(walk.walkPosition(steps, 0, [], onRoutines), 2, 'on Routines: the first tap');
  same(walk.walkPosition(steps, 3, [], onRoutines), 3, 'the tap line Next reached holds');
  same(walk.walkPosition(steps, 3, [], nowhere), 0, 'wandering off comes back to choose Life');
  same(walk.walkPosition(steps, 0, [], { pathname: '/life', tab: 'Garden', lens: null }), 2, 'an unreported lens is not a circle');
  const started = { guide: 'routines', entryKey: 'routineRun', startedDone: false, cursor: 0, skipped: [] };
  const passed = walk.walkNext(started, steps, 0);
  same(passed.skipped, [0], 'Next passes an unmet getting-there line');
  same(walk.walkPosition(steps, passed.cursor, passed.skipped, nowhere), 1, 'and it stays passed');
  check(!walk.canStepBack(steps, 2), 'no Back onto a getting-there line');
  check(walk.canStepBack(steps, 3), 'Back onto a tap line');
  same(walk.walkBack({ ...started, cursor: 3 }, 3).cursor, 2, 'Back moves one line');
  same(walk.walkEntry(started), routine, 'the walk finds its guide step');
  walk.startStoryWalk('routines', 'routineRun', false);
  same(walk.getStoryWalk(), started, 'a walk starts at its first line');
  walk.setStoryWalk(null);
  written.push(
    walk.WALK_START_LABEL, walk.WALK_STOP_LABEL, walk.WALK_CLOSE_LABEL, walk.WALK_NEXT_LABEL, walk.WALK_BACK_LABEL,
    walk.WALK_STORY_LABEL, walk.WALK_WAITING_LINE, walk.WALK_NO_RECORD_LINE, walk.WALK_SAVED_LINE, walk.WALK_CAPTION,
    walk.WALK_SHRINK_LABEL, walk.WALK_GROW_LABEL,
  );

  // Stage 2 (1.0.51.11): the outline on the button a line names, only on
  // Start here and Every day steps. Every mark named is one a line can reach
  // and one a screen draws, since an outline nobody wired up is a line
  // pointing at nothing.
  same(steps.map((step) => step.mark ?? null), ['hub', 'corner', 'routines.walk', null], 'routine walk marks the round button, the corner, then Walk it');
  const reached = new Set();
  for (const def of guides.GUIDES) {
    for (const entry of def.entries) {
      const marks = walk.walkSteps(entry).map((step) => step.mark).filter(Boolean);
      if (!walk.walkMarks(entry)) check(marks.length === 0, `${def.key}/${entry.key} (${entry.when}) carries no marks`);
      for (const mark of marks) reached.add(mark);
      const tapMarks = walk.TAP_MARKS[entry.key];
      if (tapMarks) check(tapMarks.length <= (entry.taps ?? []).length, `${entry.key} names no more buttons than it has taps`);
    }
  }
  const everyEntry = guides.GUIDES.flatMap((def) => def.entries);
  for (const [key, marks] of Object.entries(walk.TAP_MARKS)) {
    check(everyEntry.some((entry) => entry.key === key && walk.walkMarks(entry)), `${key} in TAP_MARKS is a Start here or Every day step`);
    for (const mark of marks) if (mark) check(reached.has(mark), `${mark} is reached by some walk line`);
  }
  const sourceFiles = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((item) =>
      item.isDirectory() ? sourceFiles(path.join(dir, item.name)) : [path.join(dir, item.name)],
    );
  const markSource = ['app', 'components']
    .flatMap((dir) => sourceFiles(path.join(__dirname, '..', dir)))
    .filter((file) => /\.tsx?$/.test(file))
    .map((file) => fs.readFileSync(file, 'utf8'))
    .join('\n');
  for (const mark of reached) {
    const drawn =
      markSource.includes(`walkMark('${mark}')`) ||
      (mark.startsWith('profile.') && markSource.includes('walkMark(`profile.${key}`')) ||
      (mark.startsWith('finance.') && markSource.includes('walkMark(`finance.${entry.key}`'));
    check(drawn, `${mark} is drawn on a screen`);
  }
  walk.setWalkMark('upkeep.add');
  same(walk.getWalkMark(), 'upkeep.add', 'the mark store holds a mark');
  walk.setWalkMark(null);
}
// The interview (lib/yourStoryInterview.ts): the app asks what it needs,
// then says what each tab is for as a whole (1.0.52.5).
{
  const interview = load('lib/yourStoryInterview.ts', { './yourStory': story });
  const interviewFacts = (storyView, overrides) => ({
    story: storyView,
    conditionChoices: ['hashimotos', 'ibs'],
    conditions: [],
    conditionNames: { hashimotos: "Hashimoto's", ibs: 'IBS' },
    stagedConditions: [],
    stages: {},
    neuro: [],
    neuroLabels: { adhd: 'ADHD' },
    diets: [],
    allergies: [],
    answers: {},
    records: {},
    ...overrides,
  });
  const first = interview.buildInterview(interviewFacts(fresh));
  same(first.next.key, 'conditions', 'the interview opens on conditions');
  same(first.finished, false, 'and is not finished');
  check(interview.interviewLine(first).startsWith(interview.NEXT_QUESTION_LABEL), 'the folded line asks the next question');
  same(first.startPath, null, 'no tab chosen to start from yet');
  same(first.tour.length, interview.TOUR_TABS.length, 'every tab is in the tour');

  const noneAnswered = interview.buildInterview(
    interviewFacts(fresh, { answers: { conditions: { on: '2026-09-25', answer: 'none' }, neuro: { on: '2026-09-25', answer: 'none' } } }),
  );
  same(noneAnswered.next.key, 'beats', 'answering none moves on to the parts of life');

  const withCondition = interview.buildInterview(
    interviewFacts(fresh, {
      conditions: ['hashimotos'],
      stagedConditions: [{ code: 'hashimotos', label: "Hashimoto's", stageLabels: { triage: 'Triage' } }],
    }),
  );
  check(withCondition.questions.find((q) => q.key === 'conditions').answered, 'a chosen condition answers the question');
  check(withCondition.questions.some((q) => q.key === 'stage:hashimotos'), 'a staged condition asks where you are with it');
  check(withCondition.questions.find((q) => q.key === 'stage:hashimotos').question.includes("Hashimoto's"), 'naming the condition');
  const notSure = interview.buildInterview(
    interviewFacts(fresh, {
      conditions: ['hashimotos'],
      stagedConditions: [{ code: 'hashimotos', label: "Hashimoto's", stageLabels: { triage: 'Triage' } }],
      answers: { 'stage:hashimotos': { on: '2026-09-25', answer: 'notSure' } },
    }),
  );
  check(notSure.questions.find((q) => q.key === 'stage:hashimotos').answered, 'not sure yet answers the stage question');

  const startLife = interview.buildInterview(interviewFacts(fresh, { answers: { startTab: { on: '2026-09-25', answer: '/life' } } }));
  same(startLife.startPath, '/life', 'a chosen start tab is carried');
  same(startLife.tour[0].def.path, '/life', 'and leads the tour');
  check(startLife.tour[0].chosen, 'marked as chosen');
  const startAll = interview.buildInterview(interviewFacts(fresh, { answers: { startTab: { on: '2026-09-25', answer: 'all' } } }));
  same(startAll.startPath, null, 'all of them leaves no single start');
  check(startAll.questions.find((q) => q.key === 'startTab').answered, 'and still answers the question');

  // A chosen start tab is where the by-tab guide says to start.
  same(tabs.buildTabGuide(everything, '/garden').startHere.def.path, '/garden', 'the tab guide starts where the person said');
  same(tabs.buildTabGuide(everything, null).startHere.def.path, '/life', 'and falls back to its own order otherwise');

  // Every tour tab is a tab, every lens a key that tab knows.
  same(interview.TOUR_TABS.map((def) => def.path).sort(), ['/'].concat(tabPaths).sort(), 'the tour covers every tab');
  for (const def of interview.TOUR_TABS) {
    const tab = TAB_FILES[def.path];
    for (const group of def.groups) {
      for (const key of group.lenses) {
        check(!!interview.TOUR_LENS_NAMES[def.path] && !!interview.TOUR_LENS_NAMES[def.path][key], `${def.path}/${key} has a name`);
        if (!tab) continue;
        const file = tab[1];
        tabSource[file] = tabSource[file] || fs.readFileSync(path.join(__dirname, '..', 'app', '(tabs)', file), 'utf8');
        check(tabSource[file].includes(`'${key}'`), `tour: ${file} has a lens ${key}`);
      }
    }
    for (const step of def.steps) {
      if (step.item) check(!!story.ITEM_BY_KEY[step.item], `tour step names an item that exists: ${step.item}`);
    }
  }
  const dietsSource = fs.readFileSync(path.join(__dirname, '..', 'lib', 'digest', 'popularDiets.ts'), 'utf8');
  for (const style of interview.EATING_STYLES) check(dietsSource.includes(`'${style.readId}'`), `eating style ${style.tag} reads ${style.readId}`);

  for (const def of interview.INTERVIEW_QUESTIONS) written.push(def.question.replace('{condition}', 'IBS'), def.why);
  for (const style of interview.EATING_STYLES) written.push(style.line);
  for (const def of interview.TOUR_TABS) {
    written.push(def.title, def.question, def.answer);
    for (const group of def.groups) written.push(group.title, group.line);
    for (const step of def.steps) written.push(step.doThis);
  }
  for (const names of Object.values(interview.TOUR_LENS_NAMES)) written.push(...Object.values(names));
  written.push(
    interview.NONE_OF_THESE_LABEL, interview.DONE_LABEL, interview.NOT_SURE_LABEL, interview.NO_ALLERGIES_LABEL,
    interview.NO_STYLE_LABEL, interview.ALL_TABS_LABEL, interview.NOT_NOW_LABEL, interview.TAKE_NOTHING_LABEL,
    interview.ADD_MEDS_LABEL, interview.LEAVE_OUT_LABEL, interview.SET_UP_BACKUP_LABEL, interview.PLAN_THIS_WAY_LABEL,
    interview.READ_MORE_LABEL, interview.CHANGE_LABEL, interview.NEURO_PROFILE_NOTE, interview.OPEN_PROFILE_LABEL,
    interview.INTERVIEW_HEADING, interview.INTERVIEW_LEAD, interview.INTERVIEW_ANSWERED_HEADING,
    interview.INTERVIEW_FINISHED_LINE, interview.TOUR_HEADING, interview.TOUR_LEAD, interview.TOUR_START_LABEL,
    interview.TOUR_GETTING_STARTED, interview.TOUR_OPEN_LABEL('Life'),
  );
  for (const q of withCondition.questions) if (q.summary) written.push(q.summary);
}
// it what the screen calls it. Nothing else may say healing. "Step by step"
// is the name of a way of writing the guides and "+ Add a step" a button on
// Routines; neither counts anybody's steps.
const allText = written
  .join(' ')
  .replace(/Healing Stage/g, 'Stage Foods')
  .replace(/Step by step/g, 'Detailed')
  .replace(/\+ Add a step/g, '+ Add a part');
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
// "+ Add a Rule of Your Own" is a button on Insights, quoted as it reads.
check(!/\bown\b/i.test(allText.replace(/on their own/g, '').replace(/Rule of Your Own/g, '')), 'no redundant own');

console.log(`${checks - failures}/${checks} checks passed`);
if (failures > 0) process.exit(1);
