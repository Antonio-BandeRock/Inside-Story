// Goals, and the one idea that makes them different from a savings target.
//
// Built 2026-09-05, pass 3 of the Finances rebuild, from a framing given
// directly and twice: "goals require costs to attain each goal, whether
// that cost is a trade of time, or goods, or actual money."
//
// That last part is the design, not a detail. Every budgeting app has a
// savings goal: a number, a date, a bar. This app already tracks harvests
// with real remaining quantities, ferments, therapy sessions with real
// durations and exercise with real minutes, so it can model a goal whose
// cost was never money without inventing anything. Restoring a garden bed
// costs lumber AND a weekend. Putting up a year of preserves costs jars,
// produce and hours. A tool that can only count dollars cannot see either.
//
// THE CENTRAL RULE: DIFFERENT KINDS OF COST ARE NEVER BLENDED.
//
// A goal needing $500 and 20 hours, with $250 and 10 hours put in, is not
// "50% done". It is half-funded and half-worked, which are two facts. And
// $500 with zero hours is not 50% either: the money is finished and the
// work has not started. Turning hours into dollars at some assumed rate
// would produce one confident number out of two honest ones, which is the
// invented figure this app refuses everywhere else.
//
// So progress is reported per cost line, the goal's own state is how many
// of its lines are met plus which one is furthest behind, and there is
// deliberately no single percentage for a goal anywhere in this file.
//
// ONE UNIT PER LINE, WHICH REMOVES CONVERSION ENTIRELY.
//
// A cost line carries its own unit and every contribution to it is in that
// unit, by construction. There is no hours-to-minutes or grams-to-pounds
// arithmetic here at all, and so no place for it to be wrong.

export type GoalCostKind = 'money' | 'time' | 'goods';

export const GOAL_COST_KINDS: { code: GoalCostKind; label: string; help: string }[] = [
  { code: 'money', label: 'Money', help: 'What it costs to buy, pay for or set aside.' },
  { code: 'time', label: 'Time', help: 'Hours of work, practice or effort it takes.' },
  { code: 'goods', label: 'Goods', help: 'Things you provide rather than buy: produce, jars, materials.' },
];

export function goalCostKindLabel(kind: string): string {
  return GOAL_COST_KINDS.find((entry) => entry.code === kind)?.label ?? kind;
}

/** The unit a kind is counted in. Money has one; the others are told. */
export function defaultUnitFor(kind: GoalCostKind): string {
  return kind === 'money' ? '' : kind === 'time' ? 'hours' : '';
}

export type GoalCost = {
  id: string;
  goalId: string;
  kind: GoalCostKind;
  /** What this cost is, in the person's words: "Lumber", "Building it". */
  label: string;
  target: number;
  /** Empty for money, which formats as currency. Free text otherwise. */
  unit: string;
};

export type GoalCostProgress = {
  cost: GoalCost;
  contributed: number;
  remaining: number;
  /** Clamped to 1 so a bar cannot overflow. `over` carries the excess. */
  fraction: number;
  met: boolean;
  over: number;
};

export function costProgress(cost: GoalCost, contributed: number): GoalCostProgress {
  const remaining = Math.max(0, cost.target - contributed);
  return {
    cost,
    contributed,
    remaining,
    fraction: cost.target > 0 ? Math.min(1, contributed / cost.target) : 0,
    met: cost.target > 0 && contributed >= cost.target,
    over: Math.max(0, contributed - cost.target),
  };
}

export type Goal = {
  id: string;
  name: string;
  /** Why it matters. A goal without a reason is a task with a number on it. */
  reason: string | null;
  targetDate: string | null;
  status: 'active' | 'reached' | 'given_up';
};

export type GoalProgress = {
  goal: Goal;
  costs: GoalCostProgress[];
  costsMet: number;
  costsTotal: number;
  /** Every line met. The only definition of a goal being done that does
   *  not require weighing one kind of cost against another. */
  allMet: boolean;
  /** The line furthest from done, which is the honest answer to "what is
   *  holding this up". Null when there are no costs, or all are met. */
  furthestBehind: GoalCostProgress | null;
  /** True when nothing has been contributed to anything yet. */
  notStarted: boolean;
};

