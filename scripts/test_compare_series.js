// Runs lib/compareSeries.ts, compare any two series: F16, 2026-10-01.
//
// The rules checked:
//
//  1. The catalogue holds nutrients, weight, sleep, steps, severity, the
//     three daily scales, every lab with a result and every tracker.
//  2. One reading per day, inside the range only, averaged, added or the
//     highest kept as the series says; a day with no reading is left out.
//  3. Each series keeps a separate range; a fixed scale keeps its ends.
//  4. The summary counts days A, days B and days with both, and the
//     caption says moving together is not one causing the other.
//  5. The chart draws dots only, never a line or path between readings,
//     and the wiring reaches Trends and Insights.
//  6. No dashes and no verdict, cause or correlation words.
//
// Run with: node scripts/test_compare_series.js
// Exits non-zero on any failure.

/* global __dirname */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const ROOT = path.join(__dirname, '..');
function load(relPath) {
  const source = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  // Only the pure rule module may be pulled in; anything else is a sign the
  // module reaches the database or React.
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    if (name === './nutrientPairRules') return load('lib/nutrientPairRules.ts');
    throw new Error(`${relPath} has a runtime import ${name}`);
  });
  return module.exports;
}

const C = load('lib/compareSeries.ts');
const { READING_FORBIDDEN_WORDS } = load('lib/readingBands.ts');

let passed = 0;
let failed = 0;
function check(label, ok) {
  if (ok) passed += 1;
  else {
    failed += 1;
    console.log(`FAIL: ${label}`);
  }
}

const END = '2026-10-01';
const nutrientKeyOf = (code) => `nutrient:${code}`;
const texts = [];

// 1. The catalogue
const choices = C.buildChoices({
  nutrients: [
    { code: 'iron', label: 'Iron' },
    { code: 'selenium', label: 'Selenium' },
  ],
  labs: [{ code: 'tsh', label: 'TSH', unit: 'mIU/L' }],
  trackers: [
    { id: 't1', name: 'Headache', unit: 'of 5', perDay: 'average', scale: true },
    { id: 't2', name: 'Cups of tea', unit: 'cups', perDay: 'total', scale: false },
  ],
  weightUnit: 'kg',
});
const byKey = new Map(choices.map((c) => [c.key, c]));
{
  for (const key of ['nutrient:iron', 'nutrient:selenium', 'weight', 'sleep', 'steps', 'severity', 'scale:mood', 'scale:energy', 'scale:stress', 'lab:tsh', 'tracker:t1', 'tracker:t2']) {
    check(`catalogue has ${key}`, byKey.has(key));
  }
  check('keys are unique', byKey.size === choices.length);
  check('nutrients come first', choices[0].kind === 'nutrient' && choices[1].kind === 'nutrient');
  check('groups follow the listed order', choices.every((c, i) => i === 0 || C.COMPARE_GROUPS.indexOf(c.group) >= C.COMPARE_GROUPS.indexOf(choices[i - 1].group)));
  check('nutrientKey', C.nutrientKey('iron') === 'nutrient:iron');
  check('options carry label and value', C.choiceOptions(choices).every((o, i) => o.value === choices[i].key && o.label === choices[i].label));
  check('severity is 0 to 10, highest per day', byKey.get('severity').fixedRange.yMax === 10 && byKey.get('severity').perDay === 'highest');
  check('a scale tracker is 1 to 5', byKey.get('tracker:t1').fixedRange.yMin === 1);
  check('a count tracker adds', byKey.get('tracker:t2').perDay === 'total' && !byKey.get('tracker:t2').fixedRange);
  check('weight in lb when asked', C.buildChoices({ nutrients: [], labs: [], trackers: [], weightUnit: 'lb' }).find((c) => c.key === 'weight').unit === 'lb');
  for (const c of choices) texts.push(c.label);
}

// Dates
{
  check('shiftDate across a month', C.shiftDate('2026-03-31', 1) === '2026-04-01');
  check('shiftDate across daylight saving', C.shiftDate('2026-11-02', -2) === '2026-10-31');
  check('dayIndex', C.dayIndex('2026-10-01', '2026-09-01') === 30);
  check(`sayDate: ${C.sayDate(END)}`, C.sayDate(END) === 'Thu 1 Oct 2026');
  check(`sayShortDate: ${C.sayShortDate(END)}`, C.sayShortDate(END) === '1 Oct');
}

