// Builds the JSON data blob for the Purple Digest progress-tracker Artifact.
// Run from the repo root: node <path-to-this-file>
//
// Real, verified condition -> file mapping (confirmed directly against
// lib/digest/index.ts's own DIGEST_CATEGORY_META, not guessed). Hashimoto's
// own entries are scattered across many files (tagged category:'hashimotos')
// rather than living in one file, so its total is computed by scanning every
// digest file for that tag, matching how the app itself works.
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO_ROOT = process.cwd();
const DIGEST_DIR = path.join(REPO_ROOT, 'lib', 'digest');
const BASELINE_COMMIT = 'e9f7c0b'; // parent of the first digest-batch commit this push

const CONDITIONS = [
  { key: 'rheumatoidArthritis', label: 'Rheumatoid Arthritis', file: 'rheumatoidArthritis.ts' },
  { key: 'psoriasis', label: 'Psoriasis', file: 'psoriasis.ts' },
  { key: 'graves', label: "Graves' Disease", file: 'graves.ts' },
  { key: 'type1Diabetes', label: 'Type 1 Diabetes', file: 'type1Diabetes.ts' },
  { key: 'celiac', label: 'Celiac Disease', file: 'celiac.ts' },
  { key: 'ibd', label: 'Inflammatory Bowel Disease', file: 'ibd.ts' },
  { key: 'multipleSclerosis', label: 'Multiple Sclerosis', file: 'multipleSclerosis.ts' },
  { key: 'lupus', label: 'Lupus (SLE)', file: 'lupus.ts' },
  { key: 'sjogrens', label: "Sjögren's Syndrome", file: 'sjogrens.ts' },
  { key: 'pcos', label: 'PCOS', file: 'pcos.ts' },
  { key: 'chronicKidneyDisease', label: 'Chronic Kidney Disease', file: 'chronicKidneyDisease.ts' },
  { key: 'fattyLiverDisease', label: 'Fatty Liver Disease', file: 'fattyLiverDisease.ts' },
  { key: 'type2Diabetes', label: 'Type 2 Diabetes', file: 'type2Diabetes.ts' },
  { key: 'ibs', label: 'Irritable Bowel Syndrome', file: 'ibs.ts' },
  { key: 'migraine', label: 'Migraine', file: 'migraine.ts' },
  { key: 'cardiovascularDisease', label: 'Cardiovascular Disease', file: 'cardiovascularDisease.ts' },
  { key: 'gout', label: 'Gout', file: 'gout.ts' },
  { key: 'prostateHealth', label: 'Prostate Health', file: 'prostateHealth.ts' },
];

function extractEntries(content) {
  // Split on real entry-object boundaries: "  {" at 2-space indent, one per
  // entry, matching every lib/digest/*.ts file's own consistent formatting.
  const blocks = content.split(/\n {2}\{\n/).slice(1);
  const entries = [];
  for (const block of blocks) {
    const idMatch = block.match(/id:\s*'([a-zA-Z0-9-]+)'/);
    const titleMatch = block.match(/title:\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/);
    const teaserMatch = block.match(/teaser:\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/);
    const tierMatch = block.match(/overallTier:\s*'(strong|moderate|weak)'/);
    if (!idMatch) continue;
    const title = titleMatch ? (titleMatch[1] ?? titleMatch[2]) : idMatch[1];
    const teaser = teaserMatch ? (teaserMatch[1] ?? teaserMatch[2]) : '';
    entries.push({
      id: idMatch[1],
      title: (title || '').replace(/\\'/g, "'").replace(/\\"/g, '"'),
      teaser: (teaser || '').replace(/\\'/g, "'").replace(/\\"/g, '"'),
      tier: tierMatch ? tierMatch[1] : 'moderate',
    });
  }
  return entries;
}

function baselineIds(relPath) {
  try {
    const raw = execSync(`git show ${BASELINE_COMMIT}:${relPath.replace(/\\/g, '/')}`, {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    return new Set(extractEntries(raw).map((e) => e.id));
  } catch {
    // File didn't exist at baseline at all -- every entry in it is new.
    return new Set();
  }
}

// Per-condition data.
const conditions = CONDITIONS.map(({ key, label, file }) => {
  const filePath = path.join(DIGEST_DIR, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const entries = extractEntries(content);
  const base = baselineIds(path.join('lib', 'digest', file));
  const withNew = entries.map((e) => ({ ...e, isNew: !base.has(e.id) }));
  return {
    key,
    label,
    count: entries.length,
    newCount: withNew.filter((e) => e.isNew).length,
    entries: withNew,
  };
});

// Hashimoto's own total, scattered across every digest file.
let hashimotosCount = 0;
for (const file of fs.readdirSync(DIGEST_DIR)) {
  if (!file.endsWith('.ts') || file === 'index.ts' || file === 'types.ts') continue;
  const content = fs.readFileSync(path.join(DIGEST_DIR, file), 'utf8');
  const matches = content.match(/category:\s*'hashimotos'/g);
  if (matches) hashimotosCount += matches.length;
}

const output = {
  generatedAt: new Date().toISOString(),
  hashimotosCount,
  conditions,
};

fs.writeFileSync(
  path.join(path.dirname(__filename), 'digest-tracker-data.json'),
  JSON.stringify(output, null, 2),
);

console.log('Hashimoto\'s total:', hashimotosCount);
console.log('Conditions:');
for (const c of conditions) {
  console.log(`  ${c.label}: ${c.count} entries (${c.newCount} new this push)`);
}
