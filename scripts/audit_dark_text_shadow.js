/* global __dirname */
// Dark text never carries a drop shadow.
//
// 2026-09-21, direct report from both the phone and the Windows app: "we
// need to make sure any font that is black does not have a shadowed layer
// to it. It looks like a smudged font." The rule itself dates from
// 2026-08-29 (see the comment above `textShadow` in constants/typography.ts):
// a dark shadow behind dark text has nothing to separate it from, so it only
// thickens and smudges the glyphs. That first pass was a hand sweep of 41
// styles across 34 files with nothing guarding it, and it regressed. This
// script is the guard.
//
// What it checks. It walks the TypeScript AST over app, components,
// constants, hooks and lib, and looks at two things:
//
//   1. Every style object inside a StyleSheet.create call, and every
//      `const X = {...}` object at any depth. The style's props are folded
//      in source order, the same way React Native applies them, so a later
//      `textShadowColor: 'transparent'` or `textShadowRadius: 0` cancels an
//      earlier `...textShadow`, and a later `color` wins over an earlier one.
//   2. Every Text-like JSX element (Text, Animated.Text, TextInput, and the
//      icon components, which take the same textShadow props through
//      `style`). Its `style` attribute is composed the same way: arrays fold
//      left, `cond && x` and `cond ? a : b` produce separate branches, and a
//      named style resolves to the entry gathered in step 1 from the same
//      file. An icon's colour comes from its `color` prop.
//
// A finding is any style or element where, in at least one branch, the
// effective colour is dark AND a shadow is in effect. Dark means a WCAG
// relative luminance below DARK_LUMINANCE. Colours resolve from a hex or
// rgb() literal, 'black', or a `colors.X` token read out of
// constants/colors.ts (a token that reads from the ground theme, such as
// colors.background, is dark when every theme's value is dark). A colour the
// script cannot resolve (a prop, a variable, a function call) is skipped and
// counted, never flagged, so the report is exact rather than noisy.
//
// Exit code is 1 when there are findings, so this fails a build the moment
// dark text picks up a shadow again. Run it beside
// audit_bare_text_on_background.js, audit_chrome_font_scale.js and
// audit_menu_card_fit.js before calling UI work done.
//
//   node scripts/audit_dark_text_shadow.js            whole app
//   node scripts/audit_dark_text_shadow.js app/x.tsx  one or more files
//   node scripts/audit_dark_text_shadow.js --verbose  also list what was skipped

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const ROOT = path.join(__dirname, '..');
const SCAN_DIRS = ['app', 'components', 'constants', 'hooks', 'lib'];

// #0F2E2B (textOnPrimary) is 0.022, every ground background sits between
// 0.03 and 0.04, statusFlagged #7A3226 is 0.066, and the lightest thing
// anyone would call dark, menuSurface #545A63, is 0.10. The first light
// text colour, GAUGE_EMPTY #6E8CA0, is 0.24. 0.12 splits them cleanly.
const DARK_LUMINANCE = 0.12;

const SHADOW_CONSTANTS = new Set(['textShadow', 'menuLabelShadow', 'CORNER_ICON_SHADOW']);
const TEXT_TAGS = new Set([
  'Text', 'Animated.Text', 'TextInput', 'Animated.TextInput',
  'Ionicons', 'MaterialCommunityIcons', 'MaterialIcons', 'FontAwesome',
  'FontAwesome5', 'FontAwesome6', 'Feather', 'AntDesign', 'Entypo',
]);

const fileArgs = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const verbose = process.argv.includes('--verbose');

// ---------------------------------------------------------------- colours

function srgbToLinear(c) {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function luminanceOfRgb(r, g, b) {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

// Returns a luminance in [0, 1], or null when the string is not a colour
// this script understands.
function luminanceOfColorString(raw) {
  if (typeof raw !== 'string') return null;
  const s = raw.trim().toLowerCase();
  if (s === 'black') return 0;
  if (s === 'white') return 1;
  if (s === 'transparent') return null;
  let m = /^#([0-9a-f]{3,4})$/.exec(s);
  if (m) {
    const h = m[1];
    return luminanceOfRgb(parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16));
  }
  m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/.exec(s);
  if (m) {
    const h = m[1];
    return luminanceOfRgb(parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16));
  }
  m = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(s);
  if (m) return luminanceOfRgb(Number(m[1]), Number(m[2]), Number(m[3]));
  return null;
}

