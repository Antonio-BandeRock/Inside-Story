// Runs lib/plateSource.ts: the offer that comes up when a meal is logged, and
// the two bands that read what the garden put on a plate.
//
// Built 2026-09-23, phase 6 of the cross-app push.
//
// The rules checked:
//
//  1. UNITS ARE NEVER CONVERTED ACROSS KINDS. An amount comes off a picking
//     only where the meal recorded the unit the picking is measured in; a cup
//     against a kilo takes nothing off and says so.
//  2. A picking can never be drawn past what is left on it.
//  3. One meal listing a food twice draws one amount off one picking, not two.
//  4. The oldest picking of a food is offered first.
//  5. A WEEK WITH NOTHING LOGGED IS A GAP, NEVER A ZERO, and the count of
//     blank weeks is said under the rows. The same for a month of money.
//  6. Money is what was not spent at a shop, worked out only from prices the
//     person recorded paying for the same food in the same unit. A crop never
//     bought is counted and left out of the figure.
//  7. A marking with no amount still counts as the garden feeding somebody on
//     the share band, and is left out of the money figure with a sentence.
//  8. Nothing here marks anybody: no sentence praises or blames a garden, a
//     meal or a person.
//
// Run with: node scripts/test_plate_source.js
// Exits non-zero on any failure.

/* global __dirname */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function transpile(relPath) {
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  return outputText;
}

function run(relPath, resolve) {
  const module = { exports: {} };
  new Function('exports', 'module', 'require', transpile(relPath))(module.exports, module, (name) => {
    const found = resolve[name];
    if (!found) throw new Error(`unexpected import ${name}`);
    return found;
  });
  return module.exports;
}

const V = run('lib/eatingVariety.ts', {});
const T = run('lib/harvestTrade.ts', {});
const U = run('lib/unitConversion.ts', {});
const Y = run('lib/harvestYield.ts', {
  './eatingVariety': V,
  './harvestTrade': T,
  './unitConversion': U,
});
const P = run('lib/plateSource.ts', {
  './harvestTrade': T,
  './eatingVariety': V,
  './harvestYield': Y,
});

const {
  buildPlateOffers,
  describePlateOffer,
  describePlateAction,
  planPlateUses,
  summarizePlateShare,
  summarizePlateValue,
  everySentence,
} = P;

let passed = 0;
let failed = 0;
function check(name, actual, expected) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) passed += 1;
  else {
    failed += 1;
    console.log(`FAIL ${name}\n  expected ${JSON.stringify(expected)}\n  got      ${JSON.stringify(actual)}`);
  }
}
function checkTrue(name, actual) {
  check(name, actual === true, true);
}

const sentences = [];
function collect(...values) {
  for (const value of values) if (typeof value === 'string' && value.length > 0) sentences.push(value);
}

// --- Pickings on hand -------------------------------------------------------

const tomatoOld = {
  id: 'h1',
  foodId: 401,
  source: 'USDA',
  foodName: 'Tomatoes',
  harvestedOn: '2026-09-10',
  unit: 'kg',
  quantityRemaining: 1.2,
  plotName: 'Back bed',
};
const tomatoNew = { ...tomatoOld, id: 'h2', harvestedOn: '2026-09-18', quantityRemaining: 3 };
const basil = {
  id: 'h3',
  foodId: 512,
  source: 'USDA',
  foodName: 'Basil, fresh',
  harvestedOn: '2026-09-19',
  unit: 'g',
  quantityRemaining: 40,
  plotName: null,
};
const cucumbers = {
  id: 'h4',
  foodId: 733,
  source: 'USDA',
  foodName: 'Cucumbers',
  harvestedOn: '2026-09-20',
  unit: 'count',
  quantityRemaining: 6,
  plotName: 'Greenhouse',
};

// --- The offer --------------------------------------------------------------

