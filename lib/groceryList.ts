// The Grocery List's own pure logic: what a price actually means, what a
// line comes to, and what a whole list comes to. Kept out of lib/db.ts on
// purpose (the same split lib/quickLog.ts already established) so every
// one of these can be reasoned about, and tested, without a database.
//
// 2026-09-01, from the specification given on 2026-08-30: pick how many
// days of the schedule to shop for, say how many people, and the app works
// out how much of each ingredient every scheduled dish needs. Then it is
// carried into a shop, checked off, and priced.

import { convertToGrams, MASS_UNITS, VOLUME_UNITS, volumeToMl, type MeasurementUnit } from './unitConversion';
// 2 to 4 days is what the original request encouraged, on the reasoning
// that produce bought for a whole week stops being fresh long before the
// week is over. Up to 7 is allowed rather than blocked, because someone
// who can only get to a shop once a week is describing their life, not
// making a mistake.
export const GROCERY_DAY_OPTIONS = [2, 3, 4, 5, 6, 7] as const;
export const GROCERY_ENCOURAGED_DAYS = [2, 3, 4] as const;

export function isEncouragedGroceryWindow(days: number): boolean {
  return (GROCERY_ENCOURAGED_DAYS as readonly number[]).includes(days);
}

// How the number entered relates to the line.
//
// 'total' is the honest default for anything sold as a package at one
// price. 'each' multiplies by how many were bought, for loose items priced
// per unit. 'lb' and 'kg' are unit prices, where the line total genuinely
// cannot be known without a weight, which is why groceryLineTotal below
// returns null rather than inventing one.
export type GroceryPriceUnit = 'total' | 'each' | 'lb' | 'kg' | 'l' | 'fl_oz';

// Every unit that can be stored. What is OFFERED for a given line is a much
// shorter list: see groceryPriceUnitsFor.
export const GROCERY_PRICE_UNITS: GroceryPriceUnit[] = ['total', 'each', 'lb', 'kg', 'l', 'fl_oz'];

// 2026-09-01, from two reports in one breath: "Per kg and Per lb should rely
// on them having set their units up in Preferences. They shouldn't need to
// choose that here for each item, and I'm seeing this on Olive Oil, so that's
// wrong to begin with anyway. Olive oil isn't sold by the weight."
//
// Both are right, and the second is the deeper one. Offering every unit on
// every line made the list ask a question it already had the answer to, and
// offered answers that were wrong for the thing being priced. A bottle of oil
// has no price per pound.
//
// So: one weight-or-volume unit, picked by which system the person already
// set, and which of the two it is decided by how the food is sold rather than
// by asking again.
export function groceryPriceUnitsFor(
  form: PurchaseForm | null | undefined,
  system: 'metric' | 'imperial',
): GroceryPriceUnit[] {
  // Sold by volume: a per-weight price would be meaningless, so it is not
  // offered at all.
  if (form === 'volume') {
    return ['total', 'each', system === 'imperial' ? 'fl_oz' : 'l'];
  }
  // Everything else can be priced by weight, including things sold loose and
  // counted: onions are commonly counted AND priced by the pound.
  return ['total', 'each', system === 'imperial' ? 'lb' : 'kg'];
}

export function groceryPriceUnitLabel(unit: GroceryPriceUnit): string {
  switch (unit) {
    case 'total':
      return 'for all of it';
    case 'each':
      return 'each';
    case 'lb':
      return 'per lb';
    case 'kg':
      return 'per kg';
    case 'l':
      return 'per litre';
    case 'fl_oz':
      return 'per fl oz';
  }
}

export function groceryPriceUnitShortLabel(unit: GroceryPriceUnit): string {
  switch (unit) {
    case 'total':
      return 'total';
    case 'each':
      return 'ea';
    case 'lb':
      return '/lb';
    case 'kg':
      return '/kg';
    case 'l':
      return '/L';
    case 'fl_oz':
      return '/fl oz';
  }
}

export type GroceryLineForTotal = {
  price: number | null;
  priceUnit: GroceryPriceUnit | null;
  purchasedQuantity: number | null;
  quantity: number;
};

