// Things that need doing again, and things that run out.
//
// Built 2026-09-05. Life's fourth area, chosen over the alternatives because
// the mechanism was already proven three times in the same day and because the
// documents half is load-bearing for anyone living somewhere their papers have
// to be renewed.
//
// WHY THIS DOES NOT REUSE DueRule, WHICH LOOKS LIKE THE OBVIOUS ANSWER.
//
// lib/financeSchedule.ts already models "the second Tuesday of every third
// month" for bills, and forcing upkeep through it was the first plan. It is
// wrong, and the reason is worth keeping:
//
//   A BILL is calendar-anchored. Rent arrives on the 1st whether or not you
//   did anything, so its next date comes from a rule about the calendar.
//
//   A SERVICE is last-done-anchored. A boiler serviced in March is next due
//   the following March, not next January. Its next date comes from when you
//   last did it plus how often it needs doing.
//
// Reusing the bill machinery would have quietly told someone their boiler was
// due in January because that is when the rule fired, regardless of the service
// three months earlier. Same-looking shape, different semantics.
//
// TWO SHAPES, THEREFORE.
//
//   recurring  needs doing again every so often, counted from the last time.
//              Servicing, filters, gutters, descaling.
//   expires    has one date and then it is over. A passport, a registration,
//              a warranty. Some renew and some just end, which is stored,
//              because "renew this" and "this is finished" are different
//              things to be told.
//
// WHAT THIS FILE WILL NOT DO.
//
// It never says something is required. Whether a vehicle must be inspected, or
// how long a licence lasts, depends entirely on where someone lives, and the
// app holds what they told it rather than asserting a rule. Same line
// constants/workBenefitPrompts.ts already holds, and the same correction from
// earlier the same day that produced it.
//
// It never invents a cost. An item with no cost recorded is counted and named,
// and any total built over them says how many are missing and calls itself a
// floor, which is the rule the grocery list has held since it shipped.

export type UpkeepCadence = 'recurring' | 'expires';

export type UpkeepCategory = 'home' | 'vehicle' | 'document' | 'other';

export const UPKEEP_CATEGORIES: { code: UpkeepCategory; label: string; example: string }[] = [
  { code: 'home', label: 'Home', example: 'Boiler service, gutters, water filter' },
  { code: 'vehicle', label: 'Vehicle', example: 'Service, tyres, registration' },
  { code: 'document', label: 'Documents', example: 'Passport, licence, residency, insurance' },
  { code: 'other', label: 'Something else', example: 'Anything with a date on it' },
];

export function upkeepCategoryLabel(code: string): string {
  return UPKEEP_CATEGORIES.find((entry) => entry.code === code)?.label ?? code;
}

export type UpkeepItem = {
  id: string;
  name: string;
  category: UpkeepCategory;
  cadence: UpkeepCadence;
  /** Recurring only: how many months between doings. */
  intervalMonths: number | null;
  /** Recurring only: when it was last done. Null means never, and then there
   *  is no next date to work out rather than one starting from today. */
  lastDoneOn: string | null;
  /** Expiring only. */
  expiresOn: string | null;
  /** Expiring only: whether it can be renewed, or simply ends. */
  renewable: boolean;
  /** What it costs, when known. Null is common and never guessed at. */
  cost: number | null;
  active: boolean;
  notes: string | null;
};

export type UpkeepStanding = {
  item: UpkeepItem;
  /** When it is next due, or when it runs out. Null when the pieces needed
   *  to work that out are missing, which is said rather than guessed. */
  dueOn: string | null;
  daysAway: number | null;
  overdue: boolean;
  dueSoon: boolean;
  /** Which piece is missing, when dueOn is null. */
  missing: 'neverDone' | 'noInterval' | 'noDate' | null;
};

/** Inside this many days something is worth surfacing rather than filing. */
export const DUE_SOON_DAYS = 45;

function addMonths(date: string, months: number): string | null {
  const parts = date.slice(0, 10).split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
  const [year, month, day] = parts;
  // Day-of-month is clamped to the target month's length, the same problem
  // financeSchedule solves for a bill due on the 31st: a service done on
  // 31 August and due in six months lands on 28 February, not on a date that
  // does not exist.
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target.toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string): number | null {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.round((b - a) / 86400000);
}

export function upkeepStanding(item: UpkeepItem, today: string): UpkeepStanding {
  let dueOn: string | null = null;
  let missing: UpkeepStanding['missing'] = null;

  if (item.cadence === 'recurring') {
    if (!item.intervalMonths || item.intervalMonths <= 0) missing = 'noInterval';
    else if (!item.lastDoneOn) missing = 'neverDone';
    else dueOn = addMonths(item.lastDoneOn, item.intervalMonths);
  } else {
    if (!item.expiresOn) missing = 'noDate';
    else dueOn = item.expiresOn.slice(0, 10);
  }

  const daysAway = dueOn ? daysBetween(today, dueOn) : null;
  return {
    item,
    dueOn,
    daysAway,
    overdue: daysAway != null && daysAway < 0,
    dueSoon: daysAway != null && daysAway >= 0 && daysAway <= DUE_SOON_DAYS,
    missing,
  };
}

// --- Everything together ----------------------------------------------------

export type UpkeepSummary = {
  tracked: number;
  overdue: UpkeepStanding[];
  dueSoon: UpkeepStanding[];
  /** Items that cannot be placed on a calendar at all, so a clean-looking
   *  summary is not read as complete. */
  needsSetup: UpkeepStanding[];
  /** What the overdue and soon-due items cost between them, from costs
   *  actually recorded. */
  costAhead: number;
  /** How many of those have no cost recorded, which makes costAhead a floor
   *  rather than a total. */
  costUnknown: number;
};

