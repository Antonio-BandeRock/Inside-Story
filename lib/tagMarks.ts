// Tags as marks under a chart, F18 (2026-10-01). A check-in tag the person
// picked in Signals (bloating, slept well, overwhelmed, or one they named)
// is drawn as a mark under the date axis of Trends > Compare Two on each
// day it was logged. A mark says when, never why. Pure, with no database,
// so scripts/test_tag_marks.js can check it.

export type TagRow = { loggedAt: string; tagCode: string };

export type TagMarkRow = { code: string; label: string; dates: string[] };

// At most this many rows under one chart, so the chart stays a chart.
export const MAX_TAG_MARK_ROWS = 3;

// At most this many tags offered to pick from, the most used first.
export const MAX_TAGS_OFFERED = 12;

export const TAG_MARKS_LINE =
  'A mark is a day you logged that tag. It shows when, and two things on the same day can still be chance.';

// The local calendar day of a stored moment. logged_at is written with
// toISOString(), which is UTC, so slicing ten characters would put an
// evening check-in west of Greenwich on the next day.
export function localDayOf(moment: string): string {
  const date = new Date(moment);
  if (Number.isNaN(date.getTime())) return moment.slice(0, 10);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Every tag logged in the range, each with the days it was logged on (once
// a day however many check-ins carried it), the tag on most days first,
// then by name.
export function tagDays(
  rows: readonly TagRow[],
  start: string,
  end: string,
  labelOf: (code: string) => string | undefined,
): TagMarkRow[] {
  const byCode = new Map<string, Set<string>>();
  for (const row of rows) {
    const day = localDayOf(row.loggedAt);
    if (day < start || day > end) continue;
    const days = byCode.get(row.tagCode) ?? new Set<string>();
    days.add(day);
    byCode.set(row.tagCode, days);
  }
  return [...byCode.entries()]
    .map(([code, days]) => ({ code, label: labelOf(code) ?? code, dates: [...days].sort() }))
    .sort((a, b) => b.dates.length - a.dates.length || a.label.localeCompare(b.label));
}

// Picking a tag adds it, picking it again takes it away, and a fourth pick
// replaces the oldest so the rows never pass the limit.
export function togglePicked(picked: readonly string[], code: string): string[] {
  if (picked.includes(code)) return picked.filter((c) => c !== code);
  const next = [...picked, code];
  return next.length > MAX_TAG_MARK_ROWS ? next.slice(next.length - MAX_TAG_MARK_ROWS) : next;
}

// The rows to draw, in the order picked. A picked tag with no day in the
// range draws no row.
export function markRows(all: readonly TagMarkRow[], picked: readonly string[]): TagMarkRow[] {
  return picked.map((code) => all.find((row) => row.code === code)).filter((row): row is TagMarkRow => !!row);
}

export function dayCountWords(n: number): string {
  return n === 1 ? '1 day' : `${n} days`;
}

// What a tapped day adds under the chart.
export function taggedOn(rows: readonly TagMarkRow[], date: string): string | null {
  const labels = rows.filter((row) => row.dates.includes(date)).map((row) => row.label);
  return labels.length > 0 ? `Tagged that day: ${labels.join(', ')}.` : null;
}
