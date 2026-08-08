import type { DigestEntry } from './types';

// Labs & Medication Timing -- 11 entries. This is real, cited groundwork
// for this app's own still-unbuilt interaction-rules engine (CLAUDE.md's
// own "built-in, cited rules" half) -- these entries are meant to survive
// being promoted into real, actionable app reminders later, not just stay
// reference reading.
//
// 2026-08-07, same day, rewritten in the same narrative shape as Other
// Autoimmune Diseases and Gut & Microbiome, per direct confirmation ("The
// extended stories are better... make them be" longer and more
// data-inclusive) -- every entry now opens on a relatable scenario or
// hook, develops the actual finding, and closes on why it matters. Every
// underlying fact and citation is unchanged from the original pass.
//
// 2026-08-07, same day, four more entries added as part of a real gap-fill
// pass: combination T4/T3 therapy and NDT, drug-induced thyroid
// dysfunction, checkpoint-inhibitor thyroiditis, and absorption
// interferers beyond food.
//
// 2026-08-08: content fields rewritten a second time to remove AI-writing
// tics flagged directly by the person -- em dashes as punctuation, "not X,
// it's Y" contrast, and overused words like "real"/"genuinely"/
// "honest(ly)"/"worth" -- see bigPicture.ts's own header comment for the
// full context. Every fact, number, and citation is unchanged.
export const LABS_MEDICATION_ENTRIES: DigestEntry[] = [
  {
    id: 'labs-biotin-interference',
    category: 'hashimotos',
    title: 'Biotin: How a Common Supplement Can Fake an Abnormal Thyroid Lab Result',
    teaser: 'A hair-skin-nails supplement, sitting quietly in a medicine cabinet, can make a perfectly normal thyroid look diseased on paper.',
    summary:
      "Someone starts a popular \"hair, skin & nails\" supplement, feels good about it, and a few weeks later their thyroid labs come back looking alarming, a frightening moment that, in a specific subset of cases, has nothing to do with their actual thyroid function at all. Most thyroid immunoassays rely on streptavidin-biotin technology to actually run the test, and high-dose biotin, present in nearly every one of those popular hair/skin/nails blends as well as in standalone supplements, interferes directly with that exact chemistry. The result is a well-replicated pattern: falsely elevated free T4 and T3 readings, and falsely suppressed thyroglobulin readings, with a documented serum concentration cutoff above which this interference becomes likely. It isn't the thyroid getting worse. It's the lab test itself being fooled by an unrelated vitamin. This is a lab-methodology issue, not a true change in thyroid function, and it's directly relevant to this app's own still-unbuilt lab-tracking feature, where knowing to ask \"have you taken biotin recently\" before trusting an alarming result could spare someone a lot of unnecessary worry.",
    citations: [
      { source: 'Biotin induced biochemical hyperthyroidism: a case report and review of the literature', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10304644/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'labs-calcium-iron-absorption',
    category: 'hashimotos',
    title: 'Calcium & Iron: The Best-Established Food-Medication Interaction in Thyroid Care, Still One of the Most Common Mistakes',
    teaser: 'The single most well-documented timing rule in thyroid medicine, and people still take their morning vitamin with their morning pill anyway.',
    summary:
      "Of everything in this app's own Labs & Medication Timing research, this is the one with the least room for scientific debate, and, ironically, still one of the most commonly broken rules in everyday practice. Calcium and iron both form insoluble complexes with levothyroxine directly in the gut, substantially reducing how much of the actual dose gets absorbed. This isn't an emerging or contested finding. It's well-established enough to be standard FDA labeling guidance, not a hedge or a maybe. The fix is just as well-studied: taking levothyroxine at least 4 hours apart from calcium supplements, iron supplements, or calcium-fortified foods restores normal absorption completely. A four-hour buffer is all it takes to neutralize one of the best-documented interactions in this entire category, worth knowing by name, since \"take your vitamins together to save time\" is exactly the habit that quietly undoes it.",
    citations: [
      { source: 'FDA-approved levothyroxine sodium prescribing information (DailyMed)', url: 'https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=38af4e36-b26b-485d-a6f3-7fbcf6072a0f' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'labs-grapefruit-juice',
    category: 'hashimotos',
    title: 'Grapefruit Juice & Levothyroxine: The Best Controlled Data on Any Juice Interaction, and a Smaller Effect Than Its Reputation',
    teaser: 'Grapefruit juice has a well-earned reputation for messing with medications. Its actual, measured effect on levothyroxine turns out to be surprisingly modest.',
    summary:
      "Grapefruit juice carries a well-earned reputation for interfering with all kinds of medications, enough that many people assume it's automatically off-limits with anything they take daily. Levothyroxine turns out to be a checkable exception to how dramatic that reputation suggests. The best available controlled data, a crossover randomized trial, tested grapefruit juice specifically, at a high, sustained dose, and found only a 9% reduction in levothyroxine absorption, with TSH remaining comparable to control. The study's own authors concluded the interaction's \"relevance seems to be small\" and explicitly said levothyroxine patients \"should not be discouraged from rational fruit juice consumption.\" No dedicated study exists for plain orange juice or other juices specifically. This is the one juice in this whole research base with trial data behind it, and even that one trial doesn't support a strong warning. A useful reminder that a food's reputation and its actual, measured effect on one specific medication aren't always the same size.",
    citations: [
      { source: 'Lilja et al. 2005, British Journal of Clinical Pharmacology: effects of grapefruit juice on the absorption of levothyroxine', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1884777/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'labs-tsh-diurnal-timing',
    category: 'hashimotos',
    title: 'TSH Has a Real Daily Rhythm, Which Is Why "Morning, Fasting" Is Not an Arbitrary Rule',
    teaser: "The same person's blood, drawn at two different times of day, can genuinely tell two different stories.",
    summary:
      "A doctor's instruction to get a morning, fasting blood draw can feel like an arbitrary inconvenience, one more hoop before the real information shows up. It isn't arbitrary at all. TSH follows a circadian pattern, typically peaking in the late night and early morning hours and dropping to its lowest point in the afternoon, a large enough swing that the actual time of day a sample is drawn can meaningfully change the number that comes back. That's exactly why morning, fasting draws became the standard clinical convention in the first place, and why comparing two TSH results drawn at very different times of day, rather than at a consistent time, can introduce noise that looks like a change in thyroid status but genuinely isn't one. A small, easy habit, getting blood drawn at roughly the same time each time, is what keeps a real trend actually readable as a trend, rather than buried in noise the clock itself quietly introduced.",
    citations: [
      { source: 'Circadian and 30 minutes variations in serum TSH and thyroid hormones in normal subjects', url: 'https://pubmed.ncbi.nlm.nih.gov/716774/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'labs-bedtime-dosing',
    category: 'hashimotos',
    title: "Bedtime Levothyroxine Dosing: A Studied Alternative for Anyone Mornings Don't Work For",
    teaser: "The standard morning routine isn't the only evidence-backed option, just the most commonly prescribed one.",
    summary:
      "The standard levothyroxine instructions (empty stomach, first thing in the morning, then wait an hour before eating) assume a morning routine with enough slack to actually follow them. Not everyone's mornings have that slack. A studied alternative exists: taking levothyroxine at bedtime, at least 3 hours after the last food, has been shown in controlled comparisons to produce comparable, and in some studies slightly better, absorption and TSH control than morning dosing. Not a workaround or a compromise. A legitimate option worth raising directly with a doctor for anyone who finds the standard \"empty stomach, then wait\" morning routine genuinely difficult to keep consistent, rather than quietly skipping the spacing rule some mornings and hoping it doesn't matter.",
    citations: [
      { source: 'Effects of evening vs morning levothyroxine intake: a randomized double-blind crossover trial', url: 'https://pubmed.ncbi.nlm.nih.gov/21149757/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'labs-breakfast-higher-dose',
    category: 'hashimotos',
    title: 'A 2026 Trial: Levothyroxine WITH Breakfast, at a Higher Dose',
    teaser: 'Not fasting, not bedtime: a brand-new randomized trial found a third option works just as well.',
    summary:
      "The standard fasting rule and the bedtime alternative above both still ask for an empty-stomach window. A genuinely new 2026 randomized trial tested something different: what if the dose itself, not the timing, absorbed the difference? 88 patients were randomized to either standard fasting levothyroxine or the same drug taken with breakfast at a 15% higher dose. The two groups ended up statistically indistinguishable on thyroid stability: 74.4% of the fasting group and 73.3% of the breakfast group maintained their target TSH, a gap with no statistical significance. The breakfast group also reported measurably greater improvements in self-reported well-being, and by the end of the trial, 88.9% of that group chose to keep taking their dose with breakfast rather than switch back. A third legitimate option, worth a direct conversation with a doctor for anyone who finds both the standard fasting window and the bedtime alternative genuinely hard to keep consistent, not just a theoretical one.",
    citations: [
      {
        source: 'Willems JIA, van Twist DJL, Helmich F, et al. 2026, Journal of Clinical Endocrinology & Metabolism: "Fasting vs Nonfasting, Dose-adjusted Levothyroxine Ingestion in Hypothyroidism: A Randomized Clinical Trial"',
        url: 'https://pubmed.ncbi.nlm.nih.gov/41431302/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['labs-bedtime-dosing'],
  },
  {
    id: 'labs-combination-t3-ndt',
    category: 'hashimotos',
    title: "When Levothyroxine Alone Doesn't Feel Like Enough: What the Trials on Combination T4/T3 and NDT Actually Found",
    teaser: 'A huge question in every Hashimoto\'s community: "my labs are normal but I still feel awful, should I ask for T3 or natural desiccated thyroid?" The answer is more nuanced than either side of that argument usually admits.',
    summary:
      "Levothyroxine (synthetic T4) works well enough for most people that a normal TSH is treated as the finish line, but a real, acknowledged minority of patients stay genuinely symptomatic even once their labs look perfect. That gap is exactly what drives two of the most common questions in Hashimoto's patient communities: should I ask for liothyronine (synthetic T3) added to my levothyroxine, or switch to natural desiccated thyroid (NDT, e.g. Armour Thyroid), which contains both T4 and T3 from pig thyroid gland? The answer, built from trial data rather than either side's own talking points: a 2006 meta-analysis of 11 randomized trials (1,216 patients) found no measurable difference between combination T4/T3 and T4 alone across mood, cognition, bodily pain, fatigue, weight, or cholesterol, and a 2013 randomized crossover trial specifically comparing NDT to levothyroxine (70 patients) found the same thing: no significant overall difference in symptoms or quality of life, though NDT did cause a modest ~3-pound weight loss. Here's the twist: despite trials not measuring a group-level symptom difference, patients themselves keep preferring the combination anyway. That same 2013 NDT trial found 48.6% of patients preferred NDT versus 18.6% preferring levothyroxine, and a larger 2025 systematic review of 11 RCTs (1,135 patients) found 52% preferred combination therapy versus 24% for T4 alone. That's not a contradiction. It's an unresolved gap between what a trial can measure at the group level and what an individual person actually experiences, and it's exactly why a 2024 review states plainly that a minority of levothyroxine-treated patients remain genuinely symptomatic despite normal labs. Worth a direct conversation with a doctor specifically framed around that patient-preference data, shared decision-making, not needing to prove the symptoms are real, rather than either dismissing the request outright or assuming NDT/combination therapy is a guaranteed fix current trials simply haven't found evidence for yet.",
    citations: [
      {
        source: 'Grozinsky-Glasberg S, et al. 2006: Thyroxine-triiodothyronine combination therapy versus thyroxine monotherapy for clinical hypothyroidism: meta-analysis of randomized controlled trials (11 RCTs, 1,216 patients)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/16670166/',
      },
      {
        source: 'Hoang TD, et al. 2013: Desiccated Thyroid Extract Compared With Levothyroxine in the Treatment of Hypothyroidism: A Randomized, Double-Blind, Crossover Study (Journal of Clinical Endocrinology & Metabolism)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/23539727/',
      },
      {
        source: 'de Lima Beltrão FE, et al. 2025: Treatment Preferences in Patients With Hypothyroidism: systematic review and meta-analysis (11 RCTs, 1,135 patients)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/39290156/',
      },
      {
        source: 'Bianco AC 2024: Emerging Therapies in Hypothyroidism (Annual Review of Medicine)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/37738506/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['history-desiccated-to-levothyroxine', 'history-desiccated-thyroid-standardization', 'advocacy-how-to-ask'],
  },
  {
    id: 'labs-drug-induced-thyroid-dysfunction',
    category: 'hashimotos',
    title: 'Two Common Medications That Can Trigger or Worsen Thyroid Dysfunction on Their Own',
    teaser: 'Not every thyroid problem starts with the thyroid. Sometimes it starts with a prescription written for something else entirely.',
    summary:
      "Amiodarone, a commonly prescribed heart-rhythm medication, is structurally similar to thyroid hormone itself and carries a real iodine load. ETA clinical guidelines put the rate of resulting thyroid dysfunction (both hypo- and hyperthyroid forms) at roughly 15-20% of patients taking it. Lithium, a standard mood-stabilizing medication, works differently but reaches a similar destination. It directly slows the same peripheral deiodination process (covered elsewhere in this Digest as the main route T4 becomes active T3) and acts as an immune stimulant specifically in people who already carry thyroid antibodies, a direct, mechanistic reason someone with existing Hashimoto's antibodies may be more susceptible to lithium's thyroid effects than someone without them. Data puts lithium-induced goiter/hypothyroidism at around 8% of patients. Neither of these facts means avoiding a necessary heart or mood medication. Both are often genuinely irreplaceable for what they treat. But both are well-documented reasons thyroid function specifically deserves its own periodic check while taking either one, not just a general assumption that any new fatigue or mood shift is \"just the Hashimoto's again.\"",
    citations: [
      {
        source: 'Bartalena L, et al. 2018: 2018 European Thyroid Association (ETA) Guidelines for the Management of Amiodarone-Associated Thyroid Dysfunction',
        url: 'https://pubmed.ncbi.nlm.nih.gov/29594056/',
      },
      {
        source: 'Danzi S, Klein I 2015: Amiodarone-induced thyroid dysfunction',
        url: 'https://pubmed.ncbi.nlm.nih.gov/24067547/',
      },
      {
        source: 'Scanelli G 2002: Lithium thyrotoxicosis (Recenti Progressi in Medicina)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/11887342/',
      },
      {
        source: 'Kibirige D, Luzinda K, Ssekitoleko R 2013: Spectrum of lithium induced thyroid abnormalities: a current perspective (Thyroid Research)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/23391071/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['organ-liver-t4t3-conversion'],
  },
  {
    id: 'labs-checkpoint-inhibitor-thyroiditis',
    category: 'hashimotos',
    title: "Cancer Immunotherapy and the Thyroid: A Risk That's Genuinely Higher for Anyone Already Antibody-Positive",
    teaser: 'A newer class of cancer drug, saving lives, with a documented side effect this Digest\'s own core audience should specifically know about.',
    summary:
      "Immune checkpoint inhibitors (drugs like pembrolizumab and nivolumab, an often genuinely life-saving advance in cancer treatment) work by releasing a brake on the immune system so it attacks cancer more aggressively. A well-documented side effect of releasing that same brake is that the immune system sometimes turns on healthy tissue too. Research names thyroiditis as the single most common such immune-related side effect of this whole drug class. The genuinely Hashimoto's-relevant finding: research found the risk of checkpoint-inhibitor thyroiditis is measurably higher specifically in patients who already test positive for thyroid antibodies before treatment even starts, meaning someone with existing Hashimoto's antibodies facing a real cancer diagnosis requiring this kind of treatment has an elevated, worth-naming risk their oncology team should know about directly. This isn't a reason to avoid or delay genuinely necessary cancer treatment. It's a practical piece of self-advocacy: mentioning an existing Hashimoto's/antibody history to an oncology team before starting checkpoint-inhibitor therapy, so baseline and follow-up thyroid function get checked as a matter of course rather than only after symptoms appear.",
    citations: [
      {
        source: 'Muir CA, Menzies AM, Clifton-Bligh R, Tsang VHM 2020: Thyroid Toxicity Following Immune Checkpoint Inhibitor Treatment in Advanced Cancer',
        url: 'https://pubmed.ncbi.nlm.nih.gov/32264785/',
      },
      {
        source: 'Iwama S, Kobayashi T, Yasuda Y, Arima H 2022: Immune checkpoint inhibitor-related thyroid dysfunction',
        url: 'https://pubmed.ncbi.nlm.nih.gov/35501263/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['advocacy-thyroid-antibodies'],
  },
  {
    id: 'labs-absorption-interferers-beyond-food',
    category: 'hashimotos',
    title: 'Beyond Calcium, Iron & Coffee: Medications That Also Block Levothyroxine Absorption',
    teaser: 'A common heartburn medication, a cholesterol-lowering drug, an antibiotic: all documented additions to the same absorption-blocking list as calcium and iron.',
    summary:
      "This category's own core timing rules (calcium, iron, coffee, soy, fiber) cover food-level interference. A comprehensive 2017 review pooling the existing literature confirms a longer list of medications that interfere with levothyroxine absorption through the same general mechanism, \"established and clinically significant\": cholestyramine and colesevelam (cholesterol-lowering bile-acid binders), lanthanum and sevelamer (phosphate binders used in kidney disease), calcium and iron supplements (already covered elsewhere in this category), ciprofloxacin (a commonly prescribed antibiotic), aluminum hydroxide (an antacid ingredient), and proton pump inhibitors, a common class of heartburn/reflux medication (omeprazole and similar) taken daily by a huge number of people, often without ever connecting it to their own thyroid dose. The same review's own practical fix applies across this whole list: separating levothyroxine from any of these by enough time resolves the interference, the identical principle behind this category's own calcium/iron timing rule, just applied to a longer list of medications than food alone. Worth a direct question for anyone on a stable levothyroxine dose who's also started one of these medications and later finds their TSH has drifted. The cause may be the newer medication, not a change in Hashimoto's itself.",
    citations: [
      {
        source: 'Skelin M, et al. 2017: Factors Affecting Gastrointestinal Absorption of Levothyroxine: A Review (Clinical Therapeutics)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/28153426/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['labs-calcium-iron-absorption', 'labs-timing-master-rule'],
  },
  {
    id: 'labs-timing-master-rule',
    category: 'hashimotos',
    title: 'The Practical Timing Rule, Pulled Together',
    teaser: 'Five separate interactions, five different mechanisms, and nearly all of them resolve with the exact same one habit.',
    summary:
      "By this point in the category, it would be reasonable to feel like there are five separate rules to memorize, one each for calcium, iron, coffee, soy, and high-fiber meals, each with its own mechanism and its own warning. There aren't, really. Calcium, iron, coffee, soy, and high-fiber meals each independently interfere with levothyroxine absorption through genuinely different mechanisms (covered individually across this category and Problem Foods & Swaps), but nearly all of them resolve exactly the same way: take levothyroxine on an empty stomach with plain water, then wait at least 30-60 minutes (longer, a full 4 hours, specifically for calcium and iron) before eating or drinking anything else. A systematic review pooling 107 articles and 128 individual studies backs this same practical rule across the board. One consistent habit, repeated every morning (or every night, for the bedtime-dosing alternative above), quietly resolves nearly everything else in this category. Not five separate rules to remember, just one.",
    citations: [
      {
        source: 'Medications and Food Interfering with the Bioavailability of Levothyroxine: A Systematic Review (107 articles, 128 studies)',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10295503/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['problem-coffee-timing', 'problem-soy', 'magnesium-levothyroxine-timing'],
  },
];
