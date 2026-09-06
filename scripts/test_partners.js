// Runs lib/partners.ts: two people, two phones, one dinner.
//
// Built 2026-09-06. The risks, in order:
//
//  1. THE EXCLUSION RULE IS THE WHOLE FEATURE. A meal is out if it is RED for
//     anyone, and kept with a note if it is only yellow. Getting this wrong in
//     either direction is the two failure modes: intersecting on yellow empties
//     the menu, and not excluding on red plans a dinner that is actively bad for
//     one of them.
//  2. 'unknown' must NOT exclude. It is the opposite of what the single-person
//     generator does, deliberately, and it is the difference between a coverage
//     gap and an empty screen.
//  3. Nothing is combined until the partner has actually shared, and each refusal
//     names which piece is missing rather than falling back silently.
//  4. Condition codes and nothing else. No symptom, lab, stage or note vocabulary
//     may appear anywhere in this module's text.
//  5. The merged array must be stable, since the generator caches pools by it.
//
// Run with: node scripts/test_partners.js
// Exits non-zero on any failure.

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const LIB = path.join(__dirname, '..', 'lib');

// Recursive, with stubs, the same approach scripts/test_grocery_list_math.js
// already established. Needed here because the highest-risk function in this
// feature is decodeConnectionInvite, which lives in lib/connections.ts, which
// reaches lib/db.ts (18,000 lines and expo-sqlite, unloadable outside React
// Native) and expo-linking. Both are stubbed with a Proxy that throws BY NAME
// rather than returning undefined, so a test reaching for something the
// harness cannot provide fails loudly instead of somewhere further on.
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
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: `${name}.ts`,
  });
  const module = { exports: {} };
  cache.set(name, module.exports);
  const localRequire = (request) => {
    if (!request.startsWith('./')) return throwingStub(request);
    const target = request.slice(2);
    if (target === 'db') return throwingStub('lib/db.ts');
    return loadModule(target, cache);
  };
  // eslint-disable-next-line no-new-func
  new Function('exports', 'module', 'require', outputText)(module.exports, module, localRequire);
  cache.set(name, module.exports);
  return module.exports;
}

const P = loadModule('partners');
const {
  CONNECTION_ROLES, SHARE_SCOPES, defaultGrantsForRole, describeGrants,
  linkState, describeLinkState, fingerprintStanding,
  CONDITIONS_STALE_AFTER_DAYS, mergeConditionCodes, describeMerge,
  verdictForSharedMeal, describeSharedMealVerdict, describeEmptyPool,
} = P;

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

const TODAY = '2026-09-06';

// ---------------------------------------------------------------------------
// 1. Roles and grants. One table with roles, decided directly.
// ---------------------------------------------------------------------------

{
  check('there are exactly two roles', CONNECTION_ROLES.length, 2);
  check('recipe-only is the first, since it is what every existing connection is',
    CONNECTION_ROLES[0].code, 'recipe');
  check('and partner is the new one', CONNECTION_ROLES[1].code, 'partner');
  checkTrue('every role explains what it actually does',
    CONNECTION_ROLES.every((role) => role.what.length > 30));

  const recipeGrants = defaultGrantsForRole('recipe');
  check('a recipe-only connection grants nothing by default',
    Object.values(recipeGrants).filter(Boolean).length, 0);
  checkTrue('and specifically not conditions', recipeGrants.conditions === false);

  const partnerGrants = defaultGrantsForRole('partner');
  checkTrue('a partner shares meals by default, since that is the point', partnerGrants.meals);
  checkTrue('and shopping, so either of them can be the one who goes', partnerGrants.shopping);
  // The single most important default in this file.
  checkFalse('but NOT conditions, which is a list of diagnoses and has to be asked for',
    partnerGrants.conditions);

  check('the scopes are the three decided, and no more', SHARE_SCOPES.length, 3);
  const conditionScope = SHARE_SCOPES.find((scope) => scope.code === 'conditions');
  checkTrue('the conditions scope says outright what is NOT sent',
    /[Nn]ever your symptoms/.test(conditionScope.what));
  checkTrue('naming labs, healing stage and notes specifically',
    /labs/.test(conditionScope.what) && /healing stage/.test(conditionScope.what) && /notes/.test(conditionScope.what));

  check('nothing granted says so plainly', describeGrants(recipeGrants),
    'You are not sharing anything with them yet.');
  checkTrue('and a partner default lists what is on',
    /meals/.test(describeGrants(partnerGrants)) && /shopping/.test(describeGrants(partnerGrants)));
  checkFalse('without claiming conditions are shared when they are not',
    /conditions/.test(describeGrants(partnerGrants)));
}

