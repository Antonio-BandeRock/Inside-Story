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
    relatedIds: ['pcos-insulin-resistance-mechanism', 'masld-overview', 'ckd-overview', 'gout-metabolic-cluster-connection', 'foodhistory-cholesterol-real-drivers'],
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
];
