// Draws every app and website icon file from one description: a white human
// figure, arms and legs spread, inside the debossed round window of the
// Ghostead mark. Chosen 2026-10-09, replacing the open book of 2026-10-06.
//
// The window, its finish and the house are read from or copied out of the
// Ghostead icon itself (docs/app-links/public/ghostead-icon.svg), so the two
// marks stay one family: the same deboss filter, the same glow, shade and
// pearl the ghost has, and the roof and circle in exactly the same place.
// The full mark adds a left wall shaped like an L under the roof, touching
// neither the circle nor the figure.
//
// The figure's outline is assets/brand/figure-path.txt, an SVG path in its
// own 1160-unit drawing space, traced from a smooth model of a person built
// on the proportions of Da Vinci's spread pose. Its faint shading (collar
// bones, chest, stomach, thigh and calf) is drawn here, left half only and
// mirrored for the right.
//
// Where each version goes:
//   the full mark, house and all: the website (inside-story-icon.svg,
//     og-square, apple-touch-icon, favicon-32)
//   the window alone: the phone and computer icons, the splash and the
//     TabHub button
//   the figure alone: the TabHub well, and in one flat colour Android's
//     themed icon and the notification icon
//
// Changing app.json's icons changes the runtime fingerprint, so a new
// icon reaches a phone only through a native rebuild.
//
//   node scripts/make_brand_icons.js

/* global __dirname, Buffer */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const GROUND = '#1F2A2C';
const DARK = '#151d1f';
const INK = '#3f4a62';
const GHOSTEAD = fs.readFileSync(path.join(ROOT, 'docs/app-links/public/ghostead-icon.svg'), 'utf8');
const DEFS = GHOSTEAD.match(/<defs>[\s\S]*<\/defs>/)[0];
const FIGURE = fs.readFileSync(path.join(ROOT, 'assets/brand/figure-path.txt'), 'utf8').trim();

// Drawn in the Ghostead icon's local units: the window is a circle of
// radius 1000 around the origin, and the Ghostead icon places that at
// translate(512 580.9) scale(0.34047) on its 1024 square.
const WINDOW = 'M-1000 0 a1000 1000 0 1 0 2000 0 a1000 1000 0 1 0 -2000 0 Z';
const GHOSTEAD_PLACE = 'translate(512 580.9) scale(0.34047)';
const ROOF = '<path d="M-1411.2 -790 L0 -1303.6 L1411.2 -790" fill="none" stroke-width="190" stroke-linejoin="miter" stroke-linecap="butt"/>';
const CHIMNEY = '<path d="M708.5 -1045.8 V-1223.6 H928.5 V-965.7 Z"/>';
// The wall rises from the roof's centre line at x -1180 and ends in a foot
// long enough for an L, short of the circle.
const WALL_TOP = (-790 - (1411.2 - 1180) * (513.6 / 1411.2)).toFixed(1);
const WALL = `<path d="M-1180 ${WALL_TOP} V1170 H-560" fill="none" stroke-width="142.5" stroke-linejoin="miter" stroke-linecap="butt"/>`;

// The figure's drawing space onto the window's: its middle (581, 604) on the
// origin, its farthest reach (557.5) at 890, so no hand or foot touches the
// circle.
const CX = 581;
const CY = 604;
const K = 890 / 557.5;
const FT = `translate(${(-CX * K).toFixed(2)} ${(-CY * K).toFixed(2)}) scale(${K.toFixed(5)})`;

