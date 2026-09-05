// Accounts, net worth, budget limits and debt payoff: the parts of a
// finance tool that every mainstream app has and the first Finances build
// did not.
//
// Added 2026-09-05, pass 2 of the rebuild. Pass 1 was the health-money
// layer, which is the part no general app does; this is the part every
// general app does and this one was missing, and it has to be here before
// Finances is credible as a finance tool at all.
//
// Pure and database-free, the same as the other finance modules, so
// scripts/test_finance_accounts.js runs all of it with no device. The debt
// simulation especially: it is a month-by-month loop over compounding
// interest, and a wrong answer there is a payoff date someone plans years
// around.

import { SET_ASIDE_GROUP, financeCategoryGroup } from './financeCategories';

// --- Accounts ---------------------------------------------------------------

export type AccountKind =
  | 'checking'
  | 'savings'
  | 'cash'
  | 'investment'
  | 'retirement'
  | 'property'
  | 'credit_card'
  | 'auto_loan'
  | 'student_loan'
  | 'mortgage'
  | 'medical_debt'
  | 'other_loan';

export type AccountKindDefinition = {
  code: AccountKind;
  label: string;
  // Whether money in it counts toward what you own or what you owe. This
  // is the property that decides the sign in every net-worth calculation,
  // which is why it lives on the kind rather than being re-decided at each
  // call site.
  side: 'asset' | 'liability';
  // Whether this kind of account has a rate at all, and if so whether it
  // is a knowable one. This is deliberately NOT the same line as asset
  // against liability, which is where the first version had it.
  //
  //   'stated'  A rate written in a contract: a card's APR, a loan's
  //             rate, a savings account's APY. It is printed on the
  //             statement, so what it does each month is arithmetic.
  //
  //   'market'  No rate exists. Investments, retirement and property
  //             change by whatever the market did. A long-run average
  //             return is a description of the past, not a rate anything
  //             is growing at, and applying it forward would put an
  //             invented number beside real balances.
  //
  //   'none'    Checking and cash. Nothing to ask for.
  //
  // A savings account is the case that proves the old line was wrong: an
  // asset with a stated rate. So was medical debt in reverse, a liability
  // that often carries no rate at all, which is why 'stated' here means
  // "ask for it", not "there must be one".
  rateKind: 'stated' | 'market' | 'none';
};

export const ACCOUNT_KINDS: AccountKindDefinition[] = [
  { code: 'checking', label: 'Checking', side: 'asset', rateKind: 'none' },
  { code: 'savings', label: 'Savings', side: 'asset', rateKind: 'stated' },
  { code: 'cash', label: 'Cash', side: 'asset', rateKind: 'none' },
  { code: 'investment', label: 'Investments', side: 'asset', rateKind: 'market' },
  { code: 'retirement', label: 'Retirement', side: 'asset', rateKind: 'market' },
  { code: 'property', label: 'Property or vehicle', side: 'asset', rateKind: 'market' },
  { code: 'credit_card', label: 'Credit card', side: 'liability', rateKind: 'stated' },
  { code: 'auto_loan', label: 'Car loan', side: 'liability', rateKind: 'stated' },
  { code: 'student_loan', label: 'Student loan', side: 'liability', rateKind: 'stated' },
  { code: 'mortgage', label: 'Mortgage', side: 'liability', rateKind: 'stated' },
  { code: 'medical_debt', label: 'Medical debt', side: 'liability', rateKind: 'stated' },
  { code: 'other_loan', label: 'Other loan', side: 'liability', rateKind: 'stated' },
];

/** Only a liability has a minimum payment. An APY does not come with one. */
export function carriesMinimumPayment(code: string): boolean {
  return accountKind(code)?.side === 'liability';
}

export function rateKindFor(code: string): 'stated' | 'market' | 'none' {
  return accountKind(code)?.rateKind ?? 'none';
}

export function accountKind(code: string): AccountKindDefinition | undefined {
  return ACCOUNT_KINDS.find((entry) => entry.code === code);
}

