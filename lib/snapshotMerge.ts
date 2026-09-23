// Putting two devices back together without throwing either side away.
//
// 2026-09-22, direct instruction: "All changes that either side perform
// should be completed in the order that they were done between the two
// devices, no matter how many changes there were. Our system can't just
// apply the last change made and do nothing about any that might have
// happened previously from either device."
//
// What came before this: a snapshot was the whole database, so an arriving
// copy could only replace everything here. Somebody who added an upkeep
// item on the computer and then changed a setting on the phone was asked
// to pick one of the two, and whichever they did not pick was gone, having
// never left the device it was made on.
//
// WHAT THIS DOES INSTEAD. Three versions of every table are in hand at
// merge time: the copy both devices last agreed on (the base), what this
// device has done since, and what the other device has done since. Each
// row is then decided on its own:
//
//   - changed on one side only: that side's version is taken, whichever
//     side it was, because the other device never touched it;
//   - changed on neither: left alone;
//   - added on one side: kept, since an addition cannot be undone by a
//     device that has not seen it;
//   - removed on one side and untouched on the other: removed;
//   - removed on one side and edited on the other: the edit is kept.
//     Throwing away something somebody has worked on since is the worse
//     of the two mistakes, and the log says it happened.
//   - changed on both sides: one of them has to win. A row carrying its
//     own time of change (updated_at, and the other stamps below) is
//     settled by that time, which is the order the two changes were made
//     in. Without one, the device that saved later wins.
//
// So two changes to different things both survive, however many of them
// there are and whichever device made them, and the only case anything is
// set aside is two changes to the same record, where the later one stands.
//
// IDENTITY ACROSS TWO DEVICES. 109 of this app's 113 tables key a row by a
// TEXT id built from the moment it was made plus random characters, so two
// devices writing at the same time cannot land on the same id and a row
// can be followed from one device to the other. The exceptions are handled
// through TableShape rather than by naming them here: a one-row singleton
// keys by its only row, a natural key (a barcode, a member plus a
// condition) keys by those columns, and a table whose id this device hands
// out itself has arriving rows renumbered before the merge, while it is
// still known which side each child row belongs to (localId and children).
//
// This module does no I/O and imports nothing, so
// scripts/test_snapshot_merge.js can check every decision without a phone
// or a folder. The shapes are read off the live schema by
// lib/snapshotSyncDevice.ts (PRAGMA table_info and foreign_key_list), so
// nothing here is a list somebody has to remember to update.

export type Row = Record<string, unknown>;
export type Tables = Record<string, Row[]>;

/** Which device a change came from, as this device sees it. */
export type MergeSide = 'here' | 'there';

/** How a row is followed from one device to the other. */
export type TableShape = {
  /** The columns that identify a row. Empty means the whole row is its own identity. */
  key: string[];
  /**
   * Set when the key column is an id this device hands out itself, so an
   * arriving row cannot be trusted to keep the number it had over there.
   */
  localId?: string;
  /** Tables pointing at this one, so a renumbered row takes them with it. */
  children?: readonly { table: string; column: string }[];
};

export type Shapes = Record<string, TableShape>;

/** One thing that happened, in the terms the log and the notice are built from. */
export type MergeEntry = {
  table: string;
  /** The identity of the row, for the log to point back at. */
  key: string;
  kind: 'added' | 'changed' | 'removed';
  /** The device that made it. */
  side: MergeSide;
  /**
   * Set when the other device had moved the same row and this one won.
   * 'later' means it was the later of two edits, 'edited' means the other
   * side had removed the row and the edit was kept instead.
   */
  conflict?: 'later' | 'edited';
};

export type MergeResult = {
  tables: Tables;
  entries: MergeEntry[];
  /** Tables taken whole from one side, named so the caller can say so. */
  wholesale: string[];
  /**
   * Whether the merged copy still has anything the copy that arrived does
   * not already hold. False means the folder is holding this exact result
   * already, so saving it back would say nothing: the other device would
   * read the fresh record as an arrival, merge it, save in its turn, and
   * the two would go on talking for as long as both stayed open.
   */
  sendsBack: boolean;
  /**
   * What arrived, renumbered into this device's ids: the same rows the
   * merge worked from rather than the rows as they were sent.
   *
   * This is what the other side holds, as far as this side can know, so
   * it is what the caller keeps as the base for next time. Keeping the
   * merged result instead would claim the other side has seen rows it has
   * never been handed, and the next copy it sends would read every one of
   * them as a deletion.
   */
  incoming: Tables;
};

