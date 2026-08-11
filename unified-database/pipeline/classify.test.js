// A real, direct test suite for classify.js -- run manually via
// `node classify.test.js`, not wired into any CI (this project has
// none), but the same "verify before trusting it" discipline used
// throughout this session. Covers every real rule branch plus the exact
// "ice cream" false-positive-dairy-match case that was caught and fixed
// before this was ever considered done.

const assert = require('assert');
const { classifyOne, classifyRecord } = require('./classify.js');

let pass = 0;
let fail = 0;

function check(name, nameForClassification, hasEnglishEvidence, expectedIsWholeFood) {
  const result = classifyOne({ nameForClassification, hasEnglishEvidence });
  try {
    assert.strictEqual(
      result.isWholeFood,
      expectedIsWholeFood,
      `expected isWholeFood=${expectedIsWholeFood}, got ${result.isWholeFood} (rule: ${result.ruleMatched}, confidence: ${result.autoConfidence})`
    );
    console.log(`PASS  ${name}  ->  ${result.ruleMatched}`);
    pass++;
  } catch (e) {
    console.log(`FAIL  ${name}  ->  ${e.message}`);
    fail++;
  }
}

// --- Real whole-food inclusions ---
check('plain yogurt', 'Yogurt, plain, whole milk', true, true);
check('plain milk', 'Milk, whole, 3.25% milkfat', true, true);
check('plain butter', 'Butter, salted', true, true);
check('plain cheese', 'Cheddar cheese', true, true);
check('butchered cut', 'Chicken breast, raw', true, true);
check('butchered cut, cooked', 'Pork loin, roasted', true, true);
check('dried fruit, "food, dried" order', 'Apple, dried', true, true);
check('dried apricot, "dried food" order (exact phrase list)', 'Dried apricot', true, true);
check('dehydrated, general hint', 'Mango, dehydrated', true, true);
check('fresh juice', 'Orange juice, fresh squeezed', true, true);
check('honey', 'Honey, raw', true, true);
check('smoked fish (safe override)', 'Smoked salmon', true, true);
check('raw vegetable', 'Carrot, raw', true, true);
check('whole grain', 'Oats, whole grain, raw', true, true);
check('"uncooked" (word-boundary edge case found via real data)', 'Adzuki beans, uncooked', true, true);
check('"dry" as a legume/grain prep state', 'Lentils, dry', true, true);

// --- Real exclusions ---
check('bacon', 'Bacon, pork', true, false);
check('sausage', 'Sausage, beef', true, false);
check('candy', 'Chocolate bar, milk chocolate', true, false);
check('soda', 'Cola, regular', true, false);
check('cake', 'Cake, chocolate, frosted', true, false);
check('fast food', "McDonald's hamburger", true, false);
check('processed cheese', 'Cheese, processed, American', true, false);
check('flavored yogurt (the app owner’s own rule)', 'Yogurt, strawberry flavored', true, false);
check('sweetened yogurt', 'Yogurt, sweetened, low fat', true, false);
check('juice from concentrate', 'Apple juice, from concentrate', true, false);
check('juice drink', 'Fruit juice drink, punch', true, false);
check('margarine', 'Margarine, regular', true, false);

// --- The real bug this test suite exists to catch ---
check('ICE CREAM must not slip through via "cream" dairy match', 'Ice cream, vanilla', true, false);
check('ice cream, unflavored, still not whole food', 'Ice cream, plain', true, false);
check('whipped topping must not slip through via "cream"', 'Whipped topping, non-dairy', true, false);

// --- Real, new categories: oil, bread, flour, spice/herb (the app
// owner's own direct, tightened final scope for this database) ---
check('plain olive oil', 'Olive oil', true, true);
check('plain almond oil', 'Almond oil', true, true);
check('real, traditional rendered animal fat named "oil"', 'Animal fat, native, seal oil', true, true);
check('fish canned in real oil, no other additive', 'Anchovy, canned in oil, drained', true, true);
check('essential oil is not food', 'Lavender essential oil', true, false);
check('mineral oil is not food', 'Mineral oil', true, false);
check('a blended oil product, disqualified', 'Cooking oil blend', true, false);

check('plain bread', 'Bread, from white flour', true, true);
check('plain bagel', 'Bagel, plain (with onion, poppy seed and/or sesame seed)', true, true);
check('plain pita', 'Pita bread, whole wheat', true, true);
check('plain tortilla', 'Tortilla, corn', true, true);
check('bread crumbs are a processed derivative, not bread', 'Bread crumbs, dry, grated, plain', true, false);
check('a branded bread-flour MIX product, not bread', 'Bread flour mix, no knead bread, gluten-free, organic, powder', true, false);

check('plain wheat flour', 'Wheat flour, whole grain', true, true);
check('plain almond flour', 'Almond flour', true, true);
check('bean flour', 'Beans, black, flour', true, true);
check('a sweet biscuit that happens to mention flour is not plain flour', 'Biscuit, sweet, wholemeal flour, Digestive', true, false);
// Superseded by a later, real, direct report on "biscuit" generally --
// this exact record now correctly excludes via the new, general
// "biscuit" keyword instead of reaching the bread rule at all (general
// excludes run first). Real crispbread not named "biscuit" is still
// correctly whole food -- see this file's own later "crispbread without
// the word biscuit" test.
check('a "biscuit"-named crispbread is now excluded, a real, accepted tradeoff -- see later in this file', 'Biscuit, savoury, from rye flour, crispbread', true, false);

check('whole fresh basil ("flavor is the basis for enjoying the food")', 'Basil, fresh', true, true);
check('bare, unqualified spice name with no other descriptor at all', 'Cinnamon', true, true);
check('ground spice -- grinding is mechanical processing, same as dried fruit', 'Cinnamon, ground', true, true);
check('a spice name inside a composite sauce is not the spice itself', 'Pasta sauce with basil', true, false);
check('a spice name inside a composite pesto is not the spice itself', 'Pesto with basil pine nuts cashew nuts', true, false);
check('"ginger" alone is the real root spice', 'Ginger, ground', true, true);
check('"ginger ale" is a soft drink, not the spice', 'Ginger ale', true, false);
check('a branded cereal flavored with cinnamon is not the spice itself', 'Cereal, ready to eat, Cinnamon Toast Crunch, General Mills', true, false);
check('a cinnamon roll is a composite baked good, not the spice itself', 'Cinnamon roll, home-made', true, false);
check('a composite fish dish mentioning parsley is not the herb itself', 'Fish with sun-dried tomato parsley garlic', true, false);
check('a real, simple vegetable preparation is unaffected (fennel bulb, boiled with salt)', 'Fennel boiled with salt', true, true);