// ---------------------------------------------------------------------------
// 2. Link state. Never claims a two-way link it has no evidence for.
// ---------------------------------------------------------------------------

{
  check('no confirmation means still waiting', linkState(null), 'awaiting-them');
  check('a confirmation means linked', linkState('2026-09-06T10:00:00Z'), 'linked');

  const waiting = describeLinkState('awaiting-them', 'Lisa');
  checkTrue('waiting says they have not confirmed', /not confirmed/.test(waiting));
  checkTrue('and warns that what you send may not land', /anywhere to land/.test(waiting));
  checkFalse('and never calls it working', /works both ways/.test(waiting));

  const linked = describeLinkState('linked', 'Lisa');
  checkTrue('linked says it works both ways', /works both ways/.test(linked));

  // The fingerprint matters more for a partner than for a one-off recipe, and
  // the wording has to reflect that rather than being the same sentence twice.
  const partnerUnverified = fingerprintStanding('partner', null);
  checkTrue('for a partner an unchecked fingerprint matters', partnerUnverified.matters);
  checkFalse('and is not verified', partnerUnverified.verified);
  checkTrue('and the wording tells them to read it out loud',
    /out loud/.test(partnerUnverified.message));
  checkTrue('and says why it is the only defence',
    /only way to be sure/.test(partnerUnverified.message));

  const recipeUnverified = fingerprintStanding('recipe', null);
  checkFalse('for a recipe-only connection it does not matter as much', recipeUnverified.matters);
  checkTrue('and the wording says nothing depends on it',
    /nothing here depends on it/.test(recipeUnverified.message));

  const verified = fingerprintStanding('partner', '2026-09-06T10:00:00Z');
  checkTrue('a compared fingerprint reads as done', verified.verified);
  checkFalse('and stops telling them to do it', /out loud/.test(verified.message));
}

// ---------------------------------------------------------------------------
// 3. Merging conditions, and the four states it can be in.
// ---------------------------------------------------------------------------

const MINE = ['hashimotos', 'migraine'];

