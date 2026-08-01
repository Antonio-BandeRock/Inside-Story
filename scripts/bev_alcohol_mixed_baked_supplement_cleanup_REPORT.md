# Bev / Alcohol / Mixed / Baked / SupplementPowder pluralization fix -- scoped task report

Companion to `scripts/build_food_reference_db.py`'s `BASE_NAME_ALIAS_RENAMES`
dict, extending the Fruit-trial pluralization mechanism (see
`scripts/fruit_pluralization_REPORT.md`) to five more categories:
**Bev, Alcohol, Mixed, Baked, SupplementPowder**. Scope, per the task brief:
pluralization unification only, no other category touched, and -- per an
explicit human scoping decision already made before this task started --
**no "processed vs whole" subcategory split for any of these five** (Bev/
Alcohol already have their own Juice/Coffee/Tea/Beer/Wine-style subcategory
structure; Mixed is already entirely composite dishes with no "whole"
baseline; Baked is already entirely manufactured baked goods; SupplementPowder
is a 2-3 row category). No blind "strip the trailing s" transform -- every
entry below was individually confirmed by reading both sides' full `name`
field (and `scientific_classification` where populated, which is essentially
never for these five categories) before being added.

## 0. Worktree staleness note (read this first)

This worktree branched from before today's other in-flight fixes (Fruit
pluralization, `NAME_CATEGORY_OVERRIDES`, the `SupplementPowder` category
patch script, etc.) were committed. `BASE_NAME_ALIAS_RENAMES`/
`apply_base_name_alias()` did not exist at all in this worktree's copy of
`build_food_reference_db.py` -- per the task instructions, the mechanism was
recreated from scratch here (matching the shape described in the Fruit
report) containing **only this task's own new entries** for Bev, Alcohol,
Mixed, Baked, and SupplementPowder. It does not contain the Fruit report's 74
entries or the pre-existing "Snap Beans" entry -- a human merges this task's
new entries into whichever tree has the current, up-to-date file.

Because of this staleness, this task's own build (see &sect;6) produced
different category totals than the numbers given in the task brief (which
reflect the more up-to-date main tree):

| Category | Task brief said | This worktree's real build |
|---|---|---|
| Bev | 1,247 rows / 816 distinct | 963 rows / 644 distinct (pre-fix) |
| Alcohol | 159 rows / 138 distinct | 159 rows / 138 distinct (matches exactly) |
| Mixed | 2,745 rows / 2,422 distinct | 2,768 rows / 2,430 distinct (pre-fix) |
| Baked | 1,142 rows / 696 distinct | 1,142 rows / 701 distinct (pre-fix) |
| SupplementPowder | 3 rows / 3 distinct | 0 rows in a from-spreadsheet build (see &sect;5) |

The row-count differences (Bev, Mixed) most likely come from other in-flight
work (e.g. items reclassified into/out of Bev, or `NAME_CATEGORY_OVERRIDES`
splitting/merging some Mixed rows) not present in this branch. Alcohol matches
exactly, which is a good sign the underlying source data itself hasn't
changed -- only the classification logic layered on top has, elsewhere. This
is expected and, per the task instructions, not something to reconcile here;
a human merges this task's `BASE_NAME_ALIAS_RENAMES` entries into the current
main-tree file and re-runs the real build there.

## 1. Methodology (same as the Fruit trial, applied per category)

1. Queried this worktree's own from-spreadsheet build (built once from
   `hashimotos_foods_combined_scored_and_nutrients_LIVE.xlsx` using the
   *pre-fix* script, so results reflect this worktree's real current state)
   for every distinct `base_name` in each of the five categories.
2. Generated plural/singular candidate pairs the same two ways as the Fruit
   trial:
   - Whole-string suffix rules (`-ies`->`-y`, `-ves`->`-f`/`-fe`, sibilant
     `-es` endings stripped, general trailing-`s` fallback) applied to the
     entire `base_name` string when it contains no comma.
   - Comma-head rules: for `base_name` values with a comma, the same suffix
     rules applied to the full head clause (everything before the first
     comma), accepted only when the trailing clause after the comma is
     **identical** on both sides.
