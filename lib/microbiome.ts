// Microbiome tests as a typed record (G30, 2026-10-02). A gut test the
// person bought (a sequencing kit, a stool analysis) kept the way the
// report printed it: each row's name, its value or words, its unit, the
// range and any flag the report printed beside it. Nothing here grades a
// result. There is no agreed healthy microbiome, companies measure
// differently, and the same sample sent to two of them can come back
// different, so the app records and sets side by side and never says high,
// low, good or bad in its own voice. A flag the report printed is kept as
// the report's word.
//
// Pure: no React, no database. Signals > Microbiome Tests writes through
// lib/microbiomeDb.ts; scripts/test_microbiome.js checks every function and
// sweeps every sentence.
import { findSheetDate, parseLabLine, readPrintedDate, type SheetDate } from './labImport';

export type MicrobiomeTest = {
  id: string;
  /** The day the sample was taken, YYYY-MM-DD. */
  sampledOn: string;
  provider: string;
  kind: string;
  note: string | null;
};

export type MicrobiomeResult = {
  id: string;
  testId: string;
  groupName: string;
  name: string;
  /** Exactly as printed: "2.4", "<0.01", "Not detected". */
  valueText: string;
  /** The number in valueText, when it has one. */
  value: number | null;
  unit: string;
  low: number | null;
  high: number | null;
  /** The report's word beside the row (Low, High, Out of range), as printed. */
  printedFlag: string | null;
  sortOrder: number;
};

// ---------------------------------------------------------------------------
// Open lists. Each offers the built-in choices merged alphabetically with
// whatever the person has typed on an earlier test, then "your own".

export const OWN_CHOICE = '__own__';

export const BUILT_IN_KINDS = ['Gut microbiome sequencing', 'Stool analysis'] as const;

export const BUILT_IN_GROUPS = [
  'Bacteria',
  'Diversity',
  'Gut lining and digestion markers',
  'Parasites',
  'Scores the company gives',
  'Yeast and fungi',
] as const;

/** Rows with no group read under this heading. */
export const NO_GROUP = 'Other results';

export const BUILT_IN_PROVIDERS = ['Biomesight', 'Diagnostic Solutions (GI-MAP)', 'Doctor’s Data', 'Genova Diagnostics', 'Thorne', 'Viome', 'ZOE'] as const;

