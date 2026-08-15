const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'lib', 'digest', 'recipes.ts');
let text = fs.readFileSync(FILE, 'utf8');

const pairs = [
  // Beverages
  ["yield: 'Makes about 4 cups. This is a pitcher-style drink -- brew the whole batch and keep it in the fridge, plenty for 2 people across a couple of days.',",
   "yield: 'Makes about 4 cups. This is a pitcher-style drink, so brew the whole batch and keep it in the fridge, plenty for 2 people across a couple of days.',"],
  ["{ nutrient: 'Vitamin C', note: 'A modest but real 5-6% of a day\\'s target per cup, from the fresh lemon juice.' },",
   "{ nutrient: 'Vitamin C', note: 'A modest 5-6% of a day\\'s target per cup, from the fresh lemon juice.' },"],
  ["teaser: 'A real, simple homemade alternative to bottled sports drinks.',",
   "teaser: 'A simple homemade alternative to bottled sports drinks.',"],
  ["summary: 'Most commercial electrolyte drinks are built around added dyes and a lot of sugar -- this is the same real sodium-plus-fluid idea without either.',",
   "summary: 'Most commercial electrolyte drinks are built around added dyes and a lot of sugar. This is the same sodium-plus-fluid idea without either.',"],
  ["yield: 'Makes about 4 cups (1000ml), 2 real 2-cup glasses -- one for each person.',",
   "yield: 'Makes about 4 cups (1000ml), 2 2-cup glasses, one for each person.',"],
  ["{ nutrient: 'Vitamin C', note: 'About 18-22% of a day\\'s worth per glass, from the real lemon juice.' },",
   "{ nutrient: 'Vitamin C', note: 'About 18-22% of a day\\'s worth per glass, from the lemon juice.' },"],
  ["flavorNotes: 'This tastes like a light, gently salty lemonade -- refreshing rather than sweet, with the salt working in the background to make it genuinely thirst-quenching rather than just sugary.',",
   "flavorNotes: 'This tastes like a light, gently salty lemonade, refreshing rather than sweet, with the salt working in the background to make it thirst-quenching rather than just sugary.',"],
  ["yield: 'Makes about 4 cups. A pitcher-style drink -- brew it once, keep it cold, and it\\'ll cover 2 people for a couple of days.',",
   "yield: 'Makes about 4 cups. A pitcher-style drink: brew it once, keep it cold, and it\\'ll cover 2 people for a couple of days.',"],
  ["flavorNotes: 'Cold, lightly grassy green tea with a genuine cooling lift from fresh mint -- crisp and clean rather than sweet, closer to a real herbal refresher than a soft drink.',",
   "flavorNotes: 'Cold, lightly grassy green tea with a cooling lift from fresh mint, crisp and clean rather than sweet, closer to a herbal refresher than a soft drink.',"],
  ["yield: 'Makes about 2½ cups, 2 real mugs -- one for each person.',",
   "yield: 'Makes about 2½ cups, 2 mugs, one for each person.',"],
  ["'Warm the milk in a small pot over medium-low heat -- don\\'t let it come to a full boil.',",
   "'Warm the milk in a small pot over medium-low heat. Don\\'t let it come to a full boil.',"],
  ["flavorNotes: 'This drinks like a warm, spiced dessert -- earthy turmeric, sweet cinnamon, a gentle honey sweetness, and just enough black pepper in the background to add real warmth without any actual heat. Closer to a comfort drink than a health shot.',",
   "flavorNotes: 'This drinks like a warm, spiced dessert: earthy turmeric, sweet cinnamon, a gentle honey sweetness, and just enough black pepper in the background to add warmth without any actual heat. Closer to a comfort drink than a health shot.',"],
];

let missing = [];
for (const [oldStr, newStr] of pairs) {
  if (!text.includes(oldStr)) { missing.push(oldStr.slice(0, 60)); continue; }
  text = text.split(oldStr).join(newStr);
}
fs.writeFileSync(FILE, text, 'utf8');
if (missing.length) { console.log('MISSING (not found):'); missing.forEach(m => console.log(' -', m)); }
else console.log('All', pairs.length, 'replacements applied.');
