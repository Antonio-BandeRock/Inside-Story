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
    title: 'Six Real Ways to Ferment Something at Home, and What Each One Actually Does',
    teaser: 'Lacto-fermented vegetables, kombucha, water kefir, milk kefir, yogurt, and sourdough all work through genuinely different microbial processes -- not one technique with six names.',
    summary:
      'Every method below shares the same basic principle (a real, living microbial culture is deliberately given the conditions it needs to outcompete spoilage organisms while producing something worth eating or drinking), but the actual mechanism, culture, and result differ meaningfully method to method. Lacto-fermentation uses salt and an oxygen-free environment to favor naturally present Lactobacillus and Leuconostoc species already on raw vegetables. Kombucha and water kefir both use a mixed bacteria-and-yeast culture fermenting a sugared liquid, but a genuinely different culture each (a SCOBY vs. kefir grains). Milk kefir and yogurt both ferment dairy, but with different cultures and a different real fermentation temperature and time. Sourdough ferments flour and water using wild bacteria and yeast that mostly arrive with the flour itself. Every one of these maps directly onto a real Fermentation Builder ingredient category in this app, and every specific strain named below has its own deeper, individually cited entry in this Digest\'s own Fermented Foods topic.',
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
    title: 'Lacto-Fermented Vegetables: Salt, an Airtight Seal, and Time Do Almost All the Real Work',
    teaser: 'Sauerkraut, kimchi, and brined pickles all rely on the same real mechanism -- a salt brine strong enough to favor Lactobacillus and Leuconostoc while suppressing everything that would otherwise spoil the vegetable.',
    summary:
      'A lacto-ferment starts with raw vegetables, a real salt concentration (typically 2 to 3 percent of the vegetable\'s own weight, either dry-salted or as a brine), and an airtight or air-lock-sealed container that keeps the batch submerged and away from oxygen. Salt at this concentration draws water out of the vegetable through osmosis, creating the brine itself, while suppressing many spoilage organisms that can\'t tolerate that salt level -- the lactic acid bacteria already naturally present on the vegetable\'s own surface (Leuconostoc mesenteroides typically starts the real fermentation, with Lactobacillus plantarum becoming dominant as the batch sours further) tolerate it fine and take over. As they consume the vegetable\'s own natural sugars, they produce lactic acid, which drops the pH low enough to make the finished ferment genuinely inhospitable to harmful bacteria, the real reason this method has worked as a food-preservation technique for thousands of years before refrigeration existed. This is exactly what Fermentation Builder\'s own Veg and Fruit categories are built to log -- a real, home-fermented batch built from raw ingredients, not a store-bought jar. This app\'s own Fermented Foods research covers the real, staged succession of bacteria across a fermenting batch, and Lactobacillus plantarum\'s own individually documented effects, in much greater depth.',
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
    teaser: 'A symbiotic culture of bacteria and yeast (the SCOBY) ferments sweetened black or green tea in two real stages, the second of which is where flavor and carbonation actually develop.',
    summary:
      'Kombucha starts with brewed, sweetened tea (the sugar and tea both feed the culture, not the finished drink itself) and a SCOBY, a real symbiotic culture of bacteria and yeast that forms a visible, rubbery mat on the liquid\'s surface. The yeast component converts sugar into alcohol and carbon dioxide, and acetic acid bacteria (the same broad family behind vinegar) then convert much of that alcohol into acetic and other organic acids, which is the real source of kombucha\'s own tart, vinegar-adjacent flavor. A first fermentation (typically 7 to 14 days at room temperature) produces the base tart liquid; a common second fermentation, sealing the liquid with added fruit or flavoring in a airtight bottle for a few more days, is what builds real natural carbonation. This app\'s own Fermentation Builder needs its Brewing category alongside Bev specifically for this reason -- kombucha is brewed FROM tea, not a plain beverage ingredient on its own. This app\'s own Fermented Foods research covers kombucha\'s own real culture composition and a genuine safety-relevant caution (real, measurable alcohol content, especially in a longer second fermentation) in more depth.',
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
    title: 'Water Kefir: The Same Basic Idea as Kombucha, but a Genuinely Different Culture and No Tea Required',
    teaser: 'Water kefir grains (a different real culture from kombucha\'s SCOBY) ferment plain sugar water into a milder, less tart, naturally carbonated drink in as little as 24 to 48 hours.',
    summary:
      'Water kefir uses "grains," small, gelatinous, cauliflower-like clusters that are themselves a real, living community of multiple bacteria and yeast species living together, fermenting plain sugar water (sometimes with added dried fruit for extra nutrients) rather than tea. The fermentation itself runs meaningfully faster than kombucha, often finished in 24 to 48 hours at room temperature, producing a milder, less acidic, lightly effervescent drink. Because the grains are a genuinely different culture from a kombucha SCOBY, water kefir isn\'t simply "kombucha without tea" -- it\'s its own distinct fermentation with its own real microbial makeup. This app\'s own Fermented Foods research covers water kefir\'s own real microbial diversity and a genuine, worth-knowing caution (real, measurable alcohol content that can rise further with a longer or bottle-conditioned second ferment) in more depth.',
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
    title: 'Milk Kefir and Yogurt Both Ferment Dairy, but With Different Cultures, Temperatures, and Real Results',
    teaser: 'Yogurt needs a warm, held temperature and just two specific bacterial species by international standard; milk kefir ferments at room temperature with a much broader, more varied culture.',
    summary:
      'Yogurt has a real, internationally codified definition: the Codex Alimentarius (the joint FAO/WHO international food standards body) requires yogurt to be made using live cultures of specifically Streptococcus thermophilus and Lactobacillus delbrueckii subsp. bulgaricus, fermented at a warm, held temperature (commonly around 110 degrees Fahrenheit / 43 degrees Celsius) for several hours until the milk thickens and sours. Milk kefir works differently: real kefir grains, a genuinely more complex, multi-species community of bacteria and yeast than yogurt\'s standard two-strain culture, ferment milk at ordinary room temperature over roughly 24 hours, producing a thinner, tangier, lightly effervescent drink rather than yogurt\'s thicker set texture, with a real, broader range of live organisms as a direct result of that more complex starter culture. Both map to Fermentation Builder\'s Dairy ingredient category. This app\'s own Fermented Foods research covers milk kefir\'s own real culture composition, and both Streptococcus thermophilus and several individual Lactobacillus species\' own documented effects, in far more depth -- including the household\'s own two real, staged home yogurt batches (an 18-hour and a 36-hour recipe, chosen specifically around which strains need which real fermentation time to establish).',
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
    title: 'A Sourdough Starter Is a Wild, Self-Sustaining Culture -- Most of Its Real Microbes Come From the Flour Itself',
    teaser: 'A real, genome-level study found sourdough starters\' own bacteria and yeast are most similar to what\'s already living in the flour used to feed them, not something added from outside.',
    summary:
      'A sourdough starter begins as nothing more than flour and water, left to sit, and it works because flour itself already carries real, live wild bacteria and yeast. Research profiling starters from around the world has identified over 60 real bacterial genera and 80 yeast species across different starters globally, though any one individual starter is typically dominated by just a few species: lactic acid bacteria (most commonly Lactiplantibacillus plantarum, Levilactobacillus brevis, Fructilactobacillus sanfranciscensis, or Limosilactobacillus fermentum) alongside a small number of wild yeast species (most often Saccharomyces cerevisiae and various Kazachstania species). A real, direct finding from that same research: the microbial community in a given starter closely tracks the community already present in the flour it\'s fed, meaning most of a starter\'s own real microbes arrive with the flour itself rather than from the air or the baker\'s hands, as often assumed. The yeast component produces the carbon dioxide that makes dough rise; the lactic acid bacteria produce the real sour flavor and lower the dough\'s pH, both leavening and naturally preserving the finished bread. Maps to Fermentation Builder\'s Grain category.',
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
    title: 'Where to Go Deeper Once a Method Is Familiar -- Real, Trustworthy Places to Learn More',
    teaser: 'For real food-safety guidance specifically, a university/government-affiliated resource is worth trusting over a blog; for technique and troubleshooting, a few real, established names hold up.',
    summary:
      'For real food-safety guidance on home fermentation specifically (how much salt is actually safe, what a genuine spoilage sign looks like versus a normal part of the process, canning and storage guidance for a finished ferment), the National Center for Home Food Preservation, a University of Georgia program working with the USDA, is a real, government/university-affiliated resource built specifically for this purpose, not a commercial site with a product to sell. For technique, troubleshooting, and the cultural/historical breadth of fermentation across cuisines, Sandor Katz\'s The Art of Fermentation is a widely regarded, thoroughly researched standard reference in the fermentation community, distinct from a manufacturer\'s own marketing material for a specific starter-culture product. For the deeper microbiology behind any specific ferment (which real species are doing what, and why), this app\'s own Fermented Foods topic already carries individually cited, peer-reviewed research on every major strain named across the methods above -- the practical "how it\'s made" guide here is meant as the on-ramp into that deeper, already-built research, not a replacement for it.',
    citations: [
      {
        source: 'National Center for Home Food Preservation (University of Georgia, USDA-affiliated)',
        url: 'https://nchfp.uga.edu/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['fermentmethod-overview', 'fermented-tying-together', 'fermented-sourcing-starters'],
  },
];
