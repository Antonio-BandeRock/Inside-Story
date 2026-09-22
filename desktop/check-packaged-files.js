// Refuses to pack an installer that would be missing one of its own files.
//
// electron-builder.yml lists the files that go into the installer one by
// one, and a module added beside main.js is invisible to it until somebody
// remembers to add the line. Nobody remembered for cloudFolder.js in
// 1.0.42.25, and the installed app opened to "Cannot find module
// './cloudFolder'" while the same code ran fine from the folder. This walks
// every local require from main.js and preload.js and compares the set
// against the list, so the mismatch is caught here rather than on the PC.
//
//   node desktop/check-packaged-files.js
//
// Exits 1 with the missing names when the list is short.

const fs = require('fs');
const path = require('path');

const here = __dirname;
const yml = fs.readFileSync(path.join(here, 'electron-builder.yml'), 'utf8');
const listed = new Set();
let inFiles = false;
for (const line of yml.split(/\r?\n/)) {
  if (/^files:\s*$/.test(line)) {
    inFiles = true;
    continue;
  }
  if (inFiles) {
    const item = line.match(/^\s+-\s+(.+?)\s*$/);
    if (item) {
      listed.add(item[1]);
      continue;
    }
    if (!/^\s*#/.test(line) && line.trim().length > 0) inFiles = false;
  }
}

const needed = new Set();
const queue = ['main.js', 'preload.js'];
while (queue.length > 0) {
  const name = queue.shift();
  if (needed.has(name)) continue;
  needed.add(name);
  const source = fs.readFileSync(path.join(here, name), 'utf8');
  for (const match of source.matchAll(/require\(\s*['"]\.\/([^'"]+)['"]\s*\)/g)) {
    const file = match[1].endsWith('.js') ? match[1] : match[1] + '.js';
    if (fs.existsSync(path.join(here, file))) queue.push(file);
  }
}

const missing = [...needed].filter((name) => !listed.has(name)).sort();
if (missing.length > 0) {
  console.error('electron-builder.yml is missing files main.js needs: ' + missing.join(', '));
  process.exit(1);
}
console.log('packaged file list covers every local require (' + needed.size + ' files).');
