// Planned exercise, H11 part 3 (Schedules > Exercise). A plan is a workout
// from Life > Workouts or a plain activity by name ("Walk with the dog"),
// on a first day, optionally at a time, repeating by the same rule every
// other schedule uses (lib/repeatRule.ts). A day of a plan is marked done or
// skipped; a day with no mark is left as it is and never read as missed.
// Nothing here counts days in a row or scores how often a plan was kept.
//
// Pure, with no database or React, so scripts/test_exercise_plan.js can
// check it without a phone. Reading and writing are in lib/exercisePlanDb.ts.

import type { ExerciseCategory } from './exerciseLibrary';
import {
  addDays,
  describeRepeat,
  occurrencesOf,
  validateRepeatRule,
  weekdayOf,
  type RepeatConfig,
} from './repeatRule';
import { formatTime12 } from './timeOfDay';

export type ExercisePlan = {
  id: string;
  workoutId: string | null;
  activity: string | null;
  startsOn: string;
  /** 'HH:mm', or null for any time that day. */
  atTime: string | null;
  minutes: number | null;
  repeat: RepeatConfig;
  remind: boolean;
  note: string | null;
  archivedAt: string | null;
};

export type PlanMarkStatus = 'done' | 'skipped';

export type PlanMark = {
  planId: string;
  onDate: string;
  status: PlanMarkStatus;
  workoutSessionId: string | null;
  exerciseLogId: string | null;
  markedAt: string;
};

export type PlanDraft = {
  workoutId: string | null;
  activity: string;
  startsOn: string;
  atTime: string | null;
  minutes: string;
  repeat: RepeatConfig;
  remind: boolean;
  note: string;
};

export const MISSING_WORKOUT_TITLE = 'A workout no longer on the list';

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function blankPlanDraft(today: string): PlanDraft {
  return {
    workoutId: null,
    activity: '',
    startsOn: today,
    atTime: null,
    minutes: '',
    repeat: { type: 'none' },
    remind: true,
    note: '',
  };
}

export function draftFromPlan(plan: ExercisePlan): PlanDraft {
  return {
    workoutId: plan.workoutId,
    activity: plan.activity ?? '',
    startsOn: plan.startsOn,
    atTime: plan.atTime,
    minutes: plan.minutes != null ? String(plan.minutes) : '',
    repeat: plan.repeat,
    remind: plan.remind,
    note: plan.note ?? '',
  };
}

export function parseMinutes(text: string): number | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isInteger(value) && value >= 1 && value <= 600 ? value : null;
}

/** What stops a draft from being saved, in words, or null when it can be. */
export function planDraftProblem(draft: PlanDraft): string | null {
  if (!draft.workoutId && !draft.activity.trim()) {
    return 'Choose a workout, or type the activity.';
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.startsOn)) return 'Enter the first day as YYYY-MM-DD.';
  if (draft.minutes.trim() && parseMinutes(draft.minutes) == null) {
    return 'Enter the minutes as a whole number from 1 to 600, or leave it blank.';
  }
  if (draft.remind && !draft.atTime) return 'A reminder needs a time. Enter one, or turn the reminder off.';
  const repeatProblem = validateRepeatRule(draft.repeat);
  if (repeatProblem) return repeatProblem;
  if (draft.repeat.type !== 'none' && draft.repeat.endType === 'until_date' && draft.repeat.until && draft.repeat.until < draft.startsOn) {
    return 'The end date is before the first day.';
  }
  return null;
}

export function planTitle(plan: ExercisePlan, workoutNames: ReadonlyMap<string, string>): string {
  if (plan.workoutId) return workoutNames.get(plan.workoutId) ?? MISSING_WORKOUT_TITLE;
  return plan.activity?.trim() || 'Exercise';
}

/** "Mon 30 Sep" */
export function shortDate(date: string): string {
  const [, month, day] = date.split('-').map(Number);
  return `${WEEKDAY_NAMES[weekdayOf(date)].slice(0, 3)} ${day} ${MONTH_SHORT[month - 1]}`;
}

/** Today, Tomorrow, Yesterday, or "Monday 30 Sep". */
export function dayLabel(date: string, today: string): string {
  if (date === today) return 'Today';
  if (date === addDays(today, 1)) return 'Tomorrow';
  if (date === addDays(today, -1)) return 'Yesterday';
  const [, month, day] = date.split('-').map(Number);
  return `${WEEKDAY_NAMES[weekdayOf(date)]} ${day} ${MONTH_SHORT[month - 1]}`;
}

/** "Every Monday and Thursday at 7:00 AM, about 30 minutes". */
export function describePlan(plan: Pick<ExercisePlan, 'startsOn' | 'atTime' | 'minutes' | 'repeat'>): string {
  const when = plan.repeat.type === 'none' ? `On ${shortDate(plan.startsOn)}` : describeRepeat(plan.repeat, plan.startsOn);
  const time = plan.atTime ? ` at ${formatTime12(plan.atTime)}` : ', any time of day';
  const minutes = plan.minutes ? `, about ${plan.minutes} minutes` : '';
  return `${when}${time}${minutes}`;
}

