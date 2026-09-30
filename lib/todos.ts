// To-dos (C10, 2026-09-30): things to do, each with an optional day and an
// optional repeat, on Life > To-Do for the personal ones and inside Work for
// the work ones. Everything here is pure, so scripts/test_todos.js checks it
// without a phone; the reading and writing is lib/todosDb.ts.
//
// Three rules hold throughout, and the wording below is written to them:
//   1. A to-do past its day is still open, never late, missed or failed.
//      It is grouped under "From earlier, still open" and nothing counts
//      how long it has waited against anybody.
//   2. A repeating to-do marked done records that one occurrence and moves
//      on to the next day of the pattern. Occurrences that went by without
//      it are neither done nor failed; nothing is written for them.
//   3. "Let this one go" moves a repeating one on without recording it
//      done, and closes a one-off without calling it done either.
//
// Repeats use the same rule as every other repeat in the app
// (lib/repeatRule.ts, A1), so a to-do said as "every other Friday" reads the
// same as a reminder said that way.

import { readPlanSentence } from './planSentence';
import { addDays, describeRepeat, occurrencesOf, type RepeatConfig } from './repeatRule';

export type TodoArea = 'personal' | 'work';
export const TODO_AREAS: TodoArea[] = ['personal', 'work'];
export const TODO_AREA_LABELS: Record<TodoArea, string> = { personal: 'Personal', work: 'Work' };

export type Todo = {
  id: string;
  title: string;
  notes: string | null;
  area: TodoArea;
  /** 'YYYY-MM-DD', or null for a to-do with no day. For a repeating one,
   *  the occurrence it is waiting on now. */
  dueOn: string | null;
  /** The first day of the pattern, which a monthly repeat needs for its day
   *  of the month. Null when there is no repeat. */
  anchorOn: string | null;
  repeat: RepeatConfig | null;
  /** ISO time it was closed (done, or let go on its last occurrence), or
   *  null while open. */
  doneAt: string | null;
  /** How it was closed: 'done' or 'let_go'. Null while open. */
  closedAs: TodoDoingKind | null;
  createdAt: string;
};

export type TodoDoingKind = 'done' | 'let_go';

export type TodoGroupKey = 'earlier' | 'today' | 'soon' | 'later' | 'noDate' | 'closed';

export const TODO_GROUP_LABELS: Record<TodoGroupKey, string> = {
  earlier: 'From earlier, still open',
  today: 'Today',
  soon: 'This week',
  later: 'Further ahead',
  noDate: 'No day given',
  closed: 'Done',
};

export const TODO_GROUP_ORDER: TodoGroupKey[] = ['earlier', 'today', 'soon', 'later', 'noDate', 'closed'];

/** Days ahead counted as This week, today excluded. */
const SOON_DAYS = 7;

export function isRepeating(todo: Pick<Todo, 'repeat'>): boolean {
  return Boolean(todo.repeat && todo.repeat.type !== 'none');
}

export function todoGroupOf(todo: Todo, today: string): TodoGroupKey {
  if (todo.doneAt) return 'closed';
  if (!todo.dueOn) return 'noDate';
  if (todo.dueOn < today) return 'earlier';
  if (todo.dueOn === today) return 'today';
  if (todo.dueOn <= addDays(today, SOON_DAYS)) return 'soon';
  return 'later';
}

export type TodoGroup = { key: TodoGroupKey; label: string; todos: Todo[] };

/** Every to-do in its group, groups in a fixed order and empty ones left
 *  out. Dated groups run soonest first; No day given keeps the order they
 *  were added in; Done runs most recently closed first. */
export function groupTodos(todos: Todo[], today: string): TodoGroup[] {
  const buckets = new Map<TodoGroupKey, Todo[]>();
  for (const todo of todos) {
    const key = todoGroupOf(todo, today);
    buckets.set(key, [...(buckets.get(key) ?? []), todo]);
  }
  const groups: TodoGroup[] = [];
  for (const key of TODO_GROUP_ORDER) {
    const list = buckets.get(key);
    if (!list || list.length === 0) continue;
    const sorted = [...list].sort((a, b) => {
      if (key === 'closed') return (b.doneAt ?? '').localeCompare(a.doneAt ?? '');
      if (key === 'noDate') return a.createdAt.localeCompare(b.createdAt);
      return (a.dueOn ?? '').localeCompare(b.dueOn ?? '') || a.createdAt.localeCompare(b.createdAt);
    });
    groups.push({ key, label: TODO_GROUP_LABELS[key], todos: sorted });
  }
  return groups;
}

/**
 * The next day a repeating to-do waits on after one occurrence is answered,
 * or null when the pattern has ended (a count reached or an until date
 * passed). Occurrences before today that went by are skipped rather than
 * owed: the next one is the first after whichever is later, the day just
 * answered or today. Answering early (a weekly one done two days ahead)
 * moves it to the occurrence after the one it was waiting on.
 */
export function nextTodoDay(todo: Pick<Todo, 'dueOn' | 'anchorOn' | 'repeat'>, today: string): string | null {
  if (!todo.repeat || todo.repeat.type === 'none' || !todo.dueOn) return null;
  const anchor = todo.anchorOn ?? todo.dueOn;
  const after = todo.dueOn > today ? todo.dueOn : today;
  // Far enough ahead for any pattern the app can hold (a yearly one is
  // every 12 months), and the first result is all that is used.
  const next = occurrencesOf(anchor, todo.repeat, { through: addDays(after, 800), after });
  return next.length > 0 ? next[0].date : null;
}

/** What answering a to-do writes, worked out before anything is written. */
export type TodoAnswerPlan = {
  /** The row to add to todo_doings, or null for nothing recorded. */
  doing: { dueOn: string | null; kind: TodoDoingKind } | null;
  /** The to-do's day from now on; unchanged when it closes. */
  nextDueOn: string | null;
  /** True when the to-do closes rather than moving on. */
  closes: boolean;
};

