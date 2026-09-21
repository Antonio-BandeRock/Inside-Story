// Exports the app for the web target into desktop/web-build/ with the
// desktop flag set, which is what turns on the module redirects in
// ../metro.config.js (expo-sqlite to the Electron bridge, the reference
// database left out of the bundle, phone-only natives stubbed). Run from
// anywhere: `node desktop/build-web.js` or `npm run export` in desktop/.

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.join(__dirname, '..');
const outputDir = path.join(__dirname, 'web-build');

fs.rmSync(outputDir, { recursive: true, force: true });

const result = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['expo', 'export', '-p', 'web', '--output-dir', outputDir],
  {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, INSIDE_STORY_DESKTOP: '1', CI: '1' },
  },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const indexFile = path.join(outputDir, 'index.html');
if (!fs.existsSync(indexFile)) {
  console.error(`export finished without ${indexFile}`);
  process.exit(1);
}
console.log(`web export ready in ${outputDir}`);