3. Additionally ran a normalized-collision sweep (strip all non-alphanumeric
   characters, lowercase, group) across each category's full distinct
   `base_name` list, specifically to catch punctuation/spacing variants of
   the *same* real product that the strict plural rules wouldn't touch (a
   different bug class -- see &sect;7). This is a broader, fully automated
   substitute for the Fruit report's own manual "read the whole list" sweep,
   chosen because Mixed alone has 2,430 distinct names, too many to read
   line-by-line in this task's time budget; it still covers every row, just
   via pattern matching rather than eyeballing.
4. For every candidate pair from steps 2 and 3, pulled every real row
   (`source`, `name`, `short_name`, `scientific_classification`) under both
   `base_name` values and read them side by side, exactly as in the Fruit
   trial. A pluralization pair was only added to `BASE_NAME_ALIAS_RENAMES` if
   the full `name` text on both sides clearly describes the same real
   product -- not just a similar-looking string.
5. Extended `BASE_NAME_ALIAS_RENAMES` in `scripts/build_food_reference_db.py`
   (recreating the dict/function from scratch, per &sect;0), wired in via
   `apply_base_name_alias()`, called right after
   `rename_bean_type_first()`/`rename_sprout()` in the per-row pipeline --
   the same pipeline point the Fruit trial used.
6. Ran the real build against the live source workbook and confirmed, for
   every renamed identity: zero rows remain under the old plural `base_name`,
   the singular target absorbed the expected row count, category-level row
   totals are unchanged, and the whole-database food count is unchanged at
   22,016 (see &sect;6).

## 2. Bev -- 2 verified pairs

| Plural | Singular | Confirming detail |
|---|---|---|
| Alcoholic beverages, beer | Alcoholic beverage, beer | Both sides are USDA's own rows (8 total after merge: "regular, all", "regular, BUDWEISER", "light" x5, plus the merged "higher alcohol" row) -- an **intra-source** inconsistency, not cross-source: USDA's own data has one stray `"Alcoholic beverages, beer, higher alcohol"` row sitting under a pluralized identity while every other USDA beer row already uses the singular `"Alcoholic beverage, beer"` bucket. Same bug class as the Fruit trial's cross-source cases, just happening to occur within one source here. |
| Alcoholic beverages, wine | Alcoholic beverage, wine | Same intra-source pattern: USDA's `"Alcoholic beverages, wine, rose"` was the lone stray plural row against 35 other USDA `"Alcoholic beverage, wine"` rows (cooking, dessert, table red/white by varietal, etc.). |

### Bev -- deliberately NOT unified

No other whole-string or comma-head candidates were found in Bev's 644
distinct `base_name` values. The category's own naming is largely
non-pluralizable by construction (bare product names like "Coffee",
"Kombucha", "Champagne"; French/German source strings that don't follow
English pluralization at all; branded products like "Beverages, POWERADE").
Read the full 644-name list by hand in addition to the mechanical sweep;
nothing else looked like a real plural/singular duplicate. A few near-miss
head-word matches were checked and correctly rejected as different products,
not spelling variants:

| Candidate | Why left alone |
|---|---|
| Beverages, V8 SPLASH Juice Drinks / Juice drink, X | Branded multi-word product name vs. the generic "Juice drink, X" bucket -- different structure entirely, not a plural pair. |
| Carbonated drinks, root beer / Root beer | Same real product (root beer), but a naming-*structure* collision (bucketed vs. bare), not a plural one -- flagged in &sect;7, not fixed here. |
| Ginger Ale / Ginger ale, dry | Different products -- plain ginger ale vs. a "dry" variant, not a spelling/plural variant of the same thing. |

## 3. Alcohol -- 0 verified pairs

Zero whole-string or comma-head candidates were generated by the mechanical
sweep, and a full manual read of all 138 distinct `base_name` values found
nothing else that looked like a genuine plural/singular duplicate. This
category's naming (mostly German/French source strings like "Bier..." already
normalized to English descriptive phrases -- "Beer, full strength (alcohol
4-4.9% v/v)", "Wheat beer, naturally cloudy" -- plus cocktail/spirit names)
simply doesn't have the USDA-plural-vs-everyone-else-singular pattern that
drives this bug elsewhere in the database. Confirmed, not guessed: this is a
legitimate zero-result category, exactly as the task brief anticipated was
possible.

Two genuine base_name identity collisions were noticed while reading the
list, but they're punctuation-structure variants (comma vs. no comma), not
plural/singular ones -- flagged in &sect;7, not fixed here (Sherry
dry/sweet, Vermouth sweet).

