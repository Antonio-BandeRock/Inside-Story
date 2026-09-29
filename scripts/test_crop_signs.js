// Checks lib/cropSigns.ts (I26 reworked, 2026-09-29): every crop with signs
// is a crop guide and has a way to confirm it, every sign cites at least
// one page and picks from known symptoms, a nutrient named exists, the
// fixes name no bag or bottle, the wording claims no diagnosis, and the
// band in Horticulture starts from the crop.
//   node scripts/test_crop_signs.js           (the checks)
//   node scripts/test_crop_signs.js --links   (also fetch every cited page)

/* global __dirname */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function read(rel) {
  return fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
}
const cache = {};
function run(rel) {
  if (cache[rel]) return cache[rel];
  const js = ts.transpileModule(read(rel), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 } }).outputText;
  const mod = { exports: {} };
  cache[rel] = mod.exports;
  new Function('module', 'exports', 'require', js)(mod, mod.exports, (name) => {
    const base = name.replace(/^\.\//, 'lib/');
    return /^lib\//.test(base) ? run(base + '.ts') : {};
  });
  cache[rel] = mod.exports;
  return mod.exports;
}

let failures = 0;
let passes = 0;
function check(name, ok, detail) {
  if (ok) passes += 1;
  else {
    failures += 1;
    console.log('FAIL ' + name + (detail ? '\n     ' + detail : ''));
  }
}

const signs = run('lib/cropSigns.ts');
const { CROP_GUIDES } = run('lib/cropGuides.ts');
const { SYMPTOMS } = run('lib/cropSymptoms.ts');
const { PLANT_NUTRIENTS } = run('lib/plantNutrients.ts');
const symptomKeys = new Set(SYMPTOMS.map((s) => s.key));
const nutrientKeys = new Set(PLANT_NUTRIENTS.map((n) => n.key));
const guideKeys = new Set(CROP_GUIDES.map((g) => g.key));
const KINDS = new Set(signs.CROP_SIGN_KIND_ORDER);

const CHEMICAL = /chelat|general fertili[sz]er|Growmore|ammonium|urea|superphosphate|NPK|fungicide|pesticide|Epsom|sulphate of/i;
const DASH = /[–—]| -- /;
const FILLER = /\b(real|genuine|genuinely)\b/i;
const VERDICT = /\b(diagnos(is|ed|e)|definitely|certainly|guaranteed)\b/i;

const crops = signs.cropsWithSigns();
check('batch 1 crops present', ['tomato', 'hops', 'cannabis'].every((k) => crops.includes(k)), crops.join(', '));

const allUrls = new Set();
const texts = [];
for (const crop of crops) {
  check(`${crop} is a crop guide`, guideKeys.has(crop));
  const list = signs.CROP_SIGNS[crop];
  check(`${crop} has signs`, list.length >= 3);
  const confirm = signs.CROP_SIGN_CONFIRM[crop];
  check(`${crop} has a way to confirm`, !!confirm && /test/.test(confirm.text) && confirm.sources.length > 0);
  if (confirm) {
    confirm.sources.forEach((s) => allUrls.add(s.url));
    texts.push([`${crop} confirm`, confirm.text]);
  }
  const labels = new Set();
  for (const sign of list) {
    const id = `${crop} "${sign.label}"`;
    check(`${id} label unique`, !labels.has(sign.label));
    labels.add(sign.label);
    check(`${id} kind known`, KINDS.has(sign.kind));
    check(`${id} nutrient known`, !sign.nutrient || nutrientKeys.has(sign.nutrient));
    check(`${id} shortage names a nutrient`, sign.kind !== 'short' || !!sign.nutrient);
    check(`${id} has symptoms`, sign.where.length > 0 && sign.where.every((k) => symptomKeys.has(k)), sign.where.join());
    check(`${id} cites a page`, sign.sources.length > 0 && sign.sources.every((s) => /^https:\/\//.test(s.url) && s.label));
    check(`${id} cites no search`, sign.sources.every((s) => !/pubmed\.ncbi\.nlm\.nih\.gov\/\?term/.test(s.url)));
    check(`${id} looks written`, sign.looks.length >= 20);
    check(`${id} fix written`, sign.fix.length >= 40);
    for (const field of ['looks', 'why', 'fix']) {
      if (!sign[field]) continue;
      texts.push([`${id} ${field}`, sign[field]]);
      check(`${id} ${field} names no bag or bottle`, !CHEMICAL.test(sign[field]), sign[field]);
    }
    sign.sources.forEach((s) => allUrls.add(s.url));
  }
  // Every symptom offered for the crop lists something.
  for (const symptom of signs.cropSymptomChoices(crop)) {
    const count = signs.cropSignsFor(crop, symptom.key).length + signs.cropProblemsShowing(crop, symptom.key).length;
    check(`${crop} ${symptom.key} offered and answered`, count > 0);
  }
}
for (const crop of Object.keys(signs.CROP_SIGN_CONFIRM)) check(`${crop} confirm has signs`, crops.includes(crop));

texts.push(['intro', signs.CROP_SIGN_INTRO], ['batch', signs.CROP_SIGN_BATCH_LINE], ['caution', signs.CROP_SIGN_CAUTION]);
for (const [id, text] of texts) {
  check(`${id} no dash`, !DASH.test(text), text);
  check(`${id} no filler`, !FILLER.test(text), text);
  if (id !== 'caution') check(`${id} no verdict`, !VERDICT.test(text), text);
}
check('says not a diagnosis', /not a diagnosis/.test(signs.CROP_SIGN_CAUTION));
check('says nothing leaves the phone', /Nothing leaves the phone/.test(signs.CROP_SIGN_INTRO));
check('no service called', !/fetch\(|apiKey|api-key/i.test(read('lib/cropSigns.ts')));

// Lookups.
check('tomato fruit signs', signs.cropSignsFor('tomato', 'ha').some((s) => s.kind === 'water'));
check('hops zinc on curled leaves', signs.cropSignsFor('hops', 'cu').some((s) => s.nutrient === 'Zn'));
check('cannabis has no mimic', signs.cropSignsFor('cannabis', null).every((s) => s.kind !== 'mimic'));
check('heading', signs.cropSignHeading(SYMPTOMS.find((s) => s.key === 'yo'), 'Tomato') === 'What yellow lower leaves on tomato can be');

// Wiring: the crop is picked first, and only crops with signs are offered.
const section = read('components/CropGuideSection.tsx');
const cropPicker = section.indexOf('Which crop?');
const symptomPicker = section.indexOf('What do you see?');
check('crop picked first', cropPicker > 0 && symptomPicker > cropPicker);
check('offers crops with signs', /cropsWithSigns\(\)/.test(section));
check('no any crop', !/Any crop/.test(section));
check('adult side noted', /adult side/.test(read('lib/cropSigns.ts')));

async function links() {
  for (const url of allUrls) {
    try {
      const res = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0) Chrome/124' } });
      const body = await res.text();
      const title = (body.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1] || '';
      check(`link ${url}`, res.status === 200 && !/page not found/i.test(title), `${res.status} ${title.trim()}`);
    } catch (e) {
      check(`link ${url}`, false, e.message);
    }
  }
}

(async () => {
  if (process.argv.includes('--links')) await links();
  console.log(`${crops.length} crops, ${allUrls.size} cited pages; ${passes} passed, ${failures} failed`);
  process.exit(failures ? 1 : 0);
})();