const plain = buildPlateOffers(
  [{ foodId: '401|USDA', foodName: 'Tomatoes', amount: 0.5, unit: 'kg' }],
  [tomatoNew, tomatoOld],
);
collect(...plain.map((offer) => offer.line));
check('one matching food makes one offer', plain.length, 1);
check('the oldest picking is offered first', plain[0].harvestId, 'h1');
check('the amount recorded in the same unit comes off', plain[0].drawDown, 0.5);
checkTrue('the line says how much off how much', plain[0].line.includes('0.5 kg off the 1.2 kg'));
checkTrue('the line names the area', plain[0].line.includes('Back bed'));
checkTrue('the line says when it was picked', plain[0].line.includes('Sep 10'));

const noArea = buildPlateOffers([{ foodId: '512|USDA', foodName: 'Basil, fresh', amount: 10, unit: 'g' }], [basil]);
collect(...noArea.map((offer) => offer.line));
check('a picking with no area still draws down', noArea[0].drawDown, 10);
checkTrue('and its line names no area', !noArea[0].line.includes('from '));

const byName = buildPlateOffers([{ foodId: null, foodName: 'tomatoes', amount: 0.2, unit: 'kg' }], [tomatoOld]);
check('free text matches by name, case aside', byName.length, 1);
check('and draws down', byName[0].drawDown, 0.2);

const wrongFood = buildPlateOffers([{ foodId: '999|USDA', foodName: 'Tomatoes', amount: 1, unit: 'kg' }], [tomatoOld]);
check('a food id that does not match makes no offer', wrongFood.length, 0);

const nothingOnHand = buildPlateOffers(
  [{ foodId: '401|USDA', foodName: 'Tomatoes', amount: 1, unit: 'kg' }],
  [{ ...tomatoOld, quantityRemaining: 0 }],
);
check('a picking with nothing left is never offered', nothingOnHand.length, 0);

// Rule 1: units are never converted across kinds.
const otherUnit = buildPlateOffers([{ foodId: '401|USDA', foodName: 'Tomatoes', amount: 2, unit: 'cups' }], [tomatoOld]);
collect(...otherUnit.map((offer) => offer.line));
check('a different unit takes nothing off', otherUnit[0].drawDown, null);
checkTrue('and the line says why', otherUnit[0].line.includes('not what this picking is measured in'));
checkTrue('and points at the Harvest Log', otherUnit[0].line.includes('Harvest Log'));
checkTrue('and still says what is on hand', otherUnit[0].line.includes('1.2 kg still on hand'));

const noAmount = buildPlateOffers([{ foodId: '401|USDA', foodName: 'Tomatoes', amount: null, unit: null }], [tomatoOld]);
collect(...noAmount.map((offer) => offer.line));
check('no amount takes nothing off', noAmount[0].drawDown, null);
checkTrue('and the line says so', noAmount[0].line.includes('recorded no amount'));

const zeroAmount = buildPlateOffers([{ foodId: '401|USDA', foodName: 'Tomatoes', amount: 0, unit: 'kg' }], [tomatoOld]);
check('a zero amount reads as no amount', zeroAmount[0].drawDown, null);

// Rule 2: never drawn past what is left.
const tooMuch = buildPlateOffers([{ foodId: '401|USDA', foodName: 'Tomatoes', amount: 5, unit: 'kg' }], [tomatoOld]);
collect(...tooMuch.map((offer) => offer.line));
check('a bigger meal than the picking takes all of it', tooMuch[0].drawDown, 1.2);
checkTrue('and says the rest came from somewhere else', tooMuch[0].line.includes('came from somewhere else'));

// Rule 3: one food listed twice draws one amount off one picking.
const twice = buildPlateOffers(
  [
    { foodId: '401|USDA', foodName: 'Tomatoes', amount: 0.3, unit: 'kg' },
    { foodId: '401|USDA', foodName: 'Tomatoes', amount: 0.4, unit: 'kg' },
  ],
  [tomatoOld],
);
check('a food listed twice makes one offer', twice.length, 1);
check('and its amounts add up', twice[0].drawDown, 0.7);