export function accountKindLabel(code: string): string {
  return accountKind(code)?.label ?? code;
}

export function isLiability(code: string): boolean {
  return accountKind(code)?.side === 'liability';
}

/**
 * `balance` is always the plain magnitude someone would read off a
 * statement, never a signed number. Nobody wants to type -1,240 for a
 * credit card, and asking them to is how sign errors get in.
 *
 * A negative balance is still allowed and still means the same thing in
 * both directions: an overdrawn checking account reduces what you own, and
 * a credit card in credit (they owe you) reduces what you owe.
 */
export type Account = {
  id: string;
  name: string;
  kind: AccountKind;
  balance: number;
  apr: number | null;
  minimumPayment: number | null;
  active: boolean;
};

export type NetWorth = {
  assets: number;
  liabilities: number;
  net: number;
  assetCount: number;
  liabilityCount: number;
};

export function netWorth(accounts: Account[]): NetWorth {
  let assets = 0;
  let liabilities = 0;
  let assetCount = 0;
  let liabilityCount = 0;

  for (const account of accounts) {
    if (!account.active) continue;
    if (isLiability(account.kind)) {
      liabilities += account.balance;
      liabilityCount += 1;
    } else {
      assets += account.balance;
      assetCount += 1;
    }
  }

  return { assets, liabilities, net: assets - liabilities, assetCount, liabilityCount };
}

// --- What a rate is doing right now -----------------------------------------

export type CarryCost = {
  // What the rate adds each month at the balance as it stands. Positive
  // for a debt (it costs) and positive for savings too (it earns); which
  // one is meant is carried by `direction` rather than by the sign, since
  // a negative number here would read as the rate being negative.
  monthly: number;
  yearly: number;
  direction: 'costs' | 'earns';
};

/**
 * What an interest rate is doing to an account this month, from the two
 * things someone typed in and nothing else.
 *
 * There is deliberately no assumption about payments here. Once you assume
 * a payment you are forecasting, and this is meant to be a fact: at this
 * balance and this rate, this much accrues. It is the number that turns a
 * card from a balance into a bill, and it is the one figure about a debt
 * most likely to change what someone does.
 *
 * Simple monthly interest (rate / 12) rather than a compounded effective
 * rate, because that is how a card statement computes a monthly finance
 * charge, and a figure that disagrees with the statement in the person's
 * hand would be worse than useless even if it were more precise.
 */
export function carryCost(input: { balance: number; apr: number | null; side: 'asset' | 'liability' }): CarryCost | null {
  if (input.apr == null || input.apr <= 0) return null;
  if (input.balance <= 0) return null;
  const yearly = input.balance * (input.apr / 100);
  return {
    monthly: yearly / 12,
    yearly,
    direction: input.side === 'liability' ? 'costs' : 'earns',
  };
}

/**
 * Every debt's interest added up. This exists because a card at 24.99% is
 * a bill in every sense that matters, it is just not one anybody sends
 * you, and before this it appeared nowhere outside the payoff comparison.
 */
export function totalMonthlyInterest(accounts: Account[]): { monthly: number; countedAccounts: number; missingRate: number } {
  let monthly = 0;
  let countedAccounts = 0;
  let missingRate = 0;
  for (const account of accounts) {
    if (!account.active || !isLiability(account.kind) || account.balance <= 0) continue;
    const cost = carryCost({ balance: account.balance, apr: account.apr, side: 'liability' });
    if (cost) {
      monthly += cost.monthly;
      countedAccounts += 1;
    } else {
      missingRate += 1;
    }
  }
  return { monthly, countedAccounts, missingRate };
}

// --- What actually happened, for accounts with no stated rate ---------------

export type BalancePoint = { date: string; balance: number; contribution: number };

