// Checks lib/captureSuggest.ts (C8, where a waiting capture note probably
// goes) against a set of labelled notes written the way people jot things
// down. Three kinds of label:
//   'shopping'            the place a person would sort it to
//   ['calendar','health'] either is a fair place for it
//   null                  unclear, so the app must say nothing
// The bar it must clear: when it suggests, the first suggestion is right at
// least 95% of the time, and it stays quiet on at least 90% of the unclear
// ones. Then it checks learning from past sorting, and the wording.
// Run: node scripts/test_capture_suggest.js
/* global __dirname */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const cache = {};
function load(rel) {
  const file = path.join(__dirname, '..', 'lib', `${rel}.ts`);
  if (cache[file]) return cache[file];
  const { outputText } = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const m = { exports: {} };
  cache[file] = m.exports;
  new Function('module', 'exports', 'require', outputText)(m, m.exports, (name) => {
    if (name.startsWith('./')) return load(name.slice(2));
    throw new Error(`lib/captureSuggest.ts must stay pure, asked for ${name}`);
  });
  cache[file] = m.exports;
  return m.exports;
}
const S = load('captureSuggest');

let pass = 0;
let fail = 0;
function check(name, ok, detail) {
  if (ok) pass++;
  else {
    fail++;
    console.log('FAIL', name, detail ?? '');
  }
}

const vocabulary = {
  growing: ['Tomatoes, cherry', 'Basil', 'Zucchini', 'Kale'],
  gardenAreas: ['Back bed', 'Herb spiral'],
  upkeep: ['Furnace filter', 'Car registration', 'Smoke alarms', 'Gutters'],
  bills: ['Netflix', 'Electricity', 'Car insurance', 'Spotify'],
  accounts: ['Visa'],
  meds: ['Levothyroxine', 'Vitamin D3', 'Selenium'],
  groceries: ['Eggs, whole, raw', 'Milk, whole', 'Oat milk', 'Bread, sourdough', 'Coffee', 'Bananas', 'Olive oil', 'Rice, brown'],
  kitchen: ['Salt', 'Water, tap', 'Flour', 'Honey'],
};