// Reads constants/colors.ts and returns { tokenName: luminance | null }.
// A token whose initializer is `initialGround.X` takes the highest
// luminance across the ground themes, so it counts as dark only when it is
// dark on every theme.
function loadColorTokens() {
  const file = path.join(ROOT, 'constants', 'colors.ts');
  const src = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const themes = {};
  const tokens = {};
  const objectOfDeclaration = (name) => {
    let found = null;
    const visit = (n) => {
      if (found) return;
      if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.name.text === name
          && n.initializer && ts.isObjectLiteralExpression(n.initializer)) {
        found = n.initializer;
        return;
      }
      ts.forEachChild(n, visit);
    };
    visit(sf);
    return found;
  };
  const groundThemes = objectOfDeclaration('GROUND_THEMES');
  if (groundThemes) {
    for (const theme of groundThemes.properties) {
      if (!ts.isPropertyAssignment(theme) || !ts.isObjectLiteralExpression(theme.initializer)) continue;
      for (const field of theme.initializer.properties) {
        if (!ts.isPropertyAssignment(field) || !ts.isStringLiteral(field.initializer)) continue;
        const key = field.name.getText(sf);
        (themes[key] = themes[key] || []).push(luminanceOfColorString(field.initializer.text));
      }
    }
  }
  const colorsObject = objectOfDeclaration('colors');
  if (colorsObject) {
    for (const p of colorsObject.properties) {
      if (!ts.isPropertyAssignment(p)) continue;
      const key = p.name.getText(sf);
      const init = p.initializer;
      if (ts.isStringLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init)) {
        tokens[key] = luminanceOfColorString(init.text);
      } else if (ts.isPropertyAccessExpression(init) && init.expression.getText(sf) === 'initialGround') {
        const values = (themes[init.name.text] || []).filter((v) => v !== null);
        tokens[key] = values.length ? Math.max(...values) : null;
      } else if (ts.isPropertyAccessExpression(init) && init.expression.getText(sf) === 'colors') {
        tokens[key] = tokens[init.name.text] === undefined ? null : tokens[init.name.text];
      } else {
        tokens[key] = null;
      }
    }
  }
  return tokens;
}

const COLOR_TOKENS = loadColorTokens();

// ------------------------------------------------------------- the model

// A state is what folding style props in order leaves behind:
//   shadow:    true when a shadow is in effect
//   shadowSet: true when the style touched the shadow props at all (so a
//              later spread of it knows whether to overwrite the base)
//   color:     { text, lum } when resolved, { text, dynamic } when a colour
//              is set but cannot be read, or null when none has been set
function emptyState() {
  return { shadow: false, shadowSet: false, color: null };
}

function cloneState(s) {
  return { shadow: s.shadow, shadowSet: s.shadowSet, color: s.color };
}

function describeColor(expr) {
  if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) {
    return { text: `'${expr.text}'`, lum: luminanceOfColorString(expr.text) };
  }
  if (ts.isPropertyAccessExpression(expr) && ts.isIdentifier(expr.expression) && expr.expression.text === 'colors') {
    const key = expr.name.text;
    if (Object.prototype.hasOwnProperty.call(COLOR_TOKENS, key)) {
      return { text: `colors.${key}`, lum: COLOR_TOKENS[key] };
    }
  }
  if (ts.isParenthesizedExpression(expr) || ts.isAsExpression(expr) || ts.isNonNullExpression(expr)) {
    return describeColor(expr.expression);
  }
  return { text: expr.getText(), lum: null, dynamic: true };
}

// A `color:` value can itself be a conditional; each arm is a branch.
function colorBranches(expr) {
  if (ts.isParenthesizedExpression(expr)) return colorBranches(expr.expression);
  if (ts.isConditionalExpression(expr)) {
    return [...colorBranches(expr.whenTrue), ...colorBranches(expr.whenFalse)];
  }
  if (ts.isBinaryExpression(expr) && (expr.operatorToken.kind === ts.SyntaxKind.BarBarToken
      || expr.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken)) {
    return [...colorBranches(expr.left), ...colorBranches(expr.right)];
  }
  return [describeColor(expr)];
}

function withColor(states, branches) {
  const next = [];
  for (const s of states) {
    for (const c of branches) {
      const n = cloneState(s);
      n.color = c;
      next.push(n);
    }
  }
  return next;
}

