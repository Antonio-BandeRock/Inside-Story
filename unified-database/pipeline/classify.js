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
  'cookies', 'cake', 'cakes', 'pastry', 'pastries', 'donut', 'doughnut',
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
  // Found live, during the nuts-and-seeds investigation below, not
  // reported directly -- real, general composite-dessert/candy signals,
  // each individually checked against every real record before being
  // added: 'macaroon'/'macaroons' (a real combination -- coconut or
  // almond flour, egg white, sugar, baked -- the same real family as the
  // already-excluded 'meringue'; zero legitimate exceptions across all
  // 15 real records); 'praline'/'pralines' (a real chocolate-and-filling
  // candy, checked all 12 real currently-TRUE records -- every one
  // genuinely composite: brandy, coconut cream, caramel cream, coffee);
  // 'marzipan' (almond paste + sugar, a real combination even in its own
  // "raw paste" form); 'brittle' (a real hard candy -- nut/seed cooked
  // with sugar to a hard set, "Peanut brittle," "Sesame brittle,"
  // "Hazelnut brittle"); 'dragee' (a real sugar-coated candy); 'bisque'
  // (real either way it's used -- a composite creamy dessert, "Almond
  // bisque," or a composite soup, "Soup, tomato bisque," the latter
  // already independently caught by the existing 'soup' keyword too).
  // 'liqueur' (a real, flavored/compound spirit -- checked all 11 real
  // currently-TRUE records, every one genuinely composite: coffee
  // liqueur, cream liqueur, fruit liqueur -- the exact same real
  // "Compound alcoholic beverage" family already excluded above, just
  // reached by a different real name this time).
  'macaroon', 'macaroons', 'praline', 'pralines', 'marzipan', 'brittle',
  'dragee', 'bisque', 'liqueur',
  // Found live, during the same nuts-and-seeds investigation, not
  // reported directly: 'strudel' (a real composite pastry -- fruit
  // filling wrapped in dough -- confirmed a genuine gap: several real
  // records say "strudel dough" rather than "pastry," so they weren't
  // caught by the existing 'pastry' keyword at all); 'seasoned' (a real,
  // general "flavored/spiced beyond plain preparation" signal, checked
  // against every real record -- 24 currently-TRUE records spanning
  // canned vegetables, dried fish, pickled products, baked fillets, all
  // genuinely composite -- and confirmed zero "unseasoned" collision
  // risk anywhere in this database, so this is safe as a real general
  // exclude, not scoped to nuts alone).
  'strudel', 'seasoned',
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
  // A real, second proactive scan (a real, random 100-record sample of
  // the review queue, the same repeatable method already established) --
  // every one checked against real data before being added, not guessed.
  // Real composite condiment, same family as aioli/hummus/ajvar (egg +
  // oil + vinegar/mustard, a real combination regardless of how it's
  // sold): 'mayonnaise' -- checked all 136 real records, zero exceptions
  // (every one either the condiment itself or a mayonnaise-based salad).
  'mayonnaise',
  // Real sweet/laminated baked goods, the same family CANDY_SNACKS'
  // own cake/donut/pastry entries already cover -- flour+fat+sugar mixed
  // INTO the base dough itself, not the minimal flour+water+yeast+salt
  // BREAD_KEEP already treats as a real exception. Plural forms added
  // alongside every singular one for the same real word-boundary reason
  // as "croquette"/"croquettes" -- caught 'croissants' missing this same
  // treatment only by actually re-testing "Croissants, butter" against
  // the real function output (it was wrongly resolving true via the
  // 'butter' dairy keyword) rather than assuming the singular form was
  // enough, the same real lesson this whole file keeps re-learning.
  'croissant', 'croissants', 'scone', 'scones', 'muffin', 'muffins',
  // Real, whipped-egg preparation, almost always pan-cooked in real
  // butter/oil and very often mixed with real fillings (cheese, ham,
  // vegetables) -- the same direct-fat-contact reasoning already
  // established for frying/sautéing, extended to the one named dish
  // that's definitionally made that way. Checked all 35/25 real records
  // -- zero legitimate single-ingredient exceptions.
  'omelet', 'omelette',
  // Real, confirmed composite products, each checked against every real
  // record before adding, zero legitimate exceptions found in any of
  // them: 'relish' (pickle/cranberry-orange/chutney relish, always a
  // real combination); 'brawn' (head cheese -- a jellied meat product
  // made by definition from combining various animal parts, all 17 real
  // records confirmed composite); 'refried' (refried beans -- mashed AND
  // fried, real bean-paste-plus-frying preparation, all 9 real records
  // confirmed); 'con carne' (Spanish "with meat" -- always signals a
  // real composite meat-and-bean stew, all 10 real records confirmed).
  'relish', 'brawn', 'refried', 'con carne',
  // A real, genuine manufacturing-process word with no legitimate
  // single-ingredient meaning at all -- nothing is naturally "extruded"
  // without a machine. Confirmed against all 34 real records (corn
  // puffs, potato snacks, cheese-flavor twists, sweetened cereal) --
  // zero exceptions.
  'extruded',
  // Real, standalone chemical/manufacturing-blend signal -- checked all
  // 12 real records: Japan_MEXT's own "Compound alcoholic beverage"
  // category (a real, self-declared "this is a blend" label covering
  // Umeshu, synthetic sake, mirin, vermouth, fortified wine, curacao,
  // medicinal liqueur -- every one a genuine spirit/wine PLUS something
  // else combined) and "Chocolate, compound, cooking" (a real cocoa-
  // butter-substitute product). Zero legitimate exceptions.
  'compound',
  // Real, specific mixed-drink names found via "Alcoholic beverage, X"
  // (the adjective form -- \balcohol\b does not bound-match "Alcoholic,"
  // the same real word-continuation gap already found for
  // "non-alcoholic," so these needed their own explicit catch rather
  // than relying on isAlcoholicCocktailOrCocktailSauce's own "alcohol"
  // check), plus one real syrup-and-juice mocktail wrongly passing as
  // fresh_juice.
  'pina colada', 'tequila sunrise', 'daiquiri', 'whiskey sour',
  'hard lemonade', 'non-alcoholic cocktail',
  // Real, non-alcoholic carbonated soft drinks that happen to say "beer"
  // in their own name -- confirmed via real data BEFORE adding the new
  // positive 'beer' alcohol keyword below, specifically so that keyword
  // can't wrongly catch these (root beer has no alcohol at all; it's a
  // manufactured soda).
  'root beer',
  // Real, genuinely compound/fortified wine products -- checked before
  // adding the new positive 'wine' alcohol keyword below, for the same
  // reason as root beer: 'wine sauce' (a real cooking sauce, composite);
  // 'wine cooler' (wine blended with fruit juice/soda, flavored);
  // 'mulled wine' (wine heated with real added spices/fruit/sweetener,
  // a genuine combination); 'spirited wine' (a real, explicit
  // spirit-added-to-wine product, confirmed by its own real ~40% ABV,
  // well past ordinary wine strength); and three real, named fortified-
  // wine styles (spirit deliberately added to wine, a genuine
  // combination, not plain wine) -- 'madeira', 'port wine', 'sherry'.
  'wine sauce', 'wine cooler', 'mulled wine', 'spirited wine', 'madeira',
  'port wine', 'sherry',
  // Found live during a proactive scan, not reported directly: real candy/
  // sweet manufactured products -- "Traditional confectionery, 'Uiro'
  // (steamed sweet rice dough)" and 8 more Japan_MEXT siblings, "Ice
  // confection, stick, milk-based, various flavours," "Oil, industrial,
  // palm kernel, confection fat, uses similar to high quality cocoa
  // butter" -- were all wrongly resolving true via whatever OTHER
  // positive keyword happened to be nearby (steamed, milk, butter, flour)
  // since "confection"/"confectionery" was never checked anywhere.
  // Checked all real records containing any of these words first (~90) --
  // every one is a genuine manufactured candy/sweet-baked-good product,
  // zero legitimate single-ingredient exceptions. Every real word FORM
  // added explicitly, the same recurring word-boundary lesson as
  // everywhere else in this file: \bconfection\b alone would not
  // bound-match "confectionery" (no boundary between "confection" and
  // "ery"), "confectionary" (a real, separate British-spelling variant
  // found live in 5 more Japan_MEXT records, all already also starting
  // with "Traditional confectionery" so this is defense-in-depth, not
  // load-bearing on its own), "confectioner's"/"confectioners," or
  // "confections."
  'confection', 'confectionery', 'confectionary', 'confectioner',
  'confectioners', 'confections',
  // Found live in the same pass, while checking real alcohol-name gaps:
  // "Kir (with white wine)" was wrongly resolving true via the bare
  // 'wine' alcohol keyword, and its sibling "Kir royal (with champagne)"
  // was sitting unclassified with no way to safely add 'champagne' as a
  // new alcohol keyword without this cocktail wrongly picking it up too.
  // Both are a real, traditional wine/champagne-plus-crème-de-cassis
  // mixed drink, the same "genuinely composite, not plain wine" category
  // as 'wine cooler'/'mulled wine' right above. Checked directly: every
  // real record containing "Kir" as its own standalone word in this
  // database is this cocktail (a separate, already-excluded "Cocktail,
  // Kir royale" record is unaffected either way) -- no collision with any
  // unrelated food (German "Kirsch"/"Kirschtorte" -- cherry/cherry torte
  // -- never has a word boundary after "Kir" to begin with).
  'kir',
  // Continued proactive scan: real, confirmed damage, each checked
  // against every real record first. 'ice creams' (plural) -- this
  // exact recurring word-form lesson is already named directly in this
  // very file's own FAST_FOOD comment below ("the exact same recurring
  // word-form lesson as 'ice cream'/'ice creams'"), yet the plural form
  // itself was never actually added: "Ice creams, vanilla, light, no
  // sugar added" was wrongly resolving true via a coincidental
  // pantry_staple:sugar match (the phrase "no sugar added" itself
  // contains the substring "sugar"), since \bice cream\b doesn't
  // bound-match "Ice creams." 'chewing gum' (natural word order) -- this
  // file already has the reversed, comma-form 'gum, chewing,' but real
  // Sweden/France records write it the natural way ("Chewing gum, with
  // sugar," "Chewing gum sugar free," bare "Chewing gum"), which never
  // matched either form -- 4 real records wrongly true via a
  // coincidental sugar match, 1 more sitting unclassified. 'ketchup' --
  // a real, standalone manufactured condiment (tomato + sugar + vinegar
  // + spices, no legitimate single-ingredient reading), checked against
  // every real record containing it -- every one already correctly
  // excluded via some OTHER matched keyword except the one bare "Ketchup"
  // record, which was sitting unclassified. 'vitamin water' -- a real,
  // standalone manufactured/fortified/flavored beverage signal; real,
  // confirmed damage: "Vitamin water, all flavours, low Calorie" and 2
  // more real sibling records were sitting unclassified, since only the
  // separately-sweetened variants were being caught (via 'sweetened').
  'ice creams', 'chewing gum', 'ketchup', 'vitamin water',
];

