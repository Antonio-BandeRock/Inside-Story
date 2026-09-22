// Checks the three desktop-day rules of 2026-09-21 that live in pure modules:
//
// 1. lib/hubHandoff.ts, the registry behind "tap another hub's button while
//    a menu is open and land on that hub": a later registration under a key
//    replaces the earlier one, the earlier one's remover then does nothing,
//    the stand-ins a menu renders are everyone but itself, and iOS waits for
//    onDismiss where every other platform opens at once.
// 2. DESKTOP_START_WINDOW_WIDTH_DP in lib/menuFit.ts, the width the hub menus
//    keep on the desktop build, is the window's starting width in
//    desktop/main.js at the standard zoom in desktop/zoom.js, so neither can
//    drift from it unnoticed (the span arithmetic itself is covered by
//    scripts/test_menuFit.js).
// 3. lib/desktop/zoom.ts and desktop/zoom.js hold the same text size steps
//    and the same standard, and both land an off-list value on the nearest
//    step, so Profile's picker and the View menu always describe the same
//    size.
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
    throw new Error(`${relPath} must stay free of runtime imports`);
  });
  return module.exports;
}

// desktop/zoom.js needs electron's ipcMain and Menu only inside install()
// and buildMenu(), neither of which runs here; a stub keeps require happy.
function loadDesktopZoom() {
  const file = path.join(__dirname, '..', 'desktop', 'zoom.js');
  const source = fs.readFileSync(file, 'utf8');
  const module = { exports: {} };
  const stubRequire = (name) => {
    if (name === 'electron') return { ipcMain: {}, Menu: {} };
    return require(name);
  };
  new Function('exports', 'module', 'require', '__dirname', source)(module.exports, module, stubRequire, path.dirname(file));
  return module.exports;
}

const hub = load('lib/hubHandoff.ts');
const { DESKTOP_START_WINDOW_WIDTH_DP } = load('lib/menuFit.ts');
const zoomTs = load('lib/desktop/zoom.ts');
const zoomJs = loadDesktopZoom();

let checks = 0;
let failures = 0;

function check(name, actual, expected) {
  checks += 1;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    failures += 1;
    console.error(`FAIL ${name}\n  expected ${JSON.stringify(expected)}\n  got      ${JSON.stringify(actual)}`);
  }
}

function spot(key, left, open) {
  return { key, left, bottom: 100, width: 60, height: 60, open: open || (() => {}) };
}

// ---------------------------------------------------------------------------
// The registry.
// ---------------------------------------------------------------------------

hub.resetHubSpotsForTests();
check('starts empty', hub.getHubSpots(), []);

let events = 0;
const unsubscribe = hub.subscribeHubSpots(() => {
  events += 1;
});

const removeTab = hub.registerHubSpot(spot('tab', 200));
check('a registration is listed', hub.getHubSpots().map((s) => s.key), ['tab']);
check('and announced', events, 1);

const before = hub.getHubSpots();
check('the snapshot is the same array until something changes', hub.getHubSpots() === before, true);

const removeLensOld = hub.registerHubSpot(spot('lens', 16));
const removeLensNew = hub.registerHubSpot(spot('lens', 24));
check('a later registration under a key replaces the earlier one', hub.getHubSpots().find((s) => s.key === 'lens').left, 24);
check('one entry per key', hub.getHubSpots().length, 2);

removeLensOld();
check("the earlier instance's remover leaves the newer entry alone", hub.getHubSpots().find((s) => s.key === 'lens').left, 24);
check('and announces nothing', events, 3);

removeLensNew();
check("the newer instance's remover takes it out", hub.getHubSpots().map((s) => s.key), ['tab']);

