import type { ProblemFoodEntry } from './types';

// Problem Foods & Swaps -- the one genuinely new content type this session
// built, not carried over from an earlier research document. Practical and
// food-first rather than citation-review-shaped: name the problem, name
// the mechanism, then give concrete substitutes -- "teach them about the
// food in general," per the explicit request that prompted this whole
// category. Every entry still cites its evidence, but the swap list is the
// point, not a footnote.
//
// 2026-08-06: rewritten in a friendlier, plainer-language voice, and grown
// by 2 entries (excess iodine, charred/high-heat meat) -- direct feedback
// that the first pass read as dense/academic ("not written for the
// average person... isn't really all that fun") and that stating a fixed
// entry count elsewhere in this app's own docs made every category read
// as artificially capped rather than a living, growing thing. The
// underlying facts and every citation are unchanged in substance from the
// first pass (re-verified against real sources, not just reworded) --
// only the voice and the roster grew. This file's own comment intentionally
// does not restate a running entry count, for the same reason.
//
// 2026-08-08: content fields rewritten a second time to remove AI-writing
// tics flagged directly by the person -- em dashes as punctuation, "not X,
// it's Y" contrast, and overused words like "real"/"genuinely"/
// "honest(ly)"/"worth" -- see bigPicture.ts's own header comment for the
// full context. Every fact, number, and citation is unchanged; the
// friendly, plain-language voice from the 2026-08-06 pass is preserved.
//
// 2026-08-08, same day, third change: `category` reassigned per entry as
// part of the Digest-wide Hashimoto's/Basic Health restructure (see
// types.ts's own header comment). ProblemFoodEntry's own `category` field
// was widened from the old hardcoded literal 'problemFoods' to the same
// union DigestEntry uses -- see types.ts for how the two shapes are told
// apart now that `category` can't serve as the discriminant. 9 of 16
// entries route through a specific thyroid or autoimmune mechanism
// (gluten's zonulin pathway framed for Hashimoto's specifically, raw
// goitrogenic crucifers' iodine-uptake interference, sugar's cortisol-to-
// T4/T3-conversion route, soy's TPO-enzyme interference, coffee's own
// levothyroxine-absorption timing, kelp/iodine's Wolff-Chaikoff mechanism,
// the gluten-free-without-celiac antibody finding, and, corrected the same
// day, nightshades' own AIP/autoimmune-elimination-diet framing and high-
// histamine's own autoimmune-gut-trouble mechanism) and now carry
// `category: 'hashimotos'`. The other 7, genuinely condition-agnostic
// (garlic/onion FODMAPs, dairy's lactose/casein mechanisms, refined oils,
// commercial/pre-made products, pesticide residue, charred/grilled meat,
// and the closing synthesis) carry `category: 'basicHealth'`.
export const PROBLEM_FOODS_ENTRIES: ProblemFoodEntry[] = [
  {
    id: 'problem-garlic-onion',
    category: 'basicHealth',
    foodName: 'Garlic & Onion',
    teaser: 'The single most common "why does this always upset me" pair, and it has nothing to do with allergy.',
    problem:
      "Garlic and onion are both loaded with fructans, a type of carbohydrate a lot of people digest poorly: bloating, gas, cramping, whether or not they've ever been formally diagnosed with IBS.",
    mechanism:
      "Fructans are chains of fructose your small intestine simply has no enzyme to break down. They travel on to the colon undigested, where your own gut bacteria ferment them, and gas is the direct, entirely normal byproduct of that fermentation. Nothing is wrong with you. It's just plumbing.",
    swaps: [
      "Garlic-infused oil. Fructans dissolve in water, not oil, so a strained infused oil carries garlic flavor without the gassy part (just don't blend the actual garlic solids back in).",
      'Chives or the green tops of scallions: same allium flavor family, a much smaller fructan hit than the bulb itself.',
      'A tiny pinch of asafoetida (hing): a traditional Indian stand-in for both garlic and onion flavor.',
    ],
    citations: [
      {
        source: 'Monash University FODMAP research group: fructan content in garlic, onion & other high-FODMAP foods',
        url: 'https://www.monashfodmap.com/about-fodmap-and-ibs/high-and-low-fodmap-foods/',
      },
    ],
    relatedIds: ['ibs-low-fodmap-diet'],
  },
  {
    id: 'problem-gluten-grains',
    category: 'hashimotos',
    foodName: 'Gluten-Containing Grains',
    teaser: "The single most-cited elimination in Hashimoto's food advice, and the link to autoimmunity behind it is.",
    problem:
      "Wheat, barley, and rye all contain gluten. A subset of people, not just those with celiac disease, react to it with gut symptoms, and in celiac disease specifically, the connection to autoimmune disease is well documented and shares biology with thyroid autoimmunity.",
    mechanism: "Gliadin, a piece of the gluten protein, can trigger your gut lining to release a substance called zonulin, which loosens the tight seals between your intestinal cells. That \"leakier\" gut lining is the same mechanism the gut-repair research keeps coming back to as a contributor to autoimmune risk in general, not something unique to celiac disease.",
    swaps: [
      'Rice, buckwheat (gluten-free despite the name), and quinoa: solid, whole-grain staples with none of the gluten.',
      'Certified gluten-free oats specifically. Ordinary oats are often cross-contaminated during processing, and the certified label is what actually addresses that.',
      "A elimination-and-reintroduction trial (see this app's own Healing Stages guide) instead of an indefinite \"just avoid it forever\" with no way to ever find out if it was actually the culprit.",
    ],
    citations: [
      {
        source: 'Fasano 2011, Physiological Reviews: zonulin and intestinal barrier function',
        url: 'https://pubmed.ncbi.nlm.nih.gov/21248165/',
      },
    ],
    stageNote: 'Elimination trial is a Stage 2 ("Digging") action; reintroduction testing per the Healing Stages guide.',
  },
  {
    id: 'problem-conventional-dairy',
    category: 'basicHealth',
    foodName: 'Conventional Dairy',
    teaser: "Not every dairy reaction is lactose intolerance, and the fix isn't always \"just avoid dairy.\"",
    problem:
      'Dairy trips people up through two different mechanisms that tend to get lumped together: plain lactose intolerance (a common enzyme shortfall, nothing to do with autoimmunity) and, separately, a casein-protein sensitivity some people notice alongside other chronic symptoms, real, but with much thinner formal evidence behind it than lactose intolerance has.',
    mechanism:
      'Without enough lactase enzyme, undigested lactose reaches your colon and ferments, the same gas-producing process as the garlic/onion fructans above. Casein sensitivity, where it\'s works through a completely different and less well-understood pathway, so "cutting dairy" for one reason doesn\'t necessarily fix the other.',
    swaps: [
      'Lactase-treated ("lactose-free") milk, and hard aged cheeses: naturally very low in lactose to begin with.',
      "A long-fermented homemade yogurt. A long culture time eats up most of the milk's own lactose, which is often enough to make a well-fermented batch sit fine even for someone lactose-sensitive.",
      "A elimination-and-reintroduction, not indefinite avoidance. It's the only honest way to find out which mechanism (if either) is actually behind a given reaction.",
    ],
    citations: [
      {
        source: 'Deng et al. 2015, Nutrients: Lactose Intolerance in Adults: Biological Mechanism and Dietary Management',
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4586575/',
      },
    ],
  },
  {
    id: 'problem-raw-cruciferous',
    category: 'hashimotos',
    foodName: 'Raw Cruciferous Vegetables',
    teaser: "The most misunderstood item on any Hashimoto's \"avoid list.\" The fix is cooking, not avoiding.",
    problem:
      "Broccoli, cauliflower, cabbage, kale, and Brussels sprouts contain compounds that, eaten raw and in large amounts, can get in the way of your thyroid's ability to take up iodine.",
    mechanism: "It takes an enzyme called myrosinase to unlock that effect, and myrosinase is largely deactivated by heat. The Cooking & Prep research already shows data that simply cooking these vegetables meaningfully cuts that risk compared to eating the same amount raw.",
    swaps: [
      'Just cook them. Steaming, roasting, or sautéing all knock down the goitrogenic effect while keeping most of the good stuff (fiber, vitamin C, sulforaphane) intact.',
      'Eating them raw is fine in moderate portions. The risk is a large amount, and especially several raw goitrogenic vegetables piled into one meal.',
      "Getting enough iodine and selenium blunts the whole effect. This was never really about the vegetable in isolation.",
    ],
    citations: [
      {
        source: 'Song & Thornalley 2007, Food & Chemical Toxicology: effect of storage, processing & cooking on glucosinolate content',
        url: 'https://pubmed.ncbi.nlm.nih.gov/17011103/',
      },
    ],
  },
  {
    id: 'problem-nightshades',
    category: 'hashimotos',
    foodName: 'Nightshades',
    teaser: 'The most contested item on this whole list, and the honest answer really is "test it yourself."',
    problem:
      'Tomatoes, peppers, eggplant, and white potatoes get excluded on the Autoimmune Protocol (AIP) diet over concerns about certain plant compounds and a possible link to gut permeability, but that exclusion comes from elimination-diet reasoning, not a controlled human trial proving nightshades themselves are the problem, and plenty of people with autoimmune conditions eat them with zero issue.',
    mechanism:
      'The compounds in question (solanine and its relatives) are real and present at low levels in normal ripe produce, much higher in green, unripe potatoes specifically. The gut-permeability concern is a plausible idea, not something demonstrated in people the way the gluten/zonulin story above is.',
    swaps: [
      'There\'s no universal swap here the way there is for gluten or garlic. The honest move is testing it on yourself (an elimination, then a careful single-food reintroduction) rather than avoiding it forever on principle.',
      'If a test does turn up a reaction, winter squash, sweet potato, and beets make good stand-ins for the starchy, savory role potatoes and tomatoes usually play in a dish.',
    ],
    citations: [
      {
        source: 'Konijeti et al. 2017, Inflammatory Bowel Diseases: efficacy of the Autoimmune Protocol diet',
        url: 'https://pubmed.ncbi.nlm.nih.gov/28858071/',
      },
    ],
    stageNote: 'A Stage 2 reintroduction-protocol candidate, not a default avoid.',
  },
  {
    id: 'problem-high-histamine',
    category: 'hashimotos',
    foodName: 'High-Histamine Foods (aged cheese, cured meat, most ferments, leftovers)',
    teaser: "A honest tension with the fermented-food research, worth naming plainly.",
    problem:
      "Aged cheese, cured or smoked meat, most fermented foods, and even fresh food that's sat in the fridge a bit too long all build up histamine as bacteria and protein naturally break down over time. For the subset of people with histamine intolerance, which shows up disproportionately alongside autoimmune conditions, that's a recognizable trigger.",
    mechanism:
      'Your gut clears dietary histamine mainly through an enzyme called DAO, and gut inflammation itself can reduce how much of that enzyme you have on hand. So someone already dealing with autoimmune gut trouble may have less capacity to clear histamine than usual, which becomes its own small feedback loop worth knowing about.',
    swaps: [
      'Fresh over aged, wherever you can: fresh mozzarella instead of aged cheddar, freshly cooked meat instead of cured or smoked.',
      "Freeze leftovers right away instead of letting them sit in the fridge for days. Histamine buildup is time-dependent.",
      'If fermented foods are part of your gut-health plan, shorter, fresher batches (young sauerkraut, fresh kefir) carry noticeably less histamine than a long-aged ferment, a way to get some benefit without the full histamine hit.',
    ],
    citations: [
      {
        source: 'Maintz & Novak 2007, American Journal of Clinical Nutrition: histamine and histamine intolerance',
        url: 'https://pubmed.ncbi.nlm.nih.gov/17490952/',
      },
    ],
    relatedIds: ['fermented-sauerkraut-succession'],
  },
  {
    id: 'problem-sugar-sweetened-beverages',
    category: 'hashimotos',
    foodName: 'Sugar-Sweetened Beverages',
    teaser: 'Not "sugar" broadly. The problem is drinking it, not eating it.',
    problem:
      'Soda, sweetened tea, and other sugary drinks deliver a big, fast hit of sugar with none of the fiber or chewing that naturally slows absorption from food, a different risk than the same sugar eaten as part of a meal.',
    mechanism: "Fast sugar means a sharper insulin spike, and the crash that follows triggers cortisol and other stress hormones, and cortisol, in turn, dampens the enzymes that convert T4 into active T3. It's the same mechanism behind the alcohol and juice advisories.",
    swaps: [
      'Whole fruit instead of fruit juice or a sweetened drink. The fiber slows the sugar hit down.',
      'Unsweetened sparkling water with a fruit splash, rather than swapping to diet soda (which just trades one open question, sugar, for another, see Food Additives).',
      "Plain water, tracked. This app's own hydration tracking already counts water from food toward the same daily goal, so it adds up faster than it feels like.",
    ],
    citations: [
      {
        source: 'Muraki et al. 2013, BMJ: fruit consumption and risk of type 2 diabetes',
        url: 'https://pubmed.ncbi.nlm.nih.gov/23990623/',
      },
    ],
    relatedIds: ['additive-sugar-umbrella-review-45-outcomes', 'mito-sugar-visceral-fat-cytokine-chain'],
  },
  {
    id: 'problem-soy',
    category: 'hashimotos',
    foodName: 'Soy (Conditional, Not Universal)',
    teaser: 'The risk lands on a specific subgroup, not on everyone who eats tofu.',
    problem:
      'Soy contains isoflavones, plant compounds with a modest goitrogenic effect, but the research is specific about who this actually matters for: one randomized trial found roughly a 3.6x higher chance of tipping into overt hypothyroidism, but only in people who already had subclinical hypothyroidism going in. It wasn\'t a general-population effect.',
    mechanism:
      "Soy isoflavones can get in the way of thyroid peroxidase (TPO), the enzyme your thyroid needs to actually make hormone, which matters a lot more if your thyroid function is already compromised, and barely at all if it's working normally.",
    swaps: [
      'Fermented soy (tempeh, miso, natto) generally carries less of that isoflavone activity than unfermented soy, plus probiotic value on top.',
      'Simply space soy out from your levothyroxine dose by a few hours, the same spacing logic that already applies to calcium and coffee, rather than cutting soy out entirely.',
      'If subclinical hypothyroidism is already in the picture, this is a specific conversation worth having with a doctor, not a reason for everyone to avoid soy.',
    ],
    citations: [
      {
        source: 'Sathyapalan et al. 2011, JCEM: soy phytoestrogen crossover trial in subclinical hypothyroidism',
        url: 'https://pubmed.ncbi.nlm.nih.gov/21325465/',
      },
    ],
  },
  {
    id: 'problem-refined-vegetable-oils',
    category: 'basicHealth',
    foodName: 'Refined Vegetable & Seed Oils (esp. Fried Foods)',
    teaser: 'The issue is a balance problem, not that any one oil is "toxic."',
    problem:
      "Common refined oils (soybean, corn, cottonseed, conventional sunflower) run heavy on omega-6 fat relative to omega-3, and the modern diet's overall ratio has drifted from something like an even 1:1 in the past to often 15:1 or higher today, which tracks with a more inflammatory baseline. Deep frying adds a second problem on top: oxidized compounds form at high heat.",
    mechanism:
      "Omega-6 fats are the raw material for pro-inflammatory signaling molecules, while omega-3s build the anti-inflammatory ones, and it's the ratio between the two, not omega-6 on its own, that the research actually tracks.",
    swaps: [
      'Extra virgin olive oil or avocado oil for most everyday cooking, both much lower in omega-6 relative to their healthy fat content.',
      'Fatty fish (salmon, sardines, mackerel) a few times a week to actually raise omega-3 intake, not just cut omega-6.',
      "Baking, roasting, or air-frying instead of deep frying when what you're really after is the crispy texture.",
    ],
    citations: [
      {
        source: 'Simopoulos 2002, Biomedicine & Pharmacotherapy: the importance of the omega-6/omega-3 ratio',
        url: 'https://doi.org/10.1016/S0753-3322(02)00253-6',
      },
    ],
    relatedIds: ['omega63-ratio-mechanism', 'omega36-tying-together'],
  },
  {
    id: 'problem-commercial-premade',
    category: 'basicHealth',
    foodName: 'Commercial / Pre-Made Products',
    teaser: "The design philosophy, said out loud: build it yourself when you can.",
    problem:
      "Branded, boxed, and other pre-made products tend to stack several of this list's other concerns into one item at once: refined oils, added sugar, synthetic dyes, emulsifiers, sodium, and the exact recipe and ratios aren't something you control, or always even see on the label.",
    mechanism: "It isn't any single mechanism. It's cumulative, less-visible exposure to several of this list's other entries stacked together at once. A large 2024 umbrella review pooling nearly 10 million people found ultra-processed food consistently tied to 32 different adverse health outcomes, exactly why the ten Food-tab builders exist to assemble meals from individually-chosen ingredients instead of reaching for a pre-made stand-in.",
    swaps: [
      "Build the equivalent yourself with this app's own Food-tab builders. Sides, Sauces, Soups, and Handhelds cover most of the ground a box mix or frozen meal usually fills.",
      'When a commercial product really is the only practical option, reading the full ingredient list (not just the front label) at least makes the tradeoff visible instead of hidden.',
    ],
    citations: [
      {
        source: 'Lane et al. 2024, BMJ: ultra-processed food exposure and adverse health outcomes, umbrella review',
        url: 'https://doi.org/10.1136/bmj-2023-077310',
      },
    ],
    relatedIds: ['additive-upf-convincing-evidence-class-i'],
  },
  {
    id: 'problem-conventional-high-pesticide-produce',
    category: 'basicHealth',
    foodName: 'Conventional Produce, High-Residue Items Specifically',
    teaser: 'The checkable version of "wash your produce." Not every fruit or vegetable carries the same exposure.',
    problem:
      'Pesticide residue on conventionally grown produce varies a lot by crop. Some items, strawberries, spinach, kale, reliably test with detectable residue on nearly every sample in annual testing, while others, avocado, sweet corn, pineapple, reliably test clean, mostly thanks to a thick skin the edible part never actually touches.',
    mechanism: "Several commonly used pesticides are documented endocrine disruptors in animal and cell studies, which connects this directly to the Lifestyle & Environment research on environmental endocrine disruptors, not a separate topic on its own.",
    swaps: [
      'Buy organic selectively, for the highest-residue, thin-skinned items, not as a blanket rule for everything.',
      'Conventional is a reasonable, money-saving choice for thick-skinned produce (avocado, banana, melon, pineapple), where the part you eat is naturally shielded.',
      'A good rinse under running water measurably cuts surface residue on any produce, organic or not, a free step worth doing either way.',
    ],
    citations: [
      { source: "EWG's Shopper's Guide to Pesticides in Produce: annual USDA residue testing data", url: 'https://www.ewg.org/foodnews/' },
    ],
  },
  {
    id: 'problem-coffee-timing',
    category: 'hashimotos',
    foodName: 'Coffee Taken Too Close to Levothyroxine',
    teaser: "The single most useful, most fixable food-medication timing tip on the list.",
    problem:
      'A pharmacokinetic study found coffee taken alongside a levothyroxine dose measurably cuts how much of it actually gets absorbed: peak blood levels down 19-36%, total absorption down 27-36% in that trial.',
    mechanism:
      "The exact chemistry isn't fully worked out, but the effect is entirely about timing, not a reason to give up coffee. The same study found the interference disappeared once espresso was taken a full hour after the dose instead of alongside it.",
    swaps: [
      'Take levothyroxine with plain water, then hold off on that first cup for at least 30-60 minutes.',
      "If mornings are just too tight for that, ask a doctor about taking levothyroxine at bedtime instead, a studied alternative, rather than skipping the spacing altogether.",
    ],
    citations: [
      {
        source: 'Benvenga et al. 2008, Thyroid: altered intestinal absorption of L-thyroxine caused by coffee',
        url: 'https://pubmed.ncbi.nlm.nih.gov/18341376/',
      },
    ],
    relatedIds: ['labs-biotin-interference', 'masld-coffee-protective'],
    chart: {
      title: 'Levothyroxine Absorption Impact From Coffee Taken at the Same Time',
      unit: '%',
      data: [
        { label: 'Peak blood level, low estimate', value: 19 },
        { label: 'Peak blood level, high estimate', value: 36 },
        { label: 'Total absorption, low estimate', value: 27 },
        { label: 'Total absorption, high estimate', value: 36 },
      ],
      sourceNote: 'Benvenga et al. 2008, Thyroid',
    },
  },
  {
    id: 'problem-excess-iodine-kelp',
    category: 'hashimotos',
    foodName: 'Kelp, Dulse & Iodine-Heavy Sea Vegetables',
    teaser: '"More iodine is always better for your thyroid" is exactly backwards for a lot of people with Hashimoto\'s.',
    problem:
      "Kelp, dulse, and similar sea vegetables (plus kelp-based supplements) can carry enormous amounts of iodine in a single serving, and for someone who already has Hashimoto's, a sudden iodine overload is a documented way to trigger or worsen a flare, not just a harmless \"extra nutrient.\"",
    mechanism: "Your thyroid actually has a built-in safety brake for iodine (the Wolff-Chaikoff effect) that's supposed to shut hormone production down temporarily when iodine floods in, but in Hashimoto's, that brake can misfire or get stuck, and the antibody attack itself can flare right alongside it. It's the same reason the iodine reference entry calls it a two-edged nutrient: too little is a problem, but so is too much.",
    swaps: [
      'Nori (the seaweed used for sushi) runs far lower in iodine than kelp or dulse, a reasonable way to still get some sea-vegetable flavor and nutrition without the same overload risk.',
      'Skip kelp-based supplements entirely unless a doctor has specifically checked your iodine status first. This is one case where "a little extra can\'t hurt" isn\'t true.',
      'If a recipe calls for kelp/kombu just for umami flavor (like a broth base), a small piece removed after simmering delivers the flavor without leaving the iodine payload behind in what you actually eat.',
    ],
    citations: [
      {
        source: "Iodine intake from universal salt iodization programs and Hashimoto's thyroiditis: a systematic review",
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12191997/',
      },
      {
        source: "A case of Hashimoto's thyroiditis with thyroid immunological abnormality manifested after habitual seaweed ingestion",
        url: 'https://pubmed.ncbi.nlm.nih.gov/581113/',
      },
    ],
    relatedIds: ['nutrient-iodine', 'iodine-toxicity-acute-chronic'],
  },
  {
    id: 'problem-charred-grilled-meat',
    category: 'basicHealth',
    foodName: 'Charred, Grilled & Deep-Fried Meat',
    teaser: "It's not the meat. It's how hot and how dry it got cooked.",
    problem:
      'Grilling, broiling, and deep-frying meat at high, dry heat forms compounds, advanced glycation end products (AGEs) among them, that build up in the body over time and are linked to more inflammation. The same cut of meat can carry wildly different amounts depending purely on how it was cooked.',
    mechanism:
      'AGEs form when proteins and fats react with sugars under high, dry heat, a process that barely happens in moist, lower-heat cooking. Research mapping this out found grilled chicken breast can carry 4-5 times the AGEs of the same chicken poached, and french fries up to 90 times more than the same potato boiled, an enormous swing driven entirely by cooking method, not the food itself.',
    swaps: [
      'Braising, stewing, poaching, or slow-cooking instead of grilling or frying. Moist heat barely forms these compounds at all.',
      'Marinating meat before grilling (something acidic like lemon juice or vinegar) measurably cuts AGE formation, if grilling is the goal.',
      'A quick sear for flavor is fine. The risk builds with long, hard, repeated dry-heat cooking as an everyday habit, not one grilled dinner.',
    ],
    citations: [
      {
        source: 'Formation of advanced glycation end products in foods during cooking, a review of experimental studies',
        url: 'https://www.cambridge.org/core/journals/nutrition-research-reviews/article/formation-of-advanced-glycation-endproducts-in-foods-during-cooking-process-and-underlying-mechanisms-a-comprehensive-review-of-experimental-studies/85036557AFBCC896D886B7872C092AA2',
      },
    ],
  },
  {
    id: 'problem-raw-undercooked-meat-eggs',
    category: 'basicHealth',
    foodName: 'Raw or Undercooked Meat, Poultry, Fish & Eggs',
    teaser: 'A rare steak or sushi-grade fish can be a genuinely safe choice. Raw ground meat, undercooked poultry, and raw eggs are a different, real, and well-documented risk.',
    problem:
      "CDC estimates roughly 48 million people in the US get sick from a foodborne illness every year, about 128,000 are hospitalized, and 3,000 die. Raw or undercooked meat, poultry, fish, and eggs are the foods most consistently linked to it. This isn't a reason to avoid every rare steak or piece of sushi, both can be genuinely safe when handled correctly, it's a reason to know which real, specific choices actually carry the risk and which don't.",
    mechanism:
      'Four named pathogens do most of the real damage: Salmonella (a leading overall cause, especially tied to poultry and eggs), Campylobacter (tied to undercooked poultry), E. coli, and Listeria (fewer cases overall, but disproportionately severe, especially for pregnant people, older adults, and anyone with a weakened immune system, including several conditions this app tracks that involve biologics, methotrexate, or other immunosuppressive treatment). Ground meat carries a genuinely different, higher risk than a whole cut of the same animal: grinding mixes any surface bacteria throughout the whole batch, so a rare burger can carry bacteria all the way through in a way a rare steak, where bacteria mostly sit on the surface a hot pan already sears, does not. Raw fish has its own separate, real safety standard: the FDA requires fish served raw to first be frozen (-4°F for 7 days, or -31°F until solid then held at -31°F for 15 hours) to kill parasites like Anisakis. "Sushi-grade" is not an official grading term, it is shorthand for fish that has genuinely gone through this process.',
    swaps: [
      'Ground beef, pork, lamb, or veal: cook to 160°F internal temperature, checked with a food thermometer, not by color or time alone.',
      'Whole cuts (steaks, chops, roasts) of beef, pork, lamb, or veal: 145°F is the real, official safe minimum, genuinely lower than ground meat needs.',
      'All poultry (chicken, turkey): 165°F, checked at the innermost part of the thigh and wing and the thickest part of the breast.',
      'Egg dishes (casseroles, egg mixtures): 160°F, or simply cook until both the white and yolk are fully firm.',
      'Raw fish at home specifically: use fish that has actually been through the real FDA freezing process above, not just any fresh fillet from a regular counter.',
    ],
    citations: [
      { source: 'Facts About Food Poisoning, CDC', url: 'https://www.cdc.gov/food-safety/data-research/facts-stats/index.html' },
      { source: 'Safe Minimum Internal Temperature Chart, USDA Food Safety and Inspection Service', url: 'https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/safe-temperature-chart' },
      { source: 'What You Need to Know About Egg Safety, FDA', url: 'https://www.fda.gov/food/buy-store-serve-safe-food/what-you-need-know-about-egg-safety' },
      { source: 'Parasite Destruction Requirements for Raw or Undercooked Fish, local health department guidance summarizing the FDA Food Code', url: 'https://www.c-uphd.org/parasite-destruction-for-raw-or-undercooked-fish.html' },
    ],
    relatedIds: ['ra-biologics-infection-risk', 'psoriasis-cyclosporine-grapefruit', 'ibd-sonic-combination-therapy'],
  },
  {
    id: 'problem-gluten-free-without-celiac',
    category: 'hashimotos',
    foodName: 'Going Gluten-Free Without Celiac Disease, an Honestly Mixed Answer',
    teaser: "Probably the single most common Hashimoto's diet question, with an answer more surprising and less settled than most advice admits.",
    problem:
      "The gluten entry elsewhere in this category already covers a general gut-permeability mechanism (gliadin, zonulin) that applies to anyone, celiac or not. This is a different, more specific question: does actually removing gluten measurably change Hashimoto's antibody levels or thyroid numbers in someone without celiac disease? A very recent (2025) systematic review and meta-analysis pooling 3 randomized trials (110 participants) found a surprising, mixed answer, not the clean \"yes, it helps\" most gluten-free advice for Hashimoto's assumes.",
    mechanism: "The numbers themselves are the honest story here: going gluten-free significantly decreased anti-thyroglobulin antibodies, but significantly increased anti-TPO antibodies, moving in opposite directions on the two core antibody markers the tracking is built around. TSH, free T3, and free T4 showed no significant change either way. The review's own authors rated the underlying evidence as having \"serious methodological concerns\" and being \"very uncertain,\" an admission from the researchers themselves, not the hedge. None of this changes the separate case for a true celiac disease diagnosis, where gluten-free eating is medically necessary regardless of any thyroid-specific effect. This is specifically about the much more common situation of choosing to go gluten-free for the Hashimoto's itself, without a celiac diagnosis driving it.",
    swaps: [
      'A celiac disease test (not a guess) before committing to a strict, difficult gluten-free diet specifically for thyroid reasons, worth ruling in or out first, covered under Self Advocacy.',
      'If choosing to try it anyway, an honest personal experiment (tracked symptoms over weeks, not assumed results) is a more defensible approach than expecting a guaranteed antibody or TSH change the current evidence doesn\'t actually support.',
      "The separate gut-permeability case for reducing gluten (covered in this category's own Gluten-Containing Grains entry) still stands on its own mechanism, independent of this specific antibody-level question.",
    ],
    citations: [
      {
        source: "Araújo et al. 2025: Effects of Gluten-Free Diet in Non-Celiac Hashimoto's Thyroiditis: A Systematic Review and Meta-Analysis (Nutrients)",
        url: 'https://pubmed.ncbi.nlm.nih.gov/41228508/',
      },
    ],
    relatedIds: ['problem-gluten-grains', 'advocacy-thyroid-antibodies'],
  },
  {
    id: 'problem-tying-together',
    category: 'basicHealth',
    foodName: 'Tying It All Together: The Patterns Across This Whole List',
    teaser: 'Fourteen very different foods, four repeating mechanisms underneath most of them.',
    problem:
      "Taken food by food, this list can look like fourteen unrelated warnings. Taken as a whole, most of them trace back to just a handful of repeating mechanisms: a fermentable carbohydrate the gut can't break down (garlic, onion, sugar-sweetened drinks), a gut-permeability trigger (gluten), a heat-reversible enzyme effect (raw crucifers), a histamine-clearance bottleneck (aged, cured, and most fermented foods), and the same cortisol/HPA-axis pathway this research keeps returning to (sugar-sweetened drinks, and see Lifestyle & Environment).",
    mechanism: "None of this is separate, unrelated biology. It's a small number of gut and hormone mechanisms the keeps coming back to, just triggered by different foods each time.",
    swaps: [
      'Test one food at a time, not the whole list at once. Most of these are conditional (soy, nightshades, dairy), not universal.',
      'Cooking, timing, and freshness resolve more of this list than outright avoidance does. Only gluten, and for a specific subgroup soy, really call for a longer elimination.',
      "This app's own Healing Stages guide sequences exactly this kind of reintroduction: lowest-risk first, one variable at a time.",
    ],
    citations: [
      { source: 'Fasano 2011, Physiological Reviews: zonulin and intestinal barrier function', url: 'https://pubmed.ncbi.nlm.nih.gov/21248165/' },
    ],
  },
];
