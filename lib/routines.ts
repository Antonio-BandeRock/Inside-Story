// Routines you walk one step at a time, and the record of what you have
// already done.
//
// 2026-09-17, direct instruction: "Build the step-by-step routines and the
// 'did I already do it' record." Two rows of the daily-living program
// (CLAUDE.md item 28), built in one pass because they turn out to be the
// same fact seen from two sides.
//
// A ROUTINE is an order somebody does not want to hold in their head:
// morning, bedtime, leaving the house. The screen shows ONE step at a time,
// because a list of nine is a thing to be scanned, re-scanned, and lost your
// place in, and losing your place is the hard part the routine exists to
// take away. Finish a step and the next one arrives. Nothing else moves.
//
// A CHECK is one question asked later: did I take my pill, did I lock the
// door, did I pay the electric bill. It is not a reminder and not a task.
// Its whole value is that the answer can be looked at, so that it costs a
// glance rather than a walk back upstairs or a second payment.
//
// WHY THEY SHARE A FILE: a routine step can BE a check. "Take your
// levothyroxine", walked at 7am, has to answer "did I take my pill" at 11am
// without being recorded twice. So finishing that step writes the same mark
// a tap on the check would have written. Held apart, the two would have
// produced either two records of one act, or a screen telling somebody at
// 11am that they had not done the thing they did at 7.
//
// 2026-09-17, direct correction, and the thing to keep hold of: "Did I Do
// it should be related to Routines, not treated separately. While they are
// walking through a routine, they are also checking off things that they
// need to do while running the routine. Did I do it is the user selecting
// to check the item off as they are doing it." Two things follow. The mark
// is written AT THE STEP, the moment the person ticks it, not gathered up
// and written when the walk ends: somebody who takes the pill at step two
// and then answers the door has still taken the pill. And the record is
// read grouped under the routine it belongs to, not as a second list.
//
// Pure on purpose: no database, no React, no colours, so these rules can be
// checked in plain node (scripts/test_routines.js), and so the screens and
// the database module can both read them without a cycle.

// ---------------------------------------------------------------- routines

/** Which moment a routine belongs to. Grouping and wording only: every
 *  routine is walked the same way whichever this is. 'leaving' has no hour
 *  of its own on purpose, because leaving the house happens whenever it
 *  happens, which is exactly why it is the one most often half done.
 *
 *  A plain string rather than a union of four, because the set is open.
 *  2026-09-17, direct instruction: "There needs to be a way for them to add
 *  a new When it happens so they can create a routine specific to something
 *  that isn't on the list, and when they create it, it can then be something
 *  that can be selected in the list again." So this holds either one of the
 *  four built-in keys below or the id of one somebody made themselves, in
 *  the same column, because both answer the same question. Resolve one
 *  through findOccasion or routineOccasionLabel, never by comparing it to a
 *  literal. */
export type RoutineOccasion = string;

/** The four that ship. Named apart from RoutineOccasion so the code that
 *  genuinely means one of these four can still say so. */
export type BuiltInOccasion = 'morning' | 'bedtime' | 'leaving' | 'other';

export const ROUTINE_OCCASIONS: {
  key: BuiltInOccasion;
  label: string;
  example: string;
  /** Local hours this occasion covers, start inclusive, end exclusive, or
   *  null for one that does not belong to a time of day. A range that wraps
   *  midnight is written with start greater than end and read that way. */
  hours: { from: number; to: number } | null;
}[] = [
  {
    key: 'morning',
    label: 'Morning',
    example: 'Meds, breakfast, the things that only work if they happen early.',
    hours: { from: 4, to: 11 },
  },
  {
    key: 'bedtime',
    label: 'Bedtime',
    example: 'Winding down, locking up, setting out what tomorrow needs.',
    hours: { from: 20, to: 4 },
  },
  {
    key: 'leaving',
    label: 'Leaving the house',
    example: 'Keys, wallet, phone, the stove, the back door.',
    hours: null,
  },
  {
    key: 'other',
    label: 'Something else',
    example: 'Anything with an order worth keeping.',
    hours: null,
  },
];

