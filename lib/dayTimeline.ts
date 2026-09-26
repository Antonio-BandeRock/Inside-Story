// One timeline of the days around today (B1 of the competitive build plan,
// 2026-09-26): meals and doses from Schedules, appointments, thoughts put on
// a day, garden tasks, routines with a reminder, bills and upkeep and every
// other dated reminder, Days Until counters, check-ins, flares and sleep,
// all on one clock.
//
// Pure, with no imports, so scripts/test_day_timeline.js runs it without a
// phone. lib/dayTimelineDb.ts gathers the rows and components/DayTimeline.tsx
// draws them as one strip that scrolls smoothly sideways, opening with Now
// in the middle. There is deliberately no paging: the strip is one piece
// from a few days back to a few days ahead, and moving through it is a
// scroll, never a tap to the next day.
//
// Read-only. Every item says where it lives, and a tap goes there; marking a
// dose taken or a meal eaten stays where that record is kept.

export const TIMELINE_DAYS_BACK = 3;
export const TIMELINE_DAYS_AHEAD = 3;

export type TimelineKind =
  | 'meal'
  | 'dose'
  | 'appointment'
  | 'reminder'
  | 'garden'
  | 'routine'
  | 'checkin'
  | 'flare'
  | 'sleep'
  | 'due'
  | 'countdown'
  | 'calendar'
  | 'workout'
  | 'steps';

/** done: marked done, logged or completed. planned: still ahead. overdue:
 *  its time has passed today or yesterday and nothing is marked, which is
 *  what the list above the strip gathers. unmarked: the same, further back,
 *  left on the strip without being gathered, since a meal from four days
 *  ago that nobody marked is history rather than something waiting.
 *  record: a check-in or a night's sleep, which is a record rather than a
 *  plan and has no done or not done at all. */
export type TimelineStatus = 'done' | 'planned' | 'overdue' | 'skipped' | 'record' | 'unmarked';

export type TimelineRoute = { pathname: string; params?: Record<string, string> };

export type DayTimelineItem = {
  id: string;
  kind: TimelineKind;
  title: string;
  caption: string | null;
  /** Local wall-clock time in milliseconds. An all-day item starts at its
   *  day's local midnight. */
  start: number;
  /** The end of something with a length, such as a night's sleep. */
  end: number | null;
  allDay: boolean;
  /** 'YYYY-MM-DD', the local day it belongs to. */
  day: string;
  status: TimelineStatus;
  route: TimelineRoute;
};

// ------------------------------------------------------------------ inputs

export type TimelineScheduleRow = {
  id: string;
  /** Local 'YYYY-MM-DDTHH:mm', the way schedule_items stores it. */
  scheduledFor: string;
  itemType: string;
  mealType: string | null;
  title: string;
  status: string;
  providerName: string | null;
  location: string | null;
  /** The treatment's name for a dose row. */
  treatmentName: string | null;
};

export type TimelineRoutineInput = {
  id: string;
  name: string;
  reminderTime: string | null;
  /** 0 for Sunday. Empty means every day. */
  reminderDays: number[];
  reminderOn: boolean;
  /** The sum of the steps' minutes where any step has minutes (B4), or
   *  null when none does. */
  totalMinutes?: number | null;
};

export type TimelineRunInput = {
  id: string;
  routineId: string;
  routineName: string;
  /** ISO UTC, or null for a walk nobody finished, which is left out. */
  completedAt: string | null;
};

export type TimelineCheckinInput = {
  id: string;
  /** ISO UTC. */
  loggedAt: string;
  checkinType: string;
  valence: string | null;
  severity: number | null;
  tags: string[];
};

export type TimelineSleepInput = {
  id: string;
  startedAt: string;
  endedAt: string | null;
};

export type TimelineDatedInput = {
  kind: string;
  sourceId: string;
  title: string;
  detail: string | null;
  dueOn: string;
  tab: string;
  lens: string;
};

/** An event from the phone's calendar (B2), read live and never copied
 *  into this app's tables. */
export type TimelineCalendarInput = {
  id: string;
  title: string;
  /** ISO. */
  startDate: string;
  endDate: string;
  allDay: boolean;
  location: string | null;
  calendarTitle: string | null;
};

/** A workout Health Connect filled in (B9). */
export type TimelineWorkoutInput = {
  id: string;
  startedAt: string;
  endedAt: string | null;
  /** The exercise's name, already looked up. */
  name: string;
  minutes: number | null;
};

/** A day's steps Health Connect filled in (B9). */
export type TimelineStepsInput = {
  date: string;
  steps: number;
};

