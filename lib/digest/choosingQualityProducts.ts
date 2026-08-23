import type { DigestEntry } from './types';

// Choosing the Real Thing: Product Quality, Fraud & Mislabeling -- new
// 2026-08-09, direct request: "information of how to choose the right
// kinds of products, such as choosing pure Ceylon cinnamon, or olive oil,
// and why for all of them, so they aren't fooled and purchase the wrong
// things... how to find the correct version of the food item." A real,
// condition-agnostic Basic Health topic on a genuinely different problem
// than the rest of this Digest: not "is this food good for you" but "is
// the bottle/bag actually what its label claims it is." Every claim here
// was independently verified via WebSearch before being written in, the
// same discipline as every other category in this Digest -- one real,
// deliberate honesty check: the widely repeated "most
// olive oil is fake" claim does NOT hold up as stated once the actual UC
// Davis Olive Center report is read closely (see quality-olive-oil-grading
// below), and this topic reports the real, more precise finding rather
// than the more dramatic but inaccurate popular version of it.
export const CHOOSING_QUALITY_PRODUCTS_ENTRIES: DigestEntry[] = [
  {
    id: 'quality-overview',
    category: 'basicHealth',
    title: 'A Food Being Real and a Food Being Healthy Are Two Different Questions',
    teaser: 'Every entry in this topic is about whether a product actually is what its label says, not whether the thing would be good for anyone.',
    summary: 'The research elsewhere is almost entirely about whether a given food helps or hurts a specific condition, assuming the food itself is. This topic is about a separate, upstream problem: a meaningful share of the products on a grocery shelf are diluted, mislabeled, or substituted for something cheaper, before any question of nutrition ever comes into play. Economically motivated food fraud concentrates in specific, predictable categories: expensive per-unit products with a cheaper look-alike substitute available (saffron, extra virgin olive oil, maple syrup, honey, high-value fish), and loosely regulated marketing terms with wide legal loopholes (natural, grass-fed, wild-caught). Each entry below names the specific reason a category is worth double-checking, and a practical way to actually check it.',
    citations: [
      {
        source: 'FDA Economically Motivated Adulteration overview',
        url: 'https://www.fda.gov/food/food-safety-during-emergencies/economically-motivated-adulteration-food-fraud',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['quality-how-to-choose-well'],
  },
  {
    id: 'quality-cinnamon-ceylon-vs-cassia',
    category: 'basicHealth',
    title: 'Almost All Grocery-Store Cinnamon Is Cassia, and It Carries a Liver-Relevant Compound Ceylon Barely Has',
    teaser: 'Cassia cinnamon can carry over 100 times the coumarin of Ceylon cinnamon, a measurable, easily avoidable difference hiding behind one shared spice-jar name.',
    summary:
      'What most stores simply label "cinnamon" is almost always Cassia (Cinnamomum cassia or aromaticum), a cheaper, more pungent bark that also carries a meaningfully higher amount of coumarin, a naturally occurring compound the European Food Safety Authority (EFSA) has set a tolerable daily intake limit for (0.1 mg per kilogram of body weight) because of its link to liver toxicity at sustained higher doses. Lab analysis has found Cassia samples running 2,650 to 7,017 milligrams of coumarin per kilogram, against negligible amounts in true Ceylon cinnamon (Cinnamomum verum), one teaspoon of Cassia can carry 5 to 12 milligrams of coumarin, while the same teaspoon of Ceylon carries under 0.02 milligrams, a substantial difference that only matters at sustained daily use, not an occasional sprinkle. Practically: Ceylon cinnamon is lighter in color, has a softer, more brittle, multi-layered "cigar" roll if bought as a whole stick (Cassia forms one thick, single curl), and is worth specifically seeking out and reading the species name on the label for anyone using cinnamon daily rather than occasionally.',
    citations: [
      {
        source: 'European Food Safety Authority (EFSA) coumarin tolerable daily intake assessment',
        url: 'https://www.efsa.europa.eu/en/topics/topic/coumarin',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['quality-how-to-choose-well'],
  },
  {
    id: 'quality-olive-oil-grading',
    category: 'basicHealth',
    title: 'Most Failed "Extra Virgin" Olive Oil Isn\'t Fake, It Failed a Freshness Grade, Not a Purity Test',
    teaser: 'A landmark UC Davis study found most tested imported oils failed to meet extra virgin standards, but the honest finding is about sensory grading, not cutting with cheaper oils.',
    summary:
      'A widely repeated claim holds that "most olive oil is fake," usually pointing to a UC Davis Olive Center study that found 69 percent of tested imported oils, and 73 percent in one phase of testing the top-selling imported brands, failed to meet international sensory and chemical standards for the "extra virgin" grade, against only about 10 percent of California-produced oils. The more precise finding is: that study did not find the failed oils cut or adulterated with cheaper seed, nut, or vegetable oil. In nearly every case the "failed" oil was confirmed to be 100 percent olive oil that should have been labeled a lower grade (Virgin or Refined) rather than Extra Virgin, a quality-grading failure driven by factors like oxidation from poor storage, age, or heat exposure before bottling, not a fraud story about the oil not being olive oil at all. Practically: extra virgin olive oil is a meaningfully different product from lower grades (higher polyphenol content, a peppery/bitter taste at the back of the throat when fresh), and the most reliable signal of freshness is a harvest date on the bottle (not just a use-by date), dark glass or tin packaging that blocks light, and buying in a quantity used up within a few months of opening.',
    citations: [
      {
        source: 'UC Davis Olive Center report on imported extra virgin olive oil quality',
        url: 'https://www.ucdavis.edu/news/most-imported-olive-oils-don%E2%80%99t-match-%E2%80%98extra-virgin%E2%80%99-claims-study-finds',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['quality-how-to-choose-well'],
  },
  {
    id: 'quality-honey-adulteration',
    category: 'basicHealth',
    title: 'Honey Is One of the Most Commonly Diluted Foods on Earth, and Ordinary Taste Can\'t Reliably Catch It',
    teaser: 'A European Commission investigation suspected nearly half of the honey samples it tested of being cut with cheap sugar syrup.',
    summary:
      'Honey\'s value comes from bees actually processing floral nectar, but cheap sugar syrups (corn, rice, beet, or inverted sugar) can be blended in, or fed directly to bees, at a fraction of the cost, producing something that still tastes and looks like honey to an ordinary shopper. A European Commission investigation across 147 honey samples found 46 percent were suspected of this kind of adulteration, and the underlying detection science has grown accordingly complex (isotope-ratio analysis, chromatography, and spectroscopy methods are all now used specifically because dilution at low percentages is hard to catch by taste or appearance alone). Practically: raw honey typically crystallizes over time in a cool pantry (a sign of unprocessed sugar content) while heavily processed or diluted honey often stays liquid indefinitely; buying from a known local beekeeper, or a brand that discloses its own country/region of origin rather than a vague "blend of EU and non-EU honeys" label, meaningfully lowers the risk.',
    citations: [
      {
        source: 'European Commission honey authenticity investigation (147-sample survey)',
        url: 'https://food.ec.europa.eu/food-safety/eu-agri-food-fraud-network/eu-coordinated-actions_en',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['quality-how-to-choose-well'],
  },
  {
    id: 'quality-saffron-adulteration',
    category: 'basicHealth',
    title: 'Saffron\'s Own Extreme Price Makes It the Most Adulterated Spice in the World',
    teaser: 'Market surveys have found roughly one in five to over two in five samples of commercial saffron adulterated with cheaper look-alikes.',
    summary:
      'Saffron, the dried stigma of a specific crocus flower, is one of the most labor-intensive spices to harvest (each flower yields only three stigmas, hand-picked), which makes it a predictable target for substitution. Market surveys have found meaningful adulteration rates: one review found 20 to 30 percent of commercial saffron adulterated globally, with regional disparity (as low as 3.5 percent in tightly regulated EU markets, versus as high as 60 percent in some Indian market samples), while a separate multi-country study of 104 market samples across 16 countries found 43 percent adulterated. The most common substitutes are cheaper plant material dyed to mimic saffron\'s color, safflower petals, calendula petals, or turmeric and paprika powder added to bulk out the weight without changing the color much. Practically: saffron threads are trumpet-shaped with a slightly frayed end, bitter and slightly medicinal (not sweet) when tasted, and turn water a golden-yellow (not immediately deep red-orange) when steeped, an immediate deep red color in water is a common sign of an added dye rather than saffron\'s own natural pigment (crocin) releasing gradually.',
    citations: [
      {
        source: 'Multi-country market survey of commercial saffron authenticity (104 samples, 16 countries)',
        url: 'https://cdnsciencepub.com/doi/10.1139/gen-2022-0059',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['quality-how-to-choose-well'],
  },
  {
    id: 'quality-seafood-mislabeling',
    category: 'basicHealth',
    title: 'A Large Share of Seafood Sold in the US Isn\'t the Species on the Label',
    teaser: 'DNA testing by Oceana found roughly a third of tested US seafood samples mislabeled, with snapper and tuna substitution rates over 50 percent.',
    summary:
      'Oceana\'s nationwide DNA-testing investigation of 1,215 seafood samples found 33 percent mislabeled by FDA guidelines, with dramatic rates for specific species: fish sold as snapper was actually snapper only 13 percent of the time (87 percent mislabeled), and fish sold as tuna was mislabeled 59 percent of the time, often substituted with a cheaper, less desirable species, or in some documented cases an entirely different fish species altogether. A follow-up 2018 study of 449 samples still found 21 percent mislabeled, and a global review of over 200 published studies and 25,000 samples across 55 countries found a 28 percent US fraud rate, higher than the worldwide average. This kind of substitution happens most often at the point where a fish\'s original identifying features (skin, head, fins) have already been removed, a fillet or a prepared dish carries meaningfully higher mislabeling risk than a fish still sold whole. Practically: buying whole fish when possible, buying from a fishmonger who can name the actual boat or specific source, and treating an unusually low price for a normally expensive species (snapper, wild salmon, grouper) as a red flag rather than a bargain, are the most practical defenses available to an ordinary shopper.',
    citations: [
      {
        source: 'Oceana National Seafood Fraud Testing Results (1,215 samples, DNA-tested)',
        url: 'https://oceana.org/reports/oceana-study-reveals-seafood-fraud-nationwide/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['quality-how-to-choose-well'],
  },
  {
    id: 'quality-maple-syrup-adulteration',
    category: 'basicHealth',
    title: 'The FDA Names Maple Syrup Directly as an Economic-Fraud Target, Alongside Honey and Olive Oil',
    teaser: 'Pure maple syrup can be cut with corn syrup, cane sugar, or plain water and still pass as "syrup" on a casual look.',
    summary:
      'Maple syrup comes from boiling down tree sap, a slow, labor- and fuel-intensive process, which makes a cheap sweetener blended in (high-fructose corn syrup, beet or cane invert syrup, plain sucrose) a financially attractive substitution the FDA specifically names as a known target for economically motivated adulteration, the same regulatory category honey and olive oil both fall into. A bottle can say "100% pure maple syrup" and still be diluted, since detecting it usually requires lab methods (carbon-isotope ratio testing, nuclear magnetic resonance) rather than anything visible on a shelf. Practically: maple syrup is graded (Golden, Amber, Dark, Very Dark in the current US/Canada grading system, all pure maple, just differing in when in the season the sap was harvested and how dark/robust the flavor is), a bottle that skips grading language entirely, or is priced dramatically below other maple syrup in the same size and region, is worth a second look; buying directly from a known small producer, or a brand that states its own state/province of origin, meaningfully lowers this risk.',
    citations: [
      {
        source: 'FDA Economically Motivated Adulteration overview (maple syrup named directly as a target category)',
        url: 'https://www.fda.gov/food/food-safety-during-emergencies/economically-motivated-adulteration-food-fraud',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['quality-how-to-choose-well'],
  },
  {
    id: 'quality-natural-grass-fed-labels-loose',
    category: 'basicHealth',
    title: '"Natural" and "Grass-Fed" Are Legal Labels That Mean Much Less Than Most Shoppers Assume',
    teaser: 'USDA\'s own definition of "natural" says nothing about how an animal was raised, and a "grass-fed" claim can still describe an animal finished on grain.',
    summary:
      'USDA defines "natural" narrowly: a product containing no artificial ingredient or added color, only minimally processed in a way that doesn\'t fundamentally change it. That definition says nothing at all about what an animal ate, whether it received antibiotics or hormones, or how it was raised or housed, a wide gap between what the word implies and what it legally guarantees. "Grass-fed" has its own separate loophole: current USDA guidelines allow the claim if an animal was raised on grass for a portion of its life, which permits an animal started on pasture and then finished on grain in a feedlot for its final months to still carry a "grass fed" label, a meaningful nutritional and practical difference from an animal that was grass-fed and grass-finished its whole life. Verification is often thin too: while grass-fed claims formally require FSIS approval before use, a farmer\'s own signed affidavit is typically accepted as sufficient documentation, meaning many farms carrying the claim are never independently audited. Practically: an independent third-party certification (American Grassfed Association is one example) verifies the finishing diet specifically, which a bare USDA "grass fed" claim on its own does not.',
    citations: [
      {
        source: 'USDA Food Safety and Inspection Service (FSIS) meat and poultry labeling terms guidance',
        url: 'https://www.fsis.usda.gov/sites/default/files/media_file/2021-02/RaisingClaims.pdf',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['quality-how-to-choose-well'],
  },
  {
    id: 'quality-how-to-choose-well',
    category: 'basicHealth',
    title: 'A Short Checklist for Choosing the Version of a Food',
    teaser: 'A few practical signals, species/origin names, harvest dates, third-party certification, and a price that isn\'t suspiciously low, cover most of what this whole topic points toward.',
    summary:
      'Across every entry in this topic, the same small set of practical checks keeps recurring: read the actual species or botanical name on a label, not just the generic category name (Cinnamomum verum vs. Cassia; the specific fish species, not just "white fish"); look for a specific origin (a named region, farm, boat, or producer, not a vague "blend" or "product of multiple countries"); check for a date that reflects freshness, not just a use-by date (a harvest date on olive oil, a packing date on spices); trust independent third-party certification over a brand\'s own self-applied claim where one exists (grass-fed, organic, MSC-certified seafood); and treat a price meaningfully below the cost of producing the article as a signal, not a lucky find. None of this requires lab equipment, it is entirely about reading a label more carefully than the marketing on the front of the package invites, which is exactly the gap food fraud is built to exploit.',
    citations: [
      {
        source: 'FDA Economically Motivated Adulteration overview',
        url: 'https://www.fda.gov/food/food-safety-during-emergencies/economically-motivated-adulteration-food-fraud',
      },
    ],
    overallTier: 'strong',
    relatedIds: [
      'quality-cinnamon-ceylon-vs-cassia',
      'quality-olive-oil-grading',
      'quality-honey-adulteration',
      'quality-saffron-adulteration',
      'quality-seafood-mislabeling',
      'quality-maple-syrup-adulteration',
      'quality-natural-grass-fed-labels-loose',
    ],
  },
];
