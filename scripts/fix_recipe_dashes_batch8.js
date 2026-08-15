const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'lib', 'digest', 'recipes.ts');
let text = fs.readFileSync(FILE, 'utf8');

const pairs = [
  // Green Glow
  ["teaser: 'A real, vegetable-forward green smoothie.',",
   "teaser: 'A vegetable-forward green smoothie.',"],
  ["summary: 'Spinach\\'s own real, mild flavor gets almost entirely masked by the banana and pineapple here, which is a genuinely effective way to get a real vegetable serving into a smoothie without tasting like a salad.',",
   "summary: 'Spinach\\'s own mild flavor gets almost entirely masked by the banana and pineapple here, an effective way to get a vegetable serving into a smoothie without tasting like a salad.',"],
  ["'Pour into glasses and drink right away -- the chia seeds start to thicken the smoothie the longer it sits.',",
   "'Pour into glasses and drink right away. The chia seeds start to thicken the smoothie the longer it sits.',"],
  ["{ nutrient: 'Vitamin K', note: 'A real 184-246% of a day\\'s worth per serving.' },",
   "{ nutrient: 'Vitamin K', note: 'A striking 184-246% of a day\\'s worth per serving.' },"],
  ["note: 'Both spinach and chia seeds carry a genuinely high oxalate load, and this smoothie has real amounts of both. Blending in a spoonful of plain yogurt for a calcium boost is a real way to help offset it if that\\'s a concern.' },",
   "note: 'Both spinach and chia seeds carry a notably high oxalate load, and this smoothie has meaningful amounts of both. Blending in a spoonful of plain yogurt for a calcium boost is one way to help offset it if that\\'s a concern.' },"],
  ["flavorNotes: 'Genuinely fruity and sweet, with the banana and pineapple doing most of the talking -- the spinach adds real color and nutrition without adding much flavor of its own, which is exactly the point.',",
   "flavorNotes: 'Fruity and sweet, with the banana and pineapple doing most of the talking. The spinach adds color and nutrition without adding much flavor of its own, which is exactly the point.',"],

  // Golden Turmeric Anti-Inflammatory
  ["summary: 'Black pepper genuinely improves how well the body absorbs turmeric\\'s curcumin, which is why it shows up here even in a small pinch.',",
   "summary: 'Black pepper noticeably improves how well the body absorbs turmeric\\'s curcumin, which is why it shows up here even in a small pinch.',"],
  ["{ nutrient: 'Vitamin B6', note: 'A real 37% of a day\\'s worth per serving.' },",
   "{ nutrient: 'Vitamin B6', note: 'A solid 37% of a day\\'s worth per serving.' },"],
  ["flavorNotes: 'Warm, spiced flavor from the turmeric and cinnamon against the natural sweetness and creaminess of the banana -- this drinks more like a real dessert smoothie than a health-food shot, with just enough black pepper in the background to notice without any real heat.',",
   "flavorNotes: 'Warm, spiced flavor from the turmeric and cinnamon against the natural sweetness and creaminess of the banana. This drinks more like a dessert smoothie than a health-food shot, with just enough black pepper in the background to notice without any actual heat.',"],

  // Brazil Nut Tropical Selenium Support
  ["teaser: 'A real, notably selenium-rich smoothie built around Brazil nuts.',",
   "teaser: 'A notably selenium-rich smoothie built around Brazil nuts.',"],
  ["summary: 'Brazil nuts are one of the most concentrated real food sources of selenium that exists -- just a couple of nuts can genuinely cover a full day\\'s worth.',",
   "summary: 'Brazil nuts are one of the most concentrated food sources of selenium that exists. Just a couple of nuts can cover a full day\\'s worth.',"],
  ["'Blend on high for 45-60 seconds, until completely smooth -- the Brazil nuts take a little longer to break down fully than softer ingredients, so blend a bit longer than you might expect.',",
   "'Blend on high for 45-60 seconds, until completely smooth. The Brazil nuts take a little longer to break down fully than softer ingredients, so blend a bit longer than you might expect.',"],
  ["{ nutrient: 'Vitamin C', note: 'A real 45-54% of a day\\'s target per serving.' },",
   "{ nutrient: 'Vitamin C', note: 'A solid 45-54% of a day\\'s target per serving.' },"],
  ["note: 'Brazil nuts carry a real, elevated oxalate load. Pairing this with a calcium source at the same meal helps offset it if that\\'s a concern for you.' },",
   "note: 'Brazil nuts carry a notably elevated oxalate load. Pairing this with a calcium source at the same meal helps offset it if that\\'s a concern for you.' },"],
  ["flavorNotes: 'Rich and creamy from the coconut milk and Brazil nuts, with real tropical sweetness from the pineapple and banana -- this drinks thick and indulgent, closer to a milkshake than a light fruit smoothie.',",
   "flavorNotes: 'Rich and creamy from the coconut milk and Brazil nuts, with plenty of tropical sweetness from the pineapple and banana. This drinks thick and indulgent, closer to a milkshake than a light fruit smoothie.',"],

  // Berry Antioxidant Blast
  ["teaser: 'A vibrant, real double-berry smoothie.',",
   "teaser: 'A vibrant double-berry smoothie.',"],
  ["summary: 'Blueberries and strawberries each carry their own real, distinct set of antioxidant compounds, so combining them genuinely broadens what you\\'re getting rather than just doubling up on the same one.',",
   "summary: 'Blueberries and strawberries each carry their own distinct set of antioxidant compounds, so combining them genuinely broadens what you\\'re getting rather than just doubling up on the same one.',"],
  ["{ nutrient: 'Manganese', note: 'A real 180-230% of a day\\'s worth per serving.' },",
   "{ nutrient: 'Manganese', note: 'A striking 180-230% of a day\\'s worth per serving.' },"],
  ["flavorNotes: 'Genuinely bright and fruity, with real natural sweetness from the berries and a light, refreshing base from the coconut water -- this tastes closer to a real fruit punch than a health smoothie.',",
   "flavorNotes: 'Bright and fruity, with plenty of natural sweetness from the berries and a light, refreshing base from the coconut water. This tastes closer to a fruit punch than a health smoothie.',"],

  // Iron & Vitamin C Boost
  ["teaser: 'A real, iron-and-vitamin-C-paired fruit and greens smoothie.',",
   "teaser: 'An iron-and-vitamin-C-paired fruit and greens smoothie.',"],
  ["{ nutrient: 'Vitamin K', note: 'A real 126-167% of a day\\'s target per serving.' },",
   "{ nutrient: 'Vitamin K', note: 'A striking 126-167% of a day\\'s target per serving.' },"],
  ["note: 'Spinach carries a genuinely high oxalate load. Blending in a spoonful of plain yogurt is a real, easy way to add calcium and help offset it if that\\'s a concern.' },",
   "note: 'Spinach carries a notably high oxalate load. Blending in a spoonful of plain yogurt is an easy way to add calcium and help offset it if that\\'s a concern.' },"],
  ["flavorNotes: 'Sweet and citrusy from the orange, with strawberry and banana rounding it out -- the spinach disappears almost entirely into the flavor, leaving a genuinely fruity, refreshing smoothie behind.',",
   "flavorNotes: 'Sweet and citrusy from the orange, with strawberry and banana rounding it out. The spinach disappears almost entirely into the flavor, leaving a fruity, refreshing smoothie behind.',"],

  // Tropical Ginger Digestive Soother
  ["summary: 'Fresh ginger has real, long-documented use for settling an upset stomach, which is exactly the idea behind pairing it with tropical fruit here.',",
   "summary: 'Fresh ginger has a long-documented history of settling an upset stomach, which is exactly the idea behind pairing it with tropical fruit here.',"],
  ["{ nutrient: 'Vitamin C', note: 'A real 63-76% of a day\\'s target per serving.' },",
   "{ nutrient: 'Vitamin C', note: 'A solid 63-76% of a day\\'s target per serving.' },"],
  ["flavorNotes: 'Bright, tropical, and genuinely zingy from the fresh ginger and lime, with pineapple and banana giving it real sweetness underneath -- refreshing rather than heavy, closer to a real tropical drink than a typical fruit smoothie.',",
   "flavorNotes: 'Bright, tropical, and properly zingy from the fresh ginger and lime, with pineapple and banana giving it plenty of sweetness underneath. Refreshing rather than heavy, closer to a tropical drink than a typical fruit smoothie.',"],
];

let missing = [];
for (const [oldStr, newStr] of pairs) {
  if (!text.includes(oldStr)) { missing.push(oldStr.slice(0, 70)); continue; }
  text = text.split(oldStr).join(newStr);
}
fs.writeFileSync(FILE, text, 'utf8');
if (missing.length) { console.log('MISSING (not found):'); missing.forEach(m => console.log(' -', m)); }
else console.log('All', pairs.length, 'replacements applied.');
