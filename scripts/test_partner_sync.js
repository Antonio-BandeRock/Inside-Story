// Runs lib/partnerSync.ts: what one phone sends the other.
//
// Built 2026-09-06. The agreed carrier is each person's own OneDrive or Google
// Drive, set up during pairing, with children inheriting the same location. This
// is the payload, kept independent of how it travels so the same bytes work over
// a cloud folder now and over the local network later.
//
// The risks, in order:
//
//  1. SENDING MORE THAN WAS GRANTED. The sender is the ONLY side that can honour
//     a grant, because what someone grants a partner is stored on their own
//     device. If this leaks a condition list the person did not share, nothing
//     downstream can undo it.
//  2. A PLAN THAT RESOLVES TO THE WRONG DISH. Recipe ids are only stable while
//     both phones are on the same reference database. On a mismatch the plan has
//     to be refused, and the conditions still accepted, because a condition code
//     is a plain string while a recipe id is a pointer into one database.
//  3. NOTHING BEYOND CODES AND RECIPE IDS. Never a symptom, a lab, a healing
//     stage, a note or a weight.
//  4. MALFORMED INPUT MUST NOT THROW. This is the boundary where another
//     device's data arrives.
//
// Run with: node scripts/test_partner_sync.js
// Exits non-zero on any failure.

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const LIB = path.join(__dirname, '..', 'lib');

function throwingStub(what) {
  return new Proxy(
    {},
    {
      get(_unused, prop) {
        if (prop === '__esModule') return true;
        if (prop === 'default') return throwingStub(what);
        throw new Error(`This harness stubs ${what}; it cannot provide ${String(prop)}.`);
      },
    },
  );
}

function loadModule(name, cache = new Map()) {
  if (cache.has(name)) return cache.get(name);
  const source = fs.readFileSync(path.join(LIB, `${name}.ts`), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    fileName: `${name}.ts`,
  });
  const module = { exports: {} };
  cache.set(name, module.exports);
  const localRequire = (request) => {
    if (request === 'tweetnacl') return require(request);
    if (!request.startsWith('./')) return throwingStub(request);
    const target = request.slice(2);
    if (target === 'db') return throwingStub('lib/db.ts');
    return loadModule(target, cache);
  };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, localRequire);
  cache.set(name, module.exports);
  return module.exports;
}

const {
  SYNC_PAYLOAD_VERSION, SYNC_SLOT_NAMES,
  buildSyncPayload, readSyncPayload, describeSyncResult, daysSinceSent,
} = loadModule('partnerSync');

let failures = 0;
let checks = 0;
function check(label, actual, expected) {
  checks += 1;
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failures += 1;
    console.error(`FAIL  ${label}`);
    console.error(`      expected ${JSON.stringify(expected)}`);
    console.error(`      got      ${JSON.stringify(actual)}`);
  }
}
function checkTrue(label, actual) { check(label, actual === true, true); }
function checkFalse(label, actual) { check(label, actual === false, true); }

const DB = '20260901180000';
const SENT = '2026-09-06T09:00:00.000Z';
const TODAY = '2026-09-06';
const CODES = ['hashimotos', 'celiac'];
const PLAN = [
  {
    date: '2026-09-07',
    slots: [
      { slot: 'breakfast', recipeIds: ['curated_snack_greek_yogurt_bowl'] },
      { slot: 'dinner', recipeIds: ['curated_side_lemon_garlic_broccoli', 'curated_salad_sesame_ginger_slaw'] },
    ],
  },
  { date: '2026-09-08', slots: [{ slot: 'lunch', recipeIds: ['curated_soup_green_lentil_vegetable_stew'] }] },
];

const ALL = { meals: true, shopping: true, conditions: true };
const DEFAULTS = { meals: true, shopping: true, conditions: false };
const NOTHING = { meals: false, shopping: false, conditions: false };

function build(grants, over = {}) {
  return buildSyncPayload({
    grants,
    myConditionCodes: CODES,
    plan: PLAN,
    referenceDbVersion: DB,
    fromFingerprint: '3F2A 9B10 7C44 E812',
    sentAt: SENT,
    ...over,
  });
}

// --- 1. THE PRIVACY RULE: sending honours the grants -------------------------

