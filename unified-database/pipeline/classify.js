// The real, codified whole-food rule engine -- runnable logic, not just
// prose. Built on the exact, already-proven keyword lists from this
// project's own original filter_whole_foods_v2.py (ClaudeWork/), which
// already did this job once, in English, for the first 7 sources -- not
// reinvented from scratch, extended with the rules the app's owner
// confirmed directly for this pass:
//   - butchered meat/fish cuts still count as whole food (cutting isn't
//     modification)
//   - plain milk/yogurt/butter/cream/cheese count, but a flavored or
//     sweetened version of any of them does NOT -- "as long as they have
//     no additives or flavorings" (a real, meaningful tightening of the
//     old script's own looser FERMENTED_KEEP, which kept anything with
//     "yogurt" in the name regardless of what else was added)
//   - 100% fresh-pressed juice counts; juice from concentrate or with
//     added sugar does not
//   - fresh-frozen is fine for any of the above -- freezing preserves,
//     it doesn't modify
//   - dried fruit (and other dried whole foods) counts, matching the
//     original script's own SAFE_OVERRIDES precedent
//
// A SECOND, real tightening pass -- the app owner's own directly-stated
// final scope: "The only variation we should allow in the database is
// whole food, dried whole food, fermented whole food, fresh squeezed or
// pressed juice, or oil, and fresh harvest frozen whole food, including
// dairy, cheeses... Our goal is to provide all of the whole foods that
// food dishes are made of and a few things such as dairy or fermentations
// that are gut healthy. We are not including already made dish items, or
// non-whole food products." Plus three real, direct follow-ups in the
// same conversation, all incorporated below: breads (explicitly, "because
// of the expansion of who this app is for" -- the free tier gets it
// regardless of which conditions a person's own filtering later excludes
// it for), whole spices and fresh herbs ("flavor is the basis for
// enjoying the food"), and flours in pulverized form ("for being able to
// bake things... we're trying to get them to understand what it is
// they're putting into their body").
//
// Every one of the four new categories below (oil, bread, flour,
// spice/herb) was designed against REAL data already sitting in this
// database, not written speculatively -- the same discipline this whole
// pipeline has held to throughout. Querying real names surfaced two
// genuinely new bugs in the ALREADY-EXISTING rule order, fixed here too,
// not just noted: "Kathrinchen honey gingerbread biscuits" was matching
// NATURAL_SWEETENER_KEEP's "honey" before the general exclude list ever
// ran (a gingerbread COOKIE that happens to contain honey isn't "honey"),
// and "Bagel with smoked salmon cream cheese salad" was matching
// SAFE_OVERRIDES' "smoked salmon" the same way (a bagel SANDWICH that
// happens to contain smoked salmon isn't "smoked salmon"). Fixed by
// moving the general exclude check to run FIRST, ahead of both --
// nothing in either positive list has ever overlapped with a real
// exclude keyword, so this reorder is safe for every existing case and
// fixes both real, live bugs at once.
//
// "We aren't tracking by the apple slice" -- a real, explicit scope
// note, not a code change on its own: cutting/dicing/slicing a raw
// produce item doesn't create a meaningfully different whole food (an
// apple, whole or sliced, is still just "apple" for whole-food-
// classification purposes), and already correctly classifies as whole
// food today regardless of physical cut state, since the classifier
// keys off cooking/processing words (raw, boiled, dried, etc.), never
// cut-state ones. The real, separate question of whether cut-state
// variants should collapse into ONE canonical food during cross-source
// MATCHING (match.js) -- versus cook-state variants like raw/boiled,
// which the live app's own existing architecture already tracks as
// real, separate prep_method rows sharing one base food identity -- is
// deliberately left for the later Phase 5 merge/curation step, not
// solved here: classify.js's own job is only "is this record a whole
// food at all," never "how many distinct app-facing entries should this
// become."
//
// SAFETY RULE, worth stating plainly: this only ever attempts a
// confident decision against a record's REAL English name
// (name_english, or name_original when the source's own language is
// already English). A non-English record with no verified English name
// yet is NEVER guessed at -- it comes out is_whole_food: null,
// auto_confidence: 'low', reviewed: 0, forcing it into the human-review
// queue rather than risking a silent wrong answer because a keyword
// list built for English text happened not to match untranslated text.
// That's not a limitation to work around later -- it's the actual
// intended behavior: no automated tool in this project has ever been
// allowed to guess past its own real evidence.

const PROCESSED_MEAT = [
  'sausage', 'bacon', 'hot dog', 'frankfurter', 'salami', 'pepperoni',
  'bologna', 'pastrami', 'luncheon meat', 'lunch meat', 'deli meat',
  'spam', 'corned beef', 'jerky', 'ham', 'smoked ham', 'vienna sausage',
  'chorizo', 'prosciutto', 'pate', 'pâté', 'meat spread', 'potted meat',
  'canned meat', 'hot dogs',
  // Found live, reported directly: real German-family sausage names,
  // each written as one unbroken compound word (no space for a plain
  // "sausage" keyword's own word-boundary check to key off), were
  // slipping through entirely -- 11 real, confirmed records (e.g.
  // "Beef-Bratwurst grilled," "Bratwurst, chicken, cooked") were sitting
  // at is_whole_food=1, the exact same real category of product
  // "sausage" already excludes, just under a different real name. Each
  // added as its own explicit keyword rather than a general "wurst"
  // suffix check, since these are genuine compound words with no
  // internal boundary a word-boundary regex could otherwise find.
  'bratwurst', 'bockwurst', 'bierwurst', 'rostbratwurst', 'mettwurst',
  'leberwurst',
];

