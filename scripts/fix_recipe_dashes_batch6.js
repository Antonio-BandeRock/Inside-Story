const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'lib', 'digest', 'recipes.ts');
let text = fs.readFileSync(FILE, 'utf8');

const pairs = [
  // Shared substring across both sauce recipes with a "week or more" yield line
  ["A real batch sauce meant to cover 2 people\\'s meals for a week or more.',",
   "A batch sauce meant to cover 2 people\\'s meals for a week or more.',"],

  // Basic Tomato Sauce
  ["teaser: 'A simple, real tomato sauce built from scratch.',",
   "teaser: 'A simple tomato sauce built from scratch.',"],
  ["yield: 'Makes about 3 cups. A real batch condiment meant to cover 2 people over multiple meals.',",
   "yield: 'Makes about 3 cups. A batch condiment meant to cover 2 people over multiple meals.',"],
  ["'Add the garlic and cook for another minute, just until fragrant -- garlic burns quickly, so don\\'t walk away here.',",
   "'Add the garlic and cook for another minute, just until fragrant. Garlic burns quickly, so don\\'t walk away here.',"],
  ["'Let it simmer uncovered for 25-30 minutes, stirring occasionally, until it\\'s reduced and thickened to a real sauce consistency.',",
   "'Let it simmer uncovered for 25-30 minutes, stirring occasionally, until it\\'s reduced and thickened to a proper sauce consistency.',"],
  ["flavorNotes: 'Bright, real tomato flavor with a genuine sweetness that develops as it simmers and reduces, rounded out by garlic and fresh basil at the end. This is closer to a real Italian nonna\\'s weeknight sauce than a jarred version -- simple, honest, and genuinely versatile.',",
   "flavorNotes: 'Bright tomato flavor with a natural sweetness that develops as it simmers and reduces, rounded out by garlic and fresh basil at the end. This is closer to an Italian nonna\\'s weeknight sauce than a jarred version: simple, honest, and versatile.',"],

  // Garlic Herb Vinaigrette
  ["teaser: 'A real, whisked-from-scratch salad dressing.',",
   "teaser: 'A whisked-from-scratch salad dressing.',"],
  ["summary: 'Mustard genuinely acts as a real emulsifier here, helping the oil and vinegar stay combined instead of separating the way a plain oil-and-vinegar dressing does.',",
   "summary: 'Mustard acts as an emulsifier here, helping the oil and vinegar stay combined instead of separating the way a plain oil-and-vinegar dressing does.',"],
  ["yield: 'Makes about 1 cup. A real batch dressing meant to cover 2 people\\'s salads for a week or more.',",
   "yield: 'Makes about 1 cup. A batch dressing meant to cover 2 people\\'s salads for a week or more.',"],
  ["flavorNotes: 'Sharp and tangy from the balsamic, mellowed by real garlic and a touch of mustard, this coats a salad without drowning it. A genuinely useful, all-purpose dressing worth keeping stocked in the fridge.',",
   "flavorNotes: 'Sharp and tangy from the balsamic, mellowed by garlic and a touch of mustard, this coats a salad without drowning it. A genuinely useful, all-purpose dressing worth keeping stocked in the fridge.',"],

  // Simple Pesto
  ["teaser: 'Fresh basil, pine nuts, and real Parmesan, blended together.',",
   "teaser: 'Fresh basil, pine nuts, and Parmesan, blended together.',"],
  ["summary: 'Fresh basil is a real, concentrated source of vitamin K, and this whole sauce is built around it rather than the small amount most dishes get from a garnish sprig.',",
   "summary: 'Fresh basil is a concentrated source of vitamin K, and this whole sauce is built around it rather than the small amount most dishes get from a garnish sprig.',"],
  ["{ nutrient: 'Vitamin K', note: 'A real 72-97% of a day\\'s worth per 2-tablespoon serving.' },",
   "{ nutrient: 'Vitamin K', note: 'A striking 72-97% of a day\\'s worth per 2-tablespoon serving.' },"],
  ["note: 'Pine nuts carry a real, elevated oxalate load. Pairing pesto-topped dishes with a calcium source (the Parmesan already in this recipe helps some) is a real way to offset it if oxalate is a concern for you.' },",
   "note: 'Pine nuts carry a notably elevated oxalate load. Pairing pesto-topped dishes with a calcium source (the Parmesan already in this recipe helps some) is one way to offset it if oxalate is a concern for you.' },"],
  ["flavorNotes: 'Bright, herbaceous, and genuinely garlicky, with a real nutty richness from the pine nuts and a savory, salty finish from the Parmesan. This tastes distinctly fresher and more vivid than a jarred pesto that\\'s been sitting on a shelf.',",
   "flavorNotes: 'Bright, herbaceous, and properly garlicky, with a rich nuttiness from the pine nuts and a savory, salty finish from the Parmesan. This tastes distinctly fresher and more vivid than a jarred pesto that\\'s been sitting on a shelf.',"],

  // Tahini Lemon Sauce
  ["teaser: 'A creamy, nutty sauce built on real sesame paste.',",
   "teaser: 'A creamy, nutty sauce built on sesame paste.',"],
  ["summary: 'Tahini is a real, concentrated source of zinc and magnesium, both minerals many people don\\'t get enough of.',",
   "summary: 'Tahini is a concentrated source of zinc and magnesium, both minerals many people don\\'t get enough of.',"],
  ["'Whisk together -- it will look like it\\'s seizing up and getting thick and clumpy at first, which is normal.',",
   "'Whisk together. It will look like it\\'s seizing up and getting thick and clumpy at first, which is normal.',"],
  ["flavorNotes: 'Nutty and rich from the tahini, cut through with real bright lemon acidity and a little bite from the garlic -- a real, versatile sauce that works equally well drizzled over roasted vegetables, a grain bowl, or falafel.',",
   "flavorNotes: 'Nutty and rich from the tahini, cut through with bright lemon acidity and a little bite from the garlic: a versatile sauce that works equally well drizzled over roasted vegetables, a grain bowl, or falafel.',"],
];

let missing = [];
for (const [oldStr, newStr] of pairs) {
  if (!text.includes(oldStr)) { missing.push(oldStr.slice(0, 70)); continue; }
  text = text.split(oldStr).join(newStr);
}
fs.writeFileSync(FILE, text, 'utf8');
if (missing.length) { console.log('MISSING (not found):'); missing.forEach(m => console.log(' -', m)); }
else console.log('All', pairs.length, 'replacements applied.');