{
  // Not linked yet.
  const notLinked = mergeConditionCodes({
    mine: MINE, partner: { name: 'Lisa', codes: ['celiac'], receivedAt: TODAY },
    partnerSharesConditions: true, linked: 'awaiting-them', today: TODAY,
  });
  check('an unconfirmed link refuses', notLinked.refusal, 'notLinked');
  check('and falls back to planning around me alone', notLinked.codes, ['hashimotos', 'migraine']);
  checkFalse('never quietly using their codes anyway', notLinked.codes.includes('celiac'));

  // Linked, but they have not granted conditions.
  const notShared = mergeConditionCodes({
    mine: MINE, partner: { name: 'Lisa', codes: ['celiac'], receivedAt: TODAY },
    partnerSharesConditions: false, linked: 'linked', today: TODAY,
  });
  check('no grant refuses', notShared.refusal, 'notShared');
  checkFalse('and their codes are not used', notShared.codes.includes('celiac'));
  checkTrue('and the wording says it is theirs to offer',
    /theirs to offer/.test(describeMerge(notShared, 'Lisa')));

  // Linked and granted, but they track nothing.
  const noneOfTheirs = mergeConditionCodes({
    mine: MINE, partner: { name: 'Lisa', codes: [], receivedAt: TODAY },
    partnerSharesConditions: true, linked: 'linked', today: TODAY,
  });
  check('a partner who tracks nothing is its own case', noneOfTheirs.refusal, 'noneOfTheirs');
  checkTrue('and the wording says meals are still shared regardless',
    /[Mm]eals are still shared/.test(describeMerge(noneOfTheirs, 'Lisa')));

  // The working case.
  const merged = mergeConditionCodes({
    mine: MINE, partner: { name: 'Lisa', codes: ['celiac', 'ibs'], receivedAt: TODAY },
    partnerSharesConditions: true, linked: 'linked', today: TODAY,
  });
  check('a real merge refuses nothing', merged.refusal, null);
  check('and holds every code once, sorted', merged.codes, ['celiac', 'hashimotos', 'ibs', 'migraine']);
  checkFalse('and is not stale when just received', merged.stale);
  checkTrue('and the wording counts them', /4 conditions between you/.test(describeMerge(merged, 'Lisa')));

  // Overlap must not double-count. Two people with the same condition is common.
  const overlapping = mergeConditionCodes({
    mine: ['hashimotos', 'migraine'],
    partner: { name: 'Lisa', codes: ['hashimotos', 'celiac'], receivedAt: TODAY },
    partnerSharesConditions: true, linked: 'linked', today: TODAY,
  });
  check('a shared condition appears once', overlapping.codes, ['celiac', 'hashimotos', 'migraine']);

  // Stability. The generator caches candidate pools keyed on this array, so an
  // order that flipped depending on which side was read first would look like a
  // different request for the same thing.
  const flipped = mergeConditionCodes({
    mine: ['migraine', 'hashimotos'],
    partner: { name: 'Lisa', codes: ['ibs', 'celiac'], receivedAt: TODAY },
    partnerSharesConditions: true, linked: 'linked', today: TODAY,
  });
  check('input order does not change the merged array', flipped.codes, merged.codes);

  // Duplicates within one side.
  const dupes = mergeConditionCodes({
    mine: ['hashimotos', 'hashimotos'],
    partner: { name: 'Lisa', codes: ['celiac', 'celiac'], receivedAt: TODAY },
    partnerSharesConditions: true, linked: 'linked', today: TODAY,
  });
  check('duplicates within one side collapse too', dupes.codes, ['celiac', 'hashimotos']);
}

// ---------------------------------------------------------------------------
// 4. Staleness of their list. A partner's conditions from a year ago.
// ---------------------------------------------------------------------------

{
  const fresh = mergeConditionCodes({
    mine: MINE, partner: { name: 'Lisa', codes: ['celiac'], receivedAt: '2026-06-06' },
    partnerSharesConditions: true, linked: 'linked', today: TODAY,
  });
  checkFalse('three months old is not stale', fresh.stale);

  const old = mergeConditionCodes({
    mine: MINE, partner: { name: 'Lisa', codes: ['celiac'], receivedAt: '2025-09-06' },
    partnerSharesConditions: true, linked: 'linked', today: TODAY,
  });
  checkTrue('a year old is stale', old.refusal === null && old.stale);
  checkTrue('and it is reported without refusing to combine',
    old.codes.includes('celiac'));
  checkTrue('and the wording asks whether it is still right',
    /still right/.test(describeMerge(old, 'Lisa')));

  const never = mergeConditionCodes({
    mine: MINE, partner: { name: 'Lisa', codes: ['celiac'], receivedAt: null },
    partnerSharesConditions: true, linked: 'linked', today: TODAY,
  });
  checkTrue('no received date counts as stale rather than as fine', never.stale);

  const broken = mergeConditionCodes({
    mine: MINE, partner: { name: 'Lisa', codes: ['celiac'], receivedAt: 'not-a-date' },
    partnerSharesConditions: true, linked: 'linked', today: TODAY,
  });
  checkTrue('an unreadable date counts as stale too', broken.stale);

  checkTrue('the window is a real stretch of months', CONDITIONS_STALE_AFTER_DAYS >= 90);
}

// ---------------------------------------------------------------------------
// 5. THE EXCLUSION RULE. Red excludes, yellow annotates. This is the feature.
// ---------------------------------------------------------------------------

