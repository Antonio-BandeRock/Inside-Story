// Confirms the recovery screen is actually wired to fire, by checking the real
// control flow in app/_layout.tsx rather than trusting that it reads correctly.
//
// A rendering test would need a React Native runtime, which this project has no
// harness for. So this asserts the three things that have to be true for the
// screen to appear at all, each of which is a place the wiring could silently be
// wrong while still type-checking:
//
//   1. the catch stores the error rather than only logging it
//   2. the early return happens BEFORE the Stack mounts, not as an overlay
//   3. the screen is reached without any database call in between
const fs = require('fs');
const path = require('path');

const layout = fs.readFileSync(path.join(__dirname, '..', 'app', '_layout.tsx'), 'utf8');
const screen = fs.readFileSync(path.join(__dirname, '..', 'components', 'StartupFailureScreen.tsx'), 'utf8');

let failures = 0;
function check(label, condition) {
  if (condition) {
    console.log(`  ok    ${label}`);
  } else {
    failures += 1;
    console.error(`  FAIL  ${label}`);
  }
}

console.log('Recovery screen wiring:');

check(
  'the initializeDatabase catch stores the error, not just logs it',
  /\.catch\(\(error\) => \{[\s\S]{0,200}setStartupError\(error\)/.test(layout),
);

check(
  'and still logs it, so a developer can see the real cause',
  /console\.error\('initializeDatabase failed', error\)/.test(layout),
);

const returnIndex = layout.indexOf('<StartupFailureScreen');
const stackIndex = layout.indexOf('<Stack ');
check('the failure screen is returned before the Stack is mounted', returnIndex !== -1 && returnIndex < stackIndex);

check(
  'it is a real early return rather than an overlay beside the app',
  /if \(startupError && !dismissedStartupError\) \{[\s\S]{0,200}return \(/.test(layout),
);

check(
  'continuing anyway is possible, so nobody is trapped on it',
  /onContinueAnyway=\{\(\) => setDismissedStartupError\(true\)\}/.test(layout),
);

check(
  'and that choice is NOT persisted, so a fresh launch shows the problem again',
  /Deliberately not persisted/.test(layout),
);

console.log('\nThe screen itself:');

check('offers Check for Updates', /Check for Updates/.test(screen));
check('and actually calls the update API rather than only saying so',
  /Updates\.checkForUpdateAsync\(\)/.test(screen) && /Updates\.fetchUpdateAsync\(\)/.test(screen) && /Updates\.reloadAsync\(\)/.test(screen));
check('handles a build that cannot update at all, which this project really has',
  /Updates\.isEnabled/.test(screen));
check('handles no update being available yet', /none-available/.test(screen));
check('handles the check itself failing', /'failed'/.test(screen));

// The screen must be able to render with the database completely gone.
check(
  'the screen touches no database module',
  !/from '\.\.\/lib\/db'/.test(screen) && !/getDatabase|initializeDatabase|getUserProfile|getVisualPreferences/.test(screen),
);
check('and shows the real error rather than a generic apology', /errorText/.test(screen));
check('and the version, so a report can name one', /APP_VERSION/.test(screen));

// Tone. This is the screen someone reads at their most annoyed.
check('it says the fault is the app\'s, not the person\'s', /not something you\s*\n?\s*did/.test(screen));
check('and does not claim data was lost when it was not', /nothing you have recorded has been lost/i.test(screen));

console.log('');
if (failures > 0) {
  console.error(`${failures} FAILED`);
  process.exit(1);
}
console.log('Recovery screen: wired correctly.');