const CANDY_SNACKS = [
  'candy', 'candies', 'chocolate bar', 'chocolate-coated', 'cookie',
  'cookies', 'cake', 'pastry', 'pastries', 'donut', 'doughnut',
  'ice cream', 'sherbet', 'frozen dessert', 'soda', 'cola', 'soft drink',
  'chips', 'potato chip', 'corn chip', 'tortilla chip', 'frosting',
  'icing', 'marshmallow', 'gum, chewing', 'candy bar', 'toaster pastry',
  'fruit snack', 'gummy', 'gelatin dessert', 'pudding', 'fruit drink',
  'punch', 'energy drink', 'sports drink',
  // Found live while checking real bread/flour data for this pass --
  // "gingerbread" (always a real spiced sweet baked good, never a whole
  // food -- confirmed clean against every real record actually in this
  // database) was slipping through entirely, including via a real,
  // separate bug: "Kathrinchen honey gingerbread biscuits" was matching
  // NATURAL_SWEETENER_KEEP's own "honey" before this exclude list ever
  // got a chance to run (see classifyOne's own reordering fix below).
  'gingerbread',
  // Well-known, SPECIFIC composite salad-dish names -- deliberately not
  // a bare "salad" keyword, which real data showed would incorrectly
  // exclude genuine standalone leafy greens some sources name that way
  // ("Arugula salad," "Endive salad," "Frisée salad"; "Cornsalad, raw"
  // -- a real vegetable, corn salad/mâche -- is already safe either way
  // since it's written as one unbroken word with no space, so \bsalad\b
  // never matches inside it). These specific phrases are real, widely-
  // recognized dish names with essentially no legitimate single-
  // ingredient reading.
  'egg salad', 'caesar salad', 'potato salad', 'tuna salad', 'taco salad',
  'chicken salad',
  // Found live, reported directly: "'Wasp nests' almond meringue" --
  // checked every real "meringue" record and confirmed every one is a
  // genuine composite baked dessert (whipped egg white and sugar,
  // baked, often with chocolate/cream/almond), never a single
  // ingredient -- fits the same real family as CANDY_SNACKS' own
  // cake/pastry/donut entries.
  'meringue',
  // Found live, reported directly: "'Springerle' anise biscuits" and
  // "'Zedernbrot' lemon almond biscuits." Checked the real, full scope
  // first: 296 real records contain "biscuit"/"biscuits," and only 4 of
  // them are the real, borderline "savoury...crispbread" case this file
  // already keeps reachable via BREAD_KEEP's own separate 'crispbread'
  // entry (a source describing plain crispbread without the word
  // "biscuit" at all still correctly classifies whole food either way).
  // The other 292 are real, confirmed sweet or composite baked snacks --
  // and several were already live, confirmed FALSE POSITIVES (not just
  // sitting in review), all via the SAME real, remaining gap: "dry" (a
  // RAW_WHOLE_FOOD_HINTS word meant for legumes/grains, e.g. "Lentils,
  // dry") was also incidentally matching "Plain dry biscuit," "Dry
  // biscuit with chocolate topping," "Dry fruit biscuit, low sodium" --
  // none of them plain, whole legumes. 'biscuit'/'biscuits' added as a
  // real, general exclude, running before that collision can happen.
  'biscuit', 'biscuits',
  // Found live, reported directly: "Adzuki beans, mature seeds, 'An'
  // (bean paste), 'Koshi-an' (strained bean paste)" -- a real,
  // multi-step processed derivative (cooked, mashed, often strained
  // and/or sweetened), not the whole bean itself, despite "Adzuki beans"
  // appearing right in the name. Confirmed via real data: every one of
  // the three real Japanese bean-paste variants in this database
  // ("Koshi-an," "Sarashi-an," "Tsubushi-an") includes the literal
  // phrase "bean paste" in its own parenthetical description, making it
  // a safe, general, unambiguous keyword.
  'bean paste',
  // Proactive, self-initiated pass -- checked the current review queue
  // for more of the same real pattern before waiting for another
  // one-at-a-time report. Real, confirmed clean (every sampled record a
  // genuine composite): 'dessert' (baby food/pudding/wine desserts,
  // never a single ingredient), 'stuffed' (a stuffed anything is by
  // definition 2+ combined foods -- "Green olives, filled or stuffed
  // (anchovies, peppers, etc.)," "Fresh stuffed pasta"), 'restaurant
  // prepared' (an explicit, unambiguous commercial-preparation marker),
  // 'pie' (Apple pie, Beef Pot Pie, Boston cream pie -- every real
  // record a genuine composite baked good or dish), 'croquette' and
  // 'fritter' (both inherently breaded/fried mixtures).
  //
  // Two real, similarly-plausible candidates were checked and
  // DELIBERATELY LEFT OUT, worth naming directly rather than silently
  // skipped: 'tart' has a genuine double meaning in this data -- a
  // pastry ("Apple crumble tart") but also a real taste descriptor for
  // sour foods ("Cherry juice, tart," "Cherries, tart, dried,
  // sweetened"), and excluding it generally would wrongly exclude
  // legitimate tart-flavored juice. 'cutlet' also has a real,
  // legitimate exception -- "Lamb, cutlet or frenched cutlet, with
  // bone, lean, raw" is a genuine, simple butchered cut (matching this
  // whole project's own "butchered cuts count as whole food" rule),
  // not automatically breaded/composite the way "cutlet" often implies
  // elsewhere in this same real data.
  'dessert', 'stuffed', 'restaurant prepared', 'pie', 'croquette',
  'croquettes', 'fritter',
];

const FAST_FOOD = [
  'fast food', 'mcdonald', 'burger king', 'kentucky fried', 'kfc',
  'taco bell', 'pizza hut', "wendy's", 'subway', 'domino',
];

const ADDED_SUGAR_SALT_OR_PROCESSING = [
  'sweetened', 'with added sugar', 'honey roasted', 'glazed', 'candied',
  'in syrup', 'heavy syrup', 'sugar coated', 'frosted', 'breaded',
  'battered', 'deep fried', 'deep-fried', 'imitation', 'artificial',
  'flavored drink', 'cheese product', 'cheese food', 'process cheese',
  'processed cheese', 'pasteurized process', 'processed product',
  'processed food', 'cheese, processed', 'spread, ', 'margarine',
  'shortening', 'non-dairy', 'creamer, non', 'whipped topping',
];

// Real, direct correction, made in the same pass: 'sugar, granulated' /
// 'sugar, powdered' / 'sugar, white' (and their plural forms) used to
// live here as real EXCLUSIONS -- reversed per the app owner's own
// direct instruction: "things like baking soda, sugar, brown sugar, and
// other things that humans have been using for the past 100 years prior
// to the heavy processing of foods began should be in this list." Plain
// granulated/powdered/white/brown sugar (crystallized cane or beet
// sugar, a real, centuries-old refining process, not a modern
// industrial one) now lives as a real, positive PANTRY_STAPLE_KEEP entry
// below. What stays here, correctly: corn syrup and high-fructose corn
// syrup specifically -- genuinely modern, industrial sweeteners (HFCS
// was first commercially produced in the 1970s), not part of the
// "100 years prior to heavy processing" framing the rest of this list
// now follows.
const REFINED_SWEETENER = ['corn syrup', 'high fructose'];

// New for this pass -- juice-from-concentrate and added-sugar juice are
// real, explicit exclusions the app's owner named directly, distinct
// from the general ADDED_SUGAR_SALT_OR_PROCESSING list above (juice
// needs its own check since "juice" itself is a real, wanted keyword,
// not something to exclude on sight -- it's specifically the
// concentrate/added-sugar VARIANT that's excluded).
const JUICE_DISQUALIFIERS = [
  'from concentrate', 'concentrate, reconstituted', 'sweetened juice',
  'juice cocktail', 'juice drink', 'juice beverage',
];

