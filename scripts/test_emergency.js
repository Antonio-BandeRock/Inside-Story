// Runs lib/emergency.ts: what someone else needs to know when you cannot tell them.
//
// Built 2026-09-05. The risks here are unlike the rest of this project's, because
// the output is text a clinician may act on within minutes.
//
//  1. THE DANGEROUS EMPTY LINE. A card printing "Drug allergies: none recorded"
//     reads as "no allergies" to someone scanning it in a hurry. Absent fields
//     must be ABSENT, not printed as blanks. Several checks below exist purely to
//     confirm nothing is printed for a field nobody filled in.
//  2. Staleness has to travel WITH the card, not sit beside it on the screen,
//     because the card is the thing that gets handed over.
//  3. Nothing is inferred. A food allergy is not a drug allergy, and a check
//     confirms one never reaches the drug allergy line.
//  4. The gap list is ranked by what actually matters, not by field order, and
//     the ordering is asserted rather than assumed.
//  5. Nothing asserts what a directive means or does. Same jurisdiction rule the
//     Work and Upkeep areas already hold.
//
// Run with: node scripts/test_emergency.js
// Exits non-zero on any failure.

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function loadModule(relPath) {
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  // eslint-disable-next-line no-new-func
  new Function('exports', 'module', 'require', outputText)(module.exports, module, () => {
    throw new Error('unexpected import');
  });
  return module.exports;
}

const E = loadModule('lib/emergency.ts');
const {
  NOT_A_MEDICAL_ALERT, DIRECTIVE_NOTE,
  CONFIRM_WITHIN_DAYS, freshness, describeFreshness,
  ESSENTIALS_IN_ORDER, missingEssentials, describeMissing,
  buildEmergencyCard,
} = E;

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

const TODAY = '2026-09-05';

const emptyProfile = () => ({
  drugAllergies: null,
  bloodType: null,
  devices: null,
  doctorName: null,
  doctorPhone: null,
  preferredHospital: null,
  language: null,
  directiveLocation: null,
  otherNotes: null,
  confirmedAt: null,
});

const emptyApp = () => ({
  displayName: null,
  conditions: [],
  medications: [],
  foodAllergies: [],
});

// ---------------------------------------------------------------------------
// 1. Freshness. A card is only as good as how recently someone checked it.
// ---------------------------------------------------------------------------

{
  const never = freshness(null, TODAY);
  checkTrue('never confirmed is flagged as such', never.neverConfirmed);
  checkTrue('and counts as stale, since unchecked is not the same as fresh', never.stale);
  check('with no day count to give', never.daysSince, null);
  checkTrue('the wording says it has never been checked',
    /[Nn]ever confirmed/.test(describeFreshness(never)));

  const today = freshness(TODAY, TODAY);
  check('confirmed today is zero days old', today.daysSince, 0);
  checkFalse('and is not stale', today.stale);
  check('and says so plainly', describeFreshness(today), 'Confirmed today.');

  const oneDay = freshness('2026-09-04', TODAY);
  check('a single day is singular', describeFreshness(oneDay), 'Confirmed 1 day ago.');
  const twoDays = freshness('2026-09-03', TODAY);
  check('more than one is plural', describeFreshness(twoDays), 'Confirmed 2 days ago.');

  // The boundary itself, both sides, because an off-by-one here means someone
  // is either nagged a day early or trusted a day too long.
  const exactly = freshness('2026-06-07', TODAY); // 90 days
  check('the boundary is exactly the stated window', exactly.daysSince, CONFIRM_WITHIN_DAYS);
  checkFalse('and on the boundary itself it is still fresh', exactly.stale);

  const justPast = freshness('2026-06-06', TODAY); // 91 days
  check('one day past the window', justPast.daysSince, CONFIRM_WITHIN_DAYS + 1);
  checkTrue('is stale', justPast.stale);

  const old = freshness('2026-03-05', TODAY);
  checkTrue('a stale reading is given in months, since a day count that large is noise',
    /about 6 months ago/.test(describeFreshness(old)));
  checkTrue('and it names the reason it matters, which is that medications change',
    /[Mm]edications change/.test(describeFreshness(old)));

  const oneMonth = freshness('2026-06-04', TODAY); // 93 days, rounds to 3
  checkTrue('a stale reading in months is plural where it should be',
    /about 3 months ago/.test(describeFreshness(oneMonth)));

  // A date that cannot be parsed must not silently become fresh.
  const broken = freshness('not-a-date', TODAY);
  check('an unreadable date gives no day count', broken.daysSince, null);
  checkTrue('and is treated as stale rather than assumed fine', broken.stale);
  checkFalse('but is not reported as never confirmed, since something was recorded',
    broken.neverConfirmed);
  checkTrue('and the wording says it cannot be read',
    /cannot be read/.test(describeFreshness(broken)));

  // A timestamp rather than a plain date, which is what the database will hold.
  const stamped = freshness('2026-09-01T14:22:09.000Z', TODAY);
  check('a full timestamp is read down to its date', stamped.daysSince, 4);
}

