// One-off verification, run after any real content change to lib/digest/
// -- the same established check this whole Digest build has used
// throughout its history: every entry across every lib/digest/*.ts file
// (except index.ts/types.ts, which hold no real entries of their own)
// must have a unique id, and every relatedIds reference must resolve to a
// real, existing id somewhere in the whole set.

const fs = require('fs');
const path = require('path');

const DIGEST_DIR = path.join(__dirname, '..', 'lib', 'digest');
const files = fs.readdirSync(DIGEST_DIR).filter((f) => f.endsWith('.ts') && f !== 'index.ts' && f !== 'types.ts');

const allIds = new Set();
const duplicates = [];
const relatedRefs = []; // { fromId, toId, file }

for (const file of files) {
  const text = fs.readFileSync(path.join(DIGEST_DIR, file), 'utf8');
  // Real entry ids: id: 'xyz'
  const idMatches = [...text.matchAll(/id:\s*'([^']+)'/g)].map((m) => m[1]);
  for (const id of idMatches) {
    if (allIds.has(id)) duplicates.push(`${id} (also in ${file})`);
    allIds.add(id);
  }
  // relatedIds arrays: relatedIds: ['a', 'b', ...]
  const relatedBlocks = [...text.matchAll(/relatedIds:\s*\[([^\]]*)\]/g)];
  for (const block of relatedBlocks) {
    const ids = [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
    for (const toId of ids) relatedRefs.push({ toId, file });
  }
}

console.log('Total unique ids:', allIds.size);
console.log('Duplicate ids:', duplicates.length);
duplicates.forEach((d) => console.log('  -', d));

const dangling = relatedRefs.filter((r) => !allIds.has(r.toId));
console.log('Dangling relatedIds references:', dangling.length);
dangling.forEach((d) => console.log(`  - ${d.toId} (referenced in ${d.file})`));
