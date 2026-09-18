// Checks that every piece of text in the app's own chrome says what the
// phone's font-size setting may do to it.
//
// 2026-09-18, from a report and a question in one message: roomier line
// spacing pushed the TabHub menu's bottom row of icons out through the
// bottom of its card, "the lower right corner box that tells you where you
// are needs to stay the same size no matter what the system gets changed
// to," and "how do we design in ways to make sure the app remains readable
// and usable for everything if the system phone is changed?"
//
// The rule that came out of it is written up in full under "Text that is
// furniture, and text that is reading" in lib/textSpacing.ts. The short
// version: text somebody came to READ scales with the phone's setting,
// uncapped, in containers that grow with it, and that is nearly the whole
// app. The app's own FURNITURE (the popup menus, the corner box that says
// where you are, the version number) is positioned rather than flowing, so
// it cannot grow without landing on its neighbour, and it either caps what
// the setting may do (maxFontSizeMultiplier, for a menu that budgets room
// for the growth it allows) or ignores it outright (allowFontScaling=
// {false}, for the two corner boxes that cannot change size at all).
//
// This script only looks at the furniture files. It says nothing about the
// rest of the app, and it must not: a cap on reading text would be the
// accessibility bug, not the fix.
//
// Exits non-zero on any finding. Run it alongside
// scripts/audit_bare_text_on_background.js before calling UI work done.

// eslint-config-expo lints this repo as app code, which has no __dirname.
// This is a plain Node script run with node, so it does.
/* global __dirname */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const ROOT = path.join(__dirname, '..');

// 'cap' takes either a maxFontSizeMultiplier or an outright pin: these are
// the popup menus, whose cards budget room from the same cap (see
// MENU_MAX_FONT_SCALE and menuLineBudget in constants/typography.ts), so a
// label that grows past it would be drawing past the budget.
//
// 'pin' takes nothing but allowFontScaling={false}: these two boxes are a
// fixed size by direct instruction and have nowhere to grow into.
const CHROME_FILES = [
  { file: 'components/TabHub.tsx', mode: 'cap' },
  { file: 'components/LensHub.tsx', mode: 'cap' },
  { file: 'components/MyItemsHub.tsx', mode: 'cap' },
  { file: 'components/PageIdentityLabel.tsx', mode: 'pin' },
  { file: 'components/VersionLabel.tsx', mode: 'pin' },
];

// Text in a chrome file that genuinely is reading text, matched on its own
// style expression. Each one needs a reason that says what it grows into,
// because "it looked fine" is how the TabHub bug got written in the first
// place.
const READING_TEXT_IN_CHROME = [
  {
    file: 'components/MyItemsHub.tsx',
    style: 'styles.categoryLabel',
    why: 'Inside categoriesScroll, which shrinks to fit inside whatever the card is allowed to be and scrolls past that: the list of saved things grows, so a longer row is reading text in a container that can take it.',
  },
  {
    file: 'components/MyItemsHub.tsx',
    style: 'styles.emptyText',
    why: 'The "nothing saved yet" sentence, in the same scrolling card. It is a paragraph somebody reads once, not a label the layout is measured against.',
  },
];

function attributeNames(opening) {
  const names = [];
  for (const attr of opening.attributes.properties) {
    if (ts.isJsxAttribute(attr) && attr.name) names.push(attr.name.getText());
  }
  return names;
}

function isPinned(opening) {
  for (const attr of opening.attributes.properties) {
    if (!ts.isJsxAttribute(attr) || attr.name.getText() !== 'allowFontScaling') continue;
    const value = attr.initializer;
    if (!value || !ts.isJsxExpression(value) || !value.expression) continue;
    if (value.expression.kind === ts.SyntaxKind.FalseKeyword) return true;
  }
  return false;
}

function styleText(opening) {
  for (const attr of opening.attributes.properties) {
    if (ts.isJsxAttribute(attr) && attr.name.getText() === 'style') {
      return attr.initializer ? attr.initializer.getText() : '';
    }
  }
  return '';
}

const findings = [];
let checked = 0;
let allowed = 0;

for (const { file, mode } of CHROME_FILES) {
  const full = path.join(ROOT, file);
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(full, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );

  // depth counts enclosing Text elements: a Text inside a Text inherits both
  // allowFontScaling and maxFontSizeMultiplier from it, so the inner one is
  // already answered by the outer one.
  function walk(node, insideText) {
    let opening = null;
    if (ts.isJsxElement(node)) opening = node.openingElement;
    else if (ts.isJsxSelfClosingElement(node)) opening = node;

    const isText = opening != null && /(^|\.)Text$/.test(opening.tagName.getText());

    if (isText && !insideText) {
      checked += 1;
      const names = attributeNames(opening);
      const pinned = isPinned(opening);
      const capped = names.includes('maxFontSizeMultiplier');
      const ok = mode === 'pin' ? pinned : pinned || capped;

      if (!ok) {
        const style = styleText(opening);
        const exempt = READING_TEXT_IN_CHROME.find(
          (entry) => entry.file === file && style.includes(entry.style),
        );
        if (exempt) {
          allowed += 1;
        } else {
          const { line } = source.getLineAndCharacterOfPosition(opening.getStart(source));
          findings.push({
            file,
            line: line + 1,
            mode,
            style: style || '(no style)',
          });
        }
      }
    }

    ts.forEachChild(node, (child) => walk(child, insideText || isText));
  }

  walk(source, false);
}

console.log(`Checked ${checked} Text elements across ${CHROME_FILES.length} chrome files.`);
console.log(`${allowed} exempt as reading text inside something that scrolls.`);

if (findings.length === 0) {
  console.log('0 findings.');
  process.exit(0);
}

console.log(`\n${findings.length} findings:\n`);
for (const finding of findings) {
  const want =
    finding.mode === 'pin'
      ? 'needs allowFontScaling={false}: this box cannot change size'
      : 'needs maxFontSizeMultiplier={MENU_MAX_FONT_SCALE}, or allowFontScaling={false}, or an entry in READING_TEXT_IN_CHROME saying what it grows into';
  console.log(`  ${finding.file}:${finding.line}  ${finding.style}`);
  console.log(`      ${want}\n`);
}
process.exit(1);
