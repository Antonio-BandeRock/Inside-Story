// Applies the plan lib/moveToTomorrow.ts makes (B8). The meal copy is the
// row as it stands with a new id, a new time and planned, and with its
// place in any repeating series cleared: the copy is a one-off catch-up,
// and the series keeps its own occurrence tomorrow if it has one.

import { getDatabase, moveScheduleItem } from './db';
import { planMoveToTomorrow, type MoveCandidate, type MovePlan } from './moveToTomorrow';
import { syncReminderNotifications } from './reminderNotifications';

/** Columns a copy starts fresh on rather than carrying over. */
const FRESH = new Set([
  'id',
  'scheduled_for',
  'status',
  'created_at',
  'updated_at',
  'repeat_type',
  'repeat_end_type',
  'repeat_count',
  'repeat_until',
  'repeat_group_id',
  'repeat_index',
  'repeat_interval',
  'repeat_weekdays',
  'repeat_start',
  'settled_automatically',
  'linked_meal_id',
  'linked_device_calendar_event_id',
]);

export async function loadMovePlan(now: number = Date.now()): Promise<MovePlan> {
  const db = await getDatabase();
  const pad = (n: number) => String(n).padStart(2, '0');
  const at = new Date(now);
  const today = `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`;
  const rows = await db.getAllAsync<MoveCandidate>(
    `SELECT id, item_type AS itemType, COALESCE(title, '') AS title, status, scheduled_for AS scheduledFor
       FROM schedule_items
      WHERE substr(scheduled_for, 1, 10) = ? AND status = 'planned'`,
    today,
  );
  return planMoveToTomorrow(rows, now);
}

/** Writes the plan. Returns how many things now sit on tomorrow. */
export async function applyMovePlan(plan: MovePlan): Promise<number> {
  const db = await getDatabase();
  const columns = (await db.getAllAsync<{ name: string }>('PRAGMA table_info(schedule_items)'))
    .map((column) => column.name)
    .filter((name) => !FRESH.has(name));
  const stamp = new Date().toISOString();
  let placed = 0;
  for (const entry of plan.move) {
    await moveScheduleItem(entry.id, entry.scheduledFor);
    placed += 1;
  }
  for (const [index, entry] of plan.replan.entries()) {
    const newId = `schedule_item_${Date.now()}_moved_${index}`;
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO schedule_items (id, scheduled_for, status, created_at, updated_at${columns.map((name) => `, ${name}`).join('')})
         SELECT ?, ?, 'planned', ?, ?${columns.map((name) => `, ${name}`).join('')}
           FROM schedule_items WHERE id = ?`,
        newId,
        entry.scheduledFor,
        stamp,
        stamp,
        entry.id,
      );
      await db.runAsync(`UPDATE schedule_items SET status = 'skipped', updated_at = ? WHERE id = ?`, stamp, entry.id);
    });
    placed += 1;
  }
  void syncReminderNotifications();
  return placed;
}
