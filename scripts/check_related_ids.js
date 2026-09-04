// Confirms every relatedIds reference across the whole Digest corpus
// resolves to an entry that actually exists, and that no two entries
// share an id.
//
// Built 2026-09-04. This check has been run by hand as a throwaway script
// several times across this project's history (see CLAUDE.md's own
// "every new relatedIds entry confirmed to resolve" notes); making it a
// committed script means the next content batch runs the same check
// rather than reinventing it.
//
// Extraction is deliberately done with the TypeScript compiler API rather
// than a regex over the source. These files are 15,000+ lines of prose
// full of apostrophes, quotes of both kinds, and brackets inside ordinary
// sentences, and a regex over them has already produced wrong answers in
// this project before (see the curated-recipe instructions backfill).
//
// Run with: node scripts/check_related_ids.js
// Exits non-zero if any reference dangles or any id is duplicated.

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const DIGEST_DIR = path.join(__dirname, '..', 'lib', 'digest');

const ids = new Set();
const duplicates = [];
// id -> { file, relatedIds: [] }
const references = [];

function stringOf(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  return null;
}

for (const fileName of fs.readdirSync(DIGEST_DIR)) {
  if (!fileName.endsWith('.ts')) continue;
  const filePath = path.join(DIGEST_DIR, fileName);
  const source = ts.createSourceFile(fileName, fs.readFileSync(filePath, 'utf8'), ts.ScriptTarget.ES2020, true);

  // Every entry in this corpus is an object literal carrying an `id`
  // property. Walking object literals directly (rather than trying to
  // find the exported array) also picks up entries in files whose export
  // shape differs, which several of these files genuinely have.
  const visit = (node) => {
    if (ts.isObjectLiteralExpression(node)) {
      let entryId = null;
      let related = null;

      for (const prop of node.properties) {
        if (!ts.isPropertyAssignment(prop)) continue;
        const name = prop.name && (ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name)) ? prop.name.text : null;
        if (name === 'id') entryId = stringOf(prop.initializer);
        if (name === 'relatedIds' && ts.isArrayLiteralExpression(prop.initializer)) {
          related = prop.initializer.elements.map(stringOf).filter((value) => value !== null);
        }
      }

      // An object with an id but no category is not a Digest entry (the
      // citation objects, the chart data points). Requiring both keeps
      // this from collecting ids that were never meant to be linkable.
      const hasCategory = node.properties.some(
        (prop) =>
          ts.isPropertyAssignment(prop) &&
          prop.name &&
          (ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name)) &&
          prop.name.text === 'category',
      );

      if (entryId && hasCategory) {
        if (ids.has(entryId)) duplicates.push({ id: entryId, file: fileName });
        ids.add(entryId);
        if (related && related.length > 0) references.push({ from: entryId, file: fileName, related });
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(source);
}

let failures = 0;
let checked = 0;

for (const { from, file, related } of references) {
  for (const target of related) {
    checked += 1;
    if (!ids.has(target)) {
      failures += 1;
      console.error(`DANGLING  ${file}: '${from}' points at '${target}', which does not exist`);
    }
  }
}

for (const { id, file } of duplicates) {
  failures += 1;
  console.error(`DUPLICATE id '${id}' (second occurrence in ${file})`);
}

console.log(`${ids.size} entries, ${checked} relatedIds references checked, ${failures} problems`);
if (failures > 0) process.exit(1);