export function planTodoAnswer(
  todo: Pick<Todo, 'dueOn' | 'anchorOn' | 'repeat'>,
  kind: TodoDoingKind,
  today: string,
): TodoAnswerPlan {
  const doing = { dueOn: todo.dueOn, kind };
  if (!isRepeating(todo)) return { doing, nextDueOn: todo.dueOn, closes: true };
  const next = nextTodoDay(todo, today);
  if (!next) return { doing, nextDueOn: todo.dueOn, closes: true };
  return { doing, nextDueOn: next, closes: false };
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function dayDifference(from: string, to: string): number {
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
}

/** "Thu 1 Oct", with the year only when it is not this one. */
export function formatTodoDay(date: string, today: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const weekday = WEEKDAY_SHORT[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  const yearPart = date.slice(0, 4) === today.slice(0, 4) ? '' : ` ${year}`;
  return `${weekday} ${day} ${MONTH_SHORT[month - 1]}${yearPart}`;
}

/** The one muted line under a to-do's title: its day, and its repeat. */
export function describeTodoCaption(todo: Todo, today: string): string {
  const parts: string[] = [];
  if (todo.doneAt) {
    parts.push(todo.closedAs === 'let_go' ? 'Let go' : 'Done');
  } else if (todo.dueOn) {
    const diff = dayDifference(today, todo.dueOn);
    if (diff === 0) parts.push('Today');
    else if (diff === 1) parts.push('Tomorrow');
    else if (diff === -1) parts.push('From yesterday');
    else if (diff < 0) parts.push(`From ${formatTodoDay(todo.dueOn, today)}`);
    else parts.push(formatTodoDay(todo.dueOn, today));
  }
  if (isRepeating(todo)) parts.push(describeRepeat(todo.repeat!, todo.anchorOn ?? todo.dueOn ?? undefined));
  return parts.join(' · ');
}

/** What the Done button says back, so nobody has to guess what moved. */
export function describeTodoAnswered(title: string, plan: TodoAnswerPlan, kind: TodoDoingKind, today: string): string {
  if (plan.closes) {
    if (kind === 'let_go') return `${title}: let go.`;
    return `${title}: done.`;
  }
  const next = plan.nextDueOn ? formatTodoDay(plan.nextDueOn, today) : '';
  return kind === 'let_go' ? `${title}: this one let go, next ${next}.` : `${title}: done, next ${next}.`;
}

/** The label of the second button on an open to-do. */
export function letGoLabel(todo: Pick<Todo, 'repeat'>): string {
  return isRepeating(todo) ? 'Let this one go' : 'Let it go';
}

/** A title worth keeping: some letters, trimmed, and not endless. */
export function cleanTodoTitle(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, 200);
}

// --- Reading what was typed (C9's reader) ------------------------------------

/** What a typed to-do was read as, shown before it is added. */
export type TodoReading = {
  title: string;
  dueOn: string | null;
  repeat: RepeatConfig | null;
  /** Plain sentences about what was read or left alone. */
  notes: string[];
};

function localDayOf(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * A to-do typed as a sentence ("pay the water bill on the 20th", "call mum
 * every Sunday") read for its title, day and repeat through the same reader
 * Capture uses (lib/planSentence.ts). Words with no day in them are the
 * title as typed, with no day. A to-do keeps a day and never a time, so a
 * time that was said is named as left out rather than dropped in silence.
 */
export function readTodoWords(text: string, now: Date): TodoReading {
  const typed = cleanTodoTitle(text);
  const reading = readPlanSentence(typed, now);
  if (!reading || !reading.start || !reading.action) {
    const notes = reading?.unsettled ?? [];
    return { title: typed, dueOn: null, repeat: null, notes };
  }
  const today = localDayOf(now);
  // A time already gone today still leaves today as the day.
  const dueOn = reading.start.date < today ? today : reading.start.date;
  const repeat = reading.repeat.type === 'none' ? null : reading.repeat;
  const notes = reading.pieces.map((piece) => `“${piece.words}” read as ${piece.reads}.`);
  if (!reading.timeAssumed) notes.push('A to-do keeps the day and not the time. For a set time, save it from Capture as a reminder.');
  // Unsettled lines about where a thing is kept (My Meds, the garden) are
  // about reminders and appointments, not to-dos; the rest still apply.
  for (const line of reading.unsettled) if (!/My Meds|appointment/i.test(line)) notes.push(line);
  return { title: cleanTodoTitle(reading.action), dueOn, repeat, notes };
}

/**
 * The When field on a to-do being changed: a few words ("tomorrow", "every
 * other Friday", "15 October") read for a day and a repeat. Empty means no
 * day. Null means words that could not be read, so nothing is changed.
 */
export function readTodoWhen(when: string, now: Date): { dueOn: string | null; repeat: RepeatConfig | null } | null {
  const words = when.trim();
  if (!words) return { dueOn: null, repeat: null };
  const reading = readPlanSentence(`do it ${words}`, now);
  if (!reading || !reading.start) return null;
  const today = localDayOf(now);
  return {
    dueOn: reading.start.date < today ? today : reading.start.date,
    repeat: reading.repeat.type === 'none' ? null : reading.repeat,
  };
}

/** The When of a reading in a few words, for the preview. */
export function describeTodoWhen(dueOn: string | null, repeat: RepeatConfig | null, today: string): string {
  if (!dueOn) return 'No day';
  const day = dueOn === today ? 'Today' : formatTodoDay(dueOn, today);
  return repeat ? `${day}, then ${describeRepeat(repeat, dueOn).toLowerCase()}` : day;
}
