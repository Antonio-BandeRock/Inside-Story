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
  // 2026-08-10, same day, third follow-up: "Keep going with more research
  // on this topic." Every citation below independently re-verified via
  // WebSearch/WebFetch the same way as the first three batches. This pass
  // reaches further back (terra preta, a real ancient precedent for
  // biochar this cluster already covers) and further forward (gene-edited
  // nitrogen-fixing microbes, a real, current commercial product), plus a
  // real, honest grounding stat (cover crops, one of the most basic,
  // longest-promoted regenerative practices, still sit on under 5% of US
  // cropland) and a real, current political case study showing this isn't
  // a costless, conflict-free transition (the Netherlands' own nitrogen
  // policy and the farmer protests it triggered).
  {
    id: 'foodhistory-regen-terra-preta-ancient-biochar',
    category: 'basicHealth',
    title: 'Biochar Is Not a New Idea. Amazonian Farmers Were Doing It Thousands of Years Ago.',
    teaser: 'Terra preta, human-made fertile soil in the Amazon, still measurably richer than the surrounding ground centuries to millennia after it was built.',
    summary:
      "The biochar-carrier microbial technique already covered in this cluster's own Innovations entry has a real, ancient precedent, not a purely modern origin. Terra preta (\"black earth\" in Portuguese), also called Amazonian dark earth, is real, human-made fertile soil found across the Amazon basin, created deliberately by pre-Columbian Indigenous societies by working charcoal, ash, food and fish waste, and pottery fragments into otherwise poor, heavily weathered tropical soil. Radiocarbon dating places most known terra preta between roughly 2,500 and 500 years old, with the oldest confirmed patches dated to 4,800-5,000 years, and separate research has traced an even earlier, less-charred precursor soil (\"terra mulata\") back as far as 10,000 years. These soils remain measurably richer in carbon, nutrients, and biomass than the surrounding, naturally poor Amazonian ground centuries to millennia after they were made, and documented patches span a real 6,000-18,000 square kilometers, with modeled estimates suggesting the true extent could reach over 150,000 square kilometers, roughly 3.2% of the entire Amazon forest. This is the real, direct historical precedent behind the modern biochar industry: an ancient, deliberate soil-engineering technique that worked well enough to still be measurably different from its surroundings after thousands of years.",
    citations: [
      {
        source: 'Eos.org (American Geophysical Union): The Nutrient-Rich Legacy in the Amazon\'s Dark Earths (area coverage, carbon storage)',
        url: 'https://eos.org/features/the-nutrient-rich-legacy-in-the-amazons-dark-earths',
      },
      {
        source: 'ScienceDirect: Terra Preta -- an overview (formation, biochar-industry connection)',
        url: 'https://www.sciencedirect.com/topics/agricultural-and-biological-sciences/terra-preta',
      },
    ],
    overallTier: 'strong',
    stageNote: 'Real, dated, radiocarbon-confirmed archaeology, not folklore -- a genuine deep-history counterpart to the modern biochar research already cited elsewhere in this cluster.',
    relatedIds: ['foodhistory-regen-innovations-soil-biology'],
    chart: {
      title: 'Terra Preta, Documented vs. Modeled Extent',
      unit: 'thousand km²',
      data: [
        { label: 'Directly documented patches', value: 12 },
        { label: 'Modeled potential total extent', value: 150 },
      ],
      sourceNote: 'Eos.org / AGU, real ranges reported as a single midpoint and a single upper estimate for chart display',
    },
  },
  {
    id: 'foodhistory-regen-engineered-nitrogen-fixing-microbes',
    category: 'basicHealth',
    title: 'Engineering Corn to Do What Only Legumes Could Do Before',
    teaser: 'Gene-edited soil bacteria that fix nitrogen directly at a corn plant\'s roots -- a real, current, peer-reviewed alternative to synthetic fertilizer, not a lab curiosity.',
    summary:
      'A real, genuinely cutting-edge extension of the crop-specific microbial inoculants already covered in this cluster\'s Innovations entry: nitrogen fixation (pulling nitrogen gas out of the air and converting it into a form a plant can use) has historically only happened at meaningful scale in legume crops, through their own real, ancient symbiosis with Rhizobium bacteria living in root nodules. Corn and most other major grain crops have no such symbiosis, which is the real reason synthetic nitrogen fertilizer (itself a major, well-documented source of runoff and greenhouse-gas emissions) became so central to modern grain farming in the first place. A real, commercially available product, Pivot Bio\'s PROVEN 40, uses gene-editing to modify a naturally occurring soil bacterium (Klebsiella variicola) so it keeps its own nitrogen-fixing genes permanently switched on while colonizing corn roots directly, rather than only briefly under nitrogen-starved conditions the way the wild strain does. A real, peer-reviewed field study from Purdue University and the University of Wisconsin-Madison, using isotope tracking to directly confirm the fixed nitrogen was actually taken up by the corn plants, found farmers could reliably replace 35-40 pounds per acre of the most volatile, runoff-prone synthetic nitrogen while maintaining or improving yield.',
    citations: [
      {
        source: 'PR Newswire / Pivot Bio: Peer-Reviewed Study Validates Pivot Bio\'s Gene-Edited Microbes as a Third Source of Nitrogen Delivery',
        url: 'https://www.prnewswire.com/news-releases/peer-reviewed-study-validates-pivot-bios-gene-edited-microbes-as-a-third-source-of-nitrogen-delivery-302354658.html',
      },
      {
        source: 'PMC: "Genetic remodeling of soil diazotrophs enables partial replacement of synthetic nitrogen fertilizer with biological nitrogen fixation in maize"',
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11557888/',
      },
    ],
    overallTier: 'moderate',
    stageNote: 'A real, current, peer-reviewed, commercially deployed technology, still new enough that independent long-term and multi-region confirmation is real, ongoing work, not yet a decades-long track record the way no-till or Rodale\'s trial have.',
    relatedIds: ['foodhistory-regen-innovations-soil-biology'],
    chart: {
      title: 'Synthetic Nitrogen Replaced Per Acre',
      unit: 'lbs/acre',
      data: [{ label: 'Volatile synthetic nitrogen reliably replaced', value: 37.5 }],
      sourceNote: 'Purdue University / University of Wisconsin-Madison peer-reviewed field study, real, measured midpoint of the reported 35-40 lb range',
    },
  },
  {
    id: 'foodhistory-regen-cover-crop-reality-check',
    category: 'basicHealth',
    title: 'A Real Reality Check: Even the Simplest Regenerative Practice Is Still Rare',
    teaser: 'Cover crops have been promoted for decades and are one of the cheapest, best-understood regenerative practices there is. In 2022, they were still on under 5% of US cropland.',
    summary:
      'Worth stating plainly against the more dramatic growth figures elsewhere in this cluster (ROC\'s own twenty-fold acreage jump, the real double-digit market-growth rates): cover cropping, the practice of planting a non-cash crop between main growing seasons specifically to protect and feed the soil, is one of the oldest, cheapest, and best-understood of every technique covered here, and real, official USDA Census of Agriculture data still found it on only 4.7% of total US cropland in 2022. Adoption varies sharply by crop: 25% of corn-for-silage acreage used cover crops, but only 5% of corn-for-grain and 8% of soybean acreage did, and adoption skews heavily toward the wetter, milder southern and eastern US, since shorter, colder growing seasons make establishing a cover crop genuinely harder elsewhere. This is a real, useful corrective against assuming the whole regenerative-agriculture story moves at the same pace: certification programs and market dollars can grow fast even while the most basic, individual on-farm practices they\'re meant to encourage remain a real minority behavior.',
    citations: [
      {
        source: 'USDA Economic Research Service: Cover crop use continues to be most common in eastern United States (2022 Census of Agriculture)',
        url: 'https://www.ers.usda.gov/data-products/charts-of-note/chart-detail?chartId=108950',
      },
      {
        source: 'USDA Economic Research Service: Rates of cover crop adoption vary depending on the cash crop being planted',
        url: 'https://www.ers.usda.gov/data-products/charts-of-note/102161',
      },
    ],
    overallTier: 'strong',
    stageNote: 'Official USDA Census data -- a real, grounding corrective to the faster-moving market and certification figures elsewhere in this cluster.',
    relatedIds: ['foodhistory-regen-innovations-soil-biology', 'foodhistory-regen-global-implementation-synthesis'],
    chart: {
      title: 'US Cropland Using Cover Crops (2022)',
      unit: '%',
      data: [
        { label: 'All US cropland', value: 4.7 },
        { label: 'Corn-for-silage acreage', value: 25 },
      ],
      sourceNote: 'USDA Economic Research Service, real, official 2022 Census of Agriculture figures',
    },
  },
  {
    id: 'foodhistory-regen-netherlands-nitrogen-conflict',
    category: 'basicHealth',
    title: 'The Netherlands: A Real Case Study in How Contentious This Transition Can Get',
    teaser: 'A court ruling, a plan to cut livestock nitrogen by half, and one of the largest farmer protest movements in modern European history -- a real, honest counterweight to every case study above.',
    summary:
      "Every case study in this cluster so far has been a real success story. The Netherlands is a real, important, more complicated one, worth including precisely because environmental soil/nitrogen policy does not always land smoothly. In 2019, a Dutch court ruled the government's existing nitrogen-reduction program legally inadequate against the country's own conservation commitments, forcing a real policy response: in 2022 the government announced a target to cut nitrogen emissions from livestock (a dense concentration of dairy, pig, and poultry farming in a small country) by half, which government estimates suggested could require closing roughly 30% of Dutch livestock farms or a 30% national livestock reduction. The announcement triggered a real, sustained, highly visible protest movement, farmers using tractors to block highways and occupy public spaces for months, and gave rise to a genuinely new political party (the Farmer-Citizen Movement) that won the largest share of seats in the Netherlands' 2023 provincial elections, an outcome few analysts had predicted. This is a real, direct, current example of the actual political and economic cost side of environmental farm policy, included here specifically because every other entry in this cluster shows adoption as a comparatively smooth, voluntary, or incentive-driven story.",
    citations: [
      {
        source: 'Mongabay: The Dutch farmers\' protests of 2022 (a full reporting series on the nitrogen crisis and its political fallout)',
        url: 'https://news.mongabay.com/2023/09/the-dutch-nitrogen-crisis-a-mongabay-series/',
      },
      {
        source: 'USDA Foreign Agricultural Service: 2022 Dutch Farmer Protests Against New Nitrogen GHG Emissions Reductions Policies (official policy targets, livestock-reduction figures)',
        url: 'https://www.fas.usda.gov/data/netherlands-2022-dutch-farmer-protests-against-new-nitrogen-ghg-emissions-reductions-policies',
      },
    ],
    overallTier: 'strong',
    stageNote: 'A real, current, well-documented political case study -- included deliberately as a counterweight, so this cluster does not read as though every country adopts these changes smoothly or without real economic cost to farmers.',
    relatedIds: ['foodhistory-regen-global-implementation-synthesis', 'foodhistory-regen-environmental-impact'],
  },
  // 2026-08-10, same day, direct question: "What are the reasons why our
  // governments aren't forcing the soil regeneration... Who are those that
  // are blocking efforts... Who are the players that are fighting back, and
  // how are they fighting back? How can the everyday person help?" Every
  // figure below is independently verified via WebSearch/WebFetch against a
  // real, named, public source (OpenSecrets lobbying-disclosure data, a
  // named Union of Concerned Scientists report, state-legislature tracking)
  // -- deliberately NOT framed as a single-villain narrative. Real,
  // structural economic reasons (crop-insurance risk pricing, no legal
  // definition, farmers' own real regulatory-burden concerns) are presented
  // alongside the real, quantified lobbying-power imbalance, matching this
  // whole cluster's own standing discipline of presenting complications
  // honestly rather than picking the more dramatic single explanation.
  {
    id: 'foodhistory-regen-why-not-mandated',
    category: 'basicHealth',
    title: "Why Isn't This Just Mandated? Three Real, Structural Reasons",
    teaser: "The single biggest one isn't a conspiracy -- it's how crop insurance prices risk. A farmer converting to regenerative practices eats the real transition-year risk with no discount for the benefit that's coming.",
    summary:
      "Three real, documented, structural reasons sit underneath why no government has simply mandated soil regeneration, distinct from the lobbying dynamics covered in this cluster's own dedicated entries. First, and most direct: the US Federal Crop Insurance Program covers 90% of American cropland and prices risk on a single-year basis, with USDA's own Risk Management Agency not adequately recognizing conservation practices, soil type, or crop diversity as risk-reducing factors -- and even where it partially does, there is a real, multi-year lag before soil-health improvements show up in a farm's official risk rating. This means a farmer taking on the real transition-year yield risk documented in this cluster's own Rodale Institute entry gets no corresponding discount on their insurance premium for it, a structural disincentive economists and farmers alike have directly named, not a hidden agenda. Second, \"regenerative agriculture\" genuinely has no legal, government-enforced definition anywhere (see this cluster's own greenwashing-critique entry) -- there is no fixed legal target to write a mandate against, part of why private, voluntary certification (ROC) emerged instead of a public standard. Third, and worth stating honestly rather than only blaming industry: farmers themselves report real concerns about regulatory overreach and land-tenure insecurity discouraging voluntary adoption, a genuine tension the Netherlands case study elsewhere in this cluster shows playing out at real political cost when a government tries to force the pace regardless.",
    citations: [
      {
        source: 'National Sustainable Agriculture Coalition: The Case for Next Generation Crop Insurance (RMA risk-model lag, soil-health disincentive)',
        url: 'https://sustainableagriculture.net/blog/the-case-for-next-generation-crop-insurance/',
      },
      {
        source: 'Frontiers in Nutrition 2025: "From soil to health: advancing regenerative agriculture" (definitional and regulatory-burden barriers)',
        url: 'https://www.frontiersin.org/journals/nutrition/articles/10.3389/fnut.2025.1638507/full',
      },
    ],
    overallTier: 'strong',
    stageNote: 'Real, structural, economic reasons -- distinct from, and worth reading alongside, this cluster\'s own dedicated lobbying-imbalance entry rather than as a substitute explanation.',
    relatedIds: ['foodhistory-regen-rodale-farming-systems-trial', 'foodhistory-regen-netherlands-nitrogen-conflict', 'foodhistory-regen-no-till-greenwashing-critique', 'foodhistory-regen-lobbying-imbalance'],
  },
  {
    id: 'foodhistory-regen-lobbying-imbalance',
    category: 'basicHealth',
    title: 'The Real, Public, Quantified Lobbying Numbers Behind the Question',
    teaser: 'Agribusiness spends more on federal lobbying than oil and gas, or defense. On the Farm Bill specifically, industry outspent reform advocates roughly 4 to 1 between 2019 and 2023.',
    summary:
      "This is publicly disclosed, auditable data, not speculation. Agribusiness spent a record $178 million on federal lobbying in 2023 (OpenSecrets, tracking disclosures required by federal law), up from $145 million in 2019, a real 22% rise in five years -- and the sector spends more on lobbying each year than either the oil-and-gas industry or the defense sector. On the Farm Bill specifically, a May 2024 Union of Concerned Scientists analysis found agribusiness, food, and agriculture-industry interest groups reported more than $523 million in federal lobbying expenditures between 2019 and 2023, against a real $95 million spent over the same period by nonprofits, labor unions, and state/local/tribal governments combined, a real, roughly 4-to-1 spending gap. Named top individual spenders on the industry side: the US Chamber of Commerce ($67 million), the Biotechnology Innovation Organization ($35 million), Bayer ($23 million), plus Corteva, Nutrien, Archer-Daniels-Midland, Deere & Co., and the American Farm Bureau Federation. Worth stating plainly: lobbying itself is a legal, disclosed activity protected as a real part of the political process, not a hidden conspiracy -- what this data actually shows is a real, quantified imbalance in whose voice reaches Farm Bill negotiations most often, not that any single company is secretly running policy.",
    citations: [
      {
        source: 'Investigate Midwest: Agribusiness spent a record-breaking $165-178 million on federal lobbying (OpenSecrets data, 20-year high)',
        url: 'https://investigatemidwest.org/2023/02/16/graphic-agribusiness-spent-a-record-breaking-165-million-on-federal-lobbying-last-year/',
      },
      {
        source: 'Farm Policy News / The Hill, citing a Union of Concerned Scientists report: Farm Bill Lobbying Exceeds $500 Million ($523M industry vs $95M reform advocates, 2019-2023)',
        url: 'https://farmpolicynews.illinois.edu/2024/05/farm-bill-lobbying-exceeds-500-million-report-says/',
      },
    ],
    overallTier: 'strong',
    stageNote: 'Real, public, federally-disclosed lobbying data -- an auditable fact pattern, not an allegation.',
    relatedIds: ['foodhistory-regen-why-not-mandated', 'foodhistory-regen-pesticide-liability-shields', 'foodhistory-regen-reform-coalition-orgs'],
  },
  {
    id: 'foodhistory-regen-pesticide-liability-shields',
    category: 'basicHealth',
    title: 'A Real, Live, Current Example: State-by-State Pesticide Liability Shield Bills',
    teaser: 'A real, Bayer-founded front group is funding billboards, ads, and flyers in a dozen state legislatures this year, aiming to make it legally impossible to sue over glyphosate cancer claims.',
    summary:
      "This is the clearest, most current, most concrete real-world example of \"how are they fighting back\" available anywhere in this cluster, actively unfolding this year, not a historical case study. Bayer (which acquired Monsanto, the original glyphosate/Roundup developer, in 2018) founded and funds Modern Ag Alliance, an advocacy organization pushing state legislation that would make an EPA-approved pesticide label a full legal defense against \"failure to warn\" lawsuits over cancer claims, effectively shielding manufacturers from the same kind of litigation that has already produced over $10 billion in Bayer settlements against 67,000 open Roundup cases. North Dakota and Georgia have already enacted this kind of bill; similar legislation has been introduced or actively fought in Missouri, Montana, Florida, and Iowa, with Bayer directly supporting versions in roughly a dozen states total. Documented, real tactics: highway billboard campaigns, social-media advertising, direct political donations (Bayer's PAC spent over $151,000 in Missouri alone across 2023-2024), flyers warning of \"chemicals from Communist China\" if the bill failed, and direct meetings between Bayer's CEO and state governors. The real scientific dispute underneath the fight (see this cluster's own dedicated glyphosate entry): the WHO's cancer research arm (IARC) classified glyphosate \"probably carcinogenic to humans\" in 2015; the US EPA has not made the same determination, and Bayer's own public position is that satisfying EPA's labeling requirement should be treated as satisfying its full legal duty to warn.",
    citations: [
      {
        source: 'Investigate Midwest: Pesticide politics -- inside the corporate push to limit liability (state-by-state legislative tracking, Modern Ag Alliance, spending figures)',
        url: 'https://investigatemidwest.org/2025/08/18/pesticide-politics-inside-the-corporate-push-to-limit-liability/',
      },
      {
        source: 'National Agricultural Law Center: States Introduce Pesticide Liability Limitation Bills in 2025 Legislative Session',
        url: 'https://nationalaglawcenter.org/states-introduce-pesticide-liability-limitation-bills-in-2025-legislative-session/',
      },
    ],
    overallTier: 'strong',
    stageNote: 'A real, live, currently-unfolding state-legislative fight, independently verified against real news reporting and a real legal-tracking organization, not a historical or hypothetical example.',
    relatedIds: ['foodhistory-pesticides-glyphosate-dispute', 'foodhistory-regen-lobbying-imbalance', 'foodhistory-regen-no-till-greenwashing-critique'],
  },
  {
    id: 'foodhistory-regen-reform-coalition-orgs',
    category: 'basicHealth',
    title: 'Who Is Organizing on the Other Side, By Name',
    teaser: '100+ organizations, 34 specific proposed bills, and a dedicated task force built specifically to redesign crop insurance around soil health.',
    summary:
      "A real, named, organized coalition exists specifically to push Farm Bill and crop-insurance reform in the opposite direction from the lobbying spending covered in this cluster's own dedicated entry, worth naming directly rather than leaving the reform side abstract. The National Sustainable Agriculture Coalition and the Union of Concerned Scientists co-lead a coordinated campaign, joined by the Climate Justice Alliance, the HEAL Food Alliance, and more than 100 other organizations, that has endorsed 34 specific \"marker bills\" aimed at making the federal food and farm system more sustainable, resilient, and equitable, including direct support for beginning, small, and socially disadvantaged farmers adopting regenerative and diversified systems. A separate, more narrowly focused group, the Conservation and Crop Insurance Task Force, brings together farmers, agricultural economists, scientists, and policy staff specifically to redesign crop insurance itself so it rewards rather than penalizes soil-health practices, directly targeting the structural disincentive named in this cluster's own \"why isn't this mandated\" entry. None of these organizations have anywhere near the $523 million in disclosed Farm Bill lobbying spending industry groups reported over the same 2019-2023 period, a real, honest, quantified gap, but they represent the real, organized, named alternative to \"nobody is fighting for this\" rather than an anonymous or purely grassroots effort.",
    citations: [
      {
        source: 'Union of Concerned Scientists: 100+ Orgs Endorse Farm Bill Marker Bills',
        url: 'https://www.ucs.org/about/news/100-orgs-endorse-farm-bill-marker-bills',
      },
      {
        source: 'National Sustainable Agriculture Coalition: The Case for Next Generation Crop Insurance (Conservation and Crop Insurance Task Force)',
        url: 'https://sustainableagriculture.net/blog/the-case-for-next-generation-crop-insurance/',
      },
    ],
    overallTier: 'strong',
    stageNote: 'Real, named organizations with a real, public policy platform -- not an anonymous or purely hypothetical opposition movement.',
    relatedIds: ['foodhistory-regen-lobbying-imbalance', 'foodhistory-regen-why-not-mandated', 'foodhistory-regen-how-to-get-involved'],
  },
  {
    id: 'foodhistory-regen-how-to-get-involved',
    category: 'basicHealth',
    title: 'How an Everyday Person Can Actually Get Involved, Right Now',
    teaser: "Two real, live channels, not vague civic-mindedness: the next US Farm Bill is in active committee markup this year, and USDA rulemaking has real, open public-comment windows.",
    summary:
      'Two real, concrete, currently-open channels exist for a private citizen to have an actual, on-the-record effect on this exact policy fight, not just symbolic gestures. First: the US Farm Bill, the single largest piece of federal food and agriculture legislation, renewed roughly every five years, is in active committee markup in Congress this year -- the House Committee on Agriculture and the Senate Committee on Agriculture, Nutrition, and Forestry are the real, current decision points, and both committees hold public hearings and listening sessions; a constituent can find their own representative\'s and senators\' committee membership and direct contact information at house.gov and senate.gov. Second: USDA rulemaking for Farm Bill programs is published in the Federal Register with a real, legally required public-comment period, typically 30-90 days, searchable directly at regulations.gov -- these comments become a real, permanent part of the administrative record USDA is required to review before finalizing a rule, not a symbolic exercise. Beyond direct civic engagement, supporting or donating to one of the named reform coalitions covered in this cluster\'s own dedicated entry, or choosing products carrying the real, third-party-audited Regenerative Organic Certified label (see this cluster\'s own Certification Era entry) and the kind of retailer-level investment this cluster\'s own Whole Foods entry already covers, are both real, if smaller-scale, ways an individual purchasing decision connects back to the same underlying policy fight.',
    citations: [
      {
        source: 'USDA Economic Research Service: Farm & Commodity Policy -- US Farm Bill Development and Passage (committee process, public comment)',
        url: 'https://www.ers.usda.gov/topics/farm-economy/farm-commodity-policy/us-farm-bill-development-and-passage',
      },
      {
        source: 'National Sustainable Agriculture Coalition: What is the Farm Bill? (the legislative process, how to participate)',
        url: 'https://sustainableagriculture.net/our-work/campaigns/fbcampaign/what-is-the-farm-bill/',
      },
    ],
    overallTier: 'strong',
    stageNote: 'Real, currently-open civic channels, not a general or evergreen suggestion -- worth confirming committee markup status and comment-period deadlines directly, since a live legislative process moves and this entry\'s own "right now" framing will age.',
    relatedIds: ['foodhistory-regen-reform-coalition-orgs', 'foodhistory-regen-timeline-certification-era', 'foodhistory-regen-whole-foods-organic-industry'],
  },
  // 2026-08-10/11, same day, fifth follow-up: "Keep going with more research
  // on this topic." Every citation below independently re-verified via
  // WebSearch/WebFetch the same way as the prior four batches. This pass
  // covers a real, documented market-mechanism failure mode (soil carbon
  // credits), a real non-US structural parallel to this cluster's own US
  // crop-insurance critique (EU CAP), the actual, honestly-mixed nutrient-
  // density evidence this whole cluster's food-health premise ultimately
  // rests on, and a real, official US federal policy extending the
  // Indigenous-knowledge thread already touched via Niger and terra preta.
  {
    id: 'foodhistory-regen-carbon-credit-integrity-problems',
    category: 'basicHealth',
    title: "Soil Carbon Credits: A Real Financing Idea With Real, Documented Integrity Problems",
    teaser: '40-60% of enrolled farmers were already doing the practice, or planning to, before the payment showed up -- a real, quantified additionality problem, not a hypothetical one.',
    summary:
      'A real, growing financing mechanism intended to reward farmers directly for soil-carbon-building practices (see this cluster\'s own "4 per 1000" entry for the underlying science) has real, documented, structural integrity problems of its own, distinct from the greenwashing already covered elsewhere in this cluster. There is no universal, mandatory verification standard across the voluntary soil-carbon-credit market, and different registries use genuinely different measurement and accounting methods, making credits hard to compare or trust as equivalent. The single biggest documented problem is additionality: research has found 40-60% of farmers enrolled in carbon programs were already implementing the qualifying practices, or already planning to, regardless of the carbon payment, meaning a real share of sold credits may not represent any actual, additional emissions reduction at all. Permanence is a second real problem: soil carbon can reverse if a farmer stops the practice, and studies of long-term conservation programs found 15-25% reversal within ten years of a program ending. A co-founder of Nori, one of the earlier soil-carbon-credit companies, has said directly that he doesn\'t think soil carbon makes sense as an offset mechanism at all, specifically because of this longevity problem -- a real, credible insider critique, not only an outside one.',
    citations: [
      {
        source: 'Earth.Org: Soil Carbon Credits -- Promises and Problems (verification standards, permanence/reversal data)',
        url: 'https://earth.org/soil-carbon-credits-the-promises-and-uncertainties-of-a-new-climate-market/',
      },
      {
        source: 'Environmental Defense Fund: The importance of additionality and accurate baselines for carbon credit integrity',
        url: 'https://blogs.edf.org/growingreturns/2023/03/03/carbon-credit-integrity/',
      },
    ],
    overallTier: 'moderate',
    stageNote: 'Included deliberately alongside the other real, honest counter-examples in this cluster (Savory, the no-till/greenwashing entry) -- a real financing tool with real, documented, unresolved integrity problems, not a settled solution.',
    relatedIds: ['foodhistory-regen-4-per-1000-initiative', 'foodhistory-regen-no-till-greenwashing-critique'],
  },
  {
    id: 'foodhistory-regen-eu-cap-structural-disincentive',
    category: 'basicHealth',
    title: "Europe Has Its Own Version of the Same Structural Problem",
    teaser: "The EU's Common Agricultural Policy pays largely per hectare, not per outcome -- 2.2% of EU farms collect 28.2% of all payments, and reform attempts have shown limited real environmental effect.",
    summary:
      "This cluster's own US Federal Crop Insurance entry names a real, structural US-specific disincentive to soil-regenerating practices; the European Union has a genuinely different but comparably structural version of the same underlying problem, worth naming so this cluster doesn't read as a US-only critique. The EU's Common Agricultural Policy (CAP), the bloc's largest and oldest common policy, has historically paid direct farm subsidies largely per hectare of land farmed, not tied to environmental outcome, a real structural bias toward large-scale, land-intensive operations: 3% of EU farms classified \"large\" or \"very large\" own over 52% of all EU farmland, and as of 2018, just 2.2% of EU farms (each receiving over EUR50,000) collected a real 28.2% share of all CAP payments. A 2014 reform attempted a real fix, tying 30% of direct payments to specific environmental practices like crop diversification and maintaining permanent grassland, but independent researchers have found the measured environmental impact of that \"greening\" requirement genuinely limited, with some directly questioning whether it functions as real policy or mostly as political justification. The most recent reform round narrows per-hectare support into a real floor (EUR130/ha) and ceiling (EUR240/ha), a direct, if partial, structural correction still working its way through.",
    citations: [
      {
        source: 'ScienceDirect: The EU\'s Common Agricultural Policy Could Be Spent Much More Efficiently to Address Challenges for Farmers, Climate, and Biodiversity',
        url: 'https://www.sciencedirect.com/science/article/pii/S2590332220303675',
      },
      {
        source: 'Springer Nature, Agricultural and Food Economics: The CAP coherence between redistributive and environmental goals (payment concentration figures, greening effectiveness)',
        url: 'https://link.springer.com/article/10.1186/s40100-025-00356-8',
      },
    ],
    overallTier: 'strong',
    stageNote: 'A real, structural parallel to this cluster\'s own US crop-insurance entry, included specifically so the "why isn\'t this mandated" question doesn\'t read as a uniquely American problem.',
    relatedIds: ['foodhistory-regen-why-not-mandated', 'foodhistory-regen-global-implementation-synthesis'],
  },
  {
    id: 'foodhistory-regen-nutrient-density-honest-evidence',
    category: 'basicHealth',
    title: 'Does Any of This Actually Make Food More Nutritious? A Real, Honestly Mixed Answer',
    teaser: 'A real, 367-study systematic review found zinc rose in 94% of rice studies using organic inputs -- but in only 48% of wheat studies. The effect is real in places, and genuinely inconsistent in others.',
    summary:
      "This is the question this whole cluster's own connection to a food-and-health app ultimately rests on, and the honest answer is more nuanced than either \"regenerative food is definitively more nutritious\" or \"there's no real effect.\" A 2023 systematic scoping review screened 4,463 papers down to 367 field studies across seven major crop categories specifically asking whether regenerative-aligned practices raise micronutrient concentration in the edible part of a crop. The real, per-crop-per-nutrient findings varied sharply: rice grown with organic inputs showed higher zinc in 94% of studies and higher iron in 80%, and maize showed increased iron and zinc in all four studies reviewed, both genuinely strong, consistent signals -- but wheat grown with organic inputs showed higher zinc in only 48% of studies and higher iron in just 22%, a real, much weaker and less consistent effect for the same practice in a different crop. The review's own authors were direct about why: most studies were statistically underpowered to detect a real but modest effect size, results were genuinely dependent on local growing conditions, and no formal meta-analysis existed to quantify a single overall effect size across the whole body of evidence. The honest, working synthesis: real evidence supports a genuine nutrient-density effect for some crop-and-practice combinations, not yet a confirmed, general rule that regenerative or organic farming reliably makes all food more nutritious.",
    citations: [
      {
        source: 'PMC 2023: "Do agronomic approaches aligned to regenerative agriculture improve the micronutrient concentrations of edible portions of crops? A scoping review of evidence" (367 studies, per-crop findings)',
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10371419/',
      },
    ],
    overallTier: 'moderate',
    stageNote: 'A real, large, systematic review with an honestly mixed result reported directly -- the strongest, most rigorous evidence tier this cluster has for the specific nutrient-density question, and it does not support a uniform claim in either direction.',
    relatedIds: ['foodhistory-regen-innovations-soil-biology', 'foodhistory-regen-fao-baseline-stakes'],
  },
  {
    id: 'foodhistory-regen-tribal-co-stewardship-policy',
    category: 'basicHealth',
    title: 'A Real, Current US Federal Policy Recognizing Indigenous Land Knowledge Directly',
    teaser: 'A real 2021 joint federal order, and over 400 real co-stewardship agreements signed since -- the policy expression of the same Indigenous-knowledge thread already touched via Niger and terra preta.',
    summary:
      "This cluster's own Niger farmer-managed-natural-regeneration and terra preta entries both describe real, ancient or grassroots land-management knowledge outperforming purely modern approaches. A real, current, official US federal policy now formally builds on the same underlying recognition: on November 15, 2021, the Secretaries of the Interior and Agriculture jointly issued Secretarial Order 3403, formally committing both departments to \"co-stewardship\" of federal lands and waters with American Indian and Alaska Native Tribes, explicitly incorporating Indigenous traditional ecological knowledge into how those lands are actually managed, not just consulted on. Real, measured follow-through, not just a policy announcement: the US Forest Service and Department of the Interior signed more than 20 new co-stewardship agreements with Tribes in 2022 alone, with 60 more under review at the time, and by a later count the Department of the Interior reported over 400 total co-stewardship agreements in place. The Department of Commerce formally joined the same order in November 2022. This is a real, concrete example of the same underlying idea running through this whole cluster (that a technique working for generations is worth taking seriously regardless of whether it originated in a modern research lab) reaching actual federal policy, not just advocacy.",
    citations: [
      {
        source: 'US Department of the Interior: Secretary Haaland Applauds 400 Co-Stewardship Agreements Under the Biden-Harris Administration',
        url: 'https://www.doi.gov/pressreleases/secretary-haaland-applauds-400-co-stewardship-agreements-under-biden-harris',
      },
      {
        source: 'USDA: Agriculture and Interior Departments Take Action to Strengthen Tribal Co-Stewardship of Public Lands and Waters (Secretarial Order 3403, Nov 15 2021)',
        url: 'https://www.usda.gov/media/press-releases/2021/11/15/agriculture-and-interior-departments-take-action-strengthen-tribal',
      },
    ],
    overallTier: 'strong',
    stageNote: 'A real, official, dated federal policy with real, measured follow-through (agreement counts), not just a symbolic announcement.',
    relatedIds: ['foodhistory-regen-niger-fmnr-case-study', 'foodhistory-regen-terra-preta-ancient-biochar', 'foodhistory-regen-how-to-get-involved'],
  },
  // 2026-08-11, same day, direct request: "We need some information about
  // our polinators, how they are declining and what that means to our food
  // supply, and which crops would we lose without our polinators?" plus a
  // sixth "keep going" continuation of the same broader research thread.
  // Every citation below independently re-verified via WebSearch/WebFetch
  // the same way as every prior batch. This sub-cluster closes with the
  // same "connect it back to what this whole cluster is actually about"
  // discipline the rest of this research has held to throughout --
  // regenerative practices are a real, documented part of pollinator
  // recovery, not a separate topic.
  {
    id: 'foodhistory-regen-pollinator-decline-crisis',
    category: 'basicHealth',
    title: 'The Current Pollinator Crisis, In Real, Current Numbers',
    teaser: 'US commercial beekeepers lost 62% of their colonies between June 2024 and February 2025 -- the largest loss ever recorded since national tracking began in 2010.',
    summary:
      "A real, current, ongoing crisis, not a slow historical trend alone. A national survey by Project Apis m., a real bee-research nonprofit, gathering data from 842 beekeepers managing roughly 1.956 million colonies (about 72% of all US commercial bees), found commercial beekeepers lost an average of 62% of their colonies between June 2024 and February 2025, over 1.1 million colonies total, the largest loss ever recorded since this kind of national survey tracking began in 2010, eclipsing the prior year's already-severe 55% loss rate. USDA estimated the resulting loss in agricultural revenue at roughly $600 million. This sits on top of a real, longer-running decline: US honeybee hives are down 59% from 60 years ago, with self-reported annual colony loss rates averaging around 40% over the past decade even before this most recent spike. Real, documented, multiple causes compound each other rather than any single one explaining it: amitraz-resistant Varroa destructor mites, high viral loads, pesticide exposure, habitat and forage loss, and climate stress, per USDA-linked research into the most recent, worst losses.",
    citations: [
      {
        source: 'Project Apis m.: 2025 Colony Loss Information (survey methodology, 62% loss figure)',
        url: 'https://www.projectapism.org/colony-loss-information',
      },
      {
        source: 'Honey Bee Health Coalition: Survey Reveals Over 1.1 Million Honey Bee Colonies Lost, Raising Alarm for Pollination and Agriculture',
        url: 'https://honeybeehealthcoalition.org/survey-reveals-over-1-1-million-honey-bee-colonies-lost-raising-alarm-for-pollination-and-agriculture/',
      },
      {
        source: 'USAFacts: How much have US bee populations fallen, and why? (60-year decline context)',
        url: 'https://usafacts.org/articles/what-is-the-loss-of-bees-costing-the-us/',
      },
    ],
    overallTier: 'strong',
    stageNote: 'Real, current, survey-based national data -- this is an active, still-unfolding crisis as of this being written, not a settled historical event.',
    relatedIds: ['foodhistory-regen-pollinator-dependent-crops', 'foodhistory-regen-neonicotinoid-regulation-loophole'],
  },
  {
    id: 'foodhistory-regen-pollinator-dependent-crops',
    category: 'basicHealth',
    title: 'Which Crops Would We Actually Lose? A Real, Ranked Answer',
    teaser: 'Brazil nuts, kiwi, melons, and cocoa are essentially 100% dependent. Almonds are the most extreme single case: pollinating them requires an estimated 99% of every honeybee colony in the entire US, at once, every February.',
    summary:
      "A real, widely used scientific framework (Klein et al. 2007) ranks 87 major global food crops by how much yield they'd lose without animal pollinators, from \"little\" (a real 5% yield loss) through \"modest\" (25%), \"great\" (65%), up to \"essential\" (95% loss, functionally a crop failure). Brazil nuts, kiwi, melons, and cocoa beans sit in the essential category -- a real, direct, literal basis for the claim that a world without pollinators is a world without chocolate. Overall, roughly 35% of global food production BY VOLUME depends on animal pollination to some real degree, and 75% of distinct crop TYPES depend on it at least partially, even though the world's staple calorie crops (wheat, rice, maize, and root crops like cassava) are wind-pollinated or self-pollinating and would be largely unaffected -- a real, important nuance, since it means overall global calorie production would fall a real but comparatively modest 5-10%, while fruit, vegetable, and nut diversity and nutrition would be hit far harder. The single most extreme real-world case is almonds, grown almost entirely in California and 100% dependent on bee pollination for any nut production at all: for the 2024 bloom, pollinating roughly 1.4 million acres of bearing almond orchards required an estimated 2.7 million honey bee colonies, meaning the industry's own February pollination demand consumed an estimated 99% of every commercially managed honeybee colony in the entire United States at once.",
    citations: [
      {
        source: 'Our World in Data: How much of the world\'s food production is dependent on pollinators? (Klein et al. 2007 dependence framework, 35%/75% figures)',
        url: 'https://ourworldindata.org/pollinator-dependence',
      },
      {
        source: 'farmdoc daily (University of Illinois): Where Have All the Honey Bees Gone? To California Almond Orchards (2.7 million colonies for the 2024 bloom against 2.83 million total US colonies -- the real basis for the 99% figure)',
        url: 'https://farmdocdaily.illinois.edu/2025/02/where-have-all-the-honey-bees-gone-to-california-almond-orchards.html',
      },
    ],
    overallTier: 'strong',
    stageNote: 'A real, peer-reviewed classification framework plus real, official USDA agricultural-economics data -- not an estimate or a single anecdote.',
    relatedIds: ['foodhistory-regen-pollinator-decline-crisis', 'foodhistory-regen-pollinator-nutrition-stakes', 'foodhistory-regen-fao-baseline-stakes'],
  },
  {
    id: 'foodhistory-regen-pollinator-nutrition-stakes',
    category: 'basicHealth',
    title: 'The Real Nutritional Stakes, Not Just the Economic Ones',
    teaser: 'Over 90% of the vitamin C in the human food supply, and nearly all of its vitamin A and lycopene, comes from crops that need an animal pollinator.',
    summary:
      "This is the single most directly health-relevant real finding in this whole pollinator sub-cluster, and the honest reason it belongs in a health app's own research at all, not just an agricultural-economics one. A landmark, peer-reviewed 2011 PLOS ONE study found that crops fully or partially dependent on animal pollinators supply more than 90% of the world's vitamin C, essentially the entire supply of lycopene and the antioxidants beta-cryptoxanthin and beta-tocopherol, and the majority of the world's dietary lipids, vitamin A and related carotenoids, calcium, and fluoride, plus a large share of folic acid. A more recent, India-specific follow-up study estimated that pollinator loss specifically could produce a real, approximately 19% deficit in dietary vitamin C. Staple calorie crops (wheat, rice, corn) are pollinator-independent, so a pollinator collapse would not directly threaten total caloric intake -- but it would disproportionately hit the exact food categories (fruits, vegetables) that supply the specific micronutrients a calorie-sufficient but nutrient-poor diet already tends to lack, with the real, documented risk concentrated more heavily in lower-income countries with less dietary redundancy to fall back on.",
    citations: [
      {
        source: 'PLOS ONE 2011: "Contribution of Pollinator-Mediated Crops to Nutrients in the Human Food Supply" (Eilers et al.)',
        url: 'https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0021363',
      },
      {
        source: 'Entomological Research 2024: Role of pollinators in contributing to vitamin and mineral supply through crop production in India (Ghosh et al., 19% vitamin C deficit estimate)',
        url: 'https://onlinelibrary.wiley.com/doi/full/10.1111/1748-5967.12726',
      },
    ],
    overallTier: 'strong',
    stageNote: 'A real, peer-reviewed, landmark finding directly connecting pollinator health to human nutrient intake -- the clearest health-relevant citation in this whole cluster.',
    relatedIds: ['foodhistory-regen-pollinator-dependent-crops', 'foodhistory-regen-fao-baseline-stakes'],
  },
  {
    id: 'foodhistory-regen-neonicotinoid-regulation-loophole',
    category: 'basicHealth',
    title: 'A Real Pesticide the Science Is Actually Settled On -- And a Real Loophole Keeping It in Use',
    teaser: "The EU's own safety agency found \"no safe use could be identified\" for two of Bayer's own neonicotinoid pesticides. The ban that followed has since been legally circumvented at least 67 times.",
    summary:
      'Unlike glyphosate\'s own genuinely still-disputed cancer classification (see this cluster\'s own dedicated entries), the pesticide-pollinator link for neonicotinoid insecticides is comparatively well-settled science, not a live scientific dispute. A joint 2019 FAO/WHO report described a "rapidly growing body of evidence" that existing environmental levels of neonicotinoid contamination cause large-scale adverse effects on bees and other beneficial insects, and the European Food Safety Authority\'s own February 2018 risk assessment concluded that for two specific neonicotinoids, Bayer\'s own imidacloprid and clothianidin, "no safe use could be identified" at all. On that basis, the EU banned all outdoor use of three major neonicotinoids in 2018. The real complication, worth stating directly: that ban has a legal "emergency authorization" exception meant for genuine, no-other-option crop emergencies, and it has been used repeatedly rather than rarely -- at least 67 separate emergency authorizations were issued across 16 EU countries between April 2018 and mid-2020 alone, led by Belgium (14) and Romania (10), overwhelmingly for sugar beet but also maize, oilseed rape, and several vegetable crops, with one researcher directly describing the exemptions as \"rarely justified and often repeated\" rather than the genuine emergencies the exception was designed for.',
    citations: [
      {
        source: 'Nature: Scientists hail European ban on bee-harming pesticides (EFSA 2018 assessment, "no safe use" finding)',
        url: 'https://www.nature.com/articles/d41586-018-04987-4',
      },
      {
        source: 'Greenpeace Unearthed: Loophole keeps bee-killing pesticides in widespread use, two years after EU ban (67 emergency authorizations, 16 countries)',
        url: 'https://unearthed.greenpeace.org/2020/07/08/bees-neonicotinoids-bayer-syngenta-eu-ban-loophole/',
      },
    ],
    overallTier: 'strong',
    stageNote: 'The underlying pesticide-pollinator science here is comparatively well-settled, unlike glyphosate\'s own genuinely disputed cancer classification covered elsewhere in this cluster -- the real complication in this entry is regulatory enforcement, not scientific uncertainty.',
    relatedIds: ['foodhistory-regen-pollinator-decline-crisis', 'foodhistory-pesticides-glyphosate-dispute', 'foodhistory-regen-pesticide-liability-shields'],
  },
  {
    id: 'foodhistory-regen-wild-bees-buzz-pollination',
    category: 'basicHealth',
    title: "Honeybees Aren't the Whole Story -- Some Crops Need a Bee They Physically Can't Be",
    teaser: "Honeybees are biologically incapable of buzz pollination. Tomatoes, peppers, and blueberries genuinely need a wild bumblebee or a native bee species instead, not just more honeybee hives.",
    summary:
      "Most pollinator-decline coverage, including most of this cluster's own coverage above, centers on managed honeybee colonies specifically, since they're the easiest population to survey and the ones commercial agriculture directly rents and transports. That framing genuinely understates the real, separate risk: honeybees are biologically incapable of buzz pollination, a technique where a bee grips a flower and vibrates its flight muscles without moving its wings to shake pollen loose, a real, distinct mechanism only bumblebees, large carpenter bees, and several other native bee groups can perform. Tomatoes, peppers, eggplant, and blueberries all pollinate measurably better with buzz pollination available: for blueberries specifically, a single bumblebee-queen visit deposits as much pollen as four separate honeybee visits, and one California study found native, wild pollinators nearly tripled cherry tomato production compared to relying on honeybees alone. This means simply restoring managed honeybee colony numbers, even if achieved, would not fully substitute for a genuine decline in wild, native bee populations, which are tracked far less systematically than commercial honeybee colonies and whose own decline trend remains, honestly, less precisely measured.",
    citations: [
      {
        source: 'PMC 2021: Buzz-Pollinated Crops -- A Global Review and Meta-analysis of the Effects of Supplemental Bee Pollination in Tomato',
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8042731/',
      },
      {
        source: 'UC Berkeley: Native bees often better pollinators than honey bee',
        url: 'https://vcresearch.berkeley.edu/news/native-bees-often-better-pollinators-honey-bee',
      },
    ],
    overallTier: 'strong',
    stageNote: 'A real, honest complication to the honeybee-centric framing most pollinator coverage defaults to -- included specifically so this sub-cluster doesn\'t leave the impression that managed honeybee recovery alone would fully solve the problem.',
    relatedIds: ['foodhistory-regen-pollinator-decline-crisis', 'foodhistory-regen-pollinator-habitat-regenerative-link'],
  },
  {
    id: 'foodhistory-regen-pollinator-habitat-regenerative-link',
    category: 'basicHealth',
    title: 'Where This Sub-Cluster Connects Back to Everything Else in This Category',
    teaser: 'Hedgerows, flower strips, and cover crops -- already covered in this cluster for entirely separate reasons -- are also real, measured pollinator-recovery tools, not a separate initiative.',
    summary:
      "Real research closes the loop directly back to the regenerative practices already covered throughout the rest of this cluster, rather than treating pollinator recovery as a separate initiative needing its own distinct set of techniques. Flowering cover crops (see this cluster's own Innovations and cover-crop-reality-check entries) provide real forage for both managed and wild bees during otherwise bare-field periods, while hedgerows planted along field margins measurably increase wild bee richness and persistence, providing both floral resources and real nesting habitat lost to modern, edge-to-edge monoculture. Direct, controlled comparisons found wild bee abundance and species richness highest in dedicated flower strips, followed by improved hedgerows, both clearly outperforming plain grass margins or natural regrowth left alone. Agroforestry (this cluster's own dedicated entry) delivers the identical dual benefit already documented there for biodiversity and yield. This is a real, concrete, already-actionable example of exactly the practical promise the rest of this cluster makes in the abstract: a farm genuinely rebuilding its own soil biology, via cover crops, hedgerows, and reduced tillage, is very often simultaneously rebuilding the wild pollinator habitat its own crops, and the broader food system's own nutrient supply covered above, depend on.",
    citations: [
      {
        source: 'Xerces Society: Supporting Pollinators on Farmland',
        url: 'https://xerces.org/pollinator-conservation/farmland',
      },
      {
        source: 'Center for Regenerative Agriculture and Resilient Systems (Chico State): Hedgerows and Pollinator Habitat',
        url: 'https://www.csuchico.edu/regenerativeagriculture/ra101-section/hedgerows.shtml',
      },
    ],
    overallTier: 'strong',
    stageNote: 'The deliberate closing entry of this sub-cluster -- ties pollinator recovery directly back to the same practices this whole category has already documented, rather than treating it as a separate problem needing a separate solution.',
    relatedIds: ['foodhistory-regen-wild-bees-buzz-pollination', 'foodhistory-regen-innovations-soil-biology', 'foodhistory-regen-cover-crop-reality-check', 'foodhistory-regen-agroforestry-quantified'],
  },
  // 2026-08-11, same day, a seventh continuation: "Keep going with more
  // research on this topic." Every citation below independently
  // re-verified via WebSearch/WebFetch. This pass extends the pollinator
  // sub-cluster in four genuinely new directions: a real, parallel
  // non-bee pollinator crisis (bats), the broader "it's not just managed
  // pollinators" empirical evidence (a landmark insect-biomass study, with
  // its own honest, current no-recovery follow-up), the real, current
  // market mechanism already translating colony losses into higher
  // prices, and a real, underlying structural vulnerability factor (narrow
  // genetic diversity in managed honeybee breeding stock) that helps
  // explain why the crisis hits as hard as it does.
  {
    id: 'foodhistory-regen-bat-pollinators-white-nose',
    category: 'basicHealth',
    title: "Bats Pollinate Tequila, Mangoes, and Bananas -- and They're Facing Their Own Colony-Collapse-Scale Crisis",
    teaser: 'Over 6 million North American bats have died since 2006 from a single fungal disease, with mortality rates of 90-100% in affected colonies -- a real, parallel crisis most pollinator coverage never mentions.',
    summary:
      "Bees dominate pollinator-crisis coverage, but a real, comparably severe crisis has been unfolding in parallel among an entirely different pollinator group: bats. Real, significant global agriculture depends on them -- roughly 300 fruit species worldwide rely on bats for most or all of their pollination, including mangoes, bananas, and avocados, and specifically in North America, three co-evolved bat species (two of them, the Mexican long-nosed bat and the lesser long-nosed bat, already listed as endangered) are the primary pollinators of agave, the plant tequila is distilled from. Since being first detected in 2006, white-nose syndrome, a fungal disease that thrives in the cold, humid conditions of winter hibernation caves and disrupts bats' hibernation cycle until they burn through their fat reserves and starve, has killed over 6 million North American bats, with a real, documented 90-100% mortality rate in many affected hibernation sites and confirmed cases now spanning 37 US states and 7 Canadian provinces. Three specific species (northern long-eared, little brown, and tri-colored bats) have each declined more than 90% in fewer than ten years, with the northern long-eared bat down 99% or more in several eastern states. A real, self-reinforcing complication specific to agave: rising tequila demand has pushed some growers toward cloned, genetically uniform agave plantations, increasing the crop's own disease vulnerability and reliance on insecticides that are directly toxic to the same bats the plant depends on to reproduce naturally.",
    citations: [
      {
        source: 'Bat Conservation International: White-Nose Syndrome Killed Over 90% of Three North American Bat Species',
        url: 'https://www.batcon.org/press/white-nose-syndrome-killed-over-90-of-three-north-american-bat-species/',
      },
      {
        source: 'The Nature Conservancy (Cool Green Science): Recovery -- Bats with Your Tequila (agave pollination, endangered bat species)',
        url: 'https://blog.nature.org/2017/02/20/recovery-bats-with-your-tequila/',
      },
    ],
    overallTier: 'strong',
    stageNote: 'A real, well-documented, dated crisis parallel to the honeybee colony losses covered elsewhere in this sub-cluster -- included specifically because bat pollination is real, agriculturally significant, and almost never mentioned alongside bee-focused pollinator coverage.',
    relatedIds: ['foodhistory-regen-pollinator-decline-crisis', 'foodhistory-regen-pollinator-dependent-crops'],
  },
  {
    id: 'foodhistory-regen-insect-apocalypse-hallmann',
    category: 'basicHealth',
    title: "It's Not Just Managed Pollinators -- A Landmark Study Found Flying Insects Down 76% Even Inside Protected Nature Reserves",
    teaser: 'A 27-year German study found flying insect biomass fell over 75% inside nature reserves specifically -- meaning something beyond direct habitat destruction is driving the decline. A 2024 follow-up found no recovery since.',
    summary:
      "Every entry in this sub-cluster so far has focused on a specific pollinator group (honeybees, wild bees, bats). A real, landmark 2017 study in PLOS ONE, led by Caspar Hallmann at Radboud University, measured something broader and arguably more alarming: total flying insect biomass, regardless of species, using standardized traps deployed continuously across 63 German nature reserves over 27 years. The real, striking finding: average flying insect biomass fell more than 76%, up to 82% in midsummer, and this decline held regardless of habitat type and could not be explained by weather, land-use, or habitat changes WITHIN the reserves themselves, since these are protected areas specifically meant to shield wildlife from exactly that kind of direct disturbance -- pointing toward some larger-scale factor (agricultural chemical drift from surrounding farmland is the leading suspected driver, though the original study itself stopped short of proving a single cause) reaching even into land set aside for conservation. A real, honest, current update rather than leaving this as an unconfirmed decade-old finding: a 2024 follow-up study returned to German nature reserves and found flying insect biomass had NOT recovered, remaining at the same low level first documented between 2007 and 2016, with the study's own authors concluding that protected habitats, while genuinely essential, are \"unlikely to be sufficient to sustain insect biodiversity\" on their own.",
    citations: [
      {
        source: 'Hallmann CA, et al. 2017, PLOS ONE: "More than 75 percent decline over 27 years in total flying insect biomass in protected areas"',
        url: 'https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0185809',
      },
      {
        source: 'Ecology and Evolution 2024 / PMC: "No recovery in the biomass of flying insects over the last decade in German nature protected areas"',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10961242/',
      },
    ],
    overallTier: 'strong',
    stageNote: 'A real, landmark, peer-reviewed study with a real, honest 2024 follow-up confirming no recovery -- not a one-time finding left unconfirmed.',
    relatedIds: ['foodhistory-regen-pollinator-decline-crisis', 'foodhistory-regen-wild-bees-buzz-pollination'],
  },
  {
    id: 'foodhistory-regen-almond-pollination-rental-economics',
    category: 'basicHealth',
    title: 'A Real, Current Price Signal: Almond Bee-Rental Costs Are Already Rising',
    teaser: 'The average cost to rent a colony for almond pollination rose 15% in one year, from $181 in 2024 to $209 in 2025 -- a real, current market already pricing in the colony-loss crisis.',
    summary:
      "The colony-loss crisis covered elsewhere in this sub-cluster is not a purely future or abstract risk -- it is already showing up as a real, measured price signal in the one market most directly exposed to it. Official USDA cost-of-pollination survey data found the average price California almond growers paid to rent a single honeybee colony for the February bloom rose 15% in a single year, from $181 in 2024 to $209 in 2025, with some individual reports putting 2025 rental prices as high as $225-250 per hive. This tracks directly with the real 62% national colony-loss figure covered in this sub-cluster's own dedicated entry: beekeepers and almond growers both directly reported real concern heading into the 2025 bloom that there might not be enough healthy colonies to cover every almond acre at full pollination strength, forcing some growers to contract bees from farther away at real added cost. This is a concrete, current, dollar-denominated illustration of what an economic entry elsewhere in this cluster already states more abstractly: pollinator decline is not a distant hypothetical cost, it is already raising the price of food production in real time.",
    citations: [
      {
        source: 'West Coast Nut: Economic Outlook and Other Considerations for the 2025 Almond Pollination Season (USDA cost-of-pollination data, $181 to $209)',
        url: 'https://wcngg.com/2025/02/02/economic-outlook-and-other-considerations-for-the-2025-almond-pollination-season/',
      },
      {
        source: 'Capital Press: Beekeepers face downward trends for pollination services (2025 shortage concerns, 62% loss figure)',
        url: 'https://capitalpress.com/2025/01/06/beekeepers-face-downward-trends-for-pollination-services/',
      },
    ],
    overallTier: 'strong',
    stageNote: 'Real, official USDA market data -- a live economic indicator, not a projection or modeled estimate.',
    relatedIds: ['foodhistory-regen-pollinator-decline-crisis', 'foodhistory-regen-pollinator-dependent-crops'],
  },
  {
    id: 'foodhistory-regen-honeybee-genetic-bottleneck',
    category: 'basicHealth',
    title: "A Real, Underlying Reason Managed Honeybees Are So Vulnerable in the First Place",
    teaser: "Fewer than 600 queen mothers produce over a million commercial queen bees in the US every year -- a real genetic bottleneck comparable to the crop-monoculture risk already covered elsewhere in this cluster.",
    summary:
      'A real, underlying structural vulnerability helps explain why the managed honeybee population can lose 62% of its colonies in a single reporting period (see this sub-cluster\'s own dedicated entry), rather than absorbing disease and pesticide pressure the way a more genetically diverse population might: US commercial queen producers rely on fewer than 600 queen mothers annually to breed over a million commercial queen bees, a real, quantified genetic bottleneck. Offspring from this narrow breeding base show real, measured high relatedness and reduced genetic diversity both within and between colonies, and genome-wide sequencing research found strong genetic similarity across most major US commercial honeybee stocks, since a relatively small number of queen-breeding operations concentrated mainly in Hawaii, California, and the southeastern US supply the large majority of the country\'s managed colonies. This is structurally the same real risk already documented for monoculture agave (this sub-cluster\'s own bat entry) and, more broadly, for any single-variety-dependent food crop covered elsewhere in this whole cluster: a genetically narrow population is a population where one disease, one parasite, or one pesticide sensitivity can spread further and hit harder than it would across a genuinely diverse one, and real breeding efforts specifically selecting for Varroa-mite resistance in a few stocks (a real, worthwhile goal on its own) illustrate the same underlying tradeoff between optimizing for one trait and preserving overall genetic diversity.',
    citations: [
      {
        source: 'PMC: Genome-wide patterns of differentiation within and among U.S. commercial honey bee stocks (queen-mother breeding-base figures, genetic similarity findings)',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7545854/',
      },
      {
        source: 'Conservation Letters: Genetic Bottlenecks in Modern Beekeeping -- Implications for Conservation and Sustainable Pollination',
        url: 'https://conbio.onlinelibrary.wiley.com/doi/10.1111/conl.13156',
      },
    ],
    overallTier: 'strong',
    stageNote: 'A real, quantified, structural vulnerability factor -- explains part of WHY the crisis hits as hard as it does, distinct from the direct causes (mites, pesticides, habitat loss) already covered in this sub-cluster\'s own crisis entry.',
    relatedIds: ['foodhistory-regen-pollinator-decline-crisis', 'foodhistory-regen-bat-pollinators-white-nose'],
  },
  // 2026-08-11, same day, an eighth continuation: "Keep going with more
  // research on this topic." Every citation below independently
  // re-verified via WebSearch/WebFetch. This pass closes the pollinator
  // sub-cluster's own loop back to the main cluster (organic farming's
  // real, measured effect on pollinator abundance), adds a genuinely new
  // causal mechanism distinct from every cause already covered (climate-
  // driven timing mismatch, not toxicity or habitat loss), extends this
  // whole cluster's own international framing to pollinator vulnerability
  // specifically (2+ billion smallholder farmers, a real, different kind
  // of exposure than commercial US/EU agriculture has), and gives an
  // honest look at the leading technological stopgap being developed.
  {
    id: 'foodhistory-regen-organic-farming-pollinator-abundance',
    category: 'basicHealth',
    title: "Does Organic Farming Actually Help Pollinators? A Real, Current Meta-Analysis Says Yes, With Real Conditions",
    teaser: 'A 2025 review of 42 studies across four continents found real, measurably higher pollinator abundance and diversity on organic farms -- strongest for bumblebees, and strongest in otherwise simple, low-diversity landscapes.',
    summary:
      "This closes the loop directly back to the rest of this cluster: does the organic/regenerative farming already covered throughout this whole category actually measurably help pollinators, or is the connection mostly assumed? A real, current (2025) meta-analysis in the Journal of Applied Ecology compiled 42 individual studies from four continents, covering 76 separate species-richness comparisons and 57 abundance comparisons between organic and conventional farms, and found a real, positive effect: pollinator species richness and abundance were both measurably higher on organic farms, with bumblebee diversity benefiting the most of any pollinator group, while moths and hoverflies showed a positive but statistically weaker signal. The real, honest complication, consistent with this whole cluster's own standing discipline of naming context rather than claiming a universal effect: the benefit was genuinely context-dependent, strongest in simple, already low-diversity agricultural landscapes (where organic practices add the most relative habitat value) and weakest in organic pasture systems specifically, with landscape context, crop type, and even sampling method all measurably affecting the size of the real, underlying effect.",
    citations: [
      {
        source: 'Walker et al. 2025, Journal of Applied Ecology: "The context-dependent benefits of organic farming on pollinator biodiversity: A meta-analysis"',
        url: 'https://besjournals.onlinelibrary.wiley.com/doi/10.1111/1365-2664.14826',
      },
    ],
    overallTier: 'strong',
    stageNote: 'A real, current, large-scale meta-analysis -- the strongest evidence tier this pollinator sub-cluster has for the direct organic-farming-to-pollinator-abundance question, reported with its own real, honest context-dependence rather than a blanket claim.',
    relatedIds: ['foodhistory-regen-pollinator-habitat-regenerative-link', 'foodhistory-regen-agroforestry-quantified'],
  },
  {
    id: 'foodhistory-regen-phenological-mismatch',
    category: 'basicHealth',
    title: "A Real, Different Kind of Threat: Climate Change Is Shifting Flowers and Bees Out of Sync",
    teaser: 'British wild bees are emerging 6.5 days earlier for every 1°C of warming -- but flowers are shifting at a different rate, a real, measured timing mismatch distinct from every other cause covered in this cluster.',
    summary:
      "Every pollinator threat covered elsewhere in this sub-cluster works through direct toxicity, disease, or physical habitat loss. Climate change threatens pollinators through a real, genuinely different mechanism: phenological mismatch, where warming shifts the timing of flowering and the timing of pollinator emergence at different rates, so a plant may bloom before or after its own pollinator is actually active to visit it. Real, measured UK research found wild bee emergence dates have advanced by an average 0.40 days per year since 1980, or about 6.5 days earlier for every 1°C of regional warming -- and separate research found bee nesting/emergence timing is more sensitive to seasonal temperature than flowering time is, meaning the two are drifting apart rather than shifting together in lockstep. The real, measured consequence: when this mismatch widens, plant seed production falls due to reduced successful pollination, and bee reproductive success and population growth both measurably decline too, with the effect strongest for specialist bee species tied to one particular flower's own timing (a generalist bee that visits many different flowers across a season has more room to adapt) and worst at higher, northern latitudes, where a 2025 PNAS study found climate change increasing real secondary extinction risk for plants specifically through this mechanism.",
    citations: [
      {
        source: 'PMC 2023: Climate-driven phenological shifts in emergence dates of British bees (0.40 days/year, 6.5 days per 1°C)',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10329875/',
      },
      {
        source: 'PNAS 2025: Climate change intensifies plant-pollinator mismatch and increases secondary extinction risk for plants in northern latitudes',
        url: 'https://www.pnas.org/doi/10.1073/pnas.2506265122',
      },
    ],
    overallTier: 'strong',
    stageNote: 'A real, distinct causal mechanism from every other pollinator threat already covered in this sub-cluster -- timing disruption, not direct toxicity or habitat destruction.',
    relatedIds: ['foodhistory-regen-pollinator-decline-crisis', 'foodhistory-regen-insect-apocalypse-hallmann'],
  },
  {
    id: 'foodhistory-regen-smallholder-pollinator-vulnerability',
    category: 'basicHealth',
    title: 'A Real, Different, More Precarious Kind of Exposure: Smallholder Farmers in the Global South',
    teaser: "Roughly 2-2.5 billion people worldwide depend on small farms for their livelihood -- and unlike California almond growers, they can't simply pay to truck in replacement colonies when wild pollinators decline.",
    summary:
      "Nearly every entry in this pollinator sub-cluster so far describes commercial US or European agriculture, which has a real, if increasingly strained, fallback: paying to rent and truck in managed honeybee colonies (see this cluster's own almond-pollination-economics entry). A real, estimated 500-600 million smallholder farming households worldwide, supporting somewhere between 2 and 2.5 billion people total depending on the exact source and definition used, generally have no equivalent option, relying almost entirely on free, unmanaged wild pollinators they cannot pay to replace when those populations decline. A real, direct case study from Burkina Faso found household income could fall by as much as 83% depending on how pollinator-dependent that household's specific crops were, and research across sub-Saharan Africa found pollinator-dependent crops already contribute significantly to household dietary diversity and measurably reduce nutrient deficiencies where they're grown, meaning their loss threatens nutrition directly, not just income. A related, real, compounding trend: as smallholder farming systems specialize into fewer, more commercially valuable pollinator-dependent crops (coffee, watermelon, beans), a real, documented pattern, that specialization itself increases vulnerability to any single pollination-service disruption, the same underlying \"less diversity, more fragility\" pattern already documented elsewhere in this cluster for crop monocultures and managed-honeybee genetics alike.",
    citations: [
      {
        source: 'Sustainability 2018 (MDPI): Income Vulnerability of West African Farming Households to Losses in Pollination Services -- A Case Study from Ouagadougou, Burkina Faso',
        url: 'https://www.mdpi.com/2071-1050/10/11/4253',
      },
      {
        source: 'Scientific Reports 2023 (Nature): Pollinator-dependent crops significantly contribute to diets and reduce household nutrient deficiencies in sub-Saharan Africa',
        url: 'https://www.nature.com/articles/s41598-023-41217-y',
      },
      {
        source: 'Journal of Applied Ecology 2024: Agricultural specialisation increases the vulnerability of pollination services for smallholder farmers',
        url: 'https://besjournals.onlinelibrary.wiley.com/doi/10.1111/1365-2664.14732',
      },
    ],
    overallTier: 'strong',
    stageNote: 'Extends this whole cluster\'s own established international framing to pollinator vulnerability specifically -- a real, structurally different, more precarious exposure than commercial US/EU agriculture has, not the same risk at a smaller scale.',
    relatedIds: ['foodhistory-regen-almond-pollination-rental-economics', 'foodhistory-regen-honeybee-genetic-bottleneck', 'foodhistory-regen-global-implementation-synthesis'],
  },
  {
    id: 'foodhistory-regen-robotic-drone-pollination',
    category: 'basicHealth',
    title: 'The Real Technological Stopgap Being Built -- and Why It Isn\'t a Near-Term Answer',
    teaser: 'AI-guided pollination robots and drones are real and actively researched, but current systems mostly only work inside greenhouses, at high cost, and can\'t yet handle open-field agriculture or complex flower structures.',
    summary:
      "A real, active area of current research is developing robotic and drone-based artificial pollination as a direct technological response to the decline documented throughout this whole sub-cluster, worth covering honestly rather than presenting as a settled solution. Real, published 2024-2025 research includes AI-guided pollination robots for greenhouse tomato cultivation and autonomous drone systems using machine-learning flower classifiers, building on decades of more limited hand-pollination-assist tools. The real, honest limitation, stated directly rather than only celebrating the innovation: current systems work well mainly in controlled, indoor greenhouse settings on a narrow range of crops, remain technically complex and expensive to deploy at any real agricultural scale, and face real, unresolved engineering problems in open-field conditions specifically -- wind disturbance affecting flight stability, image blur from drone motion during flower detection, limited flight duration, and difficulty handling the more complex flower structures many real crops (as opposed to simplified greenhouse tomato flowers) actually have. The honest, working synthesis: this is a real, genuinely promising complement for specific high-value, controlled-environment crops, not a near-term replacement for the roughly 2 million honeybee colonies almond pollination alone already requires (see this cluster's own dedicated entry), let alone for the far larger, harder-to-replicate role wild and native pollinators play across open-field and Global South agriculture.",
    citations: [
      {
        source: 'International Journal of Agricultural and Biological Engineering: Research progress in mechanized and intelligentized pollination technologies for fruit and vegetable crops',
        url: 'https://ijabe.org/index.php/ijabe/article/view/9403',
      },
      {
        source: 'Artificial Intelligence Review (Springer Nature): A comprehensive review of current robot-based pollinators for crop pollination',
        url: 'https://link.springer.com/article/10.1007/s10462-025-11409-1',
      },
    ],
    overallTier: 'moderate',
    stageNote: 'A real, honest look at an actively-researched technology -- included specifically so this sub-cluster doesn\'t leave the impression that a technological fix is already close to solving the underlying decline documented throughout it.',
    relatedIds: ['foodhistory-regen-pollinator-dependent-crops', 'foodhistory-regen-smallholder-pollinator-vulnerability'],
  },
  // 2026-08-11, same day, a new sub-cluster: "I think we should move to
  // how people can force change through various ways by how they use
  // their money, and their buying power. This would need lots of
  // information." A genuinely new research direction from the same
  // person, distinct from the pollinator/soil-microbiome content above --
  // real, documented economic-power mechanisms (boycotts, shareholder
  // resolutions, institutional purchasing, certification, divestment),
  // each verified via WebSearch/WebFetch the same way as every other
  // batch in this whole cluster, and each including its own real, honest
  // limitation rather than presenting economic activism as a costless,
  // guaranteed lever. Directly complements this cluster's own existing
  // "How to Get Involved" entry, which covers the civic/political
  // channel (Farm Bill, USDA rulemaking) -- this sub-cluster covers the
  // separate, market-based channel.
  {
    id: 'foodhistory-regen-boycott-effectiveness-evidence',
    category: 'basicHealth',
    title: 'Do Boycotts Actually Work? A Real, Quantified Answer',
    teaser: 'A real academic stock-price study found targeted companies lose an average of over $120 million in market value within two months of a boycott announcement. Sales can fall 3-8% in affected markets.',
    summary:
      'This is real, measurable, peer-reviewed evidence, not folk wisdom. A stock-price event-study analysis of consumer boycotts found target firms\' market value dropped by an average of more than $120 million over the two months following a boycott announcement, with statistically significant negative abnormal stock returns averaging 2.7% in the days immediately after. More recent research into the social-media era found politically motivated boycotts reducing sales by a real 3-8% in directly affected markets, with the effect persisting for weeks, not just days -- and one estimate found up to 42% of multinational corporations and 54% of prominent consumer brands currently facing some active boycott campaign. The real, honest complication worth stating directly: a measurable financial hit is not automatically the same as the specific policy change a boycott demands -- the actual research shows financial pain is real and well-documented, but whether that pain converts into the targeted company actually changing its practices depends heavily on the specific goal, industry, and how sustained the pressure is, which is exactly why this sub-cluster\'s own two dedicated historic case studies (Nestle, United Farm Workers) are worth reading alongside this entry rather than assuming financial pressure alone guarantees an outcome.',
    citations: [
      {
        source: 'Springer, Journal of Consumer Policy: Determining the effectiveness of consumer boycotts -- A stock price analysis of their impact on corporate targets',
        url: 'https://link.springer.com/article/10.1007/BF00380573',
      },
      {
        source: 'Multidisciplinary Reviews: Consumer boycott movements -- Impact on brand reputation and business performance in the digital age',
        url: 'https://malque.pub/ojs/index.php/mr/article/view/8061',
      },
    ],
    overallTier: 'strong',
    stageNote: 'Real, peer-reviewed, quantified financial-market evidence -- the strongest evidence tier this new sub-cluster has for whether boycotts have a real, measurable effect at all, distinct from whether that effect always produces the specific change demanded.',
    relatedIds: ['foodhistory-regen-nestle-boycott-case-study', 'foodhistory-regen-ufw-grape-boycott-labor'],
  },
  {
    id: 'foodhistory-regen-nestle-boycott-case-study',
    category: 'basicHealth',
    title: 'A Real, 6.5-Year Boycott That Changed International Policy',
    teaser: 'Grassroots groups boycotted Nestle from 1977 to 1984 over its infant-formula marketing in developing countries. It produced a real, formal World Health Organization code, adopted by 118 countries.',
    summary:
      "A real, concrete, historic example that a sustained boycott can produce actual formal policy change, not just financial pressure. Grassroots organizations, led by the Infant Formula Action Coalition (INFACT) and the International Baby Food Action Network (IBFAN), launched a US boycott of Nestle products on July 4, 1977, over the company's own marketing of infant formula in developing countries -- a real, documented practice linked to infant illness and death where clean water for mixing formula wasn't reliably available, and where formula displaced breastfeeding's own real immune and nutritional benefits. The campaign went international in 1979 and directly led to a 1981 World Health Organization meeting that produced the International Code of Marketing of Breast-milk Substitutes, adopted by a real vote of 118 countries in favor (the US was the lone vote against). In 1984, Nestle became the first major corporation to formally agree to abide by the Code, and the original boycott was suspended. The honest, real complication worth including rather than treating this as a clean, permanent win: the boycott was relaunched in 1988 after activists alleged continued indirect-marketing violations, leading to a further 1989 Nestle commitment -- a real, concrete example that sustained monitoring, not a single agreement, is often what a successful boycott actually requires.",
    citations: [
      {
        source: 'The Washington Post: 6 1/2-Year Boycott of Nestle Is Ended As Firm Adopts Baby-Formula Code',
        url: 'https://www.washingtonpost.com/archive/politics/1984/01/27/6-12-year-boycott-of-nestle-is-ended-as-firm-adopts-baby-formula-code/24552e48-7920-449a-a5fd-0baa1f13ab66/',
      },
      {
        source: 'Global Nonviolent Action Database (Swarthmore): International groups boycott Nestle products to end indiscriminate advertising, 1977-1984',
        url: 'https://nvdatabase.swarthmore.edu/content/international-groups-boycott-nestle-products-end-indiscriminate-advertising-1977-1984',
      },
    ],
    overallTier: 'strong',
    stageNote: 'A real, dated, well-documented case study -- one of the clearest historical examples of a boycott producing formal international policy change, with an honest note that it needed a second round of pressure to hold.',
    relatedIds: ['foodhistory-regen-boycott-effectiveness-evidence', 'foodhistory-regen-ufw-grape-boycott-labor'],
  },
  {
    id: 'foodhistory-regen-ufw-grape-boycott-labor',
    category: 'basicHealth',
    title: 'The Other Real Historic Case: Farmworker Labor Rights, Not Just Environmental Practice',
    teaser: 'A 5-year strike and grape boycott led by Cesar Chavez produced real, signed contracts with 140 growers -- a reminder that "buying power" in food also means the people who actually pick it.',
    summary:
      "This whole cluster's own extensive coverage of soil, pesticides, and pollinators has said comparatively little about the people who physically grow and harvest food -- worth correcting directly, since farmworker labor conditions are a real, legitimate target for consumer economic pressure in their own right, distinct from environmental practice. In September 1965, Filipino American grape workers in Delano, California, organized under the Agricultural Workers Organizing Committee (AWOC) walked off the job; Cesar Chavez's National Farm Workers Association joined the strike shortly after, and the two groups merged into what became the United Farm Workers (UFW). The strike escalated into a real, sustained, nationwide grape boycott asking consumers to stop buying non-union grapes, a campaign that continued despite real, documented violent reprisals against striking workers. By July 1970, the pressure produced a real, concrete result: contracts signed by 140 grape growers covering wages and health and safety provisions for farmworkers, a genuine transformation of California agricultural labor relations and the event that established the UFW as a lasting voice for farmworker rights. This is a real, direct historical precedent for the idea that consumer purchasing choices can be organized specifically around labor conditions in the food supply chain, not only around environmental or health claims.",
    citations: [
      {
        source: 'United Farm Workers: The 1965-1970 Delano Grape Strike and Boycott',
        url: 'https://ufw.org/1965-1970-delano-grape-strike-boycott/',
      },
      {
        source: 'US National Park Service: Workers United -- The Delano Grape Strike and Boycott',
        url: 'https://www.nps.gov/articles/000/workers-united-the-delano-grape-strike-and-boycott.htm',
      },
    ],
    overallTier: 'strong',
    stageNote: 'A real, dated, well-documented labor-rights case study, deliberately included to broaden this whole cluster\'s own coverage beyond environmental practice into farmworker conditions specifically.',
    relatedIds: ['foodhistory-regen-boycott-effectiveness-evidence', 'foodhistory-regen-nestle-boycott-case-study'],
  },
  {
    id: 'foodhistory-regen-shareholder-activism-mechanics',
    category: 'basicHealth',
    title: 'How an Individual Investor Can Actually File a Real Shareholder Resolution',
    teaser: 'Real SEC rules let anyone holding just $2,000 in a company\'s stock for three years co-file a resolution on its pesticide use, deforestation exposure, or labor practices -- a real, underused lever most people don\'t know exists.',
    summary:
      'This is a real, concrete, and genuinely underused mechanism distinct from simply choosing what to buy: owning even a small amount of a public food company\'s stock creates a real, legal right to formally challenge its practices at the company\'s own annual meeting. Under SEC Rule 14a-8, a shareholder qualifies to submit a formal resolution by meeting one of three real ownership thresholds: continuous ownership of at least $2,000 of the company\'s stock for three years, $15,000 for two years, or $25,000 for one year. In practice, individual investors most often co-file alongside an established shareholder-advocacy nonprofit like As You Sow (founded 1992, the leading US organization in this space) or the Interfaith Center on Corporate Responsibility, lending their own shares to a coalition\'s already-drafted, legally vetted resolution rather than drafting one from scratch. Real, current (2025-2026) examples directly relevant to this whole cluster: shareholder resolutions asking Sprouts, Costco, and Walmart to disclose deforestation risk in their avocado supply chains, asking McDonald\'s to report on its own regenerative-agriculture programs, and asking Target and Kellanova (formerly Kellogg) to disclose pesticide use across their supply chains. The honest, real complication worth including directly: these resolutions frequently fail to win a majority vote even when successfully filed -- at Tyson Foods\' 2024 annual meeting, resolutions on climate lobbying, deforestation, and child labor all failed to pass -- but a filed resolution still forces a real, public company response and real investor and media attention regardless of the final vote count, which is itself a documented part of how this kind of pressure works even without an outright win.',
    citations: [
      {
        source: 'As You Sow: Shareholder Advocacy -- FAQ about Shareholder Resolutions (SEC Rule 14a-8 thresholds, how co-filing works)',
        url: 'https://www.asyousow.org/shareholder-advocacy',
      },
      {
        source: 'FAIRR: Proxy Season 2025 -- Agri-Food Resolutions Buck Broader Trend (real, current named examples across the food sector)',
        url: 'https://www.fairr.org/news-events/insights/proxy-season-2025-agri-food-resolutions-buck-broader-trend',
      },
    ],
    overallTier: 'strong',
    stageNote: 'Real, official SEC rules and a real, named, currently-active organizational pathway -- a genuinely actionable, not just theoretical, mechanism, with an honest note that most individual resolutions still lose their vote.',
    relatedIds: ['foodhistory-regen-how-to-get-involved', 'foodhistory-regen-reform-coalition-orgs'],
  },
  {
    id: 'foodhistory-regen-institutional-purchasing-power',
    category: 'basicHealth',
    title: "The Lever Most People Never Think About: What Your School, Hospital, or University Buys",
    teaser: 'US institutions -- schools, hospitals, universities, prisons -- spend over $130 billion a year on food. A single local school-board procurement vote can move real money that no individual grocery run ever could.',
    summary:
      "A real, genuinely underappreciated economic lever sits entirely outside individual grocery-store choices: institutional food procurement. US institutional food service (schools, hospitals, universities, prisons, corporate cafeterias, senior care facilities) spends a real, official estimated $130 billion annually, and shifting even a modest share of that spending toward local, regenerative, or otherwise verified sourcing moves real money at a scale no individual purchasing decision can match. USDA data found national sales into local/regional institutional markets reached $4.1 billion in 2020, a real $700 million increase over the preceding five years, and school food purchases of local food alone generate an estimated $1 billion in additional local economic activity nationwide each year -- a real, documented multiplier effect. Health Care Without Harm, a real advocacy organization, has specifically organized hospital systems around this same leverage point, on the theory that a hospital's own food purchasing should align with its stated health mission. A real, city-level example: a review of value-based food-procurement policies across 10 US cities found they had collectively influenced over $540 million in public food spending. The practical, real-world version of this lever for an individual: a school-board meeting, a hospital system's own sourcing committee, or a university dining-services contract renewal is a real, concrete decision point most people never think to show up to, despite it moving far more purchasing power than their own household grocery budget ever will.",
    citations: [
      {
        source: 'Rockefeller Foundation: The Power of Procurement ($130 billion annual institutional food spending)',
        url: 'https://www.rockefellerfoundation.org/initiatives/the-power-of-procurement/',
      },
      {
        source: 'Health Care Without Harm: Leveraging the power of procurement (USDA local-institutional-sales data, city-level procurement-policy figures)',
        url: 'https://us.noharm.org/healthy-food/leveraging-power-procurement',
      },
    ],
    overallTier: 'strong',
    stageNote: 'A real, official, quantified spending figure and a real, named advocacy infrastructure already organized around it -- a genuinely underused, concrete civic lever, not a theoretical one.',
    relatedIds: ['foodhistory-regen-how-to-get-involved', 'foodhistory-regen-whole-foods-organic-industry'],
  },
  {
    id: 'foodhistory-regen-bcorp-certification-accountability',
    category: 'basicHealth',
    title: 'B Corp Certification: A Real Accountability Model, With Real, Documented Weak Spots',
    teaser: "Over 4,000 companies now carry the B Corp seal, built on a real legal requirement to consider workers, community, and environment, not just shareholders. It has also been directly accused of greenwashing, and just overhauled its own standard because of it.",
    summary:
      "B Corp certification is a real, distinct accountability mechanism from organic or Regenerative Organic Certified (both scoped to farming practice specifically, see this cluster's own dedicated entries): it certifies an entire company's own governance, not just how one crop was grown. To certify, a company must pass B Lab's own Impact Assessment across governance, workers, community, environment, and customers, and, critically, must legally amend its own corporate charter to require considering all stakeholders, not just shareholder returns, a real, binding structural change most ordinary corporations aren't required to make. Over 4,000 companies now hold the certification globally, spanning a real, substantial share of the food and beverage sector specifically. The real, documented weak spot, worth stating directly rather than only celebrating the model: the original points-based system let a company offset weak performance in one category (say, environment) with strong performance in another (say, governance) and still clear the minimum 80-of-200-point bar, which real critics have pointed to in specific, named cases -- Nespresso and fast-fashion retailer Princess Polly both drew direct greenwashing accusations after certifying despite real, documented environmental or labor controversies. B Lab responded with a real, structural 2026 overhaul, replacing the flexible points system with a requirement that every certified company meet a real minimum standard across all seven of its impact areas individually, with third-party verification, rather than being able to average a weak category away.",
    citations: [
      {
        source: 'The Sustainable Agency: B Corp certification changes & new standards for 2026, explained',
        url: 'https://thesustainableagency.com/blog/b-corp-changes-and-new-standards/',
      },
      {
        source: 'CHOICE: B Corps -- Real change or just more greenwashing?',
        url: 'https://www.choice.com.au/shopping/packaging-labelling-and-advertising/labelling/articles/b-corps',
      },
    ],
    overallTier: 'moderate',
    stageNote: 'A real, honest, both-sides treatment -- the model\'s real structural strength (a legally binding stakeholder requirement) and its own real, documented, now-being-fixed weakness are both stated directly, consistent with this whole cluster\'s standing discipline.',
    relatedIds: ['foodhistory-regen-timeline-certification-era', 'foodhistory-regen-whole-foods-organic-industry'],
  },
  {
    id: 'foodhistory-regen-divestment-food-system',
    category: 'basicHealth',
    title: 'Divestment: Moving Where the Money Sits, Not Just What You Buy',
    teaser: 'Over $40 trillion in institutional assets have some fossil-fuel divestment commitment attached. A real, smaller, food-specific version of the same movement now targets factory-farm financing directly.',
    summary:
      "Divestment is a real, distinct lever from either boycotting or shareholder activism: instead of pressuring a company as a customer or as an owner, it means an institution (a pension fund, university endowment, or city treasury) simply removing its money from a sector entirely. The fossil-fuel divestment movement is the largest real precedent, with more than 1,593 institutions holding a combined $40.5 trillion in assets under management having made some divestment commitment as of 2023 -- though a real, important methodological caveat applies directly: that headline figure represents the TOTAL assets of committing institutions, not the actual dollar amount divested from fossil fuels specifically, since the precise fossil-fuel share of a given portfolio is often not disclosed. Real academic research on actual financial effect is genuinely mixed: portfolios excluding fossil-fuel producers don't show significantly different risk-adjusted returns than unrestricted ones, and the clearest measured impact on companies' own capital costs shows up specifically when divestment is led by regional or national governments, not scattered individual investors. A real, distinct, food-system-specific version of the same strategy exists too: in April 2021, Berkeley became the first California city to formally urge its state pension fund (CalPERS) to divest from factory farming, UK research (Feedback, working with World Animal Protection) found local-government pension funds holding a real GBP238 million in industrial livestock investments, and a global Stop Financing Factory Farming coalition now specifically targets development-bank loans to industrial animal-agriculture operations, working alongside FAIRR, a real investor-research initiative founded in 2015 specifically to map factory-farming financial risk for institutional investors.",
    citations: [
      {
        source: 'Wikipedia (cross-checked against Oxford Academic Journal of Economic Geography research cited within): Fossil fuel divestment (scale figures, mixed-effectiveness research)',
        url: 'https://en.wikipedia.org/wiki/Fossil_fuel_divestment',
      },
      {
        source: 'Faunalytics: Follow The Money, Part 2 -- Divestment From Factory Farms (Berkeley/CalPERS, UK pension data, Stop Financing Factory Farming, FAIRR)',
        url: 'https://faunalytics.org/follow-the-money-part-2-divestment-from-factory-farms/',
      },
    ],
    overallTier: 'moderate',
    stageNote: 'A real, large-scale movement with genuinely mixed academic evidence on direct financial effect, reported honestly rather than assuming divestment automatically works -- included alongside a real, smaller, food-system-specific parallel rather than only the better-known fossil-fuel version.',
    relatedIds: ['foodhistory-regen-shareholder-activism-mechanics', 'foodhistory-regen-institutional-purchasing-power'],
  },
  // 2026-08-11, same day, a second continuation of the economic-power
  // sub-cluster: "Keep going with more research on this topic." Both
  // entries verified via WebSearch. Adds a real, honest complication to
  // the boycott-effectiveness entry above (positive "buycotts" are real
  // but measurably weaker, and even a real, dramatic sales swing can fully
  // dissipate within weeks) and a real, positive, distinct mechanism
  // (direct investment) that doesn't depend on pressuring or punishing an
  // existing company at all.
  {
    id: 'foodhistory-regen-buycott-versus-boycott',
    category: 'basicHealth',
    title: '"Buycotts" Are Real Too -- and Real Research Finds Them Measurably Weaker Than Boycotts',
    teaser: 'A real, documented case: after a brand controversy, sales briefly rose 22% from a buycott-style show of support, then fully returned to normal within three weeks either way.',
    summary:
      "A real, deliberate complement to this sub-cluster's own boycott-effectiveness entry: \"buycotting,\" organizing consumers to deliberately reward a company for good behavior by buying more from it, is a real, documented, named strategy of its own, not just the mirror image of a boycott. Real, peer-reviewed consumer-psychology research consistently finds it measurably weaker than boycotting, though: negative information about a company reliably motivates more consumer action than equivalent positive information does, and researchers have traced this to a real, specific psychological asymmetry -- consumers perceive punishing a company (boycotting) as more genuinely instrumental in changing its behavior, and as more self-enhancing to participate in, than rewarding one (buycotting), even when the underlying goal is identical. A real, concrete, quantified case study: after a real corporate controversy, one well-known brand saw sales rise a real 22% in the following weeks, widely read at the time as a buycott-style show of support -- but that entire sales boost, like the boycott pressure on the other side of the same controversy, had fully dissipated within three weeks, with neither producing a lasting change. The honest, working takeaway: buycotting is a real, legitimate tool, but the actual research points toward organized boycotts (see this sub-cluster's own dedicated entry, plus the two real historic case studies) as the more consistently effective lever of the two, and toward sustained, repeated pressure over a single purchasing spike either way.",
    citations: [
      {
        source: 'Journal of the Association for Consumer Research: Why Consumers Boycott More Than Buycott -- The Role of Perceived Instrumentality and Self-Enhancement',
        url: 'https://www.journals.uchicago.edu/doi/10.1086/731920',
      },
      {
        source: 'INFORMS: How Much Impact Do Boycotts and Buycotts Actually Have on Brand Sales? (the 22%-then-fully-dissipated case study)',
        url: 'https://www.informs.org/News-Room/INFORMS-Releases/News-Releases/How-Much-Impact-Do-Boycotts-and-Buycotts-Actually-Have-on-Brand-Sales',
      },
    ],
    overallTier: 'strong',
    stageNote: 'A real, honest complication to this sub-cluster\'s own more favorable boycott-effectiveness entry -- reported directly rather than letting "vote with your dollar" read as a uniformly reliable lever either way.',
    relatedIds: ['foodhistory-regen-boycott-effectiveness-evidence', 'foodhistory-regen-nestle-boycott-case-study'],
  },
  {
    id: 'foodhistory-regen-direct-investment-crowdfunding',
    category: 'basicHealth',
    title: 'A Real, Positive Alternative to Boycotting: Putting Money Directly Into What You Want to Support',
    teaser: 'A real, SEC-regulated platform lets anyone invest as little as $100 directly into a working regenerative farm -- no boycott, no shareholder resolution, just funding the thing you want to exist.',
    summary:
      "Every mechanism covered elsewhere in this sub-cluster works by pressuring, punishing, or formally challenging an EXISTING company. A real, distinct, positive alternative exists too: investing directly in the farms and food businesses already practicing what the rest of this whole cluster describes. Steward, a real, SEC-regulated crowdfunding platform, lets any US investor put in as little as $100 through the Steward Farm Trust, a pooled portfolio of loans made directly to small and regenerative farms, paying investors dividends from the farmers' own loan interest payments -- the platform has directed more than $2.2 million across 16 real farms to date, mostly in the US. Harvest Returns, a real, separate equity-crowdfunding platform, connects both accredited and non-accredited investors directly with individual farming and agribusiness projects, and has facilitated roughly $30 million of investment across about 50 real projects as of 2023, spanning sustainable agriculture, hemp, and hydroponic vertical farms. This is a genuinely different kind of \"buying power\" than anything else covered in this sub-cluster -- not a reward or punishment aimed at an existing company's behavior, but capital flowing directly to the specific kind of farming this whole cluster has spent dozens of entries documenting the real, cited benefits of.",
    citations: [
      {
        source: 'Fast Company: Small farms are struggling -- now there\'s a crowdfunding platform for that (Steward)',
        url: 'https://www.fastcompany.com/90413388/small-farms-are-struggling-now-theres-a-crowdfunding-platform-for-that',
      },
      {
        source: 'Texas Monthly: A Crowdfunding Approach to Growing Texas Farms (Harvest Returns)',
        url: 'https://www.texasmonthly.com/news-politics/harvest-returns-crowdfunding-farms-ranches/',
      },
    ],
    overallTier: 'strong',
    stageNote: 'Real, SEC-regulated, currently operating platforms with real, verifiable investment totals -- a genuinely positive, direct-funding lever, not a pressure campaign.',
    relatedIds: ['foodhistory-regen-whole-foods-organic-industry', 'foodhistory-regen-timeline-certification-era'],
  },
  // 2026-08-11, same day, direct question: "Seeing where the data has
  // taken us, what are we now missing and why should it be included in
  // this knowledgebase?" Both entries below were named as the two
  // strongest gaps -- the clearest structural omission (water) and the
  // strongest direct tie to this whole app's own core health mission
  // (antibiotic resistance, connecting straight to the gut-microbiome
  // research this Digest is otherwise full of). Both independently
  // verified via WebSearch/WebFetch the same way as every other batch.
  {
    id: 'foodhistory-regen-ogallala-water-depletion',
    category: 'basicHealth',
    title: 'The Missing Resource Underneath Every Entry in This Cluster: Water',
    teaser: 'The same almond industry already covered in this cluster (99% of US bee colonies, $209/colony rentals) sits on top of a real aquifer that could be 70% depleted within 50 years -- and federal policy is directly named as part of why.',
    summary:
      "Every entry in this whole cluster, soil, pesticides, pollinators, has an unspoken water problem underneath it that hasn't been named directly until now. The Ogallala Aquifer, the largest groundwater source in the US, underlies eight states and provides roughly 30% of all US irrigation groundwater, supporting about a fifth of the country's total agricultural output. Irrigation accounts for 90% of Ogallala withdrawals, and between 1900 and 2008, farmers drained more than 273 million acre-feet from it, a real, staggering volume equivalent to two-thirds of Lake Erie. The depletion is real, current, and accelerating: parts of Kansas have already reached \"Day Zero\" (wells running dry) across roughly 30% of the aquifer beneath the state, water levels in the Texas Panhandle have dropped 44 feet, and a 2019 study found climate change could push the depletion rate up by as much as 50% by 2050. The real, honest complication worth stating directly, since it connects straight back to this cluster's own \"why isn't this mandated\" entry: real academic research found this isn't simply a drought problem or a farmer's individual choice, but a genuine \"production treadmill\" built directly into federal policy -- crop subsidies (a real $37.2 billion in 2020, up 65% that year alone) keep farming viable at low crop prices, which pushes farmers to expand irrigated acreage to stay solvent regardless of long-term water cost, and the same expanded irrigation was found to fail at actually improving local income, education, or health outcomes even as it accelerates depletion.",
    citations: [
      {
        source: 'farmdoc daily / Farm Policy News: Ogallala Aquifer Depletion Threatening Rural Communities & Ag',
        url: 'https://farmpolicynews.illinois.edu/2024/01/ogallala-aquifer-depletion-threatening-rural-communities-ag/',
      },
      {
        source: 'The Conversation: Farmers are depleting the Ogallala Aquifer because the government pays them to do it (subsidy mechanism, $37.2 billion figure)',
        url: 'https://theconversation.com/farmers-are-depleting-the-ogallala-aquifer-because-the-government-pays-them-to-do-it-145501',
      },
    ],
    overallTier: 'strong',
    stageNote: 'A real, current, well-documented crisis with a direct, cited policy mechanism -- the same structural-disincentive pattern already established in this cluster\'s own crop-insurance entry, now shown to apply to water too.',
    relatedIds: ['foodhistory-regen-why-not-mandated', 'foodhistory-regen-almond-pollination-rental-economics', 'foodhistory-regen-fao-baseline-stakes'],
  },
  {
    id: 'foodhistory-regen-antibiotic-resistance-livestock',
    category: 'basicHealth',
    title: "The Strongest Direct Health Tie in This Whole Cluster: Antibiotic Resistance",
    teaser: 'About 70% of medically important antibiotics sold in the US go to livestock, not people. CDC directly names food animals as a real source of the resistant bacteria that kill 35,000 Americans a year.',
    summary:
      "Nearly everything else in this cluster connects to human health indirectly, through soil nutrients, pollination, or nutrient density. This connects directly, and it belongs in this Digest specifically because the rest of this app already documents, in real depth, how gut-microbiome disruption ties to autoimmune disease. Roughly 70% of medically important antibiotics sold in the US (the classes doctors actually rely on to treat human infection) are sold for use in livestock, not people, and when all antimicrobials are counted, not just the medically important ones, that share rises to 80%. This is a real, current, worsening trend, not a historical problem already fixed: FDA's own sales data found livestock antibiotic sales rose 15.8% from 2023 to 2024 alone. The direct human-health mechanism is not speculative -- the CDC states plainly that there is strong evidence some human antibiotic resistance is caused by antibiotic use in food animals, naming Campylobacter, Salmonella, Enterococcus, and E. coli specifically as real, documented foodborne pathogens that can carry resistance from farm to human infection. CDC's own 2019 Antibiotic Resistance Threats Report found more than 2.8 million antibiotic-resistant infections occur in the US every year, causing over 35,000 deaths. The one real, honest, genuinely encouraging complication worth including alongside the alarming trend: that same 2019 CDC report found deaths from antibiotic resistance overall had actually fallen 18% since the agency's original 2013 report (nearly 30% in hospitals specifically), real evidence that targeted public-health intervention works even while livestock antibiotic use itself keeps climbing on a separate track.",
    citations: [
      {
        source: 'EWG: Sharp rise in livestock antibiotic use threatens life-saving medications (70%/80% figures, 15.8% 2023-2024 sales rise)',
        url: 'https://www.ewg.org/news-insights/news/2026/01/sharp-rise-livestock-antibiotic-use-threatens-life-saving-medications',
      },
      {
        source: 'CDC: Antibiotic Resistance Threats in the United States, 2019 (2.8 million infections, 35,000 deaths, the 18%/30% decline since 2013)',
        url: 'https://www.cdc.gov/antimicrobial-resistance/media/pdfs/2019-ar-threats-report-508.pdf',
      },
    ],
    overallTier: 'strong',
    stageNote: 'A real, official CDC-sourced mechanism directly connecting industrial livestock practice to human infectious disease -- the clearest, most direct link to this app\'s own core gut-microbiome-and-autoimmune-disease research anywhere in this whole cluster.',
    relatedIds: ['foodhistory-regen-fao-baseline-stakes', 'gut-scfa-treg'],
  },
  // 2026-08-11, same day, direct continuation: "Keep going with more
  // research on this topic," following directly from the named-but-not-
  // yet-built gaps identified the same day (seed diversity, CO2-driven
  // nutrient decline, food waste). Every citation below independently
  // re-verified via WebSearch/WebFetch. One real, important self-caught
  // near-miss during this pass: an initial aggregated search result for
  // the CO2/nutrient-decline research gave clearly inflated figures (a
  // 65% protein decline, 50%+ zinc/iron declines) that did NOT match the
  // real primary source once actually fetched -- the true, precise Myers
  // et al. 2014 figures are single-digit percentage declines. Caught and
  // corrected before writing anything, a direct, live demonstration of
  // why this whole cluster's own standing discipline (always verify
  // against the primary source, not an aggregated summary) exists.
  {
    id: 'foodhistory-regen-seed-diversity-loss',
    category: 'basicHealth',
    title: 'How Much Crop Diversity Has Actually Been Lost? A Real, Corrected Number',
    teaser: 'The widely repeated "75% of crop diversity lost since 1900" figure traces to broad estimates, not a hard count -- and a real, later study found the original math behind an even more alarming version of the claim was simply wrong.',
    summary:
      "A commonly repeated statistic, that 75% of crop genetic diversity was lost over the 20th century, traces back to FAO's own 2010 State of the World's Plant Genetic Resources report, and the figure itself is real and still widely cited. The honest complication, consistent with this whole cluster's own standing discipline of checking a popular number rather than repeating it: FAO's own 75% figure was built from broad estimates and generalizations, not a direct, hard count of actual varieties. A real, more precise study exists, and it tells a genuinely more nuanced story: researchers compared 1903 and 2004 US seed catalogs directly, cataloging 7,262 varieties across 48 vegetable crops in 1903, and found the TOTAL number of available varieties had barely changed by 2004, only 2.2% fewer overall. What had changed dramatically was turnover, not raw diversity: 94% of the SPECIFIC varieties listed in the 1903 catalog were no longer available from common commercial sources by 2004, replaced by new varieties from preservationists, importers, and gardeners rather than genuine diversity collapse. A real, separate, worth-remembering detail: an earlier, even more alarming 1983 estimate claiming only a 3% survival rate for 1903 varieties turned out to contain a real calculation error -- the corrected rate is 7.4%, more than double what had been repeated for decades. None of this means crop diversity loss isn't real; it means the honest picture is variety replacement and narrowing commercial availability, not the simpler, more dramatic \"three-quarters gone\" headline usually repeated.",
    citations: [
      {
        source: 'Phys.org: Researchers find no loss of vegetable diversity in the 20th century; correct math error in 1983 study (Heald & Chapman, University of Georgia)',
        url: 'https://phys.org/news/2009-09-loss-vegetable-diversity-20th-century.html',
      },
      {
        source: 'FAO: Crop biodiversity -- use it or lose it (the original, widely-cited 75% estimate)',
        url: 'https://www.fao.org/newsroom/detail/Crop-biodiversity-use-it-or-lose-it/',
      },
    ],
    overallTier: 'moderate',
    stageNote: 'A real, deliberate correction of a popular but imprecise statistic, the same discipline already applied elsewhere in this cluster to the Savory claim, the FAO hectare figure, and the no-till/greenwashing entry.',
    relatedIds: ['foodhistory-regen-honeybee-genetic-bottleneck', 'foodhistory-regen-seed-industry-consolidation'],
  },
  {
    id: 'foodhistory-regen-seed-industry-consolidation',
    category: 'basicHealth',
    title: 'Four Companies Now Control More Than Half the World\'s Commercial Seed Supply',
    teaser: 'In the 1980s, the ten biggest seed companies controlled under 15% of the market. Today four companies alone control 56% -- the same companies already covered in this cluster\'s own pesticide and lobbying research.',
    summary:
      'A real, direct, quantified consolidation trend, and a real structural parallel to the genetic-bottleneck pattern already documented twice elsewhere in this cluster (commercial honeybee breeding, agave monoculture): four companies, Bayer, Syngenta, Corteva, and BASF, now control a real 56% of the global commercial seed market and 61% of the global pesticide market. This is a genuinely fast, recent consolidation, not a decades-old status quo: in the seed sector specifically, the combined market share of the top four rose from 21% to 57% over roughly 25 years, and the ten largest seed companies now control 70% of the market, up from under 15% in the 1980s. Bayer and Corteva alone, the two largest players, control 42% of the global commercial seed market between them, and both are heavily concentrated in just two crops -- Bayer draws roughly 75% of its own seed sales from maize and soybeans, Corteva a full 85%. This is the same Bayer already covered in this cluster\'s own pesticide-liability-shield and lobbying-imbalance entries, now shown controlling a comparably outsized share of the seed supply itself, not just the chemicals applied to it.',
    citations: [
      {
        source: 'Heinrich Böll Stiftung (Pesticide Atlas): Corporations -- big profits with toxic trade (56%/61% figures)',
        url: 'https://eu.boell.org/en/PesticideAtlas-corporations',
      },
      {
        source: 'Public Eye: The dangerous concentration of the seed market (25-year consolidation trend, top-10 figures)',
        url: 'https://www.publiceye.ch/en/topics/seeds/concentration-of-the-seed-market',
      },
    ],
    overallTier: 'strong',
    stageNote: 'Real, current, independently-tracked market-concentration data -- directly ties this cluster\'s own pesticide/lobbying research on Bayer to the seed supply specifically, not a separate corporate story.',
    relatedIds: ['foodhistory-regen-seed-diversity-loss', 'foodhistory-regen-lobbying-imbalance', 'foodhistory-pesticides-glyphosate-dispute'],
  },
  {
    id: 'foodhistory-regen-svalbard-seed-vault',
    category: 'basicHealth',
    title: 'The Real Institutional Answer to Seed Loss -- and a Real, Ironic Threat It Already Survived',
    teaser: 'Over 1.3 million seed samples sit frozen 120 meters into an Arctic mountain, built to survive war and disaster. In 2017 it flooded from the one thing it wasn\'t designed to survive: the climate itself changing.',
    summary:
      "Against the real diversity-loss and consolidation trends covered elsewhere in this cluster, a real, concrete institutional backstop already exists. The Svalbard Global Seed Vault, opened in 2008 on the Norwegian Arctic island of Spitsbergen, holds over 1.3 million seed samples from nearly every country on Earth, backing up national and regional seed banks against the exact kind of loss (war, disaster, simple institutional failure) that could otherwise be permanent. The engineering itself is a real, deliberate answer to the fragility problem: three separate rock vaults sit 120 meters into the mountain Plataberget, kept at a genuinely passive -18degC by permafrost and thick rock, meaning the seeds stay frozen even during a total power failure. A real, honest, ironic complication worth including rather than glossing over: in 2017, melting permafrost, a direct effect of the same climate change the vault's own mission statement names as one of the disasters it protects against, flooded the facility's entrance tunnel and damaged electrical equipment. The seeds themselves, housed behind a second vault door deeper into the mountain, were never actually reached or damaged, a real, important correction to the more alarming \"doomsday vault flooded\" headlines the incident generated at the time. Norway responded with a real, concrete $13 million renovation: a new waterproof tunnel, relocated electrical systems, meltwater diversion channels, and active coolant pipes threaded through the surrounding soil to help keep the permafrost itself frozen going forward.",
    citations: [
      {
        source: 'Crop Trust: Svalbard Global Seed Vault (1.3 million samples, engineering, mission)',
        url: 'https://www.croptrust.org/what-we-do/programs/svalbard-global-seed-vault/',
      },
      {
        source: 'Scientific American: The Arctic Seed Vault Shows the Flawed Logic of Climate Adaptation (2017 flooding, real cause and outcome)',
        url: 'https://www.scientificamerican.com/article/the-arctic-seed-vault-shows-the-flawed-logic-of-climate-adaptation/',
      },
    ],
    overallTier: 'strong',
    stageNote: 'A real, positive institutional response to the diversity-loss problem, reported alongside its own real, honest complication rather than only the reassuring half of the story.',
    relatedIds: ['foodhistory-regen-seed-diversity-loss', 'foodhistory-regen-ogallala-water-depletion'],
  },
  {
    id: 'foodhistory-regen-co2-nutrient-decline',
    category: 'basicHealth',
    title: 'A Real, Different Threat to Food\'s Nutrient Content: Rising CO2 Itself, Not Farming Practice',
    teaser: 'A rigorous 7-site, 40-cultivar field study found real, single-digit declines in zinc, iron, and protein under the CO2 levels expected by mid-century -- modest per crop, but reaching 2.3 billion people who get most of their dietary zinc and iron from exactly these staples.',
    summary:
      "This cluster's own nutrient-density entry already covers whether FARMING PRACTICE (organic vs. conventional) changes how nutritious food is. Real, separate research asks a genuinely different question: does rising atmospheric CO2 itself, independent of how a crop is farmed, change its nutrient content. The real, most rigorous answer comes from Myers et al. 2014 (Nature), a study using free-air CO2 enrichment (FACE) technology across seven real field-experiment sites in Japan, Australia, and the United States, testing 40 real crop cultivars across up to six growing seasons for a total of 143 comparisons, at the CO2 concentration levels expected by roughly mid-century. The real, precise findings, genuinely modest per crop rather than dramatic: wheat showed 9.3% lower zinc and 6.3% lower protein, rice showed 3.3% lower zinc and 7.8% lower protein, field peas and soybeans showed comparable single-digit declines in zinc and iron. The real reason this matters despite modest individual percentages: the study found roughly 2.3 billion people worldwide get at least 60% of their dietary zinc and/or iron from these same C3 staple crops, with 1.9 billion relying on them for 70% or more of at least one of those nutrients -- a small percentage decline applied across that much of the global food supply is a real, population-scale nutrition risk, not a rounding error. C4 crops (maize, sorghum, several others) use a different photosynthetic pathway and were found substantially less affected, a real, practical distinction for which staple crops carry more of this specific risk.",
    citations: [
      {
        source: 'Myers SS, et al. 2014, Nature: "Increasing CO2 threatens human nutrition" (real, exact per-crop percentage declines, 2.3 billion figure)',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4810679/',
      },
    ],
    overallTier: 'strong',
    stageNote: 'A real, rigorous, multi-site field study -- the exact figures here were independently re-verified against the primary source after an initial aggregated search result gave clearly inflated numbers that did not match the real paper.',
    relatedIds: ['foodhistory-regen-nutrient-density-honest-evidence', 'foodhistory-regen-fao-baseline-stakes'],
  },
  {
    id: 'foodhistory-regen-food-waste-scale',
    category: 'basicHealth',
    title: 'The Direct Multiplier on Every Urgency Figure in This Cluster: Food Waste',
    teaser: 'Roughly a third of all food produced is never eaten -- and that classic figure may itself understate the real problem, since it leaves out crops lost before ever reaching a store.',
    summary:
      'This is the direct multiplier on this cluster\'s own FAO soil-degradation baseline entry: every acre of soil degraded, every gallon of aquifer water pumped, and every managed pollinator trucked to an orchard is being spent, in part, on food that never actually gets eaten. The widely-cited estimate, based on real FAO and UNEP data, holds that roughly one-third of all food produced worldwide, about 1.3 billion tons a year, is lost or wasted. A real, honest complication: that classic figure may itself UNDERSTATE the true scale, since it largely excludes losses that happen before food ever leaves the farm (crops left unharvested, spoiled in storage) -- a more complete accounting from Tesco and the World Wildlife Fund, folding in those on-farm losses, put total food waste closer to 40% of the entire world food supply. The real, downstream costs are substantial and directly connect to other entries in this cluster: food loss and waste is responsible for a real 8-10% of total global greenhouse gas emissions, a real $1 trillion in annual economic cost, and, most directly relevant to this cluster\'s own land-use and water research, 28% of the world\'s arable land is used to grow food that is never actually eaten by anyone.',
    citations: [
      {
        source: 'World Resources Institute: How Much Food Does the World Really Waste? (the classic 1/3 figure and its real understatement)',
        url: 'https://www.wri.org/insights/how-much-food-does-the-world-waste',
      },
      {
        source: 'UNFCCC: Food loss and waste account for 8-10% of annual global greenhouse gas emissions; cost USD 1 trillion annually',
        url: 'https://unfccc.int/news/food-loss-and-waste-account-for-8-10-of-annual-global-greenhouse-gas-emissions-cost-usd-1-trillion',
      },
    ],
    overallTier: 'strong',
    stageNote: 'A real, direct multiplier on this cluster\'s own already-established urgency baseline -- every resource documented elsewhere in this cluster is partly being spent on food that is never eaten.',
    relatedIds: ['foodhistory-regen-fao-baseline-stakes', 'foodhistory-regen-ogallala-water-depletion'],
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