{
  const all = build(ALL);
  check('with every grant on, conditions travel', all.conditionCodes, ['celiac', 'hashimotos']);
  checkTrue('and so does the plan', Array.isArray(all.plan) && all.plan.length === 2);

  // The default: meals and shopping on, conditions deliberately off.
  const defaults = build(DEFAULTS);
  check('with conditions NOT granted, no codes are sent at all', defaults.conditionCodes, undefined);
  checkFalse('the field is genuinely absent, not empty',
    Object.prototype.hasOwnProperty.call(defaults, 'conditionCodes'));
  checkTrue('while the plan still travels', Array.isArray(defaults.plan));
  checkFalse('and no code appears anywhere in the serialised payload',
    JSON.stringify(defaults).includes('hashimotos'));

  const nothing = build(NOTHING);
  check('with nothing granted, no conditions', nothing.conditionCodes, undefined);
  check('and no plan', nothing.plan, undefined);
  check('what is left is only what identifies the message',
    Object.keys(nothing).sort(), ['fromFingerprint', 'referenceDbVersion', 'sentAt', 'v']);

  const mealsOff = build({ meals: false, shopping: true, conditions: true });
  check('meals off drops the plan and keeps the conditions', mealsOff.plan, undefined);
  check('conditions still present', mealsOff.conditionCodes, ['celiac', 'hashimotos']);
}

// --- 2. Normalising on the way out ------------------------------------------

{
  const messy = build(ALL, { myConditionCodes: ['  hashimotos ', 'hashimotos', '', 'celiac', '   '] });
  check('codes are trimmed, deduped and sorted', messy.conditionCodes, ['celiac', 'hashimotos']);

  const emptyCodes = build(ALL, { myConditionCodes: [] });
  check('granting conditions while tracking none sends no field', emptyCodes.conditionCodes, undefined);

  const badDays = build(ALL, {
    plan: [
      { date: 'not-a-date', slots: [{ slot: 'dinner', recipeIds: ['x'] }] },
      { date: '2026-09-09', slots: [{ slot: 'brunch', recipeIds: ['x'] }] },
      { date: '2026-09-10', slots: [{ slot: 'dinner', recipeIds: [] }] },
      { date: '2026-09-11', slots: [] },
      { date: '2026-09-12', slots: [{ slot: 'dinner', recipeIds: ['keeper'] }] },
    ],
  });
  check('only the well-formed day survives', badDays.plan.map((d) => d.date), ['2026-09-12']);
  check('and an unknown slot name never gets through', SYNC_SLOT_NAMES.includes('brunch'), false);
}

// --- 3. THE REFERENCE DATABASE GUARD ----------------------------------------
//
// The distinction that matters: a condition code is a plain, stable string; a
// recipe id is a pointer into one specific database. So a mismatch refuses the
// plan and still accepts the conditions.

{
  const raw = JSON.stringify(build(ALL));

  const same = readSyncPayload(raw, { myReferenceDbVersion: DB });
  checkTrue('on the same database the plan is usable', same.planUsable);
  check('and no refusal is recorded', same.planRefusal, null);
  check('the plan came through whole', same.payload.plan.length, 2);

  const different = readSyncPayload(raw, { myReferenceDbVersion: '20990101000000' });
  checkFalse('on a different database the plan is refused', different.planUsable);
  check('and says why', different.planRefusal, 'differentReferenceDatabase');
  check('the plan is DROPPED, not carried and flagged', different.payload.plan, undefined);
  // The valuable half: the conditions are still fine.
  check('while the conditions still arrive', different.payload.conditionCodes, ['celiac', 'hashimotos']);
  checkTrue('and the wording explains it without blaming anyone',
    /different version of the food database/.test(describeSyncResult(different, 'Lisa')));
  checkTrue('and says what fixes it', /Updating both apps/.test(describeSyncResult(different, 'Lisa')));
}

// --- 4. Reading is defensive ------------------------------------------------

for (const [label, raw] of [
  ['empty', ''],
  ['rubbish', 'not json at all'],
  ['an array', '[]'],
  ['null', 'null'],
  ['a number', '42'],
  ['a string', '"hello"'],
  ['no version', JSON.stringify({ sentAt: SENT, referenceDbVersion: DB, fromFingerprint: 'a' })],
  ['a future version', JSON.stringify({ ...build(ALL), v: SYNC_PAYLOAD_VERSION + 1 })],
  ['version zero', JSON.stringify({ ...build(ALL), v: 0 })],
  ['no sentAt', JSON.stringify({ v: 1, referenceDbVersion: DB, fromFingerprint: 'a' })],
  ['blank sentAt', JSON.stringify({ v: 1, sentAt: '  ', referenceDbVersion: DB, fromFingerprint: 'a' })],
  ['no database version', JSON.stringify({ v: 1, sentAt: SENT, fromFingerprint: 'a' })],
  ['no fingerprint', JSON.stringify({ v: 1, sentAt: SENT, referenceDbVersion: DB })],
]) {
  check(`refused: ${label}`, readSyncPayload(raw, { myReferenceDbVersion: DB }), null);
}

