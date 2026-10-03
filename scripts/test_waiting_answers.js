// Checks Waiting for an Answer (1.0.60.2, Home card 1.0.60.3, lib/waitingAnswers.ts): how the
// reminders still showing are grouped, that each reminder appears once
// however many copies of it are showing, that every row carries the buttons
// its notification carries, and the summary's words. Then reads the device
// side and the screen for the things that must stay true there.
//
// Pure, so it runs here rather than needing a phone. Exits non-zero on any
// failure.

// eslint-config-expo lints this repo as app code, which has no __dirname.
// This is a plain Node script run with node, so it does.
/* global __dirname */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function loadWithImports(relPath) {
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    if (!name.startsWith('.')) throw new Error(relPath + ' must stay free of runtime imports, found ' + name);
    return loadWithImports(path.join(path.dirname(relPath), name + '.ts'));
  });
  return module.exports;
}

const w = loadWithImports('lib/waitingAnswers.ts');
const actions = loadWithImports('lib/reminderActions.ts');

let failures = 0;
let checks = 0;
function check(label, condition) {
  checks += 1;
  if (!condition) {
    failures += 1;
    console.error('FAIL ' + label);
  }
}

const OURS = 'inside-story-reminder:';
const SNOOZE = 'inside-story-snooze:';
const ids = actions.REMINDER_CATEGORY_IDS;

function showing(identifier, kind, shownAt, categoryKey, title) {
  return {
    identifier,
    kind,
    shownAt,
    title: title || identifier,
    body: '',
    categoryIdentifier: categoryKey ? ids[categoryKey] : null,
  };
}

// --- Copies of one reminder are one row ---
check('a nudge belongs to its first reminder', w.baseReminderId(OURS + 'dose:7#nudge2', OURS, SNOOZE) === OURS + 'dose:7');
check('a snooze belongs to its first reminder', w.baseReminderId(SNOOZE + OURS + 'dose:7@1700', OURS, SNOOZE) === OURS + 'dose:7');
check('a snoozed nudge belongs to its first reminder', w.baseReminderId(SNOOZE + OURS + 'dose:7#nudge1@1700', OURS, SNOOZE) === OURS + 'dose:7');
check('a plain reminder is itself', w.baseReminderId(OURS + 'meal:3', OURS, SNOOZE) === OURS + 'meal:3');

const groups = w.groupWaiting(
  [
    showing(OURS + 'dose:7', 'dose', 1000, 'dose', 'Time for Levothyroxine'),
    showing(OURS + 'dose:7#nudge1', 'dose', 5000, 'dose', 'Still waiting: Levothyroxine'),
    showing(OURS + 'meal:3', 'meal', 2000, 'meal'),
    showing(OURS + 'morning:2026-10-03', 'morning', 3000, 'morning'),
    showing(OURS + 'hydration:1', 'hydration', 4000, 'hydration'),
    showing(OURS + 'dose:9', 'dose', 500, 'dose'),
    showing(OURS + 'bill:x:2026-10-03', 'bill', 600, 'plain'),
    showing(OURS + 'checkin:2026-10-03', 'checkin', 700, 'checkin'),
    showing(OURS + 'compost:p', 'compost', 800, 'compost'),
    showing(OURS + 'todo:t', 'todo', 900, 'task'),
    showing(OURS + 'upkeep:u', 'upkeep', 950, 'upkeep'),
  ],
  OURS,
  SNOOZE,
);

check('groups come in the fixed order', groups.map((g) => g.key).join(',') === 'morning,dose,meal,water,checkin,todo,garden,upkeep,other');
const doses = groups.find((g) => g.key === 'dose');
check('two doses, the nudge folded into its reminder', doses && doses.items.length === 2);
check('the oldest waiting dose comes first', doses && doses.items[0].identifier === OURS + 'dose:9');
const levo = doses && doses.items[1];
check('a reminder shows its newest copy', levo && levo.title === 'Still waiting: Levothyroxine');
check('every copy is kept so an answer takes all of them away', levo && levo.copies.length === 2 && levo.copies[0] === OURS + 'dose:7#nudge1');
check('how long it waited counts from the first copy', levo && levo.shownAt === 1000);
check('eleven notifications, ten reminders', w.countWaiting(groups) === 10);

// --- Every row carries the buttons its notification carries ---
for (const key of actions.ALL_REMINDER_CATEGORY_KEYS) {
  const got = w.actionsForCategory(ids[key]).join(',');
  check('buttons for ' + key, got === actions.CATEGORY_ACTIONS[key].join(','));
}
check('an unknown set falls back to Snooze', w.actionsForCategory('something-old').join(',') === 'snooze');
check('no set gives Snooze alone', w.actionsForCategory(null).join(',') === 'snooze');
check('the morning row has the three sleep words', groups[0].items[0].actions.join(',') === 'sleptPoorly,sleptOkay,sleptWell');
check('Add a note takes words', w.actionTakesWords('howAreYou'));
check('Log a flare takes words', w.actionTakesWords('logFlare'));
check('Taken takes no words', !w.actionTakesWords('taken'));

