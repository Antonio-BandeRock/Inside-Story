// Move what is left of today to tomorrow (B8, Phase 2).
//
// A day that got away from somebody should cost one tap to hand on, not
// one tap per thing. What moves and what stays is decided here, with no
// I/O, so scripts/test_day_timeline.js can check it; applying the plan is
// lib/moveToTomorrowDb.ts.
//
// The rules, each chosen so the record stays true:
//
//  - A meal still ahead today is not moved, because the meal that was
//    planned for today did not happen today. It is marked skipped, and a
//    new occurrence is put on tomorrow at the same time of day. Anyone
//    reading back over today sees what was planned and that it was not
//    eaten, which is what happened.
//  - A reminder or garden task moves: the same row, a day later, still
//    planned. That is what moving one by hand has always done
//    (moveScheduleItem), and a thing to remember is still the same thing
//    tomorrow.
//  - A dose and an appointment stay where they are. A dose's timing is the
//    prescriber's and the dose timeline's, and an appointment is somebody
//    else's time as well. Both are counted and named, so nothing is left
//    behind without the person being told.
//  - Only what is still planned and still ahead of now is in the plan.
//    Something already due and not done is overdue, and overdue is its own
//    list on the timeline, answered one at a time.

export type MoveCandidate = {
  id: string;
  itemType: string;
  title: string;
  status: string;
  /** Local 'YYYY-MM-DDTHH:mm'. */
  scheduledFor: string;
};

export type MovePlan = {
  /** Rows that move, with their new time. */
  move: { id: string; scheduledFor: string; title: string }[];
  /** Meals: the row is marked skipped and a copy goes on tomorrow. */
  replan: { id: string; scheduledFor: string; title: string }[];
  /** Left where they are, with the reason in one word each. */
  stay: { id: string; title: string; kind: 'dose' | 'appointment' }[];
};

const MOVES = new Set(['reminder', 'garden']);
const DOSES = new Set(['supplement', 'prescription', 'otc']);

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function localStamp(ms: number): string {
  const at = new Date(ms);
  return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}T${pad(at.getHours())}:${pad(at.getMinutes())}`;
}

/** The same clock time one calendar day later, counted by date so a
 *  clock change overnight does not move it an hour. */
export function sameTimeTomorrow(scheduledFor: string): string {
  const [date, time = '00:00'] = scheduledFor.split('T');
  const [y, m, d] = date.split('-').map(Number);
  const next = new Date(y, m - 1, d + 1);
  return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}T${time}`;
}

export function planMoveToTomorrow(rows: MoveCandidate[], now: number): MovePlan {
  const nowStamp = localStamp(now);
  const today = nowStamp.slice(0, 10);
  const plan: MovePlan = { move: [], replan: [], stay: [] };
  for (const row of rows) {
    if (row.status !== 'planned') continue;
    if (row.scheduledFor.slice(0, 10) !== today) continue;
    if (row.scheduledFor.slice(0, 16) <= nowStamp) continue;
    const next = { id: row.id, scheduledFor: sameTimeTomorrow(row.scheduledFor), title: row.title };
    if (row.itemType === 'meal') plan.replan.push(next);
    else if (MOVES.has(row.itemType)) plan.move.push(next);
    else if (DOSES.has(row.itemType)) plan.stay.push({ id: row.id, title: row.title, kind: 'dose' });
    else if (row.itemType === 'appointment') plan.stay.push({ id: row.id, title: row.title, kind: 'appointment' });
  }
  return plan;
}

function count(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** What the confirm sheet says before anything is written. Null when there
 *  is nothing left today that could move. */
export function describeMovePlan(plan: MovePlan): string | null {
  const moving = plan.move.length + plan.replan.length;
  if (moving === 0) return null;
  const lines: string[] = [];
  const parts: string[] = [];
  if (plan.replan.length > 0) parts.push(count(plan.replan.length, 'meal', 'meals'));
  if (plan.move.length > 0) parts.push(count(plan.move.length, 'reminder or garden task', 'reminders and garden tasks'));
  lines.push(`${parts.join(' and ')} go on tomorrow at the same time of day.`);
  if (plan.replan.length > 0) {
    lines.push(
      plan.replan.length === 1
        ? "Today's meal stays in the record as skipped, with a new one planned for tomorrow."
        : "Today's meals stay in the record as skipped, with new ones planned for tomorrow.",
    );
  }
  const doses = plan.stay.filter((entry) => entry.kind === 'dose').length;
  const appointments = plan.stay.filter((entry) => entry.kind === 'appointment').length;
  const staying: string[] = [];
  if (doses > 0) staying.push(count(doses, 'dose', 'doses'));
  if (appointments > 0) staying.push(count(appointments, 'appointment', 'appointments'));
  if (staying.length > 0) {
    lines.push(
      `${staying.join(' and ')} stay${doses + appointments === 1 ? 's' : ''} where ${doses + appointments === 1 ? 'it is' : 'they are'}: a dose keeps the time it was given, and an appointment is moved in Schedules > Appointments.`,
    );
  }
  return lines.join(' ');
}
