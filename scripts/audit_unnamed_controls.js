// Every control has a name (voice control, step 1, 1.0.66.11).
//
// Direct instruction, 2026-10-10: "I do mean they can do everything in the
// app by voice command using plain words, and not just some things." A
// control can only be said if it has a name. A button with words inside it is
// named by those words, both for the phone's own voice access (Android Voice
// Access, iPhone Voice Control, Windows Voice Access) and for the app's voice
// commands. A button with only an icon in it has no name until it is given an
// accessibilityLabel, which is what this finds.
//
// A touchable counts as named when it carries accessibilityLabel (or
// aria-label), or when a Text sits anywhere inside it. One marked
// accessible={false} is a backdrop or a wrapper nobody presses on purpose and
// is skipped. A touchable whose only content is a component this script cannot
// see into (a <Row />) is listed separately as UNSURE, not counted as a
// finding; ALLOWED holds any that are settled by reading the component.
//
// Usage: node scripts/audit_unnamed_controls.js [--list] [--unsure]
// Must stay at 0.
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const ROOTS = ['app', 'components'];
const TOUCHABLES = new Set(['TouchableOpacity', 'Pressable', 'TouchableHighlight', 'TouchableWithoutFeedback']);
// Components that never carry words: an icon, an image, a plain box.
const WORDLESS = new Set([
  'Ionicons',
  'MaterialCommunityIcons',
  'MaterialIcons',
  'FontAwesome',
  'FontAwesome5',
  'Feather',
  'Image',
  'ImageBackground',
  'View',
  'Svg',
  'Path',
  'Circle',
  'Rect',
  'G',
  'ActivityIndicator',
  'LinearGradient',
  'Animated.View',
]);
// Components that are, or wrap, a Text.
const WORDED = new Set(['Text', 'Animated.Text', 'EditableText']);

const root = path.join(path.dirname(require.resolve('./audit_unnamed_controls.js')), '..');

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.tsx$/.test(entry.name)) out.push(full);
  }
  return out;
}

function tagName(node) {
  const tag = ts.isJsxElement(node) ? node.openingElement.tagName : node.tagName;
  return tag.getText();
}

function attributes(node) {
  return ts.isJsxElement(node) ? node.openingElement.attributes : node.attributes;
}

function hasAttr(node, names) {
  return attributes(node).properties.some(
    (p) => ts.isJsxAttribute(p) && names.includes(p.name.getText()),
  );
}

function attrIsFalse(node, name) {
  return attributes(node).properties.some(
    (p) =>
      ts.isJsxAttribute(p) &&
      p.name.getText() === name &&
      p.initializer &&
      ts.isJsxExpression(p.initializer) &&
      p.initializer.expression &&
      p.initializer.expression.kind === ts.SyntaxKind.FalseKeyword,
  );
}

// 'worded' | 'unsure' | 'wordless'
function contentKind(node) {
  let sawUnknown = false;
  let sawWords = false;
  function visit(child) {
    if (sawWords) return;
    if (ts.isJsxText(child)) {
      if (child.getText().trim()) sawWords = true;
      return;
    }
    if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
      const name = tagName(child);
      if (WORDED.has(name)) {
        sawWords = true;
        return;
      }
      if (!WORDLESS.has(name) && !TOUCHABLES.has(name)) sawUnknown = true;
    }
    // A label handed down as a prop ({label}) inside an unknown component
    // counts as unknown; a bare {expression} child of the touchable might be
    // a string or an element, also unknown.
    if (ts.isJsxExpression(child) && child.parent && (ts.isJsxElement(child.parent)) && child.expression) {
      const inner = child.expression;
      const isElementish = ts.isJsxElement(inner) || ts.isJsxSelfClosingElement(inner) || ts.isJsxFragment(inner);
      if (!isElementish && !ts.isConditionalExpression(inner) && !ts.isBinaryExpression(inner) && !ts.isCallExpression(inner)) {
        sawUnknown = true;
      }
    }
    ts.forEachChild(child, visit);
  }
  if (ts.isJsxElement(node)) node.children.forEach(visit);
  if (sawWords) return 'worded';
  return sawUnknown ? 'unsure' : 'wordless';
}

// "file:line text" -> why it needs no label.
const ALLOWED = {};

const findings = [];
const unsure = [];
let checked = 0;
for (const base of ROOTS) {
  for (const file of walk(path.join(root, base), [])) {
    const rel = path.relative(root, file).split(path.sep).join('/');
    const text = fs.readFileSync(file, 'utf8');
    const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    function visit(node) {
      if ((ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) && TOUCHABLES.has(tagName(node))) {
        checked++;
        if (!hasAttr(node, ['accessibilityLabel', 'aria-label']) && !attrIsFalse(node, 'accessible')) {
          const kind = contentKind(node);
          const line = source.getLineAndCharacterOfPosition(node.getStart()).line + 1;
          const key = `${rel}:${line}`;
          if (kind === 'wordless' && !ALLOWED[key]) findings.push(key);
          else if (kind === 'unsure') unsure.push(key);
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
}

const args = process.argv.slice(2);
if (args.includes('--list')) for (const f of findings) console.log(f);
if (args.includes('--unsure')) for (const f of unsure) console.log('UNSURE', f);
console.log(`Checked ${checked} controls.`);
console.log(`${unsure.length} hold only a component this script cannot see into (--unsure to list).`);
console.log(`${findings.length} with no name.`);
process.exit(findings.length ? 1 : 0);