export type MeasuredChange = {
  from: string;
  to: string;
  days: number;
  startBalance: number;
  endBalance: number;
  // What went in or came out between the two, when it was recorded. Null
  // when it was not, which changes what the figure is allowed to be called.
  netContribution: number | null;
  // The change once contributions are taken out of it. Equal to the plain
  // change when no contribution was recorded.
  gain: number;
  annualizedPercent: number;
  // False when contributions were never recorded, in which case this is
  // the change in the balance and NOT a return: money paid in looks
  // exactly like growth from a balance alone.
  isReturn: boolean;
};

/** Below this a rate cannot honestly be annualized: a week's move scaled
 *  up by 52 produces a number that is arithmetic but not information. */
export const MIN_DAYS_FOR_MEASURED_CHANGE = 30;

/**
 * The measured change in an account between the first and last balance
 * recorded for it. This is a measurement of what happened, not a forecast,
 * which is the whole reason it is allowed to exist for an account whose
 * rate is unknowable.
 *
 * It refuses rather than guesses in three cases, each of which would
 * otherwise produce a confident wrong number: fewer than two points, too
 * short a span to annualize, and a starting balance of zero or less, which
 * has no ratio to grow by.
 */
export function measuredChange(points: BalancePoint[]): MeasuredChange | null {
  if (points.length < 2) return null;
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (first.balance <= 0) return null;

  const days = Math.round((Date.parse(`${last.date}T00:00:00Z`) - Date.parse(`${first.date}T00:00:00Z`)) / 86400000);
  if (!Number.isFinite(days) || days < MIN_DAYS_FOR_MEASURED_CHANGE) return null;

  // Contributions recorded after the first point are the ones that landed
  // inside the span. The first point's own contribution belongs to
  // whatever came before it.
  const recorded = sorted.slice(1);
  const anyRecorded = recorded.some((point) => point.contribution !== 0);
  const netContribution = anyRecorded ? recorded.reduce((sum, point) => sum + point.contribution, 0) : null;

  const gain = last.balance - first.balance - (netContribution ?? 0);
  // Measured against the starting balance plus what was put in, since
  // money added part way through was not working for the whole span but
  // still has to be in the base or a large contribution reads as a loss.
  const base = first.balance + Math.max(0, netContribution ?? 0);
  const annualizedPercent = base > 0 ? (gain / base) * (365 / days) * 100 : 0;

  return {
    from: first.date,
    to: last.date,
    days,
    startBalance: first.balance,
    endBalance: last.balance,
    netContribution,
    gain,
    annualizedPercent,
    isReturn: netContribution != null,
  };
}

export function describeMeasuredChange(change: MeasuredChange): string {
  const fell = change.gain < 0;
  const span = `${formatAccountMoney(change.startBalance)} to ${formatAccountMoney(change.endBalance)} over ${change.days} days`;
  const amount = formatAccountMoney(Math.abs(change.gain));
  // The direction has to be attached to the rate and not only to the
  // amount. An account that lost money still produces a positive
  // percentage out of the arithmetic, and "about 8.3% a year" sitting under
  // a balance that fell reads as a gain.
  const rate = `${fell ? 'a fall' : 'a rise'} of about ${Math.abs(change.annualizedPercent).toFixed(1)}% a year`;

  if (!change.isReturn) {
    return `${span}, ${fell ? 'down' : 'up'} ${amount}, ${rate}. That is the change in the balance rather than a return: anything you paid in over that time is in it too. Record what you added when you update a balance and the two can be told apart.`;
  }
  const put = change.netContribution ?? 0;
  const moved = put >= 0 ? `you put in ${formatAccountMoney(put)}` : `you took out ${formatAccountMoney(Math.abs(put))}`;
  return `${span}, and ${moved}. That leaves ${amount} ${fell ? 'of loss' : 'of growth'}, ${rate}. Measured from what you entered, not from an assumed rate.`;
}

// --- Budget limits ----------------------------------------------------------

