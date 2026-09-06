// Runs lib/partnerPlanning.ts: who a meal plan is actually generated for.
//
// Built 2026-09-06. This is the piece that turns a stored partner link into
// something the meal generator uses, closing the gap where mergeConditionCodes
// and verdictForSharedMeal were both written, tested, and called by nothing.
//
// The risks, in order:
//
//  1. PLANNING FOR ONE PERSON WHILE THE SCREEN IMPLIES BOTH. This is the whole
//     failure mode. Someone sets up a partner precisely because they expect both
//     to be planned around, so a plan that quietly covers one has to say so.
//  2. A REVOKED GRANT MUST STOP BEING USED. Condition codes stay in the row
//     after the grant is switched off, and continuing to plan around them would
//     be using data the person withdrew.
//  3. THE MERGED ARRAY MUST BE STABLE. The generator caches candidate pools by
//     it, so an order that flipped between reads would look like a different
//     request for the same thing.
//  4. A SECOND PARTNER MUST NOT BE SILENTLY IGNORED. Nothing stops someone
//     marking two people as partners, and only one is planned around.
//  5. REGENERATION MUST BE OFFERED WHEN THE SCOPE WIDENS, since a plan built for
//     a narrower set was never checked against the conditions it is missing.
//
// Run with: node scripts/test_partner_planning.js
// Exits non-zero on any failure.

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const LIB = path.join(__dirname, '..', 'lib');
const REAL_PACKAGES = new Set(['tweetnacl']);

// resolvePlanningScope reads the partner from lib/connections.ts, which reaches
// lib/db.ts. Rather than stub the whole database, the connections module is
// replaced with a controllable fake: this suite is about the DECISION, and the
// storage behind it has its own coverage in test_partners.js.
let fakePartner = null;
let fakeOthers = 0;

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
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: `${name}.ts`,
  });
  const module = { exports: {} };
  cache.set(name, module.exports);
  const localRequire = (request) => {
    if (REAL_PACKAGES.has(request)) return require(request);
    if (!request.startsWith('./')) return throwingStub(request);
    const target = request.slice(2);
    // The one substitution: a controllable partner instead of a database.
    if (target === 'connections') {
      return { getMealPlanningPartner: async () => ({ partner: fakePartner, others: fakeOthers }) };
    }
    if (target === 'db') return throwingStub('lib/db.ts');
    return loadModule(target, cache);
  };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, localRequire);
  cache.set(name, module.exports);
  return module.exports;
}

const { resolvePlanningScope, describePlanningScope, shouldRegenerateForScope } = loadModule('partnerPlanning');
const { CONDITIONS_STALE_AFTER_DAYS } = loadModule('partners');

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
const MINE = ['hashimotos', 'celiac'];

function partner(overrides = {}) {
  return {
    id: 'connection_1',
    name: 'Lisa',
    role: 'partner',
    theyHaveMeAt: '2026-09-05T10:00:00.000Z',
    grants: { meals: true, shopping: true, conditions: true },
    theirConditionCodes: ['rheumatoid_arthritis'],
    theirConditionsAt: '2026-09-05',
    ...overrides,
  };
}

async function scopeFor(p, others = 0) {
  fakePartner = p;
  fakeOthers = others;
  return resolvePlanningScope({ myConditionCodes: MINE, today: TODAY });
}