const mixedUnits = buildPlateOffers(
  [
    { foodId: '401|USDA', foodName: 'Tomatoes', amount: 0.3, unit: 'kg' },
    { foodId: '401|USDA', foodName: 'Tomatoes', amount: 2, unit: 'cups' },
  ],
  [tomatoOld],
);
check('an unusable second amount does not stop the first', mixedUnits[0].drawDown, 0.3);

const plural = buildPlateOffers([{ foodId: '733|USDA', foodName: 'Cucumbers', amount: 2, unit: 'counts' }], [cucumbers]);
check('a trailing s on a unit is the same unit', plural[0].drawDown, 2);

const several = buildPlateOffers(
  [
    { foodId: '401|USDA', foodName: 'Tomatoes', amount: 0.5, unit: 'kg' },
    { foodId: '512|USDA', foodName: 'Basil, fresh', amount: 8, unit: 'g' },
    { foodId: '733|USDA', foodName: 'Cucumbers', amount: 1, unit: 'count' },
    { foodId: '111|USDA', foodName: 'Olive oil', amount: 15, unit: 'ml' },
  ],
  [tomatoOld, basil, cucumbers],
);
collect(...several.map((offer) => offer.line));
check('three of four foods came from the garden', several.length, 3);
collect(describePlateOffer(several), describePlateAction(several));
check('the headline counts them', describePlateOffer(several), '3 foods in this meal came out of your garden.');
check(
  'one food reads as one',
  describePlateOffer([several[0]]),
  '1 food in this meal came out of your garden.',
);
check(
  'no match says so',
  describePlateOffer([]),
  'Nothing in this meal matches a picking you still have on hand.',
);
checkTrue('all drawing says the amounts come off', describePlateAction(several).includes('takes the amounts above off'));
collect(describePlateAction(otherUnit), describePlateAction([...several, otherUnit[0]]));
checkTrue('none drawing says nothing comes off', describePlateAction(otherUnit).includes('Nothing comes off'));
checkTrue(
  'some drawing counts which ones',
  describePlateAction([...several, otherUnit[0]]).includes('3 of the 4 amounts above'),
);

// --- What gets written ------------------------------------------------------

const drafts = planPlateUses([...several, otherUnit[0]], 'meal_9', '2026-09-21');
check('every offer becomes a record', drafts.length, 4);
check('an amountless offer is still written down', drafts[3].quantityUsed, 0);
check('and takes nothing off what is on hand', drafts[3].drawsDown, false);
check('a usable amount draws down', drafts[0].drawsDown, true);
check('the meal it came from is carried', drafts[0].mealId, 'meal_9');
check('the day is carried', drafts[0].usedOn, '2026-09-21');
check('the food name is carried on the row', drafts[1].foodName, 'Basil, fresh');
check('the picking is named', drafts[2].harvestId, 'h4');
check('a meal saved from nowhere in particular carries no meal', planPlateUses(several, null, '2026-09-21')[0].mealId, null);

// --- The share band, on Trends > What You Eat -------------------------------

