// Runs lib/gardenMonthNotice.ts: This month in the garden (I12, 1.0.55.26).
//
// The rules checked:
//
//  1. The lines are what the sowing calendar has open or opening in the next
//     30 days, one per kind of work, each crop once, in the order the work
//     is done.
//  2. A frost-free place gets its months, and a place with no frost dates
//     says how to get them rather than sending an empty list.
//  3. The sky line carries the full and new moons and any solstice or
//     equinox in the same days.
//  4. The fire day: 1 to 28 only, the first one after now, within the reach.
//  5. The reminder is wired: a kind, a label, a caption, off by default, a
//     Profile day and time, a tap that opens the Sowing Calendar.
//  6. No dashes and no verdict words.
//
// Run with: node scripts/test_garden_month_notice.js
// Exits non-zero on any failure.

/* global __dirname */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function loadModule(relPath, deps = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    if (name in deps) return deps[name];
    throw new Error(`unexpected import ${name}`);
  });
  return module.exports;
}

const N = loadModule('lib/plantNutrients.ts');
const P = loadModule('lib/cropProblems.ts', { './plantNutrients': N });
const G = loadModule('lib/cropGuides.ts', { './plantNutrients': N, './cropProblems': P });
const F = loadModule('lib/frostDates.ts');
const S = loadModule('lib/sowingWindows.ts', { './frostDates': F });
const M = loadModule('lib/moonSky.ts');
const X = loadModule('lib/gardenMonthNotice.ts', { './cropGuides': G, './moonSky': M, './sowingWindows': S });

let passed = 0;
let failed = 0;
function check(label, ok) {
  if (ok) passed += 1;
  else {
    failed += 1;
    console.log(`FAIL: ${label}`);
  }
}

// A northern place with a mid-April last frost and a mid-October first
// frost, the way frostAnchor builds it: days counted from July 1, so April
// 15 is 288 and October 14 is 105.
const north = { kind: 'frost', southern: false, lastHalf: 288, lastNineInTen: 298, firstHalf: 105 };
const frostFree = { kind: 'frostFree', southern: false, frostYears: 0, seasons: 30 };

// 1. The lines.
const march = X.gardenMonthLines(north, '2027-03-01');
check('March has something to start indoors', march.some((l) => l.label === 'Start indoors' && l.crops.includes('Tomatoes')));
check('each crop once per line', march.every((l) => new Set(l.crops).size === l.crops.length));
check('crops in a line are alphabetical', march.every((l) => l.crops.join('|') === [...l.crops].sort((a, b) => a.localeCompare(b)).join('|')));
const order = march.map((l) => l.label);
check('indoors comes before sowing outside', !order.includes('Sow outside') || order.indexOf('Start indoors') < order.indexOf('Sow outside'));
// Every crop named is one whose window meets the 30 days.
for (const line of march) {
  for (const name of line.crops) {
    const w = S.SOWING_WINDOWS.find((x) => (G.findCropGuideByKey(x.key)?.name ?? x.key) === name);
    const near = w ? S.windowsNear(w, north, '2027-03-01', X.GARDEN_MONTH_DAYS) : [];
    check(`${name} has a window in the 30 days`, near.some((d) => S.actionLabel(w, d.action) === line.label));
  }
}
const december = X.gardenMonthLines(north, '2026-12-01');
check('December in the north opens nothing to sow outside', !december.some((l) => l.label === 'Sow outside'));

// 2. Frost-free and missing places.
const ff = X.gardenMonthLines(frostFree, '2026-10-01');
check('a frost-free October names crops to plant', ff.some((l) => l.label === 'Plant' && l.crops.length > 0));
const fire = new Date(2026, 9, 1, 8, 0);
const noPlace = X.buildGardenMonthBody({ status: 'no-location' }, fire);
check('no place says where to save one', noPlace.includes('Garden > My Zone'));
const unread = X.buildGardenMonthBody({ status: 'unread' }, fire);
check('unread frost dates say how to work them out', unread.includes('Garden > Sowing Calendar'));
const noAnchor = X.buildGardenMonthBody({ status: 'ready', anchor: null, placeLabel: 'Town', southern: false }, fire);
check('too little history is said', noAnchor.includes('too few days'));
const body = X.buildGardenMonthBody({ status: 'ready', anchor: north, placeLabel: 'Springfield', southern: false }, new Date(2027, 2, 1, 8, 0));
check('the body opens with the dates', body.startsWith('Open or opening March 1 to March 30:'));
check('the body names the place', body.endsWith('Worked out from the frost dates for Springfield.'));
const plantLine = X.buildGardenMonthBody({ status: 'ready', anchor: frostFree, placeLabel: null, southern: false }, fire)
  .split('\n')
  .find((l) => l.startsWith('Plant:'));
