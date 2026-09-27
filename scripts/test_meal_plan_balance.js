// Runs lib/mealPlanBalance.ts: bringing a planned day nearer its nutrient
// targets, and the choices for trading one side on a plate (2026-09-27).
//
// The rules checked:
//
//  1. The shortfall counts RDA and AI targets only, as shares, and going
//     past a target earns nothing more.
//  2. No change carries a nutrient past its upper limit or a ceiling target,
//     or the day past the carb target, unless it was already past and goes
//     no higher.
//  3. The scroller's choices: the dish on the plate first, the rest nearest
//     the targets first, dishes already on the day left out, and what the
//     limits left out counted.
//  4. The improvement pass trades only when the gain is worth it, keeps to
//     `allowed`, and never puts one dish on the day twice.
//  5. The sentences, and none of them says a dish is good for anybody.
//
// Run with: node scripts/test_meal_plan_balance.js
// Exits non-zero on any failure.

/* global __dirname */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function loadModule(relPath, deps = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    if (deps[name]) return deps[name];
    throw new Error(`unexpected import ${name}`);
  });
  return module.exports;
}

const B = loadModule('lib/mealPlanBalance.ts');

let failures = 0;
function check(label, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    failures++;
    console.log(`FAIL ${label}\n  expected ${e}\n  got      ${a}`);
  }
}

const targets = [
  { nutrientCode: 'iron', valueType: 'RDA', amount: 10, upperLimit: 45 },
  { nutrientCode: 'fiber', valueType: 'AI', amount: 30, upperLimit: null },
  { nutrientCode: 'sodium', valueType: 'CDRR', amount: 2300, upperLimit: null },
];

// 1. Shortfall
check('nothing eaten', B.shortfall({}, targets), 2);
check('half of each', B.shortfall({ iron: 5, fiber: 15 }, targets), 1);
check('past a target earns nothing', B.shortfall({ iron: 40, fiber: 15 }, targets), 0.5);
check('sodium is not a floor', B.shortfall({ iron: 10, fiber: 30, sodium: 0 }, targets), 0);
check('met', B.targetsMet({ iron: 10, fiber: 12, sodium: 5000 }, targets), { met: 1, of: 2 });

// 2. Limits
check('past upper limit', B.breaksALimit({ iron: 30 }, { iron: 50 }, targets), true);
check('under upper limit', B.breaksALimit({ iron: 30 }, { iron: 44 }, targets), false);
check('sodium ceiling', B.breaksALimit({ sodium: 2000 }, { sodium: 2400 }, targets), true);
check('already past, going down', B.breaksALimit({ sodium: 3000 }, { sodium: 2800 }, targets), false);
check('already past, going up', B.breaksALimit({ sodium: 3000 }, { sodium: 3100 }, targets), true);
check('carbs past', B.breaksCarbCeiling(40, 55, 50), true);
check('carbs no ceiling', B.breaksCarbCeiling(40, 500, null), false);
check('carbs already past, down', B.breaksCarbCeiling(60, 58, 50), false);
check('trade totals', B.tradeTotals({ iron: 5, fiber: 10 }, { iron: 2 }, { iron: 4, fiber: 3 }), { iron: 7, fiber: 13 });