export type BudgetProgress = {
  category: string;
  limit: number;
  // What has actually been recorded against this category this month,
  // including money read from the grocery list and therapy sessions.
  spent: number;
  // What repeating bills in this category already commit every month.
  // Kept separate from `spent` rather than added into it, because those
  // are two different facts and adding them would double-count the month a
  // bill is both committed and recorded as paid.
  committed: number;
  remaining: number;
  fraction: number;
  overspent: boolean;
  // True when the repeating bills alone already exceed the limit, which is
  // a different and more serious problem than overspending: the budget can
  // never be met without changing the bills themselves.
  committedAlone: boolean;
};

export function budgetProgress(input: {
  category: string;
  limit: number;
  spent: number;
  committed: number;
}): BudgetProgress {
  const remaining = input.limit - input.spent;
  return {
    category: input.category,
    limit: input.limit,
    spent: input.spent,
    committed: input.committed,
    remaining,
    fraction: input.limit > 0 ? Math.min(1, input.spent / input.limit) : 0,
    overspent: input.spent > input.limit,
    committedAlone: input.committed > input.limit,
  };
}

// --- Setting aside for the bills that do not come monthly -------------------

export type SinkingFund = {
  name: string;
  amount: number;
  // The bill's own monthly-equivalent cost, from its due rule.
  monthlySetAside: number;
  nextDue: string | null;
  monthsUntilDue: number | null;
  // What ought to already be put by, if the setting-aside started right
  // after the last one was paid. Null when the next date is unknown.
  shouldHaveByNow: number | null;
};

/**
 * A bill that arrives once or twice a year is the one most likely to
 * derail a month, precisely because it is not in the monthly rhythm. This
 * turns each one into the amount that would have to be set aside monthly
 * for it to be covered when it lands.
 *
 * `monthsBetween` comes from the rule (12 for a yearly bill, 3 for a
 * quarterly one) rather than being inferred from dates, so a bill whose
 * next date is unknown still produces a monthly figure.
 */
export function sinkingFund(input: {
  name: string;
  amount: number;
  monthsBetween: number;
  nextDue: string | null;
  today: string;
}): SinkingFund {
  const monthlySetAside = input.monthsBetween > 0 ? input.amount / input.monthsBetween : input.amount;

  let monthsUntilDue: number | null = null;
  if (input.nextDue) {
    const [ny, nm] = input.nextDue.slice(0, 7).split('-').map(Number);
    const [ty, tm] = input.today.slice(0, 7).split('-').map(Number);
    if (ny && nm && ty && tm) monthsUntilDue = Math.max(0, (ny - ty) * 12 + (nm - tm));
  }

  const shouldHaveByNow =
    monthsUntilDue == null
      ? null
      : Math.max(0, Math.min(input.amount, (input.monthsBetween - monthsUntilDue) * monthlySetAside));

  return { name: input.name, amount: input.amount, monthlySetAside, nextDue: input.nextDue, monthsUntilDue, shouldHaveByNow };
}

// --- Debt payoff ------------------------------------------------------------

export type PayoffStrategy = 'avalanche' | 'snowball';

export type Debt = {
  id: string;
  name: string;
  balance: number;
  // Annual percentage rate, as a percent (18.99 rather than 0.1899).
  apr: number;
  minimumPayment: number;
};

export type PayoffStep = { debtId: string; name: string; clearedInMonth: number };

export type PayoffResult = {
  strategy: PayoffStrategy;
  months: number | null;
  totalInterest: number | null;
  order: PayoffStep[];
  // True when the payments on offer do not cover the interest, so the
  // balances never fall. Reported rather than looped over forever, and
  // reported as its own state rather than as a very large number of
  // months, because "you will never pay this off at this rate" is a
  // different fact from "this takes a long time".
  neverPaysOff: boolean;
  stuckDebts: string[];
};

// Fifty years. Past this, a payoff date is not a plan anyone is making.
const MAX_MONTHS = 600;

function monthlyRate(apr: number): number {
  return apr / 100 / 12;
}