// --- Groups ---
const expected = {
  dose: 'dose', refill: 'dose', meal: 'meal', hydration: 'water', checkin: 'checkin', afterMeal: 'checkin',
  reminder: 'todo', check: 'todo', todo: 'todo', routine: 'todo', garden: 'garden', compost: 'garden',
  cropPrep: 'garden', cropSow: 'garden', upkeep: 'upkeep', morning: 'morning', appointment: 'other', bill: 'other', '': 'other',
};
for (const [kind, key] of Object.entries(expected)) check('group for ' + (kind || 'no kind'), w.waitingGroupFor(kind) === key);

// --- Summary ---
check('the summary starts at two', w.SUMMARY_FROM === 2);
check('the summary counts', w.summaryTitle(4) === '4 reminders waiting for an answer');
const twoGroups = w.groupWaiting(
  [showing(OURS + 'dose:1', 'dose', 1, 'dose'), showing(OURS + 'dose:2', 'dose', 2, 'dose'), showing(OURS + 'meal:1', 'meal', 3, 'meal')],
  OURS,
  SNOOZE,
);
check('the summary names each group', w.summaryBody(twoGroups) === 'Tap to answer them in one list. Doses: 2, Meals: 1');

// --- Waiting for, in words ---
check('just now', w.waitingFor(1000, 30_000) === 'Just now');
check('one minute', w.waitingFor(0, 60_000) === '1 minute ago');
check('minutes', w.waitingFor(0, 25 * 60_000) === '25 minutes ago');
check('hours', w.waitingFor(0, 3 * 3_600_000) === '3 hours ago');
check('yesterday', w.waitingFor(0, 30 * 3_600_000) === 'Yesterday');
check('a clock behind never goes negative', w.waitingFor(10_000, 0) === 'Just now');

// --- The device side and the screen ---
const device = fs.readFileSync(path.join(__dirname, '..', 'lib', 'reminderNotifications.ts'), 'utf8');
check('the summary is outside both reminder prefixes', /WAITING_SUMMARY_ID = 'inside-story-waiting-summary'/.test(device));
check('a tap on the summary opens the list', device.includes("request?.identifier === WAITING_SUMMARY_ID) return { pathname: '/waiting-answers' }"));
check('the summary is never a banner', device.includes('shouldShowBanner: !summary'));
check('the summary has a quiet channel', /ANDROID_WAITING_CHANNEL_ID[\s\S]{0,200}AndroidImportance\.LOW/.test(device));
check('the summary is not shown again when nothing changed', device.includes('showing.request.content.title === title && showing.request.content.body === body'));
check('a press from the list goes through the same answer', /export async function answerFromList[\s\S]*?await answerPress\(response\)/.test(device));
check('every press brings the summary up to date', (device.match(/await refreshWaitingSummary\(\);/g) || []).length >= 4);
check('a reminder arriving while open brings the summary up to date', device.includes('addNotificationReceivedListener'));
check('the reconcile brings the summary up to date', /await refreshWaitingSummary\(\);\s*return \{ permission: 'granted', pending: scheduled \}/.test(device));

const screen = fs.readFileSync(path.join(__dirname, '..', 'app', 'waiting-answers.tsx'), 'utf8');
const list = fs.readFileSync(path.join(__dirname, '..', 'components', 'WaitingAnswersList.tsx'), 'utf8');
const hook = fs.readFileSync(path.join(__dirname, '..', 'hooks', 'useWaitingReminders.ts'), 'utf8');
check('the list answers through answerFromList', list.includes('answerFromList(item.copies, action, text)'));
check('the list uses the notification button words', list.includes('reminderActionTitle(action, SNOOZE_MINUTES)'));
check('a note with no words cannot be saved', list.includes("box.action === 'howAreYou' && !words.trim()"));
check('the list is read again on focus', hook.includes('useFocusEffect'));
check('the list is read again when a reminder arrives', hook.includes('addNotificationReceivedListener'));
check('the screen draws the shared list', screen.includes('<WaitingAnswersList'));
check('the screen says where the list is on a computer', screen.includes('Reminders show up on your phone'));

const layout = fs.readFileSync(path.join(__dirname, '..', 'app', '_layout.tsx'), 'utf8');
check('the screen is registered', layout.includes('name="waiting-answers"'));
const profile = fs.readFileSync(path.join(__dirname, '..', 'app', 'profile.tsx'), 'utf8');
check('Profile no longer opens the list', !profile.includes("router.push('/waiting-answers')"));
const home = fs.readFileSync(path.join(__dirname, '..', 'app', '(tabs)', 'index.tsx'), 'utf8');
check('Home draws the list', home.includes('<WaitingAnswersList') && home.includes("case 'waitingAnswers':"));
check('Home draws it only while something waits', /const count = countWaiting\(groups\);\s*if \(count === 0\) return null;/.test(home));
const prefs = fs.readFileSync(path.join(__dirname, '..', 'lib', 'visualPreferences.ts'), 'utf8');
check('the card is first after the weather', /ALL_HOME_SECTION_KEYS: HomeSectionKey\[\] = \[\s*'weather',[\s\S]*?'waitingAnswers',\s*'sharedFolderSetup'/.test(prefs));

console.log(failures === 0 ? 'All ' + checks + ' checks passed.' : failures + ' of ' + checks + ' checks failed.');
process.exit(failures === 0 ? 0 : 1);
