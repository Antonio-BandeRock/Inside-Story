// What a condition actually costs, and where you stand with the insurance
// that is supposed to be covering it.
//
// Added 2026-09-05, pass 1 of a rebuild after a direct and fair challenge:
// "What app did you look at to decide what should be in the finance lens?
// This is extremely minimal." The honest answer was none, and the first
// Finances build was a generic household budget that any app does better.
//
// This file is the part no general finance app does, and the reason
// Finances belongs in THIS app rather than being a link to Monarch. The
// money questions someone with a chronic condition actually has are not
// "what did I spend on groceries":
//
//   Where am I against my deductible and out-of-pocket maximum? That is
//   what decides whether a scan happens in December or January.
//
//   Is my FSA about to expire? It is use-it-or-lose-it, and forfeiting it
//   is a pure loss that a calendar reminder prevents.
//
//   Does this bill match the Explanation of Benefits? Billing errors are
//   common and are real money.
//
//   What has this condition cost me this year? The app already knows the
//   conditions, the therapies and the appointments.
//
// Pure and database-free, the same as lib/financeCore.ts and
// lib/financeSchedule.ts, so scripts/test_finance_health.js runs all of it
// with no device. Every failure here is a wrong number about someone's
// medical money, which is worse than most wrong numbers.
//
// TWO RULES THIS FILE DOES NOT BEND:
//
//   Nothing is estimated. A bill with no amount recorded is counted as a
//   gap and named, never filled in. Same refusal the grocery list makes
//   for a price with no weight.
//
//   Untagged cost is reported as untagged, never distributed across
//   conditions. Splitting $400 of unattributed medical spending evenly
//   across three tracked conditions would produce three confident,
//   invented figures.

export type BillStatus = 'unpaid' | 'paid' | 'disputed' | 'denied';

/**
 * One line of an Explanation of Benefits, which is the document that
 * actually says who owes what.
 *
 * The four money fields are deliberately separate rather than collapsed
 * into "what I owe", because the relationship between them is where
 * billing errors show up. `billed` is the provider's list price, `allowed`
 * is what the plan's contract says the service is worth, `insurancePaid`
 * is what the plan actually paid, and `youOwe` is the remainder. Any of
 * them can be null when the paperwork has not arrived yet.
 */
export type MedicalBill = {
  id: string;
  serviceDate: string;
  provider: string;
  description: string | null;
  billed: number | null;
  allowed: number | null;
  insurancePaid: number | null;
  youOwe: number | null;
  paidAmount: number | null;
  status: BillStatus;
  // How much of this counted toward the plan's deductible and toward the
  // out-of-pocket maximum. These are read off the EOB rather than derived,
  // because which services count toward which limit is plan-specific and
  // not something this app can work out.
  appliedToDeductible: number | null;
  appliedToOutOfPocket: number | null;
  // Which tracked condition this was for. Null is common and honest: a
  // broken wrist belongs to no tracked condition.
  conditionCode: string | null;
};

export type InsurancePlan = {
  id: string;
  name: string;
  // 'YYYY-MM-DD'. Plan years often do not start in January, which is
  // exactly why this is stored rather than assumed.
  yearStart: string;
  deductible: number | null;
  outOfPocketMax: number | null;
  // What was already met before this app started tracking, so someone
  // starting in June is not told they have met nothing. One honest field
  // rather than a second running total that could disagree with the bills.
  deductibleMetAtStart: number;
  outOfPocketMetAtStart: number;
};

export type HealthAccountKind = 'hsa' | 'fsa';

export type HealthAccount = {
  id: string;
  kind: HealthAccountKind;
  planYear: string;
  contributed: number;
  spent: number;
  // FSA money is forfeited after this date. An HSA has no deadline at all,
  // which is the whole difference between them, so this is nullable.
  deadline: string | null;
};

// --- Progress against a plan ------------------------------------------------

export type LimitProgress = {
  met: number;
  limit: number | null;
  remaining: number | null;
  // 0-1, or null when there is no limit set to measure against. Null
  // rather than 0 so a UI shows nothing instead of an empty bar implying
  // "you have met none of it".
  fraction: number | null;
  reached: boolean;
};

function progress(met: number, limit: number | null): LimitProgress {
  if (limit == null || limit <= 0) {
    return { met, limit: null, remaining: null, fraction: null, reached: false };
  }
  return {
    met,
    limit,
    remaining: Math.max(0, limit - met),
    fraction: Math.min(1, met / limit),
    reached: met >= limit,
  };
}

/** Bills whose service date falls inside the plan year starting `yearStart`. */
export function billsInPlanYear(bills: MedicalBill[], yearStart: string): MedicalBill[] {
  const start = yearStart.slice(0, 10);
  const [y, m, d] = start.split('-').map(Number);
  if (!y || !m || !d) return [];
  const endDate = new Date(y + 1, m - 1, d);
  const pad = (n: number) => String(n).padStart(2, '0');
  const end = `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}`;
  return bills.filter((bill) => bill.serviceDate >= start && bill.serviceDate < end);
}

