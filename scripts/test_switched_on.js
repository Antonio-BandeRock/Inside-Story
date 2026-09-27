// Checks the "What your answers switched on" lines in lib/yourStoryInterview.ts
// (C19 of the competitive build plan, Phase 2, 2026-09-26): every kind of
// interview question has a case, and no line is a count, a verdict or advice.
// The module imports the rest of Your Story, so it is read through the
// TypeScript parser rather than run. Exits non-zero on any failure.

// eslint-config-expo lints this repo as app code, which has no __dirname.
/* global __dirname */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

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

const file = ts.createSourceFile(
  'yourStoryInterview.ts',
  fs.readFileSync(path.join(__dirname, '..', 'lib/yourStoryInterview.ts'), 'utf8'),
  ts.ScriptTarget.ES2020,
  true,
  ts.ScriptKind.TS,
);

let kinds = [];
let fn = null;
let heading = null;
(function find(node) {
  if (ts.isTypeAliasDeclaration(node) && node.name.text === 'InterviewKind' && ts.isUnionTypeNode(node.type)) {
    kinds = node.type.types.filter(ts.isLiteralTypeNode).map((t) => t.literal.text);
  }
  if (ts.isFunctionDeclaration(node) && node.name?.text === 'switchedOnLine') fn = node;
  if (ts.isVariableDeclaration(node) && node.name.getText() === 'SWITCHED_ON_HEADING') heading = node.initializer.text;
  ts.forEachChild(node, find);
})(file);

check('found the question kinds', kinds.length >= 10, true);
check('found the line builder', fn !== null, true);
check('heading', heading, 'What your answers switched on');

const cases = [];
const shown = [];
(function walk(node) {
  if (ts.isCaseClause(node) && ts.isStringLiteral(node.expression)) cases.push(node.expression.text);
  let text = null;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) text = node.text;
  else if (ts.isTemplateExpression(node)) text = node.getText().slice(1, -1);
  if (text && /[A-Za-z]+ [a-z]/.test(text)) shown.push(text);
  ts.forEachChild(node, walk);
})(fn);

for (const kind of kinds) check(`a line for ${kind}`, cases.includes(kind), true);
check('found the sentences', shown.length > 12, true);

const FORBIDDEN =
  /\b(streak|great|well done|good job|failed|missed|behind|should|must|need to|real|genuine|genuinely|score of|safe|cure|treat|diagnos\w*|progress|complete)\b|%|!|[–—]| -- /i;
for (const line of shown) check(`no verdict words: ${line}`, FORBIDDEN.test(line), false);

console.log(failures === 0 ? `All ${total} checks passed` : `\n${failures} of ${total} checks failed`);
process.exit(failures === 0 ? 0 : 1);
