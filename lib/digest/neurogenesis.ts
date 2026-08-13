import type { DigestEntry } from './types';

// Neurogenesis (the brain's own ability to grow new neurons throughout
// adulthood, not just in childhood) -- a new, real, general Basic Health
// topic, added 2026-08-13, direct request: "Neurogenesis needs to be
// represented in the Basic Health section." Every citation independently
// verified via WebSearch/WebFetch, the same discipline as the rest of
// this Digest.
//
// Deliberately scoped to real, human-relevant, well-documented ground
// rather than an exhaustive neuroscience textbook: the actual discovery
// history (including a real, still-live scientific controversy, reported
// honestly rather than glossed over), the real mechanism (BDNF) and the
// one lever with the strongest human evidence (exercise), diet and
// chronic-stress effects, sleep's own real, duration-dependent role
// (cross-linked to the existing Sleep & Health topic), and the real
// "neurogenic hypothesis of depression" connecting this whole topic
// directly to the existing Mental Health & Food topic.
//
// This app's own core mission -- helping someone with an autoimmune
// condition understand personal, food-and-lifestyle-driven patterns --
// is exactly why this belongs in Basic Health specifically: neurogenesis
// is universal human physiology, not owned by any one of the 19 tracked
// conditions. Where a REAL, specific, well-documented condition-level
// connection exists, it lives as its own entry in that condition's own
// file instead (see the direct follow-up half of the same request:
// "if it is something important to one of the 19 conditions, they
// deserve an entry about it too") -- Hashimoto's (organSystems.ts),
// Type 2 Diabetes (type2Diabetes.ts), Cardiovascular Disease
// (cardiovascularDisease.ts), Multiple Sclerosis (multipleSclerosis.ts),
// and Inflammatory Bowel Disease (ibd.ts) all got one, each independently
// verified and cross-linked back here. Checked honestly and deliberately
// NOT forced onto the other 14 conditions -- several plausible-sounding
// candidates (migraine's own "neurogenic inflammation," for instance)
// turned out on inspection to be a genuinely different biological concept
// (nerve-triggered inflammation, not the generation of new neurons), and
// conflating the two would have been a real, serious factual error, not
// a shortcut worth taking.
export const NEUROGENESIS_ENTRIES: DigestEntry[] = [
  {
    id: 'neurogenesis-discovery-fundamentals',
    category: 'basicHealth',
    title: 'The Adult Brain Genuinely Grows New Neurons, a Real, Once-Overturned Textbook Fact',
    teaser: 'For most of the 20th century, textbooks taught that people are born with all the neurons they will ever have. Direct, real evidence from human brain tissue overturned that, and the actual growth site is a specific, small region, not the whole brain.',
    summary:
      "For most of the 20th century, neuroscience held a firm, foundational rule: neurons in the adult brain don't divide or regenerate, whatever a person is born with is what they keep. Direct evidence overturned this specifically for one region. A landmark 1998 study examined postmortem brain tissue from cancer patients who had received injections of a chemical marker (BrdU) that labels newly dividing cells, and found genuinely new neurons being born in the hippocampus, the brain region central to memory and learning, well into adulthood. A second landmark study in 2013 used an even more precise method: since cells absorb a radioactive carbon isotope from the atmosphere at the exact concentration present the moment their DNA is created, researchers could directly date when each neuron in donated brain tissue was actually born. That study estimated roughly 700 new neurons are added to the adult human hippocampus every single day, a real, substantial, ongoing process, not a rare or vestigial one. This growth is concentrated specifically in a small structure called the dentate gyrus, part of the hippocampus, not spread evenly across the whole brain, worth knowing directly since \"neurogenesis\" doesn't mean the entire adult brain is constantly regenerating new tissue.",
    citations: [
      { source: 'Neurogenesis in the adult human hippocampus, Nature Medicine, Eriksson et al. 1998', url: 'https://www.nature.com/articles/nm1198_1313' },
      { source: 'Dynamics of hippocampal neurogenesis in adult humans, Cell, Spalding et al. 2013, PMC4394608', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4394608/' },
    ],
    overallTier: 'strong',
    relatedIds: ['neurogenesis-2018-controversy', 'neurogenesis-bdnf-exercise'],
  },
  {
    id: 'neurogenesis-2018-controversy',
    category: 'basicHealth',
    title: "A Real, Still-Live Scientific Fight: Does This Actually Keep Happening Into Old Age?",
    teaser: 'A 2018 study from a respected lab found no detectable new neurons past childhood, directly contradicting the discovery research. Multiple later studies, using similar methods, found the opposite. This is a genuine, unresolved disagreement, not settled either way.',
    summary:
      "The prior entry's own discovery history isn't the end of the story, and being honest about that matters more than pretending the science is fully settled. A 2018 study, from a well-respected neuroanatomy lab, examined human brain tissue using careful, well-established staining methods and reported that new-neuron production drops sharply during childhood and becomes undetectable by adulthood, directly contradicting the earlier discovery research. This set off a real, still-unresolved scientific disagreement: within the same year, a separate study using broadly similar methods found neurogenesis persisting into old age, and multiple further studies since (including work specifically looking at brain tissue from people with Alzheimer's disease) have converged on finding evidence that adult neurogenesis does persist, though usually at a genuinely lower rate than in a young adult. The most likely, current explanation for why two careful research teams reached opposite conclusions involves real, practical difficulties: how quickly after death the tissue was preserved, which specific chemical markers were used to identify a \"new\" neuron, and genuine biological differences between the specific brain samples studied. Worth stating plainly rather than picked around: this remains a genuine, live scientific disagreement as of the most recent reviews on the topic, not a settled fact quietly resolved in one direction, and any confident, simple claim either way (\"proven\" or \"disproven\") is overstating where the actual evidence currently sits.",
    citations: [
      { source: 'Human hippocampal neurogenesis drops sharply in children to undetectable levels in adults, Nature, Sorrells et al. 2018', url: 'https://www.nature.com/articles/nature25975' },
      { source: 'Human Adult Neurogenesis: Evidence and Remaining Questions, Cell Stem Cell', url: 'https://www.sciencedirect.com/science/article/pii/S1934590918301668' },
    ],
    overallTier: 'moderate',
    relatedIds: ['neurogenesis-discovery-fundamentals'],
  },
  {
    id: 'neurogenesis-bdnf-exercise',
    category: 'basicHealth',
    title: "BDNF Is the Real Molecular Signal Behind This, and Exercise Is Its Best-Evidenced Trigger",
    teaser: "Brain-derived neurotrophic factor helps new neurons survive and mature, and aerobic exercise reliably raises it, with a real, non-invasive brain-scan method now showing the same pattern directly in humans.",
    summary:
      "Brain-derived neurotrophic factor (BDNF), a protein in the neurotrophin family, is the real molecular signal most directly tied to this whole process: it supports the proliferation of the progenitor cells that become new neurons and, more specifically, helps those new neurons actually survive and mature rather than dying off shortly after being born. Aerobic exercise is the single lever with the strongest, most consistently repeated evidence for raising BDNF and, downstream of that, supporting neurogenesis, demonstrated repeatedly across a wide age range, from young adults through older age. Directly studying this in living humans is genuinely difficult, since the actual hippocampal tissue can't be sampled from a living person the way animal research can, but a real, indirect, non-invasive method has helped close part of that gap: 12 weeks of exercise produced a measurable increase in dentate gyrus blood volume in both mice and humans, and in the mouse studies, that same blood-volume increase was directly shown to correlate with actual, confirmed new-neuron growth, giving real, if indirect, support that the same exercise-driven pattern measured in human brains reflects a genuinely similar underlying process.",
    citations: [
      { source: 'Physical exercise: bulking up neurogenesis in human adults, PMC6724373', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6724373/' },
      { source: 'Exercise-Mediated Neurogenesis in the Hippocampus via BDNF, PMC5808288', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5808288/' },
    ],
    overallTier: 'strong',
    relatedIds: ['neurogenesis-discovery-fundamentals', 'neurogenesis-stress-cortisol-diet'],
  },
  {
    id: 'neurogenesis-stress-cortisol-diet',
    category: 'basicHealth',
    title: 'Chronic Stress Genuinely Suppresses This Process, and a Real Human Cell Study Found Omega-3s Protect Against It',
    teaser: 'Cortisol, the body\'s own stress hormone, measurably reduces new-neuron production and increases cell death in a real study using actual human hippocampal cells, and EPA specifically prevented most of that damage.',
    summary:
      "Chronic stress operates on this system through a specific, real, hormonal pathway: sustained elevation of cortisol, the body's own primary stress hormone, directly suppresses the proliferation of new neural progenitor cells and increases their rate of programmed cell death, a real, biological mechanism behind why chronic stress is linked to hippocampal shrinkage over time. A real, direct study using an actual human hippocampal progenitor cell line (grown in a lab, not from living human brain tissue directly, an honest limitation the study's own authors state) measured this precisely: cortisol alone caused a 25 percent drop in cell proliferation and a 33 percent rise in a marker of cell death during one growth phase, and even larger effects during a later stage. The genuinely useful, protective finding: pre-treating the same cells with EPA, one of the two main omega-3 fatty acids, largely prevented this damage, restoring proliferation from a 25 percent drop to roughly normal levels. Diets higher in flavonoids, polyphenols, and omega-3s more broadly are documented, across a range of studies, to support new-neuron proliferation and survival, while diets high in saturated fat and added sugar are documented to work against it, a real, food-first, non-supplement lever worth knowing directly.",
    citations: [
      { source: 'The role of omega-3 fatty acids in preventing glucocorticoid-induced reduction in human hippocampal neurogenesis and increase in apoptosis, Translational Psychiatry, Borsini et al. 2020, PMC7341841', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7341841/' },
      { source: 'The Role of Dietary Polyphenols on Adult Hippocampal Neurogenesis, PMC3395274', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3395274/' },
    ],
    overallTier: 'strong',
    relatedIds: ['neurogenesis-bdnf-exercise', 'neurogenesis-depression-antidepressants', 'lifestyle-chronic-stress-hpa'],
  },
  {
    id: 'neurogenesis-sleep',
    category: 'basicHealth',
    title: "Sleep's Own Effect Is Real, But It Depends Directly on How Long the Deprivation Actually Lasts",
    teaser: 'Two weeks of sleep deprivation measurably suppresses new-neuron growth through a mechanism separate from stress hormones, while a single short night, in some studies, has shown the opposite effect.',
    summary:
      "Sleep's own connection to this process is real, but genuinely duration-dependent rather than a flat \"lose sleep, lose neurons\" rule, the same practical, already-established Sleep & Health research this entry connects directly to. Prolonged sleep deprivation, roughly two weeks in the animal research this comes from, measurably suppresses new-cell proliferation in the hippocampus, reduces the density of dendritic connections on surviving new neurons, and impairs memory performance. A real, specific, and somewhat surprising detail: this suppression happens independent of cortisol and other adrenal stress hormones, meaning it isn't simply explained away as \"sleep deprivation is stressful, and stress suppresses neurogenesis\" (already covered directly in its own entry), it appears to be a more direct effect of sleep loss itself, working through a separate signaling pathway inside brain cells. The honest, duration-dependent complication worth stating directly: shorter deprivation shows a genuinely different, sometimes opposite pattern in some studies, a single night or roughly 12 hours of sleep loss has, in some research, actually shown a temporary INCREASE in new-cell proliferation, while it's the sustained, chronic version of sleep loss that reliably shows the harmful, suppressive effect already established as this app's own broader message about sleep.",
    citations: [
      { source: 'Sleep deprivation can inhibit adult hippocampal neurogenesis independent of adrenal stress hormones, American Journal of Physiology', url: 'https://journals.physiology.org/doi/full/10.1152/ajpregu.00858.2007' },
      { source: 'Sleep deprivation and hippocampal vulnerability: changes in neuronal plasticity, neurogenesis and cognitive function, PMID 25937398', url: 'https://pubmed.ncbi.nlm.nih.gov/25937398/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['sleep-architecture', 'sleep-tying-together'],
  },
  {
    id: 'neurogenesis-depression-antidepressants',
    category: 'basicHealth',
    title: 'The "Neurogenic Hypothesis of Depression": a Real, Directly Testable Idea Antidepressants Might Work This Way',
    teaser: 'A landmark 2003 study found mice whose new-neuron growth was deliberately blocked stopped responding behaviorally to a common antidepressant, direct evidence neurogenesis itself might be required for the drug to work, not just a side effect of taking it.',
    summary:
      "One of the more directly testable ideas connecting this whole topic to everyday mental health, covered in this app's own dedicated Mental Health & Food research: the \"neurogenic hypothesis of depression\" proposes that reduced hippocampal neurogenesis contributes to depression itself, and that restoring it is part of how antidepressant medications actually work, not just a side observation. A landmark 2003 study provided real, direct, causal-style evidence for this: chronic treatment with fluoxetine (a common SSRI) reliably increased new-neuron production in mice, exactly as expected, but the more striking finding came next, when researchers used focal X-ray irradiation to specifically block hippocampal neurogenesis in a separate group of mice, fluoxetine no longer produced its usual behavioral, antidepressant-like effects in standard animal tests. This is a genuinely stronger kind of evidence than a simple correlation, it directly tested whether neurogenesis is actually REQUIRED for the drug's own effect, not just happening alongside it. Worth stating the honest limitation directly, matching this app's own standing discipline: this hypothesis remains genuinely contested, later research has found real, credible contradictory findings too, and not every case of depression or every antidepressant response follows this same pattern cleanly, an active, still-developing area of research rather than a fully settled explanation for how these medications work.",
    citations: [
      { source: 'Requirement of hippocampal neurogenesis for the behavioral effects of antidepressants, Science, Santarelli et al. 2003', url: 'https://pubmed.ncbi.nlm.nih.gov/12907793/' },
      { source: 'Depression, Antidepressants, and Neurogenesis: A Critical Reappraisal, Neuropsychopharmacology', url: 'https://www.nature.com/articles/npp2011220' },
    ],
    overallTier: 'moderate',
    relatedIds: ['neurogenesis-stress-cortisol-diet', 'mentalhealth-overview'],
  },
  {
    id: 'neurogenesis-tying-together',
    category: 'basicHealth',
    title: 'What Actually Holds Up for Neurogenesis, Pulled Together',
    teaser: 'A real, once-overturned textbook fact, a genuine ongoing scientific fight about how much of it survives into old age, and a small, real, food-first set of levers that measurably help either way.',
    summary:
      "Line up everything in this topic and a real, useful, honestly-scoped picture emerges. Adult neurogenesis is a real, directly demonstrated phenomenon, concentrated specifically in the hippocampus's own dentate gyrus, not a myth, but the exact scale of how much persists into old age remains a genuine, unresolved scientific disagreement, worth knowing rather than glossed over as settled either way. BDNF is the real molecular thread connecting nearly everything else in this topic together: exercise raises it and supports new-neuron survival with the strongest, most repeated human evidence of any single lever covered here; chronic stress and elevated cortisol work directly against it, with real, human-cell-level evidence that omega-3 fatty acids specifically protect against that damage; sleep's own effect depends genuinely on duration, chronic sleep loss suppresses it through a pathway separate from stress hormones entirely, while brief sleep loss shows a more mixed picture. The neurogenic hypothesis of depression ties this whole topic directly into everyday mental health, real, causal-style evidence suggests neurogenesis itself may be required for at least some antidepressant medications to work, though this remains a genuinely contested, active research question rather than settled fact. Where this topic connects to a specific, real, well-documented health condition rather than universal physiology, that connection lives in its own dedicated entry in that condition's own category instead, Hashimoto's, Type 2 Diabetes, Cardiovascular Disease, Multiple Sclerosis, and Inflammatory Bowel Disease each genuinely earned one; most of the other tracked conditions did not, and this topic deliberately doesn't force a connection where the real evidence doesn't support one.",
    citations: [],
    overallTier: 'strong',
    relatedIds: [
      'neurogenesis-discovery-fundamentals',
      'neurogenesis-2018-controversy',
      'neurogenesis-bdnf-exercise',
      'neurogenesis-stress-cortisol-diet',
      'neurogenesis-sleep',
      'neurogenesis-depression-antidepressants',
      'organ-brain-neurogenesis-thyroid-mechanism',
      'type2-hippocampal-neurogenesis-insulin-resistance',
      'cvd-myocardial-ischemia-neurogenesis-impairment',
      'ms-hippocampal-neurogenesis-demyelination-distinct-remyelination',
      'ibd-gut-inflammation-hippocampal-neurogenesis',
    ],
  },
];
