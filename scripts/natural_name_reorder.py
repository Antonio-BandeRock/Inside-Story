"""
General-purpose "noun, modifier" -> natural English word-order reordering for
the reference database's base_name field.

CONTEXT / WHY THIS EXISTS
--------------------------
build_food_reference_db.py's rename_bean_type_first() proved the *pattern*
(some base_names read raw "Head, Modifier" instead of natural "Modifier
Head") but only ever special-cased bean types. An empirical audit (see
natural_name_reorder_REPORT.md) found 5,398 distinct comma-containing
base_names across the 7 sources -- far more than bean types account for.
This module generalizes the reordering *mechanism* into rule categories
built from real, hand-verified clause-pattern frequency counts, while
remaining deliberately conservative: anything that doesn't match a
well-tested pattern is left exactly as-is rather than guessed at.

NOT INTEGRATED. This module is standalone and does not import from or get
imported by build_food_reference_db.py -- that wiring is left for a human
reviewer to do later. Nothing here modifies assets/data/foods_reference.db;
it operates purely on strings passed to it, for testing against the
database read-only.

HOW TO READ A base_name IN THIS DATASET
-----------------------------------------
Confirmed (see report) that after split_prep_method()/apply_prep_overrides()
already run upstream, essentially every remaining comma-containing
base_name has *exactly one* top-level comma (comma not nested inside
parentheses) -- multi-clause "Head, A, B" chains the task brief warned
about turn out not to survive into base_name in practice; they're already
collapsed further upstream. This module still defends against the rare
counter-example (treats a second top-level comma as automatic disqualifier)
but does not need an elaborate recursive multi-clause resolver.

THE CORE AMBIGUITY THIS MODULE HAS TO RESOLVE
-----------------------------------------------
"Head, Clause" collapses into at least four *different* natural-English
shapes depending on what kind of word Clause is:

  1. Clause is a genuine adjective/variety/origin word -> flip to front:
     "Squash, Indian" -> "Indian Squash", "Corn, sweet" -> "Sweet Corn",
     "Oil, olive" -> "Olive Oil", "Melon, cantaloupe" -> "Cantaloupe Melon".
  2. Clause is an anatomical/cut-of-meat or plant-part noun -> the
     established culinary/botanical convention keeps original order, just
     drops the comma: "Beef, brisket" -> "Beef Brisket" (NOT "Brisket
     Beef"), "Broccoli, leaves" -> "Broccoli Leaves", "Rice, bran" ->
     "Rice Bran".
  3. Clause is a bracketed alternate name/clarifier -> stays trailing,
     just reformatted, never moved to the front: "Acerola, (west indian
     cherry)" -> "Acerola (West Indian Cherry)".
  4. Clause is a genuine prepositional/state phrase -> wrapped as a
     trailing parenthetical rather than guessed into front position:
     "Cucumber, with peel" -> "Cucumber (with peel)".

A handful of words (milk, cream) genuinely go *either* direction depending
on which noun is the flavor-source vs. which is the processed-form -- e.g.
"Coconut, milk" -> "Coconut Milk" (join) but "Bread, milk" -> "Milk Bread"
(flip). Confirmed by hand against every real occurrence of these two words
across all 7 sources (see report); handled via a small explicit
(head, clause) override table, exactly the same "hand-verified exception
table" convention build_food_reference_db.py already uses for
CATEGORY_OVERRIDES / PREP_METHOD_OVERRIDES / BEAN_RENAME_EXCLUDE. Any
(head, clause) pairing of these two words NOT in the table is left alone
rather than guessed.

Deliberately out of scope, see natural_name_reorder_REPORT.md for the full
list and reasoning:
  - France_Ciqual base_names are French, not English -- reordering French
    adjective order is a translation problem, not a word-order problem, and
    is explicitly not attempted here (every France_Ciqual name is passed
    through unchanged with action="skip_non_english").
  - 3+ word bare (non-parenthetical) clauses.
  - Clauses containing " or " (a real alternative, not a single answer,
    e.g. "Artichokes, (globe or french)").
  - Malformed/truncated source strings (unbalanced parentheses).
"""

