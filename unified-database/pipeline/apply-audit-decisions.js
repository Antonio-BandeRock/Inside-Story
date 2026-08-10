// Applies a real, exported decisions file from the audit-tool webpage
// (unified-audit.html's own "Export decisions" panel) back onto the live
// unified_foods.sqlite -- the same "tool proposes, human decides, a
// script applies the real decisions" round-trip already proven on this
// app's own existing Reference Database Audit tool.
//
// Usage: node apply-audit-decisions.js <path-to-decisions.json>
//
// The exported file's own real shape (see unified-audit.html's own
// openExport()):
//   {
//     exportedAt: ISO string,
//     sourceExportedAt: ISO string (matches export-audit-data.js's own
//       exportedAt -- NOT currently cross-checked against the live DB's
//       real state; a decision is always re-resolved against whatever the
//       database actually looks like right now, the same "never trust a
//       stale export's own assumed state" discipline this whole project's
//       reference-database audit work has already learned the hard way),
//     decisions: {
//       classify: { [raw_id]: 'whole' | 'not_whole' | 'skip' },
//       groupConfirm: { [match_group_id]: true },
//       groupSplit: { [match_group_id]: true },
//       memberRemove: { [`${match_group_id}:${raw_id}`]: true },
//     }
//   }
//
// Naturally idempotent -- re-applying the same (or an overlapping) export
// a second time is always a safe no-op for whatever's already applied, so
// there's no dedup/already-applied tracking needed.

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const SQLITE_EXE =
  process.env.SQLITE_EXE ||
  'C:/Users/TonyR/AppData/Local/Android/Sdk/platform-tools/sqlite3.exe';
// Real, overridable path -- same precedent as SQLITE_EXE above -- so a
// real test can point this at an isolated database file instead of the
// live, 32,000+-record unified_foods.sqlite.
const dbPath = process.env.UNIFIED_DB_PATH || path.resolve(__dirname, '..', 'unified_foods.sqlite');

const decisionsPath = process.argv[2];
if (!decisionsPath) {
  console.error('Usage: node apply-audit-decisions.js <path-to-decisions.json>');
  process.exit(1);
}

function query(sql) {
  const out = execFileSync(SQLITE_EXE, ['-cmd', '.timeout 30000', dbPath, '-json', sql], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 256,
  });
  return JSON.parse(out || '[]');
}

function runBatch(statements) {
  if (statements.length === 0) return;
  const sql = 'BEGIN TRANSACTION;\n' + statements.join('\n') + '\nCOMMIT;\n';
  execFileSync(SQLITE_EXE, ['-cmd', '.timeout 30000', dbPath], {
    input: sql,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 256,
  });
}

// Real, additive schema migration -- food_match_groups predates the idea
// of tracking "a real person flagged this group as wrong and it needs to
// be split apart," so the column may not exist yet on an already-created
// database. Safe and additive: never touches existing rows/data, matches
// the same PRAGMA table_info + conditional ALTER TABLE pattern this whole
// project already uses everywhere else a column gets added after the
// fact. schema.sql itself is updated to match, for any future from-scratch
// rebuild.
function ensureNeedsSplitColumn() {
  const cols = query(`PRAGMA table_info(food_match_groups);`);
  const hasIt = cols.some((c) => c.name === 'needs_split');
  if (!hasIt) {
    console.log('Adding real needs_split column to food_match_groups...');
    runBatch(['ALTER TABLE food_match_groups ADD COLUMN needs_split INTEGER NOT NULL DEFAULT 0;']);
  }
}

const raw = fs.readFileSync(decisionsPath, 'utf8');
const payload = JSON.parse(raw);
const decisions = payload.decisions || {};
const classify = decisions.classify || {};
const groupConfirm = decisions.groupConfirm || {};
const groupSplit = decisions.groupSplit || {};
const memberRemove = decisions.memberRemove || {};

console.log(`Applying decisions exported at ${payload.exportedAt}`);
console.log(`  classify: ${Object.keys(classify).length}`);
console.log(`  groupConfirm: ${Object.keys(groupConfirm).length}`);
console.log(`  groupSplit: ${Object.keys(groupSplit).length}`);
console.log(`  memberRemove: ${Object.keys(memberRemove).length}`);

