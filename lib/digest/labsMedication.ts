import type { DigestEntry } from './types';

// Labs & Medication Timing -- 6 entries. This is real, cited groundwork for
// this app's own still-unbuilt interaction-rules engine (CLAUDE.md's own
// "built-in, cited rules" half) -- these entries are meant to survive being
// promoted into real, actionable app reminders later, not just stay
// reference reading.
//
// 2026-08-07, same day, rewritten in the same narrative shape as Other
// Autoimmune Diseases and Gut & Microbiome, per direct confirmation ("The
// extended stories are better... make them be" longer and more
// data-inclusive) -- every entry now opens on a real, relatable scenario
// or hook, develops the actual finding, and closes on why it matters.
// Every underlying fact and citation is unchanged from the original pass.
export const LABS_MEDICATION_ENTRIES: DigestEntry[] = [
  {
    id: 'labs-biotin-interference',
    category: 'labsMedication',
    title: 'Biotin: A Real Way a Common Supplement Can Fake an Abnormal Thyroid Lab Result',
    teaser: 'A hair-skin-nails supplement, sitting quietly in a medicine cabinet, can make a perfectly normal thyroid look diseased on paper.',
    summary:
      "Someone starts a popular \"hair, skin & nails\" supplement, feels good about it, and a few weeks later their thyroid labs come back looking alarming -- a genuinely frightening moment that, in a real and specific subset of cases, has nothing to do with their actual thyroid function at all. Most thyroid immunoassays rely on streptavidin-biotin technology to actually run the test -- and high-dose biotin, present in nearly every one of those popular hair/skin/nails blends as well as in standalone supplements, interferes directly with that exact chemistry. The result is a real, well-replicated pattern: falsely elevated free T4 and T3 readings, and falsely suppressed thyroglobulin readings, with a documented serum concentration cutoff above which this interference becomes likely. It isn't the thyroid getting worse. It's the lab test itself being fooled by an unrelated vitamin. This is a lab-methodology issue, not a true change in thyroid function -- and it's directly relevant to this app's own still-unbuilt lab-tracking feature, where knowing to ask \"have you taken biotin recently\" before trusting an alarming result could spare someone a lot of unnecessary worry.",
    citations: [
      { source: 'Biotin induced biochemical hyperthyroidism: a case report and review of the literature', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10304644/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'labs-calcium-iron-absorption',
    category: 'labsMedication',
    title: 'Calcium & Iron: The Best-Established Food-Medication Interaction in Thyroid Care -- and Still One of the Most Common Mistakes',
    teaser: 'The single most well-documented timing rule in thyroid medicine, and people still take their morning vitamin with their morning pill anyway.',
    summary:
      "Of everything in this app's own Labs & Medication Timing research, this is the one with the least room for scientific debate -- and, ironically, still one of the most commonly broken rules in everyday practice. Calcium and iron both form insoluble complexes with levothyroxine directly in the gut, substantially reducing how much of the actual dose gets absorbed. This isn't an emerging or contested finding -- it's well-established enough to be standard FDA labeling guidance, not a hedge or a maybe. The fix is just as well-studied: taking levothyroxine at least 4 hours apart from calcium supplements, iron supplements, or calcium-fortified foods restores normal absorption completely. A real, four-hour buffer is all it takes to neutralize one of the best-documented interactions in this entire category -- worth knowing by name, since \"take your vitamins together to save time\" is exactly the habit that quietly undoes it.",
    citations: [
      { source: 'FDA-approved levothyroxine sodium prescribing information (DailyMed)', url: 'https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=38af4e36-b26b-485d-a6f3-7fbcf6072a0f' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'labs-grapefruit-juice',
    category: 'labsMedication',
    title: 'Grapefruit Juice & Levothyroxine: The Best Controlled Data on Any Juice Interaction -- and a Smaller Effect Than Its Reputation',
    teaser: 'Grapefruit juice has a well-earned reputation for messing with medications. Its actual, measured effect on levothyroxine turns out to be surprisingly modest.',
    summary:
      "Grapefruit juice carries a well-earned reputation for interfering with all kinds of medications, enough that many people assume it's automatically off-limits with anything they take daily. Levothyroxine turns out to be a real, checkable exception to how dramatic that reputation suggests. The best available controlled data -- a real crossover randomized trial -- tested grapefruit juice specifically, at a high, sustained dose, and found only a 9% reduction in levothyroxine absorption, with TSH remaining comparable to control. The study's own authors concluded the interaction's \"relevance seems to be small\" and explicitly said levothyroxine patients \"should not be discouraged from rational fruit juice consumption.\" No dedicated study exists for plain orange juice or other juices specifically -- this is the one juice in this whole research base with real trial data behind it, and even that one real trial doesn't support a strong warning. A useful reminder that a food's reputation and its actual, measured effect on one specific medication aren't always the same size.",
    citations: [
      { source: 'Lilja et al. 2005, British Journal of Clinical Pharmacology -- effects of grapefruit juice on the absorption of levothyroxine', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1884777/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'labs-tsh-diurnal-timing',
    category: 'labsMedication',
    title: 'TSH Has a Real Daily Rhythm -- Which Is Why "Morning, Fasting" Is Not an Arbitrary Rule',
    teaser: 'The same person\'s blood, drawn at two different times of day, can genuinely tell two different stories.',
    summary:
      "A doctor's instruction to get a morning, fasting blood draw can feel like an arbitrary inconvenience -- one more hoop before the real information shows up. It isn't arbitrary at all. TSH follows a real circadian pattern, typically peaking in the late night and early morning hours and dropping to its lowest point in the afternoon -- a large enough swing that the actual time of day a sample is drawn can meaningfully change the number that comes back. That's exactly why morning, fasting draws became the standard clinical convention in the first place, and why comparing two TSH results drawn at very different times of day, rather than at a consistent time, can introduce noise that looks like a real change in thyroid status but genuinely isn't one. A small, easy habit -- getting blood drawn at roughly the same time each time -- is what keeps a real trend actually readable as a trend, rather than buried in noise the clock itself quietly introduced.",
    citations: [
      { source: 'Circadian and 30 minutes variations in serum TSH and thyroid hormones in normal subjects', url: 'https://pubmed.ncbi.nlm.nih.gov/716774/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'labs-bedtime-dosing',
    category: 'labsMedication',
    title: 'Bedtime Levothyroxine Dosing: A Real, Studied Alternative for Anyone Mornings Don\'t Work For',
    teaser: 'The standard morning routine isn\'t the only real, evidence-backed option -- just the most commonly prescribed one.',
    summary:
      "The standard levothyroxine instructions -- empty stomach, first thing in the morning, then wait an hour before eating -- assume a morning routine with enough slack to actually follow them. Not everyone's mornings have that slack. A real, studied alternative exists: taking levothyroxine at bedtime, at least 3 hours after the last food, has been shown in controlled comparisons to produce comparable, and in some studies slightly better, absorption and TSH control than morning dosing. Not a workaround or a compromise -- a legitimate, real option worth raising directly with a doctor for anyone who finds the standard \"empty stomach, then wait\" morning routine genuinely difficult to keep consistent, rather than quietly skipping the spacing rule some mornings and hoping it doesn't matter.",
    citations: [
      { source: 'Effects of evening vs morning levothyroxine intake: a randomized double-blind crossover trial', url: 'https://pubmed.ncbi.nlm.nih.gov/21149757/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'labs-breakfast-higher-dose',
    category: 'labsMedication',
    title: 'A Real 2026 Trial: Levothyroxine WITH Breakfast, at a Higher Dose',
    teaser: 'Not fasting, not bedtime -- a real, brand-new randomized trial found a third real option works just as well.',
    summary:
      "The standard fasting rule and the bedtime alternative above both still ask for a real, empty-stomach window. A genuinely new 2026 randomized trial tested something different: what if the dose itself, not the timing, absorbed the difference? 88 patients were randomized to either standard fasting levothyroxine or the same drug taken with breakfast at a 15% higher dose. The two groups ended up statistically indistinguishable on real thyroid stability -- 74.4% of the fasting group and 73.3% of the breakfast group maintained their target TSH, a gap with no real statistical significance. The breakfast group also reported real, measurably greater improvements in self-reported well-being, and by the end of the trial, 88.9% of that group chose to keep taking their dose with breakfast rather than switch back. A real, third legitimate option -- worth a direct conversation with a doctor for anyone who finds both the standard fasting window and the bedtime alternative genuinely hard to keep consistent, not just a theoretical one.",
    citations: [
      {
        source: 'Willems JIA, van Twist DJL, Helmich F, et al. 2026, Journal of Clinical Endocrinology & Metabolism -- "Fasting vs Nonfasting, Dose-adjusted Levothyroxine Ingestion in Hypothyroidism: A Randomized Clinical Trial"',
        url: 'https://pubmed.ncbi.nlm.nih.gov/41431302/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['labs-bedtime-dosing'],
  },
  {
    id: 'labs-timing-master-rule',
    category: 'labsMedication',
    title: 'The Practical Timing Rule, Pulled Together',
    teaser: 'Five separate interactions, five different mechanisms -- and nearly all of them resolve with the exact same one habit.',
    summary:
      "By this point in the category, it would be reasonable to feel like there are five separate rules to memorize -- one each for calcium, iron, coffee, soy, and high-fiber meals, each with its own mechanism and its own warning. There aren't, really. Calcium, iron, coffee, soy, and high-fiber meals each independently interfere with levothyroxine absorption through genuinely different mechanisms (covered individually across this category and Problem Foods & Swaps) -- but nearly all of them resolve exactly the same way: take levothyroxine on an empty stomach with plain water, then wait at least 30-60 minutes (longer, a full 4 hours, specifically for calcium and iron) before eating or drinking anything else. A real systematic review pooling 107 articles and 128 individual studies backs this same practical rule across the board. One consistent habit, repeated every morning (or every night, for the bedtime-dosing alternative above), quietly resolves nearly everything else in this category -- not five separate rules to remember, just one.",
    citations: [
      {
        source: 'Medications and Food Interfering with the Bioavailability of Levothyroxine: A Systematic Review (107 articles, 128 studies)',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10295503/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['problem-coffee-timing', 'problem-soy'],
  },
];
