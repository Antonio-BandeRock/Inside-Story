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
    summary: 'The existing Omega-3 & Omega-6 research already covers the two fatty acids\' general roles, this entry covers a specific, depression-focused finding: EPA and DHA are NOT interchangeable for this particular use. Repeated meta-analyses find formulas that are DHA-pure or DHA-majority show no significant antidepressant effect, while formulas with EPA at 60 percent or more of total omega-3 content do show a measurable benefit, most consistently at a specific dose of 1 gram of EPA a day or less, research also finds doses of 2 grams a day or more stop showing the same benefit, a dose-response window rather than "more is better." The proposed mechanisms are multiple: EPA and DHA both influence neuron cell-membrane properties and neurotransmitter signaling, but also carry anti-inflammatory, pro-resolving effects, tying this finding directly back to the inflammation-depression link already covered in this topic.',
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
    summary: 'Every finding in this topic (diet, omega-3s, exercise, B vitamins) is an evidence-backed contributor to mood, and every one of them works alongside professional mental health care, not instead of it, the SMILES trial itself, this topic\'s own strongest single piece of evidence, tested dietary counseling as an ADJUNCT approach in a research setting with clinical support built in, not a self-directed replacement for treatment. In the US, the 988 Suicide & Crisis Lifeline (call or text 988) is available 24/7, free, and confidential, for anyone in crisis or supporting someone who is, regardless of whether it\'s ever needed. A persistent low mood, anxiety, or loss of interest in things that used to matter is worth bringing directly to a doctor or mental health professional, the same way the condition-specific research already treats a physical symptom as worth a direct conversation rather than something to self-manage alone.',
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

  // Nutritional Psychiatry, diet-as-exposure batch, added 2026-08-24,
  // sourced from a shared Google AI Mode conversation on diet and mental
  // illness, independently fact-checked via WebSearch rather than trusted
  // as given (two of its claims needed correction: the "toxicity" framing
  // turned out to mean inflammation, not literal poisoning, and the implied
  // "gut serotonin reaches the brain" framing is wrong, see
  // mentalhealth-gut-scfa-mood-mechanism below for the actual mechanism).
  // An overlap check ran first, not assumed: this category already had a
  // dedicated Mental Health & Food topic (the entries above) covering
  // the inflammation-CRP link, the SMILES trial, EPA/DHA, exercise, and
  // B12/folate, plus an individually-cited depression/anxiety comorbidity
  // entry for all 19 conditions. What the source conversation raised that
  // wasn't already covered: ultra-processed food intake itself as a
  // diet-quality exposure (distinct from the comorbidity findings above,
  // which describe two conditions co-occurring, not a food-choice risk
  // factor), the actual mechanism connecting gut microbiome health to mood
  // (IBS's own ibs-gut-serotonin-mechanism entry already covers gut
  // serotonin's role in motility correctly; this fills the separate,
  // mood-specific mechanism gap), blood sugar instability as a moment-to-
  // moment mood driver, and micronutrient-specific evidence for vitamin D,
  // magnesium, and zinc that this category's own existing nutrient-overview
  // entries (essentialNutrients.ts) don't cover. Two further, condition-
  // specific entries built from the same insulin-resistance mechanism live
  // in type2Diabetes.ts and pcos.ts, cross-linked below, since both
  // conditions' own existing depression entries cover epidemiological risk
  // rather than this specific brain mechanism.
  {
    id: 'mentalhealth-ultraprocessed-food-risk',
    category: 'basicHealth',
    title: 'Ultra-Processed Food Intake Itself Tracks With Higher Depression and Anxiety Risk',
    teaser: 'A meta-analysis of over 385,000 people found the highest ultra-processed food intake linked to 44% higher odds of depressive symptoms and 48% higher odds of anxiety symptoms than the lowest intake group.',
    summary:
      "A 2022 systematic review and meta-analysis pooled 17 observational studies covering 385,541 people and found greater ultra-processed food intake cross-sectionally associated with higher odds of depressive symptoms (odds ratio 1.44), anxiety symptoms (odds ratio 1.48), and the two combined (odds ratio 1.53). The same review's pooled prospective studies, which track people forward in time rather than measuring diet and mood at a single moment, found higher ultra-processed food intake predicted a 22% increased risk of later depression. A separate 2022 meta-analysis of 26 studies and 260,385 people confirmed the depression link (a 28% increased risk) but found no statistically significant anxiety link in its own pooled data, a disagreement between meta-analyses on the anxiety half specifically that this entry reports rather than smooths over. Every number above comes from observational research, association and prediction, not a randomized trial proving ultra-processed food itself causes depression or anxiety, the same limitation this category's own inflammation-CRP entry already flags for that adjacent body of evidence. Tiered moderate for exactly that reason, alongside the SMILES trial's own randomized, controlled evidence that improving diet quality measurably treats depression.",
    citations: [
      { source: 'Ultra-Processed Food Consumption and Mental Health: A Systematic Review and Meta-Analysis of Observational Studies, Nutrients 2022, PMC9268228', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9268228/' },
      { source: 'The association of ultra-processed food consumption with adult mental health disorders: a systematic review and dose-response meta-analysis of 260,385 participants, Nutritional Neuroscience 2022', url: 'https://www.tandfonline.com/doi/full/10.1080/1028415X.2022.2110188' },
    ],
    overallTier: 'moderate',
    relatedIds: ['mentalhealth-overview', 'mentalhealth-inflammation-link', 'mentalhealth-smiles-trial'],
  },
  {
    id: 'mentalhealth-gut-scfa-mood-mechanism',
    category: 'basicHealth',
    title: 'Fiber Fermented Into Short-Chain Fatty Acids, Not Serotonin Crossing Into the Brain, Is the Documented Gut-Mood Mechanism',
    teaser: 'Gut bacteria make roughly 90% of the body\'s serotonin, but that gut-made serotonin does not cross the blood-brain barrier. The documented mood mechanism runs through a different molecule entirely.',
    summary:
      "This category's own IBS research (see ibs-gut-serotonin-mechanism) already documents that specialized gut cells produce the large majority of the body's serotonin, and that this system directly governs gut motility. A common but imprecise extension of that fact claims this gut-made serotonin also travels to the brain and directly shapes mood, it does not: peripheral serotonin, including the kind gut cells produce, cannot cross the blood-brain barrier, and the brain synthesizes its own separate serotonin supply from dietary tryptophan. The actual, better-documented mechanism connecting gut health to mood runs through short-chain fatty acids (SCFAs), acetate, propionate, and especially butyrate, produced when gut bacteria ferment fiber from whole foods. A 2024 review in General Psychiatry details how these SCFAs regulate DNA methylation and histone acetylation in brain cells and microglia, reducing pro-inflammatory cytokine activity and promoting brain-derived neurotrophic factor (BDNF) synthesis, and finds fecal SCFA levels consistently lower in people with depression than in controls. Butyrate specifically shows an antidepressant-like effect in animal studies, reversing markers of low energy and anhedonia. The practical takeaway matches this whole category's own core direction without needing an inflated mechanism: fiber-rich whole foods feed the bacteria that make SCFAs, a documented, if still-developing, path from diet to mood that doesn't depend on serotonin transport that doesn't actually happen.",
    citations: [
      { source: 'Gut microbiota-derived short-chain fatty acids and depression: deep insight into biological mechanisms and potential applications, General Psychiatry 2024, PMID 38390241', url: 'https://pubmed.ncbi.nlm.nih.gov/38390241/' },
      { source: 'Gut microbes and metabolites as modulators of blood-brain barrier integrity and brain health, PMC7053956', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7053956/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['ibs-gut-serotonin-mechanism', 'mentalhealth-overview', 'gut-scfa-treg'],
  },
  {
    id: 'mentalhealth-glycemic-instability-mood',
    category: 'basicHealth',
    title: 'Blood Sugar Swings Drive Mood Symptoms in the Short Term, and Insulin Resistance Shapes Depression Risk in the Long Term',
    teaser: 'A sharp glucose spike followed by a crash triggers a measurable stress-hormone response, cortisol and adrenaline, that shows up as irritability, anxiety, and brain fog, on a timescale of hours, not weeks.',
    summary:
      "Refined carbohydrates and free sugars, stripped of the fiber and protein that would normally slow digestion, produce a fast, pronounced rise in blood glucose. The body's insulin response to that spike can overshoot, driving glucose back down quickly enough to trigger a counter-regulatory stress response: the release of cortisol and adrenaline to push stored glucose back into circulation. That hormone response, not the low blood sugar number alone, is what produces the acute irritability, anxiety, and difficulty concentrating people commonly describe after a sugar crash. Separately from this hour-to-hour pattern, a growing body of research finds insulin resistance itself, the same underlying problem driving Type 2 Diabetes, PCOS, and MASLD, functions as a shared biological mechanism with depression rather than just a statistical companion to it: defective brain insulin signaling affects the reward system, neurogenesis, and the hypothalamic-pituitary-adrenal stress axis, and inflammatory signaling (TNF-alpha) has been shown to directly promote both impaired insulin signaling and depressive-like behavior in the same pathway. This category's own Type 2 Diabetes and PCOS entries build on this specific mechanism further.",
    citations: [
      { source: 'Insulin Resistance as a Shared Pathogenic Mechanism Between Depression and Type 2 Diabetes, PMC6382695', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6382695/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['mentalhealth-overview', 'type2-insulin-resistance-depression-mechanism', 'pcos-insulin-resistance-depression-mechanism'],
  },
  {
    id: 'mentalhealth-vitamin-d-mixed-evidence',
    category: 'basicHealth',
    title: 'Vitamin D and Depression: A Documented Biological Rationale, and an Evidence Base Still Mixed',
    teaser: 'Vitamin D receptors sit throughout the brain and vitamin D helps activate serotonin synthesis, but supplementation trials for depression have swung between finding no benefit and finding a modest one.',
    summary:
      "Vitamin D receptors are distributed across brain regions involved in mood regulation, and vitamin D transcriptionally activates the enzyme tryptophan hydroxylase-2, a step in the brain's own serotonin synthesis pathway, giving low vitamin D a plausible mechanism for affecting mood. Low vitamin D status correlates with more depressive symptoms in observational research. Trial evidence for whether supplementing vitamin D actually improves depression has moved less consistently: a 2014 meta-analysis found no significant benefit, largely because most included trials enrolled people who were not vitamin D deficient to begin with, while newer, larger analyses, including a 2024 dose-response meta-analysis of 31 trials and over 24,000 people, find a measurable reduction in depressive symptoms, most consistently at shorter follow-up windows. This sits alongside this category's own existing, more conservative vitamin D entries (the 2024 Endocrine Society guideline against routine population-wide testing and supplementation, and the VITAL trial's own null result for cancer and cardiovascular prevention), evidence for a depression-specific benefit doesn't override that broader conservative stance for otherwise healthy adults, it's a distinct, still-developing question rather than a settled one.",
    citations: [
      { source: 'The effect of vitamin D supplementation on depression: a systematic review and dose-response meta-analysis of randomized controlled trials, Psychological Medicine 2024, PMC11650176', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11650176/' },
      { source: 'Vitamin D supplementation to reduce depression in adults: meta-analysis of randomized controlled trials, PMID 25701329', url: 'https://pubmed.ncbi.nlm.nih.gov/25701329/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['vitamind-overview', 'vitamind-2024-guideline-honest-correction', 'vitamind-vital-trial-non-skeletal', 'mentalhealth-overview'],
  },
  {
    id: 'mentalhealth-magnesium-zinc-mood',
    category: 'basicHealth',
    title: 'Low Magnesium and Zinc Levels Are Both Measurably Linked to Depression',
    teaser: 'A meta-analysis of over 450 depressed patients found zinc supplementation reduced depressive symptoms, and depressed people average about 14% less blood zinc than the general population.',
    summary:
      "Both minerals have a documented, if modest, evidence base specific to mood, distinct from either one's own broader deficiency-symptom profile already covered in this app's essential-nutrients research. For zinc, a 2013 meta-analysis of 17 studies found depressed people carried roughly 14% less blood zinc on average than people without depression, with the gap widening in more severe depression, and a separate meta-analysis of randomized trials totaling over 450 depressed patients found adding zinc to standard antidepressant treatment (imipramine) produced a measurable reduction in depressive symptoms. For magnesium, a systematic review and meta-analysis of seven clinical trials (325 people) found magnesium supplementation produced a significant decline in depression scores, though the underlying relationship is more tangled than a simple deficiency story, dietary magnesium intake correlates with depression prevalence but not with new-onset depression in longitudinal data, and magnesium acts as a cofactor in over 350 enzymes, many involved in the same neurotransmitter-balancing processes already covered elsewhere in this topic. Neither mineral is framed here as a standalone depression treatment, both function as one modifiable factor among several, most useful for someone whose levels are actually low to begin with.",
    citations: [
      { source: 'Zinc, Magnesium, Selenium and Depression: A Review of the Evidence, Potential Mechanisms and Implications, Nutrients 2018', url: 'https://www.mdpi.com/2072-6643/10/5/584' },
      { source: 'Magnesium and mood disorders: systematic review and meta-analysis, BJPsych Open', url: 'https://www.cambridge.org/core/journals/bjpsych-open/article/magnesium-and-mood-disorders-systematic-review-and-metaanalysis/9257DB9E4EAC7F0A5C5B84E63B4D3AEF' },
    ],
    overallTier: 'moderate',
    relatedIds: ['zinc-overview', 'magnesium-overview', 'mentalhealth-overview'],
  },
];
