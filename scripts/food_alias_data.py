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
    ("Veg", "bell pepper",
     ["Sweet Pepper", "Sweet Peppers", "Sweet pepper green", "Sweet pepper red", "Sweet pepper yellow"],
     "US common name for sweet/bell peppers; the database only uses "
     "\"Sweet Pepper\"/\"Capsicum\" naming."),

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
    # flat-leaf (Italian) parsley, as opposed to curly parsley -- confirmed
    # against the database's own "Parsley, continental" / "Parsley, curly"
    # pairing, which makes the intended distinction explicit.
    ("Herbs", "flat leaf parsley", ["Parsley, continental"],
     "\"Continental parsley\" is the real trade name for flat-leaf parsley "
     "in this database; \"flat leaf\"/\"italian\" are the common US terms "
     "for the same herb."),
    ("Herbs", "italian parsley", ["Parsley, continental"],
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
    # real-world names for this product; the database only has the generic
    # "Wheat Flour"/"Grains, wheat flour" naming, with no "all-purpose" or
    # "plain" wording anywhere for either source's wheat flour entries.
    ("Baked", "all purpose flour", ["Wheat Flour"],
     "US name for plain wheat flour; not present anywhere in the "
     "database's own wheat-flour naming."),
    ("Baked", "plain flour", ["Wheat Flour"],
     "UK name for the same product -- see all purpose flour above."),
    ("Grain", "all purpose flour", ["Grains, wheat flour"],
     "Same gap as the Baked-category entry above, for the Grain-category "
     "wheat flour row."),
    ("Grain", "plain flour", ["Grains, wheat flour"],
     "Same gap as the Baked-category entry above, for the Grain-category "
     "wheat flour row."),

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
