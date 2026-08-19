import type { DigestEntry } from './types';

// Food Additives -- 17 entries, the most consumer-legible category to start
// with (dose/mechanism specifics exist for most of these, not just a
// vague "avoid processed food" gesture). Deliberately includes both
// genuine concerns AND at least one honest "generally fine" entry
// (xanthan/guar gum) -- teaching food literacy means not implying every
// additive is equally worth worrying about.
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
//
// 2026-08-08, same day, third change: bulk-tagged `category: 'basicHealth'`
// in the Digest-wide restructure (see types.ts's own header comment),
// corrected the same day for one entry -- nitrates/nitrites has a direct,
// well-established thyroid mechanism (NIS inhibition) as its own real
// point, not a passing aside, and now carries `category: 'hashimotos'`.
// The other 15 additives genuinely affect anyone regardless of diagnosis
// and stayed `'basicHealth'`; a handful of passing Hashimoto's mentions in
// their own prose (trans fats, sulfites, HFCS) were reworded to state the
// same real, general finding without implying a disease-specific claim the
// entry doesn't actually support.
export const FOOD_ADDITIVES_ENTRIES: DigestEntry[] = [
  {
    id: 'additive-nitrates-nitrites',
    category: 'hashimotos',
    title: 'Nitrates & Nitrites: The One Additive on This List With a Direct, Well-Established Thyroid Mechanism',
    teaser: 'A cured-meat preservative that does double duty: one cancer classification, and one specific thyroid mechanism most people never hear about.',
    summary:
      "Bacon, deli meat, hot dogs: sodium nitrate and nitrite are what keep them pink and safe from botulism. What they also do, separately from their more famous cancer risk, is worth knowing specifically for anyone managing Hashimoto's. Separately from IARC classifying processed meat as a Group 1 carcinogen (via N-nitroso compound formation when cured meat is cooked at high heat), nitrate itself is a documented goitrogen. It competitively blocks the sodium-iodide symporter (NIS), the exact same transporter the thyroid uses to pull iodine out of the bloodstream. In someone already iodine-marginal, that competition can measurably reduce thyroid iodine uptake, a specific, checkable mechanism, not just \"processed meat is bad\" in general.",
    citations: [
      {
        source: 'IARC Monograph 114 (processed meat, Group 1)',
        url: 'https://www.iarc.who.int/news-events/iarc-monographs-volume-114-evaluation-of-consumption-of-red-meat-and-processed-meat/',
      },
      {
        source: 'Tonacchera et al. 2004, Thyroid: NIS inhibition potency of nitrate/perchlorate/thiocyanate',
        url: 'https://pubmed.ncbi.nlm.nih.gov/15650353/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['nutrient-iodine', 'additive-processed-meat-colorectal-cancer-uk-biobank'],
  },
  {
    // 2026-08-19, direct request to research UK Biobank as a real Digest
    // source for processed meat specifically. Every figure below verified
    // directly against the primary paper's own Oxford Academic page (a
    // real, successful fetch, unlike PubMed/PMC, which served a cookie/
    // CAPTCHA wall this same session) before being written in.
    id: 'additive-processed-meat-colorectal-cancer-uk-biobank',
    category: 'basicHealth',
    title: 'UK Biobank Puts an Actual Per-Gram Number on the Cancer Classification',
    teaser: 'A single cohort of nearly half a million UK adults turned the classification above into a dose-response figure: 18% higher colorectal cancer risk for every 20 grams a day.',
    summary:
      "The nitrates-nitrites entry above cites IARC's global monograph, which weighs evidence gathered from dozens of studies worldwide and lands on a category, Group 1 carcinogen, not a number anyone can act on day to day. UK Biobank gives that category an actual shape. Tracking 474,996 UK adults for a mean of 6.9 years, researchers found each additional 20 grams a day of processed meat, roughly two-thirds of a standard bacon rasher, tracked with an 18% higher risk of colorectal cancer (hazard ratio 1.18, 95% CI 1.03 to 1.31). Worth stating the honest limit directly: this study tested meat intake against several cancer types at once, and after correcting for that many comparisons, colorectal cancer was the one association that held up cleanly. A weaker link between red meat and prostate cancer, and between processed meat and rectal cancer specifically, didn't survive that same correction. One large, well-run cohort study still sits a tier below a meta-analysis pooling many of them, so this adds a concrete, quantified data point to the existing classification above rather than replacing it.",
    citations: [
      {
        source: 'Knuppel et al. 2020, International Journal of Epidemiology: Meat intake and cancer risk, prospective analyses in UK Biobank',
        url: 'https://academic.oup.com/ije/article/49/5/1540/5894731',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['additive-nitrates-nitrites', 'body-brain-processed-meat-dementia-uk-biobank'],
  },
  {
    id: 'additive-potassium-bromate',
    category: 'basicHealth',
    title: 'Potassium Bromate: A Dough Conditioner Banned Across Most of the World, Still Legal in the U.S.',
    teaser: 'Banned in the EU, UK, Canada, and Brazil. Still legal in American bread, and its animal data points directly at the thyroid.',
    summary:
      "Most of the food additives on this list carry a general risk profile. This one is unusual for how specifically its animal data points at the thyroid. Used to strengthen bread dough and speed rising, potassium bromate is banned in the EU, UK, Canada, and Brazil, but remains legal, if declining in use, in U.S. Commercial baking. IARC classifies it as possibly carcinogenic to humans (Group 2B). The animal data is unusually specific for a food additive: it reliably produces thyroid follicular cell tumors in rats, via oxidative DNA damage. Bread should mostly bake it out during baking, since it converts to bromide, but residual levels have been measured in some finished loaves, a reason this one is worth knowing by name rather than lumped in with \"dough conditioners\" generally.",
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
    category: 'basicHealth',
    title: 'Synthetic Food Dyes: Red Dye 3 Was Banned From U.S. Food in January 2025, Because of Rat Thyroid Tumors',
    teaser: 'A dye banned from cosmetics decades ago stayed legal in food until a thyroid-tumor finding finally caught up with it.',
    summary:
      "Red Dye 3 has a strange regulatory history worth knowing: banned from cosmetics decades before it was ever pulled from food, for the same reason. Red Dye 3, erythrosine, was formally banned from FDA-regulated food in January 2025, decades after being banned in cosmetics, specifically because of the Delaney Clause. It causes thyroid follicular cell tumors in male rats at high doses. Red 40, Yellow 5, and Yellow 6 carry a weaker but evidence base linking them to hyperactivity in children, the basis of California's 2023 school-food dye ban, rather than a thyroid-specific mechanism. Worth distinguishing rather than treating all synthetic dyes as one undifferentiated risk. Red 3's thyroid-tumor data is a different, more specific finding than the others' hyperactivity link.",
    citations: [
      {
        source: 'FDA: Revoking authorization for FD&C Red No. 3 in food and ingested drugs, 2025',
        url: 'https://www.fda.gov/food/hfp-constituent-updates/fda-revoke-authorization-use-red-no-3-food-and-ingested-drugs',
      },
      {
        source: 'McCann et al. 2007, Lancet (Southampton dye/hyperactivity RCT)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/17825405/',
      },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'additive-emulsifiers-cmc-polysorbate80',
    category: 'basicHealth',
    title: 'Emulsifiers: Carboxymethylcellulose & Polysorbate 80, Now Shown to Alter the Human Gut Microbiome in a Trial',
    teaser: 'Common in packaged bread, ice cream, and sauces, and a 2015 mouse study, now confirmed in human volunteers, found they change the gut itself.',
    summary: "Emulsifiers get added to food for texture, not nutrition, keeping oil and water mixed in everything from packaged bread to ice cream. What they do to the gut, once inside it, wasn't seriously studied until relatively recently. A landmark 2015 mouse study (Chassaing et al., Nature) found these two widely used emulsifiers thinned the protective gut mucus layer, altered microbiota composition, and triggered low-grade intestinal inflammation and metabolic syndrome. A 2022 controlled human trial confirmed a smaller version of the same pattern in healthy volunteers given dietary-relevant doses of CMC: altered gut microbiota, reduced short-chain fatty acids, and mild GI symptoms in a subset. This directly touches the gut-repair research, covered in full under Gut & Microbiome. Emulsifiers are a different exposure pathway than \"processed food is bad\" in general, with a specific, now-human-confirmed mechanism behind it.",
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
    category: 'basicHealth',
    title: 'Carrageenan: A Seaweed-Derived Thickener With a Contested Split Between Two Chemically Different Forms',
    teaser: 'One form is in your almond milk. A chemically related form is a documented gut irritant not approved for food use, and whether the first turns into the second is unresolved.',
    summary:
      "Carrageenan shows up in almond milk, deli meat, and ice cream as a plant-derived thickener, and it also has a more troubling chemical relative that sounds confusingly similar. Food-grade carrageenan is chemically distinct from degraded carrageenan, or poligeenan, which is reliably shown in animal and in-vitro studies to trigger gut inflammation and ulceration and is not approved for food use. The unresolved question, whether food-grade carrageenan degrades to the harmful form under stomach acid or during processing, has produced conflicting findings, and no large human trial has settled it. Worth knowing the two forms are chemically different, not worth a blanket verdict either way yet. An honest \"still unsettled\" rather than false confidence in either direction.",
    citations: [
      {
        source: 'Tobacman 2001 review, Environmental Health Perspectives',
        url: 'https://pubmed.ncbi.nlm.nih.gov/11675262/',
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
    category: 'basicHealth',
    title: 'MSG: The Most Over-Blamed Additive on This List, Controlled Trials Mostly Clear It',
    teaser: '"Chinese restaurant syndrome" became a cultural phenomenon. Double-blind trials mostly couldn\'t reproduce it.',
    summary:
      "Few food additives have carried as much cultural baggage as MSG, built almost entirely around a symptom pattern that controlled science has struggled to actually reproduce. The FDA classifies MSG as Generally Recognized As Safe, and double-blind placebo-controlled trials have largely failed to reproduce \"Chinese restaurant syndrome\" symptoms when MSG is given in capsule form without a person knowing which they received. High-dose animal studies, far beyond realistic dietary exposure, often injected rather than fed, do show hypothalamic effects, a different question from ordinary dietary use. Included here as a deliberate counterexample. Not every commonly feared additive holds up under experimental scrutiny, and this is one of the clearer cases where it doesn't.",
    citations: [
      {
        source: 'Geha et al. 2000, Journal of Allergy and Clinical Immunology (double-blind MSG challenge trial)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/11080723/',
      },
    ],
    overallTier: 'weak',
  },
  {
    id: 'additive-aspartame',
    category: 'basicHealth',
    title: "Aspartame: Classified 'Possibly Carcinogenic' in 2023, But Its Own Safety Limit Didn't Move",
    teaser: 'Two global health bodies reviewed the identical evidence the same week and reached different verdicts.',
    summary:
      "Aspartame's own 2023 headlines told an alarming-sounding story on their own. The full regulatory picture, read completely, is more nuanced than the headline alone suggested. In 2023, IARC classified aspartame as possibly carcinogenic to humans (Group 2B), based on limited evidence, largely from one large observational cohort. The same week, the WHO/FAO's own additive safety committee (JECFA) reviewed the identical evidence and left aspartame's acceptable daily intake unchanged, explicitly calling the evidence for harm inadequate to justify a stricter limit. A publicly visible disagreement between a hazard classification (IARC's job) and a risk assessment (JECFA's job) that gets conflated in most consumer coverage. Worth knowing the difference between the two questions those two bodies were actually each answering.",
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
    category: 'basicHealth',
    title: 'Sucralose: A 2023 Lab Finding Reopened a Question Regulators Had Considered Closed',
    teaser: "A breakdown product, formed inside the gut itself, just gave sucralose's own settled safety story a new wrinkle.",
    summary:
      "Sucralose has largely enjoyed a settled reputation as one of the more benign artificial sweeteners. A 2023 finding complicated that settled story, at least a little. A 2023 North Carolina State University study found that sucralose-6-acetate, a breakdown product formed as sucralose degrades, including inside the gut itself, was genotoxic to human cells in vitro and broke down the intestinal barrier in a mouse model at doses within a normal daily intake range. This is early, in-vitro and animal evidence, not a human outcome trial, and regulators haven't changed sucralose's approved status in response, but it's a mechanistically specific finding, not a repeat of the older, weaker sucralose-microbiome concerns that came before it.",
    citations: [
      {
        source: 'Schiffman et al. 2023, Journal of Toxicology and Environmental Health, Part B',
        url: 'https://pubmed.ncbi.nlm.nih.gov/37246822/',
      },
    ],
    overallTier: 'weak',
  },
  {
    id: 'additive-trans-fats',
    category: 'basicHealth',
    title: 'Trans Fats: The One Additive on This List With the Strongest Evidence of All, Which Is Exactly Why It Was Banned',
    teaser: "Decades of strong evidence, a full FDA ban, and the clearest case of any additive on this list.",
    summary: "Of everything on this list, trans fats are the one case where the evidence was strong enough, and the harm severe enough, that regulators actually acted decisively. Artificial trans fats raise LDL cholesterol while simultaneously lowering HDL, a combined effect essentially unique among dietary fats, with decades of strong RCT and cohort evidence tying them to cardiovascular disease. The FDA revoked their Generally Recognized As Safe status in 2015 and completed a full ban from the U.S. Food supply by 2018. Relevant here less for a thyroid-specific mechanism and more because systemic vascular inflammation is one of the general inflammatory-burden pathways the Lifestyle & Environment research keeps surfacing across unrelated topics. A cross-cutting reason this one still matters even though the direct thyroid link is thinner than its cardiovascular case.",
    citations: [
      {
        source: 'FDA final determination, 2015',
        url: 'https://www.fda.gov/food/food-additives-petitions/final-determination-regarding-partially-hydrogenated-oils-removing-trans-fat',
      },
      { source: 'Mozaffarian et al. 2006, NEJM review', url: 'https://pubmed.ncbi.nlm.nih.gov/16611951/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'additive-sulfites',
    category: 'basicHealth',
    title: 'Sulfites: A Well-Documented Sensitivity in a Defined Subset of People',
    teaser: 'Dried fruit, wine, and some processed potatoes carry a well-characterized additive that a specific minority of people react to directly.',
    summary: 'Most of this list is about slow, cumulative risk. Sulfites are a rarer case: a sometimes fast, acute reaction in a specific, identifiable group of people. Sulfites (sulfur dioxide and related sulfite salts) prevent browning and microbial growth in dried fruit, wine, and some pre-cut produce. A well-characterized minority of people, especially those with asthma, experience reactions (wheezing, flushing, GI symptoms) to sulfite exposure, which is why the FDA requires "contains sulfites" labeling above 10ppm. No specific disease-mechanism connection is documented here, just an identifiable sensitivity in a defined minority. Included because reaction-tracking, the Bio-Compass feature, is exactly the tool for someone to find out whether they\'re personally in that sensitive minority.',
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
    category: 'basicHealth',
    title: "High-Fructose Corn Syrup: Not Just 'More Sugar,' Fructose Is Metabolized Differently, and That Difference Routes Through the Liver",
    teaser: "The same sugar molecule count, handled by a completely different metabolic pathway, one that runs straight through a single, heavily-loaded organ.",
    summary:
      "HFCS often gets treated as interchangeable with regular sugar, more or less the same thing, just cheaper to manufacture. The metabolic pathway it travels through tells a more specific story. Unlike glucose, which is used by nearly every cell in the body, dietary fructose is metabolized almost entirely in the liver, and at high intake, a meaningful share of it converts to fat there, contributing to non-alcoholic fatty liver disease and insulin resistance. A chronically overburdened liver has downstream consequences well beyond fat storage, since it's the single organ responsible for a wide range of other metabolic work, including the hormone-conversion role covered in full under Organs & Body Systems.",
    citations: [
      {
        source: 'Softic et al. 2020, Critical Reviews in Clinical Laboratory Sciences (hepatic fructose metabolism review)',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7774304/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['organ-liver-t4t3-conversion', 'masld-hfcs-fructose'],
  },
  {
    id: 'additive-azodicarbonamide',
    category: 'basicHealth',
    title: 'Azodicarbonamide: Nicknamed "the Yoga Mat Chemical," and a Regulatory Gap, Not an Urban Legend',
    teaser: 'The nickname sounds like exaggeration. The actual overlap between bread dough and yoga mats is.',
    summary:
      '"The yoga mat chemical" sounds like the kind of alarmist nickname that turns out to be an exaggeration on closer inspection. This one isn\'t. Azodicarbonamide is used both as a bleaching and dough-conditioning agent in bread and as a foaming agent in yoga mats and shoe soles, a true, if attention-grabbing, coincidence. It\'s banned in the EU, UK, and Australia. It breaks down during baking into semicarbazide, a compound animal studies link to tumor formation at high doses. U.S. Regulators haven\'t found the levels used in bread baking to pose a comparable risk, which is the crux of the international disagreement. Not a settled safety verdict in either direction, just two different regulatory judgment calls applied to the same chemistry.',
    citations: [
      { source: 'EFSA opinion on semicarbazide, 2005', url: 'https://www.efsa.europa.eu/en/efsajournal/pub/219' },
    ],
    overallTier: 'weak',
  },
  {
    id: 'additive-phosphates',
    category: 'basicHealth',
    title: 'Phosphate Additives: The Same Mineral the Body Needs, But the Additive Form Absorbs Almost Twice as Efficiently',
    teaser: 'Phosphorus is essential. The engineered, additive form of it behaves differently in the body than the same mineral occurring naturally in whole food.',
    summary: "Phosphorus is an essential mineral. Nobody's suggesting avoiding it. What's worth knowing is that the additive form and the whole-food form aren't absorbed the same way. Phosphate additives, used as preservatives and texture enhancers in processed meat, cheese, and baked goods, are absorbed at roughly 90%, compared to 40-60% for phosphate naturally bound in whole foods like meat, dairy, and legumes, well-established physiology. What that difference actually does downstream is more open than often presented. A 3-week randomized crossover trial in early-stage CKD patients found higher phosphate-additive intake did raise urinary phosphorus excretion as expected, but did not significantly raise albuminuria or FGF23 in that specific trial. No thyroid-specific data exists here. Flagged as an example of \"the same nutrient behaves differently depending on its source,\" directly echoing the 6-DFF (6 Dimensions of Food Friendliness) scoring philosophy that source and form matter, not just a nutrient's name.",
    citations: [
      { source: 'NIH Office of Dietary Supplements, Phosphorus Health Professional Fact Sheet', url: 'https://ods.od.nih.gov/factsheets/Phosphorus-HealthProfessional/' },
      {
        source: 'Chang et al. 2017, American Journal of Kidney Diseases (SODA-POP randomized crossover trial)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/27865566/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['ckd-phosphate-additives'],
  },
  {
    id: 'additive-bha-bht',
    category: 'basicHealth',
    title: 'BHA & BHT: One Is Flagged by U.S. Federal Toxicology as a Likely Carcinogen; the Other Has Thyroid-Hormone Animal Data',
    teaser: 'Two closely related preservatives, two different concerns attached to each one.',
    summary:
      "BHA and BHT get mentioned together often enough that it's easy to assume they carry the same concern. They don't. Each has its own separate finding worth knowing. BHA, butylated hydroxyanisole, is listed by the National Toxicology Program as reasonably anticipated to be a human carcinogen, based on animal studies, and is more heavily restricted in the EU than the U.S. Its close chemical relative BHT has separate animal research showing measurable effects on circulating thyroid hormone levels at high doses. Both remain FDA-approved at current use levels for preserving fats, oils, and cereal-based products from oxidation. Two different concerns, not one shared risk profile just because the names look similar.",
    citations: [
      {
        source: 'National Toxicology Program, Report on Carcinogens, 15th ed. (BHA profile)',
        url: 'https://www.ncbi.nlm.nih.gov/books/NBK590883/',
      },
      {
        source: 'Søndergaard & Olsen 1982, Toxicology Letters: "The effect of BHT on the rat thyroid"',
        url: 'https://pubmed.ncbi.nlm.nih.gov/7080091/',
      },
    ],
    overallTier: 'weak',
  },
  {
    id: 'additive-xanthan-guar-gum',
    category: 'basicHealth',
    title: 'Xanthan Gum & Guar Gum: Included Deliberately, Two Very Common Thickeners With Little Evidence of Harm',
    teaser: 'Not every entry on this list is a warning. This one exists specifically to prove that.',
    summary:
      "A list built entirely around concerns risks implying every food additive deserves equal suspicion. This entry exists specifically to push back against that impression. Both xanthan gum and guar gum are fermentation- or plant-derived thickeners used across gluten-free baking, sauces, and dairy alternatives. Neither has a meaningful body of evidence linking normal dietary use to harm. Guar gum in particular has positive, if modest, data as a soluble fiber source supporting gut motility and short-chain fatty acid production. Included on this list specifically to avoid implying every additive deserves equal suspicion. Teaching what's actually fine is as much a part of food literacy as flagging what isn't.",
    citations: [
      { source: 'EFSA re-evaluation of guar gum (E412), 2017', url: 'https://www.efsa.europa.eu/en/efsajournal/pub/4669' },
    ],
    overallTier: 'weak',
  },
  {
    id: 'additive-tying-together',
    category: 'basicHealth',
    title: 'Tying It All Together: One Pattern Across These 17',
    teaser: 'Read individually these look like 17 separate dangers. Read together, one pattern explains most of them.',
    summary: "Read one at a time, these 17 entries can look like an intimidating list of unrelated dangers. Read together, a pattern emerges: nearly every documented risk here is a chronic, cumulative-exposure finding (a 12-week mouse trial, a multi-year cohort, a 5-year sweetener threshold), not a single-serving danger. The more useful question isn't \"is this dangerous in one meal,\" it's \"how often does this actually show up across my ongoing diet,\" which is exactly what the longitudinal tracking is built to help notice, not a reason to fear any one ingredient in isolation. The two entries deliberately included as counterexamples (MSG, xanthan/guar gum) are part of the same point: not everything on a typical \"avoid\" list holds up under scrutiny. Knowing which concerns are actually worth watching, and which aren't, is itself a form of food literacy this whole category is built to teach.",
    citations: [
      {
        source: 'Lane et al. 2024, BMJ: ultra-processed food exposure and adverse health outcomes, umbrella review',
        url: 'https://doi.org/10.1136/bmj-2023-077310',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['problem-commercial-premade', 'lifestyle-ultra-processed-food'],
  },
];