// 2. One reading per day
{
  const raw = [
    { date: '2026-09-29', value: 2 },
    { date: '2026-09-29', value: 6 },
    { date: '2026-09-30', value: 4 },
    { date: '2026-08-01', value: 9 }, // before the range
    { date: '2026-10-02', value: 9 }, // after the range
    { date: '2026-09-28', value: NaN },
  ];
  const avg = C.oneReadingPerDay(raw, 'average', '2026-09-02', END);
  check('average per day', avg.length === 2 && avg[0].value === 4 && avg[1].value === 4);
  check('oldest first', avg[0].date === '2026-09-29');
  check('outside the range left out', !avg.some((p) => p.date === '2026-08-01' || p.date === '2026-10-02'));
  check('a reading that is not a number is left out', !avg.some((p) => p.date === '2026-09-28'));
  check('total per day', C.oneReadingPerDay(raw, 'total', '2026-09-02', END)[0].value === 8);
  check('highest per day', C.oneReadingPerDay(raw, 'highest', '2026-09-02', END)[0].value === 6);
}

// 3. Ranges
{
  const weight = byKey.get('weight');
  const r = C.seriesRange(weight, [{ date: END, value: 70 }, { date: END, value: 74 }]);
  check('a range pads both ends', r.yMin < 70 && r.yMax > 74 && r.yMin > 60);
  const flat = C.seriesRange(weight, [{ date: END, value: 70 }]);
  check('one reading still has height', flat.yMax > flat.yMin);
  const nutrient = C.seriesRange(byKey.get('nutrient:iron'), [{ date: END, value: 5 }, { date: END, value: 120 }]);
  check('a positive series is not padded below zero', nutrient.yMin >= 0);
  const sev = C.seriesRange(byKey.get('severity'), [{ date: END, value: 3 }]);
  check('a fixed scale keeps its ends', sev.yMin === 0 && sev.yMax === 10);
  const t1 = C.seriesRange(byKey.get('tracker:t1'), [{ date: END, value: 7 }]);
  check('a reading past a fixed end still lands', t1.yMax === 7);
  check('empty series has a range', C.seriesRange(weight, []).yMax === 1);
}

// Values
{
  check(`nutrient value: ${C.formatValue(byKey.get('nutrient:iron'), 84.4)}`, C.formatValue(byKey.get('nutrient:iron'), 84.4) === '84% of target');
  check(`weight value: ${C.formatValue(byKey.get('weight'), 71.26)}`, C.formatValue(byKey.get('weight'), 71.26) === '71.3 kg');
  check(`steps value: ${C.formatValue(byKey.get('steps'), 8412)}`, C.formatValue(byKey.get('steps'), 8412) === '8,412 steps');
  check('axis thousands', C.formatAxisValue(byKey.get('steps'), 12400) === '12k');
  check('axis small', C.formatAxisValue(byKey.get('scale:mood'), 2.5) === '2.5');
}

