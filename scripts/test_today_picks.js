// Checks lib/todayPicks.ts (C15 of the competitive build plan, Phase 2,
// 2026-09-26): a mark counts on the LOCAL day it was made, the day holds a
// few picks and no more, and nothing the card says is a tally or a verdict.
// Exits non-zero on any failure.

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

const t = load('lib/todayPicks.ts');

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

// Local stamps built from local parts, so the checks hold in any time zone.
function at(y, m, d, h, min) {
  return new Date(y, m - 1, d, h, min).toISOString();
}

check('local day of a late evening mark', t.localDayOf(at(2026, 9, 26, 23, 30)), '2026-09-26');
check('local day of an early mark', t.localDayOf(at(2026, 9, 26, 0, 10)), '2026-09-26');
check('no stamp', t.localDayOf(null), null);
check('bad stamp', t.localDayOf('not a date'), null);
check('day key', t.localDayKey(new Date(2026, 8, 26, 18, 0)), '2026-09-26');

const marks = [at(2026, 9, 25, 22, 0), at(2026, 9, 26, 8, 15), at(2026, 9, 26, 21, 45), at(2026, 9, 27, 0, 5)];
check('latest mark on the day', t.latestMarkOnDay(marks, '2026-09-26'), at(2026, 9, 26, 21, 45));
check('a mark from yesterday does not count today', t.latestMarkOnDay([at(2026, 9, 25, 23, 59)], '2026-09-26'), null);
check('nothing marked', t.latestMarkOnDay([], '2026-09-26'), null);

check('undone pick says nothing', t.describeTodayPick({ checkId: 'a', name: 'Walk', doneAt: null }), null);
check('done pick gives the time', t.describeTodayPick({ checkId: 'a', name: 'Walk', doneAt: at(2026, 9, 26, 14, 5) }), 'Done at 2:05 PM');
check('midnight reads as 12', t.describeTodayPick({ checkId: 'a', name: 'Walk', doneAt: at(2026, 9, 26, 0, 30) }), 'Done at 12:30 AM');
check('noon reads as 12 PM', t.describeTodayPick({ checkId: 'a', name: 'Walk', doneAt: at(2026, 9, 26, 12, 0) }), 'Done at 12:00 PM');

check('a few, not a list', t.MAX_TODAY_PICKS, 5);
check('room at four', t.canPickMore(4), true);
check('full at five', t.canPickMore(5), false);

const FORBIDDEN = /\b(streak|great job|well done|good job|failed|missed|behind|lazy|should have|real|genuine|genuinely|score|must|left undone|out of|progress)\b|%|[–—]| -- /i;
// Every string and JSX text run in the card, read through the TypeScript
// parser so comments never count.
const component = ts.createSourceFile(
  'TodayPicks.tsx',
  fs.readFileSync(path.join(__dirname, '..', 'components/TodayPicks.tsx'), 'utf8'),
  ts.ScriptTarget.ES2020,
  true,
  ts.ScriptKind.TSX,
);
const shown = [t.TODAY_PICKS_EMPTY];
(function walk(node) {
  let text = null;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) text = node.text;
  else if (ts.isTemplateExpression(node)) text = node.getText().slice(1, -1);
  else if (ts.isJsxText(node)) text = node.text.trim();
  if (text && /[A-Za-z]+ [a-z]/.test(text)) shown.push(text);
  ts.forEachChild(node, walk);
})(component);
check('found the card sentences', shown.length > 6, true);
for (const line of shown) check(`no verdict words: ${line}`, FORBIDDEN.test(line), false);

console.log(failures === 0 ? `All ${total} checks passed` : `\n${failures} of ${total} checks failed`);
process.exit(failures === 0 ? 0 : 1);
