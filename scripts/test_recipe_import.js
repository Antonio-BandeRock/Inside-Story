// Checks lib/recipeImport.ts, importing a recipe from a web link (G1,
// 2026-09-26):
// 1. The schema.org Recipe block is found wherever a site puts it: a plain
//    object, an array, an @graph, a mainEntity, an @type given as a list.
// 2. Instructions come out of strings, HowToStep and HowToSection alike.
// 3. Each ingredient line gives an amount, a builder unit, the food words
//    and a note, and a line with no amount says so rather than guessing.
// 4. Nothing is ready for a builder until every line is matched or left out.
// 5. No sentence judges, praises or uses a dash.
//
// Pure, so it runs here rather than needing a phone. Exits non-zero on any
// failure.

/* global __dirname */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function load(relPath) {
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, () => {
    throw new Error('lib/recipeImport.ts must stay free of imports');
  });
  return module.exports;
}

const R = load('lib/recipeImport.ts');

let failures = 0;
let checks = 0;
function check(label, ok) {
  checks += 1;
  if (!ok) {
    failures += 1;
    console.error('FAIL: ' + label);
  }
}
const near = (a, b, tolerance = 0.01) => a !== null && Math.abs(a - b) <= tolerance;

// 1. Finding the Recipe block.
const graphPage = `<html><head><title>Lentil Soup | Example Kitchen</title>
<script type="application/ld+json">{"@context":"https://schema.org","@graph":[
  {"@type":"WebPage","name":"page"},
  {"@type":["Recipe","NewsArticle"],"name":"Red Lentil Soup &amp; Lemon","author":[{"@type":"Person","name":"Ana Ruiz"}],
   "recipeYield":["4","4 servings"],"prepTime":"PT15M","cookTime":"PT1H5M","totalTime":"PT1H20M",
   "recipeIngredient":["1 &frac12; cups red lentils, rinsed","2 tbsp olive oil","For the topping:","Salt, to taste"],
   "recipeInstructions":[{"@type":"HowToSection","name":"Soup","itemListElement":[{"@type":"HowToStep","text":"Warm the oil."},{"@type":"HowToStep","text":"Add the lentils."}]},{"@type":"HowToStep","text":"Serve with lemon."}]}
]}</script></head><body></body></html>`;
const graph = R.extractRecipeFromHtml(graphPage, 'https://www.example.com/lentil-soup');
check('a Recipe inside @graph is found', graph !== null);
check('the name is decoded', graph && graph.name === 'Red Lentil Soup & Lemon');
check('the author comes from a Person list', graph && graph.author === 'Ana Ruiz');
check('servings from the yield', graph && graph.servings === 4 && graph.yieldText === '4 servings');
check('times read from ISO durations', graph && graph.prepMinutes === 15 && graph.cookMinutes === 65 && graph.totalMinutes === 80);
check('ingredient entities decoded', graph && graph.ingredientLines[0] === '1 ½ cups red lentils, rinsed');
check('sections keep their heading as a line', graph && graph.instructions.join('|') === 'Soup:|Warm the oil.|Add the lentils.|Serve with lemon.');
check('the site is the host without www', graph && graph.sourceSite === 'example.com');

const arrayPage = `<script type='application/ld+json'>[{"@type":"Organization"},{"@type":"Recipe","name":"Oat Bars","recipeIngredient":["2 cups oats"],"recipeInstructions":"Mix.\\nBake 20 minutes."}]</script>`;
const arr = R.extractRecipeFromHtml(arrayPage, 'https://bars.example.org/x');
check('a Recipe in a top-level array is found', arr && arr.name === 'Oat Bars');
check('a single instruction string splits on line breaks', arr && arr.instructions.length === 2);

const mainEntityPage = `<script type="application/ld+json">{"@type":"WebPage","mainEntity":{"@type":"http://schema.org/Recipe","name":"Kraut","recipeIngredient":"1 head cabbage"}}</script>`;
const main = R.extractRecipeFromHtml(mainEntityPage, 'https://k.example.net');
check('a Recipe under mainEntity with a full type URL is found', main && main.name === 'Kraut' && main.ingredientLines.length === 1);

const loosePage = `<script type="application/ld+json">{"@type":"Recipe","name":"Loose","recipeIngredient":["1 egg",],}</script>`;
check('a trailing comma does not sink the block', R.extractRecipeFromHtml(loosePage, 'https://x.example.com') !== null);

const noRecipe = '<html><head><meta property="og:title" content="Just a blog post"></head></html>';
check('a page with no Recipe block gives null', R.extractRecipeFromHtml(noRecipe, 'https://blog.example.com') === null);
check('its title is still readable', R.pageTitleFromHtml(noRecipe) === 'Just a blog post');
check('only http and https are fetched', R.isFetchableUrl('https://a.example.com/r') && !R.isFetchableUrl('file:///c/x') && !R.isFetchableUrl('javascript:alert(1)'));
check('a bad duration is null', R.parseIsoDuration('20 minutes') === null && R.parseIsoDuration('P') === null);

