// Checks the limits on playful wording (lib/playfulCopy.ts), approved
// 2026-10-03 alongside "On by default ... Implement all of them."
//
//   1. Every line has a plain twin: a string, or null meaning nothing shows
//      in that place with Playful wording off.
//   2. No playful line praises or scores anybody.
//   3. No dash used as punctuation and no filler words, the same as all
//      customer-facing text.
//   4. Playful wording never reaches a screen about symptoms, flares, labs,
//      medications, the emergency card, condition reading, Pattern Finder,
//      an advisory, grief, family history or the Diary: no such file may
//      import the copy file or the hook that reads the switch.
//   5. Nothing playful is written outside the copy file: each playful line's
//      distinctive tail appears in no other source file.
//
// Usage: node scripts/audit_playful_copy.js   (exits 1 on any problem)

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const ROOT = path.join(__dirname, '..');
const problems = [];

function load(relPath) {
  const source = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    throw new Error(`lib/playfulCopy.ts must stay pure (asked for ${name})`);
  });
  return module.exports;
}

const { PLAYFUL_COPY } = load('lib/playfulCopy.ts');

const PRAISE_OR_SCORE =
  /\b(great job|well done|good job|proud of you|amazing|awesome|nailed it|keep it up|streak|points?|level up|score[sd]?|rank(ed|ing)?|winner|champion|you rock)\b/i;
const DASH = /[–—]| -- /;
const FILLER = /\b(real|genuine|genuinely)\b/i;

let lines = 0;
for (const [key, line] of Object.entries(PLAYFUL_COPY)) {
  lines += 1;
  if (!line || typeof line.playful !== 'string' || line.playful.trim() === '') {
    problems.push(`${key}: has no playful line`);
    continue;
  }
  if (!(line.plain === null || typeof line.plain === 'string')) problems.push(`${key}: plain twin is missing`);
  for (const [which, text] of [['playful', line.playful], ['plain', line.plain]]) {
    if (typeof text !== 'string') continue;
    if (DASH.test(text)) problems.push(`${key} (${which}): dash used as punctuation`);
    if (FILLER.test(text)) problems.push(`${key} (${which}): filler word`);
  }
  if (PRAISE_OR_SCORE.test(line.playful)) problems.push(`${key}: praises or scores ("${line.playful.match(PRAISE_OR_SCORE)[0]}")`);
}

// Rule 4 and 5 walk the source folders.
const FOLDERS = ['app', 'components', 'lib', 'hooks', 'constants'];
const HEALTH_FILE =
  /(symptom|flare|labs?(?=[A-Z._]|$)|lab[_-]|\bmeds?\b|^meds?|medic|emergency|condition|pattern|advisor|grief|family|diary)/i;
const IMPORTS_PLAYFUL = /from ['"][^'"]*(playfulCopy|usePlayfulWording)['"]/;

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const files = FOLDERS.flatMap((folder) => walk(path.join(ROOT, folder), []));

// A tail is the last sentence of a playful line that the plain twin does not
// carry, which is the part that would be a stray joke anywhere else.
const tails = [];
for (const [key, line] of Object.entries(PLAYFUL_COPY)) {
  const extra = line.plain && line.playful.startsWith(line.plain) ? line.playful.slice(line.plain.length) : line.playful;
  const sentences = extra.split(/(?<=[.?!])\s+/).map((s) => s.trim()).filter((s) => s.length >= 18);
  const last = sentences[sentences.length - 1];
  if (last && !(line.plain && line.plain.includes(last))) tails.push({ key, text: last });
}

let importers = 0;
for (const file of files) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  if (rel === 'lib/playfulCopy.ts') continue;
  const source = fs.readFileSync(file, 'utf8');
  if (IMPORTS_PLAYFUL.test(source)) {
    importers += 1;
    if (HEALTH_FILE.test(path.basename(file, path.extname(file)))) {
      problems.push(`${rel}: a health screen takes playful wording`);
    }
  }
  for (const tail of tails) {
    if (source.includes(tail.text)) problems.push(`${rel}: playful line "${tail.key}" written outside lib/playfulCopy.ts`);
  }
}

if (problems.length) {
  for (const problem of problems) console.log(`  ${problem}`);
  console.log(`${problems.length} problem(s) across ${lines} playful lines`);
  process.exit(1);
}
console.log(`${lines} playful lines, each with a plain twin; ${importers} files use them, none about health; 0 problems`);