export type PlanStanding = {
  deductible: LimitProgress;
  outOfPocket: LimitProgress;
  billCount: number;
  // Bills inside the plan year that have no deductible or out-of-pocket
  // figure recorded. Their money is missing from the progress above, and
  // saying so is the difference between a floor and a total.
  billsMissingAmounts: number;
};

export function planStanding(plan: InsurancePlan, bills: MedicalBill[]): PlanStanding {
  const inYear = billsInPlanYear(bills, plan.yearStart);

  let deductibleMet = plan.deductibleMetAtStart;
  let oopMet = plan.outOfPocketMetAtStart;
  let missing = 0;

  for (const bill of inYear) {
    if (bill.appliedToDeductible == null && bill.appliedToOutOfPocket == null) missing += 1;
    deductibleMet += bill.appliedToDeductible ?? 0;
    oopMet += bill.appliedToOutOfPocket ?? 0;
  }

  return {
    deductible: progress(deductibleMet, plan.deductible),
    outOfPocket: progress(oopMet, plan.outOfPocketMax),
    billCount: inYear.length,
    billsMissingAmounts: missing,
  };
}

/**
 * What the standing means for a decision, rather than just the numbers.
 *
 * Deliberately never says "so book the procedure now": that is a medical
 * and personal call, not one an app makes. It states what is true and
 * leaves the decision where it belongs.
 */
export function describePlanStanding(standing: PlanStanding): string {
  const { deductible, outOfPocket } = standing;

  if (deductible.limit == null && outOfPocket.limit == null) {
    return 'Add your plan’s deductible and out-of-pocket maximum, and this will show where you stand against them as bills come in.';
  }

  const parts: string[] = [];
  if (outOfPocket.reached) {
    parts.push('You have reached your out-of-pocket maximum for this plan year, so covered care should cost you nothing more until it resets.');
  } else if (deductible.reached) {
    parts.push('Your deductible is met, so your plan is now paying its share.');
    if (outOfPocket.remaining != null) {
      parts.push(`${formatHealthMoney(outOfPocket.remaining)} left before you reach your out-of-pocket maximum.`);
    }
  } else if (deductible.remaining != null) {
    parts.push(`${formatHealthMoney(deductible.remaining)} left on your deductible before your plan starts paying its share.`);
  }

  if (standing.billsMissingAmounts > 0) {
    const n = standing.billsMissingAmounts;
    parts.push(
      `${n} ${n === 1 ? 'bill has' : 'bills have'} no deductible figure recorded yet, so this is a floor rather than exactly where you stand.`,
    );
  }

  return parts.join(' ');
}

// --- HSA and FSA ------------------------------------------------------------

export type HealthAccountStanding = {
  account: HealthAccount;
  available: number;
  daysUntilDeadline: number | null;
  // Only ever true for an FSA with money left and a deadline in sight. An
  // HSA rolls over forever, so warning about one would be wrong.
  atRiskOfForfeit: boolean;
};

export const FORFEIT_WARNING_DAYS = 90;

export function healthAccountStanding(account: HealthAccount, today: string): HealthAccountStanding {
  const available = account.contributed - account.spent;
  let daysUntilDeadline: number | null = null;

  if (account.deadline) {
    const a = today.slice(0, 10).split('-').map(Number);
    const b = account.deadline.slice(0, 10).split('-').map(Number);
    if (a.length === 3 && b.length === 3 && a.every(Number.isFinite) && b.every(Number.isFinite)) {
      const MS = 86400000;
      daysUntilDeadline = Math.round(
        (new Date(b[0], b[1] - 1, b[2]).getTime() - new Date(a[0], a[1] - 1, a[2]).getTime()) / MS,
      );
    }
  }

  return {
    account,
    available,
    daysUntilDeadline,
    atRiskOfForfeit:
      account.kind === 'fsa' &&
      available > 0 &&
      daysUntilDeadline != null &&
      daysUntilDeadline >= 0 &&
      daysUntilDeadline <= FORFEIT_WARNING_DAYS,
  };
}

export function describeHealthAccount(standing: HealthAccountStanding): string {
  const { account, available, daysUntilDeadline } = standing;
  const label = account.kind === 'hsa' ? 'HSA' : 'FSA';

  if (account.kind === 'hsa') {
    return `${formatHealthMoney(available)} available. An HSA rolls over, so nothing here expires.`;
  }
  if (available <= 0) return `${label} is spent down. Nothing left to forfeit.`;
  if (daysUntilDeadline == null) {
    return `${formatHealthMoney(available)} left. Add the date your plan year money has to be spent by, and this will warn you before it is forfeited.`;
  }
  if (daysUntilDeadline < 0) return `${formatHealthMoney(available)} was left when the deadline passed. Check with your plan whether any grace period applies.`;
  if (standing.atRiskOfForfeit) {
    return `${formatHealthMoney(available)} has to be spent within ${daysUntilDeadline} ${daysUntilDeadline === 1 ? 'day' : 'days'} or it is forfeited.`;
  }
  return `${formatHealthMoney(available)} left, with ${daysUntilDeadline} days to use it.`;
}

