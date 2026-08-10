// Exports a real, compact JSON snapshot of the current unified_foods.sqlite
// for the review audit tool -- both halves of what's still awaiting a real
// person's decision: whole-food classifications and cross-source match
// groups. Short keys deliberately, to keep the embedded payload small
// (this becomes part of a real, published Artifact page with a real size
// ceiling) -- documented here once rather than per-field in the tool itself.
//
// classify records: { i: raw_id, n: name (english if real, else original),
//   o: name_original (only included when it differs from n, to save space),
//   s: source_code, c: auto_confidence, r: rule_matched, w: is_whole_food (0/1/null) }
//
// match groups: { g: match_group_id, n: canonical_english_name,
//   rs: is_region_specific (0/1),
//   m: [ { i: raw_id, n: name_english||name_original, s: source_code, mm: match_method } ] }

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const SQLITE_EXE =
  process.env.SQLITE_EXE ||
  'C:/Users/TonyR/AppData/Local/Android/Sdk/platform-tools/sqlite3.exe';
const dbPath = path.resolve(__dirname, '..', 'unified_foods.sqlite');

function query(sql) {
  const out = execFileSync(SQLITE_EXE, ['-cmd', '.timeout 30000', dbPath, '-json', sql], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 256,
  });
  return JSON.parse(out || '[]');
}

console.log('Querying real classification rows...');
const classifyRows = query(`
  SELECT rf.raw_id AS i, rf.name_english AS ne, rf.name_original AS no,
         rf.source_code AS s, wfc.auto_confidence AS c, wfc.rule_matched AS r,
         wfc.is_whole_food AS w
  FROM raw_foods rf
  JOIN whole_food_classifications wfc ON wfc.raw_id = rf.raw_id
  WHERE wfc.reviewed = 0
  ORDER BY wfc.auto_confidence ASC, rf.name_english, rf.name_original;
`);

const classify = classifyRows.map((r) => {
  const n = r.ne || r.no;
  const rec = { i: r.i, n, s: r.s, c: r.c, r: r.r, w: r.w };
  if (r.no && r.no !== n) rec.o = r.no;
  return rec;
});

console.log(`Real classification records: ${classify.length}`);

console.log('Querying real match groups...');
const groupRows = query(`
  SELECT match_group_id AS g, canonical_english_name AS n, is_region_specific AS rs
  FROM food_match_groups
  ORDER BY is_region_specific ASC, match_group_id ASC;
`);
const memberRows = query(`
  SELECT m.match_group_id AS g, rf.raw_id AS i, rf.name_english AS ne,
         rf.name_original AS no, rf.source_code AS s, m.match_method AS mm
  FROM food_match_members m
  JOIN raw_foods rf ON rf.raw_id = m.raw_id
  ORDER BY m.match_group_id;
`);

const membersByGroup = new Map();
for (const m of memberRows) {
  if (!membersByGroup.has(m.g)) membersByGroup.set(m.g, []);
  membersByGroup.get(m.g).push({ i: m.i, n: m.ne || m.no, s: m.s, mm: m.mm });
}

const groups = groupRows.map((g) => ({
  g: g.g,
  n: g.n,
  rs: g.rs,
  m: membersByGroup.get(g.g) || [],
}));

console.log(`Real match groups: ${groups.length} (${groups.filter((g) => g.rs === 0).length} matched, ${groups.filter((g) => g.rs === 1).length} region-specific)`);

const sources = query(`SELECT source_code AS s, display_name AS n, country_or_region AS c, language AS l FROM sources ORDER BY display_name;`);

const data = { classify, groups, sources, exportedAt: new Date().toISOString() };
const json = JSON.stringify(data);
const outPath = path.resolve(__dirname, '..', 'audit-tool', 'audit-data.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, json);
console.log(`Wrote ${outPath}, ${(json.length / 1024 / 1024).toFixed(2)} MB.`);
