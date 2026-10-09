// App Lock on the computer (1.0.60.7): the records kept sealed on disk.
//
// The phone encrypts its database with SQLCipher. node:sqlite, which the
// desktop app runs on, has no cipher, so here the whole file is sealed
// instead: AES-256-GCM over the bytes sqlite3_serialize hands back, written
// as <name>.sealed. Unlocking opens it into memory (sqlite.js), and every
// change is sealed back to disk shortly after it is made. Nothing plain is
// ever written while the lock is on.
//
// A sealed file is: MAGIC (8 bytes) | nonce (12) | tag (16) | ciphertext.
// The tag makes a wrong key fail rather than open as garbage.
//
// Turning the lock on and off moves the file one way or the other, and a
// kill at any point leaves the side that is still the truth in charge:
// while the lock is being turned on the plain file is the truth until it is
// deleted, which happens only after the sealed copy has opened with the key
// and matched it table by table; turning it off is the same the other way.
// planSealMove says which step comes next from what is on disk.
//
// No Electron here, so scripts/test_desktop_seal.js can run it under Node.

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const MAGIC = Buffer.from('ISSEAL01', 'ascii');
const NONCE_BYTES = 12;
const TAG_BYTES = 16;
const KEY_BYTES = 32;
const SIDE_FILES = ['-wal', '-shm', '-journal'];

class WrongKeyError extends Error {
  constructor() {
    super('The key did not open the sealed records.');
    this.name = 'WrongKeyError';
  }
}

function keyFromBase64(base64) {
  const key = Buffer.from(String(base64 || ''), 'base64');
  if (key.length !== KEY_BYTES) throw new Error('The key is the wrong length.');
  return key;
}

function sealedFile(file) {
  return `${file}.sealed`;
}

function encrypt(bytes, key) {
  const nonce = crypto.randomBytes(NONCE_BYTES);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce);
  const body = Buffer.concat([cipher.update(bytes), cipher.final()]);
  return Buffer.concat([MAGIC, nonce, cipher.getAuthTag(), body]);
}

function decrypt(sealed, key) {
  if (sealed.length < MAGIC.length + NONCE_BYTES + TAG_BYTES || !sealed.subarray(0, MAGIC.length).equals(MAGIC)) {
    throw new Error('This is not a sealed Lifestead file.');
  }
  let at = MAGIC.length;
  const nonce = sealed.subarray(at, (at += NONCE_BYTES));
  const tag = sealed.subarray(at, (at += TAG_BYTES));
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce);
  decipher.setAuthTag(tag);
  try {
    return Buffer.concat([decipher.update(sealed.subarray(at)), decipher.final()]);
  } catch {
    throw new WrongKeyError();
  }
}

/** Writes beside the target, flushes to disk, then renames over it, so a kill leaves the old file or the new one. */
function writeAtomic(file, bytes) {
  const temp = `${file}.writing`;
  const handle = fs.openSync(temp, 'w');
  try {
    fs.writeSync(handle, bytes);
    fs.fsyncSync(handle);
  } finally {
    fs.closeSync(handle);
  }
  fs.renameSync(temp, file);
}

function writeSealed(file, bytes, key) {
  writeAtomic(sealedFile(file), encrypt(bytes, key));
}

function readSealed(file, key) {
  return decrypt(fs.readFileSync(sealedFile(file)), key);
}

/** An in-memory database holding these bytes. */
function openBytes(bytes) {
  const db = new DatabaseSync(':memory:', { enableForeignKeyConstraints: false });
  db.deserialize(bytes);
  return db;
}

function deleteWithSideFiles(file) {
  for (const suffix of ['', ...SIDE_FILES, '.writing']) {
    fs.rmSync(file + suffix, { force: true });
  }
}

/** What is on disk for this database: the plain file, the sealed one, both or neither. */
function filesOnDisk(file) {
  return { plain: fs.existsSync(file), sealed: fs.existsSync(sealedFile(file)) };
}

/**
 * The next step of a move, from what is on disk. `direction` is 'seal'
 * (turning the lock on) or 'unseal' (turning it off).
 *  copy        the side that is the truth is copied across and checked
 *  finish      only the destination is left: check it opens, nothing to copy
 *  no-database neither file exists (a fresh install): nothing to move
 */
function planSealMove(direction, onDisk) {
  const source = direction === 'seal' ? onDisk.plain : onDisk.sealed;
  const target = direction === 'seal' ? onDisk.sealed : onDisk.plain;
  if (source) return 'copy';
  if (target) return 'finish';
  return 'no-database';
}

function tableCounts(db) {
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    .all()
    .map((row) => row.name);
  const counts = new Map();
  for (const table of tables) {
    const row = db.prepare(`SELECT count(*) AS n FROM "${table.replace(/"/g, '""')}"`).get();
    counts.set(table, Number(row.n));
  }
  return counts;
}

