// Counts behind each tab's My menu (lib/myItems.ts holds which kinds and
// where they open). Reads only. A table missing on an older install counts
// as nothing rather than failing the menu.

import { getDatabase } from './db';
import { MY_ITEM_KINDS, type MyItemsTab } from './myItems';

export async function countMyItems(tab: MyItemsTab): Promise<Record<string, number>> {
  const db = await getDatabase();
  const counts: Record<string, number> = {};
  for (const kind of MY_ITEM_KINDS[tab]) {
    try {
      const row = await db.getFirstAsync<{ n: number }>(
        `SELECT COUNT(*) AS n FROM ${kind.table}${kind.where ? ` WHERE ${kind.where}` : ''}`,
      );
      counts[kind.id] = row?.n ?? 0;
    } catch {
      counts[kind.id] = 0;
    }
  }
  return counts;
}
