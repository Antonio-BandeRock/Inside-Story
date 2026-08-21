// Builds the JSON data blob for the Digest progress-tracker Artifact.
// Run from the repo root: node <path-to-this-file>
// Add --mark-published after a successful Artifact publish to update the
// committed baseline (see below) for next time.
//
// Real, verified condition -> file mapping (confirmed directly against
// lib/digest/index.ts's own DIGEST_CATEGORY_META, not guessed). Hashimoto's
// own entries are scattered across many files (tagged category:'hashimotos')
// rather than living in one file, so its total is computed by scanning every
// digest file for that tag, matching how the app itself works.
//
// "isNew" baseline, 2026-08-14 fix: this used to diff against a hardcoded
// git commit SHA (`e9f7c0b`, "parent of the first digest-batch commit this
// push") via `git show <sha>:<path>`. That SHA no longer resolves after the
// 2026-08-11 git-filter-repo history rewrite (every commit in the repo got a
// new SHA) -- confirmed via `git cat-file -e e9f7c0b^{commit}` failing. A
// commit-SHA baseline is inherently fragile this way (a squash, rebase, or
// filter-repo rewrite silently breaks it with no error at the call site --
// the old code's own try/catch swallowed the failure and treated it as "the
// file didn't exist at baseline," marking every single entry "new," which
// would have quietly produced a wrong tracker rather than an obvious one).
// Replaced with a durable, committed snapshot file (baseline-ids.json,
// tracked in git, NOT gitignored -- unlike digest-tracker-data.json below,
// this is real source-of-truth state, not a throwaway build artifact) storing
// the full id set as of the last successful publish. Run this script with
// --mark-published right after publishing to advance the baseline for next
// time. This does shift "new" from "since the depth-push began" to "since
// the tracker was last actually published" -- a deliberate, disclosed
// tradeoff (durability over a fixed historical anchor), matching how this
// same substitution was already made once, ad hoc, in a 2026-08-14 session
// after the original baseline commit turned out unreachable.
const fs = require('fs');
const path = require('path');

const REPO_ROOT = process.cwd();
const DIGEST_DIR = path.join(REPO_ROOT, 'lib', 'digest');
const BASELINE_PATH = path.join(__dirname, 'baseline-ids.json');
const MARK_PUBLISHED = process.argv.includes('--mark-published');

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
  // \r?\n, not a bare \n: this repo's own line endings are genuinely
  // inconsistent file-to-file (some LF, some CRLF) -- a bare \n here
  // silently matched zero entries in every CRLF file the first time this
  // ran post-fix (2026-08-14), the same CRLF-vs-LF regex trap already
  // documented elsewhere in this project's own history.
  const blocks = content.split(/\r?\n {2}\{\r?\n/).slice(1);
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

function loadBaselineIds() {
  try {
    const raw = fs.readFileSync(BASELINE_PATH, 'utf8');
    return new Set(JSON.parse(raw).ids);
  } catch {
    // No baseline file yet (first run) -- treat everything as new rather
    // than crash, but say so loudly, since a silently-empty baseline means
    // every entry shows "new" until the file is created via --mark-published.
    console.warn(`WARN: no baseline file at ${BASELINE_PATH} yet -- every entry will show as new until this script is run once with --mark-published.`);
    return new Set();
  }
}

const baseline = loadBaselineIds();

// Per-condition data.
const conditions = CONDITIONS.map(({ key, label, file }) => {
  const filePath = path.join(DIGEST_DIR, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const entries = extractEntries(content);
  const withNew = entries.map((e) => ({ ...e, isNew: !baseline.has(e.id) }));
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
  console.log(`  ${c.label}: ${c.count} entries (${c.newCount} new since baseline)`);
}

if (MARK_PUBLISHED) {
  const allIds = [];
  for (const c of conditions) for (const e of c.entries) allIds.push(e.id);
  fs.writeFileSync(
    BASELINE_PATH,
    JSON.stringify({ publishedAt: new Date().toISOString(), ids: allIds.sort() }, null, 2),
  );
  console.log(`\nBaseline updated (${allIds.length} ids) -- only run this AFTER actually publishing the artifact.`);
} else {
  console.log('\n(Run again with --mark-published once the artifact is actually republished, to reset the "new" baseline for next time.)');
}
