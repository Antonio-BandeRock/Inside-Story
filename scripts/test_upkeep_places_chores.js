// Checks J6 (upkeep by room or area), J7 (I have N minutes) and the chores
// that are assigned or taken, all in lib/upkeep.ts (2026-09-29).
//
//  1. Places group alphabetically with No place given last, a place named on
//     another phone lands with this phone's place of the same name, and each
//     heading says a count and dates.
//  2. Only things with minutes written down are offered for a stretch of
//     time; the rest are counted, never guessed at, and things somebody else
//     is doing are counted apart.
//  3. An assignee code reads as anyone, yours, or a name, and a code this
//     phone cannot place reads by the name carried with it.
//  4. Nothing any of it says scores anybody.
//
// Run with: node scripts/test_upkeep_places_chores.js

/* global __dirname */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const cache = {};
function load(relPath) {
  if (cache[relPath]) return cache[relPath];
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  cache[relPath] = module.exports;
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    if (name === './choiceOrder') return load('lib/choiceOrder.ts');
    throw new Error(relPath + ' asked for ' + name);
  });
  cache[relPath] = module.exports;
  return module.exports;
}

const up = load('lib/upkeep.ts');

let checks = 0;
let failures = 0;
function check(condition, label) {
  checks += 1;
  if (!condition) {
    failures += 1;
    console.error('FAIL: ' + label);
  }
}
function same(a, b, label) {
  check(JSON.stringify(a) === JSON.stringify(b), label + ' (got ' + JSON.stringify(a) + ')');
}

const said = [];
function say(text) {
  said.push(text);
  return text;
}

let n = 0;
function item(fields) {
  n += 1;
  return {
    id: 'u' + n,
    name: 'Thing ' + n,
    category: 'home',
    cadence: 'recurring',
    intervalMonths: null,
    intervalDays: null,
    lastDoneOn: null,
    expiresOn: null,
    renewable: false,
    cost: null,
    active: true,
    notes: null,
    place: null,
    placeName: null,
    minutes: null,
    assignedTo: null,
    assignedName: null,
    household: false,
    ...fields,
  };
}

const TODAY = '2026-09-29';

// --- Intervals ---------------------------------------------------------------
same(up.describeInterval({ intervalDays: 7, intervalMonths: null }), 'every week', 'seven days reads as every week');
same(up.describeInterval({ intervalDays: 14, intervalMonths: null }), 'every 2 weeks', 'fourteen days reads as every 2 weeks');
same(up.describeInterval({ intervalDays: 1, intervalMonths: null }), 'every day', 'one day reads as every day');
same(up.describeInterval({ intervalDays: null, intervalMonths: 12 }), 'every year', 'twelve months reads as every year');
same(up.describeInterval({ intervalDays: 7, intervalMonths: 12 }), 'every week', 'days win over months');
const weekly = up.upkeepStanding(item({ intervalDays: 7, lastDoneOn: '2026-09-25' }), TODAY);
same(weekly.dueOn, '2026-10-02', 'a weekly chore done on the 25th is due on the 2nd');

// --- Places ------------------------------------------------------------------
const custom = [{ id: 'p1', name: 'Attic' }];
const choices = up.placeChoices(custom);
check(choices.some((c) => c.code === 'p1' && !c.builtIn), 'a named place is among the choices');
const labels = choices.map((c) => c.label);
same(labels, [...labels].sort((a, b) => a.localeCompare(b)), 'place choices are alphabetical, named ones among the built-ins');
same(up.placeLabel(null, custom), up.NO_PLACE_LABEL, 'no place reads as No place given');
same(up.placeLabel('elsewhere', custom, 'Shed'), 'Shed', 'an unknown place reads by the name carried with it');

const placed = [
  item({ name: 'Descale kettle', place: 'kitchen', intervalMonths: 3, lastDoneOn: '2026-05-01' }),
  item({ name: 'Clean oven', place: 'kitchen', intervalMonths: 6, lastDoneOn: '2026-08-01' }),
  item({ name: 'Check insulation', place: 'p1', intervalMonths: 12, lastDoneOn: '2026-01-10' }),
  item({ name: 'Grout', place: 'other-phone-code', placeName: 'kitchen', intervalMonths: 12, lastDoneOn: '2026-03-01' }),
  item({ name: 'Loose thing' }),
  item({ name: 'Paused thing', place: 'p1', active: false }),
];
const groups = up.groupByPlace(placed, custom, TODAY);
same(groups.map((g) => g.label), ['Attic', 'Kitchen', up.NO_PLACE_LABEL], 'groups are alphabetical, No place given last');
const kitchen = groups.find((g) => g.label === 'Kitchen');
same(kitchen.entries.length, 3, 'a place named kitchen on another phone joins this kitchen');
same(kitchen.overdueCount, 1, 'the kettle is overdue');
same(kitchen.oldestOverdueOn, '2026-08-01', 'and was due on 1 August');
same(kitchen.nextDueOn, '2027-02-01', 'the oven is next, due in February, before the grout');
same(kitchen.lastDoneOn, '2026-08-01', 'the kitchen was last done in August');
const attic = groups.find((g) => g.label === 'Attic');
same(attic.activeCount, 1, 'a paused thing is not counted as active');
const atticLine = say(up.describePlaceGroup(attic));
check(atticLine.includes('1 paused'), 'and is said to be paused');
say(up.describePlaceGroup(kitchen));
say(up.describePlaceGroup(groups[2]));