/** Every date of a plan from `from` through `through`, both inclusive. */
export function planDatesBetween(plan: ExercisePlan, from: string, through: string): string[] {
  if (through < plan.startsOn) return [];
  return occurrencesOf(plan.startsOn, plan.repeat, { through })
    .map((occurrence) => occurrence.date)
    .filter((date) => date >= from && date <= through);
}

export function markKey(planId: string, onDate: string): string {
  return `${planId}|${onDate}`;
}

export function marksByKey(marks: readonly PlanMark[]): Map<string, PlanMark> {
  return new Map(marks.map((mark) => [markKey(mark.planId, mark.onDate), mark]));
}

export type PlanEntry = {
  plan: ExercisePlan;
  date: string;
  title: string;
  mark: PlanMark | null;
};

export type PlanDay = { date: string; entries: PlanEntry[] };

function byTime(a: PlanEntry, b: PlanEntry): number {
  const at = a.plan.atTime;
  const bt = b.plan.atTime;
  if (at && bt && at !== bt) return at < bt ? -1 : 1;
  if (at && !bt) return -1;
  if (!at && bt) return 1;
  return a.title.localeCompare(b.title);
}

/**
 * Every day from `from` through `through` that has something planned, each
 * with its entries in clock order (anything without a time last). An
 * archived plan still shows on days it was marked, since that is history,
 * and nowhere else.
 */
export function planDays(
  plans: readonly ExercisePlan[],
  marks: readonly PlanMark[],
  workoutNames: ReadonlyMap<string, string>,
  from: string,
  through: string,
): PlanDay[] {
  const marked = marksByKey(marks);
  const days = new Map<string, PlanEntry[]>();
  for (const plan of plans) {
    for (const date of planDatesBetween(plan, from, through)) {
      const mark = marked.get(markKey(plan.id, date)) ?? null;
      if (plan.archivedAt && !mark) continue;
      const list = days.get(date) ?? [];
      list.push({ plan, date, title: planTitle(plan, workoutNames), mark });
      days.set(date, list);
    }
  }
  return [...days.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, entries]) => ({ date, entries: entries.sort(byTime) }));
}

/** One line under an entry: how that day stands, never a verdict on it. */
export function entryStatusLine(entry: PlanEntry, today: string): string {
  if (entry.mark?.status === 'done') {
    return entry.mark.workoutSessionId ? 'Done, from the workout player' : 'Done';
  }
  if (entry.mark?.status === 'skipped') return 'Skipped';
  const time = entry.plan.atTime ? formatTime12(entry.plan.atTime) : null;
  if (entry.date < today) return 'Nothing marked';
  if (entry.date === today) return time ? `Planned for ${time}` : 'Planned for today, any time';
  return time ? `Planned, ${time}` : 'Planned, any time of day';
}

/** The local calendar date of a moment, 'YYYY-MM-DD'. */
export function localDate(moment: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${moment.getFullYear()}-${pad(moment.getMonth() + 1)}-${pad(moment.getDate())}`;
}

/** A local date and 'HH:mm' as a moment. */
export function momentOf(date: string, time: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

/**
 * When to remind about a plan over the next `lookaheadDays`: each planned
 * day at its time, leaving out days already marked and moments already
 * past. A plan with no time, with its reminder off, or archived has none.
 */
export function reminderMoments(
  plan: ExercisePlan,
  marks: readonly PlanMark[],
  now: Date,
  lookaheadDays: number,
): { date: string; fireAt: Date }[] {
  if (plan.archivedAt || !plan.remind || !plan.atTime) return [];
  const today = localDate(now);
  const marked = marksByKey(marks);
  const time = plan.atTime;
  return planDatesBetween(plan, today, addDays(today, lookaheadDays))
    .filter((date) => !marked.has(markKey(plan.id, date)))
    .map((date) => ({ date, fireAt: momentOf(date, time) }))
    .filter((moment) => moment.fireAt.getTime() > now.getTime());
}

export function reminderTitle(title: string): string {
  return `Time for ${title}`;
}

export function reminderBody(plan: ExercisePlan): string {
  const minutes = plan.minutes ? `About ${plan.minutes} minutes. ` : '';
  return plan.workoutId
    ? `${minutes}Tap to start the workout, one set at a time.`
    : `${minutes}Tap to open Schedules and mark it when it is done.`;
}

/**
 * The Health Connect exercise type for a finished workout, from the kinds of
 * exercise in it: all stretching or mobility is Stretching (71), any
 * strength or core work is Strength training (70), and anything else is a
 * general Workout (0).
 */
export function healthExerciseType(categories: readonly ExerciseCategory[]): number {
  if (categories.length > 0 && categories.every((category) => category === 'stretch' || category === 'mobility')) return 71;
  if (categories.some((category) => category === 'strength' || category === 'core')) return 70;
  return 0;
}

/** What a plan leaves behind when it is removed. */
export function planRemoval(plan: ExercisePlan, marks: readonly PlanMark[]): 'delete' | 'archive' {
  return marks.some((mark) => mark.planId === plan.id) ? 'archive' : 'delete';
}

export const PLAN_FOOT =
  'A day with nothing marked is left as it is. Nothing here counts days in a row or scores how often a plan is kept.';
