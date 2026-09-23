// Reading and writing the free-form Days Until counters, the ones tied to
// nothing. The arithmetic and every sentence are in lib/countdown.ts with
// no database; this is the reading and writing. See countdowns in
// lib/db.ts, and lib/gardenCountdownDb.ts for the garden's.
//
// Added 2026-09-22: "Days Until should be something that is also available
// in a free form allowing the user to create their own Days Until for
// something that we don't have covered in the app in various places where
// it might be necessary or available."
//
// The two readers at the bottom are the reason this file knows about the
// garden at all. A person who has started counters in both places should
// not have to remember which tab a counter was born on, so Life's Days
// Until lens reads both and mergeCountdowns puts them in one order.
// Nothing here writes a garden counter: that stays in the garden's module.

import { getDatabase } from './db';
import { listCurrentGardenCountdowns, listRunningGardenCountdowns } from './gardenCountdownDb';
import type { AnyCountdown, Countdown } from './countdown';
import { mergeCountdowns } from './countdown';

const COLUMNS = 'id, name, about, started_on AS startedOn, days, done_at AS doneAt';

/** Every free-form counter, running and done. The order is settled in
 *  lib/countdown.ts (sortCountdowns), since it depends on today's date. */
export async function listCountdowns(): Promise<Countdown[]> {
  const db = await getDatabase();
  return db.getAllAsync<Countdown>(`SELECT ${COLUMNS} FROM countdowns ORDER BY created_at ASC`);
}

/** The free-form counters still running, for Home. */
export async function listRunningCountdowns(): Promise<Countdown[]> {
  const db = await getDatabase();
  return db.getAllAsync<Countdown>(`SELECT ${COLUMNS} FROM countdowns WHERE done_at IS NULL ORDER BY started_on ASC`);
}

export async function addCountdown(input: Pick<Countdown, 'name' | 'about' | 'startedOn' | 'days'>): Promise<string> {
  const db = await getDatabase();
  const id = `freecount_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const about = input.about && input.about.trim() ? input.about.trim() : null;
  await db.runAsync(
    `INSERT INTO countdowns (id, name, about, started_on, days, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.name.trim(),
    about,
    input.startedOn,
    input.days,
    now,
    now,
  );
  return id;
}

/** Marks a counter done today, or, with done false, sets it running
 *  again. */
export async function setCountdownDone(id: string, done: boolean): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync('UPDATE countdowns SET done_at = ?, updated_at = ? WHERE id = ?', done ? now : null, now, id);
}

/** Removes a counter. Nothing refers to one, so the row goes. */
export async function deleteCountdown(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM countdowns WHERE id = ?', id);
}

/** Both kinds, running and done, for Life's Days Until lens. Garden
 *  counters under areas in Past Areas are left out here, the same as they
 *  are on the Garden lens: a past area's counters read under that area. */
export async function listEveryCountdown(today: string): Promise<AnyCountdown[]> {
  const [free, garden] = await Promise.all([listCountdowns(), listCurrentGardenCountdowns()]);
  return mergeCountdowns(free, garden, today);
}

/** Both kinds, running only. */
export async function listEveryRunningCountdown(today: string): Promise<AnyCountdown[]> {
  const [free, garden] = await Promise.all([listRunningCountdowns(), listRunningGardenCountdowns()]);
  return mergeCountdowns(free, garden, today);
}
