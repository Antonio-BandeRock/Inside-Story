// Checks that every bottom-anchored popup menu measures itself against the
// window it is on.
//
// 2026-09-18, direct request: "Do the display size and landscape pass too."
// The pass before it taught the menus how tall they WANT to be, from the app's
// line spacing setting and the phone's font-size setting together. Nothing
// checked whether the screen is that tall. Both menus render at a computed
// fixed height anchored to useMenuCardBottom(), and LensHub at Normal spacing
// already wanted 402 dp of a 411 dp landscape window; Android's Display size
// setting, a split-screen half, a foldable and an Android 16+ large screen that
// ignores the orientation lock all take more off that number again.
//
// Two rules, both narrow enough to be worth enforcing mechanically:
//
//   1. Every menu file calls useMenuCardFit. That is the one hook that reads
//      useWindowDimensions().height and clamps a card to the room it has (see
//      constants/floatingButton.ts, and lib/menuFit.ts for the arithmetic).
//   2. No card style carries a hand-typed height or maxHeight. A number in a
//      StyleSheet cannot know what window it is on, which is exactly how
//      MyItemsHub's flat maxHeight: 320 and maxHeight: 260 were written.
//
// Exits non-zero on any finding. Run it alongside
// scripts/audit_chrome_font_scale.js and
// scripts/audit_bare_text_on_background.js before calling UI work done.

// eslint-config-expo lints this repo as app code, which has no __dirname.
// This is a plain Node script run with node, so it does.
/* global __dirname */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const ROOT = path.join(__dirname, '..');

// The bottom-anchored popup menus. Anything added to this family belongs here
// too, and will fail until it reads the shared fit.
const MENU_FILES = [
  'components/TabHub.tsx',
  'components/LensHub.tsx',
  'components/MyItemsHub.tsx',
];

// Which StyleSheet entries count as the card itself. A style named for a row,
// an icon or a label is not what gets anchored to the bottom of the window.
const CARD_STYLE = /^card/i;
const SIZE_PROPERTY = /^(height|maxHeight|minHeight)$/;

const findings = [];
let cardStyles = 0;

function isNumericValue(node) {
  if (ts.isNumericLiteral(node)) return true;
  // -4, and the arithmetic a style sometimes does inline (14 - CARD_RING_WIDTH).
  if (ts.isPrefixUnaryExpression(node)) return isNumericValue(node.operand);
  if (ts.isBinaryExpression(node)) return isNumericValue(node.left) || isNumericValue(node.right);
  return false;
}

for (const relPath of MENU_FILES) {
  const fullPath = path.join(ROOT, relPath);
  const text = fs.readFileSync(fullPath, 'utf8');
  const source = ts.createSourceFile(relPath, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const lineOf = (node) => source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;

  if (!/\buseMenuCardFit\b/.test(text)) {
    findings.push({
      file: relPath,
      line: 1,
      what: 'does not call useMenuCardFit',
      want: "import useMenuCardFit from '../constants/floatingButton' and pass this card's wanted height through it, so a short window clamps it instead of running it off the top of the screen",
    });
  }

  function walk(node) {
    // StyleSheet.create({ ... })
    const isStyleSheetCreate =
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.expression.getText(source) === 'StyleSheet' &&
      node.expression.name.text === 'create' &&
      node.arguments.length > 0 &&
      ts.isObjectLiteralExpression(node.arguments[0]);

    if (isStyleSheetCreate) {
      for (const entry of node.arguments[0].properties) {
        if (!ts.isPropertyAssignment(entry)) continue;
        const styleName = entry.name.getText(source).replace(/['"]/g, '');
        if (!CARD_STYLE.test(styleName)) continue;
        if (!ts.isObjectLiteralExpression(entry.initializer)) continue;
        cardStyles += 1;
        for (const prop of entry.initializer.properties) {
          if (!ts.isPropertyAssignment(prop)) continue;
          const propName = prop.name.getText(source).replace(/['"]/g, '');
          if (!SIZE_PROPERTY.test(propName)) continue;
          if (!isNumericValue(prop.initializer)) continue;
          findings.push({
            file: relPath,
            line: lineOf(prop),
            what: `styles.${styleName} sets ${propName}: ${prop.initializer.getText(source)}`,
            want: 'set it inline per render, through useMenuCardFit, so it shrinks on a window too short to hold it',
          });
        }
      }
    }

    ts.forEachChild(node, walk);
  }

  walk(source);
}

console.log(`Checked ${cardStyles} card styles across ${MENU_FILES.length} popup menus.`);

if (findings.length === 0) {
  console.log('0 findings.');
  process.exit(0);
}

console.log(`\n${findings.length} findings:\n`);
for (const finding of findings) {
  console.log(`  ${finding.file}:${finding.line}  ${finding.what}`);
  console.log(`      ${finding.want}\n`);
}
process.exit(1);
