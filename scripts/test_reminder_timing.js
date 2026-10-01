/* global __dirname */
// Checks the 2026-10-01 fix for reminders arriving only when the app or
// the phone is opened (lib/reminderTiming.ts, lib/reminderBackgroundTask.ts,
// the past-time guard and the saved presses in lib/reminderNotifications.ts).
// Run: node scripts/test_reminder_timing.js
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

let failures = 0;
function check(label, ok) {
  if (ok) console.log(`ok   ${label}`);
  else {
    failures += 1;
    console.log(`FAIL ${label}`);
  }
}

const root = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

function load(relPath, stubs) {
  const { outputText } = ts.transpileModule(read(relPath), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => stubs[name] ?? {});
  return module.exports;
}

// The pure parts, on a phone with the native module and on one without.
const withModule = load('lib/reminderTiming.ts', {
  'react-native': { Platform: { OS: 'android' }, Alert: { alert() {} } },
  '../modules/reminder-timing': {
    default: { canScheduleExactAlarms: () => false, isIgnoringBatteryOptimizations: () => true },
  },
});
const without = load('lib/reminderTiming.ts', {
  'react-native': { Platform: { OS: 'android' }, Alert: { alert() {} } },
  '../modules/reminder-timing': { default: null },
});

check('reads both settings', JSON.stringify(withModule.reminderTimingStatus()) === '{"exact":false,"battery":true}');
check('an older build reads unknown, never off', JSON.stringify(without.reminderTimingStatus()) === '{"exact":null,"battery":null}');
check('nothing to say when unknown', withModule.reminderTimingLine({ exact: null, battery: null }) === null);
check('off says the app may be held back', /picked up or the app is opened/.test(withModule.reminderTimingLine({ exact: false, battery: null })));
check('on says set for its minute', /set for its minute/.test(withModule.reminderTimingLine({ exact: true, battery: true })));
check('battery off names the cost', /a little battery/.test(withModule.reminderTimingLine({ exact: true, battery: false })));

const now = new Date('2026-10-01T09:00:00Z');
check('never asked asks', withModule.shouldAskAgain(null, now));
check('asked yesterday waits', !withModule.shouldAskAgain('2026-09-30T09:00:00Z', now));
check('asked a week ago asks again', withModule.shouldAskAgain('2026-09-24T09:00:00Z', now));
check('a broken stamp asks', withModule.shouldAskAgain('nonsense', now));

check('off to on reschedules', withModule.becameExact(false, true));
check('on to on does not', !withModule.becameExact(true, true));
check('unknown to on does not', !withModule.becameExact(null, true));
check('on to off does not', !withModule.becameExact(true, false));

const parsed = withModule.parseTimingRecord('{"askedAt":"2026-09-30T00:00:00Z","exact":false}');
check('the record reads back', parsed.askedAt === '2026-09-30T00:00:00Z' && parsed.exact === false);
check('a missing record is empty', JSON.stringify(withModule.parseTimingRecord(null)) === '{"askedAt":null,"exact":null}');
check('a broken record is empty', JSON.stringify(withModule.parseTimingRecord('{')) === '{"askedAt":null,"exact":null}');

// The wiring, read from the source.
const notifier = read('lib/reminderNotifications.ts');
check('a time already gone is never queued', notifier.includes('if (planned.fireAt.getTime() <= Date.now()) continue;'));
check('a press is written down before it is answered', /async function answerPress[\s\S]*?claimAnswer\(responseKey\(response\)\)/.test(notifier));
check('the open app answers presses the same way', /handleResponse[\s\S]*?answerPress\(response\)/.test(notifier));
check('the background answers presses, not taps', /answerFromBackground[\s\S]*?DEFAULT_ACTION_IDENTIFIER\) return;/.test(notifier));
check('rescheduling cancels ours first', /rescheduleAllReminders[\s\S]*?cancelAllOurs\(\)[\s\S]*?syncReminderNotifications\(\)/.test(notifier));

const entry = read('index.js');
check('the task is defined before the router starts', entry.indexOf('reminderBackgroundTask') >= 0 && entry.indexOf('reminderBackgroundTask') < entry.indexOf('expo-router/entry'));
check('package.json starts at index.js', JSON.parse(read('package.json')).main === 'index.js');
check('the task is registered with expo-notifications', read('lib/reminderBackgroundTask.ts').includes('Notifications.registerTaskAsync(REMINDER_ANSWER_TASK)'));
check('the desktop gets a stand-in task manager', read('metro.config.js').includes("'expo-task-manager': 'lib/desktop/unavailableModule.ts'"));

const sync = read('lib/snapshotSync.ts');
check('the timing row stays on this device', sync.includes("'reminder_timing_asked'"));
check('the saved presses stay on this device', sync.includes("'notification_answers'"));

const native = read('modules/reminder-timing/android/src/main/java/expo/modules/remindertiming/ReminderTimingModule.kt');
check('the native module reads exact alarms', native.includes('canScheduleExactAlarms'));
check('the native module reads battery', native.includes('isIgnoringBatteryOptimizations'));
check('the app asks for exact alarms in its manifest', read('app.json').includes('SCHEDULE_EXACT_ALARM'));

console.log(failures === 0 ? '\nAll reminder timing checks passed.' : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