const PEOPLE = [
  { name: 'You', codes: ['hashimotos'] },
  { name: 'Lisa', codes: ['celiac'] },
];

// A tier lookup standing in for the generator's own conditionTierForEntry.
const tiers = (map) => (code) => map[code] ?? 'unknown';

{
  const bothGreen = verdictForSharedMeal(PEOPLE, tiers({ hashimotos: 'green', celiac: 'green' }));
  checkTrue('green for both is plannable', bothGreen.plannable);
  check('and nobody is excluded', bothGreen.excludedFor, []);
  check('fine for both says so', describeSharedMealVerdict(bothGreen), 'Fine for both of you.');

  // The case the whole design exists for: yellow for one person does NOT remove
  // the meal, it annotates it.
  const yellowForOne = verdictForSharedMeal(PEOPLE, tiers({ hashimotos: 'green', celiac: 'yellow' }));
  checkTrue('yellow for one person is still plannable, which is the whole point',
    yellowForOne.plannable);
  check('and the caution is attributed to the right person',
    yellowForOne.perPerson, [{ who: 'You', tier: 'green' }, { who: 'Lisa', tier: 'yellow' }]);
  check('and the wording names who it is fine for and who should look closer',
    describeSharedMealVerdict(yellowForOne),
    'Fine for You, worth a closer look for Lisa.');

  const yellowForBoth = verdictForSharedMeal(PEOPLE, tiers({ hashimotos: 'yellow', celiac: 'yellow' }));
  checkTrue('yellow for both is still plannable', yellowForBoth.plannable);
  check('and reads as one statement rather than naming them both twice',
    describeSharedMealVerdict(yellowForBoth), 'Worth a closer look for both of you.');

  // Red excludes, and says for whom.
  const redForOne = verdictForSharedMeal(PEOPLE, tiers({ hashimotos: 'green', celiac: 'red' }));
  checkFalse('red for one person is NOT plannable', redForOne.plannable);
  check('and names who it is out for', redForOne.excludedFor, ['Lisa']);
  checkTrue('and the wording says it is one to avoid',
    /one to avoid for Lisa/.test(describeSharedMealVerdict(redForOne)));

  const redForBoth = verdictForSharedMeal(PEOPLE, tiers({ hashimotos: 'red', celiac: 'red' }));
  check('red for both names both', redForBoth.excludedFor, ['You', 'Lisa']);
  checkTrue('joined readably', /You and Lisa/.test(describeSharedMealVerdict(redForBoth)));

  // Red beats yellow within one person, and red anywhere beats green elsewhere.
  const mixed = verdictForSharedMeal(
    [{ name: 'You', codes: ['hashimotos', 'migraine'] }, { name: 'Lisa', codes: ['celiac'] }],
    tiers({ hashimotos: 'yellow', migraine: 'red', celiac: 'green' }),
  );
  check('the worst tier wins within a person', mixed.perPerson[0].tier, 'red');
  checkFalse('and one red anywhere removes the meal', mixed.plannable);
}

// ---------------------------------------------------------------------------
// 6. 'unknown' must not exclude. This is deliberately the opposite of what the
//    single-person generator does, and it is the difference between a coverage
//    gap and an empty menu.
// ---------------------------------------------------------------------------

