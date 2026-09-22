// The shared folder on a computer: a folder on the disk that OneDrive
// keeps in step with the cloud, read and written like any other folder.
//
// On a phone the app reaches OneDrive through Microsoft Graph, with a
// sign-in of its own, because Android's OneDrive provider will not let an
// app pick a folder (lib/oneDriveAuth.ts has the whole account). On a
// computer none of that is needed: the OneDrive client is already signed
// in, already syncing, and the folder it keeps is right there on the disk
// (C:\Users\<name>\OneDrive on Windows, ~/Library/CloudStorage/OneDrive-*
// on a Mac). So lib/desktop/cloudFolder.ts answers every call
// lib/oneDriveGraph.ts would have sent to Graph from here instead, and
// the OneDrive client carries the bytes. No sign-in, no token, no
// redirect that had nowhere to land (the 2026-09-21 report: the sign-in
// "kept waiting and waiting and never completed", because the redirect
// goes to hashimotosapp://, which nothing on a PC is registered for).
//
// A folder is addressed by its absolute path, which is what the app
// stores as the itemId of a DriveItemRef whose driveId is 'disk'.
//
// WRITES ARE CONFINED. Reads go anywhere, since a folder the person picked
// can be anywhere. Writes, deletes and moves are allowed inside a detected
// cloud root, inside the person's home folder (which is where every
// sync client keeps its folder), and inside any folder picked through the
// dialog in this run. The app only ever writes inside the one folder that
// was chosen, and this is the line that keeps a mistake in the app from
// reaching the rest of the disk.
//
// A FILE IS WRITTEN WHOLE. A mailbox file or a backup is written to a
// temporary name beside its final one and renamed into place, so the
// OneDrive client never uploads a half-written file: it sees the old one,
// then the new one, never something in between.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { dialog } = require('electron');

/** A file being written, beside its final name until the rename. */
const TEMP_SUFFIX = '.inside-story-writing';

/** Folders picked through the dialog in this run, so writes into them are allowed. */
const pickedThisRun = new Set();

function normalizeFolder(folder) {
  return path.normalize(path.resolve(folder)).replace(/[\\/]+$/, '');
}

function isInside(folder, root) {
  const normalizedRoot = normalizeFolder(root);
  const normalized = normalizeFolder(folder);
  if (normalized === normalizedRoot) return true;
  return normalized.startsWith(normalizedRoot + path.sep);
}

/**
 * The OneDrive folders on this computer, each named as its folder is
 * ("OneDrive", "OneDrive - Contoso"), so a work account and a personal one
 * read apart. Windows sets OneDrive, OneDriveConsumer and OneDriveCommercial
 * in the environment; a Mac keeps them under ~/Library/CloudStorage.
 */
function roots() {
  const candidates = [];
  for (const key of ['OneDriveConsumer', 'OneDrive', 'OneDriveCommercial']) {
    if (process.env[key]) candidates.push(process.env[key]);
  }
  const home = os.homedir();
  candidates.push(path.join(home, 'OneDrive'));
  const cloudStorage = path.join(home, 'Library', 'CloudStorage');
  try {
    for (const entry of fs.readdirSync(cloudStorage, { withFileTypes: true })) {
      if (entry.isDirectory() && entry.name.startsWith('OneDrive')) {
        candidates.push(path.join(cloudStorage, entry.name));
      }
    }
  } catch {
    // No CloudStorage folder: not a Mac, or OneDrive is not installed.
  }
  try {
    for (const entry of fs.readdirSync(home, { withFileTypes: true })) {
      if (entry.isDirectory() && entry.name.startsWith('OneDrive')) {
        candidates.push(path.join(home, entry.name));
      }
    }
  } catch {
    // A home folder that cannot be listed leaves the environment's answer.
  }

  const seen = new Set();
  const found = [];
  for (const candidate of candidates) {
    const folder = normalizeFolder(candidate);
    const key = process.platform === 'win32' ? folder.toLowerCase() : folder;
    if (seen.has(key)) continue;
    seen.add(key);
    try {
      if (fs.statSync(folder).isDirectory()) {
        found.push({ name: path.basename(folder), path: folder });
      }
    } catch {
      // Named in the environment but not on the disk: not a root.
    }
  }
  return found;
}

