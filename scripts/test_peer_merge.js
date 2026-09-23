// Checks lib/peerMerge.ts, which brings two PEOPLE's copies of a shared
// thing together (2026-09-22, direct instruction: "the communication flow
// as per what is being done between the user's devices needs to be the same
// kind of process that happens between partners, and their children, and
// where applicable, their care giver").
//
// The engine underneath is the one two devices already use, and
// scripts/test_snapshot_merge.js holds that. What is checked here is the two
// things added on top of it, both of which are the allowlist:
//
//  1. Whole tables. Only what the relationship carries is sent, merged or
//     written back, and anything else that arrives is named rather than
//     quietly dropped or quietly kept.
//  2. Single columns. A note somebody wrote to themselves is stripped on the
//     way out and put back from this device on the way in, so a row taken
//     from the other side cannot blank something they were never given.
//
// Then the words: what a merge did, who did it, and what was left out.
//
// Run with: node scripts/test_peer_merge.js
// Exits non-zero on any failure.

/* global __dirname */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const loaded = new Map();
function load(relPath) {
  if (loaded.has(relPath)) return loaded.get(relPath);
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  loaded.set(relPath, module.exports);
  // The three modules this one reaches for are all decision modules with no
  // I/O of their own, so they are loaded for real rather than stubbed: a
  // stub of the allowlist would be a test of the stub.
  const allowed = {
    './peerRelationships': 'lib/peerRelationships.ts',
    './snapshotMerge': 'lib/snapshotMerge.ts',
    './snapshotSync': 'lib/snapshotSync.ts',
  };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    if (name in allowed) return load(allowed[name]);
    throw new Error(relPath + ' asked for an unexpected module (' + name + ')');
  });
  loaded.set(relPath, module.exports);
  return module.exports;
}

const peer = load('lib/peerMerge.ts');

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

const ALL = { meals: true, shopping: true, conditions: true };
const PARTNER = { role: 'partner', grants: ALL };
const shapes = { grocery_lists: { key: ['id'] }, grocery_list_items: { key: ['id'] } };
const options = { ...PARTNER, shapes, laterSide: 'there' };

function item(over) {
  return {
    id: 'i1',
    list_id: 'l1',
    category: 'Produce',
    food_name: 'Carrots',
    unit: 'g',
    quantity: 500,
    checked: 0,
    checked_at: null,
    note: null,
    scanned_product_id: null,
    updated_at: '2026-09-22T09:00:00.000Z',
    ...over,
  };
}

// 1. WHAT GOES OUT.
const here = {
  grocery_lists: [{ id: 'l1', name: 'This week', start_date: '2026-09-22', days_ahead: 7, people_count: 2 }],
  grocery_list_items: [item({ note: 'the small ones', scanned_product_id: 44 })],
  // Never carried by a partner link, and here to prove it stays put.
  symptom_assessments: [{ id: 's1', score: 8 }],
  lab_results: [{ id: 'r1', value: 1.2 }],
};

const sent = peer.tablesToSend(here, PARTNER);
same(Object.keys(sent).sort(), ['grocery_list_items', 'grocery_lists'], 'only what the link carries is sent');
check(!('note' in sent.grocery_list_items[0]), 'a note somebody wrote to themselves does not leave this device');
check(!('scanned_product_id' in sent.grocery_list_items[0]), 'and neither does a row number that means nothing there');
check(sent.grocery_list_items[0].food_name === 'Carrots', 'while the rest of the row goes');
check(!JSON.stringify(sent).includes('the small ones'), 'the note is not in the bytes that go out');
check(!JSON.stringify(sent).includes('s1'), 'nothing from a health table is in the bytes that go out');

same(peer.tablesToSend(here, { role: 'recipe', grants: ALL }), {}, 'a recipe link sends nothing at all');
same(
  peer.tablesToSend(here, { role: 'partner', grants: { ...ALL, shopping: false } }),
  {},
  'shopping switched off sends nothing at all',
);
same(peer.tablesToSend({}, PARTNER), {}, 'a table nobody has yet is not invented');
check(
  peer.tablesToSend(here, PARTNER).grocery_list_items !== here.grocery_list_items,
  'what goes out is a copy, so nothing is taken off the rows on this device',
);
check(here.grocery_list_items[0].note === 'the small ones', 'and the note is still here afterwards');

