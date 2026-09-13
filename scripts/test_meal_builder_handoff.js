// Checks for lib/mealBuilderHandoff.ts, the value Log or Schedule a Meal
// hands to Meal Builder through a route param (2026-09-13).
//
// The parse is the part that can fail silently: a route param is a plain
// string that can be stale, truncated, or hand-typed, and a throw there
// would take the Food tab down at focus time. So every bad shape must come
// back as null, and every good one must come back with exactly the items
// it was sent with, nothing dropped and nothing invented.
//
// Run: node scripts/test_meal_builder_handoff.js
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const SOURCE = path.join(__dirname, '..', 'lib', 'mealBuilderHandoff.ts');

function loadModule() {
  const source = fs.readFileSync(SOURCE, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: 'mealBuilderHandoff.ts',
  });
  const module = { exports: {} };
  // eslint-disable-next-line no-new-func
  new Function('exports', 'module', outputText)(module.exports, module);
  return module.exports;
}

const { encodeBuildMealHandoff, parseBuildMealHandoff } = loadModule();

let passed = 0;
let failed = 0;
function check(label, condition, detail) {
  if (condition) {
    passed += 1;
  } else {
    failed += 1;
    console.log(`FAIL  ${label}${detail ? `: ${detail}` : ''}`);
  }
}

// A round trip keeps every item, the name, the type and the nonce.
{
  const sent = {
    name: 'Tuesday dinner',
    mealType: 'dinner',
    items: [
      { componentType: 'side', componentId: 'side_1' },
      { curatedRecipeId: 'curated_side_lemon_garlic_broccoli' },
    ],
    nonce: 1234,
  };
  const back = parseBuildMealHandoff(encodeBuildMealHandoff(sent));
  check('round trip keeps the name', back && back.name === 'Tuesday dinner');
  check('round trip keeps the type', back && back.mealType === 'dinner');
  check('round trip keeps the nonce', back && back.nonce === 1234);
  check('round trip keeps both items in order', back && JSON.stringify(back.items) === JSON.stringify(sent.items));
}

// Only the items travel when nothing else was set.
{
  const back = parseBuildMealHandoff(encodeBuildMealHandoff({ items: [{ curatedRecipeId: 'r1' }] }));
  check('a bare item list parses', back && back.items.length === 1);
  check('no name is undefined, not an empty string', back && back.name === undefined);
  check('no type is undefined', back && back.mealType === undefined);
}

// Bad input never throws and never yields an empty handoff.
const bad = [
  ['undefined', undefined],
  ['null', null],
  ['empty string', ''],
  ['not JSON', '{not json'],
  ['a number', '42'],
  ['an array', '[]'],
  ['an object with no items', '{"name":"x"}'],
  ['items not an array', '{"items":"side_1"}'],
  ['an empty item list', '{"items":[]}'],
  ['items with nothing usable', '{"items":[{},{"componentType":"side"},{"curatedRecipeId":""},null,7]}'],
];
for (const [label, raw] of bad) {
  let result;
  let threw = false;
  try {
    result = parseBuildMealHandoff(raw);
  } catch {
    threw = true;
  }
  check(`${label} does not throw`, !threw);
  check(`${label} yields null`, result === null, JSON.stringify(result));
}

// A usable item survives next to unusable ones, and unknown keys are dropped.
{
  const back = parseBuildMealHandoff('{"items":[{"componentType":"soup","componentId":"soup_9","extra":1},{"bogus":true}],"symptomLog":"never"}');
  check('the good item survives', back && back.items.length === 1 && back.items[0].componentId === 'soup_9');
  check('unknown keys on an item are dropped', back && !('extra' in back.items[0]));
  check('unknown keys on the handoff are dropped', back && !('symptomLog' in back));
}

// A blank name is treated as none.
{
  const back = parseBuildMealHandoff('{"name":"   ","items":[{"curatedRecipeId":"r1"}]}');
  check('a blank name is undefined', back && back.name === undefined);
}

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
