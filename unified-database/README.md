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

## Status: a continued proactive scan — a real, large batch: cooking-method gaps (simmered/casseroled/sashimi/in brine), a real, narrow wheat-gluten/seitan fix deliberately avoiding a "gluten-free" brand collision, plural gaps (ice creams, chewing gum, stock), a bare 'sauce' general exclude with real, verified exceptions (apple sauce, soy/soya/fish sauce), a promoted 'smoothie' exclude, a real burger-composite leak, and a real tofu-dumpling leak — plus a real, direct opinion on whether a "made gluten-free" brand-name product belongs in this database

**A real, direct opinion, asked mid-scan: should "Andrea's, Gluten Free
Soft Dinner Roll" stay, even though it's a name brand, given it's
specifically made for a real dietary need?** No — excluded, consistent
with the already-established BRAND_NAMES principle. The reasoning: this
app already has a real, separate mechanism for gluten avoidance (Purple
Digest/Healing-Stages condition-based filtering, working on plain,
tagged real ingredients), and a branded product's own proprietary recipe
(almost certainly a rice/tapioca-starch-and-xanthan-gum blend) isn't a
whole food regardless of which real need it serves — if gluten-free
sympathy earns an exception, so does every other brand's own real
dietary claim (low-sodium, dairy-free, keto), and BRAND_NAMES stops
meaning anything. The real need is already served honestly by this
database's own plain flours.

**Real cooking-method words missing entirely, each checked against
every real still-unclassified record before adding.** 'simmered' (44
real records, every one a plain organ/muscle cut of meat or fish).
'casseroled' (26 real Australia_AFCD records, every one a plain cut of
meat with the source's own explicit "no added fat" qualifier). 'sashimi'
(6 real records, plain raw sliced fish/mollusk). 'in brine' (9 real
records, the same traditional brine-preservation category already
accepted for 'pickled'). All four added to `RAW_WHOLE_FOOD_HINTS`.

**A real, narrow wheat-gluten fix, deliberately NOT a bare 'gluten'
keyword.** Checked first and found a real, serious collision: `\bgluten\b`
bound-matches inside "gluten-free" (a hyphen is a non-word character),
and over 20 real branded "Gluten-Free" products (Van's, Udi's, Schar,
Glutino, Mary's Gone Crackers) would have been wrongly swept in. Added
three narrow, verified-safe phrases instead — 'wheat gluten', 'seitan',
'gluten (from wheat' (a real record ending exactly at a literal closing
paren surfaced a genuine `\b`-after-non-word-character gap, caught by
testing the fix against the real record, fixed by dropping the trailing
paren from the keyword itself).

**Real plural/word-order gaps, the same recurring lesson this whole
project keeps re-learning, found again three more times.** 'ice creams'
(this exact lesson is already named directly in this file's own
FAST_FOOD comment, yet the plural form itself was never added — "Ice
creams, vanilla, light, no sugar added" was wrongly true via a
coincidental "no sugar added" substring match). 'chewing gum' (natural
word order; the reversed comma form 'gum, chewing' already existed but
never matched the natural phrasing real Sweden/France records actually
use). 'stock' (broth — found only by spot-checking the new 'sauce' fix's
own real results: "Veal stock for sauces and cooking, dehydrated" was
still wrongly true, since \bsauce\b doesn't bound-match "sauces";
fixing 'stock' generally, since it's clearly a derived/extracted liquid
in its own right, incidentally also closes that plural gap with no
separate fix needed).

**A real, large bare 'sauce' general exclude, checked against every one
of the ~150 real currently-"true" records containing it first.** Every
single one turned out to be a genuine composite sauce/condiment (butter
sauce, cheese sauce, cream sauce, béchamel, tomato sauce, ravioli in
sauce), wrongly resolving true by leaking through `PLAIN_DAIRY_KEEP`'s
own cheese/cream/butter/milk match with no idea a "sauce" qualifier sat
right next to it — the same real "even the simplest traditional version
is still a real combination of 2+ whole foods" principle this file
already applies to aioli/hummus/pesto. Handled via the same real guard
mechanism already used for 'soda'/'baking soda', with a small, real,
verified exception list (`SAUCE_EXCLUDE_GUARD_PHRASES`): 'apple sauce'
(the same real category as 'compote'), 'soy sauce'/'soya sauce'/'fish
sauce' (real, traditional single-process fermented condiments, the same
category as miso/tempeh — added to `FERMENTED_KEEP` as real positive
matches). Deliberately did NOT except "Worcestershire sauce" — a
genuine multi-ingredient blend (vinegar, molasses, anchovies, tamarind,
onion, garlic, spices), correctly stays excluded by the new rule. This
same investigation also caught 'ketchup' and 'vitamin water' as real,
standalone manufactured-product signals that deserved their own general
exclude, and 'ready-made' as a real, explicit, previously-unrecognized
manufactured-product phrase.

**'smoothie' promoted from a scoped-only disqualifier to a real general
exclude.** Was already in `PRODUCT_SIGNAL_DISQUALIFIERS`, but only
consulted by the spice/herb and pantry-staple checks, never checked
generally. Checked every real smoothie record in the database first —
zero legitimate single-ingredient exceptions (a smoothie, by definition,
blends 2+ things). Real, confirmed damage: 17 records ("Smoothie mix,
pineapple, mango and banana, frozen" and 6 siblings combining 2-3 named
fruits each — the same real unknown-ratio-mix problem already fixed
twice for nuts and dried fruit) were wrongly true; 15 more were sitting
unclassified.

**Two real, disqualified-leak bugs, the exact same shape already fixed
twice this session for nuts/seeds and natural sweeteners, found this
time on burgers and tofu.** A dedicated `isDisqualifiedBurgerProduct`
function (mirroring `isDisqualifiedNutOrSeedProduct`) catches a real
composite burger/hamburger SANDWICH — "Chicken burger with bread
accessories" and "Hamburger double w. bread cheese pickled cucumber
cooked in a restaurant" were wrongly true, leaking through `BREAD_KEEP`'s
own 'bread' match and `PLAIN_DAIRY_KEEP`'s own 'pickled' match.
Deliberately NOT a blanket "burger" exclude — "Hamburger, raw" (a real
Norwegian naming convention for plain ground beef) and "Hamburger bread"
(the plain bun on its own) both stay correctly true, checked and
confirmed unaffected, since neither contains the real, narrow
'with'/'restaurant' assembly signal every genuine composite record
actually uses. Separately, "Tofu dumpling (not suitable for vegans),
prepackaged" was wrongly true via bare 'tofu' with no disqualifier at
all — fixed with a real, dedicated 'dumpling'/'dumplings' check inline
in `classifyOne`.

**Real, small, honestly-accepted tradeoff, not chased further:** 2
Canada_CNF records ("Artichoke, stock, canned, drained") turned out, on
checking the real underlying French name ("Artichaut, fond,
appertisé"), to be a genuine MISTRANSLATION of "fond" (artichoke heart)
as "stock" — a real, pre-existing translation-layer bug outside this
file's own scope, not a classification-rule problem. These two were
already only accidentally true via a coincidental match before this
fix, not correctly true for the right reason, so the new 'stock' exclude
now (incorrectly, but honestly) also excludes them — the same class of
small, accepted cost already named elsewhere in this file
("tart"/"cutlet").

**Real, before/after counts, whole database (excludes the 242 already
human-reviewed records, which this pass never touches):**

| | Before | After |
|---|---|---|
| Whole food | 16,948 | 16,854 |
| Not whole food | 12,228 | 12,824 |
| Needs review | 3,531 | 3,029 |
| Total | 32,707 | 32,707 |

Test suite: 306/306 passing (up from 266).

**Real, higher-value leads found but deliberately NOT fixed this pass,
named directly rather than silently dropped, for a future round:**
several named French cheese varieties with no "cheese" in their own name
(Saint-Félicien, Morbier, Coulommiers — scope not yet investigated);
'garlic' as a plain vegetable/spice identity (for "Garlic powder" and
similar); a real multi-meat "meatballs" combination pattern (Pork+beef,
beef+lamb); one real, low-volume "Burger veg. potatoes, lentils, beans,
corn... frozen food" record combining 4 named vegetables (the same
unknown-ratio-mix problem, not caught by the new burger disqualifier
since it says neither "with" nor "restaurant").

## Status: a real, first human-reviewer decisions round-trip through the audit tool — 242 classification overrides, 54 real match-group member removals, 1 group flagged for a real split

The first real decisions export from the "Unified Whole-Foods Database
— Specimen Review" audit tool, applied via the already-built (but not
yet exercised on real data) `pipeline/apply-audit-decisions.js`. Its own
test suite (`apply-audit-decisions.test.js`, 7/7) was re-run first to
confirm the tool itself was trustworthy before pointing it at the live
32,707-record database.

