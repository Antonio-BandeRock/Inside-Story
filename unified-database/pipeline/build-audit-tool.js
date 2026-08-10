// The real, permanent build step tying audit-tool/unified-audit.html (the
// hand-authored template) together with a fresh audit-tool/audit-data.json
// export into the one, self-contained file that actually gets published
// as a Claude Artifact. Meant to be re-run every time the tool needs
// republishing after a real review/apply pass changes what's still
// awaiting decision -- not a one-off.
//
// Usage: node export-audit-data.js && node build-audit-tool.js
// (both steps -- the export always has to run first, since this script
// only splices whatever audit-data.json currently contains)

const fs = require('fs');
const path = require('path');

const templatePath = path.resolve(__dirname, '..', 'audit-tool', 'unified-audit.html');
const dataPath = path.resolve(__dirname, '..', 'audit-tool', 'audit-data.json');
const outPath = path.resolve(__dirname, '..', 'audit-tool', 'unified-audit-built.html');

const template = fs.readFileSync(templatePath, 'utf8');
if (!template.includes('/*__DATA__*/')) {
  console.error('Real placeholder /*__DATA__*/ not found in unified-audit.html -- refusing to build a silently-broken file.');
  process.exit(1);
}

const data = fs.readFileSync(dataPath, 'utf8');

// Real, direct check for the one genuinely dangerous case: a literal
// "</script" substring anywhere inside the embedded data would
// prematurely close the <script> tag when the browser's own HTML parser
// scans the page, corrupting everything after it. Checked here, every
// build, rather than assumed safe just because it happened to be clean
// once.
if (data.toLowerCase().includes('</script')) {
  console.error('Real, dangerous "</script" substring found inside audit-data.json -- refusing to build. Find and fix the offending record before building again.');
  process.exit(1);
}

const out = template.replace('/*__DATA__*/', data);
fs.writeFileSync(outPath, out);

const sizeMB = Buffer.byteLength(out, 'utf8') / 1024 / 1024;
console.log(`Built ${outPath}`);
console.log(`Size: ${sizeMB.toFixed(2)} MB (Artifact ceiling is 16 MB)`);
if (sizeMB > 14) {
  console.warn('WARNING: approaching the real 16 MB Artifact size ceiling -- worth a look before this becomes a real problem.');
}
