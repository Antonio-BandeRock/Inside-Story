import type { DigestEntry } from './types';

// Fermented Foods -- 14 entries, drawn directly from this session's own
// "Fermented Foods: A Verified Bacterial-Strain Guide" research (11
// individually-verified strains, then a second pass adding kvass/kefir/
// dosing/sourcing). This is the in-app home for the bacterial-strain
// tracking workstream CLAUDE.md's own Next Steps has flagged as a future
// research thread -- these entries ARE that research, ported in.
export const FERMENTED_FOODS_ENTRIES: DigestEntry[] = [
  {
    id: 'fermented-lactobacillus-acidophilus',
    category: 'fermentedFoods',
    title: 'Lactobacillus acidophilus',
    teaser: 'The most commonly recognized yogurt culture -- and one of the better-studied single strains overall.',
    summary:
      'A homofermentative lactic acid bacterium found in most live-culture yogurt and many commercial probiotic blends. Real clinical evidence supports it for improving lactose digestion (it produces lactase during fermentation, reducing residual lactose in the finished product) and for restoring gut flora after antibiotic use. Thyroid-specific human trials of this strain alone don\'t exist yet -- its relevance here is as one contributor to overall gut microbial diversity, the mechanism this app\'s Gut & Microbiome research keeps returning to.',
    citations: [
      {
        source: 'Journal of Dairy Science -- "Lactobacillus acidophilus as a Dietary Adjunct for Milk to Aid Lactose Digestion in Humans"',
        url: 'https://www.sciencedirect.com/science/article/pii/S0022030283818876',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['gut-scfa-treg'],
  },
  {
    id: 'fermented-lactobacillus-plantarum',
    category: 'fermentedFoods',
    title: 'Lactobacillus plantarum (incl. strain Lp299v)',
    teaser: 'Found in sauerkraut, kimchi, and fermented olives -- and the specific strain with the most completed human trial data on this list.',
    summary:
      'A hardy, salt-tolerant strain that thrives in vegetable ferments specifically (unlike most dairy-associated strains). The commercially studied sub-strain Lp299v has real completed randomized trial data showing improved iron absorption and reduced markers of intestinal inflammation in IBS patients. General L. plantarum is also one of the strains shown in unrelated autoimmune-disease research (see Other Autoimmune Diseases) to help maintain gut barrier tight-junction proteins.',
    citations: [
      {
        source: 'Ducrotté et al. 2012, World Journal of Gastroenterology (Lp299v IBS RCT)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/22912552/',
      },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'fermented-bifidobacterium',
    category: 'fermentedFoods',
    title: 'Bifidobacterium species',
    teaser: 'The dominant genus in a healthy infant gut -- and one of the specific strains shown to rebuild the tight-junction protein occludin.',
    summary:
      'Several Bifidobacterium species (B. bifidum, B. longum, B. animalis) show up across yogurt, kefir, and many probiotic supplements. B. bifidum specifically has real mechanistic evidence for restoring occludin, one of the core tight-junction proteins that keeps the intestinal barrier sealed -- directly relevant to this app\'s own leaky-gut-repair research. Bifidobacterium counts also decline measurably with age and antibiotic exposure, both real, common reasons someone\'s baseline gut diversity might be lower than ideal.',
    citations: [
      {
        source: 'Hsieh et al. 2015, Physiological Reports -- "Strengthening of the intestinal epithelial tight junction by Bifidobacterium bifidum"',
        url: 'https://pubmed.ncbi.nlm.nih.gov/25780093/',
      },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'fermented-streptococcus-thermophilus',
    category: 'fermentedFoods',
    title: 'Streptococcus thermophilus',
    teaser: 'A yogurt/cheese starter culture, and genuinely not the pathogenic Streptococcus species people sometimes assume from the name.',
    summary:
      'Paired with L. bulgaricus as the two required starter cultures for anything legally labeled "yogurt" in most countries, S. thermophilus is a distinct, well-characterized, food-safe species unrelated to Streptococcus pyogenes or pneumoniae. It\'s notably efficient at breaking down lactose during fermentation, which is part of why traditional long-fermented yogurt is often better tolerated by lactose-sensitive people than fresh milk -- a real, mechanistic reason behind a folk claim this app\'s own Healing Stages guide already leans on.',
    citations: [
      {
        source: 'Codex Alimentarius CXS 243-2003, Standard for Fermented Milks',
        url: 'https://www.fao.org/fao-who-codexalimentarius/sh-proxy/es/?lnk=1&url=https%3A%2F%2Fworkspace.fao.org%2Fsites%2Fcodex%2FStandards%2FCXS+243-2003%2FCXS_243e.pdf',
      },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'fermented-leuconostoc-mesenteroides',
    category: 'fermentedFoods',
    title: 'Leuconostoc mesenteroides',
    teaser: "Sauerkraut's actual first colonizer -- most people have never heard its name.",
    summary:
      'The bacterium that kicks off sauerkraut fermentation isn\'t Lactobacillus at all -- it\'s Leuconostoc mesenteroides, which dominates the first few days, producing carbon dioxide and lowering pH just enough to make conditions hospitable for the more acid-tolerant Lactobacillus species that take over later (see the Sauerkraut Succession entry below). It\'s a real, distinct organism with its own metabolic profile, not simply an early-stage Lactobacillus.',
    citations: [
      {
        source: 'Microbiology Spectrum -- microbiome composition and biochemical changes during sauerkraut fermentation',
        url: 'https://journals.asm.org/doi/10.1128/spectrum.00168-22',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['fermented-sauerkraut-succession'],
  },
  {
    id: 'fermented-saccharomyces-boulardii',
    category: 'fermentedFoods',
    title: 'Saccharomyces boulardii',
    teaser: 'Not a bacterium at all -- a probiotic YEAST with real, strong clinical trial support.',
    summary:
      'Isolated from lychee and mangosteen fruit, S. boulardii is a tropical yeast, not a bacterium -- meaning it survives antibiotic courses that would wipe out every bacterial probiotic strain on this list, since antibiotics don\'t target yeast. It has genuinely strong RCT evidence (multiple meta-analyses) for preventing antibiotic-associated diarrhea and reducing C. difficile recurrence. It isn\'t naturally present in a home ferment -- it\'s taken as a standalone supplement, included here because "probiotic" doesn\'t only mean bacteria.',
    citations: [
      {
        source: 'McFarland 2010, World Journal of Gastroenterology (meta-analysis)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/20458757/',
      },
    ],
    overallTier: 'strong',
  },
  {
    id: 'fermented-sauerkraut-succession',
    category: 'fermentedFoods',
    title: 'Sauerkraut: A Real Microbial Succession, Not One Strain',
    teaser: 'Sauerkraut isn\'t "cabbage plus Lactobacillus" -- it\'s a scripted three-act handoff between different species.',
    summary:
      'Real fermentation ecology: Leuconostoc mesenteroides dominates days 1-3, producing enough acid to suppress spoilage organisms and pave the way for itself to be outcompeted; Lactobacillus brevis and other heterofermentative species take over as pH continues dropping; the more acid-tolerant Lactobacillus plantarum finishes the job over 2-4+ weeks, producing the bulk of the final, stable lactic acid. A sauerkraut eaten at day 3 genuinely has a different microbial profile than one eaten at day 21 -- both real, just different.',
    citations: [
      {
        source: 'Microbiology Spectrum -- microbiome composition and biochemical changes during sauerkraut fermentation',
        url: 'https://journals.asm.org/doi/10.1128/spectrum.00168-22',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['fermented-leuconostoc-mesenteroides', 'fermented-lactobacillus-plantarum'],
  },
  {
    id: 'fermented-kombucha',
    category: 'fermentedFoods',
    title: 'Kombucha (SCOBY)',
    teaser: 'A real symbiotic culture of bacteria AND yeast -- plus a real, measurable trace-alcohol content worth knowing about.',
    summary:
      'The "SCOBY" (symbiotic culture of bacteria and yeast) fermenting sweetened tea contains a genuine mixed community -- typically Acetobacter species, various yeasts, and often Gluconobacter -- distinct from the single-strain focus of most other entries here. Because yeast fermentation of sugar always produces some ethanol as a byproduct, commercially sold kombucha is capped at under 0.5% ABV to stay classified as non-alcoholic in most markets, but home-brewed batches (especially longer-fermented or a "second ferment") can measurably exceed that -- a real, practical caveat worth knowing, not a reason to avoid it outright.',
    citations: [
      {
        source: 'Jayabalan et al. 2014, Comprehensive Reviews in Food Science and Food Safety',
        url: 'https://ift.onlinelibrary.wiley.com/doi/abs/10.1111/1541-4337.12073',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['lifestyle-alcohol-advisory'],
  },
  {
    id: 'fermented-water-kefir',
    category: 'fermentedFoods',
    title: 'Water Kefir',
    teaser: 'A dairy-free alternative to milk kefir -- with the same real trace-alcohol caveat as kombucha.',
    summary:
      'Water kefir grains ferment sugar water (often with dried fruit added) via a different bacterial/yeast community than milk kefir grains -- genuinely not interchangeable starters despite the shared name. Like kombucha, yeast activity means real trace ethanol is produced; typically lower than kombucha at a similar brew time, but not zero, and rises the longer a batch ferments. A real, dairy-free ferment option, distinct from milk kefir\'s own much broader strain diversity (see next entry).',
    citations: [
      {
        source: 'Applied and Environmental Microbiology -- microbial diversity/metabolite kinetics of water kefir fermentation',
        url: 'https://journals.asm.org/doi/full/10.1128/aem.03978-13',
      },
    ],
    overallTier: 'weak',
  },
  {
    id: 'fermented-milk-kefir',
    category: 'fermentedFoods',
    title: 'Milk Kefir',
    teaser: 'The single most microbially diverse fermented food on this list -- genuinely 30+ species in one batch.',
    summary:
      'Traditional milk kefir grains host a real, complex symbiotic community -- often 30 or more distinct bacterial and yeast species living together in one starter culture, far beyond the handful of strains in a typical commercial yogurt. That diversity is exactly what this app\'s own gut-microbiome research keeps identifying as the real target (diversity itself, not any single "best" strain) -- kefir is one of the most direct, practical ways to work toward it through food rather than a supplement.',
    citations: [
      {
        source: 'PLOS ONE -- sequencing-based analysis of kefir grains and milks from multiple sources',
        url: 'https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0069371',
      },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'fermented-beet-kvass',
    category: 'fermentedFoods',
    title: 'Beet Kvass',
    teaser: 'A traditional Eastern European brine ferment with real folk-remedy standing and genuinely thin formal research.',
    summary:
      'Fermented beet brine (whole beets, salt, water, lacto-fermented several days to weeks) carries a long traditional-medicine reputation for liver/digestive support in Eastern European folk practice. Real, specific lab evidence now backs part of that: Lactobacillus strains isolated directly from fermented beetroot (genetically confirmed via 16S rDNA sequencing as >95% similar to L. paracasei/L. casei) showed strong real probiotic markers -- over 96% survival through simulated gastrointestinal conditions and over 53% adherence capability. Kvass itself as a finished beverage still hasn\'t been through a direct human clinical trial -- this is real strain-level evidence from the raw ferment, not a kvass outcome study.',
    citations: [
      {
        source: 'Evaluation of Probiotic and Antidiabetic Attributes of Lactobacillus Strains Isolated From Fermented Beetroot',
        url: 'https://pubmed.ncbi.nlm.nih.gov/35774469/',
      },
    ],
    overallTier: 'weak',
  },
  {
    id: 'fermented-fruit-brine',
    category: 'fermentedFoods',
    title: 'Fermented Fruit in Brine (e.g. Apple)',
    teaser: 'Less common than vegetable ferments -- but the same lacto-fermentation chemistry applies.',
    summary:
      "Most home fermentation defaults to vegetables (cabbage, cucumbers) because their lower natural sugar content favors lactic acid bacteria over the wild yeasts that would otherwise dominate a sweeter substrate and push the ferment toward alcohol instead. Fruit CAN be lacto-fermented in a salt brine the same way -- apple is a real, workable example -- but needs closer monitoring for that yeast/mold competition than a standard vegetable ferment, and the finished product is genuinely tarter and more complex than raw fruit, not simply 'fruit plus probiotics.'",
    citations: [
      {
        source: 'NCBI Bookshelf -- "Lactic Acid Fermentations," Applications of Biotechnology to Fermented Foods',
        url: 'https://www.ncbi.nlm.nih.gov/books/NBK234703/',
      },
    ],
    overallTier: 'weak',
  },
  {
    id: 'fermented-cfu-dosing',
    category: 'fermentedFoods',
    title: 'CFU Dosing: What the Numbers Actually Mean',
    teaser: 'A bigger number on the label isn\'t automatically a better probiotic -- here\'s the real science behind dosing.',
    summary:
      'Colony-forming units (CFU) measure how many live organisms were present at manufacture, not how many survive stomach acid or actually colonize the gut -- most clinical trials showing real benefit used doses in the 1-10 billion CFU range per day for a specific, named strain, not the 50-100+ billion CFU "mega-blends" often marketed as inherently superior. Higher doses aren\'t proven harmful, but they also aren\'t proven more effective without trial data for that specific strain at that specific dose -- the strain and the evidence behind it matter more than the raw number.',
    citations: [
      {
        source: 'Strain-Specificity and Disease-Specificity of Probiotic Efficacy: A Systematic Review and Meta-Analysis',
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5949321/',
      },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'fermented-sourcing-starters',
    category: 'fermentedFoods',
    title: 'Sourcing Real, Verified Starter Cultures',
    teaser: 'A grocery-store "probiotic" yogurt and a lab-verified single-strain starter are not the same tool.',
    summary:
      'Commercial yogurt is only required to contain the two legal minimum starter cultures (S. thermophilus and L. bulgaricus) at the time of manufacture -- live cultures can decline well before the sell-by date, and "contains live active cultures" labeling doesn\'t guarantee a specific strain or count. For anyone trying to work with a specific, research-backed strain (like Lp299v above), a verified single-strain starter culture (sold specifically for home fermentation, with a real certificate of analysis) is a genuinely different, more reliable tool than hoping a random store product happens to still be active.',
    citations: [
      {
        source: 'FDA 21 CFR 131.200 -- Yogurt standard of identity, live/active culture labeling',
        url: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-B/part-131/subpart-B/section-131.200',
      },
      {
        source: 'Codex Alimentarius CXS 243-2003, Standard for Fermented Milks',
        url: 'https://www.fao.org/fao-who-codexalimentarius/sh-proxy/es/?lnk=1&url=https%3A%2F%2Fworkspace.fao.org%2Fsites%2Fcodex%2FStandards%2FCXS+243-2003%2FCXS_243e.pdf',
      },
    ],
    overallTier: 'moderate',
  },
];
