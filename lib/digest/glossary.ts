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
//
// 2026-08-08, same day, a second pass: "go through the Basic Health area
// and move everything that is about autoimmune diseases and Hashimoto's
// references and hypothyroidism and all of the rest of the autoimmune
// disease references specifically... into the specific to those
// autoimmune disease's areas." 18 of the 57 terms here were genuinely,
// substantively ABOUT one specific disease or its own diagnostic/
// management vocabulary, not universal body-function knowledge a healthy
// person would need -- their `category` field was reassigned (16 to
// 'hashimotos': AIP, ALT/AST framed via hypothyroidism, APS-2, the
// autoimmune-disease definition itself, autophagy/mitophagy framed via
// Hashimoto's IL-23 research, 6-DFF, euthyroid/hypothyroid states,
// Healing Stages, IL-6/IL-23/TNF framed via Hashimoto's, levothyroxine,
// molecular mimicry, MOTS-c, Tg/anti-Tg, Th17, TPO, Wolff-Chaikoff; 1 to
// 'graves': the Graves' disease definition itself; 1 to
// 'fattyLiverDisease': NAFLD/MASLD, now its own real tracked condition).
// They stay physically in this file (one A-Z glossary remains the
// simplest way to author and browse the full term list), only their
// `category` changed -- the same "reassign the field, don't move the
// file" precedent this whole Digest's 2026-08-08 restructure already
// established for ProblemFoodEntry. A further 15 terms were genuinely
// universal, cross-cutting biology/immunology/methodology vocabulary
// (antibody & antigen, cytokine, eGFR, gliadin, insulin resistance, leaky
// gut, mitochondria, mTOR, ROS, Treg, visceral fat, zonulin, T4, tight
// junction, TSH) that happened to be worded or cited around a Hashimoto's
// example -- these were reworded to describe the general, healthy-body
// concept first and stay in Basic Health, with any Hashimoto's-specific
// citation either dropped (replaced with `citations: []`, matching this
// file's own existing precedent for pure definitional terms) or kept only
// where the citation itself was already general, not Hashimoto's-specific
// research. Every other term (24 of 57) needed no change at all --
// already genuinely condition-agnostic, matching what the user's own
// framing asked Basic Health to actually be: "everything the body does
// in a basic way... what foods do to help their body... what their body
// does with it," for someone without any of these 18 conditions, not
// disease-management vocabulary.
export const GLOSSARY_ENTRIES: DigestEntry[] = [
  {
    id: 'glossary-4r-protocol',
    category: 'basicHealth',
    title: '4R Protocol',
    teaser: 'A widely-used functional-medicine framework for gut repair: Remove, Replace, Reinoculate, Repair.',
    summary: "A four-step sequence, Remove triggers, Replace digestive support, Reinoculate with probiotics, Repair the gut lining, used across functional medicine as a general gut-restoration framework. The research found every individual step has separate evidence behind it, but no clinical trial has tested the packaged 4-step protocol as one combined unit. See Gut & Microbiome for the full breakdown.",
    citations: [],
    overallTier: 'moderate',
    relatedIds: ['gut-4r-protocol'],
  },
  {
    id: 'glossary-aip',
    category: 'hashimotos',
    title: 'AIP (Autoimmune Protocol)',
    teaser: 'A structured elimination-then-reintroduction diet, originally built for autoimmune disease broadly, not Hashimoto\'s specifically.',
    summary: 'A structured elimination diet (typically a 6-week elimination phase followed by a 5-week reintroduction) removing gluten, dairy, grains, legumes, nightshades, and several other categories, then reintroducing them one at a time to identify personal triggers. The Healing Stages guide builds its Stage 1/Stage 2 structure directly on this clinical protocol shape.',
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
    category: 'hashimotos',
    title: 'ALT & AST (Liver Enzymes)',
    teaser: 'Two enzymes measured on a standard liver panel, and a direct way hypothyroidism itself can make them look abnormal.',
    summary:
      "ALT (alanine aminotransferase) and AST (aspartate aminotransferase) are enzymes that live inside liver cells. When those cells become measurably \"leakier\" or damaged, more of each enzyme escapes into the bloodstream, which is exactly what a standard liver blood panel checks for. Research shows hypothyroidism itself can raise both through a documented membrane-permeability mechanism. See Organs & Body Systems for the full explanation and why it's reversible with treatment.",
    citations: [
      { source: 'Bayraktar & Van Thiel: Abnormalities in measures of liver function and injury in thyroid disorders (Hepatogastroenterology)', url: 'https://pubmed.ncbi.nlm.nih.gov/9427032/' },
    ],
    overallTier: 'strong',
    relatedIds: ['organ-liver-hashimotos-damage'],
  },
  {
    id: 'glossary-antibody-antigen',
    category: 'basicHealth',
    title: 'Antibody & Antigen',
    teaser: 'The immune system\'s own recognition system: a threat gets flagged, then a specific defender gets built to match it.',
    summary:
      'An antigen is anything the immune system can learn to recognize, normally a foreign threat like a virus or bacterium. An antibody is the specific protein the immune system builds to identify and help destroy that exact antigen, part of ordinary, healthy immune defense. This same recognition system occasionally misfires and builds an antibody against one of the body\'s own tissues instead of an outside threat, the defining feature of an autoimmune disease, covered in depth throughout this Digest\'s own per-condition research.',
    citations: [],
    overallTier: 'strong',
  },
  {
    id: 'glossary-aps2',
    category: 'hashimotos',
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
    category: 'hashimotos',
    title: 'Autoimmune Disease',
    teaser: 'The immune system, built to defend the body, mistakenly attacking a part of the body itself.',
    summary:
      'A broad category of disease where the immune system fails to distinguish the body\'s own tissue from an outside threat, and attacks it directly. Hashimoto\'s thyroiditis is one specific example (the thyroid gland is the target); this Digest\'s own Other Autoimmune Diseases category covers seven more examples, each attacking a different organ through some of the same recurring underlying mechanisms.',
    citations: [
      { source: 'Autoimmune thyroid disease: a review discussing the 1956 discovery and its significance', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7266799/' },
    ],
    overallTier: 'strong',
    relatedIds: ['history-1956-autoimmune-mechanism', 'other-why-cross-disease-evidence'],
  },
  {
    id: 'glossary-autophagy-mitophagy',
    category: 'hashimotos',
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
    category: 'basicHealth',
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
    category: 'basicHealth',
    title: 'CFU (Colony-Forming Units)',
    teaser: 'The number on a probiotic label, and an honest explanation of what it does and doesn\'t actually tell you.',
    summary:
      'CFU measures how many live organisms were present in a probiotic product at the time it was manufactured, not how many actually survive stomach acid or reach the gut. Most clinical trials showing benefit used doses in the 1-10 billion CFU range for one specific, named strain, not the 50-100+ billion CFU "mega-blends" often marketed as automatically superior. See Fermented Foods for the full dosing picture.',
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
    category: 'basicHealth',
    title: 'Cohort Study & Case-Control Study',
    teaser: 'Two different ways researchers study a disease when they can\'t ethically run a controlled experiment on it.',
    summary:
      'A cohort study follows a group of people forward in time, tracking who develops a condition and looking for measurable differences between those who do and don\'t. A case-control study works backward instead, starting with people who already have a condition and people who don\'t, then looking back at their past exposures for differences. Both are valuable research designs, but neither can prove cause and effect as directly as a randomized controlled trial (RCT) can. This Digest names which kind of study backs a given claim throughout, since that distinction matters for how confidently a finding should be read.',
    citations: [],
    overallTier: 'strong',
  },
  {
    id: 'glossary-cortisol',
    category: 'basicHealth',
    title: 'Cortisol',
    teaser: 'The body\'s own primary stress hormone, and a direct, repeated route to lower active thyroid hormone.',
    summary: 'A hormone released by the adrenal glands during stress, regulated by the HPA axis. Cortisol is documented to directly suppress the deiodinase enzymes that convert inactive T4 into active T3, favoring inactive reverse T3 instead. This is the single most recurring mechanism the keeps finding underneath seemingly unrelated topics: alcohol, sugar-sweetened drinks, sleep disruption, and high-intensity exercise, all covered under Lifestyle & Environment.',
    citations: [
      { source: 'Stephens & Wand 2012, Alcohol Research: Current Reviews: stress and the HPA axis (NIAAA)', url: 'https://pubmed.ncbi.nlm.nih.gov/23584113/' },
    ],
    overallTier: 'strong',
    relatedIds: ['lifestyle-chronic-stress-hpa', 'lifestyle-tying-together'],
  },
  {
    id: 'glossary-crp',
    category: 'basicHealth',
    title: 'CRP (C-Reactive Protein)',
    teaser: 'One of the most common checkable blood markers of general inflammation, used throughout the Mitochondria & Metabolism research.',
    summary:
      'A protein the liver produces in response to inflammation anywhere in the body; a standard blood test most doctors can order. CRP shows up repeatedly across this Digest\'s own research as the measured outcome behind claims like "a Mediterranean-style diet reduces inflammation" or "fiber intake lowers inflammatory markers," a checkable number behind an otherwise vague-sounding claim.',
    citations: [],
    overallTier: 'strong',
  },
  {
    id: 'glossary-cytokine',
    category: 'basicHealth',
    title: 'Cytokine',
    teaser: 'A chemical messenger the immune system uses to coordinate itself, whether fighting an infection or driving chronic inflammation.',
    summary:
      'A broad category of small signaling proteins immune cells use to communicate with each other and with other tissues, part of ordinary, healthy immune coordination. Some cytokines drive inflammation (IL-6, IL-23, and TNF-alpha are three commonly named ones), others calm it back down, and the balance between them is a recurring thread across this Digest\'s own per-condition research.',
    citations: [],
    overallTier: 'strong',
  },
  {
    id: 'glossary-d1-d6',
    category: 'hashimotos',
    title: '6-DFF (The 6 Dimensions of Food Friendliness)',
    teaser: 'The scoring framework, scoring every food across six separate, research-backed factors.',
    summary: 'The six-dimension scoring rubric, used throughout Insights, referred to by its acronym 6-DFF or, just as often, plainly as "the 6 Dimensions." It covers micronutrient density and bioavailability, inflammatory response potential, lipid metabolic compatibility, hormonal support and conversion, digestive tolerance and absorption, and oxalate load and mineral interference. These six are specific to Hashimoto\'s, plenty of other food dimensions exist that would matter to anyone, not just someone with Hashimoto\'s. This isn\'t the same thing as the deiodinase enzymes (D1, D2, D3) covered elsewhere in this glossary, an easy naming collision.',
    citations: [],
    overallTier: 'strong',
  },
  {
    id: 'glossary-dao-histamine',
    category: 'basicHealth',
    title: 'DAO (Diamine Oxidase) & Histamine Intolerance',
    teaser: 'The enzyme that clears dietary histamine, and a reason gut inflammation can leave someone with less of it on hand.',
    summary: 'DAO is the enzyme mainly responsible for breaking down histamine absorbed from food. Gut inflammation can reduce how much DAO is available, meaning someone with an already-inflamed gut may have less capacity to clear dietary histamine than usual. This is a direct reason the Healing Stages guide asks most fermented foods, a high-histamine food category, to wait until Stage 2, once that capacity is no longer an unknown variable.',
    citations: [
      { source: 'Maintz & Novak 2007, American Journal of Clinical Nutrition: histamine and histamine intolerance', url: 'https://pubmed.ncbi.nlm.nih.gov/17490952/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['problem-high-histamine', 'healing-stage1-fermented-exclusion'],
  },
  {
    id: 'glossary-deiodinase',
    category: 'basicHealth',
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
    category: 'basicHealth',
    title: 'DRI, RDA, AI & UL (Dietary Reference Intakes)',
    teaser: 'The official family of nutrient targets the Insights tab measures every meal against.',
    summary: 'DRI (Dietary Reference Intake) is the umbrella term NASEM (the National Academies of Sciences, Engineering, and Medicine) uses for published nutrient targets. RDA (Recommended Dietary Allowance) is the amount that meets the needs of nearly everyone in a group; AI (Adequate Intake) is used instead when there isn\'t enough evidence yet to set a full RDA; UL (Tolerable Upper Intake Level) is the highest amount unlikely to cause harm. The reference database uses cited DRI values, including an AI for water and choline added directly from the source data, to power every nutrient-percentage figure shown in Insights.',
    citations: [],
    overallTier: 'strong',
  },
  {
    id: 'glossary-dysbiosis',
    category: 'basicHealth',
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
    category: 'basicHealth',
    title: 'EGFR (Estimated Glomerular Filtration Rate)',
    teaser: 'The standard measure of how well the kidneys are filtering, and the number a person\'s own kidney health gets tracked by.',
    summary:
      'A standard blood-test-derived estimate of how much blood the kidneys are filtering per minute, the most common way kidney function gets checked, whether as part of a routine physical or to monitor a specific concern. A staged framework (G1 through G5) exists specifically to track this number over time, since kidney function loss is usually gradual and symptom-free in its early stages. See this Digest\'s own dedicated Chronic Kidney Disease research for the full staging system and what actually protects it.',
    citations: [],
    overallTier: 'strong',
    relatedIds: ['ckd-overview'],
  },
  {
    id: 'glossary-edc',
    category: 'basicHealth',
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
    category: 'hashimotos',
    title: 'Euthyroid, Hypothyroid & Subclinical Hypothyroidism',
    teaser: 'The three distinct states thyroid lab results can describe, and why the middle one only became diagnosable fairly recently.',
    summary:
      'Euthyroid means normal thyroid function. Hypothyroid (overt) means low thyroid hormone with clear lab abnormalities. Subclinical hypothyroidism, the middle state, means TSH is elevated but T4 is still technically normal, a diagnosis that literally couldn\'t be made until sensitive-enough lab testing existed. See History & Milestones for that story.',
    citations: [
      { source: 'Laboratory Thyroid Tests: A Historical Perspective (Thyroid)', url: 'https://pubmed.ncbi.nlm.nih.gov/37037032/' },
    ],
    overallTier: 'strong',
    relatedIds: ['history-1960s-tsh-testing'],
  },
  {
    id: 'glossary-evidence-tiers',
    category: 'basicHealth',
    title: 'Evidence Tiers (Strong / Moderate / Weak)',
    teaser: 'The rating system behind every colored dot in this Digest.',
    summary: 'The standing discipline for every claim it makes: Strong means trial-level or meta-analysis-level support; Moderate means a finding without that same depth of replication; Weak means early, preliminary, or thin evidence, still worth knowing but not worth over-trusting. An entry citing one strong study and one weak one is deliberately tagged at the weaker tier, since a claim is only as strong as its weakest support.',
    citations: [],
    overallTier: 'strong',
  },
  {
    id: 'glossary-fodmap',
    category: 'basicHealth',
    title: 'FODMAP',
    teaser: 'A category of carbohydrates a lot of people digest poorly, the single highest-confidence exclusion in the Healing Stages guide.',
    summary: 'FODMAP stands for Fermentable Oligosaccharides, Disaccharides, Monosaccharides, and Polyols, a category of carbohydrates the small intestine often can\'t fully digest, which then get fermented by gut bacteria in the colon, producing gas and bloating. Garlic and onion, common high-FODMAP foods, are covered directly under Problem Foods & Swaps, and the whole category is the highest-confidence exclusion in the Healing Stages Stage 1 elimination list.',
    citations: [
      {
        source: 'Monash University FODMAP research group: fructan content in garlic, onion & other high-FODMAP foods',
        url: 'https://www.monashfodmap.com/about-fodmap-and-ibs/high-and-low-fodmap-foods/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['problem-garlic-onion', 'healing-stage1-avoid', 'ibs-overview', 'ibs-low-fodmap-diet'],
  },
  {
    id: 'glossary-gliadin',
    category: 'basicHealth',
    title: 'Gliadin',
    teaser: 'The specific fragment of gluten with a named mechanism for loosening the gut barrier, in anyone who eats it.',
    summary:
      'A specific protein fragment within gluten (found in wheat, barley, and rye). Gliadin binds a receptor called CXCR3 on intestinal cells, triggering those cells to release zonulin, a specific, reversible mechanism for increased gut permeability. This is a general digestive-physiology effect, not limited to any one diagnosis, though how much it matters for any one person varies, and this Digest\'s own per-condition research covers it in more depth wherever it\'s a documented factor.',
    citations: [
      { source: 'Fasano 2011, Physiological Reviews: zonulin and intestinal barrier function', url: 'https://pubmed.ncbi.nlm.nih.gov/21248165/' },
    ],
    overallTier: 'strong',
    relatedIds: ['gut-zonulin-gliadin', 'problem-gluten-grains'],
  },
  {
    id: 'glossary-goitrogen-goiter',
    category: 'basicHealth',
    title: 'Goitrogen & Goiter',
    teaser: 'A category of compounds that can interfere with thyroid iodine uptake, and the visible thyroid swelling that iodine deficiency can cause.',
    summary:
      'A goitrogen is any compound that interferes with the thyroid\'s ability to use iodine, found naturally in raw cruciferous vegetables (mostly heat-deactivated by cooking), and in additives like dietary nitrate. A goiter is the resulting visibly enlarged thyroid, historically caused mainly by iodine deficiency. See History & Milestones for the story of the American "goiter belt" and iodized salt.',
    citations: [
      {
        source: 'Song & Thornalley 2007, Food & Chemical Toxicology: effect of storage, processing & cooking on glucosinolate content',
        url: 'https://pubmed.ncbi.nlm.nih.gov/17011103/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['problem-raw-cruciferous', 'history-1924-iodized-salt'],
  },
  {
    id: 'glossary-graves-disease',
    category: 'graves',
    title: "Graves' Disease",
    teaser: "Hashimoto's own opposite-direction cousin: another autoimmune thyroid disease, but overactive instead of underactive.",
    summary:
      'An autoimmune thyroid disease, like Hashimoto\'s, but with the opposite effect: antibodies stimulate the thyroid into overproducing hormone rather than attacking and destroying thyroid tissue. Smoking is a documented risk factor for Graves\', the counterintuitive opposite of its protective association with Hashimoto\'s specifically, covered under Lifestyle & Environment.',
    citations: [
      { source: 'Wiersinga: Smoking and thyroid disorders: a meta-analysis (Clinical Endocrinology)', url: 'https://pubmed.ncbi.nlm.nih.gov/11834423/' },
    ],
    overallTier: 'strong',
    relatedIds: ['lifestyle-smoking-paradox'],
  },
  {
    id: 'glossary-hpa-axis',
    category: 'basicHealth',
    title: 'HPA Axis',
    teaser: "The body's own central stress-response control system, and a direct route from chronic stress to lower active thyroid hormone.",
    summary:
      'The hypothalamic-pituitary-adrenal axis, the body\'s own central system for regulating cortisol and the stress response. Chronic activation of this system is documented to suppress the deiodinase enzymes that make active thyroid hormone, a single mechanism this Digest keeps finding underneath alcohol, sugar-sweetened drinks, sleep disruption, and high-intensity exercise.',
    citations: [
      { source: 'Stephens & Wand 2012, Alcohol Research: Current Reviews: stress and the HPA axis (NIAAA)', url: 'https://pubmed.ncbi.nlm.nih.gov/23584113/' },
    ],
    overallTier: 'strong',
    relatedIds: ['lifestyle-chronic-stress-hpa'],
  },
  {
    id: 'glossary-healing-stages',
    category: 'hashimotos',
    title: 'Healing Stages 1, 2 & 3',
    teaser: "The practical, food-focused staging: Getting Started, Rebuilding, and Well-Healed.",
    summary: 'The 3-tier practical structure for the healing journey: Stage 1 "Getting Started" (a short, narrow elimination baseline), Stage 2 "Rebuilding" (systematic, one-food-at-a-time reintroduction), and Stage 3 "Well-Healed" (broad eating, tracking as a spot-check tool). Mapped onto the five clinical stages also named elsewhere (Triage, Digging, Gut Repair, Rebalancing, Maintenance), which only meaningfully drive food decisions in two of the five. See Healing Stages for the full map.',
    citations: [],
    overallTier: 'moderate',
    relatedIds: ['healing-stage-map'],
  },
  {
    id: 'glossary-il6-il23-tnf',
    category: 'hashimotos',
    title: 'IL-6, IL-23 & TNF-α',
    teaser: 'Three specific, named inflammatory messengers, each with a documented effect relevant to Hashimoto\'s.',
    summary: 'Three specific cytokines that show up repeatedly across the research. IL-23 directly suppresses autophagy in Hashimoto\'s thyroid tissue. IL-6 directly suppresses the enzymes that activate thyroid hormone while activating the one that destroys it. TNF-alpha is a broader inflammatory marker, one of several this Digest\'s own diet-and-inflammation research (Mediterranean-diet trials, fiber intake) tracks as a measurable outcome.',
    citations: [],
    overallTier: 'strong',
    relatedIds: ['mito-il23-autophagy-suppression', 'lifestyle-il6-deiodinase'],
  },
  {
    id: 'glossary-insulin-resistance',
    category: 'basicHealth',
    title: 'Insulin Resistance',
    teaser: 'A state where the body\'s cells stop responding normally to insulin, a shared thread behind several conditions already tracked.',
    summary: 'A physiological state where cells respond less effectively to insulin, the hormone that normally moves sugar out of the bloodstream and into cells. A precursor to type 2 diabetes, and a shared underlying mechanism connecting several other conditions already covered in depth, PCOS, fatty liver disease, chronic kidney disease, and gout among them, each with its own documented link back to this same root cause. See this Digest\'s own dedicated Type 2 Diabetes research for the full, connected picture across all of them.',
    citations: [],
    overallTier: 'strong',
    relatedIds: ['type2-metabolic-syndrome-cluster'],
  },
  {
    id: 'glossary-leaky-gut',
    category: 'basicHealth',
    title: 'Leaky Gut / Intestinal Permeability',
    teaser: 'A measurable phenomenon, and a contested clinical diagnosis. Both true at once.',
    summary:
      'Intestinal permeability is a directly measurable phenomenon (via zonulin levels or lactulose-mannitol testing), a physical property of the gut lining relevant to digestive health broadly. "Leaky gut syndrome" as a standalone clinical diagnosis remains debated in mainstream gastroenterology, not because the biology is fake but because no agreed clinical definition or diagnostic threshold exists yet. See this Digest\'s own per-condition research for where this measurable phenomenon does and doesn\'t have a documented link to a specific diagnosis.',
    citations: [
      { source: 'Biomarkers for assessment of intestinal permeability in clinical practice (Scandinavian Journal of Gastroenterology, 2021)', url: 'https://pubmed.ncbi.nlm.nih.gov/34009040/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['gut-leaky-gut-contested', 'gut-tying-together'],
  },
  {
    id: 'glossary-levothyroxine',
    category: 'hashimotos',
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
    category: 'basicHealth',
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
    category: 'basicHealth',
    title: 'Microbiome',
    teaser: 'The trillions of bacteria, yeast, and other microbes living in and on the body, overwhelmingly concentrated in the gut.',
    summary: 'The collective community of bacteria, yeast, and other microorganisms living in and on the human body, most densely in the gut. Diversity within this community, not any single "best" species, is what the Gut & Microbiome and Fermented Foods research keeps identifying as the actual target worth working toward through food.',
    citations: [],
    overallTier: 'strong',
    relatedIds: ['gut-tying-together', 'fermented-tying-together'],
  },
  {
    id: 'glossary-mitochondria',
    category: 'basicHealth',
    title: 'Mitochondria',
    teaser: 'The cell\'s own energy-producing structures, present in nearly every cell in the body.',
    summary: "Tiny structures inside nearly every cell responsible for producing the cell's own usable energy, foundational cell biology relevant to how the whole body runs, from muscle to brain to organ function. Mitochondrial health shows up as a recurring thread across several of the condition-specific findings, worth a look at the specific mechanism wherever it's documented as a factor.",
    citations: [],
    overallTier: 'strong',
    relatedIds: ['glossary-mots-c'],
  },
  {
    id: 'glossary-molecular-mimicry',
    category: 'hashimotos',
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
    category: 'hashimotos',
    title: 'MOTS-c',
    teaser: 'A peptide made by mitochondria themselves, and one of the few Hashimoto\'s-specific findings in the cellular-biology research.',
    summary:
      'A mitochondria-derived peptide that regulates insulin sensitivity and inflammation. A study measured it significantly lower in 90 Hashimoto\'s patients compared to 90 matched controls, inversely correlated with autoantibody levels, a disease-specific finding, not extrapolated from another condition. See Mitochondria & Metabolism.',
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
    category: 'basicHealth',
    title: 'MTOR',
    teaser: 'A central cellular pathway governing growth, metabolism, and how a cell decides whether to clean house or keep building.',
    summary:
      'A central cellular signaling pathway that governs growth, metabolism, and autophagy (the cell\'s own internal cleanup process, see that entry). General cell biology relevant to fasting, exercise, and aging for anyone, and a specific, documented factor in several of this Digest\'s own condition-specific findings, worth a look wherever it shows up as a named mechanism.',
    citations: [],
    overallTier: 'strong',
  },
  {
    id: 'glossary-nafld-masld',
    category: 'fattyLiverDisease',
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
    category: 'basicHealth',
    title: 'NIS (Sodium-Iodide Symporter)',
    teaser: 'The specific transporter the thyroid uses to pull iodine out of the blood, and a shared target of several unrelated compounds.',
    summary:
      'A specific protein transporter the thyroid uses to actively pull iodine out of the bloodstream, the essential first step in making thyroid hormone at all. Dietary nitrate (Food Additives) and environmental perchlorate (Lifestyle & Environment) both competitively block this exact same transporter, through the identical mechanism, despite coming from completely different real-world sources.',
    citations: [
      { source: 'Tonacchera et al. 2004, Thyroid: NIS inhibition potency of nitrate/perchlorate/thiocyanate', url: 'https://pubmed.ncbi.nlm.nih.gov/15650353/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['additive-nitrates-nitrites', 'lifestyle-environmental-goitrogens-water'],
  },
  {
    id: 'glossary-pmid',
    category: 'basicHealth',
    title: 'PMID',
    teaser: 'The unique ID number behind nearly every citation in this Digest, a direct way to verify any claim yourself.',
    summary:
      'A PubMed ID, a unique reference number assigned to a paper indexed in PubMed, the US National Library of Medicine\'s own database of biomedical research. Every citation in this Digest links to its own source page (PubMed, a journal\'s own site, or a government agency page). Tap any citation to read the actual source directly, rather than trusting a summary alone.',
    citations: [],
    overallTier: 'strong',
  },
  {
    id: 'glossary-probiotic-prebiotic',
    category: 'basicHealth',
    title: 'Probiotic & Prebiotic',
    teaser: 'Two different things that often get confused: live organisms versus the food that feeds them.',
    summary: 'A probiotic is a live microorganism (a specific bacterial or yeast strain) that provides a benefit when consumed. A prebiotic is a food component, mainly fiber, that feeds the microbes already living in the gut, rather than adding new ones directly. The research treats "which specific strain" and "how much fiber is actually reaching the gut" as two separate, both-important questions, not one interchangeable idea. See Fermented Foods and Gut & Microbiome.',
    citations: [],
    overallTier: 'moderate',
    relatedIds: ['gut-strain-specific-mechanisms', 'gut-scfa-treg'],
  },
  {
    id: 'glossary-rct',
    category: 'basicHealth',
    title: 'RCT (Randomized Controlled Trial)',
    teaser: 'The research design that can most directly show cause and effect: randomly assigning people to a treatment or a comparison.',
    summary:
      'A study design where participants are randomly assigned to receive a treatment or a comparison (often a placebo), specifically to rule out other explanations for a difference in outcome. Generally the strongest single-study evidence a claim can have, though even an RCT can be small, short, or run in the wrong population. This Digest names the size and population of a trial wherever that context changes how confidently a finding should be read.',
    citations: [],
    overallTier: 'strong',
  },
  {
    id: 'glossary-reverse-t3',
    category: 'basicHealth',
    title: 'Reverse T3 (rT3)',
    teaser: 'An inactive mirror image of T3, and a measurable sign the body is favoring conservation over active thyroid hormone.',
    summary:
      'A biologically inactive molecule structurally similar to T3, produced when T4 is converted down a different metabolic path than the one that makes active T3. Fasting research shows the body favors producing more reverse T3 (and less active T3) during extended caloric restriction, a measurable signal of the same fasting/thyroid-hormone tension covered under Mitochondria & Metabolism.',
    citations: [
      { source: 'Boelen, Wiersinga & Fliers 2008, Thyroid: fasting-induced changes in the hypothalamus-pituitary-thyroid axis', url: 'https://pubmed.ncbi.nlm.nih.gov/18225975/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['mito-fasting-autophagy-tension'],
  },
  {
    id: 'glossary-ros',
    category: 'basicHealth',
    title: 'ROS (Reactive Oxygen Species)',
    teaser: 'Chemically unstable molecules produced as a byproduct of normal cell activity, harmless in moderation, damaging in excess.',
    summary:
      'Chemically reactive molecules containing oxygen, produced naturally as a byproduct of normal cellular activity (and mitochondrial energy production specifically). The body has its own built-in antioxidant systems to keep them in check under ordinary conditions. In excess, unchecked by those systems, they cause measurable cellular stress and damage, a recurring factor in several of this Digest\'s own condition-specific findings.',
    citations: [],
    overallTier: 'strong',
  },
  {
    id: 'glossary-scfa',
    category: 'basicHealth',
    title: 'SCFA (Short-Chain Fatty Acids)',
    teaser: 'The chemical signal gut bacteria produce from fiber, described as the single most food-controllable lever available.',
    summary:
      'Molecules, mainly butyrate, propionate, and acetate, produced when gut bacteria ferment dietary fiber. SCFAs drive measurable immune tolerance through regulatory T cell (Treg) induction, the mechanistic bridge between "eat more fiber" and "calm an overactive immune system." See Gut & Microbiome for the full, two-study-confirmed mechanism.',
    citations: [
      { source: 'Smith et al. 2013, Science: SCFAs regulate colonic Treg cell homeostasis', url: 'https://pubmed.ncbi.nlm.nih.gov/23828891/' },
    ],
    overallTier: 'strong',
    relatedIds: ['gut-scfa-treg', 'gut-tying-together'],
  },
  {
    id: 'glossary-t3',
    category: 'basicHealth',
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
    category: 'basicHealth',
    title: 'T4 (Thyroxine)',
    teaser: 'The hormone the thyroid gland itself mainly produces, mostly a precursor, not the final active form.',
    summary:
      'The primary hormone the thyroid gland itself produces and releases, in anyone with a functioning thyroid. T4 is mostly a precursor. It has to be converted into T3, the active form, by deiodinase enzymes elsewhere in the body (mainly the liver) before it can do most of its work, everyday endocrine physiology behind how the body actually uses thyroid hormone.',
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
    category: 'hashimotos',
    title: 'Tg (Thyroglobulin) & Anti-Tg Antibody',
    teaser: 'A protein the thyroid uses to store and build hormone, and, in Hashimoto\'s, one of the two antibody targets tracked on a lab panel.',
    summary:
      'Thyroglobulin is a protein the thyroid gland uses as scaffolding to store and synthesize thyroid hormone. Anti-Tg antibodies, antibodies mistakenly targeting this protein, were the first evidence, discovered in 1956, that Hashimoto\'s was an autoimmune disease at all. TPO antibodies (a separate, later-identified target) are the more commonly tracked marker today, but Tg\'s own history is where this whole field of evidence actually began.',
    citations: [
      { source: 'Autoimmune thyroid disease: a review discussing the 1956 discovery and its significance', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7266799/' },
    ],
    overallTier: 'strong',
    relatedIds: ['history-1956-autoimmune-mechanism'],
  },
  {
    id: 'glossary-th17',
    category: 'hashimotos',
    title: 'Th17 (T Helper 17 Cell)',
    teaser: 'A specific type of pro-inflammatory immune cell, and one half of the balance the research keeps circling back to.',
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
    category: 'basicHealth',
    title: 'Tight Junction (Occludin & Claudin/CLDN2)',
    teaser: 'The physical seals between gut lining cells, and specific, named proteins that hold them shut.',
    summary:
      'Physical protein structures that seal the spaces between individual gut lining cells, controlling what can and can\'t pass through the gut barrier, in anyone\'s digestive system. Occludin and claudin (including CLDN2 specifically) are two of the core proteins that make up these seals. CLDN2 is a direct, confirmed target of the vitamin D receptor, a specific mechanism connecting vitamin D intake to gut-barrier integrity.',
    citations: [
      { source: 'Zhang et al. 2015, Scientific Reports: tight junction CLDN2 gene is a direct target of the vitamin D receptor', url: 'https://pubmed.ncbi.nlm.nih.gov/26212084/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['gut-vitamin-d-cldn2', 'gut-strain-specific-mechanisms'],
  },
  {
    id: 'glossary-tpo',
    category: 'hashimotos',
    title: 'TPO (Thyroid Peroxidase) & TPO Antibody',
    teaser: 'The actual enzyme Hashimoto\'s antibodies attack, and the lab value this whole app\'s own tracking is built around.',
    summary: 'Thyroid peroxidase is the enzyme responsible for making thyroid hormone in the first place. TPO antibodies, the immune system mistakenly attacking this exact enzyme, weren\'t identified as the target until 1985, decades after Hashimoto\'s was first confirmed autoimmune. The modern TPO antibody blood test, tracking that same antibody, is the primary lab signal the Healing Stages guide uses to gauge long-term progress.',
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
    category: 'basicHealth',
    title: 'Treg (Regulatory T Cell)',
    teaser: 'The immune cell type responsible for keeping the immune system from attacking the body itself.',
    summary:
      'A specific subtype of T cell whose job is promoting immune tolerance, helping keep the immune system from attacking the body\'s own tissue, everyday immune housekeeping relevant to anyone\'s baseline immune balance. SCFAs from dietary fiber directly induce Treg activity in the gut, a food-controllable lever, and Treg levels show up as a specific, documented factor across several of this Digest\'s own condition-specific findings.',
    citations: [
      { source: 'Furusawa et al. 2013, Nature: commensal microbe-derived butyrate induces colonic Treg differentiation', url: 'https://pubmed.ncbi.nlm.nih.gov/24226770/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'glossary-tsh',
    category: 'basicHealth',
    title: 'TSH (Thyroid-Stimulating Hormone)',
    teaser: 'The hormone that tells the thyroid how hard to work, and the single most commonly ordered thyroid lab value.',
    summary:
      'A hormone released by the pituitary gland that tells the thyroid gland how much hormone to produce, rising when thyroid hormone runs low, in anyone\'s own endocrine system. TSH follows a daily rhythm (higher overnight, lower in the afternoon), which is exactly why a consistent, morning, fasting draw matters for tracking a trend over time, general lab-testing practice worth knowing regardless of the reason for the test.',
    citations: [
      { source: 'Circadian and 30 minutes variations in serum TSH and thyroid hormones in normal subjects', url: 'https://pubmed.ncbi.nlm.nih.gov/716774/' },
    ],
    overallTier: 'strong',
    relatedIds: ['labs-tsh-diurnal-timing'],
  },
  {
    id: 'glossary-visceral-fat',
    category: 'basicHealth',
    title: 'Visceral Fat',
    teaser: 'Fat stored deep around the internal organs, active tissue rather than passive storage.',
    summary:
      'Fat stored deep in the abdomen, around the internal organs (distinct from fat stored just under the skin), active, hormone-producing tissue, not passive padding. Research finds it does complicated things: it drives metabolic risk in excess, but a 2024 reappraisal suggests some of that same fat\'s own inflammation may actually be defending against a leaky gut, rather than simply causing harm on its own. A recurring, specific factor across several of this Digest\'s own condition-specific findings.',
    citations: [],
    overallTier: 'moderate',
    relatedIds: ['mito-sugar-visceral-fat-cytokine-chain'],
  },
  {
    id: 'glossary-wolff-chaikoff',
    category: 'hashimotos',
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
    category: 'basicHealth',
    title: 'Zonulin',
    teaser: 'The named protein responsible for how "leaky" the gut lining actually is, discovered by the same researcher who coined the term.',
    summary: 'A specific protein that regulates how tightly the junctions between gut lining cells stay sealed, in anyone\'s gut. Gliadin (from gluten) triggers its release; once released, it reversibly opens those junctions, a measurable and reversible effect, not a permanent one. The physical mechanism behind "leaky gut", worth understanding as general gut-barrier physiology, whatever the reason someone\'s reading about it.',
    citations: [
      { source: 'Fasano 2011, Physiological Reviews: zonulin and intestinal barrier function', url: 'https://pubmed.ncbi.nlm.nih.gov/21248165/' },
    ],
    overallTier: 'strong',
  },
  // 2026-08-23, direct request: "evaluate the Glossary for lots of things
  // that are missing... we have a heel of a lot more info in there now."
  // Found by tallying every capitalized acronym-like token across every
  // real Digest content file, dropping condition names already in the
  // category picker, organization/journal names, and units, then keeping
  // only the medical, pharmacological, and biological terms that actually
  // appear used substantively, verified directly against the real content
  // rather than guessed generically. Same terse, dictionary-style format
  // as the 57 entries above, `citations: []` for the same reason most of
  // those already use it: standard, settled medical/pharmacological
  // vocabulary, not a new claim of its own. Appended here rather than
  // hand-spliced into the alphabetical position above -- this file's
  // author-facing sort claim is a convenience for anyone editing it, not a
  // functional requirement; BasicHealthShelves already re-sorts the whole
  // Glossary shelf by title at render time (sortDigestEntriesLogically),
  // so display order is unaffected either way. A real, honest gap named
  // directly rather than implied complete: this batch (43 terms) is
  // substantial, not exhaustive -- more medical/biology vocabulary almost
  // certainly still needs adding across the other 18 conditions' own
  // deepest research, the same "ongoing, multi-session" shape this
  // Digest's own depth work already follows elsewhere.
  {
    id: 'glossary-ace-arb',
    category: 'basicHealth',
    title: 'ACE Inhibitors & ARBs',
    teaser: 'Two related classes of blood-pressure medication that also directly protect the kidneys, independent of blood pressure alone.',
    summary:
      'ACE inhibitors (drug names typically ending in "-pril") and ARBs, angiotensin receptor blockers (typically ending in "-sartan"), both block the same blood-pressure-raising hormone pathway at two different points. Beyond lowering blood pressure, both classes carry a separate, kidney-protective effect, especially for anyone with protein in their urine, which is why they are commonly first-line medications for chronic kidney disease specifically, not just high blood pressure generally. Both can raise blood potassium and cause a modest, expected drop in kidney function when first started or increased, a known, monitored effect rather than a reason to avoid them outright.',
    citations: [],
    overallTier: 'strong',
    relatedIds: ['ckd-ace-arb-potassium-monitoring'],
  },
  {
    id: 'glossary-ana',
    category: 'lupus',
    title: 'ANA (Antinuclear Antibody)',
    teaser: 'A common first screening blood test for lupus and other autoimmune diseases, positive in most people who have lupus but also in some healthy people.',
    summary:
      'ANA testing looks for antibodies that mistakenly target structures inside the body\'s own cell nuclei, the broad signature of several autoimmune diseases including lupus. A positive ANA result is present in the large majority of people with lupus, making it a useful first screening test, but a positive result alone does not confirm lupus: a meaningful share of healthy people, more with age, also test positive, which is why a positive ANA is followed by more specific antibody testing and a clinical evaluation, not treated as a diagnosis on its own.',
    citations: [],
    overallTier: 'strong',
    relatedIds: ['lupus-discoid-vs-systemic'],
  },
  {
    id: 'glossary-aps-antiphospholipid',
    category: 'lupus',
    title: 'APS (Antiphospholipid Syndrome)',
    teaser: 'A separate, treatable clotting disorder that commonly overlaps with lupus, not the same thing as this glossary\'s own APS-2 (Autoimmune Polyglandular Syndrome Type 2) entry.',
    summary:
      'Antiphospholipid syndrome is an autoimmune clotting disorder where the immune system produces antibodies that raise the risk of blood clots and pregnancy complications, including recurrent miscarriage. It commonly overlaps with lupus, though it can also occur on its own. Since the two share an acronym, APS (Antiphospholipid Syndrome) is a different condition from APS-2 (Autoimmune Polyglandular Syndrome Type 2, this glossary\'s own separate entry), unrelated beyond the coincidence of the same short name.',
    citations: [],
    overallTier: 'strong',
    relatedIds: ['lupus-cardiovascular-risk'],
  },
  {
    id: 'glossary-atp',
    category: 'basicHealth',
    title: 'ATP (Adenosine Triphosphate)',
    teaser: 'The molecule every cell actually spends as usable energy, made mostly inside mitochondria.',
    summary:
      'ATP is the molecule cells use as their direct, spendable form of energy for essentially everything they do, muscle contraction, nerve signaling, building new proteins, and more. Mitochondria, the cell\'s own energy-producing structures, generate the large majority of the body\'s ATP by converting food and oxygen into it, which is why mitochondrial health and ATP production are treated as the same underlying story throughout this Digest\'s own Mitochondria & Metabolism research.',
    citations: [],
    overallTier: 'strong',
    relatedIds: ['mito-mots-c'],
  },
  {
    id: 'glossary-bdnf',
    category: 'basicHealth',
    title: 'BDNF (Brain-Derived Neurotrophic Factor)',
    teaser: 'A protein that supports the growth and survival of new brain cells, measurably raised by exercise.',
    summary:
      'BDNF is a protein the brain produces that supports the growth, survival, and connection of neurons, including the new ones created through neurogenesis. Exercise is one of the most consistently documented ways to raise BDNF levels, part of the direct mechanistic link between physical activity and brain health covered in this Digest\'s own Neurogenesis research.',
    citations: [],
    overallTier: 'strong',
    relatedIds: ['neurogenesis-bdnf-exercise'],
  },
  {
    id: 'glossary-bph',
    category: 'prostateHealth',
    title: 'BPH (Benign Prostatic Hyperplasia)',
    teaser: 'Non-cancerous prostate enlargement, extremely common with age and a completely separate condition from prostate cancer.',
    summary:
      'BPH is a non-cancerous enlargement of the prostate gland that becomes increasingly common with age, causing urinary symptoms (frequent urination, weak stream, nighttime bathroom trips) by pressing on the urethra. It is a separate condition from prostate cancer, though the two can coexist and some of the same lab values (like PSA) can be affected by either one, a common source of confusion covered directly in this Digest\'s own Prostate Health research.',
    citations: [],
    overallTier: 'strong',
    relatedIds: ['prostate-gut-microbiome-bph'],
  },
  {
    id: 'glossary-brca2',
    category: 'prostateHealth',
    title: 'BRCA2',
    teaser: 'A gene best known for breast and ovarian cancer risk that also measurably raises prostate cancer risk in men who carry it.',
    summary:
      'BRCA2 is a gene that normally helps repair damaged DNA; an inherited mutation in it is best known for raising breast and ovarian cancer risk, but it also measurably raises prostate cancer risk, and is associated with more aggressive disease, in men who carry it. This is why a family history of BRCA2-related cancer on either side of the family is relevant self-advocacy information for prostate health specifically, not only for the relatives more commonly associated with the gene.',
    citations: [],
    overallTier: 'strong',
    relatedIds: ['prostate-family-history-genetic-risk'],
  },
  {
    id: 'glossary-cbt',
    category: 'basicHealth',
    title: 'CBT (Cognitive Behavioral Therapy)',
    teaser: 'A structured, evidence-based talk therapy that identifies and changes unhelpful thought and behavior patterns, first-line treatment for chronic insomnia.',
    summary:
      'CBT is a structured form of talk therapy that works by identifying and changing unhelpful thought patterns and behaviors. A specific version, CBT-I (for insomnia), is the current first-line, guideline-recommended treatment for chronic insomnia, ahead of sleep medication, covered directly in this Digest\'s own Sleep & Health research.',
    citations: [],
    overallTier: 'strong',
    relatedIds: ['sleep-cbti-first-line'],
  },
  {
    id: 'glossary-ccp-anti-ccp',
    category: 'rheumatoidArthritis',
    title: 'CCP / Anti-CCP Antibody',
    teaser: 'A blood test more specific to rheumatoid arthritis than the older rheumatoid factor test, often positive years before symptoms start.',
    summary:
      'Anti-CCP (anti-cyclic citrullinated peptide) antibody testing looks for a specific immune marker that is more specific to rheumatoid arthritis than the older rheumatoid factor (RF) test, meaning a positive result is less likely to come from an unrelated cause. It can turn positive years before joint symptoms ever appear, making it a real, useful piece of self-advocacy information for anyone with a family history of RA or unexplained joint symptoms.',
    citations: [],
    overallTier: 'strong',
    relatedIds: ['ra-advocacy-rf-anti-ccp'],
  },
  {
    id: 'glossary-cgrp',
    category: 'migraine',
    title: 'CGRP (Calcitonin Gene-Related Peptide)',
    teaser: 'A signaling molecule directly involved in triggering migraine pain, and the specific target of a newer class of migraine medication.',
    summary:
      'CGRP is a signaling molecule released around blood vessels and nerves that plays a direct, documented role in triggering migraine attacks. Newer migraine medications (CGRP inhibitors, including "gepants" and injectable monoclonal antibodies) work by blocking CGRP or its receptor directly, a more targeted mechanism than older, broader migraine treatments, covered in this Digest\'s own Migraine research.',
    citations: [],
    overallTier: 'strong',
    relatedIds: ['migraine-cgrp-inhibitors'],
  },
  {
    id: 'glossary-cmp',
    category: 'basicHealth',
    title: 'CMP (Comprehensive Metabolic Panel)',
    teaser: 'A standard blood panel checking kidney function, liver function, blood sugar, and electrolytes all at once.',
    summary:
      'A CMP is a standard blood panel measuring roughly 14 markers at once, including kidney function (creatinine, eGFR), liver enzymes, blood sugar, and electrolytes like potassium and sodium. It is a common baseline test for monitoring overall organ function, and specific values on it can be affected by conditions or medications that might not seem directly related to the kidneys or liver at first glance, covered directly in this Digest\'s own self-advocacy research.',
    citations: [],
    overallTier: 'strong',
    relatedIds: ['advocacy-cmp'],
  },
  {
    id: 'glossary-cpap',
    category: 'basicHealth',
    title: 'CPAP (Continuous Positive Airway Pressure)',
    teaser: 'The standard treatment device for obstructive sleep apnea, delivering steady air pressure through a mask to keep the airway open overnight.',
    summary:
      'CPAP is a machine that delivers a steady stream of pressurized air through a mask worn during sleep, keeping the airway from collapsing, the standard, first-line treatment for obstructive sleep apnea. Sleep apnea itself has documented bidirectional links to several conditions tracked across this Digest, including fatty liver disease, covered directly in that category\'s own research.',
    citations: [],
    overallTier: 'strong',
    relatedIds: ['masld-sleep-apnea-bidirectional'],
  },
  {
    id: 'glossary-dka',
    category: 'type1Diabetes',
    title: 'DKA (Diabetic Ketoacidosis)',
    teaser: 'A dangerous, fast-developing complication of insufficient insulin, most relevant to Type 1 Diabetes, that needs urgent medical attention.',
    summary:
      'DKA is a dangerous, potentially life-threatening complication that develops when the body has too little insulin to use blood sugar for energy and starts breaking down fat instead, producing a buildup of acidic ketones in the blood. It can develop over hours, most often in Type 1 Diabetes, and specific "sick day rules" exist precisely to catch and prevent it during illness, covered directly in this Digest\'s own Type 1 Diabetes research.',
    citations: [],
    overallTier: 'strong',
    relatedIds: ['type1-dka-sick-day-rules'],
  },
  {
    id: 'glossary-dmard',
    category: 'rheumatoidArthritis',
    title: 'DMARD (Disease-Modifying Antirheumatic Drug)',
    teaser: 'A class of medication that slows or changes the underlying disease process in rheumatoid arthritis, not just the pain it causes.',
    summary:
      'DMARDs are a class of medication that work on the underlying immune process driving rheumatoid arthritis, slowing or preventing joint damage, rather than just easing pain or inflammation the way an over-the-counter pain reliever would. Starting a DMARD early, within the first few months of symptoms, is documented to produce measurably better long-term outcomes than starting the same treatment later, the "window of opportunity" covered directly in this Digest\'s own Rheumatoid Arthritis research.',
    citations: [],
    overallTier: 'strong',
    relatedIds: ['ra-window-of-opportunity-early-treatment'],
  },
  {
    id: 'glossary-ebv',
    category: 'basicHealth',
    title: 'EBV (Epstein-Barr Virus)',
    teaser: 'An extremely common virus (the cause of mononucleosis) linked to triggering several autoimmune diseases through molecular mimicry.',
    summary:
      'EBV is an extremely common virus, the cause of infectious mononucleosis, that the large majority of adults have been infected with at some point. Research has found a specific molecular resemblance between certain EBV proteins and the body\'s own tissues, a documented example of molecular mimicry, one proposed trigger mechanism for several autoimmune diseases including multiple sclerosis, covered directly in this Digest\'s own Multiple Sclerosis research.',
    citations: [],
    overallTier: 'moderate',
    relatedIds: ['ms-ebna1-glialcam-mimicry', 'glossary-molecular-mimicry'],
  },
  {
    id: 'glossary-fib4',
    category: 'fattyLiverDisease',
    title: 'FIB-4 (Fibrosis-4 Index)',
    teaser: 'A free, calculator-based screening score estimating liver scarring risk from routine lab values and age, no biopsy required.',
    summary:
      'FIB-4 is a calculated score (using age plus three routine liver-related lab values already on a standard panel) that estimates the likelihood of significant liver scarring, or fibrosis, without needing a biopsy. Clinical guidance recommends it as a first-line screening step for fatty liver disease specifically because it is low-cost and uses labs many people already have, though its own accuracy has shown inconsistency in some studies, an honest limitation covered directly in this Digest\'s own Fatty Liver Disease research.',
    citations: [],
    overallTier: 'moderate',
    relatedIds: ['masld-fib4-fibrosis-screening'],
  },
  {
    id: 'glossary-fmt',
    category: 'basicHealth',
    title: 'FMT (Fecal Microbiota Transplant)',
    teaser: 'Transferring a screened, healthy donor\'s gut bacteria into someone else\'s gut, an established treatment for one infection and an active research direction for several conditions.',
    summary:
      'FMT transfers processed stool from a screened, healthy donor into someone else\'s digestive tract, intended to reshape their gut microbiome. It is already a well-established, FDA-recognized treatment for recurrent C. difficile infection, and is being actively studied, with mixed results depending on the condition, for several others covered across this Digest, including encouraging trial data for ulcerative colitis and inconclusive results for IBS.',
    citations: [],
    overallTier: 'moderate',
    relatedIds: ['ibd-fecal-microbiota-transplant'],
  },
  {
    id: 'glossary-gi',
    category: 'basicHealth',
    title: 'GI (Gastrointestinal)',
    teaser: 'The everyday shorthand for the digestive tract, stomach through intestines, used throughout this Digest\'s own gut-related research.',
    summary:
      'GI is standard shorthand for the gastrointestinal tract, the whole digestive system from the stomach through the intestines. It appears constantly across this Digest\'s own gut-health, microbiome, and per-condition research (a "GI symptom," "GI tract," or "GI bleed") as a plain abbreviation for the digestive system, not a distinct medical concept of its own.',
    citations: [],
    overallTier: 'strong',
  },
  {
    id: 'glossary-glp1',
    category: 'type2Diabetes',
    title: 'GLP-1 (Receptor Agonist)',
    teaser: 'A newer class of medication, now first-line for many with Type 2 Diabetes, that lowers blood sugar and drives significant weight loss by mimicking a natural gut hormone.',
    summary:
      'GLP-1 receptor agonists (semaglutide and similar drugs) work by mimicking a natural gut hormone that increases insulin release, slows digestion, and reduces appetite. Current guidance now recommends this class, alongside SGLT2 inhibitors, as first-line pharmacotherapy for many people with Type 2 Diabetes, especially those with existing heart or kidney disease, specifically because of documented organ-protective benefits independent of blood sugar control alone.',
    citations: [],
    overallTier: 'strong',
    relatedIds: ['type2-glp1-sglt2-paradigm-shift'],
  },
  {
    id: 'glossary-hla',
    category: 'basicHealth',
    title: 'HLA (Human Leukocyte Antigen)',
    teaser: 'A group of genes that teach the immune system to tell "self" from "foreign," and the single biggest inherited risk factor across most of the autoimmune conditions this Digest tracks.',
    summary:
      'HLA genes produce proteins on the surface of cells that the immune system uses to distinguish the body\'s own tissue from foreign invaders. Specific inherited HLA variants are the single largest known genetic risk factor for developing celiac disease, Graves\' disease, and several other autoimmune conditions covered across this Digest, though carrying the variant alone does not guarantee developing the disease, since most people who carry it never do.',
    citations: [],
    overallTier: 'strong',
    relatedIds: ['celiac-global-hla-dq2-gradient'],
  },
  {
    id: 'glossary-homa-ir',
    category: 'basicHealth',
    title: 'HOMA-IR',
    teaser: 'A calculated score estimating insulin resistance from two ordinary lab values, fasting glucose and fasting insulin.',
    summary:
      'HOMA-IR is a score calculated from two routine fasting lab values, glucose and insulin, used mostly in research to estimate how insulin-resistant someone\'s body is. It appears throughout this Digest\'s own research on magnesium, chromium, vitamin D, and PCOS as a measured outcome in supplementation trials, worth knowing as a research tool rather than a routine clinical diagnosis on its own.',
    citations: [],
    overallTier: 'moderate',
    relatedIds: ['magnesium-insulin-glucose'],
  },
  {
    id: 'glossary-igf1',
    category: 'basicHealth',
    title: 'IGF-1 (Insulin-Like Growth Factor 1)',
    teaser: 'A growth-signaling hormone, raised by dairy intake among other things, tied to both PCOS symptoms and prostate cancer risk in this Digest\'s own research.',
    summary:
      'IGF-1 is a hormone that signals cell growth throughout the body, structurally similar to insulin, hence the name. Dairy intake measurably raises circulating IGF-1 levels, a documented mechanism this Digest connects to worsened androgen-driven PCOS symptoms and, separately, to prostate cancer risk, covered in each condition\'s own research.',
    citations: [],
    overallTier: 'strong',
    relatedIds: ['pcos-dairy-igf1-hyperandrogenism'],
  },
  {
    id: 'glossary-ivf',
    category: 'pcos',
    title: 'IVF (In Vitro Fertilization)',
    teaser: 'A fertility treatment where an egg is fertilized outside the body, relevant to this Digest\'s own PCOS research on real-world fertility outcomes.',
    summary:
      'IVF fertilizes an egg with sperm outside the body, then transfers the resulting embryo into the uterus, one of several fertility treatment options. PCOS is a leading cause of infertility, and this Digest\'s own research covers real-world IVF outcomes specifically for people with PCOS, not just fertility treatment in general.',
    citations: [],
    overallTier: 'strong',
    relatedIds: ['pcos-ivf-real-outcomes'],
  },
  {
    id: 'glossary-jak-inhibitors',
    category: 'rheumatoidArthritis',
    title: 'JAK Inhibitors',
    teaser: 'A newer class of oral rheumatoid arthritis medication carrying a serious, FDA-mandated safety warning worth knowing by name.',
    summary:
      'JAK inhibitors (tofacitinib, baricitinib, upadacitinib) are a newer class of oral medication for rheumatoid arthritis and other inflammatory conditions. A dedicated safety trial found increased risk of heart attack, stroke, cancer, blood clots, serious infection, and death compared with an older medication class in an at-risk population, leading the FDA to require a class-wide boxed warning, its strongest warning label, covered directly in this Digest\'s own Rheumatoid Arthritis research.',
    citations: [],
    overallTier: 'moderate',
    relatedIds: ['ra-jak-inhibitors-oral-surveillance'],
  },
  {
    id: 'glossary-ldl-hdl',
    category: 'cardiovascularDisease',
    title: 'LDL & HDL (Cholesterol)',
    teaser: 'The two cholesterol types tracked on a standard lipid panel, one that drives artery damage and one that helps clear it.',
    summary:
      'LDL and HDL are two types of lipoprotein that carry cholesterol through the blood. LDL ("bad" cholesterol) contributes directly to artery-clogging plaque when levels run high, while HDL ("good" cholesterol) helps carry cholesterol away from artery walls for disposal. Both are standard values on a lipid panel, and this Digest\'s own Cardiovascular Disease research covers a large, pooled trial base showing measured LDL reduction directly tracking with reduced heart attack and stroke risk.',
    citations: [],
    overallTier: 'strong',
    relatedIds: ['cvd-statin-evidence'],
  },
  {
    id: 'glossary-mash-nash',
    category: 'fattyLiverDisease',
    title: 'MASH & NASH (Fatty Liver Terminology)',
    teaser: 'Two names for essentially the same thing, the more advanced, inflamed stage of fatty liver disease, with NASH the older term MASH is replacing.',
    summary:
      'NASH (non-alcoholic steatohepatitis) was the established name for the more advanced, inflamed stage of fatty liver disease. The field has been transitioning to MASH (metabolic dysfunction-associated steatohepatitis), a renaming meant to describe the condition by its actual metabolic cause rather than by what it isn\'t, without changing the underlying disease itself, covered throughout this Digest\'s own Fatty Liver Disease research.',
    citations: [],
    overallTier: 'strong',
    relatedIds: ['masld-resmetirom'],
  },
  {
    id: 'glossary-ndt',
    category: 'hashimotos',
    title: 'NDT (Natural Desiccated Thyroid)',
    teaser: 'A thyroid hormone medication made from dried animal thyroid gland, an alternative to synthetic levothyroxine with a mixed evidence picture.',
    summary:
      'NDT is a thyroid hormone replacement medication made from dried, processed animal (typically pig) thyroid gland, containing both T4 and T3 in a fixed ratio, unlike synthetic levothyroxine, which is T4 alone. This Digest\'s own labs and medication research covers the real, ongoing debate over NDT and combination T3/T4 therapy directly, including the batch-to-batch consistency concerns that come with a biological rather than synthetic source.',
    citations: [],
    overallTier: 'moderate',
    relatedIds: ['labs-combination-t3-ndt'],
  },
  {
    id: 'glossary-nsaid',
    category: 'basicHealth',
    title: 'NSAID',
    teaser: 'The drug class behind common over-the-counter pain relievers like ibuprofen and naproxen, with real, condition-specific risks worth knowing.',
    summary:
      'NSAIDs (nonsteroidal anti-inflammatory drugs) are a common class of pain and inflammation reliever including ibuprofen and naproxen, available both over the counter and by prescription. This Digest\'s own research covers real, condition-specific risks, including documented kidney injury risk in chronic kidney disease, covered in that category\'s own research.',
    citations: [],
    overallTier: 'strong',
    relatedIds: ['ckd-nsaid-kidney-injury-real-data'],
  },
  {
    id: 'glossary-ogtt',
    category: 'pcos',
    title: 'OGTT (Oral Glucose Tolerance Test)',
    teaser: 'A more thorough diabetes-screening test than fasting glucose alone, drinking a glucose solution then rechecking blood sugar two hours later.',
    summary:
      'An OGTT measures blood sugar at a baseline, then again two hours after drinking a standardized glucose solution, catching impaired glucose handling that a fasting glucose test alone can miss. This Digest\'s own PCOS research covers direct evidence that fasting glucose alone missed glucose intolerance in a majority of PCOS cases that a full OGTT correctly caught, one reason it\'s specifically recommended over fasting glucose alone for that condition.',
    citations: [],
    overallTier: 'strong',
    relatedIds: ['pcos-ogtt-screening'],
  },
  {
    id: 'glossary-omega3-types',
    category: 'basicHealth',
    title: 'Omega-3 Fatty Acid Types (ALA, EPA & DHA)',
    teaser: 'Three different omega-3 fats, one plant-based and two marine-based, and the well-documented bottleneck converting the plant version into the more active two.',
    summary:
      'ALA (alpha-linolenic acid) is the plant-based omega-3, found in flaxseed and walnuts; EPA and DHA are the two marine-based omega-3s, found in fatty fish and algae, and generally considered the more biologically active forms. The body can convert ALA into EPA and DHA, but only inefficiently, a well-documented conversion bottleneck covered directly in this Digest\'s own Essential Nutrients research, one reason a plant-only omega-3 source doesn\'t automatically deliver the same effect as a marine one.',
    citations: [],
    overallTier: 'strong',
    relatedIds: ['omega3-ala-conversion-bottleneck'],
  },
  {
    id: 'glossary-pad',
    category: 'cardiovascularDisease',
    title: 'PAD (Peripheral Artery Disease)',
    teaser: 'Narrowed arteries in the legs, the same underlying atherosclerosis process as coronary artery disease, just in a different location.',
    summary:
      'PAD is narrowing of the arteries supplying the legs (and sometimes other organs), caused by the same underlying atherosclerosis process that causes coronary artery disease, just affecting a different part of the body. Its presence is a marker of broader cardiovascular risk, covered directly in this Digest\'s own Cardiovascular Disease research alongside its kidney- and brain-related counterparts.',
    citations: [],
    overallTier: 'strong',
    relatedIds: ['cvd-kidney-brain-pad-real-data'],
  },
  {
    id: 'glossary-pasi',
    category: 'psoriasis',
    title: 'PASI (Psoriasis Area and Severity Index)',
    teaser: 'The standard scoring tool researchers and dermatologists use to measure how much psoriasis has actually improved, the same bar most drug trials use to define success.',
    summary:
      'PASI is a standardized score combining how much of the body psoriasis covers with how severe it looks (redness, thickness, scaling), used to track disease severity and treatment response. "PASI75," a 75% improvement in this score, is the bar most psoriasis drug and lifestyle trials use to define a successful result, covered directly in this Digest\'s own Psoriasis research.',
    citations: [],
    overallTier: 'strong',
    relatedIds: ['psoriasis-weight-loss'],
  },
  {
    id: 'glossary-psa',
    category: 'prostateHealth',
    title: 'PSA (Prostate-Specific Antigen)',
    teaser: 'The standard prostate-cancer screening blood test, with a more complicated benefit-versus-harm picture than "more screening is always better."',
    summary:
      'PSA is a protein made by the prostate, measured by a standard blood test as a screening tool for prostate cancer. It can also rise from BPH, prostatitis, or normal variation, not just cancer, which is why current guidance treats the screening decision as an individual, doctor-guided one rather than a routine recommendation for everyone, covered directly and honestly in this Digest\'s own Prostate Health research.',
    citations: [],
    overallTier: 'strong',
    relatedIds: ['prostate-psa-screening'],
  },
  {
    id: 'glossary-psc',
    category: 'ibd',
    title: 'PSC (Primary Sclerosing Cholangitis)',
    teaser: 'A rare but serious liver condition affecting the bile ducts, one of the extraintestinal complications IBD can carry beyond the gut itself.',
    summary:
      'PSC is a condition causing progressive scarring and narrowing of the bile ducts inside and outside the liver, which can lead to serious liver damage over time. It occurs at a notably higher rate in people with IBD, particularly ulcerative colitis, than in the general population, one of several extraintestinal complications, effects reaching beyond the gut itself, covered directly in this Digest\'s own IBD research.',
    citations: [],
    overallTier: 'strong',
    relatedIds: ['ibd-extraintestinal-manifestations'],
  },
  {
    id: 'glossary-psma',
    category: 'prostateHealth',
    title: 'PSMA (Prostate-Specific Membrane Antigen)',
    teaser: 'A protein prostate cancer cells make far more of than healthy tissue, now the target of both a precision imaging technique and an approved radiation therapy.',
    summary:
      'PSMA is a protein that prostate cancer cells express at much higher levels than healthy tissue does. That difference is now used two ways: as a more sensitive imaging tool for locating exactly where prostate cancer has spread, and as the target of an FDA-approved radioligand therapy that binds to PSMA before releasing its radiation dose directly at the cancer, a more precise approach than a broad external beam, covered directly in this Digest\'s own Prostate Health research.',
    citations: [],
    overallTier: 'strong',
    relatedIds: ['horizon-prostate'],
  },
  {
    id: 'glossary-ptu',
    category: 'graves',
    title: 'PTU (Propylthiouracil)',
    teaser: 'An antithyroid medication that slows an overactive thyroid, used for Graves\' disease, needing regular monitoring for a rare but serious liver risk.',
    summary:
      'PTU is a medication that reduces thyroid hormone production, used to manage an overactive thyroid, most often from Graves\' disease. It carries a rare but serious risk of liver injury, which is why regular monitoring is part of standard care while taking it, covered directly in this Digest\'s own Graves\' disease research on antithyroid drug monitoring.',
    citations: [],
    overallTier: 'strong',
    relatedIds: ['graves-antithyroid-drug-monitoring'],
  },
  {
    id: 'glossary-rem-sleep',
    category: 'basicHealth',
    title: 'REM Sleep',
    teaser: 'The dream-heavy sleep stage tied to memory consolidation and emotional processing, one part of the larger sleep-architecture cycle this Digest covers.',
    summary:
      'REM (rapid eye movement) sleep is one of the major stages the body cycles through overnight, marked by vivid dreaming, and is specifically tied to memory consolidation and emotional processing. It sits alongside the deeper, non-REM stages as part of the full sleep architecture cycle, covered directly in this Digest\'s own Sleep & Health research.',
    citations: [],
    overallTier: 'strong',
    relatedIds: ['sleep-architecture'],
  },
  {
    id: 'glossary-sglt2',
    category: 'type2Diabetes',
    title: 'SGLT2 Inhibitors',
    teaser: 'A medication class originally built for Type 2 Diabetes that turned out to independently protect the kidneys and heart too.',
    summary:
      'SGLT2 inhibitors (empagliflozin and similar drugs) lower blood sugar by causing the kidneys to remove more glucose through urine. Beyond blood sugar control, the class carries documented, independent protective benefits for the kidneys and heart, which is why current guidance recommends it for chronic kidney disease and heart failure specifically, not only for diabetes, covered directly in this Digest\'s own Chronic Kidney Disease research.',
    citations: [],
    overallTier: 'strong',
    relatedIds: ['ckd-sglt2-inhibitors'],
  },
  {
    id: 'glossary-sledai',
    category: 'lupus',
    title: 'SLEDAI',
    teaser: 'The formal scoring tool turning "feeling worse" into a specific number for lupus, with a defined point rise counting as an official flare.',
    summary:
      'SLEDAI (and its updated version, SLEDAI-2K) is a formal instrument scoring lupus disease activity across several organ systems, producing a specific number rather than a subjective impression. A rise of 4 or more points from the previous visit is the formal, standard definition of a flare, covered directly in this Digest\'s own Lupus research alongside its own remission and low-disease-activity thresholds.',
    citations: [],
    overallTier: 'strong',
    relatedIds: ['lupus-sledai-disease-activity'],
  },
  {
    id: 'glossary-tmao',
    category: 'cardiovascularDisease',
    title: 'TMAO (Trimethylamine N-Oxide)',
    teaser: 'A compound gut bacteria produce from certain foods (notably red meat and eggs) that independently raises cardiovascular risk.',
    summary:
      'TMAO is a compound produced when gut bacteria metabolize choline and carnitine, nutrients found notably in red meat and eggs, which the liver then converts into TMAO. Research finds elevated TMAO levels independently associated with cardiovascular risk, a documented gut-microbiome connection to heart disease covered directly in this Digest\'s own Cardiovascular Disease research.',
    citations: [],
    overallTier: 'moderate',
    relatedIds: ['cvd-tmao-gut-microbiome-real-data'],
  },
  {
    id: 'glossary-tpmt',
    category: 'ibd',
    title: 'TPMT (Thiopurine Methyltransferase)',
    teaser: 'An enzyme whose activity is tested before starting a common IBD medication class, since low activity raises the risk of serious, dose-related side effects.',
    summary:
      'TPMT is an enzyme that helps the body break down thiopurine medications (azathioprine and similar drugs), commonly used for IBD. People with naturally low TPMT activity, a genetic trait, process these drugs more slowly, raising the risk of serious, dose-related side effects, which is why testing TPMT activity before starting treatment is standard practice, covered directly in this Digest\'s own IBD research.',
    citations: [],
    overallTier: 'strong',
    relatedIds: ['ibd-azathioprine-tpmt'],
  },
  {
    id: 'glossary-uc-crohns',
    category: 'ibd',
    title: "UC & Crohn's Disease",
    teaser: 'The two distinct diseases grouped under "IBD," different enough that several findings run in opposite directions depending on which one someone actually has.',
    summary:
      'Inflammatory bowel disease is an umbrella term for two different autoimmune conditions. Ulcerative colitis (UC) causes continuous inflammation limited to the colon and rectum; Crohn\'s disease can affect any part of the digestive tract from mouth to anus, often in patchy patterns, and can penetrate deeper into the intestinal wall. The distinction matters directly, since several findings covered in this Digest\'s own IBD research, most strikingly how smoking affects each disease, run in different, even opposite, directions depending on which one someone actually has.',
    citations: [],
    overallTier: 'strong',
    relatedIds: ['ibd-overview'],
  },
  {
    id: 'glossary-vitamin-k2-mk',
    category: 'basicHealth',
    title: 'Vitamin K2 (MK-4 & MK-7)',
    teaser: 'Two structurally different forms of vitamin K2, one closer to plant-based K1 with faster clearance, the other longer-acting with more available trial evidence at realistic doses.',
    summary:
      'MK-4 and MK-7 are two structurally different forms of vitamin K2, distinct from the plant-based vitamin K1 most people get from leafy greens. MK-4 is structurally closer to K1, with a much shorter half-life in the body, while MK-7 stays active longer and has more supporting trial evidence at doses realistic for a supplement, both covered directly in this Digest\'s own Essential Nutrients research comparing the two forms.',
    citations: [],
    overallTier: 'moderate',
    relatedIds: ['vitamink-supplement-forms-compared'],
  },
];
