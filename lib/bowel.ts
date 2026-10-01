// The bowel log (D10 in the competitive build plan, 2026-09-30): each bowel
// movement written down by its Bristol type, 1 to 7, with urgency, any
// blood, any pain and a note. Signals > Bowel Movements writes it,
// Trends > Symptoms & Flares reads it, and Pattern Finder can count what
// came before the days with a type 1 or 2 or a type 6 or 7.
//
// HOW IT BEHAVES
//
//   - Each type is described in plain words and pictured. No type is
//     labelled good, bad, healthy or ideal: the scale says what a stool
//     looked like, and the person and their clinician decide what it means.
//   - Blood is recorded as said and never read into. The only thing the
//     app says about it is that it is worth raising with a clinician.
//   - A day with nothing logged is a gap, never a zero, because not
//     writing one down is not the same as not going.
//   - Entries are stamped in local time ('YYYY-MM-DDTHH:mm'), so an
//     evening entry west of Greenwich stays on its day.
//
// No I/O and no React, so scripts/test_bowel.js checks it directly.

export type BristolType = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const BRISTOL_TYPES: { type: BristolType; words: string }[] = [
  { type: 1, words: 'Separate hard lumps, like nuts' },
  { type: 2, words: 'Sausage-shaped but lumpy' },
  { type: 3, words: 'Like a sausage with cracks on the surface' },
  { type: 4, words: 'Like a sausage or snake, smooth and soft' },
  { type: 5, words: 'Soft blobs with clear-cut edges' },
  { type: 6, words: 'Fluffy pieces with ragged edges, mushy' },
  { type: 7, words: 'Watery, no solid pieces' },
];

export const URGENCY_WORDS = ['No rush', 'Some urgency', 'Had to rush'] as const;
export const BLOOD_WORDS = ['None seen', 'Seen', 'Not sure'] as const;
export const PAIN_WORDS = ['None', 'Mild', 'Moderate', 'Severe'] as const;

/** Shown beside the blood question and under any entry that has it. */
export const BLOOD_NOTE =
  'Blood is kept as you record it, and this app reads nothing into it. Blood in a stool is worth raising with a clinician.';

export type BowelEntry = {
  id: string;
  /** Local time, 'YYYY-MM-DDTHH:mm'. */
  occurredAt: string;
  bristolType: BristolType;
  /** 0 to 2, index into URGENCY_WORDS, or null when not answered. */
  urgency: number | null;
  /** 0 to 2, index into BLOOD_WORDS, or null when not answered. */
  blood: number | null;
  /** 0 to 3, index into PAIN_WORDS, or null when not answered. */
  pain: number | null;
  note: string | null;
};

export function isBristolType(value: unknown): value is BristolType {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 7;
}

export function bristolWords(type: BristolType): string {
  return BRISTOL_TYPES[type - 1].words;
}

/** "Some urgency · blood seen · mild pain", leaving out what was not answered. */
export function entryDetail(entry: Pick<BowelEntry, 'urgency' | 'blood' | 'pain' | 'note'>): string {
  const parts: string[] = [];
  if (entry.urgency !== null && entry.urgency > 0) parts.push(URGENCY_WORDS[entry.urgency] ?? '');
  if (entry.blood === 1) parts.push('blood seen');
  if (entry.blood === 2) parts.push('not sure about blood');
  if (entry.pain !== null && entry.pain > 0) parts.push(`${(PAIN_WORDS[entry.pain] ?? '').toLowerCase()} pain`);
  if (entry.note && entry.note.trim()) parts.push(entry.note.trim());
  return parts.filter(Boolean).join(' · ');
}

// ---------------------------------------------------------------------------
// Trends
// ---------------------------------------------------------------------------

export type BowelPeriod = { key: string; label: string; value: number | null; display: string };