/** Tables whose row counts differ, at most three named. Empty when they match. */
function countMismatches(before, after) {
  const wrong = [];
  for (const [table, rows] of before) {
    if (after.get(table) !== rows) wrong.push(table);
  }
  for (const table of after.keys()) {
    if (!before.has(table)) wrong.push(table);
  }
  return wrong.slice(0, 3);
}

/** Bytes of the plain file as a connection sees them, which includes anything still in its -wal file. */
function plainBytes(file) {
  const db = new DatabaseSync(file, { enableForeignKeyConstraints: false });
  try {
    return db.serialize();
  } finally {
    db.close();
  }
}

function checkOpens(bytes) {
  const db = openBytes(bytes);
  try {
    db.prepare('SELECT count(*) AS n FROM sqlite_master').get();
  } finally {
    db.close();
  }
}

/**
 * Turns the lock on: seals the plain file, opens the sealed copy with the
 * key, compares every table, and only then deletes the plain file. The
 * caller has closed every connection to it. Safe to run again after a kill.
 */
function sealDatabase(file, key) {
  const step = planSealMove('seal', filesOnDisk(file));
  if (step === 'no-database') {
    // A fresh install: start the records sealed and empty, so the first
    // open after the lock is set up never makes a plain file.
    const empty = new DatabaseSync(':memory:');
    try {
      writeSealed(file, empty.serialize(), key);
    } finally {
      empty.close();
    }
    return { ok: true, step };
  }
  if (step === 'finish') {
    checkOpens(readSealed(file, key));
    return { ok: true, step };
  }
  const bytes = plainBytes(file);
  writeSealed(file, bytes, key);
  const before = openBytes(bytes);
  const after = openBytes(readSealed(file, key));
  try {
    const wrong = countMismatches(tableCounts(before), tableCounts(after));
    if (wrong.length) {
      fs.rmSync(sealedFile(file), { force: true });
      return { ok: false, problem: `The locked copy did not match in ${wrong.join(', ')}.` };
    }
  } finally {
    before.close();
    after.close();
  }
  deleteWithSideFiles(file);
  return { ok: true, step };
}

/**
 * Turns the lock off: writes the records back to a plain file, opens it,
 * compares every table with the sealed copy, and only then deletes the
 * sealed file. Safe to run again after a kill.
 */
function unsealDatabase(file, key) {
  const step = planSealMove('unseal', filesOnDisk(file));
  if (step === 'no-database') return { ok: true, step };
  if (step === 'finish') {
    checkOpens(plainBytes(file));
    return { ok: true, step };
  }
  const bytes = readSealed(file, key);
  deleteWithSideFiles(file);
  writeAtomic(file, bytes);
  const before = openBytes(bytes);
  const after = new DatabaseSync(file, { enableForeignKeyConstraints: false });
  try {
    const wrong = countMismatches(tableCounts(before), tableCounts(after));
    if (wrong.length) {
      after.close();
      deleteWithSideFiles(file);
      return { ok: false, problem: `The unlocked copy did not match in ${wrong.join(', ')}.` };
    }
  } finally {
    before.close();
    if (after.isOpen) after.close();
  }
  fs.rmSync(sealedFile(file), { force: true });
  fs.rmSync(`${sealedFile(file)}.writing`, { force: true });
  return { ok: true, step };
}

/**
 * Keeps the lock on after turning it off failed: the sealed file is still
 * the truth, so any plain copy the move left is deleted. False when there
 * is no sealed file to keep.
 */
function keepSealed(file) {
  if (!fs.existsSync(sealedFile(file))) return false;
  deleteWithSideFiles(file);
  return true;
}

/**
 * Backs out of a lock whose move never finished: the plain file is still
 * the truth, so any sealed copy is deleted. False when the plain file is
 * gone, since then the sealed one holds the records.
 */
function abandonSeal(file) {
  if (!fs.existsSync(file)) return false;
  fs.rmSync(sealedFile(file), { force: true });
  fs.rmSync(`${sealedFile(file)}.writing`, { force: true });
  return true;
}

/**
 * Moves a sealed file that no key here opens out of the way, renamed and
 * never deleted, so the records can start again from another copy
 * (1.0.60.15). Refused while a plain file sits beside it. Answers the new
 * file name, or null when it was refused.
 */
function setAsideSealed(file) {
  const from = sealedFile(file);
  if (fs.existsSync(file) || !fs.existsSync(from)) return null;
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..*$/, '').replace('T', '-');
  const to = `${from}.could-not-open-${stamp}`;
  fs.renameSync(from, to);
  fs.rmSync(`${from}.writing`, { force: true });
  return path.basename(to);
}

module.exports = {
  MAGIC,
  WrongKeyError,
  keyFromBase64,
  sealedFile,
  encrypt,
  decrypt,
  writeSealed,
  readSealed,
  openBytes,
  filesOnDisk,
  planSealMove,
  countMismatches,
  sealDatabase,
  unsealDatabase,
  keepSealed,
  abandonSeal,
  setAsideSealed,
};