export function summarizeUpkeep(items: UpkeepItem[], today: string): UpkeepSummary {
  const overdue: UpkeepStanding[] = [];
  const dueSoon: UpkeepStanding[] = [];
  const needsSetup: UpkeepStanding[] = [];
  let tracked = 0;
  let costAhead = 0;
  let costUnknown = 0;

  for (const item of items) {
    if (!item.active) continue;
    tracked += 1;
    const standing = upkeepStanding(item, today);

    if (standing.missing) {
      needsSetup.push(standing);
      continue;
    }
    if (standing.overdue) overdue.push(standing);
    else if (standing.dueSoon) dueSoon.push(standing);
    else continue;

    // Only what is actually coming up counts toward the figure. Something due
    // in two years is not a cost this month.
    if (item.cost != null && item.cost > 0) costAhead += item.cost;
    else costUnknown += 1;
  }

  // Most overdue first, then soonest. That is the order anything gets dealt
  // with in.
  overdue.sort((a, b) => (a.daysAway ?? 0) - (b.daysAway ?? 0));
  dueSoon.sort((a, b) => (a.daysAway ?? 0) - (b.daysAway ?? 0));

  return { tracked, overdue, dueSoon, needsSetup, costAhead, costUnknown };
}

// --- Wording ----------------------------------------------------------------

export function formatUpkeepMoney(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function describeDays(days: number): string {
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days < 0) {
    const late = Math.abs(days);
    if (late < 60) return `${late} days ago`;
    const months = Math.round(late / 30);
    return `about ${months} months ago`;
  }
  if (days < 60) return `in ${days} days`;
  const months = Math.round(days / 30);
  return `in about ${months} months`;
}

export function describeUpkeepStanding(standing: UpkeepStanding): string {
  const { item } = standing;

  if (standing.missing === 'neverDone') {
    return `Never recorded as done, so there is no next date yet. Say when it was last done and this can work out when it is due again.`;
  }
  if (standing.missing === 'noInterval') {
    return 'No interval recorded, so there is nothing to count from. Say how often it needs doing.';
  }
  if (standing.missing === 'noDate') {
    return 'No date recorded, so nothing can be counted down. Add the date it runs out.';
  }

  const when = describeDays(standing.daysAway as number);

  if (item.cadence === 'expires') {
    if (standing.overdue) {
      return item.renewable
        ? `Ran out ${when}. Worth renewing, and worth checking whether anything has been resting on it since.`
        : `Ended ${when}. Nothing to renew, so this is here as a record rather than a task.`;
    }
    return `Runs out ${when}${item.renewable ? '.' : ', and does not renew.'}`;
  }

  const last = item.lastDoneOn ? `Last done ${item.lastDoneOn}` : 'Never done';
  const every = item.intervalMonths === 1
    ? 'every month'
    : item.intervalMonths === 12
      ? 'every year'
      : `every ${item.intervalMonths} months`;
  return standing.overdue
    ? `${last}, due ${every}, so it was due ${when}.`
    : `${last}, due ${every}. Next ${when}.`;
}

export function describeUpkeepSummary(summary: UpkeepSummary): string {
  if (summary.tracked === 0) {
    return 'Nothing here yet. This is for anything that needs doing again or runs out: a service, a filter, a registration, a passport. The point is being told before the date rather than after it.';
  }

  const parts: string[] = [];

  if (summary.overdue.length > 0) {
    const worst = summary.overdue[0];
    parts.push(
      `${summary.overdue.length} ${summary.overdue.length === 1 ? 'thing is' : 'things are'} overdue, longest being ${worst.item.name}.`,
    );
  }
  if (summary.dueSoon.length > 0) {
    parts.push(
      `${summary.dueSoon.length} more ${summary.dueSoon.length === 1 ? 'is' : 'are'} due within ${DUE_SOON_DAYS} days.`,
    );
  }
  if (summary.costAhead > 0) {
    parts.push(
      summary.costUnknown > 0
        ? `That comes to at least ${formatUpkeepMoney(summary.costAhead)}, and ${summary.costUnknown} of them have no cost recorded, so treat it as a floor.`
        : `That comes to ${formatUpkeepMoney(summary.costAhead)}.`,
    );
  } else if (summary.costUnknown > 0) {
    parts.push(
      `None of them have a cost recorded, so there is no figure to give. Add what they cost and this can tell you what is coming.`,
    );
  }
  if (summary.needsSetup.length > 0) {
    parts.push(
      `${summary.needsSetup.length} ${summary.needsSetup.length === 1 ? 'cannot be' : 'cannot be'} placed on a calendar yet, and ${summary.needsSetup.length === 1 ? 'it is' : 'they are'} listed rather than dropped.`,
    );
  }

  if (parts.length === 0) {
    return `${summary.tracked} tracked, nothing overdue and nothing due in the next ${DUE_SOON_DAYS} days.`;
  }
  return parts.join(' ');
}

/**
 * The next date after something has just been done.
 *
 * Returned rather than applied, so the caller decides whether to store it. A
 * service done today resets the clock from today, which is the whole reason
 * this area does not use the bill machinery.
 */
export function nextDueAfterDoing(item: UpkeepItem, doneOn: string): string | null {
  if (item.cadence !== 'recurring' || !item.intervalMonths || item.intervalMonths <= 0) return null;
  return addMonths(doneOn, item.intervalMonths);
}