// Returns null wherever the number honestly is not knowable yet, rather
// than falling back to the price alone. A per-pound price with no weight
// entered is a real gap in what the app knows, and quietly counting it as
// one pound would put a wrong number in a running total the person is
// using to decide what they can afford.
export function groceryLineTotal(line: GroceryLineForTotal): number | null {
  if (line.price == null || line.priceUnit == null) return null;
  if (line.priceUnit === 'total') return line.price;
  // For 'each', how many were actually bought is the multiplier when it is
  // known, and what the list asked for is a fair stand-in when it is not:
  // that quantity is the app's own figure, not a guess about the shop.
  if (line.priceUnit === 'each') {
    const count = line.purchasedQuantity ?? line.quantity;
    return line.price * count;
  }
  // Everything left is a price per unit of weight or volume, and all of them
  // need to know how much was actually bought before they mean anything.
  if (line.purchasedQuantity == null) return null;
  return line.price * line.purchasedQuantity;
}

// --- Reading a price someone said, or photographed --------------------------
//
// 2026-09-01, asked for directly: "they should be able to scan OCR trace the
// price of the item rather than only having the option to type it in by hand,
// and they should be able to say it."
//
// One parser for both, since a shelf label read by OCR and a price said out
// loud arrive as the same thing: a short string that may or may not contain a
// number. Returns null rather than a guess whenever it cannot tell, so the
// field stays empty and waits rather than filling itself with something wrong.
const SPOKEN_PRICE_WORDS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
  fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
  nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60,
  seventy: 70, eighty: 80, ninety: 90,
};

// "ninety nine cents" is 0.99, not 99. Applied only to a lone number, and
// only when cents is mentioned without dollars, so "three dollars and ninety
// nine cents" is untouched by it.
function saidInCents(cleaned: string, value: number): number {
  const mentionsCents = /\bcents?\b/.test(cleaned);
  const mentionsDollars = /\bdollars?\b|\bpesos?\b|\beuros?\b/.test(cleaned);
  if (mentionsCents && !mentionsDollars && value < 100) return Math.round(value) / 100;
  return value;
}

export function parsePriceInput(text: string): number | null {
  if (!text) return null;
  const cleaned = text.toLowerCase().replace(/[$£€]/g, ' ').replace(/,/g, '');

  // A written number wins outright, since it is unambiguous.
  //
  // A number carrying cents beats a bare one, and the largest of those wins.
  // That rule is for photographed shelf labels, which are full of numbers that
  // are not the price: "SALE 2/$5.00" has a 2 in it, and taking the first
  // number found would price the item at two dollars.
  const withCents = [...cleaned.matchAll(/(\d{1,4})[.:](\d{1,2})/g)].map(
    (match) => Number(match[1]) + Number(match[2].padEnd(2, '0')) / 100,
  );
  if (withCents.length > 0) {
    const value = Math.max(...withCents);
    return Number.isFinite(value) ? Math.round(value * 100) / 100 : null;
  }
  // No cents anywhere, so a bare number is the price. A shelf label reading
  // "4" is a real price, not a broken one.
  const bare = cleaned.match(/\b(\d{1,4})\b/);
  if (bare) {
    const value = Number(bare[1]);
    return Number.isFinite(value) && value >= 0 ? saidInCents(cleaned, value) : null;
  }

  // Spoken, where "four ninety nine" means 4.99 and "three fifty" means 3.50.
  // The first number is dollars and whatever follows is cents, which is how
  // people actually say a price out loud.
  const words = cleaned.split(/[^a-z]+/).filter(Boolean);
  const numbers: number[] = [];
  for (const word of words) {
    const value = SPOKEN_PRICE_WORDS[word];
    if (value == null) continue;
    // "ninety nine" is one number, not two: a tens word followed by a units
    // word combines rather than starting again.
    const last = numbers.length > 0 ? numbers[numbers.length - 1] : null;
    if (last != null && last >= 20 && last % 10 === 0 && value < 10 && numbers.length >= 2) {
      numbers[numbers.length - 1] = last + value;
    } else if (last != null && last >= 20 && last % 10 === 0 && value < 10 && numbers.length === 1) {
      numbers[0] = last + value;
    } else {
      numbers.push(value);
    }
  }
  if (numbers.length === 0) return null;
  if (numbers.length === 1) return saidInCents(cleaned, numbers[0]);
  const cents = numbers[1];
  if (cents > 99) return numbers[0];
  return Math.round((numbers[0] + cents / 100) * 100) / 100;
}

