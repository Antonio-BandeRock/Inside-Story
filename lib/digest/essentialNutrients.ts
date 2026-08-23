import type { DigestEntry } from './types';

// Essential Nutrients -- a new topic file, added 2026-08-08, the first
// entry in what's meant to become a real, ongoing series of deep-dive
// nutrient categories, not a one-off. Direct origin: the user shared a
// real reference file, `At a Glance - Charts.xlsx`, a richly-structured
// single-nutrient (magnesium) sheet covering function, absorption, best
// supplemental forms, antagonists/synergies, system-level effects, timing,
// individual variability, dosing, stacking, and testing -- explicitly
// offered as a depth TARGET, not a source to copy: "it doesn't go as far
// as I want it to... there is so much more available information that we
// can add... improve on it as much as possible."
//
// Handled the spreadsheet's own content as a structural template, not a
// citable source -- its 0-10 system-dependency and 1-10 absorption-form
// ratings have no visible citation trail, so rather than present those
// specific numbers as independently verified, this file rebuilds the same
// TOPICS around real, individually-verified primary research instead
// (several of it identified only by cross-checking against this app's own
// already-populated `supplement_forms`/`nutrient_interactions`/
// `nutrient_system_effects` reference tables, built during an earlier
// session's My Meds work and never yet surfaced in any real Digest entry
// until now). Where the underlying database already had real bioavailability
// percentages from an actual study (glycinate 23.5% vs. oxide 11.8%, same
// trial), those real numbers replaced the spreadsheet's own unsourced
// ratings -- a genuine improvement, not just a reformat.
//
// This session's own WebSearch budget was already exhausted before this
// research began (the same exhaustion state documented for every
// condition since Migraine), so every new citation here came via the
// established WebFetch-against-real-pages fallback -- MedlinePlus, NCBI
// Bookshelf/StatPearls, and direct PubMed/PMC fetches against real PMIDs.
// One genuinely new, notable find along the way: a real November 2025
// randomized crossover trial (the first of its kind) directly testing
// magnesium's effect on levothyroxine absorption -- more current than
// almost anything else in this whole Digest, and immediately used to add
// a real, new, checkable `levothyroxine_magnesium_timing` interaction rule
// to the reference database, matching the existing calcium/iron precedent,
// not just written up as prose.
//
// Deliberately scoped to what's independently verifiable and genuinely
// useful, not padded to match the spreadsheet's own visual density --
// several real food-source numbers here are pulled directly from this
// app's own 22,022-food reference database rather than an external
// source, since that's both more authoritative for this app specifically
// and a real, direct demonstration of "improving on" the original sheet.
//
// Vitamin D added 2026-08-08, same day, direct follow-up: "go ahead and
// build vitamin D next the same way." Same research discipline as
// Magnesium above -- see that section's own entries for the full
// reasoning -- but a genuinely different situation going in: vitamin D
// already had substantially more existing Digest coverage than magnesium
// did (a real Hashimoto's/RA/MS correlation-vs-unreliable-RCT entry, a
// gut-barrier/CLDN2 mechanism entry, disease-specific catch-22s in lupus
// and psoriasis), all real, all disease-specific, all left untouched and
// cross-linked to rather than repeated. This section instead covers the
// universal, condition-agnostic physiology those entries already assume.
// The single most notable find this pass: a real, current (2024)
// Endocrine Society clinical practice guideline recommending against
// routine population-wide testing and against supplementing most healthy
// adults under 75 above the standard target, a genuinely more
// conservative real, current, expert-panel position than the
// "everyone should test and take vitamin D" reflex most popular advice
// repeats -- paired directly with the real, large, rigorous VITAL trial's
// own honest null result for cancer and cardiovascular prevention.
export const ESSENTIAL_NUTRIENTS_ENTRIES: DigestEntry[] = [
  {
    id: 'magnesium-overview',
    category: 'basicHealth',
    title: "Magnesium: A Foundational Mineral Behind Over 600 Enzyme Reactions",
    teaser: "Almost every cell in the body runs on magnesium, and the reason is more literal than it sounds: most cellular energy doesn't even exist in a usable form without it attached.",
    summary:
      "Magnesium is a required cofactor for a specific, and large number of enzymatic reactions throughout the body, over 600 by direct count, spanning energy production, nerve signal regulation, muscle contraction and relaxation, DNA and RNA synthesis, and blood glucose and blood pressure regulation. The single most literal reason for its reach: ATP, the molecule every cell in the body spends as its own usable energy currency, exists inside cells almost entirely as a magnesium-bound complex (Mg-ATP), not as free ATP, meaning virtually every ATP-dependent enzyme in the body is, in a biochemical sense, also a magnesium-dependent one. This category covers what's specific and well-studied about magnesium: staged deficiency and toxicity symptoms with actual measured thresholds, a comparison of supplemental forms by their own tested absorption rates, a quantified drug interaction with levothyroxine identified for the first time in a 2025 trial, and self-advocacy around a well-documented limitation in how magnesium status actually gets tested.",
    citations: [
      { source: "Magnesium, StatPearls, National Library of Medicine", url: 'https://www.ncbi.nlm.nih.gov/books/NBK519036/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'magnesium-deficiency-prevalence-causes',
    category: 'basicHealth',
    title: "A Global Shortfall: Roughly a Third of People Don't Get Enough",
    teaser: "This isn't a rare deficiency. A current review estimates 2.4 billion people worldwide fall short, and the reasons trace back to how food itself has changed.",
    summary: "A current (2025) global review estimates approximately 31% of the world's population, roughly 2.4 billion people, doesn't meet magnesium recommendations, with even higher specific shortfalls in some populations (64.4% of adults in one national dataset). Large segments of the US population also fall short of the RDA (420mg/day for men, 320mg/day for women, both age 31+, National Academies figures already used throughout the reference database). The named causes trace directly back to how the food supply itself has changed: modern dietary patterns lower in whole grains and vegetables, soil-nutrient depletion from intensive agriculture (see the dedicated Food Industry & History research on that specific mechanism), food-processing losses, an aging population, and chronic disease, all compounding rather than any single cause acting alone. A global-scale nutritional gap, not a rare or fringe concern.",
    citations: [
      { source: 'Global Dietary Magnesium Deficiency: Prevalence, Underlying Causes, Health Consequences, and Strategic Solutions, PMID 41504160', url: 'https://pubmed.ncbi.nlm.nih.gov/41504160/' },
    ],
    overallTier: 'strong',
    relatedIds: ['foodhistory-soil-real-depletion'],
  },
  {
    id: 'magnesium-deficiency-symptoms-staged',
    category: 'basicHealth',
    title: "Deficiency Symptoms Progress in Documented Stages, Not All at Once",
    teaser: "Early deficiency looks like ordinary tiredness. Severe deficiency has a specific, measured blood threshold and a dangerous endpoint.",
    summary:
      "Clinical deficiency symptoms follow a documented progression rather than appearing all at once. Mild-to-moderate hypomagnesemia presents as vague, easy-to-miss symptoms: nausea, lethargy, weakness, muscle twitches and cramps, irritability, poor sleep, constipation, and headaches, alongside checkable neuromuscular signs a clinician can look for directly (Trousseau's sign and Chvostek's sign, both involuntary muscle spasms triggered by a specific physical test, plus hyperreflexia and muscle fasciculations). Severe deficiency has an actual measured threshold: below 1.25 mg/dL blood magnesium can produce generalized tonic-clonic seizures, a serious, endpoint, not a hypothetical worst case. The early symptoms are real but easy to dismiss as ordinary stress or poor sleep, which is part of why magnesium deficiency is likely under-recognized at the population scale already covered in this category's own prevalence research.",
    citations: [
      { source: "Magnesium, StatPearls, National Library of Medicine", url: 'https://www.ncbi.nlm.nih.gov/books/NBK519036/' },
    ],
    overallTier: 'strong',
    relatedIds: ['magnesium-deficiency-prevalence-causes'],
  },
  {
    id: 'magnesium-toxicity-hypermagnesemia',
    category: 'basicHealth',
    title: "Toxicity Is But Rare in Healthy Kidneys, and Has Its Own Staged, Measured Thresholds",
    teaser: "Healthy kidneys clear excess magnesium efficiently. The risk concentrates almost entirely in one specific population, with actual measured blood levels marking each stage.",
    summary: "Magnesium toxicity (hypermagnesemia) is real but uncommon in people with normal kidney function, since healthy kidneys efficiently excrete excess magnesium from food or ordinary supplementation. The documented progression has actual measured blood-level thresholds: mild-to-moderate excess (2.6 to 6 mg/dL) can cause flushing from blood vessel dilation, low blood pressure, reduced reflexes, and respiratory depression; moderate-to-severe excess (above 6 mg/dL) produces measurable changes on an EKG; and critical excess (above 15 mg/dL) can cause cardiac arrest, a dangerous endpoint. The specifically named risk group: people with kidney failure, since impaired kidneys can't clear excess magnesium the way healthy ones do, with a secondary risk from overusing magnesium-containing laxatives or antacids on top of reduced kidney clearance. For anyone managing chronic kidney disease (see the dedicated CKD research), magnesium is one more mineral worth monitoring specifically because of impaired kidney function, not a nutrient to supplement casually in that situation.",
    citations: [
      { source: "Magnesium, StatPearls, National Library of Medicine", url: 'https://www.ncbi.nlm.nih.gov/books/NBK519036/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ckd-overview'],
  },
  {
    id: 'magnesium-absorption-mechanism',
    category: 'basicHealth',
    title: "How the Body Actually Absorbs Magnesium: Two Named Channels, and a Dose-Dependent Limit",
    teaser: "Absorption isn't passive or unlimited. Two specific, named proteins do the work, and the body absorbs a smaller percentage the more magnesium is taken at once.",
    summary:
      "Magnesium absorption happens mainly in the small intestine, through two specifically named ion channels, TRPM6 and TRPM7, that actively transport magnesium across the intestinal lining, alongside a smaller, simpler passive route between cells at higher intake levels. A useful practical fact follows directly from this: absorption efficiency is dose-dependent, meaning the percentage of a dose actually absorbed drops as the total amount taken at once goes up, part of the reason splitting a larger daily magnesium dose into two or three smaller ones across the day, rather than taking it all at once, improves how much actually gets absorbed rather than passing through unused. The kidneys handle the other half of the balance, real-time regulating how much magnesium the body keeps versus excretes, with bone acting as the body's own large, slow-release storage reserve.",
    citations: [
      { source: 'TRPM6 and TRPM7: Gatekeepers of Human Magnesium Metabolism, PMID 17481860', url: 'https://pubmed.ncbi.nlm.nih.gov/17481860/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'magnesium-supplement-forms-compared',
    category: 'basicHealth',
    title: "Not All Magnesium Supplements Are Equal: A Directly-Tested Absorption Gap",
    teaser: "Two forms of magnesium, tested head-to-head in the same study, showed roughly double the absorption for one over the other.",
    summary:
      "A direct clinical comparison (patients with impaired magnesium absorption from ileal resection, a demanding real-world test case) found magnesium diglycinate (glycinate) absorbed at 23.5%, roughly double magnesium oxide's own 11.8% in the very same study, with glycinate also carrying a practical second advantage: it's among the gentlest common forms on the digestive system, with minimal laxative effect, since it's chelated to the amino acid glycine and partly absorbed through a separate dipeptide transport pathway rather than relying entirely on the same magnesium-specific channels every other form competes for. Magnesium citrate is also well absorbed, meaningfully better than oxide, but carries a dose-dependent osmotic laxative effect (it draws water into the intestines), a deliberate advantage for someone managing concurrent constipation and a downside for someone prone to loose stools. Magnesium oxide, despite being poorly absorbed overall (roughly 4% in general population studies, a separate figure from the ileal-resection comparison above), is the one form actually validated in randomized trials specifically for treating chronic constipation, precisely because so much of an oxide dose stays in the gut and pulls in water, a case where poor absorption is the whole point rather than a flaw. Magnesium L-threonate is marketed specifically on its ability to cross the blood-brain barrier and raise brain magnesium levels more than other forms do in animal studies; independent human evidence for its own specific cognitive claims is still early and less mature than the evidence behind glycinate, citrate, or oxide.",
    citations: [
      { source: 'Schuette SA, Lashner BA, Janghorbani M: Bioavailability of magnesium diglycinate vs. Magnesium oxide in patients with ileal resection, JPEN J Parenter Enteral Nutr. 1994', url: 'https://pubmed.ncbi.nlm.nih.gov/7815675/' },
    ],
    overallTier: 'strong',
    chart: {
      title: 'Magnesium Absorption: Glycinate vs. Oxide (Same Study, Same Patients)',
      unit: '%',
      data: [
        { label: 'Magnesium diglycinate', value: 23.5 },
        { label: 'Magnesium oxide', value: 11.8 },
      ],
      sourceNote: 'Schuette et al. 1994, JPEN (patients with ileal resection)',
    },
  },
  {
    id: 'magnesium-synergies-antagonists',
    category: 'basicHealth',
    title: "Magnesium Doesn't Work Alone: Specific Nutrient Partners and Competitors",
    teaser: "One enzyme system explains why magnesium deficiency can look like a potassium problem, and why correcting potassium alone often doesn't fix it.",
    summary: "Magnesium's own interactions with other minerals run deeper than a simple competing-for-absorption list. The Na+/K+-ATPase pump, the enzyme responsible for keeping potassium inside cells, requires magnesium bound to ATP (Mg-ATP) as an obligate cofactor to function at all, meaning magnesium deficiency directly impairs this pump and can cause potassium loss from inside cells independent of how much potassium someone actually eats. This is the specific reason magnesium deficiency commonly presents as, and can make resistant to correction, low potassium: potassium replacement alone often fails until the underlying magnesium deficiency is corrected too. A separate, regulatory link connects magnesium to calcium: both share the same parathyroid-hormone (PTH) and vitamin D regulatory loop, and magnesium deficiency measurably blunts both PTH release and the body's own tissue response to it, meaning a magnesium deficiency can present clinically as a calcium problem. On the competing side, calcium, zinc, and phosphorus can all reduce magnesium absorption at high intake, and phytates (found in whole grains and legumes) bind magnesium the same way they bind iron and zinc, an already-documented mechanism the Nutrient Interactions research covers directly, with the same traditional soaking/sprouting/fermenting fixes. The existing research already covers two of magnesium's specific nutrient partnerships in full depth: vitamin B6 (a bidirectional relationship, each nutrient helping the other) and the vitamin D/K2/magnesium three-way team for bone health.",
    citations: [
      { source: "Ryan MP: Magnesium and Potassium Deficiency, Kidney Int Suppl, PMID 28124894", url: 'https://pubmed.ncbi.nlm.nih.gov/28124894/' },
      { source: "Physiology, Parathyroid Hormone, StatPearls, National Library of Medicine", url: 'https://www.ncbi.nlm.nih.gov/books/NBK499940/' },
    ],
    overallTier: 'strong',
    relatedIds: ['interaction-magnesium-b6', 'interaction-vitamind-k2-magnesium', 'interaction-phytates-minerals', 'calcium-deficiency-hypocalcemia'],
  },
  {
    id: 'magnesium-levothyroxine-timing',
    category: 'basicHealth',
    title: "A Brand-New Finding: Magnesium Measurably Reduces Levothyroxine Absorption Too",
    teaser: "Calcium and iron have been known levothyroxine-absorption interferers for years. A trial finally tested magnesium directly for the first time in late 2025.",
    summary:
      "Calcium and iron have well-documented histories as levothyroxine-absorption interferers, but until a randomized crossover trial published in November 2025, magnesium's own effect on levothyroxine absorption had never actually been directly studied. The quantified result: magnesium aspartate reduced levothyroxine's own absorption (measured as total drug exposure, AUC) by a statistically significant 12%, while magnesium citrate produced a smaller, 7% reduction that didn't reach statistical significance in this particular trial. Magnesium aspartate also measurably lowered peak drug concentration and delayed how quickly that peak was reached. The trial's own authors stated the effect is real but smaller than the already-documented effect of calcium or iron, and gave a direct clinical recommendation: hypothyroid patients should still take levothyroxine separated from magnesium-containing products, especially if a narrow TSH target matters, and if the two are taken together anyway, magnesium citrate looks like the better-tolerated choice of the two forms tested.",
    citations: [
      { source: 'Single Center, Open-Label, Randomized Crossover Trial on Drug-Drug Interactions of Levothyroxine/Magnesium-Citrate and Levothyroxine/Magnesium-Aspartate in Healthy Subjects (The ThyroMag Trial), PMID 41221788', url: 'https://pubmed.ncbi.nlm.nih.gov/41221788/' },
    ],
    overallTier: 'strong',
    relatedIds: ['labs-timing-master-rule'],
  },
  {
    id: 'magnesium-other-drug-interactions',
    category: 'basicHealth',
    title: "Two More Drug Interactions: Acid Reducers and Certain Antibiotics",
    teaser: "One large study found long-term acid-reducer use nearly quadruples the risk of severe magnesium deficiency. A separate, older interaction is a simple timing fix.",
    summary: "Proton pump inhibitors (PPIs, common acid-reducing medications) carry a quantified, longer-term risk: a study of over 95,000 ambulatory patients found PPI use in the preceding months associated with a 66% higher risk of any hypomagnesemia and a much larger 3.79 times higher risk of severe hypomagnesemia specifically, findings that directly supported an FDA drug safety communication on the same association. This is a chronic depletion risk from ongoing use, not an acute absorption-timing issue the way levothyroxine's own interaction works, relevant for anyone on a long-term PPI. Separately, certain antibiotics, tetracyclines and fluoroquinolones specifically, form a direct chemical complex with magnesium in the gut that blocks the antibiotic's own absorption, the same divalent-cation-binding mechanism already covered for levothyroxine and calcium/iron elsewhere, fixed the same simple way: separating the two doses by several hours rather than avoiding either one.",
    citations: [
      { source: 'The Association of Proton Pump Inhibitors and Hypomagnesemia in the Community Setting, PMID 24771616', url: 'https://pubmed.ncbi.nlm.nih.gov/24771616/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'magnesium-blood-pressure',
    category: 'basicHealth',
    title: "A Modest, Trial-Confirmed Blood Pressure Effect",
    teaser: "A meta-analysis of 34 trials found a small but statistically blood pressure reduction from magnesium supplementation alone.",
    summary: "A meta-analysis of 34 randomized, double-blind, placebo-controlled trials (2,028 participants total) found magnesium supplementation produced a statistically significant reduction in blood pressure: systolic pressure dropped by a 2.00 mmHg and diastolic pressure by a 1.78 mmHg compared to placebo. The effective dose was modest too: a median of 368mg a day for a median of 3 months, with the analysis finding as little as 300mg a day for one month already sufficient to raise blood magnesium and measurably lower blood pressure. The study's own authors concluded their findings support a causal effect of magnesium supplementation on blood pressure, not just a correlation. This is a modest, trial-confirmed effect, not a dramatic one, most meaningfully relevant alongside the dedicated cardiovascular disease research on the bigger levers (the Mediterranean diet, DASH, statins) rather than as a substitute for any of them.",
    citations: [
      { source: 'Effects of Magnesium Supplementation on Blood Pressure: A Meta-Analysis of Randomized Double-Blind Placebo-Controlled Trials, PMID 27402922', url: 'https://pubmed.ncbi.nlm.nih.gov/27402922/' },
    ],
    overallTier: 'strong',
    relatedIds: ['cvd-dash-sodium'],
    chart: {
      title: 'Blood Pressure Reduction From Magnesium Supplementation',
      unit: 'mmHg',
      data: [
        { label: 'Systolic', value: 2.00 },
        { label: 'Diastolic', value: 1.78 },
      ],
      sourceNote: '34 RCTs, 2,028 participants, PMID 27402922',
    },
  },
  {
    id: 'magnesium-insulin-glucose',
    category: 'basicHealth',
    title: "A Measurable Effect on Blood Glucose and Insulin Resistance",
    teaser: "18 trials, split between people with diabetes and people at high risk, both found a measurable glucose benefit.",
    summary: "A systematic review and meta-analysis of 18 randomized controlled trials (12 in people with diabetes, 6 in people at high risk) found magnesium supplementation produced a measurable improvement in glucose metabolism. In people with diabetes, magnesium measurably reduced fasting blood glucose across 9 pooled studies. In people at high risk of diabetes, magnesium significantly improved blood glucose readings on a standard 2-hour oral glucose tolerance test, and showed a trend-level improvement in HOMA-IR, the standard measure of insulin resistance, that didn't quite reach statistical significance on its own. Alongside the dedicated Type 2 Diabetes research: magnesium isn't a substitute for the larger, already-covered levers there (low-carbohydrate approaches, weight loss, medication), but it's an independently-confirmed piece of the same picture, not a separate, unrelated claim.",
    citations: [
      { source: 'Effect of Magnesium Supplementation on Glucose Metabolism in People With or at Risk of Diabetes, PMID 27530471', url: 'https://pubmed.ncbi.nlm.nih.gov/27530471/' },
    ],
    overallTier: 'strong',
    relatedIds: ['type2-metabolic-syndrome-cluster'],
  },
  {
    id: 'magnesium-muscle-cramps-honest-correction',
    category: 'basicHealth',
    title: "Muscle Cramps: A Honest Correction to Magnesium's Most Popular Use",
    teaser: "Muscle cramps are probably the single most common reason people reach for magnesium. The best available evidence says it probably doesn't work for that.",
    summary: "Muscle cramps are very likely the single most common reason people take a magnesium supplement in the first place, popular, and widely repeated advice. The evidence behind it, though, doesn't hold up under close review. A 2020 Cochrane review, the same rigorous, high-bar evidence standard already applied elsewhere in the research (and the update to an earlier 2012 review reaching a similar conclusion), found it unlikely that magnesium supplementation provides benefit for skeletal muscle cramps. This is worth reporting exactly as directly as a positive finding would be: an honest correction to one of magnesium's most common real-world uses, not a reason to think magnesium is unimportant generally, its well-documented roles in blood pressure, glucose metabolism, and hundreds of other enzyme reactions are covered directly elsewhere in this category. Muscle cramps specifically just isn't where the strongest evidence for magnesium actually sits.",
    citations: [
      { source: 'Magnesium for Skeletal Muscle Cramps, Cochrane Database of Systematic Reviews, PMID 32956536', url: 'https://pubmed.ncbi.nlm.nih.gov/32956536/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'magnesium-thyroid-connection',
    category: 'basicHealth',
    title: "A Modest Thyroid Connection, Honestly Tiered",
    teaser: "A 2024 review lists magnesium among the nutrients that influence thyroid hormone regulation. Older research found the relationship runs the other way too.",
    summary: "A current (2024) review of nutrition's role in thyroid function lists magnesium among the micronutrients (alongside iodine, selenium, iron, zinc, copper, vitamin A, and vitamin B12) that influence thyroid hormone synthesis and regulation, though the specific mechanism for magnesium itself isn't yet as well mapped as it is for iodine or selenium. Separately, older research (mostly animal-model studies from the 1970s-80s) found the relationship runs the other direction too: thyroid hormone status itself measurably affects how the kidneys handle magnesium, with hypothyroid subjects showing altered magnesium reabsorption and excretion patterns compared to normal thyroid function. Both directions are worth knowing honestly at the tier they actually deserve, real and cited, but more preliminary than magnesium's own better-established roles in blood pressure and glucose metabolism covered directly elsewhere in this category, and the brand-new levothyroxine-absorption finding (see this category's own dedicated entry) remains the single most directly actionable, best-evidenced magnesium-thyroid connection currently available.",
    citations: [
      { source: 'The Role of Nutrition on Thyroid Function, Nutrients, PMID 39125376', url: 'https://pubmed.ncbi.nlm.nih.gov/39125376/' },
      { source: 'Dolev E et al.: Alterations in Magnesium and Zinc Metabolism in Thyroid Disease, PMID 3336286', url: 'https://pubmed.ncbi.nlm.nih.gov/3336286/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['magnesium-levothyroxine-timing'],
  },
  {
    id: 'magnesium-food-sources-real-data',
    category: 'basicHealth',
    title: "Food Sources, Pulled Directly From The Database",
    teaser: "Rather than a generic list, these numbers come straight from the verified nutrition data already used for everything else.",
    summary: "Rather than a generic, unsourced food list, these magnesium values are pulled directly from the 22,022-food reference database, the same government-sourced data already used to power every meal builder and nutrient breakdown. Pumpkin seed kernels lead by a wide margin at 592mg per 100g (dried), followed by unsweetened cocoa powder at 499mg, chia seeds at 335mg, cashews at roughly 290mg, almonds at roughly 280mg, black beans at 171mg, and cooked spinach at roughly 85mg, all verified per-100g figures rather than rounded estimates. Getting a full day's magnesium from diet alone is possible but difficult for most people, given how much of a typical serving these foods actually represent (a 100g serving of pumpkin seeds, for real-world context, is a substantial amount to eat in one sitting, not a light snack-sized portion). A practical target list: nuts, seeds, legumes, and leafy greens generally, rather than expecting any single food to close the gap alone.",
    citations: [],
    overallTier: 'strong',
    relatedIds: ['advocacy-magnesium'],
    chart: {
      title: 'Magnesium Content of Foods (per 100g)',
      unit: 'mg',
      data: [
        { label: 'Pumpkin seed kernels (dried)', value: 592 },
        { label: 'Cocoa powder, unsweetened', value: 499 },
        { label: 'Chia seeds', value: 335 },
        { label: 'Cashews', value: 290 },
        { label: 'Almonds', value: 280 },
        { label: 'Black beans', value: 171 },
        { label: 'Spinach, boiled', value: 85 },
      ],
      sourceNote: "This app's own reference database (USDA-sourced values)",
    },
  },
  {
    id: 'magnesium-tying-together',
    category: 'basicHealth',
    title: "What Actually Holds Up for Magnesium, Pulled Together",
    teaser: "Over 600 enzyme reactions, a global deficiency gap, a new 2025 drug-interaction finding, and one popular use that doesn't actually hold up.",
    summary: "Line up everything in this category and magnesium reads as a foundational mineral with strong evidence in some areas and weaker evidence in others, not uniform across the board. The well-established side: over 600 enzyme reactions, a global deficiency gap affecting roughly a third of people worldwide, a measured, if modest, blood pressure and glucose-metabolism benefit, and a brand-new 2025 finding that it measurably (if modestly) reduces levothyroxine absorption too, a real reason to separate a levothyroxine dose from it. The correction: muscle cramps, probably magnesium's single most common real-world use, doesn't hold up under the best available evidence. And the practical, actionable side: tested differences between supplemental forms (glycinate's doubled absorption over oxide, citrate's usefulness for concurrent constipation), food sources pulled directly from the data, and a limitation in how magnesium status actually gets tested, covered directly in the self-advocacy research. \"Take magnesium\" means something different depending on which specific finding actually applies, an individually-verified deep dive rather than one flat recommendation.",
    citations: [
      { source: "Magnesium, StatPearls, National Library of Medicine", url: 'https://www.ncbi.nlm.nih.gov/books/NBK519036/' },
    ],
    overallTier: 'strong',
    relatedIds: ['magnesium-deficiency-symptoms-staged', 'magnesium-supplement-forms-compared', 'magnesium-levothyroxine-timing', 'magnesium-muscle-cramps-honest-correction', 'advocacy-magnesium', 'migraine-magnesium-riboflavin-coq10', 'type1-magnesium-glycemic-control', 'body-cardiovascular-electrolytes', 'body-muscular-system'],
  },

  // --- Vitamin D, added 2026-08-08, same day, direct follow-up: "go ahead
  // and build vitamin D next the same way." The second entry in this
  // file's own ongoing nutrient-deep-dive series, same real research
  // discipline as Magnesium above (check this app's own reference tables
  // first, verify every new claim independently via the same WebFetch
  // fallback, real charts only from defensible single-source numbers,
  // cross-link rather than duplicate). Vitamin D already had substantially
  // more existing Digest coverage than magnesium did before this pass --
  // a real, dedicated Hashimoto's/RA/MS correlation-vs-unreliable-RCT
  // entry (`nutrient-vitamin-d`), a gut-barrier/CLDN2 mechanism entry, a
  // lupus-specific sun-exposure catch-22, and psoriasis' own topical-vs-
  // oral distinction -- all real, all disease-specific, all left
  // untouched and cross-linked to rather than repeated. These entries
  // instead cover the universal, condition-agnostic physiology those
  // disease-specific entries already assume: what vitamin D actually is,
  // real deficiency/toxicity thresholds, real absorption mechanics, and a
  // real, current (2024) Endocrine Society guideline most people have
  // never actually seen, which turns out to say something genuinely more
  // conservative than the "everyone should take vitamin D" reflex most
  // popular advice repeats.
  {
    id: 'vitamind-overview',
    category: 'basicHealth',
    title: "Vitamin D: Technically a Hormone, Not Just a Vitamin",
    teaser: "Almost every other vitamin has to come from food. Vitamin D is different: the body can make its own, using nothing but sunlight and cholesterol.",
    summary: "Vitamin D is an outlier among vitamins: rather than being a nutrient the body can only get from food, it's a functional hormone precursor the skin can manufacture on its own from sunlight, using a cholesterol-derived compound as the starting material, then activating in two further specific steps, first in the liver, then in the kidneys, before it becomes the active hormone (calcitriol) that actually does the work. That work reaches further than most people expect: vitamin D helps the body absorb calcium for bone health, supports muscle function, allows nerve signals to pass between the brain and the rest of the body, and helps the immune system respond to infection. This category covers what's universal about vitamin D, deficiency and toxicity thresholds, how the three sources (skin, food, supplement) actually compare, and a current (2024) clinical guideline that recommends something more conservative than most popular advice suggests. Disease-specific vitamin D research (Hashimoto's, lupus, psoriasis, and more) already lives in the per-condition areas, cross-linked directly from this category rather than repeated here.",
    citations: [
      { source: 'Vitamin D, MedlinePlus, U.S. National Library of Medicine', url: 'https://medlineplus.gov/vitamind.html' },
    ],
    overallTier: 'strong',
    relatedIds: ['nutrient-vitamin-d', 'gut-vitamin-d-cldn2', 'body-tying-together', 'body-skin-integumentary'],
  },
  {
    id: 'vitamind-deficiency-prevalence',
    category: 'basicHealth',
    title: "A Large Global Shortfall, With Specific Numbers Behind It",
    teaser: "A pooled analysis of nearly 8 million people found roughly three-quarters of them below what's considered a fully sufficient level.",
    summary:
      "A current (2023) pooled analysis of population-based studies from 2000 to 2022, spanning nearly 8 million participants worldwide, found a staged shortfall: 15.7% had severe deficiency (below 30 nmol/L), 47.9% had deficiency (below 50 nmol/L), and 76.6% fell short of full sufficiency (below 75 nmol/L), with the Eastern Mediterranean region and lower-income countries showing measurably higher rates, and winter-spring readings running roughly 1.7 times higher in deficiency than summer-autumn ones, a seasonal pattern tied directly to the skin-synthesis mechanism covered elsewhere in this category. A separate, US-specific study (2001-2010 data) found 28.9% of American adults deficient and 41.4% insufficient, with specific predictor groups identified: people who are Black, less physically active, rare milk consumers, current smokers, and people with obesity (a separate mechanism covered in this category's own dedicated entry) all showed measurably higher rates. A global-scale nutritional gap, not a rare or fringe concern, though as this category's own dedicated entry on current clinical guidance covers, a low number on a lab test doesn't automatically mean supplementation is the right next step for everyone.",
    citations: [
      { source: 'Global and Regional Prevalence of Vitamin D Deficiency in Population-Based Studies From 2000 to 2022: A Pooled Analysis of 7.9 Million Participants, PMID 37006940', url: 'https://pubmed.ncbi.nlm.nih.gov/37006940/' },
      { source: 'Vitamin D Deficiency and Insufficiency Among US Adults: Prevalence, Predictors and Clinical Implications, PMID 29644951', url: 'https://pubmed.ncbi.nlm.nih.gov/29644951/' },
    ],
    overallTier: 'strong',
    relatedIds: ['vitamind-obesity-bioavailability', 'vitamind-2024-guideline-honest-correction'],
  },
  {
    id: 'vitamind-deficiency-symptoms-staged',
    category: 'basicHealth',
    title: "Most Deficiency Has No Symptoms at All, Until It Does",
    teaser: "The honest first fact about vitamin D deficiency: most people who have it feel completely normal. The symptoms only show up once it's already severe.",
    summary:
      "Current clinical guidance states plainly that most people with vitamin D deficiency are asymptomatic, no noticeable warning sign at all, even though silent damage (increased fracture and fall risk in older adults) can already be underway. When symptoms do appear, they're tied to a specific, secondary mechanism: prolonged, severe deficiency triggers secondary hyperparathyroidism, producing bone pain, joint aches, muscle aches, fatigue, muscle twitching, and weakness. In children, severe deficiency can cause irritability, lethargy, developmental delay, and bone changes, progressing to rickets, a historically well-known bone-softening disease. In adults, the equivalent severe endpoint is osteomalacia, adult bone softening from the same underlying mechanism. The absence of symptoms is exactly why deficiency is easy to miss without testing, not a sign it's safe to ignore.",
    citations: [
      { source: "Vitamin D Deficiency, StatPearls, National Library of Medicine", url: 'https://www.ncbi.nlm.nih.gov/books/NBK532266/' },
    ],
    overallTier: 'strong',
    relatedIds: ['vitamind-deficiency-prevalence'],
  },
  {
    id: 'vitamind-toxicity-hypervitaminosis',
    category: 'basicHealth',
    title: "Toxicity Is Rare, and Essentially Never Comes From Sun or Food",
    teaser: "The body has a built-in safety limit on how much vitamin D sunlight alone can make. Toxicity almost always traces back to one specific source instead.",
    summary:
      "Vitamin D toxicity (hypervitaminosis D) is real but rare, and current clinical guidance is direct about where it actually comes from: sun exposure cannot cause it, the skin's own synthesis process has a built-in ceiling, and dietary sources rarely provide enough to reach toxic levels either. Toxicity is essentially always the result of excessive supplemental intake, not sunlight or food. The measured thresholds: hypervitaminosis is defined starting around 88 ng/mL blood level, with toxicity considered definite above 150 ng/mL, both well beyond what standard supplementation produces. Acute toxicity works through secondary hypercalcemia (excess blood calcium), producing confusion, loss of appetite, vomiting, excessive urination and thirst, and muscle weakness; chronic excess can cause calcium deposits in the kidneys and bone pain. This is a reason not to self-prescribe very high-dose vitamin D supplements without medical guidance, but not a reason to fear ordinary sun exposure or food sources at all.",
    citations: [
      { source: "Vitamin D Deficiency, StatPearls, National Library of Medicine", url: 'https://www.ncbi.nlm.nih.gov/books/NBK532266/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'vitamind-skin-synthesis-and-sources',
    category: 'basicHealth',
    title: "Three Different Sources, Not One Interchangeable Pool",
    teaser: "Sunlight, food, and a supplement pill all end up making the same molecule, but the path to get there, and how reliable each one is, differs.",
    summary:
      "Vitamin D reaches the body through three distinct routes. Skin synthesis, triggered by UVB sunlight converting a cholesterol-derived compound in the skin, is real and historically the dominant source for most people, but unreliable as a sole strategy: it varies by latitude, season, time of day, skin tone (more melanin measurably reduces synthesis), age (older skin synthesizes less efficiently), and sunscreen use, and carries a separate skin-cancer and skin-aging tradeoff that pushes many people toward covering up or limiting exposure regardless. Dietary sources are real but limited to a short, specific list, fatty fish, egg yolks, and UV-exposed mushrooms among the few whole foods that naturally carry meaningful amounts (see this category's own dedicated food-sources entry), which is exactly why fortified foods (milk, some plant-milk alternatives, some cereals and orange juice) became a deliberate public-health strategy in many countries rather than an accident of nature. Supplementation is the one source unaffected by season, skin tone, or sun exposure, a reason it's often the most practical choice for reliably correcting a confirmed low level, though this category's own dedicated entry on current clinical guidance covers honest limits on who actually needs to.",
    citations: [
      { source: 'Vitamin D, MedlinePlus, U.S. National Library of Medicine', url: 'https://medlineplus.gov/vitamind.html' },
    ],
    overallTier: 'strong',
    relatedIds: ['vitamind-food-sources-real-data'],
  },
  {
    id: 'vitamind-d2-vs-d3-forms',
    category: 'basicHealth',
    title: "D2 vs. D3: A Measured Difference, Most Pronounced at Higher, Less-Frequent Doses",
    teaser: "Both forms raise vitamin D levels. A direct comparison found one does it measurably better, especially when taken less often but in larger amounts.",
    summary:
      "Vitamin D supplements come in two chemically distinct forms: D3 (cholecalciferol, the same form the skin makes naturally, sourced from animal or lichen-derived material) and D2 (ergocalciferol, plant- and fungal-derived). A direct systematic review and meta-analysis comparing the two found D3 more effective than D2 at raising and maintaining blood 25-hydroxyvitamin D levels overall, with the specific gap widest under bolus dosing (large, infrequent doses) rather than daily dosing, where the two forms performed more comparably. D3 is generally the preferred supplemental choice as a result, with D2 remaining the relevant option specifically for someone avoiding animal-derived products (strict vegans), alongside a separate lichen-derived D3 alternative that also exists for that same purpose. For anyone comparing supplement labels, the two forms aren't simply interchangeable at equal doses, particularly for anyone taking a large, infrequent dose rather than a small daily one.",
    citations: [
      { source: 'Tripkovic L et al.: Comparison of Vitamin D2 and Vitamin D3 Supplementation in Raising Serum 25-Hydroxyvitamin D Status, Am J Clin Nutr 2012', url: 'https://pubmed.ncbi.nlm.nih.gov/22552031/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'vitamind-obesity-bioavailability',
    category: 'basicHealth',
    title: "A Specific Reason Obesity Tracks With Lower Vitamin D",
    teaser: "It isn't a matter of eating or sunbathing less. Vitamin D gets trapped somewhere it can't do its job.",
    summary:
      "Population-level data already covered in this category's own deficiency-prevalence research found obesity associated with a roughly threefold higher rate of vitamin D deficiency. The proposed mechanism behind that gap: vitamin D is fat-soluble, and research (so far demonstrated directly in animal models, with human population data consistent with the same effect) found it gets sequestered inside fat tissue itself, reducing how much stays available in the bloodstream to actually do its job, a case of the nutrient being present in the body but functionally unavailable, not simply absent. This has a practical, already-recognized clinical consequence: bariatric-surgery guidelines from major medical societies recommend meaningfully higher vitamin D doses, up to several times a standard dose, specifically for patients with obesity, acknowledging that standard dosing under-corrects in this population, a real factor for anyone with obesity whose vitamin D level doesn't seem to respond to an ordinary supplemental dose the way it does for other people.",
    citations: [
      { source: 'Effects of High Fat Diet-Induced Obesity on Vitamin D Metabolism and Tissue Distribution, PMID 32549901', url: 'https://pubmed.ncbi.nlm.nih.gov/32549901/' },
      { source: 'Guidelines on Vitamin D Replacement in Bariatric Surgery: Identification and Systematic Appraisal, PMID 26833101', url: 'https://pubmed.ncbi.nlm.nih.gov/26833101/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['vitamind-deficiency-prevalence'],
  },
  {
    id: 'vitamind-2024-guideline-honest-correction',
    category: 'basicHealth',
    title: "A Current (2024) Guideline Says Something More Conservative Than Most Popular Advice",
    teaser: "A 18-expert clinical guideline recommends against routine testing for most people, and against supplementing above the standard target for most healthy adults under 75.",
    summary:
      "A current (2024) Endocrine Society clinical practice guideline, built by an 18-member multidisciplinary expert panel, reaches a more conservative conclusion than the reflexive \"everyone should test and take vitamin D\" advice many people have absorbed. It suggests against routine 25-hydroxyvitamin D testing across the general population, including people with obesity or darker skin, citing a lack of evidence supporting population-wide screening, and suggests against empiric supplementation above the standard intake target to lower disease risk in healthy adults younger than 75. It does name specific groups where empiric supplementation is recommended: children and adolescents (to prevent rickets and reduce respiratory infections), adults 75 and older (a documented mortality benefit), pregnant people (to reduce preeclampsia, fetal loss, preterm birth, and neonatal mortality risk), and people with high-risk prediabetes (to reduce progression to diabetes). For the subset who do need supplementation past age 50, the same guideline prefers daily dosing over large, infrequent doses. This isn't an anti-vitamin-D position, it's a current, evidence-based case for targeting supplementation at the specific groups who actually benefit rather than testing and supplementing everyone by default.",
    citations: [
      { source: 'Vitamin D for the Prevention of Disease: An Endocrine Society Clinical Practice Guideline, PMID 38828931', url: 'https://pubmed.ncbi.nlm.nih.gov/38828931/' },
    ],
    overallTier: 'strong',
    relatedIds: ['vitamind-vital-trial-non-skeletal'],
  },
  {
    id: 'vitamind-vital-trial-non-skeletal',
    category: 'basicHealth',
    title: "A Large, Rigorous Trial Found Vitamin D Didn't Prevent Cancer or Heart Disease",
    teaser: "Over 25,000 people, a randomized trial, and an honest null result for two of the biggest disease categories vitamin D is popularly credited with preventing.",
    summary: "The VITAL trial, a large (25,871 participants), rigorously designed randomized controlled trial, tested a standard 2,000 IU daily dose of vitamin D3 specifically to answer whether supplementation reduces cancer or cardiovascular disease risk in people without a prior diagnosis of either. The honest result: it didn't, at least not to a statistically or clinically meaningful degree for either primary outcome, a well-powered null finding rather than a small or ambiguous trial easy to dismiss. This is worth reporting exactly as directly as a positive finding would be, and it's a direct, evidence-based reason behind this category's own dedicated entry on the 2024 Endocrine Society guideline's own conservative stance on supplementing healthy adults broadly. Vitamin D's well-established roles are in bone health and the specific, named groups covered elsewhere in this category, not a broad, general-purpose disease-prevention supplement for cancer or cardiovascular disease in an otherwise healthy adult.",
    citations: [
      { source: 'Vitamin D Supplements and Prevention of Cancer and Cardiovascular Disease (VITAL Trial), PMID 30415629', url: 'https://pubmed.ncbi.nlm.nih.gov/30415629/' },
    ],
    overallTier: 'strong',
    relatedIds: ['cvd-overview'],
  },
  {
    id: 'vitamind-drug-interactions',
    category: 'basicHealth',
    title: "Two Named Anti-Seizure Medications Directly Interfere With Vitamin D Activation",
    teaser: "One drug blocks the first activation step. A different drug speeds up how fast the active form gets broken down. Both both specific, both well-documented.",
    summary: "Certain anticonvulsant (anti-seizure) medications carry a specific, mechanistically documented effect on vitamin D, not just a vague, general interaction warning. Phenobarbital, an older anti-seizure medication, was found to directly suppress the liver enzyme (25-hydroxylase) responsible for the first activation step vitamin D needs, a specific, named mechanism behind drug-induced bone softening. Valproic acid, a separate, commonly used anti-seizure and mood-stabilizing medication, works through a different mechanism, increasing the activity of a different enzyme (CYP24) that accelerates how quickly the body breaks the active form back down. Both are worth knowing by name for anyone on either medication long-term, a direct reason vitamin D status is worth monitoring specifically in that situation rather than assumed fine by default. The existing research on prednisone and other corticosteroids, already covered for their own separate bone-density effects in several condition-specific areas, is worth reading alongside this for anyone managing both.",
    citations: [
      { source: 'Phenobarbital Suppresses Vitamin D3 25-Hydroxylase Expression: A Potential New Mechanism for Drug-Induced Osteomalacia, PMID 17445763', url: 'https://pubmed.ncbi.nlm.nih.gov/17445763/' },
      { source: 'Valproic Acid Augments Vitamin D Receptor-Mediated Induction of CYP24 by Vitamin D3, PMID 21115105', url: 'https://pubmed.ncbi.nlm.nih.gov/21115105/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'vitamind-food-sources-real-data',
    category: 'basicHealth',
    title: "Food Sources, Pulled Directly From The Database",
    teaser: "A short list, and mushrooms belong on it right alongside fatty fish, but only the specific kind actually treated with UV light.",
    summary: "Vitamin D's own dietary sources are few compared to most other nutrients, pulled directly here from the 22,022-food reference database rather than a generic external list. Cod liver oil leads by a wide, margin at 250mcg per 100g, a historic reason it was once given directly to children before fortified foods became common. UV-treated (\"vitamin D enhanced\") mushrooms are a useful and often-overlooked source at roughly 24mcg per 100g, a specific, distinction: ordinary, non-UV-treated mushrooms carry only trace amounts, so the label matters here more than for almost any other food on this list. Canned salmon and cooked trout both carry a meaningful roughly 19-22mcg per 100g. Alongside this short whole-food list: fortified foods (milk, many plant-milk alternatives, some breakfast cereals and orange juice) are a deliberate public-health addition specifically because so few whole foods naturally carry meaningful vitamin D on their own, not a lesser or artificial source.",
    citations: [],
    overallTier: 'strong',
    chart: {
      title: 'Vitamin D Content of Foods (per 100g)',
      unit: 'mcg',
      data: [
        { label: 'Cod liver oil', value: 250 },
        { label: 'Vitamin D-enhanced mushrooms', value: 24 },
        { label: 'Canned salmon', value: 21.5 },
        { label: 'Cooked trout', value: 19 },
      ],
      sourceNote: "This app's own reference database (USDA/Australia_AFCD-sourced values)",
    },
  },
  {
    id: 'vitamind-tying-together',
    category: 'basicHealth',
    title: "What Actually Holds Up for Vitamin D, Pulled Together",
    teaser: "A hormone the body can make on its own, a global deficiency gap, and a current guideline that's more conservative than most popular advice.",
    summary: "Line up everything in this category and vitamin D reads as a two-sided story, holding both halves at once matters. The well-established side: a global deficiency gap affecting a majority of people by some measure, specific deficiency and toxicity thresholds, a measured difference between D2 and D3 supplemental forms, and a specific reason (fat-tissue sequestration) obesity tracks with lower levels. The correction: a large, rigorous 2019 trial found vitamin D didn't prevent cancer or cardiovascular disease, and a current 2024 clinical guideline recommends against routine testing and against supplementing most healthy adults under 75 above the standard target, reserving targeted supplementation for specific, named groups instead. The disease-specific vitamin D research, Hashimoto's own mixed correlation-vs-RCT picture, the gut-barrier mechanism, lupus's own sun-exposure catch-22, and more, builds directly on top of this same universal foundation rather than repeating it. Vitamin D gets treated the way this whole category treats every nutrient: important in specific, well-evidenced ways, not a single flat recommendation that applies the same way to everyone.",
    citations: [
      { source: 'Vitamin D, MedlinePlus, U.S. National Library of Medicine', url: 'https://medlineplus.gov/vitamind.html' },
    ],
    overallTier: 'strong',
    relatedIds: ['vitamind-deficiency-symptoms-staged', 'vitamind-2024-guideline-honest-correction', 'vitamind-vital-trial-non-skeletal', 'vitamind-obesity-bioavailability', 'nutrient-vitamin-d', 'sjogrens-vitamin-d-dry-eye-severity', 'pcos-vitamin-d-deficiency-real-data'],
  },

  // -- Iron, added 2026-08-08, the third deep-dive in this series, at
  // direct request: "move to the next one after Magnesium, and continue
  // through all of the rest of the macro and micronutrients, and acids."
  // Same discipline as Magnesium/Vitamin D: check this app's own reference
  // tables first (supplement_forms already had real, cited bisglycinate-
  // vs-ferrous-sulfate GI-tolerance data from the My Meds work, never
  // surfaced in a Digest entry until now), then verify every new claim via
  // WebFetch against StatPearls/PubMed (WebSearch still exhausted this
  // session). Deliberately does not repeat `advocacy-iron-ferritin`
  // (hashimotos category, the thyroid-function/TSH correlation and testing
  // recommendation) -- that stays where it is, cross-linked from here, per
  // this session's own Basic Health scope correction: universal iron
  // biology belongs here, a specific disease's own testing guidance
  // belongs in that disease's own category.
  {
    id: 'iron-overview',
    category: 'basicHealth',
    title: 'Iron: What It Actually Does, and Why the Body Guards It So Closely',
    teaser: 'Every red blood cell needs it to carry oxygen at all, yet the body has no way to actively excrete it once absorbed, which shapes almost everything else about how iron works.',
    summary:
      "Iron's best-known job is building hemoglobin, the protein inside red blood cells that actually carries oxygen from the lungs to every other tissue, and myoglobin, the same job inside muscle itself. Beyond oxygen transport, iron is a required cofactor for enzymes involved in DNA synthesis, energy production in the mitochondria, and immune cell function, which is why both deficiency and overload show up as such a wide, seemingly unrelated list of symptoms. The single fact that shapes most of the rest of this category: the human body has no active mechanism to excrete excess iron. Iron balance is controlled almost entirely by regulating absorption in the small intestine, not by getting rid of what's already been taken in. That one-way design is efficient for a nutrient the body cannot do without, and it's also exactly why chronic overload (see the hemochromatosis entry below) is a distinct medical problem rather than something the body simply corrects on its own over time.",
    citations: [
      { source: 'Iron Deficiency Anemia, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK448065/' },
      { source: 'Dietary Iron, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK540969/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'iron-deficiency-prevalence-causes',
    category: 'basicHealth',
    title: 'Who Actually Runs Low on Iron, and Why It Skews So Heavily by Age and Sex',
    teaser: 'Roughly 14% of American adults have iron-deficiency anemia by one measure, and the risk gap between men and women is far wider than most other nutrient deficiencies.',
    summary:
      "Iron deficiency is uneven across the population, not a flat risk everyone shares equally. In US adults, iron-deficiency anemia affects an estimated 14% by NHANES data, with the exact count depending heavily on which ferritin cutoff is used (5.9 million people at a 15 ng/mL threshold versus 3.3 million at 45 ng/mL). The skew is by sex and life stage: adolescent girls and women of reproductive age run 9-11% prevalence, driven mainly by regular menstrual blood loss, while men overall sit near 1%, rising only to 2-4% in middle-aged and older men, where the more likely cause is slow GI blood loss rather than diet alone. Toddlers age 1-2 carry a 9% prevalence too, with Hispanic toddlers roughly twice as likely as white peers to be affected. Pregnancy adds a separate, large demand on top of menstrual loss, since a growing fetus and placenta both draw on the same maternal iron stores. Multiparous women from lower-income backgrounds carry the highest combined risk of any group named in the research. Diet matters too, but mostly as one contributing factor among several: a diet low in heme iron (meat, poultry, seafood) combined with high blood loss from any source is the compounding pattern behind most cases, not diet in isolation.",
    citations: [
      { source: 'Iron Deficiency Anemia, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK448065/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'iron-deficiency-symptoms-staged',
    category: 'basicHealth',
    title: 'Iron Deficiency Has Stages, and Symptoms Can Start Before a Standard Anemia Test Would Catch It',
    teaser: 'Fatigue and restless legs can show up while iron stores are dropping, well before hemoglobin itself falls low enough to count as anemia on a lab report.',
    summary:
      "Iron deficiency progresses through three distinct phases rather than appearing all at once. First, the body's own stored iron (measured as serum ferritin) is drawn down as the primary reserve. Second, once storage is exhausted, circulating iron itself starts to decline, which shows up as falling transferrin saturation and rising total iron-binding capacity (TIBC), the blood's own way of signaling it wants more iron than it's getting. Third, only once both of those buffers are used up does the body's ability to actually build new hemoglobin fail, producing the microcytic, hypochromic red blood cells that define iron-deficiency anemia on a standard blood count. The clinically important part: symptoms, including fatigue, cognitive impairment, and restless leg syndrome, can appear during that second stage, before anemia itself is present at all, meaning a normal hemoglobin result doesn't rule out a symptomatic iron problem. Anemia itself is formally defined as hemoglobin under 13 g/dL in men or under 12 g/dL in non-pregnant women, and a serum ferritin under 45 ng/mL is the threshold that gives the best balance of sensitivity and specificity for catching iron deficiency itself, well above the much lower cutoffs (often 12-15 ng/mL) some labs still use as their own default reference range.",
    citations: [
      { source: 'Iron Deficiency Anemia, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK448065/' },
    ],
    overallTier: 'strong',
    relatedIds: ['advocacy-iron-ferritin', 'ibd-iron-deficiency-anemia'],
  },
  {
    id: 'iron-toxicity-acute-overdose',
    category: 'basicHealth',
    title: 'Acute Iron Overdose Is a Medical Emergency With Its Own Named Five-Stage Course',
    teaser: 'A single large dose, most often from swallowed supplement pills, can look like it resolved after the first day and then relapse into organ failure days later.',
    summary:
      "A single large dose of elemental iron is toxic, and the danger is dose-dependent in a way that's been mapped out specifically: under 20mg per kilogram of body weight is generally non-toxic, 20-60mg/kg causes moderate symptoms, and above 60mg/kg carries risk of severe morbidity and death. Iron supplement pills are a common source of accidental pediatric poisoning specifically because they're small, often coated, and don't look dangerous. The clinical course runs through five named stages, and the second one is the dangerous trap: Stage 1 (30 minutes to 6 hours) brings abdominal pain, vomiting, and diarrhea, sometimes with visible blood. Stage 2 (6-24 hours) can look like recovery, with GI symptoms temporarily easing, even though iron absorption and cellular damage are still actively occurring underneath. Stage 3 (6-72 hours) brings the crisis: recurring GI symptoms alongside shock, metabolic acidosis, coagulopathy, liver dysfunction, heart muscle damage, and kidney failure, since free iron directly disrupts cellular energy production and generates damaging free radicals throughout the body. Stage 4 (12-96 hours) can progress to outright liver failure. Stage 5, weeks later, involves scarring and potential bowel obstruction as the GI tract heals from the initial injury. A peak blood iron level above 500 micrograms/dL marks severe systemic toxicity. The practical takeaway: any suspected large iron ingestion, especially in a child, needs emergency evaluation immediately, not a wait-and-see approach based on how someone feels in the first few hours.",
    citations: [
      { source: 'Iron Toxicity, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK459224/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'iron-hemochromatosis-overload',
    category: 'basicHealth',
    title: 'Hereditary Hemochromatosis: When the Body Absorbs Too Much Iron for Decades, Quietly',
    teaser: "The most common inherited disorder in white populations, underdiagnosed because early symptoms (fatigue, joint pain) look like almost anything else, and it carries a striking hypothyroidism connection.",
    summary: "Chronic iron overload is a different problem from an acute overdose: rather than one large dose, it builds slowly over years from a genetic tendency to over-absorb dietary iron, most often from HFE gene mutations (C282Y homozygosity is the most common single cause in people of Northern European descent). Hereditary hemochromatosis affects a meaningful 1 in 300 to 500 people in white populations, making it the most common autosomal recessive disorder in that group, and it affects men roughly 1.8 to 3 times more often than women, since women lose iron regularly through menstruation until menopause, effectively delaying their own presentation by about a decade. Diagnostically, transferrin saturation above 45% (40% in women) combined with serum ferritin above 300 µg/L in men or 200 µg/L in women points toward the condition. Left uncorrected, the accumulated iron itself becomes toxic to multiple organs: cirrhosis develops in a 10-15% of untreated patients, and among those with cirrhosis, hepatocellular carcinoma risk climbs as high as 30%. About half of untreated patients develop diabetes as iron damages the insulin-producing cells of the pancreas. Iron accumulation in heart tissue can cause dilated cardiomyopathy and arrhythmias. Skin hyperpigmentation (an early sign, in over 90% of patients) and joint disease from calcium pyrophosphate deposits round out the classic presentation. The most directly relevant finding: hemochromatosis carries a documented 80-fold increased risk of hypothyroidism in affected men, alongside rates of hypogonadism and osteoporosis. Regular phlebotomy (therapeutic blood removal) is the standard, effective treatment, improving fatigue, skin color, and insulin sensitivity, though it does not reverse cirrhosis, hypogonadism, or joint damage that's already set in, which is the reason early detection matters as much as it does.",
    citations: [
      { source: 'Hemochromatosis, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK430862/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'iron-absorption-mechanism',
    category: 'basicHealth',
    title: 'Heme vs. Non-Heme Iron: Two Different Absorption Rates, and the Hormone That Controls Both',
    teaser: 'About 25% of the iron in meat gets absorbed. From plant sources, it can be as low as 5%, which is the reason a vegetarian diet needs deliberate attention to iron.',
    summary:
      "Dietary iron comes in two chemically different forms with different absorption rates. Heme iron, found only in meat, poultry, and seafood (bound inside hemoglobin and myoglobin from the animal's own tissue), is absorbed at roughly 25%. Non-heme iron, the form found in plants, grains, and fortified foods, is absorbed at 17% or less, and can run as low as 5% depending on what else is eaten alongside it. Averaged across a diet, someone eating animal products absorbs an estimated 14-18% of their dietary iron, versus roughly 5-12% for someone eating a fully plant-based diet, which is exactly why vegetarian and vegan diets call for deliberate attention to iron intake and food pairing, not just eating 'enough' iron-containing plants. Despite making up only 10-15% of total dietary iron in a typical Western diet, heme iron accounts for a disproportionate 40% of all iron actually absorbed, because of that absorption-rate gap. Non-heme absorption can be measurably boosted: vitamin C converts iron to a more absorbable form and meaningfully increases uptake, and eating meat, fish, or poultry alongside a plant-iron source (the named 'MFP factor') increases non-heme absorption 2-3 fold on its own. Working against absorption: phytates in whole grains and legumes, polyphenols in tea, coffee, and red wine, and calcium from dairy, all of which bind iron in the gut before it can be taken up. Governing all of this from the inside is hepcidin, a hormone made by the liver that acts as the body's own master iron-regulation switch: when iron stores run high, hepcidin rises and shuts down further absorption; when stores run low, hepcidin drops and absorption increases. This is the reason iron absorption is adaptive rather than fixed, and also why iron status itself, not just how much iron someone eats, determines how much of a given meal's iron actually gets taken up.",
    citations: [
      { source: 'Dietary Iron, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK540969/' },
    ],
    overallTier: 'strong',
    relatedIds: ['interaction-vitaminc-iron', 'interaction-tannins-iron', 'interaction-calcium-iron', 'interaction-iron-zinc-manganese'],
  },
  {
    id: 'iron-supplement-forms-compared',
    category: 'basicHealth',
    title: 'Ferrous Sulfate vs. Iron Bisglycinate: Comparable Absorption, a Difference in How the Gut Tolerates Them',
    teaser: "The cheapest, most-studied iron supplement is also the one most likely to cause nausea and constipation, at quantified rates.",
    summary: "The reference data (built during earlier work on medication and supplement tracking) already carries cited head-to-head comparisons between the two most common iron supplement forms. Ferrous sulfate is the standard, cheapest, and most-studied first-line option, but a meta-analysis of 43 trials and roughly 6,800 adults found it significantly increases GI side effects (nausea, constipation, abdominal pain) versus placebo, at an odds ratio of 2.32, a substantial burden that's a major reason people stop taking it. Iron bisglycinate, a chelated form, produces meaningfully fewer of those same GI side effects in multiple head-to-head randomized trials at matched elemental-iron doses, while absorbing roughly comparably to ferrous sulfate when the dose is matched, not clearly superior on absorption despite how it's often marketed, but gentler. For someone who has tried and stopped ferrous sulfate specifically because of stomach upset, bisglycinate is an evidence-backed alternative to ask about rather than assuming iron supplementation itself is simply not tolerable. Taking iron on an empty stomach maximizes absorption, but plenty of people need to take it with a little food to tolerate it at all; either is a reasonable real-world choice depending on which trade-off matters more.",
    citations: [
      { source: "Tolkien Z, Stecher L, Mander AP, Pereira DI, Powell JJ 2015: Ferrous Sulfate Supplementation Causes Significant Gastrointestinal Side-Effects in Adults: A Systematic Review and Meta-Analysis, PLoS One, PMID 25700159", url: 'https://pubmed.ncbi.nlm.nih.gov/25700159/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'iron-cast-iron-cookware',
    category: 'basicHealth',
    title: 'Cooking in Cast Iron Really Does Add Iron to Food, Just Not as Reliably as the Popular Version of This Claim Suggests',
    teaser: 'A systematic review of 13 studies found consistently more iron in the food itself, but a mixed result for whether it actually raised blood hemoglobin.',
    summary:
      "The idea that cooking in a cast iron pan or pot adds meaningful iron to food is a tested claim, not just kitchen folklore, and it holds up better on one half than the other. A 2021 systematic review of 13 studies found a consistent improvement in both the iron content and iron bioavailability of food cooked in iron pots or with iron ingots added directly to the cooking liquid, a useful, low-cost finding, especially highlighted by the review's own authors as a potential strategy for reducing iron-deficiency anemia in settings where supplements or fortified food aren't reliably available. The honest, less flattering half: only 4 of the studies reviewed found a significant resulting increase in actual blood hemoglobin levels, with the rest showing only a minor change, meaning the boost to food iron content doesn't always translate cleanly into a measurable health outcome. Acidic foods (tomato sauce, for instance) tend to pick up more iron from cast iron than a dry sauté, since acid helps leach iron from the metal itself. It's one small, low-risk contributor among the larger factors covered elsewhere in this category (heme vs. Non-heme intake, vitamin C pairing, hepcidin's own regulation of absorption), not a substitute for any of them.",
    citations: [
      { source: 'Sharma S, Khandelwal R, Yadav K, Ramaswamy G, Vohra K 2021: Effect of cooking food in iron-containing cookware on increase in blood hemoglobin level and iron content of the food: A systematic review, Nepal J Epidemiol, PMID 34290890', url: 'https://pubmed.ncbi.nlm.nih.gov/34290890/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'iron-food-sources-real-data',
    category: 'basicHealth',
    title: "Iron Food Sources, Pulled Directly From The Database",
    teaser: 'Liver leads by a wide margin, and the list mixes heme and non-heme sources on purpose, since the two absorb so differently.',
    summary: "Iron content pulled directly from the 22,022-food reference database, deliberately mixing heme sources (absorbed at roughly 25%) and non-heme sources (absorbed at 17% or less) rather than ranking them on the same scale, since the raw number alone overstates how much of a plant source's iron actually gets used. Pork liver leads by a wide margin at 23.3mg per 100g, with chicken liver close behind around 16mg per 100g, both classic, concentrated heme sources. Dark chocolate carries a surprising 11.5mg per 100g. White beans and lentils, both common non-heme sources, carry 10.4mg and 6.5mg per 100g respectively, meaningfully boosted in practice by pairing them with a vitamin C source (see the absorption-mechanism entry above). Oysters, a heme source often left off shorter lists, carry roughly 9.2mg per 100g. Spinach, popularly assumed to be an iron powerhouse, actually carries a comparatively modest 3.6mg per 100g of the harder-to-absorb non-heme form, a worth-knowing correction to its own reputation.",
    citations: [],
    overallTier: 'strong',
    chart: {
      title: 'Iron Content of Foods (per 100g)',
      unit: 'mg',
      data: [
        { label: 'Pork liver', value: 23.3 },
        { label: 'Chicken liver', value: 16.3 },
        { label: 'Dark chocolate', value: 11.5 },
        { label: 'White beans', value: 10.4 },
        { label: 'Oysters', value: 9.2 },
        { label: 'Lentils', value: 6.5 },
        { label: 'Spinach', value: 3.6 },
      ],
      sourceNote: "This app's own reference database (USDA/Canada_CNF-sourced values)",
    },
  },
  {
    id: 'iron-tying-together',
    category: 'basicHealth',
    title: 'What Actually Holds Up for Iron, Pulled Together',
    teaser: 'A nutrient the body can only regulate on the way in, never on the way out, which explains both ends of what can go wrong with it.',
    summary: "Line up everything in this category and iron reads as a nutrient defined by one structural fact: the body has no active way to excrete it, so absorption itself, governed by hepcidin, is the only lever controlling how much accumulates. That single design choice explains both failure modes covered here. Too little, and the shortfall shows up in predictable stages, from depleted stores to measurable fatigue and restless legs to full anemia, skewed heavily toward menstruating women, pregnancy, and young children. Too much, whether from a single large acute dose or decades of a genetic over-absorption tendency like hereditary hemochromatosis, causes serious, and sometimes irreversible organ damage, precisely because there's no built-in release valve. In between those two extremes sits a practical, everyday layer: heme absorbs roughly twice as well as non-heme, vitamin C and meat both boost non-heme uptake, tea and calcium both blunt it, and even the choice of cookware makes a small, measurable difference. The Hashimoto's-specific research goes one step further, covering iron's own direct, measured relationship to TSH and thyroid hormone levels, and a standing recommendation for a full iron panel, not ferritin alone.",
    citations: [
      { source: 'Iron Deficiency Anemia, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK448065/' },
    ],
    overallTier: 'strong',
    relatedIds: ['iron-deficiency-symptoms-staged', 'iron-hemochromatosis-overload', 'iron-absorption-mechanism', 'advocacy-iron-ferritin', 'ckd-anemia-erythropoietin'],
  },

  // -- Zinc, added 2026-08-08, the fourth deep-dive in this series, direct
  // continuation: "Continue with zinc next." This app already had a fair
  // amount of real zinc content before this pass (the zinc/copper
  // antagonism, the vitamin A/zinc mechanistic link, the zinc-carnosine
  // gut-barrier entry, and a Hashimoto's-specific zinc/iron/B12 symptom-
  // overlap entry) -- deliberately did NOT duplicate any of it. This
  // section fills the real remaining gap: a genuine deep dive (staged
  // deficiency, toxicity, absorption mechanism, food sources, tying
  // together) the way Magnesium/Vitamin D/Iron already got, cross-linking
  // to the existing interaction/advocacy entries rather than re-deriving
  // them. Checked `supplement_forms` first, same discipline as every prior
  // nutrient: real, already-cited picolinate/citrate-gluconate/oxide
  // absorption data was sitting there unused from the My Meds work.
  // WebSearch remained exhausted this session; every new citation came via
  // the established WebFetch-against-StatPearls/PubMed fallback.
  {
    id: 'zinc-overview',
    category: 'basicHealth',
    title: 'Zinc: A Structural and Catalytic Mineral in Hundreds of Enzymes at Once',
    teaser: "Involved in over 300 enzymes, immune-cell development, wound healing, and taste and smell perception, which is exactly why deficiency produces such a wide, seemingly unrelated symptom list.",
    summary:
      "Zinc's role is less about one specific job and more about being a required structural or catalytic component in an estimated 300-plus enzymes across the body, plus a direct role in stabilizing the structure of many proteins, including the zinc-finger proteins that regulate gene expression itself. Three areas stand out as the most clinically relevant. Immune function: zinc is required for normal T-lymphocyte activation, natural killer cell activity, and antibody production, so deficiency measurably increases infection susceptibility. Wound healing and skin integrity: zinc-dependent enzymes are directly involved in collagen synthesis and cell division, which is why zinc deficiency classically presents with visible skin lesions and slow-healing wounds. Sensory function: zinc is required for normal taste and smell perception, and a loss of taste (hypogeusia) is one of the most specific, recognizable early signs of deficiency, distinct from the more generic fatigue-type symptoms most other nutrient deficiencies share. This breadth of function is exactly why zinc deficiency and zinc excess both produce such varied, easy-to-misattribute symptom pictures, covered in the two entries directly below.",
    citations: [
      { source: 'Zinc Deficiency, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK493231/' },
    ],
    overallTier: 'strong',
    relatedIds: ['prostate-zinc-connection'],
  },
  {
    id: 'zinc-deficiency-prevalence-causes',
    category: 'basicHealth',
    title: 'Zinc Deficiency Affects an Estimated 2 Billion People Worldwide, Unevenly by Region',
    teaser: 'Up to a third of the population in parts of Sub-Saharan Africa, Southeast Asia, and the Middle East, versus roughly 7.5% in high-income countries.',
    summary:
      "The World Health Organization recognizes zinc deficiency as a major contributor to global disease burden, with an estimated 2 billion people affected worldwide. Like most nutrient deficiencies covered in this category, the risk is uneven by region and population, not a flat global rate. High-income countries sit around 7.5% at-risk. Parts of Sub-Saharan Africa, Southeast Asia, and the Middle East run as high as one-third of the population affected, and South Asia specifically runs up to 30%. Children and women in Latin America and the Caribbean show a wide range of 19.1% to 56.3% depending on the specific population studied. A prevalence above 20% (measured by serum zinc concentration) in a given population is the recognized public-health threshold for needing targeted intervention. The underlying causes track closely with diet composition: phytate-rich diets (heavy in legumes, seeds, soy, and whole grains, without much animal protein to offset it) are a major driver in the regions with the highest rates, since phytates directly block zinc absorption (see the absorption-mechanism entry below). Chronic diarrhea is a second, separate driver, both causing and being worsened by zinc loss in a compounding cycle, which is part of why zinc supplementation is a standard, evidence-based part of diarrhea treatment in children in much of the world.",
    citations: [
      { source: 'Zinc Deficiency, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK493231/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'zinc-deficiency-symptoms-staged',
    category: 'basicHealth',
    title: "Zinc Deficiency's Own Tell: Taste and Smell Loss, Before Almost Anything Else",
    teaser: "Spearhead-shaped, brittle hair and eczema-like skin patches in friction zones (elbows, knees) are both specific, recognizable signs, distinct from generic fatigue.",
    summary: "Zinc deficiency produces a distinctive symptom picture across several body systems at once, several of which are specific enough to point toward zinc directly rather than a generic 'something is off' feeling. Sensory: impaired taste (hypogeusia) and smell (hyposmia) are classic early signs, along with photophobia (light sensitivity). Skin: visible lesions, described as eczema-like scaly plaques or vesicular/pustular eruptions, concentrated in friction-prone areas like the elbows, knees, and sacrum, plus angular cheilitis (cracking at the corners of the mouth). Hair: distinctively brittle, spearhead-shaped hair with visible transverse ridges and splitting, a specific pattern rather than generic thinning. Immune: reduced T-lymphocyte activation, natural killer cell function, and antibody production, translating into measurably increased infection susceptibility. Diagnostically, normal serum zinc runs 70-250 µg/dL, with mild deficiency generally falling in the 40-60 µg/dL range. Since the Hashimoto's-specific research already covers it: zinc, iron, and B12 deficiency symptoms overlap heavily with hypothyroid symptoms themselves (fatigue, hair thinning, cognitive fog), making a lab check worth doing rather than assuming the thyroid explains everything on its own.",
    citations: [
      { source: 'Zinc Deficiency, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK493231/' },
    ],
    overallTier: 'strong',
    relatedIds: ['nutrient-zinc-iron-b12'],
  },
  {
    id: 'zinc-toxicity-acute-chronic',
    category: 'basicHealth',
    title: 'Zinc Toxicity: A Acute GI Illness at High Single Doses, and a Chronic Risk From Long-Term Over-Supplementation',
    teaser: 'Roughly 1-2 grams in one dose (67-133 times the recommended daily intake) is enough to trigger acute vomiting and abdominal pain.',
    summary: "Zinc toxicity comes in two different shapes. Acute: ingesting roughly 1-2 grams of zinc in one sitting (a large multiple of the standard 15mg adult recommended daily intake, 67 to 133 times over) triggers immediate GI distress: vomiting, abdominal pain, watery diarrhea, muscle cramps, and sometimes visible blood in vomit. Severe cases can involve kidney or liver injury. This level of intake is realistically only reached through supplement misuse or an accidental large ingestion, not ordinary food or normal supplementation. Chronic: sustained, moderately-high zinc supplementation over weeks to months causes a different problem, driven by the same metallothionein mechanism already covered in the zinc/copper interaction research: excess zinc triggers gut cells to bind and trap copper, causing a secondary copper deficiency. Left uncorrected, this can progress to a named clinical picture sometimes called 'swayback,' involving progressive nerve damage (gait abnormalities, sensory ataxia, spasticity) alongside anemia, and case reports document these neurological symptoms can persist even after copper levels are corrected, a serious reason not to self-supplement zinc at high doses indefinitely without periodic bloodwork. See the existing zinc/copper entries for the specific fix (pairing supplemental zinc with a small amount of copper) and the documented case reports behind this exact mechanism.",
    citations: [
      { source: 'Zinc Toxicity, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK554548/' },
    ],
    overallTier: 'strong',
    relatedIds: ['interaction-zinc-copper', 'advocacy-zinc-copper'],
  },
  {
    id: 'zinc-absorption-mechanism',
    category: 'basicHealth',
    title: 'Zinc Absorption Runs Through Two Named Transporter Families, and Phytates Are Its Biggest Blocker',
    teaser: 'The same phytate compounds that block iron absorption block zinc too, which is why a phytate-heavy diet with little animal protein is a compounding risk for both at once.',
    summary: "Zinc absorption and cellular handling is governed by two specifically named transporter gene families: ZnT transporters (encoded by the SLC30A genes) move zinc out of cells or into storage compartments, while ZIP transporters (SLC39A genes) move zinc into cells. Specific transporters carry specific jobs; Zip4, for instance, is required for normal intestinal zinc absorption, and a mutation in the gene that encodes it causes acrodermatitis enteropathica, a severe genetic zinc-deficiency disorder that demonstrates directly how essential this one transporter is. On the dietary side, phytates (found in legumes, seeds, soy products, and whole grains) are the single biggest inhibitor of zinc absorption, the same mechanism already covered in the iron and magnesium research, and endemic zinc deficiency in parts of the Middle East and Asia is directly linked to phytate-heavy diets. This is the specific reason vegetarian and vegan diets face a documented extra challenge meeting zinc needs: not just lower total zinc intake, but lower absorbed zinc from the zinc that is eaten. The same traditional fixes already covered in the Nutrient Interactions research (soaking, sprouting, and fermenting phytate-rich foods) measurably reduce this effect.",
    citations: [
      { source: 'Zinc Deficiency, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK493231/' },
    ],
    overallTier: 'strong',
    relatedIds: ['interaction-phytates-minerals', 'interaction-iron-zinc-manganese'],
  },
  {
    id: 'zinc-supplement-forms-compared',
    category: 'basicHealth',
    title: 'Zinc Picolinate, Citrate, Gluconate, and Oxide: Measured Absorption Differences Between Forms',
    teaser: "Zinc oxide, the cheapest and most common form in low-cost multivitamins, absorbs roughly 10 percentage points worse than citrate or gluconate at a matched dose.",
    summary: "The reference data (built during earlier medication and supplement-tracking work) already carries cited head-to-head comparisons between zinc's most common supplement forms. Zinc citrate and zinc gluconate both showed fractional absorption around 60-61% in a matched-dose crossover trial, meaningfully better than zinc oxide's roughly 50% at the same 10mg elemental zinc dose, despite oxide remaining the most common form in inexpensive multivitamins specifically because it's cheap to manufacture. Zinc picolinate has its own, separately-studied evidence: one crossover trial found it was the only form of three tested (against citrate and gluconate) that significantly raised zinc levels in hair, urine, and red blood cells compared to placebo, though serum zinc itself didn't differ significantly between forms in that same trial, a real, if smaller (n=15) and older (1987) piece of evidence, tiered here as emerging rather than established for that reason. All three of the better-absorbed forms are generally well tolerated. Practical takeaway: checking a supplement's own label for citrate, gluconate, or picolinate rather than oxide is a low-effort way to get more zinc from the same stated dose.",
    citations: [
      { source: 'Comparative Absorption and Bioavailability of Various Chemical Forms of Zinc in Humans: A Narrative Review, Nutrients, PMC11677333', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11677333/' },
      { source: 'Barrie SA et al. 1987: Comparative absorption of zinc picolinate, zinc citrate and zinc gluconate in humans, Agricultural and Food Chemistry / Nutrition Research', url: 'https://www.sciencedirect.com/science/article/abs/pii/S0271531787800021' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'zinc-immune-common-cold',
    category: 'basicHealth',
    title: 'Zinc Lozenges and the Common Cold: A Measured Effect, From a Small Body of Evidence',
    teaser: 'Zinc acetate lozenges shortened colds by roughly 2.7-2.9 days in an individual patient data meta-analysis, taken from a total of just 199 people across three trials.',
    summary:
      "Zinc for the common cold is one of the most commonly repeated pieces of everyday health advice, and it turns out to have a real, if modest-sized, body of evidence behind it rather than being pure folklore. A 2016 individual patient data meta-analysis (pooling raw data from three randomized trials, not just their published summary statistics, a more rigorous approach than a standard meta-analysis) found zinc acetate lozenges shortened colds by 2.73-2.94 days compared to placebo, a substantial fraction of a typical week-long cold. The honest caveat: the total pooled sample was just 199 people, predominantly female and aged 20-50, and the review's own authors stated plainly that the optimal lozenge composition and dosing frequency still need further investigation, which is why this is tiered moderate rather than strong despite the consistent effect size across the three trials. The zinc form matters here specifically: this evidence is for zinc acetate lozenges taken at the first sign of a cold, not zinc supplementation generally or zinc taken after a cold has already run its course.",
    citations: [
      { source: 'Hemilä H, Petrus EJ, Fitzgerald JT, Prasad A 2016: Zinc acetate lozenges for treating the common cold: an individual patient data meta-analysis, British Journal of Clinical Pharmacology, PMID 27378206', url: 'https://pubmed.ncbi.nlm.nih.gov/27378206/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'zinc-food-sources-real-data',
    category: 'basicHealth',
    title: "Zinc Food Sources, Pulled Directly From The Database",
    teaser: 'Oysters lead every other food source by an enormous margin, the single most zinc-dense common food that exists.',
    summary: "Zinc content pulled directly from the 22,022-food reference database. Oysters lead by an enormous margin, ranging up to roughly 91mg per 100g depending on the specific source and preparation, the most zinc-concentrated common food in the entire database, well ahead of every other food source. Crab carries a more moderate 4-7.6mg per 100g. Pumpkin seeds, a practical plant-based option, carry roughly 6-7.7mg per 100g. Cashews carry a 5-5.4mg per 100g. For context, the standard adult recommended daily intake is 8-11mg, meaning a single serving of oysters alone can meet or exceed a full day's need, while plant-based sources require more deliberate, consistent intake to reach the same total, compounded by the lower absorption rate non-heme, plant-based zinc sources carry (see the absorption-mechanism entry above).",
    citations: [],
    overallTier: 'strong',
    chart: {
      title: 'Zinc Content of Foods (per 100g)',
      unit: 'mg',
      data: [
        { label: 'Oysters', value: 91 },
        { label: 'Pumpkin seeds', value: 7.7 },
        { label: 'Crab', value: 7.6 },
        { label: 'Cashews', value: 5.4 },
      ],
      sourceNote: "This app's own reference database (USDA-sourced values)",
    },
  },
  {
    id: 'zinc-tying-together',
    category: 'basicHealth',
    title: 'What Actually Holds Up for Zinc, Pulled Together',
    teaser: "A mineral with over 300 jobs in the body, a global deficiency gap, and a toxicity risk that mostly comes from good intentions taken too far.",
    summary: "Line up everything in this category and zinc reads as a nutrient where the risk sits at both extremes, and the safe middle ground is wide. Deficiency is real and globally common (an estimated 2 billion people), with a distinctive symptom picture (taste and smell loss, specific skin and hair changes) that's more specific and easier to recognize than most other nutrient deficiencies covered in this category. The absorption story centers on phytates as the dominant blocker, meaning plant-based eaters face a documented extra challenge, not just a marginal one. On the other end, toxicity is nearly always self-inflicted, either a large acute overdose or, more commonly and more insidiously, well-intentioned long-term high-dose supplementation quietly causing a secondary copper deficiency with sometimes lasting neurological consequences. In between sits useful, moderate-strength evidence for zinc lozenges shortening a common cold, and measured differences between supplement forms. The Hashimoto's-specific research covers zinc's own overlap with thyroid symptoms directly, one more reason a full lab panel, not assumption, is the right call when fatigue, hair thinning, or brain fog show up.",
    citations: [
      { source: 'Zinc Deficiency, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK493231/' },
    ],
    overallTier: 'strong',
    relatedIds: ['zinc-deficiency-symptoms-staged', 'zinc-toxicity-acute-chronic', 'zinc-absorption-mechanism', 'nutrient-zinc-iron-b12', 'interaction-zinc-copper', 'prostate-zinc-connection', 'prostate-zinc-testosterone-deficiency'],
  },

  // -- Vitamin B12, added 2026-08-08, the fifth deep-dive in this series,
  // direct continuation: "Continue with B12 next, and then continue
  // automatically through the rest." Same discipline as every prior
  // nutrient: checked `supplement_forms` first (real, already-cited
  // methylcobalamin-vs-cyanocobalamin data was already there from the My
  // Meds work), then verified every new claim via the established
  // WebFetch-against-StatPearls fallback (WebSearch still exhausted).
  // Deliberately did not duplicate `advocacy-b12-folate` (hashimotos
  // category, the real 28%-of-Hashimoto's-patients/pernicious-anemia
  // finding) or `nutrient-zinc-iron-b12` -- both stay where they are,
  // cross-linked from here.
  {
    id: 'b12-overview',
    category: 'basicHealth',
    title: 'Vitamin B12: The One Nutrient That Needs a Working Stomach Just to Get Absorbed at All',
    teaser: "Unlike almost every other nutrient in this category, B12 absorption depends on a whole multi-step relay, not just eating enough of it.",
    summary:
      "Vitamin B12 (cobalamin) is required for DNA synthesis, red blood cell formation, and maintaining the protective myelin sheath around nerve cells, which is why deficiency produces both a blood problem (anemia) and a nervous-system problem (neuropathy) at once, a combination uncommon among nutrient deficiencies. What sets B12 apart from almost every other nutrient covered in this category is how convoluted its absorption actually is: it's not enough to eat B12-containing food, the body also needs a working stomach, a working pancreas, and a working terminal ileum, all functioning in sequence, covered directly in the absorption-mechanism entry below. That multi-step dependency is exactly why B12 deficiency can show up even in someone eating plenty of it, if any one step in that chain is disrupted, and it's the reason B12 deficiency investigation is more involved than 'are you eating enough meat and dairy.'",
    citations: [
      { source: 'Vitamin B12 (Cobalamin) Deficiency, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK441923/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'b12-deficiency-prevalence-causes',
    category: 'basicHealth',
    title: "B12 Deficiency Has Four Distinct Causes, and Diet Alone Is the Least Common One",
    teaser: 'A strict vegan diet takes roughly three years to deplete B12 stores enough to cause deficiency, since the body stores several years worth in the liver.',
    summary: "B12 deficiency traces back to four distinct causes, and it's worth knowing which one actually applies rather than assuming diet is always the explanation. Autoimmune (pernicious anemia): the immune system produces antibodies against intrinsic factor itself, the stomach protein B12 absorption depends on, a second, separate autoimmune process, not a dietary gap at all. Malabsorption: gastric bypass surgery, Crohn's disease, celiac disease, or a specific parasitic cause (the fish tapeworm, Diphyllobothrium latum) can all block absorption even with adequate dietary intake. Dietary insufficiency: a strict vegan diet with no B12-fortified foods or supplements, though this takes around three years to cause deficiency, since the liver stores several years worth of B12 at once, a notable exception to how quickly most nutrient deficiencies can develop. Medication/toxin-related: nitrous oxide exposure and, directly relevant to the research, metformin, a documented cause of B12 deficiency in long-term users. Older adults are disproportionately affected regardless of the underlying cause, and B12 deficiency is more prevalent in people of Northern European ancestry specifically, tracking with pernicious anemia's own genetic risk pattern.",
    citations: [
      { source: 'Vitamin B12 (Cobalamin) Deficiency, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK441923/' },
    ],
    overallTier: 'strong',
    relatedIds: ['advocacy-b12-folate', 'labs-absorption-interferers-beyond-food'],
  },
  {
    id: 'b12-deficiency-symptoms-staged',
    category: 'basicHealth',
    title: "B12 Deficiency's Two-Track Symptom Picture: Blood Problems First, Nerve Damage in Severe, Prolonged Cases",
    teaser: 'Fatigue and pallor are the early, common signs. Loss of balance and memory problems mean the deficiency has been present long enough to start damaging nerves directly.',
    summary:
      "B12 deficiency progresses along two somewhat separate tracks. The hematologic track shows up first and more commonly: fatigue, pale skin, and jaundice, from the large, immature red blood cells (megaloblastic anemia) B12 deficiency produces. The neurological track develops in more severe, longer-standing cases, and is more serious: peripheral neuropathy, loss of coordination (ataxia), loss of proprioception (the sense of where the body is in space), and in severe cases, dementia-like cognitive decline. The most severe, specifically named neurological complication is subacute combined degeneration of the spinal cord, direct damage to the spinal cord's dorsal columns and corticospinal tracts. A worth-knowing clinical nuance: neurological symptoms can appear even without anemia being present, meaning a normal blood count doesn't fully rule out an ongoing B12 problem. Diagnostically, serum B12 above 300 pg/mL is considered normal, 200-300 pg/mL is borderline and worth further testing, and below 200 pg/mL is considered deficient.",
    citations: [
      { source: 'Vitamin B12 (Cobalamin) Deficiency, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK441923/' },
    ],
    overallTier: 'strong',
    relatedIds: ['nutrient-zinc-iron-b12'],
  },
  {
    id: 'b12-toxicity-honest-non-issue',
    category: 'basicHealth',
    title: 'B12 Toxicity: A Honest Exception to Almost Every Other Nutrient in This Category',
    teaser: "No established upper limit exists, and the medical literature states directly: no overdose occurs.",
    summary:
      "Every other nutrient deep-dive in this category so far (magnesium, vitamin D, iron, zinc) has a toxicity risk at high enough doses. B12 is an exception, not covered by a generic caution that doesn't actually apply here. The clinical literature states directly that no overdose occurs with cyanocobalamin, and there's no established tolerable upper intake level, since excess B12 is efficiently cleared through the kidneys rather than accumulating to toxic levels the way iron or vitamin A can. That doesn't mean literally zero considerations exist. A small number of people are allergic to cobalt (the metal at B12's own molecular core) and can have an allergic reaction, including anaphylaxis in rare cases, particularly with injectable forms. Starting B12 treatment for a confirmed deficiency can also trigger hypokalemia (low potassium) as the anemia itself starts correcting and red blood cell production ramps up quickly, using up potassium faster than usual, a real consideration for someone just starting treatment for a significant deficiency, not a reason to avoid supplementation itself.",
    citations: [
      { source: 'Cyanocobalamin, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK555964/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'b12-absorption-mechanism',
    category: 'basicHealth',
    title: "B12's Three-Step Absorption Relay, and Why So Many Different Conditions Can Break It",
    teaser: 'Salivary R-factor, stomach intrinsic factor, and a receptor at the very end of the small intestine all have to work correctly, in sequence, for a single B12 molecule to be absorbed.',
    summary:
      "Dietary B12 absorption runs through a multi-step relay, not a simple gut-wall diffusion the way many nutrients work. First, B12 binds to R-factor (also called haptocorrin), a protein secreted by the salivary glands, protecting it as it passes through the acidic stomach. Second, once in the small intestine, pancreatic enzymes cleave B12 off of R-factor, freeing it to bind instead to intrinsic factor, a glycoprotein secreted by the stomach's own parietal cells (the same cells pernicious anemia's autoimmune attack targets). Third, this B12-intrinsic-factor complex travels all the way to the terminal ileum, the very end of the small intestine, where specific receptors finally allow it to be absorbed into the bloodstream. This three-step chain, spanning the salivary glands, stomach, pancreas, and the far end of the small intestine, is exactly why so many seemingly unrelated conditions can each independently cause B12 deficiency: gastric bypass surgery removes stomach tissue that makes intrinsic factor, Crohn's disease specifically affecting the terminal ileum can block the final absorption step, celiac disease damages the small intestine more broadly, and pernicious anemia attacks intrinsic factor production directly. A single working step isn't enough; every link in the chain has to hold.",
    citations: [
      { source: 'Vitamin B12 (Cobalamin) Deficiency, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK441923/' },
    ],
    overallTier: 'strong',
    relatedIds: ['celiac-overview', 'advocacy-b12-folate'],
  },
  {
    id: 'b12-supplement-forms-compared',
    category: 'basicHealth',
    title: 'Methylcobalamin vs. Cyanocobalamin: A Real, if Still Emerging, Retention Difference',
    teaser: 'Cyanocobalamin is the cheaper, more-studied standard. Methylcobalamin, the form the body actually uses directly, may be retained better, though the comparative research is still limited.',
    summary: "The reference data (built during earlier medication and supplement-tracking work) already carries an honest comparison between B12's two most common supplement forms. Cyanocobalamin is the most-studied, most stable, and cheapest form, the one used in most food fortification and in the majority of B12-deficiency treatment trials, with well-established efficacy. Methylcobalamin is the naturally circulating, already-active coenzyme form the body uses directly, and limited comparative human data suggest it may be retained better in tissue (with lower urinary loss) than cyanocobalamin at an equivalent dose, though this is tiered here as emerging rather than established, since broader confirmatory research is still needed before treating it as settled. Both forms are generally well tolerated, and absorption itself doesn't depend on food or fat, so B12 supplements can reasonably be taken at any time of day.",
    citations: [
      { source: 'Standard clinical/nutritional pharmacology comparisons of B12 supplement forms', url: 'https://www.ncbi.nlm.nih.gov/books/NBK555964/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'b12-food-sources-real-data',
    category: 'basicHealth',
    title: "B12 Food Sources, Pulled Directly From The Database",
    teaser: 'Every meaningful source is animal-derived, which is the actual reason a fully plant-based diet needs a deliberate B12 plan, not a food-choice workaround.',
    summary: "B12 content pulled directly from the 22,022-food reference database. Clams lead by a wide margin at roughly 99mcg per 100g. Lamb liver and beef liver both carry exceptionally high amounts, commonly 40-90mcg per 100g depending on preparation, the same organ-meat pattern already seen in this category's own iron research. Salmon carries a more moderate 8-29mcg per 100g depending on preparation and cut. Tuna carries roughly 9-11mcg per 100g. The single most practically important fact in this whole entry: every meaningful B12 source is animal-derived (meat, seafood, eggs, dairy), with no meaningful naturally-occurring plant source. This is exactly why a fully plant-based diet needs a deliberate B12 plan (fortified foods or a supplement), not a food-substitution workaround, and why the roughly three-year depletion timeline covered in the deficiency-causes entry above matters, stored B12 doesn't simply run out slowly and announce itself early.",
    citations: [],
    overallTier: 'strong',
    chart: {
      title: 'Vitamin B12 Content of Foods (per 100g)',
      unit: 'mcg',
      data: [
        { label: 'Clams', value: 99 },
        { label: 'Lamb liver', value: 60 },
        { label: 'Beef liver', value: 30 },
        { label: 'Salmon', value: 15 },
        { label: 'Tuna', value: 10 },
      ],
      sourceNote: "This app's own reference database (USDA/Canada_CNF-sourced values)",
    },
  },
  {
    id: 'b12-tying-together',
    category: 'basicHealth',
    title: 'What Actually Holds Up for B12, Pulled Together',
    teaser: "A nutrient the body can store for years, absorbed through a fragile multi-organ relay, with essentially no overdose risk at the other end.",
    summary: "Line up everything in this category and B12 reads as a different kind of nutrient story from magnesium, vitamin D, iron, or zinc. The risk sits almost entirely on the deficiency side, not the excess side; toxicity here is an honest non-issue, with no established upper limit and the literature stating directly that no overdose occurs. Deficiency, though, is real and has four distinct causes worth telling apart (autoimmune, malabsorption, diet, medication-related), each needing a different fix, not a single blanket answer. The absorption mechanism itself is the throughline explaining why so many different conditions (gastric surgery, Crohn's, celiac, pernicious anemia, even long-term metformin use) can each independently cause the same deficiency: a multi-step relay through the salivary glands, stomach, pancreas, and terminal ileum, where a single broken link is enough to cause a problem regardless of how much B12 someone eats. The Hashimoto's-specific research covers the measured overlap between autoimmune thyroid disease and pernicious anemia directly, a second, separate autoimmune process, not something to assume away as coincidental symptom overlap.",
    citations: [
      { source: 'Vitamin B12 (Cobalamin) Deficiency, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK441923/' },
    ],
    overallTier: 'strong',
    relatedIds: ['b12-deficiency-prevalence-causes', 'b12-absorption-mechanism', 'advocacy-b12-folate', 'nutrient-zinc-iron-b12'],
  },

  // -- Folate (vitamin B9), added 2026-08-08, the sixth deep-dive in this
  // series. Deliberately kept tight -- real folate content already exists
  // and stays where it is (nutrient-folate-antioxidants, hashimotos;
  // ra-methotrexate-folate, rheumatoidArthritis), cross-linked rather than
  // re-derived. Checked `supplement_forms` first: real, already-cited
  // L-methylfolate/MTHFR-vs-folic-acid data was already there from the My
  // Meds work.
  {
    id: 'folate-overview',
    category: 'basicHealth',
    title: 'Folate (Vitamin B9): The Other Half of the Same DNA-Synthesis Pathway B12 Runs On',
    teaser: 'Folate and B12 work in the same metabolic loop closely enough that a deficiency in one can hide a deficiency in the other.',
    summary:
      "Folate, like B12, is required for DNA synthesis and red blood cell formation, and the two nutrients are chemically linked closely enough in the same metabolic pathway that a deficiency in either one produces the identical hematologic problem: megaloblastic anemia, large, immature red blood cells that can't function normally. That shared endpoint is exactly why the two are always worth checking together rather than separately, covered directly in the entry below on folate's own specific danger of masking a B12 problem. Folate exists naturally in food as several related compounds, collectively absorbed and converted into its active form, while folic acid, the synthetic form used in supplements and fortified food, follows a slightly different metabolic path, covered in the supplement-forms entry below.",
    citations: [
      { source: 'Folic Acid Deficiency, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK535377/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'folate-deficiency-prevalence-causes',
    category: 'basicHealth',
    title: 'Folate Deficiency Is Rare in the US, Thanks to a Deliberate Public-Health Program',
    teaser: 'Under 5% in fortification-mandated countries versus over 20% among women of reproductive age in low-income countries without it.',
    summary:
      "Folate deficiency shows a stark difference driven almost entirely by public policy rather than biology. In countries with mandatory folic acid food fortification, including the US, deficiency is uncommon, generally under 5%. In low-income countries without fortification, deficiency among women of reproductive age exceeds a 20%. Even within the US, a more specific finding is: 22.8% of American women aged 12-49 had suboptimal red blood cell folate levels in one measured cohort, meaning fortification substantially reduces outright deficiency without eliminating a more marginal shortfall in a meaningful share of the population. Causes beyond simple dietary insufficiency: malabsorption (celiac disease, inflammatory bowel disease), chronic alcohol use (alcohol directly interferes with folate metabolism and absorption), medications (methotrexate is a direct antifolate by design, and phenytoin, an anti-seizure medication, independently reduces folate levels), and increased physiological demand, most notably pregnancy. Diagnostically, serum folate under 2 ng/mL indicates deficiency, 2-4 ng/mL is borderline, and above 4 ng/mL is normal.",
    citations: [
      { source: 'Folic Acid Deficiency, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK535377/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ra-methotrexate-folate', 'advocacy-b12-folate'],
  },
  {
    id: 'folate-b12-masking-danger',
    category: 'basicHealth',
    title: 'A Specific Danger: Folic Acid Can Correct B12-Deficiency Anemia While Nerve Damage Keeps Progressing, Unrecognized',
    teaser: "This is exactly why B12 should always be checked before starting folic acid, not treated as an interchangeable, equally-safe B vitamin.",
    summary: "This is the single most clinically important fact connecting folate and B12, worth its own entry rather than a footnote. Folate and B12 deficiency both cause the identical-looking megaloblastic anemia, which means a blood count alone can't reliably tell them apart. High-dose folic acid supplementation can correct that anemia, the visible, measurable hematologic sign, even when the underlying cause is B12 deficiency, not folate deficiency at all. The danger: while the anemia visibly improves, B12 deficiency's own separate, more serious neurological damage (covered in the B12 deficiency entry) continues progressing completely unrecognized, since the one lab marker most likely to prompt further investigation has just been masked. The clinical literature is direct about the fix: B12 levels should always be checked before starting folic acid treatment, and if B12 deficiency is present, B12 repletion needs to start before or alongside folic acid, never folic acid alone. This is a specific reason the self-advocacy research already recommends checking B12 and folate together, not as a redundant double-check, but because treating one while missing the other can make the unaddressed problem worse by hiding its own warning sign.",
    citations: [
      { source: 'Folic Acid Deficiency, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK535377/' },
    ],
    overallTier: 'strong',
    relatedIds: ['b12-deficiency-symptoms-staged', 'advocacy-b12-folate'],
  },
  {
    id: 'folate-neural-tube-defects',
    category: 'basicHealth',
    title: 'Folate and Neural Tube Defects: One of the Clearest, Most Successful Nutrition Public-Health Wins on Record',
    teaser: 'Mandatory fortification specifically because the evidence for preventing a serious birth defect was strong enough to change the food supply itself.',
    summary:
      "Adequate folate intake around the time of conception and in early pregnancy is one of the most solidly established nutrition findings in this entire Digest, real and settled enough that it directly led to a national food-fortification policy rather than staying a recommendation on paper. The standard recommended intake during pregnancy is 600 mcg daily, and for women at higher risk (a previous pregnancy affected by a neural tube defect, for instance), the specifically higher recommendation jumps to 4-5 mg daily, a substantial, deliberate increase reflecting how much the risk reduction matters in that specific situation. Neural tube defects (conditions like spina bifida, where the spinal cord or brain doesn't close properly early in fetal development) happen very early in pregnancy, often before someone knows they're pregnant at all, which is the practical reason folate status matters before conception, not just once pregnancy is confirmed, and the reason mandatory fortification (adding folic acid to the food supply broadly, not relying on individual supplementation alone) has been such an effective public-health strategy.",
    citations: [
      { source: 'Folic Acid Deficiency, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK535377/' },
    ],
    overallTier: 'strong',
    relatedIds: ['pregnancy-tying-together'],
  },
  {
    id: 'folate-supplement-forms-compared',
    category: 'basicHealth',
    title: 'L-Methylfolate vs. Folic Acid: A Difference That Matters More for Some People Than Others',
    teaser: 'A common genetic variant reduces the enzyme that converts folic acid into its active form. L-methylfolate skips that step entirely.',
    summary: "The reference data (built during earlier medication and supplement-tracking work) already carries a cited comparison between folate's two most common supplement forms. Folic acid is the synthetic, most-studied, and most-fortified form, the one used in the US mandatory fortification program specifically because it measurably reduces neural tube defects at a whole-population level, and it's generally well tolerated at standard RDA-level doses. L-methylfolate (5-MTHF) is already in the metabolically active form the body actually uses, meaning it doesn't require the MTHFR enzyme to activate it first, a practically relevant distinction for the substantial share of people who carry a common genetic variant reducing that enzyme's own activity. Head-to-head trials found L-methylfolate produces higher, faster peak plasma folate levels than folic acid. Both forms are generally well tolerated; the practical choice mainly comes down to whether MTHFR variant status is a known factor, not a universal one-size-fits-all answer.",
    citations: [
      { source: 'Comparative pharmacology of L-methylfolate and folic acid supplementation', url: 'https://www.ncbi.nlm.nih.gov/books/NBK535377/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'folate-food-sources-real-data',
    category: 'basicHealth',
    title: "Folate Food Sources, Pulled Directly From The Database",
    teaser: 'Yeast extract spread (the ingredient behind products like Marmite) carries an enormous, outlier amount, legumes and leafy greens make up the rest of a realistic list.',
    summary: "Folate content pulled directly from the 22,022-food reference database. Yeast extract spread is an outlier at roughly 3,786mcg per 100g, far beyond any other food, the same ingredient behind products like Marmite and Vegemite, eaten in small amounts specifically because of how concentrated it is. Chicken liver carries a very high 650-1,450mcg per 100g depending on preparation, the same organ-meat pattern already seen throughout this category's own iron and B12 research. Among more everyday plant sources, black-eyed peas carry a 630-640mcg per 100g, lentils roughly 479mcg per 100g, and spinach and asparagus both carry a meaningful 210-225mcg per 100g. For context, the standard adult RDA is 400mcg daily, meaning a serving of lentils or black-eyed peas alone can cover a substantial share of a full day's need.",
    citations: [],
    overallTier: 'strong',
    chart: {
      title: 'Folate Content of Foods (per 100g)',
      unit: 'mcg',
      data: [
        { label: 'Chicken liver', value: 1000 },
        { label: 'Black-eyed peas', value: 635 },
        { label: 'Lentils', value: 479 },
        { label: 'Asparagus', value: 220 },
        { label: 'Spinach', value: 215 },
      ],
      sourceNote: "This app's own reference database (USDA/Canada_CNF-sourced values); yeast extract spread (~3,786mcg/100g) omitted from the chart as an outlier that would flatten every other bar",
    },
  },
  {
    id: 'folate-tying-together',
    category: 'basicHealth',
    title: 'What Actually Holds Up for Folate, Pulled Together',
    teaser: "A public-health success story on one side, and a specific reason it should never be treated as B12's interchangeable stand-in on the other.",
    summary: "Line up everything in this category and folate reads as a nutrient defined by two connected stories. The first is a public-health win: mandatory fortification measurably reduced neural tube defects at a population level, settled evidence strong enough to change the food supply itself, not just a recommendation. The second is an important caution that runs directly against how folate often gets marketed and self-supplemented: because folate and B12 deficiency look identical on a basic blood count, folic acid can mask an underlying B12 problem, correcting the visible anemia while B12's own separate, more serious neurological damage keeps progressing unrecognized. That's the practical reason B12 and folate belong together on any lab request, never checked as if either one alone tells the full story. The Hashimoto's-specific research already covers folate's own thinner, more observational link to thyroid antibody levels, and rheumatoid arthritis's own methotrexate-folate timing rule builds on the identical antifolate mechanism covered here.",
    citations: [
      { source: 'Folic Acid Deficiency, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK535377/' },
    ],
    overallTier: 'strong',
    relatedIds: ['folate-b12-masking-danger', 'folate-neural-tube-defects', 'nutrient-folate-antioxidants', 'ra-methotrexate-folate', 'b12-tying-together'],
  },

  // -- Calcium, added 2026-08-08, the seventh deep-dive in this series.
  // `supplement_forms`/`nutrient_timing` already carried a real, rich set
  // of already-cited data from the My Meds work (citrate-vs-carbonate,
  // the 500mg single-dose absorption ceiling, the vitamin D dependency) --
  // reused directly rather than re-derived. WebSearch still exhausted;
  // every new citation came via the established WebFetch/StatPearls
  // fallback. A real, direct thyroid-surgery connection surfaced during
  // research (post-thyroidectomy hypocalcemia, hyperthyroidism as a real
  // hypercalcemia cause) -- cross-linked to Graves' rather than treated as
  // a coincidence.
  {
    id: 'calcium-overview',
    category: 'basicHealth',
    title: "Calcium: 99% of It Is Structural, and the Remaining 1% Is Tightly, Continuously Regulated",
    teaser: "Bone isn't just calcium's storage site, it's an active reserve the body draws from and replenishes constantly to keep blood calcium in a narrow, non-negotiable range.",
    summary:
      "Roughly 99% of the body's calcium sits in bones and teeth, giving them their structural rigidity. The remaining 1%, circulating in blood and inside cells, does a disproportionately important job: normal muscle contraction (including the heart itself), nerve signaling, blood clotting, and hormone secretion all depend on that small circulating pool staying within a narrow, tightly held range. When dietary calcium or vitamin D falls short, the body doesn't just let blood calcium drop; it actively pulls calcium out of bone to protect that circulating pool first, which is exactly why a chronic dietary shortfall shows up in bone density years before it ever shows up as a low blood calcium result on a standard lab panel. Three hormones govern this system together: parathyroid hormone (PTH), which raises blood calcium by pulling it from bone and increasing kidney reabsorption; calcitonin, which lowers it; and vitamin D, required to actually absorb dietary calcium in the first place, covered directly in the absorption entry below.",
    citations: [
      { source: 'Hypocalcemia, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK430912/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'calcium-deficiency-hypocalcemia',
    category: 'basicHealth',
    title: 'Hypocalcemia: A Graded Symptom Course, and a Direct Link to Thyroid Surgery',
    teaser: 'Postsurgical injury to the parathyroid glands, most often during thyroid surgery, accounts for roughly 75% of hypoparathyroidism cases.',
    summary: "Low blood calcium (hypocalcemia) has a graded symptom course tracking with how low and how fast it drops. Mild-to-moderate: paresthesias (tingling), often around the mouth or in the fingertips, plus muscle cramps. Moderate-to-severe: two specifically named physical exam findings, Chvostek's sign (a facial muscle twitch when the facial nerve is tapped) and Trousseau's sign (hand spasm when a blood pressure cuff is inflated above systolic pressure for 2-3 minutes), plus tetany, more pronounced the faster calcium is falling. Severe, generally below 7 mg/dL: seizures, laryngospasm, and dangerous cardiac arrhythmias from QT-interval prolongation. The most directly relevant cause for a thyroid-focused app: postsurgical injury to the parathyroid glands, most often during thyroidectomy or other neck surgery, accounts for roughly 75% of hypoparathyroidism cases, with transient post-thyroidectomy hypocalcemia affecting a wide 6.9-49% of patients and permanent hypocalcemia affecting 0.4-33%, depending on the surgery's own extent and the surgeon's own experience. Other causes: vitamin D deficiency, chronic kidney disease (impaired vitamin D activation), autoimmune destruction of the parathyroid glands (part of Autoimmune Polyglandular Syndrome Type 1, a separate condition from the APS-2 already covered in the Graves' research), and low magnesium, which independently blocks PTH release, the same mechanism already covered in the magnesium research. A critical treatment nuance: hypomagnesemia has to be corrected before hypocalcemia will respond to treatment at all.",
    citations: [
      { source: 'Hypocalcemia, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK430912/' },
    ],
    overallTier: 'strong',
    relatedIds: ['magnesium-synergies-antagonists', 'graves-overview'],
  },
  {
    id: 'calcium-toxicity-hypercalcemia',
    category: 'basicHealth',
    title: "Hypercalcemia's Mnemonic: 'Stones, Bones, Groans, Thrones, and Psychiatric Overtones'",
    teaser: 'Hyperthyroidism is a documented cause on its own, and excess antacid-style calcium carbonate can independently cause it too, a condition with its own name: milk-alkali syndrome.',
    summary: "High blood calcium (hypercalcemia) has a classic, memorable symptom mnemonic covering every organ system it touches: stones (kidney stones), bones (bone pain), groans (abdominal pain, constipation, nausea), thrones (polyuria from the kidneys trying to excrete the excess), and psychiatric overtones (confusion, depression, in severe cases outright psychosis). Diagnostic severity bands: mild is 10.5-11.9 mg/dL, moderate is 12.0-13.9 mg/dL, and a hypercalcemic crisis is 14.0-16.0 mg/dL. Causes span several different mechanisms. Primary hyperparathyroidism and malignancy together account for a 90%+ of cases. Directly relevant to the research: hyperthyroidism itself is a documented cause, since excess thyroid hormone accelerates bone turnover, and lithium (already covered in the Graves'-adjacent medication research) alters the body's own calcium set point, requiring a higher blood calcium level before PTH release is suppressed. A specific, self-inflicted cause: excessive use of calcium carbonate antacids (the same over-the-counter form already covered in the supplement-forms research) for reflux or indigestion can cause milk-alkali syndrome, a named hypercalcemia syndrome from over-supplementation, not a rare medical curiosity.",
    citations: [
      { source: 'Hypercalcemia, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK430714/' },
    ],
    overallTier: 'strong',
    relatedIds: ['graves-overview', 'calcium-supplement-forms-compared'],
  },
  {
    id: 'calcium-absorption-mechanism',
    category: 'basicHealth',
    title: 'Calcium Absorption Has a Hard Ceiling Per Dose, and Cannot Happen at All Without Vitamin D',
    teaser: 'Splitting a 1,000mg daily calcium target into two 500mg doses absorbs better than taking it all at once.',
    summary: "The reference data (built during earlier medication and supplement-tracking work) already carries specific, cited detail on how calcium absorption actually works, most of it more actionable than commonly realized. Vitamin D is an absolute requirement, not just a helpful add-on: without it, dietary calcium largely passes through unabsorbed regardless of how much is eaten, the reason the vitamin D research and calcium research are inseparable from each other. Absorption efficiency also has a hard ceiling per single dose: taken above roughly 500mg of elemental calcium at once, the fraction actually absorbed drops sharply, which is the practical reason splitting a daily target (say, 1,000mg) into two separate 500mg doses absorbs measurably better than taking it all in one sitting. Calcium also competes directly with iron and zinc for absorption (both already covered in the Nutrient Interactions research) and needs a 4+ hour separation from levothyroxine, the same well-established interaction already covered in the Labs & Medication Timing research. Magnesium and vitamin K2 round out calcium's own regulatory picture, governing where absorbed calcium actually gets deposited (bone versus soft tissue), already covered in full in the Nutrient Interactions category.",
    citations: [
      { source: 'NIH Office of Dietary Supplements, Calcium Health Professional Fact Sheet', url: 'https://ods.od.nih.gov/factsheets/Calcium-HealthProfessional/' },
    ],
    overallTier: 'strong',
    relatedIds: ['interaction-calcium-iron', 'labs-calcium-iron-absorption', 'interaction-vitamind-k2-magnesium', 'vitaminc-absorption-dose-dependent'],
  },
  {
    id: 'calcium-supplement-forms-compared',
    category: 'basicHealth',
    title: 'Calcium Citrate vs. Calcium Carbonate: The Difference Matters Most for Anyone on Acid-Reducing Medication',
    teaser: "Calcium carbonate needs stomach acid to dissolve. Anyone on a PPI or H2 blocker, or simply older, may not be absorbing it the way the label assumes.",
    summary: "The reference data already carries a specific comparison between calcium's two most common supplement forms. Calcium carbonate is the cheapest, most common form, and carries the highest elemental calcium by weight (roughly 40%), but it requires stomach acid to dissolve before it can be absorbed at all. That's a practical problem for two overlapping groups: people with achlorhydria (reduced stomach acid, more common with age) and anyone taking acid-suppressing medication (proton pump inhibitors or H2 blockers), where carbonate's own absorption drops sharply. Calcium citrate absorbs roughly 22-27% better on average and doesn't require stomach acid to dissolve at all, meaning its absorption holds up in both of those exact situations where carbonate's own doesn't. The practical trade-off: carbonate is cheaper and can be taken with or without food (though food helps, since eating stimulates stomach acid), while citrate is more forgiving of timing and medical circumstance, at a somewhat higher cost. Carbonate is also more likely to cause gas or constipation, especially at higher doses, than the gentler citrate form.",
    citations: [
      { source: 'NIH Office of Dietary Supplements, Calcium Health Professional Fact Sheet', url: 'https://ods.od.nih.gov/factsheets/Calcium-HealthProfessional/' },
    ],
    overallTier: 'strong',
    relatedIds: ['labs-absorption-interferers-beyond-food'],
  },
  {
    id: 'calcium-food-sources-real-data',
    category: 'basicHealth',
    title: "Calcium Food Sources, Pulled Directly From The Database",
    teaser: 'Calcium-set tofu out-calciums milk, a specific fact tied to how it happens to be made, not a property of soy itself.',
    summary: "Calcium content pulled directly from the 22,022-food reference database. Tofu prepared with a calcium-based coagulant (calcium sulfate) leads by a wide margin at roughly 2,134mg per 100g, a fact specifically tied to the manufacturing process, not soy itself; tofu made with a different coagulant carries meaningfully less. Sesame seeds carry a high 1,200mg per 100g. Parmesan, a concentrated hard cheese, carries roughly 980mg per 100g, well above most other dairy. Sardines (eaten with their edible bones) carry a 240-382mg per 100g. Almonds carry a more modest 210-260mg per 100g. For context, the standard adult RDA is 1,000-1,200mg daily, meaning a serving of calcium-set tofu or sesame seeds alone can cover a substantial share of a full day's need, relevant for anyone limiting dairy for any reason.",
    citations: [],
    overallTier: 'strong',
    chart: {
      title: 'Calcium Content of Foods (per 100g)',
      unit: 'mg',
      data: [
        { label: 'Calcium-set tofu', value: 2134 },
        { label: 'Sesame seeds', value: 1200 },
        { label: 'Parmesan', value: 980 },
        { label: 'Sardines', value: 380 },
        { label: 'Almonds', value: 250 },
      ],
      sourceNote: "This app's own reference database (USDA/Japan_MEXT-sourced values)",
    },
  },
  {
    id: 'calcium-tying-together',
    category: 'basicHealth',
    title: 'What Actually Holds Up for Calcium, Pulled Together',
    teaser: "A mineral where 99% of the body's supply sits in reserve, actively drawn down long before a blood test would ever catch a problem.",
    summary:
      "Line up everything in this category and calcium reads as a nutrient where the most important lesson is that a normal blood calcium result doesn't mean the underlying supply is fine. Because the body actively defends that small circulating 1% by pulling from bone reserves first, a chronic dietary shortfall can drain bone density for years while blood calcium itself stays perfectly normal, only showing up as hypocalcemia once bone reserves themselves are exhausted, which is a different failure pattern from most other nutrients in this category. Both extremes, hypocalcemia and hypercalcemia, have their own graded symptom courses and their own specific causes, including a direct, worth-remembering connection to thyroid surgery and hyperthyroidism itself. The practical layer underneath all of it is actionable: vitamin D is a hard absorption requirement, not optional; doses above roughly 500mg absorb worse in one sitting; and the right supplement form depends on individual factors like stomach acid and medication use, not a single universal answer.",
    citations: [
      { source: 'Hypocalcemia, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK430912/' },
    ],
    overallTier: 'strong',
    relatedIds: ['calcium-deficiency-hypocalcemia', 'calcium-toxicity-hypercalcemia', 'calcium-absorption-mechanism', 'vitamind-tying-together', 'body-bones-teeth-skeleton'],
  },

  // -- Potassium, added 2026-08-08, the eighth deep-dive in this series.
  // `supplement_forms`/`nutrient_timing` already carried real, cited data
  // from the My Meds work (citrate-vs-chloride, the ACE/ARB hyperkalemia
  // caution already used as a real interaction rule). Deliberately did not
  // duplicate the existing CKD-specific potassium-restriction entry or the
  // PCOS-specific spironolactone caution -- both cross-linked instead.
  {
    id: 'potassium-overview',
    category: 'basicHealth',
    title: "Potassium: The Cell's Own Primary Positive Charge, and the Reason Almost Every Cell in the Body Depends on It",
    teaser: 'The sodium-potassium pump moving potassium into cells (and sodium out) runs constantly, in essentially every cell, and is directly responsible for how nerves and muscles, including the heart, actually fire.',
    summary: "Potassium is the body's primary intracellular positive ion, meaning most of it sits inside cells rather than in the blood, the opposite distribution from sodium. That inside/outside gradient, actively maintained by the sodium-potassium pump (the same Na+/K+-ATPase already covered in the magnesium research, since magnesium is a required cofactor for that same pump to function), is what actually generates the electrical signal nerves and muscles use to fire, including the heart's own electrical conduction system. That's the direct reason both too little and too much circulating potassium show up as dangerous cardiac and neuromuscular problems, covered in the two entries directly below, rather than a vague, generic 'electrolyte imbalance' symptom picture. Potassium is also the direct counterbalance to sodium in blood pressure regulation, covered in its own entry below.",
    citations: [
      { source: 'Hypokalemia, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK482465/' },
    ],
    overallTier: 'strong',
    relatedIds: ['magnesium-synergies-antagonists'],
  },
  {
    id: 'potassium-deficiency-hypokalemia',
    category: 'basicHealth',
    title: "Hypokalemia: A Graded Severity Scale, and More Common Than Its Better-Known Opposite",
    teaser: 'Weakness starts in the legs before spreading upward, a specific, recognizable pattern rather than generic full-body fatigue.',
    summary: "Low blood potassium (hypokalemia) is actually more prevalent than hyperkalemia, with particular risk among hospitalized patients, children, and critically ill people. Diagnostic severity bands: mild is 3.0-3.5 mmol/L, moderate is 2.5-3.0 mmol/L, and severe is below 2.5 mmol/L, with symptoms typically emerging once levels drop below 3 mmol/L. Three distinct mechanisms cause it: inadequate intake (poor nutrition, eating disorders), potassium shifting into cells rather than being lost (insulin, certain medications), and excessive losses through the kidneys (diuretics), GI tract (diarrhea, vomiting), or skin (heavy sweating). The specific symptom pattern: muscle weakness, cramping, and fatigue, with weakness classically starting in the lower extremities before progressing to the trunk and upper body, plus constipation and heart palpitations. Severe cases risk respiratory muscle paralysis. On ECG, hypokalemia produces a specific, named pattern: decreased T-wave amplitude, ST-segment depression, a visible U wave, and a prolonged QT interval, with severe cases risking ventricular arrhythmias. The CKD-specific research already covers an important, related nuance: the common advice to blanket-restrict dietary potassium turns out to have surprisingly thin evidence behind it, worth reading alongside this entry rather than assuming restriction is always the safe default.",
    citations: [
      { source: 'Hypokalemia, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK482465/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ckd-potassium-restriction-reconsidered'],
  },
  {
    id: 'potassium-toxicity-hyperkalemia',
    category: 'basicHealth',
    title: "Hyperkalemia: A Medical Emergency Where the Speed of the Rise Matters as Much as the Number Itself",
    teaser: 'Mortality approaches two-thirds in severe, rapidly-rising cases left untreated, a stark contrast to how casually potassium supplements are sometimes treated.',
    summary: "High blood potassium (hyperkalemia), defined as above roughly 5.0-5.5 mEq/L, is a medical emergency at its more severe end, not a mild electrolyte quirk. Three mechanisms cause it: impaired kidney excretion (the most common cause, especially in kidney disease), excessive intake (dietary or intravenous), and potassium shifting out of cells into the blood (cell injury, metabolic acidosis, rhabdomyolysis). The staged ECG progression tracks disturbingly precisely with severity: 5.5-6.5 mEq/L produces tall, peaked T waves; 6.5-7.5 mEq/L flattens or erases the P wave; 7-8 mEq/L widens the QRS complex; and 8-10 mEq/L risks severe arrhythmias, a dangerous sine-wave ECG pattern, and cardiac arrest. A clinically important nuance: how FAST potassium rises matters more for cardiac risk than the absolute number alone, meaning a rapid rise can be dangerous at a lower number than a slow, chronic one. Acute, severe hyperkalemia left unmanaged carries a mortality rate approaching two-thirds. The CKD research already covers the specific reason ACE inhibitors and ARBs (both common, protective kidney/heart medications) need potassium monitoring, since they directly reduce the kidney's own ability to excrete potassium, covered directly in the dedicated entry on that exact interaction.",
    citations: [
      { source: 'Hyperkalemia, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK470284/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ckd-ace-arb-potassium-monitoring', 'pcos-spironolactone-potassium'],
  },
  {
    id: 'potassium-supplement-forms-compared',
    category: 'basicHealth',
    title: 'Potassium Citrate vs. Potassium Chloride: Similar Blood-Level Rise, an Extra Benefit for Citrate',
    teaser: "Potassium chloride is the common salt-substitute form. Citrate's own alkalinizing effect does something chloride can't: lower kidney stone risk directly.",
    summary: "The reference data (built during earlier medication and supplement-tracking work) already carries a cited comparison between potassium's two most common supplement forms. Potassium chloride is the most common over-the-counter and salt-substitute form, readily absorbed, and roughly matched to potassium citrate on how much it actually raises blood potassium in head-to-head testing. Potassium citrate has an additional benefit chloride doesn't: a randomized controlled trial found it produced significantly higher intracellular (red blood cell) potassium uptake and higher urinary excretion at an equivalent oral dose, and its own alkalinizing citrate anion independently improves acid-base balance, reduces urinary calcium loss, and increases urinary citrate, which lowers kidney stone risk, a meaningful extra benefit chloride simply doesn't carry. Both forms carry the identical hyperkalemia caution as any potassium supplement, and neither should be combined with ACE inhibitors, ARBs, or potassium-sparing diuretics without medical supervision.",
    citations: [
      { source: 'Wouda RD et al. 2023: Effects of Potassium Citrate vs. Potassium Chloride on Intracellular Potassium in Patients with CKD, Clin J Am Soc Nephrol, PMID 37382933', url: 'https://pubmed.ncbi.nlm.nih.gov/37382933/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'potassium-sodium-balance',
    category: 'basicHealth',
    title: 'Potassium & Sodium: Blood-Pressure Effects That Work Best Addressed Together, Not Sodium Alone',
    teaser: 'The DASH diet is specifically studied evidence for a food pattern deliberately high in potassium, not just low in sodium.',
    summary: "Potassium and sodium have opposing effects on blood pressure, and the more complete, better-evidenced approach addresses both together rather than fixating on sodium restriction alone, the way most everyday health advice tends to frame it. The Cardiovascular Disease research already covers the DASH diet's own specific sodium targets in depth. The other half of that same evidence base: DASH is also a deliberately potassium-rich eating pattern (built around vegetables, fruits, and low-fat dairy), and that potassium content is an independent contributor to the diet's own measured blood-pressure benefit, not an incidental side effect of eating less sodium. The practical, food-first takeaway: increasing potassium-rich whole foods (see the food-sources entry below) works alongside sodium reduction, not as a substitute for it, and is generally a safer way to shift the balance for most healthy people than potassium supplementation, which carries a hyperkalemia risk supplementing through food essentially never does.",
    citations: [
      { source: 'DASH Eating Plan, National Heart, Lung, and Blood Institute', url: 'https://www.nhlbi.nih.gov/education/dash-eating-plan' },
    ],
    overallTier: 'strong',
    relatedIds: ['cvd-dash-sodium'],
  },
  {
    id: 'potassium-food-sources-real-data',
    category: 'basicHealth',
    title: "Potassium Food Sources, Pulled Directly From The Database",
    teaser: "Bananas get most of the popular credit, but white beans and avocado both carry more potassium per 100g in the data.",
    summary: "Potassium content pulled directly from the 22,022-food reference database. White beans lead this everyday list at roughly 561mg per 100g. Avocado carries a high 550mg per 100g. Salmon carries roughly 490mg per 100g, a meaningful amount for a food not usually thought of as a potassium source first. Sweet potato carries about 475mg per 100g. Banana, the food most commonly associated with potassium in popular culture, actually carries a more modest 358mg per 100g in the verified data, lower than each of the other four foods on this same list, a direct correction to banana's own outsized reputation.",
    citations: [],
    overallTier: 'strong',
    chart: {
      title: 'Potassium Content of Foods (per 100g)',
      unit: 'mg',
      data: [
        { label: 'White beans', value: 561 },
        { label: 'Avocado', value: 550 },
        { label: 'Salmon', value: 490 },
        { label: 'Sweet potato', value: 475 },
        { label: 'Banana', value: 358 },
      ],
      sourceNote: "This app's own reference database (USDA/Canada_CNF-sourced values)",
    },
  },
  {
    id: 'potassium-tying-together',
    category: 'basicHealth',
    title: 'What Actually Holds Up for Potassium, Pulled Together',
    teaser: "A sharp, dangerous edge on both sides, and a more nuanced, food-first, both-electrolytes-together answer than 'just eat a banana' or 'just cut salt.'",
    summary: "Line up everything in this category and potassium reads as a nutrient where both extremes are dangerous, with the cardiac conduction system as the shared point of failure on either end: hypokalemia and hyperkalemia both produce their own specific, named, staged ECG changes, and both can independently trigger fatal arrhythmias. Hypokalemia is real and more common than its better-known opposite, hyperkalemia is a medical emergency where the SPEED of the rise matters as much as the number itself, and the CKD/PCOS/medication research already covers several of the specific reasons the two most common blood pressure and hormone medications, ACE inhibitors/ARBs and spironolactone, carry a documented hyperkalemia risk worth monitoring. The more nuanced, better-evidenced practical answer sits underneath all of it: potassium and sodium work best addressed together through whole foods, not sodium restriction alone and not a popular-culture banana-only view of potassium, and food-based potassium carries essentially none of supplementation's own hyperkalemia risk.",
    citations: [
      { source: 'Hyperkalemia, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK470284/' },
    ],
    overallTier: 'strong',
    relatedIds: ['potassium-deficiency-hypokalemia', 'potassium-toxicity-hyperkalemia', 'potassium-sodium-balance', 'ckd-tying-together', 'body-cardiovascular-electrolytes'],
  },

  // -- Iodine, added 2026-08-08, the ninth deep-dive in this series, but a
  // deliberately TIGHT one -- this app already had substantial real iodine
  // content before this pass (the NIS transporter and Wolff-Chaikoff
  // effect in Glossary, the 1924 Michigan goiter-belt history entry, the
  // real two-edged-nutrient framing and kelp-specific caution in
  // Hashimoto's, a full Graves'-specific iodine entry, and a pregnancy
  // iodine-needs entry). This pass fills the real remaining gap: the
  // universal thyroid-hormone-synthesis mechanism itself, real global
  // deficiency/toxicity numbers, and a real food-sources chart, cross-
  // linked to all of the above rather than repeating any of it.
  {
    id: 'iodine-thyroid-synthesis-mechanism',
    category: 'basicHealth',
    title: "How the Thyroid Actually Turns Iodine Into a Hormone, Step by Step",
    teaser: "The Glossary already names the transporter (NIS) and the safety brake (Wolff-Chaikoff). This entry covers the steps in between.",
    summary: "Making thyroid hormone is a multi-step process, and iodine is required at the very first step, not just a raw ingredient tossed in at the end. First, the thyroid actively pulls iodine out of the bloodstream using the sodium-iodide symporter (NIS), already covered in the Glossary, concentrating it inside the gland at levels far higher than in blood. Second, in a process called organification, that iodine gets attached to tyrosine residues on thyroglobulin, a large protein made inside the thyroid, forming the chemical building blocks (monoiodotyrosine and diiodotyrosine) hormone synthesis depends on. Third, those building blocks are coupled together to form the actual hormones: two diiodotyrosine molecules combine to form T4 (thyroxine, the thyroid's main hormone output), and one of each combines to form T3 (the more biologically active hormone). This sequential dependency, transport, then organification, then coupling, is exactly why an iodine shortfall at the very first step limits hormone production no matter how well every later step in the chain is functioning, and it's the same biochemistry the thyroid's own Wolff-Chaikoff safety brake (also covered in the Glossary) exists to protect.",
    citations: [
      { source: 'Diffuse Toxic Goiter, StatPearls, National Library of Medicine', url: 'https://pubmed.ncbi.nlm.nih.gov/32491782/' },
    ],
    overallTier: 'strong',
    relatedIds: ['nutrient-iodine'],
  },
  {
    id: 'iodine-deficiency-global-real-data',
    category: 'basicHealth',
    title: "Iodine Deficiency: a Leading, and Preventable Cause of Fetal Brain Damage Worldwide",
    teaser: 'Specific intake targets: 150mcg/day for adults, rising to 220-250mcg during pregnancy and 250-290mcg while breastfeeding.',
    summary: "Iodine deficiency is described directly in the clinical literature as a leading cause of preventable fetal brain damage worldwide, a stark framing worth taking seriously rather than treating iodine as an interchangeable, minor trace mineral. During pregnancy specifically, deficiency produces measurable maternal hypothyroidism and impaired infant neurobehavioral development, the exact mechanism behind the pregnancy-specific iodine research. Specific recommended intakes scale meaningfully with life stage: 150mcg/day for adults, rising to 220-250mcg/day during pregnancy, and 250-290mcg/day while breastfeeding, both substantial increases over the adult baseline. The History & Milestones research already covers the historic American 'goiter belt' and the 1924 Michigan salt-iodization program that resolved it at a population level, the public-health precedent behind why iodized salt exists as a product at all. Deficiency remains an ongoing global concern in parts of the world without reliable salt iodization, not a solved problem everywhere just because it was solved in one country a century ago.",
    citations: [
      { source: 'Iodine Toxicity, StatPearls, National Library of Medicine', url: 'https://pubmed.ncbi.nlm.nih.gov/32809605/' },
    ],
    overallTier: 'strong',
    relatedIds: ['history-1924-iodized-salt', 'pregnancy-iodine-needs', 'nutrient-iodine'],
  },
  {
    id: 'iodine-toxicity-acute-chronic',
    category: 'basicHealth',
    title: "Iodine's Own Safe Upper Range, and What Happens Past It",
    teaser: "Up to roughly 1mg/day is considered safe for most people, intake above about 1.1mg/day is where documented harm starts.",
    summary: "Iodine toxicity has specific numeric thresholds, not just a vague 'don't overdo it' caution. Up to roughly 1mg (1,000mcg) per day is considered safe for most people, a substantial margin above the standard 150mcg adult requirement, but documented harm can begin above roughly 1.1mg per day, a threshold reachable through concentrated sources like kelp and iodine supplements far more easily than through ordinary food, covered directly in the Problem Foods research on kelp specifically. Acute excess produces a staged progression: starting with mild GI symptoms (nausea, vomiting, diarrhea), and in more severe cases advancing to neurological symptoms (delirium, confusion, lethargy) and shock, though the clinical literature notes this progression is rarely fatal. Specific populations carry higher risk from excess: people with pre-existing thyroid disease (including Hashimoto's and Graves', both already covered in the condition-specific research), older adults, and fetuses/neonates. Documented downstream consequences of chronic excess span thyroiditis, both hypothyroidism and hyperthyroidism (a paradox: too much iodine can push the thyroid in either direction depending on the person), and an association with thyroid papillary cancer.",
    citations: [
      { source: 'Iodine Toxicity, StatPearls, National Library of Medicine', url: 'https://pubmed.ncbi.nlm.nih.gov/32809605/' },
    ],
    overallTier: 'strong',
    relatedIds: ['problem-excess-iodine-kelp', 'graves-iodine', 'nutrient-iodine-supplement-caution'],
  },
  {
    id: 'iodine-food-sources-real-data',
    category: 'basicHealth',
    title: "Iodine Food Sources, Pulled Directly From The Database",
    teaser: 'Seaweed dominates so completely (some varieties running into six figures per 100g) that this chart deliberately leaves kombu off, since it would flatten every other bar to nothing.',
    summary: "Iodine content pulled directly from the 22,022-food reference database, deliberately excluding kombu-family kelp (which can run into six-figure mcg-per-100g territory, already covered as its own caution in the Problem Foods research) since including it would flatten every other bar on this chart to invisibility. Among the foods most people would actually eat a serving of, nori (the seaweed used in sushi) still carries a substantial 2,200-2,775mcg per 100g. Haddock carries a 317mcg per 100g, and cod carries roughly 168-197mcg per 100g, both everyday seafood sources well above the standard 150mcg adult daily target in a single serving. This pattern, seafood and seaweed dominating the list, is exactly why iodized salt exists as a deliberate public-health product: most inland, non-seafood-heavy diets have no other reliably substantial iodine source at all.",
    citations: [],
    overallTier: 'strong',
    chart: {
      title: 'Iodine Content of Foods (per 100g)',
      unit: 'mcg',
      data: [
        { label: 'Nori (seaweed)', value: 2500 },
        { label: 'Haddock', value: 317 },
        { label: 'Cod', value: 180 },
      ],
      sourceNote: "This app's own reference database (USDA/Japan_MEXT-sourced values); kombu-family kelp omitted as a six-figure outlier already covered in Problem Foods & Swaps",
    },
  },
  {
    id: 'iodine-tying-together',
    category: 'basicHealth',
    title: 'What Actually Holds Up for Iodine, Pulled Together',
    teaser: "The Hashimoto's research already named iodine the rare nutrient that breaks the 'more is always fine' rule. This entry pulls the full universal biochemistry behind that claim into one place.",
    summary: "Line up everything in this category and iodine reads as an exception to how most nutrients work. It's required, step one, for the thyroid to make hormone at all, global deficiency remains a leading, preventable cause of fetal brain damage, and a historic public-health fix (iodized salt) already solved this at scale in the US a century ago. And yet, unlike almost every other nutrient covered in this category, more isn't simply better past a specific point: excess carries its own documented risks, from acute GI-then-neurological toxicity to a paradox where too much iodine can push a vulnerable thyroid toward either hypothyroidism or hyperthyroidism depending on the person. The condition-specific research already carries the sharpest, most practical version of this exact tension: Hashimoto's own iodine entry names it directly as a two-edged nutrient, Graves' disease has its own full iodine entry, pregnancy raises the stakes on both ends at once, and the kelp-specific caution names exactly where that risk shows up in an everyday food choice. This entry is the universal biochemistry underneath all of those, not a replacement for any of them.",
    citations: [
      { source: 'Diffuse Toxic Goiter, StatPearls, National Library of Medicine', url: 'https://pubmed.ncbi.nlm.nih.gov/32491782/' },
    ],
    overallTier: 'strong',
    relatedIds: ['nutrient-iodine', 'graves-iodine', 'pregnancy-iodine-needs', 'problem-excess-iodine-kelp'],
  },

  // -- Vitamin C, added 2026-08-08, the tenth deep-dive in this series.
  // No `supplement_forms` data existed for vitamin C (a real, genuine gap,
  // unlike every prior nutrient this session) -- every citation here came
  // fresh via the established WebFetch/StatPearls fallback. Deliberately
  // did not duplicate `gout-vitamin-c` (the existing gout-specific RCT
  // entry) or `interaction-vitaminc-iron` -- both cross-linked instead.
  {
    id: 'vitaminc-overview',
    category: 'basicHealth',
    title: 'Vitamin C: Required for Collagen, and the Body Cannot Make Its Own',
    teaser: "Unlike most mammals, humans lost the ability to synthesize vitamin C entirely, a specific genetic loss that makes dietary intake non-negotiable.",
    summary: "Vitamin C (ascorbic acid) is required as a cofactor for enzymes that build and stabilize collagen, the structural protein behind skin, blood vessel walls, tendons, and bone, which is the direct reason its classic deficiency disease (scurvy, covered below) shows up as bleeding gums and easy bruising: collagen synthesis fails without it. It's also a direct antioxidant, and required for normal immune cell function and iron absorption (already covered in the Nutrient Interactions research). The notable fact underlying all of this: humans, along with a handful of other species, lost a functional copy of the enzyme needed to synthesize vitamin C from glucose at some point in evolutionary history, meaning dietary intake isn't just recommended, it's an absolute biological requirement in a way most other nutrients covered in this category aren't quite as strict about.",
    citations: [
      { source: 'Vitamin C Deficiency, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK493187/' },
    ],
    overallTier: 'strong',
    relatedIds: ['body-adrenal-glands-structure-function'],
  },
  {
    id: 'vitaminc-deficiency-scurvy',
    category: 'basicHealth',
    title: "Scurvy Is a Modern, Underdiagnosed Condition, Not Just a Historical Sailors' Disease",
    teaser: "Prevalence data ranges from 7.1% in the US to 73.9% in northern India. Corkscrew-shaped body hair is a pathognomonic sign specific enough to point straight at the diagnosis.",
    summary:
      "Scurvy is still a modern condition, not a disease confined to history. Measured prevalence varies enormously by region and population, from 7.1% in the United States to as high as 73.9% in parts of northern India, concentrated in populations with food insecurity, limited access to produce, alcohol use disorder, smoking, or malabsorptive conditions. Symptoms progress in a stage: initial, nonspecific fatigue, malaise, and loss of appetite typically appear at 4-12 weeks of inadequate intake, followed by visible, more specific signs: bleeding gums, easy bruising, perifollicular hemorrhages, and corkscrew-shaped body hair, a pathognomonic finding specific enough on its own to point directly at the diagnosis. Left untreated, advanced disease progresses to joint swelling, bleeding into joints, bone fragility, and compromised immune function, with organ failure possible in severe, prolonged cases. Diagnostically, total body vitamin C stores below 350mg (versus a normal roughly 1,500mg) is when clinical signs start appearing, a useful way to think about scurvy as a depletion of an actual physical reserve, not just a low number on one blood draw.",
    citations: [
      { source: 'Vitamin C Deficiency, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK493187/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'vitaminc-toxicity-honest',
    category: 'basicHealth',
    title: 'Vitamin C Toxicity: A High Tolerance, With One Specific Risk for a Specific Group',
    teaser: 'The risk concentrates almost entirely in men with a prior history of kidney stones, not a general population-wide concern.',
    summary:
      "Vitamin C carries a high tolerance compared to most nutrients covered in this category, but it isn't a complete non-issue the way B12's own toxicity entry describes. At elevated doses, GI symptoms (diarrhea, nausea, abdominal cramps) are the most common consequence, generally self-limiting once the dose is reduced. The more specific, important risk: excessive vitamin C intake has been linked to kidney stone formation, specifically in men with a prior history of kidney stones or existing kidney conditions, through a documented mechanism, increased urinary oxalate excretion, since the body partly metabolizes excess vitamin C into oxalate. This is a targeted risk for a specific, identifiable group, not a reason for general population-wide caution. The clinical literature doesn't specify one universal numeric toxicity threshold, framing this instead as a dose-and-person-dependent risk rather than a fixed cutoff, worth a conversation with a doctor specifically for anyone with a personal or family kidney-stone history before taking high-dose vitamin C supplements.",
    citations: [
      { source: 'Vitamin C Deficiency, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK493187/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'vitaminc-absorption-dose-dependent',
    category: 'basicHealth',
    title: 'Vitamin C Absorption Changes Shape at High Doses, a Distinct Mechanism',
    teaser: 'Efficient at ordinary intake, absorption drops to 50% or less once a single dose climbs past 1,500mg, a practical reason mega-dosing is less efficient than it sounds.',
    summary: "Vitamin C absorption follows a different pattern from a simple 'more in, more absorbed' relationship. At ordinary dietary intake levels, up to around 100mg per day, absorption is real and efficient. Past that point, the fraction actually absorbed starts declining, and once a single dose climbs above roughly 1,500mg, absorption efficiency drops to 50% or less, meaning a large chunk of a mega-dose is never actually taken up by the body at all, simply passing through. This is a useful, practical fact for anyone taking high-dose vitamin C specifically to maximize absorbed amount: splitting a large daily total into smaller, more frequent doses absorbs measurably better than taking it all at once, the identical principle already covered in the calcium research for a completely different nutrient, worth recognizing as a recurring pattern across several of the nutrients in this category rather than a coincidence specific to any one of them.",
    citations: [
      { source: 'Vitamin C Deficiency, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK493187/' },
    ],
    overallTier: 'strong',
    relatedIds: ['calcium-absorption-mechanism'],
  },
  {
    id: 'vitaminc-food-sources-real-data',
    category: 'basicHealth',
    title: "Vitamin C Food Sources, Pulled Directly From The Database",
    teaser: 'Acerola cherries dwarf citrus fruit, everyday bell peppers and broccoli both carry more vitamin C than an orange.',
    summary: "Vitamin C content pulled directly from the 22,022-food reference database. Acerola cherries lead by an enormous margin at roughly 1,690mg per 100g, dwarfing every citrus fruit's own popular reputation as the top vitamin C source. Among more everyday foods, red bell pepper carries a meaningful 171mg per 100g, actually higher than an orange's own 145mg per 100g, a worth-knowing correction to citrus fruit's outsized reputation. Broccoli carries roughly 90-130mg per 100g, and strawberries carry 76-98mg per 100g, both substantial sources well above the standard adult RDA of 75-90mg daily in a single serving.",
    citations: [],
    overallTier: 'strong',
    chart: {
      title: 'Vitamin C Content of Foods (per 100g)',
      unit: 'mg',
      data: [
        { label: 'Acerola cherry', value: 1690 },
        { label: 'Red bell pepper', value: 171 },
        { label: 'Orange', value: 145 },
        { label: 'Broccoli', value: 110 },
        { label: 'Strawberry', value: 87 },
      ],
      sourceNote: "This app's own reference database (USDA/French_Ciqual-sourced values)",
    },
  },
  {
    id: 'vitaminc-tying-together',
    category: 'basicHealth',
    title: 'What Actually Holds Up for Vitamin C, Pulled Together',
    teaser: "A absolute dietary requirement (the body cannot make its own), a still-modern deficiency disease, and a dose-dependent absorption curve that makes mega-dosing less efficient than it sounds.",
    summary: "Line up everything in this category and vitamin C reads as a nutrient defined by a biological non-negotiable: unlike most mammals, humans cannot synthesize it at all, making dietary intake an absolute requirement, not just a recommendation. Deficiency (scurvy) is real and still modern, with prevalence varying enormously by measured population, and a distinctive staged symptom progression worth recognizing by its own specific signs, not assumed away as a disease of the past. Toxicity is real but narrow, concentrated almost entirely in kidney-stone risk for a specific, identifiable group, alongside a practically useful absorption quirk: efficiency drops sharply above roughly 1,500mg in one dose, the identical single-dose-ceiling pattern already seen in the calcium research. The gout-specific research already covers a RCT finding vitamin C measurably lowers uric acid, and its own iron-interaction research covers the well-established boost vitamin C gives non-heme iron absorption, both specific, practical applications built on top of the universal biochemistry covered here.",
    citations: [
      { source: 'Vitamin C Deficiency, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK493187/' },
    ],
    overallTier: 'strong',
    relatedIds: ['vitaminc-deficiency-scurvy', 'vitaminc-toxicity-honest', 'gout-vitamin-c', 'interaction-vitaminc-iron'],
  },

  // -- Vitamin A, added 2026-08-08, the eleventh deep-dive in this series.
  // No `supplement_forms` data existed for vitamin A -- every citation
  // here came fresh via the established WebFetch/StatPearls/PubMed
  // fallback. Deliberately did not duplicate `interaction-vitamina-zinc`
  // -- cross-linked instead. Real, genuinely different shape from most
  // nutrients in this category: the single most important real fact here
  // is the retinol-vs-carotenoid safety split, not a symmetric deficiency/
  // toxicity story.
  {
    id: 'vitamina-overview',
    category: 'basicHealth',
    title: 'Vitamin A: Two Chemically Different Sources With Two Different Safety Profiles',
    teaser: 'Preformed vitamin A (retinol, from animal foods) and provitamin A carotenoids (beta-carotene, from plants) are not interchangeable when it comes to toxicity risk.',
    summary:
      "Vitamin A is required for vision (specifically, forming rhodopsin, the light-sensing pigment in the retina), immune function, cell differentiation, and reproduction. The single most important fact to understand about vitamin A, more than almost any other nutrient in this category, is that it exists in two chemically distinct dietary forms with two different safety profiles. Preformed vitamin A (retinol and its esters), found in animal foods like liver, fish oil, and dairy, is efficiently absorbed and stored in the liver without tight regulation, meaning intake can accumulate to toxic levels, covered in specific detail in the toxicity entry below. Provitamin A carotenoids (beta-carotene and related compounds), found in orange and dark leafy plant foods, undergo a regulated conversion process with built-in feedback control, and rarely cause toxicity even at high intake. That distinction, not a single blanket 'vitamin A is dangerous in excess' rule, is the practical thing worth understanding before this category's own deficiency and toxicity entries make sense.",
    citations: [
      { source: 'Vitamin A Toxicity, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK532916/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'vitamina-deficiency-xerophthalmia',
    category: 'basicHealth',
    title: 'Vitamin A Deficiency: A Leading Cause of Preventable Childhood Blindness Worldwide',
    teaser: 'Night blindness is an early warning sign, not a coincidence. Left uncorrected, the same deficiency can progress to irreversible corneal damage.',
    summary:
      "Vitamin A deficiency remains a highly prevalent global health concern, concentrated mostly in young children in resource-limited regions, with substantial associated morbidity and mortality. Standard daily allowances: 700mcg for adult women, 900mcg for adult men, 300-900mcg for children depending on age, and notably higher targets of 770mcg during pregnancy and 1,300mcg while nursing. Diagnostically, serum retinol below 20mcg/dL indicates deficiency, with specific eye symptoms emerging once levels drop below 10mcg/dL. The staged eye condition (xerophthalmia) this deficiency causes progresses in a recognizable sequence: nyctalopia (night blindness) as an early warning sign, followed by Bitot spots (visible foamy patches on the eye's surface), conjunctival and corneal xerosis (drying), and in the most severe, cases, keratomalacia, corneal softening and breakdown that can cause permanent, irreversible blindness. This progression is exactly why xerophthalmia remains a leading cause of preventable childhood blindness worldwide, and why recognizing night blindness early matters enough to act on immediately rather than waiting to see if it resolves on its own.",
    citations: [
      { source: 'Vitamin A Deficiency, StatPearls, National Library of Medicine', url: 'https://pubmed.ncbi.nlm.nih.gov/33620821/' },
      { source: 'Xerophthalmia, StatPearls, National Library of Medicine', url: 'https://pubmed.ncbi.nlm.nih.gov/28613746/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'vitamina-toxicity-teratogenicity',
    category: 'basicHealth',
    title: 'Vitamin A Toxicity Has Specific Numeric Thresholds, and a No-Safe-Level Warning During Pregnancy',
    teaser: 'Adverse fetal effects have been documented at doses as low as 25,000 IU daily, the same number that also marks the start of chronic toxicity in a non-pregnant adult.',
    summary:
      "Preformed vitamin A (retinol, not carotenoids, see the overview entry above) carries specific, dangerous toxicity thresholds. Acute toxicity: above roughly 2 million IU in an adult, or 350,000 IU in an infant, a single massive dose. Chronic toxicity: sustained intake of 25,000-50,000 IU per day over months, though susceptible individuals can be affected at lower doses still. The single most important warning in this entire entry: adverse fetal outcomes have been documented at doses as low as 25,000mcg (IU) daily during pregnancy, with the first trimester (during organogenesis) carrying the highest risk, and the clinical literature states directly that there is no established safe threshold for oral retinoid exposure during pregnancy. Chronic excess also causes liver damage, ranging from biochemical abnormalities to fibrosis and cirrhosis, tracking with cumulative lifetime exposure. This is the direct, practical reason liver and cod liver oil, both excellent vitamin A sources otherwise, carry standing pregnancy-specific caution, and why a prenatal vitamin's own vitamin A content is worth checking specifically for its source (retinol vs. Beta-carotene) rather than assumed safe by default.",
    citations: [
      { source: 'Vitamin A Toxicity, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK532916/' },
    ],
    overallTier: 'strong',
    relatedIds: ['pregnancy-tying-together'],
  },
  {
    id: 'vitamina-food-sources-real-data',
    category: 'basicHealth',
    title: "Vitamin A Food Sources, Pulled Directly From The Database",
    teaser: 'Liver and cod liver oil dominate so completely (some rows exceeding 20,000-30,000mcg per 100g) that a single serving can approach the acute toxicity threshold covered above.',
    summary: "Vitamin A content pulled directly from the 22,022-food reference database, split deliberately by source type given the retinol-vs-carotenoid safety distinction covered in the overview entry above. Cod liver oil and organ meats (veal, lamb, pork, chicken, and beef liver) all carry an enormous preformed-retinol content, commonly 10,000-30,000mcg per 100g, numbers concentrated enough that a large serving can meaningfully approach the acute/chronic toxicity thresholds covered above, the direct reason liver carries standing pregnancy-specific caution despite being nutrient-dense otherwise. Carrots, a classic provitamin A carotenoid source, carry roughly 950-1,575mcg per 100g, and sweet potato carries roughly 960-1,043mcg per 100g, both safer sources given carotenoids' own regulated, self-limiting conversion process.",
    citations: [],
    overallTier: 'strong',
    chart: {
      title: 'Vitamin A Content of Foods (per 100g)',
      unit: 'mcg',
      data: [
        { label: 'Cod liver oil', value: 30000 },
        { label: 'Beef/lamb/chicken liver (avg.)', value: 15000 },
        { label: 'Carrot', value: 1100 },
        { label: 'Sweet potato', value: 1000 },
      ],
      sourceNote: "This app's own reference database (USDA/Germany_BLS-sourced values)",
    },
  },
  {
    id: 'vitamina-tying-together',
    category: 'basicHealth',
    title: 'What Actually Holds Up for Vitamin A, Pulled Together',
    teaser: "The single most useful fact in this whole category: whether it's retinol or a carotenoid changes the entire risk picture, not just a technical footnote.",
    summary: "Line up everything in this category and vitamin A reads as a nutrient where the single most important lesson isn't 'how much,' it's 'which form.' Preformed retinol, from liver and fish oil, is efficiently absorbed and stored without tight regulation, making toxicity possible at concentrated doses, with a specific, no-safe-level warning during pregnancy that deserves to be taken seriously rather than treated as excessive caution. Provitamin A carotenoids, from carrots and sweet potatoes, undergo a self-limiting conversion process and rarely cause toxicity even at high intake. Deficiency, meanwhile, is real and severe at the other end, a leading, preventable cause of childhood blindness worldwide, with a staged, recognizable eye-symptom progression. The zinc research already covers a separate mechanistic link, zinc is required to actually convert and transport vitamin A itself, worth reading alongside this entry rather than as an unrelated topic.",
    citations: [
      { source: 'Vitamin A Toxicity, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK532916/' },
    ],
    overallTier: 'strong',
    relatedIds: ['vitamina-deficiency-xerophthalmia', 'vitamina-toxicity-teratogenicity', 'interaction-vitamina-zinc'],
  },

  // -- Vitamin E, added 2026-08-08, the twelfth deep-dive in this series,
  // direct continuation: "Continue with vitamin E next, and the rest
  // automatically afterwards." No `supplement_forms` data existed for
  // vitamin E -- every citation here came fresh via the established
  // WebFetch/StatPearls/PubMed fallback. A real, worth-remembering find:
  // this app's own bundled reference database already carries a real
  // vitamin K2/warfarin interaction rule (`vitamin_k2_warfarin_consistency`
  // in the `interaction_rules` table) -- vitamin E's own real bleeding-risk
  // mechanism works through the SAME warfarin/vitamin-K pathway, from the
  // opposite direction, a real, direct connection worth naming here and
  // revisiting once Vitamin K gets its own deep-dive.
  {
    id: 'vitamine-overview',
    category: 'basicHealth',
    title: "Vitamin E: the Body's Own Lipid-Membrane Bodyguard",
    teaser: 'A fat-soluble antioxidant whose whole job is protecting the fatty membrane around every cell from oxidative damage, obtained exclusively from diet.',
    summary: "Vitamin E is a major lipid-soluble antioxidant, obtained exclusively from the diet, meaning the body has no way to synthesize it on its own the same way it can't synthesize vitamin C either. Its core job is protecting cell membranes, which are built largely from fat, from oxidative damage caused by free radicals, the same oxidation-risk mechanism already covered elsewhere in the food-scoring research. Vitamin E actually exists as eight chemically related compounds (four tocopherols, four tocotrienols), with alpha-tocopherol being the specific form the body preferentially retains and the one measured on a standard blood test. Because it's fat-soluble, absorption depends on dietary fat being present and on the same basic fat-digestion machinery (bile, pancreatic enzymes) already covered in the vitamin A and vitamin K research, which is exactly why vitamin E deficiency, covered below, traces almost entirely to fat-malabsorption problems rather than simply not eating enough of it.",
    citations: [
      { source: 'Vitamin E Toxicity, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK564373/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'vitamine-deficiency-real-causes',
    category: 'basicHealth',
    title: 'Vitamin E Deficiency Is Rare From Diet Alone, Malabsorption Is Almost Always the Actual Cause',
    teaser: 'Ataxia is the single most common exam finding, a staged neurological progression, not just a vague sense of low energy.',
    summary: "In developed countries, vitamin E deficiency from diet alone is rare. The actual causes almost always trace to a fat-malabsorption problem, since vitamin E can't be absorbed without functioning fat digestion. Specific causes: cystic fibrosis (a failure to secrete the pancreatic enzymes needed to absorb vitamins A, D, E, and K together), cholestatic liver disease (reduced bile flow), Crohn's disease and pancreatic insufficiency (both already covered elsewhere in the condition-specific research), abetalipoproteinemia (an inherited disorder of lipoprotein production and transport, where serum vitamin E can be entirely undetectable), short-bowel syndrome, and mutations in the tocopherol transfer protein gene, which directly impair how the body handles the vitamin once absorbed. Symptoms progress in a staged neurological sequence: early, hyporeflexia (reduced reflexes), decreased night vision, and reduced vibratory sense, with cognition still intact; moderate, limb and truncal ataxia (the single most common exam finding across every stage), muscle weakness, and limited upward gaze; late, cardiac arrhythmias, blindness, and reduced cognition. Diagnostically, adult alpha-tocopherol below 5 mcg/mL indicates deficiency, though in someone with hyperlipidemia, a more accurate ratio (alpha-tocopherol to total blood lipids, below 0.8 mg/g) is used instead, since high blood lipids can otherwise mask a deficiency on the raw number alone.",
    citations: [
      { source: 'Vitamin E Deficiency, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK519051/' },
    ],
    overallTier: 'strong',
    relatedIds: ['celiac-overview', 'ibd-overview'],
  },
  {
    id: 'vitamine-toxicity-bleeding-risk',
    category: 'basicHealth',
    title: "Vitamin E's Own Toxicity Story: a Documented Bleeding Risk, Through Three Separate Mechanisms",
    teaser: 'Drug interactions have been reported at doses as low as 300mg/day, well below the roughly 1,000mg/day threshold where symptoms typically start on their own.',
    summary: "Vitamin E's own toxicity picture is different from the other fat-soluble vitamins covered in this category: the central risk isn't organ damage, it's bleeding. The standard adult RDA is 15mg/day, and symptoms of toxicity generally don't appear until daily intake exceeds roughly 1,000mg, a substantial margin. The more clinically important number: documented drug-drug interactions have been reported at doses above just 300mg/day, well below the symptom threshold, meaning a risk can exist long before anyone would notice anything wrong on their own. The mechanism runs through three separate, documented pathways: vitamin E competes with vitamin K for the same enzymes needed to activate vitamin-K-dependent clotting factors (II, VII, IX, and X), directly reducing their circulation; it also reduces glutamate production, itself needed for clotting factor IX; and separately, vitamin E supplementation has been found to measurably decrease platelet aggregation, possibly through inhibiting protein kinase C. The practical consequence: in anyone taking warfarin, vitamin E's own vitamin-K antagonism compounds directly with warfarin's own mechanism, increasing bleeding risk, and vitamin K supplementation is a direct treatment consideration for anyone on vitamin E who develops active bleeding. Alongside the separate vitamin K2/warfarin research: two different vitamins, interacting with the exact same medication through two different mechanisms.",
    citations: [
      { source: 'Vitamin E Toxicity, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK564373/' },
      { source: 'Pastori D, et al. 2013: Vitamin E serum levels and bleeding risk in patients receiving oral anticoagulant therapy, PMID 23364620', url: 'https://pubmed.ncbi.nlm.nih.gov/23364620/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'vitamine-food-sources-real-data',
    category: 'basicHealth',
    title: "Vitamin E Food Sources, Pulled Directly From The Database",
    teaser: 'Almonds and sunflower seeds both lead everyday food lists, the same nuts-and-seeds family already covered for magnesium, zinc, and several other nutrients in this category.',
    summary: "Vitamin E content pulled directly from the 22,022-food reference database. Almonds carry a substantial 30.3mg per 100g (a toasted, unblanched preparation runs even higher, around 50mg per 100g). Sunflower seeds carry a similarly high 36-41mg per 100g depending on preparation. Almond oil carries roughly 39mg per 100g, a concentrated source for anyone cooking with it regularly. Spinach carries a more modest but still meaningful 3.5-4.8mg per 100g. Nuts and seeds show up as a recurring top source across several nutrients already covered in this category (magnesium, zinc, and now vitamin E), a practical reason a small daily handful covers ground across more than one nutrient at once.",
    citations: [],
    overallTier: 'strong',
    chart: {
      title: 'Vitamin E Content of Foods (per 100g)',
      unit: 'mg',
      data: [
        { label: 'Almonds (toasted)', value: 50.3 },
        { label: 'Sunflower seeds', value: 38 },
        { label: 'Almond oil', value: 39 },
        { label: 'Almonds (plain)', value: 30.3 },
        { label: 'Spinach', value: 4.4 },
      ],
      sourceNote: "This app's own reference database (USDA-sourced values)",
    },
  },
  {
    id: 'vitamine-tying-together',
    category: 'basicHealth',
    title: 'What Actually Holds Up for Vitamin E, Pulled Together',
    teaser: "A exclusively-dietary antioxidant whose deficiency almost always means an absorption problem, not a diet problem, and whose toxicity risk is bleeding, not organ damage.",
    summary: "Line up everything in this category and vitamin E reads as a nutrient whose story runs almost entirely through fat absorption, on both ends. Deficiency is rare from diet alone in the developed world; when it does happen, it's almost always an identifiable malabsorption condition (cystic fibrosis, cholestatic liver disease, Crohn's, abetalipoproteinemia, short-bowel syndrome) rather than simple dietary insufficiency, producing a staged neurological progression worth recognizing by its own specific signs (ataxia as the single most common finding). Toxicity, on the other end, is different in kind from most other nutrients covered in this category: not organ damage, but a three-mechanism bleeding risk that compounds directly and dangerously with warfarin, at drug-interaction doses (300mg+) well below where symptoms would otherwise appear on their own (roughly 1,000mg+). The vitamin K2 research covers a parallel warfarin interaction from the opposite direction, together two separate reasons anyone on blood thinners needs medical guidance before starting either supplement, not an assumption that a fat-soluble vitamin is automatically safe just because it's 'natural.'",
    citations: [
      { source: 'Vitamin E Toxicity, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK564373/' },
    ],
    overallTier: 'strong',
    relatedIds: ['vitamine-deficiency-real-causes', 'vitamine-toxicity-bleeding-risk'],
  },

  // -- Vitamin K, added 2026-08-08, the thirteenth deep-dive in this
  // series. `supplement_forms`/`nutrient_timing` already carried real,
  // rich, already-cited data from the My Meds work (K1 vs. MK-4 vs. MK-7,
  // the real Japanese osteoporosis-trial dose, the dose-consistency-not-
  // timing-separation warfarin framing already backing a real interaction
  // rule in the reference database). This entry set is scoped around the
  // real remaining gap: the K1/K2 functional split, real newborn VKDB risk
  // (the actual reason the standard newborn vitamin K shot exists), and a
  // real food-sources chart.
  {
    id: 'vitamink-overview',
    category: 'basicHealth',
    title: "Vitamin K: One Name, Two Forms With Two Different Jobs",
    teaser: "K1 (from leafy greens) does most of the work in the liver, making clotting factors. K2 (from fermented and animal foods) does most of the work everywhere else, directing calcium to bone rather than soft tissue.",
    summary: "Vitamin K's central biochemical job is activating a specific set of proteins through a process called carboxylation, converting them into their functional, calcium-binding form. The practical split: vitamin K1 (phylloquinone, the plant form) is used almost entirely by the liver to activate clotting factors (II, VII, IX, X), while vitamin K2 (menaquinone, the form in fermented foods and animal products) reaches tissues throughout the rest of the body and activates a different set of calcium-directing proteins, most notably osteocalcin (bone) and matrix Gla protein (soft tissue, including blood vessel walls). That functional split is exactly why the Nutrient Interactions research already covers vitamin D, K2, and magnesium as an interdependent trio for bone health specifically, not vitamin K in general: it's the K2 form doing that particular job, distinct from K1's own liver-focused clotting role.",
    citations: [
      { source: 'Vitamin K Deficiency in Neonates and Adults, StatPearls, National Library of Medicine', url: 'https://pubmed.ncbi.nlm.nih.gov/30725668/' },
    ],
    overallTier: 'strong',
    relatedIds: ['interaction-vitamind-k2-magnesium'],
  },
  {
    id: 'vitamink-deficiency-newborn-risk',
    category: 'basicHealth',
    title: "The Reason Newborns Routinely Get a Vitamin K Shot, and a Rising Risk",
    teaser: 'Newborns start life with low vitamin K stores and get almost none from breast milk alone, a well-understood, staged risk, not an overcautious hospital routine.',
    summary:
      "Newborns face a physiological vitamin K risk, not an acquired deficiency the way most adult cases are: they're born with low vitamin K stores, and early intake (particularly from breast milk alone) is limited. This risk is staged into three named, timed presentations of vitamin K deficiency bleeding (VKDB): early VKDB, within 24 hours of birth; classic VKDB, during the first week of life; and late VKDB, between 1 week and 6 months, with a peak incidence at 2-8 weeks. Consequences range from subtle lab abnormalities to life-threatening hemorrhage, which is the direct reason a single prophylactic vitamin K injection is standard newborn care in most of the developed world. A worth-knowing, current finding: VKDB incidence has been rising, attributed directly to parental refusal of the prophylactic shot and to oral vitamin K alternatives being less effective than the injectable form. In adults, deficiency causes are different in kind: inadequate dietary intake, fat malabsorption, liver disease, and medications that interfere with vitamin K metabolism, most notably warfarin itself, which works specifically by blocking vitamin K's own recycling pathway. Standard adult intake targets: 120mcg/day for men, 90mcg/day for women.",
    citations: [
      { source: 'Vitamin K Deficiency in Neonates and Adults, StatPearls, National Library of Medicine', url: 'https://pubmed.ncbi.nlm.nih.gov/30725668/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'vitamink-toxicity-honest',
    category: 'basicHealth',
    title: 'Vitamin K Toxicity: Another Honest Non-Issue for Natural Forms, With One Important Exception',
    teaser: "Unlike vitamin A, D, or E, natural vitamin K carries no established upper intake limit, but the one exception, warfarin, is worth taking every bit as seriously as it sounds.",
    summary: "Natural vitamin K (both K1 and K2, from food or standard supplements) has no established tolerable upper intake level, and no documented toxicity syndrome the way vitamin A, D, or E each carry their own specific one covered elsewhere in this category. The important exception isn't a dose-toxicity relationship at all, it's a direct medication interaction: warfarin and other vitamin-K-dependent anticoagulants work specifically by blocking the vitamin K recycling pathway, so vitamin K intake and warfarin dosing are directly, mechanically linked. The reference data frames the practical fix precisely: it's not a timing-separation issue the way calcium/iron and levothyroxine are, it's a dose-CONSISTENCY issue, since the danger is a sudden CHANGE in vitamin K intake (starting, stopping, or changing a supplement), not steady daily use at a known amount a warfarin dose has already been calibrated against. Alongside the vitamin E research: two different vitamins, interacting with the exact same medication, through opposite mechanisms (vitamin E antagonizes clotting, vitamin K supports it), both serious reasons anyone on warfarin needs their prescriber directly involved before changing either one.",
    citations: [
      { source: 'Schurgers LJ, et al. 2007: Vitamin K-containing dietary supplements: comparison of synthetic vitamin K1 and natto-derived menaquinone-7, Blood, PMID 17158229', url: 'https://pubmed.ncbi.nlm.nih.gov/17158229/' },
    ],
    overallTier: 'strong',
    relatedIds: ['vitamine-toxicity-bleeding-risk'],
  },
  {
    id: 'vitamink-supplement-forms-compared',
    category: 'basicHealth',
    title: 'K1 vs. MK-4 vs. MK-7: Three Forms, Three Different Half-Lives',
    teaser: "MK-7's own much longer half-life is exactly why it's the form most bone/cardiovascular-focused K2 supplements actually use, even though MK-4 has its own separate, high-dose trial evidence.",
    summary: "The reference data (built during earlier medication and supplement-tracking work) already carries a specific comparison across vitamin K's three most relevant forms. Vitamin K1 (phylloquinone), the primary dietary form from leafy greens, has the shortest half-life of the three, clearing from blood fastest, and is the standard form used in most large population studies of vitamin K intake. Vitamin K2 as MK-4 is structurally closer to K1, with a much shorter half-life than MK-7, meaning it needs more frequent dosing to maintain stable levels, though it carries its own established bone-health evidence, typically studied at much higher doses (often 45mg/day in Japanese osteoporosis trials) than MK-7 ever uses. Vitamin K2 as MK-7 has a substantially longer half-life than either, producing much more stable blood levels and 7-8x higher accumulation over sustained daily use, practical reasons it's the form most K2 supplements actually marketed for bone and cardiovascular health contain today. All three are generally well tolerated, and all three need dietary fat present in the same meal to absorb well, the identical fat-solubility requirement already covered in the vitamin A, D, and E research.",
    citations: [
      { source: 'Schurgers LJ, et al. 2007: Vitamin K-containing dietary supplements: comparison of synthetic vitamin K1 and natto-derived menaquinone-7, Blood, PMID 17158229', url: 'https://pubmed.ncbi.nlm.nih.gov/17158229/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'vitamink-food-sources-real-data',
    category: 'basicHealth',
    title: "Vitamin K Food Sources, Pulled Directly From The Database",
    teaser: "Kale and parsley both dominate the K1 side of this list. Natto, a specifically fermented soybean product, is the outlier that actually delivers the K2 form instead.",
    summary: "Vitamin K content pulled directly from the 22,022-food reference database, split by form since K1 and K2 come from different food categories. Kale carries a substantial 1,174-1,890mcg per 100g (K1), and parsley carries a similarly high 1,360-1,640mcg per 100g (K1), both classic leafy-green sources. Spinach carries a 540-716mcg per 100g (K1). Natto, a specifically fermented soybean product (the same fermentation family already covered in the Fermented Foods research), stands apart as a K2 source, carrying up to a 930mcg per 100g of the menaquinone form specifically, the practical reason it's so often named as the single best whole-food K2 source in nutrition research, distinct from every other food on this list.",
    citations: [],
    overallTier: 'strong',
    chart: {
      title: 'Vitamin K Content of Foods (per 100g)',
      unit: 'mcg',
      data: [
        { label: 'Kale', value: 1500 },
        { label: 'Parsley', value: 1500 },
        { label: 'Natto (K2 form)', value: 930 },
        { label: 'Spinach', value: 600 },
      ],
      sourceNote: "This app's own reference database (USDA/Japan_MEXT/Germany_BLS-sourced values)",
    },
  },
  {
    id: 'vitamink-tying-together',
    category: 'basicHealth',
    title: 'What Actually Holds Up for Vitamin K, Pulled Together',
    teaser: "A physiological risk at the very start of life, a functional split between its own two forms most people never realize exists, and an honest non-issue for everyone else except one specific, serious medication interaction.",
    summary: "Line up everything in this category and vitamin K reads as a nutrient defined by a split most people never learn: K1 mostly runs the liver's own clotting-factor system, K2 mostly runs a separate, calcium-placement system throughout the rest of the body, and confusing the two (or assuming a leafy-green-heavy diet automatically covers K2 too) misses a practical distinction. Deficiency is a physiological risk specifically at the very start of life, the actual reason the standard newborn vitamin K shot exists, with a current rise in risk tied to parents declining it. For essentially everyone else, natural vitamin K carries a non-issue toxicity profile, no established upper limit, no documented toxicity syndrome, with the one serious exception being warfarin and other vitamin-K-dependent anticoagulants, where consistency, not restriction, is the practical goal. The vitamin D/K2/magnesium research and vitamin E's own bleeding-risk research both build directly on the same biochemistry covered here, three connected nutrients, not three separate, unrelated ones.",
    citations: [
      { source: 'Vitamin K Deficiency in Neonates and Adults, StatPearls, National Library of Medicine', url: 'https://pubmed.ncbi.nlm.nih.gov/30725668/' },
    ],
    overallTier: 'strong',
    relatedIds: ['vitamink-deficiency-newborn-risk', 'vitamink-toxicity-honest', 'interaction-vitamind-k2-magnesium', 'vitamine-tying-together'],
  },

  // -- Omega-3 & Omega-6 Fatty Acids, added 2026-08-08, the fourteenth
  // deep-dive in this series. A genuinely different research situation
  // from every prior nutrient: this app's own reference database tracks
  // only aggregate fat categories (saturated/monounsaturated/polyunsaturated
  // /total), not EPA/DHA/ALA/omega-6 specifically, so no real, DB-verified
  // food-sources chart is possible here -- deliberately not built rather
  // than faked, consistent with this whole Digest's own standing rule
  // against inventing chart data. Also a genuinely different CROSS-LINK
  // situation: 5 real, already-built condition-specific omega-3 entries
  // exist (RA strong, Sjögren's positive, Psoriasis/Lupus mixed, CVD
  // honest null) plus a real food-swap entry on the omega-6:omega-3 ratio
  // (`problem-refined-vegetable-oils`) -- this pass fills the universal
  // biochemistry underneath all of them, cross-linking rather than
  // repeating any of it.
  {
    id: 'omega36-overview',
    category: 'basicHealth',
    title: "Omega-3 and Omega-6: Two Families of Fat the Body Cannot Make on Its Own",
    teaser: "Both are essential fats, the same 'the body cannot synthesize this' status already covered for vitamin C and vitamin E, just applied to fat instead of a vitamin.",
    summary:
      "Omega-3 and omega-6 fatty acids are both essential polyunsaturated fats: the body lacks the enzymes needed to build either one from scratch, meaning both must come from diet, the identical 'cannot synthesize it' status already covered for vitamin C. Each family includes several distinct fats, not one interchangeable category. Omega-3 includes ALA (alpha-linolenic acid, the plant form, found in flaxseed and walnuts), EPA, and DHA (the two longer-chain, more biologically active forms, found preformed in fatty fish). Omega-6 includes linoleic acid, the dominant form in most common vegetable and seed oils. Both families get converted, once eaten, into biologically active signaling molecules that regulate inflammation, though in opposite directions, covered in the ratio entry below.",
    citations: [
      { source: 'Essential Fatty Acids, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK564314/' },
    ],
    overallTier: 'strong',
    relatedIds: ['dietfat-overview'],
  },
  {
    id: 'omega3-ala-conversion-bottleneck',
    category: 'basicHealth',
    title: "ALA-to-DHA Conversion Is Real, and Inefficient: Under 5% in the Whole Body",
    teaser: "A classic, widely-cited review found whole-body conversion of ALA to DHA runs below 5% in humans, the direct, practical reason plant-only omega-3 sources don't reliably substitute for fish.",
    summary: "Plant-based ALA (flaxseed, walnuts, chia) can be converted inside the body into EPA and DHA, the two longer-chain omega-3 forms most directly tied to measured health effects elsewhere in the research. The practical problem: that conversion is inefficient. A classic, widely-cited review found whole-body conversion of ALA to DHA runs below 5% in humans, and the same research notes wide individual variability in this conversion capacity, partly influenced by how much omega-6 and other long-chain fat is already in someone's own diet. This is the direct, practical reason someone relying entirely on flaxseed or walnuts for omega-3, rather than also eating fatty fish or taking an EPA/DHA-specific supplement, may fall short of the levels the more positive research elsewhere (Rheumatoid Arthritis, Sjögren's) actually tested, even while eating what looks like a generous amount of plant-based omega-3 on paper.",
    citations: [
      { source: 'Brenna JT 2002: Efficiency of conversion of alpha-linolenic acid to long chain n-3 fatty acids in man, PMID 11844977', url: 'https://pubmed.ncbi.nlm.nih.gov/11844977/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'omega63-ratio-mechanism',
    category: 'basicHealth',
    title: "The Omega-6:Omega-3 Ratio Is Biochemistry, Not a Wellness-Industry Talking Point",
    teaser: "Omega-6 fats are the literal raw material for the body's own pro-inflammatory signaling molecules. Omega-3s are the raw material for the anti-inflammatory ones. It's the balance between the two that the research tracks, not omega-6 treated as simply 'bad.'",
    summary: "The Problem Foods research already covers the practical, food-swap side of this ratio directly (refined vegetable and seed oils, and the historical drift from roughly an even 1:1 omega-6-to-omega-3 ratio to often 15:1 or higher in a modern diet). This entry covers the biochemical mechanism underneath that food-level advice: omega-6 fatty acids are the literal biochemical raw material the body uses to build its own pro-inflammatory signaling molecules (a class called eicosanoids), while omega-3s are the raw material for a separate set of anti-inflammatory and inflammation-resolving compounds. Because both families are processed by overlapping conversion machinery inside the body, research on this topic consistently tracks the RATIO between the two, not omega-6 intake in isolation, the same point the food-swap entry already makes about not treating omega-6 as simply 'bad.' A lower-omega-6, higher-omega-3 dietary pattern is the practical target this mechanism points toward, not omega-6 elimination.",
    citations: [
      { source: 'Simopoulos AP 2002: The importance of the ratio of omega-6/omega-3 essential fatty acids, Biomedicine & Pharmacotherapy', url: 'https://doi.org/10.1016/S0753-3322(02)00253-6' },
    ],
    overallTier: 'strong',
    relatedIds: ['problem-refined-vegetable-oils'],
  },
  {
    id: 'omega3-toxicity-bleeding',
    category: 'basicHealth',
    title: 'Omega-3 at High Doses: an Honestly Mild Version of the Same Bleeding-Risk Story as Vitamin E and K',
    teaser: 'Clinical trials found high-dose omega-3 does measurably prolong bleeding time, but the same trials found it did not exceed normal limits or cause clinically significant bleeding.',
    summary: "Omega-3 fatty acids carry a milder version of the same bleeding-risk theme already covered in the vitamin E and vitamin K research. The FDA's own guidance sets a combined EPA+DHA upper limit of 3g per day, with no more than 2g of that coming from supplements specifically. Clinical trials with omega-3 supplementation did find measurably prolonged bleeding time, the physiological reason this caution exists at all, but the same trials found that prolongation did not exceed normal limits or produce clinically significant bleeding episodes, a more reassuring finding than the headline 'omega-3 thins blood' claim usually implies on its own. Standard clinical guidance still recommends periodic monitoring for anyone combining high-dose omega-3 with an actual anticoagulant or antiplatelet medication, the same sensible caution already covered for vitamin E and warfarin, just a milder, less mechanistically direct version of it here. Very high intake has also been separately associated with theoretical immune-function changes from shifting the body's own inflammatory balance too far, though the condition-specific research (RA, Sjögren's) found measured benefit at the doses those actual trials used, well within this same safe range.",
    citations: [
      { source: 'Essential Fatty Acids, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK564314/' },
    ],
    overallTier: 'strong',
    relatedIds: ['vitamine-toxicity-bleeding-risk', 'vitamink-toxicity-honest'],
  },
  {
    id: 'omega3-food-sources-real',
    category: 'basicHealth',
    title: 'Omega-3 Food Sources: Fatty Fish for EPA/DHA Directly, Plants for ALA',
    teaser: "The reference database tracks total/saturated/monounsaturated/polyunsaturated fat, not omega-3 specifically, so this entry stays qualitative rather than force a number the data doesn't actually support.",
    summary: "Unlike every other nutrient covered in this category, the 22,022-food reference database doesn't track omega-3 or omega-6 as their own separate values, only aggregate fat categories, so this entry deliberately doesn't include a numeric chart the way the rest of this series does, rather than presenting an invented or borrowed number as if it came from the verified data. The well-established food categories: fatty, cold-water fish (salmon, sardines, mackerel, herring) are the direct source of preformed EPA and DHA, the two forms most directly tied to the measured benefits covered in the condition-specific research. Walnuts, flaxseed, and chia seeds are ALA sources, useful and worth eating, but subject to the inefficient conversion bottleneck covered in the entry above, meaning they're a complement to, not a full substitute for, direct EPA/DHA intake for anyone specifically trying to reach the levels the RA or Sjögren's research covers.",
    citations: [],
    overallTier: 'strong',
  },
  {
    id: 'omega36-tying-together',
    category: 'basicHealth',
    title: 'What Actually Holds Up for Omega-3 & Omega-6, Pulled Together',
    teaser: "The clearest example in the of the same nutrient landing in different evidence tiers depending on the condition, already built out across five separate entries.",
    summary: "Line up everything in this category and omega-3/omega-6 read as an essential, universally-needed fat family whose actual real-world evidence depends on which condition and which outcome someone is asking about, more than almost any other nutrient. The condition-specific research already demonstrates that directly: Rheumatoid Arthritis's own omega-3 evidence is real and strong (a quantified reduction in NSAID use at a specific dosing threshold), Sjögren's own research found a positive, double-blind trial improving both dry eye AND dry mouth in the same study, while Psoriasis and Lupus both carry honestly mixed evidence, and Cardiovascular Disease's own research covers a large, rigorous trial finding an honest null result for primary prevention. That's not a contradiction. It's the standing discipline (report a finding exactly as directly whether it's positive or null) applied consistently to the same nutrient across five different conditions, worth reading as one deliberate set rather than five separate, unrelated facts. Underneath all five sits the same universal biochemistry covered here: an inefficient plant-to-fish conversion pathway, a ratio-based inflammatory mechanism, and an honestly mild bleeding-risk profile shared in kind, if not in degree, with vitamin E and vitamin K.",
    citations: [
      { source: 'Essential Fatty Acids, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK564314/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ra-omega3', 'sjogrens-omega3-dry-eye-mouth', 'psoriasis-omega3-mixed', 'lupus-omega3-fish-oil', 'cvd-omega3-honest-null', 'omega63-ratio-mechanism', 'omega3-ala-conversion-bottleneck'],
  },

  // -- Protein & Essential Amino Acids, added 2026-08-08, the fifteenth
  // and final deep-dive of this particular pass, closing out all four
  // nutrients originally named ("vitamin E next, and the rest
  // automatically afterwards"). This app's own reference database tracks
  // total protein only (no per-amino-acid breakdown), the same real
  // limitation already hit for omega-3/6 -- real food-source data still
  // possible here (protein itself IS tracked), unlike the omega entry.
  // Deliberately did not duplicate `ckd-protein-restriction-plant-based`
  // -- cross-linked instead, since CKD is the one real condition in this
  // whole app where LOWER protein is the actual target, a genuine, worth-
  // naming contrast to almost everything else in this entry.
  {
    id: 'protein-overview',
    category: 'basicHealth',
    title: "Protein: 9 Amino Acids the Body Cannot Build, Out of 20 Total",
    teaser: 'Histidine, isoleucine, leucine, lysine, methionine, phenylalanine, threonine, tryptophan, and valine, the named list, and the actual reason "complete protein" is a meaningful distinction, not marketing language.',
    summary:
      "Protein is built from 20 amino acids, and the body can synthesize 11 of them on its own. The other 9, histidine, isoleucine, leucine, lysine, methionine, phenylalanine, threonine, tryptophan, and valine, are essential amino acids the body cannot make, meaning diet is the only source, the same 'cannot synthesize it' status already covered for vitamin C, vitamin E, and the omega-3/6 fatty acids elsewhere in this category. That's exactly what makes 'complete protein' a meaningful, checkable distinction rather than marketing language: animal-based foods (eggs, dairy, meat, seafood) and, among plants, soy specifically, provide all 9 essential amino acids in adequate amounts on their own. Most other individual plant foods are incomplete on their own, each missing or running low on one or more essential aminos, though classic food pairings (rice and beans, hummus and pita) combine two incomplete sources into a complete amino-acid profile across the whole meal, not requiring both at the exact same bite the way older nutrition advice sometimes implied.",
    citations: [
      { source: 'Biochemistry, Essential Amino Acids, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK557845/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'protein-deficiency-kwashiorkor-marasmus',
    category: 'basicHealth',
    title: 'Marasmus vs. Kwashiorkor: Two Different Diseases, Not Two Names for the Same Thing',
    teaser: "Kwashiorkor's defining sign is body-wide swelling with little visible wasting, the opposite of what most people picture when they think of severe malnutrition.",
    summary:
      "Severe protein-energy malnutrition splits into two distinct conditions, still affecting millions of children worldwide, not a single generic 'malnutrition' picture. Marasmus results from an overall calorie deficiency (not protein specifically), producing the classic severe wasting most people actually picture: visible loss of fat and muscle mass, diagnosed by a specific threshold (weight-for-height more than 3 standard deviations below the mean, or a mid-upper arm circumference of 115mm or less in children 6-59 months). Kwashiorkor is a different condition, caused specifically by severe dietary protein deficiency despite adequate or near-adequate total calorie intake, and its own defining sign is the opposite of what marasmus produces: bilateral body-wide edema (swelling), often with minimal or no visible wasting at all, a counterintuitive presentation that can look less severe than it actually is. A mixed form (marasmic-kwashiorkor) combines features of both. Both conditions involve concurrent deficiencies in iron, zinc, vitamin A, and iodine, all already covered elsewhere in this category, compounding growth impairment, cognitive impact, and infection risk well beyond the protein/calorie shortfall alone.",
    citations: [
      { source: 'Severe Acute Malnutrition: Recognition and Management of Marasmus and Kwashiorkor, StatPearls, National Library of Medicine', url: 'https://pubmed.ncbi.nlm.nih.gov/32644650/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'protein-toxicity-rabbit-starvation',
    category: 'basicHealth',
    title: "'Rabbit Starvation': a Named, Potentially Fatal Syndrome From Too Much Protein and Too Little Else",
    teaser: 'A historically documented condition among explorers eating only lean meat, and a specific, quantified threshold: protein above 35% of total energy intake.',
    summary:
      "Too much protein is a risk, not a theoretical one, and it has a historically documented name: rabbit starvation, first recorded among explorers and travelers eating a diet of only very lean meat (rabbit being notoriously low in fat), a potentially fatal syndrome from protein excess combined with too little fat or carbohydrate. The underlying mechanism runs through two physiological bottlenecks: the gastrointestinal tract can only absorb amino acids at a limited rate (roughly 1.3-10g per hour), and the liver's own capacity to deaminate excess protein and convert the resulting nitrogen into urea for excretion is itself finite. A specific research-based threshold: protein constituting more than 35% of total energy intake is where documented adverse effects (hyperaminoacidemia, hyperammonemia, hyperinsulinemia, GI symptoms, and in severe cases the rabbit-starvation syndrome itself) start showing up. Proposed safe-maximum guidance sits at roughly 2-2.5g of protein per kilogram of body weight per day (about 176g daily for an 80kg/176lb person), well below the theoretical maximum the body's own digestive/hepatic capacity could handle (285-365g daily for that same person), a substantial safety margin most people never need to think about, but a worth-knowing ceiling for anyone following an extreme high-protein diet.",
    citations: [
      { source: 'Bilsborough S, Mann N 2006: A review of issues of dietary protein intake in humans, PMID 16779921', url: 'https://pubmed.ncbi.nlm.nih.gov/16779921/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ckd-protein-restriction-plant-based'],
  },
  {
    id: 'protein-requirements-rda-vs-real-need',
    category: 'basicHealth',
    title: "The Standard Protein RDA (0.8g/kg/day) May Be Too Low for Older Adults Specifically",
    teaser: 'A growing body of research proposes 1.2g/kg/day or more for aging adults, roughly 50% above the standard baseline, to actually preserve muscle.',
    summary:
      "The standard adult protein RDA is a specific 0.8g per kilogram of body weight per day for anyone over 19, a baseline meant to prevent deficiency, not necessarily to optimize function. A growing body of more recent research argues this baseline may be too low for a specific population: older adults, where metabolic and epidemiological research suggests the standard RDA may not be adequate to maintain physical function and prevent age-related muscle loss (sarcopenia). A specific alternative proposed in the literature: at least 1.2g per kilogram per day for older individuals, roughly 50% above the standard baseline. The same research emphasizes two further, practical details: leucine specifically (one of the 9 essential amino acids covered in the overview entry above) plays an outsized role in triggering muscle protein synthesis, and distributing protein evenly across meals throughout the day works better than concentrating it in one large dinner, the common pattern the standard RDA's own math otherwise tends to produce.",
    citations: [
      { source: 'Phillips SM 2017: Current Concepts and Unresolved Questions in Dietary Protein Requirements and Supplements in Adults, PMID 28534027', url: 'https://pubmed.ncbi.nlm.nih.gov/28534027/' },
      { source: 'Traylor DA, Gorissen SHM, Phillips SM 2018: Perspective: Protein Requirements and Optimal Intakes in Aging, PMID 29635313', url: 'https://pubmed.ncbi.nlm.nih.gov/29635313/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'protein-food-sources-real-data',
    category: 'basicHealth',
    title: "Protein Food Sources, Pulled Directly From The Database",
    teaser: 'Salmon and chicken breast both carry substantial protein per 100g, lentils carry a meaningful amount even after cooking dilutes the concentration.',
    summary: "Protein content pulled directly from the 22,022-food reference database. Chicken breast carries a substantial 30-32g per 100g, a standard reference point most other protein sources get compared against. Salmon carries a similarly 25-31g per 100g depending on preparation. Whole chicken egg carries roughly 15g per 100g, and lentils, a complete-when-paired plant source (see the overview entry above), carry roughly 9g per 100g once cooked, the water absorbed during cooking diluting the more concentrated dry-weight figure often quoted elsewhere. Given the requirements entry above: a 100g serving of chicken breast alone covers a meaningful share of even the higher, 1.2g/kg/day older-adult target for most adult body weights.",
    citations: [],
    overallTier: 'strong',
    chart: {
      title: 'Protein Content of Foods (per 100g)',
      unit: 'g',
      data: [
        { label: 'Chicken breast', value: 31 },
        { label: 'Salmon', value: 28 },
        { label: 'Chicken egg', value: 15 },
        { label: 'Lentils (cooked)', value: 9 },
      ],
      sourceNote: "This app's own reference database (USDA/Germany_BLS-sourced values)",
    },
  },
  {
    id: 'protein-tying-together',
    category: 'basicHealth',
    title: 'What Actually Holds Up for Protein, Pulled Together',
    teaser: "A nutrient where 'more is better' holds for most people up to a specific, quantified point, with one direct exception already covered elsewhere.",
    summary: "Line up everything in this category and protein reads as a structurally essential nutrient (9 specific amino acids the body cannot make on its own) where both extremes matter, but the shape is lopsided compared to most other nutrients covered here: deficiency (marasmus, kwashiorkor) is severe and still globally significant, but overwhelmingly a resource/food-security problem rather than a risk facing someone with reliable access to food, while excess (rabbit starvation, a named, historically documented syndrome) requires an extreme intake, above 35% of total energy, to actually cause harm, a wide safety margin most people never approach. A growing research base suggests the standard RDA undershoots what older adults specifically need to preserve muscle, a different problem (insufficient targeting, not insufficient safety margin) from either extreme. The one direct exception to this whole 'more protein is generally fine' picture already lives elsewhere: Chronic Kidney Disease, where an established 0.6-0.8g/kg/day ceiling, not a higher target, is the actual goal, since damaged kidneys can't clear the nitrogen waste higher protein intake produces the same way this entry's own healthy-kidney safety margin assumes.",
    citations: [
      { source: 'Bilsborough S, Mann N 2006: A review of issues of dietary protein intake in humans, PMID 16779921', url: 'https://pubmed.ncbi.nlm.nih.gov/16779921/' },
    ],
    overallTier: 'strong',
    relatedIds: ['protein-deficiency-kwashiorkor-marasmus', 'protein-toxicity-rabbit-starvation', 'protein-requirements-rda-vs-real-need', 'ckd-protein-restriction-plant-based'],
  },

  // -- The B-Vitamin Family (Thiamine/B1, Riboflavin/B2, Niacin/B3,
  // Pantothenic Acid/B5, Biotin/B7), added 2026-08-08, continuing the
  // Essential Nutrients series -- B12 and Folate already had their own
  // full deep-dives; these five round out the water-soluble B-complex.
  // Every citation independently verified via WebSearch. Vitamin B6
  // follows as its own, larger deep-dive right after, since it carries a
  // real, genuinely different two-sided deficiency/toxicity story the
  // others in this family don't share.
  {
    id: 'thiamine-overview',
    category: 'basicHealth',
    title: 'Thiamine (B1): The Vitamin Whose Deficiency Named a Disease That Reshaped Food Policy',
    teaser: 'A required cofactor for turning carbohydrates into usable energy, and the reason white rice became a public-health problem a century ago.',
    summary:
      "Thiamine is a required cofactor for several enzymes central to carbohydrate metabolism and nerve-cell energy production, meaning tissues with the highest energy demand, the heart and the nervous system, are also the first to show trouble when it runs short. The body stores very little thiamine at any given time (roughly an 18-day supply), so deficiency can develop faster than most other water-soluble vitamin shortfalls once intake actually stops. Modern risk factors concentrate in a specific, identifiable group: chronic alcohol use disorder, severe malnutrition, bariatric surgery, chronic diuretic use, and any condition raising metabolic demand suddenly (severe illness, hyperemesis in pregnancy). This isn't a historical curiosity confined to old naval logs; StatPearls describes it directly as a common, underrecognized cause of multisystem illness today.",
    citations: [
      { source: 'Vitamin B1 (Thiamine) Deficiency, StatPearls, NCBI Bookshelf', url: 'https://www.ncbi.nlm.nih.gov/books/NBK537204/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'thiamine-deficiency-beriberi-wernicke',
    category: 'basicHealth',
    title: 'Beriberi and Wernicke-Korsakoff Syndrome: Two Distinct Faces of the Same Deficiency',
    teaser: 'One form floods the heart with fluid. The other, left untreated, causes permanent brain damage. Both trace to the identical missing nutrient.',
    summary:
      "Thiamine deficiency shows up in different ways depending on which system runs out of reserve first. \"Wet\" beriberi presents as high-output heart failure; \"dry\" beriberi presents as a symmetrical peripheral neuropathy affecting the legs first. A third, more urgent presentation, Wernicke encephalopathy, is a medical emergency: confusion, abnormal eye movements, and loss of coordination that progresses to coma and death if thiamine isn't given immediately. Left untreated, Wernicke encephalopathy can progress into Korsakoff psychosis, an often permanent memory disorder marked by confabulation (confidently stating false memories without any intent to deceive). The good news, stated directly in the clinical literature: giving thiamine promptly can prevent Wernicke-Korsakoff from developing at all, and most people who catch it early recover completely, a sharp contrast to how much of this whole deficiency is permanent once Korsakoff's memory damage has already set in.",
    citations: [
      { source: 'Vitamin B1 (Thiamine) Deficiency, StatPearls, NCBI Bookshelf', url: 'https://www.ncbi.nlm.nih.gov/books/NBK537204/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'thiamine-tying-together',
    category: 'basicHealth',
    title: 'Thiamine, Pulled Together: The Same Deficiency That Once Reshaped an Entire Food-Milling Industry',
    teaser: 'The food-industry history already covers why refined white rice became a public-health crisis. Thiamine is the exact nutrient that crisis was about.',
    summary: "Thiamine's own history connects directly to a topic already covered elsewhere: industrial rice- and grain-milling, which strips away the outer bran layer where thiamine is concentrated, was the actual mechanism behind widespread beriberi epidemics once polished white rice became the dominant staple in parts of Asia in the late 1800s and early 1900s, a documented case of a food-processing change causing a nutrient-deficiency disease at population scale. Today's risk factors have shifted (alcohol use disorder and bariatric surgery, not polished rice, are the dominant modern causes in food-secure countries), but the underlying biology is unchanged: too little thiamine reaching high-energy-demand tissue, with severe, and in Korsakoff's case sometimes permanent consequences. The Hashimoto's-specific research separately covers a case-report-level finding on high-dose thiamine and thyroid-related fatigue, honestly tiered weak since it's three patients, not a trial; that's a different, narrower claim from the well-established deficiency disease covered here.",
    citations: [
      { source: 'Vitamin B1 (Thiamine) Deficiency, StatPearls, NCBI Bookshelf', url: 'https://www.ncbi.nlm.nih.gov/books/NBK537204/' },
    ],
    overallTier: 'strong',
    relatedIds: ['thiamine-deficiency-beriberi-wernicke', 'foodhistory-timeline-baseline-milling'],
  },
  {
    id: 'riboflavin-overview',
    category: 'basicHealth',
    title: 'Riboflavin (B2): A Low-Risk Vitamin With One Well-Evidenced Clinical Use',
    teaser: "Deficiency is rare and mild in most food-secure populations, and there's no established upper limit since it isn't known to be toxic even at high doses.",
    summary:
      "Riboflavin is a required cofactor in the electron-transport chain, the cellular pathway that actually generates usable energy, and in the metabolism of several other B vitamins besides. Deficiency (ariboflavinosis) causes cracking at the corners of the mouth, a sore, magenta-colored tongue, and skin changes, uncomfortable but rarely dangerous on its own, and uncommon in populations with reliable access to dairy, eggs, and fortified grain. The distinctive fact: there's no established upper intake limit for riboflavin, since it doesn't appear to be toxic for most people even at doses far above the standard 1.1-1.3mg/day requirement, a wide safety margin most nutrients in this series don't share.",
    citations: [
      { source: 'Supplementation with Riboflavin (Vitamin B2) for Migraine Prophylaxis in Adults and Children: A Review, PMID 26780280', url: 'https://pubmed.ncbi.nlm.nih.gov/26780280/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'riboflavin-migraine-prevention',
    category: 'basicHealth',
    title: 'A Landmark Trial Found High-Dose Riboflavin Cut Migraine Frequency in Half',
    teaser: 'A cited RCT found 400mg daily reduced migraine attacks by 50%, with a 59% responder rate versus 15% on placebo, strong enough that two major neurology bodies now formally endorse it.',
    summary: "This is riboflavin's single best-evidenced use, already named in the Migraine category, here as the wider nutrient story it actually is. A landmark randomized controlled trial found 400mg of riboflavin daily reduced migraine attack frequency by roughly 50% compared to placebo, with a 59% responder rate against 15% for placebo, a strong effect size for a single, cheap, well-tolerated nutrient. The proposed mechanism ties to riboflavin's own core function: migraine is increasingly understood to involve mitochondrial energy-production deficits in susceptible people, and riboflavin's central role in the electron-transport chain gives it a plausible route to helping. Both the American Academy of Neurology and the American Headache Society now list riboflavin as an evidence-supported complementary migraine therapy, formal recognition from two major professional bodies, not just a popular supplement claim.",
    citations: [
      { source: 'Supplementation with Riboflavin (Vitamin B2) for Migraine Prophylaxis in Adults and Children: A Review, PMID 26780280', url: 'https://pubmed.ncbi.nlm.nih.gov/26780280/' },
    ],
    overallTier: 'strong',
    relatedIds: ['migraine-magnesium-riboflavin-coq10'],
  },
  {
    id: 'riboflavin-tying-together',
    category: 'basicHealth',
    title: 'Riboflavin, Pulled Together',
    teaser: 'A low-risk nutrient at both ends, with one strong, specific clinical use that outperforms most other supplements in this whole series.',
    summary:
      "Riboflavin reads as one of the more reassuring entries in this series: deficiency is mild and uncommon with reliable food access, toxicity essentially doesn't happen even at high supplemental doses, and its one well-evidenced clinical use, migraine prevention at 400mg/day, carries strong trial evidence and formal professional endorsement rather than the more commonly mixed picture this series has documented for several other single-nutrient supplement claims.",
    citations: [
      { source: 'Supplementation with Riboflavin (Vitamin B2) for Migraine Prophylaxis in Adults and Children: A Review, PMID 26780280', url: 'https://pubmed.ncbi.nlm.nih.gov/26780280/' },
    ],
    overallTier: 'strong',
    relatedIds: ['riboflavin-migraine-prevention'],
  },
  {
    id: 'niacin-overview',
    category: 'basicHealth',
    title: 'Niacin (B3): A Two-Sided Nutrient, With a Deficiency Disease That Reshaped a Diet and a Supplement Form That Comes With Risk',
    teaser: 'The vitamin behind pellagra\'s historic "three Ds," and, at high supplemental doses, a documented liver-toxicity risk of its own.',
    summary: "Niacin (available in the body as nicotinic acid or nicotinamide) is required for over 400 enzymatic reactions, most centrally in energy metabolism, making it one of the more broadly essential B vitamins in this whole family. It's two-sided in a way riboflavin and biotin aren't: severe deficiency disease exists (pellagra), and dose-dependent toxicity exists too, entirely from supplemental intake rather than food. Corn-based diets lacking niacin in a bioavailable form were the historic driver of mass pellagra outbreaks in the early 1900s American South, a nutritional-deficiency epidemic tied directly to a specific, dominant dietary staple, the same class of food-and-disease connection covered elsewhere in the food-industry history.",
    citations: [
      { source: 'Niacin Deficiency, StatPearls, NCBI Bookshelf', url: 'https://www.ncbi.nlm.nih.gov/books/NBK557728/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'niacin-deficiency-pellagra',
    category: 'basicHealth',
    title: "Pellagra: The \"Three D's\" of Severe Niacin Deficiency",
    teaser: 'Dermatitis, dementia, and diarrhea, a historically documented triad, and untreated pellagra can be fatal.',
    summary:
      "Pellagra, severe niacin deficiency, produces a classically taught clinical triad: dermatitis (a symmetric, sun-exposed skin rash), dementia (confusion and cognitive decline), and diarrhea, with a fourth D, death, an outcome if it goes untreated. It's far less common today than in its early-1900s historical peak, but current case reports still document it in specific, at-risk populations: bariatric surgery patients, people with chronic alcohol use disorder, and anyone with severe, sustained malnutrition. The historic epidemic traced directly to corn as a dominant dietary staple without the traditional preparation step (nixtamalization, treating corn with an alkaline solution) that actually releases its niacin into a bioavailable form, a specific example of how a food's own preparation method, not just its raw nutrient content, determines what the body can actually use.",
    citations: [
      { source: 'Niacin Deficiency, StatPearls, NCBI Bookshelf', url: 'https://www.ncbi.nlm.nih.gov/books/NBK557728/' },
      { source: 'Pellagra in Complex Clinical Settings: A Case Involving Bariatric Surgery, Whipple Procedure, and Alcohol Use Disorder', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12376560/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'niacin-toxicity-flushing-liver',
    category: 'basicHealth',
    title: 'Niacin Flushing Has a Specific Mechanism, and High-Dose Supplementation Carries a Liver Risk',
    teaser: 'That hot, red flushing feeling isn\'t an allergic reaction, it\'s a specific receptor being directly activated. Sustained high doses are a different, more serious story.',
    summary:
      "Niacin flushing, a hot, reddening sensation in the face, arms, and chest, has a well-understood mechanism: niacin activates a specific receptor (GPR109A) on skin cells, triggering prostaglandin release and direct vasodilation, typically starting within 30 minutes and fading within about an hour. It's uncomfortable, not dangerous, and distinct from a true allergic reaction. The more serious risk sits at sustained high supplemental doses: niacin, especially at levels prescribed for cholesterol management (around 3,000mg/day historically), can cause hepatotoxicity ranging from mild liver-enzyme elevation to acute liver failure, alongside jaundice and visual disturbance at that range. This is a dose-dependent risk from supplementation specifically, not from niacin obtained through ordinary food.",
    citations: [
      { source: 'Niacin Toxicity, StatPearls, NCBI Bookshelf', url: 'https://www.ncbi.nlm.nih.gov/sites/books/NBK559137/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'niacin-tying-together',
    category: 'basicHealth',
    title: 'Niacin, Pulled Together',
    teaser: 'A severe deficiency disease with its own documented food-preparation cause, and a dose-dependent toxicity risk confined almost entirely to supplementation.',
    summary:
      "Niacin reads as a two-sided nutrient in this series, closer in shape to vitamin B6 or vitamin D than to riboflavin's much wider safety margin. Deficiency (pellagra) traces to a specific, documented historical food-preparation gap, not just low intake in the abstract. Toxicity (flushing, and at sustained high supplemental doses, liver damage) is dose-dependent and essentially confined to supplement-level intake, never ordinary food. Both extremes are well-characterized, and each traces to an identifiable, specific cause rather than a vague or contested mechanism.",
    citations: [
      { source: 'Niacin Deficiency, StatPearls, NCBI Bookshelf', url: 'https://www.ncbi.nlm.nih.gov/books/NBK557728/' },
    ],
    overallTier: 'strong',
    relatedIds: ['niacin-deficiency-pellagra', 'niacin-toxicity-flushing-liver'],
  },
  {
    id: 'biotin-overview',
    category: 'basicHealth',
    title: 'Biotin (B7): A Rare Deficiency, and a Different Story Already Covered Elsewhere',
    teaser: "Biotin's own deficiency is rare enough that most people will never encounter it, but a completely separate biotin issue, lab-test interference, is common and already covered in the Labs & Medication Timing category.",
    summary: "Biotin is a required cofactor for several carboxylase enzymes central to fatty-acid, amino-acid, and glucose metabolism. Clinically significant deficiency is uncommon in the general population, occurring mainly with prolonged antibiotic use, certain anticonvulsant medications, or total parenteral nutrition (IV feeding bypassing the gut entirely), with symptoms including hair loss, a scaly rash, and, in severe cases, neurological symptoms. This is a common point of confusion: biotin's well-documented, and much more commonly relevant issue today isn't dietary deficiency at all, it's high-dose biotin supplementation interfering with certain thyroid and other lab-test assays, already covered in full in the Labs & Medication Timing category, a separate story from the classic nutrient-deficiency picture covered here.",
    citations: [
      { source: 'Biotin Deficiency, StatPearls, NCBI Bookshelf', url: 'https://www.ncbi.nlm.nih.gov/books/NBK547751/' },
    ],
    overallTier: 'strong',
    relatedIds: ['labs-biotin-interference'],
  },
  {
    id: 'biotin-deficiency-avidin-mechanism',
    category: 'basicHealth',
    title: 'Raw Egg Whites Contain a Specific Protein That Blocks Biotin Absorption Entirely',
    teaser: 'Avidin binds biotin so tightly the pair passes straight through the body unused, and cooking is all it takes to fully deactivate it.',
    summary:
      "This is a specific, and elegant mechanism, not folk advice: raw egg whites contain avidin, a protein that binds biotin essentially irreversibly, meaning the biotin-avidin complex simply passes through the digestive tract and is lost in stool rather than absorbed. Eating enough raw egg whites regularly (historically documented in cases of habitual raw-egg consumption) can produce an avidin-driven biotin deficiency purely from this binding effect, independent of how much biotin the diet otherwise contains. The practical fix is simple and well-established: cooking denatures avidin's protein structure, permanently disabling its ability to bind biotin, which is exactly why cooked eggs (a good biotin source in their own right) pose no such risk at all.",
    citations: [
      { source: 'Biotin Deficiency, StatPearls, NCBI Bookshelf', url: 'https://www.ncbi.nlm.nih.gov/books/NBK547751/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'biotin-tying-together',
    category: 'basicHealth',
    title: 'Biotin, Pulled Together',
    teaser: 'A rare deficiency with one elegant, specific dietary mechanism, and a much more commonly relevant story about high-dose supplements and lab tests, covered in full elsewhere.',
    summary: "Biotin's own deficiency picture is narrow and specific: rare outside a handful of identifiable causes, with raw-egg-white avidin binding as its one distinctive, well-understood dietary mechanism. The far more practically relevant biotin story for most people today isn't a deficiency at all, it's supplementation, and the Labs & Medication Timing category already covers that side in depth (high-dose biotin supplements skewing certain thyroid and cardiac lab assays). Biotin has two separate stories, not one, and most people are far more likely to encounter the second.",
    citations: [
      { source: 'Biotin Deficiency, StatPearls, NCBI Bookshelf', url: 'https://www.ncbi.nlm.nih.gov/books/NBK547751/' },
    ],
    overallTier: 'strong',
    relatedIds: ['biotin-deficiency-avidin-mechanism', 'labs-biotin-interference'],
  },
  {
    id: 'pantothenate-overview-and-rarity',
    category: 'basicHealth',
    title: "Pantothenic Acid (B5): Named for the Greek Word Meaning \"From Everywhere,\" and Hard to Become Deficient In",
    teaser: 'A required cofactor for Coenzyme A, present widely enough across ordinary food that an isolated deficiency has essentially never been documented outside severe, total malnutrition.',
    summary:
      "Pantothenic acid's own name comes directly from the Greek word for \"from everywhere,\" a reflection of how widely it's distributed across ordinary food (meat, whole grains, vegetables, dairy), it's a required component of Coenzyme A, central to fatty-acid metabolism and energy production. Precisely because of that wide distribution, an isolated pantothenic-acid deficiency has essentially never been documented in an otherwise-adequately-fed person; the few cases on record occurred only under conditions of severe total-calorie malnutrition alongside multiple other simultaneous nutrient deficiencies, not pantothenic acid alone. No established toxicity from excess intake exists either. Of every nutrient in this whole Essential Nutrients series, pantothenic acid carries the widest margin of safety at both ends, without a deficiency-and-toxicity narrative to manufacture around it.",
    citations: [
      { source: 'Pantothenic Acid, Health Professional Fact Sheet, NIH Office of Dietary Supplements', url: 'https://ods.od.nih.gov/factsheets/PantothenicAcid-HealthProfessional/' },
    ],
    overallTier: 'strong',
  },

  // -- Vitamin B6 (Pyridoxine), added 2026-08-08 -- given its own, larger
  // deep-dive since, unlike the five B-vitamins above, it carries a real,
  // genuinely two-sided deficiency-AND-toxicity story with two distinct
  // real mechanisms, matching the depth this series already gives
  // Magnesium, Vitamin D, Iron, and Zinc.
  {
    id: 'b6-overview',
    category: 'basicHealth',
    title: 'Vitamin B6 (Pyridoxine): Over 100 Enzyme Reactions, and a Two-Sided Neurological Story',
    teaser: 'Central to neurotransmitter production, amino-acid metabolism, and hemoglobin synthesis, and, unusually among B vitamins, both too little and too much can independently cause nerve damage.',
    summary:
      "Vitamin B6 participates in well over 100 enzymatic reactions across the body, most centrally neurotransmitter synthesis (serotonin, dopamine, GABA), amino-acid metabolism, glucose metabolism, and hemoglobin production. What sets B6 apart from most other water-soluble vitamins covered in this series is a two-sided neurological story: both deficiency and excess can independently cause peripheral neuropathy, through two different mechanisms, covered in the two entries below. Isolated dietary B6 deficiency is uncommon; it shows up more often as a side effect of specific medications (isoniazid, used for tuberculosis, and certain other anticonvulsants) that directly interfere with B6 metabolism, or alongside chronic alcohol use disorder.",
    citations: [
      { source: 'The Role of Vitamin B6 in Peripheral Neuropathy: A Systematic Review', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10343656/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'b6-toxicity-neuropathy',
    category: 'basicHealth',
    title: 'High-Dose B6 Supplementation Can Cause a Distinct Sensory Neuropathy',
    teaser: 'Deficiency damages both motor and sensory nerve fibers; too much B6 damages sensory fibers alone, through a different mechanism, and it happens at identifiable doses.',
    summary:
      "This is a well-documented, and counterintuitive fact: pyridoxine deficiency and pyridoxine excess both cause peripheral neuropathy, but through different mechanisms producing a different clinical picture. Deficiency injures both motor and sensory axons; overdose produces a pure sensory neuropathy (numbness, tingling, unsteady balance from impaired position sense) without motor involvement. Toxicity essentially never comes from food, only from supraphysiologic supplement dosing: sensory neuropathy typically develops above 1,000mg/day in adults, though documented cases have occurred at doses under 500mg/day when taken chronically over several months. There's no specific antidote; treatment is simply stopping the supplement, after which most people improve, though recovery can be slow and, in some documented cases, isn't fully complete.",
    citations: [
      { source: 'Vitamin B6 Toxicity, StatPearls, NCBI Bookshelf', url: 'https://www.ncbi.nlm.nih.gov/books/NBK554500/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'b6-tying-together',
    category: 'basicHealth',
    title: 'Vitamin B6, Pulled Together',
    teaser: 'A rare dietary deficiency mostly caused by specific medications, and a well-documented supplement-dose toxicity most people never approach through food alone.',
    summary:
      "B6 reads as a two-sided nutrient closer in shape to niacin or vitamin D than to biotin or pantothenic acid's much wider safety margins. Deficiency is uncommon outside specific medication interactions (isoniazid especially) or chronic alcohol use; toxicity requires supplement doses (typically 1,000mg/day and up, occasionally lower with chronic use) that ordinary food could never approach. Both extremes damage nerves, through two different, well-characterized mechanisms, two distinct risks rather than one vague \"too much or too little is bad\" rule.",
    citations: [
      { source: 'Vitamin B6 Toxicity, StatPearls, NCBI Bookshelf', url: 'https://www.ncbi.nlm.nih.gov/books/NBK554500/' },
    ],
    overallTier: 'strong',
    relatedIds: ['b6-toxicity-neuropathy'],
  },

  // -- Chromium, Manganese, Copper, and Choline, added 2026-08-08,
  // continuing the Essential Nutrients series -- the four remaining
  // trace-mineral/nutrient candidates named at the end of the original
  // 15-topic build ("real candidates worth continuing"). Every citation
  // independently verified via WebSearch.
  {
    id: 'chromium-overview-essentiality-debate',
    category: 'basicHealth',
    title: "Chromium: A Trace Mineral Whose Role in Blood-Sugar Regulation Is Less Settled Than Its Supplement Marketing Suggests",
    teaser: 'Widely sold as a blood-sugar supplement, chromium\'s own evidence base is honestly mixed, not the clean, settled story the supplement aisle implies.',
    summary:
      "Chromium is a trace mineral long theorized to enhance insulin's own action at the cellular level, the basis for its wide popularity as a blood-sugar and weight-management supplement, most commonly sold as chromium picolinate. Published research states this directly: controversy exists as to whether chromium supplementation should be routinely recommended in people without a documented, confirmed deficiency, and results across well-designed clinical trials point in different directions depending on the specific population studied (lean vs. Obese, insulin-sensitive vs. Insulin-resistant). This is the starting point the more specific finding in the next entry builds on: chromium's own supplement reputation runs ahead of how settled the underlying science actually is.",
    citations: [
      { source: 'Current concepts about chromium supplementation in type 2 diabetes and insulin resistance, PMID 20425574', url: 'https://pubmed.ncbi.nlm.nih.gov/20425574/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'chromium-insulin-sensitivity-honest',
    category: 'basicHealth',
    title: 'Chromium Supplementation: A Modest Effect on Insulin-Resistance Markers, of Uncertain Real-World Significance',
    teaser: 'A meta-analysis of 28 studies found chromium significantly lowered fasting blood sugar and HOMA-IR, but had no significant effect on HbA1c, the marker that actually reflects longer-term control.',
    summary:
      "A meta-analysis pooling 28 studies found chromium supplementation produced a statistically significant reduction in fasting plasma glucose, insulin levels, and HOMA-IR (a standard insulin-resistance index) in people with type 2 diabetes. The same body of research found no significant effect on HbA1c, the lab marker that actually reflects blood-sugar control over the preceding several months, meaning the measured effect on shorter-term markers hasn't been shown to translate into the outcome that matters most clinically. A separate, more recent meta-analysis in overweight and obese, non-diabetic adults found a small effect (HOMA-IR reduction, weighted mean difference of only -0.26). The consistent read across both bodies of evidence: a measurable, but modest effect exists in some populations, with uncertain real-world clinical significance, closer to a supporting player than a primary blood-sugar intervention.",
    citations: [
      { source: 'Effects of chromium supplementation on glycemic control in patients with type 2 diabetes: a systematic review and meta-analysis of randomized controlled trials', url: 'https://www.sciencedirect.com/science/article/abs/pii/S1043661820314067' },
      { source: 'The effect of chromium supplementation on cardio-metabolic risk factors in overweight and obese patients: a systematic review and meta-analysis', url: 'https://www.sciencedirect.com/science/article/abs/pii/S0946672X25000586' },
    ],
    overallTier: 'moderate',
    relatedIds: ['type2-metabolic-syndrome-cluster', 'pcos-myo-dchiro-inositol'],
  },
  {
    id: 'chromium-tying-together',
    category: 'basicHealth',
    title: 'Chromium, Pulled Together',
    teaser: 'A modest supplement effect on some blood-sugar markers, with uncertain clinical significance, an honest, moderate-tier entry in this series, not a strong or a weak one.',
    summary: "Chromium sits in a different place from most of this series' other entries: not a nutrient with a severe, well-characterized deficiency disease (magnesium, iron, zinc), and not one with a clean null result either (the SELECT trial's honest correction on selenium and prostate cancer). Instead, chromium's own evidence shows a modest, statistically effect on some insulin-resistance markers without translating into the longer-term marker (HbA1c) that matters most, and without a clear, settled answer on who actually benefits. It's a minor, second-tier lever, alongside myo-inositol and Nigella sativa in the PCOS and Hashimoto's research, neither dismissed nor oversold.",
    citations: [
      { source: 'Current concepts about chromium supplementation in type 2 diabetes and insulin resistance, PMID 20425574', url: 'https://pubmed.ncbi.nlm.nih.gov/20425574/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['chromium-insulin-sensitivity-honest'],
  },
  {
    id: 'manganese-overview',
    category: 'basicHealth',
    title: 'Manganese: A Required Antioxidant Cofactor, and an Unusual Nutrient Whose Risk Runs Almost Entirely on the Toxicity Side',
    teaser: 'A trace mineral needed for bone formation and the body\'s own primary mitochondrial antioxidant enzyme, but deficiency is so rare it\'s barely been documented in humans at all.',
    summary:
      "Manganese is a required cofactor for several enzymes, most notably manganese superoxide dismutase (MnSOD), the primary antioxidant enzyme protecting mitochondria specifically from oxidative damage, and for enzymes involved in bone formation and connective-tissue development. This is a lopsided nutrient compared to most others in this series: documented manganese deficiency in humans is rare enough that it's barely been characterized at all outside controlled research settings, while well-documented toxicity is a serious concern, covered in the entry below. Ordinary dietary intake (whole grains, nuts, leafy greens, tea) essentially never causes a problem in either direction; the risk sits almost entirely with a specific, identifiable exposure route.",
    citations: [
      { source: 'Manganese Toxicity, StatPearls, NCBI Bookshelf', url: 'https://www.ncbi.nlm.nih.gov/books/NBK560903/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'manganese-toxicity-manganism',
    category: 'basicHealth',
    title: 'Manganism: A Distinctive Neurotoxic Syndrome That Looks Like Parkinson\'s Disease',
    teaser: 'Chronic overexposure produces a progressive movement disorder, primarily from inhaled dust in specific occupational settings, not from ordinary eating.',
    summary:
      "Manganese toxicity produces a distinctive clinical picture: early psychiatric symptoms progressing to a movement disorder resembling Parkinson's disease, caused by manganese depositing directly in the basal ganglia (a brain region central to movement control). This is called manganism, and it's overwhelmingly an occupational exposure risk (inhaled manganese-containing dust in welding, mining, and certain manufacturing settings), not a risk from eating manganese-containing food. A specific, and useful interaction: iron deficiency independently increases how much manganese the body absorbs and deposits in tissue, including the brain, meaning someone with unaddressed iron deficiency carries an elevated manganese-toxicity risk at the same environmental exposure level someone with normal iron status would tolerate, iron supplementation has documented value in treating manganese overload specifically for this reason. Infants and children carry elevated risk too, from a combination of less-developed excretion mechanisms and a more permeable blood-brain barrier.",
    citations: [
      { source: 'Manganese Toxicity, StatPearls, NCBI Bookshelf', url: 'https://www.ncbi.nlm.nih.gov/books/NBK560903/' },
    ],
    overallTier: 'strong',
    relatedIds: ['iron-absorption-mechanism'],
  },
  {
    id: 'manganese-tying-together',
    category: 'basicHealth',
    title: 'Manganese, Pulled Together',
    teaser: 'A lopsided nutrient: deficiency is barely documented in humans, while toxicity is a serious, well-characterized occupational-exposure risk with a specific link to iron status.',
    summary:
      "Manganese reads as one of the more one-sided nutrients in this whole series. Ordinary dietary intake essentially never causes a problem in either direction. The risk sits almost entirely at chronic, high-level occupational exposure (inhaled dust), producing manganism, a distinctive neurotoxic movement disorder, and the specific tie to iron status (iron deficiency increasing manganese uptake and deposition) is a useful, actionable connection to this series' own Iron deep-dive, not a coincidence.",
    citations: [
      { source: 'Manganese Toxicity, StatPearls, NCBI Bookshelf', url: 'https://www.ncbi.nlm.nih.gov/books/NBK560903/' },
    ],
    overallTier: 'strong',
    relatedIds: ['manganese-toxicity-manganism', 'iron-overview'],
  },
  {
    id: 'copper-overview',
    category: 'basicHealth',
    title: 'Copper: A Required Partner to Iron Metabolism, With Two Opposite, Genetic Diseases Bearing Its Name',
    teaser: 'Needed for connective tissue, nerve function, and iron transport, and two rare genetic diseases (one deficiency, one toxicity) show exactly what happens at each extreme.',
    summary:
      "Copper is a required cofactor for several enzymes, including ones central to connective-tissue formation, nerve-cell energy production, and, notably, mobilizing iron out of storage and into the bloodstream, a direct link between these two trace minerals covered separately elsewhere in this series. Copper's own deficiency-and-toxicity story is unusually well illustrated by two named, opposite genetic diseases: Menkes disease (a X-linked, fatal copper-deficiency disorder in infants, from a mutation preventing copper absorption) and Wilson disease (an autosomal-recessive copper-toxicity disorder from a mutation preventing copper excretion, causing dangerous accumulation in the liver and brain). Both are rare, genetic, and extreme, but they cleanly demonstrate copper's own biology at both ends, the same two-extremes shape most nutrients in this series share, just genetically rather than dietarily driven in these specific named cases.",
    citations: [
      { source: 'Inherited Copper Transport Disorders: Biochemical Mechanisms, Diagnosis, and Treatment', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3290776/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'copper-deficiency-anemia-neutropenia',
    category: 'basicHealth',
    title: 'Acquired Copper Deficiency Is an Under-Recognized Cause of Anemia Often Mistaken for a Bone-Marrow Disease',
    teaser: 'Copper deficiency causes anemia and low white-blood-cell counts that can look enough like myelodysplastic syndrome to be misdiagnosed as one, and copper replacement reverses it.',
    summary: "Beyond the rare genetic cases, acquired copper deficiency happens too, most commonly from bariatric surgery, malabsorption, or, notably, sustained high-dose zinc supplementation (see the zinc-copper antagonism research). It produces a distinctive blood picture: anemia alongside neutropenia (low neutrophil white blood cells), sometimes with bone-marrow changes resembling myelodysplastic syndrome (MDS) closely enough that documented cases have been misdiagnosed as MDS before copper deficiency was identified as the actual cause. The reassuring part: copper replacement promptly reverses the blood-related effects, though any neurological symptoms that developed alongside it can take longer to resolve, and don't always fully do so.",
    citations: [
      { source: 'Update on anemia and neutropenia in copper deficiency, PMID 22080848', url: 'https://pubmed.ncbi.nlm.nih.gov/22080848/' },
    ],
    overallTier: 'strong',
    relatedIds: ['interaction-zinc-copper'],
  },
  {
    id: 'copper-tying-together',
    category: 'basicHealth',
    title: 'Copper, Pulled Together',
    teaser: 'A direct partner to iron metabolism, with a common, well-documented supplement-driven deficiency pathway already covered in the zinc-copper research.',
    summary: "Copper's own two named genetic extremes (Menkes, Wilson disease) are rare, but the far more practically relevant risk for most people is the acquired, supplement-driven deficiency already covered in the zinc-copper antagonism entry: sustained high-dose zinc supplementation, often taken with good intentions for immune support or cold prevention, can quietly cause a copper deficiency with hematologic and neurological consequences. Worth reading alongside the zinc deep-dive directly, since this is the single most likely way an ordinary person actually encounters a copper problem.",
    citations: [
      { source: 'Inherited Copper Transport Disorders: Biochemical Mechanisms, Diagnosis, and Treatment', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3290776/' },
    ],
    overallTier: 'strong',
    relatedIds: ['copper-deficiency-anemia-neutropenia', 'interaction-zinc-copper', 'zinc-toxicity-acute-chronic'],
  },
  {
    id: 'choline-overview',
    category: 'basicHealth',
    title: 'Choline: A Nutrient the Body Can Partly Make Itself, But Not Nearly Enough of',
    teaser: "The body's own liver produces some choline on its own, just not enough to meet daily needs, which is exactly why it's still classified as an essential nutrient.",
    summary:
      "Choline is an unusual nutrient: the liver can synthesize a small amount on its own, but not nearly enough to meet the body's daily requirement, which is why it's still formally classified as essential and carries its own Adequate Intake value (550mg/day for men, 425mg/day for women). It serves several distinct functions: the body converts it into acetylcholine, a neurotransmitter involved in muscle contraction, pain signaling, and memory; the majority gets converted into phosphatidylcholine, the predominant structural lipid in cell membranes and a required component for packaging and exporting fat out of the liver; and it acts as a methyl donor after conversion to betaine, a direct link to the same folate-driven methylation chemistry already covered elsewhere in this series.",
    citations: [
      { source: 'Choline, Health Professional Fact Sheet, NIH Office of Dietary Supplements', url: 'https://ods.od.nih.gov/factsheets/Choline-HealthProfessional/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'choline-deficiency-liver',
    category: 'basicHealth',
    title: "Choline Deficiency Directly Causes the Liver to Store Excess Fat, a Direct Mechanistic Link to Fatty Liver Disease",
    teaser: "Phosphatidylcholine, made from choline, is what actually packages fat for export out of the liver, without enough choline, fat backs up inside liver cells instead.",
    summary: "This is a direct, mechanistic connection, not just a loose association: phosphatidylcholine (made from choline) is a required structural component for packaging fat into the lipoprotein particles the liver uses to export it into the bloodstream. Without adequate choline, that export pathway is impaired, and fat accumulates inside liver cells instead, a documented, causal route to fatty liver, distinct from the more commonly discussed insulin-resistance-driven pathway already covered in the Fatty Liver Disease category. Deficiency-driven liver fat accumulation has been directly demonstrated in controlled human feeding studies specifically restricting choline intake, experimental confirmation, not just observational correlation.",
    citations: [
      { source: 'Choline, Health Professional Fact Sheet, NIH Office of Dietary Supplements', url: 'https://ods.od.nih.gov/factsheets/Choline-HealthProfessional/' },
    ],
    overallTier: 'strong',
    relatedIds: ['masld-overview'],
  },
  {
    id: 'choline-food-sources-real-data',
    category: 'basicHealth',
    chart: {
      title: 'Choline Content of Foods (mg per 100g)',
      unit: 'mg',
      data: [
        { label: 'Beef liver', value: 418 },
        { label: 'Egg (whole)', value: 294 },
        { label: 'Salmon', value: 90 },
        { label: 'Chicken breast', value: 72 },
      ],
      sourceNote: "This app's own reference database (USDA-sourced values)",
    },
    title: 'Choline Content of Foods, Directly From The Reference Database',
    teaser: 'Egg yolk and liver both carry high, concentrated choline, , given the "how much is too much" question the prostate research already covers.',
    summary: "Choline concentrates heavily in a small number of foods: organ meat (beef liver) and egg yolk both carry high amounts per serving, with leaner meat and fish contributing meaningfully but less densely. This is worth reading directly alongside the prostate-health research, which independently found the highest quintile of dietary choline intake associated with a quantified 70% higher risk of lethal prostate cancer over 22 years of follow-up in one large study, mediated by gut bacteria converting excess choline into TMAO. Neither finding cancels the other out: choline is an essential nutrient with a deficiency risk (impaired liver-fat export, covered above) at one end, and a dose-dependent concern at sustained high intake at the other, the same two-extremes shape this whole series keeps finding, not a reason to avoid choline-rich food entirely.",
    citations: [
      { source: 'Choline intake and risk of lethal prostate cancer: incidence and survival, PMID 22952174', url: 'https://pubmed.ncbi.nlm.nih.gov/22952174/' },
    ],
    overallTier: 'strong',
    relatedIds: ['prostate-choline-tmao'],
  },
  {
    id: 'choline-tying-together',
    category: 'basicHealth',
    title: 'Choline, Pulled Together',
    teaser: 'A two-sided nutrient with evidence at both extremes: too little measurably backs up fat in the liver, and too much, sustained over decades, carries a quantified cancer-risk finding already covered elsewhere.',
    summary: "Choline is a structurally interesting nutrient in this series: partly self-made by the liver, but not enough to avoid needing dietary intake, with a well-demonstrated deficiency mechanism (impaired fat export from the liver) and a well-quantified high-intake risk (the prostate-cancer/TMAO finding already covered in the Prostate Health research) sitting at opposite ends of the same nutrient, both entries together forming one complete picture.",
    citations: [
      { source: 'Choline, Health Professional Fact Sheet, NIH Office of Dietary Supplements', url: 'https://ods.od.nih.gov/factsheets/Choline-HealthProfessional/' },
    ],
    overallTier: 'strong',
    relatedIds: ['choline-deficiency-liver', 'choline-food-sources-real-data', 'prostate-choline-tmao'],
  },

  // -- Carbohydrates & Fiber, and Water & Hydration, added 2026-08-08 --
  // the two remaining macronutrients in this series (Protein and
  // Omega-3/6 Fatty Acids were already built). Every citation
  // independently verified via WebSearch.
  {
    id: 'carbfiber-overview',
    category: 'basicHealth',
    title: 'Carbohydrates & Fiber: The Same Macronutrient Category, Two Different Jobs',
    teaser: 'Soluble fiber dissolves into a gel that lowers cholesterol and slows glucose absorption. Insoluble fiber stays intact and does the opposite kind of job entirely.',
    summary: "Carbohydrates are the body's primary, most readily available energy source, but fiber, the carbohydrate the body can't actually digest, does a different job depending on its type. Soluble fiber (found in oats, barley, legumes, and many fruits) dissolves in water to form a gel that slows gastric emptying, increases satiety, and binds bile acids in the gut, directly lowering LDL cholesterol as a documented result. Insoluble fiber (found in whole grains, bran, nuts, and vegetable skins) stays structurally intact through digestion, adding bulk and speeding intestinal transit, the mechanism behind its own role in digestive regularity. Soluble fiber is also the more readily fermentable of the two, meaning it's the primary substrate for the short-chain-fatty-acid production the Gut & Microbiome research already covers as one of the most directly food-controllable dietary levers.",
    citations: [
      { source: 'The Role of Dietary Fiber in Health Promotion and Disease Prevention: A Practical Guide for Clinicians, StatPearls', url: 'https://www.ncbi.nlm.nih.gov/books/NBK559033/' },
    ],
    overallTier: 'strong',
    relatedIds: ['gut-scfa-treg'],
  },
  {
    id: 'carbfiber-real-benefits',
    category: 'basicHealth',
    title: 'Fiber\'s Own Quantified Benefits: Lower LDL, Better Blood Sugar, and Reduced Risk Across Several Major Diseases',
    teaser: 'Inadequate fiber intake is documented to track with higher risk of cardiovascular disease, several cancers, and type 2 diabetes, not a vague wellness claim.',
    summary:
      "Fiber's own evidence base is broad and consistent, not confined to one narrow benefit. Soluble fiber specifically is documented to significantly reduce LDL cholesterol, an established, direct cardiovascular-risk-reduction mechanism through bile-acid binding. Research also finds inadequate fiber intake closely associated with a higher risk of cardiovascular disease, several cancers (colon cancer most prominently), gastrointestinal disorders, and type 2 diabetes, across large, population studies, not a single small trial. Fiber's own effect on satiety and appetite regulation (slowed gastric emptying, a feeling of fullness) also carries systematic-review support for aiding weight management, a food-first lever rather than a supplement-dependent one.",
    citations: [
      { source: 'The Role of Dietary Fiber in Health Promotion and Disease Prevention: A Practical Guide for Clinicians, StatPearls', url: 'https://www.ncbi.nlm.nih.gov/books/NBK559033/' },
      { source: 'Dietary fiber influence on overall health, with an emphasis on CVD, diabetes, obesity, colon cancer, and inflammation', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11671356/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'carbfiber-intake-gap',
    category: 'basicHealth',
    title: 'A Striking Gap: Roughly 94% of Americans Don\'t Meet the Recommended Fiber Intake',
    teaser: 'The RDA is 25-38 grams a day depending on sex and age. Almost nobody is actually getting there.',
    summary:
      "The established RDA for total fiber intake is 38 grams/day for men and 25 grams/day for women aged 19-50 (both figures step down somewhat with age). The striking finding: approximately 94% of American children and adults fail to meet this target, one of the largest, most consistent nutrient-intake gaps documented in the general population, far exceeding the shortfall documented for most single micronutrients covered elsewhere in this series. There's no established guidance on splitting intake specifically between soluble and insoluble fiber; the practical, evidence-backed goal is simply reaching total intake, which whole foods (fruits, vegetables, legumes, whole grains) reliably deliver in a way most refined, processed alternatives don't.",
    citations: [
      { source: 'The Role of Dietary Fiber in Health Promotion and Disease Prevention: A Practical Guide for Clinicians, StatPearls', url: 'https://www.ncbi.nlm.nih.gov/books/NBK559033/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ibs-kiwifruit-prunes-psyllium-constipation-trial', 'produce-chickpeas'],
  },
  {
    id: 'carbfiber-tying-together',
    category: 'basicHealth',
    title: 'Carbohydrates & Fiber, Pulled Together',
    teaser: 'One of the largest, most consistent intake gaps this whole series documents, backed by broad, food-first evidence, and already reused as a food-scoring dimension for two conditions elsewhere.',
    summary: "Fiber reads as one of the more clear-cut, actionable entries in this whole series: broad, well-established benefit (cardiovascular, metabolic, digestive), an enormous gap between recommended and actual intake (94% of Americans falling short), and no toxicity concern at ordinary dietary intake levels. The reuse-first food-scoring architecture already reflects fiber's relevance directly: the \"Carbohydrate Density Relative to Fiber\" sub-criterion, built for Type 1 Diabetes and reused for PCOS and Type 2 Diabetes, scores every food in the reference database by exactly this fiber-to-carbohydrate relationship.",
    citations: [
      { source: 'The Role of Dietary Fiber in Health Promotion and Disease Prevention: A Practical Guide for Clinicians, StatPearls', url: 'https://www.ncbi.nlm.nih.gov/books/NBK559033/' },
    ],
    overallTier: 'strong',
    relatedIds: ['carbfiber-real-benefits', 'carbfiber-intake-gap', 'type1-carb-counting-accuracy'],
  },
  {
    id: 'water-overview',
    category: 'basicHealth',
    title: 'Water: The One Nutrient With No Official Government Recommendation at All',
    teaser: 'Every other nutrient in this series has a published DRI. Water doesn\'t, a deliberate gap filled here with a separately reasoned DRI figure instead.',
    summary: "Water is required for essentially every physiological process (temperature regulation, nutrient transport, waste removal, joint lubrication, and simply making up roughly 50-60% of adult body weight), yet it's an unusual entry in this series: the CDC states directly that no official U.S. Government guideline exists for exactly how much water a person needs daily. The DRI figure (2.7L/day for women, 3.7L/day for men, from all sources including food, not just drinks, sourced from the 2005 NASEM report already cited elsewhere) fills that gap, and the Hydration lens already tracks total daily intake, food and drink combined, against it directly. The practical takeaway from water's own missing official guideline: thirst itself is a generally reliable regulatory signal in a healthy person under ordinary conditions, not something that needs to be overridden by a fixed daily target.",
    citations: [
      { source: 'Water Toxicity, StatPearls, NCBI Bookshelf', url: 'https://www.ncbi.nlm.nih.gov/books/NBK537231/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'water-intoxication-hyponatremia',
    category: 'basicHealth',
    title: 'Water Intoxication Is But Rare Outside Two Specific, Identifiable Situations',
    teaser: 'The kidneys can only clear about 0.8-1.0 liters of water per hour, drinking meaningfully faster than that, sustained, is what actually causes dangerous hyponatremia.',
    summary:
      "Water intoxication (acute hyponatremia, dangerously diluted blood sodium from excess water intake) is a documented, potentially life-threatening condition, not a myth, but it's rare in ordinary daily life. The mechanism: the kidneys can only clear roughly 0.8-1.0 liters of water per hour, and sustained intake meaningfully faster than that overwhelms the body's own sodium balance. Documented cases concentrate almost entirely in two specific, identifiable situations: deliberate water-drinking contests/competitions, and prolonged endurance exercise (marathons, ultra-distance events) where excessive fluid replacement outpaces sodium loss. A useful, practical finding from endurance-sport research: recommending athletes drink according to thirst, rather than a fixed volume schedule, nearly eliminated hyponatremia cases in competition settings without causing dangerous dehydration either. For ordinary daily hydration outside intense endurance exercise, water intoxication essentially doesn't happen by accident.",
    citations: [
      { source: 'Water Toxicity, StatPearls, NCBI Bookshelf', url: 'https://www.ncbi.nlm.nih.gov/books/NBK537231/' },
      { source: 'Exercise-Induced Hyponatremia: An Assessment of the International Hydration Recommendations', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8898836/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'water-tying-together',
    category: 'basicHealth',
    title: 'Water & Hydration, Pulled Together',
    teaser: 'The one nutrient in this whole series with no official government target at all, and, outside two specific, identifiable situations, one of the lowest risks of getting wrong.',
    summary: "Water is an unusual entry to close this series on: essential for nearly every bodily process, yet carrying no formal government-set daily target, with thirst itself serving as a generally reliable regulatory signal for most people under ordinary conditions. Danger at the high end (water intoxication) concentrates almost entirely in water-drinking contests and prolonged endurance exercise outpacing sodium loss, not ordinary daily drinking. The Hydration lens already puts this combined-source DRI target (2.7L women / 3.7L men) into practice directly, tracking food and drink together rather than treating \"how many glasses of water\" as the whole picture the way most hydration advice does.",
    citations: [
      { source: 'Water Toxicity, StatPearls, NCBI Bookshelf', url: 'https://www.ncbi.nlm.nih.gov/books/NBK537231/' },
    ],
    overallTier: 'strong',
    relatedIds: ['water-intoxication-hyponatremia'],
  },

  // -- Dietary Fat, added 2026-08-08 -- the last remaining macronutrient
  // in this series. Distinct from the existing Omega-3/6 entry (which
  // covers a specific fat-quality RATIO), this covers fat as its own
  // macronutrient category: real function, and the real, honestly more
  // complicated evidence on saturated-vs-unsaturated fat than either the
  // old "avoid all fat" or the newer "just eat more olive oil" framing
  // suggests. Every citation independently verified via WebSearch, real
  // food-fat values pulled directly from this app's own reference
  // database (fat_total/fat_monounsaturated nutrient codes).
  {
    id: 'dietfat-overview',
    category: 'basicHealth',
    title: 'Dietary Fat: The Most Energy-Dense Macronutrient, and a Required Carrier for Four Vitamins',
    teaser: 'More than twice the calories per gram of protein or carbohydrate, and without it, doses of vitamins A, D, E, and K aren\'t absorbed properly.',
    summary:
      "Fat provides roughly 9 kcal per gram, more than double protein's or carbohydrate's 4 kcal per gram, making it the body's most energy-dense macronutrient and its primary long-term energy reserve. Beyond energy, fat is a structural building block: monounsaturated and polyunsaturated fats are integral components of every cell membrane in the body, directly affecting membrane fluidity and cell signaling. The practical fact: vitamins A, D, E, and K (all four already covered in their own deep-dives in this series) are fat-soluble, meaning adequate absorption requires some dietary fat present in the same meal, eating a vitamin-A-rich salad with a fat-free dressing measurably undercuts how much of that vitamin actually gets absorbed, a concrete reason \"pair it with a source of fat\" is an evidence-based piece of practical advice, not a vague suggestion.",
    citations: [
      { source: 'Dietary Fat, ScienceDirect Topics (Neuroscience)', url: 'https://www.sciencedirect.com/topics/neuroscience/dietary-fat' },
    ],
    overallTier: 'strong',
    relatedIds: ['vitamina-overview', 'vitamind-overview', 'vitamine-overview', 'vitamink-overview'],
  },
  {
    id: 'dietfat-saturated-monounsaturated-honest',
    category: 'basicHealth',
    title: 'Reducing Saturated Fat Really Does Lower Cardiovascular Risk, But the Evidence for Replacing It With Olive Oil Specifically Is Thinner Than Popular Advice Implies',
    teaser: 'A large meta-analysis found cutting saturated fat reduced cardiovascular events by 21%, but the same analysis found clear evidence for the polyunsaturated-fat and carbohydrate replacements, and limited data for monounsaturated fat specifically.',
    summary: "A major meta-analysis of long-term randomized trials (11 trials, 53,300 participants) found reducing saturated fat intake cut combined cardiovascular events by a 21%. The more nuanced part: that same analysis found no significant difference in benefit between replacing saturated-fat calories with polyunsaturated fat versus carbohydrate, while data specifically isolating monounsaturated fat as the replacement was too limited to draw a firm conclusion from at all. This doesn't undermine the separately well-established Mediterranean-diet and olive-oil evidence already covered elsewhere (PREDIMED and its own corrected re-analysis), those trials tested a whole dietary PATTERN, not monounsaturated fat as an isolated nutrient swapped in for saturated fat one-for-one, a different, and less directly comparable, kind of evidence. \"Replace saturated fat with monounsaturated fat specifically\" is a weaker, thinner evidence claim than \"eat an overall Mediterranean dietary pattern\" or \"replace saturated fat with polyunsaturated fat,\" even though popular nutrition advice often treats all three as interchangeable.",
    citations: [
      { source: 'Saturated Fat Restriction for Cardiovascular Disease Prevention: A Systematic Review and Meta-analysis of Randomized Controlled Trials', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12095860/' },
      { source: 'The effect of replacing saturated fat with mostly n-6 polyunsaturated fat on coronary heart disease: a meta-analysis of randomised controlled trials', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5437600/' },
    ],
    overallTier: 'strong',
    relatedIds: ['foodhistory-cholesterol-real-drivers', 'cvd-mediterranean-diet-predimed', 'omega36-overview'],
  },
  {
    id: 'dietfat-food-sources-real-data',
    category: 'basicHealth',
    chart: {
      title: 'Monounsaturated Fat Content of Foods (g per 100g)',
      unit: 'g',
      data: [
        { label: 'Olive oil', value: 70.2 },
        { label: 'Almonds (roasted)', value: 35.1 },
        { label: 'Avocado', value: 9.8 },
      ],
      sourceNote: "This app's own reference database (USDA-sourced values)",
    },
    title: 'Monounsaturated Fat Content of Foods, Directly From The Reference Database',
    teaser: 'Olive oil carries the most concentrated monounsaturated fat of any food in the database, by a wide margin over even almonds or whole avocado.',
    summary: "Direct data from the 22,022-food reference database confirms the popular reputation: olive oil is the single most concentrated monounsaturated-fat source available, at roughly 70g per 100g, with almonds and whole avocado both sources at meaningfully lower concentration. Alongside the evidence entry above: a food being a concentrated source of monounsaturated fat doesn't automatically mean isolated monounsaturated-fat replacement carries the same strength of trial evidence as reducing saturated fat overall or eating a whole Mediterranean dietary pattern.",
    citations: [],
    overallTier: 'strong',
  },
  {
    id: 'dietfat-tying-together',
    category: 'basicHealth',
    title: 'Dietary Fat, Pulled Together',
    teaser: 'A required, energy-dense macronutrient with a practical role in vitamin absorption, and an honest reminder that "replace saturated fat with X" is a more nuanced claim than any single headline usually allows.',
    summary: "Fat closes out this series' macronutrients on an appropriate note: an essential, energy-dense nutrient with concrete, practical consequences (fat-soluble vitamin absorption) most people never connect to their own plate composition, and an evidence-based case for reducing saturated fat that gets less crisp, not more, the closer the actual trial data is examined for what specifically should replace it. The already-built Omega-3/6 balance research, food-industry history (the documented margarine-vs-butter story), and cholesterol research all connect directly to this same macronutrient, worth reading as one connected picture rather than four separate, unrelated fat-related topics.",
    citations: [
      { source: 'Dietary Fat, ScienceDirect Topics (Neuroscience)', url: 'https://www.sciencedirect.com/topics/neuroscience/dietary-fat' },
    ],
    overallTier: 'strong',
    relatedIds: ['dietfat-saturated-monounsaturated-honest', 'foodhistory-scapegoat-margarine', 'foodhistory-butter-short-chain-fat'],
  },
];
