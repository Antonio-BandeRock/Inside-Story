// Reconciliation, 1.0.39.15. Direct instruction:
//
//   "The Capture band needs to have a Reconciliation function for them to be
//   able to get to the list of their thoughts so they can be named,
//   categorized and scheduled or whatever needs to be done to them. The same
//   needs to apply for tasks and whether or not they actually ate and drank
//   the amounts that were scheduled, or if they were skipped, or rescheduled,
//   or replaced, etc. All of this needs to be very quick action capable for
//   each thing."
//
// One question asked of everything at once: what did you write down, and what
// did you plan, that nobody has said anything about yet. A thought sitting in
// the capture inbox and a breakfast whose time came and went are the same kind
// of loose end, and the app had nowhere that showed both.
//
// Four rules shape it:
//
//   1. Nothing here invents a number. "Some of it" records that the thing
//      happened partly and stops. The app was never told how much, and a
//      figure nobody chose would sit in the record looking measured. Same
//      refusal lib/quickLog.ts makes about an amount it cannot resolve, and
//      lib/captureNotes.ts makes about a date nobody picked.
//   2. Rescheduling is a time change, not a verdict. Moving a missed dose to
//      this evening leaves it planned, so it fires, shows and comes back here
//      like anything else still ahead. There is no "rescheduled" state to read
//      back afterwards, because the row is simply due at a different time now.
//   3. Every answer is one tap, and which answers a thing can give depends on
//      what it is. A dose was taken or it was not. A meal has a third honest
//      answer: something else got eaten instead.
//   4. Sorting still creates nothing by itself. A thought becomes a scheduled
//      thing only when the person picks the day, which is the one piece
//      lib/captureNotes.ts said a five-word note does not carry.
//   5. An answer the app filled in is not an answer. Since 2026-08-14 a
//      scheduled meal whose time passed has been recorded as eaten
//      automatically, because a plan nobody cancelled was probably followed
//      and Trends reading nothing at all was worse than reading an
//      assumption. That default stands, but an assumption has to be
//      correctable, so those rows come back here marked as the app's own
//      answer (the settled_automatically column) until somebody says either
//      way.
//
// Pure on purpose, so scripts/test_reconciliation.js can check it in plain
// node: no database, no React, no colours. The screen resolves those.

// What a row is, for the purpose of asking what happened to it. Narrower than
// schedule_items.item_type: a supplement, a prescription and an OTC drug all
// answer the same question, and a 'meal' row carrying meal_type 'beverage' is
// a drink, which is how the Hydration lens and the Daily Meal Plan's own
// water-gap filler both write one. Same split lib/reminderNotifications.ts
// makes in reminderKindFor, for the same reason.
export type ReconcileKind = 'meal' | 'drink' | 'dose' | 'task' | 'appointment';

// What happened to it. Deliberately not the same vocabulary as the status
// column: 'done' means different words in different places (a dose is
// 'logged', a garden task is 'completed'), and scheduleStatusForOutcome below
// is the one place that translation lives.
export type ReconcileOutcome = 'done' | 'partial' | 'skipped' | 'replaced';

export type ReconcileItem = {
  id: string;
  itemType: string;
  mealType: string | null;
  title: string;
  /** Local "YYYY-MM-DDTHH:mm", the shape every schedule_items row uses. */
  scheduledFor: string;
  status: string;
};

export type ReconcileAction = {
  outcome: ReconcileOutcome;
  label: string;
};

export type ReconcileGroup = {
  kind: ReconcileKind;
  label: string;
  items: ReconcileItem[];
};

export type ReconcileCounts = {
  thoughts: number;
  scheduled: number;
};

export type MoveOption = {
  key: string;
  label: string;
  /** Local "YYYY-MM-DDTHH:mm" to write into scheduled_for. */
  scheduledFor: string;
};

// How far back to ask. A week is long enough to catch the days somebody was
// too unwell or too busy to touch the phone, and short enough that opening
// this screen after a month away is not a wall of four hundred rows nobody
// will ever answer. Anything older stays exactly as it is, planned and
// unanswered, which is an honest record of a stretch that did not get
// tracked rather than a pile of guesses.
export const RECONCILE_LOOKBACK_DAYS = 7;

