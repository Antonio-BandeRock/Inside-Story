// Checks lib/doseWatch.ts (A16, a linked person sees when a dose is not
// marked): what travels, reading it back, when an alert fires and when it
// is taken back, and that the words never call a dose missed or say what to
// do about it.
// Run: node scripts/test_dose_watch.js
/* global __dirname */
const path = require('path');
const ts = require('typescript');
const fs = require('fs');

const src = fs.readFileSync(path.join(__dirname, '..', 'lib', 'doseWatch.ts'), 'utf8');
const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const m = { exports: {} };
new Function('module', 'exports', 'require', js)(m, m.exports, require);
const D = m.exports;

let pass = 0;
let fail = 0;
function check(name, ok) {
  if (ok) pass++;
  else {
    fail++;
    console.log('FAIL', name);
  }
}

const HOUR = 3600_000;
const now = Date.parse('2026-09-30T15:00:00Z');
const iso = (ms) => new Date(ms).toISOString();

// Marks
check('logged is taken', D.peerDoseMark('logged') === 'taken');
check('partial is taken', D.peerDoseMark('partial') === 'taken');
check('skipped', D.peerDoseMark('skipped') === 'skipped');
check('pending is unmarked', D.peerDoseMark('pending') === 'unmarked');
check('null is unmarked', D.peerDoseMark(null) === 'unmarked');

// Items sent
const items = D.peerDoseItems(
  [
    { id: 'b', name: 'Levothyroxine', dueAtMs: now - 3 * HOUR, status: 'pending', markedAt: null },
    { id: 'a', name: ' Iron ', dueAtMs: now - 5 * HOUR, status: 'logged', markedAt: iso(now - 4 * HOUR) },
    { id: 'old', name: 'Old', dueAtMs: now - 40 * HOUR, status: 'pending', markedAt: null },
    { id: 'far', name: 'Far', dueAtMs: now + 30 * HOUR, status: 'pending', markedAt: null },
    { id: 'none', name: 'No time', dueAtMs: null, status: 'pending', markedAt: null },
    { id: 'blank', name: '  ', dueAtMs: now + HOUR, status: 'pending', markedAt: iso(now) },
  ],
  now,
);
check('window drops outside rows', items.length === 3);
check('sorted by due', items[0].id === 'a' && items[1].id === 'b' && items[2].id === 'blank');
check('name trimmed', items[0].name === 'Iron');
check('blank name', items[2].name === 'A med');
check('markedAt only when marked', items[0].markedAt !== null && items[2].markedAt === null);
check('dueAt is ISO', items[1].dueAt === iso(now - 3 * HOUR));

// Reading back
check('undefined stays undefined', D.cleanPeerDosePart(undefined) === undefined);
check('null means withdrawn', D.cleanPeerDosePart(null) === null);
check('junk is ignored', D.cleanPeerDosePart('x') === undefined && D.cleanPeerDosePart({}) === undefined);
const cleaned = D.cleanPeerDosePart({
  items: [
    { id: 'x', name: 'A', dueAt: iso(now), mark: 'taken', markedAt: iso(now) },
    { id: 'x', name: 'dup', dueAt: iso(now), mark: 'taken' },
    { id: 'y', name: 'B', dueAt: 'nonsense', mark: 'taken' },
    { id: 'z', name: 'C', dueAt: iso(now), mark: 'weird', markedAt: iso(now) },
    null,
  ],
});
check('clean keeps valid, drops duplicate and bad date', cleaned.items.length === 2);
check('unknown mark is unmarked, no markedAt', cleaned.items[1].mark === 'unmarked' && cleaned.items[1].markedAt === null);

// State
const dose = (id, dueMs, mark = 'unmarked') => ({ id, name: 'Levothyroxine', dueAt: iso(dueMs), mark, markedAt: null });
check('coming up', D.watchState(dose('1', now + HOUR), now) === 'comingUp');
check('due within grace', D.watchState(dose('1', now - HOUR), now) === 'due');
check('not marked past grace', D.watchState(dose('1', now - 3 * HOUR), now) === 'notMarked');
check('taken', D.watchState(dose('1', now - 3 * HOUR, 'taken'), now) === 'taken');