// ---------------------------------------------------------- labelled notes
const NOTES = [
  // To buy
  ['buy eggs', 'shopping'],
  ['Buy more coffee', 'shopping'],
  ['we are out of oat milk', 'shopping'],
  ['out of olive oil', 'shopping'],
  ['pick up bread', 'shopping'],
  ['grab bananas on the way home', 'shopping'],
  ['need eggs and milk', 'shopping'],
  ['running low on rice', 'shopping'],
  ['buy tomato seeds', 'shopping'],
  ['buy a new furnace filter', 'shopping'],
  ['buy birthday card for Sam', 'shopping'],
  ['need printer ink', 'shopping'],
  ['get dog food', 'shopping'],
  ['restock the first aid kit', 'shopping'],
  ['more honey', 'shopping'],
  ['ran out of salt', 'shopping'],
  ['low on flour', 'shopping'],
  ['remember to buy lightbulbs', 'shopping'],
  ['order more contact lenses', 'shopping'],
  ['pick up the prescription', ['shopping', 'health']],
  ['need to buy compost', ['shopping', 'garden']],
  ['eggs', 'shopping'],
  ['coffee beans', 'shopping'],
  ['oat milk', 'shopping'],
  ['2 dozen eggs', 'shopping'],
  ['Get batteries for the remote', 'shopping'],
  ['buy wrapping paper', 'shopping'],
  ['purchase new running shoes', 'shopping'],
  ['grab a bag of potting mix', ['shopping', 'garden']],
  ['don’t forget to buy cat litter', 'shopping'],
  // In the garden
  ['water the tomatoes', 'garden'],
  ['prune the roses', 'garden'],
  ['sow carrots in the back bed', 'garden'],
  ['harvest the zucchini before it gets huge', 'garden'],
  ['weed the herb spiral', 'garden'],
  ['mulch around the kale', 'garden'],
  ['transplant the basil seedlings', 'garden'],
  ['turn the compost', 'garden'],
  ['plant garlic before the frost', 'garden'],
  ['deadhead the marigolds', 'garden'],
  ['stake the tomatoes', 'garden'],
  ['slugs on the lettuce again', 'garden'],
  ['aphids on the kale', 'garden'],
  ['seedlings need hardening off', 'garden'],
  ['tomatoes are splitting', 'garden'],
  ['thin out the radishes', 'garden'],
  ['repot the chilli', 'garden'],
  ['mow the lawn', 'garden'],
  ['harden off the pepper seedlings', 'garden'],
  ['feed the tomatoes', 'garden'],
  ['basil is flowering', 'garden'],
  ['check the greenhouse vents', 'garden'],
  ['zucchini leaves have white powder', 'garden'],
  ['back bed needs more soil', 'garden'],
  ['cover the seedlings tonight, frost coming', 'garden'],
  // Upkeep
  ['replace the furnace filter', 'upkeep'],
  ['service the car', 'upkeep'],
  ['get the car serviced', 'upkeep'],
  ['clean the gutters', 'upkeep'],
  ['test the smoke alarms', 'upkeep'],
  ['fix the leaking tap', 'upkeep'],
  ['descale the kettle', 'upkeep'],
  ['change the sheets', 'upkeep'],
  ['renew the car registration', 'upkeep'],
  ['repair the fence', 'upkeep'],
  ['unblock the bathroom drain', 'upkeep'],
  ['dishwasher making a noise', 'upkeep'],
  ['the fridge is leaking', 'upkeep'],
  ['check the tyres', 'upkeep'],
  ['get the boiler looked at', 'upkeep'],
  ['smoke alarm beeping', 'upkeep'],
  ['clean the oven', 'upkeep'],
  ['defrost the freezer', 'upkeep'],
  ['furnace filter', 'upkeep'],
  ['gutters full of leaves', 'upkeep'],
  // Money
  ['pay the electricity bill', 'money'],
  ['cancel netflix', 'money'],
  ['cancel Spotify before the trial ends', 'money'],
  ['pay rent', 'money'],
  ['transfer money to savings', 'money'],
  ['chase the refund from the airline', 'money'],
  ['car insurance renewal went up', 'money'],
  ['Visa payment due', 'money'],
  ['Jo owes me $40', 'money'],
  ['invoice the client for March', 'money'],
  ['claim back the dental costs', 'money'],
  ['water bill', 'money'],
  ['tax return', 'money'],
  ['mortgage payment', 'money'],
  ['electricity bill looks high', 'money'],
  ['top up the bus card', 'money'],
  ['budget for Christmas', 'money'],
  ['bank charged me twice', 'money'],
  // Health
  ['mention the rash to the doctor', 'health'],
  ['ask the doctor about my knee', 'health'],
  ['tell the endo about the fatigue', 'health'],
  ['headache again after lunch', 'health'],
  ['bloated after the pasta', 'health'],
  ['dizzy when I stood up', 'health'],
  ['levothyroxine dose feels too low', 'health'],
  ['ask the pharmacist about selenium', 'health'],
  ['keep an eye on the mole on my arm', 'health'],
  ['joint pain worse this week', 'health'],
  ['brain fog all morning', 'health'],
  ['mention the palpitations', 'health'],
  ['heartburn at night', 'health'],
  ['side effects from the new meds?', 'health'],
  ['bring up the hair loss', 'health'],
  ['vitamin d3 making me nauseous?', 'health'],
  ['couldn’t sleep, insomnia again', 'health'],
  ['itchy rash on my wrist', 'health'],
  // On the calendar
  ['dentist Tuesday 3pm', 'calendar'],
  ['book a haircut', 'calendar'],
  ['Mum’s birthday June 5', 'calendar'],
  ['schedule the vet for Max', 'calendar'],
  ['parent evening Thursday', 'calendar'],
  ['make an appointment with the optician', 'calendar'],
  ['meeting with the bank next week', 'calendar'],
  ['dinner with Sara on Friday', 'calendar'],
  ['flight on the 14th', 'calendar'],
  ['book the physio', 'calendar'],
  ['reschedule the dentist', 'calendar'],
  ['anniversary 12 Oct', 'calendar'],
  ['RSVP to the wedding', 'calendar'],
  ['blood test Monday 8am', 'calendar'],
  ['school play tomorrow at 6', 'calendar'],
  ['interview Wednesday at 10:30', 'calendar'],
  ['cancel the dentist appointment', 'calendar'],
  // Where it is
  ['spare key is in the top drawer', 'place'],
  ['passport is in the filing cabinet', 'place'],
  ['the charger is behind the sofa', 'place'],
  ['put the warranty papers in the blue folder', 'place'],
  ['left my glasses in the car', 'place'],
  ['birth certificates are in the safe', 'place'],
  ['Christmas lights are in the loft', 'place'],
  ['the manual for the dryer is in the kitchen drawer', 'place'],
  ['stored the winter coats in the attic', 'place'],
  ['remote is under the cushion', 'place'],
  // Unclear: nothing should be said
  ['tomatoes', null],
  ['Sam', null],
  ['that thing Jo said', null],
  ['idea for the book', null],
  ['look into it', null],
  ['call mum', null],
  ['ring the plumber', null],
  ['email Pat back', null],
  ['the blue one', null],
  ['maybe try yoga', null],
  ['what was that song', null],
  ['ask Chris', null],
  ['sort out the spare room', null],
  ['Tuesday', null],
  ['check', null],
  ['podcast about octopuses', null],
  ['the car', null],
  ['learn Spanish', null],
  ['photos from the trip', null],
  ['finish the report', null],
  ['kids', null],
  ['movie recommendation from Ana', null],
  ['new recipe for soup', null],
  ['remember the thing', null],
  ['talk to Lee about the weekend', null],
  ['book club pick', null],
  ['hmm', null],
  ['more of that', null],
  ['cilantro or parsley', null],
  ['honey', ['shopping']],
];

