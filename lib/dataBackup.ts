// Local, whole-database backup & restore -- 2026-08-16, direct request
// following a real discussion of why this had to come before cloud sync
// (see CLAUDE.md's own "Named, unresolved risks" and Architecture-
// decisions sections for the fuller reasoning this grew out of).
//
// Two real design decisions worth stating plainly, since they answer the
// two real questions this feature was built in direct response to:
//
// 1. "The app isn't finished yet -- does backup have to wait, and how do
//    new things get covered later?" This whole module never hand-lists
//    which tables to back up. getRealUserTableNames() asks the LIVE
//    database itself, via SQLite's own sqlite_master, what real tables
//    exist right now -- so a table added in some future session (Sleep
//    tracking, say, once that addon gets built) is automatically included
//    the very next time someone exports, with zero code changes to this
//    file ever required. The one deliberate exception: this device's own
//    real signing/pairing key (lib/deviceIdentity.ts) was built from day
//    one to live in expo-secure-store, not SQLite -- a schema-driven
//    database export correctly, automatically leaves it out, which is a
//    real security property (a backup file that ends up in an email or a
//    Drive folder should never also hand someone the ability to
//    impersonate this device), not an oversight.
//
// 2. "Won't real multi-party cloud sync need this split by domain?" Yes --
//    the already-decided household-sharing tiers (CLAUDE.md's own
//    Architecture section) explicitly require it: a companion account only
//    ever sees the shared meal-plan/schedule/shopping domain, never the
//    personal-health domain (symptom logs, labs, meds, trial history,
//    condition scoring). One undifferentiated encrypted blob can't do
//    that. Today's export doesn't need to actually split, though, since
//    today it has exactly one real audience (the same person, on a future
//    device) -- but it's structured per real table (BackupEnvelope.tables
//    is a dictionary keyed by table name, not one flat array) specifically
//    so a future domain-partitioning pass is a real, additive step
//    ("route these table keys into file A, those into file B") rather than
//    a rewrite of this same shape.
//
// 3. "Is a plain-JSON export actually safe?" No, and this was fixed the
//    same day it was asked directly -- see lib/backupEncryption.ts. Every
//    real export from exportBackupToFile() now goes out as an
//    EncryptedBackupWire, never plain JSON, with the password chosen by
//    the person themselves and never stored anywhere the app can read it
//    back on its own. app/profile.tsx's own restore flow detects which
//    real shape a given file is (isEncryptedBackupWire vs. a bare
//    BackupEnvelope) and handles either correctly, so a genuinely older,
//    unencrypted backup already sitting on a device stays fully openable.
//
// A real, honest scope boundary, stated directly rather than glossed over:
// this backs up the DATABASE -- every real row, in every real local table
// -- but not the actual photo FILES a person's saved builder creations or
// favorites may reference (lib/mealPhotos.ts's own photo_uri columns are
// backed up as plain string paths, since they're ordinary column values,
// but the real image bytes those paths point at live on local device
// storage, outside SQLite entirely, and aren't bundled into this export).
// A restored database will show a broken/missing image wherever a photo
// once was, if the original device's own files are gone. Bundling real
// photo bytes into a portable backup is a genuine, separate scope
// decision (likely a much larger file, base64-embedded the same way a
// shared recipe's own small thumbnail already is in lib/sharing.ts) worth
// a real, deliberate follow-up, not attempted here.
//
// Follows the exact real dynamic-import discipline lib/customBackgroundImage.ts
// first established and lib/sharing.ts/lib/mealPhotos.ts/lib/isFileLinking.ts
// already reuse: nothing from expo-file-system is imported at module
// scope at all here, every actual call goes through a real
// `await import('expo-file-system')` inside the function that needs it.
//
// Real restore-from-anywhere, not just "undo my last local export": File's
// own static pickFileAsync() (confirmed directly against expo-file-
// system's real type declarations before relying on it) opens the OS's
// own native file browser -- already part of expo-file-system, a package
// already linked into this build, so this needed no new dependency and no
// new native rebuild at all, unlike almost every other native-picker
// feature this app has added. That's what makes a genuine disaster-
// recovery story (export, save the file wherever -- Drive, email to
// yourself, a USB transfer -- then, on a replacement phone, pick that same
// file back in) real today rather than a deferred next step.