// ---------------------------------------------------------------------------
// 2. The gap list, and its ordering. Drug allergies lead because nothing else
//    in the app records them and nothing else changes a decision as fast.
// ---------------------------------------------------------------------------

{
  check('drug allergies lead the list', ESSENTIALS_IN_ORDER[0].code, 'drugAllergies');
  check('someone to call is second', ESSENTIALS_IN_ORDER[1].code, 'contact');
  check('blood type is last, and honestly the least useful of them',
    ESSENTIALS_IN_ORDER[ESSENTIALS_IN_ORDER.length - 1].code, 'bloodType');
  checkTrue('the blood type entry says why it is last rather than just being last',
    /crossmatch/i.test(ESSENTIALS_IN_ORDER[ESSENTIALS_IN_ORDER.length - 1].why));
  checkTrue('every entry explains itself, since a bare checklist teaches nothing',
    ESSENTIALS_IN_ORDER.every((entry) => entry.why.length > 30));
  check('no entry code is duplicated',
    new Set(ESSENTIALS_IN_ORDER.map((e) => e.code)).size, ESSENTIALS_IN_ORDER.length);

  const allMissing = missingEssentials({
    profile: emptyProfile(), fromApp: emptyApp(), contactCount: 0,
  });
  check('an untouched profile is missing everything', allMissing.length, ESSENTIALS_IN_ORDER.length);
  check('and drug allergies are named first', allMissing[0].code, 'drugAllergies');
  checkTrue('the summary names the first gap rather than a count alone',
    /Drug allergies/.test(describeMissing(allMissing)));
  checkTrue('and says how many others there are',
    /8 other things are empty/.test(describeMissing(allMissing)));

  // Filling in the two that matter most changes what leads.
  const partly = missingEssentials({
    profile: { ...emptyProfile(), drugAllergies: 'Penicillin' },
    fromApp: emptyApp(),
    contactCount: 1,
  });
  check('filling the top two drops them both', partly.length, ESSENTIALS_IN_ORDER.length - 2);
  check('and the next thing named is what comes after them', partly[0].code, 'medications');

  // Whitespace is not an answer. Someone who typed a space into a field has
  // not recorded a drug allergy.
  const blank = missingEssentials({
    profile: { ...emptyProfile(), drugAllergies: '   ' },
    fromApp: emptyApp(),
    contactCount: 0,
  });
  check('whitespace does not count as filled in', blank[0].code, 'drugAllergies');

  // A doctor counts as recorded from either half, since a name with no number
  // is still someone a hospital can look up.
  const nameOnly = missingEssentials({
    profile: { ...emptyProfile(), doctorName: 'Dr Alvarez' },
    fromApp: emptyApp(),
    contactCount: 0,
  });
  checkFalse('a doctor name alone counts', nameOnly.some((g) => g.code === 'doctor'));
  const phoneOnly = missingEssentials({
    profile: { ...emptyProfile(), doctorPhone: '555-0134' },
    fromApp: emptyApp(),
    contactCount: 0,
  });
  checkFalse('a doctor number alone counts too', phoneOnly.some((g) => g.code === 'doctor'));

  // The two that come from elsewhere in the app, so they should never be asked
  // for twice.
  const fromApp = missingEssentials({
    profile: emptyProfile(),
    fromApp: {
      ...emptyApp(),
      conditions: ["Hashimoto's Thyroiditis"],
      medications: [{ name: 'Levothyroxine', dose: '75 mcg' }],
    },
    contactCount: 0,
  });
  checkFalse('conditions already held count as present', fromApp.some((g) => g.code === 'conditions'));
  checkFalse('and so do active medications', fromApp.some((g) => g.code === 'medications'));

  // A food allergy is not a drug allergy. This is the check that would catch
  // anyone trying to be helpful by carrying one across.
  const foodOnly = missingEssentials({
    profile: emptyProfile(),
    fromApp: { ...emptyApp(), foodAllergies: ['Shellfish', 'Peanut'] },
    contactCount: 0,
  });
  checkTrue('a food allergy does not stand in for a drug allergy',
    foodOnly.some((g) => g.code === 'drugAllergies'));

  const nothingMissing = missingEssentials({
    profile: {
      drugAllergies: 'Penicillin, sulfa',
      bloodType: 'O+',
      devices: 'Insulin pump, left abdomen',
      doctorName: 'Dr Alvarez',
      doctorPhone: '555-0134',
      preferredHospital: 'San Javier',
      language: 'English, some Spanish',
      directiveLocation: 'Filing cabinet, top drawer',
      otherNotes: null,
      confirmedAt: TODAY,
    },
    fromApp: {
      displayName: 'Lisa',
      conditions: ["Hashimoto's Thyroiditis"],
      medications: [{ name: 'Levothyroxine', dose: '75 mcg' }],
      foodAllergies: [],
    },
    contactCount: 2,
  });
  check('a complete profile has no gaps', nothingMissing.length, 0);
  checkTrue('and the wording does not then claim the card is correct, only filled in',
    /still right is a different question/.test(describeMissing(nothingMissing)));
  checkFalse('so it never says the card is up to date',
    /up to date|accurate|verified/i.test(describeMissing(nothingMissing)));
}