// A real, major bug found during a proactive scan, not reported directly:
// USDA's own "Fast foods, X" category prefix -- 264 real records -- was
// NEVER actually excluded, because the real data is always PLURAL ("Fast
// foods, nachos, with cheese") while this list only ever had the singular
// "fast food," and \bfast food\b requires a boundary right after "food,"
// which "foods" (continuing straight into "s") never has -- the exact
// same recurring word-form lesson as "ice cream"/"ice creams,"
// "cereal"/"cereals," "croquette"/"croquettes." Real, concrete damage
// confirmed before fixing: 42 genuine fast-food items (nachos, tacos,
// burritos, pizza, chimichanga, enchilada, tostada, cinnamon rolls,
// breakfast sandwiches) were sitting at is_whole_food=1, wrongly passing
// via whatever OTHER keyword happened to be in their own longer name
// (cheese, butter, cream, cinnamon).
const FAST_FOOD = [
  'fast food', 'fast foods', 'mcdonald', 'burger king', 'kentucky fried',
  'kfc', 'taco bell', 'pizza hut', "wendy's", 'subway', 'domino',
  // Found live in the same proactive scan: "ON THE BORDER, refried beans"
  // -- a real restaurant chain, not caught by anything above.
  'on the border',
];

const ADDED_SUGAR_SALT_OR_PROCESSING = [
  'sweetened', 'with added sugar', 'honey roasted', 'glazed', 'candied',
  'in syrup', 'heavy syrup', 'sugar coated', 'frosted', 'breaded',
  'battered', 'deep fried', 'deep-fried', 'imitation', 'artificial',
  'flavored drink', 'cheese product', 'cheese food', 'process cheese',
  'processed cheese', 'pasteurized process', 'processed product',
  'processed food', 'cheese, processed', 'spread, ', 'margarine',
  'shortening', 'non-dairy', 'creamer, non', 'whipped topping',
  // Found live during a proactive scan of the review queue, not reported
  // directly: 'sugared' -- a real, direct word for "sugar was added,"
  // distinct from 'sweetened' (already in this list) -- was never
  // recognized anywhere in this file at all. Real, confirmed damage
  // before this fix: 34 real Germany_BLS records (canned sugared fruit --
  // "Rhubarb sugared, canned, drained," "Pear sugared, canned, drained,"
  // "Apple sauce/apple compote, sugared, canned," and 20+ more, plus
  // "Egg, yolk, raw, frozen, sugared, pasteurized" and "Eggs, hen, whole,
  // sugared") were sitting at is_whole_food=1, resolving wrongly TRUE via
  // whatever OTHER positive keyword happened to be in the name (canned,
  // raw, dried, whole) with no exclude keyword ever checking for the
  // explicit "sugared" qualifier right next to it. Several more real
  // records ("Strawberries sugared," "Pear preserves... lightly sugared
  // layer," "Orange marmalade lightly sugared layer," "Sugared chocolate
  // confectionery") were sitting unclassified in the review queue for the
  // same reason. Checked for collision risk before adding: \bsugared\b
  // does not bound-match "unsugared" (no boundary between "un" and
  // "sugared"), so the real "Doughnuts... includes unsugared" records
  // (already correctly excluded via 'cake' anyway) are unaffected.
  'sugared',
  // Found live during a proactive scan of the whole-food-classified
  // review queue: the existing 'sugar coated' entry above (a literal
  // space) never matches the equally common hyphenated spelling
  // "sugar-coated" -- containsKeyword() builds a plain \b-bounded regex
  // with no space/hyphen normalization, so the two spellings are
  // genuinely different substrings to it. Real, confirmed damage: 3
  // Germany_BLS records ("Almond roasted, sugar-coated," "Hazelnut
  // roasted, sugar-coated," "Peanut roasted, sugar-coated") sitting at
  // is_whole_food=1, wrongly matching only the plain nut_or_seed keyword
  // with nothing catching the real candy-coating right next to it --
  // every other real "sugar coated"/"sugar-coated" record in this
  // database (candies, chewing gum, chocolate, cinnamon rolls, corn
  // flakes, doughnuts) already correctly excludes via this same list, one
  // way or the other.
  'sugar-coated',
  // Found live during the same proactive scan, starting from a real
  // "Soy protein kebab frozen product type Oumph®" (a branded meat-
  // alternative product) sitting wrongly TRUE -- followed to its real,
  // full scope rather than patched as one record. 'alternative' and
  // 'substitute' are both real, general signals that a product is a
  // manufactured stand-in for another food (meat alternative, cheese
  // alternative, cream substitute, egg substitute, coffee substitute),
  // the same underlying concept 'imitation'/'artificial' right above
  // already exclude, just two different real words for it neither one
  // ever caught. Checked every real record containing either word first,
  // not guessed: 32 real "alternative" records and 56 real "substitute"
  // records, and every single one -- without exception -- is a genuine
  // manufactured mock/substitute product (meat alternatives across every
  // real base: legume/vegetable, mycoprotein/fungus, soy/wheat/pea;
  // dairy-free cheese/cream/yogurt/ice-cream alternatives; coffee, egg,
  // milk, salt, sugar, and whipped-cream substitutes; "Breast milk
  // substitute" -- infant formula). 37 of the 56 substitute records and
  // 10 of the 32 alternative records were sitting wrongly TRUE via
  // nothing more than a coincidental 'cooked'/'milk'/'frozen' hint; most
  // of the rest were sitting unresolved in needs_review (no rule
  // matched either way), now correctly resolving FALSE instead. One
  // real, honest, small judgment call, not chased further: "Caviar
  // substitute (lumpfish)" is technically real fish roe (a cheaper
  // species marketed as a substitute for true caviar, often dyed/
  // preserved), arguably still a real animal product -- moved from
  // needs_review to a confident false rather than left an open question,
  // the same class of small, accepted, individually-debatable cost
  // already named elsewhere in this file ("tart"/"cutlet," the
  // Artichoke/"fond" translation issue) in exchange for fixing a much
  // larger, clear-cut real pattern.
  'alternative', 'substitute',
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
  // Found live, during a proactive scan, not reported directly: 12 real
  // "Plant-based product/alternative, used as cheese/cream cheese/
  // yoghurt/yogurt/cream, made from soya/oat/cashew/almond" records were
  // wrongly matching PLAIN_DAIRY_KEEP's own real dairy keywords
  // ('cheese,' 'cream,' 'yogurt') even though they explicitly say, right
  // in their own name, that they are NOT real dairy -- a genuine plant
  // milk/nut-based substitute merely styled to resemble one. This is
  // real, additional, unambiguous evidence beyond fortification alone
  // (which this app already accepts for plain dairy, see PLAIN_DAIRY_KEEP
  // and its own real vitamin-D-fortified-milk precedent) that the
  // underlying product isn't real dairy in the first place.
  'plant-based',
  // Found live during a proactive scan, not reported directly: this list
  // only ever had the adjective form 'flavored'/'flavoured' -- the real,
  // distinct plural NOUN form ("all flavors," "assorted flavours,"
  // "mixed flavors," "various flavours") is a genuinely different word,
  // and \bflavoured\b/\bflavored\b don't bound-match it (no shared
  // ending). Real, confirmed damage: once combined with the real
  // Canadian-spelling 'yogourt' gap fixed the same pass, records like
  // "Babyfood, yogourt, fruit flavours, with added Vitamin D and DHA"
  // would otherwise still wrongly resolve true via the dairy match alone,
  // with no flavor marker ever catching the plural wording. Also fixes
  // the real, already-existing "Pickled herring different flavors" (was
  // wrongly true via 'plain_dairy_or_ferment: pickled', no flavor check
  // ever engaging) and "Kefir, fruit flavours, low fat" (was wrongly true
  // via 'plain_dairy_or_ferment: kefir').
  'flavors', 'flavours',
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
  // Real, direct correction, reversing the "fried without fat" positive
  // rule added earlier this pass: "In the moderate confidence area,
  // Albacore deep-frozen, fried without fat (pan) was frozen first and
  // then they fried it. Frying changes the food and the oil is no good
  // for you. These kinds of things should not be in a whole food
  // database." Checked directly against every real record containing
  // "fried" (1,196 of them) before making this change, not guessed:
  // frying -- unlike every other accepted cooking method already in this
  // list (boiled, roasted, steamed, grilled, baked, broiled, poached,
  // braised) -- is the one method that involves direct fat/oil contact
  // and real chemical/structural transformation, whether or not fat is
  // separately stated as "added." That distinction holds regardless of
  // whether the record says "without fat," "no added fat," or nothing at
  // all -- confirmed by walking through every real rule bucket a
  // "fried"-containing name was slipping through under: whole grain/
  // seafood/vegetable/legume records wrongly passing as whole food via a
  // coincidental 'raw'/'fresh'/'whole'/'cooked'/'boiled'/'frozen' match
  // ("Capsicum, green, fresh, fried, no added fat," "Chicken, broilers
  // or fryers, breast, meat and skin, cooked, fried"), and -- a real,
  // separate bug this same investigation surfaced -- protein literally
  // "rolled in flour, fried in fat" or "flour coated, fried" wrongly
  // passing via the FLOUR rule, and composite manufactured products
  // ("Vegeburger mix... fried in vegetable oil," "Fast foods, potato,
  // french fried in vegetable oil") wrongly passing via the OIL rule.
  // Bare "fried" is now the general signal (superseding the old
  // qualified-phrase-only approach), checked and confirmed safe against
  // every one of those real buckets -- zero legitimate exceptions found.
  'fried',
  // Same real principle, a real, separate word: sautéing is the same
  // direct-fat-contact, food-transforming method as frying, just under a
  // different name -- raised directly as a genuine question, not a bug
  // report: "Algae, 'Hijiki', boiled and dried, stainless steel pot
  // process, rehydrated and sautéed. It has gone through a process and
  // then sauteed so it is cooked. That leads me to believe it is a
  // product." The base "boiled and dried" hijiki (and its "rehydrated and
  // boiled" sibling) stays a real whole food -- that boil-then-dry step
  // isn't a recipe or a combination of ingredients, it's the only way
  // this sea vegetable is ever safely eaten at all (raw hijiki carries
  // real, documented natural inorganic arsenic content), the exact same
  // single-ingredient-plus-mandatory-processing shape already accepted
  // for dried fruit -- and reconstituting a dried whole food by boiling
  // it in water is no different from rehydrating dried beans. The
  // "rehydrated and sautéed" variant is the one that changes: sautéing,
  // same as frying, is a real additional cooking step applied at
  // consumption time, not part of the base product's own identity.
  // 'saut' (not the fuller 'sauté') is the real, deliberately chosen
  // keyword here -- confirmed directly, not assumed, that JavaScript's
  // own \b word-boundary logic treats an accented character like "é" as
  // a non-word character, which makes the FULLER accented keyword
  // "sauté" silently fail to match a bare, standalone "Sauté" sitting at
  // the very end of a name (a real record: "Kidney Sauté") -- the
  // shorter, unaccented 'saut' prefix reliably catches every real
  // accented form instead ("Sauté," "sautéed," "sautéed/pan-fried"),
  // verified directly against real text, not reasoned about in the
  // abstract. 'sauteed' is added separately alongside it for the real,
  // plain-ASCII English form this database also carries (Australia_AFCD's
  // own "Peppers, sweet, red, sauteed"), since that form has no accent to
  // create the same boundary and needs its own explicit, exact keyword.
  'saut', 'sauteed',
  // Found live during a proactive scan, not reported directly: real
  // manufactured/composite-product signals with no legitimate single-
  // ingredient meaning, each verified against every real record actually
  // in this database before adding. 'pizza' -- a real composite baked
  // dish (dough plus toppings), zero legitimate single-ingredient
  // reading; the 3 real records with no OTHER exclude keyword nearby
  // ("Pizza, industrially made," "Pizza, minced meat and onion,
  // industrially made," "Pizza, mozzarella and tomatoes, industrially
  // made") were sitting unclassified, and every topped variant was
  // already only excluded by coincidence (matching "ham"/"sausage"/
  // "pepperoni" as its OWN keyword), not because "pizza" itself was ever
  // recognized. 'puddings' -- the exact same real plural/word-boundary
  // gap already fixed for "fast food"/"fast foods," "cereal"/"cereals":
  // 'pudding' (singular) already lives in CANDY_SNACKS above, but
  // \bpudding\b does not bound-match "Puddings" (no boundary before the
  // "s"), so "Puddings, all flavors except chocolate, low calorie,
  // regular, dry mix" and its sibling were wrongly resolving true via
  // 'dry' instead. 'formulated'/'simulated' -- real, standalone
  // manufacturing-process words with no legitimate single-ingredient
  // meaning, checked against every real record: "Nuts, formulated,
  // wheat-based, all flavors except macadamia, without salt" and 3
  // siblings (a real, wheat-based mock-nut product) were wrongly
  // resolving true via a coincidental 'macadamia'/'salt' match, and every
  // real "Formulated bar, ..." record without an already-caught brand
  // name (POWER BAR, SOUTH BEACH, LUNA BAR, ZONE PERFECT) was sitting
  // unclassified -- a real manufactured snack/energy bar by definition,
  // zero exceptions found.
  'pizza', 'puddings', 'formulated', 'simulated',
  // Continued proactive scan: 'ready-made' -- a real, direct, explicit
  // manufactured-product signal, checked against every real record
  // containing it. Real, confirmed damage: "Salad cream (ready-made
  // product)" and "Beef olive (ready-made meal) canned" were wrongly
  // resolving true, leaking through PLAIN_DAIRY_KEEP's 'cream' and
  // RAW_WHOLE_FOOD_HINTS' 'canned' respectively, despite explicitly
  // saying "ready-made" right in their own name; "Remoulade (ready-made
  // product)" was sitting unclassified for the same underlying reason.
  'ready-made',
  // Continued proactive scan: 'smoothie' -- already lived in
  // PRODUCT_SIGNAL_DISQUALIFIERS, scoped only to the spice/herb and
  // pantry-staple checks, never checked generally. Real, confirmed
  // damage from promoting it: 17 real records ("Smoothie mix, pineapple,
  // mango and banana, frozen" and 6 siblings combining 2-3 named fruits
  // each -- the same real unknown-ratio-mix problem already fixed twice
  // for nuts and dried fruit; "Smoothie, yogurt, juice, banana and
  // berries"; several branded NAKED JUICE/BOLTHOUSE FARMS/V8 SPLASH
  // smoothies) were wrongly resolving true via a coincidental frozen/
  // juice/dairy match; 15 more real records (every remaining real
  // "Smoothie, X and Y" / bare "Smoothie" record checked) were sitting
  // unclassified. Checked every real smoothie record in the whole
  // database first -- zero legitimate single-ingredient exceptions
  // found (a smoothie is, by definition, fruit blended with a liquid at
  // minimum, the same real "even the traditional version combines 2+
  // whole foods" category already established for aioli/hummus/pesto).
  'smoothie',
  // Continued proactive scan: bare 'sauce' -- checked against every one
  // of the ~150 real currently-"true" records containing this word, and
  // every single one turned out to be a genuine composite sauce/
  // condiment (butter sauce, cheese sauce, cream sauce, béchamel, tomato
  // sauce, ravioli in sauce, canned fish in tomato sauce -- zero
  // legitimate exceptions among them), all wrongly resolving true by
  // leaking through PLAIN_DAIRY_KEEP's own cheese/cream/butter/milk/
  // yogurt match with no idea a "sauce" qualifier was sitting right next
  // to it. The same real "even the simplest, most traditional version is
  // still a real combination of 2+ whole foods" principle this file
  // already applies to aioli/hummus/pesto/tapenade -- a sauce, by
  // definition, is a base plus something else. Handled via the same
  // real exclude-gate guard mechanism already used for 'soda'/'baking
  // soda' (see classifyOne below), rather than added as a bare keyword
  // directly, since a small, real, verified set of exceptions exists:
  // "apple sauce"/"applesauce" (a genuine, single-ingredient stewed-
  // fruit preparation, the same real category as 'compote' -- the fused
  // "applesauce" spelling never even reaches this guard, since \bsauce\b
  // doesn't bound-match inside it, but the real, separately-occurring
  // "Apple sauce, unsweetened, canned" two-word form does) and 'soy
  // sauce'/'soya sauce'/'fish sauce' (real, traditional single-process
  // FERMENTED condiments -- fermented soybean/wheat/salt, fermented fish/
  // salt -- the same real category as miso/tempeh/kombucha already
  // accepted in FERMENTED_KEEP, which is where these three now also
  // live as real positive matches). Deliberately did NOT except
  // "Worcestershire sauce" -- checked directly and confirmed it's a
  // genuine multi-ingredient blend (vinegar, molasses, anchovies,
  // tamarind, onion, garlic, spices), not a single-process fermentation
  // like soy/fish sauce, so it correctly stays excluded by the new
  // general rule.
  'sauce',
  // Found the same way as the 'sauce' fix right above, while spot-
  // checking its own real results: 'stock' (broth) -- a real, derived,
  // extracted liquid (bones/vegetables simmered in water, then
  // strained), never a raw single-ingredient food, the same real
  // category "consomme"/"soup" already correctly excludes. Checked
  // every real record containing this word first: ~85 real records,
  // every one a genuine broth/stock or a dish built on one ("Chicken
  // stock," "Meat stock with small liver dumplings," "Beef stock
  // canned," "Veal stock for sauces and cooking, dehydrated" -- this
  // last one also incidentally fixes the one real "sauces," plural,
  // record this pass found, no separate plural entry needed since
  // "stock" already catches both real occurrences). One real, honest,
  // accepted tradeoff, not chased further: 2 Canada_CNF records
  // ("Artichoke, stock, canned, drained") turned out, on checking the
  // real underlying French name, to be a genuine MISTRANSLATION of
  // "fond" (artichoke heart/base) as "stock" -- a real, pre-existing
  // translation-layer bug outside this file's own scope, not a
  // classification-rule problem; these two records were already only
  // accidentally true via a coincidental 'canned'/'raw' match before
  // this fix, not correctly true for the right reason, so this is a
  // real but small, honest cost, the same class of accepted tradeoff
  // already named elsewhere in this file ("tart"/"cutlet").
  'stock',
  // Found live during the same proactive scan, not reported directly:
  // 'gravy' -- a real, derived, starch-thickened sauce made from meat
  // drippings/stock plus flour and seasoning, the same real category
  // 'sauce'/'stock' right above already exclude, yet the word itself was
  // never checked anywhere. Checked every real record containing "gravy"
  // first, not guessed: 46 records, every single one a genuine
  // manufactured gravy product (canned, dry mix, dehydrated, powder, or
  // a composite frozen dish built on one -- "Gravy, instant turkey,
  // dry," "Gravy, chicken, canned or bottled, ready-to-serve," "Salisbury
  // steak with gravy, frozen") wrongly resolving TRUE via nothing more
  // than a generic 'canned'/'dry'/'dehydrated'/'frozen' cooking-method
  // hint, with nothing catching the real composite product itself. Zero
  // legitimate whole-food exceptions found -- no plain single-ingredient
  // food in this database's real data happens to carry this word.
  'gravy',
  // Found live while chasing down a real "Soy protein kebab frozen
  // product type Oumph®" record into its wider soy-protein/meat-
  // alternative neighborhood (see 'product type'/'nugget' below): 'filling'
  // -- a real, direct, near-universal signal that a food is a stuffed/
  // filled composite dish, never a single whole ingredient (stuffed
  // vegetables with meat/cheese/millet filling, filled pasta -- ravioli/
  // tortellini/tortelloni, filled pastries/doughnuts/buns, "Brick garni
  // (filling: shrimp, vegetables, poultry, meat, fish, etc.)"). Checked
  // every real record containing this word first: 42 total, 40 of them
  // real, genuine composite dishes wrongly sitting at is_whole_food=1 via
  // nothing more than a coincidental cooking-method or single-ingredient
  // keyword match, with nothing ever catching the real "this is a filled/
  // stuffed preparation" signal itself. Exactly 2 real exceptions found
  // (both explicitly stating the ABSENCE of a filling, "Cream puff,
  // plain, no filling" and a Norwegian lefse flatbread with "no
  // filling") -- handled via a small, dedicated guard right where 'sauce'/
  // 'soda' already have one, not force-excluded for the wrong reason.
  'filling',
  // Found the same way, checking every real record still wrongly TRUE in
  // this same soy-protein/mycoprotein-product family after 'alternative'/
  // 'substitute' above: 'product type' -- a real, consistent phrase
  // pattern this specific source (Sweden_Livsmedelsverket) uses for every
  // one of its own branded meat-analog products ("Soy protein kebab
  // frozen product type Oumph®," "Soy protein pieces with thyme garlic
  // frozen product type Oumph®"). Checked every real record containing
  // this exact phrase first: 7 total, all 7 the same real branded Oumph®
  // product family, 4 of them wrongly TRUE via a coincidental 'frozen'
  // match (the other 3 already correctly false via 'fried'). Zero
  // legitimate whole-food exceptions -- this phrase never occurs outside
  // this one real branded-product naming convention anywhere in the
  // database.
  'product type',
  // Found the same way, for the real "Soy protein nugget"/"Mycoprotein
  // nugget"/"Soy and wheat protein nugget" family this same
  // investigation surfaced, none of which contain "product type":
  // 'nugget' -- a real, definitionally shaped/formed/manufactured food
  // form (chicken nugget, fish nugget, and the same real soy-protein/
  // mycoprotein analogs), never a single raw ingredient. Checked every
  // real record containing this word first: 40 total. The overwhelming
  // majority are already correctly excluded via other means (fried,
  // breaded, restaurant, fast-food-chain names); one real, deliberate,
  // narrow exception found and excluded from this keyword rather than
  // broken by it: "Pumpkin, golden nugget" -- Golden Nugget is a real,
  // named winter squash VARIETY (the word "nugget" is part of the
  // cultivar's own real name, not a food form), confirmed by checking
  // every one of its 3 real records (raw/baked/boiled, all genuine plain
  // squash preparations) before excluding "nugget" as a plain keyword,
  // handled via a small, dedicated guard the same way 'filling'/'sauce'/
  // 'soda' already are.
  'nugget',
  // The same real plural-form gap already documented several times in
  // this file ("ice cream"/"ice creams," "cereal"/"cereals," "stewed"),
  // found while verifying the singular 'nugget' fix above against every
  // real "nuggets" record too: 5 real, genuinely composite products
  // ("Chicken nuggets, dark and white meat, pre-cooked, frozen, not
  // heated," "Salmon nuggets, cooked as purchased, unheated," and 3 more)
  // still wrongly TRUE via a coincidental cooking-method hint, since
  // \bnugget\b never bound-matches its own plural.
  'nuggets',
  // Found the same way, checking every remaining real record still
  // wrongly TRUE in this same investigation: 'mycoprotein' -- unlike
  // tofu/tempeh/seitan (traditional, minimally-processed soy/wheat-
  // gluten staples already kept as real whole foods elsewhere in this
  // file), mycoprotein (Fusarium venenatum mycelium, grown via
  // industrial fermentation and bound with egg albumin even in its
  // plainest commercial form) is never itself a traditional whole food,
  // regardless of what shape it's later formed into. Checked every real
  // record containing this word first: 24 total, every one either
  // already correctly excluded via some other means (stew, gratin,
  // sauce) or a real, genuine manufactured product ("Mycoprotein buns
  // frozen food," "Mycoprotein mince pieces fillet cold goods el. frozen
  // food," "Mycoprotein schnitzel refrigerator el. frozen food," "Oven-
  // roasted mycoprotein schnitzel") still wrongly resolving TRUE via a
  // coincidental cooking-method match. Zero legitimate exceptions.
  'mycoprotein',
  // Found the same way, for the parallel real "Soy and wheat protein
  // buns/schnitzel/mince..." family this same source uses for its own
  // soy-and-wheat-based meat analogs (a different real product line from
  // the plain 'soy protein isolate/concentrate/textured' ingredient
  // records elsewhere in this database, which are genuinely more
  // ambiguous and deliberately left alone at needs_review, not force-
  // classified either way): the longer, more specific 3-word phrase
  // 'soy and wheat protein' -- checked every real record containing this
  // exact phrase first: 23 total, every single one a genuine composite
  // meat-analog product (burger, sausage, imitation bacon, mince, buns,
  // nugget, schnitzel), several still wrongly resolving TRUE via a
  // coincidental 'frozen'/'cooked' match ("Soy and wheat protein buns
  // refrigerated goods or. frozen food," "Soy and wheat protein schnitzel
  // oven-roasted," "Soy and wheat protein minced frozen product"). Zero
  // legitimate exceptions -- this specific 3-word phrase never occurs
  // outside this one real manufactured-product family.
  'soy and wheat protein',
  // The one real remaining straggler this whole investigation's own
  // "soy protein X" family left behind after every fix above: "Soy
  // protein buns refrigerator el. frozen food" -- its own siblings
  // ("Soy protein buns fried"/"oven-fried") already correctly resolve
  // false via 'fried,' but this one has nothing else catching it. Bare
  // 'soy protein' itself is deliberately NOT excluded here (see the
  // 'soy and wheat protein' comment above -- the plain isolate/
  // concentrate ingredient records need to stay genuinely undecided),
  // so this narrower, exact phrase closes the one real remaining gap
  // without touching those.
  'soy protein buns',
  // Found live during a fresh, separate random sample (not part of the
  // same soy-protein investigation): 'pancake' -- this project's own
  // NATURAL_SWEETENER_DISQUALIFIERS list already calls pancake/waffle/
  // cracker/porridge/puffed "real manufactured/composite products," but
  // that reasoning had only ever been applied narrowly (disqualifying a
  // coincidental honey/maple-syrup match), never generalized into the
  // real exclude gate itself. Checked every real "pancake"/"pancakes"
  // record in the database first, not guessed: 35+ records, every one a
  // genuine composite baked good, dry mix, or flavored syrup product
  // ("Pancake, plain (includes buttermilk), dry mix, complete, prepared
  // with water," "Pancakes, whole wheat, dry mix, incomplete," "Syrups,
  // table blends, pancake, with butter") wrongly resolving TRUE via a
  // coincidental 'buttermilk'/'dry'/'whole' match, with nothing catching
  // the real composite product itself. Both the singular and plural form
  // are needed -- \bpancake\b does not bound-match "pancakes," the same
  // recurring plural-form lesson as "nugget"/"nuggets" right above.
  // 'waffle'/'cracker'/'porridge'/'puffed' are deliberately NOT
  // generalized in this same pass -- each needs its own real, fresh
  // database-wide safety check before being trusted this broadly, not
  // assumed safe just because they sit in the same narrower list.
  'pancake', 'pancakes',
];

