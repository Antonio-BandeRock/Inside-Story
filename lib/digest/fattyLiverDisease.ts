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
    relatedIds: ['organ-liver-t4t3-conversion', 'organ-liver-hashimotos-damage', 'organ-liver-nafld-link', 'organ-liver-fixing-helps-thyroid'],
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
    relatedIds: ['problem-coffee-timing'],
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
    relatedIds: ['masld-weight-loss-thresholds'],
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
];
