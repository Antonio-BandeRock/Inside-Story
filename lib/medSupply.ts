// How much of a med is left, and when to ask for more (A3, Phase 2).
//
// Nothing is decremented. The person counts what is on hand once, and what
// is left is that count minus the doses marked taken since, so a dose marked
// from a notification, from Today, from Reconcile or from Meds all count,
// and un-marking one puts it back. A dose taken and never marked is still
// counted as in the bottle, and the sentences say so rather than guess.
//
// Pure, no imports, so scripts/test_med_supply.js checks every sentence
// without a phone. The reading and writing is lib/medDetailsDb.ts.

export type SupplyInput = {
  /** What was counted, or null when nothing has been counted. */
  onHand: number | null;
  /** What is counted, as the person wrote it: tablets, capsules, ml. */
  unit: string | null;
  /** How many of those one dose uses. */
  perDose: number;
  /** When the count was saved, local "YYYY-MM-DDTHH:mm". */
  countedAt: string | null;
  /** Doses marked taken since the count. */
  takenSinceCount: number;
  /** Doses on the schedule over the next seven days. */
  dueNext7Days: number;
  /** Doses marked taken over the last fourteen days. */
  takenPast14Days: number;
  /** Today, "YYYY-MM-DD". */
  today: string;
  /** How many days before running out to be reminded. */
  leadDays: number;
};

export type SupplyReading = {
  remaining: number | null;
  daysLeft: number | null;
  runsOutOn: string | null;
  /** The day the refill reminder is due, or null when there is no rate. */
  remindOn: string | null;
  /** One line for a list row. */
  short: string | null;
  /** The full account, for the detail view. */
  sentence: string;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function shortDate(day: string): string {
  const [y, m, d] = day.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return day;
  return `${MONTHS[m - 1]} ${d}`;
}

export function addDays(day: string, days: number): string {
  const [y, m, d] = day.slice(0, 10).split('-').map(Number);
  const date = new Date(y, m - 1, d + days);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function amount(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10);
}

function counted(n: number, unit: string | null): string {
  const what = unit?.trim();
  return what ? `${amount(n)} ${what}` : amount(n);
}

/** How much one day uses: the week ahead on the schedule first, then the
 *  last two weeks of marks, otherwise nothing to go on. */
export function dailyUse(input: Pick<SupplyInput, 'perDose' | 'dueNext7Days' | 'takenPast14Days'>): number | null {
  const perDose = input.perDose > 0 ? input.perDose : 1;
  if (input.dueNext7Days > 0) return (input.dueNext7Days * perDose) / 7;
  if (input.takenPast14Days > 0) return (input.takenPast14Days * perDose) / 14;
  return null;
}

export function readSupply(input: SupplyInput): SupplyReading {
  if (input.onHand === null || input.countedAt === null) {
    return {
      remaining: null,
      daysLeft: null,
      runsOutOn: null,
      remindOn: null,
      short: null,
      sentence: 'How many are on hand has not been counted. Count it once and the app keeps track from the doses you mark taken.',
    };
  }
  const perDose = input.perDose > 0 ? input.perDose : 1;
  const remaining = input.onHand - perDose * input.takenSinceCount;
  const since = shortDate(input.countedAt);
  if (remaining <= 0) {
    return {
      remaining: 0,
      daysLeft: 0,
      runsOutOn: input.today,
      remindOn: input.today,
      short: 'None left by the doses marked since the count',
      sentence: `By the doses marked taken since you counted on ${since}, none are left. Count what is there and save the number again.`,
    };
  }
  const perDay = dailyUse(input);
  if (perDay === null) {
    return {
      remaining,
      daysLeft: null,
      runsOutOn: null,
      remindOn: null,
      short: `${counted(remaining, input.unit)} left`,
      sentence: `${counted(remaining, input.unit)} left, counting the doses marked taken since ${since}. Set its times on Schedules > Meds to see how many days that lasts.`,
    };
  }
  const daysLeft = Math.floor(remaining / perDay);
  const runsOutOn = addDays(input.today, daysLeft);
  const lead = Math.max(0, Math.round(input.leadDays));
  const remindOn = addDays(runsOutOn, -lead);
  const days = daysLeft === 1 ? 'About 1 day left' : `About ${daysLeft} days left`;
  return {
    remaining,
    daysLeft,
    runsOutOn,
    remindOn,
    short: `${days} (${counted(remaining, input.unit)})`,
    sentence:
      `${days}: ${counted(remaining, input.unit)}, counting the doses marked taken since you counted on ${since}. ` +
      `At the pace on the schedule it runs out around ${shortDate(runsOutOn)}` +
      (lead > 0 ? `, and a reminder comes ${lead === 1 ? '1 day' : `${lead} days`} before that.` : '.') +
      ' A dose taken but not marked is still counted as there.',
  };
}

/** The refill reminder's line, for the notification and the Home list. */
export function describeRefillDue(name: string, reading: SupplyReading): string {
  if (reading.daysLeft === null) return `${name}: time to ask for more.`;
  if (reading.daysLeft <= 0) return `${name}: none left by the doses marked. Time to ask for more.`;
  return `${name}: about ${reading.daysLeft === 1 ? '1 day' : `${reading.daysLeft} days`} left. Time to ask for more.`;
}

/** A phone number reduced to what a dialler takes. Null when nothing is left. */
export function dialable(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  const digits = trimmed.replace(/[^\d+]/g, '');
  const cleaned = digits.startsWith('+') ? `+${digits.slice(1).replace(/\+/g, '')}` : digits.replace(/\+/g, '');
  return cleaned.replace(/\D/g, '').length >= 3 ? cleaned : null;
}