// Alerts
let plan = D.planDoseAlerts({ doses: [dose('f', now + HOUR)], nowMs: now, alerted: new Map(), enabled: true });
check('future dose queued at due plus grace', plan.schedule.length === 1 && plan.schedule[0].fireAtMs === now + 3 * HOUR);
plan = D.planDoseAlerts({ doses: [dose('o', now - 5 * HOUR)], nowMs: now, alerted: new Map(), enabled: true });
check('overdue fires now', plan.schedule.length === 1 && plan.schedule[0].fireAtMs === now);
plan = D.planDoseAlerts({ doses: [dose('o', now - 20 * HOUR)], nowMs: now, alerted: new Map(), enabled: true });
check('too late is not raised', plan.schedule.length === 0);
plan = D.planDoseAlerts({ doses: [dose('o', now - 5 * HOUR)], nowMs: now, alerted: new Map([['o', now - HOUR]]), enabled: true });
check('raised once, never again', plan.schedule.length === 0 && plan.cancel.length === 0);
plan = D.planDoseAlerts({ doses: [dose('f', now + HOUR, 'taken')], nowMs: now, alerted: new Map([['f', now + 3 * HOUR]]), enabled: true });
check('marked since takes a queued alert back', plan.cancel.length === 1 && plan.cancel[0] === 'f');
plan = D.planDoseAlerts({ doses: [dose('f', now + HOUR)], nowMs: now, alerted: new Map([['f', now + 3 * HOUR]]), enabled: false });
check('alerts off takes queued back', plan.cancel[0] === 'f' && plan.schedule.length === 0);
plan = D.planDoseAlerts({
  doses: [],
  nowMs: now,
  alerted: new Map([
    ['gone', now + HOUR],
    ['past', now - HOUR],
  ]),
  enabled: true,
});
check('gone from the window: queued cancelled, raised left alone', plan.cancel.length === 1 && plan.cancel[0] === 'gone');
plan = D.planDoseAlerts({ doses: [dose('f', now + HOUR)], nowMs: now, alerted: new Map([['f', now + 3 * HOUR]]), enabled: true });
check('already queued is queued again (same moment, same id)', plan.schedule.length === 1);

// Words
const late = dose('w', now - 3 * HOUR);
const after = D.alertBody('Maria', late, iso(now - HOUR), now);
const before = D.alertBody('Maria', late, iso(now - 4 * HOUR), now);
check('title', D.alertTitle('Maria', late) === 'Maria: Levothyroxine not marked');
check('body after due names the update', /last sent an update/.test(after) && /had not been marked/.test(after));
check('body before due cannot tell', /cannot tell/.test(before));
check('possessive on s', /James’ phone/.test(D.lastUpdateLine('James', iso(now), now)));
check('row line', D.watchRowLine(late, now).startsWith('Due '));
check('limit names the prescriber', /prescriber/.test(D.DOSE_WATCH_LIMIT));
check('two consent choices', D.DOSE_CONSENT_CHOICES.length === 2);
check('consent line self', /by the person it belongs to/.test(D.consentLine('self', iso(now), now)));

const allWords = [
  after,
  before,
  D.DOSE_WATCH_LIMIT,
  D.DOSE_WATCH_EMPTY,
  D.doseConsentMessage('Maria'),
  ...D.DOSE_CONSENT_CHOICES.map((c) => c.label),
  ...['taken', 'skipped', 'unmarked'].map((mark) => D.watchRowLine({ ...late, mark }, now)),
  D.watchRowLine(dose('c', now + HOUR), now),
  D.watchRowLine(dose('d', now - HOUR), now),
].join(' ');
check('never says missed', !/\bmissed\b/i.test(allWords));
check('never tells anybody to take or stop', !/\b(?:should take|take it now|remind them to|stop taking)\b/i.test(allWords));
check('no dashes as punctuation', !/[–—]| -- /.test(allWords));

console.log(`${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