const stroke = (d, w, o) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" opacity="${o}"/>`;
const ellipse = (cx, cy, rx, ry, o, r = 0) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${r} ${cx} ${cy})" fill="${INK}" opacity="${o}"/>`;
// Left half only, in the figure's drawing space, mirrored about x 581.
const FINE = [
  stroke('M572 404 Q540 398 506 412', 4, 0.30), // collarbone
  stroke('M552 312 Q560 360 574 398', 4, 0.22), // the neck muscle down to the collarbone
  stroke('M336 352 Q332 366 340 378', 4, 0.20), // inside of the elbow
].join('');
const MID = [
  stroke('M512 446 Q530 494 576 498', 9, 0.30), // under the chest
  stroke('M536 552 Q560 548 578 552', 6, 0.16), stroke('M538 592 Q560 588 578 592', 6, 0.14), // stomach
  stroke('M528 652 Q542 684 558 704', 7, 0.18), // hip to groin
  stroke('M508 712 Q492 800 474 866', 8, 0.24), // the long thigh muscle
  ellipse(458, 880, 17, 20, 0.16, -27), // kneecap
  stroke('M440 902 Q420 960 384 1032', 7, 0.14), // shin
  stroke('M472 446 Q456 420 448 404', 7, 0.22), // deltoid against the arm
  stroke('M424 418 Q380 400 346 380', 6, 0.14), // underside of the biceps
].join('');
const WIDE = [
  ellipse(581, 346, 30, 9, 0.34), // under the chin
  stroke('M506 470 Q520 560 534 640', 18, 0.18), // ribcage and waist
  ellipse(566, 758, 16, 26, 0.30), // inside the top of the thigh
  stroke('M486 980 Q470 940 470 900', 16, 0.12), // calf
].join('');
const CENTRE = [stroke('M581 408 L581 488', 6, 0.20), stroke('M581 506 L581 640', 5, 0.12)].join(''); // breastbone, stomach
const blur = (id, s) => `<filter id="${id}" filterUnits="userSpaceOnUse" x="-200" y="-200" width="1600" height="1600"><feGaussianBlur stdDeviation="${s}"/></filter>`;
const FIGURE_DEFS = `<clipPath id="fig"><path d="${FIGURE}"/></clipPath>${blur('b3', 3)}${blur('b6', 6)}${blur('b12', 12)}${blur('b14', 14)}`
  + `<g id="shL"><g filter="url(#b3)">${FINE}</g><g filter="url(#b6)">${MID}</g><g filter="url(#b12)">${WIDE}</g></g>`;
const DEFS_ALL = DEFS.replace('</defs>', FIGURE_DEFS + '</defs>');

// The figure in white and pearl with its shading, in window units, the same
// layers the ghost has: a glow, the shade, the pearl at 0.3.
const figureLayers = (glow) => `<g transform="${FT}">`
  + (glow ? `<path d="${FIGURE}" fill="#c9d4ff" opacity="0.3" filter="url(#glow)"/>` : '')
  + `<path d="${FIGURE}" fill="url(#shade)"/><path d="${FIGURE}" fill="url(#pearl)" opacity="0.3"/>`
  + '<g clip-path="url(#fig)">'
  + `<path d="${FIGURE}" fill="none" stroke="${INK}" stroke-width="40" opacity="0.22" filter="url(#b14)"/>`
  + '<use href="#shL"/><use href="#shL" transform="translate(1162 0) scale(-1 1)"/>'
  + `<g filter="url(#b6)">${CENTRE}</g></g></g>`;

function markSvg({ at, background, house }) {
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">' + DEFS_ALL
    + (background ? `<rect width="1024" height="1024" fill="${background}"/>` : '')
    + `<g filter="url(#debossWeb)"><g transform="${at}" fill="${DARK}" stroke="${DARK}" stroke-width="0">`
    + `<path d="${WINDOW}"/>${house ? CHIMNEY + ROOF + WALL : ''}</g></g>`
    + `<g transform="${at}">${figureLayers(true)}</g></svg>`;
}
// The large logo on a web page. The Ghostead page's large mark (its
// wordmark, ghostead.com) draws the deboss far finer relative to the roof
// than the icon filter does, which is sized to survive at 48 px. Its
// numbers are scaled here by the ratio of the two roofs (0.34047 against
// the wordmark's 0.22623), so the roof, wall and window read the same as
// Ghostead's at the same size, without the wide light rim. The filter's
// numbers are the icon's; their long decimals are how they print.
const HERO_RATIO = 0.34047 / 0.22623;
const HERO_DEBOSS = [[36, 9.6], [45, 12], [10.799999999999999, 2.88], [14.4, 3.84], [5.3999999999999995, 1.44]];
function heroSvg() {
  let svg = markSvg({ at: GHOSTEAD_PLACE, house: true });
  const filter = svg.match(/<filter id="debossWeb"[\s\S]*?<\/filter>/)[0];
  let fine = filter;
  for (const [icon, word] of HERO_DEBOSS) {
    fine = fine.split('"' + icon + '"').join('"' + +(word * HERO_RATIO).toFixed(3) + '"');
  }
  // The roof and wall lines thinned the same way: the wordmark's roof is
  // 100 units thick across a 4397-unit span, against 190 across 2822 here.
  const thin = (100 / 4397) * 2822.4 / 190;
  svg = svg.replace('stroke-width="190"', `stroke-width="${(190 * thin).toFixed(1)}"`)
    .replace('stroke-width="142.5"', `stroke-width="${(142.5 * thin).toFixed(1)}"`);
  return svg.replace(filter, fine);
}