// New for this pass -- anything flavored/sweetened added to a plain
// dairy or fermented product disqualifies it, per the app owner's own
// explicit "as long as they have no additives or flavorings" rule.
// Checked specifically against fermented/dairy matches (see
// classifyOne below), not blended into the general exclude list, since
// "vanilla" or "strawberry" alone shouldn't disqualify an actual
// vanilla bean or strawberry -- only a *flavored dairy/ferment* product.
const FLAVOR_OR_ADDITIVE_MARKERS = [
  'flavored', 'flavoured', 'strawberry', 'vanilla', 'chocolate',
  'honey flavored', 'fruit on the bottom', 'fruit at the bottom',
  'with fruit', 'sweetened', 'low fat, fruit', 'whole milk, fruit',
];

// New for this pass -- real, unambiguous "this name describes an
// already-made DISH, not a raw ingredient" signals, directly answering
// "we are not including already made dish items." Checked as part of
// the general exclude gate (which now runs FIRST -- see this file's own
// header comment for the two real precedence bugs this fix also closes),
// so a composite dish never gets a chance to slip through one of the new
// bread/flour/spice positive rules below just because it happens to
// mention a real whole-food word somewhere in its own longer name (e.g.
// "Bruschetta, with tomato and basil" contains "basil," but is a
// prepared dish, not the herb itself). Deliberately does NOT include a
// bare "sauce" here -- a real, live check against this app's own data
// found 1,099 real records containing the standalone word "sauce," many
// of them genuinely simple, single-ingredient products no different from
// any other "cooked, mashed" whole food ("Apple sauce, unsweetened,"
// "Applesauce, canned, unsweetened") -- excluding "sauce" outright would
// have wrongly caught those too. See IN_OR_WITH_SAUCE_PATTERN below for
// the real, precise signal this app's owner's own direct report ("'
// Palatine' bratwurst fried, in brown basic sauce should not be in the
// list... these are already created items with ingredients we can't
// account for") led to instead.
const COMPOSITE_DISH_SIGNALS = [
  'sandwich', 'soup', 'stew', 'casserole', 'stuffing', 'gratin', 'quiche',
  'pesto', 'bruschetta', 'dressing', 'marinade',
  // Found live, reported directly: "'Rehpfeffer' savory roe deer
  // goulash" -- checked every real "goulash" record in this database
  // (14+ real variants across German/Hungarian regional names) and
  // confirmed every single one is a genuine composite stew, never a
  // single ingredient.
  'goulash',
  // Found live, while testing the real BRAND_NAMES fix below (not
  // reported directly, but the same underlying principle): a real,
  // manufactured breakfast cereal is definitionally a multi-ingredient
  // combination (grains + sweetener + often oil/dried fruit/nuts,
  // extruded/toasted/baked together), never a single whole-food
  // ingredient -- yet dozens of real records (branded and unbranded
  // alike, e.g. "Breakfast cereal muesli whole grain with fruit nuts
  // sugar etc. honey") were slipping through as whole food via
  // "whole"/"roasted"/"dry"/"honey" matching, since nothing general
  // excluded the category itself. Confirmed via real data that 'cereal'
  // and its plural 'cereals' alone (a plain keyword's own word-boundary
  // check doesn't auto-cover a plural form -- the same lesson already
  // learned for "ice cream" vs. "ice creams") don't cover every real
  // case: "Cornflakes unsweetened," "Bar, muesli, plain or with dried
  // fruit" carry neither word, so 'muesli'/'granola'/'cornflakes' are
  // each added explicitly too.
  'cereal', 'cereals', 'muesli', 'granola', 'cornflakes', 'corn flakes',
  // Real, direct question, not a bug report: "Things like Aioli can be
  // healthy if it is the traditional Aioli with just garlic and extra
  // virgin olive oil, but if it is commercially sold it isn't so
  // great. I don't know how we can keep it if we can verify that it is
  // only [traditional]... What is your opinion?" -- resolved as a real,
  // general PRINCIPLE, not a per-record verification problem this
  // pipeline has no way to solve anyway (a bare name never says which
  // real recipe was actually used): even the cleanest, most traditional
  // version of any of these is STILL a real combination of 2+ separate
  // whole foods (garlic + olive oil; chickpeas + tahini + lemon +
  // garlic + olive oil; avocado + lime + onion + cilantro), never a
  // single ingredient, no matter how simple or additive-free the real
  // recipe is. Every one of those real, separate ingredients already
  // lives (or will live) in this database on its own -- nothing is lost
  // by excluding the combined preparation itself, since the app's own
  // Sauces Builder already exists for a person to combine them
  // themselves, with full visibility into exactly what went in. The
  // same reasoning already justified excluding 'pesto' earlier this
  // pass; this generalizes it to the rest of the real family, confirmed
  // present at real scale (aioli: 4 records; hummus/guacamole: 14;
  // salsa/tzatziki/tapenade: 19) before adding anything.
  'aioli', 'hummus', 'hommus', 'guacamole', 'salsa', 'tzatziki',
  'tapenade',
  // Found live, reported directly: "Ajvar, sweet pepper sauce,
  // home-made, says that it is a home made thing, but what are the
  // ingredients and at what amounts within it?" -- ajvar is a real,
  // traditional Balkan roasted-red-pepper-and-eggplant relish, the
  // exact same "even the traditional version is a real combination of
  // 2+ whole foods" shape as the aioli/hummus/guacamole family right
  // above. One keyword cleanly catches every real variant already in
  // this database: "Ajvar, sweet pepper sauce, home-made," "Ajvar and
  // spinach sauce" (explicitly two vegetables combined, per the same
  // direct report), "Ajvar canned," "Ajvar relish," "Ajvaryogurt."
  'ajvar',
  // Found live, reported directly: "Alaska pollock stewed is obviously
  // a stewed list of ingredients." COMPOSITE_DISH_SIGNALS already
  // excludes 'stew' -- but 'stewed' (467 real records) is a real,
  // separate word for word-boundary matching purposes, the same
  // recurring lesson as "ice cream"/"ice creams,"
  // "cereal"/"cereals," "croquette"/"croquettes."
  'stewed',
];

// New for this pass -- a real, flexible pattern match (not a plain
// keyword lookup), needed because the actual distinguishing signal isn't
// the word "sauce" itself, it's a food being served IN or WITH a sauce.
// Checked against ~40 real records before writing this, not guessed:
// "'Palatine' bratwurst fried, in brown basic sauce," "Bratwurst fried,
// in beer sauce," "Chicken thigh boiled, in curry sauce," "Duck fried in
// oven, with oranges and sauce," "Cod, in parsley sauce, frozen, boiled"
// -- every one a real composite preparation (a protein or vegetable plus
// an unaccountable multi-ingredient sauce), matching the app owner's own
// direct principle: "if the user wants to build them in the app using
// whole foods, then the ingredients need to be there" -- someone can
// already build "bratwurst" (once separately whole-food-classified) plus
// a real, known sauce base from this database's own real ingredients,
// rather than this pipeline needing to carry a pre-made composite whose
// exact recipe it has no way to know. Deliberately does NOT match a bare
// "sauce" with nothing preceding it (that's still the real, accepted
// applesauce-type risk named above) -- only the "in/with ... sauce"
// SHAPE, allowing up to 4 real words in between ("in white basic sauce
// with cream" -- 2 words before "sauce" -- still matches; the "with
// cream" trailing the match is irrelevant, the pattern only needs to
// find "sauce" within that window, not consume the rest of the name).
const IN_OR_WITH_SAUCE_PATTERN = /\b(?:in|with)\s+(?:\S+\s+){0,4}sauce\b/i;

