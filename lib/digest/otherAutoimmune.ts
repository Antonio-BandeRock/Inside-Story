import type { DigestEntry } from './types';

// Other Autoimmune Diseases -- 8 entries. None of these are Hashimoto's
// studies -- every entry is tagged with which disease it actually studied.
// Cross-disease evidence is real corroborating weight for a hypothesis
// (the recurring SCFA/Th17-Treg/zonulin/molecular-mimicry mechanisms
// covered in Gut & Microbiome), not a substitute for a Hashimoto's-specific
// trial that hasn't been run -- the same discipline this whole app's
// research has held to throughout.
export const OTHER_AUTOIMMUNE_ENTRIES: DigestEntry[] = [
  {
    id: 'other-why-cross-disease-evidence',
    category: 'otherAutoimmune',
    title: 'Why This Category Exists At All',
    teaser: 'An honest framing, read this one first: none of these seven entries are Hashimoto\'s studies.',
    summary:
      'Autoimmune diseases share real, recurring underlying mechanisms -- SCFA-driven Treg induction, Th17/Treg imbalance, zonulin-mediated gut permeability, molecular mimicry (all covered in Gut & Microbiome) -- documented independently across rheumatoid arthritis, IBD, multiple sclerosis, type 1 diabetes, lupus, Sjögren\'s syndrome, and psoriasis. When the identical pattern shows up across genuinely unrelated diseases studied by different research groups, that\'s real corroborating weight for the underlying mechanism -- but it is corroboration, not proof of a Hashimoto\'s-specific effect. Every entry below names its actual disease plainly rather than blurring it into "autoimmune disease" generally.',
    citations: [{ source: 'Cross-disease autoimmune mechanism reviews' }],
    overallTier: 'moderate',
    relatedIds: ['gut-th17-treg-imbalance'],
  },
  {
    id: 'other-rheumatoid-arthritis',
    category: 'otherAutoimmune',
    title: 'Rheumatoid Arthritis',
    teaser: 'The same vitamin D "real correlation, unreliable trials" pattern -- confirmed a second time, in a different disease.',
    summary:
      'Rheumatoid arthritis research independently shows the identical vitamin D pattern already documented for Hashimoto\'s: real observational correlation between vitamin D status and disease markers, alongside inconsistent intervention-trial results. RA research also documents SCFA depletion and Th17/Treg imbalance as real contributors to disease activity, the same mechanisms this app\'s Gut & Microbiome category covers in detail.',
    citations: [{ source: 'Vitamin D and rheumatoid arthritis disease activity studies' }],
    overallTier: 'moderate',
    relatedIds: ['nutrient-vitamin-d'],
  },
  {
    id: 'other-ibd',
    category: 'otherAutoimmune',
    title: 'Inflammatory Bowel Disease (Crohn\'s & Ulcerative Colitis)',
    teaser: 'The disease with the most directly gut-measurable evidence of any in this whole category.',
    summary:
      'IBD is uniquely positioned in this category because gut inflammation can be measured directly (via endoscopy) rather than inferred -- which is exactly why the AIP diet RCT covered in Gut & Microbiome (improving both quality of life AND endoscopic inflammation) carries real weight here. SCFA depletion is also directly documented in IBD patients\' own gut microbiota, the clearest disease-specific confirmation of the fiber/SCFA mechanism this app\'s research keeps returning to.',
    citations: [{ source: 'SCFA depletion in IBD patient gut microbiota' }],
    overallTier: 'moderate',
    relatedIds: ['gut-aip-ibd-rct', 'gut-scfa-treg'],
  },
  {
    id: 'other-multiple-sclerosis',
    category: 'otherAutoimmune',
    title: 'Multiple Sclerosis',
    teaser: 'A third independent confirmation of the same vitamin D pattern -- named explicitly as three, not a coincidence.',
    summary:
      'MS research shows the same "real correlation, inconsistent intervention trials" vitamin D pattern documented for both Hashimoto\'s and rheumatoid arthritis -- named explicitly across this app\'s research as one real biological uncertainty confirmed three separate times in three unrelated autoimmune diseases, worth treating as a genuine open question rather than assuming any one disease\'s trial result settles it for the others.',
    citations: [{ source: 'Vitamin D and multiple sclerosis relapse-rate studies' }],
    overallTier: 'moderate',
    relatedIds: ['nutrient-vitamin-d', 'other-rheumatoid-arthritis'],
  },
  {
    id: 'other-type1-diabetes',
    category: 'otherAutoimmune',
    title: 'Type 1 Diabetes',
    teaser: 'Real evidence that early-life gut microbiome development matters for autoimmune risk, not just adult diet.',
    summary:
      'Type 1 diabetes research contributes a genuinely different angle from most of this category: real evidence linking early infant gut microbiome development (feeding method, early antibiotic exposure) to later autoimmune disease risk, alongside a documented association between celiac disease and T1D co-occurrence far above chance -- both pointing at gut-immune programming happening earlier in life than most of this app\'s own adult-focused food research addresses directly.',
    citations: [{ source: 'Early-life gut microbiome development and type 1 diabetes risk studies' }],
    overallTier: 'moderate',
  },
  {
    id: 'other-lupus',
    category: 'otherAutoimmune',
    title: 'Lupus (Systemic Lupus Erythematosus)',
    teaser: 'The single strongest gut-specific evidence base in this whole category -- a named bacterial strain AND a real human RCT.',
    summary:
      'Lupus research contributes two of this app\'s most specific gut-autoimmunity findings anywhere: a named bacterial strain (Blautia/Ruminococcus gnavus) directly and causally inducing zonulin-mediated permeability in a sex-dependent way, and a real, positive human randomized controlled trial of probiotic yogurt improving both disease activity and disability measures. Genuinely the strongest gut-mechanism evidence base of any disease in this category, both entries covered in full under Gut & Microbiome.',
    citations: [{ source: 'Ruminococcus gnavus/zonulin lupus studies' }, { source: 'Probiotic yogurt RCT, lupus disease activity' }],
    overallTier: 'moderate',
    relatedIds: ['gut-blautia-lupus-zonulin', 'gut-probiotic-yogurt-lupus-rct'],
  },
  {
    id: 'other-sjogrens',
    category: 'otherAutoimmune',
    title: 'Sjögren\'s Syndrome',
    teaser: 'A real autoimmune disease known for dryness rather than digestion -- with a documented gut connection anyway.',
    summary:
      'Sjögren\'s syndrome (an autoimmune disease primarily attacking moisture-producing glands, causing dry eyes and dry mouth) is less commonly discussed for its gut connection than the diseases above, but real research documents altered gut microbiota composition in Sjögren\'s patients compared to healthy controls, and a genuine, if less studied, overlap in reported co-occurrence with Hashimoto\'s specifically -- worth naming for anyone managing both conditions at once.',
    citations: [{ source: 'Gut microbiota composition, Sjögren\'s syndrome case-control studies' }],
    overallTier: 'weak',
  },
  {
    id: 'other-psoriasis',
    category: 'otherAutoimmune',
    title: 'Psoriasis & Psoriatic Arthritis',
    teaser: 'A real, well-documented weight-inflammation link, plus a real gluten-sensitive subgroup worth knowing about.',
    summary:
      'Psoriasis research documents a real, bidirectional relationship with obesity and visceral fat inflammation (echoing this app\'s own Mitochondria & Metabolism findings on visceral fat as an active inflammatory tissue) and a genuine, identifiable subgroup of psoriasis patients who test positive for gluten sensitivity and see measurable skin improvement on a gluten-free diet -- a real, if minority, dietary responder pattern rather than a universal one.',
    citations: [{ source: 'Gluten-free diet response in gluten-sensitive psoriasis patients' }],
    overallTier: 'moderate',
    relatedIds: ['mito-visceral-fat-endotoxin-barrier'],
  },
];
