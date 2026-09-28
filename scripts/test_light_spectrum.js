// Runs lib/lightSpectrum.ts: a lamp's lux-to-PPFD ratio worked out from its
// spectrum (1.0.55.23).
//
// The rules checked:
//
//  1. The eye's curve peaks at 555 nm and the arithmetic reproduces the
//     published ratios: a 2856 K filament near 50 (incandescent) and
//     daylight-like spectra near 54 (Thimijan and Heins 1983).
//  2. Colour shares read as percentages or µmol/s alike, since only the
//     proportions matter, and a blank share is none.
//  3. Peaks: a deep red panel is far under a white light, a wavelength
//     outside 400 to 700 nm is refused, and a peak with no share is one part.
//  4. Every result is inside the range a typed ratio is kept in.
//  5. No dashes and no verdict words in the sentences.
//
// Run with: node scripts/test_light_spectrum.js
// Exits non-zero on any failure.

/* global __dirname */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function loadModule(relPath) {
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    throw new Error(`unexpected import ${name}`);
  });
  return module.exports;
}

const S = loadModule('lib/lightSpectrum.ts');
let passed = 0;
let failed = 0;
function check(label, ok) {
  if (ok) passed += 1;
  else {
    failed += 1;
    console.log(`FAIL: ${label}`);
  }
}
const near = (a, b, within) => a !== null && Math.abs(a - b) <= within;

// 1. The curve and the published ratios.
check('V is 1 at 555 nm', S.photopic(555) === 1);
check('V reads between rows', near(S.photopic(557), 0.998, 0.002));
check('about 147 lux per µmol at 555 nm', near(S.luxPerMicromoleAt(555), 147.2, 0.3));
const h = 6.62607e-34;
const c = 2.99792e8;
const k = 1.380649e-23;
const blackbody = (kelvin) => (nm) => {
  const m = nm * 1e-9;
  return 1 / m ** 4 / (Math.exp((h * c) / (m * k * kelvin)) - 1);
};
check('a 2856 K filament is near the published 50', near(S.ratioForPhotons(blackbody(2856)), 50, 1.5));
for (const kelvin of [5000, 5800, 6500]) {
  check(`daylight-like ${kelvin} K is near the published 54`, near(S.ratioForPhotons(blackbody(kelvin)), 54, 2));
}
check('no photons gives nothing', S.ratioForPhotons(() => 0) === null);

// 2. Colour shares.
const white = S.ratioFromColourShares({ blue: '20', green: '45', red: '35' });
check('a white LED mix lands among published white LED ratios (63 to 72)', near(white, 67.5, 6));
check('µmol/s reads the same as percentages', S.ratioFromColourShares({ blue: '170', green: '382.5', red: '297.5' }) === white);
check('a percent sign is fine', S.ratioFromColourShares({ blue: '20%', green: '45%', red: '35%' }) === white);
check('blank shares are none', S.ratioFromColourShares({ blue: '', green: '', red: '100' }) === S.ratioFromColourShares({ blue: '0', green: '0', red: '5' }));
check('all blank gives nothing', S.ratioFromColourShares({ blue: '', green: '', red: '' }) === null);
check('a word gives nothing', S.ratioFromColourShares({ blue: 'lots', green: '1', red: '1' }) === null);
check('a negative share gives nothing', S.ratioFromColourShares({ blue: '-5', green: '1', red: '1' }) === null);
check('more green raises the ratio',
  S.ratioFromColourShares({ blue: '10', green: '60', red: '30' }) > S.ratioFromColourShares({ blue: '10', green: '20', red: '70' }));

// 3. Peaks.
const purple = S.ratioFromPeaks([{ nm: '450', share: '20' }, { nm: '660', share: '80' }]);
check('a 450 and 660 panel is about 8', near(purple, 8.2, 0.5));
check('deep red alone is about 8', near(S.ratioFromPeaks([{ nm: '660', share: '' }]), 8.4, 0.5));
check('a peak with no share is one part',
  S.ratioFromPeaks([{ nm: '450', share: '' }, { nm: '660', share: '' }]) === S.ratioFromPeaks([{ nm: '450', share: '1' }, { nm: '660', share: '1' }]));