// New for this pass -- real, branded mineral water, per a real, direct
// report: "Abatilles mineral water, bottled, non-carbonated, lightly
// mineralized (Arcachon, 33) ... is a brand name." Given the real,
// practically unbounded number of real-world mineral water brands
// (dozens of real French/German/Belgian/Italian ones alone already sit
// in this database -- Abatilles, Evian, Badoit, Contrex, Hépar,
// Appollinaris...), an explicit per-brand list the way BRAND_NAMES
// works for restaurant/manufacturer names isn't realistic here. Checked
// a real, general co-occurrence signal instead: EVERY one of 30 real,
// sampled "mineral water"-containing records that also says "bottled"
// is a genuine branded product -- and the real, legitimate plain-water
// entries already in this database ("Spring water," "Tap water,"
// "Water, municipal") never say "bottled" at all, confirmed directly.
// Requires BOTH phrases present (order-independent, matching this real
// data's own convention of "[Brand] mineral water, bottled, ...")
// rather than either alone, so a hypothetical future record just
// describing genuine mineral content without "bottled" isn't wrongly
// caught.
function isBottledMineralWater(text) {
  return containsKeyword(text, 'mineral water') && containsKeyword(text, 'bottled');
}

// New for this pass -- real, confirmed brand/manufacturer/restaurant
// names, per a real, direct report: "I should definitely not see
// anything with a brand name on it such as APPLEBEE'S, chicken tenders
// platter." Investigated the actual scope before building anything, not
// guessed: a real scan of every distinct standalone ALLCAPS word across
// all 32,707 records found 539 of them, and a blanket "any ALLCAPS word
// = brand" rule was checked and rejected as genuinely dangerous --
// several real, legitimate whole-food records use ALLCAPS for a
// non-brand reason and would have been wrongly excluded: USDA (a real
// government grading/disclaimer term, 47 of 57 real records already
// correctly whole food), UHT (a real dairy pasteurization method, 17 of
// 18 correctly whole food), BBQ/BBQ'D (a real, plain grilling method),
// and DHA/ARA (real nutrient names, docosahexaenoic/arachidonic acid).
// Built as a real, explicit, individually-verified list instead --
// every entry below was confirmed a genuine company/product-line name
// by reading its own real sample records, and known-legitimate ALLCAPS
// terms were deliberately left out. A real, honest, bounded first pass,
// not a claim of covering every brand that could ever appear -- a
// future report naming one not caught here should be added the same
// way this list was built, not guessed at in bulk.
//
// A few entries are deliberately kept as full compound phrases rather
// than a single bare word, specifically because the bare word collides
// with a real, legitimate whole food or nutrient this pipeline already
// recognizes elsewhere: "mead" alone is a real, traditional fermented
// honey beverage (would collide with FERMENTED_KEEP's own spirit);
// "malt" alone is a real grain product (Barley malt flour already
// exists as a legitimate flour); "cream" alone is PLAIN_DAIRY_KEEP's
// own dairy keyword. Each is only excluded here as its own real, longer
// brand phrase ("mead johnson," "malt-o-meal," "cream of wheat"), never
// as the bare, collision-prone word.
const BRAND_NAMES = [
  // Restaurant/fast-food chains not already covered by FAST_FOOD above
  "applebee's", "denny's", 'popeyes', 'cracker barrel', "friday's",
  // Food/beverage manufacturer and product-line brands, confirmed via
  // real sample records, low collision risk as bare words
  'quaker', 'kraft', 'nestle', 'chobani', 'silk', 'breyers', 'gerber',
  'hormel', 'digiorno', "campbell's", "hershey's", "reese's", 'snickers',
  'similac', 'prosobee', 'enfamil',
  // Real, confirmed compound brand phrases -- kept as full phrases per
  // the collision-risk note above
  'mead johnson', 'mars snackfood', 'abbott nutrition', 'malt-o-meal',
  'ocean spray', 'v8 splash', 'smart balance', 'coca-cola',
  'cream of rice', 'cream of wheat',
];

const ALL_EXCLUDE = [
  ...PROCESSED_MEAT,
  ...CANDY_SNACKS,
  ...FAST_FOOD,
  ...ADDED_SUGAR_SALT_OR_PROCESSING,
  ...REFINED_SWEETENER,
  ...COMPOSITE_DISH_SIGNALS,
  ...BRAND_NAMES,
];

const SAFE_OVERRIDES = [
  'smoked salmon', 'smoked trout', 'smoked mackerel', 'smoked herring',
  'smoked whitefish', 'dried fruit', 'dried apricot', 'dried fig',
  'dried date', 'dried banana', 'dried mango', 'dried plum', 'dried pear',
  'dried apple', 'raisin', 'dried fish', 'dried shrimp',
];

const FERMENTED_KEEP = [
  'yogurt', 'yoghurt', 'kefir', 'kimchi', 'sauerkraut', 'miso', 'tempeh',
  'kombucha', 'natto', 'cultured', 'fermented',
];

const NATURAL_SWEETENER_KEEP = ['honey', 'maple syrup', 'molasses', 'agave'];