{
  // A payload with the required fields and nothing else is valid, and honestly
  // reports having brought nothing.
  const bare = readSyncPayload(
    JSON.stringify({ v: 1, sentAt: SENT, referenceDbVersion: DB, fromFingerprint: 'a' }),
    { myReferenceDbVersion: DB },
  );
  checkTrue('a payload sharing nothing is still readable', bare !== null);
  check('and reports no plan', bare.planRefusal, 'noPlanSent');
  checkTrue('and the wording says both things plainly',
    /did not share which conditions/.test(describeSyncResult(bare, 'Lisa'))
    && /did not share a meal plan/.test(describeSyncResult(bare, 'Lisa')));

  // Junk in the arrays is normalised rather than believed.
  const junk = readSyncPayload(
    JSON.stringify({
      v: 1, sentAt: SENT, referenceDbVersion: DB, fromFingerprint: 'a',
      conditionCodes: ['ok', 42, null, { x: 1 }, '', '  ok  '],
      plan: 'not an array',
    }),
    { myReferenceDbVersion: DB },
  );
  check('only real strings survive from a mixed code array', junk.payload.conditionCodes, ['ok']);
  check('a plan that is not an array is simply absent', junk.payload.plan, undefined);
}

// --- 5. Freshness ------------------------------------------------------------

check('a payload sent today reads as zero days old', daysSinceSent(SENT, TODAY), 0);
check('one sent a week ago reads as seven', daysSinceSent('2026-08-30T09:00:00.000Z', TODAY), 7);
check('an unreadable timestamp gives null rather than a wrong number', daysSinceSent('whenever', TODAY), null);
check('and a future timestamp never goes negative', daysSinceSent('2026-12-01T00:00:00.000Z', TODAY), 0);

// --- 6. NOTHING BEYOND CODES AND RECIPE IDS ---------------------------------
//
// Held on the shape and on the text, rather than trusting the comment at the top
// of the module.

{
  const serialised = JSON.stringify(build(ALL));
  for (const word of ['symptom', 'flare', 'lab', 'weight', 'medication', 'stage', 'note', 'dose', 'blood']) {
    checkFalse(`the payload carries no ${word} field`, new RegExp(`"[^"]*${word}`, 'i').test(serialised));
  }
  check('the only keys are the declared ones',
    Object.keys(build(ALL)).sort(),
    ['conditionCodes', 'fromFingerprint', 'plan', 'referenceDbVersion', 'sentAt', 'v']);

  const wording = [
    describeSyncResult(readSyncPayload(serialised, { myReferenceDbVersion: DB }), 'Lisa'),
    describeSyncResult(readSyncPayload(serialised, { myReferenceDbVersion: 'other' }), 'Lisa'),
  ].join(' ');
  checkFalse('the wording never mentions symptoms', /symptom/i.test(wording));
  checkFalse('nor labs', /\blab\b/i.test(wording));
  checkFalse('nor a healing stage', /healing stage/i.test(wording));
}

// --- 7. A field the sender adds cannot smuggle itself through ---------------
//
// Reading rebuilds the payload field by field rather than passing the parsed
// object along, so an extra key from a newer or hostile sender is dropped.

{
  const smuggled = readSyncPayload(
    JSON.stringify({ ...build(ALL), symptomLog: [{ day: TODAY, severity: 8 }], secret: 'x' }),
    { myReferenceDbVersion: DB },
  );
  checkFalse('an unexpected field does not survive the read',
    Object.prototype.hasOwnProperty.call(smuggled.payload, 'symptomLog'));
  checkFalse('nor any other extra key',
    Object.prototype.hasOwnProperty.call(smuggled.payload, 'secret'));
  check('and the result holds only the declared keys',
    Object.keys(smuggled.payload).sort(),
    ['conditionCodes', 'fromFingerprint', 'plan', 'referenceDbVersion', 'sentAt', 'v']);
}

if (failures) {
  console.error(`\n${failures} of ${checks} checks failed`);
  process.exit(1);
}
console.log(`${checks}/${checks} checks passed`);
