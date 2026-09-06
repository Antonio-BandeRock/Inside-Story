// Runs lib/harvestTrade.ts: what happens to extra harvest when it is sold,
// traded, or given away.
//
// Built 2026-09-05, from "A sale via a harvest could be through a trade as
// well, and not monetary. They could have traded their extra potatoes for
// ears of corn."
//
// The whole risk in this file is the valuation of a trade, because every
// instinct is to put a price on it and there mostly is not one. The rules
// checked hardest:
//
//  1. A trade is valued ONLY where a price was actually recorded for the food
//     received, from a real past grocery trip. Otherwise it is counted.
//  2. Even then, only when the recorded price's unit MATCHES what was
//     received. A per-package price says nothing about a kilo, and converting
//     would smuggle in a guess.
//  3. That figure is an avoided cost and never income, because no money
//     arrived. It must never reach an income total.
//  4. What was GIVEN is never valued. Nobody knows what their own potatoes
//     were worth, and valuing both sides would double count one event.
//  5. Quantities are never added across units. 3 kg and 3 bunches are not 6.
//
// Run with: node scripts/test_harvest_trade.js
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

const H = loadModule('lib/harvestTrade.ts');
const {
  DISPOSITION_KINDS, dispositionLabel,
  valueReceivedGoods, describeValuation,
  summarizeSurplus, describeSurplus,
  formatTradeMoney, formatQuantity,
} = H;

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
function near(label, actual, expected, tol = 0.01) {
  checks += 1;
  if (typeof actual !== 'number' || Math.abs(actual - expected) > tol) {
    failures += 1;
    console.error(`FAIL  ${label}\n      expected ~${expected}\n      got       ${actual}`);
  }
}

const good = (over = {}) => ({ foodName: 'Corn', quantity: 8, unit: 'kg', ...over });
const rec = (over = {}) => ({
  id: 'd1', occurredOn: '2026-09-05', kind: 'traded', foodName: 'Potato',
  quantityGiven: 12, unit: 'kg', withWhom: null, amount: null, received: [], ...over,
});

// --- 1. Valuing what came back, where it can be valued ----------------------

{
  // The whole point: a real recorded price for corn, in the same unit.
  const v = valueReceivedGoods([good()], { corn: { price: 2.4, unit: 'kg', on: '2026-08-14' } });
  check('the good is valued', v.valued.length, 1);
  check('nothing left unpriced', v.unvalued.length, 0);
  near('at the price actually paid, times the amount', v.avoidedCost, 19.2);
  check('and it records when that price was paid', v.valued[0].pricedOn, '2026-08-14');
  const text = describeValuation(v);
  checkTrue('the wording gives the figure', text.includes('$19.20'));
  checkTrue('and says plainly it is not income',
    text.includes('money you kept, not money you earned'));
  checkTrue('and that it stays out of income', text.includes('stays out of your income'));
}
{
  // No price ever recorded. This is the ordinary case and it must not
  // produce a number.
  const v = valueReceivedGoods([good()], {});
  check('nothing is valued', v.valued.length, 0);
  check('the good is named as unpriced', v.unvalued.length, 1);
  check('for the honest reason', v.unvalued[0].reason, 'noRecordedPrice');
  check('and the avoided cost is zero rather than invented', v.avoidedCost, 0);
  checkTrue('the wording says it is counted and not priced',
    describeValuation(v).includes('counted and not priced'));
}
{
  // A price exists but in a different unit. This is the trap: multiplying a
  // per-package price by a number of kilos would look computed and mean
  // nothing.
  const v = valueReceivedGoods([good({ unit: 'kg' })], { corn: { price: 3.5, unit: 'each', on: '2026-08-14' } });
  check('a mismatched unit is not valued', v.valued.length, 0);
  check('and says why', v.unvalued[0].reason, 'differentUnit');
  check('with nothing added to the total', v.avoidedCost, 0);
  checkTrue('the wording refuses to convert',
    describeValuation(v).includes('converting between them would be a guess'));
}
{
  // Plural and case differences in a unit are the same unit. "kg" and "kgs"
  // should not become a refusal.
  const v = valueReceivedGoods([good({ unit: 'KGS' })], { corn: { price: 2, unit: 'kg', on: '2026-08-01' } });
  check('unit matching is not defeated by case or a plural', v.valued.length, 1);
  near('and values normally', v.avoidedCost, 16);
}
{
  // Food name matching is case-insensitive, since a harvest and a grocery
  // line will not always be typed the same way.
  const v = valueReceivedGoods([good({ foodName: 'CORN' })], { corn: { price: 2, unit: 'kg', on: '2026-08-01' } });
  check('the food is found regardless of case', v.valued.length, 1);
}
{
  // Mixed: one valuable, two not. Each is reported rather than the whole
  // trade going silent or the total pretending to be complete.
  const v = valueReceivedGoods(
    [
      good({ foodName: 'Corn', quantity: 8, unit: 'kg' }),
      good({ foodName: 'Eggs', quantity: 12, unit: 'each' }),
      good({ foodName: 'Honey', quantity: 2, unit: 'jars' }),
    ],
    {
      corn: { price: 2.5, unit: 'kg', on: '2026-08-14' },
      eggs: { price: 6, unit: 'dozen', on: '2026-07-02' },
    },
  );
  check('one valued', v.valued.length, 1);
  check('two not', v.unvalued.length, 2);
  near('and the total is only the one that could be', v.avoidedCost, 20);
  const text = describeValuation(v);
  checkTrue('the eggs are named as a unit mismatch', text.includes('Eggs'));
  checkTrue('the honey as never priced', text.includes('Honey'));
  checkTrue('so the total is not read as the whole trade',
    text.includes('$20.00') && (text.includes('no price you have ever recorded') || text.includes('different unit')));
}
{
  check('nothing received gives nothing to say', describeValuation(valueReceivedGoods([], {})), null);
  const zero = valueReceivedGoods([good()], { corn: { price: 0, unit: 'kg', on: '2026-08-14' } });
  check('a recorded price of zero is not a price', zero.valued.length, 0);
  check('named as unpriced', zero.unvalued[0].reason, 'noRecordedPrice');
}