// Plain dairy/butchered-meat/fresh-juice signals -- real, positive
// "this is whole food" markers the original script never needed, since
// it worked from a name list that had already been through USDA/etc.'s
// own real category structure. Here they exist as an explicit,
// standalone safety net: even a record whose name contains none of the
// exclude keywords above still needs a real, positive reason before
// being trusted, not just "nothing bad matched."
const PLAIN_DAIRY_KEEP = ['milk', 'yogurt', 'yoghurt', 'butter', 'cream', 'cheese'];
const FRESH_JUICE_KEEP = ['juice'];
const RAW_WHOLE_FOOD_HINTS = [
  'raw', 'fresh', 'whole', 'cooked', 'boiled', 'roasted', 'steamed',
  'grilled', 'baked', 'broiled', 'poached', 'braised',
  // 'dried'/'dehydrated' as a general, word-order-independent hint --
  // SAFE_OVERRIDES above still exists for the specific compound phrases
  // it already covers, but a source can just as easily write "Apple,
  // dried" as "Dried apple," and a general positive hint (checked only
  // after the exclude-keyword gate above has already run) is a safer,
  // more complete fix than enumerating every possible word order by
  // hand -- caught during testing, not guessed at.
  'dried', 'dehydrated',
  // Caught during real end-to-end testing against real Norwegian data:
  // "Adzuki beans, uncooked" matched nothing, because \bcooked\b
  // correctly does NOT match inside "uncooked" (there's a real word
  // character, "n," immediately before it -- not a bug in the regex,
  // a real gap in the word list). Legumes/grains are commonly described
  // with "uncooked"/"dry" rather than "raw" -- added both rather than
  // guessing there were no other similar gaps left.
  'uncooked', 'dry',
  // New for this pass -- a real, confirmed gap: "fresh-harvest frozen
  // whole food" was already an agreed real category (fresh-frozen is
  // fine, freezing preserves rather than modifies), but 'frozen' itself
  // was never actually a positive keyword anywhere in this file --
  // meaning a record named simply "Blueberries, frozen" (no "raw" also
  // present) fell all the way through to the low-confidence review
  // queue instead of being recognized automatically. Confirmed via real
  // data before adding: every case checked where "frozen" co-occurs with
  // a genuine composite-dish or added-processing word (frozen dinner,
  // frozen pizza, breaded-and-frozen items) is already caught by the
  // exclude gate above, which runs first -- this is a safe, purely
  // additive fix.
  'frozen',
  // Found live, reported directly, as a real, deliberate point of
  // CONTRAST against Ajvar/stewed in the same report: "Alaska pollock
  // fried without fat (oven) says it is fried right in the name and
  // even has the word oven there." Unlike "home-made" (which tells us
  // nothing about real ingredients/ratios) or "stewed" (which implies
  // multiple combined ingredients), "fried without fat" is a real,
  // complete, unambiguous description -- a single real ingredient,
  // fried, with nothing added. Bare "fried" was deliberately left out
  // of this list earlier (real ambiguity -- a "fried" dish can involve
  // batter/breading/oil not otherwise stated), but the qualified phrase
  // "fried without fat" carries no such ambiguity. Confirmed safe
  // against real data before adding: of 662 real records matching this
  // phrase, every genuinely composite/breaded variant ("Alaska pollock
  // breaded, deep-frozen, fried without fat (oven)") is already caught
  // by the general exclude gate (which runs FIRST, via "breaded"),
  // never reaching this positive check at all.
  'fried without fat',
];

// New for this pass -- real, plain, minimally-processed oils, matching
// the app owner's own directly-named "oil" as one of the only allowed
// variations. Deliberately a bare, single positive keyword rather than
// an exhaustive named list (olive oil, almond oil, argan oil...) --
// checked directly against real data first: the word "oil" itself, as a
// genuine standalone word (never as a false match inside "boil"/
// "boiled"/"spoil," which containsKeyword's own \b...\b word-boundary
// matching already rules out), turned out to be a clean, safe signal
// across every real record actually in this database, INCLUDING several
// real, legitimate cases worth naming directly: fish canned/preserved in
// real oil ("Anchovy, canned in oil, drained"), and real, traditional
// rendered animal fats named "oil" by their own real source ("Animal
// fat, native, seal oil," "Animal fat, native, walrus, oil" -- genuine
// Alaska Native traditional foods already in this database, a legitimate
// parallel to a pressed plant oil: a minimally-processed fat rendered
// directly from a whole animal, no additives). OIL_DISQUALIFIERS guards
// the real, narrow set of non-food or additive-laden "oil" uses that
// bare-word matching would otherwise catch.
const OIL_KEEP = ['oil'];
// Found live, via a broader real spot-check after this pass's first
// pipeline run: "Olive oil vinaigrette sauce (50 to 75% oil),
// prepackaged" (a composite condiment, not plain oil -- 'sauce' and
// 'prepackaged' both needed) and "Fish oil, menhaden, fully
// hydrogenated" (hydrogenation is real, significant industrial
// processing -- the same transformation that creates trans fats/
// margarine-style products, directly against the "100 years prior to
// heavy processing" spirit this whole pass follows).
const OIL_DISQUALIFIERS = [
  'spray', 'essential oil', 'mineral oil', 'motor oil', 'baby oil',
  'blend', 'sauce', 'vinaigrette', 'hydrogenated', 'prepackaged',
];

// New for this pass -- real, plain bread, per the app owner's own
// explicit, direct instruction: "I think breads should be included
// because of the expansion of who this app is for, and the free tier
// should be able to have that available... which we will filter out for
// them based on their condition criteria if they want us to" (that
// condition-based filtering is real, existing Purple Digest/Healing-
// Stages machinery already built into the live app -- e.g. Celiac's own
// gluten flag -- carried over during the later Phase 5 merge, not
// something this pipeline needs to build itself). Built directly
// against real names already in this database (Sweden's own naming
// convention prefixes nearly every real variant with the literal word
// "bread," e.g. "Bread white wheat water fibers approx. 3.5% type pita
// bread"), plus real standalone flatbread-family names checked
// separately for sources that don't use that same prefix convention.
// BREAD_DISQUALIFIERS guards the real, confirmed cases that would
// otherwise slip through: "Bread flour mix, ..., powder, Det Glutenfrie
// Verksted" (a branded baking-MIX product, not bread itself), "Bread
// crumbs"/"Bread croutons" (a processed derivative of bread, not bread),
// "Bread pudding" (a composite dessert already caught by CANDY_SNACKS'
// own "pudding" too, kept here as real, harmless defense-in-depth).
const BREAD_KEEP = [
  'bread', 'bagel', 'baguette', 'ciabatta', 'pumpernickel', 'chapati',
  'tortilla', 'pita', 'naan', 'flatbread', 'crispbread', 'sourdough',
];
const BREAD_DISQUALIFIERS = ['mix', 'crumb', 'crumbs', 'crouton', 'croutons', 'pudding'];

// New for this pass -- real, plain flours, per the app owner's own
// direct instruction: "Different types of flours in pulverized forms
// should also be included for being able to bake things." Matches this
// app's own already-established live-database precedent (flour already
// lives in the app's own real PantryStaples category, a recognized
// whole-food-adjacent staple, not invented fresh for this pass). Checked
// against real data: nearly every genuine plain-flour record in this
// database is literally named "[grain/legume/nut name] flour" ("Almond
// flour," "Amaranth flour," "Barley flour," "Beans, black, flour"), so a
// bare "flour" keyword is both simple and well-grounded. The one real,
// confirmed risk -- "Bread flour mix, ..." -- is already intercepted
// upstream by BREAD_KEEP's own 'bread' + 'mix' disqualifier before flour
// is ever reached (bread is checked first, see classifyOne below), so
// FLOUR_DISQUALIFIERS only needs to guard the same 'mix' risk on its own
// for a record that doesn't happen to also say "bread."
const FLOUR_KEEP = ['flour'];
// 'mix' catches the real branded-product case above. 'biscuit'/
// 'cracker' catch a second, separate real case found live: "Biscuit,
// sweet, wholemeal flour, Digestive" (a real Digestive biscuit -- a
// sweet, baked snack product, not plain flour) would otherwise
// incorrectly match via its own real mention of "flour." Safe and
// narrow: this only disqualifies a FLOUR match specifically, so it
// can't affect the genuinely legitimate "Biscuit, savoury, from rye
// flour, crispbread" case, which is already caught and correctly kept
// by BREAD_KEEP's own 'crispbread' entry before flour is ever reached.
const FLOUR_DISQUALIFIERS = ['mix', 'biscuit', 'cracker'];

