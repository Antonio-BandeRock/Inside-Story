import type { DigestEntry } from './types';

// Sjögren's Syndrome -- 11 entries, added 2026-08-08 as this app's tenth
// real condition, next in the same priority order every condition before
// it followed. Built with real self-advocacy content included from the
// start, the same lesson already applied to every condition since Graves'.
//
// Sjögren's is defined by its own attack on the exocrine glands (the
// glands that make moisture) -- dry eyes and dry mouth are its hallmark,
// but the real disease reaches further: a genuinely elevated lymphoma
// risk, real extraglandular complications that can strike the kidneys
// and nerves, and a real, direct, everyday food/drink relationship most
// other conditions in this app don't share, since dryness itself is
// worsened or eased by what someone eats and drinks in a very immediate,
// mechanical way (not just an inflammatory one).
//
// Distinct from otherAutoimmune.ts's own 'other-sjogrens' entry, which
// stays exactly as it was: a real gut-microbiota systematic review plus a
// brief Hashimoto's comorbidity note, studied as corroborating evidence
// for a Hashimoto's reader. This category cross-links to it rather than
// repeating its content, and covers everything else specific to actually
// living with and managing Sjögren's on its own terms.
//
// Every citation here was independently verified via WebSearch before
// being written in.
export const SJOGRENS_ENTRIES: DigestEntry[] = [
  {
    id: 'sjogrens-overview',
    category: 'sjogrens',
    title: "Sjögren's Syndrome: When the Immune System Attacks the Body's Own Moisture-Making Glands",
    teaser: 'Dry eyes and a dry mouth sound minor. The disease behind them genuinely isn\'t, and reaches further than either symptom suggests.',
    summary:
      "Sjögren's syndrome is a chronic autoimmune disease in which the immune system attacks the exocrine glands, the glands responsible for producing moisture throughout the body, most visibly the tear glands and salivary glands. The real, hallmark result is dryness: dry, gritty-feeling eyes and a dry mouth that makes swallowing, speaking, and tasting genuinely harder, but the disease can also affect moisture-producing tissue elsewhere in the body. Sjögren's can occur on its own (primary Sjögren's) or alongside another autoimmune disease, most commonly rheumatoid arthritis or lupus, both already covered in this app's own research (secondary Sjögren's) -- covered directly in this category's own closing entries. This category covers what's specific to actually living with and managing Sjögren's on its own terms -- a genuinely direct, everyday relationship with food and drink most other conditions in this app don't share, since dryness itself is worsened or eased mechanically by what someone eats and drinks, not just through a slower inflammatory pathway.",
    citations: [
      { source: "Sjögren's Syndrome, MedlinePlus, U.S. National Library of Medicine", url: 'https://medlineplus.gov/sjogrenssyndrome.html' },
    ],
    overallTier: 'strong',
    relatedIds: ['other-sjogrens'],
  },
  {
    id: 'sjogrens-dental-caries-risk',
    category: 'sjogrens',
    title: "A Real, Direct Path From Dry Mouth to Rapid Tooth Decay",
    teaser: "Saliva does more than keep the mouth comfortable. Losing it removes a real, active layer of dental protection.",
    summary:
      "Saliva isn't just a comfort function -- it does real, active protective work in the mouth: lubrication, buffering acid, clearing food particles and bacterial plaque, and fighting bacteria directly. Sjögren's own damage to the salivary glands reduces both the amount and the composition of saliva, genuinely compromising all of these protective functions at once, not just causing dryness as a standalone symptom. The real, clinical result is a documented pattern of rapid, multifocal tooth decay, often starting at the roots and gumline (areas usually well protected in someone with normal saliva flow), along with a real, elevated risk of dental restoration failure and complications around dental implants. This is a genuine, well-documented mechanism, not just \"dry mouth is uncomfortable\" -- real dental guidance for Sjögren's specifically recommends a combined approach: dietary counseling, saliva stimulation (see this category's own separate entries on xylitol and medication options), and topical remineralization products like high-fluoride toothpaste, treating the real, structural loss of saliva's own protective role directly rather than only treating the dryness itself.",
    citations: [
      { source: "Oral Manifestations of Sjögren's Syndrome: Recognition, Management, and Interdisciplinary Care", url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12843269/' },
    ],
    overallTier: 'strong',
    relatedIds: ['sjogrens-xylitol-saliva-stimulation', 'sjogrens-pilocarpine-cevimeline'],
  },
  {
    id: 'sjogrens-alcohol-caffeine-dehydration',
    category: 'sjogrens',
    title: 'Alcohol and Caffeine: A Real, Direct, Immediate Effect on Dryness',
    teaser: "Not a slow inflammatory pathway this time. A real, mechanical dehydrating effect that makes the disease's own core symptom measurably worse.",
    summary:
      "Alcohol and caffeine both have a real, genuinely direct relationship to Sjögren's own core symptom, dryness, distinct from the slower, inflammation-mediated food relationships covered elsewhere in this app. Alcohol is a real, documented diuretic that promotes dehydration, directly worsening dry eyes, dry mouth, and dry skin, with beer and wine specifically flagged as also being locally irritating to an already-dry mouth. Caffeine works the same real way, as a stimulant with its own real dehydrating effect, on top of not counting toward a day's actual fluid needs the way plain water does. Real, patient-facing clinical guidance recommends limiting or avoiding both, and separately notes that reducing caffeine and alcohol can also help with the real, commonly reported \"brain fog\" and sleep problems that come with Sjögren's. This is a real, practical, same-day-effect finding, not a long-term dietary pattern, worth knowing as one of the more directly actionable pieces of guidance in this whole category.",
    citations: [
      { source: 'Nutrition to Improve Symptoms of Sjögren\'s, Sjögren\'s Foundation', url: 'https://sjogrens.org/blog/2021/nutrition-to-improve-symptoms-of-sjogrens' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'sjogrens-xylitol-saliva-stimulation',
    category: 'sjogrens',
    title: 'Xylitol: A Real, Two-Way Fix for Dry Mouth, Not Just a Sugar Substitute',
    teaser: "The same sweetener that doesn't feed cavity-causing bacteria also genuinely stimulates the saliva Sjögren's own dryness has taken away.",
    summary:
      "Sugar-free chewing gum and lozenges containing xylitol are a real, specifically recommended tool in official Sjögren's clinical practice guidelines, and they work through two real, distinct mechanisms at once. First, the physical act of chewing itself stimulates real, mechanical saliva flow, and xylitol has a real, direct additional effect on the salivary glands beyond that. Second, and just as real: xylitol doesn't feed the bacteria responsible for tooth decay the way ordinary sugar does, directly addressing the elevated cavity risk this category's own dental-caries entry covers. Real, practical guidance suggests using a xylitol product four to five times a day, for about five minutes after meals and snacks, to genuinely stimulate saliva production when it's needed most. One real, honest caveat worth knowing: excessive gum chewing can cause real jaw or TMJ fatigue in some people, worth watching for rather than assuming more is automatically better.",
    citations: [
      { source: "Sjögren's Foundation Clinical Practice Guidelines: Oral", url: 'https://sjogrens.org/sites/default/files/inline-files/SF_PCG-Oral_0.pdf' },
    ],
    overallTier: 'strong',
    relatedIds: ['sjogrens-dental-caries-risk'],
  },
  {
    id: 'sjogrens-omega3-dry-eye-mouth',
    category: 'sjogrens',
    title: 'Omega-3: Real, Recent Trial Evidence for Both Dry Eyes and Dry Mouth at Once',
    teaser: "A real, fairly large, recent trial found the same supplement genuinely helping both of Sjögren's own hallmark symptoms together.",
    summary:
      "A real, randomized, double-blind, placebo-controlled trial (104 patients, conducted in Erbil, Iraq) tested omega-3 supplementation specifically in Sjögren's patients and found a real, statistically significant improvement in dry eye symptom scores compared to placebo, along with a real, measured improvement in dry mouth, including actual normalization of saliva-flow testing (sialometry) in the omega-3 group. This adds real, specific weight to a broader, already-established body of research on omega-3 for dry eye syndrome generally (a real meta-analysis of multiple randomized trials also supports it), and a separate real trial testing a flaxseed-and-fish-oil blend specifically designed for Sjögren's found similarly positive results for both tear and saliva production. This is a genuinely encouraging, real finding: unlike many supplement questions this app's own research covers honestly as mixed or unresolved, omega-3 in Sjögren's specifically has real, fairly consistent, positive trial support across more than one independent study.",
    citations: [
      { source: "A Randomised Double-Blind Placebo-Controlled Clinical Trial of Fish Oil (Omega-3) in Sjögren's Syndrome Patients in Erbil-Iraq", url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12183441/' },
    ],
    overallTier: 'strong',
    relatedIds: ['omega36-tying-together', 'sjogrens-vitamin-d-dry-eye-severity'],
  },
  {
    id: 'sjogrens-lymphoma-risk',
    category: 'sjogrens',
    title: "A Real, Meaningfully Elevated Lymphoma Risk Worth Knowing Directly",
    teaser: "Sjögren's carries a real, genuinely elevated risk of a specific blood cancer, most often a slow-growing, treatable kind.",
    summary:
      "Sjögren's carries a real, well-documented, meaningfully elevated risk of non-Hodgkin lymphoma, occurring in roughly 2.7% to 9.8% of Sjögren's patients over time. Real risk-ratio estimates vary depending on the study, with earlier, smaller studies suggesting risk as high as 44 times the general population, while more recent, larger studies place the real, more reliable estimate closer to six to nine times higher, still a genuinely substantial elevation worth knowing about directly, not a minor statistical footnote. The real, more reassuring context: most lymphoma that does develop in Sjögren's patients is a specific, typically slow-growing type (MALT lymphoma) rather than a more aggressive form, and the most common associated types tend to have a real, favorable prognosis when caught and treated. This is included as a real, direct, honest fact someone managing Sjögren's deserves to know plainly, not to cause alarm but because real, informed self-advocacy (persistent swollen glands, unexplained weight loss, or night sweats are worth raising with a doctor directly) depends on actually knowing this risk exists.",
    citations: [
      { source: "Cancer Risk with Sjögren's, Arthritis Foundation", url: 'https://www.arthritis.org/health-wellness/about-arthritis/related-conditions/other-diseases/non-hodgkins-lymphoma-with-sjogrens-syndrome' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'sjogrens-renal-tubular-acidosis',
    category: 'sjogrens',
    title: 'A Real, Serious Kidney Complication That Can Show Up Before the Dryness Does',
    teaser: "Sjögren's doesn't always announce itself with dry eyes first. A real kidney complication can cause sudden muscle weakness before sicca symptoms are even recognized.",
    summary:
      "Roughly one-third of Sjögren's patients develop a real extraglandular complication, meaning the disease's own damage reaches beyond the eyes and mouth entirely. The kidneys are a real, documented site of this, affecting an estimated 5% to 14% of patients in most studies, most often as a specific kidney problem called distal renal tubular acidosis (RTA), where the kidneys lose their normal ability to properly regulate the body's acid-base balance. The real, genuinely striking part of this finding: renal tubular acidosis can cause a serious drop in blood potassium levels severe enough to cause sudden muscle weakness or even temporary paralysis, and real case reports document this happening as the very first noticeable sign of Sjögren's, before the disease's own more typical dry-eye and dry-mouth symptoms were ever recognized or diagnosed. This is worth knowing directly as a real, if uncommon, reason unexplained muscle weakness deserves a real medical workup, not an assumption it's unrelated to a Sjögren's diagnosis that hasn't been made yet.",
    citations: [
      { source: "Renal Tubular Acidosis in Patients with Primary Sjögren's Syndrome", url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5641498/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'sjogrens-secondary-ra-lupus-overlap',
    category: 'sjogrens',
    title: "Secondary Sjögren's: A Real, Substantial Overlap With Two Conditions This App Already Covers",
    teaser: "Sjögren's very often doesn't occur alone. Real numbers show just how often it rides alongside rheumatoid arthritis and lupus specifically.",
    summary:
      "Sjögren's frequently occurs as \"secondary\" Sjögren's, meaning alongside another autoimmune disease rather than on its own, and the real numbers for two specific conditions already covered in this app's own research are genuinely substantial. Real observational registry data finds Sjögren's overlapping with rheumatoid arthritis in as many as 30% of RA patients (with rheumatologist-diagnosed estimates running lower, around 8.7%, depending on which real diagnostic criteria are used), and the real prevalence of this overlap increases the longer someone has had RA. With lupus, real systematic reviews find a secondary Sjögren's prevalence of roughly 14% to 18%. Worth knowing directly for anyone managing RA or lupus already: real, persistent dry eyes or dry mouth symptoms are worth raising specifically as a possible sign of secondary Sjögren's, not just written off as a side effect of the primary diagnosis or its medications, since the real management specifics covered elsewhere in this category (dental protection, dryness triggers, lymphoma awareness) apply just as directly to secondary Sjögren's as to the primary form.",
    citations: [
      { source: "Prevalence of Sjögren's syndrome associated with rheumatoid arthritis in the USA: an observational study from the Corrona registry", url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7237400/' },
      { source: "Sjögren's syndrome and systemic lupus erythematosus: links and risks, PMID 30774485", url: 'https://pubmed.ncbi.nlm.nih.gov/30774485/' },
    ],
    overallTier: 'strong',
    relatedIds: ['other-rheumatoid-arthritis', 'other-lupus'],
  },
  {
    id: 'sjogrens-antibody-testing',
    category: 'sjogrens',
    title: "Diagnosing Sjögren's: The Real Antibody and Function Tests Behind a Confirmed Diagnosis",
    teaser: "Dry eyes and a dry mouth alone aren't a diagnosis. A real, specific set of blood and gland tests is what actually confirms it.",
    summary:
      "Sjögren's diagnosis relies on more than reported dryness alone, since dry eyes and dry mouth have many possible causes. Real, standard diagnostic tools include anti-SSA (also called anti-Ro) and anti-SSB (also called anti-La) antibody blood tests, real, specific autoantibodies found in most, though not all, Sjögren's patients; Schirmer's test, a real, simple, direct measurement of actual tear production using a small strip of paper placed at the edge of the eyelid; and, when the diagnosis is still unclear, a minor salivary gland biopsy (usually taken from inside the lower lip), which can directly show the real, characteristic immune-cell infiltration into the gland tissue that defines the disease. A real, honest limitation worth knowing directly: a negative antibody result doesn't fully rule out Sjögren's, since a real, meaningful minority of confirmed cases are seronegative, the same real pattern this app's own Hashimoto's self-advocacy research already documents for that disease's own antibody testing. Worth asking directly which of these real, specific tests were actually used before accepting either a Sjögren's diagnosis or a dismissal of one.",
    citations: [
      { source: 'Sjögren Syndrome, Merck Manual Professional Edition', url: 'https://www.merckmanuals.com/professional/musculoskeletal-and-connective-tissue-disorders/systemic-rheumatic-diseases/sj%C3%B6gren-syndrome' },
    ],
    overallTier: 'strong',
    relatedIds: ['advocacy-seronegative-hashimotos'],
  },
  {
    id: 'sjogrens-pilocarpine-cevimeline',
    category: 'sjogrens',
    title: 'Pilocarpine and Cevimeline: Real Medications That Genuinely Stimulate the Body\'s Own Moisture Production',
    teaser: "Rather than just replacing lost moisture, these two real medications work by getting the body's own glands producing again.",
    summary:
      "Pilocarpine and cevimeline are real, genuinely different medications from artificial tears or saliva substitutes -- both are muscarinic agonists that actively stimulate the body's own remaining gland function to produce more real saliva and tears, rather than just replacing what's missing from the outside. A real, specific and genuinely reassuring finding directly ties this back to this category's own dental-caries entry: real research found pilocarpine associated with a measurable reduction in dental caries risk in Sjögren's patients, a real, direct benefit beyond just symptom comfort. The two medications differ in a real, specific way: cevimeline has a higher real affinity for the specific receptor type found on salivary and tear glands, which in theory should mean fewer side effects than pilocarpine, though both share a real, overlapping side-effect profile, sweating, nausea, and increased urination among the most common, since pilocarpine in particular stimulates exocrine glands throughout the whole body, not just the mouth and eyes. Worth a real, direct conversation with a doctor about which of the two might suit a given person better, rather than assuming they're interchangeable.",
    citations: [
      { source: "The effect of pilocarpine on dental caries in patients with primary Sjögren's syndrome: a database prospective cohort study", url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6882320/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'sjogrens-tying-together',
    category: 'sjogrens',
    title: "What Actually Holds Up for Sjögren's, Pulled Together",
    teaser: 'A disease defined by dryness that reaches the kidneys and a real cancer risk, and a real, direct, same-day relationship with food and drink most other conditions in this app don\'t share.',
    summary:
      "Line up everything in this category and Sjögren's reads as a disease whose real reach genuinely exceeds its own reputation as \"just dryness.\" The dental-caries mechanism shows exactly how directly saliva loss translates into real, measurable physical damage, and the real fixes, xylitol and the medications pilocarpine and cevimeline, work by restoring the body's own real function rather than just masking the symptom. Alcohol and caffeine carry a genuinely immediate, same-day relationship to dryness, a more direct food-symptom link than most other conditions in this app show. The real lymphoma risk and the real renal tubular acidosis finding, which can strike before the disease's own hallmark dryness is even recognized, both argue for taking Sjögren's seriously as a systemic disease, not a cosmetic inconvenience. And the real, substantial overlap with rheumatoid arthritis and lupus, both already covered elsewhere in this app, is a direct, practical reason anyone managing either of those conditions should know this category exists at all.",
    citations: [
      { source: "Sjögren's Syndrome, MedlinePlus, U.S. National Library of Medicine", url: 'https://medlineplus.gov/sjogrenssyndrome.html' },
    ],
    overallTier: 'strong',
    relatedIds: ['sjogrens-dental-caries-risk', 'sjogrens-lymphoma-risk', 'sjogrens-renal-tubular-acidosis', 'sjogrens-secondary-ra-lupus-overlap'],
  },

  // -- Full-depth parity additions, 2026-08-08. Every citation
  // independently verified via WebSearch.
  {
    id: 'sjogrens-primary-secondary-real-distinction',
    category: 'sjogrens',
    title: 'Primary vs. Secondary Sjögren\'s: A Real, Formal Distinction That Changes What "Managing It" Actually Means',
    teaser: "Primary Sjögren's occurs alone; secondary occurs alongside another real autoimmune disease, most often lupus or RA -- and real research finds primary cases carry MORE severe gland dysfunction, not less.",
    summary:
      "Sjögren's has a real, formal split worth understanding beyond the already-covered RA/lupus overlap: primary Sjögren's occurs on its own, while secondary Sjögren's occurs alongside another real, established connective-tissue disease, most often lupus or rheumatoid arthritis, and less often systemic sclerosis, MS, or autoimmune thyroiditis. A real, formal diagnostic distinction exists too: in someone who already has a confirmed connective-tissue disease, one real symptom plus two of three objective test criteria is enough to classify secondary Sjögren's, a real, lower bar than the ACR/EULAR criteria (a score of 4 or higher across several weighted criteria, including salivary gland biopsy findings) used for a primary diagnosis. A real, genuinely counterintuitive finding worth knowing: primary Sjögren's patients show MORE severe glandular dysfunction (worse dryness) than secondary Sjögren's patients, not less, despite secondary cases involving a real, second autoimmune disease on top.",
    citations: [
      { source: "Comparative Analysis of Glandular and Extraglandular Manifestations in Primary and Secondary Sjögren's Syndrome, PMC11545017", url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11545017/' },
    ],
    overallTier: 'strong',
    relatedIds: ['sjogrens-secondary-ra-lupus-overlap'],
  },
  {
    id: 'sjogrens-lung-vasculitis-neuropathy-real-data',
    category: 'sjogrens',
    title: "Sjögren's Own Real Reach Beyond Dryness: The Lungs, Blood Vessels, and Peripheral Nerves",
    teaser: 'Real, interstitial lung disease in roughly 23% of primary Sjögren\'s patients, and real, if genuinely variable-estimate, peripheral nerve involvement most patients never connect back to their own diagnosis.',
    summary:
      "Beyond the dryness this app's own Sjögren's research already covers in depth, real, documented systemic effects reach further. Interstitial lung disease (ILD), scarring and inflammation of lung tissue, shows a real, pooled prevalence of 23% in primary Sjögren's patients across real systematic-review data, most commonly a subtype called NSIP. Real vasculitis, inflammation of small blood vessels, affects the skin in roughly 10% of patients and can, less commonly, reach the peripheral nerves or central nervous system too. Peripheral nerve involvement itself shows a genuinely wide, real range of reported prevalence, anywhere from under 2% to over 50% depending on the specific study and how it's measured, most commonly presenting as either distal sensory nerve damage or small-fiber neuropathy (nerve damage too subtle for standard nerve-conduction tests to reliably catch). Worth knowing directly: a real, new symptom in the lungs, skin, or nerves in someone with Sjögren's isn't automatically unrelated just because it isn't dryness.",
    citations: [
      { source: "Interstitial Lung Disease and Pulmonary Damage in Primary Sjögren's Syndrome: A Systematic Review and Meta-Analysis, PMC10095380", url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10095380/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'sjogrens-history-milestones',
    category: 'sjogrens',
    title: "Sjögren's Own Real History: A Swedish Doctor Who Noticed the Same Pattern in 19 Real Patients, All Women",
    teaser: '1892, 1933, 1943 -- an earlier real description existed decades before Sjögren\'s own thesis, and international recognition only followed once his work was translated into English.',
    summary:
      "Sjögren's disease carries the real name of Henrik Sjögren, a Swedish physician who, working in Stockholm clinics in the early 1930s, began noticing a real, recurring pattern: predominantly women presenting with dry eyes, dry mouth, and often arthritis together. On May 8, 1933, Sjögren defended a real doctoral thesis documenting 19 real cases (all women, ages 29-72), using genuinely careful clinical methods for the era, including microscopic lacrimal-gland analysis and Schirmer's test (the same real tear-production test this app's own diagnostic research already covers). A real, earlier description actually predates Sjögren's own work by over 40 years: Jan Mikulicz-Radecki described a similar presentation in a single male patient in 1892, though that case didn't lead to the broader recognition Sjögren's own larger case series eventually did. The real turning point for international recognition came only in 1943, when an English translation of Sjögren's original German-language thesis reached a wider audience, a full decade after his own original defense.",
    citations: [
      { source: "Henrik Sjögren (1899-1986): the syndrome and his legacy, Annals of the Rheumatic Diseases", url: 'https://ard.eular.org/article/S0003-4967(24)20473-8/fulltext' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'sjogrens-pregnancy-congenital-heart-block',
    category: 'sjogrens',
    title: "The Same Real Anti-Ro/Anti-La Antibody Risk This App's Own Lupus Research Covers, With Sjögren's Own Real, Specific Numbers",
    teaser: 'A real, quantified baseline risk of 1-2% for congenital heart block, jumping to a real 17-18% after one already-affected pregnancy -- a genuinely large, real, actionable jump in risk.',
    summary:
      "Sjögren's carries the exact same real anti-Ro/SS-A and anti-La/SS-B antibody risk already covered in this app's own Lupus pregnancy research, but with Sjögren's own real, specific numbers worth knowing directly. Among anti-Ro-positive pregnancies generally, real research finds the baseline risk of congenital heart block runs 1-2%, real, low but genuinely non-zero. The real, striking, actionable finding: after ONE already-affected pregnancy, that real risk jumps to 17-18% for a subsequent pregnancy, a genuinely large increase worth real, direct preconception counseling about before trying again. The real underlying mechanism: these antibodies cross the placenta and bind directly to the fetal heart's own conduction tissue, triggering inflammation and, over time, real scarring of the AV node; once a real, established third-degree heart block has formed, it's typically irreversible even with treatment, though catching an earlier, incomplete block in time can sometimes still be reversed with corticosteroids. Real, current management includes preconception counseling, hydroxychloroquine (already covered in this app's own medication research) as a real, protective prophylaxis, and serial fetal echocardiograms starting around week 16, the real, practical monitoring plan this specific antibody risk calls for.",
    citations: [
      { source: 'Sjögren\'s Antibodies and Neonatal Lupus: A Scoping Review, PMC11253570', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11253570/' },
    ],
    overallTier: 'strong',
    relatedIds: ['lupus-pregnancy-real-flare-neonatal', 'sjogrens-pilocarpine-cevimeline'],
  },

  // -- Second depth pass, 2026-08-08, extending full-parity work to the
  // first 10 non-Hashimoto's conditions. Every citation independently
  // verified via WebSearch.
  {
    id: 'sjogrens-dryness-beyond-mouth-eyes',
    category: 'sjogrens',
    title: 'Sjögren\'s Dryness Genuinely Reaches Beyond the Mouth and Eyes, Including Skin and Vaginal Dryness Often Left Unmentioned',
    teaser: 'Real research finds Sjögren\'s attacks exocrine glands throughout the body, not just the salivary and tear glands, with vaginal and skin dryness both real, common, and often quietly under-discussed symptoms.',
    summary:
      "Sjögren's syndrome is defined by real, chronic inflammation of the body's exocrine (moisture-producing) glands, and while dry eyes and dry mouth are its best-known signs, real research confirms the same underlying process genuinely extends further: to the skin, the tracheobronchial tree, and the vagina, together forming what's collectively called sicca symptoms. Vaginal dryness specifically is a real, common but often quietly overlooked symptom, with real research finding a significantly higher prevalence in Sjögren's patients than in the general population, and a real histopathological case-control study directly confirming glandular changes in vaginal tissue consistent with the same disease process affecting the salivary and lacrimal glands. Skin dryness follows the identical real mechanism, reduced exocrine gland function affecting the skin's own moisture-producing glands, not just a coincidental symptom of aging or climate. Real research finds extra-glandular, systemic involvement in as many as 50% of Sjögren's patients overall, underscoring that this is a genuinely whole-body condition, not one confined to the two most commonly discussed sites. Worth knowing directly, and worth raising openly with a doctor even though it can feel like an uncomfortable topic: vaginal dryness in Sjögren's is real, treatable, and directly explained by the same disease process already driving the eye and mouth symptoms this app's own research already covers, not a separate, unrelated issue.",
    citations: [
      { source: 'Vaginal dryness in primary Sjögren\'s syndrome: a histopathological case-control study, Rheumatology (Oxford Academic)', url: 'https://academic.oup.com/rheumatology/article/59/10/2806/5733936' },
      { source: 'Sjogren Disease, StatPearls / NCBI Bookshelf', url: 'https://www.ncbi.nlm.nih.gov/books/NBK431049/' },
    ],
    overallTier: 'strong',
    relatedIds: ['sjogrens-overview', 'sjogrens-lung-vasculitis-neuropathy-real-data'],
  },

  // -- Volumetric depth pass, 2026-08-08, continuing toward genuine
  // volumetric parity with Hashimoto's own depth, per direct instruction
  // that all 18 non-Hashimoto's conditions deserve the same fully
  // encompassing treatment, individually and in combination. Every
  // citation independently verified via WebSearch.
  {
    id: 'sjogrens-labial-salivary-gland-biopsy',
    category: 'sjogrens',
    title: 'The Lip Biopsy: A Real, Genuinely Important Diagnostic Test for Sjögren\'s That\'s Easy to Not Know Exists',
    teaser: 'A small biopsy of minor salivary glands inside the lower lip, scored for real, clustered immune-cell infiltration, carries real diagnostic sensitivity up to 93.7% and specificity as high as 100% in some studies.',
    summary:
      "The labial minor salivary gland biopsy, a real, minor procedure taking a small tissue sample from inside the lower lip, is a genuinely important, if under-discussed, diagnostic tool for confirming Sjögren's syndrome, worth knowing about directly alongside the antibody testing already covered in this app's own Sjögren's research. Real diagnostic criteria score this biopsy using a \"focus score,\" a focus being defined as a real, dense cluster of 50 or more lymphocytes (immune cells) found per 4 square millimeters of gland tissue, with a focus score of 1 or higher a real, critical, formal step in Sjögren's classification. Real research finds the biopsy's own diagnostic performance genuinely strong, sensitivity ranging from 63.5% to 93.7% and specificity from 61.2% up to 100% in some studies. Worth knowing honestly: real research also finds this test genuinely imperfect and inconsistent in practice, focus score isn't reported at all in a real 17% of cases, real inter-observer variability exists between different pathologists reading the same sample, and a real 18-40% of confirmed primary Sjögren's patients still have a focus score below the diagnostic threshold on their own lip biopsy, meaning a negative result doesn't fully rule the disease out. Real, emerging AI-assisted scoring tools are being developed specifically to reduce this variability. Worth knowing directly: this is a real, worth-understanding piece of the diagnostic puzzle for anyone being evaluated for Sjögren's, useful alongside, not instead of, the real antibody panel and clinical symptom picture already covered elsewhere in this app's own research.",
    citations: [
      { source: 'A validated method of labial minor salivary gland biopsy for the diagnosis of Sjögren\'s syndrome, PMID 27107215', url: 'https://pubmed.ncbi.nlm.nih.gov/27107215/' },
      { source: 'Diagnostic value of labial minor salivary gland biopsy for Sjögren\'s syndrome: a systematic review, PMID 22889617', url: 'https://pubmed.ncbi.nlm.nih.gov/22889617/' },
    ],
    overallTier: 'strong',
    relatedIds: ['sjogrens-antibody-testing'],
  },
  {
    id: 'sjogrens-raynauds-phenomenon',
    category: 'sjogrens',
    title: 'Raynaud\'s Phenomenon: A Real, Common Vascular Sign That Can Be Sjögren\'s Own First Warning',
    teaser: 'Real research finds Raynaud\'s phenomenon in roughly 13% of primary Sjögren\'s patients, with nearly half experiencing it as their very first autoimmune symptom, years before dryness ever shows up.',
    summary:
      "Raynaud's phenomenon, real, episodic color changes and numbness in the fingers or toes triggered by cold or stress as small blood vessels overreact and constrict, is a real, genuinely common companion to Sjögren's syndrome, worth knowing about directly since it can arrive before the disease's own more familiar dryness symptoms. Real research finds Raynaud's in roughly 13% of primary Sjögren's patients (with a real, broader reported range of 9-33% across different studies), and genuinely striking, nearly half of those affected experienced Raynaud's as their real, very first autoimmune symptom, before dry eyes or dry mouth ever appeared. Real research finds women with Sjögren's carry a real, more than doubled risk (relative risk 2.29) of developing Raynaud's compared to the general population. Worth knowing directly, and clinically meaningful: real research finds Sjögren's patients WITH Raynaud's show a real, higher rate of joint involvement, skin vasculitis, and positive antibody markers (ANA, anti-Ro/SSA, anti-La/SSB) compared to those without it, and real research links Raynaud's presence in Sjögren's to a real, higher chance of more serious complications like pulmonary hypertension and interstitial lung disease. Worth knowing directly: someone experiencing unexplained, cold-triggered finger or toe color changes has a real, concrete reason to mention it specifically to a doctor, since it can be Sjögren's own earliest visible clue, well before the disease's own hallmark symptoms make the diagnosis more obvious.",
    citations: [
      { source: 'Clinical features and risk factors of Raynaud\'s phenomenon in primary Sjögren\'s syndrome, PMC8463379', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8463379/' },
      { source: 'Raynaud\'s phenomenon in primary Sjögren\'s syndrome. Prevalence and clinical characteristics in a series of 320 patients, PMID 11950013', url: 'https://pubmed.ncbi.nlm.nih.gov/11950013/' },
    ],
    overallTier: 'strong',
    relatedIds: ['sjogrens-lung-vasculitis-neuropathy-real-data'],
  },
  {
    id: 'sjogrens-fatigue-most-disabling',
    category: 'sjogrens',
    title: 'Fatigue, Not Dryness, Is Real Often the Most Disabling Symptom of Sjögren\'s Syndrome',
    teaser: 'Real research finds disabling fatigue in up to 70% of Sjögren\'s patients, often considered a real, bigger burden than the dry eyes and dry mouth the disease is best known for.',
    summary:
      "Fatigue, not the dry eyes and dry mouth Sjögren's is best known for, is worth knowing directly as the disease's own real, most prevalent and most disabling symptom for many patients. Real research finds disabling fatigue reported in up to 70% of Sjögren's patients, with fatigue explicitly named in real clinical research as the most commonly reported and debilitating extraglandular (beyond the glands) symptom of the disease, genuinely more burdensome to many patients than the dryness itself. Real research finds fatigue's own real predictors are more strongly tied to pain, helplessness, and depression, along with sleep disturbances and comorbid fibromyalgia (already covered in this app's own Sjögren's-secondary-overlap research), than to standard bloodwork or inflammatory lab markers, meaning a person's own subjective fatigue burden often doesn't show up as any single abnormal test result. A real, direct comparison found fatigue significantly more severe in Sjögren's specifically than in other systemic autoimmune rheumatic diseases without Sjögren's involved, real evidence this isn't just generic chronic-illness tiredness but something genuinely characteristic of the disease itself. Worth knowing directly: this is real, validating information for anyone with Sjögren's whose fatigue feels disproportionate to what their labs or a doctor's visual assessment of dryness alone would suggest, it's a real, well-documented, central part of the disease, worth naming and tracking directly rather than dismissed as unrelated or purely psychological.",
    citations: [
      { source: 'A five-year prospective study of fatigue in primary Sjögren\'s syndrome, PMC3308101', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3308101/' },
      { source: 'Prevalence, severity, and predictors of fatigue in subjects with primary Sjögren\'s syndrome, PMID 19035421', url: 'https://pubmed.ncbi.nlm.nih.gov/19035421/' },
    ],
    overallTier: 'strong',
    relatedIds: ['sjogrens-secondary-ra-lupus-overlap', 'sjogrens-overview'],
  },
  {
    id: 'sjogrens-vitamin-d-dry-eye-severity',
    category: 'sjogrens',
    title: "Vitamin D Status Tracks With How Severe Dry Eye Actually Feels in Sjögren's",
    teaser: 'An 18-study review found people with lower vitamin D had measurably worse tear production and eye-surface irritation, not just lower blood levels on paper.',
    summary:
      "Sjögren's own hallmark symptom, dry eyes, has a measurable relationship with vitamin D status that goes beyond a simple shared-deficiency coincidence. A systematic review and meta-analysis pooling 18 studies found that people with vitamin D deficiency had a shorter tear breakup time (how long the eye's own tear film stays intact before it starts to dry out), lower Schirmer's test scores (a direct measure of how much tear fluid the eye actually produces), and a higher ocular surface disease index score (a validated measure of dry-eye discomfort and its effect on daily vision). The same review confirmed serum vitamin D runs lower in people with primary Sjögren's than in matched people without it, consistent with vitamin D deficiency's own broader, well-documented pattern across autoimmune disease. This doesn't establish that correcting a deficiency reverses dry-eye symptoms outright; the review itself was built from observational studies, not a supplementation trial. But it does mean vitamin D status is a concrete, testable piece of the picture worth raising directly, especially for anyone whose dry-eye symptoms feel disproportionately severe or aren't responding as expected to standard treatment.",
    citations: [
      {
        source: "Vitamin D Deficiency Is Associated with Severity of Dry Eye Symptoms and Primary Sjögren's Syndrome: A Systematic Review and Meta-Analysis, Journal of Nutritional Science and Vitaminology 2020",
        url: 'https://pubmed.ncbi.nlm.nih.gov/32863314/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['sjogrens-omega3-dry-eye-mouth', 'vitamind-tying-together'],
  },
  {
    id: 'sjogrens-rituximab-biologic-mixed-evidence',
    category: 'sjogrens',
    title: 'A Real, Well-Studied Biologic (Rituximab) Genuinely Didn\'t Meet Its Own Trial\'s Main Goal',
    teaser: 'A real, French, 120-patient randomized trial (TEARS) found rituximab didn\'t significantly beat placebo on its own primary measure, a real, honest example of a plausible treatment not panning out as hoped.',
    summary:
      "Rituximab, a real, well-established biologic that depletes a specific type of immune cell (B cells), has real biological plausibility for Sjögren's, since B-cell overactivity is a genuine, documented part of the disease. A real, randomized, placebo-controlled French trial (TEARS), following 120 patients after a single course of rituximab, tested this directly against a real, specific bar: at least a meaningful improvement in two of four core symptom measures (dryness, pain, fatigue, and overall disease-activity assessment) at 24 weeks. Rituximab didn't reach that bar. An early real improvement in fatigue at 6 weeks didn't hold up by 24 weeks, and the trial's own authors noted the chosen outcome measure was genuinely demanding and subjective, which may have made a real, smaller benefit harder to detect. A second, separate UK trial (TRACTISS) reached a similarly negative primary result. Worth knowing honestly: this doesn't mean rituximab has zero effect, real secondary measures in these same trials did show some improvement in objective salivary flow and lab markers, but it's a real, honest example of promising biological reasoning not translating cleanly into the specific, real-world symptom improvement a randomized trial is built to detect. This app names it directly rather than only covering medications with a clean positive result, since knowing what DIDN'T clearly work, and why, is real, useful context too.",
    citations: [
      { source: 'Treatment of Primary Sjögren Syndrome With Rituximab: A Randomized Trial, Annals of Internal Medicine 2014 (Devauchelle-Pensec et al.), PMID 24727841', url: 'https://pubmed.ncbi.nlm.nih.gov/24727841/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['sjogrens-pilocarpine-cevimeline'],
  },
  {
    id: 'sjogrens-oral-candidiasis-risk',
    category: 'sjogrens',
    title: 'Dry Mouth Doesn\'t Just Feel Uncomfortable, It Genuinely Opens the Door to Oral Yeast Infections',
    teaser: 'Real research finds Candida yeast colonizing the mouths of the large majority of Sjögren\'s patients, with reduced saliva flow itself the single strongest, most direct predictor.',
    summary:
      "This category's own research already covers saliva's real, active protective role, buffering acid, clearing food and bacteria, and fighting infection directly, and its own dental-caries entry covers one real consequence of losing that protection. A second, real, distinct consequence is oral candidiasis, a yeast infection caused by Candida overgrowing in a mouth that no longer has enough saliva to keep it in check. Real research finds Candida colonizing the mouths of a large majority of Sjögren's patients (over 80% by sensitive culture methods in one study), with a more recent study finding visible clinical signs of active candidiasis, redness, white patches, or a burning sensation, in 13.1% of primary Sjögren's patients specifically. Real research consistently identifies reduced, unstimulated saliva flow as an independent, direct risk factor, not just a coincidental shared symptom, the same underlying mechanism (compromised lubrication, buffering, and antimicrobial protection) driving both this and the dental-caries risk already covered elsewhere in this category. Worth knowing directly: a persistent burning sensation, altered taste, or visible white patches in the mouth are real, treatable signs worth raising specifically, since oral candidiasis responds to real, targeted antifungal treatment, distinct from the general dryness-relief strategies (xylitol, saliva substitutes) already covered in this category's own research.",
    citations: [
      { source: "Multiple oral Candida infections in patients with Sjögren's syndrome: prevalence and clinical and drug susceptibility profiles, Journal of Rheumatology 2011, PMID 21844143", url: 'https://pubmed.ncbi.nlm.nih.gov/21844143/' },
    ],
    overallTier: 'strong',
    relatedIds: ['sjogrens-dental-caries-risk', 'sjogrens-xylitol-saliva-stimulation'],
  },
  {
    id: 'sjogrens-hydroxychloroquine-joquer-trial',
    category: 'sjogrens',
    title: 'A Medication That Works for Lupus Genuinely Didn\'t Beat Placebo in Sjögren\'s Own Landmark Trial',
    teaser: 'Hydroxychloroquine has real, strong evidence in lupus, but the real JOQUER trial found it no better than placebo for Sjögren\'s own core symptoms of dryness, pain, and fatigue.',
    summary:
      "Hydroxychloroquine is a real, well-established, effective medication in lupus (see this app's own lupus research), and it's real, commonly prescribed for Sjögren's syndrome too, on the reasonable, real assumption that a medication working for one antibody-driven autoimmune disease should plausibly help a related one. The real, landmark JOQUER trial tested this directly: 120 patients with primary Sjögren's syndrome, randomized to hydroxychloroquine (400mg daily) or placebo for 24 weeks, measuring the condition's own three core symptoms, dryness, pain, and fatigue. The real, honest result: hydroxychloroquine was NOT more effective than placebo at improving any of these three core symptoms, a genuine negative finding for the trial's own real, primary purpose. Worth knowing honestly, since this isn't a simple 'it doesn't work' story either: real, later analysis of the same trial's own biological samples found hydroxychloroquine DID measurably reduce a real, specific immune signal (interferon activation) tied to Sjögren's own disease process, real, genuine biological activity that just didn't translate into the specific, real symptom relief patients were hoping for at 24 weeks. Worth knowing directly: this is a real, useful example of why this app's own research draws a hard line between a medication working for one autoimmune condition and it necessarily working for a related but genuinely distinct one, worth a real, direct conversation about whether hydroxychloroquine is genuinely helping if already prescribed for Sjögren's specifically.",
    citations: [
      { source: 'Effects of Hydroxychloroquine on Symptomatic Improvement in Primary Sjögren Syndrome: The JOQUER Randomized Clinical Trial, JAMA 2014', url: 'https://doi.org/10.1001/jama.2014.7682' },
    ],
    overallTier: 'strong',
    relatedIds: ['lupus-hydroxychloroquine-retinopathy'],
  },
  {
    id: 'sjogrens-fibromyalgia-overlap',
    category: 'sjogrens',
    title: 'Fibromyalgia and Sjögren\'s Genuinely Overlap, Each Real Condition Raising the Documented Risk of the Other',
    teaser: 'A real, nationwide cohort study found fibromyalgia patients twice as likely to later develop Sjögren\'s, and real studies find fibromyalgia itself present in up to 31% of Sjögren\'s patients.',
    summary:
      "This category's own already-covered fatigue research names fatigue as Sjögren's own most disabling symptom. Fibromyalgia, a real, separate chronic-pain condition centered on widespread pain and fatigue, genuinely overlaps with Sjögren's often enough to meaningfully complicate that picture. A real, nationwide, population-based cohort study found people with fibromyalgia had a real, doubled risk (hazard ratio 2.00) of later developing Sjögren's syndrome, with an even higher real risk (hazard ratio 3.07) in fibromyalgia patients aged 20 to 49. Looking the other direction, real studies of confirmed Sjögren's patients find fibromyalgia genuinely common alongside it, prevalence estimates ranging from a real 14.6% to 31% depending on the study population, with fibromyalgia's presence tracking with real, worse patient-reported symptom scores and more severe depression. Worth knowing directly, and genuinely practical: since fibromyalgia and Sjögren's own fatigue and pain can look and feel similar day to day, real, active co-occurrence means either condition's own symptoms can mask or be mistaken for the other, complicating both diagnosis and how well a given treatment seems to be working. Worth knowing directly for anyone with either diagnosis whose fatigue or pain hasn't responded as expected: real, direct screening for the other condition is worth raising, rather than assuming every symptom traces back to just the one already-diagnosed disease.",
    citations: [
      { source: "Higher Risk for Sjögren's Syndrome in Patients With Fibromyalgia: A Nationwide Population-Based Cohort Study, PMID 33912165", url: 'https://pubmed.ncbi.nlm.nih.gov/33912165/' },
    ],
    overallTier: 'strong',
    relatedIds: ['sjogrens-fatigue-most-disabling', 'sjogrens-secondary-ra-lupus-overlap'],
  },
  {
    id: 'sjogrens-elderly-diagnostic-delay',
    category: 'sjogrens',
    title: "Sjögren's Symptoms in Older Adults Often Get Written Off as Ordinary Aging",
    teaser: "Dry eyes, dry mouth, fatigue, and joint pain are all common features of Sjögren's syndrome and of normal aging alike, a real overlap that delays diagnosis specifically in older patients.",
    summary:
      "Sjögren's syndrome is already a commonly delayed diagnosis, real registry data putting the median gap between first symptoms (age 47) and actual diagnosis (age 50) at around three years, and that delay gets real, extra reinforcement in older patients specifically. Dryness of the eyes and mouth, fatigue, weight changes, and muscle pain, the very symptoms that should prompt a Sjögren's workup, are also simply common features of getting older, so a genuine autoimmune cause can plausibly hide in plain sight behind an assumption of ordinary aging. One real, documented case illustrates the risk directly: an older patient unable to eat a normal diet for a full year went untreated, in part because his age and other health circumstances made the underlying cause easy to overlook, and in some patients dry eye and dry mouth get dismissed as having no real cause at all once initial antibody tests come back negative, missing the real share of Sjögren's cases that are seronegative. Worth knowing directly: persistent, unexplained dryness in an older adult, especially alongside fatigue or joint aches, deserves the same real diagnostic consideration it would get in a younger person, not a default assumption that it is simply what getting older feels like.",
    citations: [
      { source: "Sjögren's syndrome in older patients: aetiology, diagnosis and management, Drugs & Aging, PMID 23341116", url: 'https://pubmed.ncbi.nlm.nih.gov/23341116/' },
    ],
    overallTier: 'strong',
    relatedIds: ['sjogrens-antibody-testing', 'sjogrens-primary-secondary-real-distinction'],
  },
  {
    id: 'sjogrens-global-geographic-ethnic-variation',
    category: 'sjogrens',
    title: "Sjögren's Looks Genuinely Different Depending on Where in the World Someone Is Diagnosed",
    teaser: "Real data finds Sjögren's runs higher in Mediterranean than Northern European countries, and its own male-to-female ratio, symptom pattern, and typical age at diagnosis all shift measurably by ethnicity too.",
    summary:
      "Sjögren's syndrome shows real, documented geographic and ethnic variation in more than just how often it occurs. Within Europe alone, real population studies find prevalence measurably higher in Mediterranean countries than in Northern Europe. Ethnicity shapes how the disease actually presents just as much as how common it is: a real, large cross-population study found the female-to-male ratio ranges from 27:1 in Asian patients down to 7:1 in Black/African-American patients, sicca (dryness) symptoms are reported least often in Asian patients despite the disease itself being present, and diagnosis happens a real 7 years earlier on average in Black/African-American patients compared with White patients. Antibody patterns shift by region too: a real, large multinational study found higher rates of ANA (antinuclear antibody) positivity in northern parts of the Americas and in Asia, while northern European countries showed LOWER rates of both ANA and the Ro/La antibodies this app's own diagnostic content already covers. Worth knowing directly: these aren't just statistical curiosities, real, documented differences in symptom presentation and antibody positivity by region and ethnicity mean the SAME underlying disease can look meaningfully different depending on where and to whom it's happening, a real reason this app's own diagnostic content shouldn't be read as one universal symptom checklist.",
    citations: [
      { source: 'Influence of geolocation and ethnicity on the phenotypic expression of primary Sjögren’s syndrome at diagnosis in 8310 patients, Seminars in Arthritis and Rheumatism', url: 'https://www.sciencedirect.com/science/article/abs/pii/S0003496724027602' },
      { source: 'Location & Ethnicity Affect Manifestations of Primary Sjogren’s Syndrome, The Rheumatologist', url: 'https://www.the-rheumatologist.org/article/location-ethnicity-affect-manifestations-primary-sjogrens-syndrome/' },
    ],
    overallTier: 'strong',
    relatedIds: ['sjogrens-overview', 'sjogrens-antibody-testing'],
  },
  {
    id: 'sjogrens-global-underdiagnosis-real-data',
    category: 'sjogrens',
    title: "Real Data Finds Most Sjögren's Cases Sit Outside a Rheumatologist's Care Entirely, Even in Wealthy Countries",
    teaser: "A real German claims-data study found only 11% of people with a confirmed Sjögren's diagnosis were actually receiving rheumatologic care, real evidence this category's own already-covered diagnostic-delay research understates how often people simply fall through entirely.",
    summary:
      "This category's own already-covered diagnostic-delay research (dryness dismissed as normal aging, seronegative cases missed by antibody testing) has a real, further, structural layer worth naming directly: even a confirmed diagnosis often doesn't lead to real, ongoing specialist care. A real German claims-data study of 54,273 people with a documented Sjögren's diagnosis found only 5,961 of them, just 11%, were actually receiving care from a rheumatologist, meaning a real, large majority were managing a real autoimmune disease without the specialist oversight this app's own already-covered care generally assumes. Real, US-based estimates independently arrive at a similarly stark picture from the diagnosis side itself: experts estimate roughly 50% of Sjögren's cases, an estimated 2 million Americans, remain completely undiagnosed, driven by real, limited healthcare-provider awareness of the disease and the real absence of one single gold-standard diagnostic test. Worth knowing directly: this app's own already-covered international research (real geographic and ethnic variation in Sjögren's presentation) is worth reading alongside this real, structural finding, someone's own real experience with Sjögren's, wherever they live, may look less like 'the disease is uncommon here' and more like 'this disease is genuinely under-recognized nearly everywhere,' a real, important distinction when comparing one's own regional prevalence data against another country's.",
    chart: {
      title: "Sjögren's diagnosis reaching real rheumatologic care (Germany)",
      unit: '%',
      data: [
        { label: 'In rheumatologic care', value: 11 },
        { label: 'Not in rheumatologic care', value: 89 },
      ],
      sourceNote: "Comorbidity and health care utilisation in persons with Sjögren's syndrome: a claims data analysis, PMID 33025885",
    },
    citations: [
      { source: "Comorbidity and health care utilisation in persons with Sjögren's syndrome: a claims data analysis, PMID 33025885", url: 'https://pubmed.ncbi.nlm.nih.gov/33025885/' },
      { source: "Guest Blog: Sjögren's: A Misunderstood and Underdiagnosed Autoimmune Disease, National Health Council", url: 'https://nationalhealthcouncil.org/blog/guest-blog-sjogrens-a-misunderstood-and-underdiagnosed-autoimmune-disease/' },
    ],
    overallTier: 'strong',
    relatedIds: ['sjogrens-global-geographic-ethnic-variation', 'sjogrens-labial-salivary-gland-biopsy'],
  },
  {
    id: 'horizon-sjogrens',
    category: 'sjogrens',
    title: 'A Real, New Drug Just Succeeded Where This Category\'s Own Rituximab Research Already Failed',
    teaser: "Dazodalibep, targeting a genuinely different immune signal than rituximab, measurably improved dryness, fatigue, and pain in a real Phase 2 trial and is now in Phase 3, a real, direct answer to this category's own already-covered JOQUER trial's honest negative result.",
    summary:
      "This category's own already-covered JOQUER trial found rituximab, despite real, measurable biological activity, failed to improve Sjögren's own core dryness and fatigue symptoms, an honest, real disappointment already covered directly in this Digest. Dazodalibep represents a real, genuinely different approach that appears to be succeeding where that one didn't. Rather than depleting B cells the way rituximab does, dazodalibep blocks a different signal (CD40 ligand) involved in activating the immune response in the first place. A real Phase 2 trial, tested across two separate real patient groups (moderate-to-severe systemic disease activity, and severe symptoms with limited organ involvement), found patients receiving dazodalibep showing significantly greater real improvement in dryness, fatigue, and pain than those on placebo, the exact core symptoms this category's own rituximab research found unmoved. The drug was well tolerated in this same real trial. It has since progressed to real Phase 3 trials, expected to conclude in December 2026. Worth knowing directly: this is real, genuine progress specifically because it succeeded on the real symptoms that matter most day to day, not just on a lab-measured biological marker, though Phase 3 confirmation is still needed before it becomes an available treatment.",
    citations: [
      { source: "CD40 ligand antagonist dazodalibep in Sjögren's disease: a randomized, double-blinded, placebo-controlled, phase 2 trial, Nature Medicine", url: 'https://www.nature.com/articles/s41591-024-03009-3' },
    ],
    overallTier: 'strong',
    relatedIds: ['sjogrens-rituximab-biologic-mixed-evidence', 'sjogrens-fatigue-most-disabling'],
  },
  {
    id: 'horizon-sjogrens-iscalimab',
    category: 'sjogrens',
    title: "A Second Real Drug, Working the Same Immune Signal as Dazodalibep, Also Showed Real Systemic Benefit",
    teaser: 'Iscalimab, blocking the CD40 receptor itself rather than its ligand, became the first drug ever to produce a real, meaningful reduction in a formal, systemic Sjögren\'s disease-activity score, a genuine, distinct real finding alongside this category\'s own already-covered dazodalibep research.',
    summary:
      "This category's own already-covered dazodalibep research blocks CD40 ligand; iscalimab, a real, separate antibody, blocks the CD40 receptor itself, essentially the two sides of the same real immune-signaling handshake, both now independently showing genuine promise. A real, placebo-controlled proof-of-concept trial in 44 Sjögren's patients found intravenous iscalimab producing a real, statistically significant reduction in ESSDAI (the field's own formal, systemic disease-activity score) after just 12 weeks, real, direct evidence described by the field itself as the first drug to achieve a clinically meaningful change in Sjögren's own systemic complications specifically, not just symptom relief. A real, follow-up Phase 2 trial (TWINSS) further confirmed both safety and efficacy for a subcutaneous version of the same drug. Worth knowing directly: two independent drugs targeting essentially the same real CD40 signaling pathway from opposite sides both showing genuine benefit is a real, meaningful confirmation that this specific immune mechanism matters in Sjögren's, not just a single trial's own result, strengthening the real case for this whole approach even before either drug reaches a final, larger Phase 3 confirmation.",
    citations: [
      { source: "Assessment of the anti-CD40 antibody iscalimab in patients with primary Sjögren's syndrome, The Lancet Rheumatology", url: 'https://www.thelancet.com/journals/lanrhe/article/PIIS2665-9913(19)30135-3/abstract' },
    ],
    overallTier: 'strong',
    relatedIds: ['horizon-sjogrens'],
  },
];
