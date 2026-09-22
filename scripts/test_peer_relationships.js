// Checks lib/peerRelationships.ts, the allowlist that says what may cross
// between two PEOPLE (2026-09-22, direct instruction: "the communication
// flow as per what is being done between the user's devices needs to be the
// same kind of process that happens between partners, and their children,
// and where applicable, their care giver").
//
// This file is the security surface of that feature, so the checks here are
// about what CANNOT happen rather than about what can:
//
//  1. No relationship carries a table this app holds somebody's health in,
//     unless it is an area where one person acts on another's behalf.
//  2. Nothing that is not ready carries a table at all, whatever the role
//     and whatever the permissions.
//  3. A permission switched off carries nothing for that area, and no
//     combination of switches lets an area through the side door.
//  4. Every column marked as staying here names something.
//  5. The four roles are all described, and the ones that cannot be set up
//     yet say what they are waiting on rather than going quiet.
//
// Run with: node scripts/test_peer_relationships.js
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

const rel = load('lib/peerRelationships.ts');

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
  check(
    JSON.stringify(actual) === JSON.stringify(expected),
    label + ' (got ' + JSON.stringify(actual) + ', wanted ' + JSON.stringify(expected) + ')',
  );
}

const ROLES = ['recipe', 'partner', 'child', 'caregiver'];

// Every combination of the three permission switches, since a rule that
// holds for all on and all off can still have a gap in the middle.
const GRANT_SETS = [];
for (const meals of [true, false]) {
  for (const shopping of [true, false]) {
    for (const conditions of [true, false]) {
      GRANT_SETS.push({ meals, shopping, conditions });
    }
  }
}

// 1. Nothing anybody's health is kept in crosses, on any role, under any
// combination of permissions, as things stand today.
for (const role of ROLES) {
  for (const grants of GRANT_SETS) {
    const tables = rel.tableNamesThatCross(role, grants);
    const leaked = tables.filter((table) => rel.PERSONAL_HEALTH_TABLES.includes(table));
    same(leaked, [], 'nothing health is kept in crosses to a ' + role + ' at ' + JSON.stringify(grants));
  }
}

// The durable half of the same rule, which is what has to hold once the
// areas somebody tends for another person are built: a health table may
// only ever be reached through one of those, never through an area both
// sides edit as theirs.
for (const role of ROLES) {
  const relationship = rel.relationshipFor(role);
  for (const code of [...relationship.shared, ...relationship.theirs]) {
    const area = rel.PEER_AREAS.find((found) => found.code === code);
    const leaked = area.tables
      .map((table) => table.table)
      .filter((table) => rel.PERSONAL_HEALTH_TABLES.includes(table));
    same(leaked, [], 'a ' + role + ' link holds no health table as ' + code + ', which both sides could edit');
  }
}

// 2. An area that is not ready carries nothing, and says what it waits on.
const ALL = { meals: true, shopping: true, conditions: true };
for (const area of rel.PEER_AREAS) {
  if (area.ready) continue;
  for (const role of ROLES) {
    const tables = rel.tableNamesThatCross(role, ALL);
    const carried = area.tables.map((table) => table.table).filter((table) => tables.includes(table));
    same(carried, [], area.code + ' is not ready, so it carries nothing to a ' + role);
  }
  check(typeof area.waitingOn === 'string' && area.waitingOn.length > 0, area.code + ' says what it is waiting on');
}

// 3. A permission switched off carries nothing for that area.
check(rel.tableNamesThatCross('partner', ALL).includes('grocery_lists'), 'with shopping on, a partner shares the list');
same(
  rel.tableNamesThatCross('partner', { ...ALL, shopping: false }),
  [],
  'with shopping off, a partner shares no list at all',
);
check(
  !rel.areasTheyOwn('partner', { ...ALL, conditions: false }).includes('conditions'),
  'with conditions off, their condition list is not kept either',
);

// A recipe link carries nothing, whatever the switches say, since those
// switches belong to a relationship it is not in.
for (const grants of GRANT_SETS) {
  same(rel.tableNamesThatCross('recipe', grants), [], 'a recipe link carries nothing at ' + JSON.stringify(grants));
  same(rel.areasThatMerge('recipe', grants), [], 'and nothing merges on it either');
}

