// Insert the two shared surface styles the standing "no text directly on
// the tab background" rule needs, into a file that does not have them yet.
//
// 2026-08-29. Inserted immediately before an anchor style that already
// exists in the file's StyleSheet, so the addition lands inside the
// StyleSheet.create({...}) object rather than being appended somewhere
// that would not compile.
//
// Usage: node scripts/add_panel_styles.js <file> <anchorStyleName>
const fs = require('fs');

const [, , file, anchor] = process.argv;
if (!file || !anchor) {
  console.error('usage: node scripts/add_panel_styles.js <file> <anchorStyleName>');
  process.exit(1);
}

const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
if (lines.some((line) => /^\s*panelStandalone:/.test(line))) {
  console.log(`${file}: already has panelStandalone, skipped`);
  process.exit(0);
}

const index = lines.findIndex((line) => new RegExp(`^\\s*${anchor}:`).test(line));
if (index === -1) {
  console.error(`${file}: anchor style "${anchor}" not found`);
  process.exit(1);
}

const indent = (lines[index].match(/^\s*/) || [''])[0];
const block = [
  `${indent}// 2026-08-29, standing rule: no text sits directly on a tab's`,
  `${indent}// photographic background. panelStandalone is for text with no card`,
  `${indent}// to join (an empty state, an error or loading line);`,
  `${indent}// groupHeadingChip is for a heading introducing a GROUP of separate`,
  `${indent}// cards. A heading that labels ONE card should move inside that`,
  `${indent}// card instead of using either.`,
  `${indent}panelStandalone: {`,
  `${indent}  backgroundColor: colors.surface,`,
  `${indent}  borderRadius: 10,`,
  `${indent}  paddingVertical: 12,`,
  `${indent}  paddingHorizontal: 12,`,
  `${indent}},`,
  `${indent}groupHeadingChip: {`,
  `${indent}  backgroundColor: colors.surface,`,
  `${indent}  borderRadius: 10,`,
  `${indent}  paddingVertical: 8,`,
  `${indent}  paddingHorizontal: 12,`,
  `${indent}},`,
];

lines.splice(index, 0, ...block);
fs.writeFileSync(file, lines.join('\r\n'));
console.log(`${file}: added panelStandalone and groupHeadingChip before "${anchor}"`);