const windowSvg = ({ scale, background }) => markSvg({ at: `translate(512 512) scale(${scale})`, background, house: false });

// One flat colour, for Android's themed icon and the notification icon,
// where only the shape's alpha is used. The figure alone.
function figureOnlySvg({ scale }) {
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">'
    + `<g transform="translate(512 512) scale(${scale})"><g transform="${FT}"><path d="${FIGURE}" fill="#fff"/></g></g></svg>`;
}

// The figure alone in its white and pearl finish, on nothing. The TabHub
// button draws its own pressed-in well behind whichever icon is chosen
// (components/ActiveRingCircle.tsx, 2026-10-07), so the app icon there is
// the figure, not the window: a window drawn inside a well would be a hole
// inside a hole. No glow here, since the well is the dark it would glow
// against, and a glow cut off at the image's edge shows as a square.
function figureShadedSvg() {
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-920 -920 1840 1840">' + DEFS_ALL + figureLayers(false) + '</svg>';
}

async function png(svg, size, file, height = size) {
  const out = path.join(ROOT, file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await sharp(Buffer.from(svg)).resize(size, height).png().toFile(out);
  console.log('wrote ' + file + ' (' + size + 'x' + height + ')');
}

(async () => {
  // The website: the full mark where the Ghostead mark puts it. The SVG
  // sits on the page's own ground, so it carries none; the PNGs do.
  const full = markSvg({ at: GHOSTEAD_PLACE, house: true });
  const fullOnGround = markSvg({ at: GHOSTEAD_PLACE, house: true, background: GROUND });
  fs.writeFileSync(path.join(ROOT, 'docs/app-links/public/inside-story-icon.svg'), full);
  console.log('wrote docs/app-links/public/inside-story-icon.svg');
  fs.writeFileSync(path.join(ROOT, 'docs/app-links/public/lifestead-logo.svg'), heroSvg());
  console.log('wrote docs/app-links/public/lifestead-logo.svg');
  await png(fullOnGround, 512, 'docs/app-links/public/og-square.png');
  await png(fullOnGround, 180, 'docs/app-links/public/apple-touch-icon.png');
  await png(fullOnGround, 32, 'docs/app-links/public/favicon-32.png');
  // The whole square, for iOS and the desktop installer: the window alone.
  const square = windowSvg({ scale: 0.42, background: GROUND });
  await png(square, 1024, 'assets/brand/icon.png');
  await png(square, 48, 'assets/brand/favicon.png');
  // Android's adaptive icon: the launcher crops to the middle two thirds,
  // so the window sits inside that safe zone on the ground colour.
  await png(windowSvg({ scale: 0.31 }), 1024, 'assets/brand/android-icon-foreground.png');
  await png(figureOnlySvg({ scale: 0.30 }), 432, 'assets/brand/android-icon-monochrome.png');
  // The splash: the window alone, laid on the ground colour by the plugin.
  await png(windowSvg({ scale: 0.46 }), 1024, 'assets/brand/splash-icon.png');
  // The TabHub button: the window alone, filling a 312 px square (four
  // times the 78 px it is drawn at), so it sits in the footer as a button.
  await png(windowSvg({ scale: 0.47 }), 312, 'assets/branding/inside-story-window.png');
  // The figure for the TabHub well.
  await png(figureShadedSvg(), 276, 'assets/branding/inside-story-figure.png');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