{
  const unknownForPartner = verdictForSharedMeal(PEOPLE, tiers({ hashimotos: 'green' }));
  check('a condition with no data reads as unknown, not red',
    unknownForPartner.perPerson[1], { who: 'Lisa', tier: 'unknown' });
  checkTrue('and the meal is still plannable, since no data is not a risk',
    unknownForPartner.plannable);
  check('and nobody is excluded over missing data', unknownForPartner.excludedFor, []);

  // Unknown must not be reported as a caution either. It is neither.
  checkFalse('and unknown is not dressed up as a caution',
    /closer look/.test(describeSharedMealVerdict(unknownForPartner)));

  // But a real red still wins over an unknown elsewhere.
  const unknownPlusRed = verdictForSharedMeal(PEOPLE, tiers({ hashimotos: 'red' }));
  checkFalse('a real red still excludes even when the other side is unknown',
    unknownPlusRed.plannable);
  check('and only the person it is actually red for is named',
    unknownPlusRed.excludedFor, ['You']);

  // Yellow beats unknown within one person, so a known caution is not hidden by
  // an unknown sitting beside it.
  const yellowBeatsUnknown = verdictForSharedMeal(
    [{ name: 'You', codes: ['hashimotos', 'unmapped'] }],
    tiers({ hashimotos: 'yellow' }),
  );
  check('a known caution is not lost behind an unknown', yellowBeatsUnknown.perPerson[0].tier, 'yellow');
}

// ---------------------------------------------------------------------------
// 7. The empty pool, named rather than shown as a blank screen.
// ---------------------------------------------------------------------------

{
  const message = describeEmptyPool(PEOPLE);
  checkTrue('it names both people', /You and Lisa/.test(message));
  checkTrue('and says it is a gap in the recipes rather than a setting',
    /gap in the recipes/.test(message));
  checkTrue('and says what still works', /one of you at a time/.test(message));
  checkFalse('and does not blame a setting', /change a setting|adjust your/i.test(message));
}

// ---------------------------------------------------------------------------
// 8. Condition codes and nothing else. The decision, enforced on the text.
// ---------------------------------------------------------------------------

{
  const allText = [
    ...CONNECTION_ROLES.map((role) => `${role.label} ${role.what}`),
    ...SHARE_SCOPES.map((scope) => `${scope.label} ${scope.what}`),
    describeLinkState('awaiting-them', 'Lisa'),
    describeLinkState('linked', 'Lisa'),
    fingerprintStanding('partner', null).message,
    fingerprintStanding('recipe', null).message,
    describeEmptyPool(PEOPLE),
  ].join(' ');

  // Nothing may offer to share anything beyond the three decided scopes.
  checkFalse('nothing offers to share a lab result',
    /share (your )?(labs|lab results)|labs are shared/i.test(allText));
  checkFalse('nothing offers to share symptoms',
    /share (your )?symptoms|symptoms are shared/i.test(allText));
  checkFalse('nothing offers to share a healing stage',
    /share (your )?healing stage/i.test(allText));
  checkFalse('nothing offers to share weight or medications',
    /share (your )?(weight|medications|meds)/i.test(allText));

  // The jurisdiction and evidence rules this project holds everywhere.
  checkFalse('nothing claims the link is encrypted end to end, which it is not',
    /end.to.end|encrypted/i.test(allText));
  checkFalse('nothing claims a cryptographic guarantee about pairing',
    /guarantee|proves|verified identity/i.test(allText));
  checkFalse('and no dash is used in place of punctuation', /—|–| -- /.test(allText));
}

// ---------------------------------------------------------------------------
// 9. THE WIRE FORMAT. The one place a wrong field means a diagnosis list
//    crossing a link that was never granted it.
// ---------------------------------------------------------------------------

