// Checks lib/householdPlan.ts: who is at the table for a meal, how many
// servings a shared dish is, which dishes fit each person, who needs a plate
// of their own, the chewing words, the day targets a gap side is chosen
// against, and that no sentence promises safety or passes a verdict.
// Run: node scripts/test_household_plan.js
const fs = require('fs');
/* global __dirname */
const path = require('path');
const ts = require('typescript');

function transpile(file, requireFn) {
  const src = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', out.outputText)(mod, mod.exports, requireFn);
  return mod.exports;
}

const restrictions = transpile('lib/foodRestrictions.ts', (name) => {
  throw new Error(`foodRestrictions.ts imported ${name}`);
});
const types = transpile('lib/digest/types.ts', (name) => {
  throw new Error(`digest/types.ts imported ${name}`);
});
const plan = transpile('lib/householdPlan.ts', (name) => {
  if (name === './foodRestrictions') return restrictions;
  if (name === './digest/types') return types;
  throw new Error(`householdPlan.ts imported ${name}`);
});

let failures = 0;
function ok(label, condition, detail) {
  if (!condition) {
    failures += 1;
    console.log(`FAIL ${label}${detail !== undefined ? `: ${JSON.stringify(detail)}` : ''}`);
  }
}

const FORBIDDEN = /\b(safe|unsafe|bad|good for|should|must|healthy|unhealthy|real|genuine|genuinely|guarantee)\b|[–—]| -- /i;

function eater(overrides) {
  return {
    id: 'x',
    name: 'X',
    isYou: false,
    conditionCodes: [],
    dietTags: [],
    allergies: [],
    restrictions: [],
    portion: 'regular',
    soft: false,
    awayMeals: [],
    livesFrom: null,
    livesUntil: null,
    ageGroup: null,
    sex: null,
    ...overrides,
  };
}

const you = eater({ id: plan.YOU_EATER_ID, name: 'You', isYou: true });
const sam = eater({ id: 'sam', name: 'Sam', dietTags: ['Vegan'], portion: 'smaller', ageGroup: '4to8', awayMeals: ['lunch'] });
const ada = eater({ id: 'ada', name: 'Ada', allergies: ['peanut'], soft: true, portion: 'larger', livesFrom: '2026-10-01', livesUntil: '2026-12-31', ageGroup: '71plus', sex: 'female' });

// Who is home.
ok('you are always home', plan.isHomeFor({ ...you, awayMeals: ['lunch'] }, '2026-09-27', 'lunch'));
ok('away meal leaves them out', !plan.isHomeFor(sam, '2026-09-27', 'lunch'));
ok('home for the others', plan.isHomeFor(sam, '2026-09-27', 'dinner'));
ok('before moving in', !plan.isHomeFor(ada, '2026-09-30', 'dinner'));
ok('on the day moving in', plan.isHomeFor(ada, '2026-10-01', 'dinner'));
ok('on the last day', plan.isHomeFor(ada, '2026-12-31', 'dinner'));
ok('after moving out', !plan.isHomeFor(ada, '2027-01-01', 'dinner'));
ok('no date counts them home', plan.isHomeFor(ada, undefined, 'dinner'));
ok('eatersAt', plan.eatersAt([you, sam, ada], '2026-10-05', 'lunch').map((e) => e.id).join() === 'you,ada');

// Servings.
ok('servings one each plus portions', plan.servingsFor([you, sam, ada]) === 3, plan.servingsFor([you, sam, ada]));
ok('servings you alone', plan.servingsFor([you]) === 1);
ok('servings rounds to a half', plan.servingsFor([you, sam]) === 1.5);
ok('portion factor unknown', plan.portionFactor('huge') === 1);

// Fit.
const always = () => true;
const vegan = { dietTags: ['Vegan'], ingredientText: 'lentils, carrots, olive oil' };
const beef = { dietTags: ['Omnivore'], ingredientText: 'beef, onion' };
const satay = { dietTags: ['Vegan'], ingredientText: 'tofu, peanut butter, lime' };
ok('vegan fits vegan', plan.eaterFits(sam, vegan, always));
ok('beef misses vegan', !plan.eaterFits(sam, beef, always));
ok('peanut allergy', !plan.eaterFits(ada, satay, always));
ok('no allergy word fits', plan.eaterFits(ada, vegan, always));
ok('conditions checked', !plan.eaterFits(eater({ conditionCodes: ['celiac'] }), vegan, () => false));
ok('no conditions skips the check', plan.eaterFits(eater({}), vegan, () => false));
const alphaGal = eater({ restrictions: ['alpha_gal'] });
ok('restriction checked', !plan.eaterFits(alphaGal, beef, always));

