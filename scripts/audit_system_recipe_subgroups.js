/* global __dirname */
// Checks the System Recipes subgroup tables against the real recipe corpus.
//
// The standing rule (CLAUDE.md, "Never leave a shelf covering more than one
// subject undivided") asks for two things every time a shelf gets split:
// design the split from the actual entry titles, and verify programmatically
// that every id is accounted for. This is that verification for the Food tab's
// System Recipes screen, and it reads both sides from the shipped source
// rather than from a copy: the ordered rule tables out of
// components/SystemRecipesView.tsx, the titles out of lib/digest/recipes.ts.
//
// It fails when a recipe lands in no subgroup, when one lands in two, when a
// rule matches nothing (a bucket that cannot appear is a rule that has gone
// stale), and when a band big enough to need splitting has no table at all.
//
// Ten of the eleven bands are one builder each. The Side Builder feeds two,
// Mains and Sides, split by SIDE_DISH_RECIPE_IDS in lib/recipeDishRole.ts, so
// this also prints that split and checks it is a clean partition: every
// side-builder recipe in exactly one of the two, and nothing left over. That
// printout is the thing that stops the five from quietly drifting the way the
// builder-type counts did.
//
// Run: node scripts/audit_system_recipe_subgroups.js
//      node scripts/audit_system_recipe_subgroups.js --list   (print buckets)

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const COMPONENT = path.join(ROOT, 'components', 'SystemRecipesView.tsx');
const DISH_ROLE = path.join(ROOT, 'lib', 'recipeDishRole.ts');
const CORPUS = path.join(ROOT, 'lib', 'digest', 'recipes.ts');
const showBuckets = process.argv.includes('--list');

// --- the rule tables, read out of the component itself -------------------
//
// Lifted by evaluating the literal rather than by re-typing it here, so this
// script cannot drift from what the screen renders. The literal is plain data
// (labels, regular expressions, an optional guard), so there is nothing in it
// to execute.
function readSubgroupTables() {
  const source = fs.readFileSync(COMPONENT, 'utf8');
  const start = source.indexOf('const RECIPE_SUBGROUPS');
  if (start === -1) throw new Error('RECIPE_SUBGROUPS not found in SystemRecipesView.tsx');
  const open = source.indexOf('{', start);
  let depth = 0;
  let end = -1;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) { end = i; break; }
    }
  }
  if (end === -1) throw new Error('RECIPE_SUBGROUPS literal is unbalanced');
  const literal = source.slice(open, end + 1);

  // The two shared regular expressions the table refers to by name.
  const named = {};
  for (const name of ['SEAFOOD', 'NOT_SEAFOOD']) {
    const match = source.match(new RegExp(`const ${name} = (/.*/);`));
    if (!match) throw new Error(`${name} not found in SystemRecipesView.tsx`);
    named[name] = match[1];
  }
  const body = `const SEAFOOD = ${named.SEAFOOD};\nconst NOT_SEAFOOD = ${named.NOT_SEAFOOD};\nreturn ${literal};`;
  return new Function(body)();
}

// --- the five side dishes, read out of lib/recipeDishRole.ts -------------
function readSideDishIds() {
  const source = fs.readFileSync(DISH_ROLE, 'utf8');
  const start = source.indexOf('SIDE_DISH_RECIPE_IDS = new Set<string>([');
  if (start === -1) throw new Error('SIDE_DISH_RECIPE_IDS not found in recipeDishRole.ts');
  const body = source.slice(start, source.indexOf(']);', start));
  const ids = new Set([...body.matchAll(/'([^']+)'/g)].map((match) => match[1]));
  if (ids.size === 0) throw new Error('SIDE_DISH_RECIPE_IDS is empty');
  return ids;
}

// --- the corpus, read out of lib/digest/recipes.ts -----------------------
//
// One pass over the file rather than a parser: an entry's id comes first and
// its linkedBuilderType last, so a title and a curated id collected between
// the two belong to whichever entry is still open.
function readRecipes() {
  const source = fs.readFileSync(CORPUS, 'utf8');
  const entries = [];
  let id = null;
  let title = null;
  let curated = null;
  // recipes.ts is CRLF, so the carriage return comes off before any anchored
  // match, which is what a dollar sign at the end of a pattern needs.
  for (const raw of source.split('\n')) {
    const line = raw.replace(/\r$/, '');
    let match = line.match(/^ {4}id: '([^']+)',/);
    if (match) { id = match[1]; title = null; curated = null; continue; }
    match = line.match(/^ {4}title: '(.*)',$/);
    if (match && title === null) { title = match[1].replace(/\\'/g, "'"); continue; }
    match = line.match(/^ {4}linkedCuratedRecipeId: '([^']+)',/);
    if (match) { curated = match[1]; continue; }
    match = line.match(/^ {4}linkedBuilderType: '([^']+)',/);
    if (match && id && title) entries.push({ id, title, curated, builder: match[1] });
  }
  return entries;
}

