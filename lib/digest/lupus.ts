import type { DigestEntry } from './types';

// Lupus (Systemic Lupus Erythematosus / SLE) -- 11 entries, added
// 2026-08-08 as this app's ninth real condition, next in the same
// priority order every condition before it followed. Built with real
// self-advocacy content included from the start, the same lesson already
// applied to every condition since Graves'.
//
// Lupus is a real, systemic autoimmune disease that can affect nearly any
// organ system (skin, joints, kidneys, blood cells, the nervous system),
// which gives this category a genuinely wide-ranging shape -- a real,
// classic food trigger (alfalfa sprouts), a real photosensitivity/vitamin
// D catch-22 unique to this disease, and self-advocacy entries spanning
// eye, kidney, and medication safety, rather than one dominant theme the
// way MS's viral trigger or IBD's smoking paradox each were.
//
// Distinct from two already-existing entries this category deliberately
// does NOT duplicate: otherAutoimmune.ts's own 'other-lupus' entry and
// gutMicrobiome.ts's own 'gut-blautia-lupus-zonulin' /
// 'gut-probiotic-yogurt-lupus-rct' entries, all three built as
// corroborating gut-autoimmunity evidence for a Hashimoto's reader. This
// category cross-links to all three rather than repeating their content,
// and covers everything else specific to actually living with and
// managing lupus on its own terms.
//
// Every citation here was independently verified via WebSearch before
// being written in.
export const LUPUS_ENTRIES: DigestEntry[] = [
  {
    id: 'lupus-overview',
    category: 'lupus',
    title: 'Systemic Lupus Erythematosus: An Autoimmune Disease That Can Reach Almost Any Organ',
    teaser: "Not a single-organ disease -- lupus can genuinely affect the skin, joints, kidneys, blood, and nervous system all at once, unlike more localized autoimmune conditions.",
    summary:
      "Systemic lupus erythematosus (SLE, usually just called lupus) is an autoimmune disease in which the immune system attacks the body's own healthy tissue across multiple organ systems at once -- skin (the classic butterfly-shaped facial rash), joints, kidneys, blood cells, and, in more serious cases, the heart, lungs, or nervous system. This genuinely wide reach is what gives lupus its own reputation as a difficult, sometimes years-long diagnostic process, since early symptoms (fatigue, joint pain, unexplained fever) overlap with many other conditions. Lupus overwhelmingly affects women, especially women of childbearing age, and disproportionately affects Black, Hispanic, and Asian women compared to white women. This category covers what's specific to actually living with and managing lupus on its own terms -- a genuinely wide-ranging shape, reflecting how many different organ systems the disease itself can touch, rather than one dominant theme.",
    citations: [
      { source: 'Lupus, MedlinePlus, U.S. National Library of Medicine', url: 'https://medlineplus.gov/lupus.html' },
    ],
    overallTier: 'strong',
    relatedIds: ['other-lupus', 'gut-blautia-lupus-zonulin', 'gut-probiotic-yogurt-lupus-rct'],
  },
  {
    id: 'lupus-alfalfa-canavanine',
    category: 'lupus',
    title: 'Alfalfa Sprouts: A Real, Well-Documented Food That Can Trigger a Lupus-Like Flare',
    teaser: 'A specific amino acid in a common health-food-store sprout can fool the body into building faulty proteins, and the immune system notices.',
    summary:
      "Alfalfa sprouts and alfalfa seeds contain L-canavanine, a real, naturally occurring compound structurally similar to the amino acid arginine, closely enough that the body's own protein-building machinery can mistakenly use it in place of real arginine. The resulting proteins, containing this substituted amino acid, are recognized by the immune system as foreign, and real research in human volunteers and in cynomolgus monkeys has shown alfalfa sprout intake can induce a genuine lupus-like syndrome, complete with antinuclear antibodies, anti-dsDNA antibodies, and reduced complement levels, the same real markers this app's own self-advocacy research already covers for actual lupus monitoring. L-canavanine has real, documented effects on immune regulatory cells, reducing normal suppressor-cell function and increasing antibody production. This is real, specific, well-established enough that a major academic lupus center recommends avoiding alfalfa in the diet of anyone with lupus, one of the very few individual foods in this app's entire research base with this direct and this well-documented a connection to actually triggering disease activity, rather than just a general dietary pattern.",
    citations: [
      { source: '5 Foods and Medications to Avoid If You Have Lupus, Johns Hopkins Lupus Center', url: 'https://www.hopkinslupus.org/lupus-info/lifestyle-additional-information/avoid/' },
      { source: 'Akaogi J, et al., Autoimmunity Reviews, 2006, "Role of non-protein amino acid L-canavanine in autoimmunity"', url: 'https://www.sciencedirect.com/science/article/abs/pii/S1568997205002223' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'lupus-photosensitivity-vitamin-d-catch22',
    category: 'lupus',
    title: 'A Real Catch-22: Sun Protects Against a Flare, and Causes a Real Deficiency',
    teaser: 'The one thing that makes vitamin D naturally is the one thing many lupus patients genuinely need to avoid.',
    summary:
      "Photosensitivity, real, disproportionate skin and disease sensitivity to ultraviolet light, is one of lupus's own defining features. Real UV exposure can trigger not just a skin rash but full-body flares, including fatigue, joint pain, and headaches, in people with lupus. The real, practical complication: since UV light is also what the skin uses to naturally produce vitamin D, the same sun protection that genuinely helps prevent a flare also genuinely raises the risk of vitamin D deficiency, and this effect is compounded further by some of the medications used to treat lupus. This is a real, well-documented catch-22, not an exaggerated concern, and the practical resolution recommended by real lupus-specific patient guidance is consistent: prioritize sun protection to manage disease activity, and address the resulting vitamin D gap through diet and supplementation instead of sun exposure, rather than treating the two goals as something that has to be balanced against each other.",
    citations: [
      { source: 'Vitamin D Status a Common Health Concern for People with Lupus, Though Not Linked to Disease Activity, Lupus Foundation of America', url: 'https://www.lupus.org/news/vitamin-d-status-a-common-health-concern-for-people-with-lupus-though-not-linked-to-disease' },
    ],
    overallTier: 'strong',
    relatedIds: ['lupus-vitamin-d-supplementation-mixed'],
  },
  {
    id: 'lupus-vitamin-d-supplementation-mixed',
    category: 'lupus',
    title: 'Vitamin D Supplementation in Lupus: A Real, Genuinely Inconsistent Trial Record',
    teaser: "Knowing lupus patients are commonly deficient is one question. Whether correcting that deficiency actually calms the disease is a real, separate, and less settled question.",
    summary:
      "Given how common vitamin D deficiency genuinely is in lupus (see the real photosensitivity catch-22 covered elsewhere in this category), a real, separate question follows: does correcting that deficiency actually reduce disease activity? The real trial record is genuinely mixed, not a clean yes. One trial giving high, tiered doses (4,000 or 8,000 IU daily for six months) found real, significant improvement in complement levels and fatigue, but only a small, not statistically significant reduction in overall disease activity scores. A separate randomized trial in juvenile-onset lupus (50,000 IU weekly for 24 weeks) did find a real, statistically significant reduction in disease activity. Yet another randomized, placebo-controlled trial in vitamin-D-deficient adult lupus patients found no significant difference in disease activity scores at all after supplementation. Taken together, this is a real, honest, unresolved question, not the same as saying vitamin D doesn't matter for lupus at all (deficiency itself carries its own real, separate health risks) but genuinely different from claiming supplementation is a proven way to calm the disease itself.",
    citations: [
      { source: 'Effects of Vitamin D Supplementation on Fatigue and Disease Activity in Systemic Lupus Erythematosus, PMID 40084313', url: 'https://pubmed.ncbi.nlm.nih.gov/40084313/' },
      { source: 'The effect of Vitamin D supplementation in disease activity of systemic lupus erythematosus patients with Vitamin D deficiency: A randomized clinical trial, PMID 28400826', url: 'https://pubmed.ncbi.nlm.nih.gov/28400826/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'lupus-omega3-fish-oil',
    category: 'lupus',
    title: 'Omega-3 and Lupus: A Real Meta-Analysis Finding Benefit, and a Genuinely Different Kind of Study Finding a Real Complication',
    teaser: 'Small trials suggest fish oil calms lupus activity. A completely different research method, tracing genetic cause and effect, found the opposite direction.',
    summary:
      "A real meta-analysis pooling five randomized controlled trials (274 SLE patients total) found omega-3 fatty acid supplementation associated with a real, statistically significant reduction in disease activity, equivalent to about a 0.9-point drop on the standard SLEDAI disease-activity scale, alongside real, individual trial findings of improved fatigue, quality of life, and endothelial function. The meta-analysis's own authors rate the certainty of this evidence as low, since the individual trials were small and varied in quality, a real, honest limitation worth stating rather than smoothing over. A genuinely different, separate line of research complicates the picture further: a Mendelian randomization study, using genetic variants as a real, different tool for testing cause and effect rather than a supplementation trial, found genetically predicted higher circulating omega-3 levels causally associated with an increased risk of developing lupus in the first place. These are two real, different questions, whether omega-3 helps someone who already has lupus (the trial evidence, cautiously positive) versus whether higher lifetime omega-3 levels affect the risk of developing lupus at all (the genetic evidence, pointing the other way), and both deserve stating honestly rather than picking the more flattering one.",
    citations: [
      { source: 'Effect of omega-3 fatty acids on systemic lupus erythematosus disease activity: A systematic review and meta-analysis, Autoimmunity Reviews, 2020', url: 'https://www.sciencedirect.com/science/article/abs/pii/S1568997220302652' },
      { source: 'Genetically Predicted Circulating Omega-3 Fatty Acids Levels Are Causally Associated With Increased Risk for Systemic Lupus Erythematosus', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8864316/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['omega36-tying-together'],
  },
  {
    id: 'lupus-immune-stimulating-herbs',
    category: 'lupus',
    title: 'Echinacea, and a Real, Broader List of "Immune-Boosting" Herbs Worth Real Caution',
    teaser: 'Marketed as immune support for a cold. For an already-overactive immune system, the same real mechanism can work against you.',
    summary:
      "A real, general principle worth stating plainly for lupus specifically: boosting an immune system that's already overactive is counterproductive, not neutral. Echinacea is the most commonly named real example, a real academic lupus center specifically advises against it because of its own documented immune-stimulating effect, with real concern that this could trigger or worsen a flare. A broader, more recent real study identified 15 herbal supplements with robust evidence for immune-stimulating effects, alfalfa (see this category's own separate entry), ashwagandha, astragalus, echinacea, garlic, ginseng, and spirulina among them, associated with real, documented mechanisms including increased cytokine production and immune-pathway activation. Garlic specifically carries genuinely mixed real advice: some sources list it as a caution for the same immune-stimulating reason, but no direct evidence was found that garlic in ordinary dietary amounts (rather than concentrated supplement form) causes real problems, an honest distinction worth keeping rather than treating every herb on this list identically. The real, general, practical takeaway: a supplement marketed as \"immune support\" is worth a real, direct conversation with a rheumatologist before starting, specifically because of lupus, not despite it.",
    citations: [
      { source: 'New study identifies 15 herbal supplements to potential skin flare activity in people with autoimmune skin diseases, Lupus Foundation of America', url: 'https://www.lupus.org/news/new-study-identifies-15-herbal-supplements-to-potential-skin-flare-activity-in-people-with' },
      { source: '5 Foods and Medications to Avoid If You Have Lupus, Johns Hopkins Lupus Center', url: 'https://www.hopkinslupus.org/lupus-info/lifestyle-additional-information/avoid/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'lupus-cardiovascular-risk',
    category: 'lupus',
    title: 'A Real, Striking Cardiovascular Risk That Traditional Risk Factors Alone Don\'t Explain',
    teaser: 'A young woman with lupus can carry a real heart-attack risk dozens of times higher than someone the same age without it.',
    summary:
      "Cardiovascular disease is a real, leading cause of death in lupus, and the real scale of the risk is genuinely striking: women with lupus aged 35 to 44 have an estimated 50-fold increased risk of heart attack compared to age- and sex-matched women without lupus, and real imaging studies find carotid artery plaque in 37% of lupus patients versus 15% of matched controls. What makes this a real, distinct finding rather than just \"lupus patients also get heart disease\": real research finds ordinary, traditional cardiovascular risk factors (cholesterol, blood pressure, smoking) don't fully explain this scale of excess risk on their own. The real, driving factors are believed to be chronic inflammation and cumulative disease activity itself, along with real, disease-specific complications like antiphospholipid antibodies, which independently raise clotting risk. This is a real, direct reason cardiovascular risk deserves its own, dedicated attention in lupus specifically, not just the standard general-population advice, and a real, concrete argument for taking disease-activity control itself seriously as a cardiovascular protective measure, not only a symptom-management one.",
    citations: [
      { source: 'Cardiovascular Complications in Systemic Lupus Erythematosus', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9358056/' },
    ],
    overallTier: 'strong',
    relatedIds: ['cvd-overview', 'cvd-lipid-panel-self-advocacy'],
  },
  {
    id: 'lupus-hydroxychloroquine-retinopathy',
    category: 'lupus',
    title: 'Hydroxychloroquine: A Real Eye Exam Schedule for the Field\'s Own Preferred Lupus Medication',
    teaser: 'The single most commonly used lupus medication carries a rare but real, irreversible eye risk, tracked with a real, specific screening schedule.',
    summary:
      "Hydroxychloroquine is the real, preferred first-line medication for lupus, but it carries a rare, real risk of retinopathy, damage to the retina that is not treatable and can continue progressing even after the medication is stopped, which is exactly why real, updated screening guidelines exist. Current recommendations call for a real baseline eye exam within a few months of starting the medication (mainly to rule out any pre-existing retinal condition that could complicate later screening), then a real gap before screening resumes: routine screening can be deferred for the first 5 years of treatment for someone at otherwise-average risk, then should happen annually after that, using real, specific imaging tests (optical coherence tomography and automated visual field testing) rather than a standard eye exam alone. The real, quantified risk itself is genuinely low but not zero: under 2% after 10 years of use, rising to as much as 8.6% after 15 years. A real, separate and unrelated caution worth knowing alongside this: grapefruit and grapefruit juice can meaningfully raise hydroxychloroquine blood levels and should generally be avoided during treatment. Worth asking directly whether this real screening schedule is being followed, rather than assuming it happens automatically as part of routine care.",
    citations: [
      { source: 'Special AAO Report: Recommendations on Screening for Hydroxychloroquine Retinopathy (2025 Revision), Ophthalmology', url: 'https://www.aaojournal.org/article/S0161-6420(25)00709-2/fulltext' },
      { source: 'Hydroxychloroquine and Alcohol/Food Interactions, Drugs.com', url: 'https://www.drugs.com/food-interactions/hydroxychloroquine.html' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'lupus-nephritis-monitoring',
    category: 'lupus',
    title: 'Lupus Nephritis: A Real, Specific Lab Panel That Catches Kidney Involvement Before It Becomes Obvious',
    teaser: 'Kidney damage from lupus can develop quietly. A real, standard panel of labs is how it actually gets caught early.',
    summary:
      "Lupus nephritis, kidney inflammation caused by lupus itself, is a real, common, and serious complication, and real clinical guidelines (KDIGO) recommend a specific, standard panel to catch it, both at diagnosis and on an ongoing basis: creatinine and eGFR (real, standard kidney-function markers), a urinalysis and a spot urine protein-to-creatinine ratio (checking for protein leaking into urine, a real, early sign of kidney damage), and anti-dsDNA antibody and complement levels (C3 and C4). Real, specific numbers worth knowing: complement levels below about 60 for C3 or 15 for C4 are commonly seen in active disease, particularly when the kidneys are involved. A real, honest limitation worth stating plainly: neither anti-dsDNA nor complement levels are perfectly reliable on their own, elevated anti-dsDNA doesn't always mean nephritis is present, and complement fluctuations don't always reliably predict a coming flare, which is exactly why the real, combined panel above, not any single test in isolation, is what actual clinical monitoring relies on. Worth asking directly whether this full panel, not just a subset of it, is part of a regular monitoring schedule.",
    citations: [
      { source: 'Advances in Lupus Nephritis Screening and Treatment, European Society of Medicine', url: 'https://esmed.org/advances-in-lupus-nephritis-screening-and-treatment/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'lupus-belimumab-biologic',
    category: 'lupus',
    title: 'Belimumab: A Real, Genuinely Long-Awaited First Lupus-Specific Biologic',
    teaser: 'No new medication had been approved specifically for lupus in over 50 years. This one was, and it works on a real, specific immune pathway.',
    summary:
      "Belimumab was the first medication approved specifically for lupus in more than 50 years, a real, genuinely notable gap in this disease's own treatment history, first approved in 2011 and later extended to lupus nephritis specifically, including for children. Its real, specific mechanism: belimumab is a monoclonal antibody that binds to and neutralizes BLyS (B-lymphocyte stimulator), a real signaling protein found at elevated levels in lupus, which normally helps keep antibody-producing B cells, including the misdirected ones driving lupus itself, alive. By blocking this survival signal, belimumab reduces the survival of these B cells and their differentiation into antibody-producing cells, without binding to B cells directly itself. This is worth knowing as a real, genuine treatment option beyond the more familiar older medications (hydroxychloroquine, steroids, broader immunosuppressants) covered elsewhere in this app's own research, and a real, concrete example of lupus-specific drug development finally catching up after a real, decades-long gap.",
    citations: [
      { source: 'The discovery and development of belimumab: the anti-BLyS-lupus connection, PMID 22231104', url: 'https://pubmed.ncbi.nlm.nih.gov/22231104/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'lupus-tying-together',
    category: 'lupus',
    title: 'What Actually Holds Up for Lupus, Pulled Together',
    teaser: 'One of the most specific, well-documented individual food triggers in this whole app, a real catch-22 no other condition here shares, and self-advocacy spanning three entirely different organ systems.',
    summary:
      "Line up everything in this category and lupus reads as a condition defined by its own wide reach across the body, more than by any single dominant mechanism. Alfalfa sprouts stand out as one of the most specific, well-documented individual food triggers anywhere in this app's research, a real, named compound with a real, understood mechanism for why it provokes disease activity. The photosensitivity/vitamin D catch-22 is genuinely unique to lupus among every condition built out so far, sun protection and vitamin D adequacy pulling in opposite directions, with real, mixed trial evidence on whether correcting the resulting deficiency actually calms the disease itself. Omega-3 supplementation shows the same honest complexity this app holds every finding to: real trial evidence leaning positive, and a genuinely different kind of study (genetic, not a trial) pointing the other way on lupus risk itself. And the self-advocacy entries reach across three real, distinct organ systems, eyes (hydroxychloroquine retinopathy), kidneys (lupus nephritis's own real lab panel), and the immune system directly (belimumab), matching how lupus itself doesn't confine its damage to one place.",
    citations: [
      { source: 'Lupus, MedlinePlus, U.S. National Library of Medicine', url: 'https://medlineplus.gov/lupus.html' },
    ],
    overallTier: 'strong',
    relatedIds: ['lupus-alfalfa-canavanine', 'lupus-photosensitivity-vitamin-d-catch22', 'lupus-omega3-fish-oil', 'lupus-hydroxychloroquine-retinopathy', 'lupus-nephritis-monitoring'],
  },

  // -- Full-depth parity additions, 2026-08-08. Every citation
  // independently verified via WebSearch.
  {
    id: 'lupus-sledai-disease-activity',
    category: 'lupus',
    title: 'Lupus Has a Real, Formal Scoring System That Defines Exactly What "Flare" and "Remission" Actually Mean',
    teaser: 'SLEDAI turns "feeling worse" into a real, specific number -- and a rise of 4 or more points from the last visit is the real, formal definition of a flare.',
    summary:
      "Lupus disease activity is measured with SLEDAI (or its updated version, SLEDAI-2K), a real, formal scoring instrument. Real severity bands: mild disease scores 6 or below, moderate is 7-12, severe is above 12. Real, complete remission means a score of exactly 0 with no glucocorticoid or immunosuppressive medication in use at all; low disease activity allows a score of 3 or below while on hydroxychloroquine, or 4 or below on a low prednisone dose plus a well-tolerated immunosuppressant. A real, formal flare is defined as the score rising by 4 or more points from the previous visit, not just a subjective sense of feeling worse. This real, specific vocabulary matters directly: it's what a rheumatologist is actually tracking visit to visit, and knowing the real numbers behind \"flare\" and \"remission\" makes it possible to ask a more precise, useful question about where things currently stand.",
    citations: [
      { source: 'Systemic Lupus Erythematosus: Diagnosis and Treatment, American Family Physician', url: 'https://www.aafp.org/afp/2023/0400/systemic-lupus-erythematosus' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'lupus-skin-blood-neuro-real-data',
    category: 'lupus',
    title: "Lupus's Own Real Reach Beyond the Kidneys: The Skin, the Nervous System, and the Blood's Own Clotting Machinery",
    teaser: 'Real skin involvement in 70-85% of patients, real neurological effects as the second most common organ system affected, and antibodies that directly raise real clotting risk.',
    summary:
      "This app's own earlier lupus research already establishes the disease reaches well past any single organ; real data quantifies exactly how far. Skin lesions appear in a real, substantial 70-85% of lupus patients, with the classic malar (\"butterfly\") rash the single most common specific pattern in most real studies, alongside discoid, subacute, and bullous rash types. Neuropsychiatric lupus (NPSLE) is the real, second most common organ system affected after skin, ranging from real cognitive effects (memory loss, difficulty concentrating) to more severe real neurological complications. Real, specific antibodies (antiphospholipid antibodies, covered in more depth in this app's own pregnancy entry below) directly raise real blood-clotting risk, and lupus also commonly affects blood cell counts themselves, real, lower-than-normal red blood cells, platelets, or white blood cells, each carrying its own real, distinct clinical consequence. This is a genuinely wide, real, multi-system reach, worth knowing beyond whichever single symptom happens to be most visible at any given time.",
    citations: [
      { source: 'Prevalence and Clinical Assessment of Skin Lesions in Systemic Lupus Erythematosus, PMC11762776', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11762776/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'lupus-history-milestones',
    category: 'lupus',
    title: "Lupus's Own Real History: Named for a Rash, Understood as Systemic Only After Three Real, Sequential Discoveries",
    teaser: '1846, 1872, 1904, 1951 -- the real butterfly rash was described first; recognizing lupus as a genuinely whole-body, life-threatening disease took several more real decades.',
    summary:
      "Lupus's own real history moves in real, sequential steps, each building on the last. In 1846, Ferdinand von Hebra first described the disease's now-iconic facial rash as \"butterfly\"-shaped, and separately identified that lupus could stay dormant for real, extended periods, a genuinely early recognition of its own real, variable course. In 1850, Pierre Cazenave coined the term \"lupus erythemateux\" (the real origin of today's \"erythematosus\") and documented hair loss as a real symptom. The real, pivotal turning point came in 1872, when Moriz Kaposi published the first description of lupus as a genuinely systemic, potentially life-threatening disease, specifically noting it disproportionately affected young women, still true in real, modern epidemiology today. Osler independently confirmed this systemic nature in 1904. The real, modern treatment breakthrough came decades later, in 1951, when the antimalarial drug quinacrine was first used for discoid lupus, the real, direct precursor to hydroxychloroquine (already covered in this app's own medication research), which remains one of the single most important lupus medications in use today.",
    citations: [
      { source: 'The History of Lupus, Lupus Foundation of America', url: 'https://www.lupus.org/resources/the-history-of-lupus' },
    ],
    overallTier: 'strong',
    relatedIds: ['lupus-hydroxychloroquine-retinopathy'],
  },
  {
    id: 'lupus-pregnancy-real-flare-neonatal',
    category: 'lupus',
    title: "Lupus Pregnancy: A Real, Genuinely Reassuring Finding for Stable Disease, and a Real, Specific Antibody Risk to the Baby Worth Knowing in Advance",
    teaser: "Real research finds stable, well-controlled lupus carries a low real flare risk during pregnancy -- but two specific antibodies (anti-Ro/anti-La) carry a real, separate risk directly to the baby's own heart.",
    summary:
      "Lupus pregnancy outcomes trace closely to disease control going into it, the same real preconception-timing principle already covered in this app's own Rheumatoid Arthritis and IBD research. Real research finds that when lupus is genuinely stable before conception, pregnancy is unlikely to trigger a flare at all; even among a broader real population, severe flares requiring hospitalization or a major medication change occurred in only about 3% during the second and third trimesters. Real, separate risks still deserve direct attention: roughly 2 in 10 pregnant people with lupus develop preeclampsia, with real, higher risk specifically in those with a history of kidney involvement (already covered in this app's own nephritis-monitoring research). The real, most specific and important finding worth knowing directly, in advance: anti-Ro/SS-A and anti-La/SS-B antibodies, real, specific antibodies some lupus patients carry, can cross the placenta and cause neonatal lupus in the baby, including, in real, serious cases, a congenital heart block requiring lifelong monitoring or even a pacemaker. This is a real, direct reason antibody status (not just disease-activity score) belongs in preconception planning, since it changes the entire real monitoring plan for the pregnancy that follows.",
    citations: [
      { source: 'Low frequency of flares during pregnancy and post-partum in stable lupus patients, PMC7081564', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7081564/' },
    ],
    overallTier: 'strong',
    relatedIds: ['lupus-nephritis-monitoring', 'sjogrens-pregnancy-congenital-heart-block'],
  },
];