// 2. WHAT ARRIVES OUTSIDE THE LINK IS NAMED.
same(
  peer.refusedTables({ grocery_lists: [], lab_results: [], symptom_assessments: [] }, PARTNER),
  ['lab_results', 'symptom_assessments'],
  'anything outside what the link carries is named, in a settled order',
);
same(peer.refusedTables({ grocery_lists: [] }, PARTNER), [], 'and nothing is named when it all belongs');

// 3. THE MERGE ITSELF.
// A line ticked off on their phone, with a note written on this one. The
// tick crosses; the note stays.
const base = {
  grocery_lists: [{ id: 'l1', name: 'This week' }],
  grocery_list_items: [item({ note: null, scanned_product_id: null })],
};
const mine = {
  grocery_lists: [{ id: 'l1', name: 'This week' }],
  grocery_list_items: [item({ note: 'the small ones', scanned_product_id: 44 })],
};
const theirs = {
  grocery_lists: [{ id: 'l1', name: 'This week' }],
  grocery_list_items: [item({ checked: 1, checked_at: '2026-09-22T10:00:00.000Z', updated_at: '2026-09-22T10:00:00.000Z' })],
};

const merged = peer.mergePeerTables(base, mine, theirs, options);
const line = merged.tables.grocery_list_items[0];
check(line.checked === 1, 'a line they ticked off is ticked off here too');
check(line.note === 'the small ones', 'and the note underneath it survives, read back from this device');
check(line.scanned_product_id === 44, 'as does the scanned product it was matched to');
check(merged.entries.length > 0, 'and the change is written down');
same(merged.refused, [], 'with nothing refused, since they sent only what the link carries');

// A line they added arrives, with nothing to put back underneath it.
const added = peer.mergePeerTables(
  base,
  mine,
  {
    grocery_lists: theirs.grocery_lists,
    grocery_list_items: [...theirs.grocery_list_items, item({ id: 'i2', food_name: 'Leeks' })],
  },
  options,
);
const leeks = added.tables.grocery_list_items.find((row) => row.id === 'i2');
check(leeks !== undefined, 'a line they added arrives');
check(leeks.note === undefined || leeks.note === null, 'and carries no note, since they were never given one');

// A line one of them removed goes, which is the whole reason the agreed
// copy is kept: without it a removal reads as an addition and comes back.
const removed = peer.mergePeerTables(
  base,
  mine,
  { grocery_lists: theirs.grocery_lists, grocery_list_items: [] },
  options,
);
same(removed.tables.grocery_list_items, [], 'a line they took off the list goes here too');

// With no agreed copy at all, both sides are kept: two lists that were
// never one cannot be read as changes, and keeping both loses nothing.
const fresh = peer.mergePeerTables(
  null,
  { grocery_list_items: [item({ id: 'a' })] },
  { grocery_list_items: [item({ id: 'b' })] },
  options,
);
same(
  fresh.tables.grocery_list_items.map((row) => row.id).sort(),
  ['a', 'b'],
  'with nothing agreed yet, both sides are kept',
);

// Nothing outside the link can be written back, however it arrived.
const smuggled = peer.mergePeerTables(
  base,
  mine,
  { ...theirs, symptom_assessments: [{ id: 's9', score: 9 }] },
  options,
);
check(!('symptom_assessments' in smuggled.tables), 'a health table that arrives is never written back');
same(smuggled.refused, ['symptom_assessments'], 'it is named instead');
check(
  !Object.keys(smuggled.tables).some((table) => !['grocery_lists', 'grocery_list_items'].includes(table)),
  'and nothing else got through with it',
);

// A link that carries nothing merges nothing, whatever arrives.
const nothing = peer.mergePeerTables(base, mine, theirs, { ...options, role: 'recipe' });
same(nothing.tables, {}, 'a recipe link merges nothing');
same(nothing.entries, [], 'and writes nothing down');