// Real, small, individually-verified exception list for the new bare
// 'sauce' exclude above -- see that entry's own comment for the full
// reasoning behind each phrase. Checked directly: none of these four
// phrases appears in any currently-correctly-excluded sauce record (a
// real composite dish that merely CONTAINS soy sauce as one ingredient,
// e.g. "simmered in soy sauce and sugar," is already caught upstream by
// IN_OR_WITH_SAUCE_PATTERN before this guard is ever reached).
const SAUCE_EXCLUDE_GUARD_PHRASES = [
  'apple sauce', 'soy sauce', 'soya sauce', 'fish sauce',
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

// Found live, during a proactive scan, not reported directly -- real
// standalone food-additive/chemical-compound entries, named with their
// own real E-number (Sorbitol powder (E 420), Ascorbic acid (E 300),
// Citric acid (E 330), phosphate-based cutter additives (E 450)...) --
// a real, standalone chemical compound is not a food at all, regardless
// of natural origin (citric/ascorbic/acetic/lactic acid are all real,
// naturally-occurring compounds too, but these 8 real records are the
// purified ADDITIVE form, sold and used as one, never eaten as a food in
// its own right). Checked: only 8 real records in the whole database
// match this pattern, all genuine additives, zero exceptions.
const E_NUMBER_ADDITIVE_PATTERN = /\(E\s?\d{3,4}[a-z]?\)/i;

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

// New for this pass -- real, mixed alcoholic drinks and cocktail sauce, per
// a real, direct report: "Lots of these are in there Alcohol, cocktail,
// daiquiri (rum), homemade, which will have more than just rum." Checked
// every real "cocktail"-containing record still sitting unclassified (36 of
// them) before writing anything, not guessed -- confirmed the real, distinct
// shapes: "Alcohol, cocktail, daiquiri (rum), homemade" (rum + lime juice +
// sugar), "Alcohol, cocktail, whisky sour mix, powder" (a real, multi-
// ingredient sour-mix blend, not a single spirit on its own), Germany_BLS's
// own "Cocktail, <name>" naming convention for a dozen more real mixed
// drinks (Bloody Mary, Gin and tonic, Mojito, Cuba libre, Kir royale, Hugo,
// Caipirinha...), France_Ciqual's "Rum-based cocktail" / "Whiskey
// cocktail," and "Sauce, cocktail, ready-to-serve" (real cocktail sauce --
// ketchup, horseradish, lemon juice, Worcestershire, a genuine composite
// condiment, not a single ingredient). Every one is a real combination of
// 2+ separate ingredients, the exact same "even the traditional version is
// still a combination" principle already applied to the aioli/hummus/ajvar
// family above.
//
// Deliberately NOT a bare "cocktail" keyword -- checked and confirmed real
// collision risk first: "Fruit cocktail" (diced mixed fruit -- already
// handled on its own terms via the existing syrup/juice rules, and a
// separate, bigger judgment call this report didn't ask for), "Onions,
// pickled, cocktail/silverskin" (a real, single-ingredient onion SIZE, not
// a mixed drink at all), and "Vegetable juice cocktail"/"Cranberry juice
// cocktail" (already correctly resolved via the existing fresh-juice/
// juice-disqualified rules) would all have been wrongly swept in by a
// blanket keyword. Requires "cocktail" alongside a real, confirmed
// alcohol/spirit signal instead, or the cocktail-sauce/cocktail-mix shape
// specifically. One real, worth-naming near miss caught by actually running
// this against real data before trusting it, not just reasoning about it:
// "Cocktail mix, non-alcoholic, concentrated, frozen" does NOT contain
// "alcohol" as its own bounded word -- "non-alcoholic" continues straight
// on into "-ic," so the \b...\b word-boundary check correctly does NOT
// treat "alcohol" as matched inside it. A real, manufactured beverage-mix
// concentrate (syrups/flavors/acids) is still a genuine composite product
// regardless of its own alcohol content, so a real, explicit "cocktail" +
// "mix" check was added instead, confirmed via the actual real function
// output (not just reasoned about) before this comment was written. Every
// one of the 36 real sampled records was individually walked through this
// exact logic, and every real prediction re-verified against the live
// function's own real output, not assumed correct.
function isAlcoholicCocktailOrCocktailSauce(text) {
  if (!containsKeyword(text, 'cocktail')) return false;
  if (containsKeyword(text, 'alcohol')) return true;
  if (containsKeyword(text, 'mix')) return true;
  if (/^cocktail\s*,/i.test(text.trim())) return true;
  if (
    anyKeywordMatches(text, [
      'rum', 'whisky', 'whiskey', 'gin', 'vodka', 'tequila', 'campari',
      'sour mix',
    ])
  ) {
    return true;
  }
  if (containsKeyword(text, 'sauce')) return true;
  return false;
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
  // Found live, during a proactive scan, not reported directly. Real,
  // confirmed brand names: 'budweiser' (also correctly catches
  // "BUDWEISER SELECT" as a bare-word match, since the brand name is
  // followed by a real word boundary either way); 'bud light' kept as
  // its own full phrase since "bud" alone would collide with real,
  // legitimate plant-food terms (flower/vegetable buds); 'mori-nu',
  // 'vitasoy', 'nasoya' -- real, confirmed tofu manufacturer/product-line
  // brands, added alongside the new positive 'tofu' keyword below so a
  // branded tofu product is still correctly excluded, matching this
  // whole list's own standing "no brand names, period" principle.
  'budweiser', 'bud light', 'mori-nu', 'vitasoy', 'nasoya',
  // Found live, during the nuts-and-seeds investigation -- a real,
  // confirmed nut brand ("Nuts, mixed nuts, dry roasted, with peanuts,
  // salt added, PLANTERS pistachio blend").
  'planters',
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
  // Found live, during a proactive scan, not reported directly -- real,
  // simple brine/acetic-acid preservation, the same real "fermented
  // whole food" category kombucha/kimchi/miso already sit in. 'vinegar'
  // is a real acetic-acid fermentation product (checked: "Wine vinegar,"
  // "Distilled vinegar" -- both single-ingredient, no collision found).
  // 'pickled'/'pickles' (both forms needed for the same real plural/verb-
  // form word-boundary reason as "cereal"/"cereals") -- checked a real,
  // wide sample of the ~130 real records: peppers, capers, beetroot,
  // olives, herring, sweetcorn, Japanese Daikon "-zuke" variants, every
  // one a genuine simple brine preservation. The real composite
  // exceptions found in the same sample ("Herring, pickled, marinated,
  // with mayonnaise and sour cream"; "..., with mustard sauce") are
  // already correctly caught upstream by the new 'mayonnaise' exclude
  // and the existing IN_OR_WITH_SAUCE_PATTERN, both of which run first.
  'vinegar', 'pickled', 'pickles',
  // Continued proactive scan: real, single-process fermented condiments,
  // the same real category as miso/tempeh/kombucha right above -- soy
  // sauce (fermented soybean + wheat + salt) and fish sauce (fermented
  // fish + salt), each aged, not a manufactured blend of unrelated
  // ingredients. Checked directly: every real plain "Soy sauce"/"Soya
  // sauce"/"Fish sauce" record in this database (shoyu, tamari, low-
  // sodium variants, "Nam pla") was sitting unclassified; every real
  // composite dish that merely CONTAINS soy/fish sauce as one ingredient
  // among several ("simmered in soy sauce and sugar," "Dressing, soy
  // sauce based," "Japanese noodle soup... soy sauce base") is already
  // correctly excluded upstream, before this list is ever reached, by
  // IN_OR_WITH_SAUCE_PATTERN or another real exclude keyword -- see the
  // new SAUCE_EXCLUDE_GUARD_PHRASES comment (COMPOSITE_DISH_SIGNALS
  // above) for why these three phrases also need excepting from the new
  // general 'sauce' exclude, not just added here.
  'soy sauce', 'soya sauce', 'fish sauce',
];

const NATURAL_SWEETENER_KEEP = ['honey', 'maple syrup', 'molasses', 'agave'];
// Found live during a proactive scan, not reported directly -- the exact
// same "mix leak" bug already fixed twice this session (nuts/seeds;
// SAFE_OVERRIDES' own dried-fruit phrase), a third time: NATURAL_SWEETENER_
// KEEP is checked relatively early in classifyOne, with no disqualifier of
// its own, so a real composite dish that merely CONTAINS honey/maple
// syrup/agave as one ingredient among several was resolving wrongly true
// before any later, more specific check (the flavored-dairy check, the
// general exclude gate's own composite-dish signals) ever got a chance to
// run. Real, confirmed damage, each checked against its own actual record:
// 'mixed'/'mix' -- "Oats, rolled, mixed with sugar or honey & other
// flavours, uncooked" and its "Porridge..." sibling (a real composite
// breakfast, not honey itself). 'pancake'/'waffle'/'cracker'/'porridge'/
// 'puffed'/'balls'/'caramel' -- real manufactured/composite products named
// directly: "Pancake, plain, homemade with butter and maple syrup,"
// "Thin waffle filled with honey, prepackaged," "Cracker, honey sesame,"
// "Wheat grains puffed with honey or caramel, enriched with vitamins and
// minerals," "Honey Puffed Corn Balls." 'yoghurt'/'yogurt'/'yogourt'/
// 'cream'/'milk' -- real dairy identity words that should defer to the
// more sophisticated flavored-dairy-or-ferment check below instead of
// resolving early here: "Yoghurt mild honey fat 2% enriched" (a flavored
// yogurt, wrongly true via 'honey' alone, before the dairy check's own
// flavor-marker logic ever ran) and "Chicken pan with lime honey crème
// fraiche" (a composite dish, not honey). 'spirit' -- "Agave spirit
// (Mezcal/Tequila)" is a real distilled beverage, not the syrup; deferred
// here so it correctly resolves via the new ALCOHOL_KEEP 'tequila'/
// 'mezcal' entries instead, with an honest rule_matched label. Checked
// every currently-true natural_sweetener record against this whole list
// before adding it -- zero false disqualifications found (plain "Honey,"
// "Molasses," "Agave, raw/cooked/dried," "Maple syrup," "Melon, honey
// dew, peeled, raw" all stay correctly true). 'spirit' is deliberately
// NOT in this disqualifier list -- unlike every entry above, "Agave
// spirit" should still resolve TRUE, just via a different, more honest
// rule (the new ALCOHOL_KEEP 'tequila'/'mezcal' entries), so it's handled
// as a real DEFERRAL in classifyOne below (skip this branch entirely,
// let a later check decide) rather than a disqualification to false --
// a genuinely different real behavior, not just a labeling nicety.
const NATURAL_SWEETENER_DISQUALIFIERS = [
  'mixed', 'mix', 'pancake', 'waffle', 'cracker', 'porridge', 'puffed',
  'balls', 'caramel', 'yoghurt', 'yogurt', 'yogourt', 'cream', 'milk',
  // Caught by actually testing the fix against the real record, not
  // assumed to work: "Chicken pan with lime honey crème fraiche" was
  // still resolving true even after 'cream' was added above, because
  // the real record says "crème" (accented) -- a different literal
  // string from plain "cream," the same real accent lesson already
  // learned for 'saut'/'sauté' elsewhere in this file. Added as its own
  // explicit, exact keyword rather than assumed covered by the unaccented
  // form.
  'crème',
];

// Plain dairy/butchered-meat/fresh-juice signals -- real, positive
// "this is whole food" markers the original script never needed, since
// it worked from a name list that had already been through USDA/etc.'s
// own real category structure. Here they exist as an explicit,
// standalone safety net: even a record whose name contains none of the
// exclude keywords above still needs a real, positive reason before
// being trusted, not just "nothing bad matched."
//
// Found live, during a proactive scan, not reported directly: bare
// "Buttermilk" (2 real records, each just that one word) was never
// actually matching PLAIN_DAIRY_KEEP's own 'milk' entry -- the exact
// same fused-compound-word gap as "ice cream"/"cereal," confirmed
// directly (\bmilk\b requires a boundary right before "milk," and the
// "r" immediately preceding it in "Buttermilk" is a real word
// character, so there's no boundary there at all). The far more common
// real form, "Milk, buttermilk, fluid, cultured, ..." (comma-separated),
// was already working fine via the existing 'milk'/'cultured' keywords
// -- this only fixes the bare, single-word form.
// Found live during a proactive scan, not reported directly: 'yogourt'
// (the real, standard Canadian-English spelling Canada_CNF uses
// throughout its own real data, e.g. "Yogourt, plain, fat free (0-0.5%
// MF)") was never recognized by either this list or FERMENTED_KEEP --
// meaning all 78 real "Yogourt" records, plain AND flavored alike, fell
// straight through to the review queue with neither the plain-dairy
// accept path nor the flavored-dairy exclude check ever engaging.
// 'yogurts' (plural) added for the exact same real word-boundary reason
// as 'buttermilk' above: \byogurt\b does not bound-match "Frozen
// yogurts, flavors other than chocolate," which was wrongly resolving
// true via the unrelated 'frozen' hint instead.
const PLAIN_DAIRY_KEEP = ['milk', 'yogurt', 'yogurts', 'yogourt', 'yoghurt', 'butter', 'cream', 'cheese', 'buttermilk'];
const FRESH_JUICE_KEEP = ['juice'];

// New for this pass -- real, plain soy-milk coagulation, the exact same
// "coagulating a plant liquid with a simple, traditional agent" shape
// already accepted for dairy cheese (milk + rennet). Checked directly:
// real, traditional tofu preparation ("Tofu, firm, prepared with calcium
// sulfate and magnesium chloride (nigari)") uses nothing but a real,
// minimal coagulant, the same category as SAFE_OVERRIDES' own dried-
// fruit precedent -- a mechanical/chemical processing step that doesn't
// disqualify the underlying single ingredient. Kept as its own separate
// list (not folded into PLAIN_DAIRY_KEEP) since tofu is neither dairy
// nor necessarily fermented -- the ruleMatched string this produces
// (soy_derivative: tofu) stays honest about what it actually is.
const SOY_DERIVATIVE_KEEP = ['tofu'];

// New for this pass -- real, single-type alcohol, per a direct decision:
// beer/wine/sake (fermented from one base ingredient) and whisky/vodka/
// rum/gin/brandy/shochu (distilled from one base ingredient) fit the
// same real "single ingredient plus a simple, traditional transformation"
// category this database already accepts for cheese, yogurt, and
// kombucha -- Japan_MEXT's own real data even tags sake/beer/wine
// "Fermented alcoholic beverage" directly. 'mead' included per this
// file's own pre-existing BRAND_NAMES comment, which already names it as
// "a real, traditional fermented honey beverage." Every genuinely
// composite/flavored/branded alcoholic product is already excluded
// upstream, before this list is ever reached: mixed drinks and cocktail
// sauce (isAlcoholicCocktailOrCocktailSauce), Japan_MEXT's own
// self-declared "Compound alcoholic beverage" category, named mixed
// drinks (pina colada, daiquiri, tequila sunrise, whiskey sour), branded
// beer (BUDWEISER, BUD LIGHT), and the real, non-alcoholic look-alikes
// checked and excluded BEFORE this list was written specifically to
// protect it (root beer, wine sauce, wine cooler, mulled wine, spirited
// wine, and the three named fortified-wine styles).
const ALCOHOL_KEEP = [
  'beer', 'wine', 'sake', 'whisky', 'whiskey', 'vodka', 'rum', 'gin',
  'brandy', 'shochu', 'mead',
  // Found live during a proactive scan, not reported directly: real,
  // single-ingredient, traditionally-distilled/fermented spirits missing
  // from this list under their own real names, the exact same "single
  // ingredient plus a simple, traditional transformation" category as
  // everything above. 'tequila'/'mezcal' -- both distilled from the same
  // one base plant (agave); real, direct damage found first: "Agave
  // spirit (Mezcal/Tequila)" was resolving true via the coincidental,
  // misleading 'natural_sweetener: agave' label rather than an honest
  // alcohol one (see the new NATURAL_SWEETENER_DISQUALIFIERS 'spirit'
  // entry below, which defers this record to land here instead). Every
  // real "tequila sunrise"/"Cocktail, Tequila sunrise" record is already
  // excluded upstream (checked, before adding this) via the existing
  // 'tequila sunrise' phrase and isAlcoholicCocktailOrCocktailSauce's own
  // "cocktail" + spirit-name check, both of which run before this list is
  // ever reached. 'champagne' -- a real, single-ingredient sparkling
  // wine, the same real category as plain "wine" already accepted above;
  // checked directly for the one real collision risk found (the "Kir
  // (with white wine)"/"Kir royal (with champagne)" cocktail family) and
  // fixed that FIRST, via a new 'kir' exclude in CANDY_SNACKS, so this
  // stays safe to add. 'maotai' -- a real, traditional single-ingredient
  // (sorghum) Chinese distilled spirit, Japan_MEXT's own real data
  // already tags it "Distilled alcoholic beverage" directly.
  'tequila', 'mezcal', 'champagne', 'maotai',
];
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
  // "fried without fat" USED to sit here as a positive hint, per a real,
  // direct report treating it as a deliberate point of contrast against
  // Ajvar/stewed: "Alaska pollock fried without fat (oven) says it is
  // fried right in the name and even has the word oven there." That
  // read turned out wrong, corrected directly by a later, much more
  // explicit report: "Frying changes the food and the oil is no good for
  // you. These kinds of things should not be in a whole food database."
  // Bare 'fried' is now a general EXCLUDE instead (see
  // COMPOSITE_DISH_SIGNALS above), which reaches every "fried without
  // fat" record too and runs before this positive list is ever checked
  // -- so the qualified-phrase entry that used to live here is gone
  // outright, not left as unreachable dead code.
  //
  // Found live, during a proactive scan, not reported directly, all
  // checked against real data before being added: 'desiccated' (a real,
  // separate word for "dried" -- "Nuts, coconut meat, desiccated,
  // unsweetened" was matching nothing at all); 'toasted' (a real,
  // separate word for "roasted" -- checked all 26 real records still
  // unclassified: nuts/seeds toasted, plain wheat toast, toasted nori,
  // every genuinely composite case -- toaster-type muffins, extruded
  // toast, gingerbread-family biscuits -- already correctly caught
  // upstream by their own real exclude keyword, which runs first);
  // 'puree'/'pureed' (a real, simple mechanical single-ingredient
  // processing step, the same category as "mashed" -- both word forms
  // needed for the same real word-boundary reason as "pickled"/
  // "pickles"; checked a real, wide sample -- celeriac, parsnip, pea,
  // prune, raspberry, garlic, tomato, and real single-meat baby-food
  // purees -- every genuine composite case, "Yoghurt, with fruit puree
  // and muesli," "Pea puree soup," "Hummus/chickpea puree," is already
  // correctly caught upstream by an existing exclude); and 'canned' (a
  // real, simple preservation method, the same real category as
  // "frozen" -- added LAST, and only after every real composite-canned-
  // dish signal this same proactive scan actually found -- 'mayonnaise,'
  // 'relish,' 'brawn,' 'refried,' 'con carne,' 'compound' -- was already
  // in place upstream, re-verified against a real, fresh 60-record
  // sample of the review queue afterward to confirm no remaining
  // exceptions).
  'desiccated', 'toasted', 'puree', 'pureed', 'canned',
  // Continued proactive scan: real, plain cooking-method words missing
  // entirely, each checked against every real still-unclassified record
  // before adding. 'simmered' -- 44 real records, every one a plain,
  // single organ/muscle cut of meat or fish ("Beef, heart, simmered,"
  // "Turkey, all classes, giblets, simmered," several Norwegian fish
  // fillets), zero composite exceptions. 'casseroled' -- 26 real
  // Australia_AFCD records, every one a plain cut of meat with the
  // source's own explicit "no added fat" qualifier ruling out any real
  // combination ("Chicken, breast, lean flesh, casseroled, no added
  // fat"); "Chicken, skin, composite, casseroled, no added fat" is
  // AFCD's own real lab-sampling term (skin pooled from multiple parts
  // of the bird for testing), not a recipe combination. 'sashimi' -- 6
  // real records, every one plain raw sliced fish/mollusk, the same real
  // category as the already-accepted bare 'raw'. 'in brine' -- 9 real
  // records (lobster tail, mussel, shrimp, vine leaves, four olive
  // variants), the same real traditional brine-preservation category
  // already accepted for 'pickled'.
  'simmered', 'casseroled', 'sashimi', 'in brine',
  // Continued proactive scan: real, plain wheat-gluten derivatives --
  // 'wheat gluten' (covers "Vital wheat gluten," "Seitan, wheat gluten,"
  // the three real Japan_MEXT powdered/pellet/paste forms, and "Gluten,
  // from wheat (vital wheat gluten)"), 'seitan' (a real, traditional
  // East Asian wheat-gluten food in its own right, covers "Meat
  // substitute containing gluten (seitan)," which doesn't say "wheat
  // gluten" literally), and 'gluten (from wheat' (the one real
  // Germany_BLS record phrased differently again, "Gluten (from
  // wheat)" -- the keyword is deliberately written WITHOUT its own
  // closing paren: caught live by testing this fix against the real
  // record, not assumed to work -- containsKeyword's \b...\b wrapping
  // means a keyword ENDING in a non-word character like ")" only
  // matches when a real word character follows it in the source text,
  // which never happens here since the real record ends exactly at that
  // closing paren; dropping it still matches the full real phrase,
  // since \b after "wheat" is a real boundary either way). Deliberately
  // NOT a bare 'gluten' keyword -- checked first and confirmed a real,
  // serious collision risk: \bgluten\b DOES bound-match inside
  // "gluten-free" (a hyphen is a non-word character), and over 20 real
  // branded "Gluten-Free" products (crackers, waffles, rolls, wafers --
  // Van's, Udi's, Schar, Glutino, Mary's Gone Crackers) would have been
  // wrongly swept in by a bare keyword. Every one of these three
  // narrower phrases checked directly against that same "gluten-free"
  // list first -- zero collisions, since none of them say "wheat
  // gluten"/"seitan"/"gluten (from wheat" themselves.
  'wheat gluten', 'seitan', 'gluten (from wheat',
  // Found live during a proactive scan, not reported directly: 'compote'
  // (stewed fruit, the same real simple-preparation category as 'puree'/
  // 'mashed' right above) was never actually a positive keyword anywhere
  // in this file, despite an existing comment elsewhere already stating
  // "a plain single-fruit compote with no nut mentioned at all is still a
  // real, legitimate simple preparation this database already correctly
  // accepts" -- that was the intent, but nothing implemented it. Real,
  // confirmed damage: over 30 real Germany_BLS/France_Ciqual/Norway/
  // Sweden records ("Pear compote," "Blackberry compote," "Mango
  // compote," "Fruit compote," and every explicitly "unsweetened"
  // variant -- "Pear compote unsweetened," "Blueberry compote
  // unsweetened," "Mixed fruit compote unsweetened") were sitting
  // unclassified in the review queue, never resolving true. Safe to add
  // as a general, late-checked positive hint (this is always the LAST
  // fallback in classifyOne, after every exclude gate has already run):
  // every real composite/sweetened/flavored compote already checked
  // against this exact word before this fix ("Apple compote with vanilla
  // sauce," "with artificial sweetener," "with cream," "with raisins and
  // almonds," "Rice pudding... with... compote") is already correctly
  // excluded upstream via in_or_with_sauce, 'artificial', the flavored-
  // dairy check, the nut/seed disqualifier, and 'pudding' respectively --
  // none of them ever reach this list at all.
  'compote',
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
// condition-based filtering is real, existing Digest/Healing-
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
  // Found live, during the nuts-and-seeds investigation below, not
  // reported directly -- a real, separate bug of the exact same shape:
  // "Bagels, plain, enriched, with calcium propionate (includes onion,
  // poppy, sesame)" was sitting at is_whole_food=null, because \bbagel\b
  // does not bound-match "Bagels" (plural, fused, the same recurring
  // word-form lesson as "Fast food"/"Fast foods"). Checked real scope
  // before fixing: 14 real "Bagels" records, 6 real "Tortillas," 1 real
  // "Chapatis" -- all plural, all genuinely missed.
  'bagels', 'tortillas', 'chapatis',
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
  // Continued proactive scan: 'peppermint'/'spearmint' -- real, distinct
  // species names, neither bound-matched by the existing bare 'mint'
  // above (both are fused compound words with no boundary before
  // "mint"). Real, confirmed damage: "Spearmint leaves" was sitting
  // unclassified (no cooking-state qualifier at all to fall back on),
  // and "Peppermint tea (infusion)" the same. "Spearmint, dried"/
  // "Peppermint, fresh" already happened to resolve true, but only via
  // the coincidental 'dried'/'fresh' hint, never because the herb itself
  // was recognized.
  'peppermint', 'spearmint',
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
  // Continued proactive scan: 'creams' (plural) -- the exact same real
  // plural word-boundary gap as everywhere else in this file; the
  // existing bare 'cream' above does not bound-match "Peppermint
  // creams" (a real British confectionery -- sugar fondant flavored
  // with peppermint, not the plain herb), which the new 'peppermint'
  // keep entry above would otherwise wrongly match.
  'creams',
  ...PRODUCT_SIGNAL_DISQUALIFIERS,
];