// Covering the table.
const dishes = [vegan, beef, satay];
const fits = (e, dish) => plan.eaterFits(e, dish, always);
const all = plan.coverTable([you, sam, ada], dishes, fits);
ok('shared dish fits all when one does', all.ownPlate.length === 0 && all.matching.length === 1 && all.matching[0] === vegan);
const onlyBeef = plan.coverTable([you, sam], [beef], fits);
ok('vegan left for own plate', onlyBeef.ownPlate.map((e) => e.id).join() === 'sam' && onlyBeef.covered.map((e) => e.id).join() === 'you');
const noneForYou = plan.coverTable([you], [], fits);
ok('you are never left out', noneForYou.covered.length === 1 && noneForYou.ownPlate.length === 0);

// Chewing words.
ok('whole almonds', plan.hardToChewWords('1 cup whole almonds').includes('whole nuts'));
ok('almond butter is not chewing', plan.hardToChewWords('2 tbsp almond butter').length === 0, plan.hardToChewWords('2 tbsp almond butter'));
ok('ground flax is not chewing', plan.hardToChewWords('1 tbsp ground flax seeds').length === 0);
ok('chia seeds', plan.hardToChewWords('chia seeds, oat milk').includes('seeds'));
ok('steak', plan.hardToChewWords('sirloin steak').includes('a tough cut of meat'));
ok('soft soup has none', plan.hardToChewWords('butternut squash, stock, cream').length === 0);

// Day targets.
const adult = plan.keyTargetsFor({ ageGroup: null, sex: null });
ok('adult iron higher of two', adult.find((t) => t.code === 'iron').amount === 18);
ok('child calcium', plan.keyTargetsFor({ ageGroup: '4to8', sex: null }).find((t) => t.code === 'calcium').amount === 1000);
ok('older woman calcium', plan.keyTargetsFor({ ageGroup: '71plus', sex: 'female' }).find((t) => t.code === 'calcium').amount === 1200);
const full = { calcium: 1000, iron: 18, vitamin_d: 15, protein: 60, fiber_total: 40, vitamin_b12: 3 };
ok('no gap when every target met', plan.shortestTarget(eater({}), full, 3) === null);
const lowD = { ...full, vitamin_d: 1 };
const gap = plan.shortestTarget(eater({}), lowD, 3);
ok('finds vitamin D', gap && gap.target.code === 'vitamin_d', gap);
const twoMeals = plan.shortestTarget(eater({}), { ...full, calcium: 300 }, 2);
ok('scaled to meals home', twoMeals && twoMeals.target.code === 'calcium' && Math.abs(twoMeals.share - 0.45) < 0.01, twoMeals);

// Sentences.
ok('you alone says nothing', plan.describeHousehold([you]) === '');
const described = plan.describeHousehold([you, sam, ada]);
ok('names Sam', described.includes('Sam (breakfast and dinner only)'), described);
ok('names Ada dates', described.includes('Ada, living here 2026-10-01 to 2026-12-31'), described);
ok('joinNames', plan.joinNames(['you', 'Sam', 'Ada']) === 'you, Sam and Ada');
for (const text of [described, ...plan.PORTION_CHOICES.map((c) => c.label), ...plan.AGE_GROUP_CHOICES.map((c) => c.label)]) {
  ok(`forbidden words: ${text}`, !FORBIDDEN.test(text));
}

// The generator's own sentences, read from its source.
const generator = fs.readFileSync(path.join(__dirname, '..', 'lib/dailyMealPlan.ts'), 'utf8');
const start = generator.indexOf('async function generateHouseholdDay');
const body = generator.slice(start, generator.indexOf('\nexport', start));
const sentences = [...body.matchAll(/`([^`]*)`/g)].map((m) => m[1]).filter((s) => / /.test(s));
ok('generator sentences found', sentences.length >= 4, sentences.length);
for (const sentence of sentences) ok(`generator sentence: ${sentence}`, !FORBIDDEN.test(sentence));

if (failures > 0) {
  console.log(`${failures} failed`);
  process.exit(1);
}
console.log('test_household_plan: all passed');
