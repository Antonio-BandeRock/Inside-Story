// Checks lib/cropSymptoms.ts (I26): every crop problem is tagged with at
// least one known symptom and every tag names a problem that exists, each
// shortage listed under a symptom says it shows that way, every look-alike
// exists, the band is wired into Horticulture, and the wording claims no
// diagnosis and sends nothing off the phone.
//   node scripts/test_crop_symptoms.js

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

const cs = run('lib/cropSymptoms.ts');
const { CROP_PROBLEMS } = run('lib/cropProblems.ts');
const n = run('lib/plantNutrients.ts');
const { CROP_GUIDES } = run('lib/cropGuides.ts');
const keys = new Set(cs.SYMPTOMS.map((s) => s.key));
const byNutrient = Object.fromEntries(n.PLANT_NUTRIENTS.map((x) => [x.key, x]));
const alikes = new Set(n.NUTRIENT_LOOK_ALIKES.map((x) => x.heading));

// 1. Every problem tagged, every tag real.
let problemCount = 0;
for (const [crop, problems] of Object.entries(CROP_PROBLEMS)) {
  const tags = cs.CROP_PROBLEM_SYMPTOMS[crop] || {};
  for (const problem of problems) {
    problemCount += 1;
    const list = tags[problem.label];
    check(`${crop} "${problem.label}" tagged`, Array.isArray(list) && list.length > 0);
    for (const tag of list || []) check(`${crop} "${problem.label}" tag ${tag} known`, keys.has(tag));
  }
  for (const label of Object.keys(tags)) {
    check(`${crop} tag "${label}" names a problem`, problems.some((p) => p.label === label));
  }
}
for (const crop of Object.keys(cs.CROP_PROBLEM_SYMPTOMS)) check(`${crop} is a crop with problems`, !!CROP_PROBLEMS[crop]);
check('every crop guide has problems tagged', CROP_GUIDES.every((g) => !!cs.CROP_PROBLEM_SYMPTOMS[g.key]));
check('every symptom reaches a crop or a shortage', cs.SYMPTOMS.every((s) => s.nutrients.length > 0 || cs.cropsWithSymptom(s.key).length > 0));

// 2. Shortages listed under a symptom say they show that way.
const SAYS = {
  pu: /purple|red/i,
  sp: /spot|patch|speckl|mottl/i,
  ed: /edge|tip|burn/i,
  cu: /twist|distort|narrow|curl|small/i,
  wi: /wilt|die back/i,
  ro: /rot|crack|heart|stem/i,
  ha: /fruit|rot|pit|heart|ripen/i,
  fl: /flower/i,
  st: /stunt|small|slow/i,
};
for (const symptom of cs.SYMPTOMS) {
  for (const key of symptom.nutrients) {
    const nutrient = byNutrient[key];
    check(`${symptom.key} nutrient ${key} exists`, !!nutrient);
    if (!nutrient) continue;
    if (symptom.key === 'yo') check(`yo ${key} shows on older`, nutrient.showsOn === 'older');
    else if (symptom.key === 'yn') check(`yn ${key} shows on newer`, nutrient.showsOn === 'newer');
    else if (SAYS[symptom.key]) check(`${symptom.key} ${key} looks says so`, SAYS[symptom.key].test(nutrient.looks), nutrient.looks);
    else check(`${symptom.key} lists no nutrient`, false);
  }
  for (const heading of symptom.lookAlikes) check(`${symptom.key} look-alike "${heading}" exists`, alikes.has(heading));
  const sources = cs.symptomSources(symptom);
  check(`${symptom.key} has sources`, sources.length >= 2 && sources.every((s) => /^https:\/\//.test(s.url)));
}

// 3. Lookups.
const tomatoFruit = cs.cropProblemsFor('tomato', 'ha').map((p) => p.label);
check('tomato fruit trouble', tomatoFruit.includes('Blossom-end rot') && tomatoFruit.includes('Blotchy ripening'), tomatoFruit.join(', '));
check('tomato lower leaves', cs.cropProblemsFor('tomato', 'yo').map((p) => p.label).join() === 'Yellow bands on the lower leaves');
check('heading with crop', cs.symptomHeading(cs.findSymptom('yo'), 'Tomato') === 'What yellow lower leaves on tomato can be');
check('heading any crop', cs.symptomHeading(cs.findSymptom('yo'), null) === 'What yellow lower leaves can be');
check('crops with bolting', cs.cropsWithSymptom('bo').includes('lettuce'));

// 4. Wiring.
const section = read('components/CropGuideSection.tsx');
check('band first', section.indexOf('title="What Is Wrong With a Plant"') > 0 && section.indexOf('title="What Is Wrong With a Plant"') < section.indexOf('How to Grow Each Crop ('));
check('uses the index', /cropProblemsFor\(cropGuide\.key, symptom\.key\)/.test(section));
check('help mentions the band', /five bands at the top of this lens\. What Is Wrong With a Plant/.test(section));
check('RHS deficiencies exported', /export const RHS_DEFICIENCIES/.test(read('lib/plantNutrients.ts')));

// 5. Wording.
const words = [cs.SYMPTOM_GUIDE_INTRO, cs.SYMPTOM_GUIDE_CAUTION, cs.SYMPTOM_NO_CROP_LINE, ...cs.SYMPTOMS.flatMap((s) => [s.label, s.phrase, s.about])].join(' ');
for (const banned of ['diagnosed', 'definitely', 'certainly', 'guaranteed', 'ideal', 'subscription', ' real ', 'genuine', '—', '–', ' -- ']) {
  check(`wording free of ${JSON.stringify(banned)}`, !words.toLowerCase().includes(banned.toLowerCase()));
}
check('says not a diagnosis', /not a diagnosis/.test(cs.SYMPTOM_GUIDE_CAUTION));
check('says nothing leaves the phone', /Nothing leaves the phone/.test(cs.SYMPTOM_GUIDE_INTRO));
check('no colon in a label', cs.SYMPTOMS.every((s) => !s.label.includes(':')));
check('no service called', !/fetch\(|apiKey|api-key/i.test(read('lib/cropSymptoms.ts')));

console.log(`${problemCount} crop problems; ${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
