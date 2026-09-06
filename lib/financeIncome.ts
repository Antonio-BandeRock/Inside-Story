// Income streams, and the reason the existing model could not hold the
// interesting ones.
//
// Built 2026-09-05, from a direct question: "Do we have a way to track
// multiple income streams? For instance, what if the user had a goal to add
// solar panels to their home so they can be able to feed more electricity
// into the grid than they use and could then receive a small monthly income
// from it? Or, maybe they sell their extra harvests, or do some other work
// on the side."
//
// SEVERAL STREAMS WERE ALREADY POSSIBLE. VARIABLE ONES WERE NOT.
//
// finance_recurring already holds any number of income rows, so a paycheck
// and a pension side by side were fine. But it stores ONE amount and treats
// it as what arrives every month, and all three examples above are income
// that does not do that:
//
//   Solar feed-in varies with sun, season and what the house used. July and
//   January are not the same month, and an average taken across a summer
//   would overstate the year badly.
//   Harvest sales vary with what is ripe, and stop entirely for months.
//   Side work varies with whether there was any work.
//
// So a variable stream has no amount to type. What it has is a history, and
// the honest figure comes from measuring that rather than from asking
// someone to guess a number the app then presents as fact. Same call already
// made for market-rate accounts: measure what happened, do not apply an
// assumed rate.
//
// WHAT A MONTH WITH NOTHING IN IT MEANS.
//
// The average here divides by the whole span from the first receipt to the
// last, not by the number of months that had money in them. A month where
// harvest sales earned nothing is a real month that earned nothing, and
// leaving it out would turn "about $40 a month across the year" into "about
// $120 a month" by quietly counting only the summer.

export type IncomeReceipt = { occurredOn: string; amount: number };

export type IncomeStreamStats = {
  total: number;
  receiptCount: number;
  /** First to last receipt month inclusive, so a gap counts as a month
   *  that earned nothing rather than being skipped. */
  spanMonths: number;
  monthsWithIncome: number;
  monthsWithNothing: number;
  averagePerMonth: number;
  bestMonth: { month: string; amount: number } | null;
  leanestMonth: { month: string; amount: number } | null;
  firstMonth: string;
  lastMonth: string;
};

function monthKey(date: string): string {
  return date.slice(0, 7);
}

function monthsBetweenInclusive(from: string, to: string): number {
  const [fy, fm] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  if (!fy || !fm || !ty || !tm) return 1;
  return Math.max(1, (ty - fy) * 12 + (tm - fm) + 1);
}

/**
 * What a stream has actually brought in. Null when there is nothing to
 * measure, rather than a set of zeroes that would read as a stream earning
 * nothing when it has simply never been recorded.
 */
export function incomeStreamStats(receipts: IncomeReceipt[]): IncomeStreamStats | null {
  if (receipts.length === 0) return null;

  const byMonth = new Map<string, number>();
  let total = 0;
  for (const receipt of receipts) {
    const key = monthKey(receipt.occurredOn);
    byMonth.set(key, (byMonth.get(key) ?? 0) + receipt.amount);
    total += receipt.amount;
  }

  const months = [...byMonth.keys()].sort();
  const firstMonth = months[0];
  const lastMonth = months[months.length - 1];
  const spanMonths = monthsBetweenInclusive(firstMonth, lastMonth);

  let bestMonth: { month: string; amount: number } | null = null;
  let leanestMonth: { month: string; amount: number } | null = null;
  for (const [month, amount] of byMonth) {
    if (!bestMonth || amount > bestMonth.amount) bestMonth = { month, amount };
    if (!leanestMonth || amount < leanestMonth.amount) leanestMonth = { month, amount };
  }

  return {
    total,
    receiptCount: receipts.length,
    spanMonths,
    monthsWithIncome: byMonth.size,
    monthsWithNothing: spanMonths - byMonth.size,
    averagePerMonth: total / spanMonths,
    bestMonth,
    leanestMonth,
    firstMonth,
    lastMonth,
  };
}

// --- What was expected against what arrived ---------------------------------

export type EstimateCheck = {
  estimate: number;
  measured: number;
  difference: number;
  /** Share the measured figure is of the estimate. 1 means bang on. */
  ratio: number;
  /** Off by more than a quarter either way, which is where an estimate has
   *  stopped being a useful stand-in for the real thing. */
  wayOff: boolean;
  direction: 'above' | 'below' | 'onTarget';
};

/** Below this there is not enough history for the comparison to mean
 *  anything, and a stream that has paid out once is not a trend. */
