// How each table's rows are followed from one device to the other, read
// off the live schema rather than from a list somebody maintains.
//
// lib/snapshotMerge.ts decides what happens to a row; it needs to be told
// which columns say that two rows on two devices are the same row. Asking
// SQLite is the only answer that cannot drift: a table added next month
// gets its shape the moment it exists, the same discipline
// getRealUserTableNames() in lib/dataBackup.ts already follows.
//
// Three cases come out of the schema:
//
//   1. A TEXT primary key, which is 109 of this app's 113 tables. The id
//      is built on the device from the moment it was made plus random
//      characters, so it is the same on both devices and unique across
//      them. The key is that column.
//   2. A primary key over more than one column (a family member plus a
//      condition, a product plus a nutrient). The key is those columns.
//   3. An INTEGER primary key, which SQLite makes an alias for the rowid
//      and hands out per device, so the number means nothing to the other
//      device. If the table has a UNIQUE column of its own (a barcode),
//      that is the key and the id is renumbered on arrival. Without one,
//      the id is used and the table is named in unsafeTables, so the
//      caller can decide not to merge it row by row.
//
// Children come from PRAGMA foreign_key_list, so a renumbered row takes
// everything pointing at it along.

import { getDatabase } from './db';
import type { Shapes, TableShape } from './snapshotMerge';

type ColumnInfo = { name: string; type: string; pk: number };
type IndexInfo = { name: string; unique: number; origin: string };
type IndexColumn = { name: string | null };
type ForeignKey = { table: string; from: string; to: string | null };

export type SchemaShapes = {
  shapes: Shapes;
  /** Tables whose rows cannot be told apart across devices with any confidence. */
  unsafeTables: string[];
};

/** Works out every table's shape in one pass over the schema. */
export async function readSchemaShapes(tableNames: readonly string[]): Promise<SchemaShapes> {
  const db = await getDatabase();
  const shapes: Shapes = {};
  const unsafeTables: string[] = [];
  const childrenOf = new Map<string, { table: string; column: string }[]>();

  for (const table of tableNames) {
    const columns = await db.getAllAsync<ColumnInfo>(`PRAGMA table_info(${quote(table)})`);
    const keyColumns = columns
      .filter((column) => column.pk > 0)
      .sort((a, b) => a.pk - b.pk)
      .map((column) => column.name);

    let shape: TableShape;
    if (keyColumns.length === 0) {
      // Nothing declared, so the whole row is its own identity: an edit
      // reads as one row going and another arriving, which keeps the data
      // right even though the log reads less precisely.
      shape = { key: [] };
      unsafeTables.push(table);
    } else if (keyColumns.length > 1) {
      shape = { key: keyColumns };
    } else {
      const only = columns.find((column) => column.name === keyColumns[0]);
      const isRowId = (only?.type ?? '').toUpperCase() === 'INTEGER';
      if (!isRowId) {
        shape = { key: keyColumns };
      } else {
        const natural = await naturalKey(db, table, keyColumns[0]);
        if (natural) {
          shape = { key: natural, localId: keyColumns[0] };
        } else {
          shape = { key: keyColumns, localId: keyColumns[0] };
          unsafeTables.push(table);
        }
      }
    }
    shapes[table] = shape;

    const foreignKeys = await db.getAllAsync<ForeignKey>(`PRAGMA foreign_key_list(${quote(table)})`);
    for (const key of foreignKeys) {
      const list = childrenOf.get(key.table) ?? [];
      list.push({ table, column: key.from });
      childrenOf.set(key.table, list);
    }
  }

  for (const [parent, children] of childrenOf) {
    const shape = shapes[parent];
    if (shape && shape.localId) shapes[parent] = { ...shape, children };
  }

  return { shapes, unsafeTables };
}

/**
 * A column of the table's own that is unique and is not the id, which is
 * what lets a row be recognised on the other device. A barcode is the one
 * this app has today.
 */
async function naturalKey(
  db: Awaited<ReturnType<typeof getDatabase>>,
  table: string,
  idColumn: string,
): Promise<string[] | null> {
  const indexes = await db.getAllAsync<IndexInfo>(`PRAGMA index_list(${quote(table)})`);
  for (const index of indexes) {
    if (index.unique !== 1) continue;
    const columns = await db.getAllAsync<IndexColumn>(`PRAGMA index_info(${quote(index.name)})`);
    const names = columns.map((column) => column.name).filter((name): name is string => name !== null);
    if (names.length === 0) continue;
    if (names.includes(idColumn)) continue;
    return names;
  }
  return null;
}

/** A table name is already a plain identifier here; quoted so a keyword cannot break the pragma. */
function quote(name: string): string {
  return '"' + name.replace(/"/g, '""') + '"';
}

/**
 * Tables the app works out for itself, where merging row by row would mean
 * nothing. Taken whole from whichever device saved later.
 */
export const WORKED_OUT_TABLES: readonly string[] = [
  'daily_nutrient_totals_cache',
  'achievement_criteria_progress',
];