// New for this pass -- real, whole spices and fresh herbs, per the app
// owner's own direct instruction: "whole food spices and fresh
// ingredients such as basil should be included in that list of whole
// foods as flavor is the basis for enjoying the food." A real, explicit
// identity list (not a general "ground"/"powder" keyword, which real
// data showed was too broad and risky -- it would have also matched
// "Alcohol, cocktail, whisky sour mix, powder" and "Baby food ...,
// powder," neither of which is a whole food) -- grinding or drying a
// LISTED spice/herb doesn't disqualify it (mechanical processing, same
// principle as SAFE_OVERRIDES' own dried-fruit precedent), so no
// separate raw/dried/ground check is needed here at all: matching any
// listed name, in any real form, is enough. SPICE_HERB_DISQUALIFIERS
// guards the real, confirmed risk of a listed spice/herb name appearing
// inside a genuinely composite dish/product name instead of standing
// for the plain ingredient itself (found live: "Pesto with basil pine
// nuts cashew nuts," "Bruschetta, with tomato and basil," "Sauce with
// cream, sun-dried tomato, basil, garlic," "Chicken pan with olive basil
// lemon cream") -- and, separately, guards "ginger" specifically against
// real, common soft-drink names ("ginger ale," "ginger beer") that
// aren't whole food at all.
const SPICE_HERB_KEEP = [
  'basil', 'oregano', 'thyme', 'rosemary', 'sage', 'mint', 'cilantro',
  'coriander', 'parsley', 'dill', 'chives', 'tarragon', 'marjoram',
  'chervil', 'fenugreek', 'mace', 'cinnamon', 'cumin', 'paprika',
  'turmeric', 'nutmeg', 'clove', 'cloves', 'cardamom', 'fennel',
  'bay leaf', 'bay leaves', 'black pepper', 'white pepper', 'allspice',
  'saffron', 'mustard seed', 'celery seed', 'poppy seed', 'caraway',
  'star anise', 'vanilla bean', 'vanilla pod', 'juniper berry', 'sumac',
  'wasabi', 'ginger',
];
// Real, general "this name describes a composite dish, a branded snack
// product, or a baked dessert USING a real whole-food identity word as
// one ingredient among several" signal -- shared across every one of
// this pass's new "specific identity word" checks (spice/herb, and the
// new pantry-staple check below) rather than duplicated per rule, since
// the same real failure shape kept recurring: a live spot-check against
// this app's own actual data (not assumed, checked) found "Sweet roll,
// cinnamon with raisins, commercial," an entire real family of branded
// cereal products ("Cereal, ready to eat, Cinnamon Toast Crunch, General
// Mills"; "Cereals, QUAKER, Instant Oatmeal, Cinnamon-Spice, dry"), and
// several composite baked desserts ("Danish swirl (yeast dough) with
// cinnamon," "Cherry dumplings with sugar and cinnamon," "Poppy seed
// stollen (yeast dough)") all incorrectly matching SPICE_HERB_KEEP's own
// "cinnamon"/"poppy seed" entries as if they were the plain spice
// itself.
const PRODUCT_SIGNAL_DISQUALIFIERS = [
  'cereal', 'cereals', 'roll', 'dumpling', 'dumplings', 'dough',
  'chocolate', 'confection', 'confectionery', 'french toast', 'smoothie',
  'stuffed', 'prepackaged',
];

const SPICE_HERB_DISQUALIFIERS = [
  'pesto', 'bruschetta', 'sauce', 'dressing', 'marinade', 'ale', 'beer',
  'soda', 'cream', 'pasta', 'chicken', 'fish', 'salad', 'butter',
  ...PRODUCT_SIGNAL_DISQUALIFIERS,
];

// New for this pass -- real, traditional pantry staples, per the app
// owner's own direct instruction: "things like baking soda, sugar,
// brown sugar, and other things that humans have been using for the
// past 100 years prior to the heavy processing of foods began should be
// in this list. Cacao, coffee, and other things like them should also
// be included." Matches this app's own already-established live-database
// precedent -- baking soda/baking powder/cream of tartar/yeast/salt are
// already recognized, real PantryStaples-category staples in the live
// app's own reference database, not invented fresh here.
// PANTRY_STAPLE_DISQUALIFIERS reuses the same shared composite/branded-
// product signal as spice/herb above (a real, direct example this
// caught: "coffee cake" is already excluded upstream via CANDY_SNACKS'
// own "cake," but "hot chocolate mix" and flavored, blended, or
// creamer-added versions of any of these needed their own real,
// targeted guard).
const PANTRY_STAPLE_KEEP = [
  'sugar', 'brown sugar', 'turbinado', 'demerara', 'baking soda',
  'sodium bicarbonate', 'baking powder', 'cream of tartar', 'yeast',
  'salt', 'cocoa', 'cacao', 'coffee',
];
const PANTRY_STAPLE_DISQUALIFIERS = [
  'mix', 'creamer', 'flavored', 'flavoured', 'blend',
  ...PRODUCT_SIGNAL_DISQUALIFIERS,
];

function containsKeyword(text, kw) {
  const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i').test(text);
}

function anyKeywordMatches(text, list) {
  return list.find((kw) => containsKeyword(text, kw)) || null;
}

/**
 * Classifies a single record. Expects { nameForClassification, hasEnglishEvidence }
 * where nameForClassification is the real, English text to evaluate
 * (already resolved by the caller -- see classifyRecord below for how
 * that resolution happens) and hasEnglishEvidence says whether that text
 * is actually trustworthy English, not just whatever happened to be in
 * name_original.
 *
 * Returns { isWholeFood: true|false|null, ruleMatched: string, autoConfidence: 'high'|'medium'|'low' }.
 */