import re

# ---------------------------------------------------------------------------
# Gazetteer 1: single-word clauses that are genuine prenominal
# adjectives/origin-words/variety-or-type-nouns -- FLIP to front.
#
# Built from a real frequency audit of every distinct comma-containing
# base_name across USDA/UK_CoFID/Japan_MEXT/Germany_BLS/Canada_CNF/
# Australia_AFCD (France_Ciqual excluded, see module docstring), spot-checked
# against the actual head word each one attaches to before inclusion (e.g.
# "cheese" i.e. cheese *types* like mozzarella/cheddar/feta only ever appear
# after a generic "Cheese, " head in this data, never in a role that would
# make flipping wrong -- see natural_name_reorder_REPORT.md for the full
# per-word evidence).
# ---------------------------------------------------------------------------
FLIP_SINGLE_WORD = {
    # Colors
    "white", "green", "yellow", "red", "brown", "pink", "black", "blue",
    "purple", "golden", "gold", "dark", "light",
    # Origin / nationality / regional
    "chinese", "french", "italian", "mexican", "greek", "hungarian",
    "spanish", "german", "english", "american", "japanese", "asian",
    "hawaiian", "tahitian", "native", "welsh", "cuban", "jamaican",
    "florida", "virginia", "indian", "lebanese", "polish", "russian",
    # Quality / state adjectives (true adjectives, safe prenominal)
    "sweet", "wild", "dry", "mature", "immature", "common", "homemade",
    "plain", "unsweetened", "lean", "firm", "hard", "soft", "ripe",
    "regular", "natural", "fresh", "crude", "thickened", "processed",
    "refined", "unprocessed", "seasoned", "jellied", "pressurized",
    "anhydrous", "chilled", "brewed", "distilled", "bitter", "new",
    "hot", "horned", "smooth", "creamy", "dietetic", "sour", "baby",
    "gratinated",
    # Past-participle adjectives (prenominal, distinct from PREP_TERMS --
    # those are cooking *states* already stripped upstream by
    # split_prep_method; these describe a persistent physical form/cut)
    "ground", "diced", "chopped", "sliced", "split", "hulled", "peeled",
    "unpeeled", "defatted", "dehydrated", "powdered", "seeded", "rolled",
    "crushed", "boneless", "enhanced", "evaporated", "filled",
    # Compound adjectives already single-token via hyphen
    "gluten-free", "alcohol-free", "low-fat", "lowfat", "nonfat",
    "whole-wheat", "whole-grain", "lactose-free", "full-fat",
    "cinnamon-raisin", "ready-to-eat", "pre-basted", "home-prepared",
    "sugar-reduced", "turbinado", "sugared",
    "whole",
    # Fish species (generic "Fish, X" head in this dataset -- confirmed by
    # grep, every single one of these only ever follows a bare "Fish,"
    # head)
    "cod", "haddock", "halibut", "pollock", "snapper", "trout", "shark",
    "tilapia", "sturgeon", "mullet", "whitefish", "turbot", "grouper",
    "perch", "pike", "smelt", "drum", "sunfish", "rockfish", "sablefish",
    "tilefish", "pompano", "shad", "sheepshead", "cusk", "ling", "lingcod",
    "butterfish", "catfish", "cuttlefish", "devilfish", "gefiltefish",
    "menhaden", "bass", "bluefish", "carp", "croaker", "eel", "herring",
    "mackerel", "salmon", "sardine", "swordfish", "tuna", "yellowtail",
    "anchovy", "blackfish",
    # Shellfish/mollusk species (variety-of-X flip; "oyster" excluded --
    # handled specially below, dual role as both a species AND a beef cut)
    "clam", "cockle", "conch", "crab", "lobster", "mussel", "scallop",
    "snail", "abalone", "whelk", "crayfish", "shrimp", "squid", "octopus",
    "surimi",
    # Cheese types (this dataset's "Cheese, X" head is always generic;
    # flipping always produces the real common name)
    "mozzarella", "cheddar", "swiss", "camembert", "edam", "parmesan",
    "ricotta", "brie", "gouda", "cheshire", "colby", "feta", "fontina",
    "gruyere", "limburger", "monterey", "muenster", "neufchatel",
    "provolone", "romano", "tilsit", "gjetost",
    # Mushroom types
    "shiitake", "enoki", "maitake", "morel", "chanterelle", "portobello",
    "porcini",
    # Melon / fruit variety single words
    "cantaloupe", "casaba", "honeydew",
    # Grain/seed/legume type-modifier nouns confirmed to only ever occur as
    # a flip-worthy modifier of a generic head in this data
    "buckwheat", "spelt", "quinoa", "sorghum",
    # Oil-source nouns (this dataset's "Oil, X" / "Vegetable oil, X" heads
    # are consistently generic; flipping always produces the real name,
    # e.g. "Oil, olive" -> "Olive Oil")
    "almond", "avocado", "canola", "coconut", "corn", "cottonseed",
    "flaxseed", "grapeseed", "hazelnut", "hemp", "macadamia", "mustard",
    "oat", "olive", "palm", "peanut", "poppyseed", "safflower", "sesame",
    "soybean", "sunflower", "walnut", "soy",
    # Herb/spice single words (this dataset's "Spice(s), X" head is always
    # generic)
    "allspice", "basil", "cardamom", "chervil", "cloves", "ginger", "mace",
    "marjoram", "nutmeg", "oregano", "paprika", "parsley", "rosemary",
    "saffron", "savory", "savoury", "sage", "tarragon", "thyme", "garlic",
    # Cheese/dairy words that are unambiguous flip in this dataset (see
    # module docstring -- "milk"/"cream" are the two genuinely bidirectional
    # ones and are handled by AMBIGUOUS_HEAD_CLAUSE_OVERRIDES instead)
    "cheese", "butter", "buttermilk",
    # Misc confirmed-safe single-word variety/descriptor nouns
    "vanilla", "chocolate", "maple", "cinnamon", "orange", "lemon",
    "valencia", "vegan", "mixed", "instant", "multigrain", "cranberry",
    # Meat/poultry/grain/produce species-as-modifier words -- confirmed by
    # hand that in this dataset these only ever appear describing a
    # generic prepared-food/product head (Pie/Stew/Soup/Oil/Bread/Egg/
    # Bacon/Bagel/Fat/Cheese/Curry/Casserole/Cracker/Flour/Noodle/etc),
    # never the reverse role that would need JOIN instead (that reverse
    # role is what "meat" -- see JOIN_SINGLE_WORD -- and "fruit" -- see
    # AMBIGUOUS_HEAD_CLAUSE_OVERRIDES -- actually have, which is why those
    # two are handled separately instead of listed here).
    "pork", "chicken", "beef", "turkey", "wheat", "apple", "vegetable",
    "goose", "rice", "potato", "pumpkin", "cottage", "broiler", "egg",
    "pumpernickel", "bottled", "fluid", "whipped", "wine", "beer",
    "meatless", "goat", "rye", "liquid", "blueberry", "savoy", "pepper",
    "chili", "cucumber", "cherry", "pecan", "hamburger", "garden",
    "grape", "duck", "spinach", "tomato", "water", "banana", "table",
    "popcorn",
}

