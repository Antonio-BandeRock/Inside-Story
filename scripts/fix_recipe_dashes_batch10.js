const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'lib', 'digest', 'recipes.ts');
let text = fs.readFileSync(FILE, 'utf8');

const pairs = [
  // Shared yield line across all 4 soups
  ["yield: 'Makes about 3 cups, 2 real 1½-cup servings.',",
   "yield: 'Makes about 3 cups, 2 1½-cup servings.',"],

  // Simple Chicken Vegetable Soup
  ["teaser: 'A real, classic chicken soup built from scratch.',",
   "teaser: 'A classic chicken soup built from scratch.',"],
  ["summary: 'Homemade chicken soup avoids the real sodium load that most canned versions carry, since you control exactly how much salt goes in.',",
   "summary: 'Homemade chicken soup avoids the heavy sodium load that most canned versions carry, since you control exactly how much salt goes in.',"],
  ["'Taste and add salt as needed, keeping in mind the bouillon already carries a real amount of sodium.',",
   "'Taste and add salt as needed, keeping in mind the bouillon already carries a fair amount of sodium.',"],
  ["{ nutrient: 'Vitamin B6', note: 'A real 51% of a day\\'s worth per serving.' },",
   "{ nutrient: 'Vitamin B6', note: 'A solid 51% of a day\\'s worth per serving.' },"],
  ["note: 'Bouillon cubes are a real, easy-to-overlook source of concentrated iodine, which can be a genuine concern for someone actively managing Graves\\' disease. Using a homemade, unsalted stock instead of a bouillon cube, or a low-iodine bouillon alternative, keeps this soup\\'s flavor while cutting that iodine load substantially.' },",
   "note: 'Bouillon cubes are an easy-to-overlook source of concentrated iodine, which can matter for someone actively managing Graves\\' disease. Using a homemade, unsalted stock instead of a bouillon cube, or a low-iodine bouillon alternative, keeps this soup\\'s flavor while cutting that iodine load substantially.' },"],
  ["flavorNotes: 'A real, comforting, classic chicken soup -- savory broth, tender chicken, and soft vegetables, the kind of thing that genuinely feels like it\\'s doing something good for you while you eat it.',",
   "flavorNotes: 'A comforting, classic chicken soup: savory broth, tender chicken, and soft vegetables, the kind of thing that genuinely feels like it\\'s doing something good for you while you eat it.',"],

  // Butternut Squash Soup
  ["teaser: 'A creamy, real, dairy-free squash soup.',",
   "teaser: 'A creamy, dairy-free squash soup.',"],
  ["summary: 'Butternut squash\\'s orange color signals real, substantial beta-carotene content, which the body converts into vitamin A.',",
   "summary: 'Butternut squash\\'s orange color signals substantial beta-carotene content, which the body converts into vitamin A.',"],
  ["{ nutrient: 'Vitamin A', note: 'A real 78-100% of a day\\'s worth per serving.' },",
   "{ nutrient: 'Vitamin A', note: 'A striking 78-100% of a day\\'s worth per serving.' },"],
  ["flavorNotes: 'Naturally sweet and creamy from the squash itself, with warm background notes from the nutmeg -- rich-tasting without needing any real cream to get there.',",
   "flavorNotes: 'Naturally sweet and creamy from the squash itself, with warm background notes from the nutmeg: rich-tasting without needing any cream at all to get there.',"],

  // Red Lentil Soup
  ["teaser: 'A hearty, real plant-protein soup.',",
   "teaser: 'A hearty plant-protein soup.',"],
  ["summary: 'Red lentils cook down faster than most other legumes and genuinely thicken a soup on their own as they break down, without needing any added cream or flour.',",
   "summary: 'Red lentils cook down faster than most other legumes and thicken a soup on their own as they break down, without needing any added cream or flour.',"],
  ["'For a smoother soup, blend part or all of it with an immersion blender -- red lentils naturally break down enough that this step is optional.',",
   "'For a smoother soup, blend part or all of it with an immersion blender. Red lentils naturally break down enough that this step is optional.',"],
  ["{ nutrient: 'Iron', note: 'A real 29-66% of a day\\'s worth per serving, one of the strongest plant-based iron sources in this whole recipe set.' },",
   "{ nutrient: 'Iron', note: 'A striking 29-66% of a day\\'s worth per serving, one of the strongest plant-based iron sources in this whole recipe set.' },"],
  ["flavorNotes: 'Warm and earthy with a real hit of cumin, this soup thickens into something genuinely hearty and satisfying as the lentils break down -- filling enough to work as a full meal on its own.',",
   "flavorNotes: 'Warm and earthy with a good hit of cumin, this soup thickens into something genuinely hearty and satisfying as the lentils break down, filling enough to work as a full meal on its own.',"],

  // Tomato Basil Soup
  ["teaser: 'A real, classic comfort soup made from scratch.',",
   "teaser: 'A classic comfort soup made from scratch.',"],
  ["summary: 'Cooking tomatoes actually increases how available their real lycopene is for the body to absorb, unlike most nutrients, which cooking tends to reduce.',",
   "summary: 'Cooking tomatoes actually increases how available their lycopene is for the body to absorb, unlike most nutrients, which cooking tends to reduce.',"],
  ["{ nutrient: 'Vitamin C', note: 'A real 34-41% of a day\\'s worth per serving.' },",
   "{ nutrient: 'Vitamin C', note: 'A solid 34-41% of a day\\'s worth per serving.' },"],
  ["flavorNotes: 'Bright, tangy tomato flavor rounded out by sweet sautéed onion and fragrant fresh basil -- a real, classic comfort soup that tastes noticeably fresher than anything from a can.',",
   "flavorNotes: 'Bright, tangy tomato flavor rounded out by sweet sautéed onion and fragrant fresh basil: a classic comfort soup that tastes noticeably fresher than anything from a can.',"],
];

let missing = [];
for (const [oldStr, newStr] of pairs) {
  if (!text.includes(oldStr)) { missing.push(oldStr.slice(0, 70)); continue; }
  text = text.split(oldStr).join(newStr);
}
fs.writeFileSync(FILE, text, 'utf8');
if (missing.length) { console.log('MISSING (not found):'); missing.forEach(m => console.log(' -', m)); }
else console.log('All', pairs.length, 'replacements applied.');
