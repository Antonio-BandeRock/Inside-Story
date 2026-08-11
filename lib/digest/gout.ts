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
  {
    id: 'gout-dash-diet-quality',
    category: 'gout',
    title: 'The Whole Pattern of a Diet, Not Just Individual Foods, Predicts Gout Risk Too',
    teaser: 'A 26-year study of over 44,000 men found the DASH diet pattern tracked with roughly a third lower gout risk, while a Western diet pattern tracked with 42% higher risk, in the same real cohort.',
    summary:
      "This category's own research already covers specific individual foods and drinks with real, documented gout risk (purines, fructose, beer, dairy, cherries). A separate, real question is whether the overall SHAPE of someone's diet matters on its own, beyond any single food. A real, large prospective cohort study followed 44,444 men with no history of gout for 26 years, documenting 1,731 new gout cases, and scored each participant's diet against two real, established dietary patterns: DASH (vegetables, fruit, whole grains, low-fat dairy, reduced sodium and saturated fat) and a Western pattern (red and processed meat, refined grains, sweets). People in the highest fifth of DASH-pattern adherence had a real 32% lower risk of developing gout than those in the lowest fifth, while people in the highest fifth of Western-pattern adherence had a real 42% higher risk. A separate, real 28-year cohort of women found a similar DASH-pattern protective effect. Worth knowing directly: this is real, independent evidence for eating a genuinely different overall pattern, not just swapping out one or two trigger foods, and it lines up with the same DASH pattern already carrying real, independent blood-pressure evidence in this app's own cardiovascular research, a real, practical overlap for anyone managing both conditions at once.",
    citations: [
      { source: 'The Dietary Approaches to Stop Hypertension (DASH) diet, Western diet, and risk of gout in men: prospective cohort study, BMJ 2017 (Rai et al.), PMID 28487277', url: 'https://pubmed.ncbi.nlm.nih.gov/28487277/' },
    ],
    overallTier: 'strong',
    relatedIds: ['gout-purine-foods-and-dairy', 'cvd-dash-sodium'],
  },
  {
    id: 'gout-losartan-uricosuric-effect',
    category: 'gout',
    title: 'One Blood Pressure Medication Genuinely Lowers Uric Acid, While the Rest of Its Own Drug Class Doesn\'t',
    teaser: 'Losartan is the one angiotensin receptor blocker that measurably lowers uric acid through a real, specific kidney mechanism, while other drugs in the exact same class tend to raise it instead.',
    summary:
      "Blood pressure medications aren't all neutral when it comes to uric acid, and one specific drug stands out from its own class in a real, well-documented way. Losartan, an angiotensin II receptor blocker (ARB), genuinely lowers serum uric acid, by a real, measured 0.5 to 1 mg/dL in clinical data, through a specific mechanism: it blocks a kidney transporter called URAT1 that would otherwise pull uric acid back into the bloodstream, letting more of it pass out in urine instead. A real, controlled comparison found this effect specific to losartan itself, not a general property of ARBs. Other drugs in the exact same medication class, including valsartan, telmisartan, candesartan, and olmesartan, showed no such effect, and some measurably raised uric acid levels instead. This isn't framed here as a reason to switch blood pressure medications without medical guidance, real individual factors (kidney function, other health conditions, how well blood pressure itself is controlled) all matter to that decision. It's real, concrete, worth-knowing context for a real conversation: anyone managing both high blood pressure and gout has a genuine, evidence-backed reason to ask specifically whether losartan might serve both goals at once, rather than treating the choice of blood pressure medication as unrelated to gout management.",
    citations: [
      { source: 'Uricosuric action of losartan via the inhibition of urate transporter 1 (URAT1) in hypertensive patients, American Journal of Hypertension 2008, PMID 18670416', url: 'https://pubmed.ncbi.nlm.nih.gov/18670416/' },
    ],
    overallTier: 'strong',
    relatedIds: ['gout-diuretics-prescribing-cascade', 'gout-metabolic-cluster-connection'],
  },
  {
    id: 'gout-il1-blockade-canakinumab',
    category: 'gout',
    title: 'A Real, Newer Medication Class Interrupts a Gout Flare at Its Own Root Inflammatory Trigger',
    teaser: 'Canakinumab, a real IL-1-blocking biologic, resolved gout flares in a real median of 4.2 days versus 7.8 days for a standard steroid, for people who genuinely can\'t use standard treatments.',
    summary:
      "This category's own research already covers standard acute gout treatments (colchicine, NSAIDs, steroids). Interleukin-1 (IL-1) blockade is a real, newer, mechanistically distinct option, working at the actual root trigger of a gout flare rather than dampening inflammation generally. Real research finds monosodium urate crystals directly activate a specific cellular alarm system (the NLRP3 inflammasome), which releases IL-1-beta and drives the flood of neutrophils causing a flare's own real pain and swelling. Canakinumab, a real IL-1-targeting biologic, was tested directly against a standard steroid injection (triamcinolone) in two real, randomized, active-controlled trials, and found a real median time to flare resolution of 4.2 days versus 7.8 days for the steroid, alongside a real, larger reduction in a measured inflammation marker (CRP). A real, pooled analysis of 10 randomized trials confirmed IL-1 blockade (canakinumab, anakinra, and a related drug, rilonacept) genuinely shortens flare duration compared with placebo. Worth knowing directly, and genuinely important: canakinumab reduces flare RISK and severity, but real research confirms it does NOT lower the underlying serum uric acid level itself, so it's a real, targeted flare-management tool, not a substitute for this category's own already-covered urate-lowering therapy. Its real, current, practical role is for people who can't safely use standard options (NSAIDs, colchicine, steroids), due to kidney disease, other real medical contraindications, or a poor prior response.",
    citations: [
      { source: 'Canakinumab for acute gouty arthritis in patients with limited treatment options: results from two randomised, multicentre, active-controlled, double-blind trials, PMID 22586173', url: 'https://pubmed.ncbi.nlm.nih.gov/22586173/' },
    ],
    overallTier: 'strong',
    relatedIds: ['gout-colchicine-narrow-therapeutic-index', 'gout-urate-lowering-therapy'],
  },
  {
    id: 'gout-menopause-estrogen-risk',
    category: 'gout',
    title: 'Gout Is Rare in Women Before Menopause, Then Rises Sharply, With a Real, Honest Twist on Hormone Therapy',
    teaser: 'Estrogen genuinely protects against gout before menopause, but real, large studies on whether replacing it afterward helps or hurts reach genuinely conflicting conclusions.',
    summary:
      "Gout is real, well-known to be far more common in men, but that gap narrows sharply after menopause, worth knowing directly for a condition often assumed to be a mostly-male concern. Real research finds premenopausal women genuinely protected by estrogen's own uricosuric effect, meaning estrogen helps the kidneys clear uric acid more efficiently, real research finds this protection measurably fades starting years before menopause itself, with serum urate levels rising sharply through the menopausal transition and staying elevated afterward. Worth knowing honestly, since it isn't a simple 'replace the hormone, fix the risk' story: real evidence on postmenopausal hormone therapy is genuinely conflicting. One real study found postmenopausal hormone use tracked with an 18% LOWER risk of developing gout. A real, separate, much larger study of over 1 million postmenopausal women found the opposite, both hormone replacement therapy and earlier oral contraceptive use tracked with a real, INCREASED gout risk. Worth knowing directly: this genuine, unresolved contradiction in the real evidence means hormone therapy shouldn't be assumed either protective or risky for gout specifically, it's real, worth naming directly in a conversation about hormone therapy for other reasons, without treating gout risk as a settled factor either way.",
    citations: [
      { source: 'Menopause, Postmenopausal Hormone Use and Risk of Incident Gout, PMC3142742', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3142742/' },
      { source: 'Association between female reproductive factors and gout: a nationwide population-based cohort study of 1 million postmenopausal women, Arthritis Research & Therapy 2021, PMC8675498', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8675498/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['gout-four-stage-natural-history'],
  },
  {
    id: 'gout-early-onset-genetic-kidney-cause',
    category: 'gout',
    title: 'Gout Before Age 40 Is Different: Genetics, Not Diet, Is Usually the Real Driver',
    teaser: 'Gout diagnosed in someone under 40 is far more likely to trace back to a real, identifiable genetic or kidney cause than to lifestyle alone, and often warrants real, dedicated testing.',
    summary:
      "Gout is usually framed as a disease of aging, but when it shows up early, in the teens, twenties, or thirties, real research points toward a genuinely different, more concentrated set of causes than the diet and lifestyle factors this category otherwise emphasizes. Adolescents and young adults with gout tend to have real, measurably higher uric acid levels, faster development of tophi (visible urate deposits), and a real, higher rate of family history compared with people who develop gout later in life, evidence that genetics plays an even larger role in early-onset cases than in the more common, later-life form. Two real, specific genetic causes account for a meaningful share of these early cases: mutations in the UMOD gene cause a distinct inherited kidney condition (ADTKD-UMOD) that produces early hyperuricemia, gout, and progressive kidney scarring, often reaching kidney failure by around age 40, and dysfunction in the ABCG2 urate transporter gene is strongly associated with pediatric- and early-onset hyperuricemia and gout independent of any kidney disease. Worth knowing directly: gout appearing well before the typical age, especially alongside a family history of gout or unexplained kidney problems, is a real, reasonable trigger for asking a doctor about genetic testing or a kidney-function workup, rather than assuming diet alone explains it.",
    citations: [
      { source: 'A novel uromodulin mutation in autosomal dominant tubulointerstitial kidney disease, BMC Nephrology, PMC6014484', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6014484/' },
      { source: 'Identification of Two Dysfunctional Variants in the ABCG2 Urate Transporter Associated with Pediatric-Onset of Familial Hyperuricemia and Early-Onset Gout, PMC7920026', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7920026/' },
    ],
    overallTier: 'strong',
    relatedIds: ['gout-kidney-cardiovascular-real-data', 'gout-four-stage-natural-history'],
  },
  {
    id: 'gout-global-oceania-genetic-urate',
    category: 'gout',
    title: 'Gout Hits Pacific Islander and Māori Populations Hardest, and Real Genetics Largely Explains Why',
    teaser: "The world's highest documented gout prevalence sits in Oceania, among Māori, Pacific Islander, and Taiwanese Aboriginal populations, tied to a real, well-characterized genetic variant that reduces how efficiently the kidneys clear uric acid.",
    summary:
      "Gout shows one of the clearest real gene-driven geographic patterns of any condition in this app. The world's highest documented gout prevalence is found in Oceania, specifically among Māori and other Pacific Islander populations, with Taiwan's own Aboriginal population showing a similarly elevated real rate. The real, specific mechanism is well characterized: studies in New Zealand found Māori and Pacific Islander populations carry a real, higher frequency of specific variants in the SLC2A9 gene (which encodes the GLUT9 urate transporter in the kidney), and these variants cause a real, measurable reduction in how efficiently the kidneys clear uric acid from the blood, directly raising baseline serum urate levels independent of diet. Several other real urate-transporter genes (ABCG2, SLC22A11, SLC22A12, SLC17A1) show similar population-specific patterns tied to gout risk. Worth knowing directly: this app's own already-covered dietary gout research (purine-rich meat/seafood, sugar-sweetened drinks, alcohol, coffee's protective effect) still matters for anyone of Māori or Pacific Islander ancestry, but it operates on top of a real, genuinely different, higher genetic baseline risk than in most other populations studied, meaning diet alone can't fully explain a family history of gout in these specific populations the way it might elsewhere.",
    citations: [
      { source: 'Hyperuricaemia and gout in the Pacific, Nature Reviews Rheumatology', url: 'https://www.nature.com/articles/s41584-025-01228-7' },
      { source: 'Association analysis of the SLC22A11 (organic anion transporter 4) and SLC22A12 (urate transporter 1) urate transporter locus with gout in New Zealand case-control sample sets, PMC3978909', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3978909/' },
    ],
    overallTier: 'strong',
    relatedIds: ['gout-overview', 'gout-hla-b5801-screening'],
  },
  {
    id: 'gout-global-china-rising-westernization',
    category: 'gout',
    title: "Gout Is Rising Fast in China, and the Real Cause Traces Directly to Diet, Not Genetics This Time",
    teaser: "China's own gout prevalence rose from 640.7 to 810.4 per 100,000 between 1990 and 2021, tracking directly with a real, documented shift toward meat, seafood, alcohol, and sugary drinks.",
    summary:
      "This category's own already-covered Oceania research explains gout risk driven mainly by real, inherited genetic variation. China's own real, rapidly rising gout rate tells a genuinely different kind of story, one driven mainly by real, fast dietary change. Real data finds gout prevalence in China rising from 640.7 to 810.4 cases per 100,000 between 1990 and 2021, with total case counts climbing from roughly 6 million to nearly 17 million over the same period. The real, documented driver: rapid dietary Westernization, a shift from a predominantly plant-based diet toward one genuinely higher in meat, seafood, alcohol, and sugar-sweetened beverages, the exact same real risk factors this category's own dietary research already covers in depth. Real research finds gout prevalence tracking directly with rising meat and seafood consumption specifically, and frequent alcohol use showing up substantially more often among people with gout or elevated uric acid. Worth knowing directly: this is a real, useful contrast to the Oceania entry elsewhere in this category, gout's real global rise isn't one single story, it's genetics driving extreme risk in some populations (Oceania) and real, fast dietary change driving a genuinely new, rapidly rising burden in others (China), both real and worth knowing depending on which real risk factor applies to a given person's own background.",
    chart: {
      title: 'Gout prevalence in China, 1990 vs. 2021',
      unit: 'per 100,000',
      data: [
        { label: '1990', value: 640.7 },
        { label: '2021', value: 810.4 },
      ],
      sourceNote: 'A comprehensive analysis of trends in the burden of gout in China and globally from 1990 to 2021, PMC11770106',
    },
    citations: [
      { source: 'A comprehensive analysis of trends in the burden of gout in China and globally from 1990 to 2021, PMC11770106', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11770106/' },
    ],
    overallTier: 'strong',
    relatedIds: ['gout-global-oceania-genetic-urate', 'gout-purine-foods-and-dairy'],
  },
  {
    id: 'horizon-gout',
    category: 'gout',
    title: 'Real, Early Research Is Testing Whether Specific Gut Bacteria Can Be Recruited to Lower Uric Acid Directly',
    teaser: "This category's own already-covered gut-microbiome connection to hyperuricemia is now being tested as an actual treatment: a real synbiotic combination measurably lowered uric acid and inflammation in patients already on allopurinol.",
    summary:
      "Real research finds gut bacteria play a genuine, direct role in how the body processes and clears uric acid, through several real mechanisms: breaking down dietary purines, helping excrete urate, and maintaining the gut's own protective barrier. The real, current research direction is testing whether that connection can become an actual add-on treatment, not just an explanation. In one real study, gout patients already taking allopurinol (this category's own already-covered urate-lowering therapy) who also received a synbiotic (a specific probiotic strain, Lactobacillus, paired with a prebiotic fiber) showed real, measurable reductions in both blood uric acid and CRP (a real inflammation marker), alongside a real, favorable shift in their own gut bacteria composition toward species that break down purines more effectively. A real, EU-funded research project (Bugs4Urate) is now working to develop a purpose-built probiotic specifically for uric acid, informed directly by a person's own individual diet, gut bacteria, and genetics, with real early laboratory work aiming toward human trials by 2026. Worth knowing honestly: real research in this area is still mostly observational, exactly which gut bacteria genuinely drive urate levels remains inconsistent across studies, and this is a real, promising early direction meant to complement existing gout medications, not replace them.",
    citations: [
      { source: 'Strategies to reduce uric acid through gut microbiota intervention', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12426027/' },
      { source: 'On the trail of microbes: Using bugs to tame urate and advance gout prevention', url: 'https://www.innovationnewsnetwork.com/on-the-trail-of-microbes-using-bugs-to-tame-urate-and-advance-gout-prevention/62873/' },
    ],
    overallTier: 'weak',
    relatedIds: ['gout-urate-lowering-therapy'],
  },
  {
    id: 'horizon-gout-pegloticase',
    category: 'gout',
    title: "Gout's Own Strongest Real Drug Has a Real Weakness the Field Is Actively Trying to Fix",
    teaser: 'Pegloticase, the most powerful uric-acid-clearing drug this category covers, loses effectiveness in a real 41% of patients because the immune system attacks the drug itself, and real, active trials are testing two different fixes.',
    summary:
      "For gout that hasn't responded to this category's own already-covered allopurinol or febuxostat, pegloticase offers a real, genuinely more powerful option, an enzyme that breaks down uric acid directly. It carries a real, well-documented weakness: real research found 41% of patients developed high levels of antibodies against the drug itself, and a further 40% developed antibodies against the PEG coating used to help the drug last longer in the body, both real immune reactions that reduce how well the drug keeps working and raise the risk of infusion reactions. Two real, distinct fixes are being actively tested. A real Phase 2 trial (RECIPE) is testing whether a short course of a separate immune-suppressing drug, taken alongside pegloticase, can reduce this immune reaction and let the drug keep working longer. Separately, a real, newer uricase sourced from plants rather than the original bacterial/mammalian source (PRX-115) is now in real Phase 1 safety testing, designed specifically to be less likely to trigger this same immune response in the first place. Worth knowing directly: this is a real, active, two-pronged effort to fix a genuine, already-known limitation of one of this category's own most powerful existing treatments, not a search for something entirely new.",
    citations: [
      { source: 'Reducing Immunogenicity of Pegloticase With Concomitant Use of Mycophenolate Mofetil in Patients With Refractory Gout, PMC8324571', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8324571/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['gout-urate-lowering-therapy', 'horizon-gout'],
  },
  {
    id: 'gout-depression-anxiety-real-data',
    category: 'gout',
    title: 'A Gout Diagnosis Itself Measurably Raises the Real Onset Rate of Depression and Anxiety',
    teaser: 'A real, population-based incident cohort study found new depression and anxiety diagnoses genuinely more common after a gout diagnosis than in matched controls, tracking directly with how often and how severely gout actually flares.',
    summary:
      'A real, population-based incident cohort study found the real rate of new depression diagnoses running higher in gout patients than matched controls after diagnosis (12.9 per 1,000 person-years versus 11.1), with a real, similar pattern for anxiety (5.4 versus 4.6 per 1,000 person-years) -- genuine, measurable increases, not dramatic ones, but real and consistent. Real, pooled prevalence estimates vary considerably across different studies (anywhere from under 2 percent to as high as 40 percent for depression, a real reflection of how differently various studies define and measure it), with one real, pooled analysis across 36,708 gout patients settling on 6 percent for anxiety specifically. The real, most useful finding for someone managing gout day to day: the real, identified determinants of who\'s more likely to develop these symptoms are directly, mechanically tied to the disease\'s own severity, a higher frequency of real gout attacks, having gout in multiple joints at once, a greater number of visible tophi, and the real, resulting disability and reduced quality of life -- a real, direct, actionable reason that genuinely managing flare frequency (the same real, food-and-medication-driven goal this app\'s own Gout research already centers on) may carry a real mental-health benefit too, not just a joint-pain one.',
    citations: [
      { source: 'Onset of depression and anxiety among patients with gout after diagnosis: a population-based incident cohort study, BMC Rheumatology', url: 'https://bmcrheumatol.biomedcentral.com/articles/10.1186/s41927-022-00288-6' },
      { source: 'Epidemiology of Depression and Anxiety in Gout: A Systematic Review and Metaanalysis, The Journal of Rheumatology', url: 'https://www.jrheum.org/content/48/1/129' },
    ],
    overallTier: 'moderate',
    relatedIds: ['mentalhealth-overview'],
  },
  {
    id: 'gout-tophi-real-prevalence-joint-damage',
    category: 'gout',
    title: "Tophi Are More Than a Visible Sign of Gout -- They're Real, Ongoing Joint Damage",
    teaser: 'Real data finds visible urate deposits, tophi, developing in up to a third of gout patients, and real research directly links them to worse joint damage and higher mortality, not just cosmetic concern.',
    summary:
      "This category's own already-covered four-stage natural history names chronic tophaceous disease as the final, most advanced stage, and real prevalence data confirms how common it genuinely is: tophi (hard, chalky deposits of urate crystals visible under the skin, usually near joints or the ears) develop in a real 12 to 35 percent of people with gout overall, with some regional studies finding rates over 50 percent in populations with less-controlled disease. The real, worth-stating point is that tophi aren't merely a cosmetic sign of long-standing gout, real research directly links them to structural joint damage, chronic joint pain and erosion, and a real, measurably increased mortality risk, distinct from the risk of gout flares alone. A real, identified genetic factor compounds this in some populations: variants in the ABCG2 gene, already relevant to how efficiently the body clears uric acid, are associated with a real, higher risk of developing tophaceous disease specifically. The real, actionable takeaway, directly consistent with this category's own urate-lowering-therapy entry: real clinical guidance names getting uric acid levels reliably below the crystal-formation threshold as the single most effective real strategy for preventing tophi from forming or growing further, not just for reducing flare frequency.",
    citations: [
      { source: 'Tophaceous Gout, PMC11842507', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11842507/' },
      { source: 'The gouty tophus: a review, PMID 25761926', url: 'https://pubmed.ncbi.nlm.nih.gov/25761926/' },
    ],
    overallTier: 'strong',
    relatedIds: ['gout-four-stage-natural-history', 'gout-urate-lowering-therapy'],
  },
  {
    id: 'gout-sleep-apnea-bidirectional-real-data',
    category: 'gout',
    title: 'Gout and Sleep Apnea Genuinely Raise Each Other\'s Risk',
    teaser: 'A real, 1.74-million-person Medicare cohort found gout more than doubling the risk of a new sleep apnea diagnosis, with real, separate evidence the relationship runs the other direction too.',
    summary:
      "A real, large observational study of 1.74 million older US adults (Medicare beneficiaries, 65 and up) found people with gout carried a real, significantly higher risk of a new obstructive sleep apnea diagnosis, a hazard ratio of 2.07 after adjusting for other real risk factors, with crude incidence rates of 14.3 per 1,000 person-years in people with gout versus 3.9 per 1,000 in people without it. A real, separate study found the relationship runs in the other direction too, matching people by body mass index specifically so the association couldn't simply be explained by shared obesity, and still found newly diagnosed sleep apnea tracking with a real, elevated risk of subsequently developing gout. This genuine, bidirectional link plausibly connects to already-covered biology elsewhere in this category and this Digest: sleep apnea's own intermittent oxygen deprivation raises uric acid production, while gout's own inflammation and any resulting kidney strain can worsen the vascular and metabolic factors that predispose someone to sleep apnea. Worth knowing directly: real research separately finds that treating co-existing sleep apnea in people with gout and elevated uric acid tracks with reduced premature mortality, real, practical reason to mention sleep quality and possible apnea symptoms (snoring, daytime fatigue) directly to a doctor managing gout, not treat them as two unconnected issues.",
    citations: [
      { source: 'Gout and the Risk of Incident Obstructive Sleep Apnea in Adults 65 Years or Older, PMID 30176977', url: 'https://pubmed.ncbi.nlm.nih.gov/30176977/' },
      { source: 'Obstructive sleep apnea and the risk of gout: a population-based case-control study, PMC7183677', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7183677/' },
    ],
    overallTier: 'strong',
    relatedIds: ['gout-metabolic-cluster-connection', 'masld-sleep-apnea-bidirectional'],
  },
  {
    id: 'gout-allopurinol-dose-escalation-adherence',
    category: 'gout',
    title: "Allopurinol Often Needs a Real Dose Increase to Actually Work, and Real Data Finds Adherence Is a Genuine Barrier",
    teaser: "A real, randomized trial found dose-escalating allopurinol past a standard starting dose let 69% of patients reach their target urate level, and real-world data finds a low starting dose predicts whether people actually keep taking it.",
    summary:
      "This category's own already-covered urate-lowering-therapy entry names allopurinol as the real, standard first-line option, and real trial data finds a common, correctable gap in how it's often used: many patients are started on a standard dose and never escalated further, even when their uric acid stays above the real, already-covered target threshold this category names for preventing tophi and flares. A real, randomized controlled trial (183 participants, published in Annals of the Rheumatic Diseases) found that among patients still above target on a starting dose (averaging 269 mg/day), a real, structured dose-escalation protocol got 69 percent to reach their target serum urate level, with 59 percent sustaining it across the following visits, real, direct evidence that under-dosing, not treatment failure, explains a genuine share of allopurinol's real-world underperformance. A real, separate adherence study of 612 gout patients found a related, practical pattern: only 63 percent were adherent to their medication at all, and adherence itself was more likely among patients who started on a real, lower initial dose (100 mg/day or less) before escalating, rather than a higher starting dose. Worth stating directly: a gout patient whose flares continue despite taking allopurinol is worth a real conversation about dose escalation and confirmed urate levels before assuming the medication itself isn't working, since real evidence finds many cases resolve with a higher, properly titrated dose rather than a drug switch.",
    citations: [
      { source: 'A randomised controlled trial of the efficacy and safety of allopurinol dose escalation to achieve target serum urate in people with gout, PMID 28314755', url: 'https://pubmed.ncbi.nlm.nih.gov/28314755/' },
      { source: 'Allopurinol Medication Adherence as a Mediator of Optimal Outcomes in Gout Management, PMID 28816767', url: 'https://pubmed.ncbi.nlm.nih.gov/28816767/' },
    ],
    overallTier: 'strong',
    relatedIds: ['gout-urate-lowering-therapy', 'gout-hla-b5801-screening'],
  },
  {
    id: 'gout-acute-flare-treatment-real-comparative-trials',
    category: 'gout',
    title: 'NSAIDs, Colchicine, and Steroids: Real, Head-to-Head Trials Find All Three Work About Equally Well for a Gout Flare',
    teaser: "This category's own already-covered colchicine entry names its own narrow therapeutic index -- real, direct comparative trials find naproxen and steroids often work just as well for an acute flare, real, useful alternatives worth knowing.",
    summary:
      "This category's own already-covered colchicine research names its own real, narrow safety margin, and real, direct comparative trials find the three standard acute-flare treatments, NSAIDs, colchicine, and oral corticosteroids, genuinely comparable in real-world effectiveness, giving a real, practical reason to consider alternatives when one isn't well tolerated. The real CONTACT trial, a real, multicenter, primary-care randomized study, directly compared naproxen against low-dose colchicine and found no significant difference in pain reduction over the first week, though the two carried real, different side-effect profiles: colchicine caused more diarrhea (45.9 percent vs. 20.0 percent) and headache, while naproxen caused more constipation. A real, separate, pragmatic, multicenter, double-blind trial found oral prednisolone (a corticosteroid) performing comparably to standard NSAID treatment for acute gout, real evidence supporting steroids as a genuine, real alternative, particularly relevant for anyone whose kidney function or GI history already limits NSAID use, both real, common considerations elsewhere in this category. A real, current guideline from the American College of Physicians directly reflects this real equivalence, recommending any of the three as reasonable first-line options based on individual patient factors rather than ranking one above the others. Worth stating directly: this is real, useful, actionable choice, not a hierarchy, worth discussing directly with a doctor based on which side-effect profile fits an individual's own real health picture best.",
    citations: [
      { source: 'Open-label randomised pragmatic trial (CONTACT) comparing naproxen and low-dose colchicine for the treatment of gout flares in primary care, PMC7025732', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7025732/' },
      { source: 'Oral Prednisolone in the Treatment of Acute Gout: A Pragmatic, Multicenter, Double-Blind, Randomized Trial, Annals of Internal Medicine', url: 'https://doi.org/10.7326/m14-2070' },
    ],
    overallTier: 'strong',
    relatedIds: ['gout-colchicine-narrow-therapeutic-index', 'gout-flare-vs-septic-arthritis'],
  },
];
