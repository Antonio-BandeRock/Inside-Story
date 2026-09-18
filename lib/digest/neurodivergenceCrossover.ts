// Where autism, ADHD and dyslexia cross into the 19 tracked conditions.
//
// 2026-09-17, direct instruction, the fourth part of it: "if any of them
// cross over into the tracked conditions, there should be entries made
// specifically."
//
// So this file is the "specifically" half. The general writing about
// autism, ADHD and dyslexia lives in lib/digest/neurodivergence.ts under
// Basic Health, where anybody can read it without tracking anything. What
// lives HERE is one entry filed inside a tracked condition's category,
// written for somebody who already has that condition and wants to know
// what, if anything, it has to do with these three.
//
// WHY ONE FILE AND NOT SIXTEEN. Every other per-condition module in this
// folder holds one condition. These sixteen entries are one subject seen
// from sixteen angles, and keeping them together is the only way to keep
// the tone and the honesty consistent across them. lib/digest/appHelps.ts
// already set that precedent with its 19 per-condition entries in one
// file. Each entry still carries its own condition `category`, so the
// Digest files them exactly where a per-condition module would have.
//
// HOW THEY FILE THEMSELVES. Two id shapes, both deliberate:
//   *-pregnan* ... lands in Pregnancy & Family Planning, because
//       purple-digest.tsx's classifier already routes any id containing
//       "pregnan" there. No classifier change needed for these seven.
//   *-crossover ... lands in Whole-Body Effects, via one added id check in
//       classifyConditionTopic. The suffix was chosen over the more
//       obvious "-adhd-" or "-autism-" marker because those would have
//       swept up the existing celiac-adhd-symptoms-mixed-evidence entry
//       and moved it out of Diet & Food, where it belongs.
//
// WHAT THIS FILE REFUSES TO DO. Three lines held in every entry below:
//   1. No claim that food or diet treats autism or ADHD. Where eating
//      enters, it enters as something the condition's management asks
//      for and that these traits make harder to keep up, never as therapy.
//   2. No maternal blame. Seven of these are about a parent's condition
//      and a child's development, which is the easiest content in this
//      whole Digest to write badly. Every one of them states the absolute
//      numbers next to the relative ones, names the treated-versus-
//      untreated split where a study found one, and says plainly that
//      nothing here explains any individual child.
//   3. No promoting an association to a cause. Several of these come from
//      health registers, which cannot separate a shared cause from a
//      causal one, and two of them (type 2 diabetes, PCOS) carry a
//      sibling or cousin comparison built to test exactly that. Both
//      halves get reported, including when the second half weakens the
//      first.
//
// AND ONE ENTRY IS A NULL. Multiple sclerosis is here because the question
// was asked and answered negatively. Leaving it out would have let anyone
// with MS read the silence as nobody having looked.
import type { DigestEntry } from './types';

