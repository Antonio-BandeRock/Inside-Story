// App Lock on the computer (1.0.60.7): the sealed records file
// (desktop/sealedDb.js), the connection layer that opens it into memory
// (desktop/sqlite.js), and the wiring from the app down to both.
//
//   node scripts/test_desktop_seal.js
//
// Runs on plain Node (24 or later, for node:sqlite); nothing needs Electron.
// Windows Hello itself cannot be exercised without a person at the PC, so
// desktop/hello.js gets static checks only.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const root = path.join(__dirname, '..');
const sealed = require(path.join(root, 'desktop', 'sealedDb.js'));
const sqlite = require(path.join(root, 'desktop', 'sqlite.js'));

let passed = 0;
let failed = 0;
function check(label, ok) {
  if (ok) passed++;
  else {
    failed++;
    console.log('FAIL', label);
  }
}
function throws(fn) {
  try {
    fn();
    return null;
  } catch (error) {
    return error;
  }
}
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8').replace(/\r\n/g, '\n');

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'is-seal-'));
const newKey = () => crypto.randomBytes(32);

function makePlain(file, rows) {
  const db = new DatabaseSync(file);
  db.exec('CREATE TABLE meals (id INTEGER PRIMARY KEY, name TEXT); CREATE TABLE notes (id INTEGER PRIMARY KEY, body TEXT);');
  const insert = db.prepare('INSERT INTO meals (name) VALUES (?)');
  for (let i = 0; i < rows; i++) insert.run(`meal ${i}`);
  db.prepare('INSERT INTO notes (body) VALUES (?)').run('private note');
  db.close();
}