// The stand-ins a menu renders: everyone registered but itself.
const remove2 = hub.registerHubSpot(spot('lens', 16));
const remove3 = hub.registerHubSpot(spot('myItems', 80));
check('TabHub renders the other two', hub.otherHubSpots(hub.getHubSpots(), 'tab').map((s) => s.key), ['lens', 'myItems']);
check('LensHub renders the other two', hub.otherHubSpots(hub.getHubSpots(), 'lens').map((s) => s.key), ['tab', 'myItems']);
check('a screen without MyItemsHub gets one stand-in in LensHub', (remove3(), hub.otherHubSpots(hub.getHubSpots(), 'lens').map((s) => s.key)), ['tab']);

// Removing is by identity, so a stale remover run twice is harmless.
remove3();
remove2();
removeTab();
check('everything removed', hub.getHubSpots(), []);
unsubscribe();
hub.registerHubSpot(spot('tab', 200));
check('an unsubscribed listener hears nothing more', events, 9);
hub.resetHubSpotsForTests();

// When the target may open.
check('iOS waits for onDismiss', hub.handoffTiming('ios'), 'onDismiss');
check('Android opens at once', hub.handoffTiming('android'), 'immediate');
check('the desktop build (web) opens at once', hub.handoffTiming('web'), 'immediate');

// ---------------------------------------------------------------------------
// The width the hub menus keep on the desktop build.
// ---------------------------------------------------------------------------

const mainJs = fs.readFileSync(path.join(__dirname, '..', 'desktop', 'main.js'), 'utf8');
const defaultWidthMatch = mainJs.match(/^const DEFAULT_WIDTH = (\d+);/m);
check('desktop/main.js states the starting window width', defaultWidthMatch != null, true);
const desktopStartWidthPx = defaultWidthMatch ? Number(defaultWidthMatch[1]) : NaN;
check('the hub menus keep that width at the standard zoom', DESKTOP_START_WINDOW_WIDTH_DP, desktopStartWidthPx / zoomJs.DEFAULT_ZOOM);

// ---------------------------------------------------------------------------
// The text size steps, in both halves.
// ---------------------------------------------------------------------------

check('the app and Electron list the same steps', [...zoomTs.DESKTOP_TEXT_SIZE_STEPS], zoomJs.ZOOM_STEPS);
check('and the same standard', zoomTs.DESKTOP_TEXT_SIZE_DEFAULT, zoomJs.DEFAULT_ZOOM);
check('the standard is on the list', zoomJs.ZOOM_STEPS.includes(zoomJs.DEFAULT_ZOOM), true);
check('steps rise', zoomJs.ZOOM_STEPS.every((step, i) => i === 0 || step > zoomJs.ZOOM_STEPS[i - 1]), true);

check('an off-list value lands on the nearest step (app)', zoomTs.nearestDesktopTextSize(1.3), 1.25);
check('an off-list value lands on the nearest step (Electron)', zoomJs.nearestStep(1.3), 1.25);
check('a value far above the list lands on the top step', zoomJs.nearestStep(9), 2);
check('nonsense lands on the standard', zoomJs.nearestStep('what'), 1.25);
check('NaN lands on the standard (app)', zoomTs.nearestDesktopTextSize(NaN), 1.25);

check('larger goes one step up', zoomJs.steppedZoom(1.25, 1), 1.5);
check('smaller goes one step down', zoomJs.steppedZoom(1.25, -1), 1.1);
check('and stops at the top', zoomJs.steppedZoom(2, 1), 2);
check('and at the bottom', zoomJs.steppedZoom(1, -1), 1);

check('the picker labels the standard', zoomTs.desktopTextSizeLabel(1.25), '125% (standard)');
check('and the rest as percentages', zoomTs.desktopTextSizeLabel(1.5), '150%');
check('every label maps back to its step', zoomTs.DESKTOP_TEXT_SIZE_LABELS.map(zoomTs.desktopTextSizeForLabel), [...zoomTs.DESKTOP_TEXT_SIZE_STEPS]);
check('an unknown label maps to nothing', zoomTs.desktopTextSizeForLabel('huge'), null);

if (failures > 0) {
  console.error(`${failures} of ${checks} checks failed`);
  process.exit(1);
}
console.log(`All ${checks} checks passed`);
