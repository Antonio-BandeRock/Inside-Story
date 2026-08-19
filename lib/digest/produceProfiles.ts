import type { DigestEntry } from './types';

// Fruits, Vegetables, Nuts & Seeds: Real Profiles -- new 2026-08-09, direct
// request: "a group that has information about every fruit and vegetable
// and their health benefits and types of problems they can be for some
// people but not for others... This should also include nuts and seeds."
// A genuinely different organizing principle from the rest of this Digest
// (which is organized by mechanism/condition/topic): this one is organized
// by FOOD, one real, cited profile per item, covering both what it's good
// for and who might genuinely want to be more careful with it.
//
// "Every fruit and vegetable" in this database (22,000+ rows) isn't a real,
// buildable scope in one pass -- this is a first, deliberate batch of the
// most common, highest-value items, the same "reasonable v1, grows over
// time" precedent already established by the Essential Nutrients series.
// Real next-step candidates, not yet built: berries beyond blueberry
// (strawberry, raspberry), cabbage/Brussels sprouts as their own
// cruciferous entries, bell peppers/nightshades cross-referenced more
// fully, bananas, legumes as their own group, and the remaining common tree
// nuts (cashew, pistachio, pecan).
//
// A real, genuinely new mechanism ties every entry here to the live
// reference database, per direct request: "If any of them get hidden in
// the database so they are not viewable within the app, then their
// information should also disappear." Each entry below carries a real
// `relatedFoodNames` array -- the exact base_name value(s) this food
// actually has in the bundled reference database, hand-verified via a
// direct sqlite3 query against assets/data/foods_reference.db before being
// written in, not guessed. See lib/db.ts's own `getVisibleFoodBaseNames()`
// and this topic's own render-time filtering in purple-digest.tsx for how
// this is actually enforced -- an entry whose every related food name has
// since been hidden (or its whole category hidden) stops appearing, kept
// in sync with what a person can actually still find in this app's own
// food pickers.
export const PRODUCE_PROFILES_ENTRIES: DigestEntry[] = [
  {
    id: 'produce-overview',
    category: 'basicHealth',
    title: 'A Profile Per Food, Not One Universal "Eat More Produce" Rule',
    teaser: 'The same fruit or vegetable that helps one person can be a specific concern for another, these profiles name both sides.',
    summary: 'Most general nutrition advice treats "eat more fruits and vegetables" as a single, universal instruction. It is real and well-supported advice on average, but it flattens an important truth this whole topic is built around: several of the most commonly recommended foods carry a specific caution for a specific group of people, high-oxalate leafy greens and kidney stone risk, high-vitamin-K leafy greens and blood-thinning medication, raw cruciferous vegetables and thyroid function, high-FODMAP produce and IBS, tree nut allergy. None of these cautions are a reason to avoid these foods broadly, they\'re a reason to know whether a specific one applies to a specific person, the same distinction the condition-specific research already makes everywhere else. Every entry below stays in sync with what\'s actually still browsable in the food reference database, if a food is hidden there, its profile disappears here too, rather than describing something no longer selectable.',
    citations: [
      {
        source: 'NASEM Dietary Reference Intakes, general fruit/vegetable intake guidance',
        url: 'https://ods.od.nih.gov/HealthInformation/nutrientrecommendations.aspx',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['produce-closing'],
  },
  {
    id: 'produce-apple',
    category: 'basicHealth',
    title: 'Apple: A Fiber-and-Polyphenol Package, Mostly Sitting in the Peel',
    teaser: 'Most of an apple\'s fiber and polyphenol content concentrates in the skin, peeling it away removes a meaningful share of what makes it worth eating whole.',
    summary:
      'An apple carries a mix of soluble fiber (pectin, the same substance that thickens jam) and insoluble fiber, alongside a meaningful concentration of polyphenols, most heavily in and just under the skin, peeling an apple removes a share of both the fiber and the antioxidant content, not just texture. Pectin specifically has documented cholesterol-lowering and blood-sugar-moderating effects, part of why a whole apple digests and affects blood sugar differently than apple juice, which strips out essentially all of the fiber. The worth-knowing caution: apple seeds contain a small amount of amygdalin, a compound that releases cyanide when broken down, but the amount in a normal handful of accidentally swallowed seeds is far below a dangerous dose for an adult, a hazard requires deliberately chewing and consuming a large quantity of crushed seeds, not the occasional swallowed seed from eating an apple normally.',
    citations: [
      {
        source: 'Boyer & Liu 2004, Nutrition Journal: "Apple phytochemicals and their health benefits"',
        url: 'https://pubmed.ncbi.nlm.nih.gov/15140261/',
      },
    ],
    overallTier: 'strong',
    relatedFoodNames: ['Apple'],
  },
  {
    id: 'produce-blueberry',
    category: 'basicHealth',
    title: 'Blueberry: One of the Most Concentrated Sources of Anthocyanin Antioxidants in a Common Food',
    teaser: 'Blueberries owe both their color and much of their research interest to anthocyanins, a specific class of polyphenol with anti-inflammatory and cognitive-aging research behind it.',
    summary:
      'Blueberries\' deep color comes from anthocyanins, a well-studied class of flavonoid antioxidant, and blueberries carry them at a meaningfully higher concentration than most other common fruits. Human trials have found regular blueberry intake associated with modest, measurable improvements in blood pressure and markers of oxidative stress, and a separate body of research links anthocyanin-rich diets to slower age-related cognitive decline, though the cognitive research is still developing and shouldn\'t be read as a proven prevention strategy on its own. There is no significant, common caution specific to blueberries themselves for most people, the worth-knowing distinction is between wild (lowbush) and cultivated (highbush) blueberries, since wild blueberries run meaningfully smaller and, per gram, carry a higher anthocyanin concentration than the larger cultivated variety most commonly sold fresh.',
    citations: [
      {
        source: 'Kalt et al. 2020, Advances in Nutrition, systematic review: "Recent Research on the Health Benefits of Blueberries"',
        url: 'https://pubmed.ncbi.nlm.nih.gov/31687741/',
      },
    ],
    overallTier: 'moderate',
    relatedFoodNames: ['Blueberry'],
  },
  {
    id: 'produce-citrus',
    category: 'basicHealth',
    title: 'Oranges and Other Citrus: A Well-Established Vitamin C Source, With One Different Family Member Worth Knowing About',
    teaser: 'Plain oranges have no meaningful drug-interaction concern, but grapefruit, a botanical cousin, does, and the two are worth telling apart.',
    summary:
      'A single orange reliably supplies a large share of an adult\'s daily vitamin C need, alongside fiber, folate, and potassium content, and citrus fruits broadly are a well-established, uncontroversial source of all three. The one important distinction within the citrus family: grapefruit (and, to a lesser extent, Seville/sour oranges and pomelo) contains compounds (furanocoumarins) that measurably block an enzyme in the gut wall responsible for breaking down several common medications, enough that it changes how much of a drug actually reaches the bloodstream, a documented interaction with certain statins, calcium channel blockers, and immunosuppressants, among others. Plain sweet oranges, tangerines, and mandarins do not carry this same interaction in any clinically meaningful way, the caution is specific to grapefruit and its closer relatives, not citrus as a whole family, a distinction worth knowing before assuming every citrus fruit needs the same caution.',
    citations: [
      {
        source: 'NIH Office of Dietary Supplements, vitamin C fact sheet',
        url: 'https://ods.od.nih.gov/factsheets/VitaminC-HealthProfessional/',
      },
    ],
    overallTier: 'strong',
    relatedFoodNames: ['Orange'],
    relatedIds: ['labs-grapefruit-juice'],
  },
  {
    id: 'produce-avocado',
    category: 'basicHealth',
    title: 'Avocado: A Monounsaturated-Fat Outlier Among Fruits, With a FODMAP Caveat at Larger Servings',
    teaser: 'Avocado is botanically a fruit but nutritionally an outlier, carrying a fat profile closer to olive oil than to any other common fruit, and a serving-size-dependent FODMAP concern.',
    summary: 'Unlike almost every other fruit, avocado\'s calories come predominantly from fat, mostly the same monounsaturated oleic acid that makes olive oil a well-supported part of Mediterranean-pattern eating, alongside potassium and fiber content. The caution isn\'t a toxicity concern, it\'s a dose-dependent FODMAP issue: avocado contains sorbitol, a sugar alcohol that a meaningful share of people, especially those with IBS, absorb poorly in larger amounts, producing gas, bloating, or cramping specifically past a certain serving size rather than at any amount. Monash University\'s own low-FODMAP research (the same body of research the IBS category already draws on) classifies avocado as low-FODMAP at a modest serving and high-FODMAP at a larger one, making it an example of a food where "how much" changes the answer to "is this a problem," not just "is this food a problem" in the abstract.',
    citations: [
      {
        source: 'Monash University FODMAP diet research and food-testing program',
        url: 'https://www.monashfodmap.com/',
      },
    ],
    overallTier: 'moderate',
    relatedFoodNames: ['Avocado'],
    relatedIds: ['ibs-low-fodmap-diet'],
  },
  {
    id: 'produce-leafy-greens',
    category: 'basicHealth',
    title: 'Spinach and Kale: Nutrient Powerhouses, With Two Different Cautions That Apply to Different Groups of People',
    teaser: 'The same leafy greens carry an oxalate concern for people prone to kidney stones and a vitamin K concern for people on warfarin, two entirely different, unrelated reasons to be more careful, not one.',
    summary:
      'Spinach and kale both carry dense concentrations of vitamin K, vitamin A, folate, and iron relative to their calorie content, part of why they show up so often in general nutrition advice. Two specific, unrelated cautions apply to different groups, not everyone: spinach in particular carries an unusually high oxalate content (research finds it accounts for a large share of typical dietary oxalate intake, with well under a cup providing as much oxalate as many cups of a lower-oxalate green like kale or bok choy), a documented consideration for people prone to calcium oxalate kidney stones specifically, not a general population concern. Separately, both greens\' high vitamin K content matters directly for anyone on warfarin or a similar vitamin K antagonist blood thinner, since vitamin K works through the same clotting pathway that medication is designed to slow, the standard clinical guidance isn\'t to avoid these greens, but to keep vitamin K intake consistent day to day, so the medication\'s own dosing (already calibrated against a person\'s typical diet) doesn\'t get thrown off by a sudden, large change either direction.',
    citations: [
      {
        source: 'Ferraro, Curhan et al., cohort research on dietary oxalate and kidney stone risk',
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7823532/',
      },
    ],
    overallTier: 'strong',
    relatedFoodNames: ['Spinach', 'Kale'],
    relatedIds: ['vitamink-overview'],
  },
  {
    id: 'produce-cruciferous',
    category: 'basicHealth',
    title: 'Broccoli and Cabbage: Cancer-Prevention Research, and an Already-Covered Thyroid Caveat',
    teaser: 'Cruciferous vegetables carry well-studied compounds linked to cancer-prevention research, and, specifically raw and in large amounts, a goitrogenic effect already covered in depth elsewhere.',
    summary: 'Broccoli, cabbage, and their cruciferous relatives contain glucosinolates, compounds that break down into sulforaphane and related substances with repeatedly documented anti-cancer research behind them, including the already-cited prostate-health research on sulforaphane specifically. The same glucosinolate family is also the well-established source of these vegetables\' goitrogenic effect (interfering with the thyroid\'s own iodine uptake), a caution already covered in depth under Problem Foods & Swaps, the practical, already-established real-world answer is that cooking substantially reduces the goitrogenic compounds while largely preserving the cancer-prevention-relevant ones, making raw, large-quantity consumption the actual scenario worth being deliberate about, not cruciferous vegetables broadly.',
    citations: [
      {
        source: 'Prostate Health topic, sulforaphane/cruciferous vegetable research (the already-cited source)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/34965571/',
      },
    ],
    overallTier: 'strong',
    relatedFoodNames: ['Broccoli', 'Cabbage'],
    relatedIds: ['problem-raw-cruciferous', 'produce-broccoli-sprouts-sulforaphane'],
  },
  {
    // 2026-08-19, direct request to cover sulforaphane and broccoli
    // sprouts, naming the Fahey/Zhang/Talalay Johns Hopkins research
    // program specifically. The foundational 1997 PNAS paper (PMID
    // 9294217) was verified directly via its own PMC mirror (PMC23369),
    // confirming the abstract, the 10-100x glucoraphanin figure, the
    // 3-day sprout age, and the author affiliations verbatim. The 2015
    // clinical follow-up from the same Johns Hopkins group (PMID
    // 26369337) was independently confirmed via a search-engine
    // extraction of the indexed abstract, since both PubMed and the
    // paywalled journal host blocked a direct fetch, the same fallback
    // already used elsewhere in this Digest's build.
    id: 'produce-broccoli-sprouts-sulforaphane',
    category: 'basicHealth',
    title: 'Broccoli Sprouts: The Johns Hopkins Discovery Behind Why a Small Amount Goes So Far',
    teaser: "A landmark 1997 Johns Hopkins study found three-day-old broccoli sprouts pack ten to one hundred times more of sulforaphane's own precursor than mature broccoli ever does, and later work from the same lab traced what that compound actually does once it's in the body.",
    summary:
      "Sulforaphane isn't sitting in broccoli waiting to be eaten. The plant stores a stable precursor, glucoraphanin, and only converts it into sulforaphane once the tissue is damaged (chewed, cut, or crushed) and a paired enzyme called myrosinase gets the chance to react with it. A landmark 1997 study from the Brassica Chemoprotection Laboratory at Johns Hopkins University School of Medicine, led by Jed Fahey, Yuesheng Zhang, and Paul Talalay, found that three-day-old broccoli and cauliflower sprouts contain ten to one hundred times more glucoraphanin per gram than the corresponding mature plants. The same study fed extracts of those young sprouts to rats exposed to a chemical carcinogen and found a measurable reduction in the incidence, number, and speed of tumor development, tied directly to the same compound. The mechanism behind that protection has since been mapped in detail: sulforaphane binds a protein called Keap1, freeing a second protein, Nrf2, to move into the cell's nucleus and switch on a set of genes for Phase 2 detoxification enzymes, the same enzyme family this app's own Problem Foods research already names as the target of cooking's own goitrogen-reducing effect. Those enzymes speed up how the body clears damaging molecules and reactive oxygen before they can do harm, the mechanism behind sulforaphane's own cancer-prevention research. A 2015 clinical trial from the same Johns Hopkins group tested sulforaphane directly in forty-five moderate asthma patients over two weeks, giving an honest look at how that mechanism plays out in the body: sixty percent of participants showed a measurable twenty-one percent improvement in a lung-function response to a bronchial trigger, but the response wasn't universal. Twenty percent showed no change, and another twenty percent got worse, a documented reminder that a working biological mechanism doesn't always translate into the same benefit for everyone.",
    citations: [
      {
        source: 'Fahey JW, Zhang Y, Talalay P. 1997, Proceedings of the National Academy of Sciences: Broccoli Sprouts: An Exceptionally Rich Source of Inducers of Enzymes That Protect Against Chemical Carcinogens',
        url: 'https://pubmed.ncbi.nlm.nih.gov/9294217/',
      },
      {
        source: 'Brown RH, Reynolds C, Brooker A, Talalay P, Fahey JW. 2015, Respiratory Research: Sulforaphane Improves the Bronchoprotective Response in Asthmatics Through Nrf2-Mediated Gene Pathways',
        url: 'https://pubmed.ncbi.nlm.nih.gov/26369337/',
      },
    ],
    overallTier: 'strong',
    stageNote:
      'The foundational sprout-concentration finding and its underlying Keap1-Nrf2 mechanism are both well-established and widely replicated. The clinical asthma trial adds an honest, quantified example of how that mechanism plays out in actual patients, including its own honest limit: the benefit only showed up in six of every ten participants tested, not all of them.',
    relatedFoodNames: ['Broccoli Sprouts (Raw)', 'Broccoli'],
    relatedIds: ['produce-cruciferous', 'prostate-cruciferous-sulforaphane', 'problem-raw-cruciferous'],
  },
  {
    id: 'produce-garlic-onion',
    category: 'basicHealth',
    title: 'Garlic and Onion: Cardiovascular Research, and the Same FODMAP Story Already told in Depth',
    teaser: 'Both carry documented compounds with cardiovascular research behind them, and both are already covered here as the leading FODMAP example.',
    summary: 'Garlic\'s allicin (formed only once a clove is crushed or chopped, not present in an intact clove) and onion\'s own organosulfur and quercetin content both carry research linking regular intake to modest improvements in blood pressure and lipid markers. The caution here isn\'t new, garlic and onion are already the leading, most detailed example of a high-FODMAP food (see Problem Foods & Swaps), specifically due to their fructan content, a common trigger for IBS-type symptoms independent of any allergy. This profile exists mainly to connect that already-established caution back to the specific positive research these two foods also carry, so the FODMAP concern doesn\'t read as the whole story.',
    citations: [
      {
        source: 'Ried 2016, Journal of Nutrition, meta-analysis: "Garlic Lowers Blood Pressure in Hypertensive Individuals"',
        url: 'https://pubmed.ncbi.nlm.nih.gov/26764327/',
      },
    ],
    overallTier: 'moderate',
    relatedFoodNames: ['Garlic', 'Garlic Bulb', 'Onion'],
    relatedIds: ['problem-garlic-onion'],
  },
  {
    id: 'produce-tomato',
    category: 'basicHealth',
    title: 'Tomato: A Lycopene Source (More So Cooked Than Raw), and The Named Nightshade',
    teaser: 'Cooking a tomato increases how much of its own lycopene the body can absorb, and tomato is the specific, most commonly eaten nightshade the already-honest nightshade research is about.',
    summary: 'Tomatoes carry well-documented lycopene content, and unlike most produce, cooking actually increases lycopene\'s bioavailability rather than degrading it, heat breaks down the plant cell walls holding lycopene and improves how much the body can actually absorb, part of why research on lycopene\'s cardiovascular and prostate-health associations often specifically studies cooked or processed tomato products (sauce, paste) rather than raw tomato alone. Tomato is also the single most commonly eaten member of the nightshade family, the specific food the Problem Foods research names directly when discussing nightshades\' contested, unresolved evidence (anti-inflammatory compounds exist alongside patient-reported worsening in some people, with no randomized trial settling it either way), worth reading that entry directly rather than assuming either a blanket caution or a blanket clearance applies.',
    citations: [
      {
        source: 'Story et al. 2010, Annual Review of Food Science and Technology: "An Update on the Health Effects of Tomato Lycopene"',
        url: 'https://pubmed.ncbi.nlm.nih.gov/22129337/',
      },
    ],
    overallTier: 'moderate',
    relatedFoodNames: ['Tomato'],
    relatedIds: ['problem-nightshades'],
  },
  {
    id: 'produce-sweet-potato',
    category: 'basicHealth',
    title: 'Sweet Potato: A Substantial Vitamin A Source, and a Different Food From White Potato Despite the Name',
    teaser: 'Sweet potato is botanically unrelated to white/nightshade potatoes, and a single serving can supply well over a full day\'s vitamin A on its own.',
    summary:
      'A sweet potato\'s orange color signals substantial beta-carotene content, which the body converts into vitamin A, a single medium baked sweet potato can supply well over 100 percent of a day\'s vitamin A need from provitamin-A carotenoids alone, a food-based source that (unlike preformed retinol from animal foods or supplements) doesn\'t carry the same toxicity risk at high intake, since the body regulates its own conversion rate. The worth-knowing distinction: despite the shared name, sweet potato belongs to the morning glory family (Convolvulaceae), unrelated to the nightshade family (Solanaceae) that white/regular potatoes belong to, someone specifically avoiding nightshades for a personal reason doesn\'t need to extend that same caution to sweet potato, since it isn\'t botanically related at all.',
    citations: [
      {
        source: 'NIH Office of Dietary Supplements, vitamin A fact sheet',
        url: 'https://ods.od.nih.gov/factsheets/VitaminA-HealthProfessional/',
      },
    ],
    overallTier: 'strong',
    relatedFoodNames: ['Sweet potato'],
    relatedIds: ['vitamina-overview'],
  },
  {
    // 2026-08-19, direct request to cover chickpeas' resistant starch
    // content and its role in butyrate production, plus the "gas is
    // temporary" adaptation point. A first-pass search claimed a real
    // 3-week canned-chickpea human trial found a non-significant decrease
    // in fecal acetate/butyrate, contradicted by a second, more careful
    // search of the same underlying paper (PMID 21831757). Re-verified
    // directly via a third, targeted search that returned the paper's own
    // real, positive finding (increased Faecalibacterium prausnitzii, a
    // known butyrate producer) and the correct author list, resolving the
    // discrepancy before either version was trusted, the same discipline
    // already used repeatedly elsewhere in this Digest's build.
    id: 'produce-chickpeas',
    category: 'basicHealth',
    title: 'Chickpeas: A Resistant Starch That Reaches the Colon Intact, and the Temporary Gas That Comes With It',
    teaser: "The same undigested starch that can cause gas early on is what gut bacteria ferment into butyrate, the short-chain fatty acid research finds does the most for the gut lining and for calming inflammation.",
    summary:
      "Chickpeas carry a meaningful amount of resistant starch, the fraction of a food's starch that resists breakdown in the small intestine and reaches the colon largely intact. That's the practical reason chickpeas can cause noticeable gas: the same starch a typical meal would otherwise digest and absorb higher up in the gut instead becomes food for the trillions of bacteria living in the colon. What those bacteria do with it is the point. Fermenting resistant starch is one of the most reliable ways to produce short-chain fatty acids, and butyrate specifically stands out among them, the primary fuel source for the cells lining the colon, and, per a recent narrative review, the most potent of the three main short-chain fatty acids at inhibiting an enzyme (HDAC) tied to calming inflammatory gene activity, directly building on the Treg-induction mechanism this app's own Gut & Microbiome research already covers. How chickpeas are prepared changes how much resistant starch actually reaches the colon: a controlled trial in 12 healthy adults found cooking chickpea pasta and then cooling it for 24 hours before reheating roughly doubled its resistant starch content, from 1.83 to 3.65 grams per 100 grams, and produced a measurably lower blood sugar response than eating it freshly cooked. A separate randomized trial in 12 healthy adults giving 200 grams of canned chickpeas a day for three weeks found it increased the abundance of Faecalibacterium prausnitzii, a specific, efficient, well-studied butyrate-producing gut bacterium, while reducing a group of putrefactive and pathogenic bacteria at the same time. And the gas itself does tend to ease. Research on a different, well-studied fiber found symptoms peaked in the first few weeks of a higher intake and returned to baseline by the end of a six-week trial, with the degree of that adaptation tied to a person's own starting gut bacteria, the same general pattern behind the common advice to increase fiber intake gradually rather than all at once.",
    citations: [
      {
        source: 'Bojarczuk A, Kęszycka P, Marszałek K, Gajewska D. 2024, Metabolites: cooking and cooling chickpea pasta, resistant starch content, and glycemic response in healthy adults',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11596303/',
      },
      {
        source: 'Fernando WMU, Hill JE, Zello GA, Tyler RT, Dahl WJ, Van Kessel AG. 2010, Beneficial Microbes: diets supplemented with chickpea or its main oligosaccharide component raffinose modify faecal microbial composition in healthy adults',
        url: 'https://pubmed.ncbi.nlm.nih.gov/21831757/',
      },
      {
        source: "Kalkan AE, et al. 2025, Nutrients: Beyond the Gut, unveiling butyrate's global health impact through gut health and dysbiosis-related conditions, a narrative review",
        url: 'https://pubmed.ncbi.nlm.nih.gov/40284169/',
      },
      {
        source: 'Deehan EC, et al. 2024, Gut Microbes: adaptation to tolerate high doses of arabinoxylan is associated with fecal levels of Bifidobacterium longum',
        url: 'https://pubmed.ncbi.nlm.nih.gov/38860973/',
      },
    ],
    overallTier: 'strong',
    stageNote:
      'The cooking-and-cooling and Faecalibacterium prausnitzii findings both come from controlled human trials on chickpeas specifically. The gas-adaptation citation studied a different fiber (arabinoxylan, not chickpea resistant starch) to illustrate the same general pattern, not a chickpea-specific trial of that exact question.',
    relatedFoodNames: ['Chickpeas (garbanzo beans, bengal gram)'],
    relatedIds: ['gut-scfa-treg', 'carbfiber-intake-gap'],
  },
  {
    id: 'produce-almonds',
    category: 'basicHealth',
    title: 'Almonds: A Concentrated Vitamin E and Healthy-Fat Source, and a Tree Nut Allergen',
    teaser: 'Almonds carry a high vitamin E concentration for a whole food, alongside monounsaturated fat, and are one of the eight foods responsible for the large majority of food allergies.',
    summary:
      'Almonds are one of the richest common whole-food sources of vitamin E, a fat-soluble antioxidant, alongside monounsaturated fat, fiber, and magnesium content, research consistently links regular tree nut intake, almonds included, to modest improvements in cardiovascular risk markers. The one important caution: almonds are a tree nut, and tree nuts collectively are among the small number of foods responsible for the substantial majority of serious food allergic reactions, a different and more severe kind of concern than any of this topic\'s other cautions (which are mostly dose- or condition-dependent sensitivities, not immune-system allergic reactions). Someone with a known or suspected tree nut allergy should treat this as a separate category of risk from everything else in this topic, not a milder version of the same kind of caution.',
    citations: [
      {
        source: 'NIH Office of Dietary Supplements, vitamin E fact sheet',
        url: 'https://ods.od.nih.gov/factsheets/VitaminE-HealthProfessional/',
      },
    ],
    overallTier: 'strong',
    relatedFoodNames: ['Almonds'],
  },
  {
    id: 'produce-walnut',
    category: 'basicHealth',
    title: 'Walnut: The One Common Tree Nut With a Meaningful Amount of Plant-Based Omega-3',
    teaser: 'Walnuts carry a higher ALA omega-3 content than almost any other common nut, a distinct nutritional profile from the rest of the tree-nut family.',
    summary:
      'Most tree nuts carry their fat content mostly as monounsaturated fat, similar to almonds or avocado. Walnuts are an exception: they carry a meaningfully higher share of alpha-linolenic acid (ALA), the plant-based omega-3 fatty acid, than nearly any other common nut, part of why walnuts specifically (not tree nuts broadly) show up so often in cardiovascular research on plant-based omega-3 intake. The same tree nut allergy caution named for almonds applies here too, walnuts are one of the same small group of foods responsible for the substantial majority of serious food allergic reactions, a separate risk category from this topic\'s other, dose-dependent cautions.',
    citations: [
      {
        source: 'NIH Office of Dietary Supplements, omega-3 fatty acids fact sheet',
        url: 'https://ods.od.nih.gov/factsheets/Omega3FattyAcids-HealthProfessional/',
      },
    ],
    overallTier: 'strong',
    relatedFoodNames: ['Walnut'],
    relatedIds: ['omega36-overview'],
  },
  {
    // 2026-08-19, direct request to check whether whole vs. ground chia
    // seeds affects digestion/absorption the same way this file's own
    // adjacent flaxseed entry already covers. Both new citations
    // independently verified via WebSearch, with consistent design/results
    // across multiple independent aggregations before being trusted, given
    // both PubMed and the journal hosts blocked a direct fetch (the same
    // fallback already used elsewhere in this Digest's build).
    id: 'produce-chia-seeds',
    category: 'basicHealth',
    title: "Chia Seeds: A Choking Caution When Dry, and Why Whole Doesn't Absorb Like Ground",
    teaser: "Chia's soluble fiber expands dramatically in liquid, a documented choking hazard when eaten dry, and the same tough outer coat behind that hazard also means whole seeds don't raise blood omega-3 levels the way ground seeds do.",
    summary:
      "Chia seeds carry meaningful fiber (mostly soluble), plant-based ALA omega-3, and calcium content for their size, and their soluble fiber has a distinctive property: it absorbs many times its own weight in liquid, forming a gel, which is both the mechanism behind the popular chia pudding texture and a documented safety consideration. Swallowing dry chia seeds followed immediately by liquid, or swallowing them without adequately chewing or pre-soaking, has documented case reports of the seeds expanding in the esophagus and causing a choking or blockage hazard, the practical, well-established fix is simply soaking chia seeds in liquid for at least several minutes before eating them, which is already how they're used in the Smoothie Builder and similar recipes, not a reason to avoid them. Whether whole or ground makes an absorption difference has an actual controlled answer: a randomized trial in 62 postmenopausal women gave whole chia, milled (ground) chia, or a placebo seed, 25 grams a day for 10 weeks, and found milled chia significantly raised plasma ALA and EPA, the two omega-3 compounds chia actually delivers, while the whole-chia group showed no significant change from placebo. A separate, smaller trial giving 25 grams a day of milled chia specifically found plasma ALA climbing 138% above baseline and EPA 30% above baseline within seven weeks, a concrete, quantified sense of how much a milled dose can actually move blood omega-3 levels. Chia's own outer seed coat appears to be the limiting factor: swallowed intact, much of what's packed inside a chia seed likely never gets broken down enough for the body to absorb it, the same reasoning already established for flaxseed. Soaking a whole chia seed until it forms its own gel coat softens it, but a blender or spice grinder is the more reliable way to actually access its omega-3 content, not just its fiber.",
    citations: [
      {
        source: 'Bulman et al. 2016, Case Reports in Emergency Medicine: esophageal obstruction from dry chia seed ingestion',
        url: 'https://pubmed.ncbi.nlm.nih.gov/27110409/',
      },
      {
        source: 'Nieman DC, Shanely RA, et al. 2012, Journal of Alternative and Complementary Medicine: chia seed supplementation (whole vs. milled) and disease risk factors in overweight women',
        url: 'https://pubmed.ncbi.nlm.nih.gov/22830971/',
      },
      {
        source: 'Jin F, Nieman DC, et al. 2012, Plant Foods for Human Nutrition: supplementation of milled chia seeds increases plasma ALA and EPA in postmenopausal women',
        url: 'https://pubmed.ncbi.nlm.nih.gov/22538527/',
      },
    ],
    overallTier: 'moderate',
    relatedFoodNames: ['Chia seeds'],
    relatedIds: ['produce-flaxseed'],
  },
  {
    id: 'produce-flaxseed',
    category: 'basicHealth',
    title: 'Flaxseed: Lignan and Omega-3 Content, and Ground Rather Than Whole Is What Actually Makes It Usable',
    teaser: 'Whole flaxseed largely passes through the body undigested, grinding it is what actually unlocks its fiber and omega-3 content, not a matter of preference.',
    summary:
      'Flaxseed carries substantial ALA omega-3 content and the highest lignan concentration of any common food (lignans are a plant-based phytoestrogen with research behind their potential role in hormone-sensitive conditions), but whole flaxseed\'s hard outer seed coat means most of it passes through the digestive tract largely intact, unabsorbed, ground flaxseed (or flaxseed meal) is necessary to actually access its nutrient content, not simply a texture preference. The worth-knowing caution: flaxseed naturally contains a low level of cyanogenic glycosides, compounds that can release a small amount of hydrogen cyanide when broken down, but safety-agency assessment found the amount released at normal consumption levels (up to roughly 30 grams of ground flaxseed in a sitting) poses no meaningful risk to adolescents or adults, and heating flaxseed (baking, cooking) further reduces it, a quantified, reassuring answer rather than a reason for concern at ordinary culinary amounts.',
    citations: [
      {
        source: 'Austrian Agency for Health and Food Safety (AGES), cyanogenic glycosides in flaxseed safety assessment',
        url: 'https://www.ages.at/en/research/wissen-aktuell/detail/cyanogenic-glycosides-in-flaxseed',
      },
    ],
    overallTier: 'moderate',
    relatedFoodNames: ['Flaxseed Seeds', 'Seed, linseed or flaxseed'],
    relatedIds: ['choline-overview', 'produce-chia-seeds'],
  },
  {
    id: 'produce-closing',
    category: 'basicHealth',
    title: 'How to Actually Use This Topic: One Profile, Then Its Cross-Links',
    teaser: 'Every caution named across this topic points back to a fuller, already-built entry elsewhere in this Digest, this topic is meant as the entry point, not the whole story.',
    summary: 'Nearly every specific caution named across this topic (goitrogens, FODMAPs, oxalates, vitamin K and blood thinners, tree nut allergy, grapefruit\'s drug interaction) already has its own fuller, independently cited entry elsewhere, deliberately cross-linked from the relevant profile rather than repeated in full here. The intended use of this topic is as a fast starting point: someone wondering "what\'s the deal with spinach" or "is walnut actually different from other nuts" gets an honest first answer here, with a direct path to the deeper research behind whichever specific caution or benefit actually applies to them. As with every other growing series, this is a first, batch, not a claim of covering every fruit, vegetable, nut, and seed in the 22,000-food reference database, more profiles are a standing next step.',
    citations: [
      {
        source: 'NASEM Dietary Reference Intakes, general fruit/vegetable intake guidance',
        url: 'https://ods.od.nih.gov/HealthInformation/nutrientrecommendations.aspx',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['produce-overview'],
  },
];
