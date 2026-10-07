// Draws every Inside Story icon file from one description: an open book in
// white inside the debossed round window of the Ghostead mark, on the
// Ghostead ground colour. Chosen 2026-10-06 over a leaf book and a person.
//
// The window and its finish are read from the Ghostead icon itself
// (docs/app-links/public/ghostead-icon.svg), so the two marks stay one
// family: the same deboss filter, the same soft white shading the ghost has.
// The roof is left off on purpose, since it says "Ghostead's home".
//
// Writes into assets/brand/ and docs/app-links/public/. Nothing in app.json
// points at assets/brand/ until the next native rebuild switches it over,
// because changing app.json's icons or colours changes the runtime
// fingerprint and would strand every OTA update for the installed build.
//
//   node scripts/make_brand_icons.js

/* global __dirname, Buffer */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const GROUND = '#1F2A2C';
const GHOSTEAD = fs.readFileSync(path.join(ROOT, 'docs/app-links/public/ghostead-icon.svg'), 'utf8');
const DEFS = GHOSTEAD.match(/<defs>[\s\S]*<\/defs>/)[0];

// Drawn in the Ghostead icon's local units: the window is a circle of
// radius 1000 around the origin.
const WINDOW = 'M-1000 0 a1000 1000 0 1 0 2000 0 a1000 1000 0 1 0 -2000 0 Z';
const PAGES = [
  'M-40 -300 C-180 -400 -440 -410 -640 -330 L-640 400 C-440 330 -180 340 -40 440 Z',
  'M40 -300 C180 -400 440 -410 640 -330 L640 400 C440 330 180 340 40 440 Z',
];
const LINES = ['-1', '1']
  .map((s) => [-150, -20, 110]
    .map((y) => `M${s * 120} ${y - 60} C${s * 260} ${y - 120} ${s * 420} ${y - 125} ${s * 540} ${y - 90}`))
  .flat();

function windowSvg({ scale, background }) {
  const at = `translate(512 512) scale(${scale})`;
  const cut = PAGES.map((d) => `<path d="${d}" fill="#000"/>`).join('');
  const defs = DEFS.replace('</defs>',
    '<mask id="pages" maskUnits="userSpaceOnUse" x="-2000" y="-2000" width="4000" height="4000">'
    + `<rect x="-2000" y="-2000" width="4000" height="4000" fill="#fff"/>${cut}</mask></defs>`);
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">' + defs
    + (background ? `<rect width="1024" height="1024" fill="${background}"/>` : '')
    + `<g filter="url(#debossWeb)"><g transform="${at}"><path d="${WINDOW}" fill="#151d1f" mask="url(#pages)"/></g></g>`
    + `<g transform="${at}">`
    + PAGES.map((d) => `<path d="${d}" fill="#c9d4ff" opacity="0.3" filter="url(#glow)"/>`).join('')
    + PAGES.map((d) => `<path d="${d}" fill="url(#shade)"/><path d="${d}" fill="url(#pearl)" opacity="0.3"/>`).join('')
    + LINES.map((d) => `<path d="${d}" fill="none" stroke="#151d1f" stroke-width="34" stroke-linecap="round" opacity="0.55"/>`).join('')
    + '</g></svg>';
}

// One flat colour, for Android's themed icon and the notification icon,
// where only the shape's alpha is used. The book alone, with its lines cut.
function bookOnlySvg({ scale }) {
  const at = `translate(512 512) scale(${scale})`;
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><defs>'
    + '<mask id="lines" maskUnits="userSpaceOnUse" x="-2000" y="-2000" width="4000" height="4000">'
    + '<rect x="-2000" y="-2000" width="4000" height="4000" fill="#fff"/>'
    + LINES.map((d) => `<path d="${d}" fill="none" stroke="#000" stroke-width="44" stroke-linecap="round"/>`).join('')
    + `</mask></defs><g transform="${at}" mask="url(#lines)">`
    + PAGES.map((d) => `<path d="${d}" fill="#fff"/>`).join('')
    + '</g></svg>';
}

async function png(svg, size, file) {
  const out = path.join(ROOT, file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(out);
  console.log('wrote ' + file + ' (' + size + 'x' + size + ')');
}

(async () => {
  // The whole square, for iOS, the desktop installer and the web.
  const square = windowSvg({ scale: 0.42, background: GROUND });
  await png(square, 1024, 'assets/brand/icon.png');
  await png(square, 48, 'assets/brand/favicon.png');
  await png(square, 512, 'docs/app-links/public/og-square.png');
  await png(square, 180, 'docs/app-links/public/apple-touch-icon.png');
  await png(square, 32, 'docs/app-links/public/favicon-32.png');
  fs.writeFileSync(path.join(ROOT, 'docs/app-links/public/inside-story-icon.svg'), square);
  // Android's adaptive icon: the launcher crops to the middle two thirds,
  // so the window sits inside that safe zone on the ground colour.
  await png(windowSvg({ scale: 0.31 }), 1024, 'assets/brand/android-icon-foreground.png');
  await png(bookOnlySvg({ scale: 0.27 }), 432, 'assets/brand/android-icon-monochrome.png');
  // The splash: the window alone, laid on the ground colour by the plugin.
  await png(windowSvg({ scale: 0.46 }), 1024, 'assets/brand/splash-icon.png');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
