import type { DigestEntry } from './types';

// Gut & Microbiome -- 16 entries, the single largest category and the one
// most directly tied to this app's own named core purpose ("gut/microbiome
// healing is an explicit, named goal, not just a side effect of good food
// choices" -- CLAUDE.md). Draws on this session's own gut-mechanism
// research across the literature scan's Parts One/Four and the dedicated
// leaky-gut-repair deep dive.
export const GUT_MICROBIOME_ENTRIES: DigestEntry[] = [
  {
    id: 'gut-scfa-treg',
    category: 'gutMicrobiome',
    title: 'Short-Chain Fatty Acids: The Most Food-Controllable Lever',
    teaser: 'The single most directly food-controllable mechanism in this whole app\'s research, named explicitly.',
    summary:
      'When gut bacteria ferment dietary fiber, they produce short-chain fatty acids (SCFAs) -- primarily butyrate, propionate, and acetate -- which drive real, measurable immune tolerance through regulatory T cell (Treg) induction, via both HDAC inhibition and signaling through the GPR43/GPR41/GPR109A receptors. This is the mechanistic bridge connecting "eat more fiber" to "calm an overactive immune system" with real, specific biology in between, not just a general wellness gesture.',
    citations: [
      { source: 'Smith et al. 2013, Science -- SCFAs regulate colonic Treg cell homeostasis', url: 'https://pubmed.ncbi.nlm.nih.gov/23828891/' },
      { source: 'Furusawa et al. 2013, Nature -- commensal microbe-derived butyrate induces colonic Treg differentiation', url: 'https://pubmed.ncbi.nlm.nih.gov/24226770/' },
    ],
    overallTier: 'strong',
    relatedIds: ['gut-fiber-hashimotos-microbiota'],
  },
  {
    id: 'gut-zonulin-gliadin',
    category: 'gutMicrobiome',
    title: 'Zonulin & the Gliadin-CXCR3 Pathway',
    teaser: 'The specific, named biological pathway behind "gluten increases gut permeability" -- not a vague claim.',
    summary:
      'Gliadin (a gluten protein fraction) binds the CXCR3 receptor on intestinal cells, triggering the release of zonulin, a protein that reversibly opens the tight junctions between gut lining cells -- originally characterized in celiac disease, but the same pathway is now documented as relevant across several autoimmune conditions this app\'s own research has covered (see Other Autoimmune Diseases), not just celiac itself.',
    citations: [
      { source: 'Fasano 2011, Physiological Reviews -- zonulin and intestinal barrier function', url: 'https://pubmed.ncbi.nlm.nih.gov/21248165/' },
    ],
    overallTier: 'strong',
    relatedIds: ['problem-gluten-grains'],
  },
  {
    id: 'gut-blautia-lupus-zonulin',
    category: 'gutMicrobiome',
    title: 'A Specific Bacterial Strain Directly Inducing Permeability (Lupus)',
    teaser: 'A genuinely novel finding: one named gut bacterium, shown to directly cause permeability, sex-dependently.',
    summary:
      'Research in lupus identified a specific gut bacterial strain (Blautia/Ruminococcus gnavus) that directly induces zonulin-mediated intestinal permeability, with the effect shown to be sex-dependent -- a real, specific mechanism rather than "an imbalanced microbiome" left vague. Worth noting this is lupus-specific research, included here as real corroborating evidence for the broader gut-autoimmunity link, not a Hashimoto\'s-specific finding.',
    citations: [
      {
        source: 'Sex-dependent Lupus Blautia (Ruminococcus) gnavus strain induction of zonulin-mediated intestinal permeability and autoimmunity (Frontiers in Immunology, 2022)',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9405438/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['other-lupus-probiotic-rct'],
  },
  {
    id: 'gut-glutamine-null-result',
    category: 'gutMicrobiome',
    title: 'L-Glutamine: A Real, Humbling Correction',
    teaser: 'Almost certainly the most commonly recommended "leaky gut" supplement -- and a systematic review found it doesn\'t work overall.',
    summary:
      'L-glutamine has a real mechanism (it regulates the tight-junction proteins occludin and claudin-1, and fuels enterocytes directly as their preferred fuel source) and genuine positive trial results in specific contexts like HIV, burns, and exercise-heat stress. But a systematic review of 10 clinical trials (352 participants total) found it did NOT significantly improve intestinal permeability overall -- a real correction to how confidently this supplement tends to get recommended, stated plainly rather than smoothed over.',
    citations: [
      {
        source: 'Abbasi et al. 2024, Amino Acids -- systematic review & meta-analysis of glutamine supplementation and gut permeability',
        url: 'https://doi.org/10.1007/s00726-024-03420-7',
      },
    ],
    overallTier: 'weak',
  },
  {
    id: 'gut-vitamin-d-cldn2',
    category: 'gutMicrobiome',
    title: 'Vitamin D & the CLDN2 Tight-Junction Gene',
    teaser: 'A real, independently discovered reason vitamin D\'s effect on Hashimoto\'s might run through the gut, not just the thyroid.',
    summary:
      'The CLDN2 gene (which codes for claudin-2, a tight-junction protein) is a direct, confirmed vitamin D receptor target, identified via ChIP assay -- meaning vitamin D receptor signaling has a real, specific, non-speculative mechanism protecting gut barrier integrity via the MLCK signaling pathway, separate from and additional to vitamin D\'s already-researched (and more mixed) effect on TPO antibodies directly.',
    citations: [
      { source: 'Zhang et al. 2015, Scientific Reports -- tight junction CLDN2 gene is a direct target of the vitamin D receptor', url: 'https://pubmed.ncbi.nlm.nih.gov/26212084/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['nutrient-vitamin-d'],
  },
  {
    id: 'gut-zinc-carnosine',
    category: 'gutMicrobiome',
    title: 'Zinc Carnosine',
    teaser: 'A specific compound form of zinc, with better trial support for gut-barrier repair than its lower profile suggests.',
    summary:
      'A real RCT showed zinc carnosine completely blocked NSAID-induced intestinal permeability increase -- a meaningfully specific, positive result, in the same broad supplement category (zinc) already tiered "moderate" for its general immune role. Separate trial evidence also supports it for tight-junction integrity in both athletes and gastric-ulcer patients specifically, a more consistently positive picture than glutamine\'s own mixed result above.',
    citations: [
      {
        source: 'Mahmood et al. 2007, Gut -- zinc carnosine stabilises small bowel integrity and stimulates gut repair',
        url: 'https://pubmed.ncbi.nlm.nih.gov/16777920/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['nutrient-zinc-iron-b12'],
  },
  {
    id: 'gut-strain-specific-mechanisms',
    category: 'gutMicrobiome',
    title: 'Strain-Specific Probiotic Mechanisms (Not "Probiotics in General")',
    teaser: 'Different named strains repair different specific tight-junction proteins -- "take a probiotic" undersells what\'s actually known.',
    summary:
      'E. coli Nissle 1917, a specific well-studied probiotic strain, has documented mechanisms restoring ZO-1, ZO-2, and claudin-14. Bifidobacterium bifidum, separately, restores occludin specifically. These are two chemically distinct repair pathways from two named organisms -- real, specific mechanistic evidence, deliberately avoiding the vagueness of a blanket "probiotics help the gut" claim this whole category tries to steer clear of.',
    citations: [
      {
        source: 'Outer membrane vesicles and soluble factors released by E. coli Nissle 1917 enhance barrier function by regulating tight-junction proteins',
        url: 'https://pubmed.ncbi.nlm.nih.gov/28018313/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['fermented-bifidobacterium'],
  },
  {
    id: 'gut-4r-protocol',
    category: 'gutMicrobiome',
    title: 'The 4R Protocol: A Framework With Evidenced Parts',
    teaser: 'Every individual step has real evidence behind it -- the packaged protocol itself doesn\'t.',
    summary:
      'The 4R Protocol (Remove triggers, Replace digestive support, Reinoculate with probiotics, Repair the gut lining) is a real, widely-used functional-medicine framework -- and this app\'s own review found every individual component (elimination, probiotics, glutamine, zinc carnosine) has its own separate evidence base, covered elsewhere in this category. A direct search for clinical validation of the 4-step PACKAGE itself, though, turned up almost entirely practitioner and wellness-industry sources, not a peer-reviewed trial of the protocol as a whole -- an honest, practitioner-framework tier, not a validated package.',
    citations: [
      {
        source: 'The Institute for Functional Medicine -- "Five R Gut Restoration Program"',
        url: 'https://www.marioninstitute.org/wp-content/uploads/2020/04/FiveRFrameworkforGutRestoration_v3.pdf',
      },
    ],
    overallTier: 'weak',
    stageNote: 'The framework spans this app\'s own Stages 2-3 ("Digging" and "Gut Repair").',
  },
  {
    id: 'gut-zonulin-timeline',
    category: 'gutMicrobiome',
    title: 'A Real Timeline: How Long Gut Repair Actually Takes',
    teaser: 'A concrete, evidence-backed answer to "how long does this take," not an indefinite "it takes time."',
    summary:
      'Real dietary intervention studies measuring zonulin directly (not just symptoms) found significant reductions within 8 weeks in one randomized crossover trial (a polyphenol-rich diet in older adults), with results confirmed at both 12 and 24 weeks in a second, independent weight-loss trial -- a genuine, checkable timeline rather than an open-ended promise. Worth pairing with the honest caveat that these are group averages from specific interventions, not a guarantee for any one person\'s own pace.',
    citations: [
      {
        source: 'Del Bo\' et al. 2021, Clinical Nutrition -- polyphenol-rich diet reduces serum zonulin in older subjects (the MaPLE trial)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/33388204/',
      },
      {
        source: 'Changes in intestinal permeability and gut microbiota following diet-induced weight loss in MASH/liver fibrosis patients',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11444513/',
      },
    ],
    overallTier: 'moderate',
    stageNote: 'A realistic milestone marker for this app\'s own Stage 3 ("Gut Repair").',
  },
  {
    id: 'gut-larazotide',
    category: 'gutMicrobiome',
    title: 'Larazotide Acetate: The Biology Taken Seriously at the Drug-Development Level',
    teaser: 'A real pharmaceutical zonulin blocker, in Phase III trials -- with an honest, complicating result.',
    summary:
      'Larazotide acetate is a real drug candidate designed specifically to block zonulin and has reached Phase III trials for celiac disease -- proof the underlying gut-permeability biology is taken seriously well beyond wellness-industry framing. The honest complication: despite showing real symptom benefit in its own trial, it did NOT significantly improve the actual measured intestinal permeability outcome, a reminder that symptom relief and a measured biological marker don\'t always move together.',
    citations: [
      {
        source: 'Larazotide acetate: a pharmacological peptide approach to tight junction regulation (AJP-GI and Liver Physiology, 2021)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/33881350/',
      },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'gut-fiber-hashimotos-microbiota',
    category: 'gutMicrobiome',
    title: 'A Direct Fiber Intervention Study in Hashimoto\'s Patients',
    teaser: 'One of the few entries in this whole app tested in Hashimoto\'s patients specifically, not borrowed from another disease.',
    summary:
      'A dietary-fiber-intervention study measured gut microbiota changes in Hashimoto\'s thyroiditis patients directly -- real, disease-specific data rather than extrapolated from a different autoimmune condition, directly supporting the SCFA/fiber mechanism above with a Hashimoto\'s-specific population rather than a general or cross-disease one.',
    citations: [
      {
        source: 'Dietary fibre intervention in Hashimoto\'s thyroiditis patients and its impact on the gut microbiota (2025)',
        url: 'https://www.sciencedirect.com/science/article/pii/S2667268525000178',
      },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'gut-aip-ibd-rct',
    category: 'gutMicrobiome',
    title: 'A Larger, More Rigorous AIP Trial -- In IBD, Not Hashimoto\'s',
    teaser: 'The strongest AIP evidence in this app\'s whole research base comes from a different disease.',
    summary:
      'A real randomized controlled trial of the Autoimmune Protocol diet in inflammatory bowel disease (Crohn\'s/ulcerative colitis) found improvement in BOTH quality of life AND endoscopic (directly visualized) inflammation -- a larger, more rigorous trial than the single small Hashimoto\'s-specific AIP pilot study this app\'s own research otherwise relies on. Real corroborating weight for AIP as a strategy, from a disease where gut inflammation can be measured directly rather than inferred.',
    citations: [
      {
        source: 'Konijeti et al. 2017, Inflammatory Bowel Diseases -- efficacy of the Autoimmune Protocol diet',
        url: 'https://pubmed.ncbi.nlm.nih.gov/28858071/',
      },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'gut-probiotic-yogurt-lupus-rct',
    category: 'gutMicrobiome',
    title: 'A Real Human RCT: Probiotic Yogurt in Lupus',
    teaser: 'A real randomized trial, in a different autoimmune disease, of one of this app\'s own everyday fermented foods.',
    summary:
      'A real human randomized controlled trial of probiotic yogurt in lupus patients found improvement in both disease activity and disability measures -- genuine clinical trial evidence, not observational, from a disease with real biological overlap to Hashimoto\'s through the shared gut-autoimmunity mechanisms this category covers throughout.',
    citations: [
      {
        source: 'The effect of probiotic yogurt containing L. rhamnosus and B. bifidum on disease activity and disability in SLE: a randomized controlled trial',
        url: 'https://pubmed.ncbi.nlm.nih.gov/40471639/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['gut-blautia-lupus-zonulin'],
  },
  {
    id: 'gut-th17-treg-imbalance',
    category: 'gutMicrobiome',
    title: 'Th17/Treg Imbalance: The Recurring Mechanism Across Diseases',
    teaser: 'The same immune imbalance keeps showing up across completely different autoimmune diseases -- a real, repeated pattern, not a coincidence.',
    summary:
      'A shifted balance between Th17 cells (pro-inflammatory) and regulatory T cells/Tregs (tolerance-promoting) is documented across rheumatoid arthritis, inflammatory bowel disease, multiple sclerosis, lupus, and Hashimoto\'s alike -- and the gut microbiome, through the SCFA mechanism covered above, is one of the most directly food-influenced levers on that exact balance. This is the unifying thread behind why cross-disease gut research (see Other Autoimmune Diseases) is treated as real corroborating evidence here, not noise from an unrelated condition.',
    citations: [
      {
        source: 'Metabolic reprogramming as a therapeutic target for modulating the Th17/Treg balance in autoimmune diseases: a comprehensive review',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12747992/',
      },
    ],
    overallTier: 'strong',
  },
  {
    id: 'gut-molecular-mimicry',
    category: 'gutMicrobiome',
    title: 'Molecular Mimicry: How a Gut Microbe Can Trigger an Attack on the Thyroid',
    teaser: 'The real immunology explaining how something in the gut ends up implicated in a thyroid disease at all.',
    summary:
      'Molecular mimicry is a well-established immunology concept: when a microbial protein structurally resembles a human protein closely enough, antibodies trained against the microbe can mistakenly cross-react with the body\'s own tissue. This is one of the leading proposed mechanisms connecting gut bacterial composition to thyroid autoimmunity specifically, alongside the zonulin/permeability and SCFA/Treg pathways covered elsewhere in this category -- three genuinely different mechanisms, not one vague "gut-thyroid connection."',
    citations: [
      { source: 'Molecular mimicry and autoimmune thyroid disease (Current Opinion in Endocrinology, Diabetes and Obesity, 2016)', url: 'https://pubmed.ncbi.nlm.nih.gov/27307072/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'gut-leaky-gut-contested',
    category: 'gutMicrobiome',
    title: '"Leaky Gut": A Real Mechanism, a Contested Diagnosis',
    teaser: 'An honest framing this app commits to throughout: the biology is real, the clinical label is still debated.',
    summary:
      'Intestinal permeability itself is a real, measurable phenomenon (zonulin levels, lactulose-mannitol testing) with genuine mechanistic links to several autoimmune conditions, as this whole category documents. "Leaky gut syndrome" as a standalone clinical diagnosis, though, remains debated within mainstream gastroenterology and endocrinology -- not because the underlying biology is fake, but because a clear, agreed clinical definition and diagnostic threshold don\'t yet exist the way they do for, say, celiac disease. Held to the same honest standard as every evidence tier in this app.',
    citations: [
      { source: 'Biomarkers for assessment of intestinal permeability in clinical practice (Scandinavian Journal of Gastroenterology, 2021)', url: 'https://pubmed.ncbi.nlm.nih.gov/34009040/' },
    ],
    overallTier: 'moderate',
  },
];
