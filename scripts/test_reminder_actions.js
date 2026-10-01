// Checks the buttons on a reminder (C1, lib/reminderActions.ts): which set
// each kind carries, that Android's three-button limit holds, what each
// press writes, and when the two check-in reminders ask.
//
// Pure, so it runs here rather than needing a phone. Exits non-zero on any
// failure.

// eslint-config-expo lints this repo as app code, which has no __dirname.
// This is a plain Node script run with node, so it does.
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
  new Function('exports', 'module', 'require', outputText)(module.exports, module, () => {
    throw new Error('lib/reminderActions.ts must stay free of runtime imports');
  });
  return module.exports;
}

// The scale modules import each other, so they get a loader that follows
// relative imports.
function loadWithImports(relPath) {
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) =>
    name.startsWith('.') ? loadWithImports(path.join(path.dirname(relPath), name + '.ts')) : {},
  );
  return module.exports;
}

const {
  MORNING_BUTTON_VALUES,
  MORNING_ENERGY_TITLE,
  MORNING_ENERGY_BODY,
  ACTION_TEXT_INPUT,
  ALL_REMINDER_CATEGORY_KEYS,
  CATEGORY_ACTIONS,
  answerLine,
  REMINDER_CATEGORY_IDS,
  categoryKeyFor,
  planReminderAction,
  planAfterMealNudge,
  planDailyCheckins,
  reminderActionTitle,
} = load('lib/reminderActions.ts');

let failures = 0;
function check(label, ok) {
  if (ok) return;
  failures += 1;
  console.error('FAIL', label);
}

// Every set fits Android's three buttons and ends with Snooze, except the
// two morning questions, whose three buttons are all answers (2026-10-01:
// a question on a notification must be answerable on it).
const ALL_ANSWERS = ['morning', 'energy'];
for (const key of ALL_REMINDER_CATEGORY_KEYS) {
  const actions = CATEGORY_ACTIONS[key];
  check(`${key} has at most three buttons`, actions.length <= 3);
  if (ALL_ANSWERS.includes(key)) continue;
  check(`${key} keeps Snooze`, actions[actions.length - 1] === 'snooze');
}

// The morning buttons say the scale's words for what they save.
const { SLEEP_QUALITY_WORDS } = loadWithImports('lib/morningCheckin.ts');
const { scaleOf } = loadWithImports('lib/dailyScales.ts');
const energyWords = scaleOf('energy').words;
for (const action of CATEGORY_ACTIONS.morning) {
  const value = MORNING_BUTTON_VALUES[action];
  check(`${action} title is the sleep word it saves`, reminderActionTitle(action, 15) === SLEEP_QUALITY_WORDS[value - 1]);
  const plan = planReminderAction('morning', action);
  check(`${action} saves sleep ${value}`, plan && plan.write === 'sleepQuality' && plan.value === value);
}
for (const action of CATEGORY_ACTIONS.energy) {
  const value = MORNING_BUTTON_VALUES[action];
  check(`${action} title is the energy word it saves`, reminderActionTitle(action, 15) === energyWords[value - 1]);
  const plan = planReminderAction('morning', action);
  check(`${action} saves energy ${value}`, plan && plan.write === 'morningEnergy' && plan.value === value);
}
check('a sleep button on a dose does nothing', planReminderAction('dose', 'sleptWell') === null);
check('the energy question says what a press does', MORNING_ENERGY_TITLE.endsWith('?') && MORNING_ENERGY_BODY.length > 0);

// Every reminder that asks something opens where it is answered on a tap.
const notifier = fs.readFileSync(path.join(__dirname, '..', 'lib', 'reminderNotifications.ts'), 'utf8');
check('the morning tap opens the check-in', notifier.includes("data?.kind === 'morning') return { pathname: '/daily-checkin' }"));
check('Your week opens on its card', notifier.includes("openHomeSection: 'yourWeek'"));
check('no reminder opens bare Home', !/return \{ pathname: '\/' \}/.test(notifier));
check('plain keeps the old category id', REMINDER_CATEGORY_IDS.plain === 'inside-story-reminder');
check('category ids are distinct', new Set(Object.values(REMINDER_CATEGORY_IDS)).size === ALL_REMINDER_CATEGORY_KEYS.length);

// Which kinds get which set.
const expected = {
  dose: 'dose',
  hydration: 'hydration',
  meal: 'meal',
  garden: 'task',
  reminder: 'task',
  upkeep: 'upkeep',
  compost: 'compost',
  checkin: 'checkin',
  afterMeal: 'checkin',
  appointment: 'plain',
  bill: 'plain',
  benefit: 'plain',
  countdown: 'plain',
  routine: 'plain',
  check: 'task',
  morning: 'morning',
};
for (const [kind, key] of Object.entries(expected)) check(`${kind} -> ${key}`, categoryKeyFor(kind) === key);
check('upkeep that expires gets Snooze only', categoryKeyFor('upkeep', false) === 'plain');

