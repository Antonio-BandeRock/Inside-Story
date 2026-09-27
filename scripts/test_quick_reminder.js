// Checks lib/quickReminder.ts (C3 of the competitive build plan, Phase 2,
// 2026-09-26): the times offered under the Capture box, and the sentence
// said once one is picked. Pure, so it runs here. Exits non-zero on any
// failure.

// eslint-config-expo lints this repo as app code, which has no __dirname.
/* global __dirname */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function load(relPath, stubs = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    if (name in stubs) return stubs[name];
    throw new Error(`${relPath} must stay free of runtime imports (${name})`);
  });
  return module.exports;
}

const reconciliation = load('lib/reconciliation.ts');
const q = load('lib/quickReminder.ts', { './reconciliation': reconciliation });

let failures = 0;
let total = 0;
function check(name, actual, expected) {
  total += 1;
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    failures += 1;
    console.log(`FAIL  ${name}\n      expected ${e}\n      got      ${a}`);
  }
}

const afternoon = new Date(2026, 8, 26, 15, 4, 50);
const opts = q.quickReminderOptions(afternoon);
check('labels in the afternoon', opts.map((o) => o.label), ['In 10 minutes', 'In 20 minutes', 'In 40 minutes', 'In an hour', 'In 2 hours', 'This evening', 'Tomorrow morning']);
check('forty minutes is the laundry', opts[2].scheduledFor, '2026-09-26T15:44');
check('seconds dropped', opts[0].scheduledFor, '2026-09-26T15:14');
check('this evening is seven', opts[5].scheduledFor, '2026-09-26T19:00');
check('tomorrow morning is eight', opts[6].scheduledFor, '2026-09-27T08:00');

const late = new Date(2026, 8, 26, 23, 30);
const lateOpts = q.quickReminderOptions(late);
check('no evening once it is evening', lateOpts.some((o) => o.key === 'evening'), false);
check('two hours crosses midnight', lateOpts[4].scheduledFor, '2026-09-27T01:30');
check('every time is ahead', lateOpts.every((o) => o.scheduledFor > '2026-09-26T23:30'), true);

check('said today', q.describeQuickReminderSet('2026-09-26T15:44', afternoon).startsWith('The phone will say it at 3:44 PM today.'), true);
check('said tomorrow', q.describeQuickReminderSet('2026-09-27T08:00', afternoon).startsWith('The phone will say it at 8:00 AM tomorrow.'), true);
check('noon reads as PM', q.describeQuickReminderSet('2026-09-26T12:05', afternoon).includes('12:05 PM'), true);
check('midnight hour reads as AM', q.describeQuickReminderSet('2026-09-27T00:30', afternoon).includes('12:30 AM'), true);
check('bad input still says something', q.describeQuickReminderSet('nonsense', afternoon), 'Saved as a reminder.');

const FORBIDDEN = /\b(streak|great job|well done|failed|missed|lazy|real|genuine|genuinely)\b|[–—]| -- /i;
for (const line of [...opts.map((o) => o.label), q.describeQuickReminderSet('2026-09-26T15:44', afternoon)]) {
  check(`no verdict words: ${line}`, FORBIDDEN.test(line), false);
}

console.log(failures === 0 ? `All ${total} checks passed` : `\n${failures} of ${total} checks failed`);
process.exit(failures === 0 ? 0 : 1);