function assertWritable(folder) {
  const target = normalizeFolder(folder);
  const allowed = [...roots().map((root) => root.path), os.homedir(), ...pickedThisRun];
  if (allowed.some((root) => isInside(target, root))) return;
  throw new Error('The desktop app only writes inside your OneDrive or home folder: ' + target);
}

/** A file name has to be one name, never a path into somewhere else. */
function assertFileName(fileName) {
  if (typeof fileName !== 'string' || fileName.length === 0) {
    throw new Error('A file needs a name.');
  }
  if (fileName !== path.basename(fileName) || fileName === '.' || fileName === '..') {
    throw new Error('That is not a file name: ' + fileName);
  }
}

async function pickFolder(getWindow, defaultPath) {
  const options = {
    title: 'Choose your shared folder',
    buttonLabel: 'Use This Folder',
    properties: ['openDirectory', 'createDirectory'],
  };
  if (typeof defaultPath === 'string' && defaultPath.length > 0) {
    options.defaultPath = defaultPath;
  }
  const window = getWindow();
  const result = window ? await dialog.showOpenDialog(window, options) : await dialog.showOpenDialog(options);
  if (result.canceled || result.filePaths.length === 0) return null;
  const folder = normalizeFolder(result.filePaths[0]);
  pickedThisRun.add(folder);
  return folder;
}

function stat(folder) {
  const target = normalizeFolder(folder);
  try {
    const info = fs.statSync(target);
    return { exists: true, isDirectory: info.isDirectory(), name: path.basename(target), path: target };
  } catch {
    return { exists: false, isDirectory: false, name: path.basename(target), path: target };
  }
}

function listFolders(folder) {
  const target = normalizeFolder(folder);
  return fs
    .readdirSync(target, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => ({ name: entry.name, path: path.join(target, entry.name) }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}

function listFiles(folder) {
  const target = normalizeFolder(folder);
  return fs
    .readdirSync(target, { withFileTypes: true })
    .filter((entry) => entry.isFile() && !entry.name.startsWith('.') && !entry.name.endsWith(TEMP_SUFFIX))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

/**
 * Makes a folder, taking the next free name if that one is in use, the
 * way OneDrive itself does ("Inside Story 1"). A second folder under a
 * new name is recoverable; one quietly reused is not what was asked for.
 */
function makeFolder(parent, name) {
  assertFileName(name);
  const target = normalizeFolder(parent);
  assertWritable(target);
  let candidate = path.join(target, name);
  let suffix = 1;
  while (fs.existsSync(candidate)) {
    candidate = path.join(target, `${name} ${suffix}`);
    suffix += 1;
  }
  fs.mkdirSync(candidate, { recursive: false });
  return { name: path.basename(candidate), path: candidate };
}

function readText(folder, fileName) {
  assertFileName(fileName);
  return fs.readFileSync(path.join(normalizeFolder(folder), fileName), 'utf8');
}

function writeText(folder, fileName, text) {
  assertFileName(fileName);
  const target = normalizeFolder(folder);
  assertWritable(target);
  const file = path.join(target, fileName);
  const temp = file + TEMP_SUFFIX;
  fs.writeFileSync(temp, text, 'utf8');
  try {
    fs.renameSync(temp, file);
  } catch (error) {
    // OneDrive can hold a file it is uploading for a moment; one more try
    // after a beat is usually enough, and the temporary copy is removed
    // either way.
    try {
      fs.rmSync(file, { force: true });
      fs.renameSync(temp, file);
    } catch {
      fs.rmSync(temp, { force: true });
      throw error;
    }
  }
}

function deleteFile(folder, fileName) {
  assertFileName(fileName);
  const target = normalizeFolder(folder);
  assertWritable(target);
  fs.rmSync(path.join(target, fileName), { force: true });
}

function moveFile(fromFolder, fileName, intoFolder) {
  assertFileName(fileName);
  const from = normalizeFolder(fromFolder);
  const into = normalizeFolder(intoFolder);
  assertWritable(from);
  assertWritable(into);
  fs.renameSync(path.join(from, fileName), path.join(into, fileName));
}

module.exports = {
  roots,
  pickFolder,
  stat,
  listFolders,
  listFiles,
  makeFolder,
  readText,
  writeText,
  deleteFile,
  moveFile,
};