same(say(up.placeRemovalNote('Attic', 0)), 'Nothing is in Attic, so it can go straight away.', 'an empty place can go straight away');
check(say(up.placeRemovalNote('Attic', 2)).includes('Pick where they go'), 'a place in use asks where its things go');

// --- Assignees ---------------------------------------------------------------
const ctx = {
  myPersonId: 'me1',
  myKey: 'KEY_ME',
  connections: [{ key: 'KEY_PARTNER', name: 'Sam' }],
  family: [{ id: 'f1', name: 'Robin' }],
};
same(up.resolveAssignee({ assignedTo: null, assignedName: null }, ctx), { kind: 'anyone' }, 'nobody named is anyone');
same(up.resolveAssignee({ assignedTo: 'person:me1', assignedName: 'Tony' }, ctx), { kind: 'me' }, 'taking it writes this person');
same(up.resolveAssignee({ assignedTo: 'key:KEY_ME', assignedName: 'Tony' }, ctx), { kind: 'me' }, 'a partner handing it over by this key reads as yours');
same(up.resolveAssignee({ assignedTo: 'key:KEY_PARTNER', assignedName: 'S' }, ctx), { kind: 'person', name: 'Sam' }, 'a connection reads by their name here');
same(up.resolveAssignee({ assignedTo: 'family:f1', assignedName: null }, ctx), { kind: 'person', name: 'Robin' }, 'a family member reads by name');
same(up.resolveAssignee({ assignedTo: 'person:other', assignedName: 'Sam' }, ctx), { kind: 'person', name: 'Sam' }, 'the partner taking it reads by the name carried');
same(up.resolveAssignee({ assignedTo: 'family:gone', assignedName: '' }, ctx), { kind: 'person', name: 'somebody else' }, 'an unknown code with no name never reads as yours');
same(say(up.describeAssignee({ kind: 'anyone' })), 'Anyone can take this', 'anyone is said plainly');
same(say(up.describeAssignee({ kind: 'me' })), 'Yours', 'yours is said plainly');
same(say(up.describeAssignee({ kind: 'person', name: 'Sam' })), 'Sam is doing this', 'somebody else is named');

// --- I have N minutes ----------------------------------------------------------
const due = (fields) => item({ intervalMonths: 1, lastDoneOn: '2026-08-20', ...fields });
const timed = [
  due({ name: 'Wipe fridge', minutes: 10, lastDoneOn: '2026-08-10' }),
  due({ name: 'Mop floor', minutes: 15 }),
  due({ name: 'Wash windows', minutes: 60 }),
  due({ name: 'Sort shed' }),
  due({ name: 'Mow lawn', minutes: 10, assignedTo: 'key:KEY_PARTNER' }),
  due({ name: 'Water plants', minutes: 5, assignedTo: 'person:me1' }),
  item({ name: 'Far off', minutes: 5, intervalMonths: 12, lastDoneOn: '2026-09-01' }),
  due({ name: 'Paused', minutes: 5, active: false }),
];
const fit = up.fitInMinutes(timed, 20, TODAY, ctx);
same(fit.fits.map((s) => s.item.name), ['Wipe fridge', 'Mop floor', 'Water plants'], 'what fits, soonest first, with nothing far off or paused');
same(fit.noMinutes.map((s) => s.item.name), ['Sort shed'], 'a thing with no minutes is left out and counted');
same(fit.tooLong, 1, 'a thing longer than the time is counted');
same(fit.someoneElse, 1, 'a thing somebody else is doing is counted apart');
same([fit.togetherCount, fit.togetherMinutes], [1, 10], 'the first one fits with room for no more of the next');
const fitLine = say(up.describeTimeFit(fit, 20));
check(fitLine.includes('left out rather than guessed at'), 'the no-minutes count is said');
check(fitLine.includes('somebody else'), 'somebody else doing one is said');
const all = up.fitInMinutes(timed, 120, TODAY, ctx);
same([all.togetherCount, all.togetherMinutes], [4, 90], 'with two hours the four that are mine fit together');
say(up.describeTimeFit(all, 120));
const none = up.fitInMinutes([], 30, TODAY, ctx);
same(say(up.describeTimeFit(none, 30)), 'Nothing due or coming due fits in 30 minutes.', 'nothing to offer says so');

// --- Forbidden words --------------------------------------------------------------
const FORBIDDEN = /\b(score|scored|streak|great job|well done|good job|percent|%|lazy|behind|fell behind|keep it up|only did|more than|less than|fair share|points?)\b/i;
for (const text of said) check(!FORBIDDEN.test(text), 'no score or verdict in: ' + text);

console.log((failures === 0 ? 'PASS' : 'FAIL') + ' ' + (checks - failures) + '/' + checks);
process.exit(failures === 0 ? 0 : 1);
