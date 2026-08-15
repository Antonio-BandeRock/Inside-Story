const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'lib', 'digest', 'recipes.ts');
let text = fs.readFileSync(FILE, 'utf8');

const pairs = [
  // Shared substrings across multiple salads (fixed once, applies everywhere via split/join)
  ["Makes about 4 cups, 2 real 2-cup servings.',",
   "Makes about 4 cups, 2 2-cup servings.',"],
  ["a real amount of fermentable fiber that can be harder on an already-sensitive gut.",
   "a fair amount of fermentable fiber that can be harder on an already-sensitive gut."],
  ["a real, known digestive irritant for some people with IBS.",
   "a known digestive irritant for some people with IBS."],

  // Recipe 1: Mediterranean Chickpea & Feta
  ["summary: 'Chickpeas bring real plant protein and fiber together, a combination that helps slow how quickly the meal\\'s own carbohydrates raise blood sugar.',",
   "summary: 'Chickpeas bring plant protein and fiber together, a combination that helps slow how quickly the meal\\'s own carbohydrates raise blood sugar.',"],
  ["'Let it sit for 5-10 minutes before serving, if you have the time -- this gives the flavors a chance to meld together.',",
   "'Let it sit for 5-10 minutes before serving, if you have the time. This gives the flavors a chance to meld together.',"],
  ["flavorNotes: 'Bright and tangy from the lemon and oregano, with real salty richness from the feta against the cool crunch of cucumber and tomato -- a genuine, no-cook Mediterranean-style salad that tastes like it took more effort than it actually did.',",
   "flavorNotes: 'Bright and tangy from the lemon and oregano, with salty richness from the feta against the cool crunch of cucumber and tomato: a simple, no-cook Mediterranean-style salad that tastes like it took more effort than it actually did.',"],

  // Recipe 2: Kale & Citrus Iron Boost
  ["teaser: 'Raw kale paired with orange for a real vitamin C boost.',",
   "teaser: 'Raw kale paired with orange for a vitamin C boost.',"],
  ["'Massage the chopped kale with a small pinch of salt and a few drops of the olive oil for about 2 minutes, until it visibly softens and darkens slightly -- this real, physical step breaks down kale\\'s naturally tough texture and makes it far more pleasant to eat raw.',",
   "'Massage the chopped kale with a small pinch of salt and a few drops of the olive oil for about 2 minutes, until it visibly softens and darkens slightly. This simple step breaks down kale\\'s naturally tough texture and makes it far more pleasant to eat raw.',"],
  ["{ nutrient: 'Vitamin C', note: 'A real 147-176% of a day\\'s target per serving.' },",
   "{ nutrient: 'Vitamin C', note: 'A striking 147-176% of a day\\'s target per serving.' },"],
  ["note: 'Raw kale carries a real goitrogenic compound that can interfere with the thyroid\\'s own iodine uptake when eaten raw and often. It\\'s genuinely well tolerated in normal portions like this one for most people, but if you\\'re eating raw cruciferous vegetables like this daily, lightly steaming the kale first is a real, easy way to reduce that compound while keeping most of the nutrition.' },",
   "note: 'Raw kale carries a goitrogenic compound that can interfere with the thyroid\\'s own iodine uptake when eaten raw and often. It\\'s well tolerated in normal portions like this one for most people, but if you\\'re eating raw cruciferous vegetables like this daily, lightly steaming the kale first is an easy way to reduce that compound while keeping most of the nutrition.' },"],
  ["flavorNotes: 'Earthy, slightly bitter kale balanced against sweet, juicy orange segments and a little sharpness from raw onion, with pumpkin seeds adding real crunch. The massage step genuinely changes kale\\'s texture from tough to tender, which makes a real difference here.',",
   "flavorNotes: 'Earthy, slightly bitter kale balanced against sweet, juicy orange segments and a little sharpness from raw onion, with pumpkin seeds adding good crunch. The massage step noticeably changes kale\\'s texture from tough to tender, which makes a real difference here.',"],

  // Recipe 3: Sesame Ginger Cabbage & Carrot Slaw
  ["teaser: 'A crunchy raw slaw with real sesame and ginger flavor.',",
   "teaser: 'A crunchy raw slaw with sesame and ginger flavor.',"],
  ["summary: 'Rice vinegar\\'s acidity, plus the natural crunch of raw cabbage and carrot, makes this a genuinely light, low-calorie side with real texture.',",
   "summary: 'Rice vinegar\\'s acidity, plus the natural crunch of raw cabbage and carrot, makes this a light, low-calorie side with good texture.',"],
  ["'Let it sit for at least 10 minutes before serving -- the cabbage softens slightly and takes on more of the dressing\\'s flavor the longer it sits.',",
   "'Let it sit for at least 10 minutes before serving. The cabbage softens slightly and takes on more of the dressing\\'s flavor the longer it sits.',"],
  ["{ nutrient: 'Vitamin K', note: 'A real 93-124% of a day\\'s worth per serving.' },",
   "{ nutrient: 'Vitamin K', note: 'A solid 93-124% of a day\\'s worth per serving.' },"],
  ["note: 'Raw cabbage carries a real goitrogenic compound relevant to thyroid iodine uptake, and this is a genuinely large raw cabbage portion. If you eat cabbage this way often, occasionally swapping in a lightly steamed slaw keeps the crunch while reducing that compound.' },",
   "note: 'Raw cabbage carries a goitrogenic compound relevant to thyroid iodine uptake, and this is a fairly large raw cabbage portion. If you eat cabbage this way often, occasionally swapping in a lightly steamed slaw keeps the crunch while reducing that compound.' },"],
  ["flavorNotes: 'Crisp and crunchy from the raw cabbage and carrot, with a real gingery bite and a savory-sweet dressing that balances the vinegar\\'s sharpness. The toasted flavor of the sesame seeds ties the whole thing together.',",
   "flavorNotes: 'Crisp and crunchy from the raw cabbage and carrot, with a sharp gingery bite and a savory-sweet dressing that balances the vinegar\\'s sharpness. The toasted flavor of the sesame seeds ties the whole thing together.',"],

  // Recipe 4: Roasted Beet, Walnut & Arugula
  ["summary: 'Roasting beets concentrates their natural sweetness in a way boiling doesn\\'t, since less of their real sugar leaches out into the cooking water.',",
   "summary: 'Roasting beets concentrates their natural sweetness in a way boiling doesn\\'t, since less of their natural sugar leaches out into the cooking water.',"],
  ["note: 'Raw arugula carries a real goitrogenic compound relevant to thyroid iodine uptake, though it\\'s a smaller amount than a food like raw kale or cabbage and is generally well tolerated in a normal portion like this one.' },",
   "note: 'Raw arugula carries a goitrogenic compound relevant to thyroid iodine uptake, though it\\'s a smaller amount than a food like raw kale or cabbage and is generally well tolerated in a normal portion like this one.' },"],
  ["note: 'Walnuts carry a real, elevated oxalate load. Pairing them with a calcium source (the feta in this same salad already helps) is a real, easy way to offset it.' },",
   "note: 'Walnuts carry a notably elevated oxalate load. Pairing them with a calcium source (the feta in this same salad already helps) is an easy way to offset it.' },"],
  ["flavorNotes: 'Earthy, sweet roasted beets against arugula\\'s real peppery bite, with salty feta and a genuine crunch from the walnuts -- a real balance of sweet, sharp, salty, and crunchy all in one bowl.',",
   "flavorNotes: 'Earthy, sweet roasted beets against arugula\\'s peppery bite, with salty feta and a good crunch from the walnuts: a fine balance of sweet, sharp, salty, and crunchy all in one bowl.',"],

  // Recipe 5: Southwest Quinoa & Black Bean
  ["teaser: 'A hearty grain-and-bean salad with real southwest flavor.',",
   "teaser: 'A hearty grain-and-bean salad with southwest flavor.',"],
  ["summary: 'Quinoa is a real, complete plant protein, containing all nine essential amino acids, which is genuinely uncommon among plant foods.',",
   "summary: 'Quinoa is a complete plant protein, containing all nine essential amino acids, which is uncommon among plant foods.',"],
  ["{ nutrient: 'Manganese', note: 'A real 66-84% of a day\\'s worth per serving.' },",
   "{ nutrient: 'Manganese', note: 'A solid 66-84% of a day\\'s worth per serving.' },"],
  ["flavorNotes: 'Nutty quinoa, earthy black beans, and sweet corn come together with a bright, citrusy lime dressing and a warm hit of cumin -- creamy avocado ties the whole thing together into a real, filling southwest-style bowl.',",
   "flavorNotes: 'Nutty quinoa, earthy black beans, and sweet corn come together with a bright, citrusy lime dressing and a warm hit of cumin: creamy avocado ties the whole thing together into a filling southwest-style bowl.',"],

  // Recipe 6: Spinach, Strawberry & Almond
  ["summary: 'Strawberries are one of the few fruits that genuinely rival citrus for real vitamin C content per serving.',",
   "summary: 'Strawberries are one of the few fruits that rival citrus for vitamin C content per serving.',"],
  ["{ nutrient: 'Vitamin C', note: 'A real 65-77% of a day\\'s target per serving.' },",
   "{ nutrient: 'Vitamin C', note: 'A solid 65-77% of a day\\'s target per serving.' },"],
  ["note: 'Both raw spinach and almonds carry a genuinely high oxalate load, and this salad has real amounts of both. Pairing this with a real calcium source at the same meal (a side of yogurt, or a sprinkle of cheese) is a real, practical way to help offset it if oxalate is something you\\'re watching.' },",
   "note: 'Both raw spinach and almonds carry a notably high oxalate load, and this salad has meaningful amounts of both. Pairing this with a calcium source at the same meal (a side of yogurt, or a sprinkle of cheese) is a practical way to help offset it if oxalate is something you\\'re watching.' },"],
  ["flavorNotes: 'Sweet, juicy strawberries against spinach\\'s own mild, slightly earthy leaves, with real crunch from the sliced almonds and a tangy balsamic dressing tying it all together -- a genuinely classic combination for a real reason.',",
   "flavorNotes: 'Sweet, juicy strawberries against spinach\\'s own mild, slightly earthy leaves, with good crunch from the sliced almonds and a tangy balsamic dressing tying it all together: a classic combination for good reason.',"],
];

let missing = [];
for (const [oldStr, newStr] of pairs) {
  if (!text.includes(oldStr)) { missing.push(oldStr.slice(0, 70)); continue; }
  text = text.split(oldStr).join(newStr);
}
fs.writeFileSync(FILE, text, 'utf8');
if (missing.length) { console.log('MISSING (not found):'); missing.forEach(m => console.log(' -', m)); }
else console.log('All', pairs.length, 'replacements applied.');
