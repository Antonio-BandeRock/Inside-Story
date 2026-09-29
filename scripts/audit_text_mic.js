/* global __dirname */
// Every text field has the mic inside it, on the hand side (2026-09-28,
// direct request: "Can we make sure that all text and note fields have the
// mic inside of it, and left-right aware? I know some do and some don't.").
// AppTextInput draws the mic itself, on the side NAVIGATION_HAND favors, for
// every field typed in words, so the ways a field could still go without
// one are the three this reports:
//
//   1. a VoiceInputButton placed by hand, beside a field or a label, in a
//      file not listed in OWN_MIC below (it should be the field's own mic,
//      through onVoiceResult or voiceJoin);
//   2. voice={false} on an AppTextInput in a file not listed in OWN_MIC;
//   3. a bare react-native TextInput, which has no mic at all, in a file
//      not listed in BARE_TEXT_INPUT.
//
// Must stay at 0. scripts/audit_notes_mic.js checks the notes fields apart.
//
// USAGE
//   node scripts/audit_text_mic.js
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// Files that draw a mic of their own, with the reason each one does.
const OWN_MIC = {
  'components/AppTextInput.tsx': 'the field itself, which draws every other mic',
  'components/AppKeyboard.tsx': 'the search row on the on-screen keyboard',
  'components/EntrySearchInput.tsx': 'a search box that already draws its mic inside the box on the hand side',
  'components/StepsEditor.tsx': 'the step editor, which already draws its mic inside the box on the hand side',
  'app/capture.tsx': 'the large mic that is the capture screen, not a field',
  'components/FoodLookup.tsx': 'Say a Food Name, a voice search with no field under it',
};

// Files allowed a bare TextInput, with the reason.
const BARE_TEXT_INPUT = {
  'components/AppTextInput.tsx': 'the field itself',
  'components/PasswordPrompt.tsx': 'password fields, where speaking the password aloud is the thing to avoid',
  'components/EcowittGatewaySection.tsx': 'the AC Infinity password fields (I23), for the same reason',
};

function walk(dir, out) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      if (name !== 'node_modules') walk(full, out);
    } else if (name.endsWith('.tsx')) out.push(full);
  }
  return out;
}

const findings = [];
for (const file of [...walk(path.join(ROOT, 'app'), []), ...walk(path.join(ROOT, 'components'), [])]) {
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  const src = fs.readFileSync(file, 'utf8');
  const lineOf = (index) => src.slice(0, index).split('\n').length;
  const scan = (re, message, allowed) => {
    if (allowed[rel]) return;
    let match;
    while ((match = re.exec(src))) findings.push(`${rel}:${lineOf(match.index)} ${message}`);
  };
  scan(/<VoiceInputButton\b/g, 'a mic placed beside a field; make it the field\'s own (onVoiceResult or voiceJoin)', OWN_MIC);
  scan(/\bvoice=\{false\}/g, 'voice={false} with no reason listed in OWN_MIC', OWN_MIC);
  scan(/<TextInput\b/g, 'a bare TextInput, which has no mic; use AppTextInput', BARE_TEXT_INPUT);
}

for (const finding of findings) console.log('  ' + finding);
console.log(`\n${findings.length} text field(s) without the mic inside.`);
if (findings.length > 0) process.exit(1);