// Applies one object literal's properties to each state in `states`,
// returning the new list of states (conditionals inside the object may
// fork it).
function applyObjectLiteral(obj, states, ctx) {
  let out = states.map(cloneState);
  for (const prop of obj.properties) {
    if (ts.isSpreadAssignment(prop)) {
      out = foldStyleExpr(prop.expression, out, ctx);
    } else if (ts.isPropertyAssignment(prop)) {
      const key = prop.name.getText(ctx.sf).replace(/^['"]|['"]$/g, '');
      const init = prop.initializer;
      if (key === 'textShadowColor') {
        const isTransparent = ts.isStringLiteral(init) && init.text === 'transparent';
        for (const s of out) {
          s.shadow = !isTransparent;
          s.shadowSet = true;
        }
      } else if (key === 'textShadowRadius') {
        if (ts.isNumericLiteral(init) && Number(init.text) === 0) {
          for (const s of out) {
            s.shadow = false;
            s.shadowSet = true;
          }
        }
      } else if (key === 'color') {
        out = withColor(out, colorBranches(init));
      }
    }
  }
  return out;
}

// Folding a resolved style onto a base state: the later style's explicit
// settings win, and the fields it left alone keep the base's values.
function mergeStates(base, later) {
  const out = cloneState(base);
  if (later.shadowSet) {
    out.shadow = later.shadow;
    out.shadowSet = true;
  }
  if (later.color !== null) out.color = later.color;
  return out;
}

function lookupNamedStyle(expr, ctx) {
  let key = null;
  if (ts.isPropertyAccessExpression(expr) && ts.isIdentifier(expr.expression)) {
    key = `${expr.expression.text}.${expr.name.text}`;
  } else if (ts.isIdentifier(expr)) {
    key = expr.text;
  }
  return key && ctx.styles.has(key) ? ctx.styles.get(key) : null;
}

function unwrap(e) {
  while (ts.isParenthesizedExpression(e) || ts.isAsExpression(e) || ts.isNonNullExpression(e)
      || (ts.isSatisfiesExpression && ts.isSatisfiesExpression(e))) {
    e = e.expression;
  }
  return e;
}

function lineOf(sf, node) {
  return sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
}

// One style expression (an object, an array, a conditional, a named style,
// a shadow constant) folded onto each of `states`.
function foldStyleExpr(expr, states, ctx) {
  expr = unwrap(expr);
  if (ts.isObjectLiteralExpression(expr)) return applyObjectLiteral(expr, states, ctx);
  if (ts.isArrayLiteralExpression(expr)) {
    let out = states.map(cloneState);
    for (const el of expr.elements) {
      if (!ts.isOmittedExpression(el)) out = foldStyleExpr(el, out, ctx);
    }
    return out;
  }
  if (ts.isConditionalExpression(expr)) {
    return [...foldStyleExpr(expr.whenTrue, states, ctx), ...foldStyleExpr(expr.whenFalse, states, ctx)];
  }
  if (ts.isBinaryExpression(expr)) {
    const k = expr.operatorToken.kind;
    if (k === ts.SyntaxKind.AmpersandAmpersandToken) {
      return [...states.map(cloneState), ...foldStyleExpr(expr.right, states, ctx)];
    }
    if (k === ts.SyntaxKind.BarBarToken || k === ts.SyntaxKind.QuestionQuestionToken) {
      return [...foldStyleExpr(expr.left, states, ctx), ...foldStyleExpr(expr.right, states, ctx)];
    }
  }
  if (ts.isIdentifier(expr) && SHADOW_CONSTANTS.has(expr.text)) {
    return states.map((s) => ({ ...s, shadow: true, shadowSet: true }));
  }
  const named = lookupNamedStyle(expr, ctx);
  if (named) {
    const next = [];
    for (const s of states) for (const n of named.states) next.push(mergeStates(s, n));
    return next;
  }
  // typography.X, null, undefined, false, a prop, a call: nothing this
  // script models, so the state passes through unchanged.
  return states.map(cloneState);
}

// ----------------------------------------------------- gathering styles

// Pass 1: every StyleSheet.create({...}) entry and every `const X = {...}`.
// Entries are recorded in source order so a later one can spread an
// earlier one.
function gatherStyles(sf) {
  const styles = new Map();
  const ctx = { sf, styles };
  const record = (key, obj, line) => {
    styles.set(key, { line, states: applyObjectLiteral(obj, [emptyState()], ctx) });
  };
  const recordSheet = (prefix, call) => {
    for (const p of call.arguments[0].properties) {
      if (ts.isPropertyAssignment(p) && ts.isObjectLiteralExpression(p.initializer)) {
        record(`${prefix}.${p.name.getText(sf).replace(/^['"]|['"]$/g, '')}`, p.initializer, lineOf(sf, p));
      }
    }
  };
  const isCreateCall = (init) => ts.isCallExpression(init) && init.expression.getText(sf) === 'StyleSheet.create'
    && init.arguments.length > 0 && ts.isObjectLiteralExpression(init.arguments[0]);
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      const init = unwrap(node.initializer);
      if (isCreateCall(init)) {
        recordSheet(node.name.text, init);
      } else if (ts.isObjectLiteralExpression(init)) {
        record(node.name.text, init, lineOf(sf, node));
      }
    }
    // StyleSheet.create returned from a function (makeTabBandStyles and the
    // like): its entries are recorded under the function's name.
    if (ts.isReturnStatement(node) && node.expression) {
      const init = unwrap(node.expression);
      if (isCreateCall(init)) {
        let fn = node.parent;
        while (fn && !ts.isFunctionDeclaration(fn) && !ts.isFunctionExpression(fn) && !ts.isArrowFunction(fn)) fn = fn.parent;
        const fnName = fn && fn.name ? fn.name.getText(sf)
          : fn && fn.parent && ts.isVariableDeclaration(fn.parent) ? fn.parent.name.getText(sf) : '<returned>';
        recordSheet(fnName, init);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return styles;
}

// -------------------------------------------------------- JSX composition

function styleStates(initializer, ctx) {
  if (ts.isJsxExpression(initializer)) {
    return initializer.expression ? foldStyleExpr(initializer.expression, [emptyState()], ctx) : [emptyState()];
  }
  return [emptyState()];
}

function tagName(node) {
  const tag = ts.isJsxSelfClosingElement(node) ? node.tagName : node.openingElement.tagName;
  return tag.getText();
}

function attributes(node) {
  const opening = ts.isJsxSelfClosingElement(node) ? node : node.openingElement;
  return opening.attributes.properties;
}

// ------------------------------------------------------------- the walk

function isDark(state) {
  return state.color && !state.color.dynamic && state.color.lum !== null && state.color.lum < DARK_LUMINANCE;
}

function auditFile(file) {
  const src = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const styles = gatherStyles(sf);
  const ctx = { sf, styles };
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const findings = [];
  let skipped = 0;
  const skippedNotes = [];

  for (const [name, entry] of styles) {
    const hit = entry.states.find((s) => s.shadow && isDark(s));
    if (hit) {
      findings.push(`${rel}:${entry.line}  style ${name}  color ${hit.color.text} (L ${hit.color.lum.toFixed(3)}) carries a shadow`);
    } else {
      const dyn = entry.states.find((s) => s.shadow && s.color && s.color.dynamic);
      if (dyn) {
        skipped += 1;
        skippedNotes.push(`${rel}:${entry.line}  style ${name}  color ${dyn.color.text}`);
      }
    }
  }

  const visit = (node) => {
    if ((ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) && TEXT_TAGS.has(tagName(node))) {
      let states = [emptyState()];
      let colorProp = null;
      for (const attr of attributes(node)) {
        if (!ts.isJsxAttribute(attr)) continue;
        const name = attr.name.getText(sf);
        if (name === 'style' && attr.initializer) {
          states = styleStates(attr.initializer, ctx);
        } else if (name === 'color' && attr.initializer) {
          colorProp = ts.isJsxExpression(attr.initializer) ? attr.initializer.expression : attr.initializer;
        }
      }
      if (colorProp) states = withColor(states, colorBranches(unwrap(colorProp)));
      const hit = states.find((s) => s.shadow && isDark(s));
      if (hit) {
        findings.push(`${rel}:${lineOf(sf, node)}  <${tagName(node)}>  color ${hit.color.text} (L ${hit.color.lum.toFixed(3)}) carries a shadow`);
      } else {
        const dyn = states.find((s) => s.shadow && s.color && s.color.dynamic);
        if (dyn) {
          skipped += 1;
          skippedNotes.push(`${rel}:${lineOf(sf, node)}  <${tagName(node)}>  color ${dyn.color.text}`);
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return { findings, skipped, skippedNotes };
}

function listFiles(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      listFiles(full, out);
    } else if (/\.(ts|tsx)$/.test(entry.name) && !/\.d\.ts$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

const files = fileArgs.length
  ? fileArgs.map((f) => path.resolve(ROOT, f))
  : SCAN_DIRS.flatMap((d) => (fs.existsSync(path.join(ROOT, d)) ? listFiles(path.join(ROOT, d), []) : []));

let total = 0;
let skippedTotal = 0;
let filesHit = 0;
for (const file of files) {
  const { findings, skipped, skippedNotes } = auditFile(file);
  skippedTotal += skipped;
  if (verbose) for (const n of skippedNotes) console.log(`skipped  ${n}`);
  if (findings.length) {
    total += findings.length;
    filesHit += 1;
    for (const f of findings) console.log(f);
  }
}

console.log('');
console.log(`Dark text with a shadow: ${total} finding${total === 1 ? '' : 's'} in ${filesHit} file${filesHit === 1 ? '' : 's'} (${files.length} files scanned; dark = luminance below ${DARK_LUMINANCE}).`);
console.log(`Shadowed text whose colour the source does not state (a prop or a variable): ${skippedTotal}, not counted.`);
process.exit(total > 0 ? 1 : 0);