// --- Real, new pantry-staple category (sugar, baking soda, cacao,
// coffee, and similar "100 years prior to heavy processing" staples) ---
check('plain granulated sugar, now a real, positive pantry staple', 'Sugar, granulated', true, true);
check('brown sugar', 'Brown sugar', true, true);
check('baking soda', 'Baking soda', true, true);
check('baking powder', 'Baking powder', true, true);
check('plain coffee', 'Coffee, ground, roasted', true, true);
check('plain cocoa powder', 'Cocoa, unsweetened, powder', true, true);
check('plain salt', 'Salt, sea', true, true);
check('high-fructose corn syrup remains excluded -- a modern industrial sweetener, not a traditional staple', 'Corn syrup, high fructose', true, false);
check('a branded hot-chocolate MIX is not plain cocoa', 'Cocoa, hot chocolate mix, instant', true, false);
check('"coffee cake" is a cake, not coffee', 'Coffee cake, crumb topping', true, false);

// --- Real, direct report: "'Palatine' bratwurst fried, in brown basic
// sauce" is a composite dish with unaccountable ingredients, not a
// whole food -- and the bratwurst-family sausage gap it surfaced ---
check('the exact reported record', '"Palatine" bratwurst fried, in brown basic sauce', true, false);
check('bratwurst is a real, unbroken-compound-word sausage, same category as "sausage"', 'Beef-Bratwurst grilled', true, false);
check('bockwurst, same real sausage-family gap', 'Bockwurst, pork, veal, raw', true, false);
check('plain bratwurst alone (no sauce) is still correctly excluded -- it is a sausage', 'Bratwurst fried', true, false);
check('"in ... sauce" -- a protein served in an unaccountable sauce is a composite dish', 'Chicken thigh boiled, in curry sauce', true, false);
check('"with ... sauce" -- the same real pattern, different preposition', 'Duck fried in oven, with oranges and sauce', true, false);
check('"in white basic sauce with cream" -- real words between "in" and "sauce" still match', 'Button mushrooms stewed, in white basic sauce with cream', true, false);
// Neither of these was ever auto-classified TRUE before this pass
// either (no raw/fresh/cooked/etc. word present) -- the real point being
// tested here is that the new sauce pattern doesn't newly EXCLUDE them,
// leaving them exactly where they already were: genuinely ambiguous,
// forced into human review rather than guessed at either way.
check('a bare, standalone "sauce" product is unaffected -- no "in/with" precedes it', 'Apple sauce, unsweetened', true, null);
check('"Applesauce" (one word) is unaffected by the sauce-pattern check, and now correctly resolves true via the new "canned" positive hint (a real, later pass)', 'Applesauce, canned, unsweetened', true, true);

// --- Real, direct report: composite goulash/meringue dishes, and real
// brand names, should never appear in this list ---
check('the exact reported goulash record', '"Rehpfeffer" savory roe deer goulash', true, false);
check('any real goulash is a composite stew', 'Beef goulash (shoulder) raw', true, false);
check('the exact reported meringue record', '"Wasp nests" almond meringue', true, false);
check('bare "Meringue" is still a composite whipped-egg-and-sugar dessert', 'Meringue', true, false);
check('the exact reported brand -- APPLEBEE\'S', "APPLEBEE'S, chicken tenders platter", true, false);
check('a brand can slip through even a real dairy match -- caught before any positive rule runs', "APPLEBEE'S, KRAFT, Macaroni & Cheese, from kid's menu", true, false);
check('a real branded cereal is excluded via the general cereal signal, not a risky bare "post" brand keyword', 'Cereals ready-to-eat, POST HONEY BUNCHES OF OATS with cinnamon bunches', true, false);
check('a manufactured breakfast cereal is a combination product, never a single ingredient', 'Breakfast cereal muesli whole grain with fruit nuts sugar etc. honey', true, false);
check('cornflakes, no "cereal" word present at all, still correctly excluded', 'Cornflakes unsweetened', true, false);
check('"mead" alone is a real, legitimate fermented honey beverage, unaffected', 'Mead, fermented honey wine', true, true);
check('"malt" alone is a real grain product, unaffected', 'Barley malt flour', true, true);
check('a known-legitimate ALLCAPS acronym (USDA) is not treated as a brand', 'Beef, chuck, mock tender steak, USDA choice, cooked, broiled', true, true);
check('a known-legitimate ALLCAPS abbreviation (UHT, a dairy pasteurization method) is not a brand', 'Cream, half, UHT', true, true);
// BBQ'd was never a positive classifier either way (bare "fried"/"BBQ"
// were both deliberately left out of RAW_WHOLE_FOOD_HINTS earlier this
// session as genuinely ambiguous) -- the real point being tested here
// is that it isn't wrongly EXCLUDED as if it were a brand, which a null
// (not false) result confirms.
check('a known-legitimate ALLCAPS cooking-method abbreviation (BBQ) is not treated as a brand', 'Pork, forequarter chop, lean, BBQ\'d, no added fat', true, null);

// --- Real, direct report: biscuits, bottled mineral water brands, and
// multi-step bean-paste derivatives should never appear in this list ---
check('the exact reported Springerle record', '"Springerle" anise biscuits', true, false);
check('the exact reported Zedernbrot record', '"Zedernbrot" lemon almond biscuits', true, false);
check('a real, live false positive: "dry" incorrectly matching a manufactured biscuit', 'Plain dry biscuit', true, false);
check('another real, live false positive via "dry"', 'Dry biscuit with chocolate topping', true, false);
check('a real, live false positive via "oil"', 'Biscuits, crackers, oil-sprayed', true, false);
check('a real, live false positive via "cocoa"', 'Wholemeal shortbread biscuits, containing cocoa, with nougat filling', true, false);
check('the real, accepted tradeoff -- a "biscuit"-named crispbread is excluded too, but crispbread stays reachable via other real records', 'Biscuit, savoury, from wholemeal wheat flour, crispbread', true, false);
check('crispbread without the word "biscuit" is still correctly whole food', 'Crispbread, rye', true, true);

check('the exact reported Abatilles record', 'Abatilles mineral water, bottled, non-carbonated, lightly mineralized (Arcachon, 33)', true, false);
check('any real branded bottled mineral water', 'Evian mineral water, bottled, non-carbonated, lightly mineralized (Evian, 74)', true, false);
check('plain, unbranded spring water is unaffected -- no "bottled" present', 'Spring water', true, null);
check('plain tap water is unaffected too', 'Tap water', true, null);

