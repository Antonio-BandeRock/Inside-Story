// What work actually gives you, once you have found out what that is.
//
// Built 2026-09-05. The companion to constants/workBenefitPrompts.ts: that file
// holds questions and asserts nothing, this one holds the answers a person came
// back with and does arithmetic on them.
//
// TWO SHAPES, AND THEY ARE NOT THE SAME PROBLEM.
//
// 1. An ALLOWANCE resets and disappears. A dental yearly maximum, a wellness
//    stipend, counselling sessions, leave days, a training budget. The
//    question is "how much is left and when does it vanish", which is exactly
//    the shape lib/financeHealth.ts already uses for a forfeited health
//    account. Same mechanism, applied to everything else that expires.
//
// 2. A MATCH is not used-against-a-total at all. Nothing expires; you are
//    simply declining money every month you pay in below the point where
//    matching stops. The question is "how far short am I", and the answer is
//    a share of pay rather than an amount.
//
// A third shape exists and deliberately gets no arithmetic: a PERK with no
// number attached. A fridge at work, a discount scheme, a nurse line. Worth
// recording that it exists so it can be remembered; giving it a progress bar
// would invent a quantity it does not have.
//
// WHAT THIS FILE WILL NOT DO.
//
// It never says what someone is entitled to. Every figure here came from the
// person telling the app what their own employer offers, and the app's job is
// to hold that and count down. See workBenefitPrompts.ts for why: this area is
// jurisdiction-specific to the point where a confident claim would be wrong
// for most readers.
//
// It also never converts a share of pay into an amount, because it does not
// know anyone's pay and asking for it to produce one figure would be a poor
// trade.

export type BenefitKind = 'allowance' | 'sessions' | 'days' | 'match' | 'perk';

export const BENEFIT_KINDS: { code: BenefitKind; label: string; help: string; unit: string }[] = [
  { code: 'allowance', label: 'An amount of money', help: 'A dental maximum, a wellness or training budget.', unit: '' },
  { code: 'sessions', label: 'A number of sessions', help: 'Counselling visits, appointments, anything counted by the visit.', unit: 'sessions' },
  { code: 'days', label: 'A number of days', help: 'Leave, sick days, volunteering time.', unit: 'days' },
  { code: 'match', label: 'Matched contributions', help: 'They add to your retirement up to a point. Record the point and what you pay in.', unit: '%' },
  { code: 'perk', label: 'Something with no number', help: 'A fridge, a nurse line, a discount scheme. Just worth remembering it exists.', unit: '' },
];

export function benefitKindLabel(kind: string): string {
  return BENEFIT_KINDS.find((entry) => entry.code === kind)?.label ?? kind;
}

export function benefitUnit(kind: BenefitKind): string {
  return BENEFIT_KINDS.find((entry) => entry.code === kind)?.unit ?? '';
}

export type ResetCadence = 'yearly' | 'monthly' | 'never';

export type Benefit = {
  id: string;
  name: string;
  kind: BenefitKind;
  /** The ceiling: the allowance, the session count, the match threshold.
   *  Null for a perk, which has no quantity. */
  total: number | null;
  /** How much has been used, or for a match, what you currently pay in. */
  used: number;
  resets: ResetCadence;
  /** The date it resets on, when known. Null means the person has not said,
   *  and no countdown is possible. */
  resetOn: string | null;
  active: boolean;
  notes: string | null;
};

// --- Allowances, sessions and days ------------------------------------------

export type BenefitStanding = {
  benefit: Benefit;
  /** Null for a perk and for a match, where "remaining" means nothing. */
  remaining: number | null;
  fraction: number;
  /** Days until it resets. Null when no reset date is known, or it never
   *  resets, and null is the honest answer rather than a large number. */
  daysUntilReset: number | null;
  /** Something is about to be lost: a reset is close and there is still
   *  unused allowance sitting there. */
  expiringUnused: boolean;
  /** Nothing has been claimed at all, which is worth flagging separately from
   *  merely having some left. */
  untouched: boolean;
};

/** Inside this many days of a reset, unused allowance is worth a warning
 *  rather than a note. A stated judgment call, not a derived figure. */
export const EXPIRY_WARNING_DAYS = 60;

function daysBetween(from: string, to: string): number | null {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.round((b - a) / 86400000);
}

export function benefitStanding(benefit: Benefit, today: string): BenefitStanding {
  const countable = benefit.kind !== 'perk' && benefit.kind !== 'match' && benefit.total != null;
  const remaining = countable ? Math.max(0, (benefit.total as number) - benefit.used) : null;
  const fraction =
    countable && (benefit.total as number) > 0
      ? Math.min(1, benefit.used / (benefit.total as number))
      : 0;

  const daysUntilReset =
    benefit.resets === 'never' || !benefit.resetOn ? null : daysBetween(today, benefit.resetOn);

  return {
    benefit,
    remaining,
    fraction,
    daysUntilReset,
    expiringUnused:
      countable &&
      (remaining as number) > 0 &&
      daysUntilReset != null &&
      daysUntilReset >= 0 &&
      daysUntilReset <= EXPIRY_WARNING_DAYS,
    untouched: countable && benefit.used === 0,
  };
}

// --- A match, which is a different question ---------------------------------

export type MatchGap = {
  /** The point past which they stop adding. */
  threshold: number;
  contributing: number;
  /** Share of pay being declined. Deliberately a share and never an amount:
   *  the app does not know anyone's pay. */
  shortBy: number;
  gettingFullMatch: boolean;
};

export function matchGap(benefit: Benefit): MatchGap | null {
  if (benefit.kind !== 'match' || benefit.total == null || benefit.total <= 0) return null;
  const shortBy = Math.max(0, benefit.total - benefit.used);
  return {
    threshold: benefit.total,
    contributing: benefit.used,
    shortBy,
    gettingFullMatch: shortBy === 0,
  };
}

