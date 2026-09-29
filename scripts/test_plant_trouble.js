// Checks lib/plantTrouble.ts (I25): every where-option lists nutrients that
// show there and look-alikes that exist, the note written on a planting,
// the wiring under each planting, and that nothing calls a paid service or
// claims a diagnosis.
//   node scripts/test_plant_trouble.js

/* global __dirname */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function read(rel) {
  return fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
}
function run(rel) {
  const js = ts.transpileModule(read(rel), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 } }).outputText;
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', js)(mod, mod.exports, () => ({}));
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

const t = run('lib/plantTrouble.ts');
const n = run('lib/plantNutrients.ts');
const byKey = Object.fromEntries(n.PLANT_NUTRIENTS.map((x) => [x.key, x]));
const alikes = new Set(n.NUTRIENT_LOOK_ALIKES.map((x) => x.heading));

// 1. Each place lists what shows there.
for (const option of t.TROUBLE_WHERE_OPTIONS) {
  const set = t.troubleFor(option.value);
  check(`${option.value} has something`, set.nutrients.length + set.lookAlikes.length > 0);
  for (const key of set.nutrients) check(`${option.value} nutrient ${key} exists`, !!byKey[key]);
  for (const heading of set.lookAlikes) check(`${option.value} look-alike "${heading}" exists`, alikes.has(heading));
}
for (const key of t.troubleFor('older').nutrients) check(`older ${key} shows on older`, byKey[key].showsOn === 'older');
for (const key of t.troubleFor('newer').nutrients) check(`newer ${key} shows on newer`, byKey[key].showsOn === 'newer');
for (const key of t.troubleFor('fruit').nutrients) {
  check(`fruit ${key} mentions fruit or roots`, /fruit|root|stem|heart|tomato/i.test(byKey[key].looks), byKey[key].looks);
}
for (const key of t.troubleFor('spots').nutrients) {
  check(`spots ${key} mentions spots or patches`, /spot|patch|speckl|mottl/i.test(byKey[key].looks), byKey[key].looks);
}
check('every nutrient reachable', n.PLANT_NUTRIENTS.every((x) => t.TROUBLE_WHERE_OPTIONS.some((o) => t.troubleFor(o.value).nutrients.includes(x.key))));
check('label', t.troubleWhereLabel('fruit') === 'The fruit, the flowers or the roots');

// 2. The note.
check('note', t.troubleNote('Blossom-end rot') === 'Looked like Blossom-end rot.');
check('note no double stop', t.troubleNote('Too dry or too wet. ') === 'Looked like Too dry or too wet.');
check('kind code', t.TROUBLE_EVENT_KIND === 'problem_seen');
check('kind is a built-in', /code: 'problem_seen', label: 'Something wrong seen'/.test(read('lib/growSetup.ts')));

// 3. Wiring.
const garden = read('app/(tabs)/garden.tsx');
const section = read('components/WhatIsWrongSection.tsx');
check('under each planting', /<WhatIsWrongSection\s+plantingId=\{planting\.id\}\s+plotId=\{plot\.id\}\s+guide=\{guide\}/.test(garden));
check('What was done reloads', /refreshKey=\{careRefresh\}/.test(garden) && /\[load, refreshKey\]/.test(read('components/PlantingEventsSection.tsx')));
check('writes the kind', /kind: TROUBLE_EVENT_KIND/.test(section));
check('lens through the shared opener', /openIdentifyService\(lens\)/.test(section));

// 4. Wording and cost.
const words = [t.TROUBLE_INTRO, t.TROUBLE_NO_CROP_INTRO, t.TROUBLE_CAUTION, t.TROUBLE_LENS_INTRO, t.TROUBLE_ASK_INTRO, ...t.TROUBLE_WHERE_OPTIONS.map((o) => o.label)].join(' ');
for (const banned of ['diagnosed', 'definitely', 'certainly', 'guaranteed', 'should', 'ideal', 'subscription', '—', '–', ' -- ']) {
  check(`wording free of ${JSON.stringify(banned)}`, !words.toLowerCase().includes(banned.toLowerCase()));
}
check('says not a diagnosis', /not a diagnosis/.test(t.TROUBLE_CAUTION));
check('no service called', !/fetch\(|api\.|apiKey|api-key/i.test(read('lib/plantTrouble.ts') + section));

console.log(`${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