// The order the sections appear in. Food and drink first because they are the
// ones with the shortest memory: what was eaten at nine is already going by
// lunchtime, while a garden task waits without changing.
export const RECONCILE_KIND_ORDER: ReconcileKind[] = ['meal', 'drink', 'dose', 'task', 'appointment'];

export const RECONCILE_KIND_LABELS: Record<ReconcileKind, string> = {
  meal: 'Meals',
  drink: 'Water and drinks',
  dose: 'Medications and supplements',
  task: 'Tasks',
  appointment: 'Appointments',
};

// Every item_type that can turn up here, and what it becomes. 'foodTest' and
// 'fermentation' are check-in reminders for something already under way, so
// they answer the same two questions a garden task does.
export function reconcileKindFor(itemType: string, mealType: string | null): ReconcileKind {
  if (itemType === 'appointment') return 'appointment';
  if (itemType === 'meal') return mealType === 'beverage' ? 'drink' : 'meal';
  if (itemType === 'supplement' || itemType === 'prescription' || itemType === 'otc') return 'dose';
  return 'task';
}

// The answers each kind can give, in the order the chips appear.
//
// "Ate something else" exists only for a meal, and it is the one that needed
// asking for by name: a plan that was not followed is not the same as a meal
// that was skipped, and recording it as skipped would say somebody went
// without eating when they did not. What was eaten instead belongs in the
// Meals builder, and the screen says so rather than pretending this chip
// logged it.
export const RECONCILE_ACTIONS: Record<ReconcileKind, ReconcileAction[]> = {
  meal: [
    { outcome: 'done', label: 'Ate it' },
    { outcome: 'partial', label: 'Some of it' },
    { outcome: 'replaced', label: 'Ate something else' },
    { outcome: 'skipped', label: 'Skipped it' },
  ],
  drink: [
    { outcome: 'done', label: 'Drank it' },
    { outcome: 'partial', label: 'Some of it' },
    { outcome: 'skipped', label: 'Skipped it' },
  ],
  dose: [
    { outcome: 'done', label: 'Took it' },
    { outcome: 'skipped', label: 'Skipped it' },
  ],
  task: [
    { outcome: 'done', label: 'Did it' },
    { outcome: 'skipped', label: 'Did not do it' },
  ],
  appointment: [
    { outcome: 'done', label: 'Went' },
    { outcome: 'skipped', label: 'Did not go' },
  ],
};

// The same answers, asked the other way round. An ordinary row is being
// answered for the first time; one of these has an answer in it already,
// put there by the app, so the confirming chip says yes to a question
// rather than stating a fact. Everything else about the row is identical,
// which is why this is built from RECONCILE_ACTIONS rather than written out
// a second time and left to drift.
export const ASSUMED_CONFIRM_LABELS: Record<ReconcileKind, string> = {
  meal: 'Yes, I ate it',
  drink: 'Yes, I drank it',
  dose: 'Yes, I took it',
  task: 'Yes, I did it',
  appointment: 'Yes, I went',
};

export function assumedActions(kind: ReconcileKind): ReconcileAction[] {
  return RECONCILE_ACTIONS[kind].map((action) =>
    action.outcome === 'done' ? { outcome: 'done' as const, label: ASSUMED_CONFIRM_LABELS[kind] } : action,
  );
}

// Which answers mean the thing the app recorded did not happen at all, and
// so has to be taken back out rather than relabelled. A meal the app built
// out of the plan is counted by every nutrient figure in Trends and Reports,
// so "I skipped it" has to remove it; "some of it" does not, because
// something was eaten and the planned amounts are the only figures anybody
// has (the screen says so rather than halving them).
export function assumptionMustBeUndone(outcome: ReconcileOutcome): boolean {
  return outcome === 'skipped' || outcome === 'replaced';
}

