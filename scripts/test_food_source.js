// Runs lib/foodSource.ts: where each food's numbers come from (G11,
// 2026-09-27).
//
// The rules checked:
//
//  1. Every source in the reference database has a caption naming its table
//     and country, read from the database itself when sqlite3.exe is here.
//  2. A USDA food says USDA and nothing about falling back; any other
//     national table says USDA has no entry.
//  3. Derived rows say they were worked out, never that a table measured them.
//  4. No caption uses a dash, filler, or a word ranking one table over another.
//
// Run with: node scripts/test_food_source.js
// Exits non-zero on any failure.

/* global __dirname */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
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

const S = loadModule('lib/foodSource.ts');

let failures = 0;
function check(label, ok) {
  if (!ok) {
    failures++;
    console.log(`FAIL ${label}`);
  }
}

// 1. Every source the database holds is named.
let sources = S.NAMED_SOURCES;
try {
  const db = path.join(__dirname, '..', 'assets', 'data', 'foods_reference.db');
  const out = execFileSync('sqlite3.exe', ['-readonly', db, 'SELECT DISTINCT source FROM foods'], { encoding: 'utf8' });
  sources = out.split(/\r?\n/).filter(Boolean);
  for (const source of sources) check(`${source} is named`, S.NAMED_SOURCES.includes(source));
} catch {
  console.log('(sqlite3.exe or the reference database not found; checking the named list only)');
}

// 2 and 3.
check('USDA', S.foodSourceCaption('USDA') === 'Numbers from USDA FoodData Central, United States.');
check('Japan names its country', S.foodSourceCaption('Japan_MEXT').includes('Japan.'));
check('a fallback says USDA has none', S.foodSourceCaption('France_Ciqual').endsWith('USDA has no entry for this food prepared this way.'));
check('USDA does not say it fell back', !S.foodSourceCaption('USDA').includes('no entry'));
check('Derived says worked out', S.foodSourceCaption('Derived').startsWith('Numbers worked out from USDA figures'));
check('an unknown source still reads', S.foodSourceCaption('Mystery') === 'Numbers from Mystery. USDA has no entry for this food prepared this way.');

// 4.
const FORBIDDEN = /\b(best|better|more accurate|trusted|reliable|real|genuine|genuinely|own)\b|[–—]| -- /i;
for (const source of sources.concat(S.NAMED_SOURCES)) {
  const caption = S.foodSourceCaption(source);
  check(`"${caption}" has no dash, filler or ranking`, !FORBIDDEN.test(caption));
}

if (failures) {
  console.log(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log('food source: all checks passed');
