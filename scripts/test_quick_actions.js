// Checks lib/quickActions.ts, the app icon shortcuts (C12, rebuild R1):
// three of them, each with a unique id, a title Android shows in full, and
// a route that exists in app/. Also checks the desktop build swaps both
// packages for stand-ins and that the router is mounted in the tabs layout.
// Run: node scripts/test_quick_actions.js
const fs = require('fs');
/* global __dirname */
const path = require('path');
const ts = require('typescript');

const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'lib', 'quickActions.ts'), 'utf8');
const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
const mod = { exports: {} };
new Function('module', 'exports', 'require', out.outputText)(mod, mod.exports, (name) => {
  throw new Error(`lib/quickActions.ts imported ${name}`);
});
const { QUICK_ACTIONS } = mod.exports;

let failures = 0;
function ok(label, condition, detail) {
  if (!condition) {
    failures += 1;
    console.log(`FAIL ${label}${detail !== undefined ? `: ${JSON.stringify(detail)}` : ''}`);
  }
}

ok('three shortcuts', QUICK_ACTIONS.length === 3, QUICK_ACTIONS.length);
ok('ids are unique', new Set(QUICK_ACTIONS.map((a) => a.id)).size === QUICK_ACTIONS.length);
// Android cuts a launcher shortcut's short label past about 25 characters.
for (const action of QUICK_ACTIONS) {
  ok(`${action.id} title fits`, action.title.length <= 25, action.title);
  ok(`${action.id} has no dash`, !/[–—]/.test(action.title), action.title);
  const href = action.params.href;
  ok(`${action.id} href is a path`, href.startsWith('/'), href);
  const route = href.slice(1).split('?')[0];
  const candidates = [
    path.join(root, 'app', `${route}.tsx`),
    path.join(root, 'app', '(tabs)', `${route}.tsx`),
    path.join(root, 'app', route, 'index.tsx'),
  ];
  ok(`${action.id} route exists`, candidates.some((file) => fs.existsSync(file)), route);
}

const metro = fs.readFileSync(path.join(root, 'metro.config.js'), 'utf8');
ok('desktop swaps expo-quick-actions', metro.includes("'expo-quick-actions': 'lib/desktop/unavailableModule.ts'"));
ok('desktop swaps expo-quick-actions/router', metro.includes("'expo-quick-actions/router': 'lib/desktop/unavailableModule.ts'"));
const layout = fs.readFileSync(path.join(root, 'app', '(tabs)', '_layout.tsx'), 'utf8');
ok('router mounted in the tabs layout', layout.includes('<QuickActionRouter />'));

if (failures) {
  console.log(`${failures} failure(s).`);
  process.exit(1);
}
console.log('All quick action checks passed.');
