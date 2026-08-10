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

## Status: Phase 2 underway — Norway and Sweden both ingested and verified for real

**Real, current numbers, from actual runs against both sources' live
data (2026-08-10):** 4,727 total records ingested (2,121 Norway + 2,606
Sweden). Classification: 815 whole food, 306 not whole food, 3,606
forced into human review — every single one of Sweden's 2,606 records
among them, correctly and honestly, since Sweden has no verified
English name source at all (confirmed: no documented API English
variant, unlike Norway's real `/en/` endpoint) — classify.js's own
safety rule refuses to guess at any of it. Matching: 99 real groups
matched 2+ records each (406 total foods — real within-source variety
groupings so far, e.g. 9 apple varieties correctly recognized as one
species, 20 real lamb cuts as one species; genuine cross-source matches
between Norway and Sweden specifically will only become possible once
Sweden's own names are translated and re-classified), 409 groups stood
alone as region-specific.

### A fourth real bug, found running Sweden on top of Norway's already-matched data

Re-running the match phase against **every** current whole-food row
(not just newly-added ones) silently duplicated every already-existing
group — confirmed directly: group and food counts had exactly doubled
after Sweden's ingest, even though Sweden itself contributed zero new
whole-food rows. The real fix (`fetchUnmatchedWholeFoods`) had actually
already been written back in Phase 1, complete with its own doc comment
explaining exactly this — it just was never wired into `run-source.js`,
which built its own separate, duplicate query instead. Fixed by using
the existing function; added a real, DB-backed regression test
(`run-source.test.js`) proving a second run never re-matches or
duplicates already-grouped rows. A real, honestly-named limitation the
fix does NOT solve (see `run-source.js`'s own header comment): a
newly-ingested row currently can't join an *existing* group from an
earlier run — it only groups against other newly-unmatched rows in the
same run, so it'll form its own new, correct-but-unlinked group instead
of joining Norway's own. Not a correctness risk (nothing merges
wrongly), just a real, deferred completeness gap worth a future pass.

### Three real bugs found and fixed via this live run, not left for later

All three are documented in full, with the exact real data that
surfaced them, in `pipeline/match.js`'s and `run-source.js`'s own
comments and in `pipeline/match.test.js`'s regression tests — summarized
here:

1. **"database is locked" crash** — the writer never set a busy-timeout,
   so a momentary, entirely innocent concurrent read (a progress check)
   caused a hard failure instead of a bounded wait. Fixed with a real
   `.timeout` setting via sqlite3's `-cmd` flag (a plain embedded
   `PRAGMA busy_timeout` was tried first and found to corrupt `-json`
   output — it prints its own return value as plain text ahead of the
   real JSON).
2. **Severe slowness (~0.5 rows/sec)** — outside an explicit
   transaction, SQLite fsyncs after every statement; batching into many
   separate `sqlite3.exe` invocations added real, additional subprocess
   overhead on top of that. Fixed by wrapping an entire statement set
   in one real transaction, run as a single invocation. Norway's full
   2,121-record ingest (67,448 SQL statements) now completes in 1.4s.
3. **Cross-species false matches** — `last_insert_rowid()` was used to
   link a new group's members, but it gets overwritten by the very
   first member-insert's own rowid (a separate sequence, since
   `food_match_members` isn't `WITHOUT ROWID`), so every member after
   the first in a group could silently attach to the wrong id. Caught
   directly in real output: Apple grouped with Apricots. Fixed by
   generating group ids explicitly in JS instead of relying on SQLite's
   own `last_insert_rowid()` at all. A second, related, genuinely
   different issue surfaced during the fix's own verification: two
   real, different species (highbush blueberry vs. bilberry; two
   different squash species) were being correctly kept apart by Tier 1
   (species name) but then incorrectly re-merged by the weaker Tier 2
   (LanguaL code overlap) and Tier 3 (English name) passes, since both
   pairs happened to share an identical LanguaL code set or an
   ambiguous common name. Fixed with a real, general principle: once a
   row has a confirmed Latin name, only species-level signals may ever
   group it — the weaker tiers now explicitly exclude any row that
   already has one. Verified clean across all 223 real match groups
   after the fix (zero remaining species conflicts).

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

### A real, unplanned discovery from that same test run — confirmed, not just suspected

The Norwegian sample used in the proof came from
`matvaretabellen.no/api/en/foods.json` — Matvaretabellen's own official
**English** endpoint. Its `foodName` field is a real, source-verified
English name, not something this project translated. **Confirmed**: the
app database's own already-imported copy of Norway (visible today under
`assets/data/foods_reference.db`'s `source = 'Norway_Matvaretabellen'`)
is genuinely in Norwegian (e.g. "Agurk, norsk, rå" for cucumber) — it
was imported via the `/nb/` endpoint, not `/en/`. This means the real
~1,260-item Norway translation gap flagged earlier this session doesn't
actually require independent translation work at all — a straightforward
re-import from `/en/` (exactly what `sources/norway.js` now does)
recovers real, source-verified English names for free. Sweden's own
data (a direct XLSX export, not an API with a documented English
variant) has no equivalent shortcut confirmed yet — a real, separate
question for whenever Sweden's own adapter gets written.

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
2. **Phase 2: real source ingestion — underway.** Norway and Sweden
   both done and verified (`sources/norway.js`, `sources/sweden.js`,
   run via `pipeline/run-source.js`). Real, honest current state, 4,727
   records: 815 whole food / 306 not / 3,606 needing human review (all
   2,606 of Sweden's own records among them, since it has no verified
   English source); 99 groups matched 2+ records, 409 region-specific.
   Remaining: a real translation pass for Sweden's own names (no
   shortcut exists the way Norway's `/en/` endpoint provided one), then
   the original 7 sources (`ClaudeWork/unified_food_database_v3_full.sqlite.zip`
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

## Real candidate sources for future ingestion — named, not yet verified

Raised in conversation, not yet checked for real accessibility,
structured-export availability, or license terms this session — the
same due diligence already applied to Finland (blocked by bot
protection)/Mexico (PDF-only, no structured export)/Italy (search-only)/
China (no confirmed open-data portal) needs to happen before treating
any of these as a real, addable source, not just a name on a list:

- **India — IFCT** (Indian Food Composition Tables, National Institute
  of Nutrition) — a real gap; South Asian cuisine has essentially zero
  representation across the current 9 sources.
- **Brazil — TACO** (Tabela Brasileira de Composição de Alimentos,
  UNICAMP) — worth checking given Mexico's own data turned out
  PDF-only, not structured.
- **South Africa — SAFOODS** — the African continent currently has zero
  representation in the reference database at all.
- **Denmark — Frida** (DTU Food Data) — would complete real Nordic
  coverage alongside Norway and Sweden.
- **Netherlands — NEVO** (RIVM) — a well-established Western European
  database.
- **New Zealand — NZ Food Composition Database** (Plant & Food
  Research) — genuinely distinct from Australia's AFCD, not a
  duplicate.

Two more structural angles, not "another country" so much as sources
this app hasn't tapped within what it already touches:

- **USDA's own Foundation Foods dataset** — the app currently only uses
  USDA's older SR Legacy data; Foundation Foods is a separate, newer,
  more rigorously analytically-verified USDA dataset covering a smaller
  food set.
- **EuroFIR** — a real European network harmonizing many national
  databases into one standardized format, using LanguaL/FoodEx2
  classification codes. If genuinely accessible, this could be directly
  valuable for the cross-source species-matching work already
  underway (`pipeline/match.js`) — it may already carry real
  classification codes rather than requiring this project to derive
  its own matches from scratch.

## Running what exists today

```
cd unified-database
npm install                           # installs the real xlsx dependency (needed for sources/sweden.js)
node pipeline/init-db.js              # creates unified_foods.sqlite from schema.sql
node pipeline/classify.test.js        # 33/33
node pipeline/match.test.js           # 12/12
node pipeline/ingest.test.js          # 10/10
node pipeline/run-source.test.js      # 6/6
node pipeline/run-source.js sources/norway.js   # real, live ingest + classify + match against Norway's actual API
node pipeline/run-source.js sources/sweden.js   # real, live ingest + classify + match against Sweden's actual export
node pipeline/seed-and-run-e2e.js     # real, seeded end-to-end proof (not permanent data)
```
