import type { ProblemFoodEntry } from './types';

// Problem Foods & Swaps -- the one genuinely new content type this session
// built, not carried over from an earlier research document. Practical and
// food-first rather than citation-review-shaped: name the real problem,
// name the real mechanism, then give real, concrete substitutes -- "teach
// them about the food in general," per the explicit request that prompted
// this whole category. Every entry still cites its real evidence, but the
// swap list is the point, not a footnote.
export const PROBLEM_FOODS_ENTRIES: ProblemFoodEntry[] = [
  {
    id: 'problem-garlic-onion',
    category: 'problemFoods',
    foodName: 'Garlic & Onion',
    teaser: 'The single most common "why does this always upset me" pair -- and it has nothing to do with allergy.',
    problem:
      'Garlic and onion are both extremely high in fructans, a type of FODMAP (fermentable oligo-, di-, mono-saccharide and polyol) that a real share of people -- not just those with a diagnosed IBS -- digest poorly, leading to bloating, gas, and cramping as gut bacteria ferment the undigested fructans in the colon.',
    mechanism:
      'Fructans are chains of fructose molecules the human small intestine has no enzyme to break down, so they pass through undigested to the colon, where bacterial fermentation produces gas as a direct byproduct -- a real digestive-mechanics issue, not an immune allergic reaction.',
    swaps: [
      'Garlic-infused oil -- FODMAPs are water-soluble, not oil-soluble, so infused oil carries real garlic flavor without the fructans (discard the actual garlic solids, don\'t blend them in).',
      'Chives or the green tops of scallions -- carry allium flavor with a much lower FODMAP load than the bulb itself.',
      'Asafoetida (hing) -- a traditional Indian substitute for both garlic and onion flavor, used in a tiny pinch.',
    ],
    citations: [{ source: 'Monash University FODMAP research group, fructan content database' }],
  },
  {
    id: 'problem-gluten-grains',
    category: 'problemFoods',
    foodName: 'Gluten-Containing Grains',
    teaser: 'The single most-cited elimination in Hashimoto\'s food advice -- and the celiac-autoimmunity link behind it is real.',
    problem:
      'Wheat, barley, and rye all contain gluten, a protein structure a genuine subset of people (not just those with celiac disease) react to with real gut symptoms and, in celiac disease specifically, a well-documented, mechanistically-linked autoimmune cascade that shares real biological overlap with thyroid autoimmunity.',
    mechanism:
      'Gliadin (a gluten component) can trigger zonulin release in the gut lining, increasing intestinal permeability -- the same mechanism this app\'s own gut-repair research names as a real contributor to autoimmune disease risk generally, not unique to celiac disease.',
    swaps: [
      'Rice, buckwheat (genuinely gluten-free despite the name), and quinoa -- whole-grain, naturally gluten-free staples.',
      'Certified gluten-free oats -- ordinary oats are often cross-contaminated during processing; the certified label specifically addresses that.',
      'A real elimination-and-reintroduction trial through Stage 2 of this app\'s own Healing Stages guide, rather than an indefinite blanket avoidance with no re-test plan.',
    ],
    citations: [{ source: 'Fasano 2011, Physiological Reviews (zonulin/intestinal permeability)' }],
    stageNote: 'Elimination trial is a Stage 2 ("Digging") action; reintroduction testing per the Healing Stages guide.',
  },
  {
    id: 'problem-conventional-dairy',
    category: 'problemFoods',
    foodName: 'Conventional Dairy',
    teaser: "Not every dairy reaction is lactose intolerance -- and the fix isn't always \"avoid dairy.\"",
    problem:
      'Conventional dairy is a common trigger through two genuinely different mechanisms that get conflated: lactose intolerance (a real enzyme deficiency, unrelated to autoimmunity) and, separately, a casein-protein sensitivity some people report alongside their thyroid symptoms, with much thinner formal evidence behind it.',
    mechanism:
      'Lactase deficiency means undigested lactose reaches the colon and ferments, the same gas-producing mechanism as FODMAPs above. Casein sensitivity, where reported, is a different and less well-characterized immune/digestive response, not the same pathway.',
    swaps: [
      'Lactase-treated (\"lactose-free\") milk and hard aged cheeses -- naturally very low in lactose to begin with.',
      'A real, long-fermented homemade yogurt -- extended fermentation measurably consumes much of the milk\'s own lactose as the culture feeds on it, often making a well-fermented batch tolerable even for lactose-sensitive people.',
      'Full elimination-and-reintroduction (not indefinite avoidance) is the only real way to tell which mechanism, if either, is actually in play for a given person.',
    ],
    citations: [{ source: 'Lactase deficiency prevalence and mechanism reviews' }],
  },
  {
    id: 'problem-raw-cruciferous',
    category: 'problemFoods',
    foodName: 'Raw Cruciferous Vegetables',
    teaser: 'The most misunderstood "avoid list" item in Hashimoto\'s food advice -- the fix is cooking, not avoiding.',
    problem:
      'Broccoli, cauliflower, cabbage, kale, and Brussels sprouts contain goitrogenic compounds (glucosinolates, which convert to goitrin) that, in large raw quantities, can interfere with thyroid iodine uptake.',
    mechanism:
      'The enzyme that converts glucosinolates to their active goitrogenic form (myrosinase) is substantially deactivated by heat -- this app\'s own Cooking & Prep research already cites real data showing cooking meaningfully reduces the goitrogenic load compared to eating the same vegetable raw.',
    swaps: [
      'Simply cook them -- steaming, roasting, or sautéing all reduce the goitrogenic compounds while keeping most of the real nutritional value (fiber, vitamin C, sulforaphane precursors) intact.',
      'If eating raw (a salad, a smoothie), keep portions moderate rather than large, and avoid stacking multiple raw goitrogenic vegetables in the same meal.',
      'Adequate iodine and selenium intake genuinely blunts goitrogenic impact -- this isn\'t purely about the vegetable in isolation.',
    ],
    citations: [{ source: 'Goitrogen/myrosinase heat-deactivation studies' }],
  },
  {
    id: 'problem-nightshades',
    category: 'problemFoods',
    foodName: 'Nightshades',
    teaser: 'The most genuinely contested item on this whole list -- and the honest answer is "test it yourself."',
    problem:
      'Tomatoes, peppers, eggplant, and white potatoes are excluded on the Autoimmune Protocol (AIP) diet over concerns about lectins, alkaloids (solanine), and a proposed link to intestinal permeability -- but this exclusion is elimination-based/mechanistic reasoning, not backed by controlled human trial evidence, and plenty of people with autoimmune conditions tolerate nightshades with no issue at all.',
    mechanism:
      'Solanine and related glycoalkaloids are real compounds present in nightshades at low levels in normal ripe produce (much higher in green/unripe potatoes specifically) -- the proposed gut-permeability link is mechanistically plausible but not demonstrated in controlled human research the way the gluten/zonulin pathway above is.',
    swaps: [
      "There isn't a universal swap here the way there is for gluten or garlic -- the real recommendation is individual testing (elimination, then a real single-food reintroduction) rather than blanket avoidance.",
      'If testing shows a real reaction: winter squash, sweet potato, and beets are common AIP-friendly stand-ins for the starchy/savory role potatoes and tomatoes play in a dish.',
    ],
    citations: [{ source: 'AIP protocol literature (Ballantyne, elimination-diet framework, not RCT-based)' }],
    stageNote: 'A Stage 2 reintroduction-protocol candidate, not a default avoid.',
  },
  {
    id: 'problem-high-histamine',
    category: 'problemFoods',
    foodName: 'High-Histamine Foods (aged cheese, cured meat, most ferments, leftovers)',
    teaser: 'A real, direct tension with this app\'s own fermented-food research -- worth naming honestly.',
    problem:
      'Aged cheese, cured/smoked meat, most fermented foods, and even fresh food left too long in the fridge accumulate histamine as a natural byproduct of bacterial activity and protein breakdown -- a real problem for the subset of people with histamine intolerance (often tied to reduced DAO enzyme activity), which shows up disproportionately often alongside autoimmune conditions.',
    mechanism:
      'Diamine oxidase (DAO), the enzyme that breaks down dietary histamine in the gut, can be reduced by gut inflammation itself -- meaning someone already dealing with autoimmune gut involvement may have less capacity to clear histamine than usual, creating a real feedback loop worth knowing about.',
    swaps: [
      'Choose fresh over aged wherever possible -- fresh mozzarella over aged cheddar, freshly cooked meat over cured/smoked.',
      'Freeze leftovers immediately rather than refrigerating for several days -- histamine accumulation is time-dependent.',
      'If pursuing fermented foods for gut health specifically, shorter-fermented, fresher batches (young sauerkraut, fresh kefir) generally carry a lower histamine load than long-aged ferments -- a real, practical way to get some fermentation benefit without the full histamine hit.',
    ],
    citations: [{ source: 'Maintz & Novak 2007, American Journal of Clinical Nutrition (histamine intolerance review)' }],
    relatedIds: ['fermented-sauerkraut-succession'],
  },
  {
    id: 'problem-sugar-sweetened-beverages',
    category: 'problemFoods',
    foodName: 'Sugar-Sweetened Beverages',
    teaser: "Not \"sugar\" broadly -- the specific problem is drinking it, not eating it.",
    problem:
      'Soda, sweetened tea, and other sugar-sweetened beverages deliver a large, fast dose of sugar with none of the fiber or chewing time that naturally slows absorption from whole food -- a real, distinct risk profile from equivalent sugar eaten as part of a meal.',
    mechanism:
      'Rapid glucose absorption drives a sharper insulin spike, and the subsequent glucose crash triggers cortisol and other counter-regulatory stress hormones -- cortisol, in turn, suppresses the enzymes that convert T4 to active T3, the same mechanism already covered in this app\'s own alcohol and juice advisories.',
    swaps: [
      'Whole fruit instead of fruit juice or a sweetened drink -- the fiber measurably slows sugar absorption.',
      'Unsweetened sparkling water with a real fruit splash, rather than a diet soda swap (which trades one open question, sugar, for another, artificial sweeteners -- see Food Additives).',
      'Water itself, tracked -- this app\'s own hydration tracking already counts food-source water toward the same daily target.',
    ],
    citations: [{ source: 'Muraki et al. 2013, BMJ (juice vs. whole fruit, diabetes risk)' }],
  },
  {
    id: 'problem-soy',
    category: 'problemFoods',
    foodName: 'Soy (Conditional, Not Universal)',
    teaser: 'The real risk applies to a specific subgroup -- not to everyone eating tofu.',
    problem:
      'Soy contains isoflavones, plant compounds with a real, if modest, goitrogenic effect -- but the research specifically shows this risk is conditional: one study found roughly a 3x progression risk to overt hypothyroidism specifically in people who already had subclinical hypothyroidism, not a blanket effect in the general population.',
    mechanism:
      'Soy isoflavones can inhibit thyroid peroxidase (TPO), the enzyme central to thyroid hormone synthesis, an effect that becomes more consequential when thyroid function is already compromised, versus negligible in a fully functioning thyroid.',
    swaps: [
      'Fermented soy (tempeh, miso, natto) generally carries a lower isoflavone-activity profile than unfermented soy and provides real probiotic value on top.',
      'Simply space soy intake a few hours from levothyroxine dosing (the same absorption-interference logic that applies to calcium/coffee) rather than eliminating soy outright.',
      'If subclinical hypothyroidism is a known factor, this is a genuine case for a direct conversation with a doctor about soy intake specifically, not a general population-wide warning.',
    ],
    citations: [{ source: 'Soy isoflavone/subclinical hypothyroidism progression studies' }],
  },
  {
    id: 'problem-refined-vegetable-oils',
    category: 'problemFoods',
    foodName: 'Refined Vegetable & Seed Oils (esp. Fried Foods)',
    teaser: 'The real issue is an imbalance, not that any one oil is "toxic."',
    problem:
      'Common refined oils (soybean, corn, cottonseed, conventional sunflower) are very high in omega-6 fatty acids relative to omega-3 -- and the modern diet\'s overall omega-6:omega-3 ratio has drifted from an estimated historical ~1:1 to often 15:1 or higher, an imbalance linked to a more pro-inflammatory baseline state. Deep frying compounds this by also generating oxidized lipid compounds at high heat.',
    mechanism:
      'Omega-6 fatty acids are precursors to pro-inflammatory eicosanoids, while omega-3s are precursors to anti-inflammatory/resolving ones -- the RATIO between the two, not omega-6 intake in isolation, is what the inflammation research actually tracks.',
    swaps: [
      'Extra virgin olive oil or avocado oil for most cooking -- both far lower in omega-6 relative to their monounsaturated fat content.',
      'Fatty fish (salmon, sardines, mackerel) a few times a week to directly raise omega-3 intake rather than only cutting omega-6.',
      'Baking, roasting, or air-frying in place of deep frying when a crispy texture is the actual goal.',
    ],
    citations: [{ source: 'Simopoulos 2002, Biomedicine & Pharmacotherapy (omega-6:omega-3 ratio review)' }],
  },
  {
    id: 'problem-commercial-premade',
    category: 'problemFoods',
    foodName: 'Commercial / Pre-Made Products',
    teaser: 'This app\'s own design philosophy, stated as a food-literacy lesson: build it yourself when you can.',
    problem:
      'Branded, packaged, box-mix, and other commercial pre-made products typically stack several of this list\'s other concerns at once (refined oils, added sugar, synthetic dyes, emulsifiers, sodium) in a single item, and their exact recipe and ratios aren\'t something the eater controls or necessarily even sees on the label.',
    mechanism:
      'It isn\'t any single mechanism -- it\'s cumulative, uncontrolled exposure to several of the other entries on this list stacked together, exactly why this app\'s own reference database and ten Food-tab builders were built around assembling real meals from real, individually-chosen ingredients rather than picking a pre-made stand-in.',
    swaps: [
      "Build the equivalent yourself using this app's own Food-tab builders -- Sides, Sauces, Soups, and Handhelds all cover ground a box mix or frozen meal usually fills.",
      'When a commercial product genuinely is the only practical option, reading the full ingredient list (not just the front label) at least makes the actual tradeoff visible rather than hidden.',
    ],
    citations: [{ source: "This app's own core-purpose framing, CLAUDE.md, 2026-08-05" }],
  },
  {
    id: 'problem-conventional-high-pesticide-produce',
    category: 'problemFoods',
    foodName: 'Conventional Produce, High-Residue Items Specifically',
    teaser: 'The real, checkable version of "wash your produce" -- not every fruit or vegetable carries the same exposure.',
    problem:
      'Pesticide residue on conventionally grown produce varies enormously by crop -- some items (strawberries, spinach, kale) reliably test with detectable residue on nearly every sample in annual testing programs, while others (avocado, sweet corn, pineapple) reliably test clean, mostly due to a thick outer skin or peel the eaten part never touches.',
    mechanism:
      'Several commonly used pesticides are documented endocrine disruptors in animal and cell studies -- meaning the concern here connects directly to this app\'s own Lifestyle & Environment research on environmental endocrine disruptors, not a separate topic.',
    swaps: [
      'Buy organic selectively for the highest-residue items (thin-skinned produce eaten whole) rather than assuming every item needs it equally.',
      'Conventional is a genuinely reasonable choice for thick-skinned produce (avocado, banana, melon, pineapple) where the edible part is naturally shielded.',
      'A thorough rinse under running water measurably reduces surface residue on any produce, organic or not -- a real, free step worth doing regardless.',
    ],
    citations: [{ source: 'EWG Shopper\'s Guide to Pesticides in Produce, annual USDA residue testing data' }],
  },
  {
    id: 'problem-coffee-timing',
    category: 'problemFoods',
    foodName: 'Coffee Taken Too Close to Levothyroxine',
    teaser: "The single most clinically actionable food-medication interaction on this app's own advisory list.",
    problem:
      'A real pharmacokinetic study found coffee taken alongside a levothyroxine dose delays and measurably reduces its absorption -- peak plasma levels down 19-36%, total absorption (AUC) down 27-36% in that trial.',
    mechanism:
      'The exact mechanism isn\'t fully characterized, but the effect is dose-timing-dependent, not a reason to avoid coffee altogether -- resolved in the study by simply spacing the two roughly an hour apart.',
    swaps: [
      'Take levothyroxine with plain water, then wait at least 30-60 minutes before the first cup of coffee.',
      'If mornings are tight, ask a doctor about taking levothyroxine at bedtime instead (a real, studied alternative dosing schedule) rather than skipping the spacing.',
    ],
    citations: [{ source: 'Benvenga et al., coffee/levothyroxine absorption crossover study' }],
    relatedIds: ['labs-biotin-interference'],
  },
];
