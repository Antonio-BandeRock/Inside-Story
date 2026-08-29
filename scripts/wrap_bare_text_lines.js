// Add a surface to specific bare <Text> lines, given their line numbers.
//
// 2026-08-29, supporting the standing rule that no text sits directly on
// a tab's photographic background. Line-targeted rather than a global
// find/replace because the same style name (styles.emptyText, say) is
// used BOTH inside cards and outside them in the same file -- replacing
// every occurrence would nest a surface inside a surface everywhere it
// was already fine. The line numbers come from
// scripts/audit_bare_text_on_background.js, which only reports the ones
// genuinely sitting on the background.
//
// Usage: node scripts/wrap_bare_text_lines.js <file> <addedStyle> <line,line,...>
const fs = require('fs');

const [, , file, addedStyle, lineList] = process.argv;
if (!file || !addedStyle || !lineList) {
  console.error('usage: node scripts/wrap_bare_text_lines.js <file> <addedStyle> <line,line,...>');
  process.exit(1);
}

const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
const targets = lineList.split(',').map((value) => Number(value.trim()));
let changed = 0;
const skipped = [];

for (const lineNumber of targets) {
  const index = lineNumber - 1;
  const original = lines[index];
  if (original === undefined) {
    skipped.push(`${lineNumber}: out of range`);
    continue;
  }
  if (original.includes(addedStyle)) {
    skipped.push(`${lineNumber}: already has ${addedStyle}`);
    continue;
  }

  // style={styles.foo}  ->  style={[styles.foo, styles.added]}
  const single = original.replace(
    /style=\{(styles\.[A-Za-z0-9_]+)\}/,
    (match, ref) => `style={[${ref}, styles.${addedStyle}]}`,
  );
  if (single !== original) {
    lines[index] = single;
    changed += 1;
    continue;
  }

  // style={[styles.foo, ...]}  ->  style={[styles.foo, ..., styles.added]}
  const arrayForm = original.replace(/style=\{\[([^\]]*)\]\}/, (match, inner) => `style={[${inner}, styles.${addedStyle}]}`);
  if (arrayForm !== original) {
    lines[index] = arrayForm;
    changed += 1;
    continue;
  }

  skipped.push(`${lineNumber}: no style prop matched -> ${original.trim().slice(0, 70)}`);
}

fs.writeFileSync(file, lines.join('\r\n'));
console.log(`changed ${changed} of ${targets.length}`);
for (const note of skipped) console.log(`  skipped ${note}`);
