// A stepped dose on a med, the way a prescriber writes a taper (A2 of the
// competitive build plan, 2026-09-29): 40 mg for five days, then 30 mg for
// five days, then 20 mg, and so on. Prednisone tapers after an RA, IBD or
// lupus flare are the common case.
//
// The app records the schedule the person was given and nothing more. It
// never suggests a step, never shortens or lengthens one, and never says a
// taper should end or go on; every sentence here names the prescriber as
// where the schedule came from.
//
// A taper is entered the way it is written on a prescription: a first day,
// then each step as an amount and a number of days, back to back. Each step
// is stored with its own first and last day so the reminder queries can
// read the amount for a date with one comparison. After the last step the
// dose on the med itself applies again, which is what a maintenance dose
// looks like; a taper that ends at nothing leaves that dose blank.
//
// Pure and free of runtime imports so scripts/test_taper.js can check it
// without a phone. Dates are 'YYYY-MM-DD', worked out in UTC so a
// daylight-saving change can never move a day.

export type TaperStep = {
  startDate: string;
  endDate: string;
  amount: number;
  unit: string | null;
};

// What the form holds: one step as an amount and how many days it lasts.
export type TaperDraftStep = { amount: string; unit: string; days: string };

export type TaperOnDay = { step: TaperStep; number: number; total: number };

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_MS = 86400000;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parse(date: string): number {
  const [year, month, day] = date.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

function format(ms: number): string {
  const value = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}`;
}

export function isTaperDate(date: string): boolean {
  if (!DATE_PATTERN.test(date)) return false;
  return format(parse(date)) === date;
}

export function taperAddDays(date: string, days: number): string {
  return format(parse(date) + days * DAY_MS);
}

export function daysInStep(step: Pick<TaperStep, 'startDate' | 'endDate'>): number {
  return Math.round((parse(step.endDate) - parse(step.startDate)) / DAY_MS) + 1;
}

export function shortDate(date: string): string {
  const [, month, day] = date.split('-').map(Number);
  return `${day} ${MONTH_SHORT[month - 1]}`;
}

export function sortSteps(steps: readonly TaperStep[]): TaperStep[] {
  return [...steps].sort((a, b) => a.startDate.localeCompare(b.startDate));
}

// Written the way the person would say it: "20 mg", "2.5 mg", "1 tablet".
export function formatAmount(amount: number, unit: string | null): string {
  const text = Number.isInteger(amount) ? String(amount) : String(Number(amount.toFixed(3)));
  return unit ? `${text} ${unit}` : text;
}

function parseAmount(text: string): number | null {
  const trimmed = text.trim().replace(',', '.');
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

/**
 * The form's steps laid end to end from the first day. Returns the steps, or
 * the one sentence saying what is missing, so the form can show it as is.
 */
export function buildTaper(
  startDate: string,
  drafts: readonly TaperDraftStep[],
): { steps: TaperStep[]; problem: null } | { steps: null; problem: string } {
  if (!isTaperDate(startDate)) {
    return { steps: null, problem: 'Enter the first day of the taper as a date, like 2026-10-01.' };
  }
  const filled = drafts.filter((d) => d.amount.trim() || d.days.trim());
  if (filled.length === 0) {
    return { steps: null, problem: 'Add at least one step: an amount and how many days it lasts.' };
  }
  const steps: TaperStep[] = [];
  let day = startDate;
  for (let i = 0; i < filled.length; i++) {
    const draft = filled[i];
    const amount = parseAmount(draft.amount);
    const days = parseAmount(draft.days);
    if (amount === null || amount <= 0) {
      return { steps: null, problem: `Step ${i + 1} needs an amount above zero, as written on the prescription.` };
    }
    if (days === null || !Number.isInteger(days) || days < 1) {
      return { steps: null, problem: `Step ${i + 1} needs a whole number of days, 1 or more.` };
    }
    const endDate = taperAddDays(day, days - 1);
    steps.push({ startDate: day, endDate, amount, unit: draft.unit.trim() || null });
    day = taperAddDays(endDate, 1);
  }
  return { steps, problem: null };
}

// The saved steps put back into the form, so changing one step does not mean
// typing the whole taper again.
export function draftsFromSteps(steps: readonly TaperStep[]): { startDate: string; drafts: TaperDraftStep[] } {
  const sorted = sortSteps(steps);
  return {
    startDate: sorted[0]?.startDate ?? '',
    drafts: sorted.map((s) => ({ amount: String(s.amount), unit: s.unit ?? '', days: String(daysInStep(s)) })),
  };
}

export function stepOn(steps: readonly TaperStep[], date: string): TaperOnDay | null {
  const sorted = sortSteps(steps);
  const index = sorted.findIndex((s) => s.startDate <= date && date <= s.endDate);
  if (index < 0) return null;
  return { step: sorted[index], number: index + 1, total: sorted.length };
}

export function taperFirstDay(steps: readonly TaperStep[]): string | null {
  return sortSteps(steps)[0]?.startDate ?? null;
}

export function taperLastDay(steps: readonly TaperStep[]): string | null {
  const sorted = sortSteps(steps);
  return sorted.length ? sorted[sorted.length - 1].endDate : null;
}

// "(step 3 of 5)", added after a dose amount in a reminder or on Home.
export function stepSuffix(number: number | null | undefined, total: number | null | undefined): string {
  if (!number || !total) return '';
  return ` (step ${number} of ${total})`;
}

// "20 mg (step 3 of 5)", the dose line for one day of a taper.
export function taperDoseLine(on: TaperOnDay): string {
  return `${formatAmount(on.step.amount, on.step.unit)}${stepSuffix(on.number, on.total)}`;
}

// One line per step for My Meds: "Step 1: 40 mg, 1 Oct to 5 Oct (5 days)".
export function describeSteps(steps: readonly TaperStep[]): string[] {
  return sortSteps(steps).map((s, i) => {
    const days = daysInStep(s);
    const range = days === 1 ? shortDate(s.startDate) : `${shortDate(s.startDate)} to ${shortDate(s.endDate)}`;
    return `Step ${i + 1}: ${formatAmount(s.amount, s.unit)}, ${range} (${days} day${days === 1 ? '' : 's'})`;
  });
}

/**
 * Where the taper stands on a day, in one sentence for the med's row.
 * `afterDose` is the dose on the med itself, which applies again once the
 * last step is done, or null when none is entered.
 */
export function taperStatusLine(steps: readonly TaperStep[], today: string, afterDose: string | null): string {
  const first = taperFirstDay(steps);
  const last = taperLastDay(steps);
  if (!first || !last) return '';
  const on = stepOn(steps, today);
  if (on) {
    const left = daysInStep({ startDate: today, endDate: on.step.endDate });
    const stepEnds = left === 1 ? 'today is its last day' : `${left} days left in this step`;
    return `Today: ${taperDoseLine(on)}, ${stepEnds}. The taper's last day is ${shortDate(last)}.`;
  }
  if (today < first) {
    const on1 = stepOn(steps, first);
    return `The taper starts ${shortDate(first)} at ${on1 ? formatAmount(on1.step.amount, on1.step.unit) : ''} and its last day is ${shortDate(last)}.`;
  }
  if (today > last) {
    return afterDose
      ? `The taper ended ${shortDate(last)}. Since then the dose entered on the med applies: ${afterDose}.`
      : `The taper ended ${shortDate(last)}. No dose is entered on the med for after it.`;
  }
  // Only reachable if saved steps leave a day uncovered, which buildTaper
  // never does; said plainly rather than guessed at.
  return `No step of the taper covers today. Its last day is ${shortDate(last)}.`;
}

export const TAPER_LEAD =
  'A taper is a dose that steps down (or up) on set dates. Enter the steps exactly as the prescriber wrote them; the reminders and the dose timeline then show the amount for each day. The app only records the schedule you were given and never changes it.';

export const TAPER_AFTER_NOTE =
  'After the last step, reminders go back to the dose entered on the med itself. If the prescriber said to stop, turn off tracking or remove the reminder times once the taper ends.';

// The Meds dose form, when the med has a taper: what the repeat is preset to.
export function taperRepeatNote(steps: readonly TaperStep[]): string | null {
  const last = taperLastDay(steps);
  if (!last) return null;
  return `This med has a taper that runs to ${shortDate(last)}, so these reminders are set to stop on that day. Change the end below if the prescriber said otherwise.`;
}
