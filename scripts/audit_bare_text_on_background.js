// Find every <Text> that renders directly on a tab's photographic
// background with no surface of its own behind it.
//
// 2026-08-29, direct instruction: "No font should ever be directly on the
// tab background without its own background anywhere in the app. I don't
// know all of the places where that exists right now, but it is
// throughout the Insights area."
//
// A grep can't answer this: whether a given <Text> is legible depends on
// its ANCESTORS, not on its own style. So this walks the real TypeScript
// AST (the same approach scripts/backfill_curated_recipe_instructions_
// extract.js already uses for the same reason -- a regex over JSX full of
// nested ternaries and fragments is not trustworthy) and, for each <Text>,
// climbs its JSX ancestor chain asking whether anything above it actually
// paints a background.
//
// A style counts as painting a background if its StyleSheet.create entry
// sets backgroundColor to anything other than 'transparent'. Inline
// style={{ backgroundColor: ... }} counts too.
//
// KNOWN LIMITATION, stated rather than hidden: a <Text> nested inside a
// custom component that paints its own surface (a card component, an
// overlay) looks bare to this script, because the surface lives in that
// component's file rather than in the ancestor chain here. SURFACE_
// COMPONENTS below is the allowlist for the ones actually confirmed to
// paint a surface, checked by reading each one, not assumed. Anything
// this reports still needs a human look; it is an inventory to work from,
// not a verdict.
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

// Confirmed by reading each component's own render: every one of these
// wraps its children in a real opaque surface.
const SURFACE_COMPONENTS = new Set([
  'AppActionSheet',
  'InfoAlert',
  'BusyOverlay',
  'PasswordPrompt',
  'Modal',
  'PopoverSelect',
  'Dropdown',
  'TabHub',
  'LensHub',
  'ScopeHub',
  'MyItemsHub',
  'FlipCard',
  'TabDesktopMenu',
  'DigestTopicMenu',
  // Paints colors.surface for its expanded card (see its own styles).
  'CollapsibleOverlayCard',
]);

const ROOTS = ['app', 'components'];

// Deliberate, named exceptions to the rule, each granted directly and each
// carrying its own reason. An allowlist rather than deleting the finding,
// because a check with silent holes in it stops being a check: anything here
// still gets counted and printed under "allowed", it just does not fail.
//
// The bar for adding one: the text must already be legible without a fill (a
// real drop shadow doing the work), and it must have been asked for
// specifically. "It looked cluttered to me" is not enough on its own; that is
// what the rule exists to prevent.
const ALLOWED = [
  {
    file: 'components/VersionLabel.tsx',
    reason:
      '2026-08-30, direct request: "remove both backgrounds". The version label floats over every screen at 9px and a fill read as a badge in the corner. Legibility rests on textShadow, the same thing the two hub labels beside it rely on.',
  },
];

function isAllowed(file) {
  // Findings carry whatever separator the platform produced, so both sides are
  // normalized before comparing rather than assuming forward slashes.
  const normalized = String(file).split('\\').join('/');
  return ALLOWED.some((entry) => normalized === entry.file || normalized.endsWith(entry.file));
}

function collectFiles(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue;
      collectFiles(full, out);
    } else if (entry.name.endsWith('.tsx')) {
      out.push(full);
    }
  }
  return out;
}

