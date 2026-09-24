// Checks the pure pieces of Phase A of the 2026-09-24 gap review, the
// trust and safety pass ("Start with Phase A and write it into Notion"):
//
// 1. The version line every report carries, naming the app build and the
//    reference data (food scores and interaction rules) its figures came
//    from (lib/reportVersion.ts).
// 2. Finding clashes on medication, allergy, condition, lab, rule and
//    emergency records after a merge (clashedRows in lib/snapshotMerge.ts),
//    starting from a clash the merge itself produced.
// 3. The sentence said about them even though ANNOUNCE_MERGES keeps every
//    other merge quiet (clashNotice in lib/snapshotSync.ts).
// 4. Checking a backup opens without restoring it (lib/backupCheck.ts).
// 5. Quiet hours: what is held, what is dropped, what always arrives
//    (lib/quietHours.ts).
// 6. The status page and the reasons a reminder may not have come
//    (lib/appStatus.ts).
//
// Every module loaded here imports nothing. Exits non-zero on any failure.

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

const reportVersion = load('lib/reportVersion.ts');
const merge = load('lib/snapshotMerge.ts');
const sync = load('lib/snapshotSync.ts');
const backupCheck = load('lib/backupCheck.ts');
const quietHours = load('lib/quietHours.ts');
const appStatus = load('lib/appStatus.ts');

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

