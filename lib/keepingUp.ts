// Keeping Up, 2026-09-23. Phase 3 of the cross-app push, and the lens for
// the second audience: somebody whose reason for opening this app is that
// daily life will not stay in their head. They already have capture,
// reminders, routines and Did I Do It. Nothing until now told them how any
// of it has been going.
//
// Five readings, all of them from records the app already keeps:
//
//   1. Did I Do It, from done_checks and done_check_marks.
//   2. Routine walks, from routine_runs.
//   3. What the capture inbox took in and let out, from capture_notes.
//   4. Upkeep done on time against done late, from upkeep_doings.
//   5. How work has been, from work_checkins.
//
// TWO RULES HOLD THE WHOLE FILE UP.
//
// FIRST, A PERIOD WITH NOTHING RECORDED IS A GAP, NEVER A ZERO. Carried
// forward from lib/eatingVariety.ts, where it was settled: a week somebody
// was too busy to log still happened. So every periodic figure here is
// `number | null`, a blank period says so in words, and the count of blank
// periods sits beside the headline. It also rules out a line chart for any
// of these series, since a line either joins across the blank, inventing a
// period, or plants it on zero.
//
// SECOND, NOTHING HERE SCORES ANYBODY. A missed day is a fact about the
// record, not a verdict on the person, and the wording everywhere says what
// was recorded rather than how well somebody did. The one place this is
// easy to get wrong is Did I Do It, where an unmarked day and a day the
// thing was done without being marked look identical in the table. Where
// that matters the sentence says what is known instead of guessing.
//
// No imports beyond the week arithmetic, so scripts/test_keeping_up.js can
// run the whole thing without a database.

import { addDays, buildWeeks, daysBetween, shortDate } from './eatingVariety';
import type { VarietyWeek, WeekCount } from './eatingVariety';

export type { WeekCount };

// ---------------------------------------------------------------------------
// What gets handed in
// ---------------------------------------------------------------------------

export type CheckCadence = 'daily' | 'weekly' | 'monthly' | 'anytime';

const CADENCES: CheckCadence[] = ['daily', 'weekly', 'monthly', 'anytime'];

export function readCadence(value: string | null | undefined): CheckCadence {
  const found = CADENCES.find((cadence) => cadence === value);
  // Anytime is the fallback on purpose. It is the cadence that claims the
  // least: it says only when the thing last happened, so an unrecognised
  // value can never make the app assert that something is overdue.
  return found ?? 'anytime';
}

export type KeepingUpCheck = {
  id: string;
  name: string;
  cadence: CheckCadence;
};

/** One mark, reduced to the local day it landed on. The time of day is not
 *  read anywhere here: two marks on one day are one day kept. */
export type KeepingUpMark = {
  checkId: string;
  date: string;
};

/** One walk of a routine. Written at the moment the walk begins and updated
 *  as it moves, so a walk somebody abandoned still leaves the row that says
 *  where they got to. completedAt stays null in that case. */
export type KeepingUpRun = {
  routineId: string;
  routineName: string;
  date: string;
  completed: boolean;
  stepsDone: number;
  stepsTotal: number;
  stoppedOnStep: string | null;
};

export type KeepingUpCapture = {
  date: string;
  sortedDate: string | null;
  doneDate: string | null;
  waiting: boolean;
};

/** One upkeep item being done, with the date it was due on at the time.
 *  dueOn is null where nothing had ever set a schedule for it, and that
 *  reads as could not be told rather than as on time. */
export type KeepingUpUpkeepDoing = {
  itemName: string;
  doneOn: string;
  dueOn: string | null;
};

/** Where upkeep stands today, which is the one thing the app could always
 *  answer. Band 4 leads with it while the history behind it is still thin. */
export type KeepingUpUpkeepStanding = {
  overdue: number;
  dueSoon: number;
  settled: number;
  worstName: string | null;
  worstDaysLate: number | null;
};

export type KeepingUpWorkCheckin = {
  weekOf: string;
  autonomy: number;
  competence: number;
  relatedness: number;
  drain: number;
};