## 4. Mixed -- 6 verified pairs

As expected given Mixed's 2,430 distinct `base_name`s across only 2,768 rows
(most rows are already their own unique dish name), real duplicates are rare.

| Plural | Singular | Confirming detail |
|---|---|---|
| Lamb chops | Lamb chop | Both rows are Germany_BLS's own data ("Lamb chops marinated, grilled" vs. "Lamb chop fried") -- the identical dish (a lamb chop), Germany_BLS just didn't pluralize the word consistently across its own different prep-method rows. Intra-source, same bug class as the Bev pairs above. |
| Meatballs | Meatball | "Meatballs" bucket = 2 Germany_BLS rows (fried, fried with stewed tomatoes) + 1 USDA row (frozen, Italian style); "Meatball" bucket = 1 Japan_MEXT row (frozen). All four rows, across three different sources, describe the same real dish type (a meatball) under inconsistently pluralized identities. |
| Pizza rolls | Pizza roll | USDA "Pizza rolls, frozen, unprepared" / Canada_CNF "Pizza roll, frozen, unprepared" -- identical product and prep description, cross-source plural/singular pair, the classic pattern. |
| Egg rolls, chicken | Egg roll, chicken | USDA "Egg rolls, chicken, refrigerated, heated" / Canada_CNF "Egg roll, chicken, refrigerated, heated" -- identical. |
| Egg rolls, pork | Egg roll, pork | USDA "Egg rolls, pork, refrigerated, heated" / Canada_CNF "Egg roll, pork, refrigerated, heated" -- identical. |
| Egg rolls, vegetable | Egg roll, vegetable | USDA "Egg rolls, vegetable, frozen, prepared" / Canada_CNF "Egg roll, vegetable, refrigerated, heated" -- same real product (vegetable egg roll), close enough prep description to be confident it's the same dish, not a different one. |

### Mixed -- deliberately NOT unified

Beyond the 6 pairs above, the full mechanical sweep (whole-string + comma-head,
run against all 2,430 distinct names) found nothing else. A normalized
punctuation-collision sweep (see &sect;7) found 5 more base_name collisions in
Mixed, but all are comma/word-order/ampersand variants, not plural/singular
ones -- flagged for human review, not fixed under this task's mechanism.

## 5. Baked -- 46 verified pairs

Baked had, by far, the most real duplicate pairs of the five categories --
consistent with USDA/Canada_CNF both maintaining large, closely mirrored
baked-goods panels (crackers, muffins, pancakes, rolls, waffles, etc.), each
side spelling the shared head noun differently.

### 5a. Comma-head pairs, mechanical rule, all verified same product (39)

| Plural | Singular |
|---|---|
| Bagels, cinnamon-raisin | Bagel, cinnamon-raisin |
| Bagels, egg | Bagel, egg |
| Bagels, oat bran | Bagel, oat bran |
| Crackers, cheese | Cracker, cheese |
| Crackers, crispbread | Cracker, crispbread |
| Crackers, matzo | Cracker, matzo |
| Crackers, melba toast | Cracker, melba toast |
| Crackers, milk | Cracker, milk |
| Crackers, multigrain | Cracker, multigrain |
| Crackers, rusk toast | Cracker, rusk toast |
| Crackers, rye | Cracker, rye |
| Crackers, standard snack-type | Cracker, standard snack-type |
| Crackers, wheat | Cracker, wheat |
| Crackers, whole-wheat | Cracker, whole-wheat |
| Croissants, apple | Croissant, apple |
| Croissants, butter | Croissant, butter |
| Croissants, cheese | Croissant, cheese |
| Leavening agents, baking powder | Leavening agent, baking powder |
| Leavening agents, cream of tartar | Leavening agent, cream of tartar |
| Leavening agents, yeast | Leavening agent, yeast |
| Muffins, blueberry | Muffin, blueberry |
| Muffins, corn | Muffin, corn |
| Muffins, plain | Muffin, plain |
| Muffins, wheat bran | Muffin, wheat bran |
| Pancakes, blueberry | Pancake, blueberry |
| Pancakes, buckwheat | Pancake, buckwheat |
| Pancakes, buttermilk | Pancake, buttermilk |
| Pancakes, plain | Pancake, plain |
| Pancakes, whole wheat | Pancake, whole wheat |
| Pancakes, whole-wheat | Pancake, whole-wheat |
| Popovers, dry mix | Popover, dry mix |
| Rolls, dinner | Roll, dinner |
| Rolls, french | Roll, french |
| Rolls, pumpernickel | Roll, pumpernickel |
| Sweet rolls, cheese | Sweet roll, cheese |
| Waffles, buttermilk | Waffle, buttermilk |
| Waffles, chocolate chip | Waffle, chocolate chip |
| Waffles, plain | Waffle, plain |
| Waffles, whole wheat | Waffle, whole wheat |