export const MIN_MONTHS_FOR_ESTIMATE_CHECK = 3;

export function checkEstimate(estimate: number, stats: IncomeStreamStats | null): EstimateCheck | null {
  if (!stats || estimate <= 0) return null;
  if (stats.spanMonths < MIN_MONTHS_FOR_ESTIMATE_CHECK) return null;
  const measured = stats.averagePerMonth;
  const difference = measured - estimate;
  const ratio = measured / estimate;
  return {
    estimate,
    measured,
    difference,
    ratio,
    wayOff: ratio < 0.75 || ratio > 1.25,
    direction: Math.abs(difference) < 0.005 ? 'onTarget' : difference > 0 ? 'above' : 'below',
  };
}

// --- Has the thing that produces it paid for itself yet? --------------------

export type Payback = {
  /** What it cost to create the stream, from the goal's money costs. */
  cost: number;
  returnedSoFar: number;
  stillToRecoup: number;
  averagePerMonth: number;
  /** At the rate it has ACTUALLY returned so far. Not a forecast of what it
   *  will do, and the wording says which. */
  monthsAtThisRate: number;
  monthsSoFar: number;
  recouped: boolean;
  /** True below a year of history, where a seasonal stream has not yet
   *  been through its own low season and any rate is flattering or harsh
   *  depending on which months happen to be in it. */
  tooShortForSeasons: boolean;
};

/** Under three months there is no rate worth quoting at all. */
export const MIN_MONTHS_FOR_PAYBACK = 3;
/** Under a year, a seasonal stream has not shown its whole shape. */
export const MONTHS_FOR_FULL_SEASONS = 12;

/**
 * Whether what was spent to create an income stream has come back yet.
 *
 * This is the question the solar example is really asking, and it is
 * answerable honestly because both halves are measured: the cost comes from
 * the goal's own money costs, and the return comes from receipts that
 * actually arrived. The rate is stated as the rate so far, never as what it
 * will do next.
 *
 * Refuses under three months, because a rate from one or two payouts is
 * arithmetic rather than information, and flags anything under a year,
 * because solar in July is not solar in January.
 */
export function payback(input: { cost: number; stats: IncomeStreamStats | null }): Payback | null {
  const { cost, stats } = input;
  if (!stats || cost <= 0) return null;
  if (stats.spanMonths < MIN_MONTHS_FOR_PAYBACK) return null;
  if (stats.averagePerMonth <= 0) return null;

  const stillToRecoup = Math.max(0, cost - stats.total);
  return {
    cost,
    returnedSoFar: stats.total,
    stillToRecoup,
    averagePerMonth: stats.averagePerMonth,
    monthsAtThisRate: Math.ceil(stillToRecoup / stats.averagePerMonth),
    monthsSoFar: stats.spanMonths,
    recouped: stats.total >= cost,
    tooShortForSeasons: stats.spanMonths < MONTHS_FOR_FULL_SEASONS,
  };
}

// --- Wording ----------------------------------------------------------------

