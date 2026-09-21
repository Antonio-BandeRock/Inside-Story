// Checks lib/desktop/phoneOnly.ts, the one list of what the computer version
// cannot do and the sentence it says instead (2026-09-21, direct instruction:
// "the Windows version needs to let the user know when anything their
// computer can't do is selected"):
//
// 1. Every feature has a message, every message names the phone as the place
//    the thing does work, and none carries a dash standing in for
//    punctuation or one of the filler words the writing rules ban.
// 2. announcePhoneOnly shows the notice and returns true on the desktop
//    build, and does nothing and returns false on a phone, which is what
//    lets a button gate itself with one line.
//
// The module's only import is isDesktopApp from ./bridge, stubbed here so
// both halves of (2) can be driven. Exits non-zero on any failure.

/* global __dirname */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

let desktop = false;

function load(relPath) {
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    if (name === './bridge') return { isDesktopApp: () => desktop };
    throw new Error(`${relPath} must stay free of runtime imports (asked for ${name})`);
  });
  return module.exports;
}

const phoneOnly = load('lib/desktop/phoneOnly.ts');

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
// The wording.
// ---------------------------------------------------------------------------

const features = phoneOnly.PHONE_ONLY_FEATURES;
check('the list is not empty', features.length > 0, true);
check('the title says where the thing works', phoneOnly.PHONE_ONLY_TITLE, 'This needs the app on your phone');

const BANNED_WORDS = /\b(real|genuine|genuinely)\b/i;
for (const feature of features) {
  const notice = phoneOnlyNotice(feature);
  check(`${feature} carries the title`, notice.title, phoneOnly.PHONE_ONLY_TITLE);
  check(`${feature} has a message`, typeof notice.message === 'string' && notice.message.trim().length > 40, true);
  check(`${feature} names the phone`, /\bphone\b/.test(notice.message), true);
  check(`${feature} names this computer`, /\bcomputer\b/.test(notice.message), true);
  check(`${feature} uses no dash for punctuation`, /[–—]| -- /.test(notice.message), false);
  check(`${feature} uses no filler word`, BANNED_WORDS.test(notice.message), false);
  check(`${feature} ends its last sentence`, /[.!?]$/.test(notice.message.trim()), true);
}

function phoneOnlyNotice(feature) {
  return phoneOnly.phoneOnlyNotice(feature);
}

check('an unknown feature has no message', phoneOnly.phoneOnlyNotice('teleport').message, undefined);

// ---------------------------------------------------------------------------
// The gate.
// ---------------------------------------------------------------------------

function shownBy(run) {
  const shown = [];
  const result = run((title, message) => shown.push({ title, message }));
  return { result, shown };
}

desktop = false;
{
  const { result, shown } = shownBy((show) => phoneOnly.announcePhoneOnly(show, 'scanProduct'));
  check('on a phone the gate lets the action through', result, false);
  check('and shows nothing', shown, []);
}

desktop = true;
{
  const { result, shown } = shownBy((show) => phoneOnly.announcePhoneOnly(show, 'scanProduct'));
  check('on the computer the gate stops the action', result, true);
  check('and shows the notice once', shown, [phoneOnly.phoneOnlyNotice('scanProduct')]);
}

if (failures > 0) {
  console.error(`${failures} of ${checks} checks failed`);
  process.exit(1);
}
console.log(`All ${checks} checks passed`);
