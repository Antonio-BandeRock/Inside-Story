#!/usr/bin/env node
// Says whether the built Windows installer still matches the repo.
//
// Written 2026-09-22, after 1.0.49.4 through 1.0.49.9 all shipped to the
// phone and none of them reached Windows. A JS change reaches a phone by
// itself through `eas update`, so the finishing ritual ends there and the
// desktop app, which only ever changes when somebody builds and installs a
// new .exe, sat six releases behind without a word from anything.
//
//   node desktop/check-installer-current.js   exit 1 when the installer is behind
//
// It reads desktop/dist rather than anything about this machine, so it
// reports what was BUILT, not what is installed. Installing it is still a
// person walking through the installer.

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dist = path.join(__dirname, 'dist');

function repoVersion() {
  const text = fs.readFileSync(path.join(root, 'constants/version.ts'), 'utf8');
  const match = text.match(/APP_VERSION = '(\d+\.\d+\.\d+\.\d+)'/);
  if (!match) throw new Error('No APP_VERSION found in constants/version.ts');
  return match[1];
}

function rank(version) {
  return version.split('.').map((part) => Number(part));
}

function isAfter(a, b) {
  const [x, y] = [rank(a), rank(b)];
  for (let i = 0; i < 4; i += 1) {
    if (x[i] !== y[i]) return x[i] > y[i];
  }
  return false;
}

const wanted = repoVersion();

if (!fs.existsSync(dist)) {
  process.stderr.write('No desktop/dist folder, so nothing has been built. The repo is at ' + wanted + '.\n');
  process.exit(1);
}

const built = fs
  .readdirSync(dist)
  .map((name) => name.match(/^Inside Story Setup (\d+\.\d+\.\d+\.\d+)\.exe$/))
  .filter(Boolean)
  .map((match) => match[1]);

if (built.length === 0) {
  process.stderr.write('No installer in desktop/dist, and the repo is at ' + wanted + '.\n');
  process.exit(1);
}

const newest = built.reduce((best, one) => (isAfter(one, best) ? one : best));

if (!isAfter(wanted, newest)) {
  process.stdout.write('The newest installer is ' + newest + ', and the repo is at ' + wanted + '.\n');
  process.exit(0);
}

process.stderr.write(
  'The newest installer is ' + newest + ', and the repo is at ' + wanted + '.\n' +
  'Nothing since ' + newest + ' has reached the Windows app' + '.\n' +
  'Build it: node desktop/build-web.js, then cd desktop && npm run dist\n');
process.exit(1);
