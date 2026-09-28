// Checks lib/mealVariety.ts, variety read at the level of whole meals: a
// week with nothing logged stays a gap, where each meal came from (eaten
// out as said, mostly from a package when half or more was bought ready),
// meals from the plan against meals decided on the day, the meals that came
// back most, the food groups not logged, the plants not eaten in four weeks
// that Home offers, and every sentence clear of verdicts.
// Run: node scripts/test_meal_variety.js
const fs = require('fs');
/* global __dirname */
const path = require('path');
const ts = require('typescript');

function load(file, deps = {}) {
  const src = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', out.outputText)(mod, mod.exports, (name) => {
    if (deps[name]) return deps[name];
    throw new Error(`${file} imported ${name}`);
  });
  return mod.exports;
}
const e = load('lib/eatingVariety.ts');
const v = load('lib/mealVariety.ts', { './eatingVariety': e });

let failures = 0;
function ok(label, condition, detail) {
  if (!condition) {
    failures += 1;
    console.log(`FAIL ${label}${detail !== undefined ? `: ${JSON.stringify(detail)}` : ''}`);
  }
}
const FORBIDDEN = /\b(safe|unsafe|bad|should|must|healthy|unhealthy|real|genuine|genuinely|best|great|well done|streak|too many|too few|not enough|poor|lacking)\b|[–—]| -- /i;
const sentences = [];
function clean(label, text) {
  if (text == null) return;
  sentences.push(text);
  ok(`${label} has no verdict words`, typeof text === 'string' && !FORBIDDEN.test(text), text);
}

function rec(date, mealId, foodName, fields = {}) {
  return {
    date,
    foodKey: `${foodName.length}|USDA`,
    foodName,
    category: 'Veg',
    cookingMethod: null,
    packaged: 'home',
    gutSupportive: false,
    fermented: false,
    mealId,
    mealType: 'lunch',
    ...fields,
  };
}
function meal(id, date, fields = {}) {
  return { id, date, mealType: 'lunch', name: 'Lentil soup', eatenOut: false, planned: false, ...fields };
}

// --- Where a meal came from -------------------------------------------------
{
  const m = meal('m1', '2026-09-01');
  ok('eaten out is what the person said', v.mealSource({ ...m, eatenOut: true }, [rec('2026-09-01', 'm1', 'Kale', { packaged: 'bought' })]) === 'out');
  ok('half bought reads as packaged', v.mealSource(m, [rec('d', 'm1', 'a', { packaged: 'bought' }), rec('d', 'm1', 'b', { packaged: 'home' })]) === 'packaged');
  ok('a jar in a home meal stays home', v.mealSource(m, [rec('d', 'm1', 'a', { packaged: 'bought' }), rec('d', 'm1', 'b'), rec('d', 'm1', 'c')]) === 'home');
  ok('nothing placed reads as could not tell', v.mealSource(m, [rec('d', 'm1', 'a', { packaged: 'unknown' })]) === 'unknown');
  ok('no items reads as could not tell', v.mealSource(m, []) === 'unknown');
}

// --- Plan against the day ----------------------------------------------------
{
  const meals = [
    meal('a', '2026-09-01', { planned: true }),
    meal('b', '2026-09-01', { planned: true, mealType: 'dinner' }),
    meal('c', '2026-09-02', { planned: false }),
    meal('d', '2026-09-03', { planned: true }),
    meal('e', '2026-09-03', { planned: false, mealType: 'dinner' }),
  ];
  const planned = v.summarizePlanned(meals);
  ok('planned count', planned.plannedMeals === 3, planned);
  ok('unplanned count', planned.unplannedMeals === 2 && planned.daysAllPlanned === 1 && planned.daysSomePlanned === 1 && planned.daysNonePlanned === 1, planned);
  clean('planned headline', planned.headline);
  clean('planned days line', planned.daysLine);
}

// --- Meals that came back ----------------------------------------------------
{
  const meals = [
    meal('a', '2026-09-01'),
    meal('b', '2026-09-02', { name: 'lentil soup' }),
    meal('c', '2026-09-02', { name: 'Lentil Soup', mealType: 'dinner' }),
    meal('d', '2026-09-03', { name: 'Omelette' }),
  ];
  const repeats = v.summarizeMealRepeats(meals);
  ok('names group regardless of case', repeats.top.length === 1 && repeats.top[0].times === 3, repeats.top);
  ok('days counted apart from times', repeats.top[0].days === 2, repeats.top[0]);
  ok('a meal eaten once is not listed', !repeats.top.some((entry) => /omelette/i.test(entry.name)));
  clean('repeat headline', repeats.headline);
  clean('repeat line', v.describeMealRepeat(repeats.top[0], repeats.daysLogged));
}

// --- Food groups -------------------------------------------------------------
{
  const groups = v.summarizeGroups([rec('d', 'm', 'Kale'), rec('d', 'm', 'Apple', { category: 'Fruit' }), rec('d', 'm', 'Kefir', { category: 'Dairy', fermented: true })]);
  ok('present groups found', groups.present.map((g) => g.label).join(',') === 'fruit,vegetables,fermented foods', groups.present);
  ok('missing groups listed', groups.missing.includes('mushrooms') && groups.missing.includes('grains'), groups.missing);
  clean('groups headline', groups.headline);
  clean('empty groups headline', v.summarizeGroups([]).headline);
}

