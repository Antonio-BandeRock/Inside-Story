// Reading, merging and writing back what crosses between two PEOPLE.
//
// lib/peerMerge.ts decides; this does the I/O, which is the same split
// lib/snapshotSync.ts and lib/snapshotSyncDevice.ts already follow and the
// reason scripts/test_peer_merge.js can check every decision without a
// phone.
//
// Direct instruction, 2026-09-22: "the communication flow as per what is
// being done between the user's devices needs to be the same kind of
// process that happens between partners, and their children, and where
// applicable, their care giver." Four things make up that process, and all
// four are here:
//
//   1. Nothing either side did is thrown away. The arrival is merged
//      against the copy the two people last agreed on, record by record,
//      rather than replacing what is here.
//   2. The agreed copy is kept, per person, in peer_sync_base. Without it
//      a line somebody ticked off and deleted comes straight back on the
//      next merge.
//   3. What happened is said, naming who did it, unless the person has
//      turned the saying off.
//   4. It is written down either way, in the same log the device merges go
//      into, so there is somewhere to look.
//
// THE ONE THING THAT IS NOT THE SAME. Between two devices the merge takes
// the whole database. Between two people it takes only what
// lib/peerRelationships.ts says that relationship carries, and only the
// columns it says travel. That list is the security surface of this whole
// feature, and it is an allowlist for the reason written at the top of
// that file: a denylist would leak the health domain the first time
// somebody added a table.
import { getDatabase } from './db';
import { getConnection } from './connections';
import type { Connection } from './connections';
import { readSyncState, getMyDevice } from './snapshotSyncDevice';
import {
  mergePeerTables,
  peerMergeNotice,
  refusedNotice,
  tablesToSend,
  type PeerMergeResult,
  type PeerStanding,
} from './peerMerge';
import { tableNamesThatCross } from './peerRelationships';
import { readSchemaShapes } from './snapshotShapes';
import type { MergeSide, Row, Tables } from './snapshotMerge';
import { recordPeerMerge } from './syncLog';
import { withDatabaseWriteTrackingSuspended } from './databaseActivity';

/** What a link carries, as it stands on this device right now. */
export async function readPeerTables(standing: PeerStanding): Promise<Tables> {
  const names = tableNamesThatCross(standing.role, standing.grants);
  if (names.length === 0) return {};
  const db = await getDatabase();
  const tables: Tables = {};
  for (const name of names) {
    try {
      tables[name] = await db.getAllAsync<Row>(`SELECT * FROM ${name}`);
    } catch (error) {
      // A table this version of the app has not created yet. Left out
      // rather than guessed at, so an older phone talking to a newer one
      // carries what it has instead of failing the whole merge.
      console.error('[peerSync] could not read ' + name, error);
    }
  }
  return tables;
}

/** What to hand over to one person, with everything that stays here taken out. */
export async function buildPeerTables(standing: PeerStanding): Promise<Tables> {
  return tablesToSend(await readPeerTables(standing), standing);
}

// THE AGREED COPY, one row per person, in peer_sync_base.
//
// Between two devices this is a file at Paths.document, since there is only
// ever one of it. Between people there is one per person, so it is a table.
// It is deliberately NOT device local: both of this person's devices talk
// to the same partner, and a base one of them agreed is the base the other
// needs, or the second device resurrects what the first had settled.

export async function readPeerBase(connectionId: string): Promise<Tables | null> {
  try {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ tables_json: string }>(
      'SELECT tables_json FROM peer_sync_base WHERE connection_id = ?',
      connectionId,
    );
    if (!row) return null;
    const parsed: unknown = JSON.parse(row.tables_json);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parsed as Tables;
  } catch (error) {
    // Unreadable reads as absent, which is the safe direction: with no base
    // every record on both sides is kept, so the worst that happens is a
    // removal coming back rather than somebody's work disappearing.
    console.error('[peerSync] could not read the agreed copy', error);
    return null;
  }
}

export async function writePeerBase(connectionId: string, tables: Tables): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync(
      `
        INSERT INTO peer_sync_base (connection_id, tables_json, agreed_at)
        VALUES (?, ?, ?)
        ON CONFLICT(connection_id) DO UPDATE SET tables_json = excluded.tables_json, agreed_at = excluded.agreed_at
      `,
      connectionId,
      JSON.stringify(tables),
      new Date().toISOString(),
    );
  } catch (error) {
    console.error('[peerSync] could not write the agreed copy', error);
  }
}

