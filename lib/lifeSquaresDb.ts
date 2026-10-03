// The reads behind Your Life in Squares. Every decision lives in
// lib/lifeSquares.ts, covered by scripts/test_life_squares.js; this file
// fetches and places, and never writes.
//
// Each read covers one period, the one on screen: a Year or a Month asks
// only which kinds of record appear (one distinct stamp per minute at most,
// never the rows), and only a Week, Day or Hour reads the records. Stored
// stamps come in four shapes (see placeStamp), so each SQL window reaches a
// day past the period at both ends and the period is settled in JS once
// every stamp is on the person's own clock. A table missing on an older
// install is skipped rather than failing the page.

import { getDatabase } from './db';
import {
  isRecorded,
  periodDays,
  placeStamp,
  shiftDay,
  SQUARE_SOURCES,
  type Presence,
  type SquarePlace,
  type SquareRecord,
  type SquareSource,
} from './lifeSquares';

// Zoned and SQLite UTC stamps are kept to the minute so they can be moved
// onto local time; a local stamp only needs its day for presence.
function presenceExpression(column: string): string {
  return `CASE WHEN ${column} LIKE '%Z' OR ${column} LIKE '%+__:__' OR ${column} LIKE '%-__:__' OR ${column} LIKE '____-__-__ __:__:__'
    THEN ${column} ELSE substr(${column}, 1, 10) END`;
}

function periodWindow(place: SquarePlace): { from: string; through: string; lower: string; upper: string } {
  const { from, through } = periodDays(place);
  return { from, through, lower: shiftDay(from, -1), upper: shiftDay(through, 2) };
}

function whereFor(source: SquareSource): string {
  return source.where ? ` AND (${source.where})` : '';
}

function nowParts(): { today: string; nowMinute: number } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    today: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    nowMinute: now.getHours() * 60 + now.getMinutes(),
  };
}

/** Which kinds of record appear in each month of a Year page (keyed
 *  'YYYY-MM') or each day of a Month page (keyed by day). */
export async function loadPresence(place: SquarePlace): Promise<Presence> {
  const db = await getDatabase();
  const span = periodWindow(place);
  const { today, nowMinute } = nowParts();
  const byMonth = place.level === 'year';
  const presence: Presence = new Map();
  for (const source of SQUARE_SOURCES) {
    let rows: { stamp: string | null }[];
    try {
      rows = await db.getAllAsync<{ stamp: string | null }>(
        `SELECT DISTINCT ${presenceExpression(source.column)} AS stamp FROM ${source.table}
          WHERE ${source.column} >= ? AND ${source.column} < ?${whereFor(source)}`,
        span.lower,
        span.upper,
      );
    } catch {
      continue;
    }
    for (const row of rows) {
      const placed = placeStamp(row.stamp);
      if (!placed || placed.day < span.from || placed.day > span.through) continue;
      if (!isRecorded(placed, today, nowMinute)) continue;
      const key = byMonth ? placed.day.slice(0, 7) : placed.day;
      let kinds = presence.get(key);
      if (!kinds) {
        kinds = new Set();
        presence.set(key, kinds);
      }
      kinds.add(source.key);
    }
  }
  return presence;
}

/** Every record in a Week, Day or Hour page, placed on the local clock. */
export async function loadRecords(place: SquarePlace): Promise<SquareRecord[]> {
  const db = await getDatabase();
  const span = periodWindow(place);
  const { today, nowMinute } = nowParts();
  const records: SquareRecord[] = [];
  for (const source of SQUARE_SOURCES) {
    let rows: { rid: string; title: string | null; stamp: string | null }[];
    try {
      rows = await db.getAllAsync<{ rid: string; title: string | null; stamp: string | null }>(
        `SELECT CAST(rowid AS TEXT) AS rid, ${source.title} AS title, ${source.column} AS stamp FROM ${source.table}
          WHERE ${source.column} >= ? AND ${source.column} < ?${whereFor(source)}`,
        span.lower,
        span.upper,
      );
    } catch {
      continue;
    }
    for (const row of rows) {
      const placed = placeStamp(row.stamp);
      if (!placed || placed.day < span.from || placed.day > span.through) continue;
      if (!isRecorded(placed, today, nowMinute)) continue;
      if (place.level === 'hour' && (placed.minute === null || Math.floor(placed.minute / 60) !== place.hour)) continue;
      records.push({
        id: `${source.key}:${row.rid}`,
        source: source.key,
        title: (row.title ?? '').trim() || source.label,
        day: placed.day,
        minute: placed.minute,
      });
    }
  }
  return records;
}

// Where the person last was, for this run of the app only. Kept in memory
// rather than in the database so moving around a timeline never becomes a
// change for the shared-folder sync to carry.
let lastPlace: SquarePlace | null = null;

export function rememberedSquarePlace(): SquarePlace | null {
  return lastPlace;
}

export function rememberSquarePlace(place: SquarePlace): void {
  lastPlace = place;
}