export type MergeOptions = {
  shapes: Shapes;
  /**
   * The side whose copy was saved later, used for a row that changed on
   * both sides and carries no time of its own.
   */
  laterSide: MergeSide;
  /**
   * Worked out by the app rather than by a person, so merging row by row
   * would mean nothing. Taken from the later side whole.
   */
  wholesale?: readonly string[];
};

/**
 * Columns naming when a row last changed, most trustworthy first. A row
 * carrying one of these settles a two-sided change by the order the two
 * changes were made rather than by which device happened to save last.
 */
const TIME_COLUMNS: readonly string[] = [
  'updated_at',
  'edited_at',
  'saved_at',
  'completed_at',
  'recorded_at',
  'logged_at',
  'added_at',
  'created_at',
];

const SEP = '\u0001';

/** A stable text for a row, so two versions of it can be compared. */
export function rowText(row: Row): string {
  const keys = Object.keys(row).sort();
  const parts: string[] = [];
  for (const key of keys) {
    const value = row[key];
    parts.push(key + '\u0000' + (value === null || value === undefined ? '' : String(value)));
  }
  return parts.join(SEP);
}

/** The identity of a row under its shape. Null when the shape does not fit it. */
export function keyOf(row: Row, shape: TableShape | undefined): string | null {
  if (!shape || shape.key.length === 0) return rowText(row);
  const parts: string[] = [];
  for (const column of shape.key) {
    const value = row[column];
    if (value === null || value === undefined) return null;
    parts.push(String(value));
  }
  return parts.join(SEP);
}

function indexRows(rows: Row[] | undefined, shape: TableShape | undefined): Map<string, Row> {
  const index = new Map<string, Row>();
  if (!Array.isArray(rows)) return index;
  for (const row of rows) {
    const key = keyOf(row, shape);
    if (key === null) continue;
    // A duplicate identity keeps the first, since the second could not
    // have been followed across anyway.
    if (!index.has(key)) index.set(key, row);
  }
  return index;
}

/**
 * Whether two sets of rows hold the same thing, by what each row says
 * rather than by the order the rows arrived in: the same rows read back
 * off two devices come out in whatever order each one's table held them.
 */
function sameRows(mine: Row[], theirs: Row[]): boolean {
  if (mine.length !== theirs.length) return false;
  const left = mine.map(rowText).sort();
  const right = theirs.map(rowText).sort();
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return false;
  }
  return true;
}

