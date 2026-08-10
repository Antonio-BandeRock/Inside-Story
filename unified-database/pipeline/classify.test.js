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

// --- Ambiguous / non-English: must NOT guess ---
check('genuinely ambiguous name, no rule fires', 'Xyzzy prepared item 42', true, null);
check('no English evidence at all (Norwegian, untranslated)', 'Agurk, norsk, rå', false, null);

console.log('');
console.log(`${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
