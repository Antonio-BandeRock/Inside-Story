// Checks the Edit wording swap in a real Android export. 1.0.51.12 closed on
// launch because components/EditableText.tsx imported the bare name
// 'react-native', which Metro resolves once for every file outside
// node_modules, got the swap back instead of React Native, and rendered an
// undefined Text. Asking the resolver alone cannot catch that, since the
// cache sits in front of it, so this reads the bundle's module graph.
//
//   node scripts/test_editable_text_resolver.js            exports, then checks
//   node scripts/test_editable_text_resolver.js <bundle>   checks an existing
//                                                          unminified bundle
//   node scripts/test_editable_text_resolver.js --web      the same for the
//                                                          desktop web export
//
// --web exists because 1.0.52.3's Windows app opened to a black screen:
// components/reactNativeText.web.js asked for
// 'react-native-web/dist/exports/Text', which Metro had already resolved to
// the swap for another file in components/, so EditableText and the swap
// imported each other and React was handed an undefined Text.
/* global __dirname */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');

function exportBundle() {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'editable-text-'));
  execSync(`npx expo export -p android --no-minify --no-bytecode --output-dir "${out}"`, {
    cwd: root,
    stdio: 'ignore',
  });
  const dir = path.join(out, '_expo', 'static', 'js', 'android');
  return path.join(dir, fs.readdirSync(dir).find((name) => name.endsWith('.js')));
}

if (process.argv[2] === '--web') {
  process.exit(checkWeb());
}

// The web export in dev mode names each module's file after its
// dependency list, '},<id>,[<deps>],"<path>");', so a module is found by
// its path.
function checkWeb() {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'editable-text-web-'));
  execSync(`npx expo export -p web --dev --no-minify --output-dir "${out}"`, {
    cwd: root,
    stdio: 'ignore',
    env: { ...process.env, INSIDE_STORY_DESKTOP: '1', CI: '1' },
  });
  const dir = path.join(out, '_expo', 'static', 'js', 'web');
  const bundle = fs.readFileSync(path.join(dir, fs.readdirSync(dir).find((name) => name.endsWith('.js'))), 'utf8');
  const byPath = new Map();
  const pattern = /\},(\d+),\[([\d,]*)\],"([^"]+)"\);/g;
  let found;
  while ((found = pattern.exec(bundle))) {
    byPath.set(found[3], { id: Number(found[1]), deps: found[2] ? found[2].split(',').map(Number) : [] });
  }
  let failed = 0;
  const expect = (label, ok) => {
    if (!ok) failed += 1;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`);
  };
  const swap = byPath.get('components/editableTextForWeb.js');
  const editable = byPath.get('components/EditableText.tsx');
  const text = byPath.get('components/reactNativeText.web.js');
  const webText = byPath.get('node_modules/react-native-web/dist/exports/Text/index.js');
  expect('the web export carries all four modules', !!(swap && editable && text && webText));
  if (swap && editable && text && webText) {
    expect('the web swap reaches EditableText', swap.deps.includes(editable.id));
    expect('EditableText reaches reactNativeText.web.js', editable.deps.includes(text.id));
    expect('reactNativeText.web.js is React Native Web Text', text.deps.includes(webText.id));
    expect('reactNativeText.web.js never depends on the swap', !text.deps.includes(swap.id));
    expect('EditableText never depends on the swap', !editable.deps.includes(swap.id));
    const users = [...byPath.values()].filter((mod) => mod.deps.includes(swap.id)).length;
    expect(`the app's own files use the web swap (${users} modules)`, users > 50);
  }
  console.log(failed ? `\n${failed} failed` : '\nall passed');
  return failed ? 1 : 0;
}

const bundlePath = process.argv[2] || exportBundle();
const source = fs.readFileSync(bundlePath, 'utf8');

// An unminified module ends "},<id>,[<deps>]);" and its body opens with the
// comment block its source file starts with, so a module is found by a line
// only that file carries.
const modules = [];
const ending = /\n\},(\d+),\[([\d,]*)\]/g;
let start = 0;
let match;
while ((match = ending.exec(source))) {
  modules.push({
    id: Number(match[1]),
    deps: match[2] ? match[2].split(',').map(Number) : [],
    body: source.slice(start, match.index),
  });
  start = match.index + match[0].length;
}
const byId = new Map(modules.map((mod) => [mod.id, mod]));

function find(marker) {
  const found = modules.filter((mod) => mod.body.includes(marker));
  if (found.length !== 1) throw new Error(`expected one module carrying "${marker}", found ${found.length}`);
  return found[0];
}

let failures = 0;
function check(label, ok) {
  if (!ok) failures += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`);
}

const wrapper = find('var withEditableText = {};');
const editable = find('function EditableText(props)');
const reactNativeText = find('return _reactNativeIndex.Text;');
const reactNative = find('get ActivityIndicator()');

check('the swap reaches React Native itself', wrapper.deps.includes(reactNative.id));
check('the swap reaches EditableText', wrapper.deps.includes(editable.id));
check('EditableText never depends on the swap', !editable.deps.includes(wrapper.id));
check('EditableText reaches reactNativeText.js', editable.deps.includes(reactNativeText.id));
check('reactNativeText.js is React Native itself', reactNativeText.deps.includes(reactNative.id));
check('reactNativeText.js never depends on the swap', !reactNativeText.deps.includes(wrapper.id));

const usersOfSwap = modules.filter((mod) => mod.deps.includes(wrapper.id)).length;
check(`the app's own files use the swap (${usersOfSwap} modules)`, usersOfSwap > 50);
check('React Native itself is not the swap', !reactNative.deps.includes(wrapper.id) && byId.has(reactNative.id));

console.log(failures ? `\n${failures} failed` : '\nall passed');
process.exit(failures ? 1 : 0);