export type KeepingUpInputs = {
  startDate: string;
  endDate: string;
  checks: KeepingUpCheck[];
  marks: KeepingUpMark[];
  runs: KeepingUpRun[];
  captures: KeepingUpCapture[];
  upkeepDoings: KeepingUpUpkeepDoing[];
  upkeepStanding: KeepingUpUpkeepStanding;
  workCheckins: KeepingUpWorkCheckin[];
};

// ---------------------------------------------------------------------------
// Small shared wording
// ---------------------------------------------------------------------------

export function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}

export function daysAgoPhrase(fromDate: string, today: string): string {
  const gap = daysBetween(fromDate, today);
  if (gap <= 0) return 'today';
  if (gap === 1) return 'yesterday';
  if (gap < 7) return `${gap} days ago`;
  if (gap < 14) return 'over a week ago';
  if (gap < 62) return `${Math.round(gap / 7)} weeks ago`;
  return `${shortDate(fromDate)}`;
}

/** The sentence that goes under a set of weekly rows when some of them were
 *  blank. Says what the blank means rather than leaving somebody to read it
 *  as a zero. */
export function gapNote(weeks: WeekCount[], blankMeans: string): string | null {
  const blank = weeks.filter((week) => week.value === null).length;
  if (blank === 0) return null;
  return `${blank} of these ${weeks.length} weeks ${plural(blank, 'has', 'have')} nothing to read: ${blankMeans}`;
}

function countWeeks(
  weeks: VarietyWeek[],
  valueFor: (week: VarietyWeek) => number,
): WeekCount[] {
  return weeks.map((week) => {
    const value = valueFor(week);
    return {
      weekStart: week.weekStart,
      weekEnd: week.weekEnd,
      label: `${shortDate(week.weekStart)} to ${shortDate(week.weekEnd)}`,
      partial: week.partial,
      hasLogging: value > 0,
      value: value > 0 ? value : null,
    };
  });
}

/** Weeks over the range with no logging signal attached, since every band
 *  here decides for itself what counts as a period having something in it. */
function blankWeeks(startDate: string, endDate: string): VarietyWeek[] {
  return buildWeeks(startDate, endDate, []);
}