export type GroceryListTotals = {
  itemCount: number;
  checkedCount: number;
  // What the priced lines add up to. Deliberately not called "the total":
  // it is only the total of what has actually been priced so far.
  pricedTotal: number;
  pricedCount: number;
  // Lines that carry a price the app cannot turn into a number yet (a
  // per-weight price with no weight). Surfaced rather than hidden, so the
  // running total can say what it is missing.
  unresolvedPriceCount: number;
};

export function groceryListTotals(lines: (GroceryLineForTotal & { checked: boolean })[]): GroceryListTotals {
  let pricedTotal = 0;
  let pricedCount = 0;
  let unresolvedPriceCount = 0;
  let checkedCount = 0;
  for (const line of lines) {
    if (line.checked) checkedCount += 1;
    const total = groceryLineTotal(line);
    if (total != null) {
      pricedTotal += total;
      pricedCount += 1;
    } else if (line.price != null) {
      unresolvedPriceCount += 1;
    }
  }
  return { itemCount: lines.length, checkedCount, pricedTotal, pricedCount, unresolvedPriceCount };
}

// Quantities come out of recipe arithmetic, so they arrive with more
// decimal places than anyone shops by. One decimal is as precise as a
// shopping list can honestly be about "2.3 cups".
export function formatGroceryQuantity(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function formatGroceryAmount(quantity: number, unit: string): string {
  const amount = formatGroceryQuantity(quantity);
  return unit ? `${amount} ${unit}` : amount;
}

export function formatMoney(value: number): string {
  return `$${value.toFixed(2)}`;
}

// "Groceries, Sep 1" rather than a bare date, because a list is picked out
// of a history of other lists and the month is what actually distinguishes
// them at a glance.
export function defaultGroceryListName(startDate: string): string {
  const [year, month, day] = startDate.split('-').map(Number);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (!year || !month || !day) return 'Groceries';
  return `Groceries, ${monthNames[month - 1]} ${day}`;
}

export function describeGroceryWindow(daysAhead: number, peopleCount: number): string {
  const days = daysAhead === 1 ? '1 day' : `${daysAhead} days`;
  const people = peopleCount === 1 ? '1 person' : `${peopleCount} people`;
  return `${days} of meals for ${people}`;
}

// --- What never belongs on a shopping list ---------------------------------
//
// 2026-09-01, direct instruction: "if it is tap water, it shouldn't even
// appear on the list at all."
//
// Tap water is on 67 curated recipe ingredient rows, and it belongs there:
// it was added deliberately on 2026-08-26 so soups and simmered grains
// count toward the day's real water intake. It is the shopping list, not
// the recipe data, that has no use for it. So it is filtered at this
// boundary rather than removed from the recipes, which would break
// hydration tracking to fix a display problem.
//
// Matched on the base name, which is the raw purchasable identity, so this
// stays a short list of exact things rather than a keyword search that
// would also catch coconut water and watermelon.
const NON_PURCHASABLE_BASE_NAMES = new Set(['water, tap', 'water, municipal', 'water, well', 'water, drinking']);

export function isNonPurchasableIngredient(baseName: string): boolean {
  return NON_PURCHASABLE_BASE_NAMES.has(baseName.trim().toLowerCase());
}

// --- Adding up one food across every meal that needs it ---------------------

export type AmountEntry = { quantity: number; unit: string };

export type MergedAmounts = {
  // The one amount that leads the line.
  primary: AmountEntry;
  // Anything that genuinely could not be folded into it. A volume and a
  // weight of the same food cannot be added without a density the app does
  // not have for most foods, so both are shown rather than one being
  // dropped or guessed into the other.
  extras: AmountEntry[];
};

// The conversion factors themselves live in lib/unitConversion.ts and are
// reached through its own two functions rather than copied here: a second
// table of grams per ounce is exactly the kind of duplication that drifts
// silently once one of the two gets corrected.
//
// Weights convert among themselves and volumes convert among themselves,
// both without knowing anything about the food. Only crossing between the
// two needs a density, which is the line this deliberately does not cross.
// Everything else (each, slice, clove) is a count and merges only with the
// exact same word.
function familyFor(unit: string): 'mass' | 'volume' | string {
  const key = unit.trim().toLowerCase();
  if ((MASS_UNITS as readonly string[]).includes(key)) return 'mass';
  if ((VOLUME_UNITS as readonly string[]).includes(key)) return 'volume';
  return `count:${key}`;
}

// Returns null only where a unit claimed a family it cannot actually be
// converted within, which should not happen, but is handled rather than
// assumed away.
function toFamilyBase(family: string, quantity: number, unit: string): number | null {
  const key = unit.trim().toLowerCase() as MeasurementUnit;
  if (family === 'mass') {
    const converted = convertToGrams(quantity, key);
    return converted.ok ? converted.grams : null;
  }
  if (family === 'volume') return volumeToMl(quantity, key);
  return quantity;
}

export function mergeShoppingAmounts(entries: AmountEntry[]): MergedAmounts {
  if (entries.length === 0) return { primary: { quantity: 0, unit: '' }, extras: [] };

  const buckets = new Map<string, { total: number; count: number; unit: string }>();
  for (const entry of entries) {
    const family = familyFor(entry.unit);
    const existing = buckets.get(family);
    const value = toFamilyBase(family, entry.quantity, entry.unit);
    if (value == null) continue;
    if (existing) {
      existing.total += value;
      existing.count += 1;
    } else {
      buckets.set(family, { total: value, count: 1, unit: entry.unit.trim() });
    }
  }

  const rendered = Array.from(buckets.entries()).map(([family, bucket]) => ({
    family,
    count: bucket.count,
    amount: renderBucket(family, bucket.total, bucket.unit),
  }));

  // The amount that leads is whichever way this food was measured most
  // often across the meals that need it, since that is the reading most of
  // the list already agrees on. Weight wins a tie, because it is the one a
  // scale in a store can settle.
  rendered.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return familyRank(a.family) - familyRank(b.family);
  });

  return { primary: rendered[0].amount, extras: rendered.slice(1).map((entry) => entry.amount) };
}