check('far-red is refused', S.ratioFromPeaks([{ nm: '730', share: '10' }]) === null);
check('UV is refused', S.ratioFromPeaks([{ nm: '385', share: '10' }]) === null);
check('a share with no wavelength is refused', S.ratioFromPeaks([{ nm: '', share: '10' }]) === null);
check('empty rows are skipped', S.ratioFromPeaks([{ nm: '', share: '' }, { nm: '660', share: '' }]) === S.ratioFromPeaks([{ nm: '660', share: '' }]));
check('nothing filled gives nothing', S.ratioFromPeaks([{ nm: '', share: '' }]) === null);
check('green diodes read near the eye peak', near(S.ratioFromPeaks([{ nm: '555', share: '' }]), 145, 3));

// 4. Inside the kept range (lib/lightMeter.ts: 2 to 200).
for (const nm of [430, 450, 480, 520, 555, 600, 630, 660, 680]) {
  const ratio = S.ratioFromPeaks([{ nm: String(nm), share: '1' }]);
  check(`a ${nm} nm peak is inside 1 to 200`, ratio !== null && ratio >= 1 && ratio <= 200);
}
for (const nm of [430, 450, 660]) {
  check(`a ${nm} nm peak is kept as a lamp ratio (2 or more)`, S.ratioFromPeaks([{ nm: String(nm), share: '1' }]) >= 2);
}

// 5. Words.
for (const sentence of [S.SPECTRUM_SHARES_HOW, S.SPECTRUM_PEAKS_HOW, S.SPECTRUM_SENSOR_LIMIT, ...S.COLOUR_BANDS.map((b) => b.label)]) {
  check(`no dashes: ${sentence}`, !/[–—]| -- /.test(sentence));
  check(`no verdict words: ${sentence}`, !/\b(must|should|ideal|optimal|too low|too high)\b/i.test(sentence));
}

// Where the spectrum is entered (1.0.55.25). In 1.0.55.23 the fields sat
// behind three conditions (a lamp picked, the unit set to PPFD) and a link,
// and could not be found. The section now stands under any light but the
// sun, with no unit or lamp condition, and the colour shares open first.
const lens = fs.readFileSync(path.join(__dirname, '..', 'components/GrowingConditionsLens.tsx'), 'utf8');
check('the section shows under any light but the sun',
  lens.includes("const spectrumShown = draft.measurement === 'light' && source !== 'sun';"));
const cardAt = lens.indexOf('<View style={styles.spectrumCard}>');
const gate = lens.slice(lens.lastIndexOf('{', cardAt), cardAt).replace(/\s+/g, ' ').trim();
check('the section is gated by spectrumShown alone', gate === '{spectrumShown ? (');
check('colour shares open first', lens.includes("useState<RatioWay>('shares')"));
check('the colour fields are not behind a link', !lens.includes("From Its Spectrum&apos;s Colour Shares"));
check('the worked ratio is used straight away', !lens.includes('Use This Ratio'));
check('the formula is said on screen', lens.includes('683 × V(λ) × 119.627 ÷ λ'));
// The figures the screen quotes are the ones the module uses.
check('555 nm is 683 × 119.627 ÷ 555 lux per µmol', near(S.luxPerMicromoleAt(555), (683 * 119.627) / 555, 0.5));
const redBlue = S.ratioFromPeaks([{ nm: '450', share: '20' }, { nm: '660', share: '80' }, { nm: '', share: '' }, { nm: '', share: '' }]);
check('a 450 and 660 panel is above the 2 kept', redBlue !== null && redBlue >= 2 && redBlue < 20);

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