export type DayTimelineInput = {
  /** Milliseconds, the moment the timeline is drawn for. */
  now: number;
  schedule: TimelineScheduleRow[];
  routines: TimelineRoutineInput[];
  runs: TimelineRunInput[];
  checkins: TimelineCheckinInput[];
  sleep: TimelineSleepInput[];
  dated: TimelineDatedInput[];
  calendar?: TimelineCalendarInput[];
  workouts?: TimelineWorkoutInput[];
  steps?: TimelineStepsInput[];
  /** Scheduled items' optional length in minutes (B4), by schedule row id. */
  scheduleMinutes?: Record<string, number>;
  daysBack?: number;
  daysAhead?: number;
};

export type DayTimelineView = {
  today: string;
  /** Local midnight at the start of the first day shown. */
  rangeStart: number;
  /** Local midnight after the last day shown. */
  rangeEnd: number;
  /** Everything, by time. */
  items: DayTimelineItem[];
  /** Past its time and not marked, oldest first. A dated reminder whose day
   *  has gone is here even when that day is before the strip starts. */
  overdue: DayTimelineItem[];
  /** Today's items with a day but no time, not already in overdue. */
  anyTime: DayTimelineItem[];
};

// ------------------------------------------------------------------ dates

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function localDayOf(ms: number): string {
  const date = new Date(ms);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Local midnight of a 'YYYY-MM-DD' day, shifted by whole days. Built from
 *  the calendar rather than by adding 24 hours, so a daylight saving change
 *  never lands a day an hour off. */
export function dayStartMs(day: string, shiftDays = 0): number {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date + shiftDays).getTime();
}

function shiftDay(day: string, days: number): string {
  return localDayOf(dayStartMs(day, days));
}

/** A schedule row's local 'YYYY-MM-DDTHH:mm' as milliseconds. */
function localStampMs(stamp: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(stamp);
  if (!match) return null;
  const [, y, m, d, h, min] = match;
  return new Date(Number(y), Number(m) - 1, Number(d), Number(h ?? 0), Number(min ?? 0)).getTime();
}

function isoMs(iso: string): number | null {
  const ms = new Date(iso).getTime();
  return Number.isFinite(ms) ? ms : null;
}

