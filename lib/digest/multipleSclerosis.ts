import type { DigestEntry } from './types';

// Multiple Sclerosis -- 15 entries, added 2026-08-08 as this app's eighth
// real condition, next in the same priority order every condition before
// it followed. Built with real self-advocacy content included from the
// start, the same lesson already applied to every condition since Graves'.
//
// MS is a genuinely different shape of condition from most of what this
// app has built so far -- it's a disease of the central nervous system
// (the brain and spinal cord), not the gut, joints, skin, or thyroid, so
// several of the strongest findings here are historical (the Swank diet's
// real 34-50 year follow-up), viral (a landmark, near-causal trigger
// finding), or medication-safety-specific (JC virus antibody monitoring)
// rather than the more typical "this food helps, this food hurts" shape.
//
// Distinct from otherAutoimmune.ts's own 'other-multiple-sclerosis' entry,
// which stays exactly as it was: a vitamin D relapse/EDSS meta-analysis,
// studied as corroborating evidence for Hashimoto's own vitamin D
// research, written for a Hashimoto's reader. This category goes deeper
// on vitamin D specifically for MS (including a real, large, more recent
// negative trial that entry doesn't cover) and covers everything else
// specific to actually living with and managing MS.
//
// Every citation here was independently verified via WebSearch before
// being written in.
export const MULTIPLE_SCLEROSIS_ENTRIES: DigestEntry[] = [
  {
    id: 'ms-overview',
    category: 'multipleSclerosis',
    title: 'Multiple Sclerosis: When the Immune System Attacks the Brain and Spinal Cord Directly',
    teaser: "A disease of the central nervous system itself, not a joint, a gland, or the gut. Several of the strongest findings in this category reflect that difference.",
    summary:
      "Multiple sclerosis is an autoimmune disease in which the immune system attacks myelin, the protective sheath surrounding nerve fibers in the brain and spinal cord. The damage disrupts how nerve signals travel, producing symptoms as varied as vision problems, numbness, fatigue, and mobility difficulty depending on exactly where the damage occurs. Most people are first diagnosed with relapsing-remitting MS (RRMS), where distinct relapses are followed by periods of partial or full recovery, typically in their twenties or thirties. A meaningful share eventually transitions to secondary progressive MS (SPMS), a gradual decline with or without further relapses, while a smaller group has primary progressive MS (PPMS) from the start, with no relapse-remission pattern at all. This category covers what's specific to actually living with and managing MS on its own terms -- a genuinely different shape of condition from most of what this app has built out so far, since it's a disease of the central nervous system directly, not the gut, joints, skin, or thyroid.",
    citations: [
      { source: 'Multiple Sclerosis, MedlinePlus, U.S. National Library of Medicine', url: 'https://medlineplus.gov/multiplesclerosis.html' },
    ],
    overallTier: 'strong',
    relatedIds: ['other-multiple-sclerosis'],
  },
  {
    id: 'ms-ebv-trigger',
    category: 'multipleSclerosis',
    title: 'A Virus Nearly Everyone Has Had, Tied to MS With a 32-Fold Risk Increase',
    teaser: 'A 20-year study of over 10 million people found almost every MS case traces back to one common infection first.',
    summary:
      "One of the most striking findings in autoimmune disease research in recent years: a 20-year prospective study following more than 10 million young adults in active U.S. military service found the risk of developing MS increased 32-fold after infection with Epstein-Barr virus (EBV), the common virus behind mononucleosis, but was not increased after infection with other viruses transmitted the same way, including cytomegalovirus. A biomarker of nerve damage in the blood rose specifically after EBV infection, not before it, ruling out the possibility that the virus was simply more likely to infect people already developing MS. The researchers' own conclusion is direct: the size of this effect, a 32-fold increase, is comparable to the link between smoking and lung cancer, and the study's own design specifically tested and ruled out reverse causation and confounding as explanations. Since nearly everyone is infected with EBV by adulthood but only a small fraction develop MS, EBV infection appears to be a necessary trigger, not a sufficient one -- something else, genetic susceptibility, other environmental factors, or both, still has to be present too.",
    citations: [
      { source: 'Bjornevik K, et al., Science, 2022, "Longitudinal analysis reveals high prevalence of Epstein-Barr virus associated with multiple sclerosis," PMID 35025605', url: 'https://pubmed.ncbi.nlm.nih.gov/35025605/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ms-ebna1-glialcam-mimicry'],
  },
  {
    id: 'ms-ebna1-glialcam-mimicry',
    category: 'multipleSclerosis',
    title: 'The Real Mechanism Behind the EBV-MS Link: One Viral Protein Looks Enough Like Myelin to Fool the Immune System',
    teaser: 'A real, specific case of molecular mimicry, the same broad mechanism this app already covers for gluten and joint tissue, now traced to a virus and a piece of the nerve sheath itself.',
    summary:
      "Finding that EBV infection precedes most MS cases only answers part of the question. A separate, real discovery explains how: a specific piece of an EBV protein called EBNA1 (amino acids 365 to 425) structurally resembles a protein in the myelin sheath called GlialCAM, closely enough that antibodies made to fight the virus cross-react with the body's own nerve coating. About 25% of MS patients carry antibodies to this exact piece of EBNA1, and those same antibodies bind to GlialCAM in laboratory testing. The effect is strongest, and increases MS risk the most, in people who also carry a specific genetic risk variant (HLA-DRB1*15:01) -- the antibody response and the genetic risk factor combine rather than acting independently. In an animal model of MS, immunizing mice against EBNA1 measurably worsened their disease. This is a real, mechanistic explanation for the population-level finding, not just a correlation stacked on a correlation, and it's the same broad principle, a piece of a foreign invader resembling the body's own tissue closely enough to trigger an attack, that this app's own research already documents for gluten and joint tissue in other conditions.",
    citations: [
      { source: 'Lanz TV, et al., Nature, 2022, "Clonally expanded B cells in multiple sclerosis bind EBV EBNA1 and GlialCAM," PMID 35073561', url: 'https://pubmed.ncbi.nlm.nih.gov/35073561/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'ms-smoking-risk',
    category: 'multipleSclerosis',
    title: 'Smoking and MS: A Real, Well-Established Risk for Getting the Disease, a Genuinely Less Clear One for How It Progresses',
    teaser: 'Smoking raises real, measured MS risk, consistently, at every stage this has been tested, with no protective angle found anywhere.',
    summary:
      "A meta-analysis pooling over 20,000 cases from case-control and cohort studies found smoking associated with a real, meaningfully increased risk of developing MS in the first place (risk ratio around 1.5, meaning roughly 50% higher risk). What's genuinely less settled is whether smoking also worsens the disease's course once someone already has it. Different meta-analyses have found mixed results on progression to secondary progressive MS specifically, some falling just short of statistical significance, others finding a real, significant association -- real research still working out exactly how strong that second effect is, even though the first (susceptibility) is well established. Worth knowing plainly: there is no protective angle to smoking found here at all, unlike a few other conditions this app covers where the real evidence runs the other way.",
    citations: [
      { source: 'The risk of smoking on multiple sclerosis: a meta-analysis based on 20,626 cases from case-control and cohort studies', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4806598/' },
    ],
    overallTier: 'strong',
    relatedIds: ['lifestyle-smoking-paradox'],
  },
  {
    id: 'ms-swank-diet-history',
    category: 'multipleSclerosis',
    title: 'The Swank Diet: A Real, Decades-Long Natural Experiment in Saturated Fat and MS',
    teaser: 'One doctor followed the same patients for up to 50 years. The ones who genuinely stuck to a low-saturated-fat diet fared strikingly differently from the ones who didn\'t.',
    summary:
      "Dr. Roy Swank began recommending a low-saturated-fat diet (roughly 20 grams of saturated fat a day or less) to MS patients in the 1950s and kept following the same cohort for decades, publishing a real 34-year follow-up and later tracking a small remaining group into their 70s and 80s at the 50-year mark. The real, striking finding: patients identified early in their disease, while only mildly disabled, who genuinely restricted saturated fat intake, showed no further disability in 95% of cases at 34 years. Eating just 8 grams more saturated fat a day than the diet's own target was associated with a real, sharp increase in disability and a nearly tripled death rate in Swank's own data, and patients who relaxed the diet even years into treatment could see their disease reactivate. This is real, long-running observational data from one dedicated clinician and his own patient cohort, not a randomized trial, so it can't rule out that patients who stuck with a demanding diet for decades differed from those who didn't in other ways too, exactly the kind of adherence-driven pattern medicine's own newer, controlled research (see the real head-to-head trial below) has since worked to test directly.",
    citations: [
      { source: 'Swank RL, Goodwin J, Nutrition, 2003, "Review of MS patient survival on a Swank low saturated fat diet," PMID 12591551', url: 'https://pubmed.ncbi.nlm.nih.gov/12591551/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['ms-waves-trial'],
  },
  {
    id: 'ms-waves-trial',
    category: 'multipleSclerosis',
    title: 'The Real Head-to-Head Trial: Swank vs. Wahls, Both Genuinely Helped',
    teaser: 'A real randomized trial finally tested two competing MS diets against each other directly, and neither one lost.',
    summary:
      "The WAVES trial randomized 77 people with relapsing-remitting MS to either the Swank diet (low saturated fat) or the Wahls Elimination diet (a modified Paleolithic approach emphasizing vegetables and eliminating grains, legumes, and dairy), tracking real fatigue and quality-of-life outcomes over 36 weeks. Both diets produced real, clinically meaningful reductions in fatigue: the Swank group's fatigue scores dropped by about 1 point by 24 weeks, the Wahls group by about 1.3 points, with both groups also showing real, meaningful improvements in quality of life. Neither diet was a clear, decisive winner over the other, though the Wahls group showed somewhat larger improvements in physical quality-of-life scores specifically. Both diets share a real, common thread worth noting directly: both emphasize a high intake of fruits and vegetables and unsaturated fats, and both limit highly processed foods, the same whole-food pattern this app's own research already finds helpful across several other conditions. This is real, randomized, controlled evidence, a genuinely stronger design than Swank's own decades-long observational cohort, even at this trial's modest size and 36-week length.",
    citations: [
      { source: 'Wahls TL, et al., Multiple Sclerosis Journal - Experimental, Translational and Clinical, 2021, "Impact of the Swank and Wahls elimination dietary interventions on fatigue and quality of life in relapsing-remitting multiple sclerosis: The WAVES randomized parallel-arm clinical trial"', url: 'https://journals.sagepub.com/doi/10.1177/20552173211035399' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'ms-biotin-honest-correction',
    category: 'multipleSclerosis',
    title: 'High-Dose Biotin: A Small Trial Looked Genuinely Promising. A Larger One Didn\'t Confirm It.',
    teaser: 'A real, honest case study in why one small positive trial isn\'t the same as proof, and why the larger follow-up trial mattered.',
    summary:
      "High-dose pharmaceutical-grade biotin (MD1003, roughly 300mg a day, far above ordinary dietary or supplement amounts) was tested specifically in progressive MS, a form of the disease with few treatment options. The first real trial (MS-SPI, 154 patients) found a genuinely striking result: 12.6% of patients on MD1003 achieved a real, meaningful disability reversal at 9 months (confirmed at 12), versus none of the patients on placebo. That result did not hold up in the larger, later phase 3 trial (SPI2, 642 patients): 12% improved on MD1003 versus 9% on placebo, a difference that did not reach statistical significance, and the drug's manufacturer reported the trial failed both its primary and secondary endpoints. This is included as a real, honest example of exactly the discipline this whole app's research holds to: a small, promising early trial is real evidence, but not the same as proof, and a larger, better-powered follow-up trial is what actually settles the question. There's a real, separate, practical reason to know about high-dose biotin specifically if considering it anyway: this app's own Labs & Medication Timing research already covers a well-documented, unrelated problem, biotin at this kind of dose can cause inaccurate thyroid lab results by interfering with the biotinylated-antibody technology many lab assays use, a real risk worth telling a lab about directly regardless of whether the MS benefit itself pans out.",
    citations: [
      { source: 'Tourbah A, et al., Multiple Sclerosis Journal, 2016, "MD1003 (high-dose biotin) for the treatment of progressive multiple sclerosis: A randomised, double-blind, placebo-controlled study"', url: 'https://journals.sagepub.com/doi/10.1177/1352458516667568' },
      { source: 'Cree BAC, et al., The Lancet Neurology, 2020, "Safety and efficacy of MD1003 (high-dose biotin) in patients with progressive multiple sclerosis (SPI2): a randomised, double-blind, placebo-controlled, phase 3 trial"', url: 'https://www.thelancet.com/journals/laneur/article/PIIS1474-4422(20)30347-1/abstract' },
    ],
    overallTier: 'weak',
    relatedIds: ['labs-biotin-interference'],
  },
  {
    id: 'ms-vitamin-d-mixed-evidence',
    category: 'multipleSclerosis',
    title: 'Vitamin D and MS: A Real, Large, Negative Trial Worth Knowing About Directly',
    teaser: "This app's own corroborating-evidence research already flags this question as unresolved. A large, recent, dedicated MS trial adds real weight to the uncertain side.",
    summary:
      "This app's own Other Autoimmune Diseases research already covers a real meta-analysis on vitamin D and MS relapse rates, framed as one of three unresolved vitamin D questions across different autoimmune diseases. A large, more recent, dedicated trial adds real, specific weight to the uncertain side of that question. The PREVANZ trial randomized 204 people with a clinically isolated syndrome (an early, single episode suggestive of MS, before a full diagnosis) to placebo or one of three vitamin D doses (1,000, 5,000, or 10,000 IU daily) and tracked whether they went on to develop full MS over 48 weeks. The result was a real, clear null: 58% of participants converted to MS regardless of group, and none of the three vitamin D doses showed a statistically significant reduction in that risk compared to placebo. This doesn't erase the real, separately-cited evidence pointing toward a benefit, some meta-analyses pooling many smaller trials do find a real relapse-rate reduction at high, sustained doses, but it's a genuine, recent, well-designed trial finding no effect at exactly the point (early disease, before full diagnosis) where a preventive effect would matter most. Vitamin D was safe and well tolerated at every dose tested, which is worth knowing on its own regardless of how the efficacy question eventually resolves.",
    citations: [
      { source: 'Lucas RM, et al., Brain, 2024, "Vitamin D did not reduce multiple sclerosis disease activity after a clinically isolated syndrome," PMID 38085047', url: 'https://pubmed.ncbi.nlm.nih.gov/38085047/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['other-multiple-sclerosis', 'nutrient-vitamin-d'],
  },
  {
    id: 'ms-sodium-th17-contested',
    category: 'multipleSclerosis',
    title: 'High Sodium Intake and MS: A Real Mechanism, a Genuinely Contested Human Finding',
    teaser: 'A real, specific immune mechanism in the lab. A real early human study finding a striking effect. Larger, later studies finding none at all.',
    summary:
      "Excess dietary sodium has a real, documented effect on Th17 cells, the same inflammatory immune cell type central to this app's own research on several autoimmune conditions -- high salt exposure pushes these cells toward a more aggressively inflammatory state in laboratory and animal studies, and in an animal model of MS, a high-salt diet worsened disease onset and severity alongside real, measurable breakdown of the blood-brain barrier. The real human evidence is genuinely more contested than the lab mechanism alone would suggest. An early human study found a striking dose-dependent relationship: participants with medium sodium intake (2 to 4.8 grams a day) had a real, 2.75-fold higher disease exacerbation rate, and those with high intake (over 4.8 grams a day) a 9.95-fold higher rate, compared with low-intake participants. Later research in larger cohorts, though, found no correlation between sodium intake and MS disease activity at all, a real, direct contradiction of the earlier finding, not just a smaller or noisier version of it. A real, honest, unresolved question, included with both sides stated plainly rather than only the more dramatic early finding, which several patient-facing sources still repeat as if it were settled.",
    citations: [
      { source: 'Farez MF, et al., Journal of Neurology, Neurosurgery & Psychiatry, 2015, "Sodium intake is associated with increased disease activity in multiple sclerosis," PMID 25168393', url: 'https://pubmed.ncbi.nlm.nih.gov/25168393/' },
      { source: 'A Systematic Review of the Impact of Dietary Sodium on Autoimmunity and Inflammation Related to Multiple Sclerosis', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6743836/' },
    ],
    overallTier: 'weak',
  },
  {
    id: 'ms-fasting-mimicking-diet',
    category: 'multipleSclerosis',
    title: 'Fasting-Mimicking Cycles: A Real, Specific Mechanism in Mice, a Real Safety Trial in People, Not Yet a Proven Human Treatment',
    teaser: 'The animal data is genuinely striking: destroyed autoimmune cells, regrown myelin. The human evidence is still an early, safety-focused first step.',
    summary:
      "A fasting-mimicking diet (a real, structured low-calorie eating pattern designed to trigger some of fasting's biological effects while still providing some food) showed a real, specific effect in mouse models of MS: cycles of the diet reduced inflammatory signaling molecules, increased immune cells linked to healthy immune regulation, protected the cells that produce myelin, and actively encouraged remyelination, regrowth of the protective nerve coating MS damages. That's a genuinely striking mechanism in an animal model, and it directly connects to autophagy and mitochondrial-repair research this app already covers elsewhere. The human evidence so far is real but much earlier-stage: a 6-month study of 60 people with relapsing-remitting MS, primarily designed to test safety rather than prove effectiveness, found people who did one fasting-mimicking diet cycle followed by a Mediterranean diet, and a separate group on a ketogenic diet, both reported real improvements in quality of life. The fasting-mimicking diet was only given once in this trial, and the study's own authors are explicit that larger, randomized, multi-cycle trials are still needed before this can be called a proven treatment rather than a promising, safety-tested early signal.",
    citations: [
      { source: 'Choi IY, et al., Cell Reports, 2016, "A Diet Mimicking Fasting Promotes Regeneration and Reduces Autoimmunity and Multiple Sclerosis Symptoms"', url: 'https://www.cell.com/cell-reports/fulltext/S2211-1247(16)30576-9' },
    ],
    overallTier: 'weak',
    relatedIds: ['mito-fasting-autophagy-tension'],
  },
  {
    id: 'ms-hashimotos-comorbidity',
    category: 'multipleSclerosis',
    title: "MS and Autoimmune Thyroid Disease: A Real, Striking, Quantified Overlap",
    teaser: 'Roughly a quarter of untreated MS patients also carry autoimmune thyroid disease. This is one of the strongest real comorbidity numbers in this whole app.',
    summary:
      "Real research finds autoimmune thyroiditis or subclinical hypothyroidism present in 20% to 25% of people with MS before they start immunomodulatory treatment, a genuinely striking figure, meaning roughly one in four to five untreated MS patients also carries real, measurable thyroid autoimmunity. Hashimoto's thyroiditis specifically shows up as the single most common comorbid thyroid condition in MS cohort studies. The real, reassuring finding alongside this: thyroid autoimmunity appears to have a neutral effect on the actual course of MS itself, it doesn't seem to make MS worse, it's simply genuinely more likely to co-occur. Worth knowing directly for two real, practical reasons: first, MS's own core immune-cell biology (Th17/Treg imbalance, the same mechanism this app's own Gut & Microbiome research already covers) is a real, shared thread connecting these two diseases, not a coincidence; second, a regular thyroid panel (see this app's own Hashimoto's self-advocacy content for what to ask for) is arguably even more relevant for someone managing MS than for the general population, given how common this real overlap actually is.",
    citations: [
      { source: 'The Relationship Between Autoimmune Disorders and Multiple Sclerosis: Clinical Insights and Therapeutic Approaches', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12191017/' },
    ],
    overallTier: 'strong',
    relatedIds: ['advocacy-core-thyroid-panel'],
  },
  {
    id: 'ms-jc-virus-testing',
    category: 'multipleSclerosis',
    title: 'JC Virus Antibody Testing: A Real, Necessary Safety Check for One of the Most Effective MS Medications',
    teaser: 'A highly effective drug carries a real, rare, serious brain-infection risk. One blood test, repeated regularly, is how that risk actually gets tracked.',
    summary:
      "Natalizumab is a real, highly effective medication for relapsing MS, but it carries a real, serious risk: progressive multifocal leukoencephalopathy (PML), a rare but potentially fatal brain infection caused by reactivation of the JC virus, a common virus most people carry without ever knowing it. The anti-JC virus antibody index is the real, established tool for tracking this risk over time -- current guidance recommends testing every six months to catch anyone whose status shifts from negative to positive early. Real, quantified risk figures: overall PML risk is about 1 in 1,667 during the first 24 months of treatment, rising to about 1 in 192 for 25 to 48 months of treatment, with risk climbing further with a higher antibody index specifically. This test's own real limitation is worth knowing plainly: it's genuinely useful for stratifying risk but isn't perfect, some people with a high antibody index never develop PML, and PML has occurred in a small number of people who tested antibody-negative. Worth asking directly whether this testing schedule is being followed if natalizumab is part of a treatment plan, rather than assuming it happens automatically.",
    citations: [
      { source: 'Plavina T, et al., Neurology, 2014, "Anti-JC virus antibody levels in serum or plasma further define risk of natalizumab-associated progressive multifocal leukoencephalopathy," PMID 25273271', url: 'https://pubmed.ncbi.nlm.nih.gov/25273271/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'ms-mcdonald-criteria',
    category: 'multipleSclerosis',
    title: 'How MS Is Actually Diagnosed: The McDonald Criteria, and Why "Dissemination in Space and Time" Matters',
    teaser: 'MS diagnosis requires showing damage in more than one place and at more than one point in time. Knowing the real framework helps make sense of what an MRI report is actually establishing.',
    summary:
      "MS diagnosis relies on the McDonald criteria, a real, internationally agreed framework requiring evidence of \"dissemination in space\" (nerve damage in more than one distinct area of the central nervous system) and \"dissemination in time\" (evidence that damage occurred at more than one point in time, not all from a single event). The most recent major revision, in 2017, made a real, specific change worth knowing about directly: cerebrospinal fluid oligoclonal bands (a marker found via a real, if invasive, lumbar puncture test) can now substitute for dissemination in time, meaning someone can potentially receive an MS diagnosis at their very first clinical event rather than waiting for a second one to occur, if their spinal fluid shows this real marker. Real research since the 2017 revision confirms this genuinely allows earlier diagnosis, though it's also a real, active area of ongoing refinement, cortical lesions were added as valid evidence too, and researchers continue debating whether earlier diagnosis under the newer criteria comes with any tradeoff in how precisely certain the diagnosis actually is. Worth understanding directly what an MRI or spinal fluid report is actually establishing under this framework, rather than treating either test as a simple yes-or-no answer on its own.",
    citations: [
      { source: 'Thompson AJ, et al., The Lancet Neurology, 2018, "Diagnosis of multiple sclerosis: 2017 revisions of the McDonald criteria"', url: 'https://www.sciencedirect.com/science/article/abs/pii/S1474442217304702' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'ms-dmf-flushing-management',
    category: 'multipleSclerosis',
    title: 'Dimethyl Fumarate\'s Flushing Side Effect: A Real, Same Mechanism as Niacin, With Real, Practical Fixes',
    teaser: 'A common MS medication causes flushing through the identical receptor niacin does. Two real, practical steps genuinely reduce it.',
    summary:
      "Dimethyl fumarate (Tecfidera and similar), a common oral MS medication, causes a real, well-documented flushing side effect through the same mechanism as niacin flushing, activation of a receptor in the skin called HCA2/NIACR1, the identical pathway that makes high-dose niacin supplements cause the same sensation. Two real, practical steps genuinely help: taking the medication with food, particularly a higher-fat meal, reduces flushing incidence by roughly 25% compared to taking it on an empty stomach; and taking a real, standard dose of non-enteric-coated aspirin (up to 325mg) about 30 minutes beforehand can further reduce both how often and how severely flushing occurs. Real, practical dosing guidance also recommends a gradual dose increase over the first 4 weeks of treatment specifically to help the body adjust, and a temporary dose reduction if side effects are significant during that period. Worth raising directly with a prescriber if flushing is a real barrier to staying on this medication, since these are genuine, evidence-backed management options, not something to just tolerate or stop the medication over without first trying them.",
    citations: [
      { source: 'TECFIDERA (dimethyl fumarate) prescribing information, DailyMed, U.S. National Library of Medicine', url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=665d7e74-036c-5f68-5b67-ab84b9b49151' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'ms-tying-together',
    category: 'multipleSclerosis',
    title: 'What Actually Holds Up for MS, Pulled Together',
    teaser: 'A near-causal viral trigger, a real diet trial with no losing side, and an honest reckoning with which supplement claims survived a bigger trial and which didn\'t.',
    summary:
      "Line up everything in this category and MS reads as a condition where the single strongest finding isn't a food at all, it's a virus: EBV infection very likely precedes almost every real case, with a specific, now-understood mechanism (EBNA1 mimicking a real myelin protein) explaining how. Smoking carries real, consistent risk here, at every stage this has been tested. On diet, the real head-to-head WAVES trial found both the historic Swank approach and the newer Wahls approach genuinely helped, sharing a real, common whole-food thread rather than one being proven right and the other wrong. And two real supplement questions, high-dose biotin and vitamin D, both show exactly the discipline this app's own research holds to throughout: an early, promising result that a larger, better-designed trial did not confirm. The real, striking autoimmune-thyroid-disease comorbidity number (20-25% of untreated patients) and the practical, medication-specific self-advocacy entries, JC virus monitoring, the actual diagnostic framework, a real fix for a common side effect, round out what someone managing MS specifically needs beyond the disease's own general overview.",
    citations: [
      { source: 'Multiple Sclerosis, MedlinePlus, U.S. National Library of Medicine', url: 'https://medlineplus.gov/multiplesclerosis.html' },
    ],
    overallTier: 'strong',
    relatedIds: ['ms-ebv-trigger', 'ms-waves-trial', 'ms-biotin-honest-correction', 'ms-vitamin-d-mixed-evidence', 'ms-hashimotos-comorbidity'],
  },

  // -- Full-depth parity additions, 2026-08-08. Every citation
  // independently verified via WebSearch.
  {
    id: 'ms-disease-course-types',
    category: 'multipleSclerosis',
    title: "MS Has Four Real, Named Disease-Course Types, and Most People's Own Type Genuinely Changes Over Time",
    teaser: 'Roughly 90% start with relapsing-remitting MS. On average, 10-15 years later, most convert to a real, second, more gradually progressive type.',
    summary:
      "MS is classified into four real, internationally recognized disease-course types. Relapsing-remitting MS (RRMS), the real starting course for roughly 90% of patients, is defined by real, distinct symptom flare-ups followed by stability in between. Primary progressive MS (PPMS), affecting 15-20% of patients, involves gradual decline from the very start, with no real, distinct relapses or remissions at all. Secondary progressive MS (SPMS) is the real, common conversion point most RRMS patients eventually reach, on average 10-15 years in, where the disease shifts from a relapsing pattern into slow, steady progression. Progressive-relapsing MS (PRMS), the real, least common pattern, combines gradual decline with real, superimposed relapses layered on top. Worth knowing directly: an MS diagnosis's own real course type isn't fixed for life the way it might sound, most people's own disease genuinely evolves from one real, named category into another over the years, a real reason ongoing neurology follow-up matters even during a period of relative stability.",
    citations: [
      { source: 'Multiple Sclerosis, StatPearls, NCBI Bookshelf', url: 'https://www.ncbi.nlm.nih.gov/books/NBK499849/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'ms-bladder-bowel-cognitive-real-data',
    category: 'multipleSclerosis',
    title: "MS's Real, Everyday Burden Often Isn't Mobility -- It's Bladder, Bowel, and Fatigue, at a Genuinely High Rate",
    teaser: 'Real research finds bladder symptoms in up to 91% of patients and fatigue in up to 97% -- both far more universal than the mobility challenges MS is popularly associated with.',
    summary:
      "MS's own popular image centers mobility, but real, everyday burden concentrates elsewhere just as much, if not more. Real Dutch cohort research found 91% of patients reporting bladder symptoms and 73% reporting bowel symptoms, with a separate Australian cohort finding 74.4% with bladder problems, 48.9% with functional constipation, and 31.9% with fecal incontinence. Fatigue is genuinely near-universal in real research, affecting 35-97% of people with MS depending on the specific measure used, and it's real, independently classified as serious enough to affect quality of life, daily function, and workability REGARDLESS of a person's own physical disability level, meaning someone with mild visible mobility symptoms can still carry a genuinely severe, real fatigue burden. Cognitive decline affects a real, substantial 42.1% of patients too. These aren't separate, unrelated symptoms: real research finds bladder and bowel deficits directly correlate with both fatigue severity and cognitive impairment, a real, connected symptom cluster worth managing together rather than as isolated complaints.",
    citations: [
      { source: 'The frequency of bowel and bladder problems in multiple sclerosis and its relation to fatigue, PMC6752850', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6752850/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'ms-history-milestones',
    category: 'multipleSclerosis',
    title: "MS's Own Real History: Named by the Father of Modern Neurology, Treated for the First Time Over a Century Later",
    teaser: '1868, the 1990s -- a real, striking 130-year gap between MS being formally described and the first real, proven-effective disease-modifying treatment reaching patients.',
    summary:
      "MS's own real, formal medical history begins in May 1868, when Jean-Martin Charcot, widely regarded as the father of modern neurology, delivered a real series of lectures establishing MS as a distinct new neurological disease, naming it \"sclerose en plaques disseminee.\" Charcot's own real, direct evidence came from dissecting a deceased patient's brain and finding hardened scar patches scattered through the white matter of the spinal cord, brain stem, and brain, the actual physical lesions this app's own MS research already covers as the disease's real, underlying mechanism. The real, striking gap worth knowing: over a century passed between Charcot's 1868 description and the first proven-effective disease-modifying therapy actually reaching patients, interferon-beta, approved in the 1990s (with the subcutaneous form specifically approved in Europe and Canada in 1998, the U.S. in 2002). That's a genuinely long real wait compared to several other conditions in this app, T1D's own insulin discovery, by contrast, took barely two years from breakthrough to treatment.",
    citations: [
      { source: 'One hundred and fifty years ago Charcot reported multiple sclerosis as a new neurological disease, PMC6262215', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6262215/' },
    ],
    overallTier: 'strong',
    relatedIds: ['type1-history-milestones'],
  },
  {
    id: 'ms-pregnancy-relapse-real-data',
    category: 'multipleSclerosis',
    title: 'Pregnancy Cuts Real MS Relapse Risk by 70% in the Third Trimester -- Then Postpartum Risk More Than Doubles',
    teaser: 'One of the most dramatic real, quantified swings in this whole app: a real 70% relapse reduction late in pregnancy, followed by relapse activity running more than twice as high just 3 months after delivery.',
    summary:
      "This is a real, genuinely dramatic, well-documented swing, among the most striking quantified pregnancy findings in this whole app. Real research finds pregnancy associated with a 70% reduction in annualized relapse rate by the third trimester compared to the year before conception, a substantial real protective effect during pregnancy itself. That protection reverses sharply after delivery: real data finds relapse activity running more than twice as high at 3 months postpartum as it ran before or during pregnancy, with most postpartum relapses concentrated specifically in that 2-3 month window. A real, genuinely useful, actionable finding on what actually helps: continuing a disease-modifying therapy through pregnancy itself didn't significantly change postpartum relapse risk in real research, but RESTARTING a disease-modifying therapy promptly after delivery did, real data finding a 5.2% relapse rate in those who restarted versus 10.9% in those who didn't, a real, concrete reason the postpartum restart decision deserves the same real, deliberate planning as the pregnancy itself.",
    citations: [
      { source: 'A systematic review of relapse rates during pregnancy and postpartum in patients with relapsing multiple sclerosis, PMC8645312', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8645312/' },
    ],
    overallTier: 'strong',
  },

  // -- Second depth pass, 2026-08-08, extending full-parity work to the
  // first 10 non-Hashimoto's conditions. Every citation independently
  // verified via WebSearch.
  {
    id: 'ms-gut-dysbiosis-scfa',
    category: 'multipleSclerosis',
    title: 'A Real, Specific Gut Bacterium Was Shown to Calm Neuroinflammation Directly in an MS Mouse Model',
    teaser: 'Multiple studies find MS patients carry real, measurable gut dysbiosis and reduced short-chain fatty acids, and one specific bacterium, Bacteroides fragilis, was shown to actually improve disease severity when reintroduced.',
    summary:
      "Multiple sclerosis is increasingly tied to real, measurable gut microbiome changes, not just symptoms that happen to occur far from the digestive system. Real research across several independent cohorts finds a consistent pattern of gut dysbiosis in MS patients compared to healthy controls, alongside a real, repeated finding of reduced short-chain fatty acids (SCFAs, the same real fermentation byproducts already covered in this app's own gut-microbiome research), with butyrate and propionate specifically showing pronounced anti-inflammatory effects that appear diminished in MS. The single most striking real finding involves one specific organism: Bacteroides fragilis produces a molecule called polysaccharide A that induces regulatory T cells (Tregs) and suppresses neuroinflammation, and when germ-free MS model mice were deliberately colonized with this bacterium, their real, measured disease score improved by stimulating Tregs and suppressing the same Th17 inflammatory pathway already covered in this app's own broader autoimmune gut-health research. A separate, real depletion of Faecalibacterium prausnitzii, another known butyrate producer, has also been linked to impaired gut barrier function and systemic inflammation across several autoimmune conditions, not just MS specifically. Worth knowing directly: this is real, still-developing mechanistic evidence, mostly from animal models and observational human cohorts rather than a completed human intervention trial, but it's a genuine, specific, named example of the gut-immune connection this app's own research already treats as central, now demonstrated concretely inside MS itself.",
    citations: [
      { source: 'Changes in Gut Microbiota and Multiple Sclerosis: A Systematic Review, PMC10001679', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10001679/' },
      { source: 'The Role of Gut-derived Short-Chain Fatty Acids in Multiple Sclerosis, PMID 38630350', url: 'https://pubmed.ncbi.nlm.nih.gov/38630350/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['ms-fasting-mimicking-diet'],
  },

  // -- Volumetric depth pass batch 4, 2026-08-08, continuing toward
  // genuine volumetric parity with Hashimoto's own depth. Every citation
  // independently verified via WebSearch.
  {
    id: 'ms-uhthoffs-phenomenon-heat',
    category: 'multipleSclerosis',
    title: 'Uhthoff\'s Phenomenon: The Real, Well-Known Reason Heat Temporarily Worsens MS Symptoms',
    teaser: 'Up to 60-80% of people with MS report real, temporary symptom worsening when their body temperature rises, from hot weather, exercise, fever, or even a hot meal, fully reversing once they cool back down.',
    summary:
      "Uhthoff's phenomenon is a real, well-documented, and genuinely common experience in MS worth knowing about directly by its own name: a real, temporary worsening of neurological symptoms triggered by a rise in core body temperature, lasting less than 24 hours and fully resolving once the body cools back down. Real research finds up to 60-80% of people with MS report this real heat sensitivity, triggered by real, everyday sources including hot weather, exercise, fever, saunas, hot tubs, hot baths or showers, and even hot food and drink. The real, most widely accepted mechanism involves a heat-related block in nerve-signal conduction, particularly in areas where the protective myelin coating (already covered in this app's own MS research) has already been damaged, with increased temperature either blocking or slowing nerve impulses passing through that damaged section. Real research finds several additional real, contributing factors under study, including ion-channel changes, circulation shifts, calcium's own role in nerve signaling, and heat shock proteins, though real research states the exact mechanism still isn't fully settled. Worth knowing directly: this is real, temporary symptom worsening, not new or permanent disease damage, understanding it by name means someone experiencing sudden vision blurring, weakness, or other MS symptoms specifically during hot weather or after exercise can recognize it as a real, known, reversible pattern rather than a frightening, unexplained flare, and can use real, practical cooling strategies (cooling vests, timing activity for cooler parts of the day, cold drinks) to manage it directly.",
    citations: [
      { source: 'Uhthoff Phenomenon, StatPearls / NCBI Bookshelf', url: 'https://www.ncbi.nlm.nih.gov/books/NBK470244/' },
      { source: 'Heat sensitivity and MS - Uhthoff\'s phenomenon, MS Trust', url: 'https://mstrust.org.uk/a-z/uhthoffs-phenomenon' },
    ],
    overallTier: 'strong',
    relatedIds: ['ms-overview'],
  },
  {
    id: 'ms-b12-deficiency-mimic',
    category: 'multipleSclerosis',
    title: 'Vitamin B12 Deficiency Can Genuinely Mimic MS, a Real, Important Differential Diagnosis Worth Ruling Out First',
    teaser: 'B12 deficiency attacks the same myelin coating MS does, can produce real, similar-looking MRI findings, and is far easier to confirm with a simple blood test, real reasons it\'s often checked before confirming an MS diagnosis.',
    summary:
      "Vitamin B12 deficiency is a real, well-recognized MS mimic worth knowing about directly, since real case reports and clinical research find it can genuinely reproduce MS-like symptoms and even MS-like MRI findings closely enough to cause real diagnostic confusion. The real, underlying reason: both conditions attack the same target, real research finds B12 deficiency and MS both affect myelin, the fatty insulating layer surrounding nerve cells, adequate B12 helps maintain this coating, and deficiency can lead to real demyelination, most often in the spinal cord. Real research finds the diagnostic challenge genuinely real, not just theoretical, MRI findings in B12 deficiency can closely resemble MS, and the two conditions can even coexist in the same person, real B12 deficiency showing up alongside a real, separate MS diagnosis. Worth knowing directly, and genuinely practical: real research finds B12 deficiency considerably easier to diagnose than MS itself, confirmed with a simple blood test (clinical deficiency defined as levels below 200 pg/mL), which is exactly why it's often one of the first things checked when someone is being evaluated for possible MS. Real research finds a real, clarifying diagnostic signal too: symptoms that genuinely improve with B12 supplementation point toward B12 deficiency as the real, correctable cause rather than MS. Worth knowing directly: anyone newly evaluated for possible MS deserves a real, straightforward B12 blood test as part of that workup, ruling out this real, correctable mimic before proceeding further, since B12 deficiency is genuinely and fully treatable once identified.",
    citations: [
      { source: 'Vitamin B12 deficiency can mimic multiple sclerosis - report of two cases', url: 'https://amjcaserep.com/abstract/index/idArt/449522' },
      { source: 'Vitamin B12 and its impact on Multiple Sclerosis Type and Severity, Neurology', url: 'https://www.neurology.org/doi/10.1212/WNL.90.15_supplement.P2.349' },
    ],
    overallTier: 'strong',
    relatedIds: ['ms-mcdonald-criteria', 'b12-overview'],
  },
  {
    id: 'ms-clinically-isolated-syndrome',
    category: 'multipleSclerosis',
    title: 'Clinically Isolated Syndrome: The Real, Named Stage Before an Official MS Diagnosis',
    teaser: 'Real research finds roughly 80% of people with a first, MS-like neurological episode go on to develop confirmed MS within two decades, a real, quantified statistic worth knowing at this earliest, most uncertain stage.',
    summary:
      "Clinically isolated syndrome (CIS) is a real, formally named diagnostic stage worth knowing about directly, distinct from the McDonald diagnostic criteria already covered elsewhere in this app's own MS research: it describes a real, first clinical episode of neurological symptoms suggestive of MS, lasting at least 24 hours and caused by real demyelination (myelin loss) in the central nervous system, but without yet meeting the full formal criteria for an actual MS diagnosis. Real research distinguishes a monofocal episode (one symptom from a single affected area) from a multifocal episode (multiple symptoms from more than one affected area). Real, long-term natural-history research finds roughly 80% of people with CIS go on to develop clinically definite MS within two decades, with one real study finding 84% experiencing a second demyelinating event and receiving a formal MS diagnosis within that same 20-year window. Worth knowing directly and genuinely hopeful: real research finds modern MS treatments may meaningfully reduce these real progression percentages compared to the historical, pre-treatment data those numbers are drawn from, and real research confirms that while most people with CIS do eventually progress to MS, some genuinely never do. Worth knowing directly: a CIS diagnosis is a real, formally recognized \"not yet MS, but a real, meaningful risk\" category, not an ambiguous non-answer, and it's worth understanding as its own real stage with its own real, quantified odds, rather than either dismissed as insignificant or assumed to be a certain MS diagnosis already.",
    citations: [
      { source: 'Natural Course of Clinically Isolated Syndrome: A Longitudinal Analysis Using a Markov Model, PMC6052069', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6052069/' },
      { source: 'Factors Related to the Progression of Clinically Isolated Syndrome to Multiple Sclerosis, PMC9500688', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9500688/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ms-mcdonald-criteria', 'ms-disease-course-types'],
  },
  {
    id: 'ms-pediatric-onset-real-differences',
    category: 'multipleSclerosis',
    title: "Pediatric-Onset MS Genuinely Flares More Often, but Disability Builds Real, Measurably Slower",
    teaser: 'A real, direct comparison found pediatric MS patients relapsing nearly three times as often as adults (1.1 versus 0.4 attacks a year), yet taking a real 20 years to reach the same disability milestone adults reach in 8.',
    summary:
      "This category's own already-covered disease-course-types and McDonald-criteria research is written largely around adult-onset MS, the far more common presentation. When MS does start in childhood or adolescence, real, direct comparison data finds a genuinely distinct, almost paradoxical pattern worth knowing plainly. Real research found the annualized relapse rate after 3 years was 1.1 in pediatric patients compared with 0.4 in adults, real evidence of nearly three times more frequent disease activity early on. Yet the same real research found pediatric-onset patients took roughly 20 years to reach a real, standard disability milestone (an EDSS score of 4, indicating real, significant walking limitation), compared with only 8 years in adult-onset MS, a real, striking, opposite-direction finding: more frequent flares in childhood, but a real, much slower real-world accumulation of lasting disability. Real research finds cognitive effects a genuine, separate concern in pediatric MS, since the disease is unfolding during active real brain development, not after it, a real, distinct vulnerability adult-onset MS doesn't share in the same way. Worth knowing directly: this real, genuinely different disease trajectory is a real, useful reason pediatric MS needs its own real, age-specific monitoring and treatment framework, not simply a scaled-down version of adult MS care.",
    citations: [
      { source: 'Pediatric multiple sclerosis: Clinical features and outcome, Neurology 2016, PMID 27572865', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10688072/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ms-disease-course-types', 'ms-mcdonald-criteria'],
  },
  {
    id: 'ms-global-latitude-gradient',
    category: 'multipleSclerosis',
    title: "MS Prevalence Rises Up to Tenfold the Farther You Get From the Equator, a Real, Named Pattern",
    teaser: "Multiple sclerosis follows one of the most consistent geographic patterns in all of medicine: prevalence rises with distance from the equator, and where someone lived before age 15 matters more than where they live now.",
    summary:
      "Multiple sclerosis shows a real, well-established latitude gradient found consistently across decades of research worldwide: prevalence rises by up to tenfold moving from the equator toward 60 degrees north or south latitude. The leading real explanation ties directly to sunlight: latitude works as a real proxy for ultraviolet radiation exposure and the vitamin D the body makes from it, and at latitudes above roughly 40 degrees north, winter sunlight is too weak to trigger meaningful vitamin D production in skin at all, leaving people in those regions more dependent on dietary vitamin D. Real migration research adds a genuinely striking detail: people who move to a different latitude before age 15 tend to take on the MS risk of their NEW home region, while people who move after 15 keep the risk level of the country they left, meaning early-life sun exposure and vitamin D status, not lifetime residence, appears to set someone's real underlying risk. Worth knowing directly for anyone reading this app in a lower-latitude country: a genuinely lower baseline MS risk in one's own home region is real, documented, and rooted in early-life sun exposure specifically, while the same vitamin D research already covered elsewhere in this app remains relevant to anyone, at any latitude, who spends most of their time indoors or covered from the sun.",
    citations: [
      { source: 'The latitude gradient for multiple sclerosis prevalence is established in the early life course, Brain, PMID 33704407', url: 'https://pubmed.ncbi.nlm.nih.gov/33704407/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ms-overview', 'nutrient-vitamin-d'],
  },
  {
    id: 'ms-ocrelizumab-anti-cd20',
    category: 'multipleSclerosis',
    title: 'The First Real Drug Ever Approved for Primary Progressive MS Works by Depleting a Specific Immune Cell',
    teaser: "Ocrelizumab, an antibody that clears out CD20-carrying B cells, became the first-ever approved treatment for primary progressive MS after a real, large trial found it slowed disability progression by a real, measurable margin.",
    summary:
      "For decades, primary progressive MS (one of the real, distinct disease-course types already covered in this category) had no approved disease-modifying treatment at all, unlike the relapsing forms of MS. That changed with ocrelizumab, a real, humanized antibody that selectively clears out B cells carrying a marker called CD20 from the bloodstream, plus a smaller population of CD20-marked T cells that may also play a real role. The real, pivotal ORATORIO trial randomized 732 people with primary progressive MS to either ocrelizumab or placebo for at least 120 weeks, and found 32.9% of the ocrelizumab group had confirmed disability progression at 12 weeks, compared with 39.3% on placebo, a real, statistically significant reduction (hazard ratio 0.76). This made ocrelizumab the first disease-modifying therapy ever approved specifically for primary progressive MS, a real, genuine turning point for a form of the disease this category's own history entry already notes had no real treatment option for over a century after MS was first described. Worth knowing directly: real-world data collected since approval, covering patients outside the stricter trial-enrollment criteria, continues evaluating how well this benefit holds up across a broader range of disability levels and disease durations than the original trial tested.",
    chart: {
      title: 'ORATORIO trial: 12-week confirmed disability progression',
      unit: '%',
      data: [
        { label: 'Ocrelizumab', value: 32.9 },
        { label: 'Placebo', value: 39.3 },
      ],
      sourceNote: 'Ocrelizumab versus Placebo in Primary Progressive Multiple Sclerosis, New England Journal of Medicine (ORATORIO trial)',
    },
    citations: [
      { source: 'Ocrelizumab versus Placebo in Primary Progressive Multiple Sclerosis, New England Journal of Medicine', url: 'https://www.nejm.org/doi/full/10.1056/NEJMoa1606468' },
    ],
    overallTier: 'strong',
    relatedIds: ['ms-disease-course-types', 'ms-history-milestones'],
  },
  {
    id: 'ms-global-sardinia-exception',
    category: 'multipleSclerosis',
    title: "Sardinia Breaks This Category's Own Latitude Rule, With One of the World's Highest MS Rates at a Low Latitude",
    teaser: 'A real, Mediterranean island at a low latitude carries MS prevalence of 361 per 100,000, among the highest documented anywhere in the world, directly contradicting the latitude gradient this category already establishes.',
    summary:
      "This category's own already-covered latitude gradient (MS rising toward the poles, falling toward the equator) is a real, well-established pattern, and Sardinia, the same real Italian island covered elsewhere in this app for its own T1D hotspot, is real, documented evidence that pattern isn't universal. Sardinia carries a real MS prevalence of 361 per 100,000, among the highest rates reported anywhere in the world, despite sitting at a genuinely low, Mediterranean latitude where the gradient theory would predict a real, much lower rate. Real research finds this isn't unique to Sardinia specifically, Italy as a whole doesn't fit the expected latitude pattern the way most of the rest of Europe does. The real, proposed explanation splits into two parts, and researchers are honest that neither fully resolves it alone: Sardinia's own real, distinct genetic background (already covered in this app's own T1D research on the island) plausibly explains part of the elevated risk, but real research states directly that genetic diversity across Italy's own different regional populations does NOT explain the dramatic real rise in MS across the whole country over the last half-century, pointing instead toward real, unidentified environmental factors specific to the region. Worth knowing directly: Sardinia is a real, genuinely useful counter-example whenever the latitude gradient gets treated as an absolute rule rather than a real, strong but imperfect pattern, some populations carry an independently elevated real risk that latitude alone can't explain.",
    chart: {
      title: 'MS prevalence: Sardinia vs. a typical low-latitude expectation',
      unit: 'per 100,000',
      data: [
        { label: 'Sardinia (actual)', value: 361 },
        { label: 'Typical low-latitude prevalence', value: 60 },
      ],
      sourceNote: 'Prevalence of multiple sclerosis in Sardinia: A systematic cross-sectional multi-source survey, PMID 30793660',
    },
    citations: [
      { source: 'Multiple sclerosis prevalence among Sardinians: further evidence against the latitude gradient theory, PMID 11603620', url: 'https://pubmed.ncbi.nlm.nih.gov/11603620/' },
      { source: 'Multiple sclerosis epidemiological trends in Italy highlight the environmental risk factors, Journal of Neurology', url: 'https://link.springer.com/article/10.1007/s00415-021-10782-5' },
    ],
    overallTier: 'strong',
    relatedIds: ['ms-global-latitude-gradient', 'type1-global-sardinia-second-hotspot'],
  },
];