export const ALL_ROUTINE_OCCASIONS: BuiltInOccasion[] = ROUTINE_OCCASIONS.map((entry) => entry.key);

/**
 * One "when it happens" somebody made themselves: Work, the school run,
 * the workshop. Added 2026-09-17, because "Something else" is a place to
 * put one routine and no place at all to put six.
 *
 * The hours are optional and mean what they mean for a built-in: which
 * part of the day this covers, used for nothing but putting the routine
 * that fits the clock at the top of the list. One with no hours behaves
 * exactly like Something else, which is the right default for a name that
 * is about a place or a person rather than an hour.
 */
export type CustomOccasion = {
  id: string;
  name: string;
  /** Local hours covered, start inclusive, end exclusive, or both null for
   *  one that does not belong to a time of day. A range that wraps midnight
   *  is written with from greater than to, the same as the built-ins. */
  hourFrom: number | null;
  hourTo: number | null;
  position: number;
};

/** A built-in and a person's own seen the same way: what the picker lists,
 *  what a label lookup reads, and what the clock is compared against. */
export type OccasionChoice = {
  key: RoutineOccasion;
  label: string;
  /** The line under the picker, or null for a custom one with no hours,
   *  where there is nothing to say that the name does not say already. */
  example: string | null;
  hours: { from: number; to: number } | null;
  /** Whether this is one the person made, which is the only thing that can
   *  be renamed or removed. */
  mine: boolean;
};

/** A clock hour the way somebody says it: 7am, 12pm, 12am. */
export function formatHour(hour: number): string {
  const wrapped = ((Math.trunc(hour) % 24) + 24) % 24;
  const suffix = wrapped < 12 ? 'am' : 'pm';
  const shown = wrapped % 12 === 0 ? 12 : wrapped % 12;
  return `${shown}${suffix}`;
}

/** The line a custom occasion's hours read as, or null when it has none.
 *  A range that starts and ends on the same hour is no range at all and
 *  reads as none, rather than as a day long or a moment long. */
export function describeOccasionHours(hourFrom: number | null, hourTo: number | null): string | null {
  if (hourFrom === null || hourTo === null || hourFrom === hourTo) return null;
  return `Around ${formatHour(hourFrom)} to ${formatHour(hourTo)}.`;
}

function customOccasionHours(entry: CustomOccasion): { from: number; to: number } | null {
  if (entry.hourFrom === null || entry.hourTo === null) return null;
  if (entry.hourFrom === entry.hourTo) return null;
  return { from: entry.hourFrom, to: entry.hourTo };
}

/**
 * Every occasion there is, the person's own first. Theirs lead because a
 * name somebody typed is more specific than one that shipped with the app,
 * and because the four built-ins are what a list falls back to rather than
 * what it starts from once there are others. That order also settles which
 * one wins when two cover the same hour: see suggestedOccasion.
 */
export function occasionChoices(custom: CustomOccasion[] = []): OccasionChoice[] {
  const mine: OccasionChoice[] = [...custom]
    .sort((a, b) => a.position - b.position)
    .map((entry) => ({
      key: entry.id,
      label: entry.name,
      example: describeOccasionHours(entry.hourFrom, entry.hourTo),
      hours: customOccasionHours(entry),
      mine: true,
    }));
  const built: OccasionChoice[] = ROUTINE_OCCASIONS.map((entry) => ({
    key: entry.key,
    label: entry.label,
    example: entry.example,
    hours: entry.hours,
    mine: false,
  }));
  return [...mine, ...built];
}

export function findOccasion(
  occasion: RoutineOccasion,
  custom: CustomOccasion[] = [],
): OccasionChoice | null {
  return occasionChoices(custom).find((entry) => entry.key === occasion) ?? null;
}

