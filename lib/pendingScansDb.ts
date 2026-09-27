// The database half of a barcode scanned with no signal (G21, 2026-09-27).
// The pure half, which rows to try and every sentence, is
// lib/pendingScans.ts.
//
// Reading the list never writes. A retry pass writes only when an attempt
// was made, and stops at the first one with no answer.
import { getDatabase } from './db';
import { lookupProductByBarcode } from './barcodeLookup';
import { dueForRetry, stopsThePass, type LookupAttempt, type PendingScan, type PendingScanOutcome } from './pendingScans';

type Row = {
  barcode: string;
  scanned_at: string;
  tries: number;
  last_tried_at: string | null;
  outcome: string;
  found_name: string | null;
  found_brand: string | null;
};

function fromRow(row: Row): PendingScan {
  const outcome: PendingScanOutcome = row.outcome === 'found' || row.outcome === 'not_found' ? row.outcome : 'waiting';
  return {
    barcode: row.barcode,
    scannedAt: row.scanned_at,
    tries: row.tries,
    lastTriedAt: row.last_tried_at,
    outcome,
    foundName: row.found_name,
    foundBrand: row.found_brand,
  };
}

const listeners = new Set<() => void>();

// The scan lens listens so a barcode looked up in the background shows as
// found without leaving and coming back.
export function subscribePendingScans(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function announce() {
  for (const listener of listeners) listener();
}

export async function getPendingScans(): Promise<PendingScan[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Row>(
    `SELECT barcode, scanned_at, tries, last_tried_at, outcome, found_name, found_brand
       FROM pending_barcode_scans ORDER BY scanned_at DESC`,
  );
  return rows.map(fromRow);
}

export async function countWaitingScans(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ n: number }>(
    "SELECT COUNT(*) AS n FROM pending_barcode_scans WHERE outcome = 'waiting'",
  );
  return row?.n ?? 0;
}

// The scan that could not be looked up. Scanning the same barcode twice with
// no signal keeps the one row, reset to waiting, with the later time.
export async function queuePendingScan(barcode: string): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO pending_barcode_scans (barcode, scanned_at, tries, last_tried_at, outcome, updated_at)
     VALUES (?, ?, 1, ?, 'waiting', datetime('now'))
     ON CONFLICT(barcode) DO UPDATE SET scanned_at = excluded.scanned_at, tries = 1,
       last_tried_at = excluded.last_tried_at, outcome = 'waiting', found_name = NULL, found_brand = NULL,
       updated_at = datetime('now')`,
    barcode,
    now,
    now,
  );
  announce();
}

// Gone from the list: opened, cleared, or scanned again with a signal.
export async function clearPendingScan(barcode: string): Promise<void> {
  const db = await getDatabase();
  const result = await db.runAsync('DELETE FROM pending_barcode_scans WHERE barcode = ?', barcode);
  if (result.changes > 0) announce();
}

async function attemptLookup(barcode: string): Promise<LookupAttempt> {
  try {
    const product = await lookupProductByBarcode(barcode);
    if (!product) return { kind: 'missing' };
    return { kind: 'found', name: product.name, brand: product.brand };
  } catch {
    return { kind: 'no-answer' };
  }
}

let passRunning = false;

/**
 * Tries every waiting barcode that is due. Returns how many were settled
 * (found or missed). Only one pass runs at a time.
 */
export async function retryPendingScans(now: Date = new Date()): Promise<number> {
  if (passRunning) return 0;
  passRunning = true;
  try {
    const due = (await getPendingScans()).filter((scan) => dueForRetry(scan, now));
    if (due.length === 0) return 0;
    const db = await getDatabase();
    let settled = 0;
    for (const scan of due) {
      const attempt = await attemptLookup(scan.barcode);
      const triedAt = new Date().toISOString();
      if (attempt.kind === 'found') {
        await db.runAsync(
          `UPDATE pending_barcode_scans SET outcome = 'found', found_name = ?, found_brand = ?, tries = tries + 1,
             last_tried_at = ?, updated_at = datetime('now') WHERE barcode = ? AND outcome = 'waiting'`,
          attempt.name,
          attempt.brand,
          triedAt,
          scan.barcode,
        );
        settled += 1;
      } else if (attempt.kind === 'missing') {
        await db.runAsync(
          `UPDATE pending_barcode_scans SET outcome = 'not_found', tries = tries + 1, last_tried_at = ?,
             updated_at = datetime('now') WHERE barcode = ? AND outcome = 'waiting'`,
          triedAt,
          scan.barcode,
        );
        settled += 1;
      } else {
        await db.runAsync(
          `UPDATE pending_barcode_scans SET tries = tries + 1, last_tried_at = ?, updated_at = datetime('now')
             WHERE barcode = ? AND outcome = 'waiting'`,
          triedAt,
          scan.barcode,
        );
      }
      if (stopsThePass(attempt)) break;
    }
    if (settled > 0) announce();
    return settled;
  } finally {
    passRunning = false;
  }
}