function familyRank(family: string): number {
  if (family === 'mass') return 0;
  if (family === 'volume') return 1;
  return 2;
}

// Kept in the unit a person would actually say out loud: grams up to a
// kilo, millilitres up to a litre, and the original word for a count.
function renderBucket(family: string, total: number, originalUnit: string): AmountEntry {
  if (family === 'mass') {
    return total >= 1000 ? { quantity: total / 1000, unit: 'kg' } : { quantity: total, unit: 'g' };
  }
  if (family === 'volume') {
    return total >= 1000 ? { quantity: total / 1000, unit: 'L' } : { quantity: total, unit: 'ml' };
  }
  return { quantity: total, unit: originalUnit };
}

// "340 g" on its own, or "340 g + 2 cups" where the two genuinely cannot be
// added together.
export function formatMergedAmounts(merged: MergedAmounts): string {
  const parts = [merged.primary, ...merged.extras].map((entry) => formatGroceryAmount(entry.quantity, entry.unit));
  return parts.join(' + ');
}

// --- What is already in the kitchen -----------------------------------------
//
// 2026-09-03. Named as open when the Grocery List first shipped: "the list
// does not yet know anything about what is already in the kitchen, so
// something bought two days ago appears again."
//
// The line this draws, and the whole reason the shape below is what it is:
// the app knows two different things, and only one of them is a number.
//
// A garden or fermentation harvest carries a quantity_remaining that is
// drawn down every time some is used, so "you have 400 g of broccoli" is a
// measured fact and can be subtracted from what the list asks for.
//
// A grocery purchase carries nothing of the kind. Ticking broccoli off a list
// records that it was bought; nothing anywhere decrements it as it gets
// eaten, because logging a meal does not reach back into a past shopping
// trip. So the app knows it was bought and cannot know whether any is left.
// Turning that into a subtraction would be inventing the number, and someone
// would come home without broccoli. It surfaces as a reminder to look, never
// as an amount, for the same reason a price the app cannot resolve is
// reported as missing rather than guessed.
export type KitchenStockSource = 'garden' | 'fermentation' | 'purchase';

export type KitchenStockEntry = {
  // The harvest row this came from, so taking some of it can draw the right
  // one down. Empty for a purchase, which is never drawn down: nothing tracks
  // how much of it is left, which is the whole reason it is not a quantity.
  id: string;
  source: KitchenStockSource;
  // For 'garden' and 'fermentation' this is the remaining amount. For
  // 'purchase' it is what was bought, which is NOT what is left, and is never
  // read as a quantity by anything below.
  quantity: number;
  unit: string;
  // ISO date (YYYY-MM-DD) the stock came in, for saying how long ago.
  date: string;
};

export type KitchenCoverageLevel = 'covered' | 'some' | 'unmeasured' | 'none';