// ---------------------------------------------------------------------------
// 3. The card. This is the part that gets handed to a stranger.
// ---------------------------------------------------------------------------

{
  const card = buildEmergencyCard({
    profile: {
      drugAllergies: 'Penicillin (anaphylaxis), sulfa drugs (rash)',
      bloodType: 'O+',
      devices: 'Insulin pump, left abdomen',
      doctorName: 'Dr Alvarez',
      doctorPhone: '555-0134',
      preferredHospital: 'San Javier',
      language: 'English, some Spanish',
      directiveLocation: 'Filing cabinet, top drawer',
      otherNotes: 'Hard of hearing on the right.',
      confirmedAt: '2026-09-01',
    },
    fromApp: {
      displayName: 'Lisa Rockdaschel',
      conditions: ["Hashimoto's Thyroiditis", 'Migraine'],
      medications: [
        { name: 'Levothyroxine', dose: '75 mcg' },
        { name: 'Magnesium glycinate', dose: null },
      ],
      foodAllergies: ['Shellfish'],
    },
    contacts: [
      { id: 'c2', name: 'Ana Ruiz', relationship: 'Neighbour', phone: '555-0199', primary: false, notes: null },
      { id: 'c1', name: 'Tony', relationship: 'Husband', phone: '555-0122', primary: true, notes: null },
    ],
    today: TODAY,
  });

  const lines = card.split('\n');

  check('the card opens by saying what it is', lines[0], 'IN AN EMERGENCY');
  check('then whose it is', lines[1], 'Lisa Rockdaschel');

  // The single most important assertion in this file. Drug allergies come
  // before anything else, because someone scanning this in a hurry reads the
  // top and may not read further.
  check('drug allergies are the first real content, ahead of even who to call',
    lines[3], 'DRUG ALLERGIES: Penicillin (anaphylaxis), sulfa drugs (rash)');
  checkTrue('the drug allergy line sits above the call list',
    card.indexOf('DRUG ALLERGIES') < card.indexOf('CALL'));

  checkTrue('the primary contact is listed before the other one, regardless of input order',
    card.indexOf('Tony') < card.indexOf('Ana Ruiz'));
  checkTrue('and is marked as the one to try first',
    /Tony \(Husband\): 555-0122 \(try first\)/.test(card));
  checkFalse('the other contact is not also marked first',
    /Ana Ruiz \(Neighbour\): 555-0199 \(try first\)/.test(card));

  checkTrue('conditions come across from the Profile', card.includes("- Hashimoto's Thyroiditis"));
  checkTrue('both of them', card.includes('- Migraine'));
  checkTrue('a medication with a dose carries the dose',
    card.includes('- Levothyroxine (75 mcg)'));
  checkTrue('one without a dose is still listed rather than dropped',
    card.includes('- Magnesium glycinate'));
  checkFalse('and does not print an empty bracket where a dose would go',
    /Magnesium glycinate \(\)/.test(card));

  checkTrue('a device is called out on its own line, since it changes what scans are safe',
    card.includes('IMPLANTS OR DEVICES: Insulin pump, left abdomen'));
  checkTrue('food allergies appear too, but plainly separated from drug allergies',
    card.includes('FOOD ALLERGIES: Shellfish'));
  checkTrue('blood type is present', card.includes('Blood type: O+'));
  checkTrue('language is present', card.includes('Speaks: English, some Spanish'));
  checkTrue('the doctor is one line with both halves',
    card.includes('Doctor: Dr Alvarez, 555-0134'));
  checkTrue('the hospital is named', card.includes('Hospital: San Javier'));

  // Where a directive is, never what it says.
  checkTrue('a directive is recorded as a location',
    card.includes('Advance directive is kept: Filing cabinet, top drawer'));
  checkFalse('and the card never states what it instructs',
    /DNR|do not resuscitate|resuscitat|life support|withhold/i.test(card));

  checkTrue('free notes are carried through', card.includes('Hard of hearing on the right.'));

  // Provenance rides on the card itself, because the screen is not what gets
  // handed over.
  checkTrue('the card states when it was confirmed',
    card.includes('Confirmed by the person on 2026-09-01'));
  checkTrue('and when it was printed, since the two differ',
    card.includes(`Printed ${TODAY}`));

  checkFalse('the card contains no em dash anywhere', /—/.test(card));
}