# "oyster" is genuinely dual-role in this dataset: a beef/emu/ostrich CUT
# ("Ostrich, oyster" -> "Ostrich Oyster", the oyster-blade cut) when the
# head is one of these meat/poultry species, but a variety/species word
# ("Mushroom, oyster" -> "Oyster Mushroom", "Mollusks, oyster" -> "Oyster
# Mollusks") otherwise. Confirmed by checking every real occurrence.
OYSTER_CUT_HEADS = {"beef", "emu", "ostrich", "veal", "venison", "bison"}

def _is_redundant_with_head(flip_word_lower, head_first_word_lower):
    """True when flipping would double up a word the head already names,
    e.g. "Fish, catfish" -> flip would give "Catfish Fish" (catfish already
    means "a fish"), and "Corn, popcorn" -> flip would give "Popcorn Corn"
    (popcorn already means "a corn"). General suffix check rather than a
    hand-listed word set: whenever the clause word itself ends with the
    head's first word, appending that head again is a real doubling-up
    error, not just awkward phrasing. Length-gated (>=3) so short heads
    like "Oil"/"Egg" don't produce false positives against unrelated
    clause words that happen to end in the same couple of letters.
    """
    return (len(head_first_word_lower) >= 3
            and flip_word_lower != head_first_word_lower
            and flip_word_lower.endswith(head_first_word_lower))

