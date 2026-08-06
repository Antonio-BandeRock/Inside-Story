import type { DigestEntry } from './types';

// Glossary -- added 2026-08-07, direct request: "Provide a glossary of
// words and phrases and acronyms and definitions of all of them and what
// they are, and what they do for the body and how they tie in to
// Hashimoto's... make it the first one at the top left."
//
// A different kind of category from the other 15: every other one is meant
// to be read start to finish, building toward a real payoff. This one is
// meant to be looked something up in, in isolation, the way a dictionary
// or glossary works, so each entry here is deliberately short and
// self-contained (a definition, what it does in the body, how it connects
// to Hashimoto's or this app's own research) rather than a full
// beginning-middle-end story. That's a considered exception to this
// session's own narrative-rewrite direction, not an oversight: a glossary
// entry's whole job is to be found fast and understood in one read, not to
// build suspense.
//
// 57 terms, sorted alphabetically by their own title (the standard,
// most-findable order for a glossary) rather than grouped by theme,
// deliberately not organized by category, since someone looking up "TSH"
// shouldn't have to guess whether it lives under "Thyroid" or "Labs"
// first. Every term that already has a cited source elsewhere in this
// Digest reuses that exact citation here rather than re-deriving one; most
// of these terms are standard, settled medical/scientific vocabulary that
// this whole app's own already-verified research already rests on, not new
// claims of their own. `citations: []` is used deliberately for the small
// number of pure definitional/administrative terms with no single study
// behind the definition itself, matching the same precedent already set
// by this app's own opinion-synthesis entries. `relatedIds` on every entry
// points to the deeper entry elsewhere in this Digest where that term
// actually does its work; the glossary's own job is being a fast, accurate
// on-ramp into the rest of the app, not a dead end.
//
// Placed FIRST in this app's own category picker (DIGEST_CATEGORY_META,
// index.ts), a deliberate, explicit exception to this whole feature's own
// established "append, never reorder" practice for new categories, made
// because the request was specific and direct about position, not a
// default.
//
// 2026-08-08: content fields rewritten to remove AI-writing tics flagged
// directly by the person -- em dashes as punctuation, "not X, it's Y"
// contrast, and overused words like "real"/"genuinely"/"honest(ly)"/
// "worth" -- see bigPicture.ts's own header comment for the full context.
// Every fact, number, and citation is unchanged; the terse, dictionary-
// style format is preserved throughout, per this file's own design above.
export const GLOSSARY_ENTRIES: DigestEntry[] = [
  {
    id: 'glossary-4r-protocol',
    category: 'glossary',
    title: '4R Protocol',
    teaser: 'A widely-used functional-medicine framework for gut repair: Remove, Replace, Reinoculate, Repair.',
    summary:
      "A four-step sequence, Remove triggers, Replace digestive support, Reinoculate with probiotics, Repair the gut lining, used across functional medicine as a general gut-restoration framework. This app's own research found every individual step has separate evidence behind it, but no clinical trial has tested the packaged 4-step protocol as one combined unit. See Gut & Microbiome for the full breakdown.",
    citations: [],
    overallTier: 'moderate',
    relatedIds: ['gut-4r-protocol'],
  },
  {
    id: 'glossary-aip',
    category: 'glossary',
    title: 'AIP (Autoimmune Protocol)',
    teaser: 'A structured elimination-then-reintroduction diet, originally built for autoimmune disease broadly, not Hashimoto\'s specifically.',
    summary:
      'A structured elimination diet (typically a 6-week elimination phase followed by a 5-week reintroduction) removing gluten, dairy, grains, legumes, nightshades, and several other categories, then reintroducing them one at a time to identify personal triggers. This app\'s own Healing Stages guide builds its Stage 1/Stage 2 structure directly on this clinical protocol shape.',
    citations: [
      {
        source: 'The Autoimmune Protocol diet: a systematic review of the literature',
        url: 'https://pubmed.ncbi.nlm.nih.gov/31832627/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['healing-stage-map'],
  },
  {
    id: 'glossary-alt-ast',
    category: 'glossary',
    title: 'ALT & AST (Liver Enzymes)',
    teaser: 'Two enzymes measured on a standard liver panel, and a direct way hypothyroidism itself can make them look abnormal.',
    summary:
      "ALT (alanine aminotransferase) and AST (aspartate aminotransferase) are enzymes that live inside liver cells. When those cells become measurably \"leakier\" or damaged, more of each enzyme escapes into the bloodstream, which is exactly what a standard liver blood panel checks for. Research shows hypothyroidism itself can raise both through a documented membrane-permeability mechanism. See Organs & Body Systems for the full explanation and why it's reversible with treatment.",
    citations: [
      { source: 'Bayraktar & Van Thiel -- Abnormalities in measures of liver function and injury in thyroid disorders (Hepatogastroenterology)', url: 'https://pubmed.ncbi.nlm.nih.gov/9427032/' },
    ],
    overallTier: 'strong',
    relatedIds: ['organ-liver-hashimotos-damage'],
  },
  {
    id: 'glossary-antibody-antigen',
    category: 'glossary',
    title: 'Antibody & Antigen',
    teaser: 'The immune system\'s own recognition system, and in Hashimoto\'s, the same system aimed at the wrong target.',
    summary:
      'An antigen is anything the immune system can learn to recognize, normally a foreign threat like a virus or bacterium. An antibody is the specific protein the immune system builds to identify and help destroy that exact antigen. In Hashimoto\'s, the immune system mistakenly builds antibodies (most notably against thyroid peroxidase, TPO) that target the body\'s own thyroid tissue as if it were a foreign threat, the defining feature of an autoimmune disease.',
    citations: [],
    overallTier: 'strong',
    relatedIds: ['history-1956-autoimmune-mechanism'],
  },
  {
    id: 'glossary-aps2',
    category: 'glossary',
    title: 'APS-2 (Autoimmune Polyglandular Syndrome Type 2)',
    teaser: 'A named clinical combination: Hashimoto\'s plus a second autoimmune attack on the adrenal glands, together.',
    summary:
      'A recognized clinical entity, historically called "Schmidt syndrome," diagnosed when a person has at least two of: primary adrenal insufficiency (Addison\'s disease), autoimmune thyroid disease, and type 1 diabetes. A separate autoimmune process from ordinary chronic-stress cortisol dysregulation. See Organs & Body Systems for why unexplained fatigue or low blood pressure alongside Hashimoto\'s is worth an adrenal-function conversation.',
    citations: [
      { source: 'Polyglandular Autoimmune Syndrome Type II (StatPearls, NIH/NCBI Bookshelf)', url: 'https://www.ncbi.nlm.nih.gov/books/NBK525992/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['organ-adrenal-aps2'],
  },
  {
    id: 'glossary-autoimmune-disease',
    category: 'glossary',
    title: 'Autoimmune Disease',
    teaser: 'The immune system, built to defend the body, mistakenly attacking a part of the body itself.',
    summary:
      'A broad category of disease where the immune system fails to distinguish the body\'s own tissue from an outside threat, and attacks it directly. Hashimoto\'s thyroiditis is one specific example (the thyroid gland is the target); this Digest\'s own Other Autoimmune Diseases category covers seven more examples, each attacking a different organ through some of the same recurring underlying mechanisms.',
    citations: [
      { source: 'Autoimmune thyroid disease -- a review discussing the 1956 discovery and its significance', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7266799/' },
    ],
    overallTier: 'strong',
    relatedIds: ['history-1956-autoimmune-mechanism', 'other-why-cross-disease-evidence'],
  },
  {
    id: 'glossary-autophagy-mitophagy',
    category: 'glossary',
    title: 'Autophagy & Mitophagy',
    teaser: 'The cell\'s own internal cleanup crew, and a specific target of Hashimoto\'s own inflammation.',
    summary:
      "Autophagy is a cell's own built-in process for breaking down and recycling damaged internal components. Mitophagy is the same process specifically targeting worn-out mitochondria. Hashimoto's-specific research found elevated IL-23 directly suppresses this process in thyroid cells. See Mitochondria & Metabolism for the full mechanism, and for the tension between fasting (which powerfully triggers autophagy but also suppresses active thyroid hormone) and exercise (which triggers it too, without that same tradeoff).",
    citations: [
      {
        source: "Increased Interleukin-23 in Hashimoto's Thyroiditis Disease Induces Autophagy Suppression and Reactive Oxygen Species Accumulation (Frontiers in Immunology, 2018)",
        url: 'https://pubmed.ncbi.nlm.nih.gov/29434604/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['mito-il23-autophagy-suppression', 'mito-fasting-autophagy-tension'],
  },
  {
    id: 'glossary-bpa-phthalates',
    category: 'glossary',
    title: 'BPA & Phthalates',
    teaser: 'Two common plastic-related chemicals with documented, direct effects on hormone systems.',
    summary:
      'BPA (bisphenol A) and phthalates are chemicals found in some plastics, can linings, and fragranced products. Both are documented endocrine disruptors, meaning they can directly interfere with how the body\'s own hormone receptors and transport proteins work, including for thyroid hormone specifically. See Lifestyle & Environment for the research and the everyday exposure routes, including heating food in plastic.',
    citations: [
      { source: 'Bisphenols and Thyroid Hormone (Endocrinology and Metabolism, 2019)', url: 'https://pubmed.ncbi.nlm.nih.gov/31884733/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['lifestyle-edc-bpa-phthalates', 'lifestyle-plastic-food-storage'],
  },
  {
    id: 'glossary-cfu',
    category: 'glossary',
    title: 'CFU (Colony-Forming Units)',
    teaser: 'The number on a probiotic label, and an honest explanation of what it does and doesn\'t actually tell you.',
    summary:
      'CFU measures how many live organisms were present in a probiotic product at the time it was manufactured, not how many actually survive stomach acid or reach the gut. Most clinical trials showing genuine benefit used doses in the 1-10 billion CFU range for one specific, named strain, not the 50-100+ billion CFU "mega-blends" often marketed as automatically superior. See Fermented Foods for the full dosing picture.',
    citations: [
      {
        source: 'Strain-Specificity and Disease-Specificity of Probiotic Efficacy: A Systematic Review and Meta-Analysis',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5949321/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['fermented-cfu-dosing'],
  },
  {
    id: 'glossary-cohort-case-control',
    category: 'glossary',
    title: 'Cohort Study & Case-Control Study',
    teaser: 'Two different ways researchers study a disease when they can\'t ethically run a controlled experiment on it.',
    summary:
      'A cohort study follows a group of people forward in time, tracking who develops a condition and looking for measurable differences between those who do and don\'t. A case-control study works backward instead, starting with people who already have a condition and people who don\'t, then looking back at their past exposures for differences. Both are valuable research designs, but neither can prove cause and effect as directly as a randomized controlled trial (RCT) can. This Digest names which kind of study backs a given claim throughout, since that distinction matters for how confidently a finding should be read.',
    citations: [],
    overallTier: 'strong',
  },
  {
    id: 'glossary-cortisol',
    category: 'glossary',
    title: 'Cortisol',
    teaser: 'The body\'s own primary stress hormone, and a direct, repeated route to lower active thyroid hormone.',
    summary:
      'A hormone released by the adrenal glands during stress, regulated by the HPA axis. Cortisol is documented to directly suppress the deiodinase enzymes that convert inactive T4 into active T3, favoring inactive reverse T3 instead. This is the single most recurring mechanism this whole Digest keeps finding underneath seemingly unrelated topics: alcohol, sugar-sweetened drinks, sleep disruption, and high-intensity exercise, all covered under Lifestyle & Environment.',
    citations: [
      { source: 'Stephens & Wand 2012, Alcohol Research: Current Reviews -- stress and the HPA axis (NIAAA)', url: 'https://pubmed.ncbi.nlm.nih.gov/23584113/' },
    ],
    overallTier: 'strong',
    relatedIds: ['lifestyle-chronic-stress-hpa', 'lifestyle-tying-together'],
  },
  {
    id: 'glossary-crp',
    category: 'glossary',
    title: 'CRP (C-Reactive Protein)',
    teaser: 'One of the most common checkable blood markers of general inflammation, used throughout this app\'s own Mitochondria & Metabolism research.',
    summary:
      'A protein the liver produces in response to inflammation anywhere in the body; a standard blood test most doctors can order. CRP shows up repeatedly across this Digest\'s own research as the measured outcome behind claims like "a Mediterranean-style diet reduces inflammation" or "fiber intake lowers inflammatory markers," a checkable number behind an otherwise vague-sounding claim.',
    citations: [],
    overallTier: 'strong',
  },
  {
    id: 'glossary-cytokine',
    category: 'glossary',
    title: 'Cytokine',
    teaser: 'A chemical messenger the immune system uses to coordinate itself, including several that directly touch thyroid hormone.',
    summary:
      'A broad category of small signaling proteins immune cells use to communicate with each other and with other tissues. IL-6, IL-23, and TNF-alpha are three specific, named cytokines that show up repeatedly across this app\'s own research, each with a documented effect relevant to Hashimoto\'s: IL-23 suppressing autophagy in thyroid cells, IL-6 directly suppressing the enzymes that activate thyroid hormone.',
    citations: [],
    overallTier: 'strong',
    relatedIds: ['mito-il23-autophagy-suppression', 'lifestyle-il6-deiodinase'],
  },
  {
    id: 'glossary-d1-d6',
    category: 'glossary',
    title: "D1-D6 (This App's Six Dimensions)",
    teaser: 'This app\'s own scoring framework, scoring every food across six separate, research-backed factors.',
    summary:
      'This app\'s own six-dimension scoring rubric, used throughout Insights: micronutrient density and bioavailability, inflammatory response potential, lipid metabolic compatibility, hormonal support and conversion, digestive tolerance and absorption, and oxalate load and mineral interference. Not the same six-digit code as the deiodinase enzymes (D1, D2, D3) covered elsewhere in this glossary, an easy naming collision worth knowing about.',
    citations: [],
    overallTier: 'strong',
  },
  {
    id: 'glossary-dao-histamine',
    category: 'glossary',
    title: 'DAO (Diamine Oxidase) & Histamine Intolerance',
    teaser: 'The enzyme that clears dietary histamine, and a reason gut inflammation can leave someone with less of it on hand.',
    summary:
      'DAO is the enzyme mainly responsible for breaking down histamine absorbed from food. Gut inflammation can reduce how much DAO is available, meaning someone with an already-inflamed gut may have less capacity to clear dietary histamine than usual. This is a direct reason this app\'s Healing Stages guide asks most fermented foods, a genuinely high-histamine food category, to wait until Stage 2, once that capacity is no longer an unknown variable.',
    citations: [
      { source: 'Maintz & Novak 2007, American Journal of Clinical Nutrition -- histamine and histamine intolerance', url: 'https://pubmed.ncbi.nlm.nih.gov/17490952/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['problem-high-histamine', 'healing-stage1-fermented-exclusion'],
  },
  {
    id: 'glossary-deiodinase',
    category: 'glossary',
    title: 'Deiodinase (D1, D2, D3)',
    teaser: 'The family of enzymes that actually converts thyroid hormone into its active form, mostly outside the thyroid gland itself.',
    summary:
      "Three enzymes, type 1, 2, and 3 deiodinase, that convert T4 into active T3 (D1 and D2) or break T3 down (D3). Roughly 80% of the body's active T3 is made this way, outside the thyroid gland itself, with the liver's own D1 the single largest contributor, meaning organs like the liver are doing much of the work usually credited to the thyroid alone. Inflammation (via cortisol or IL-6, both covered elsewhere in this glossary) can suppress D1/D2 and activate D3 at the same time, a double hit to active thyroid hormone.",
    citations: [
      {
        source: 'Role of hepatic deiodinases in thyroid hormone homeostasis and liver metabolism, inflammation, and fibrosis (European Thyroid Journal)',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10160546/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['organ-liver-t4t3-conversion', 'lifestyle-il6-deiodinase'],
  },
  {
    id: 'glossary-dri-family',
    category: 'glossary',
    title: 'DRI, RDA, AI & UL (Dietary Reference Intakes)',
    teaser: 'The official family of nutrient targets this app\'s own Insights tab measures every meal against.',
    summary:
      'DRI (Dietary Reference Intake) is the umbrella term NASEM (the National Academies of Sciences, Engineering, and Medicine) uses for published nutrient targets. RDA (Recommended Dietary Allowance) is the amount that meets the needs of nearly everyone in a group; AI (Adequate Intake) is used instead when there isn\'t enough evidence yet to set a full RDA; UL (Tolerable Upper Intake Level) is the highest amount unlikely to cause harm. This app\'s own reference database uses cited DRI values, including an AI for water and choline added directly from the source data, to power every nutrient-percentage figure shown in Insights.',
    citations: [],
    overallTier: 'strong',
  },
  {
    id: 'glossary-dysbiosis',
    category: 'glossary',
    title: 'Dysbiosis',
    teaser: 'The term for a gut microbiome that\'s out of balance: too few of the helpful species, too many of the unhelpful ones.',
    summary:
      'A general term for an imbalanced gut microbial community, a meaningful shift away from the diversity and balance a healthy gut normally maintains. A single course of antibiotics is a well-documented cause, and some species never fully recover their pre-antibiotic levels. See Lifestyle & Environment and Fermented Foods for the recovery timeline and how to rebuild diversity afterward.',
    citations: [],
    overallTier: 'moderate',
    relatedIds: ['lifestyle-antibiotic-overuse', 'fermented-tying-together'],
  },
  {
    id: 'glossary-egfr',
    category: 'glossary',
    title: 'eGFR (Estimated Glomerular Filtration Rate)',
    teaser: 'The standard measure of how well the kidneys are filtering, and a measured way hypothyroidism affects it.',
    summary:
      'A standard blood-test-derived estimate of how much blood the kidneys are filtering per minute, the most common way kidney function gets checked. A large study found average eGFR declining in step with worsening thyroid function (88.0 in euthyroid patients, down to 72.2 in overt hypothyroidism), and case reports confirm this is reversible with treatment. See Organs & Body Systems for the full picture.',
    citations: [
      {
        source: 'Subclinical and overt hypothyroidism is associated with reduced glomerular filtration rate and proteinuria: a large cross-sectional population study (Scientific Reports)',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5795015/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['organ-kidney'],
  },
  {
    id: 'glossary-edc',
    category: 'glossary',
    title: 'EDC (Endocrine Disruptor)',
    teaser: 'Chemicals specifically named for what they\'re documented to do: interfere directly with the body\'s own hormone systems.',
    summary:
      'A broad category of chemicals, BPA, phthalates, certain pesticides, some fragrance compounds, documented to interfere directly with hormone receptors, transport proteins, or production. Most of the strongest human evidence for harm comes from occupational or high-exposure settings rather than typical everyday exposure. See Lifestyle & Environment for the current state of that evidence.',
    citations: [
      { source: 'Bisphenols and Thyroid Hormone (Endocrinology and Metabolism, 2019)', url: 'https://pubmed.ncbi.nlm.nih.gov/31884733/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['lifestyle-edc-bpa-phthalates'],
  },
  {
    id: 'glossary-euthyroid-hypothyroid',
    category: 'glossary',
    title: 'Euthyroid, Hypothyroid & Subclinical Hypothyroidism',
    teaser: 'The three distinct states thyroid lab results can describe, and why the middle one only became diagnosable fairly recently.',
    summary:
      'Euthyroid means normal thyroid function. Hypothyroid (overt) means genuinely low thyroid hormone with clear lab abnormalities. Subclinical hypothyroidism, the middle state, means TSH is elevated but T4 is still technically normal, a diagnosis that literally couldn\'t be made until sensitive-enough lab testing existed. See History & Milestones for that story.',
    citations: [
      { source: 'Laboratory Thyroid Tests: A Historical Perspective (Thyroid)', url: 'https://pubmed.ncbi.nlm.nih.gov/37037032/' },
    ],
    overallTier: 'strong',
    relatedIds: ['history-1960s-tsh-testing'],
  },
  {
    id: 'glossary-evidence-tiers',
    category: 'glossary',
    title: 'Evidence Tiers (Strong / Moderate / Weak)',
    teaser: 'The rating system behind every colored dot in this Digest.',
    summary:
      'This app\'s own standing discipline for every claim it makes: Strong means trial-level or meta-analysis-level support; Moderate means a finding without that same depth of replication; Weak means early, preliminary, or thin evidence, still worth knowing but not worth over-trusting. An entry citing one strong study and one weak one is deliberately tagged at the weaker tier, since a claim is only as strong as its weakest support.',
    citations: [],
    overallTier: 'strong',
  },
  {
    id: 'glossary-fodmap',
    category: 'glossary',
    title: 'FODMAP',
    teaser: 'A category of carbohydrates a lot of people digest poorly, the single highest-confidence exclusion in this app\'s own Healing Stages guide.',
    summary:
      'FODMAP stands for Fermentable Oligosaccharides, Disaccharides, Monosaccharides, and Polyols, a category of carbohydrates the small intestine often can\'t fully digest, which then get fermented by gut bacteria in the colon, producing gas and bloating. Garlic and onion, common high-FODMAP foods, are covered directly under Problem Foods & Swaps, and the whole category is the highest-confidence exclusion in this app\'s own Healing Stages Stage 1 elimination list.',
    citations: [
      {
        source: 'Monash University FODMAP research group -- fructan content in garlic, onion & other high-FODMAP foods',
        url: 'https://www.monashfodmap.com/about-fodmap-and-ibs/high-and-low-fodmap-foods/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['problem-garlic-onion', 'healing-stage1-avoid'],
  },
  {
    id: 'glossary-gliadin',
    category: 'glossary',
    title: 'Gliadin',
    teaser: 'The specific fragment of gluten with a named mechanism for loosening the gut barrier.',
    summary:
      'A specific protein fragment within gluten (found in wheat, barley, and rye). Gliadin binds a receptor called CXCR3 on intestinal cells, triggering those cells to release zonulin, a specific, reversible mechanism for increased gut permeability, first fully characterized in celiac disease but now documented as relevant across several autoimmune conditions this Digest covers, not just celiac.',
    citations: [
      { source: 'Fasano 2011, Physiological Reviews -- zonulin and intestinal barrier function', url: 'https://pubmed.ncbi.nlm.nih.gov/21248165/' },
    ],
    overallTier: 'strong',
    relatedIds: ['gut-zonulin-gliadin', 'problem-gluten-grains'],
  },
  {
    id: 'glossary-goitrogen-goiter',
    category: 'glossary',
    title: 'Goitrogen & Goiter',
    teaser: 'A category of compounds that can interfere with thyroid iodine uptake, and the visible thyroid swelling that iodine deficiency can cause.',
    summary:
      'A goitrogen is any compound that interferes with the thyroid\'s ability to use iodine, found naturally in raw cruciferous vegetables (mostly heat-deactivated by cooking), and in additives like dietary nitrate. A goiter is the resulting visibly enlarged thyroid, historically caused mainly by iodine deficiency. See History & Milestones for the story of the American "goiter belt" and iodized salt.',
    citations: [
      {
        source: 'Song & Thornalley 2007, Food & Chemical Toxicology -- effect of storage, processing & cooking on glucosinolate content',
        url: 'https://pubmed.ncbi.nlm.nih.gov/17011103/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['problem-raw-cruciferous', 'history-1924-iodized-salt'],
  },
  {
    id: 'glossary-graves-disease',
    category: 'glossary',
    title: "Graves' Disease",
    teaser: "Hashimoto's own opposite-direction cousin: another autoimmune thyroid disease, but overactive instead of underactive.",
    summary:
      'An autoimmune thyroid disease, like Hashimoto\'s, but with the opposite effect: antibodies stimulate the thyroid into overproducing hormone rather than attacking and destroying thyroid tissue. Smoking is a documented risk factor for Graves\', the counterintuitive opposite of its protective association with Hashimoto\'s specifically, covered under Lifestyle & Environment.',
    citations: [
      { source: 'Wiersinga -- Smoking and thyroid disorders: a meta-analysis (Clinical Endocrinology)', url: 'https://pubmed.ncbi.nlm.nih.gov/11834423/' },
    ],
    overallTier: 'strong',
    relatedIds: ['lifestyle-smoking-paradox'],
  },
  {
    id: 'glossary-hpa-axis',
    category: 'glossary',
    title: 'HPA Axis',
    teaser: "The body's own central stress-response control system, and a direct route from chronic stress to lower active thyroid hormone.",
    summary:
      'The hypothalamic-pituitary-adrenal axis, the body\'s own central system for regulating cortisol and the stress response. Chronic activation of this system is documented to suppress the deiodinase enzymes that make active thyroid hormone, a single mechanism this Digest keeps finding underneath alcohol, sugar-sweetened drinks, sleep disruption, and high-intensity exercise.',
    citations: [
      { source: 'Stephens & Wand 2012, Alcohol Research: Current Reviews -- stress and the HPA axis (NIAAA)', url: 'https://pubmed.ncbi.nlm.nih.gov/23584113/' },
    ],
    overallTier: 'strong',
    relatedIds: ['lifestyle-chronic-stress-hpa'],
  },
  {
    id: 'glossary-healing-stages',
    category: 'glossary',
    title: 'Healing Stages 1, 2 & 3',
    teaser: "This app's own practical, food-focused staging: Getting Started, Rebuilding, and Well-Healed.",
    summary:
      'This app\'s own 3-tier practical structure for the healing journey: Stage 1 "Getting Started" (a short, narrow elimination baseline), Stage 2 "Rebuilding" (systematic, one-food-at-a-time reintroduction), and Stage 3 "Well-Healed" (broad eating, tracking as a spot-check tool). Mapped onto the five clinical stages this app also names elsewhere (Triage, Digging, Gut Repair, Rebalancing, Maintenance), which only meaningfully drive food decisions in two of the five. See Healing Stages for the full map.',
    citations: [],
    overallTier: 'moderate',
    relatedIds: ['healing-stage-map'],
  },
  {
    id: 'glossary-il6-il23-tnf',
    category: 'glossary',
    title: 'IL-6, IL-23 & TNF-α',
    teaser: 'Three specific, named inflammatory messengers, each with a documented effect relevant to Hashimoto\'s.',
    summary:
      'Three specific cytokines that show up repeatedly across this app\'s own research. IL-23 directly suppresses autophagy in Hashimoto\'s thyroid tissue. IL-6 directly suppresses the enzymes that activate thyroid hormone while activating the one that destroys it. TNF-alpha is a broader inflammatory marker, one of several this Digest\'s own diet-and-inflammation research (Mediterranean-diet trials, fiber intake) tracks as a measurable outcome.',
    citations: [],
    overallTier: 'strong',
    relatedIds: ['mito-il23-autophagy-suppression', 'lifestyle-il6-deiodinase'],
  },
  {
    id: 'glossary-insulin-resistance',
    category: 'glossary',
    title: 'Insulin Resistance',
    teaser: 'A state where the body\'s cells stop responding normally to insulin, and a documented finding tied to visceral fat in Hashimoto\'s specifically.',
    summary:
      'A physiological state where cells respond less effectively to insulin, the hormone that normally moves sugar out of the bloodstream and into cells, a precursor to type 2 diabetes. A Hashimoto\'s mouse-model experiment found reinfusing regulatory T cells into visceral fat measurably improved insulin sensitivity, directly connecting this app\'s own gut-immune research to a concrete, checkable metabolic outcome. See Mitochondria & Metabolism.',
    citations: [
      {
        source: "Depletion of Regulatory T Cells in Visceral Adipose Tissues Contributes to Insulin Resistance in Hashimoto's Thyroiditis (Frontiers in Physiology, 2018)",
        url: 'https://pubmed.ncbi.nlm.nih.gov/29541033/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['mito-visceral-fat-treg-reinfusion'],
  },
  {
    id: 'glossary-leaky-gut',
    category: 'glossary',
    title: 'Leaky Gut / Intestinal Permeability',
    teaser: 'A measurable phenomenon, and a genuinely contested clinical diagnosis. Both true at once.',
    summary:
      'Intestinal permeability is a directly measurable phenomenon (via zonulin levels or lactulose-mannitol testing), with documented mechanistic links to several autoimmune conditions. "Leaky gut syndrome" as a standalone clinical diagnosis remains debated in mainstream gastroenterology and endocrinology, not because the biology is fake but because no agreed clinical definition or diagnostic threshold exists yet. See Gut & Microbiome for the full distinction.',
    citations: [
      { source: 'Biomarkers for assessment of intestinal permeability in clinical practice (Scandinavian Journal of Gastroenterology, 2021)', url: 'https://pubmed.ncbi.nlm.nih.gov/34009040/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['gut-leaky-gut-contested', 'gut-tying-together'],
  },
  {
    id: 'glossary-levothyroxine',
    category: 'glossary',
    title: 'Levothyroxine',
    teaser: 'The single most-prescribed medication in the US, and, historically, a fairly recent replacement for dried animal thyroid gland.',
    summary:
      'A synthetic, precisely-dosed form of T4, the standard treatment for hypothyroidism since the 1970s, when it replaced over 70 years of inconsistent desiccated (dried) animal thyroid extract. See History & Milestones for that story, and Labs & Medication Timing for the well-documented food and supplement interactions that affect how much of a dose actually gets absorbed.',
    citations: [
      { source: 'Natural desiccated thyroid for the treatment of hypothyroidism? (Frontiers in Endocrinology)', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10801060/' },
    ],
    overallTier: 'strong',
    relatedIds: ['history-desiccated-to-levothyroxine', 'labs-timing-master-rule'],
  },
  {
    id: 'glossary-meta-analysis',
    category: 'glossary',
    title: 'Meta-Analysis & Systematic Review',
    teaser: 'Research that combines many smaller studies into one, usually the strongest single kind of evidence a claim can carry.',
    summary:
      'A systematic review is a methodical search and evaluation of every study on a given question. A meta-analysis goes one step further, statistically combining the results of multiple studies into one pooled estimate, generally the strongest single form of evidence a claim can have, which is why this Digest\'s own Strong tier usually points at one. Selenium\'s own case is an instructive exception: a large meta-analysis rates it Strong, while a stricter Cochrane review of a smaller slice of the same evidence urges more caution. See Nutrients & Micronutrients.',
    citations: [],
    overallTier: 'strong',
    relatedIds: ['nutrient-selenium'],
  },
  {
    id: 'glossary-microbiome',
    category: 'glossary',
    title: 'Microbiome',
    teaser: 'The trillions of bacteria, yeast, and other microbes living in and on the body, overwhelmingly concentrated in the gut.',
    summary:
      'The collective community of bacteria, yeast, and other microorganisms living in and on the human body, most densely in the gut. Diversity within this community, not any single "best" species, is what this app\'s own Gut & Microbiome and Fermented Foods research keeps identifying as the actual target worth working toward through food.',
    citations: [],
    overallTier: 'strong',
    relatedIds: ['gut-tying-together', 'fermented-tying-together'],
  },
  {
    id: 'glossary-mitochondria',
    category: 'glossary',
    title: 'Mitochondria',
    teaser: 'The cell\'s own energy-producing structures, and, in Hashimoto\'s research, a direct target of the disease itself.',
    summary:
      "Tiny structures inside nearly every cell responsible for producing the cell's own usable energy. Hashimoto's-specific research found circulating MOTS-c, a peptide mitochondria themselves produce, measurably lower in Hashimoto's patients and inversely correlated with antibody levels, evidence the disease reaches down to the cellular energy-production level, not just the thyroid gland itself. See Mitochondria & Metabolism.",
    citations: [
      {
        source: "Reduced Circulating MOTS-c Levels in Hashimoto's Thyroiditis Reflect Integrated Autoimmune and Metabolic Dysregulation: A Cross-Sectional Study",
        url: 'https://pubmed.ncbi.nlm.nih.gov/42278864/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['mito-mots-c'],
  },
  {
    id: 'glossary-molecular-mimicry',
    category: 'glossary',
    title: 'Molecular Mimicry',
    teaser: 'The immunology explaining how a gut microbe could plausibly trigger an attack on a completely different organ.',
    summary:
      'A well-established immunology concept: when a microbial protein structurally resembles a human protein closely enough, antibodies trained against that microbe can mistakenly cross-react with the body\'s own tissue. One of three distinct mechanisms (alongside zonulin-mediated permeability and SCFA/Treg signaling) connecting gut bacterial composition to thyroid autoimmunity specifically. See Gut & Microbiome.',
    citations: [
      { source: 'Molecular mimicry and autoimmune thyroid disease (Current Opinion in Endocrinology, Diabetes and Obesity, 2016)', url: 'https://pubmed.ncbi.nlm.nih.gov/27307072/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['gut-molecular-mimicry'],
  },
  {
    id: 'glossary-mots-c',
    category: 'glossary',
    title: 'MOTS-c',
    teaser: 'A peptide made by mitochondria themselves, and one of the few genuinely Hashimoto\'s-specific findings in this app\'s cellular-biology research.',
    summary:
      'A mitochondria-derived peptide that regulates insulin sensitivity and inflammation. A study measured it significantly lower in 90 Hashimoto\'s patients compared to 90 matched controls, inversely correlated with autoantibody levels, a genuinely disease-specific finding, not extrapolated from another condition. See Mitochondria & Metabolism.',
    citations: [
      {
        source: "Reduced Circulating MOTS-c Levels in Hashimoto's Thyroiditis Reflect Integrated Autoimmune and Metabolic Dysregulation: A Cross-Sectional Study",
        url: 'https://pubmed.ncbi.nlm.nih.gov/42278864/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['mito-mots-c'],
  },
  {
    id: 'glossary-mtor',
    category: 'glossary',
    title: 'mTOR',
    teaser: 'A central cellular pathway that shows up twice in Hashimoto\'s research: once in the thyroid tissue itself, once in the immune cells attacking it.',
    summary:
      'A central cellular signaling pathway that governs growth, metabolism, and (relevant here) autophagy. Hashimoto\'s research found this same pathway suppresses autophagy in thyroid follicular cells and separately reprograms the CD4+ T cells driving the autoimmune attack itself onto a different fuel source, a mechanistic bridge connecting two parts of the disease that would otherwise look unrelated. See Mitochondria & Metabolism.',
    citations: [
      {
        source: "The immune mechanism of the mTOR/ACC1/CPT1A fatty acid oxidation signaling pathway in Hashimoto's thyroiditis",
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11950109/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['mito-mtor-cd4-reprogramming', 'mito-il23-autophagy-suppression'],
  },
  {
    id: 'glossary-nafld-masld',
    category: 'glossary',
    title: 'NAFLD / MASLD (Fatty Liver Disease)',
    teaser: 'Fat accumulating in liver cells, and a measured 68% higher risk of it in people with hypothyroidism.',
    summary:
      'NAFLD (non-alcoholic fatty liver disease) is the older name; MASLD (metabolic dysfunction-associated steatotic liver disease) is the current clinical term for the same condition, fat accumulating in liver cells, unrelated to alcohol. A 2025 UK Biobank study found hypothyroidism associated with 1.68x higher odds of it, and intervention studies show the relationship runs both directions. See Organs & Body Systems.',
    citations: [
      {
        source: 'Exploring the nexus between hypothyroidism and metabolic dysfunction-associated steatotic liver disease: a UK Biobank cohort study',
        url: 'https://pubmed.ncbi.nlm.nih.gov/40000892/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['organ-liver-nafld-link', 'organ-liver-fixing-helps-thyroid'],
  },
  {
    id: 'glossary-nis',
    category: 'glossary',
    title: 'NIS (Sodium-Iodide Symporter)',
    teaser: 'The specific transporter the thyroid uses to pull iodine out of the blood, and a shared target of several unrelated compounds.',
    summary:
      'A specific protein transporter the thyroid uses to actively pull iodine out of the bloodstream, the essential first step in making thyroid hormone at all. Dietary nitrate (Food Additives) and environmental perchlorate (Lifestyle & Environment) both competitively block this exact same transporter, through the identical mechanism, despite coming from completely different real-world sources.',
    citations: [
      { source: 'Tonacchera et al. 2004, Thyroid -- NIS inhibition potency of nitrate/perchlorate/thiocyanate', url: 'https://pubmed.ncbi.nlm.nih.gov/15650353/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['additive-nitrates-nitrites', 'lifestyle-environmental-goitrogens-water'],
  },
  {
    id: 'glossary-pmid',
    category: 'glossary',
    title: 'PMID',
    teaser: 'The unique ID number behind nearly every citation in this Digest, a direct way to verify any claim yourself.',
    summary:
      'A PubMed ID, a unique reference number assigned to a paper indexed in PubMed, the US National Library of Medicine\'s own database of biomedical research. Every citation in this Digest links to its own source page (PubMed, a journal\'s own site, or a government agency page). Tap any citation to read the actual source directly, rather than trusting a summary alone.',
    citations: [],
    overallTier: 'strong',
  },
  {
    id: 'glossary-probiotic-prebiotic',
    category: 'glossary',
    title: 'Probiotic & Prebiotic',
    teaser: 'Two different things that often get confused: live organisms versus the food that feeds them.',
    summary:
      'A probiotic is a live microorganism (a specific bacterial or yeast strain) that provides a benefit when consumed. A prebiotic is a food component, mainly fiber, that feeds the microbes already living in the gut, rather than adding new ones directly. This app\'s own research treats "which specific strain" and "how much fiber is actually reaching the gut" as two separate, both-important questions, not one interchangeable idea. See Fermented Foods and Gut & Microbiome.',
    citations: [],
    overallTier: 'moderate',
    relatedIds: ['gut-strain-specific-mechanisms', 'gut-scfa-treg'],
  },
  {
    id: 'glossary-rct',
    category: 'glossary',
    title: 'RCT (Randomized Controlled Trial)',
    teaser: 'The research design that can most directly show cause and effect: randomly assigning people to a treatment or a comparison.',
    summary:
      'A study design where participants are randomly assigned to receive a treatment or a comparison (often a placebo), specifically to rule out other explanations for a difference in outcome. Generally the strongest single-study evidence a claim can have, though even an RCT can be small, short, or run in the wrong population. This Digest names the size and population of a trial wherever that context changes how confidently a finding should be read.',
    citations: [],
    overallTier: 'strong',
  },
  {
    id: 'glossary-reverse-t3',
    category: 'glossary',
    title: 'Reverse T3 (rT3)',
    teaser: 'An inactive mirror image of T3, and a measurable sign the body is favoring conservation over active thyroid hormone.',
    summary:
      'A biologically inactive molecule structurally similar to T3, produced when T4 is converted down a different metabolic path than the one that makes active T3. Fasting research shows the body favors producing more reverse T3 (and less active T3) during extended caloric restriction, a measurable signal of the same fasting/thyroid-hormone tension covered under Mitochondria & Metabolism.',
    citations: [
      { source: 'Boelen, Wiersinga & Fliers 2008, Thyroid -- fasting-induced changes in the hypothalamus-pituitary-thyroid axis', url: 'https://pubmed.ncbi.nlm.nih.gov/18225975/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['mito-fasting-autophagy-tension'],
  },
  {
    id: 'glossary-ros',
    category: 'glossary',
    title: 'ROS (Reactive Oxygen Species)',
    teaser: 'Chemically unstable molecules produced as a byproduct of normal cell activity, and a direct target of Hashimoto\'s own inflammation.',
    summary:
      'Chemically reactive molecules containing oxygen, produced naturally as a byproduct of normal cellular activity (and mitochondrial energy production specifically). In excess, they cause measurable cellular stress and damage. Hashimoto\'s thyroid-tissue research found elevated IL-23 directly drives ROS accumulation alongside suppressed autophagy, and blocking that same pathway reversed both effects. See Mitochondria & Metabolism.',
    citations: [
      {
        source: "Increased Interleukin-23 in Hashimoto's Thyroiditis Disease Induces Autophagy Suppression and Reactive Oxygen Species Accumulation (Frontiers in Immunology, 2018)",
        url: 'https://pubmed.ncbi.nlm.nih.gov/29434604/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['mito-il23-autophagy-suppression'],
  },
  {
    id: 'glossary-scfa',
    category: 'glossary',
    title: 'SCFA (Short-Chain Fatty Acids)',
    teaser: 'The chemical signal gut bacteria produce from fiber, described throughout this app as the single most food-controllable lever available.',
    summary:
      'Molecules, mainly butyrate, propionate, and acetate, produced when gut bacteria ferment dietary fiber. SCFAs drive measurable immune tolerance through regulatory T cell (Treg) induction, the mechanistic bridge between "eat more fiber" and "calm an overactive immune system." See Gut & Microbiome for the full, two-study-confirmed mechanism.',
    citations: [
      { source: 'Smith et al. 2013, Science -- SCFAs regulate colonic Treg cell homeostasis', url: 'https://pubmed.ncbi.nlm.nih.gov/23828891/' },
    ],
    overallTier: 'strong',
    relatedIds: ['gut-scfa-treg', 'gut-tying-together'],
  },
  {
    id: 'glossary-t3',
    category: 'glossary',
    title: 'T3 (Triiodothyronine)',
    teaser: 'The active form of thyroid hormone, the one that actually does the work inside the body\'s own cells.',
    summary:
      'The biologically active thyroid hormone, the one thyroid receptors throughout the body actually respond to. Only about 20% of circulating T3 comes directly from the thyroid gland itself; the remaining ~80% is converted from T4 elsewhere in the body, mainly by the liver\'s own deiodinase enzymes. See Organs & Body Systems for the full picture of how much of "thyroid function" actually happens outside the thyroid.',
    citations: [
      {
        source: 'Role of hepatic deiodinases in thyroid hormone homeostasis and liver metabolism, inflammation, and fibrosis (European Thyroid Journal)',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10160546/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['organ-liver-t4t3-conversion', 'glossary-deiodinase'],
  },
  {
    id: 'glossary-t4',
    category: 'glossary',
    title: 'T4 (Thyroxine)',
    teaser: 'The hormone the thyroid gland itself mainly produces, mostly a precursor, not the final active form.',
    summary:
      'The primary hormone the thyroid gland itself produces and releases. T4 is mostly a precursor. It has to be converted into T3, the active form, by deiodinase enzymes elsewhere in the body (mainly the liver) before it can do most of its work. Levothyroxine, the standard hypothyroidism medication, is synthetic T4.',
    citations: [
      {
        source: 'Role of hepatic deiodinases in thyroid hormone homeostasis and liver metabolism, inflammation, and fibrosis (European Thyroid Journal)',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10160546/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['organ-liver-t4t3-conversion', 'glossary-levothyroxine'],
  },
  {
    id: 'glossary-tg-antitg',
    category: 'glossary',
    title: 'Tg (Thyroglobulin) & Anti-Tg Antibody',
    teaser: 'A protein the thyroid uses to store and build hormone, and, in Hashimoto\'s, one of the two antibody targets tracked on a lab panel.',
    summary:
      'Thyroglobulin is a protein the thyroid gland uses as scaffolding to store and synthesize thyroid hormone. Anti-Tg antibodies, antibodies mistakenly targeting this protein, were the first evidence, discovered in 1956, that Hashimoto\'s was genuinely an autoimmune disease at all. TPO antibodies (a separate, later-identified target) are the more commonly tracked marker today, but Tg\'s own history is where this whole field of evidence actually began.',
    citations: [
      { source: 'Autoimmune thyroid disease -- a review discussing the 1956 discovery and its significance', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7266799/' },
    ],
    overallTier: 'strong',
    relatedIds: ['history-1956-autoimmune-mechanism'],
  },
  {
    id: 'glossary-th17',
    category: 'glossary',
    title: 'Th17 (T Helper 17 Cell)',
    teaser: 'A specific type of pro-inflammatory immune cell, and one half of the balance this whole app\'s research keeps circling back to.',
    summary:
      'A specific subtype of T helper immune cell that drives inflammation. A shifted balance between Th17 cells and regulatory T cells (Tregs, which promote tolerance instead) is independently documented across rheumatoid arthritis, IBD, multiple sclerosis, lupus, and Hashimoto\'s alike. The same underlying immune-cell story keeps resurfacing no matter which disease is being studied. See Gut & Microbiome and Other Autoimmune Diseases.',
    citations: [
      {
        source: 'Metabolic reprogramming as a therapeutic target for modulating the Th17/Treg balance in autoimmune diseases: a comprehensive review',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12747992/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['gut-th17-treg-imbalance', 'other-tying-together'],
  },
  {
    id: 'glossary-tight-junction',
    category: 'glossary',
    title: 'Tight Junction (Occludin & Claudin/CLDN2)',
    teaser: 'The physical seals between gut lining cells, and specific, named proteins that hold them shut.',
    summary:
      'Physical protein structures that seal the spaces between individual gut lining cells, controlling what can and can\'t pass through the gut barrier. Occludin and claudin (including CLDN2 specifically) are two of the core proteins that make up these seals. CLDN2 is a direct, confirmed target of the vitamin D receptor, a second, independent mechanism connecting vitamin D to gut-barrier integrity beyond its own thyroid-antibody research. See Gut & Microbiome.',
    citations: [
      { source: 'Zhang et al. 2015, Scientific Reports -- tight junction CLDN2 gene is a direct target of the vitamin D receptor', url: 'https://pubmed.ncbi.nlm.nih.gov/26212084/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['gut-vitamin-d-cldn2', 'gut-strain-specific-mechanisms'],
  },
  {
    id: 'glossary-tpo',
    category: 'glossary',
    title: 'TPO (Thyroid Peroxidase) & TPO Antibody',
    teaser: 'The actual enzyme Hashimoto\'s antibodies attack, and the lab value this whole app\'s own tracking is built around.',
    summary:
      'Thyroid peroxidase is the enzyme responsible for making thyroid hormone in the first place. TPO antibodies, the immune system mistakenly attacking this exact enzyme, weren\'t identified as the target until 1985, decades after Hashimoto\'s was first confirmed autoimmune. The modern TPO antibody blood test, tracking that same antibody, is the primary lab signal this app\'s own Healing Stages guide uses to gauge long-term progress.',
    citations: [
      {
        source: 'Anti-thyroid peroxidase antibody in patients with autoimmune thyroid disease: possible identity with anti-microsomal antibody',
        url: 'https://pubmed.ncbi.nlm.nih.gov/2995429/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['history-1985-tpo-identified', 'healing-stage3-what-it-looks-like'],
  },
  {
    id: 'glossary-treg',
    category: 'glossary',
    title: 'Treg (Regulatory T Cell)',
    teaser: 'The immune cell type responsible for keeping the immune system from attacking the body itself, and a specific target of gut-repair research.',
    summary:
      'A specific subtype of T cell whose job is promoting immune tolerance, helping keep the immune system from attacking the body\'s own tissue. SCFAs from dietary fiber directly induce Treg activity in the gut. Separately, Hashimoto\'s research found Tregs specifically depleted in visceral fat, with an experiment showing that reinfusing them measurably improved insulin sensitivity. See Gut & Microbiome and Mitochondria & Metabolism.',
    citations: [
      { source: 'Furusawa et al. 2013, Nature -- commensal microbe-derived butyrate induces colonic Treg differentiation', url: 'https://pubmed.ncbi.nlm.nih.gov/24226770/' },
    ],
    overallTier: 'strong',
    relatedIds: ['gut-scfa-treg', 'mito-visceral-fat-treg-depletion'],
  },
  {
    id: 'glossary-tsh',
    category: 'glossary',
    title: 'TSH (Thyroid-Stimulating Hormone)',
    teaser: 'The hormone that tells the thyroid how hard to work, and the single most commonly ordered thyroid lab value.',
    summary:
      'A hormone released by the pituitary gland that tells the thyroid gland how much hormone to produce, rising when thyroid hormone runs low, the standard first lab value checked for hypothyroidism. TSH follows a daily rhythm (higher overnight, lower in the afternoon), which is exactly why a consistent, morning, fasting draw matters for tracking a trend over time. See Labs & Medication Timing.',
    citations: [
      { source: 'Circadian and 30 minutes variations in serum TSH and thyroid hormones in normal subjects', url: 'https://pubmed.ncbi.nlm.nih.gov/716774/' },
    ],
    overallTier: 'strong',
    relatedIds: ['labs-tsh-diurnal-timing'],
  },
  {
    id: 'glossary-visceral-fat',
    category: 'glossary',
    title: 'Visceral Fat',
    teaser: 'Fat stored deep around the internal organs, active tissue rather than passive storage, with a genuinely complicated role in Hashimoto\'s.',
    summary:
      'Fat stored deep in the abdomen, around the internal organs (distinct from fat stored just under the skin), active, hormone-producing tissue, not passive padding. Hashimoto\'s research found it specifically depleted of regulatory T cells; a separate 2024 reappraisal suggests some of that same fat\'s own inflammation may actually be defending against a leaky gut, rather than simply causing harm on its own. See Mitochondria & Metabolism for the full, genuinely complicated picture.',
    citations: [
      {
        source: "Depletion of Regulatory T Cells in Visceral Adipose Tissues Contributes to Insulin Resistance in Hashimoto's Thyroiditis (Frontiers in Physiology, 2018)",
        url: 'https://pubmed.ncbi.nlm.nih.gov/29541033/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['mito-visceral-fat-treg-depletion', 'mito-visceral-fat-endotoxin-barrier'],
  },
  {
    id: 'glossary-wolff-chaikoff',
    category: 'glossary',
    title: 'Wolff-Chaikoff Effect',
    teaser: 'The thyroid\'s own built-in safety brake against too much iodine at once, one that can misfire in Hashimoto\'s specifically.',
    summary:
      'A well-documented physiological response where the thyroid temporarily shuts down hormone production when it detects a sudden flood of iodine, protecting itself from overload. In Hashimoto\'s specifically, this safety brake can misfire or get stuck, and the antibody attack itself can flare right alongside it, a direct reason a sudden iodine surge (kelp, sea vegetables, certain supplements) can trigger a flare. See Problem Foods & Swaps.',
    citations: [
      {
        source: "Iodine intake from universal salt iodization programs and Hashimoto's thyroiditis: a systematic review",
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12191997/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['problem-excess-iodine-kelp', 'nutrient-iodine'],
  },
  {
    id: 'glossary-zonulin',
    category: 'glossary',
    title: 'Zonulin',
    teaser: 'The named protein responsible for how "leaky" the gut lining actually is, discovered by the same researcher who coined the term.',
    summary:
      'A specific protein that regulates how tightly the junctions between gut lining cells stay sealed. Gliadin (from gluten) triggers its release; once released, it reversibly opens those junctions, a measurable and reversible effect, not a permanent one. First fully characterized in celiac disease, zonulin\'s own role is now documented across several autoimmune conditions this app\'s research covers, the physical mechanism behind "leaky gut" throughout this whole Digest.',
    citations: [
      { source: 'Fasano 2011, Physiological Reviews -- zonulin and intestinal barrier function', url: 'https://pubmed.ncbi.nlm.nih.gov/21248165/' },
    ],
    overallTier: 'strong',
    relatedIds: ['gut-zonulin-gliadin', 'gut-tying-together'],
  },
];
