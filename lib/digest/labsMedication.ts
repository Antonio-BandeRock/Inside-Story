import type { DigestEntry } from './types';

// Labs & Medication Timing -- 6 entries. This is real, cited groundwork for
// this app's own still-unbuilt interaction-rules engine (CLAUDE.md's own
// "built-in, cited rules" half) -- these entries are meant to survive being
// promoted into real, actionable app reminders later, not just stay
// reference reading.
export const LABS_MEDICATION_ENTRIES: DigestEntry[] = [
  {
    id: 'labs-biotin-interference',
    category: 'labsMedication',
    title: 'Biotin: A Real, Well-Replicated Lab-Test Interference',
    teaser: 'Not a diet effect -- a genuine, documented way a common supplement can fake an abnormal thyroid lab result.',
    summary:
      'High-dose biotin (a common standalone supplement and a component of many "hair, skin & nails" blends) interferes with the streptavidin-biotin technology used in many thyroid immunoassays, producing falsely elevated free T4/T3 readings and falsely suppressed thyroglobulin readings -- a well-replicated mechanism with a real, documented serum concentration cutoff above which interference becomes likely. This is a lab-methodology issue, not a true change in thyroid function, and is directly relevant to this app\'s own still-unbuilt lab-tracking feature.',
    citations: [
      { source: 'Biotin induced biochemical hyperthyroidism: a case report and review of the literature', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10304644/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'labs-calcium-iron-absorption',
    category: 'labsMedication',
    title: 'Calcium & Iron: The Classic Levothyroxine Absorption Blockers',
    teaser: 'The best-established food-medication interaction in thyroid care -- and still one of the most common real-world mistakes.',
    summary:
      'Calcium and iron both form insoluble complexes with levothyroxine in the gut, substantially reducing how much of the dose is actually absorbed -- well-established enough to be standard FDA labeling guidance, not a contested or emerging finding. The fix is simple and well-studied: taking levothyroxine at least 4 hours apart from calcium supplements, iron supplements, or calcium-fortified foods restores normal absorption.',
    citations: [
      { source: 'FDA-approved levothyroxine sodium prescribing information (DailyMed)', url: 'https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=38af4e36-b26b-485d-a6f3-7fbcf6072a0f' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'labs-grapefruit-juice',
    category: 'labsMedication',
    title: 'Grapefruit Juice & Levothyroxine',
    teaser: 'The best controlled data on any juice-medication interaction relevant here -- and the real effect is smaller than its reputation.',
    summary:
      'The best available controlled data (a real crossover RCT) tested grapefruit juice specifically at a high, sustained dose and found only a 9% reduction in levothyroxine absorption, with TSH remaining comparable to control. The review\'s own authors concluded the interaction\'s "relevance seems to be small" and that levothyroxine patients "should not be discouraged from rational fruit juice consumption." No dedicated study exists for plain orange or other juices specifically -- this is the one juice with real trial data behind it, and even that data doesn\'t support a strong warning.',
    citations: [
      { source: 'Lilja et al. 2005, British Journal of Clinical Pharmacology -- effects of grapefruit juice on the absorption of levothyroxine', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1884777/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'labs-tsh-diurnal-timing',
    category: 'labsMedication',
    title: 'TSH Has a Real Diurnal Rhythm',
    teaser: 'The reason a doctor asks for a morning, fasting blood draw isn\'t arbitrary -- TSH genuinely moves through the day.',
    summary:
      'TSH follows a real circadian pattern, typically peaking in the late night/early morning hours and dropping to its lowest point in the afternoon -- a large enough swing that the time of day a sample is drawn can meaningfully affect the result. This is why morning, fasting draws are the standard clinical convention, and why comparing two TSH results drawn at very different times of day (rather than tracking a consistent draw time) can introduce noise that looks like a real change but isn\'t.',
    citations: [
      { source: 'Circadian and 30 minutes variations in serum TSH and thyroid hormones in normal subjects', url: 'https://pubmed.ncbi.nlm.nih.gov/716774/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'labs-bedtime-dosing',
    category: 'labsMedication',
    title: 'Bedtime Levothyroxine Dosing: A Real, Studied Alternative',
    teaser: 'For anyone whose mornings make the standard timing rules genuinely hard to follow.',
    summary:
      'A real, studied alternative to morning dosing exists: taking levothyroxine at bedtime (at least 3 hours after the last food) has been shown in controlled comparisons to produce comparable, and in some studies slightly better, absorption and TSH control versus morning dosing -- a legitimate option to discuss with a doctor for anyone who finds the standard "empty stomach, then wait an hour" morning routine difficult to keep consistent.',
    citations: [
      { source: 'Effects of evening vs morning levothyroxine intake: a randomized double-blind crossover trial', url: 'https://pubmed.ncbi.nlm.nih.gov/21149757/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'labs-timing-master-rule',
    category: 'labsMedication',
    title: 'The Practical Timing Rule, Pulled Together',
    teaser: 'Five separate interactions, one simple habit that resolves nearly all of them.',
    summary:
      'Calcium, iron, coffee, soy, and high-fiber meals each independently interfere with levothyroxine absorption through different mechanisms (covered individually across this category and Problem Foods & Swaps) -- but nearly all of them resolve the same way: take levothyroxine on an empty stomach with plain water, then wait at least 30-60 minutes (longer, 4 hours, specifically for calcium and iron) before eating or drinking anything else. One consistent habit, not five separate rules to remember.',
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