# ---------------------------------------------------------------------------
# Gazetteer 2: single-word clauses that are anatomical cuts / organ names /
# meat-preparation nouns, or plant-part nouns -- JOIN unflipped (just drop
# the comma, keep original order: "Beef, brisket" -> "Beef Brisket").
#
# Confirmed by hand: every real head these attach to in the dataset is
# either a meat/poultry/fish species (for the anatomical set) or a produce
# item (for the plant-part set) -- never a case where the established
# culinary/botanical convention would instead want the word moved to front.
# ---------------------------------------------------------------------------
JOIN_SINGLE_WORD = {
    # Anatomical / cuts / meat-prep nouns
    "loin", "brisket", "chuck", "flank", "plate", "rib", "ribs", "round",
    "rump", "shank", "foreshank", "hindshank", "backribs", "shoulder",
    "sirloin", "tenderloin", "breast", "thigh", "drumstick", "drumsticks",
    "wing", "wings", "leg", "legs", "heart", "liver", "kidney", "kidneys",
    "tongue", "tail", "brain", "brains", "lungs", "pancreas", "spleen",
    "sweetbread", "sweetbreads", "carcass", "tripe", "cheek", "neck",
    "gizzard", "giblets", "feet", "hip", "knuckle", "blade", "belly",
    "thymus", "marrow", "bone", "fillet", "fillets", "steak",
    "steaks", "chop", "chops", "patty", "patties",
    # Plant-part nouns
    "leaves", "leaf", "root", "roots", "bulb", "bulbs", "tuber", "tubers",
    "rhizome", "rhizomes", "pods", "pod", "stalks", "stalk", "flesh",
    "seeds", "seed", "kernel", "kernels", "husk", "peel", "rind", "core",
    "pulp", "stem", "stems", "petiole", "petioles", "inflorescence",
    "spear", "spears", "floret", "florets",
    # Processed-form nouns (X-source + form-noun => "X Form" is the
    # established name, e.g. "Rice, bran" -> "Rice Bran", "Tomato, paste"
    # -> "Tomato Paste"). Confirmed no reverse-direction case exists for any
    # of these in the dataset (unlike "milk"/"cream", handled separately).
    "flour", "meal", "paste", "juice", "powder", "puree", "bran",
    # "meat" confirmed only ever follows an animal-species head in this
    # dataset ("Goat, meat" -> "Goat Meat", "Horse, meat" -> "Horse Meat"),
    # the reverse role from "pork"/"chicken"/etc above -- see report.
    "meat", "pickles", "grain", "bacon", "fat", "caviar", "jam",
}

# ---------------------------------------------------------------------------
# Gazetteer 3: two-word clauses -- curated whitelists only (no general
# multi-word heuristic; too much real ambiguity, see report). Anything not
# in one of these two dicts is left unchanged.
# ---------------------------------------------------------------------------
FLIP_TWO_WORD = {
    "whole wheat", "low fat", "gluten free", "fat free", "reduced fat",
    "medium fat", "free range", "high oleic", "high linoleic",
    "salt reduced", "green skin", "red skin", "white flesh",
    "yellow flesh", "whole grain",
    # Apple cultivar names -- confirmed to read as the real common name
    # when flipped ("Golden Delicious Apple", "Granny Smith Apple", etc.)
    "golden delicious", "granny smith", "granny-smith", "red delicious",
    "royal gala", "pink lady",
}