// 2 and 3. Ingredient lines.
function line(text) {
  return R.parseIngredientLine(text);
}
const oats = line('1 ½ cups rolled oats, toasted');
check('a mixed unicode fraction', near(oats.quantity, 1.5) && oats.unit === 'cup');
check('food words and note split at the comma', oats.foodText === 'rolled oats' && oats.prepNote === 'toasted');
const flour = line('1 cup (120 g) all-purpose flour');
check('a bracketed weight is preferred', flour.quantity === 120 && flour.unit === 'g' && flour.foodText === 'all-purpose flour');
const tomatoes = line('2 (14 oz) cans diced tomatoes');
check('a can size times the count', tomatoes.quantity === 28 && tomatoes.unit === 'oz');
check('diced maps to the builders\' Diced', tomatoes.cutPrep === 'Diced');
check('prep words leave the search words', tomatoes.searchText === 'tomatoes');
const range = line('2-3 cloves garlic, minced');
check('a range uses the middle', range.quantity === 2.5 && range.unit === 'piece' && range.rangeNote !== null);
check('minced maps', range.cutPrep === 'Minced');
const salt = line('Salt and freshly ground pepper, to taste');
check('no amount is null, never a guess', salt.quantity === null && salt.toTaste);
check('a heading is marked', line('For the dressing:').isHeader && line('Topping:').isHeader);
check('kilograms become grams', line('1.2 kg pork shoulder').quantity === 1200);
check('litres become millilitres', line('1 l stock').quantity === 1000 && line('1 l stock').unit === 'ml');
check('a pint is two cups', line('1 pint blueberries').quantity === 2 && line('1 pint blueberries').unit === 'cup');
check('fluid ounces become millilitres', near(line('4 fl oz milk').quantity, 118.294, 0.01));
check('a stick of butter is 8 tbsp', line('1 stick butter').quantity === 8 && line('1 stick butter').unit === 'tbsp');
check('capital T is a tablespoon', line('2 T honey').unit === 'tbsp' && line('2 t salt').unit === 'tsp');
check('garlic is not grams', line('2 garlic cloves').unit === 'piece');
check('a large egg is a piece', line('3 large eggs').unit === 'piece' && line('3 large eggs').foodText === 'eggs');
check('a plain fraction', line('1/2 tsp cumin').quantity === 0.5);
check('a decimal', line('0.5 cup rice').quantity === 0.5);
check('"a pinch" reads as an amount', near(line('a pinch of salt').quantity, 0.063, 0.001));
check('optional is flagged', line('1 tbsp chia seeds (optional)').optional);
check('the original line is kept', line('1 cup kefir').original === '1 cup kefir');
check('an en dash becomes a hyphen', !/[—–]/.test(line('2–3 carrots').original) && line('2–3 carrots').quantity === 2.5);

check('pasted lines lose bullets and numbering', R.splitPastedIngredients('• 1 cup oats\n2. 2 eggs\n- salt\n\n3\n2 cups milk').join('|') === '1 cup oats|2 eggs|salt|2 cups milk');

// Builder units.
check('grams stay grams in metric', R.toBuilderAmount(200, 'g', 'metric').unit === 'g');
check('grams become ounces in imperial', R.toBuilderAmount(200, 'g', 'imperial').unit === 'oz');
check('large weights become pounds in imperial', R.toBuilderAmount(1000, 'g', 'imperial').unit === 'lb');
check('ounces become grams in metric', near(R.toBuilderAmount(1, 'oz', 'metric').quantity, 28.3, 0.1));
check('millilitres become cups in imperial', R.toBuilderAmount(250, 'ml', 'imperial').unit === 'cup');
check('a spoon stays a spoon', R.toBuilderAmount(2, 'tbsp', 'imperial').unit === 'tbsp');

// 4. Readiness.
const unready = R.importReadiness([
  { isHeader: true, leftOut: false, matched: false, quantity: null },
  { isHeader: false, leftOut: false, matched: true, quantity: 1 },
  { isHeader: false, leftOut: false, matched: false, quantity: 2 },
  { isHeader: false, leftOut: false, matched: true, quantity: null },
]);
check('an unmatched line holds it back', !unready.ready && unready.toMatch === 1 && unready.toAmount === 1);
const ready = R.importReadiness([
  { isHeader: false, leftOut: false, matched: true, quantity: 1 },
  { isHeader: false, leftOut: true, matched: false, quantity: null },
]);
check('matched or left out is ready', ready.ready && ready.leftOut === 1 && ready.included === 1);
check('all left out is not ready', !R.importReadiness([{ isHeader: false, leftOut: true, matched: false, quantity: null }]).ready);

// 5. Wording.
const written = [
  unready.sentence,
  ready.sentence,
  R.importReadiness([]).sentence,
  R.importReadiness([{ isHeader: false, leftOut: true, matched: false, quantity: null }]).sentence,
  R.noRecipeFoundSentence('example.com'),
  R.noRecipeFoundSentence(''),
  R.attributionLine({ sourceSite: 'example.com', sourceUrl: 'https://example.com', author: 'Ana Ruiz' }),
  R.describeAmount(null, 'piece'),
  R.describeAmount(1, 'cup'),
  range.rangeNote,
];
const FORBIDDEN = /too low|too high|\bideal\b|\boptimal\b|healthy range|well done|good job|keep it up|great|\breal\b|\bgenuine|\bown\b|[—–]| -- /i;
for (const text of written) check(`no verdict, praise or dashes in: ${text}`, !FORBIDDEN.test(text));

console.log(`${checks - failures}/${checks} checks passed`);
if (failures > 0) process.exit(1);
