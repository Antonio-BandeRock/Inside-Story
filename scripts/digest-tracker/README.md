# Purple Digest depth-push tracker

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
diffs against baseline commit `e9f7c0b` via `git show <commit>:<path>` to
tag which entries are new since this depth push began, and sums
Hashimoto's own scattered `category: 'hashimotos'` entries for the
benchmark target).

Then splice that JSON into `template.html`'s
`/*__DIGEST_TRACKER_DATA__*/{}` placeholder (replace the placeholder with
the JSON's contents, trimmed), verify the embedded `<script>` block is
still valid JS, and republish via the `Artifact` tool passing
`url: 'https://claude.ai/code/artifact/50e9624a-3300-4d43-8fa8-27596f0705cd'`
so it updates in place.

`digest-tracker-data.json` is gitignored (regenerated, not source).
