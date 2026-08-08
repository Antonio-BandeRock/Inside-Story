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
];