// --- Does the bill add up? --------------------------------------------------

export type BillCheck = {
  // True only when every figure needed is present AND they reconcile.
  balances: boolean;
  // Null when the check cannot be run because a figure is missing. Null is
  // not the same as zero, and conflating them would report an unchecked
  // bill as a correct one.
  discrepancy: number | null;
  message: string;
};

// A cent either way is rounding, not an error.
const RECONCILE_TOLERANCE = 0.01;

/**
 * Checks the arithmetic an Explanation of Benefits is supposed to satisfy:
 * what the plan allowed, minus what insurance paid, is what you owe.
 *
 * The provider's billed amount is deliberately NOT part of the equation.
 * Billed above allowed is normal and is written off under the plan's
 * contract; treating that difference as money owed is the single most
 * common misreading of an EOB, and an app that repeated it would send
 * people to argue about a charge that was never theirs.
 */
export function checkBill(bill: MedicalBill): BillCheck {
  if (bill.allowed == null || bill.insurancePaid == null || bill.youOwe == null) {
    return {
      balances: false,
      discrepancy: null,
      message: 'Not enough of the Explanation of Benefits recorded yet to check this one.',
    };
  }

  const expected = bill.allowed - bill.insurancePaid;
  const discrepancy = bill.youOwe - expected;

  if (Math.abs(discrepancy) <= RECONCILE_TOLERANCE) {
    return { balances: true, discrepancy: 0, message: 'The amounts add up: allowed minus what insurance paid is what you owe.' };
  }

  const over = discrepancy > 0;
  return {
    balances: false,
    discrepancy,
    message: `You are billed ${formatHealthMoney(Math.abs(discrepancy))} ${over ? 'more' : 'less'} than allowed minus what insurance paid. Worth asking the provider or your plan about before paying it.`,
  };
}

// --- What a condition costs -------------------------------------------------

/**
 * Anything with a cost that can be attributed to a tracked condition.
 * Deliberately a flat shape rather than each source's own type: the
 * rollup does not care whether a cost came from a bill, a repeating
 * prescription, a therapy session or a one-off, only what it was for.
 */
export type ConditionCost = {
  amount: number;
  conditionCode: string | null;
  source: 'medicalBill' | 'recurring' | 'entry' | 'therapy';
};

export type ConditionCostTotal = {
  conditionCode: string;
  total: number;
  bySource: Record<string, number>;
};

export type ConditionCostRollup = {
  byCondition: ConditionCostTotal[];
  // Health spending that is real but not attributed to any condition.
  // Reported on its own and NEVER divided across conditions: splitting it
  // would turn one honest number into several invented ones.
  untagged: number;
  total: number;
};

export function rollUpConditionCosts(costs: ConditionCost[]): ConditionCostRollup {
  const byCondition = new Map<string, ConditionCostTotal>();
  let untagged = 0;
  let total = 0;

  for (const cost of costs) {
    if (!Number.isFinite(cost.amount) || cost.amount === 0) continue;
    total += cost.amount;

    if (!cost.conditionCode) {
      untagged += cost.amount;
      continue;
    }

    const existing = byCondition.get(cost.conditionCode) ?? {
      conditionCode: cost.conditionCode,
      total: 0,
      bySource: {},
    };
    existing.total += cost.amount;
    existing.bySource[cost.source] = (existing.bySource[cost.source] ?? 0) + cost.amount;
    byCondition.set(cost.conditionCode, existing);
  }

  return {
    byCondition: [...byCondition.values()].sort((a, b) => b.total - a.total),
    untagged,
    total,
  };
}

export function describeConditionCosts(rollup: ConditionCostRollup, conditionName: (code: string) => string): string {
  if (rollup.total === 0) {
    return 'Nothing has been attributed to a condition yet. Tag a bill, a repeating cost or a session with the condition it is for, and this fills in.';
  }
  if (rollup.byCondition.length === 0) {
    return `${formatHealthMoney(rollup.untagged)} of health spending recorded, none of it tagged to a condition yet.`;
  }

  const top = rollup.byCondition[0];
  const lead = `${conditionName(top.conditionCode)} accounts for ${formatHealthMoney(top.total)} of what you have recorded.`;

  if (rollup.untagged > 0) {
    return `${lead} A further ${formatHealthMoney(rollup.untagged)} is not tagged to any condition, and is left out of these figures rather than divided between them.`;
  }
  return lead;
}

// Same two-decimal, thousands-separated form as financeCore's own money
// formatting. Kept local rather than imported so this module stays pure of
// everything except its own subject, matching how the other finance
// modules are split.
export function formatHealthMoney(value: number): string {
  const negative = value < 0;
  const abs = Math.abs(value);
  const [whole, cents] = abs.toFixed(2).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${negative ? '-' : ''}$${grouped}.${cents}`;
}
