// Checks lib/welcomeBack.ts (C16 of the competitive build plan, Phase 2,
// 2026-09-26): all three stamp shapes read correctly, days are counted by
// the local calendar, the line appears only after a gap, and neither it nor
// the One Next Thing card counts, blames or praises. Exits non-zero on any
// failure.

// eslint-config-expo lints this repo as app code, which has no __dirname.
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
    throw new Error(`${relPath} must stay free of runtime imports (${name})`);
  });
  return module.exports;
}

const w = load('lib/welcomeBack.ts');

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

const local = (y, m, d, h = 12, min = 0) => new Date(y, m - 1, d, h, min).getTime();

check('ISO stamp', w.parseRecordStamp('2026-09-26T14:05:00.000Z'), Date.parse('2026-09-26T14:05:00.000Z'));
check('SQLite stamp is UTC', w.parseRecordStamp('2026-09-26 14:05:00'), Date.parse('2026-09-26T14:05:00Z'));
check('bare date is a local day', w.parseRecordStamp('2026-09-26'), local(2026, 9, 26));
check('nothing', w.parseRecordStamp(null), null);
check('rubbish', w.parseRecordStamp('soon'), null);
check('latest of mixed shapes', w.latestStamp(['2026-09-20', null, '2026-09-24 08:00:00', 'soon']), Date.parse('2026-09-24T08:00:00Z'));
check('latest of none', w.latestStamp([]), null);

check('late night to early morning is one day', w.calendarDaysBetween(local(2026, 9, 25, 23, 30), local(2026, 9, 26, 1, 0)), 1);
check('same day', w.calendarDaysBetween(local(2026, 9, 26, 0, 5), local(2026, 9, 26, 23, 55)), 0);
check('across a month', w.calendarDaysBetween(local(2026, 8, 30), local(2026, 9, 2)), 3);

const now = local(2026, 9, 26, 9, 0);
check('no records, no line', w.welcomeBackFor(null, now), null);
check('yesterday, no line', w.welcomeBackFor(local(2026, 9, 25), now), null);
check('two days, no line', w.welcomeBackFor(local(2026, 9, 24), now), null);
check('three days, the line', w.welcomeBackFor(local(2026, 9, 23), now)?.sentence.includes('3 days ago'), true);
check('weeks', w.welcomeBackFor(local(2026, 9, 5), now)?.sentence.includes('3 weeks ago'), true);
check('a long time', w.welcomeBackFor(local(2026, 5, 1), now)?.sentence.includes('a while back'), true);
check('a future stamp says nothing', w.welcomeBackFor(local(2026, 10, 3), now), null);

const FORBIDDEN = /\b(streak|missed|behind|catch up|failed|lazy|should have|welcome back!|great|well done|good job|real|genuine|genuinely|score|must|forgot)\b|%|!|[–—]| -- /i;
const shown = [];
for (const days of [3, 9, 20, 200]) {
  const line = w.welcomeBackFor(now - days * 86_400_000, now);
  shown.push(line.sentence, line.action);
}
const card = ts.createSourceFile(
  'NextThing.tsx',
  fs.readFileSync(path.join(__dirname, '..', 'components/NextThing.tsx'), 'utf8'),
  ts.ScriptTarget.ES2020,
  true,
  ts.ScriptKind.TSX,
);
(function walk(node) {
  let text = null;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) text = node.text;
  else if (ts.isJsxText(node)) text = node.text.trim();
  if (text && /[A-Za-z]+ [a-z]/.test(text)) shown.push(text);
  ts.forEachChild(node, walk);
})(card);
check('found the card sentences', shown.length > 9, true);
for (const line of shown) check(`no verdict words: ${line}`, FORBIDDEN.test(line), false);

console.log(failures === 0 ? `All ${total} checks passed` : `\n${failures} of ${total} checks failed`);
process.exit(failures === 0 ? 0 : 1);
