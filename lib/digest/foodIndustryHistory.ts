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
export const FOOD_INDUSTRY_HISTORY_ENTRIES: DigestEntry[] = [
  // --- The Timeline ---
  {
    id: 'foodhistory-timeline-baseline-milling',
    category: 'foodIndustryHistory',
    title: 'The Long Baseline, and the First Real Break (~10,000 BCE – 1911)',
    teaser: 'For nearly all of agricultural history, flour still carried its own fiber and B vitamins -- until the steel roller mill changed that in a single generation.',
    summary:
      'For most of agricultural history, milling was done by stone, which couldn\'t fully separate wheat germ and bran from the endosperm -- flour still carried real fiber, B vitamins, and oil, and food was preserved by fermentation, salting, and drying rather than industrial chemistry. This isn\'t a nutritional utopia (real deficiency disease and famine were common) -- it\'s the real baseline every later change gets measured against. The steel roller mill, adopted widely from the 1870s and effectively universal by the 1880s, could fully strip the germ and bran from wheat for the first time, producing white flour with a genuinely long shelf life and, by design, far less of the original grain\'s real nutrition. In 1911, Crisco introduced industrially hydrogenated vegetable oil (trans fat) to the American diet -- a wholly new kind of fat molecule the human body had never encountered before, engineered for shelf stability rather than nutrition. Its real cardiovascular harm wasn\'t established until decades later (see this app\'s own Food Additives research).',
    citations: [
      {
        source: 'Roller milling technology and modern flour production (Wikipedia, cross-checked against milling-industry sources)',
        url: 'https://en.wikipedia.org/wiki/Flour_mill',
      },
      {
        source: 'FDA final determination on partially hydrogenated oils (2015) -- the same trans fat Crisco introduced in 1911, its harm not formally acted on for over a century',
        url: 'https://www.fda.gov/food/food-additives-petitions/final-determination-regarding-partially-hydrogenated-oils-removing-trans-fat',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['additive-trans-fats'],
  },
  {
    id: 'foodhistory-timeline-chemical-convenience',
    category: 'foodIndustryHistory',
    title: 'The Chemical Turn and Convenience Takes Over (1945 – 1976)',
    teaser: 'DDT, the Green Revolution, and margarine\'s rise all landed in the same three decades IBD first became a recognized disease of industrializing nations.',
    summary:
      'DDT, developed for wartime disease control, moved into mainstream agriculture after 1945; by the 1950s-60s, synthetic nitrogen fertilizer and a new generation of high-yield crop varieties (the "Green Revolution") reshaped farming worldwide. DDT was banned in the US in 1972, following well-documented ecological harm (Rachel Carson\'s Silent Spring, 1962) -- but the broader shift toward synthetic chemical inputs replacing traditional soil-management practices did not reverse. Over roughly the same span, partially hydrogenated oil use accelerated for its shelf stability and frying performance, and margarine consumption climbed steeply -- real US data shows the average person eating over 18 lbs of butter and just 2 lbs of margarine a year in 1930, inverting to roughly 5 lbs of butter and nearly 8 lbs of margarine by century\'s end. This is also the real historical window IBD was first clinically recognized specifically in industrializing regions (North America, Europe, Oceania) -- the "Emergence" stage of what researchers now describe as a four-stage global epidemiological pattern that non-industrialized nations are only entering decades later.',
    citations: [
      {
        source: 'EPA -- DDT: A Brief History and Status (1945 agricultural adoption, 1962 Silent Spring, 1972 US ban)',
        url: 'https://www.epa.gov/ingredients-used-pesticide-products/ddt-brief-history-and-status',
      },
      {
        source: 'Margarine and butter consumption trends across the 20th century (Wikipedia, cross-checked figures)',
        url: 'https://en.wikipedia.org/wiki/Margarine',
      },
      {
        source: 'Kaplan GG, Windsor JW 2021, Nature Reviews Gastroenterology & Hepatology -- "The four epidemiological stages in the global evolution of inflammatory bowel disease"',
        url: 'https://pubmed.ncbi.nlm.nih.gov/33033392/',
      },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'foodhistory-timeline-glyphosate-hfcs',
    category: 'foodIndustryHistory',
    title: 'Glyphosate and High-Fructose Corn Syrup Enter the Food Supply (1970s – 1980s)',
    teaser: 'Two new chemistries -- one in the field, one in the syrup line -- both arrived within the same decade.',
    summary:
      'Glyphosate was introduced in 1974 and became the world\'s most-used herbicide, closely tied to the rise of glyphosate-tolerant genetically modified crops from the mid-1990s onward -- see this category\'s own Pesticides section for the real, still-unsettled dispute over its safety. This is also the window synthetic food dyes, emulsifiers, and other additives (covered in this app\'s own Food Additives research) became routine, low-cost formulation tools. Separately, high-fructose corn syrup entered US food production in the 1970s and, driven by cane sugar price spikes and corn subsidies, had replaced most cane sugar in American soft drinks and processed food within a decade. A real 2004 analysis found HFCS consumption rose more than 1,000% between 1970 and 1990 -- far exceeding the change in intake of any other food or food group -- and directly named a temporal relationship between that rise and the US obesity epidemic. Celiac disease prevalence, tracked in one well-documented Finnish national cohort, roughly doubled between 1980 and 2000, almost exactly the same window.',
    citations: [
      {
        source: 'Bray GA, Nielsen SJ, Popkin BM 2004, American Journal of Clinical Nutrition -- "Consumption of high-fructose corn syrup in beverages may play a role in the epidemic of obesity"',
        url: 'https://pubmed.ncbi.nlm.nih.gov/15051594/',
      },
      {
        source: 'Taavela J, Kurppa K, Jaaskelainen T, et al. 2024, Alimentary Pharmacology & Therapeutics -- coeliac disease prevalence doubled in Finland from 1980 to 2000',
        url: 'https://pubmed.ncbi.nlm.nih.gov/37946663/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['foodhistory-pesticides-glyphosate-dispute'],
  },
  {
    id: 'foodhistory-timeline-modern-surge',
    category: 'foodIndustryHistory',
    title: 'The Real, Measured Modern Surge (1988 – Today)',
    teaser: 'Antinuclear antibodies nearly doubled, ultra-processed food became the majority of the American diet -- and one large cohort found the picture is more complicated than "everything is rising."',
    summary:
      'This is the window with the clearest real epidemiological data of the whole timeline. Antinuclear antibodies (ANA), the most common lab marker of autoimmunity in general, measurably increased in the US population between 1988 and 2012 per NHANES-based analysis. A large 2023 UK cohort study of 22 million people found real, but genuinely uneven, movement across 19 autoimmune conditions: coeliac disease incidence more than doubled (+119%) comparing 2017-19 to 2000-02, Sjogren\'s syndrome rose 109%, and Graves\' disease rose 107% -- while Hashimoto\'s thyroiditis itself was measured DECREASING 19% over the same window in that same cohort, a real, honest complication worth stating plainly rather than smoothing into a simple "autoimmune disease is rising" headline (possible explanations include real changes in diagnostic coding and clinical practice, not necessarily fewer real cases). Meanwhile, ultra-processed food\'s share of total US adult caloric intake rose from 53.5% in 2001-02 to 57.0% by 2017-18, with minimally-processed whole food specifically DISPLACED (falling from 32.7% to 27.4% of calories) rather than ultra-processed food simply adding calories on top of an otherwise unchanged diet. IBD has now reached the "Compounding Prevalence" stage in Western nations -- the most advanced of the four real epidemiological stages named above -- while newly industrializing nations are only now entering the earlier stages, on the same pattern Western nations went through decades ago.',
    citations: [
      {
        source: 'Dinse GE, Parks CG, Weinberg CR, et al. 2020, Arthritis & Rheumatology -- "Increasing Prevalence of Antinuclear Antibodies in the United States" (NHANES 1988-2012)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/32266792/',
      },
      {
        source: 'Conrad N, Misra S, Verbakel JY, et al. 2023, The Lancet -- incidence, prevalence, and co-occurrence of 19 autoimmune disorders in a 22-million-person UK cohort',
        url: 'https://pubmed.ncbi.nlm.nih.gov/37156255/',
      },
      {
        source: 'Juul F, Parekh N, Martinez-Steele E, Monteiro CA, Chang VW 2022, American Journal of Clinical Nutrition -- "Ultra-processed food consumption among US adults from 2001 to 2018"',
        url: 'https://pubmed.ncbi.nlm.nih.gov/34647997/',
      },
      {
        source: 'Kaplan GG, Windsor JW 2021, Nature Reviews Gastroenterology & Hepatology -- IBD\'s "Compounding Prevalence" stage in Western nations',
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
    category: 'foodIndustryHistory',
    title: 'Two Landmark Studies: Has Produce Itself Changed?',
    teaser: 'A US and a UK study, decades apart from each other, both found real declines in the same handful of nutrients.',
    summary:
      'A 2004 US study directly compared USDA\'s own published nutrient data for 43 garden crops between 1950 and 1999, adjusted for moisture content, and found statistically significant declines in protein, calcium (-16%), phosphorus (-9%), iron (-15%), riboflavin, and vitamin C. A UK study (Mayer, 1997) independently compared official UK food-composition tables from the 1930s and the 1980s and found significant declines in calcium, copper, magnesium, and sodium across vegetables, and copper, magnesium, iron, and potassium across fruit -- a genuinely separate dataset, in a different country, finding a similar real pattern.',
    citations: [
      {
        source: 'Davis DR, Epp MD, Riordan HD 2004, Journal of the American College of Nutrition -- historical nutrient decline in 43 garden crops, 1950-1999',
        url: 'https://pubmed.ncbi.nlm.nih.gov/15637215/',
      },
      {
        source: 'Mayer AM 1997 -- comparison of UK food-composition tables, 1930s vs. 1980s (FAO AGRIS record)',
        url: 'https://agris.fao.org/search/en/providers/122469/records/64775d87f2e6fe92b366cb43',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['foodhistory-soil-dilution-vs-depletion'],
  },
  {
    id: 'foodhistory-soil-dilution-vs-depletion',
    category: 'foodIndustryHistory',
    title: 'The Honest Complication: Is It Really the Soil?',
    teaser: 'A real methodological critique challenges "depleted soil" as the mechanism -- and points at breeding-for-yield instead.',
    summary:
      'A real, direct scientific critique exists of both landmark studies above, worth stating plainly rather than only citing the headline finding. Comparing food-composition tables published decades apart is genuinely difficult -- different labs, different analytical methods, different crop varieties, and different sampling all shift the numbers independent of anything actually changing in the soil or the plant. One direct rebuttal found that comparisons using matched, archived soil samples from the SAME fields over time did NOT show declining soil mineral content under intensive cultivation -- directly challenging "depleted soil" as the mechanism, even while the produce-nutrient decline itself, measured a different way, still holds up. What survives this critique, and what the research itself points to as the more likely driver, is the "dilution effect": decades of breeding crops specifically for higher yield and larger size has measurably increased the starch/water/bulk of many crops faster than it increased their real mineral and vitamin content -- the same real nutrients spread across more plant mass, at a lower concentration per bite, even when nothing about the soil itself has changed.',
    citations: [
      {
        source: '"Mineral Nutrient Composition of Vegetables, Fruits and Grains: The Context of Reports of Apparent Historical Declines" -- a direct critical reappraisal of the Davis (2004) and Mayer (1997) methodology',
        url: 'https://www.sciencedirect.com/science/article/pii/S0889157516302113',
      },
      {
        source: 'Davis DR, Epp MD, Riordan HD 2004 -- the genetic "dilution effect," discussed by the original authors as the most likely mechanism behind their own findings',
        url: 'https://pubmed.ncbi.nlm.nih.gov/15637215/',
      },
    ],
    overallTier: 'moderate',
    stageNote: 'Genuinely contested -- real scientific disagreement about the mechanism, not the underlying nutrient-decline finding itself.',
    relatedIds: ['foodhistory-soil-landmark-studies', 'foodhistory-soil-real-depletion'],
  },
  {
    id: 'foodhistory-soil-real-depletion',
    category: 'foodIndustryHistory',
    title: 'Where Real Soil Depletion IS Well-Documented',
    teaser: 'A controlled, same-field, 75-year trial found real trace-mineral loss under intensive tillage -- a stronger design than the historical table comparisons above.',
    summary:
      'Separate from the contested historical-comparison studies above, a real, controlled long-term trial (comparing 75 years of continuously tilled and nitrogen-fertilized plots against an undisturbed grass-pasture control, same field, same starting soil) found genuinely depleted extractable zinc (-43%) and copper (-53%) under sustained cultivation -- a real, apples-to-apples finding, not a decades-apart table comparison. Synthetic NPK fertilizer (nitrogen-phosphorus-potassium) replaces the three nutrients plants need in the largest volume, but does nothing to replenish trace minerals like zinc, magnesium, and selenium that older, less-intensive practices (crop rotation, fallow periods, animal manure) used to maintain more naturally. The honest synthesis: both things are likely true at once, and they\'re not the same claim. The historical "food today has less calcium/iron/vitamin C than in 1950" comparisons are real findings best explained mainly by breeding for yield (dilution), not primarily by depleted soil -- while separately, and on more solid methodological ground, real trace-mineral soil depletion under decades of intensive, synthetic-fertilizer-only farming is directly measured and real. Modern produce likely does deliver somewhat less real nutrition per bite than it once did, for at least two real, partly-independent reasons, not one single, simple story.',
    citations: [
      {
        source: 'Micronutrients decline under long-term tillage and nitrogen fertilization -- a real, controlled, same-field comparison directly confirming trace-mineral soil depletion under sustained conventional cultivation',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6700142/',
      },
    ],
    overallTier: 'strong',
    stageNote: 'Directly relevant to selenium and iodine, both soil-dependent nutrients this app already tracks as protective against thyroid autoimmunity specifically.',
    relatedIds: ['foodhistory-mechanism-soil-nutrients-bridge', 'nutrient-selenium', 'nutrient-iodine'],
    chart: {
      title: 'Trace Mineral Loss After 75 Years of Continuous Tillage',
      unit: '%',
      data: [
        { label: 'Zinc', value: 43 },
        { label: 'Copper', value: 53 },
      ],
      sourceNote: 'Real, controlled same-field comparison, PMC6700142',
    },
  },

  // --- Pesticides & Carcinogens ---
  {
    id: 'foodhistory-pesticides-ddt',
    category: 'foodIndustryHistory',
    title: 'DDT: The First Real, Resolved Case',
    teaser: 'A widely used, government-approved pesticide that took 27 years to be recognized and banned -- a real precedent, not a hypothetical one.',
    summary:
      'DDT is the cleanest, most fully-resolved example in this whole document: introduced into mainstream agricultural use after 1945, it accumulated in the food chain and the environment for 27 years before the US banned it in 1972, following well-documented ecological and health concerns (Rachel Carson\'s Silent Spring, 1962, was the turning point for public awareness). Its own history is worth naming specifically because it establishes that "widely used, government-approved pesticide turns out to carry real long-term harm, discovered only after decades of exposure" isn\'t a hypothetical pattern in this space -- it\'s a real, documented one, which is exactly why glyphosate\'s own current, unsettled status deserves real scrutiny rather than automatic trust in either direction.',
    citations: [
      {
        source: 'EPA -- DDT: A Brief History and Status',
        url: 'https://www.epa.gov/ingredients-used-pesticide-products/ddt-brief-history-and-status',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['foodhistory-pesticides-glyphosate-dispute'],
  },
  {
    id: 'foodhistory-pesticides-glyphosate-dispute',
    category: 'foodIndustryHistory',
    title: 'Glyphosate: The Real, Current Dispute',
    teaser: 'IARC calls it probably carcinogenic; the EU and WHO/FAO disagree; a 2025 animal study just reopened the question at "safe" doses.',
    summary:
      'This section covers real, contested science honestly -- credible bodies genuinely disagree here. IARC classified glyphosate as "probably carcinogenic to humans" (Group 2A) in March 2015, based on limited human evidence, sufficient animal evidence, and strong genotoxicity evidence. Every major regulatory body that has separately reviewed the same underlying evidence since -- the EU\'s own risk assessment and a joint WHO/FAO panel among them -- has NOT confirmed IARC\'s classification, concluding glyphosate is unlikely to pose a carcinogenic risk at real-world exposure levels. A 2025 multi-institutional animal study (the Ramazzini Institute\'s "Global Glyphosate Study") dosed rats from before birth through 2 years at levels currently considered safe (the EU\'s own Acceptable Daily Intake and No-Observed-Adverse-Effect-Level) and found increased tumor incidence at multiple sites in every treatment group -- a real, recent, methodologically serious finding that directly reopens the question at doses regulators currently call safe. Separately, the real, large, NIH-funded Agricultural Health Study (~51,000 licensed pesticide applicators followed since the 1990s) has found real, specific dose-response associations between certain individual pesticides and certain cancers (fonofos and leukemia; imazethapyr and bladder/colon cancer) -- genuine human evidence, though for specific pesticides rather than glyphosate broadly, and at real occupational-level exposure, not ordinary dietary exposure.',
    citations: [
      { source: 'IARC -- glyphosate classified Group 2A, "probably carcinogenic to humans" (2015)', url: 'https://www.iarc.who.int/featured-news/media-centre-iarc-news-glyphosate/' },
      { source: 'EFSA 2023 peer review -- EU and WHO/FAO assessments have not confirmed IARC\'s classification', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10369247/' },
      { source: 'Ramazzini Institute 2025 "Global Glyphosate Study" -- increased tumor incidence at currently-permitted doses (George Mason University)', url: 'https://www.gmu.edu/news/2025-06/international-study-reveals-glyphosate-weed-killers-cause-multiple-types-cancer' },
      { source: 'Agricultural Health Study -- real occupational dose-response pesticide-cancer associations', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9880902/' },
    ],
    overallTier: 'moderate',
    stageNote: 'Genuinely contested -- read the IARC and EFSA findings alongside each other, not as one overriding the other.',
    relatedIds: ['foodhistory-pesticides-ddt', 'foodhistory-pesticides-glyphosate-gut'],
  },
  {
    id: 'foodhistory-pesticides-glyphosate-gut',
    category: 'foodIndustryHistory',
    title: 'What Glyphosate Does to the Gut, Specifically',
    teaser: 'The weakest-evidenced claim in this whole document, stated precisely rather than overstated.',
    summary:
      'This is the piece most directly relevant to this app\'s own gut-focused mission, and it\'s genuinely the weakest-evidenced claim in this whole category -- worth being precise about rather than overstating. Glyphosate\'s actual mechanism (blocking the shikimate pathway, an enzyme pathway plants and many microbes use but humans don\'t have) is real and well-understood. The real complication: most human gut bacteria don\'t actually run a complete, active version of that pathway (roughly 55% of species show real theoretical sensitivity, not the whole microbiome), meaning the simple "glyphosate poisons your gut bacteria the same way it poisons weeds" story is more mechanistically complicated than it\'s often presented. Real studies do find measurable gut dysbiosis at glyphosate exposure levels approximating the real US Acceptable Daily Intake -- but the field itself describes the evidence base as limited and calls for further study, not settled.',
    citations: [
      {
        source: '"Does Glyphosate Affect the Human Microbiota?" -- a direct review of dysbiosis evidence and the shikimate-pathway mechanistic complication',
        url: 'https://pubmed.ncbi.nlm.nih.gov/35629374/',
      },
    ],
    overallTier: 'weak',
  },

  // --- Whole Foods Wrongly Blamed ---
  {
    id: 'foodhistory-scapegoat-salt',
    category: 'foodIndustryHistory',
    title: 'Salt: Eaten for Millennia, Blamed for a Modern Problem',
    teaser: 'Real blood-pressure evidence exists -- but roughly 70% of dietary sodium never came from a home salt shaker to begin with.',
    summary:
      'Salt is the clearest case of a whole-food ingredient carrying more blame than the real evidence actually supports. The 1988 INTERSALT study -- the largest, most-cited study behind the modern salt-reduction consensus -- found a real, population-level association between sodium intake and blood pressure across 52 communities worldwide, and is the actual foundation of decades of "cut the salt" public health messaging. But real, more recent meta-analyses complicate the simple version of that story: one large analysis found BOTH low sodium intake AND excessive sodium intake associated with increased mortality compared to usual/moderate intake -- a real, still-debated J- or U-shaped relationship, not the clean "less is always better" line the public message implies. "Salt sensitivity" is also a real, well-documented individual-variation phenomenon, not a universal rule -- roughly 46% of people show a meaningful blood-pressure response to a high-vs-low sodium diet, and 46% don\'t; genetics, age, and existing hypertension status are all real, measured modifiers of who\'s actually affected. The most directly relevant fact of all: roughly 70% of sodium in the modern diet comes from packaged, processed, and restaurant food -- only 5-6% comes from salt added during home cooking or at the table. Salt reduction genuinely helps blood pressure in real trials, for real people, especially those who are salt-sensitive -- that part isn\'t a myth. But the idea that salt itself, as humans have used it to season and preserve whole food for thousands of years, is what\'s driving the modern hypertension epidemic doesn\'t hold up as cleanly as the public message suggests. The salt shaker took the public blame; the processed-food formula is the more direct, better-evidenced culprit.',
    citations: [
      { source: 'INTERSALT Cooperative Research Group 1988 -- sodium intake and blood pressure across 52 communities worldwide', url: 'https://pubmed.ncbi.nlm.nih.gov/3416162/' },
      { source: 'Real-world meta-analysis finding a J/U-shaped mortality relationship with sodium intake, not a linear one', url: 'https://pubmed.ncbi.nlm.nih.gov/24651634/' },
      { source: 'Individual salt-sensitivity as a real, well-documented physiological subgroup effect (~46% of people affected)', url: 'https://pubmed.ncbi.nlm.nih.gov/27614755/' },
      { source: 'American College of Cardiology / CardioSmart -- roughly 70% of US dietary sodium comes from processed and restaurant food', url: 'https://www.cardiosmart.org/news/2017/6/the-bulk-of-us-salt-intake-comes-from-processed-foods' },
    ],
    overallTier: 'moderate',
    stageNote: 'Genuinely contested on the exact dose-response curve -- real on the "mostly comes from processed food" point.',
    relatedIds: ['foodhistory-scapegoat-pattern'],
  },
  {
    id: 'foodhistory-scapegoat-margarine',
    category: 'foodIndustryHistory',
    title: 'Butter → Margarine: An Engineered "Healthier" Substitute That Made Things Worse',
    teaser: 'A real, documented public-health failure -- told accurately, without leaning on a claim that doesn\'t actually check out.',
    summary:
      'A direct correction, checked before including it here: the popular claim that margarine is "one molecule away from plastic" is not chemically accurate -- a real fact-check found margarine\'s triglycerides (a glycerol backbone with three fatty acids) and a plastic like polyethylene (a long repeating hydrocarbon polymer chain) are structurally unrelated, more than "one molecule" apart by any real chemical measure. That claim is dropped here rather than repeated, because the real, verified story underneath it is damning enough on its own. In 1948, the American Heart Association received $1.7 million (roughly $20 million today) from Procter & Gamble, maker of Crisco -- funding that transformed the AHA from a small professional society into the influential body it is today. In 1961, the AHA issued its first dietary recommendations: limit saturated fat (butter, animal fat) and replace it with polyunsaturated vegetable oils and margarine. Ancel Keys\' 1958 Seven Countries Study, the real scientific foundation that 1961 guidance leaned on, has a real, documented selectivity problem: Keys had data available from 22 countries but published results from the 7 that fit his hypothesis -- countries like France, with high fat intake and comparatively low heart disease rates at the time, weren\'t included. The real, ultimate irony: the margarine widely recommended in place of butter for decades was, until the 2015-2018 US phase-out, loaded with industrially-produced trans fat -- a genuinely novel fat molecule the body had never evolved to handle, later confirmed to raise LDL cholesterol AND lower HDL cholesterol simultaneously, worse for real cardiovascular outcomes than the saturated fat in the butter it replaced. Butter -- a simple, single-ingredient whole food eaten for millennia -- got recast as the dangerous choice, while an industrially hydrogenated substitute engineered for shelf life got marketed as the responsible one, for the better part of half a century, on the strength of a funding relationship and a selectively-reported study.',
    citations: [
      { source: 'AHA/Procter & Gamble funding history and Keys\' Seven Countries Study selectivity, both documented in the same review', url: 'https://pubmed.ncbi.nlm.nih.gov/36477384/' },
      { source: 'FDA final determination on partially hydrogenated oils (2015) -- margarine\'s own real trans-fat harm, already covered in this app\'s Food Additives research', url: 'https://www.fda.gov/food/food-additives-petitions/final-determination-regarding-partially-hydrogenated-oils-removing-trans-fat' },
      { source: 'Margarine and butter consumption trends across the 20th century (Wikipedia, cross-checked)', url: 'https://en.wikipedia.org/wiki/Margarine' },
    ],
    overallTier: 'moderate',
    relatedIds: ['additive-trans-fats', 'foodhistory-scapegoat-pattern'],
  },
  {
    id: 'foodhistory-scapegoat-sugar',
    category: 'foodIndustryHistory',
    title: 'Sugar\'s Own Real, Documented Cover Story',
    teaser: 'About as close as nutrition history gets to a smoking gun: real internal industry documents, directly analyzed.',
    summary:
      'This is the piece that helps explain WHY whole fats like butter took the fall in the first place -- and it\'s one of the most directly documented cases of deliberate scientific distortion in this entire category, not an inference. A 2016 historical analysis of internal Sugar Research Foundation documents found the sugar industry directly sponsored a research program in the 1960s-70s that "successfully cast doubt about the hazards of sucrose while promoting fat as the dietary culprit" in coronary heart disease -- including funding a real, influential 1967 Harvard review that downplayed sugar\'s role, without disclosing the funding source at the time. This is about as close as nutrition history gets to a smoking gun: a real, documented, funded effort to shift public and scientific blame away from a processed ingredient (refined sugar) and onto a whole, traditional food (saturated animal fat) instead -- running on almost exactly the same historical timeline as the margarine-over-butter shift, and very likely reinforcing it.',
    citations: [
      {
        source: 'Kearns CE, Schmidt LA, Glantz SA 2016, JAMA Internal Medicine -- "Sugar Industry and Coronary Heart Disease Research: A Historical Analysis of Internal Industry Documents"',
        url: 'https://pubmed.ncbi.nlm.nih.gov/27617709/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['foodhistory-scapegoat-margarine', 'foodhistory-scapegoat-pattern'],
  },
  {
    id: 'foodhistory-scapegoat-eggs',
    category: 'foodIndustryHistory',
    title: 'Eggs: Rehabilitated, After Decades of Blame',
    teaser: 'A real, official reversal -- most people\'s blood cholesterol barely moves with dietary cholesterol at all.',
    summary:
      'Eggs -- another simple, single-ingredient whole food -- spent decades under a real, official 300mg/day dietary cholesterol ceiling built almost entirely around limiting egg consumption, based on the same broad, era-of-Keys assumption that dietary cholesterol directly raises blood cholesterol for everyone. A 2020 American Heart Association science advisory formally explains why recent dietary guidelines eliminated that specific numeric limit -- real observational evidence "generally does not indicate a significant association" between dietary cholesterol and cardiovascular disease risk for most people, with the advisory instead recommending real, whole dietary patterns over a single-nutrient number. Real modern research found most people are "hypo-responders," where dietary cholesterol has only a modest effect on blood cholesterol compared to the far larger real effect of saturated and trans fat intake -- the actual guideline limit was dropped as a direct result.',
    citations: [
      {
        source: 'American Heart Association 2020 science advisory -- dietary cholesterol, blood cholesterol, and cardiovascular disease risk',
        url: 'https://pubmed.ncbi.nlm.nih.gov/31838890/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['foodhistory-scapegoat-pattern'],
  },
  {
    id: 'foodhistory-scapegoat-pattern',
    category: 'foodIndustryHistory',
    title: 'The Honest Pattern Across All Four Cases',
    teaser: 'The same shape repeats every time: a real whole food takes the blame, while its manufactured replacement gets the pass.',
    summary:
      'The same shape repeats every time: a real whole food, eaten for generations with no clear population-level harm, gets blamed based on early, incomplete, or selectively-reported science -- while an industrially manufactured substitute, sometimes directly tied to the funding behind that same science, gets promoted as the responsible choice. Margarine over butter. Fat-blame over sugar. A blanket cholesterol ceiling over a real, more complicated individual physiology. And salt -- millennia-old, genuinely necessary for human life -- carrying the public blame for a sodium problem actually manufactured almost entirely by the processed-food industry itself. None of this means every whole food is automatically safe or that industry always lies -- it means the specific, real history of nutrition science has a real, repeated pattern worth knowing, and it\'s a pattern that consistently favors returning to simple, whole ingredients over trusting whichever engineered substitute is currently being marketed as the "healthier" choice.',
    citations: [
      { source: 'Kearns CE, Schmidt LA, Glantz SA 2016, JAMA Internal Medicine (the clearest single documented instance of the pattern)', url: 'https://pubmed.ncbi.nlm.nih.gov/27617709/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['foodhistory-scapegoat-salt', 'foodhistory-scapegoat-margarine', 'foodhistory-scapegoat-sugar', 'foodhistory-scapegoat-eggs', 'foodhistory-opinion-synthesis'],
  },

  // --- The Mechanism Bridge ---
  {
    id: 'foodhistory-mechanism-gut-barrier',
    category: 'foodIndustryHistory',
    title: 'The Gut Barrier Is the Real, Physical Connection Point',
    teaser: 'Two already-verified mechanisms in this app\'s own research explain how "the food changed" could plausibly reach "the immune system noticed."',
    summary:
      'Everything in this category\'s Timeline is trend data -- real, but on its own just two lines moving in the same direction. This is the actual proposed bridge between them, built entirely from mechanisms this app\'s own research has already independently verified elsewhere, not new claims. Ultra-processed food\'s own emulsifiers (carboxymethylcellulose, polysorbate 80) directly thin the protective gut mucus layer and increase intestinal permeability in real, controlled human and animal trials -- already covered in this app\'s Food Additives research. Gliadin (from gluten, now a much larger share of the diet than in 1870, thanks to industrial milling and wheat breeding) triggers real zonulin release, directly loosening the tight junctions between gut cells -- already covered in Gut & Microbiome. A gut that\'s genuinely more permeable lets more undigested food protein and bacterial fragments reach the immune system than it should -- the real, physical starting point for molecular mimicry and the Th17/Treg imbalance this app\'s own research keeps finding underneath rheumatoid arthritis, IBD, multiple sclerosis, lupus, and Hashimoto\'s alike.',
    citations: [
      { source: 'Chassaing B, et al. 2015, Nature -- dietary emulsifiers thin gut mucus and alter microbiota', url: 'https://pubmed.ncbi.nlm.nih.gov/25731162/' },
      { source: 'Fasano A 2011, Physiological Reviews -- zonulin, gliadin, and intestinal barrier function', url: 'https://pubmed.ncbi.nlm.nih.gov/21248165/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['additive-emulsifiers-cmc-polysorbate80', 'gut-zonulin-gliadin'],
  },
  {
    id: 'foodhistory-mechanism-disappearing-microbiota',
    category: 'foodIndustryHistory',
    title: 'The Disappearing-Microbiota Half of the Story',
    teaser: 'A real, separate hypothesis: it isn\'t just what industrial food does directly -- it\'s what antibiotics, C-sections, and formula feeding have quietly removed.',
    summary:
      'Separately from what industrialized food does directly, a real, independent hypothesis (Blaser & Falkow, and independently Rook) argues the ancestral gut microbiota itself has been genuinely depleted across generations -- not just disrupted temporarily -- by antibiotics, C-sections, formula feeding, and intensive hygiene, each of which became standard practice across roughly the same 20th-century window this timeline covers. Losing specific ancestral microbial species alters the immune system\'s own developmental "training," a real, separate mechanism from the food-additive/permeability story above, but one running on the same real historical timeline and pointing at the same real downstream outcome: rising chronic and autoimmune disease.',
    citations: [
      {
        source: 'Blaser MJ, Falkow S 2009, Nature Reviews Microbiology -- "The theory of disappearing microbiota and the epidemics of chronic diseases"',
        url: 'https://pubmed.ncbi.nlm.nih.gov/28749457/',
      },
    ],
    overallTier: 'moderate',
    stageNote: 'A real, credible, actively-researched hypothesis, not yet fully proven.',
  },
  {
    id: 'foodhistory-mechanism-soil-nutrients-bridge',
    category: 'foodIndustryHistory',
    title: 'Where Soil and Pesticides Plug Back Into Thyroid-Specific Nutrients',
    teaser: 'Selenium and iodine are exactly the soil-dependent trace minerals the depletion research above documents declining.',
    summary:
      'This is the direct, three-way tie between this category\'s own Soil and Pesticides sections and the rest of this app\'s research. Selenium and iodine (both genuinely soil-dependent, both already covered in this app\'s Nutrients research as real, protective nutrients against thyroid autoimmunity specifically) are exactly the kind of trace mineral the soil-depletion research documents declining under intensive, synthetic-fertilizer-only farming -- meaning a genuinely nutrient-thinner food supply may be providing measurably less of the specific defensive nutrients someone with Hashimoto\'s most needs, at the same historical moment processed food and gut-barrier disruption are asking more of the immune system, not less. Whether pesticide residue itself adds a real, direct, additional hit to gut-microbiome diversity remains a real, weak-to-moderate, still-developing piece of evidence, not yet a settled one.',
    citations: [
      {
        source: 'Micronutrients decline under long-term tillage and nitrogen fertilization, including zinc, copper, and other trace-mineral-family depletion',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6700142/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['foodhistory-soil-real-depletion', 'nutrient-selenium', 'nutrient-iodine'],
  },

  // --- The Opinion ---
  {
    id: 'foodhistory-opinion-synthesis',
    category: 'foodIndustryHistory',
    title: 'Where I Actually Land on All This',
    teaser: 'Explicitly a personal read, not a citation -- written to be argued with, not just accepted.',
    summary:
      'Every individual piece of this category is real. Where I\'d push back gently on the strongest version of the story: autoimmune disease incidence rising alongside industrialized food is not, by itself, proof the food caused it. A real share of the rise -- probably a meaningful share, though nobody can cleanly separate it out -- is genuinely better diagnosis and testing (the ANA-antibody test itself became far more sensitive and far more commonly ordered across exactly this same window), an aging population living long enough to develop disease that would once have gone undiagnosed, and non-food environmental exposures (air pollution, endocrine-disrupting plastics, occupational chemicals) that this app\'s own Lifestyle & Environment research already covers as real, independent contributors running on their own parallel timeline. That said, I don\'t think that honest caveat lets the food-industry story off the hook, either. The gut-barrier mechanism is real and directly measured, not speculative -- emulsifiers really do thin mucus, gliadin really does trigger zonulin, and both effects show up in controlled trials, not just population correlations. The soil/nutrient story survives its own methodological critique in a narrower but still real form. And the pattern of "food industry replaces a real, whole ingredient with an industrially engineered substitute, decades pass, the substitute\'s real harm gets discovered afterward" isn\'t a one-off -- it happened with trans fat, and the DDT story shows the identical pattern outside food specifically. Glyphosate\'s own current, unsettled status looks like it\'s sitting exactly where trans fat sat in the 1980s: officially cleared, genuinely disputed, with real animal data already pointing at a problem years before consensus catches up. My honest overall take: I\'d call the food-industry-to-autoimmune-disease connection a real, substantial contributor operating alongside several other real contributors -- not the single, sole explanation, and not something to dismiss as "just correlation" either, given how directly several of the individual mechanistic links (not just the population trend lines) have actually been demonstrated. The practical version of that belief is exactly what this app is already built around: since you can\'t wait for a settled, all-cause answer before acting, eating more like the pre-1870s baseline -- whole ingredients, real fermentation, minimal industrial processing, food grown without leaning entirely on synthetic inputs -- is a reasonable, evidence-consistent bet regardless of how the harder causal questions eventually resolve. Genuinely open to being argued out of any piece of this.',
    citations: [],
    overallTier: 'moderate',
    stageNote: 'Explicitly a stated opinion, not a citation-backed claim -- written for discussion, 2026-08-07.',
    relatedIds: [
      'foodhistory-mechanism-gut-barrier',
      'foodhistory-soil-dilution-vs-depletion',
      'foodhistory-pesticides-glyphosate-dispute',
      'foodhistory-scapegoat-pattern',
    ],
  },
];
