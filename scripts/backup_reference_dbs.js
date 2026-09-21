// Copies the two SQLite databases that no longer live in git to the
// OneDrive backup folder, and reports what it did.
//
// Why this exists, 2026-09-21: GitHub sent the 90% warning on the
// account's 10 GiB of Git LFS storage. Every commit of
// assets/data/foods_reference.db (161 MB) or
// unified-database/unified_foods.sqlite (115 MB) had been uploading a
// whole new LFS object, and GitHub never frees one: 90 versions of the
// first and 20 of the second sat in history, about 5.3 GB, with the rest
// of the 9 GB in versions no longer reachable. Removing a file from git
// does not reclaim its LFS storage (only deleting and recreating the
// repository does), so the fix that holds is to stop the growth: both
// files are git-ignored now, EAS still uploads them for a build (its
// .easignore does not exclude them), and this script is their backup.
//
// The copies go under the same fixed names, so OneDrive's version history
// keeps the older ones without a dated copy per run eating the drive.
// Run it whenever either database changes, before calling the work done:
//   node scripts/backup_reference_dbs.js
// Restoring is the same copy the other way, by hand, on purpose.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BACKUP_DIR = path.join(process.env.USERPROFILE || '', 'OneDrive', 'Desktop', 'AppProject', '_backups', 'reference-dbs');

const FILES = [
  'assets/data/foods_reference.db',
  'unified-database/unified_foods.sqlite',
];

function main() {
  if (!fs.existsSync(path.dirname(BACKUP_DIR))) {
    console.error(`Backup folder's parent is missing: ${path.dirname(BACKUP_DIR)}`);
    process.exit(1);
  }
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  let copied = 0;
  for (const rel of FILES) {
    const src = path.join(ROOT, rel);
    if (!fs.existsSync(src)) {
      console.log(`skip     ${rel} (not present)`);
      continue;
    }
    const dest = path.join(BACKUP_DIR, path.basename(rel));
    const srcStat = fs.statSync(src);
    const same = fs.existsSync(dest) && fs.statSync(dest).size === srcStat.size && Math.abs(fs.statSync(dest).mtimeMs - srcStat.mtimeMs) < 2000;
    if (same) {
      console.log(`current  ${rel} (${(srcStat.size / 1048576).toFixed(1)} MB, backup already as new)`);
      continue;
    }
    fs.copyFileSync(src, dest);
    fs.utimesSync(dest, srcStat.atime, srcStat.mtime);
    copied += 1;
    console.log(`copied   ${rel} -> ${dest} (${(srcStat.size / 1048576).toFixed(1)} MB)`);
  }
  console.log(copied ? `${copied} file(s) backed up to ${BACKUP_DIR}` : `Nothing to copy; backups in ${BACKUP_DIR} are current.`);
}

main();
