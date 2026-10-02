// Checks lib/cropCare.ts (I1): every crop in the growing guides has care
// tasks, every task carries a source and says where its days between came
// from, the repeat each one is added with, and every sentence swept for
// verdict words, dashes and garden chemicals.
// Run: node scripts/test_crop_care.js
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
  const allowed = { './cropGuides': 'lib/cropGuides.ts', './plantNutrients': 'lib/plantNutrients.ts', './cropProblems': 'lib/cropProblems.ts', './repeatRule': 'lib/repeatRule.ts' };
  new Function('module', 'exports', 'require', out.outputText)(mod, mod.exports, (name) => {
    if (allowed[name]) return load(allowed[name]);
    throw new Error(`${file} imported ${name}, which this test does not allow`);
  });
  cache[file] = mod.exports;
  return mod.exports;
}

const guides = load('lib/cropGuides.ts');
const care = load('lib/cropCare.ts');
const repeatRule = load('lib/repeatRule.ts');

let failures = 0;
function ok(label, condition, detail) {
  if (!condition) {
    failures++;
    console.log(`FAIL ${label}${detail ? `\n  ${detail}` : ''}`);
  }
}
const sentences = [];
const say = (text) => {
  if (text) sentences.push(text);
  return text;
};

const keys = new Set(guides.CROP_GUIDES.map((g) => g.key));
ok('crop-specific care names only crops that exist', care.CROPS_WITH_EXTRA_CARE.every((k) => keys.has(k)), care.CROPS_WITH_EXTRA_CARE.filter((k) => !keys.has(k)).join(', '));
ok('stated feeds name only crops that exist', care.CROPS_WITH_STATED_FEEDS.every((k) => keys.has(k)));

