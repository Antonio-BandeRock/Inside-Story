const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'lib', 'digest', 'recipes.ts');
let text = fs.readFileSync(FILE, 'utf8');

const pairs = [
  // Shared yield trailer across the two batch/pantry snacks
  ["A real batch snack meant to last 2 people several days.',",
   "A batch snack meant to last 2 people several days.',"],

  // Roasted Chickpeas
  ["teaser: 'A crunchy, savory, real whole-food snack.',",
   "teaser: 'A crunchy, savory whole-food snack.',"],
  ["summary: 'Roasting chickpeas turns them into a genuinely crunchy, chip-like snack while keeping the real fiber and protein a bag of chips doesn\\'t have.',",
   "summary: 'Roasting chickpeas turns them into a genuinely crunchy, chip-like snack while keeping the fiber and protein a bag of chips doesn\\'t have.',"],
  ["'Pat the drained chickpeas dry with a clean towel -- getting them genuinely dry is what makes them crisp up in the oven instead of steaming.',",
   "'Pat the drained chickpeas dry with a clean towel. Getting them properly dry is what makes them crisp up in the oven instead of steaming.',"],
  ["'Let them cool completely before eating -- they continue to crisp up as they cool, and they soften again once stored, so eat them the same day for the best crunch.',",
   "'Let them cool completely before eating. They continue to crisp up as they cool, and they soften again once stored, so eat them the same day for the best crunch.',"],
  ["flavorNotes: 'Genuinely crunchy and savory with a real smoky warmth from the paprika, this is a satisfying stand-in for chips or crackers with a lot more staying power in your stomach.',",
   "flavorNotes: 'Genuinely crunchy and savory with a smoky warmth from the paprika, this is a satisfying stand-in for chips or crackers with a lot more staying power in your stomach.',"],

  // Simple Trail Mix
  ["teaser: 'A real, no-added-sugar mix of nuts, seeds, and dried fruit.',",
   "teaser: 'A no-added-sugar mix of nuts, seeds, and dried fruit.',"],
  ["summary: 'Combining nuts, seeds, and dried fruit means real fat, protein, and natural sugar together, which digests more slowly than dried fruit eaten alone.',",
   "summary: 'Combining nuts, seeds, and dried fruit means fat, protein, and natural sugar together, which digests more slowly than dried fruit eaten alone.',"],
  ["'Store in a sealed container -- it keeps well for a couple of weeks at room temperature.',",
   "'Store in a sealed container. It keeps well for a couple of weeks at room temperature.',"],
  ["note: 'Both almonds and walnuts carry a real, elevated oxalate load. If oxalate is something you\\'re watching, keeping portions moderate and pairing this snack with a calcium source helps offset it.' },",
   "note: 'Both almonds and walnuts carry a notably elevated oxalate load. If oxalate is something you\\'re watching, keeping portions moderate and pairing this snack with a calcium source helps offset it.' },"],
  ["flavorNotes: 'A real, classic mix of crunchy nuts, seeds, and chewy sweetness from the raisins -- genuinely satisfying and portable, without any added sugar coating or chocolate to distract from the real ingredients themselves.',",
   "flavorNotes: 'A classic mix of crunchy nuts, seeds, and chewy sweetness from the raisins, genuinely satisfying and portable, without any added sugar coating or chocolate to distract from the ingredients themselves.',"],

  // Apple Slices with Almond Butter
  ["teaser: 'A real, simple, protein-paired fruit snack.',",
   "teaser: 'A simple, protein-paired fruit snack.',"],
  ["summary: 'Pairing a carbohydrate-rich fruit like apple with almond butter\\'s real fat and protein genuinely slows down how fast the fruit\\'s sugar hits your bloodstream.',",
   "summary: 'Pairing a carbohydrate-rich fruit like apple with almond butter\\'s fat and protein noticeably slows down how fast the fruit\\'s sugar hits your bloodstream.',"],
  ["yield: 'Makes 2 real servings -- 1 apple\\'s worth per person.',",
   "yield: 'Makes 2 servings, 1 apple\\'s worth per person.',"],
  ["{ nutrient: 'Manganese', note: 'A real 37-48% of a day\\'s worth per serving.' },",
   "{ nutrient: 'Manganese', note: 'A solid 37-48% of a day\\'s worth per serving.' },"],
  ["note: 'Almond butter carries a real, elevated oxalate load. If that\\'s something you\\'re watching, keeping the portion moderate and pairing it with a calcium source at the same meal helps offset it.' },",
   "note: 'Almond butter carries a notably elevated oxalate load. If that\\'s something you\\'re watching, keeping the portion moderate and pairing it with a calcium source at the same meal helps offset it.' },"],
  ["flavorNotes: 'Crisp, sweet apple against creamy, nutty almond butter, with a warm hit of cinnamon over the top -- a genuinely simple snack that still feels like a real treat.',",
   "flavorNotes: 'Crisp, sweet apple against creamy, nutty almond butter, with a warm hit of cinnamon over the top: a genuinely simple snack that still feels like a treat.',"],

  // Berries with Greek Yogurt
  ["teaser: 'A real, protein-rich fruit and yogurt bowl.',",
   "teaser: 'A protein-rich fruit and yogurt bowl.',"],
  ["summary: 'Greek yogurt is strained further than regular yogurt, which concentrates its real protein content noticeably higher per serving.',",
   "summary: 'Greek yogurt is strained further than regular yogurt, which concentrates its protein content noticeably higher per serving.',"],
  ["yield: 'Makes 2 real bowls -- 1 per person.',",
   "yield: 'Makes 2 bowls, 1 per person.',"],
  ["{ nutrient: 'Vitamin C', note: 'A real 59-71% of a day\\'s worth per bowl.' },",
   "{ nutrient: 'Vitamin C', note: 'A solid 59-71% of a day\\'s worth per bowl.' },"],
  ["flavorNotes: 'Cool, creamy, and tangy from the Greek yogurt, sweetened just enough by the honey and the berries themselves -- a genuinely satisfying snack that reads more like a dessert than a health food.',",
   "flavorNotes: 'Cool, creamy, and tangy from the Greek yogurt, sweetened just enough by the honey and the berries themselves: a genuinely satisfying snack that reads more like a dessert than a health food.',"],
];

let missing = [];
for (const [oldStr, newStr] of pairs) {
  if (!text.includes(oldStr)) { missing.push(oldStr.slice(0, 70)); continue; }
  text = text.split(oldStr).join(newStr);
}
fs.writeFileSync(FILE, text, 'utf8');
if (missing.length) { console.log('MISSING (not found):'); missing.forEach(m => console.log(' -', m)); }
else console.log('All', pairs.length, 'replacements applied.');
