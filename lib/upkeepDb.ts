// Reading and writing upkeep: things that need doing again, and things that
// run out.
//
// Added 2026-09-05. Same split every other module here follows: schema in
// lib/db.ts, arithmetic and every refusal in lib/upkeep.ts with no database so
// they can be tested without one, and the reading and writing here.

import { getDatabase, getFamilyMembers, getUserProfile } from './db';
import {
  nextDueAfterDoing,
  placeChoices,
  upkeepStanding,
  type AssigneeContext,
  type CustomUpkeepPlace,
  type UpkeepCadence,
  type UpkeepCategory,
  type UpkeepItem,
} from './upkeep';

export async function upsertUpkeepItem(input: {
  id?: string;
  name: string;
  category: UpkeepCategory;
  cadence: UpkeepCadence;
  intervalMonths?: number | null;
  lastDoneOn?: string | null;
  expiresOn?: string | null;
  renewable?: boolean;
  cost?: number | null;
  notes?: string;
} & ChoreFields): Promise<string> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  // Each cadence carries only the fields that mean anything for it, enforced
  // here rather than trusted from the form, so nothing downstream has to guard
  // against a recurring item with an expiry date on it.
  const recurring = input.cadence === 'recurring';
  const intervalMonths = recurring ? input.intervalMonths ?? null : null;
  const choreFields: ChoreFields = {
    intervalDays: input.intervalDays === undefined ? undefined : recurring ? input.intervalDays : null,
    place: input.place,
    minutes: input.minutes,
    assignedTo: input.assignedTo,
    assignedName: input.assignedName,
    household: input.household,
  };
  const lastDoneOn = recurring ? input.lastDoneOn || null : null;
  const expiresOn = recurring ? null : input.expiresOn || null;
  // Renewable only means anything for something that expires. A service is
  // repeated by definition, so the question does not arise.
  const renewable = recurring ? 1 : input.renewable === false ? 0 : 1;

  if (input.id) {
    await db.runAsync(
      `
        UPDATE upkeep_items
        SET name = ?, category = ?, cadence = ?, interval_months = ?, last_done_on = ?,
            expires_on = ?, renewable = ?, cost = ?, notes = ?, updated_at = ?
        WHERE id = ?
      `,
      input.name.trim(), input.category, input.cadence, intervalMonths, lastDoneOn,
      expiresOn, renewable, input.cost ?? null, input.notes?.trim() || null, now, input.id,
    );
    await writeChoreFields(input.id, choreFields);
    return input.id;
  }

  const id = `upkeep_${Date.now()}`;
  await db.runAsync(
    `
      INSERT INTO upkeep_items
        (id, name, category, cadence, interval_months, last_done_on, expires_on,
         renewable, cost, active, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
    `,
    id, input.name.trim(), input.category, input.cadence, intervalMonths, lastDoneOn,
    expiresOn, renewable, input.cost ?? null, input.notes?.trim() || null, now, now,
  );
  await writeChoreFields(id, choreFields);
  return id;
}

/**
 * Record that a recurring thing was just done, which resets its clock.
 *
 * The next date is not stored: it is derived from last_done_on plus the
 * interval every time it is read, so there is one source for it and no chance
 * of a stored next date disagreeing with the two figures it came from.
 * nextDueAfterDoing exists for the screen to SHOW what the new date will be
 * before someone confirms, not to be written down.
 */