// --- 2. What was given is never valued --------------------------------------

{
  // A trade of 12 kg of potatoes for 8 kg of corn. Only the corn can be
  // valued, and nothing anywhere should put a figure on the potatoes.
  const v = valueReceivedGoods([good()], { corn: { price: 2.4, unit: 'kg', on: '2026-08-14' }, potato: { price: 1.8, unit: 'kg', on: '2026-08-01' } });
  near('only the received side is valued', v.avoidedCost, 19.2);
  checkTrue('the potatoes never appear', !describeValuation(v).includes('Potato'));
  checkTrue('and their own recorded price is not used', v.valued.every((entry) => entry.foodName !== 'Potato'));
}

// --- 3. What the surplus has done -------------------------------------------

{
  const summary = summarizeSurplus([
    rec({ id: 'a', kind: 'sold', foodName: 'Potato', quantityGiven: 20, unit: 'kg', amount: 36 }),
    rec({ id: 'b', kind: 'sold', foodName: 'Tomato', quantityGiven: 8, unit: 'kg', amount: 24 }),
    rec({ id: 'c', kind: 'traded', foodName: 'Potato', quantityGiven: 12, unit: 'kg', received: [good(), good({ foodName: 'Eggs', unit: 'each', quantity: 12 })] }),
    rec({ id: 'd', kind: 'given', foodName: 'Zucchini', quantityGiven: 5, unit: 'kg' }),
  ]);
  check('sales counted', summary.sales, 2);
  check('and totalled', summary.salesTotal, 60);
  check('trades counted', summary.trades, 1);
  check('things received counted, not valued', summary.goodsReceivedCount, 2);
  check('gifts counted', summary.gifts, 1);

  // Potatoes went out twice, once sold and once traded, in the same unit, so
  // they add up and both kinds are recorded against them.
  const potato = summary.byFood.find((entry) => entry.foodName === 'Potato');
  check('the same food in the same unit adds up', potato.quantityGiven, 32);
  check('and both things that happened to it are kept', potato.kinds.sort(), ['sold', 'traded']);
  check('the biggest contributor leads', summary.byFood[0].foodName, 'Potato');

  const text = describeSurplus(summary);
  checkTrue('the wording gives the sales figure', text.includes('$60.00'));
  checkTrue('and counts what trading brought back', text.includes('2 things'));
  checkTrue('while saying no money was involved in a trade',
    text.includes('no money involved'));
  checkTrue('trading never contributes to the sales total',
    !text.includes('$60.00 and') && summary.salesTotal === 60);
}
{
  // The unit rule. 3 kg of beans and 3 bunches of beans are not 6 of
  // anything, so they stay as two lines.
  const summary = summarizeSurplus([
    rec({ id: 'a', foodName: 'Beans', quantityGiven: 3, unit: 'kg' }),
    rec({ id: 'b', foodName: 'Beans', quantityGiven: 3, unit: 'bunches' }),
  ]);
  check('two units means two lines, not one total', summary.byFood.length, 2);
  checkTrue('and neither reads as six', summary.byFood.every((entry) => entry.quantityGiven === 3));
}
{
  // A sale with no amount recorded must not be quietly counted as zero
  // inside a total that reads as complete.
  const summary = summarizeSurplus([
    rec({ id: 'a', kind: 'sold', quantityGiven: 5, amount: 20 }),
    rec({ id: 'b', kind: 'sold', quantityGiven: 5, amount: null }),
  ]);
  check('both sales counted', summary.sales, 2);
  check('but only one had an amount', summary.salesTotal, 20);
  check('and the one without is named', summary.salesWithoutStream, 1);
}
{
  const empty = summarizeSurplus([]);
  check('nothing out yet', empty.sales, 0);
  check('no total', empty.salesTotal, 0);
  check('and no foods', empty.byFood.length, 0);
  checkTrue('with honest wording', describeSurplus(empty).includes('Nothing recorded going out yet'));
}
{
  // Trades alone must not produce a money sentence at all.
  const tradesOnly = summarizeSurplus([rec({ received: [good()] })]);
  const text = describeSurplus(tradesOnly);
  checkTrue('no sales figure is quoted', !text.includes('$'));
  checkTrue('but the trade is reported', text.includes('1 trade'));
}

// --- 4. Vocabulary and formatting -------------------------------------------

check('three things can happen and no more', DISPOSITION_KINDS.length, 3);
check('sold has a label', dispositionLabel('sold'), 'Sold it');
check('traded too', dispositionLabel('traded'), 'Traded it');
check('given too', dispositionLabel('given'), 'Gave it away');
check('an unknown kind is not renamed', dispositionLabel('nonsense'), 'nonsense');
checkTrue('the trade option says goods come back rather than money',
  DISPOSITION_KINDS.find((k) => k.code === 'traded').help.includes('Goods came back instead of money'));

check('money formats', formatTradeMoney(1234.5), '$1,234.50');
check('a whole quantity keeps its unit', formatQuantity(8, 'kg'), '8 kg');
check('a fractional one is not padded', formatQuantity(8.5, 'kg'), '8.5 kg');
check('and no unit is just the number', formatQuantity(8, ''), '8');

console.log(`${checks - failures}/${checks} checks passed`);
if (failures > 0) {
  console.error(`${failures} FAILED`);
  process.exit(1);
}
