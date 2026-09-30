// Report history (K7, 2026-09-29). Each time a report leaves the device,
// as text, a PDF or a spreadsheet file, one line is kept: which report,
// the dates it covered, when and how it went out, and who it was for if
// the person adds a name. Only those facts are kept, never what the report
// said, so the line answers "what did I give the doctor in March?" without
// being a second copy of the health record.
//
// Make it again opens the same report over the same length of time, ending
// today, which is what somebody going back to the same doctor wants: the
// next stretch, not the old one.
//
// Pure: lib/reportHistoryDb.ts reads and writes report_history (lib/db.ts),
// components/ReportHistoryBand.tsx shows it, and
// scripts/test_report_history.js checks this without a phone.

export type ReportSentHow = 'text' | 'pdf' | 'csv';

/** The range choices on the Reports tab, stored as text. */
export type ReportRangeKey = '7' | '30' | '90' | '6m' | '1y' | 'visit' | 'custom';

export type ReportHistoryEntry = {
  id: string;
  kind: string;
  rangeKey: ReportRangeKey;
  /** 'YYYY-MM-DD', both ends counted. */
  rangeStart: string;
  rangeEnd: string;
  days: number;
  how: ReportSentHow;
  forWhom: string | null;
  /** ISO timestamp the report went out. */
  madeAt: string;
};

export const REPORT_HISTORY_HEADING = 'Report history';

export const REPORT_HISTORY_CAPTION =
  'Each report that left this device, and how. Only these facts are kept, never what the report said. Make it again opens the same report over the same length of time, ending today.';

export const REPORT_HISTORY_EMPTY = 'No report has been shared or saved yet. Each one you send will be listed here.';

export const FOR_WHOM_MAX = 80;

/** Sending the same report the same way again within this many minutes
 *  (a spreadsheet saved table by table, a share sheet opened twice) is
 *  one report, not several. */
export const SAME_SENDING_MINUTES = 30;

const HOW_WORDS: Record<ReportSentHow, string> = {
  text: 'shared as text',
  pdf: 'shared as a PDF',
  csv: 'saved as a spreadsheet',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const RANGE_KEYS: readonly ReportRangeKey[] = ['7', '30', '90', '6m', '1y', 'visit', 'custom'];

export function isRangeKey(value: string): value is ReportRangeKey {
  return (RANGE_KEYS as readonly string[]).includes(value);
}

export function isSentHow(value: string): value is ReportSentHow {
  return value === 'text' || value === 'pdf' || value === 'csv';
}

/** "2026-08-31 to 2026-09-29", the report's rangeLabel, as its two dates. */
export function rangeFromLabel(label: string): { start: string; end: string } | null {
  const match = /^(\d{4}-\d{2}-\d{2}) to (\d{4}-\d{2}-\d{2})$/.exec(label.trim());
  return match ? { start: match[1], end: match[2] } : null;
}

/** "Sep 29, 2026" from a 'YYYY-MM-DD' or an ISO timestamp. */
export function shortDate(value: string): string {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return value;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/** The local day a timestamp fell on, since made_at is stored in UTC. */
export function localDayOf(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** A name as typed, tidied; blank means nobody named. */
export function cleanForWhom(text: string | null | undefined): string | null {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim().slice(0, FOR_WHOM_MAX).trim();
  return clean ? clean : null;
}

/** "For Your Doctor, Aug 31, 2026 to Sep 29, 2026" */
export function historyTitle(entry: Pick<ReportHistoryEntry, 'rangeStart' | 'rangeEnd'>, kindLabel: string | null): string {
  const name = kindLabel ?? 'A report no longer in the app';
  return `${name}, ${shortDate(entry.rangeStart)} to ${shortDate(entry.rangeEnd)}`;
}

/** "Shared as a PDF on Sep 29, 2026, for Dr. Ruiz" */
export function historyCaption(entry: Pick<ReportHistoryEntry, 'how' | 'madeAt' | 'forWhom'>): string {
  const how = HOW_WORDS[entry.how];
  const said = `${how.charAt(0).toUpperCase()}${how.slice(1)} on ${shortDate(localDayOf(entry.madeAt))}`;
  return entry.forWhom ? `${said}, for ${entry.forWhom}` : said;
}

/** Whether a new sending is the same one as a line already kept. */
export function isSameSending(
  earlier: Pick<ReportHistoryEntry, 'kind' | 'rangeStart' | 'rangeEnd' | 'how' | 'madeAt'>,
  next: Pick<ReportHistoryEntry, 'kind' | 'rangeStart' | 'rangeEnd' | 'how' | 'madeAt'>,
): boolean {
  if (earlier.kind !== next.kind || earlier.how !== next.how) return false;
  if (earlier.rangeStart !== next.rangeStart || earlier.rangeEnd !== next.rangeEnd) return false;
  const gap = Math.abs(new Date(next.madeAt).getTime() - new Date(earlier.madeAt).getTime());
  return Number.isFinite(gap) && gap <= SAME_SENDING_MINUTES * 60000;
}

function addDays(day: string, delta: number): string {
  const [y, m, d] = day.split('-').map(Number);
  const date = new Date(y, m - 1, d + delta);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** What Make it again sets on the Reports tab: the same choice, and for a
 *  custom range a start that gives the same number of days ending today. */
export function againRange(entry: Pick<ReportHistoryEntry, 'rangeKey' | 'days'>, today: string): { rangeKey: ReportRangeKey; customStart: string | null } {
  if (entry.rangeKey !== 'custom') return { rangeKey: entry.rangeKey, customStart: null };
  return { rangeKey: 'custom', customStart: addDays(today, -(Math.max(1, entry.days) - 1)) };
}

/** Names already used, the most recent first, each once, for one-tap reuse. */
export function earlierNames(entries: Pick<ReportHistoryEntry, 'forWhom' | 'madeAt'>[], limit = 6): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const entry of [...entries].sort((a, b) => b.madeAt.localeCompare(a.madeAt))) {
    if (!entry.forWhom) continue;
    const key = entry.forWhom.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(entry.forWhom);
    if (names.length >= limit) break;
  }
  return names;
}