export type KitchenCoverage = {
  level: KitchenCoverageLevel;
  // A plain sentence for the line, or null when there is nothing worth
  // saying. Never states an amount for a purchase.
  note: string | null;
  // How much of what the line asks for is accounted for, in the line's own
  // unit. Null whenever no measured stock could be converted into that unit,
  // which includes every purchase-only case.
  coveredQuantity: number | null;
  // What to take, and from where, if someone says they are using this rather
  // than buying it. Each amount is in that harvest's OWN unit, because that is
  // what quantity_remaining is measured in and what has to be decremented.
  // Empty unless there is measured stock to take.
  draws: KitchenDraw[];
};

export type KitchenDraw = {
  id: string;
  source: KitchenStockSource;
  // In the harvest's own unit, not the line's.
  quantity: number;
};

// How far back a purchase is still worth mentioning. Groceries perish, and a
// reminder about something bought a month ago is noise that trains someone to
// ignore the line. Seven days matches the longest window a list can be built
// for, so anything still plausibly in the house from the last shop is caught.
export const KITCHEN_PURCHASE_RECENT_DAYS = 7;

function describeDaysAgo(date: string, today: string): string {
  const then = Date.parse(`${date}T00:00:00Z`);
  const now = Date.parse(`${today}T00:00:00Z`);
  if (Number.isNaN(then) || Number.isNaN(now)) return 'recently';
  const days = Math.round((now - then) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

function describeSource(source: KitchenStockSource): string {
  if (source === 'garden') return 'from the garden';
  if (source === 'fermentation') return 'from what you fermented';
  return 'bought';
}

// Measured stock only, and only what shares a unit family with the line. A
// weight of something cannot be counted against a volume of it without a
// density this app does not have for most foods, which is the same line
// mergeShoppingAmounts already refuses to cross.
export function kitchenCoverageFor(
  neededQuantity: number,
  neededUnit: string,
  stock: KitchenStockEntry[],
  today: string = new Date().toISOString().slice(0, 10),
): KitchenCoverage {
  const family = familyFor(neededUnit);
  const neededBase = toFamilyBase(family, neededQuantity, neededUnit);

  const measured = stock.filter((entry) => entry.source !== 'purchase');
  const purchases = stock.filter((entry) => entry.source === 'purchase');

  // Grouped by source so the note can name where it came from, which is what
  // makes it checkable: someone can go and look in the right place.
  const bySource = new Map<KitchenStockSource, number>();
  const usable: { entry: KitchenStockEntry; base: number }[] = [];
  let totalBase = 0;
  for (const entry of measured) {
    if (familyFor(entry.unit) !== family) continue;
    const value = toFamilyBase(family, entry.quantity, entry.unit);
    if (value == null || value <= 0) continue;
    totalBase += value;
    usable.push({ entry, base: value });
    bySource.set(entry.source, (bySource.get(entry.source) ?? 0) + value);
  }

  // Allocated oldest-first, in the order the caller supplied, so the stock
  // that has been sitting longest is used before a fresher harvest. Each
  // amount is converted back into that harvest's own unit, since that is what
  // its remaining quantity is counted in.
  const draws: KitchenDraw[] = [];
  if (neededBase != null && neededBase > 0) {
    let outstanding = neededBase;
    for (const { entry, base } of usable) {
      if (outstanding <= 0) break;
      const takeBase = Math.min(base, outstanding);
      outstanding -= takeBase;
      draws.push({
        id: entry.id,
        source: entry.source,
        // Proportional rather than converted a second time, so a rounding
        // difference cannot leave a harvest at a stubborn 0.0001 remaining.
        quantity: takeBase >= base ? entry.quantity : (entry.quantity * takeBase) / base,
      });
    }
  }

  if (totalBase > 0 && neededBase != null && neededBase > 0) {
    const parts = Array.from(bySource.entries()).map(([source, base]) => {
      const amount = renderBucket(family, base, neededUnit);
      return `${formatGroceryAmount(amount.quantity, amount.unit)} ${describeSource(source)}`;
    });
    const have = parts.join(' and ');
    const coveredBase = Math.min(totalBase, neededBase);
    const coveredAmount = renderBucket(family, coveredBase, neededUnit);

    if (totalBase >= neededBase) {
      return {
        level: 'covered',
        note: `Already in your kitchen: ${have}. That covers this line.`,
        coveredQuantity: coveredAmount.quantity,
        draws,
      };
    }
    const shortfall = renderBucket(family, neededBase - totalBase, neededUnit);
    return {
      level: 'some',
      note: `Already in your kitchen: ${have}. You still need about ${formatGroceryAmount(shortfall.quantity, shortfall.unit)}.`,
      coveredQuantity: coveredAmount.quantity,
      draws,
    };
  }

  if (purchases.length > 0) {
    // Deliberately no amount. See this section's comment for why: what
    // was bought is not what is left, and nothing tracks the difference.
    const mostRecent = purchases.reduce((latest, entry) => (entry.date > latest.date ? entry : latest));
    return {
      level: 'unmeasured',
      note: `You bought this ${describeDaysAgo(mostRecent.date, today)}. Worth checking before buying more.`,
      coveredQuantity: null,
      draws: [],
    };
  }

  return { level: 'none', note: null, coveredQuantity: null, draws: [] };
}

// --- How a store actually sells it ------------------------------------------
//
// 2026-09-01. The amount on a grocery list is what the recipes consume, and
// for most ingredients that is a gram figure, because that is how curated
// recipe amounts are written. "340 g of broccoli" is not how anyone shops.
// food_purchase_forms (see scripts/add_food_purchase_forms.py) says how each
// ingredient is actually sold, so a line can lead with something shoppable.

export type PurchaseForm = 'count' | 'weight' | 'volume';

// Turns a weight into a number of things to pick up, but only where a unit
// weight genuinely exists to divide by. Those weights come from
// food_unit_weights, which carries a citation per row and currently covers a
// deliberately small set of common foods; everything else returns null and
// the line shows its amount plus how the thing is sold, which is honest and
// still useful.
//
// Rounded to whole units and never below one, because a shop does not sell
// two thirds of an avocado. "About" is in the wording for the same reason:
// this is a real division of one average weight, not a promise about the
// particular avocado someone picks up.
export function describeApproximateCount(
  quantity: number,
  unit: string,
  foodName: string,
  unitLabel: string,
  unitLabelPlural: string,
  gramsPerUnit: number | null | undefined,
): string | null {
  if (!gramsPerUnit || gramsPerUnit <= 0) return null;
  const key = unit.trim().toLowerCase();
  const grams = key === 'g' ? quantity : key === 'kg' ? quantity * 1000 : null;
  if (grams == null || grams <= 0) return null;
  const count = Math.max(1, Math.round(grams / gramsPerUnit));
  // An empty unit label means the food is the unit: 3 avocados, not 3 units
  // of avocado. Lower-cased so it reads as prose next to "about".
  const singular = unitLabel || foodName.toLowerCase();
  const plural = unitLabelPlural || `${foodName.toLowerCase()}s`;
  return `about ${count} ${count === 1 ? singular : plural}`;
}

// --- What a thing actually costs per unit -----------------------------------
//
// 2026-09-01, reported directly: "The olive oil can't just be purchased by the
// bottle, it must also have a selection for how many ml or the imperial
// version. It will come in different sizes. This should be able to calculate
// the price per ml."
//
// Right, and the gap was real: a bottle priced for all of it told the app
// nothing about value, because a bottle is not a size. Once the size is known
// the comparison number falls out of it, and that number is the one people
// actually shop on.

// The unit a size is entered in for this kind of food, which is also the unit
// the derived price is quoted against.
export function purchaseSizeUnitFor(
  form: PurchaseForm | null | undefined,
  system: 'metric' | 'imperial',
): 'ml' | 'fl oz' | 'g' | 'oz' {
  if (form === 'volume') return system === 'imperial' ? 'fl oz' : 'ml';
  return system === 'imperial' ? 'oz' : 'g';
}

// "$21.20 per litre", "$4.99 per lb", "$0.60 each".
//
// Quoted per litre and per kilo rather than per millilitre and per gram, even
// though the size is entered in the smaller unit: a bottle of oil works out to
// about two cents a millilitre, and a price nobody can read is no use for
// comparing two bottles. Imperial already has sensibly sized units and is
// quoted as entered.
//
// Returns null wherever the sum cannot honestly be done, which is most of the
// time until someone fills both fields in.
export function describeUnitPrice(
  line: GroceryLineForTotal,
  form: PurchaseForm | null | undefined,
  system: 'metric' | 'imperial',
): string | null {
  if (line.price == null || line.priceUnit == null) return null;
  // Already a unit price: it is what it says it is.
  if (line.priceUnit !== 'total' && line.priceUnit !== 'each') {
    return `${formatMoney(line.price)} ${groceryPriceUnitLabel(line.priceUnit)}`;
  }
  if (line.priceUnit === 'each') {
    return `${formatMoney(line.price)} each`;
  }
  // Priced for all of it, so the size is what turns it into a comparison.
  // The same sum the shelf comparison tool does, so the two can never
  // disagree about what a thing works out to.
  const unitPrice = unitPriceFor(line.price, line.purchasedQuantity, form, system);
  if (unitPrice == null) return null;
  return `${formatMoney(unitPrice)} ${unitPriceLabelFor(form, system)}`;
}

// --- Sale prices ------------------------------------------------------------
//
// 2026-09-01, reported directly: "If there is a sale like that, there needs to
// be an indicator they can select noting it was a sale, and not normal price.
// This goes in to the trends for pricing of things over time, and might be
// seen as a little drop on the timeline."
//
// The reason this matters is that without it a price history quietly lies. One
// week at half price pulls an average down and reads as though a thing got
// cheaper, when what actually happened is that it was on offer once. Marking
// it keeps both facts: what was paid, and that it was not the usual price.
export function describeSaleLabel(onSale: boolean): string {
  return onSale ? 'On sale' : 'Normal price';
}

// --- Comparing two brands on the shelf --------------------------------------
//
// 2026-09-01, and the reasoning behind the request is the point of it: "I like
// the advice on pricing it per liter, but they won't know that unless they
// have a tool they can use to compare pricing per amount. That could be very
// useful in comparing pricing between competitive brands."
//
// Right. Quoting a price per litre on a line already priced is useful after
// the fact; it does nothing at the moment of choosing, standing in front of
// two bottles of different sizes at different prices. This is the sum people
// try to do in their head and mostly get wrong, because the bigger bottle is
// not reliably the cheaper one.

// The comparable number: price per litre or per kilo in metric, per fluid
// ounce or per ounce in imperial. Null wherever it cannot honestly be worked
// out, which is any row still being filled in.
export function unitPriceFor(
  price: number | null,
  size: number | null,
  form: PurchaseForm | null | undefined,
  system: 'metric' | 'imperial',
): number | null {
  if (price == null || size == null || size <= 0 || price < 0) return null;
  const perSmallUnit = price / size;
  // Metric sizes are entered in millilitres and grams, so the readable
  // comparison is a thousand of them. Imperial units are already the size
  // people compare on and are left alone. See describeUnitPrice.
  return system === 'imperial' ? perSmallUnit : perSmallUnit * 1000;
}

export function unitPriceLabelFor(
  form: PurchaseForm | null | undefined,
  system: 'metric' | 'imperial',
): string {
  if (system === 'imperial') return form === 'volume' ? 'per fl oz' : 'per oz';
  return form === 'volume' ? 'per litre' : 'per kg';
}

export type PriceComparisonInput = {
  label: string;
  price: number | null;
  size: number | null;
};

export type PriceComparisonRow = {
  label: string;
  unitPrice: number | null;
  display: string | null;
  // True for the cheapest per unit, and for a genuine tie. Only ever set once
  // at least two rows can actually be compared, since being the cheapest of
  // one thing means nothing.
  isBest: boolean;
  // How much dearer than the cheapest, as a percentage. Null for the cheapest
  // itself and for anything not yet comparable.
  dearerByPercent: number | null;
};

export function comparePrices(
  rows: PriceComparisonInput[],
  form: PurchaseForm | null | undefined,
  system: 'metric' | 'imperial',
): PriceComparisonRow[] {
  const label = unitPriceLabelFor(form, system);
  const unitPrices = rows.map((row) => unitPriceFor(row.price, row.size, form, system));
  const comparable = unitPrices.filter((value): value is number => value != null && value > 0);
  const cheapest = comparable.length >= 2 ? Math.min(...comparable) : null;

  return rows.map((row, index) => {
    const unitPrice = unitPrices[index];
    return {
      label: row.label,
      unitPrice,
      display: unitPrice == null ? null : `${formatMoney(unitPrice)} ${label}`,
      isBest: cheapest != null && unitPrice != null && unitPrice === cheapest,
      dearerByPercent:
        cheapest != null && unitPrice != null && unitPrice > cheapest
          ? Math.round(((unitPrice - cheapest) / cheapest) * 100)
          : null,
    };
  });
}
