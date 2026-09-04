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
    teaser: 'The body still makes insulin here, often plenty of it at first. The problem is that cells stop responding to it properly.',
    summary: "Type 2 diabetes (T2D) typically begins with insulin resistance: cells throughout the body stop responding normally to insulin, so blood glucose stays elevated even while the pancreas is still producing insulin, often producing more of it than usual to compensate. Over extended time, this compensatory overproduction can wear down the pancreas's insulin-producing cells, and blood sugar control worsens as that capacity declines. Major risk factors include being overweight or obese, physical inactivity, and genetic/family history, and T2D represents the large majority of all diabetes cases. This category sits at the center of a cluster of conditions already covered in depth, insulin resistance is the same core mechanism already documented for PCOS, the same liver-fat-storage driver already documented for MASLD, and T2D itself is one of the two most common causes of CKD, cross-linked throughout rather than re-explained. This category focuses on what's specific to T2D itself: its remission evidence, its distinction from Type 1 Diabetes, and a recent shift in how it's actually treated.",
    citations: [
      { source: 'Type 2 Diabetes, MedlinePlus, U.S. National Library of Medicine', url: 'https://medlineplus.gov/diabetestype2.html' },
    ],
    overallTier: 'strong',
    relatedIds: ['pcos-insulin-resistance-mechanism', 'masld-overview'],
  },
  {
    id: 'type2-vs-type1-distinction',
    category: 'type2Diabetes',
    title: 'Type 2 vs. Type 1: The Same Word, Two Different Diseases',
    teaser: "Sharing a name causes common confusion. The underlying mechanism, typical onset, and treatment approach all differ.",
    summary: "Type 1 and Type 2 diabetes share a name and a shared end result (elevated blood glucose), but the underlying disease is different, and Type 1 diabetes is already covered in its dedicated category, useful to keep straight to avoid common confusion between the two. Type 1 is an autoimmune disease, the immune system directly destroys the pancreas's insulin-producing cells, typically starting in childhood or young adulthood, and requires insulin from diagnosis onward since the body's own insulin production stops. Type 2 is a primarily metabolic disease (see this category's overview entry), usually developing gradually in adulthood, strongly linked to insulin resistance rather than an autoimmune attack, and often manageable, at least initially, without insulin at all. A practical consequence of this difference: T2D's onset typically predates its actual diagnosis by years, since insulin resistance develops gradually and symptoms can be mild or absent early on, a reason this category's screening entry recommends starting complication screening immediately at diagnosis rather than waiting, unlike T1D's more identifiable onset.",
    citations: [
      { source: 'Type 2 Diabetes, MedlinePlus, U.S. National Library of Medicine', url: 'https://medlineplus.gov/diabetestype2.html' },
    ],
    overallTier: 'strong',
    relatedIds: ['type1-overview', 'type2-screening-at-diagnosis'],
  },
  {
    id: 'type2-direct-remission-trial',
    category: 'type2Diabetes',
    title: 'Randomized Trial Evidence That T2D Can Go Into Remission',
    teaser: 'Not a claim from a diet book. A large clinical trial found nearly half of participants reached a non-diabetic state within a year.',
    summary: "The DiRECT trial (Diabetes Remission Clinical Trial), a large, open-label, cluster-randomized trial run through UK primary care practices, found something striking: 46% of participants who received a structured, primary-care-led weight-management program (built around a low-calorie total diet replacement phase followed by structured food reintroduction) achieved complete diabetes remission at 12 months, defined strictly as HbA1c under 6.5% while off all diabetes medication for at least two months. A later extension found 36% remained in remission at 2 years, and a longer 5-year follow-up confirmed remission sustained in some participants that far out. The co-primary outcome behind this: participants who achieved at least 15 kg (about 33 lbs) of weight loss saw dramatically higher remission rates than those who lost less. The existing self-advocacy research already cites this same trial's separate, additional finding, that 28% of participants who achieved remission remained completely off blood pressure medication too, an honest example of a prescribing cascade running in reverse once an underlying driver improves.",
    citations: [
      { source: 'Lean MEJ, et al., The Lancet, 2018, "Primary care-led weight management for remission of type 2 diabetes (DiRECT): an open-label, cluster-randomised trial," PMID 29221645', url: 'https://pubmed.ncbi.nlm.nih.gov/29221645/' },
    ],
    overallTier: 'strong',
    relatedIds: ['advocacy-prescribing-cascade'],
  },
  {
    id: 'type2-low-carb-diet-evidence',
    category: 'type2Diabetes',
    title: 'Low-Carbohydrate Diets: Strong Short-Term Evidence, With an Honest Caveat About What "Remission" Actually Means',
    teaser: 'A meta-analysis found nearly double the remission rate on a low-carb diet. A closer look at how remission gets defined changes the picture somewhat.',
    summary:
      "A systematic review and meta-analysis of published and unpublished randomized trial data found low-carbohydrate diets achieved significantly higher rates of diabetes remission (HbA1c under 6.5%) at six months, 57% on a low-carbohydrate diet versus 31% on a control diet, alongside a measurable HbA1c reduction, most pronounced at the 3-month mark. A honest caveat the same review names directly: when remission was defined more strictly, HbA1c under 6.5% specifically while off all diabetes medication, the measured benefit shrank and lost statistical significance, suggesting some of the apparent remission gain in the looser definition may reflect medication changes made alongside the diet rather than diet effects alone. A separate 12-month trial found a very low-carbohydrate ketogenic diet produced a greater HbA1c reduction (6.6% to 6.1%) than a moderate-carbohydrate diet (6.9% to 6.7%) in the same population. Low-carbohydrate eating shows short-term benefit, honestly reported alongside the complexity in how different trials define \"remission\" itself.",
    citations: [
      { source: 'Efficacy and safety of low and very low carbohydrate diets for type 2 diabetes remission: systematic review and meta-analysis of published and unpublished randomized trial data, PMID 33441384', url: 'https://pubmed.ncbi.nlm.nih.gov/33441384/' },
    ],
    overallTier: 'strong',
    relatedIds: ['type1-carb-counting-accuracy'],
  },
  {
    id: 'type2-glp1-sglt2-paradigm-shift',
    category: 'type2Diabetes',
    title: "A Recent Shift: Treating the Whole Body, Not Just the Blood Sugar Number",
    teaser: 'Current guidelines moved two medication classes to the front of the line, for a reason that has nothing to do with glucose control alone.',
    summary: "Current American Diabetes Association guidelines represent a recent paradigm shift in how T2D itself gets treated: GLP-1 receptor agonists and SGLT2 inhibitors are now recommended as first-line pharmacotherapy for many patients, especially those with established heart disease, heart failure, or chronic kidney disease, specifically because of their independent organ-protective benefits, not primarily because of how well they lower blood glucose. Current guidance recommends SGLT2 inhibitors for T2D patients with an eGFR of 20 mL/min/1.73m² or higher specifically because they slow CKD progression and reduce heart-failure risk through a separate mechanism from glucose control, already covered directly in the dedicated CKD and MASLD research. The evidence behind this shift is substantial: cardiovascular- and kidney-outcome trials found 12% to 39% risk reductions in major adverse events with these two medication classes over 2 to 5 years. Metformin is no longer automatically the default first medication for everyone with T2D the way it once was, current treatment now depends more on which organs are already at risk than on blood glucose numbers alone.",
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
    teaser: "T1D's screening waits five years for a reason. T2D can't afford to wait that long, and the reason why is worth understanding directly.",
    summary: "The T1D research already covers standard screening intervals for retinopathy and nephropathy that begin five years after diagnosis. T2D's current guidance is different, and deliberately so: screening for both retinopathy (an eye exam) and nephropathy (a urine test for microalbuminuria) should begin at the moment of T2D diagnosis itself, not five years later. The reason traces directly back to this category's T1D-vs-T2D distinction entry: because T2D's actual biological onset reliably predates its diagnosis by an unknown, often substantial number of years (insulin resistance develops quietly, with symptoms often mild or absent early on), research finds roughly 3% of people newly diagnosed with T2D already have overt nephropathy at the moment of diagnosis itself. Waiting five years the way T1D's protocol does would mean missing already-present damage in a meaningful share of newly diagnosed patients. This is worth asking about explicitly at a first T2D diagnosis visit, since this immediate screening is different from what a friend or family member with T1D may have been told.",
    citations: [
      { source: "Diabetic Nephropathy: The Family Physician's Role, American Academy of Family Physicians", url: 'https://www.aafp.org/pubs/afp/issues/2012/0501/p883.html' },
    ],
    overallTier: 'strong',
    relatedIds: ['type1-complication-screening'],
  },
  {
    id: 'type2-sulfonylurea-hypoglycemia-ckd',
    category: 'type2Diabetes',
    title: 'Sulfonylureas: A Quantified Hypoglycemia Risk, Sharply Higher With Reduced Kidney Function',
    teaser: "A common, older class of diabetes medication carries a risk the CKD research makes directly relevant.",
    summary: "Sulfonylureas are a long-used class of T2D medication that work by directly stimulating the pancreas to release more insulin, and research finds this mechanism carries a quantified hypoglycemia risk: when used as the first, initiating medication for T2D, sulfonylureas are associated with a 4.5-fold increase in severe hypoglycemia risk compared to other options. A specific, and directly relevant risk factor connects straight back to the dedicated CKD research: reduced kidney function significantly raises this same risk further, since sulfonylureas are cleared from the body by the kidneys, and current guidance recommends avoiding this medication class specifically in people with a reduced eGFR. Research also finds a difference within the drug class itself: longer-acting, pancreas-nonspecific sulfonylureas (glyburide, glimepiride) carry a higher hypoglycemia risk than shorter-acting, more pancreas-specific ones (gliclazide, glipizide). For anyone managing both T2D and any meaningful kidney function decline, this is exactly the kind of medication-condition interaction worth raising directly with a prescriber, not assuming an existing prescription remains the right fit as kidney function changes over time.",
    citations: [
      { source: 'Pharmacologic Differences of Sulfonylureas and the Risk of Adverse Cardiovascular and Hypoglycemic Events, Diabetes Care', url: 'https://diabetesjournals.org/care/article/40/11/1506/36966/Pharmacologic-Differences-of-Sulfonylureas-and-the' },
    ],
    overallTier: 'strong',
    relatedIds: ['ckd-egfr-acr-monitoring'],
  },
  {
    id: 'type2-individualized-hba1c-targets',
    category: 'type2Diabetes',
    title: "HbA1c Targets: A Honest Correction to \"Lower Is Always Better\"",
    teaser: "Large trials found pushing blood sugar control tighter than necessary didn't save lives, and caused harm in the process.",
    summary:
      "Current clinical guidance is explicit that HbA1c targets in T2D should be individualized, not applied as one fixed number for everyone, and the evidence behind that recommendation is more striking than a generic \"talk to your doctor\" caveat suggests. Large randomized controlled trials found intensive glycemic control (an HbA1c target of 7% or below) did not reduce cardiovascular events or death compared with a more moderate target around 8%, over follow-up periods of 5 to 10 years, while increasing hypoglycemia and, in some trials, mortality, particularly in older adults. Current joint guidance reflects this honestly: a stricter target (HbA1c 6.5% or below) may make sense for younger patients with a long life expectancy and low hypoglycemia risk, while a more lenient target (under 8%, sometimes 8% to 8.5%) is considered appropriate, not a compromise or a failure, for older patients or anyone with comorbid conditions, cognitive impairment, or a history of hypoglycemia. A target that looks \"too high\" compared to a younger relative's number may be the correct, individualized target for a different person's own actual circumstances.",
    citations: [
      { source: 'Hemoglobin A1c Targets for Glycemic Control With Pharmacologic Therapy for Nonpregnant Adults With Type 2 Diabetes Mellitus: A Guidance Statement Update From the American College of Physicians', url: 'https://www.acpjournals.org/doi/10.7326/M17-0939' },
    ],
    overallTier: 'strong',
    relatedIds: ['type1-hba1c-time-in-range'],
  },
  {
    id: 'type2-metabolic-syndrome-cluster',
    category: 'type2Diabetes',
    title: 'The Connected Cluster: T2D, PCOS, MASLD, and CKD Share One Underlying Thread',
    teaser: 'Four conditions already covered in depth all trace back, at least in part, to the exact same underlying mechanism.',
    summary: "Insulin resistance is a shared thread connecting T2D directly to three other conditions already covered in depth. PCOS's central mechanism, already documented in the dedicated research, is the identical insulin-resistance pathway, with a quantified 42.6%-versus-17.1% insulin resistance prevalence difference already cited there. MASLD's mechanism, also already documented, involves the liver storing fat specifically because insulin resistance disrupts normal fat metabolism, the same underlying disruption at work in T2D itself. CKD is real and directly connected too, diabetes (overwhelmingly T2D specifically) is one of the two most common causes of chronic kidney disease in the first place, which is exactly why SGLT2 inhibitors and other medications already covered in the dedicated CKD research do double duty, treating T2D and protecting the kidneys through the same medication at once. This is worth knowing directly as a practical insight, not just an academic connection: someone managing insulin resistance well, through diet, weight, exercise, or medication, is realistically working on all four of these conditions' own shared root cause simultaneously, not four separate, unrelated problems.",
    citations: [
      { source: 'Type 2 Diabetes, MedlinePlus, U.S. National Library of Medicine', url: 'https://medlineplus.gov/diabetestype2.html' },
    ],
    overallTier: 'strong',
    relatedIds: ['pcos-insulin-resistance-mechanism', 'masld-overview', 'ckd-overview', 'gout-metabolic-cluster-connection', 'foodhistory-cholesterol-real-drivers', 'magnesium-insulin-glucose', 'chromium-insulin-sensitivity-honest', 'prostate-metabolic-syndrome-bph-link', 'bodyfat-visceral-vs-subcutaneous', 'adiponectin-overview'],
  },
  {
    id: 'type2-tying-together',
    category: 'type2Diabetes',
    title: 'What Actually Holds Up for T2D, Pulled Together',
    teaser: 'Remission evidence stronger than most people realize, an important distinction from a same-named disease, and an honest correction to "lower is always better."',
    summary: "Line up everything in this category and T2D reads as a condition with more evidence-backed reason for hope than its common reputation suggests, alongside honest nuance that shouldn't be oversimplified away. The DiRECT trial's striking remission rates (46% at one year) and low-carbohydrate diets' own real, if honestly caveated, short-term benefit both point toward T2D being more reversible, for many people, than the older \"chronic and progressive, manage it forever\" framing implies. The distinction from Type 1 diabetes matters in practice, not just semantics, driving different screening timelines from day one. Current treatment guidance has shifted meaningfully toward organ-protective medications chosen for reasons beyond glucose control alone, and trial evidence gives an honest, sometimes uncomfortable correction to the assumption that tighter blood sugar control is always better, individualized targets are the evidence-backed standard, not a lesser one. And the shared insulin-resistance thread connecting T2D to PCOS, MASLD, and CKD is a useful way to see these four conditions, already built out in depth elsewhere, as one connected picture rather than four separate diagnoses.",
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
    title: "Prediabetes Is a Formal, Detectable Stage, and Up to 60% of People Who Have It Progress to Full T2D Within a Decade",
    teaser: 'A named, official pre-diagnosis category exists, detectable up to 20 years before symptoms show up, and it\'s the single biggest window the remission-trial evidence is aimed at.',
    summary: "T2D develops over a long timeline (10-20 years), and the ADA formally recognizes a distinct pre-diagnosis stage: prediabetes, defined by lab thresholds (fasting glucose 100-125 mg/dL, a 2-hour post-glucose-challenge reading of 140-199 mg/dL, or an A1C of 5.7-6.4%), none of which yet meets the threshold for a full T2D diagnosis. This isn't a minor technicality: research finds prediabetes detectable as early as 20 years before diabetes symptoms actually appear, and up to 60% of people with prediabetes progress to full T2D within 10 years without intervention. This stage is exactly the window the remission-trial evidence (DiRECT, low-carbohydrate diet research) is most powerfully aimed at, since effective interventions can prevent that progression. \"Prediabetes\" isn't a soft, informal label, it's a formally screened-for stage with documented stakes attached to catching it early.",
    citations: [
      { source: 'Diagnosis and Classification of Diabetes: Standards of Care in Diabetes, American Diabetes Association', url: 'https://diabetesjournals.org/care/article/47/Supplement_1/S20/153954/2-Diagnosis-and-Classification-of-Diabetes' },
    ],
    overallTier: 'strong',
    relatedIds: ['type2-direct-remission-trial'],
  },
  {
    id: 'type2-cognitive-liver-real-data',
    category: 'type2Diabetes',
    title: 'T2D Reaches the Brain and Liver Too, Substantial Cognitive Decline Risk, Often Underdiagnosed',
    teaser: 'One study found over half of T2D patients over 60 already showing mild cognitive impairment, a striking figure most people managing blood sugar never hear connected to their diagnosis.',
    summary: "T2D's reach extends directly into cognition, not just metabolism. Research finds one study of T2D patients over 60 showing 53.88% with mild cognitive impairment and 16.43% with dementia, substantial figures suggesting cognitive decline in T2D is underdiagnosed in everyday practice. The specific mechanistic link ties directly back to the MASLD research: liver FIBROSIS specifically, not just liver fat accumulation, is associated with mild cognitive impairment and dementia risk in older T2D patients, meaning the FIB-4 fibrosis score already covered in the MASLD research may double as a useful, already-available marker for cognitive risk too, not just liver risk. Shared mechanisms (insulin resistance, inflammation, oxidative stress, and NAFLD/MASLD itself) connect T2D, fatty liver, and cognitive decline into one interconnected picture rather than three separate, unrelated concerns.",
    citations: [
      { source: 'Metabolic-Associated Fatty Liver Disease and Cognitive Performance in Type 2 Diabetes, PMC11428552', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11428552/' },
    ],
    overallTier: 'strong',
    relatedIds: ['masld-f0-f4-fibrosis-staging', 'type2-hippocampal-neurogenesis-insulin-resistance'],
  },
  {
    id: 'type2-history-milestones',
    category: 'type2Diabetes',
    title: "T2D's Own Medication History: A Traditional Herbal Remedy, Rediscovered While Searching for a Malaria Drug",
    teaser: '1918, the 1940s, 1957, metformin\'s path to becoming T2D\'s first-line drug ran through a completely different disease, twice.',
    summary: "T2D's treatment history is more winding than most conditions. Metformin's origin traces to Galega officinalis (goat's rue), a traditional European herbal remedy found in 1918 to contain guanidine, a blood-sugar-lowering compound. Related guanidine derivatives were tried for diabetes in the 1920s-30s but abandoned due to toxicity once insulin (already covered in the T1D history research) became available instead. Metformin itself was rediscovered by accident in the 1940s, during a search for antimalarial drugs, when researchers noticed it happened to lower blood glucose in patients being tested for influenza. French physician Jean Sterne finally studied metformin specifically for diabetes in 1957, filing the first patent that same year, decades after its underlying chemistry was first identified. This is an unusual path (herbal remedy to malaria research to diabetes drug) compared to most other medication-history entries already built.",
    citations: [
      { source: 'Metformin: historical overview, PMID 28776081', url: 'https://pubmed.ncbi.nlm.nih.gov/28776081/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'type2-pregnancy-preexisting-real-risk',
    category: 'type2Diabetes',
    title: 'Pre-Existing T2D Carries Higher Pregnancy Risk Than Gestational Diabetes, and A1C Timing Is the One Factor That Predicts It',
    teaser: 'Research finds pre-existing T2D nearly doubles congenital-anomaly risk compared to gestational diabetes, and the single predictor that matters is A1C specifically in the first 14 weeks.',
    summary: "Pre-existing (pregestational) T2D carries a meaningfully different risk profile from gestational diabetes, two distinct situations rather than the same condition at different points. Research found pre-existing T2D nearly doubling congenital-anomaly risk compared to gestational diabetes (OR 1.91), with cardiac and neurological anomalies specifically more common when diabetes was already present before conception rather than developing during pregnancy. The single most useful, actionable finding: A1C, measured either anytime during pregnancy or specifically within the first 14 weeks, was the one sustained predictor of congenital-anomaly risk found across this research, a direct reason preconception A1C optimization (the same target range already covered in the T1D pregnancy research) matters just as much here. Compared to gestational diabetes, pre-existing T2D also carried higher risk of a large-for-gestational-age baby, perinatal mortality, and stillbirth, together a clear case for early, dedicated preconception planning with an endocrinologist rather than treating a T2D pregnancy the same way a later-diagnosed gestational case would be managed.",
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
    title: 'High Morning Blood Sugar Has Two Different Causes, And They Call for Opposite Fixes',
    teaser: "The dawn phenomenon is a normal hormone surge. The Somogyi effect is an overnight low blood sugar rebounding high, treating one like the other can make things worse, not better.",
    summary:
      "Waking up with high blood sugar has two different possible explanations, and telling them apart matters directly for what to actually do about it. The dawn phenomenon is a normal physiological event: growth hormone, cortisol, and catecholamines rise in the early morning hours as the body prepares to wake, triggering the liver to release stored sugar, and in someone with insulin resistance or T2D, morning insulin action often isn't strong enough to counter that rise. The Somogyi effect is a different mechanism entirely, the body's own rebound response to low blood sugar overnight, blood glucose drops too low, then swings back up by morning. Practical guidance for telling them apart: checking blood sugar at bedtime, around 2-3 AM, and at normal wake time for several nights: a low reading at 2-3 AM points to Somogyi; a normal or already-elevated reading at that same hour points to the dawn phenomenon instead. This matters because the fixes run in opposite directions, adjusting evening medication or snacking to prevent an overnight low (Somogyi) versus adjusting morning-focused treatment to blunt the hormone surge (dawn phenomenon). More recent research using continuous glucose monitoring has found the Somogyi effect less common than once assumed, with the dawn phenomenon being the more frequent explanation for high morning readings.",
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
    title: 'Bariatric Surgery Outperforms Lifestyle Intervention Alone for Achieving Diabetes Remission',
    teaser: 'Trial data found 40% of gastric bypass patients achieved diabetes remission at 3 years versus 0% with lifestyle intervention alone, with benefit still measurable up to 12 years later.',
    summary: "Bariatric (weight-loss) surgery carries substantially stronger remission evidence for type 2 diabetes than lifestyle intervention alone, a useful contrast alongside the DiRECT lifestyle-trial remission data already covered in the research. A randomized trial comparing Roux-en-Y gastric bypass (RYGB), laparoscopic adjustable gastric banding (LAGB), and intensive lifestyle intervention found any diabetes remission (partial or complete) at 3 years in 40% of RYGB patients and 29% of LAGB patients, compared to literal 0% in the lifestyle-only group. A 5-year follow-up of a separate trial found bariatric surgery patients achieving better long-term blood glucose control than medical management plus lifestyle changes, with benefit documented as far out as 12 years. Striking: research found 65% of RYGB patients went from needing insulin or oral medication at baseline to needing NO diabetes medication at all by year 3, versus none in the lifestyle-only group. This is quantified evidence favoring surgery for appropriate candidates, not a claim that surgery is risk-free or right for everyone, it carries its surgical risks and requires lifelong nutritional monitoring (already covered elsewhere in the bariatric-adjacent nutrient research). This is a concrete, evidence-backed option worth discussing directly with an endocrinologist for anyone with obesity and type 2 diabetes who hasn't achieved lasting control through lifestyle measures alone.",
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
    title: 'Metformin, the Most Commonly Prescribed Diabetes Medication, Carries a Well-Documented B12 Depletion Risk',
    teaser: 'Research finds vitamin B12 deficiency in anywhere from 6% to over 60% of long-term metformin users depending on the study, a common, actionable side effect worth routine monitoring.',
    summary: "Metformin, the standard first-line medication for type 2 diabetes, carries a well-documented risk of depleting vitamin B12 over time, likely through impaired B12 absorption in the small intestine, though the exact mechanism isn't fully settled. Research finds the reported prevalence varies substantially by study, from 5.8% to 30% in general long-term metformin users, with one study finding a striking 65.7% affected and another 24.3% at borderline-low levels. A large, long-term study (the Diabetes Prevention Program Outcomes Study) found combined low and borderline-low B12 significantly more common in metformin-treated patients than controls, both at 5 years (19.1% vs. 9.5%) and 13 years (20.3% vs. 15.6%), with risk rising by about 13% for every additional year of metformin use. Documented consequences of the resulting deficiency include neuropathy (worse peripheral nerve symptoms have been specifically linked to low B12 in metformin users), anemia, cognitive changes, and increased osteoporosis risk. This connects straight to the already-established B12 self-advocacy and Essential Nutrients research, someone on long-term metformin has a concrete, evidence-backed reason to ask specifically for a periodic B12 level check, not just standard diabetes labs, since deficiency symptoms can otherwise be mistaken for diabetic neuropathy itself rather than treated as the separate, correctable nutrient issue it actually is.",
    citations: [
      { source: 'Long-term Metformin Use and Vitamin B12 Deficiency in the Diabetes Prevention Program Outcomes Study, Journal of Clinical Endocrinology & Metabolism', url: 'https://academic.oup.com/jcem/article/101/4/1754/2804585' },
      { source: 'Vitamin B12 Deficiency in Patients Taking Metformin: Pathogenesis and Recommendations, PMC11374140', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11374140/' },
    ],
    overallTier: 'strong',
    relatedIds: ['b12-overview', 'advocacy-b12-folate', 'depletion-tying-together'],
  },
  {
    id: 'type2-cgm-non-insulin-benefit',
    category: 'type2Diabetes',
    title: 'Continuous Glucose Monitoring Helps People With Type 2 Diabetes Even When They\'re Not on Insulin',
    teaser: 'A large randomized trial (CONNECT) found CGM lowered HbA1c by 1.6 percentage points over 26 weeks in people not on insulin, a full 0.9 points more than routine care alone.',
    summary: "Continuous glucose monitoring (CGM), already covered in the research for its strong benefit in type 1 diabetes, carries high-grade evidence for type 2 diabetes too, including in people managing their condition without insulin at all. The landmark CONNECT trial, the first randomized trial providing high-grade evidence in this specific, large, mostly primary-care population, found CGM use over 26 weeks produced an average HbA1c reduction of 1.6 percentage points, a full 0.9 points better than routine care alone, with participants spending roughly 5 more hours per day in their target glucose range. A broader systematic review and meta-analysis found generally consistent benefit across both randomized trials and observational studies, on both glycemic outcomes and real-world measures like cost-effectiveness and reduced healthcare resource use, with evidence that even when the HbA1c change was smaller in non-insulin-treated groups, glycemic variability improved and treatment satisfaction was consistently higher. CGM isn't just a tool for people on complex insulin regimens, it's an evidence-backed option worth asking about directly for anyone managing type 2 diabetes with oral medications alone, giving immediate feedback on how specific foods and habits actually move blood sugar, directly supporting the core mission of helping someone discover their personal food-effect patterns.",
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
    title: 'Gum Disease and Type 2 Diabetes Worsen Each Other, a Bidirectional, Often-Overlooked Connection',
    teaser: 'Genetics-based research confirms a causal relationship running both directions between periodontal disease and T2D, with current guidelines now recommending each condition be screened for when the other is found.',
    summary: "Periodontal (gum) disease and type 2 diabetes carry a bidirectional relationship, each worsening the other, despite dental health rarely getting connected to diabetes management in practice. Research finds this two-way relationship confirmed not just through observational studies but through Mendelian randomization (the same genetics-based causal-inference method already covered elsewhere in the research as methodologically stronger than plain observation), directly clarifying a bidirectional causal association between periodontitis and type 2 diabetes rather than just a coincidental overlap. Mechanistic research finds a biological interplay between the oral microbiome and viral factors shared between the two conditions. A direct cross-sectional study found metabolic control in T2D and periodontal inflammation tracking together, worse blood sugar control associated with a higher periodontal inflammation burden, and better periodontal health associated with better glycemic control in return. Current clinical guidelines explicitly recommend that people with periodontitis be screened for diabetes, and that people with diabetes be informed of their elevated risk of developing periodontal disease. Regular dental care and gum-health monitoring deserve a concrete place in T2D management, not treated as a separate, unrelated health domain, and unexplained bleeding gums or gum disease that won't resolve is worth mentioning directly to a diabetes care team, not just a dentist.",
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
    title: 'What "Remission" Actually Means: The Specific ADA Consensus Definition',
    teaser: 'Current international consensus defines remission as HbA1c under 6.5% for at least 3 months with zero glucose-lowering medication, a specific, testable definition, not a vague sense of "doing better."',
    summary: "Type 2 diabetes remission, already covered through trial data elsewhere in the research (the DiRECT lifestyle trial, bariatric surgery outcomes), has a specific, formal definition, since \"remission\" means something exact, not a general feeling of improvement. Current international consensus (a 2021 ADA-convened expert group) defines remission as an HbA1c under 6.5% (48 mmol/mol), measured at least 3 months after stopping all glucose-lowering medication. Alternative criteria exist for when HbA1c itself isn't a reliable marker: fasting plasma glucose under 126 mg/dL, or an estimated HbA1c calculated from continuous glucose monitor data, both valid substitutes. Guidance specifies exact testing timing too, the confirming test should happen no sooner than 3 months after stopping medication, with yearly retesting recommended afterward to confirm the remission is actually holding. For useful historical context, an earlier, 2009 framework used three tiers, \"partial\" remission (sub-diabetic glucose levels for at least 1 year off medication), \"complete\" remission (fully normal glucose for 1 year off medication), and \"prolonged\" remission (complete remission sustained 5 or more years). This specific, testable definition matters because it sets an objective bar, someone who's simply on fewer medications, or whose HbA1c has improved while still on medication, hasn't technically achieved remission by this formal standard, a distinction to keep in mind before assuming a personal treatment goal has already been met.",
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
    title: 'A Honest Complication: Statins Themselves Carry a Modest, Diabetes Risk, Even While Preventing Heart Disease',
    teaser: 'Research finds statin use tied to a measurable increased risk of developing type 2 diabetes, roughly one extra case per 100-200 people treated over 5 years, a tradeoff, not a reason to avoid them.',
    summary: "Statins, already covered elsewhere in the cardiovascular research for their strong mortality benefit, carry an honest complication: they modestly raise the risk of developing type 2 diabetes. Research finds moderate-intensity statins increasing diabetes risk by roughly 11%, with a further 12% increase at high-intensity dosing, and one major cohort study found a 46% increased relative risk with statin treatment specifically. Proposed mechanisms include statins pushing someone already close to the diabetes threshold over it slightly earlier than they otherwise would have crossed it, along with direct effects on insulin sensitivity and insulin secretion, and a speculative link to statin-induced mitochondrial dysfunction in skeletal muscle contributing to insulin resistance. Research translates this into roughly one additional diabetes case per 100 to 200 people treated with statins over 5 years, a small absolute number set against roughly ten times greater benefit on major cardiovascular outcomes (heart attacks, strokes, and deaths prevented) over that same period. This is honest context, not a reason to avoid a beneficial medication, someone already at elevated diabetes risk starting a statin has an evidence-backed reason for slightly closer blood-sugar monitoring going forward, not a reason to skip a medication with much larger cardiovascular benefit.",
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
    title: 'A Meta-Analysis Found Eating Within a Shorter Window Improves Blood Sugar, Distinct From Low-Carb Eating',
    teaser: 'Pooling 8 trials, time-restricted eating significantly lowered fasting glucose and HbA1c and increased time-in-range, a different lever from this category\'s already-covered low-carb evidence.',
    summary:
      "This category's research already covers low-carbohydrate diets as a distinct lever for T2D. Time-restricted eating, confining food intake to a shorter daily window without necessarily changing WHAT is eaten, is a separate, actively-tested approach. A meta-analysis pooling 8 randomized controlled trials (312 participants with type 2 diabetes or impaired fasting glucose) found time-restricted eating significantly reduced both fasting glucose and HbA1c, with a consistent increase in time-in-range across the pooled trials. Individual trials found broadly similar results: a 3-month randomized trial found a nightly 12-hour fasting window combined with calorie restriction outperformed calorie restriction alone for both weight loss and HbA1c, and a 10-hour time-restricted-eating crossover trial found 24-hour glucose improvement in free-living adults with T2D, though notably without a matching improvement in insulin sensitivity itself, an honest nuance worth keeping in view rather than assuming every marker improves together. This is a food-timing-first lever, distinct from what's eaten, that someone who finds a specific eating window more sustainable day to day than tracking every gram of carbohydrate can raise directly with a doctor or dietitian as an evidence-backed alternative or complement to this category's already-covered low-carb approach.",
    citations: [
      { source: 'Time-Restricted Eating Improves Glycemic Control in Patients with Type 2 Diabetes: A Meta-Analysis and Systematic Review, PMC12346854', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12346854/' },
    ],
    overallTier: 'strong',
    relatedIds: ['type2-low-carb-diet-evidence', 'masld-time-restricted-eating', 'chrono-early-time-restricted-eating', 'chrono-time-restricted-eating-nuance'],
  },
  {
    id: 'type2-sleep-apnea-glycemic-control',
    category: 'type2Diabetes',
    title: 'Sleep Apnea and T2D Run Together, but Trials on Treating It Give a Mixed Answer',
    teaser: 'Individual CPAP trials found glycemic improvement in some cases, but a pooled meta-analysis of 581 patients found no overall HbA1c benefit, an honest, unsettled evidence picture.',
    summary:
      "Obstructive sleep apnea and type 2 diabetes are commonly co-occurring conditions, and research has directly tested whether treating the sleep apnea (with CPAP, continuous positive airway pressure) improves the diabetes itself, with a mixed answer rather than a settled one either way. One controlled trial (50 patients) found CPAP treatment produced a statistically significant improvement in glycemic control and insulin resistance compared with standard care. A later trial (the Diabetes Sleep Treatment Trial) found significant HbA1c improvement at 6 weeks that didn't hold up as a sustained difference by the trial's primary, intention-to-treat analysis. A pooled meta-analysis of 6 randomized trials and 581 total participants found no significant overall effect on HbA1c at either 12 or 24 weeks, a more sobering conclusion once the individual, more encouraging trials are combined. One consistent thread across this mixed picture: research found CPAP adherence itself tracked with greater glycemic improvement, suggesting the practical barrier (many people struggle to use CPAP consistently every night) may be diluting an effect that's there for people who use it well. Treating sleep apnea remains worthwhile care in its own right (blood pressure, cardiovascular risk, daytime function), just not, based on current pooled evidence, a reliably diabetes-improving intervention on its own.",
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
    title: "Type 2 Diabetes Diagnosed in Youth Runs a Faster, Harsher Course Than the Same Disease in Adults",
    teaser: 'A landmark long-term study found 60% of people diagnosed with T2D as children or teens already had a diabetes complication within 15 years, most still in their 20s, a faster course than adult-onset T2D typically shows.',
    summary:
      "This category's already-covered research (remission, GLP-1/SGLT2 medications, individualized HbA1c targets) draws mostly on adult-onset T2D, the far more common presentation. Long-term data finds youth-onset T2D a different, more aggressive disease, not simply the same condition starting earlier. The landmark TODAY study and its long-term TODAY2 follow-up found insulin-producing beta-cell function declining faster in youth than in adults, and metformin alone, this category's often-first medication, provided durable glycemic control in only about half of young participants. 15-year follow-up data found 60% of participants had developed at least one diabetes-related complication, and nearly a third had two or more, at an average age of just 26, high blood pressure in 67%, kidney disease in nearly 55%, eye disease in 51%, and nerve disease in 32%. Research found the rate of heart, vascular, and stroke-related events three times higher than in a comparison study of older adults with a longer disease duration, a striking reversal of the usual assumption that more years with diabetes means more complications. A young person diagnosed with T2D deserves more assertive, more closely-monitored treatment from the start, not a wait-and-see approach based on how the disease usually behaves in adults, since evidence finds it usually doesn't behave the same way at all.",
    citations: [
      { source: 'Long-Term Complications in Youth-Onset Type 2 Diabetes, New England Journal of Medicine 2021, PMID 34320286', url: 'https://pubmed.ncbi.nlm.nih.gov/34320286/' },
    ],
    overallTier: 'strong',
    relatedIds: ['type2-remission-ada-consensus-definition', 'type2-individualized-hba1c-targets'],
  },
  {
    id: 'type2-global-nauru-pacific-thrifty-gene',
    category: 'type2Diabetes',
    title: 'Nauru Has the Highest Type 2 Diabetes Rate on the Planet, and a Named Theory Explains Why So Fast',
    teaser: "Roughly half of Nauru's adult population has Type 2 diabetes, following a documented multi-decade shift from a traditional fish-and-vegetable diet to imported processed food, exactly the kind of change a genetic theory predicts would hit hardest.",
    summary:
      "Nauru, a small Pacific Island nation, carries the highest Type 2 diabetes prevalence documented anywhere on the planet, roughly half of its adult population, and several other Pacific Island nations (Cook Islands, Fiji, Marshall Islands, Samoa, Tonga, Tuvalu) all carry Type 2 diabetes prevalence above 10%. The documented cause traces to an unusually fast, unusually recent dietary shift: Nauru's population were traditionally lean, active hunter-gatherer-fishers eating mostly raw or boiled fish, until mid-20th-century mining wealth suddenly made imported, processed, Western-style food widely available. The 'thrifty gene' hypothesis, a long-standing theory in this specific research area, proposes that populations who survived repeated historical famine and food scarcity, including many Pacific Islander groups during their ancestors' original ocean voyages and settlement, were naturally selected for genes that store fat especially efficiently, a survival advantage during scarcity that becomes a metabolic liability once food, especially processed, calorie-dense food, becomes constantly available. A separate but related pattern: South Asian populations develop measurable Type 2 diabetes risk at lower BMI levels than white European populations, a reason clinical BMI cutoffs for 'overweight' and 'obese' have been adjusted lower specifically for South Asian populations in some countries. Type 2 diabetes risk isn't one universal curve against body weight: population-specific genetic and historical factors shift where that curve actually sits.",
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
    title: 'A Substantial Share of Type 2 Diabetes Complications Are Already Present at the Moment of Diagnosis',
    teaser: 'A 77,681-person Swedish registry found 17.2% of people already had diabetic retinopathy at the moment of their Type 2 diabetes diagnosis, evidence the disease was often present, undetected, for years beforehand.',
    summary:
      "Type 2 diabetes's gradual, often-symptomless onset (already covered in this category's prediabetes-progression research) has a concrete consequence: a substantial share of people already have measurable complication damage by the time they're diagnosed. A large Swedish national registry study of 77,681 newly diagnosed people found 17.2% already had diabetic retinopathy (damage to the light-sensitive tissue in the eye) at diagnosis, and a Scottish study found a similar 19.3% prevalence at first screening. Nerve damage (diabetic neuropathy) was present in a 8.2% of newly diagnosed patients in a separate study, lower than retinopathy but still a meaningful share. The practical, actionable finding underneath this: among people whose diabetes was caught through routine screening rather than after symptoms prompted a doctor visit, only 22% already had retinopathy, compared with 51% among those diagnosed only after symptoms led them to seek care, direct evidence that regular screening catches Type 2 diabetes earlier, before as much silent damage accumulates. Current diabetes-care standards recommend an eye exam and a foot/nerve exam at the time of diagnosis, not months or years later, specifically because data shows this damage can already be present from day one.",
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
    teaser: "This category's already-covered Nauru research shows the highest per-capita rate; China and India instead show the largest absolute number of people affected, over 140 million and nearly 90 million respectively.",
    summary:
      "This category's already-covered Nauru entry tells a per-capita story, roughly half of one small island's population affected. China and India tell a different kind of story: sheer scale. IDF Diabetes Atlas data finds China carrying the world's largest absolute number of people with diabetes, over 140 million in 2021, projected to exceed 174 million by 2045, with India close behind at nearly 90 million adults, accounting for roughly 1 in every 7 adults with diabetes worldwide. A further complication: over half of everyone with UNDIAGNOSED diabetes globally lives in just three countries, China, India, and Indonesia, meaning the true scale in these countries is likely even larger than the already-enormous confirmed numbers. Projections show India's diabetes population rising a further 75% by 2050. This is a different, complementary statistic to Nauru's per-capita story, rather than one country having the 'worst' diabetes problem, global diabetes burden concentrates differently depending on whether the question is which population is proportionally hit hardest (Nauru, the Pacific Islands) or where the largest absolute number of affected people actually live (China, India), both true and both part of the global picture of this disease.",
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
    title: "A Triple-Acting Drug Just Cleared Its First Phase 3 Trial, Working Through Three Hormones at Once",
    teaser: "This category's already-covered GLP-1/SGLT2 paradigm shift is already moving toward a third hormone target, a single drug now activating GIP, GLP-1, AND glucagon receptors together, with a 22,000-plus-participant trial program underway.",
    summary:
      "This category's already-covered paradigm shift toward GLP-1 and SGLT2 medications is already advancing toward a further step. Retatrutide is an investigational drug activating three separate hormone receptors at once (GIP, GLP-1, and glucagon), rather than the one or two most current medications target. Its first Phase 3 trial (TRANSCEND-T2D-1) met both its primary and key secondary endpoints, delivering superior blood-sugar reduction and weight loss compared with placebo at 40 weeks, part of a large program spanning 14 trials and more than 22,000 participants. Separately, and still much earlier-stage, research continues investigating whether the body's own insulin-producing beta cells can be coaxed into regeneration, through cell proliferation, converting other pancreatic cell types into functional beta cells, or reprogramming precursor cells directly, active laboratory research rather than anything close to patient use yet. The field's current direction is less about finding one single new drug and more about combining an increasing number of distinct hormone-signaling pathways into single medications, extending the same core strategy already proven with existing GLP-1 and SGLT2 treatments.",
    citations: [
      { source: "Lilly's triple agonist, retatrutide, demonstrated significant reductions in A1C and weight in first Phase 3 trial", url: 'https://investor.lilly.com/news-releases/news-release-details/lillys-triple-agonist-retatrutide-demonstrated-significant' },
    ],
    overallTier: 'strong',
    relatedIds: ['type2-glp1-sglt2-paradigm-shift'],
  },
  {
    id: 'horizon-type2-orforglipron',
    category: 'type2Diabetes',
    title: 'A Pill-Form GLP-1 Just Outperformed the Only Other Oral GLP-1 Already on the Market',
    teaser: "This category's already-covered GLP-1 research relies mostly on injections. Orforglipron, a new oral small-molecule GLP-1, beat oral semaglutide head-to-head in a Phase 3 trial on both blood sugar control and weight loss.",
    summary:
      "This category's already-covered GLP-1 research (part of the paradigm shift already named in this category) has mostly meant injectable medication, with oral semaglutide the one existing pill-form option. Orforglipron represents a different kind of oral GLP-1, a small molecule rather than a peptide, which research finds easier and cheaper to manufacture and administer without semaglutide's strict food-and-water timing requirements. In a direct head-to-head Phase 3 trial (ACHIEVE-3, published in The Lancet) against oral semaglutide in adults already on metformin, orforglipron delivered significantly greater improvements in both blood sugar control and weight loss across every primary and key secondary measure. Two further Phase 3 trials (ACHIEVE-2 and ACHIEVE-5) found it also meeting every endpoint against an established SGLT2 inhibitor and against placebo, including cardiovascular risk-marker improvement. Trial data across this whole drug found the same gastrointestinal side effects (nausea, vomiting, diarrhea) already common to this whole drug class, described as generally mild, temporary, and concentrated during the initial dose-adjustment period, not a new or different safety concern from what this category's existing GLP-1 research already names.",
    citations: [
      { source: "Lilly's oral GLP-1, orforglipron, delivered superior blood sugar control and weight loss compared to oral semaglutide, The Lancet", url: 'https://lilly.gcs-web.com/news-releases/news-release-details/lillys-oral-glp-1-orforglipron-delivered-superior-blood-sugar' },
    ],
    overallTier: 'strong',
    relatedIds: ['type2-glp1-sglt2-paradigm-shift', 'horizon-type2'],
  },
  {
    id: 'type2-depression-bidirectional-real-data',
    category: 'type2Diabetes',
    title: 'Depression and Type 2 Diabetes Raise Each Other\'s Risk',
    teaser: 'Meta-analyses find depression raising future T2D risk by 34 to 60 percent depending on the study, while T2D itself raises later depression risk by roughly a quarter, a two-way relationship, not one causing the other alone.',
    summary: 'Large meta-analyses confirm a bidirectional relationship between depression and type 2 diabetes, distinct from the already-covered diabetes distress the Type 1 Diabetes research names (a separate condition specific to living with diabetes itself, not this broader, two-way risk relationship). Depression raising future T2D risk: a 2008 meta-analysis (13 studies, 6,916 cases) found a 60 percent increased risk, while a larger 2017 meta-analysis (32 studies, 1,274,337 participants) found a 34 percent increased risk, consistent findings across depression measured by symptom scales, clinical interviews, physician diagnosis, or antidepressant use. T2D raising future depression risk runs the other direction with similar consistency: a meta-analysis of 24 studies (329,658 participants) found a 28 percent increased depression risk, and a separate review of 11 longitudinal studies (172,521 participants) found 24 percent. The proposed shared mechanisms, inflammation, HPA-axis dysregulation, and neurotransmitter imbalance, tie directly into the already-covered inflammation and cortisol research elsewhere, plausible biological threads connecting a metabolic disease and a mood disorder, not just two common conditions that happen to co-occur by chance.',
    citations: [
      { source: 'The Interconnected Complexity of Diabetes and Depression, Diabetes Spectrum, American Diabetes Association', url: 'https://diabetesjournals.org/spectrum/article/38/1/23/157816/The-Interconnected-Complexity-of-Diabetes-and' },
      { source: 'Evidence of bidirectional relationship between type 2 diabetes and depression; a Mendelian randomization study, Molecular Psychiatry', url: 'https://www.nature.com/articles/s41380-025-03083-0' },
    ],
    overallTier: 'strong',
    relatedIds: ['mentalhealth-overview', 'mentalhealth-inflammation-link', 'type1-diabetes-distress-psychological-burden', 'type2-insulin-resistance-depression-mechanism'],
  },
  // Added 2026-08-24, fact-checking a shared Google AI Mode conversation on
  // diet and mental illness. The bidirectional epidemiology above already
  // covers how often depression and T2D co-occur, this entry covers the
  // specific brain mechanism proposed to explain why, distinct rather than
  // duplicated.
  {
    id: 'type2-insulin-resistance-depression-mechanism',
    category: 'type2Diabetes',
    title: 'Insulin Resistance Itself, Not Just Blood Sugar, Is a Documented Shared Mechanism With Depression',
    teaser: 'Research finds defective insulin signaling directly disrupts the brain\'s own reward system and stress-response axis, a specific proposed mechanism behind why T2D and depression track together so closely.',
    summary:
      "Beyond the epidemiological bidirectional risk this category already documents, research into T2D's underlying biology, insulin resistance, finds it functioning as a shared pathogenic mechanism with depression rather than only a downstream metabolic complication of it. Insulin resistance has been shown to develop in the brains of people with depression, involving defective insulin signaling that affects the brain's reward system, neurogenesis, synaptic plasticity, and the hypothalamic-pituitary-adrenal stress axis, the same axis this category's cortisol and stress research already covers. One specific proposed pathway: the inflammatory cytokine TNF-alpha promotes both defective insulin signaling and depressive-like behavior through overlapping molecular signaling, giving inflammation, insulin resistance, and mood a documented common thread rather than three separate problems that happen to occur in the same person. This sits alongside this category's already-covered blood-sugar management guidance: stabilizing glucose and improving insulin sensitivity is a metabolic goal with a plausible mood benefit attached, not an unrelated, separate concern.",
    citations: [
      { source: 'Insulin Resistance as a Shared Pathogenic Mechanism Between Depression and Type 2 Diabetes, PMC6382695', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6382695/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['type2-depression-bidirectional-real-data', 'mentalhealth-glycemic-instability-mood', 'pcos-insulin-resistance-depression-mechanism'],
  },
  {
    id: 'type2-diabetic-foot-ulcer-amputation-risk',
    category: 'type2Diabetes',
    title: "Foot Ulcers Are Common in Type 2 Diabetes, and Catching One Early Is an Amputation-Prevention Strategy",
    teaser: "A lifetime foot-ulcer risk as high as 25%, and a 10-20 times higher amputation risk than someone without diabetes, make routine foot checks a high-stakes habit, not a formality.",
    summary:
      "Beyond the already-covered microvascular complications this category tracks (eye, kidney, nerve), a distinct and serious complication deserves its own direct coverage: diabetic foot ulcers. Data finds a lifetime foot-ulcer incidence in type 2 diabetes as high as 25 percent, with an adjusted hazard ratio of 1.65 for developing a foot ulcer specifically because of the underlying diabetes. The more urgent number: someone with type 2 diabetes who develops a foot ulcer carries a documented 10 to 20 times higher risk of amputation than someone without diabetes at all. Research identifies the mechanism as two, already-familiar diabetes complications compounding each other, peripheral neuropathy (numbness that means an injury or blister can go unnoticed) combined with poor circulation from vascular disease, which together mean small, ordinarily minor wounds can progress to serious infection before they're even felt. Identified risk factors for actually losing a limb once an ulcer forms include smoking history, a prior foot ulcer, and signs of bone infection or tissue death, all checkable warning signs. The practical, real-world takeaway: daily self-checks and prompt medical attention for any foot wound, however minor it looks, are an evidence-backed way to prevent the single most severe downstream consequence of this complication.",
    citations: [
      { source: 'Foot Ulcer and Risk of Lower Limb Amputation or Death in People With Diabetes, Diabetes Care', url: 'https://diabetesjournals.org/care/article/45/1/83/138976/Foot-Ulcer-and-Risk-of-Lower-Limb-Amputation-or' },
      { source: 'The incidence of lower extremity amputation and its associated risk factors in patients with diabetic foot ulcers: a meta-analysis, PMC11227953', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11227953/' },
    ],
    overallTier: 'strong',
    relatedIds: ['type2-microvascular-complications-screening', 'type2-screening-at-diagnosis'],
  },
  {
    id: 'type2-erectile-dysfunction-real-data',
    category: 'type2Diabetes',
    title: 'Erectile Dysfunction Is More Common With Type 2 Diabetes, and It Often Signals Broader Vascular Risk',
    teaser: 'Research finds erectile dysfunction affecting a larger share of men with type 2 diabetes than without it, and it tracks with the same cardiovascular risk factors this category already covers.',
    summary:
      "A large Catalonian study of nearly 660,000 men found erectile dysfunction affecting 12.6 percent of men with type 2 diabetes, a 1.5-fold higher rate than the 8.3 percent found in men without diabetes, with prevalence peaking between ages 55 and 64. Separate studies using different measurement methods and populations find even higher figures, one large meta-analysis pooling 145 studies found a 66 percent prevalence in type 2 diabetes overall, and regional studies in some populations have found rates as high as 81 percent, evidence the exact number depends heavily on how and where it's measured, though every study agrees the direction is the same: more common with diabetes than without. The worth-knowing mechanism connects directly to this category's already-covered cardiovascular and microvascular research: erectile dysfunction shares the same vascular-damage and nerve-damage pathways as diabetic eye, kidney, and foot complications, and research identifies the same risk factors driving it, poor glycemic control, smoking, hypertension, and cardiovascular disease. This means erectile dysfunction in a man with type 2 diabetes is worth treating as an early warning signal for broader vascular health, not just as a private quality-of-life issue to manage in isolation.",
    citations: [
      { source: 'Prevalence and clinical characteristics of erectile dysfunction among men with type 2 diabetes in primary care, PMID 42000296', url: 'https://pubmed.ncbi.nlm.nih.gov/42000296/' },
    ],
    overallTier: 'strong',
    relatedIds: ['type2-microvascular-complications-screening', 'cvd-overview'],
  },
  {
    id: 'type2-glp1-realworld-cardiovascular-outcomes',
    category: 'type2Diabetes',
    title: "Real-World Data on GLP-1 Drugs Confirms Cardiovascular Benefit Beyond Just Weight and Blood Sugar",
    teaser: 'This category\'s already-covered GLP-1/SGLT2 paradigm shift gets real-world confirmation: large cohort studies find GLP-1 agonists tracking with fewer heart attacks, strokes, and deaths compared to older diabetes drugs, not just controlled-trial results.',
    summary:
      "This category's already-covered treatment-guideline shift toward GLP-1 receptor agonists and SGLT2 inhibitors rests on controlled clinical trials, and real-world data collected outside those trials, in ordinary clinical practice, independently confirms the same pattern. A large systematic review and meta-analysis of real-world studies found GLP-1 receptor agonist use associated with significant reductions in composite cardiovascular outcomes, major adverse cardiovascular events, all-cause mortality, heart attack, stroke, cardiovascular death, and heart failure, compared with other glucose-lowering drugs used in actual practice, not just a controlled trial population. A separate nationwide population-based cohort study found the same comparative cardiovascular safety pattern holding up at national scale. Honest data alongside this benefit: a real-world weight-loss study of over 2,400 patients found GLP-1 agonists producing genuine but modest average weight loss through 72 weeks in actual clinical use, generally less dramatic than headline clinical-trial figures, and a separate safety study found an increased risk of gallbladder and biliary-related hospitalization among GLP-1 users, a worth-knowing tradeoff alongside the cardiovascular benefit. This real-world confirmation matters because it shows the benefit isn't an artifact of how carefully selected and monitored clinical-trial participants are, the same cardiovascular protection shows up in ordinary practice too.",
    citations: [
      { source: 'Cardiovascular and Renal Effectiveness of GLP-1 Receptor Agonists vs. Other Glucose-Lowering Drugs in Type 2 Diabetes: A Systematic Review and Meta-Analysis of Real-World Studies, PMC8879165', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8879165/' },
      { source: 'Real-world weight-loss effectiveness of glucagon-like peptide-1 agonists among patients with type 2 diabetes: A retrospective cohort study, PMID 36621904', url: 'https://pubmed.ncbi.nlm.nih.gov/36621904/' },
    ],
    overallTier: 'strong',
    relatedIds: ['type2-glp1-sglt2-paradigm-shift', 'cvd-overview'],
  },
  {
    id: 'type2-hearing-loss-real-prevalence',
    category: 'type2Diabetes',
    title: 'Hearing Loss Is an Underrecognized Type 2 Diabetes Complication, Tied Directly to Duration and Control',
    teaser: 'Pooled data finds clinically significant hearing loss more than twice as common in type 2 diabetes as in matched controls, with worse control and longer disease duration both independently making it more likely.',
    summary:
      "This category's already-covered microvascular and nerve-damage complications (eye, kidney, foot) reach the same vascular and neural pathways as another, less commonly discussed one: hearing. Pooled data finds hearing loss prevalence in type 2 diabetes ranging from 40.6 to 71.9 percent across studies, and a direct comparison found clinically significant hearing loss in 53.0 percent of diabetic patients versus 25.2 percent of matched controls, a more than two-fold relative risk. The most common type found is sensorineural hearing loss (46.2 percent of cases), the same category of hearing damage caused by inner-ear or auditory-nerve injury, consistent with a direct link to this category's already-covered neuropathy research: one study found the hearing loss specifically associated with diabetic neuropathy rather than diabetes alone. Identified risk factors mirror this category's already-covered complication-screening research directly: hearing loss prevalence was significantly higher in people with diabetes duration over 10 years, and both disease duration and HbA1c level (already covered elsewhere in this category as the central control marker) independently predicted it. Hearing loss isn't part of standard diabetes complication screening the way eye and kidney checks already are, reason to mention any hearing changes directly to a doctor rather than assume they're simply an unrelated, ordinary part of aging.",
    citations: [
      { source: 'Type 2 Diabetes Mellitus and Hearing Loss: A Prisma Systematic Review and Meta-Analysis, PMC12574643', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12574643/' },
      { source: 'Hearing Loss in Type 2 Diabetes in Association with Diabetic Neuropathy, PMID 29433858', url: 'https://pubmed.ncbi.nlm.nih.gov/29433858/' },
    ],
    overallTier: 'strong',
    relatedIds: ['type2-microvascular-complications-screening', 'type2-individualized-hba1c-targets'],
  },
  {
    id: 'type2-bariatric-surgery-real-10year-durability',
    category: 'type2Diabetes',
    title: 'Bariatric Surgery Puts Type 2 Diabetes Into Remission, and 10-Year Data Shows the Odds of It Lasting',
    teaser: "This category's already-covered DiRECT trial shows dietary remission evidence, a 10-year surgical follow-up found roughly half of gastric bypass patients still in remission a full decade out, with diabetes duration at the time of surgery the strongest predictor of whether it lasts.",
    summary:
      "This category's already-covered DiRECT trial found substantial diabetes remission through structured dietary weight loss, and long-term surgical data gives a different, more durable comparison point. A Roux-en-Y gastric bypass cohort found remission rates of 74 percent at 1 year, dropping to a 53 percent still in remission at 10 years, roughly half of patients maintaining it for a full decade. The single strongest predictor of lasting remission: how long someone had diabetes before surgery. Patients with a shorter diabetes duration (under 4 years) maintained remission in about 80 percent of cases at 10 years, while a separate cohort study of patients with 10 or more years of diabetes duration found remission rates declining roughly 10 percentage points per year after surgery, from 65.6 percent at year one down to 41.9 percent by year three. Consistent with this category's already-covered window-of-opportunity-style reasoning elsewhere in this Digest, evidence points toward earlier surgical intervention, while glycemic control is still relatively good, producing meaningfully more durable results than waiting until diabetes has been established for a decade or more, concrete reason timing itself is a part of this decision, not just whether to have the surgery at all.",
    citations: [
      { source: 'Diabetes Remission After Bariatric Surgery: A 10-Year Follow-Up Study, PMC11717815', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11717815/' },
      { source: 'Duration of type 2 diabetes and remission rates after bariatric surgery in Sweden 2007-2015: A registry-based cohort study, PLOS Medicine', url: 'https://journals.plos.org/plosmedicine/article?id=10.1371%2Fjournal.pmed.1002985' },
    ],
    overallTier: 'strong',
    relatedIds: ['type2-bariatric-surgery-remission', 'type2-direct-remission-trial'],
  },
  {
    id: 'type2-sleep-duration-quality-real-data',
    category: 'type2Diabetes',
    title: 'Short Sleep and Poor Sleep Quality Predict Worse Blood Sugar Control, Independent of Sleep Apnea',
    teaser: "This category's already-covered sleep-apnea/CPAP entry names an honestly mixed treatment picture, direct data finds sleep duration and quality THEMSELVES, apart from apnea specifically, carrying a striking, independent effect on glycemic control.",
    summary: "This category's already-covered sleep-apnea research finds treating apnea itself producing a mixed benefit for blood sugar control, and separate research finds sleep duration and quality carry their own, independent, effect. Direct clinical data found people with T2D sleeping fewer than 6 hours a night had 8.3 times higher odds of poor glycemic control compared with those getting adequate sleep, and poor sleep quality itself (regardless of duration) carried a 3.3 times higher odds of poor control. Research names a plausible, direct mechanism: sleep disturbance is associated with measurable increases in circulating cortisol, sympathetic nervous system activity, and epinephrine, each already directly implicated elsewhere in the inflammation and glucose-metabolism research, not a vague, general wellness claim. A separate meta-analysis of sleep characteristics and diabetes risk more broadly confirms both short and long sleep duration, not just short sleep, tracking with elevated risk, a U-shaped relationship. This is actionable information independent of whether sleep apnea is present at all, someone with T2D and consistently poor sleep, for any reason, has an evidence-backed reason to address sleep directly as part of glucose management, not treat it as separate from or secondary to diet and medication.",
    citations: [
      { source: 'Glycemic control and its association with sleep quality and duration among type 2 diabetic patients, PMID 37275405', url: 'https://pubmed.ncbi.nlm.nih.gov/37275405/' },
      { source: 'Real-World Data in Support of Short Sleep Duration with Poor Glycemic Control, in People with Type 2 Diabetes Mellitus, PMC6556303', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6556303/' },
    ],
    overallTier: 'strong',
    relatedIds: ['type2-sleep-apnea-glycemic-control', 'sleep-inflammation-cytokine-mechanism'],
  },
  {
    id: 'type2-ai-retinopathy-screening-real-accuracy',
    category: 'type2Diabetes',
    title: 'AI-Based Eye Screening Is Now Validated, and Changes Who Actually Gets Screened',
    teaser: "This category's already-covered microvascular complication-screening research names retinopathy as one of three targets, validated AI screening tools now catch it as accurately as a specialist, with trial data finding they increase how many people actually get screened at all.",
    summary:
      "This category's already-covered microvascular-complication-screening research already names diabetic retinopathy as a standard target, and a new, screening technology deserves its own direct coverage. FDA-cleared, autonomous AI systems (IDx-DR is the most established example) analyze retinal photos and flag referable disease without a human specialist reviewing every image first. Real-world validation found one such system reaching 100 percent sensitivity for detecting no, mild, or moderate retinopathy, with specificity ranging from 78.4 to 97.6 percent depending on disease stage, direct evidence this isn't a hypothetical technology, it performs at a clinically usable accuracy level today. A broader systematic review and meta-analysis of AI-based retinopathy screening across real-world settings confirms this general accuracy pattern holds up outside controlled trial conditions, not just in an idealized research setting. The most practically important finding comes from the ACCESS randomized controlled trial, which found autonomous AI screening increased both screening completion AND appropriate follow-up specifically in youth with diabetes, direct evidence this technology doesn't just match human accuracy, it measurably closes a common gap where retinopathy screening gets skipped or delayed. This validated technology is exactly why retinopathy screening no longer has to wait on specialist-appointment availability, worth asking directly whether a clinic offers AI-based retinal screening as a faster, evidence-backed alternative to a traditional dilated eye exam referral.",
    citations: [
      { source: 'Accuracy of Autonomous Artificial Intelligence-Based Diabetic Retinopathy Screening in Real-Life Clinical Practice, PMC11355215', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11355215/' },
      { source: 'Autonomous artificial intelligence increases screening and follow-up for diabetic retinopathy in youth: the ACCESS randomized control trial, Nature Communications', url: 'https://www.nature.com/articles/s41467-023-44676-z' },
    ],
    overallTier: 'strong',
    relatedIds: ['type2-microvascular-complications-screening', 'type2-screening-at-diagnosis'],
  },
  {
    id: 'type2-pancreatic-cancer-risk-real-data',
    category: 'type2Diabetes',
    title: 'T2D Carries a Roughly Doubled Pancreatic Cancer Risk, and an Important Timing Wrinkle',
    teaser: "This category's already-covered microvascular-screening research names established complication targets, a pooled meta-analysis of 36 studies (9,220 pancreatic cancer patients) finds a doubled cancer risk too, with an important twist about WHEN that risk shows up.",
    summary:
      "This category's already-covered complication-screening research names established microvascular and cardiovascular targets, and pancreatic cancer deserves its direct, honestly nuanced coverage. A large meta-analysis of 36 studies (9,220 people with pancreatic cancer) found a summary odds ratio of 1.82, roughly an 82 percent higher risk of pancreatic cancer associated with type 2 diabetes. The important, honest wrinkle: this risk isn't uniform over time. People whose diabetes had only recently been diagnosed (less than 4 years) had a significantly HIGHER risk than people with longer-standing diabetes (5 or more years), a quantified 2.1 versus 1.5 odds ratio. This timing pattern changes how the finding should actually be read: it's strong evidence for REVERSE causation playing a role, an early, undetected pancreatic tumor can itself disrupt blood sugar regulation and cause diabetes to appear, rather than diabetes alone directly causing the cancer in every case. The researchers themselves, after accounting for this, still concluded the data supports a real, if modest, causal contribution from diabetes itself, not purely a reverse-causation artifact. This honest, two-part finding is exactly why a NEW diabetes diagnosis, especially later in life with no strong family or lifestyle risk factors, is sometimes worth a closer look rather than assumed to be routine T2D, useful, non-alarmist information rather than something to avoid out of caution.",
    citations: [
      { source: 'Type-II diabetes and pancreatic cancer: a meta-analysis of 36 studies, British Journal of Cancer, PMID 15886696', url: 'https://pubmed.ncbi.nlm.nih.gov/15886696/' },
    ],
    overallTier: 'strong',
    relatedIds: ['type2-microvascular-complications-screening', 'type2-remission-ada-consensus-definition'],
  },
  {
    id: 'type2-hippocampal-neurogenesis-insulin-resistance',
    category: 'type2Diabetes',
    title: 'Insulin Resistance Directly Suppresses New-Neuron Growth, and Metformin Appears to Work Against That',
    teaser: "This category's already-covered cognitive-decline research names hippocampal volume loss and impaired memory, real mouse models of T2D found the actual new-neuron-production process itself measurably reduced, with a genuinely hopeful twist involving a medication already in wide use.",
    summary:
      "This category's already-covered cognitive research establishes that T2D tracks with smaller hippocampal volume and real memory impairment, and a specific, real mechanism helps explain why: hippocampal neurogenesis itself, the ongoing production of new neurons in that same brain region, is measurably reduced in real mouse models of type 2 diabetes, both in obesity-driven and non-obesity-driven versions of the disease, meaning this isn't purely a byproduct of excess weight. A separate, real study found the mechanism runs at least partly through the adrenal stress hormone corticosterone (the rodent equivalent of human cortisol), diabetes measurably impaired hippocampal memory function, synaptic plasticity, and new-neuron production together, and elevated glucocorticoid levels contributed directly to these effects. The genuinely hopeful, practical twist: metformin, already one of the most widely prescribed T2D medications and already covered elsewhere in this app's medication research, appears to work in the opposite direction, real research found it activates a specific cellular signaling pathway that promotes neural progenitor cell differentiation and measurably enhances spatial memory formation in mice, a real, concrete example of a medication doing more for the brain than simply lowering blood sugar.",
    citations: [
      { source: 'Deficits in hippocampal neurogenesis in obesity-dependent and -independent type-2 diabetes mellitus mouse models, Scientific Reports, PMID 33004912', url: 'https://pubmed.ncbi.nlm.nih.gov/33004912/' },
      { source: 'Diabetes impairs hippocampal function through glucocorticoid-mediated effects on new and mature neurons, Nature Neuroscience, Stranahan et al. 2008, PMID 18278039', url: 'https://pubmed.ncbi.nlm.nih.gov/18278039/' },
    ],
    overallTier: 'strong',
    relatedIds: ['neurogenesis-tying-together', 'type2-cognitive-liver-real-data'],
  },
  {
    id: 'type2-fermented-drinks',
    category: 'type2Diabetes',
    title: 'Fermented Drinks and Foods for Type 2 Diabetes',
    teaser: 'Beet Kvass earns a double role here: low residual sugar once fully fermented, plus a separately well-documented blood-pressure benefit relevant to Type 2 Diabetes\'s cardiovascular risk overlap.',
    summary: 'This app\'s Beet Kvass and Water Kefir carry the lowest residual sugar once fully fermented, a better choice than Amazake or Sobia, both meaningfully sweeter drinks throughout the ferment given their koji- and coconut-milk-based sweetness. Beet kvass\'s dietary nitrate content has systematic-review-level human trial evidence for lowering blood pressure, relevant given how often Type 2 Diabetes and cardiovascular risk travel together. A wild-fermented tonic\'s sugar content measurably drops the longer it ferments; tasting for tang rather than sweetness before drinking is the practical way to judge how much of a given batch\'s sugar the fermentation has already consumed.',
    citations: [
      { source: 'Dietary Nitrate from Beetroot Juice for Hypertension: A Systematic Review, PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov/30400267/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['recipe-ferment-beet-kvass', 'recipe-ferment-water-kefir', 'recipe-ferment-amazake'],
  },
  // 2026-08-23, added after fact-checking the "How Not to Die" documentary
  // (2025) against the peer-reviewed literature, direct request, second
  // pass for full breadth. The documentary itself is not treated as a
  // citable source; this traces to the primary trial, independently
  // verified via WebSearch.
  {
    id: 'type2-low-fat-vegan-diet-rct',
    category: 'type2Diabetes',
    title: 'A Randomized Trial Tested a Low-Fat Vegan Diet Directly Against Standard ADA Guidance',
    teaser: 'Both diets improved blood sugar control over 22 weeks. The vegan group improved more, though the headline comparison between groups fell just short of standard statistical significance.',
    summary:
      "A randomized clinical trial assigned 99 people with type 2 diabetes to either a low-fat vegan diet or a diet following standard American Diabetes Association guidelines, then measured outcomes at 22 weeks. Both diets worked: A1C (average blood sugar over roughly 3 months) fell in both groups, and body weight dropped further in the vegan group (6.5 kg) than the ADA group (3.1 kg). The direct, honest number: A1C fell by 0.96 points in the vegan group versus 0.56 in the ADA group, a real difference, but one that fell just short of the standard 0.05 significance threshold (p=0.089) when comparing the two groups as originally assigned. A secondary analysis excluding participants who changed their diabetes medications during the trial (which can independently move A1C regardless of diet) found a larger, statistically significant gap, 1.23 points versus 0.38 (p=0.01). Reading both numbers together rather than only the more favorable one, this is trial evidence that a low-fat vegan diet can meaningfully help glycemic control, honestly reported as a result that needed a secondary adjustment to clear significance in its primary comparison, not a clean, uncomplicated win on the first analysis.",
    citations: [
      { source: 'A Low-Fat Vegan Diet Improves Glycemic Control and Cardiovascular Risk Factors in a Randomized Clinical Trial in Individuals With Type 2 Diabetes, Barnard ND et al., Diabetes Care, 2006, PMID 16873779', url: 'https://pubmed.ncbi.nlm.nih.gov/16873779/' },
    ],
    overallTier: 'moderate',
    stageNote: 'A real randomized trial with a real, honestly-reported statistical nuance: the primary between-group comparison did not reach standard significance, only a secondary analysis excluding those who changed medications did.',
    relatedIds: ['pbn-ornish-lifestyle-heart-trial'],
  },

  // Complementary & Manual Therapies, added 2026-09-04. Scoped to painful
  // neuropathy deliberately: that is where the trials are, and the
  // separate claim that acupuncture improves blood glucose control does
  // not hold up at the same strength.
  {
    id: 'complementary-type2-acupuncture-neuropathy',
    category: 'type2Diabetes',
    title: 'Acupuncture for Diabetic Nerve Pain, and What It Does Not Touch',
    teaser:
      'The trials cluster around painful neuropathy, where existing drugs work poorly and are hard to tolerate. Blood sugar control is a separate claim on weaker ground.',
    summary:
      "Painful diabetic peripheral neuropathy is a good reason to look at alternatives, because the standard drugs for it help a minority of people and many stop taking them over drowsiness, dizziness, or swelling. Acupuncture has been studied here more than for anything else in diabetes. A 2023 systematic review and meta-analysis of acupuncture for painful diabetic peripheral neuropathy found benefit on pain, and a larger network meta-analysis pulled together 62 randomized trials covering 5,942 participants across acupuncture-based interventions for this condition. The reviewers are consistent that trial quality is the limiting factor: small samples, single centres, short follow-up, few sham comparisons, and inconsistent reporting of harms. So the fair summary is a reasonable option to try for nerve pain that is not otherwise controlled, on evidence that is suggestive rather than settled. Two boundaries matter more here than usual. Acupuncture is also promoted for blood glucose control in type 2 diabetes, and that claim rests on weaker evidence than the neuropathy one; nothing in this literature justifies reducing medication, and HbA1c is the measure to judge that by. And neuropathy itself changes the safety picture. A foot that cannot feel properly can be injured without the person noticing, so needling and firm massage below the knee need a practitioner who knows about the neuropathy, and any redness, blister, or break in the skin afterward needs looking at quickly rather than waiting.",
    citations: [
      {
        source:
          'Zhou L, et al. 2023: Acupuncture for painful diabetic peripheral neuropathy: a systematic review and meta-analysis (Front Neurol 14:1281485)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/38046594/',
      },
    ],
    overallTier: 'weak',
    relatedIds: [
      'complementary-type1-massage-insulin-absorption',
      'handson-acupuncture-chronic-pain',
      'handson-safety-and-what-to-ask',
      'handson-tracking-whether-it-works',
    ],
  },
];