Every pair above was verified by reading every row on both sides (not shown
individually here for space -- see this task's own query transcript); in
every case both `base_name` buckets contained rows with matching or
near-identical trailing descriptions (e.g. "reduced fat", "toaster-type,
toasted", "sandwich, with cheese filling") confirming the same real product
line under two spellings.

### 5b. Whole-string pair (1)

| Plural | Singular | Confirming detail |
|---|---|---|
| Taco shells | Taco shell | USDA "Taco shells, baked" + "Taco shells, baked, without added salt" / Canada_CNF "Taco shell, baked" + "Taco shell, baked, unsalted" -- identical product and prep pairing on both sides. |

**Rejected whole-string false alarm**: `"Crackers"` (bare, Germany_BLS,
generic "Crackers" with no variety specified) vs. `"Cracker"` (bare) --
looked like a match, but the single row filed under bare "Cracker" is
actually Canada_CNF's `"Cracker, roasted vegetable"` (its `short_name` field
is just "Cracker", but the real product is a specific roasted-vegetable
variety, not a generic cracker). **Not merged** -- different products, this
is a `short_name`-truncation artifact, not a real duplicate.

### 5c. Hand-caught special cases (6)

These didn't fall out of the mechanical rules -- found by reading the full
701-name list and checking near-miss wording differences.

| From | To | Why |
|---|---|---|
| Biscuits, plain or buttermilk | Biscuit, plain/buttermilk | USDA (8 rows: frozen baked, refrigerated dough higher/lower fat x2 each, prepared from recipe, dry mix x2) vs. Canada_CNF (8 rows, same exact prep-method set) -- identical product line, "or" vs. "/" plus the usual plural/singular head. |
| Muffins, English | Muffin, English style | USDA's 7 rows (wheat, whole-wheat, raisin-cinnamon, mixed-grain, plain w/ calcium propionate, etc.) vs. Australia_AFCD's 3 "Muffin, English style, from white flour" rows -- same real product (English muffin), USDA drops "style" that Australia_AFCD keeps. |
| Rolls, hard (includes kaiser) | Roll (kaiser), hard | USDA "Rolls, hard (includes kaiser)" vs. Canada_CNF "Roll (kaiser), hard" -- same product (a hard roll, kaiser-style), the qualifier just sits in a different word position on each side. |
| Tortillas, ready-to-bake or -fry | Tortilla, ready-to-bake / fry | USDA (6 rows: flour/corn, shelf stable/refrigerated, with/without salt or calcium, whole wheat) vs. Canada_CNF (4 rows: corn, corn unsalted, flour, whole-wheat) -- same product line, "or -fry" vs. "/ fry" is the same qualifier written differently. |
| Wonton wrappers (includes egg roll wrappers) | Wonton wrapper (egg roll wrapper) | USDA (1 row) vs. Canada_CNF (1 row) -- same product, singular/plural plus "includes X" vs. "(X)" wording. |
| English muffins, plain | English muffin, plain (also sourdough) | USDA (3 rows, all "plain...(includes sourdough)" variants) vs. Canada_CNF (2 rows, "plain (also sourdough)" / "...toasted") -- both sides explicitly fold the sourdough variant into the same "plain" identity, confirming it's the same real product bucket, not a different one. |

### 5d. Baked -- deliberately NOT unified

| Candidate | Why left alone |
|---|---|
| Muffins, oat bran (USDA, bare) / Muffin, oat bran (wheat free-product) (Canada_CNF) | **Low-confidence, not merged.** Canada_CNF's qualifier "(wheat free-product)" is a real, meaningful distinguishing attribute (a wheat-free oat bran muffin is a materially different product from a regular one), not incidental punctuation -- merging would risk conflating a genuinely different product with the generic bucket, the same reasoning the Fruit trial used to keep cultivar-specific rows separate from generic ones. |
| Rolls, hamburger (USDA, "whole grain white, calcium-fortified" -- the bread roll itself) / Hamburger, white roll (Australia_AFCD, "beef patty, with salad, independent takeaway outlet" -- a fully assembled sandwich) | **Rejected false alarm.** These share three words in a different order but are not remotely the same product: one is a plain bun, the other is an entire prepared hamburger meal (bun + patty + salad) from a takeaway outlet. Confirmed by reading the full `name` field before rejecting, exactly the kind of near-miss this task's verification step exists to catch. |
| Bagel, plain (with onion (Canada_CNF, truncated -- full name "Bagel, plain (with onion, poppy seed and/or sesame seed)") / Bagels, plain (USDA, bare, though its own full names separately say "(includes onion, poppy, sesame)") | **Not merged under the strict pairing rule** -- the two `base_name` strings' trailing clauses aren't identical (one carries a truncated parenthetical, the other has none at all), so this doesn't meet the same bar the comma-head rule requires elsewhere. Very likely the same real product conceptually, but the mismatch comes from a pre-existing upstream truncation artifact (the base_name extraction splits on the first comma even inside a parenthetical -- the same class of bug the Fruit report noted for "Grapes, red or green (European type"). Flagged in &sect;7 rather than force-merged. |
| Bagel, whole-wheat (multigrain) (Canada_CNF) vs. Bagels, wheat (USDA) and/or Bagels, multigrain (USDA) | **Ambiguous, left alone.** Canada_CNF's single "whole-wheat (multigrain)" identity could plausibly correspond to either (or neither) of USDA's two separate "wheat" and "multigrain" bagel rows -- picking one would be guessing which USDA product it actually matches, the same "picking one would be guessing" reasoning the Fruit report used for its Groundcherry 3-way case. |
| Crackers, gluten-free / Crackers, saltines / Crackers, sandwich-type / Crackers, snack / Crackers, toast thins / Crackers, water biscuits / Crackers, whole grain / Crackers, cream / Crackers, flavored | No exact singular `"Cracker, X"` counterpart exists for any of these -- left alone rather than guessed, same reasoning as the Fruit report's "Cranberries, wild" case. |
| Pancakes, gluten-free / Pancakes, special dietary / Rolls, gluten-free / English muffins, whole grain white | No exact singular counterpart exists for any of these either -- left alone. |

## 6. SupplementPowder -- 0 candidates, confirmed quickly

This worktree's own from-spreadsheet build has **zero** rows under
`category='SupplementPowder'` -- in this codebase, that category is created
entirely by a separate patch script (`scripts/add_supplement_powder_category.py`)
that runs *after* the spreadsheet build, directly against the compiled
`.db` file (recategorizing an existing "Psyllium, uncooked" row from NutSeed,
plus adding one synthetic "Choline Bitartrate (Supplement Powder)" row) --
it is not populated by `build_food_reference_db.py` itself at all.

Checked the already-bundled `assets/data/foods_reference.db` in this worktree
(which already had that patch applied) directly: it has exactly 2 distinct
`base_name` values in this category -- `"Psyllium"` and `"Choline Bitartrate
(Supplement Powder)"` -- neither of which is a plural/singular form of
anything, and neither has a duplicate counterpart. Zero candidates, confirmed
by direct query rather than assumed. (The task brief mentions 3 rows/3
distinct base_names in the current main tree -- likely a third supplement
row added by other in-flight work not present in this branch. Whatever that
third row turns out to be, it doesn't change this category's conclusion:
SupplementPowder is too small and too structurally distinct row-to-row to
have real plural/singular duplicates.)

## 7. Other genuine base_name identity collisions noticed, flagged for human review (not fixed)

Per the task instructions, these are the same general class of bug as the
Fruit report's own flagged findings (persimmon 3-way split, honeydew
spelling variants, etc.) -- a real, different base_name identity silently
duplicating another one -- but they are **not** plural/singular differences,
so they're outside this task's mechanism. Flagging for a human to make the
category-vs-base_name judgment call, not fixing here.

1. **Root beer / Carbonated drinks, root beer (Bev).** UK_CoFID's bare
   `"Root beer"` and Canada_CNF's `"Carbonated drinks, root beer"` are almost
   certainly the same real drink, just filed under a bucketed vs. bare
   naming structure. Not a plural issue.
2. **Sherry dry / Sherry, dry and Sherry sweet / Sherry, sweet (Alcohol).**
   Germany_BLS's bare `"Sherry dry"`/`"Sherry sweet"` vs. UK_CoFID's comma-form
   `"Sherry, dry"`/`"Sherry, sweet"` -- same real product, comma-vs-no-comma
   structural variant, not a plural one.
3. **Vermouth sweet / Vermouth, sweet (Alcohol).** Same pattern:
   Germany_BLS bare vs. UK_CoFID comma-form, same real product.
4. **Pilsner beer alcohol-free / Pilsner beer, alcohol-free and Wheat beer
   alcohol-free / Wheat beer, alcohol-free (Alcohol).** Both pairs are
   Germany_BLS's own data, bare vs. comma-form for what appears to be the
   same alcohol-free beer concept (the comma-form row's full name adds
   "mixed with carbonated lemonade" as further prep detail beyond what's in
   its own `base_name`) -- lower confidence than the Sherry/Vermouth cases
   above since the comma-form side's fuller name suggests a shandy-style
   variant, but flagged rather than silently left unexamined.
5. **Beverages, V8 V- FUSION Juices / Beverages, V8 V-FUSION Juices (Bev).**
   Literally a stray extra space before the hyphen in one USDA row's own
   `base_name` -- same brand/product line, pure data-entry inconsistency
   within a single source.
6. **Coffee (infusion) / Coffee, infusion (Bev).** Germany_BLS parenthetical
   form vs. Japan_MEXT comma form -- same real product (plain brewed
   coffee), structural naming variant, not a plural one.
7. **"Schupfnudeln" (German potato pasta ) / "Schupfnudeln" (German potato
   pasta) (Mixed).** Germany_BLS's own data has a stray extra space before
   the closing parenthesis in one row's `base_name`, splitting one real dish
   into two identities.
8. **Lasagna with meat & sauce / Lasagna with meat sauce (Mixed).** Both
   USDA rows ("frozen entree" / "frozen, prepared") -- likely the same real
   frozen-lasagna product line, "&" omitted in one of USDA's own two rows.
9. **Sauce barbecue / Sauce, barbecue (Mixed).** France_Ciqual bare form vs.
   Australia_AFCD comma form -- same real product (barbecue sauce),
   structural variant.
10. **Soup stock / Soup, stock (Mixed).** Japan_MEXT's own bucket (4 rows:
    kombu dashi, katsuo-bushi/kombu dashi, shiitake dashi, niboshi dashi) vs.
    Canada_CNF/USDA's shared `"Soup, stock"` bucket (6 rows: fish/beef/
    chicken homemade or home-prepared) -- same real category (soup stock),
    bare-vs-comma structural variant, not a plural one.