// 3. Scroller choices
const day = { iron: 6, fiber: 12, sodium: 1500 };
const current = { id: 'slaw', totals: { iron: 1, fiber: 4, sodium: 200 }, carbGrams: 10 };
const candidates = [
  { id: 'lentil', totals: { iron: 4, fiber: 10, sodium: 100 }, carbGrams: 20 },
  { id: 'greens', totals: { iron: 3, fiber: 6, sodium: 50 }, carbGrams: 5 },
  { id: 'pickle', totals: { iron: 0, fiber: 1, sodium: 1200 }, carbGrams: 2 },
  { id: 'rice', totals: { iron: 1, fiber: 1, sodium: 10 }, carbGrams: 80 },
  { id: 'main', totals: { iron: 9, fiber: 9, sodium: 0 }, carbGrams: 0 },
  { id: 'slaw', totals: current.totals, carbGrams: 10 },
];
const ranked = B.rankSwapOptions({
  dayTotals: day,
  dayCarbs: 40,
  current,
  candidates,
  usedIds: new Set(['main']),
  targets,
  carbCeiling: 60,
});
check('order', ranked.options.map((o) => o.dish.id), ['slaw', 'lentil', 'greens']);
check('current first', ranked.options[0].current, true);
check('left out for sodium', ranked.leftOutLimit, 1);
check('left out for carbs', ranked.leftOutCarbs, 1);
check('lentil totals', ranked.options[1].totalsAfter, { iron: 9, fiber: 18, sodium: 1400 });
check('lentil carbs', ranked.options[1].carbsAfter, 50);
check('lentil moved', [ranked.options[1].nearer, ranked.options[1].further], [2, 0]);
check('no ceiling keeps rice', B.rankSwapOptions({ dayTotals: day, dayCarbs: 40, current, candidates, usedIds: new Set(), targets, carbCeiling: null }).leftOutCarbs, 0);

// 4. Improvement pass
const pool = { side: candidates.filter((c) => c.id !== 'main'), salad: [] };
const improved = B.improveDay({
  dayTotals: day,
  dayCarbs: 40,
  picks: [{ slot: 'lunch:1', role: 'side', dish: current }],
  poolFor: (role) => pool[role] ?? [],
  usedIds: new Set(['main', 'slaw']),
  targets,
  carbCeiling: 60,
});
check('trades to lentil', improved.trades.map((t) => [t.slot, t.from.id, t.to.id]), [['lunch:1', 'slaw', 'lentil']]);
check('day after', improved.dayTotals, { iron: 9, fiber: 18, sodium: 1400 });
check('carbs after', improved.dayCarbs, 50);
const kept = B.improveDay({
  dayTotals: day,
  dayCarbs: 40,
  picks: [{ slot: 'lunch:1', role: 'side', dish: current }],
  poolFor: (role) => pool[role] ?? [],
  usedIds: new Set(['main', 'slaw']),
  targets,
  carbCeiling: 60,
  allowed: (dish) => dish.id !== 'lentil' && dish.id !== 'greens',
});
check('allowed narrows to nothing better', kept.trades.length, 0);
const tiny = B.improveDay({
  dayTotals: { iron: 9.9, fiber: 29.9 },
  dayCarbs: 0,
  picks: [{ slot: 'd:1', role: 'side', dish: { id: 'a', totals: {}, carbGrams: 0 } }],
  poolFor: () => [{ id: 'b', totals: { iron: 0.1, fiber: 0.1 }, carbGrams: 0 }],
  usedIds: new Set(['a']),
  targets,
  carbCeiling: null,
});
check('small gain left alone', tiny.trades.length, 0);
// Two sides from one pool never both land on the same dish.
const two = B.improveDay({
  dayTotals: { iron: 2, fiber: 5 },
  dayCarbs: 0,
  picks: [
    { slot: 'lunch:1', role: 'side', dish: { id: 'x', totals: { iron: 1, fiber: 2 }, carbGrams: 0 } },
    { slot: 'dinner:1', role: 'side', dish: { id: 'y', totals: { iron: 1, fiber: 3 }, carbGrams: 0 } },
  ],
  poolFor: () => [{ id: 'lentil', totals: { iron: 4, fiber: 10 }, carbGrams: 0 }, { id: 'greens', totals: { iron: 3, fiber: 6 }, carbGrams: 0 }],
  usedIds: new Set(['x', 'y']),
  targets,
  carbCeiling: null,
});
const landed = two.trades.map((t) => t.to.id);
check('no dish twice', new Set(landed).size, landed.length);
check('both traded', landed.sort(), ['greens', 'lentil']);
check('input untouched', current.id, 'slaw');