function timeOf(row: Row): string | null {
  for (const column of TIME_COLUMNS) {
    const value = row[column];
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return null;
}

/**
 * Which of two versions of the same row stands. The time each one carries
 * decides it when both have one and they differ; otherwise the device that
 * saved later does.
 */
export function laterOf(here: Row, there: Row, laterSide: MergeSide): MergeSide {
  const mine = timeOf(here);
  const theirs = timeOf(there);
  if (mine && theirs && mine !== theirs) return mine > theirs ? 'here' : 'there';
  return laterSide;
}

/**
 * Arriving rows of a table whose ids this device hands out, given ids that
 * do not land on somebody else's, with every child row that pointed at
 * them carried along.
 *
 * Done before the merge on purpose. Afterwards the two sides are one set
 * of rows and a child pointing at id 7 can no longer be traced to the
 * device that wrote it. The one table this reaches today is scanned
 * products, keyed across devices by its barcode while its id counts up
 * separately on each device.
 *
 * Returns a fresh copy of the incoming tables; nothing handed in is
 * written to.
 */
export function renumberIncoming(here: Tables, there: Tables, shapes: Shapes): Tables {
  const out: Tables = { ...there };
  for (const [table, shape] of Object.entries(shapes)) {
    const column = shape.localId;
    if (!column) continue;
    const mine = here[table];
    const theirs = there[table];
    if (!Array.isArray(mine) || !Array.isArray(theirs)) continue;

    const idHere = new Map<string, string>();
    const takenHere = new Set<string>();
    let next = 0;
    for (const row of mine) {
      const key = keyOf(row, shape);
      const id = row[column];
      if (id === null || id === undefined) continue;
      const asText = String(id);
      takenHere.add(asText);
      if (key !== null) idHere.set(key, asText);
      const asNumber = Number(asText);
      if (Number.isFinite(asNumber) && asNumber > next) next = asNumber;
    }

    const remap = new Map<string, string>();
    const rows: Row[] = [];
    for (const row of theirs) {
      const key = keyOf(row, shape);
      const id = row[column];
      if (id === null || id === undefined) {
        rows.push(row);
        continue;
      }
      const asText = String(id);
      const settled = key !== null ? idHere.get(key) : undefined;
      let becomes = asText;
      if (settled !== undefined) {
        // The same thing on both devices, under two numbers. Theirs takes
        // the number this device already uses so the two rows merge.
        becomes = settled;
      } else if (takenHere.has(asText)) {
        // A different thing already holds that number here.
        next += 1;
        becomes = String(next);
      }
      if (becomes !== asText) remap.set(asText, becomes);
      takenHere.add(becomes);
      rows.push(becomes === asText ? row : { ...row, [column]: asNumberIfNumeric(becomes, id) });
    }
    out[table] = rows;
    if (remap.size === 0) continue;

    for (const child of shape.children ?? []) {
      const childRows = there[child.table];
      if (!Array.isArray(childRows)) continue;
      out[child.table] = childRows.map((row) => {
        const value = row[child.column];
        if (value === null || value === undefined) return row;
        const becomes = remap.get(String(value));
        if (becomes === undefined) return row;
        return { ...row, [child.column]: asNumberIfNumeric(becomes, value) };
      });
    }
  }
  return out;
}

/** Keeps a renumbered id the same kind of value the column already held. */
function asNumberIfNumeric(text: string, was: unknown): string | number {
  if (typeof was === 'number') {
    const asNumber = Number(text);
    if (Number.isFinite(asNumber)) return asNumber;
  }
  return text;
}

type TableMerge = { rows: Row[]; entries: MergeEntry[] };

function mergeOneTable(
  table: string,
  base: Row[] | undefined,
  here: Row[] | undefined,
  there: Row[] | undefined,
  shape: TableShape | undefined,
  laterSide: MergeSide,
): TableMerge {
  const baseRows = indexRows(base, shape);
  const hereRows = indexRows(here, shape);
  const thereRows = indexRows(there, shape);
  const rows: Row[] = [];
  const entries: MergeEntry[] = [];

  const moved = (was: Row | undefined, now: Row | undefined): boolean => {
    if (!was || !now) return was !== now;
    return rowText(was) !== rowText(now);
  };

  const keys: string[] = [];
  const seen = new Set<string>();
  for (const key of hereRows.keys()) {
    keys.push(key);
    seen.add(key);
  }
  for (const key of thereRows.keys()) if (!seen.has(key)) keys.push(key);

  for (const key of keys) {
    const was = baseRows.get(key);
    const mine = hereRows.get(key);
    const theirs = thereRows.get(key);
    const iMoved = moved(was, mine);
    const theyMoved = moved(was, theirs);

    if (!iMoved && !theyMoved) {
      if (mine) rows.push(mine);
      continue;
    }
    if (!theyMoved) {
      // Only this device moved it. Kept, and said, so the log carries both
      // sides rather than only what arrived.
      if (mine) {
        rows.push(mine);
        entries.push({ table, key, kind: was ? 'changed' : 'added', side: 'here' });
      } else {
        entries.push({ table, key, kind: 'removed', side: 'here' });
      }
      continue;
    }
    if (!iMoved) {
      if (theirs) {
        rows.push(theirs);
        entries.push({ table, key, kind: was ? 'changed' : 'added', side: 'there' });
      } else {
        entries.push({ table, key, kind: 'removed', side: 'there' });
      }
      continue;
    }

    // Both devices moved the same row.
    if (mine && !theirs) {
      rows.push(mine);
      entries.push({ table, key, kind: 'changed', side: 'here', conflict: 'edited' });
      continue;
    }
    if (theirs && !mine) {
      rows.push(theirs);
      entries.push({ table, key, kind: 'changed', side: 'there', conflict: 'edited' });
      continue;
    }
    if (mine && theirs) {
      if (rowText(mine) === rowText(theirs)) {
        // The same edit on both devices, which is nobody losing anything.
        rows.push(mine);
        entries.push({ table, key, kind: was ? 'changed' : 'added', side: laterSide });
        continue;
      }
      const winner = laterOf(mine, theirs, laterSide);
      rows.push(winner === 'here' ? mine : theirs);
      entries.push({ table, key, kind: 'changed', side: winner, conflict: 'later' });
    }
    // Removed on both devices, with nothing left to say about it.
  }

  return { rows, entries };
}

/**
 * The merged database, and everything that went into it.
 *
 * With no base (two devices that have never been in step, which is the
 * first sync after turning it on), every row on both sides is kept: two
 * histories that were never one cannot be told apart into changes, and
 * keeping both loses nothing. The caller asks before reaching that, since
 * somebody setting up a second device may want one side only.
 */
export function mergeTables(
  base: Tables | null,
  here: Tables,
  there: Tables,
  options: MergeOptions,
): MergeResult {
  const { shapes, laterSide } = options;
  const wholesale = options.wholesale ?? [];
  const incoming = renumberIncoming(here, there, shapes);
  const tables: Tables = {};
  const entries: MergeEntry[] = [];
  const takenWhole: string[] = [];

  // Set false by the first table whose merged rows are not what arrived.
  let matchesThere = true;

  const names = new Set<string>([...Object.keys(here), ...Object.keys(incoming)]);
  for (const table of names) {
    const mine = here[table];
    const theirs = incoming[table];

    // A table only one side has at all belongs to a version the other has
    // not caught up to. Keeping what is here, or taking what arrived when
    // nothing is here, leaves the newer version to sort it out.
    if (!Array.isArray(mine)) {
      if (Array.isArray(theirs)) tables[table] = theirs;
      continue;
    }
    if (!Array.isArray(theirs)) {
      tables[table] = mine;
      if (mine.length > 0) matchesThere = false;
      continue;
    }

    if (wholesale.includes(table)) {
      const taken = laterSide === 'here' ? mine : theirs;
      tables[table] = taken;
      takenWhole.push(table);
      if (!sameRows(taken, theirs)) matchesThere = false;
      continue;
    }

    const merged = mergeOneTable(table, base?.[table], mine, theirs, shapes[table], laterSide);
    tables[table] = merged.rows;
    for (const entry of merged.entries) entries.push(entry);
    if (!sameRows(merged.rows, theirs)) matchesThere = false;
  }

  return { tables, entries, wholesale: takenWhole, sendsBack: !matchesThere, incoming };
}

/** How many phrases a notice says before the rest become "and N other things". */
export const MOST_MERGES_SAID = 4;

type Words = { one: string; many: string; counts: boolean } | null;

type Bucket = { words: { one: string; many: string }; added: number; changed: number; removed: number };

/**
 * What a merge did, in words a person reads, grouped so eleven rows of one
 * thing read as one line. The words for a table are handed in rather than
 * imported, the same way stampTables takes its hash, so this module stays
 * free of imports; lib/snapshotSyncDevice.ts passes the map from
 * lib/snapshotChanges.ts.
 */
export function describeMerge(
  entries: readonly MergeEntry[],
  words: (table: string) => Words,
  side: MergeSide,
): string[] {
  const buckets = new Map<string, Bucket>();
  for (const entry of entries) {
    if (entry.side !== side) continue;
    const found = words(entry.table);
    if (!found) continue;
    const bucket = buckets.get(found.many) ?? { words: found, added: 0, changed: 0, removed: 0 };
    // A table that only marks its area as touched has no number worth
    // saying: six ingredient rows under one salad are not six salads.
    if (!found.counts) bucket.changed += 1;
    else if (entry.kind === 'added') bucket.added += 1;
    else if (entry.kind === 'removed') bucket.removed += 1;
    else bucket.changed += 1;
    buckets.set(found.many, bucket);
  }

  const phrases: { text: string; weight: number }[] = [];
  for (const bucket of buckets.values()) {
    const { one, many } = bucket.words;
    if (bucket.added > 0) {
      phrases.push({
        text: bucket.added + ' more ' + (bucket.added === 1 ? one : many),
        weight: bucket.added,
      });
    }
    if (bucket.removed > 0) {
      phrases.push({
        text: bucket.removed + ' fewer ' + (bucket.removed === 1 ? one : many),
        weight: bucket.removed,
      });
    }
    if (bucket.changed > 0) phrases.push({ text: 'edits to ' + many, weight: bucket.changed });
  }

  phrases.sort((a, b) => (b.weight !== a.weight ? b.weight - a.weight : a.text.localeCompare(b.text)));
  const said = phrases.slice(0, MOST_MERGES_SAID).map((phrase) => phrase.text);
  const left = phrases.length - said.length;
  if (left > 0) said.push(left + ' other thing' + (left === 1 ? '' : 's'));
  return said;
}

/** The rows where both devices had moved the same record, for the log to mark. */
export function conflictsIn(entries: readonly MergeEntry[]): MergeEntry[] {
  return entries.filter((entry) => entry.conflict !== undefined);
}
