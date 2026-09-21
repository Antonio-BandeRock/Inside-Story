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

const STATEMENT_CACHE_LIMIT = 256;

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

function run(userDataPath, name, sql, params) {
  const result = statement(connection(userDataPath, name), sql).run(...bindArgs(params));
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
  connection(userDataPath, name).db.exec(sql);
}

function openDatabase(userDataPath, name) {
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
  for (const entry of open.values()) {
    try {
      entry.db.close();
    } catch {
      // Closing on the way out; nothing to do with a failure here.
    }
  }
  open.clear();
}

module.exports = { openDatabase, run, all, get, exec, importReference, closeAll };