(async () => {
  // --- 1. No partner ---------------------------------------------------------
  {
    const scope = await scopeFor(null);
    check('with no partner, the generator gets my conditions', scope.conditionCodes, ['celiac', 'hashimotos']);
    check('and nothing claims otherwise', scope.partnerName, null);
    checkFalse('and it does not claim to cover both', scope.coversBoth);
    check('the wording is about me alone', describePlanningScope(scope), 'Planned around your conditions.');
  }

  // --- 2. The case this feature exists for -----------------------------------
  {
    const scope = await scopeFor(partner());
    check('a linked, sharing partner is merged in',
      scope.conditionCodes, ['celiac', 'hashimotos', 'rheumatoid_arthritis']);
    checkTrue('and it says it covers both', scope.coversBoth);
    checkTrue('the wording names both of you', /both of you/.test(describePlanningScope(scope)));
    checkTrue('and counts the conditions', /3 conditions/.test(describePlanningScope(scope)));
  }

  // --- 3. Every refusal names the missing piece ------------------------------
  //
  // These are the cases where planning silently narrows to one person. Each one
  // has to be visible, or the screen reads as success.
  {
    const notLinked = await scopeFor(partner({ theyHaveMeAt: null }));
    check('an unconfirmed link plans around me alone', notLinked.conditionCodes, ['celiac', 'hashimotos']);
    check('and says which piece is missing', notLinked.merge.refusal, 'notLinked');
    checkTrue('naming them', /Lisa has not confirmed the link/.test(describePlanningScope(notLinked)));

    // The privacy-critical one. Codes stay in the row after a grant is switched
    // off, and continuing to use them would be using withdrawn data.
    const revoked = await scopeFor(partner({ grants: { meals: true, shopping: true, conditions: false } }));
    check('a revoked conditions grant stops their codes being used',
      revoked.conditionCodes, ['celiac', 'hashimotos']);
    check('even though the codes are still stored', revoked.merge.refusal, 'notShared');
    checkFalse('their code is genuinely absent', revoked.conditionCodes.includes('rheumatoid_arthritis'));
    checkTrue('and the wording says it is theirs to offer',
      /theirs to offer rather than yours to switch on/.test(describePlanningScope(revoked)));

    const none = await scopeFor(partner({ theirConditionCodes: [] }));
    check('a partner who tracks nothing still counts as covered', none.merge.refusal, 'noneOfTheirs');
    checkTrue('and the wording says there is nothing extra',
      /nothing extra to plan around/.test(describePlanningScope(none)));
  }

  // --- 4. Stale ---------------------------------------------------------------
  {
    const old = new Date(Date.parse(`${TODAY}T00:00:00Z`) - (CONDITIONS_STALE_AFTER_DAYS + 5) * 86400000)
      .toISOString().slice(0, 10);
    const scope = await scopeFor(partner({ theirConditionsAt: old }));
    checkTrue('an old list is still used', scope.coversBoth);
    checkTrue('but flagged as stale', scope.merge.stale);
    checkTrue('and the wording says to check it',
      /more than six months old/.test(describePlanningScope(scope)));

    const fresh = await scopeFor(partner({ theirConditionsAt: TODAY }));
    checkFalse('a fresh list is not flagged', fresh.merge.stale);
    checkFalse('and the wording does not nag', /more than six months old/.test(describePlanningScope(fresh)));
  }

  // --- 5. Stability, since the generator caches by this array ----------------
  {
    const a = await scopeFor(partner({ theirConditionCodes: ['zzz_last', 'aaa_first'] }));
    const b = await scopeFor(partner({ theirConditionCodes: ['aaa_first', 'zzz_last'] }));
    check('the merged array does not depend on their ordering', a.conditionCodes, b.conditionCodes);
    check('and is sorted', a.conditionCodes, [...a.conditionCodes].sort());

    const dupes = await scopeFor(partner({ theirConditionCodes: ['hashimotos', 'celiac'] }));
    check('a condition both people track appears once', dupes.conditionCodes, ['celiac', 'hashimotos']);
  }

  // --- 6. A second partner is not silently ignored ---------------------------
  {
    const scope = await scopeFor(partner(), 2);
    check('the other partners are counted', scope.otherPartners, 2);
    checkTrue('and named on screen', /2 other partners/.test(describePlanningScope(scope)));
    checkTrue('saying which one is used', /only Lisa is planned around/.test(describePlanningScope(scope)));

    const one = await scopeFor(partner(), 1);
    checkTrue('singular reads correctly', /1 other partner,/.test(describePlanningScope(one)));

    const alone = await scopeFor(partner(), 0);
    checkFalse('and nothing is said when there is only one partner',
      /other partner/.test(describePlanningScope(alone)));
  }

  // --- 7. Regenerating when the scope changes -------------------------------
  //
  // The decision given directly: generate fresh for both rather than adopt an
  // existing plan, because a plan built for one person was never filtered
  // against the other's conditions.
  {
    const both = await scopeFor(partner());

    const widened = shouldRegenerateForScope({ planWasBuiltFor: ['celiac', 'hashimotos'], scope: both });
    checkTrue('a plan built before the partner joined is offered a regeneration', widened.regenerate);
    checkTrue('and the reason names them', /Lisa/.test(widened.why));

    const same = shouldRegenerateForScope({
      planWasBuiltFor: ['rheumatoid_arthritis', 'hashimotos', 'celiac'],
      scope: both,
    });
    checkFalse('the same set in a different order is not a change', same.regenerate);
    check('and offers no reason', same.why, null);

    const narrowed = shouldRegenerateForScope({
      planWasBuiltFor: ['celiac', 'hashimotos', 'rheumatoid_arthritis', 'gout'],
      scope: both,
    });
    checkTrue('a plan built for MORE conditions is also a change worth regenerating', narrowed.regenerate);

    const noPlan = shouldRegenerateForScope({ planWasBuiltFor: null, scope: both });
    checkFalse('with no plan yet there is nothing to regenerate', noPlan.regenerate);
  }

  // --- 8. Nothing beyond condition codes ------------------------------------
  //
  // The standing rule for this whole feature: the names of what someone tracks,
  // and never a symptom, a lab, a healing stage or a note. Held on the text.
  {
    const all = [
      describePlanningScope(await scopeFor(null)),
      describePlanningScope(await scopeFor(partner())),
      describePlanningScope(await scopeFor(partner({ theyHaveMeAt: null }))),
      describePlanningScope(await scopeFor(partner({ grants: { meals: true, shopping: true, conditions: false } }))),
      describePlanningScope(await scopeFor(partner({ theirConditionCodes: [] }))),
      shouldRegenerateForScope({ planWasBuiltFor: ['celiac'], scope: await scopeFor(partner()) }).why,
    ].join(' ');
    checkFalse('nothing mentions symptoms', /symptom/i.test(all));
    checkFalse('nothing mentions labs', /\blab\b|lab result/i.test(all));
    checkFalse('nothing mentions a healing stage', /healing stage/i.test(all));
    checkFalse('nothing mentions weight or medications', /\bweight\b|medication/i.test(all));
  }

  if (failures) {
    console.error(`\n${failures} of ${checks} checks failed`);
    process.exit(1);
  }
  console.log(`${checks}/${checks} checks passed`);
})();