check('the exact reported bean-paste record', 'Adzuki beans, mature seeds, "An" (bean paste), "Koshi-an"(strained bean paste)', true, false);
check('a second real bean-paste variant', 'Adzuki beans, mature seeds, "An" (bean paste), "Sarashi-an" (powder of strained bean paste)', true, false);
check('plain, whole cooked adzuki beans remain correctly whole food', 'Adzuki beans, mature seeds, whole, boiled', true, true);

// --- A proactive, self-initiated real-data scan of the review queue --
// not from a direct report, but the same real pattern surfacing again ---
check('a real, genuine composite baby-food dessert', 'Babyfood, dessert, banana pudding, strained', true, false);
check('a real, genuine composite stuffed dish', 'Fresh stuffed pasta (e.g. ravioli, tortellini), cooked (medium food)', true, false);
check('an explicit, unambiguous restaurant-preparation marker', 'Chinese dish, lo mein, vegetable, without meat, restaurant prepared', true, false);
check('a real, genuine composite pie', 'Beef Pot Pie, frozen entree, prepared', true, false);
check('a real, genuine composite croquette', 'Croquettes, potato-based, fried, frozen', true, false);
check('a real, genuine composite fritter', 'Corn fritter', true, false);
check('"tart" deliberately left out -- a real, legitimate tart-flavored juice must stay unaffected', 'Cherry juice, tart', true, true);
check('"cutlet" deliberately left out -- a real, legitimate raw butchered cut must stay unaffected', 'Lamb, cutlet or frenched cutlet, with bone, lean, raw', true, true);

// --- Real, direct question (not a bug report): traditional
// whole-food-based condiments are still combinations of 2+ separate
// ingredients, excluded regardless of how "clean" the real recipe is ---
check('bare "Aioli," even the traditional garlic-and-olive-oil version, is still a combination of 2 real foods', 'Aioli', true, false);
check('commercial aioli, the same real underlying reason applies too', 'Aioli sauce, prepackaged', true, false);
check('homemade hummus is still chickpeas + tahini + lemon + garlic + oil combined', 'Hummus, homemade', true, false);
check('the alternate real spelling found in the data', 'Dip, hummus (hommus), commercial', true, false);
check('guacamole, same reasoning', 'Guacamole', true, false);
check('salsa, same reasoning', 'Tomato salsa', true, false);
check('tzatziki, same reasoning', 'Tzatziki', true, false);
check('tapenade, same reasoning', 'Tapenade', true, false);
check('the real, separate whole-food ingredients themselves remain correctly included', 'Garlic, raw', true, true);
check('olive oil remains correctly included too', 'Olive oil', true, true);
check('chickpeas remain correctly included too', 'Chickpeas, mature seeds, raw', true, true);

// --- Real, direct report: Ajvar and stewed (a real plural/form gap) ---
check('the exact reported Ajvar record', 'Ajvar, sweet pepper sauce, home-made', true, false);
check('"home-made" does not tell us real ingredients/amounts -- still excluded', 'Ajvar canned', true, false);
check('the exact reported "two things combined" Ajvar record', 'Ajvar and spinach sauce', true, false);
check('the exact reported "stewed" record -- the plural/form gap "stew" alone missed', 'Alaska pollock stewed', true, false);

// --- Real, direct correction, reversing the earlier "fried without fat
// is a legitimate simple preparation" call: "Frying changes the food and
// the oil is no good for you. These kinds of things should not be in a
// whole food database." Bare "fried" is now a general exclude. ---
check('the exact reported record -- "fried without fat" no longer whitelisted, correctly excluded now', 'Albacore deep-frozen, fried without fat (pan)', true, false);
check('the earlier, now-reversed "point of contrast" record -- also correctly excluded now', 'Alaska pollock fried without fat (oven)', true, false);
check('the pan variant, same real reversal', 'Albacore fried without fat (pan)', true, false);
check('a breaded, composite variant was already correctly excluded, still is', 'Alaska pollock breaded, deep-frozen, fried without fat (oven)', true, false);
check('plain "fried" with fat stated, previously slipping through via a "cooked" match', 'Chicken, broilers or fryers, meat only, cooked, fried', true, false);
check('plain "fried" with salt, previously slipping through via a "salt" match', 'Chicken breast fillet with skin fried with salt', true, false);
check('protein rolled in flour then fried -- a real, separate bug this same fix caught, previously slipping through via the FLOUR rule', 'Catfish, fillet, rolled in flour, fried in fat', true, false);
check('a composite product fried in oil -- previously slipping through via the OIL rule', 'Fast foods, potato, french fried in vegetable oil', true, false);
check('stir-fried still correctly excluded -- the hyphen does not defeat the word-boundary match', 'stir-fried vegetables', true, false);
check('a real, unrelated word is not falsely caught -- "clarified" does not contain "fried"', 'Clarified butter', true, true);
check('the real ingredient itself, on its own, remains correctly included', 'Albacore, raw', true, true);

// --- Same real principle, a real, direct question (not a bug report):
// "Algae, 'Hijiki', boiled and dried, ... rehydrated and sautéed. It has
// gone through a process and then sauteed so it is cooked. That leads me
// to believe it is a product. How would a Japanese person trying to eat
// wholefood only think of it?" -- sautéing is the same direct-fat-contact
// method as frying; the mandatory boil-and-dry step that makes hijiki
// safe to eat at all is not. ---
check('the base, boiled-and-dried hijiki -- a mandatory processing step, not a recipe, stays a real whole food', 'Algae, "Hijiki", boiled and dried, stainless steel pot process, raw', true, true);
check('rehydrating the dried whole food by boiling it is no different from rehydrating dried beans -- stays whole food', 'Algae, "Hijiki", boiled and dried, stainless steel pot process, rehydrated and boiled', true, true);
check('the exact reported record -- sautéing is a real, additional cooking step, correctly excluded now', 'Algae, "Hijiki", boiled and dried, stainless steel pot process, rehydrated and sautéed', true, false);
check('a bare, standalone accented "Sauté" at the end of a name -- the real reason "saut" (not the fuller "sauté") was chosen as the keyword', 'Kidney Sauté', true, false);
check('the real, plain-ASCII English form, needs its own explicit keyword', 'Peppers, sweet, red, sauteed', true, false);