JOIN_TWO_WORD = {
    "top round", "top sirloin", "top loin", "loin chop", "rump steak",
    "cube roll", "shoulder clod", "breakfast strips", "fan fillet",
    "leg roast", "roasting piece", "inside leg", "outside leg",
    "inside drum", "outside drum", "inside strip", "outside strip",
}

# ---------------------------------------------------------------------------
# Genuinely bidirectional single words: "milk"/"cream" each go a *different*
# direction depending on whether the head is the flavor/ingredient source
# (join: "Coconut Milk", "Coconut Cream") or a baked/prepared good the dairy
# word is describing (flip: "Milk Bread", "Cream Cheese", "Cream Crackers").
# "fruit" has the same split: join when the head is the produce item itself
# and "fruit" means the botanical fruit-part ("Tomatoes, fruit" -> "Tomatoes
# Fruit"), flip when the head is a prepared dish/product "fruit" describes
# ("Yogurt, fruit" -> "Fruit Yogurt"). Every real occurrence of all three
# words across all 7 sources was checked by hand; any (head, word) pairing
# NOT listed here is left unchanged rather than guessed -- same hand-
# verified-exception-table convention as CATEGORY_OVERRIDES/
# PREP_METHOD_OVERRIDES in build_food_reference_db.py.
# ---------------------------------------------------------------------------
AMBIGUOUS_HEAD_CLAUSE_WORDS = {"milk", "cream", "fruit", "mince"}

AMBIGUOUS_HEAD_CLAUSE_OVERRIDES = {
    ("coconut", "milk"): "join",
    ("coconut", "cream"): "join",
    ("bread", "milk"): "flip",
    ("cracker", "milk"): "flip",
    ("crackers", "milk"): "flip",
    ("cheese", "cream"): "flip",
    ("crackers", "cream"): "flip",
    # "fruit" -- join side (head is the produce item; "fruit" names the
    # botanical part, same sense as "leaves"/"root"/"flesh" elsewhere)
    ("chayote", "fruit"): "join",
    ("zucchini", "fruit"): "join",
    ("tomatoes", "fruit"): "join",
    ("cucumber", "fruit"): "join",
    ("sweet peppers", "fruit"): "join",
    ("hot peppers", "fruit"): "join",
    ("oriental pickling melon", "fruit"): "join",
    ("chinese preserving melon", "fruit"): "join",
    ("quandong", "fruit"): "join",
    ("gombo", "fruit"): "join",
    ("bitter melon", "fruit"): "join",
    # "fruit" -- flip side (head is a prepared dish/product "fruit" flavors)
    ("yogurt", "fruit"): "flip",
    ("yogourt", "fruit"): "flip",
    ("scone", "fruit"): "flip",
    ("pie filling", "fruit"): "flip",
    ("juice drink", "fruit"): "flip",
    ("cheesecake", "fruit"): "flip",
    # "mince" -- join side (head is the animal source; "mince" is the
    # British-English term for ground meat, e.g. "Beef, mince" -> "Beef
    # Mince"). Flip side: "Pie, mince" -> "Mince Pie" is a specific,
    # distinct, traditional dish name, not "minced pie".
    ("beef", "mince"): "join",
    ("chicken", "mince"): "join",
    ("lamb", "mince"): "join",
    ("pork", "mince"): "join",
    ("venison", "mince"): "join",
    ("pie", "mince"): "flip",
}

# JOIN_SINGLE_WORD's "steak" is right for every animal-species head
# ("Beef, steak" -> "Beef Steak", "Camel, steak" -> "Camel Steak") except
# "Pie", where "Steak Pie" (a specific traditional dish) is correct instead
# -- a single narrow exception, not worth promoting "steak" to the full
# per-head override machinery above.
JOIN_WORD_HEAD_EXCEPTIONS = {
    ("pie", "steak"): "flip",
    # "Ham, leg" -- "leg" is the right cut-noun default for animal-species
    # heads generally, but the standard retail term here is "Leg Ham"
    # (flip), not "Ham Leg".
    ("ham", "leg"): "flip",
}

