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
// confined to the app's data folder, which is all the app ever asks for,
// with one exception: saveAs copies a file to wherever the person chose
// in the operating system's save dialog, since choosing the place is the
// permission.
//
// pick and saveAs are the two dialogs (1.0.42.27). The phone's
// File.pickFileAsync opens the system file browser, and expo-sharing's
// share sheet is how an exported backup or a report leaves the phone; on
// a computer those are an Open dialog and a Save As dialog.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { fileURLToPath, pathToFileURL } = require('node:url');
const { dialog } = require('electron');

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

// Electron's dialog filters, from the MIME type the app asks for. A type
// not listed here shows every file, which is what the phone's picker does
// with no filter.
function filtersFor(mimeType) {
  const known = {
    'application/json': { name: 'Inside Story backups', extensions: ['json'] },
    'application/pdf': { name: 'PDF documents', extensions: ['pdf'] },
  };
  const filters = [];
  if (mimeType && known[mimeType]) filters.push(known[mimeType]);
  filters.push({ name: 'All files', extensions: ['*'] });
  return filters;
}

async function showDialog(getWindow, kind, options) {
  const window = getWindow();
  const show = kind === 'save' ? dialog.showSaveDialog : dialog.showOpenDialog;
  return window ? show(window, options) : show(options);
}

// The operating system's Open dialog. Answers the chosen file's URI and
// name, or null when the dialog was closed without a choice.
async function pick(getWindow, options) {
  const settings = {
    title: (options && options.title) || 'Choose a file',
    buttonLabel: 'Open',
    properties: ['openFile'],
    filters: filtersFor(options && options.mimeType),
  };
  if (options && typeof options.defaultPath === 'string' && options.defaultPath.length > 0) {
    settings.defaultPath = toPath(options.defaultPath); // a file:// URI or a bare path
  }
  const result = await showDialog(getWindow, 'open', settings);
  if (result.canceled || result.filePaths.length === 0) return null;
  const file = path.normalize(result.filePaths[0]);
  return { uri: toUri(file, false), name: path.basename(file) };
}

// The operating system's Save As dialog, then a copy of the file to the
// place chosen. Answers the destination path, or null when the dialog was
// closed without a choice. The source can be anywhere the app can read
// (its cache, where a backup or a report is written first).
async function saveAs(getWindow, sourceUri, options) {
  const source = toPath(sourceUri);
  if (!fs.existsSync(source) || fs.statSync(source).isDirectory()) {
    throw new Error(`There is no file to save at ${source}`);
  }
  const settings = {
    title: (options && options.title) || 'Save a copy',
    buttonLabel: 'Save',
    defaultPath: path.join(os.homedir(), (options && options.fileName) || path.basename(source)),
    filters: filtersFor(options && options.mimeType),
    properties: ['createDirectory', 'showOverwriteConfirmation'],
  };
  const result = await showDialog(getWindow, 'save', settings);
  if (result.canceled || !result.filePath) return null;
  const destination = path.normalize(result.filePath);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
  return destination;
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
  pick,
  saveAs,
};