// --- Real, direct report: "Lots of these are in there Alcohol,
// cocktail, daiquiri (rum), homemade, which will have more than just
// rum." ---
check('the exact reported record', 'Alcohol, cocktail, daiquiri (rum), homemade', true, false);
check('a real, multi-ingredient sour-mix blend, not a single spirit', 'Alcohol, cocktail, whisky sour mix, powder', true, false);
check("Germany_BLS's own \"Cocktail, <name>\" naming convention", 'Cocktail, Bloody Mary', true, false);
check('a real named drink with no explicit spirit word in its own name, still caught by the "Cocktail, " prefix', 'Cocktail, Mojito', true, false);
check('a spirit-named cocktail with no "Alcohol," prefix and no "Cocktail," prefix either', 'Rum-based cocktail', true, false);
check('real cocktail sauce -- a genuine composite condiment, not a single ingredient', 'Sauce, cocktail, ready-to-serve', true, false);
check('a real composite beverage-mix concentrate, regardless of its own alcohol content -- caught via the "cocktail"+"mix" check, not the alcohol check ("non-alcoholic" does not bound-match "alcohol")', 'Cocktail mix, non-alcoholic, concentrated, frozen', true, false);
check('"Fruit cocktail" deliberately left untouched -- a real, separate judgment call this report did not ask for', 'Fruit cocktail, canned, in natural juice', true, true);
check('"cocktail" as an onion SIZE, not a mixed drink, unaffected by the cocktail check, and now correctly resolves true via the new "pickled" positive hint (a real, later pass)', 'Onions, pickled, cocktail/silverskin, drained', true, true);

// --- A real, second proactive scan (a real, random 100-record sample of
// the review queue, the same repeatable method) -- the single largest
// batch of real fixes yet. A major real bug, not reported directly: the
// FAST_FOOD list only ever had singular "fast food," so real USDA
// "Fast foods, X" records (264 of them, always plural) never actually
// excluded at all -- 42 genuine fast-food items (nachos, tacos,
// burritos, pizza, chimichanga) were wrongly passing via whatever OTHER
// keyword happened to appear in their own longer name. ---
check('the real, major "Fast foods" (plural) bug -- 42 real records were wrongly passing via an unrelated keyword before this fix', 'Fast foods, nachos, with cheese', true, false);
check('a second real "Fast foods" example, previously passing via "cheese"', 'Fast foods, mexican, taco with beef, cheese and lettuce, hard shell', true, false);

// --- Real, traditional whole-food-based condiments/pastries/dishes,
// each individually checked against every real record before being
// added, the same "even the traditional version is still a combination"
// or "same family as an already-excluded category" reasoning already
// established. ---
check('mayonnaise -- the same real combination-condiment family as aioli/hummus', 'Mayonnaise, full fat, 80 % fat', true, false);
check('a real sweet/laminated pastry, same family as cake/donut/pastry, not the minimal-ingredient BREAD_KEEP exception', 'Croissant, plain, industrially made', true, false);
check('the real plural form of croissant -- caught only by re-testing, not assumed alongside the singular', 'Croissants, butter', true, false);
check('scone, same pastry family', 'Scone, pumpkin, homemade', true, false);
check('muffin, same pastry family', 'Muffin, banana', true, false);
check('omelet/omelette -- real, whipped-egg, direct-fat-contact preparation, the same reasoning as frying', "Farmer's omelette", true, false);
check('real cranberry-orange relish, a genuine combination', 'Cranberry-orange relish, canned', true, false);
check('real brawn/head cheese -- a jellied meat product made by definition from combining animal parts', 'White brawn', true, false);
check('real refried beans -- mashed AND fried', 'Refried beans, canned', true, false);
check('"con carne" -- Spanish "with meat," always a real composite stew', 'Chili con carne', true, false);
check("Japan_MEXT's own self-declared \"Compound alcoholic beverage\" category", 'Compound alcoholic beverage, "Umeshu" (plum liquor made from Japanese apricots)', true, false);
check('a real manufacturing-process word with no legitimate single-ingredient meaning', 'Snacks, corn-based, extruded, onion', true, false);

// --- Real, standalone food-additive/chemical-compound entries, named
// with their own real E-number -- a chemical additive, not a food, even
// when the compound itself is naturally occurring (ascorbic/citric acid). ---
check('the E-number additive pattern', 'Ascorbic acid (E 300)', true, false);
check('a real phosphate meat-processing additive', 'Cutter additives phosphate-based (E 450)', true, false);

// --- Real, single-type alcohol -- a genuine, direct decision (not a
// unilateral call): beer/wine/sake (fermented) and whisky/vodka/rum/gin/
// brandy (distilled) fit the same "single ingredient plus a simple,
// traditional transformation" category already accepted for cheese,
// yogurt, and kombucha. Real, composite/flavored/branded exceptions all
// checked and excluded FIRST, specifically to protect this list. ---
check('plain beer counts as legitimate fermented whole food, per direct decision', 'Alcoholic beverage, beer, regular, all', true, true);
check('plain wine, same real decision', 'Alcoholic Beverage, wine, table, red, Merlot', true, true);
check('plain distilled rum, same real decision', 'Alcoholic beverage, distilled, rum, 80 proof', true, true);
check("Japan_MEXT's own \"Fermented alcoholic beverage\" category label, matching this real decision directly", 'Fermented alcoholic beverage, "Sake", regular', true, true);
check('a named mixed drink is still correctly excluded, even using the adjective "Alcoholic" form that does not bound-match "alcohol"', 'Alcoholic beverage, pina colada, canned', true, false);
check('a real, non-alcoholic soft drink that happens to say "beer" -- checked and excluded before the positive "beer" keyword was added, so it cannot be wrongly swept in', 'Root beer', true, false);
check('a real wine-based cooking sauce -- checked and excluded before the positive "wine" keyword was added', 'Red wine sauce fat 1.5%', true, false);
check('a real, genuinely fortified wine style (spirit deliberately added to wine)', 'Strong wine vol. % 18 type Madeira', true, false);
check('branded beer is still correctly excluded via BRAND_NAMES, ahead of the new positive "beer" keyword', 'Alcoholic beverage, beer, regular, BUDWEISER', true, false);

// --- Real, plain soy-milk coagulation -- the same "coagulate with a
// simple, traditional agent" shape already accepted for dairy cheese. ---
check('plain tofu', 'Tofu', true, true);
check('the real, traditional nigari-coagulated form', 'Tofu, firm, prepared with calcium sulfate and magnesium chloride (nigari)', true, true);
check('a branded tofu product is still correctly excluded via BRAND_NAMES', 'MORI-NU, Tofu, silken, firm', true, false);

// --- Real, genuine plant-based dairy ALTERNATIVES (not real dairy at
// all, despite matching a dairy keyword like "cheese" or "yogurt") --
// a real, second, more direct piece of evidence than fortification alone
// (which this app already accepts for real dairy, e.g. vitamin-D milk). ---
check('a real "plant-based... used as cheese" product is not real dairy, despite matching the "cheese" keyword', 'Plant-based product, used as cheese', true, false);
check('a real plant-based yogurt alternative, same reasoning', 'Plant-based yogurt alternative, made from soya, unsweetened', true, false);