export function goalProgress(goal: Goal, costs: GoalCostProgress[]): GoalProgress {
  const costsMet = costs.filter((entry) => entry.met).length;
  const unmet = costs.filter((entry) => !entry.met);
  // Furthest behind by SHARE remaining rather than by amount, since an
  // amount cannot be compared across kinds. 40 hours short and $40 short
  // are not orderable; 90% short and 10% short are.
  const furthestBehind = unmet.length > 0
    ? unmet.reduce((worst, entry) => (entry.fraction < worst.fraction ? entry : worst))
    : null;
  return {
    goal,
    costs,
    costsMet,
    costsTotal: costs.length,
    allMet: costs.length > 0 && costsMet === costs.length,
    furthestBehind,
    notStarted: costs.every((entry) => entry.contributed === 0),
  };
}

// --- What it would take to get there by then --------------------------------

export type Pace = {
  /** Per month, in the cost line's own unit. */
  perMonth: number;
  monthsLeft: number;
  /** True when the target date has passed and the line is not met. */
  overdue: boolean;
  /** True when the date is this month, so the whole remainder is due now
   *  rather than divided by a zero number of months. */
  dueNow: boolean;
};

export type PaceRefusal = { reason: 'noDate' | 'alreadyMet' | 'noTarget' };

/**
 * What has to go in each month for a line to be met by its goal's date.
 *
 * Refuses rather than guesses. Without a date there is nothing to divide
 * by and the answer is not zero, it is unanswerable, so it says which
 * piece is missing instead of producing a figure that looks computed.
 */
export function pace(progress: GoalCostProgress, targetDate: string | null, today: string): Pace | PaceRefusal {
  if (progress.met) return { reason: 'alreadyMet' };
  if (progress.cost.target <= 0) return { reason: 'noTarget' };
  if (!targetDate) return { reason: 'noDate' };

  const [ty, tm] = targetDate.slice(0, 7).split('-').map(Number);
  const [ny, nm] = today.slice(0, 7).split('-').map(Number);
  if (!ty || !tm || !ny || !nm) return { reason: 'noDate' };

  const monthsLeft = (ty - ny) * 12 + (tm - nm);
  if (monthsLeft < 0) {
    return { perMonth: progress.remaining, monthsLeft: 0, overdue: true, dueNow: true };
  }
  if (monthsLeft === 0) {
    return { perMonth: progress.remaining, monthsLeft: 0, overdue: false, dueNow: true };
  }
  return { perMonth: progress.remaining / monthsLeft, monthsLeft, overdue: false, dueNow: false };
}

export function isPaceRefusal(value: Pace | PaceRefusal): value is PaceRefusal {
  return 'reason' in value;
}

// --- Wording ----------------------------------------------------------------