// Map every style key defined in a StyleSheet.create({...}) in this file
// to whether it paints a background.
function buildStyleBackgroundMap(sourceFile) {
  const map = new Map();
  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === 'create' &&
      node.arguments.length > 0 &&
      ts.isObjectLiteralExpression(node.arguments[0])
    ) {
      for (const prop of node.arguments[0].properties) {
        if (!ts.isPropertyAssignment(prop) || !ts.isObjectLiteralExpression(prop.initializer)) continue;
        const key = prop.name.getText(sourceFile).replace(/['"]/g, '');
        let paints = false;
        for (const inner of prop.initializer.properties) {
          if (!ts.isPropertyAssignment(inner)) continue;
          if (inner.name.getText(sourceFile).replace(/['"]/g, '') !== 'backgroundColor') continue;
          const value = inner.initializer.getText(sourceFile);
          if (!/transparent/.test(value)) paints = true;
        }
        map.set(key, paints);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return map;
}

function styleRefNames(attrValue, sourceFile) {
  // Pull every `styles.foo` reference out of whatever shape the style prop
  // takes (a single ref, an array, a conditional inside an array).
  const names = [];
  let inlineBackground = false;
  const text = attrValue ? attrValue.getText(sourceFile) : '';
  for (const match of text.matchAll(/styles\.([A-Za-z0-9_]+)/g)) names.push(match[1]);
  if (/backgroundColor\s*:/.test(text) && !/backgroundColor\s*:\s*['"]?transparent/.test(text)) {
    inlineBackground = true;
  }
  return { names, inlineBackground };
}

function elementName(node) {
  const opening = ts.isJsxElement(node) ? node.openingElement : node;
  return opening.tagName.getText();
}

function getStyleAttr(node) {
  const opening = ts.isJsxElement(node) ? node.openingElement : node;
  for (const attr of opening.attributes.properties) {
    if (ts.isJsxAttribute(attr) && attr.name.getText() === 'style') return attr.initializer;
  }
  return undefined;
}

const findings = [];
const files = ROOTS.flatMap((root) => collectFiles(path.join(process.cwd(), root), []));

// Parsed up front and kept, because coverage is a CROSS-FILE question: a
// chart component's labels are bare within its own file and perfectly
// fine because every screen that renders it puts it inside a card. Asking
// that requires having every file's AST available at once, not one at a
// time.
const parsed = files.map((file) => {
  const text = fs.readFileSync(file, 'utf8');
  const sourceFile = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  return { file, sourceFile, styleBackgrounds: buildStyleBackgroundMap(sourceFile) };
});

const fileHelpers = new Map();

for (const { file, sourceFile, styleBackgrounds } of parsed) {
  // Starts at the node ITSELF, not its parent: a <Text> carrying its own
  // backgroundColor (a footnote styled as its own chip) is already
  // satisfying the rule and is not a finding.
  function ancestorPaints(node) {
    let current = node;
    while (current) {
      if (ts.isJsxElement(current) || ts.isJsxSelfClosingElement(current)) {
        const name = elementName(current);
        if (SURFACE_COMPONENTS.has(name)) return true;
        const { names, inlineBackground } = styleRefNames(getStyleAttr(current), sourceFile);
        if (inlineBackground) return true;
        for (const styleName of names) {
          if (styleBackgrounds.get(styleName)) return true;
        }
      }
      current = current.parent;
    }
    return false;
  }

  // The chain this script can see stops at whatever function the JSX sits
  // in. A helper like renderRow() returns a row that is placed inside a
  // real card somewhere else entirely, so its <Text> looks bare here and
  // is not. Reporting the enclosing function turns verification into one
  // check per function rather than one per line.
  function enclosingFunctionName(node) {
    let current = node.parent;
    while (current) {
      if (ts.isFunctionDeclaration(current) && current.name) return current.name.text;
      if (
        (ts.isArrowFunction(current) || ts.isFunctionExpression(current)) &&
        current.parent &&
        ts.isVariableDeclaration(current.parent) &&
        current.parent.name
      ) {
        return current.parent.name.getText(sourceFile);
      }
      current = current.parent;
    }
    return '(top level)';
  }

  fileHelpers.set(file, { ancestorPaints, enclosingFunctionName });
}

// A function's JSX is only genuinely bare if EVERY place it is used is
// also bare. renderRow() returns a row that its caller drops inside a
// card; DimensionChart's labels are bare in its own file and fine because
// every screen renders it inside one. Both are answered the same way:
// find the usages, ask whether they are covered, and recurse when a usage
// sits inside yet another helper.
//
// Requires EVERY usage to be covered rather than any: a helper used
// inside a card in one place and bare in another is a real finding at the
// bare one, and clearing it on the strength of the other would hide it.
// A name with no usage found anywhere stays a finding, since there is
// nothing to prove it safe.
const usageCoverageCache = new Map();
function coveredAtEveryUsage(functionName) {
  if (functionName === '(top level)') return false;
  if (usageCoverageCache.has(functionName)) return usageCoverageCache.get(functionName);
  // Seeded before recursing so a component that renders itself, or a pair
  // that render each other, cannot loop forever here.
  usageCoverageCache.set(functionName, false);

  const usages = [];
  for (const { file, sourceFile } of parsed) {
    function findUsages(node) {
      const isCall = ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === functionName;
      const isElement =
        (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) && elementName(node) === functionName;
      // Passed by reference rather than called: `.map(renderFoodRow)`.
      // The surface that matters is the one around the .map() call, so
      // the identifier's own position is the right place to look.
      const isReference =
        ts.isIdentifier(node) &&
        node.text === functionName &&
        node.parent &&
        !ts.isFunctionDeclaration(node.parent) &&
        !ts.isVariableDeclaration(node.parent) &&
        !ts.isImportSpecifier(node.parent) &&
        !(ts.isCallExpression(node.parent) && node.parent.expression === node);
      if (isCall || isElement || isReference) usages.push({ file, node });
      ts.forEachChild(node, findUsages);
    }
    findUsages(sourceFile);
  }

  let covered = usages.length > 0;
  for (const usage of usages) {
    const helpers = fileHelpers.get(usage.file);
    if (helpers.ancestorPaints(usage.node)) continue;
    if (coveredAtEveryUsage(helpers.enclosingFunctionName(usage.node))) continue;
    covered = false;
    break;
  }
  usageCoverageCache.set(functionName, covered);
  return covered;
}

for (const { file, sourceFile } of parsed) {
  const { ancestorPaints, enclosingFunctionName } = fileHelpers.get(file);
  function visit(node) {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const name = elementName(node);
      // Only leaf text nodes. A <Text> nested inside another <Text>
      // inherits the outer one's situation, so it isn't counted twice.
      if (name === 'Text' || name === 'AppText') {
        let insideText = false;
        let walker = node.parent;
        while (walker) {
          if ((ts.isJsxElement(walker) || ts.isJsxSelfClosingElement(walker)) && elementName(walker) === 'Text') {
            insideText = true;
            break;
          }
          walker = walker.parent;
        }
        if (!insideText && !ancestorPaints(node) && !coveredAtEveryUsage(enclosingFunctionName(node))) {
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          const { names } = styleRefNames(getStyleAttr(node), sourceFile);
          findings.push({
            file: path.relative(process.cwd(), file).replace(/\\/g, '/'),
            line: line + 1,
            styles: names.join(', ') || '(no style)',
            fn: enclosingFunctionName(node),
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
}

const allowedFindings = findings.filter((finding) => isAllowed(finding.file));
const findingsToReport = findings.filter((finding) => !isAllowed(finding.file));

const byFile = new Map();
for (const finding of findingsToReport) {
  if (!byFile.has(finding.file)) byFile.set(finding.file, []);
  byFile.get(finding.file).push(finding);
}

const sorted = [...byFile.entries()].sort((a, b) => b[1].length - a[1].length);
console.log(`Bare <Text> on the tab background: ${findingsToReport.length} across ${sorted.length} files\n`);
for (const [file, list] of sorted) {
  console.log(`${list.length.toString().padStart(4)}  ${file}`);
}

if (allowedFindings.length > 0) {
  console.log(`\nAllowed by name (${allowedFindings.length}), each granted directly:`);
  for (const entry of ALLOWED) {
    const count = allowedFindings.filter((finding) => finding.file.endsWith(entry.file)).length;
    if (count === 0) continue;
    console.log(`  ${entry.file}  (${count})`);
    console.log(`      ${entry.reason}`);
  }
}

if (process.argv[2]) {
  const filter = process.argv[2];
  console.log(`\n--- detail for files matching "${filter}" ---`);
  for (const [file, list] of sorted) {
    if (!file.includes(filter)) continue;
    const counts = new Map();
    for (const item of list) {
      const key = `${item.fn}  ::  ${item.styles}`;
      if (!counts.has(key)) counts.set(key, []);
      counts.get(key).push(item.line);
    }
    console.log(`\n${file}`);
    for (const [key, lines] of [...counts.entries()].sort((a, b) => b[1].length - a[1].length)) {
      console.log(`  ${lines.length.toString().padStart(3)}  ${key}   [${lines.slice(0, 6).join(', ')}]`);
    }
  }
}