// --- Plants not eaten lately -------------------------------------------------
{
  const today = '2026-09-27';
  const records = [
    rec('2026-08-01', 'o1', 'Beans, black', { category: 'Legume', foodKey: '11|USDA' }),
    rec('2026-08-05', 'o2', 'Beans, black', { category: 'Legume', foodKey: '11|USDA' }),
    rec('2026-07-10', 'o3', 'Beets, raw', { category: 'Veg', foodKey: '12|USDA' }),
    rec('2026-08-02', 'o4', 'Kale, raw', { category: 'Veg', foodKey: '13|USDA' }),
    rec('2026-09-20', 'r1', 'Kale, raw', { category: 'Veg', foodKey: '13|USDA' }),
    rec('2026-08-03', 'o5', 'grandmas greens', { category: 'Veg', foodKey: 'grandmas greens' }),
    rec('2026-04-01', 'o6', 'Parsnips, raw', { category: 'Veg', foodKey: '14|USDA' }),
    rec('2026-08-04', 'o7', 'Chicken, breast', { category: 'Meat', foodKey: '15|USDA' }),
  ];
  const plants = v.plantsNotLately(records, today);
  const names = plants.map((plant) => plant.name);
  ok('the most familiar comes first', names[0] === 'black beans', names);
  ok('a plant eaten this month is not offered', !names.some((name) => name.includes('kale')), names);
  ok('free text is not offered, since a tap adds a food', !names.some((name) => name.includes('grandma')), names);
  ok('past the lookback is not offered', !names.some((name) => name.includes('parsnip')), names);
  ok('only plants are offered', !names.some((name) => name.includes('chicken')), names);
  ok('the food id is kept for the tap', plants[0].foodId === '11|USDA', plants[0]);

  const count = v.slotPlantCount(records, 'lunch', today);
  ok('slot count reads the last four weeks', count.plants === 1 && count.meals === 1, count);
  const line = v.homeVarietyLine('lunch', count, plants);
  ok('home line names the count', /1 different plant\./.test(line), line);
  ok('home line names the plants', /Not eaten in four weeks: black beans/.test(line), line);
  clean('home line', line);
  ok('nothing to say is null', v.homeVarietyLine('lunch', { plants: 0, meals: 0 }, []) === null);
  clean('chip caption before', v.homeChipCaption('lunch', false));
  clean('chip caption after', v.homeChipCaption('lunch', true));
  clean('added sentence', v.addedToMealSentence('black beans', 'lunch'));
  ok('plain names turn around', v.plainPlantName('Beans, black') === 'black beans');
}

// --- The whole reading, with a gap week --------------------------------------
{
  const inputs = {
    records: [rec('2026-09-01', 'a', 'Kale'), rec('2026-09-02', 'b', 'Apple', { category: 'Fruit' }), rec('2026-09-16', 'c', 'Kale')],
    loggedDates: ['2026-09-01', '2026-09-02', '2026-09-16'],
    startDate: '2026-09-01',
    endDate: '2026-09-21',
  };
  const meals = [meal('a', '2026-09-01'), meal('b', '2026-09-02', { eatenOut: true }), meal('c', '2026-09-16', { planned: true })];
  const summary = v.summarizeMealVariety(inputs, meals);
  ok('a week with nothing logged is a gap', summary.weeks.some((week) => week.foods === null && week.plants === null), summary.weeks);
  ok('gap weeks are counted', summary.weeksWithoutLogging >= 1, summary.weeksWithoutLogging);
  ok('no gap week reads as zero', !summary.weeks.some((week) => week.daysLogged === 0 && week.foods === 0));
  ok('the reading has something', summary.hasAnything === true);
  ok('sources total every meal', summary.sources.total === 3, summary.sources);
  ok('the eaten-out meal is counted as out', summary.sources.totals.out === 1, summary.sources.totals);
  clean('sources headline', summary.sources.headline);
  clean('distinct headline', summary.distinct.headline);
  clean('plants headline', summary.plants.headline);
  for (const row of summary.sources.rows) clean('source row label', row.label);

  const empty = v.summarizeMealVariety({ records: [], loggedDates: [], startDate: '2026-09-01', endDate: '2026-09-07' }, []);
  ok('an empty range has nothing', empty.hasAnything === false);
  ok('an empty range is all gap', empty.weeks.every((week) => week.foods === null), empty.weeks);
  clean('empty repeats headline', empty.repeats.headline);
  clean('empty planned headline', empty.planned.headline);
  clean('empty sources headline', empty.sources.headline);
}

console.log(failures === 0 ? `test_meal_variety: all passed (${sentences.length} sentences swept)` : `test_meal_variety: ${failures} failed`);
process.exit(failures === 0 ? 0 : 1);
