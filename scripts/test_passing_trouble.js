// Checks lib/passingTrouble.ts: passing trouble waits an hour, anything else speaks at once.
const fs = require('fs');
const ts = require('typescript');
const source = fs.readFileSync(require.resolve('../lib/passingTrouble.ts'), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 } });
const t = {};
new Function('exports', outputText)(t);
let failed = 0;
function check(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { failed++; console.log('FAIL', name, 'got', JSON.stringify(got), 'want', JSON.stringify(want)); }
}
const busy = t.ONEDRIVE_BUSY_LEAD + ' (503). Sync tries again by itself.';
const offline = 'OneDrive could not be reached. Check the connection and try again.';
const signIn = 'Microsoft could not be reached. Check the connection and try again.';
const hiccup = 'OneDrive did not accept this phone’s sign-in. This is sometimes on Microsoft’s side and clears within a few minutes.';
const moved = 'The item could not be found.';
const HOUR = t.PASSING_TROUBLE_HOLD_MS;
for (const r of [busy, offline, signIn, hiccup]) check('passing: ' + r.slice(0, 30), t.isPassingTrouble(r), true);
check('a moved folder is not passing', t.isPassingTrouble(moved), false);
check('first 503 is quiet and starts the clock', t.decideTrouble(null, busy, 1000), { speak: false, since: 1000 });
check('59 minutes on is still quiet', t.decideTrouble(1000, busy, 1000 + HOUR - 60000), { speak: false, since: 1000 });
const late = t.decideTrouble(1000, busy, 1000 + HOUR);
check('an hour on speaks', late.speak, true);
check('and says it has gone on', late.sentence.startsWith('This has been going on for more than an hour.'), true);
check('a different passing kind keeps the same clock', t.decideTrouble(1000, offline, 2000), { speak: false, since: 1000 });
check('anything else speaks at once and leaves the clock', t.decideTrouble(1000, moved, 2000), { speak: true, since: 1000, sentence: moved });
check('anything else with no clock', t.decideTrouble(null, moved, 2000), { speak: true, since: null, sentence: moved });
if (failed) { console.log(failed + ' failed'); process.exit(1); }
console.log('All passing-trouble checks passed');
