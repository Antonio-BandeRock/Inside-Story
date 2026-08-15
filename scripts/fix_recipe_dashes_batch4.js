const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'lib', 'digest', 'recipes.ts');
let text = fs.readFileSync(FILE, 'utf8');

const pairs = [
  // Handhelds
  ["teaser: 'A lean, protein-forward wrap built around real sliced turkey.',",
   "teaser: 'A lean, protein-forward wrap built around sliced turkey.',"],
  ["summary: 'Turkey breast is one of the leanest common protein sources available, delivering real protein and B vitamins without much saturated fat.',",
   "summary: 'Turkey breast is one of the leanest common protein sources available, delivering protein and B vitamins without much saturated fat.',"],
  ["yield: 'Makes 2 wraps -- 1 real wrap per person.',",
   "yield: 'Makes 2 wraps, 1 wrap per person.',"],
  ["note: 'A real 76-87% of a day\\'s worth per wrap, mostly from the turkey.' },",
   "note: 'A striking 76-87% of a day\\'s worth per wrap, mostly from the turkey.' },"],
  ["flavorNotes: 'Fresh, clean, and satisfying -- lean turkey and creamy avocado against crisp lettuce and juicy tomato, all wrapped up in a soft tortilla. This is straightforward, deli-counter-quality flavor with nothing to hide behind.',",
   "flavorNotes: 'Fresh, clean, and satisfying: lean turkey and creamy avocado against crisp lettuce and juicy tomato, all wrapped up in a soft tortilla. This is straightforward, deli-counter-quality flavor with nothing to hide behind.',"],
  ["teaser: 'A real grilled chicken breast on whole-grain bread.',",
   "teaser: 'A grilled chicken breast on whole-grain bread.',"],
  ["summary: 'Grilling chicken breast at high, dry heat produces measurably more real advanced glycation end-products than gentler cooking methods, worth knowing if you eat grilled meat often, without meaning you need to avoid grilling altogether.',",
   "summary: 'Grilling chicken breast at high, dry heat produces measurably more advanced glycation end-products than gentler cooking methods, worth knowing if you eat grilled meat often, without meaning you need to avoid grilling altogether.',"],
  ["yield: 'Makes 2 sandwiches -- 1 real sandwich per person.',",
   "yield: 'Makes 2 sandwiches, 1 sandwich per person.',"],
  ["'Let the chicken rest for 5 minutes before slicing -- this keeps it juicy rather than letting the juices run out the moment you cut it.',",
   "'Let the chicken rest for 5 minutes before slicing. This keeps it juicy rather than letting the juices run out the moment you cut it.',"],
  ["note: 'This uses real whole-grain bread, so it carries gluten as written. Swapping in a real gluten-free sandwich bread works directly in this same recipe.' },",
   "note: 'This uses whole-grain bread, so it carries gluten as written. Swapping in a gluten-free sandwich bread works directly in this same recipe.' },"],
  ["flavorNotes: 'Smoky, charred edges on the chicken from the grill, layered with creamy avocado and fresh, juicy tomato -- a real, hearty sandwich that eats more like a meal than a snack.',",
   "flavorNotes: 'Smoky, charred edges on the chicken from the grill, layered with creamy avocado and fresh, juicy tomato: a hearty sandwich that eats more like a meal than a snack.',"],
  ["summary: 'Sweet potato\\'s own orange color comes from beta-carotene, which the body converts into real vitamin A.',",
   "summary: 'Sweet potato\\'s own orange color comes from beta-carotene, which the body converts into vitamin A.',"],
  ["yield: 'Makes 2 tacos -- 1 real taco per person.',",
   "yield: 'Makes 2 tacos, 1 taco per person.',"],
  ["note: 'A real 81-104% of a day\\'s worth per serving, from the sweet potato.' },",
   "note: 'A striking 81-104% of a day\\'s worth per serving, from the sweet potato.' },"],
  ["note: 'Black beans carry a real amount of fermentable fiber that some people with an already-sensitive gut find harder to digest. If that\\'s you, a smaller portion of beans, or swapping in a well-rinsed canned bean (which reduces some of the fermentable content), can make this easier on the gut.' },",
   "note: 'Black beans carry a fair amount of fermentable fiber that some people with an already-sensitive gut find harder to digest. If that\\'s you, a smaller portion of beans, or swapping in a well-rinsed canned bean (which reduces some of the fermentable content), can make this easier on the gut.' },"],
  ["note: 'Sweet potato carries a genuinely elevated oxalate content. Pairing it with a calcium source at the same meal helps offset it if that\\'s something you\\'re watching.' },",
   "note: 'Sweet potato carries a notably elevated oxalate content. Pairing it with a calcium source at the same meal helps offset it if that\\'s something you\\'re watching.' },"],
  ["flavorNotes: 'Sweet, caramelized roasted sweet potato against the earthiness of black beans, brightened by fresh lime and cilantro -- a real, satisfying vegetarian taco with genuine textural contrast between the soft filling and the creamy avocado on top.',",
   "flavorNotes: 'Sweet, caramelized roasted sweet potato against the earthiness of black beans, brightened by fresh lime and cilantro: a satisfying vegetarian taco with a real textural contrast between the soft filling and the creamy avocado on top.',"],
  ["teaser: 'A real, low-carb take on classic egg salad.',",
   "teaser: 'A low-carb take on classic egg salad.',"],
  ["summary: 'Egg yolks are one of the most concentrated real food sources of choline, a nutrient most people don\\'t get enough of.',",
   "summary: 'Egg yolks are one of the most concentrated food sources of choline, a nutrient most people don\\'t get enough of.',"],
  ["note: 'A real 54-71% of a day\\'s worth per wrap, mostly from the egg yolks.' },",
   "note: 'A solid 54-71% of a day\\'s worth per wrap, mostly from the egg yolks.' },"],
  ["flavorNotes: 'Creamy, savory egg salad with a little tang from the mustard and a genuine crunch from the celery, wrapped in cool, crisp lettuce instead of bread -- lighter than a sandwich but every bit as filling.',",
   "flavorNotes: 'Creamy, savory egg salad with a little tang from the mustard and a good crunch from the celery, wrapped in cool, crisp lettuce instead of bread. Lighter than a sandwich but every bit as filling.',"],
];

let missing = [];
for (const [oldStr, newStr] of pairs) {
  if (!text.includes(oldStr)) { missing.push(oldStr.slice(0, 70)); continue; }
  text = text.split(oldStr).join(newStr);
}
fs.writeFileSync(FILE, text, 'utf8');
if (missing.length) { console.log('MISSING (not found):'); missing.forEach(m => console.log(' -', m)); }
else console.log('All', pairs.length, 'replacements applied.');
