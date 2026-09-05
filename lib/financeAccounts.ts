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
  // Liabilities carry an interest rate and a minimum payment; assets do
  // not, and asking for them would be noise.
  carriesDebtTerms: boolean;
};

export const ACCOUNT_KINDS: AccountKindDefinition[] = [
  { code: 'checking', label: 'Checking', side: 'asset', carriesDebtTerms: false },
  { code: 'savings', label: 'Savings', side: 'asset', carriesDebtTerms: false },
  { code: 'cash', label: 'Cash', side: 'asset', carriesDebtTerms: false },
  { code: 'investment', label: 'Investments', side: 'asset', carriesDebtTerms: false },
  { code: 'retirement', label: 'Retirement', side: 'asset', carriesDebtTerms: false },
  { code: 'property', label: 'Property or vehicle', side: 'asset', carriesDebtTerms: false },
  { code: 'credit_card', label: 'Credit card', side: 'liability', carriesDebtTerms: true },
  { code: 'auto_loan', label: 'Car loan', side: 'liability', carriesDebtTerms: true },
  { code: 'student_loan', label: 'Student loan', side: 'liability', carriesDebtTerms: true },
  { code: 'mortgage', label: 'Mortgage', side: 'liability', carriesDebtTerms: true },
  { code: 'medical_debt', label: 'Medical debt', side: 'liability', carriesDebtTerms: true },
  { code: 'other_loan', label: 'Other loan', side: 'liability', carriesDebtTerms: true },
];

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