// --- Real, simple mechanical/traditional processing steps this pass
// found genuinely missing, each individually verified against real data. ---
check('"desiccated" -- a real, separate word for "dried"', 'Nuts, coconut meat, desiccated, unsweetened', true, true);
check('"toasted" -- a real, separate word for "roasted"', 'Grains, wheat germ, toasted, plain', true, true);
check('"puree"/"pureed" -- a real, simple mechanical single-ingredient processing step, the same category as "mashed"', 'Celeriac puree', true, true);
check('"canned" -- a real, simple preservation method, the same category as "frozen," added only after every real composite-canned-dish signal this same pass found was already in place', 'Bean, red kidney, canned, drained', true, true);
check('"pickled"/"pickles" -- real, simple brine preservation, the same real category as kombucha/kimchi/miso', 'Beetroot, pickled', true, true);
check('"vinegar" -- a real acetic-acid fermentation product, the same real category', 'Distilled vinegar', true, true);
check('bare "Buttermilk" -- the exact same fused-compound-word gap as "ice cream"', 'Buttermilk', true, true);

// --- The two real, confirmed precedence bugs this pass fixed (general
// exclude now runs before every positive rule, not just some of them) ---
check('a gingerbread cookie containing honey is not "honey"', 'Kathrinchen honey gingerbread biscuits', true, false);
check('plain honey itself is unaffected by the reorder', 'Honey, raw', true, true);

// --- Real, direct question, not a bug report: "Are we including all
// nuts and seeds?" Investigated before answering -- the real, honest
// answer was no. Built the identical way SPICE_HERB_KEEP already
// solves the same problem for spices/herbs: a real, explicit identity
// list, no separate cook-state check needed. ---
check('bare, plain nuts with no cooking-state qualifier at all', 'Walnuts', true, true);
check('a second bare example', 'Brazil nuts', true, true);
check('a third, singular form', 'Sweet chestnut', true, true);
check('plain seeds, same real gap', 'Sunflower seeds', true, true);
check('tahini -- a real, simple ground-sesame product', 'Sesame paste, tahini', true, true);
check('a real, genuine collision found and avoided: "Macchiato" contains "chia" as a literal substring -- \'chia seed\' is kept as the full phrase specifically to avoid it', 'Macchiato, single', true, null);
check('a real composite plant-milk beverage is correctly excluded, a real, deliberately separate question this fix does not force an answer to', 'Almond based beverage', true, false);
check('a real composite candy/pastry using a nut as one ingredient among several', 'Chocolate-flavored hazelnut spread', true, false);
check('a real composite dish using a nut, "curried" needed as its own real word form alongside "curry"', 'Curried rice with almonds', true, false);
check('a real fruit-plus-nut combination -- scoped to the nut-specific disqualifier only, so a plain single-fruit compote (which never reaches this check) stays unaffected', 'Apple compote with raisins and almonds', true, false);
check('the real, plain single-fruit compote this fix must NOT touch', 'Compote, any type of fruit, low in sugar', true, true);

// --- A real, honest self-correction, caught only by testing every
// planned entry against the real function output: the first version of
// this same nut/seed list only had singular forms, missing the exact
// same real plural word-boundary gap this file has already documented
// multiple times this same pass. ---
check('the exact real record that caught the missing-plural mistake', 'Almonds', true, true);
check('"Nuts, almonds" (plural, comma-separated form)', 'Nuts, almonds', true, true);
check('a real, separate, genuinely new bug found along the way: "Bagels" (plural) was never matching BREAD_KEEP\'s own singular "bagel"', 'Bagels, plain, enriched, with calcium propionate (includes onion, poppy, sesame)', true, true);
check('"Tortillas" (plural), the same real gap', 'Tortillas', true, true);
check('a real, general composite-dessert/candy signal found along the way: real chocolate-and-filling candies, checked against every real currently-true record before adding', 'Pralines filled with almond-caramel', true, false);
check('marzipan, the same real "combination even in its raw-paste form" reasoning', 'Marzipan, 30 % almonds', true, false);
check('a real, flavored/compound spirit, the same real "Compound alcoholic beverage" family reached by a different name', 'Almond liqueur', true, false);
check('"cakes" (plural) now correctly excludes real manufactured rice cakes, the same real word-form fix already applied elsewhere this pass', 'Rice cakes, plain, low salt', true, false);

// --- Real, direct instruction: "a sunflower seed is a seed, so it
// should be kept as long as it isn't salted already or seasoned." Plus
// a real, genuine question about ratio uncertainty in mixed products. ---
check('the exact reported reversed-order record, now fixed properly rather than left as an accepted tradeoff', 'Seed, sunflower', true, true);
check('a real, salted seed is now correctly excluded, per direct instruction', 'Cashew nuts, salted', true, false);
check('"with salt added" is a real, separate phrase needed alongside bare "salted"', 'Seeds, sunflower seed kernels, oil roasted, with salt added', true, false);
check('"without salt"/"unsalted" must stay correctly unaffected -- checked directly that "salted"/"with salt" cannot false-positive on the negated form', 'Seeds, sesame seed kernels, toasted, without salt added (decorticated)', true, true);
check('"seasoned" is now a real, general exclude -- checked against every real record, zero "unseasoned" collision risk found anywhere', 'Peas, green, canned, seasoned, solids and liquids', true, false);
check('a real, genuine architectural bug found only by testing the new salt disqualifier against real data: a nut/seed match used to leak through an EARLIER-checked rule (here, OIL_KEEP\'s own bare "oil" match) that had no idea a disqualifier existed -- fixed with a real, dedicated early check, the same pattern already used for isAlcoholicCocktailOrCocktailSauce', 'Nuts, mixed nuts, oil roasted with peanuts', true, false);
check('the real, direct "how do you know how much of each is in the mix" question -- a mix of unknown-ratio whole foods is excluded regardless of whether it happens to be salted', 'Nuts, mixed nuts, dry roasted with peanuts', true, false);
check('a real, second instance of the same "mix" leak, found by checking the same principle more broadly once the first one turned up: SAFE_OVERRIDES\' own "dried fruit" phrase had no disqualifier of its own at all', 'Mixed nuts with dried fruit', true, false);
check('"Mixed dried fruit" -- the identical unknown-ratio problem, no nuts involved at all', 'Mixed dried fruit', true, false);
check('a real, second naming convention found for the same seed family: USDA writes "pumpkin AND squash seed(s)," which the plain "pumpkin seed" compound phrase does not match', 'Seeds, pumpkin and squash seed kernels, roasted, salted', true, false);
check('a real, third bug found live: fortification wrongly passing a composite cereal-type product via its own nut mention', 'Wheat petals with walnuts, hazelnuts or almonds, enriched with vitamins and minerals', true, false);
check('a real, confirmed nut brand found live', 'Nuts, mixed nuts, dry roasted, with peanuts, salt added, PLANTERS pistachio blend', true, false);
check('real strudel is now a general exclude, including the real records that say "strudel dough" rather than "pastry"', 'Viennese apple strudel (strudel dough)', true, false);
check('plain, unaffected nuts and seeds still pass -- the fix did not become over-broad', 'Almonds', true, true);
check('a real, deliberate, accepted 1-record exception remains, and is expected to: a genuinely reversed AND interrupted 3-word order this enumerable-phrase approach cannot safely reach', 'Sesame, hulled seed', true, null);

