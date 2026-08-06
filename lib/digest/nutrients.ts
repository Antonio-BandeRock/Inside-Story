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
      { source: '21-RCT meta-analysis, TPO antibody reduction' },
      { source: 'Cochrane Library systematic review, selenium and Hashimoto\'s thyroiditis' },
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
    citations: [{ source: '2024 updated meta-analysis, myo-inositol + selenium combination' }],
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
    citations: [{ source: 'Iodine intake and autoimmune thyroiditis incidence, population studies' }],
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
    citations: [{ source: 'Vitamin D/TPO antibody meta-analysis' }, { source: 'Placebo-controlled vitamin D supplementation RCT, thyroid autoimmunity' }],
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
    citations: [{ source: 'Iron/TPO enzyme activity studies' }, { source: 'B12 and zinc deficiency prevalence in autoimmune thyroid disease' }],
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
    citations: [{ source: 'Folate/autoimmune thyroiditis observational studies' }, { source: 'Antioxidant vitamin/TPO antibody correlation studies' }],
    overallTier: 'weak',
  },
  {
    id: 'nutrient-nigella-sativa',
    category: 'nutrients',
    title: 'Nigella Sativa (Black Seed)',
    teaser: 'A real candidate outside this app\'s existing scoring entirely -- backed by two independent RCTs.',
    summary:
      'Black seed (Nigella sativa, also called black cumin) has real randomized trial support: an 8-week trial (40 patients) showed TSH dropping roughly 2.0 mIU/L on average, alongside reduced anti-TPO antibodies and increased T3, and a second, separately published trial in the same population found improved lipid and cardiometabolic markers. Currently outside this app\'s own D1-D6 scoring system entirely -- flagged as a real, evidence-backed candidate worth a future closer look, not yet formally incorporated.',
    citations: [{ source: 'Nigella sativa 8-week RCT, TSH/anti-TPO/T3 outcomes' }, { source: 'Nigella sativa lipid/cardiometabolic RCT, same population' }],
    overallTier: 'moderate',
  },
];
