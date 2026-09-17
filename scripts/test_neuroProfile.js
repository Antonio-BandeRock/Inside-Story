// Checks the autism, ADHD and dyslexia rules (lib/neuroProfile.ts): which
// settings each one asks for, what happens when two of them ask for the
// same setting, and that nothing stored on disk can come back as a key the
// app cannot render. Pure, so it runs here rather than needing a phone.
//
// The one thing worth saying out loud, because it is the whole point of the
// file being shaped this way: none of these three touches food scoring, and
// no test below asserts that it does. If a future change makes one of them
// reach the scoring engine, this file will not catch it, but the comment on
// user_neuro_profile in lib/db.ts says why it must not.
//
// Exits non-zero on any failure.

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
    throw new Error('lib/neuroProfile.ts must stay free of runtime imports');
  });
  return module.exports;
}

const {
  ALL_NEURO_PROFILE_KEYS,
  ALL_NEURO_SUPPORT_KEYS,
  NEURO_PROFILE_CAPTIONS,
  NEURO_PROFILE_LABELS,
  NEURO_SUPPORT_DETAILS,
  NEURO_SUPPORT_LABELS,
  NEURO_SUPPORT_REMINDER_KINDS,
  describeProfiles,
  describeTurnedOn,
  isNeuroProfileKey,
  normalizeNeuroProfileKeys,
  profilesAsking,
  supportsFor,
} = load('lib/neuroProfile.ts');

let checks = 0;
let failures = 0;

function check(name, actual, expected) {
  checks += 1;
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    failures += 1;
    console.error(`FAIL  ${name}\n        expected ${e}\n        got      ${a}`);
  }
}

// ------------------------------------------------------------ what each one asks for

check('autism asks for a quieter screen, somewhere to put a thought, and routines', supportsFor(['autism']), [
  'captureInbox',
  'routineReminders',
  'lowStimulation',
]);
check('ADHD asks for everything that carries a date, and not for a quieter screen', supportsFor(['adhd']), [
  'captureInbox',
  'routineReminders',
  'noteReminders',
  'datedReminders',
]);
check('dyslexia asks for the text and nothing else', supportsFor(['dyslexia']), ['roomyText']);
check('nothing listed asks for nothing', supportsFor([]), []);

// The union, not a concatenation: both ask for the capture inbox and it
// appears once.
check('two of them asking for the same thing name it once', supportsFor(['autism', 'adhd']), [
  'captureInbox',
  'routineReminders',
  'noteReminders',
  'datedReminders',
  'lowStimulation',
]);
check(
  'all three together reach every setting there is',
  supportsFor(['autism', 'adhd', 'dyslexia']).length,
  ALL_NEURO_SUPPORT_KEYS.length,
);

// Order is the listed order, not the tapping order, so the same three
// always read the same way.
check(
  'the order does not depend on which pill was tapped first',
  supportsFor(['dyslexia', 'adhd', 'autism']),
  supportsFor(['autism', 'adhd', 'dyslexia']),
);

// ------------------------------------------------------------ who asked

check('both of them asked for the inbox', profilesAsking('captureInbox', ['autism', 'adhd']), [
  'autism',
  'adhd',
]);
check('only autism asked for the quieter screen', profilesAsking('lowStimulation', ['autism', 'adhd']), [
  'autism',
]);
check('nobody listed asked for anything', profilesAsking('captureInbox', []), []);
check(
  'somebody who did not list it is not credited with asking',
  profilesAsking('roomyText', ['autism', 'adhd']),
  [],
);

// ------------------------------------------------------------ the wording

check('one reads as itself', describeProfiles(['autism']), 'Autism');
check('two get an and', describeProfiles(['autism', 'adhd']), 'Autism and ADHD');
check(
  'three get commas and an and',
  describeProfiles(['autism', 'adhd', 'dyslexia']),
  'Autism, ADHD and Dyslexia',
);
check('none says nothing at all', describeProfiles([]), '');
check(
  'and the listing order is fixed there too',
  describeProfiles(['dyslexia', 'autism']),
  'Autism and Dyslexia',
);

check('nothing turned on says nothing', describeTurnedOn([]), '');
check(
  'what was turned on is named, and so is the way back',
  describeTurnedOn(['captureInbox', 'roomyText']),
  'Turned on: Somewhere to put a thought and Roomier line spacing. Each one can be switched back off wherever it lives.',
);

// ------------------------------------------------------------ what comes back off disk

check('a known key is a key', isNeuroProfileKey('adhd'), true);
check('a made-up one is not', isNeuroProfileKey('dyspraxia'), false);
check('and neither is the label', isNeuroProfileKey('ADHD'), false);

check('rows come back in the listed order', normalizeNeuroProfileKeys(['dyslexia', 'autism']), [
  'autism',
  'dyslexia',
]);
check(
  'a key written by a later version of the app is dropped, not carried',
  normalizeNeuroProfileKeys(['autism', 'something_new']),
  ['autism'],
);
check('capitalization and space do not make a second person', normalizeNeuroProfileKeys([' ADHD ']), [
  'adhd',
]);
check('the same one twice is still one', normalizeNeuroProfileKeys(['adhd', 'adhd']), ['adhd']);
check('an empty table is nobody', normalizeNeuroProfileKeys([]), []);

// ------------------------------------------------------------ nothing goes unnamed

check('three are listed', ALL_NEURO_PROFILE_KEYS.length, 3);
check('six settings are listed', ALL_NEURO_SUPPORT_KEYS.length, 6);

for (const key of ALL_NEURO_PROFILE_KEYS) {
  check(`${key} has a label`, (NEURO_PROFILE_LABELS[key] ?? '').length > 0, true);
  check(`${key} says what it turns on`, (NEURO_PROFILE_CAPTIONS[key] ?? '').length > 0, true);
  check(`${key} turns something on`, supportsFor([key]).length > 0, true);
}

for (const support of ALL_NEURO_SUPPORT_KEYS) {
  check(`${support} has a label`, (NEURO_SUPPORT_LABELS[support] ?? '').length > 0, true);
  check(`${support} says what it does`, (NEURO_SUPPORT_DETAILS[support] ?? '').length > 0, true);
  check(
    `${support} is asked for by somebody`,
    ALL_NEURO_PROFILE_KEYS.some((key) => supportsFor([key]).includes(support)),
    true,
  );
}

// Every reminder setting names at least one kind, and nothing that is not a
// reminder names any, so a typo in the wiring reads as undefined here rather
// than as a switch that silently turns nothing on.
const REMINDER_SUPPORTS = ['routineReminders', 'noteReminders', 'datedReminders'];
for (const support of ALL_NEURO_SUPPORT_KEYS) {
  const kinds = NEURO_SUPPORT_REMINDER_KINDS[support];
  if (REMINDER_SUPPORTS.includes(support)) {
    check(`${support} names the kinds it switches on`, Array.isArray(kinds) && kinds.length > 0, true);
  } else {
    check(`${support} is not a reminder and names none`, kinds, undefined);
  }
}

check('no two settings switch on the same reminder kind', (() => {
  const seen = new Set();
  for (const support of REMINDER_SUPPORTS) {
    for (const kind of NEURO_SUPPORT_REMINDER_KINDS[support]) {
      if (seen.has(kind)) return kind;
      seen.add(kind);
    }
  }
  return null;
})(), null);

if (failures > 0) {
  console.error(`\n${failures} of ${checks} checks failed`);
  process.exit(1);
}
console.log(`All ${checks} checks passed`);
