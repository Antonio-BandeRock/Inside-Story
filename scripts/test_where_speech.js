// Checks lib/whereSpeech.ts: the spoken shapes Store Its Location and Where Is It teach.
const fs = require('fs');
const ts = require('typescript');
const source = fs.readFileSync(require.resolve('../lib/whereSpeech.ts'), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 } });
const t = {};
new Function('exports', outputText)(t);
let failed = 0;
function check(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { failed++; console.log('FAIL', name, 'got', JSON.stringify(got), 'want', JSON.stringify(want)); }
}
const store = [
  ['The bowling balls are in the hall closet.', 'Bowling balls', 'Hall closet'],
  ["John's fishing poles are in the garage.", "John's fishing poles", 'Garage'],
  ['John’s fishing poles are in the garage', "John's fishing poles", 'Garage'],
  ['The spare keys are under the doormat', 'Spare keys', 'Under the doormat'],
  ['The passports are kept in the top drawer of the desk', 'Passports', 'Top drawer of the desk'],
  ['I put the batteries in the kitchen drawer', 'Batteries', 'Kitchen drawer'],
  ['Remember that the tent is in the attic', 'Tent', 'Attic'],
  ['The Christmas lights are on top of the wardrobe', 'Christmas lights', 'On top of the wardrobe'],
  ['My winter coat is behind the bedroom door', 'Winter coat', 'Behind the bedroom door'],
  ['Tax papers in the filing cabinet', 'Tax papers', 'Filing cabinet'],
  ['The ladder is at the back of the shed', 'Ladder', 'At the back of the shed'],
];
for (const [said, what, place] of store) check('store: ' + said, t.parseStoreSentence(said), { what, place });
check('no place is nothing', t.parseStoreSentence('The bowling balls'), null);
check('empty is nothing', t.parseStoreSentence('   '), null);
const ask = [
  ['Where are the bowling balls?', 'bowling balls'],
  ['Where are the fishing poles?', 'fishing poles'],
  ["Where's my passport", 'passport'],
  ['Where did I put the spare keys?', 'spare keys'],
  ['where do we keep the ladder', 'ladder'],
  ['batteries', 'batteries'],
];
for (const [said, thing] of ask) check('ask: ' + said, t.parseWhereQuestion(said), thing);
check('answer one', t.describeSpokenAnswer('fishing poles', [{ what: "John's fishing poles", place: 'Garage', age: '3 days ago' }]), "John's fishing poles: Garage. Written down 3 days ago.");
check('answer several', t.describeSpokenAnswer('poles', [{ what: 'a', place: 'b', age: '' }, { what: 'c', place: 'd', age: '' }]), '2 things match poles. Pick the one you mean.');
check('answer none', t.describeSpokenAnswer('kayak', []), 'Nothing stored matches kayak. Store Its Location is where to say where it is.');
if (failed) { console.log(failed + ' failed'); process.exit(1); }
console.log('All where-speech checks passed');
