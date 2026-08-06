import type { DigestEntry } from './types';

// Nutrient Interactions -- added 2026-08-07, direct response to: "can you
// think of any other type of information, such as element interactions
// that create synergistic or antagonistic effects, and how food can heal a
// lot of those things." Every other category in this Digest treats
// nutrients mostly one at a time (see Nutrients & Micronutrients) -- this
// category is deliberately about the space BETWEEN them: which pairs help
// each other's absorption, which pairs actively compete for it, and the
// real, concrete food-level moves (timing, soaking, pairing) that work
// with those interactions rather than against them. "How food can heal a
// lot of those things" is taken directly -- every entry ends on a real,
// practical lever, not just a lab finding.
export const NUTRIENT_INTERACTIONS_ENTRIES: DigestEntry[] = [
  {
    id: 'interaction-calcium-iron',
    category: 'nutrientInteractions',
    title: 'Calcium & Iron: a Real Antagonism, But More Dose-Dependent Than the Old Advice Suggests',
    teaser: 'The classic "never take calcium and iron together" rule turns out to only really kick in at higher doses.',
    summary:
      'Calcium and iron compete for the same absorption pathway in the gut, and older research found large calcium doses could cut iron absorption dramatically. A more recent, real controlled trial found genuine nuance: calcium doses under 800mg had no measurable effect on non-heme iron absorption, while doses of 800mg or more did meaningfully reduce it (heme iron, from meat, was affected even at 800mg). The practical takeaway survives the more careful data: a large calcium supplement or a big glass of milk alongside an iron-rich meal is still worth separating by a couple of hours, especially for anyone managing a real iron deficiency -- but a moderate dairy serving with a meal isn\'t the same threat older advice implied.',
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
    category: 'nutrientInteractions',
    title: 'Vitamin C & Iron: a Real, Well-Established Synergy -- With an Honest Caveat',
    teaser: 'One of the most genuinely useful food pairings for anyone managing iron levels.',
    summary:
      'Vitamin C converts iron from its harder-to-absorb ferric form into the more absorbable ferrous form, and separately prevents iron from binding into insoluble, unabsorbable compounds in the gut -- a real, two-part mechanism, not a vague "vitamin C helps everything" claim. The honest caveat: the effect is much stronger in a single, simple meal than across a full, varied diet, where other food components dilute it. The real, practical takeaway survives that nuance: a vitamin-C-rich food (citrus, bell pepper, strawberries) eaten alongside an iron source or iron supplement genuinely helps, especially for plant-based (non-heme) iron sources, which absorb far less efficiently than iron from meat to begin with.',
    citations: [
      { source: 'Vitamin C has a key physiological role in facilitating the absorption of non-heme iron from the diet', url: 'https://pubmed.ncbi.nlm.nih.gov/3667346/' },
    ],
    overallTier: 'strong',
    relatedIds: ['nutrient-zinc-iron-b12'],
  },
  {
    id: 'interaction-zinc-copper',
    category: 'nutrientInteractions',
    title: 'Zinc & Copper: a Real Antagonism That Mostly Shows Up From Supplements, Not Food',
    teaser: 'A genuine, documented way well-intentioned zinc supplementation can cause a second real deficiency.',
    summary:
      'High zinc intake triggers gut cells to produce more metallothionein, a protein that binds copper and traps it in the intestinal lining rather than letting it pass into the bloodstream -- meaning sustained high-dose zinc can genuinely cause copper deficiency, with real documented cases of resulting anemia and low white blood cell counts. This interaction is realistically a supplement-level concern, not a food-level one -- ordinary zinc-rich foods (oysters, beef, pumpkin seeds) don\'t deliver doses anywhere near what triggers this. The practical fix for anyone taking zinc supplements longer-term: a small amount of copper (roughly 1mg copper per 8-15mg zinc is the commonly recommended ratio) alongside it, or simple periodic bloodwork if supplementing at higher doses for an extended stretch.',
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
    category: 'nutrientInteractions',
    title: 'Vitamin D, K2 & Magnesium: a Real Three-Way Team, Not Three Separate Supplements',
    teaser: 'Taking vitamin D alone, without its real teammates, may not do what people expect.',
    summary:
      'Vitamin D increases how much calcium the gut absorbs -- but it\'s vitamin K2 that activates the proteins directing that calcium into bone rather than into arteries, and magnesium that\'s required to actually activate vitamin D itself inside the body in the first place. A real systematic review of controlled trials found this combination behaves as a genuine, interdependent system for bone health outcomes: insufficient levels of any one of the three can blunt the real benefit of supplementing with the other two. The practical takeaway: someone supplementing high-dose vitamin D alone, without adequate magnesium or K2 intake (magnesium from leafy greens/nuts/seeds; K2 from fermented foods and animal fats), may be getting a meaningfully incomplete version of vitamin D\'s own real benefit.',
    citations: [
      { source: 'Calcium, vitamin D, vitamin K2, and magnesium supplementation and skeletal health', url: 'https://pubmed.ncbi.nlm.nih.gov/32972636/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['nutrient-vitamin-d'],
  },
  {
    id: 'interaction-selenium-iodine',
    category: 'nutrientInteractions',
    title: 'Selenium & Iodine: Genuinely Both a Synergy AND an Antagonism, Depending on the Order',
    teaser: 'The single most directly thyroid-relevant nutrient interaction in this whole app -- and it cuts both ways.',
    summary:
      'Selenium and iodine are both genuinely required together for healthy thyroid hormone metabolism -- selenoproteins are what actually convert T4 into active T3 and safely deactivate it afterward. The real, important complication: giving selenium supplementation to someone who is iodine-deficient can make iodine deficiency WORSE, not better -- selenium activates deiodinase enzymes throughout the body that then consume circulating thyroid hormone faster, accelerating real iodine loss through urine and stool. This is precisely why real research recommends confirming adequate iodine status BEFORE starting meaningful selenium supplementation, not the other way around -- a real, practical sequencing rule, not just two nutrients that happen to both matter for the same organ.',
    citations: [
      {
        source: 'Selenium, Iodine and Iron -- Essential Trace Elements for Thyroid Hormone Synthesis and Metabolism',
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9967593/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['nutrient-selenium', 'nutrient-iodine'],
  },
  {
    id: 'interaction-iron-zinc-manganese',
    category: 'nutrientInteractions',
    title: 'Iron, Zinc & Manganese: Three Minerals Genuinely Competing for the Same Door',
    teaser: 'The real reason "just take all your minerals together" isn\'t actually the most efficient approach.',
    summary:
      'Iron, zinc, and manganese are chemically similar enough that they compete for the same intestinal transport machinery -- real research found an iron-to-zinc ratio of 2:1 or higher in a single dose measurably reduces zinc absorption, and manganese independently competes with both. This is a real reason a single "everything at once" multivitamin/mineral supplement can be a genuinely less efficient way to correct multiple real deficiencies than spacing higher-dose individual minerals across different meals or times of day -- not a reason to avoid a normal, food-based diet containing all three, where naturally-occurring amounts rarely reach the concentrations that trigger real competition.',
    citations: [
      { source: 'Iron-zinc and calcium-Fe interactions in relation to Zn and Fe absorption', url: 'https://pubmed.ncbi.nlm.nih.gov/8524893/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'interaction-vitamina-zinc',
    category: 'nutrientInteractions',
    title: 'Vitamin A & Zinc: a Real Mechanistic Link, With Honestly Mixed Human Evidence',
    teaser: 'A genuine biochemical dependency at the cellular level -- that doesn\'t always translate cleanly into a measurable human effect.',
    summary:
      'Zinc is a genuinely required cofactor for the enzyme that converts retinol (vitamin A) into its active forms, and for the protein that transports vitamin A out of the liver into the bloodstream where it\'s actually needed -- in zinc deficiency, vitamin A can measurably build up unused in the liver rather than reaching the rest of the body. The honest complication: despite this real, well-characterized mechanism, human trials have inconsistently shown zinc supplementation actually improving vitamin A status in practice, and the public-health significance of the interaction in otherwise well-nourished people remains genuinely unclear. Included as an honest example of real biochemistry that hasn\'t yet cleanly translated into a proven practical recommendation -- not every real mechanism in this category comes with an equally clean human answer.',
    citations: [
      { source: 'Interactions between zinc and vitamin A: an update (American Journal of Clinical Nutrition)', url: 'https://pubmed.ncbi.nlm.nih.gov/6786155/' },
    ],
    overallTier: 'weak',
  },
  {
    id: 'interaction-tannins-iron',
    category: 'nutrientInteractions',
    title: 'Tea, Coffee & Cocoa: a Real, Large Antagonistic Effect on Iron -- Fully Fixable By Timing Alone',
    teaser: 'A cup of tea with a meal can cut iron absorption from that same meal by up to 90%.',
    summary:
      'Tannins and other polyphenols in black tea, coffee, and cocoa bind directly to non-heme iron in the gut, forming a complex the body genuinely can\'t absorb -- real controlled research found black tea reduced iron absorption from a meal by 79-94%, peppermint tea by 84%, and cocoa by 71%, a dose-dependent effect tracking directly with each beverage\'s own polyphenol content. This is one of the single most fixable interactions in this whole category: the effect is specific to drinking these beverages WITH or immediately around an iron-containing meal -- simply having tea or coffee an hour or more away from meals (and away from any iron supplement specifically) avoids essentially all of the real effect, no elimination required.',
    citations: [
      { source: 'Inhibition of non-haem iron absorption in man by polyphenolic-containing beverages', url: 'https://pubmed.ncbi.nlm.nih.gov/10999016/' },
    ],
    overallTier: 'strong',
    relatedIds: ['problem-coffee-timing'],
  },
  {
    id: 'interaction-phytates-minerals',
    category: 'nutrientInteractions',
    title: 'Phytates in Grains & Legumes: a Real Mineral-Blocker -- With Real, Traditional Food Fixes',
    teaser: 'Real evidence that soaking, sprouting, and fermenting aren\'t just old kitchen habits -- they measurably work.',
    summary:
      'Phytic acid, found throughout whole grains, legumes, nuts, and seeds, binds tightly to iron, zinc, calcium, and magnesium, forming complexes the body can\'t absorb -- a real, well-documented reason a diet heavy in unprocessed grains and legumes can genuinely under-deliver on mineral nutrition despite looking mineral-rich on paper. The real, practical fix is exactly what traditional food preparation already does: soaking wheat bran destroyed nearly all its phytate and raised soluble iron from under 5% to over 50% in one real study; sprouting/germinating activates the plant\'s own phytate-degrading enzyme, cutting phytic acid by up to 87% in as little as 4 days; and combining soaking, sprouting, AND fermentation together cut the phytate-to-zinc ratio by 81% and the phytate-to-iron ratio by 85% in one real study -- a direct, evidence-backed reason this app\'s own Fermented Foods research connects to mineral nutrition, not just gut health.',
    citations: [
      {
        source: 'Enhancing iron and zinc bioavailability in maize through phytate reduction: the impact of fermentation alone and in combination with soaking and germination',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11646714/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['fermented-sauerkraut-succession'],
  },
  {
    id: 'interaction-curcumin-piperine',
    category: 'nutrientInteractions',
    title: 'Turmeric & Black Pepper: a Real, Dramatic, Kitchen-Level Synergy',
    teaser: 'One of the largest bioavailability boosts from any real, everyday food pairing ever measured -- a 2000% increase in humans.',
    summary:
      'Curcumin (turmeric\'s own active compound) is genuinely poorly absorbed on its own -- rapidly broken down by the liver and gut wall before it can do much. A landmark real human trial found that adding just 20mg of piperine (black pepper\'s own active compound, roughly the amount in a real pinch of fresh-ground pepper) alongside curcumin increased its bioavailability by 2000% -- piperine slows the liver/gut enzymes that would otherwise break curcumin down almost immediately. A real, direct, checkable reason "add black pepper to turmeric" isn\'t just a folk pairing -- it\'s one of the most dramatic, well-documented food-level bioavailability boosts in real nutrition science.',
    citations: [
      { source: 'Shoba et al. 1998, Planta Medica -- Influence of Piperine on the Pharmacokinetics of Curcumin in Animals and Human Volunteers', url: 'https://pubmed.ncbi.nlm.nih.gov/9619120/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'interaction-fatsoluble-vitamins-fat',
    category: 'nutrientInteractions',
    title: 'Vitamins A, D, E & K Genuinely Need Real Fat Present to Absorb At All',
    teaser: 'Taking a fat-soluble vitamin on a truly fat-free stomach is a real, common way to waste much of the dose.',
    summary:
      'Vitamins A, D, E, and K are absorbed through the same pathway as dietary fat itself -- without real fat present in the same meal, the digestive machinery (bile acids, lipases) that\'s needed to actually absorb them isn\'t meaningfully triggered. Real research found a moderate amount of fat (roughly 11-15g) alongside a vitamin D dose produced measurably higher blood levels than either no fat or a much larger fat amount, and as little as 3-5g of fat is enough to meaningfully trigger vitamin A (beta-carotene) absorption. The real, practical takeaway: a vitamin D or vitamin K supplement taken on a genuinely empty, fat-free stomach, or a salad of leafy greens (real vitamin K and provitamin A) eaten with a fully fat-free dressing, is a real, common way to blunt much of the real nutritional value already on the plate -- a drizzle of olive oil fixes it directly.',
    citations: [
      { source: 'Fat-Soluble Vitamins (NCBI Bookshelf, Diet and Health)', url: 'https://www.ncbi.nlm.nih.gov/books/NBK218749/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'interaction-magnesium-b6',
    category: 'nutrientInteractions',
    title: 'Magnesium & Vitamin B6: a Real, Bidirectional Team',
    teaser: 'Each nutrient genuinely helps the body actually use the other one -- confirmed in both directions.',
    summary:
      'Vitamin B6 (in its active form, P5P) genuinely helps cells take up and retain magnesium, since magnesium works mainly inside cells rather than in the bloodstream -- and the relationship runs the other way too: magnesium deficiency measurably impairs the body\'s own vitamin B6 status by disabling an enzyme magnesium itself is required to activate. A real randomized clinical trial found the combination of magnesium plus B6 outperformed magnesium alone for reducing stress symptoms in adults with low magnesium status -- real, direct human evidence for a synergy that isn\'t just theoretical biochemistry. Real food sources pairing both naturally: leafy greens, legumes, and whole grains carry meaningful magnesium, while poultry, fish, potatoes, and bananas carry real B6 -- a varied plate covers both without needing to supplement either in isolation.',
    citations: [
      {
        source: 'Superiority of magnesium and vitamin B6 over magnesium alone on severe stress in healthy adults with low magnesemia: a randomized, single-blind clinical trial',
        url: 'https://pubmed.ncbi.nlm.nih.gov/30562392/',
      },
    ],
    overallTier: 'moderate',
  },
];
