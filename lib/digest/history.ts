import type { DigestEntry } from './types';

// History & Milestones -- added 2026-08-07, direct response to "a history
// and milestones of Hashimoto's would be good to have as well." A
// genuinely different shape from every other category here: not "what
// should I eat," but "how did we get to knowing any of this at all" --
// real, dated, citable turning points from the disease's first description
// through to how it's diagnosed and understood today. Evidence tiers still
// apply (a historical fact is either well-documented or it isn't), but
// they're doing different work here than elsewhere in this Digest: tiering
// how solidly each historical claim itself is sourced, not how strong a
// clinical trial's effect size was.
export const HISTORY_ENTRIES: DigestEntry[] = [
  {
    id: 'history-1912-first-description',
    category: 'history',
    title: '1912: The Original Discovery, By a Japanese Surgeon Studying Four Patients',
    teaser: 'The disease is named after a real person who described it from just four thyroid specimens.',
    summary:
      'Hakaru Hashimoto, a Japanese surgeon, examined thyroid tissue removed from four middle-aged women during surgery and identified a genuinely new pattern nobody had described before: diffuse infiltration of lymphoid cells forming real lymphoid follicles with germinal centers, alongside fibrosis and tissue atrophy. He published these findings in 1912 in a German surgical journal (German being the era\'s dominant language for medical publishing) under the Latin name struma lymphomatosa. His own work sat largely unrecognized for decades -- the condition wasn\'t renamed in his honor until decades later, once the broader medical community recognized what he\'d actually found: not a rare curiosity, but the first clearly described case of a disease that would turn out to affect millions.',
    citations: [
      {
        source: 'Historical Tidbit: Hakaru Hashimoto, M.D. and Hashimoto\'s Disease (Pediatric Endocrine Society)',
        url: 'https://pedsendo.org/historical-tidbits/historical-tidbit-hakaru-hashimoto-m-d-may-4-1881-to-january-9-1934-and-hashimotos-disease/',
      },
    ],
    overallTier: 'strong',
  },
  {
    id: 'history-1924-iodized-salt',
    category: 'history',
    title: '1924: The "Goiter Belt," and a Voluntary Public-Health Experiment That Worked',
    teaser: 'A real region of the US once had close to 100% goiter rates in schoolchildren -- fixed voluntarily, with no law requiring it.',
    summary:
      'In the early 1920s, a swath of the US around the Great Lakes -- including Michigan, Minnesota, and Wisconsin -- was known as the "goiter belt": real public-health surveys found goiter (visibly enlarged thyroid, driven by iodine deficiency) in 70-100% of schoolchildren in parts of the region. Physician David Cowie, having studied European iodization practices, proposed adding iodine to table salt; on May 1, 1924, Michigan salt manufacturers voluntarily began doing exactly that, with no law requiring it. A 1935 follow-up survey found enlarged-thyroid rates had dropped by as much as 90% in the years since. This is real, direct historical proof that a food-based intervention could measurably prevent a real thyroid disease at population scale -- distinct from, but foundational to, the very different iodine-excess concerns Hashimoto\'s research raises today.',
    citations: [
      { source: 'A Grain of Salt (Milbank Quarterly, 2014) -- the history of American salt iodization', url: 'https://www.milbank.org/quarterly/articles/a-grain-of-salt/' },
    ],
    overallTier: 'strong',
    relatedIds: ['nutrient-iodine', 'problem-excess-iodine-kelp'],
  },
  {
    id: 'history-1956-autoimmune-mechanism',
    category: 'history',
    title: '1956: Proof This Was an Autoimmune Disease At All -- a Real Turning Point for All of Medicine',
    teaser: 'Before this year, the whole idea that the body could attack itself was considered close to impossible.',
    summary:
      'For decades, immunology held to the concept of "horror autotoxicus" -- the idea that a healthy immune system simply could not, and would not, attack the body\'s own tissue. In 1956, researchers Ivan Roitt and Deborah Doniach identified real antibodies against thyroglobulin (a thyroid protein) circulating in the blood of Hashimoto\'s patients -- direct, measurable evidence the immune system itself was attacking the thyroid. This wasn\'t just a discovery about one disease: it was one of the first pieces of real evidence that human autoimmune disease existed at all, opening the door to understanding dozens of other conditions (including several covered elsewhere in this Digest\'s own Other Autoimmune Diseases category) the same way.',
    citations: [
      { source: 'Autoimmune thyroid disease -- a review discussing the 1956 discovery and its significance', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7266799/' },
    ],
    overallTier: 'strong',
    relatedIds: ['other-why-cross-disease-evidence'],
  },
  {
    id: 'history-1960s-tsh-testing',
    category: 'history',
    title: 'The 1960s Onward: How Thyroid Testing Actually Became Possible',
    teaser: 'Before this, there was no real blood test that could reliably tell you your own thyroid status.',
    summary:
      'The first TSH radioimmunoassay (a technique using radioactive tracers to measure a hormone\'s concentration) originated in 1965, and for about two decades that was the single most important tool available for diagnosing and managing hypothyroidism -- but this first generation could only reliably detect TSH at fairly high concentrations, missing the more subtle elevations seen in real early or subclinical disease. The real leap came with monoclonal antibody technology in the mid-1970s, enabling a "sandwich" assay design by the late 1980s that was dramatically more sensitive and specific -- the direct ancestor of the ordinary TSH blood test used today, and the reason a diagnosis of subclinical hypothyroidism (elevated TSH with still-normal T4) is even possible to make at all.',
    citations: [
      { source: 'Laboratory Thyroid Tests: A Historical Perspective (Thyroid)', url: 'https://pubmed.ncbi.nlm.nih.gov/37037032/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'history-1985-tpo-identified',
    category: 'history',
    title: '1985: The Antibody This App Actually Tracks Gets Identified',
    teaser: 'The "TPO antibody" this whole app treats as central data wasn\'t even known by that name until 1985.',
    summary:
      'For years after the 1956 autoimmune-mechanism discovery, researchers knew Hashimoto\'s patients carried real antibodies against something in the thyroid\'s own "microsomal" cell fraction -- but didn\'t know exactly what that target actually was. In 1985, researchers demonstrated that this "microsomal antigen" was in fact thyroid peroxidase (TPO), the very enzyme responsible for making thyroid hormone in the first place -- meaning the immune system was attacking the thyroid\'s own hormone-production machinery directly, not some incidental bystander protein. This is the direct scientific origin of the modern TPO antibody blood test -- the same lab value this app\'s own Healing Stages research uses as its real, primary tracking signal.',
    citations: [
      {
        source: 'Anti-thyroid peroxidase antibody in patients with autoimmune thyroid disease: possible identity with anti-microsomal antibody',
        url: 'https://pubmed.ncbi.nlm.nih.gov/2995429/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['healing-stage3-what-it-looks-like'],
  },
  {
    id: 'history-desiccated-to-levothyroxine',
    category: 'history',
    title: 'From Ground-Up Pig Thyroid to a Precisely-Dosed Pill: How Treatment Itself Evolved',
    teaser: 'As recently as 1965, 4 out of 5 US thyroid-hormone prescriptions were still literally dried animal thyroid gland.',
    summary:
      'Real thyroid organ therapy dates back to 1891, using desiccated (dried, ground) thyroid extract from pig or cow glands -- and this remained the dominant treatment for over 70 years, with roughly 80% of US thyroid prescriptions still being natural desiccated thyroid as late as 1965. The real problem driving the shift to synthetic levothyroxine: batch-to-batch potency in natural extract genuinely varied enormously, with some real batches measured at anywhere from double to zero detectable hormone activity -- a serious, documented dosing-consistency problem. Levothyroxine\'s synthetic, precisely-measurable dosing and simpler once-daily use made it the standard of care by the 1970s, and it remains the single most-prescribed medication in the US today -- though natural desiccated thyroid is still prescribed for a real minority of patients who report better symptom control on it despite normalized lab values.',
    citations: [
      { source: 'Natural desiccated thyroid for the treatment of hypothyroidism? (Frontiers in Endocrinology)', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10801060/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'history-genetic-era',
    category: 'history',
    title: 'The Genetic Era: Real Susceptibility Genes, Real Limits to What They Explain',
    teaser: 'The first real genome-wide search for Hashimoto\'s-specific genes only happened in 2018.',
    summary:
      'Long before genome-wide studies were possible, researchers already suspected Hashimoto\'s ran in families and linked it to specific immune-regulation genes, particularly CTLA-4 (a gene that normally helps put the brakes on immune-cell activation). The first real genome-wide association study (GWAS) dedicated specifically to Hashimoto\'s thyroiditis wasn\'t published until 2018, identifying real new candidate genetic regions beyond what candidate-gene studies alone had found. A real, honest limitation worth naming: even combining every genetic association discovered so far, known genetic variants explain only a modest share of who actually develops Hashimoto\'s -- real, continuing evidence that environmental and dietary factors (this app\'s own core focus) matter alongside genetic susceptibility, not instead of it.',
    citations: [
      { source: 'Genome-wide association analysis suggests novel loci for Hashimoto\'s thyroiditis', url: 'https://pubmed.ncbi.nlm.nih.gov/30284222/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'history-desiccated-thyroid-standardization',
    category: 'history',
    title: 'A Real Milestone Often Left Out: When Desiccated Thyroid Finally Got Properly Standardized',
    teaser: 'The real potency-inconsistency problem that helped push doctors toward synthetic thyroxine had a real fix -- just a late one.',
    summary:
      'The same real potency-variability problem that helped drive levothyroxine\'s rise actually had a genuine partial fix: after 1985, natural desiccated thyroid manufacturing standardization measurably improved -- but by that point, levothyroxine\'s own real practical advantages (once-daily dosing, precise, easily-adjustable milligram-level dosing, and a growing base of real clinical-trial evidence) had already made it the entrenched standard of care. Worth knowing as real historical context rather than a settled verdict either way: today\'s desiccated-thyroid products are genuinely more consistent than their pre-1985 predecessors, even though that improvement came after the field had largely already moved on.',
    citations: [
      { source: 'Natural desiccated thyroid for the treatment of hypothyroidism? (same source as the broader treatment-history entry, standardization detail)', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10801060/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['history-desiccated-to-levothyroxine'],
  },
];