const weeks = V.buildWeeks('2026-09-01', '2026-09-28', [
  '2026-09-02',
  '2026-09-03',
  '2026-09-09',
  '2026-09-22',
  '2026-09-23',
]);
const eaten = [
  { date: '2026-09-02', foodKey: '401|USDA', foodName: 'Tomatoes' },
  { date: '2026-09-02', foodKey: '111|USDA', foodName: 'Olive oil' },
  { date: '2026-09-03', foodKey: '512|USDA', foodName: 'Basil, fresh' },
  { date: '2026-09-09', foodKey: '111|USDA', foodName: 'Olive oil' },
  { date: '2026-09-22', foodKey: '401|USDA', foodName: 'Tomatoes' },
  { date: '2026-09-23', foodKey: '733|USDA', foodName: 'Cucumbers' },
];
const uses = [
  { id: 'u1', harvestId: 'h1', foodName: 'Tomatoes', quantityUsed: 0.4, unit: 'kg', usedOn: '2026-09-02' },
  { id: 'u2', harvestId: 'h3', foodName: 'Basil, fresh', quantityUsed: 8, unit: 'g', usedOn: '2026-09-03' },
  { id: 'u3', harvestId: 'h2', foodName: 'Tomatoes', quantityUsed: 0.6, unit: 'kg', usedOn: '2026-09-22' },
  { id: 'u4', harvestId: 'h4', foodName: 'Cucumbers', quantityUsed: 0, unit: 'count', usedOn: '2026-09-23' },
];
const share = summarizePlateShare(
  { startDate: '2026-09-01', endDate: '2026-09-28', eaten, uses },
  weeks,
);
collect(share.headline, share.caveat, share.gapNote, share.unmatchedLine, ...share.crops.map((c) => c.line));
collect(...share.rows.map((row) => row.display));
check('four of six logged foods came out of the garden', share.fromGarden, 4);
check('all six were counted', share.totalFoods, 6);
checkTrue('the headline gives the share', share.headline.includes('67% of the foods you logged'));
checkTrue('and the counts behind it', share.headline.includes('4 of 6'));
check('there is one row per week', share.rows.length, weeks.length);

// Rule 5: a week with nothing logged is a gap, never a zero.
const blank = share.rows.filter((row) => row.value === null);
check('two weeks have nothing logged', share.blankWeeks, blank.length);
checkTrue('a blank week says so in words', blank.every((row) => row.display === 'not logged'));
checkTrue('and none of them reads as a zero', blank.every((row) => row.value !== 0));
checkTrue('the note counts the blank weeks', share.gapNote.includes(`${share.blankWeeks} of the ${share.rows.length}`));
checkTrue('and says they are left blank', share.gapNote.includes('left blank rather than counted as none'));

const lastWeek = share.rows[share.rows.length - 1];
check('the most recent week is a whole share', lastWeek.display, '100%');
checkTrue('and carries the number', lastWeek.value === 100);

// Rule 7: a marking with no amount still counts a food as home grown.
checkTrue('the amountless cucumber still counted', share.crops.some((crop) => crop.foodName === 'Cucumbers'));
check('tomatoes led the crops', share.crops[0].foodName, 'Tomatoes');
check('twice', share.crops[0].times, 2);
checkTrue('a crop line counts the times', share.crops[0].line.includes('2 times on a plate'));
check('one time reads as one', summarizePlateShare(
  { startDate: '2026-09-01', endDate: '2026-09-28', eaten: [eaten[2]], uses: [uses[1]] },
  weeks,
).crops[0].line.includes('1 time on a plate'), true);
check('nothing was left over', share.unmatchedLine, null);

const strayDay = summarizePlateShare(
  {
    startDate: '2026-09-01',
    endDate: '2026-09-28',
    eaten,
    uses: [...uses, { id: 'u5', harvestId: 'h2', foodName: 'Kale', quantityUsed: 0.2, unit: 'kg', usedOn: '2026-09-11' }],
  },
  weeks,
);
collect(strayDay.unmatchedLine);
checkTrue('a marking with no food logged that day is said, not counted', strayDay.unmatchedLine.includes('1 marking'));
checkTrue('and said to be left out', strayDay.unmatchedLine.includes('left out of the share above'));
check('and the share is unchanged', strayDay.fromGarden, share.fromGarden);