export function routineOccasionLabel(occasion: RoutineOccasion, custom: CustomOccasion[] = []): string {
  return findOccasion(occasion, custom)?.label ?? 'Something else';
}

/** Whether an occasion still exists, which is the whole of what saving a
 *  routine has to check. An id whose occasion was removed is not known any
 *  more and falls back to Something else. */
export function isKnownOccasion(occasion: RoutineOccasion, custom: CustomOccasion[] = []): boolean {
  return findOccasion(occasion, custom) !== null;
}

export type RoutineStep = {
  id: string;
  routineId: string;
  /** The instruction, said the way somebody would say it to themselves. */
  text: string;
  /** One optional line underneath, shown only while this is the step on
   *  screen. Where the spare key is, which drawer, how many. */
  detail: string | null;
  position: number;
  /** The check this step also answers, when it is one worth being able to
   *  look up later. Null for a step that is only ever part of the walk. */
  checkId: string | null;
};

export type Routine = {
  id: string;
  name: string;
  occasion: RoutineOccasion;
  active: boolean;
  position: number;
  /** When the last step was finished, not when the walk started. A routine
   *  abandoned half way through has not been done. */
  lastCompletedAt: string | null;
  steps: RoutineStep[];
};

// ------------------------------------------------------------------ checks

/** How often a check comes round, which is the whole of what decides
 *  whether the last mark still counts. 'anytime' has no period at all: the
 *  honest answer for a thing with no schedule is when it last happened, not
 *  yes or no, and saying "not done" about a smoke alarm battery nobody is
 *  overdue on would be the app inventing a deadline. */
export type CheckCadence = 'daily' | 'weekly' | 'monthly' | 'anytime';

export const CHECK_CADENCES: { key: CheckCadence; label: string; example: string }[] = [
  { key: 'daily', label: 'Every day', example: 'Morning pill, back door, the cat.' },
  { key: 'weekly', label: 'Every week', example: 'Bins out, the long walk, watering.' },
  { key: 'monthly', label: 'Every month', example: 'The electric bill, the filter, a meter reading.' },
  {
    key: 'anytime',
    label: 'No set pattern',
    example: 'Smoke alarm battery. You only want to know when it last happened.',
  },
];

export const ALL_CHECK_CADENCES: CheckCadence[] = CHECK_CADENCES.map((entry) => entry.key);

export function checkCadenceLabel(cadence: CheckCadence): string {
  return CHECK_CADENCES.find((entry) => entry.key === cadence)?.label ?? 'No set pattern';
}

/** How a mark came to be written. Kept because the two read differently
 *  later: a mark somebody tapped is them saying they did it, and a mark a
 *  routine wrote is them having walked past it inside the routine, which is
 *  the same claim made in passing. */
export type CheckMarkVia = 'tap' | 'routine';

export type DoneCheck = {
  id: string;
  name: string;
  cadence: CheckCadence;
  active: boolean;
  position: number;
  lastMarkedAt: string | null;
  lastMarkedVia: CheckMarkVia | null;
};

// -------------------------------------------------------------------- text

export const MAX_ROUTINE_NAME = 60;
export const MAX_STEP_TEXT = 140;
export const MAX_STEP_DETAIL = 200;
export const MAX_CHECK_NAME = 60;
export const MAX_OCCASION_NAME = 40;

/** Whitespace collapsed, nothing else touched. The same refusal to rewrite
 *  somebody's words that lib/captureNotes.ts makes. */
export function cleanRoutineText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function isRoutineTextUsable(value: string): boolean {
  return cleanRoutineText(value).length > 0;
}

// --------------------------------------------------------- when things count

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** The Monday of the week a moment falls in, matching the convention
 *  lib/workMeaning.ts already set for this app rather than adding a second
 *  one. Sunday counts as the end of the week it trails, not the start of
 *  the next. */
