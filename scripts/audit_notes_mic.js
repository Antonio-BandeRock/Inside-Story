/* global __dirname */
// Every notes field has the mic inside it (2026-09-28, direct request: "Do
// all notes fields have a microphone accessible to record to text, inside
// the text field as is the default that changes to the other side for left
// to right hand use?"). components/NotesInput.tsx is that field. This walks
// every AppTextInput under app/ and components/ and reports one that looks
// like a place to write notes but is not a NotesInput:
//
//   - it is multiline, or
//   - its value names a note, comment, journal, description, reflection or reason, or
//   - the label just above it says Note or Notes.
//
// A field that matches and is deliberately not a notes field goes in
// NOT_NOTES with the reason. Must stay at 0.
//
// USAGE
//   node scripts/audit_notes_mic.js
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// file (relative, forward slashes) + value expression -> why it is not a notes field.
const NOT_NOTES = {
  'components/ScanProductView.tsx|ingredientsText': 'the ingredient list read off a label, with a mic beside it that replaces the list',
  'components/FoodProductDetailView.tsx|ingredientsText': 'the same ingredient list, kept on a saved product',
  'components/LabelCheckView.tsx|labelText': 'a pasted food label to check, not writing',
  'components/RecipeImportView.tsx|pasteText': 'a pasted recipe to import, not writing',
  'app/usual-meals.tsx|foodsText': 'a comma list of foods, each matched to the food list',
  'components/TellClaudeHost.tsx|newText': 'replacement wording for one line of the app, typed exactly',
  'components/StepsEditor.tsx|stepDraft': 'already has the mic inside its box on the hand side, drawn by the step editor itself',
};

function walk(dir, out) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      if (name !== 'node_modules') walk(full, out);
    } else if (name.endsWith('.tsx') && name !== 'AppTextInput.tsx' && name !== 'NotesInput.tsx') out.push(full);
  }
  return out;
}

const findings = [];
for (const file of [...walk(path.join(ROOT, 'app'), []), ...walk(path.join(ROOT, 'components'), [])]) {
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  const src = fs.readFileSync(file, 'utf8');
  const re = /<AppTextInput\b([\s\S]*?)\/>/g;
  let match;
  while ((match = re.exec(src))) {
    const body = match[1];
    const value = (body.match(/value=\{([^}]*)\}/) || [])[1] || '';
    const before = src.slice(Math.max(0, match.index - 300), match.index);
    const lastLabel = (before.match(/<Text\b[^>]*>([^<]*)<\/Text>(?![\s\S]*<Text\b)/) || [])[1] || '';
    const looksLikeNotes =
      /\bmultiline\b/.test(body) ||
      /note|comment|journal|description|reflection|reason/i.test(value) ||
      /\bnotes?\b/i.test(lastLabel);
    if (!looksLikeNotes) continue;
    if (NOT_NOTES[`${rel}|${value}`]) continue;
    const line = src.slice(0, match.index).split('\n').length;
    findings.push(`${rel}:${line} value={${value}}${lastLabel ? ` under "${lastLabel.trim()}"` : ''}`);
  }
}

for (const finding of findings) console.log('  ' + finding);
console.log(`\n${findings.length} notes field(s) without the mic inside.`);
if (findings.length > 0) process.exit(1);