export function describeMatchGap(gap: MatchGap | null): string | null {
  if (!gap) return null;
  if (gap.gettingFullMatch) {
    return `You pay in ${formatShare(gap.contributing)} and they match to ${formatShare(gap.threshold)}, so you are getting all of it.`;
  }
  return `You pay in ${formatShare(gap.contributing)} and they match to ${formatShare(gap.threshold)}. Every month at this level turns down ${formatShare(gap.shortBy)} of your pay that they would have added. That is a share rather than an amount, because this app does not know what you earn and is not going to ask for one figure.`;
}

// --- Everything together ----------------------------------------------------

export type WorkSummary = {
  recorded: number;
  /** Allowances with something left and a reset inside the warning window. */
  expiringUnused: BenefitStanding[];
  /** Recorded and never touched at all. */
  untouched: BenefitStanding[];
  /** Matches not being taken in full. */
  matchesShort: { benefit: Benefit; gap: MatchGap }[];
  /** Recorded but with no reset date, so nothing can be counted down. Named
   *  so a clean-looking summary is not read as complete. */
  missingResetDate: number;
};

export function summarizeWork(benefits: Benefit[], today: string): WorkSummary {
  const expiringUnused: BenefitStanding[] = [];
  const untouched: BenefitStanding[] = [];
  const matchesShort: { benefit: Benefit; gap: MatchGap }[] = [];
  let missingResetDate = 0;
  let recorded = 0;

  for (const benefit of benefits) {
    if (!benefit.active) continue;
    recorded += 1;

    const gap = matchGap(benefit);
    if (gap) {
      if (!gap.gettingFullMatch) matchesShort.push({ benefit, gap });
      continue;
    }

    const standing = benefitStanding(benefit, today);
    if (standing.expiringUnused) expiringUnused.push(standing);
    if (standing.untouched) untouched.push(standing);
    if (benefit.kind !== 'perk' && benefit.resets !== 'never' && !benefit.resetOn) missingResetDate += 1;
  }

  // Soonest first, since that is the order anything gets acted on in.
  expiringUnused.sort((a, b) => (a.daysUntilReset ?? 0) - (b.daysUntilReset ?? 0));

  return { recorded, expiringUnused, untouched, matchesShort, missingResetDate };
}

export function describeWorkSummary(summary: WorkSummary): string {
  if (summary.recorded === 0) {
    return 'Nothing recorded yet. Work through the questions and put in whatever comes back, and this becomes a list of things with dates on them rather than a vague sense that there is probably something.';
  }

  const parts: string[] = [];

  if (summary.expiringUnused.length > 0) {
    const soonest = summary.expiringUnused[0];
    parts.push(
      `${summary.expiringUnused.length} ${summary.expiringUnused.length === 1 ? 'thing' : 'things'} you have not used up will reset soon, starting with ${soonest.benefit.name} in ${soonest.daysUntilReset} ${soonest.daysUntilReset === 1 ? 'day' : 'days'}.`,
    );
  }
  if (summary.matchesShort.length > 0) {
    const first = summary.matchesShort[0];
    parts.push(
      `You are turning down ${formatShare(first.gap.shortBy)} of pay on ${first.benefit.name} by paying in below where the matching stops.`,
    );
  }
  if (summary.untouched.length > 0) {
    parts.push(
      `${summary.untouched.length} ${summary.untouched.length === 1 ? 'is' : 'are'} recorded and never claimed at all.`,
    );
  }
  if (summary.missingResetDate > 0) {
    parts.push(
      `${summary.missingResetDate} ${summary.missingResetDate === 1 ? 'has' : 'have'} no reset date recorded, so nothing here can count ${summary.missingResetDate === 1 ? 'it' : 'them'} down.`,
    );
  }

  if (parts.length === 0) {
    return `${summary.recorded} recorded, nothing expiring soon, and nothing sitting unclaimed.`;
  }
  return parts.join(' ');
}

// --- Formatting -------------------------------------------------------------

export function formatShare(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}%`;
}

export function formatBenefitAmount(kind: BenefitKind, value: number): string {
  if (kind === 'allowance') {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (kind === 'match') return formatShare(value);
  const rounded = Math.round(value * 10) / 10;
  const shown = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  const unit = benefitUnit(kind);
  return unit ? `${shown} ${unit}` : shown;
}

export function describeBenefitStanding(standing: BenefitStanding): string {
  const { benefit } = standing;
  if (benefit.kind === 'perk') {
    return 'No amount attached to this one. It is here so it is not forgotten.';
  }
  if (benefit.total == null) {
    return 'No amount recorded yet, so there is nothing to count down.';
  }

  const used = formatBenefitAmount(benefit.kind, benefit.used);
  const total = formatBenefitAmount(benefit.kind, benefit.total);
  const left = formatBenefitAmount(benefit.kind, standing.remaining ?? 0);
  const base = standing.untouched
    ? `${total}, none of it claimed.`
    : `${used} of ${total} used, ${left} left.`;

  if (standing.daysUntilReset == null) {
    return benefit.resets === 'never'
      ? `${base} It does not reset.`
      : `${base} No reset date recorded, so this cannot say when it goes.`;
  }
  if (standing.daysUntilReset < 0) {
    return `${base} The reset date recorded has passed, so this figure is probably stale.`;
  }
  if (standing.expiringUnused) {
    return `${base} It resets in ${standing.daysUntilReset} ${standing.daysUntilReset === 1 ? 'day' : 'days'}, and anything left goes with it.`;
  }
  return `${base} Resets in ${standing.daysUntilReset} days.`;
}