import type { SQLiteBindValue } from 'expo-sqlite';
import { encryptBackupPayload } from './backupEncryption';
import { getDatabase } from './db';

export const BACKUP_SCHEMA_VERSION = 1;

export interface BackupEnvelope {
  schemaVersion: number;
  exportedAt: string; // ISO 8601, real export moment
  // A real, human-readable manifest of which tables this specific export
  // actually captured -- redundant with Object.keys(tables), kept anyway
  // so a person (or a future support conversation) can see at a glance
  // what a given backup file covers without parsing the whole payload.
  tableNames: string[];
  tables: Record<string, Record<string, unknown>[]>;
}

export interface RestoreResult {
  tablesRestored: number;
  rowsRestored: number;
  // Real, honest reporting for a table the backup names that this app's
  // CURRENT schema no longer has -- a genuinely possible case (an older
  // backup, taken before some future schema change), skipped rather than
  // failing the whole restore.
  tablesSkipped: string[];
}

const INTERNAL_TABLE_PREFIX = 'sqlite_';

// The one real place this whole feature asks the live database what
// exists, rather than trusting a list anyone had to remember to update.
async function getRealUserTableNames(): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ name: string }>(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE ? ORDER BY name`,
    [`${INTERNAL_TABLE_PREFIX}%`],
  );
  return rows.map((row) => row.name);
}

export async function buildBackupEnvelope(): Promise<BackupEnvelope> {
  const db = await getDatabase();
  const tableNames = await getRealUserTableNames();
  const tables: Record<string, Record<string, unknown>[]> = {};

  for (const name of tableNames) {
    // `name` comes straight out of sqlite_master, never from anything a
    // person typed -- safe to interpolate as a real identifier here, and
    // there's no way to parametrize a table name in a prepared statement
    // regardless.
    tables[name] = await db.getAllAsync<Record<string, unknown>>(`SELECT * FROM "${name}"`);
  }

  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    tableNames,
    tables,
  };
}

// Writes a real backup file into this app's own cache directory (the same
// real "disposable, meant to be handed to the OS share sheet and then
// forgotten" storage lib/sharing.ts's own writeIsFile already uses for
// exactly this reason) and returns its own real file:// URI.
//
// Encryption is mandatory here, not an opt-out toggle -- 2026-08-16, a
// direct security question surfaced that the plain-JSON export was
// readable in any text editor or AI tool the instant it left this device,
// and the real, agreed fix is that every NEW export goes out encrypted,
// full stop. See lib/backupEncryption.ts's own header comment for the
// real crypto this wraps. restoreFromBackupEnvelope's own callers still
// handle a genuinely older, unencrypted file transparently (see
// parseBackupEnvelope below) -- this only changes what a FUTURE export
// produces, it never breaks reading a real backup already sitting on a
// device from before this feature existed.
export async function exportBackupToFile(password: string): Promise<string | null> {
  try {
    const envelope = await buildBackupEnvelope();
    const wire = await encryptBackupPayload(JSON.stringify(envelope), password);
    const { Directory, File, Paths } = await import('expo-file-system');
    const dir = new Directory(Paths.cache, 'backups');
    if (!dir.exists) dir.create({ intermediates: true });
    const stamp = envelope.exportedAt.replace(/[:.]/g, '-');
    const file = new File(dir, `inside-story-backup-${stamp}.json`);
    file.write(JSON.stringify(wire));
    return file.uri;
  } catch (error) {
    console.error('[dataBackup] Failed to write a real backup file', error);
    return null;
  }
}

export interface LocalBackupFile {
  uri: string;
  name: string;
  modificationTimeMs: number | null;
}

// Real, local-only backups already sitting in this app's own cache
// directory, newest first -- what "Restore Most Recent Backup" (Profile's
// own Backup & Restore card) reads from, a fast, one-tap way to undo to
// your last export on THIS still-working device. Real restore from
// somewhere else entirely (a Drive folder, an email attachment, a
// replacement phone) goes through pickAndReadBackupFile() below instead.
export async function listLocalBackupFiles(): Promise<LocalBackupFile[]> {
  try {
    const { Directory, Paths } = await import('expo-file-system');
    const dir = new Directory(Paths.cache, 'backups');
    if (!dir.exists) return [];
    const entries = dir.list();
    const files: LocalBackupFile[] = [];
    for (const entry of entries) {
      if ('extension' in entry && entry.uri.endsWith('.json')) {
        files.push({ uri: entry.uri, name: entry.name, modificationTimeMs: entry.modificationTime ?? null });
      }
    }
    files.sort((a, b) => (b.modificationTimeMs ?? 0) - (a.modificationTimeMs ?? 0));
    return files;
  } catch (error) {
    console.error('[dataBackup] Failed to list local backup files', error);
    return [];
  }
}

// The real, full disaster-recovery entry point: opens the OS's own native
// file browser (File.pickFileAsync, part of the already-linked expo-
// file-system package -- confirmed directly against its real type
// declarations, no new dependency needed) so a person can pick a backup
// file from literally anywhere it's been saved -- a Drive folder, an
// email attachment already downloaded, a different app's own share
// target, a fresh phone with nothing else on it. Returns null on a
// genuine cancel (the picker's own promise can reject on Android when
// someone backs out without choosing anything -- treated the same, silent
// way this app already treats a cancelled image pick elsewhere) or a real
// read failure.
export async function pickAndReadBackupFile(): Promise<{ uri: string; content: string } | null> {
  try {
    const { File } = await import('expo-file-system');
    const picked = await File.pickFileAsync(undefined, 'application/json');
    const file = Array.isArray(picked) ? picked[0] : picked;
    if (!file) return null;
    const content = await readBackupFileContent(file.uri);
    return content ? { uri: file.uri, content } : null;
  } catch {
    // A real cancel/dismiss from the native picker, not a genuine error --
    // silently treated as "nothing picked," the same convention this app
    // already applies to a cancelled Share sheet and a cancelled image
    // pick.
    return null;
  }
}

// Mirrors lib/isFileLinking.ts's own readIsFileContent exactly -- the
// current, class-based File API first, a real fallback to the legacy
// string-path API if that throws, null (never a thrown error) if both do.
export async function readBackupFileContent(uri: string): Promise<string | null> {
  try {
    const { File } = await import('expo-file-system');
    return await new File(uri).text();
  } catch (primaryError) {
    console.error('[dataBackup] Failed to read the backup file via the current File API', primaryError);
    try {
      const FileSystem = await import('expo-file-system/legacy');
      return await FileSystem.readAsStringAsync(uri);
    } catch (legacyError) {
      console.error('[dataBackup] Failed to read the backup file via the legacy API too', legacyError);
      return null;
    }
  }
}

// Defensive by design -- a malformed/truncated/foreign JSON file returns
// null rather than throwing, the same discipline lib/sharing.ts's own
// decodeShareEnvelope already holds to for exactly this reason (an
// external file should never be trusted blindly).
export function parseBackupEnvelope(content: string): BackupEnvelope | null {
  try {
    const parsed: unknown = JSON.parse(content);
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof (parsed as BackupEnvelope).schemaVersion === 'number' &&
      typeof (parsed as BackupEnvelope).exportedAt === 'string' &&
      (parsed as BackupEnvelope).tables &&
      typeof (parsed as BackupEnvelope).tables === 'object'
    ) {
      return parsed as BackupEnvelope;
    }
    return null;
  } catch {
    return null;
  }
}

// A real, deliberately destructive wipe-and-replace restore, not a merge
// -- this is a disaster-recovery/device-transfer tool with exactly one
// real owner, not a way to combine two devices' own data (that's the
// REAL, future cloud-sync system's own job, with its own real conflict
// resolution already designed separately). Every real caller must get an
// explicit, serious confirmation from the person before this ever runs --
// this function itself does not ask.
export async function restoreFromBackupEnvelope(envelope: BackupEnvelope): Promise<RestoreResult> {
  const db = await getDatabase();
  const liveTableNames = new Set(await getRealUserTableNames());
  const tablesSkipped: string[] = [];
  let tablesRestored = 0;
  let rowsRestored = 0;

  // A real, on-device-confirmed bug, not theoretical: this deletes and
  // reinserts every table's own rows in one pass, in whatever order
  // sqlite_master happens to return them (plain alphabetical -- see
  // getRealUserTableNames's own `ORDER BY name`), not a real dependency
  // order. With this app's own real FOREIGN KEY constraints enforced
  // (`PRAGMA foreign_keys = ON`, set once at startup in
  // runDatabaseInitialization), that alphabetical order genuinely doesn't
  // match the real parent/child relationships between tables -- confirmed
  // via a real "FOREIGN KEY constraint failed" restore failure on-device
  // 2026-08-16, and easy to see why: `garden_harvests` sorts alphabetically
  // BEFORE its own real parent `garden_plantings`, so a harvest row was
  // being reinserted before the planting it references existed again.
  //
  // Rather than hand-maintain a real topological table order (which would
  // reintroduce exactly the "must remember to update this every time a
  // table or FK changes" maintenance burden getRealUserTableNames() was
  // built specifically to avoid -- see this file's own header comment),
  // foreign key ENFORCEMENT is disabled for the real duration of this one
  // restore instead -- the standard, schema-agnostic technique for exactly
  // this bulk-reload situation, and the actual reason SQLite exposes this
  // pragma as toggleable at all.
  //
  // Two real SQLite constraints this has to respect, not just style
  // choices: `PRAGMA foreign_keys` is a real, documented no-op if changed
  // WHILE a transaction is already open, so it has to be set before BEGIN
  // TRANSACTION, not after; and it's connection-level state, not part of
  // the transaction itself, so a ROLLBACK on a real failure would NOT put
  // it back on its own -- the real try/finally below guarantees it's
  // always turned back on before this function returns, success or
  // failure, since the rest of this app depends on real FK enforcement
  // (cascading deletes, etc.) staying on for ordinary use.
  await db.execAsync('PRAGMA foreign_keys = OFF');
  try {
    await db.execAsync('BEGIN TRANSACTION');
    try {
      for (const [tableName, rows] of Object.entries(envelope.tables)) {
        if (!liveTableNames.has(tableName)) {
          // A real table the backup knows about that this app's CURRENT
          // schema no longer has -- an older backup, taken before some
          // future schema change. Skipped, not fatal to the rest of the
          // restore.
          tablesSkipped.push(tableName);
          continue;
        }

        const columnInfo = await db.getAllAsync<{ name: string }>(`PRAGMA table_info("${tableName}")`);
        const liveColumns = new Set(columnInfo.map((column) => column.name));

        await db.runAsync(`DELETE FROM "${tableName}"`);

        for (const row of rows) {
          // Only the real, current intersection of columns -- a column the
          // backup has that the live schema no longer does gets dropped; a
          // column the live schema has that this old row never carried
          // simply isn't in the INSERT at all, and SQLite fills it with
          // whatever real default that column's own migration already gave
          // it (or NULL).
          const columns = Object.keys(row).filter((column) => liveColumns.has(column));
          if (columns.length === 0) continue;
          const columnList = columns.map((column) => `"${column}"`).join(', ');
          const placeholders = columns.map(() => '?').join(', ');
          // A real column value coming out of JSON.parse is always a plain
          // string/number/boolean/null -- JSON has no native way to
          // represent the Uint8Array a BLOB column would otherwise need, and
          // none of this app's own local tables store one. Safe to assert
          // the shape SQLite's own bind params actually require.
          const values = columns.map((column) => row[column]) as SQLiteBindValue[];
          await db.runAsync(`INSERT INTO "${tableName}" (${columnList}) VALUES (${placeholders})`, values);
          rowsRestored += 1;
        }

        tablesRestored += 1;
      }

      // A real, direct check that the restored data is genuinely
      // self-consistent, not just assumed so because enforcement was off
      // during the reload -- foreign_key_check runs independent of that
      // pragma's on/off state and reports any real orphaned reference. A
      // backup taken from this app's own already-consistent live data
      // should always pass this cleanly; a genuine failure here would mean
      // the backup file itself carries real, broken references, worth
      // failing loudly on rather than silently keeping bad data.
      const violations = await db.getAllAsync<{ table: string }>('PRAGMA foreign_key_check');
      if (violations.length > 0) {
        throw new Error(
          `Restored data failed a real foreign-key consistency check (${violations.length} violation(s), e.g. table "${violations[0].table}"). Nothing was kept.`,
        );
      }

      await db.execAsync('COMMIT');
    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }
  } finally {
    await db.execAsync('PRAGMA foreign_keys = ON');
  }

  return { tablesRestored, rowsRestored, tablesSkipped };
}
