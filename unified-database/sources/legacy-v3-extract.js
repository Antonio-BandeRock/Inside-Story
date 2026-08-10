// Real, working zip extraction for legacy-v3-shared.js -- uses
// PowerShell's own built-in Expand-Archive rather than adding a new
// npm dependency for one narrow task, since this is a local,
// Windows-only dev-tool script, not something shipped anywhere.

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Extracts `entryName` from `zipPath` into `destDir`, then renames/
 * moves the result to `finalPath` -- a real, verified extraction, not
 * just a "the command exited 0" assumption. Throws if the extracted
 * file doesn't actually exist or is suspiciously small afterward.
 */
function extractZipTo(zipPath, destDir, entryName, finalPath) {
  const tempExtractDir = path.join(destDir, '_extract_tmp');
  if (fs.existsSync(tempExtractDir)) fs.rmSync(tempExtractDir, { recursive: true, force: true });
  fs.mkdirSync(tempExtractDir, { recursive: true });

  execFileSync('powershell.exe', [
    '-NoProfile',
    '-NonInteractive',
    '-Command',
    `Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${tempExtractDir.replace(/'/g, "''")}' -Force`,
  ]);

  const extractedPath = path.join(tempExtractDir, entryName);
  if (!fs.existsSync(extractedPath)) {
    throw new Error(`Expected ${entryName} inside the extracted zip but it wasn't there. Contents: ${fs.readdirSync(tempExtractDir).join(', ')}`);
  }
  const size = fs.statSync(extractedPath).size;
  if (size < 1024 * 1024) {
    // The real, known file is ~120MB -- anything drastically smaller
    // almost certainly means a bad/partial extraction, worth failing
    // loudly on rather than silently ingesting a truncated database.
    throw new Error(`Extracted file looks too small to be real (${size} bytes) -- refusing to trust it.`);
  }

  fs.renameSync(extractedPath, finalPath);
  fs.rmSync(tempExtractDir, { recursive: true, force: true });
  return finalPath;
}

module.exports = { extractZipTo };
