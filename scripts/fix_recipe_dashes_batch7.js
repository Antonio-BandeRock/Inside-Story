const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'lib', 'digest', 'recipes.ts');
let text = fs.readFileSync(FILE, 'utf8');

const pairs = [
  // Shared yield line across 4 of the 5 sides
  ["yield: 'Makes about 2 cups, 2 real 1-cup servings.',",
   "yield: 'Makes about 2 cups, 2 1-cup servings.',"],

  // Herb-Roasted Root Vegetable Medley
  ["summary: 'Potassium and vitamin C from the potato and sweet potato alike (especially with skins left on), plus real beta-carotene from the sweet potato specifically, a genuinely different nutrient profile than potato alone.',",
   "summary: 'Potassium and vitamin C from the potato and sweet potato alike (especially with skins left on), plus beta-carotene from the sweet potato specifically, a different nutrient profile than potato alone.',"],
  ["'Spread the vegetables in a single layer on a baking sheet -- crowding them will make them steam instead of roast, so use two sheets if needed.',",
   "'Spread the vegetables in a single layer on a baking sheet. Crowding them will make them steam instead of roast, so use two sheets if needed.',"],
  ["note: 'Sweet potato carries a genuinely elevated oxalate content. Pairing this side with a calcium-containing dish at the same meal helps offset it if that\\'s something you\\'re watching.' },",
   "note: 'Sweet potato carries a notably elevated oxalate content. Pairing this side with a calcium-containing dish at the same meal helps offset it if that\\'s something you\\'re watching.' },"],
  ["flavorNotes: 'Crispy, caramelized edges on the outside with a soft, tender bite inside, seasoned simply with rosemary and garlic -- a real, comforting side that goes with almost anything.',",
   "flavorNotes: 'Crispy, caramelized edges on the outside with a soft, tender bite inside, seasoned simply with rosemary and garlic: a comforting side that goes with almost anything.',"],

  // Lemon Garlic Roasted Vegetable Medley
  ["summary: 'Cruciferous fiber and vitamin C from the broccoli, beta-carotene from the carrot, and vitamin C from the bell pepper -- three real, differently-colored vegetables roasted together instead of one.',",
   "summary: 'Cruciferous fiber and vitamin C from the broccoli, beta-carotene from the carrot, and vitamin C from the bell pepper: three differently-colored vegetables roasted together instead of one.',"],
  ["{ nutrient: 'Vitamin C', note: 'A real 53-64% of a day\\'s worth per serving.' },",
   "{ nutrient: 'Vitamin C', note: 'A solid 53-64% of a day\\'s worth per serving.' },"],
  ["note: 'Raw broccoli carries a real goitrogenic compound relevant to thyroid iodine uptake, but roasting genuinely reduces this compound substantially compared to eating it raw, which is exactly why this side is roasted rather than served as a raw salad.' },",
   "note: 'Raw broccoli carries a goitrogenic compound relevant to thyroid iodine uptake, but roasting measurably reduces this compound compared to eating it raw, which is exactly why this side is roasted rather than served as a raw salad.' },"],
  ["flavorNotes: 'Real, roasty char on the broccoli florets pairs with sweet roasted carrot and bell pepper, all brightened at the end by fresh lemon juice and garlic -- simple, colorful, and genuinely craveable for a vegetable side.',",
   "flavorNotes: 'A good roasty char on the broccoli florets pairs with sweet roasted carrot and bell pepper, all brightened at the end by fresh lemon juice and garlic: simple, colorful, and genuinely craveable for a vegetable side.',"],

  // Garlic Mashed Cauliflower
  ["teaser: 'A real, lower-carb alternative to mashed potatoes.',",
   "teaser: 'A lower-carb alternative to mashed potatoes.',"],
  ["summary: 'Cauliflower delivers real vitamin C and fiber for far fewer carbohydrates than an equivalent portion of mashed potatoes.',",
   "summary: 'Cauliflower delivers vitamin C and fiber for far fewer carbohydrates than an equivalent portion of mashed potatoes.',"],
  ["'Drain well, pressing out as much excess water as you can -- cauliflower holds onto water, and skipping this makes for a watery mash.',",
   "'Drain well, pressing out as much excess water as you can. Cauliflower holds onto water, and skipping this makes for a watery mash.',"],
  ["{ nutrient: 'Vitamin C', note: 'A real 37-44% of a day\\'s worth per serving.' },",
   "{ nutrient: 'Vitamin C', note: 'A solid 37-44% of a day\\'s worth per serving.' },"],
  ["flavorNotes: 'Creamy and garlicky, this genuinely stands in for mashed potatoes with a similar smooth texture but a lighter, slightly sweeter, more vegetal flavor underneath.',",
   "flavorNotes: 'Creamy and garlicky, this stands in nicely for mashed potatoes, with a similar smooth texture but a lighter, slightly sweeter, more vegetal flavor underneath.',"],

  // Simple Sautéed Spinach with Garlic
  ["summary: 'Spinach cooks down dramatically -- a real pound of raw spinach shrinks to just a few real tablespoons once wilted, which is why this recipe starts with so much more raw spinach than it looks like it needs.',",
   "summary: 'Spinach cooks down dramatically. A full pound of raw spinach shrinks to just a few tablespoons once wilted, which is why this recipe starts with so much more raw spinach than it looks like it needs.',"],
  ["'Cook for 2-3 minutes total, just until fully wilted -- overcooking spinach makes it mushy and dulls its color.',",
   "'Cook for 2-3 minutes total, just until fully wilted. Overcooking spinach makes it mushy and dulls its color.',"],
  ["{ nutrient: 'Vitamin C', note: 'A real 40-48% of a day\\'s target per serving.' },",
   "{ nutrient: 'Vitamin C', note: 'A solid 40-48% of a day\\'s target per serving.' },"],
  ["note: 'Spinach carries a genuinely high oxalate load, cooked or raw. Pairing it with a calcium source at the same meal is a real, practical way to help offset it if oxalate is something you\\'re watching.' },",
   "note: 'Spinach carries a notably high oxalate load, cooked or raw. Pairing it with a calcium source at the same meal is a practical way to help offset it if oxalate is something you\\'re watching.' },"],
  ["flavorNotes: 'Simple and genuinely fast, with the garlic and a bright squeeze of lemon keeping the spinach\\'s own mild, earthy flavor from tasting flat. A classic, no-frills green side.',",
   "flavorNotes: 'Simple and quick, with the garlic and a bright squeeze of lemon keeping the spinach\\'s own mild, earthy flavor from tasting flat. A classic, no-frills green side.',"],

  // Rainbow Stir-Fried Vegetables
  ["teaser: 'Six real, differently-colored vegetables in one fast pan.',",
   "teaser: 'Six differently-colored vegetables in one fast pan.',"],
  ["summary: 'Six real, differently-colored vegetables in one dish means a real spread of the vitamins and antioxidants each color tends to carry, not just whatever one vegetable happened to be on hand.',",
   "summary: 'Six differently-colored vegetables in one dish means a wide spread of the vitamins and antioxidants each color tends to carry, not just whatever one vegetable happened to be on hand.',"],
  ["'Add the red and yellow bell peppers and continue stir-frying for another 2-3 minutes, until all the vegetables are crisp-tender -- you want real bite left, not fully soft.',",
   "'Add the red and yellow bell peppers and continue stir-frying for another 2-3 minutes, until all the vegetables are crisp-tender. You want some bite left, not fully soft.',"],
  ["{ nutrient: 'Vitamin K', note: 'A real 132-176% of a day\\'s worth per serving.' },",
   "{ nutrient: 'Vitamin K', note: 'A striking 132-176% of a day\\'s worth per serving.' },"],
  ["note: 'Regular soy sauce is brewed from wheat and carries real gluten. Tamari (a real, traditionally gluten-free soy sauce) or coconut aminos both swap in directly for the same salty, savory flavor without the gluten.' },",
   "note: 'Regular soy sauce is brewed from wheat and carries gluten. Tamari (a traditionally gluten-free soy sauce) or coconut aminos both swap in directly for the same salty, savory flavor without the gluten.' },"],
  ["flavorNotes: 'Fast, crisp-tender, and genuinely vibrant with color -- the vegetables stay bright and retain real crunch rather than going soft, tied together with a savory, gingery, garlicky sauce.',",
   "flavorNotes: 'Fast, crisp-tender, and vibrant with color, the vegetables stay bright and retain good crunch rather than going soft, tied together with a savory, gingery, garlicky sauce.',"],
];

let missing = [];
for (const [oldStr, newStr] of pairs) {
  if (!text.includes(oldStr)) { missing.push(oldStr.slice(0, 70)); continue; }
  text = text.split(oldStr).join(newStr);
}
fs.writeFileSync(FILE, text, 'utf8');
if (missing.length) { console.log('MISSING (not found):'); missing.forEach(m => console.log(' -', m)); }
else console.log('All', pairs.length, 'replacements applied.');