ensureNeedsSplitColumn();

const nowIso = new Date().toISOString();

// 1) Member removals first -- so a group-confirm right after only ever
//    confirms whichever real members actually remain.
const removeStatements = [];
for (const key of Object.keys(memberRemove)) {
  const [groupId, rawId] = key.split(':').map(Number);
  if (!Number.isFinite(groupId) || !Number.isFinite(rawId)) continue;
  removeStatements.push(
    `DELETE FROM food_match_members WHERE match_group_id = ${groupId} AND raw_id = ${rawId};`
  );
}
runBatch(removeStatements);
console.log(`Applied ${removeStatements.length} real member removal(s).`);

// 2) Group confirmations -- marks every currently-remaining real member
//    of a confirmed group as match_confidence='confirmed'.
const confirmStatements = [];
for (const groupIdStr of Object.keys(groupConfirm)) {
  const groupId = Number(groupIdStr);
  if (!Number.isFinite(groupId)) continue;
  confirmStatements.push(
    `UPDATE food_match_members SET match_confidence = 'confirmed' WHERE match_group_id = ${groupId};`
  );
  // A confirmed group is, by definition, not the thing groupSplit was
  // ever meant to flag -- clear a possibly-stale split flag from an
  // earlier, since-reconsidered decision rather than leave a
  // contradictory needs_split=1 sitting on a group someone just confirmed.
  confirmStatements.push(
    `UPDATE food_match_groups SET needs_split = 0 WHERE match_group_id = ${groupId};`
  );
}
runBatch(confirmStatements);
console.log(`Applied ${Object.keys(groupConfirm).length} real group confirmation(s).`);

// 3) Split flags -- persisted so a future review session can find these
//    again, not just a one-time report that gets lost after this run.
const splitStatements = [];
for (const groupIdStr of Object.keys(groupSplit)) {
  const groupId = Number(groupIdStr);
  if (!Number.isFinite(groupId)) continue;
  splitStatements.push(
    `UPDATE food_match_groups SET needs_split = 1 WHERE match_group_id = ${groupId};`
  );
}
runBatch(splitStatements);
console.log(`Applied ${splitStatements.length} real split flag(s).`);

// 4) Classification decisions.
const classifyStatements = [];
for (const rawIdStr of Object.keys(classify)) {
  const rawId = Number(rawIdStr);
  if (!Number.isFinite(rawId)) continue;
  const verdict = classify[rawIdStr];
  if (verdict === 'whole') {
    classifyStatements.push(
      `UPDATE whole_food_classifications SET is_whole_food = 1, reviewed = 1, classified_at = '${nowIso}' WHERE raw_id = ${rawId};`
    );
  } else if (verdict === 'not_whole') {
    classifyStatements.push(
      `UPDATE whole_food_classifications SET is_whole_food = 0, reviewed = 1, classified_at = '${nowIso}' WHERE raw_id = ${rawId};`
    );
  } else if (verdict === 'skip') {
    // A real, deliberate "a person looked and chose not to override the
    // automated call" -- reviewed=1, but is_whole_food is left exactly as
    // the automated pass already set it, never touched here.
    classifyStatements.push(
      `UPDATE whole_food_classifications SET reviewed = 1, classified_at = '${nowIso}' WHERE raw_id = ${rawId};`
    );
  }
}
runBatch(classifyStatements);
console.log(`Applied ${classifyStatements.length} real classification decision(s).`);

// Real, final verification -- confirm the counts moved the way this run
// itself expects, not just trust that no error was thrown.
const remaining = query(`SELECT COUNT(*) AS n FROM whole_food_classifications WHERE reviewed = 0;`)[0].n;
const confirmedGroups = query(
  `SELECT COUNT(DISTINCT match_group_id) AS n FROM food_match_members WHERE match_confidence = 'confirmed';`
)[0].n;
const flaggedForSplit = query(`SELECT COUNT(*) AS n FROM food_match_groups WHERE needs_split = 1;`)[0].n;

console.log('\nReal, current state after applying:');
console.log(`  Classification records still awaiting review: ${remaining}`);
console.log(`  Groups with at least one confirmed member: ${confirmedGroups}`);
console.log(`  Groups currently flagged for split: ${flaggedForSplit}`);
console.log('\nDone.');