export function formatIncomeMoney(value: number): string {
  const sign = value < 0 ? '-' : '';
  return `${sign}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function yearsAndMonths(months: number): string {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years === 0) return `${rest} ${rest === 1 ? 'month' : 'months'}`;
  const yearPart = `${years} ${years === 1 ? 'year' : 'years'}`;
  return rest === 0 ? yearPart : `${yearPart} and ${rest} ${rest === 1 ? 'month' : 'months'}`;
}

export function describeIncomeStream(stats: IncomeStreamStats | null): string {
  if (!stats) {
    return 'Nothing recorded against this yet. Record what arrives and the app works out what it actually brings in, rather than asking you to guess.';
  }
  const parts = [
    `${formatIncomeMoney(stats.total)} across ${stats.spanMonths} ${stats.spanMonths === 1 ? 'month' : 'months'}, from ${stats.receiptCount} ${stats.receiptCount === 1 ? 'payment' : 'payments'}. That averages ${formatIncomeMoney(stats.averagePerMonth)} a month.`,
  ];
  if (stats.monthsWithNothing > 0) {
    parts.push(
      `${stats.monthsWithNothing} of those ${stats.monthsWithNothing === 1 ? 'months brought' : 'months brought'} in nothing, and ${stats.monthsWithNothing === 1 ? 'it is' : 'they are'} in that average on purpose. Leaving empty months out would turn a modest year-round figure into a flattering summer one.`,
    );
  }
  if (stats.bestMonth && stats.leanestMonth && stats.bestMonth.month !== stats.leanestMonth.month) {
    parts.push(
      `Best month ${formatIncomeMoney(stats.bestMonth.amount)} (${stats.bestMonth.month}), leanest with anything in it ${formatIncomeMoney(stats.leanestMonth.amount)} (${stats.leanestMonth.month}).`,
    );
  }
  return parts.join(' ');
}

export function describeEstimateCheck(check: EstimateCheck | null): string | null {
  if (!check) return null;
  if (check.direction === 'onTarget') {
    return `Your estimate of ${formatIncomeMoney(check.estimate)} a month is what it has actually done.`;
  }
  const word = check.direction === 'above' ? 'more' : 'less';
  const line = `You put this at ${formatIncomeMoney(check.estimate)} a month and it has brought in ${formatIncomeMoney(check.measured)}, about ${formatIncomeMoney(Math.abs(check.difference))} a month ${word}.`;
  return check.wayOff
    ? `${line} That is far enough out that the figures built on the estimate are worth correcting.`
    : line;
}

export function describePayback(payback: Payback | null, streamName: string): string | null {
  if (!payback) return null;
  if (payback.recouped) {
    return `${streamName} has now returned ${formatIncomeMoney(payback.returnedSoFar)} against the ${formatIncomeMoney(payback.cost)} it cost. It has paid for itself, and everything from here is ahead.`;
  }
  const base = `${streamName} has returned ${formatIncomeMoney(payback.returnedSoFar)} of the ${formatIncomeMoney(payback.cost)} it cost, at ${formatIncomeMoney(payback.averagePerMonth)} a month so far. At that rate the rest takes about ${yearsAndMonths(payback.monthsAtThisRate)}.`;
  return payback.tooShortForSeasons
    ? `${base} That is measured over ${payback.monthsSoFar} ${payback.monthsSoFar === 1 ? 'month' : 'months'}, which is not yet a full year, so it has not been through its own quiet season. Treat the figure as early rather than settled.`
    : base;
}

// --- Every stream together --------------------------------------------------

export type StreamRollup = {
  name: string;
  category: string;
  /** Monthly figure being used for this stream: the measured average where
   *  there is one, the typed amount otherwise. */
  monthly: number;
  isMeasured: boolean;
  isEstimate: boolean;
};

export type IncomeMix = {
  streams: (StreamRollup & { share: number })[];
  total: number;
  /** How many streams are still resting on a typed number nobody has
   *  checked against what arrived. */
  restingOnEstimates: number;
  /** True when one stream is most of the income, which is worth knowing
   *  for its own sake: several streams are only diversification if none of
   *  them is nearly all of it. */
  concentrated: boolean;
  largestShare: number;
};

/** Above this, one stream is carrying the household rather than being one
 *  of several. A judgment call, named as one. */
export const CONCENTRATION_THRESHOLD = 0.7;

export function buildIncomeMix(streams: StreamRollup[]): IncomeMix {
  const total = streams.reduce((sum, stream) => sum + stream.monthly, 0);
  const withShare = streams
    .map((stream) => ({ ...stream, share: total > 0 ? stream.monthly / total : 0 }))
    .sort((a, b) => b.monthly - a.monthly);
  const largestShare = withShare.length > 0 ? withShare[0].share : 0;
  return {
    streams: withShare,
    total,
    restingOnEstimates: streams.filter((stream) => stream.isEstimate && !stream.isMeasured).length,
    concentrated: withShare.length > 1 && largestShare >= CONCENTRATION_THRESHOLD,
    largestShare,
  };
}

export function describeIncomeMix(mix: IncomeMix): string {
  if (mix.streams.length === 0) return 'No income added yet.';
  const parts = [
    `${formatIncomeMoney(mix.total)} a month across ${mix.streams.length} ${mix.streams.length === 1 ? 'stream' : 'streams'}.`,
  ];
  if (mix.concentrated) {
    const top = mix.streams[0];
    parts.push(
      `${top.name} is ${Math.round(mix.largestShare * 100)}% of it, so this reads as one income with extras rather than several you could lean on.`,
    );
  }
  if (mix.restingOnEstimates > 0) {
    parts.push(
      `${mix.restingOnEstimates} ${mix.restingOnEstimates === 1 ? 'stream is' : 'streams are'} still using a figure you typed rather than one measured from what arrived. Record the payments and the app can tell you whether it was right.`,
    );
  }
  return parts.join(' ');
}
