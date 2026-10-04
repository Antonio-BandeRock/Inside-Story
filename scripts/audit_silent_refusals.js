/* global __dirname */
// Always say why (1.0.60.16). Direct instruction, 2026-10-03: "When a user
// hasn't yet achieved the requirements to complete a process, they should be
// provided the reason why." Finds the two shapes that refuse without a word:
//
//   silent-return   an `if (...) return;` whose condition reads a typed
//                   field, so pressing the button does nothing
//   disabled-input  a `disabled={...}` that turns on because a typed field
//                   is empty, so the button is greyed out with no reason
//
// A typed field is read either directly (`newName.trim()`) or through a name
// that holds it trimmed (`const name = newName.trim();` then `!name`).
//
// The fix for both is lib/notYet.ts: keep the button pressable and call
// explainNotYet('...') with the missing thing. A hit that is not a person's
// press (a keyboard's Done on an empty box, a voice result, a scroll effect)
// goes in ALLOWED with the reason. Must stay at 0.
//
// Usage: node scripts/audit_silent_refusals.js
const fs = require('fs');
const path = require('path');

// Only screens: a press happens in app/ and components/, never in lib/.
const ROOTS = ['app', 'components'];

// "file:trimmed line text" -> why it is not a refusal a person meets.
const ALLOWED = {
  'components/FoodLookup.tsx:if (!isFinal || !transcript.trim()) return;':
    'A voice result arriving in pieces; an empty or unfinished one is waited past, nobody pressed anything.',
  'components/PopoverSelect.tsx:if (hasScrolledToSelectionRef.current || searchText.trim()) return;':
    'A scroll effect that leaves the list where it is while somebody is searching.',
  'components/TodayPicks.tsx:if (!name) return;':
    "The keyboard's Done key on an empty box, which only closes the keyboard. The Add button beside it says why.",
  'components/YourStoryInterview.tsx:if (!name) return;':
    "The keyboard's Done key on an empty Another allergy box, which only closes the keyboard; Done and No Allergies below it are the buttons.",
};

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

const SILENT = /\bif\s*\((.*)\)\s*(return\s*(false)?\s*;|\{\s*return\s*;?\s*\})/;
const DISABLED = /\bdisabled=\{(.*)\}/;
const TRIMMED_NAME = /\bconst\s+(\w+)\s*=\s*[^;]*\.trim\(\)\s*;/;

function readsInput(expr, trimmedNames) {
  if (/\.trim\(\)/.test(expr)) return true;
  for (const name of trimmedNames) {
    if (new RegExp(`!\\s*${name}\\b|\\b${name}\\.length\\s*(===\\s*0|<)`).test(expr)) return true;
  }
  return false;
}

const hits = [];
const root = path.join(__dirname, '..');
for (const base of ROOTS) {
  const dir = path.join(root, base);
  if (!fs.existsSync(dir)) continue;
  for (const file of walk(dir, [])) {
    const rel = path.relative(root, file).split(path.sep).join('/');
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    const trimmedNames = new Set();
    for (const line of lines) {
      const m = line.match(TRIMMED_NAME);
      if (m) trimmedNames.add(m[1]);
    }
    lines.forEach((line, i) => {
      const text = line.trim();
      if (text.startsWith('//') || text.startsWith('*')) return;
      let kind = null;
      const silent = line.match(SILENT);
      if (silent && readsInput(silent[1], trimmedNames)) kind = 'silent-return';
      else {
        const m = line.match(DISABLED);
        if (m && readsInput(m[1], trimmedNames)) kind = 'disabled-input';
      }
      if (!kind) return;
      if (ALLOWED[`${rel}:${text}`]) return;
      hits.push({ rel, line: i + 1, kind, text });
    });
  }
}

for (const hit of hits) console.log(`${hit.rel}:${hit.line}  ${hit.kind}  ${hit.text}`);
console.log(`\n${hits.length} refusal${hits.length === 1 ? '' : 's'} that say nothing.`);
process.exit(hits.length ? 1 : 0);