// --- Real, direct question, not a bug report: "Banana cooking banana
// are listed but they aren't designated as any specific cooking type of
// banana." Investigated directly, including checking the real, full
// raw_json for hidden species data -- confirmed the underlying Sweden
// source genuinely carries no scientific-name/LangualCodes data at all
// for this record, a real, honest limitation of the source itself, not a
// pipeline bug. No code change resulted from this investigation.

// --- Continued proactive scan: 'sugared' -- a real, direct signal of
// added sugar, distinct from 'sweetened', found completely unrecognized
// anywhere in this file. ---
check('a real, confirmed record that was wrongly true before this fix', 'Apple sauce/apple compote, sugared, canned', true, false);
check('a second real confirmed record, a different food entirely', 'Eggs, hen, whole, sugared', true, false);
check('"unsugared" must stay correctly unaffected -- no false-positive risk', 'Doughnuts, cake-type, plain (includes unsugared, old-fashioned)', true, false);

// --- Continued proactive scan: 'compote' -- an existing comment already
// stated a plain compote should be accepted, but nothing actually
// implemented it; over 30 real records were sitting unclassified. ---
check('a real, plain compote with no other qualifier at all', 'Pear compote', true, true);
check('a real, explicitly unsweetened compote', 'Blueberry compote unsweetened', true, true);
check('a real composite compote is still correctly excluded -- this fix did not become over-broad', 'Apple compote with vanilla sauce', true, false);
check('a real fruit-plus-nut compote is still correctly excluded via the existing, separate nut-specific disqualifier', 'Apple compote with raisins and almonds', true, false);
check('a real artificially-sweetened compote is still correctly excluded', 'Strawberry compote with artificial sweetener', true, false);

// --- Continued proactive scan: 'yogourt' (Canadian spelling) and
// 'yogurts' (plural) -- both real word forms missing from PLAIN_DAIRY_KEEP,
// leaving 78 real Canada_CNF records unclassified either way. ---
check('a real, plain Canadian-spelling yogourt record', 'Yogourt, plain, fat free (0-0.5% MF)', true, true);
check('a real, flavored Canadian-spelling yogourt record, now correctly excluded via the flavor check', 'Yogourt, fruit flavoured (2-3.9% M.F.)', true, false);
check('a real plain-form-soy yogourt, the soy variant of the same real spelling', 'Yogourt, soy, plain', true, true);
check('a real, plural "yogurts" record, previously bypassing the dairy check entirely', 'Frozen yogurts, flavors other than chocolate', true, false);

// --- Continued proactive scan: 'flavors'/'flavours' (plural noun) --
// distinct from the adjective 'flavored'/'flavoured' already recognized,
// with real, confirmed damage across dairy and fermented-food records. ---
check('a real, confirmed record wrongly true before this fix', 'Pickled herring different flavors', true, false);
check('a real, second confirmed record, a different ferment', 'Kefir, fruit flavours, low fat (0.5-1.9% M.F.)', true, false);
check('the real record that combines both this pass\'s new gaps at once', 'Babyfood, yogourt, fruit flavours, with added Vitamin D and DHA', true, false);

// --- Continued proactive scan: 'confection'/'confectionery' and real
// word-form variants -- a real candy/sweet-product signal missing
// entirely, with real confirmed damage across several unrelated foods. ---
check('a real Japan_MEXT confectionery record, wrongly true via "steamed"', 'Traditional confectionery, "Uiro" (steamed sweet rice dough)', true, false);
check('a real frozen-candy record, wrongly true via "milk"', 'Ice confection, stick, milk-based, various flavours', true, false);
check('a real industrial candy-fat oil, wrongly true via "butter"', 'Oil, industrial, palm kernel, confection fat, uses similar to high quality cocoa butter', true, false);
check('the real British-spelling variant, "confectionary"', 'Traditional confectionery, "Shiogama" (molded confectionary made from sugar, glutinous rice flour and perilla leaf powder)', true, false);

// --- Continued proactive scan: 'pizza', 'puddings' (plural), and
// 'formulated'/'simulated' -- real composite/manufactured-product
// signals with confirmed real damage. ---
check('a real, plain pizza record with no other exclude keyword nearby', 'Pizza, mozzarella and tomatoes, industrially made', true, false);
check('a real, plural "Puddings" record, the same recurring plural/word-boundary gap as "fast food"/"cereal"', 'Puddings, all flavors except chocolate, low calorie, regular, dry mix', true, false);
check('a real, wheat-based mock-nut product, wrongly true via "macadamia"', 'Nuts, formulated, wheat-based, all flavors except macadamia, without salt', true, false);
check('a real, second mock-nut record using the word "simulated" instead', 'Nuts, simulated product, wheat-based, unflavoured, with salt', true, false);
check('a real, unbranded manufactured snack bar, previously sitting unclassified', 'Formulated bar, POWER BAR, chocolate', true, false);

// --- Continued proactive scan: real, single-ingredient alcohol names
// missing from ALCOHOL_KEEP -- champagne, tequila, mezcal, maotai --
// plus the one real collision this required fixing first. ---
check('a real, plain champagne record', 'Champagne', true, true);
check('a real, traditional single-plant distilled spirit', 'Distilled alcoholic beverage, Maotai', true, true);
check('a real wine-based cocktail that had to be excluded first, so adding bare "champagne"/"wine" stays safe', 'Kir (with white wine)', true, false);
check('the champagne-based sibling of the same real cocktail, now correctly excluded rather than left unclassified', 'Kir royal (with champagne)', true, false);

