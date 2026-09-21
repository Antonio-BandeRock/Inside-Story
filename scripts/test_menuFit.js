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

const {
  DESKTOP_START_WINDOW_WIDTH_DP,
  MENU_CARD_MIN_HEIGHT,
  MENU_CARD_TOP_GAP,
  cornerHubLeft,
  fitMenuCard,
  gridColumnsFor,
  hubMenuCardSpan,
  menuCardRoom,
  pageIdentityBoxSpan,
  secondaryHubCardLeft,
} = load('lib/menuFit.ts');

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

// Where a hub menu card (TabHub's, LensHub's) goes and how wide it is.
// Direct request, 2026-09-21: "centered on the tabhub button and use the full
// width of the mobile screen, and the starting width only of the windows
// screen."
check('a phone gets the whole window', hubMenuCardSpan({ windowWidth: 411, desktop: false }), { left: 0, width: 411 });
check('a tablet gets the whole window too', hubMenuCardSpan({ windowWidth: 1024, desktop: false }), { left: 0, width: 1024 });
check('desktop at the starting width gets the whole window', hubMenuCardSpan({ windowWidth: 480, desktop: true }), { left: 0, width: 480 });
check('desktop dragged wider keeps the starting width, centered', hubMenuCardSpan({ windowWidth: 1400, desktop: true }), { left: 460, width: 480 });
check('so the card is centered on TabHub', 460 + 480 / 2, 1400 / 2);
check('desktop dragged narrower gets the whole window', hubMenuCardSpan({ windowWidth: 320, desktop: true }), { left: 0, width: 320 });
check('an unmeasured window takes the starting width at the edge', hubMenuCardSpan({ windowWidth: 0, desktop: true }), { left: 0, width: DESKTOP_START_WINDOW_WIDTH_DP });
check('the starting width is the desktop window at its standard zoom', DESKTOP_START_WINDOW_WIDTH_DP, 600 / 1.25);

// How many columns a lens grid gets: the page's own count, or more when the
// card is wide enough at the column width the longest labels fit in.
const COLUMN = (300 - 16) / 3;
check('the old 300 dp card gives the page its three columns', gridColumnsFor({ innerWidth: 300 - 16, columnWidth: COLUMN, minColumns: 3 }), 3);
check('a 411 dp phone gets four', gridColumnsFor({ innerWidth: 411 - 16, columnWidth: COLUMN, minColumns: 3 }), 4);
check('a 360 dp phone keeps three', gridColumnsFor({ innerWidth: 360 - 16, columnWidth: COLUMN, minColumns: 3 }), 3);
check('the desktop starting width gets four', gridColumnsFor({ innerWidth: 480 - 16, columnWidth: COLUMN, minColumns: 3 }), 4);
check('a narrow window never drops below the page count', gridColumnsFor({ innerWidth: 200, columnWidth: COLUMN, minColumns: 3 }), 3);
check('a tablet gets many', gridColumnsFor({ innerWidth: 1024 - 16, columnWidth: COLUMN, minColumns: 3 }), 10);
check('an unmeasured card gives the page count', gridColumnsFor({ innerWidth: 0, columnWidth: COLUMN, minColumns: 2 }), 2);

// The corner box that says where you are: a phone's span runs from clear of
// the TabHub artwork to the margin; desktop keeps its starting width against
// the margin. Direct request, 2026-09-21: "should not be allowed to grow
// beyond the initial size it is given on install on Windows."
const BOX = { clearOfButton: 30 + 14, margin: 16 };
check('a phone spans from the artwork to the margin', pageIdentityBoxSpan({ ...BOX, windowWidth: 411, desktop: false }), { left: 411 / 2 + 44, right: 16 });
check('a wide phone stretches with it', pageIdentityBoxSpan({ ...BOX, windowWidth: 1024, desktop: false }), { left: 1024 / 2 + 44, right: 16 });
const startBox = pageIdentityBoxSpan({ ...BOX, windowWidth: 480, desktop: true });
check('desktop at the starting width matches the phone span', startBox, { left: 480 / 2 + 44, right: 16 });
const wideBox = pageIdentityBoxSpan({ ...BOX, windowWidth: 1400, desktop: true });
check('desktop dragged wider keeps that width', 1400 - wideBox.right - wideBox.left, 480 - startBox.right - startBox.left);
check('and stays against the margin', wideBox.right, 16);
const narrowBox = pageIdentityBoxSpan({ ...BOX, windowWidth: 400, desktop: true });
check('desktop dragged narrower gives the phone span, clear of the artwork', narrowBox, { left: 400 / 2 + 44, right: 16 });

// Pinned against the text-size zoom, 2026-09-21: "Pin the corner box against
// the text-size zoom too." Page zoom scales every dp, so at 200% the window
// that was 480 dp at the standard 125% reports 300 dp, and a box drawn at
// its starting width would be 1.6x the pixels. The scale (1.25 / 2) keeps
// the pixels; the artwork clearance and margin stay in zoomed dp. The 1400 dp
// window at 125% is 1750 px, which at 200% reports 875 dp.
const startBoxWidth = 480 - startBox.right - startBox.left;
const zoomedWide = pageIdentityBoxSpan({ ...BOX, windowWidth: 875, desktop: true, scale: 1.25 / 2 });
check('at 200% a wide window keeps the starting width in pixels', (875 - zoomedWide.right - zoomedWide.left) * 2, startBoxWidth * 1.25);
check('with the margin still in zoomed dp', zoomedWide.right, 16);
const zoomedStart = pageIdentityBoxSpan({ ...BOX, windowWidth: 300, desktop: true, scale: 1.25 / 2 });
check('at 200% the starting window gives the box only what is clear of the artwork', zoomedStart, { left: 300 / 2 + 44, right: 16 });
const zoomedOut = pageIdentityBoxSpan({ ...BOX, windowWidth: 600, desktop: true, scale: 1.25 });
check('at 100% the box is smaller in dp to be the same in pixels', (600 - zoomedOut.right - zoomedOut.left) / 1.25, startBoxWidth);
check('a scale of 1 is the unpinned span', pageIdentityBoxSpan({ ...BOX, windowWidth: 1400, desktop: true, scale: 1 }), wideBox);
check('a scale that is not a number is ignored', pageIdentityBoxSpan({ ...BOX, windowWidth: 1400, desktop: true, scale: NaN }), wideBox);
check('a phone ignores the scale', pageIdentityBoxSpan({ ...BOX, windowWidth: 411, desktop: false, scale: 0.5 }), { left: 411 / 2 + 44, right: 16 });

if (failures > 0) {
  console.error(`\n${failures} of ${checks} checks failed`);
  process.exit(1);
}
console.log(`All ${checks} checks passed`);