function inWeek(date: string, week: VarietyWeek): boolean {
  return date >= week.weekStart && date <= week.weekEnd;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function oneDecimal(value: number): string {
  return (Math.round(value * 10) / 10).toFixed(1);
}

// ---------------------------------------------------------------------------
// Band 1: Did I Do It
// ---------------------------------------------------------------------------

export type CheckStanding = {
  checkId: string;
  name: string;
  cadence: CheckCadence;
  /** Days in the range this check was marked on. Counted for every cadence,
   *  since it is a plain fact, but only read out for a daily one. */
  daysMarked: number;
  daysInRange: number;
  /** Consecutive days up to today, for a daily check. Today not yet marked
   *  does not break it, since the day is not over. Null for any other
   *  cadence, where a run of days means nothing. */
  streak: number | null;
  lastMarked: string | null;
  line: string;
};

export type ChecksBand = {
  hasChecks: boolean;
  hasMarks: boolean;
  headline: string;
  weeks: WeekCount[];
  gapNote: string | null;
  standings: CheckStanding[];
  /** The honest limit on the whole band, shown every time. */
  caveat: string;
};

/** Consecutive days ending today. An unmarked today is allowed to be the
 *  day in progress rather than a broken run, so the walk starts at today
 *  when today is marked and at yesterday when it is not. */
export function dailyStreak(markedDates: Set<string>, today: string): number {
  let cursor = markedDates.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (markedDates.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function describeCheckStanding(standing: CheckStanding, today: string): string {
  const last = standing.lastMarked;
  if (!last) return 'Never marked.';
  if (standing.cadence === 'daily') {
    const kept = `Marked on ${standing.daysMarked} of the last ${standing.daysInRange} days`;
    if (standing.streak && standing.streak > 1) {
      return `${kept}, ${standing.streak} days running.`;
    }
    return `${kept}. Last marked ${daysAgoPhrase(last, today)}.`;
  }
  if (standing.cadence === 'anytime') {
    return `Last marked ${daysAgoPhrase(last, today)}.`;
  }
  const window = standing.cadence === 'weekly' ? 7 : 31;
  const gap = daysBetween(last, today);
  const period = standing.cadence === 'weekly' ? 'week' : 'month';
  if (gap > window) {
    return `Last marked ${daysAgoPhrase(last, today)}, which is more than a ${period} back.`;
  }
  return `Marked ${standing.daysMarked} ${plural(standing.daysMarked, 'time', 'times')} in this range. Last marked ${daysAgoPhrase(last, today)}.`;
}

export function summarizeChecks(inputs: KeepingUpInputs): ChecksBand {
  const today = inputs.endDate;
  const caveat =
    'A day with no mark means no mark was made. It does not mean the thing went undone, since plenty gets done without anybody tapping anything.';

  const weeksBase = blankWeeks(inputs.startDate, inputs.endDate);
  const inRange = inputs.marks.filter((mark) => mark.date >= inputs.startDate && mark.date <= inputs.endDate);

  const weeks = countWeeks(weeksBase, (week) => {
    const days = new Set(inRange.filter((mark) => inWeek(mark.date, week)).map((mark) => mark.date));
    return days.size;
  });

  const daysInRange = daysBetween(inputs.startDate, inputs.endDate) + 1;
  const byCheck = new Map<string, Set<string>>();
  for (const mark of inputs.marks) {
    const held = byCheck.get(mark.checkId) ?? new Set<string>();
    held.add(mark.date);
    byCheck.set(mark.checkId, held);
  }

  const standings: CheckStanding[] = inputs.checks.map((check) => {
    const allDates = byCheck.get(check.id) ?? new Set<string>();
    const rangeDates = Array.from(allDates).filter((date) => date >= inputs.startDate && date <= inputs.endDate);
    const lastMarked = Array.from(allDates).sort().pop() ?? null;
    const standing: CheckStanding = {
      checkId: check.id,
      name: check.name,
      cadence: check.cadence,
      daysMarked: rangeDates.length,
      daysInRange,
      streak: check.cadence === 'daily' ? dailyStreak(allDates, today) : null,
      lastMarked,
      line: '',
    };
    standing.line = describeCheckStanding(standing, today);
    return standing;
  });

  // Longest run first, since the thing somebody has kept going is the part
  // worth seeing first. A check never marked sorts to the bottom by itself.
  standings.sort((a, b) => (b.streak ?? 0) - (a.streak ?? 0) || b.daysMarked - a.daysMarked);

  const hasChecks = inputs.checks.length > 0;
  const hasMarks = inRange.length > 0;

  let headline: string;
  if (!hasChecks) {
    headline = 'Nothing set up under Did I Do It yet. Add one on the Life tab and this fills in on its own.';
  } else if (!hasMarks) {
    headline = `${inputs.checks.length} ${plural(inputs.checks.length, 'thing', 'things')} to check, and nothing marked in this range.`;
  } else {
    const runs = standings.filter((standing) => (standing.streak ?? 0) >= 2);
    const days = weeks.reduce((sum, week) => sum + (week.value ?? 0), 0);
    headline = `${days} ${plural(days, 'day', 'days')} with something marked in this range.`;
    if (runs.length > 0) {
      const best = runs[0];
      headline = `${headline} ${best.name} is on ${best.streak} days running.`;
    }
  }

  return {
    hasChecks,
    hasMarks,
    headline,
    weeks,
    gapNote: gapNote(weeks, 'nothing was marked in them.'),
    standings,
    caveat,
  };
}

// ---------------------------------------------------------------------------
// Band 2: routine walks
// ---------------------------------------------------------------------------

export type RoutineStall = {
  routineName: string;
  step: string;
  times: number;
  line: string;
};

export type RoutineStanding = {
  routineId: string;
  routineName: string;
  started: number;
  finished: number;
  line: string;
};

export type RoutinesBand = {
  hasRuns: boolean;
  headline: string;
  weeks: WeekCount[];
  gapNote: string | null;
  started: number;
  finished: number;
  finishedShare: number | null;
  standings: RoutineStanding[];
  stalls: RoutineStall[];
  note: string | null;
};

export function summarizeRoutines(inputs: KeepingUpInputs): RoutinesBand {
  const runs = inputs.runs.filter((run) => run.date >= inputs.startDate && run.date <= inputs.endDate);
  const weeksBase = blankWeeks(inputs.startDate, inputs.endDate);
  const weeks = countWeeks(weeksBase, (week) => runs.filter((run) => inWeek(run.date, week)).length);

  const started = runs.length;
  const finished = runs.filter((run) => run.completed).length;
  const finishedShare = started > 0 ? finished / started : null;

  const byRoutine = new Map<string, RoutineStanding>();
  for (const run of runs) {
    const held =
      byRoutine.get(run.routineId) ??
      ({ routineId: run.routineId, routineName: run.routineName, started: 0, finished: 0, line: '' } as RoutineStanding);
    held.started += 1;
    if (run.completed) held.finished += 1;
    held.routineName = run.routineName;
    byRoutine.set(run.routineId, held);
  }
  const standings = Array.from(byRoutine.values()).sort((a, b) => b.started - a.started);
  for (const standing of standings) {
    const walked = `${standing.started} ${plural(standing.started, 'walk', 'walks')}`;
    if (standing.finished === standing.started) {
      standing.line = `${walked}, all finished.`;
    } else if (standing.finished === 0) {
      standing.line = `${walked}, none of them reached the last step.`;
    } else {
      standing.line = `${walked}, ${standing.finished} finished.`;
    }
  }

  // Where walks stop. Counted by the wording of the step rather than by its
  // id, so editing a routine keeps the history readable and two routines
  // with a step of the same name stay apart through the routine name.
  const stallCounts = new Map<string, RoutineStall>();
  for (const run of runs) {
    if (run.completed || !run.stoppedOnStep) continue;
    const key = `${run.routineName}|${run.stoppedOnStep}`;
    const held = stallCounts.get(key) ?? { routineName: run.routineName, step: run.stoppedOnStep, times: 0, line: '' };
    held.times += 1;
    stallCounts.set(key, held);
  }
  const stalls = Array.from(stallCounts.values())
    .filter((stall) => stall.times >= 2)
    .sort((a, b) => b.times - a.times)
    .slice(0, 3);
  for (const stall of stalls) {
    stall.line = `${stall.routineName} stopped here ${stall.times} times.`;
  }

  let headline: string;
  if (started === 0) {
    headline = 'No routine walks recorded in this range. This fills in from the next one you walk.';
  } else if (finished === started) {
    headline = `${started} ${plural(started, 'walk', 'walks')}, every one of them finished.`;
  } else {
    headline = `${started} ${plural(started, 'walk', 'walks')}, ${finished} of them finished to the last step.`;
  }

  const note =
    stalls.length > 0
      ? 'A step things stop on more than once is worth a look: it may be in the wrong place in the order, or it may be two steps wearing one label.'
      : null;

  return {
    hasRuns: started > 0,
    headline,
    weeks,
    gapNote: gapNote(weeks, 'no routine was walked in them.'),
    started,
    finished,
    finishedShare,
    standings,
    stalls,
    note,
  };
}

// ---------------------------------------------------------------------------
// Band 3: the capture inbox
// ---------------------------------------------------------------------------

export type CapturesBand = {
  hasCaptures: boolean;
  headline: string;
  weeks: WeekCount[];
  gapNote: string | null;
  captured: number;
  sorted: number;
  stillWaiting: number;
  sortedShare: number | null;
  typicalWaitDays: number | null;
  oldestWaitingDays: number | null;
  note: string | null;
};

/** The middle value rather than the mean, since one note left for six months
 *  would drag an average somewhere nobody recognises. */
export function middleValue(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle];
  return (sorted[middle - 1] + sorted[middle]) / 2;
}

export function summarizeCaptures(inputs: KeepingUpInputs): CapturesBand {
  const captures = inputs.captures.filter((note) => note.date >= inputs.startDate && note.date <= inputs.endDate);
  const weeksBase = blankWeeks(inputs.startDate, inputs.endDate);
  const weeks = countWeeks(weeksBase, (week) => captures.filter((note) => inWeek(note.date, week)).length);

  const captured = captures.length;
  const sorted = captures.filter((note) => note.sortedDate !== null || note.doneDate !== null).length;
  const stillWaiting = inputs.captures.filter((note) => note.waiting).length;
  const sortedShare = captured > 0 ? sorted / captured : null;

  const waits = captures
    .filter((note) => note.sortedDate !== null)
    .map((note) => daysBetween(note.date, note.sortedDate as string))
    .filter((days) => days >= 0);
  const typicalWaitDays = middleValue(waits);

  const waitingDates = inputs.captures.filter((note) => note.waiting).map((note) => note.date).sort();
  const oldestWaitingDays = waitingDates.length > 0 ? daysBetween(waitingDates[0], inputs.endDate) : null;

  let headline: string;
  if (captured === 0) {
    headline = 'Nothing captured in this range.';
  } else {
    headline = `${captured} ${plural(captured, 'note', 'notes')} captured, ${sorted} of them sorted.`;
  }

  let note: string | null = null;
  if (typicalWaitDays !== null) {
    const waitWord =
      typicalWaitDays < 1 ? 'the same day' : `${oneDecimal(typicalWaitDays)} ${plural(typicalWaitDays, 'day', 'days')}`;
    note = `A note usually waits ${waitWord} before it gets sorted.`;
  }
  if (oldestWaitingDays !== null && oldestWaitingDays >= 14) {
    const carried = `The oldest note still waiting has been there ${oldestWaitingDays} days.`;
    note = note ? `${note} ${carried}` : carried;
  }

  return {
    hasCaptures: captured > 0,
    headline,
    weeks,
    gapNote: gapNote(weeks, 'nothing was captured in them.'),
    captured,
    sorted,
    stillWaiting,
    sortedShare,
    typicalWaitDays,
    oldestWaitingDays,
    note,
  };
}

// ---------------------------------------------------------------------------
// Band 4: upkeep, on time against late
// ---------------------------------------------------------------------------

export type UpkeepDoingLine = {
  itemName: string;
  doneOn: string;
  daysLate: number | null;
  line: string;
};

export type UpkeepBand = {
  hasHistory: boolean;
  headline: string;
  standingLine: string;
  onTime: number;
  late: number;
  couldNotTell: number;
  averageDaysLate: number | null;
  recent: UpkeepDoingLine[];
  historyNote: string;
};

export function describeUpkeepDoing(doing: KeepingUpUpkeepDoing): UpkeepDoingLine {
  if (!doing.dueOn) {
    return {
      itemName: doing.itemName,
      doneOn: doing.doneOn,
      daysLate: null,
      line: `Done ${shortDate(doing.doneOn)}. Nothing had set a date for it, so there is nothing to call it early or late against.`,
    };
  }
  const daysLate = daysBetween(doing.dueOn, doing.doneOn);
  if (daysLate <= 0) {
    const early = Math.abs(daysLate);
    return {
      itemName: doing.itemName,
      doneOn: doing.doneOn,
      daysLate,
      line:
        early === 0
          ? `Done ${shortDate(doing.doneOn)}, on the day it was due.`
          : `Done ${shortDate(doing.doneOn)}, ${early} ${plural(early, 'day', 'days')} before it was due.`,
    };
  }
  return {
    itemName: doing.itemName,
    doneOn: doing.doneOn,
    daysLate,
    line: `Done ${shortDate(doing.doneOn)}, ${daysLate} ${plural(daysLate, 'day', 'days')} after it was due.`,
  };
}

export function describeUpkeepStandingLine(standing: KeepingUpUpkeepStanding): string {
  const total = standing.overdue + standing.dueSoon + standing.settled;
  if (total === 0) return 'Nothing on the upkeep list yet.';
  if (standing.overdue === 0 && standing.dueSoon === 0) {
    return `All ${total} ${plural(total, 'item', 'items')} on the upkeep list are settled for now.`;
  }
  const parts: string[] = [];
  if (standing.overdue > 0) parts.push(`${standing.overdue} past due`);
  if (standing.dueSoon > 0) parts.push(`${standing.dueSoon} due soon`);
  let line = `${parts.join(' and ')} out of ${total}.`;
  if (standing.worstName && standing.worstDaysLate && standing.worstDaysLate > 0) {
    line = `${line} ${standing.worstName} is furthest behind, by ${standing.worstDaysLate} ${plural(standing.worstDaysLate, 'day', 'days')}.`;
  }
  return line;
}

export function summarizeUpkeepTimeliness(inputs: KeepingUpInputs): UpkeepBand {
  const doings = inputs.upkeepDoings
    .filter((doing) => doing.doneOn >= inputs.startDate && doing.doneOn <= inputs.endDate)
    .sort((a, b) => (a.doneOn < b.doneOn ? 1 : -1));
  const lines = doings.map(describeUpkeepDoing);

  const dated = lines.filter((line) => line.daysLate !== null);
  const onTime = dated.filter((line) => (line.daysLate as number) <= 0).length;
  const late = dated.filter((line) => (line.daysLate as number) > 0).length;
  const couldNotTell = lines.length - dated.length;
  const averageDaysLate = average(dated.filter((line) => (line.daysLate as number) > 0).map((line) => line.daysLate as number));

  const standingLine = describeUpkeepStandingLine(inputs.upkeepStanding);

  let headline: string;
  if (lines.length === 0) {
    headline = 'Nothing marked done in this range, so there is nothing to compare against a due date yet.';
  } else if (late === 0 && dated.length > 0) {
    headline = `${dated.length} ${plural(dated.length, 'thing', 'things')} done, every one of them by the date it was due.`;
  } else {
    headline = `${lines.length} ${plural(lines.length, 'thing', 'things')} done: ${onTime} by the date ${plural(onTime, 'it was', 'they were')} due, ${late} after.`;
  }
  if (couldNotTell > 0) {
    headline = `${headline} ${couldNotTell} had no due date to be measured against.`;
  }

  return {
    hasHistory: lines.length > 0,
    headline,
    standingLine,
    onTime,
    late,
    couldNotTell,
    averageDaysLate,
    recent: lines.slice(0, 6),
    historyNote:
      'Until 2026-09-23 the app kept only the last time each upkeep item was done, so this counts from when it started keeping every one of them.',
  };
}

// ---------------------------------------------------------------------------
// Band 5: how work has been
// ---------------------------------------------------------------------------

export type WorkBand = {
  hasCheckins: boolean;
  headline: string;
  weeks: WeekCount[];
  gapNote: string | null;
  answered: number;
  averageDrain: number | null;
  drainDirection: string | null;
  needsLine: string | null;
  caveat: string;
};

/** Compares the recent half of the answered weeks against the earlier half.
 *  Halves rather than first against last, since one hard week should not
 *  read as a direction. Null until there are four answered weeks, which is
 *  the point at which two halves are two weeks each. */
export function drainDirection(values: number[]): string | null {
  if (values.length < 4) return null;
  const middle = Math.floor(values.length / 2);
  const earlier = average(values.slice(0, middle));
  const recent = average(values.slice(middle));
  if (earlier === null || recent === null) return null;
  const change = recent - earlier;
  if (Math.abs(change) < 0.5) return 'Roughly the same across the range.';
  if (change > 0) {
    return `Work has been taking more out of you lately: ${oneDecimal(earlier)} earlier in the range against ${oneDecimal(recent)} more recently.`;
  }
  return `Work has been taking less out of you lately: ${oneDecimal(earlier)} earlier in the range against ${oneDecimal(recent)} more recently.`;
}

export function summarizeWork(inputs: KeepingUpInputs): WorkBand {
  const caveat =
    'Four answers a week on a scale of one to five. There is no score here and nothing being graded. What it took out of you is the one worth putting beside your flares, since that is the answer that might line up with them.';

  const checkins = inputs.workCheckins
    .filter((checkin) => checkin.weekOf >= addDays(inputs.startDate, -6) && checkin.weekOf <= inputs.endDate)
    .sort((a, b) => (a.weekOf < b.weekOf ? -1 : 1));

  const weeksBase = blankWeeks(inputs.startDate, inputs.endDate);
  const weeks: WeekCount[] = weeksBase.map((week) => {
    const found = checkins.find((checkin) => inWeek(checkin.weekOf, week));
    return {
      weekStart: week.weekStart,
      weekEnd: week.weekEnd,
      label: `${shortDate(week.weekStart)} to ${shortDate(week.weekEnd)}`,
      partial: week.partial,
      hasLogging: found !== undefined,
      value: found ? found.drain : null,
    };
  });

  const drains = checkins.map((checkin) => checkin.drain);
  const averageDrain = average(drains);

  let headline: string;
  if (checkins.length === 0) {
    headline = 'No work check-ins answered in this range. One takes a few seconds on the Life tab.';
  } else {
    headline = `${checkins.length} ${plural(checkins.length, 'week', 'weeks')} answered. What work took out of you averaged ${oneDecimal(averageDrain as number)} out of 5.`;
  }

  let needsLine: string | null = null;
  if (checkins.length > 0) {
    const say = average(checkins.map((checkin) => checkin.autonomy));
    const good = average(checkins.map((checkin) => checkin.competence));
    const people = average(checkins.map((checkin) => checkin.relatedness));
    needsLine = `Say over how you work ${oneDecimal(say as number)}, being good at it ${oneDecimal(good as number)}, the people ${oneDecimal(people as number)}.`;
  }

  return {
    hasCheckins: checkins.length > 0,
    headline,
    weeks,
    gapNote: gapNote(weeks, 'no check-in was answered for them.'),
    answered: checkins.length,
    averageDrain,
    drainDirection: drainDirection(drains),
    needsLine,
    caveat,
  };
}

// ---------------------------------------------------------------------------
// The whole lens
// ---------------------------------------------------------------------------

export type KeepingUpSummary = {
  hasAnything: boolean;
  checks: ChecksBand;
  routines: RoutinesBand;
  captures: CapturesBand;
  upkeep: UpkeepBand;
  work: WorkBand;
};

export function summarizeKeepingUp(inputs: KeepingUpInputs): KeepingUpSummary {
  const checks = summarizeChecks(inputs);
  const routines = summarizeRoutines(inputs);
  const captures = summarizeCaptures(inputs);
  const upkeep = summarizeUpkeepTimeliness(inputs);
  const work = summarizeWork(inputs);
  return {
    hasAnything:
      checks.hasChecks ||
      routines.hasRuns ||
      captures.hasCaptures ||
      upkeep.hasHistory ||
      work.hasCheckins ||
      inputs.upkeepStanding.overdue + inputs.upkeepStanding.dueSoon + inputs.upkeepStanding.settled > 0,
    checks,
    routines,
    captures,
    upkeep,
    work,
  };
}

// ---------------------------------------------------------------------------
// Home
// ---------------------------------------------------------------------------

export type KeepingUpHomeSummary = {
  /** The one number the card leads with, or null where nothing is running. */
  streakDays: number | null;
  streakName: string | null;
  line: string;
  caption: string | null;
};

/** One line of streaks, which is what the card was asked for. The longest
 *  run leads, since that is the one somebody is keeping going, and the
 *  caption carries whatever else is waiting on them. */
export function describeKeepingUpHome(summary: KeepingUpSummary): KeepingUpHomeSummary {
  const running = summary.checks.standings.filter((standing) => (standing.streak ?? 0) >= 2);
  const best = running[0] ?? null;

  let line: string;
  if (best) {
    const others = running.length - 1;
    line =
      others > 0
        ? `${best.name}, and ${others} other ${plural(others, 'thing', 'things')} going as well.`
        : `${best.name}, kept up every day.`;
  } else if (summary.checks.hasChecks) {
    line = 'Nothing on a run at the moment. One mark today starts one.';
  } else {
    line = 'Set up something to check on the Life tab and this starts keeping count.';
  }

  const waiting: string[] = [];
  if (summary.captures.stillWaiting > 0) {
    waiting.push(`${summary.captures.stillWaiting} ${plural(summary.captures.stillWaiting, 'capture', 'captures')} still to sort`);
  }
  if (summary.upkeep.hasHistory && summary.upkeep.late > 0) {
    waiting.push(`${summary.upkeep.late} upkeep ${plural(summary.upkeep.late, 'thing', 'things')} done late`);
  }

  return {
    streakDays: best?.streak ?? null,
    streakName: best?.name ?? null,
    line,
    caption: waiting.length > 0 ? `${waiting.join(', ')}.` : null,
  };
}