export function startOfLocalWeek(date: Date): Date {
  const day = startOfLocalDay(date);
  // getDay(): 0 Sunday through 6 Saturday. Monday is 1, so Sunday steps
  // back six days rather than forward one.
  const back = (day.getDay() + 6) % 7;
  return new Date(day.getFullYear(), day.getMonth(), day.getDate() - back);
}

/**
 * When the period a check is currently inside began, or null for a cadence
 * that has no period. Everything about "is this still done" reduces to
 * whether the last mark landed on or after this moment.
 */
export function periodStart(cadence: CheckCadence, now: Date): Date | null {
  if (cadence === 'daily') return startOfLocalDay(now);
  if (cadence === 'weekly') return startOfLocalWeek(now);
  if (cadence === 'monthly') return new Date(now.getFullYear(), now.getMonth(), 1);
  return null;
}

export type CheckStanding = {
  check: DoneCheck;
  /** Whether the last mark still counts for the period we are in now. Null
   *  for 'anytime', which has no period: neither yes nor no is true there. */
  doneThisPeriod: boolean | null;
  lastMarkedAt: string | null;
  /** The one line somebody actually reads. */
  line: string;
};

export function checkStanding(check: DoneCheck, now: Date): CheckStanding {
  const start = periodStart(check.cadence, now);
  const parsed = check.lastMarkedAt ? new Date(check.lastMarkedAt) : null;
  const marked = parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
  const doneThisPeriod = start === null ? null : Boolean(marked && marked.getTime() >= start.getTime());
  return {
    check,
    doneThisPeriod,
    lastMarkedAt: marked ? check.lastMarkedAt : null,
    line: describeCheckStanding(check.cadence, doneThisPeriod, marked, now),
  };
}

/** "today", "this week", "this month". The words a cadence is spoken in. */
export function periodWord(cadence: CheckCadence): string {
  if (cadence === 'daily') return 'today';
  if (cadence === 'weekly') return 'this week';
  if (cadence === 'monthly') return 'this month';
  return 'yet';
}