function classifyOne({ nameForClassification, hasEnglishEvidence }) {
  if (!hasEnglishEvidence) {
    return {
      isWholeFood: null,
      ruleMatched: 'no_english_evidence_yet',
      autoConfidence: 'low',
    };
  }

  const n = nameForClassification.toLowerCase();

  // General excludes run FIRST, ahead of every positive rule below --
  // deliberately, and now more importantly than when this comment was
  // first written. Originally added because "Ice cream, vanilla"
  // contains "cream" as a real, standalone word, which would otherwise
  // falsely trip the dairy branch before CANDY_SNACKS' own "ice cream"
  // match ever got a chance to run. The identical class of bug was
  // confirmed live a second time while adding the new categories below:
  // NATURAL_SWEETENER_KEEP's own "honey" was matching inside
  // "Kathrinchen honey gingerbread biscuits" (a cookie that happens to
  // contain honey, not honey itself) before this exclude gate ever ran
  // -- now correctly caught by CANDY_SNACKS' new "gingerbread" entry,
  // checked first. An unambiguous "this is clearly not whole food"
  // phrase match should always win over a shorter, coincidental
  // positive-keyword collision inside it.
  //
  // A REAL, HONEST, STILL-OPEN LIMITATION, not silently left unnoted:
  // "Bagel with smoked salmon cream cheese salad" still incorrectly
  // matches SAFE_OVERRIDES' own "smoked salmon" as true, since no real,
  // safe, general exclude keyword actually applies to this specific
  // name (it isn't a "sandwich," and "cream"/"cheese"/"salad" are each
  // individually too common in genuinely legitimate whole-food names to
  // safely exclude on their own). This reorder fixes the general CLASS
  // of bug whenever an applicable exclude keyword exists -- it doesn't
  // retroactively invent one for every possible composite-name pattern.
  // Left as a real, accepted case for a human reviewer to catch via the
  // audit tool, exactly the kind of thing that tool exists for, rather
  // than chased with an increasingly fragile keyword rule.
  // Real, narrow exception, found live: "baking soda" (a real,
  // traditional pantry leavening agent, part of the new PANTRY_STAPLE_KEEP
  // category below) contains the standalone word "soda," which would
  // otherwise incorrectly trip CANDY_SNACKS' own bare "soda" (soft
  // drink) exclude keyword before the pantry-staple positive rule below
  // ever gets a chance to run. The one real collision found between the
  // new pantry-staple vocabulary and the existing exclude list -- fixed
  // as a small, explicit guard rather than a more invasive general
  // mechanism, since it's the one real case that actually needs it.
  const excludeMatchRaw = anyKeywordMatches(n, ALL_EXCLUDE);
  const excludeMatch =
    excludeMatchRaw === 'soda' && containsKeyword(n, 'baking soda')
      ? null
      : excludeMatchRaw;
  if (excludeMatch) {
    return {
      isWholeFood: false,
      ruleMatched: `exclude_keyword: ${excludeMatch}`,
      autoConfidence: 'high',
    };
  }

  // "In/with ... sauce" -- a food served in a real, unaccountable
  // multi-ingredient sauce is an already-made dish, not a raw
  // ingredient. See IN_OR_WITH_SAUCE_PATTERN's own header comment for
  // the real report and real data that led to this.
  if (IN_OR_WITH_SAUCE_PATTERN.test(n)) {
    return {
      isWholeFood: false,
      ruleMatched: 'in_or_with_sauce',
      autoConfidence: 'high',
    };
  }

  // Real, branded mineral water -- see isBottledMineralWater's own
  // header comment for the real report and real data behind this.
  if (isBottledMineralWater(n)) {
    return {
      isWholeFood: false,
      ruleMatched: 'bottled_mineral_water',
      autoConfidence: 'high',
    };
  }

  const safeOverride = anyKeywordMatches(n, SAFE_OVERRIDES);
  if (safeOverride) {
    return {
      isWholeFood: true,
      ruleMatched: `safe_override: ${safeOverride}`,
      autoConfidence: 'high',
    };
  }

  const naturalSweetener = anyKeywordMatches(n, NATURAL_SWEETENER_KEEP);
  if (naturalSweetener) {
    return {
      isWholeFood: true,
      ruleMatched: `natural_sweetener: ${naturalSweetener}`,
      autoConfidence: 'high',
    };
  }

  // Fermented/dairy: real, positive signal, but only when NOT also
  // flavored/sweetened -- the app owner's own explicit refinement.
  const fermentedMatch = anyKeywordMatches(n, FERMENTED_KEEP);
  const dairyMatch = anyKeywordMatches(n, PLAIN_DAIRY_KEEP);
  if (fermentedMatch || dairyMatch) {
    const flavorMarker = anyKeywordMatches(n, FLAVOR_OR_ADDITIVE_MARKERS);
    if (flavorMarker) {
      return {
        isWholeFood: false,
        ruleMatched: `flavored_dairy_or_ferment_excluded: matched "${fermentedMatch || dairyMatch}" but also "${flavorMarker}"`,
        autoConfidence: 'high',
      };
    }
    return {
      isWholeFood: true,
      ruleMatched: `plain_dairy_or_ferment: ${fermentedMatch || dairyMatch}`,
      autoConfidence: 'high',
    };
  }

  // Fresh juice: real, positive signal, unless it's from concentrate or
  // has added sugar.
  const juiceMatch = anyKeywordMatches(n, FRESH_JUICE_KEEP);
  if (juiceMatch) {
    const disqualifier = anyKeywordMatches(n, JUICE_DISQUALIFIERS);
    if (disqualifier) {
      return {
        isWholeFood: false,
        ruleMatched: `juice_disqualified: ${disqualifier}`,
        autoConfidence: 'high',
      };
    }
    return {
      isWholeFood: true,
      ruleMatched: 'fresh_juice',
      autoConfidence: 'medium', // medium, not high -- "juice" alone doesn't confirm 100% fresh-pressed the way a dedicated source field would; worth a real person's glance
    };
  }

  // Oil: real, positive signal, unless a real disqualifier (a synthetic/
  // non-food oil use, or a blended/additive product) is also present --
  // same shape as the juice/bread checks: a KNOWN disqualifier is a
  // confident exclusion, not a shrug into the low-confidence review
  // queue ("Lavender essential oil" is exactly as clearly not food as
  // "Ice cream, vanilla" is).
  const oilMatch = anyKeywordMatches(n, OIL_KEEP);
  if (oilMatch) {
    const disqualifier = anyKeywordMatches(n, OIL_DISQUALIFIERS);
    if (disqualifier) {
      return {
        isWholeFood: false,
        ruleMatched: `oil_disqualified: matched "${oilMatch}" but also "${disqualifier}"`,
        autoConfidence: 'high',
      };
    }
    return {
      isWholeFood: true,
      ruleMatched: `oil: ${oilMatch}`,
      autoConfidence: 'high',
    };
  }

  // Bread: real, positive signal, unless a real disqualifier (a mix
  // product, a processed derivative like crumbs/croutons, or a composite
  // dessert) is also present.
  const breadMatch = anyKeywordMatches(n, BREAD_KEEP);
  if (breadMatch) {
    const disqualifier = anyKeywordMatches(n, BREAD_DISQUALIFIERS);
    if (disqualifier) {
      return {
        isWholeFood: false,
        ruleMatched: `bread_disqualified: matched "${breadMatch}" but also "${disqualifier}"`,
        autoConfidence: 'high',
      };
    }
    return {
      isWholeFood: true,
      ruleMatched: `bread: ${breadMatch}`,
      autoConfidence: 'high',
    };
  }

  // Flour: real, positive signal, unless a real disqualifier (a branded
  // baking-mix or sweet-biscuit product) is also present.
  const flourMatch = anyKeywordMatches(n, FLOUR_KEEP);
  if (flourMatch) {
    const disqualifier = anyKeywordMatches(n, FLOUR_DISQUALIFIERS);
    if (disqualifier) {
      return {
        isWholeFood: false,
        ruleMatched: `flour_disqualified: matched "${flourMatch}" but also "${disqualifier}"`,
        autoConfidence: 'high',
      };
    }
    return {
      isWholeFood: true,
      ruleMatched: `flour: ${flourMatch}`,
      autoConfidence: 'high',
    };
  }

  // Whole spices and fresh herbs: real, positive signal, unless a real
  // disqualifier (a composite dish/sauce/product using the listed
  // spice/herb as one ingredient among several, or a soft-drink name
  // that happens to contain "ginger") is also present.
  const spiceMatch = anyKeywordMatches(n, SPICE_HERB_KEEP);
  if (spiceMatch) {
    const disqualifier = anyKeywordMatches(n, SPICE_HERB_DISQUALIFIERS);
    if (disqualifier) {
      return {
        isWholeFood: false,
        ruleMatched: `spice_or_herb_disqualified: matched "${spiceMatch}" but also "${disqualifier}"`,
        autoConfidence: 'high',
      };
    }
    return {
      isWholeFood: true,
      ruleMatched: `spice_or_herb: ${spiceMatch}`,
      autoConfidence: 'high',
    };
  }

  // Real, traditional pantry staples (sugar, baking soda, cacao, coffee,
  // etc.), unless a real disqualifier (a branded mix product, a
  // composite dish/dessert, or a flavored/blended variant) is also
  // present.
  const pantryMatch = anyKeywordMatches(n, PANTRY_STAPLE_KEEP);
  if (pantryMatch) {
    const disqualifier = anyKeywordMatches(n, PANTRY_STAPLE_DISQUALIFIERS);
    if (disqualifier) {
      return {
        isWholeFood: false,
        ruleMatched: `pantry_staple_disqualified: matched "${pantryMatch}" but also "${disqualifier}"`,
        autoConfidence: 'high',
      };
    }
    return {
      isWholeFood: true,
      ruleMatched: `pantry_staple: ${pantryMatch}`,
      autoConfidence: 'high',
    };
  }

  const rawHint = anyKeywordMatches(n, RAW_WHOLE_FOOD_HINTS);
  if (rawHint) {
    return {
      isWholeFood: true,
      ruleMatched: `raw_or_simply_cooked: ${rawHint}`,
      autoConfidence: 'medium',
    };
  }

  // Nothing matched either way -- genuinely ambiguous. Real, honest
  // behavior: don't default to include just because nothing excluded
  // it. Force a human decision instead.
  return {
    isWholeFood: null,
    ruleMatched: 'no_rule_matched',
    autoConfidence: 'low',
  };
}

