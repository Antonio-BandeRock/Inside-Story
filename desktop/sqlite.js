// SQLite for the desktop app, in Electron's main process, on Node's
// built-in node:sqlite (Electron 44 carries Node 24, which has it without
// a flag: checked before choosing it, and it is why no native module and
// no compiler is needed to build the installer). lib/desktop/expoSqliteShim.ts
// is the other end: every runAsync/getAllAsync/getFirstAsync/execAsync the
// app makes arrives here over IPC with the database name, the SQL and the
// bind values, in the same shapes expo-sqlite accepts.
//
// Databases live in <userData>/SQLite/<name>, mirroring where expo-sqlite
// keeps them on a phone, so a future "where is my data" answer is the same
// folder name on both.

const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

const sealed = require('./sealedDb');

const STATEMENT_CACHE_LIMIT = 256;
// How long after a change the sealed copy is written (App Lock, 1.0.60.7).
// Short, since a crash loses whatever was not yet written.
const SEAL_DELAY_MS = 500;

/** @type {Map<string, { db: import('node:sqlite').DatabaseSync, statements: Map<string, any> }>} */
const open = new Map();

function databaseFolder(userDataPath) {
  const folder = path.join(userDataPath, 'SQLite');
  fs.mkdirSync(folder, { recursive: true });
  return folder;
}

function connection(userDataPath, name) {
  let entry = open.get(name);
  if (!entry) {
    const file = path.join(databaseFolder(userDataPath), name);
    // With App Lock on the records are in <name>.sealed and open only with
    // the key (unlock below). Opening the bare name here would make an
    // empty plain file beside them, so it is refused instead.
    if (fs.existsSync(sealed.sealedFile(file))) {
      throw new Error('Lifestead is locked.');
    }
    // Foreign keys are left to the app: lib/db.ts turns them on with a
    // PRAGMA at startup and lib/dataBackup.ts turns them off around a
    // restore, and node:sqlite's default of enforcing them would make the
    // restore's OFF a no-op mid-connection.
    const db = new DatabaseSync(file, { enableForeignKeyConstraints: false });
    entry = { db, statements: new Map() };
    open.set(name, entry);
  }
  return entry;
}

function statement(entry, sql) {
  let prepared = entry.statements.get(sql);
  if (!prepared) {
    prepared = entry.db.prepare(sql);
    if (entry.statements.size >= STATEMENT_CACHE_LIMIT) {
      const oldest = entry.statements.keys().next().value;
      entry.statements.delete(oldest);
    }
    entry.statements.set(sql, prepared);
  }
  return prepared;
}

// expo-sqlite binds booleans as 1 and 0 and undefined as NULL; node:sqlite
// refuses both, so they are converted before binding. Named parameters
// arrive as one object whose keys carry their prefix ($name, :name,
// @name), which node:sqlite accepts as is.
function bindValue(value) {
  if (value === undefined) return null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  return value;
}

function bindArgs(params) {
  if (Array.isArray(params)) {
    return params.map(bindValue);
  }
  if (params && typeof params === 'object') {
    const named = {};
    for (const [key, value] of Object.entries(params)) {
      named[key] = bindValue(value);
    }
    return [named];
  }
  return [];
}

// ---------------------------------------------------------------------------
// App Lock: a sealed database lives in memory and is written back sealed.

function writeSealedNow(entry) {
  if (entry.timer) {
    clearTimeout(entry.timer);
    entry.timer = null;
  }
  if (!entry.dirty) return;
  // A transaction still open would seal half of it; wait for it to end.
  if (entry.db.isTransaction) {
    scheduleSeal(entry);
    return;
  }
  sealed.writeSealed(entry.sealed.file, entry.db.serialize(), entry.sealed.key);
  entry.dirty = false;
}

function scheduleSeal(entry) {
  if (entry.timer) return;
  entry.timer = setTimeout(() => {
    entry.timer = null;
    try {
      writeSealedNow(entry);
    } catch (error) {
      console.error('[sqlite] the sealed copy could not be written', error);
      scheduleSeal(entry);
    }
  }, SEAL_DELAY_MS);
}

function changed(entry) {
  if (!entry.sealed) return;
  entry.dirty = true;
  scheduleSeal(entry);
}

/** Opens a sealed database with its key. A wrong key throws and opens nothing. */
function unlock(userDataPath, name, keyBase64) {
  const existing = open.get(name);
  if (existing && existing.sealed) return;
  const file = path.join(databaseFolder(userDataPath), name);
  if (!fs.existsSync(sealed.sealedFile(file))) {
    throw new Error('There are no sealed records to open.');
  }
  const key = sealed.keyFromBase64(keyBase64);
  const db = sealed.openBytes(sealed.readSealed(file, key));
  open.set(name, { db, statements: new Map(), sealed: { file, key }, dirty: false, timer: null });
}

