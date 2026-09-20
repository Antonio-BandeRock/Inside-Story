import type { DigestEntry } from './types';

// Fermented Foods -- 15 entries, drawn directly from this session's own
// "Fermented Foods: A Verified Bacterial-Strain Guide" research (11
// individually-verified strains, then a second pass adding kvass/kefir/
// dosing/sourcing). This is the in-app home for the bacterial-strain
// tracking workstream CLAUDE.md's own Next Steps has flagged as a future
// research thread -- these entries ARE that research, ported in.
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
// 2026-08-08, same day, third change: every entry now carries `category:
// 'basicHealth'` as part of the Digest-wide Hashimoto's/Basic Health
// restructure (see types.ts's own header comment). Every strain and ferment
// here is real, condition-agnostic microbiology -- nothing in this category
// requires Hashimoto's specifically to matter, so unlike most of this
// Digest's other mixed categories, this one didn't need any per-entry split.
//
// 2026-08-26: a 16th entry, `fermented-filtered-water`, added directly
// alongside a corpus-wide fix making every curated recipe's own water
// ingredient say "filtered water" (fermentation recipes specifically say
// "filtered, unchlorinated water"). Direct instruction: "this app
// promotes the use of filtered water and should always continue to push
// that."
export const FERMENTED_FOODS_ENTRIES: DigestEntry[] = [
  {
    id: 'fermented-lactobacillus-acidophilus',
    category: 'basicHealth',
    title: 'Lactobacillus acidophilus Is the Yogurt Strain With the Most Research Behind It',
    teaser: 'The name on nearly every yogurt label, and one of the more well-researched strains on this whole list.',
    summary: "Walk down a grocery aisle and L. Acidophilus is probably the one probiotic name that sounds familiar, printed on yogurt cartons and supplement labels alike, often without much explanation of what it does. It's a homofermentative lactic acid bacterium found in most live-culture yogurt and many commercial probiotic blends. Clinical evidence supports it for improving lactose digestion (it produces lactase during fermentation, reducing residual lactose in the finished product) and for restoring gut flora after antibiotic use. Thyroid-specific human trials of this strain alone don't exist yet. Its relevance here is as one contributor to overall gut microbial diversity, the mechanism the Gut & Microbiome research keeps returning to as the target.",
    citations: [
      {
        source: 'Kim & Gilliland 1983, Journal of Dairy Science: "Lactobacillus acidophilus as a Dietary Adjunct for Milk to Aid Lactose Digestion in Humans"',
        url: 'https://pubmed.ncbi.nlm.nih.gov/6409948/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['glossary-scfa', 'glossary-treg', 'mentalhealth-gut-scfa-mood-mechanism'],
  },
  {
    id: 'fermented-lactobacillus-plantarum',
    category: 'basicHealth',
    title: 'Lactobacillus plantarum, Found in Sauerkraut, Kimchi and Fermented Olives, Has the Most Completed Human Trials of Any Ferment Strain',
    teaser: 'A hardy strain built for vegetables, not dairy, and the specific sub-strain with the strongest completed human trial data here.',
    summary: "Most of the strains here showed up first in dairy. L. Plantarum's home is vegetables. A hardy, salt-tolerant strain that thrives in vegetable ferments specifically, unlike most dairy-associated strains. The commercially studied sub-strain Lp299v has completed randomized trial data showing improved iron absorption and reduced markers of intestinal inflammation in IBS patients. General L. Plantarum is also documented, in separate research covered elsewhere, to help maintain gut-barrier tight-junction proteins.",
    citations: [
      {
        source: 'Ducrotté et al. 2012, World Journal of Gastroenterology (Lp299v IBS RCT)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/22912552/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['ibs-overview'],
  },
  {
    id: 'fermented-bifidobacterium',
    category: 'basicHealth',
    title: 'Bifidobacterium Species Dominate a Healthy Infant Gut and Rebuild a Specific Tight-Junction Protein',
    teaser: "The genus that dominates a healthy newborn's gut, and the specific one shown to rebuild occludin, a structural piece of the gut barrier.",
    summary: "Before a baby ever eats solid food, Bifidobacterium is already one of the dominant residents of a healthy infant gut. It doesn't stay that dominant forever, and that decline turns out to matter. Several Bifidobacterium species (B. Bifidum, B. Longum, B. Animalis) show up across yogurt, kefir, and many probiotic supplements. B. Bifidum specifically has mechanistic evidence for restoring occludin, one of the core tight-junction proteins that keeps the intestinal barrier sealed, directly relevant to the leaky-gut-repair research. Bifidobacterium counts also decline measurably with age and antibiotic exposure, both common reasons someone's baseline gut diversity might be lower than ideal. A specific repair mechanism attached to a genus most people only vaguely associate with \"good bacteria\" in general.",
    citations: [
      {
        source: 'Hsieh et al. 2015, Physiological Reports: "Strengthening of the intestinal epithelial tight junction by Bifidobacterium bifidum"',
        url: 'https://pubmed.ncbi.nlm.nih.gov/25780093/',
      },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'fermented-streptococcus-thermophilus',
    category: 'basicHealth',
    title: 'Streptococcus thermophilus Is a Yogurt Starter Culture Unrelated to the Pathogenic Streptococcus Species',
    teaser: 'The name alone makes people nervous. The actual organism has nothing to do with strep throat.',
    summary: '"Streptococcus" is a genus name that understandably makes people uneasy. It\'s also the genus behind strep throat and other infections. S. Thermophilus deserves a separate introduction. Paired with L. Bulgaricus as the two required starter cultures for anything legally labeled "yogurt" in most countries, S. Thermophilus is a distinct, well-characterized, food-safe species entirely unrelated to Streptococcus pyogenes or pneumoniae. It\'s notably efficient at breaking down lactose during fermentation, part of why traditional long-fermented yogurt is often better tolerated by lactose-sensitive people than fresh milk, a mechanistic reason behind a folk claim the Healing Stages guide already leans on. A safe, useful organism, saddled with a name that does it no favors.',
    citations: [
      {
        source: 'Global Regulatory Frameworks for Fermented Foods: A Review (Frontiers in Nutrition, 2022), discussing Codex Alimentarius CXS 243-2003',
        url: 'https://www.frontiersin.org/journals/nutrition/articles/10.3389/fnut.2022.902642/full',
      },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'fermented-leuconostoc-mesenteroides',
    category: 'basicHealth',
    title: 'Leuconostoc mesenteroides Is Sauerkraut\'s First Colonizer, and Almost Nobody Has Heard Its Name',
    teaser: "Ask most people what turns cabbage into sauerkraut and they'll say \"Lactobacillus.\" That skips the organism that starts the whole process.",
    summary:
      "Sauerkraut's fermentation gets credited almost entirely to Lactobacillus in casual conversation. The first act belongs to a different organism entirely. The bacterium that kicks off sauerkraut fermentation isn't Lactobacillus at all. It's Leuconostoc mesenteroides, which dominates the first few days, producing carbon dioxide and lowering pH just enough to make conditions hospitable for the more acid-tolerant Lactobacillus species that take over later. A distinct organism with its metabolic profile, not simply an early-stage Lactobacillus standing in until the \"real\" bacteria arrive. See the Sauerkraut Succession entry below for the full three-act story.",
    citations: [
      {
        source: 'Microbiology Spectrum: microbiome composition and biochemical changes during sauerkraut fermentation',
        url: 'https://journals.asm.org/doi/10.1128/spectrum.00168-22',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['fermented-sauerkraut-succession'],
  },
  {
    id: 'fermented-saccharomyces-boulardii',
    category: 'basicHealth',
    title: 'Saccharomyces boulardii Is a Probiotic Yeast, Not a Bacterium, With Strong Clinical Trial Support',
    teaser: 'Every other strain here is a bacterium. This one is a yeast, isolated from tropical fruit, with some of the strongest trial evidence here.',
    summary:
      "Every bacterial strain above shares one thing Saccharomyces boulardii does not: it is a yeast. Isolated from lychee and mangosteen fruit, S. Boulardii is a tropical yeast, not a bacterium, meaning it survives antibiotic courses that would wipe out every bacterial probiotic strain, since antibiotics don't target yeast. It has strong RCT evidence, multiple meta-analyses, for preventing antibiotic-associated diarrhea and reducing C. Difficile recurrence. It isn't naturally present in a home ferment. It's taken as a standalone supplement, and it belongs alongside the ferments because \"probiotic\" doesn't only mean bacteria and because this is a different, useful tool, especially right after a course of antibiotics.",
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
    category: 'basicHealth',
    title: 'Sauerkraut Is a Microbial Succession, Not One Strain',
    teaser: 'Sauerkraut isn\'t "cabbage plus Lactobacillus." It\'s a scripted three-act handoff between different species, each one preparing the ground for the next.',
    summary:
      "A jar of sauerkraut looks like one static thing sitting on a shelf. What's happening inside it is a sequential relay race between different organisms. Leuconostoc mesenteroides dominates days 1-3, producing enough acid to suppress spoilage organisms and pave the way for itself to be outcompeted. Lactobacillus brevis and other heterofermentative species take over as pH continues dropping. The more acid-tolerant Lactobacillus plantarum finishes the job over 2-4+ weeks, producing the bulk of the final, stable lactic acid. A sauerkraut eaten at day 3 has a different microbial profile than one eaten at day 21, both just different, and worth knowing if the goal is a specific strain rather than \"sauerkraut\" as one undifferentiated food.",
    citations: [
      {
        source: 'Microbiology Spectrum: microbiome composition and biochemical changes during sauerkraut fermentation',
        url: 'https://journals.asm.org/doi/10.1128/spectrum.00168-22',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['fermented-leuconostoc-mesenteroides', 'fermented-lactobacillus-plantarum'],
  },
  {
    id: 'fermented-kombucha',
    category: 'basicHealth',
    title: 'Kombucha\'s SCOBY Is a Symbiotic Culture of Bacteria and Yeast That Leaves Trace Alcohol in the Drink',
    teaser: 'Not one organism, and not entirely alcohol-free either: two facts about kombucha that rarely make it onto the label.',
    summary: "Kombucha's name for its starter culture, SCOBY, symbiotic culture of bacteria and yeast, is a literal description, not marketing language. The community fermenting sweetened tea typically includes Acetobacter species, various yeasts, and often Gluconobacter, a mixed community, distinct from the single-strain focus of most other entries here. Because yeast fermentation of sugar always produces some ethanol as a byproduct, commercially sold kombucha is capped at under 0.5% ABV to stay classified as non-alcoholic in most markets, but home-brewed batches, especially longer-fermented ones or a \"second ferment,\" can measurably exceed that. A practical caveat, not a reason to avoid kombucha outright. See the alcohol advisory for the fuller context on why moderate alcohol isn't the simple villain it's often assumed to be.",
    citations: [
      {
        source: 'Microbial composition of kombucha determined using amplicon sequencing and shotgun metagenomics (Journal of Food Science, 2020)',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7027524/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['lifestyle-alcohol-gbd-no-safe-level'],
  },
  {
    id: 'fermented-water-kefir',
    category: 'basicHealth',
    title: 'Water Kefir Is a Dairy-Free Alternative to Milk Kefir With the Same Trace-Alcohol Caveat as Kombucha',
    teaser: 'Same name as milk kefir, different starter, and not interchangeable, despite what the shared name suggests.',
    summary:
      'The name "kefir" gets used for two different ferments, and the grains themselves aren\'t interchangeable between them. Water kefir grains ferment sugar water, often with dried fruit added, via a different bacterial and yeast community than milk kefir grains use. Like kombucha, yeast activity means trace ethanol is produced, typically lower than kombucha at a similar brew time, but not zero, and rising the longer a batch ferments. A dairy-free ferment option, distinct from milk kefir\'s much broader strain diversity, covered next.',
    citations: [
      {
        source: 'The core microbiomes and associated metabolic potential of water kefir, revealed by pan multi-omics (Communications Biology, 2025)',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11897133/',
      },
    ],
    overallTier: 'weak',
  },
  {
    id: 'fermented-milk-kefir',
    category: 'basicHealth',
    title: 'Milk Kefir Grains Host 30 or More Bacterial and Yeast Species in One Culture',
    teaser: 'One batch, 30 or more distinct species living together, far beyond what a typical store-bought yogurt ever offers.',
    summary: "Most fermented foods here are built around one or two named strains. Milk kefir is built differently, on purpose. Traditional milk kefir grains host a complex symbiotic community, often 30 or more distinct bacterial and yeast species living together in one starter culture, far beyond the handful of strains in a typical commercial yogurt. That diversity is exactly what the gut-microbiome research keeps identifying as the target: diversity itself, not any single \"best\" strain. Kefir is one of the most direct, practical ways to work toward that diversity through food rather than through a supplement.",
    citations: [
      {
        source: 'PLOS ONE: sequencing-based analysis of kefir grains and milks from multiple sources',
        url: 'https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0069371',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['lifestyle-synbiotic-il6-vijay-2025'],
  },
  {
    id: 'fermented-beet-kvass',
    category: 'basicHealth',
    title: 'Beet Kvass Is a Traditional Eastern European Brine Ferment With Folk Standing and Thin Formal Research',
    teaser: 'A centuries-old folk remedy, and early lab evidence starting to explain why.',
    summary:
      "Beet kvass carries a long tradition-medicine reputation in Eastern European households, well before any lab ever tried to explain why. Fermented beet brine (whole beets, salt, water, lacto-fermented several days to weeks) carries a long traditional-medicine reputation for liver and digestive support. Specific lab evidence now backs part of that: Lactobacillus strains isolated directly from fermented beetroot, genetically confirmed via 16S rDNA sequencing as over 95% similar to L. Paracasei and L. Casei, showed strong probiotic markers: over 96% survival through simulated gastrointestinal conditions and over 53% adherence capability. Kvass itself as a finished beverage hasn't been through a direct human clinical trial yet. This is strain-level evidence from the raw ferment, not a kvass outcome study, a distinction worth keeping in mind.",
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
    category: 'basicHealth',
    title: 'Fermented Fruit in Brine Follows the Same Chemistry as Vegetables, With Extra Care',
    teaser: 'Most home fermentation defaults to vegetables for a specific chemical reason. Fruit can be done too, with extra care.',
    summary:
      "Open a book on home fermentation and vegetables dominate almost every recipe. Fruit isn't off-limits. It just needs extra attention. Most home fermentation defaults to vegetables (cabbage, cucumbers) because their lower natural sugar content favors lactic acid bacteria over the wild yeasts that would otherwise dominate a sweeter substrate and push the ferment toward alcohol instead. Fruit can be lacto-fermented in a salt brine the same way, apple is a workable example, but needs closer monitoring for that yeast and mold competition than a standard vegetable ferment, and the finished product is tarter and more complex than raw fruit, not simply \"fruit plus probiotics.\"",
    citations: [
      {
        source: 'NCBI Bookshelf: "Lactic Acid Fermentations," Applications of Biotechnology to Fermented Foods',
        url: 'https://www.ncbi.nlm.nih.gov/books/NBK234703/',
      },
    ],
    overallTier: 'weak',
  },
  {
    id: 'fermented-cfu-dosing',
    category: 'basicHealth',
    title: 'What the CFU Number on a Probiotic Label Means',
    teaser: "A bigger number on the label isn't automatically a better probiotic. Here's the science behind dosing that the label doesn't explain.",
    summary:
      "Probiotic supplement labels compete on one number, billions of CFU, as if bigger is automatically better. The research doesn't support that assumption. Colony-forming units, CFU, measure how many live organisms were present at manufacture, not how many survive stomach acid or colonize the gut. Most clinical trials showing benefit used doses in the 1-10 billion CFU range per day for a specific, named strain, not the 50-100+ billion CFU \"mega-blends\" often marketed as inherently superior. Higher doses aren't proven harmful, but they also aren't proven more effective without trial data for that specific strain at that specific dose. The strain and the evidence behind it matter more than the raw number on the label.",
    citations: [
      {
        source: 'Strain-Specificity and Disease-Specificity of Probiotic Efficacy: A Systematic Review and Meta-Analysis',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5949321/',
      },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'fermented-sourcing-starters',
    category: 'basicHealth',
    title: 'Sourcing Verified Starter Cultures',
    teaser: 'A grocery-store "probiotic" yogurt and a lab-verified single-strain starter are not the same tool, even though they sit in the same aisle.',
    summary:
      'Reaching for a probiotic yogurt at the store feels like a straightforward way to get a specific strain into a diet. The label rarely guarantees what that means. Commercial yogurt is only required to contain the two legal minimum starter cultures, S. Thermophilus and L. Bulgaricus, at the time of manufacture. Live cultures can decline well before the sell-by date, and "contains live active cultures" labeling doesn\'t guarantee a specific strain or count. For anyone trying to work with a specific, research-backed strain like Lp299v, a verified single-strain starter culture, sold specifically for home fermentation, with a certificate of analysis, is a more reliable tool than hoping a random store product happens to still be active.',
    citations: [
      {
        source: 'FDA 21 CFR 131.200: Yogurt standard of identity, live/active culture labeling',
        url: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-B/part-131/subpart-B/section-131.200',
      },
      {
        source: 'Global Regulatory Frameworks for Fermented Foods: A Review (Frontiers in Nutrition, 2022), discussing Codex Alimentarius CXS 243-2003',
        url: 'https://www.frontiersin.org/journals/nutrition/articles/10.3389/fnut.2022.902642/full',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['fermented-filtered-water'],
  },
  {
    id: 'fermented-filtered-water',
    category: 'basicHealth',
    title: 'Chloramine in Tap Water Can Stall a Ferment, and Ordinary Filters Rarely Remove It',
    teaser: "A ferment that never quite gets going, or stalls partway through, isn't always a bad culture: sometimes it's the water it started in.",
    summary:
      "Municipal tap water is deliberately treated to kill bacteria, viruses, and other microorganisms before it reaches a home, and a fermentation culture, lactic acid bacteria, a kombucha SCOBY, water kefir grains, wild yeast, is exactly the kind of living organism that treatment is built to suppress. Chlorine is volatile and mostly dissipates from standing or boiled water within a couple of hours, but many utilities have switched to chloramine specifically because it lasts longer in the pipes: it can take two to three days to dissipate at room temperature, and most ordinary pass-through filters that remove chlorine don't remove it. Tap water composition also isn't consistent from one place to another; treatment method, pipe age, and local mineral content all vary by municipality, so there's no way to know from the tap alone what else, beyond the disinfectant, might be present in a given area's supply. Filtered water sidesteps all of this at once, without needing to know the specifics of a local water system first. Every fermentation recipe in this app's curated collection calls for filtered water for exactly this reason.",
    citations: [
      { source: 'US EPA: Chloramines in Drinking Water', url: 'https://www.epa.gov/dwreginfo/chloramines-drinking-water' },
      { source: 'Fermenting for Foodies: How to Filter Water for Gut Health and Fermentation', url: 'https://www.fermentingforfoodies.com/filter-water-fermentation/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['fermented-sourcing-starters', 'fermented-tying-together'],
  },
  {
    id: 'fermented-tying-together',
    category: 'basicHealth',
    title: 'Diversity Beats Any Single Best Strain in Fermented Foods',
    teaser: 'Fifteen strains, ferments, and practical notes, and the recurring lesson is variety, not a single magic bullet.',
    summary:
      "No single strain across these fifteen entries does everything. L. Acidophilus helps lactose digestion, Bifidobacterium bifidum specifically rebuilds occludin, E. Coli Nissle restores different tight-junction proteins entirely, S. Boulardii survives antibiotics precisely because it isn't a bacterium at all. Milk kefir's 30+ species is the clearest illustration of what the fermented-food research keeps pointing toward: gut-microbiome diversity itself, not any one \"best\" probiotic, is the actual target. Rotating between a home yogurt, sauerkraut, kefir, and an occasional kombucha realistically does more than picking one and eating it exclusively. The CFU-dosing, sourcing, and filtered-water entries exist for the same reason: knowing what's being cultured, and what it's being cultured in, matters more than how big the number on a label says it is. Building a varied fermentation habit, not chasing one perfect strain, is the practical takeaway this whole category keeps arriving at.",
    citations: [
      {
        source: 'PLOS ONE: sequencing-based analysis of kefir grains and milks from multiple sources',
        url: 'https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0069371',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['fermented-lactobacillus-acidophilus', 'fermented-cfu-dosing', 'fermented-filtered-water', 'foodhistory-regen-microbiome-symbiosis-mission'],
  },
];