// WHAT THAT PERSON IS RECORDED AS HOLDING, for the next merge. What
// arrived, never what the merge made of it: they have not been handed the
// merged copy yet, and writing it down as though they had turns a line
// added here into a line they deleted.
check(
  merged.incoming.grocery_list_items[0].checked === 1,
  'what arrived from them comes back for the caller to keep',
);
check(
  !('note' in merged.incoming.grocery_list_items[0]),
  'with what stays on this device left out of it, the way it was left out of the merge',
);
check(
  !('symptom_assessments' in smuggled.incoming),
  'and with nothing the link does not carry recorded against them either',
);
const hereAdded = peer.mergePeerTables(
  merged.incoming,
  {
    grocery_lists: mine.grocery_lists,
    grocery_list_items: [merged.tables.grocery_list_items[0], item({ id: 'i3', food_name: 'Chard' })],
  },
  theirs,
  options,
);
check(
  hereAdded.tables.grocery_list_items.some((row) => row.id === 'i3'),
  'so a line added here survives the next copy they send from before they saw it',
);

// 4. WHAT IT SAYS AFTERWARDS.
const words = (table) =>
  ({
    grocery_lists: { one: 'shopping list', many: 'shopping lists', counts: true },
    grocery_list_items: { one: 'thing to buy', many: 'things to buy', counts: true },
  })[table] ?? null;

function entries(list) {
  return { tables: {}, entries: list, refused: [] };
}
const changed = (key, side, conflict) =>
  conflict === undefined
    ? { table: 'grocery_list_items', key, kind: 'changed', side }
    : { table: 'grocery_list_items', key, kind: 'changed', side, conflict };
const addedItem = (key, side) => ({ table: 'grocery_list_items', key, kind: 'added', side });

check(peer.peerMergeNotice(entries([]), words, 'Sarah') === null, 'a merge that moved nothing says nothing');

const bothWays = peer.peerMergeNotice(
  entries([addedItem('a', 'there'), addedItem('b', 'there'), changed('c', 'here')]),
  words,
  'Sarah',
);
check(bothWays.startsWith('Brought together with Sarah.'), 'the notice says who it was with');
check(bothWays.includes('What Sarah changed: 2 more things to buy.'), 'what they did is said, by name');
check(bothWays.includes('What you changed: edits to things to buy.'), 'and what you did is said too');

const oneClash = peer.peerMergeNotice(entries([changed('a', 'there', 'later')]), words, 'Sarah');
check(oneClash.includes('One record you had both changed'), 'one record you both changed reads in the singular');
check(oneClash.includes('it is in the log'), 'and points at the log');
const twoClashes = peer.peerMergeNotice(
  entries([changed('a', 'there', 'later'), changed('b', 'there', 'later')]),
  words,
  'Sarah',
);
check(twoClashes.includes('2 records you had both changed'), 'several read in the plural');

// A table nobody has words for is passed over rather than guessed at, the
// same rule the device notices follow.
check(
  peer.peerMergeNotice(entries([{ table: 'something_new', key: 'x', kind: 'added', side: 'there' }]), words, 'Sarah') ===
    null,
  'a table nobody has words for is left unsaid',
);

// What was left out, said rather than swallowed.
check(peer.refusedNotice([], 'Sarah') === null, 'nothing refused says nothing');
const oneRefused = peer.refusedNotice(['lab_results'], 'Sarah');
check(oneRefused.startsWith('One kind of record arrived from Sarah'), 'one kind refused reads in the singular');
check(oneRefused.includes('it was left out'), 'and says plainly what happened to it');
const manyRefused = peer.refusedNotice(['lab_results', 'symptom_assessments'], 'Sarah');
check(manyRefused.startsWith('2 kinds of record arrived from Sarah'), 'several read in the plural');
check(manyRefused.includes('they were left out'), 'and agree with the verb');

// 5. Everything a person reads is held to the house rules.
for (const sentence of [bothWays, oneClash, twoClashes, oneRefused, manyRefused]) {
  check(!/\s--\s|—|–/.test(sentence), 'no dashes standing in for punctuation: ' + sentence);
  check(!/\b(real|genuine|genuinely)\b/i.test(sentence), 'no filler words: ' + sentence);
  check(!/\b(\w+)'s own\b/.test(sentence), 'no redundant own: ' + sentence);
}

// How many a notice will say before it stops counting, which is the same
// number the device notices stop at.
check(peer.MOST_MERGES_SAID === 4, 'a notice says at most four things before it sums up');

console.log((failures === 0 ? 'PASS' : 'FAIL') + ': ' + (checks - failures) + '/' + checks + ' checks');
process.exit(failures === 0 ? 0 : 1);