async function main() {
  // --- encrypt and decrypt -------------------------------------------------
  {
    const key = newKey();
    const bytes = Buffer.from('some records');
    const box = sealed.encrypt(bytes, key);
    check('a sealed file starts with the marker', box.subarray(0, 8).toString() === 'ISSEAL01');
    check('the records are not readable in the sealed bytes', !box.includes(bytes));
    check('the right key opens it', Buffer.from(sealed.decrypt(box, key)).equals(bytes));
    const wrong = throws(() => sealed.decrypt(box, newKey()));
    check('a wrong key is refused as a wrong key', wrong instanceof sealed.WrongKeyError);
    const tampered = Buffer.from(box);
    tampered[tampered.length - 1] ^= 1;
    check('a changed byte is refused', throws(() => sealed.decrypt(tampered, key)) !== null);
    check('two seals of the same bytes differ (fresh nonce)', !sealed.encrypt(bytes, key).equals(box));
    check('keyFromBase64 refuses a short key', throws(() => sealed.keyFromBase64(Buffer.alloc(16).toString('base64'))) !== null);
    check('keyFromBase64 takes 32 bytes', sealed.keyFromBase64(key.toString('base64')).length === 32);
  }

  // --- planSealMove --------------------------------------------------------
  {
    const p = sealed.planSealMove;
    check('seal: plain only is copy', p('seal', { plain: true, sealed: false }) === 'copy');
    check('seal: both is copy (plain is still the truth)', p('seal', { plain: true, sealed: true }) === 'copy');
    check('seal: sealed only is finish', p('seal', { plain: false, sealed: true }) === 'finish');
    check('seal: neither is no-database', p('seal', { plain: false, sealed: false }) === 'no-database');
    check('unseal: sealed only is copy', p('unseal', { plain: false, sealed: true }) === 'copy');
    check('unseal: both is copy (sealed is still the truth)', p('unseal', { plain: true, sealed: true }) === 'copy');
    check('unseal: plain only is finish', p('unseal', { plain: true, sealed: false }) === 'finish');
    check('unseal: neither is no-database', p('unseal', { plain: false, sealed: false }) === 'no-database');
  }

  // --- countMismatches -----------------------------------------------------
  {
    const m = sealed.countMismatches;
    const a = new Map([['meals', 3], ['notes', 1]]);
    check('equal counts match', m(a, new Map(a)).length === 0);
    check('a differing table is named', m(a, new Map([['meals', 2], ['notes', 1]]))[0] === 'meals');
    check('a missing table is named', m(a, new Map([['meals', 3]])).includes('notes'));
    check('an extra table is named', m(a, new Map([...a, ['extra', 0]])).includes('extra'));
    const many = new Map([['a', 1], ['b', 1], ['c', 1], ['d', 1]]);
    check('at most three are named', m(many, new Map()).length === 3);
  }

  // --- sealDatabase and unsealDatabase round trip --------------------------
  {
    const file = path.join(temp, 'round.db');
    makePlain(file, 50);
    const key = newKey();
    const result = sealed.sealDatabase(file, key);
    check('sealing a plain file copies it', result.ok && result.step === 'copy');
    check('the plain file is gone after sealing', !fs.existsSync(file));
    check('the sealed file is there', fs.existsSync(sealed.sealedFile(file)));
    const raw = fs.readFileSync(sealed.sealedFile(file));
    check('no table name shows in the sealed file', !raw.includes(Buffer.from('private note')) && !raw.includes(Buffer.from('CREATE TABLE')));
    const again = sealed.sealDatabase(file, key);
    check('sealing again after it finished is finish', again.ok && again.step === 'finish');
    const opened = sealed.openBytes(sealed.readSealed(file, key));
    check('the sealed copy holds every row', opened.prepare('SELECT count(*) AS n FROM meals').get().n === 50);
    opened.close();
    check('a wrong key will not open the sealed file', throws(() => sealed.readSealed(file, newKey())) instanceof sealed.WrongKeyError);
    const back = sealed.unsealDatabase(file, key);
    check('unsealing copies it back', back.ok && back.step === 'copy');
    check('the sealed file is gone after unsealing', !fs.existsSync(sealed.sealedFile(file)));
    const plain = new DatabaseSync(file);
    check('the plain copy holds every row', plain.prepare('SELECT count(*) AS n FROM meals').get().n === 50);
    check('the plain copy holds the note', plain.prepare('SELECT body FROM notes').get().body === 'private note');
    plain.close();
    const finish = sealed.unsealDatabase(file, key);
    check('unsealing again after it finished is finish', finish.ok && finish.step === 'finish');
  }

  // --- a wrong key during unseal leaves the sealed file alone --------------
  {
    const file = path.join(temp, 'wrongkey.db');
    makePlain(file, 3);
    const key = newKey();
    sealed.sealDatabase(file, key);
    const error = throws(() => sealed.unsealDatabase(file, newKey()));
    check('unsealing with a wrong key throws', error instanceof sealed.WrongKeyError);
    check('the sealed file survives a wrong key', fs.existsSync(sealed.sealedFile(file)));
    check('no plain file is left by a wrong key', !fs.existsSync(file));
  }

  // --- a fresh install: no database at all ---------------------------------
  {
    const file = path.join(temp, 'fresh.db');
    const key = newKey();
    const result = sealed.sealDatabase(file, key);
    check('sealing with no database says so', result.ok && result.step === 'no-database');
    check('an empty sealed file is made so no plain file ever appears', fs.existsSync(sealed.sealedFile(file)));
    check('no plain file is made', !fs.existsSync(file));
    const db = sealed.openBytes(sealed.readSealed(file, key));
    db.exec('CREATE TABLE t (x)');
    check('the empty sealed database opens and takes tables', db.prepare('SELECT count(*) AS n FROM t').get().n === 0);
    db.close();
    const none = path.join(temp, 'none.db');
    check('unsealing with no database is no-database', sealed.unsealDatabase(none, key).step === 'no-database');
  }

  // --- keepSealed and abandonSeal ------------------------------------------
  {
    const file = path.join(temp, 'keep.db');
    makePlain(file, 2);
    const key = newKey();
    sealed.sealDatabase(file, key);
    fs.writeFileSync(file, 'half a copy');
    check('keepSealed keeps the lock', sealed.keepSealed(file) === true);
    check('keepSealed deletes the partial plain copy', !fs.existsSync(file));
    check('keepSealed leaves the sealed file', fs.existsSync(sealed.sealedFile(file)));
    const lone = path.join(temp, 'lone.db');
    check('keepSealed with nothing sealed is false', sealed.keepSealed(lone) === false);

    const file2 = path.join(temp, 'abandon.db');
    makePlain(file2, 2);
    fs.writeFileSync(sealed.sealedFile(file2), 'half a seal');
    check('abandonSeal backs out', sealed.abandonSeal(file2) === true);
    check('abandonSeal removes the sealed copy', !fs.existsSync(sealed.sealedFile(file2)));
    check('abandonSeal keeps the plain file', fs.existsSync(file2));
    fs.rmSync(file2);
    fs.writeFileSync(sealed.sealedFile(file2), 'records');
    check('abandonSeal refuses when only the sealed file is left', sealed.abandonSeal(file2) === false);
    check('and leaves that sealed file alone', fs.existsSync(sealed.sealedFile(file2)));

    // setAsideSealed (1.0.60.15): renames, never deletes, never beside a plain file.
    const before = fs.readFileSync(sealed.sealedFile(file2));
    const asideName = sealed.setAsideSealed(file2);
    check('setAsideSealed answers the new name', typeof asideName === 'string' && asideName.includes('.could-not-open-'));
    check('setAsideSealed moves the sealed file out of the way', !fs.existsSync(sealed.sealedFile(file2)));
    check('and keeps every byte of it', asideName !== null && fs.readFileSync(path.join(temp, asideName)).equals(before));
    check('setAsideSealed refuses with nothing sealed', sealed.setAsideSealed(file2) === null);
    makePlain(file2, 1);
    fs.writeFileSync(sealed.sealedFile(file2), 'records');
    check('setAsideSealed refuses beside a plain file', sealed.setAsideSealed(file2) === null);
    check('and leaves both files alone', fs.existsSync(file2) && fs.existsSync(sealed.sealedFile(file2)));
  }

  // --- sqlite.js: locked, unlock, write back -------------------------------
  {
    const userData = path.join(temp, 'userdata');
    const name = 'app.db';
    const key = newKey();
    const b64 = key.toString('base64');
    sqlite.exec(userData, name, 'CREATE TABLE meals (id INTEGER PRIMARY KEY, name TEXT)');
    sqlite.run(userData, name, 'INSERT INTO meals (name) VALUES (?)', ['soup']);
    const sealResult = sqlite.seal(userData, name, b64);
    check('sqlite.seal closes the plain connection and seals', sealResult.ok && sealResult.step === 'copy');
    check('filesOnDisk reports sealed only', JSON.stringify(sqlite.filesOnDisk(userData, name)) === '{"plain":false,"sealed":true}');
    const locked = throws(() => sqlite.all(userData, name, 'SELECT * FROM meals'));
    check('a locked database refuses a read', locked && /locked/.test(locked.message));
    check('the refusal made no plain file', !sqlite.filesOnDisk(userData, name).plain);
    check('a wrong key will not unlock', throws(() => sqlite.unlock(userData, name, newKey().toString('base64'))) !== null);
    check('a wrong key opens nothing', throws(() => sqlite.all(userData, name, 'SELECT * FROM meals')) !== null);
    sqlite.unlock(userData, name, b64);
    check('unlocked, the rows read', sqlite.all(userData, name, 'SELECT name FROM meals')[0].name === 'soup');
    sqlite.run(userData, name, 'INSERT INTO meals (name) VALUES (?)', ['stew']);
    check('the write did not make a plain file', !sqlite.filesOnDisk(userData, name).plain);
    await new Promise((resolve) => setTimeout(resolve, 900));
    const afterDelay = sealed.openBytes(sealed.readSealed(path.join(userData, 'SQLite', name), key));
    check('a change is sealed to disk within a second', afterDelay.prepare('SELECT count(*) AS n FROM meals').get().n === 2);
    afterDelay.close();
    sqlite.run(userData, name, 'INSERT INTO meals (name) VALUES (?)', ['salad']);
    sqlite.close(name);
    const afterClose = sealed.openBytes(sealed.readSealed(path.join(userData, 'SQLite', name), key));
    check('closing writes the last change back', afterClose.prepare('SELECT count(*) AS n FROM meals').get().n === 3);
    afterClose.close();
    check('closed again, reads are refused', throws(() => sqlite.all(userData, name, 'SELECT * FROM meals')) !== null);
    sqlite.unlock(userData, name, b64);
    sqlite.closeSealed();
    check('closeSealed locks every sealed database', throws(() => sqlite.all(userData, name, 'SELECT * FROM meals')) !== null);
    const off = sqlite.unseal(userData, name, b64);
    check('sqlite.unseal turns the lock off', off.ok && JSON.stringify(sqlite.filesOnDisk(userData, name)) === '{"plain":true,"sealed":false}');
    check('the plain file reads after turning off', sqlite.all(userData, name, 'SELECT count(*) AS n FROM meals')[0].n === 3);
    sqlite.closeAll();
  }

  // --- static wiring -------------------------------------------------------
  {
    const main = read('desktop/main.js');
    for (const channel of ['sqlite:unlock', 'sqlite:close', 'sqlite:seal', 'sqlite:unseal', 'sqlite:keepSealed', 'sqlite:abandonSeal', 'sqlite:filesOnDisk', 'hello:available', 'hello:wrapKey', 'hello:unwrapKey', 'hello:remove']) {
      check(`main.js handles ${channel}`, main.includes(`ipcMain.handle('${channel}'`));
    }
    check('main.js closes sealed records when the page reloads', main.includes("on('did-start-loading', () => sqlite.closeSealed())"));
    check('main.js closes sealed records when the page crashes', main.includes("on('render-process-gone', () => sqlite.closeSealed())"));
    const preload = read('desktop/preload.js');
    for (const channel of ['sqlite:unlock', 'sqlite:close', 'sqlite:seal', 'sqlite:unseal', 'sqlite:keepSealed', 'sqlite:abandonSeal', 'sqlite:filesOnDisk', 'hello:available', 'hello:wrapKey', 'hello:unwrapKey', 'hello:remove']) {
      check(`preload exposes ${channel}`, preload.includes(`'${channel}'`));
    }
    const builder = read('desktop/electron-builder.yml');
    check('the installer carries sealedDb.js', /^\s*- sealedDb\.js$/m.test(builder));
    check('the installer carries hello.js', /^\s*- hello\.js$/m.test(builder));
    const shim = read('lib/desktop/expoSqliteShim.ts');
    check('the shim turns the key statement into unlock', shim.includes('KEY_PRAGMA') && shim.includes('getDesktopBridge().sqlite.unlock'));
    check('the shim closes through the bridge', shim.includes('sqlite.close?.('));
    // lib/appLock.ts keyPragma writes PRAGMA key = "x'<hex>'"; with lowercase hex.
    const appLock = read('lib/appLock.ts');
    const shimPattern = new RegExp(shim.match(/const KEY_PRAGMA = \/(.*)\/;/)[1]);
    const sample = `PRAGMA key = "x'${crypto.randomBytes(32).toString('hex')}'";`;
    check('keyPragma writes PRAGMA key = "x\'<hex>\'"', appLock.includes('return `PRAGMA ${target}key = "x\'${keyToHex(key)}\'";`'));
    check('keyToHex writes lowercase hex', appLock.includes("byte.toString(16).padStart(2, '0')"));
    check('the shim matches what keyPragma writes', shimPattern.test(sample));
    const device = read('lib/appLockDevice.ts');
    check('turning on seals on the computer', device.includes('desktopSealing().seal(DB_NAME'));
    check('turning off unseals on the computer', device.includes('desktopSealing().unseal(DB_NAME'));
    check('keeping the lock calls keepSealed', device.includes('desktopSealing().keepSealed(DB_NAME)'));
    check('backing out calls abandonSeal', device.includes('desktopSealing().abandonSeal(DB_NAME)'));
    check('Windows Hello wraps the key', device.includes('hello.wrapKey(keyToBase64(dataKey))'));
    check('Windows Hello unwraps the key', device.includes('hello.unwrapKey(stored)'));
    check('the Hello key goes when the lock goes', /async function finishTurningOff[\s\S]*?removeHelloKey\(\)/.test(device));
    const session = read('lib/appLockSession.ts');
    check('the lock state is read on the computer too', !/isDesktopApp\(\)\)\s*return null/.test(session));
    const settings = read('components/AppLockSettings.tsx');
    check('Profile no longer says App Lock is phone only', !settings.includes('on the phone for now'));
    check('the screenshots choice is hidden on the computer', /isDesktopApp\(\) \? null : \(\s*<>\s*<Text style=\{styles\.subLabel\}>Screenshots/.test(settings));
    const hello = read('desktop/hello.js');
    check('Hello goes through the published KeyCredentialManager', hello.includes('KeyCredentialManager'));
    check('Hello scripts are passed encoded, not over stdin', hello.includes("'-EncodedCommand'"));
    check('Hello is off on a Mac', hello.includes("process.platform !== 'win32'"));
    for (const file of ['components/AppLockGate.tsx', 'components/ConfirmItsYou.tsx', 'app/app-lock-setup.tsx']) {
      check(`${file} names the button by device`, !read(file).includes('Use Fingerprint or Face'));
    }
  }

  fs.rmSync(temp, { recursive: true, force: true });
  console.log(`${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
