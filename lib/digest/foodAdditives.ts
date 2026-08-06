import type { DigestEntry } from './types';

// Food Additives -- 15 entries, the most consumer-legible category to start
// with (real dose/mechanism specifics exist for most of these, not just a
// vague "avoid processed food" gesture). Deliberately includes both real
// concerns AND at least one honest "generally fine" entry (xanthan/guar
// gum) -- teaching food literacy means not implying every additive is
// equally worth worrying about.
export const FOOD_ADDITIVES_ENTRIES: DigestEntry[] = [
  {
    id: 'additive-nitrates-nitrites',
    category: 'foodAdditives',
    title: 'Nitrates & Nitrites (cured/processed meat)',
    teaser: 'The one additive on this list with a direct, well-established thyroid mechanism.',
    summary:
      'Sodium nitrate/nitrite preserve color and inhibit botulism in bacon, deli meat, and hot dogs. Separately from IARC classifying processed meat as a Group 1 carcinogen (via N-nitroso compound formation when cured meat is cooked at high heat), nitrate itself is a documented goitrogen: it competitively blocks the sodium-iodide symporter (NIS), the same transporter the thyroid uses to pull iodine out of the bloodstream. In someone already iodine-marginal, that competition can measurably reduce thyroid iodine uptake.',
    citations: [
      {
        source: 'IARC Monograph 114 (processed meat, Group 1)',
        url: 'https://www.iarc.who.int/news-events/iarc-monographs-volume-114-evaluation-of-consumption-of-red-meat-and-processed-meat/',
      },
      {
        source: 'Tonacchera et al. 2004, Thyroid -- NIS inhibition potency of nitrate/perchlorate/thiocyanate',
        url: 'https://pubmed.ncbi.nlm.nih.gov/15650353/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['nutrient-iodine'],
  },
  {
    id: 'additive-potassium-bromate',
    category: 'foodAdditives',
    title: 'Potassium Bromate',
    teaser: 'A dough conditioner banned across most of the world, still legal in the U.S. -- and it targets the thyroid specifically.',
    summary:
      'Used to strengthen bread dough and speed rising, potassium bromate is banned in the EU, UK, Canada, and Brazil, but remains legal (if declining in use) in U.S. commercial baking. IARC classifies it as possibly carcinogenic to humans (Group 2B). The animal data is unusually specific for a food additive: it reliably produces thyroid follicular cell tumors in rats, via oxidative DNA damage. Real bread should mostly bake it out during baking (it converts to bromide), but residual levels have been measured in some finished loaves.',
    citations: [
      { source: 'IARC Monograph 73 (potassium bromate)', url: 'https://www.inchem.org/documents/iarc/vol73/73-17.html' },
      {
        source: 'Kurokawa et al. 1986, thyroid/renal tumor induction in rat bioassay (NCBI Bookshelf summary)',
        url: 'https://www.ncbi.nlm.nih.gov/books/NBK402079/',
      },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'additive-synthetic-dyes',
    category: 'foodAdditives',
    title: 'Synthetic Food Dyes (Red 3, Red 40, Yellow 5 & 6)',
    teaser: 'Red Dye 3 was banned from U.S. food in January 2025 -- because of rat thyroid tumors.',
    summary:
      'Red Dye 3 (erythrosine) was formally banned from FDA-regulated food in January 2025, decades after being banned in cosmetics, specifically because of the Delaney Clause: it causes thyroid follicular cell tumors in male rats at high doses. Red 40, Yellow 5, and Yellow 6 carry a weaker but real evidence base linking them to hyperactivity in children (the basis of California\'s 2023 school-food dye ban) rather than a thyroid-specific mechanism -- worth distinguishing rather than treating all synthetic dyes as one undifferentiated risk.',
    citations: [
      {
        source: 'FDA final rule revoking authorization for FD&C Red No. 3, 2025',
        url: 'https://www.federalregister.gov/documents/2025/01/16/2025-00830/color-additive-petition-from-center-for-science-in-the-public-interest-et-al-request-to-revoke-color',
      },
      {
        source: 'McCann et al. 2007, Lancet (Southampton dye/hyperactivity RCT)',
        url: 'https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(07)61306-3/abstract',
      },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'additive-emulsifiers-cmc-polysorbate80',
    category: 'foodAdditives',
    title: 'Emulsifiers: Carboxymethylcellulose & Polysorbate 80',
    teaser: 'Common in packaged bread, ice cream, and sauces -- and now shown to alter the human gut microbiome in a real trial.',
    summary:
      'A landmark 2015 mouse study (Chassaing et al., Nature) found these two widely used emulsifiers thinned the protective gut mucus layer, altered microbiota composition, and triggered low-grade intestinal inflammation and metabolic syndrome. A 2022 controlled human trial confirmed a real, if smaller, version of the same pattern in healthy volunteers given dietary-relevant doses of CMC: altered gut microbiota, reduced short-chain fatty acids, and mild GI symptoms in a subset. This directly touches this app\'s own gut-repair research (see Gut & Microbiome) -- emulsifiers are a genuinely different exposure pathway than "processed food is bad" in general.',
    citations: [
      { source: 'Chassaing et al. 2015, Nature', url: 'https://pubmed.ncbi.nlm.nih.gov/25731162/' },
      {
        source: 'Chassaing et al. 2022, Gastroenterology (human CMC trial)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/34774538/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['gut-scfa-treg'],
  },
  {
    id: 'additive-carrageenan',
    category: 'foodAdditives',
    title: 'Carrageenan',
    teaser: 'A seaweed-derived thickener with a real, contested split between two chemically different forms.',
    summary:
      'Food-grade carrageenan (in almond milk, deli meat, ice cream) is chemically distinct from degraded carrageenan (poligeenan), which is reliably shown in animal and in-vitro studies to trigger gut inflammation and ulceration and is not approved for food use. The real, unresolved question -- whether food-grade carrageenan degrades to the harmful form under stomach acid or during processing -- has produced genuinely conflicting findings, and no large human trial has settled it. Worth knowing the two forms are different, not worth a blanket verdict either way yet.',
    citations: [
      {
        source: 'Tobacman 2001 review, Environmental Health Perspectives',
        url: 'https://ehp.niehs.nih.gov/doi/10.1289/ehp.01109983',
      },
      {
        source: 'Weiner 2014, Critical Reviews in Toxicology (in vivo safety review)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/24467586/',
      },
    ],
    overallTier: 'weak',
  },
  {
    id: 'additive-msg',
    category: 'foodAdditives',
    title: 'MSG (Monosodium Glutamate)',
    teaser: 'The most over-blamed additive on this list -- controlled trials mostly clear it.',
    summary:
      'The FDA classifies MSG as Generally Recognized As Safe, and double-blind placebo-controlled trials have largely failed to reproduce "Chinese restaurant syndrome" symptoms when MSG is given in capsule form without a person knowing which they received. High-dose animal studies (far beyond realistic dietary exposure, often injected rather than fed) do show hypothalamic effects, which is a genuinely different question from ordinary dietary use. Included here as a deliberate counterexample: not every commonly feared additive holds up under real experimental scrutiny.',
    citations: [
      {
        source: 'Geha et al. 2000, Journal of Allergy and Clinical Immunology (double-blind MSG challenge trial)',
        url: 'https://www.jacionline.org/article/S0091-6749(00)44233-8/fulltext',
      },
    ],
    overallTier: 'weak',
  },
  {
    id: 'additive-aspartame',
    category: 'foodAdditives',
    title: 'Aspartame',
    teaser: "Classified 'possibly carcinogenic' in 2023 -- but its own safety limit didn't move.",
    summary:
      "In 2023, IARC classified aspartame as possibly carcinogenic to humans (Group 2B), based on limited evidence, largely from one large observational cohort. The same week, the WHO/FAO's own additive safety committee (JECFA) reviewed the identical evidence and left aspartame's acceptable daily intake unchanged, explicitly calling the evidence for harm inadequate to justify a stricter limit -- a real, publicly visible disagreement between a hazard classification (IARC's job) and a risk assessment (JECFA's job) that gets conflated in most consumer coverage.",
    citations: [
      {
        source: 'IARC Monograph 134, 2023',
        url: 'https://www.iarc.who.int/news-events/iarc-monographs-volume-134-aspartame-methyleugenol-and-isoeugenol/',
      },
      {
        source: 'JECFA 96th meeting summary, 2023',
        url: 'https://www.who.int/news/item/14-07-2023-aspartame-hazard-and-risk-assessment-results-released',
      },
    ],
    overallTier: 'weak',
  },
  {
    id: 'additive-sucralose',
    category: 'foodAdditives',
    title: 'Sucralose',
    teaser: 'A 2023 lab finding reopened a question regulators had considered closed.',
    summary:
      'A 2023 North Carolina State University study found that sucralose-6-acetate, a real breakdown product formed as sucralose degrades (including in the gut), was genotoxic to human cells in vitro and broke down the intestinal barrier in a mouse model at doses within a normal daily intake range. This is early, in-vitro/animal evidence, not a human outcome trial, and regulators have not changed sucralose\'s approved status in response -- but it is a real, mechanistically specific finding, not a repeat of the older, weaker sucralose-microbiome concerns.',
    citations: [
      {
        source: 'Schiffman et al. 2023, Journal of Toxicology and Environmental Health',
        url: 'https://www.tandfonline.com/doi/full/10.1080/10937404.2023.2213903',
      },
    ],
    overallTier: 'weak',
  },
  {
    id: 'additive-trans-fats',
    category: 'foodAdditives',
    title: 'Trans Fats (Partially Hydrogenated Oils)',
    teaser: 'The one additive on this list with the strongest evidence of all -- which is exactly why it was banned.',
    summary:
      'Artificial trans fats raise LDL cholesterol while simultaneously lowering HDL, a combined effect essentially unique among dietary fats, with decades of strong RCT and cohort evidence tying them to cardiovascular disease. The FDA revoked their Generally Recognized As Safe status in 2015 and completed a full ban from the U.S. food supply by 2018. Relevant here less for a thyroid-specific mechanism and more because systemic vascular inflammation is one of the general inflammatory-burden pathways this app\'s own Lifestyle & Environment research keeps surfacing across unrelated topics.',
    citations: [
      {
        source: 'FDA final determination, 2015',
        url: 'https://www.federalregister.gov/documents/2015/06/17/2015-14883/final-determination-regarding-partially-hydrogenated-oils',
      },
      { source: 'Mozaffarian et al. 2006, NEJM review', url: 'https://pubmed.ncbi.nlm.nih.gov/16611951/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'additive-sulfites',
    category: 'foodAdditives',
    title: 'Sulfites',
    teaser: 'Dried fruit, wine, and some processed potatoes -- a real, well-documented sensitivity in a defined subset of people.',
    summary:
      'Sulfites (sulfur dioxide and related sulfite salts) prevent browning and microbial growth in dried fruit, wine, and some pre-cut produce. A genuine, well-characterized minority of people, especially those with asthma, experience real reactions -- wheezing, flushing, GI symptoms -- to sulfite exposure, which is why the FDA requires "contains sulfites" labeling above 10ppm. No specific thyroid or Hashimoto\'s mechanism is documented; included here because reaction-tracking (this app\'s own Bio-Compass feature) is exactly the tool for someone to find out whether they\'re personally in that sensitive minority.',
    citations: [
      {
        source: 'FDA sulfite labeling rule, 21 CFR 101.100',
        url: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-B/part-101/subpart-G/section-101.100',
      },
      {
        source: 'Vally, Misso & Madan 2009, Clinical & Experimental Allergy',
        url: 'https://pubmed.ncbi.nlm.nih.gov/19775253/',
      },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'additive-hfcs',
    category: 'foodAdditives',
    title: 'High-Fructose Corn Syrup',
    teaser: 'Not just "more sugar" -- fructose is metabolized differently, and that difference routes straight through the liver.',
    summary:
      'Unlike glucose, which is used by nearly every cell in the body, dietary fructose is metabolized almost entirely in the liver -- and at high intake, a meaningful share of it converts to fat there, contributing to non-alcoholic fatty liver disease and insulin resistance. This matters specifically for Hashimoto\'s because the liver performs roughly 80% of the body\'s T4-to-T3 conversion (the same liver-load reasoning already covered in this app\'s alcohol advisory) -- a chronically overburdened liver is a plausible, if not yet directly trial-tested, contributor to suboptimal thyroid hormone conversion.',
    citations: [
      {
        source: 'Softic et al. 2020, Critical Reviews in Clinical Laboratory Sciences (hepatic fructose metabolism review)',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7774304/',
      },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'additive-azodicarbonamide',
    category: 'foodAdditives',
    title: 'Azodicarbonamide',
    teaser: 'Nicknamed "the yoga mat chemical" -- and a real regulatory gap, not an urban legend.',
    summary:
      "Azodicarbonamide is used both as a bleaching/dough-conditioning agent in bread and as a foaming agent in yoga mats and shoe soles -- a genuinely true, if attention-grabbing, coincidence. It's banned in the EU, UK, and Australia. It breaks down during baking into semicarbazide, a compound animal studies link to tumor formation at high doses; U.S. regulators have not found the levels used in bread baking to pose a comparable risk, which is the real crux of the international disagreement rather than a settled safety verdict either way.",
    citations: [
      { source: 'EFSA opinion on semicarbazide, 2005', url: 'https://www.efsa.europa.eu/en/efsajournal/pub/219' },
    ],
    overallTier: 'weak',
  },
  {
    id: 'additive-phosphates',
    category: 'foodAdditives',
    title: 'Phosphate Additives',
    teaser: 'The same mineral your body needs -- but the additive form absorbs almost twice as efficiently as the food form.',
    summary:
      'Phosphate additives (used as preservatives and texture enhancers in processed meat, cheese, and baked goods) are absorbed at roughly 90%, compared to 40-60% for phosphate naturally bound in whole foods like meat, dairy, and legumes -- real, established physiology. What that difference actually does downstream is a more open question than often presented: a real 3-week randomized crossover trial in early-stage CKD patients found higher phosphate-additive intake did raise urinary phosphorus excretion as expected, but did NOT significantly raise albuminuria or FGF23 (a hormone that regulates phosphate and, at chronically high levels, is separately linked to cardiovascular risk) in that specific trial -- a real, honest complication worth stating plainly rather than assuming the absorption difference automatically means worse outcomes. No thyroid-specific data exists; flagged here as a real example of "the same nutrient behaves differently depending on its source," directly echoing this app\'s own D1-D6 scoring philosophy.',
    citations: [
      { source: 'NIH Office of Dietary Supplements, Phosphorus Health Professional Fact Sheet', url: 'https://ods.od.nih.gov/factsheets/Phosphorus-HealthProfessional/' },
      {
        source: 'Chang et al. 2017, American Journal of Kidney Diseases (SODA-POP randomized crossover trial)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/27865566/',
      },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'additive-bha-bht',
    category: 'foodAdditives',
    title: 'BHA & BHT',
    teaser: 'One is flagged by U.S. federal toxicology as a likely carcinogen; the other has real thyroid-hormone animal data.',
    summary:
      "BHA (butylated hydroxyanisole) is listed by the National Toxicology Program as reasonably anticipated to be a human carcinogen, based on animal studies, and is more heavily restricted in the EU than the U.S. Its close chemical relative BHT has separate animal research showing measurable effects on circulating thyroid hormone levels at high doses. Both remain FDA-approved at current use levels for preserving fats/oils and cereal-based products from oxidation.",
    citations: [
      {
        source: 'National Toxicology Program, Report on Carcinogens, 15th ed. (BHA profile)',
        url: 'https://www.ncbi.nlm.nih.gov/books/NBK590883/',
      },
      {
        source: 'Søndergaard & Olsen 1982, Toxicology Letters -- "The effect of BHT on the rat thyroid"',
        url: 'https://pubmed.ncbi.nlm.nih.gov/7080091/',
      },
    ],
    overallTier: 'weak',
  },
  {
    id: 'additive-xanthan-guar-gum',
    category: 'foodAdditives',
    title: 'Xanthan Gum & Guar Gum',
    teaser: 'Included deliberately: two very common thickeners with genuinely little evidence of harm.',
    summary:
      "Both are fermentation- or plant-derived thickeners used across gluten-free baking, sauces, and dairy alternatives. Neither has a meaningful body of evidence linking normal dietary use to harm -- guar gum in particular has real, if modest, positive data as a soluble fiber source supporting gut motility and short-chain fatty acid production. Included on this list specifically to avoid implying every additive deserves equal suspicion; teaching what's actually fine is as much a part of food literacy as flagging what isn't.",
    citations: [
      { source: 'EFSA re-evaluation of guar gum (E412), 2017', url: 'https://www.efsa.europa.eu/en/efsajournal/pub/4669' },
    ],
    overallTier: 'weak',
  },
];
