// Checks lib/askRecords.ts, Ask Your Records on Home (C22, 2026-09-30).
//
// 1. A question is sent to the place that can answer it: a Trends lens,
//    Pattern Finder for a question about what came before something, Where
//    Is It for a question about where a thing was put, Search Reading for a
//    question about the world.
// 2. Never more than three places, never the same place twice, and Search
//    Reading is there whenever there is room, so no question goes nowhere.
// 3. Every lens named is one Trends has.
// 4. No caption says what caused anything or gives a verdict.
//
// Exits non-zero on any failure.

/* global __dirname */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const file = path.join(__dirname, '..', 'lib', 'askRecords.ts');
const source = fs.readFileSync(file, 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});
const mod = { exports: {} };
new Function('exports', 'module', 'require', outputText)(mod.exports, mod, (name) => {
  throw new Error('lib/askRecords.ts must stay free of imports (asked for ' + name + ')');
});
const A = mod.exports;

let checks = 0;
let failures = 0;
function check(condition, label) {
  checks += 1;
  if (!condition) {
    failures += 1;
    console.error('FAIL: ' + label);
  }
}
const lenses = (q) => A.routeQuestion(q).map((a) => (a.target.kind === 'trends' ? a.target.lens : a.target.kind));

// 1. Where each question goes.
check(lenses('What did I eat before my last flare?')[0] === 'patterns', 'before a flare goes to Pattern Finder first');
check(lenses('What did I eat before my last flare?').includes('symptoms'), 'and to Symptoms & Flares');
check(lenses('How did I sleep this week')[0] === 'nights', 'sleep goes to Nights');
const week = A.routeQuestion('How did I sleep this week')[0];
check(week.target.range === 'thisWeek', 'this week opens the week');
check(A.routeQuestion('how did I sleep')[0].target.range === undefined, 'no week named, no range set');
check(lenses('my weight lately')[0] === 'weight', 'weight goes to Weight');
check(lenses('what was my last TSH')[0] === 'labs', 'TSH goes to Labs');
check(lenses('how much water did I drink')[0] === 'hydration', 'water goes to Hydration');
check(lenses('did I take my levothyroxine')[0] === 'doses', 'a medicine goes to Doses');
check(lenses('how much did I spend on groceries').slice(0, 2).join() === 'cost,groceries', 'spending goes to What It Costs, then prices');
check(lenses('what did the garden give this year')[0] === 'harvest', 'the garden goes to Garden Yield');
check(lenses('am I getting enough iron').includes('nutrients'), 'iron goes to Nutrients');

const where = A.routeQuestion('Where did I put the spare batteries?');
check(where[0].target.kind === 'whereIsIt' && where[0].target.query === 'spare batteries', 'where did I put goes to Where Is It with the thing named');
check(A.routeQuestion("where's my passport")[0].target.query === 'passport', "where's works too");

const world = A.routeQuestion('What is selenium?');
check(world[0].target.kind === 'reading' && world[0].target.query === 'selenium', 'a question about the world leads with the reading');
check(lenses('what is my selenium')[0] === 'nutrients', 'the same word about the person leads with their records');
check(!lenses('why do I eat so late').includes('patterns') || lenses('why do I eat so late').includes('variety'), 'Pattern Finder only beside a lens that matched');
check(!lenses('what is before').includes('patterns'), 'a pattern word alone does not open Pattern Finder');
check(lenses('zebra crossing')[0] === 'reading', 'a question with no match still goes somewhere');
check(A.routeQuestion('   ').length === 0, 'an empty question has no places');

// 2. Limits.
const busy = A.routeQuestion('after I eat and sleep and walk and drink water my weight and pain and labs change');
check(busy.length === A.ASK_MAX_ANSWERS, 'never more than three places');
check(new Set(busy.map((a) => a.label)).size === busy.length, 'never the same place twice');
check(lenses('how did I sleep').includes('reading'), 'Search Reading is there when there is room');

// 3. Lenses.
const trends = fs.readFileSync(path.join(__dirname, '..', 'app', '(tabs)', 'trends.tsx'), 'utf8');
const block = trends.slice(trends.indexOf('const TRENDS_LENSES'));
const known = new Set([...block.matchAll(/^ {4}key: '([a-zA-Z]+)'/gm)].map((m) => m[1]));
const named = [...source.matchAll(/lens: '([a-zA-Z]+)'/g)].map((m) => m[1]);
check(named.length > 15, 'the rules name their lenses');
for (const lens of named) check(known.has(lens), 'Trends has a lens called ' + lens);

// 4. Words.
const code = source.replace(/^\s*\/\/.*$/gm, '').replace(/^\s*\*.*$/gm, '');
const captions = [...code.matchAll(/caption: '([^']*)'/g)].map((m) => m[1].toLowerCase());
check(captions.length > 15, 'the captions were found');
for (const word of ['cause', 'because', 'trigger', 'too low', 'too high', 'should', 'ideal', 'normal', 'good', 'bad', 'well done']) {
  check(captions.every((c) => !c.includes(word)), 'no caption says "' + word + '"');
}

console.log(`${checks - failures}/${checks} ask your records checks passed`);
if (failures > 0) process.exit(1);
