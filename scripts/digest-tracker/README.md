# Digest depth-push tracker

Regenerates the live Artifact tracking real progress across the 18
non-Hashimoto's conditions climbing toward Hashimoto's own Digest depth
(https://claude.ai/code/artifact/50e9624a-3300-4d43-8fa8-27596f0705cd).

## To regenerate after adding more Digest entries

From the repo root:

```
node scripts/digest-tracker/build-digest-tracker.js
```

This writes `digest-tracker-data.json` next to the script (parses every
`lib/digest/*.ts` condition file for `id`/`title`/`teaser`/`overallTier`,
diffs against `baseline-ids.json` -- see below -- to tag which entries are
new since the tracker was last published, and sums Hashimoto's own
scattered `category: 'hashimotos'` entries for the benchmark target).

Then splice that JSON into `template.html`'s
`/*__DIGEST_TRACKER_DATA__*/{}` placeholder (replace the placeholder with
the JSON's contents, trimmed), verify the embedded `<script>` block is
still valid JS (`node --check` on the extracted script), and republish via
the `Artifact` tool passing
`url: 'https://claude.ai/code/artifact/50e9624a-3300-4d43-8fa8-27596f0705cd'`
so it updates in place.

**Then run the script again with `--mark-published`** to advance the
"new since last publish" baseline for next time:

```
node scripts/digest-tracker/build-digest-tracker.js --mark-published
```

Only run `--mark-published` right after a real, successful publish -- it
overwrites `baseline-ids.json` with whatever ids are in `lib/digest/*.ts`
at that exact moment, which is what "new" gets measured against next time.

`digest-tracker-data.json` is gitignored (regenerated, not source).
`baseline-ids.json` is **not** gitignored -- it's real, durable state (the
"new" badge's own reference point), committed like any other source file.

## Why `baseline-ids.json` exists (2026-08-14 note)

This script originally diffed against a hardcoded git commit SHA via
`git show <sha>:<path>`. That SHA stopped resolving after an unrelated
2026-08-11 `git-filter-repo` history rewrite gave every commit in the repo
a new hash -- a real, silent failure mode: the old code's own try/catch
treated the missing commit as "the file didn't exist at baseline," which
would have quietly marked every single entry "new" rather than erroring
loudly. A committed JSON snapshot doesn't depend on git history staying
stable, is faster (no subprocess `git show` call per file), and is
resistant to any future history rewrite. The real tradeoff: "new" now
means "since the tracker was last actually published," not "since this
specific depth push began" -- a deliberate, disclosed shift, not an
oversight.

## A general lesson, not just for this script

Before writing a new one-off script for a "regenerate the tracker" or
"update the App Guide" task, check whether real, committed tooling already
exists here first (`scripts/digest-tracker/`, and check `scripts/` more
broadly) rather than rebuilding equivalent logic from scratch in a session
scratchpad. This exact generator already existed, already worked, and was
bypassed entirely in a 2026-08-14 session that spent real time re-deriving
the same extraction/splicing logic by hand -- the actual root cause of that
session's own "why did this take 20 minutes" complaint. Don't repeat that.