// New for this pass -- real, whole nuts and seeds, per a real, direct
// question: "Are we including all nuts and seeds?" Investigated before
// answering, not assumed -- confirmed the real, honest answer was no:
// hundreds of genuinely plain, single-species records (bare "Walnuts,"
// "Brazil nuts," "Pistachio nuts," "Sunflower seed") had NO stated
// cooking-state qualifier at all (no "raw"/"roasted"/"dried"), so nothing
// in this file ever recognized them -- the exact same real gap this
// file's own SPICE_HERB_KEEP already exists to solve for spices/herbs,
// built the identical way: a real, explicit identity list (not a general
// "shelled"/"ground" keyword, which would carry the same real over-broad
// risk already rejected for spices), so grinding/blanching/hulling a
// LISTED nut or seed doesn't disqualify it -- matching the name alone is
// enough. 'chia seed' (not bare 'chia') deliberately kept as the full
// phrase -- checked directly and found a real, genuine collision:
// "Macchiato" contains "chia" as a literal substring, and a bare keyword
// would have wrongly matched every real macchiato/latte record in this
// database. 'brazil nut'/'pine nut' kept as full phrases for the same
// real reason -- bare "brazil" risks a country/region-name collision,
// and bare "pine" would match inside "pineapple." 'peanut'/'groundnut'
// included per this app's own established practice of common food
// identity over botanical classification (a peanut is a legume, not a
// tree nut, but this database already treats foods by what people
// actually call and eat them as, the same reasoning tomato-as-vegetable
// already rests on elsewhere).
//
// A real, honest, self-caught mistake, found only by testing every
// planned entry against the real function output rather than trusting
// the reasoning alone: the first version of this list only had singular
// forms, and missed the exact same real plural word-boundary gap this
// file has already documented and fixed multiple times THIS SAME PASS
// (bagel/bagels, croissant/croissants) -- "Almonds," "Walnuts,"
// "Pecans," "Brazil nuts," "Pine nuts," "Chestnuts," "Sunflower seeds,"
// "Pumpkin seeds," "Chia seeds," "Sesame seeds," "Hemp seeds," "Peanuts"
// were ALL sitting unmatched, since none of their own real singular
// identity words bound-match the plural, fused form. Every plural below
// was individually confirmed via real data before being added, not
// guessed in bulk -- three plausible ones (macadamias, filberts,
// groundnuts) were checked and found to have ZERO real occurrences, so
// deliberately left out rather than added speculatively.
//
// A real, direct correction to the earlier "Seed, sunflower" call, per a
// real, direct instruction: "a sunflower seed is a seed, so it should be
// kept." Investigated properly rather than leaving it as an accepted
// tradeoff -- pulled every real "Seed," / "Seeds," -prefixed record in
// this database (Norway_Matvaretabellen's own real naming convention)
// and found the real reversed-order set is small and fully enumerable,
// not an unbounded risk: "Seed, chia," "Seed, pumpkin," "Seed, sesame,"
// "Seed, sunflower," "Seed, hemp" -- exactly 5 real species, each added
// as its own explicit reversed-compound phrase, the same safe, narrow
// approach already used for "brazil nut"/"pine nut" above, not a general
// word-order regex (which would carry real over-match risk this file has
// deliberately avoided elsewhere). "Seed, poppy" and "Seed, linseed or
// flaxseed" were checked too and confirmed already correctly handled
// (SPICE_HERB_KEEP's own separate keyword; bare 'linseed'/'flaxseed'
// respectively). "Sesame, hulled seed" remains a real, genuine, low-
// volume exception (1 record) -- a 3-word interruption this same
// enumerable-phrase approach can't reach without guessing, left in the
// review queue rather than engineered around, the same honest,
// bounded-tradeoff standard already used for "tart"/"cutlet."
const NUT_SEED_KEEP = [
  'almond', 'almonds', 'walnut', 'walnuts', 'pecan', 'pecans', 'cashew',
  'cashews', 'pistachio', 'pistachios', 'hazelnut', 'hazelnuts',
  'filbert', 'macadamia', 'brazil nut', 'brazil nuts', 'pine nut',
  'pine nuts', 'chestnut', 'chestnuts', 'peanut', 'peanuts', 'groundnut',
  'sunflower seed', 'sunflower seeds', 'seed, sunflower', 'pumpkin seed',
  'pumpkin seeds', 'seed, pumpkin',
  // USDA's own real, common naming convention for this specific seed
  // family -- "pumpkin AND squash seed(s)," not just "pumpkin seed" --
  // found only by re-testing "Seeds, pumpkin and squash seed kernels,
  // roasted, salted" against the real function output and finding the
  // inserted "and squash" breaks the plain 'pumpkin seed' adjacency
  // match entirely, letting it wrongly resolve true via a completely
  // unrelated 'roasted' keyword instead.
  'pumpkin and squash seed', 'pumpkin and squash seeds', 'chia seed',
  'chia seeds', 'seed, chia', 'flaxseed', 'flaxseeds', 'flax seed',
  'flax seeds', 'linseed', 'linseeds', 'sesame seed', 'sesame seeds',
  'seed, sesame',
  'hemp seed', 'hemp seeds', 'seed, hemp', 'tahini',
];
// Reuses SPICE_HERB_DISQUALIFIERS wholesale (the identical "composite
// dish/product using the listed identity word as one ingredient among
// several" risk already proven out for spices), plus real, new
// nut/seed-specific risks found and checked directly against this
// database's own real data before being added: 'beverage'/'drink' (real
// plant-milk products -- "Almond based beverage," "Chestnut drink,
// plain, prepackaged" -- a real, separate, not-yet-decided category
// question this fix deliberately doesn't force an answer to, the same
// way it was left alone for the earlier oat/soy-beverage fortification
// question); 'porridge' (a real composite breakfast combining oats/
// millet with a nut/seed, e.g. "Oat porridge, overnight oats and chia
// seeds"); 'curry'/'curried' (a real composite dish, "Fish curry with
// saithe and peanuts," "Curried rice with almonds" -- both real word
// forms needed for the same recurring word-form reason as everywhere
// else in this file); 'caramel' (real candy-coated nuts, "Snacks,
// popcorn, caramel-coated, with peanuts"); 'pork' (a real composite
// cured-meat product using a nut as one ingredient, "Pure pork pistachio
// mortadella"); 'bar' (a real manufactured snack-bar shape, "Snacks,
// crisped rice bar, almond"); 'puffs' (a real manufactured, extruded-
// style snack, "Peanut puffs" -- doesn't literally say "extruded" the
// way this file's own general 'extruded' exclude requires, so needed its
// own real, separate signal); 'compote' (a real fruit-plus-nut
// combination, "Apple compote with raisins and almonds" -- deliberately
// scoped to THIS nut-specific disqualifier list only, not the general
// exclude list, since a plain single-fruit compote with no nut mentioned
// at all is still a real, legitimate simple preparation this database
// already correctly accepts, and never reaches this check to begin
// with). 'liqueur'/'praline'/'macaroon'/'marzipan'/'brittle'/'dragee'/
// 'bisque'/'strudel'/'seasoned' don't need to be repeated here at all --
// each is now a real, general exclude (see CANDY_SNACKS above), running
// before this check is ever reached. One real, low-volume exception
// deliberately left unaddressed: "Nuts, almond paste" (1 record) --
// real-world "almond paste" almost always means a sweetened, marzipan-
// adjacent product, but a bare 'paste' disqualifier would also have
// wrongly caught the already-correct, genuinely plain "Sesame paste,
// tahini" match, so this single ambiguous record was left as a small,
// accepted tradeoff rather than risk that collision.
//
// Real, direct instruction, extending this same list: "a sunflower seed
// is a seed, so it should be kept as long as it isn't salted already or
// seasoned." 'salted' (checked directly -- \bsalted\b correctly does NOT
// bound-match "unsalted," so "Seed, sesame, unsalted" and every other
// real "unsalted"/"without salt" record stays correctly unaffected);
// 'with salt' (a real, separate phrase needed for records that say "with
// salt added" or just "with salt" -- also checked directly and confirmed
// safe: "with salt" does not appear as a substring inside "without
// salt," since "with" is immediately followed by "out," not a space, so
// no real record saying "without salt"/"without salt added" is ever
// wrongly caught).
//
// A real, second, direct instruction in the same message, the genuine
// "how do you know how much of each is in the mix" question: 'mix'/
// 'mixed' -- checked directly against real data and found this was
// already a live, confirmed bug at real scale, not hypothetical: all 18
// real "Nuts, mixed nuts, ..." records (an assortment of unknown-ratio
// nut species, several also already salted) were sitting at
// is_whole_food=1, plus "Mixed nuts with dried fruit" (wrongly true via
// the existing 'dried fruit' safe_override) and the real "Aperitif mix
// of seeds ... and raisins" family this same report named directly.
// A real, honest, general principle, not just a nut-specific one: a
// "mix" of two or more real, separately-identifiable whole foods has a
// genuinely unknowable individual ratio, the same real problem this
// database's own core "single ingredient" scope already exists to
// avoid -- true regardless of whether the mix happens to be salted.
//
// A real, third bug found live, same investigation: 'enriched' -- "Wheat
// petals with walnuts, hazelnuts or almonds, enriched with vitamins and
// minerals" was wrongly true via the 'almonds' match, a real composite
// cereal-type product, not a plain nut. Deliberately scoped to this
// nut-specific disqualifier list only, not a general exclude -- the
// broader "does fortification alone disqualify a food" question stays
// the same real, deliberately open question this file already left
// alone for plain milk's own vitamin-D-fortification precedent.
const NUT_SEED_DISQUALIFIERS = [
  'beverage', 'drink', 'porridge', 'curry', 'curried', 'caramel', 'pork',
  'bar', 'puffs', 'compote', 'salted', 'with salt', 'mix', 'mixed',
  'enriched',
  ...SPICE_HERB_DISQUALIFIERS,
];

