const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'lib', 'digest', 'recipes.ts');
let text = fs.readFileSync(FILE, 'utf8');

const pairs = [
  // Desserts
  ["summary: 'Real fruit fiber from the apple itself, plus real omega-3 fat and protein from the walnuts, sweetened with a small amount of honey rather than refined sugar.',",
   "summary: 'Fruit fiber from the apple itself, plus omega-3 fat and protein from the walnuts, sweetened with a small amount of honey rather than refined sugar.',"],
  ["yield: 'Makes 2 baked apple halves-worth (about 300g apple total) -- 1 real serving per person.',",
   "yield: 'Makes 2 baked apple halves-worth (about 300g apple total), 1 serving per person.',"],
  ["flavorNotes: 'Soft, warm, and cinnamon-sweet, with real crunch from the walnuts on top -- this eats like a genuine fruit dessert rather than a pastry, closer to the inside of an apple pie without the crust.',",
   "flavorNotes: 'Soft, warm, and cinnamon-sweet, with crunch from the walnuts on top. This eats like a fruit dessert rather than a pastry, closer to the inside of an apple pie without the crust.',"],
  ["summary: 'Chia seeds bring real omega-3 fat and fiber, and three real, differently-colored berries each carry their own real antioxidant profile.',",
   "summary: 'Chia seeds bring omega-3 fat and fiber, and three differently-colored berries each carry their own antioxidant profile.',"],
  ["yield: 'Makes about 1 cup, 2 real ½-cup servings.',",
   "yield: 'Makes about 1 cup, 2 ½-cup servings.',"],
  ["'Let it sit for 5 minutes, then whisk again -- this breaks up any clumps of chia seeds that try to settle together.',",
   "'Let it sit for 5 minutes, then whisk again. This breaks up any clumps of chia seeds that try to settle together.',"],
  ["flavorNotes: 'This lands closer to a fruit-and-seed pudding than a sugary dessert -- creamy and just barely sweet, with the tiny chia seeds giving it a genuine tapioca-like texture, and whole berries folded through for real bursts of tartness.',",
   "flavorNotes: 'This lands closer to a fruit-and-seed pudding than a sugary dessert: creamy and just barely sweet, with the tiny chia seeds giving it a tapioca-like texture, and whole berries folded through for real bursts of tartness.',"],
  // Fermentations
  ["yield: 'Makes about 8 cups. A real batch meant to last 2 people a week or more in the fridge, the way a real jar of yogurt would.',",
   "yield: 'Makes about 8 cups. A batch meant to last 2 people a week or more in the fridge, the way a jar of yogurt would.',"],
  ["'Let the milk cool to about 110-115°F (43-46°C) -- warm to the touch but not hot enough to burn your finger.',",
   "'Let the milk cool to about 110-115°F (43-46°C), warm to the touch but not hot enough to burn your finger.',"],
  ["'Once it\\'s thickened and set, refrigerate it for at least a few hours before eating -- it firms up further as it chills.',",
   "'Once it\\'s thickened and set, refrigerate it for at least a few hours before eating. It firms up further as it chills.',"],
  ["flavorNotes: 'Real homemade yogurt tastes noticeably tangier and less sweet than most store-bought tubs, with a thinner, more natural set unless you strain it Greek-style. It\\'s a genuinely different product from a sweetened commercial cup -- plain, a little sour, and ready to be built on with fruit or honey.',",
   "flavorNotes: 'Homemade yogurt tastes noticeably tangier and less sweet than most store-bought tubs, with a thinner, more natural set unless you strain it Greek-style. It\\'s a different product from a sweetened commercial cup: plain, a little sour, and ready to be built on with fruit or honey.',"],
  ["teaser: 'The same real base yogurt, with Bifidobacterium and L. acidophilus added in.',",
   "teaser: 'The same base yogurt, with Bifidobacterium and L. acidophilus added in.',"],
  ["summary: 'Adding Bifidobacterium species and Lactobacillus acidophilus to a standard yogurt culture is a real way to broaden the range of live strains reaching your gut beyond the two cultures required for something to legally be called yogurt at all.',",
   "summary: 'Adding Bifidobacterium species and Lactobacillus acidophilus to a standard yogurt culture is a way to broaden the range of live strains reaching your gut beyond the two cultures required for something to legally be called yogurt at all.',"],
  ["yield: 'Makes about 8 cups. A real batch meant to last 2 people a week or more in the fridge.',",
   "yield: 'Makes about 8 cups. A batch meant to last 2 people a week or more in the fridge.',"],
  ["'Pour into a clean jar or container, cover, and keep it somewhere warm for 8-12 hours -- a little longer than a plain culture, since Bifidobacterium species tend to grow more slowly and benefit from the extra time.',",
   "'Pour into a clean jar or container, cover, and keep it somewhere warm for 8-12 hours, a little longer than a plain culture, since Bifidobacterium species tend to grow more slowly and benefit from the extra time.',"],
  ["flavorNotes: 'Tastes very close to the plain version -- tangy and thick, not sweet -- though the extra culture blend can give it a slightly softer set and a touch more sourness depending on how long it ferments.',",
   "flavorNotes: 'Tastes very close to the plain version, tangy and thick, not sweet, though the extra culture blend can give it a slightly softer set and a touch more sourness depending on how long it ferments.',"],
  ["summary: 'Real, documented microbial succession happens in a fermenting brine: Leuconostoc mesenteroides gets things started, then Lactobacillus plantarum takes over and dominates the finished ferment.',",
   "summary: 'Documented microbial succession happens in a fermenting brine: Leuconostoc mesenteroides gets things started, then Lactobacillus plantarum takes over and dominates the finished ferment.',"],
  ["yield: 'Makes about 4 cups. A real fermented batch, kept in the fridge, easily lasts 2 people several weeks as a regular side.',",
   "yield: 'Makes about 4 cups. A fermented batch, kept in the fridge, easily lasts 2 people several weeks as a regular side.',"],
  ["'Massage and squeeze the cabbage with your hands for 5-10 minutes, until it releases its own real liquid and softens noticeably.',",
   "'Massage and squeeze the cabbage with your hands for 5-10 minutes, until it releases its own liquid and softens noticeably.',"],
  ["'Pack the cabbage tightly into a clean jar, pressing down firmly so the liquid rises above the cabbage itself -- this liquid is what keeps oxygen out and lets fermentation happen safely.',",
   "'Pack the cabbage tightly into a clean jar, pressing down firmly so the liquid rises above the cabbage itself. This liquid is what keeps oxygen out and lets fermentation happen safely.',"],
  ["'Cover loosely (a real ferment needs to release gas) and leave it at room temperature for 1-4 weeks, tasting every few days until it reaches the tang you like.',",
   "'Cover loosely (a ferment needs to release gas) and leave it at room temperature for 1-4 weeks, tasting every few days until it reaches the tang you like.',"],
  ["{ nutrient: 'Vitamin K', note: 'A real 79-106% of a day\\'s worth per half-cup serving.' },",
   "{ nutrient: 'Vitamin K', note: 'A striking 79-106% of a day\\'s worth per half-cup serving.' },"],
  ["note: 'Raw cabbage carries a real goitrogenic compound that can interfere with the thyroid\\'s own iodine uptake in large, regular raw amounts. Fermentation genuinely helps here -- the fermentation process itself, and the acidity it produces, measurably reduces this compound compared to eating the cabbage fully raw, which is part of why fermented cabbage is generally treated more leniently than a raw cabbage salad.' },",
   "note: 'Raw cabbage carries a goitrogenic compound that can interfere with the thyroid\\'s own iodine uptake in large, regular raw amounts. Fermentation helps here: the fermentation process itself, and the acidity it produces, measurably reduces this compound compared to eating the cabbage fully raw, which is part of why fermented cabbage is generally treated more leniently than a raw cabbage salad.' },"],
  ["flavorNotes: 'Real homemade sauerkraut is genuinely sour and a little effervescent, with a crunch that store-bought pasteurized kraut (which kills off the live cultures and softens the texture) just doesn\\'t have. The exact tang and complexity shift as it ferments longer, so tasting along the way is part of the process.',",
   "flavorNotes: 'Homemade sauerkraut is noticeably sour and a little effervescent, with a crunch that store-bought pasteurized kraut (which kills off the live cultures and softens the texture) just doesn\\'t have. The exact tang and complexity shift as it ferments longer, so tasting along the way is part of the process.',"],
  ["teaser: 'Sweetened tea, fermented by a real SCOBY culture.',",
   "teaser: 'Sweetened tea, fermented by a SCOBY culture.',"],
  ["yield: 'Makes about 8 cups. A real batch meant to be brewed once and shared across a week or more between 2 people.',",
   "yield: 'Makes about 8 cups. A batch meant to be brewed once and shared across a week or more between 2 people.',"],
  ["{ text: 'A SCOBY (symbiotic culture of bacteria and yeast), plus about 1 cup of starter liquid from a previous batch or a bottle of real, unflavored, unpasteurized kombucha' },",
   "{ text: 'A SCOBY (symbiotic culture of bacteria and yeast), plus about 1 cup of starter liquid from a previous batch or a bottle of plain, unflavored, unpasteurized kombucha' },"],
  ["'Brew the black tea strong and dissolve the sugar into it while it\\'s still hot, then let it cool completely to room temperature -- adding a SCOBY to hot tea will kill it.',",
   "'Brew the black tea strong and dissolve the sugar into it while it\\'s still hot, then let it cool completely to room temperature. Adding a SCOBY to hot tea will kill it.',"],
  ["'Cover the jar with a breathable cloth (not an airtight lid -- the culture needs some airflow) and secure it with a rubber band.',",
   "'Cover the jar with a breathable cloth, not an airtight lid, since the culture needs some airflow, and secure it with a rubber band.',"],
  ["'For a fizzier drink, bottle it in a sealed bottle for another 2-3 days at room temperature (this second, sealed ferment is what builds real carbonation), then refrigerate.',",
   "'For a fizzier drink, bottle it in a sealed bottle for another 2-3 days at room temperature (this second, sealed ferment is what builds carbonation), then refrigerate.',"],
  ["flavorNotes: 'Real homemade kombucha lands somewhere between a tart apple cider vinegar and a light, effervescent soda -- tangy, a little funky, and genuinely alive in a way flat, shelf-stable drinks aren\\'t. The exact flavor shifts with brew time, so a shorter ferment stays sweeter and a longer one gets noticeably more sour.',",
   "flavorNotes: 'Homemade kombucha lands somewhere between a tart apple cider vinegar and a light, effervescent soda: tangy, a little funky, and genuinely alive in a way flat, shelf-stable drinks aren\\'t. The exact flavor shifts with brew time, so a shorter ferment stays sweeter and a longer one gets noticeably more sour.',"],
];

let missing = [];
for (const [oldStr, newStr] of pairs) {
  if (!text.includes(oldStr)) { missing.push(oldStr.slice(0, 70)); continue; }
  text = text.split(oldStr).join(newStr);
}
fs.writeFileSync(FILE, text, 'utf8');
if (missing.length) { console.log('MISSING (not found):'); missing.forEach(m => console.log(' -', m)); }
else console.log('All', pairs.length, 'replacements applied.');