export const NEURODIVERGENCE_CROSSOVER_ENTRIES: DigestEntry[] = [
  // ---------------------------------------------------------------
  // Pregnancy & Family Planning: a parent's condition, a child's
  // development. Seven entries, all routed by the "pregnan" in the id.
  // ---------------------------------------------------------------
  {
    id: 'pregnancy-thyroid-offspring-neurodevelopment',
    category: 'hashimotos',
    title: "Thyroid Levels in Pregnancy and the Child's Development",
    teaser:
      'Untreated or unsteady hypothyroidism in pregnancy carries a modestly higher chance of ADHD or autism in the child. Adequately treated, the autism signal did not hold.',
    summary:
      "A meta-analysis pooling 29 articles found maternal hypothyroidism associated with offspring ADHD at an odds ratio of 1.14 (1.03 to 1.26) and with an autism spectrum diagnosis at 1.41 (1.05 to 1.90). A large population cohort pointed the same way, at adjusted hazard ratios of 1.28 (1.19 to 1.37) for ADHD and 1.34 (1.19 to 1.51) for autism. Attach the baseline before reading those as alarming: they are small proportional increases on outcomes that affect a few percent of children, so most children of mothers with thyroid disease have neither. A later study split treated from untreated. Adequately treated chronic hypothyroidism was not significantly associated with offspring autism; thyroid levels that stayed out of range across trimesters were. That fits what is already known about the mechanism, since a fetus makes no thyroid hormone in the first trimester and runs entirely on what crosses from the mother, which is why timing and steadiness matter more than what the diagnosis is called. Test early, dose to the trimester target, and retest rather than assume. Nothing here explains any individual child, and nothing here is a reason to avoid having one.",
    citations: [
      {
        source: 'Meta-analysis of 29 articles, maternal thyroid dysfunction and offspring neurodevelopment',
        url: 'https://pubmed.ncbi.nlm.nih.gov/32810262/',
      },
      {
        source: 'Population cohort, maternal hypothyroidism and offspring ADHD and autism, Eur Child Adolesc Psychiatry 2025',
        url: 'https://link.springer.com/article/10.1007/s00787-025-02871-x',
      },
      {
        source: 'Treated versus persistently abnormal maternal hypothyroidism and offspring autism',
        url: 'https://pubmed.ncbi.nlm.nih.gov/41288361/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: [
      'pregnancy-tsh-target',
      'pregnancy-iodine-needs',
      'neuro-maternal-autoimmune-and-neurodevelopment',
      'neuro-crossover-with-tracked-conditions',
    ],
  },
  {
    id: 'graves-pregnancy-offspring-neurodevelopment',
    category: 'graves',
    title: "Hyperthyroidism in Pregnancy and the Child's Development",
    teaser:
      'The same pooled analysis that looked at an underactive thyroid in pregnancy looked at an overactive one, and found a similar small rise in offspring ADHD and epilepsy.',
    summary:
      "Across 29 pooled articles, maternal hyperthyroidism was associated with offspring ADHD at an odds ratio of 1.18 (1.04 to 1.34) and with epilepsy at 1.19 (1.08 to 1.31). The autism signal in that analysis was clearer on the underactive side than the overactive one. An 18 percent proportional increase on an outcome a few percent of children receive is a small shift in an already small chance. The proposed mechanism is the same as for hypothyroidism, thyroid hormone steering brain development before the fetus makes any, with the added complication particular to Graves' that both hormone levels and TRAb antibodies cross the placenta, and the antibodies can act on the fetal thyroid independently of how the mother feels. This category already asks for the same thing: hold levels in the trimester-appropriate range on the lowest antithyroid dose that does it, and monitor TRAb. Treatment being unstable is the part anybody can act on, and the diagnosis itself is not.",
    citations: [
      {
        source: 'Meta-analysis of 29 articles, maternal thyroid dysfunction and offspring neurodevelopment',
        url: 'https://pubmed.ncbi.nlm.nih.gov/32810262/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: [
      'graves-pregnancy-trimester-drug-choice',
      'graves-pregnancy-fetal-thyrotoxicosis',
      'neuro-maternal-autoimmune-and-neurodevelopment',
      'neuro-crossover-with-tracked-conditions',
    ],
  },
  {
    id: 'pcos-pregnancy-offspring-adhd',
    category: 'pcos',
    title: 'PCOS and ADHD in the Children of Mothers Who Have It',
    teaser:
      'Across 19 studies and more than two million children, maternal PCOS was associated with roughly 40 percent higher odds of an offspring ADHD diagnosis. A cousin comparison then tested whether family background explained it.',
    summary:
      "Dubey and colleagues pooled 19 studies covering 1,667,851 mothers and 2,260,622 children and found offspring ADHD at an odds ratio of 1.42 (1.27 to 1.57). The obvious objection is that ADHD runs in families and so does PCOS, so an association across generations could be family resemblance rather than anything happening during the pregnancy. A Swedish study built to test that compared 21,280 children exposed to maternal PCOS against 200,816 unexposed children in the population and against 17,295 unexposed cousins, on the logic that cousins share a good deal of background that unrelated children do not. Part of the association survived the cousin comparison and part of it did not: shared familial factors account for some of it, and something else accounts for the rest, with prenatal androgen exposure the mechanism most often proposed and not yet demonstrated. Two things this does not support. It is not a reason to treat a PCOS diagnosis as a forecast about a child. And it offers no support at all for the idea that managing PCOS through food changes a child's neurodevelopment, which is a claim nobody has tested and that this app will not imply.",
    citations: [
      {
        source: 'Dubey et al. 2021 Translational Psychiatry, 19 studies, maternal PCOS and offspring neurodevelopment',
        url: 'https://www.nature.com/articles/s41398-021-01699-8',
      },
      {
        source: 'Cesta et al. 2020 Psychological Medicine, cousin comparison of maternal PCOS and offspring ADHD',
        url: 'https://pubmed.ncbi.nlm.nih.gov/30857571/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: [
      'pcos-pregnancy-real-complications-letrozole',
      'neuro-maternal-autoimmune-and-neurodevelopment',
      'neuro-crossover-with-tracked-conditions',
    ],
  },
  {
    id: 'ra-pregnancy-offspring-neurodevelopment',
    category: 'rheumatoidArthritis',
    title: "Rheumatoid Arthritis in a Parent and the Child's Development",
    teaser:
      'Maternal RA diagnosed before delivery was linked to a higher chance of offspring autism. Maternal RA diagnosed after delivery was not. That contrast carries most of the information.',
    summary:
      "A study in Molecular Autism found maternal rheumatoid arthritis diagnosed before delivery associated with offspring autism at an odds ratio of 1.57 (1.31 to 1.87), and found no such association when the mother's RA was diagnosed after the birth. Inherited risk does not know when a diagnosis was written into a chart, so a difference that tracks the timing points at something happening during the pregnancy, most plausibly maternal inflammation or antibodies reaching the fetus, rather than at shared genetics alone. Separately, parental RA was associated with offspring ADHD at an odds ratio of 1.34 (1.17 to 1.54) in a 2022 analysis covering both parents. Both are modest increases on small baseline rates, and neither identifies anything about an individual family. What makes this worth including rather than leaving out is that it lands on something already being managed. RA activity in pregnancy is planned around and monitored here anyway, and disease activity being controlled is the only part of this picture anybody can influence. There is no dietary claim attached to it, and no version of this finding that should change a decision about having children.",
    citations: [
      {
        source: 'Molecular Autism, maternal RA diagnosis timing and offspring autism',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12679756/',
      },
      {
        source: 'Scientific Reports 2022, parental rheumatoid arthritis and offspring ADHD',
        url: 'https://www.nature.com/articles/s41598-022-08834-5',
      },
    ],
    overallTier: 'moderate',
    relatedIds: [
      'ra-pregnancy-family-planning',
      'neuro-maternal-autoimmune-and-neurodevelopment',
      'neuro-familial-autoimmune-adhd',
    ],
  },
  {
    id: 'lupus-pregnancy-offspring-neurodevelopment',
    category: 'lupus',
    title: "Lupus in Pregnancy and the Child's Development",
    teaser:
      'Autism was diagnosed in about 1.4 percent of children born to mothers with lupus against 0.6 percent of comparison children. Both figures are small and the confidence interval is wide.',
    summary:
      "Vinet and colleagues found autism spectrum diagnoses in 1.4 percent (0.8 to 2.5) of children born to women with systemic lupus erythematosus against 0.6 percent (0.5 to 0.8) of matched comparison children, an odds ratio of 2.19 (1.09 to 4.39). An interval running from 1.09 to 4.39 is the study saying it found something and cannot say how large, and the absolute figures are the ones to hold onto: roughly 98.6 out of every 100 children in the exposed group did not receive that diagnosis. Separately, maternal lupus was associated with offspring ADHD at a hazard ratio of 1.53 (1.09 to 2.15), and the authors reported the increase appearing to trace to medication exposure in utero rather than to the disease. That detail deserves care rather than alarm, because medication in a lupus pregnancy is chosen with a doctor against a documented risk of flare, and stopping it carries consequences for both people. Nothing here changes what this category already recommends: plan for a quiet stretch of disease where that is possible, keep hydroxychloroquine going unless told otherwise, and monitor. Food does not enter this finding in either direction.",
    citations: [
      {
        source: 'Vinet et al. 2015 Arthritis & Rheumatology, offspring autism in mothers with SLE',
        url: 'https://acrjournals.onlinelibrary.wiley.com/doi/abs/10.1002/art.39320',
      },
      {
        source: 'Maternal systemic lupus erythematosus and offspring ADHD',
        url: 'https://pubmed.ncbi.nlm.nih.gov/24969080/',
      },
    ],
    overallTier: 'weak',
    relatedIds: [
      'lupus-pregnancy-real-flare-neonatal',
      'neuro-maternal-autoimmune-and-neurodevelopment',
      'neuro-crossover-with-tracked-conditions',
    ],
  },
  {
    id: 'sjogrens-pregnancy-offspring-neurodevelopment',
    category: 'sjogrens',
    title: "Sjögren's, Anti-Ro Antibodies and the Child's Development",
    teaser:
      'The antibody already watched in a Sjögren’s pregnancy because of congenital heart block has also been followed into later childhood, with one small study finding differences in about one child in six.',
    summary:
      "A nationwide population-based cohort found maternal Sjögren's syndrome associated with an elevated chance of an offspring autism spectrum diagnosis. Alongside it, Skog and colleagues followed children born to anti-Ro/SSA-positive mothers and reported impaired neurodevelopment in 16 percent of them: speech difficulties in 9 percent, motor difficulties in 8 percent, learning difficulties in 8 percent, plus attention deficits. That study is small with a limited comparison group, so 16 percent is a figure to follow up rather than a figure to plan around, and this entry is tiered weak for that reason. What makes it belong in this category specifically is that anti-Ro/SSA status is already the thing under watch in a Sjögren's pregnancy, because the same antibody is what prompts fetal heart monitoring for congenital heart block. So this is not a new test to ask for; it is a second reason to pay attention to a result already in hand. The practical version is undramatic: raise development at the ordinary childhood checks the way any parent would, ask early rather than waiting to be sure, and do not read a hard first year as a verdict on anything.",
    citations: [
      {
        source: "Nationwide population-based cohort, maternal Sjögren's syndrome and offspring autism",
        url: 'https://pubmed.ncbi.nlm.nih.gov/38025447/',
      },
      {
        source: 'Skog et al. 2013 Acta Paediatrica, neurodevelopment in children of anti-Ro/SSA-positive mothers',
        url: 'https://onlinelibrary.wiley.com/doi/10.1111/apa.12049',
      },
    ],
    overallTier: 'weak',
    relatedIds: [
      'sjogrens-pregnancy-congenital-heart-block',
      'neuro-maternal-autoimmune-and-neurodevelopment',
      'neuro-crossover-with-tracked-conditions',
    ],
  },
  {
    id: 'ms-pregnancy-offspring-neurodevelopment',
    category: 'multipleSclerosis',
    title: 'Multiple Sclerosis in Pregnancy: a Question That Came Back Negative',
    teaser:
      'Asked whether children of mothers with MS have more neurodevelopmental diagnoses, the study that looked concluded they do not. A negative answer is still an answer worth publishing.',
    summary:
      "Carta and colleagues examined whether maternal multiple sclerosis raises the chance of neurodevelopmental disorders in offspring and concluded that it does not. This entry exists precisely because the result was negative. Several other conditions in this app carry a crossover entry describing something that was found, and a category that only reported the positives would leave anybody with MS reading the silence as nobody having asked. Somebody asked, and the answer was no. Two things sit alongside it without contradicting it. A parent with MS may face practical difficulties in raising a child, fatigue and mobility among them, which have nothing to do with how the child develops and are worth planning support around on their own terms. And separately from pregnancy entirely, adults with MS score higher on ADHD self-report questionnaires than comparison groups in cross-sectional research. That is weak evidence by design: a questionnaire at a single moment cannot separate attention difficulties from the fatigue and cognitive change MS produces directly, and the papers reporting it say as much themselves. Worth knowing if attention has changed and the change is being attributed to the wrong thing in either direction.",
    citations: [
      {
        source: 'Carta et al. 2021, maternal multiple sclerosis and offspring neurodevelopmental disorders',
        url: 'https://journals.sagepub.com/doi/full/10.1177/20552173211017301',
      },
      {
        source: 'Cross-sectional self-reported ADHD symptoms in adults with multiple sclerosis',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11242620/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['ms-pregnancy-relapse-real-data', 'neuro-crossover-with-tracked-conditions'],
  },

  // ---------------------------------------------------------------
  // The person themselves, not a child. Nine entries, all ending in
  // "-crossover" so classifyConditionTopic files them under Whole-Body
  // Effects.
  // ---------------------------------------------------------------
  {
    id: 'celiac-adhd-crossover',
    category: 'celiac',
    title: 'Celiac Disease, ADHD and Autism: Findings That Disagree',
    teaser:
      'One large study found ADHD more common alongside celiac disease. A newer meta-analysis found no association at all. Screening one for the other is not advised in either direction.',
    summary:
      "A study of 112,340 participants reported ADHD associated with celiac disease at an odds ratio of 1.75, and a small clinical series found 16 percent of 73 children with celiac carrying an ADHD diagnosis against 9.4 percent of comparisons. Against that, a 2025 meta-analysis of gastrointestinal conditions in ADHD covering 3,851,163 individuals found no association with celiac disease at all. On the autism side the picture is cleaner: Ludvigsson and colleagues examined 26,995 people with biopsy-confirmed celiac disease and found no increase in autism, at an odds ratio of 0.93 (0.51 to 1.68). The one signal in that study came from people with positive celiac blood tests but a normal intestinal lining, at 4.57 (1.58 to 13.22), which is a different and much smaller group and does not transfer to people with confirmed celiac disease. So this is an unresolved question, and the authors of the positive ADHD study reached that conclusion themselves, advising against routine screening in either direction. If gluten is being removed or reintroduced and attention seems to shift with it, write it down with dates and take it to a doctor as a personal observation. That is a different thing from evidence that gluten drives attention, and this app will not blur the two.",
    citations: [
      {
        source: 'Ertürk et al., ADHD and celiac disease, J Atten Disord',
        url: 'https://doi.org/10.1177/1087054715611493',
      },
      {
        source: 'Ludvigsson et al. 2013 JAMA Psychiatry, 26,995 biopsy-confirmed celiac patients and autism risk',
        url: 'https://jamanetwork.com/journals/jamapsychiatry/fullarticle/1743008',
      },
      {
        source: 'Scientific Reports 2025 meta-analysis, gastrointestinal conditions in ADHD, 3,851,163 individuals',
        url: 'https://www.nature.com/articles/s41598-025-04303-x',
      },
    ],
    overallTier: 'weak',
    relatedIds: [
      'celiac-adhd-symptoms-mixed-evidence',
      'celiac-overview',
      'neuro-crossover-with-tracked-conditions',
    ],
  },
  {
    id: 'ibd-autism-crossover',
    category: 'ibd',
    title: 'Autism and Inflammatory Bowel Disease',
    teaser:
      'Pooled across more than 11 million participants, autistic people carried an IBD diagnosis more often. Looked at from the ADHD side, the same association did not appear.',
    summary:
      "Across studies totalling more than 11 million participants, autism was associated with roughly a 66 percent higher relative chance of an inflammatory bowel disease diagnosis. Attach the baseline again: IBD affects well under one percent of people, so a 66 percent proportional increase on it still describes a small number. From the other direction, the 2025 meta-analysis of gastrointestinal conditions in ADHD found no association with Crohn's disease or ulcerative colitis, which makes this an autism finding rather than a neurodivergence finding, and that distinction is worth holding. Why it happens is unsettled. Shared immune and inflammatory signalling is proposed. So is the plainer explanation that digestive symptoms are common in autism, which leads to more investigation, which finds more of everything that investigation finds. The practical value here runs in the opposite direction to the statistic. Abdominal pain, urgency, weight loss and blood are easy to miss or misread in somebody who shows distress differently or who has been told for years that stomach trouble is part of being autistic, and IBD is a condition where a delayed diagnosis costs. Digestive symptoms deserve the same workup anybody else would get.",
    citations: [
      {
        source: 'Pooled analysis of autism and inflammatory bowel disease risk',
        url: 'https://pubmed.ncbi.nlm.nih.gov/34939353/',
      },
      {
        source: 'Scientific Reports 2025 meta-analysis, gastrointestinal conditions in ADHD',
        url: 'https://www.nature.com/articles/s41598-025-04303-x',
      },
    ],
    overallTier: 'weak',
    relatedIds: ['ibd-overview', 'neuro-autism-gi-symptoms', 'neuro-crossover-with-tracked-conditions'],
  },
  {
    id: 'ibs-adhd-crossover',
    category: 'ibs',
    title: 'IBS and ADHD: the Gut Association That Held Up',
    teaser:
      'Across 11 studies and 3.85 million people, ADHD and IBS occurred together at an odds ratio of 1.63. In the same analysis, no other gut condition did.',
    summary:
      "A 2025 meta-analysis pooled 11 studies covering 3,851,163 individuals, 175,806 of them with ADHD, and found irritable bowel syndrome associated with ADHD at an odds ratio of 1.63 (1.45 to 1.83). The same analysis found nothing for Crohn's disease, ulcerative colitis, celiac disease or constipation. If this were only neurodivergent people accumulating more diagnoses, the others would have moved too. IBS is classified as a disorder of gut-brain interaction, defined by how signalling between the two behaves rather than by damage visible on a scan, so overlap with a condition of attention and arousal regulation is not surprising, though the shared mechanism has not been pinned down. Three things follow. Irregular, rushed or skipped meals are common with ADHD and are also among the reliable triggers for IBS symptoms, which is one condition making the other harder rather than either causing the other. Stimulant medication has digestive effects that are worth telling apart from the IBS instead of blaming one for the other. And a low-FODMAP trial is a structured elimination with a reintroduction phase and an end date, which is exactly the kind of multi-week protocol that needs to live outside somebody's head. Meal logging and reminders help with that, and that is a support claim about structure, not a claim that any diet treats ADHD.",
    citations: [
      {
        source: 'Scientific Reports 2025 meta-analysis, gastrointestinal conditions in ADHD, 11 studies',
        url: 'https://www.nature.com/articles/s41598-025-04303-x',
      },
      {
        source: 'PubMed record for the same meta-analysis',
        url: 'https://pubmed.ncbi.nlm.nih.gov/40456878/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['ibs-overview', 'neuro-crossover-with-tracked-conditions', 'mentalhealth-adhd-dietary-triggers'],
  },
  {
    id: 'cvd-adhd-crossover',
    category: 'cardiovascularDisease',
    title: 'ADHD and Cardiovascular Disease Across a Lifetime',
    teaser:
      'In 5.4 million Swedish adults followed for about 12 years, those with ADHD received a cardiovascular diagnosis roughly twice as often. Accounting for other psychiatric conditions lowered the figure without removing it.',
    summary:
      "Li and colleagues followed 5,389,519 Swedish adults born between 1941 and 1983 who had no cardiovascular disease at the start, about 37,000 of them with ADHD, for a mean of 11.80 years. 38.05 percent of the ADHD group received at least one cardiovascular diagnosis against 23.57 percent of everybody else, a hazard ratio of 2.05 (1.98 to 2.13) adjusted for sex and birth year. Adjusting further for psychiatric comorbidities brought it to 1.65 (1.59 to 1.71), so part of the association runs through depression, anxiety and substance use rather than through ADHD directly, and part of it does not. The strongest individual associations were cardiac arrest at 2.28 (1.81 to 2.87), hemorrhagic stroke at 2.16 (1.68 to 2.77) and peripheral vascular disease at 2.05 (1.76 to 2.38). Of all the crossovers in this app, this is the one with the clearest action attached, because every established way of lowering cardiovascular risk is open to anybody: blood pressure measured and treated, smoking, sleep, movement, and the eating patterns this app already scores foods against. It is also the point where losing track of appointments and letting a repeat prescription lapse stops being an inconvenience and becomes a risk in itself, which is what the reminder and schedule side of this app is for.",
    citations: [
      {
        source: 'Li et al. 2022 World Psychiatry, ADHD and cardiovascular disease in 5,389,519 adults',
        url: 'https://onlinelibrary.wiley.com/doi/10.1002/wps.21020',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['cvd-overview', 'neuro-crossover-with-tracked-conditions'],
  },
  {
    id: 'migraine-adhd-crossover',
    category: 'migraine',
    title: 'Migraine and ADHD',
    teaser:
      'A review of 14 studies found migraine and ADHD occurring together more often than chance would give, and found nothing of the kind for tension-type headache.',
    summary:
      'Pooling 14 studies, migraine was associated with ADHD at an odds ratio of 1.322 (1.018 to 1.717, p = 0.036), with no association for tension-type headache. A separate study of 26,456 adults put the figure higher at 1.81 (1.53 to 2.12), with the association appearing stronger for migraine with aura and in women. If neurodivergent people simply reported more symptoms or attended more appointments, tension-type headache would have moved along with migraine and it did not. Shared ground in how the brain handles sensory input and arousal is the usual explanation offered, and it stays an explanation rather than a demonstrated mechanism. What is practical here has nothing to do with food. Migraine management leans on exactly the things ADHD makes hardest: noticing a pattern spread across weeks, taking an acute medication early enough in an attack for it to work, and keeping a preventive going every day with no immediate reward for having done so. A headache record that fills itself in from what is already being logged, and a reminder that does not depend on remembering, are worth more here than any trigger-food list, and the trigger lists are oversimplified anyway, as this category already says elsewhere.',
    citations: [
      {
        source: 'ADHD is associated with migraine: systematic review and meta-analysis, Eur Child Adolesc Psychiatry',
        url: 'https://link.springer.com/article/10.1007/s00787-017-1045-4',
      },
      {
        source: 'Comorbidity of migraine with ADHD in adults, 26,456 participants',
        url: 'https://pubmed.ncbi.nlm.nih.gov/30322380/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['migraine-overview', 'neuro-crossover-with-tracked-conditions'],
  },
  {
    id: 'type1-adhd-crossover',
    category: 'type1Diabetes',
    title: 'Type 1 Diabetes and ADHD: What the Control Numbers Show',
    teaser:
      'Children with both were reported at an HbA1c of 8.1 percent against 7.4 percent for type 1 diabetes alone. Results vary across studies, and treatment appears to matter.',
    summary:
      'Type 1 diabetes asks for the exact work ADHD makes hardest: counting carbohydrate at every meal, dosing against the count, checking, correcting, and having supplies on hand before they are needed. One study reported a mean HbA1c of 8.1 percent plus or minus 1.6 in children with both conditions against 7.4 percent plus or minus 1.2 in those with diabetes alone. Findings across studies are mixed rather than uniform, and in several of them patients treated with stimulant medication showed lower HbA1c and fewer complications than untreated patients with ADHD, which points at the executive-function load rather than at anything metabolic happening between the two conditions. Read this as a description of a difficulty, never as a description of a person, and never as a reason for a clinic to expect less. What helps is what helps anybody carrying too many steps: moving them out of the head and into something external. Dose reminders that fire at the time rather than waiting to be remembered, a log that can be filled in hours late without any penalty for the lateness, and carbohydrate figures already attached to the food rather than looked up again each time. None of that is nutrition treating ADHD. It is taking the remembering out of a task that punishes forgetting.',
    citations: [
      {
        source: 'ADHD and glycemic control in children and adolescents with type 1 diabetes',
        url: 'https://pubmed.ncbi.nlm.nih.gov/34933573/',
      },
    ],
    overallTier: 'weak',
    relatedIds: ['type1-overview', 'neuro-crossover-with-tracked-conditions'],
  },
  {
    id: 'type2-adhd-crossover',
    category: 'type2Diabetes',
    title: 'Type 2 Diabetes and ADHD, Tested Against Siblings',
    teaser:
      'Pooled studies put the association at more than twice the odds. Then a sibling comparison in the same paper asked whether it was ADHD at all, and largely answered no.',
    summary:
      'A systematic review with meta-analysis covering four studies and 5,738,287 participants reported type 2 diabetes associated with ADHD at an adjusted odds ratio of 2.29 (1.48 to 3.55), and a Taiwanese longitudinal study within it reported a hazard ratio of 3.28 (1.41 to 7.63). The same paper also carried a population-based sibling comparison, which holds family background roughly constant by comparing siblings who do and do not have ADHD, and that comparison indicated ADHD by itself has a negligible effect on type 2 diabetes risk once familial factors are accounted for. The association exists and would show up for anyone looking at population numbers; the causal reading of it mostly does not survive a design built to test it. What survives is indirect: irregular eating, disrupted sleep and less movement each associate with metabolic risk on their own, and all three are harder to hold steady with ADHD. That is an argument for putting the routine somewhere outside the head, which is what this app is built to do, and not an argument for treating an ADHD diagnosis as a diabetes forecast.',
    citations: [
      {
        source: 'Systematic review, meta-analysis and sibling study of ADHD and type 2 diabetes, Neurosci Biobehav Rev',
        url: 'https://www.sciencedirect.com/science/article/pii/S0149763423000453',
      },
    ],
    overallTier: 'weak',
    relatedIds: ['type2-overview', 'neuro-crossover-with-tracked-conditions'],
  },
  {
    id: 'psoriasis-adhd-crossover',
    category: 'psoriasis',
    title: 'Psoriasis and ADHD',
    teaser:
      'A large study found ADHD diagnoses somewhat more common in people with psoriasis, more so in women than men. Nobody has shown why.',
    summary:
      'ADHD was associated with psoriasis at an adjusted odds ratio of 1.57 (1.46 to 1.68) in women and 1.31 (1.23 to 1.40) in men. Those are modest increases, the sex difference has no settled explanation, and an association drawn from health records cannot separate a shared biological cause from the simpler possibility that people already under regular medical care collect more diagnoses of everything. Shared inflammatory signalling gets proposed and has not been demonstrated. The useful part of this is on the treatment side rather than the cause side. Psoriasis treatment is mostly something a person administers to themselves on a schedule: a topical applied consistently for weeks before anything visible changes, phototherapy appointments to get to, bloods to keep up for a systemic drug. A treatment that only works if it is done daily and gives no immediate feedback for doing it is precisely the kind that slips, and calling that slipping a lack of motivation gets the problem backwards. Reminders, a visible record of what was actually applied and when, and a way to see change measured over weeks rather than looked for each morning in the mirror are the responses that fit the difficulty.',
    citations: [
      {
        source: 'ADHD and psoriasis, sex-stratified adjusted odds ratios',
        url: 'https://pubmed.ncbi.nlm.nih.gov/28983730/',
      },
    ],
    overallTier: 'weak',
    relatedIds: ['psoriasis-overview', 'neuro-crossover-with-tracked-conditions'],
  },
  {
    id: 'masld-adhd-crossover',
    category: 'fattyLiverDisease',
    title: 'Fatty Liver Disease, ADHD and Autism',
    teaser:
      'Fatty liver sits among the conditions most strongly associated with adult ADHD in Swedish register data, and autistic children have been reported with it more often. The evidence is thin in both directions, and the route to it is not mysterious.',
    summary:
      'A genetically informed Swedish register study mapping physical conditions in adults with ADHD found elevated risk across 34 of 35 conditions examined, with fatty liver disease among those most strongly associated, alongside alcohol-related liver disease, sleep disorders, COPD, epilepsy and obesity. Separately, a case-control study of children found autism associated with higher rates of non-alcoholic fatty liver disease and steatohepatitis alongside obesity, with part of that attributable to weight gained on antipsychotic and other medication rather than to autism itself. Both findings are weak by design: register associations cannot separate a cause from a shared cause, and a medication contribution makes part of the autism figure a treatment effect rather than a trait effect. The path from either to a fatty liver needs nothing specific to neurodivergence to explain it. Irregular and narrow eating, high intake of sugar-sweetened drinks, disrupted sleep, less movement and weight gained on prescribed medication are all established contributors, and every one of them is harder to keep in check when daily structure is hard to hold. The reason to state this plainly rather than leave it out is that fatty liver is among the most reversible conditions in this app. If several of those describe the last few years, liver bloods are worth asking for.',
    citations: [
      {
        source: 'Mapping phenotypic and aetiological associations between ADHD and physical conditions in adulthood, Sweden',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8376653/',
      },
      {
        source: 'Autism spectrum disorders and metabolic complications of obesity, J Pediatr',
        url: 'https://pubmed.ncbi.nlm.nih.gov/27592097/',
      },
    ],
    overallTier: 'weak',
    relatedIds: ['masld-overview', 'neuro-crossover-with-tracked-conditions'],
  },
];
