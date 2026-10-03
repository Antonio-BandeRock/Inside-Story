// Checks photos on plantings, areas, harvests and compost piles (I13): each
// of the four records shows a photo row, deleting it removes its photos, and
// removing one that has photos asks first through usePhotoRemovalConfirm,
// with the sentence from lib/media.ts that a money entry uses too (J4).
// Run: node scripts/test_garden_photos.js
const fs = require('fs');
/* global __dirname */
const path = require('path');
const ts = require('typescript');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

let failures = 0;
function ok(label, condition, detail) {
  if (!condition) {
    failures++;
    console.log(`FAIL ${label}${detail ? `\n  ${detail}` : ''}`);
  }
}

// The sentence.
const src = read('lib/media.ts');
const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
const media = { exports: {} };
new Function('module', 'exports', 'require', out.outputText)(media, media.exports, () => ({}));
const say = media.exports.photosGoWithItSentence;
ok('none says nothing', say(0) === null && say(-1) === null && say(NaN) === null);
ok('one photo', say(1) === 'Its photo is removed with it.');
ok('several photos', say(3) === 'Its 3 photos are removed with it.');

// Each record: its photo row, its delete removing photos, and the ask.
const garden = read('app/(tabs)/garden.tsx');
const compost = read('components/CompostLens.tsx');
const db = read('lib/db.ts');
const compostDb = read('lib/compostDb.ts');
const records = [
  { kind: 'planting', screen: garden, deleteFn: /export async function deleteGardenPlanting[\s\S]*?removePhotosOf\('planting', id\)/, store: db },
  { kind: 'garden_area', screen: garden, deleteFn: /export async function deleteGardenPlot[\s\S]*?removePhotosOf\('garden_area', id\)/, store: db },
  { kind: 'harvest', screen: garden, deleteFn: /export async function deleteGardenHarvest[\s\S]*?removePhotosOf\('harvest', id\)/, store: db },
  { kind: 'compost_pile', screen: compost, deleteFn: /export async function deleteCompostPile[\s\S]*?removePhotosOf\('compost_pile', id\)/, store: compostDb },
];
for (const r of records) {
  ok(`${r.kind} shows a photo row`, new RegExp(`<RecordPhotos ownerKind="${r.kind}"`).test(r.screen));
  ok(`${r.kind} delete removes its photos`, r.deleteFn.test(r.store));
  ok(`${r.kind} removal asks first when it has photos`, new RegExp(`confirmRemoval\\(\\{\\s*owners: \\[[\\s\\S]{0,40}kind: '${r.kind}'`).test(r.screen));
}
ok('a planting counts its seed packet photos too', /kind: SEED_PACKET_OWNER_KIND, id: plantingId/.test(garden));

// Every confirmRemoval has its sheet rendered in the same component.
for (const [name, text] of [['garden.tsx', garden], ['CompostLens.tsx', compost]]) {
  const hooks = (text.match(/= usePhotoRemovalConfirm\(\)/g) || []).length;
  const sheets = (text.match(/\{photoRemovalSheet\}/g) || []).length;
  ok(`${name}: every hook renders its sheet`, hooks > 0 && hooks === sheets, `${hooks} hooks, ${sheets} sheets`);
}
ok('no delete call left outside the ask', !/onPress=\{\(\) => deleteGarden|onPress=\{deleteCompostPile/.test(garden + compost));

// One wording for photos going with a record.
const life = read('app/(tabs)/life.tsx');
ok('money entry uses the same sentence', /photosGoWithItSentence\(photos\)/.test(life) && !/'Its photo is removed with it\.'/.test(life));
const hook = read('components/usePhotoRemovalConfirm.tsx');
ok('hook removes in one tap when there are none', /if \(!message\) \{\s*await onRemove\(\);\s*return;/.test(hook));

if (failures) {
  console.log(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log('garden photos: all checks passed');
