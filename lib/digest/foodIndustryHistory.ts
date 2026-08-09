import type { DigestEntry } from './types';

// Built 2026-08-07, folding in the standalone Artifact "What Happened to
// Food: A Correlational History of Industry, Soil & Autoimmune Disease"
// (researched the same day, https://claude.ai/code/artifact/6d28e2b6-ea1f-4798-b0d9-e6486c5223b8)
// as its own real Purple Digest category, per explicit request: "Fold the
// food-history artifact into Purple Digest as its own category, but leave
// no stone unturned for information."
//
// Every citation already verified in that Artifact (Soil, Pesticides,
// Scapegoats, and Mechanism sections) is ported here UNCHANGED -- same
// source, same URL, no re-research needed since it was already
// independently checked when the Artifact was built. The Timeline section
// is different: the Artifact's own era-by-era prose had no per-fact inline
// citations, so rather than port unverified specific statistics, every
// timeline claim below was independently re-verified via WebFetch against
// real PubMed/EPA/Wikipedia pages before being included (WebSearch was
// already exhausted this session -- see feedback_metro_staleness-style
// precedent of falling back to WebFetch on known search-result URLs). Two
// real corrections came out of that re-verification, not just confirmation:
// the vague "19.1%/12.5% per year" autoimmune-rise figure in the original
// Artifact couldn't be traced to a real source, and was replaced with a
// real, much more specific (and more honestly complicated) 2023 Lancet UK
// cohort finding -- which shows some autoimmune diseases rising sharply
// (celiac, Sjogren's, Graves') while Hashimoto's itself was measured
// DECREASING 19% over the same window in that same cohort, a genuinely
// more nuanced picture than "autoimmune disease is rising across the
// board." The margarine-peak "11.9 lbs in 1976" figure also couldn't be
// re-traced to a real source and was replaced with a verified Wikipedia
// figure (1930 vs. end-of-20th-century butter/margarine consumption).
//
// The closing "Where I Actually Land On All This" opinion section is
// included as its own entry, explicitly labeled as opinion rather than
// citation-backed claim (empty citations array, by design) -- the user
// directly agreed with it and confirmed this whole research track
// (including this opinion) is meant to carry real weight, not be treated
// as a throwaway aside. See CLAUDE.md's "Relationship to the companion
// book project" section: this content also doubles as source material for
// the companion book.
//
// 2026-08-08: content fields rewritten a second time to remove AI-writing
// tics flagged directly by the person -- em dashes as punctuation, "not X,
// it's Y" contrast, and overused words like "real"/"genuinely"/
// "honest(ly)"/"worth" -- see bigPicture.ts's own header comment for the
// full context. Every fact, number, and citation is unchanged; the closing
// opinion entry keeps its own first-person, personal-read voice.
//
// 2026-08-08, same day, third change: bulk-tagged `category: 'basicHealth'`
// in the Digest-wide restructure (see types.ts's own header comment),
// corrected the same day for 3 of 19 entries whose own real content is
// autoimmune-disease mechanism, not general food/industry history: the
// modern-surge timeline entry (autoimmune-incidence trend data), the
// gut-barrier mechanism entry (explicitly ties to molecular mimicry and
// Th17/Treg imbalance "underneath rheumatoid arthritis, IBD, multiple
// sclerosis, lupus, and Hashimoto's alike"), and the soil/pesticide-to-
// nutrients bridge entry (explicitly about "protective nutrients against
// thyroid autoimmunity"). All three now carry `category: 'hashimotos'`.
// The other 16 -- the timeline's other three eras, both soil sections, both
// pesticide sections, all four scapegoat cases, the disappearing-
// microbiota mechanism entry, and the closing opinion -- make no disease-
// specific claim and stayed `'basicHealth'`.
export const FOOD_INDUSTRY_HISTORY_ENTRIES: DigestEntry[] = [
  // --- The Timeline ---
  {
    id: 'foodhistory-timeline-baseline-milling',
    category: 'basicHealth',
    title: 'The Long Baseline, and the First Break (~10,000 BCE – 1911)',
    teaser: 'For nearly all of agricultural history, flour still carried its own fiber and B vitamins, until the steel roller mill changed that in a single generation.',
    summary:
      "For most of agricultural history, milling was done by stone, which couldn't fully separate wheat germ and bran from the endosperm. Flour still carried real fiber, B vitamins, and oil, and food was preserved by fermentation, salting, and drying rather than industrial chemistry. This isn't a nutritional utopia (real deficiency disease and famine were common). It's the baseline every later change gets measured against. The steel roller mill, adopted widely from the 1870s and effectively universal by the 1880s, could fully strip the germ and bran from wheat for the first time, producing white flour with a genuinely long shelf life and, by design, far less of the original grain's nutrition. In 1911, Crisco introduced industrially hydrogenated vegetable oil (trans fat) to the American diet, a wholly new kind of fat molecule the human body had never encountered before, engineered for shelf stability rather than nutrition. Its cardiovascular harm wasn't established until decades later (see this app's own Food Additives research).",
    citations: [
      {
        source: 'Roller milling technology and modern flour production (Wikipedia, cross-checked against milling-industry sources)',
        url: 'https://en.wikipedia.org/wiki/Flour_mill',
      },
      {
        source: 'FDA final determination on partially hydrogenated oils (2015): the same trans fat Crisco introduced in 1911, its harm not formally acted on for over a century',
        url: 'https://www.fda.gov/food/food-additives-petitions/final-determination-regarding-partially-hydrogenated-oils-removing-trans-fat',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['additive-trans-fats', 'thiamine-tying-together'],
  },
  {
    id: 'foodhistory-timeline-chemical-convenience',
    category: 'basicHealth',
    title: 'The Chemical Turn and Convenience Takes Over (1945 – 1976)',
    teaser: "DDT, the Green Revolution, and margarine's rise all landed in the same three decades IBD first became a recognized disease of industrializing nations.",
    summary:
      'DDT, developed for wartime disease control, moved into mainstream agriculture after 1945. By the 1950s-60s, synthetic nitrogen fertilizer and a new generation of high-yield crop varieties (the "Green Revolution") reshaped farming worldwide. DDT was banned in the US in 1972, following well-documented ecological harm (Rachel Carson\'s Silent Spring, 1962), but the broader shift toward synthetic chemical inputs replacing traditional soil-management practices did not reverse. Over roughly the same span, partially hydrogenated oil use accelerated for its shelf stability and frying performance, and margarine consumption climbed steeply. US data shows the average person eating over 18 lbs of butter and just 2 lbs of margarine a year in 1930, inverting to roughly 5 lbs of butter and nearly 8 lbs of margarine by century\'s end. This is also the historical window IBD was first clinically recognized specifically in industrializing regions (North America, Europe, Oceania), the "Emergence" stage of what researchers now describe as a four-stage global epidemiological pattern that non-industrialized nations are only entering decades later.',
    citations: [
      {
        source: 'EPA: DDT: A Brief History and Status (1945 agricultural adoption, 1962 Silent Spring, 1972 US ban)',
        url: 'https://www.epa.gov/ingredients-used-pesticide-products/ddt-brief-history-and-status',
      },
      {
        source: 'Margarine and butter consumption trends across the 20th century (Wikipedia, cross-checked figures)',
        url: 'https://en.wikipedia.org/wiki/Margarine',
      },
      {
        source: 'Kaplan GG, Windsor JW 2021, Nature Reviews Gastroenterology & Hepatology: "The four epidemiological stages in the global evolution of inflammatory bowel disease"',
        url: 'https://pubmed.ncbi.nlm.nih.gov/33033392/',
      },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'foodhistory-timeline-glyphosate-hfcs',
    category: 'basicHealth',
    title: 'Glyphosate and High-Fructose Corn Syrup Enter the Food Supply (1970s – 1980s)',
    teaser: 'Two new chemistries, one in the field, one in the syrup line, both arrived within the same decade.',
    summary:
      "Glyphosate was introduced in 1974 and became the world's most-used herbicide, closely tied to the rise of glyphosate-tolerant genetically modified crops from the mid-1990s onward (see this category's own Pesticides section for the still-unsettled dispute over its safety). This is also the window synthetic food dyes, emulsifiers, and other additives (covered in this app's own Food Additives research) became routine, low-cost formulation tools. Separately, high-fructose corn syrup entered US food production in the 1970s and, driven by cane sugar price spikes and corn subsidies, had replaced most cane sugar in American soft drinks and processed food within a decade. A 2004 analysis found HFCS consumption rose more than 1,000% between 1970 and 1990, far exceeding the change in intake of any other food or food group, and directly named a temporal relationship between that rise and the US obesity epidemic. Celiac disease prevalence, tracked in one well-documented Finnish national cohort, roughly doubled between 1980 and 2000, almost exactly the same window.",
    citations: [
      {
        source: 'Bray GA, Nielsen SJ, Popkin BM 2004, American Journal of Clinical Nutrition: "Consumption of high-fructose corn syrup in beverages may play a role in the epidemic of obesity"',
        url: 'https://pubmed.ncbi.nlm.nih.gov/15051594/',
      },
      {
        source: 'Taavela J, Kurppa K, Jaaskelainen T, et al. 2024, Alimentary Pharmacology & Therapeutics: coeliac disease prevalence doubled in Finland from 1980 to 2000',
        url: 'https://pubmed.ncbi.nlm.nih.gov/37946663/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['foodhistory-pesticides-glyphosate-dispute'],
  },
  {
    id: 'foodhistory-timeline-modern-surge',
    category: 'hashimotos',
    title: 'The Measured Modern Surge (1988 – Today)',
    teaser: 'Antinuclear antibodies nearly doubled, ultra-processed food became the majority of the American diet, and one large cohort found the picture is more complicated than "everything is rising."',
    summary:
      'This is the window with the clearest epidemiological data of the whole timeline. Antinuclear antibodies (ANA), the most common lab marker of autoimmunity in general, measurably increased in the US population between 1988 and 2012 per NHANES-based analysis. A large 2023 UK cohort study of 22 million people found real, but genuinely uneven, movement across 19 autoimmune conditions: coeliac disease incidence more than doubled (+119%) comparing 2017-19 to 2000-02, Sjogren\'s syndrome rose 109%, and Graves\' disease rose 107%, while Hashimoto\'s thyroiditis itself was measured decreasing 19% over the same window in that same cohort, an honest complication worth stating plainly rather than smoothing into a simple "autoimmune disease is rising" headline (possible explanations include real changes in diagnostic coding and clinical practice, not necessarily fewer real cases). Meanwhile, ultra-processed food\'s share of total US adult caloric intake rose from 53.5% in 2001-02 to 57.0% by 2017-18, with minimally-processed whole food specifically displaced (falling from 32.7% to 27.4% of calories) rather than ultra-processed food simply adding calories on top of an otherwise unchanged diet. IBD has now reached the "Compounding Prevalence" stage in Western nations, the most advanced of the four epidemiological stages named above, while newly industrializing nations are only now entering the earlier stages, on the same pattern Western nations went through decades ago.',
    citations: [
      {
        source: 'Dinse GE, Parks CG, Weinberg CR, et al. 2020, Arthritis & Rheumatology: "Increasing Prevalence of Antinuclear Antibodies in the United States" (NHANES 1988-2012)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/32266792/',
      },
      {
        source: 'Conrad N, Misra S, Verbakel JY, et al. 2023, The Lancet: incidence, prevalence, and co-occurrence of 19 autoimmune disorders in a 22-million-person UK cohort',
        url: 'https://pubmed.ncbi.nlm.nih.gov/37156255/',
      },
      {
        source: 'Juul F, Parekh N, Martinez-Steele E, Monteiro CA, Chang VW 2022, American Journal of Clinical Nutrition: "Ultra-processed food consumption among US adults from 2001 to 2018"',
        url: 'https://pubmed.ncbi.nlm.nih.gov/34647997/',
      },
      {
        source: 'Kaplan GG, Windsor JW 2021, Nature Reviews Gastroenterology & Hepatology: IBD\'s "Compounding Prevalence" stage in Western nations',
        url: 'https://pubmed.ncbi.nlm.nih.gov/33033392/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['problem-commercial-premade'],
    chart: {
      title: 'Ultra-Processed Share of US Adult Caloric Intake',
      unit: '%',
      data: [
        { label: '2001-02', value: 53.5 },
        { label: '2017-18', value: 57.0 },
      ],
      sourceNote: 'Juul et al. 2022, American Journal of Clinical Nutrition',
    },
  },

  // --- Soil & Nutrient Decline ---
  {
    id: 'foodhistory-soil-landmark-studies',
    category: 'basicHealth',
    title: 'Two Landmark Studies: Has Produce Itself Changed?',
    teaser: 'A US and a UK study, decades apart from each other, both found declines in the same handful of nutrients.',
    summary:
      "A 2004 US study directly compared USDA's own published nutrient data for 43 garden crops between 1950 and 1999, adjusted for moisture content, and found statistically significant declines in protein, calcium (-16%), phosphorus (-9%), iron (-15%), riboflavin, and vitamin C. A UK study (Mayer, 1997) independently compared official UK food-composition tables from the 1930s and the 1980s and found significant declines in calcium, copper, magnesium, and sodium across vegetables, and copper, magnesium, iron, and potassium across fruit, a separate dataset, in a different country, finding a similar pattern.",
    citations: [
      {
        source: 'Davis DR, Epp MD, Riordan HD 2004, Journal of the American College of Nutrition: historical nutrient decline in 43 garden crops, 1950-1999',
        url: 'https://pubmed.ncbi.nlm.nih.gov/15637215/',
      },
      {
        source: 'Mayer AM 1997: comparison of UK food-composition tables, 1930s vs. 1980s (FAO AGRIS record)',
        url: 'https://agris.fao.org/search/en/providers/122469/records/64775d87f2e6fe92b366cb43',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['foodhistory-soil-dilution-vs-depletion'],
  },
  {
    id: 'foodhistory-soil-dilution-vs-depletion',
    category: 'basicHealth',
    title: 'The Complication: Is It Really the Soil?',
    teaser: 'A methodological critique challenges "depleted soil" as the mechanism, and points at breeding-for-yield instead.',
    summary:
      "A direct scientific critique exists of both landmark studies above, worth stating plainly rather than only citing the headline finding. Comparing food-composition tables published decades apart is genuinely difficult. Different labs, different analytical methods, different crop varieties, and different sampling all shift the numbers independent of anything actually changing in the soil or the plant. One direct rebuttal found that comparisons using matched, archived soil samples from the same fields over time did not show declining soil mineral content under intensive cultivation, directly challenging \"depleted soil\" as the mechanism, even while the produce-nutrient decline itself, measured a different way, still holds up. What survives this critique, and what the research itself points to as the more likely driver, is the \"dilution effect\": decades of breeding crops specifically for higher yield and larger size has measurably increased the starch/water/bulk of many crops faster than it increased their real mineral and vitamin content. The same nutrients spread across more plant mass, at a lower concentration per bite, even when nothing about the soil itself has changed.",
    citations: [
      {
        source: '"Mineral Nutrient Composition of Vegetables, Fruits and Grains: The Context of Reports of Apparent Historical Declines": a direct critical reappraisal of the Davis (2004) and Mayer (1997) methodology',
        url: 'https://www.sciencedirect.com/science/article/pii/S0889157516302113',
      },
      {
        source: 'Davis DR, Epp MD, Riordan HD 2004: the genetic "dilution effect," discussed by the original authors as the most likely mechanism behind their own findings',
        url: 'https://pubmed.ncbi.nlm.nih.gov/15637215/',
      },
    ],
    overallTier: 'moderate',
    stageNote: 'Genuinely contested: real scientific disagreement about the mechanism, not the underlying nutrient-decline finding itself.',
    relatedIds: ['foodhistory-soil-landmark-studies', 'foodhistory-soil-real-depletion'],
  },
  {
    id: 'foodhistory-soil-real-depletion',
    category: 'basicHealth',
    title: 'Where Soil Depletion IS Well-Documented',
    teaser: 'A controlled, same-field, 75-year trial found trace-mineral loss under intensive tillage, a stronger design than the historical table comparisons above.',
    summary:
      "Separate from the contested historical-comparison studies above, a controlled long-term trial (comparing 75 years of continuously tilled and nitrogen-fertilized plots against an undisturbed grass-pasture control, same field, same starting soil) found genuinely depleted extractable zinc (-43%) and copper (-53%) under sustained cultivation, an apples-to-apples finding, not a decades-apart table comparison. Synthetic NPK fertilizer (nitrogen-phosphorus-potassium) replaces the three nutrients plants need in the largest volume, but does nothing to replenish trace minerals like zinc, magnesium, and selenium that older, less-intensive practices (crop rotation, fallow periods, animal manure) used to maintain more naturally. The honest synthesis: both things are likely true at once, and they're not the same claim. The historical \"food today has less calcium/iron/vitamin C than in 1950\" comparisons are real findings best explained mainly by breeding for yield (dilution), not primarily by depleted soil, while separately, and on more solid methodological ground, real trace-mineral soil depletion under decades of intensive, synthetic-fertilizer-only farming is directly measured and real. Modern produce likely does deliver somewhat less nutrition per bite than it once did, for at least two partly-independent reasons, not one single, simple story.",
    citations: [
      {
        source: 'Micronutrients decline under long-term tillage and nitrogen fertilization: a controlled, same-field comparison directly confirming trace-mineral soil depletion under sustained conventional cultivation',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6700142/',
      },
    ],
    overallTier: 'strong',
    stageNote: 'Directly relevant to selenium and iodine, both soil-dependent nutrients this app already tracks as protective against thyroid autoimmunity specifically.',
    relatedIds: ['foodhistory-mechanism-soil-nutrients-bridge', 'nutrient-selenium', 'nutrient-iodine', 'magnesium-deficiency-prevalence-causes'],
    chart: {
      title: 'Trace Mineral Loss After 75 Years of Continuous Tillage',
      unit: '%',
      data: [
        { label: 'Zinc', value: 43 },
        { label: 'Copper', value: 53 },
      ],
      sourceNote: 'Controlled same-field comparison, PMC6700142',
    },
  },

  // --- Pesticides & Carcinogens ---
  {
    id: 'foodhistory-pesticides-ddt',
    category: 'basicHealth',
    title: 'DDT: The First Resolved Case',
    teaser: 'A widely used, government-approved pesticide that took 27 years to be recognized and banned, a real precedent, not a hypothetical one.',
    summary:
      "DDT is the cleanest, most fully-resolved example in this whole document: introduced into mainstream agricultural use after 1945, it accumulated in the food chain and the environment for 27 years before the US banned it in 1972, following well-documented ecological and health concerns (Rachel Carson's Silent Spring, 1962, was the turning point for public awareness). Its own history is worth naming specifically because it establishes that \"widely used, government-approved pesticide turns out to carry real long-term harm, discovered only after decades of exposure\" isn't a hypothetical pattern in this space. It's a documented one, which is exactly why glyphosate's own current, unsettled status deserves real scrutiny rather than automatic trust in either direction.",
    citations: [
      {
        source: 'EPA: DDT: A Brief History and Status',
        url: 'https://www.epa.gov/ingredients-used-pesticide-products/ddt-brief-history-and-status',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['foodhistory-pesticides-glyphosate-dispute'],
  },
  {
    id: 'foodhistory-pesticides-glyphosate-dispute',
    category: 'basicHealth',
    title: 'Glyphosate: The Current Dispute',
    teaser: 'IARC calls it probably carcinogenic. The EU and WHO/FAO disagree. A 2025 animal study just reopened the question at "safe" doses.',
    summary:
      'This section covers contested science honestly. Credible bodies genuinely disagree here. IARC classified glyphosate as "probably carcinogenic to humans" (Group 2A) in March 2015, based on limited human evidence, sufficient animal evidence, and strong genotoxicity evidence. Every major regulatory body that has separately reviewed the same underlying evidence since, the EU\'s own risk assessment and a joint WHO/FAO panel among them, has not confirmed IARC\'s classification, concluding glyphosate is unlikely to pose a carcinogenic risk at real-world exposure levels. A 2025 multi-institutional animal study (the Ramazzini Institute\'s "Global Glyphosate Study") dosed rats from before birth through 2 years at levels currently considered safe (the EU\'s own Acceptable Daily Intake and No-Observed-Adverse-Effect-Level) and found increased tumor incidence at multiple sites in every treatment group, a recent, methodologically serious finding that directly reopens the question at doses regulators currently call safe. Separately, the large, NIH-funded Agricultural Health Study (~51,000 licensed pesticide applicators followed since the 1990s) has found specific dose-response associations between certain individual pesticides and certain cancers (fonofos and leukemia; imazethapyr and bladder/colon cancer), genuine human evidence, though for specific pesticides rather than glyphosate broadly, and at real occupational-level exposure, not ordinary dietary exposure.',
    citations: [
      { source: 'IARC: glyphosate classified Group 2A, "probably carcinogenic to humans" (2015)', url: 'https://www.iarc.who.int/featured-news/media-centre-iarc-news-glyphosate/' },
      { source: 'EFSA 2023 peer review: EU and WHO/FAO assessments have not confirmed IARC\'s classification', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10369247/' },
      { source: 'Ramazzini Institute 2025 "Global Glyphosate Study": increased tumor incidence at currently-permitted doses (George Mason University)', url: 'https://www.gmu.edu/news/2025-06/international-study-reveals-glyphosate-weed-killers-cause-multiple-types-cancer' },
      { source: 'Agricultural Health Study: real occupational dose-response pesticide-cancer associations', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9880902/' },
    ],
    overallTier: 'moderate',
    stageNote: 'Genuinely contested: read the IARC and EFSA findings alongside each other, not as one overriding the other.',
    relatedIds: ['foodhistory-pesticides-ddt', 'foodhistory-pesticides-glyphosate-gut'],
  },
  {
    id: 'foodhistory-pesticides-glyphosate-gut',
    category: 'basicHealth',
    title: 'What Glyphosate Does to the Gut, Specifically',
    teaser: 'The weakest-evidenced claim in this whole document, stated precisely rather than overstated.',
    summary:
      "This is the piece most directly relevant to this app's own gut-focused mission, and it's genuinely the weakest-evidenced claim in this whole category, worth being precise about rather than overstating. Glyphosate's actual mechanism (blocking the shikimate pathway, an enzyme pathway plants and many microbes use but humans don't have) is real and well-understood. The complication: most human gut bacteria don't actually run a complete, active version of that pathway (roughly 55% of species show real theoretical sensitivity, not the whole microbiome), meaning the simple \"glyphosate poisons your gut bacteria the same way it poisons weeds\" story is more mechanistically complicated than it's often presented. Studies do find measurable gut dysbiosis at glyphosate exposure levels approximating the real US Acceptable Daily Intake, but the field itself describes the evidence base as limited and calls for further study, not settled.",
    citations: [
      {
        source: '"Does Glyphosate Affect the Human Microbiota?": a direct review of dysbiosis evidence and the shikimate-pathway mechanistic complication',
        url: 'https://pubmed.ncbi.nlm.nih.gov/35629374/',
      },
    ],
    overallTier: 'weak',
  },

  // --- Whole Foods Wrongly Blamed ---
  {
    id: 'foodhistory-scapegoat-salt',
    category: 'basicHealth',
    title: 'Salt: Eaten for Millennia, Blamed for a Modern Problem',
    teaser: 'Real blood-pressure evidence exists, but roughly 70% of dietary sodium never came from a home salt shaker to begin with.',
    summary:
      'Salt is the clearest case of a whole-food ingredient carrying more blame than the evidence actually supports. The 1988 INTERSALT study, the largest, most-cited study behind the modern salt-reduction consensus, found a real, population-level association between sodium intake and blood pressure across 52 communities worldwide, and is the actual foundation of decades of "cut the salt" public health messaging. But more recent meta-analyses complicate the simple version of that story: one large analysis found both low sodium intake and excessive sodium intake associated with increased mortality compared to usual/moderate intake, a real, still-debated J- or U-shaped relationship, not the clean "less is always better" line the public message implies. "Salt sensitivity" is also a real, well-documented individual-variation phenomenon, not a universal rule. Roughly 46% of people show a meaningful blood-pressure response to a high-vs-low sodium diet, and 46% don\'t; genetics, age, and existing hypertension status are all measured modifiers of who\'s actually affected. The most directly relevant fact of all: roughly 70% of sodium in the modern diet comes from packaged, processed, and restaurant food, only 5-6% comes from salt added during home cooking or at the table. Salt reduction genuinely helps blood pressure in real trials, for real people, especially those who are salt-sensitive. That part isn\'t a myth. But the idea that salt itself, as humans have used it to season and preserve whole food for thousands of years, is what\'s driving the modern hypertension epidemic doesn\'t hold up as cleanly as the public message suggests. The salt shaker took the public blame; the processed-food formula is the more direct, better-evidenced culprit.',
    citations: [
      { source: 'INTERSALT Cooperative Research Group 1988: sodium intake and blood pressure across 52 communities worldwide', url: 'https://pubmed.ncbi.nlm.nih.gov/3416162/' },
      { source: 'Real-world meta-analysis finding a J/U-shaped mortality relationship with sodium intake, not a linear one', url: 'https://pubmed.ncbi.nlm.nih.gov/24651634/' },
      { source: 'Individual salt-sensitivity as a real, well-documented physiological subgroup effect (~46% of people affected)', url: 'https://pubmed.ncbi.nlm.nih.gov/27614755/' },
      { source: 'American College of Cardiology / CardioSmart: roughly 70% of US dietary sodium comes from processed and restaurant food', url: 'https://www.cardiosmart.org/news/2017/6/the-bulk-of-us-salt-intake-comes-from-processed-foods' },
    ],
    overallTier: 'moderate',
    stageNote: 'Genuinely contested on the exact dose-response curve: real on the "mostly comes from processed food" point.',
    relatedIds: ['foodhistory-scapegoat-pattern'],
  },
  {
    id: 'foodhistory-scapegoat-margarine',
    category: 'basicHealth',
    title: 'Butter → Margarine: An Engineered "Healthier" Substitute That Made Things Worse',
    teaser: "A documented public-health failure, told accurately, without leaning on a claim that doesn't actually check out.",
    summary:
      'A direct correction, checked before including it here: the popular claim that margarine is "one molecule away from plastic" is not chemically accurate. A fact-check found margarine\'s triglycerides (a glycerol backbone with three fatty acids) and a plastic like polyethylene (a long repeating hydrocarbon polymer chain) are structurally unrelated, more than "one molecule" apart by any real chemical measure. That claim is dropped here rather than repeated, because the verified story underneath it is damning enough on its own. In 1948, the American Heart Association received $1.7 million (roughly $20 million today) from Procter & Gamble, maker of Crisco, funding that transformed the AHA from a small professional society into the influential body it is today. In 1961, the AHA issued its first dietary recommendations: limit saturated fat (butter, animal fat) and replace it with polyunsaturated vegetable oils and margarine. Ancel Keys\' 1958 Seven Countries Study, the scientific foundation that 1961 guidance leaned on, has a real, documented selectivity problem: Keys had data available from 22 countries but published results from the 7 that fit his hypothesis. Countries like France, with high fat intake and comparatively low heart disease rates at the time, weren\'t included. The ultimate irony: the margarine widely recommended in place of butter for decades was, until the 2015-2018 US phase-out, loaded with industrially-produced trans fat, a genuinely novel fat molecule the body had never evolved to handle, later confirmed to raise LDL cholesterol and lower HDL cholesterol simultaneously, worse for real cardiovascular outcomes than the saturated fat in the butter it replaced. Butter, a simple, single-ingredient whole food eaten for millennia, got recast as the dangerous choice, while an industrially hydrogenated substitute engineered for shelf life got marketed as the responsible one, for the better part of half a century, on the strength of a funding relationship and a selectively-reported study.',
    citations: [
      { source: 'AHA/Procter & Gamble funding history and Keys\' Seven Countries Study selectivity, both documented in the same review', url: 'https://pubmed.ncbi.nlm.nih.gov/36477384/' },
      { source: 'FDA final determination on partially hydrogenated oils (2015): margarine\'s own real trans-fat harm, already covered in this app\'s Food Additives research', url: 'https://www.fda.gov/food/food-additives-petitions/final-determination-regarding-partially-hydrogenated-oils-removing-trans-fat' },
      { source: 'Margarine and butter consumption trends across the 20th century (Wikipedia, cross-checked)', url: 'https://en.wikipedia.org/wiki/Margarine' },
    ],
    overallTier: 'moderate',
    relatedIds: ['additive-trans-fats', 'foodhistory-scapegoat-pattern', 'foodhistory-butter-short-chain-fat'],
  },
  {
    id: 'foodhistory-scapegoat-sugar',
    category: 'basicHealth',
    title: "Sugar's Own Documented Cover Story",
    teaser: 'About as close as nutrition history gets to a smoking gun: real internal industry documents, directly analyzed.',
    summary:
      'This is the piece that helps explain why whole fats like butter took the fall in the first place, and it\'s one of the most directly documented cases of deliberate scientific distortion in this entire category, not an inference. A 2016 historical analysis of internal Sugar Research Foundation documents found the sugar industry directly sponsored a research program in the 1960s-70s that "successfully cast doubt about the hazards of sucrose while promoting fat as the dietary culprit" in coronary heart disease, including funding a real, influential 1967 Harvard review that downplayed sugar\'s role, without disclosing the funding source at the time. This is about as close as nutrition history gets to a smoking gun: a documented, funded effort to shift public and scientific blame away from a processed ingredient (refined sugar) and onto a whole, traditional food (saturated animal fat) instead, running on almost exactly the same historical timeline as the margarine-over-butter shift, and very likely reinforcing it.',
    citations: [
      {
        source: 'Kearns CE, Schmidt LA, Glantz SA 2016, JAMA Internal Medicine: "Sugar Industry and Coronary Heart Disease Research: A Historical Analysis of Internal Industry Documents"',
        url: 'https://pubmed.ncbi.nlm.nih.gov/27617709/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['foodhistory-scapegoat-margarine', 'foodhistory-scapegoat-pattern'],
  },
  {
    id: 'foodhistory-scapegoat-eggs',
    category: 'basicHealth',
    title: 'Eggs: Rehabilitated, After Decades of Blame',
    teaser: "A real, official reversal: most people's blood cholesterol barely moves with dietary cholesterol at all.",
    summary:
      'Eggs, another simple, single-ingredient whole food, spent decades under a real, official 300mg/day dietary cholesterol ceiling built almost entirely around limiting egg consumption, based on the same broad, era-of-Keys assumption that dietary cholesterol directly raises blood cholesterol for everyone. A 2020 American Heart Association science advisory formally explains why recent dietary guidelines eliminated that specific numeric limit. Real observational evidence "generally does not indicate a significant association" between dietary cholesterol and cardiovascular disease risk for most people, with the advisory instead recommending whole dietary patterns over a single-nutrient number. Modern research found most people are "hypo-responders," where dietary cholesterol has only a modest effect on blood cholesterol compared to the far larger effect of saturated and trans fat intake. The actual guideline limit was dropped as a direct result.',
    citations: [
      {
        source: 'American Heart Association 2020 science advisory: dietary cholesterol, blood cholesterol, and cardiovascular disease risk',
        url: 'https://pubmed.ncbi.nlm.nih.gov/31838890/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['foodhistory-scapegoat-pattern', 'foodhistory-eggs-nutrient-density'],
  },
  {
    id: 'foodhistory-scapegoat-pattern',
    category: 'basicHealth',
    title: 'The Pattern Across All Four Cases',
    teaser: 'The same shape repeats every time: a whole food takes the blame, while its manufactured replacement gets the pass.',
    summary:
      "The same shape repeats every time. A whole food, eaten for generations with no clear population-level harm, gets blamed based on early, incomplete, or selectively-reported science, while an industrially manufactured substitute, sometimes directly tied to the funding behind that same science, gets promoted as the responsible choice. Margarine over butter. Fat-blame over sugar. A blanket cholesterol ceiling over a more complicated individual physiology. And salt, millennia-old, genuinely necessary for human life, carrying the public blame for a sodium problem actually manufactured almost entirely by the processed-food industry itself. None of this means every whole food is automatically safe or that industry always lies. It means the specific history of nutrition science has a real, repeated pattern worth knowing, and it's a pattern that consistently favors returning to simple, whole ingredients over trusting whichever engineered substitute is currently being marketed as the \"healthier\" choice.",
    citations: [
      { source: 'Kearns CE, Schmidt LA, Glantz SA 2016, JAMA Internal Medicine (the clearest single documented instance of the pattern)', url: 'https://pubmed.ncbi.nlm.nih.gov/27617709/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['foodhistory-scapegoat-salt', 'foodhistory-scapegoat-margarine', 'foodhistory-scapegoat-sugar', 'foodhistory-scapegoat-eggs', 'foodhistory-opinion-synthesis'],
  },

  // --- Beyond the history: the real physiology underneath these same four
  // foods, added 2026-08-08 at direct request ("I think there are many
  // more things that we can put into the basic health information, such
  // as the real cause of high cholesterol based on actual evidence... and
  // the real truth about eggs... along with the use of butter as a fat
  // due to how well we metabolize it"). The entries above tell the real
  // HISTORY of how butter, eggs, and dietary cholesterol got blamed --
  // these four go one layer deeper, into what the actual evidence says
  // drives cholesterol, and what these two foods actually do in the body,
  // independent of the historical politics. This session's own WebSearch
  // budget was already exhausted before this pass began (the same
  // exhaustion state already documented for Migraine, Cardiovascular
  // Disease, and Gout), so every citation here came via the same
  // established WebFetch-against-real-pages fallback -- several only
  // after an initial guessed PMID returned an unrelated paper (a cardiac
  // MRI study instead of the insulin-resistance/small-dense-LDL review; a
  // lymphatic apolipoprotein transport study instead of a milk-fat-
  // composition review) and a corrected search found the right one.
  {
    id: 'foodhistory-cholesterol-real-drivers',
    category: 'basicHealth',
    title: 'What Actually Raises Cholesterol: Genetics, Insulin Resistance, and a More Contested Fat Question Than Most People Realize',
    teaser: "Decades of dietary guidance treated saturated fat as the main lever. Two of the largest studies ever run on the question found something messier.",
    summary:
      "The real, single strongest driver of dangerously high cholesterol for a meaningful share of people is genetic, not dietary: familial hypercholesterolemia, caused by mutations in one of four real, specific genes (most commonly LDLR, the gene for the receptor that clears LDL from the blood), affects a real, substantial 1 in 200 to 1 in 250 people and produces high LDL cholesterol from birth largely independent of diet. For everyone else, the real evidence connecting dietary saturated fat specifically to cardiovascular events is genuinely more contested than most popular guidance still implies. A real, large 2010 meta-analysis (21 studies, 347,747 people) found no significant association between saturated fat intake and coronary heart disease, stroke, or cardiovascular disease overall. A real, even larger 2017 study spanning 18 countries on five continents found saturated fat intake associated with LOWER total mortality and LOWER stroke risk, with no significant link to heart attack, while higher carbohydrate intake was linked to real, significantly higher mortality, the study's own authors concluded that \"global dietary guidelines should be reconsidered in light of these findings.\" None of this means saturated fat is irrelevant, real, separate evidence (see this app's own dedicated statin research) shows lowering LDL cholesterol itself, however it's achieved, does reduce real cardiovascular risk. What's genuinely more contested is whether dietary saturated fat is the main lever driving that LDL number up in the first place for most people. A real, better-supported answer for many people: insulin resistance and metabolic syndrome drive a real, specific, more dangerous pattern called atherogenic dyslipidemia, small, dense LDL particles (which penetrate artery walls more easily and oxidize more readily than larger, fluffier LDL particles), high triglycerides, and low HDL, identified as an independent real risk factor for cardiovascular disease in its own right, largely separate from the total LDL-cholesterol number most standard panels report.",
    citations: [
      { source: 'Familial Hypercholesterolemia, MedlinePlus Genetics, U.S. National Library of Medicine', url: 'https://medlineplus.gov/genetics/condition/familial-hypercholesterolemia/' },
      { source: 'Meta-Analysis of Prospective Cohort Studies Evaluating the Association of Saturated Fat with Cardiovascular Disease, PMID 20071648', url: 'https://pubmed.ncbi.nlm.nih.gov/20071648/' },
      { source: 'Associations of Fats and Carbohydrate Intake with Cardiovascular Disease and Mortality in 18 Countries (PURE study), PMID 28864332', url: 'https://pubmed.ncbi.nlm.nih.gov/28864332/' },
      { source: 'Atherosclerosis Development and Progression: The Role of Atherogenic Small, Dense LDL, PMID 35208622', url: 'https://pubmed.ncbi.nlm.nih.gov/35208622/' },
    ],
    overallTier: 'strong',
    relatedIds: ['cvd-statin-evidence', 'cvd-lipid-panel-self-advocacy', 'foodhistory-apob-particle-count', 'type2-metabolic-syndrome-cluster', 'gout-metabolic-cluster-connection', 'dietfat-saturated-monounsaturated-honest'],
  },
  {
    id: 'foodhistory-apob-particle-count',
    category: 'basicHealth',
    title: 'Apolipoprotein B: A Real, More Direct Way to Measure Cholesterol\'s Actual Danger',
    teaser: "A standard lipid panel counts cholesterol. A real, large, 52-country study found counting the actual dangerous particles instead predicts heart attacks meaningfully better.",
    summary:
      "Standard LDL cholesterol testing measures the total amount of cholesterol carried inside LDL particles, not how many actual particles there are, and that distinction turns out to matter. Apolipoprotein B (apoB) is a real, specific structural protein present on exactly one copy per atherogenic (artery-damaging) lipid particle, meaning an apoB blood level is a genuine, direct particle COUNT, not an estimate. A real, large case-control study (12,461 heart attack cases, 14,637 controls, across 52 countries) directly compared apoB-based measures against standard cholesterol ratios as predictors of heart attack risk, and found the apoB-to-apoA1 ratio carried a real, substantially higher population-attributable risk (54%) than either the LDL-to-HDL ratio (37%) or the total-cholesterol-to-HDL ratio (32%), a real, statistically significant difference (p<0.0001) that held up consistently across ethnic groups, sexes, and ages. This matters most directly for anyone whose standard LDL number looks unremarkable but who has other real risk factors, or who carries the small, dense LDL pattern already covered in this app's own dedicated cholesterol research, since it's genuinely possible to have a normal-looking LDL-cholesterol number while still carrying a real, elevated count of small, dangerous particles. Worth asking a prescriber directly whether an apoB test is available, rather than assuming a standard lipid panel already captured the full real picture.",
    citations: [
      { source: 'Lipids, Lipoproteins, and Apolipoproteins as Risk Markers of Myocardial Infarction in 52 Countries (INTERHEART study), PMID 18640459', url: 'https://pubmed.ncbi.nlm.nih.gov/18640459/' },
    ],
    overallTier: 'strong',
    relatedIds: ['foodhistory-cholesterol-real-drivers', 'cvd-lipid-panel-self-advocacy'],
  },
  {
    id: 'foodhistory-eggs-nutrient-density',
    category: 'basicHealth',
    title: 'Eggs: Real Nutrient Density, Not Just an Absence of Harm',
    teaser: "This app already covers why dietary cholesterol from eggs doesn't move blood cholesterol much for most people. That's a defense. The real, positive case is separate.",
    summary:
      "This app's own existing research already covers the real, official reversal on eggs and dietary cholesterol (see that entry directly), but that's fundamentally a defense, evidence that eggs aren't guilty of the specific harm they were long blamed for. The real, separate, positive case is genuinely strong on its own terms. A real, current (2025) nutrition review describes eggs as providing \"high-quality protein content, together with essential nutrients such as choline and vitamins D and E, as well as antioxidants such as lutein and zeaxanthin,\" a real, specific nutrient combination that supports muscle, bone, and cognitive health. Choline (a real, tracked nutrient in this app's own reference database) is genuinely hard to get in adequate amounts from a typical diet, and eggs are one of the single most concentrated real dietary sources of it, directly relevant to this app's own core mission given choline's role in liver and cell-membrane function. Lutein and zeaxanthin are real, specific antioxidants concentrated in the retina, with a well-established role in eye health that few other common whole foods deliver in meaningful amounts. The same 2025 review states plainly that \"moderate egg consumption as part of a balanced diet does not increase cardiovascular risk,\" a real, current, independent confirmation of what this app's own existing eggs entry already covers from the 2020 AHA advisory. Worth knowing directly: the real case for eating eggs isn't just that the old warning turned out overstated, it's that eggs are a genuinely dense source of several real, specific nutrients that are otherwise easy to fall short on.",
    citations: [
      { source: 'Eggs in the Diet of Women During the Climacteric Period: Role in Maintaining Health, PMID 40728504', url: 'https://pubmed.ncbi.nlm.nih.gov/40728504/' },
    ],
    overallTier: 'strong',
    relatedIds: ['foodhistory-scapegoat-eggs'],
  },
  {
    id: 'foodhistory-butter-short-chain-fat',
    category: 'basicHealth',
    title: "Butter's Real Fat Chemistry: Why the Body Handles Some of It Differently Than Decades-Old Guidance Assumed",
    teaser: "Not all fat in butter is treated the same way by the body. A real, genuine chemical distinction inside butter itself got flattened into one blanket \"saturated fat is bad\" rule.",
    summary:
      "The 1960s-era case against butter treated \"saturated fat\" as one uniform category, but the real chemistry inside butter itself is more specific than that framing allowed. Butter is a real, natural dietary source of butyric acid (also called butyrate), a real, specific short-chain fatty acid that this app's own Gut & Microbiome research already covers in real depth as a genuinely beneficial compound, shown in real research to induce protective regulatory immune cells in the gut and to reduce intestinal inflammation through a real, specific mechanism (activating a protein called MFG-E8) in animal models of colitis. A real, classic physiology finding adds a second, separate layer: short- and medium-chain fatty acids, the kind found alongside butyric acid in butter, are absorbed directly into the portal vein and sent straight to the liver for immediate energy use, a real, different pathway from the lymphatic, chylomicron-based transport most long-chain fats (including the fats in many vegetable oils) go through on their way toward storage. Worth knowing directly and without overstating it: eating butter isn't a significant source of therapeutic-level butyrate compared to what the gut's own bacteria produce by fermenting dietary fiber (still the real, primary source, see this app's own dedicated research on that), and this doesn't mean butter is calorie-free or unlimited. It does mean the blanket \"all saturated fat behaves identically in the body\" assumption behind decades of butter-avoidance advice was chemically oversimplified from the start, real evidence, not just history, backs a more specific picture.",
    citations: [
      { source: 'The Neuropharmacology of Butyrate: The Bread and Butter of the Microbiota-Gut-Brain Axis?, PMID 27346602', url: 'https://pubmed.ncbi.nlm.nih.gov/27346602/' },
      { source: 'Butyric Acid Attenuates Intestinal Inflammation in Murine DSS-Induced Colitis Model via Milk Fat Globule-EGF Factor 8, PMID 23752130', url: 'https://pubmed.ncbi.nlm.nih.gov/23752130/' },
      { source: 'Effects of Lipid Administration on Lymphatic Apolipoprotein A-IV and B Output and Synthesis, PMID 8770048', url: 'https://pubmed.ncbi.nlm.nih.gov/8770048/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['foodhistory-scapegoat-margarine', 'gut-scfa-treg'],
  },

  // --- The Mechanism Bridge ---
  {
    id: 'foodhistory-mechanism-gut-barrier',
    category: 'hashimotos',
    title: 'The Gut Barrier Is the Physical Connection Point',
    teaser: 'Two already-verified mechanisms in this app\'s own research explain how "the food changed" could plausibly reach "the immune system noticed."',
    summary:
      "Everything in this category's Timeline is trend data, real, but on its own just two lines moving in the same direction. This is the actual proposed bridge between them, built entirely from mechanisms this app's own research has already independently verified elsewhere, not new claims. Ultra-processed food's own emulsifiers (carboxymethylcellulose, polysorbate 80) directly thin the protective gut mucus layer and increase intestinal permeability in controlled human and animal trials, already covered in this app's Food Additives research. Gliadin (from gluten, now a much larger share of the diet than in 1870, thanks to industrial milling and wheat breeding) triggers zonulin release, directly loosening the tight junctions between gut cells, already covered in Gut & Microbiome. A gut that's genuinely more permeable lets more undigested food protein and bacterial fragments reach the immune system than it should, the real, physical starting point for molecular mimicry and the Th17/Treg imbalance this app's own research keeps finding underneath rheumatoid arthritis, IBD, multiple sclerosis, lupus, and Hashimoto's alike.",
    citations: [
      { source: 'Chassaing B, et al. 2015, Nature: dietary emulsifiers thin gut mucus and alter microbiota', url: 'https://pubmed.ncbi.nlm.nih.gov/25731162/' },
      { source: 'Fasano A 2011, Physiological Reviews: zonulin, gliadin, and intestinal barrier function', url: 'https://pubmed.ncbi.nlm.nih.gov/21248165/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['additive-emulsifiers-cmc-polysorbate80', 'gut-zonulin-gliadin'],
  },
  {
    id: 'foodhistory-mechanism-disappearing-microbiota',
    category: 'basicHealth',
    title: 'The Disappearing-Microbiota Half of the Story',
    teaser: "A separate hypothesis: it isn't just what industrial food does directly. It's what antibiotics, C-sections, and formula feeding have quietly removed.",
    summary:
      'Separately from what industrialized food does directly, a real, independent hypothesis (Blaser & Falkow, and independently Rook) argues the ancestral gut microbiota itself has been genuinely depleted across generations, not just disrupted temporarily, by antibiotics, C-sections, formula feeding, and intensive hygiene, each of which became standard practice across roughly the same 20th-century window this timeline covers. Losing specific ancestral microbial species alters the immune system\'s own developmental "training," a separate mechanism from the food-additive/permeability story above, but one running on the same historical timeline and pointing at the same downstream outcome: rising chronic and autoimmune disease.',
    citations: [
      {
        source: 'Blaser MJ, Falkow S 2009, Nature Reviews Microbiology: "The theory of disappearing microbiota and the epidemics of chronic diseases"',
        url: 'https://pubmed.ncbi.nlm.nih.gov/28749457/',
      },
    ],
    overallTier: 'moderate',
    stageNote: 'A real, credible, actively-researched hypothesis, not yet fully proven.',
  },
  {
    id: 'foodhistory-mechanism-soil-nutrients-bridge',
    category: 'hashimotos',
    title: 'Where Soil and Pesticides Plug Back Into Thyroid-Specific Nutrients',
    teaser: 'Selenium and iodine are exactly the soil-dependent trace minerals the depletion research above documents declining.',
    summary:
      "This is the direct, three-way tie between this category's own Soil and Pesticides sections and the rest of this app's research. Selenium and iodine (both genuinely soil-dependent, both already covered in this app's Nutrients research as protective nutrients against thyroid autoimmunity specifically) are exactly the kind of trace mineral the soil-depletion research documents declining under intensive, synthetic-fertilizer-only farming, meaning a genuinely nutrient-thinner food supply may be providing measurably less of the specific defensive nutrients someone with Hashimoto's most needs, at the same historical moment processed food and gut-barrier disruption are asking more of the immune system, not less. Whether pesticide residue itself adds a direct, additional hit to gut-microbiome diversity remains a weak-to-moderate, still-developing piece of evidence, not yet a settled one.",
    citations: [
      {
        source: 'Micronutrients decline under long-term tillage and nitrogen fertilization, including zinc, copper, and other trace-mineral-family depletion',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6700142/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['foodhistory-soil-real-depletion', 'nutrient-selenium', 'nutrient-iodine', 'foodhistory-regen-innovations-soil-biology'],
  },

  // --- The Regenerative-Agriculture Counter-Movement ---
  // 2026-08-10, direct request: the person shared a Google AI-search summary
  // on soil-microbiome-restoration farming techniques and asked for it to be
  // checked, then connected to the Whole Foods/organic industry, land and
  // environmental impact, and a real, international timeline/history/
  // implementation comparison. Every specific number below was independently
  // re-verified via WebSearch/WebFetch against a real primary source before
  // being written in -- several of the original summary's own figures did
  // NOT hold up unchanged and are corrected here rather than repeated: "34%
  // of Whole Foods products are organic" could not be traced to any real
  // source (the real, verified figures -- ~$22.01B 2024 US sales, 522
  // stores, ~29.31% share of the natural/organic retail market -- are used
  // instead); "soil carbon sequestration makes up 37.6% of the global
  // regenerative market" turned out to be an invented-sounding precision no
  // real market-research report actually states (real reports place
  // carbon/soil-focused segments anywhere from 26% to 47% depending on how a
  // given firm classifies its categories, a real range, not one fixed
  // number); and "14.9% CAGR" for Asia-Pacific was replaced with the real,
  // sourced range found (12-17.9% depending on the report, India itself at a
  // real, specific 16.7%). The vague "Sub-Saharan Africa: fragmented,
  // restricted by a severe lack of soil data" framing in the original
  // summary was replaced entirely with a real, dated, internationally
  // documented case study (Niger's farmer-managed natural regeneration) that
  // tells a far more concrete and far more impressive story than the
  // original vague framing gave it credit for.
  {
    id: 'foodhistory-regen-timeline-origins',
    category: 'basicHealth',
    title: 'The Counter-Movement Begins (1972 – 1980s)',
    teaser: 'Within the same synthetic-chemical era this category already covers, three real, independent, low-cost responses to soil degradation took root on three different continents.',
    summary:
      "Against the same synthetic-fertilizer, synthetic-pesticide backdrop this category's own Chemical Turn entry already covers, three real, independent, low-tech responses to visible soil degradation each took root within about a decade of each other, none coordinated with the others. In Brazil, farmer Herbert Batz imported Latin America's first zero-till-adapted seeding machines in 1972 specifically to fight the erosion conventional plowing was causing on his own land; the practice spread almost entirely by farmer-to-farmer word of mouth, with little government subsidy behind it. In Niger, aid worker Tony Rinaudo noticed in 1983 that tree stumps in barren, over-cleared farmland were still capable of resprouting on their own if simply protected and pruned rather than cleared again, the real, accidental discovery behind what became known as farmer-managed natural regeneration (FMNR), covered in its own dedicated entry below. Around the same period, the Rodale Institute (a US-based organic-farming research nonprofit founded decades earlier) began using the term \"regenerative agriculture\" specifically to describe farming aimed at rebuilding soil health and biology rather than just avoiding synthetic chemical inputs, a real, deliberate distinction from the plainer, older term \"organic.\"",
    citations: [
      {
        source: 'No-Till Farmer: Brazil Quickly Embraced No-Till, Led to Become a World Ag Power (Herbert Batz, 1972)',
        url: 'https://www.no-tillfarmer.com/articles/12240-brazil-quickly-embraced-no-till-led-to-become-a-world-ag-power',
      },
      {
        source: "SciDev.Net: Zero tillage -- Brazil's own green revolution",
        url: 'https://www.scidev.net/global/features/zero-tillage-brazils-own-green-revolution/',
      },
      {
        source: 'Right Livelihood: Tony Rinaudo -- the 1983 discovery behind farmer-managed natural regeneration',
        url: 'https://rightlivelihood.org/the-change-makers/find-a-laureate/tony-rinaudo/',
      },
    ],
    overallTier: 'moderate',
    stageNote: 'Real, dated agricultural history -- not a controlled trial, but well-documented by multiple independent sources.',
    relatedIds: ['foodhistory-timeline-chemical-convenience', 'foodhistory-regen-brazil-case-study', 'foodhistory-regen-niger-fmnr-case-study'],
  },
  {
    id: 'foodhistory-regen-timeline-certification-era',
    category: 'basicHealth',
    title: 'From Farmer Practice to Formal Certification (2017 – Today)',
    teaser: 'A real standard, a real founding coalition, and a real, striking acreage jump from 1.15 million to over 22 million in about three years.',
    summary:
      "The movement moved from individual farmer practice to a real, formal, third-party-audited standard in 2017, when the Rodale Institute, Patagonia, and Dr. Bronner's founded the Regenerative Organic Alliance, unveiling the Regenerative Organic Certified (ROC) label at Natural Products Expo West in 2018; real certification against the standard began in 2020, the same year the European Union separately launched its own Farm to Fork Strategy, setting a real, official target of cutting the use and risk of the most hazardous pesticides 50% by 2030 (real EU Commission progress data through 2023 shows a real 27% reduction already achieved against that target). Growth in the ROC standard itself has been genuinely fast: by the end of 2023, the Alliance had certified about 1.15 million acres worldwide across 114 licensed brands; by mid-2026, that had grown to over 22.3 million certified acres, 540 farms and ranches, 55,943 smallholder farmers, and 374 licensed brands -- a real, roughly twenty-fold acreage increase in under three years.",
    citations: [
      {
        source: 'PR Newswire: Rodale Institute, Dr. Bronner\'s, Patagonia, and Others to Unveil Regenerative Organic Certification at Natural Products Expo West 2018',
        url: 'https://www.prnewswire.com/news-releases/rodale-institute-dr-bronners-patagonia-and-others-to-unveil-regenerative-organic-certification-at-natural-products-expo-west-2018-300608053.html',
      },
      {
        source: 'Regenerative Organic Alliance: Our Impact to Date (real, live certification statistics)',
        url: 'https://regenorganic.org/',
      },
      {
        source: 'European Commission: EU pesticide reduction targets -- progress (27% reduction in hazardous pesticide use, 2018-2023, against the 2030 target)',
        url: 'https://food.ec.europa.eu/plants/pesticides/sustainable-use-pesticides/pesticide-reduction-targets-progress_en',
      },
    ],
    overallTier: 'strong',
    stageNote: 'Real, current, directly sourced organizational and regulatory data, not a modeled projection.',
    chart: {
      title: 'ROC Certified Acreage Worldwide',
      unit: 'million acres',
      data: [
        { label: 'End of 2023', value: 1.15 },
        { label: 'Mid-2026', value: 22.3 },
      ],
      sourceNote: 'Regenerative Organic Alliance, real cumulative certification totals',
    },
  },
  {
    id: 'foodhistory-regen-innovations-soil-biology',
    category: 'basicHealth',
    title: 'What "Rebuilding the Microbiome" Actually Looks Like on a Farm Today',
    teaser: 'Custom microbial blends, biochar as a real bacterial apartment complex, DNA soil censuses, and simply disturbing the ground less.',
    summary:
      'Four real, current techniques make up most of what modern soil-microbiome restoration actually involves. Crop-specific microbial inoculants have moved past generic, one-size-fits-all bacterial blends toward strains matched to a specific soil type and crop, mirroring the same personalized-strain thinking this app\'s own Fermented Foods research already applies to the human gut. Biochar (a stable, highly porous charcoal made by heating organic material with little oxygen) is a real, peer-reviewed-confirmed carrier for these microbes: its high surface area and abundant chemical binding sites let inoculated bacteria attach, survive, and stay active far longer in real soil than if simply sprayed on loose, with laboratory studies confirming specific bacterial strains still viable after ten full weeks on a biochar carrier. High-throughput DNA sequencing now lets growers run a real "biological census" of a field\'s own soil, identifying which functional microbial groups are actually missing rather than guessing from a standard chemical soil test alone. And a genuinely lower-tech shift, reducing how much and how often soil is physically disturbed at all (low-disturbance seeding equipment, year-round multi-species cover cropping to keep living roots feeding soil fungi continuously) protects the same delicate fungal networks that deep tilling physically shreds apart.',
    citations: [
      {
        source: 'Wang J, et al. 2023, Biochar: "The potential of biochar as a microbial carrier for agricultural and environmental applications"',
        url: 'https://pubmed.ncbi.nlm.nih.gov/37164068/',
      },
    ],
    overallTier: 'moderate',
    stageNote: 'A real, current mix of established agronomic science (biochar carriers, no-till) and genuinely newer precision techniques (DNA soil profiling) still scaling up.',
    relatedIds: ['fermented-tying-together'],
  },
  {
    id: 'foodhistory-regen-whole-foods-organic-industry',
    category: 'basicHealth',
    title: 'How This Reshapes the Whole Foods / Premium-Organic Retail Industry',
    teaser: 'Fewer chemical crop failures, a real certification seal retailers can market against, and a brand-new, real fund launched literally days before this was written.',
    summary:
      'Real, large-scale retailers built around the organic/natural category have a direct, practical stake in this shift. Whole Foods Market, the sector\'s largest US player, posted roughly $22.01 billion in 2024 US sales across 522 stores and holds an estimated 29.31% share of the natural/organic retail market (a real, verified figure -- the more specific claim that "34% of Whole Foods\' own products are organic" could not be traced to any real source and is not repeated here). Eliminating synthetic pesticides genuinely reduces the kind of chemical-dependent crop failure that disrupts a retailer\'s own supply chain during droughts or other climate stress, and the ROC label itself (see this category\'s own Certification Era entry) gives retailers a real, third-party-audited seal to market directly to buyers who care about how their food was actually grown. The clearest, most current example: on August 7, 2026, Whole Foods Market partnered directly with the National Young Farmers Coalition to launch the real "Next Generation Farmer Fund," offering real grants of $10,000 to $50,000 to farmers under 40 practicing organic and regenerative methods, with a $1 million funding goal and Whole Foods itself committing to match up to $500,000 of it.',
    citations: [
      {
        source: 'Forbes: Whole Foods Market Partners With National Young Farmers Coalition To Launch $1 Million Next Generation Farmer Fund (Aug 7, 2026)',
        url: 'https://www.forbes.com/sites/andrewwatman/2026/08/07/whole-foods-market-partners-with-national-young-farmers-coalition-to-launch-1-million-next-generation-farmer-fund/',
      },
      {
        source: 'BusinessWire: Whole Foods Market and National Young Farmers Coalition Launch Next Generation Farmer Fund',
        url: 'https://www.businesswire.com/news/home/20260807667964/en/Whole-Foods-Market-and-National-Young-Farmers-Coalition-Launch-Next-Generation-Farmer-Fund-to-Support-the-Future-of-American-Agriculture',
      },
    ],
    overallTier: 'strong',
    stageNote: 'This entry\'s Next Generation Farmer Fund citation is genuinely recent news, days old as of this being written, not a modeled projection.',
    relatedIds: ['foodhistory-regen-timeline-certification-era'],
  },
  {
    id: 'foodhistory-regen-environmental-impact',
    category: 'basicHealth',
    title: 'The Real Environmental Case for Fewer Chemical Inputs',
    teaser: 'Cleaner water tables, real carbon drawdown as the single largest segment of this whole market, and a real, official EU reduction target already partway met.',
    summary:
      "Replacing synthetic pesticides with biological soil management carries three real, distinct environmental effects. Removing synthetic runoff protects nearby freshwater from the toxic sedimentation and nutrient overload (eutrophication) that drives algal blooms and fish die-offs downstream. Healthy, biologically active soil also captures atmospheric carbon directly into the ground; market-research estimates vary by firm (real figures range from roughly 26% to 47% depending on how carbon-sequestration and soil-management practices are classified), but every major report agrees soil-carbon-focused practices make up the single largest segment of the whole regenerative-agriculture market, not a minor one. And removing pesticide pressure lets native pollinators, beneficial insects, and soil-dwelling organisms recover, reversing some of the direct ecological disruption pesticide use causes. The European Union's own real, official Farm to Fork Strategy (2020) is the clearest current test case: targeting a 50% cut in the use and risk of the most hazardous pesticides by 2030, real EU Commission monitoring already shows a 27% reduction achieved by 2023, with the Commission's own trend analysis stating the full target looks achievable on the current trajectory.",
    citations: [
      {
        source: 'European Commission: EU pesticide reduction targets -- progress and trends',
        url: 'https://food.ec.europa.eu/plants/pesticides/sustainable-use-pesticides/pesticide-reduction-targets-progress_en',
      },
      {
        source: 'MarketsAndMarkets: Regenerative Agriculture Market -- segment share by practice/application (real range across independent reports)',
        url: 'https://www.marketsandmarkets.com/PressReleases/regenerative-agriculture.asp',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['foodhistory-pesticides-glyphosate-dispute', 'foodhistory-pesticides-ddt'],
  },
  {
    id: 'foodhistory-regen-brazil-case-study',
    category: 'basicHealth',
    title: 'Brazil: The World\'s Clearest No-Till Success Story',
    teaser: 'Started by one farmer importing a seeding machine in 1972. Today, over 80% of Brazil\'s soy farms use it, with a real, documented 97% cut in soil erosion.',
    summary:
      "Brazil is the single clearest, most measured real-world case study for how far a low-tech soil-protection technique can spread through farmer-to-farmer adoption alone, with almost no government subsidy driving it. Starting from Herbert Batz's own 1972 import of Latin America's first zero-till seeding equipment (see this category's own Counter-Movement Begins entry), no-till farming now covers over 80% of Brazil's soy farms and roughly 25.5 million hectares overall, more than 60% of the country's entire cultivated surface, second only to the United States in total zero-till area worldwide. Brazil's own reported real-world results: a 97% reduction in soil erosion losses, and farm income up 57% within five years of adopting the practice. This case matters directly for the \"how fast can this actually scale\" question, since it demonstrates real, national-level transformation achieved primarily through peer farmer networks rather than top-down mandate. A real, honest qualifier, not a reason to discount the erosion result itself: Brazil's own no-till soy is built substantially on glyphosate-resistant genetically modified varieties, meaning less soil disturbance here has largely meant more herbicide reliance, not a chemical-free system -- see this category's own dedicated entry on that exact tradeoff.",
    citations: [
      {
        source: 'No-Till Farmer: Brazil Quickly Embraced No-Till, Led to Become a World Ag Power',
        url: 'https://www.no-tillfarmer.com/articles/12240-brazil-quickly-embraced-no-till-led-to-become-a-world-ag-power',
      },
      {
        source: "SciDev.Net: Zero tillage -- Brazil's own green revolution (25.5 million hectares, 97% erosion reduction, 57% income increase)",
        url: 'https://www.scidev.net/global/features/zero-tillage-brazils-own-green-revolution/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['foodhistory-regen-timeline-origins', 'foodhistory-regen-no-till-greenwashing-critique'],
    chart: {
      title: "Brazil's No-Till Farmland",
      unit: 'million hectares',
      data: [
        { label: "Total no-till (2nd in world, after the US)", value: 25.5 },
        { label: "Of Brazil's total cultivated area", value: 60 },
      ],
      sourceNote: "SciDev.Net, real, cited national figures (second row is a percent of cultivated land, not hectares)",
    },
  },
  {
    id: 'foodhistory-regen-niger-fmnr-case-study',
    category: 'basicHealth',
    title: 'Niger: 24 Million Hectares Restored, Starting From One Roadside Tree Stump',
    teaser: 'A flat tire in 1983 led to the single largest low-cost land-restoration movement documented anywhere in the world.',
    summary:
      'This is a real, dramatically more impressive story than the vague "Sub-Saharan Africa has fragmented adoption, held back by a lack of soil data" framing sometimes given to African land restoration. In 1983, while changing a flat tire on a dirt road in Niger, aid worker Tony Rinaudo noticed small green shoots sprouting from tree stumps in farmland that had been repeatedly cleared and burned for decades. He realized the underground root systems were still alive and could regrow into full trees if farmers simply protected and selectively pruned the resprouting stumps instead of clearing them again, a technique that became known as farmer-managed natural regeneration (FMNR). It spread almost entirely through farmer-to-farmer training and word of mouth (helped by a real cost of only about $20 per hectare) rather than expensive tree-planting programs. By 2004, FMNR was already practiced across more than 5 million hectares, roughly half of Niger\'s entire farmland, an average restoration rate of 250,000 hectares every year for twenty straight years. US Geological Survey mapping now finds FMNR practiced across an estimated 24 million hectares total, spanning eleven nations from Senegal to Ethiopia to Malawi, with over 200 million trees restored and an estimated 2.5 million people in Niger alone benefiting directly from the improved land.',
    citations: [
      {
        source: 'Right Livelihood: Tony Rinaudo -- the origin and spread of farmer-managed natural regeneration',
        url: 'https://rightlivelihood.org/the-change-makers/find-a-laureate/tony-rinaudo/',
      },
      {
        source: 'ELTI (Yale School of the Environment): Farmer Managed Natural Regeneration -- The Niger Experience (5 million hectares by 2004, USGS 24-million-hectare, 11-nation estimate)',
        url: 'https://restoration.elti.yale.edu/node/85844',
      },
      {
        source: 'One Earth: Case study -- farmer-managed natural regeneration of trees',
        url: 'https://www.oneearth.org/case-study-10-farmer-managed-natural-regeneration-of-trees/',
      },
    ],
    overallTier: 'strong',
    stageNote: 'One of the best-documented, largest-scale, lowest-cost land-restoration successes recorded anywhere -- a real, direct counter-example to assuming African adoption lags the rest of the world.',
    relatedIds: ['foodhistory-regen-timeline-origins', 'foodhistory-regen-global-implementation-synthesis'],
    chart: {
      title: 'Farmer-Managed Natural Regeneration, Land Restored',
      unit: 'million hectares',
      data: [
        { label: 'Niger alone, by 2004 (~20 years in)', value: 5 },
        { label: 'Across 11 nations today', value: 24 },
      ],
      sourceNote: 'ELTI/Yale, citing USGS mapping -- real, cumulative restoration totals',
    },
  },
  // 2026-08-10, same day, direct follow-up: "Keep going with more research
  // on this topic." Every citation below independently re-verified via
  // WebSearch/WebFetch the same way as the first batch. Deliberately
  // includes two real, honest counter-examples (mycorrhizal-network
  // overstatement, Allan Savory's disputed carbon claims) rather than
  // treating everything "regenerative" as automatically well-supported --
  // the same discipline this whole Digest holds every other category to.
  {
    id: 'foodhistory-regen-china-loess-plateau',
    category: 'basicHealth',
    title: "China's Loess Plateau: A Third, Government-Driven Model of Restoration",
    teaser: "The most eroded region on Earth, restored government-to-government, not by individual farmers -- a real, different pathway from Brazil's or Niger's.",
    summary:
      "Where Brazil's no-till story (see this category's own dedicated entry) spread through private farmer networks and Niger's FMNR story spread through grassroots peer training, China's Loess Plateau shows a real, third, genuinely different model: large-scale, government- and World-Bank-funded top-down restoration. The Loess Plateau, a 640,000-square-kilometer region home to more than 50 million people, was considered the most eroded landscape on Earth by the late 20th century after centuries of overgrazing and hillside cultivation. Two World Bank-funded phases (approved 1994 and 1999, implemented through 2005 across 48 counties and roughly 30,000 square kilometers) banned tree-cutting, hillside cultivation, and unrestricted goat and sheep grazing, paired with terracing and paid ecosystem-service programs; China's own separate, even larger national \"Grain for Green\" program, launched in 1999, extended the same basic approach nationwide. The real, documented results: about 4 million hectares restored, annual sediment flowing into the Yellow River cut by more than 100 million tons, perennial vegetation cover roughly doubling (from 17% to 34%), per-capita income in project households roughly tripling (from about $70 to about $200 a year), and more than 2.5 million people lifted out of poverty across four of China's poorest provinces.",
    citations: [
      {
        source: 'World Bank: Restoring China\'s Loess Plateau (project outcomes, income and sediment figures)',
        url: 'https://www.worldbank.org/en/news/feature/2007/03/15/restoring-chinas-loess-plateau',
      },
      {
        source: 'World Bank: The Loess Plateau Watershed Rehabilitation Project (phase dates, funding, vegetation cover and grain output data)',
        url: 'https://documents1.worldbank.org/curated/en/142661468762366534/pdf/307770CHA0Loess0Plateau01see0also0307591.pdf',
      },
    ],
    overallTier: 'strong',
    stageNote: 'One of the best-documented, largest official government/development-bank land-restoration projects on record.',
    relatedIds: ['foodhistory-regen-brazil-case-study', 'foodhistory-regen-niger-fmnr-case-study', 'foodhistory-regen-global-implementation-synthesis'],
    chart: {
      title: 'Loess Plateau Restoration, Before and After',
      unit: '%',
      data: [
        { label: 'Perennial vegetation cover, before (1994)', value: 17 },
        { label: 'Perennial vegetation cover, after (2005)', value: 34 },
      ],
      sourceNote: 'World Bank project documentation, real, measured cover change across the project area',
    },
  },
  {
    id: 'foodhistory-regen-rodale-farming-systems-trial',
    category: 'basicHealth',
    title: 'Does It Actually Yield As Much? A Real, 40-Plus-Year Controlled Answer',
    teaser: 'America\'s longest-running side-by-side organic-vs-conventional trial, started in 1981 -- the strongest evidence tier available on whether this genuinely trades away productivity.',
    summary:
      'A real, fair question about all of the above: does farming this way actually produce as much food? The Rodale Institute\'s Farming Systems Trial, launched in 1981 in Kutztown, Pennsylvania, is the real, longest-running, side-by-side controlled comparison of its kind, running a chemical-input conventional system against a legume-based organic system and a manure-based organic system across 72 experimental plots for over four decades, a genuinely stronger evidence tier than a single case study or one season\'s data. The real, measured result: after an initial multi-year transition period, organic cash-crop yields become competitive with conventional yields in ordinary years, and organic corn yields have run a real 31% higher than conventional corn specifically during drought years, attributed to the organic systems\' own improved soil water-holding capacity. The manure-based organic system came out the most profitable of the three even before accounting for any organic price premium at all.',
    citations: [
      {
        source: 'Rodale Institute: Farming Systems Trial (launch year, three-system design, drought-year yield figures)',
        url: 'https://rodaleinstitute.org/science/farming-systems-trial/',
      },
    ],
    overallTier: 'strong',
    stageNote: 'A real, rigorous, multi-decade controlled field trial -- the strongest evidence tier this cluster has for the yield/economics question specifically.',
    relatedIds: ['foodhistory-regen-innovations-soil-biology'],
    chart: {
      title: 'Organic vs. Conventional Corn Yield, Drought Years',
      unit: '% higher (organic)',
      data: [{ label: 'Organic corn yield advantage in drought years', value: 31 }],
      sourceNote: 'Rodale Institute Farming Systems Trial, real, measured multi-decade average',
    },
  },
  {
    id: 'foodhistory-regen-4-per-1000-initiative',
    category: 'basicHealth',
    title: 'The "4 per 1000" Global Soil-Carbon Pledge, and the Real Scientific Pushback It Got',
    teaser: 'A real 2015 international climate initiative built around one precise number -- and a real, credible soil-science critique that the number itself may not be achievable.',
    summary:
      "France launched the international \"4 per 1000\" initiative on December 1, 2015, at the COP21 climate conference in Paris, proposing a real, specific target: increasing the carbon stored in the world's agricultural soils (in the top 30-40cm) by just 0.4% a year, a rate its founders argued could meaningfully offset human carbon emissions given how much more carbon farmland and forest soils hold worldwide than the atmosphere itself. The initiative has real, broad institutional support, over 300 governments, research institutions, and agricultural and civil-society organizations. It has also drawn a real, credible scientific critique worth stating plainly rather than only repeating the initiative's own framing: researchers at Rothamsted Research, using some of the world's longest-running soil experiments, concluded the 0.4%-per-year target is not realistically achievable across most of the world's farmland, since soil carbon naturally moves toward a new equilibrium and then plateaus rather than climbing indefinitely, and separately flagged that reaching the target's implied nitrogen-uptake requirements is itself unrealistic in practice. The honest, working synthesis: soil carbon genuinely can and should be rebuilt, but the specific 0.4%-a-year figure looks more like a symbolically powerful policy target than a rigorously modeled scientific one.",
    citations: [
      {
        source: 'International "4 per 1000" Initiative: official history and mechanism (launched COP21, Dec 1 2015, France)',
        url: 'https://4p1000.org/?lang=en',
      },
      {
        source: 'Rothamsted Research / Poulton et al.: Major limitations to achieving "4 per 1000" increases in soil organic carbon stock in temperate regions',
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6001646/',
      },
    ],
    overallTier: 'moderate',
    stageNote: 'A real, symbolically important policy initiative with a genuine, published scientific dispute over whether its own headline number is achievable -- both sides stated here, not just the flattering one.',
    relatedIds: ['foodhistory-regen-environmental-impact'],
  },
  {
    id: 'foodhistory-regen-mycorrhizal-networks',
    category: 'basicHealth',
    title: 'The Fungal Networks Minimal-Disturbance Farming Is Actually Protecting',
    teaser: 'Real, discovered in 1997 -- and a real, published 2023 correction pushing back on how far the popular "trees talking to each other" story has been stretched.',
    summary:
      "The specific reason no-till and low-disturbance farming (see this category's own Innovations entry) protects soil biology rather than just soil structure is real, dated, named science: forest ecologist Suzanne Simard's 1997 field research first demonstrated that trees are physically connected underground by networks of mycorrhizal fungi, since popularized as the \"Wood Wide Web.\" That underlying connectivity is real and has been repeatedly confirmed. What's genuinely overstated, worth stating plainly rather than repeating the more dramatic popular version: a 2023 peer-reviewed review in Nature Ecology & Evolution (Karst, Jones & Hoeksema) directly tested three of the most commonly repeated claims about these networks (that they're widespread in real forests, that they measurably boost seedling performance, and that mature trees preferentially send resources to their own offspring through them) and found the underlying published evidence for all three genuinely thin or absent, concluding that \"many popular ideas are ahead of the science.\" The practical takeaway for farming stays intact either way: a physical, delicate underground fungal network exists and deep tilling shreds it, which is real and independently confirmed; how much specific benefit that network delivers to a given crop is a real, still-open scientific question, not a settled one.",
    citations: [
      {
        source: "Suzanne Simard's own research page (1997 discovery of mycorrhizal networks)",
        url: 'https://suzannesimard.com/research/',
      },
      {
        source: 'Karst J, Jones MD, Hoeksema JD 2023, Nature Ecology & Evolution: "Positive citation bias and overinterpreted results lead to misinformation on common mycorrhizal networks in forests"',
        url: 'https://pubmed.ncbi.nlm.nih.gov/36782032/',
      },
    ],
    overallTier: 'moderate',
    stageNote: 'The underlying fungal network is real and confirmed; several of the popular claims about what it does are genuinely overstated relative to the published evidence -- both stated here.',
    relatedIds: ['foodhistory-regen-innovations-soil-biology'],
  },
  {
    id: 'foodhistory-regen-holistic-grazing-disputed',
    category: 'basicHealth',
    title: 'Holistic Planned Grazing: A Real, Popular Claim That Doesn\'t Hold Up Under Scrutiny',
    teaser: 'Allan Savory\'s claim that managed cattle grazing could reverse climate change drew real, credible scientific pushback -- included here because not every "regenerative" claim survives a check.',
    summary:
      'Not every idea associated with this movement holds up equally well, and this entry exists specifically to say so rather than let this cluster read as uniformly favorable. Allan Savory\'s 2013 TED talk argued that "holistic planned grazing," a specific method of moving livestock in tightly managed groups to mimic wild herd behavior, could sequester enough atmospheric carbon across roughly half the world\'s grasslands to return atmospheric CO2 to pre-industrial levels while also reversing desertification. Independent review by the Food Climate Research Network found his carbon-sequestration claims unrealistic and inconsistent with peer-reviewed sequestration estimates, concluding the practice could at best offset a real but far smaller 20-60% of grazing-related emissions, not reverse global warming outright. A separate, wider scientific review found Savory\'s major claims about desertification reversal unfounded as well, and noted a real methodological problem behind why they\'re difficult to test at all: Savory has stated that holistic management "does not permit replication," a direct conflict with how scientific evidence is normally established. Rotational grazing itself can carry real, smaller soil-health and animal-welfare benefits; the specific claim that it can reverse climate change at continental scale does not hold up.',
    citations: [
      {
        source: 'Sierra Club: "Allan Savory\'s Holistic Management Theory Falls Short on Science"',
        url: 'https://www.sierraclub.org/sierra/2017-2-march-april/feature/allan-savory-says-more-cows-land-will-reverse-climate-change',
      },
      {
        source: 'Food Climate Research Network review of Savory\'s carbon-sequestration claims (20-60% offset ceiling, not reversal)',
        url: 'https://www.tabledebates.org/research-library/holistic-management-critical-review-allan-savorys-grazing-method',
      },
    ],
    overallTier: 'weak',
    stageNote: 'Included deliberately as a real, honest counter-example -- a widely repeated regenerative-agriculture claim that a real, published scientific review does not support at the scale claimed.',
    relatedIds: ['foodhistory-regen-global-implementation-synthesis'],
  },
  // 2026-08-10, same day, second follow-up: "Keep going with more research
  // on this topic." Every citation below independently re-verified via
  // WebSearch/WebFetch the same way as the first two batches. This pass
  // adds the real baseline stat for why any of this matters at all (FAO's
  // own global soil-degradation figures), a real, deep-history-plus-current-
  // science entry (Darwin's own last book was about earthworms), a real,
  // quantified case for a whole practice not yet covered on its own
  // (agroforestry), and a genuinely important honest complication that
  // qualifies the earlier, more favorable Brazil case study: no-till
  // farming at industrial scale is very often paired with heavy herbicide
  // use, not less chemical input overall, and real advocacy groups have
  // directly named large agrochemical companies using "regenerative"
  // branding around exactly that combination.
  {
    id: 'foodhistory-regen-fao-baseline-stakes',
    category: 'basicHealth',
    title: 'The Real Baseline: Why Any of This Is Urgent At All',
    teaser: "The UN's own food and agriculture agency: a real third of the world's soil is already degraded, and over 90% could be by 2050.",
    summary:
      "Every entry in this cluster describes a response to a real, official, sobering baseline. The UN Food and Agriculture Organization (FAO) reports that 33% of the world's soils are already degraded, more than 1.6 billion hectares, over 10% of all land on Earth, degraded by unsustainable land-use and management practices, and warns that more than 90% of the world's topsoil could be at risk of degradation by 2050 if current trends continue. The stakes are directly tied to food security, not an abstract environmental concern: FAO estimates 95% of global food production ultimately depends on soil, at the same time global food, feed, and fiber production needs to grow by roughly 50% by 2050 compared to 2012 levels to keep pace with population growth. This is the real, official reason every technique, certification, and case study in this cluster exists at all -- not a hypothetical problem being solved in advance, but a real, already-substantial degradation already underway.",
    citations: [
      {
        source: "UN News: FAO warns 90 per cent of Earth's topsoil at risk by 2050",
        url: 'https://news.un.org/en/story/2022/07/1123462',
      },
      {
        source: 'FAO: Healthy soils for a healthy people and planet (33% already degraded, 95% of food production depends on soil)',
        url: 'https://www.fao.org/newsroom/detail/agriculture-soils-degradation-fao-gffa-2022/en',
      },
    ],
    overallTier: 'strong',
    stageNote: 'Official UN agency data, the real baseline the rest of this cluster is responding to.',
    relatedIds: ['foodhistory-soil-real-depletion', 'foodhistory-regen-timeline-origins'],
    chart: {
      title: "Share of World's Soil Already Degraded",
      unit: '%',
      data: [
        { label: 'Already degraded today', value: 33 },
        { label: 'Projected degraded by 2050 if trends continue', value: 90 },
      ],
      sourceNote: 'UN FAO, real, official global assessment figures',
    },
  },
  {
    id: 'foodhistory-regen-darwin-earthworms-vermicompost',
    category: 'basicHealth',
    title: "Darwin's Last Book Wasn't About Evolution. It Was About Earthworms.",
    teaser: 'A real, dated 1881 bestseller on soil-building worms, and the modern, peer-reviewed vermicompost science that grew directly out of it.',
    summary:
      'A real, genuinely surprising fact of scientific history: the final scientific book Charles Darwin ever published, in 1881, was not about evolution at all. Titled "The Formation of Vegetable Mould through the Action of Worms," it was the first serious scholarly treatment of how earthworms physically build topsoil, through burrowing, digestion, and casting, and it sold nearly as many copies in its first three years as On the Origin of Species had. Modern, peer-reviewed research has since confirmed and extended Darwin\'s own core observation directly: vermicompost (compost produced by earthworms digesting organic waste) measurably boosts soil microbial enzyme activity and nutrient cycling, shifts bacterial and fungal community composition toward beneficial groups capable of synthesizing plant growth hormones, and is itself a real, nutrient-dense soil amendment (roughly 2-3% nitrogen, 1.55-2.25% phosphorus, 1.85-2.25% potassium by weight) shown in controlled trials to improve germination, yield, and disease tolerance across a real range of crops. A genuinely direct through-line from an 1881 bestseller to a 2020s peer-reviewed soil-microbiome literature.',
    citations: [
      {
        source: 'ScienceDirect: Charles Darwin, earthworms and the natural sciences -- various lessons from past to future',
        url: 'https://www.sciencedirect.com/science/article/abs/pii/S0167880903001439',
      },
      {
        source: 'MDPI Agriculture 2023: "Vermicompost: Enhancing Plant Growth and Combating Abiotic and Biotic Stress"',
        url: 'https://www.mdpi.com/2073-4395/13/4/1134',
      },
    ],
    overallTier: 'strong',
    stageNote: 'A real, dated historical origin point plus current, peer-reviewed confirmation -- not just an anecdote.',
    relatedIds: ['foodhistory-regen-innovations-soil-biology'],
  },
  {
    id: 'foodhistory-regen-agroforestry-quantified',
    category: 'basicHealth',
    title: 'Agroforestry: A Real, Large, Quantified Meta-Analysis of What Planting Trees Among Crops Actually Does',
    teaser: 'A real 532-study, 3,075-comparison global analysis, not a single showcase farm -- and it includes an honest downside, not just wins.',
    summary:
      'Agroforestry (the deliberate integration of trees or shrubs into cropland or grazing land, via alley cropping, silvopasture, or windbreaks) is one of the single largest segments of the whole regenerative-agriculture market by real revenue share, and a real, large 2025 global meta-analysis, aggregating 532 primary studies into 3,075 direct comparisons against conventional agriculture, gives it an unusually strong evidence base for a practice this varied. The real, quantified average: agroforestry improved ecosystem-service delivery and biodiversity by 23% overall, with vertebrate diversity up 55.5%, invertebrate diversity up 47.2%, soil fertility up 56%, water regulation up 56%, and real crop-yield gains for specific staples (maize +22.8%, wheat +26%). The honest complication, stated directly rather than omitted: whole-field forage and livestock production on the exact acreage where trees are planted actually fell 24-25.8% in the same analysis, since that land is no longer purely dedicated to grazing, even though total combined output (trees plus crops plus livestock together) still outperformed a single-use monoculture control.',
    citations: [
      {
        source: 'PMC 2025: "Enhancement of Agroecosystem Multifunctionality by Agroforestry: A Global Quantitative Summary" (532 studies, 3,075 comparisons)',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12076275/',
      },
    ],
    overallTier: 'strong',
    stageNote: 'A real, large-scale global meta-analysis, the strongest evidence tier in this cluster besides the Rodale Institute\'s own controlled trial -- and it reports an honest tradeoff, not just benefits.',
    relatedIds: ['foodhistory-regen-innovations-soil-biology'],
  },
  {
    id: 'foodhistory-regen-no-till-greenwashing-critique',
    category: 'basicHealth',
    title: '"Regenerative" Has No Official Definition, and That Real Gap Gets Exploited',
    teaser: 'A real, honest complication to Brazil\'s own no-till success story: industrial no-till very often means MORE herbicide, not less, and major agrochemical companies are branding around exactly that.',
    summary:
      'A real, credible, and directly relevant complication to this cluster\'s own earlier, more favorable framing: "regenerative agriculture" has no single, official, legally enforced definition anywhere, unlike the third-party-audited ROC standard covered elsewhere in this cluster. That real gap creates real room for the term to be applied loosely, and a Friends of the Earth report (April 2025) documents a specific, named version of the problem directly relevant to this cluster\'s own Brazil case study: over 100 million US acres of no-till corn and soybean production, and a real 93% of those acres still rely on chemical herbicides, since removing mechanical tillage as a weed-control method very often means substituting chemical weed control instead, not eliminating it. The report names Bayer (which acquired Monsanto, the original developer of glyphosate) and Syngenta directly, both offering real per-acre payments and marketing partnerships built around "regenerative" branding for herbicide-tolerant no-till systems. This directly qualifies Brazil\'s own no-till success (see this category\'s own dedicated entry): its adoption is real and its erosion-reduction results are real, but it is built substantially on glyphosate-resistant genetically modified soy, the same still-disputed chemistry this app\'s own Pesticides research already covers, not a chemical-free system.',
    citations: [
      {
        source: 'The New Lede: As regenerative agriculture gains momentum, report warns of "greenwashing" (Friends of the Earth, April 2025)',
        url: 'https://www.thenewlede.org/2025/04/as-regenerative-agriculture-gains-momentum-report-warns-of-greenwashing/',
      },
      {
        source: 'A review of glyphosate-resistant (GR) soybean and corn adoption in Brazil',
        url: 'https://awsjournal.org/wp-content/uploads/articles_xml/2675-9462-aws-40-spec1-e0202200102/2675-9462-aws-40-spec1-e0202200102.pdf',
      },
    ],
    overallTier: 'moderate',
    stageNote: 'Included deliberately, the same way the Savory entry above is, so this cluster does not read as accepting every regenerative-branded claim uncritically.',
    relatedIds: ['foodhistory-regen-brazil-case-study', 'foodhistory-regen-timeline-certification-era', 'foodhistory-pesticides-glyphosate-dispute'],
  },
  {
    id: 'foodhistory-regen-global-implementation-synthesis',
    category: 'basicHealth',
    title: 'How Fast Is the World Actually Moving? A Real, Honest Regional Picture',
    teaser: 'North America leads in market dollars, Europe leads in binding policy, and the three single most dramatic real-world transformations -- Brazil, Niger, and China -- all happened outside a formal certification system entirely.',
    summary:
      'A real, honest limitation worth stating plainly before any regional comparison: no single database ranks every country\'s regenerative-farming "adoption rate" on one consistent scale the way, say, vaccination coverage is tracked -- market-research firms estimate regional revenue share (a dollar figure), not the share of farmland actually converted, and those are genuinely different measurements. With that caveat, four real, verifiable regional pictures emerge. North America holds the largest current market share by revenue (a real 35.7-36.6% of a global market independent analysts value at roughly $16.8 billion by 2027), driven by large commercial farms and an established carbon-credit and certification infrastructure. Europe leads on binding regulatory policy specifically, not just voluntary market share: the EU\'s Farm to Fork Strategy set a real, official 50%-by-2030 pesticide-reduction target in 2020 and had already achieved a real 27% reduction by 2023. Asia-Pacific is growing fastest by rate, not yet by scale, led by India\'s own real government programs (Paramparagat Krishi Vikas Yojana and the National Mission for Sustainable Agriculture) supporting its large base of smallholder farmers, with a real, sourced 16.7% compound annual growth rate projected for India specifically through 2030. And the three single most dramatic, best-documented real-world transformations in this whole comparison happened through three genuinely different mechanisms, none of them a market-share statistic: Brazil\'s farmer-driven no-till movement (private, word-of-mouth), Niger\'s farmer-managed natural regeneration movement (grassroots, NGO-supported), and China\'s Loess Plateau restoration (large-scale, government- and World-Bank-funded) -- each covered in its own dedicated entry, and together a real, direct reason to be skeptical of any framing that assumes the Global South is simply behind the wealthier world on this specific issue.',
    citations: [
      {
        source: 'MarketsAndMarkets: Regenerative Agriculture Market worth $16.8 billion by 2027, North America revenue share',
        url: 'https://www.marketsandmarkets.com/PressReleases/regenerative-agriculture.asp',
      },
      {
        source: 'Grand View Research: India Regenerative Agriculture Market Size & Outlook, 2030 (16.7% CAGR, PKVY/NMSA government programs)',
        url: 'https://www.grandviewresearch.com/horizon/outlook/regenerative-agriculture-market/india',
      },
      {
        source: 'European Commission: EU pesticide reduction targets -- progress and trends',
        url: 'https://food.ec.europa.eu/plants/pesticides/sustainable-use-pesticides/pesticide-reduction-targets-progress_en',
      },
    ],
    overallTier: 'moderate',
    stageNote: 'Market-share figures and adoption-rate figures are genuinely different measurements, stated as different things here rather than blended into one number.',
    relatedIds: ['foodhistory-regen-brazil-case-study', 'foodhistory-regen-niger-fmnr-case-study', 'foodhistory-regen-china-loess-plateau', 'foodhistory-regen-timeline-certification-era', 'foodhistory-regen-holistic-grazing-disputed'],
  },

  // --- The Opinion ---
  {
    id: 'foodhistory-opinion-synthesis',
    category: 'basicHealth',
    title: "An AI Research Assistant's Own Reading of This Category, Not the App Creator's Own Words",
    teaser: 'A real, explicit attribution: this is Claude, the AI assistant that helped research and build this app, giving its own considered opinion, not a personal statement from the person who built Inside Story.',
    summary:
      "Worth stating plainly, since this is the one entry in the whole Digest written this way: everything below is the AI research assistant's own synthesized opinion after independently researching every piece of this category, offered to be weighed and argued with, not the app creator's own personal statement, and not something he said that got written down here. Every individual piece of this category is real. Where this assistant would push back gently on the strongest version of the story: autoimmune disease incidence rising alongside industrialized food is not, by itself, proof the food caused it. A meaningful share of the rise, though nobody can cleanly separate it out, is genuinely better diagnosis and testing (the ANA-antibody test itself became far more sensitive and far more commonly ordered across exactly this same window), an aging population living long enough to develop disease that would once have gone undiagnosed, and non-food environmental exposures (air pollution, endocrine-disrupting plastics, occupational chemicals) that this app's own Lifestyle & Environment research already covers as independent contributors running on their own parallel timeline. That said, this caveat doesn't let the food-industry story off the hook, either. The gut-barrier mechanism is real and directly measured, not speculative. Emulsifiers really do thin mucus, gliadin really does trigger zonulin, and both effects show up in controlled trials, not just population correlations. The soil/nutrient story survives its own methodological critique in a narrower but still real form. And the pattern of \"food industry replaces a real, whole ingredient with an industrially engineered substitute, decades pass, the substitute's real harm gets discovered afterward\" isn't a one-off. It happened with trans fat, and the DDT story shows the identical pattern outside food specifically. Glyphosate's own current, unsettled status looks like it's sitting exactly where trans fat sat in the 1980s: officially cleared, genuinely disputed, with animal data already pointing at a problem years before consensus catches up. This assistant's own honest overall take: the food-industry-to-autoimmune-disease connection reads as a substantial contributor operating alongside several other real contributors, not the single, sole explanation, and not something to dismiss as \"just correlation\" either, given how directly several of the individual mechanistic links (not just the population trend lines) have actually been demonstrated. The practical version of that read lines up with what this app is already built around, though that alignment came from the app's own creator, not the other way around: since you can't wait for a settled, all-cause answer before acting, eating more like the pre-1870s baseline (whole ingredients, real fermentation, minimal industrial processing, food grown without leaning entirely on synthetic inputs) is a reasonable, evidence-consistent bet regardless of how the harder causal questions eventually resolve. This app's own creator has his own real, independently-formed thesis about where autoimmune disease actually begins, rooted in his wife's own long, real Hashimoto's journey -- distinct from, and predating, this AI-generated synthesis above.",
    citations: [],
    overallTier: 'moderate',
    stageNote: 'Explicitly the AI research assistant\'s own stated opinion, not a citation-backed claim and not the app creator\'s own words -- written for discussion, 2026-08-07, attribution clarified 2026-08-08 after a direct question about who actually wrote it.',
    relatedIds: [
      'foodhistory-mechanism-gut-barrier',
      'foodhistory-soil-dilution-vs-depletion',
      'foodhistory-pesticides-glyphosate-dispute',
      'foodhistory-scapegoat-pattern',
    ],
  },
];