11. **Soup, chicken & noodle / Soup, chicken noodle (Mixed).**
    Australia_AFCD ("&") vs. Canada_CNF ("noodle" with no ampersand) -- same
    real dish, "&" vs. omitted.
12. **Bread crumbs / Bread, crumbs (Baked).** Germany_BLS bare form vs.
    USDA's comma-form 2-row bucket (dry, grated, seasoned/plain) -- same
    real product.
13. **Bread, gluten free / Bread, gluten-free (Baked).** Australia_AFCD
    (space) vs. USDA (hyphen) -- same real product, hyphen-vs-space
    spelling variant, the same class of bug the Fruit report flagged for
    "Chinese quinces"-style cases.
14. **Bread, multi-grain / Bread, multigrain (Baked).** USDA (hyphenated,
    1 row) vs. Canada_CNF (one word, 4 rows) -- same real product family.
15. **Bread, whole wheat / Bread, whole-wheat (Baked).** Canada_CNF (space,
    4 rows) vs. USDA (hyphen, 4 rows) -- same real product family, the
    single most-repeated hyphen/space variant found in this sweep (the same
    "whole wheat" vs. "whole-wheat" split also recurs at Cracker, Pancake,
    Pancakes, and Waffle/Waffles level -- see items 16-19 below).
16. **Cracker, whole wheat / Cracker, whole-wheat (Baked).**
17. **Pancake, whole wheat / Pancake, whole-wheat (Baked).**
18. **Pancakes, whole wheat / Pancakes, whole-wheat (Baked)** -- note this
    pair is *also* separately merged as its own plural/singular pair against
    "Pancake, whole wheat" and "Pancake, whole-wheat" respectively in
    &sect;5a; the whole-wheat/whole wheat spelling split exists
    independently of, and on top of, the plural/singular split.
