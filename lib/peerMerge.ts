// Bringing two people's copies of a shared thing together, the same way two
// of one person's devices are brought together.
//
// Direct instruction, 2026-09-22: "the communication flow as per what is
// being done between the user's devices needs to be the same kind of
// process that happens between partners, and their children, and where
// applicable, their care giver." So the engine is the same engine:
// mergeTables in lib/snapshotMerge.ts, base against here against there,
// decided record by record, nothing either side did thrown away, and one
// entry written out per record decided so the notice and the log can say
// what happened and who did it.
//
// TWO THINGS ARE ADDED ON TOP OF IT, AND BOTH ARE THE ALLOWLIST.
//
//   1. WHOLE TABLES. Two devices share one database, so the device merge
//      takes everything. Two people share almost nothing, so this one
//      takes only what lib/peerRelationships.ts says the relationship
//      carries. A table that arrives outside that list is refused and
//      named, never quietly dropped and never quietly kept.
//   2. SINGLE COLUMNS. A column can stay on this device inside a table
//      that crosses: a note somebody wrote to themselves on a shopping
//      line, a row number that means nothing on another phone. Those are
//      stripped before anything is sent and put back from this device
//      after the merge, so a row taken from the other side can never blank
//      something the other side was never given.
//
// WHY PUTTING THE COLUMNS BACK IS NOT OPTIONAL. Without it, the first time
// a partner ticked off a line the note underneath it would vanish, and it
// would look like the app had eaten it. The merge decides which row wins;
// the columns that stay home are not part of that decision at all.
import type { ConnectionRole, ShareGrants } from './partners';
import { columnsThatStayHome, tableNamesThatCross } from './peerRelationships';
import { listPhrases } from './snapshotSync';
import {
  describeMerge,
  keyOf,
  mergeTables,
  MOST_MERGES_SAID,
  type MergeEntry,
  type MergeSide,
  type Row,
  type Shapes,
  type Tables,
} from './snapshotMerge';

export { MOST_MERGES_SAID };

/** Who the merge is with, and what they are allowed to reach. */
export type PeerStanding = {
  role: ConnectionRole;
  grants: ShareGrants;
};

export type PeerMergeOptions = PeerStanding & {
  shapes: Shapes;
  /**
   * Whose copy was written later, for a record both people changed that
   * carries no time of its own. The row's own timestamp settles it where
   * there is one, exactly as between two devices.
   */
  laterSide: MergeSide;
};

export type PeerMergeResult = {
  /** The merged rows, for the carried tables only. */
  tables: Tables;
  /** One per record decided, for the notice and the log. */
  entries: MergeEntry[];
  /** Tables the other side sent that this relationship does not carry. */
  refused: string[];
  /**
   * What arrived, scoped to the carried tables and renumbered into this
   * device's ids: what the other person holds, as far as this side can
   * know, and so what the caller keeps as the base for next time.
   */
  incoming: Tables;
};

function withoutColumns(rows: readonly Row[], columns: readonly string[]): Row[] {
  if (columns.length === 0) return rows.map((row) => ({ ...row }));
  return rows.map((row) => {
    const copy: Row = {};
    for (const [key, value] of Object.entries(row)) {
      if (!columns.includes(key)) copy[key] = value;
    }
    return copy;
  });
}

/**
 * The tables to hand over, with everything that stays here taken out.
 *
 * The one place a send can be decided, so no caller can widen it by
 * passing the wrong argument. The same reasoning buildSyncPayload already
 * follows for condition codes, and for the same reason: a privacy decision
 * is either enforced in one place or hoped for in several.
 */
export function tablesToSend(here: Tables, standing: PeerStanding): Tables {
  const allowed = tableNamesThatCross(standing.role, standing.grants);
  const home = columnsThatStayHome(standing.role, standing.grants);
  const out: Tables = {};
  for (const table of allowed) {
    const rows = here[table];
    if (!Array.isArray(rows)) continue;
    out[table] = withoutColumns(rows, home[table] ?? []);
  }
  return out;
}

/** Tables that arrived outside what this relationship carries. */
export function refusedTables(there: Tables, standing: PeerStanding): string[] {
  const allowed = tableNamesThatCross(standing.role, standing.grants);
  return Object.keys(there)
    .filter((table) => !allowed.includes(table))
    .sort();
}