export function clockLabel(ms: number): string {
  const date = new Date(ms);
  const hour = date.getHours();
  const minute = date.getMinutes();
  const suffix = hour < 12 ? 'am' : 'pm';
  const shown = hour % 12 === 0 ? 12 : hour % 12;
  return minute === 0 ? `${shown}${suffix}` : `${shown}:${pad(minute)}${suffix}`;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Today, Yesterday, Tomorrow, or the weekday and date. */
export function dayLabel(day: string, today: string): string {
  if (day === today) return 'Today';
  if (day === shiftDay(today, -1)) return 'Yesterday';
  if (day === shiftDay(today, 1)) return 'Tomorrow';
  const date = new Date(dayStartMs(day));
  return `${WEEKDAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function describeDuration(minutes: number): string {
  const whole = Math.max(0, Math.round(minutes));
  const hours = Math.floor(whole / 60);
  const rest = whole % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

// ------------------------------------------------------------------ words

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
  drink: 'Drink',
};

const DOSE_TYPE_LABELS: Record<string, string> = {
  supplement: 'Supplement',
  prescription: 'Prescription',
  otc: 'Over the counter',
};

const CHECKIN_TITLES: Record<string, string> = {
  flare: 'Flare',
  post_meal: 'After a meal',
  post_exercise: 'After exercise',
  general: 'Check-in',
  stress: 'Stress check-in',
  sleep: 'Sleep check-in',
  food_trial_daily: 'Food test check-in',
};

const SEVERITY_WORDS: Record<number, string> = { 1: 'Mild', 2: 'Moderate', 3: 'Severe', 4: 'Very severe' };

const VALENCE_WORDS: Record<string, string> = {
  positive: 'Felt good',
  negative: 'Felt off',
  neutral: 'Felt about the same',
};

/** The short word a card carries for its status, or null when the status
 *  needs no word (something ahead, or a record). Nothing here scolds: an
 *  unmarked meal is unmarked, not missed. */
export function statusLabel(status: TimelineStatus): string | null {
  switch (status) {
    case 'done':
      return 'Done';
    case 'skipped':
      return 'Skipped';
    case 'overdue':
    case 'unmarked':
      return 'Not marked yet';
    default:
      return null;
  }
}

export function kindLabel(kind: TimelineKind): string {
  switch (kind) {
    case 'meal':
      return 'Meal';
    case 'dose':
      return 'Dose';
    case 'appointment':
      return 'Appointment';
    case 'reminder':
      return 'Thought';
    case 'garden':
      return 'Garden';
    case 'routine':
      return 'Routine';
    case 'checkin':
      return 'Check-in';
    case 'flare':
      return 'Flare';
    case 'sleep':
      return 'Sleep';
    case 'due':
      return 'Due';
    case 'countdown':
      return 'Days Until';
    case 'calendar':
      return 'Phone calendar';
    case 'workout':
      return 'Workout';
    case 'steps':
      return 'Steps';
  }
}

function joinCaption(parts: (string | null | undefined)[]): string | null {
  const kept = parts.filter((part): part is string => !!part && part.trim().length > 0);
  return kept.length > 0 ? kept.join(' · ') : null;
}

// ------------------------------------------------------------------ build

function scheduleStatus(status: string, start: number, day: string, now: number, today: string): TimelineStatus {
  if (status === 'logged' || status === 'completed') return 'done';
  if (status === 'skipped') return 'skipped';
  if (start > now) return 'planned';
  return day === today || day === shiftDay(today, -1) ? 'overdue' : 'unmarked';
}

function scheduleItem(row: TimelineScheduleRow, now: number, today: string, minutes: number | null): DayTimelineItem | null {
  const start = localStampMs(row.scheduledFor);
  if (start === null) return null;
  const day = row.scheduledFor.slice(0, 10);
  const status = scheduleStatus(row.status, start, day, now, today);
  const end = minutes !== null && minutes > 0 ? start + minutes * 60_000 : null;
  const base = { id: `schedule:${row.id}`, start, end, allDay: false, day, status };

  if (row.itemType === 'meal') {
    return {
      ...base,
      kind: 'meal',
      title: row.title || MEAL_TYPE_LABELS[row.mealType ?? ''] || 'Meal',
      caption: row.title ? (MEAL_TYPE_LABELS[row.mealType ?? ''] ?? null) : null,
      route: { pathname: '/schedule', params: { openScheduleLens: 'todaysMeals' } },
    };
  }
  if (row.itemType in DOSE_TYPE_LABELS) {
    return {
      ...base,
      kind: 'dose',
      title: row.treatmentName || row.title || DOSE_TYPE_LABELS[row.itemType],
      caption: DOSE_TYPE_LABELS[row.itemType],
      route: { pathname: '/schedule', params: { openScheduleLens: 'meds' } },
    };
  }
  if (row.itemType === 'appointment') {
    return {
      ...base,
      kind: 'appointment',
      title: row.title || 'Appointment',
      caption: joinCaption([row.providerName, row.location]),
      route: { pathname: '/schedule', params: { openScheduleLens: 'appointments' } },
    };
  }
  if (row.itemType === 'reminder') {
    return {
      ...base,
      kind: 'reminder',
      title: row.title || 'A thought for this day',
      caption: 'Put on this day from Capture',
      route: { pathname: '/capture' },
    };
  }
  if (row.itemType === 'garden') {
    return {
      ...base,
      kind: 'garden',
      title: row.title || 'Garden task',
      caption: 'Garden task',
      route: { pathname: '/garden', params: { openGardenLens: 'upcomingTasks' } },
    };
  }
  return null;
}

function reminderMs(day: string, time: string | null): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time ?? '');
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d, hour, minute).getTime();
}

function routineItems(
  routines: TimelineRoutineInput[],
  runs: TimelineRunInput[],
  days: string[],
  now: number,
  today: string,
): DayTimelineItem[] {
  const items: DayTimelineItem[] = [];
  // Finished walks by routine and local day. A run's day is the day it was
  // finished, read through a local Date, since completed_at is UTC and ten
  // characters off it would put an evening run on tomorrow west of
  // Greenwich.
  const finished = new Map<string, number[]>();
  for (const run of runs) {
    if (!run.completedAt) continue;
    const ms = isoMs(run.completedAt);
    if (ms === null) continue;
    const key = `${run.routineId}|${localDayOf(ms)}`;
    finished.set(key, [...(finished.get(key) ?? []), ms].sort((a, b) => a - b));
  }
  const usedRuns = new Set<string>();
  const route = (id: string): TimelineRoute => ({ pathname: '/routine', params: { id } });

  for (const routine of routines) {
    if (!routine.reminderOn) continue;
    for (const day of days) {
      const weekday = new Date(dayStartMs(day)).getDay();
      if (routine.reminderDays.length > 0 && !routine.reminderDays.includes(weekday)) continue;
      const start = reminderMs(day, routine.reminderTime);
      if (start === null) continue;
      const key = `${routine.id}|${day}`;
      const doneAt = finished.get(key)?.[0] ?? null;
      if (doneAt !== null) usedRuns.add(`${key}|${doneAt}`);
      const status: TimelineStatus =
        doneAt !== null
          ? 'done'
          : start > now
            ? 'planned'
            : day === today || day === shiftDay(today, -1)
              ? 'overdue'
              : 'unmarked';
      const minutes = routine.totalMinutes ?? null;
      items.push({
        id: `routine:${routine.id}:${day}`,
        kind: 'routine',
        title: routine.name,
        caption:
          doneAt !== null
            ? `Finished at ${clockLabel(doneAt)}`
            : minutes
              ? `Routine, about ${describeDuration(minutes)}`
              : 'Routine',
        start,
        end: doneAt === null && minutes ? start + minutes * 60_000 : null,
        allDay: false,
        day,
        status,
        route: route(routine.id),
      });
    }
  }

  // A walk finished with no reminder slot to answer, whether the routine
  // has no reminder or was walked a second time that day, is still a thing
  // that happened, so it sits at the time it was finished.
  const inRange = new Set(days);
  for (const [key, times] of finished) {
    const [routineId, day] = key.split('|');
    if (!inRange.has(day)) continue;
    const run = runs.find((candidate) => candidate.routineId === routineId);
    for (const ms of times) {
      if (usedRuns.has(`${key}|${ms}`)) continue;
      items.push({
        id: `run:${routineId}:${ms}`,
        kind: 'routine',
        title: routines.find((routine) => routine.id === routineId)?.name ?? run?.routineName ?? 'Routine',
        caption: 'Routine walked through',
        start: ms,
        end: null,
        allDay: false,
        day,
        status: 'done',
        route: route(routineId),
      });
    }
  }
  return items;
}

function checkinItem(checkin: TimelineCheckinInput): DayTimelineItem | null {
  const start = isoMs(checkin.loggedAt);
  if (start === null) return null;
  const isFlare = checkin.checkinType === 'flare';
  const severity = checkin.severity !== null ? (SEVERITY_WORDS[checkin.severity] ?? null) : null;
  const feeling = checkin.tags.length > 0 ? checkin.tags.slice(0, 3).join(', ') : (VALENCE_WORDS[checkin.valence ?? ''] ?? null);
  return {
    id: `checkin:${checkin.id}`,
    kind: isFlare ? 'flare' : 'checkin',
    title: CHECKIN_TITLES[checkin.checkinType] ?? 'Check-in',
    caption: joinCaption([severity, feeling]),
    start,
    end: null,
    allDay: false,
    day: localDayOf(start),
    status: 'record',
    route: { pathname: '/log', params: isFlare ? { openSignalsLens: 'flares' } : {} },
  };
}

function sleepItem(record: TimelineSleepInput): DayTimelineItem | null {
  const start = isoMs(record.startedAt);
  if (start === null) return null;
  const endMs = record.endedAt ? isoMs(record.endedAt) : null;
  const end = endMs !== null && endMs > start ? endMs : null;
  return {
    id: `sleep:${record.id}`,
    kind: 'sleep',
    title: 'Sleep',
    caption: end !== null ? `${describeDuration((end - start) / 60000)}, until ${clockLabel(end)}` : 'Start recorded',
    start,
    end,
    allDay: false,
    day: localDayOf(start),
    status: 'record',
    route: { pathname: '/trends', params: { openTrendsLens: 'nights' } },
  };
}

function calendarCaption(event: TimelineCalendarInput): string | null {
  return joinCaption([event.location, event.calendarTitle ? `From ${event.calendarTitle}` : 'From your phone calendar']);
}

function calendarItem(event: TimelineCalendarInput, now: number, today: string): DayTimelineItem | null {
  const startMs = isoMs(event.startDate);
  if (startMs === null) return null;
  const endMs = isoMs(event.endDate);
  const route: TimelineRoute = { pathname: '/schedule', params: { openScheduleLens: 'appointments' } };
  if (event.allDay) {
    // An all-day event's start is midnight UTC in some calendars, so its
    // day is read from the date written, not through the local clock.
    const day = event.startDate.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
    return {
      id: `calendar:${event.id}:${day}`,
      kind: 'calendar',
      title: event.title || 'Calendar event',
      caption: calendarCaption(event),
      start: dayStartMs(day),
      end: null,
      allDay: true,
      day,
      status: day < today ? 'record' : 'planned',
      route,
    };
  }
  const end = endMs !== null && endMs > startMs ? endMs : null;
  return {
    id: `calendar:${event.id}:${startMs}`,
    kind: 'calendar',
    title: event.title || 'Calendar event',
    caption: calendarCaption(event),
    start: startMs,
    end,
    allDay: false,
    day: localDayOf(startMs),
    // A calendar event is the calendar's to mark, and this app never asks
    // whether it happened: ahead is planned, gone is a record.
    status: (end ?? startMs) > now ? 'planned' : 'record',
    route,
  };
}

function workoutItem(workout: TimelineWorkoutInput): DayTimelineItem | null {
  const start = isoMs(workout.startedAt);
  if (start === null) return null;
  const endMs = workout.endedAt ? isoMs(workout.endedAt) : null;
  const end = endMs !== null && endMs > start ? endMs : null;
  const minutes = workout.minutes ?? (end !== null ? (end - start) / 60000 : null);
  return {
    id: `workout:${workout.id}`,
    kind: 'workout',
    title: workout.name || 'Workout',
    caption: joinCaption([minutes ? describeDuration(minutes) : null, 'from Health Connect']),
    start,
    end,
    allDay: false,
    day: localDayOf(start),
    status: 'record',
    route: { pathname: '/life', params: { openLifeLens: 'movement' } },
  };
}

function stepsItem(entry: TimelineStepsInput): DayTimelineItem | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date) || !(entry.steps > 0)) return null;
  return {
    id: `steps:${entry.date}`,
    kind: 'steps',
    title: `${formatCount(entry.steps)} steps`,
    caption: 'From Health Connect',
    start: dayStartMs(entry.date),
    end: null,
    allDay: true,
    day: entry.date,
    status: 'record',
    route: { pathname: '/life', params: { openLifeLens: 'movement' } },
  };
}

/** 8432 as "8,432", written out rather than left to a locale. */
export function formatCount(value: number): string {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function datedItem(source: TimelineDatedInput, today: string): DayTimelineItem | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(source.dueOn)) return null;
  const isCounter = source.lens === 'daysUntil';
  const past = source.dueOn < today;
  // A counter whose day has gone keeps counting on its own lens as days
  // over; here it is a day that happened, not a task left undone.
  const status: TimelineStatus = past ? (isCounter ? 'record' : 'overdue') : 'planned';
  const route: TimelineRoute =
    source.tab === 'garden'
      ? { pathname: '/garden', params: { openGardenLens: source.lens } }
      : { pathname: '/life', params: { openLifeLens: source.lens } };
  return {
    id: `dated:${source.kind}:${source.sourceId}`,
    kind: isCounter ? 'countdown' : 'due',
    title: source.title,
    caption: source.detail,
    start: dayStartMs(source.dueOn),
    end: null,
    allDay: true,
    day: source.dueOn,
    status,
    route,
  };
}

export function buildDayTimeline(input: DayTimelineInput): DayTimelineView {
  const back = input.daysBack ?? TIMELINE_DAYS_BACK;
  const ahead = input.daysAhead ?? TIMELINE_DAYS_AHEAD;
  const today = localDayOf(input.now);
  const firstDay = shiftDay(today, -back);
  const rangeStart = dayStartMs(firstDay);
  const rangeEnd = dayStartMs(today, ahead + 1);
  const days: string[] = [];
  for (let offset = -back; offset <= ahead; offset++) days.push(shiftDay(today, offset));
  const inRange = (item: DayTimelineItem) =>
    item.start < rangeEnd && (item.end ?? item.start) >= rangeStart;

  const timed: DayTimelineItem[] = [];
  for (const row of input.schedule) {
    const item = scheduleItem(row, input.now, today, input.scheduleMinutes?.[row.id] ?? null);
    if (item) timed.push(item);
  }
  for (const event of input.calendar ?? []) {
    const item = calendarItem(event, input.now, today);
    if (item && !item.allDay) timed.push(item);
  }
  for (const workout of input.workouts ?? []) {
    const item = workoutItem(workout);
    if (item) timed.push(item);
  }
  timed.push(...routineItems(input.routines, input.runs, days, input.now, today));
  for (const checkin of input.checkins) {
    const item = checkinItem(checkin);
    if (item) timed.push(item);
  }
  for (const record of input.sleep) {
    const item = sleepItem(record);
    if (item) timed.push(item);
  }

  const dated: DayTimelineItem[] = [];
  for (const source of input.dated) {
    const item = datedItem(source, today);
    if (item) dated.push(item);
  }
  for (const event of input.calendar ?? []) {
    const item = calendarItem(event, input.now, today);
    if (item && item.allDay) dated.push(item);
  }
  for (const entry of input.steps ?? []) {
    const item = stepsItem(entry);
    if (item) dated.push(item);
  }

  const byTime = (a: DayTimelineItem, b: DayTimelineItem) => a.start - b.start || a.title.localeCompare(b.title);
  const items = [...timed.filter(inRange), ...dated.filter(inRange)].sort(byTime);
  const overdue = [...items.filter((item) => item.status === 'overdue'), ...dated.filter((item) => item.status === 'overdue' && !inRange(item))]
    .sort(byTime);
  const overdueIds = new Set(overdue.map((item) => item.id));
  // A record, such as the day's steps, is not something to do at any time.
  const anyTime = items.filter(
    (item) => item.allDay && item.day === today && item.status !== 'record' && !overdueIds.has(item.id),
  );

  return { today, rangeStart, rangeEnd, items, overdue, anyTime };
}

/** "3 things past their time, not marked yet", or null for none. Counted,
 *  never judged. */
export function describeOverdue(count: number): string | null {
  if (count <= 0) return null;
  return count === 1 ? '1 thing past its time, not marked yet' : `${count} things past their time, not marked yet`;
}

/** The caption a row in the list above the strip reads: when, then what. */
export function overdueWhen(item: DayTimelineItem, today: string): string {
  const day = dayLabel(item.day, today);
  return item.allDay ? `Due ${day === 'Today' || day === 'Yesterday' ? day.toLowerCase() : day}` : `${day}, ${clockLabel(item.start)}`;
}

// ------------------------------------------------------------------ B3, B4, B7

function inWords(minutes: number): string {
  const whole = Math.max(1, Math.round(minutes));
  if (whole < 60) return whole === 1 ? '1 minute' : `${whole} minutes`;
  const hours = Math.floor(whole / 60);
  const rest = whole % 60;
  const h = hours === 1 ? '1 hour' : `${hours} hours`;
  if (rest === 0) return h;
  return `${h} ${rest === 1 ? '1 minute' : `${rest} minutes`}`;
}

/**
 * The line over the strip (B3): what is on now, when something with a
 * length covers this minute, and what comes next. Today and tomorrow only,
 * since "next" three days out is not what anyone means by next. Records are
 * left out: a check-in is written down, never waited for.
 */
export function describeNext(view: DayTimelineView, now: number): string | null {
  const timed = view.items.filter((item) => !item.allDay && item.status !== 'record' && item.status !== 'skipped');
  const tomorrow = shiftDay(view.today, 1);
  const current = timed.find(
    (item) => item.status !== 'done' && item.start <= now && item.end !== null && item.end > now,
  );
  const next = timed.find(
    (item) => item.start > now && item.status === 'planned' && (item.day === view.today || item.day === tomorrow),
  );
  const parts: string[] = [];
  if (current && current.end !== null) parts.push(`Now: ${current.title}, until ${clockLabel(current.end)}.`);
  if (next) {
    const minutes = (next.start - now) / 60000;
    if (next.day === view.today && minutes <= 180) {
      parts.push(`Next: ${next.title} in ${inWords(minutes)}, at ${clockLabel(next.start)}.`);
    } else if (next.day === view.today) {
      parts.push(`Next: ${next.title} at ${clockLabel(next.start)}.`);
    } else {
      parts.push(`Next: ${next.title} tomorrow at ${clockLabel(next.start)}.`);
    }
  }
  return parts.length > 0 ? parts.join(' ') : null;
}

const HOW_FULL_ORDER: { kind: TimelineKind; one: string; many: string }[] = [
  { kind: 'meal', one: 'meal', many: 'meals' },
  { kind: 'dose', one: 'dose', many: 'doses' },
  { kind: 'routine', one: 'routine', many: 'routines' },
  { kind: 'appointment', one: 'appointment', many: 'appointments' },
  { kind: 'calendar', one: 'calendar event', many: 'calendar events' },
  { kind: 'garden', one: 'garden task', many: 'garden tasks' },
  { kind: 'reminder', one: 'thought put on today', many: 'thoughts put on today' },
  { kind: 'due', one: 'thing due', many: 'things due' },
  { kind: 'countdown', one: 'counter landing', many: 'counters landing' },
];

function listWords(parts: string[]): string {
  if (parts.length <= 1) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

/**
 * How full today is (B7), in one sentence that counts and never judges: no
 * "busy", no "light", no "too much". Records are not counted, since a
 * check-in or a night's sleep is not something the day holds for somebody
 * to do. Things already marked still count, because they were part of the
 * day; how many are still ahead is said after.
 */
export function describeHowFull(view: DayTimelineView, now: number): string {
  const todays = view.items.filter((item) => item.day === view.today && item.status !== 'record');
  const parts: string[] = [];
  for (const entry of HOW_FULL_ORDER) {
    const count = todays.filter((item) => item.kind === entry.kind).length;
    if (count > 0) parts.push(`${count} ${count === 1 ? entry.one : entry.many}`);
  }
  if (parts.length === 0) return 'Nothing is on today yet.';
  const ahead = todays.filter((item) => item.status === 'planned' && (item.allDay || item.start > now)).length;
  const aheadWords =
    ahead === 0 ? 'none of it still ahead' : ahead === 1 ? '1 of them still ahead' : `${ahead} of them still ahead`;
  return `Today holds ${listWords(parts)}, ${aheadWords}.`;
}

/**
 * Whether the rest of today's timed things fit (B4), as arithmetic rather
 * than a verdict: how many are still ahead, how much of the time they take
 * is known, when the last one ends, and which of them overlap. Only things
 * with a length set can overlap, so a meal with no minutes is a moment,
 * not a block.
 */
export function describeDayFit(view: DayTimelineView, now: number): string | null {
  const ahead = view.items
    .filter((item) => item.day === view.today && !item.allDay && item.status === 'planned' && item.start > now)
    .sort((a, b) => a.start - b.start);
  if (ahead.length === 0) return null;
  const withLength = ahead.filter((item) => item.end !== null);
  const known = withLength.reduce((sum, item) => sum + ((item.end ?? item.start) - item.start) / 60000, 0);
  const lastEnd = Math.max(...ahead.map((item) => item.end ?? item.start));
  const overlaps: string[] = [];
  for (let i = 0; i < ahead.length; i++) {
    const first = ahead[i];
    if (first.end === null) continue;
    for (let j = i + 1; j < ahead.length; j++) {
      const second = ahead[j];
      if (second.start >= first.end) break;
      overlaps.push(`${first.title} and ${second.title}`);
    }
  }
  const count = ahead.length === 1 ? '1 timed thing' : `${ahead.length} timed things`;
  const lengthPart =
    withLength.length === 0
      ? 'none with minutes set'
      : `${withLength.length === ahead.length ? 'all' : withLength.length} with minutes set, about ${describeDuration(known)} between them`;
  const lines = [`Still ahead today: ${count}, ${lengthPart}. The last ends around ${clockLabel(lastEnd)}.`];
  if (overlaps.length > 0) {
    const more = overlaps.length > 3 ? `, and ${overlaps.length - 3} more` : '';
    lines.push(`Overlapping: ${listWords(overlaps.slice(0, 3))}${more}.`);
  }
  return lines.join(' ');
}

/** A routine's length from its steps (B4), or null when no step has
 *  minutes. Steps without minutes add nothing rather than a guess. */
export function routineTotalMinutes(steps: { minutes: number | null }[]): number | null {
  const counted = steps.filter((step) => step.minutes !== null && step.minutes > 0);
  if (counted.length === 0) return null;
  return counted.reduce((sum, step) => sum + (step.minutes ?? 0), 0);
}

/** "About 25 minutes", with how many steps have no minutes when some do
 *  not, so a total missing half its steps does not pass for the whole. */
export function describeRoutineLength(steps: { minutes: number | null }[]): string | null {
  const total = routineTotalMinutes(steps);
  if (total === null) return null;
  const missing = steps.filter((step) => !(step.minutes !== null && step.minutes > 0)).length;
  const base = `About ${inWords(total)}`;
  if (missing === 0) return base;
  return `${base}, not counting ${missing === 1 ? '1 step' : `${missing} steps`} with no minutes set`;
}

// ------------------------------------------------------------------ B9

export type FilledInToday = {
  /** Last night's sleep: the longest one ending today. */
  sleepMinutes: number | null;
  steps: number | null;
  workouts: { name: string; minutes: number | null }[];
};

/** "Filled in from Health Connect: slept 7 h 10 min, 8,432 steps and
 *  walking, 35 min." Null when Health Connect has filled in nothing today. */
export function describeFilledIn(filled: FilledInToday): string | null {
  const parts: string[] = [];
  if (filled.sleepMinutes !== null && filled.sleepMinutes > 0) parts.push(`slept ${describeDuration(filled.sleepMinutes)}`);
  if (filled.steps !== null && filled.steps > 0) parts.push(`${formatCount(filled.steps)} steps`);
  for (const workout of filled.workouts.slice(0, 3)) {
    const name = workout.name.toLowerCase();
    parts.push(workout.minutes ? `${name}, ${describeDuration(workout.minutes)}` : name);
  }
  if (filled.workouts.length > 3) parts.push(`${filled.workouts.length - 3} more workouts`);
  if (parts.length === 0) return null;
  return `Filled in from Health Connect: ${listWords(parts)}.`;
}

// ------------------------------------------------------------------ layout

export const TIMELINE_PX_PER_HOUR = 72;
export const TIMELINE_CARD_WIDTH = 136;
export const TIMELINE_CARD_GAP = 6;

export type TimelineCard = {
  item: DayTimelineItem;
  x: number;
  width: number;
  /** 0 is the all-day row when there is one; timed lanes follow. */
  lane: number;
};

export type TimelineTick = { x: number; label: string | null };
export type TimelineDayMark = { x: number; label: string; day: string };

export type TimelineLayout = {
  width: number;
  cards: TimelineCard[];
  /** How many rows of cards, the all-day row included. */
  lanes: number;
  hasAllDayRow: boolean;
  ticks: TimelineTick[];
  dayMarks: TimelineDayMark[];
  nowX: number;
};

export function xForTime(ms: number, rangeStart: number, pxPerHour = TIMELINE_PX_PER_HOUR): number {
  return ((ms - rangeStart) / 3_600_000) * pxPerHour;
}

/** Lays the strip out: every timed item at its minute, a span as wide as
 *  its length, cards that would overlap moved down to the first row with
 *  room, and a day's all-day items side by side along the top row from
 *  that day's midnight. */
export function layoutTimeline(view: DayTimelineView, now: number, pxPerHour = TIMELINE_PX_PER_HOUR): TimelineLayout {
  const width = xForTime(view.rangeEnd, view.rangeStart, pxPerHour);
  const cards: TimelineCard[] = [];

  const allDay = view.items.filter((item) => item.allDay);
  const hasAllDayRow = allDay.length > 0;
  const perDay = new Map<string, number>();
  for (const item of allDay) {
    const index = perDay.get(item.day) ?? 0;
    perDay.set(item.day, index + 1);
    const x = Math.min(
      xForTime(item.start, view.rangeStart, pxPerHour) + 8 + index * (TIMELINE_CARD_WIDTH + TIMELINE_CARD_GAP),
      width - TIMELINE_CARD_WIDTH,
    );
    cards.push({ item, x, width: TIMELINE_CARD_WIDTH, lane: 0 });
  }

  const laneEnds: number[] = [];
  const firstTimedLane = hasAllDayRow ? 1 : 0;
  for (const item of view.items.filter((candidate) => !candidate.allDay)) {
    const x = Math.max(0, xForTime(item.start, view.rangeStart, pxPerHour));
    const spanWidth = item.end !== null ? xForTime(item.end, view.rangeStart, pxPerHour) - x : 0;
    const cardWidth = Math.min(Math.max(TIMELINE_CARD_WIDTH, spanWidth), width - x);
    let lane = laneEnds.findIndex((end) => end + TIMELINE_CARD_GAP <= x);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(0);
    }
    laneEnds[lane] = x + cardWidth;
    cards.push({ item, x, width: cardWidth, lane: firstTimedLane + lane });
  }

  const ticks: TimelineTick[] = [];
  const dayMarks: TimelineDayMark[] = [];
  const dayCount = Math.round((view.rangeEnd - view.rangeStart) / 86_400_000);
  const firstDay = localDayOf(view.rangeStart);
  for (let dayIndex = 0; dayIndex < dayCount + 1; dayIndex++) {
    const day = shiftDay(firstDay, dayIndex);
    const midnight = dayStartMs(day);
    if (midnight >= view.rangeEnd) break;
    dayMarks.push({ x: xForTime(midnight, view.rangeStart, pxPerHour), label: dayLabel(day, view.today), day });
    for (let hour = 1; hour < 24; hour++) {
      const [y, m, d] = day.split('-').map(Number);
      const ms = new Date(y, m - 1, d, hour).getTime();
      if (localDayOf(ms) !== day) continue;
      ticks.push({
        x: xForTime(ms, view.rangeStart, pxPerHour),
        label: hour % 3 === 0 ? clockLabel(ms) : null,
      });
    }
  }

  return {
    width,
    cards,
    lanes: firstTimedLane + laneEnds.length,
    hasAllDayRow,
    ticks,
    dayMarks,
    nowX: xForTime(now, view.rangeStart, pxPerHour),
  };
}

/** Where the strip opens: Now in the middle of the window, held inside the
 *  strip at either end. */
export function initialScrollX(nowX: number, viewportWidth: number, contentWidth: number): number {
  const max = Math.max(0, contentWidth - viewportWidth);
  return Math.min(max, Math.max(0, nowX - viewportWidth / 2));
}
