// What happens to extra harvest, when it does not get eaten.
//
// Built 2026-09-05, from a direct extension of the income-streams work: "A
// sale via a harvest could be through a trade as well, and not monetary.
// They could have traded their extra potatoes for ears of corn, etc. In that
// case the receipt of goods would go directly into the kitchen as part of the
// food inventory."
//
// Three things can happen to a surplus, and they are structurally different:
//
//   sold    goods out, money in       -> an income receipt
//   traded  goods out, goods in       -> kitchen inventory, no money at all
//   given   goods out, nothing back   -> still worth recording
//
// A trade is the interesting one, because every budgeting tool would either
// ignore it or fake a price for it. It is real economic activity with no
// money in it anywhere.
//
// WHAT A TRADE IS WORTH, WHICH IS MOSTLY NOTHING.
//
// This app already settled the general question and the answer went the
// austere way: where the garden covered a grocery line, that is reported as a
// COUNT of lines that did not have to be bought, never a dollar saving,
// because what the produce would have cost is genuinely unknown and pricing
// it would be an invented number.
//
// A trade has one narrow exception, and it turns on a real distinction. If
// the app holds a RECORDED price for the food received, from an actual past
// grocery trip, then "what would this have cost me" is not unknown: it is
// measured, from that person's own shopping. So it can honestly say "8 kg of
// corn, and you last paid $2.40 a kg for corn, so about $19 you did not
// spend." Where there is no recorded price, it says nothing.
//
// Two hard rules follow, and both are tested:
//
//   1. That figure is an AVOIDED COST and never income. No money arrived. It
//      must never reach the income mix, or the "$X a month across N streams"
//      total would include money that does not exist.
//   2. It is only computed when the recorded price's unit MATCHES the unit
//      received. A price per package has no per-kilo meaning without a size,
//      and converting would be the invented number again by a longer route.
//      Same refusal mergeShoppingAmounts already makes about crossing weight
//      and volume.
//
// WHAT WAS GIVEN IS NEVER VALUED.
//
// Only the receiving side can be measured, and only sometimes. What someone's
// own potatoes were worth is exactly the unknown this app refuses to invent,
// and a trade valued on both sides would also be double counting one event.

export type DispositionKind = 'sold' | 'traded' | 'given';

export const DISPOSITION_KINDS: { code: DispositionKind; label: string; help: string }[] = [
  { code: 'sold', label: 'Sold it', help: 'Money came in. It can count toward an income stream.' },
  { code: 'traded', label: 'Traded it', help: 'Goods came back instead of money, and go into your kitchen.' },
  { code: 'given', label: 'Gave it away', help: 'Nothing back, and still worth having on record.' },
];

export function dispositionLabel(kind: string): string {
  return DISPOSITION_KINDS.find((entry) => entry.code === kind)?.label ?? kind;
}

/** One thing received in a trade, which becomes a kitchen item. */
export type ReceivedGood = {
  foodName: string;
  quantity: number;
  unit: string;
  foodId?: string | null;
  category?: string;
};

/** A price this person actually paid for a food, from a past grocery trip. */
export type RecordedPrice = { price: number; unit: string; on: string };

export type AvoidedCost = {
  foodName: string;
  quantity: number;
  unit: string;
  pricePaid: number;
  pricedOn: string;
  amount: number;
};

export type ValuationResult = {
  /** Goods that could be valued, because a matching recorded price exists. */
  valued: AvoidedCost[];
  /** Goods that could not be, and why, so the total is never read as whole. */
  unvalued: { foodName: string; quantity: number; unit: string; reason: 'noRecordedPrice' | 'differentUnit' }[];
  /** What the valued goods would have cost at what was actually paid before.
   *  An avoided cost. Never income, and never added to one. */
  avoidedCost: number;
};

/**
 * What the goods received in a trade would have cost, using only prices this
 * person has actually paid before.
 *
 * Refuses per item rather than in bulk, so a trade of three things where one
 * has a known price reports that one and names the other two, instead of
 * either guessing or going silent.
 */
export function valueReceivedGoods(
  received: ReceivedGood[],
  lastPaid: Record<string, RecordedPrice | undefined>,
): ValuationResult {
  const valued: AvoidedCost[] = [];
  const unvalued: ValuationResult['unvalued'] = [];

  for (const good of received) {
    const price = lastPaid[good.foodName.toLowerCase()];
    if (!price || price.price <= 0) {
      unvalued.push({ foodName: good.foodName, quantity: good.quantity, unit: good.unit, reason: 'noRecordedPrice' });
      continue;
    }
    // Units must match exactly. A price recorded per package says nothing
    // about a kilo without a size, and this is where a plausible-looking
    // conversion would smuggle in a made-up figure.
    if (normalizeUnit(price.unit) !== normalizeUnit(good.unit)) {
      unvalued.push({ foodName: good.foodName, quantity: good.quantity, unit: good.unit, reason: 'differentUnit' });
      continue;
    }
    valued.push({
      foodName: good.foodName,
      quantity: good.quantity,
      unit: good.unit,
      pricePaid: price.price,
      pricedOn: price.on,
      amount: price.price * good.quantity,
    });
  }

  return { valued, unvalued, avoidedCost: valued.reduce((sum, entry) => sum + entry.amount, 0) };
}

function normalizeUnit(unit: string): string {
  return unit.trim().toLowerCase().replace(/s$/, '');
}

