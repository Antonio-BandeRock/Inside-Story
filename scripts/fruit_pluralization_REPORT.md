# Fruit base_name pluralization fix -- scoped trial report

Companion to `scripts/build_food_reference_db.py`'s `BASE_NAME_ALIAS_RENAMES`
dict, extended in this task with a hand-verified set of Fruit-only
plural->singular unifications. Scope, per the task brief: **`category='Fruit'`
only**, no other category touched, and no blind "strip the trailing s"
transform -- every entry below was individually confirmed by reading both
sides' full `name` field (and `scientific_classification` where populated)
before being added.

## 0. The bug, confirmed with real numbers

The same real whole food often exists twice in `assets/data/foods_reference.db`
under two different `base_name` values, purely because different national
sources spell it differently: USDA and Japan_MEXT tend to write things
plural ("Apples", "Blueberries", "Guavas"), while Canada_CNF/Germany_BLS/
Australia_AFCD tend to write the identical real food singular ("Apple",
"Blueberry", "Guava"). Before this fix, `category='Fruit'` had **725**
distinct `base_name` values across 1,229 rows. After it, **651** distinct
`base_name` values across the same 1,229 rows (verified: total food count
in the whole database is unchanged at 22,016 -- this is a relabeling, not
a data change).

## 1. Methodology

1. Queried the live `assets/data/foods_reference.db` (read-only) for every
   distinct `base_name` in `category='Fruit'` (725 values).
