import type { DigestEntry } from './types';

// Fatty Liver Disease (MASLD, formerly NAFLD) -- 10 entries, added
// 2026-08-08 as this app's thirteenth real condition, and its third
// genuinely non-autoimmune one (after PCOS and Chronic Kidney Disease).
// MASLD (metabolic dysfunction-associated steatotic liver disease) is a
// real, common condition, fat accumulating in liver cells unrelated to
// heavy alcohol use, named directly in CLAUDE.md's own Beyond Hashimoto's
// research as one of the "9 non-autoimmune candidates."
//
// A substantial amount of real, directly relevant content already
// existed in this app BEFORE this category was built, all written for a
// Hashimoto's reader in organSystems.ts (organ-liver-t4t3-conversion,
// organ-liver-hashimotos-damage, organ-liver-nafld-link,
// organ-liver-fixing-helps-thyroid, organ-liver-autoimmune-overlap) and
// foodAdditives.ts (additive-hfcs). This category cross-links to all of
// them rather than duplicating their content, and covers MASLD as its
// own real, primary condition -- including a genuinely elegant thread
// this app's own thyroid focus makes newly visible: the first-ever
// FDA-approved MASH drug (resmetirom) works specifically as a thyroid
// hormone receptor agonist, a direct mechanistic echo of this app's own
// already-established finding that reduced thyroid hormone availability
// itself drives fat accumulation in liver cells.
//
// Every citation here was independently verified via WebSearch before
// being written in.
export const FATTY_LIVER_DISEASE_ENTRIES: DigestEntry[] = [
  {
    id: 'masld-overview',
    category: 'fattyLiverDisease',
    title: 'MASLD: A Common Condition With a Recently Renamed, More Precise Identity',
    teaser: 'The name changed for a deliberate reason, to stop defining the disease by what it isn\'t (alcohol) and start naming what it actually is.',
    summary: "MASLD (metabolic dysfunction-associated steatotic liver disease) is the current, more precise name for what used to be called NAFLD (non-alcoholic fatty liver disease), fat accumulating in liver cells for reasons unrelated to heavy alcohol use. The rename, adopted by major hepatology societies, reflects a deliberate shift: rather than defining the disease by what it isn't (alcohol-related), the new name centers what it actually is, a condition driven by identifiable metabolic risk factors (insulin resistance, elevated triglycerides, high blood pressure, excess weight, most centrally). MASLD ranges in severity from simple fat accumulation (steatosis alone) to MASH (metabolic dysfunction-associated steatohepatitis, involving inflammation and cell damage), which can progress further to fibrosis and, in advanced cases, cirrhosis. A separate diagnostic category, MetALD, now exists specifically for people whose liver disease involves both metabolic risk factors and moderate alcohol intake at once, covered directly in this category's own dedicated entry. This category covers what's specific to actually managing MASLD, and cross-links throughout to the already-substantial, Hashimoto's-focused liver research rather than repeating it.",
    citations: [
      { source: 'Steatotic Liver Disease, MedlinePlus, U.S. National Library of Medicine', url: 'https://medlineplus.gov/steatoticliverdisease.html' },
    ],
    overallTier: 'strong',
    relatedIds: ['organ-liver-t4t3-conversion', 'organ-liver-hashimotos-damage', 'organ-liver-nafld-link', 'organ-liver-fixing-helps-thyroid', 'type2-overview', 'type2-metabolic-syndrome-cluster', 'choline-deficiency-liver'],
  },
  {
    id: 'masld-weight-loss-thresholds',
    category: 'fattyLiverDisease',
    title: 'Weight Loss and MASLD: A Specific, Dose-Dependent Staircase of Benefit',
    teaser: 'Not one target number. A graded series of thresholds, each one unlocking a different kind of measured improvement.',
    summary:
      "MASLD's own best-established treatment is weight loss, and the evidence behind it is unusually specific: a systematic review and meta-analysis found weight loss of more than 3% of body weight associated with significantly improved liver histology and MASH resolution, regardless of a person's starting BMI, diabetes status, or ethnicity. The benefit then climbs in a graded staircase from there: sustained weight loss of 5% or more measurably reduces liver fat itself, 7% or more improves the actual inflammation and cell-damage component (necroinflammation), and 10% or more is associated with stabilization or reversal of fibrosis, scarring that would otherwise be considered largely one-directional. The highest rates of complete MASH resolution and fibrosis regression occur specifically in patients who reach that 10%-or-greater threshold. Worth knowing directly as an honest, motivating framework: even a modest 3% weight loss is not a consolation prize, it's the specific, evidence-backed threshold where histological benefit reliably begins.",
    citations: [
      { source: 'The Impact of Body Weight Change on Liver Histology in Metabolic Dysfunction-Associated Steatotic Liver Disease Across Various Histological Endpoints: A Systematic Review and Meta-Analysis, PMID 41510965', url: 'https://pubmed.ncbi.nlm.nih.gov/41510965/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'masld-mediterranean-diet',
    category: 'fattyLiverDisease',
    title: 'The Mediterranean Diet: Randomized Trial Evidence, With an Honest Nuance About What It\'s Actually Competing Against',
    teaser: 'A head-to-head trial found the Mediterranean diet worked. It also found a plainer low-fat diet worked just as well.',
    summary:
      "A randomized controlled trial (250 adults with MASLD, 12 weeks) directly compared a moderately calorie-reduced Mediterranean diet against a low-fat diet and found both approaches similarly effective at reducing liver fat (steatosis) and fibrosis, with no difference based on a person's own PNPLA3 genotype (a gene variant linked to MASLD risk). A separate, systematic review and meta-analysis reached the same honest conclusion: no significant difference between the Mediterranean diet and a low-fat diet in improving liver enzymes, liver fat, or related markers in MASLD, both working roughly equally well in the short term. This is a useful, honest nuance rather than a disappointing finding: weight loss and overall dietary quality both diets share (food, reduced calories, less ultra-processed intake) appear to be the actual driving mechanism behind the measured improvement, not something unique to the Mediterranean pattern specifically. A person doesn't need to follow the Mediterranean diet exactly to get a comparable benefit, a calorie-appropriate, whole-food, low-fat approach works about as well.",
    citations: [
      { source: 'Mediterranean and low-fat diets are equally effective in MASLD resolution at 12 weeks regardless of PNPLA3 genotype: A randomized controlled trial, PMID 41284948', url: 'https://pubmed.ncbi.nlm.nih.gov/41284948/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'masld-coffee-protective',
    category: 'fattyLiverDisease',
    title: 'Coffee: A Consistently Protective Association Across Multiple Independent Studies',
    teaser: 'One of the more consistently positive findings anywhere in the food research, for a condition that could use one.',
    summary: "Coffee consumption shows a consistently protective association with MASLD across multiple independent lines of research, more consistent than most food-and-disease relationships the research covers. A systematic review and meta-analysis found coffee drinkers had a 23% lower risk of developing MASLD in the first place, and a separate meta-analysis found coffee consumption associated with 35% lower odds of significant liver fibrosis specifically, a meaningful reduction in the disease's more serious, harder-to-reverse stage. Specific research points toward 2 to 4 cups of drip coffee a day as the range linked to lower liver enzyme levels, slower fibrosis progression, and lower liver-related mortality. The likely mechanism involves more than just caffeine: chlorogenic acid, cafestol, and kahweol, antioxidant compounds coffee also contains, appear to help reduce triglyceride and cholesterol buildup in liver cells directly, alongside caffeine's own separate effect of reducing a signaling molecule (TGF-beta) involved in liver scarring. Worth knowing directly as one of the more reliably positive, low-effort findings in this whole category.",
    citations: [
      { source: 'Effect of Coffee Consumption on Non-Alcoholic Fatty Liver Disease Incidence, Prevalence and Risk of Significant Liver Fibrosis: Systematic Review with Meta-Analysis of Observational Studies, PMID 34578919', url: 'https://pubmed.ncbi.nlm.nih.gov/34578919/' },
    ],
    overallTier: 'strong',
    relatedIds: ['problem-coffee-timing', 'gout-coffee-inverse'],
  },
  {
    id: 'masld-hfcs-fructose',
    category: 'fattyLiverDisease',
    title: 'Fructose and MASLD: Why The General HFCS Research Applies Here With Extra Force',
    teaser: 'A finding already covered from a general-nutrition angle takes on direct significance once liver disease is the actual condition being managed.',
    summary: "The Food Additives research already covers an important mechanistic distinction: unlike glucose, which nearly every cell in the body can use directly, dietary fructose is metabolized almost entirely in the liver, and at high intake, a meaningful share of it converts directly to fat there. For MASLD specifically, this isn't background information, it's a direct, central mechanism, since high-fructose corn syrup and other concentrated fructose sources place additional metabolic burden on the exact organ already under strain. Controlled human research backs this up with a dose-response relationship: as fructose intake from sweetened beverages rises, measured liver fat and insulin resistance rise together in a graded pattern, not just at extreme intake levels. For anyone managing MASLD specifically, this is a case where a general nutrition finding (already covered in the broader research) deserves elevated priority, not the same weight it would carry for someone without liver disease already in the picture.",
    citations: [
      { source: 'Softic S, et al., Critical Reviews in Clinical Laboratory Sciences, 2020, "Fructose and hepatic insulin resistance"', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7774304/' },
    ],
    overallTier: 'strong',
    relatedIds: ['additive-hfcs', 'mito-sugar-visceral-fat-cytokine-chain'],
  },
  {
    id: 'masld-metald-alcohol-threshold',
    category: 'fattyLiverDisease',
    title: 'Alcohol and MASLD: A Contested Threshold Question, Not a Clean Line',
    teaser: 'MASLD is defined by NOT being alcohol-related. Research on moderate drinking within that same population turns out surprisingly unsettled.',
    summary:
      "MASLD is defined specifically by fat accumulation NOT explained by heavy alcohol use, but a contested question remains open within that same population: does moderate drinking still matter? A newly created diagnostic category, MetALD, now exists specifically to capture people with metabolic risk factors for MASLD who also drink moderately, defined by specific gram-per-day or drinks-per-week thresholds that differ depending on which clinical source is consulted, a sign the boundary itself is still being worked out rather than firmly settled. Research specifically looking at low-to-moderate drinking within MASLD populations has found it associated with increased fibrosis, a direct challenge to the older, more casual assumption that only heavy drinking matters once someone already has MASLD. The honest, current picture: international guidelines increasingly recommend alcohol restriction or abstinence for anyone with steatotic liver disease and metabolic risk factors, regardless of amount, even though the exact threshold at which risk begins remains an unresolved, actively studied question rather than a single agreed-upon number.",
    citations: [
      { source: 'MetALD: New Perspectives on an Old Overlooked Disease', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11967760/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['lifestyle-alcohol-advisory', 'lifestyle-alcohol-gbd-no-safe-level'],
  },
  {
    id: 'masld-resmetirom',
    category: 'fattyLiverDisease',
    title: 'Resmetirom: The First-Ever Approved MASH Drug, and It Works Through Thyroid Hormone Receptors Directly',
    teaser: 'A elegant, direct echo of the thyroid-hormone-and-liver research: the first MASH medication works by mimicking thyroid hormone\'s own effect on the liver.',
    summary: "Resmetirom (Rezdiffra) became the first medication ever approved by the FDA specifically for MASH, on March 14, 2024, a historic milestone for a disease that had no approved pharmacologic treatment at all before this. Its specific mechanism connects directly and elegantly to the already-established liver research: resmetirom is a thyroid hormone receptor-beta agonist, meaning it selectively activates the same receptor pathway thyroid hormone itself uses in liver cells, without the broader body-wide effects of actual thyroid hormone. This is a direct, working echo of the already-documented finding that reduced thyroid hormone availability shifts the liver toward storing fat rather than burning it, resmetirom essentially restores that specific, liver-localized signal pharmacologically. The pivotal MAESTRO-NASH trial supporting its approval found measured MASH resolution and fibrosis improvement without the disease worsening on the more traditional activity score. Approved specifically for use alongside diet and exercise, not as a replacement for them, in adults with moderate-to-advanced fibrosis.",
    citations: [
      { source: 'Resmetirom: First Approval, PMID 38771485', url: 'https://pubmed.ncbi.nlm.nih.gov/38771485/' },
    ],
    overallTier: 'strong',
    relatedIds: ['organ-liver-nafld-link'],
  },
  {
    id: 'masld-semaglutide-essence',
    category: 'fattyLiverDisease',
    title: 'Semaglutide: A Large, Recent Trial Found It Resolves Steatohepatitis in Most Patients',
    teaser: 'A major trial found nearly two out of three patients on this medication achieved a biopsy-confirmed resolution of active liver inflammation.',
    summary:
      "Semaglutide (a GLP-1 receptor agonist, already widely known for its weight-loss and diabetes effects) showed a striking benefit specifically for MASH in the large, recent ESSENCE trial (1,197 patients). At 72 weeks, 62.9% of patients on semaglutide achieved biopsy-confirmed resolution of steatohepatitis with no worsening of fibrosis, compared to 34.3% on placebo, and 36.8% showed improvement in fibrosis itself with no worsening of steatohepatitis, versus 22.4% on placebo. A combined outcome (both steatohepatitis resolution AND fibrosis improvement together) was reached by 32.8% on semaglutide versus 16.2% on placebo. Average weight loss in the treated group was a substantial 10.5%, directly connecting to this category's own dedicated entry on weight loss's own dose-dependent benefit. Published in the New England Journal of Medicine in 2025, this is current, large-scale evidence, not a small early signal, for a medication already reaching wide use for its other established purposes.",
    citations: [
      { source: 'Phase 3 ESSENCE Trial: Semaglutide in Metabolic Dysfunction-Associated Steatohepatitis', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11784563/' },
    ],
    overallTier: 'strong',
    relatedIds: ['masld-weight-loss-thresholds', 'type2-glp1-sglt2-paradigm-shift'],
  },
  {
    id: 'masld-fib4-fibrosis-screening',
    category: 'fattyLiverDisease',
    title: 'FIB-4: A Simple Blood-Test-Based Way to Screen for Advanced Liver Scarring Without a Biopsy',
    teaser: 'A calculable score from routine labs already drawn for other reasons, useful for ruling out the more serious stage of MASLD.',
    summary:
      "FIB-4 (Fibrosis-4 Index) is a well-validated, non-invasive screening tool for advanced liver fibrosis, calculated from four ordinary values many people already have on file: age, AST, ALT, and platelet count, no special test or liver biopsy required to get a first answer. Clinical guidance recommends FIB-4 specifically as a first-line screening step because of its high negative predictive value, meaning a low score is reassuring at ruling out advanced fibrosis, while a result in the indeterminate range (roughly 1.3 to 2.67) or a high score calls for further evaluation with a more specialized tool, most often vibration-controlled transient elastography (FibroScan) or an Enhanced Liver Fibrosis blood test. A honest limitation: FIB-4's own accuracy has shown inconsistency in some studies, especially in the general population rather than a clinical MASLD cohort, so a concerning result is a meaningful reason to pursue further testing, not treated as a final answer on its own either way. Worth asking directly whether this low-cost first screening step has been calculated from labs already drawn, since it often can be without a single new test.",
    citations: [
      { source: 'Diagnostic role of the fibrosis-4 index and nonalcoholic fatty liver disease fibrosis score as a noninvasive tool for liver fibrosis scoring', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11521016/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'masld-tying-together',
    category: 'fattyLiverDisease',
    title: 'What Actually Holds Up for MASLD, Pulled Together',
    teaser: 'A graded weight-loss staircase, coffee as one of the most consistently positive findings anywhere, and an elegant thyroid-hormone connection tying the whole category back to the core focus.',
    summary: "Line up everything in this category and MASLD reads as a condition where specific numbers replace vague advice at nearly every turn. Weight loss isn't just \"recommended,\" it's a graded staircase (3% for histological benefit to begin, 10% for the strongest fibrosis regression). The Mediterranean diet works, and so, honestly, does a plainer low-fat diet, evidence pointing toward overall dietary quality and weight loss as the actual driving mechanism rather than one specific pattern. Coffee stands out as one of the more consistently positive, low-effort findings in the whole research base, while fructose-heavy sweeteners deserve elevated caution specifically because of MASLD's own already-strained liver. Two medication stories, resmetirom and semaglutide, both reached patients only very recently and both carry substantial trial evidence behind them, resmetirom's own thyroid-hormone-receptor mechanism forming an elegant, direct link back to the core focus. And FIB-4 offers a low-cost way to know where someone actually stands, often without a single new test.",
    citations: [
      { source: 'Steatotic Liver Disease, MedlinePlus, U.S. National Library of Medicine', url: 'https://medlineplus.gov/steatoticliverdisease.html' },
    ],
    overallTier: 'strong',
    relatedIds: ['masld-weight-loss-thresholds', 'masld-coffee-protective', 'masld-resmetirom', 'masld-semaglutide-essence', 'masld-fib4-fibrosis-screening'],
  },

  // -- Full-depth parity additions, 2026-08-08. Every citation
  // independently verified via WebSearch.
  {
    id: 'masld-f0-f4-fibrosis-staging',
    category: 'fattyLiverDisease',
    title: "MASLD's Fibrosis Staging: F0 Through F4, and a Reassuring Fact About How Much of It Is Reversible",
    teaser: '94% of MASLD stays in a still-reversible stage. The turning point most people should know about is F2, not F4.',
    summary: "MASLD's own liver-scarring progression is staged F0 through F4 using the METAVIR system, already reachable through the FIB-4 screening the self-advocacy content already covers: F0 (no fibrosis), F1 (portal fibrosis, no bridging), F2 (fibrosis with a few connecting septa), F3 (extensive septa, not yet cirrhosis), and F4 (cirrhosis). The most useful clinical marker isn't F4, it's F2: guidance treats F2 as the point clinically significant fibrosis begins, the threshold where active treatment typically starts. The reassuring fact: progression through F0-F3 is considered fully reversible, and research finds roughly 94% of the MASLD population sits in this still-reversible range; only 5-6% of cases progress all the way to F4 cirrhosis, where the clinical goal shifts from reversal to managing complications (portal hypertension, liver cancer surveillance). Research finds fibrosis itself progresses in 20-30% of MASLD patients over 10-20 years, fastest specifically in those with diabetes, obesity, and already-elevated liver enzymes, a direct reason the weight-loss and metabolic research matters as much as it does for this specific condition.",
    citations: [
      { source: 'Progression to Decompensation of Severe Fibrosis Compared to Cirrhosis in MASLD: A Systematic Review and Meta-Analysis, PMC12811796', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12811796/' },
    ],
    overallTier: 'strong',
    relatedIds: ['masld-fib4-fibrosis-screening'],
  },
  {
    id: 'masld-systemic-cvd-ckd-real-data',
    category: 'fattyLiverDisease',
    title: "MASLD Reaches Well Past the Liver, Independent Cardiovascular and Kidney Risk, Not Just a Byproduct of Shared Risk Factors",
    teaser: 'MASLD is an independent cardiovascular risk factor in its own right, and fibrosis stage specifically is the strongest predictor of that risk, not the liver-fat amount itself.',
    summary: "MASLD's own systemic reach is substantial: research finds it a global condition affecting over 31% of people worldwide, and an independent risk factor for cardiovascular disease, chronic kidney disease, several cancers, and sleep apnea, not merely a downstream effect of the shared metabolic risk factors (obesity, insulin resistance) already covered elsewhere. The specific finding: fibrosis STAGE, not the raw amount of liver fat, is the strongest disease-specific predictor of cardiovascular risk, a direct reason the F0-F4 staging above matters beyond the liver itself. Documented mechanisms driving this wide reach include systemic inflammation, gut dysbiosis with metabolic endotoxemia (a direct link to the Gut & Microbiome research), and atherogenic dyslipidemia, already covered in the cholesterol research. A specific connection: epicardial fat thickness (fat surrounding the heart itself) correlates directly with both sleep-apnea severity and liver damage in MASLD patients, a physical link between three seemingly separate systems.",
    citations: [
      { source: 'Systemic impacts of metabolic dysfunction-associated steatotic liver disease (MASLD) and metabolic dysfunction-associated steatohepatitis (MASH) on heart, muscle, and kidney related diseases, PMID 39086662', url: 'https://pubmed.ncbi.nlm.nih.gov/39086662/' },
    ],
    overallTier: 'strong',
    relatedIds: ['type2-metabolic-syndrome-cluster', 'masld-statin-safety-myth'],
  },
  {
    id: 'masld-history-milestones',
    category: 'fattyLiverDisease',
    title: "MASLD's Own Recent History: Named Three Times in Under 45 Years",
    teaser: '1980, 1986, 2023, a fast naming history compared to most conditions, reflecting how recently the metabolic mechanism itself was actually understood.',
    summary: "MASLD's own history is short and fast-moving compared to most conditions. In 1980, pathologist Jurgen Ludwig and colleagues first described \"non-alcoholic steatohepatitis,\" liver damage that looked identical to alcohol-related liver disease under a microscope, in patients who denied heavy alcohol use. In 1986, Shaffer and Thaler formally coined \"non-alcoholic fatty liver disease\" (NAFLD) as the broader umbrella term. Understanding of WHY it happens came later: insulin resistance and hyperinsulinemia were first linked to fatty liver in 1998, and metabolic syndrome specifically in 1999, the scientific foundation the already-established metabolic-syndrome-cluster research builds on. The most recent turning point came in June 2023: a supermajority vote among over 200 physicians, public health experts, and patient advocates renamed the condition MASLD (metabolic dysfunction-associated steatotic liver disease), a deliberate move away from \"non-alcoholic,\" a name defined by what the condition ISN'T, and toward naming its actual metabolic cause directly, while also reducing stigma tied to the words \"alcohol\" and \"fatty.\"",
    citations: [
      { source: 'From NAFLD to MASLD: what does it mean?', url: 'https://www.tandfonline.com/doi/full/10.1080/17474124.2024.2374472' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'masld-pregnancy-real-outcomes',
    category: 'fattyLiverDisease',
    title: "MASLD in Pregnancy: Quantified Elevated Risk, and an Important Distinction From a Different, Rare Emergency",
    teaser: 'Research finds a 3-fold higher gestational diabetes rate with MASLD, and a direct reassurance: MASLD does NOT raise the risk of a separate, much rarer condition people sometimes confuse it with.',
    summary:
      "MASLD during pregnancy carries quantified elevated risk. Research finds gestational diabetes occurring in 23% of pregnancies with MASLD versus 7-8% without, alongside elevated rates of hypertensive complications (16% vs. 4%), postpartum hemorrhage, and preterm birth, together adding up to research finding more than 4 times the risk of serious adverse maternal-fetal outcomes overall. Additional research finds MASLD during pregnancy is itself a risk factor for large-for-gestational-age birthweight, and MASLD prevalence in pregnancy has nearly tripled in tracked data, from 10.5 to 28.9 per 100,000 pregnancies between 2007 and 2015. The single most important direct reassurance: MASLD does NOT raise the risk of acute fatty liver of pregnancy (AFLP), a different, rare, third-trimester emergency with its own distinct cause, research finds no established link between the two despite the similar-sounding names, an important distinction worth knowing to avoid needless worry about a separate condition that isn't actually connected.",
    citations: [
      { source: 'Non-alcoholic fatty liver disease in pregnancy is associated with adverse maternal and perinatal outcomes, PMID 32531415', url: 'https://pubmed.ncbi.nlm.nih.gov/32531415/' },
    ],
    overallTier: 'strong',
  },

  // -- Second depth pass, 2026-08-08, continuing the full-parity work
  // beyond the first structural pass. Every citation independently
  // verified via WebSearch.
  {
    id: 'masld-pnpla3-genetic-risk',
    category: 'fattyLiverDisease',
    title: 'A Single Gene Variant Nearly Triples MASLD Risk, and Its Effect Gets Dramatically Worse With Alcohol, Obesity, or T2D',
    teaser: "The PNPLA3 gene variant is a textbook example of gene-environment interaction: carrying it alone raises risk, but combining it with alcohol, obesity, or diabetes amplifies that risk dramatically further.",
    summary: "A specific, single-letter change in the PNPLA3 gene (called I148M, swapping one amino acid for another at position 148) is one of the most consistently replicated genetic risk factors for MASLD found anywhere in the research. Pooled data finds carrying two copies of the risk variant associated with a 2.76-fold higher odds of fatty liver, and a striking 4.44-fold higher odds of MASH specifically (the more serious inflammatory form already covered in the fibrosis-staging research), compared to carrying no copies. The mechanism: the altered enzyme has reduced activity, causing fat to accumulate in liver cells rather than being processed normally. The most important practical fact: this variant is described directly in the literature as a textbook case of gene-environment interaction, its effect on liver damage is dramatically amplified specifically by alcohol consumption, obesity, and type 2 diabetes, meaning the same genetic risk plays out very differently depending on modifiable lifestyle factors layered on top of it. For anyone with a family history of fatty liver disease or cirrhosis at a relatively young age, genetic testing for this variant exists, and a positive result is a concrete reason to be more conservative about alcohol and weight specifically, not just general advice.",
    citations: [
      { source: 'PNPLA3 gene, MedlinePlus Genetics', url: 'https://medlineplus.gov/genetics/gene/pnpla3/' },
    ],
    overallTier: 'strong',
    relatedIds: ['masld-metald-alcohol-threshold', 'masld-f0-f4-fibrosis-staging'],
  },

  // -- Volumetric depth pass, 2026-08-08, continuing full-parity work
  // beyond the second structural depth pass, working toward Hashimoto's
  // own real 176-entry depth. Every citation independently verified via
  // WebSearch.
  {
    id: 'masld-exercise-independent-weight-loss',
    category: 'fattyLiverDisease',
    title: 'Exercise Alone, With No Weight Loss at All, Measurably Reduces Liver Fat',
    teaser: 'A randomized trial found exercise cut liver fat by over 10% with zero change in body weight, and a meta-analysis found exercise 3.5 times more likely to meaningfully reduce liver fat than standard care, independent of weight lost.',
    summary: "This is an encouraging finding worth knowing directly, alongside the already-established, weight-loss-threshold research for MASLD: exercise itself reduces liver fat through a mechanism separate from weight loss. A randomized trial found a structured exercise program reduced intrahepatic (liver) triglyceride content by 10.3% while causing NO significant change in total body weight or body fat percentage, direct evidence that exercise moves the needle on its own. A broader meta-analysis found exercise training 3.5 times more likely to achieve a clinically meaningful liver-fat reduction (30% or more) compared to standard clinical care, independent of weight loss, with a minimum exercise dose (roughly 750 metabolic-equivalent minutes per week, comparable to about 150 minutes of moderate activity) appearing necessary for this effect. Research finds both aerobic and resistance exercise contribute, with aerobic exercise showing a somewhat stronger effect in the current evidence base. This is practical, hopeful information for anyone who finds sustained weight loss difficult, exercise itself is an independent lever on liver fat, not just a supporting tool for weight loss, and it's worth pursuing on its own merits even before or alongside any change on the scale.",
    citations: [
      { source: 'Exercise Training Is Associated With Treatment Response in Liver Fat Content Independent of Clinically Significant Body Weight Loss, PMID 36705333', url: 'https://pubmed.ncbi.nlm.nih.gov/36705333/' },
      { source: 'Positive Effects of Exercise Intervention without Weight Loss and Dietary Changes in NAFLD-Related Clinical Parameters, PMC8466505', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8466505/' },
    ],
    overallTier: 'strong',
    relatedIds: ['masld-weight-loss-thresholds', 'mito-exercise-intensity-inflammation'],
  },
  {
    id: 'masld-vitamin-e-pivens-trial',
    category: 'fattyLiverDisease',
    title: 'A Landmark Trial Found High-Dose Vitamin E Improved Liver Damage in Non-Diabetic NASH',
    teaser: 'The PIVENS trial found vitamin E at 800 IU/day resolved active liver inflammation in 42% of patients versus 18% on placebo, meaningful evidence for a specific, non-diabetic subgroup already covered elsewhere in the medication research.',
    summary: "The PIVENS trial is a landmark, randomized, placebo-controlled study (247 adults with confirmed NASH, no diabetes) directly testing whether vitamin E supplementation could improve actual liver tissue damage, not just lab values. Results found vitamin E at 800 IU daily meeting the trial's own pre-defined histological improvement endpoint in 43% of patients, compared to 19% on placebo, with resolution of NASH itself (active inflammation) achieved in 42% of the vitamin E group versus just 18% on placebo. This connects directly to the vitamin_e_nash medication already tracked elsewhere in the research, giving it a specific, quantified trial behind the recommendation rather than just a name on a list. The PIVENS trial specifically excluded people with diabetes, so this evidence applies most directly to non-diabetic NASH, and a separate trial did find benefit in diabetic NASH patients too, but the strength of evidence in that specific subgroup is generally considered less robust than the original PIVENS population. High-dose vitamin E supplementation also carries its own separate safety considerations worth discussing with a doctor rather than starting on one's own, since sustained high-dose antioxidant supplementation isn't automatically risk-free. This is a meaningful, trial-backed option worth knowing about directly for anyone managing biopsy-confirmed NASH, not just a general \"antioxidants might help\" suggestion.",
    citations: [
      { source: 'Pioglitazone, Vitamin E, or Placebo for Nonalcoholic Steatohepatitis, New England Journal of Medicine', url: 'https://www.nejm.org/doi/full/10.1056/NEJMoa0907929' },
      { source: 'Role of Vitamin E for Nonalcoholic Steatohepatitis in Patients With Type 2 Diabetes: A Randomized Controlled Trial, Diabetes Care', url: 'https://diabetesjournals.org/care/article/42/8/1481/36160/Role-of-Vitamin-E-for-Nonalcoholic-Steatohepatitis' },
    ],
    overallTier: 'strong',
    relatedIds: ['masld-resmetirom'],
  },
  {
    id: 'masld-statin-safety-myth',
    category: 'fattyLiverDisease',
    title: 'Statins Are Safe in Fatty Liver Disease, Despite a Common Myth That Keeps Nearly Half of Eligible Patients Untreated',
    teaser: 'Research finds serious statin-related liver injury is rare regardless of underlying liver disease, and statins may even directly lower liver enzyme levels in MASLD, yet 40-50% of patients who should be on one still aren\'t.',
    summary: "A persistent, and costly myth surrounds statin use in fatty liver disease: many patients and even some clinicians believe statins are unsafe or should be avoided in anyone with liver disease, but research finds the opposite. Studies find people with MASLD and elevated cholesterol are NOT at increased risk of statin-related liver injury compared to anyone else, clinically significant drug-induced liver injury from statins is rare, and elevated liver enzymes above three times the normal upper limit occur in under 1% of treated patients at standard doses. Striking: research finds MASLD patients prescribed a statin showed REDUCTIONS in baseline ALT, AST, and GGT (all standard liver-enzyme measures), not the worsening the myth would predict, alongside statins' own already-well-established cardiovascular benefit covered elsewhere in the statin-evidence research. The practical cost of this myth is substantial: current research finds 40-50% of MASLD patients who meet standard criteria for statin therapy are not receiving it, despite MASLD itself carrying an elevated cardiovascular risk (already covered in the systemic-CVD-CKD research for this condition). A mild, stable elevation in liver enzymes is not, on its own, a reason to withhold a statin from someone with MASLD who otherwise needs one for cardiovascular protection, and this is worth raising directly if a statin has ever been withheld or discontinued specifically because of a fatty liver diagnosis.",
    citations: [
      { source: 'Statin liver safety in non-alcoholic fatty liver disease: A systematic review and metanalysis, British Journal of Clinical Pharmacology', url: 'https://bpspubs.onlinelibrary.wiley.com/doi/10.1111/bcp.14943' },
      { source: 'An Evidence-Based Review of Statin Use in Patients With Nonalcoholic Fatty Liver Disease', url: 'https://journals.sagepub.com/doi/10.1177/1179552218787502' },
    ],
    overallTier: 'strong',
    relatedIds: ['masld-systemic-cvd-ckd-real-data', 'cvd-statin-evidence'],
  },

  // -- Volumetric depth pass batch 4, 2026-08-08, continuing toward
  // genuine volumetric parity with Hashimoto's own depth. Every citation
  // independently verified via WebSearch.
  {
    id: 'masld-sleep-apnea-bidirectional',
    category: 'fattyLiverDisease',
    title: 'MASLD and Sleep Apnea Feed Each Other, Evidence of a Two-Way Street',
    teaser: 'Research finds oxygen-deprivation episodes during sleep apnea directly worsen liver fat, inflammation, and scarring, while MASLD\'s own metabolic disruption can worsen the airway problems driving sleep apnea in return.',
    summary: "MASLD and obstructive sleep apnea (OSA) share a bidirectional relationship, worth knowing about directly as another example of how interconnected metabolic health actually is. Research finds the two conditions share overlapping metabolic and inflammatory pathways, and finds intermittent hypoxia, the repeated, drops in blood oxygen that define sleep apnea, directly promotes worsening liver fat, inflammation, oxidative stress, and fibrosis. Research finds the connection runs the other direction too: the metabolic dysfunction characteristic of MASLD can itself worsen the ventilatory instability and impaired airway muscle control that drive sleep apnea in the first place. Large cohort data (265,452 Korean adults, followed an average of 9.5 years) and cross-sectional research studying patients starting CPAP (the standard sleep-apnea breathing-support treatment) both confirm this measurable overlap, with research finding OSA severity itself independently associated with actual liver tissue damage on biopsy, not just a correlation between two common conditions. This is a worth-raising connection for anyone managing MASLD who also has unexplained daytime fatigue, loud snoring, or witnessed breathing pauses during sleep, sleep apnea screening and treatment may help liver health too, not just sleep quality, and it's a practical extension of the already-established sleep research applied specifically to MASLD.",
    citations: [
      { source: 'Association between metabolic dysfunction-associated steatotic liver disease and obstructive sleep apnea: a nationwide retrospective cohort study, Scientific Reports', url: 'https://www.nature.com/articles/s41598-026-46037-4' },
      { source: 'Obstructive sleep apnea mediates the association between body mass index and MASLD in patients with obesity, Hepatology International', url: 'https://link.springer.com/article/10.1007/s12072-026-11101-8' },
    ],
    overallTier: 'strong',
    relatedIds: ['masld-overview', 'type2-sleep-apnea-glycemic-control'],
  },
  {
    id: 'masld-fiber-intake-real-data',
    category: 'fattyLiverDisease',
    title: 'Specific Fiber-Intake Data: Modest Increases Improve MASLD, Independent of Weight Loss',
    teaser: 'A 6-month trial found raising fiber intake from 19g to 29g a day significantly improved fatty-liver status, and separately reduced a gut-permeability marker (zonulin) at the same time.',
    summary: "Dietary fiber carries specific, quantified evidence for improving MASLD, worth knowing about directly as a concrete, number rather than a vague \"eat more fiber\" suggestion. A 6-month dietary intervention found raising fiber intake from 19 grams a day to 29 grams a day, a modest, achievable increase, produced a measurable improvement in fatty-liver status by the Hamaguchi score, a standard ultrasound-based grading tool. Research finds higher fiber intake linked to lower MASLD risk and reduced liver fat content more broadly, and a randomized controlled trial testing that same 19-to-29 gram increase found it significantly reduced serum zonulin levels (the same gut-permeability marker already covered in the gut-microbiome research) while also improving liver enzyme activity, direct evidence connecting fiber's own gut-barrier benefit to a measurable liver improvement. Dose-specific data finds even 12 grams of added fiber significantly reduced liver steatosis and body mass index in one study, with 24 grams trending toward further steatosis reduction and significantly improving cholesterol and a liver enzyme marker. Research proposes fiber works through enhancing lipid excretion and improving insulin sensitivity, alongside the gut-barrier mechanism above, meaning this is a multi-pathway benefit, and it's one of the more approachable, low-risk dietary changes available for MASLD, directly reinforcing the whole-food, fiber-forward guidance already given elsewhere.",
    citations: [
      { source: 'Impact of a high dietary fiber cemeal intervention on the progression of liver fibrosis in T2DM with MASLD, PMC12434759', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12434759/' },
      { source: 'Gut Permeability Might be Improved by Dietary Fiber in Individuals with NAFLD Undergoing Weight Reduction, PMC6266494', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6266494/' },
    ],
    overallTier: 'strong',
    relatedIds: ['gut-zonulin-gliadin', 'masld-mediterranean-diet'],
  },
  {
    id: 'masld-sarcopenic-obesity',
    category: 'fattyLiverDisease',
    title: 'Sarcopenic Obesity: A Common, and Tricky MASLD Complication Where Muscle Loss and Fat Gain Happen Together',
    teaser: 'Research finds 44% of MASLD patients have sarcopenia, and honest research finds standard weight-loss treatment can make it worse by also reducing muscle mass alongside fat.',
    summary: "Sarcopenic obesity, the simultaneous loss of muscle mass alongside gain of fat tissue, is a common, and underappreciated complication of MASLD. Research finds sarcopenia affecting a striking 44% of MASLD patients, and research finds sarcopenic obesity specifically associated with worse MASLD outcomes than either muscle loss or fat gain alone. Research finds this a self-reinforcing cycle, excess fat tissue can directly damage muscle's own normal function, driving further muscle loss and reduced capacity for the body to rebuild it, which in turn worsens the metabolic dysfunction driving the fatty liver disease itself. Research finds this pattern more common in women, older adults, and those with a higher body fat percentage or waist-to-hip ratio. Worth knowing honestly, and important given the already-established MASLD weight-loss research: research finds a practical tension here, weight loss (the primary MASLD treatment) itself risks further reducing muscle mass if not managed carefully, meaning a well-designed approach needs BOTH caloric management and deliberate resistance exercise (not cardio alone) to protect muscle while losing fat. This is a worth-raising consideration for anyone pursuing weight loss for MASLD, tracking strength and muscle mass, not just the number on the scale, and prioritizing protein intake alongside resistance training, are concrete ways to avoid trading one health problem for another.",
    citations: [
      { source: 'Sarcopenic Obesity in Non-Alcoholic Fatty Liver Disease-The Union of Two Culprits, PMC7914533', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7914533/' },
      { source: 'A cross-sectional study of risk factors associated with sarcopenia in patients with MASLD, PMC11876153', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11876153/' },
    ],
    overallTier: 'strong',
    relatedIds: ['masld-weight-loss-thresholds', 'masld-exercise-independent-weight-loss'],
  },
  {
    id: 'masld-time-restricted-eating',
    category: 'fattyLiverDisease',
    title: 'A Trial Found Eating Within a Shorter Daily Window Reduced Liver Fat, Even Without Cutting Calories',
    teaser: 'A controlled crossover trial found time-restricted eating measurably reduced liver fat and waist circumference in MASLD, without participants actually eating less overall.',
    summary:
      "This category's own research already covers exactly how much weight loss it takes to meaningfully improve MASLD. Time-restricted eating, confining food intake to a shorter daily window (commonly 16 hours of fasting, 8 hours of eating) without necessarily reducing total calories, is a separate, actively-tested lever. A single-blind, randomized crossover trial in people with MASLD found 12 weeks of time-restricted eating produced a measured reduction in liver fat (via an ultrasound-based measurement) alongside reductions in body weight and waist circumference, compared with standard dietary advice, and without a reduction in reported calorie intake, evidence the timing of eating itself may be doing independent work, not just the total amount eaten. Other trials testing different intermittent-fasting patterns (the 5:2 diet, alternate-day fasting) have found broadly similar improvements in liver fat and metabolic markers. Most of this evidence comes from real but still fairly small, short-duration trials, not yet the kind of large, multi-year outcome data this category's own weight-loss-threshold research is built on. It's worth-knowing context for anyone who finds a specific eating WINDOW more sustainable day to day than counting every calorie, a different lever toward the same liver-fat goal.",
    citations: [
      { source: 'Time-Restricted Fasting Improves Liver Steatosis in Non-Alcoholic Fatty Liver Disease — A Single Blinded Crossover Trial, Nutrients 2023, PMID 38068729', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10708421/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['masld-weight-loss-thresholds', 'type2-time-restricted-eating'],
  },
  {
    id: 'masld-colorectal-cancer-risk',
    category: 'fattyLiverDisease',
    title: 'MASLD Carries an Independently Elevated Colorectal Cancer Risk Worth Knowing Plainly',
    teaser: 'A meta-analysis of nearly 10 million people found MASLD tracked with a 25% higher colorectal cancer risk and a 38% higher colorectal adenoma risk.',
    summary: "MASLD's own health reach extends beyond the liver and the cardiovascular/kidney risk already covered in this category, a growing body of research finds it independently associated with colorectal cancer and its own precursor lesions, colorectal adenomas (polyps). A updated meta-analysis pooling 15 cohort studies and nearly 10 million participants found MASLD tracked with a 25% higher colorectal cancer risk and a 38% higher colorectal adenoma risk, and a separate, even larger analysis of over 56 million people found broadly consistent, elevated risk across colorectal polyps, adenomas, and cancer alike. The proposed mechanism runs through the same shared metabolic dysfunction already covered elsewhere in this category, insulin resistance, chronic low-grade inflammation, and altered gut-bacteria metabolites, all of which have their own separately documented links to colorectal cancer risk too. This elevated risk is a concrete reason someone with MASLD has individual standing to ask specifically whether their own colorectal cancer screening should start earlier or run more frequently than standard age-based guidelines alone would suggest, the same kind of direct self-advocacy conversation the research already encourages for other condition-specific risk elevations.",
    citations: [
      { source: 'Association between metabolic dysfunction-associated steatotic liver disease and risk of colorectal cancer or colorectal adenoma: an updated meta-analysis of cohort studies, Frontiers in Oncology 2024, PMID 39045565', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11263091/' },
    ],
    overallTier: 'strong',
    relatedIds: ['masld-systemic-cvd-ckd-real-data'],
  },
  {
    id: 'masld-pediatric-prevalence-real-data',
    category: 'fattyLiverDisease',
    title: 'MASLD Is Now the Most Common Chronic Liver Disease in Children, Not Just Adults',
    teaser: 'Research finds MASLD in a 7.4% of the general pediatric population, rising to over half (52.5%) of children with obesity specifically, a rapidly growing problem this category\'s own research hasn\'t named directly yet.',
    summary:
      "This category's own already-covered research (weight loss, diet, medications) is written the way most MASLD research still is, centered on adults. Current data finds this is no longer just an adult condition: MASLD is now the most common chronic liver disease in children and adolescents, tracking directly alongside rising childhood obesity rates. Pooled meta-analysis data finds MASLD present in a 7.4% of the general pediatric population, rising sharply to 52.5% specifically among children with obesity, over half. Research finds this same condition underscreened and underdiagnosed in the pediatric obesity population, meaning a substantial share of affected children likely go unrecognized. The underlying biology (insulin resistance, visceral fat, the same genetic risk variants like PNPLA3 already covered in this category's own research) works the same way in children as in adults, but pediatric-specific management differs in practical ways, most weight-loss medications and the one FDA-approved MASH drug (resmetirom) covered elsewhere in this category aren't approved for children, making the already-covered lifestyle and dietary levers (weight loss thresholds, the Mediterranean-pattern research) even more central for this age group specifically. A child or adolescent with obesity has legitimate standing for a liver-health conversation, not just a weight conversation, given how common this condition turns out to actually be at that age.",
    citations: [
      { source: 'The evolving landscape of pediatric obesity and metabolic dysfunction-associated steatotic liver disease, Frontiers in Pediatrics 2025, PMID 41230444', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12602495/' },
    ],
    overallTier: 'strong',
    relatedIds: ['masld-weight-loss-thresholds', 'masld-pnpla3-genetic-risk'],
  },
  {
    id: 'masld-global-regional-prevalence-genetics',
    category: 'fattyLiverDisease',
    title: 'Fatty Liver Disease Prevalence Varies Enormously by Region, and a Gene Explains Part of Why',
    teaser: 'Global MASLD prevalence runs 30%, but Latin America (44.4%) and South Asia (up to 60% in some groups) run far higher than Western Europe (25.1%), a gene-and-diet combination behind much of the gap.',
    summary: "Fatty liver disease shows a wide, well-documented spread across regions of the world. Global MASLD prevalence sits at roughly 30%, but that hides regional extremes: Latin America carries the highest prevalence (44.4%), Western Europe the lowest among major regions studied (25.1%), and South Asian populations show a pooled prevalence of 34.7%, climbing to 60.0% specifically among people who also have Type 2 diabetes, with a striking urban-vs-rural gap (47.1% urban vs. 18.5% rural) pointing directly at diet and lifestyle. A specific genetic variant helps explain some of this: the PNPLA3 gene variant (I148M) is unevenly distributed by ancestry, and US data finds Hispanic populations carrying both a higher frequency of this variant AND the highest MASLD/MASH rates in the country, while African American populations carry a lower variant frequency and correspondingly lower rates despite similar obesity levels. South Asian populations also show a distinct pattern already familiar from the PCOS and Type 2 Diabetes research: metabolic problems, including fatty liver, showing up at a lower body weight than in other populations. A combination of inherited genetic variation and regional diet/urbanization patterns, not body weight alone, explains much of why fatty liver disease looks so different by region, a reason the weight-loss and Mediterranean-diet research applies everywhere, even as the underlying risk baseline differs by where someone's own ancestry and current diet sit.",
    citations: [
      { source: 'Epidemiology of Metabolic Dysfunction-Associated Steatotic Liver Disease in South Asian Ethnicities: A Systematic Review and Meta-Analysis, PMC12666614', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12666614/' },
      { source: 'Frontiers | Ethnic disparities in metabolic dysfunction-associated steatotic liver disease and clinical outcomes', url: 'https://www.frontiersin.org/journals/endocrinology/articles/10.3389/fendo.2025.1739137/full' },
    ],
    overallTier: 'strong',
    relatedIds: ['masld-overview', 'type2-global-nauru-pacific-thrifty-gene'],
  },
  {
    id: 'masld-tm6sf2-second-gene',
    category: 'fattyLiverDisease',
    title: 'A Second Gene, Working Through a Different Mechanism, Also Drives Fatty Liver Risk',
    teaser: 'PNPLA3 isn\'t the only genetic driver of MASLD, a second gene, TM6SF2, works by directly interfering with PNPLA3\'s own function, an interconnected two-gene mechanism rather than two separate risks.',
    summary:
      "This category's own already-covered PNPLA3 gene variant isn't the only documented genetic contributor to fatty liver disease. A second variant, TM6SF2 (specifically its E167K form), also drives MASLD risk, and recent research has found it works in a more entangled way than simply adding a second, independent risk: the TM6SF2 variant directly increases physical interaction with the PNPLA3 protein itself, and this interaction impairs PNPLA3's own normal job of transferring polyunsaturated fatty acids within liver cells, disrupted fat processing that promotes both fat buildup and liver injury. This is a meaningfully different mechanism from PNPLA3 acting alone. Someone can carry an elevated fatty-liver risk driven by TWO separate but interacting genes rather than one, which may help explain why fatty liver severity varies so much even among people who share similar diet, weight, and lifestyle factors. A forward-looking finding from the same research: supplementing with a specific fat compound (phosphatidylcholine containing C18:3) showed promise in early research specifically for people carrying the TM6SF2 variant, a potential future personalized approach rather than a one-size-fits-all treatment.",
    citations: [
      { source: 'TM6SF2 E167K variant decreases PNPLA3-mediated PUFA transfer to promote hepatic steatosis and injury in MASLD, PMC11540376', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11540376/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['masld-pnpla3-genetic-risk'],
  },
  {
    id: 'masld-global-lean-asian-phenotype',
    category: 'fattyLiverDisease',
    title: "'Lean' Fatty Liver Disease Is a Distinct, Much More Common Phenomenon in Asian Populations",
    teaser: 'Roughly 45% of MASLD cases in Asian cohorts occur in people who aren\'t overweight by any usual definition, more than double the global rate, and data finds this "lean" form carries higher mortality risk despite the lower body weight.',
    summary:
      "This category's own already-covered weight-loss and Mediterranean-diet research can carry an unspoken assumption: that fatty liver disease mainly affects people who are overweight. Global data finds this is less true in Asian populations specifically. Lean MASLD (fatty liver disease occurring at a BMI under 23 for Asian populations, a separately defined threshold from the 25 used elsewhere) makes up 5 to 20% of the worldwide MASLD population overall, but climbs to roughly 45% specifically in Asian cohorts, more than double the global share. The distinct mechanism: this isn't the same disease at a smaller body size, research finds it's characterized by its own pattern (visceral fat concentrated internally despite a normal overall weight, reduced muscle mass, and specific genetic variants in PNPLA3, TM6SF2, and MBOAT7, all already covered elsewhere in this category) driving disease in someone who looks metabolically healthy from the outside. The sobering finding: despite the lower body weight, lean MASLD carries similar or even elevated risk of severe liver disease and a 1.6-fold higher all-cause mortality risk compared with MASLD in people who are overweight. A normal BMI doesn't rule out meaningful fatty liver risk, especially for anyone of Asian ancestry, where this specific, distinct phenotype is common rather than a rare exception.",
    chart: {
      title: 'Lean MASLD as a share of all MASLD cases',
      unit: '%',
      data: [
        { label: 'Worldwide (typical range)', value: 12.5 },
        { label: 'Asian cohorts', value: 45 },
      ],
      sourceNote: 'The emerging phenotype of nonalcoholic fatty liver disease in lean individuals, PMC12581183',
    },
    citations: [
      { source: 'The emerging phenotype of nonalcoholic fatty liver disease in lean individuals: what\'s different?, PMC12581183', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12581183/' },
    ],
    overallTier: 'strong',
    relatedIds: ['masld-pnpla3-genetic-risk', 'masld-tm6sf2-second-gene'],
  },
  {
    id: 'horizon-masld',
    category: 'fattyLiverDisease',
    title: 'A New Drug Nearly Reversed Advanced Liver Scarring Entirely in Three of Ten Trial Patients',
    teaser: 'Efruxifermin, a lab-made version of a hormone the liver itself produces, found near-complete disease reversal in 30% of high-dose patients after 96 weeks in a Phase 2b trial, and is now in three separate Phase 3 trials.',
    summary:
      "This category's own already-covered resmetirom and semaglutide research represents already-approved MASLD treatment; efruxifermin is the next major candidate working through a different mechanism. It's a lab-made, longer-lasting version of FGF21, a hormone the liver itself naturally produces to help regulate fat metabolism. A 96-week Phase 2b trial (HARMONY) found efruxifermin produced improvements in both liver fibrosis and MASH severity measured directly from biopsy, with near-complete disease reversal in 30% of the patients on the highest dose tested, a striking result for a disease this category's own already-covered fibrosis-staging research treats as usually only slowly reversible. It's now being tested in three separate Phase 3 trials covering earlier-stage fibrosis, more advanced cirrhosis, and real-world use, and a separate trial is testing it in combination with a GLP-1 drug (the same drug class as this category's own already-covered semaglutide research), exploring whether combining two different mechanisms works better than either alone. Efruxifermin is one of several FGF21-based drugs (alongside pegozafermin and others) in active development, representing a new hormone-based direction for liver-disease treatment, not yet approved but advancing quickly through late-stage trials.",
    citations: [
      { source: 'Safety and efficacy of once-weekly efruxifermin versus placebo in metabolic dysfunction-associated steatohepatitis (HARMONY), 96-week results', url: 'https://www.sciencedirect.com/science/article/abs/pii/S0140673625010736' },
      { source: 'Efruxifermin: one step closer to disease-modifying therapy in fibrotic MASH, The Lancet', url: 'https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(25)01147-X/abstract' },
    ],
    overallTier: 'strong',
    relatedIds: ['masld-f0-f4-fibrosis-staging', 'masld-resmetirom'],
  },
  {
    id: 'horizon-masld-survodutide',
    category: 'fattyLiverDisease',
    title: 'A Dual-Hormone Drug Completely Normalized Liver Fat in 61% of Trial Patients',
    teaser: "This category's own already-covered semaglutide research works through one hormone pathway. Survodutide adds a second, and a Phase 3 trial found it completely clearing liver fat in the majority of patients treated, more than ten times the placebo rate.",
    summary: "This category's own already-covered semaglutide research activates one hormone pathway (GLP-1); survodutide is a dual-acting drug activating both GLP-1 AND glucagon receptors together, the same glucagon pathway already tied elsewhere in the research to directly boosting the liver's own fat-burning activity. A Phase 3 trial (SYNCHRONIZE-MASLD) found liver fat content completely normalized in 61% of patients on survodutide, compared with just 5.7% on placebo, and liver fat was reduced by up to 63.1%, versus 24.5% with placebo, both striking results. A separate, earlier Phase 2 trial focused specifically on people with existing liver fibrosis found 83.0% showing measured improvement in MASH severity after 48 weeks, versus 18.2% on placebo, described by the drug's own developers as the strongest fibrosis benefit ever shown by this specific drug class at that trial stage. Survodutide is still in active late-stage development rather than approved, but it represents a different mechanism from every other MASLD treatment already covered in this category, adding a second hormone target rather than refining the first one.",
    citations: [
      { source: 'Survodutide in adults with obesity and metabolic dysfunction-associated steatotic liver disease: SYNCHRONIZE-MASLD, a randomized phase 3 trial, Nature Medicine', url: 'https://www.nature.com/articles/s41591-026-04479-3' },
    ],
    overallTier: 'strong',
    relatedIds: ['horizon-masld', 'masld-semaglutide-essence'],
  },
  {
    id: 'masld-depression-anxiety-real-data',
    category: 'fattyLiverDisease',
    title: 'MASLD Carries a Substantial Mental Health Burden, and the Relationship Runs Both Directions',
    teaser: 'A meta-analysis of over 2 million adults found MASLD carrying a pooled 26.3% depression and 37.2% anxiety prevalence, with each condition raising the other\'s risk.',
    summary:
      'A large meta-analysis pooling 31 studies and 2,126,593 adults found MASLD carrying a substantial mental-health burden: 26.3 percent pooled depression prevalence, 37.2 percent anxiety, and 51.4 percent stress. The bidirectional relationship runs both ways: people with depression carry a 1.46-fold higher risk of developing NAFLD/MASLD in the first place, while people with NAFLD/MASLD carry a roughly 12 percent higher risk of developing depression compared to those without it. A sex-specific finding: one large cross-sectional study (25,333 subjects) found NAFLD significantly associated with depression specifically in women, with severe disease correlating with both state and trait anxiety in women particularly. The more serious clinical stakes: depression in NAFLD/MASLD is linked to a measurably increased risk of disease complications and mortality, not just a parallel, unrelated symptom, current clinical guidance specifically recommends depression screening (using a standard tool, the PHQ-9) as part of MASLD care itself, not a separate referral to consider only if it comes up.',
    citations: [
      { source: 'Non-alcoholic fatty liver disease and coexisting depression, anxiety and/or stress in adults: a systematic review and meta-analysis, PMC11058984', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11058984/' },
      { source: 'Depression in non-alcoholic fatty liver disease is associated with an increased risk of complications and mortality, PMC9582593', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9582593/' },
    ],
    overallTier: 'strong',
    relatedIds: ['mentalhealth-overview', 'masld-sleep-apnea-bidirectional'],
  },
  {
    id: 'masld-bariatric-surgery-real-resolution-data',
    category: 'fattyLiverDisease',
    title: "Bariatric Surgery Is the Single Best-Documented Way to Actually Reverse Advanced Liver Fibrosis",
    teaser: "A 5-year prospective study found NASH resolved in 84% of surgery patients within a year, with continued fibrosis regression tracked all the way out to five years.",
    summary:
      "This category's own already-covered weight-loss thresholds show smaller weight changes producing graded liver improvements, but a prospective 5-year French study of 180 patients with biopsy-confirmed NASH (severe enough to require surgery) found something more dramatic from bariatric surgery specifically: NASH had resolved in 84 percent of patients within one year, with no significant relapse between years one and five. Continued fibrosis improvement was tracked well beyond the first year too, with fibrosis disappearing entirely in 56 percent of all patients and in 45.5 percent of those who started with the most advanced bridging fibrosis. A separate, longer-term study (66 patients followed 6 years on average) found similarly strong results: 74 percent had NASH resolution with no fibrosis progression, and 70 percent showed at least one full stage of fibrosis regression. Worth stating honestly alongside this success: a separate study also found a meaningful minority of patients with the most severe fibrosis at baseline don't fully reverse it even after substantial surgical weight loss, evidence bariatric surgery is the single most effective documented intervention for advanced MASLD, not a guaranteed cure for every case.",
    citations: [
      { source: 'Bariatric Surgery Provides Long-term Resolution of Nonalcoholic Steatohepatitis and Regression of Fibrosis, PMID 32553765', url: 'https://pubmed.ncbi.nlm.nih.gov/32553765/' },
      { source: 'Persistence of severe liver fibrosis despite substantial weight loss with bariatric surgery, PMID 35076966', url: 'https://pubmed.ncbi.nlm.nih.gov/35076966/' },
    ],
    overallTier: 'strong',
    relatedIds: ['masld-weight-loss-thresholds', 'masld-f0-f4-fibrosis-staging'],
  },
  {
    id: 'masld-type2-diabetes-bidirectional-real-data',
    category: 'fattyLiverDisease',
    title: "MASLD and Type 2 Diabetes Drive Each Other, and Having Both at Once Is Worse Than Either Alone",
    teaser: 'A large Korean cohort of over 636,000 people with type 2 diabetes found persistent MASLD independently tracking with higher heart failure, heart attack, stroke, and death risk.',
    summary: "This category's own already-covered insulin-resistance mechanism means MASLD and type 2 diabetes share overlapping biology, and large-scale data confirms they drive one another, not just co-occur by coincidence. A national Korean cohort study following 636,520 people with pre-existing type 2 diabetes for a median of over 6 years found that persistent MASLD independently tracked with significantly higher risk of heart failure, heart attack, stroke, and all-cause mortality, even after accounting for diabetes itself. A separate, retrospective cohort study directly confirmed the relationship runs both directions: type 2 diabetes measurably worsens MASLD's own progression, and MASLD in turn measurably worsens glycemic control and diabetes complications, a feedback loop rather than one condition simply causing the other. This directly reinforces the already-covered finding, elsewhere, that the two conditions cluster together with PCOS and CKD around one shared insulin-resistance mechanism. Someone managing type 2 diabetes who also has MASLD is managing a measurably higher combined cardiovascular and liver risk than either condition carries alone, not simply two separate diagnoses to track in parallel.",
    citations: [
      { source: 'Association of temporal MASLD with type 2 diabetes, cardiovascular disease and mortality, PMC12261669', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12261669/' },
      { source: 'The Bidirectional Relationship Between Type 2 Diabetes and Metabolic Dysfunction-Associated Steatotic Liver Disease, PMC11743228', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11743228/' },
    ],
    overallTier: 'strong',
    relatedIds: ['masld-systemic-cvd-ckd-real-data', 'type2-metabolic-syndrome-cluster'],
  },
  {
    id: 'masld-resistance-training-muscle-mass',
    category: 'fattyLiverDisease',
    title: "Building Muscle, Not Just Losing Fat, Is a Distinct Lever Against MASLD",
    teaser: 'Prevalence data finds sarcopenia (muscle loss) affecting 20-40% of MASLD patients, and a meta-analysis of resistance-training trials found significant reductions in both liver enzymes and liver fat itself.',
    summary: "This category's own already-covered exercise research already establishes that activity helps independent of weight loss, and research finds resistance training specifically deserves its own, distinct attention, not just as a variant of general exercise advice. Prevalence data finds sarcopenia, meaningful loss of skeletal muscle mass, affecting 20 to 40 percent of MASLD patients, and mechanistic research finds this isn't incidental: reduced muscle mass directly worsens insulin resistance and liver fat accumulation, creating a two-way feedback loop that can accelerate progression toward fibrosis and cirrhosis, the same staging already covered elsewhere in this category. A recent systematic review and meta-analysis of 11 randomized controlled trials (395 participants) found resistance exercise produced a significant decrease in ALT (a liver-enzyme marker already covered in the labs research), with 7 of 8 imaging studies finding substantial reductions in liver fat content directly. Specific, actionable guidance from this same body of trials: whole-body, multi-muscle resistance training, 8 to 10 exercises at 60 to 80 percent of one-rep-max intensity, at least 3 times weekly for a minimum of 12 weeks, is the minimum effective protocol found across these trials. This is a separate, complementary lever from aerobic exercise and dietary weight loss, not a replacement for either, and combining it with adequate protein intake is directly relevant to preventing the sarcopenia this category's own research already flags as an independent MASLD risk.",
    citations: [
      { source: 'Resistance training for metabolic dysfunction-associated steatotic liver disease: a systematic review and meta-analysis, PMC12907158', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12907158/' },
      { source: 'Metabolic dysfunction-associated steatotic liver disease: A story of muscle and mass, PMID 40495947', url: 'https://pubmed.ncbi.nlm.nih.gov/40495947/' },
    ],
    overallTier: 'strong',
    relatedIds: ['masld-exercise-independent-weight-loss', 'masld-sarcopenic-obesity'],
  },
  {
    id: 'masld-fib4-two-tier-primary-care-screening',
    category: 'fattyLiverDisease',
    title: "A Two-Step Screening Path Now Lets Primary Care Sort Out Who Actually Needs a Liver Specialist",
    teaser: "This category's own already-covered FIB-4 entry names it as a screening tool, current guidelines now build it into a formal, two-tier pathway that's directly cut unnecessary specialist referrals.",
    summary:
      "This category's own already-covered FIB-4 fibrosis-screening entry gives the basic tool, and current clinical guidance builds it into a practical, two-step pathway most people will actually encounter through primary care, not a liver specialist. Current guidelines (AASLD, ACG, and AGA jointly informing this pathway) recommend FIB-4, a simple score calculated from age, AST, ALT, and platelet count, already routinely drawn bloodwork, as the first screening step for anyone with type 2 diabetes or metabolic syndrome (both already covered elsewhere in this Digest as MASLD risk factors). Specific thresholds trigger the second step: an elevated FIB-4 (above 1.3 for ages 36-65, above 2.0 for over 65) leads to a non-invasive secondary test, transient elastography (an ultrasound-based liver-stiffness measurement) or a similar blood-based fibrosis score, before ever involving a specialist. The practical payoff of this two-tier approach is stated directly in the research: it has measurably reduced unnecessary specialist referrals, letting gastroenterology and hepatology clinics focus on people who need them. This structured pathway means an already-common lab panel can start the process of ruling MASLD-related fibrosis in or out, worth asking about directly if type 2 diabetes or metabolic syndrome is already part of someone's own health picture.",
    citations: [
      { source: 'Identifying and Linking Patients At Risk for MASLD with Advanced Fibrosis to Care in Primary Care, PMC11861828', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11861828/' },
      { source: 'FIB-4 as a screening and disease monitoring method in pre-fibrotic stages of metabolic dysfunction-associated fatty liver disease, PMID 38788522', url: 'https://pubmed.ncbi.nlm.nih.gov/38788522/' },
    ],
    overallTier: 'strong',
    relatedIds: ['masld-fib4-fibrosis-screening', 'masld-f0-f4-fibrosis-staging'],
  },
  {
    id: 'masld-probiotics-real-trial-mixed',
    category: 'fattyLiverDisease',
    title: "Probiotics for MASLD: A Controlled Trial Found Liver-Fat Reduction, but a Follow-Up Found No Change in Fibrosis",
    teaser: 'A 12-week randomized trial using MRI-measured liver fat found a specific probiotic mixture significantly reducing intrahepatic fat, while a separate synbiotics trial found no change in liver fat or fibrosis at all.',
    summary: "This category's own already-covered gut-liver axis research is reinforced by direct clinical trial evidence, and the picture, honestly, is mixed depending on which specific product and outcome is measured. A randomized, double-blind, placebo-controlled trial of 68 obese MASLD patients, using MRI to directly measure liver fat (not just symptoms or blood markers), found a specific 6-species probiotic mixture significantly reduced intrahepatic fat over 12 weeks (from 16.3 to 14.1 percent, versus no change in the placebo group), a statistically significant, objectively measured result. Mechanistic research proposes plausible reasons why: specific strains (Lactobacillus acidophilus, L. Casei, L. Rhamnosus, L. Plantarum, and others) are found in separate research to activate tight-junction proteins that improve intestinal permeability, directly connecting to the already-covered gut-barrier research. The honest complication: a separate randomized trial testing a synbiotic (a combination of probiotics and prebiotic fiber) found it measurably altered the fecal microbiome as intended, but produced NO significant change in liver fat or fibrosis, the actual clinical outcomes that matter most. Evidence supports SOME specific probiotic formulations helping in controlled trials, but research also finds this effect isn't automatic or universal across every product, and strain-specific dosing for liver disease specifically remains underdefined, worth discussing directly with a doctor rather than assuming any generic probiotic supplement will replicate a specific trial's own result.",
    citations: [
      { source: 'Randomized, Double-blind, Placebo-controlled Study of a Multispecies Probiotic Mixture in Nonalcoholic Fatty Liver Disease, PMID 30952918', url: 'https://pubmed.ncbi.nlm.nih.gov/30952918/' },
      { source: 'Synbiotics Alter Fecal Microbiomes, But Not Liver Fat or Fibrosis, in a Randomized Trial of Patients With Nonalcoholic Fatty Liver Disease, PMID 31987796', url: 'https://pubmed.ncbi.nlm.nih.gov/31987796/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['masld-fiber-intake-real-data', 'gut-scfa-treg'],
  },
  {
    id: 'masld-mediterranean-diet-2year-real-biomarkers',
    category: 'fattyLiverDisease',
    title: "A 2-Year Mediterranean Diet Trial Found Sustained, Measurable Liver-Cell-Death Marker Improvement",
    teaser: "This category's own already-covered Mediterranean-diet head-to-head trial names an honest nuance about what it competes against, a separate 2-year trial found sustained dietary adherence directly, measurably lowering a specific marker of liver cell death and inflammation.",
    summary:
      "This category's own already-covered Mediterranean-diet entry names honest evidence that a plainer low-fat diet works comparably well over the shorter term, and a separate, longer trial adds useful depth about SUSTAINED adherence specifically. A 2-year clinical trial of 62 MASLD patients (ages 40-60) randomly assigned to a Mediterranean-diet-and-physical-activity intervention found a significant reduction in CK-18 (cytokeratin-18), a specific, measurable blood marker of liver cell death and inflammation, already directly relevant to this category's own fibrosis-staging research. The worth-knowing detail: this benefit was found specifically in participants with HIGH adherence to the diet, and the reduction became more pronounced the longer they stayed with it, measured at both 6 and 24 months, direct evidence that consistency over time, not just short-term dietary compliance, is what drives the measurable benefit. This directly reinforces this category's own already-established graded weight-loss-and-lifestyle research (5 percent reduces steatosis, 7 percent improves inflammation, 10 percent stabilizes or reverses fibrosis), with additional confirmation the Mediterranean pattern specifically, sustained over years, produces measurable improvement in liver-specific biomarkers, not just general metabolic health.",
    citations: [
      { source: 'Two-Year Mediterranean Diet Intervention Improves Hepatic Health in MASLD Patients, PMC12111022', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12111022/' },
    ],
    overallTier: 'strong',
    relatedIds: ['masld-mediterranean-diet', 'masld-weight-loss-thresholds'],
  },
  {
    id: 'masld-vitamin-d-mixed-evidence',
    category: 'fattyLiverDisease',
    title: 'Vitamin D and MASLD Are Linked in Observational Data, But a Trial Found Supplementing Didn’t Help',
    teaser: "This category's own already-covered PIVENS trial covers vitamin E's own quantified NASH benefit, vitamin D tells a different, more sobering story, observational association without a matching treatment benefit.",
    summary:
      "This category's own already-covered vitamin E research (the PIVENS trial) is a success story for one fat-soluble vitamin directly treating MASH, vitamin D's own story is more mixed, and worth reporting exactly that honestly rather than assuming the same pattern repeats. Observational data consistently finds low vitamin D levels tracking with both MASLD's presence and its severity: one large population study found each 1 ng/mL increase in vitamin D levels associated with a 2 percent lower MASLD risk, and people with the highest vitamin D levels had a sizable reduction in likelihood of fatty liver disease compared to those with the lowest levels. The plausible mechanism connects directly to processes already covered elsewhere in this category, vitamin D has documented roles in insulin sensitivity and inflammatory signaling, both central to MASLD's own progression. But a randomized, double-blind, placebo-controlled trial specifically testing whether SUPPLEMENTING vitamin D actually helps found a disappointing answer: in 65 patients with type 2 diabetes and NAFLD, high-dose oral vitamin D for 24 weeks significantly raised blood vitamin D levels as expected, but produced no difference in hepatic fat content, liver enzymes, or fibrosis markers compared to placebo. This is a textbook example of why an observational association, however consistent, doesn't automatically mean the deficiency itself is a fixable CAUSE of the disease rather than a marker of something else going on (reduced sun exposure from lower physical activity, say), unlike vitamin E's own trial-confirmed benefit, correcting vitamin D levels specifically for liver benefit isn't currently supported by the best available trial evidence.",
    citations: [
      { source: 'Vitamin D and Metabolic Dysfunction-Associated Steatotic Liver Disease (MASLD): Novel Mechanistic Insights, PMC11084591', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11084591/' },
      { source: 'No effects of oral vitamin D supplementation on non-alcoholic fatty liver disease in patients with type 2 diabetes: a randomized, double-blind, placebo-controlled trial, PMC4926287', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4926287/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['masld-vitamin-e-pivens-trial', 'masld-weight-loss-thresholds'],
  },
  {
    id: 'masld-liver-transplant-leading-indication-projection',
    category: 'fattyLiverDisease',
    title: 'MASLD Is On Track to Become the Single Leading Reason for Liver Transplant in the US, With a Projected Near-Quadrupling',
    teaser: "This category's own already-covered fibrosis-staging research names the small share of MASLD that progresses to serious disease, at the national population scale, that small share still adds up to a projected, near-quadrupled transplant burden by mid-century.",
    summary:
      "This category's own already-covered fibrosis-staging research already establishes that only a small minority of MASLD progresses to cirrhosis, and a direct national-projection study shows exactly why even that small share matters enormously at population scale. A formal modeling study projects MASLD-attributed liver transplants in the US rising from a current baseline of 1,717 per year (2020-2025) to a projected 6,720 per year by 2046-2050, a 291 percent increase, nearly quadrupling, with a cumulative total of 132,600 MASLD-related liver transplants projected across the full 2020-2050 period. This directly supports what separate research already states plainly: MASLD is projected to soon become the leading indication for liver transplant in the United States overall, and more specific data already finds it has become the TOP transplant indication specifically for women and for patients with hepatocellular carcinoma (HCC, liver cancer), a current milestone, not just a future projection. This striking national trajectory is exactly why this category's own already-covered weight-loss thresholds, exercise research, and medication options (resmetirom, semaglutide) matter at a public-health scale, not just an individual one, direct evidence that a disease often framed as manageable lifestyle risk is on track to reshape the single scarcest resource in all of transplant medicine, donor livers, within most current adults' own lifetimes.",
    citations: [
      { source: 'Estimated Burden of Metabolic Dysfunction-Associated Steatotic Liver Disease in US Adults, 2020 to 2050, JAMA Network Open, DOI 10.1001/jamanetworkopen.2024.54707', url: 'https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2829360' },
      { source: 'Epidemiology of metabolic dysfunction-associated steatotic liver disease, PMID 39159948', url: 'https://pubmed.ncbi.nlm.nih.gov/39159948/' },
    ],
    overallTier: 'strong',
    relatedIds: ['masld-weight-loss-thresholds', 'horizon-masld'],
  },
  {
    id: 'masld-fermented-drinks',
    category: 'fattyLiverDisease',
    title: 'Fermented Drinks and Foods for Fatty Liver Disease',
    teaser: 'Pu-erh tea has strong human trial evidence for improving cholesterol and liver fat specifically, the single best-matched claim in this app\'s whole fermentation collection for this one condition.',
    summary: 'This app\'s own Pu-erh-Style Fermented Tea (in Recipes, a home kombucha-style ferment built on black tea since true pu-erh leaf isn\'t something this database carries) is named after true pu-erh, whose own active compound (theabrownin) has documented human and mouse trial data for lowering cholesterol and reducing liver fat, working through gut microbiota and bile acid metabolism, worth knowing plainly this home version doesn\'t reproduce that specific research, since it\'s built on a different tea entirely. The more directly actionable thing for MASLD is what to avoid: several drinks in this collection (Sake-Style, Makgeolli, Coconut Palm Wine-Style, Maple "Pulque-Style") are actually alcoholic once fully fermented, and alcohol is a direct, well-established driver of liver damage, doubly relevant when the liver is already under metabolic stress from fatty liver disease itself. Skip those entirely; the wild-fermented tonics and short lacto-ferments carry no meaningful alcohol.',
    citations: [
      { source: 'Huang et al. 2019, Nature Communications: theabrownin from Pu-erh tea attenuates hypercholesterolemia via gut microbiota and bile acid metabolism, human and mouse data', url: 'https://pubmed.ncbi.nlm.nih.gov/31672964/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['recipe-ferment-puerh-style-tea', 'fermentmethod-kombucha', 'lifestyle-alcohol-advisory'],
  },
  // 2026-08-21, added after fact-checking NOVA's "The Truth About Fat"
  // (2020) documentary against the peer-reviewed literature, direct
  // request. The documentary itself is not treated as a citable source;
  // this traces to the primary review, independently verified via
  // WebSearch.
  {
    id: 'masld-adiponectin-hepatoprotective',
    category: 'fattyLiverDisease',
    title: 'Adiponectin Directly Protects the Liver, and Levels Drop as MASLD Gets Worse',
    teaser: 'Lower adiponectin tracks with more severe liver disease, from simple fat buildup through to NASH, and the same hormone counters the fat-storage-and-inflammation mechanism already covered here.',
    summary: "Adiponectin, the fat-derived hormone covered in the Basic Health hormones research, has a direct, documented role in the liver specifically: it works against excess fat storage in liver cells and protects against inflammation and fibrosis there. Serum adiponectin is consistently lower in people with MASLD than in people without it, and lower still in NASH (the more advanced, inflamed stage) than in simple fatty liver, tracking with disease severity rather than just its presence or absence. This connects directly to the lipodystrophy research in the hormones category: the same fat-tissue signaling that goes wrong when fat can't be stored anywhere also goes wrong, in a milder form, when fat backs up specifically in the liver, adiponectin being one of the hormonal signals that's supposed to prevent exactly that.",
    citations: [
      { source: 'Buechler C et al. 2011: Adiponectin, a key adipokine in obesity related liver diseases (PMID 21734787)', url: 'https://pubmed.ncbi.nlm.nih.gov/21734787/' },
    ],
    overallTier: 'strong',
    relatedIds: ['masld-overview', 'adiponectin-overview', 'lipodystrophy-fat-necessity'],
  },
  // 2026-08-23, added after fact-checking the "How Not to Die" documentary
  // (2025) against the peer-reviewed literature, direct request, second
  // pass for full breadth. The documentary itself is not treated as a
  // citable source; this traces to the primary trial, independently
  // verified via WebSearch, alongside a separate, more recent trial that
  // complicates the "plant-based specifically" framing, kept in on purpose
  // rather than left out for being less flattering to the headline claim.
  {
    id: 'masld-vegetarian-diet-rct-weight-loss-mechanism',
    category: 'fattyLiverDisease',
    title: 'A Vegetarian Diet Improved Fatty Liver in a Real Trial, and a Separate Trial Found Weight Loss Was Likely the Actual Driver',
    teaser: '220 people with MASLD were randomized to a vegetarian diet or a standard diet. The vegetarian group improved more, largely because they lost more weight, not necessarily because the food was vegetarian specifically.',
    summary:
      "A randomized controlled trial in China assigned 220 adults with MASLD to either a lacto-ovo-vegetarian diet or a standard omnivore diet for 6 months, both groups following dietitian-supervised meal plans. The vegetarian group achieved significantly more weight loss (1.40 kg more, on average) and a significantly higher rate of the trial's own combined success measure, at least 5% weight loss plus measurable improvement in liver fat, by two different measurement methods (33.3% vs. 16.1% by ultrasound, 37.6% vs. 21.5% by a specialized liver-fat measurement called CAP). Cholesterol and blood pressure improved significantly only in the vegetarian group. Worth reading directly alongside a separate, honest complication rather than as the whole story: a different, more recent randomized trial specifically tested whether diet type or weight loss and reduced ultra-processed food intake was the real driver of liver-fat improvement in MASLD, and found the latter, reductions in BMI and in ultra-processed food consumption independently predicted improvement, while the specific dietary pattern itself did not. Read together, the honest, non-oversimplified takeaway is that a vegetarian or plant-based pattern is a genuinely effective real-world path to the weight loss and processed-food reduction that actually drive liver-fat improvement, not that plant-based eating carries some separate, additional liver-specific effect beyond that.",
    citations: [
      { source: 'A vegetarian diet improves hepatic steatosis in MASLD patients through weight loss: a randomized controlled trial in China, Mao X et al., Food & Function, 2025', url: 'https://pubs.rsc.org/en/content/articlelanding/2025/fo/d5fo02970h' },
      { source: 'Impact of weight loss and reduction of ultra-processed foods on liver fat content in MASLD: a randomized controlled trial, JHEP Reports, PMID 42331287', url: 'https://pubmed.ncbi.nlm.nih.gov/42331287/' },
    ],
    overallTier: 'moderate',
    stageNote: 'Both are real randomized trials. Included together deliberately: the second trial\'s finding (weight loss and food processing, not diet label, as the likely mechanism) is a genuine complication of the first trial\'s own headline result, not a reason to hide it.',
    relatedIds: ['masld-overview', 'pbn-ornish-lifestyle-heart-trial'],
  },
];