const SUBGROUP_MIN = 12;
const tables = readSubgroupTables();
const sideDishIds = readSideDishIds();
const recipes = readRecipes();
if (recipes.length === 0) { console.error('read no recipes out of lib/digest/recipes.ts'); process.exit(1); }

// The same call groupKeyFor makes in the component.
const bandFor = (recipe) =>
  recipe.builder === 'side' && !sideDishIds.has(recipe.curated) ? 'main' : recipe.builder;

const byBand = new Map();
for (const recipe of recipes) {
  const band = bandFor(recipe);
  const bucket = byBand.get(band);
  if (bucket) bucket.push(recipe);
  else byBand.set(band, [recipe]);
}

let problems = 0;
const fail = (message) => { console.log(`  PROBLEM: ${message}`); problems += 1; };

console.log(`${recipes.length} recipes across ${byBand.size} bands\n`);

// The Side Builder split, printed every run so the five cannot drift.
const sideBuilder = recipes.filter((recipe) => recipe.builder === 'side');
const asMains = sideBuilder.filter((recipe) => bandFor(recipe) === 'main');
const asSides = sideBuilder.filter((recipe) => sideDishIds.has(recipe.curated));
console.log(`side builder: ${sideBuilder.length} recipes -> ${asMains.length} mains, ${asSides.length} sides`);
for (const recipe of asSides.slice().sort((a, b) => a.title.localeCompare(b.title))) {
  console.log(`    side: ${recipe.title}`);
}
if (asMains.length + asSides.length !== sideBuilder.length) {
  fail(`the side builder split is not a partition: ${asMains.length} + ${asSides.length} against ${sideBuilder.length}`);
}
const missingIds = [...sideDishIds].filter(
  (curated) => !sideBuilder.some((recipe) => recipe.curated === curated),
);
for (const curated of missingIds) fail(`SIDE_DISH_RECIPE_IDS names ${curated}, which no side-builder recipe carries`);
console.log('');

for (const [band, list] of [...byBand.entries()].sort()) {
  const rules = tables[band];
  if (!rules) {
    if (list.length > SUBGROUP_MIN) fail(`${band} holds ${list.length} recipes and has no subgroup table`);
    else console.log(`${band}: ${list.length}, one list (under the ${SUBGROUP_MIN} that needs splitting)`);
    continue;
  }
  const buckets = new Map(rules.map((rule) => [rule.label, []]));
  const seen = new Set();
  for (const recipe of list) {
    const title = recipe.title.toLowerCase();
    const hit = rules.find((rule) => rule.match.test(title) && !(rule.unless && rule.unless.test(title)));
    if (!hit) { fail(`${band}: "${recipe.title}" lands in no subgroup`); continue; }
    if (seen.has(recipe.id)) fail(`${band}: ${recipe.id} appears twice in the corpus`);
    seen.add(recipe.id);
    buckets.get(hit.label).push(recipe.title);
  }
  const placed = [...buckets.values()].reduce((total, bucket) => total + bucket.length, 0);
  if (placed !== list.length) fail(`${band}: ${list.length} recipes, ${placed} placed`);
  console.log(`${band}: ${list.length} recipes, ${placed} placed, ${seen.size} distinct ids`);
  for (const [label, bucket] of buckets) {
    if (bucket.length === 0) fail(`${band}: the "${label}" rule matches nothing`);
    console.log(`  ${label} (${bucket.length})`);
    if (showBuckets) for (const title of bucket.slice().sort()) console.log(`      ${title}`);
  }
  console.log('');
}

if (problems === 0) console.log('OK: every recipe lands in exactly one named subgroup, and no rule is dead');
else console.log(`${problems} problems`);
process.exit(problems === 0 ? 0 : 1);