# A handful of real brand names in this dataset are NOT written in ALL
# CAPS (unlike the BANQUET/SILK/HORMEL-style rows the general brand-head
# check above already catches), so they'd otherwise be misread as an
# ordinary food noun and get their "Gluten Free"/"Gluten-Free" clause
# wrongly flipped in front ("Udi's, Gluten Free" -> "Gluten Free Udi's" is
# backwards; a brand name should stay first, same as the ALL-CAPS cases).
# Checked by hand against the dataset -- these are the only non-ALL-CAPS
# heads that are actual brand names, not genuine food nouns.
BRAND_NAME_HEADS_LOWER = {"udis", "vans", "schar", "rudis", "andreas"}

# Heads that are themselves already a naming adjective ("Meatless, X") --
# whatever food noun follows should just be appended in place, never
# flipped in front of it (flipping "Meatless, chicken" would produce the
# nonsensical "Chicken Meatless"). Confirmed narrow: only "Meatless" shows
# this pattern in the dataset.
FORCE_JOIN_HEADS = {"meatless"}

# Prepositional/state-phrase starters -- wrap the whole clause as a
# trailing lowercase parenthetical rather than guess at reordering it, e.g.
# "Cucumber, with peel" -> "Cucumber (with peel)".
PREP_PHRASE_STARTERS = {"with", "without", "in", "on", "for", "from"}


def _titleize(text):
    """Capitalize the first letter of each space-separated word, preserving
    the rest of each word's original casing -- same convention as
    build_food_reference_db.py's _titleize_first_letters(), extended here
    to also handle hyphenated/slash-joined words sensibly."""
    def cap_part(part):
        # Capitalize the first alphabetic character in this part, wherever
        # it falls -- handles leading punctuation like an open-paren
        # ("(bitter" -> "(Bitter") as well as the plain case.
        idx = next((i for i, c in enumerate(part) if c.isalpha()), None)
        if idx is None:
            return part
        return part[:idx] + part[idx].upper() + part[idx + 1:]

    def cap_word(word):
        if not word:
            return word
        parts = re.split(r"([-/])", word)
        return "".join(p if p in ("-", "/") else cap_part(p) for p in parts)

    return " ".join(cap_word(w) for w in text.split(" "))


def _top_level_comma_split(s):
    """Split on the first comma that is NOT nested inside parentheses.
    Returns (head, rest) or (s, None) if no top-level comma exists."""
    depth = 0
    for i, ch in enumerate(s):
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
        elif ch == "," and depth == 0:
            return s[:i], s[i + 1:]
    return s, None


def _parens_balanced(s):
    depth = 0
    for ch in s:
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
            if depth < 0:
                return False
    return depth == 0


def _looks_non_english(source):
    # France_Ciqual base_names are French; reordering French adjective
    # order is a translation problem, not the word-order problem this
    # module solves. See module docstring.
    return source == "France_Ciqual"


