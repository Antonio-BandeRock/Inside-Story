// Checks the line and letter spacing rules (lib/textSpacing.ts): that
// Normal leaves the text exactly as it was, that a ratio is a ratio of the
// text's own size rather than a pixel count, that letter spacing ADDS to
// what a style already asked for rather than replacing it, and that nothing
// off disk can turn into a spacing nobody meant. Pure, so it runs here
// rather than needing a phone.
//
// Exits non-zero on any failure.

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
    throw new Error('lib/textSpacing.ts must stay free of runtime imports');
  });
  return module.exports;
}

const {
  ALL_LETTER_SPACING_KEYS,
  ALL_LINE_SPACING_KEYS,
  PINNED_LINE_RATIO,
  chromeLineBudget,
  chromeLineHeight,
  pinnedLineHeight,
  DEFAULT_LETTER_SPACING,
  DEFAULT_LINE_SPACING,
  LETTER_SPACING_CAPTIONS,
  LETTER_SPACING_LABELS,
  LETTER_SPACING_RATIOS,
  LINE_SPACING_CAPTIONS,
  LINE_SPACING_LABELS,
  LINE_SPACING_RATIOS,
  describeLetterSpacing,
  describeLineSpacing,
  isLetterSpacingKey,
  isLineSpacingKey,
  letterSpacingFor,
  lineHeightFor,
  normalizeLetterSpacing,
  normalizeLineSpacing,
  textSizeWhereToLook,
} = load('lib/textSpacing.ts');

let checks = 0;
let failures = 0;

function check(name, actual, expected) {
  checks += 1;
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    failures += 1;
    console.error(`FAIL  ${name}\n        expected ${e}\n        got      ${a}`);
  }
}

// ------------------------------------------------------------ Normal changes nothing

// This is the one that matters most. Everybody who never opens the setting
// is on Normal, so Normal has to hand back null at every size: a null means
// no lineHeight is written at all, which leaves the font to use whatever it
// was already using rather than being handed a number somebody guessed.
for (const fontSize of [10, 12, 14, 17, 20, 36]) {
  check(`Normal leaves ${fontSize}px alone`, lineHeightFor(fontSize, 'normal'), null);
}
check('Normal is what a fresh install is on', DEFAULT_LINE_SPACING, 'normal');
check('and Normal has no ratio of its own to apply', LINE_SPACING_RATIOS.normal, null);

// ------------------------------------------------------------ the ratios

// 1.5 is the figure WCAG 2.1 success criterion 1.4.12 names for line
// height, which is why it is the middle step rather than something picked
// by eye.
check('Roomy is the accessibility standard figure', LINE_SPACING_RATIOS.roomy, 1.5);
check('Roomier goes past it', LINE_SPACING_RATIOS.roomier, 1.8);

check('body text at 14 gets 21', lineHeightFor(14, 'roomy'), 21);
check('a screen title at 20 gets 30', lineHeightFor(20, 'roomy'), 30);
check('a caption at 12 gets 18', lineHeightFor(12, 'roomy'), 18);
check('the smallest tier at 10 gets 15', lineHeightFor(10, 'roomy'), 15);
check('and Roomier at 14 gets 25', lineHeightFor(14, 'roomier'), 25);

// Whole pixels only: a fraction lands differently on the two platforms and
// shows up as text sitting a hair off centre inside a fixed-height row.
check('17 rounds rather than landing on 25.5', lineHeightFor(17, 'roomy'), 26);
check('and nothing comes back fractional', Number.isInteger(lineHeightFor(17, 'roomier')), true);

// A ratio, not a pixel count, so one setting is right for every tier at
// once and stays right when the phone's font scale moves underneath it.
check('every size grows by the same factor', lineHeightFor(20, 'roomy') / 20, lineHeightFor(10, 'roomy') / 10);

// ------------------------------------------------------------ a size that is not a size

// A Text with no fontSize of its own inherits one, and this file cannot see
// what it inherited, so it leaves it alone rather than guessing.
check('no size at all is left alone', lineHeightFor(undefined, 'roomy'), null);
check('and so is null', lineHeightFor(null, 'roomy'), null);
check('zero is not a size', lineHeightFor(0, 'roomy'), null);
check('nor is a negative one', lineHeightFor(-14, 'roomy'), null);
check('nor is something that is not a number', lineHeightFor('14', 'roomy'), null);
check('nor is NaN', lineHeightFor(NaN, 'roomy'), null);

// ------------------------------------------------------------ what comes back off disk

check('a known key is a key', isLineSpacingKey('roomy'), true);
check('a made-up one is not', isLineSpacingKey('roomiest'), false);
check('and neither is the label', isLineSpacingKey('Roomy'), false);

check('a stored key comes back as itself', normalizeLineSpacing('roomier'), 'roomier');
check('a key from a later version comes back as Normal', normalizeLineSpacing('enormous'), 'normal');
check('nothing stored is Normal', normalizeLineSpacing(undefined), 'normal');
check('and so is null', normalizeLineSpacing(null), 'normal');

// ------------------------------------------------------------ nothing goes unnamed