/** Writes a sealed database back and closes it, which drops its key. A plain one stays open. */
function close(name) {
  const entry = open.get(name);
  if (!entry || !entry.sealed) return;
  try {
    writeSealedNow(entry);
  } finally {
    if (entry.timer) clearTimeout(entry.timer);
    entry.db.close();
    entry.sealed.key.fill(0);
    open.delete(name);
  }
}

/** Closes every sealed database: the app is reloading, which is how it locks. */
function closeSealed() {
  for (const [name, entry] of [...open.entries()]) {
    if (!entry.sealed) continue;
    try {
      close(name);
    } catch (error) {
      console.error('[sqlite] a sealed database did not close cleanly', error);
    }
  }
}

/** Closes a plain connection so its file can be moved. */
function closePlain(name) {
  const entry = open.get(name);
  if (!entry || entry.sealed) return;
  entry.db.close();
  open.delete(name);
}

/** Turns the lock on for this database (sealedDb.sealDatabase). */
function seal(userDataPath, name, keyBase64) {
  closePlain(name);
  const key = sealed.keyFromBase64(keyBase64);
  try {
    return sealed.sealDatabase(path.join(databaseFolder(userDataPath), name), key);
  } finally {
    key.fill(0);
  }
}

/** Turns the lock off for this database (sealedDb.unsealDatabase). */
function unseal(userDataPath, name, keyBase64) {
  close(name);
  const key = sealed.keyFromBase64(keyBase64);
  try {
    return sealed.unsealDatabase(path.join(databaseFolder(userDataPath), name), key);
  } finally {
    key.fill(0);
  }
}

function keepSealed(userDataPath, name) {
  return sealed.keepSealed(path.join(databaseFolder(userDataPath), name));
}

function abandonSeal(userDataPath, name) {
  return sealed.abandonSeal(path.join(databaseFolder(userDataPath), name));
}

/** Renames a sealed file no key here opens, so the records can start again (sealedDb.setAsideSealed). */
function setAsideSealed(userDataPath, name) {
  close(name);
  return sealed.setAsideSealed(path.join(databaseFolder(userDataPath), name));
}

/** Which files are on disk: the plain one, the sealed one, both or neither. */
function filesOnDisk(userDataPath, name) {
  return sealed.filesOnDisk(path.join(databaseFolder(userDataPath), name));
}

function run(userDataPath, name, sql, params) {
  const entry = connection(userDataPath, name);
  const result = statement(entry, sql).run(...bindArgs(params));
  if (result.changes) changed(entry);
  return { changes: Number(result.changes), lastInsertRowId: Number(result.lastInsertRowid) };
}

function all(userDataPath, name, sql, params) {
  return statement(connection(userDataPath, name), sql).all(...bindArgs(params));
}

function get(userDataPath, name, sql, params) {
  const row = statement(connection(userDataPath, name), sql).get(...bindArgs(params));
  return row === undefined ? null : row;
}

function exec(userDataPath, name, sql) {
  const entry = connection(userDataPath, name);
  entry.db.exec(sql);
  changed(entry);
}

function openDatabase(userDataPath, name) {
  // A sealed database waits for its key (unlock), which lib/db.ts sends
  // straight after opening, the way SQLCipher takes PRAGMA key.
  const file = path.join(databaseFolder(userDataPath), name);
  if (!open.has(name) && fs.existsSync(sealed.sealedFile(file))) return;
  connection(userDataPath, name);
}

/**
 * The reference database ships beside the app rather than inside the
 * bundle. It is copied into the SQLite folder when there is no copy yet
 * or when the shipped file differs from the one copied last time (its
 * size and modification time are written to a marker file next to the
 * copy), so the person's flags in it survive a relaunch and an upgrade
 * still brings the new data. Any open connection to it is closed first.
 */
function importReference(userDataPath, name, shippedFile) {
  const folder = databaseFolder(userDataPath);
  const target = path.join(folder, name);
  const marker = `${target}.source.json`;
  const stat = fs.statSync(shippedFile);
  const signature = JSON.stringify({ size: stat.size, mtimeMs: stat.mtimeMs });
  let previous = null;
  try {
    previous = fs.readFileSync(marker, 'utf8');
  } catch {
    previous = null;
  }
  if (previous === signature && fs.existsSync(target)) {
    return false;
  }
  const entry = open.get(name);
  if (entry) {
    entry.db.close();
    open.delete(name);
  }
  fs.copyFileSync(shippedFile, target);
  fs.writeFileSync(marker, signature);
  return true;
}

function closeAll() {
  closeSealed();
  for (const entry of open.values()) {
    try {
      entry.db.close();
    } catch {
      // Closing on the way out; nothing to do with a failure here.
    }
  }
  open.clear();
}

module.exports = {
  openDatabase,
  run,
  all,
  get,
  exec,
  importReference,
  closeAll,
  unlock,
  close,
  closeSealed,
  seal,
  unseal,
  keepSealed,
  abandonSeal,
  setAsideSealed,
  filesOnDisk,
};