const twoPickingsOneDay = summarizePlateShare(
  {
    startDate: '2026-09-01',
    endDate: '2026-09-28',
    eaten: [{ date: '2026-09-02', foodKey: '401|USDA', foodName: 'Tomatoes' }],
    uses: [
      { id: 'u1', harvestId: 'h1', foodName: 'Tomatoes', quantityUsed: 0.4, unit: 'kg', usedOn: '2026-09-02' },
      { id: 'u2', harvestId: 'h2', foodName: 'Tomatoes', quantityUsed: 0.4, unit: 'kg', usedOn: '2026-09-02' },
    ],
  },
  weeks,
);
check('two pickings of one food on one day credit it once', twoPickingsOneDay.fromGarden, 1);
checkTrue('and the second is said to be left out', twoPickingsOneDay.unmatchedLine.includes('1 marking'));

const nothingEaten = summarizePlateShare({ startDate: '2026-09-01', endDate: '2026-09-28', eaten: [], uses: [] }, weeks);
collect(nothingEaten.headline);
check('nothing logged has nothing to say', nothingEaten.hasAnything, false);
checkTrue('and says so plainly', nothingEaten.headline.includes('Nothing logged in this stretch'));

const noneGrown = summarizePlateShare(
  { startDate: '2026-09-01', endDate: '2026-09-28', eaten, uses: [] },
  weeks,
);
collect(noneGrown.headline);
checkTrue('none from the garden says how it fills in', noneGrown.headline.includes('the offer comes up on its own'));
check('and every week with logging reads as none', noneGrown.rows.filter((row) => row.display === '0%').length, 3);
checkTrue('the caveat says it counts foods rather than weight', share.caveat.includes('foods on a plate rather than weight'));
checkTrue('and that a day either side is left out', share.caveat.includes('left out rather than guessed at'));

// --- The money band, on Trends > What It Costs -------------------------------

const months = Y.buildMonths('2026-07-01', '2026-09-30');
const lastPaid = {
  tomatoes: { price: 4, unit: 'kg', on: '2026-08-02' },
  'basil, fresh': { price: 0.02, unit: 'g', on: '2026-07-19' },
};
const moneyUses = [
  { id: 'm1', harvestId: 'h1', foodName: 'Tomatoes', quantityUsed: 1, unit: 'kg', usedOn: '2026-08-14' },
  { id: 'm2', harvestId: 'h3', foodName: 'Basil, fresh', quantityUsed: 50, unit: 'g', usedOn: '2026-09-03' },
  { id: 'm3', harvestId: 'h2', foodName: 'Tomatoes', quantityUsed: 2, unit: 'kg', usedOn: '2026-09-20' },
  { id: 'm4', harvestId: 'h4', foodName: 'Cucumbers', quantityUsed: 3, unit: 'count', usedOn: '2026-09-20' },
  { id: 'm5', harvestId: 'h4', foodName: 'Cucumbers', quantityUsed: 0, unit: 'count', usedOn: '2026-09-21' },
];
const value = summarizePlateValue(
  { startDate: '2026-07-01', endDate: '2026-09-30', uses: moneyUses, lastPaid },
  months,
);
collect(value.headline, value.boundary, value.gapNote, value.unpricedLine, value.noAmountLine);
collect(...value.crops.map((crop) => crop.line), ...value.rows.map((row) => row.display));
check('only priced markings reach the figure', value.totalAvoided, 13);
checkTrue('the headline says what it replaced', value.headline.includes('$13.00 of shop food'));
check('there is one row per month', value.rows.length, 3);
check('July had nothing marked', value.rows[0].value, null);
check('and says so rather than showing nothing spent', value.rows[0].display, 'nothing marked');
check('August carries its figure', value.rows[1].display, '$4.00');
check('September carries the rest', value.rows[2].display, '$9.00');
check('one month was blank', value.blankMonths, 1);
checkTrue('and the note counts it', value.gapNote.includes('1 of the 3 months'));

