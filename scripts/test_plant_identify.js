// Checks lib/plantIdentify.ts (I24): the percent reading, the links tried on
// each platform, the caption under a planting, and that the wording claims
// no certainty and names no paid service.
//   node scripts/test_plant_identify.js

/* global __dirname */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const file = path.join(__dirname, '..', 'lib', 'plantIdentify.ts');
const source = fs.readFileSync(file, 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 } }).outputText;
const mod = { exports: {} };
new Function('module', 'exports', 'require', js)(mod, mod.exports, require);
const p = mod.exports;

let failures = 0;
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    failures += 1;
    console.log('FAIL ' + name + '\n  expected ' + JSON.stringify(expected) + '\n  got      ' + JSON.stringify(actual));
  }
}

check('empty', p.readSurePercent('  '), { status: 'empty' });
check('whole', p.readSurePercent('87'), { status: 'percent', percent: 87 });
check('with sign', p.readSurePercent('87 %'), { status: 'percent', percent: 87 });
check('fraction', p.readSurePercent('0.87'), { status: 'percent', percent: 87 });
check('comma', p.readSurePercent('62,4'), { status: 'percent', percent: 62 });
check('hundred', p.readSurePercent('100'), { status: 'percent', percent: 100 });
check('over', p.readSurePercent('140'), { status: 'invalid' });
check('zero', p.readSurePercent('0'), { status: 'invalid' });
check('word', p.readSurePercent('very'), { status: 'invalid' });

const plantnet = p.identifyService('plantnet');
check('android tries the store then the page', p.identifyLinks(plantnet, 'android'), [
  'market://details?id=org.plantnet',
  'https://play.google.com/store/apps/details?id=org.plantnet',
]);
check('ios', p.identifyLinks(plantnet, 'ios'), ['https://apps.apple.com/app/plantnet/id600547573']);
check('computer', p.identifyLinks(plantnet, 'computer'), ['https://identify.plantnet.org/']);
check('unknown service', p.identifyService('picturethis'), null);

check('line with percent', p.identifiedLine('plantnet', 91), 'Named with Pl@ntNet, which said it was 91% sure.');
check('line without', p.identifiedLine('lens', null), 'Named with Google Lens.');
check('no line', p.identifiedLine(null, 50), null);

// Every sentence the person reads.
const words = [
  p.IDENTIFY_INTRO,
  p.IDENTIFY_COMPUTER_INTRO,
  p.IDENTIFY_CAUTION,
  p.SURE_RANGE_LINE,
  ...p.IDENTIFY_SERVICES.map((s) => s.note),
].join(' ');
for (const banned of ['certainly', 'definitely', 'guaranteed', 'always right', 'safe to eat', 'PictureThis', 'subscription', '—', '–', ' -- ']) {
  if (words.toLowerCase().includes(banned.toLowerCase())) {
    failures += 1;
    console.log('FAIL wording contains ' + JSON.stringify(banned));
  }
}
if (!/Never eat/.test(p.IDENTIFY_CAUTION)) {
  failures += 1;
  console.log('FAIL the caution no longer says never to eat a plant on an app’s word');
}
// No API is called: no key and no Pl@ntNet API host anywhere in the module.
if (/my-api\.plantnet|api\.plantnet|api-key|apiKey/i.test(source)) {
  failures += 1;
  console.log('FAIL lib/plantIdentify.ts mentions the Pl@ntNet API');
}

console.log(failures === 0 ? 'plant identify: all checks pass' : `plant identify: ${failures} failing`);
process.exit(failures === 0 ? 0 : 1);
