// expo-sqlite, as the desktop app sees it. metro.config.js resolves
// 'expo-sqlite' here when INSIDE_STORY_DESKTOP=1 on the web platform, so
// lib/db.ts keeps its `import * as SQLite from 'expo-sqlite'` and every
// runAsync/getAllAsync/getFirstAsync/execAsync/withTransactionAsync call it
// makes lands on SQLite running in Electron's main process (desktop/sqlite.js,
// on Node's built-in node:sqlite) over the bridge in ./bridge.ts.
//
// Only the surface the app uses is here. Anything expo-sqlite offers that
// the app never calls (prepared statements, change listeners, the sync
// API) is deliberately absent so a new use of it fails loudly at build
// time on desktop rather than quietly at run time.

import { getDesktopBridge, type DesktopSqlParam, type DesktopSqlParams } from './bridge';

export type SQLiteBindValue = DesktopSqlParam;
export type SQLiteBindParams = DesktopSqlParams;
export type SQLiteVariadicBindParams = SQLiteBindValue[];

export type SQLiteRunResult = {
  lastInsertRowId: number;
  changes: number;
};

/**
 * The folder desktop/sqlite.js keeps the databases in, as a bare path the
 * way expo-sqlite reports it on a phone. lib/db.ts prefixes it with
 * file:// to check that the reference database is on disk, and
 * ./fileSystemShim.ts answers that check against the same folder. Read
 * without throwing because `expo export` renders each route once in Node,
 * where there is no bridge, to write the static HTML.
 */
export const defaultDatabaseDirectory: string =
  typeof window !== 'undefined' && window.insideStoryDesktop ? window.insideStoryDesktop.paths.sqlite : 'desktop';

// expo-sqlite accepts its bind values three ways: spread after the SQL,
// as one array, or as one object of named parameters. All three are used
// in this app, so they are folded into one shape for the bridge here.
function normalizeParams(params: unknown[]): DesktopSqlParams {
  if (params.length === 1) {
    const only = params[0];
    if (Array.isArray(only)) {
      return only as DesktopSqlParam[];
    }
    if (only && typeof only === 'object' && !(only instanceof Uint8Array)) {
      return only as Record<string, DesktopSqlParam>;
    }
  }
  return params as DesktopSqlParam[];
}

export class SQLiteDatabase {
  constructor(readonly databaseName: string) {}

  async runAsync(source: string, ...params: unknown[]): Promise<SQLiteRunResult> {
    return getDesktopBridge().sqlite.run(this.databaseName, source, normalizeParams(params));
  }

  async getAllAsync<T = unknown>(source: string, ...params: unknown[]): Promise<T[]> {
    return (await getDesktopBridge().sqlite.all(this.databaseName, source, normalizeParams(params))) as T[];
  }

  async getFirstAsync<T = unknown>(source: string, ...params: unknown[]): Promise<T | null> {
    const row = await getDesktopBridge().sqlite.get(this.databaseName, source, normalizeParams(params));
    return (row ?? null) as T | null;
  }

  async execAsync(source: string): Promise<void> {
    await getDesktopBridge().sqlite.exec(this.databaseName, source);
  }

  async withTransactionAsync(task: () => Promise<void>): Promise<void> {
    await this.execAsync('BEGIN');
    try {
      await task();
      await this.execAsync('COMMIT');
    } catch (error) {
      await this.execAsync('ROLLBACK');
      throw error;
    }
  }

  async closeAsync(): Promise<void> {
    // The main process keeps its connections open for the life of the app.
  }
}

export async function openDatabaseAsync(databaseName: string): Promise<SQLiteDatabase> {
  await getDesktopBridge().sqlite.open(databaseName);
  return new SQLiteDatabase(databaseName);
}

/**
 * On the phone this copies the bundled reference database out of the app
 * package. On desktop the installer places that file beside the app, and
 * the main process copies it into the data folder only when the shipped
 * file has changed, so the flags the app writes into it survive a relaunch.
 * `options` is accepted for signature compatibility; the desktop build
 * does not bundle the asset (metro.config.js resolves it to nothing).
 */
export async function importDatabaseFromAssetAsync(
  databaseName: string,
  _options?: { assetId?: unknown; forceOverwrite?: boolean },
): Promise<void> {
  await getDesktopBridge().sqlite.importReference(databaseName);
}