// 4. A column that stays here names something.
for (const area of rel.PEER_AREAS) {
  for (const table of area.tables) {
    for (const column of table.keepsHome) {
      check(typeof column === 'string' && column.length > 0, area.code + ': ' + table.table + ' names its kept column');
    }
  }
}
const home = rel.columnsThatStayHome('partner', ALL);
same(home.grocery_list_items, ['note', 'scanned_product_id'], 'a note and a scanned product stay on this phone');
check(!('grocery_lists' in home), 'a table with nothing to keep back is not listed');

// 5. All four roles are described, and the ones that cannot be set up say so.
same(rel.RELATIONSHIPS.map((entry) => entry.role), ROLES, 'all four relationships are described');
for (const role of ROLES) {
  const relationship = rel.relationshipFor(role);
  check(relationship.label.length > 0 && relationship.what.length > 0, role + ' reads as something a person would say');
  if (!relationship.linkable) {
    check(rel.whatIsWaiting(role).length > 0, role + ' cannot be set up yet and says what it is waiting on');
  }
}

// Which links talk on their own. A recipe link does not; the other three
// do, which is the whole of what the instruction asked for.
check(rel.talksAutomatically('recipe') === false, 'a recipe link keeps nothing in step by itself');
for (const role of ['partner', 'child', 'caregiver']) {
  check(rel.talksAutomatically(role) === true, 'a ' + role + ' link keeps something in step by itself');
}

// How each area is held, which is what decides whether it merges or is
// kept as a copy. Getting this backwards would have a copy overwrite a
// merge, and somebody's ticked off line would come back.
same(rel.holdOn('partner', 'shopping'), 'shared', 'a shopping list is one thing between two people');
same(rel.holdOn('partner', 'meals'), 'theirs', 'their meal plan stays theirs, kept here as a copy');
same(rel.holdOn('caregiver', 'meds'), 'onTheirBehalf', 'medicines on a caregiver link are recorded for somebody else');
same(rel.holdOn('partner', 'meds'), null, 'a partner link does not carry medicines at all');
same(rel.holdOn('recipe', 'shopping'), null, 'a recipe link holds no area at all');

// What merges, in words. Read by a person, so it is held to the house rules.
const said = [
  rel.describeWhatMerges('partner', ALL, 'Sarah'),
  rel.describeWhatMerges('partner', { meals: false, shopping: false, conditions: false }, 'Sarah'),
  rel.describeWhatMerges('recipe', ALL, 'Sarah'),
  ...rel.whatIsWaiting('caregiver'),
];
for (const sentence of said) {
  check(!/\s--\s|—|–/.test(sentence), 'no dashes standing in for punctuation: ' + sentence);
  check(!/\b(real|genuine|genuinely)\b/i.test(sentence), 'no filler words: ' + sentence);
}
for (const sentence of said.slice(0, 3)) {
  check(sentence.includes('Sarah'), 'what merges is said by name: ' + sentence);
}
check(
  said[0].includes('nothing either of you did is thrown away'),
  'a link that merges says plainly that nothing is thrown away',
);
check(said[1].includes('turned it all off'), 'a link with everything switched off says why nothing is happening');
check(said[2].includes('send each other a dish'), 'a recipe link says what it can still do');

// How a link is said about somebody, which a log line, a notice and a
// Connections row all read from.
same(rel.howYouAreLinked('partner'), 'your partner', 'a partner is said as yours');
same(rel.howYouAreLinked('child'), 'your child', 'a child is said as yours');
same(rel.howYouAreLinked('caregiver'), 'someone who helps you', 'somebody who helps is said as that');
same(rel.howYouAreLinked('recipe'), 'someone you send dishes to', 'and a recipe link is said as what it is');
for (const role of ROLES) {
  const phrase = rel.howYouAreLinked(role);
  check(phrase === phrase.toLowerCase(), role + ' reads mid sentence, after a name and a comma');
}

console.log((failures === 0 ? 'PASS' : 'FAIL') + ': ' + (checks - failures) + '/' + checks + ' checks');
process.exit(failures === 0 ? 0 : 1);