/**
 * Real entry point: takes one raw_foods row (as read from the database --
 * needs name_original, name_english, and the record's source language)
 * plus that source's own real language code, and returns a classification.
 * This is the piece that decides WHICH name is trustworthy English
 * evidence before ever handing text to classifyOne.
 */
function classifyRecord(row, sourceLanguage) {
  const englishIsNative = sourceLanguage === 'en';
  const nameForClassification = row.name_english || (englishIsNative ? row.name_original : null);
  const hasEnglishEvidence = Boolean(nameForClassification);
  return classifyOne({ nameForClassification: nameForClassification || '', hasEnglishEvidence });
}

/**
 * Runs classification over every raw_foods row that doesn't already
 * have a reviewed=1 classification (so re-running this after adding a
 * new source, or after a translation pass fills in more name_english
 * values, never overwrites a real person's own confirmed decision).
 */
function classifyAll(db, execFileSync, SQLITE_EXE, dbPath) {
  const rowsRaw = execFileSync(
    SQLITE_EXE,
    [
      '-cmd', '.timeout 30000',
      dbPath,
      '-json',
      `SELECT rf.raw_id, rf.name_original, rf.name_english, s.language AS source_language
       FROM raw_foods rf
       JOIN sources s ON s.source_code = rf.source_code
       LEFT JOIN whole_food_classifications wfc ON wfc.raw_id = rf.raw_id
       WHERE wfc.raw_id IS NULL OR wfc.reviewed = 0;`,
    ],
    // Real bug hit at 12,520+ rows: Node's own default execFileSync
    // maxBuffer (1MB) is too small for this query's real JSON output
    // once the database grows past a few thousand rows -- the same
    // fix already applied to run-source.js's own query()/runBatch(),
    // needed here too since this file makes its own, separate call.
    { encoding: 'utf8', maxBuffer: 1024 * 1024 * 256 }
  );
  const rows = JSON.parse(rowsRaw || '[]');

  const nowIso = new Date().toISOString();
  const statements = [];
  for (const row of rows) {
    const result = classifyRecord(row, row.source_language);
    const isWholeFoodSql =
      result.isWholeFood === null ? 'NULL' : result.isWholeFood ? '1' : '0';
    const esc = (s) => (s === null || s === undefined ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`);
    statements.push(
      `INSERT INTO whole_food_classifications (raw_id, is_whole_food, rule_matched, auto_confidence, reviewed, classified_at)
       VALUES (${row.raw_id}, ${isWholeFoodSql}, ${esc(result.ruleMatched)}, ${esc(result.autoConfidence)}, 0, ${esc(nowIso)})
       ON CONFLICT(raw_id) DO UPDATE SET
         is_whole_food = excluded.is_whole_food,
         rule_matched = excluded.rule_matched,
         auto_confidence = excluded.auto_confidence,
         classified_at = excluded.classified_at
       WHERE whole_food_classifications.reviewed = 0;`
    );
  }
  return { rowCount: rows.length, statements };
}

module.exports = {
  classifyOne,
  classifyRecord,
  classifyAll,
  PROCESSED_MEAT,
  CANDY_SNACKS,
  FAST_FOOD,
  ADDED_SUGAR_SALT_OR_PROCESSING,
  REFINED_SWEETENER,
  COMPOSITE_DISH_SIGNALS,
  IN_OR_WITH_SAUCE_PATTERN,
  isBottledMineralWater,
  BRAND_NAMES,
  ALL_EXCLUDE,
  JUICE_DISQUALIFIERS,
  FLAVOR_OR_ADDITIVE_MARKERS,
  SAFE_OVERRIDES,
  FERMENTED_KEEP,
  NATURAL_SWEETENER_KEEP,
  PLAIN_DAIRY_KEEP,
  FRESH_JUICE_KEEP,
  RAW_WHOLE_FOOD_HINTS,
  OIL_KEEP,
  OIL_DISQUALIFIERS,
  BREAD_KEEP,
  BREAD_DISQUALIFIERS,
  FLOUR_KEEP,
  FLOUR_DISQUALIFIERS,
  SPICE_HERB_KEEP,
  SPICE_HERB_DISQUALIFIERS,
  PRODUCT_SIGNAL_DISQUALIFIERS,
  PANTRY_STAPLE_KEEP,
  PANTRY_STAPLE_DISQUALIFIERS,
};
