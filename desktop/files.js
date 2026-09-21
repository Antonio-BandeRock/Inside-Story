// Files for the desktop app. lib/desktop/fileSystemShim.ts stands in for
// expo-file-system's File, Directory and Paths, and every call it makes
// lands here over synchronous IPC (the phone API is synchronous too:
// File.exists, textSync(), write(), copy() all return in place, and
// lib/visualPreferences.ts reads two mirror files that way before the
// first render). URIs keep the phone's file:// shape, and the app's own
// folders are Documents/ and Cache/ under <userData>, beside SQLite/.
//
// Reads are allowed anywhere, since a picked image or a backup the person
// chose can live anywhere on the disk. Writes, deletes and moves are
// confined to the app's data folder, which is all the app ever asks for.

const fs = require('node:fs');
const path = require('node:path');
const { fileURLToPath, pathToFileURL } = require('node:url');

function folders(userDataPath) {
  const document = path.join(userDataPath, 'Documents');
  const cache = path.join(userDataPath, 'Cache');
  const sqlite = path.join(userDataPath, 'SQLite');
  for (const folder of [document, cache, sqlite]) {
    fs.mkdirSync(folder, { recursive: true });
  }
  return { document, cache, sqlite };
}

function toUri(file, isDirectory) {
  const url = pathToFileURL(file).href;
  return isDirectory && !url.endsWith('/') ? `${url}/` : url;
}

// Bare paths and file:// URIs both arrive here: lib/db.ts builds
// `file://<defaultDatabaseDirectory>/<name>` from a Windows path, which
// is not a well-formed URL, so anything that does not parse is treated as
// a path with its scheme stripped.
function toPath(uri) {
  if (typeof uri !== 'string' || uri.length === 0) {
    throw new Error('A file needs a location.');
  }
  if (uri.startsWith('file://')) {
    try {
      return path.normalize(fileURLToPath(uri));
    } catch {
      return path.normalize(decodeURIComponent(uri.replace(/^file:\/\/\/?/, '')));
    }
  }
  return path.normalize(uri);
}

function assertWritable(userDataPath, file) {
  const root = path.normalize(userDataPath + path.sep);
  if (!path.normalize(file + path.sep).startsWith(root) && path.normalize(file) !== path.normalize(userDataPath)) {
    throw new Error(`The desktop app only writes inside its data folder: ${file}`);
  }
}

function stat(uri) {
  const file = toPath(uri);
  try {
    const info = fs.statSync(file);
    return {
      exists: true,
      isDirectory: info.isDirectory(),
      size: info.size,
      modificationTime: info.mtimeMs,
      creationTime: info.birthtimeMs,
      uri: toUri(file, info.isDirectory()),
    };
  } catch {
    return { exists: false, isDirectory: false, size: 0, modificationTime: null, creationTime: null, uri: toUri(file, false) };
  }
}

function readText(uri) {
  return fs.readFileSync(toPath(uri), 'utf8');
}

function readBase64(uri) {
  return fs.readFileSync(toPath(uri)).toString('base64');
}

function writeText(userDataPath, uri, text) {
  const file = toPath(uri);
  assertWritable(userDataPath, file);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text, 'utf8');
}

function writeBase64(userDataPath, uri, base64) {
  const file = toPath(uri);
  assertWritable(userDataPath, file);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.from(base64, 'base64'));
}

function remove(userDataPath, uri) {
  const file = toPath(uri);
  assertWritable(userDataPath, file);
  fs.rmSync(file, { recursive: true, force: true });
}

function makeDirectory(userDataPath, uri, intermediates) {
  const folder = toPath(uri);
  assertWritable(userDataPath, folder);
  fs.mkdirSync(folder, { recursive: !!intermediates });
}

function list(uri) {
  const folder = toPath(uri);
  return fs.readdirSync(folder, { withFileTypes: true }).map((entry) => {
    const file = path.join(folder, entry.name);
    const isDirectory = entry.isDirectory();
    let info = null;
    try {
      info = fs.statSync(file);
    } catch {
      info = null;
    }
    return {
      name: entry.name,
      isDirectory,
      uri: toUri(file, isDirectory),
      size: info ? info.size : 0,
      modificationTime: info ? info.mtimeMs : null,
    };
  });
}

function copy(userDataPath, fromUri, toUriValue) {
  const from = toPath(fromUri);
  const to = toPath(toUriValue);
  assertWritable(userDataPath, to);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.cpSync(from, to, { recursive: true, force: true });
}

function move(userDataPath, fromUri, toUriValue) {
  const from = toPath(fromUri);
  const to = toPath(toUriValue);
  assertWritable(userDataPath, from);
  assertWritable(userDataPath, to);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.renameSync(from, to);
}

module.exports = {
  folders,
  toUri,
  stat,
  readText,
  readBase64,
  writeText,
  writeBase64,
  remove,
  makeDirectory,
  list,
  copy,
  move,
};
