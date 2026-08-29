// Add `backgroundColor: colors.surface` to a named StyleSheet entry, in
// place, only if it does not already set one.
//
// 2026-08-29, supporting the standing rule that no text sits directly on
// a tab's photographic background. The recurring case this exists for is
// an outline-only control (a bordered button with no fill) whose label
// therefore sits straight on the photo. The same style block is
// copy-pasted across all eleven Food builders, so patching them by hand
// eleven times invites exactly the kind of "fixed it in one place and
// called it done" mistake this rule was written to stop.
//
// Usage: node scripts/add_style_background.js <styleName> <file> [file...]
const fs = require('fs');

const [, , styleName, ...files] = process.argv;
if (!styleName || files.length === 0) {
  console.error('usage: node scripts/add_style_background.js <styleName> <file> [file...]');
  process.exit(1);
}

for (const file of files) {
  const original = fs.readFileSync(file, 'utf8');
  const lines = original.split(/\r?\n/);

  // Find `  styleName: {` and its matching close, counting braces so a
  // nested object (shadowOffset) cannot end the block early.
  // A one-line style (`name: { flexDirection: 'row', gap: 8 },`) is just
  // as common in this codebase as the multi-line form, so handle it first
  // rather than reporting the file as having no such style at all.
  const singleLineIndex = lines.findIndex((line) =>
    new RegExp(`^\\s*${styleName}:\\s*\\{[^{}]*\\},?\\s*$`).test(line),
  );
  if (singleLineIndex !== -1) {
    if (/backgroundColor\s*:/.test(lines[singleLineIndex])) {
      console.log(`${file}: "${styleName}" already sets a background, skipped`);
      continue;
    }
    lines[singleLineIndex] = lines[singleLineIndex].replace(
      /\}(,?)(\s*)$/,
      (match, comma, trailing) => `, backgroundColor: colors.surface }${comma}${trailing}`,
    );
    fs.writeFileSync(file, lines.join('\r\n'));
    console.log(`${file}: added a background to "${styleName}" (one-line)`);
    continue;
  }

  const startIndex = lines.findIndex((line) => new RegExp(`^\\s*${styleName}:\\s*\\{\\s*$`).test(line));
  if (startIndex === -1) {
    console.log(`${file}: no "${styleName}" style found, skipped`);
    continue;
  }

  let depth = 0;
  let endIndex = -1;
  for (let i = startIndex; i < lines.length; i += 1) {
    for (const character of lines[i]) {
      if (character === '{') depth += 1;
      else if (character === '}') depth -= 1;
    }
    if (depth === 0) {
      endIndex = i;
      break;
    }
  }
  if (endIndex === -1) {
    console.log(`${file}: could not find the end of "${styleName}", skipped`);
    continue;
  }

  const block = lines.slice(startIndex, endIndex + 1).join('\n');
  if (/backgroundColor\s*:/.test(block)) {
    console.log(`${file}: "${styleName}" already sets a background, skipped`);
    continue;
  }

  const indent = (lines[startIndex].match(/^\s*/) || [''])[0] + '  ';
  lines.splice(endIndex, 0, `${indent}// Filled so its label is not sitting on the photo background.`, `${indent}backgroundColor: colors.surface,`);
  fs.writeFileSync(file, lines.join('\r\n'));
  console.log(`${file}: added a background to "${styleName}"`);
}
