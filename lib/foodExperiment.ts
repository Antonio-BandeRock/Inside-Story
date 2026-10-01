// Experiments: a trial set up as "make a change, then go back" (Phase B of
// the 2026-09-24 gap review, item 21; extended past foods by F5,
// 2026-10-01). Pure: no imports, no I/O.
//
// A plain trial watches what happens after a food is eaten. An experiment
// adds the part that makes a comparison possible: the same number of days
// before, then days with the change, then going back and watching the usual
// observation days. The before period needs nothing new logged, since it is
// read from what was already on record.
//
// The change is a food left out, or since F5 anything else: a bedtime, a
// supplement left out or added, a walk after dinner. A food comes back by
// itself the next time a meal with it is logged; nothing in the app can see
// a bedtime or a walk end, so anything else comes back when the person
// presses Back to Usual.
//
// What the result says is counts per period, the flares and reactions
// logged in each, and for a food how many times it was eaten while it was
// meant to be left out. It never says the change does or does not cause
// anything: one run on one person, with everything else in life also
// changing, describes what happened. EXPERIMENT_LIMIT says so on every
// result, and a second run is what makes a result worth leaning on.

export type TrialDesign = 'watch' | 'remove_return';

// What an experiment is about. Null on rows made before F5, which are all
// foods, so subjectOf reads null as a food.
export type ExperimentSubject = 'food' | 'bedtime' | 'supplement' | 'activity' | 'other';

export const SUBJECT_OPTIONS: { key: Exclude<ExperimentSubject, 'food'>; label: string; example: string }[] = [
  { key: 'bedtime', label: 'A bedtime', example: 'In bed by 10:30' },
  { key: 'supplement', label: 'A supplement', example: 'No evening magnesium' },
  { key: 'activity', label: 'A walk or movement', example: 'A 20 minute walk after dinner' },
  { key: 'other', label: 'Something else', example: 'No screens after 9' },
];

export function subjectOf(kind: string | null | undefined): ExperimentSubject {
  return kind === 'bedtime' || kind === 'supplement' || kind === 'activity' || kind === 'other' ? kind : 'food';
}

export function subjectLabel(kind: string | null | undefined): string {
  const subject = subjectOf(kind);
  return subject === 'food' ? 'A food' : SUBJECT_OPTIONS.find((option) => option.key === subject)!.label;
}

// The title on each evening check-in. "How did today go with In bed by
// 10:30?" does not read, so anything other than a food names the change.
export function experimentCheckinTitle(name: string, kind: string | null | undefined): string {
  return subjectOf(kind) === 'food' ? `How did today go with ${name}?` : `How did today go? Your experiment: ${name}`;
}

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
  'One run on one person, while everything else in life also changed, so this describes what happened rather than showing a cause. Running it a second time is what makes a result worth leaning on.';

// Said on every result about something other than a food, since a meal log
// shows whether a food was eaten and nothing shows whether a bedtime was kept.
export const NOT_SEEN_LINE =
  'The app cannot see whether the change was kept each day, so this rests on how closely it was.';

// The three periods' names. A food is left out; anything else is a change.
export function periodLabels(subject: ExperimentSubject): { before: string; during: string; back: string } {
  return subject === 'food'
    ? { before: 'Before', during: 'Without it', back: 'Back' }
    : { before: 'Before', during: 'With the change', back: 'Back to usual' };
}

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

// The days with the change run removalDays from the first. Still in them on
// any day before the day after the last.
export function removalEndsOn(removalStartedOn: string, removalDays: number): string {
  return addDays(removalStartedOn, removalDays);
}

export function isInRemoval(removalStartedOn: string | null, removalDays: number | null, today: string): boolean {
  if (!removalStartedOn || !removalDays) return false;
  return today >= removalStartedOn && today < removalEndsOn(removalStartedOn, removalDays);
}

// The line on a trial row while the food is left out or the change is kept.
export function removalProgressLine(
  removalStartedOn: string,
  removalDays: number,
  today: string,
  subject: ExperimentSubject = 'food',
): string {
  const day = daysBetween(removalStartedOn, today) + 1;
  const left = removalDays - day + 1;
  const counted = `day ${day} of ${removalDays}, ${left === 1 ? 'last day' : `${left} days to go`}`;
  return subject === 'food'
    ? `Without it: ${counted}. It comes back the next time it is logged after that.`
    : `With the change: ${counted}. Press Back to Usual once you have gone back to how it was.`;
}

// The line once those days are done and nothing has come back yet.
export function awaitingReturnLine(subject: ExperimentSubject): string {
  return subject === 'food'
    ? 'The days without it are done. It comes back the next time you log or schedule a meal with it.'
    : 'The days with the change are done. Press Back to Usual once you have gone back to how it was.';
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
  // When the food came back or the person went back; null while not yet.
  returnedOn: string | null;
  observationDays: number;
  today: string;
  // 'YYYY-MM-DD' of each flare or reaction logged.
  eventDates: string[];
  // 'YYYY-MM-DD' of each time the food was logged as eaten. Empty for
  // anything other than a food.
  eatenDates: string[];
  measure: string | null;
  // Missing or null reads as a food.
  subject?: ExperimentSubject | null;
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
  const labels = periodLabels(subjectOf(input.subject));
  const periods = [
    periodOf(labels.before, beforeFrom, input.removalStartedOn, input.today, input.eventDates),
    periodOf(labels.during, input.removalStartedOn, removalUntil, input.today, input.eventDates),
  ];
  if (input.returnedOn) {
    periods.push(
      periodOf(labels.back, input.returnedOn, addDays(input.returnedOn, input.observationDays), input.today, input.eventDates),
    );
  }
  return periods.filter((period) => period.days > 0);
}

export function eatenDuringRemoval(input: ExperimentInput): number {
  if (subjectOf(input.subject) !== 'food') return 0;
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
  if (subjectOf(input.subject) !== 'food') lines.push(NOT_SEEN_LINE);
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
