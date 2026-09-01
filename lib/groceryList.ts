// The Grocery List's own pure logic: what a price actually means, what a
// line comes to, and what a whole list comes to. Kept out of lib/db.ts on
// purpose (the same split lib/quickLog.ts already established) so every
// one of these can be reasoned about, and tested, without a database.
//
// 2026-09-01, from the specification given on 2026-08-30: pick how many
// days of the schedule to shop for, say how many people, and the app works
// out how much of each ingredient every scheduled dish needs. Then it is
// carried into a shop, checked off, and priced.

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
export type GroceryPriceUnit = 'total' | 'each' | 'lb' | 'kg';

export const GROCERY_PRICE_UNITS: GroceryPriceUnit[] = ['total', 'each', 'lb', 'kg'];

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
  if (line.purchasedQuantity == null) return null;
  return line.price * line.purchasedQuantity;
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