{
  const { decodeConnectionInvite } = loadModule('connections');
  // Standard base64 of the JSON, which is exactly what encodeBase64Utf8
  // produces on the sending side. Built here rather than round-tripped
  // through the builder, because the builder needs a database and the thing
  // worth testing is what happens to a payload that ARRIVES.
  const wire = (obj) => Buffer.from(JSON.stringify(obj), 'utf8').toString('base64');

  check('garbage decodes to null rather than throwing', decodeConnectionInvite('not base64 at all!!'), null);
  check('valid base64 that is not JSON decodes to null', decodeConnectionInvite(wire !== null ? 'aGVsbG8=' : ''), null);
  check('an unknown version is refused', decodeConnectionInvite(wire({ v: 9, fromName: 'X', publicKeyBase64: 'k' })), null);
  check('a missing name is refused', decodeConnectionInvite(wire({ v: 2, publicKeyBase64: 'k' })), null);
  check('a missing key is refused', decodeConnectionInvite(wire({ v: 2, fromName: 'X' })), null);

  // A v1 link from before partners existed still works, and reads as a recipe
  // connection. Refusing it would break something that used to work.
  const v1 = decodeConnectionInvite(wire({ v: 1, fromName: 'Ana', publicKeyBase64: 'AAAAkey1' }));
  check('a v1 invite still decodes', v1.fromName, 'Ana');
  check('and reads as a recipe connection', v1.role, 'recipe');
  check('granting nothing', v1.grants, { meals: false, shopping: false, conditions: false });
  check('with no codes', v1.conditionCodes, undefined);
  checkFalse('and claiming nothing about having me', v1.alreadyHaveYou);

  // A full partner invite.
  const partner = decodeConnectionInvite(wire({
    v: 2, fromName: 'Lisa', publicKeyBase64: 'AAAAkey2', role: 'partner',
    grants: { meals: true, shopping: true, conditions: true },
    conditionCodes: ['celiac', 'ibs'], alreadyHaveYou: true,
  }));
  check('a partner invite reads as one', partner.role, 'partner');
  check('its grants come through', partner.grants, { meals: true, shopping: true, conditions: true });
  check('its codes come through', partner.conditionCodes, ['celiac', 'ibs']);
  checkTrue('and the claim that they added me', partner.alreadyHaveYou);

  // THE CHECK THAT MATTERS MOST. A payload carrying codes while claiming no
  // condition grant is contradicting itself, and the safe reading is to drop
  // them rather than to store a diagnosis list nobody offered.
  const contradictory = decodeConnectionInvite(wire({
    v: 2, fromName: 'Lisa', publicKeyBase64: 'AAAAkey3', role: 'partner',
    grants: { meals: true, shopping: true, conditions: false },
    conditionCodes: ['celiac', 'ibs'],
  }));
  check('codes sent without the grant are DROPPED', contradictory.conditionCodes, undefined);
  checkFalse('and the grant stays false', contradictory.grants.conditions);

  // Every field is normalised rather than trusted, since this arrived from
  // another device and a wrong type is a real possibility.
  const junk = decodeConnectionInvite(wire({
    v: 2, fromName: 'Lisa', publicKeyBase64: 'AAAAkey4', role: 'nonsense',
    grants: { meals: 'yes', shopping: 1, conditions: null },
    conditionCodes: 'celiac', alreadyHaveYou: 'true',
  }));
  check('an unknown role falls back to recipe', junk.role, 'recipe');
  check('a string is not a granted boolean', junk.grants, { meals: false, shopping: false, conditions: false });
  check('nor is the number 1', junk.grants.shopping, false);
  check('a string where an array belongs is dropped', junk.conditionCodes, undefined);
  checkFalse('and a string is not a claim', junk.alreadyHaveYou);

  // Non-string entries inside the array are filtered rather than stored.
  const mixed = decodeConnectionInvite(wire({
    v: 2, fromName: 'Lisa', publicKeyBase64: 'AAAAkey5', role: 'partner',
    grants: { meals: true, shopping: true, conditions: true },
    conditionCodes: ['celiac', 42, null, 'ibs', { code: 'x' }],
  }));
  check('only the real codes survive', mixed.conditionCodes, ['celiac', 'ibs']);

  // A recipe-role invite must not smuggle codes either, even claiming a grant:
  // the grant is what gates the codes, so a recipe connection that granted
  // conditions is a contradiction the receiver should not act on. It decodes,
  // and it is the accept screen that refuses to store them for a recipe role.
  const smuggle = decodeConnectionInvite(wire({
    v: 2, fromName: 'Lisa', publicKeyBase64: 'AAAAkey6', role: 'recipe',
    grants: { meals: false, shopping: false, conditions: true },
    conditionCodes: ['celiac'],
  }));
  check('the role is preserved as recipe', smuggle.role, 'recipe');
}

console.log(`${checks - failures}/${checks} checks passed`);
if (failures > 0) {
  console.error(`${failures} FAILED`);
  process.exit(1);
}
