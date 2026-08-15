const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'lib', 'digest', 'recipes.ts');
let text = fs.readFileSync(FILE, 'utf8');

const pairs = [
  // Desserts stragglers
  ["note: 'Walnuts carry a genuinely high oxalate load. This is a small topping amount, so it\\'s unlikely to matter for most people, but if oxalate is something you\\'re actively watching, pairing this with a calcium source (a scoop of Greek yogurt alongside it works well) helps offset it.' },",
   "note: 'Walnuts carry a notably high oxalate load. This is a small topping amount, so it\\'s unlikely to matter for most people, but if oxalate is something you\\'re actively watching, pairing this with a calcium source (a scoop of Greek yogurt alongside it works well) helps offset it.' },"],
  ["'Cover and refrigerate for at least 4 hours, or overnight, until it\\'s thickened to a real pudding consistency.',",
   "'Cover and refrigerate for at least 4 hours, or overnight, until it\\'s thickened to a proper pudding consistency.',"],
  ["note: 'Chia seeds carry a genuinely high oxalate load. Pairing this pudding with a calcium source (the almond milk already helps a little, or add a spoonful of yogurt) helps offset it if oxalate is something you\\'re watching.' },",
   "note: 'Chia seeds carry a notably high oxalate load. Pairing this pudding with a calcium source (the almond milk already helps a little, or add a spoonful of yogurt) helps offset it if oxalate is something you\\'re watching.' },"],
  ["flavorNotes: 'This lands closer to a fruit-and-seed pudding than a sugary dessert: creamy and just barely sweet, with the tiny chia seeds giving it a tapioca-like texture, and whole berries folded through for real bursts of tartness.',",
   "flavorNotes: 'This lands closer to a fruit-and-seed pudding than a sugary dessert: creamy and just barely sweet, with the tiny chia seeds giving it a tapioca-like texture, and whole berries folded through for bright bursts of tartness.',"],
];

let missing = [];
for (const [oldStr, newStr] of pairs) {
  if (!text.includes(oldStr)) { missing.push(oldStr.slice(0, 70)); continue; }
  text = text.split(oldStr).join(newStr);
}
fs.writeFileSync(FILE, text, 'utf8');
if (missing.length) { console.log('MISSING (not found):'); missing.forEach(m => console.log(' -', m)); }
else console.log('All', pairs.length, 'replacements applied.');
