# Inside Story — Unified Whole-Foods Database

A real, new, separate SQLite database and pipeline — entirely isolated
from `assets/data/foods_reference.db` and the live app. Built to become
the richer, more rigorous foundation this project always meant to have:
combined from RAW source data (not the app's already-filtered subset),
classified fresh against a real, explicit whole-food rule, matched
across sources wherever the same real food or species can be confirmed
regardless of language, and only then merged with everything the
current app database already carries (D1-D6/condition scores, aliases,
interaction rules, everything) to become a real, verified, drop-in
replacement.

**Nothing in this directory is wired to the live app.** `lib/db.ts`
never reads from `unified_foods.sqlite`. No app screen changes. That's
deliberate — see "Safety" below.

## Status: Phase 1 complete (schema + pipeline, no real source data yet)

Built and proven, 2026-08-10:

- **`schema.sql`** — the real master schema (`sources`, `raw_foods`,
  `raw_food_nutrients`, `whole_food_classifications`, `food_match_groups`,
  `food_match_members`). Every raw source record is preserved verbatim
  (`raw_foods.raw_json`), even after normalization — nothing gets
  silently discarded the way the original 2026 filter pass sometimes did.
- **`pipeline/init-db.js`** — creates a fresh database from the schema.
  Refuses to overwrite an existing one without `--force`.
- **`pipeline/ingest.js`** — takes a per-source adapter's normalized
  output and writes it in. Real UPSERT behavior: re-running an ingest
  for an already-known source updates rather than duplicates, and never
  clobbers a real, already-verified English name/Latin name with a
  blank from a later, partial re-import. Tested against a real SQLite
  file (`ingest.test.js`, 10/10 passing), including that exact
  re-import scenario.
- **`pipeline/classify.js`** — the real, codified whole-food rule
  engine, built on this project's own already-proven keyword lists from
  `ClaudeWork/filter_whole_foods_v2.py` (not reinvented from scratch),
  extended with the rules confirmed directly for this pass: butchered
  cuts count, plain dairy/ferments count only without added flavoring,
  fresh juice counts unless from concentrate or sweetened, dried fruit
  counts, fresh-frozen is fine. **Never guesses past its own evidence**
  — a non-English record with no verified English name comes out
  `is_whole_food: null`, `auto_confidence: 'low'`, forced into human
  review rather than risking a silent wrong answer. Tested: 33/33
  passing (`classify.test.js`), including two real bugs caught and
  fixed during testing, not assumed away:
  - "Ice cream, vanilla" was matching the dairy-positive rule via the
    word "cream" before the general exclude list ever got a chance to
    run — fixed by reordering the exclude check first.
  - "Adzuki beans, uncooked" matched nothing at all, because `\bcooked\b`
    correctly doesn't match inside "uncooked" — a real gap in the
    prep-state word list, not a regex bug. Added "uncooked" and "dry."
- **`pipeline/match.js`** — the real, tiered cross-source matching
  cascade: exact species/Latin name (strongest, language-independent) →
  LanguaL classification-code exact-set overlap (deliberately the most
  conservative possible starting rule — real facet-weighting logic
  needs LanguaL's own documentation, which WebSearch being exhausted
  this session prevented verifying) → canonical English name → anything
  left over becomes its own real, single-member, region-specific group.
  Every automated match is written `match_confidence: 'proposed'`,
  never `'confirmed'` — the same "tool proposes, human decides"
  discipline already proven on this app's own existing Reference
  Database Audit tool across 10,000+ real decisions. Tested: 6/6
  passing (`match.test.js`).
- **A real, end-to-end proof against genuine data** (`seed-and-run-e2e.js`,
  a one-off proof script, not part of the permanent pipeline): seeded a
  handful of real USDA names plus real Norwegian records pulled directly
  from Matvaretabellen's own live API (fetched earlier the same
  session). The pipeline correctly linked a real USDA "Adzuki beans"
  row and a real Norwegian one **purely by their shared, genuine Latin
  name** (`Vigna angularis...`) — `match_method: 'latin_name'`,
  `is_region_specific: 0` — across two actually different-language
  sources, with zero fuzzy name matching involved. This is the real
  payoff the whole architecture exists for.

### A real, unplanned discovery from that same test run

The Norwegian sample used in the proof came from
`matvaretabellen.no/api/en/foods.json` — Matvaretabellen's own official
**English** endpoint, fetched earlier this session. Its `foodName`
field is a real, source-verified English name, not something this
project translated. This means Norway's real translation burden may be
much smaller than the ~1,260-item estimate given earlier this session
(which assumed Norway's data was untranslated Norwegian) — the real
open question for Phase 2 is whether the *already-imported* app-database
copy of Norway used the `/nb/` (Norwegian) endpoint instead, and if so,
whether a straightforward re-import from `/en/` recovers real, verified
English names for free. Sweden's own data (a direct XLSX export, not an
API with a documented English variant) has no equivalent shortcut
confirmed yet — worth checking directly in Phase 2, not assumed either
way.

## Safety — how this can't break the live app

1. **Total isolation while being built.** This whole directory, its
   database, and its pipeline are independent of the app. The running
   app is unaffected for the entire duration of this work.
2. **The only real integration point is a single, well-understood step
   this project already performs today**: exporting a filtered, bundled
   database from a richer master, matching `assets/data/foods_reference.db`'s
   exact schema. Not a new mechanism — the same one already building
   the current bundled database.
3. **Schema compatibility gets verified, not assumed**, before any
   export is ever bundled — a real, automated diff against every table
   `lib/db.ts` actually queries.
4. **Every existing decision gets a real integrity check**: every
   `(food_id, source)` pair, every D1-D6/condition score, alias, and
   interaction rule currently live must still resolve correctly against
   a candidate export, or be a deliberate, traceable, intentional part
   of this project — never silently dropped.
5. **The swap is one atomic, reversible git commit.** `REFERENCE_DB_VERSION`
   (this app's own existing, already-proven re-import trigger) means
   even a mistake only affects the reimport path, with a known,
   already-used rollback.

## Real, phased plan

1. ~~**Phase 1: schema + pipeline.**~~ Done (this document's own status
   above).
2. **Phase 2: real source ingestion.** Write the first real adapters
   (`sources/*.js`, see that directory's own README for the required
   interface) — starting with Norway and Sweden, since their raw data
   is already on hand from this project's recent sessions, then the
   original 7 sources (`ClaudeWork/unified_food_database_v3_full.sqlite.zip`
   already holds a real, unfiltered 27,980-row combine of those — a
   real, existing head start, not starting from zero).
3. **Phase 3: whole-food classification** — run `classify.js` for real
   across every ingested source, review the low-confidence/ambiguous
   queue via a new audit-tool webpage (not yet built).
4. **Phase 4: cross-source matching** — run `match.js` for real, review
   proposed matches the same way.
5. **Phase 5: merge in the app's own working layer** — map the current,
   already-curated `assets/data/foods_reference.db` rows onto their
   corresponding rows in this new master, carrying forward every score,
   alias, and rule rather than re-deriving them.
6. **Phase 6: full automated verification** against a candidate export,
   per "Safety" above.
7. **Phase 7: the actual swap** — one atomic, reversible commit.
8. **Ongoing: the same pipeline for any future new source** — the real
   point of building it this way.

## Running what exists today

```
cd unified-database
node pipeline/init-db.js              # creates unified_foods.sqlite from schema.sql
node pipeline/classify.test.js        # 33/33
node pipeline/match.test.js           # 6/6
node pipeline/ingest.test.js          # 10/10
node pipeline/seed-and-run-e2e.js     # real, seeded end-to-end proof (not permanent data)
```
