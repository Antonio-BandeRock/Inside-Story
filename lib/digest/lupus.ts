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
    teaser: "Not a single-organ disease, lupus can affect the skin, joints, kidneys, blood, and nervous system all at once, unlike more localized autoimmune conditions.",
    summary:
      "Systemic lupus erythematosus (SLE, usually just called lupus) is an autoimmune disease in which the immune system attacks the body's own healthy tissue across multiple organ systems at once, skin (the classic butterfly-shaped facial rash), joints, kidneys, blood cells, and, in more serious cases, the heart, lungs, or nervous system. This wide reach is what gives lupus its reputation as a difficult, sometimes years-long diagnostic process, since early symptoms (fatigue, joint pain, unexplained fever) overlap with many other conditions. Lupus overwhelmingly affects women, especially women of childbearing age, and disproportionately affects Black, Hispanic, and Asian women compared to white women. This category covers what's specific to actually living with and managing lupus on its own terms, a wide-ranging shape, reflecting how many different organ systems the disease itself can touch, rather than one dominant theme.",
    citations: [
      { source: 'Lupus, MedlinePlus, U.S. National Library of Medicine', url: 'https://medlineplus.gov/lupus.html' },
    ],
    overallTier: 'strong',
    relatedIds: ['other-lupus', 'gut-blautia-lupus-zonulin', 'gut-probiotic-yogurt-lupus-rct'],
  },
  {
    id: 'lupus-alfalfa-canavanine',
    category: 'lupus',
    title: 'Alfalfa Sprouts: A Well-Documented Food That Can Trigger a Lupus-Like Flare',
    teaser: 'A specific amino acid in a common health-food-store sprout can fool the body into building faulty proteins, and the immune system notices.',
    summary: "Alfalfa sprouts and alfalfa seeds contain L-canavanine, a naturally occurring compound structurally similar to the amino acid arginine, closely enough that the body's own protein-building machinery can mistakenly use it in place of arginine. The resulting proteins, containing this substituted amino acid, are recognized by the immune system as foreign, and research in human volunteers and in cynomolgus monkeys has shown alfalfa sprout intake can induce a lupus-like syndrome, complete with antinuclear antibodies, anti-dsDNA antibodies, and reduced complement levels, the same markers the self-advocacy research already covers for actual lupus monitoring. L-canavanine has documented effects on immune regulatory cells, reducing normal suppressor-cell function and increasing antibody production. This is specific, well-established enough that a major academic lupus center recommends avoiding alfalfa in the diet of anyone with lupus, one of the very few individual foods in the entire research base with this direct and this well-documented a connection to actually triggering disease activity, rather than just a general dietary pattern.",
    citations: [
      { source: '5 Foods and Medications to Avoid If You Have Lupus, Johns Hopkins Lupus Center', url: 'https://www.hopkinslupus.org/lupus-info/lifestyle-additional-information/avoid/' },
      { source: 'Akaogi J, et al., Autoimmunity Reviews, 2006, "Role of non-protein amino acid L-canavanine in autoimmunity"', url: 'https://www.sciencedirect.com/science/article/abs/pii/S1568997205002223' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'lupus-photosensitivity-vitamin-d-catch22',
    category: 'lupus',
    title: 'A Catch-22: Sun Protects Against a Flare, and Causes a Deficiency',
    teaser: 'The one thing that makes vitamin D naturally is the one thing many lupus patients need to avoid.',
    summary:
      "Photosensitivity, disproportionate skin and disease sensitivity to ultraviolet light, is one of lupus's defining features. UV exposure can trigger not just a skin rash but full-body flares, including fatigue, joint pain, and headaches, in people with lupus. The practical complication: since UV light is also what the skin uses to naturally produce vitamin D, the same sun protection that helps prevent a flare also raises the risk of vitamin D deficiency, and this effect is compounded further by some of the medications used to treat lupus. This is a well-documented catch-22, not an exaggerated concern, and the practical resolution recommended by lupus-specific patient guidance is consistent: prioritize sun protection to manage disease activity, and address the resulting vitamin D gap through diet and supplementation instead of sun exposure, rather than treating the two goals as something that has to be balanced against each other.",
    citations: [
      { source: 'Vitamin D Status a Common Health Concern for People with Lupus, Though Not Linked to Disease Activity, Lupus Foundation of America', url: 'https://www.lupus.org/news/vitamin-d-status-a-common-health-concern-for-people-with-lupus-though-not-linked-to-disease' },
    ],
    overallTier: 'strong',
    relatedIds: ['lupus-vitamin-d-supplementation-mixed'],
  },
  {
    id: 'lupus-vitamin-d-supplementation-mixed',
    category: 'lupus',
    title: 'Vitamin D Supplementation in Lupus: A Inconsistent Trial Record',
    teaser: "Knowing lupus patients are commonly deficient is one question. Whether correcting that deficiency actually calms the disease is a separate, and less settled question.",
    summary:
      "Given how common vitamin D deficiency is in lupus (see the photosensitivity catch-22 covered elsewhere in this category), a separate question follows: does correcting that deficiency actually reduce disease activity? The trial record is mixed, not a clean yes. One trial giving high, tiered doses (4,000 or 8,000 IU daily for six months) found significant improvement in complement levels and fatigue, but only a small, not statistically significant reduction in overall disease activity scores. A separate randomized trial in juvenile-onset lupus (50,000 IU weekly for 24 weeks) did find a statistically significant reduction in disease activity. Yet another randomized, placebo-controlled trial in vitamin-D-deficient adult lupus patients found no significant difference in disease activity scores at all after supplementation. Taken together, this is an honest, unresolved question, not the same as saying vitamin D doesn't matter for lupus at all (deficiency itself carries its separate health risks) but different from claiming supplementation is a proven way to calm the disease itself.",
    citations: [
      { source: 'Effects of Vitamin D Supplementation on Fatigue and Disease Activity in Systemic Lupus Erythematosus, PMID 40084313', url: 'https://pubmed.ncbi.nlm.nih.gov/40084313/' },
      { source: 'The effect of Vitamin D supplementation in disease activity of systemic lupus erythematosus patients with Vitamin D deficiency: A randomized clinical trial, PMID 28400826', url: 'https://pubmed.ncbi.nlm.nih.gov/28400826/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'lupus-omega3-fish-oil',
    category: 'lupus',
    title: 'Omega-3 and Lupus: A Meta-Analysis Finding Benefit, and a Different Kind of Study Finding a Complication',
    teaser: 'Small trials suggest fish oil calms lupus activity. A completely different research method, tracing genetic cause and effect, found the opposite direction.',
    summary:
      "A meta-analysis pooling five randomized controlled trials (274 SLE patients total) found omega-3 fatty acid supplementation associated with a statistically significant reduction in disease activity, equivalent to about a 0.9-point drop on the standard SLEDAI disease-activity scale, alongside individual trial findings of improved fatigue, quality of life, and endothelial function. The meta-analysis's authors rate the certainty of this evidence as low, since the individual trials were small and varied in quality, an honest limitation. A different, separate line of research complicates the picture further: a Mendelian randomization study, using genetic variants as a different tool for testing cause and effect rather than a supplementation trial, found genetically predicted higher circulating omega-3 levels causally associated with an increased risk of developing lupus in the first place. These are two different questions, whether omega-3 helps someone who already has lupus (the trial evidence, cautiously positive) versus whether higher lifetime omega-3 levels affect the risk of developing lupus at all (the genetic evidence, pointing the other way), and both deserve stating honestly rather than picking the more flattering one.",
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
    title: 'Echinacea, and a Broader List of "Immune-Boosting" Herbs to Approach With Caution',
    teaser: 'Marketed as immune support for a cold. For an already-overactive immune system, the same mechanism can work against you.',
    summary:
      "For lupus specifically, boosting an immune system that's already overactive is counterproductive, not neutral. Echinacea is the most commonly named example, an academic lupus center specifically advises against it because of its documented immune-stimulating effect, with concern that this could trigger or worsen a flare. A broader, more recent study identified 15 herbal supplements with robust evidence for immune-stimulating effects, alfalfa (see this category's separate entry), ashwagandha, astragalus, echinacea, garlic, ginseng, and spirulina among them, associated with documented mechanisms including increased cytokine production and immune-pathway activation. Garlic specifically carries mixed advice: some sources list it as a caution for the same immune-stimulating reason, but no direct evidence was found that garlic in ordinary dietary amounts (rather than concentrated supplement form) causes problems, an honest distinction worth keeping rather than treating every herb on this list identically. The general, practical takeaway: a supplement marketed as \"immune support\" is worth a direct conversation with a rheumatologist before starting, specifically because of lupus, not despite it.",
    citations: [
      { source: 'New study identifies 15 herbal supplements to potential skin flare activity in people with autoimmune skin diseases, Lupus Foundation of America', url: 'https://www.lupus.org/news/new-study-identifies-15-herbal-supplements-to-potential-skin-flare-activity-in-people-with' },
      { source: '5 Foods and Medications to Avoid If You Have Lupus, Johns Hopkins Lupus Center', url: 'https://www.hopkinslupus.org/lupus-info/lifestyle-additional-information/avoid/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'lupus-cardiovascular-risk',
    category: 'lupus',
    title: 'A Striking Cardiovascular Risk That Traditional Risk Factors Alone Don\'t Explain',
    teaser: 'A young woman with lupus can carry a heart-attack risk dozens of times higher than someone the same age without it.',
    summary:
      "Cardiovascular disease is a leading cause of death in lupus, and the scale of the risk is striking: women with lupus aged 35 to 44 have an estimated 50-fold increased risk of heart attack compared to age- and sex-matched women without lupus, and imaging studies find carotid artery plaque in 37% of lupus patients versus 15% of matched controls. What makes this a distinct finding rather than just \"lupus patients also get heart disease\": research finds ordinary, traditional cardiovascular risk factors (cholesterol, blood pressure, smoking) don't fully explain this scale of excess risk on their own. The driving factors are believed to be chronic inflammation and cumulative disease activity itself, along with disease-specific complications like antiphospholipid antibodies, which independently raise clotting risk. This is a direct reason cardiovascular risk deserves its own, dedicated attention in lupus specifically, not just the standard general-population advice, and a concrete argument for taking disease-activity control itself seriously as a cardiovascular protective measure, not only a symptom-management one.",
    citations: [
      { source: 'Cardiovascular Complications in Systemic Lupus Erythematosus', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9358056/' },
    ],
    overallTier: 'strong',
    relatedIds: ['cvd-overview', 'cvd-lipid-panel-self-advocacy'],
  },
  {
    id: 'lupus-hydroxychloroquine-retinopathy',
    category: 'lupus',
    title: 'Hydroxychloroquine: A Eye Exam Schedule for the Field\'s Own Preferred Lupus Medication',
    teaser: 'The single most commonly used lupus medication carries a rare but irreversible eye risk, tracked with a specific screening schedule.',
    summary:
      "Hydroxychloroquine is the preferred first-line medication for lupus, but it carries a rare risk of retinopathy, damage to the retina that is not treatable and can continue progressing even after the medication is stopped, which is exactly why updated screening guidelines exist. Current recommendations call for a baseline eye exam within a few months of starting the medication (mainly to rule out any pre-existing retinal condition that could complicate later screening), then a gap before screening resumes: routine screening can be deferred for the first 5 years of treatment for someone at otherwise-average risk, then should happen annually after that, using specific imaging tests (optical coherence tomography and automated visual field testing) rather than a standard eye exam alone. The quantified risk itself is low but not zero: under 2% after 10 years of use, rising to as much as 8.6% after 15 years. A separate and unrelated caution: grapefruit and grapefruit juice can meaningfully raise hydroxychloroquine blood levels and should generally be avoided during treatment. Worth asking directly whether this screening schedule is being followed, rather than assuming it happens automatically as part of routine care.",
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
    title: 'Lupus Nephritis: A Specific Lab Panel That Catches Kidney Involvement Before It Becomes Obvious',
    teaser: 'Kidney damage from lupus can develop quietly. A standard panel of labs is how it actually gets caught early.',
    summary:
      "Lupus nephritis, kidney inflammation caused by lupus itself, is a common, and serious complication, and clinical guidelines (KDIGO) recommend a specific, standard panel to catch it, both at diagnosis and on an ongoing basis: creatinine and eGFR (standard kidney-function markers), a urinalysis and a spot urine protein-to-creatinine ratio (checking for protein leaking into urine, an early sign of kidney damage), and anti-dsDNA antibody and complement levels (C3 and C4). Specific numbers: complement levels below about 60 for C3 or 15 for C4 are commonly seen in active disease, particularly when the kidneys are involved. A honest limitation: neither anti-dsDNA nor complement levels are perfectly reliable on their own, elevated anti-dsDNA doesn't always mean nephritis is present, and complement fluctuations don't always reliably predict a coming flare, which is exactly why the combined panel above, not any single test in isolation, is what actual clinical monitoring relies on. Worth asking directly whether this full panel, not just a subset of it, is part of a regular monitoring schedule.",
    citations: [
      { source: 'Advances in Lupus Nephritis Screening and Treatment, European Society of Medicine', url: 'https://esmed.org/advances-in-lupus-nephritis-screening-and-treatment/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'lupus-belimumab-biologic',
    category: 'lupus',
    title: 'Belimumab: A Long-Awaited First Lupus-Specific Biologic',
    teaser: 'No new medication had been approved specifically for lupus in over 50 years. This one was, and it works on a specific immune pathway.',
    summary: "Belimumab was the first medication approved specifically for lupus in more than 50 years, a notable gap in this disease's treatment history, first approved in 2011 and later extended to lupus nephritis specifically, including for children. Its specific mechanism: belimumab is a monoclonal antibody that binds to and neutralizes BLyS (B-lymphocyte stimulator), a signaling protein found at elevated levels in lupus, which normally helps keep antibody-producing B cells, including the misdirected ones driving lupus itself, alive. By blocking this survival signal, belimumab reduces the survival of these B cells and their differentiation into antibody-producing cells, without binding to B cells directly itself. This is worth knowing as a treatment option beyond the more familiar older medications (hydroxychloroquine, steroids, broader immunosuppressants) covered elsewhere in the research, and a concrete example of lupus-specific drug development finally catching up after a decades-long gap.",
    citations: [
      { source: 'The discovery and development of belimumab: the anti-BLyS-lupus connection, PMID 22231104', url: 'https://pubmed.ncbi.nlm.nih.gov/22231104/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'lupus-tying-together',
    category: 'lupus',
    title: 'What Actually Holds Up for Lupus, Pulled Together',
    teaser: 'One of the most specific, well-documented individual food triggers covered anywhere, a catch-22 no other condition here shares, and self-advocacy spanning three entirely different organ systems.',
    summary: "Line up everything in this category and lupus reads as a condition defined by its wide reach across the body, more than by any single dominant mechanism. Alfalfa sprouts stand out as one of the most specific, well-documented individual food triggers anywhere in the research, a named compound with an understood mechanism for why it provokes disease activity. The photosensitivity/vitamin D catch-22 is unique to lupus among every condition built out so far, sun protection and vitamin D adequacy pulling in opposite directions, with mixed trial evidence on whether correcting the resulting deficiency actually calms the disease itself. Omega-3 supplementation shows the same honest complexity already held every finding to: trial evidence leaning positive, and a different kind of study (genetic, not a trial) pointing the other way on lupus risk itself. And the self-advocacy entries reach across three distinct organ systems, eyes (hydroxychloroquine retinopathy), kidneys (lupus nephritis's lab panel), and the immune system directly (belimumab), matching how lupus itself doesn't confine its damage to one place.",
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
    title: 'Lupus Has a Formal Scoring System That Defines Exactly What "Flare" and "Remission" Actually Mean',
    teaser: 'SLEDAI turns "feeling worse" into a specific number, and a rise of 4 or more points from the last visit is the formal definition of a flare.',
    summary:
      "Lupus disease activity is measured with SLEDAI (or its updated version, SLEDAI-2K), a formal scoring instrument. Severity bands: mild disease scores 6 or below, moderate is 7-12, severe is above 12. Complete remission means a score of exactly 0 with no glucocorticoid or immunosuppressive medication in use at all; low disease activity allows a score of 3 or below while on hydroxychloroquine, or 4 or below on a low prednisone dose plus a well-tolerated immunosuppressant. A formal flare is defined as the score rising by 4 or more points from the previous visit, not just a subjective sense of feeling worse. This specific vocabulary matters directly: it's what a rheumatologist is actually tracking visit to visit, and knowing the numbers behind \"flare\" and \"remission\" makes it possible to ask a more precise, useful question about where things currently stand.",
    citations: [
      { source: 'Systemic Lupus Erythematosus: Diagnosis and Treatment, American Family Physician', url: 'https://www.aafp.org/afp/2023/0400/systemic-lupus-erythematosus' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'lupus-skin-blood-neuro-real-data',
    category: 'lupus',
    title: "Lupus's Own Reach Beyond the Kidneys: The Skin, the Nervous System, and the Blood's Own Clotting Machinery",
    teaser: 'Skin involvement in 70-85% of patients, neurological effects as the second most common organ system affected, and antibodies that directly raise clotting risk.',
    summary: "The earlier lupus research already establishes the disease reaches well past any single organ; data quantifies exactly how far. Skin lesions appear in a substantial 70-85% of lupus patients, with the classic malar (\"butterfly\") rash the single most common specific pattern in most studies, alongside discoid, subacute, and bullous rash types. Neuropsychiatric lupus (NPSLE) is the second most common organ system affected after skin, ranging from cognitive effects (memory loss, difficulty concentrating) to more severe neurological complications. Specific antibodies (antiphospholipid antibodies, covered in more depth in the pregnancy entry below) directly raise blood-clotting risk, and lupus also commonly affects blood cell counts themselves, lower-than-normal red blood cells, platelets, or white blood cells, each carrying its distinct clinical consequence. This is a wide, multi-system reach, extending beyond whichever single symptom happens to be most visible at any given time.",
    citations: [
      { source: 'Prevalence and Clinical Assessment of Skin Lesions in Systemic Lupus Erythematosus, PMC11762776', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11762776/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'lupus-history-milestones',
    category: 'lupus',
    title: "Lupus's Own History: Named for a Rash, Understood as Systemic Only After Three Sequential Discoveries",
    teaser: '1846, 1872, 1904, 1951, the butterfly rash was described first; recognizing lupus as a whole-body, life-threatening disease took several more decades.',
    summary: "Lupus's history moves in sequential steps, each building on the last. In 1846, Ferdinand von Hebra first described the disease's now-iconic facial rash as \"butterfly\"-shaped, and separately identified that lupus could stay dormant for extended periods, an early recognition of its variable course. In 1850, Pierre Cazenave coined the term \"lupus erythemateux\" (the origin of today's \"erythematosus\") and documented hair loss as a symptom. The pivotal turning point came in 1872, when Moriz Kaposi published the first description of lupus as a systemic, potentially life-threatening disease, specifically noting it disproportionately affected young women, still true in modern epidemiology today. Osler independently confirmed this systemic nature in 1904. The modern treatment breakthrough came decades later, in 1951, when the antimalarial drug quinacrine was first used for discoid lupus, the direct precursor to hydroxychloroquine (already covered in the medication research), which remains one of the single most important lupus medications in use today.",
    citations: [
      { source: 'The History of Lupus, Lupus Foundation of America', url: 'https://www.lupus.org/resources/the-history-of-lupus' },
    ],
    overallTier: 'strong',
    relatedIds: ['lupus-hydroxychloroquine-retinopathy'],
  },
  {
    id: 'lupus-pregnancy-real-flare-neonatal',
    category: 'lupus',
    title: "Lupus Pregnancy: A Reassuring Finding for Stable Disease, and a Specific Antibody Risk to the Baby",
    teaser: "Research finds stable, well-controlled lupus carries a low flare risk during pregnancy, but two specific antibodies (anti-Ro/anti-La) carry a separate risk directly to the baby's own heart.",
    summary: "Lupus pregnancy outcomes trace closely to disease control going into it, the same preconception-timing principle already covered in the Rheumatoid Arthritis and IBD research. Research finds that when lupus is stable before conception, pregnancy is unlikely to trigger a flare at all; even among a broader population, severe flares requiring hospitalization or a major medication change occurred in only about 3% during the second and third trimesters. Separate risks still deserve direct attention: roughly 2 in 10 pregnant people with lupus develop preeclampsia, with higher risk specifically in those with a history of kidney involvement (already covered in the nephritis-monitoring research). The most specific and important finding to know in advance: anti-Ro/SS-A and anti-La/SS-B antibodies, specific antibodies some lupus patients carry, can cross the placenta and cause neonatal lupus in the baby, including, in serious cases, a congenital heart block requiring lifelong monitoring or even a pacemaker. This is a direct reason antibody status (not just disease-activity score) belongs in preconception planning, since it changes the entire monitoring plan for the pregnancy that follows.",
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
    title: 'Drug-Induced Lupus Is a Distinct, Usually Fully Reversible Condition, Not the Same Disease Under a Different Name',
    teaser: 'Certain medications, most notably hydralazine and procainamide, can trigger a lupus-like illness in a predictable, dose-dependent way that typically resolves completely once the drug is stopped.',
    summary: "Drug-induced lupus is a distinct, medication-triggered illness that mimics systemic lupus erythematosus but behaves in a different, more reassuring way, it's usually fully reversible. Historical estimates put the risk as high as 20-30% for long-term procainamide use and 5-10% for hydralazine, with drug-induced cases accounting for a 6-12% of all lupus diagnoses and an estimated 15,000 to 30,000 new cases a year in the United States. The mechanism centers on how a person metabolizes these drugs: people who are genetically \"slow acetylators\" clear procainamide and hydralazine more slowly, letting the parent compound accumulate and trigger immune dysregulation, with hydralazine's risk additionally tied to higher daily doses (above 200mg/day) and greater cumulative exposure over time. Documented host risk factors include being female, being a slow acetylator, and carrying specific genetic markers (HLA-DR4, complement C4 null alleles). Research finds drug-induced lupus generally resolves once the triggering medication is stopped, a meaningful contrast to the already-covered chronic, ongoing lupus management research. This is a practical, worth-raising question for anyone newly diagnosed with lupus-like symptoms while on a long-term medication, since identifying and stopping the actual trigger can mean the difference between a temporary illness and a lifelong one.",
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
    title: 'Antiphospholipid Syndrome: A Distinct, Clotting-Driven Condition That Often Rides Along With Lupus',
    teaser: 'Research finds antiphospholipid antibodies present in about 15% of women with recurrent miscarriage, and this syndrome can cause dangerous blood clots even in young, otherwise healthy women, separate from lupus\'s more familiar symptoms.',
    summary: "Antiphospholipid syndrome (APS), sometimes called Hughes syndrome, is a distinct autoimmune clotting disorder that can occur on its own or alongside lupus, carrying its separate and serious risks beyond the pregnancy-related content already covered in the lupus research. Research finds APS strongly associated with recurrent miscarriage, deep vein thrombosis, pulmonary embolism, and stroke, even in young, otherwise healthy women with no other apparent risk factors. Data finds antiphospholipid antibodies present in about 15% of women experiencing recurrent miscarriage, with APS itself contributing to an estimated 7-25% of recurrent pregnancy loss cases specifically, compared to under 2% in women with a low-risk obstetric history. The proposed mechanism involves these antibodies directly promoting blood clot formation or impairing blood flow through the placenta. Formal diagnosis requires two separate positive tests, at least 12 weeks apart, for either lupus anticoagulant or anticardiolipin antibodies, a deliberate double-testing requirement meant to rule out a temporary, incidental antibody blip. This is worth raising for anyone with lupus who has experienced unexplained blood clots or recurrent pregnancy loss, since APS is separately treatable (typically with blood thinners), and identifying it changes practical management decisions beyond standard lupus care alone.",
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
    title: 'Complement Proteins C3 and C4 Are Useful Early-Warning Blood Markers for an Approaching Lupus Flare',
    teaser: 'Research finds falling C3 levels can precede a clinical flare by days to weeks, and C3 specifically appears more sensitive than C4 for tracking active disease, a worth-knowing addition to the SLEDAI research.',
    summary: "Complement proteins C3 and C4, part of the immune system's normal defense machinery, are useful, practical blood markers for tracking lupus disease activity, alongside the SLEDAI scoring system already covered in the lupus research. Research finds low C3 and C4 levels commonly seen during an active lupus flare, since the disease process itself consumes these complement proteins faster than the body can replace them. Useful in practice: research finds falling C3 over the course of weeks can precede an actual clinical flare by days to weeks, giving a measurable early-warning signal before symptoms fully develop. Research also finds C3 specifically appears more sensitive than C4 for this purpose, with C3 tending to normalize with high specificity during remission, while C4 shows no comparably reliable pattern. In lupus nephritis specifically (already covered in the nephritis-monitoring research), research finds complement levels correlating directly with kidney disease activity and rising back toward normal after 6 months of effective treatment. Research also finds these traditional markers can reflect disease activity imperfectly on their own, and newer complement-based biomarkers are being studied as potentially more sensitive tools. This is a pair of tests worth asking about by name as part of routine lupus monitoring, giving a complementary signal alongside symptom tracking and the SLEDAI score itself.",
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
    title: 'Discoid Lupus Is a Distinct Skin-Only Condition, but Research Finds a Risk of It Progressing to Full Systemic Lupus',
    teaser: 'Research finds 6-30% of discoid lupus cases eventually progress to systemic lupus, with named, checkable risk factors (young age at onset, high ANA titers) helping identify who\'s most at risk.',
    summary:
      "Discoid lupus erythematosus (DLE) is a distinct, chronic skin-only form of lupus, causing scarring, disc-shaped skin lesions, and it's worth knowing directly that it's not automatically the same thing as systemic lupus, though a minority of cases do eventually progress. Research finds progression rates from DLE to full systemic lupus erythematosus (SLE) ranging from 6% to 21% in earlier studies, with a more recent, larger systematic review finding higher rates, 30.0% in pediatric cases and 25.4% in adults. Specific, checkable risk factors for this progression have been identified: age younger than 25 at DLE diagnosis, widespread (rather than localized) lesions, joint pain or arthritis, anemia, low white blood cell counts, high erythrocyte sedimentation rates, and high antinuclear antibody (ANA) titers (specifically 1:320 or higher) all independently associated with a greater chance of progressing to severe systemic disease. Research also finds a family history of rheumatic disease among the contributing risk factors. This gives someone diagnosed with discoid lupus, or a doctor monitoring them, a concrete, evidence-backed checklist for deciding how closely to monitor for systemic involvement, rather than treating every DLE diagnosis as either automatically benign or automatically destined to become systemic.",
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
      "Glucocorticoids (prednisone and related steroids) are the single most consistently used medication in lupus treatment, and they carry a dose-dependent bone cost: they suppress the cells that build new bone while doing nothing to slow the cells that break it down. Reported osteoporosis rates in lupus patients vary widely by population, from 10.3% in one British cohort to 21.7% in a Chinese cohort, with osteopenia (the milder, earlier stage of bone loss) affecting closer to half of patients in most studies. A more striking finding: fracture risk in lupus runs about 22% higher than in the general population, roughly doubling after ten or more years of disease, and fractures happen even in patients whose bone-density scan looks normal. In one cohort, fewer than a third of patients who actually fractured had a bone-density score low enough to be formally called osteoporotic. That gap matters, since standard fracture-risk calculators were built around bone density alone and can underestimate risk in someone on long-term glucocorticoids. Rheumatology guidance calls for daily calcium and vitamin D alongside ongoing steroid treatment, with one lupus-specific analysis recommending at least 1,000mg of calcium and 600 IU of vitamin D a day, and bisphosphonate medication added for anyone on a higher steroid dose. This is a plannable part of long-term lupus management, not an unavoidable side effect to simply accept.",
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
    title: 'Neuropsychiatric Lupus Is Common, and Underrecognized Alongside the More Familiar Symptoms',
    teaser: 'Research finds neuropsychiatric symptoms in roughly 30-40% of lupus patients, with cognitive dysfunction alone affecting close to 38%, often mistaken for something else entirely.',
    summary:
      "Lupus's reputation centers on joints, skin, and kidneys, but the disease can reach the brain and nervous system directly, a category called neuropsychiatric lupus (NPSLE). Research finds it affects roughly 30 to 40% of lupus patients overall, spanning a wide range from common, milder symptoms to rare, severe ones. Cognitive dysfunction (measurable trouble with memory, attention, and processing speed) is the single most common form, with a pooled prevalence near 38%, and headaches, anxiety, and mood disorders round out the most frequent presentations. More severe manifestations, seizures and psychosis, are each less common, affecting roughly 4 to 6% of patients, but real and serious when they occur. This range of symptoms is easy to misattribute, cognitive fog and mood changes especially can get chalked up to stress, depression, or simple fatigue rather than recognized as a direct manifestation of the disease itself. Anyone with lupus experiencing new or worsening cognitive, mood, or neurological symptoms has standing to raise the specific possibility of neuropsychiatric involvement directly, rather than assuming it's unrelated to their underlying condition.",
    citations: [
      { source: 'Neuropsychiatric Systemic Lupus Erythematosus: A Systematic Review, PMC11227614', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11227614/' },
    ],
    overallTier: 'strong',
    relatedIds: ['lupus-sledai-disease-activity', 'lupus-antiphospholipid-syndrome'],
  },
  {
    id: 'lupus-anifrolumab-new-biologic',
    category: 'lupus',
    title: 'A New Kind of Lupus Medication, Targeting a Different Part of the Immune System Than Belimumab',
    teaser: 'Anifrolumab blocks a distinct immune signal (type I interferon), and its landmark trial found 47.8% of patients responded, against 31.5% on placebo.',
    summary:
      "This category's research already covers belimumab, the first lupus-specific biologic in over 50 years, targeting a B-cell survival signal. Anifrolumab is a different, more recently approved biologic, targeting a separate part of the immune system entirely: the type I interferon receptor, blocking a signaling pathway that's specifically overactive in a large share of lupus patients. Its own landmark trial (TULIP-2), a randomized, placebo-controlled study of 362 patients, found 47.8% of the anifrolumab group reached a validated composite measure of improvement (BICLA response) at 52 weeks, compared with 31.5% on placebo, a statistically significant difference. Anifrolumab was FDA-approved in 2021 based on this and a companion trial, and more recently gained approval as a more convenient once-weekly self-administered injection rather than only an infusion. Having two mechanistically different biologic options (belimumab targeting B cells, anifrolumab targeting interferon signaling) matters, since lupus itself varies person to person in which immune pathway is driving the most disease activity, and a doctor can help match a specific medication to a specific person's own disease pattern rather than treating every biologic option as functionally interchangeable.",
    citations: [
      { source: 'Trial of Anifrolumab in Active Systemic Lupus Erythematosus, New England Journal of Medicine 2020, PMID 31851795', url: 'https://pubmed.ncbi.nlm.nih.gov/31851795/' },
    ],
    overallTier: 'strong',
    relatedIds: ['lupus-belimumab-biologic'],
  },
  {
    id: 'lupus-mycophenolate-cyclophosphamide-nephritis',
    category: 'lupus',
    title: 'A Landmark Trial Found a Better-Tolerated Drug Matches an Older, Harsher Standard for Kidney Involvement',
    teaser: 'The ALMS trial found mycophenolate mofetil at least as effective as intravenous cyclophosphamide for inducing remission in lupus nephritis, with a meaningfully more favorable side-effect profile.',
    summary:
      "This category's already-covered lupus nephritis monitoring research names WHAT to track, research on treatment itself answers an important, practical question: which medication actually induces remission best. Intravenous cyclophosphamide was the long-standing standard treatment, but carries serious side effects, including infertility risk and increased infection susceptibility. The landmark Aspreva Lupus Management Study (ALMS), an international, 370-patient randomized trial, tested mycophenolate mofetil directly against intravenous cyclophosphamide as induction therapy for active lupus nephritis over 24 weeks. The result: mycophenolate mofetil was at least as effective, and in this trial's data, numerically more effective, at inducing remission, with a meaningfully more favorable safety profile than cyclophosphamide. This trial gave rheumatologists a better-tolerated first option for a serious complication, one this category's research already treats as needing prompt, aggressive treatment. A practical detail to raise directly with a treating doctor: which of these two options is being used, and why, since individual factors (disease severity, kidney function, and personal treatment goals around future fertility) can reasonably shift that shared decision either way.",
    citations: [
      { source: 'Mycophenolate mofetil versus cyclophosphamide for induction treatment of lupus nephritis, Journal of the American Society of Nephrology 2009 (Appel et al.), PMID 19369404', url: 'https://pubmed.ncbi.nlm.nih.gov/19369404/' },
    ],
    overallTier: 'strong',
    relatedIds: ['lupus-nephritis-monitoring'],
  },
  {
    id: 'lupus-nsaid-aseptic-meningitis',
    category: 'lupus',
    title: 'A Specific, Startling Reaction: Some Lupus Patients Develop Meningitis-Like Symptoms From Ordinary Ibuprofen',
    teaser: 'A documented, repeatable reaction links lupus specifically to NSAID-induced aseptic meningitis, symptoms resembling true meningitis that resolve within days once the drug is stopped.',
    summary:
      "NSAIDs (ibuprofen and related pain relievers) carry a specific, striking risk in lupus that's easy to miss entirely, since it's rare and its symptoms mimic a much more alarming infection. Case literature finds lupus the single most common underlying condition behind NSAID-induced aseptic meningitis, a drug-triggered inflammatory reaction in the membranes surrounding the brain and spinal cord, producing symptoms (headache, fever, neck stiffness, confusion) that closely resemble true infectious meningitis. Ibuprofen is the most frequently implicated trigger, though case reports also name several other NSAIDs. The proposed mechanism involves a hypersensitivity reaction specifically confined to the central nervous system, research finds affected individuals often experience the reaction again with even a small repeat dose of the same drug, a distinctive pattern pointing to drug sensitivity rather than coincidence. Reassuringly, once recognized: case reports consistently find symptoms resolve within 48 hours simply by stopping the NSAID, with no lasting effects. For anyone with lupus, a sudden meningitis-like reaction after starting or restarting an NSAID is worth raising directly and immediately, both to stop the specific drug and to avoid an unnecessary, invasive workup for a suspected true infection that isn't actually present.",
    citations: [
      { source: 'Aseptic meningo-encephalitis related to dexibuprofen use in a patient with systemic lupus erythematosus: a case report with MR findings, PMID 12195787', url: 'https://pubmed.ncbi.nlm.nih.gov/12195787/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['lupus-drug-induced-reversible'],
  },
  {
    id: 'lupus-late-onset-after-50-milder',
    category: 'lupus',
    title: 'Lupus Diagnosed After 50 Looks Different, Often Milder, and Easily Mistaken for Aging',
    teaser: 'One in five lupus diagnoses happens at age 50 or later, and data finds this later-onset form tends to be milder, with less kidney involvement and fewer of the classic warning signs.',
    summary:
      "Lupus is often pictured as a young woman's disease, but a meaningful share of cases, 20% by one estimate, are diagnosed at age 50 or later, and this late-onset form has its distinct clinical shape. Comparative data finds late-onset lupus produces lower disease-activity scores on average, with significantly less fever, fewer of the classic skin and mucous-membrane findings, and fewer positive antibody results than lupus diagnosed earlier in life. The practical risk this creates: late-onset lupus often lacks the textbook butterfly rash and is less likely to involve the kidneys at the outset, instead presenting as pleurisy or pericarditis (inflammation around the lungs or heart), persistent dry eyes and mouth, or joint and muscle aches that get chalked up to ordinary osteoarthritis or general wear and tear. Serologically, late-onset patients are less likely to test positive for anti-dsDNA and RNP antibodies, and more likely to test positive for rheumatoid factor, a pattern that can point evaluation toward the wrong diagnosis. Cohort data does describe a milder overall disease course with less frequent kidney involvement in this later-onset group, honest reassurance that softens, but does not erase, the risk of a slower, harder-to-recognize diagnosis in this age group.",
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
    title: "Lupus Doesn't Just Affect Some Groups More Often, It Hits Harder, a Quantified Gap",
    teaser: 'Lupus runs 2 to 3 times more common in African American, Hispanic/Latina, Native American, and Pacific Islander women than in White women, and data finds it also causes more severe kidney disease in these same groups.',
    summary:
      "Lupus shows one of the most consistent and best-documented disparities across race and ethnicity of any condition covered here, in both how often it occurs and how severely it behaves once it does. US population data finds lupus 2 to 3 times more prevalent among African American, Hispanic/Latina, Native American, Alaska Native, and Native Hawaiian/Pacific Islander women compared with White women. The severity gap is just as real and just as measurable: lupus nephritis (kidney involvement) occurs at 59.69 per 100,000 in African American individuals and 56.56 per 100,000 in Asian individuals, compared with just 15.83 per 100,000 in White individuals, and the adjusted risk of developing lupus nephritis specifically runs 4.3 times higher in Asian/Pacific Islander patients, 2.4 times higher in African American patients, and 2.3 times higher in Hispanic patients, all compared with White patients. This is quantified evidence that lupus is not one uniform disease experience worldwide, ancestry-linked genetic factors combine with documented disparities in healthcare access and social support to produce measurably different outcomes by ethnicity, a reason ancestry and regional healthcare context both belong in how any individual person's own lupus risk and monitoring plan gets thought through.",
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
    title: 'A Documented Workplace Exposure Raises Lupus Risk Independent of Ethnicity or Region',
    teaser: 'Multiple US population studies found occupational crystalline silica dust exposure directly linked to elevated lupus risk, with longer exposure tracking with greater risk.',
    summary:
      "This category's already-covered ethnicity and severity research explains much of lupus's geographic variation; a separate, occupational factor adds another layer that cuts across region and ancestry alike. Multiple population-based case-control studies in the United States, including a study across 60 contiguous counties in the southeastern US and a separate study focused on urban, predominantly African American neighborhoods in Boston, both found occupational exposure to crystalline silica dust (a common exposure in mining, construction, sandblasting, and similar industrial work) directly linked to increased lupus risk. The proposed mechanism: crystalline silica appears to act as an immune adjuvant, meaning it directly amplifies inflammation and antibody production rather than simply irritating tissue, and research finds a longer duration of silica exposure tracking with a greater lupus risk, a dose-response relationship. This is an occupational risk factor that exists independent of the ethnicity-driven risk already covered elsewhere in this category, meaning someone's own individual job history (mining, construction, sandblasting, and similar industrial silica-dust-generating work) is worth naming directly to a doctor alongside family history and ancestry when thinking through personal lupus risk, a modifiable exposure in a category where most other risk factors already covered aren't.",
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
    title: 'Striking Early Data: a One-Time Cell Therapy Put Severe Lupus Into Lasting Remission',
    teaser: 'CAR-T cell therapy is producing some of the most dramatic trial results anywhere in this Digest for lupus, with disease-activity scores dropping from 10.6 to 2.7 in three months and some patients reaching medication-free remission out to 46 months.',
    summary: "Of every experimental treatment covered anywhere across the research-horizon entries, lupus's CAR-T cell data is among the most striking. This category's already-covered belimumab and mycophenolate research targets specific pieces of the immune response; CAR-T cell therapy resets it more completely, engineering a patient's own immune cells to hunt down and eliminate the B cells producing the harmful autoantibodies driving lupus. Trial results: mean SLE Disease Activity Index scores fell from 10.6 at baseline to 2.7 at 3 months in one trial, kidney function significantly improved in lupus nephritis patients within 90 days, and some patients reached complete symptom- and medication-free remission with follow-up extending as far as 46 months out. A newer allogeneic version (using donor cells rather than the patient's own) showed the same efficacy with no graft-versus-host disease, cytokine release syndrome, or neurotoxicity observed, safety signals that matter directly given how serious CAR-T's known risks can be in other diseases. This remains early-phase, small-trial data, not yet a broadly available treatment, but it represents the most advanced CAR-T application of any autoimmune condition.",
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
    title: "A New Drug Could Become the First Advance for Lupus's Own Skin Symptoms in 70 Years",
    teaser: 'Litifilimab targets a specific cell type driving lupus skin disease, and two separate, Phase 2 trials both found it significantly reducing disease activity, evidence supporting an FDA Breakthrough Therapy designation.',
    summary: "This category's already-covered belimumab and anifrolumab research targets B cells and a broad interferon pathway; litifilimab works through a more specific target, blood dendritic cell antigen 2 (BDCA2), found on the exact immune cells most directly implicated in lupus's skin disease. Two separate, Phase 2 trials, LILAC (published in the New England Journal of Medicine) and the more recent AMETHYST, both found litifilimab meeting its primary endpoint, a significant reduction in skin disease activity, with more patients on the drug reaching clear or almost-clear skin than on placebo. It's direct significance is stated plainly by the field itself: if confirmed in larger trials, it could become the first new, innovative therapy specifically approved for cutaneous lupus erythematosus in 70 years, evidence strong enough that it has already earned FDA Breakthrough Therapy designation, a formal signal the FDA reserves for drugs showing substantial improvement over existing treatment in early testing. This is twice-replicated Phase 2 evidence, stronger than most single-trial results covered elsewhere in the Research Horizon entries, though Phase 3 confirmation is still the next required step before approval.",
    citations: [
      { source: 'Trial of Anti-BDCA2 Antibody Litifilimab for Cutaneous Lupus Erythematosus, New England Journal of Medicine', url: 'https://www.nejm.org/doi/full/10.1056/NEJMoa2118024' },
    ],
    overallTier: 'strong',
    relatedIds: ['horizon-lupus'],
  },
  {
    id: 'lupus-nephritis-isn-rps-classification',
    category: 'lupus',
    title: 'The Six-Class System That Decides How Aggressively Lupus Nephritis Gets Treated',
    teaser: 'A kidney biopsy in lupus is graded on a formal six-class scale, and the class assigned changes the treatment plan directly, not just the paperwork.',
    summary:
      "Lupus nephritis (kidney inflammation from lupus, already covered by this category's monitoring/immunosuppressant entries) is graded on a formal pathology system, the ISN/RPS classification, jointly published by the International Society of Nephrology and the Renal Pathology Society. A kidney biopsy is assigned one of six classes: Class I is minimal, near-normal tissue under the microscope; Class II shows mild mesangial changes; Classes III and IV are focal and diffuse proliferative disease, the most aggressive, most kidney-damaging forms, with Class IV alone affecting close to half of all lupus nephritis patients in cohort data; Class V is membranous disease, a different damage pattern centered on the kidney's filtering membrane; Class VI is advanced, largely irreversible scarring. This isn't just a label. Clinical guidance treats Class III/IV disease far more aggressively, with immunosuppressant combinations, than Class I/II, and a large prognosis study confirmed the classification's predictive value: it directly forecasts long-term kidney outcome, not just describes the biopsy. The classification was formally revised in 2018 to fix ambiguities in the original 2003 version, a sign that even a well-established grading system keeps getting refined as more evidence comes in.",
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
    title: "Cold, White Fingers Aren't Just a Nuisance in Lupus, They Can Be a Warning Sign",
    teaser: "Raynaud's phenomenon shows up in a meaningful share of lupus patients, and in one specific, subgroup it's directly tied to a much higher risk of dangerous blood clots.",
    summary: "Raynaud's phenomenon, fingers (and sometimes toes) turning white or blue and going numb in cold or stress, is a common lupus symptom, caused by small blood vessels in the extremities overreacting and clamping down. On its it's usually manageable, more an uncomfortable inconvenience than a medical emergency. The worth-knowing finding is what it signals in one specific, identifiable subgroup: among lupus patients who also test positive for antiphospholipid antibodies (an already-covered risk factor for the antiphospholipid-syndrome entry), a study found roughly one in five carried Raynaud's phenomenon, and both lupus nephritis and Raynaud's phenomenon independently predicted a significantly higher risk of vascular thrombosis, actual dangerous blood clots, in that same antiphospholipid-positive population. This doesn't mean everyone with cold fingers and lupus is at high clotting risk. It means Raynaud's phenomenon, in someone who already tests antiphospholipid-positive, is an additional signal worth naming to a rheumatologist directly rather than dismissed as a minor circulation quirk, since it's one of the concrete features that tracks with a much more serious outcome in that specific population.",
    citations: [
      { source: "Lupus nephritis and Raynaud's phenomenon are significant risk factors for vascular thrombosis in SLE patients with positive antiphospholipid antibodies, PubMed", url: 'https://pubmed.ncbi.nlm.nih.gov/17805483/' },
    ],
    overallTier: 'strong',
    relatedIds: ['lupus-antiphospholipid-syndrome', 'lupus-nephritis-monitoring'],
  },
  {
    id: 'lupus-fatigue-real-prevalence-mechanism',
    category: 'lupus',
    title: "Fatigue Is the Single Most Common Lupus Symptom, and Research Finds It Doesn't Track With Lab-Measured Disease Activity",
    teaser: 'Cohort data finds 53 to 80% of lupus patients naming fatigue as a primary symptom, and research finds it doesn\'t rise and fall with standard disease-activity lab measures the way flares do.',
    summary:
      "This category's already-covered skin, joint, kidney, and blood findings are all real and measurable, but cohort research consistently finds fatigue is the single most commonly reported lupus symptom of all, with 53 to 80 percent of patients naming it as a primary concern across multiple studies, and one Malta-based cohort finding 56.5 percent scoring in the abnormal-fatigue range on a validated scale. The counterintuitive finding: a large multiethnic cohort study (the LUMINA cohort, 515 patients across 2,609 visits) found fatigue was NOT associated with standard disease-activity or organ-damage scores, the same measures already covered elsewhere in this category for tracking lupus's severity. Instead, research found fatigue tracked more closely with pain, feelings of helplessness, and constitutional symptoms, and a separate, well-documented bidirectional relationship with poor sleep and depression, both already covered elsewhere in this category. This means a lupus patient can have fatigue severe enough to be disabling while lab work and standard disease-activity scores look reassuring, evidence that fatigue deserves its own direct attention and treatment approach, not dismissal just because bloodwork doesn't explain it.",
    citations: [
      { source: 'Fatigue in systemic lupus erythematosus, PMC3380630', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3380630/' },
      { source: 'Disease activity and damage are not associated with increased levels of fatigue in systemic lupus erythematosus patients from a multiethnic cohort, PMID 19714612', url: 'https://pubmed.ncbi.nlm.nih.gov/19714612/' },
    ],
    overallTier: 'strong',
    relatedIds: ['lupus-sledai-disease-activity', 'lupus-photosensitivity-vitamin-d-catch22'],
  },
  {
    id: 'lupus-lldas-treat-to-target',
    category: 'lupus',
    title: 'A Named Treatment Target Now Gives Lupus Care a Concrete, Measurable Goal',
    teaser: 'The Lupus Low Disease Activity State (LLDAS) is a formally validated treatment target, and multinational cohort data finds reaching it directly protects against organ damage and death.',
    summary:
      "This category's already-covered SLEDAI disease-activity scoring gives lupus a moment-in-time severity measure, and LLDAS builds directly on it as a formally defined treatment target, not just a research concept: a specific combination of low disease activity, minimal or no new symptoms, a stable, low-dose (or no) steroid regimen, and only well-tolerated standard medication. A large, multinational prospective cohort study, published in The Lancet Rheumatology, found that sustaining LLDAS over time was directly associated with significantly better outcomes across flares, organ damage accumulation, quality of life, and mortality, formal validation strong enough that treat-to-target strategies (aiming for a specific, measurable state rather than just symptom relief) are now established in lupus management. A direct, kidney-specific application already ties into this category's nephritis-monitoring research: a study found reaching LLDAS specifically reduced renal relapse risk and helped preserve long-term kidney function in patients with lupus nephritis, with 49 percent of one cohort reaching it within a year of treatment. This gives a concrete, measurable benchmark to discuss with a rheumatologist, something more specific and actionable than a general sense of feeling better or worse.",
    citations: [
      { source: 'Association of sustained lupus low disease activity state with improved outcomes in systemic lupus erythematosus, The Lancet Rheumatology', url: 'https://www.thelancet.com/journals/lanrhe/article/PIIS2665-9913(24)00121-8/abstract' },
      { source: 'Reduction in Renal Relapse and Preservation of Long-Term Kidney Function After Lupus Low Disease Activity in Patients With Lupus Nephritis, PMC12919694', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12919694/' },
    ],
    overallTier: 'strong',
    relatedIds: ['lupus-sledai-disease-activity', 'lupus-nephritis-monitoring'],
  },
  {
    id: 'lupus-uv-light-flare-mechanism',
    category: 'lupus',
    title: "Research Now Explains, at a Cellular Level, Exactly How Sunlight Triggers a Lupus Flare",
    teaser: "This category's already-covered sun-versus-vitamin-D catch-22 gets mechanistic depth: UV light directly damages skin cells in a way lupus patients' own bodies can't clear efficiently, setting off an inflammatory cascade reaching well beyond the skin.",
    summary:
      "This category's already-covered photosensitivity entry names the tradeoff between sun avoidance and vitamin D, and current research now explains the actual mechanism behind why sun exposure triggers a flare in the first place. When UV light damages skin cells, those cells die through a normal process called apoptosis, and in someone without lupus, the body efficiently clears the resulting cellular debris. Research finds that in lupus, this clearing process is impaired, so those dead-cell fragments linger and form immune complexes that persist in the body far longer than they should, directly triggering an autoimmune response. Separate mechanistic research adds two further layers: UV exposure directly triggers production of specific proinflammatory cytokines (TNF-alpha, IL-6, IL-1) that drive the visible skin inflammation of a sun-triggered flare, and a current Hospital for Special Surgery study found UV exposure also impairs lymphatic drainage, altering immune activity in nearby lymph nodes in a way that appears to make the resulting immune response more pathogenic, a new piece connecting a skin-level trigger to lupus's systemic reach. This is current mechanistic science actively explaining a symptom lupus patients have long reported anecdotally, and it directly reinforces why sun protection measures already covered elsewhere in this category aren't precautionary overkill, they're addressing a now well-characterized biological trigger.",
    citations: [
      { source: 'Human and Murine Evidence for Mechanisms Driving Autoimmune Photosensitivity, PMC6205973', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6205973/' },
      { source: 'HSS Research Uncovers How UV Light Triggers Immune Activation and Disease Flares in Lupus, Hospital for Special Surgery', url: 'https://news.hss.edu/hss-research-uncovers-how-uv-light-triggers-immune-activation-and-disease-flares-in-lupus/' },
    ],
    overallTier: 'strong',
    relatedIds: ['lupus-photosensitivity-vitamin-d-catch22', 'lupus-skin-blood-neuro-real-data'],
  },
  {
    id: 'lupus-kidney-transplant-real-outcomes',
    category: 'lupus',
    title: "Kidney Transplant for Lupus Nephritis Went From 'Contraindicated' to a Safe, Strongly-Recommended Option",
    teaser: "This category's already-covered nephritis monitoring names progression risk, current transplant data finds patient survival matching non-lupus transplant recipients, with a low recurrence rate.",
    summary:
      "This category's already-covered lupus nephritis and ISN/RPS staging research names serious kidney damage risk, and for the minority who progress to end-stage kidney disease, transplant outcomes have transformed. Current data directly contradicts an older assumption that lupus made transplant too risky: one study found patient survival at 98 percent at 1, 10, and even 15 years post-transplant, statistically comparable to age- and sex-matched controls without lupus, and a separate cohort found graft survival rates of 98, 98, 88, 85, and 78 percent at 1, 5, 10, 15, and 20 years respectively. Research directly explains why survival improved: transplant itself was found to carry a survival benefit over remaining on dialysis, driven mainly by reduced cardiovascular and infection-related deaths, both already covered elsewhere in this category as lupus complications. The worth-knowing caveat: a systematic review and meta-analysis found lupus nephritis transplant recipients showing somewhat lower survival than transplant recipients with other causes of kidney failure, particularly with deceased-donor kidneys, honest context rather than an unqualified success story. A reassuring, additional finding: lupus nephritis actually recurring in the new, transplanted kidney is rare, just 0.94 percent per person-year. Transplant, once viewed with caution in lupus specifically, is now current, guideline-supported best practice for eligible patients with end-stage lupus nephritis.",
    citations: [
      { source: 'Renal Transplantation and Survival Among Patients With Lupus Nephritis: A Cohort Study, PMC6739121', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6739121/' },
      { source: 'Graft survival and mortality outcomes after kidney transplant in patients with lupus nephritis: a systematic review and meta-analysis, PMC10773647', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10773647/' },
    ],
    overallTier: 'strong',
    relatedIds: ['lupus-nephritis-monitoring', 'lupus-nephritis-isn-rps-classification'],
  },
  {
    id: 'lupus-c1q-complement-deficiency-genetic',
    category: 'lupus',
    title: "A Rare Genetic Deficiency Carries the Single Strongest Known Risk for Developing Lupus",
    teaser: "Research finds more than 90% of people with hereditary C1q deficiency, an extremely rare genetic condition, going on to develop lupus, evidence of the strongest single genetic risk factor identified for the disease.",
    summary:
      "This category's already-covered global and occupational risk research names population-level lupus risk factors, and one rare, specific genetic condition carries an individually stronger risk than any of them. C1q deficiency, an extremely rare, inherited (autosomal recessive) condition caused by mutations in the genes encoding the C1q complement protein (C1QA, C1QB, C1QC), is direct evidence of just how central this specific protein is to preventing autoimmunity: research finds more than 90 percent of people with this genetic deficiency going on to develop lupus or a lupus-like disease, the single strongest known genetic risk factor for the condition, well above the more modest risk contributions from more common genetic variants. Research finds C1q-deficiency-associated lupus presenting with its own, distinct pattern in children, earlier onset, lower anti-dsDNA antibody levels than typical lupus, and predominant skin involvement. Broader pediatric cohort data finds low C1q levels present in 27 percent of pediatric lupus patients overall (not full genetic deficiency, just reduced levels), alongside low C2, C3, and C4 in a meaningful minority too, evidence the complement system's broader role in lupus extends well beyond this one rare genetic extreme. C1q deficiency itself is rare, but the striking near-total penetrance (over 90 percent developing lupus) makes it scientifically important evidence for exactly how complement-system function protects against autoimmunity in general, a direct biological clue behind a disease this category's overview already names as complex in its causes.",
    citations: [
      { source: 'Complement deficiency in pediatric-onset systemic lupus erythematosus, PMC5896194', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5896194/' },
      { source: 'C1q monogenic lupus: a case series and review, Rheumatology Advances in Practice', url: 'https://academic.oup.com/rheumap/article/9/3/rkaf064/8153090' },
    ],
    overallTier: 'strong',
    relatedIds: ['lupus-overview', 'lupus-global-silica-occupational-clusters'],
  },
  {
    id: 'lupus-hydroxychloroquine-adherence-flare-prevention',
    category: 'lupus',
    title: 'Hydroxychloroquine Prevents Flares, But Only If It Actually Gets Taken, and Adherence Is a Documented Problem',
    teaser: "This category's already-covered hydroxychloroquine-retinopathy entry names a rare eye-safety risk from long-term use, the drug's quantified flare-prevention benefit is tied to how consistently it's actually taken, and data finds adherence a common problem.",
    summary:
      "This category's already-covered hydroxychloroquine-retinopathy research names a rare, monitorable safety risk from this same drug's long-term use, and the direct flare-prevention benefit deserves its own coverage, alongside the honest problem of adherence that can undercut it. Evidence finds hydroxychloroquine reduces major lupus flares by a substantial 57 percent, one of this disease's most consistently demonstrated treatment effects, and research finds an even more specific, actionable detail: lower hydroxychloroquine blood levels track with a two-to-six-fold higher risk of a flare, meaning the benefit is dose- and consistency-dependent, not an all-or-nothing effect of simply being prescribed the drug. The honest complication: adherence to hydroxychloroquine is a well-documented, common clinical problem, with research finding poor adherence declining further over just the first year of use, and Medicaid-beneficiary data confirming this pattern directly. Research names the practical stakes plainly: poor adherence is associated with a higher risk of flares, disease-related morbidity, hospitalizations, and worse kidney outcomes specifically, serious consequences from something as simple as inconsistent pill-taking. A more actionable finding follows directly from this: monitoring hydroxychloroquine BLOOD LEVELS directly, rather than assuming a prescription equals consistent use, is a practical way to catch and correct low adherence before a flare happens. This well-established drug's benefit depends on consistent use, worth a direct, honest conversation about any barriers to taking it as prescribed, not just whether it was originally prescribed at all.",
    citations: [
      { source: 'Hydroxychloroquine in systemic lupus erythematosus: overview of current knowledge, PMID 35186126', url: 'https://pubmed.ncbi.nlm.nih.gov/35186126/' },
      { source: 'A Reference Range of Hydroxychloroquine Blood Levels that Can Reduce Odds of Active Lupus and Prevent Flares, PMC11078155', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11078155/' },
    ],
    overallTier: 'strong',
    relatedIds: ['lupus-hydroxychloroquine-retinopathy', 'lupus-nephritis-monitoring'],
  },
  {
    id: 'lupus-mediterranean-diet-real-data',
    category: 'lupus',
    title: 'How Diet Affects Lupus: A 280-Patient Study Found Mediterranean Eating Directly Tracks With Lower Disease Activity',
    teaser: "This category's already-covered alfalfa-sprout and omega-3 findings cover individual foods, a direct study of overall dietary pattern found Mediterranean diet adherence inversely tracking with lupus's disease-activity score.",
    summary:
      "This category's already-covered alfalfa-sprout and omega-3 research each covers one specific food or nutrient, and direct research answers the broader question of how overall diet affects lupus as a whole. A cross-sectional study of 280 lupus patients found a statistically significant inverse relationship between Mediterranean diet adherence and SLEDAI, this category's already-covered formal disease-activity score, meaning higher diet adherence tracked directly with lower measured disease activity. The same study found an even stronger inverse relationship with SDI, the cumulative organ-damage score, and found lower inflammation (measured via hs-CRP) tracking with higher diet adherence too. Specific dietary components driving this: eating more olive oil, fruit, vegetables, and fish, while eating less red meat, processed meat, sugar, and pastries, correlated with both less disease activity and less accumulated damage. A separate study found the odds of having active lupus (SLEDAI 5 or higher) or measurable organ damage were both significantly lower among patients with higher Mediterranean diet scores. This is strong correlational evidence from a substantial sample, not yet a randomized trial proving direct causation, but it's an actionable, low-risk dietary pattern worth adopting alongside this category's already-covered medical treatments, not a replacement for them.",
    citations: [
      { source: 'Beneficial effect of Mediterranean diet on disease activity and cardiovascular risk in systemic lupus erythematosus patients: a cross-sectional study, PMID 32594173', url: 'https://pubmed.ncbi.nlm.nih.gov/32594173/' },
      { source: 'Beneficial effects associated to a healthy lifestyle in systemic lupus erythematosus, PMID 37169766', url: 'https://pubmed.ncbi.nlm.nih.gov/37169766/' },
    ],
    overallTier: 'strong',
    relatedIds: ['lupus-alfalfa-canavanine', 'lupus-omega3-fish-oil', 'lupus-sledai-disease-activity'],
  },
  {
    id: 'lupus-voclosporin-aurora-trial-real-data',
    category: 'lupus',
    title: 'A Landmark Trial Found Adding a Newer Drug Nearly Doubled Complete Kidney-Disease Remission',
    teaser: "This category's already-covered mycophenolate/nephritis-treatment research names established therapy, a landmark Lancet trial found adding voclosporin, a newer drug, on top of standard treatment achieved complete renal response in 41% of patients, versus 23% with standard treatment alone.",
    summary:
      "This category's already-covered lupus-nephritis treatment research already names mycophenolate mofetil as an established therapy, and voclosporin, a newer calcineurin inhibitor, gives this category's already-strong treatment options a direct additional advance. The AURORA 1 trial, a double-blind, randomized, placebo-controlled Phase 3 trial published in The Lancet, added voclosporin on top of standard mycophenolate-and-low-dose-steroid treatment and compared it against standard treatment plus placebo. The quantified result at 52 weeks: complete renal response was achieved in 41 percent of the voclosporin group (73 of 179 patients) versus 23 percent of the placebo group (40 of 178 patients), a statistically significant difference (odds ratio 2.65). More recent case-series evidence finds voclosporin combined with belimumab (an already-established biologic already covered elsewhere in this category) highly effective at both inducing AND maintaining kidney remission in difficult cases. This near-doubling of complete remission is a meaningful advance given that, per this category's already-covered research, nearly half of all lupus patients develop kidney involvement at some point, direct evidence worth a specific conversation with a rheumatologist about whether adding voclosporin to a current treatment plan is appropriate, rather than assuming mycophenolate alone remains the only modern option.",
    citations: [
      { source: 'Efficacy and safety of voclosporin versus placebo for lupus nephritis (AURORA 1), The Lancet, PMID 33971155', url: 'https://pubmed.ncbi.nlm.nih.gov/33971155/' },
    ],
    overallTier: 'strong',
    relatedIds: ['lupus-nephritis-monitoring', 'lupus-mycophenolate-cyclophosphamide-nephritis'],
  },
  {
    id: 'lupus-fermented-drinks',
    category: 'lupus',
    title: 'Fermented Drinks and Foods for Lupus',
    teaser: 'Rejuvelac\'s sprouted-grain fermentation shares its name with lupus\'s well-documented alfalfa sprout trigger, worth a direct reassurance rather than leaving the connection unaddressed.',
    summary: 'This app\'s Rejuvelac (in Recipes) sprouts quinoa, not alfalfa, and quinoa doesn\'t carry L-canavanine, the specific amino acid documented to trigger lupus flares by mimicking arginine and overstimulating the immune system. That mechanism is well-established at the lab and case-report level, though rigorous human trial data specifically linking alfalfa ingestion to flares is still thin. Beyond that one direct reassurance, the general caution already named elsewhere in this app for immune-stimulating ferments applies here too: the Wild-Fermented Elderberry Tonic and Fermented Garlic Honey Tonic both lean on compounds with a traditional reputation for stimulating immune activity, worth mentioning to your care team before regular use if you\'re on an immunosuppressant.',
    citations: [
      { source: 'Malinow et al. 1982, Science: systemic lupus erythematosus-like syndrome in monkeys fed alfalfa sprouts, role of L-canavanine', url: 'https://www.science.org/doi/10.1126/science.7071589' },
    ],
    overallTier: 'moderate',
    relatedIds: ['recipe-ferment-rejuvelac', 'recipe-ferment-tonic-elderberry-ginger-turmeric', 'recipe-ferment-garlic-honey-tonic'],
  },
  // 2026-08-21, added after fact-checking NOVA's "The Truth About Fat"
  // (2020) documentary against the peer-reviewed literature, direct
  // request. The documentary itself is not treated as a citable source;
  // this traces to the primary study, independently verified via
  // WebSearch.
  {
    id: 'lupus-leptin-t-cell-autoimmunity',
    category: 'lupus',
    title: 'Leptin Directly Promotes the T-Cell Autoimmunity Behind Lupus, in a Lab Study',
    teaser: 'In lupus-prone mice, leptin promoted the survival of self-attacking T cells and suppressed the regulatory cells meant to keep them in check, one of the most direct mechanistic demonstrations of this pathway in any single condition.',
    summary: "Lupus is one of the three autoimmune conditions the Basic Health hormones research names as most directly studied for leptin's pro-inflammatory role, and this is the specific study behind that. Leptin is documented as abnormally elevated in lupus, and in a study using lupus-prone mice, leptin directly promoted the survival and proliferation of autoreactive T cells (the ones that attack the body's own tissue) while suppressing regulatory T-cell activity, the same Th17-promoting, Treg-suppressing mechanism covered in the shared hormones research, demonstrated here specifically in a lupus disease model rather than just observed as a correlation. This doesn't mean body fat causes lupus, lupus is an autoimmune disease with its genetic and environmental triggers already covered elsewhere in this category, only that leptin is one mechanistically demonstrated input into how aggressively an already-present lupus immune response runs.",
    citations: [
      { source: 'Amarilyo G et al. 2013, Clinical Immunology: Leptin promotes lupus T-cell autoimmunity (PMID 23566768)', url: 'https://pubmed.ncbi.nlm.nih.gov/23566768/' },
    ],
    overallTier: 'moderate',
    stageNote: 'Direct mechanistic evidence in a mouse model of lupus, the strongest kind of evidence in this specific study, though a mouse model result, not a human clinical trial.',
    relatedIds: ['leptin-autoimmune-inflammation', 'mito-visceral-fat-treg-depletion'],
  },
];