export function describeValuation(result: ValuationResult): string | null {
  if (result.valued.length === 0 && result.unvalued.length === 0) return null;
  const parts: string[] = [];

  if (result.valued.length > 0) {
    const items = result.valued
      .map((entry) => `${formatQuantity(entry.quantity, entry.unit)} of ${entry.foodName} at the ${formatTradeMoney(entry.pricePaid)} a ${normalizeUnit(entry.unit)} you paid on ${entry.pricedOn}`)
      .join(', ');
    parts.push(
      `About ${formatTradeMoney(result.avoidedCost)} you did not have to spend: ${items}. That is money you kept, not money you earned, so it stays out of your income.`,
    );
  }

  if (result.unvalued.length > 0) {
    const noPrice = result.unvalued.filter((entry) => entry.reason === 'noRecordedPrice');
    const wrongUnit = result.unvalued.filter((entry) => entry.reason === 'differentUnit');
    if (noPrice.length > 0) {
      parts.push(
        `${noPrice.map((entry) => entry.foodName).join(', ')} ${noPrice.length === 1 ? 'has' : 'have'} no price you have ever recorded, so ${noPrice.length === 1 ? 'it is' : 'they are'} counted and not priced.`,
      );
    }
    if (wrongUnit.length > 0) {
      parts.push(
        `${wrongUnit.map((entry) => entry.foodName).join(', ')} ${wrongUnit.length === 1 ? 'was' : 'were'} last priced in a different unit, and converting between them would be a guess, so ${wrongUnit.length === 1 ? 'it is' : 'they are'} left unpriced.`,
      );
    }
  }

  return parts.join(' ');
}

// --- What the surplus has done over a stretch of time -----------------------

export type DispositionRecord = {
  id: string;
  occurredOn: string;
  kind: DispositionKind;
  foodName: string;
  quantityGiven: number;
  unit: string;
  withWhom: string | null;
  /** Sales only. */
  amount: number | null;
  received: ReceivedGood[];
};

export type SurplusSummary = {
  sales: number;
  salesTotal: number;
  trades: number;
  /** Distinct foods that came back through trading, counted rather than
   *  totalled: kilos of corn and dozens of eggs have no shared total. */
  goodsReceivedCount: number;
  gifts: number;
  /** Every disposition, by the food that went out, so "what has the potato
   *  patch actually done" is answerable. */
  byFood: { foodName: string; quantityGiven: number; unit: string; kinds: DispositionKind[] }[];
  /** Sales with no income stream attached, so a total is not read as the
   *  whole picture of what selling has brought in. */
  salesWithoutStream: number;
};

export function summarizeSurplus(records: DispositionRecord[]): SurplusSummary {
  let sales = 0;
  let salesTotal = 0;
  let trades = 0;
  let gifts = 0;
  let goodsReceivedCount = 0;
  let salesWithoutStream = 0;

  // Keyed by food AND unit: 3 kg and 3 bunches of the same food are not 6 of
  // anything, and adding them would be the conversion this file refuses.
  const byFood = new Map<string, { foodName: string; quantityGiven: number; unit: string; kinds: Set<DispositionKind> }>();

  for (const record of records) {
    if (record.kind === 'sold') {
      sales += 1;
      salesTotal += record.amount ?? 0;
      if (record.amount == null) salesWithoutStream += 1;
    } else if (record.kind === 'traded') {
      trades += 1;
      goodsReceivedCount += record.received.length;
    } else {
      gifts += 1;
    }

    const key = `${record.foodName.toLowerCase()}|${normalizeUnit(record.unit)}`;
    const existing = byFood.get(key);
    if (existing) {
      existing.quantityGiven += record.quantityGiven;
      existing.kinds.add(record.kind);
    } else {
      byFood.set(key, {
        foodName: record.foodName,
        quantityGiven: record.quantityGiven,
        unit: record.unit,
        kinds: new Set([record.kind]),
      });
    }
  }

  return {
    sales,
    salesTotal,
    trades,
    goodsReceivedCount,
    gifts,
    salesWithoutStream,
    byFood: [...byFood.values()]
      .map((entry) => ({ ...entry, kinds: [...entry.kinds] }))
      .sort((a, b) => b.quantityGiven - a.quantityGiven),
  };
}

export function describeSurplus(summary: SurplusSummary): string {
  const total = summary.sales + summary.trades + summary.gifts;
  if (total === 0) {
    return 'Nothing recorded going out yet. When a harvest is more than you can eat, this is where selling it, trading it, or passing it on gets written down.';
  }
  const parts: string[] = [];
  if (summary.sales > 0) {
    parts.push(`${summary.sales} ${summary.sales === 1 ? 'sale' : 'sales'} bringing in ${formatTradeMoney(summary.salesTotal)}.`);
  }
  if (summary.trades > 0) {
    // Counted, never valued in one figure. What came back is food, and its
    // worth is only knowable where a price was actually paid for it before.
    parts.push(
      `${summary.trades} ${summary.trades === 1 ? 'trade' : 'trades'} bringing back ${summary.goodsReceivedCount} ${summary.goodsReceivedCount === 1 ? 'thing' : 'things'} into your kitchen, with no money involved either way.`,
    );
  }
  if (summary.gifts > 0) {
    parts.push(`${summary.gifts} ${summary.gifts === 1 ? 'lot' : 'lots'} given away.`);
  }
  return parts.join(' ');
}

// --- Formatting -------------------------------------------------------------

export function formatTradeMoney(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatQuantity(amount: number, unit: string): string {
  const rounded = Math.round(amount * 100) / 100;
  const shown = Number.isInteger(rounded) ? String(rounded) : String(rounded);
  return unit.trim() ? `${shown} ${unit.trim()}` : shown;
}
