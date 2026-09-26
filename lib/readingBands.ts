// One shape for a lens that only reads, 1.0.52.7.
//
// Direct instruction, 2026-09-25, on the 22 output lenses marked Build on
// the inputs-to-outputs map: "Build all of them." Each of those lenses is
// a subject holding several bands behind the fold (the first rule the
// cross-app push settled), and each band is some captions, a column of
// bars, a list of named things, and a note saying what the reading cannot
// see. So the lens modules hand back this shape and one component draws
// it (components/ReadingBandsView.tsx), rather than each lens growing a
// render block of its own on a screen already three thousand lines long.
//
// Two rules are carried by the shape itself rather than by each lens:
// a row's value is `number | null`, where null draws as a labelled gap
// and never as a zero bar (the second rule of the push), and nothing in
// here can write, since every field is something to read.
import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

export type ReadingIcon = ComponentProps<typeof Ionicons>['name'];

// One bar. `display` is the words at the end of the row, which carry the
// unit, or the gap label when `value` is null.
export type ReadingRow = { key: string; label: string; value: number | null; display: string };

// One named thing in a list: a title and one muted line under it.
export type ReadingItem = { key: string; title: string; caption?: string };

export type ReadingBand = {
  id: string;
  title: string;
  icon: ReadingIcon;
  count?: number;
  lines: string[];
  rows?: ReadingRow[];
  items?: ReadingItem[];
  notes?: string[];
};

export type ReadingView = {
  hasAnything: boolean;
  // Said on its own surface when there is nothing to read yet, naming
  // where the record that fills it goes in.
  empty: string;
  bands: ReadingBand[];
};

// Words that must never appear in anything these lenses say about a
// person. The test scripts sweep every sentence against it; kept here so
// the list is one list.
export const READING_FORBIDDEN_WORDS = [
  'well done',
  'good job',
  'keep it up',
  'great job',
  'proud',
  'failed',
  'failure',
  'you should',
  'you must',
  'too low',
  'too high',
  'ideal',
  'optimal',
  'healthy range',
  'caused',
  'because of',
  'stop taking',
  'streak',
  'score',
];

export function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}

// A count of periods drawn as gaps, said under the headline so it is plain
// how much of the range the reading rests on.
export function gapNote(rows: { value: number | null }[], period: string, periods = `${period}s`): string | null {
  const blank = rows.filter((row) => row.value === null).length;
  if (blank === 0) return null;
  return `${plural(blank, period, periods)} of ${rows.length} had nothing recorded and are left as gaps rather than zeros.`;
}

export function emptyView(empty: string): ReadingView {
  return { hasAnything: false, empty, bands: [] };
}