/**
 * Base against here against there, over the carried tables only.
 *
 * The base is the copy that last arrived from that person, kept per
 * person the way lib/snapshotSyncDevice.ts keeps one per pair of devices.
 * Without it there is no way to tell a record somebody added from one the
 * other person removed, which is the whole of what 1.0.49.3 fixed between
 * two devices and the whole of what this carries into a relationship.
 *
 * What arrived rather than what the merge made of it, for the reason set
 * out at length over the base in lib/snapshotSyncDevice.ts: the other
 * person has not been handed the merged copy yet, and writing it down as
 * though they had turns a record added here into a record they deleted.
 *
 * With no base at all, every record on both sides is kept: two lists that
 * were never one cannot be told apart into changes, and keeping both loses
 * nothing that can be got back.
 */
export function mergePeerTables(
  base: Tables | null,
  here: Tables,
  there: Tables,
  options: PeerMergeOptions,
): PeerMergeResult {
  const standing: PeerStanding = { role: options.role, grants: options.grants };
  const allowed = tableNamesThatCross(standing.role, standing.grants);
  const home = columnsThatStayHome(standing.role, standing.grants);

  const scope = (tables: Tables): Tables => {
    const out: Tables = {};
    for (const table of allowed) {
      const rows = tables[table];
      if (Array.isArray(rows)) out[table] = withoutColumns(rows, home[table] ?? []);
    }
    return out;
  };

  const mine = scope(here);
  const theirs = scope(there);
  const agreed = base === null ? null : scope(base);

  const merged = mergeTables(agreed, mine, theirs, { shapes: options.shapes, laterSide: options.laterSide });

  // What stays home goes back on, read from this device. A row that is new
  // from the other side has nothing to put back and keeps whatever the
  // column defaults to.
  const tables: Tables = {};
  for (const [table, rows] of Object.entries(merged.tables)) {
    const columns = home[table] ?? [];
    if (columns.length === 0) {
      tables[table] = rows;
      continue;
    }
    const shape = options.shapes[table];
    const byKey = new Map<string, Row>();
    for (const row of here[table] ?? []) {
      const key = keyOf(row, shape);
      if (key !== null) byKey.set(key, row);
    }
    tables[table] = rows.map((row) => {
      const key = keyOf(row, shape);
      const wasHere = key === null ? undefined : byKey.get(key);
      if (!wasHere) return row;
      const filled: Row = { ...row };
      for (const column of columns) {
        if (column in wasHere) filled[column] = wasHere[column];
      }
      return filled;
    });
  }

  return {
    tables,
    entries: merged.entries,
    refused: refusedTables(there, standing),
    incoming: merged.incoming,
  };
}

type Words = { one: string; many: string; counts: boolean } | null;

/**
 * What a merge with somebody did, in words.
 *
 * The same phrases the device notices use, through the same describeMerge
 * and the same listPhrases, so "3 more shopping list items" reads the same
 * whether it came from a computer in the next room or from another person's
 * phone. Only who did it changes, which is the part somebody wants to know.
 *
 * Returns null when nothing moved, so a caller can stay quiet rather than
 * report that nothing happened. Between two devices that decision lives in
 * mergedNotice; this is the same decision for a person.
 */
export function peerMergeNotice(
  result: PeerMergeResult,
  words: (table: string) => Words,
  personName: string,
): string | null {
  const there = describeMerge(result.entries, words, 'there');
  const here = describeMerge(result.entries, words, 'here');
  const both = result.entries.filter((entry) => entry.conflict !== undefined).length;
  const parts: string[] = [];
  if (there.length > 0) parts.push('What ' + personName + ' changed: ' + listPhrases(there) + '.');
  if (here.length > 0) parts.push('What you changed: ' + listPhrases(here) + '.');
  if (both > 0) {
    parts.push(
      both === 1
        ? 'One record you had both changed was settled by whichever change came later, and it is in the log.'
        : both + ' records you had both changed were settled by whichever change came later, and they are in the log.',
    );
  }
  if (parts.length === 0) return null;
  return 'Brought together with ' + personName + '. ' + parts.join(' ');
}

/**
 * What to say about anything that arrived outside what the link carries.
 *
 * Said rather than swallowed. A link that quietly drops what it was handed
 * looks identical to one that is working, and the person on the other end
 * would go on sending it.
 */
export function refusedNotice(refused: readonly string[], personName: string): string | null {
  if (refused.length === 0) return null;
  const many = refused.length !== 1;
  return (
    (many ? refused.length + ' kinds of record' : 'One kind of record') +
    ' arrived from ' + personName + ' that this link does not carry, so ' +
    (many ? 'they were' : 'it was') + ' left out.'
  );
}