// --- Continued proactive scan: NATURAL_SWEETENER_KEEP's own "mix
// leak" -- the same real class of bug already fixed twice for nuts/seeds
// and SAFE_OVERRIDES, found a third time. ---
check('a real composite breakfast dish, wrongly true via "honey" alone', 'Oats, rolled, mixed with sugar or honey & other flavours, uncooked', true, false);
check('a real composite dish, wrongly true via "honey" alone', 'Chicken pan with lime honey crème fraiche', true, false);
check('a real flavored yogurt, wrongly true via "honey" before the dairy check\'s own flavor logic ever ran', 'Yoghurt mild honey fat 2% enriched', true, false);
check('a real manufactured cracker, wrongly true via "honey"', 'Cracker, honey sesame', true, false);
check('a real, honest label fix: this now resolves via the correct alcohol rule instead of a misleading "natural_sweetener: agave" label', 'Agave spirit (Mezcal/Tequila)', true, true);
check('plain honey itself remains correctly unaffected by every one of the above disqualifiers', 'Honey', true, true);
check('plain maple syrup remains correctly unaffected', 'Maple syrup', true, true);

// --- Continued proactive scan: real cooking-method words missing
// entirely -- 'simmered', 'casseroled', 'sashimi', 'in brine'. ---
check('a real, plain simmered organ meat', 'Beef, heart, simmered', true, true);
check('a real, plain simmered fish', 'Cod, fillet, simmered', true, true);
check('a real, plain AFCD casseroled cut with no added fat', 'Chicken, breast, lean flesh, casseroled, no added fat', true, true);
check('AFCD\'s own real lab-sampling term "composite" does not mean a recipe combination', 'Chicken, skin, composite, casseroled, no added fat', true, true);
check('a real, plain raw sliced fish preparation', 'Sashimi, salmon', true, true);
check('a real, traditional brine-preserved food, the same category as pickled', 'Lobster tail, in brine, drained', true, true);

// --- Continued proactive scan: real, narrow wheat-gluten keywords --
// deliberately NOT bare 'gluten', which collides with "gluten-free." ---
check('a real, plain wheat-gluten extract', 'Vital wheat gluten', true, true);
check('a real, traditional East Asian wheat-gluten food in its own right', 'Seitan, wheat gluten', true, true);
check('a real, differently-phrased plain wheat-gluten record', 'Gluten (from wheat)', true, true);
check('the real, serious collision this fix deliberately avoids: bare "gluten" would have wrongly matched every branded gluten-FREE product', "Andrea's, Gluten Free Soft Dinner Roll", true, null);
check('a second, real confirmed gluten-free branded product, also correctly unaffected', 'Crunchmaster, Multi-Grain Crisps, Snack Crackers, Gluten-Free', true, null);

// --- Continued proactive scan: real plural/word-order gaps -- 'ice
// creams', 'chewing gum' (natural order), plus 'ketchup'/'vitamin
// water' as real, standalone manufactured-product signals. ---
check('a real, confirmed record wrongly true via a coincidental "no sugar added" substring match', 'Ice creams, vanilla, light, no sugar added', true, false);
check('a real, natural-word-order chewing gum record, the reversed comma form never matched', 'Chewing gum, with sugar', true, false);
check('bare "Chewing gum," previously sitting unclassified', 'Chewing gum', true, false);
check('a real, standalone manufactured condiment', 'Ketchup', true, false);
check('a real, standalone fortified/flavored beverage, previously sitting unclassified since only the sweetened variant was caught', 'Vitamin water, all flavours, low Calorie', true, false);

// --- Continued proactive scan: 'ready-made', promoted general
// 'smoothie', and the new general bare 'sauce' exclude (with its own
// real, verified exception list). ---
check('a real, explicit "ready-made" signal, wrongly true via a coincidental "cream" match', 'Salad cream (ready-made product)', true, false);
check('a real, second ready-made record, previously sitting unclassified', 'Remoulade (ready-made product)', true, false);
check('a real, confirmed unknown-ratio fruit mix, wrongly true via a coincidental "frozen" match', 'Smoothie mix, pineapple, mango and banana, frozen', true, false);
check('a real, bare smoothie record, previously sitting unclassified', 'Smoothie, mango and orange', true, false);
check('a real, confirmed composite sauce, wrongly true via a coincidental "butter" match', 'White butter sauce, prepackaged', true, false);
check('a real, second confirmed composite sauce, wrongly true via a coincidental "cheese" match', 'Cheese sauce for risotto or pasta, prepackaged', true, false);
check('a real, leading-form "Sauce, X" record, previously sitting unclassified since the existing IN_OR_WITH_SAUCE_PATTERN only catches the trailing "with/in X sauce" form', 'Sauce, plum, ready-to-serve', true, false);
check('a real, genuine multi-ingredient blend correctly stays excluded, not excepted', 'Worcestershire sauce', true, false);
check('the real, verified exception: a plain, single-fruit apple sauce is the same real category as compote', 'Apple sauce, canned, unsweetened', true, true);
check('a real, second verified exception: soy sauce is a real, traditional single-process fermented condiment, the same category as miso/tempeh', 'Soy sauce made from soy and wheat (shoyu)', true, true);
check('a real composite dish that merely CONTAINS soy sauce as one ingredient is still correctly excluded, not swept in by the new exception', 'Fish, Japanese sand lance, "Tsukudani" (simmered whole in soy sauce and sugar)', true, false);
check('a third real verified exception: fish sauce, the same traditional fermented-condiment category', 'Fish sauce', true, true);

// --- Continued proactive scan: 'peppermint'/'spearmint', neither
// bound-matched by the existing bare 'mint'. ---
check('a real, bare spearmint record with no cooking-state qualifier at all', 'Spearmint leaves', true, true);
check('a real herbal tea made from an accepted herb', 'Peppermint tea (infusion)', true, true);
check('a real composite candy correctly stays excluded, not wrongly swept in by the new peppermint keyword', 'Peppermint creams', true, false);

// --- Continued proactive scan: a real, disqualified burger/hamburger
// leak, the same shape already fixed for nuts/seeds. ---
check('a real, confirmed composite burger, wrongly true via a coincidental "bread" match', 'Chicken burger with bread accessories', true, false);
check('a real, second confirmed composite burger, using the abbreviated "w." form of "with"', 'Hamburger double w. bread cheese pickled cucumber cooked in a restaurant', true, false);
check('a real, plain ground-beef record must stay correctly unaffected -- this is Norway\'s own real naming convention, not a sandwich', 'Hamburger, raw', true, true);
check('the plain bun component on its own must also stay correctly unaffected', 'Hamburger bread', true, true);

