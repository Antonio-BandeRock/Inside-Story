// Checks the popup-menu fit rules (lib/menuFit.ts): that a card that fits is
// left exactly as it was, that a card that does not fit is clamped to the room
// available and told to scroll, that clamping can never make a card taller
// than it asked for, and that the menu heights this app ships behave the
// way they are supposed to on the screens that shrink them (Android's Display
// size setting, a landscape or split-screen viewport, a foldable).
//
// Pure, so it runs here rather than needing a phone. Exits non-zero on any
// failure.

// eslint-config-expo lints this repo as app code, which has no __dirname.
// This is a plain Node script run with node, so it does.
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
    throw new Error('lib/menuFit.ts must stay free of runtime imports');
  });
  return module.exports;
}

const { MENU_CARD_MIN_HEIGHT, MENU_CARD_TOP_GAP, cornerHubLeft, fitMenuCard, menuCardRoom, secondaryHubCardLeft } = load('lib/menuFit.ts');

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

// ---------------------------------------------------------------------------
// The room itself.
// ---------------------------------------------------------------------------

// useMenuCardBottom() is insets.bottom + 113, so a phone with a 24 dp gesture
// bar puts the card's bottom edge 137 dp up. A 891 dp portrait window with a
// 40 dp status bar leaves 891 - 137 - 40 - 16.
check('room is the window minus everything taken out of it', menuCardRoom({ windowHeight: 891, cardBottom: 137, topInset: 40 }), 698);
check('the top gap is part of it', MENU_CARD_TOP_GAP, 16);
check('a caller can set its own top gap', menuCardRoom({ windowHeight: 891, cardBottom: 137, topInset: 40, topGap: 0 }), 714);
check('room can come back negative', menuCardRoom({ windowHeight: 100, cardBottom: 137, topInset: 40 }) < 0, true);

// ---------------------------------------------------------------------------
// The fit.
// ---------------------------------------------------------------------------

const portrait = { windowHeight: 891, cardBottom: 137, topInset: 40 };

check('a card that fits is left alone', fitMenuCard({ desired: 402, ...portrait }), { height: 402, scrolls: false, room: 698 });
check('a tall window never stretches a card', fitMenuCard({ desired: 200, ...portrait }).height, 200);

// A 411 x 891 phone rotated: the same card, 411 dp of height to put it in.
const landscape = { windowHeight: 411, cardBottom: 137, topInset: 40 };
check('room on a landscape phone', menuCardRoom(landscape), 218);
check('a card that does not fit is clamped and scrolls', fitMenuCard({ desired: 402, ...landscape }), { height: 218, scrolls: true, room: 218 });

// The floor exists so a pathological window cannot produce a card of nothing.
const sliver = { windowHeight: 200, cardBottom: 137, topInset: 40 };
check('the floor holds on an absurdly short window', fitMenuCard({ desired: 402, ...sliver }).height, MENU_CARD_MIN_HEIGHT);
check('and it still says it scrolls', fitMenuCard({ desired: 402, ...sliver }).scrolls, true);
check('the floor never inflates a card past what it wanted', fitMenuCard({ desired: 90, ...sliver }).height, 90);
check('a caller can set its own floor', fitMenuCard({ desired: 402, ...sliver, minHeight: 250 }).height, 250);

// Before the window reports a size, render what the card asked for: the old
// behavior, rather than a card collapsed to nothing.
check('an unmeasured window changes nothing', fitMenuCard({ desired: 402, windowHeight: 0, cardBottom: 137, topInset: 40 }), { height: 402, scrolls: false, room: 402 });
check('nor does a nonsense one', fitMenuCard({ desired: 402, windowHeight: NaN, cardBottom: 137, topInset: 40 }).height, 402);

// ---------------------------------------------------------------------------
// The four heights this app actually ships, against the screens that shrink
// them. These are the numbers worked out when the pass was designed: TabHub
// and LensHub, each at Normal line spacing with the phone's font size at 1.0,
// and at Roomier with the font-size cap of 1.3.
// ---------------------------------------------------------------------------

const WANTED = {
  'TabHub at Normal': 352,
  'TabHub at Roomier, largest text': 396,
  'LensHub at Normal': 402,
  'LensHub at Roomier, largest text': 461,
};

// 1080x2340 at ~2.625 density.
const GALAXY_PORTRAIT = 891;
const GALAXY_LANDSCAPE = 411;

for (const [name, desired] of Object.entries(WANTED)) {
  check(`${name} fits an ordinary portrait phone`, fitMenuCard({ desired, windowHeight: GALAXY_PORTRAIT, cardBottom: 137, topInset: 40 }).scrolls, false);
}

// Landscape, and Display size at Large (which raises the density, so the same
// screen reports roughly 1.15x fewer dp), and a split-screen half. Every one of
// them has to leave a usable card rather than one running off the top.
const SHORT_WINDOWS = {
  landscape: GALAXY_LANDSCAPE,
  'Display size Large, portrait': Math.round(GALAXY_PORTRAIT / 1.15),
  'Display size Large, landscape': Math.round(GALAXY_LANDSCAPE / 1.15),
  'split-screen half': Math.round(GALAXY_PORTRAIT / 2),
};