// ---------------------------------------------------------------------------
// 4. The empty card. This is where a wrong answer is actively dangerous.
// ---------------------------------------------------------------------------

{
  const card = buildEmergencyCard({
    profile: emptyProfile(),
    fromApp: emptyApp(),
    contacts: [],
    today: TODAY,
  });

  // Every one of these would read as a positive claim to someone in a hurry.
  checkFalse('an empty card never mentions drug allergies at all',
    /DRUG ALLERGIES/.test(card));
  checkFalse('so it can never be read as saying there are none',
    /none|no known|n\/a|nil/i.test(card));
  checkFalse('no empty call section', /CALL/.test(card));
  checkFalse('no empty conditions section', /CONDITIONS/.test(card));
  checkFalse('no empty medication section', /TAKING NOW/.test(card));
  checkFalse('no empty blood type line', /Blood type/.test(card));
  checkFalse('no empty doctor line', /Doctor/.test(card));
  checkFalse('no empty directive line', /Advance directive/.test(card));

  checkTrue('it still says what it is', card.includes('IN AN EMERGENCY'));
  checkTrue('and says outright that nothing here has been checked',
    /never been confirmed/i.test(card));

  // A card with a name but nothing else must not print a blank second line.
  const named = buildEmergencyCard({
    profile: emptyProfile(),
    fromApp: { ...emptyApp(), displayName: 'Lisa' },
    contacts: [],
    today: TODAY,
  });
  check('a name appears where a name exists', named.split('\n')[1], 'Lisa');
}

// ---------------------------------------------------------------------------
// 5. Partial cards, since most real ones will be partial.
// ---------------------------------------------------------------------------