/**
 * Simulates paying debts off month by month.
 *
 * Both strategies pay the minimum on everything and put every spare dollar
 * at one target debt, rolling each cleared debt's payment into the next.
 * The only difference is which debt is the target: avalanche picks the
 * highest interest rate, which is always mathematically cheaper; snowball
 * picks the smallest balance, which clears debts sooner and is easier to
 * keep going with. Neither is presented as the right answer, because that
 * is a judgment about a person rather than about arithmetic.
 */
export function simulatePayoff(debts: Debt[], extraMonthly: number, strategy: PayoffStrategy): PayoffResult {
  const active = debts
    .filter((debt) => debt.balance > 0)
    .map((debt) => ({ ...debt, remaining: debt.balance }));

  if (active.length === 0) {
    return { strategy, months: 0, totalInterest: 0, order: [], neverPaysOff: false, stuckDebts: [] };
  }

  // Ordered once, up front. The target changes as debts clear, but the
  // ordering rule does not, and re-sorting every month on the CURRENT
  // balance would make snowball chase whichever debt happens to be
  // smallest that month rather than working through them.
  const order = [...active].sort((a, b) =>
    strategy === 'avalanche' ? b.apr - a.apr || a.remaining - b.remaining : a.remaining - b.remaining || b.apr - a.apr,
  );

  // Computed ONCE, from every debt's minimum plus the extra, and held
  // constant for the whole simulation. This is the entire point of both
  // strategies: when a debt clears you keep paying the same total, and its
  // old payment goes to the next one. Recomputing this each month from only
  // the still-open debts shrinks the payment as debts clear, which is the
  // opposite of rolling it forward and collapses both strategies into
  // "pay the minimums". That was the first version, and the test expecting
  // a clean 15 months caught it at 20.
  const monthlyCommitment = extraMonthly + active.reduce((sum, item) => sum + item.minimumPayment, 0);

  let totalInterest = 0;
  const cleared: PayoffStep[] = [];

  for (let month = 1; month <= MAX_MONTHS; month += 1) {
    const before = order.reduce((sum, debt) => sum + debt.remaining, 0);
    if (before <= 0) return { strategy, months: month - 1, totalInterest, order: cleared, neverPaysOff: false, stuckDebts: [] };

    for (const debt of order) {
      if (debt.remaining <= 0) continue;
      const interest = debt.remaining * monthlyRate(debt.apr);
      debt.remaining += interest;
      totalInterest += interest;
    }

    let pool = monthlyCommitment;

    // Minimums first on everything that is not the target, so the target
    // gets the remainder.
    const openDebts = order.filter((debt) => debt.remaining > 0);
    const target = openDebts[0];
    for (const debt of openDebts) {
      if (debt === target) continue;
      const pay = Math.min(debt.minimumPayment, debt.remaining, pool);
      debt.remaining -= pay;
      pool -= pay;
    }
    // Then everything left, target first, spilling onward as debts clear.
    for (const debt of openDebts) {
      if (pool <= 0) break;
      if (debt.remaining <= 0) continue;
      const pay = Math.min(pool, debt.remaining);
      debt.remaining -= pay;
      pool -= pay;
    }

    for (const debt of order) {
      if (debt.remaining <= 0.005 && !cleared.some((step) => step.debtId === debt.id)) {
        debt.remaining = 0;
        cleared.push({ debtId: debt.id, name: debt.name, clearedInMonth: month });
      }
    }

    const after = order.reduce((sum, debt) => sum + debt.remaining, 0);
    if (after <= 0.005) {
      return { strategy, months: month, totalInterest, order: cleared, neverPaysOff: false, stuckDebts: [] };
    }
    // Nothing moved, and nothing will. Interest is outrunning the payments.
    if (after >= before - 0.005) {
      return {
        strategy,
        months: null,
        totalInterest: null,
        order: cleared,
        neverPaysOff: true,
        stuckDebts: order.filter((debt) => debt.remaining > 0).map((debt) => debt.name),
      };
    }
  }

  return {
    strategy,
    months: null,
    totalInterest: null,
    order: cleared,
    neverPaysOff: true,
    stuckDebts: order.filter((debt) => debt.remaining > 0).map((debt) => debt.name),
  };
}

