import type { DigestEntry } from './types';

// Fermentation Methods: How Each Type Is Actually Made -- new 2026-08-09,
// direct request: "talk about the different ways of making fermentations
// for drinks and foods and talk about which types of gut bacteria they can
// provide, and how they are generally made and where to look for more
// information from highly reputable and trustworthy sources, and they
// should be the kinds of things that are available to make in the
// fermentation builder." A real, deliberate companion to the existing
// Fermented Foods category (lib/digest/fermentedFoods.ts), not a
// duplicate of it -- that file is organized by STRAIN (what a specific
// bacterium does), already covering kombucha, water kefir, milk kefir,
// beet kvass, and sauerkraut's own real microbial succession in depth.
// This file is organized by METHOD (how a person actually makes each kind
// of ferment at home), cross-linking into that existing strain science
// rather than repeating it, and every method here maps directly onto a
// real category already in Fermentation Builder's own allowlist (see
// constants/foodBuilderCategories.ts's FERMENTATION_BUILDER_CATEGORIES --
// Veg/Fruit for lacto-ferments, Dairy for kefir/yogurt, Bev/Brewing for
// kombucha and water kefir, Grain for sourdough).
export const FERMENTATION_METHODS_ENTRIES: DigestEntry[] = [
  {
    id: 'fermentmethod-overview',
    category: 'basicHealth',
    title: 'Six Ways to Ferment Something at Home, and What Each One Actually Does',
    teaser: 'Lacto-fermented vegetables, kombucha, water kefir, milk kefir, yogurt, and sourdough all work through different microbial processes, not one technique with six names.',
    summary: 'Every method below shares the same basic principle (a living microbial culture is deliberately given the conditions it needs to outcompete spoilage organisms while producing something worth eating or drinking), but the actual mechanism, culture, and result differ meaningfully method to method. Lacto-fermentation uses salt and an oxygen-free environment to favor naturally present Lactobacillus and Leuconostoc species already on raw vegetables. Kombucha and water kefir both use a mixed bacteria-and-yeast culture fermenting a sugared liquid, but a different culture each (a SCOBY vs. Kefir grains). Milk kefir and yogurt both ferment dairy, but with different cultures and a different fermentation temperature and time. Sourdough ferments flour and water using wild bacteria and yeast that mostly arrive with the flour itself. Every one of these maps directly onto a Fermentation Builder ingredient category, and every specific strain named below has its deeper, individually cited entry\'s Fermented Foods topic.',
    citations: [
      {
        source: 'National Center for Home Food Preservation (University of Georgia) fermentation overview',
        url: 'https://nchfp.uga.edu/how/can_ferment.html',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['fermentmethod-reputable-sources', 'fermented-tying-together'],
  },
  {
    id: 'fermentmethod-lacto-fermented-vegetables',
    category: 'basicHealth',
    title: 'Lacto-Fermented Vegetables: Salt, an Airtight Seal, and Time Do Almost All the Work',
    teaser: 'Sauerkraut, kimchi, and brined pickles all rely on the same mechanism, a salt brine strong enough to favor Lactobacillus and Leuconostoc while suppressing everything that would otherwise spoil the vegetable.',
    summary: 'A lacto-ferment starts with raw vegetables, a salt concentration (typically 2 to 3 percent of the vegetable\'s weight, either dry-salted or as a brine), and an airtight or air-lock-sealed container that keeps the batch submerged and away from oxygen. Salt at this concentration draws water out of the vegetable through osmosis, creating the brine itself, while suppressing many spoilage organisms that can\'t tolerate that salt level, the lactic acid bacteria already naturally present on the vegetable\'s surface (Leuconostoc mesenteroides typically starts the fermentation, with Lactobacillus plantarum becoming dominant as the batch sours further) tolerate it fine and take over. As they consume the vegetable\'s natural sugars, they produce lactic acid, which drops the pH low enough to make the finished ferment inhospitable to harmful bacteria, the reason this method has worked as a food-preservation technique for thousands of years before refrigeration existed. This is exactly what Fermentation Builder\'s Veg and Fruit categories are built to log, a home-fermented batch built from raw ingredients, not a store-bought jar. The Fermented Foods research covers the staged succession of bacteria across a fermenting batch, and Lactobacillus plantarum\'s individually documented effects, in much greater depth.',
    citations: [
      {
        source: 'National Center for Home Food Preservation (University of Georgia) fermented vegetables guidance',
        url: 'https://nchfp.uga.edu/how/can_ferment.html',
      },
    ],
    overallTier: 'strong',
    stageNote: 'Maps to Fermentation Builder\'s Veg/Fruit ingredient categories.',
    relatedIds: ['fermented-sauerkraut-succession', 'fermented-lactobacillus-plantarum', 'fermented-leuconostoc-mesenteroides'],
  },
  {
    id: 'fermentmethod-kombucha',
    category: 'basicHealth',
    title: 'Kombucha: A SCOBY Turns Sweetened Tea Into a Tart, Lightly Effervescent Drink Over One to Two Weeks',
    teaser: 'A symbiotic culture of bacteria and yeast (the SCOBY) ferments sweetened black or green tea in two stages, the second of which is where flavor and carbonation actually develop.',
    summary: 'Kombucha starts with brewed, sweetened tea (the sugar and tea both feed the culture, not the finished drink itself) and a SCOBY, a symbiotic culture of bacteria and yeast that forms a visible, rubbery mat on the liquid\'s surface. The yeast component converts sugar into alcohol and carbon dioxide, and acetic acid bacteria (the same broad family behind vinegar) then convert much of that alcohol into acetic and other organic acids, which is the source of kombucha\'s tart, vinegar-adjacent flavor. A first fermentation (typically 7 to 14 days at room temperature) produces the base tart liquid; a common second fermentation, sealing the liquid with added fruit or flavoring in an airtight bottle for a few more days, is what builds natural carbonation. The Fermentation Builder needs its Brewing category alongside Bev specifically for this reason, kombucha is brewed FROM tea, not a plain beverage ingredient on its own. The Fermented Foods research covers kombucha\'s culture composition and a safety-relevant caution (measurable alcohol content, especially in a longer second fermentation) in more depth.',
    citations: [
      {
        source: 'National Center for Home Food Preservation (University of Georgia) fermentation overview',
        url: 'https://nchfp.uga.edu/how/can_ferment.html',
      },
    ],
    overallTier: 'strong',
    stageNote: 'Maps to Fermentation Builder\'s Brewing and Bev ingredient categories.',
    relatedIds: ['fermented-kombucha'],
  },
  {
    id: 'fermentmethod-water-kefir',
    category: 'basicHealth',
    title: 'Water Kefir: The Same Basic Idea as Kombucha, but a Different Culture and No Tea Required',
    teaser: 'Water kefir grains (a different culture from kombucha\'s SCOBY) ferment plain sugar water into a milder, less tart, naturally carbonated drink in as little as 24 to 48 hours.',
    summary: 'Water kefir uses "grains," small, gelatinous, cauliflower-like clusters that are themselves a living community of multiple bacteria and yeast species living together, fermenting plain sugar water (sometimes with added dried fruit for extra nutrients) rather than tea. The fermentation itself runs meaningfully faster than kombucha, often finished in 24 to 48 hours at room temperature, producing a milder, less acidic, lightly effervescent drink. Because the grains are a different culture from a kombucha SCOBY, water kefir isn\'t simply "kombucha without tea", it\'s its distinct fermentation with its microbial makeup. The Fermented Foods research covers water kefir\'s microbial diversity and a worth-knowing caution (measurable alcohol content that can rise further with a longer or bottle-conditioned second ferment) in more depth.',
    citations: [
      {
        source: 'National Center for Home Food Preservation (University of Georgia) fermentation overview',
        url: 'https://nchfp.uga.edu/how/can_ferment.html',
      },
    ],
    overallTier: 'strong',
    stageNote: 'Maps to Fermentation Builder\'s Bev ingredient category.',
    relatedIds: ['fermented-water-kefir'],
  },
  {
    id: 'fermentmethod-milk-kefir-and-yogurt',
    category: 'basicHealth',
    title: 'Milk Kefir and Yogurt Both Ferment Dairy, but With Different Cultures, Temperatures, and Results',
    teaser: 'Yogurt needs a warm, held temperature and just two specific bacterial species by international standard; milk kefir ferments at room temperature with a much broader, more varied culture.',
    summary: 'Yogurt has an internationally codified definition: the Codex Alimentarius (the joint FAO/WHO international food standards body) requires yogurt to be made using live cultures of specifically Streptococcus thermophilus and Lactobacillus delbrueckii subsp. Bulgaricus, fermented at a warm, held temperature (commonly around 110 degrees Fahrenheit / 43 degrees Celsius) for several hours until the milk thickens and sours. Milk kefir works differently: kefir grains, a more complex, multi-species community of bacteria and yeast than yogurt\'s standard two-strain culture, ferment milk at ordinary room temperature over roughly 24 hours, producing a thinner, tangier, lightly effervescent drink rather than yogurt\'s thicker set texture, with a broader range of live organisms as a direct result of that more complex starter culture. Both map to Fermentation Builder\'s Dairy ingredient category. The Fermented Foods research covers milk kefir\'s culture composition, and both Streptococcus thermophilus and several individual Lactobacillus species\' own documented effects, in far more depth, including the household\'s two staged home yogurt batches (an 18-hour and a 36-hour recipe, chosen specifically around which strains need which fermentation time to establish).',
    citations: [
      {
        source: 'Codex Alimentarius (FAO/WHO) Standard for Fermented Milks, yogurt starter-culture requirement',
        url: 'https://www.fao.org/fao-who-codexalimentarius/sh-proxy/en/?lnk=1&url=https%253A%252F%252Fworkspace.fao.org%252Fsites%252Fcodex%252FStandards%252FCXS%2B243-2003%252FCXS_243e.pdf',
      },
    ],
    overallTier: 'strong',
    stageNote: 'Maps to Fermentation Builder\'s Dairy ingredient category.',
    relatedIds: ['fermented-milk-kefir', 'fermented-streptococcus-thermophilus'],
  },
  {
    id: 'fermentmethod-sourdough',
    category: 'basicHealth',
    title: 'A Sourdough Starter Is a Wild, Self-Sustaining Culture, Most of Its Microbes Come From the Flour Itself',
    teaser: 'A genome-level study found sourdough starters\' own bacteria and yeast are most similar to what\'s already living in the flour used to feed them, not something added from outside.',
    summary:
      'A sourdough starter begins as nothing more than flour and water, left to sit, and it works because flour itself already carries live wild bacteria and yeast. Research profiling starters from around the world has identified over 60 bacterial genera and 80 yeast species across different starters globally, though any one individual starter is typically dominated by just a few species: lactic acid bacteria (most commonly Lactiplantibacillus plantarum, Levilactobacillus brevis, Fructilactobacillus sanfranciscensis, or Limosilactobacillus fermentum) alongside a small number of wild yeast species (most often Saccharomyces cerevisiae and various Kazachstania species). A direct finding from that same research: the microbial community in a given starter closely tracks the community already present in the flour it\'s fed, meaning most of a starter\'s microbes arrive with the flour itself rather than from the air or the baker\'s hands, as often assumed. The yeast component produces the carbon dioxide that makes dough rise; the lactic acid bacteria produce the sour flavor and lower the dough\'s pH, both leavening and naturally preserving the finished bread. Maps to Fermentation Builder\'s Grain category.',
    citations: [
      {
        source: 'Landis et al., eLife: "The diversity and function of sourdough starter microbiomes"',
        url: 'https://elifesciences.org/articles/61644',
      },
    ],
    overallTier: 'strong',
    stageNote: 'Maps to Fermentation Builder\'s Grain ingredient category.',
    relatedIds: ['fermentmethod-lacto-fermented-vegetables'],
  },
  {
    id: 'fermentmethod-reputable-sources',
    category: 'basicHealth',
    title: 'Where to Go Deeper Once a Method Is Familiar, Trustworthy Places to Learn More',
    teaser: 'For food-safety guidance specifically, a university/government-affiliated resource is worth trusting over a blog; for technique and troubleshooting, a few established names hold up.',
    summary: 'For food-safety guidance on home fermentation specifically (how much salt is actually safe, what a spoilage sign looks like versus a normal part of the process, canning and storage guidance for a finished ferment), the National Center for Home Food Preservation, a University of Georgia program working with the USDA, is a government/university-affiliated resource built specifically for this purpose, not a commercial site with a product to sell. For technique, troubleshooting, and the cultural/historical breadth of fermentation across cuisines, Sandor Katz\'s The Art of Fermentation is a widely regarded, thoroughly researched standard reference in the fermentation community, distinct from a manufacturer\'s marketing material for a specific starter-culture product. For the deeper microbiology behind any specific ferment (which species are doing what, and why), the Fermented Foods topic already carries individually cited, peer-reviewed research on every major strain named across the methods above, the practical "how it\'s made" guide here is meant as the on-ramp into that deeper, already-built research, not a replacement for it.',
    citations: [
      {
        source: 'National Center for Home Food Preservation (University of Georgia, USDA-affiliated)',
        url: 'https://nchfp.uga.edu/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['fermentmethod-overview', 'fermented-tying-together', 'fermented-sourcing-starters', 'garden-preserving-the-harvest'],
  },
  {
    id: 'fermentmethod-wild-tonics',
    category: 'basicHealth',
    title: 'Wild-Fermented Fruit Tonics (Tepache-Style): No Starter Culture Required',
    teaser: 'Raw ginger and turmeric skins carry their wild yeast, enough to seed a fermenting tonic from almost any fruit, no SCOBY or kefir grains needed.',
    summary: 'Tepache, the traditional Mexican pineapple ferment, works without any separate starter culture because pineapple rind carries an unusually heavy load of wild yeast on its skin. Most other fruit doesn\'t carry that much, and frozen fruit carries almost none at all, since freezing kills or stuns the surface microbes that would otherwise start the ferment. Raw, organic, unpeeled ginger and turmeric solve both problems: their skins carry their wild yeast and lactic acid bacteria, strong enough to seed a batch built from fresh, frozen, or otherwise low-yeast fruit. The method stays the same across nearly any fruit: roughly 2 cups of crushed or chopped fruit, 1-2 tablespoons of unpeeled ginger and turmeric, 1/4 to 1/3 cup of raw honey or sugar, and 4 cups of filtered water, left covered with a breathable cloth and stirred twice a day (keeping the fruit submerged prevents mold) for 3-5 days until tangy and lightly carbonated. This app\'s Recipes category carries this method built out across ten separate fruit and flower variations, each with its condition-specific framing.',
    citations: [
      {
        source: 'National Center for Home Food Preservation (University of Georgia) fermentation overview',
        url: 'https://nchfp.uga.edu/how/can_ferment.html',
      },
    ],
    overallTier: 'strong',
    stageNote: 'Maps to Fermentation Builder\'s Fruit and Veg ingredient categories.',
    relatedIds: ['fermentmethod-lacto-fermented-vegetables', 'fermented-sauerkraut-succession', 'interaction-curcumin-piperine'],
  },
  {
    id: 'fermentmethod-dairy-free-gluten-free-survey',
    category: 'basicHealth',
    title: 'Which Traditional Fermented Drinks Fit a Dairy-Free, Gluten-Free Diet',
    teaser: 'From Mauby bark to Sobia\'s barley, a world tour of fermented drinks sorted by what they\'re actually made from before a name alone tells you whether one fits your own diet.',
    summary: 'Traditional fermented drinks span a wide range of base ingredients, and a name alone doesn\'t reveal whether one carries dairy or gluten. Dairy-based: Milk Kefir and Calpis (a Japanese cultured milk drink) both rely on casein and lactose, which fermentation reduces but doesn\'t eliminate. Ayran and Lassi are yogurt-based drinks from Turkey/Central Asia and India respectively, thinned with water and sometimes salt or fruit. Tarag, a traditional Mongolian ferment, uses mare\'s or camel\'s milk, neither of which this app\'s reference database carries. Grain-based, often carrying gluten: Sobia (Saudi Arabian, traditionally made from oats or barley, with a contamination risk unless certified gluten-free grain is used specifically), Burdock and Dandelion Ale (a British herbal ferment traditionally using barley malt as its fermentable sugar source), Boza (a thick Balkan/Turkish millet or wheat ferment), rye Kvass (Russian/Ukrainian, distinct from beet kvass, built on rye bread), Sake and Makgeolli (Japanese and Korean rice ferments, gluten-free by ingredient but alcoholic), and Rejuvelac (traditionally sprouted wheat berries, though a gluten-free grain like quinoa or millet works as a direct substitute). Corn-based: Pozol, a Mesoamerican fermented corn dough drink; corn itself is gluten-free but a known cross-reactive grain for some gluten-sensitive people. Amazake, a Japanese fermented rice drink made with koji mold, is gluten-free but carries a high glycemic load from the maltose fermentation produces. Sap and bark-based, generally outside what a home kitchen can source: Palm Wine (fermented palm sap), Pulque (fermented agave sap), Chicha (fermented maize, traditionally with a saliva-based starter in some regional versions), Mauby (fermented soldierwood tree bark), and Pine Needle Cheong (a Korean fresh pine needle and sugar ferment). Tea-based, dairy-free and gluten-free throughout: Pu-erh (a post-fermented Chinese tea, distinct from kombucha\'s live-culture fermentation) alongside this app\'s already-built Kombucha and Jun Tea. Every drink in this app\'s Recipes category was chosen specifically because it clears both the dairy and gluten bar without needing a substitution.',
    citations: [
      {
        source: 'National Center for Home Food Preservation (University of Georgia) fermentation overview',
        url: 'https://nchfp.uga.edu/how/can_ferment.html',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['fermentmethod-wild-tonics', 'fermentmethod-milk-kefir-and-yogurt'],
  },
];