let taskCount = 0;
for (const guide of guides.CROP_GUIDES) {
  const tasks = care.careTasksFor(guide);
  taskCount += tasks.length;
  ok(`${guide.key} has care tasks`, tasks.length >= 3);
  const kinds = tasks.map((t) => t.kind);
  ok(`${guide.key} checks the soil rather than watering on a timer`, kinds.includes('soil') && !tasks.some((t) => /^water\b/i.test(t.title)));
  ok(`${guide.key} has a look for trouble and a mulch`, kinds.includes('look') && kinds.includes('mulch'));
  const feeds = tasks.filter((t) => t.kind === 'feed');
  if (guide.feeding === 'light' && !care.CROPS_WITH_STATED_FEEDS.includes(guide.key)) {
    ok(`${guide.key} is a light feeder with no feed task`, feeds.length === 0);
  } else {
    ok(`${guide.key} has one feed task`, feeds.length === 1, JSON.stringify(kinds));
  }
  ok(`${guide.key} task keys are distinct`, new Set(tasks.map((t) => t.key)).size === tasks.length);
  ok(`${guide.key} task titles are distinct`, new Set(tasks.map((t) => t.title)).size === tasks.length);
  for (const task of tasks) {
    ok(`${task.key} has a source`, task.sources.length > 0 && task.sources.every((s) => /^https:\/\//.test(s.url) && s.label));
    ok(`${task.key} days between are 0 to 365`, Number.isInteger(task.everyDays) && task.everyDays >= 0 && task.everyDays <= 365);
    ok(`${task.key} a once-only task waits for something`, task.everyDays > 0 || task.waitsFor !== null);
    ok(`${task.key} a waiting task is offered unticked`, care.tickedByDefault(task) === (task.waitsFor === null));
    say(task.title);
    // The soil note quotes the guide's water text word for word; that text is
    // swept by the growing guides' checks, so it is left out here.
    say(task.kind === 'soil' ? task.note.replace(guide.water, '') : task.note);
    say(care.describeBasis(task));
    say(care.describeWaitsFor(task));
    say(care.describeCadence(task.everyDays));
  }
}

// The four feeds a source gives, kept to that source.
const byKey = (k) => care.careTasksFor(guides.findCropGuideByKey(k));
const feedOf = (k) => byKey(k).find((t) => t.kind === 'feed');
ok('tomato feed fortnightly from fruit set, from the source', feedOf('tomato').everyDays === 14 && feedOf('tomato').basis === 'source' && /fruits have set/.test(feedOf('tomato').waitsFor));
ok('pepper feed weekly from flowering', feedOf('pepper').everyDays === 7 && /flowers/.test(feedOf('pepper').waitsFor));
ok('aubergine feed every two weeks from flowering', feedOf('aubergine').everyDays === 14 && /flowers/.test(feedOf('aubergine').waitsFor));
ok('a heavy feeder with no stated cadence says it is a starting point', feedOf('courgette').basis === 'startingPoint');
ok('a perennial is fed once a year with compost', feedOf('rhubarb').everyDays === 365 && /compost/i.test(feedOf('rhubarb').title));
ok('okra is picked every two days from the harvest', byKey('okra').some((t) => t.kind === 'pick' && t.everyDays === 2 && t.start === 'harvest'));
ok('radish is sown again every two weeks', byKey('radish').some((t) => t.kind === 'sow' && t.everyDays === 14));
ok('broad bean tips are pinched once', byKey('broadbeans').some((t) => t.kind === 'pinch' && t.everyDays === 0 && t.waitsFor));
ok('soil checks: warm 2, cool 3, perennial 7', byKey('tomato')[0].everyDays === 2 && byKey('lettuce')[0].everyDays === 3 && byKey('rhubarb')[0].everyDays === 7);

// Cadence words.
ok('cadence words', care.describeCadence(7) === 'Every week' && care.describeCadence(14) === 'Every two weeks' && care.describeCadence(21) === 'Every 3 weeks' && care.describeCadence(2) === 'Every 2 days' && care.describeCadence(365) === 'Once a year' && care.describeCadence(0) === 'Once');

// Dates and repeats.
const pick = byKey('okra').find((t) => t.kind === 'pick');
ok('a picking task starts on the first expected harvest', care.careFirstDate(pick, '2026-10-02', '2026-11-20') === '2026-11-20');
ok('a picking task already past its harvest start starts today', care.careFirstDate(pick, '2026-10-02', '2026-09-01') === '2026-10-02');
ok('a picking task with no expected harvest starts today', care.careFirstDate(pick, '2026-10-02', null) === '2026-10-02');
ok('a soil check starts today', care.careFirstDate(byKey('okra')[0], '2026-10-02', '2026-11-20') === '2026-10-02');
const ending = care.careRepeat(3, '2026-12-31', '2026-10-02');
ok('an annual series ends on its expected last harvest', ending.type === 'every_n_days' && ending.interval === 3 && ending.endType === 'until_date' && ending.until === '2026-12-31');
ok('a series with no end carries on', care.careRepeat(7, null, '2026-10-02').endType === 'indefinite');
ok('an end before the first day is ignored rather than empty', care.careRepeat(7, '2026-09-01', '2026-10-02').endType === 'indefinite');
ok('a once-only task does not repeat', care.careRepeat(0, null, '2026-10-02').type === 'none');
const dates = repeatRule.occurrencesOf('2026-10-02', ending, { through: '2026-10-12' }).map((o) => o.date);
ok('the repeat lands every three days', dates.join(',') === '2026-10-02,2026-10-05,2026-10-08,2026-10-11', dates.join(','));
ok('a perennial series has no end', care.careEndsOn(guides.findCropGuideByKey('rhubarb'), '2027-06-01') === null);
ok('an annual series ends on the expected last harvest', care.careEndsOn(guides.findCropGuideByKey('okra'), '2026-12-31') === '2026-12-31');
ok('care runs while to sow or growing only', care.careStillRuns('growing') && care.careStillRuns('planned') && !care.careStillRuns('harvested') && !care.careStillRuns('removed') && !care.careStillRuns('failed'));

// Typed days.
ok('typed days read', care.readEveryDays(' 5 ') === 5 && care.readEveryDays('0') === null && care.readEveryDays('400') === null && care.readEveryDays('2.5') === null && care.readEveryDays('') === null);

for (const n of [0, 1, 3]) say(care.describeAdded(n));
[care.CARE_INTRO, care.CARE_NO_CROP, care.CARE_LIGHT_FEEDER, care.CARE_STOPPED_NOTE].forEach(say);

// Words: no grading, no promise, no dashes, and no garden chemical.
const VERDICT = /\b(optimal|ideal|perfect|best|healthy|unhealthy|guaranteed|always works|correct|wrong way|bad|good)\b/i;
const CHEMICAL = /\b(miracle-gro|roundup|glyphosate|neonicotinoid|chlorpyrifos|metaldehyde|npk|10-10-10|synthetic|fungicide|pesticide|herbicide|growmore)\b/i;
for (const sentence of sentences) {
  ok(`no verdict words: ${sentence.slice(0, 70)}`, !VERDICT.test(sentence), sentence);
  ok(`no dashes: ${sentence.slice(0, 70)}`, !/[—–]| -- /.test(sentence), sentence);
  ok(`no garden chemicals: ${sentence.slice(0, 70)}`, !CHEMICAL.test(sentence), sentence);
  ok(`no "real" or "genuinely": ${sentence.slice(0, 70)}`, !/\b(real|genuine|genuinely)\b/i.test(sentence), sentence);
}
const component = fs.readFileSync(path.join(__dirname, '..', 'components', 'CropCareSection.tsx'), 'utf8');
for (const raw of component.match(/'[^'\n]{12,}'|>[^<>{}\n]{12,}</g) || []) {
  ok(`component has no verdict words: ${raw.slice(0, 70)}`, !VERDICT.test(raw), raw);
}

if (failures) {
  console.log(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log(`All crop care checks passed (${guides.CROP_GUIDES.length} crops, ${taskCount} tasks, ${sentences.length} sentences swept).`);
