// Runs the distinct-plants count in lib/eatingVariety.ts (G14, 2026-09-27).
//
// The rules checked:
//
//  1. Forms of one plant count once ("Apples, raw" and "Apple, frozen"),
//     kinds count apart ("Beans, black" and "Beans, kidney").
//  2. Only plant categories count; bread, pasta and meat do not, and an
//     entry with no category is counted as neither.
//  3. A week with nothing logged is a gap (null), never zero plants, and a
//     logged week with no plants in it is zero.
//  4. The earlier average leaves out a partial week, as band 1 does.
//  5. The sentences count and never judge: no "good", no target.
//
// Run with: node scripts/test_distinct_plants.js
// Exits non-zero on any failure.

/* global __dirname */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function loadModule(relPath) {
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    throw new Error(`unexpected import ${name}`);
  });
  return module.exports;
}

const V = loadModule('lib/eatingVariety.ts');

let failures = 0;
function check(label, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    failures++;
    console.log(`FAIL ${label}\n  expected ${e}\n  got      ${a}`);
  }
}

// 1. Names
const key = (name) => V.plantIdentity(name).key;
check('forms count once', key('Apples, raw, with skin'), key('Apple, frozen'));
check('kinds count apart', key('Beans, black, mature seeds, cooked') === key('Beans, kidney, raw'), false);
check('no commas', key('Curly kale raw'), 'curly kale');
check('berries', key('Blueberries, raw'), key('Blueberry, raw'));
check('tomatoes', key('Tomatoes, red, ripe, raw'), key('Tomato, red'));
check('asparagus kept', key('Asparagus, raw'), 'asparagus');
check('label', V.plantIdentity('Squash, winter, butternut, frozen').label, 'Squash, winter');
check('numbers are not a kind', key('Rice, 2% broken'), 'rice');

// 2 to 4. Weeks
const rec = (date, foodName, category) => ({
  date,
  foodKey: foodName.toLowerCase(),
  foodName,
  category,
  cookingMethod: null,
  packaged: 'home',
  gutSupportive: false,
  fermented: false,
});
const records = [
  // Oldest block, Sep 1 to Sep 3 (partial)
  rec('2026-09-02', 'Apples, raw', 'Fruit'),
  rec('2026-09-02', 'Oats', 'Grain'),
  rec('2026-09-02', 'Carrots, raw', 'Veg'),
  rec('2026-09-02', 'Leeks, raw', 'Veg'),
  // Sep 4 to Sep 10
  rec('2026-09-05', 'Apples, raw', 'Fruit'),
  rec('2026-09-06', 'Apple, baked', 'Fruit'),
  rec('2026-09-06', 'Lentils, red, boiled', 'Legume'),
  rec('2026-09-06', 'Bread, wholemeal', 'Baked'),
  rec('2026-09-06', 'Chicken, breast', 'Meat'),
  rec('2026-09-06', 'my mystery dish', null),
  // Sep 11 to Sep 17: nothing logged
  // Sep 18 to Sep 24: logged, no plants
  rec('2026-09-20', 'Chicken, breast', 'Meat'),
  // Sep 25 to Oct 1
  rec('2026-09-26', 'Spinach, raw', 'Veg'),
  rec('2026-09-27', 'Spinach, frozen, boiled', 'Veg'),
  rec('2026-09-27', 'Mushrooms, white, raw', 'Mushroom'),
  rec('2026-09-27', 'Seaweed, kelp', 'Algae'),
  rec('2026-09-28', 'Almonds', 'NutSeed'),
  rec('2026-09-28', 'Basil, fresh', 'Herbs'),
];
const inputs = {
  records,
  loggedDates: Array.from(new Set(records.map((r) => r.date))).sort(),
  startDate: '2026-09-01',
  endDate: '2026-10-01',
};
const weeks = V.buildWeeks(inputs.startDate, inputs.endDate, inputs.loggedDates);
const plants = V.summarizeDistinctPlants(inputs, weeks);
check('week values', plants.weeks.map((w) => w.value), [4, 2, null, 0, 5]);
check('partial first', plants.weeks[0].partial, true);
check('latest', plants.latest, 5);
check('earlier average skips partial and gap', [plants.earlierAverage, plants.earlierWeeksCounted], [1, 2]);
check('names', plants.latestNames, ['Spinach', 'Mushrooms, white', 'Seaweed, kelp', 'Almonds', 'Basil']);
check('across range', plants.distinctAcrossRange, 10);
check('gap weeks', plants.weeksWithoutLogging, 1);
check('uncounted', plants.uncounted, 1);
check('in the lens summary', V.summarizeEatingVariety(inputs, [], []).plants.latest, 5);

const empty = V.summarizeDistinctPlants({ records: [], loggedDates: [], startDate: '2026-09-01', endDate: '2026-09-07' },
  V.buildWeeks('2026-09-01', '2026-09-07', []));
check('empty is a gap', empty.latest, null);

// 5. Sentences
const sentences = [
  plants.headline,
  plants.gapNote,
  plants.method,
  empty.headline,
  V.describePlantsThisWeek(plants),
  V.describePlantsThisWeek(empty),
  V.describePlantsUncounted(1),
  V.describePlantsUncounted(3),
];
check('headline', plants.headline, '5 different plants counted in the most recent week, and an average of 1 over the 2 weeks before it.');
check('insights line', V.describePlantsThisWeek(plants), '5 different plants counted in the last seven days. The 2 weeks before averaged 1.');
const FORBIDDEN = /\b(good|great|best|healthy|healthier|should|goal|target|aim|only|just|well done|boost|real|genuine|genuinely)\b|[–—]| -- /i;
for (const sentence of sentences) {
  if (!sentence || FORBIDDEN.test(sentence)) {
    failures++;
    console.log(`FAIL sentence: ${sentence}`);
  }
}

if (failures) {
  console.log(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log('distinct plants: all checks passed');