export async function markUpkeepDone(id: string, doneOn: string): Promise<{ nextDueOn: string | null }> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<UpkeepRow>(
    `
      SELECT id, name, category, cadence, interval_months AS intervalMonths,
             last_done_on AS lastDoneOn, expires_on AS expiresOn, renewable, cost, active, notes,
             interval_days AS intervalDays, place, place_name AS placeName, minutes,
             assigned_to AS assignedTo, assigned_name AS assignedName, household
      FROM upkeep_items WHERE id = ?
    `,
    id,
  );
  if (!row) return { nextDueOn: null };

  const item = toItem(row);

  // The date it was due on BEFORE this doing, written down as it stood.
  // Working it out later from interval_months would read the schedule as
  // it is now rather than as it was, and the interval is a thing people
  // change. Null where nothing had ever set one, which the lens reads as
  // could not be told rather than as on time.
  const dueOn = upkeepStanding(item, doneOn).dueOn;
  await db.runAsync(
    'INSERT INTO upkeep_doings (id, item_id, item_name, done_on, due_on) VALUES (?, ?, ?, ?, ?)',
    `updone_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    id,
    item.name,
    doneOn,
    dueOn,
  );

  await db.runAsync(
    'UPDATE upkeep_items SET last_done_on = ?, updated_at = ? WHERE id = ?',
    doneOn, new Date().toISOString(), id,
  );
  return { nextDueOn: nextDueAfterDoing({ ...item, lastDoneOn: doneOn }, doneOn) };
}

/** Renew something that expires, by pushing its date out. */
export async function renewUpkeepItem(id: string, newExpiresOn: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE upkeep_items SET expires_on = ?, updated_at = ? WHERE id = ?',
    newExpiresOn, new Date().toISOString(), id,
  );
}

export async function setUpkeepActive(id: string, active: boolean): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE upkeep_items SET active = ?, updated_at = ? WHERE id = ?',
    active ? 1 : 0, new Date().toISOString(), id,
  );
}

export async function deleteUpkeepItem(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM upkeep_items WHERE id = ?', id);
  // Its photos go with it (1.0.53.7), so none is left pointing at nothing.
  await (await import('./mediaDb')).removePhotosOf('upkeep', id);
}

type UpkeepRow = {
  id: string; name: string; category: string; cadence: string;
  intervalMonths: number | null; lastDoneOn: string | null; expiresOn: string | null;
  renewable: number; cost: number | null; active: number; notes: string | null;
  intervalDays: number | null; place: string | null; placeName: string | null; minutes: number | null;
  assignedTo: string | null; assignedName: string | null; household: number | null;
};

function toItem(row: UpkeepRow): UpkeepItem {
  return {
    id: row.id,
    name: row.name,
    category: (row.category as UpkeepCategory) ?? 'other',
    cadence: (row.cadence as UpkeepCadence) ?? 'recurring',
    intervalMonths: row.intervalMonths,
    lastDoneOn: row.lastDoneOn,
    expiresOn: row.expiresOn,
    // Number() rather than === 1, the same guard amountIsEstimate uses: a
    // column added by a generic TEXT migration would hand back the string.
    renewable: Number(row.renewable) === 1,
    cost: row.cost,
    active: Number(row.active) === 1,
    notes: row.notes,
    intervalDays: row.intervalDays != null ? Number(row.intervalDays) : null,
    place: row.place,
    placeName: row.placeName,
    minutes: row.minutes != null ? Number(row.minutes) : null,
    assignedTo: row.assignedTo,
    assignedName: row.assignedName,
    household: Number(row.household) === 1,
  };
}

export async function listUpkeepItems(): Promise<UpkeepItem[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<UpkeepRow>(
    `
      SELECT id, name, category, cadence, interval_months AS intervalMonths,
             last_done_on AS lastDoneOn, expires_on AS expiresOn, renewable, cost, active, notes,
             interval_days AS intervalDays, place, place_name AS placeName, minutes,
             assigned_to AS assignedTo, assigned_name AS assignedName, household
      FROM upkeep_items
      ORDER BY active DESC, category, name
    `,
  );
  return rows.map(toItem);
}

// --- J6, J7 and chores -------------------------------------------------------

export type ChoreFields = {
  intervalDays?: number | null;
  place?: string | null;
  minutes?: number | null;
  assignedTo?: string | null;
  assignedName?: string | null;
  household?: boolean;
};

/**
 * The J6 and J7 columns, written only where the caller gave them, so a
 * caller that knows nothing about places (a starter list, a capture note)
 * never blanks one on an update.
 */
async function writeChoreFields(id: string, fields: ChoreFields): Promise<void> {
  const sets: string[] = [];
  const values: (string | number | null)[] = [];
  if (fields.intervalDays !== undefined) {
    sets.push('interval_days = ?');
    values.push(fields.intervalDays != null && fields.intervalDays > 0 ? Math.round(fields.intervalDays) : null);
  }
  if (fields.place !== undefined) {
    sets.push('place = ?', 'place_name = ?');
    values.push(fields.place, fields.place ? await placeNameFor(fields.place) : null);
  }
  if (fields.minutes !== undefined) {
    sets.push('minutes = ?');
    values.push(fields.minutes != null && fields.minutes > 0 ? Math.round(fields.minutes) : null);
  }
  if (fields.assignedTo !== undefined) {
    sets.push('assigned_to = ?', 'assigned_name = ?');
    values.push(fields.assignedTo, fields.assignedTo ? fields.assignedName ?? null : null);
  }
  if (fields.household !== undefined) {
    sets.push('household = ?');
    values.push(fields.household ? 1 : 0);
  }
  if (sets.length === 0) return;
  const db = await getDatabase();
  await db.runAsync(`UPDATE upkeep_items SET ${sets.join(', ')} WHERE id = ?`, ...values, id);
}

async function placeNameFor(code: string): Promise<string | null> {
  const places = placeChoices(await listUpkeepPlaces());
  return places.find((entry) => entry.code === code)?.label ?? null;
}

/**
 * Who does it. Null is anyone. Assigning to a connected person shares the
 * chore with the household too, since otherwise it would never reach them.
 */
export async function assignUpkeepItem(
  id: string,
  assignedTo: string | null,
  assignedName: string | null,
): Promise<void> {
  await writeChoreFields(id, {
    assignedTo,
    assignedName,
    household: assignedTo?.startsWith('key:') ? true : undefined,
  });
  const db = await getDatabase();
  await db.runAsync('UPDATE upkeep_items SET updated_at = ? WHERE id = ?', new Date().toISOString(), id);
}

// --- Places (J6) -------------------------------------------------------------

export async function listUpkeepPlaces(): Promise<CustomUpkeepPlace[]> {
  const db = await getDatabase();
  return db.getAllAsync<CustomUpkeepPlace>('SELECT id, name FROM upkeep_places ORDER BY name COLLATE NOCASE');
}

/** Adds a place the person named, or hands back the one already called that. */
export async function createUpkeepPlace(name: string): Promise<string> {
  const db = await getDatabase();
  const trimmed = name.trim();
  const existing = placeChoices(await listUpkeepPlaces()).find(
    (entry) => entry.label.trim().toLowerCase() === trimmed.toLowerCase(),
  );
  if (existing) return existing.code;
  const id = `place_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();
  await db.runAsync(
    'INSERT INTO upkeep_places (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)',
    id, trimmed, now, now,
  );
  return id;
}