const model = S.buildSuggestModel(vocabulary, []);
let spoke = 0;
let right = 0;
let rightEither = 0;
let quietWanted = 0;
let quietKept = 0;
let labelledSpoken = 0;
let labelled = 0;
const misses = [];
for (const [text, label] of NOTES) {
  const got = S.suggestDestinations(text, model);
  if (label === null) {
    quietWanted++;
    if (got.length === 0) quietKept++;
    else misses.push(`should be quiet: "${text}" -> ${got.map((g) => g.key).join('/')}`);
    continue;
  }
  const ok = Array.isArray(label) ? label : [label];
  labelled++;
  if (got.length === 0) continue;
  labelledSpoken++;
  spoke++;
  if (ok.includes(got[0].key)) right++;
  else misses.push(`wrong: "${text}" -> ${got.map((g) => g.key).join('/')} (wanted ${ok.join(' or ')})`);
  if (got.some((g) => ok.includes(g.key))) rightEither++;
}
const spokeOnQuiet = quietWanted - quietKept;
const allSpoke = spoke + spokeOnQuiet;
const precision = allSpoke ? right / allSpoke : 1;
const coverage = labelled ? labelledSpoken / labelled : 0;
console.log(`${NOTES.length} notes: ${labelled} with a place, ${quietWanted} unclear.`);
console.log(`Suggested on ${labelledSpoken} of ${labelled} with a place (${Math.round(coverage * 100)}%).`);
console.log(`Precision whenever it spoke, counting any word on an unclear note as wrong: ${right}/${allSpoke} = ${(precision * 100).toFixed(1)}% (first choice), ${rightEither + 0}/${allSpoke} with the second choice counted.`);
console.log(`Stayed quiet on ${quietKept} of ${quietWanted} unclear notes.`);
for (const miss of misses) console.log('  ', miss);
check('at least 150 notes', NOTES.length >= 150, NOTES.length);
check('precision at least 95%', precision >= 0.95, precision);
check('quiet on at least 90% of unclear notes', quietKept / quietWanted >= 0.9);
check('suggests on at least 70% of clear notes (otherwise it is no help)', coverage >= 0.7, coverage);