// 1. The report version line.
same(reportVersion.referenceDataDate('20260918210000'), '2026-09-18', 'a reference stamp reads as its day');
same(reportVersion.referenceDataDate('odd'), 'odd', 'a stamp in another shape is shown as it is');
const line = reportVersion.reportVersionLine('1.0.50.13', '20260918210000');
same(
  line,
  'Made with Inside Story 1.0.50.13, using food reference data and interaction rules dated 2026-09-18 (build 20260918210000).',
  'the version line names both versions',
);
const reportFiles = ['lib/reportGenerator.ts', 'lib/reportHtml.ts'].map((file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8'));
check(/versionLine: reportVersionLine\(APP_VERSION, REFERENCE_DB_VERSION\)/.test(reportFiles[0]), 'the report document is stamped with both versions');
check(/doc\.versionLine/.test(reportFiles[0]), 'the on-screen report prints the version line');
check(/doc\.versionLine/.test(reportFiles[1]), 'the PDF prints the version line');

// 2. A clash on a medication, made by the merge itself.
const shapes = { treatments: { key: ['id'] }, meals: { key: ['id'] } };
const base = {
  treatments: [{ id: 1, name: 'Levothyroxine', dose: '50 mcg', updated_at: '2026-09-20T08:00:00Z' }],
  meals: [{ id: 7, name: 'Soup', updated_at: '2026-09-20T08:00:00Z' }],
};
const here = {
  treatments: [{ id: 1, name: 'Levothyroxine', dose: '75 mcg', updated_at: '2026-09-21T08:00:00Z' }],
  meals: [{ id: 7, name: 'Lentil soup', updated_at: '2026-09-21T08:00:00Z' }],
};
const there = {
  treatments: [{ id: 1, name: 'Levothyroxine', dose: '88 mcg', updated_at: '2026-09-22T08:00:00Z' }],
  meals: [{ id: 7, name: 'Bean soup', updated_at: '2026-09-22T08:00:00Z' }],
};
const merged = merge.mergeTables(base, here, there, { shapes, laterSide: 'there' });
const clashes = merge.clashedRows(merged.entries, merged.tables, shapes, sync.CLASH_TABLES);
same(clashes.map((clash) => clash.table), ['treatments'], 'only the medication clash is picked out, never the meal');
same(clashes[0] && clashes[0].row && clashes[0].row.dose, '88 mcg', 'the row handed on is the one that stands');

const said = sync.clashNotice(clashes);
check(typeof said === 'string' && said.includes('the medication or supplement "Levothyroxine"'), 'the notice names the medication');
check(said && said.includes('Please check it says'), 'one clash is "it"');
check(said && said.includes('Profile, Sync Activity'), 'the notice says where the record is');
check(said && !/[–—]/.test(said), 'the notice has no dashes');

// 3. The sentence in its other shapes.
same(sync.clashNotice([]), null, 'no clash, no notice');
same(sync.clashNotice([{ table: 'meals', row: { name: 'Soup' } }]), null, 'a table outside the list is never said');
const unnamed = sync.clashNotice([{ table: 'emergency_profile', row: { blood_type: 'O+' } }]);
check(unnamed && unnamed.includes('an emergency detail'), 'a table with no name column is said by kind, with the right article');
const twice = sync.clashNotice([
  { table: 'user_food_allergies', row: { allergen_name: 'Peanut' } },
  { table: 'user_food_allergies', row: { allergen_name: 'Peanut' } },
]);
check(twice && twice.split('Peanut').length === 2, 'the same record is said once');
const long = sync.clashNotice([{ table: 'personal_rules', row: { description: 'x'.repeat(200) } }]);
check(long && long.includes('…') && !long.includes('x'.repeat(61)), 'a long name is cut');
const many = sync.clashNotice(
  ['A', 'B', 'C', 'D', 'E', 'F'].map((name) => ({ table: 'lab_results', row: { test_code: name } })),
);
check(many && many.includes('2 other health records') && many.includes('each one'), 'past four, the rest are counted');
const gone = sync.clashNotice([{ table: 'treatments', row: null }]);
check(gone && gone.includes('a medication or supplement'), 'a removed row is said by kind');

// Every table the notice covers is one the merge carries between devices.
for (const table of sync.CLASH_TABLES) {
  check(!(sync.DEVICE_LOCAL_TABLES || []).includes(table), table + ' travels between devices');
}

// 4. Checking a backup.
const summary = backupCheck.summarizeBackup(
  { schemaVersion: 1, exportedAt: '2026-09-20T10:00:00Z', tables: { meals: [{}, {}], treatments: [{}], old_table: [{}] } },
  ['meals', 'treatments'],
  1,
);
same([summary.rows, summary.tables, summary.unknownTables, summary.newerFormat], [4, 3, ['old_table'], false], 'a backup is counted and a gone table named');
const opened = backupCheck.backupCheckSentence(summary, 'Sept 20');
check(opened.includes('4 records across 3 tables') && opened.includes('Nothing on this device was changed'), 'the check says what it read and that nothing changed');
check(opened.includes('a restore would skip it'), 'one gone table is "it"');
const empty = backupCheck.summarizeBackup({ schemaVersion: 1, exportedAt: 'x', tables: { meals: [] } }, ['meals'], 1);
check(backupCheck.backupCheckSentence(empty, 'then').includes('holds no records at all'), 'an empty backup is said to be empty');
const newer = backupCheck.summarizeBackup({ schemaVersion: 9, exportedAt: 'x', tables: { meals: [{}] } }, ['meals'], 1);
check(backupCheck.backupCheckSentence(newer, 'then').includes('update the app before restoring'), 'a newer format says to update first');
same(backupCheck.lastCheckLine(null, '', ''), 'No backup has been checked on this device yet.', 'no check yet is said');

// 5. Quiet hours, 10 PM to 7 AM.
const quiet = { start: '22:00', end: '07:00' };
const at = (h, m) => new Date(2026, 8, 24, h, m);
same(quietHours.quietDecision('meal', at(20, 0), false, quiet), { action: 'keep' }, 'before the window, kept');
const late = quietHours.quietDecision('meal', at(23, 30), false, quiet);
check(late.action === 'hold' && late.until.getDate() === 25 && late.until.getHours() === 7, 'late evening held to the next morning');
const early = quietHours.quietDecision('hydration', at(5, 15), false, quiet);
check(early.action === 'hold' && early.until.getDate() === 24 && early.until.getHours() === 7, 'early morning held to that morning');
same(quietHours.quietDecision('meal', at(7, 0), false, quiet), { action: 'keep' }, 'the end of the window is outside it');
same(quietHours.quietDecision('meal', at(23, 0), true, quiet), { action: 'drop' }, 'a follow-up inside the window is dropped');
same(quietHours.quietDecision('dose', at(23, 0), false, quiet), { action: 'keep' }, 'a dose always arrives');
same(quietHours.quietDecision('appointment', at(2, 0), true, quiet), { action: 'keep' }, 'an appointment always arrives');
same(quietHours.quietDecision('meal', at(23, 0), false, null), { action: 'keep' }, 'quiet hours off, kept');
const day = quietHours.quietDecision('meal', at(13, 0), false, { start: '12:00', end: '14:00' });
check(day.action === 'hold' && day.until.getHours() === 14 && day.until.getDate() === 24, 'a daytime window ends the same day');
check(!quietHours.isValidQuietHours({ start: '22:00', end: '22:00' }), 'a window of no length is refused');
check(!quietHours.isValidQuietHours({ start: '25:00', end: '07:00' }), 'an hour past 23 is refused');
const options = quietHours.quietTimeOptions();
same([options.length, options[0], options[45]], [48, { label: '12:00 AM', value: '00:00' }, { label: '10:30 PM', value: '22:30' }], 'half-hour picker steps');

// 6. The status page and the reminder reasons.
const facts = {
  phone: true,
  permission: true,
  kindsOff: [],
  quietWindow: null,
  queued: 12,
  maxQueued: 60,
  lookaheadDays: 7,
  exactAlarmsAsked: true,
};
same(appStatus.reminderStatusLine(facts).value, '12 reminders queued.', 'queued count said');
const denied = { ...facts, permission: false, kindsOff: ['Meals'], quietWindow: '10:00 PM to 7:00 AM' };
same(appStatus.reminderStatusLine(denied).tone, 'attention', 'permission off is raised');
const reasons = appStatus.reminderDiagnosis(denied);
check(reasons[0].includes('turned off for Inside Story'), 'permission is the first reason');
check(reasons.some((r) => r.includes('Meals')) && reasons.some((r) => r.includes('Quiet hours are on, 10:00 PM')), 'switched-off kinds and quiet hours are named');
check(reasons.some((r) => r.includes('Alarms & reminders')), 'the Android exact alarm allowance is named');
check(!appStatus.reminderDiagnosis(facts).some((r) => r.includes('holds 60')), 'a queue with room says nothing about being full');
check(appStatus.reminderDiagnosis({ ...facts, queued: 60 }).some((r) => r.includes('holds 60')), 'a full queue is said');
same(appStatus.reminderDiagnosis({ ...facts, phone: false }).length, 1, 'the computer gets the one reason that applies');
const describe = () => 'today';
same(appStatus.syncStatusLine({ enabled: false, lastSavedAt: null, lastLoadedAt: null, lastProblem: null }, describe).value, 'Off.', 'sync off');
same(appStatus.syncStatusLine({ enabled: true, lastSavedAt: 'a', lastLoadedAt: null, lastProblem: 'no folder' }, describe).tone, 'attention', 'a sync problem is raised');
same(
  appStatus.syncStatusLine({ enabled: true, lastSavedAt: 'a', lastLoadedAt: 'b', lastProblem: null }, describe).value,
  'On, last saved from here today, and last brought in from the other device today.',
  'sync working says both directions',
);
const date = reportVersion.referenceDataDate;
same(appStatus.referenceStatusLine('20260918210000', '20260918210000', date).tone, 'ok', 'reference data current');
check(appStatus.referenceStatusLine('20260918210000', '20260801000000', date).value.includes('dated 2026-08-01'), 'an older copy is dated');
const allText = [...reasons, ...appStatus.reminderDiagnosis(facts), opened].join(' ');
check(!/[\u2013\u2014]/.test(allText) && !/\b(?:real|genuine|genuinely)\b/i.test(allText), 'no dashes or filler words in the new sentences');

console.log(`${checks - failures}/${checks} checks passed`);
if (failures > 0) process.exit(1);
