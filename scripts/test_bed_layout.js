// Checks lib/bedLayout.ts (I8): units and the grid, reading a spacing out of
// every growing guide, snapping and keeping a patch inside its area, the
// plants counted in a patch, overlaps and taps, and every sentence swept for
// verdict words, dashes and "real". Also checks garden_layout travels quietly
// in the sync change list and is cleared when a planting is deleted.
// Run: node scripts/test_bed_layout.js
const fs = require('fs');
/* global __dirname */
const path = require('path');
const ts = require('typescript');

const cache = {};
function load(file) {
  if (cache[file]) return cache[file];
  const src = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  const mod = { exports: {} };
  cache[file] = mod.exports;
  const allowed = { './plantNutrients': 'lib/plantNutrients.ts', './cropProblems': 'lib/cropProblems.ts' };
  new Function('module', 'exports', 'require', out.outputText)(mod, mod.exports, (name) => {
    if (allowed[name]) return load(allowed[name]);
    throw new Error(`${file} imported ${name}, which this test does not allow`);
  });
  cache[file] = mod.exports;
  return mod.exports;
}

const bl = load('lib/bedLayout.ts');
const guides = load('lib/cropGuides.ts');

let failures = 0;
function ok(label, condition, detail) {
  if (!condition) {
    failures++;
    console.log(`FAIL ${label}${detail ? `\n  ${detail}` : ''}`);
  }
}
const near = (a, b) => Math.abs(a - b) < 1e-6;

// Units and the grid.
ok('one foot', near(bl.unitToCm(1, 'feet'), 30.48));
ok('one metre', near(bl.unitToCm(1, 'meters'), 100));
ok('round trip feet', near(bl.cmToUnit(bl.unitToCm(4, 'feet'), 'feet'), 4));
ok('grid feet is half a foot', near(bl.gridStepCm('feet'), 15.24));
ok('grid metres is 10 cm', bl.gridStepCm('meters') === 10);
const size = bl.areaSizeCm(3, 1.2, 'meters');
ok('area size', size && near(size.across, 300) && near(size.down, 120));
ok('no width, no plan', bl.areaSizeCm(3, null, 'meters') === null);
ok('zero length, no plan', bl.areaSizeCm(0, 1, 'feet') === null);
ok('no unit reads as metres', near(bl.areaSizeCm(2, 1, null).across, 200));

// Spacing.
const s1 = bl.parseSpacing('45 to 60 cm apart');
ok('45 to 60 cm', s1 && s1.lowCm === 45 && s1.highCm === 60);
const s2 = bl.parseSpacing('1.2 to 1.5 metres apart');
ok('1.2 to 1.5 metres', s2 && near(s2.lowCm, 120) && near(s2.highCm, 150));
const s3 = bl.parseSpacing('From 1.5 metres for dwarf rootstocks to 6');
ok('from 1.5 metres', s3 && near(s3.lowCm, 150) && near(s3.highCm, 150));
ok('one plant fills a pot gives nothing', bl.parseSpacing('One plant fills a large pot.') === null);
ok('empty gives nothing', bl.parseSpacing('') === null && bl.parseSpacing(null) === null);
let parsed = 0;
for (const guide of guides.CROP_GUIDES) {
  const sp = bl.parseSpacing(guide.spacing);
  if (sp) {
    parsed++;
    ok(`${guide.name}: spacing in a sensible range`, sp.lowCm >= 1 && sp.highCm <= 2000 && sp.lowCm <= sp.highCm, guide.spacing);
  }
}
ok('most guides give a spacing the plan can use', parsed >= guides.CROP_GUIDES.length * 0.8, `${parsed} of ${guides.CROP_GUIDES.length}`);
console.log(`spacing read from ${parsed} of ${guides.CROP_GUIDES.length} growing guides`);

// Snapping, clamping, new patches.
ok('snap rounds', bl.snapToGrid(26, 10) === 30 && bl.snapToGrid(2, 10) === 10);
ok('position snaps down', bl.snapPosition(29, 10) === 20 && bl.snapPosition(-5, 10) === 0);
const c = bl.clampPatch({ plantingId: 'a', x: 280, y: -10, w: 50, h: 500 }, 300, 120);
ok('clamped inside', c.x === 250 && c.y === 0 && c.w === 50 && c.h === 120);
const np = bl.newPatch('a', 123, 47, { lowCm: 45, highCm: 60 }, 10, 300, 120);
ok('new patch one plant square on the grid', np.x === 120 && np.y === 40 && np.w === 50 && np.h === 50);
const np2 = bl.newPatch('a', 295, 115, null, 10, 300, 120);
ok('new patch with no spacing is one square, kept inside', np2.w === 10 && np2.x === 290 && np2.y === 110);

