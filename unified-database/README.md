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

## Status: a real, direct report — biscuits, bottled mineral water brands, and multi-step bean-paste derivatives

Reported directly: "'Springerle' anise biscuits are not a whole food.
'Zedernbrot' lemon almond biscuits are not a whole food. Neither is
Abatilles mineral water, bottled, non-carbonated, lightly mineralized
(Arcachon, 33) which is a brand name, or Adzuki beans, mature seeds,
'An' (bean paste), 'Koshi-an' (strained bean paste) which is a multi
ingredient thing. I keep expecting to not see things like these in the
list with all of my explanations, but somehow many still sneak past."

**Biscuit — the real, systemic pattern behind this one.** Checked the
full scope before touching anything: 296 real records contain
"biscuit"/"biscuits," and only 4 are the real, borderline "savoury...
crispbread" case this project had deliberately been protecting.
Several of the other 292 turned out to be real, LIVE false positives,
not just sitting in the review queue — the same underlying gap kept
recurring: `dry` (a `RAW_WHOLE_FOOD_HINTS` word meant for legumes/
grains, e.g. "Lentils, dry") was also incidentally matching "Plain dry
biscuit" and "Dry biscuit with chocolate topping"; `oil` was matching
"Biscuits, crackers, oil-sprayed"; `cocoa` was matching "Wholemeal
shortbread biscuits, containing cocoa, with nougat filling." Added
`biscuit`/`biscuits` as a real, general exclude — the real, accepted
tradeoff is that the 4 legitimate crispbread-style biscuit records now
also exclude, but real crispbread not named "biscuit" (`Crispbread,
rye`) stays correctly reachable.

**Bottled mineral water — a real, general pattern instead of chasing
brand names one at a time.** Given the practically unbounded number of
real mineral water brands (dozens already sit in this database —
Abatilles, Evian, Badoit, Contrex, Hépar, Appollinaris...), an explicit
per-brand list wasn't realistic. Checked 30 real, sampled records
instead: every single one containing both "mineral water" and "bottled"
is a genuine branded product, and real, legitimate plain water already
in this database ("Spring water," "Tap water," "Water, municipal")
never says "bottled" at all. A new `isBottledMineralWater()` check
requires both phrases present together, order-independent.

**Bean paste — a real, multi-step processed derivative, not the whole
bean.** All three real Japanese bean-paste variants in this database
("Koshi-an," "Sarashi-an," "Tsubushi-an") include the literal phrase
"bean paste" in their own parenthetical description, making it a safe,
general keyword — added directly, without touching the base "Adzuki
beans"/"Kidney beans" names those records also (correctly) contain.

**Real, concrete effect on all 32,707 already-ingested records**: 199
biscuit records, 82 bottled-mineral-water records, and 28 bean-paste
records excluded. All four exact reported records confirmed fixed.
Legitimate plain water and whole cooked beans spot-checked and confirmed
unaffected.

| | Before this pass | After this pass |
|---|---|---|
| Whole food | 17,109 | 17,029 |
| Not whole food | 8,458 | 8,726 |
| Needs human review | 7,140 | 6,952 |

112/112 classify.js tests passing (up from 97), 157/157 across the whole
pipeline.

## Status: a real, direct report closed the largest gap yet — composite dish names (goulash/meringue) and, most importantly, brand names

Reported directly: "'Rehpfeffer' savory roe deer goulash is not a single
ingredient whole food or derivative such as a fermentation, or a juice,
or a pulverization such as a flour, it is a combination of foods that
have been cooked together or are waiting to be cooked, but either way
they are not supposed to be listed here. The same for 'Wasp nests'
almond meringue, and I should definitely not see anything with a brand
name on it such as APPLEBEE'S, chicken tenders platter."

**Goulash and meringue** — checked every real record containing either
word before touching anything: every one is a genuine composite dish
(goulash) or composite baked dessert (meringue, whipped egg white and
sugar), never a single ingredient. Added directly to
`COMPOSITE_DISH_SIGNALS`/`CANDY_SNACKS`.