// The translation into schedule_items.status. Three of these five values were
// already in use before this screen existed, and they keep their meanings:
// 'logged' is what markScheduledMealLogged and markScheduledDoseTaken write,
// 'completed' is what an appointment or a finished task gets, and 'cancelled'
// is the word the Appointments lens already shows for one that did not
// happen. 'partial' and 'replaced' are new in 1.0.39.15, and describeStatus
// below is what every lens reads them back through.
export function scheduleStatusForOutcome(kind: ReconcileKind, outcome: ReconcileOutcome): string {
  if (outcome === 'partial') return 'partial';
  if (outcome === 'replaced') return 'replaced';
  if (outcome === 'skipped') return kind === 'appointment' ? 'cancelled' : 'skipped';
  return kind === 'task' || kind === 'appointment' ? 'completed' : 'logged';
}

// One wording per status, everywhere it is read back. Null for 'planned' and
// for anything unrecognised, which is what lets a caller write
// `describeStatus(status)` straight into a row without a chain of ternaries
// per screen, and what keeps a status added later from silently printing
// nothing in one place and a raw database word in another.
export function describeStatus(status: string): string | null {
  switch (status) {
    case 'logged':
      return 'Logged';
    case 'completed':
      return 'Completed';
    case 'partial':
      return 'Partly';
    case 'replaced':
      return 'Replaced';
    case 'skipped':
      return 'Skipped';
    case 'cancelled':
      return 'Cancelled';
    default:
      return null;
  }
}

// Every status that means somebody has answered for this row. 'planned' is the
// only one that does not, which is what the open-items query filters on.
export function isSettledStatus(status: string): boolean {
  return status !== 'planned';
}