for (const [windowName, windowHeight] of Object.entries(SHORT_WINDOWS)) {
  for (const [cardName, desired] of Object.entries(WANTED)) {
    const fit = fitMenuCard({ desired, windowHeight, cardBottom: 137, topInset: 40 });
    check(`${cardName} on a ${windowName} stays on screen`, fit.height <= Math.max(fit.room, MENU_CARD_MIN_HEIGHT), true);
    check(`${cardName} on a ${windowName} is never taller than it wanted`, fit.height <= desired, true);
  }
}

// The specific thing that was wrong before this existed: the tallest menu at
// the roomiest setting, on a landscape phone, used to render at its full 461
// with its bottom edge 137 up, which puts its top edge 598 dp above the bottom
// of a 411 dp window. Roughly 187 dp of menu, including two whole rows of
// options, was off the screen with no way to reach it.
check('the bug this pass fixes was there', 461 + 137 > GALAXY_LANDSCAPE, true);
check('and it is not there any more', fitMenuCard({ desired: 461, windowHeight: GALAXY_LANDSCAPE, cardBottom: 137, topInset: 40 }).height + 137 <= GALAXY_LANDSCAPE, true);

// Display size Large on an ordinary portrait phone is the case most people
// will actually hit, since it needs no second screen and no rotation at all.
const displayLarge = fitMenuCard({ desired: 461, windowHeight: Math.round(GALAXY_PORTRAIT / 1.15), cardBottom: 137, topInset: 40 });
check('Display size Large in portrait still fits the tallest menu', displayLarge.scrolls, false);

// And the setting past it, which shrinks further again.
const displayLargest = fitMenuCard({ desired: 461, windowHeight: Math.round(GALAXY_PORTRAIT / 1.3), cardBottom: 137, topInset: 40 });
check('the largest Display size clamps rather than clips', displayLargest.height <= 461, true);
check('and what is clamped scrolls', displayLargest.height < 461 ? displayLargest.scrolls : true, true);

// Where the corner hub (LensHub, and My Items and Insights' ScopeHub, which
// position themselves from it) sits. Direct request, 2026-09-21: on Windows
// "they should stay a specific distance from the TabHub menu icon ... no
// matter how wide the app is made to be." A phone keeps its corner.
const HUB = { buttonSize: 60, gap: 12, cornerMargin: 16 };
check('a phone keeps the corner margin', cornerHubLeft({ ...HUB, windowWidth: 411, nearTabHub: false }), 16);
check('a wide phone or tablet keeps it too', cornerHubLeft({ ...HUB, windowWidth: 1024, nearTabHub: false }), 16);
check('a narrow phone pulls it in under the second slot', cornerHubLeft({ ...HUB, windowWidth: 320, nearTabHub: false }), 320 / 2 - 30 - 144);
check('desktop at the default window width sits two slots left of TabHub', cornerHubLeft({ ...HUB, windowWidth: 600, nearTabHub: true }), 600 / 2 - 30 - 144);
check('desktop at 1400 wide is still two slots left of TabHub', cornerHubLeft({ ...HUB, windowWidth: 1400, nearTabHub: true }), 1400 / 2 - 30 - 144);
check('the distance to TabHub does not change with the window', cornerHubLeft({ ...HUB, windowWidth: 1400, nearTabHub: true }) - 1400 / 2, cornerHubLeft({ ...HUB, windowWidth: 600, nearTabHub: true }) - 600 / 2);
check('desktop never goes past the left edge', cornerHubLeft({ ...HUB, windowWidth: 300, nearTabHub: true }), 0);

// And where its popup card opens: the phone's margin, or over the button on
// desktop, never past the right edge.
check('a phone opens the card at the margin', secondaryHubCardLeft({ windowWidth: 411, cardWidth: 300, buttonLeft: 16, leftMargin: 16, nearTabHub: false }), 16);
check('desktop opens the card over its button', secondaryHubCardLeft({ windowWidth: 1400, cardWidth: 300, buttonLeft: 526, leftMargin: 16, nearTabHub: true }), 526);
check('desktop keeps the card inside a narrow window', secondaryHubCardLeft({ windowWidth: 600, cardWidth: 300, buttonLeft: 126, leftMargin: 16, nearTabHub: true }), 126);
check('desktop clamps the card to the right edge', secondaryHubCardLeft({ windowWidth: 400, cardWidth: 300, buttonLeft: 126, leftMargin: 16, nearTabHub: true }), 100);
check('and never past the left edge', secondaryHubCardLeft({ windowWidth: 250, cardWidth: 300, buttonLeft: 0, leftMargin: 16, nearTabHub: true }), 0);
check('an unmeasured window falls back to the margin', secondaryHubCardLeft({ windowWidth: 0, cardWidth: 300, buttonLeft: 0, leftMargin: 16, nearTabHub: true }), 16);

if (failures > 0) {
  console.error(`\n${failures} of ${checks} checks failed`);
  process.exit(1);
}
console.log(`All ${checks} checks passed`);