// 4. The comparison
{
  const a = [
    { date: '2026-09-01', value: 80 },
    { date: '2026-09-10', value: 95 },
    { date: '2026-09-20', value: 110 },
  ];
  const b = [
    { date: '2026-09-10', value: 3 },
    { date: '2026-09-20', value: 5 },
    { date: '2026-09-21', value: 2 },
    { date: '2026-09-22', value: 1 },
  ];
  const cmp = C.buildComparison(byKey.get('nutrient:iron'), a, byKey.get('severity'), b, END, 90);
  texts.push(cmp.summary, cmp.accessibilityLabel, C.describeDay(cmp, '2026-09-10'), C.describeDay(cmp, '2026-09-01'));
  check('range starts days back', cmp.start === '2026-07-04' && cmp.end === END && cmp.days === 90);
  check('days counted', cmp.daysA === 3 && cmp.daysB === 4 && cmp.daysBoth === 2);
  check(`summary: ${cmp.summary}`, cmp.summary === 'Iron, % of target has a reading on 3 of the last 90 days, and Flare and reaction severity, 0 to 10 on 4. 2 days have both.');
  check('ranges kept apart', cmp.a.range.yMax > 100 && cmp.b.range.yMax === 10);
  check(`describeDay both: ${C.describeDay(cmp, '2026-09-10')}`, C.describeDay(cmp, '2026-09-10') === 'Thu 10 Sep 2026: Iron, % of target 95% of target; Flare and reaction severity, 0 to 10 3 of 10.');
  check('describeDay one missing', C.describeDay(cmp, '2026-09-01').includes('Flare and reaction severity, 0 to 10 not recorded'));
  check('accessibility names both scales', /circles on the left scale/.test(cmp.accessibilityLabel) && /squares on the right scale/.test(cmp.accessibilityLabel));

  const one = C.buildComparison(byKey.get('weight'), [{ date: END, value: 70 }], byKey.get('steps'), [{ date: END, value: 9000 }], END, 30);
  texts.push(one.summary);
  check(`one shared day singular: ${one.summary}`, one.summary.endsWith('1 day has both.'));

  const none = C.buildComparison(byKey.get('weight'), [{ date: '2026-09-02', value: 70 }], byKey.get('steps'), [{ date: END, value: 9000 }], END, 30);
  texts.push(none.summary);
  check(`no shared day: ${none.summary}`, none.daysBoth === 0 && none.summary.includes('No day has both'));

  const empty = C.buildComparison(byKey.get('weight'), [], byKey.get('steps'), [], END, 30);
  texts.push(empty.summary);
  check(`nothing at all: ${empty.summary}`, empty.summary === 'Nothing is recorded for either in the last 30 days.');

  const onlyA = C.buildComparison(byKey.get('weight'), [{ date: END, value: 70 }], byKey.get('steps'), [], END, 30);
  texts.push(onlyA.summary);
  check(`only one has readings: ${onlyA.summary}`, onlyA.summary.endsWith('and Steps on 0.'));

  const same = C.buildComparison(byKey.get('weight'), [], byKey.get('weight'), [], END, 30);
  texts.push(same.summary);
  check('the same thing twice says so', same.sameSeries && same.summary.startsWith('Both pickers hold the same thing'));

  texts.push(C.MOVING_TOGETHER_LINE);
  check('caption says moving together is not causing', /does not show that one is causing the other/.test(C.MOVING_TOGETHER_LINE));
  check('every range is offered', C.COMPARE_RANGES.join(',') === '30,90,180,365' && C.DEFAULT_COMPARE_RANGE === 90);
}

// 5. The chart and the wiring
{
  const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
  const chart = read('components/CompareTwoChart.tsx');
  check('chart draws with react-native-svg', /from 'react-native-svg'/.test(chart));
  check('chart has no Path or Polyline', !/\b(Path|Polyline)\b/.test(chart));
  check('first series as circles', /comparison\.a\.points\.map[\s\S]*?<Circle/.test(chart));
  check('second series as squares', /comparison\.b\.points\.map[\s\S]*?<Rect/.test(chart));
  check('every Line is an axis, the picked day or a tag row baseline', (chart.match(/<Line/g) || []).length === 5);
  const lens = read('components/CompareTwoLens.tsx');
  check('lens pickers are PopoverSelect', (lens.match(/<PopoverSelect/g) || []).length === 2);
  check('lens shows the caption', lens.includes('MOVING_TOGETHER_LINE'));
  const trends = read('app/(tabs)/trends.tsx');
  check('Trends lens key', /key: 'compare',\s*\r?\n\s*label: 'Compare Two'/.test(trends));
  check('Trends renders the lens', trends.includes('<CompareTwoLens'));
  check('Trends reads openCompareA', trends.includes('openCompareA'));
  const insights = read('app/(tabs)/insights.tsx');
  check('Insights links an opened nutrient row', /openTrendsLens: 'compare', openCompareA: nutrientKey\(entry\.nutrientCode\)/.test(insights));
  check('pure module never reaches the database', !/from '\.\/db'/.test(read('lib/compareSeries.ts')));
  check('loader only reads', !/\b(INSERT|UPDATE|DELETE)\b/.test(read('lib/compareSeriesDb.ts')));
  texts.push(...(lens.match(/>([^<>{}]{12,})</g) || []).map((m) => m.slice(1, -1).trim()));
}

