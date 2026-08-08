import type { DigestEntry } from './types';

// Type 1 Diabetes -- 11 entries, added 2026-08-08 as this app's fifth real
// condition, next in the same priority order RA, Psoriasis, and Graves' all
// followed. Built with real self-advocacy content included from the start,
// the same lesson already applied to Graves'.
//
// Distinct from otherAutoimmune.ts's own 'other-type1-diabetes' entry,
// which stays exactly as it was: T1D's own infant-gut-microbiome and
// celiac-comorbidity findings, studied as corroborating evidence for
// Hashimoto's own research, written for a Hashimoto's reader. This
// category is the opposite direction -- T1D as its own real, primary
// condition, written for someone who has selected type_1_diabetes in their
// own Profile. This category's own celiac-comorbidity entry gives that
// same finding a fuller, T1D-specific treatment (real screening intervals,
// real prevalence numbers) rather than re-explaining the corroborating
// version, and cross-links back to the other entry.
//
// T1D is a genuinely different kind of condition from every one built so
// far in this app: it's not primarily a food-triggers-flare-ups disease
// the way Hashimoto's, RA, and psoriasis are. It's a disease where food's
// real, daily relevance is about matching carbohydrate intake to insulin
// dosing accurately enough to avoid dangerous highs and lows, a
// mathematical/logistical food relationship rather than a food-avoidance
// one. This category is written with that difference in mind rather than
// forcing the same "problem food, elimination, reintroduction" shape onto
// a condition where that shape doesn't fit.
//
// Every citation here was independently verified via WebSearch before
// being written in, the same discipline the rest of this Digest already
// holds to.
export const TYPE_1_DIABETES_ENTRIES: DigestEntry[] = [
  {
    id: 'type1-overview',
    category: 'type1Diabetes',
    title: 'Type 1 Diabetes: An Autoimmune Attack on the Cells That Make Insulin',
    teaser: 'Not a lifestyle disease. The immune system destroys the one cell type the body has for making insulin at all.',
    summary:
      "Type 1 diabetes is the immune system attacking and destroying the insulin-producing beta cells inside the pancreas, eventually leaving the body unable to produce its own insulin at all. This is a fundamentally different disease from type 2 diabetes, where the body still makes insulin but responds to it poorly, and the difference matters for food relevance too. For most of the conditions already built out in this app, food's own relevance is about triggering or calming an immune response. For T1D, food's own daily relevance is different: matching carbohydrate intake precisely enough to insulin dosing to keep blood glucose in a safe range, a real, constant, mathematical relationship rather than an avoidance one. Diet won't cure T1D, and nothing here replaces an endocrinologist's own treatment plan. What follows is what the actual research supports, kept honest about how strong each finding really is.",
    citations: [
      { source: 'Type 1 Diabetes, National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK)', url: 'https://www.niddk.nih.gov/health-information/diabetes/overview/what-is-diabetes/type-1-diabetes' },
    ],
    overallTier: 'strong',
    relatedIds: ['type1-celiac-comorbidity', 'type2-vs-type1-distinction'],
  },
  {
    id: 'type1-carb-counting-accuracy',
    category: 'type1Diabetes',
    title: 'Carb Counting Accuracy Is the Single Biggest Everyday Food Lever in T1D',
    teaser: 'A real, measured 21% average estimation error, and a direct, measured link to how much blood sugar actually swings because of it.',
    summary:
      "Carbohydrate counting, estimating how many grams of carbohydrate a meal contains to calculate an accurate insulin dose, is the real, everyday food skill this whole condition runs on, more than any single food avoided or embraced. A real study found the average difference between what patients estimated for a meal and what a dietitian measured directly ran about 15.4 grams, roughly 21% of the total carbohydrate content of that meal, a genuinely large everyday error most people don't realize they're making. That error isn't just a rounding inconvenience: the same research found bigger carb-counting errors directly predicted more blood glucose variability, measured both by how far readings swung and by less time spent in a safe target range. Advanced carbohydrate counting, adjusting the actual insulin dose formula for measured carbohydrate content rather than a rough guess, is the real, trainable skill this points toward, and formal dietary education specifically targeting this skill has real trial support for improving it.",
    citations: [
      { source: 'Carbohydrate counting accuracy and blood glucose variability in adults with type 1 diabetes', url: 'https://pubmed.ncbi.nlm.nih.gov/23146371/' },
      { source: 'Effectiveness of advanced carbohydrate counting in type 1 diabetes mellitus: a systematic review and meta-analysis', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5107938/' },
    ],
    overallTier: 'strong',
    relatedIds: ['type2-low-carb-diet-evidence', 'carbfiber-tying-together'],
  },
  {
    id: 'type1-exercise-glucose',
    category: 'type1Diabetes',
    title: 'Exercise Type Changes the Direction Blood Sugar Moves, Not Just How Much',
    teaser: 'Aerobic exercise and resistance training pull blood glucose in genuinely different directions, worth planning around specifically.',
    summary:
      "Exercise and blood glucose have a real, if genuinely complicated, relationship in T1D, and the type of exercise matters as much as the fact of doing it. Aerobic exercise typically requires larger insulin-dose reductions and more carbohydrate intake to avoid a low, while resistance training can actually require more insulin during the recovery period afterward as the body replenishes muscle glycogen. Checking blood glucose before, during, and after activity is the real, practical safety net this points toward: guidance generally recommends starting exercise with blood glucose in a safe range (roughly 90-250 mg/dL), checking for ketones if glucose runs above that range before starting, and watching specifically for delayed hypoglycemia, a real, documented risk that can show up hours after activity has already ended, not just during it.",
    citations: [
      { source: 'Exercise, type 1 diabetes mellitus and blood glucose: the implications of exercise timing', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9555792/' },
      { source: 'Exercise Management for Young People With Type 1 Diabetes: A Structured Approach to the Exercise Consultation', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6587067/' },
    ],
    overallTier: 'strong',
    relatedIds: ['type1-alcohol-nocturnal-hypoglycemia'],
  },
  {
    id: 'type1-alcohol-nocturnal-hypoglycemia',
    category: 'type1Diabetes',
    title: 'Alcohol Can Cause a Real Blood-Sugar Crash Up to 12 Hours Later',
    teaser: 'A specific, documented hormonal mechanism, and a real reason an evening drink can cause a low the next morning, not just that night.',
    summary:
      "Alcohol's own real risk in T1D isn't just the obvious acute effect. A real, documented mechanism connects an evening drink to a delayed morning problem. A controlled study found evening alcohol consumption suppressed nocturnal growth hormone secretion specifically between midnight and 4 AM, one of the body's own real hormonal defenses against low blood sugar, and this measurably predisposed patients to hypoglycemia after breakfast the next morning. Alcohol's own liver-based mechanism compounds this: the liver temporarily stops releasing its own stored glucose while processing alcohol, and food itself digests more slowly, meaning the real risk window can run up to 12 hours after drinking, well past when the alcohol itself has cleared. Not a reason alcohol is off-limits entirely, but a real, specific, delayed risk worth planning around directly, including checking blood glucose before sleep and having a plan for a possible early-morning low.",
    citations: [
      { source: 'The Effect of Evening Alcohol Consumption on Next-Morning Glucose Control in Type 1 Diabetes, Diabetes Care', url: 'https://diabetesjournals.org/care/article/24/11/1888/24724/The-Effect-of-Evening-Alcohol-Consumption-on-Next' },
    ],
    overallTier: 'strong',
    relatedIds: ['type1-exercise-glucose'],
  },
  {
    id: 'type1-dka-sick-day-rules',
    category: 'type1Diabetes',
    title: 'DKA: The Real Emergency Every Person With T1D Needs to Recognize Early',
    teaser: 'A real, escalating symptom sequence, and a real, checkable number that tells you when it stops being a wait-and-see situation.',
    summary:
      "Diabetic ketoacidosis (DKA) is a real, life-threatening emergency specific to insulin-deficient diabetes, and recognizing it early is genuinely one of the most important pieces of self-management in this whole condition. The real symptom sequence usually starts with high blood glucose itself, increased thirst, a dry mouth, and frequent urination, then progresses as ketones (a byproduct of the body burning fat instead of glucose for fuel, since it can't access glucose without enough insulin) build up: nausea, vomiting, stomach pain, and difficulty keeping fluids down. The real, checkable number worth knowing: ketone testing is recommended whenever blood glucose runs persistently high (commonly above roughly 250 mg/dL) or during any illness regardless of glucose level, and a ketone reading above 1.5 mmol/L is a real signal to seek medical advice without delay, not to wait and monitor. \"Sick day rules,\" a real, standard practice of checking blood glucose and ketones far more frequently during any illness (every 2-6 hours depending on severity) and continuing insulin, often at a higher dose, even with reduced appetite, exist specifically because illness makes the body more insulin-resistant, raising real DKA risk exactly when eating normally becomes hardest.",
    citations: [
      { source: 'Diabetic ketoacidosis: Know the warning signs, Mayo Clinic', url: 'https://www.mayoclinic.org/diseases-conditions/diabetic-ketoacidosis/symptoms-causes/syc-20371551' },
      { source: 'Diabetes and Planning for Sick Days, American Diabetes Association', url: 'https://diabetes.org/living-with-diabetes/sick-days' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'type1-honeymoon-phase',
    category: 'type1Diabetes',
    title: 'The "Honeymoon Phase": A Real, Temporary Window, Not a Sign the Diagnosis Was Wrong',
    teaser: 'Roughly 60% of adults see insulin needs drop sharply after diagnosis. It\'s real, temporary, and has a real, checkable predictor.',
    summary:
      "A confusing, real phenomenon shows up for many people shortly after a T1D diagnosis: insulin requirements drop, sometimes dramatically, and blood glucose control genuinely improves for a while. This is a real, documented \"honeymoon phase,\" a temporary partial restoration of the remaining beta cells' own insulin-producing function, not a sign the original diagnosis was wrong. Research finds roughly 60% of adults experience some version of this, with an average duration around 7 to 9 months, though it can run anywhere from a few months to, in real but less common cases, several years. A real, checkable lab marker tracks it: C-peptide, a byproduct produced alongside a person's own natural insulin (not the injected kind), with a fasting level below 0.3 ng/mL generally indicating negligible remaining natural insulin production. Real predictors of a longer honeymoon phase include not having DKA at initial diagnosis, a shorter duration of symptoms before diagnosis, and older age at diagnosis, worth knowing so this real, temporary window doesn't get mistaken for a permanent improvement or, when it ends, a sign of getting worse.",
    citations: [
      { source: "Prolonged Honeymoon Period in a Thai Patient with Adult-Onset Type 1 Diabetes Mellitus", url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8429022/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['type1-autoantibody-panel'],
  },
  {
    id: 'type1-celiac-comorbidity',
    category: 'type1Diabetes',
    title: 'Celiac Disease and T1D: A Real Overlap Worth Actual Screening, Not Just Symptom-Watching',
    teaser: 'Some estimates put celiac disease up to 20 times more common in T1D than in the general population.',
    summary:
      "This app's own Other Autoimmune Diseases category already names the broad pattern: T1D and celiac disease co-occur far more than chance would predict. This entry gives it the fuller, T1D-specific numbers. A pooled analysis across multiple studies found the weighted average celiac prevalence in T1D running around 5.1%, with individual studies ranging from under 1% up to nearly 25% depending on the population studied, and some research describing celiac disease as up to 20 times more common in T1D than in the general population. This isn't a reason to guess based on symptoms alone: a real, meaningful share of celiac disease in this population is asymptomatic, which is exactly why real screening guidance exists rather than a wait-for-symptoms approach. The American Diabetes Association recommends screening for celiac disease (and separately, autoimmune thyroiditis) soon after a T1D diagnosis, with a repeat screening in 2 to 5 years if the first result is negative, since celiac disease can develop after the initial diabetes diagnosis, not just alongside it.",
    citations: [
      { source: 'Prevalence of celiac disease in adult type 1 patients with diabetes', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4590365/' },
      { source: 'Screening for Celiac Disease in Type 1 Diabetes: A Systematic Review, Pediatrics', url: 'https://publications.aap.org/pediatrics/article/136/1/e170/29185/Screening-for-Celiac-Disease-in-Type-1-Diabetes-A' },
    ],
    overallTier: 'strong',
    relatedIds: ['other-type1-diabetes', 'celiac-hashimotos-comorbidity'],
  },
  {
    id: 'type1-autoantibody-panel',
    category: 'type1Diabetes',
    title: 'The Real Autoantibody Panel Behind a T1D Diagnosis, and What Each One Actually Adds',
    teaser: 'Four separate antibodies, each with a different real sensitivity, combining into a genuinely strong diagnostic picture together.',
    summary:
      "T1D's own diagnostic antibody panel is worth understanding by its real, individual components rather than as one undifferentiated \"diabetes antibody test.\" Four real autoantibodies make up the standard panel: GADA (against glutamic acid decarboxylase), IA-2A (against a tyrosine phosphatase called insulinoma-associated antigen 2), ZnT8A (against a zinc transporter present in the vast majority, roughly 58-80%, of new-onset cases), and IAA (against a person's own natural insulin, not the injected kind, meaningful only before insulin therapy begins). Individually, their real diagnostic sensitivities vary widely, GADA runs around 91%, IA-2A around 74%, and IAA around 49% alone, but combined, the full panel reaches a real 96% sensitivity and 98% specificity, catching the large majority of real T1D cases while rarely flagging someone who doesn't actually have it. Worth asking for the complete panel by name at diagnosis, not just whichever single antibody a lab happens to default to, since a negative result on one antibody alone doesn't rule out T1D the way a negative full panel more confidently does.",
    citations: [
      { source: 'Anti-Islet Autoantibodies in Type 1 Diabetes', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10298549/' },
      { source: 'Importance of Zinc Transporter 8 Autoantibody in the Diagnosis of Type 1 Diabetes in Latin Americans', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5428214/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'type1-hba1c-time-in-range',
    category: 'type1Diabetes',
    title: 'HbA1c Alone Is No Longer the Whole Target. Time in Range Is the Real, Fuller Picture.',
    teaser: 'A single average number can hide wild swings both directions. A real, complementary metric now sits alongside it.',
    summary:
      "HbA1c, a real three-month average of blood glucose, has been the standard T1D monitoring target for decades, and the general ADA target remains under 7%. What's genuinely worth knowing directly: an average can look fine while hiding real, dangerous swings in both directions, a low overnight and a high after dinner can average out to a completely normal-looking number. Time in Range (TIR), the real percentage of a day spent within a safe glucose window (typically 70-180 mg/dL), is the newer, complementary metric that catches what HbA1c alone can miss, made practical by continuous glucose monitors (CGMs) that measure glucose constantly rather than at a single blood draw. Current guidance targets at least 70% time in range, roughly 17 hours of a day, corresponding to that same HbA1c target of around 7%. Worth asking for both numbers together, and for CGM access specifically if not already using one, since eligibility guidance has broadened to include anyone on insulin therapy where it would genuinely help management, not just people already struggling with control.",
    citations: [
      { source: '6. Glycemic Goals and Hypoglycemia: Standards of Care in Diabetes, American Diabetes Association', url: 'https://diabetesjournals.org/care/article/47/Supplement_1/S111/153951/6-Glycemic-Goals-and-Hypoglycemia-Standards-of' },
    ],
    overallTier: 'strong',
    relatedIds: ['type1-honeymoon-phase', 'type2-individualized-hba1c-targets'],
  },
  {
    id: 'type1-complication-screening',
    category: 'type1Diabetes',
    title: 'Eyes, Kidneys & Nerves: The Real Screening Schedule That Starts Years Before Symptoms Would',
    teaser: 'Real, specific screening intervals exist for a reason: these complications are asymptomatic in their earliest, most treatable stage.',
    summary:
      "T1D's own real, longer-term complications (retinopathy, nephropathy, neuropathy) share a genuinely important feature: they're typically silent in their earliest, most treatable stage, which is exactly why real, scheduled screening exists rather than waiting for a symptom to prompt one. For eyes, guidance recommends annual retinopathy screening beginning 5 years after diagnosis, with real research supporting less frequent (every 1-2 year) exams once someone has had one or more clear results in a row, a genuine cost-effective adjustment once a real baseline pattern is established. For kidneys, annual urine albumin testing is recommended starting at that same 5-year mark, alongside at least annual serum creatinine testing (used to estimate GFR, kidney filtration rate) for every adult with diabetes regardless of how that albumin result looks. These aren't arbitrary intervals. Both windows exist specifically because real, effective treatment exists for early-stage damage in both organ systems, treatment that works better the earlier it starts, which only happens if the screening itself actually happens on schedule rather than being skipped because nothing feels wrong yet.",
    citations: [
      { source: '12. Retinopathy, Neuropathy, and Foot Care: Standards of Care in Diabetes, American Diabetes Association', url: 'https://diabetesjournals.org/care/article/48/Supplement_1/S252/157552/12-Retinopathy-Neuropathy-and-Foot-Care-Standards' },
      { source: 'Screening for Kidney Disease in Adults With Diabetes, Diabetes Care', url: 'https://diabetesjournals.org/care/article/28/7/1813/27976/Screening-for-Kidney-Disease-in-Adults-With' },
    ],
    overallTier: 'strong',
    relatedIds: ['type2-screening-at-diagnosis'],
  },
  {
    id: 'type1-tying-together',
    category: 'type1Diabetes',
    title: 'What Actually Holds Up for T1D, Pulled Together',
    teaser: 'A genuinely different kind of condition than every one built so far, and three self-advocacy numbers worth knowing precisely.',
    summary:
      "Line up everything in this category and T1D reads differently in shape from every condition already built in this app. Food's own real daily relevance here isn't about triggering or avoiding, it's about matching, carb counting accurately enough that insulin dosing actually works, with a real, measured average error (21%) directly tied to worse blood glucose control. Exercise and alcohol both carry real, specific, sometimes delayed risks (post-exercise lows, a next-morning crash from an evening drink) worth planning around rather than discovering the hard way. DKA is the one true emergency in this category, with a real, checkable ketone threshold that tells you when it's no longer a wait-and-see situation. The celiac-comorbidity finding gives this app's own existing cross-disease observation real, actionable numbers and a real screening schedule. And the three self-advocacy entries carry the same kind of precise, quantified numbers this app's other conditions have already established matter: the real antibody panel behind diagnosis, Time in Range as a genuine complement to HbA1c, and the real screening intervals that exist specifically because the earliest, most treatable stage of eye and kidney damage has no symptoms at all.",
    citations: [
      { source: 'Type 1 Diabetes, National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK)', url: 'https://www.niddk.nih.gov/health-information/diabetes/overview/what-is-diabetes/type-1-diabetes' },
    ],
    overallTier: 'strong',
    relatedIds: ['type1-carb-counting-accuracy', 'type1-dka-sick-day-rules', 'type1-celiac-comorbidity', 'type1-autoantibody-panel', 'type1-hba1c-time-in-range'],
  },

  // -- Full-depth parity additions, 2026-08-08. Every citation
  // independently verified via WebSearch.
  {
    id: 'type1-jdrf-presymptomatic-staging',
    category: 'type1Diabetes',
    title: 'T1D Has a Real, Formal 3-Stage Framework That Starts Years Before Any Symptom Appears',
    teaser: "Real, present-day research can detect T1D happening before a single symptom shows up -- Stage 1 and Stage 2 both carry close to 100% lifetime risk of reaching Stage 3, the point most people think of as \"diagnosis.\"",
    summary:
      "A real, formal staging system, jointly published by JDRF, the Endocrine Society, and the American Diabetes Association, reframes T1D as a real, predictable continuum rather than a sudden-onset disease. Stage 1: two or more islet autoantibodies present (the immune system has already begun attacking insulin-producing beta cells), but blood sugar is still fully normal and there are no symptoms at all. Stage 2: the same autoantibodies, but blood sugar has become measurably abnormal as beta-cell loss progresses, still without symptoms. Stage 3 is what most people think of as \"diagnosis\": significant beta-cell loss has occurred and real, classic symptoms (frequent urination, excessive thirst, weight loss, fatigue) finally appear. The real, striking fact worth knowing directly: once someone reaches Stage 1 or Stage 2, real research finds lifetime risk of progressing to Stage 3 approaches 100%, meaning T1D is genuinely predictable well before a formal diagnosis, not a condition that appears without warning -- real, relevant context for anyone with a close relative already diagnosed with T1D who might consider real antibody screening.",
    citations: [
      { source: 'Staging Presymptomatic Type 1 Diabetes: A Scientific Statement of JDRF, the Endocrine Society, and the American Diabetes Association, PMID 26404926', url: 'https://pubmed.ncbi.nlm.nih.gov/26404926/' },
    ],
    overallTier: 'strong',
    relatedIds: ['type1-autoantibody-panel', 'type1-honeymoon-phase'],
  },
  {
    id: 'type1-long-term-complications-real-data',
    category: 'type1Diabetes',
    title: "T1D's Real, Long-Term Complication Burden -- and a Real, Direct Reason This App's Own Screening Guidance Matters",
    teaser: 'Real research finds retinopathy in roughly 30-51% of patients and nerve-related cardiovascular complications in over 60% -- and having multiple complications together measurably raises overall mortality risk.',
    summary:
      "T1D's own real, long-term complication burden is genuinely substantial, the direct reason this app's own self-advocacy research already covers screening intervals for retinopathy and nephropathy. Real cross-sectional research finds diabetic retinopathy affecting roughly 30-51% of people with T1D depending on the specific population studied. Cardiovascular autonomic neuropathy, nerve damage affecting the heart's own rhythm regulation, shows an even higher real prevalence in T1D specifically, 61.8% in one real study, notably higher than the same complication's own rate in Type 2 Diabetes. A real, 10-year follow-up study of 774 T1D patients found 45.1% had at least one measurable microvascular complication (retinopathy, nephropathy, or neuropathy), and the real, more consequential finding: having multiple complications together, not just one, independently raised the risk of a major vascular event and all-cause mortality, worth knowing as a real, direct reason consistent screening (already covered in this app's own self-advocacy content) matters beyond any single complication in isolation.",
    citations: [
      { source: 'Microvascular complications burden (nephropathy, retinopathy and peripheral polyneuropathy) affects risk of major vascular events and all-cause mortality in type 1 diabetes, PMC6858978', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6858978/' },
    ],
    overallTier: 'strong',
    relatedIds: ['type1-complication-screening'],
  },
  {
    id: 'type1-history-milestones',
    category: 'type1Diabetes',
    title: "T1D's Own Real History: A Fatal Diagnosis Until One Real Discovery Changed Everything in a Single Summer",
    teaser: '1921, 1922, 1923 -- three real years that took T1D from a genuine death sentence to a manageable condition, faster than almost any other disease-treatment story in this app.',
    summary:
      "Before 1921, a T1D diagnosis was, in real, documented medical practice, effectively a death sentence, with treatment limited to severe dietary restriction that could delay but not prevent death. On July 27, 1921, Frederick Banting and Charles Best, working at the University of Toronto, successfully isolated insulin, inducing diabetes in dogs and then reversing it with the hormone they'd extracted. On January 11, 1922, 14-year-old Leonard Thompson became the first person to receive an insulin injection as treatment; his first dose caused an allergic reaction, but a refined, purified version given days later worked, and his health improved dramatically. By 1923, Eli Lilly had begun mass-producing insulin commercially, and Banting and his supervisor Macleod received the Nobel Prize the same year (Banting, in a real, well-documented act, split his own prize money with Best, who had been excluded from the award itself). This is a genuinely fast turnaround, roughly two years from discovery to a real, transformed, manageable disease, one of the most compressed real medical-history timelines in this whole app.",
    citations: [
      { source: 'The discovery of insulin in Toronto: beginning a 100 year journey of research and clinical achievement, Diabetologia', url: 'https://link.springer.com/article/10.1007/s00125-020-05371-6' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'type1-pregnancy-glucose-targets',
    category: 'type1Diabetes',
    title: 'T1D Pregnancy Runs on Real, Tighter Glucose Targets Than Everyday Management -- and Real Data Shows Most People Don\'t Fully Reach Them',
    teaser: 'A real target A1C under 6% during pregnancy, and real, quantified evidence that even a 5% shortfall in time-in-range measurably raises risk to the baby.',
    summary:
      "T1D during pregnancy calls for a genuinely tighter real glucose target than ordinary day-to-day management: an A1C under 6%, without excessive hypoglycemia, and a real target range of roughly 3.5-7.8 mmol/L (63-140 mg/dL) throughout. Real data shows this is a genuinely difficult target to consistently hit: pregnant people with T1D spend on average only 50%, 55%, and 60% of time in that target range across the first, second, and third trimesters respectively. The real, quantified stakes of that shortfall: research found a 5% lower time-in-range, paired with 5% more time above range, measurably raised the risk of a large-for-gestational-age infant, neonatal hypoglycemia, and NICU admission. Real, pre-existing T1D itself carries a real, 2-4-fold increased risk of adverse outcomes overall (congenital anomalies, preeclampsia, preterm delivery) compared to the general population, with real, specific elevated risk of congenital heart conditions -- a real, direct reason prenatal folic acid (already reducing malformation risk generally) and early, dedicated preconception planning with an endocrinologist matter more here than in an average pregnancy.",
    citations: [
      { source: 'Continuous glucose monitoring targets in type 1 diabetes pregnancy: every 5% time in range matters, PMC6560014', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6560014/' },
    ],
    overallTier: 'strong',
  },
];