function addDays(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number);
  const date = new Date(y, m - 1, d + n);
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function daysBetween(start: string, end: string): number {
  const [ys, ms, ds] = start.split('-').map(Number);
  const [ye, me, de] = end.split('-').map(Number);
  return Math.round((new Date(ye, me - 1, de).getTime() - new Date(ys, ms - 1, ds).getTime()) / 86400000);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function shortDay(day: string): string {
  const [, m, d] = day.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}`;
}

function listTypes(types: number[]): string {
  const sorted = [...types].sort((a, b) => a - b);
  if (sorted.length === 1) return `type ${sorted[0]}`;
  return `types ${sorted.slice(0, -1).join(', ')} and ${sorted[sorted.length - 1]}`;
}

/** A range up to this many days is drawn a day at a time, longer by week. */
export const BOWEL_DAILY_ROWS_MAX = 31;

/**
 * One row per day (or per week past BOWEL_DAILY_ROWS_MAX days), newest
 * last. A day or week with nothing logged carries a null value and says so.
 */
export function bowelPeriods(entries: BowelEntry[], startDay: string, endDay: string): BowelPeriod[] {
  const span = daysBetween(startDay, endDay) + 1;
  if (span <= 0) return [];
  const step = span <= BOWEL_DAILY_ROWS_MAX ? 1 : 7;
  const rows: BowelPeriod[] = [];
  for (let offset = 0; offset < span; offset += step) {
    const from = addDays(startDay, offset);
    const to = step === 1 ? from : addDays(startDay, Math.min(offset + step - 1, span - 1));
    const inside = entries.filter((entry) => {
      const day = entry.occurredAt.slice(0, 10);
      return day >= from && day <= to;
    });
    const label = step === 1 ? shortDay(from) : `From ${shortDay(from)}`;
    if (inside.length === 0) {
      rows.push({ key: from, label, value: null, display: 'nothing logged' });
      continue;
    }
    const types = [...new Set(inside.map((entry) => entry.bristolType))];
    rows.push({ key: from, label, value: inside.length, display: `${inside.length}, ${listTypes(types)}` });
  }
  return rows;
}

/** "14 entries on 9 of 30 days. Nothing logged on the other 21." */
export function bowelRangeSentence(entries: BowelEntry[], startDay: string, endDay: string): string {
  const span = Math.max(0, daysBetween(startDay, endDay) + 1);
  const inRange = entries.filter((entry) => {
    const day = entry.occurredAt.slice(0, 10);
    return day >= startDay && day <= endDay;
  });
  if (inRange.length === 0) return 'Nothing logged in this range.';
  const days = new Set(inRange.map((entry) => entry.occurredAt.slice(0, 10))).size;
  const noun = inRange.length === 1 ? 'entry' : 'entries';
  const blank = span - days;
  const tail = blank === 0 ? '' : ` Nothing logged on the other ${blank}.`;
  return `${inRange.length} ${noun} on ${days} of ${span} days.${tail}`;
}

/** Each type that was logged, with how many times, in type order. */
export function bowelTypeTally(entries: BowelEntry[]): { type: BristolType; count: number }[] {
  const counts = new Map<BristolType, number>();
  for (const entry of entries) counts.set(entry.bristolType, (counts.get(entry.bristolType) ?? 0) + 1);
  return BRISTOL_TYPES.filter(({ type }) => counts.has(type)).map(({ type }) => ({ type, count: counts.get(type)! }));
}

/** The days blood was marked as seen, or null when it never was. */
export function bloodSeenLine(entries: BowelEntry[]): string | null {
  const days = [...new Set(entries.filter((entry) => entry.blood === 1).map((entry) => entry.occurredAt.slice(0, 10)))].sort();
  if (days.length === 0) return null;
  const list = days.map(shortDay).join(', ');
  return `Blood marked as seen on ${days.length === 1 ? 'one day' : `${days.length} days`}: ${list}.`;
}

// ---------------------------------------------------------------------------
// Pattern Finder
// ---------------------------------------------------------------------------

export type BowelOutcomeKind = 'typesOneTwo' | 'typesSixSeven';

const OUTCOME_TYPES: Record<BowelOutcomeKind, BristolType[]> = {
  typesOneTwo: [1, 2],
  typesSixSeven: [6, 7],
};

/**
 * The moments Pattern Finder counts back from: the first entry of the
 * matching types on each local day, one per day, oldest first.
 */
export function bowelOutcomeStamps(entries: BowelEntry[], kind: BowelOutcomeKind, rangeStart: string): string[] {
  const wanted = OUTCOME_TYPES[kind];
  const first = new Map<string, string>();
  for (const entry of entries) {
    if (!wanted.includes(entry.bristolType)) continue;
    const day = entry.occurredAt.slice(0, 10);
    if (day < rangeStart) continue;
    const seen = first.get(day);
    if (!seen || entry.occurredAt < seen) first.set(day, entry.occurredAt);
  }
  return [...first.values()].sort();
}