export async function renameUpkeepPlace(id: string, name: string): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const trimmed = name.trim();
  await db.runAsync('UPDATE upkeep_places SET name = ?, updated_at = ? WHERE id = ?', trimmed, now, id);
  // The name carried on each item follows, so a household chore reads by
  // the new name on the other phone too.
  await db.runAsync('UPDATE upkeep_items SET place_name = ?, updated_at = ? WHERE place = ?', trimmed, now, id);
}

export async function countUpkeepInPlace(code: string): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM upkeep_items WHERE place = ?', code);
  return Number(row?.n ?? 0);
}

/**
 * Removes a place the person named, moving what is in it to the place they
 * picked first. With things still in it and nowhere given to move them,
 * nothing happens: a place is never taken out from under an item.
 */
export async function removeUpkeepPlace(id: string, moveTo: string | null): Promise<boolean> {
  const inUse = await countUpkeepInPlace(id);
  if (inUse > 0 && (!moveTo || moveTo === id)) return false;
  const label = moveTo ? await placeNameFor(moveTo) : null;
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    if (inUse > 0 && moveTo) {
      await db.runAsync(
        'UPDATE upkeep_items SET place = ?, place_name = ?, updated_at = ? WHERE place = ?',
        moveTo, label, now, id,
      );
    }
    await db.runAsync('DELETE FROM upkeep_places WHERE id = ?', id);
  });
  return true;
}

// --- Who this person is, for chores ------------------------------------------

export const UPKEEP_PERSON_META_KEY = 'upkeep_person_id';

/**
 * An id for this person that their own devices share, so a chore somebody
 * took on the phone reads as theirs on the computer too. It travels in
 * app_meta with their other settings, which is why it is not in
 * DEVICE_LOCAL_META_KEYS. Made the first time it is asked for.
 */
export async function getUpkeepPersonId(): Promise<string> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_meta WHERE key = ?', UPKEEP_PERSON_META_KEY,
  );
  if (row?.value) return row.value;
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  await db.runAsync(
    'INSERT INTO app_meta (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO NOTHING',
    UPKEEP_PERSON_META_KEY, id, new Date().toISOString(),
  );
  const again = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_meta WHERE key = ?', UPKEEP_PERSON_META_KEY,
  );
  return again?.value ?? id;
}

/** Everything resolveAssignee needs, read once per load of the screen. */
export async function loadAssigneeContext(): Promise<AssigneeContext & { myName: string | null }> {
  const [{ getDeviceIdentity }, { listConnections }] = await Promise.all([
    import('./deviceIdentity'),
    import('./connections'),
  ]);
  const [personId, identity, connections, family, profile] = await Promise.all([
    getUpkeepPersonId(),
    getDeviceIdentity().catch(() => null),
    listConnections().catch(() => []),
    getFamilyMembers().catch(() => []),
    getUserProfile().catch(() => null),
  ]);
  return {
    myPersonId: personId,
    myKey: identity?.publicKeyBase64 ?? null,
    connections: connections.map((entry) => ({ key: entry.publicKeyBase64, name: entry.name })),
    family: family.map((entry) => ({ id: String(entry.id), name: entry.name })),
    myName: profile?.firstName?.trim() || null,
  };
}