function sameWords(a: string, b: string): boolean {
  return a.trim().replace(/\s+/g, ' ').toLowerCase() === b.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * The built-ins and every value used before, once each, alphabetical, with
 * the person's spelling kept for anything not built in.
 */
export function choicesFrom(builtIns: readonly string[], used: readonly string[]): string[] {
  const out: string[] = [...builtIns];
  for (const value of used) {
    const tidy = value.trim().replace(/\s+/g, ' ');
    if (tidy && !out.some((existing) => sameWords(existing, tidy))) out.push(tidy);
  }
  return out.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

// ---------------------------------------------------------------------------
// Reading a pasted or photographed report

export type MicrobiomeDraft = {
  key: string;
  source: 'read' | 'typed';
  /** The line as it was read, for checking against the report. */
  printed: string | null;
  groupName: string;
  name: string;
  valueText: string;
  unit: string;
  low: string;
  high: string;
  flag: string;
  confirmed: boolean;
};

let draftCounter = 0;
function nextKey(): string {
  draftCounter += 1;
  return `mb_${draftCounter}`;
}

export function blankDraft(groupName = ''): MicrobiomeDraft {
  return {
    key: nextKey(),
    source: 'typed',
    printed: null,
    groupName,
    name: '',
    valueText: '',
    unit: '',
    low: '',
    high: '',
    flag: '',
    confirmed: true,
  };
}

// Words a report prints in place of a number.
const WORD_VALUE = /^(.*?\p{L}.*?)[\s:]+((?:not\s+)?detected|present|absent|negative|positive|none\s+seen|seen)\.?\s*$/iu;
// A flag a report prints after the value, kept as its word.
const WORD_FLAG = /\b(out of range|within range|in range|below range|above range|low|high|normal|abnormal|elevated|reduced)\s*$/i;
const HEADING_MAX = 48;

function numberOf(text: string): number | null {
  const match = text.replace(',', '.').match(/^[<>≤≥]?\s*(-?\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

function rangeText(value: number | null): string {
  return value == null ? '' : String(value);
}

/**
 * Rows read off a report, one per result line. A short line with no value
 * and no number on the line after it is taken as a heading, and the rows
 * under it carry it as their group, which the person can change.
 */
export function draftsFromText(text: string): MicrobiomeDraft[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const drafts: MicrobiomeDraft[] = [];
  let group = '';
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    // A line carrying a date (collected, received, reported) is not a result.
    if (readPrintedDate(line) != null) continue;
    // A name on one line and its number on the next, as two columns read.
    const next = lines[i + 1];
    if (!/\d/.test(line) && next && /^[<>≤≥]?\s*\d/.test(next) && !WORD_VALUE.test(line)) {
      line = `${line}  ${next}`;
      i += 1;
    }
    const words = line.match(WORD_VALUE);
    if (words) {
      drafts.push({
        ...blankDraft(group),
        source: 'read',
        printed: line.replace(/\s+/g, ' '),
        confirmed: false,
        name: words[1].replace(/[:\s.,-]+$/u, '').trim(),
        valueText: words[2].replace(/\s+/g, ' ').replace(/^./, (c) => c.toUpperCase()),
      });
      continue;
    }
    const row = parseLabLine(line, []);
    if (row) {
      const flagWord = row.flag ?? line.match(WORD_FLAG)?.[1] ?? '';
      drafts.push({
        ...blankDraft(group),
        source: 'read',
        printed: row.printed,
        confirmed: false,
        name: row.name,
        valueText: row.valueText,
        unit: row.unit,
        low: rangeText(row.low),
        high: rangeText(row.high),
        flag: flagWord,
      });
      continue;
    }
    if (!/\d/.test(line) && line.length <= HEADING_MAX && /\p{L}{3}/u.test(line)) {
      group = line.replace(/[:\s]+$/, '');
    }
  }
  return drafts;
}

/** The sample date printed on the report, read the same way as a lab sheet. */
export function findSampleDate(text: string): SheetDate {
  return findSheetDate(text);
}

export function draftProblem(draft: MicrobiomeDraft): string | null {
  if (!draft.name.trim()) return 'Give this row the name the report uses.';
  if (!draft.valueText.trim()) return 'Type the result as printed, a number or words such as Not detected.';
  const low = draft.low.trim() ? numberOf(draft.low) : null;
  const high = draft.high.trim() ? numberOf(draft.high) : null;
  if (draft.low.trim() && low == null) return 'The low end of the range needs to be a number.';
  if (draft.high.trim() && high == null) return 'The high end of the range needs to be a number.';
  if (low != null && high != null && low > high) return 'The low end of the range is above the high end.';
  return null;
}

export type MicrobiomeRowSave = Omit<MicrobiomeResult, 'id' | 'testId'>;

/** Confirmed rows with nothing wrong, in the order shown. */
export function savesFromDrafts(drafts: readonly MicrobiomeDraft[]): MicrobiomeRowSave[] {
  return drafts
    .filter((draft) => draft.confirmed && draftProblem(draft) == null)
    .map((draft, index) => ({
      groupName: draft.groupName.trim().replace(/\s+/g, ' '),
      name: draft.name.trim().replace(/\s+/g, ' '),
      valueText: draft.valueText.trim().replace(/\s+/g, ' '),
      value: numberOf(draft.valueText.trim()),
      unit: draft.unit.trim(),
      low: draft.low.trim() ? numberOf(draft.low) : null,
      high: draft.high.trim() ? numberOf(draft.high) : null,
      printedFlag: draft.flag.trim() || null,
      sortOrder: index,
    }));
}

// ---------------------------------------------------------------------------
// One test's rows, grouped as the report grouped them

export type ResultGroup = { groupName: string; rows: MicrobiomeResult[] };

export function groupResults(rows: readonly MicrobiomeResult[]): ResultGroup[] {
  const groups: ResultGroup[] = [];
  for (const row of [...rows].sort((a, b) => a.sortOrder - b.sortOrder)) {
    const groupName = row.groupName.trim() || NO_GROUP;
    let group = groups.find((existing) => sameWords(existing.groupName, groupName));
    if (!group) {
      group = { groupName, rows: [] };
      groups.push(group);
    }
    group.rows.push(row);
  }
  return groups;
}

/** "2.4 %, report range 0.5 to 5, marked Low on the report". */
export function describeResult(row: MicrobiomeResult): string {
  const parts = [row.unit ? `${row.valueText} ${row.unit}` : row.valueText];
  if (row.low != null && row.high != null) parts.push(`report range ${row.low} to ${row.high}`);
  else if (row.low != null) parts.push(`report range from ${row.low}`);
  else if (row.high != null) parts.push(`report range up to ${row.high}`);
  if (row.printedFlag) parts.push(`marked ${row.printedFlag} on the report`);
  return parts.join(', ');
}

// ---------------------------------------------------------------------------
// The same name across tests

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function dayLabel(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day) return date;
  return `${day} ${MONTH_NAMES[month - 1]} ${year}`;
}

export type AcrossPoint = { sampledOn: string; provider: string; valueText: string };
export type AcrossUnit = { unit: string; points: AcrossPoint[] };
export type AcrossTests = {
  name: string;
  units: AcrossUnit[];
  providersDiffer: boolean;
  line: string;
  notes: string[];
};

export const DIFFERENT_COMPANIES_NOTE =
  'These came from different companies, which measure differently, so they are set side by side rather than compared.';
export const DIFFERENT_UNITS_NOTE =
  'Printed in different units on different tests, so each unit is listed apart and none is converted.';

/**
 * Every name that appears on two or more tests, with its values oldest
 * first. Names are matched by their words, ignoring case and spacing, and
 * never by what they might mean, so a genus and one of its species stay
 * apart.
 */
export function acrossTests(tests: readonly MicrobiomeTest[], rows: readonly MicrobiomeResult[]): AcrossTests[] {
  const testById = new Map(tests.map((test) => [test.id, test]));
  const byName = new Map<string, { name: string; rows: { row: MicrobiomeResult; test: MicrobiomeTest }[] }>();
  for (const row of rows) {
    const test = testById.get(row.testId);
    if (!test) continue;
    const key = row.name.trim().replace(/\s+/g, ' ').toLowerCase();
    if (!key) continue;
    const entry = byName.get(key) ?? { name: row.name.trim().replace(/\s+/g, ' '), rows: [] };
    entry.rows.push({ row, test });
    byName.set(key, entry);
  }
  const out: AcrossTests[] = [];
  for (const entry of byName.values()) {
    const testIds = new Set(entry.rows.map((item) => item.test.id));
    if (testIds.size < 2) continue;
    const sorted = [...entry.rows].sort((a, b) => a.test.sampledOn.localeCompare(b.test.sampledOn));
    const units: AcrossUnit[] = [];
    for (const { row, test } of sorted) {
      const unit = row.unit.trim();
      let bucket = units.find((existing) => sameWords(existing.unit, unit));
      if (!bucket) {
        bucket = { unit, points: [] };
        units.push(bucket);
      }
      bucket.points.push({ sampledOn: test.sampledOn, provider: test.provider, valueText: row.valueText });
    }
    const providers = new Set(sorted.map((item) => item.test.provider.trim().toLowerCase()));
    const providersDiffer = providers.size > 1;
    const unitLines = units.map((bucket) =>
      bucket.points
        .map((point) => `${bucket.unit ? `${point.valueText} ${bucket.unit}` : point.valueText} on ${dayLabel(point.sampledOn)}`)
        .join(', '),
    );
    const notes: string[] = [];
    if (providersDiffer) notes.push(DIFFERENT_COMPANIES_NOTE);
    if (units.length > 1) notes.push(DIFFERENT_UNITS_NOTE);
    out.push({ name: entry.name, units, providersDiffer, line: `${entry.name}: ${unitLines.join('; ')}.`, notes });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}

// ---------------------------------------------------------------------------
// What was eaten before each sample

export const EATING_WINDOW_DAYS = 28;

export type EatingBefore = {
  plants: number;
  gutFoods: number;
  fermentedEntries: number;
  daysLogged: number;
};

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

export function describeEatingBefore(eating: EatingBefore | null): string {
  if (!eating || eating.daysLogged === 0) {
    return `No meals are logged in the ${EATING_WINDOW_DAYS} days before this sample, so there is nothing from your food log to set beside it.`;
  }
  const counts = [
    plural(eating.plants, 'different plant', 'different plants'),
    plural(eating.gutFoods, 'gut-feeding food', 'gut-feeding foods'),
    plural(eating.fermentedEntries, 'fermented entry', 'fermented entries'),
  ];
  return `In the ${EATING_WINDOW_DAYS} days before this sample: ${counts[0]}, ${counts[1]} and ${counts[2]}, from meals logged on ${eating.daysLogged} of the ${EATING_WINDOW_DAYS} days.`;
}

export const EATING_BEFORE_NOTE =
  'This is your food log set beside the test. It is not offered as the reason for anything on the report, since one sample from one person cannot show that.';

// ---------------------------------------------------------------------------
// The words

export const MICROBIOME_TITLE = 'Microbiome Tests';

export const MICROBIOME_INTRO =
  'A gut test you had done, kept the way the report printed it: each result with its value or words, its unit, and the range and any flag the report put beside it.';

export const MICROBIOME_NOTE =
  'There is no agreed healthy microbiome yet. Companies sequence and score in different ways, and the same sample sent to two of them can come back different, so this app records what the report printed and never grades it. A flag such as Low or High is the report’s word, kept as printed. A clinician who orders a stool test can say what it means for you.';

export const MICROBIOME_TEXT_HINT =
  'One result to a line, as the report prints it. A heading line such as Bacteria becomes the group for the rows under it. Every row read waits for you to check it against the report.';

export function describeReadRows(drafts: readonly MicrobiomeDraft[]): string | null {
  const read = drafts.filter((draft) => draft.source === 'read').length;
  if (read === 0) return null;
  const lead = read === 1 ? 'One line read as a result.' : `${read} lines read as results.`;
  return `${lead} Check each against the report and confirm it, or change it first.`;
}

export function describeSaveButton(drafts: readonly MicrobiomeDraft[], editing: boolean): string {
  const count = savesFromDrafts(drafts).length;
  if (editing) return count === 0 ? 'Save the Details' : count === 1 ? 'Save and Add 1 Row' : `Save and Add ${count} Rows`;
  return count === 0 ? 'Save the Test' : count === 1 ? 'Save the Test with 1 Row' : `Save the Test with ${count} Rows`;
}

export function describeUnsaved(drafts: readonly MicrobiomeDraft[]): string | null {
  const left = drafts.length - savesFromDrafts(drafts).length;
  if (left <= 0) return null;
  return left === 1
    ? 'One row is not confirmed or needs something, and will be left out.'
    : `${left} rows are not confirmed or need something, and will be left out.`;
}

export function describeTestHeading(test: MicrobiomeTest): string {
  return `${test.provider || 'A test'}, ${dayLabel(test.sampledOn)}`;
}

export function describeTestMeta(test: MicrobiomeTest, rowCount: number): string {
  const rows = rowCount === 0 ? 'no results yet' : plural(rowCount, 'result', 'results');
  return `${test.kind || 'Kind not said'} · ${rows}`;
}

export function describeSampleDate(found: SheetDate): string | null {
  if (found.kind === 'found') return `The sample date reads ${dayLabel(found.date)} (printed ${found.printed}). Change it below if that is not the day the sample was taken.`;
  if (found.kind === 'ambiguous')
    return `The report prints ${found.printed}, which could be day then month or month then day. Pick the date below.`;
  return null;
}
