// Pulls the handful of numbers the App Guide artifact states directly and
// that tend to drift as the app grows (food/source counts, Digest entry/
// category counts, per-tab lens counts, tab count, Food builder count) --
// one script run instead of ~8 separate ad hoc grep/sqlite3/Read calls.
//
// Run from the repo root: node scripts/app-guide-facts.js
// Then compare against whatever the currently-published App Guide states
// (https://claude.ai/code/artifact/d98692af-1786641711-a36e) before deciding
// what, if anything, actually needs correcting -- this script only pulls
// facts, it doesn't touch the artifact or decide what prose to write.
//
// 2026-08-14: built directly in response to a real "why did the keep-current
// routine take 20 minutes" complaint -- most of that time went to many
// separate manual fact-checks (lens counts especially: Insights' own Cooking
// Impact lens and Garden's own Upcoming Tasks lens had both drifted out of
// the App Guide's stated counts and were only caught by hand-reading each
// tab file individually). This consolidates that whole pass into one run.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO_ROOT = process.cwd();

function readFile(relPath) {
  return fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf8');
}

// Count `key: '...'` entries inside a top-level array declared as
// `const NAME: Type[] = [` ... `];` (CRLF-tolerant -- see the digest-tracker
// generator's own header comment for why this repo needs \r?\n everywhere).
function countArrayKeys(content, declPattern) {
  const declRe = new RegExp(declPattern);
  const m = declRe.exec(content);
  if (!m) return { count: null, error: `declaration not found: ${declPattern}` };
  const start = m.index + m[0].length;
  const closeRe = /\r?\n\];/;
  closeRe.lastIndex = start;
  const closeMatch = content.slice(start).match(closeRe);
  if (!closeMatch) return { count: null, error: 'closing "];" not found after declaration' };
  const body = content.slice(start, start + closeMatch.index);
  const keyMatches = body.match(/\bkey:\s*'/g);
  return { count: keyMatches ? keyMatches.length : 0 };
}

// Count members of a plain string-literal union type on one line, e.g.
// `type X = 'a' | 'b' | 'c';`.
function countUnionMembers(content, declPattern) {
  const m = new RegExp(declPattern).exec(content);
  if (!m) return { count: null, error: `declaration not found: ${declPattern}` };
  const line = m[0];
  const members = line.match(/'[^']+'/g);
  return { count: members ? members.length : 0 };
}

const facts = {};

// --- Reference database: food count + distinct sources ---
try {
  const dbPath = path.join(REPO_ROOT, 'assets', 'data', 'foods_reference.db');
  const sqlite3 = 'C:\\Users\\TonyR\\AppData\\Local\\Android\\Sdk\\platform-tools\\sqlite3.exe';
  const foodCount = execFileSync(sqlite3, [dbPath, 'SELECT COUNT(*) FROM foods;'], { encoding: 'utf8' }).trim();
  const sources = execFileSync(sqlite3, [dbPath, 'SELECT DISTINCT source FROM foods ORDER BY source;'], { encoding: 'utf8' }).trim().split('\n').map((s) => s.trim());
  facts.referenceDatabase = { foodCount: Number(foodCount), sourceCount: sources.length, sources };
} catch (e) {
  facts.referenceDatabase = { error: String(e.message || e) };
}

// --- Purple Digest: total entries + categories ---
try {
  const digestDir = path.join(REPO_ROOT, 'lib', 'digest');
  const files = fs.readdirSync(digestDir).filter((f) => f.endsWith('.ts') && f !== 'index.ts' && f !== 'types.ts');
  let totalEntries = 0;
  for (const f of files) {
    const content = fs.readFileSync(path.join(digestDir, f), 'utf8');
    const ids = content.match(/\bid:\s*'[a-zA-Z0-9-]+'/g);
    if (ids) totalEntries += ids.length;
  }
  const indexContent = readFile('lib/digest/index.ts');
  const catKeys = indexContent.match(/key:\s*'[a-zA-Z0-9]+'/g);
  facts.purpleDigest = { totalEntries, categoryCount: catKeys ? new Set(catKeys).size : null };
} catch (e) {
  facts.purpleDigest = { error: String(e.message || e) };
}

// --- Tabs, per-tab lens counts, Food builder count ---
try {
  const tabsContent = readFile('constants/tabs.ts');
  const tabRoutes = tabsContent.match(/path:\s*'\/[a-zA-Z-]*'/g);
  facts.tabCount = tabRoutes ? tabRoutes.length : null;
} catch (e) {
  facts.tabCount = { error: String(e.message || e) };
}

facts.lensCounts = {
  food: countArrayKeys(readFile('app/(tabs)/food.tsx'), "const FOOD_LENSES: LensOption<FoodLens>\\[\\] = \\["),
  insights: countArrayKeys(readFile('app/(tabs)/insights.tsx'), 'const LENSES: LensOption<Lens>\\[\\] = \\['),
  schedule: countArrayKeys(readFile('app/(tabs)/schedule.tsx'), 'const LENSES: LensOption<Lens>\\[\\] = \\['),
  garden: countUnionMembers(readFile('app/(tabs)/garden.tsx'), "type GardenLens = [^;]+;"),
};

console.log(JSON.stringify(facts, null, 2));
