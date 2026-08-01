# Natural name reordering — audit, rules, and coverage report

Companion to `scripts/natural_name_reorder.py`. This module is **standalone
and not integrated anywhere** — it does not import from, or get imported by,
`build_food_reference_db.py`, and nothing in this task modified
`assets/data/foods_reference.db` or ran the build script. All numbers below
come from running the module against the real, live reference database
read-only (via the `sqlite3` CLI + this module), not from samples or
estimates.

## 0. The problem, restated with real numbers

`base_name` is what the app actually shows and searches against
(`lib/db.ts`'s `searchReferenceFoodNames`). `rename_bean_type_first()` in
`build_food_reference_db.py` proved the pattern ("Beans, kidney" → "Kidney
Beans") but only for bean types. A full audit of the live database found:

| Source | Distinct `base_name` values | ...containing a comma | % |
|---|---:|---:|---:|
| USDA | 1,846 | 1,428 | 77.4% |
| Canada_CNF | 1,552 | 1,195 | 77.0% |
| France_Ciqual | 2,163 | 906 | 41.9% |
| Germany_BLS | 3,718 | 355 | 9.5% |
| Japan_MEXT | 929 | 788 | 84.8% |
| UK_CoFID | 237 | 120 | 50.6% |
| Australia_AFCD | 745 | 606 | 81.3% |
| **Total** | **~11,190** | **5,398** | **48.2%** |

(The USDA 77.4%/1,428 figure matches the number already cited when this task
was scoped, confirming the query approach.)

## 1. Empirical structure of the problem (audit before rules)

Before writing any rule, every one of the 5,398 comma-containing names was
parsed with a **paren-aware** comma split (a comma nested inside
parentheses, e.g. `"Balsam-pear (bitter gourd, bitter melon)"`, is not a
real clause boundary). This surfaced a genuinely useful finding that
changes the shape of the problem from what the task brief anticipated:

- Excluding France_Ciqual (906 names — see §4, out of scope for a different
  reason), the remaining **4,492 English-language comma names** almost
  never have a real multi-clause chain by the time they reach `base_name`:
  - **4,450 (99.1%)** have exactly **one** top-level comma.
  - **42 (0.9%)** have their only comma nested inside a trailing
    parenthetical — these already read naturally as `Head (clarifier)`
    and need no change at all (e.g. `"Chickpeas (garbanzo beans, bengal
    gram)"`).
  - **0** had a genuine 2-or-more-top-level-comma chain.

  In other words, the "3+ clause, only the first non-prep clause should
  move" scenario the task brief specifically warned about turns out not to
  materialize in `base_name` itself — `split_prep_method()` and the
  source spreadsheet's own "Short Display Name" field have already
  collapsed those upstream. This module still defends against the
  counter-example (a second top-level comma is an automatic
  `skip_multi_clause`) but didn't need a recursive multi-clause resolver.

- Word-count distribution of the one real clause, across those 4,450 names:

  | Clause length | Count | % |
  |---|---:|---:|
  | 1 word | 2,371 | 53.3% |
  | 2 words | 1,160 | 26.1% |
  | 3 words | 500 | 11.2% |
  | 4 words | 201 | 4.5% |
  | 5 words | 120 | 2.7% |
  | 6+ words | 98 | 2.2% |

  This is why the rule engine concentrates almost all its gazetteer work on
  1- and 2-word clauses (79.4% of the real distribution) and treats bare
  3+-word clauses as out of confident scope (see §4).

## 2. Real clause-pattern categories found, and how each is handled

Every category below was identified by reading real, repeated examples
from the audit dump (`comma_<source>.txt` files, one per source, generated
via the `sqlite3` CLI), not guessed from theory.

| # | Pattern | Real example(s) | Handling |
|---|---|---|---|
| 1 | Single adjective/origin/quality word | `Squash, Indian`, `Corn, sweet`, `Rhubarb, wild`, `Cress, garden` | **Flip** to front |
| 2 | Variety/species-as-modifier noun | `Cheese, mozzarella`, `Oil, olive`, `Melon, cantaloupe`, `Apple, Fuji` | **Flip** (reads as the real common name) |
| 3 | Anatomical cut / organ noun | `Beef, brisket`, `Chicken, breast`, `Veal, shoulder` | **Join**, unflipped (`Beef Brisket`, not `Brisket Beef`) |
| 4 | Botanical plant-part noun | `Broccoli, leaves`, `Garlic, bulb`, `Rice, bran` | **Join**, unflipped (same convention as #3) |
| 5 | Bracketed single alternate name | `Acerola, (west indian cherry)` | Reformatted as a **trailing parenthetical**, never moved to front |
| 6 | Bracketed alternate name attached after a resolvable clause | `Beans, cranberry (roman)` | Resolve the main clause, **keep the parenthetical trailing in place** |
| 7 | Prepositional/state phrase | `Cucumber, with peel`, `Beans, in brine` | Wrapped as a **trailing parenthetical**, not reordered (can't guess an order for a phrase that isn't an adjective) |
| 8 | Bracketed **alternatives** (not a single answer) | `Artichokes, (globe or french)` | **Skipped** — picking one would be guessing |
| 9 | ALL-CAPS brand-name head | `BANQUET, Salisbury Steak With Gravy`, `SILK Chai, soymilk` | **Join** — brand stays first, product description follows |
| 10 | Non-ALL-CAPS brand head (hand-verified short list) | `Udi's, Gluten Free`, `Schar, Gluten-Free` | **Join** — same reasoning as #9, just not typographically flagged |
| 11 | Genuinely bidirectional word (**milk**, **cream**, **fruit**, **mince**) | `Coconut, milk` → join; `Bread, milk` → flip; `Cheese, cream` → flip; `Tomatoes, fruit` → join; `Yogurt, fruit` → flip; `Beef, mince` → join; `Pie, mince` → flip | Hand-verified **(head, word) override table** — every real occurrence checked individually, unlisted pairs left alone |
| 12 | A word that already contains the generic head word | `Fish, catfish` → flipping would give "Catfish Fish"; `Corn, popcorn` → "Popcorn Corn" | **Replace**: drop the redundant head entirely (general suffix rule, not a hand list — see §3) |
| 13 | Malformed/truncated source string | `"Cabbage, common (danish"` (no closing paren) | **Skipped** — a pre-existing data-quality bug upstream, not a naming-order problem |
| 14 | Non-English (French) | `"Carotte, crue"`, `"Boeuf, filet"` | **Skipped** entirely — see §4 |

## 3. One deliberate generalization worth calling out

Early testing caught `"Fish, catfish"` naively flipping to `"Catfish
Fish"` — wrong, since "catfish" already means "a fish". Rather than hand-list
every fish species that happens to end in "fish" (which is what the first
version of this module did), the rule was generalized: **whenever the
clause word ends with the head's own first word, drop the head instead of
appending it** (`_is_redundant_with_head`). This one general rule caught
not just the original 10 `...fish` species, but also cases the original
hand-list didn't cover (`Fish, rockfish` → `Rockfish`, `Fish, sunfish` →
`Sunfish`) and an unrelated case in a different category (`Corn, popcorn`
→ `Popcorn`, since "popcorn" ends in "corn") — found *because* the rule
was general rather than a fixed word list. This is the one place the
module intentionally favors a general mechanism over a hand-verified list,
precisely because the underlying fact (a word semantically contains the
head already) is a hard linguistic guarantee, not a judgment call.

## 4. What was deliberately NOT auto-fixed, and why

| Category | Count | Why left alone |
|---|---:|---|
| French (France_Ciqual) | 906 | Every France_Ciqual `base_name` is French (`"Carotte, crue"`, `"Boeuf, filet"`), not English. Reordering French adjective order under English rules would be actively wrong — the real fix here is **translation**, a completely different task with its own risk profile, not word-order. Confirmed by sampling: virtually all France_Ciqual rows are French, not just the comma-containing ones. |
| 3+ word bare clause | 790 | No parenthetical or gazetteer match; e.g. `"Beef in its own juice, with pork rind"`'s outer structure is handled, but a bare `"X, some long descriptive phrase"` with no recognizable single/two-word pattern is left alone rather than guessed at. |
| Two unrecognized words | 960 | The clause is exactly 2 words but doesn't match either curated `FLIP_TWO_WORD` or `JOIN_TWO_WORD` whitelist (e.g. `"mature seeds"`, `"immature seeds"` — deliberately excluded, see below). |
| Single unrecognized word | 753 | A single word not yet in either gazetteer — mostly long-tail (556 of the ~1,020 distinct single words across the corpus occur exactly once). Extending the gazetteer is safe, incremental work for a future pass; every word actually added here was verified against its real head context first (see §5). |
| Malformed/truncated source string | 50 | Unbalanced parentheses — a pre-existing data-quality bug in the source spreadsheet (e.g. `"Beans, snap (Italian"`, missing its closing paren), not a naming-order problem. Confirmed by hand: every one of the 50 is a genuine truncation, not a module bug. |
| Ambiguous "X or Y" alternative | 4 | `"Artichokes, (globe or french)"`, `"Bread, flat (pita or Lebanese)"` — presents a real unresolved choice; picking one would be inventing information not present in the source. |
| "mature seeds"/"immature seeds" (2-word) | 32 | Per the task brief's own guidance: this describes a botanical *state* (dry mature seed vs. fresh immature seed), the same category of information `split_prep_method`/`PREP_TERMS` already carve out elsewhere — not a naming adjective safe to reorder blind. Left alone rather than guessing whether "mature"/"immature" should move to front or stay attached. |
| "ham" as a bare single-word clause | 6 | Genuinely bidirectional like milk/cream/fruit/mince (`"Pork, ham"` wants join → "Pork Ham"; `"Sandwich, ham"` wants flip → "Ham Sandwich"), but low volume (6 real occurrences) didn't justify building out a fourth override table for this task — flagged here for a future pass instead of guessed. |

Total left unchanged: **3,487 of 5,398 (64.6%)** — deliberately, not from
running out of ideas. The full per-action breakdown:

| Action | Count | % of all 5,398 |
|---|---:|---:|
| `skip_unrecognized` (see breakdown above) | 2,503 | 46.4% |
| **`flip`** | **1,349** | **25.0%** |
| `skip_non_english` (French) | 906 | 16.8% |
| **`join`** | **413** | **7.7%** |
| **`parenthetical`** | **116** | **2.1%** |
| `skip_malformed` | 50 | 0.9% |
| **`replace`** | **33** | **0.6%** |
| `not_applicable` (already natural) | 24 | 0.4% |
| `skip_ambiguous_or` | 4 | 0.1% |

**Net result: 1,911 of 5,398 comma-containing names (35.4%) safely
improved; 3,487 (64.6%) deliberately left exactly as-is** — either because
they're already natural, genuinely need translation rather than
reordering, are a real unresolved data-quality bug upstream, or didn't
match a pattern this pass could verify with confidence. Zero names were
guessed at outside a verified pattern.

## 5. How the gazetteers were actually built (not guessed)

For every candidate word considered for `FLIP_SINGLE_WORD`/
`JOIN_SINGLE_WORD`/the two-word whitelists, the real head context was
checked via `grep` against the full per-source dumps before inclusion —
e.g. before adding "oyster" as a flip word, every real `", oyster"` line
across all sources was pulled and read (`Mushroom, oyster` → flip is right,
but `Ostrich, oyster`/`Emu, oyster` are the oyster-blade *cut of meat* and
need join instead — hence `OYSTER_CUT_HEADS`, a small head-gated
exception). The same head-context check caught:

- `"Pie, mince"` needing flip (**Mince Pie**, a distinct traditional dish)
  even though every other `"<animal>, mince"` needs join (**Beef
  Mince**) — one exception among six real occurrences of "mince".
- `"Pie, steak"` needing flip (**Steak Pie**) even though every other
  `"<animal>, steak"` needs join (**Beef Steak**, **Camel Steak**,
  **Kangaroo Steak**) — caught by manually reading a chunk of the full
  transformed output and noticing "Pie Steak" read wrong.
- `"Ham, leg"` needing flip (**Leg Ham**, the standard retail term)
  even though every other `"<animal>, leg"` needs join (**Chicken Leg**,
  **Lamb Leg**, **Pheasant Leg**).
- `"Udi's, Gluten Free"` / `"Van's, Gluten Free"` / `"Schar,
  Gluten-Free"` needing the brand-stays-first join treatment even though
  they aren't ALL-CAPS like `BANQUET`/`SILK` (a small hand-verified list,
  `BRAND_NAME_HEADS_LOWER`, extends the general ALL-CAPS brand check).

This "one general rule, then hand-verified exceptions where the general
rule provably breaks" structure mirrors `rename_bean_type_first()` and
`BEAN_RENAME_EXCLUDE`'s own existing convention in
`build_food_reference_db.py`, just generalized to more pattern types
instead of only bean types.

## 6. Manual correctness review

**The entire set of 1,911 real transformations was read start to finish**
(not a 100-item sample) across `scripts/_reorder_samples/ALL_transformed.txt`,
in batches, cross-referenced against the original raw base_name and its
source. Three genuine direction errors were found and fixed this way
(`Pie, mince`; `Pie, steak`; `Ham, leg` — see §5); everything else read
correctly on inspection. Below is a representative 100+ item sample
spanning every pattern category and all 6 English-language sources
(France_Ciqual intentionally excluded, see §4):

### Simple adjective/origin flip
```
Squash, Indian          -> Indian Squash
Corn, sweet             -> Sweet Corn
Rhubarb, wild           -> Wild Rhubarb
Cress, garden           -> Garden Cress
Blackberries, wild      -> Wild Blackberries
Cabbage, red            -> Red Cabbage
Cauliflower, green      -> Green Cauliflower
Peach, yellow           -> Yellow Peach (Australia_AFCD)
Rye, rolled             -> Rolled Rye (Australia_AFCD)
Peppers, hungarian      -> Hungarian Peppers (USDA)
Cucumber, Lebanese      -> Lebanese Cucumber (Australia_AFCD)
Kielbasa, Polish        -> Polish Kielbasa
Salad dressing, russian -> Russian Salad Dressing (Canada_CNF)
Whey, sweet             -> Sweet Whey (USDA)
Lupin, whole            -> Whole Lupin (Australia_AFCD)
```

### Variety/species-as-modifier flip (reads as the real common name)
```
Cheese, mozzarella      -> Mozzarella Cheese
Cheese, cheddar         -> Cheddar Cheese
Cheese, goat            -> Goat Cheese
Chard, swiss            -> Swiss Chard
Melon, cantaloupe       -> Cantaloupe Melon
Sapote, mamey           -> Mamey Sapote (USDA)
Apple, Golden Delicious -> Golden Delicious Apple
Apple, Granny Smith     -> Granny Smith Apple
Apple, golden delicious -> Golden Delicious Apple (Australia_AFCD, lowercase source)
Oil, olive              -> Olive Oil
Oil, soybean            -> Soybean Oil
Mushroom, oyster        -> Oyster Mushroom
Mushrooms, morel        -> Morel Mushrooms (USDA)
Bacon, turkey           -> Turkey Bacon
Egg, turkey             -> Turkey Egg
Egg, chicken            -> Chicken Egg (Australia_AFCD)
Pie, apple              -> Apple Pie
Pie, pumpkin            -> Pumpkin Pie
Sauce, tomato           -> Tomato Sauce (Australia_AFCD)
Sauce, cranberry        -> Cranberry Sauce (USDA)
Spinach, water          -> Water Spinach (Australia_AFCD)
buffalo, water          -> Water Buffalo (USDA, head lowercase in source too)
Custard powder, vanilla -> Vanilla Custard Powder (Australia_AFCD)
Breakfast cereal, whole wheat -> Whole Wheat Breakfast Cereal (Australia_AFCD)
Safflower oil, high oleic -> High Oleic Safflower Oil (Japan_MEXT)
```

### Anatomical cut / organ noun (join, unflipped)
```
Beef, brisket           -> Beef Brisket
Beef, loin              -> Beef Loin
Chicken, breast         -> Chicken Breast (Australia_AFCD)
Turkey, drumstick       -> Turkey Drumstick
Veal, shoulder          -> Veal Shoulder
Pork, belly             -> Pork Belly (Australia_AFCD)
Lamb, mince             -> Lamb Mince (Australia_AFCD)
Veal, pancreas          -> Veal Pancreas (Canada_CNF)
Sheep breast, fat       -> Sheep Breast Fat (Germany_BLS)
```

### Botanical plant-part noun (join, unflipped)
```
Broccoli, leaves        -> Broccoli Leaves
Garlic, bulb            -> Garlic Bulb (Japan_MEXT)
Rice, bran              -> Rice Bran (Japan_MEXT)
Tomato, paste           -> Tomato Paste
Chicory, spears         -> Chicory Spears (Japan_MEXT)
Celery, petiole         -> Celery Petiole (Japan_MEXT)
Wasabi, rhizome         -> Wasabi Rhizome (Japan_MEXT)
Soy meal, defatted      -> Defatted Soy Meal (Canada_CNF)
```

### Bracketed alternate name / prepositional phrase (trailing parenthetical, not reordered)
```
Acerola, (west indian cherry)  -> Acerola (West Indian Cherry)
Cucumber, with peel            -> Cucumber (with peel)
Beans, cranberry (roman)       -> Cranberry Beans (Roman)
Butterbur, (fuki)              -> Butterbur (Fuki)
Peaches, dehydrated (low-moisture) -> Dehydrated Peaches (Low-Moisture)
Chocolate white, with hazelnuts -> Chocolate White (with hazelnuts) (Germany_BLS)
Porridge unsweetened, with milk 3.5 % fat -> Porridge Unsweetened (with milk 3.5 % fat) (Germany_BLS)
Muesli unsweetened, with milk 3.5 % fat and mixed fruit -> Muesli Unsweetened (with milk 3.5 % fat and mixed fruit) (Germany_BLS)
```

### Redundant-head "replace" (drop the head instead of doubling it)
```
Fish, catfish           -> Catfish
Fish, sablefish         -> Sablefish
Fish, rockfish          -> Rockfish  (not in the original hand list -- caught by the general rule)
Fish, sunfish           -> Sunfish   (likewise)
Corn, popcorn           -> Popcorn   (different category entirely -- same general rule)
```

### Brand-name heads (join, brand stays first)
```
BANQUET, Salisbury Steak With Gravy -> BANQUET Salisbury Steak With Gravy
SILK Light Vanilla, soymilk         -> SILK Light Vanilla Soymilk
HORMEL ALWAYS TENDER, Pork Tenderloin -> HORMEL ALWAYS TENDER Pork Tenderloin
Udi's, Gluten Free                  -> Udi's Gluten Free
Van's, Gluten Free                  -> Van's Gluten Free
Schar, Gluten-Free                  -> Schar Gluten-Free
```

### Genuinely bidirectional words, resolved per verified (head, word) pair
```
Coconut, milk       -> Coconut Milk   (join -- milk is the product-form)
Bread, milk         -> Milk Bread     (flip -- milk describes the bread)
Cheese, cream       -> Cream Cheese   (flip)
Coconut, cream       -> Coconut Cream  (join)
Tomatoes, fruit      -> Tomatoes Fruit (join -- botanical part-of-plant sense)
Yogurt, fruit        -> Fruit Yogurt   (flip -- fruit-flavored yogurt)
Beef, mince          -> Beef Mince     (join)
Pie, mince           -> Mince Pie      (flip -- a specific traditional dish)
Beef, steak          -> Beef Steak     (join)
Pie, steak           -> Steak Pie      (flip -- a specific traditional dish)
Pork, ham            -> Pork Ham       (unresolved -- "ham" not yet in an override table, see §4)
Ham, leg             -> Leg Ham        (flip -- the standard retail term)
```

## 7. Test methodology

`scripts/_test_natural_name_reorder.py` (also delivered, standalone,
read-only) queries `assets/data/foods_reference.db` directly for every
distinct `base_name LIKE '%,%'` per source (all 7), runs each through
`reorder_base_name()`, and writes:

- `scripts/_reorder_samples/ALL_transformed.txt` — all 1,911 real
  transformations, `[source] input -> output`.
- `scripts/_reorder_samples/ALL_skipped.txt` — all 3,487 left-alone names,
  tagged with which skip reason applied.
- One file per action type (`flip.txt`, `join.txt`, `parenthetical.txt`,
  `replace.txt`, `skip_ambiguous_or.txt`, `skip_malformed.txt`,
  `not_applicable.txt`) for targeted review.

Every number in this report was regenerated from a live run against the
real database at the time of writing, not carried over from an earlier
draft.

## 8. Integration notes for whoever wires this in later

- `reorder_base_name(base_name, source=None)` is the single public entry
  point. It never mutates its input; it returns a dict with `output`,
  `changed`, `action`, and a human-readable `reason` for every decision,
  including "why not" for anything left alone — useful for a future
  session auditing coverage without re-deriving all of the above.
- The natural integration point in `build_food_reference_db.py` is right
  after the existing `rename_bean_type_first()` / `rename_sprout()` calls
  (same stage in the pipeline, operating on the same already-prep-stripped
  `base_name`). Not done here per the task's explicit instruction, to
  avoid a merge conflict with the parallel work already touching that
  file.
- `source` should be passed through so France_Ciqual is correctly skipped
  — passing no source treats everything as English-eligible, which would
  be wrong for French rows.