{
  // The minimum useful card: one allergy and one person to phone.
  const card = buildEmergencyCard({
    profile: { ...emptyProfile(), drugAllergies: 'Penicillin', confirmedAt: TODAY },
    fromApp: emptyApp(),
    contacts: [
      { id: 'c1', name: 'Tony', relationship: null, phone: '555-0122', primary: true, notes: null },
    ],
    today: TODAY,
  });
  checkTrue('the two things that matter most are enough to make a usable card',
    card.includes('DRUG ALLERGIES: Penicillin') && card.includes('Tony: 555-0122'));
  checkFalse('a contact with no relationship prints no empty bracket',
    /Tony \(\)/.test(card));
  checkFalse('and nothing else is invented to fill the gaps',
    /Blood type|CONDITIONS|TAKING NOW|Hospital/.test(card));

  // A doctor with only one half recorded.
  const halfDoctor = buildEmergencyCard({
    profile: { ...emptyProfile(), doctorName: 'Dr Alvarez', confirmedAt: TODAY },
    fromApp: emptyApp(),
    contacts: [],
    today: TODAY,
  });
  check('a doctor with no number prints just the name',
    halfDoctor.includes('Doctor: Dr Alvarez') && !halfDoctor.includes('Doctor: Dr Alvarez,'), true);

  // Nobody marked primary. The card must still list everyone rather than
  // dropping them or picking one itself.
  const noPrimary = buildEmergencyCard({
    profile: { ...emptyProfile(), confirmedAt: TODAY },
    fromApp: emptyApp(),
    contacts: [
      { id: 'c1', name: 'Tony', relationship: null, phone: '555-0122', primary: false, notes: null },
      { id: 'c2', name: 'Ana', relationship: null, phone: '555-0199', primary: false, notes: null },
    ],
    today: TODAY,
  });
  checkTrue('with nobody marked first, both are still listed',
    noPrimary.includes('Tony') && noPrimary.includes('Ana'));
  checkFalse('and neither is claimed to be the one to try first',
    /try first/.test(noPrimary));
}

// ---------------------------------------------------------------------------
// 6. The warnings. These are the reason this area exists in the shape it does.
// ---------------------------------------------------------------------------

{
  checkTrue('the standing warning says outright that nobody will find this',
    /nobody is going to find this/i.test(NOT_A_MEDICAL_ALERT));
  checkTrue('and names a paramedic specifically, rather than gesturing at it',
    /paramedic/i.test(NOT_A_MEDICAL_ALERT));
  checkTrue('and names the things it must not replace',
    /bracelet/i.test(NOT_A_MEDICAL_ALERT) && /wallet/i.test(NOT_A_MEDICAL_ALERT));
  checkFalse('it never calls itself an alert, a medical ID, or emergency access',
    /is a medical alert|alerts (someone|emergency)|will notify|automatically/i.test(NOT_A_MEDICAL_ALERT));

  checkTrue('the directive note says only the location is held',
    /where the document is/i.test(DIRECTIVE_NOTE));
  checkTrue('and says plainly that nothing recorded here is legally operative',
    /not a legal document/i.test(DIRECTIVE_NOTE));

  // The jurisdiction rule, carried over from Work and Upkeep. Nothing here may
  // assert what a form is called, what it requires, or what it grants, because
  // all of that depends entirely on where someone lives.
  const everything = [
    NOT_A_MEDICAL_ALERT,
    DIRECTIVE_NOTE,
    ...ESSENTIALS_IN_ORDER.map((entry) => `${entry.label} ${entry.why}`),
  ].join(' ');
  checkFalse('nothing claims a legal requirement',
    /must be|required by|by law|mandatory|legally required/i.test(everything));
  checkFalse('and nothing names a jurisdiction, statute, or scheme',
    /HIPAA|Medicare|Medicaid|NHS|IMSS|POLST|MOLST|state law|federal/i.test(everything));
  checkFalse('and no dash is used in place of punctuation',
    /—|–| -- /.test(everything));
}

console.log(`${checks - failures}/${checks} checks passed`);
if (failures > 0) {
  console.error(`${failures} FAILED`);
  process.exit(1);
}
