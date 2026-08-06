import type { DigestEntry } from './types';

// Nutrients & Micronutrients -- 7 entries. Selenium and myo-inositol are
// deliberately split into two entries (not combined) so the real, useful
// finding that the COMBINATION outperforms selenium alone is legible on
// its own, not buried inside selenium's own entry.
export const NUTRIENTS_ENTRIES: DigestEntry[] = [
  {
    id: 'nutrient-selenium',
    category: 'nutrients',
    title: 'Selenium',
    teaser: 'The single strongest-evidenced supplement in this app\'s entire research base -- with one real, honest caveat.',
    summary:
      'A systematic meta-analysis of 21 randomized controlled trials found selenium supplementation measurably reduces TPO antibody levels over 3-6 months -- the strongest trial-level evidence behind any Hashimoto\'s-specific supplement claim this app has researched. Worth knowing, though: a separate Cochrane Library review of the same general evidence base (4 studies, 463 participants) rated it unclear-to-high risk of bias and concluded the evidence was "incomplete and not reliable to help inform clinical decision making" -- a real, more cautious read using Cochrane\'s own stricter bias-risk methodology, not a contradiction, but a reason to hold this tier a notch more provisionally than the meta-analysis alone would suggest.',
    citations: [
      {
        source: 'Selenium supplementation in patients with Hashimoto thyroiditis: a systematic review and meta-analysis of 21 studies (1,610 subjects)',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10194801/',
      },
      {
        source: 'Selenium Supplementation for Hashimoto\'s Thyroiditis: Summary of a Cochrane Systematic Review (European Thyroid Journal, 2014)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/24847462/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['nutrient-myo-inositol'],
  },
  {
    id: 'nutrient-myo-inositol',
    category: 'nutrients',
    title: 'Myo-Inositol (Combined with Selenium)',
    teaser: 'A real, updated finding: pairing selenium with this one specific compound outperforms selenium alone.',
    summary:
      'A 2024 updated meta-analysis found that myo-inositol combined with selenium outperforms selenium supplementation by itself for reducing TPO antibody levels -- a genuinely new supplement candidate this app\'s research surfaced beyond what was already established for selenium alone, and specifically studied as a combination rather than myo-inositol on its own.',
    citations: [
      {
        source: 'Myo-Inositol Plus Selenium vs. Selenium Alone in Hashimoto\'s Thyroiditis with Subclinical Hypothyroidism: A Systematic Review and Updated Meta-Analysis',
        url: 'https://pubmed.ncbi.nlm.nih.gov/42122912/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['nutrient-selenium'],
  },
  {
    id: 'nutrient-iodine',
    category: 'nutrients',
    title: 'Iodine: A Genuine Two-Edged Nutrient',
    teaser: 'Both too little AND too much iodine are documented Hashimoto\'s risk factors -- rare for a single nutrient.',
    summary:
      'Iodine is required for thyroid hormone synthesis, so deficiency is a well-established cause of hypothyroidism worldwide -- but excess iodine intake, particularly a rapid increase from a previously deficient baseline, is separately documented as a trigger for autoimmune thyroiditis in genetically susceptible people. This makes iodine a genuinely two-edged case where "more is better" doesn\'t hold, unlike most of the other nutrients in this category -- real reason to track actual intake rather than supplement broadly.',
    citations: [
      {
        source: 'Iodine intake from universal salt iodization programs and Hashimoto\'s thyroiditis: a systematic review',
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12191997/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['additive-nitrates-nitrites'],
  },
  {
    id: 'nutrient-vitamin-d',
    category: 'nutrients',
    title: 'Vitamin D',
    teaser: 'A genuinely mixed evidence picture -- not the clean win it\'s often presented as.',
    summary:
      'Vitamin D\'s evidence is authentically split rather than one-sided: a positive meta-analysis links higher vitamin D status to lower TPO antibody levels, while a separate, placebo-controlled RCT found no significant effect of supplementation on thyroid autoimmunity markers. The identical "real correlation, unreliable intervention trials" pattern shows up independently in rheumatoid arthritis and multiple sclerosis too -- named explicitly in this app\'s own research as one real biological uncertainty confirmed three separate times across different diseases, not three separate coincidences.',
    citations: [
      { source: 'Meta-analysis of the association between vitamin D and autoimmune thyroid disease', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4425156/' },
      {
        source: 'Effect of vitamin D deficiency treatment on thyroid function and autoimmunity markers in Hashimoto\'s thyroiditis: a double-blind randomized placebo-controlled trial',
        url: 'https://pubmed.ncbi.nlm.nih.gov/29026419/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['gut-vitamin-d-cldn2'],
  },
  {
    id: 'nutrient-zinc-iron-b12',
    category: 'nutrients',
    title: 'Zinc, Iron & B12',
    teaser: 'Three separate common deficiencies that all genuinely overlap with Hashimoto\'s symptoms -- and with each other.',
    summary:
      'Zinc, iron, and B12 deficiency are all independently common in Hashimoto\'s patients and each can independently cause fatigue, hair thinning, and cognitive symptoms that overlap heavily with thyroid symptoms themselves -- meaning a real deficiency in any of these three can be mistaken for, or can compound, undertreated thyroid disease. Iron deficiency specifically also directly impairs thyroid peroxidase activity, a real, mechanistic (not just symptom-overlap) interaction.',
    citations: [
      { source: 'Iron: Not Just a Passive Bystander in Autoimmune Thyroid Disease (Nutrients, 2022)', url: 'https://pubmed.ncbi.nlm.nih.gov/36364944/' },
      {
        source: 'Evaluation of vitamin D and vitamin B12 levels in patients with and without Hashimoto\'s thyroiditis: a case-control study',
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12582684/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['gut-zinc-carnosine'],
  },
  {
    id: 'nutrient-folate-antioxidants',
    category: 'nutrients',
    title: 'Folate & Antioxidant Vitamins (E, C, Retinol)',
    teaser: 'A less commonly named nutrient link, surfaced directly in this app\'s own literature scan.',
    summary:
      'Folate status has been linked to autoimmune thyroiditis risk in real observational research, and specific antioxidant vitamins (E, C, retinol) show a negative correlation with TPO antibody levels in separate studies -- both genuine findings that get far less attention than selenium or vitamin D, worth naming even though the evidence base behind each is thinner and mostly observational rather than interventional.',
    citations: [
      { source: 'Lower dietary folate intake increases the risk of autoimmune thyroiditis (NHANES-based study, Frontiers in Nutrition, 2025)', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12221903/' },
      {
        source: 'Effects of selenium and vitamin C on the serum level of antithyroid peroxidase antibody in patients with autoimmune thyroiditis',
        url: 'https://pubmed.ncbi.nlm.nih.gov/30182359/',
      },
    ],
    overallTier: 'weak',
  },
  {
    id: 'nutrient-nigella-sativa',
    category: 'nutrients',
    title: 'Nigella Sativa (Black Seed)',
    teaser: 'A real candidate outside this app\'s existing scoring entirely -- backed by two independent RCTs.',
    summary:
      'Black seed (Nigella sativa, also called black cumin) has real randomized trial support: an 8-week trial (40 patients) showed TSH dropping roughly 2.0 mIU/L on average, alongside reduced anti-TPO antibodies and increased T3, and a second, separately published trial in the same population found improved lipid and cardiometabolic markers. Currently outside this app\'s own D1-D6 scoring system entirely -- flagged as a real, evidence-backed candidate worth a future closer look, not yet formally incorporated.',
    citations: [
      {
        source: 'The effects of Nigella sativa on thyroid function in patients with Hashimoto\'s thyroiditis: a randomized controlled trial',
        url: 'https://pubmed.ncbi.nlm.nih.gov/27852303/',
      },
      {
        source: 'Powdered black cumin seeds strongly improves serum lipids, atherogenic index of plasma and anthropometric features in patients with Hashimoto\'s thyroiditis',
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5870944/',
      },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'nutrient-tying-together',
    category: 'nutrients',
    title: 'Tying It All Together: Which of These Actually Has the Strongest Evidence',
    teaser: 'Seven real nutrients, honestly ranked by how strong their own evidence actually is.',
    summary:
      "Read side by side rather than one at a time, these seven nutrients sort into a real hierarchy. Selenium (paired with myo-inositol) carries the strongest trial-level evidence of anything in this app's entire research base, with iodine's own two-edged deficiency/excess risk close behind as similarly well-established. Vitamin D, zinc/iron/B12, and Nigella sativa sit in a real middle tier -- genuine mechanisms and real trial data, but less consistent or less replicated. Folate and the antioxidant vitamins sit at the honest bottom -- real findings worth knowing, but thin and mostly observational. None of this is a reason to ignore the weaker entries; it's a reason to prioritize selenium and iodine status first if choosing where to start, and to treat everything below that as worth a real conversation with a doctor rather than aggressive self-supplementing.",
    citations: [
      {
        source: 'Selenium supplementation in patients with Hashimoto thyroiditis: a systematic review and meta-analysis of 21 studies (1,610 subjects)',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10194801/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['nutrient-selenium', 'nutrient-iodine'],
  },
];
