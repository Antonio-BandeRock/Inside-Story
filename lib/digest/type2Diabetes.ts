import type { DigestEntry } from './types';

// Type 2 Diabetes -- 10 entries, added 2026-08-08 as this app's
// fourteenth real condition, and its fourth genuinely non-autoimmune one
// (after PCOS, Chronic Kidney Disease, and Fatty Liver Disease). T2D sits
// at the real center of the metabolic-syndrome cluster this session has
// been building out condition by condition -- insulin resistance is the
// same core mechanism already covered for PCOS, the same liver-fat
// storage mechanism already covered for MASLD, and the same
// eGFR/potassium-monitoring machinery already covered for CKD, all
// converging on this one condition. This category leans deliberately
// heavily on cross-links to that already-built content rather than
// re-deriving it, and focuses its own new material on what's genuinely
// specific to T2D itself: its own real remission evidence, its own real
// distinction from Type 1 Diabetes (already built out in this app,
// genuinely often confused with T2D by name alone), and its own real,
// recent treatment-guideline paradigm shift.
//
// Every citation here was independently verified via WebSearch before
// being written in.
export const TYPE_2_DIABETES_ENTRIES: DigestEntry[] = [
  {
    id: 'type2-overview',
    category: 'type2Diabetes',
    title: 'Type 2 Diabetes: Insulin Resistance First, Not an Immediate Insulin Shortage',
    teaser: 'The body still makes insulin here, often plenty of it at first. The real problem is that cells stop responding to it properly.',
    summary:
      "Type 2 diabetes (T2D) typically begins with insulin resistance: cells throughout the body stop responding normally to insulin, so blood glucose stays elevated even while the pancreas is still producing insulin, often producing more of it than usual to compensate. Over real, extended time, this compensatory overproduction can wear down the pancreas's own insulin-producing cells, and blood sugar control genuinely worsens as that capacity declines. Real, major risk factors include being overweight or obese, physical inactivity, and genetic/family history, and T2D represents the large majority of all diabetes cases. This category sits at the real center of a cluster of conditions this app already covers in depth, insulin resistance is the same core mechanism already documented for PCOS, the same liver-fat-storage driver already documented for MASLD, and T2D itself is one of the two most common real causes of CKD, cross-linked throughout rather than re-explained. This category focuses on what's genuinely specific to T2D itself: its own real remission evidence, its own real distinction from Type 1 Diabetes, and a real, recent shift in how it's actually treated.",
    citations: [
      { source: 'Type 2 Diabetes, MedlinePlus, U.S. National Library of Medicine', url: 'https://medlineplus.gov/diabetestype2.html' },
    ],
    overallTier: 'strong',
    relatedIds: ['pcos-insulin-resistance-mechanism', 'masld-overview'],
  },
  {
    id: 'type2-vs-type1-distinction',
    category: 'type2Diabetes',
    title: 'Type 2 vs. Type 1: The Same Word, Two Genuinely Different Diseases',
    teaser: "Sharing a name causes real, common confusion. The underlying mechanism, typical onset, and treatment approach all genuinely differ.",
    summary:
      "Type 1 and Type 2 diabetes share a name and a shared end result (elevated blood glucose), but the real underlying disease is genuinely different, and this app already covers Type 1 diabetes in its own dedicated category, worth knowing directly to avoid real, common confusion between the two. Type 1 is a real autoimmune disease, the immune system directly destroys the pancreas's own insulin-producing cells, typically starting in childhood or young adulthood, and requires insulin from diagnosis onward since the body's own real insulin production genuinely stops. Type 2 is a real, primarily metabolic disease (see this category's own overview entry), usually developing gradually in adulthood, strongly linked to insulin resistance rather than an autoimmune attack, and often manageable, at least initially, without insulin at all. A real, practical consequence of this difference: T2D's own real onset typically predates its actual diagnosis by years, since insulin resistance develops gradually and symptoms can be mild or absent early on, a genuine reason this category's own screening entry recommends starting complication screening immediately at diagnosis rather than waiting, unlike T1D's own more identifiable onset.",
    citations: [
      { source: 'Type 2 Diabetes, MedlinePlus, U.S. National Library of Medicine', url: 'https://medlineplus.gov/diabetestype2.html' },
    ],
    overallTier: 'strong',
    relatedIds: ['type1-overview', 'type2-screening-at-diagnosis'],
  },
  {
    id: 'type2-direct-remission-trial',
    category: 'type2Diabetes',
    title: 'Real, Randomized Trial Evidence That T2D Can Genuinely Go Into Remission',
    teaser: 'Not a claim from a diet book. A real, large clinical trial found nearly half of participants reached a genuine non-diabetic state within a year.',
    summary:
      "The DiRECT trial (Diabetes Remission Clinical Trial), a real, large, open-label, cluster-randomized trial run through UK primary care practices, found something genuinely striking: 46% of participants who received a structured, primary-care-led weight-management program (built around a low-calorie total diet replacement phase followed by structured food reintroduction) achieved real, complete diabetes remission at 12 months, defined strictly as HbA1c under 6.5% while off all diabetes medication for at least two months. A real, later extension found 36% remained in remission at 2 years, and a real, longer 5-year follow-up confirmed remission genuinely sustained in some participants that far out. The real, co-primary outcome behind this: participants who achieved at least 15 kg (about 33 lbs) of weight loss saw dramatically higher remission rates than those who lost less. This app's own existing self-advocacy research already cites this same real trial's own separate, additional finding, that 28% of participants who achieved remission remained completely off blood pressure medication too, a real, honest example of a prescribing cascade running in reverse once an underlying driver genuinely improves.",
    citations: [
      { source: 'Lean MEJ, et al., The Lancet, 2018, "Primary care-led weight management for remission of type 2 diabetes (DiRECT): an open-label, cluster-randomised trial," PMID 29221645', url: 'https://pubmed.ncbi.nlm.nih.gov/29221645/' },
    ],
    overallTier: 'strong',
    relatedIds: ['advocacy-prescribing-cascade'],
  },
  {
    id: 'type2-low-carb-diet-evidence',
    category: 'type2Diabetes',
    title: 'Low-Carbohydrate Diets: Real, Strong Short-Term Evidence, With an Honest Caveat About What "Remission" Actually Means',
    teaser: 'A real meta-analysis found nearly double the remission rate on a low-carb diet. A closer look at how remission gets defined changes the picture somewhat.',
    summary:
      "A real systematic review and meta-analysis of published and unpublished randomized trial data found low-carbohydrate diets achieved real, significantly higher rates of diabetes remission (HbA1c under 6.5%) at six months, 57% on a low-carbohydrate diet versus 31% on a control diet, alongside a real, measurable HbA1c reduction, most pronounced at the 3-month mark. A real, honest caveat the same review names directly: when remission was defined more strictly, HbA1c under 6.5% specifically while off all diabetes medication, the real, measured benefit shrank and lost statistical significance, suggesting some of the apparent remission gain in the looser definition may reflect medication changes made alongside the diet rather than diet effects alone. A separate real 12-month trial found a very low-carbohydrate ketogenic diet produced a real, greater HbA1c reduction (6.6% to 6.1%) than a moderate-carbohydrate diet (6.9% to 6.7%) in the same population. Worth knowing directly: low-carbohydrate eating shows real, genuine short-term benefit, honestly reported alongside the real complexity in how different trials define \"remission\" itself.",
    citations: [
      { source: 'Efficacy and safety of low and very low carbohydrate diets for type 2 diabetes remission: systematic review and meta-analysis of published and unpublished randomized trial data, PMID 33441384', url: 'https://pubmed.ncbi.nlm.nih.gov/33441384/' },
    ],
    overallTier: 'strong',
    relatedIds: ['type1-carb-counting-accuracy'],
  },
  {
    id: 'type2-glp1-sglt2-paradigm-shift',
    category: 'type2Diabetes',
    title: "A Real, Recent Shift: Treating the Whole Body, Not Just the Blood Sugar Number",
    teaser: 'Real, current guidelines moved two medication classes to the front of the line, for a reason that has nothing to do with glucose control alone.',
    summary:
      "Real, current American Diabetes Association guidelines represent a genuine, recent paradigm shift in how T2D itself gets treated: GLP-1 receptor agonists and SGLT2 inhibitors are now recommended as real, first-line pharmacotherapy for many patients, especially those with established heart disease, heart failure, or chronic kidney disease, specifically because of their own real, independent organ-protective benefits, not primarily because of how well they lower blood glucose. Real, current guidance recommends SGLT2 inhibitors for T2D patients with an eGFR of 20 mL/min/1.73m² or higher specifically because they slow CKD progression and reduce heart-failure risk through a real, separate mechanism from glucose control, already covered directly in this app's own dedicated CKD and MASLD research. The real evidence behind this shift is substantial: real cardiovascular- and kidney-outcome trials found 12% to 39% real risk reductions in major adverse events with these two medication classes over 2 to 5 years. Worth knowing directly: metformin is no longer automatically the default first medication for everyone with T2D the way it once was, real, current treatment now depends more on which real organs are already at risk than on blood glucose numbers alone.",
    citations: [
      { source: '11. Chronic Kidney Disease and Risk Management: Standards of Care in Diabetes, American Diabetes Association', url: 'https://diabetesjournals.org/care/article/49/Supplement_1/S246/163914/11-Chronic-Kidney-Disease-and-Risk-Management' },
    ],
    overallTier: 'strong',
    relatedIds: ['ckd-sglt2-inhibitors', 'masld-semaglutide-essence'],
  },
  {
    id: 'type2-screening-at-diagnosis',
    category: 'type2Diabetes',
    title: "Why T2D's Own Complication Screening Starts on Day One, Not Five Years Later",
    teaser: "T1D's own screening waits five years for a real reason. T2D can't afford to wait that long, and the reason why is worth understanding directly.",
    summary:
      "This app's own T1D research already covers real, standard screening intervals for retinopathy and nephropathy that begin five years after diagnosis. T2D's own real, current guidance is genuinely different, and deliberately so: screening for both retinopathy (a real eye exam) and nephropathy (a real urine test for microalbuminuria) should begin at the moment of T2D diagnosis itself, not five years later. The real reason traces directly back to this category's own T1D-vs-T2D distinction entry: because T2D's own actual biological onset reliably predates its diagnosis by an unknown, often substantial number of years (insulin resistance develops quietly, with real symptoms often mild or absent early on), real research finds roughly 3% of people newly diagnosed with T2D already have overt nephropathy at the moment of diagnosis itself. Waiting five years the way T1D's own protocol does would mean missing real, already-present damage in a meaningful share of newly diagnosed patients. Worth knowing directly and asking about explicitly at a first T2D diagnosis visit, since this real, immediate screening is genuinely different from what a friend or family member with T1D may have been told.",
    citations: [
      { source: "Diabetic Nephropathy: The Family Physician's Role, American Academy of Family Physicians", url: 'https://www.aafp.org/pubs/afp/issues/2012/0501/p883.html' },
    ],
    overallTier: 'strong',
    relatedIds: ['type1-complication-screening'],
  },
  {
    id: 'type2-sulfonylurea-hypoglycemia-ckd',
    category: 'type2Diabetes',
    title: 'Sulfonylureas: A Real, Quantified Hypoglycemia Risk, Sharply Higher With Reduced Kidney Function',
    teaser: "A real, common, older class of diabetes medication carries a real risk this app's own CKD research makes directly relevant.",
    summary:
      "Sulfonylureas are a real, long-used class of T2D medication that work by directly stimulating the pancreas to release more insulin, and real research finds this mechanism carries a genuinely quantified hypoglycemia risk: when used as the first, initiating medication for T2D, sulfonylureas are associated with a real 4.5-fold increase in severe hypoglycemia risk compared to other options. A real, specific, and directly relevant risk factor connects straight back to this app's own dedicated CKD research: reduced kidney function significantly raises this same risk further, since sulfonylureas are cleared from the body by the kidneys, and real, current guidance recommends avoiding this medication class specifically in people with a reduced eGFR. Real research also finds a genuine difference within the drug class itself: longer-acting, pancreas-nonspecific sulfonylureas (glyburide, glimepiride) carry a real, higher hypoglycemia risk than shorter-acting, more pancreas-specific ones (gliclazide, glipizide). Worth knowing directly for anyone managing both T2D and any real, meaningful kidney function decline: this is exactly the kind of medication-condition interaction worth raising directly with a prescriber, not assuming an existing prescription remains the right fit as kidney function changes over time.",
    citations: [
      { source: 'Pharmacologic Differences of Sulfonylureas and the Risk of Adverse Cardiovascular and Hypoglycemic Events, Diabetes Care', url: 'https://diabetesjournals.org/care/article/40/11/1506/36966/Pharmacologic-Differences-of-Sulfonylureas-and-the' },
    ],
    overallTier: 'strong',
    relatedIds: ['ckd-egfr-acr-monitoring'],
  },
  {
    id: 'type2-individualized-hba1c-targets',
    category: 'type2Diabetes',
    title: "HbA1c Targets: A Real, Honest Correction to \"Lower Is Always Better\"",
    teaser: "Real, large trials found pushing blood sugar control tighter than necessary didn't save lives, and genuinely caused real harm in the process.",
    summary:
      "Real, current clinical guidance is explicit that HbA1c targets in T2D should be individualized, not applied as one fixed number for everyone, and the real evidence behind that recommendation is more striking than a generic \"talk to your doctor\" caveat suggests. Real, large randomized controlled trials found intensive glycemic control (an HbA1c target of 7% or below) did not reduce cardiovascular events or death compared with a more moderate target around 8%, over real follow-up periods of 5 to 10 years, while genuinely increasing hypoglycemia and, in some trials, mortality, particularly in older adults. Real, current joint guidance reflects this honestly: a stricter target (HbA1c 6.5% or below) may make sense for younger patients with a long real life expectancy and low hypoglycemia risk, while a real, more lenient target (under 8%, sometimes 8% to 8.5%) is considered genuinely appropriate, not a compromise or a failure, for older patients or anyone with real comorbid conditions, cognitive impairment, or a history of hypoglycemia. Worth knowing directly: a target that looks \"too high\" compared to a younger relative's own number may be the real, correct, individualized target for a different person's own actual circumstances.",
    citations: [
      { source: 'Hemoglobin A1c Targets for Glycemic Control With Pharmacologic Therapy for Nonpregnant Adults With Type 2 Diabetes Mellitus: A Guidance Statement Update From the American College of Physicians', url: 'https://www.acpjournals.org/doi/10.7326/M17-0939' },
    ],
    overallTier: 'strong',
    relatedIds: ['type1-hba1c-time-in-range'],
  },
  {
    id: 'type2-metabolic-syndrome-cluster',
    category: 'type2Diabetes',
    title: 'The Real, Connected Cluster: T2D, PCOS, MASLD, and CKD Share One Underlying Thread',
    teaser: 'Four conditions this app covers in real depth all trace back, at least in part, to the exact same underlying mechanism.',
    summary:
      "Insulin resistance is a real, genuinely shared thread connecting T2D directly to three other conditions this app already covers in depth. PCOS's own central mechanism, already documented in this app's own dedicated research, is the identical insulin-resistance pathway, with a real, quantified 42.6%-versus-17.1% insulin resistance prevalence difference already cited there. MASLD's own real mechanism, also already documented, involves the liver storing fat specifically because insulin resistance disrupts normal fat metabolism, the same underlying disruption at work in T2D itself. CKD is real and directly connected too, diabetes (overwhelmingly T2D specifically) is one of the two most common real causes of chronic kidney disease in the first place, which is exactly why SGLT2 inhibitors and other medications already covered in this app's own dedicated CKD research do double duty, treating T2D and protecting the kidneys through the same real medication at once. This is worth knowing directly as a real, practical insight, not just an academic connection: someone managing insulin resistance well, through diet, weight, exercise, or medication, is realistically working on all four of these conditions' own shared root cause simultaneously, not four separate, unrelated problems.",
    citations: [
      { source: 'Type 2 Diabetes, MedlinePlus, U.S. National Library of Medicine', url: 'https://medlineplus.gov/diabetestype2.html' },
    ],
    overallTier: 'strong',
    relatedIds: ['pcos-insulin-resistance-mechanism', 'masld-overview', 'ckd-overview', 'gout-metabolic-cluster-connection', 'foodhistory-cholesterol-real-drivers', 'magnesium-insulin-glucose', 'chromium-insulin-sensitivity-honest', 'prostate-metabolic-syndrome-bph-link'],
  },
  {
    id: 'type2-tying-together',
    category: 'type2Diabetes',
    title: 'What Actually Holds Up for T2D, Pulled Together',
    teaser: 'Real remission evidence stronger than most people realize, a genuinely important distinction from a same-named disease, and an honest correction to "lower is always better."',
    summary:
      "Line up everything in this category and T2D reads as a condition with more real, evidence-backed reason for hope than its own common reputation suggests, alongside real, honest nuance worth holding onto rather than oversimplifying. The DiRECT trial's own real, striking remission rates (46% at one year) and low-carbohydrate diets' own real, if honestly caveated, short-term benefit both point toward T2D being genuinely more reversible, for many people, than the older \"chronic and progressive, manage it forever\" framing implies. The real distinction from Type 1 diabetes matters in practice, not just semantics, driving genuinely different screening timelines from day one. Real, current treatment guidance has shifted meaningfully toward organ-protective medications chosen for reasons beyond glucose control alone, and real trial evidence gives an honest, sometimes uncomfortable correction to the assumption that tighter blood sugar control is always better, individualized targets are the real, evidence-backed standard, not a lesser one. And the real, shared insulin-resistance thread connecting T2D to PCOS, MASLD, and CKD is a genuinely useful way to see these four conditions, already built out in real depth elsewhere in this app, as one connected picture rather than four separate diagnoses.",
    citations: [
      { source: 'Type 2 Diabetes, MedlinePlus, U.S. National Library of Medicine', url: 'https://medlineplus.gov/diabetestype2.html' },
    ],
    overallTier: 'strong',
    relatedIds: ['type2-direct-remission-trial', 'type2-low-carb-diet-evidence', 'type2-individualized-hba1c-targets', 'type2-metabolic-syndrome-cluster', 'type2-glp1-sglt2-paradigm-shift'],
  },

  // -- Full-depth parity additions, 2026-08-08. Every citation
  // independently verified via WebSearch.
  {
    id: 'type2-prediabetes-real-progression',
    category: 'type2Diabetes',
    title: "Prediabetes Is a Real, Formal, Detectable Stage -- and Up to 60% of People Who Have It Progress to Full T2D Within a Decade",
    teaser: 'A real, named, official pre-diagnosis category exists, detectable up to 20 real years before symptoms show up, and it\'s the single biggest real window this app\'s own remission-trial evidence is aimed at.',
    summary:
      "T2D develops over a genuinely long real timeline (10-20 years), and the ADA formally recognizes a real, distinct pre-diagnosis stage: prediabetes, defined by real lab thresholds (fasting glucose 100-125 mg/dL, a 2-hour post-glucose-challenge reading of 140-199 mg/dL, or an A1C of 5.7-6.4%), none of which yet meets the real threshold for a full T2D diagnosis. This isn't a minor technicality: real research finds prediabetes detectable as early as 20 years before diabetes symptoms actually appear, and up to 60% of people with prediabetes progress to full T2D within 10 years without intervention. This real stage is exactly the window this app's own remission-trial evidence (DiRECT, low-carbohydrate diet research) is most powerfully aimed at, since real, effective interventions genuinely can prevent that progression -- worth knowing directly that \"prediabetes\" isn't a soft, informal label, it's a real, formally screened-for stage with real, documented stakes attached to catching it early.",
    citations: [
      { source: 'Diagnosis and Classification of Diabetes: Standards of Care in Diabetes, American Diabetes Association', url: 'https://diabetesjournals.org/care/article/47/Supplement_1/S20/153954/2-Diagnosis-and-Classification-of-Diabetes' },
    ],
    overallTier: 'strong',
    relatedIds: ['type2-direct-remission-trial'],
  },
  {
    id: 'type2-cognitive-liver-real-data',
    category: 'type2Diabetes',
    title: 'T2D Reaches the Brain and Liver Too -- Real, Substantial Cognitive Decline Risk, Often Genuinely Underdiagnosed',
    teaser: 'One real study found over half of T2D patients over 60 already showing mild cognitive impairment -- a real, striking figure most people managing blood sugar never hear connected to their own diagnosis.',
    summary:
      "T2D's own real reach extends directly into cognition, not just metabolism. Real research finds one study of T2D patients over 60 showing 53.88% with mild cognitive impairment and 16.43% with real dementia, real, substantial figures suggesting cognitive decline in T2D is genuinely underdiagnosed in everyday practice. The real, specific mechanistic link ties directly back to this app's own MASLD research: liver FIBROSIS specifically, not just liver fat accumulation, is associated with mild cognitive impairment and dementia risk in older T2D patients, meaning the FIB-4 fibrosis score already covered in this app's own MASLD research may double as a real, useful, already-available marker for cognitive risk too, not just liver risk. Real, shared mechanisms (insulin resistance, inflammation, oxidative stress, and NAFLD/MASLD itself) connect T2D, fatty liver, and cognitive decline into one real, interconnected picture rather than three separate, unrelated concerns.",
    citations: [
      { source: 'Metabolic-Associated Fatty Liver Disease and Cognitive Performance in Type 2 Diabetes, PMC11428552', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11428552/' },
    ],
    overallTier: 'strong',
    relatedIds: ['masld-f0-f4-fibrosis-staging'],
  },
  {
    id: 'type2-history-milestones',
    category: 'type2Diabetes',
    title: "T2D's Own Real Medication History: A Traditional Herbal Remedy, Rediscovered While Searching for a Malaria Drug",
    teaser: '1918, the 1940s, 1957 -- metformin\'s own real path to becoming T2D\'s first-line drug ran through a completely different disease, twice.',
    summary:
      "T2D's own real treatment history is genuinely more winding than most conditions in this app. Metformin's real origin traces to Galega officinalis (goat's rue), a traditional European herbal remedy found in 1918 to contain guanidine, a real, blood-sugar-lowering compound. Real, related guanidine derivatives were tried for diabetes in the 1920s-30s but abandoned due to toxicity once insulin (already covered in this app's own T1D history research) became available instead. Metformin itself was genuinely rediscovered by accident in the 1940s, during a real search for antimalarial drugs, when researchers noticed it happened to lower blood glucose in patients being tested for influenza. French physician Jean Sterne finally studied metformin specifically for diabetes in 1957, filing the first real patent that same year, decades after its underlying chemistry was first identified. This is a genuinely unusual real path (herbal remedy to malaria research to diabetes drug) compared to most other medication-history entries already built in this app.",
    citations: [
      { source: 'Metformin: historical overview, PMID 28776081', url: 'https://pubmed.ncbi.nlm.nih.gov/28776081/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'type2-pregnancy-preexisting-real-risk',
    category: 'type2Diabetes',
    title: 'Pre-Existing T2D Carries Real, Higher Pregnancy Risk Than Gestational Diabetes -- and A1C Timing Is the One Real Factor That Predicts It',
    teaser: 'Real research finds pre-existing T2D nearly doubles congenital-anomaly risk compared to gestational diabetes -- and the single real predictor that matters is A1C specifically in the first 14 weeks.',
    summary:
      "Pre-existing (pregestational) T2D carries a real, meaningfully different risk profile from gestational diabetes, worth knowing as two genuinely distinct real situations rather than the same condition at different points. Real research found pre-existing T2D nearly doubling congenital-anomaly risk compared to gestational diabetes (OR 1.91), with cardiac and neurological anomalies specifically more common when diabetes was already present before conception rather than developing during pregnancy. The real, single most useful, actionable finding: A1C, measured either anytime during pregnancy or specifically within the first 14 weeks, was the one sustained real predictor of congenital-anomaly risk found across this research, a real, direct reason preconception A1C optimization (the same real target range already covered in this app's own T1D pregnancy research) matters just as much here. Compared to gestational diabetes, pre-existing T2D also carried real, higher risk of a large-for-gestational-age baby, perinatal mortality, and stillbirth, together a real, clear case for early, dedicated preconception planning with an endocrinologist rather than treating a T2D pregnancy the same way a later-diagnosed gestational case would be managed.",
    citations: [
      { source: 'Congenital anomalies in pregnancies with overt and pregestational type 2 diabetes: a gray portrayal from a cohort in Brazil, PMC11238503', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11238503/' },
    ],
    overallTier: 'strong',
    relatedIds: ['type1-pregnancy-glucose-targets'],
  },

  // -- Second depth pass, 2026-08-08, continuing the full-parity work
  // beyond the first structural pass. Every citation independently
  // verified via WebSearch.
  {
    id: 'type2-dawn-phenomenon-somogyi',
    category: 'type2Diabetes',
    title: 'High Morning Blood Sugar Has Two Real, Genuinely Different Causes -- And They Call for Opposite Real Fixes',
    teaser: "The dawn phenomenon is a real, normal hormone surge. The Somogyi effect is a real overnight low blood sugar rebounding high -- treating one like the other can make things worse, not better.",
    summary:
      "Waking up with high blood sugar has two real, genuinely different possible explanations, and telling them apart matters directly for what to actually do about it. The dawn phenomenon is a real, normal physiological event: growth hormone, cortisol, and catecholamines rise in the early morning hours as the body prepares to wake, triggering the liver to release stored sugar, and in someone with insulin resistance or T2D, morning insulin action often isn't strong enough to counter that real rise. The Somogyi effect is a real, different mechanism entirely, the body's own rebound response to low blood sugar overnight, blood glucose drops too low, then swings back up by morning. Real, practical guidance for telling them apart: checking blood sugar at bedtime, around 2-3 AM, and at normal wake time for several nights: a real low reading at 2-3 AM points to Somogyi; a normal or already-elevated reading at that same hour points to the dawn phenomenon instead. This matters because the real fixes run in opposite directions, adjusting evening medication or snacking to prevent an overnight low (Somogyi) versus adjusting morning-focused treatment to blunt the hormone surge (dawn phenomenon). Worth knowing directly: real, more recent research using continuous glucose monitoring has found the Somogyi effect genuinely less common than once assumed, with the dawn phenomenon being the more frequent real explanation for high morning readings.",
    citations: [
      { source: 'The dawn phenomenon and the Somogyi effect - two phenomena of morning hyperglycaemia, PMID 21717414', url: 'https://pubmed.ncbi.nlm.nih.gov/21717414/' },
    ],
    overallTier: 'strong',
  },

  // -- Volumetric depth pass, 2026-08-08, continuing toward genuine
  // volumetric parity with Hashimoto's own depth, per direct instruction
  // that all 18 non-Hashimoto's conditions deserve the same fully
  // encompassing treatment, individually and in combination. Every
  // citation independently verified via WebSearch.
  {
    id: 'type2-bariatric-surgery-remission',
    category: 'type2Diabetes',
    title: 'Bariatric Surgery Real Outperforms Lifestyle Intervention Alone for Achieving Diabetes Remission',
    teaser: 'Real trial data found 40% of gastric bypass patients achieved diabetes remission at 3 years versus 0% with lifestyle intervention alone, with real benefit still measurable up to 12 years later.',
    summary:
      "Bariatric (weight-loss) surgery carries real, substantially stronger remission evidence for type 2 diabetes than lifestyle intervention alone, worth knowing alongside the real DiRECT lifestyle-trial remission data already covered in this app's own research. A real, randomized trial comparing Roux-en-Y gastric bypass (RYGB), laparoscopic adjustable gastric banding (LAGB), and intensive lifestyle intervention found any diabetes remission (partial or complete) at 3 years in 40% of RYGB patients and 29% of LAGB patients, compared to real, literal 0% in the lifestyle-only group. A real 5-year follow-up of a separate trial found bariatric surgery patients achieving better long-term blood glucose control than medical management plus lifestyle changes, with benefit documented as far out as 12 years. Genuinely striking: real research found 65% of RYGB patients went from needing insulin or oral medication at baseline to needing NO diabetes medication at all by year 3, versus none in the lifestyle-only group. Worth knowing honestly: this is real, quantified evidence favoring surgery for appropriate candidates, not a claim that surgery is risk-free or right for everyone, it carries its own real surgical risks and requires lifelong nutritional monitoring (already covered elsewhere in this app's own bariatric-adjacent nutrient research). Worth knowing directly: this is a real, concrete, evidence-backed option worth discussing directly with an endocrinologist for anyone with obesity and type 2 diabetes who hasn't achieved real, lasting control through lifestyle measures alone.",
    citations: [
      { source: 'Bariatric Surgery versus Intensive Medical Therapy for Diabetes — 5-Year Outcomes, New England Journal of Medicine', url: 'https://www.nejm.org/doi/full/10.1056/NEJMoa1600869' },
      { source: 'Bariatric Surgery and Type 2 Diabetes Mellitus: Assessing Factors Leading to Remission. A Systematic Review, PMID 32983676', url: 'https://pubmed.ncbi.nlm.nih.gov/32983676/' },
    ],
    overallTier: 'strong',
    relatedIds: ['type2-direct-remission-trial'],
  },
  {
    id: 'type2-metformin-b12-deficiency',
    category: 'type2Diabetes',
    title: 'Metformin, the Most Commonly Prescribed Diabetes Medication, Carries a Real, Well-Documented B12 Depletion Risk',
    teaser: 'Real research finds vitamin B12 deficiency in anywhere from 6% to over 60% of long-term metformin users depending on the study, a real, common, actionable side effect worth routine monitoring.',
    summary:
      "Metformin, the real, standard first-line medication for type 2 diabetes, carries a real, well-documented risk of depleting vitamin B12 over time, likely through impaired B12 absorption in the small intestine, though the exact mechanism isn't fully settled. Real research finds the reported prevalence varies substantially by study, from 5.8% to 30% in general long-term metformin users, with one study finding a striking 65.7% affected and another 24.3% at borderline-low levels. A real, large, long-term study (the Diabetes Prevention Program Outcomes Study) found combined low and borderline-low B12 significantly more common in metformin-treated patients than controls, both at 5 years (19.1% vs. 9.5%) and 13 years (20.3% vs. 15.6%), with real risk rising by about 13% for every additional year of metformin use. Real, documented consequences of the resulting deficiency include neuropathy (worse peripheral nerve symptoms have been specifically linked to low B12 in metformin users), anemia, cognitive changes, and increased osteoporosis risk. Worth knowing directly: this connects straight to this app's own already-established B12 self-advocacy and Essential Nutrients research, someone on long-term metformin has a real, concrete, evidence-backed reason to ask specifically for a periodic B12 level check, not just standard diabetes labs, since deficiency symptoms can otherwise be mistaken for diabetic neuropathy itself rather than treated as the real, separate, correctable nutrient issue it actually is.",
    citations: [
      { source: 'Long-term Metformin Use and Vitamin B12 Deficiency in the Diabetes Prevention Program Outcomes Study, Journal of Clinical Endocrinology & Metabolism', url: 'https://academic.oup.com/jcem/article/101/4/1754/2804585' },
      { source: 'Vitamin B12 Deficiency in Patients Taking Metformin: Pathogenesis and Recommendations, PMC11374140', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11374140/' },
    ],
    overallTier: 'strong',
    relatedIds: ['b12-overview', 'advocacy-b12-folate'],
  },
  {
    id: 'type2-cgm-non-insulin-benefit',
    category: 'type2Diabetes',
    title: 'Continuous Glucose Monitoring Real Helps People With Type 2 Diabetes Even When They\'re Not on Insulin',
    teaser: 'A real, large randomized trial (CONNECT) found CGM lowered HbA1c by 1.6 percentage points over 26 weeks in people not on insulin, a full 0.9 points more than routine care alone.',
    summary:
      "Continuous glucose monitoring (CGM), already covered in this app's own research for its real, strong benefit in type 1 diabetes, carries genuinely real, high-grade evidence for type 2 diabetes too, including in people managing their condition without insulin at all. The real, landmark CONNECT trial, the first randomized trial providing high-grade evidence in this specific, large, mostly primary-care population, found CGM use over 26 weeks produced an average HbA1c reduction of 1.6 percentage points, a full 0.9 points better than routine care alone, with participants spending roughly 5 more hours per day in their target glucose range. A real, broader systematic review and meta-analysis found generally consistent benefit across both randomized trials and observational studies, on both glycemic outcomes and real-world measures like cost-effectiveness and reduced healthcare resource use, with real evidence that even when the HbA1c change was smaller in non-insulin-treated groups, glycemic variability improved and treatment satisfaction was consistently higher. Worth knowing directly: CGM isn't just a tool for people on complex insulin regimens, it's a real, evidence-backed option worth asking about directly for anyone managing type 2 diabetes with oral medications alone, giving real, immediate feedback on how specific foods and habits actually move blood sugar, directly supporting this app's own core mission of helping someone discover their own personal food-effect patterns.",
    citations: [
      { source: 'Continuous glucose monitoring in type 2 diabetes benefits people not on insulin, CONNECT trial shows, Cleveland Clinic Journal of Medicine', url: 'https://www.ccjm.org/page/ada-2026/glucose-connect' },
      { source: 'Continuous glucose monitoring in noninsulin-treated type 2 diabetes: A critical review with an updated systematic review and meta-analysis of RCTs, PMID 40757453', url: 'https://pubmed.ncbi.nlm.nih.gov/40757453/' },
    ],
    overallTier: 'strong',
    relatedIds: ['type1-closed-loop-automated-insulin', 'type1-hba1c-time-in-range'],
  },

  // -- Volumetric depth pass batch 4, 2026-08-08, continuing toward
  // genuine volumetric parity with Hashimoto's own depth. Every citation
  // independently verified via WebSearch.
  {
    id: 'type2-periodontal-disease-bidirectional',
    category: 'type2Diabetes',
    title: 'Gum Disease and Type 2 Diabetes Genuinely Worsen Each Other, a Real, Bidirectional, Often-Overlooked Connection',
    teaser: 'Real, genetics-based research confirms a real causal relationship running both directions between periodontal disease and T2D, with current guidelines now recommending each condition be screened for when the other is found.',
    summary:
      "Periodontal (gum) disease and type 2 diabetes carry a real, genuinely bidirectional relationship, each worsening the other, worth knowing about directly since dental health rarely gets connected to diabetes management despite real, substantial evidence linking them. Real research finds this real, two-way relationship confirmed not just through observational studies but through Mendelian randomization (the same genetics-based causal-inference method already covered elsewhere in this app's own research as methodologically stronger than plain observation), directly clarifying a real, bidirectional causal association between periodontitis and type 2 diabetes rather than just a coincidental overlap. Real, mechanistic research finds a genuine biological interplay between the oral microbiome and viral factors shared between the two conditions. A real, direct cross-sectional study found metabolic control in T2D and periodontal inflammation tracking together, worse blood sugar control associated with a real, higher periodontal inflammation burden, and better periodontal health associated with better glycemic control in return. Worth knowing directly, and genuinely actionable: real, current clinical guidelines explicitly recommend that people with periodontitis be screened for diabetes, and that people with diabetes be informed of their real, elevated risk of developing periodontal disease. Worth knowing directly: regular dental care and gum-health monitoring deserve a real, concrete place in T2D management, not treated as a separate, unrelated health domain, and unexplained bleeding gums or gum disease that won't resolve is worth mentioning directly to a diabetes care team, not just a dentist.",
    citations: [
      { source: 'Causal Association Between Periodontitis and Type 2 Diabetes: A Bidirectional Two-Sample Mendelian Randomization Analysis, PMC8784400', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8784400/' },
      { source: 'Bidirectional association between periodontal disease and diabetes mellitus: a systematic review and meta-analysis of cohort studies, Scientific Reports', url: 'https://www.nature.com/articles/s41598-021-93062-6' },
    ],
    overallTier: 'strong',
    relatedIds: ['type2-overview'],
  },
  {
    id: 'type2-remission-ada-consensus-definition',
    category: 'type2Diabetes',
    title: 'What "Remission" Actually Means: The Real, Specific ADA Consensus Definition',
    teaser: 'Real, current international consensus defines remission as HbA1c under 6.5% for at least 3 months with zero glucose-lowering medication, a real, specific, testable definition worth knowing exactly, not a vague sense of "doing better."',
    summary:
      "Type 2 diabetes remission, already covered through real trial data elsewhere in this app's own research (the DiRECT lifestyle trial, bariatric surgery outcomes), has a real, specific, formal definition worth knowing precisely, since \"remission\" means something exact, not a general feeling of improvement. Real, current international consensus (a 2021 ADA-convened expert group) defines remission as an HbA1c under 6.5% (48 mmol/mol), measured at least 3 months after stopping all glucose-lowering medication. Real, alternative criteria exist for when HbA1c itself isn't a reliable marker: fasting plasma glucose under 126 mg/dL, or an estimated HbA1c calculated from continuous glucose monitor data, both real, valid substitutes. Real guidance specifies exact testing timing too, the confirming test should happen no sooner than 3 months after stopping medication, with real, yearly retesting recommended afterward to confirm the remission is actually holding. Worth knowing directly, and useful historical context: an earlier, real 2009 framework used three tiers, \"partial\" remission (sub-diabetic glucose levels for at least 1 year off medication), \"complete\" remission (fully normal glucose for 1 year off medication), and \"prolonged\" remission (complete remission sustained 5 or more years). Worth knowing directly: this real, specific, testable definition matters because it sets a genuine, objective bar, someone who's simply on fewer medications, or whose HbA1c has improved while still on medication, hasn't technically achieved remission by this real, formal standard, worth understanding clearly before assuming a personal treatment goal has already been met.",
    citations: [
      { source: 'Consensus Report: Definition and Interpretation of Remission in Type 2 Diabetes, Diabetes Care (American Diabetes Association)', url: 'https://diabetesjournals.org/care/article/44/10/2438/138556/Consensus-Report-Definition-and-Interpretation-of' },
      { source: 'International Experts Outline Diabetes Remission Diagnosis Criteria, American Diabetes Association', url: 'https://diabetes.org/newsroom/international-experts-outline-diabetes-remission-diagnosis-criteria' },
    ],
    overallTier: 'strong',
    relatedIds: ['type2-direct-remission-trial'],
  },
  {
    id: 'type2-statins-diabetogenic-effect',
    category: 'type2Diabetes',
    title: 'A Real, Honest Complication: Statins Themselves Carry a Modest, Real Diabetes Risk, Even While Preventing Heart Disease',
    teaser: 'Real research finds statin use tied to a real, measurable increased risk of developing type 2 diabetes, roughly one extra case per 100-200 people treated over 5 years, a real tradeoff worth understanding honestly, not a reason to avoid them.',
    summary:
      "Statins, already covered elsewhere in this app's own cardiovascular research for their real, strong mortality benefit, carry a real, honest complication worth knowing directly: they modestly raise the risk of developing type 2 diabetes. Real research finds moderate-intensity statins increasing diabetes risk by roughly 11%, with a further real 12% increase at high-intensity dosing, and one real, major cohort study found a 46% increased relative risk with statin treatment specifically. Real, proposed mechanisms include statins pushing someone already close to the diabetes threshold over it slightly earlier than they otherwise would have crossed it, along with real, direct effects on insulin sensitivity and insulin secretion, and a real, speculative link to statin-induced mitochondrial dysfunction in skeletal muscle contributing to insulin resistance. Worth knowing honestly and in real, practical proportion: real research translates this into roughly one additional diabetes case per 100 to 200 people treated with statins over 5 years, a real, genuinely small absolute number set against roughly ten times greater real benefit on major cardiovascular outcomes (heart attacks, strokes, and deaths prevented) over that same period. Worth knowing directly: this is real, honest context, not a reason to avoid a genuinely beneficial medication, someone already at elevated diabetes risk starting a statin has a real, evidence-backed reason for slightly closer blood-sugar monitoring going forward, not a reason to skip a medication with real, much larger cardiovascular benefit.",
    citations: [
      { source: 'Statins and risk of type 2 diabetes: mechanism and clinical implications, PMC10546337', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10546337/' },
      { source: 'Increased risk of diabetes with statin treatment is associated with impaired insulin sensitivity and insulin secretion, Diabetologia', url: 'https://link.springer.com/article/10.1007/s00125-015-3528-5' },
    ],
    overallTier: 'strong',
    relatedIds: ['cvd-statin-evidence', 'type2-prediabetes-real-progression'],
  },
  {
    id: 'type2-time-restricted-eating',
    category: 'type2Diabetes',
    title: 'A Real Meta-Analysis Found Eating Within a Shorter Window Improves Blood Sugar, Distinct From Low-Carb Eating',
    teaser: 'Pooling 8 real trials, time-restricted eating significantly lowered fasting glucose and HbA1c and increased real time-in-range, a genuinely different lever from this category\'s own already-covered low-carb evidence.',
    summary:
      "This category's own research already covers low-carbohydrate diets as a real, distinct lever for T2D. Time-restricted eating, confining food intake to a shorter daily window without necessarily changing WHAT is eaten, is a real, separate, actively-tested approach worth knowing directly. A real meta-analysis pooling 8 randomized controlled trials (312 participants with type 2 diabetes or impaired fasting glucose) found time-restricted eating significantly reduced both fasting glucose and HbA1c, with a real, consistent increase in time-in-range across the pooled trials. Individual real trials found broadly similar results: a real, 3-month randomized trial found a nightly 12-hour fasting window combined with calorie restriction outperformed calorie restriction alone for both weight loss and HbA1c, and a real, 10-hour time-restricted-eating crossover trial found genuine 24-hour glucose improvement in free-living adults with T2D, though notably without a real, matching improvement in insulin sensitivity itself, an honest, real nuance worth keeping in view rather than assuming every marker improves together. Worth knowing directly: this is a real, food-timing-first lever, distinct from what's eaten, that someone who finds a specific eating window more sustainable day to day than tracking every gram of carbohydrate can raise directly with a doctor or dietitian as a real, evidence-backed alternative or complement to this category's own already-covered low-carb approach.",
    citations: [
      { source: 'Time-Restricted Eating Improves Glycemic Control in Patients with Type 2 Diabetes: A Meta-Analysis and Systematic Review, PMC12346854', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12346854/' },
    ],
    overallTier: 'strong',
    relatedIds: ['type2-low-carb-diet-evidence', 'masld-time-restricted-eating'],
  },
  {
    id: 'type2-sleep-apnea-glycemic-control',
    category: 'type2Diabetes',
    title: 'Sleep Apnea and T2D Run Together, but Real Trials on Treating It Give a Genuinely Mixed Answer',
    teaser: 'Real, individual CPAP trials found real glycemic improvement in some cases, but a real, pooled meta-analysis of 581 patients found no overall HbA1c benefit, an honest, unsettled real evidence picture.',
    summary:
      "Obstructive sleep apnea and type 2 diabetes are real, commonly co-occurring conditions, and real research has directly tested whether treating the sleep apnea (with CPAP, continuous positive airway pressure) improves the diabetes itself, with a genuinely mixed, honest answer worth knowing plainly rather than assumed settled either way. One real, controlled trial (50 patients) found CPAP treatment produced a real, statistically significant improvement in glycemic control and insulin resistance compared with standard care. A real, later trial (the Diabetes Sleep Treatment Trial) found real, significant HbA1c improvement at 6 weeks that didn't hold up as a sustained difference by the trial's own primary, intention-to-treat analysis. Worth knowing honestly: a real, pooled meta-analysis of 6 randomized trials and 581 total participants found no significant overall effect on HbA1c at either 12 or 24 weeks, a real, more sobering conclusion once the individual, more encouraging trials are combined. One real, consistent thread across this mixed picture: real research found CPAP adherence itself tracked with greater glycemic improvement, suggesting the real, practical barrier (many people genuinely struggle to use CPAP consistently every night) may be diluting a real effect that's there for people who use it well. Worth knowing directly: treating sleep apnea remains real, worthwhile care in its own right (blood pressure, cardiovascular risk, daytime function), just not, based on real current pooled evidence, a reliably diabetes-improving intervention on its own.",
    citations: [
      { source: 'Effect of Continuous Positive Airway Pressure on Glycemic Control in Patients with Obstructive Sleep Apnea and Type 2 Diabetes. A Randomized Clinical Trial, PMID 26910598', url: 'https://pubmed.ncbi.nlm.nih.gov/26910598/' },
      { source: 'CPAP in patients with obstructive sleep apnea and type 2 diabetes mellitus: Systematic review and meta-analysis, PMID 30073792', url: 'https://pubmed.ncbi.nlm.nih.gov/30073792/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['masld-sleep-apnea-bidirectional'],
  },
  {
    id: 'type2-youth-onset-more-aggressive',
    category: 'type2Diabetes',
    title: "Type 2 Diabetes Diagnosed in Youth Runs a Real, Genuinely Faster, Harsher Course Than the Same Disease in Adults",
    teaser: 'A real, landmark long-term study found 60% of people diagnosed with T2D as children or teens already had a real diabetes complication within 15 years, most still in their 20s, a real, faster course than adult-onset T2D typically shows.',
    summary:
      "This category's own already-covered research (remission, GLP-1/SGLT2 medications, individualized HbA1c targets) draws mostly on adult-onset T2D, the far more common presentation. Real, long-term data finds youth-onset T2D a genuinely different, more aggressive disease, not simply the same condition starting earlier. The real, landmark TODAY study and its long-term TODAY2 follow-up found insulin-producing beta-cell function declining faster in youth than in adults, and metformin alone, this category's own often-first medication, provided durable glycemic control in only about half of young participants. Real, 15-year follow-up data found 60% of participants had developed at least one real diabetes-related complication, and nearly a third had two or more, at a real average age of just 26, high blood pressure in 67%, kidney disease in nearly 55%, eye disease in 51%, and nerve disease in 32%. Real research found the rate of real heart, vascular, and stroke-related events three times higher than in a comparison study of older adults with a longer real disease duration, a real, striking reversal of the usual assumption that more years with diabetes means more complications. Worth knowing directly: a young person diagnosed with T2D deserves real, more assertive, more closely-monitored treatment from the start, not a wait-and-see approach based on how the disease usually behaves in adults, since real evidence finds it usually doesn't behave the same way at all.",
    citations: [
      { source: 'Long-Term Complications in Youth-Onset Type 2 Diabetes, New England Journal of Medicine 2021, PMID 34320286', url: 'https://pubmed.ncbi.nlm.nih.gov/34320286/' },
    ],
    overallTier: 'strong',
    relatedIds: ['type2-remission-ada-consensus-definition', 'type2-individualized-hba1c-targets'],
  },
  {
    id: 'type2-global-nauru-pacific-thrifty-gene',
    category: 'type2Diabetes',
    title: 'Nauru Has the Highest Type 2 Diabetes Rate on the Planet, and a Real, Named Theory Explains Why So Fast',
    teaser: "Roughly half of Nauru's adult population has Type 2 diabetes, following a real, documented multi-decade shift from a traditional fish-and-vegetable diet to imported processed food, exactly the kind of change a real genetic theory predicts would hit hardest.",
    summary:
      "Nauru, a small Pacific Island nation, carries the real, highest Type 2 diabetes prevalence documented anywhere on the planet, roughly half of its adult population, and several other Pacific Island nations (Cook Islands, Fiji, Marshall Islands, Samoa, Tonga, Tuvalu) all carry real Type 2 diabetes prevalence above 10%. The real, documented cause traces to an unusually fast, unusually recent dietary shift: Nauru's population were traditionally lean, active hunter-gatherer-fishers eating mostly raw or boiled fish, until mid-20th-century mining wealth suddenly made imported, processed, Western-style food widely available. The 'thrifty gene' hypothesis, a real, long-standing theory in this specific research area, proposes that populations who survived repeated historical famine and food scarcity, including many Pacific Islander groups during their own ancestors' original ocean voyages and settlement, were naturally selected for genes that store fat especially efficiently, a real survival advantage during scarcity that becomes a real metabolic liability once food, especially processed, calorie-dense food, becomes constantly available. A real, separate but related pattern: South Asian populations develop measurable Type 2 diabetes risk at genuinely lower BMI levels than white European populations, a real reason clinical BMI cutoffs for 'overweight' and 'obese' have been adjusted lower specifically for South Asian populations in some countries. Worth knowing directly: Type 2 diabetes risk isn't one universal curve against body weight, real, population-specific genetic and historical factors shift where that curve actually sits.",
    citations: [
      { source: "The High Prevalence of Diabetes Mellitus in Nauru, A Central Pacific Island, ScienceDirect", url: 'https://www.sciencedirect.com/science/article/pii/B9780120273096500161' },
      { source: 'Exploring the use of adjusted body mass index thresholds based on equivalent insulin resistance for defining overweight and obesity in UK South Asian children, PMC6451638', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6451638/' },
    ],
    overallTier: 'strong',
    relatedIds: ['type2-overview', 'masld-global-regional-prevalence-genetics'],
  },
  {
    id: 'type2-microvascular-complications-screening',
    category: 'type2Diabetes',
    title: 'A Real, Substantial Share of Type 2 Diabetes Complications Are Already Present at the Moment of Diagnosis',
    teaser: 'A real, 77,681-person Swedish registry found 17.2% of people already had diabetic retinopathy at the moment of their Type 2 diabetes diagnosis, real evidence the disease was often present, undetected, for years beforehand.',
    summary:
      "Type 2 diabetes's own real, gradual, often-symptomless onset (already covered in this category's own prediabetes-progression research) has a real, concrete consequence worth knowing directly: a substantial share of people already have measurable complication damage by the time they're diagnosed. A real, large Swedish national registry study of 77,681 newly diagnosed people found 17.2% already had diabetic retinopathy (damage to the light-sensitive tissue in the eye) at diagnosis, and a real Scottish study found a similar 19.3% prevalence at first screening. Nerve damage (diabetic neuropathy) was present in a real 8.2% of newly diagnosed patients in a separate study, lower than retinopathy but still a real, meaningful share. The real, practical, actionable finding underneath this: among people whose diabetes was caught through routine screening rather than after symptoms prompted a doctor visit, only 22% already had retinopathy, compared with 51% among those diagnosed only after symptoms led them to seek care, real, direct evidence that regular screening genuinely catches Type 2 diabetes earlier, before as much silent damage accumulates. Worth knowing directly: real, current diabetes-care standards recommend an eye exam and a foot/nerve exam at the time of diagnosis, not months or years later, specifically because real data shows this damage can already be present from day one.",
    chart: {
      title: 'Diabetic complications present at Type 2 diagnosis',
      unit: '%',
      data: [
        { label: 'Retinopathy (screening-detected diagnosis)', value: 22 },
        { label: 'Retinopathy (symptom-detected diagnosis)', value: 51 },
        { label: 'Neuropathy (overall, newly diagnosed)', value: 8.2 },
      ],
      sourceNote: 'Prevalence and risk factors for diabetic retinopathy at diagnosis of type 2 diabetes, Swedish National Diabetes Registry, PMC11163631; Early Screening for Diabetic Retinopathy, PMC9094682',
    },
    citations: [
      { source: 'Prevalence and risk factors for diabetic retinopathy at diagnosis of type 2 diabetes: Swedish National Diabetes Registry, PMC11163631', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11163631/' },
      { source: 'Microvascular Complications and Their Associated Risk Factors in Newly Diagnosed Type 2 Diabetes Mellitus Patients, PMC4590918', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4590918/' },
    ],
    overallTier: 'strong',
    relatedIds: ['type2-screening-at-diagnosis', 'type2-prediabetes-real-progression'],
  },
  {
    id: 'type2-global-china-india-absolute-burden',
    category: 'type2Diabetes',
    title: 'China and India Together Carry the Largest Absolute Number of People With Diabetes on Earth',
    teaser: "This category's own already-covered Nauru research shows the highest per-capita rate; China and India instead show the largest real, absolute number of people affected, over 140 million and nearly 90 million respectively.",
    summary:
      "This category's own already-covered Nauru entry tells a real per-capita story, roughly half of one small island's population affected. China and India tell a real, different kind of story: sheer scale. Real IDF Diabetes Atlas data finds China carrying the world's largest absolute number of people with diabetes, over 140 million in 2021, projected to exceed 174 million by 2045, with India close behind at nearly 90 million adults, accounting for roughly 1 in every 7 adults with diabetes worldwide. A real, further complication: over half of everyone with UNDIAGNOSED diabetes globally lives in just three countries, China, India, and Indonesia, meaning the true scale in these countries is likely even larger than the already-enormous confirmed numbers. Real projections show India's own diabetes population rising a further 75% by 2050. Worth knowing directly: this is a genuinely different, complementary real statistic to Nauru's own per-capita story, rather than one country having the 'worst' diabetes problem, real global diabetes burden concentrates differently depending on whether the real question is which population is proportionally hit hardest (Nauru, the Pacific Islands) or where the largest real, absolute number of affected people actually live (China, India), both real, true, and worth knowing for a genuinely global picture of this disease.",
    chart: {
      title: 'People with diabetes, absolute numbers (2021)',
      unit: 'million people',
      data: [
        { label: 'China', value: 140 },
        { label: 'India', value: 89.8 },
      ],
      sourceNote: 'IDF Diabetes Atlas: Global, regional and country-level diabetes prevalence estimates for 2021, PMC11057359',
    },
    citations: [
      { source: 'IDF Diabetes Atlas: Global, regional and country-level diabetes prevalence estimates for 2021 and projections for 2045, PMC11057359', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11057359/' },
    ],
    overallTier: 'strong',
    relatedIds: ['type2-global-nauru-pacific-thrifty-gene'],
  },
  {
    id: 'horizon-type2',
    category: 'type2Diabetes',
    title: "A Real, Triple-Acting Drug Just Cleared Its First Phase 3 Trial, Working Through Three Hormones at Once",
    teaser: "This category's own already-covered GLP-1/SGLT2 paradigm shift is already moving toward a third real hormone target, a single drug now activating GIP, GLP-1, AND glucagon receptors together, with a real 22,000-plus-participant trial program underway.",
    summary:
      "This category's own already-covered real paradigm shift toward GLP-1 and SGLT2 medications is already advancing toward a real, further step. Retatrutide is a real, investigational drug activating three separate hormone receptors at once (GIP, GLP-1, and glucagon), rather than the one or two most current medications target. Its real, first Phase 3 trial (TRANSCEND-T2D-1) met both its primary and key secondary endpoints, delivering real, superior blood-sugar reduction and weight loss compared with placebo at 40 weeks, part of a real, large program spanning 14 trials and more than 22,000 participants. Separately, and still much earlier-stage, real research continues investigating whether the body's own insulin-producing beta cells can be coaxed into genuine regeneration, through cell proliferation, converting other pancreatic cell types into functional beta cells, or reprogramming precursor cells directly, real, active laboratory research rather than anything close to real patient use yet. Worth knowing directly: the field's own real, current direction is less about finding one single new drug and more about combining an increasing number of distinct real hormone-signaling pathways into single medications, extending the same core strategy already proven with existing GLP-1 and SGLT2 treatments.",
    citations: [
      { source: "Lilly's triple agonist, retatrutide, demonstrated significant reductions in A1C and weight in first Phase 3 trial", url: 'https://investor.lilly.com/news-releases/news-release-details/lillys-triple-agonist-retatrutide-demonstrated-significant' },
    ],
    overallTier: 'strong',
    relatedIds: ['type2-glp1-sglt2-paradigm-shift'],
  },
  {
    id: 'horizon-type2-orforglipron',
    category: 'type2Diabetes',
    title: 'A Real, Pill-Form GLP-1 Just Outperformed the Only Other Oral GLP-1 Already on the Market',
    teaser: "This category's own already-covered GLP-1 research relies mostly on injections. Orforglipron, a genuinely new oral small-molecule GLP-1, beat oral semaglutide head-to-head in a real Phase 3 trial on both blood sugar control and weight loss.",
    summary:
      "This category's own already-covered GLP-1 research (part of the real paradigm shift already named in this category) has mostly meant injectable medication, with oral semaglutide the one real existing pill-form option. Orforglipron represents a real, genuinely different kind of oral GLP-1, a small molecule rather than a peptide, which real research finds easier and cheaper to manufacture and administer without semaglutide's own real, strict food-and-water timing requirements. In a real, direct head-to-head Phase 3 trial (ACHIEVE-3, published in The Lancet) against oral semaglutide in adults already on metformin, orforglipron delivered real, significantly greater improvements in both blood sugar control and weight loss across every primary and key secondary measure. Two further real Phase 3 trials (ACHIEVE-2 and ACHIEVE-5) found it also meeting every endpoint against a real, established SGLT2 inhibitor and against placebo, including real cardiovascular risk-marker improvement. Worth knowing directly: real trial data across this whole drug found the same real gastrointestinal side effects (nausea, vomiting, diarrhea) already common to this whole drug class, described as generally mild, temporary, and concentrated during the real initial dose-adjustment period, not a new or different safety concern from what this category's own existing GLP-1 research already names.",
    citations: [
      { source: "Lilly's oral GLP-1, orforglipron, delivered superior blood sugar control and weight loss compared to oral semaglutide, The Lancet", url: 'https://lilly.gcs-web.com/news-releases/news-release-details/lillys-oral-glp-1-orforglipron-delivered-superior-blood-sugar' },
    ],
    overallTier: 'strong',
    relatedIds: ['type2-glp1-sglt2-paradigm-shift', 'horizon-type2'],
  },
];