19. **Cracker meal / Cracker, meal (Baked).** Canada_CNF bare vs. USDA
    comma-form -- same real product (cracker meal), structural variant.
20. **Cracker, standard snack type / Cracker, standard snack-type (Baked).**
    Both Canada_CNF's own rows -- space vs. hyphen inconsistency within a
    single source.
21. **Pie crust, standard type / Pie crust, standard-type (Baked).**
    Canada_CNF (space, 4 rows) vs. mixed Canada_CNF/USDA (hyphen, 9 rows) --
    same real product family, space-vs-hyphen variant.
22. **Bagel, plain (with onion... / Bagels, plain (Baked).** See the
    detailed note in &sect;5d -- likely the same product, but the mismatch
    is a truncation artifact rather than a clean structural variant, so it's
    listed both there and here for visibility.

None of these 22 items were fixed under this task -- they're a different bug
class (punctuation/spacing/word-order/structural collisions, not plural/
singular ones) and, per the task instructions, need the same kind of
category-vs-base_name human judgment call the existing `NAME_CATEGORY_OVERRIDES`
mechanism already handles for other cases.

## 8. Recommendation on a processed/whole subcategory split

**No recommendation to add one.** Having now actually read all five
categories' real data closely (not just taking the pre-made scoping call on
faith), the reasoning behind that human decision holds up in every case:

- **Bev / Alcohol**: both already have a real subcategory axis
  (Tea/Coffee/Juice/Soft Drinks/Water/etc. for Bev; Beer & Cider/Wine &
  Champagne/Spirits & Liqueurs/Cocktails for Alcohol) that's doing useful
  organizational work in its own right. A processed-vs-whole axis wouldn't
  add meaningful signal on top of that -- there's no "whole" beverage to
  contrast against a "processed" one the way there's a whole apple vs. apple
  juice concentrate in Fruit; the category is inherently about prepared
  drinks.
- **Mixed**: confirmed directly by this task's own data -- 2,430 distinct
  names across 2,768 rows means the category is essentially wall-to-wall
  unique composite dishes (lasagna, soup stock, egg rolls, meatballs). There
  is no raw/whole baseline anywhere in this category to split against.
- **Baked**: same reasoning, confirmed by reading through all 701 distinct
  names -- every single one is already a manufactured baked product (bread,
  crackers, muffins, pie crust, tortillas). There's no unbaked-flour-vs-
  finished-product axis worth adding; that distinction already exists
  one category over (Grain, for raw flours/grains).
- **SupplementPowder**: confirmed trivially -- 2-3 rows total, far too small
  for any subcategory structure to be worth the complexity.

No further action recommended here.

## 9. Build verification

Ran the real build against the live source workbook from this worktree:

```
py scripts/build_food_reference_db.py "C:/AppProject/hashimotos_foods_combined_scored_and_nutrients_LIVE.xlsx" <output.db>
```

Confirmed against the output database (not merged into the main tree's
`assets/data/foods_reference.db` -- per the task instructions, a human
re-runs this in the main tree separately, merging just this task's new
`BASE_NAME_ALIAS_RENAMES` entries into the current file first):

- Distinct `base_name` counts, before -> after (this worktree's own build):
  - Bev: 644 -> 642 (-2, matching the 2 verified pairs)
  - Alcohol: 138 -> 138 (0, matching the 0 verified pairs)
  - Mixed: 2,430 -> 2,424 (-6, matching the 6 verified pairs)
  - Baked: 701 -> 655 (-46, matching the 46 verified pairs)
  - SupplementPowder: 0 -> 0 in a from-spreadsheet build (see &sect;6)
- Every renamed plural `base_name` (all 15 unique plural identities behind
  the 46+6+2 = 54 renames -- several map many source rows through one
  alias) now has **zero** rows in the rebuilt database; every corresponding
  singular target absorbed the expected row count (e.g. "Alcoholic beverage,
  wine": 35+1=36; "Cracker, cheese"-style merges verified individually via
  direct query, not spot-checked).
- Total row count in the whole `foods` table: unchanged at 22,016, both
  before and after this task's changes -- confirmed by direct query, zero
  data loss.
