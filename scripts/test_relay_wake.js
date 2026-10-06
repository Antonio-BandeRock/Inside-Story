// Checks lib/relayWake.ts, the pure half of M1 (1.0.62.2): how a wake-up
// from the relay is recognised, and when a phone tells the relay where to
// wake it or to forget it.
//
//  1. The word in a wake-up matches the Worker's WAKE_KIND byte for byte.
//  2. A wake-up is recognised in every shape expo-notifications hands it over,
//     and an ordinary reminder is not mistaken for one.
//  3. A phone linked to nobody leaves no address at the relay, and the last
//     link going takes it back.
//  4. A changed address, a changed mailbox, a stale or future record all
//     register again; an unchanged recent one asks nothing.
//
// Run with: node scripts/test_relay_wake.js
// Exits non-zero on any failure.

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
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    throw new Error(relPath + ' should import nothing at runtime, but asked for ' + name);
  });
  return module.exports;
}

const wake = load('lib/relayWake.ts');

let checks = 0;
let failures = 0;
function check(condition, label) {
  checks += 1;
  if (!condition) {
    failures += 1;
    console.error('FAIL: ' + label);
  }
}
function same(actual, expected, label) {
  check(actual === expected, label + ' (got ' + JSON.stringify(actual) + ', wanted ' + JSON.stringify(expected) + ')');
}

// 1. The Worker and the app agree on the word.
const worker = fs.readFileSync(path.join(__dirname, '..', 'docs/app-links/src/index.js'), 'utf8');
const match = worker.match(/const WAKE_KIND = '([^']+)'/);
check(!!match, 'the Worker declares WAKE_KIND');
if (match) same(match[1], wake.RELAY_WAKE_KIND, 'the Worker and the app use the same wake word');

// 2. Recognising a wake-up.
const word = wake.RELAY_WAKE_KIND;
check(wake.isRelayWake({ data: { kind: word } }), 'a background task payload');
check(wake.isRelayWake({ content: { data: { kind: word } }, trigger: { type: 'push' } }), 'a foreground notification request');
check(wake.isRelayWake({ data: { dataString: JSON.stringify({ kind: word }) } }), 'data nested as a string');
check(!wake.isRelayWake({ data: { kind: 'dose', medId: 3 } }), 'a dose reminder is not a wake-up');
check(!wake.isRelayWake(null), 'nothing is not a wake-up');
check(!wake.isRelayWake(undefined), 'undefined is not a wake-up');
const circular = {};
circular.self = circular;
check(!wake.isRelayWake(circular), 'something that cannot be read is not a wake-up');

// 3 and 4. When to register.
const now = Date.parse('2026-10-06T12:00:00Z');
const kept = { mailbox: 'abc', token: 'tok-1', registeredAt: '2026-10-05T12:00:00Z' };
const plan = (over) => wake.planWakeRegistration({ hasSomebody: true, mailbox: 'abc', token: 'tok-1', kept, now, ...over });

same(plan({ hasSomebody: false, kept: null }), 'nothing', 'linked to nobody, nothing kept: nothing');
same(plan({ hasSomebody: false }), 'forget', 'the last link gone: forget');
same(plan({ token: null }), 'nothing', 'no address this run: leave the relay alone');
same(plan({ mailbox: null }), 'nothing', 'no mailbox this run: leave the relay alone');
same(plan({ kept: null }), 'register', 'first time: register');
same(plan({ token: 'tok-2' }), 'register', 'Google handed out a new address: register');
same(plan({ mailbox: 'xyz' }), 'register', 'a new key: register');
same(plan({}), 'nothing', 'unchanged and recent: nothing');
same(plan({ now: Date.parse(kept.registeredAt) + wake.REREGISTER_AFTER_MS }), 'register', 'a week on: register again');
same(plan({ kept: { ...kept, registeredAt: '2027-01-01T00:00:00Z' } }), 'register', 'a record from the future: register');
same(plan({ kept: { ...kept, registeredAt: 'not a date' } }), 'register', 'an unreadable time: register');

// Reading the kept record.
check(wake.parseWakeRegistration(JSON.stringify(kept)) !== null, 'a good record reads back');
same(wake.parseWakeRegistration('{'), null, 'broken JSON reads as nothing');
same(wake.parseWakeRegistration(JSON.stringify({ mailbox: 'a', token: 2, registeredAt: 'x' })), null, 'a wrong field type reads as nothing');

if (failures > 0) {
  console.error(failures + ' of ' + checks + ' checks failed.');
  process.exit(1);
}
console.log('All ' + checks + ' relay wake checks passed.');