**242 real classification decisions** (218 `not_whole`, 24 `whole`) — a
real, direct human override of whichever automated rule had previously
decided (or failed to decide) each record, now permanently marked
`reviewed=1` so no future `reclassify-all.js` run can silently overwrite
a person's own judgment call. Spot-checked a real sample against the
live data before AND after applying: real composite baby foods, a real
Dutch egg-liqueur ("Advocaat"), a real rolled-anchovy-with-capers
preparation, and a real branded-sounding French Ciqual product name were
all confirmed `not_whole`; real, plain single-ingredient foods ("Alfalfa
sprouts," algae jelly, a real bottled pale ale, salted anchovy) were
confirmed `whole` — including several real judgment calls that go
narrower than what this file's own automated rules alone would have
concluded (a bottled, named beer style and a smoked/salted preserved
fish, both real human calls this pipeline defers to rather than
second-guesses).

**54 real match-group member removals** — real cross-source auto-match
mistakes a person caught by eye: "Carrot, cooked" wrongly grouped with
"Carrot juice," "Chicken, drumstick, with skin, roasted" wrongly grouped
with the raw variant, and 52 more, each removed from its own specific
wrong group without touching the group's other, correct members.

**1 real group flagged `needs_split`** (group 4, "Barley, cooked" +
"Barley, uncooked," `Hordeum vulgare L.`) — persisted on
`food_match_groups.needs_split` (the apply script's own first real use
of this column; confirmed it added itself via the standard, additive
`PRAGMA table_info` + conditional `ALTER TABLE` migration, no data
loss) so a future review session can find and act on it again, not just
a one-time report that gets lost after this run.

Re-exported and rebuilt the audit tool afterward — it now shows 32,465
real records still awaiting review (32,707 total minus the 242 just
reviewed), confirming the tool's own review queue reflects real,
current reviewed status, not a stale snapshot.

## Status: a continued proactive scan — a real, direct investigative question about banana cultivars (no code change, a genuine source-data limitation), then a large batch of real bugs found by following that same investigation's own real data further: 'sugared' never recognized at all, 'compote' never actually implemented despite an existing comment saying it should be, a Canadian-spelling 'yogourt'/'yogurts' plural gap, a 'flavors'/'flavours' plural-noun gap, real missing manufactured-product signals (confection/confectionery, pizza, formulated/simulated, puddings), real missing alcohol names (champagne, tequila, mezcal, maotai) plus the one real cocktail collision that had to be fixed first (Kir), and a third real instance of the "mix leak" bug class already fixed twice before, this time on NATURAL_SWEETENER_KEEP

**The banana question, answered directly, no code change.** Real, direct
question: "Banana cooking banana are listed but they aren't designated
as any specific cooking type of banana... There are dozens of other
starchy, non-plantain banana varieties that must be cooked before
eating... Is there a way to tell which they are talking about?"
Investigated directly, including reading the real, full `raw_json` for
the Sweden record in question -- confirmed the underlying source
(`sources/sweden.js`, whose own header comments already document this)
genuinely carries no scientific-name or LangualCodes data at all for any
Swedish record, a real, honest limitation of the source itself, not a
pipeline bug. Left as-is: a real, legitimate single-ingredient food
("cooking banana, unspecified variety"), currently unclassified anyway
for an unrelated reason (no stated cooking-state word).

**'sugared' -- a real, direct signal of added sugar, completely
unrecognized anywhere in this file.** Found while following the banana
investigation into a fresh random sample of the review queue. Real,
confirmed damage: 34 real Germany_BLS records ("Rhubarb sugared, canned,
drained," "Pear sugared, canned, drained," "Apple sauce/apple compote,
sugared, canned," and 20+ more canned-fruit siblings, plus "Egg, yolk,
raw, frozen, sugared, pasteurized") were sitting at `is_whole_food=1`,
resolving wrongly true via whatever OTHER keyword happened to be nearby
(canned, raw, dried, whole) since nothing ever checked for the explicit
"sugared" qualifier sitting right next to it. Several more real records
("Strawberries sugared," "Pear preserves... lightly sugared layer,"
"Sugared chocolate confectionery") were sitting unclassified for the
same reason. Added to `ADDED_SUGAR_SALT_OR_PROCESSING`, checked directly
that `\bsugared\b` does not bound-match "unsugared."

**'compote' -- an existing comment already said a plain compote should
be accepted, but nothing had ever implemented it.** Real, confirmed
damage: over 30 real Germany_BLS/France_Ciqual/Norway/Sweden records
("Pear compote," "Blackberry compote," "Fruit compote," and every
explicitly "unsweetened" variant -- "Pear compote unsweetened,"
"Blueberry compote unsweetened") were sitting unclassified in the
review queue, never resolving true. Added as a general, LATE-checked
positive hint in `RAW_WHOLE_FOOD_HINTS` (the last fallback in
`classifyOne`, after every exclude gate has already run) -- verified
directly that every real composite/sweetened/flavored compote already
in the database (with sauce, with cream, with nuts, with artificial
sweetener, inside a pudding/dumpling dish) is already correctly excluded
upstream by an existing rule, so none of them ever reach this list.
36 real records now resolve true via `raw_or_simply_cooked: compote`.

**'yogourt'/'yogurts' -- a real Canadian-English spelling gap and a real
plural/word-boundary gap, both on the same real word.** Canada_CNF
writes "Yogourt" (not "yogurt") throughout its own real data -- neither
`PLAIN_DAIRY_KEEP` nor `FERMENTED_KEEP` recognized it at all, so all 78
real "Yogourt" records, plain AND flavored alike, fell straight through
to the review queue with neither the plain-dairy accept path nor the
flavored-dairy exclude check ever engaging. 'yogurts' (plural) is a
separate, real gap for the same reason as "buttermilk" before it:
`\byogurt\b` does not bound-match "Frozen yogurts, flavors other than
chocolate," which was wrongly resolving true via the unrelated 'frozen'
hint instead. Both added to `PLAIN_DAIRY_KEEP`.

**'flavors'/'flavours' (plural noun) -- a real, distinct word form from
the already-recognized 'flavored'/'flavoured' (adjective).** Real,
confirmed damage, independent of the yogourt fix above: "Pickled herring
different flavors" (wrongly true via `plain_dairy_or_ferment: pickled`,
no flavor check ever engaging) and "Kefir, fruit flavours, low fat"
(wrongly true via `plain_dairy_or_ferment: kefir`). Added to
`FLAVOR_OR_ADDITIVE_MARKERS`.

**Real, missing manufactured-product/composite-dish signals, each
checked against every real record before adding.** 'confection'/
'confectionery'/'confectionary' (British spelling)/'confectioner'/
'confectioners'/'confections' -- real candy/sweet manufactured products;
checked ~90 real records, zero legitimate single-ingredient exceptions
("Traditional confectionery, 'Uiro'," "Ice confection, stick,
milk-based," "Oil, industrial, palm kernel, confection fat" were all
wrongly true via a coincidental nearby match). 'pizza' -- a real
composite baked dish, zero legitimate single-ingredient reading; every
topped variant was already only excluded by coincidence (matching "ham"/
"sausage" as its OWN keyword), never because "pizza" itself was ever
recognized, and 3 real plain "Pizza, ..." records were sitting
unclassified. 'puddings' (plural) -- the exact same real plural/word-
boundary gap already fixed for "fast food"/"cereal": 'pudding' (singular)
already lived in `CANDY_SNACKS`, but `\bpudding\b` doesn't bound-match
"Puddings," so 2 real records were wrongly true via 'dry'. 'formulated'/
'simulated' -- real, standalone manufacturing-process words; 4 real
wheat-based mock-nut records ("Nuts, formulated, wheat-based, ... except
macadamia") were wrongly true via a coincidental nut-identity match, and
5 real unbranded "Formulated bar, ..." snack-bar records were sitting
unclassified. All four added to `COMPOSITE_DISH_SIGNALS`.

**Real, missing single-ingredient alcohol names -- champagne, tequila,
mezcal, maotai -- plus the one real collision this required fixing
first.** Checked directly for false-positive risk before adding bare
'champagne': "Kir (with white wine)" was ALREADY wrongly true via the
existing bare 'wine' keyword (a real, traditional wine-plus-liqueur
cocktail, not plain wine), and its sibling "Kir royal (with champagne)"
would have picked up the same wrong result the moment 'champagne' was
added. Fixed by adding 'kir' to `CANDY_SNACKS` first (checked: every
real "Kir" record in this database is this one cocktail family; no
collision with unrelated German "Kirsch"/"Kirschtorte," which never has
a word boundary after "Kir" to begin with). 'tequila'/'mezcal' -- also
fixes a real, honest labeling bug: "Agave spirit (Mezcal/Tequila)" was
resolving true via the coincidental, misleading `natural_sweetener:
agave` label instead of an honest alcohol one (see the NATURAL_SWEETENER
fix below for how this now defers correctly). 'maotai' -- a real,
traditional single-ingredient (sorghum) Chinese distilled spirit,
Japan_MEXT's own real data already tags it "Distilled alcoholic
beverage" directly. All four added to `ALCOHOL_KEEP`.

**A third real instance of the same "mix leak" bug class already fixed
twice this session (nuts/seeds; `SAFE_OVERRIDES`' own dried-fruit
phrase) -- this time on `NATURAL_SWEETENER_KEEP`.** `honey`/`maple
syrup`/`molasses`/`agave` had no disqualifier of their own at all, so a
real composite dish that merely CONTAINS one of them as one ingredient
among several was resolving wrongly true before any later, more specific
check ever got a chance to run. Real, confirmed damage, each checked
against its own actual record: "Oats, rolled, mixed with sugar or honey
& other flavours" and its "Porridge..." sibling (composite breakfasts);
"Pancake, plain, homemade with butter and maple syrup," "Thin waffle
filled with honey, prepackaged," "Cracker, honey sesame," "Honey Puffed
Corn Balls" (real manufactured/composite products named directly);
"Yoghurt mild honey fat 2% enriched" (a flavored yogurt, wrongly true via
'honey' alone, before the dairy check's own flavor-marker logic ever
ran); "Chicken pan with lime honey crème fraiche" (a composite dish --
caught only after testing the fix against the real record revealed
'cream' doesn't bound-match the real record's own accented "crème," the
same real accent lesson already learned for 'saut'/'sauté'). One real,
deliberately DIFFERENT case handled as a defer-not-disqualify: 'spirit'
("Agave spirit (Mezcal/Tequila)") skips this whole branch entirely
rather than resolving false, so it correctly falls through to the new
`ALCOHOL_KEEP` 'tequila'/'mezcal' entries above instead -- still true,
just via an honest label. New `NATURAL_SWEETENER_DISQUALIFIERS` list,
checked every currently-true natural-sweetener record against it first
(plain "Honey," "Molasses," "Agave, raw/cooked/dried," "Maple syrup,"
"Melon, honey dew, peeled, raw" all confirmed to stay correctly true).

**Real, before/after counts, whole database:**

| | Before | After |
|---|---|---|
| Whole food | 17,023 | 16,926 |
| Not whole food | 11,748 | 12,015 |
| Needs review | 3,936 | 3,766 |
| Total | 32,707 | 32,707 |

Test suite: 266/266 passing (up from 231).

**One real, genuinely different-category bug found along the way,
deliberately NOT fixed in this same pass, named here so it isn't lost:**
`Pasta, fresh, filled with meat and cheese, Tortellini, industrially
made` (and its uncooked sibling) is a real, genuine composite filled-
pasta dish, still wrongly resolving true via `plain_dairy_or_ferment:
cheese` -- a different real category of problem (filled/stuffed pasta as
its own composite-dish family) than anything addressed in this batch,
worth a real, dedicated look in a future proactive-scan pass rather than
force-fit here.

## Status: "a sunflower seed is a seed" — a real, direct instruction on salt/seasoning, a real, genuine ratio-uncertainty question about mixed products, and a real, structural bug found only by testing the fix against real data

Direct, real feedback: "a sunflower seed is a seed, so it should be kept
as long as it isn't salted already or seasoned. I am also seeing jams
and jellies and preserves and sauces and enriched things, and
strudels, and a mic [mix] od [of] seeds and raisins which sounds fine
because they're not salted but how do you know how much of each is in
the mix is the problem."

**"Seed, sunflower" — fixed properly, not left as an accepted
tradeoff.** The previous pass left this real, reversed-word-order
record as a small, deliberate gap. Investigated properly this time:
pulled every real "Seed,"/"Seeds," -prefixed record in this database
(Norway_Matvaretabellen's own real naming convention) and found the
real reversed-order set is small and fully enumerable, not an unbounded
risk — exactly 5 real species ("Seed, chia," "Seed, pumpkin," "Seed,
sesame," "Seed, sunflower," "Seed, hemp"), each added as its own
explicit reversed-compound phrase. "Sesame, hulled seed" remains a
real, genuine, low-volume exception (1 record, a 3-word interruption)
— still an honest, bounded tradeoff, the same standard as "tart"/
"cutlet."

**Salted and seasoned, per direct instruction.** 'salted' (checked
directly — `\bsalted\b` correctly does not bound-match "unsalted," so
every real "unsalted"/"without salt" record stays unaffected);
'with salt' (a real, separate phrase for "with salt added"/"with
salt," also confirmed safe against "without salt" the same way).
'seasoned' turned out to be a real, general, database-wide gap, not
just a nut-specific one — checked against every real currently-TRUE
record (24 of them, spanning canned vegetables, dried fish, baked
fillets, pickled products) and confirmed zero "unseasoned" collision
risk anywhere, so it's now a real general exclude.

**The real "how do you know how much of each is in the mix" question,
answered directly: a mix of two or more separately-identifiable whole
foods has a genuinely unknowable individual ratio, the same real
problem this database's own core single-ingredient scope already
exists to avoid — true regardless of salt.** Checked and confirmed
this was already a real, live bug at scale, not hypothetical: all 18
real "Nuts, mixed nuts, ..." records (several already salted) were
sitting at `is_whole_food=1`. 'mix'/'mixed' added as real disqualifiers.

**A real, structural bug found only by testing the new salt/mix
disqualifiers against real data, not assumed to work because the logic
looked right**: `NUT_SEED_KEEP` is checked relatively late in
`classifyOne` — meaning a genuinely disqualified record could still
resolve true via an EARLIER-checked rule with no idea the disqualifier
existed. Confirmed live: "Seeds, sunflower seed kernels, oil roasted,
with salt added" and "Nuts, mixed nuts, oil roasted with peanuts" both
still resolved true via `OIL_KEEP`'s own bare 'oil' match (from "oil
roasted"). Fixed the same way this file already fixes an early-
precedence problem elsewhere (`isBottledMineralWater`,
`isAlcoholicCocktailOrCocktailSauce`): a real, dedicated function
checked EARLY, before `SAFE_OVERRIDES`/`OIL_KEEP`/etc. ever get a
chance to fire, reusing the exact same `NUT_SEED_KEEP`/
`NUT_SEED_DISQUALIFIERS` lists rather than duplicating them. A real,
second instance of the identical leak was found by checking the same
principle more broadly once the first one turned up: "Mixed nuts with
dried fruit" and "Mixed dried fruit" were both resolving true via
`SAFE_OVERRIDES`' own 'dried fruit' phrase, which had no disqualifier
of its own at all — fixed the same way.

**Real, additional finds along the way, not directly reported**: a
second real naming convention for the same seed family — USDA writes
"pumpkin AND squash seed(s)," which the plain "pumpkin seed" compound
phrase doesn't match — checked and confirmed via the exact same
"caught it by re-testing against the real function output" discipline
that already found the "Croissants" plural miss; 'enriched' (a real,
third bug, "Wheat petals with walnuts, hazelnuts or almonds, enriched
with vitamins and minerals" wrongly true via its own nut mention, a
real composite cereal product, not a plain nut — deliberately scoped
to the nut-specific disqualifier list only, the same "leave the broader
fortification question open" standard already applied to plain milk's
own vitamin-D precedent); 'strudel' (a real composite pastry, several
real records say "strudel dough" rather than "pastry" and weren't
caught before); 'planters' (a real, confirmed nut brand found live).

Real, concrete effect:

  Whole food:        17,215 -> 17,023
  Not whole food:     11,539 -> 11,748
  Needs human review:  3,953 ->  3,936

Every real fix spot-checked directly against the live, re-classified
database. 231/231 classify.js tests passing (up from 216). Audit-tool
data regenerated and republished to the same URL.

## Status: "Are we including all nuts and seeds?" — a real, direct question that surfaced a substantial gap, plus a real, honest self-caught repeat of the same mistake this file had already fixed for other keywords earlier the same pass

Asked directly, not a bug report: "Are we including all nuts and
seeds?" Investigated before answering — the real, honest answer was
no: hundreds of genuinely plain, single-species records ("Walnuts,"
"Brazil nuts," "Pistachio nuts," "Sunflower seed") had no stated
cooking-state qualifier at all (no "raw"/"roasted"/"dried"), so nothing
in this file ever recognized them.

**Built the same way `SPICE_HERB_KEEP` already solves the identical
problem for spices/herbs**: a new, real, explicit `NUT_SEED_KEEP`
identity list — almond, walnut, pecan, cashew, pistachio, hazelnut,
filbert, macadamia, brazil nut, pine nut, chestnut, peanut, groundnut,
sunflower seed, pumpkin seed, chia seed, flaxseed, linseed, sesame
seed, hemp seed, tahini — no separate raw/dried/ground check needed,
matching the name alone is enough. A real, genuine collision found and
avoided: "Macchiato" contains "chia" as a literal substring, so `chia
seed` is kept as a full phrase rather than the bare word, which would
have wrongly matched every real macchiato/latte record in this
database. `brazil nut`/`pine nut` kept as full phrases for the same
real reason (bare "brazil" risks a country-name collision; bare "pine"
would match inside "pineapple").

**A real, honest self-correction, caught only by testing every planned
entry against the real function output rather than trusting the
reasoning alone**: the first version of this exact list only had
singular forms — missing the *identical* real plural word-boundary gap
this same file had already documented and fixed multiple times in the
immediately preceding pass (bagel/bagels, croissant/croissants). Bare
"Almonds," "Walnuts," "Pecans," "Brazil nuts," "Pine nuts,"
"Chestnuts," "Sunflower seeds," "Pumpkin seeds," "Chia seeds," "Sesame
seeds," "Hemp seeds," and "Peanuts" were all sitting unmatched until
this was caught by comprehensively re-testing the whole batch, not
assumed correct because the singular forms worked. Every plural added
was individually confirmed against real data first — three plausible
candidates (macadamias, filberts, groundnuts) were checked and found
to have zero real occurrences, so deliberately left out rather than
added speculatively.

**A real, second, separate bug found along the way, not reported
directly**: `BREAD_KEEP` had the exact same gap — "Bagels" (plural)
was never matching its own singular "bagel" keyword, sitting at
`is_whole_food=null` for 14 real records ("Tortillas": 6 real records;
"Chapatis": 1). Fixed alongside the nut/seed plurals.

**Real, general composite-dessert/candy/alcohol signals found and
confirmed along the way**, each checked against every real currently-
classified record before being added as a genuine new general exclude:
'macaroon'/'macaroons' (coconut or almond flour + egg white + sugar,
baked — the same real family as the already-excluded 'meringue');
'praline'/'pralines' (a real chocolate-and-filling candy — checked all
12 real currently-TRUE records, every one genuinely composite: brandy,
coconut cream, caramel cream, coffee); 'marzipan' (almond paste +
sugar, a real combination even in its own "raw paste" form); 'brittle'
(a real hard candy); 'dragee'/'bisque'; 'liqueur' (a real, flavored/
compound spirit — the exact same "Compound alcoholic beverage" family
already excluded, reached by a different real name); and 'cakes'
(plural — the same word-boundary fix, now correctly catching real
manufactured rice cakes too, while a real, deliberately-untouched
"compote" was confirmed to stay a legitimate simple preparation).

**Real, nut/seed-specific disqualifiers**, checked against every real
composite record this scan surfaced: 'beverage'/'drink' (real plant-
milk products — a real, separate, deliberately not-yet-decided
category question, left alone the same way the earlier oat/soy-
beverage fortification question was); 'porridge'; 'curry'/'curried'
(both real word forms needed); 'caramel'; 'pork' (a real composite
cured-meat product using a nut as one ingredient); 'bar'; 'puffs' (a
real manufactured, extruded-style snack that doesn't literally say
"extruded"); 'compote' — scoped to this nut-specific list only, not the
general exclude list, since a plain single-fruit compote with no nut
mentioned never reaches this check at all. One real, low-volume
exception deliberately left unaddressed: "Nuts, almond paste" (1
record) — real-world "almond paste" almost always means a sweetened,
marzipan-adjacent product, but a bare 'paste' disqualifier would also
have wrongly caught the already-correct, genuinely plain "Sesame
paste, tahini" match, so this one ambiguous record was left as a
small, accepted tradeoff rather than risk that collision. Two more
real, low-volume word-ORDER exceptions ("Seed, sunflower," "Sesame,
hulled seed") were found and left the same way, matching the same
bounded-tradeoff standard already used for "tart"/"cutlet."

Real, concrete effect:

  Whole food:        17,160 -> 17,215
  Not whole food:     11,357 -> 11,539
  Needs human review:  4,190 ->  3,953

Every real fix spot-checked directly against the live, re-classified
database. 216/216 classify.js tests passing (up from 197). Audit-tool
data regenerated and republished to the same URL.

## Status: a second real, proactive scan — the single largest batch of fixes yet, including one major real bug (42 "Fast foods" records never actually excluded), a real, direct decision on alcohol, and a real, honest 2-record self-correction caught mid-pass

Requested directly: "Continue the proactive scan for more issues like
this." Pulled a real, random 100-record sample of the review queue
(the same repeatable method already established), then followed
several real threads it surfaced out to their own full scope via
direct SQL investigation — not stopping at the first example of each
pattern.

**The single biggest find: USDA's own "Fast foods, X" category prefix
(264 real records) was never actually excluded at all.** The
`FAST_FOOD` list only ever had singular "fast food," but the real data
is always plural ("Fast foods, nachos, with cheese") — and
`\bfast food\b` requires a word boundary right after "food," which
"foods" (continuing straight into "s") never has. The exact same
recurring word-form lesson as "ice cream"/"ice creams,"
"cereal"/"cereals." Real, concrete damage: 42 genuine fast-food items
(nachos, tacos, burritos, pizza, cinnamon rolls, chimichanga,
enchilada, tostada, breakfast sandwiches) were sitting at
`is_whole_food=1`, wrongly passing via whatever OTHER keyword happened
to be in their own longer name (cheese, butter, cream, cinnamon).

**A real, direct decision, put to the app's owner rather than assumed:
should plain, single-type alcohol (beer, wine, sake, whisky, vodka,
rum, gin, brandy) count as legitimate whole food?** This database
already accepts kombucha/kimchi/miso as "fermented whole food," and
Japan_MEXT's own real data literally tags sake/beer/wine "Fermented
alcoholic beverage" — the direct answer: **include it**, on the
reasoning that both fermentation and distillation from one base
ingredient fit the same "single ingredient plus a simple, traditional
transformation" category already accepted for cheese and yogurt.
Composite/mixed/flavored/branded alcohol stays excluded regardless
(cocktails, Japan_MEXT's own self-declared "Compound alcoholic
beverage" category — Umeshu, vermouth, fortified wine, curacao — named
mixed drinks like piña colada and daiquiri that use the adjective
"Alcoholic" form, and branded beer). Real, non-alcoholic look-alikes
were checked and excluded *before* the new positive keywords were
added, specifically to protect them: root beer (a soda, no alcohol at
all, despite the name), wine sauce, wine cooler, mulled wine, spirited
wine, and three named real fortified-wine styles (Madeira, Port,
Sherry).

**Real, traditional whole-food-based combinations, same principle as
the earlier aioli/hummus/ajvar family:** mayonnaise (egg + oil +
vinegar, checked all 136 real records, zero exceptions); croissant,
scone, muffin (real sweet/laminated pastries, the same family as
cake/donut/pastry, not the minimal-ingredient bread exception);
omelet/omelette (real whipped-egg preparation, almost always
pan-cooked, the same direct-fat-contact reasoning as frying); relish,
brawn (head cheese — a jellied meat product made *by definition* from
combining animal parts), refried (mashed AND fried), "con carne"
(Spanish "with meat," always a real composite stew) — every one
individually checked against its own full real record set, zero
legitimate single-ingredient exceptions found in any of them.

**A real, standalone chemical-additive/manufacturing-process signal,
found live, not reported:** any record naming its own real E-number
("Ascorbic acid (E 300)," "Cutter additives phosphate-based (E 450)")
is a purified chemical additive, not a food, regardless of natural
origin — 8 real records, all genuine additives. 'extruded' (a real
manufacturing-process word with no legitimate single-ingredient
meaning at all — nothing is naturally extruded without a machine, 34
real records, zero exceptions) and 'compound' (Japan_MEXT's own
self-declared blend category, 12 real records, zero exceptions).

**Real, genuine plant-based dairy ALTERNATIVES, not real dairy at
all** despite matching a real dairy keyword: "Plant-based product,
used as cheese," "Plant-based yogurt alternative, made from soya" — 14
real records were wrongly passing via `PLAIN_DAIRY_KEEP`'s own
'cheese'/'cream'/'yogurt' keywords. Added 'plant-based' to the same
flavor/additive disqualifier mechanism that already protects real
dairy from flavored/sweetened variants.

**Real, simple mechanical/traditional processing steps this pass found
genuinely missing, each individually verified**: 'buttermilk' (bare,
2 real records — the exact same fused-compound-word gap as "ice
cream"); 'tofu' (real, traditional soy-milk coagulation with a simple,
traditional agent — the same category already accepted for cheese,
given its own new dedicated rule so the output stays honest about what
it actually is, rather than misleadingly saying "dairy"); 'desiccated'
(a real, separate word for "dried"); 'toasted' (a real, separate word
for "roasted"); 'puree'/'pureed' (a real, simple mechanical
single-ingredient step, the same category as "mashed"); 'canned' (the
same real category as "frozen" — added LAST, only once every real
composite-canned-dish signal this same scan found was already in
place, then re-verified against a fresh real sample); 'pickled'/
'pickles' and 'vinegar' (real, simple brine/acetic-acid preservation,
the same real category as kombucha/kimchi/miso).

**A real, honest self-correction, caught mid-pass by re-testing every
single planned change against the real function output rather than
trusting the reasoning alone:** "Croissants" (plural) was initially
left out of the new croissant exclude, the exact same word-form mistake
this whole file has already documented multiple times for OTHER
keywords — caught only because "Croissants, butter" was individually
re-tested and came back wrongly `true` (via the 'butter' dairy match)
before this was ever called done, not assumed correct because the
singular form worked.

Real, concrete effect:

  Whole food:        16,142 -> 17,160
  Not whole food:     10,901 -> 11,357
  Needs human review:  5,664 ->  4,190

Every real fix spot-checked directly against the live, re-classified
database, not assumed from the rule logic alone. 197/197 classify.js
tests passing (up from 160). Audit-tool data regenerated and
republished to the same URL.

## Status: a real, direct report on alcoholic cocktails, then a real, direct correction reversing the "fried without fat" call, then a real, genuine question about sautéed hijiki — all resolved by the same underlying principle

**Alcohol cocktails and cocktail sauce.** Reported directly: "Lots of
these are in there Alcohol, cocktail, daiquiri (rum), homemade, which
will have more than just rum." Investigated every real "cocktail"-
containing record still sitting unclassified (36 of them) before
writing anything — confirmed the real, distinct shapes: "Alcohol,
cocktail, daiquiri (rum), homemade" (rum + lime juice + sugar),
"Alcohol, cocktail, whisky sour mix, powder" (a real, multi-ingredient
sour-mix blend, not a single spirit), Germany_BLS's own "Cocktail,
&lt;name&gt;" naming convention for a dozen more real mixed drinks
(Bloody Mary, Gin and tonic, Mojito, Cuba libre, Kir royale, Hugo,
Caipirinha...), France_Ciqual's "Rum-based cocktail" / "Whiskey
cocktail," and "Sauce, cocktail, ready-to-serve" (real cocktail sauce
— ketchup, horseradish, lemon juice, Worcestershire, a genuine
composite condiment). Every one is a real combination of 2+ separate
ingredients, the same "even the traditional version is still a
combination" principle already applied to the aioli/hummus/ajvar
family.

Deliberately NOT a bare "cocktail" keyword — checked and confirmed real
collision risk first: "Fruit cocktail" (diced mixed fruit — a real,
separate judgment call this report didn't ask for, left untouched),
"Onions, pickled, cocktail/silverskin" (a real, single-ingredient onion
SIZE, not a mixed drink at all), and the already-correctly-resolved
juice-cocktail family would all have been wrongly swept in by a
blanket keyword. Built as a new, explicit function requiring
"cocktail" alongside a real, confirmed alcohol/spirit/mix signal or the
cocktail-sauce shape instead. One real correction made while verifying
this against the live function's own actual output, not just reasoned
about: "Cocktail mix, non-alcoholic, concentrated, frozen" does NOT
bound-match "alcohol" (the word continues straight into "-alcoholic"),
so a separate, explicit "cocktail" + "mix" check was added to correctly
catch this real, composite beverage-mix concentrate too.

**"Fried without fat" — reversed.** The previous pass treated "fried
without fat" as a deliberate point of contrast (a legitimate simple
preparation, unlike "home-made" or "stewed"). Reported directly, and
corrected: "In the moderate confidence area, Albacore deep-frozen,
fried without fat (pan) was frozen first and then they fried it.
Frying changes the food and the oil is no good for you. These kinds of
things should not be in a whole food database." Checked every real
"fried"-containing record (1,196 of them) before making this change —
frying, unlike every other accepted cooking method already in this
list (boiled, roasted, steamed, grilled, baked, broiled, poached,
braised), is the one method involving direct fat/oil contact and real
structural transformation, whether or not fat is separately stated as
"added." Bare "fried" is now a general exclude, superseding the old
qualified-phrase-only positive rule (removed outright, not left as
dead code).

This surfaced two real, separate pre-existing bugs along the way, both
fixed by the same change: protein literally "rolled in flour, fried in
fat" or "flour coated, fried" had been wrongly passing as whole food
via the FLOUR rule, and composite manufactured products ("Vegeburger
mix... fried in vegetable oil," "Fast foods, potato, french fried in
vegetable oil") had been wrongly passing via the OIL rule.

**Sautéed hijiki — a real, genuine question, not a bug report.**
"I don't want to remove something that shouldn't be so I'm not sure
about Algae, 'Hijiki', boiled and dried, stainless steel pot process,
rehydrated and sautéed. It has gone through a process and then sauteed
so it is cooked. That leads me to believe it is a product. How would a
Japanese person trying to eat wholefood only think of it?"

Resolved as the same real principle as frying: sautéing is direct-fat-
contact cooking under a different name. The BASE "boiled and dried"
hijiki (and its "rehydrated and boiled" sibling) stays a real whole
food — that boil-then-dry step isn't a recipe or a combination of
ingredients, it's the only way this sea vegetable is ever safely eaten
at all (raw hijiki carries real, documented natural inorganic arsenic
content), the same single-ingredient-plus-mandatory-processing shape
already accepted for dried fruit — and reconstituting a dried whole
food by boiling it in water is no different from rehydrating dried
beans. The "rehydrated and SAUTÉED" variant is the one that changes: a
real, additional cooking step applied at consumption time, not part of
the base product's own identity — now correctly excluded.

Building this keyword correctly took real, verified investigation, not
assumption: JavaScript's own `\b` word-boundary logic treats an
accented character like "é" as a non-word character, which silently
made the fuller keyword "sauté" fail to match a bare, standalone
"Sauté" sitting at the very end of a real record ("Kidney Sauté") —
confirmed directly by running both forms against real text, not
reasoned about in the abstract. The shorter, unaccented "saut" prefix
reliably catches every real accented form instead; "sauteed" (plain
ASCII) needed its own separate, explicit keyword for the same real
reason.

Real, concrete effect:

  Whole food:        17,095 -> 16,142
  Not whole food:      9,463 -> 10,901
  Needs human review:  6,149 ->  5,664

Every exact reported record re-confirmed directly against the live,
re-classified database after the fix, not assumed from the rule logic
alone. 160/160 classify.js tests passing (up from 138). Audit-tool data
regenerated and republished to the same URL.

## Status: a real, direct report — Ajvar, a real "stewed" plural gap, and a real, deliberate point of contrast (a legitimate simple preparation this time)

Reported directly, four real records at once, three flagged for
exclusion and one flagged as a deliberate CONTRAST: "Ajvar, sweet
pepper sauce, home-made, says that it is a home made thing, but what
are the ingredients and at what amounts within it? Alaska pollock fried
without fat (oven) says it is fried right in the name and even has the
word oven there. Ajvar and spinach sauce actually says it is two things
to make a sauce. Alaska pollock stewed is obviously a stewed list of
ingredients."

**Ajvar** — a real, traditional Balkan roasted-red-pepper-and-eggplant
relish, the exact same "even the traditional version is a real
combination of 2+ whole foods" shape as the aioli/hummus/guacamole
family from the previous pass. One keyword ("ajvar") cleanly catches
every real variant: the sweet-pepper-sauce home-made version, the
explicit two-vegetables "Ajvar and spinach sauce," canned, relish, and
"Ajvaryogurt."

**"Stewed"** — `COMPOSITE_DISH_SIGNALS` already excluded `stew`, but
`stewed` (446 real records) is a real, separate word for word-boundary
matching purposes — the same recurring lesson as "ice cream"/"ice
creams," "cereal"/"cereals," "croquette"/"croquettes."

**"Fried without fat" — the real point of contrast, confirmed and
implemented, not just excluded.** Unlike "home-made" (which says
nothing about real ingredients/ratios) or "stewed" (which implies
multiple combined ingredients), "fried without fat" is a real, complete,
unambiguous description of a single real ingredient prepared a simple
way, with nothing added — the same real shape as the already-accepted
`boiled`/`roasted`/`grilled`/`baked` cooking methods. Bare `fried` stays
deliberately excluded from the positive list (real ambiguity — a
"fried" dish can involve unstated batter/breading), but the qualified
phrase carries none of that ambiguity. Checked against all 662 real
matching records before adding: every genuinely composite/breaded
variant ("Alaska pollock breaded, deep-frozen, fried without fat
(oven)") is already caught by the general exclude gate, which runs
first, so this is a safe, purely additive positive signal.

**Real, concrete effect on all 32,707 already-ingested records**: 4
ajvar records and 446 stewed records excluded; 381 real records newly,
correctly classified as whole food via "fried without fat." All four
exact reported records confirmed behaving correctly.

| | Before this pass | After this pass |
|---|---|---|
| Whole food | 16,893 | 17,095 |
| Not whole food | 9,051 | 9,463 |
| Needs human review | 6,763 | 6,149 |

138/138 classify.js tests passing (up from 131), 183/183 across the
whole pipeline.

## Status: a real, direct question — "traditional" vs. commercial preparations — resolved as a real, general principle

Asked directly, not reported as a bug: "Things like Aioli can be healthy
if it is the traditional Aioli with just garlic and extra virgin olive
oil, but if it is commercially sold it isn't so great. I don't know how
we can keep it if we can verify that it is only [traditional]... What
is your opinion?"

**The real, resolved principle, not a per-record verification problem
this pipeline has no way to solve anyway** (a bare name never says
which real recipe was actually used): even the cleanest, most
traditional version of any of these — hand-pounded garlic whisked into
extra virgin olive oil, nothing else — is still a real combination of
2+ separate whole foods, never a single ingredient, no matter how
simple or additive-free the real recipe is. Every one of those real,
separate ingredients (garlic, olive oil; chickpeas, tahini, lemon;
avocado, lime, onion, cilantro) already lives, or will live, in this
database on its own. Nothing real is lost by excluding the combined
preparation itself — the app's own Sauces Builder already exists for a
person to combine them themselves, with full visibility into exactly
what went in, rather than a database entry that claims to be "Aioli"
while silently unable to say whether it means garlic-and-oil or a
bottle of preservative-laden mayo. The same reasoning had already
justified excluding `pesto` earlier this session; this generalizes it
to the rest of the real family, checked at real scale before adding
anything: `aioli` (4 real records), `hummus`/`hommus` (10),
`guacamole` (5), `salsa` (14), `tzatziki` (5), `tapenade` (1) — 39
total, added to `COMPOSITE_DISH_SIGNALS`.

**Real, concrete effect on all 32,707 already-ingested records**: 39
records excluded. Real, separate whole-food ingredients (garlic, olive
oil, chickpeas) spot-checked and confirmed unaffected.

| | Before this pass | After this pass |
|---|---|---|
| Whole food | 16,897 | 16,893 |
| Not whole food | 9,012 | 9,051 |
| Needs human review | 6,798 | 6,763 |

131/131 classify.js tests passing (up from 120), 176/176 across the
whole pipeline.

## Status: a proactive, self-initiated scan of the review queue — not waiting for the next one-at-a-time report

The app owner's own real, repeated pattern this session ("I keep
expecting to not see things like these in the list with all of my
explanations, but somehow many still sneak past") called for a real
change in approach, not just another individual fix. Rather than wait
for the next report, pulled a real, random 200-record sample from the
current 6,952-record review queue and scanned it directly for the same
class of remaining gap.

**Real, confirmed clean, added directly**: `dessert` (baby-food/pudding/
wine desserts, never a single ingredient — 128 real records), `stuffed`
(a stuffed anything is, by definition, 2+ combined foods — 28 records),
`restaurant prepared` (an explicit, unambiguous commercial marker — 19
records), `pie` (135 records — Apple pie, Beef Pot Pie, Boston cream
pie), `croquette`/`croquettes` (19 records — the plural needed adding
separately, the same recurring word-boundary lesson as "ice cream" vs.
"ice creams" and "cereal" vs. "cereals"), `fritter` (5 records).

**Two real, similarly-plausible candidates checked and deliberately
left out, worth naming directly rather than silently skipped**: `tart`
has a genuine double meaning in this data — a pastry ("Apple crumble
tart") but also a real taste descriptor for sour foods ("Cherry juice,
tart," "Cherries, tart, dried, sweetened"), so excluding it generally
would have wrongly excluded legitimate tart-flavored juice.
`cutlet`/`cutlets` also has a real, legitimate exception — "Lamb,
cutlet or frenched cutlet, with bone, lean, raw" is a genuine, simple
butchered cut (matching this whole project's own "butchered cuts count
as whole food" rule), not automatically breaded/composite the way
"cutlet" often implies elsewhere in this same real data. Both spot-
checked directly and confirmed still correctly classified as whole
food after this pass.

**Real, concrete effect on all 32,707 already-ingested records**: 334
additional records excluded (128 dessert, 135 pie, 28 stuffed, 19
restaurant-prepared, 19 croquette/croquettes, 5 fritter).

| | Before this pass | After this pass |
|---|---|---|
| Whole food | 17,029 | 16,897 |
| Not whole food | 8,726 | 9,012 |
| Needs human review | 6,952 | 6,798 |

120/120 classify.js tests passing (up from 112), 165/165 across the
whole pipeline. A real, honest note for whoever picks this up next: a
proactive scan like this one is worth repeating periodically as the
review queue shrinks further, rather than only reacting to individual
reports — the same real, random-sample-and-scan method used here is
fully repeatable.

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
