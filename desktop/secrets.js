// The desktop app's stand-in for the phone's keystore. Each value is
// encrypted with Electron's safeStorage (DPAPI on Windows, the Keychain
// on a Mac, so only this Windows account or this Mac user can read it
// back) and written to its own file under <userData>/secrets/, named by a
// hash of the key so the key itself is not on disk. lib/desktop/
// secureStoreShim.ts calls these three through the bridge.

const { safeStorage } = require('electron');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

function secretsFolder(userDataPath) {
  const folder = path.join(userDataPath, 'secrets');
  fs.mkdirSync(folder, { recursive: true });
  return folder;
}

function fileFor(userDataPath, key) {
  const name = crypto.createHash('sha256').update(key).digest('hex');
  return path.join(secretsFolder(userDataPath), `${name}.bin`);
}

function get(userDataPath, key) {
  const file = fileFor(userDataPath, key);
  if (!fs.existsSync(file)) {
    return null;
  }
  const bytes = fs.readFileSync(file);
  if (safeStorage.isEncryptionAvailable()) {
    return safeStorage.decryptString(bytes);
  }
  return bytes.toString('utf8');
}

function set(userDataPath, key, value) {
  const file = fileFor(userDataPath, key);
  const bytes = safeStorage.isEncryptionAvailable() ? safeStorage.encryptString(value) : Buffer.from(value, 'utf8');
  fs.writeFileSync(file, bytes);
}

function remove(userDataPath, key) {
  const file = fileFor(userDataPath, key);
  fs.rmSync(file, { force: true });
}

module.exports = { get, set, remove };
