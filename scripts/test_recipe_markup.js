// Checks lib/recipeMarkup.ts, marking up any web page as a recipe (G3,
// rebuild R1): the messages the page sends back, how selected text becomes
// a name, ingredient lines and steps, that marking again replaces, that the
// page script is valid and sends nothing anywhere but back to the app, and
// the wiring into Import a Recipe and the desktop stand-in.
// Run: node scripts/test_recipe_markup.js
const fs = require('fs');
/* global __dirname */
const path = require('path');
const ts = require('typescript');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const src = read('lib/recipeMarkup.ts');
const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
const mod = { exports: {} };
new Function('module', 'exports', 'require', out.outputText)(mod, mod.exports, (name) => {
  throw new Error(`lib/recipeMarkup.ts imported ${name}`);
});
const M = mod.exports;

let failures = 0;
function ok(label, condition, detail) {
  if (!condition) {
    failures += 1;
    console.log(`FAIL ${label}${detail !== undefined ? `: ${JSON.stringify(detail)}` : ''}`);
  }
}

// --- messages -------------------------------------------------------------------
ok('not JSON', M.parseMarkupMessage('hello') === null);
ok('unknown type', M.parseMarkupMessage(JSON.stringify({ type: 'other' })) === null);
ok('empty selection dropped', M.parseMarkupMessage(JSON.stringify({ type: 'selection', text: '   ' })) === null);
const page = M.parseMarkupMessage(JSON.stringify({ type: 'page', html: '<html></html>', url: 'https://x.org/a' }));
ok('page message', page && page.type === 'page' && page.title === '', page);
ok('selection message', M.parseMarkupMessage(JSON.stringify({ type: 'selection', text: '2 eggs' })).text === '2 eggs');

// --- selected text --------------------------------------------------------------
ok('bullets and blanks go', JSON.stringify(M.selectedLines('• 2 cups oats\n\n- 1 tbsp honey\n*  pinch   salt')) === JSON.stringify(['2 cups oats', '1 tbsp honey', 'pinch salt']), M.selectedLines('• 2 cups oats\n\n- 1 tbsp honey\n*  pinch   salt'));
ok('step numbers go', JSON.stringify(M.selectedLines('1. Heat the pan.\n2) Add oil.\nStep 3: Stir.\nPaso 4 Servir.')) === JSON.stringify(['Heat the pan.', 'Add oil.', 'Stir.', 'Servir.']), M.selectedLines('1. Heat the pan.\n2) Add oil.\nStep 3: Stir.\nPaso 4 Servir.'));
ok('a quantity at the front stays', M.selectedLines('250 g lentils')[0] === '250 g lentils', M.selectedLines('250 g lentils'));
ok('a fraction stays', M.selectedLines('1/2 cup rice')[0] === '1/2 cup rice');
ok('title is the first line', M.selectedTitle('\n  Lentil   Soup \nServes 4') === 'Lentil Soup');
ok('title is kept short', M.selectedTitle('x'.repeat(400)).length === 160);

let marked = M.EMPTY_MARKED;
marked = M.applyMark(marked, 'ingredients', '2 eggs\n1 cup milk');
marked = M.applyMark(marked, 'title', 'Custard');
marked = M.applyMark(marked, 'steps', '1. Whisk.\n2. Bake.');
ok('three fields marked', marked.title === 'Custard' && marked.ingredients.length === 2 && marked.steps.length === 2, marked);
marked = M.applyMark(marked, 'ingredients', '3 eggs');
ok('marking again replaces', marked.ingredients.length === 1 && marked.ingredients[0] === '3 eggs', marked);
ok('empty starts empty', M.EMPTY_MARKED.ingredients.length === 0 && M.EMPTY_MARKED.title === '');
ok('summary counts', M.markedSummary(marked) === 'Name: Custard · 1 ingredient line · 2 steps', M.markedSummary(marked));
ok('summary with nothing', M.markedSummary(M.EMPTY_MARKED) === 'No name marked · 0 ingredient lines · 0 steps');

// --- the page script --------------------------------------------------------------
let parses = true;
try {
  new Function(M.MARKUP_PAGE_SCRIPT);
} catch (error) {
  parses = false;
  console.log(error.message);
}
ok('page script parses', parses);
ok('page script only posts back to the app', !/fetch\(|XMLHttpRequest|sendBeacon|navigator\.|WebSocket/.test(M.MARKUP_PAGE_SCRIPT));
ok('page script caps the page', M.MARKUP_PAGE_SCRIPT.includes(String(M.PAGE_HTML_CAP)));
ok('page script runs once', M.MARKUP_PAGE_SCRIPT.includes('__insideStoryMarkup'));

// --- wiring -----------------------------------------------------------------------
ok('desktop swaps react-native-webview', read('metro.config.js').includes("'react-native-webview': 'lib/desktop/unavailableModule.ts'"));
const view = read('components/RecipeMarkupView.tsx');
ok('the drawn page goes through the link reader', view.includes('extractRecipeFromHtml(message.html'));
ok('no popups from the page', view.includes('setSupportMultipleWindows={false}') && view.includes('javaScriptCanOpenWindowsAutomatically={false}'));
ok('no file access from the page', view.includes('allowFileAccess={false}'));
const importView = read('components/RecipeImportView.tsx');
ok('Import a Recipe opens it on the phone only', importView.includes('CAN_MARK_UP &&') && importView.includes("Platform.OS !== 'web' && !isDesktopApp()"));
ok('marked steps are kept with the recipe', importView.includes('instructions: pasteSteps'));
ok('a found recipe imports as a link would', importView.includes('importFound(fetched.recipe)') && importView.includes('importFound(recipe)'));

// --- words ------------------------------------------------------------------------
for (const text of [M.MARKUP_HOW_TO, M.markedSummary(marked)]) {
  ok(`no dash in "${text}"`, !/[–—]/.test(text));
  ok(`no filler in "${text}"`, !/\b(real|genuine|genuinely)\b/i.test(text));
}

if (failures) {
  console.log(`${failures} failure(s).`);
  process.exit(1);
}
console.log('All recipe markup checks passed.');