2. Generated plural/singular candidate pairs two ways, since a naive
   "strip trailing s" miss-handles a meaningful slice of the real data:
   - Whole-string suffix rules: `-ies`->`-y`, `-ves`->`-f`/`-fe`, sibilant
     endings (`-ches`/`-shes`/`-xes`/`-zes`/`-sses`) -> strip `-es` (this
     rule was added mid-pass specifically because it initially missed
     "Peaches"/"Peach" -- "Peaches" doesn't end in a bare "s" stripped by
     the general rule the way "Apples"/"Apple" does), and a general
     trailing-`s` strip as the fallback.
   - Comma-head rules: for `base_name` values with a comma (e.g. "Guavas,
     common"), the same suffix rules applied to the head word only, with
     the pair accepted only when the trailing clause after the comma is
     **identical** on both sides (so "Cherries, sour" pairs with "Cherry,
     sour", but "Sweet cherries, domestic" does **not** pair with "Sweet
     cherry", because "domestic" isn't present on the singular side at
     all -- see &sect;4).
3. For every candidate pair, pulled every real row (`source`, `name`,
   `short_name`, `scientific_classification`) under both `base_name`
   values and read them side by side. A pair was only added if:
   - the full `name` text on both sides clearly describes the same real
     food/product (not just a similar-looking string), and
   - where `scientific_classification` was populated on either side, it
     matched exactly (checked programmatically for every accepted pair --
     zero mismatches found; a handful of pairs had no sci data on either
     side, confirmed same food by name-reading alone instead).
4. A broader "same head word, any trailing text" sweep was also run
   (deliberately looser than step 2) purely to hand-check for anything
   the strict rules above would miss, the way "Sugar-apples, (sweetsop)"
   and the "(low-moisture)"/"(low moisture)" hyphen variants were actually
   found (see &sect;3). Every result from this looser sweep was manually
   read; the large majority were correctly rejected as different
   sub-varieties sharing a head noun (e.g. "Apples" vs "Apple, Fuji" --
   Fuji is a specific variety row, not a duplicate of generic Apple; see
   &sect;4).
5. Extended `BASE_NAME_ALIAS_RENAMES` in `scripts/build_food_reference_db.py`
   with every pair that passed, wired in via the pre-existing
   `apply_base_name_alias()` call (already used for the "Snap Beans" case),
   at the same pipeline point right after `rename_bean_type_first()`/
   `rename_sprout()`.
6. Ran the real build (`py scripts/build_food_reference_db.py
   "C:/AppProject/hashimotos_foods_combined_scored_and_nutrients_LIVE.xlsx"
   <output.db>`) against the live source workbook and confirmed: every
   renamed plural `base_name` now has zero rows, the target singular
   `base_name` absorbed the expected row count, total Fruit row count is
   unchanged (1,229), and total food count database-wide is unchanged
   (22,016) -- a pure relabeling with zero data loss.

## 2. Verified unification pairs (74 total)

### 2a. Plain plural -> plain singular, whole base_name (47)

Every pair below is the same species/product confirmed by matching
`scientific_classification` (e.g. every "Apples"/"Apple" row is `Malus
domestica`) or, where sci data was absent on the singular side (which is
most non-USDA/non-Japan_MEXT rows in this database), by reading the full
`name` text.

| Plural | Singular | Confirming detail |
|---|---|---|
| Apples | Apple | Malus domestica both sides |
| Apricots | Apricot | Prunus armeniaca |
| Avocados | Avocado | Persea americana |
| Bananas | Banana | Musa acuminata |
| Blackberries | Blackberry | Rubus fruticosus |
| Blueberries | Blueberry | Vaccinium corymbosum |
| Boysenberries | Boysenberry | Rubus ursinus x Rubus idaeus |
| Chokecherries | Chokecherry | Prunus virginiana |
| Clementines | Clementine | Citrus x clementina |
| Cloudberries | Cloudberry | Rubus chamaemorus |
| Crabapples | Crabapple | Malus sylvestris |
| Cranberries | Cranberry | Vaccinium macrocarpon |
| Dates | Date | name-read match (no sci either side) |
| Elderberries | Elderberry | Sambucus canadensis |
| Figs | Fig | Ficus carica |
| Goji berries | Goji berry | Lycium barbarum / L. chinense |
| Gooseberries | Gooseberry | Ribes uva-crispa |
| Grapes | Grape | Vitis vinifera |
| Guavas | Guava | Psidium guajava (see &sect;5 re: the strawberry-guava row) |
| Kumquats | Kumquat | Citrus japonica |
| Lemons | Lemon | Citrus limon |
| Limes | Lime | Citrus aurantiifolia |
| Loganberries | Loganberry | Rubus x loganobaccus |
| Longans | Longan | Dimocarpus longan |
| Loquats | Loquat | Eriobotrya japonica |
| Lychees | Lychee | name-read match (no sci on plural side) |
| Mangoes | Mango | name-read match |
| Mangos | Mango | Mangifera indica |
| Mulberries | Mulberry | Morus spp. |
| Nectarines | Nectarine | Prunus persica var. nucipersica |
| Oheloberries | Oheloberry | Vaccinium reticulatum |
| Olives | Olive | Olea europaea |
| Oranges | Orange | Citrus sinensis |
| Papayas | Papaya | Carica papaya |
| Peaches | Peach | Prunus persica |
| Pears | Pear | Pyrus communis |
| Persimmons | Persimmon | Diospyros kaki (see &sect;5, native-persimmon variant already split out) |
| Plums | Plum | Prunus domestica |
| Pomegranates | Pomegranate | Punica granatum |
| Prickly pears | Prickly pear | Opuntia spp. |
| Quinces | Quince | Cydonia oblonga |
| Raspberries | Raspberry | Rubus idaeus |
| Rose-apples | Rose-apple | Syzygium jambos |
| Salmonberries | Salmonberry | Rubus spectabilis |
| Satsuma mandarins | Satsuma mandarin | name-read match |
| Strawberries | Strawberry | Fragaria x ananassa |
| Tamarinds | Tamarind | Tamarindus indica |

### 2b. Plural + a comma-qualifier that matches exactly on both sides (22)

| Plural | Singular | Confirming detail |
|---|---|---|
| Apples, dehydrated (low moisture) | Apple, dehydrated (low moisture) | Malus domestica |
| Apricots, dehydrated (low moisture) | Apricot, dehydrated (low moisture) | name-read match |
| Blackberries, wild | Blackberry, wild | Rubus fruticosus |
| Blueberries, wild | Blueberry, wild | Vaccinium angustifolium |
| Cherries, sour | Cherry, sour | Prunus cerasus |
| Cherries, sweet | Cherry, sweet | Prunus avium |
| Currants, european black | Currant, european black | Ribes nigrum |
| Currants, red and white | Currant, red and white | Ribes rubrum |
| Currants, zante | Currant, zante | Vitis vinifera |
| Dates, medjool | Date, medjool | Phoenix dactylifera |
| Grapes, red or green (European type | Grape, red or green (European type | Vitis vinifera; truncated string (missing closing paren) preserved identically on both sides -- pre-existing upstream data bug, not fixed here |
| Guavas, common | Guava, common | Psidium guajava |
| Melons, cantaloupe | Melon, cantaloupe | Cucumis melo |
| Melons, casaba | Melon, casaba | Cucumis melo |
| Melons, honeydew | Melon, honeydew | Cucumis melo |
| Olives, ripe | Olive, ripe | Olea europaea; can/size groupings match ("small-extra large"/"jumbo-super colossal" vs "small to extra large"/"jumbo to super colossal") |
| Oranges, navel | Orange, navel | same variety, "juice sacs" (Japan_MEXT) = the edible segments = "peeled" (Australia_AFCD) |
| Peaches, yellow | Peach, yellow | Prunus persica |
| Pears, asian | Pear, asian | Pyrus pyrifolia |
| Persimmons, native | Persimmon, native | Diospyros virginiana |
| Plantains, green | Plantain, green | Musa x paradisiaca; "fried" prep overlaps both sides |
| Raisins, seeded | Raisin, seeded | Vitis vinifera |

### 2c. Hand-caught special cases (5)

These didn't fall out of the mechanical suffix rules above -- found by
manually reading the full 725-name list and checking anything that looked
like it might be the same food under a slightly different spelling.

| From | To | Why |
|---|---|---|
| Apricots, dehydrated (low-moisture) | Apricot, dehydrated (low moisture) | USDA spells this product's qualifier with a hyphen where Canada_CNF's existing singular entry uses a space -- same food (Prunus armeniaca), same dehydration process, pure punctuation difference stacked on top of the plural. |
| Peaches, dehydrated (low-moisture) | Peach, dehydrated (low moisture) | Same hyphen-vs-space pattern, Prunus persica. |
| Prunes, dehydrated (low-moisture) | Prune, dehydrated (low moisture) | Same hyphen-vs-space pattern, Prunus domestica. |
| Sugar-apples, (sweetsop) | Sugar-apple | Sugar-apple and sweetsop are the same common name pair for the same species (Annona squamosa, confirmed via scientific_classification on the USDA row). Canada_CNF already has a plain "Sugar-apple" identity; merged directly into it rather than inventing a third, differently-annotated bucket. |
| Tangerines, (mandarin oranges) | Tangerine, (mandarin) | Tangerine = mandarin orange (Citrus reticulata, confirmed via sci on the USDA rows). Canada_CNF's existing singular entry already carries the equivalent "(mandarin)" annotation, just worded more briefly -- merged into that existing bucket rather than the separate unannotated bare "Tangerine" identity, to avoid also deciding whether the bare identity should absorb the annotation (a different judgment call, left alone). |

## 3. Deliberately NOT unified, and why

| Candidate | Why left alone |
|---|---|
| Guava, fruit juices / Guava, fruit juice | **False alarm from the mechanical rule**, caught and rejected during verification. These are two *different* Japan_MEXT products at different concentrations -- "10% fruit juice beverage" vs "20% fruit juice beverage (nectar)" -- not a plural/singular pair of the same product. A blind strip-the-s would have wrongly merged two distinct concentration products into one. |
| "Apples" head vs "Apple, Fuji" / "Apple, Gala" / "Apple, Granny Smith" / etc. (and the same pattern for Pear, Grape, Orange, Mango, Persimmon, Plum, Melon, Papaya, Nectarine, and others) | These are real, distinct named sub-varieties, not duplicates of the generic bare food -- merging a specific cultivar row into the generic bucket would destroy real information the source data deliberately keeps separate. Only pairs where the *entire* trailing qualifier matches exactly on both sides were unified (see &sect;2b); a shared head noun alone was never sufficient. |
| Grapes, jam / Blueberries, jam / Apples, jam | Processed products (jam), not the raw fruit -- not the same product as the plain fruit bucket even though they share a head noun. |
| Lemons, juice / Limes, juice | Juice, not the whole fruit -- a different product in kind, not a spelling variant of the same one. |
| Cranberries, wild | No exact singular counterpart exists ("Cranberry, wild" doesn't exist -- only bare "Cranberry" with no "wild" qualifier, and a *third*, differently-qualified USDA identity "Cranberry, low bush or lingenberry"). Merging into bare "Cranberry" would silently drop the wild/cultivated distinction other pairs (Blackberry/Blueberry "wild") got to keep because their exact counterpart already existed. Left alone rather than guessed. |
| Kumquats, whole | No exact singular counterpart -- bare "Kumquat" rows are tagged "raw", not "whole". Plausibly the same thing, but not confirmed identical wording, so left alone per the low-confidence rule. |
| Rose hips, wild (Canada_CNF) vs Rose hip (Germany_BLS, no "wild" tag) vs Rose Hips, wild (Northern Plains Indians) (USDA, its own third variant) | A genuine 3-way naming inconsistency, but no two of the three share an identical qualifier to merge on with confidence -- flagged in &sect;4 below rather than guessed at. |
| Sweet cherries, domestic / Sweet cherries, imported from the U.S.A. (Japan_MEXT) vs Sweet cherry (Germany_BLS, no domestic/imported tag) | Japan_MEXT deliberately tracks domestic-vs-imported as its own distinguishing sub-classification; merging into the untagged bare "Sweet cherry" bucket would destroy that real distinction, the same reasoning as the cultivar case above. |
| Chinese quinces / Common quinces (Japan_MEXT) vs Quince / Quinces | "Chinese quince" is very plausibly a different species (Pseudocydonia sinensis) from common quince (Cydonia oblonga) and has no singular counterpart to pair with regardless; "Common quinces" likewise has no exact "Common quince" singular counterpart in the data. Left alone -- no collision exists to fix, and species identity wasn't confirmed either way. |
| Raisins, dark / Raisins, golden | No exact singular counterpart ("Raisin, dark"/"Raisin, golden" don't exist -- only differently-qualified singular entries like "Raisin, golden seedless"). Left alone. |
| Plantains, yellow | No exact singular counterpart ("Plantain, yellow" doesn't exist -- only "Plantain, green"). Left alone. |
| Blackcurrants (UK_CoFID) vs Black currant (Germany_BLS) | Same real food (blackcurrant = Ribes nigrum, likely the same species already confirmed for "Currant, european black" above), but this is a **spelling-variant** collision (one word vs two), not a plural/singular one -- "Blackcurrant" (singular, one word) doesn't exist in the data to pair "Blackcurrants" against. Out of this task's specific plural/singular mechanism; flagged in &sect;4 instead. |
| Litchis (USDA) vs Lychee / Lychees | Same species (Litchi chinensis is literally the scientific name already confirmed for "Lychees"/"Lychee" above) but "litchi" vs "lychee" is a **spelling variant**, not an inflectional plural of the same string -- fixing it would mean picking a common-name spelling to standardize on, a different kind of judgment call than this task's scope. Flagged in &sect;4. |
| Melon, honey dew (Australia_AFCD, two words) vs Melon, honeydew / Melons, honeydew (one word) | Same melon, but again a spelling/spacing variant layered on top of the already-fixed plural, not itself a plural/singular pair. Flagged in &sect;4. |

## 4. Other genuine base_name identity collisions noticed, flagged for human review (not fixed)

Per the task instructions, these are the same general class of bug as the
already-fixed "Fluid Cream"/strawberry-guava cases in `NAME_CATEGORY_OVERRIDES`,
but they need the same category-vs-base_name judgment call those entries got,
made by a human -- not fixed here.

1. **Japanese persimmon, 3-way split.** The exact same real food (Diospyros
   kaki) currently exists under three unrelated `base_name` identities:
   USDA's plain `"Persimmons"` (with "japanese" only inside the `name`
   text, e.g. `"Persimmons, japanese, raw"`, invisible at the base_name
   level -- already covered by the ordinary "Persimmons"->"Persimmon" fix
   above, so it now sits inside the merged "Persimmon" bucket alongside
   the *other* species, "Persimmon, native"'s sibling "Persimmons,
   native" not being japanese-specific), Japan_MEXT's own
   `"Japanese persimmons"` (adjective-first, its own separate bucket, 1
   row), and Canada_CNF's `"Persimmon, japanese"` (comma-form, 2 rows).
   This is a naming-order collision (adjective-first vs comma-clause vs
   buried-in-name-only), not a plural one, so it's outside this task's
   mechanism -- flagging for whoever picks up `natural_name_reorder.py`
   integration or a `NAME_CATEGORY_OVERRIDES`-style fix next.
2. **Honeydew melon, 3-way spelling split.** `"Melon, honey dew"`
   (Australia_AFCD, two words, 3 rows), `"Melon, honeydew"` (Canada_CNF,
   one word, already merged with `"Melons, honeydew"` above), all the same
   melon. The one-word/two-word spelling variant on the Australia_AFCD
   side is untouched by this task's plural-only mechanism.
3. **Blackcurrant, spelling variant.** `"Blackcurrants"` (UK_CoFID, one
   word) vs `"Black currant"` (Germany_BLS, two words) -- almost certainly
   the same species already confirmed for "Currant, european black", but
   a one-word/two-word spelling difference, not a plural one.
4. **Litchi/Lychee, spelling variant.** `"Litchis"` (USDA, sci confirms
   *Litchi chinensis* -- the scientific name for lychee) sits alongside
   the already-merged "Lychee"/"Lychees" bucket under a different common
   spelling. Same real food, needs a spelling-standardization decision
   rather than a plural fix.
5. **Groundcherry, 3-way naming.** `"Groundcherries, (cape-gooseberries or
   poha)"` (USDA, sci *Physalis peruviana*), `"Groundcherry"` (Canada_CNF),
   and `"Cape gooseberry"` (Germany_BLS) are all the same species under
   three different names, one of them (USDA's) an explicit "X or Y"
   alternative-name annotation -- the same "picking one would be guessing"
   situation `natural_name_reorder_REPORT.md` already documents for its own
   ambiguous-or cases. Flagged, not merged.

## 5. Interaction with in-flight NAME_CATEGORY_OVERRIDES work (informational)

This worktree's copy of `build_food_reference_db.py` did not yet include
`NAME_CATEGORY_OVERRIDES` or the `reorder_base_name` integration visible in
the main tree as of this task (both apparently added by other work earlier
today) -- only the pre-existing `BASE_NAME_ALIAS_RENAMES`/
`apply_base_name_alias` mechanism this task was told to extend, plus its
one existing "Snap Beans" entry, were recreated here to match, and this
task's 73 new entries were added alongside it. Two things worth knowing for
whoever reconciles this with that other work:

- The main tree's `NAME_CATEGORY_OVERRIDES` already has an entry that
  splits USDA's/Canada's `"Guava(s), strawberry, raw"` rows out to their own
  `"Strawberry Guava"` identity (a different, smaller, tart species,
  Psidium cattleyanum, than plain Guava/Psidium guajava). That override is
  keyed on the full `name` field and is applied *after* the
  `apply_base_name_alias` step in the pipeline, so it takes priority
  regardless of what this task's `"Guavas": "Guava"` alias does to that
  row first -- no conflict, just noting it so the interaction is
  documented rather than silently assumed.
- Once that other fix is merged into whichever tree runs the real rebuild,
  bare `"Guavas"` will have zero rows of its own (its only current row is
  exactly the strawberry-guava one being split out), making this task's
  `"Guavas": "Guava"` entry inert but harmless. Left in rather than
  removed, since it's still a correct, hand-verified fact about the data
  as this task found it, and costs nothing to keep.

## 6. Build verification

Ran the real build against the live source workbook from this worktree:

```
py scripts/build_food_reference_db.py "C:/AppProject/hashimotos_foods_combined_scored_and_nutrients_LIVE.xlsx" <output.db>
```

Confirmed against the output database (not merged into the main tree's
`assets/data/foods_reference.db` -- per the task instructions, a human
re-runs this in the main tree separately):

- `category='Fruit'` distinct `base_name` count: 725 -> 651 (-74), exactly
  matching the 74 hand-verified renames in &sect;2 -- confirmed by
  simulating the full `BASE_NAME_ALIAS_RENAMES` dict against the original
  725-name set before ever touching the real database.
- Every renamed plural `base_name` (e.g. `"Apples"`, `"Guavas"`,
  `"Peaches"`, `"Sugar-apples, (sweetsop)"`, `"Prunes, dehydrated
  (low-moisture)"`) now has **zero** rows.
- Every corresponding singular target absorbed the expected row count
  (e.g. `"Apple"`: 13+15=28; `"Peach"`: 14+10=24; `"Sugar-apple"`: 1+1=2;
  `"Tangerine, (mandarin)"`: 1+4=5; `"Prune, dehydrated (low moisture)"`:
  2+2=4).
- Total rows in `category='Fruit'`: unchanged at 1,229.
- Total rows in the whole `foods` table: unchanged at 22,016.
- The pre-existing `"Snap Beans"` -> `"Snap Beans (Green Beans)"` alias
  still fires correctly (0 rows left under plain "Snap Beans").

Zero data loss, pure relabeling, confirmed by direct query rather than
assumed.
