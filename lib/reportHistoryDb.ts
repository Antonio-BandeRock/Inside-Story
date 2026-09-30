// Report history (K7): reading and writing report_history (lib/db.ts).
// Every rule about what a line says, when two sendings are one and what
// Make it again sets is in lib/reportHistory.ts.
import { getDatabase } from './db';
import {
  cleanForWhom,
  isRangeKey,
  isSameSending,
  isSentHow,
  rangeFromLabel,
  type ReportHistoryEntry,
  type ReportRangeKey,
  type ReportSentHow,
} from './reportHistory';

type Row = {
  id: string;
  kind: string;
  range_key: string;
  range_start: string;
  range_end: string;
  days: number;
  how: string;
  for_whom: string | null;
  made_at: string;
};

function toEntry(row: Row): ReportHistoryEntry | null {
  if (!isRangeKey(row.range_key) || !isSentHow(row.how)) return null;
  return {
    id: row.id,
    kind: row.kind,
    rangeKey: row.range_key,
    rangeStart: row.range_start,
    rangeEnd: row.range_end,
    days: row.days,
    how: row.how,
    forWhom: row.for_whom,
    madeAt: row.made_at,
  };
}

/** Newest first. */
export async function listReportHistory(limit = 200): Promise<ReportHistoryEntry[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Row>(
    'SELECT id, kind, range_key, range_start, range_end, days, how, for_whom, made_at FROM report_history ORDER BY made_at DESC LIMIT ?',
    limit,
  );
  return rows.map(toEntry).filter((entry): entry is ReportHistoryEntry => entry !== null);
}

/** Keeps one line for a report that just left the device, and returns its
 *  id, or the id of the line it repeats when it is the same sending. */
export async function recordReportSent(input: {
  kind: string;
  rangeKey: ReportRangeKey;
  rangeLabel: string;
  days: number;
  how: ReportSentHow;
}): Promise<string | null> {
  const range = rangeFromLabel(input.rangeLabel);
  if (!range) return null;
  const db = await getDatabase();
  const madeAt = new Date().toISOString();
  const candidate = { kind: input.kind, rangeStart: range.start, rangeEnd: range.end, how: input.how, madeAt };
  const latest = await db.getFirstAsync<Row>(
    'SELECT id, kind, range_key, range_start, range_end, days, how, for_whom, made_at FROM report_history WHERE kind = ? AND how = ? ORDER BY made_at DESC LIMIT 1',
    input.kind,
    input.how,
  );
  const earlier = latest ? toEntry(latest) : null;
  if (earlier && isSameSending(earlier, candidate)) return earlier.id;
  const id = `report_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await db.runAsync(
    `INSERT INTO report_history (id, kind, range_key, range_start, range_end, days, how, for_whom, made_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)`,
    id,
    input.kind,
    input.rangeKey,
    range.start,
    range.end,
    input.days,
    input.how,
    madeAt,
    madeAt,
    madeAt,
  );
  return id;
}

export async function setReportForWhom(id: string, name: string | null): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE report_history SET for_whom = ?, updated_at = ? WHERE id = ?', cleanForWhom(name), new Date().toISOString(), id);
}

/** Nothing refers to a history line, so removing one deletes it. */
export async function removeReportHistory(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM report_history WHERE id = ?', id);
}