// ------------------------------------------------------------ held out
// Written after the rules above were tuned, and never tuned against, so the
// figure here is the one to trust. Its bar is lower on purpose: if a change
// only lifts the first set, this one says so.
const HELD_OUT = [
  ['buy sunscreen', 'shopping'],
  ['we need coffee filters', 'shopping'],
  ['pick up milk on the way back', 'shopping'],
  ['grab sourdough from the bakery', 'shopping'],
  ['out of toothpaste', 'shopping'],
  ['more bananas', 'shopping'],
  ['water the basil', 'garden'],
  ['sow lettuce in the herb spiral', 'garden'],
  ['prune the apple tree in winter', 'garden'],
  ['pick the kale before it bolts', 'garden'],
  ['compost heap too wet', 'garden'],
  ['weed between the onions', 'garden'],
  ['replace the wiper blades', 'upkeep'],
  ['service the lawnmower', 'upkeep'],
  ['clean the dryer vent', 'upkeep'],
  ['washing machine leaking again', 'upkeep'],
  ['fix the squeaky door', 'upkeep'],
  ['pay the car insurance', 'money'],
  ['cancel the gym membership', 'money'],
  ['chase Jo for the $25', 'money'],
  ['rent is going up in May', 'money'],
  ['pay the plumber', 'money'],
  ['ask the doctor about the selenium dose', 'health'],
  ['cramps after dinner', 'health'],
  ['mention the tingling in my feet', 'health'],
  ['tired all afternoon', 'health'],
  ['swollen ankles this morning', 'health'],
  ['book the dentist', 'calendar'],
  ['vet Friday 9am', 'calendar'],
  ['Dad’s birthday 3 March', 'calendar'],
  ['meeting with the school on Monday', 'calendar'],
  ['schedule the car inspection', ['calendar', 'upkeep']],
  ['the spare charger is in the hall cupboard', 'place'],
  ['put the tax papers in the green box', 'place'],
  ['my passport is in the desk drawer', 'place'],
  ['that article about sleep', null],
  ['Ana', null],
  ['something about the weekend', null],
  ['think about a holiday', null],
  ['call Jo', null],
  ['the long one', null],
  ['ask Sam about it', null],
];
let hSpoke = 0;
let hRight = 0;
let hLabelled = 0;
let hCovered = 0;
const hMisses = [];
for (const [text, label] of HELD_OUT) {
  const got = S.suggestDestinations(text, model);
  if (label !== null) hLabelled++;
  if (got.length === 0) {
    if (label !== null) hMisses.push(`quiet: "${text}"`);
    continue;
  }
  hSpoke++;
  const ok = label === null ? [] : Array.isArray(label) ? label : [label];
  if (label !== null) hCovered++;
  if (ok.includes(got[0].key)) hRight++;
  else hMisses.push(`wrong: "${text}" -> ${got.map((g) => g.key).join('/')} (wanted ${ok.join(' or ') || 'nothing'})`);
}
const hPrecision = hSpoke ? hRight / hSpoke : 1;
console.log(`\nHeld out, ${HELD_OUT.length} notes never tuned against: right ${hRight}/${hSpoke} when it spoke (${(hPrecision * 100).toFixed(1)}%), suggested on ${hCovered} of ${hLabelled} with a place.`);
for (const miss of hMisses) console.log('  ', miss);
check('held out: precision at least 90%', hPrecision >= 0.9, hPrecision);

// -------------------------------------------------------------- the reasons
function first(text, m = model) {
  return S.suggestDestinations(text, m)[0];
}
check('personal record named first', first('buy eggs').reason === 'You have put eggs on the grocery list before.', first('buy eggs').reason);
check('line reads as a question and a reason', S.suggestionLine(first('buy eggs')) === 'To buy? You have put eggs on the grocery list before.');
check('growing crop reason', /You have tomatoes growing in your garden\./.test(first('stake the tomatoes').reason), first('stake the tomatoes').reason);
check('upkeep record reason', first('furnace filter').reason === '“Furnace filter” is on your Upkeep list.');
check('bill reason', first('cancel netflix').reason === '“Netflix” is one of your regular payments.');
check('med reason', /Levothyroxine/.test(first('levothyroxine dose feels too low').reason));
check('place reason', first('spare key is in the top drawer').reason === 'It says where something is.');
check('lead reason when nothing personal', first('buy wrapping paper').reason === 'It starts with “buy”.', first('buy wrapping paper').reason);