**Brand names — the real, largest, most careful fix in this pass.**
Investigated the actual scope before building anything: a real scan of
every distinct standalone ALLCAPS word across all 32,707 records found
539 of them. A blanket "any ALLCAPS word = brand" rule was checked and
rejected as genuinely dangerous — it would have wrongly excluded real,
legitimate whole foods: `USDA` (a real government grading/disclaimer
term, 47+ correctly-classified records), `UHT` (a real dairy
pasteurization method, 17 correctly-classified records), `BBQ`/`BBQ'D`
(a real, plain grilling method), and `DHA`/`ARA` (real nutrient names).
Built as a new, real, explicit, individually-verified `BRAND_NAMES` list
instead — every entry confirmed a genuine company/product-line name by
reading its own real sample records. A real, live, confirmed false
positive found along the way, directly proving why this needed to be a
general, high-priority signal rather than scoped to one category:
`APPLEBEE'S, KRAFT, Macaroni & Cheese, from kid's menu` was already
classifying as whole food via a plain "cheese" match, since nothing had
ever checked for a brand name alongside it.

Several entries deliberately stay as full compound phrases rather than a
bare word, specifically because the bare word collides with a real,
legitimate whole food this pipeline already recognizes: "mead" alone is
a real, traditional fermented honey beverage; "malt" alone is a real
grain product (barley malt flour already exists); "cream" alone is a
real dairy keyword. Each is only excluded as its own longer real brand
phrase ("mead johnson," "malt-o-meal," "cream of wheat"), never the
bare, collision-prone word — verified directly against real records for
both.