// A real, structural bug found only by testing the salt/mix/enriched
// disqualifiers above against real data, not assumed to work just
// because the logic looked right: NUT_SEED_KEEP is checked relatively
// late in classifyOne (after SAFE_OVERRIDES and OIL_KEEP), so a real
// disqualified record can still "leak through" via one of those EARLIER
// checks, which have no idea this disqualifier list even exists --
// confirmed live: "Seeds, sunflower seed kernels, oil roasted, with
// salt added" and "Nuts, mixed nuts, oil roasted with peanuts" were both
// still resolving TRUE via the OIL_KEEP check's own bare 'oil' match
// (from "oil roasted"), and "Mixed nuts with dried fruit" via
// SAFE_OVERRIDES' own 'dried fruit' match -- all three completely
// bypassing the nut/seed disqualifier logic above. Fixed the same way
// this file already fixes an early-precedence problem elsewhere
// (isBottledMineralWater, isAlcoholicCocktailOrCocktailSauce): a real,
// dedicated function, checked EARLY in classifyOne (in the exclude-gate
// section, before SAFE_OVERRIDES/OIL_KEEP/etc. ever get a chance to
// fire), reusing the exact same NUT_SEED_KEEP/NUT_SEED_DISQUALIFIERS
// lists already built above rather than duplicating them -- so there's
// only ever one real, single source of truth for what disqualifies a
// nut/seed match, checked at the one point that actually guarantees it
// wins regardless of which other positive rule might otherwise fire
// first.
function isDisqualifiedNutOrSeedProduct(text) {
  if (!anyKeywordMatches(text, NUT_SEED_KEEP)) return false;
  return Boolean(anyKeywordMatches(text, NUT_SEED_DISQUALIFIERS));
}