// ------------------------------------------------------ never a thought, unless taught
check('never suggests Just a thought untaught', NOTES.every(([text]) => !S.suggestDestinations(text, model).some((g) => g.key === 'thought')));

// ------------------------------------------------------ learning from sorting
const past = [
  { text: 'ring Dave about the fence', destination: 'upkeep' },
  { text: 'Dave coming Thursday for the fence', destination: 'upkeep' },
  { text: 'call Dave re gate', destination: 'upkeep' },
  { text: 'idea for the book', destination: 'thought' },
  { text: 'book chapter about grandma', destination: 'thought' },
  { text: 'chapter outline', destination: 'thought' },
];
const taught = S.buildSuggestModel(vocabulary, past);
const dave = S.suggestDestinations('text Dave about the shed', taught);
check('learned word leads to the place it always went', dave[0]?.key === 'upkeep', JSON.stringify(dave));
check('learned reason names the word', /“dave” to Upkeep/.test(dave[0]?.reason ?? ''), dave[0]?.reason);
const again = S.suggestDestinations('Idea for the book', taught);
check('exact repeat suggests where it went last time', again[0]?.key === 'thought' && /same words/.test(again[0].reason), JSON.stringify(again));
check('untaught, the same note is quiet', S.suggestDestinations('Idea for the book', model).length === 0);
// One sorting is not a habit.
const once = S.buildSuggestModel(vocabulary, [{ text: 'Pat and the kayak', destination: 'upkeep' }]);
check('a word seen once teaches nothing', S.suggestDestinations('Pat kayak trip', once).length === 0);
// Split habits teach nothing.
const split = S.buildSuggestModel(vocabulary, [
  { text: 'Lee lunch', destination: 'calendar' },
  { text: 'Lee owes me', destination: 'money' },
  { text: 'Lee birthday gift', destination: 'shopping' },
]);
check('a word sorted three ways teaches nothing', !S.suggestDestinations('Lee again', split).length);
// A correction wins: the same words moved later go to the new place.
const moved = S.buildSuggestModel(vocabulary, [
  { text: 'kayak', destination: 'garden' },
  { text: 'kayak', destination: 'upkeep' },
]);
check('the latest sorting of the same words wins', S.suggestDestinations('kayak', moved)[0]?.key === 'upkeep');

// ------------------------------------------------------ leave one out
const loo = S.leaveOneOut(vocabulary, [
  { text: 'buy eggs', destination: 'shopping' },
  { text: 'prune the roses', destination: 'garden' },
  { text: 'Sam', destination: 'thought' },
  { text: 'pay rent', destination: 'money' },
  { text: 'buy compost', destination: 'garden' },
]);
check('leave one out counts every note', loo.checked === 5 && loo.matched + loo.matchedSecond + loo.wrong + loo.quiet === 5, JSON.stringify(loo));
check('leave one out: quiet on the unclear one', loo.quiet >= 1);
const described = S.describeLeaveOneOut(loo);
check('leave one out is said in words', /checked against your 5 sorted notes/.test(described), described);
check('nothing to check says so', /no sorted notes yet/.test(S.describeLeaveOneOut(S.leaveOneOut(vocabulary, []))));

// ------------------------------------------------------ words
check('singular tomatoes', S.singular('tomatoes') === 'tomato');
check('singular berries', S.singular('berries') === 'berry');
check('singular glass kept', S.singular('glass') === 'glass');
check('record words need all present', S.suggestDestinations('milk', model).every((g) => !/Oat milk/.test(g.reason)));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