check('three steps are listed', ALL_LINE_SPACING_KEYS.length, 3);
for (const key of ALL_LINE_SPACING_KEYS) {
  check(`${key} has a label`, (LINE_SPACING_LABELS[key] ?? '').length > 0, true);
  check(`${key} says what it does`, (LINE_SPACING_CAPTIONS[key] ?? '').length > 0, true);
  check(`${key} describes itself`, describeLineSpacing(key), LINE_SPACING_CAPTIONS[key]);
}

// The pointer at the phone's own text size setting, which is the half that
// was already built and that nobody knew about. Each platform keeps it
// somewhere different, so each gets told where to look rather than being
// sent to "accessibility somewhere".
for (const platform of ['ios', 'android', 'web']) {
  check(`${platform} is told where to look`, textSizeWhereToLook(platform).length > 0, true);
}
check(
  'and the three answers are not the same answer',
  new Set(['ios', 'android', 'web'].map(textSizeWhereToLook)).size,
  3,
);

// Platform.OS on this project also answers windows and macos, both of which
// run the web target as an installed PWA, so both get the browser answer
// rather than a blank line.
check('windows gets the browser answer', textSizeWhereToLook('windows'), textSizeWhereToLook('web'));
check('and so does macos', textSizeWhereToLook('macos'), textSizeWhereToLook('web'));


// ============================================================ letter spacing

// Same first question as line spacing, and the same reason it matters most:
// everybody who never opens the setting is on Normal, and Normal has to
// write no letterSpacing at all. Writing 0 instead would flatten the eyebrow
// tier, which carries its own 0.4 in constants/typography.ts.
for (const size of [10, 12, 14, 17, 20, 36]) {
  check(`Normal writes no letter spacing at ${size}`, letterSpacingFor(size, 'normal'), null);
  check(`Normal leaves an existing 0.4 alone at ${size}`, letterSpacingFor(size, 'normal', 0.4), null);
}

check('Normal is where a fresh install starts', DEFAULT_LETTER_SPACING, 'normal');

// 0.12 is the WCAG 2.1 SC 1.4.12 figure, the same criterion line spacing's
// 1.5 comes from. If either moves, it stops being the standard and becomes
// somebody's preference.
check('Wide is the standard', LETTER_SPACING_RATIOS.wide, 0.12);
check('Wider goes past it', LETTER_SPACING_RATIOS.wider, 0.18);
check('and Normal is nothing at all', LETTER_SPACING_RATIOS.normal, null);

// A fraction of the font, so one setting is right at every tier at once.
check('14 at Wide', letterSpacingFor(14, 'wide'), 1.7);
check('20 at Wide', letterSpacingFor(20, 'wide'), 2.4);
check('10 at Wide', letterSpacingFor(10, 'wide'), 1.2);
check('14 at Wider', letterSpacingFor(14, 'wider'), 2.5);

// Rounded to one decimal rather than to a whole point: 14 * 0.12 is 1.68,
// and rounding that to 2 would be a jump of nearly a fifth on the commonest
// size in the app.
check('one decimal, not a whole point', letterSpacingFor(14, 'wide'), 1.7);
check('17 at Wider rounds to one decimal too', letterSpacingFor(17, 'wider'), 3.1);

// Doubling the size doubles the spacing, which is what makes it a ratio.
check('a ratio scales', letterSpacingFor(20, 'wide'), letterSpacingFor(10, 'wide') * 2);

// It ADDS to what the style already asked for. This is the eyebrow tier:
// 10px at letterSpacing 0.4. At Wide it has to end up wider than 0.4, not
// narrower, or the setting is doing the opposite of what it says.
check('the eyebrow keeps its own 0.4 and gains on top', letterSpacingFor(10, 'wide', 0.4), 1.6);
check('and at Wider', letterSpacingFor(10, 'wider', 0.4), 2.2);
check(
  'so the eyebrow never comes out tighter than it started',
  letterSpacingFor(10, 'wide', 0.4) > 0.4,
  true,
);

// A base that is not a usable number counts as 0 rather than turning the
// whole answer into NaN.
for (const base of [undefined, null, NaN, Infinity, 'x']) {
  check(`a base of ${String(base)} counts as none`, letterSpacingFor(14, 'wide', base), 1.7);
}

// A size this file cannot use gets null, same as line spacing: a Text with
// no fontSize of its own inherits one, and guessing at what it inherited
// would be worse than leaving it alone.
for (const size of [undefined, null, 0, -14, '14', NaN]) {
  check(`a size of ${String(size)} gets nothing`, letterSpacingFor(size, 'wide'), null);
}

// Nothing off disk becomes a key nothing can render.
check('wide is a key', isLetterSpacingKey('wide'), true);
check('roomy is not a letter spacing key', isLetterSpacingKey('roomy'), false);
check('and neither is nonsense', isLetterSpacingKey('huge'), false);
check('a stored wider survives', normalizeLetterSpacing('wider'), 'wider');
check('a stored nothing falls back', normalizeLetterSpacing(null), 'normal');
check('and so does a stored future key', normalizeLetterSpacing('widest'), 'normal');

