// A barcode scanned with no signal (G21 of the competitive build plan,
// 2026-09-27). The lookup could not be made, so the barcode waits here and
// is looked up by itself once the lookup services answer again. Nothing is
// guessed about the product while it waits, and a barcode that was never
// looked up is never reported as a product nobody knows.
//
// This half is pure: which rows to try, what an attempt's outcome means, and
// every sentence. The database half is lib/pendingScansDb.ts.

export type PendingScanOutcome = 'waiting' | 'found' | 'not_found';

export type PendingScan = {
  barcode: string;
  scannedAt: string;
  tries: number;
  lastTriedAt: string | null;
  outcome: PendingScanOutcome;
  foundName: string | null;
  foundBrand: string | null;
};

// What one attempt came back with: the product's name, a clean miss from
// both sources, or no answer at all.
export type LookupAttempt =
  | { kind: 'found'; name: string; brand: string | null }
  | { kind: 'missing' }
  | { kind: 'no-answer' };

// How long to leave a waiting barcode between attempts. The first few come
// quickly, since signal often returns within minutes; after that, a try at
// most every half hour, so a phone out of range for days is not asking every
// half minute.
export function retryDelayMs(tries: number): number {
  if (tries <= 0) return 0;
  if (tries === 1) return 30_000;
  if (tries === 2) return 2 * 60_000;
  if (tries === 3) return 5 * 60_000;
  return 30 * 60_000;
}

export function dueForRetry(scan: PendingScan, now: Date): boolean {
  if (scan.outcome !== 'waiting') return false;
  if (!scan.lastTriedAt) return true;
  const last = Date.parse(scan.lastTriedAt);
  if (Number.isNaN(last)) return true;
  return now.getTime() - last >= retryDelayMs(scan.tries);
}

// A retry pass stops at the first attempt with no answer: the rest would
// only fail the same way and count a try against each of them.
export function stopsThePass(attempt: LookupAttempt): boolean {
  return attempt.kind === 'no-answer';
}

// A found product first, then a miss, then the ones still waiting, each
// newest first, so what a person can act on sits at the top.
export function orderPendingScans(scans: PendingScan[]): PendingScan[] {
  const rank: Record<PendingScanOutcome, number> = { found: 0, not_found: 1, waiting: 2 };
  return [...scans].sort((a, b) => rank[a.outcome] - rank[b.outcome] || b.scannedAt.localeCompare(a.scannedAt));
}

function scannedWhen(scan: PendingScan, now: Date): string {
  const at = new Date(scan.scannedAt);
  if (Number.isNaN(at.getTime())) return '';
  const time = at.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const sameDay = at.toDateString() === now.toDateString();
  if (sameDay) return `scanned at ${time}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (at.toDateString() === yesterday.toDateString()) return `scanned yesterday at ${time}`;
  return `scanned ${at.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
}

export function pendingScanTitle(scan: PendingScan): string {
  if (scan.outcome === 'found' && scan.foundName) {
    return scan.foundBrand ? `${scan.foundName}, ${scan.foundBrand}` : scan.foundName;
  }
  return `Barcode ${scan.barcode}`;
}

export function pendingScanCaption(scan: PendingScan, now: Date): string {
  const when = scannedWhen(scan, now);
  const prefix = when ? `${when[0].toUpperCase()}${when.slice(1)}. ` : '';
  if (scan.outcome === 'found') return `${prefix}Looked up once the signal came back. Open it to check the label.`;
  if (scan.outcome === 'not_found') {
    return `${prefix}Neither Open Food Facts nor USDA FoodData Central has this barcode yet.`;
  }
  return `${prefix}Waiting for a signal to look it up.`;
}

export function pendingScansHeading(scans: PendingScan[]): string {
  const found = scans.filter((scan) => scan.outcome === 'found').length;
  const waiting = scans.filter((scan) => scan.outcome === 'waiting').length;
  const parts: string[] = [];
  if (found > 0) parts.push(found === 1 ? '1 looked up' : `${found} looked up`);
  if (waiting > 0) parts.push(waiting === 1 ? '1 waiting for a signal' : `${waiting} waiting for a signal`);
  const missed = scans.length - found - waiting;
  if (missed > 0) parts.push(missed === 1 ? '1 not in either database' : `${missed} not in either database`);
  return `Scanned with no signal: ${parts.join(', ')}`;
}

export const QUEUED_TITLE = 'Saved to look up later';

export function queuedMessage(barcode: string): string {
  return (
    `The lookup could not be reached, so barcode ${barcode} is kept here and looked up by itself once ` +
    'there is a signal again. It will be waiting at the top of Scan a Product.'
  );
}
