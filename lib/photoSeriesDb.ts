// Reading and writing Photo Series (photo_series in lib/db.ts). Every rule
// and sentence is in lib/photoSeries.ts with no database; the photos are
// ordinary rows in media under the series owner (lib/mediaDb.ts), and a
// GIF made from a series is kept under SERIES_GIF_OWNER_KIND with the
// series id, so a GIF is never read back as one of its own frames.

import { getDatabase } from './db';
import { localDay, type MediaItem } from './media';
import { listMediaFor } from './mediaDb';
import { DEFAULT_SERIES_REMINDER_TIME, isReminderTime, seriesFrames, type PhotoSeries } from './photoSeries';

export const SERIES_GIF_OWNER_KIND = 'photo_series_gif';

const COLUMNS =
  'id, owner_kind AS ownerKind, owner_id AS ownerId, title, reminder_on AS reminderOn, reminder_time AS reminderTime, started_on AS startedOn, ended_on AS endedOn, created_at AS createdAt';

type Row = Omit<PhotoSeries, 'reminderOn'> & { reminderOn: number };

function fromRow(row: Row): PhotoSeries {
  return { ...row, reminderOn: row.reminderOn === 1 };
}

/** Every series of one thing, newest first. At most one runs at a time. */
export async function listSeriesFor(ownerKind: string, ownerId: string): Promise<PhotoSeries[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Row>(
    `SELECT ${COLUMNS} FROM photo_series WHERE owner_kind = ? AND owner_id = ? ORDER BY started_on DESC, created_at DESC`,
    ownerKind,
    ownerId,
  );
  return rows.map(fromRow);
}

/** Every series still running, for the daily reminder. */
export async function listRunningSeries(): Promise<PhotoSeries[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Row>(`SELECT ${COLUMNS} FROM photo_series WHERE ended_on IS NULL ORDER BY started_on ASC`);
  return rows.map(fromRow);
}

export async function startSeries(owner: { kind: string; id: string }, title: string): Promise<PhotoSeries> {
  const db = await getDatabase();
  const id = `series_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const startedOn = localDay(new Date());
  const name = title.trim() || 'Photo series';
  await db.runAsync(
    `INSERT INTO photo_series (id, owner_kind, owner_id, title, reminder_on, reminder_time, started_on, created_at, updated_at)
     VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?)`,
    id,
    owner.kind,
    owner.id,
    name,
    DEFAULT_SERIES_REMINDER_TIME,
    startedOn,
    now,
    now,
  );
  return {
    id,
    ownerKind: owner.kind,
    ownerId: owner.id,
    title: name,
    reminderOn: true,
    reminderTime: DEFAULT_SERIES_REMINDER_TIME,
    startedOn,
    endedOn: null,
    createdAt: now,
  };
}

export async function setSeriesReminder(id: string, reminderOn: boolean, reminderTime?: string): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  if (reminderTime !== undefined && isReminderTime(reminderTime)) {
    await db.runAsync('UPDATE photo_series SET reminder_on = ?, reminder_time = ?, updated_at = ? WHERE id = ?', reminderOn ? 1 : 0, reminderTime, now, id);
    return;
  }
  await db.runAsync('UPDATE photo_series SET reminder_on = ?, updated_at = ? WHERE id = ?', reminderOn ? 1 : 0, now, id);
}

/** Ends a series today. The row stays, so the finished series still plays. */
export async function endSeries(id: string): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync('UPDATE photo_series SET ended_on = ?, updated_at = ? WHERE id = ?', localDay(new Date()), now, id);
}

/** Sets an ended series running again. */
export async function resumeSeries(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE photo_series SET ended_on = NULL, updated_at = ? WHERE id = ?', new Date().toISOString(), id);
}

/** The frames of a series, oldest first. */
export async function seriesFramesFor(series: PhotoSeries, today = localDay(new Date())): Promise<MediaItem[]> {
  const photos = await listMediaFor(series.ownerKind, series.ownerId);
  return seriesFrames(series, photos, today);
}

/** For the reminder: each running series with the reminder on, and how
 *  many frames it has and whether today's is in. */
export async function listSeriesReminderInputs(today: string): Promise<{ series: PhotoSeries; frameCount: number; photoToday: boolean }[]> {
  const out: { series: PhotoSeries; frameCount: number; photoToday: boolean }[] = [];
  for (const series of await listRunningSeries()) {
    if (!series.reminderOn) continue;
    const frames = await seriesFramesFor(series, today);
    out.push({ series, frameCount: frames.length, photoToday: frames.some((frame) => frame.takenOn === today) });
  }
  return out;
}