// 7. Pairs with a known reason
{
  // The codes the bundled reference database holds (dietary_reference_intakes
  // and lab_tests, read 2026-10-01). A pair naming anything else would never
  // be offered.
  const NUTRIENTS = 'biotin_b7 calcium choline copper fiber_total folate_b9 iodine iron magnesium manganese niacin_b3 pantothenic_acid_b5 phosphorus potassium protein riboflavin_b2 selenium sodium thiamin_b1 vitamin_a vitamin_b12 vitamin_b6 vitamin_c vitamin_d vitamin_e vitamin_k water zinc'.split(' ');
  const LABS = 'ferritin free_t3 free_t4 hscrp magnesium_test reverse_t3 selenium_test tg_ab thyroglobulin total_t3 total_t4 tpo_ab tsh tsi_trab urine_iodine vitamin_b12_test vitamin_d_test zinc_test'.split(' ');
  const FIXED = ['weight', 'sleep', 'steps', 'severity', 'scale:mood', 'scale:energy', 'scale:stress', 'weather:pressure', 'weather:high', 'weather:humidity', 'weather:rain'];
  const valid = (key) =>
    FIXED.includes(key) ||
    (key.startsWith('nutrient:') && NUTRIENTS.includes(key.slice(9))) ||
    (key.startsWith('lab:') && LABS.includes(key.slice(4)));
  const seenPairs = new Set();
  for (const pair of C.KNOWN_PAIRS) {
    check(`pair key ${pair.a} exists`, valid(pair.a));
    check(`pair key ${pair.b} exists`, valid(pair.b));
    check(`pair ${pair.a} with ${pair.b} is two things`, pair.a !== pair.b);
    const id = [pair.a, pair.b].sort().join('|');
    check(`pair ${id} listed once`, !seenPairs.has(id));
    seenPairs.add(id);
    check(`pair ${id} has a tier`, pair.tier in C.PAIR_TIER_WORDS);
    check(`pair ${id} has a source`, pair.source.length > 15);
    check(`pair ${id} says what to expect`, pair.why.length > 40 && pair.why.endsWith('.'));
    check(`pair ${id} reads both ways`, C.pairFor(pair.a, pair.b) === pair && C.pairFor(pair.b, pair.a) === pair);
    texts.push(pair.why);
  }
  for (const words of Object.values(C.PAIR_TIER_WORDS)) texts.push(words);
  texts.push(C.NO_KNOWN_LINK_LINE);
  check('no pair for a disparate two', C.pairFor('steps', 'lab:tsh') === null);
  check('no pair names a tracker', C.KNOWN_PAIRS.every((p) => !p.a.startsWith('tracker:') && !p.b.startsWith('tracker:')));
  check('ferritin partners', C.partnersOf('lab:ferritin').join(',') === 'nutrient:iron,nutrient:vitamin_c,nutrient:calcium');
  check('no known link line says so', /Nothing known connects these two/.test(C.NO_KNOWN_LINK_LINE));

  // Only what has data, plus what is already picked.
  const withData = new Set(['nutrient:iron', 'sleep', 'scale:mood']);
  const shown = C.choicesWithData(choices, withData, ['steps', null]);
  check('only series with readings', shown.map((c) => c.key).join(',') === 'nutrient:iron,sleep,steps,scale:mood');
  check('nothing at all leaves nothing', C.choicesWithData(choices, new Set()).length === 0);

  // Second picker: partners first.
  const second = C.secondOptions(shown, 'sleep').map((o) => o.value);
  check(`partners first: ${second.join(',')}`, second.join(',') === 'scale:mood,steps,nutrient:iron,sleep');
  check('every choice still offered', second.length === shown.length);
  check('no first pick, catalogue order', C.secondOptions(shown, null).map((o) => o.value).join(',') === shown.map((c) => c.key).join(','));

  // Partners ready and not yet recorded.
  const p = C.partnerChoices(choices, shown, 'nutrient:iron');
  check('iron with no ferritin result: named as worth recording', p.ready.length === 0 && p.notYet.join(',') === 'Ferritin');
  const q = C.partnerChoices(choices, shown, 'sleep');
  check('sleep partners split', q.ready.map((c) => c.key).join(',') === 'scale:mood,steps' && q.notYet.join(',') === 'Energy, 1 to 5,Stress, 1 to 5');
  check('no first pick, no partners', C.partnerChoices(choices, shown, null).ready.length === 0);
  for (const name of [...p.notYet, ...q.notYet]) texts.push(name);

  const lens = fs.readFileSync(path.join(ROOT, 'components/CompareTwoLens.tsx'), 'utf8');
  check('lens offers only series with readings', lens.includes('choicesWithData(') && lens.includes('loadKeysWithData('));
  check('lens shows the reason for a known pair', lens.includes('pair.why') && lens.includes('pair.source') && lens.includes('PAIR_TIER_WORDS'));
  check('lens says when nothing known connects them', lens.includes('NO_KNOWN_LINK_LINE'));
  check('second picker lists partners first', lens.includes('secondOptions('));

  // Pairs drawn from the meal generator's synergy and antagonism rules.
  const R = load('lib/nutrientPairRules.ts');
  const rules = [...R.NUTRIENT_SYNERGY_RULES, ...R.NUTRIENT_ANTAGONISM_RULES];
  for (const rule of rules) {
    check(`rule ${rule.id} says what happens in a meal`, rule.compare.inAMeal.length > 30 && rule.compare.inAMeal.endsWith('.'));
    check(`rule ${rule.id} has a source`, rule.compare.source.length > 15);
    texts.push(rule.compare.inAMeal);
    for (const lab of rule.compare.labs) {
      check(`rule ${rule.id} lab ${lab.lab} exists`, LABS.includes(lab.lab));
      check(`rule ${rule.id} lab nutrient ${lab.nutrient} is one of its own`, rule.nutrientB.includes(lab.nutrient));
      texts.push(lab.why);
    }
  }
  const ruleIntakeLabs = C.KNOWN_PAIRS.filter((p) => p.kind);
  check('every rule lab reaches Compare Two', ruleIntakeLabs.length === rules.reduce((n, r) => n + r.compare.labs.length, 0));
  check('vitamin C with ferritin helps', C.pairFor('nutrient:vitamin_c', 'lab:ferritin')?.kind === 'helps');
  check('calcium with ferritin competes', C.pairFor('lab:ferritin', 'nutrient:calcium')?.kind === 'competes');
  check('a hand pair carries no kind', !C.pairFor('nutrient:iron', 'lab:ferritin')?.kind);
  for (const words of Object.values(C.PAIR_KIND_WORDS)) texts.push(words);

  check('vitamin C with iron helps, in a meal', C.mealPairFor('nutrient:vitamin_c', 'nutrient:iron')?.kind === 'helps');
  check('iron with calcium competes, either order', C.mealPairFor('nutrient:iron', 'nutrient:calcium')?.kind === 'competes' && C.mealPairFor('nutrient:calcium', 'nutrient:iron')?.kind === 'competes');
  check('zinc with copper competes', C.mealPairFor('nutrient:zinc', 'nutrient:copper')?.kind === 'competes');
  check('vitamin D with fat is not offered, fat is no series', C.mealPairFor('nutrient:vitamin_d', 'nutrient:vitamin_a') === null);
  check('a nutrient with a lab is no meal pair', C.mealPairFor('nutrient:iron', 'lab:ferritin') === null);
  check('iron with zinc is no meal pair', C.mealPairFor('nutrient:iron', 'nutrient:zinc') === null);
  for (const a of NUTRIENTS) for (const b of NUTRIENTS) {
    if (C.mealPairFor(nutrientKeyOf(a), nutrientKeyOf(b)) && C.pairFor(nutrientKeyOf(a), nutrientKeyOf(b))) check(`${a} with ${b} is not both kinds`, false);
  }
  check('meal line says it happens in one meal', /inside one meal/.test(C.MEAL_PAIR_LINE) && /Today’s Meals/.test(C.MEAL_PAIR_LINE));
  texts.push(C.MEAL_PAIR_LINE);
  check('lens says when two nutrients meet in a meal', lens.includes('mealPairFor(') && lens.includes('MEAL_PAIR_LINE') && lens.includes('PAIR_KIND_WORDS'));
  check('lens opens Today’s Meals', lens.includes("openScheduleLens: 'todaysMeals'"));
  const plan = fs.readFileSync(path.join(ROOT, 'lib/dailyMealPlan.ts'), 'utf8');
  check('meal generator reads the same rules', plan.includes("from './nutrientPairRules'") && plan.includes('NUTRIENT_SYNERGY_RULES') && plan.includes('NUTRIENT_ANTAGONISM_RULES'));
}

// 6. Words
{
  const banned = [...READING_FORBIDDEN_WORDS, 'because of', 'correlat', 'linked to', 'caused', '—', '–', ' -- ', 'genuine', 'normal', 'healthy'];
  for (const text of texts) {
    const lower = text.toLowerCase();
    for (const word of banned) check(`no "${word}" in "${text}"`, !lower.includes(word));
    check(`no "real" in "${text}"`, !/\breal\b/i.test(text));
    check(`no redundant own in "${text}"`, !/\bits own\b/i.test(text));
  }
}

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