// --- Continued proactive scan: a real tofu-dumpling leak, the same
// shape already fixed for nuts/seeds and natural sweeteners. ---
check('a real composite dumpling, wrongly true via bare "tofu"', 'Tofu dumpling (not suitable for vegans), prepackaged', true, false);
check('plain tofu itself remains correctly unaffected by the new dumpling disqualifier', 'Tofu, firm, prepared with calcium sulfate and magnesium chloride (nigari)', true, true);

// --- Continued proactive scan: a real, second plural gap found only by
// spot-checking the new bare 'sauce' fix's own real results -- 'stock'
// (broth), a real, derived, extracted liquid, never a raw ingredient. ---
check('a real, plain chicken stock, previously sitting unclassified', 'Chicken stock', true, false);
check('a real, confirmed record wrongly true via a coincidental "canned" match', 'Beef stock canned', true, false);
check('a real, plural "sauces" record this same fix also incidentally catches via "stock" itself', 'Veal stock for sauces and cooking, dehydrated', true, false);

// --- Continued proactive scan: a real hyphen/space gap on the existing
// 'sugar coated' exclude. ---
check('a real, confirmed candied-nut record, wrongly true via a coincidental "almond" match -- the hyphenated spelling was never checked', 'Almond roasted, sugar-coated', true, false);
check('the same real gap, a second nut', 'Peanut roasted, sugar-coated', true, false);
check('the existing space-form spelling stays correctly unaffected', 'Candies, sugar-coated almonds', true, false);

// --- Continued proactive scan: real 'gravy'/'filling' composite-dish
// gaps, and 'alternative'/'substitute' as general manufactured-product
// signals, all found while following a real "Soy protein kebab frozen
// product type Oumph®" report into its full scope. ---
check('a real, confirmed dry gravy mix, wrongly true via a coincidental "dry" match', 'Gravy, instant turkey, dry', true, false);
check('a real, second confirmed gravy record, wrongly true via a coincidental "canned" match', 'Gravy, chicken, canned or bottled, ready-to-serve', true, false);
check('a real composite dish built on gravy, wrongly true via a coincidental "frozen" match', 'Salisbury steak with gravy, frozen', true, false);
check('a real, general "meat alternative" manufactured-product record, wrongly true via a coincidental "cooked" match', 'Meat alternative, protein (soy/wheat/pea) base, cooked', true, false);
check('a real "meat substitute" record, the same real concept, a different word', 'Meat substitute containing gluten, milk and soya', true, false);
check('a real dairy-free cheese alternative, wrongly true via a coincidental "cheese" match', 'Cheese alternative Mozzarella style, vegan', true, false);
check('a real manufactured cream substitute, wrongly true via a coincidental "cream"/vegetable-fat match', 'Cream substitute, vegetable fat', true, false);
check('a real manufactured egg substitute, wrongly true via a coincidental "frozen" match', 'Egg substitute, frozen (yolk replaced)', true, false);
check('a real chemical salt substitute, not the real thing this database already keeps elsewhere', 'Salt substitute, potassium chloride', true, false);
check('a real, honest, small judgment call: fish roe marketed as a caviar substitute moves from needs-review to a confident false', 'Caviar substitute (lumpfish)', true, false);
check('a real, stuffed-pasta record, wrongly true via a coincidental "raw" match -- the general "filling" signal was never checked', 'Fresh egg pasta Ravioli (meat filling) raw', true, false);
check('a real, stuffed-vegetable record, wrongly true via a coincidental "cheese" match', 'Cauliflower with minced meat filling and cheese gratinated', true, false);
check('the real, dedicated guard: a record explicitly stating it has NO filling must not be excluded for that reason', 'Cream puff, plain, no filling', true, true);

// --- Continued proactive scan: the wider real branded/manufactured
// soy-protein and mycoprotein meat-analog family, found by following the
// original Oumph® report to its real, full scope. ---
check('the real record the original report was found alongside: a branded soy-protein product, wrongly true via a coincidental "frozen" match', 'Soy protein kebab frozen product type Oumph®', true, false);
check('a real sibling record in the same branded family', 'Soy protein pieces with thyme garlic frozen product type Oumph®', true, false);
check('a real, general "nugget" manufactured-food-form signal, wrongly true via a coincidental "oven-roasted" match', 'Soy protein nugget oven-roasted', true, false);
check('the same real signal, the mycoprotein variant', 'Mycoprotein nugget refrigerator el. frozen food', true, false);
check('a real, deliberate, narrow exception: "golden nugget" is a real, named winter-squash variety, not a food form', 'Pumpkin, golden nugget, peeled, fresh, raw', true, true);
check('the real plural-form gap on the new "nugget" keyword itself, the same recurring lesson as "ice cream"/"ice creams"', 'Chicken nuggets, dark and white meat, pre-cooked, frozen, not heated', true, false);
check('a real, general "mycoprotein" exclude -- industrially fermented, never a traditional whole food regardless of shape', 'Mycoprotein schnitzel refrigerator el. frozen food', true, false);
check('bare "Mycoprotein" itself, the base ingredient, is also correctly excluded for the same real reason', 'Mycoprotein', true, false);
check('a real, legitimate meat cut correctly stays unaffected -- "schnitzel" itself is a real cut name, not a food form', 'Pork schnitzel (thick flank) raw', true, true);
check('a real "soy and wheat protein" branded meat-analog family, wrongly true via a coincidental "oven-roasted" match', 'Soy and wheat protein schnitzel oven-roasted', true, false);
check('the one real remaining straggler this whole family left behind, closed with its own narrow, exact phrase', 'Soy protein buns refrigerator el. frozen food', true, false);
check('bare "soy protein" itself stays deliberately unresolved -- the real isolate/concentrate ingredient records are genuinely ambiguous, not force-classified either way', 'Soy protein isolate', true, null);

// --- Continued proactive scan: a real, general 'pancake'/'pancakes'
// exclude, generalizing a real judgment already made narrowly for the
// honey-disqualifier list. ---
check('a real, confirmed pancake dry mix, wrongly true via a coincidental "buttermilk" match', 'Pancake, plain (includes buttermilk), dry mix, complete, prepared with water', true, false);
check('the same real gap, the plural form -- \\bpancake\\b does not bound-match "pancakes"', 'Pancakes, whole wheat, dry mix, incomplete', true, false);
check('a real, plain homemade pancake is also correctly excluded, not just the dry-mix form', 'Pancake, buttermilk, homemade', true, false);

// --- Ambiguous / non-English: must NOT guess ---
check('genuinely ambiguous name, no rule fires', 'Xyzzy prepared item 42', true, null);
check('no English evidence at all (Norwegian, untranslated)', 'Agurk, norsk, rå', false, null);

console.log('');
console.log(`${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