def reorder_base_name(base_name, source=None):
    """Attempt to reorder a single base_name into natural English order.

    Returns a dict: {
        "input": original base_name,
        "output": possibly-transformed name (== input if unchanged),
        "changed": bool,
        "action": one of "flip", "join", "parenthetical",
                  "not_applicable" (no comma to begin with),
                  "skip_non_english", "skip_malformed",
                  "skip_ambiguous_or", "skip_multi_clause",
                  "skip_unrecognized",
        "reason": short human-readable explanation,
    }

    Conservative by design: every "skip_*" action means the name is
    returned completely unchanged. Nothing is ever guessed.
    """
    result = {"input": base_name, "output": base_name, "changed": False,
              "action": "not_applicable", "reason": ""}

    if not base_name:
        return result

    if _looks_non_english(source):
        result["action"] = "skip_non_english"
        result["reason"] = ("France_Ciqual base_names are French; reordering is a "
                             "translation task, not word-order, and out of scope here.")
        return result

    if "," not in base_name:
        result["reason"] = "no comma present"
        return result

    if not _parens_balanced(base_name):
        result["action"] = "skip_malformed"
        result["reason"] = "unbalanced parentheses in source string (likely truncated upstream) -- left untouched"
        return result

    head, rest = _top_level_comma_split(base_name)
    if rest is None:
        # Comma exists but only inside parens, e.g.
        # "Balsam-pear (bitter gourd, bitter melon)" -- already reads
        # naturally as "Head (clarifier)"; nothing to reorder.
        result["reason"] = "comma is already inside a trailing parenthetical; name already reads naturally"
        return result

    head_original = head.rstrip()
    rest = rest.strip()
    # Title-case the head for display too -- a handful of sources (mostly
    # Canada_CNF game-meat rows like "bison, chuck"/"deer, loin") store the
    # head itself all-lowercase. Purely cosmetic and safe: _titleize only
    # ever raises casing, and an ALL-CAPS brand head is untouched since its
    # first letter is already uppercase.
    head = _titleize(head_original)

    # A second top-level comma means a real multi-clause chain -- outside
    # this module's confidently-tested scope (see report: this turned out
    # to be extremely rare in base_name specifically, but still defended).
    _, rest2 = _top_level_comma_split(rest)
    if rest2 is not None:
        result["action"] = "skip_multi_clause"
        result["reason"] = "more than one top-level comma; deferred as a compound/ambiguous case"
        return result

    if not rest:
        result["reason"] = "empty clause after comma"
        return result

    first_token = head.split(" ", 1)[0]
    first_token_letters = [c for c in first_token if c.isalpha()]
    head_first_word_lower = re.sub(r"[^a-z]", "", head.split(" ", 1)[0].lower())
    head_is_brand = ((len(first_token_letters) >= 2 and all(c.isupper() for c in first_token_letters))
                      or head_first_word_lower in BRAND_NAME_HEADS_LOWER)

    # Full head text, lowercased/whitespace-normalized, for the small
    # number of overrides keyed on a multi-word head (e.g. "sweet peppers").
    head_full_lower = re.sub(r"\s+", " ", head_original.strip().lower())

    if head_first_word_lower in FORCE_JOIN_HEADS:
        new_name = f"{head} {_titleize(rest)}"
        result["output"] = new_name
        result["changed"] = new_name != base_name
        result["action"] = "join"
        result["reason"] = "head is itself already a naming adjective (e.g. \"Meatless\") -- the food noun stays after it, never flipped in front"
        return result

    # --- Brand-name head: always join, never flip (see report -- every
    # real ALL-CAPS-headed example is "BRAND, product description"). ---
    if head_is_brand:
        new_name = f"{head} {_titleize(rest)}"
        result["output"] = new_name
        result["changed"] = new_name != base_name
        result["action"] = "join"
        result["reason"] = ("brand-name head (ALL CAPS) -- product description stays "
                             "after the brand, never moved in front")
        return result

    # --- Pure parenthetical clause: "(word or word)" is a genuine
    # unresolved alternative -- do not guess which option to use. ---
    if rest.startswith("(") and rest.endswith(")"):
        inner = rest[1:-1].strip()
        if re.search(r"\bor\b", inner, re.IGNORECASE):
            result["action"] = "skip_ambiguous_or"
            result["reason"] = "parenthetical presents multiple alternatives (\"X or Y\") -- picking one would be guessing"
            return result
        # A single clarifying alternate name -- keep trailing, just format.
        new_name = f"{head} ({_titleize(inner)})"
        result["output"] = new_name
        result["changed"] = new_name != base_name
        result["action"] = "parenthetical"
        result["reason"] = "single clarifying alternate name -- reformatted as trailing parenthetical, not moved to front"
        return result

    # --- "word (word)" -- main clause plus a trailing parenthetical
    # clarifier, e.g. "Beans, cranberry (roman)". Resolve the main clause
    # normally, then reattach the parenthetical untouched-in-position. ---
    paren_match = re.match(r"^(.*\S)\s*\(([^()]+)\)$", rest)
    if paren_match:
        main_clause, paren_content = paren_match.group(1).strip(), paren_match.group(2).strip()
        if re.search(r"\bor\b", paren_content, re.IGNORECASE):
            result["action"] = "skip_ambiguous_or"
            result["reason"] = "trailing parenthetical presents multiple alternatives -- picking one would be guessing"
            return result
        sub = _resolve_clause(main_clause, head_first_word_lower, head_full_lower)
        if sub is None:
            result["action"] = "skip_unrecognized"
            result["reason"] = f"clause before the parenthetical (\"{main_clause}\") did not match a confident pattern"
            return result
        direction, display = sub
        paren_display = f" ({_titleize(paren_content)})"
        if direction == "flip":
            new_name = f"{display} {head}{paren_display}"
        elif direction == "replace":
            new_name = f"{display}{paren_display}"
        else:
            new_name = f"{head} {display}{paren_display}"
        result["output"] = new_name
        result["changed"] = new_name != base_name
        result["action"] = direction
        result["reason"] = f"resolved main clause (\"{main_clause}\") + kept trailing parenthetical clarifier in place"
        return result

    # --- Prepositional/state phrase: wrap trailing, don't reorder. ---
    first_word_of_rest = rest.split(" ", 1)[0].lower()
    if first_word_of_rest in PREP_PHRASE_STARTERS:
        new_name = f"{head} ({rest})"
        result["output"] = new_name
        result["changed"] = new_name != base_name
        result["action"] = "parenthetical"
        result["reason"] = "prepositional/state phrase -- kept as a trailing parenthetical rather than guessing a front position"
        return result

    resolved = _resolve_clause(rest, head_first_word_lower, head_full_lower)
    if resolved is None:
        result["action"] = "skip_unrecognized"
        result["reason"] = "clause did not match any confidently-tested pattern"
        return result

    direction, display = resolved
    if direction == "flip":
        new_name = f"{display} {head}"
    elif direction == "replace":
        new_name = display
    else:
        new_name = f"{head} {display}"
    result["output"] = new_name
    result["changed"] = new_name != base_name
    result["action"] = direction
    if direction == "replace":
        result["reason"] = "clause is itself a complete species name that already contains the generic head word -- head dropped to avoid a redundant double-up (e.g. not \"Catfish Fish\")"
    else:
        result["reason"] = "matched gazetteer/override rule"
    return result