export type PayoffComparison = {
  avalanche: PayoffResult;
  snowball: PayoffResult;
  // Positive when avalanche costs less in interest, which it always does
  // or ties. Null when either could not be simulated.
  interestSavedByAvalanche: number | null;
  monthsSavedByAvalanche: number | null;
};

export function comparePayoffStrategies(debts: Debt[], extraMonthly: number): PayoffComparison {
  const avalanche = simulatePayoff(debts, extraMonthly, 'avalanche');
  const snowball = simulatePayoff(debts, extraMonthly, 'snowball');
  const bothRan = avalanche.totalInterest != null && snowball.totalInterest != null;

  return {
    avalanche,
    snowball,
    interestSavedByAvalanche: bothRan ? (snowball.totalInterest as number) - (avalanche.totalInterest as number) : null,
    monthsSavedByAvalanche:
      avalanche.months != null && snowball.months != null ? snowball.months - avalanche.months : null,
  };
}

export function describePayoff(comparison: PayoffComparison): string {
  const { avalanche, snowball, interestSavedByAvalanche } = comparison;

  if (avalanche.neverPaysOff) {
    const names = avalanche.stuckDebts.join(', ');
    return `At these payments the interest is keeping up with what is being paid, so ${names} would not clear. Raising the payment, or lowering the rate, is what changes that.`;
  }
  if (avalanche.months === 0) return 'Nothing owed. Nothing to plan.';

  const years = Math.floor((avalanche.months ?? 0) / 12);
  const months = (avalanche.months ?? 0) % 12;
  const span = years > 0 ? `${years} ${years === 1 ? 'year' : 'years'}${months ? ` and ${months} months` : ''}` : `${months} months`;

  if (interestSavedByAvalanche == null || interestSavedByAvalanche < 1) {
    return `Either order clears everything in about ${span}, and they cost about the same in interest. Pick whichever you will actually keep up with.`;
  }
  // The same amount goes out every month under either order, so it is
  // easy to assume they must finish together. They do not: paying less
  // interest means less to pay in total, so the cheaper order is usually
  // also the shorter one. Saying how much shorter is worth doing, because
  // "a bit less interest" and "three months of your life" land
  // differently.
  const extraMonths =
    snowball.months != null && avalanche.months != null ? snowball.months - avalanche.months : 0;
  const longer =
    extraMonths > 0 ? `, and finishes ${extraMonths} ${extraMonths === 1 ? 'month' : 'months'} sooner` : '';

  // What smallest-balance-first is actually for. Stated as a month rather
  // than as a feeling, so it can be weighed against the figures above it
  // instead of being the vague reassuring option.
  const avalancheFirst = avalanche.order[0]?.clearedInMonth;
  const snowballFirst = snowball.order[0]?.clearedInMonth;
  const sooner =
    avalancheFirst != null && snowballFirst != null && snowballFirst < avalancheFirst
      ? ` Smallest balance first is gone from its first debt in month ${snowballFirst} rather than month ${avalancheFirst}, which some people find easier to keep going with.`
      : ' Smallest balance first clears individual debts sooner, which some people find easier to keep going with.';

  return `Highest rate first clears everything in ${span}, costs ${formatAccountMoney(interestSavedByAvalanche)} less in interest than smallest balance first${longer}.${sooner}`;
}

export function formatAccountMoney(value: number): string {
  const negative = value < 0;
  const abs = Math.abs(value);
  const [whole, cents] = abs.toFixed(2).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${negative ? '-' : ''}$${grouped}.${cents}`;
}

// Re-exported so the budgets UI can leave savings categories out of a
// spending limit: budgeting a limit on money you are deliberately setting
// aside would report saving more as overspending.
export function isSetAsideCategory(category: string): boolean {
  return financeCategoryGroup(category) === SET_ASIDE_GROUP;
}
