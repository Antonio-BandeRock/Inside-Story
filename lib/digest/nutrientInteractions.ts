import type { DigestEntry } from './types';

// Nutrient Interactions -- added 2026-08-07, direct response to: "can you
// think of any other type of information, such as element interactions
// that create synergistic or antagonistic effects, and how food can heal a
// lot of those things." Every other category in this Digest treats
// nutrients mostly one at a time (see Nutrients & Micronutrients) -- this
// category is deliberately about the space BETWEEN them: which pairs help
// each other's absorption, which pairs actively compete for it, and the
// concrete food-level moves (timing, soaking, pairing) that work with
// those interactions rather than against them. "How food can heal a lot of
// those things" is taken directly -- every entry ends on a practical
// lever, not just a lab finding.
//
// 2026-08-07, same day, rewritten in the same narrative shape as the other
// categories already given this treatment -- every entry opens on a hook,
// develops the finding, and closes on why it matters. Every underlying
// fact and citation is unchanged from the original pass.
//
// 2026-08-08: content fields rewritten a second time to remove AI-writing
// tics flagged directly by the person -- em dashes as punctuation, "not X,
// it's Y" contrast, and overused words like "real"/"genuinely"/
// "honest(ly)"/"worth" -- see bigPicture.ts's own header comment for the
// full context. Every fact, number, and citation is unchanged.
export const NUTRIENT_INTERACTIONS_ENTRIES: DigestEntry[] = [
  {
    id: 'interaction-calcium-iron',
    category: 'basicHealth',
    title: 'Calcium & Iron: An Antagonism More Dose-Dependent Than the Old Advice Suggests',
    teaser: 'The classic "never take calcium and iron together" rule only really kicks in at higher doses than most people assume.',
    summary:
      '"Never take calcium and iron together" is one of the most repeated nutrition rules in circulation, stated as absolute, no exceptions, as if any amount of either one cancels the other out completely. The research is more nuanced than that. Calcium and iron compete for the same absorption pathway in the gut, and older research found large calcium doses could cut iron absorption dramatically. A more recent controlled trial found genuine nuance: calcium doses under 800mg had no measurable effect on non-heme iron absorption, while doses of 800mg or more did meaningfully reduce it (heme iron, from meat, was affected even at that same 800mg threshold). The practical takeaway survives the more careful data. A large calcium supplement or a big glass of milk alongside an iron-rich meal is still worth separating by a couple of hours, especially for anyone managing an iron deficiency, but a moderate dairy serving with a meal isn\'t the blanket threat older advice implied.',
    citations: [
      {
        source: 'Calcium Does Not Inhibit the Absorption of 5mg of Nonheme or Heme Iron at Doses Less Than 800mg in Nonpregnant Women',
        url: 'https://pubmed.ncbi.nlm.nih.gov/21795430/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['labs-calcium-iron-absorption'],
  },
  {
    id: 'interaction-vitaminc-iron',
    category: 'basicHealth',
    title: 'Vitamin C & Iron: A Well-Established Synergy, With One Caveat',
    teaser: 'One of the more genuinely useful food pairings for anyone managing iron levels: real chemistry, not folk wisdom.',
    summary:
      "Pairing vitamin C with iron-rich food is common enough advice to sound like folklore. The chemistry behind it is specific. Vitamin C converts iron from its harder-to-absorb ferric form into the more absorbable ferrous form, and separately prevents iron from binding into insoluble, unabsorbable compounds in the gut. A two-part mechanism, not a vague \"vitamin C helps everything\" claim. The caveat: the effect is much stronger in a single, simple meal than across a full, varied diet, where other food components dilute it. The practical takeaway survives that nuance. A vitamin-C-rich food (citrus, bell pepper, strawberries) eaten alongside an iron source or iron supplement helps, especially for plant-based (non-heme) iron sources, which absorb far less efficiently than iron from meat to begin with.",
    citations: [
      { source: 'Vitamin C has a key physiological role in facilitating the absorption of non-heme iron from the diet', url: 'https://pubmed.ncbi.nlm.nih.gov/3667346/' },
    ],
    overallTier: 'strong',
    relatedIds: ['nutrient-zinc-iron-b12'],
  },
  {
    id: 'interaction-zinc-copper',
    category: 'basicHealth',
    title: 'Zinc & Copper: An Antagonism That Mostly Shows Up From Supplements, Not Food',
    teaser: 'A documented way well-intentioned zinc supplementation can quietly cause a second deficiency.',
    summary:
      "Zinc gets recommended widely, and often, for immune support, including elsewhere in this app's own research. Taking too much of it, for too long, has a documented cost most people never hear about. High zinc intake triggers gut cells to produce more metallothionein, a protein that binds copper and traps it in the intestinal lining rather than letting it pass into the bloodstream. Sustained high-dose zinc can cause copper deficiency, with documented cases of resulting anemia and low white blood cell counts. This interaction is realistically a supplement-level concern, not a food-level one. Ordinary zinc-rich foods like oysters, beef, and pumpkin seeds don't deliver doses anywhere near what triggers this. The practical fix for anyone taking zinc supplements longer-term: a small amount of copper, roughly 1mg copper per 8-15mg zinc, alongside it, or simple periodic bloodwork if supplementing at higher doses for an extended stretch.",
    citations: [
      {
        source: 'Zinc-induced copper deficiency, sideroblastic anemia, and neutropenia: a perplexing facet of zinc excess',
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7495772/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['gut-zinc-carnosine'],
  },
  {
    id: 'interaction-vitamind-k2-magnesium',
    category: 'basicHealth',
    title: 'Vitamin D, K2 & Magnesium: A Three-Way Team, Not Three Separate Supplements',
    teaser: 'Taking vitamin D alone, without its teammates, may not do what most people expect it to do.',
    summary:
      "Vitamin D gets taken as a standalone supplement more often than almost anything else in this category. The biochemistry says it was never meant to work alone. Vitamin D increases how much calcium the gut absorbs, but it's vitamin K2 that activates the proteins directing that calcium into bone rather than into arteries, and magnesium that's required to actually activate vitamin D itself inside the body in the first place. A systematic review of controlled trials found this combination behaves as an interdependent system for bone health outcomes: insufficient levels of any one of the three can blunt the benefit of supplementing with the other two. The practical takeaway: someone supplementing high-dose vitamin D alone, without adequate magnesium or K2 intake (magnesium from leafy greens, nuts, and seeds; K2 from fermented foods and animal fats), may be getting a meaningfully incomplete version of vitamin D's own benefit.",
    citations: [
      { source: 'Calcium, vitamin D, vitamin K2, and magnesium supplementation and skeletal health', url: 'https://pubmed.ncbi.nlm.nih.gov/32972636/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['nutrient-vitamin-d'],
  },
  {
    id: 'interaction-selenium-iodine',
    category: 'basicHealth',
    title: 'Selenium & Iodine: Both a Synergy and an Antagonism, Depending on the Order',
    teaser: 'The single most directly thyroid-relevant nutrient interaction in this whole app, and it cuts both ways.',
    summary:
      "Of every nutrient pairing in this category, this is the one most directly relevant to Hashimoto's specifically, and the one where getting the sequence wrong can make things worse, not just fail to help. Selenium and iodine are both required together for healthy thyroid hormone metabolism. Selenoproteins are what actually convert T4 into active T3 and safely deactivate it afterward. The important complication: giving selenium supplementation to someone who is iodine-deficient can make iodine deficiency worse, not better. Selenium activates deiodinase enzymes throughout the body that then consume circulating thyroid hormone faster, accelerating iodine loss through urine and stool. This is why research recommends confirming adequate iodine status before starting meaningful selenium supplementation, not the other way around. A practical sequencing rule, not just two nutrients that happen to both matter for the same organ.",
    citations: [
      {
        source: 'Selenium, Iodine and Iron: Essential Trace Elements for Thyroid Hormone Synthesis and Metabolism',
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9967593/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['nutrient-selenium', 'nutrient-iodine'],
  },
  {
    id: 'interaction-iron-zinc-manganese',
    category: 'basicHealth',
    title: 'Iron, Zinc & Manganese: Three Minerals Competing for the Same Door',
    teaser: 'Why "just take all your minerals together" isn\'t actually the most efficient approach.',
    summary:
      "A single multivitamin-mineral tablet, everything bundled into one convenient dose, sounds like the efficient choice. The chemistry of mineral absorption says otherwise. Iron, zinc, and manganese are chemically similar enough that they compete for the same intestinal transport machinery. Research found an iron-to-zinc ratio of 2:1 or higher in a single dose measurably reduces zinc absorption, and manganese independently competes with both. A single \"everything at once\" supplement can be a less efficient way to correct multiple deficiencies than spacing higher-dose individual minerals across different meals or times of day. Not a reason to avoid a normal, food-based diet containing all three, where naturally-occurring amounts rarely reach the concentrations that trigger real competition.",
    citations: [
      { source: 'Iron-zinc and calcium-Fe interactions in relation to Zn and Fe absorption', url: 'https://pubmed.ncbi.nlm.nih.gov/8524893/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'interaction-vitamina-zinc',
    category: 'basicHealth',
    title: 'Vitamin A & Zinc: A Mechanistic Link, With Mixed Human Evidence',
    teaser: 'A genuine biochemical dependency at the cellular level that doesn\'t always translate cleanly into a measurable human effect.',
    summary:
      "Not every interaction in this category comes with an equally clean, actionable answer. This one is an example of biochemistry outrunning practical proof. Zinc is a required cofactor for the enzyme that converts retinol (vitamin A) into its active forms, and for the protein that transports vitamin A out of the liver into the bloodstream where it's actually needed. In zinc deficiency, vitamin A can measurably build up unused in the liver rather than reaching the rest of the body. The complication: despite this well-characterized mechanism, human trials have inconsistently shown zinc supplementation actually improving vitamin A status in practice, and the public-health significance of the interaction in otherwise well-nourished people remains unclear. Included as an example of solid biochemistry that hasn't yet cleanly translated into a proven practical recommendation.",
    citations: [
      { source: 'Interactions between zinc and vitamin A: an update (American Journal of Clinical Nutrition)', url: 'https://pubmed.ncbi.nlm.nih.gov/6786155/' },
    ],
    overallTier: 'weak',
  },
  {
    id: 'interaction-tannins-iron',
    category: 'basicHealth',
    title: 'Tea, Coffee & Cocoa: A Large Antagonistic Effect on Iron, Fully Fixable By Timing Alone',
    teaser: 'A cup of tea with a meal can cut iron absorption from that same meal by up to 94%.',
    summary:
      "Of every interaction in this category, this is the one where a small, simple change makes the biggest measured difference. Tannins and other polyphenols in black tea, coffee, and cocoa bind directly to non-heme iron in the gut, forming a complex the body genuinely can't absorb. Controlled research found black tea reduced iron absorption from a meal by 79-94%, peppermint tea by 84%, and cocoa by 71%, a dose-dependent effect tracking directly with each beverage's own polyphenol content. This is one of the most fixable interactions in this whole category. The effect is specific to drinking these beverages with or immediately around an iron-containing meal. Simply having tea or coffee an hour or more away from meals, and away from any iron supplement specifically, avoids essentially all of the effect, no elimination required.",
    citations: [
      { source: 'Inhibition of non-haem iron absorption in man by polyphenolic-containing beverages', url: 'https://pubmed.ncbi.nlm.nih.gov/10999016/' },
    ],
    overallTier: 'strong',
    relatedIds: ['problem-coffee-timing'],
    chart: {
      title: 'Reduction in Iron Absorption From a Meal',
      unit: '%',
      data: [
        { label: 'Black tea (up to)', value: 94 },
        { label: 'Peppermint tea', value: 84 },
        { label: 'Cocoa', value: 71 },
      ],
      sourceNote: 'Inhibition of non-haem iron absorption by polyphenolic beverages, PMID 10999016',
    },
  },
  {
    id: 'interaction-phytates-minerals',
    category: 'basicHealth',
    title: 'Phytates in Grains & Legumes: A Mineral Blocker With Real, Traditional Food Fixes',
    teaser: "Soaking, sprouting, and fermenting aren't just old kitchen habits. They measurably work.",
    summary:
      "A diet built around whole grains and legumes looks mineral-rich on paper. The amount that actually gets absorbed is often a different story. Phytic acid, found throughout whole grains, legumes, nuts, and seeds, binds tightly to iron, zinc, calcium, and magnesium, forming complexes the body can't absorb. A well-documented reason a diet heavy in unprocessed grains and legumes can under-deliver on mineral nutrition despite looking mineral-rich on paper. The practical fix is exactly what traditional food preparation already does. Soaking wheat bran destroyed nearly all its phytate and raised soluble iron from under 5% to over 50% in one study. Sprouting and germinating activates the plant's own phytate-degrading enzyme, cutting phytic acid by up to 87% in as little as 4 days. Combining soaking, sprouting, and fermentation together cut the phytate-to-zinc ratio by 81% and the phytate-to-iron ratio by 85% in one study. A direct, evidence-backed reason this app's own Fermented Foods research connects to mineral nutrition, not just gut health. The same traditional preparation methods this app already recommends for other reasons solve this problem too.",
    citations: [
      {
        source: 'Enhancing iron and zinc bioavailability in maize through phytate reduction: the impact of fermentation alone and in combination with soaking and germination',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11646714/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['fermented-sauerkraut-succession'],
    chart: {
      title: 'Prep-Method Reduction in Mineral Blockers',
      unit: '%',
      data: [
        { label: 'Sprouting (phytic acid cut, 4 days)', value: 87 },
        { label: 'Soak + sprout + ferment (phytate:zinc)', value: 81 },
        { label: 'Soak + sprout + ferment (phytate:iron)', value: 85 },
      ],
      sourceNote: 'Fermentation and phytate reduction in maize, PMC11646714',
    },
  },
  {
    id: 'interaction-curcumin-piperine',
    category: 'basicHealth',
    title: 'Turmeric & Black Pepper: A Dramatic, Kitchen-Level Synergy',
    teaser: 'One of the largest bioavailability boosts from any everyday food pairing ever measured: a 2000% increase in humans.',
    summary:
      "\"Add black pepper to turmeric\" sounds like exactly the kind of folk pairing that turns out, on closer inspection, to be more superstition than science. This one is the exception. Curcumin, turmeric's own active compound, is poorly absorbed on its own, rapidly broken down by the liver and gut wall before it can do much. A landmark human trial found that adding just 20mg of piperine, black pepper's own active compound, roughly the amount in a pinch of fresh-ground pepper, alongside curcumin increased its bioavailability by 2000%. Piperine slows the liver and gut enzymes that would otherwise break curcumin down almost immediately. A direct, checkable reason this specific pairing isn't just folk wisdom. It's one of the most dramatic, well-documented food-level bioavailability boosts in nutrition science.",
    citations: [
      { source: 'Shoba et al. 1998, Planta Medica: Influence of Piperine on the Pharmacokinetics of Curcumin in Animals and Human Volunteers', url: 'https://pubmed.ncbi.nlm.nih.gov/9619120/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'interaction-fatsoluble-vitamins-fat',
    category: 'basicHealth',
    title: 'Vitamins A, D, E & K Need Fat Present to Absorb at All',
    teaser: 'Taking a fat-soluble vitamin on a truly fat-free stomach is a common way to waste much of the dose.',
    summary:
      "A vitamin D capsule swallowed with a glass of water on an empty stomach feels like it should work. The chemistry says otherwise. Vitamins A, D, E, and K are absorbed through the same pathway as dietary fat itself. Without fat present in the same meal, the digestive machinery (bile acids, lipases) needed to actually absorb them isn't meaningfully triggered. Research found a moderate amount of fat, roughly 11-15g, alongside a vitamin D dose produced measurably higher blood levels than either no fat or a much larger fat amount, and as little as 3-5g of fat is enough to meaningfully trigger vitamin A (beta-carotene) absorption. The practical takeaway: a vitamin D or vitamin K supplement taken on a genuinely empty, fat-free stomach, or a salad of leafy greens (vitamin K and provitamin A) eaten with a fully fat-free dressing, is a common way to blunt much of the nutritional value already on the plate. A drizzle of olive oil fixes it directly.",
    citations: [
      { source: 'Fat-Soluble Vitamins (NCBI Bookshelf, Diet and Health)', url: 'https://www.ncbi.nlm.nih.gov/books/NBK218749/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'interaction-magnesium-b6',
    category: 'basicHealth',
    title: 'Magnesium & Vitamin B6: A Bidirectional Team',
    teaser: 'Each nutrient helps the body actually use the other one, confirmed in both directions, not just assumed.',
    summary:
      "Most nutrient pairings in this category run one direction: nutrient A helps or hurts nutrient B. This one is a rarer, genuinely reciprocal case. Vitamin B6, in its active form P5P, helps cells take up and retain magnesium, since magnesium works mainly inside cells rather than in the bloodstream. The relationship runs the other way too: magnesium deficiency measurably impairs the body's own vitamin B6 status by disabling an enzyme magnesium itself is required to activate. A randomized clinical trial found the combination of magnesium plus B6 outperformed magnesium alone for reducing stress symptoms in adults with low magnesium status, direct human evidence for a synergy that isn't just theoretical biochemistry. Food sources pairing both naturally: leafy greens, legumes, and whole grains carry meaningful magnesium, while poultry, fish, potatoes, and bananas carry B6. A varied plate covers both without needing to supplement either one in isolation.",
    citations: [
      {
        source: 'Superiority of magnesium and vitamin B6 over magnesium alone on severe stress in healthy adults with low magnesemia: a randomized, single-blind clinical trial',
        url: 'https://pubmed.ncbi.nlm.nih.gov/30562392/',
      },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'interaction-tying-together',
    category: 'basicHealth',
    title: 'Tying It All Together: Absorption Is a System, Not a Nutrient List',
    teaser: 'Twelve interactions, and the repeating lesson is that WHEN and WITH WHAT you eat something often matters more than the nutrient itself.',
    summary:
      "Read as a whole rather than one pairing at a time, this category's throughline is that nutrient absorption is a system, not a checklist of individual targets. The same food choice can help or block a completely different nutrient depending on timing and combination alone. Tea, coffee, and cocoa can cut iron absorption by up to 94% simply by being consumed too close to a meal, and moving that same cup an hour away removes nearly the entire effect, no elimination required, just timing, the same lesson this Digest's own Labs & Medication Timing category reaches independently for levothyroxine. Soaking, sprouting, and fermenting aren't old-fashioned habits. They measurably unlock minerals phytates would otherwise block, directly connecting this category to this app's own Fermented Foods research. The complications matter too: selenium and iodine both help and hurt each other depending on sequencing, and vitamin A and zinc's own biochemistry hasn't yet translated into a clean human recommendation. Not every interaction in this category comes with an equally clean fix. Taken together, the twelve entries here point at one practical habit worth building: pay less attention to which nutrients are on the plate in isolation, and more to when and alongside what they're actually eaten.",
    citations: [
      { source: 'Inhibition of non-haem iron absorption in man by polyphenolic-containing beverages', url: 'https://pubmed.ncbi.nlm.nih.gov/10999016/' },
      {
        source: 'Enhancing iron and zinc bioavailability in maize through phytate reduction: the impact of fermentation alone and in combination with soaking and germination',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11646714/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['labs-timing-master-rule', 'interaction-phytates-minerals', 'interaction-tannins-iron'],
  },
];