const plantCount = ff.find((l) => l.label === 'Plant').crops.length;
check('a long line names six and counts the rest',
  plantCount > X.NAMES_PER_LINE && plantLine.endsWith(`with ${plantCount - X.NAMES_PER_LINE} more on the calendar.`));

// Only the crops chosen in My Crops (2026-10-01).
const chosenFF = X.gardenMonthLines(frostFree, '2026-10-01', new Set(['lettuce']));
check('a chosen crop is the only one named', chosenFF.every((l) => l.crops.every((c) => c === 'Lettuce')) && chosenFF.length > 0);
check('nothing chosen names nothing', X.gardenMonthLines(frostFree, '2026-10-01', new Set()).length === 0);
const chosenBody = X.buildGardenMonthBody({ status: 'ready', anchor: north, placeLabel: null, southern: false }, new Date(2027, 6, 1, 8, 0), new Set(['garlic']));
check('a quiet month for the chosen crops says My Crops', chosenBody.startsWith('Nothing in My Crops opens') || chosenBody.includes('Garlic'));

// 3. The sky.
const sky = X.skyLine(new Date(2027, 2, 1, 8, 0), false);
check('March 2027 has a full moon', /full moon March/.test(sky));
check('March 2027 has the equinox', /March equinox March 2[01]/.test(sky));
check('a sky line in any month', X.skyLine(new Date(2026, 6, 1, 8, 0), false) !== null);

// 4. The fire day.
const now = new Date(2026, 8, 28, 12, 0);
const next = X.nextGardenMonthFire(1, '08:00', now, 32);
check('the 1st after September 28 is October 1', next && next.getMonth() === 9 && next.getDate() === 1 && next.getHours() === 8);
check('today at a later time counts', X.nextGardenMonthFire(28, '18:00', now, 32)?.getDate() === 28);
check('today at an earlier time does not', X.nextGardenMonthFire(28, '08:00', now, 32)?.getMonth() === 9);
check('a day past 28 is refused', X.nextGardenMonthFire(30, '08:00', now, 32) === null);
check('out of reach gives nothing', X.nextGardenMonthFire(1, '08:00', now, 2) === null);

// 5. Wiring.
const read = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const prefs = read('lib/reminderPreferences.ts');
check('a kind', prefs.includes("| 'gardenMonth'") && prefs.includes("  'gardenMonth',"));
check('a label', prefs.includes("gardenMonth: 'This month in the garden'"));
check('off by default', prefs.includes('gardenMonth: false,'));
const notes = read('lib/reminderNotifications.ts');
check('scheduled when on', notes.includes("isReminderKindEnabled(preferences, 'gardenMonth')"));
check('nothing is sent while My Crops is empty', notes.includes('if (fireAt && chosen.size > 0)'));
check('the body is given the chosen crops', notes.includes('buildGardenMonthBody(place, fireAt, chosen)'));
check('the tap opens the Sowing Calendar', notes.includes("if (data.lens === 'sowingCalendar') return { pathname: '/garden', params: { openGardenLens: 'sowingCalendar' } };"));
check('never fetched in the background', notes.includes('readCachedFrostDates()') && !/gardenMonth[\s\S]{0,1500}getFrostDates\(/.test(notes));
const garden = read('app/(tabs)/garden.tsx');
check('Garden opens that lens', garden.includes("openGardenLens === 'sowingCalendar'"));
const profile = read('app/profile.tsx');
check('Profile has the day and time', profile.includes('onSelect={saveGardenMonthDay}') && profile.includes('onSelect={saveGardenMonthTime}'));

// 6. Words.
const source = read('lib/gardenMonthNotice.ts');
const strings = source.match(/`[^`]*`|'[^'\n]*'/g) || [];
for (const text of [...strings, noPlace, unread, noAnchor, body]) {
  check(`no verdict words: ${text.slice(0, 60)}`, !/\b(must|should|ideal|optimal|best time|do not plant)\b/i.test(text));
  check(`no dashes: ${text.slice(0, 60)}`, !/[–—]| -- /.test(text));
}

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
