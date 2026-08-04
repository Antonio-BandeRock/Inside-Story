"""
Real, hand-verified common-name aliases for the food reference search --
lets someone search a food by the everyday name they'd actually type
(regional/vernacular term, not the database's own more formal/scientific
short_name) and still find the real row.

Every entry here was found by actually querying the live
assets/data/foods_reference.db for the alias term first (plain substring
AND the app's own whitespace-collapsed match) and confirming it returns
nothing -- these are genuine gaps, not guesses, and not duplicates of what
the app's existing search already finds unaided. Each `base_names` list was
then verified against the real, exact base_name strings that exist in the
database for that category (case, spelling, and all) -- an alias pointing
at a base_name that doesn't exist would silently never match anything, so
scripts/add_food_aliases.py (the patch script that loads this data) fails
loudly instead of inserting a dangling alias.

Scoped by category (matches how the app's own food picker already scopes
every search -- an alias is only meaningful within the category the user is
already browsing).

Format: (category, alias, [base_names], reason)
"""

FOOD_ALIASES = [
    # "Bell pepper" is the single most common US name for this vegetable and
    # doesn't appear as a substring anywhere in the database at all -- every
    # source here calls it "Sweet Pepper"/"Capsicum" instead. Confirmed zero
    # matches for "bell pepper" before adding this.
    #
    # 2026-08-02: the app's default USDA-only scope used to have exactly one
    # generic "Sweet Pepper" base_name covering every color, which meant
    # browsing the Vegetables list (no typed query, so aliases never apply
    # there -- see lib/db.ts's own comment) never showed anything a person
    # would recognize as red/green/yellow bell peppers. All 18 real USDA
    # rows behind that base_name already state their own color in the full
    # `name` field, so build_food_reference_db.py's own
    # rename_sweet_pepper_by_color() now splits them into "Red/Green/Yellow
    # Bell Pepper" -- the generic "Sweet Pepper"/"Sweet Peppers" base_names
    # no longer exist under USDA at all after that split, so those two
    # entries were dropped here (a dangling alias base_name fails this
    # script's own load-time check). The non-USDA "Sweet pepper
    # green/red/yellow" base_names (Germany_BLS et al) are untouched by that
    # split and kept below for any lens that isn't USDA-scoped.
    ("Veg", "bell pepper",
     ["Red Bell Pepper", "Green Bell Pepper", "Yellow Bell Pepper",
      "Sweet pepper green", "Sweet pepper red", "Sweet pepper yellow"],
     "US common name for sweet/bell peppers; the database only uses "
     "\"Sweet Pepper\"/\"Capsicum\" naming."),
    ("Veg", "red pepper", ["Red Bell Pepper", "Sweet pepper red"],
     "US common shorthand for the red bell pepper specifically."),
    ("Veg", "green pepper", ["Green Bell Pepper", "Sweet pepper green"],
     "US common shorthand for the green bell pepper specifically."),
    ("Veg", "yellow pepper", ["Yellow Bell Pepper", "Sweet pepper yellow"],
     "US common shorthand for the yellow bell pepper specifically."),

    # "Green onion" (the everyday US term) doesn't match the real row
    # because the source's own wording puts "green" and "onion" in the
    # opposite order ("Onion, spring (green) or scallion") -- a plain
    # substring search can't bridge that word-order difference the way it
    # can bridge a spacing difference.
    ("Veg", "green onion",
     ["Onion, spring (green) or scallion (includes tops and bulb)",
      "Onions, spring or scallions (includes tops and bulb)"],
     "Common US term; source wording is \"Onion, spring (green)\" -- "
     "reversed word order a substring search can't bridge."),

    # "Continental parsley" is the real Australian/NZ/UK trade name for
    # flat-leaf (Italian) parsley, as opposed to curly parsley. Originally
    # pointed at "Parsley, continental"; a later rebuild this session
    # (2026-08-02, unrelated category/naming fix) retired that base_name in
    # favor of "Parsley Spices" -- the only Herbs-category parsley row left
    # in the database -- so this was repointed there rather than left
    # dangling.
    ("Herbs", "flat leaf parsley", ["Parsley Spices"],
     "\"Continental\"/\"flat leaf\"/\"italian\" are all real names for the "
     "same herb; the database's own naming doesn't include any of those "
     "words."),
    ("Herbs", "italian parsley", ["Parsley Spices"],
     "Same as flat leaf parsley -- see above."),

    # UK/AU/CA sources use "mince" for ground meat; USDA uses "ground". Both
    # terms are real and both exist in the database already under their own
    # source's wording ("Beef Mince" vs "Ground Beef"), but a US person
    # typing the UK spelling "minced beef" won't find "Beef Mince" since
    # "minced" (with the -d) isn't a substring of "Mince".
    ("Meat", "minced beef", ["Beef Mince", "Lean Beef Mince"],
     "UK/AU/CA term for ground beef; \"minced\" isn't a substring of the "
     "database's own \"Mince\" wording."),

    # The database has "Sugar white (refined sugar)" but not the more
    # common word order "white sugar".
    ("Sweets", "white sugar", ["Sugar white (refined sugar)"],
     "Reversed word order vs. the database's own \"Sugar white\" naming."),

    # "All-purpose flour" (US) / "plain flour" (UK) are the two most common
    # real-world names for this product. Originally pointed at generic
    # "Wheat Flour"/"Grains, wheat flour" base_names under both Baked and
    # Grain; a later rebuild this session (2026-08-02, unrelated
    # category/naming fix) retired both generic names -- there's no
    # remaining flour base_name under Baked at all (every Baked-category row
    # with "flour" in it is a finished baked good made FROM flour, not the
    # flour itself, so that category pairing looks like it was never right
    # to begin with) and the Grain-category flour is now split into several
    # specific "Grains, wheat flour, white, all purpose, ..." variants
    # rather than one bare name. Dropped the two now-targetless Baked
    # entries and repointed Grain at the three real "all purpose" variants.
    # Repointed from "Grain" to "PantryStaples" 2026-08-04: the flour/malt
    # Grain-to-PantryStaples move (build_food_reference_db.py) relocated
    # these same three "Grains, wheat flour, white, all purpose, ..." rows,
    # so the alias's own category has to follow them or it dangles.
    ("PantryStaples", "all purpose flour",
     ["Grains, wheat flour, white, all purpose, bleached",
      "Grains, wheat flour, white, all purpose, unbleached",
      "Grains, wheat flour, white, all purpose, enriched, calcium fortified"],
     "US name for plain wheat flour; not present anywhere in the "
     "database's own wheat-flour naming."),
    ("PantryStaples", "plain flour",
     ["Grains, wheat flour, white, all purpose, bleached",
      "Grains, wheat flour, white, all purpose, unbleached",
      "Grains, wheat flour, white, all purpose, enriched, calcium fortified"],
     "UK name for the same product -- see all purpose flour above."),

    # These three only became distinguishable after fixing the "Fluid
    # Cream" collision in NAME_CATEGORY_OVERRIDES (build_food_reference_db.py)
    # -- found while researching this exact alias. "Heavy cream" and "light
    # cream" are the everyday US terms; "coffee cream" is the everyday
    # Canadian term for the same light-cream product Canada_CNF itself
    # calls "Table Cream (Coffee)".
    ("Dairy", "heavy cream", ["Heavy Whipping Cream"],
     "Everyday US term for heavy whipping cream."),
    ("Dairy", "light cream", ["Table Cream (Coffee)"],
     "Everyday US term for coffee/table cream (~18-20% fat)."),
    ("Dairy", "coffee cream", ["Table Cream (Coffee)"],
     "Everyday Canadian term for the same light-cream product."),
]