// Every key is offerable: three of them, each with a label and a caption.
check('three letter spacing keys', ALL_LETTER_SPACING_KEYS.length, 3);
for (const key of ALL_LETTER_SPACING_KEYS) {
  check(`${key} has a label`, (LETTER_SPACING_LABELS[key] ?? '').length > 0, true);
  check(`${key} says what it does`, (LETTER_SPACING_CAPTIONS[key] ?? '').length > 0, true);
  check(`${key} describes itself`, describeLetterSpacing(key), LETTER_SPACING_CAPTIONS[key]);
}

// And the two settings stay separate things. A line spacing key must not
// quietly work as a letter spacing key, since Profile has both pickers on
// one screen and a crossed wire there would be invisible.
check('no key is shared between the two', ALL_LETTER_SPACING_KEYS.filter((k) => ALL_LINE_SPACING_KEYS.includes(k)), ['normal']);
check('and roomy stays a line spacing key', isLineSpacingKey('roomy'), true);

// ------------------------------------------------- furniture gets a budget

// The TabHub bug, as a test: a 10px menu label in a fixed-height card. The
// card was built for 13 and Roomier wants 18, four rows deep, which is most
// of a row of icons clipped off the bottom.
check('a menu label at Normal is the 13 that was hand-typed', chromeLineHeight(10, 'normal'), 13);
check('Roomy asks for 15', chromeLineHeight(10, 'roomy'), 15);
check('Roomier asks for 18', chromeLineHeight(10, 'roomier'), 18);

// LensHub's own two, which came out at exactly what was typed there.
check("LensHub's 11px label is 14 at Normal", chromeLineHeight(11, 'normal'), 14);
check("and its 10px header is 13", chromeLineHeight(10, 'normal'), 13);

// Nothing sensible can be asked of a size that is not one.
for (const bad of [0, -12, NaN, Infinity, null, undefined, '12']) {
  check(`chromeLineHeight refuses ${String(bad)}`, chromeLineHeight(bad, 'roomier'), 0);
  check(`pinnedLineHeight refuses ${String(bad)}`, pinnedLineHeight(bad), 0);
}

// The phone's own font-size setting is the second input. Capped, because the
// menus cap what their labels may do, and the budget has to agree with the
// cap or the card is drawing room for text that can never appear.
check('at the default scale the budget is just the line', chromeLineBudget(10, 'normal', 1, 1.3), 13);
check('a bigger phone setting grows it', chromeLineBudget(10, 'normal', 1.3, 1.3), 17);
check('past the cap it stops', chromeLineBudget(10, 'normal', 2.5, 1.3), 17);
check('and Roomier grows from a taller line', chromeLineBudget(10, 'roomier', 1.3, 1.3), 24);

// A person who turns their phone font DOWN gets the same card, not a
// tighter one. There is nothing to win by shrinking furniture.
check('a smaller phone setting changes nothing', chromeLineBudget(10, 'roomier', 0.85, 1.3), 18);

// A garbled scale off a platform that does not report one behaves as 1
// rather than as zero room.
check('a missing scale behaves as 1', chromeLineBudget(10, 'roomy', NaN, 1.3), 15);
check('a missing cap behaves as no growth', chromeLineBudget(10, 'roomy', 2, NaN), 15);
check('and a nonsense size is still nothing', chromeLineBudget(0, 'roomy', 2, 1.3), 0);

// A budget is never shorter than the line it is budgeting for, at any size,
// at any setting, at any scale. This is the whole promise.
for (const spacing of ALL_LINE_SPACING_KEYS) {
  for (const fontSize of [9, 10, 11, 12, 14, 17]) {
    for (const scale of [0.85, 1, 1.15, 1.3, 2]) {
      const line = chromeLineHeight(fontSize, spacing);
      const budget = chromeLineBudget(fontSize, spacing, scale, 1.3);
      check(
        `${fontSize}px ${spacing} at ${scale} fits`,
        budget >= line && budget >= Math.ceil(line * Math.min(Math.max(scale, 1), 1.3)),
        true,
      );
    }
  }
}

// Pinned text ignores the setting entirely, which is what lets a box that
// cannot change size hold the same four lines whatever is set. The corner
// identity box is 11px and 78px tall with 16 of padding: four lines at 14
// is 56, which fits, where Roomier would have asked for 80.
check('pinned is the same at every setting', pinnedLineHeight(11), 14);
check('four pinned lines fit the corner box', 4 * pinnedLineHeight(11) + 16 <= 78, true);
check('four Roomier lines would not', 4 * chromeLineHeight(11, 'roomier') + 16 <= 78, false);

// And pinned is exactly what Normal already draws, so turning the setting
// off leaves the pinned boxes looking like everything else.
for (const fontSize of [9, 10, 11, 12]) {
  check(`pinned ${fontSize} matches Normal`, pinnedLineHeight(fontSize), chromeLineHeight(fontSize, 'normal'));
}
check('the pinned ratio is the one the files had each estimated', PINNED_LINE_RATIO, 1.3);

if (failures > 0) {
  console.error(`\n${failures} of ${checks} checks failed`);
  process.exit(1);
}
console.log(`All ${checks} checks passed`);