/** A clock time the way somebody would say it: 7:12am, 11:40pm. */
export function formatMarkClock(date: Date): string {
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const suffix = hours < 12 ? 'am' : 'pm';
  const shown = hours % 12 === 0 ? 12 : hours % 12;
  return `${shown}:${minutes}${suffix}`;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * When a mark happened, said as somebody would say it. Today keeps its
 * clock time, because "did I take my pill" is answered by the hour and not
 * by the day. Anything older loses the clock, since the hour of a thing
 * eleven days ago is noise.
 */
export function describeMarkMoment(markedAt: string, now: Date): string {
  const then = new Date(markedAt);
  if (Number.isNaN(then.getTime())) return '';
  const days = Math.round((startOfLocalDay(now).getTime() - startOfLocalDay(then).getTime()) / 86400000);
  if (days <= 0) return `today at ${formatMarkClock(then)}`;
  if (days === 1) return `yesterday at ${formatMarkClock(then)}`;
  if (days < 7) return `${DAY_NAMES[then.getDay()]} at ${formatMarkClock(then)}`;
  if (days < 14) return 'over a week ago';
  if (days < 62) return `${Math.floor(days / 7)} weeks ago`;
  const months = Math.floor(days / 30);
  return `${months} months ago`;
}

function describeCheckStanding(
  cadence: CheckCadence,
  doneThisPeriod: boolean | null,
  marked: Date | null,
  now: Date,
): string {
  const moment = marked ? describeMarkMoment(marked.toISOString(), now) : null;
  // No period at all, so there is nothing to be behind on, and the only
  // honest thing to say is when it last happened.
  if (doneThisPeriod === null) {
    return moment ? `Last done ${moment}.` : 'Nothing recorded yet.';
  }
  if (doneThisPeriod) {
    const word = cadence === 'daily' ? 'Done' : `Done ${periodWord(cadence)}`;
    return moment ? `${word}, ${moment.replace(/^today at /, '')}.` : `${word}.`;
  }
  if (!moment) return `Not recorded ${periodWord(cadence)}.`;
  return `Not ${periodWord(cadence)}. Last done ${moment}.`;
}

// ---------------------------------------------------------- what Home reads

/** Which occasion the clock is currently in, or null when it is the middle
 *  of the day and no routine is the obvious one.
 *
 *  A person's own occasions are checked before the built-in four, so a
 *  Work that runs 9 to 5 wins over Morning between 9 and 11 rather than
 *  losing to it. Two of the person's own covering the same hour are
 *  settled by the order they put them in, which is the only answer they
 *  have a say in. */
export function suggestedOccasion(now: Date, custom: CustomOccasion[] = []): RoutineOccasion | null {
  const hour = now.getHours();
  for (const entry of occasionChoices(custom)) {
    if (!entry.hours) continue;
    const { from, to } = entry.hours;
    const inside = from <= to ? hour >= from && hour < to : hour >= from || hour < to;
    if (inside) return entry.key;
  }
  return null;
}

/**
 * Active routines with whichever one fits the clock first, everything else
 * in the order it was put in. Leaving the house never leads, because it has
 * no hour: a list that guessed at it would be wrong most of the day.
 */
export function orderRoutinesForNow(
  routines: Routine[],
  now: Date,
  custom: CustomOccasion[] = [],
): Routine[] {
  const fits = suggestedOccasion(now, custom);
  const byPosition = routines.filter((routine) => routine.active).sort((a, b) => a.position - b.position);
  if (!fits) return byPosition;
  return [
    ...byPosition.filter((routine) => routine.occasion === fits),
    ...byPosition.filter((routine) => routine.occasion !== fits),
  ];
}

/** Whether a routine has been finished since the start of today, which is
 *  the only window that means anything for a morning or bedtime walk. */
export function routineDoneToday(routine: Routine, now: Date): boolean {
  if (!routine.lastCompletedAt) return false;
  const then = new Date(routine.lastCompletedAt);
  if (Number.isNaN(then.getTime())) return false;
  return then.getTime() >= startOfLocalDay(now).getTime();
}

/** The line under a routine's name, on Home and in the list. */
export function describeRoutineStanding(routine: Routine, now: Date): string {
  const count = routine.steps.length;
  const steps = count === 1 ? '1 step' : `${count} steps`;
  if (count === 0) return 'No steps yet. Add the first one to make this walkable.';
  if (routine.lastCompletedAt && routineDoneToday(routine, now)) {
    return `${steps}. Finished ${describeMarkMoment(routine.lastCompletedAt, now)}.`;
  }
  if (!routine.lastCompletedAt) return `${steps}. Not walked yet.`;
  return `${steps}. Last finished ${describeMarkMoment(routine.lastCompletedAt, now)}.`;
}

/** "Step 3 of 7". Stated once rather than built at each call site, so the
 *  three places that show progress cannot drift apart. */
export function routineProgressLabel(index: number, total: number): string {
  if (total <= 0) return '';
  const shown = Math.min(Math.max(index + 1, 1), total);
  return `Step ${shown} of ${total}`;
}

export type ChecksSummary = { total: number; waiting: number; done: number; noPeriod: number };

export function summarizeChecks(checks: DoneCheck[], now: Date): ChecksSummary {
  let waiting = 0;
  let done = 0;
  let noPeriod = 0;
  for (const check of checks) {
    if (!check.active) continue;
    const standing = checkStanding(check, now);
    if (standing.doneThisPeriod === null) noPeriod += 1;
    else if (standing.doneThisPeriod) done += 1;
    else waiting += 1;
  }
  return { total: waiting + done + noPeriod, waiting, done, noPeriod };
}

/**
 * The card's own line. Says nothing at all when nothing is waiting, because
 * a card announcing "0 to record" every morning is noise, the same call the
 * capture inbox already makes about an empty inbox.
 */
export function describeChecksSummary(summary: ChecksSummary): string | null {
  if (summary.total === 0) return null;
  if (summary.waiting === 0) return null;
  const things = summary.waiting === 1 ? '1 thing' : `${summary.waiting} things`;
  return `${things} not recorded yet.`;
}

// ------------------------------------------- the checks a routine ticks off
//
// 2026-09-17, direct instruction: "Did I Do it should be related to
// Routines, not treated separately. While they are walking through a
// routine, they are also checking off things that they need to do while
// running the routine."
//
// So a check is not a second list living next to the routines. It is the
// part of a routine that is worth being able to look up afterwards, and
// the record reads that way: grouped under the routine that ticks it off,
// with the ones nothing walks past kept together at the end.

/** The checks a routine ticks off, in step order, each named once however
 *  many steps point at it. */
export function checkIdsInRoutine(routine: Routine): string[] {
  const ids: string[] = [];
  for (const step of [...routine.steps].sort((a, b) => a.position - b.position)) {
    if (step.checkId && !ids.includes(step.checkId)) ids.push(step.checkId);
  }
  return ids;
}

/** The routine that ticks a check off, or null for one nothing walks past.
 *  The earliest routine when more than one does, because a heading has to
 *  pick one and there is no better answer than the order the person put
 *  their routines in. */
export function routineForCheck(checkId: string, routines: Routine[]): Routine | null {
  const ordered = [...routines].sort((a, b) => a.position - b.position);
  return ordered.find((routine) => checkIdsInRoutine(routine).includes(checkId)) ?? null;
}

export type CheckGroup = {
  /** Null for the group of checks no routine touches. */
  routine: Routine | null;
  heading: string;
  checks: DoneCheck[];
};

export const LOOSE_CHECKS_HEADING = 'Not part of a routine';

/**
 * Checks grouped under the routine that ticks them off. Groups come out in
 * the order their first check appears rather than in routine order, so the
 * list keeps whatever order the person put the checks in: sorted by routine
 * instead, moving one check would silently move a whole heading with it.
 */
export function groupChecksByRoutine(checks: DoneCheck[], routines: Routine[]): CheckGroup[] {
  const ordered = [...routines].sort((a, b) => a.position - b.position);
  const groups: CheckGroup[] = [];
  const loose: DoneCheck[] = [];
  for (const check of checks) {
    const routine = routineForCheck(check.id, ordered);
    if (!routine) {
      loose.push(check);
      continue;
    }
    const existing = groups.find((group) => group.routine?.id === routine.id);
    if (existing) existing.checks.push(check);
    else groups.push({ routine, heading: routine.name, checks: [check] });
  }
  if (loose.length > 0) groups.push({ routine: null, heading: LOOSE_CHECKS_HEADING, checks: loose });
  return groups;
}

/** The line under a check saying where it gets ticked off, or null when
 *  nothing walks past it and the only way it is ever recorded is a tap. */
export function describeCheckRoutine(checkId: string, routines: Routine[]): string | null {
  const routine = routineForCheck(checkId, routines);
  return routine ? `Ticked off while walking ${routine.name}.` : null;
}

// ---------------------------------------------------------------- reordering

/**
 * Move a step and hand back the whole list renumbered from zero, so the
 * saved positions never develop gaps or ties. An out of range index gives
 * the list back untouched rather than throwing, since the only caller is a
 * finger on an arrow at the end of a list.
 */
export function moveRoutineStep(steps: RoutineStep[], fromIndex: number, toIndex: number): RoutineStep[] {
  if (fromIndex === toIndex) return steps;
  if (fromIndex < 0 || fromIndex >= steps.length) return steps;
  if (toIndex < 0 || toIndex >= steps.length) return steps;
  const next = [...steps];
  const [held] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, held);
  return next.map((step, index) => ({ ...step, position: index }));
}