// Continued proactive scan -- a real, confirmed leak of the exact same
// shape as isDisqualifiedNutOrSeedProduct above: a genuine composite
// burger/hamburger SANDWICH (bun + patty + toppings, assembled at a
// restaurant) was resolving wrongly true by leaking through BREAD_KEEP's
// own 'bread' match or PLAIN_DAIRY_KEEP's own 'cheese'/'pickled' match,
// neither of which has any idea "burger" means something different in
// this context. Deliberately NOT a blanket "burger"/"hamburger" exclude
// -- "Hamburger, raw"/"Hamburger beef raw frozen food" (a real, plain
// Norwegian naming convention for ground beef, not a sandwich) and
// "Hamburger bread"/"Hamburger bun"/"Bread, hamburger buns" (the plain
// bun component on its own) are all real, legitimate whole foods this
// file already correctly accepts -- checked and confirmed unaffected:
// none of them contains 'with'/'restaurant', the two real, narrow
// assembly signals every genuine composite burger record actually found
// in this database uses ("Chicken burger with bread accessories,"
// "Hamburger 90 g with bread and accessories prepared at a restaurant,"
// "Hamburger double w. bread cheese pickled cucumber cooked in a
// restaurant" -- the last one abbreviates "with" as "w.," which is why
// 'restaurant' is checked as its own separate, independent signal
// rather than relying on 'with' alone).
function isDisqualifiedBurgerProduct(text) {
  if (!anyKeywordMatches(text, ['burger', 'hamburger'])) return false;
  return Boolean(
    anyKeywordMatches(text, ['with', 'restaurant', 'accessories'])
  );
}

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
  // A real, second instance of the same "the general exclude word
  // collides with a real, narrower legitimate whole food" shape as the
  // 'soda'/'baking soda' guard right above -- see SAUCE_EXCLUDE_GUARD_
  // PHRASES' own comment (COMPOSITE_DISH_SIGNALS above) for the full,
  // real reasoning behind each of the four excepted phrases.
  const excludeMatchRaw = anyKeywordMatches(n, ALL_EXCLUDE);
  const excludeMatch =
    excludeMatchRaw === 'soda' && containsKeyword(n, 'baking soda')
      ? null
      : excludeMatchRaw === 'sauce' &&
        anyKeywordMatches(n, SAUCE_EXCLUDE_GUARD_PHRASES)
      ? null
      : // A real, third instance of the same "the general exclude word
        // collides with a phrase that explicitly NEGATES it" shape as the
        // 'soda'/'baking soda' guard above. New bare 'filling' exclude
        // (see COMPOSITE_DISH_SIGNALS' own comment) correctly catches
        // dozens of real stuffed/filled composite dishes, but 2 real
        // records explicitly state the ABSENCE of a filling ("Cream
        // puff, plain, no filling"; "Flatbread, soft, sweet, Norwegian,
        // lefse, thick, no filling") -- excluding these via 'filling'
        // would be excluding them for the wrong reason entirely (they
        // have no filling at all). Deferred here rather than force-
        // excluded, so each falls through to whatever else (if anything)
        // legitimately classifies it, the same real, small, accepted-cost
        // pattern as the sauce guard above.
        excludeMatchRaw === 'filling' && containsKeyword(n, 'no filling')
      ? null
      : // A real, fourth instance of the same guard shape: new bare
        // 'nugget' exclude (see COMPOSITE_DISH_SIGNALS' own comment)
        // correctly catches the real manufactured-food-form family
        // (chicken/fish/soy-protein/mycoprotein nuggets), but "Pumpkin,
        // golden nugget" is a real, named winter-squash VARIETY -- the
        // word is part of the cultivar's own name, not a food form.
        excludeMatchRaw === 'nugget' && containsKeyword(n, 'golden nugget')
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

  // Real, standalone food-additive/chemical-compound entry -- see
  // E_NUMBER_ADDITIVE_PATTERN's own header comment for the real data
  // behind this.
  if (E_NUMBER_ADDITIVE_PATTERN.test(n)) {
    return {
      isWholeFood: false,
      ruleMatched: 'e_number_additive',
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

  // Real, mixed alcoholic drinks and cocktail sauce -- see
  // isAlcoholicCocktailOrCocktailSauce's own header comment for the real
  // report and real data behind this.
  if (isAlcoholicCocktailOrCocktailSauce(n)) {
    return {
      isWholeFood: false,
      ruleMatched: 'alcoholic_cocktail_or_cocktail_sauce',
      autoConfidence: 'high',
    };
  }

  // Real, disqualified nut/seed product (salted, seasoned, mixed,
  // enriched, etc.) -- checked EARLY, deliberately ahead of
  // SAFE_OVERRIDES/OIL_KEEP/etc. below, so a real disqualifier can never
  // be bypassed by an earlier rule that doesn't know about it. See
  // isDisqualifiedNutOrSeedProduct's own header comment for the real,
  // live leak this fixes.
  if (isDisqualifiedNutOrSeedProduct(n)) {
    const nutSeedMatch = anyKeywordMatches(n, NUT_SEED_KEEP);
    const disqualifier = anyKeywordMatches(n, NUT_SEED_DISQUALIFIERS);
    return {
      isWholeFood: false,
      ruleMatched: `nut_or_seed_disqualified: matched "${nutSeedMatch}" but also "${disqualifier}"`,
      autoConfidence: 'high',
    };
  }

  // Real, disqualified burger/hamburger product -- checked EARLY for the
  // same reason as the nut/seed check right above. See
  // isDisqualifiedBurgerProduct's own header comment for the real, live
  // leak this fixes.
  if (isDisqualifiedBurgerProduct(n)) {
    const burgerMatch = anyKeywordMatches(n, ['burger', 'hamburger']);
    const disqualifier = anyKeywordMatches(n, ['with', 'restaurant', 'accessories']);
    return {
      isWholeFood: false,
      ruleMatched: `burger_disqualified: matched "${burgerMatch}" but also "${disqualifier}"`,
      autoConfidence: 'high',
    };
  }

  // A real, second instance of the exact same "mix" leak just fixed for
  // nuts/seeds, found by checking the same real principle more broadly
  // once the first one turned up: "Mixed nuts with dried fruit" and
  // "Mixed dried fruit" (a real combination of multiple, unspecified
  // dried-fruit species -- the identical unknown-ratio problem) were both
  // resolving true via SAFE_OVERRIDES' own 'dried fruit' phrase, which
  // has no disqualifier of its own at all. 'mix'/'mixed' checked here
  // too, for the same real reason.
  const safeOverride = anyKeywordMatches(n, SAFE_OVERRIDES);
  if (safeOverride) {
    const mixDisqualifier = anyKeywordMatches(n, ['mix', 'mixed']);
    if (mixDisqualifier) {
      return {
        isWholeFood: false,
        ruleMatched: `safe_override_disqualified: matched "${safeOverride}" but also "${mixDisqualifier}"`,
        autoConfidence: 'high',
      };
    }
    return {
      isWholeFood: true,
      ruleMatched: `safe_override: ${safeOverride}`,
      autoConfidence: 'high',
    };
  }

  // Real, deliberate deferral, not a disqualification: "Agave spirit
  // (Mezcal/Tequila)" is a real distilled beverage, not the syrup --
  // skipping this whole branch when 'spirit' is present lets it fall
  // through to ALCOHOL_KEEP below instead, which resolves it correctly
  // (still TRUE, just via an honest rule_matched label) rather than
  // returning an incorrect FALSE the way every other real disqualifier
  // in this file does.
  const naturalSweetener = containsKeyword(n, 'spirit')
    ? null
    : anyKeywordMatches(n, NATURAL_SWEETENER_KEEP);
  if (naturalSweetener) {
    const sweetenerDisqualifier = anyKeywordMatches(
      n,
      NATURAL_SWEETENER_DISQUALIFIERS
    );
    if (sweetenerDisqualifier) {
      return {
        isWholeFood: false,
        ruleMatched: `natural_sweetener_disqualified: matched "${naturalSweetener}" but also "${sweetenerDisqualifier}"`,
        autoConfidence: 'high',
      };
    }
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

  // Real, plain soy-milk coagulation -- see SOY_DERIVATIVE_KEEP's own
  // header comment for the real reasoning behind this. Continued
  // proactive scan: a real, confirmed leak found live -- "Tofu dumpling
  // (not suitable for vegans), prepackaged" was wrongly resolving true
  // via bare 'tofu,' despite being a genuine composite dish (a dumpling
  // wrapper filled with tofu, not plain tofu itself). 'dumpling'/
  // 'dumplings' checked as a real, dedicated disqualifier here, the same
  // real leak shape already fixed for nuts/seeds and natural sweeteners.
  const soyMatch = anyKeywordMatches(n, SOY_DERIVATIVE_KEEP);
  if (soyMatch) {
    const dumplingDisqualifier = anyKeywordMatches(n, ['dumpling', 'dumplings']);
    if (dumplingDisqualifier) {
      return {
        isWholeFood: false,
        ruleMatched: `soy_derivative_disqualified: matched "${soyMatch}" but also "${dumplingDisqualifier}"`,
        autoConfidence: 'high',
      };
    }
    return {
      isWholeFood: true,
      ruleMatched: `soy_derivative: ${soyMatch}`,
      autoConfidence: 'high',
    };
  }

  // Real, single-type alcohol -- see ALCOHOL_KEEP's own header comment
  // for the real decision and the real data behind this.
  const alcoholMatch = anyKeywordMatches(n, ALCOHOL_KEEP);
  if (alcoholMatch) {
    return {
      isWholeFood: true,
      ruleMatched: `alcohol: ${alcoholMatch}`,
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

  // Real, whole nuts and seeds: real, positive signal, unless a real
  // disqualifier (a composite dish/candy/product using the listed nut
  // or seed as one ingredient among several) is also present. See
  // NUT_SEED_KEEP's own header comment for the real question and real
  // data behind this.
  const nutSeedMatch = anyKeywordMatches(n, NUT_SEED_KEEP);
  if (nutSeedMatch) {
    const disqualifier = anyKeywordMatches(n, NUT_SEED_DISQUALIFIERS);
    if (disqualifier) {
      return {
        isWholeFood: false,
        ruleMatched: `nut_or_seed_disqualified: matched "${nutSeedMatch}" but also "${disqualifier}"`,
        autoConfidence: 'high',
      };
    }
    return {
      isWholeFood: true,
      ruleMatched: `nut_or_seed: ${nutSeedMatch}`,
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
  SAUCE_EXCLUDE_GUARD_PHRASES,
  IN_OR_WITH_SAUCE_PATTERN,
  E_NUMBER_ADDITIVE_PATTERN,
  isBottledMineralWater,
  isAlcoholicCocktailOrCocktailSauce,
  BRAND_NAMES,
  ALL_EXCLUDE,
  JUICE_DISQUALIFIERS,
  FLAVOR_OR_ADDITIVE_MARKERS,
  SAFE_OVERRIDES,
  FERMENTED_KEEP,
  NATURAL_SWEETENER_KEEP,
  NATURAL_SWEETENER_DISQUALIFIERS,
  PLAIN_DAIRY_KEEP,
  SOY_DERIVATIVE_KEEP,
  ALCOHOL_KEEP,
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
  NUT_SEED_KEEP,
  NUT_SEED_DISQUALIFIERS,
  PRODUCT_SIGNAL_DISQUALIFIERS,
  PANTRY_STAPLE_KEEP,
  PANTRY_STAPLE_DISQUALIFIERS,
};