// Parses the local "YYYY-MM-DDTHH:mm" shape schedule_items stores, without
// going through Date's own string parsing, which reads a bare date as UTC and
// would drag every early-morning row onto the wrong day.
export function parseLocalDateTime(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  const parsed = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    hour ? Number(hour) : 0,
    minute ? Number(minute) : 0,
    0,
    0,
  );
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatLocalDateTime(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// The oldest day this screen asks about, as the "YYYY-MM-DD" both queries
// compare against. RECONCILE_LOOKBACK_DAYS back from today, counted in
// calendar days rather than by subtracting hours, so a week means seven
// dates and not 168 hours that land mid-morning.
export function lookbackDateString(now: Date): string {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - RECONCILE_LOOKBACK_DAYS);
  return `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function calendarDaysBetween(earlier: Date, later: Date): number {
  const a = new Date(earlier.getFullYear(), earlier.getMonth(), earlier.getDate());
  const b = new Date(later.getFullYear(), later.getMonth(), later.getDate());
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

// How long ago it was due, said the way somebody would say it. Minutes while
// it is still this hour, hours for the rest of today, then the day itself,
// because "31 hours ago" is arithmetic and "yesterday" is a memory.
export function describeLateness(scheduledFor: string, now: Date): string {
  const due = parseLocalDateTime(scheduledFor);
  if (!due) return '';
  const minutes = Math.round((now.getTime() - due.getTime()) / 60_000);
  if (minutes < 0) {
    const ahead = Math.abs(minutes);
    if (ahead < 60) return `in ${ahead} min`;
    if (calendarDaysBetween(now, due) === 0) return `later today, ${formatClock(due)}`;
    return `${DAY_NAMES[due.getDay()]}, ${formatClock(due)}`;
  }
  const days = calendarDaysBetween(due, now);
  if (days === 0) {
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    return hours === 1 ? 'an hour ago' : `${hours} hours ago`;
  }
  if (days === 1) return `yesterday, ${formatClock(due)}`;
  if (days < 7) return `${DAY_NAMES[due.getDay()]}, ${formatClock(due)}`;
  return `${days} days ago`;
}

// 12-hour, lowercase am/pm, matching how every other time in this app reads on
// screen.
export function formatClock(date: Date): string {
  const hours = date.getHours();
  const suffix = hours < 12 ? 'am' : 'pm';
  const twelve = hours % 12 === 0 ? 12 : hours % 12;
  return `${twelve}:${pad(date.getMinutes())}${suffix}`;
}

// Where a missed thing can be moved to, in one tap. Three choices at most,
// because a fourth turns a decision into a menu.
//
// "Tomorrow" keeps the time of day it was originally set for, so a breakfast
// lands at breakfast time rather than at whatever hour the person happened to
// open this screen. "This evening" is only offered while the evening is still
// ahead, and "In an hour" is exactly that, unrounded, so what the chip says is
// what the row gets.
export function moveOptions(scheduledFor: string, now: Date): MoveOption[] {
  const due = parseLocalDateTime(scheduledFor);
  const options: MoveOption[] = [];

  const inAnHour = new Date(now.getTime() + 60 * 60_000);
  options.push({ key: 'hour', label: 'In an hour', scheduledFor: formatLocalDateTime(inAnHour) });

  if (now.getHours() < 18) {
    const evening = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 0, 0, 0);
    options.push({ key: 'evening', label: 'This evening', scheduledFor: formatLocalDateTime(evening) });
  }

  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, due ? due.getHours() : 9, due ? due.getMinutes() : 0, 0, 0);
  options.push({ key: 'tomorrow', label: 'Tomorrow', scheduledFor: formatLocalDateTime(tomorrow) });

  return options;
}

// Where a thought can be put, in one tap. The day is the piece a note does not
// carry and cannot be guessed, so these are offered as choices rather than
// applied: picking one is the person deciding, which is the whole difference
// between this and the app inventing a date.
//
// "Later today" disappears once the day is too far gone for it to mean
// anything, rather than quietly scheduling something for eleven at night.
export function thoughtTimeOptions(now: Date): MoveOption[] {
  const options: MoveOption[] = [];

  if (now.getHours() < 19) {
    const later = new Date(now.getTime() + 3 * 60 * 60_000);
    options.push({ key: 'later', label: 'Later today', scheduledFor: formatLocalDateTime(later) });
  }

  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0, 0, 0);
  options.push({ key: 'tomorrow', label: 'Tomorrow morning', scheduledFor: formatLocalDateTime(tomorrow) });

  // The next Saturday that has not started yet. On a Saturday this means the
  // one a week out, not the day already under way, because somebody sorting
  // their inbox on Saturday morning who picks "this weekend" means the one
  // they are not currently standing in the middle of.
  const daysToSaturday = ((6 - now.getDay() + 7) % 7) || 7;
  const weekend = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysToSaturday, 10, 0, 0, 0);
  options.push({ key: 'weekend', label: 'This weekend', scheduledFor: formatLocalDateTime(weekend) });

  const nextWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 9, 0, 0, 0);
  options.push({ key: 'week', label: 'Next week', scheduledFor: formatLocalDateTime(nextWeek) });

  return options;
}

// Oldest first. The thing somebody is furthest behind on is the one whose
// answer is hardest to remember, so it is asked while there is still any
// chance of an honest answer rather than left at the bottom of a list.
export function sortReconcileItems(items: ReconcileItem[]): ReconcileItem[] {
  return [...items].sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
}

// Grouped in RECONCILE_KIND_ORDER, and an empty kind never produces a heading.
export function groupReconcileItems(items: ReconcileItem[]): ReconcileGroup[] {
  const groups: ReconcileGroup[] = [];
  for (const kind of RECONCILE_KIND_ORDER) {
    const matching = sortReconcileItems(
      items.filter((item) => reconcileKindFor(item.itemType, item.mealType) === kind),
    );
    if (matching.length === 0) continue;
    groups.push({ kind, label: RECONCILE_KIND_LABELS[kind], items: matching });
  }
  return groups;
}

function plural(count: number, one: string, many: string): string {
  return count === 1 ? `1 ${one}` : `${count} ${many}`;
}

// The sentence under the Capture band on Home, and the lead on the screen
// itself. Empty string when there is nothing waiting, so a caller can decide
// whether silence or a line of its own is the right answer there.
export function describeReconcileQueue(counts: ReconcileCounts): string {
  const parts: string[] = [];
  if (counts.thoughts > 0) parts.push(plural(counts.thoughts, 'thought to sort', 'thoughts to sort'));
  if (counts.scheduled > 0) parts.push(plural(counts.scheduled, 'thing to answer for', 'things to answer for'));
  if (parts.length === 0) return '';
  return `${parts.join(', and ')}.`;
}
