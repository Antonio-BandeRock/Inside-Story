#!/usr/bin/env node
/**
 * claude-md-guard.mjs
 *
 * CLAUDE.md is loaded into context at the start of every Claude Code session and
 * re-sent with every request, so its size is a tax on all work. This project's
 * CLAUDE.md has twice grown past 1.5 MB and broken Claude Code entirely
 * (2026-08-19 at 2.05M chars, 2026-09-14 at 1.60M chars) because sessions kept
 * appending dated "Status snapshot" sections instead of updating in place.
 *
 * A warning in the document did not stop it. This does.
 *
 * Below the threshold this does nothing at all. Above it, it moves log-shaped
 * sections out to the archive, dedupes exact-duplicate sections, and rewrites
 * CLAUDE.md. It never deletes: removed content is appended to the archive first,
 * and the previous CLAUDE.md is saved as CLAUDE.md.guard-bak.
 *
 * Run: node scripts/claude-md-guard.mjs [--check]
 *   --check  report only, change nothing (exit 1 if over the limit)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT       = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLAUDE_MD  = path.join(ROOT, 'CLAUDE.md');
const ARCHIVE    = path.join(ROOT, 'docs', 'CLAUDE-ARCHIVE-2026-09-14.md');
const LIMIT      = 100 * 1024;                 // act above 100 KB
const HARD       = 250 * 1024;                 // shout even if nothing is archivable
const CHECK_ONLY = process.argv.includes('--check');

// Section headings that are logs, not brief. These get archived.
const LOGGY = /^##\s+(status\s+snapshot|session\s+log|build\s+log|work\s+log|changelog|daily\s+log|progress\s+log)\b/i;

const kb = n => `${(n / 1024).toFixed(1)} KB`;

if (!fs.existsSync(CLAUDE_MD)) process.exit(0);
const original = fs.readFileSync(CLAUDE_MD, 'utf8');
const size = Buffer.byteLength(original, 'utf8');
if (size <= LIMIT) process.exit(0);

// --- split into preamble + ## sections -------------------------------------
const lines = original.split('\n');
const heads = [];
lines.forEach((l, i) => { if (/^##\s+/.test(l)) heads.push(i); });

const preamble = lines.slice(0, heads.length ? heads[0] : lines.length);
const sections = heads.map((start, n) => {
  const end = n + 1 < heads.length ? heads[n + 1] : lines.length;
  return { heading: lines[start].trim(), body: lines.slice(start, end) };
});

// --- partition: archive log-shaped sections, dedupe exact repeats -----------
const keep = [], archive = [];
const seen = new Set();
for (const s of sections) {
  const text = s.body.join('\n').trim();
  if (LOGGY.test(s.heading)) { archive.push(s); continue; }
  const key = text;
  if (seen.has(key)) { archive.push({ ...s, dupe: true }); continue; }
  seen.add(key);
  keep.push(s);
}

const rebuilt = [...preamble, ...keep.flatMap(s => s.body)].join('\n').replace(/\n{3,}$/, '\n') + '\n';
const newSize = Buffer.byteLength(rebuilt, 'utf8');

console.log('');
console.log(`  CLAUDE.md is ${kb(size)} (${lines.length} lines) — over the ${kb(LIMIT)} limit.`);
console.log(`  ${archive.length} section(s) to archive, ${keep.length} kept. New size would be ${kb(newSize)}.`);
for (const s of archive) console.log(`    - ${s.heading.slice(0, 70)}${s.dupe ? '   [exact duplicate]' : ''}`);

if (CHECK_ONLY) { console.log('  (--check: nothing written)\n'); process.exit(1); }
if (!archive.length) {
  if (size < HARD) process.exit(0);   // large but no log sections: only nag when it's serious
  console.log('  No log-shaped sections to archive. This file is large on its own merits.');
  console.log('  Trim it by hand: a brief should be a few hundred lines, not thousands.\n');
  process.exit(0);
}

// --- write: archive first, backup, then rewrite ----------------------------
const stamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
let addition = `\n\n<!-- auto-archived by scripts/claude-md-guard.mjs at ${stamp} -->\n\n`;
for (const s of archive) {
  addition += `<!-- archived block: ${s.heading.replace(/^#+\s*/, '')}${s.dupe ? ' (exact duplicate)' : ''} -->\n\n`;
  addition += s.body.join('\n').trim() + '\n\n---\n\n';
}
fs.mkdirSync(path.dirname(ARCHIVE), { recursive: true });
fs.appendFileSync(ARCHIVE, addition, 'utf8');
fs.writeFileSync(CLAUDE_MD + '.guard-bak', original, 'utf8');
fs.writeFileSync(CLAUDE_MD, rebuilt, 'utf8');

console.log(`  Archived to ${path.relative(ROOT, ARCHIVE)}; previous file kept as CLAUDE.md.guard-bak.`);
console.log(`  CLAUDE.md is now ${kb(newSize)}.\n`);