// Every button a kind carries has a plan, and every plan pairs with its own kind.
for (const [kind, key] of Object.entries(expected)) {
  for (const action of CATEGORY_ACTIONS[key]) {
    if (action === 'snooze') continue;
    check(`${kind} ${action} has a plan`, planReminderAction(kind, action) !== null);
  }
}
check('Taken on a bill does nothing', planReminderAction('bill', 'taken') === null);
check('Turned it on a dose does nothing', planReminderAction('dose', 'turned') === null);
check('a plain tap does nothing', planReminderAction('dose', 'expo.modules.notifications.actions.DEFAULT') === null);
check('dose writes logged', planReminderAction('dose', 'taken').status === 'logged');
check('a Did I Do It check writes its mark (C2)', planReminderAction('check', 'done').write === 'checkMarked');
check('garden writes completed', planReminderAction('garden', 'done').status === 'completed');
check('Add a note writes a check-in note', planReminderAction('checkin', 'howAreYou').write === 'checkinNote');
check('Log a flare writes a flare', planReminderAction('afterMeal', 'logFlare').write === 'flare');
check('both check-in buttons take words', !!ACTION_TEXT_INPUT.howAreYou && !!ACTION_TEXT_INPUT.logFlare);
check('Taken does not take words', !ACTION_TEXT_INPUT.taken);

// Each reminder says what its buttons record; a plain one has none to say.
for (const kind of ['dose', 'hydration', 'meal', 'garden', 'reminder', 'check', 'upkeep', 'compost', 'checkin', 'afterMeal', 'morning']) {
  check(`${kind} says what its buttons do`, typeof answerLine(kind) === 'string' && answerLine(kind).length > 0);
}
check('a bill says nothing about buttons', answerLine('bill') === null);
check('an upkeep that cannot be marked says nothing', answerLine('upkeep', false) === null);

// The words a reminder carries, checked for praise, dashes and filler.
const said = [];
for (const [id, input] of Object.entries(ACTION_TEXT_INPUT)) said.push(input.placeholder, input.submitButtonTitle, id);
for (const kind of ['dose', 'hydration', 'meal', 'garden', 'reminder', 'upkeep', 'compost', 'checkin']) said.push(answerLine(kind));
const sentenceForbidden = /well done|good job|keep it up|great|you should|real|genuine|own|[—–]| -- /i;
for (const line of said) check(`"${line}" has no praise, dashes or filler`, typeof line === 'string' && !sentenceForbidden.test(line));

// Button wording follows the app's writing rules.
const titles = ALL_REMINDER_CATEGORY_KEYS.flatMap((key) => CATEGORY_ACTIONS[key]).map((a) => reminderActionTitle(a, 15));
check('snooze names its minutes', titles.includes('Snooze 15 min'));
const forbidden = /well done|good job|keep it up|great|you should|—|–/i;
for (const title of titles) check(`title "${title}" has no praise or dashes`, !forbidden.test(title));

// After-meal: only the latest meal, not a drink, not once checked in.
const now = new Date(2026, 8, 26, 13, 0);
const meals = [
  { id: 'a', name: 'Coffee', mealType: 'beverage', eatenAt: '2026-09-26T12:50' },
  { id: 'b', name: 'Lunch', mealType: 'lunch', eatenAt: '2026-09-26T12:00' },
  { id: 'c', name: 'Snack', mealType: 'snack', eatenAt: '2026-09-26T11:10' },
];
const nudge = planAfterMealNudge(meals, null, now);
check('latest non-drink meal asks', nudge && nudge.meal.id === 'b');
check('two hours after eating', nudge && nudge.fireAt.getHours() === 14 && nudge.fireAt.getMinutes() === 0);
check('a check-in since eating stops it', planAfterMealNudge(meals, '2026-09-26T12:30', now) === null);
check('a check-in before eating does not', planAfterMealNudge(meals, '2026-09-26T09:00', now) !== null);
check('a drink alone asks nothing', planAfterMealNudge([meals[0]], null, now) === null);
check('over two hours ago asks nothing', planAfterMealNudge([meals[2]], null, new Date(2026, 8, 26, 13, 20)) === null);
check('a meal dated ahead asks nothing', planAfterMealNudge([{ ...meals[1], eatenAt: '2026-09-26T18:00' }], null, now) === null);

// Daily check-in.
const evening = planDailyCheckins('20:00', now, 6, false);
check('seven evenings from today', evening.length === 7 && evening[0].getDate() === 26 && evening[0].getHours() === 20);
check('today skipped once checked in', planDailyCheckins('20:00', now, 6, true)[0].getDate() === 27);
check('a time already passed today starts tomorrow', planDailyCheckins('09:00', now, 6, false)[0].getDate() === 27);
check('a bad time plans nothing', planDailyCheckins('25:00', now, 6, false).length === 0);

if (failures) {
  console.error(`${failures} failure(s)`);
  process.exit(1);
}
console.log('test_reminder_actions: all checks passed');