// Plants in a patch.
ok('100 by 50 at 25 holds 8', bl.plantPoints({ plantingId: 'a', x: 0, y: 0, w: 100, h: 50 }, 25).length === 8);
ok('too small holds none', bl.plantPoints({ plantingId: 'a', x: 0, y: 0, w: 20, h: 50 }, 25).length === 0);
const pts = bl.plantPoints({ plantingId: 'a', x: 10, y: 10, w: 60, h: 30 }, 30);
ok('points centred inside', pts.length === 2 && pts.every((p) => p.x > 10 && p.x < 70 && p.y > 10 && p.y < 40));

// Overlaps and taps.
const A = { plantingId: 'A', x: 0, y: 0, w: 50, h: 50 };
const B = { plantingId: 'B', x: 40, y: 40, w: 50, h: 50 };
const C = { plantingId: 'C', x: 50, y: 0, w: 50, h: 50 };
ok('A and B overlap', bl.patchesOverlap(A, B));
ok('touching edges do not overlap', !bl.patchesOverlap(A, C));
ok('tap finds the top patch', bl.patchAt([A, B], 45, 45).plantingId === 'B');
ok('tap on nothing', bl.patchAt([A, B], 200, 200) === null);

// Wording.
ok('cm', bl.formatLength(45, 'meters') === '45 cm');
ok('m', bl.formatLength(120, 'meters') === '1.2 m');
ok('ft', bl.formatLength(45.72, 'feet') === '1.5 ft');
ok('spacing range', bl.formatSpacing({ lowCm: 45, highCm: 60 }, 'meters') === '45 to 60 cm');
const lines = bl.describePatch({ patch: { plantingId: 'a', x: 0, y: 0, w: 100, h: 50 }, unit: 'meters', spacing: { lowCm: 25, highCm: 30 }, overlapsWith: ['Lettuce', 'Kale', 'Peas'] });
ok('covers', lines[0] === 'Covers 1 m across by 50 cm down.', lines[0]);
ok('room for', lines[1] === 'Room for about 8 plants at 25 cm apart, the closest its growing guide gives (25 to 30 cm).', lines[1]);
ok('overlaps', lines[2] === 'Overlaps Lettuce, Kale and Peas.', lines[2]);
const small = bl.describePatch({ patch: { plantingId: 'a', x: 0, y: 0, w: 10, h: 10 }, unit: 'meters', spacing: { lowCm: 45, highCm: 45 }, overlapsWith: [] });
ok('too small sentence', small[1] === 'Smaller than the 45 cm its growing guide gives for one plant.' && small.length === 2, small[1]);
const one = bl.describePatch({ patch: { plantingId: 'a', x: 0, y: 0, w: 50, h: 50 }, unit: 'meters', spacing: { lowCm: 45, highCm: 45 }, overlapsWith: [] });
ok('one plant singular', /about 1 plant at/.test(one[1]), one[1]);
const none = bl.describePatch({ patch: A, unit: 'feet', spacing: null, overlapsWith: [] });
ok('no spacing sentence', /gives no spacing/.test(none[1]));

// Fitting on screen.
ok('scale by width', near(bl.planScale(300, 120, 300, 420), 1));
ok('scale by height', near(bl.planScale(100, 1000, 300, 420), 0.42));
ok('no room, no scale', bl.planScale(100, 100, 0, 420) === 0);
ok('grid lines kept down', bl.gridLineEvery(300, 10) === 1 && 3000 / 10 / bl.gridLineEvery(3000, 10) <= 40);

// Sentence sweep, the module and the screen.
const sentences = [bl.LAYOUT_INTRO, bl.LAYOUT_NO_SIZE, bl.LAYOUT_PAST_NOTE, ...lines, ...small, ...none];
const componentText = fs.readFileSync(path.join(__dirname, '..', 'components/BedLayoutSection.tsx'), 'utf8');
for (const m of componentText.matchAll(/'([A-Z][^'\n]{12,})'|`([A-Z][^`\n]{12,})`|>([A-Z][^<>{}\n]{6,})</g)) sentences.push(m[1] || m[2] || m[3]);
const forbidden = /\b(ideal|optimal|perfect|best|worst|too (?:close|crowded|many|few|small|big)|wrong|bad|good|should|must|real|genuinely?)\b|—|–| -- /i;
for (const s of sentences) ok(`sentence free of verdicts and dashes: ${s}`, !forbidden.test(s), s);

// Sync and cleanup.
const changes = fs.readFileSync(path.join(__dirname, '..', 'lib/snapshotChanges.ts'), 'utf8');
ok('garden_layout counted quietly under plantings', /garden_plantings'\],\s*quiet:\s*\[[^\]]*'garden_layout'/.test(changes));
const db = fs.readFileSync(path.join(__dirname, '..', 'lib/db.ts'), 'utf8');
ok('garden_layout table exists', /CREATE TABLE IF NOT EXISTS garden_layout \(/.test(db));
ok('deleting a planting clears its patch', /DELETE FROM garden_layout WHERE planting_id = \?', id\);\r?\n\s*await db\.runAsync\('DELETE FROM garden_plantings WHERE id = \?'/.test(db));

if (failures) {
  console.log(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log('bed layout: all checks passed');