/** Dropped when a link ends, since there is no longer anybody to agree with. */
export async function forgetPeerBase(connectionId: string): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM peer_sync_base WHERE connection_id = ?', connectionId);
  } catch (error) {
    console.error('[peerSync] could not drop the agreed copy', error);
  }
}

/**
 * Puts a merged table back, replacing what was there.
 *
 * Safe as a replacement precisely because the merge was handed this
 * device's whole table: the result IS the table, with the other person's
 * records folded in, so writing it whole cannot lose a row the merge had
 * decided to keep. Anything outside the carried tables is never read, so
 * it cannot be written either.
 *
 * One transaction across every carried table, so a merge either lands or
 * does not. Half a merge would leave a shopping list pointing at a list
 * row that never arrived.
 */
async function writeTables(tables: Tables): Promise<void> {
  const names = Object.keys(tables);
  if (names.length === 0) return;
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    // Children first on the way out, parents first on the way in, so a row
    // is never left pointing at something that is not there yet.
    for (const name of [...names].reverse()) {
      await db.runAsync(`DELETE FROM ${name}`);
    }
    for (const name of names) {
      for (const row of tables[name]) {
        const columns = Object.keys(row);
        if (columns.length === 0) continue;
        await db.runAsync(
          `INSERT OR REPLACE INTO ${name} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
          ...columns.map((column) => row[column] as never),
        );
      }
    }
  });
}

export type PeerMergeOutcome = {
  /** What moved, for a caller that wants the detail. */
  result: PeerMergeResult;
  /** What to put on screen, or null when nothing moved or the person turned it off. */
  notice: string | null;
  /** Said separately, since it is about the link rather than about the records. */
  refused: string | null;
};

/**
 * Brings what arrived from one person together with what is here.
 *
 * `laterSide` is settled by when each side last wrote rather than by which
 * arrived: a row carrying a time of its own decides itself, and this is
 * only the fallback for one that does not.
 */
export async function mergeFromPeer(
  connection: Connection,
  there: Tables,
  sentAt: string,
): Promise<PeerMergeOutcome> {
  const standing: PeerStanding = { role: connection.role, grants: connection.grants };
  const here = await readPeerTables(standing);
  const base = await readPeerBase(connection.id);

  const names = tableNamesThatCross(standing.role, standing.grants);
  const { shapes } = await readSchemaShapes(names);

  // Which side to believe about one record both people moved that carries
  // no time of its own. The row's own timestamp settles it where there is
  // one; this is only the fallback, and it is the same comparison the two
  // devices make: when the writing here began against when they sent.
  const state = await readSyncState();
  const laterSide: MergeSide = state.dirtySince !== null && state.dirtySince > sentAt ? 'here' : 'there';

  const result = mergePeerTables(base, here, there, { ...standing, shapes, laterSide });

  if (result.entries.length > 0) {
    await writeTables(result.tables);
  }

  // The agreed copy is what both sides now hold, written from the merged
  // result rather than from either side's own. Suspended from the write
  // tracking: agreeing is bookkeeping, not somebody's change.
  await withDatabaseWriteTrackingSuspended(async () => {
    await writePeerBase(connection.id, tablesToSend(result.tables, standing));
  });

  const me = await getMyDevice();
  await recordPeerMerge(result.entries, { name: connection.name, role: connection.role }, me.kind);

  // The same switch governs both kinds of merge, since it is one question:
  // tell me what changed, or work quietly and let me look in the log.
  return {
    result,
    notice: state.announce ? peerMergeNotice(result, wordsForPeerTable, connection.name) : null,
    refused: refusedNotice(result.refused, connection.name),
  };
}

/** Convenience for a caller holding an id rather than the connection. */
export async function mergeFromPeerId(
  connectionId: string,
  there: Tables,
  sentAt: string,
): Promise<PeerMergeOutcome | null> {
  const connection = await getConnection(connectionId);
  if (!connection) return null;
  return mergeFromPeer(connection, there, sentAt);
}

// The words a person reads for each carried table. Deliberately its own
// short map rather than lib/snapshotChanges.ts's fifty: that one is keyed
// by everything in the database, and a peer merge only ever touches what
// lib/peerRelationships.ts carries. Kept here so adding a carried table
// makes it obvious that its words are owed too.
const PEER_WORDS: Record<string, { one: string; many: string; counts: boolean }> = {
  grocery_lists: { one: 'shopping list', many: 'shopping lists', counts: true },
  grocery_list_items: { one: 'thing to buy', many: 'things to buy', counts: true },
};

export function wordsForPeerTable(table: string): { one: string; many: string; counts: boolean } | null {
  return PEER_WORDS[table] ?? null;
}
