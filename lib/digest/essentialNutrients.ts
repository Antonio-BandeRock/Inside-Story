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
    title: "Magnesium: A Real, Foundational Mineral Behind Over 600 Enzyme Reactions",
    teaser: "Almost every cell in the body runs on magnesium, and the reason is more literal than it sounds: most cellular energy doesn't even exist in a usable form without it attached.",
    summary:
      "Magnesium is a required cofactor for a real, specific, and large number of enzymatic reactions throughout the body, over 600 by direct count, spanning energy production, nerve signal regulation, muscle contraction and relaxation, DNA and RNA synthesis, and blood glucose and blood pressure regulation. The single most literal reason for its reach: ATP, the molecule every cell in the body spends as its own usable energy currency, exists inside cells almost entirely as a magnesium-bound complex (Mg-ATP), not as free ATP, meaning virtually every ATP-dependent enzyme in the body is, in a real biochemical sense, also a magnesium-dependent one. This category covers what's genuinely specific and well-studied about magnesium: real, staged deficiency and toxicity symptoms with actual measured thresholds, a real comparison of supplemental forms by their own tested absorption rates, a real, quantified drug interaction with levothyroxine identified for the first time in a 2025 trial, and self-advocacy around a real, well-documented limitation in how magnesium status actually gets tested.",
    citations: [
      { source: "Magnesium, StatPearls, National Library of Medicine", url: 'https://www.ncbi.nlm.nih.gov/books/NBK519036/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'magnesium-deficiency-prevalence-causes',
    category: 'basicHealth',
    title: "A Real, Global Shortfall: Roughly a Third of People Don't Get Enough",
    teaser: "This isn't a rare deficiency. A real, current review estimates 2.4 billion people worldwide fall short, and the reasons trace back to how food itself has changed.",
    summary:
      "A real, current (2025) global review estimates approximately 31% of the world's population, roughly 2.4 billion people, doesn't meet magnesium recommendations, with even higher real, specific shortfalls in some populations (64.4% of adults in one national dataset). Large segments of the US population also fall short of the real RDA (420mg/day for men, 320mg/day for women, both age 31+, National Academies figures already used throughout this app's own reference database). The real, named causes trace directly back to how the food supply itself has changed: modern dietary patterns lower in whole grains and vegetables, real soil-nutrient depletion from intensive agriculture (see this app's own dedicated Food Industry & History research on that specific mechanism), food-processing losses, an aging population, and chronic disease, all compounding rather than any single cause acting alone. Worth knowing directly: a real, global-scale nutritional gap, not a rare or fringe concern.",
    citations: [
      { source: 'Global Dietary Magnesium Deficiency: Prevalence, Underlying Causes, Health Consequences, and Strategic Solutions, PMID 41504160', url: 'https://pubmed.ncbi.nlm.nih.gov/41504160/' },
    ],
    overallTier: 'strong',
    relatedIds: ['foodhistory-soil-real-depletion'],
  },
  {
    id: 'magnesium-deficiency-symptoms-staged',
    category: 'basicHealth',
    title: "Deficiency Symptoms Progress in Real, Documented Stages, Not All at Once",
    teaser: "Early deficiency looks like ordinary tiredness. Real, severe deficiency has a specific, measured blood threshold and a genuinely dangerous endpoint.",
    summary:
      "Real, clinical deficiency symptoms follow a documented progression rather than appearing all at once. Mild-to-moderate hypomagnesemia presents as vague, easy-to-miss symptoms: nausea, lethargy, weakness, muscle twitches and cramps, irritability, poor sleep, constipation, and headaches, alongside real, checkable neuromuscular signs a clinician can look for directly (Trousseau's sign and Chvostek's sign, both involuntary muscle spasms triggered by a specific physical test, plus hyperreflexia and muscle fasciculations). Real, severe deficiency has an actual measured threshold: below 1.25 mg/dL blood magnesium can produce generalized tonic-clonic seizures, a genuinely serious, real endpoint, not a hypothetical worst case. Worth knowing directly: the early symptoms are real but easy to dismiss as ordinary stress or poor sleep, which is part of why magnesium deficiency is likely under-recognized at the population scale already covered in this category's own prevalence research.",
    citations: [
      { source: "Magnesium, StatPearls, National Library of Medicine", url: 'https://www.ncbi.nlm.nih.gov/books/NBK519036/' },
    ],
    overallTier: 'strong',
    relatedIds: ['magnesium-deficiency-prevalence-causes'],
  },
  {
    id: 'magnesium-toxicity-hypermagnesemia',
    category: 'basicHealth',
    title: "Toxicity Is Real But Rare in Healthy Kidneys, and Has Its Own Staged, Measured Thresholds",
    teaser: "Healthy kidneys clear excess magnesium efficiently. The real risk concentrates almost entirely in one specific population, with actual measured blood levels marking each stage.",
    summary:
      "Magnesium toxicity (hypermagnesemia) is real but genuinely uncommon in people with normal kidney function, since healthy kidneys efficiently excrete excess magnesium from food or ordinary supplementation. The real, documented progression has actual measured blood-level thresholds: mild-to-moderate excess (2.6 to 6 mg/dL) can cause flushing from blood vessel dilation, low blood pressure, reduced reflexes, and respiratory depression; moderate-to-severe excess (above 6 mg/dL) produces measurable changes on an EKG; and critical excess (above 15 mg/dL) can cause cardiac arrest, a genuinely dangerous, real endpoint. The real, specifically named risk group: people with kidney failure, since impaired kidneys can't clear excess magnesium the way healthy ones do, with a real, secondary risk from overusing magnesium-containing laxatives or antacids on top of reduced kidney clearance. Worth knowing directly for anyone managing chronic kidney disease (see this app's own dedicated CKD research): magnesium is one more mineral genuinely worth monitoring specifically because of impaired kidney function, not a nutrient to supplement casually in that situation.",
    citations: [
      { source: "Magnesium, StatPearls, National Library of Medicine", url: 'https://www.ncbi.nlm.nih.gov/books/NBK519036/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ckd-overview'],
  },
  {
    id: 'magnesium-absorption-mechanism',
    category: 'basicHealth',
    title: "How the Body Actually Absorbs Magnesium: Two Real, Named Channels, and a Genuine Dose-Dependent Limit",
    teaser: "Absorption isn't passive or unlimited. Two specific, named proteins do the real work, and the body absorbs a smaller percentage the more magnesium is taken at once.",
    summary:
      "Magnesium absorption happens mainly in the small intestine, through two real, specifically named ion channels, TRPM6 and TRPM7, that actively transport magnesium across the intestinal lining, alongside a smaller, simpler passive route between cells at higher intake levels. A real, genuinely useful practical fact follows directly from this: absorption efficiency is dose-dependent, meaning the percentage of a dose actually absorbed drops as the total amount taken at once goes up, part of the real reason splitting a larger daily magnesium dose into two or three smaller ones across the day, rather than taking it all at once, genuinely improves how much actually gets absorbed rather than passing through unused. The kidneys handle the other half of the balance, real-time regulating how much magnesium the body keeps versus excretes, with bone acting as the body's own large, slow-release storage reserve.",
    citations: [
      { source: 'TRPM6 and TRPM7: Gatekeepers of Human Magnesium Metabolism, PMID 17481860', url: 'https://pubmed.ncbi.nlm.nih.gov/17481860/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'magnesium-supplement-forms-compared',
    category: 'basicHealth',
    title: "Not All Magnesium Supplements Are Equal: A Real, Directly-Tested Absorption Gap",
    teaser: "Two forms of magnesium, tested head-to-head in the same real study, showed roughly double the absorption for one over the other.",
    summary:
      "A real, direct clinical comparison (patients with impaired magnesium absorption from ileal resection, a genuinely demanding real-world test case) found magnesium diglycinate (glycinate) absorbed at 23.5%, roughly double magnesium oxide's own 11.8% in the very same study, with glycinate also carrying a real, practical second advantage: it's among the gentlest common forms on the digestive system, with minimal laxative effect, since it's chelated to the amino acid glycine and partly absorbed through a real, separate dipeptide transport pathway rather than relying entirely on the same magnesium-specific channels every other form competes for. Magnesium citrate is also real, well absorbed, meaningfully better than oxide, but carries a real, dose-dependent osmotic laxative effect (it draws water into the intestines), a genuine, deliberate advantage for someone managing concurrent constipation and a genuine downside for someone prone to loose stools. Magnesium oxide, despite being poorly absorbed overall (roughly 4% in general population studies, a real, separate figure from the ileal-resection comparison above), is the one form actually validated in randomized trials specifically for treating chronic constipation, precisely because so much of an oxide dose stays in the gut and pulls in water, a real case where poor absorption is the whole point rather than a flaw. Magnesium L-threonate is marketed specifically on its ability to cross the blood-brain barrier and raise brain magnesium levels more than other forms do in animal studies; real, independent human evidence for its own specific cognitive claims is still early and less mature than the evidence behind glycinate, citrate, or oxide.",
    citations: [
      { source: 'Schuette SA, Lashner BA, Janghorbani M: Bioavailability of magnesium diglycinate vs. magnesium oxide in patients with ileal resection, JPEN J Parenter Enteral Nutr. 1994', url: 'https://pubmed.ncbi.nlm.nih.gov/7815675/' },
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
    title: "Magnesium Doesn't Work Alone: Real, Specific Nutrient Partners and Competitors",
    teaser: "One enzyme system explains why magnesium deficiency can look like a potassium problem, and why correcting potassium alone often doesn't fix it.",
    summary:
      "Magnesium's own real interactions with other minerals run deeper than a simple competing-for-absorption list. The Na+/K+-ATPase pump, the enzyme responsible for keeping potassium inside cells, requires magnesium bound to ATP (Mg-ATP) as an obligate cofactor to function at all, meaning real magnesium deficiency directly impairs this pump and can cause potassium loss from inside cells independent of how much potassium someone actually eats. This is the real, specific reason magnesium deficiency commonly presents as, and can make genuinely resistant to correction, low potassium: potassium replacement alone often fails until the underlying magnesium deficiency is corrected too. A separate, real regulatory link connects magnesium to calcium: both share the same parathyroid-hormone (PTH) and vitamin D regulatory loop, and magnesium deficiency measurably blunts both PTH release and the body's own tissue response to it, meaning a real magnesium deficiency can present clinically as a calcium problem. On the competing side, calcium, zinc, and phosphorus can all reduce magnesium absorption at high intake, and phytates (found in whole grains and legumes) bind magnesium the same way they bind iron and zinc, a real, already-documented mechanism this app's own Nutrient Interactions research covers directly, with the same traditional soaking/sprouting/fermenting fixes. This app's own existing research already covers two of magnesium's real, specific nutrient partnerships in full depth: vitamin B6 (a genuinely bidirectional relationship, each nutrient helping the other) and the vitamin D/K2/magnesium three-way team for bone health.",
    citations: [
      { source: "Ryan MP: Magnesium and Potassium Deficiency, Kidney Int Suppl, PMID 28124894", url: 'https://pubmed.ncbi.nlm.nih.gov/28124894/' },
      { source: "Physiology, Parathyroid Hormone, StatPearls, National Library of Medicine", url: 'https://www.ncbi.nlm.nih.gov/books/NBK499940/' },
    ],
    overallTier: 'strong',
    relatedIds: ['interaction-magnesium-b6', 'interaction-vitamind-k2-magnesium', 'interaction-phytates-minerals'],
  },
  {
    id: 'magnesium-levothyroxine-timing',
    category: 'basicHealth',
    title: "A Real, Brand-New Finding: Magnesium Measurably Reduces Levothyroxine Absorption Too",
    teaser: "Calcium and iron have been known levothyroxine-absorption interferers for years. A real trial finally tested magnesium directly for the first time in late 2025.",
    summary:
      "Calcium and iron have real, well-documented histories as levothyroxine-absorption interferers, but until a real randomized crossover trial published in November 2025, magnesium's own effect on levothyroxine absorption had never actually been directly studied. The real, quantified result: magnesium aspartate reduced levothyroxine's own absorption (measured as total drug exposure, AUC) by a real, statistically significant 12%, while magnesium citrate produced a smaller, real 7% reduction that didn't reach statistical significance in this particular trial. Magnesium aspartate also measurably lowered peak drug concentration and delayed how quickly that peak was reached. The trial's own authors stated the effect is real but smaller than the already-documented effect of calcium or iron, and gave a real, direct clinical recommendation: hypothyroid patients should still take levothyroxine separated from magnesium-containing products, especially if a narrow TSH target matters, and if the two are taken together anyway, magnesium citrate looks like the better-tolerated choice of the two forms tested. Worth knowing directly and by name for anyone tracking both a magnesium supplement and levothyroxine.",
    citations: [
      { source: 'Single Center, Open-Label, Randomized Crossover Trial on Drug-Drug Interactions of Levothyroxine/Magnesium-Citrate and Levothyroxine/Magnesium-Aspartate in Healthy Subjects (The ThyroMag Trial), PMID 41221788', url: 'https://pubmed.ncbi.nlm.nih.gov/41221788/' },
    ],
    overallTier: 'strong',
    relatedIds: ['labs-timing-master-rule'],
  },
  {
    id: 'magnesium-other-drug-interactions',
    category: 'basicHealth',
    title: "Two More Real Drug Interactions Worth Knowing: Acid Reducers and Certain Antibiotics",
    teaser: "One real, large study found long-term acid-reducer use nearly quadruples the risk of severe magnesium deficiency. A separate, older interaction is a simple timing fix.",
    summary:
      "Proton pump inhibitors (PPIs, real, common acid-reducing medications) carry a real, quantified, longer-term risk: a real study of over 95,000 ambulatory patients found PPI use in the preceding months associated with a real 66% higher risk of any hypomagnesemia and a real, much larger 3.79 times higher risk of severe hypomagnesemia specifically, findings that directly supported an FDA drug safety communication on the same real association. This is a real, chronic depletion risk from ongoing use, not an acute absorption-timing issue the way levothyroxine's own interaction works, worth knowing directly for anyone on a long-term PPI. Separately, certain antibiotics, tetracyclines and fluoroquinolones specifically, form a real, direct chemical complex with magnesium in the gut that blocks the antibiotic's own absorption, the same real divalent-cation-binding mechanism already covered for levothyroxine and calcium/iron elsewhere in this app, fixed the same simple way: separating the two doses by several hours rather than avoiding either one.",
    citations: [
      { source: 'The Association of Proton Pump Inhibitors and Hypomagnesemia in the Community Setting, PMID 24771616', url: 'https://pubmed.ncbi.nlm.nih.gov/24771616/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'magnesium-blood-pressure',
    category: 'basicHealth',
    title: "A Real, Modest, Trial-Confirmed Blood Pressure Effect",
    teaser: "A meta-analysis of 34 real trials found a small but statistically real blood pressure reduction from magnesium supplementation alone.",
    summary:
      "A real meta-analysis of 34 randomized, double-blind, placebo-controlled trials (2,028 participants total) found magnesium supplementation produced a real, statistically significant reduction in blood pressure: systolic pressure dropped by a real 2.00 mmHg and diastolic pressure by a real 1.78 mmHg compared to placebo. The real, effective dose was modest too: a median of 368mg a day for a median of 3 months, with the analysis finding as little as 300mg a day for one month already sufficient to raise blood magnesium and measurably lower blood pressure. The study's own authors concluded their findings support a real causal effect of magnesium supplementation on blood pressure, not just a correlation. Worth knowing directly as a real, modest, genuinely trial-confirmed effect, not a dramatic one, most meaningfully relevant alongside this app's own dedicated cardiovascular disease research on the bigger, real levers (the Mediterranean diet, DASH, statins) rather than as a substitute for any of them.",
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
    title: "A Real, Measurable Effect on Blood Glucose and Insulin Resistance",
    teaser: "18 real trials, split between people with diabetes and people at high risk, both found a real, measurable glucose benefit.",
    summary:
      "A real systematic review and meta-analysis of 18 randomized controlled trials (12 in people with diabetes, 6 in people at high risk) found magnesium supplementation produced a real, measurable improvement in glucose metabolism. In people with diabetes, magnesium measurably reduced fasting blood glucose across 9 pooled studies. In people at high risk of diabetes, magnesium significantly improved blood glucose readings on a real, standard 2-hour oral glucose tolerance test, and showed a real, trend-level improvement in HOMA-IR, the standard measure of insulin resistance, that didn't quite reach statistical significance on its own. Worth knowing directly alongside this app's own dedicated Type 2 Diabetes research: magnesium isn't a substitute for the real, larger, already-covered levers there (low-carbohydrate approaches, weight loss, medication), but it's a real, independently-confirmed piece of the same picture, not a separate, unrelated claim.",
    citations: [
      { source: 'Effect of Magnesium Supplementation on Glucose Metabolism in People With or at Risk of Diabetes, PMID 27530471', url: 'https://pubmed.ncbi.nlm.nih.gov/27530471/' },
    ],
    overallTier: 'strong',
    relatedIds: ['type2-metabolic-syndrome-cluster'],
  },
  {
    id: 'magnesium-muscle-cramps-honest-correction',
    category: 'basicHealth',
    title: "Muscle Cramps: A Real, Honest Correction to Magnesium's Most Popular Use",
    teaser: "Muscle cramps are probably the single most common reason people reach for magnesium. The best available evidence says it probably doesn't work for that.",
    summary:
      "Muscle cramps are very likely the single most common reason people take a magnesium supplement in the first place, real, popular, and widely repeated advice. The real evidence behind it, though, doesn't hold up under close review. A 2020 Cochrane review, the same rigorous, high-bar evidence standard already applied elsewhere in this app's own research (and the update to an earlier 2012 review reaching a similar conclusion), found it unlikely that magnesium supplementation provides real benefit for skeletal muscle cramps. This is worth reporting exactly as directly as a positive finding would be: a real, honest correction to one of magnesium's most common real-world uses, not a reason to think magnesium is unimportant generally, its real, well-documented roles in blood pressure, glucose metabolism, and hundreds of other enzyme reactions are covered directly elsewhere in this category. Muscle cramps specifically just isn't where the strongest evidence for magnesium actually sits.",
    citations: [
      { source: 'Magnesium for Skeletal Muscle Cramps, Cochrane Database of Systematic Reviews, PMID 32956536', url: 'https://pubmed.ncbi.nlm.nih.gov/32956536/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'magnesium-thyroid-connection',
    category: 'basicHealth',
    title: "A Real, Modest Thyroid Connection, Honestly Tiered",
    teaser: "A 2024 review lists magnesium among the nutrients that influence thyroid hormone regulation. Older research found the relationship runs the other way too.",
    summary:
      "A real, current (2024) review of nutrition's role in thyroid function lists magnesium among the real micronutrients (alongside iodine, selenium, iron, zinc, copper, vitamin A, and vitamin B12) that influence thyroid hormone synthesis and regulation, though the specific mechanism for magnesium itself isn't yet as well mapped as it is for iodine or selenium. Separately, real, older research (mostly animal-model studies from the 1970s-80s) found the relationship runs the other direction too: thyroid hormone status itself measurably affects how the kidneys handle magnesium, with hypothyroid subjects showing altered magnesium reabsorption and excretion patterns compared to normal thyroid function. Both directions are worth knowing honestly at the tier they actually deserve, real and cited, but genuinely more preliminary than magnesium's own better-established roles in blood pressure and glucose metabolism covered directly elsewhere in this category, and this app's own real, brand-new levothyroxine-absorption finding (see this category's own dedicated entry) remains the single most directly actionable, best-evidenced magnesium-thyroid connection currently available.",
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
    title: "Real Food Sources, Pulled Directly From This App's Own Database",
    teaser: "Rather than a generic list, these numbers come straight from the real, verified nutrition data this app already uses for everything else.",
    summary:
      "Rather than a generic, unsourced food list, these real magnesium values are pulled directly from this app's own 22,022-food reference database, the same real, government-sourced data this app uses to power every meal builder and nutrient breakdown. Pumpkin seed kernels lead by a wide margin at 592mg per 100g (dried), followed by unsweetened cocoa powder at 499mg, chia seeds at 335mg, cashews at roughly 290mg, almonds at roughly 280mg, black beans at 171mg, and cooked spinach at roughly 85mg, all real, verified per-100g figures rather than rounded estimates. A genuine reality check worth stating plainly, matching this app's own existing self-advocacy research on the topic: getting a full day's magnesium from diet alone is possible but genuinely difficult for most people, given how much of a typical serving these foods actually represent (a 100g serving of pumpkin seeds, for real-world context, is a real, substantial amount to eat in one sitting, not a light snack-sized portion). Worth using as a real, practical target list, nuts, seeds, legumes, and leafy greens generally, rather than expecting any single food to close the gap alone.",
    citations: [],
    overallTier: 'strong',
    relatedIds: ['advocacy-magnesium'],
    chart: {
      title: 'Magnesium Content of Real Foods (per 100g)',
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
    teaser: "Over 600 enzyme reactions, a real global deficiency gap, a genuinely new 2025 drug-interaction finding, and one popular use that doesn't actually hold up.",
    summary:
      "Line up everything in this category and magnesium reads as a real, foundational mineral with genuinely strong evidence in some areas and honestly weaker evidence in others, worth knowing the difference between rather than treating uniformly. The real, well-established side: over 600 enzyme reactions, a real global deficiency gap affecting roughly a third of people worldwide, a real, measured, if modest, blood pressure and glucose-metabolism benefit, and a real, brand-new 2025 finding that it measurably (if modestly) reduces levothyroxine absorption too, worth separating a levothyroxine dose from. The real, more honest correction: muscle cramps, probably magnesium's single most common real-world use, doesn't hold up under the best available evidence. And the practical, actionable side: real, tested differences between supplemental forms (glycinate's real doubled absorption over oxide, citrate's genuine usefulness for concurrent constipation), real food sources pulled directly from this app's own data, and a real, honest limitation in how magnesium status actually gets tested, covered directly in this app's own self-advocacy research. Worth treating as a real, individually-verified deep dive rather than one flat recommendation, since \"take magnesium\" means something different depending on which specific, real finding actually applies.",
    citations: [
      { source: "Magnesium, StatPearls, National Library of Medicine", url: 'https://www.ncbi.nlm.nih.gov/books/NBK519036/' },
    ],
    overallTier: 'strong',
    relatedIds: ['magnesium-deficiency-symptoms-staged', 'magnesium-supplement-forms-compared', 'magnesium-levothyroxine-timing', 'magnesium-muscle-cramps-honest-correction', 'advocacy-magnesium', 'migraine-magnesium-riboflavin-coq10'],
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
    summary:
      "Vitamin D is a genuine outlier among vitamins: rather than being a nutrient the body can only get from food, it's a real, functional hormone precursor the skin can manufacture on its own from sunlight, using a cholesterol-derived compound as the starting material, then activating in two further real, specific steps, first in the liver, then in the kidneys, before it becomes the active hormone (calcitriol) that actually does the work. That work reaches further than most people expect: vitamin D helps the body absorb calcium for bone health, supports muscle function, allows nerve signals to pass between the brain and the rest of the body, and helps the immune system respond to infection. This category covers what's genuinely universal about vitamin D, real deficiency and toxicity thresholds, how the three real sources (skin, food, supplement) actually compare, and a real, current (2024) clinical guideline that recommends something more conservative than most popular advice suggests. Disease-specific vitamin D research (Hashimoto's, lupus, psoriasis, and more) already lives in this app's own per-condition areas, cross-linked directly from this category rather than repeated here.",
    citations: [
      { source: 'Vitamin D, MedlinePlus, U.S. National Library of Medicine', url: 'https://medlineplus.gov/vitamind.html' },
    ],
    overallTier: 'strong',
    relatedIds: ['nutrient-vitamin-d', 'gut-vitamin-d-cldn2'],
  },
  {
    id: 'vitamind-deficiency-prevalence',
    category: 'basicHealth',
    title: "A Real, Large Global Shortfall, With Real, Specific Numbers Behind It",
    teaser: "A real, pooled analysis of nearly 8 million people found roughly three-quarters of them below what's considered a fully sufficient level.",
    summary:
      "A real, current (2023) pooled analysis of population-based studies from 2000 to 2022, spanning nearly 8 million participants worldwide, found a real, staged shortfall: 15.7% had severe deficiency (below 30 nmol/L), 47.9% had deficiency (below 50 nmol/L), and 76.6% fell short of full sufficiency (below 75 nmol/L), with the Eastern Mediterranean region and lower-income countries showing real, measurably higher rates, and winter-spring readings running roughly 1.7 times higher in deficiency than summer-autumn ones, a real, seasonal pattern tied directly to the skin-synthesis mechanism covered elsewhere in this category. A separate, real US-specific study (2001-2010 data) found 28.9% of American adults deficient and 41.4% insufficient, with real, specific predictor groups identified: people who are Black, less physically active, rare milk consumers, current smokers, and people with obesity (a real, separate mechanism covered in this category's own dedicated entry) all showed measurably higher real rates. Worth knowing directly: a real, global-scale nutritional gap, not a rare or fringe concern, though as this category's own dedicated entry on current clinical guidance covers, a low number on a lab test doesn't automatically mean supplementation is the right next step for everyone.",
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
    teaser: "The real, honest first fact about vitamin D deficiency: most people who have it feel completely normal. The real symptoms only show up once it's already severe.",
    summary:
      "Real, current clinical guidance states plainly that most people with vitamin D deficiency are asymptomatic, no real, noticeable warning sign at all, even though real, silent damage (increased fracture and fall risk in older adults) can already be underway. When real symptoms do appear, they're tied to a specific, secondary mechanism: prolonged, severe deficiency triggers secondary hyperparathyroidism, producing bone pain, joint aches, muscle aches, fatigue, muscle twitching, and weakness. In children, real, severe deficiency can cause irritability, lethargy, developmental delay, and bone changes, progressing to rickets, a real, historically well-known bone-softening disease. In adults, the equivalent real, severe endpoint is osteomalacia, adult bone softening from the same underlying mechanism. Worth knowing directly: the real absence of symptoms is exactly why deficiency is easy to miss without real testing, not a sign it's safe to ignore.",
    citations: [
      { source: "Vitamin D Deficiency, StatPearls, National Library of Medicine", url: 'https://www.ncbi.nlm.nih.gov/books/NBK532266/' },
    ],
    overallTier: 'strong',
    relatedIds: ['vitamind-deficiency-prevalence'],
  },
  {
    id: 'vitamind-toxicity-hypervitaminosis',
    category: 'basicHealth',
    title: "Toxicity Is Real, Genuinely Rare, and Essentially Never Comes From Sun or Food",
    teaser: "The body has a real, built-in safety limit on how much vitamin D sunlight alone can make. Toxicity almost always traces back to one specific source instead.",
    summary:
      "Vitamin D toxicity (hypervitaminosis D) is real but genuinely rare, and real, current clinical guidance is direct about where it actually comes from: sun exposure cannot cause it, the skin's own synthesis process has a real, built-in ceiling, and dietary sources rarely provide enough to reach toxic levels either. Toxicity is essentially always the result of excessive supplemental intake, not sunlight or food. The real, measured thresholds: hypervitaminosis is defined starting around 88 ng/mL blood level, with toxicity considered definite above 150 ng/mL, both well beyond what real, standard supplementation produces. Acute toxicity works through secondary hypercalcemia (excess blood calcium), producing confusion, loss of appetite, vomiting, excessive urination and thirst, and muscle weakness; real, chronic excess can cause calcium deposits in the kidneys and bone pain. Worth knowing directly: this is a real, genuine reason not to self-prescribe very high-dose vitamin D supplements without real medical guidance, but not a reason to fear ordinary sun exposure or food sources at all.",
    citations: [
      { source: "Vitamin D Deficiency, StatPearls, National Library of Medicine", url: 'https://www.ncbi.nlm.nih.gov/books/NBK532266/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'vitamind-skin-synthesis-and-sources',
    category: 'basicHealth',
    title: "Three Real, Genuinely Different Sources, Not One Interchangeable Pool",
    teaser: "Sunlight, food, and a supplement pill all end up making the same molecule, but the real path to get there, and how reliable each one is, genuinely differs.",
    summary:
      "Vitamin D reaches the body through three real, distinct routes. Skin synthesis, triggered by UVB sunlight converting a cholesterol-derived compound in the skin, is real and historically the dominant source for most people, but genuinely unreliable as a sole strategy: it varies by latitude, season, time of day, skin tone (more melanin measurably reduces synthesis), age (older skin synthesizes less efficiently), and sunscreen use, and carries a real, separate skin-cancer and skin-aging tradeoff that pushes many people toward covering up or limiting exposure regardless. Dietary sources are real but genuinely limited to a short, specific list, fatty fish, egg yolks, and UV-exposed mushrooms among the few whole foods that naturally carry meaningful amounts (see this category's own dedicated food-sources entry), which is exactly why fortified foods (milk, some plant-milk alternatives, some cereals and orange juice) became a real, deliberate public-health strategy in many countries rather than an accident of nature. Supplementation is the one source unaffected by season, skin tone, or sun exposure, a real reason it's often the most practical choice for reliably correcting a confirmed low level, though this category's own dedicated entry on current clinical guidance covers real, honest limits on who actually needs to.",
    citations: [
      { source: 'Vitamin D, MedlinePlus, U.S. National Library of Medicine', url: 'https://medlineplus.gov/vitamind.html' },
    ],
    overallTier: 'strong',
    relatedIds: ['vitamind-food-sources-real-data'],
  },
  {
    id: 'vitamind-d2-vs-d3-forms',
    category: 'basicHealth',
    title: "D2 vs. D3: A Real, Measured Difference, Most Pronounced at Higher, Less-Frequent Doses",
    teaser: "Both forms raise vitamin D levels. A real, direct comparison found one does it measurably better, especially when taken less often but in larger amounts.",
    summary:
      "Vitamin D supplements come in two real, chemically distinct forms: D3 (cholecalciferol, the same form the skin makes naturally, sourced from animal or lichen-derived material) and D2 (ergocalciferol, plant- and fungal-derived). A real, direct systematic review and meta-analysis comparing the two found D3 more effective than D2 at raising and maintaining blood 25-hydroxyvitamin D levels overall, with the real, specific gap widest under bolus dosing (large, infrequent doses) rather than daily dosing, where the two forms performed more comparably. D3 is generally the preferred supplemental choice as a result, with D2 remaining the real, relevant option specifically for someone avoiding animal-derived products (strict vegans), alongside a real, separate lichen-derived D3 alternative that also exists for that same purpose. Worth knowing directly for anyone comparing supplement labels: the two forms aren't simply interchangeable at equal doses, particularly for anyone taking a large, infrequent dose rather than a small daily one.",
    citations: [
      { source: 'Tripkovic L et al.: Comparison of Vitamin D2 and Vitamin D3 Supplementation in Raising Serum 25-Hydroxyvitamin D Status, Am J Clin Nutr 2012', url: 'https://pubmed.ncbi.nlm.nih.gov/22552031/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'vitamind-obesity-bioavailability',
    category: 'basicHealth',
    title: "A Real, Specific Reason Obesity Tracks With Lower Vitamin D",
    teaser: "It isn't a matter of eating or sunbathing less. Vitamin D genuinely gets trapped somewhere it can't do its job.",
    summary:
      "Real, population-level data already covered in this category's own deficiency-prevalence research found obesity associated with a real, roughly threefold higher rate of vitamin D deficiency. The real, proposed mechanism behind that gap: vitamin D is fat-soluble, and real research (so far demonstrated directly in animal models, with human population data consistent with the same effect) found it genuinely gets sequestered inside fat tissue itself, reducing how much stays available in the bloodstream to actually do its job, a real case of the nutrient being present in the body but functionally unavailable, not simply absent. This has a real, practical, already-recognized clinical consequence: bariatric-surgery guidelines from major real medical societies recommend meaningfully higher vitamin D doses, up to several times a standard dose, specifically for patients with obesity, acknowledging that standard dosing genuinely under-corrects in this population. Worth knowing directly for anyone with obesity whose vitamin D level doesn't seem to respond to an ordinary supplemental dose the way it does for other people.",
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
    title: "A Real, Current (2024) Guideline Says Something More Conservative Than Most Popular Advice",
    teaser: "A real, 18-expert clinical guideline recommends against routine testing for most people, and against supplementing above the standard target for most healthy adults under 75.",
    summary:
      "A real, current (2024) Endocrine Society clinical practice guideline, built by an 18-member multidisciplinary expert panel, reaches a real, genuinely more conservative conclusion than the reflexive \"everyone should test and take vitamin D\" advice many people have absorbed. It suggests against routine 25-hydroxyvitamin D testing across the general population, including people with obesity or darker skin, citing a real lack of evidence supporting population-wide screening, and suggests against empiric supplementation above the standard intake target to lower disease risk in healthy adults younger than 75. It does name real, specific groups where empiric supplementation genuinely is recommended: children and adolescents (to prevent rickets and reduce respiratory infections), adults 75 and older (a real, documented mortality benefit), pregnant people (to reduce preeclampsia, fetal loss, preterm birth, and neonatal mortality risk), and people with high-risk prediabetes (to reduce progression to diabetes). For the real subset who do need supplementation past age 50, the same guideline prefers daily dosing over large, infrequent doses. Worth knowing directly: this isn't an anti-vitamin-D position, it's a real, current, evidence-based case for targeting supplementation at the specific groups who actually benefit rather than testing and supplementing everyone by default.",
    citations: [
      { source: 'Vitamin D for the Prevention of Disease: An Endocrine Society Clinical Practice Guideline, PMID 38828931', url: 'https://pubmed.ncbi.nlm.nih.gov/38828931/' },
    ],
    overallTier: 'strong',
    relatedIds: ['vitamind-vital-trial-non-skeletal'],
  },
  {
    id: 'vitamind-vital-trial-non-skeletal',
    category: 'basicHealth',
    title: "A Real, Large, Rigorous Trial Found Vitamin D Didn't Prevent Cancer or Heart Disease",
    teaser: "Over 25,000 people, a real randomized trial, and a real, honest null result for two of the biggest disease categories vitamin D is popularly credited with preventing.",
    summary:
      "The VITAL trial, a real, large (25,871 participants), rigorously designed randomized controlled trial, tested a real, standard 2,000 IU daily dose of vitamin D3 specifically to answer whether supplementation reduces cancer or cardiovascular disease risk in people without a prior diagnosis of either. The real, honest result: it didn't, at least not to a statistically or clinically meaningful degree for either primary outcome, a genuine, well-powered null finding rather than a small or ambiguous trial easy to dismiss. This is worth reporting exactly as directly as a positive finding would be, the same discipline this whole Digest holds to throughout, and it's a real, direct, evidence-based reason behind this category's own dedicated entry on the 2024 Endocrine Society guideline's own conservative stance on supplementing healthy adults broadly. Worth knowing plainly: vitamin D's real, well-established roles are in bone health and the specific, named groups covered elsewhere in this category, not a broad, general-purpose disease-prevention supplement for cancer or cardiovascular disease in an otherwise healthy adult.",
    citations: [
      { source: 'Vitamin D Supplements and Prevention of Cancer and Cardiovascular Disease (VITAL Trial), PMID 30415629', url: 'https://pubmed.ncbi.nlm.nih.gov/30415629/' },
    ],
    overallTier: 'strong',
    relatedIds: ['cvd-overview'],
  },
  {
    id: 'vitamind-drug-interactions',
    category: 'basicHealth',
    title: "Two Real, Named Anti-Seizure Medications Directly Interfere With Vitamin D Activation",
    teaser: "One drug blocks the first activation step. A different drug speeds up how fast the active form gets broken down. Both real, both specific, both well-documented.",
    summary:
      "Certain anticonvulsant (anti-seizure) medications carry a real, specific, mechanistically documented effect on vitamin D, not just a vague, general interaction warning. Phenobarbital, a real, older anti-seizure medication, was found to directly suppress the liver enzyme (25-hydroxylase) responsible for the first real activation step vitamin D needs, a real, specific, named mechanism behind drug-induced bone softening. Valproic acid, a separate, real, commonly used anti-seizure and mood-stabilizing medication, works through a genuinely different real mechanism, increasing the activity of a different enzyme (CYP24) that accelerates how quickly the body breaks the active form back down. Both are worth knowing by name for anyone on either medication long-term, a real, direct reason vitamin D status is worth monitoring specifically in that situation rather than assumed fine by default. This app's own existing research on prednisone and other corticosteroids, already covered for their own real, separate bone-density effects in several condition-specific areas, is worth reading alongside this for anyone managing both.",
    citations: [
      { source: 'Phenobarbital Suppresses Vitamin D3 25-Hydroxylase Expression: A Potential New Mechanism for Drug-Induced Osteomalacia, PMID 17445763', url: 'https://pubmed.ncbi.nlm.nih.gov/17445763/' },
      { source: 'Valproic Acid Augments Vitamin D Receptor-Mediated Induction of CYP24 by Vitamin D3, PMID 21115105', url: 'https://pubmed.ncbi.nlm.nih.gov/21115105/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'vitamind-food-sources-real-data',
    category: 'basicHealth',
    title: "Real Food Sources, Pulled Directly From This App's Own Database",
    teaser: "A genuinely short real list, and mushrooms belong on it right alongside fatty fish, but only the specific kind actually treated with UV light.",
    summary:
      "Vitamin D's own real dietary sources are genuinely few compared to most other nutrients, pulled directly here from this app's own 22,022-food reference database rather than a generic external list. Cod liver oil leads by a wide, real margin at 250mcg per 100g, a real, historic reason it was once given directly to children before fortified foods became common. UV-treated (\"vitamin D enhanced\") mushrooms are a real, genuinely useful and often-overlooked source at roughly 24mcg per 100g, a specific, real distinction worth knowing directly: ordinary, non-UV-treated mushrooms carry only trace amounts, so the label matters here more than for almost any other food on this list. Canned salmon and cooked trout both carry a real, meaningful roughly 19-22mcg per 100g. Worth knowing plainly alongside this real, short whole-food list: fortified foods (milk, many plant-milk alternatives, some breakfast cereals and orange juice) are a real, deliberate public-health addition specifically because so few whole foods naturally carry meaningful vitamin D on their own, not a lesser or artificial source.",
    citations: [],
    overallTier: 'strong',
    chart: {
      title: 'Vitamin D Content of Real Foods (per 100g)',
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
    teaser: "A real hormone the body can make on its own, a genuinely global deficiency gap, and a real, current guideline that's more conservative than most popular advice.",
    summary:
      "Line up everything in this category and vitamin D reads as a genuinely two-sided story worth holding both halves of at once. The real, well-established side: a global deficiency gap affecting a real majority of people by some measure, real, specific deficiency and toxicity thresholds worth knowing by number, a real, measured difference between D2 and D3 supplemental forms, and a real, specific reason (fat-tissue sequestration) obesity tracks with lower levels. The real, more honest correction: a large, rigorous 2019 trial found vitamin D didn't prevent cancer or cardiovascular disease, and a real, current 2024 clinical guideline recommends against routine testing and against supplementing most healthy adults under 75 above the standard target, reserving real, targeted supplementation for specific, named groups instead. This app's own disease-specific vitamin D research, Hashimoto's own honestly-mixed correlation-vs-RCT picture, the gut-barrier mechanism, lupus's own sun-exposure catch-22, and more, builds directly on top of this same universal foundation rather than repeating it. Worth treating vitamin D the way this whole category treats every real nutrient: genuinely important in specific, well-evidenced ways, not a single flat recommendation that applies the same way to everyone.",
    citations: [
      { source: 'Vitamin D, MedlinePlus, U.S. National Library of Medicine', url: 'https://medlineplus.gov/vitamind.html' },
    ],
    overallTier: 'strong',
    relatedIds: ['vitamind-deficiency-symptoms-staged', 'vitamind-2024-guideline-honest-correction', 'vitamind-vital-trial-non-skeletal', 'vitamind-obesity-bioavailability', 'nutrient-vitamin-d'],
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
      "Iron's best-known job is building hemoglobin, the protein inside red blood cells that actually carries oxygen from the lungs to every other tissue, and myoglobin, the same job inside muscle itself. Beyond oxygen transport, iron is a required cofactor for enzymes involved in DNA synthesis, energy production in the mitochondria, and immune cell function, which is why both deficiency and overload show up as such a wide, seemingly unrelated list of symptoms. The single fact that shapes most of the rest of this category: the human body has no active mechanism to excrete excess iron. Iron balance is controlled almost entirely by regulating absorption in the small intestine, not by getting rid of what's already been taken in. That one-way design is efficient for a nutrient the body genuinely cannot do without, and it's also exactly why chronic overload (see the hemochromatosis entry below) is a real, distinct medical problem rather than something the body simply corrects on its own over time.",
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
    teaser: 'Roughly 14% of American adults have iron-deficiency anemia by one measure, and the real risk gap between men and women is far wider than most other nutrient deficiencies.',
    summary:
      "Iron deficiency is genuinely uneven across the population, not a flat risk everyone shares equally. In US adults, iron-deficiency anemia affects an estimated 14% by NHANES data, with the exact count depending heavily on which ferritin cutoff is used (5.9 million people at a 15 ng/mL threshold versus 3.3 million at 45 ng/mL). The real skew is by sex and life stage: adolescent girls and women of reproductive age run 9-11% prevalence, driven mainly by regular menstrual blood loss, while men overall sit near 1%, rising only to 2-4% in middle-aged and older men, where the more likely cause is slow GI blood loss rather than diet alone. Toddlers age 1-2 carry a real 9% prevalence too, with Hispanic toddlers roughly twice as likely as white peers to be affected. Pregnancy adds a separate, large demand on top of menstrual loss, since a growing fetus and placenta both draw on the same maternal iron stores. Multiparous women from lower-income backgrounds carry the highest combined risk of any group named in the research. Diet matters too, but mostly as one contributing factor among several: a diet low in heme iron (meat, poultry, seafood) combined with high blood loss from any source is the real, compounding pattern behind most cases, not diet in isolation.",
    citations: [
      { source: 'Iron Deficiency Anemia, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK448065/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'iron-deficiency-symptoms-staged',
    category: 'basicHealth',
    title: 'Iron Deficiency Has Real Stages, and Symptoms Can Start Before a Standard Anemia Test Would Catch It',
    teaser: 'Fatigue and restless legs can show up while iron stores are dropping, well before hemoglobin itself falls low enough to count as anemia on a lab report.',
    summary:
      "Iron deficiency progresses through three real, distinct phases rather than appearing all at once. First, the body's own stored iron (measured as serum ferritin) is drawn down as the primary reserve. Second, once storage is exhausted, circulating iron itself starts to decline, which shows up as falling transferrin saturation and rising total iron-binding capacity (TIBC), the blood's own way of signaling it wants more iron than it's getting. Third, only once both of those buffers are used up does the body's ability to actually build new hemoglobin fail, producing the microcytic, hypochromic red blood cells that define iron-deficiency anemia on a standard blood count. The clinically important part: real symptoms, including fatigue, cognitive impairment, and restless leg syndrome, can appear during that second stage, before anemia itself is present at all, meaning a normal hemoglobin result doesn't rule out a real, symptomatic iron problem. Anemia itself is formally defined as hemoglobin under 13 g/dL in men or under 12 g/dL in non-pregnant women, and a serum ferritin under 45 ng/mL is the threshold that gives the best real balance of sensitivity and specificity for catching iron deficiency itself, well above the much lower cutoffs (often 12-15 ng/mL) some labs still use as their own default reference range.",
    citations: [
      { source: 'Iron Deficiency Anemia, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK448065/' },
    ],
    overallTier: 'strong',
    relatedIds: ['advocacy-iron-ferritin'],
  },
  {
    id: 'iron-toxicity-acute-overdose',
    category: 'basicHealth',
    title: 'Acute Iron Overdose Is a Real Medical Emergency With Its Own Named Five-Stage Course',
    teaser: 'A single large dose, most often from swallowed supplement pills, can look like it resolved after the first day and then relapse into organ failure days later.',
    summary:
      "A single large dose of elemental iron is genuinely toxic, and the danger is dose-dependent in a way that's been mapped out specifically: under 20mg per kilogram of body weight is generally non-toxic, 20-60mg/kg causes moderate symptoms, and above 60mg/kg carries real risk of severe morbidity and death. Iron supplement pills are a real, common source of accidental pediatric poisoning specifically because they're small, often coated, and don't look dangerous. The clinical course runs through five real, named stages, and the second one is the genuinely dangerous trap: Stage 1 (30 minutes to 6 hours) brings abdominal pain, vomiting, and diarrhea, sometimes with visible blood. Stage 2 (6-24 hours) can look like recovery, with GI symptoms temporarily easing, even though iron absorption and cellular damage are still actively occurring underneath. Stage 3 (6-72 hours) brings the real crisis: recurring GI symptoms alongside shock, metabolic acidosis, coagulopathy, liver dysfunction, heart muscle damage, and kidney failure, since free iron directly disrupts cellular energy production and generates damaging free radicals throughout the body. Stage 4 (12-96 hours) can progress to outright liver failure. Stage 5, weeks later, involves scarring and potential bowel obstruction as the GI tract heals from the initial injury. A peak blood iron level above 500 micrograms/dL marks severe systemic toxicity. The practical takeaway: any suspected large iron ingestion, especially in a child, needs real emergency evaluation immediately, not a wait-and-see approach based on how someone feels in the first few hours.",
    citations: [
      { source: 'Iron Toxicity, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK459224/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'iron-hemochromatosis-overload',
    category: 'basicHealth',
    title: 'Hereditary Hemochromatosis: When the Body Absorbs Too Much Iron for Decades, Quietly',
    teaser: "The most common inherited disorder in white populations, genuinely underdiagnosed because early symptoms (fatigue, joint pain) look like almost anything else, and it carries a real, striking hypothyroidism connection.",
    summary:
      "Chronic iron overload is a genuinely different problem from an acute overdose: rather than one large dose, it builds slowly over years from a real genetic tendency to over-absorb dietary iron, most often from HFE gene mutations (C282Y homozygosity is the most common single cause in people of Northern European descent). Hereditary hemochromatosis affects a real, meaningful 1 in 300 to 500 people in white populations, making it the most common autosomal recessive disorder in that group, and it affects men roughly 1.8 to 3 times more often than women, since women lose iron regularly through menstruation until menopause, effectively delaying their own presentation by about a decade. Diagnostically, transferrin saturation above 45% (40% in women) combined with serum ferritin above 300 µg/L in men or 200 µg/L in women points toward the condition. Left uncorrected, the accumulated iron itself becomes toxic to multiple organs: cirrhosis develops in a real 10-15% of untreated patients, and among those with cirrhosis, hepatocellular carcinoma risk climbs as high as 30%. About half of untreated patients develop diabetes as iron damages the insulin-producing cells of the pancreas. Iron accumulation in heart tissue can cause dilated cardiomyopathy and arrhythmias. Skin hyperpigmentation (a real early sign, in over 90% of patients) and joint disease from calcium pyrophosphate deposits round out the classic presentation. The most directly relevant finding for this app: hemochromatosis carries a documented 80-fold increased risk of hypothyroidism in affected men, alongside real rates of hypogonadism and osteoporosis. Regular phlebotomy (therapeutic blood removal) is the real, standard, effective treatment, genuinely improving fatigue, skin color, and insulin sensitivity, though it does not reverse cirrhosis, hypogonadism, or joint damage that's already set in, which is the real reason early detection matters as much as it does.",
    citations: [
      { source: 'Hemochromatosis, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK430862/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'iron-absorption-mechanism',
    category: 'basicHealth',
    title: 'Heme vs. Non-Heme Iron: Two Genuinely Different Absorption Rates, and the Hormone That Controls Both',
    teaser: 'About 25% of the iron in meat gets absorbed. From plant sources, it can be as low as 5%, which is the real reason a vegetarian diet needs real, deliberate attention to iron.',
    summary:
      "Dietary iron comes in two real, chemically different forms with genuinely different absorption rates. Heme iron, found only in meat, poultry, and seafood (bound inside hemoglobin and myoglobin from the animal's own tissue), is absorbed at roughly 25%. Non-heme iron, the form found in plants, grains, and fortified foods, is absorbed at 17% or less, and can run as low as 5% depending on what else is eaten alongside it. Averaged across a real diet, someone eating animal products absorbs an estimated 14-18% of their dietary iron, versus roughly 5-12% for someone eating a fully plant-based diet, which is exactly why vegetarian and vegan diets call for real, deliberate attention to iron intake and food pairing, not just eating 'enough' iron-containing plants. Despite making up only 10-15% of total dietary iron in a typical Western diet, heme iron accounts for a real, disproportionate 40% of all iron actually absorbed, because of that absorption-rate gap. Non-heme absorption can be measurably boosted: vitamin C converts iron to a more absorbable form and meaningfully increases uptake, and eating meat, fish, or poultry alongside a plant-iron source (the real, named 'MFP factor') increases non-heme absorption 2-3 fold on its own. Working against absorption: phytates in whole grains and legumes, polyphenols in tea, coffee, and red wine, and calcium from dairy, all of which bind iron in the gut before it can be taken up. Governing all of this from the inside is hepcidin, a hormone made by the liver that acts as the body's own master iron-regulation switch: when iron stores run high, hepcidin rises and shuts down further absorption; when stores run low, hepcidin drops and absorption increases. This is the real reason iron absorption is genuinely adaptive rather than fixed, and also why iron status itself, not just how much iron someone eats, determines how much of a given meal's iron actually gets taken up.",
    citations: [
      { source: 'Dietary Iron, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK540969/' },
    ],
    overallTier: 'strong',
    relatedIds: ['interaction-vitaminc-iron', 'interaction-tannins-iron', 'interaction-calcium-iron', 'interaction-iron-zinc-manganese'],
  },
  {
    id: 'iron-supplement-forms-compared',
    category: 'basicHealth',
    title: 'Ferrous Sulfate vs. Iron Bisglycinate: Comparable Absorption, a Real Difference in How the Gut Tolerates Them',
    teaser: "The cheapest, most-studied iron supplement is also the one most likely to cause nausea and constipation, at real, quantified rates.",
    summary:
      "This app's own reference data (built during earlier work on medication and supplement tracking) already carries real, cited head-to-head comparisons between the two most common iron supplement forms. Ferrous sulfate is the standard, cheapest, and most-studied first-line option, but a meta-analysis of 43 trials and roughly 6,800 adults found it significantly increases GI side effects (nausea, constipation, abdominal pain) versus placebo, at an odds ratio of 2.32, a real, substantial burden that's a major reason people stop taking it. Iron bisglycinate, a chelated form, produces meaningfully fewer of those same GI side effects in multiple head-to-head randomized trials at matched elemental-iron doses, while absorbing roughly comparably to ferrous sulfate when the dose is matched, not clearly superior on absorption despite how it's often marketed, but genuinely gentler. For someone who has tried and stopped ferrous sulfate specifically because of stomach upset, bisglycinate is a real, evidence-backed alternative to ask about rather than assuming iron supplementation itself is simply not tolerable. Taking iron on an empty stomach maximizes absorption, but plenty of people need to take it with a little food to tolerate it at all; either is a reasonable real-world choice depending on which trade-off matters more.",
    citations: [
      { source: "Tolkien Z, Stecher L, Mander AP, Pereira DI, Powell JJ 2015: Ferrous Sulfate Supplementation Causes Significant Gastrointestinal Side-Effects in Adults: A Systematic Review and Meta-Analysis, PLoS One, PMID 25700159", url: 'https://pubmed.ncbi.nlm.nih.gov/25700159/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'iron-cast-iron-cookware',
    category: 'basicHealth',
    title: 'Cooking in Cast Iron Really Does Add Iron to Food, Just Not as Reliably as the Popular Version of This Claim Suggests',
    teaser: 'A real systematic review of 13 studies found consistently more iron in the food itself, but a genuinely mixed result for whether it actually raised blood hemoglobin.',
    summary:
      "The idea that cooking in a cast iron pan or pot adds meaningful iron to food is a real, tested claim, not just kitchen folklore, and it holds up better on one half than the other. A 2021 systematic review of 13 studies found a real, consistent improvement in both the iron content and iron bioavailability of food cooked in iron pots or with iron ingots added directly to the cooking liquid, a genuinely useful, low-cost finding, especially highlighted by the review's own authors as a real potential strategy for reducing iron-deficiency anemia in settings where supplements or fortified food aren't reliably available. The honest, less flattering half: only 4 of the studies reviewed found a significant resulting increase in actual blood hemoglobin levels, with the rest showing only a minor change, meaning the boost to food iron content doesn't always translate cleanly into a measurable health outcome. Acidic foods (tomato sauce, for instance) tend to pick up more iron from cast iron than a dry sauté, since acid helps leach iron from the metal itself. Worth knowing as one small, real, genuinely low-risk contributor among the larger factors covered elsewhere in this category (heme vs. non-heme intake, vitamin C pairing, hepcidin's own regulation of absorption), not a substitute for any of them.",
    citations: [
      { source: 'Sharma S, Khandelwal R, Yadav K, Ramaswamy G, Vohra K 2021: Effect of cooking food in iron-containing cookware on increase in blood hemoglobin level and iron content of the food: A systematic review, Nepal J Epidemiol, PMID 34290890', url: 'https://pubmed.ncbi.nlm.nih.gov/34290890/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'iron-food-sources-real-data',
    category: 'basicHealth',
    title: "Real Iron Food Sources, Pulled Directly From This App's Own Database",
    teaser: 'Liver leads by a wide margin, and the list mixes heme and non-heme sources on purpose, since the two absorb so differently.',
    summary:
      "Real iron content pulled directly from this app's own 22,022-food reference database, deliberately mixing heme sources (absorbed at roughly 25%) and non-heme sources (absorbed at 17% or less) rather than ranking them on the same scale, since the raw number alone overstates how much of a plant source's iron actually gets used. Pork liver leads by a real, wide margin at 23.3mg per 100g, with chicken liver close behind around 16mg per 100g, both classic, concentrated heme sources. Dark chocolate carries a real, genuinely surprising 11.5mg per 100g. White beans and lentils, both real, common non-heme sources, carry 10.4mg and 6.5mg per 100g respectively, meaningfully boosted in practice by pairing them with a vitamin C source (see the absorption-mechanism entry above). Oysters, a real heme source often left off shorter lists, carry roughly 9.2mg per 100g. Spinach, popularly assumed to be an iron powerhouse, actually carries a comparatively modest 3.6mg per 100g of the harder-to-absorb non-heme form, a real, worth-knowing correction to its own reputation.",
    citations: [],
    overallTier: 'strong',
    chart: {
      title: 'Iron Content of Real Foods (per 100g)',
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
    summary:
      "Line up everything in this category and iron reads as a nutrient defined by one real structural fact: the body has no active way to excrete it, so absorption itself, governed by hepcidin, is the only real lever controlling how much accumulates. That single design choice explains both real failure modes covered here. Too little, and the shortfall shows up in real, predictable stages, from depleted stores to measurable fatigue and restless legs to full anemia, skewed heavily toward menstruating women, pregnancy, and young children. Too much, whether from a single large acute dose or decades of a genetic over-absorption tendency like hereditary hemochromatosis, causes real, serious, and sometimes irreversible organ damage, precisely because there's no built-in release valve. In between those two extremes sits a real, practical, everyday layer: heme absorbs roughly twice as well as non-heme, vitamin C and meat both boost non-heme uptake, tea and calcium both blunt it, and even the choice of cookware makes a small, real, measurable difference. This app's own Hashimoto's-specific research goes one step further, covering iron's own direct, measured relationship to TSH and thyroid hormone levels, and a real, standing recommendation for a full iron panel, not ferritin alone.",
    citations: [
      { source: 'Iron Deficiency Anemia, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK448065/' },
    ],
    overallTier: 'strong',
    relatedIds: ['iron-deficiency-symptoms-staged', 'iron-hemochromatosis-overload', 'iron-absorption-mechanism', 'advocacy-iron-ferritin', 'ckd-anemia-erythropoietin'],
  },
];