// 5. Sentences
check('effect current', B.describeSwapEffect({ current: true, nearer: 0, further: 0 }), 'On the plate now.');
check('effect nearer', B.describeSwapEffect({ current: false, nearer: 2, further: 0 }), 'The day ends nearer your targets on 2 nutrients.');
check('effect both', B.describeSwapEffect({ current: false, nearer: 1, further: 3 }), 'The day ends nearer your targets on 1 nutrient and further from them on 3.');
check('effect further only', B.describeSwapEffect({ current: false, nearer: 0, further: 1 }), 'The day ends further from your targets on 1 nutrient.');
check('effect none', B.describeSwapEffect({ current: false, nearer: 0, further: 0 }), 'Leaves the day about where it is against your targets.');
check('left out none', B.describeLeftOut(0, 0), []);
check('left out both', B.describeLeftOut(1, 2).length, 2);

// 4. Everything kept when a person chooses (2026-09-27): over-limit dishes
// stay, after the rest, each naming the limit it passes.
check('limits passed', B.limitsPassed({ iron: 30, sodium: 2000 }, { iron: 50, sodium: 2400 }, targets), ['iron', 'sodium']);
const everything = B.rankSwapOptions({ dayTotals: day, dayCarbs: 40, current, candidates, usedIds: new Set(['main']), targets, carbCeiling: 60, keepOverLimit: true });
check('all kept, over-limit last', everything.options.map((o) => o.dish.id), ['slaw', 'lentil', 'greens', 'rice', 'pickle']);
const byId = (id) => everything.options.find((o) => o.dish.id === id);
check('nothing left out when kept', [everything.leftOutLimit, everything.leftOutCarbs], [0, 0]);
check('pickle passes sodium', byId('pickle').passesLimits, ['sodium']);
check('rice passes carbs', byId('rice').passesCarbs, true);
const named = targets.map((t) => ({ ...t, displayName: t.nutrientCode === 'iron' ? 'Iron' : t.nutrientCode === 'sodium' ? 'Sodium' : 'Fiber' }));
check('caution sodium', B.describeLimitsPassed(byId('pickle'), named), ['Takes Sodium past your ceiling for the day.']);
check('caution carbs', B.describeLimitsPassed(byId('rice'), named), ['Takes the day past your carb target.']);
check('caution iron', B.describeLimitsPassed({ passesLimits: ['iron'], passesCarbs: false }, named), ['Takes Iron past its upper limit for the day.']);
check('no caution', B.describeLimitsPassed(everything.options[1], named), []);
// Adding: nothing taken off, so the day plus the dish.
const added = B.rankSwapOptions({ dayTotals: day, dayCarbs: 40, current: { id: '', totals: {}, carbGrams: 0 }, candidates, usedIds: new Set(['main', 'slaw']), targets, carbCeiling: 60, keepOverLimit: true });
check('add lentil totals', added.options.find((o) => o.dish.id === 'lentil').totalsAfter, { iron: 10, fiber: 22, sodium: 1600 });

const sentences = [
  B.describeSwapEffect({ current: true, nearer: 0, further: 0 }),
  B.describeSwapEffect({ current: false, nearer: 2, further: 1 }),
  B.describeSwapEffect({ current: false, nearer: 0, further: 2 }),
  B.describeSwapEffect({ current: false, nearer: 0, further: 0 }),
  ...B.describeLeftOut(1, 1),
  ...B.describeLeftOut(3, 4),
  ...B.describeLimitsPassed({ passesLimits: ['iron', 'sodium'], passesCarbs: true }, named),
];
const FORBIDDEN = /\b(best|healthy|healthiest|should|superfood|boost|real|genuine|genuinely|cure|treat|deficiency)\b|[–—]| -- /i;
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
console.log('meal plan balance: all checks passed');
