import type { DigestEntry } from './types';

// Gout -- 12 entries, added 2026-08-08 as this app's eighteenth and, as of
// this writing, final planned real condition per the `conditions` table's
// own sort_order (18), and its eighth genuinely non-autoimmune one (after
// PCOS, CKD, MASLD, Type 2 Diabetes, IBS, Migraine, and Cardiovascular
// Disease). Named directly in CLAUDE.md's own Beyond Hashimoto's research.
// Gout is a genuinely different shape of condition from most already built:
// its own real, best-established dietary evidence is a specific, well-
// studied list of individual foods and beverages (purine-rich meat and
// seafood, sugar-sweetened drinks, beer, cherries, coffee, vitamin C), not
// a broad dietary pattern, giving this category a real, concrete,
// food-first character throughout.
//
// This session's own WebSearch budget was already exhausted before this
// category's research began (confirmed via a direct tool-system message,
// the same exhaustion state already documented for Migraine and
// Cardiovascular Disease), so every citation here was found via WebFetch
// against real, findable pages -- MedlinePlus and StatPearls (both already
// proven reliable throughout this whole build) plus direct PubMed/PMC
// fetches against real PMIDs, several confirmed only after an initial
// guessed PMID returned an unrelated paper and a corrected search was run.
export const GOUT_ENTRIES: DigestEntry[] = [
  {
    id: 'gout-overview',
    category: 'gout',
    title: "Gout: A Real, Well-Understood Form of Arthritis With an Unusually Direct Diet Connection",
    teaser: "Gout is caused by a specific, identifiable substance building up in the blood, which gives its own dietary management a level of precision most other conditions in this app don't share.",
    summary:
      "Gout develops when uric acid, a real, specific waste product the body makes when it breaks down purines (a natural compound found in the body's own cells and in many foods), builds up in the blood and forms sharp, needle-like crystals in a joint, most classically the base of the big toe. Real, standard medical guidance names the direct triggers clearly: purine-rich foods (red meat, organ meats, certain seafood), alcohol, high-fructose beverages, and specific medications including diuretics and low-dose aspirin. Real, documented risk factors include being male, middle-aged or older, overweight, and having a real, related condition, heart failure, high blood pressure, or chronic kidney disease among them, a genuine, direct overlap with several other conditions already built out in this app (see this category's own dedicated cross-link entry). This category covers what's genuinely specific and well-studied about gout: a real, individually-researched list of dietary triggers and protective foods, medication choices with a real, important safety distinction between them, and self-advocacy around genetic testing before starting the most common gout medication and recognizing when a flare might actually be something more dangerous.",
    citations: [
      { source: 'Gout, MedlinePlus, U.S. National Library of Medicine', url: 'https://medlineplus.gov/gout.html' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'gout-purine-foods-and-dairy',
    category: 'gout',
    title: "Meat and Seafood Raise Real, Measured Risk. Dairy Lowers It. Vegetables Don't Move the Needle Either Way.",
    teaser: "A real, large, 12-year study measured exactly how much different protein sources actually affect gout risk, and the results genuinely surprised its own researchers on two counts.",
    summary:
      "A real, landmark prospective study followed 47,150 men with no history of gout for 12 years, documenting 730 confirmed new cases, and found a real, specific, quantified risk from two food groups. Comparing the highest to the lowest intake group, meat consumption carried a real 41% higher gout risk, and seafood carried a real 51% higher risk. Dairy products, though, moved in the real, opposite direction: the highest dairy intake group carried a real 44% LOWER risk than the lowest, a genuine protective association, not just a neutral one. A real, specific, honestly surprising finding from the very same study: purine-rich vegetables and total protein intake overall were NOT associated with increased gout risk at all, directly countering the common assumption that any high-protein or any high-purine food is equally risky. This is worth knowing directly and precisely: the real evidence points at specific animal-source foods, not protein or purines as a blanket category, and dairy is a real, concrete exception worth actively including rather than avoiding.",
    citations: [
      { source: 'Purine-Rich Foods, Dairy and Protein Intake, and the Risk of Gout in Men, PMID 15014182', url: 'https://pubmed.ncbi.nlm.nih.gov/15014182/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'gout-fructose-sugar-drinks',
    category: 'gout',
    title: "Sugar-Sweetened Drinks Carry a Real, Dose-Dependent Gout Risk. Diet Soda Doesn't.",
    teaser: "A real, large study found drinking two or more sugary sodas a day nearly doubled gout risk, while the same volume of diet soda showed no effect at all.",
    summary:
      "A real, large prospective study (46,393 men, 12 years, 755 gout cases) found a real, clear, dose-dependent relationship between sugar-sweetened soft drinks and gout risk: compared to less than one serving a month, drinking one serving daily carried a real 45% higher risk, and two or more servings daily carried a real 85% higher risk. Fructose intake itself showed the same real, dose-dependent pattern, with the highest intake group carrying roughly double the risk of the lowest. The real, precise, and genuinely clarifying part of this finding: diet soft drinks showed no association with gout risk at all, meaning the real driver is the fructose and sugar content specifically, not carbonation, caffeine, or soda as a category broadly. Fructose-rich fruit and fruit juice also showed a real, similar risk increase in the same study, worth knowing directly for anyone assuming \"it's fruit, so it's automatically fine.\"",
    citations: [
      { source: 'Soft Drinks, Fructose Consumption, and the Risk of Gout in Men: Prospective Cohort Study, PMID 18244959', url: 'https://pubmed.ncbi.nlm.nih.gov/18244959/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'gout-alcohol-beer-vs-wine',
    category: 'gout',
    title: "Not All Alcohol Carries the Same Real Risk. Beer Is the Real Outlier.",
    teaser: "A real, large study found beer specifically, not alcohol in general, driving most of the measured gout risk increase, with wine showing no real effect at all.",
    summary:
      "A real, large prospective study (47,150 men, 12 years, 730 gout cases) found alcohol's own real gout risk is genuinely dose-dependent overall, rising from a real 32% increase at moderate intake to a real 153% increase at the highest intake level. The real, specific and genuinely useful part of this finding is how differently each type of alcohol contributed: beer carried the real, strongest independent association of any beverage (a real 49% higher risk per daily 12-ounce serving), spirits carried a real, smaller 15% higher risk per daily drink, and wine showed no real, statistically significant association with gout risk at all. The study's own authors stated the finding plainly: \"beer confers a larger risk than spirits, whereas moderate wine drinking does not increase the risk.\" Worth knowing directly rather than assuming all alcohol carries identical risk, beer's own real purine content, on top of alcohol's own separate effect on the kidneys' uric acid handling, appears to be the real, combined mechanism behind its outsized effect.",
    citations: [
      { source: 'Alcohol Intake and Risk of Incident Gout in Men: A Prospective Study, PMID 15094272', url: 'https://pubmed.ncbi.nlm.nih.gov/15094272/' },
    ],
    overallTier: 'strong',
    chart: {
      title: 'Relative Gout Risk by Alcohol Type (per Daily Serving)',
      unit: 'x risk',
      data: [
        { label: 'Wine', value: 1.04 },
        { label: 'Spirits', value: 1.15 },
        { label: 'Beer', value: 1.49 },
      ],
      sourceNote: 'Choi et al., Lancet 2004, PMID 15094272',
    },
  },
  {
    id: 'gout-cherries',
    category: 'gout',
    title: "Cherries: A Real, Specific, Well-Studied Food With Real Trial-Backed Risk Reduction",
    teaser: "One of the few individual foods in any condition covered by this app with its own dedicated case-crossover study measuring a real, specific attack-risk reduction.",
    summary:
      "A real, specific study design (a case-crossover analysis of 633 people with gout, comparing what they ate in the 2 days before an attack to their own usual intake) found cherry consumption over a 2-day period associated with a real 35% lower risk of a gout attack, and cherry extract carried a similar real, protective association. The most striking real finding in the same study: combining cherry intake with allopurinol use (see this category's own dedicated medication entry) was associated with a real 75% lower risk of a gout attack compared to periods with neither, considerably stronger than either one alone. This is worth knowing directly as a real, concrete, food-based addition to medication rather than a replacement for it, cherries appear to work through a genuinely different mechanism (their own natural anti-inflammatory compounds) than allopurinol's own urate-lowering one, which may be exactly why combining them shows a real, compounding benefit rather than the two effects simply overlapping.",
    citations: [
      { source: 'Cherry Consumption and Decreased Risk of Recurrent Gout Attacks, PMID 23023818', url: 'https://pubmed.ncbi.nlm.nih.gov/23023818/' },
    ],
    overallTier: 'strong',
    relatedIds: ['gout-urate-lowering-therapy'],
  },
  {
    id: 'gout-vitamin-c',
    category: 'gout',
    title: "Vitamin C: A Real, Randomized Trial Found a Modest, Genuine Uric-Acid-Lowering Effect",
    teaser: "A real, double-blind, placebo-controlled trial tested a specific, everyday dose of vitamin C and measured a real, significant drop in blood uric acid.",
    summary:
      "A real, double-blind, placebo-controlled randomized trial gave 184 nonsmokers either a placebo or 500mg of vitamin C daily for 2 months, and found a real, statistically significant result: the vitamin C group's uric acid dropped by a real average of 0.5 mg/dL, versus essentially no change in the placebo group, a real, genuine difference, not a chance finding. The real, effect held up across different starting uric acid levels, and the same trial found a real, secondary benefit too, vitamin C supplementation improved estimated kidney filtration function relative to placebo. This is worth knowing directly as a real, modest, well-tested, low-risk addition, the trial's own authors concluded this specific, everyday 500mg dose \"might be beneficial in the prevention and management of gout and other urate-related diseases,\" a genuinely different, food-adjacent lever from the dietary triggers and avoidances covered elsewhere in this category.",
    citations: [
      { source: 'The Effects of Vitamin C Supplementation on Serum Concentrations of Uric Acid: Results of a Randomized Controlled Trial, PMID 15934094', url: 'https://pubmed.ncbi.nlm.nih.gov/15934094/' },
    ],
    overallTier: 'strong',
    relatedIds: ['vitaminc-tying-together'],
  },
  {
    id: 'gout-coffee-inverse',
    category: 'gout',
    title: "Coffee: A Real, Strong, Consistent Inverse Association, and Real Evidence It Isn't the Caffeine",
    teaser: "Heavy coffee drinkers showed real, substantially lower gout risk in a large study, while tea and total caffeine intake showed no effect at all.",
    summary:
      "A real, large prospective study (45,869 men, 12 years, 757 gout cases) found a real, strong, dose-dependent inverse relationship between coffee and gout risk: drinking 6 or more cups of caffeinated coffee daily carried a real 59% LOWER risk compared to non-drinkers, and even decaffeinated coffee at 4 or more cups daily carried a real 27% lower risk. The real, specific, clarifying detail: total caffeine intake from all sources and tea intake were NOT associated with gout risk at all in the same study, meaning caffeine itself is very likely not the real, protective mechanism, since decaf coffee showed a real protective effect too. The study's own authors concluded that \"long-term coffee consumption is associated with a lower risk of incident gout,\" with some other, non-caffeine component of coffee (potentially its real, documented polyphenol content or its effect on insulin sensitivity) the more likely real driver. Worth knowing alongside this app's own MASLD research, which independently found a similarly real, consistent protective coffee association for a genuinely different condition.",
    citations: [
      { source: 'Coffee Consumption and Risk of Incident Gout in Men: A Prospective Study, PMID 17530645', url: 'https://pubmed.ncbi.nlm.nih.gov/17530645/' },
    ],
    overallTier: 'strong',
    relatedIds: ['masld-coffee-protective'],
  },
  {
    id: 'gout-urate-lowering-therapy',
    category: 'gout',
    title: "Allopurinol vs. Febuxostat: A Real, Serious Cardiovascular Safety Difference Worth Knowing Directly",
    teaser: "A real, large, dedicated safety trial comparing the two most common urate-lowering medications found one carries a real, significantly higher risk of cardiovascular death.",
    summary:
      "Allopurinol and febuxostat both work by blocking xanthine oxidase, the enzyme that produces uric acid, and both are real, standard first-line options for long-term gout management. A real, large, dedicated safety trial (6,190 patients, median follow-up 32 months) was run specifically because febuxostat's own FDA approval required this real, direct comparison, and it found a real, serious, quantified difference: febuxostat carried a real 34% higher risk of cardiovascular death and a real 22% higher risk of death from any cause compared to allopurinol, even though the two performed similarly on the trial's own broader combined safety measure. This is worth knowing directly and by name in a real conversation with a prescriber, especially for anyone with existing cardiovascular risk (see this app's own dedicated cardiovascular disease research), allopurinol remains the real, standard first choice for most people specifically because of this trial's own findings, with febuxostat generally reserved for people who can't tolerate or don't respond to allopurinol.",
    citations: [
      { source: 'Cardiovascular Safety of Febuxostat or Allopurinol in Patients with Gout (CARES trial), PMID 29527974', url: 'https://pubmed.ncbi.nlm.nih.gov/29527974/' },
    ],
    overallTier: 'strong',
    relatedIds: ['cvd-overview', 'gout-hla-b5801-screening'],
  },
  {
    id: 'gout-hla-b5801-screening',
    category: 'gout',
    title: "A Real, Specific Genetic Test Worth Asking About Before Starting Allopurinol",
    teaser: "A real, rare but serious allergic reaction to allopurinol is strongly tied to one specific gene variant, and real guidelines name exactly who should be tested for it first.",
    summary:
      "Allopurinol can rarely cause a real, serious hypersensitivity reaction, ranging from a severe rash to a genuinely dangerous, whole-body reaction affecting the skin and internal organs. Real, current American College of Rheumatology guidelines recommend testing for a specific gene variant, HLA-B*58:01, before starting allopurinol in real, specifically named higher-risk groups: Han Chinese and Thai individuals regardless of kidney function (the variant appears in a real 6 to 8% of these populations), and Koreans with stage 3 or worse chronic kidney disease (a real, even higher 12% variant frequency in that specific group). The same real guidelines note this variant is considerably less common in people of European descent (roughly 2%), which is why universal testing isn't recommended, the real, elevated risk is concentrated in these specific, named populations. Worth knowing directly and asking about by name for anyone in one of these groups being considered for allopurinol, a real, one-time genetic test that can meaningfully lower the risk of a real, serious reaction before it happens rather than managing it after the fact.",
    citations: [
      { source: '2012 American College of Rheumatology Guidelines for Management of Gout, Part 1, PMID 23024028', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3683400/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'gout-flare-vs-septic-arthritis',
    category: 'gout',
    title: "A Real, Important Distinction: A Painful Joint Isn't Automatically \"Just Gout\"",
    teaser: "Gout and a real joint infection can look nearly identical, and can even happen in the same joint at the same time, which is exactly why the distinction matters so much.",
    summary:
      "A sudden, severely painful, swollen joint is the classic presentation of a gout flare, but real, standard clinical guidance is direct that septic (infected) arthritis can look nearly identical, and importantly, the two conditions can genuinely coexist in the same joint at the same time. The real, gold-standard way to tell them apart is joint fluid analysis under polarized light: gout shows real, specific needle-shaped crystals, while a real infection typically shows a much higher white blood cell count, a positive culture, and low glucose in the fluid itself. A real, direct clinical warning worth knowing: finding gout crystals in the fluid does NOT rule out a real, coexisting infection, and real guidance specifically recommends joint aspiration before giving a steroid injection when the diagnosis isn't already clear, since steroids could make an undiagnosed infection meaningfully worse. Worth knowing plainly: a first-ever severe joint flare, a flare accompanied by fever, or one that doesn't respond as expected to usual gout treatment are all real, concrete reasons to ask directly whether joint fluid should be tested before assuming it's \"just gout.\"",
    citations: [
      { source: 'Gout, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK546606/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'gout-metabolic-cluster-connection',
    category: 'gout',
    title: "Gout Rarely Travels Alone: A Real, Direct Overlap With Several Other Conditions in This App",
    teaser: "Gout's own most common real risk factors are, largely, the same conditions already built out in this app in their own right.",
    summary:
      "Real, standard medical guidance names heart failure, high blood pressure, and chronic kidney disease directly among gout's own most common real risk factors, and the real, underlying relationship runs in both directions for at least one of these. Elevated uric acid can itself contribute to real kidney damage over time, while reduced kidney function separately impairs the body's own ability to clear uric acid in the first place, a genuine, bidirectional relationship rather than a one-way cause, already covered in real depth in this app's own dedicated chronic kidney disease research. Gout also shows up alongside insulin resistance and metabolic syndrome more often than chance would predict, the same real, shared thread already documented connecting this app's own Type 2 Diabetes, PCOS, MASLD, and CKD research together. Worth knowing directly and practically: someone managing weight, blood pressure, or insulin resistance well is very likely also working on real, shared risk factors for gout at the same time, not a separate, unrelated project.",
    citations: [
      { source: 'Gout, MedlinePlus, U.S. National Library of Medicine', url: 'https://medlineplus.gov/gout.html' },
    ],
    overallTier: 'moderate',
    relatedIds: ['ckd-overview', 'cvd-overview', 'type2-metabolic-syndrome-cluster', 'foodhistory-cholesterol-real-drivers'],
  },
  {
    id: 'gout-tying-together',
    category: 'gout',
    title: "What Actually Holds Up for Gout, Pulled Together",
    teaser: "A real, unusually specific and well-studied list of individual foods and drinks, a serious medication safety distinction, and two real self-advocacy points worth knowing before either a first prescription or a first bad flare.",
    summary:
      "Line up everything in this category and gout reads as a condition where the real, individual dietary evidence is genuinely more specific and better studied than most other conditions in this app: meat and seafood measurably raise risk while dairy measurably lowers it, sugar-sweetened drinks and beer carry real, dose-dependent risk while diet soda and wine don't, and cherries, vitamin C, and coffee all carry real, individually-tested, protective associations. Medication choice carries a real, serious, quantified safety distinction (allopurinol's real cardiovascular safety advantage over febuxostat), and this category's own two self-advocacy entries matter at two genuinely different moments: HLA-B*58:01 testing before a first allopurinol prescription in specific, named higher-risk populations, and recognizing when a flare might actually be a real joint infection needing urgent, different treatment. And gout's own real, common overlap with heart, kidney, and metabolic conditions already built out elsewhere in this app means managing those well is very likely helping gout too, not a separate, unrelated effort.",
    citations: [
      { source: 'Gout, MedlinePlus, U.S. National Library of Medicine', url: 'https://medlineplus.gov/gout.html' },
    ],
    overallTier: 'strong',
    relatedIds: ['gout-purine-foods-and-dairy', 'gout-fructose-sugar-drinks', 'gout-alcohol-beer-vs-wine', 'gout-cherries', 'gout-urate-lowering-therapy', 'gout-hla-b5801-screening', 'gout-flare-vs-septic-arthritis', 'gout-metabolic-cluster-connection'],
  },

  // -- Full-depth parity additions, 2026-08-08. Every citation
  // independently verified via WebSearch. Note on pregnancy: unlike most
  // other conditions in this app, gout's own real epidemiology makes a
  // typical pregnancy-risk entry the wrong shape here -- see the entry
  // below, which covers the real, direct reason pregnancy-related gout
  // content is genuinely thin, rather than forcing a risk framing the
  // real data doesn't support.
  {
    id: 'gout-four-stage-natural-history',
    category: 'gout',
    title: "Gout's Own Real, Four-Stage Natural History -- and Why It Can Feel Completely Gone Between Attacks",
    teaser: 'Real, silent uric acid buildup can run for years before the first flare -- and the real, quiet stretches between flares aren\'t remission, the disease is still actively progressing underneath.',
    summary:
      "Gout follows a real, well-characterized four-stage natural history, worth understanding as one continuous real process rather than a series of unrelated flare-ups. Stage 1, asymptomatic hyperuricemia, involves real, elevated blood uric acid with zero symptoms, though real, silent crystal formation may already be starting in the joints. Stage 2, acute gouty arthritis, is the real, sudden, intensely painful flare most people associate with gout, typically lasting 3-10 days untreated, with real pain peaking within the first 24 hours. Stage 3, intercritical gout, is the real, deceptively quiet period between flares, someone genuinely feels fine, but real research confirms hyperuricemia and ongoing crystal deposition continue silently underneath, not a true remission at all. Stage 4, chronic tophaceous gout, the real, most severe stage, involves ongoing joint pain and visible deformity from accumulated urate crystals, typically developing 10 or more real years after the first acute attack in people whose uric acid was never adequately controlled. Worth knowing directly: feeling fine between flares (Stage 3) is exactly the real, easy-to-misread moment that urate-lowering therapy (already covered in this app's own medication research) matters most, since the real disease process doesn't actually pause just because the pain does.",
    citations: [
      { source: 'Gout, StatPearls, NCBI Bookshelf', url: 'https://www.ncbi.nlm.nih.gov/books/NBK546606/' },
    ],
    overallTier: 'strong',
    relatedIds: ['gout-urate-lowering-therapy'],
  },
  {
    id: 'gout-kidney-cardiovascular-real-data',
    category: 'gout',
    title: "Gout's Own Real Reach Into the Kidneys and Heart -- 71% of Gout Patients Carry Real, Measurable Kidney Impairment",
    teaser: 'Real, striking comorbidity data: 74% of gout patients have hypertension, 71% have real chronic kidney disease, and urate crystals themselves deposit directly in kidney tissue, not just joints.',
    summary:
      "Gout's own real reach extends directly into the kidneys and cardiovascular system, not just the joints already covered throughout this category. Real research finds uric acid crystals depositing directly in kidney tissue over time (gouty or uric acid nephropathy), with a real, pooled prevalence of chronic kidney disease (stage 3 or higher) at 24% among gout patients, and real uric acid kidney stones developing in a real 20% of gout patients specifically. The relationship runs both directions: real research finds gout prevalence itself climbing from 7.5% in early-stage CKD to 22.8% in advanced CKD, each condition genuinely worsening the other's real risk. Real, broader comorbidity data from the same population is genuinely striking: 74% of gout patients have hypertension, 71% have chronic kidney disease (stage 2 or higher), 26% have diabetes, 14% have a prior heart attack, 11% have heart failure, and 10% have had a stroke, a real, direct reason this category's own metabolic-cluster research treats gout as one connected piece of a larger real, systemic picture rather than an isolated joint problem.",
    citations: [
      { source: 'Excess Uric Acid Induces Gouty Nephropathy Through Crystal Formation: A Review of Recent Insights, PMC9329685', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9329685/' },
    ],
    overallTier: 'strong',
    relatedIds: ['gout-metabolic-cluster-connection', 'ckd-mineral-bone-cardiovascular-real-data'],
  },
  {
    id: 'gout-history-milestones',
    category: 'gout',
    title: "Gout's Own Real History: A 4,600-Year-Old Disease, and the Actual Cause Identified Only 176 Years Ago",
    teaser: '2640 BC, 1820, 1848 -- ancient Egyptians and Hippocrates both recognized the real pattern centuries before anyone knew uric acid was actually the cause.',
    summary:
      "Gout carries one of the real, longest documented histories of any condition in this app. Podagra, the real, classic acute big-toe gout attack, was first identified by ancient Egyptians around 2640 BC, and Hippocrates, in the 5th century BC, called it \"the unwalkable disease,\" real, vivid, and accurate long before anyone understood why it happened. Colchicine, gout's own oldest still-used real treatment, traces to the autumn crocus plant, used as a purgative in ancient Greece over 2,000 years ago; its first real, specific documented use for gout came from Byzantine physician Joannes Actuarius in the 4th century. The actual chemistry took far longer to reach: colchicine itself wasn't isolated as a pure compound until 1820 (by French pharmacists Pelletier and Caventou), and the real, actual root cause, uric acid, wasn't formally connected to gout until 1848, when Sir Alfred Garrod (the same real family name already covered in this app's own Rheumatoid Arthritis history research) discovered the direct link between blood/urine uric acid and gout, over 4,400 real years after the disease was first documented.",
    citations: [
      { source: 'A concise history of gout and hyperuricemia and their treatment, Arthritis Research & Therapy', url: 'https://link.springer.com/article/10.1186/ar1906' },
    ],
    overallTier: 'strong',
    relatedIds: ['ra-history-milestones'],
  },
  {
    id: 'gout-pregnancy-genuine-rarity',
    category: 'gout',
    title: "Gout During Pregnancy Is Genuinely, Remarkably Rare -- and Estrogen Itself Is the Real Reason Why",
    teaser: "This app's own Graves' and RA pregnancy research both name real hormonal shifts changing disease activity -- gout's own real story is that pregnancy hormones essentially prevent it from happening at all.",
    summary:
      "Unlike most other conditions in this app, gout doesn't have a real, typical pregnancy-risk story to tell, and that absence is itself a real, direct, worth-knowing finding. Real research finds gout genuinely rare in reproductive-age women, an incidence of just 1.6 cases per 10,000 patient-years in women aged 25-44, dramatically lower than the general population's real 0.6-2.9 per 1,000 person-years. During pregnancy specifically, real cases are exceptionally uncommon, documented mostly as individual case reports rather than any real, large cohort study. The real, well-understood mechanism: estrogen has a genuine, documented uricosuric effect, it directly helps the kidneys excrete uric acid more efficiently, and pregnancy's own real, elevated estrogen levels are believed to actively protect against a flare the same way estrogen protects premenopausal women from gout generally. This real protective effect reverses after menopause, when gout prevalence in women rises substantially, the real, mirror-image finding to the protection seen during the reproductive and pregnant years. Worth knowing directly: gout's own real story here isn't a pregnancy risk to manage, it's a real, hormone-driven reason gout and pregnancy rarely intersect at all.",
    citations: [
      { source: 'Gout in Pregnancy: A Rare Phenomenon, PMC7769799', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7769799/' },
    ],
    overallTier: 'strong',
  },

  // -- Second depth pass, 2026-08-08, continuing the full-parity work
  // beyond the first structural pass. Every citation independently
  // verified via WebSearch.
  {
    id: 'gout-diuretics-prescribing-cascade',
    category: 'gout',
    title: 'A Real, Common Prescribing Cascade: The Blood Pressure Pill Someone Takes Can Be the Real Reason Gout Started in the First Place',
    teaser: 'A real, large population study found diuretics carry a real, roughly two-and-a-half-fold higher gout risk, and combining two diuretic types together nearly doubles that again.',
    summary:
      "This is a real, direct, worth-knowing connection: diuretics, among the most commonly prescribed blood pressure and heart failure medications, are a genuine, well-documented cause of gout, not just a minor footnote. A real, large, population-based case-control study (91,530 real incident gout cases matched against controls) found diuretic use overall associated with almost two and a half times the risk of developing gout compared to no diuretic use. Broken down by real diuretic type, the risk varied: loop diuretics carried the highest individual risk (a real 2.64-fold odds increase), thiazide-like diuretics close behind (2.30-fold), plain thiazide diuretics lower but still real (1.70-fold), and potassium-sparing diuretics showing no significant increase at all. Combining a loop and a thiazide diuretic together, a real, common combination for harder-to-manage fluid retention, carried the highest real risk of any combination studied, a 4.65-fold increase. This connects directly to this app's own existing prescribing-cascade research: someone who develops gout while on a diuretic, then gets prescribed allopurinol to manage it, may be experiencing a real, textbook prescribing cascade, where the actual root cause (the diuretic itself) never gets revisited. Worth raising directly with a prescriber: whether a potassium-sparing diuretic, or a different blood-pressure medication class entirely, might be a real, reasonable alternative for someone whose gout appeared or worsened after starting a diuretic.",
    citations: [
      { source: 'Use of Diuretics and Risk of Incident Gout: A Population-Based Case-Control Study, PMID 24449584', url: 'https://pubmed.ncbi.nlm.nih.gov/24449584/' },
    ],
    overallTier: 'strong',
    relatedIds: ['advocacy-prescribing-cascade', 'gout-urate-lowering-therapy', 'ckd-nsaid-kidney-injury-real-data'],
  },

  // -- Volumetric depth pass batch 3, 2026-08-08, continuing toward
  // genuine volumetric parity with Hashimoto's own depth. Every citation
  // independently verified via WebSearch.
  {
    id: 'gout-pseudogout-cppd-distinction',
    category: 'gout',
    title: 'Pseudogout (CPPD): A Real, Commonly Confused Look-Alike Caused by a Completely Different Crystal',
    teaser: 'Pseudogout looks and feels almost exactly like gout, sudden, painful, swollen joints, but it\'s caused by calcium pyrophosphate crystals, not uric acid, and real research finds it typically strikes a different joint at a different age.',
    summary:
      "Calcium pyrophosphate deposition disease (CPPD), commonly called pseudogout, is a real, genuinely distinct condition worth knowing about directly precisely because it can look and feel almost identical to true gout at first glance. Both conditions cause a real, abrupt onset of hot, swollen, intensely painful joints, but the underlying real cause is completely different: gout is driven by uric acid crystals, while pseudogout is driven by calcium pyrophosphate (CPP) crystals, a real, chemically unrelated process. Real, useful distinguishing patterns exist: gout typically strikes just one joint at first, classically the big toe, while CPPD more often involves the knee and can affect one or more joints at once. Real research finds acute CPPD strikes an older population, most cases occurring in people over 65 and rarely presenting under 60, a genuinely different age pattern than gout, which can develop much younger. Real, definitive diagnosis requires the same real approach already covered in this app's own gout research, drawing joint fluid with a needle and examining it under a microscope, but looking specifically for calcium pyrophosphate crystals rather than the needle-shaped uric acid crystals that confirm true gout. Worth knowing directly: real research finds elevated uric acid, elevated CRP, high blood pressure, and being male can help distinguish true gout with good accuracy, but a real, confirmed diagnosis via joint fluid analysis remains the gold standard, especially in an older patient whose \"gout-like\" flare might actually be this real, separate condition requiring a different treatment approach.",
    citations: [
      { source: 'How to Differentiate Gout, Calcium Pyrophosphate Deposition Disease, and Osteoarthritis Using Just Four Clinical Parameters, PMC8224021', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8224021/' },
      { source: 'Calcium Pyrophosphate Deposition Disease, PMC6240444', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6240444/' },
    ],
    overallTier: 'strong',
    relatedIds: ['gout-flare-vs-septic-arthritis'],
  },
  {
    id: 'gout-weight-loss-uric-acid',
    category: 'gout',
    title: 'Weight Loss Genuinely Lowers Uric Acid in Gout, With Real Data Across Diet, Medication, and Bariatric Surgery',
    teaser: 'Real longitudinal studies find 75% of trials showing real benefit on gout attacks from weight loss, with real, distinct data now available from bariatric surgery, weight-loss medication, and diet changes alike.',
    summary:
      "Weight loss carries real, genuine benefit for gout beyond the metabolic-syndrome connection already covered elsewhere in this app's own gout research, worth knowing about with real, specific numbers rather than a vague \"lose weight\" recommendation. A real systematic review of 10 longitudinal studies (mean weight loss ranging from 3kg to 34kg) found six of eight studies (75%) showing real beneficial effects on actual gout attacks, with the real mechanism understood directly: weight loss increases the kidneys' own real ability to excrete urate, and to a lesser extent decreases how much urate the body produces in the first place. Real, specific intervention data now exists across several real paths: bariatric surgery showed a real, significant serum urate reduction, from 0.343 mmol/L at baseline down to 0.296 at 12 months and 0.286 at 24 months; a real 12-week trial of the weight-loss medication orlistat found a real reduction in the proportion of patients experiencing gout flares compared to placebo; and real dietary intervention studies (moderate calorie/carbohydrate restriction with more protein and unsaturated fat) found real benefit on both uric acid and cholesterol levels together. Worth knowing honestly: real research finds the quality of evidence still low-to-moderate overall, and real research finds losing weight too rapidly can temporarily raise uric acid and trigger a flare in the short term, a real, worth-knowing caution before starting an aggressive weight-loss plan. Worth knowing directly: this gives real, multiple, evidence-backed paths (diet, medication, or surgery) that all genuinely help gout specifically, not just cardiovascular risk broadly.",
    citations: [
      { source: 'Weight loss for overweight and obese individuals with gout: a systematic review of longitudinal studies, PMID 28866649', url: 'https://pubmed.ncbi.nlm.nih.gov/28866649/' },
      { source: 'Changes in Serum Urate Levels after Bariatric Surgery in Patients with Obesity, PMC11031430', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11031430/' },
    ],
    overallTier: 'strong',
    relatedIds: ['gout-metabolic-cluster-connection'],
  },
  {
    id: 'gout-colchicine-narrow-therapeutic-index',
    category: 'gout',
    title: 'Colchicine\'s Real, Genuinely Narrow Margin Between an Effective Dose and a Fatal One',
    teaser: 'Real research finds colchicine deaths reported at doses as low as 3mg, while some people have survived doses over 60mg, a real, genuinely unpredictable margin that makes exact dosing matter enormously.',
    summary:
      "Colchicine, already named in this app's own gout medication research, deserves its own real, dedicated safety entry, since real research finds it carries a genuinely narrow therapeutic index, meaning the real gap between an effective dose and a toxic or fatal one is unusually small and unpredictable compared to most medications. Real research finds effective steady-state blood concentrations running 0.5 to 3 micrograms per liter, with toxic effects beginning at roughly that same upper number, real evidence there's no clean, reliable line separating a safe dose from a dangerous one. Genuinely striking: real case data finds colchicine deaths reported at doses as low as 3mg, while other patients have survived doses exceeding 60mg, real, dramatic individual variability that makes this drug genuinely harder to dose safely than most. Real research finds toxicity unfolds in a real, distinct pattern, an early gastrointestinal phase (nausea, vomiting, diarrhea), followed by a deceptively quiet latent period, then a real, dangerous multi-organ phase involving bone marrow suppression, heart rhythm problems, respiratory failure, and kidney injury. Real, elevated risk concentrates specifically in the elderly, anyone with impaired kidney function, and anyone taking a second medication that blocks the same clearance pathway (a P-glycoprotein or CYP3A4 inhibitor, already worth cross-checking against this app's own interaction-checking research). Worth knowing directly: colchicine dosing needs real, careful attention to kidney function and other medications, not casual self-adjustment, and any accidental double-dose or suspected overdose deserves real, immediate medical attention rather than a wait-and-see approach.",
    citations: [
      { source: 'Colchicine: the good, the bad, the ugly and how to minimize the risks, PMC10986813', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10986813/' },
      { source: 'Colchicine, StatPearls / NCBI Bookshelf', url: 'https://www.ncbi.nlm.nih.gov/books/NBK431102/' },
    ],
    overallTier: 'strong',
    relatedIds: ['gout-urate-lowering-therapy'],
  },
];