// Rule 6: a crop never bought is counted and left out.
checkTrue('an unpriced crop is said, not guessed', value.unpricedLine.includes('1 marking has'));
checkTrue('and the figure is called an undercount', value.unpricedLine.includes('fed you more than this shows'));
checkTrue('the amountless marking is said too', value.noAmountLine.includes('1 marking'));
checkTrue('and why it carries no figure', value.noAmountLine.includes('not measured in'));
check('the biggest crop leads', value.crops[0].foodName, 'Tomatoes');
check('with its money', value.crops[0].amount, 12);
checkTrue('and a line saying so', value.crops[0].line.includes('$12.00 of Tomatoes'));

// Money is refused where the unit does not line up, the same refusal
// lib/harvestTrade.ts makes everywhere else.
const wrongUnit = summarizePlateValue(
  {
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    uses: [{ id: 'w1', harvestId: 'h1', foodName: 'Tomatoes', quantityUsed: 3, unit: 'lb', usedOn: '2026-09-10' }],
    lastPaid,
  },
  Y.buildMonths('2026-09-01', '2026-09-30'),
);
collect(wrongUnit.headline, wrongUnit.unpricedLine);
check('pounds against a price per kilo is refused', wrongUnit.totalAvoided, 0);
checkTrue('and the headline says there is no figure yet', wrongUnit.headline.includes('no figure to put on them yet'));

const countPriced = summarizePlateValue(
  {
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    uses: [{ id: 'c1', harvestId: 'h4', foodName: 'Cucumbers', quantityUsed: 4, unit: 'count', usedOn: '2026-09-10' }],
    lastPaid: { cucumbers: { price: 0.75, unit: 'each', on: '2026-08-30' } },
  },
  Y.buildMonths('2026-09-01', '2026-09-30'),
);
collect(countPriced.headline);
check('a count priced each is the one mapping made', countPriced.totalAvoided, 3);

const twoUnpriced = summarizePlateValue(
  {
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    uses: [
      { id: 'p1', harvestId: 'h4', foodName: 'Cucumbers', quantityUsed: 2, unit: 'count', usedOn: '2026-09-04' },
      { id: 'p2', harvestId: 'h4', foodName: 'Radishes', quantityUsed: 5, unit: 'count', usedOn: '2026-09-05' },
    ],
    lastPaid,
  },
  Y.buildMonths('2026-09-01', '2026-09-30'),
);
collect(twoUnpriced.unpricedLine);
checkTrue('two unpriced markings read as two', twoUnpriced.unpricedLine.includes('2 markings have'));

const noMoneyYet = summarizePlateValue(
  { startDate: '2026-07-01', endDate: '2026-09-30', uses: [], lastPaid },
  months,
);
collect(noMoneyYet.headline);
check('nothing marked has nothing to say', noMoneyYet.hasAnything, false);
checkTrue('and says so', noMoneyYet.headline.includes('Nothing from the garden has been marked onto a plate'));
checkTrue('the boundary says it is money not spent', value.boundary.includes('did not spend at a shop rather than money made'));
checkTrue('and that the two bands do not add together', value.boundary.includes('rather than adding together'));

// --- Every sentence, gathered the way the app gathers them -----------------

collect(...everySentence({ offers: [...several, otherUnit[0]], share, value }));
checkTrue('everySentence carries the offer lines', everySentence({ offers: several }).length > several.length);
checkTrue('and the share band', everySentence({ share }).includes(share.headline));
checkTrue('and the money band', everySentence({ value }).includes(value.boundary));

// --- Nothing here marks anybody -------------------------------------------

const forbidden = [
  'you should',
  'you failed',
  'poor ',
  'disappointing',
  'well done',
  'good job',
  'keep it up',
  'you are behind',
  'bad ',
  'worse',
  'better than',
  'underperform',
  'wasted',
  'genuine',
  'real ',
];
for (const sentence of sentences) {
  for (const word of forbidden) {
    checkTrue(`"${word.trim()}" stays out of "${sentence.slice(0, 44)}"`, !sentence.toLowerCase().includes(word));
  }
}

console.log(`${passed + failed} checks, ${failed} failures`);
process.exit(failed ? 1 : 0);
