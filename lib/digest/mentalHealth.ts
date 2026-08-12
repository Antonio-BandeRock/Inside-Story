import type { DigestEntry } from './types';

// Mental Health & Food -- new 2026-08-09, a real, deliberate deep-dive on a
// topic this Digest had only ever covered scattered across individual
// conditions (RA, celiac, CKD, psoriasis, PCOS, and IBS each carry their
// own real depression/anxiety comorbidity entry). This is the real,
// general physiology and evidence base underneath all of those --
// deliberately cross-linked into the existing condition-specific entries
// rather than duplicating them. Every claim independently verified via
// WebSearch before being written in, including one real, honest
// counter-finding (exercise vs. antidepressants) kept in rather than
// smoothed into a more flattering, one-sided claim.
export const MENTAL_HEALTH_ENTRIES: DigestEntry[] = [
  {
    id: 'mentalhealth-overview',
    category: 'basicHealth',
    title: 'Mental Health and Physical Health Share Measurable Biological Pathways',
    teaser: 'Inflammation, gut function, and specific nutrient levels all show documented connections to mood, not a vague mind-body claim, a testable set of mechanisms.',
    summary: 'The research already documents depression and anxiety comorbidity across several individual conditions, rheumatoid arthritis, celiac disease, chronic kidney disease, psoriasis, PCOS, and IBS each carry their own cited entry. This topic covers the general biology underneath all of those specific findings: a measurable link between inflammation and depression, randomized-trial evidence that diet itself can measurably improve depressive symptoms, nutrient-specific findings (omega-3s, B vitamins), and honest, current evidence on exercise\'s role, including where the evidence doesn\'t support an overstated claim. None of this replaces professional mental health care, it\'s the biological groundwork underneath why food, sleep, and movement are worth treating as relevant to mood, not adjacent to it.',
    citations: [
      {
        source: 'Frontiers in Behavioral Neuroscience, "Exploring the role of inflammation in major depressive disorder"',
        url: 'https://www.frontiersin.org/journals/behavioral-neuroscience/articles/10.3389/fnbeh.2023.1282242/full',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['mentalhealth-tying-together', 'mentalhealth-when-to-seek-help', 'garden-mental-health-benefits'],
  },
  {
    id: 'mentalhealth-inflammation-link',
    category: 'basicHealth',
    title: 'Depression Shows a Measurable Inflammatory Signature, and It May Come Before the Depression, Not Just After',
    teaser: 'Elevated CRP and inflammatory cytokine levels are consistently found in depression, and population-based research finds this inflammation often precedes the illness rather than just following it.',
    summary: 'Repeated meta-analyses find people experiencing acute depression show measurably higher circulating CRP (C-reactive protein) and inflammatory cytokines, especially interleukin-6, than people without depression, the same inflammatory markers the research already tracks across several autoimmune conditions. What makes this a plausible causal thread rather than just a correlation: population-based longitudinal research finds elevated CRP often precedes the actual onset of depression, suggesting inflammation may be a contributing cause in at least some cases, not simply a downstream consequence of already feeling unwell. This has a practical clinical use too, research finds inflammatory-marker levels can help predict how well a specific person will respond to a specific type of antidepressant, an emerging tool for more personalized treatment.',
    citations: [
      {
        source: 'Prevalence of low-grade inflammation in depression, systematic review and meta-analysis of CRP levels, Psychological Medicine',
        url: 'https://www.cambridge.org/core/journals/psychological-medicine/article/prevalence-of-lowgrade-inflammation-in-depression-a-systematic-review-and-metaanalysis-of-crp-levels/5B86EE7BC5BB46A1722788C108F58246',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['mentalhealth-omega3-epa-dha'],
  },
  {
    id: 'mentalhealth-smiles-trial',
    category: 'basicHealth',
    title: 'A Randomized Trial Found Improving Diet Alone Measurably Treated Clinical Depression',
    teaser: 'The landmark SMILES trial found 32.3% of people who improved their diet reached depression remission, against 8.0% given social support alone, a direct test, not an observational guess.',
    summary:
      'The SMILES trial, led by Professor Felice Jacka\'s team and published in BMC Medicine in 2017, was the first randomized controlled trial specifically designed to test whether a dietary intervention itself, not just diet\'s association with mood, could treat clinical depression. Over 12 weeks, participants with moderate-to-severe depression either received individual nutritional counseling toward a modified Mediterranean-style diet from a clinical dietitian, or a matched social-support control with no dietary component. The result: 32.3 percent of the diet-intervention group reached clinical remission, against 8.0 percent of the control group, a clinically meaningful difference (a number-needed-to-treat of 4.1, meaning roughly one in four people treated this way achieved a benefit specifically attributable to the diet change). A important detail from the trial\'s own analysis: the benefit wasn\'t explained by weight loss or increased physical activity, it tracked directly with how much someone actually improved their diet, the strongest evidence yet that food itself, not just its downstream effects, can measurably move clinical depression.',
    citations: [
      {
        source: 'Jacka et al. 2017, BMC Medicine, "A randomised controlled trial of dietary improvement for adults with major depression" (the SMILES trial)',
        url: 'https://link.springer.com/article/10.1186/s12916-017-0791-y',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['mentalhealth-inflammation-link'],
  },
  {
    id: 'mentalhealth-omega3-epa-dha',
    category: 'basicHealth',
    title: 'For Depression Specifically, EPA, Not DHA, Is the Active Omega-3',
    teaser: 'A repeated finding across multiple meta-analyses: omega-3 formulas that are mostly or purely DHA show no depression benefit, while EPA-dominant formulas do, at a specific, dose range.',
    summary: 'The existing Omega-3 & Omega-6 research already covers the two fatty acids\' general roles, this entry covers a specific, depression-focused finding worth knowing separately: EPA and DHA are NOT interchangeable for this particular use. Repeated meta-analyses find formulas that are DHA-pure or DHA-majority show no significant antidepressant effect, while formulas with EPA at 60 percent or more of total omega-3 content do show a measurable benefit, most consistently at a specific dose of 1 gram of EPA a day or less, research also finds doses of 2 grams a day or more stop showing the same benefit, a dose-response window rather than "more is better." The proposed mechanisms are multiple: EPA and DHA both influence neuron cell-membrane properties and neurotransmitter signaling, but also carry anti-inflammatory, pro-resolving effects, tying this finding directly back to the inflammation-depression link already covered in this topic.',
    citations: [
      {
        source: 'Meta-analysis and meta-regression of omega-3 PUFA supplementation for major depressive disorder, PMID 26978738',
        url: 'https://pubmed.ncbi.nlm.nih.gov/26978738/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['omega36-overview', 'mentalhealth-inflammation-link'],
  },
  {
    id: 'mentalhealth-exercise-honest-evidence',
    category: 'basicHealth',
    title: 'Exercise Helps Depression, but the Honest Evidence Doesn\'t Support "Better Than Medication"',
    teaser: 'Trials find exercise as effective as antidepressants for mild-to-moderate depression, and an added benefit when combined with medication, but a direct, published correction pushes back on the stronger claim that exercise simply outperforms treatment.',
    summary:
      'Randomized controlled trials comparing exercise directly to antidepressant medication for nonsevere depression find the two comparable in effect, and meta-analyses find exercise added on top of existing antidepressant treatment produces a further, significant improvement, not just a redundant addition. Neuroscience gives this a plausible mechanism: exercise is linked to measurable increases in hippocampal and prefrontal cortex volume, brain regions antidepressant medication is also thought to affect through overlapping pathways. A honest caveat worth including directly, not smoothed over: a 2024 published correction in the Journal of Physical Activity and Health directly challenges the stronger, more widely repeated claim that exercise is simply BETTER than medication or therapy, arguing the underlying evidence doesn\'t support that specific framing even though the "comparably effective, especially for mild-to-moderate depression" claim does hold up. The honest read: exercise is an evidence-backed option, especially as an add-on to existing treatment, not a proven replacement for medication or therapy in more severe depression.',
    citations: [
      {
        source: 'Journal of Physical Activity and Health, 2024, "The Evidence Is Clear, Exercise Is Not Better Than Antidepressants or Therapy"',
        url: 'https://journals.humankinetics.com/view/journals/jpah/22/2/article-p161.xml',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['mentalhealth-smiles-trial'],
  },
  {
    id: 'mentalhealth-b12-folate-mood',
    category: 'basicHealth',
    title: 'Low Folate or B12 Can Mimic Depression, and a Safety Trap Sits Right Next to the Fix',
    teaser: 'Folate deficiency is linked to worse depression severity and blunted antidepressant response, but a well-documented safety issue means B12 needs checking before folate is supplemented at a therapeutic dose.',
    summary: 'Folate works alongside B12 and B6 in the body\'s one-carbon metabolism pathway, and research finds deficiency in any of them can mimic or worsen depression, folate deficiency specifically is linked to increased depression risk, more severe depressive episodes, longer episode duration, and documented poorer response to standard antidepressant treatment. This is enough that L-methylfolate, a specific, active form of folate, is FDA-regulated as a prescription medical food specifically for depression augmentation, with randomized trial evidence (15 milligrams added to an existing antidepressant) producing a measurable improvement in people who hadn\'t fully responded to medication alone. The important safety caveat the existing B12/Folate essential-nutrient research already covers in depth: high-dose folate can mask the blood-test signs of an underlying B12 deficiency while doing nothing to stop that deficiency\'s own separate, neurological damage, a direct reason B12 status is worth checking before folate supplementation at a therapeutic dose, not just for mood but for this specific, documented masking risk.',
    citations: [
      {
        source: 'L-Methylfolate as Adjunctive Therapy for SSRI-Resistant Major Depression, American Journal of Psychiatry',
        url: 'https://psychiatryonline.org/doi/10.1176/appi.ajp.2012.11071114',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['folate-overview', 'b12-overview'],
  },
  {
    id: 'mentalhealth-when-to-seek-help',
    category: 'basicHealth',
    title: 'None of This Replaces Professional Mental Health Care',
    teaser: 'Diet, sleep, and exercise are evidence-backed contributors to mood, and none of them are a substitute for professional care when it\'s actually needed.',
    summary: 'Every finding in this topic (diet, omega-3s, exercise, B vitamins) is an evidence-backed contributor to mood, and every one of them works alongside professional mental health care, not instead of it, the SMILES trial itself, this topic\'s own strongest single piece of evidence, tested dietary counseling as an ADJUNCT approach in a research setting with clinical support built in, not a self-directed replacement for treatment. In the US, the 988 Suicide & Crisis Lifeline (call or text 988) is available 24/7, free, and confidential, for anyone in crisis or supporting someone who is, worth knowing exists regardless of whether it\'s ever needed. A persistent low mood, anxiety, or loss of interest in things that used to matter is worth bringing directly to a doctor or mental health professional, the same way the condition-specific research already treats a physical symptom as worth a direct conversation rather than something to self-manage alone.',
    citations: [
      {
        source: '988 Suicide & Crisis Lifeline',
        url: 'https://988lifeline.org/',
      },
    ],
    overallTier: 'strong',
  },
  {
    id: 'mentalhealth-tying-together',
    category: 'basicHealth',
    title: 'Mental Health Is Now a Documented Comorbidity Entry for All 19 of The Conditions',
    teaser: 'From RA and celiac to Graves\' and gout, every single condition already covered now carries its own cited depression/anxiety finding, this topic is the shared physiology underneath all of them.',
    summary: 'The condition-specific research now documents an individually-cited depression and/or anxiety finding for every one of its 19 conditions, Hashimoto\'s, RA, psoriasis, Graves\', Type 1 Diabetes, celiac, IBD, MS, lupus, Sjögren\'s, PCOS, CKD, MASLD, Type 2 Diabetes, IBS, migraine, cardiovascular disease, gout, and prostate health each have their own distinct entry, not a generic, repeated warning. This topic is meant as the shared, general biology underneath all of them: the same inflammation-mood link, the same dietary-intervention evidence, the same nutrient and exercise findings, applicable regardless of which specific condition someone is managing. Worth reading alongside whichever condition-specific entry brought a person here, not as a replacement for it.',
    citations: [
      {
        source: 'Frontiers in Behavioral Neuroscience, "Exploring the role of inflammation in major depressive disorder"',
        url: 'https://www.frontiersin.org/journals/behavioral-neuroscience/articles/10.3389/fnbeh.2023.1282242/full',
      },
    ],
    overallTier: 'strong',
    relatedIds: [
      'mentalhealth-overview',
      'organ-brain-depression-anxiety-euthyroid',
      'ra-depression-anxiety-comorbidity',
      'psoriasis-depression-suicidality-real-data',
      'graves-psychiatric-disorders-nationwide',
      'type1-diabetes-distress-psychological-burden',
      'celiac-depression-anxiety-mental-health',
      'ibd-depression-anxiety-bidirectional-real-data',
      'ms-depression-suicide-real-data',
      'lupus-neuropsychiatric-real-data',
      'sjogrens-depression-anxiety-real-data',
      'pcos-sleep-mental-health-real-data',
      'ckd-depression-underrecognized',
      'masld-depression-anxiety-real-data',
      'type2-depression-bidirectional-real-data',
      'ibs-gut-directed-antidepressants',
      'migraine-anxiety-depression-bidirectional-real-data',
      'cvd-post-mi-depression-mortality',
      'gout-depression-anxiety-real-data',
      'prostate-depression-anxiety-real-data',
    ],
  },
];
