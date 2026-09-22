#!/usr/bin/env node
/* global __dirname */
// Applies the app's version scheme, 1.0.DAY.UPDATE, so nobody has to type it.
//
// Written 2026-09-22 after the number drifted seven days behind. The scheme
// was already written down in constants/version.ts, and hand-typing it had
// failed six times: 09-03, 09-06, 09-07, 09-14, 09-17 and 09-21 all carried
// the previous day's DAY forward instead of incrementing it, so 2026-09-22
// opened on 1.0.42.x when it was the 49th day of work. That comment said
// "there's no mechanical trigger for it." This is the trigger.
//
// DAY is the count of distinct calendar days carrying committed work, from
// the first commit (2026-07-25) through today, counting today whether or not
// it has a commit yet, since running this means today is a work day. That
// count matched the version exactly on the day the scheme was introduced
// (2026-08-23 shipped 1.0.24.18 against 24 distinct days), so it is the
// definition rather than a reconstruction of it.
//
// UPDATE increments once per distinct request, and resets to 1 the first
// time a bump lands on a new day.
//
//   node scripts/bump_version.js           bump for a new request
//   node scripts/bump_version.js --check   report only, exit 1 if the day is stale
//   node scripts/bump_version.js --day     print today's DAY and exit

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');

const FILES = [
  {
    file: 'constants/version.ts',
    find: /(APP_VERSION = ')(\d+\.\d+\.\d+\.\d+)(')/,
  },
  {
    file: 'app.json',
    find: /("version": ")(\d+\.\d+\.\d+\.\d+)(")/,
  },
  {
    file: 'package.json',
    find: /("version": ")(\d+\.\d+\.\d+\.\d+)(")/,
  },
  {
    file: 'desktop/electron-builder.yml',
    find: /(buildVersion: )(\d+\.\d+\.\d+\.\d+)()/,
  },
];

function today() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
}

function workDayNumber() {
  const out = execFileSync('git', ['log', '--format=%ad', '--date=short'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  const days = new Set(out.split('\n').map((line) => line.trim()).filter(Boolean));
  days.add(today());
  return days.size;
}

function readVersion(entry) {
  const full = path.join(root, entry.file);
  const text = fs.readFileSync(full, 'utf8');
  const match = text.match(entry.find);
  if (!match) throw new Error('No version string found in ' + entry.file);
  return { full, text, current: match[2] };
}

function writeVersion(entry, next) {
  const { full, text, current } = readVersion(entry);
  if (current === next) return false;
  fs.writeFileSync(full, text.replace(entry.find, '$1' + next + '$3'), 'utf8');
  return true;
}

const args = process.argv.slice(2);
const day = workDayNumber();

if (args.includes('--day')) {
  process.stdout.write(String(day) + '\n');
  process.exit(0);
}

const states = FILES.map((entry) => ({ entry, ...readVersion(entry) }));
const distinct = new Set(states.map((state) => state.current));
if (distinct.size > 1) {
  process.stderr.write('The four files disagree on the version:\n');
  for (const state of states) process.stderr.write('  ' + state.entry.file + ': ' + state.current + '\n');
  process.exit(1);
}

const current = states[0].current;
const parts = current.split('.').map((part) => Number(part));
const [major, minor, currentDay, update] = parts;

if (args.includes('--check')) {
  if (currentDay === day) {
    process.stdout.write('Version ' + current + ' is on day ' + day + ', which is today.\n');
    process.exit(0);
  }
  process.stderr.write(
    'Version ' + current + ' carries day ' + currentDay + ', and today is day ' + day + '.\n' +
    'Run node scripts/bump_version.js before the next request.\n');
  process.exit(1);
}

if (currentDay > day) {
  process.stderr.write(
    'Version ' + current + ' carries day ' + currentDay + ', which is past today\'s day ' + day + '.\n' +
    'Something is wrong; sort it out by hand rather than bumping.\n');
  process.exit(1);
}

const next = currentDay === day
  ? [major, minor, day, update + 1].join('.')
  : [major, minor, day, 1].join('.');

const changed = [];
for (const entry of FILES) if (writeVersion(entry, next)) changed.push(entry.file);

process.stdout.write(current + ' -> ' + next + (currentDay === day ? '' : ' (new day)') + '\n');
for (const file of changed) process.stdout.write('  ' + file + '\n');
