# Per-source adapters — the real "easy to add a new source" contract

This is the one piece of adding a new source that's genuinely bespoke —
every source publishes its raw data in its own shape, and nothing can
paper over that. Everything downstream of this (classification, species
matching, review, merge) already works, unchanged, for whatever an
adapter here hands it.

## The interface

Each adapter is a single JS file in this directory (`usda.js`,
`norway.js`, `sweden.js`, etc. — one per real source), exporting one
function:

```js
module.exports = {
  sourceCode: 'Norway_Matvaretabellen', // must match a real row in the `sources` table
  async ingest(rawFilePathOrApiConfig) {
    // Read/fetch this source's own raw data however it actually needs
    // to be read (an xlsx, a zip of CSVs, a live API call — whatever's
    // real for this source), and return an array of NormalizedRecord:
    return [
      {
        sourceFoodId: 'the source's own native ID, if it has one, else null',
        nameOriginal: 'verbatim, exactly as the source wrote it',
        nameEnglish: 'a REAL, verified English name, or null if none exists yet — never guessed, never machine-translated silently',
        latinName: 'a real scientific/species name, or null',
        langualCodes: ['array', 'of', 'real', 'codes'] /* or null */,
        categoryOriginal: 'the source's own raw category label, untouched',
        nutrients: { protein: 12.3, fiber_total: 2.1 /* ...this app's own established nutrient_code vocabulary */ },
        raw: { /* the full original record, whatever shape the source gave it */ },
      },
      // ...
    ];
  },
};
```

## What happens with what an adapter returns

The shared pipeline (`pipeline/ingest.js`, already built and tested —
see its own `.test.js`) takes that array and:

1. Registers the source in the `sources` table if it isn't already there.
2. Inserts one `raw_foods` row per record, `raw_json` holding the
   complete original `raw` object (so nothing is ever lost, even a
   field this schema didn't anticipate).
3. Inserts the structured `nutrients` values into `raw_food_nutrients`.

Then the SAME shared `classify.js` and `match.js` this project already
has, real and tested, run over the combined pool from every source —
no per-source classification or matching logic needed, ever.

## Real, honest state as of Phase 1

No adapters exist here yet. Phase 1 built and proved the schema, the
classifier, and the matching cascade — all three tested against real
data (see `pipeline/*.test.js` and `pipeline/seed-and-run-e2e.js`).
Writing the first real adapters (starting with Norway and Sweden, since
their raw data is already on hand from this project's own recent
sessions) is Phase 2, not yet started.
