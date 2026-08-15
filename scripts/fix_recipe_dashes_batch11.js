const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'lib', 'digest', 'recipes.ts');
let text = fs.readFileSync(FILE, 'utf8');

const pairs = [
  // Simple Whole Wheat Bread
  ["'Let it cool completely on a rack before slicing -- cutting it warm makes the crumb gummy.',",
   "'Let it cool completely on a rack before slicing. Cutting it warm makes the crumb gummy.',"],
  ["{ nutrient: 'Fiber', note: 'Around a quarter of a day\\'s fiber target per slice, from real, intact wheat bran.' },",
   "{ nutrient: 'Fiber', note: 'Around a quarter of a day\\'s fiber target per slice, from the intact wheat bran.' },"],
  ["note: 'This is a real, full-gluten wheat loaf, so if gluten is something you avoid, this one isn\\'t for you as written. The good news is it\\'s an easy swap: a 1:1 gluten-free flour blend works in this same recipe, just expect a slightly denser, less springy crumb since it\\'s missing gluten\\'s own stretch.' },",
   "note: 'This is a full-gluten wheat loaf, so if gluten is something you avoid, this one isn\\'t for you as written. The good news is it\\'s an easy swap: a 1:1 gluten-free flour blend works in this same recipe, just expect a slightly denser, less springy crumb since it\\'s missing gluten\\'s own stretch.' },"],
  ["flavorNotes: 'This bakes up hearty and a little nutty, the way whole wheat always does, with a firm, chewy crumb rather than the airy softness of a white sandwich loaf. The crust turns deep golden and genuinely crackly right out of the oven. It\\'s a plain, honest bread built for actual use -- toast, sandwiches, or torn straight off the loaf and dipped in olive oil -- not a delicate bakery showpiece.',",
   "flavorNotes: 'This bakes up hearty and a little nutty, the way whole wheat always does, with a firm, chewy crumb rather than the airy softness of a white sandwich loaf. The crust turns deep golden and properly crackly right out of the oven. It\\'s a plain, honest bread built for actual use: toast, sandwiches, or torn straight off the loaf and dipped in olive oil, not a delicate bakery showpiece.',"],

  // Homemade Wheat Tortillas
  ["'Divide the dough into 8 equal pieces, roll each into a ball, cover with a towel, and let them rest for 15 minutes -- this relaxes the gluten so they roll out easily instead of springing back.',",
   "'Divide the dough into 8 equal pieces, roll each into a ball, cover with a towel, and let them rest for 15 minutes. This relaxes the gluten so they roll out easily instead of springing back.',"],
  ["note: 'This is a genuine wheat-flour tortilla, so the gluten content is real and unavoidable as written. A gluten-free tortilla-style flour blend can be substituted directly in this same recipe -- it rolls out a little more delicately, so handle it gently when you flip it in the pan.' },",
   "note: 'This is an ordinary wheat-flour tortilla, so the gluten content is unavoidable as written. A gluten-free tortilla-style flour blend can be substituted directly in this same recipe. It rolls out a little more delicately, so handle it gently when you flip it in the pan.' },"],
  ["flavorNotes: 'Fresh tortillas taste like almost nothing else -- a little toasty, a little chewy, genuinely soft in a way that a package sitting on a shelf for weeks just can\\'t match. Warm, straight out of the skillet, they don\\'t even need a filling to be good on their own.',",
   "flavorNotes: 'Fresh tortillas taste like almost nothing else: a little toasty, a little chewy, soft in a way that a package sitting on a shelf for weeks just can\\'t match. Warm, straight out of the skillet, they don\\'t even need a filling to be good on their own.',"],

  // Whole Wheat Buttermilk Biscuits
  ["teaser: 'Flaky layers from cold butter and real buttermilk tang.',",
   "teaser: 'Flaky layers from cold butter and buttermilk tang.',"],
  ["summary: 'Buttermilk\\'s acidity reacts with baking powder for extra lift, and cold butter creates the real steam pockets that make a biscuit flaky rather than dense.',",
   "summary: 'Buttermilk\\'s acidity reacts with baking powder for extra lift, and cold butter creates the steam pockets that make a biscuit flaky rather than dense.',"],
  ["'Add the cold, cubed butter and cut it into the flour with your fingers or a pastry cutter, until the mixture looks like coarse, pea-sized crumbs -- keeping the butter cold and in visible pieces is what actually makes the layers.',",
   "'Add the cold, cubed butter and cut it into the flour with your fingers or a pastry cutter, until the mixture looks like coarse, pea-sized crumbs. Keeping the butter cold and in visible pieces is what actually makes the layers.',"],
  ["'Turn the dough onto a floured surface and pat it into a rectangle about ¾-inch thick. Fold it in thirds like a letter, then pat it out again -- this is what actually builds the flaky layers.',",
   "'Turn the dough onto a floured surface and pat it into a rectangle about ¾-inch thick. Fold it in thirds like a letter, then pat it out again. This is what actually builds the flaky layers.',"],
  ["note: 'This is a real, full-gluten wheat recipe. A gluten-free flour blend built for baking can generally stand in 1:1, though you may need a touch more buttermilk since gluten-free blends often absorb liquid differently.' },",
   "note: 'This is a full-gluten wheat recipe. A gluten-free flour blend built for baking can generally stand in 1:1, though you may need a touch more buttermilk since gluten-free blends often absorb liquid differently.' },"],
  ["flavorNotes: 'Warm from the oven, these have a genuine tang from the buttermilk balanced against real, salty butter richness, with a craggy golden top and layers that actually pull apart. Split one open and it\\'s begging for more butter or a spoonful of jam.',",
   "flavorNotes: 'Warm from the oven, these have a good tang from the buttermilk balanced against rich, salty butter, with a craggy golden top and layers that actually pull apart. Split one open and it\\'s begging for more butter or a spoonful of jam.',"],

  // Banana Oat Breakfast Cookies
  ["teaser: 'Soft, naturally sweetened, and genuinely fine for breakfast.',",
   "teaser: 'Soft, naturally sweetened, and perfectly fine for breakfast.',"],
  ["summary: 'Ripe banana replaces most of the added sugar and fat a standard cookie recipe would need, so most of what\\'s here is real, whole-food fiber and natural sweetness.',",
   "summary: 'Ripe banana replaces most of the added sugar and fat a standard cookie recipe would need, so most of what\\'s here is whole-food fiber and natural sweetness.',"],
  ["'Stir in the oats, ground flax, honey, and cinnamon until everything is evenly combined -- the mixture should hold together when pressed.',",
   "'Stir in the oats, ground flax, honey, and cinnamon until everything is evenly combined. The mixture should hold together when pressed.',"],
  ["'Let them cool on the sheet for a few minutes before moving them -- they firm up as they cool.',",
   "'Let them cool on the sheet for a few minutes before moving them. They firm up as they cool.',"],
  ["flavorNotes: 'These taste like banana bread in cookie form -- soft, a little chewy, warm with cinnamon, and sweet from ripe banana rather than a cup of sugar. They\\'re dense enough to actually be filling, which is exactly what a real breakfast cookie should be.',",
   "flavorNotes: 'These taste like banana bread in cookie form: soft, a little chewy, warm with cinnamon, and sweet from ripe banana rather than a cup of sugar. They\\'re dense enough to actually be filling, which is exactly what a good breakfast cookie should be.',"],
];

let missing = [];
for (const [oldStr, newStr] of pairs) {
  if (!text.includes(oldStr)) { missing.push(oldStr.slice(0, 70)); continue; }
  text = text.split(oldStr).join(newStr);
}
fs.writeFileSync(FILE, text, 'utf8');
if (missing.length) { console.log('MISSING (not found):'); missing.forEach(m => console.log(' -', m)); }
else console.log('All', pairs.length, 'replacements applied.');
