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
    relatedIds: ['sjogrens-hydroxychloroquine-joquer-trial'],
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

  // -- Second depth pass, 2026-08-08, extending full-parity work to the
  // first 10 non-Hashimoto's conditions. Every citation independently
  // verified via WebSearch.
  {
    id: 'lupus-drug-induced-reversible',
    category: 'lupus',
    title: 'Drug-Induced Lupus Is a Real, Distinct, Usually Fully Reversible Condition, Not the Same Disease Under a Different Name',
    teaser: 'Certain medications, most notably hydralazine and procainamide, can trigger a lupus-like illness in a genuinely predictable, dose-dependent way that typically resolves completely once the drug is stopped.',
    summary:
      "Drug-induced lupus is a real, distinct, medication-triggered illness that mimics systemic lupus erythematosus but behaves in a genuinely different, more reassuring way, it's usually fully reversible. Real historical estimates put the risk as high as 20-30% for long-term procainamide use and 5-10% for hydralazine, with drug-induced cases accounting for a real 6-12% of all lupus diagnoses and an estimated 15,000 to 30,000 new cases a year in the United States. The real mechanism centers on how a person metabolizes these drugs: people who are genetically \"slow acetylators\" clear procainamide and hydralazine more slowly, letting the parent compound accumulate and trigger immune dysregulation, with hydralazine's own risk additionally tied to higher daily doses (above 200mg/day) and greater cumulative exposure over time. Real, documented host risk factors include being female, being a slow acetylator, and carrying specific genetic markers (HLA-DR4, complement C4 null alleles). Worth knowing directly, and genuinely reassuring: real research finds drug-induced lupus generally resolves once the triggering medication is stopped, a real, meaningful contrast to this app's own already-covered chronic, ongoing lupus management research. This is a real, practical, worth-raising question for anyone newly diagnosed with lupus-like symptoms while on a long-term medication, since identifying and stopping the actual trigger can mean the difference between a temporary illness and a lifelong one.",
    citations: [
      { source: 'Drug-Induced Lupus Erythematosus, StatPearls / NCBI Bookshelf', url: 'https://www.ncbi.nlm.nih.gov/books/NBK441889/' },
      { source: 'Drug-induced lupus erythematosus: incidence, management and prevention, PMID 21513360', url: 'https://pubmed.ncbi.nlm.nih.gov/21513360/' },
    ],
    overallTier: 'strong',
    relatedIds: ['lupus-overview'],
  },

  // -- Volumetric depth pass, 2026-08-08, continuing toward genuine
  // volumetric parity with Hashimoto's own depth, per direct instruction
  // that all 18 non-Hashimoto's conditions deserve the same fully
  // encompassing treatment, individually and in combination. Every
  // citation independently verified via WebSearch.
  {
    id: 'lupus-antiphospholipid-syndrome',
    category: 'lupus',
    title: 'Antiphospholipid Syndrome: A Real, Distinct, Clotting-Driven Condition That Often Rides Along With Lupus',
    teaser: 'Real research finds antiphospholipid antibodies present in about 15% of women with recurrent miscarriage, and this syndrome can cause real, dangerous blood clots even in young, otherwise healthy women, separate from lupus\'s own more familiar symptoms.',
    summary:
      "Antiphospholipid syndrome (APS), sometimes called Hughes syndrome, is a real, distinct autoimmune clotting disorder that can occur on its own or alongside lupus, worth knowing directly since it carries its own real, separate, and genuinely serious risks beyond the pregnancy-related content already covered in this app's own lupus research. Real research finds APS strongly associated with recurrent miscarriage, deep vein thrombosis, pulmonary embolism, and stroke, even in young, otherwise healthy women with no other apparent risk factors. Real data finds antiphospholipid antibodies present in about 15% of women experiencing recurrent miscarriage, with APS itself contributing to an estimated 7-25% of recurrent pregnancy loss cases specifically, compared to under 2% in women with a low-risk obstetric history. The real, proposed mechanism involves these antibodies directly promoting blood clot formation or impairing blood flow through the placenta. Real, formal diagnosis requires two separate positive tests, at least 12 weeks apart, for either lupus anticoagulant or anticardiolipin antibodies, a real, deliberate double-testing requirement meant to rule out a temporary, incidental antibody blip. Worth knowing directly: this is a real, concrete, worth-raising question for anyone with lupus who has experienced unexplained blood clots or recurrent pregnancy loss, since APS is real, separately treatable (typically with blood thinners), and identifying it changes real, practical management decisions beyond standard lupus care alone.",
    citations: [
      { source: 'Prevalence of antiphospholipid syndrome among women with recurrent pregnancy loss: a cohort study, PMC12097438', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12097438/' },
      { source: 'Prevalence of Antiphospholipid Antibody Syndrome Among Patients with Recurrent Pregnancy Loss, PMC11677686', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11677686/' },
    ],
    overallTier: 'strong',
    relatedIds: ['lupus-pregnancy-real-flare-neonatal', 'lupus-cardiovascular-risk'],
  },
  {
    id: 'lupus-complement-c3-c4-monitoring',
    category: 'lupus',
    title: 'Complement Proteins C3 and C4 Are Real, Useful Early-Warning Blood Markers for an Approaching Lupus Flare',
    teaser: 'Real research finds falling C3 levels can precede a real clinical flare by days to weeks, and C3 specifically appears more sensitive than C4 for tracking real, active disease, a genuine, worth-knowing addition to this app\'s own SLEDAI research.',
    summary:
      "Complement proteins C3 and C4, part of the immune system's own normal defense machinery, are real, useful, and genuinely practical blood markers for tracking lupus disease activity, worth knowing directly alongside the SLEDAI scoring system already covered in this app's own lupus research. Real research finds low C3 and C4 levels commonly seen during an active lupus flare, since the disease process itself consumes these complement proteins faster than the body can replace them. Genuinely useful in practice: real research finds falling C3 over the course of weeks can precede an actual clinical flare by days to weeks, giving a real, measurable early-warning signal before symptoms fully develop. Real research also finds C3 specifically appears more sensitive than C4 for this purpose, with C3 tending to normalize with high specificity during genuine remission, while C4 shows no comparably reliable pattern. In lupus nephritis specifically (already covered in this app's own nephritis-monitoring research), real research finds complement levels correlating directly with kidney disease activity and rising back toward normal after 6 months of effective treatment. Worth stating honestly: real research also finds these traditional markers can reflect disease activity imperfectly on their own, and newer complement-based biomarkers are being studied as potentially more sensitive tools. Worth knowing directly: this is a real, worth-naming-by-name pair of tests to ask about as part of routine lupus monitoring, giving a real, complementary signal alongside symptom tracking and the SLEDAI score itself.",
    citations: [
      { source: 'Complement as a Biomarker for Systemic Lupus Erythematosus, PMC9953581', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9953581/' },
      { source: 'Serum C3 Levels Are Diagnostically More Sensitive and Specific for Systemic Lupus Erythematosus Activity Than Are Serum C4 Levels', url: 'https://www.sciencedirect.com/science/article/abs/pii/S0272638612806093' },
    ],
    overallTier: 'strong',
    relatedIds: ['lupus-sledai-disease-activity', 'lupus-nephritis-monitoring'],
  },
  {
    id: 'lupus-discoid-vs-systemic',
    category: 'lupus',
    title: 'Discoid Lupus Is a Real, Distinct Skin-Only Condition, but Real Research Finds a Genuine Risk of It Progressing to Full Systemic Lupus',
    teaser: 'Real research finds 6-30% of discoid lupus cases eventually progress to systemic lupus, with real, named, checkable risk factors (young age at onset, high ANA titers) helping identify who\'s most at risk.',
    summary:
      "Discoid lupus erythematosus (DLE) is a real, distinct, chronic skin-only form of lupus, causing real, scarring, disc-shaped skin lesions, and it's worth knowing directly that it's not automatically the same thing as systemic lupus, though a real, genuine minority of cases do eventually progress. Real research finds progression rates from DLE to full systemic lupus erythematosus (SLE) ranging from 6% to 21% in earlier studies, with a more recent, larger systematic review finding higher rates, 30.0% in pediatric cases and 25.4% in adults. Real, specific, checkable risk factors for this progression have been identified: age younger than 25 at DLE diagnosis, widespread (rather than localized) lesions, joint pain or arthritis, anemia, low white blood cell counts, high erythrocyte sedimentation rates, and high antinuclear antibody (ANA) titers (specifically 1:320 or higher) all real, independently associated with a greater chance of progressing to severe systemic disease. Real research also finds a family history of rheumatic disease among the real, contributing risk factors. Worth knowing directly: this gives someone diagnosed with discoid lupus, or a doctor monitoring them, a real, concrete, evidence-backed checklist for deciding how closely to monitor for systemic involvement, rather than treating every DLE diagnosis as either automatically benign or automatically destined to become systemic.",
    citations: [
      { source: 'Discoid lupus erythematosus and its progression to systemic lupus erythematosus across age groups: a systematic review, PMC12577789', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12577789/' },
      { source: 'Risk factors of progression from discoid lupus to severe systemic lupus erythematosus: a registry-based cohort study of 164 patients, PMID 36156304', url: 'https://pubmed.ncbi.nlm.nih.gov/36156304/' },
    ],
    overallTier: 'strong',
    relatedIds: ['lupus-overview'],
  },
  {
    id: 'lupus-glucocorticoid-osteoporosis',
    category: 'lupus',
    title: "Long-Term Steroid Treatment Carries Its Own Bone-Health Cost, and a Normal Scan Doesn't Rule It Out",
    teaser: 'Glucocorticoids remain the backbone of lupus treatment, but they measurably weaken bone, sometimes enough to fracture even when a bone-density scan still looks normal.',
    summary:
      "Glucocorticoids (prednisone and related steroids) are the single most consistently used medication in lupus treatment, and they carry a genuine, dose-dependent bone cost: they suppress the cells that build new bone while doing nothing to slow the cells that break it down. Reported osteoporosis rates in lupus patients vary widely by population, from 10.3% in one British cohort to 21.7% in a Chinese cohort, with osteopenia (the milder, earlier stage of bone loss) affecting closer to half of patients in most studies. A more striking finding: fracture risk in lupus runs about 22% higher than in the general population, roughly doubling after ten or more years of disease, and fractures happen even in patients whose bone-density scan looks normal. In one cohort, fewer than a third of patients who actually fractured had a bone-density score low enough to be formally called osteoporotic. That gap matters, since standard fracture-risk calculators were built around bone density alone and can underestimate risk in someone on long-term glucocorticoids. Rheumatology guidance calls for daily calcium and vitamin D alongside ongoing steroid treatment, with one lupus-specific analysis recommending at least 1,000mg of calcium and 600 IU of vitamin D a day, and bisphosphonate medication added for anyone on a higher steroid dose. This is a plannable part of long-term lupus management, not an unavoidable side effect to simply accept.",
    citations: [
      {
        source: 'Glucocorticoid-induced osteoporosis in systemic lupus erythematosus, Rheumatology Practice and Research 2018 (Phang, Cho, Lee, Mak)',
        url: 'https://journals.sagepub.com/doi/10.1177/2059902118802510',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['ra-advocacy-bone-density', 'celiac-bone-density'],
  },
  {
    id: 'lupus-neuropsychiatric-real-data',
    category: 'lupus',
    title: 'Neuropsychiatric Lupus Is Real, Common, and Genuinely Underrecognized Alongside the More Familiar Symptoms',
    teaser: 'Real research finds neuropsychiatric symptoms in roughly 30-40% of lupus patients, with cognitive dysfunction alone affecting close to 38%, often mistaken for something else entirely.',
    summary:
      "Lupus's own reputation centers on joints, skin, and kidneys, but the disease can genuinely reach the brain and nervous system directly, a real category called neuropsychiatric lupus (NPSLE). Real research finds it affects roughly 30 to 40% of lupus patients overall, spanning a real, wide range from common, milder symptoms to rare, severe ones. Cognitive dysfunction (real, measurable trouble with memory, attention, and processing speed) is the single most common form, with a pooled prevalence near 38%, and headaches, anxiety, and mood disorders round out the most frequent presentations. Real, more severe manifestations, seizures and psychosis, are each genuinely less common, affecting roughly 4 to 6% of patients, but real and serious when they occur. Worth knowing directly: this real range of symptoms is genuinely easy to misattribute, cognitive fog and mood changes especially can get chalked up to stress, depression, or simple fatigue rather than recognized as a real, direct manifestation of the disease itself. Anyone with lupus experiencing new or worsening cognitive, mood, or neurological symptoms has real, genuine standing to raise the specific possibility of neuropsychiatric involvement directly, rather than assuming it's unrelated to their underlying condition.",
    citations: [
      { source: 'Neuropsychiatric Systemic Lupus Erythematosus: A Systematic Review, PMC11227614', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11227614/' },
    ],
    overallTier: 'strong',
    relatedIds: ['lupus-sledai-disease-activity', 'lupus-antiphospholipid-syndrome'],
  },
  {
    id: 'lupus-anifrolumab-new-biologic',
    category: 'lupus',
    title: 'A Genuinely New Kind of Lupus Medication, Targeting a Different Part of the Immune System Than Belimumab',
    teaser: 'Anifrolumab blocks a real, distinct immune signal (type I interferon), and its own landmark trial found 47.8% of patients responded, against 31.5% on placebo.',
    summary:
      "This category's own research already covers belimumab, the first lupus-specific biologic in over 50 years, targeting a real B-cell survival signal. Anifrolumab is a real, genuinely different, more recently approved biologic, targeting a separate part of the immune system entirely: the type I interferon receptor, blocking a real signaling pathway that's specifically overactive in a large share of lupus patients. Its own landmark trial (TULIP-2), a real, randomized, placebo-controlled study of 362 patients, found 47.8% of the anifrolumab group reached a real, validated composite measure of improvement (BICLA response) at 52 weeks, compared with 31.5% on placebo, a real, statistically significant difference. Anifrolumab was FDA-approved in 2021 based on this and a companion trial, and more recently gained approval as a real, more convenient once-weekly self-administered injection rather than only an infusion. Worth knowing directly: having two real, mechanistically different biologic options (belimumab targeting B cells, anifrolumab targeting interferon signaling) genuinely matters, since lupus itself varies person to person in which immune pathway is driving the most disease activity, and a real doctor can help match a specific medication to a specific person's own disease pattern rather than treating every biologic option as functionally interchangeable.",
    citations: [
      { source: 'Trial of Anifrolumab in Active Systemic Lupus Erythematosus, New England Journal of Medicine 2020, PMID 31851795', url: 'https://pubmed.ncbi.nlm.nih.gov/31851795/' },
    ],
    overallTier: 'strong',
    relatedIds: ['lupus-belimumab-biologic'],
  },
  {
    id: 'lupus-mycophenolate-cyclophosphamide-nephritis',
    category: 'lupus',
    title: 'A Real, Landmark Trial Found a Better-Tolerated Drug Genuinely Matches an Older, Harsher Standard for Kidney Involvement',
    teaser: 'The real ALMS trial found mycophenolate mofetil at least as effective as intravenous cyclophosphamide for inducing remission in lupus nephritis, with a real, meaningfully more favorable side-effect profile.',
    summary:
      "This category's own already-covered lupus nephritis monitoring research names WHAT to track, real research on treatment itself answers a genuinely important, real, practical question: which medication actually induces remission best. Intravenous cyclophosphamide was the real, long-standing standard treatment, but carries real, serious side effects, including infertility risk and increased infection susceptibility. The real, landmark Aspreva Lupus Management Study (ALMS), a real, international, 370-patient randomized trial, tested mycophenolate mofetil directly against intravenous cyclophosphamide as induction therapy for active lupus nephritis over 24 weeks. The real result: mycophenolate mofetil was at least as effective, and in this trial's own real data, numerically more effective, at inducing remission, with a real, meaningfully more favorable safety profile than cyclophosphamide. Worth knowing directly, and genuinely reassuring: this real trial gave rheumatologists a real, better-tolerated first option for a genuinely serious complication, one this category's own real research already treats as needing prompt, aggressive real treatment. A real, practical detail worth raising directly with a treating doctor: which of these two real options is being used, and why, since real, individual factors (disease severity, kidney function, and personal treatment goals around future fertility) can reasonably shift that real, shared decision either way.",
    citations: [
      { source: 'Mycophenolate mofetil versus cyclophosphamide for induction treatment of lupus nephritis, Journal of the American Society of Nephrology 2009 (Appel et al.), PMID 19369404', url: 'https://pubmed.ncbi.nlm.nih.gov/19369404/' },
    ],
    overallTier: 'strong',
    relatedIds: ['lupus-nephritis-monitoring'],
  },
  {
    id: 'lupus-nsaid-aseptic-meningitis',
    category: 'lupus',
    title: 'A Real, Specific, Startling Reaction: Some Lupus Patients Develop Meningitis-Like Symptoms From Ordinary Ibuprofen',
    teaser: 'A real, documented, repeatable reaction links lupus specifically to NSAID-induced aseptic meningitis, real symptoms resembling true meningitis that resolve within days once the drug is stopped.',
    summary:
      "NSAIDs (ibuprofen and related pain relievers) carry a real, specific, striking risk in lupus that's easy to miss entirely, since it's genuinely rare and its symptoms mimic a much more alarming, real infection. Real case literature finds lupus the single most common underlying condition behind NSAID-induced aseptic meningitis, a real, drug-triggered inflammatory reaction in the membranes surrounding the brain and spinal cord, producing real symptoms (headache, fever, neck stiffness, confusion) that closely resemble true infectious meningitis. Ibuprofen is the most frequently implicated real trigger, though real case reports also name several other NSAIDs. The real, proposed mechanism involves a hypersensitivity reaction specifically confined to the central nervous system, real research finds affected individuals often experience the reaction again with even a small repeat dose of the same drug, a real, distinctive pattern pointing to real drug sensitivity rather than coincidence. Worth knowing directly, and genuinely reassuring once recognized: real case reports consistently find symptoms resolve within 48 hours simply by stopping the NSAID, with no lasting effects. Worth knowing plainly for anyone with lupus: a real, sudden meningitis-like reaction after starting or restarting an NSAID is real, worth raising directly and immediately, both to stop the specific drug and to avoid an unnecessary, invasive workup for a suspected true infection that isn't actually present.",
    citations: [
      { source: 'Aseptic meningo-encephalitis related to dexibuprofen use in a patient with systemic lupus erythematosus: a case report with MR findings, PMID 12195787', url: 'https://pubmed.ncbi.nlm.nih.gov/12195787/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['lupus-drug-induced-reversible'],
  },
  {
    id: 'lupus-late-onset-after-50-milder',
    category: 'lupus',
    title: 'Lupus Diagnosed After 50 Genuinely Looks Different, Often Milder, and Easily Mistaken for Aging',
    teaser: 'One in five lupus diagnoses happens at age 50 or later, and real data finds this later-onset form tends to be genuinely milder, with less kidney involvement and fewer of the classic warning signs.',
    summary:
      "Lupus is often pictured as a young woman's disease, but a real, meaningful share of cases, 20% by one real estimate, are diagnosed at age 50 or later, and this late-onset form has its own real, distinct clinical shape. Real comparative data finds late-onset lupus produces lower disease-activity scores on average, with significantly less fever, fewer of the classic skin and mucous-membrane findings, and fewer positive antibody results than lupus diagnosed earlier in life. The real, practical risk this creates: late-onset lupus often lacks the textbook butterfly rash and is less likely to involve the kidneys at the outset, instead presenting as pleurisy or pericarditis (inflammation around the lungs or heart), persistent dry eyes and mouth, or joint and muscle aches that get chalked up to ordinary osteoarthritis or general wear and tear. Serologically, late-onset patients are less likely to test positive for anti-dsDNA and RNP antibodies, and more likely to test positive for rheumatoid factor, a real pattern that can point evaluation toward the wrong diagnosis. Worth knowing directly: real cohort data does describe a genuinely milder overall disease course with less frequent kidney involvement in this later-onset group, real, honest reassurance that softens, but does not erase, the real risk of a slower, harder-to-recognize diagnosis in this age group.",
    citations: [
      { source: 'Unveiling the dual nature of late-onset systemic lupus erythematosus: A cross-sectional study, PMC12743268', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12743268/' },
      { source: 'Comparison of late-onset and non-late-onset systemic lupus erythematosus individuals in a real-world electronic health record cohort, PMC10954386', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10954386/' },
    ],
    overallTier: 'strong',
    relatedIds: ['lupus-sledai-disease-activity', 'lupus-overview'],
  },
  {
    id: 'lupus-global-ethnicity-severity',
    category: 'lupus',
    title: "Lupus Doesn't Just Affect Some Groups More Often, It Genuinely Hits Harder, a Real, Quantified Gap",
    teaser: 'Lupus runs 2 to 3 times more common in African American, Hispanic/Latina, Native American, and Pacific Islander women than in White women, and real data finds it also causes more severe kidney disease in these same groups.',
    summary:
      "Lupus shows one of the most consistent and best-documented real disparities across race and ethnicity of any condition in this whole app, in both how often it occurs and how severely it behaves once it does. Real US population data finds lupus 2 to 3 times more prevalent among African American, Hispanic/Latina, Native American, Alaska Native, and Native Hawaiian/Pacific Islander women compared with White women. The severity gap is just as real and just as measurable: lupus nephritis (kidney involvement) occurs at 59.69 per 100,000 in African American individuals and 56.56 per 100,000 in Asian individuals, compared with just 15.83 per 100,000 in White individuals, and the real, adjusted risk of developing lupus nephritis specifically runs 4.3 times higher in Asian/Pacific Islander patients, 2.4 times higher in African American patients, and 2.3 times higher in Hispanic patients, all compared with White patients. Worth knowing directly: this is real, quantified evidence that lupus is not one uniform disease experience worldwide, real ancestry-linked genetic factors combine with real, documented disparities in healthcare access and social support to produce measurably different outcomes by ethnicity, a real reason ancestry and regional healthcare context both belong in how any individual person's own lupus risk and monitoring plan gets thought through.",
    citations: [
      { source: 'Lupus Facts and Statistics, Lupus Foundation of America', url: 'https://www.lupus.org/resources/lupus-facts-and-statistics' },
      { source: 'Racial and Ethnic Differences in the Prevalence and Time to Onset of Manifestations of Systemic Lupus Erythematosus: The California Lupus Surveillance Project, PMID 31115180', url: 'https://pubmed.ncbi.nlm.nih.gov/31115180/' },
    ],
    overallTier: 'strong',
    relatedIds: ['lupus-overview', 'lupus-nephritis-monitoring'],
  },
  {
    id: 'lupus-global-silica-occupational-clusters',
    category: 'lupus',
    title: 'A Real, Documented Workplace Exposure Raises Lupus Risk Independent of Ethnicity or Region',
    teaser: 'Real, multiple US population studies found occupational crystalline silica dust exposure directly linked to elevated lupus risk, with longer exposure tracking with greater real risk.',
    summary:
      "This category's own already-covered ethnicity and severity research explains much of lupus's real geographic variation; a real, separate, occupational factor adds another layer that cuts across region and ancestry alike. Multiple real, population-based case-control studies in the United States, including a real study across 60 contiguous counties in the southeastern US and a separate real study focused on urban, predominantly African American neighborhoods in Boston, both found occupational exposure to crystalline silica dust (a real, common exposure in mining, construction, sandblasting, and similar industrial work) directly linked to increased lupus risk. The real, proposed mechanism: crystalline silica appears to act as a real immune adjuvant, meaning it directly amplifies inflammation and antibody production rather than simply irritating tissue, and real research finds a longer duration of silica exposure tracking with a real, greater lupus risk, a genuine dose-response relationship. Worth knowing directly: this is a real, occupational risk factor that exists independent of the ethnicity-driven risk already covered elsewhere in this category, meaning someone's own real, individual job history (mining, construction, sandblasting, and similar industrial silica-dust-generating work) is worth naming directly to a doctor alongside family history and ancestry when thinking through personal lupus risk, a real, modifiable exposure in a category where most other real risk factors already covered aren't.",
    citations: [
      { source: 'Occupational exposure to crystalline silica and risk of systemic lupus erythematosus: a population-based, case-control study in the southeastern United States, PMID 12124868', url: 'https://pubmed.ncbi.nlm.nih.gov/12124868/' },
      { source: 'Occupational exposure to crystalline silica and autoimmune disease, PMC1566238', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1566238/' },
    ],
    overallTier: 'strong',
    relatedIds: ['lupus-global-ethnicity-severity'],
  },
  {
    id: 'horizon-lupus',
    category: 'lupus',
    title: 'Real, Striking Early Data: a One-Time Cell Therapy Put Severe Lupus Into Real, Lasting Remission',
    teaser: 'CAR-T cell therapy is producing some of the most dramatic real trial results anywhere in this Digest for lupus, with real disease-activity scores dropping from 10.6 to 2.7 in three months and some patients reaching real, medication-free remission out to 46 months.',
    summary:
      "Of every real, experimental treatment covered anywhere across this Digest's own research-horizon entries, lupus's own CAR-T cell data is genuinely among the most striking. This category's own already-covered belimumab and mycophenolate research targets specific pieces of the immune response; CAR-T cell therapy resets it more completely, engineering a patient's own immune cells to hunt down and eliminate the B cells producing the harmful autoantibodies driving lupus. Real trial results: mean SLE Disease Activity Index scores fell from 10.6 at baseline to 2.7 at 3 months in one real trial, kidney function significantly improved in lupus nephritis patients within 90 days, and some patients reached real, complete symptom- and medication-free remission with follow-up extending as far as 46 months out. A real, newer allogeneic version (using donor cells rather than the patient's own) showed the same real efficacy with no graft-versus-host disease, cytokine release syndrome, or neurotoxicity observed, real safety signals that matter directly given how serious CAR-T's own known risks can be in other diseases. Worth knowing honestly: this remains real, early-phase, small-trial data, not yet a broadly available treatment, but it represents genuinely the most advanced real CAR-T application of any autoimmune condition in this whole Digest.",
    citations: [
      { source: 'Allogeneic CD19-targeted CAR-T therapy in refractory systemic lupus erythematosus achieved durable remission', url: 'https://pubmed.ncbi.nlm.nih.gov/40446794/' },
      { source: 'Anti-CD19 CAR T cell therapy for refractory systemic lupus erythematosus, Nature Medicine', url: 'https://www.nature.com/articles/s41591-022-02017-5' },
    ],
    overallTier: 'moderate',
    relatedIds: ['lupus-belimumab-biologic', 'lupus-mycophenolate-cyclophosphamide-nephritis'],
  },
  {
    id: 'horizon-lupus-litifilimab',
    category: 'lupus',
    title: "A Real, New Drug Could Become the First Genuine Advance for Lupus's Own Skin Symptoms in 70 Years",
    teaser: 'Litifilimab targets a specific cell type driving lupus skin disease, and two separate, real Phase 2 trials both found it significantly reducing disease activity, real evidence supporting an FDA Breakthrough Therapy designation.',
    summary:
      "This category's own already-covered belimumab and anifrolumab research targets B cells and a broad interferon pathway; litifilimab works through a real, more specific real target, blood dendritic cell antigen 2 (BDCA2), found on the exact immune cells most directly implicated in lupus's own skin disease. Two separate, real Phase 2 trials, LILAC (published in the New England Journal of Medicine) and the more recent AMETHYST, both found litifilimab meeting its primary endpoint, a real, significant reduction in skin disease activity, with more patients on the drug reaching clear or almost-clear skin than on placebo. It's real, direct significance is stated plainly by the field itself: if confirmed in larger trials, it could become the first genuinely new, innovative therapy specifically approved for cutaneous lupus erythematosus in 70 years, real evidence strong enough that it has already earned FDA Breakthrough Therapy designation, a real, formal signal the FDA reserves for drugs showing substantial improvement over existing treatment in early testing. Worth knowing directly: this is real, twice-replicated Phase 2 evidence, genuinely stronger than most single-trial results covered elsewhere in this Digest's own Research Horizon entries, though real Phase 3 confirmation is still the next required step before approval.",
    citations: [
      { source: 'Trial of Anti-BDCA2 Antibody Litifilimab for Cutaneous Lupus Erythematosus, New England Journal of Medicine', url: 'https://www.nejm.org/doi/full/10.1056/NEJMoa2118024' },
    ],
    overallTier: 'strong',
    relatedIds: ['horizon-lupus'],
  },
  {
    id: 'lupus-nephritis-isn-rps-classification',
    category: 'lupus',
    title: 'The Real, Six-Class System That Decides How Aggressively Lupus Nephritis Gets Treated',
    teaser: 'A kidney biopsy in lupus is graded on a real, formal six-class scale, and the class assigned changes the treatment plan directly, not just the paperwork.',
    summary:
      "Lupus nephritis (kidney inflammation from lupus, already covered by this category's own real monitoring/immunosuppressant entries) is graded on a real, formal pathology system, the ISN/RPS classification, jointly published by the International Society of Nephrology and the Renal Pathology Society. A kidney biopsy is assigned one of six real classes: Class I is minimal, near-normal tissue under the microscope; Class II shows mild mesangial changes; Classes III and IV are focal and diffuse proliferative disease, the most aggressive, most kidney-damaging forms, with Class IV alone affecting close to half of all lupus nephritis patients in real cohort data; Class V is membranous disease, a different real damage pattern centered on the kidney's filtering membrane; Class VI is advanced, largely irreversible scarring. This isn't just a label. Real clinical guidance treats Class III/IV disease far more aggressively, with immunosuppressant combinations, than Class I/II, and a real, large prognosis study confirmed the classification's own real predictive value: it directly forecasts long-term kidney outcome, not just describes the biopsy. Worth knowing directly: the classification was formally revised in 2018 to fix real ambiguities in the original 2003 version, a genuine sign that even a well-established grading system keeps getting refined as more real evidence comes in.",
    citations: [
      { source: 'The ISN/RPS 2016 classification predicts renal prognosis in patients with first-onset class III/IV lupus nephritis, PMC', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7810677/' },
      { source: 'ISN/RPS 2003 classification of lupus nephritis: an assessment of the achievements and limitations of the schema, PMC', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4119328/' },
    ],
    overallTier: 'strong',
    relatedIds: ['lupus-nephritis-monitoring', 'lupus-mycophenolate-cyclophosphamide-nephritis'],
  },
  {
    id: 'lupus-raynauds-thrombosis-risk',
    category: 'lupus',
    title: "Cold, White Fingers Aren't Just a Nuisance in Lupus -- They Can Be a Real Warning Sign",
    teaser: "Raynaud's phenomenon shows up in a real, meaningful share of lupus patients, and in one specific, real subgroup it's directly tied to a much higher risk of dangerous blood clots.",
    summary:
      "Raynaud's phenomenon, fingers (and sometimes toes) turning white or blue and going numb in cold or stress, is a real, common lupus symptom, caused by small blood vessels in the extremities overreacting and clamping down. On its own it's usually manageable, more an uncomfortable inconvenience than a medical emergency. The real, worth-knowing finding is what it signals in one specific, identifiable subgroup: among lupus patients who also test positive for antiphospholipid antibodies (a real, already-covered risk factor for this app's own antiphospholipid-syndrome entry), a real study found roughly one in five carried Raynaud's phenomenon, and both lupus nephritis and Raynaud's phenomenon independently predicted a real, significantly higher risk of vascular thrombosis, actual dangerous blood clots, in that same antiphospholipid-positive population. This doesn't mean everyone with cold fingers and lupus is at high clotting risk. It means Raynaud's phenomenon, in someone who already tests antiphospholipid-positive, is a real, additional signal worth naming to a rheumatologist directly rather than dismissed as a minor circulation quirk, since it's one of the concrete features that tracks with a much more serious real outcome in that specific population.",
    citations: [
      { source: "Lupus nephritis and Raynaud's phenomenon are significant risk factors for vascular thrombosis in SLE patients with positive antiphospholipid antibodies, PubMed", url: 'https://pubmed.ncbi.nlm.nih.gov/17805483/' },
    ],
    overallTier: 'strong',
    relatedIds: ['lupus-antiphospholipid-syndrome', 'lupus-nephritis-monitoring'],
  },
];