def _resolve_clause(clause, head_first_word_lower, head_full_lower):
    """Return (direction, display_text) or None if unresolved.

    direction is 'flip', 'join', or 'replace'. display_text is the clause,
    correctly cased for display, WITHOUT the head attached yet.
    """
    lowered = clause.lower()
    words = clause.split(" ")

    if len(words) == 1:
        word = lowered
        if word == "oyster":
            if head_first_word_lower in OYSTER_CUT_HEADS:
                return "join", _titleize(clause)
            return "flip", _titleize(clause)

        if word in AMBIGUOUS_HEAD_CLAUSE_WORDS:
            override = AMBIGUOUS_HEAD_CLAUSE_OVERRIDES.get((head_full_lower, word))
            if override:
                return override, _titleize(clause)
            return None

        exception = JOIN_WORD_HEAD_EXCEPTIONS.get((head_first_word_lower, word))
        if exception:
            return exception, _titleize(clause)

        if word in JOIN_SINGLE_WORD:
            return "join", _titleize(clause)
        if word in FLIP_SINGLE_WORD:
            if _is_redundant_with_head(word, head_first_word_lower):
                return "replace", _titleize(clause)
            return "flip", _titleize(clause)
        return None

    if len(words) == 2:
        if lowered in JOIN_TWO_WORD:
            return "join", _titleize(clause)
        if lowered in FLIP_TWO_WORD:
            return "flip", _titleize(clause)
        return None

    return None