export function formatGoalAmount(kind: GoalCostKind, amount: number, unit: string): string {
  if (kind === 'money') {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  // Rounded to one place, then trimmed, so 10 hours reads as "10 hours"
  // rather than "10.0 hours" while 10.5 keeps its half.
  const rounded = Math.round(amount * 10) / 10;
  const shown = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return unit.trim() ? `${shown} ${unit.trim()}` : shown;
}

export function describeCostProgress(progress: GoalCostProgress): string {
  const { cost } = progress;
  const put = formatGoalAmount(cost.kind, progress.contributed, cost.unit);
  const target = formatGoalAmount(cost.kind, cost.target, cost.unit);
  if (progress.met) {
    return progress.over > 0
      ? `${put} of ${target}, which is ${formatGoalAmount(cost.kind, progress.over, cost.unit)} past it.`
      : `${put} of ${target}. Done.`;
  }
  return `${put} of ${target}, ${formatGoalAmount(cost.kind, progress.remaining, cost.unit)} to go.`;
}

export function describePace(progress: GoalCostProgress, result: Pace | PaceRefusal): string | null {
  const { cost } = progress;
  if (isPaceRefusal(result)) {
    if (result.reason === 'alreadyMet' || result.reason === 'noTarget') return null;
    return 'Set a date on this goal and the app can say what that means each month.';
  }
  const amount = formatGoalAmount(cost.kind, result.perMonth, cost.unit);
  if (result.overdue) {
    return `The date has passed with ${formatGoalAmount(cost.kind, progress.remaining, cost.unit)} still to go. Either it moves, or this is what is left to find.`;
  }
  if (result.dueNow) return `All ${amount} of it falls in this month.`;
  return `About ${amount} a month for the next ${result.monthsLeft} ${result.monthsLeft === 1 ? 'month' : 'months'}.`;
}

export function describeGoalProgress(progress: GoalProgress): string {
  if (progress.costsTotal === 0) {
    return 'Nothing costed yet. Add what it will take, in money, time, or things you will provide, and this becomes something the app can track rather than a line of text.';
  }
  if (progress.allMet) {
    return `Everything this needed is in: all ${progress.costsTotal} ${progress.costsTotal === 1 ? 'cost' : 'costs'} met.`;
  }
  const behind = progress.furthestBehind;
  const lead = progress.notStarted
    ? `Nothing put in yet, across ${progress.costsTotal} ${progress.costsTotal === 1 ? 'cost' : 'costs'}.`
    : `${progress.costsMet} of ${progress.costsTotal} costs met.`;
  if (!behind) return lead;
  // Naming the laggard by kind is the point: it is what tells someone
  // whether the thing holding this up is money or a weekend.
  return `${lead} Furthest behind is ${behind.cost.label} (${goalCostKindLabel(behind.cost.kind).toLowerCase()}), ${formatGoalAmount(behind.cost.kind, behind.remaining, behind.cost.unit)} short.`;
}

// --- Across every goal at once ----------------------------------------------

export type GoalsSummary = {
  activeGoals: number;
  reachedGoals: number;
  /** Money wanted each month across every active goal that has a date.
   *  Money only, and that is the point: this is the one kind that can be
   *  added up, because it is the one kind measured in the same unit. */
  monthlyMoneyNeeded: number;
  /** Active money costs with no date, so no monthly figure exists for
   *  them. Reported so the total above is not read as complete. */
  moneyCostsWithoutDate: number;
  /** Time and goods costs still outstanding. Counted, never summed: two
   *  lines measured in hours and jars have no common total. */
  outstandingTimeCosts: number;
  outstandingGoodsCosts: number;
};

export function summarizeGoals(
  goals: { progress: GoalProgress }[],
  today: string,
): GoalsSummary {
  let monthlyMoneyNeeded = 0;
  let moneyCostsWithoutDate = 0;
  let outstandingTimeCosts = 0;
  let outstandingGoodsCosts = 0;
  let activeGoals = 0;
  let reachedGoals = 0;

  for (const { progress } of goals) {
    if (progress.goal.status === 'reached') { reachedGoals += 1; continue; }
    if (progress.goal.status !== 'active') continue;
    activeGoals += 1;

    for (const cost of progress.costs) {
      if (cost.met) continue;
      if (cost.cost.kind === 'time') { outstandingTimeCosts += 1; continue; }
      if (cost.cost.kind === 'goods') { outstandingGoodsCosts += 1; continue; }
      const result = pace(cost, progress.goal.targetDate, today);
      if (isPaceRefusal(result)) moneyCostsWithoutDate += 1;
      else monthlyMoneyNeeded += result.perMonth;
    }
  }

  return {
    activeGoals,
    reachedGoals,
    monthlyMoneyNeeded,
    moneyCostsWithoutDate,
    outstandingTimeCosts,
    outstandingGoodsCosts,
  };
}

export function describeGoalsSummary(summary: GoalsSummary): string {
  if (summary.activeGoals === 0) {
    return summary.reachedGoals > 0
      ? `Nothing on the go. ${summary.reachedGoals} ${summary.reachedGoals === 1 ? 'goal' : 'goals'} reached.`
      : 'Nothing here yet.';
  }
  const parts: string[] = [];
  if (summary.monthlyMoneyNeeded > 0) {
    parts.push(
      `Your goals want about ${formatGoalAmount('money', summary.monthlyMoneyNeeded, '')} a month between them to land on time.`,
    );
  }
  if (summary.moneyCostsWithoutDate > 0) {
    parts.push(
      `${summary.moneyCostsWithoutDate} money ${summary.moneyCostsWithoutDate === 1 ? 'cost has' : 'costs have'} no date, so ${summary.moneyCostsWithoutDate === 1 ? 'it is' : 'they are'} not in that figure.`,
    );
  }
  // Deliberately a count. Hours and jars have no shared total, and
  // inventing one would be the whole thing this file exists to avoid.
  const nonMoney: string[] = [];
  if (summary.outstandingTimeCosts > 0) {
    nonMoney.push(`${summary.outstandingTimeCosts} ${summary.outstandingTimeCosts === 1 ? 'call on your time' : 'calls on your time'}`);
  }
  if (summary.outstandingGoodsCosts > 0) {
    nonMoney.push(`${summary.outstandingGoodsCosts} ${summary.outstandingGoodsCosts === 1 ? 'thing' : 'things'} to provide`);
  }
  if (nonMoney.length > 0) {
    parts.push(`Also outstanding: ${nonMoney.join(' and ')}, which are not money and are not added into one number.`);
  }
  return parts.length > 0 ? parts.join(' ') : `${summary.activeGoals} on the go.`;
}