**A real, adjacent bug surfaced while testing the brand fix, not
reported directly but fixed the same way**: manufactured breakfast
cereal (muesli, granola, cornflakes, branded and unbranded alike) is
definitionally a multi-ingredient combination product — yet dozens of
real records (e.g. "Breakfast cereal muesli whole grain with fruit nuts
sugar etc. honey") were slipping through as whole food via
"whole"/"roasted"/"honey" matching, since nothing general excluded the
category itself. `cereal`/`cereals`/`muesli`/`granola`/`cornflakes`
added to `COMPOSITE_DISH_SIGNALS`.

**Real, concrete effect on all 32,707 already-ingested records** — the
largest single-pass reduction yet:

| | Before this pass | After this pass |
|---|---|---|
| Whole food | 17,467 | 17,109 |
| Not whole food | 7,514 | 8,458 |
| Needs human review | 7,726 | 7,140 |

Real, individually-verified impact: 44 goulash records, 22 meringue
records, 292 brand-name records, and 706 cereal/muesli/granola/cornflakes
records excluded. Every real USDA-graded/UHT-processed/BBQ'd legitimate
whole food spot-checked and confirmed still correctly classified.

97/97 classify.js tests passing (up from 83), 142/142 across the whole
pipeline. A real, honest, bounded limitation stated directly in the
code: `BRAND_NAMES` is a real, explicit, individually-verified list, not
a claim of covering every brand that could ever appear — a future report
naming one not caught here should be added the same way this list was
built.

## Status: a real, direct report closed two more concrete gaps — sausage-family compound names, and composite "in/with ... sauce" dishes

Reported directly: "'Palatine' bratwurst fried, in brown basic sauce
should not be in the list for me to view. These are already created
items with ingredients we can't account for, but if the user wants to
build them in the app using whole foods, then the ingredients need to be
there. That is the idea of this app."

Investigated against the actual real record, not assumed — it was
sitting in the review queue (`no_rule_matched`), and checking further
surfaced two real, distinct, confirmed gaps, not just the one reported
name:

1. **A real sausage-family naming gap.** "Bratwurst," "Bockwurst,"
   "Bierwurst," "Rostbratwurst," "Mettwurst," and "Leberwurst" are all
   real German compound words (no internal space for `PROCESSED_MEAT`'s
   existing `sausage` keyword's own word-boundary check to key off) —
   11 real, confirmed records (e.g. "Beef-Bratwurst grilled," "Bratwurst,
   chicken, cooked") were sitting at `is_whole_food: 1`, the exact same
   real category of product `sausage` already excludes, just under a
   different real name. Each added as its own explicit keyword to
   `PROCESSED_MEAT`.
2. **A real, precise "in/with ... sauce" composite-dish pattern**,
   distinct from a bare "sauce" keyword (which this project had already
   deliberately avoided, since 1,099 real records contain the standalone
   word "sauce," including genuinely simple, single-ingredient products
   like "Apple sauce, unsweetened"). Checked ~40 real records before
   writing anything: "Bratwurst fried, in beer sauce," "Chicken thigh
   boiled, in curry sauce," "Duck fried in oven, with oranges and sauce,"
   "Cod, in parsley sauce, frozen, boiled" — every one a real composite
   preparation (a protein or vegetable plus an unaccountable
   multi-ingredient sauce). A new `IN_OR_WITH_SAUCE_PATTERN` regex
   (`in`/`with`, up to 4 real words, then `sauce`) catches this real
   shape while leaving "Apple sauce"/"Applesauce" — no "in"/"with"
   precedes them — completely unaffected, matching the exact real
   distinction the app owner's own report draws: a single, known
   ingredient (apples, cooked and pureed) versus an already-made dish
   with ingredients this pipeline has no way to account for.

**Real, concrete effect on all 32,707 already-ingested records**: the
new sauce pattern alone caught 394 real records; the bratwurst-family
fix moved 11 confirmed false positives from `whole food` to `not whole
food`, with zero bratwurst/bockwurst/bierwurst records remaining
misclassified. 83/83 classify.js tests passing (up from 74), 128/128
across the whole pipeline.

| | Before this pass | After this pass |
|---|---|---|
| Whole food | 17,682 | 17,467 |
| Not whole food | 7,083 | 7,514 |
| Needs human review | 7,942 | 7,726 |

## Status: whole-food rules substantially tightened and expanded — a real, direct scope refinement from the app owner

A real, direct message reshaping the actual definition this whole
database runs on: "The only variation we should allow in the database is
whole food, dried whole food, fermented whole food, fresh squeezed or
pressed juice, or oil, and fresh harvest frozen whole food, including
dairy, cheeses, but we aren't tracking by the apple slice... We are not
including already made dish items, or non-whole food products." Followed
by four real, direct additions in the same conversation: breads ("because
of the expansion of who this app is for"), whole spices and fresh herbs
("flavor is the basis for enjoying the food"), flours in pulverized form
("for being able to bake things"), and traditional pantry staples —
sugar, brown sugar, baking soda, cacao, coffee, "and other things that
humans have been using for the past 100 years prior to the heavy
processing of foods began... we're trying to get them to understand what
it is they're putting into their body."

**Four brand-new positive categories built into `classify.js`, every one
of them designed against REAL data already in this database rather than
written speculatively** (the same discipline this whole pipeline has
held to throughout): oil, bread, flour, whole spices/fresh herbs, and a
fifth — traditional pantry staples (sugar, baking soda, baking powder,
cream of tartar, yeast, salt, cocoa/cacao, coffee). Each carries its own
real, targeted disqualifier list, checked only when that category's own
positive keyword already matched, so a disqualifier can never affect an
unrelated food (e.g. "sauce" disqualifies a matched spice/herb without
ever risking excluding a legitimate "Apple sauce, unsweetened").

**Two real, confirmed precedence bugs found and fixed along the way, not
just noted**: the general exclude gate now runs FIRST, ahead of every
positive rule — previously, "Kathrinchen honey gingerbread biscuits" (a
cookie) matched `NATURAL_SWEETENER_KEEP`'s own "honey" before the
exclude list ever got a chance to run, and the identical class of bug
existed for `SAFE_OVERRIDES`. A real, honest, still-open limitation is
named directly in the code rather than hidden: "Bagel with smoked salmon
cream cheese salad" still incorrectly matches as whole food, since no
safe, general exclude keyword actually applies to that specific
composite name without also risking excluding legitimate foods — left
for a human reviewer, exactly what the audit tool exists for.

**A real, iterative verification pass against actual database rows — not
just the synthetic test suite — caught a genuinely large real problem
before this was ever called done**: an early version of the new
spice/herb rule matched "cinnamon"/"parsley"/"poppy seed" inside dozens
of branded cereal products (Quaker Instant Oatmeal, Cheerios Apple
Cinnamon, Cinnamon Toast Crunch), composite baked desserts (cinnamon
rolls, yeast-dough pastries, fruit dumplings), and composite dishes
("Fish with sun-dried tomato parsley garlic") — none of which are the
plain spice itself. Fixed with a new, shared `PRODUCT_SIGNAL_DISQUALIFIERS`
list (cereal, roll, dumpling, dough, chocolate, confection, french
toast, smoothie, stuffed, prepackaged) reused across both the spice/herb
and pantry-staple checks. A second, narrower real collision was found
the same way: "baking soda" contains the standalone word "soda," which
was tripping the existing soft-drink exclude keyword before the new
pantry-staple rule ever ran — fixed with a small, explicit guard. A
third, separate real gap: "Olive oil vinaigrette sauce... prepackaged"
and "Fish oil, menhaden, fully hydrogenated" were both matching the bare
"oil" rule — fixed by adding `sauce`/`vinaigrette`/`hydrogenated`/
`prepackaged` to `OIL_DISQUALIFIERS`.

**`REFINED_SWEETENER` corrected, not just extended**: plain granulated/
powdered/white/brown sugar used to be a real EXCLUSION — reversed per
the app owner's own direct instruction, since crystallized cane/beet
sugar is a centuries-old refining process, not a modern industrial one.
What correctly stays excluded: corn syrup and high-fructose corn syrup
specifically (HFCS was first commercially produced in the 1970s — a
genuinely modern, industrial sweetener, not part of the "100 years prior
to heavy processing" framing the rest of this list now follows).

**Real, concrete before/after totals from re-running `classify.js`
against every one of the 32,707 already-ingested real records** (all
`reviewed=0`, since no real human review has happened yet — a genuine,
full re-classification, not a partial one):

| | Before this pass | After this pass |
|---|---|---|
| Whole food | 15,769 | 17,682 |
| Not whole food | 5,306 | 7,083 |
| Needs human review | 11,632 | 7,942 |

A real, substantial reduction in the ambiguous review queue (-3,690,
about 32% smaller) — the new categories gave a confident answer to
thousands of records that previously had no applicable rule at all, while
the precedence fixes correctly moved a real number of previously-wrong
`true` results (composite dishes, branded products) to `false`.

**74/74 real classify.js tests passing** (`classify.test.js`, up from
60 — every new category and every real bug found via live-data spot-
checking has its own regression test), **119/119 across the whole
pipeline**. A new, permanent `pipeline/reclassify-all.js` — the real CLI
entry point this project never had before for "re-run classification
across everything already ingested after a rule change," distinct from
`run-source.js`'s own per-source ingest pipeline.

## Status: Phase 3/4 review tool built — a real, working audit-tool webpage, published

**`audit-tool/unified-audit.html`** — the real, hand-authored template
(not yet holding any data of its own — `/*__DATA__*/` gets spliced in at
build time). Two real modes, matching the two real review queues this
project already has sitting in the database:

- **Whole-Food Classification** — a real, paginated, filterable/searchable
  table over every one of the 32,707 classify records (defaulting to the
  11,632 genuinely `low`-confidence ones), with **Whole food** / **Not
  whole food** / **Skip** actions per row.
- **Cross-Source Matching** — a real, paginated list of "specimen sheet"
  cards, one per match group, each showing every real member side by
  side with its own source and match method, with **Confirm this group**
  / **Flag for split** at the group level and a per-member **Remove**
  action for a genuinely bad match sitting inside an otherwise-correct
  group.

Design grounded directly in this app's own real, established tokens
(`constants/colors.ts` — Deep Navy `#2B3753` ground, the translucent
`rgba(69,84,111,.85)` surface family, warm gold for classification
actions, turquoise for matching actions, the app's own real status hues
reused for confidence/severity), a "specimen catalog" typographic
metaphor (Georgia-led serif for food names, a clean system-sans for
controls, tabular-nums monospace for ids/counts) — a deliberate,
committed single dark theme, matching every other Artifact this project
has already published rather than a light/dark toggle nothing else here
carries.

**Real decisions persist to `localStorage`** the same proven way the
other, existing Reference Database Audit tool already does, with the
same already-learned lesson applied from the start rather than
rediscovered the hard way a second time: native browser dialogs
(`window.confirm()`) are genuinely blocked inside a published Artifact's
sandboxed iframe, so "Clear all pending decisions" uses the same real
"click again within 4 seconds to confirm" in-page pattern, never a
native `confirm()` call.

**`pipeline/apply-audit-decisions.js`** — the real other half of the
round-trip, applying an exported decisions file back onto
`unified_foods.sqlite`: member removals first (so a group-confirm right
after only ever confirms whichever real members actually remain), then
group confirmations (`match_confidence = 'confirmed'`), then split flags
(a real, new `food_match_groups.needs_split` column — added via the
same conditional `ALTER TABLE` migration pattern this whole project
already uses everywhere else a column gets added after real data
exists), then classification decisions. **Naturally idempotent** —
re-applying the same or an overlapping export a second time is always a
safe no-op. Tested against a real, isolated seeded database
(`apply-audit-decisions.test.js`, 7/7 passing, including a real
re-apply-and-verify-no-double-effect check) — never touches the live
32,707-record database during testing (`UNIFIED_DB_PATH` env override,
same precedent as `SQLITE_EXE` throughout this pipeline).

**`pipeline/build-audit-tool.js`** — the real, permanent build step
tying the template and a fresh `export-audit-data.js` run together into
the one self-contained file that actually gets published. Refuses to
build if the real `</script`-inside-embedded-data risk is ever present
(checked every build, not assumed clean). Re-run both scripts, in order,
any time the tool needs republishing after a real review/apply pass:

```
node pipeline/export-audit-data.js && node pipeline/build-audit-tool.js
```

**Published**: https://claude.ai/code/artifact/51c33d40-cbd9-4468-90b0-e1e460fd5b1d
(7.11 MB, comfortably under the 16 MB Artifact ceiling).

**A real, honest finding surfaced immediately while sanity-checking the
tool's own embedded data, worth naming directly rather than glossed
over**: at least one proposed match group (Norway's own "Apple juice,"
`match_group_id=1`) bundles raw apple slices, dried apples, *and* apple
juice together under `match_method: 'latin_name'` — genuinely the same
species, but not genuinely the same food or preparation. This is a real,
live example of exactly the class of case the tool's own "Flag for
split" action exists to catch, not a bug in the tool itself — but it's
worth knowing going in that Tier 1 (Latin-name) matching is deliberately
species-level only, with no concept of preparation state, so a
meaningful share of the 757 matched-across-sources groups likely need
this same kind of real, human correction before Phase 5. Neither
`match.js` nor the schema were changed to address this automatically —
that's a real, substantive architecture question (should matching also
consider preparation state, not just species?) worth deciding
deliberately rather than patched in blind.

## Status: Phase 2 complete — all 9 real sources ingested, classified, and matched

**All 9 sources are in: Norway, Sweden, USDA, Canada, UK, Australia,
Germany, Japan, and France** — the original 7 pulled from a real,
already-unfiltered combine already sitting in this project's own
`ClaudeWork/unified_food_database_v3_full.sqlite.zip` (27,980 rows,
confirmed a genuine head start, not re-fetched from scratch), the other
2 from their own live APIs/exports as already documented below.

**Real, direct, confirmed finding before building anything**: of the 7
original sources, only France_Ciqual's own `food_name` was genuinely,
still French — USDA, Canada, UK, Australia, Germany, and Japan all
already carried real, usable English names (Germany and Japan had
already been translated at an earlier point in this project's own
history). Only France needed the same real `translate.js` pass already
proven on Sweden.

**Real, final combined totals**: 32,707 records. 15,769 whole food /
5,306 not / 11,632 needing human review. **757 groups matched across 2+
sources (2,005 real foods)**, 13,764 region-specific.

**Concrete, verified proof this actually works at scale**, not just
totals: "Honey" is correctly recognized as the same real food across
**all 7 original sources at once** — Norway's own "Honey," Sweden's
"Honung" (machine-translated), USDA's "Honey," Australia's "Honey,"
Germany's "Honig" (source-verified, pre-translated), Japan's "Honey,"
and France's "Miel" (machine-translated) — spanning three real
languages, unified into one group, each row honestly labeled by its
own real provenance. Basil matched across 6 sources; Cauliflower,
Spinach, Kale, Chives, Garlic, and Kohlrabi each across 5. Verified
directly against the real database, not assumed.

**Real, new infrastructure built along the way**: `sources/legacy-v3-shared.js`
(one shared adapter for all 7 legacy sources, since they share an
identical real schema — a real, standardized INFOODS/EuroFIR-style
nutrient tag vocabulary across all of them, confirmed directly, meaning
one nutrient mapping instead of seven); `sources/legacy-v3-extract.js`
(real, working zip extraction via PowerShell's own `Expand-Archive`,
verified from a clean state, not just trusted from a manual copy);
`unified-database/.cache/` (git-ignored — the real, large extracted
legacy database, 120MB, regenerable on demand, not something worth
committing).

**Two more real bugs found and fixed at this larger scale**: `ENOBUFS`
crashes in both `classify.js`'s and `match.js`'s own internal queries
once the database passed a few thousand rows — Node's default 1MB
`execFileSync` buffer was too small; fixed with the same `maxBuffer`
increase already applied elsewhere in the pipeline.

## Status: Phase 2 underway — Norway and Sweden both ingested and verified for real (superseded above, kept for its own real history)

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

## Real machine translation, and a 5th real bug it surfaced — now fixed, with genuine cross-source matches confirmed

**`pipeline/translate.js`**: real, working, keyless translation via
translate.googleapis.com's own unofficial endpoint (confirmed live and
accurate before being built on: "Nöt talg" → "Beef tallow," "Kokosmjölk,
lätt" → "Coconut milk, light"). Real, honestly-tracked provenance: a new
`raw_foods.name_english_source` column distinguishes `'source_verified'`
(Norway's own real `/en/` API data) from `'machine_translated'` — the
same discipline this whole project already holds every other unverified-
but-useful signal to (the Wentz healing-stages framework, the Purple
Digest's own AI-opinion entries). Real, defensive batching (max 100
items or ~4,000 characters per request, a respectful delay between
batches, and a hard line-count check that treats a misaligned response
as a fully failed batch rather than risk attaching the wrong English
name to the wrong food).

Ran for real against Sweden's 2,606 untranslated names: **all 2,606
succeeded, 0 failed**, in 12-31 seconds depending on the run.

**Translating Sweden immediately surfaced a 5th real bug — the actual,
live blocker preventing any real cross-source match at all**, not a
remote, theoretical gap: a newly-classified row could only ever match
*other new rows in the same run*, never join an *existing* group from
Norway's own earlier pass. Fixed with a new `matchAgainstExistingGroups`
in `match.js`, using the exact same tiered precedence and the exact
same "a row with a known Latin name is never overridden by a weaker
signal" protection already proven for the peer-to-peer cascade — just
checked against a different, older pool of candidates.

**Real, verified result after the fix**: 37 of Sweden's 883 newly-
whole-food rows correctly joined existing Norway groups. Directly
confirmed with real examples, not just totals — Norway's own 23-cut
beef group (already correctly species-matched via Latin name) gained
two real Swedish beef cuts ("Nöt ryggbiff rå," "Nöt oxfilé rå," both
machine-translated to "Beef tenderloin raw"); Norway's carrot juice
correctly joined by Sweden's "Morotsjuice" → "Carrot juice"; Brussels
sprouts, basil, both correct too. This is the actual payoff the whole
architecture was built for, now real and demonstrated, not theoretical.

**Final, current combined state**: 4,727 records (2,121 Norway + 2,606
Sweden). 1,698 whole food / 710 not / 2,319 needing human review. 121
groups matched across 2+ sources (476 real foods), 1,222 region-specific.

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
2. ~~**Phase 2: real source ingestion.**~~ Done — all 9 sources ingested,
   classified, translated where needed, and matched (see this
   document's own status section above for the real, current totals
   and the "Honey across 7 sources" proof).
3. ~~**Phase 3: whole-food classification review.**~~ The real
   audit-tool webpage is built and published (see status above) — actual
   human review of the 11,632 records still sitting in "needs review" is
   the real, standing next step, not yet done.
4. ~~**Phase 4: cross-source matching review.**~~ The same tool covers
   this too — actual human review/confirmation of the 757 matched
   groups (and a decision on the 13,764 region-specific ones) is the
   real, standing next step, not yet done. See the status section
   above's own honest note on the real "Apple juice" preparation-state
   finding worth keeping in mind while reviewing.
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
node pipeline/match.test.js           # 15/15
node pipeline/ingest.test.js          # 10/10
node pipeline/run-source.test.js      # 6/6
node pipeline/translate.test.js       # 7/7 (real, live network call)
node pipeline/run-source.js sources/norway.js       # real, live ingest + classify + match against Norway's actual API
node pipeline/run-source.js sources/sweden.js       # real, live ingest + classify + match against Sweden's actual export
node pipeline/translate-source.js Sweden_Livsmedelsverket   # real translation, then re-classify + re-match
node pipeline/run-source.js sources/usda.js         # real ingest from the legacy v3 combine (auto-extracts ClaudeWork's own zip on first run)
node pipeline/run-source.js sources/uk.js
node pipeline/run-source.js sources/australia.js
node pipeline/run-source.js sources/canada.js
node pipeline/run-source.js sources/germany.js
node pipeline/run-source.js sources/japan.js
node pipeline/run-source.js sources/france.js       # goes to "needs review" first -- food_name is genuinely still French
node pipeline/translate-source.js France_Ciqual     # real translation, then re-classify + re-match
node pipeline/seed-and-run-e2e.js     # real, seeded end-to-end proof (not permanent data)
```
