// Experiments: a food trial set up as "leave it out, then bring it back"
// (Phase B of the 2026-09-24 gap review, item 21). Pure: no imports, no I/O.
//
// A plain trial watches what happens after a food is eaten. An experiment
// adds the part that makes a comparison possible: the same number of days
// before, then days without the food, then bringing it back and watching
// the usual observation days. The before period needs nothing new logged,
// since it is read from what was already on record.
//
// What the result says is counts per period, the flares and reactions
// logged in each, and how many times the food was eaten while it was
// meant to be left out. It never says the food does or does not cause
// anything: one run on one person, with everything else in life also
// changing, describes what happened. EXPERIMENT_LIMIT says so on every
// result, and a second run is what makes a result worth leaning on.

export type TrialDesign = 'watch' | 'remove_return';

export const DEFAULT_REMOVAL_DAYS = 14;
export const REMOVAL_DAY_OPTIONS = [7, 14, 21, 28] as const;

// What the person says they will be watching. Stored as the label; the
// counts come from flares and reactions whatever is picked, and the result
// says that.
export const MEASURE_OPTIONS = [
  'Flares and reactions',
  'Digestion',
  'Energy',
  'Headaches',
  'Joint pain',
  'Mood',
  'Skin',
  'Sleep',
] as const;

export const EXPERIMENT_LIMIT =
  'One run on one person, while everything else in life also changed, so this describes what happened rather than showing what the food does. Running it a second time is what makes a result worth leaning on.';

function addDays(date: string, offset: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const moved = new Date(y, m - 1, d + offset);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${moved.getFullYear()}-${pad(moved.getMonth() + 1)}-${pad(moved.getDate())}`;
}

// Whole days from `from` to `to`, both 'YYYY-MM-DD'.
function daysBetween(from: string, to: string): number {
  const [a, b] = [from, to].map((date) => {
    const [y, m, d] = date.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  });
  return Math.round((b - a) / 86400000);
}

// The without period runs removalDays from its first day. Still in it on
// any day before the day after its last.
export function removalEndsOn(removalStartedOn: string, removalDays: number): string {
  return addDays(removalStartedOn, removalDays);
}

export function isInRemoval(removalStartedOn: string | null, removalDays: number | null, today: string): boolean {
  if (!removalStartedOn || !removalDays) return false;
  return today >= removalStartedOn && today < removalEndsOn(removalStartedOn, removalDays);
}

// The line on a trial row while the food is being left out.
export function removalProgressLine(removalStartedOn: string, removalDays: number, today: string): string {
  const day = daysBetween(removalStartedOn, today) + 1;
  const left = removalDays - day + 1;
  return `Without it: day ${day} of ${removalDays}, ${left === 1 ? 'last day' : `${left} days to go`}. It comes back the next time it is logged after that.`;
}

export type ExperimentPeriod = {
  label: string;
  from: string;
  // Exclusive.
  until: string;
  days: number;
  events: number;
};

export type ExperimentInput = {
  removalStartedOn: string;
  removalDays: number;
  // When the food came back; null while it has not.
  returnedOn: string | null;
  observationDays: number;
  today: string;
  // 'YYYY-MM-DD' of each flare or reaction logged.
  eventDates: string[];
  // 'YYYY-MM-DD' of each time the food was logged as eaten.
  eatenDates: string[];
  measure: string | null;
};

function periodOf(label: string, from: string, until: string, today: string, eventDates: string[]): ExperimentPeriod {
  const stop = until < addDays(today, 1) ? until : addDays(today, 1);
  const days = Math.max(0, daysBetween(from, stop));
  const events = eventDates.filter((date) => date >= from && date < stop).length;
  return { label, from, until: stop, days, events };
}

export function experimentPeriods(input: ExperimentInput): ExperimentPeriod[] {
  const beforeFrom = addDays(input.removalStartedOn, -input.removalDays);
  const removalUntil = removalEndsOn(input.removalStartedOn, input.removalDays);
  const periods = [
    periodOf('Before', beforeFrom, input.removalStartedOn, input.today, input.eventDates),
    periodOf('Without it', input.removalStartedOn, removalUntil, input.today, input.eventDates),
  ];
  if (input.returnedOn) {
    periods.push(
      periodOf('Back', input.returnedOn, addDays(input.returnedOn, input.observationDays), input.today, input.eventDates),
    );
  }
  return periods.filter((period) => period.days > 0);
}

export function eatenDuringRemoval(input: ExperimentInput): number {
  const until = removalEndsOn(input.removalStartedOn, input.removalDays);
  return input.eatenDates.filter((date) => date >= input.removalStartedOn && date < until).length;
}

function times(n: number): string {
  return n === 1 ? 'once' : n === 2 ? 'twice' : `${n} times`;
}

// The result, one line per period and then the lines that qualify it.
export function experimentResultLines(input: ExperimentInput): string[] {
  const lines = experimentPeriods(input).map(
    (period) =>
      `${period.label} (${period.days} ${period.days === 1 ? 'day' : 'days'}): ${period.events} ${period.events === 1 ? 'flare or reaction' : 'flares and reactions'} logged.`,
  );
  const eaten = eatenDuringRemoval(input);
  if (eaten > 0) {
    lines.push(`It was logged as eaten ${times(eaten)} during the days without it, which blurs the comparison.`);
  }
  if (input.measure && input.measure !== MEASURE_OPTIONS[0]) {
    lines.push(
      `You set out to watch ${input.measure.toLowerCase()}. The counts above are every flare and reaction logged, so read them beside your notes on that.`,
    );
  }
  lines.push(EXPERIMENT_LIMIT);
  return lines;
}
