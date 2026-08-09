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
    title: 'MASLD: A Real, Common Condition With a Recently Renamed, More Precise Identity',
    teaser: 'The name changed for a real, deliberate reason -- to stop defining the disease by what it isn\'t (alcohol) and start naming what it actually is.',
    summary:
      "MASLD (metabolic dysfunction-associated steatotic liver disease) is the current, more precise name for what used to be called NAFLD (non-alcoholic fatty liver disease), fat accumulating in liver cells for reasons unrelated to heavy alcohol use. The real rename, adopted by major hepatology societies, reflects a deliberate shift: rather than defining the disease by what it isn't (alcohol-related), the new name centers what it actually is, a condition driven by real, identifiable metabolic risk factors (insulin resistance, elevated triglycerides, high blood pressure, excess weight, most centrally). MASLD ranges in real severity from simple fat accumulation (steatosis alone) to MASH (metabolic dysfunction-associated steatohepatitis, involving real inflammation and cell damage), which can progress further to fibrosis and, in advanced cases, cirrhosis. A real, separate diagnostic category, MetALD, now exists specifically for people whose liver disease involves both real metabolic risk factors and moderate alcohol intake at once, covered directly in this category's own dedicated entry. This category covers what's specific to actually managing MASLD, and cross-links throughout to this app's own already-substantial, Hashimoto's-focused liver research rather than repeating it.",
    citations: [
      { source: 'Steatotic Liver Disease, MedlinePlus, U.S. National Library of Medicine', url: 'https://medlineplus.gov/steatoticliverdisease.html' },
    ],
    overallTier: 'strong',
    relatedIds: ['organ-liver-t4t3-conversion', 'organ-liver-hashimotos-damage', 'organ-liver-nafld-link', 'organ-liver-fixing-helps-thyroid', 'type2-overview', 'type2-metabolic-syndrome-cluster', 'choline-deficiency-liver'],
  },
  {
    id: 'masld-weight-loss-thresholds',
    category: 'fattyLiverDisease',
    title: 'Weight Loss and MASLD: A Real, Specific, Dose-Dependent Staircase of Benefit',
    teaser: 'Not one target number. A real, graded series of thresholds, each one unlocking a genuinely different kind of measured improvement.',
    summary:
      "MASLD's own real, best-established treatment is weight loss, and the evidence behind it is unusually specific: a real systematic review and meta-analysis found weight loss of more than 3% of body weight associated with significantly improved liver histology and MASH resolution, regardless of a person's starting BMI, diabetes status, or ethnicity. The real benefit then climbs in a genuine, graded staircase from there: sustained weight loss of 5% or more measurably reduces liver fat itself, 7% or more improves the actual inflammation and cell-damage component (necroinflammation), and 10% or more is associated with real stabilization or reversal of fibrosis, scarring that would otherwise be considered largely one-directional. The highest rates of complete MASH resolution and fibrosis regression occur specifically in patients who reach that 10%-or-greater threshold. Worth knowing directly as a real, honest, motivating framework: even a real, modest 3% weight loss is not a consolation prize, it's the specific, evidence-backed threshold where real histological benefit reliably begins.",
    citations: [
      { source: 'The Impact of Body Weight Change on Liver Histology in Metabolic Dysfunction-Associated Steatotic Liver Disease Across Various Histological Endpoints: A Systematic Review and Meta-Analysis, PMID 41510965', url: 'https://pubmed.ncbi.nlm.nih.gov/41510965/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'masld-mediterranean-diet',
    category: 'fattyLiverDisease',
    title: 'The Mediterranean Diet: Real, Randomized Trial Evidence, With an Honest Nuance About What It\'s Actually Competing Against',
    teaser: 'A real head-to-head trial found the Mediterranean diet genuinely worked. It also found a plainer low-fat diet worked just as well.',
    summary:
      "A real, randomized controlled trial (250 adults with MASLD, 12 weeks) directly compared a moderately calorie-reduced Mediterranean diet against a low-fat diet and found both approaches similarly effective at reducing liver fat (steatosis) and fibrosis, with no real difference based on a person's own PNPLA3 genotype (a gene variant linked to MASLD risk). A separate, real systematic review and meta-analysis reached the same honest conclusion: no significant difference between the Mediterranean diet and a low-fat diet in improving liver enzymes, liver fat, or related markers in MASLD, both working roughly equally well in the short term. This is a real, useful, honest nuance rather than a disappointing finding: weight loss and overall dietary quality both diets share (real food, reduced calories, less ultra-processed intake) appear to be the actual driving mechanism behind the real, measured improvement, not something unique to the Mediterranean pattern specifically. Worth knowing directly: a person genuinely doesn't need to follow the Mediterranean diet exactly to get a real, comparable benefit, a calorie-appropriate, whole-food, low-fat approach works about as well.",
    citations: [
      { source: 'Mediterranean and low-fat diets are equally effective in MASLD resolution at 12 weeks regardless of PNPLA3 genotype: A randomized controlled trial, PMID 41284948', url: 'https://pubmed.ncbi.nlm.nih.gov/41284948/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'masld-coffee-protective',
    category: 'fattyLiverDisease',
    title: 'Coffee: A Real, Consistently Protective Association Across Multiple Independent Studies',
    teaser: 'One of the more consistently positive real findings anywhere in this app\'s food research, for a condition that could genuinely use one.',
    summary:
      "Coffee consumption shows a real, consistently protective association with MASLD across multiple independent lines of research, genuinely more consistent than most food-and-disease relationships this app's own research covers. A real systematic review and meta-analysis found coffee drinkers had a 23% lower risk of developing MASLD in the first place, and a separate real meta-analysis found coffee consumption associated with 35% lower odds of significant liver fibrosis specifically, a real, meaningful reduction in the disease's more serious, harder-to-reverse stage. Real, specific research points toward 2 to 4 cups of drip coffee a day as the range linked to lower liver enzyme levels, slower fibrosis progression, and lower liver-related mortality. The real, likely mechanism involves more than just caffeine: chlorogenic acid, cafestol, and kahweol, real antioxidant compounds coffee also contains, appear to help reduce triglyceride and cholesterol buildup in liver cells directly, alongside caffeine's own separate real effect of reducing a signaling molecule (TGF-beta) involved in liver scarring. Worth knowing directly as one of the more reliably positive, low-effort findings in this whole category.",
    citations: [
      { source: 'Effect of Coffee Consumption on Non-Alcoholic Fatty Liver Disease Incidence, Prevalence and Risk of Significant Liver Fibrosis: Systematic Review with Meta-Analysis of Observational Studies, PMID 34578919', url: 'https://pubmed.ncbi.nlm.nih.gov/34578919/' },
    ],
    overallTier: 'strong',
    relatedIds: ['problem-coffee-timing', 'gout-coffee-inverse'],
  },
  {
    id: 'masld-hfcs-fructose',
    category: 'fattyLiverDisease',
    title: 'Fructose and MASLD: Why This App\'s Own General HFCS Research Applies Here With Extra Force',
    teaser: 'A finding already covered from a general-nutrition angle takes on real, direct significance once liver disease is the actual condition being managed.',
    summary:
      "This app's own Food Additives research already covers a real, important mechanistic distinction: unlike glucose, which nearly every cell in the body can use directly, dietary fructose is metabolized almost entirely in the liver, and at high intake, a meaningful share of it converts directly to fat there. For MASLD specifically, this isn't background information, it's a direct, central mechanism, since high-fructose corn syrup and other concentrated fructose sources place real, additional metabolic burden on the exact organ already under strain. Real, controlled human research backs this up with a genuine dose-response relationship: as fructose intake from sweetened beverages rises, measured liver fat and insulin resistance rise together in a real, graded pattern, not just at extreme intake levels. Worth knowing directly for anyone managing MASLD specifically: this is a real case where a general nutrition finding (already covered in this app's own broader research) deserves real, elevated priority, not the same weight it would carry for someone without liver disease already in the picture.",
    citations: [
      { source: 'Softic S, et al., Critical Reviews in Clinical Laboratory Sciences, 2020, "Fructose and hepatic insulin resistance"', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7774304/' },
    ],
    overallTier: 'strong',
    relatedIds: ['additive-hfcs'],
  },
  {
    id: 'masld-metald-alcohol-threshold',
    category: 'fattyLiverDisease',
    title: 'Alcohol and MASLD: A Real, Genuinely Contested Threshold Question, Not a Clean Line',
    teaser: 'MASLD is defined by NOT being alcohol-related. Real research on moderate drinking within that same population turns out surprisingly unsettled.',
    summary:
      "MASLD is defined specifically by fat accumulation NOT explained by heavy alcohol use, but a real, genuinely contested question remains open within that same population: does moderate drinking still matter? A real, newly created diagnostic category, MetALD, now exists specifically to capture people with real metabolic risk factors for MASLD who also drink moderately, defined by real, specific gram-per-day or drinks-per-week thresholds that differ depending on which real clinical source is consulted, a genuine sign the boundary itself is still being worked out rather than firmly settled. Real research specifically looking at low-to-moderate drinking within MASLD populations has found it associated with increased fibrosis, a real, direct challenge to the older, more casual assumption that only heavy drinking matters once someone already has MASLD. The honest, current picture: real international guidelines increasingly recommend alcohol restriction or abstinence for anyone with steatotic liver disease and metabolic risk factors, regardless of amount, even though the exact threshold at which risk genuinely begins remains a real, unresolved, actively studied question rather than a single agreed-upon number.",
    citations: [
      { source: 'MetALD: New Perspectives on an Old Overlooked Disease', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11967760/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['lifestyle-alcohol-advisory'],
  },
  {
    id: 'masld-resmetirom',
    category: 'fattyLiverDisease',
    title: 'Resmetirom: The First-Ever Approved MASH Drug, and It Works Through Thyroid Hormone Receptors Directly',
    teaser: 'A genuinely elegant, direct echo of this app\'s own thyroid-hormone-and-liver research: the first real MASH medication works by mimicking thyroid hormone\'s own effect on the liver.',
    summary:
      "Resmetirom (Rezdiffra) became the first medication ever approved by the FDA specifically for MASH, on March 14, 2024, a genuinely historic milestone for a disease that had no approved pharmacologic treatment at all before this. Its real, specific mechanism connects directly and elegantly to this app's own already-established liver research: resmetirom is a thyroid hormone receptor-beta agonist, meaning it selectively activates the same real receptor pathway thyroid hormone itself uses in liver cells, without the broader body-wide effects of actual thyroid hormone. This is a direct, working echo of this app's own already-documented finding that reduced thyroid hormone availability shifts the liver toward storing fat rather than burning it, resmetirom essentially restores that specific, liver-localized signal pharmacologically. The real, pivotal MAESTRO-NASH trial supporting its approval found real, measured MASH resolution and fibrosis improvement without the disease worsening on the more traditional activity score. Approved specifically for use alongside diet and exercise, not as a replacement for them, in adults with moderate-to-advanced fibrosis.",
    citations: [
      { source: 'Resmetirom: First Approval, PMID 38771485', url: 'https://pubmed.ncbi.nlm.nih.gov/38771485/' },
    ],
    overallTier: 'strong',
    relatedIds: ['organ-liver-nafld-link'],
  },
  {
    id: 'masld-semaglutide-essence',
    category: 'fattyLiverDisease',
    title: 'Semaglutide: A Real, Large, Recent Trial Found It Genuinely Resolves Steatohepatitis in Most Patients',
    teaser: 'A real, major trial found nearly two out of three patients on this medication achieved a real, biopsy-confirmed resolution of active liver inflammation.',
    summary:
      "Semaglutide (a GLP-1 receptor agonist, already widely known for its real weight-loss and diabetes effects) showed a real, striking benefit specifically for MASH in the large, recent ESSENCE trial (1,197 patients). At 72 weeks, 62.9% of patients on semaglutide achieved real, biopsy-confirmed resolution of steatohepatitis with no worsening of fibrosis, compared to 34.3% on placebo, and 36.8% showed real improvement in fibrosis itself with no worsening of steatohepatitis, versus 22.4% on placebo. A real, combined outcome (both steatohepatitis resolution AND fibrosis improvement together) was reached by 32.8% on semaglutide versus 16.2% on placebo. Average weight loss in the treated group was a real, substantial 10.5%, directly connecting to this category's own dedicated entry on weight loss's own dose-dependent benefit. Published in the New England Journal of Medicine in 2025, this is real, current, large-scale evidence, not a small early signal, for a medication already reaching wide use for its other real, established purposes.",
    citations: [
      { source: 'Phase 3 ESSENCE Trial: Semaglutide in Metabolic Dysfunction-Associated Steatohepatitis', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11784563/' },
    ],
    overallTier: 'strong',
    relatedIds: ['masld-weight-loss-thresholds', 'type2-glp1-sglt2-paradigm-shift'],
  },
  {
    id: 'masld-fib4-fibrosis-screening',
    category: 'fattyLiverDisease',
    title: 'FIB-4: A Real, Simple Blood-Test-Based Way to Screen for Advanced Liver Scarring Without a Biopsy',
    teaser: 'A real, calculable score from routine labs already drawn for other reasons, genuinely useful for ruling out the more serious stage of MASLD.',
    summary:
      "FIB-4 (Fibrosis-4 Index) is a real, well-validated, non-invasive screening tool for advanced liver fibrosis, calculated from four real, ordinary values many people already have on file: age, AST, ALT, and platelet count, no special test or liver biopsy required to get a first real answer. Real clinical guidance recommends FIB-4 specifically as a first-line screening step because of its real, high negative predictive value, meaning a low score is genuinely reassuring at ruling out advanced fibrosis, while a real result in the indeterminate range (roughly 1.3 to 2.67) or a high score calls for real, further evaluation with a more specialized tool, most often vibration-controlled transient elastography (FibroScan) or an Enhanced Liver Fibrosis blood test. A real, honest limitation worth knowing directly: FIB-4's own accuracy has shown genuine inconsistency in some real studies, especially in the general population rather than a clinical MASLD cohort, so a concerning result is a real, meaningful reason to pursue further testing, not treated as a final answer on its own either way. Worth asking directly whether this real, low-cost first screening step has been calculated from labs already drawn, since it often can be without a single new test.",
    citations: [
      { source: 'Diagnostic role of the fibrosis-4 index and nonalcoholic fatty liver disease fibrosis score as a noninvasive tool for liver fibrosis scoring', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11521016/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'masld-tying-together',
    category: 'fattyLiverDisease',
    title: 'What Actually Holds Up for MASLD, Pulled Together',
    teaser: 'A real, graded weight-loss staircase, coffee as one of the most consistently positive findings anywhere in this app, and a genuinely elegant thyroid-hormone connection tying the whole category back to this app\'s own core focus.',
    summary:
      "Line up everything in this category and MASLD reads as a condition where real, specific numbers replace vague advice at nearly every turn. Weight loss isn't just \"recommended,\" it's a real, graded staircase (3% for real histological benefit to begin, 10% for the strongest fibrosis regression). The Mediterranean diet works, and so, honestly, does a plainer low-fat diet, real evidence pointing toward overall dietary quality and weight loss as the actual driving mechanism rather than one specific pattern. Coffee stands out as one of the more consistently positive, low-effort findings in this app's whole research base, while fructose-heavy sweeteners deserve real, elevated caution specifically because of MASLD's own already-strained liver. Two real medication stories, resmetirom and semaglutide, both reached patients only very recently and both carry real, substantial trial evidence behind them, resmetirom's own thyroid-hormone-receptor mechanism forming a genuinely elegant, direct link back to this app's own core focus. And FIB-4 offers a real, low-cost way to know where someone actually stands, often without a single new test.",
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
    title: "MASLD's Real Fibrosis Staging: F0 Through F4, and a Real, Reassuring Fact About How Much of It Is Reversible",
    teaser: '94% of MASLD stays in a real, still-reversible stage. The real turning point most people should know about is F2, not F4.',
    summary:
      "MASLD's own real liver-scarring progression is staged F0 through F4 using the METAVIR system, already reachable through the FIB-4 screening this app's own self-advocacy content already covers: F0 (no fibrosis), F1 (portal fibrosis, no bridging), F2 (fibrosis with a few connecting septa), F3 (extensive septa, not yet cirrhosis), and F4 (cirrhosis). The real, most useful clinical marker isn't F4, it's F2: real guidance treats F2 as the point clinically significant fibrosis begins, the real threshold where active treatment typically starts. The genuinely reassuring real fact: progression through F0-F3 is considered fully reversible, and real research finds roughly 94% of the MASLD population sits in this still-reversible range; only 5-6% of cases progress all the way to F4 cirrhosis, where the real, clinical goal shifts from reversal to managing complications (portal hypertension, liver cancer surveillance). Real research finds fibrosis itself progresses in 20-30% of MASLD patients over 10-20 years, fastest specifically in those with diabetes, obesity, and already-elevated liver enzymes, a real, direct reason this app's own weight-loss and metabolic research matters as much as it does for this specific condition.",
    citations: [
      { source: 'Progression to Decompensation of Severe Fibrosis Compared to Cirrhosis in MASLD: A Systematic Review and Meta-Analysis, PMC12811796', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12811796/' },
    ],
    overallTier: 'strong',
    relatedIds: ['masld-fib4-fibrosis-screening'],
  },
  {
    id: 'masld-systemic-cvd-ckd-real-data',
    category: 'fattyLiverDisease',
    title: "MASLD Reaches Well Past the Liver -- Real, Independent Cardiovascular and Kidney Risk, Not Just a Byproduct of Shared Risk Factors",
    teaser: 'MASLD is a real, independent cardiovascular risk factor in its own right, and fibrosis stage specifically is the strongest real predictor of that risk, not the liver-fat amount itself.',
    summary:
      "MASLD's own real systemic reach is genuinely substantial: real research finds it a global condition affecting over 31% of people worldwide, and a real, independent risk factor for cardiovascular disease, chronic kidney disease, several cancers, and sleep apnea, not merely a downstream effect of the shared metabolic risk factors (obesity, insulin resistance) already covered elsewhere in this app. The real, specific finding worth knowing directly: fibrosis STAGE, not the raw amount of liver fat, is the strongest disease-specific predictor of cardiovascular risk, a real, direct reason the F0-F4 staging above matters beyond the liver itself. Real, documented mechanisms driving this wide reach include systemic inflammation, gut dysbiosis with metabolic endotoxemia (a real, direct link to this app's own Gut & Microbiome research), and atherogenic dyslipidemia, already covered in this app's own cholesterol research. A real, specific connection worth naming: epicardial fat thickness (fat surrounding the heart itself) correlates directly with both sleep-apnea severity and liver damage in MASLD patients, a real, physical link between three seemingly separate systems.",
    citations: [
      { source: 'Systemic impacts of metabolic dysfunction-associated steatotic liver disease (MASLD) and metabolic dysfunction-associated steatohepatitis (MASH) on heart, muscle, and kidney related diseases, PMID 39086662', url: 'https://pubmed.ncbi.nlm.nih.gov/39086662/' },
    ],
    overallTier: 'strong',
    relatedIds: ['type2-metabolic-syndrome-cluster', 'masld-statin-safety-myth'],
  },
  {
    id: 'masld-history-milestones',
    category: 'fattyLiverDisease',
    title: "MASLD's Own Real, Recent History: Named Three Real Times in Under 45 Years",
    teaser: '1980, 1986, 2023 -- a genuinely fast real naming history compared to most conditions in this app, reflecting how recently the metabolic mechanism itself was actually understood.',
    summary:
      "MASLD's own real history is genuinely short and fast-moving compared to most conditions in this app. In 1980, pathologist Jurgen Ludwig and colleagues first described \"non-alcoholic steatohepatitis,\" real liver damage that looked identical to alcohol-related liver disease under a microscope, in patients who denied heavy alcohol use. In 1986, Shaffer and Thaler formally coined \"non-alcoholic fatty liver disease\" (NAFLD) as the real, broader umbrella term. Real understanding of WHY it happens came later: insulin resistance and hyperinsulinemia were first linked to fatty liver in 1998, and metabolic syndrome specifically in 1999, the real scientific foundation this app's own already-established metabolic-syndrome-cluster research builds on. The real, most recent turning point came in June 2023: a supermajority vote among over 200 physicians, public health experts, and patient advocates renamed the condition MASLD (metabolic dysfunction-associated steatotic liver disease), a real, deliberate move away from \"non-alcoholic,\" a name defined by what the condition ISN'T, and toward naming its actual real, metabolic cause directly, while also reducing real stigma tied to the words \"alcohol\" and \"fatty.\"",
    citations: [
      { source: 'From NAFLD to MASLD: what does it mean?', url: 'https://www.tandfonline.com/doi/full/10.1080/17474124.2024.2374472' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'masld-pregnancy-real-outcomes',
    category: 'fattyLiverDisease',
    title: "MASLD in Pregnancy: Real, Quantified Elevated Risk -- and a Real, Important Distinction From a Genuinely Different, Rare Emergency",
    teaser: 'Real research finds a 3-fold higher gestational diabetes rate with MASLD -- and a real, direct reassurance worth stating plainly: MASLD does NOT raise the risk of a separate, much rarer condition people sometimes confuse it with.',
    summary:
      "MASLD during pregnancy carries real, quantified elevated risk worth knowing directly. Real research finds gestational diabetes occurring in 23% of pregnancies with MASLD versus 7-8% without, alongside real, elevated rates of hypertensive complications (16% vs. 4%), postpartum hemorrhage, and preterm birth, together adding up to real research finding more than 4 times the risk of serious adverse maternal-fetal outcomes overall. Real, additional research finds MASLD during pregnancy is itself a real risk factor for large-for-gestational-age birthweight, and MASLD prevalence in pregnancy has nearly tripled in real, tracked data, from 10.5 to 28.9 per 100,000 pregnancies between 2007 and 2015. The single most important real, direct reassurance worth stating plainly: MASLD does NOT raise the risk of acute fatty liver of pregnancy (AFLP), a real, genuinely different, rare, third-trimester emergency with its own distinct cause, real research finds no established link between the two despite the similar-sounding names, a real, important distinction worth knowing to avoid needless worry about a separate condition that isn't actually connected.",
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
    title: 'A Single Gene Variant Nearly Triples MASLD Risk -- and Its Real Effect Gets Dramatically Worse With Alcohol, Obesity, or T2D',
    teaser: "The PNPLA3 gene variant is a real, textbook example of gene-environment interaction: carrying it alone raises real risk, but combining it with alcohol, obesity, or diabetes amplifies that risk dramatically further.",
    summary:
      "A specific, real, single-letter change in the PNPLA3 gene (called I148M, swapping one amino acid for another at position 148) is one of the most consistently replicated real genetic risk factors for MASLD found anywhere in the research. Real, pooled data finds carrying two copies of the risk variant associated with a real 2.76-fold higher odds of fatty liver, and a striking 4.44-fold higher odds of MASH specifically (the real, more serious inflammatory form already covered in this app's own fibrosis-staging research), compared to carrying no copies. The real mechanism: the altered enzyme has reduced activity, causing fat to genuinely accumulate in liver cells rather than being processed normally. The real, most important practical fact: this variant is described directly in the literature as a textbook case of gene-environment interaction, its real effect on liver damage is dramatically amplified specifically by alcohol consumption, obesity, and type 2 diabetes, meaning the same genetic risk plays out very differently depending on real, modifiable lifestyle factors layered on top of it. Worth knowing directly for anyone with a family history of fatty liver disease or cirrhosis at a relatively young age: genetic testing for this real variant exists, and a positive result is a real, concrete reason to be more conservative about alcohol and weight specifically, not just general advice.",
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
    title: 'Exercise Alone, With No Weight Loss at All, Real Measurably Reduces Liver Fat',
    teaser: 'A real randomized trial found exercise cut liver fat by over 10% with zero change in body weight, and a real meta-analysis found exercise 3.5 times more likely to meaningfully reduce liver fat than standard care, independent of weight lost.',
    summary:
      "This is a real, genuinely encouraging finding worth knowing directly, alongside this app's own already-established, real weight-loss-threshold research for MASLD: exercise itself reduces liver fat through a real mechanism separate from weight loss. A real randomized trial found a structured exercise program reduced intrahepatic (liver) triglyceride content by 10.3% while causing NO significant change in total body weight or body fat percentage, real, direct evidence that exercise moves the needle on its own. A real, broader meta-analysis found exercise training 3.5 times more likely to achieve a clinically meaningful liver-fat reduction (30% or more) compared to standard clinical care, independent of weight loss, with a real minimum exercise dose (roughly 750 metabolic-equivalent minutes per week, comparable to about 150 minutes of moderate activity) appearing necessary for this effect. Real research finds both aerobic and resistance exercise contribute, with aerobic exercise showing a somewhat stronger effect in the current evidence base. Worth knowing directly: this is real, practical, hopeful information for anyone who finds sustained weight loss genuinely difficult, exercise itself is a real, independent lever on liver fat, not just a supporting tool for weight loss, and it's worth pursuing on its own merits even before or alongside any real change on the scale.",
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
    title: 'A Real, Landmark Trial Found High-Dose Vitamin E Genuinely Improved Liver Damage in Non-Diabetic NASH',
    teaser: 'The real PIVENS trial found vitamin E at 800 IU/day resolved active liver inflammation in 42% of patients versus 18% on placebo, real, meaningful evidence for a specific, non-diabetic subgroup already covered elsewhere in this app\'s own medication research.',
    summary:
      "The PIVENS trial is a real, landmark, randomized, placebo-controlled study (247 adults with confirmed NASH, no diabetes) directly testing whether vitamin E supplementation could improve actual liver tissue damage, not just lab values. Real results found vitamin E at 800 IU daily meeting the trial's own pre-defined histological improvement endpoint in 43% of patients, compared to 19% on placebo, with real resolution of NASH itself (active inflammation) achieved in 42% of the vitamin E group versus just 18% on placebo. This connects directly to the vitamin_e_nash medication already tracked elsewhere in this app's own research, giving it a real, specific, quantified trial behind the recommendation rather than just a name on a list. Worth knowing directly and honestly: the PIVENS trial specifically excluded people with diabetes, so this real evidence applies most directly to non-diabetic NASH, and a separate trial did find real benefit in diabetic NASH patients too, but the strength of evidence in that specific subgroup is generally considered less robust than the original PIVENS population. High-dose vitamin E supplementation also carries its own real, separate safety considerations worth discussing with a doctor rather than starting on one's own, since sustained high-dose antioxidant supplementation isn't automatically risk-free. This is a real, meaningful, trial-backed option worth knowing about directly for anyone managing biopsy-confirmed NASH, not just a general \"antioxidants might help\" suggestion.",
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
    title: 'Statins Are Real, Genuinely Safe in Fatty Liver Disease, Despite a Common Myth That Keeps Nearly Half of Eligible Patients Untreated',
    teaser: 'Real research finds serious statin-related liver injury is rare regardless of underlying liver disease, and statins may even directly lower liver enzyme levels in MASLD, yet 40-50% of patients who should be on one still aren\'t.',
    summary:
      "A real, persistent, and genuinely costly myth surrounds statin use in fatty liver disease: many patients and even some clinicians believe statins are unsafe or should be avoided in anyone with liver disease, but real research finds the opposite. Real studies find people with MASLD and elevated cholesterol are NOT at increased risk of statin-related liver injury compared to anyone else, clinically significant drug-induced liver injury from statins is genuinely rare, and elevated liver enzymes above three times the normal upper limit occur in under 1% of treated patients at standard doses. Genuinely striking: real research finds MASLD patients prescribed a statin showed real REDUCTIONS in baseline ALT, AST, and GGT (all real, standard liver-enzyme measures), not the worsening the myth would predict, alongside statins' own already-well-established cardiovascular benefit covered elsewhere in this app's own statin-evidence research. The real, practical cost of this myth is substantial: current research finds 40-50% of MASLD patients who meet standard criteria for statin therapy are not receiving it, despite MASLD itself carrying a real, elevated cardiovascular risk (already covered in this app's own systemic-CVD-CKD research for this condition). Worth knowing directly: a mild, stable elevation in liver enzymes is not, on its own, a real reason to withhold a statin from someone with MASLD who otherwise needs one for cardiovascular protection, and this is worth raising directly if a statin has ever been withheld or discontinued specifically because of a fatty liver diagnosis.",
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
    title: 'MASLD and Sleep Apnea Feed Each Other, Real Evidence of a Genuine Two-Way Street',
    teaser: 'Real research finds oxygen-deprivation episodes during sleep apnea directly worsen liver fat, inflammation, and scarring, while MASLD\'s own metabolic disruption can worsen the airway problems driving sleep apnea in return.',
    summary:
      "MASLD and obstructive sleep apnea (OSA) share a real, genuine bidirectional relationship, worth knowing about directly as another real example of how interconnected metabolic health actually is. Real research finds the two conditions share overlapping metabolic and inflammatory pathways, and finds intermittent hypoxia, the repeated, real drops in blood oxygen that define sleep apnea, directly promotes worsening liver fat, inflammation, oxidative stress, and fibrosis. Real research finds the connection runs the other direction too: the metabolic dysfunction characteristic of MASLD can itself worsen the ventilatory instability and impaired airway muscle control that drive sleep apnea in the first place. Real, large cohort data (265,452 Korean adults, followed an average of 9.5 years) and real cross-sectional research studying patients starting CPAP (the standard sleep-apnea breathing-support treatment) both confirm this real, measurable overlap, with real research finding OSA severity itself independently associated with actual liver tissue damage on biopsy, not just a correlation between two common conditions. Worth knowing directly: this is a real, worth-raising connection for anyone managing MASLD who also has unexplained daytime fatigue, loud snoring, or witnessed breathing pauses during sleep, real sleep apnea screening and treatment may genuinely help liver health too, not just sleep quality, and it's a real, practical extension of this app's own already-established sleep research applied specifically to MASLD.",
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
    title: 'Real, Specific Fiber-Intake Data: Modest Increases Genuinely Improve MASLD, Independent of Weight Loss',
    teaser: 'A real 6-month trial found raising fiber intake from 19g to 29g a day significantly improved fatty-liver status, and separately reduced a real gut-permeability marker (zonulin) at the same time.',
    summary:
      "Dietary fiber carries real, specific, quantified evidence for improving MASLD, worth knowing about directly as a concrete, real number rather than a vague \"eat more fiber\" suggestion. A real 6-month dietary intervention found raising fiber intake from 19 grams a day to 29 grams a day, a real, modest, genuinely achievable increase, produced a measurable improvement in fatty-liver status by the Hamaguchi score, a real, standard ultrasound-based grading tool. Real research finds higher fiber intake linked to lower MASLD risk and reduced liver fat content more broadly, and a real randomized controlled trial testing that same 19-to-29 gram increase found it significantly reduced serum zonulin levels (the same real gut-permeability marker already covered in this app's own gut-microbiome research) while also improving liver enzyme activity, real, direct evidence connecting fiber's own gut-barrier benefit to a measurable liver improvement. Real, dose-specific data finds even 12 grams of added fiber significantly reduced liver steatosis and body mass index in one study, with 24 grams trending toward further steatosis reduction and significantly improving cholesterol and a liver enzyme marker. Worth knowing directly: real research proposes fiber works through enhancing lipid excretion and improving insulin sensitivity, alongside the gut-barrier mechanism above, meaning this is a real, multi-pathway benefit, and it's genuinely one of the more approachable, low-risk dietary changes available for MASLD, directly reinforcing this app's own whole-food, fiber-forward guidance already given elsewhere.",
    citations: [
      { source: 'Impact of a high dietary fiber cereal meal intervention on the progression of liver fibrosis in T2DM with MASLD, PMC12434759', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12434759/' },
      { source: 'Gut Permeability Might be Improved by Dietary Fiber in Individuals with NAFLD Undergoing Weight Reduction, PMC6266494', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6266494/' },
    ],
    overallTier: 'strong',
    relatedIds: ['gut-zonulin-gliadin', 'masld-mediterranean-diet'],
  },
  {
    id: 'masld-sarcopenic-obesity',
    category: 'fattyLiverDisease',
    title: 'Sarcopenic Obesity: A Real, Common, and Genuinely Tricky MASLD Complication Where Muscle Loss and Fat Gain Happen Together',
    teaser: 'Real research finds 44% of MASLD patients have sarcopenia, and real, honest research finds standard weight-loss treatment can make it worse by also reducing muscle mass alongside fat.',
    summary:
      "Sarcopenic obesity, the real, simultaneous loss of muscle mass alongside gain of fat tissue, is a real, common, and genuinely underappreciated complication of MASLD worth knowing about directly. Real research finds sarcopenia affecting a striking 44% of MASLD patients, and real research finds sarcopenic obesity specifically associated with worse MASLD outcomes than either muscle loss or fat gain alone. Real research finds this a genuine, self-reinforcing cycle, excess fat tissue can directly damage muscle's own normal function, driving further muscle loss and reduced capacity for the body to rebuild it, which in turn worsens the metabolic dysfunction driving the fatty liver disease itself. Real research finds this pattern more common in women, older adults, and those with a higher body fat percentage or waist-to-hip ratio. Worth knowing honestly, and genuinely important given this app's own already-established MASLD weight-loss research: real research finds a real, practical tension here, weight loss (the primary MASLD treatment) itself risks further reducing muscle mass if not managed carefully, meaning a well-designed approach needs BOTH real caloric management and real, deliberate resistance exercise (not cardio alone) to protect muscle while losing fat. Worth knowing directly: this is a real, worth-raising consideration for anyone pursuing weight loss for MASLD, tracking strength and muscle mass, not just the number on the scale, and prioritizing protein intake alongside resistance training, are real, concrete ways to avoid trading one health problem for another.",
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
    title: 'A Real Trial Found Eating Within a Shorter Daily Window Reduced Liver Fat, Even Without Cutting Calories',
    teaser: 'A real, controlled crossover trial found time-restricted eating measurably reduced liver fat and waist circumference in MASLD, without participants actually eating less overall.',
    summary:
      "This category's own research already covers exactly how much weight loss it takes to meaningfully improve MASLD. Time-restricted eating, confining food intake to a shorter daily window (commonly 16 hours of fasting, 8 hours of eating) without necessarily reducing total calories, is a real, separate, actively-tested lever worth knowing about directly. A real, single-blind, randomized crossover trial in people with MASLD found 12 weeks of time-restricted eating produced a real, measured reduction in liver fat (via a real ultrasound-based measurement) alongside real reductions in body weight and waist circumference, compared with standard dietary advice, and genuinely without a reduction in reported calorie intake, real evidence the timing of eating itself may be doing independent work, not just the total amount eaten. Other real trials testing different intermittent-fasting patterns (the 5:2 diet, alternate-day fasting) have found broadly similar real improvements in liver fat and metabolic markers. Worth knowing honestly: most of this evidence comes from real but still fairly small, short-duration trials, not yet the kind of large, multi-year outcome data this category's own weight-loss-threshold research is built on. It's real, worth-knowing context for anyone who finds a specific eating WINDOW more sustainable day to day than counting every calorie, a real, different lever toward the same real liver-fat goal.",
    citations: [
      { source: 'Time-Restricted Fasting Improves Liver Steatosis in Non-Alcoholic Fatty Liver Disease — A Single Blinded Crossover Trial, Nutrients 2023, PMID 38068729', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10708421/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['masld-weight-loss-thresholds', 'type2-time-restricted-eating'],
  },
  {
    id: 'masld-colorectal-cancer-risk',
    category: 'fattyLiverDisease',
    title: 'MASLD Carries a Real, Independently Elevated Colorectal Cancer Risk Worth Knowing Plainly',
    teaser: 'A real meta-analysis of nearly 10 million people found MASLD tracked with a real 25% higher colorectal cancer risk and a real 38% higher colorectal adenoma risk.',
    summary:
      "MASLD's own real health reach extends beyond the liver and the cardiovascular/kidney risk already covered in this category, a real, growing body of research finds it independently associated with colorectal cancer and its own precursor lesions, colorectal adenomas (polyps). A real, updated meta-analysis pooling 15 cohort studies and nearly 10 million participants found MASLD tracked with a real 25% higher colorectal cancer risk and a real 38% higher colorectal adenoma risk, and a separate, even larger analysis of over 56 million people found broadly consistent, real elevated risk across colorectal polyps, adenomas, and cancer alike. The real, proposed mechanism runs through the same shared metabolic dysfunction already covered elsewhere in this category, insulin resistance, chronic low-grade inflammation, and altered gut-bacteria metabolites, all of which have their own separately documented links to colorectal cancer risk too. Worth knowing directly and practically: this real, elevated risk is a genuine, concrete reason someone with MASLD has real, individual standing to ask specifically whether their own colorectal cancer screening should start earlier or run more frequently than standard age-based guidelines alone would suggest, the same kind of direct self-advocacy conversation this app's own research already encourages for other real, condition-specific risk elevations.",
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
    teaser: 'Real research finds MASLD in a real 7.4% of the general pediatric population, rising to over half (52.5%) of children with obesity specifically, a real, rapidly growing problem this category\'s own research hasn\'t named directly yet.',
    summary:
      "This category's own already-covered research (weight loss, diet, medications) is written the way most MASLD research still is, centered on adults. Real, current data finds this is genuinely no longer just an adult condition: MASLD is now the most common chronic liver disease in children and adolescents, tracking directly alongside real, rising childhood obesity rates. Real, pooled meta-analysis data finds MASLD present in a real 7.4% of the general pediatric population, rising sharply to 52.5% specifically among children with obesity, over half. Worth knowing honestly: real research finds this same condition genuinely underscreened and underdiagnosed in the pediatric obesity population, meaning a real, substantial share of affected children likely go unrecognized. The real, underlying biology (insulin resistance, visceral fat, the same genetic risk variants like PNPLA3 already covered in this category's own research) works the same way in children as in adults, but real, pediatric-specific management differs in real, practical ways, most weight-loss medications and the one FDA-approved MASH drug (resmetirom) covered elsewhere in this category aren't approved for children, making the real, already-covered lifestyle and dietary levers (weight loss thresholds, the Mediterranean-pattern research) even more central for this age group specifically. Worth knowing directly: a child or adolescent with obesity has real, legitimate standing for a liver-health conversation, not just a weight conversation, given how common this condition turns out to actually be at that age.",
    citations: [
      { source: 'The evolving landscape of pediatric obesity and metabolic dysfunction-associated steatotic liver disease, Frontiers in Pediatrics 2025, PMID 41230444', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12602495/' },
    ],
    overallTier: 'strong',
    relatedIds: ['masld-weight-loss-thresholds', 'masld-pnpla3-genetic-risk'],
  },
  {
    id: 'masld-global-regional-prevalence-genetics',
    category: 'fattyLiverDisease',
    title: 'Fatty Liver Disease Prevalence Varies Enormously by Region, and a Real Gene Explains Part of Why',
    teaser: 'Global MASLD prevalence runs 30%, but Latin America (44.4%) and South Asia (up to 60% in some groups) run far higher than Western Europe (25.1%), a real, gene-and-diet combination behind much of the gap.',
    summary:
      "Fatty liver disease shows a real, wide, well-documented spread across regions of the world. Global MASLD prevalence sits at roughly 30%, but that hides real regional extremes: Latin America carries the highest real prevalence (44.4%), Western Europe the lowest among major regions studied (25.1%), and South Asian populations show a pooled real prevalence of 34.7%, climbing to 60.0% specifically among people who also have Type 2 diabetes, with a real, striking urban-vs-rural gap (47.1% urban vs. 18.5% rural) pointing directly at diet and lifestyle. A real, specific genetic variant helps explain some of this: the PNPLA3 gene variant (I148M) is unevenly distributed by ancestry, and real US data finds Hispanic populations carrying both a higher frequency of this variant AND the highest real MASLD/MASH rates in the country, while African American populations carry a lower variant frequency and correspondingly lower rates despite similar obesity levels. South Asian populations also show a real, distinct pattern already familiar from this app's own PCOS and Type 2 Diabetes research: metabolic problems, including fatty liver, showing up at a genuinely lower body weight than in other populations. Worth knowing directly: a real combination of inherited genetic variation and regional diet/urbanization patterns, not body weight alone, explains much of why fatty liver disease looks so different by region, a real reason this app's own weight-loss and Mediterranean-diet research applies everywhere, even as the real, underlying risk baseline genuinely differs by where someone's own ancestry and current diet sit.",
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
    title: 'A Second Real Gene, Working Through a Genuinely Different Mechanism, Also Drives Fatty Liver Risk',
    teaser: 'PNPLA3 isn\'t the only real genetic driver of MASLD -- a second gene, TM6SF2, works by directly interfering with PNPLA3\'s own function, a real, interconnected two-gene mechanism rather than two separate risks.',
    summary:
      "This category's own already-covered PNPLA3 gene variant isn't the only real, documented genetic contributor to fatty liver disease. A real, second variant, TM6SF2 (specifically its E167K form), also drives real MASLD risk, and recent research has found it works in a genuinely more entangled way than simply adding a second, independent risk: the TM6SF2 variant directly increases physical interaction with the PNPLA3 protein itself, and this interaction impairs PNPLA3's own normal job of transferring polyunsaturated fatty acids within liver cells, real, disrupted fat processing that promotes both fat buildup and liver injury. This is a real, meaningfully different mechanism from PNPLA3 acting alone. Worth knowing directly: someone can carry a real, elevated fatty-liver risk driven by TWO separate but interacting genes rather than one, which may help explain why fatty liver severity varies so much even among people who share similar diet, weight, and lifestyle factors. A real, forward-looking finding from the same research: supplementing with a specific fat compound (phosphatidylcholine containing C18:3) showed promise in early research specifically for people carrying the TM6SF2 variant, a real, potential future personalized approach rather than a one-size-fits-all treatment.",
    citations: [
      { source: 'TM6SF2 E167K variant decreases PNPLA3-mediated PUFA transfer to promote hepatic steatosis and injury in MASLD, PMC11540376', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11540376/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['masld-pnpla3-genetic-risk'],
  },
  {
    id: 'masld-global-lean-asian-phenotype',
    category: 'fattyLiverDisease',
    title: "'Lean' Fatty Liver Disease Is a Real, Distinct, Much More Common Phenomenon in Asian Populations",
    teaser: 'Roughly 45% of MASLD cases in Asian cohorts occur in people who aren\'t overweight by any usual definition, more than double the global rate, and real data finds this "lean" form carries real, higher mortality risk despite the lower body weight.',
    summary:
      "This category's own already-covered weight-loss and Mediterranean-diet research can carry an unspoken assumption worth naming directly: that fatty liver disease mainly affects people who are overweight. Real, global data finds this is genuinely less true in Asian populations specifically. Lean MASLD (fatty liver disease occurring at a BMI under 23 for Asian populations, a real, separately defined threshold from the 25 used elsewhere) makes up 5 to 20% of the worldwide MASLD population overall, but climbs to roughly 45% specifically in Asian cohorts, more than double the global share. The real, distinct mechanism: this isn't the same disease at a smaller body size, real research finds it's characterized by its own real pattern (visceral fat concentrated internally despite a normal overall weight, reduced muscle mass, and real, specific genetic variants in PNPLA3, TM6SF2, and MBOAT7, all already covered elsewhere in this category) driving disease in someone who looks metabolically healthy from the outside. The real, sobering finding: despite the lower body weight, lean MASLD carries similar or even elevated risk of severe liver disease and a real 1.6-fold higher all-cause mortality risk compared with MASLD in people who are overweight. Worth knowing directly: a normal BMI doesn't rule out real, meaningful fatty liver risk, especially for anyone of Asian ancestry, where this specific, distinct phenotype is genuinely common rather than a rare exception.",
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
];
