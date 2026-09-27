// Checks D14 of the competitive build plan (Phase 2, 2026-09-26), the
// journal prompts above General Note: a prompt starts an empty note, lands
// on its own line under an existing one, is never added twice, and no
// prompt judges the day. Exits non-zero on any failure.

// eslint-config-expo lints this repo as app code, which has no __dirname.
/* global __dirname */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '..', 'lib/journalPrompts.ts'), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});
const mod = { exports: {} };
new Function('exports', 'module', 'require', outputText)(mod.exports, mod, (name) => {
  throw new Error(`lib/journalPrompts.ts must stay free of runtime imports (${name})`);
});
const { JOURNAL_PROMPTS, withPrompt } = mod.exports;

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

const q = JOURNAL_PROMPTS[0];
check('a short list', JOURNAL_PROMPTS.length >= 4 && JOURNAL_PROMPTS.length <= 8, true);
check('no repeats', new Set(JOURNAL_PROMPTS).size, JOURNAL_PROMPTS.length);
check('starts an empty note', withPrompt('', q), `${q}\n`);
check('whitespace counts as empty', withPrompt('  \n', q), `${q}\n`);
check('under what is there', withPrompt('Slept badly.', q), `Slept badly.\n\n${q}\n`);
check('not twice', withPrompt(`${q}\nA lot.`, q), `${q}\nA lot.`);

const FORBIDDEN = /\b(good|bad|better|worse|should|ought|must|grateful|gratitude|positive|negative|streak|score|real|genuine|genuinely)\b|%|!|[–—]| -- /i;
for (const prompt of JOURNAL_PROMPTS) {
  check(`no verdict words: ${prompt}`, FORBIDDEN.test(prompt), false);
  check(`a question: ${prompt}`, prompt.endsWith('?'), true);
}

console.log(failures === 0 ? `All ${total} checks passed` : `\n${failures} of ${total} checks failed`);
process.exit(failures === 0 ? 0 : 1);
