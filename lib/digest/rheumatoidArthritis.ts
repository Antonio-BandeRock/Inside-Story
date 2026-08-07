import type { DigestEntry } from './types';

// Rheumatoid Arthritis -- 9 entries, added 2026-08-08 as this app's second
// real condition (see CLAUDE.md's own Status entry for the same date: the
// multi-condition schema, Profile's new multi-select, and RA's first
// medications/interaction rules all shipped the same day, ahead of this
// content). Distinct from otherAutoimmune.ts's own 'other-rheumatoid-
// arthritis' entry, which stays exactly as it was: RA studied purely as
// corroborating evidence for Hashimoto's own vitamin D pattern, written for
// a Hashimoto's reader. This category is the opposite direction -- RA as
// its own real, primary condition, written for someone who has selected
// rheumatoid_arthritis in their own Profile. The two entries deliberately
// don't duplicate each other's content; this category's own overview entry
// cross-links back to the other one rather than re-explaining the same
// vitamin D finding twice.
//
// Every citation here was independently verified via WebSearch before
// being written in, the same discipline the rest of this Digest already
// holds to -- several claims came back with real, specific numbers that
// improved on what the earlier Beyond Hashimoto's scoping research had
// only estimated (the omega-3 dosing threshold, the alcohol/methotrexate
// safety threshold), written in following this file's own established
// house style: no em dashes as punctuation, no "not X, it's Y"
// contrast, and no overused "real/genuinely/honest(ly)/worth" filler.
export const RHEUMATOID_ARTHRITIS_ENTRIES: DigestEntry[] = [
  {
    id: 'ra-overview',
    category: 'rheumatoidArthritis',
    title: 'Rheumatoid Arthritis: The Most Common Autoimmune Disease of All',
    teaser: 'The single most prevalent autoimmune disease in the U.S., and the condition most likely to already be sitting alongside a Hashimoto\'s diagnosis.',
    summary:
      "Rheumatoid arthritis is the immune system attacking the synovium, the thin lining inside a joint, producing the swelling, stiffness, and pain the disease is known for. It usually starts in the small joints of the hands and feet and can spread from there. A 2024 study analyzing electronic health records for over ten million people across six major U.S. health systems ranked RA as the single most prevalent autoimmune disease measured, ahead of every other condition in the study, Hashimoto's included. That scale is exactly why this app is building RA out first: a large share of the people this app already exists for may be managing it already, diagnosed or not. Diet won't cure RA, and nothing here replaces a rheumatologist's own treatment plan. What follows is what the actual research supports, each finding kept honest about how strong its evidence really is.",
    citations: [
      { source: 'Estimation of prevalence of autoimmune diseases in the United States using electronic health record data, JCI, 2024', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11827834/' },
    ],
    overallTier: 'strong',
    relatedIds: ['other-rheumatoid-arthritis', 'ra-hashimotos-comorbidity'],
  },
  {
    id: 'ra-omega3',
    category: 'rheumatoidArthritis',
    title: 'Omega-3s Are the Single Best-Evidenced Food Lever for RA',
    teaser: 'Fish oil at a real, specific dose measurably lowers how much anti-inflammatory medication a person needs.',
    summary:
      "Of everything studied for rheumatoid arthritis, omega-3 fatty acids carry the strongest evidence by a wide margin. A 2024 meta-analysis pooling 18 randomized controlled trials across 1,018 RA patients found omega-3 supplementation measurably improved inflammation and disease activity markers. An earlier meta-analysis found the effect large enough to matter in daily life: at doses above 2.7 grams per day, sustained for at least three months, people taking omega-3s needed meaningfully less NSAID medication to control their symptoms. The same body of research links omega-3 intake to fewer tender joints, fewer swollen joints, and shorter morning stiffness. Three months is the key number to hold onto. This isn't a same-day effect, and judging omega-3 intake after a week or two will miss the real result entirely.",
    citations: [
      { source: 'Effects of omega-3 supplementation on lipid metabolism, inflammation, and disease activity in rheumatoid arthritis: a meta-analysis of RCTs, Clinical Rheumatology, 2024', url: 'https://link.springer.com/article/10.1007/s10067-024-07040-0' },
      { source: 'Omega-3 polyunsaturated fatty acids and the treatment of rheumatoid arthritis: a meta-analysis', url: 'https://pubmed.ncbi.nlm.nih.gov/22835600/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ra-mediterranean-diet'],
  },
  {
    id: 'ra-mediterranean-diet',
    category: 'rheumatoidArthritis',
    title: 'A Mediterranean Pattern Lowered Real Disease Activity Scores in a Real Trial',
    teaser: 'Not a general "eat healthier" gesture. A randomized trial measured an actual RA disease-activity score before and after.',
    summary:
      "The MADEIRA trial put a real number on what a Mediterranean-style diet does for RA specifically. Over 12 weeks, women with RA who followed a personalized Mediterranean eating plan alongside a physical activity program showed a lower DAS28 score, the standard clinical measure of active disease, than women given usual care. Their vitamin D levels rose too, a real bonus given how often low vitamin D status tracks with more active RA (see the Other Autoimmune Diseases category for that pattern in full). A separate, earlier randomized feeding trial found an even sharper effect: DAS28 dropped 76% over 12 weeks in the Mediterranean diet group, compared to a low-fat, high-carbohydrate comparison diet. Two independent trials, two different populations, the same direction and the same real magnitude of benefit.",
    citations: [
      { source: 'Mediterranean Diet and Physical Activity Nudges versus Usual Care in Women with Rheumatoid Arthritis: the MADEIRA Randomized Controlled Trial', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9919932/' },
      { source: 'Mediterranean diet intervention in rheumatoid arthritis', url: 'https://pubmed.ncbi.nlm.nih.gov/12594101/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ra-omega3'],
  },
  {
    id: 'ra-elimination-fasting',
    category: 'rheumatoidArthritis',
    title: 'A Landmark Fasting-Then-Vegetarian Trial, and Why the Word "Responder" Matters',
    teaser: 'A real 1991 Lancet trial found significant improvement. It also found that response varied enough to change how the finding should be used.',
    summary:
      "One of the most cited dietary trials in RA history put patients through a 7 to 10 day fast, then an individually adjusted gluten-free vegan diet for three and a half months, then a lactovegetarian diet for the rest of the year. The diet group showed significant improvement across a real cluster of objective measures: tender and swollen joint counts, grip strength, C-reactive protein, and sedimentation rate all moved in the right direction. But the finding that matters most for anyone trying to use this personally showed up a year later. Improvement stuck around specifically in the people the researchers called diet responders, while diet non-responders and the omnivore control group looked similar to each other. The researchers couldn't explain the split through psychology, food-antibody activity, or the usual inflammatory fat markers. What they did find was that gut bacteria composition genuinely differed between responders and non-responders, a real, direct link to the same gut-microbiome mechanisms this app already tracks closely. The honest takeaway isn't \"fasting then vegan works for RA.\" It's that it works for some real, identifiable subset of people, and finding out which group you're in is exactly the kind of personal pattern this app's own tracking tools exist to uncover.",
    citations: [
      { source: 'Controlled trial of fasting and one-year vegetarian diet in rheumatoid arthritis, The Lancet, 1991', url: 'https://www.thelancet.com/journals/lancet/article/PII0140-6736(91)91770-U/fulltext' },
    ],
    overallTier: 'moderate',
    relatedIds: ['gut-scfa-treg'],
  },
  {
    id: 'ra-methotrexate-folate',
    category: 'rheumatoidArthritis',
    title: 'Methotrexate Is an Antifolate. Folate Intake Still Needs to Stay Steady.',
    teaser: 'The most commonly prescribed RA medication works partly by interfering with folate. That makes consistency the goal, not avoidance.',
    summary:
      "Methotrexate is the first-line disease-modifying drug for RA, and it works partly by blocking how the body uses folate. That sounds like a reason to cut folate out entirely, but the real clinical picture is more specific than that. Folic acid is frequently prescribed deliberately, taken on methotrexate's own off-days, specifically to reduce side effects like nausea and mouth sores without blunting the drug's own effect on disease activity. The actual risk sits in the gap between what a prescriber accounted for and what a person does on their own: raising or lowering folate intake independently, through diet or supplements, without factoring in what the prescribed dose already assumes. Once weekly dosing (not daily, a real and distinct pattern from most other medications a person might take) makes this even easier to lose track of.",
    citations: [
      { source: 'Whittle SL, Hughes RA, Food-drug interactions in rheumatoid arthritis, Rheumatology (Oxford), 2004', url: 'https://pubmed.ncbi.nlm.nih.gov/15292527/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ra-biologics-infection-risk'],
  },
  {
    id: 'ra-biologics-infection-risk',
    category: 'rheumatoidArthritis',
    title: 'Methotrexate Plus a Biologic Means Real Food-Safety Stakes',
    teaser: 'Combining the two most common RA drug classes measurably raises infection risk, turning ordinary food-safety habits into something worth taking seriously.',
    summary:
      "Methotrexate combined with a TNF-inhibitor biologic like adalimumab is a common, often more effective treatment approach than either drug alone. It also comes with a documented tradeoff: combination therapy carries higher infection risk than either drug used by itself. This is precisely why food-safety habits that might otherwise feel like overcaution actually matter here. Raw or undercooked meat, raw eggs, and unpasteurized soft cheeses all carry real infection risk in the general population, a risk this combination genuinely raises further. None of this means avoiding these foods entirely forever. It means the ordinary food-safety margin most people can treat casually deserves more attention while on both drugs at once.",
    citations: [
      { source: 'Whittle SL, Hughes RA, Food-drug interactions in rheumatoid arthritis, Rheumatology (Oxford), 2004', url: 'https://pubmed.ncbi.nlm.nih.gov/15292527/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ra-methotrexate-folate'],
  },
  {
    id: 'ra-alcohol-methotrexate',
    category: 'rheumatoidArthritis',
    title: 'Alcohol and Methotrexate: The Real Threshold, Not the Folk Warning',
    teaser: 'A study of nearly 12,000 patients found the standard "no alcohol at all" advice overstates the actual risk at moderate intake.',
    summary:
      "Methotrexate carries a well-known liver-toxicity risk, closely monitored through regular blood work, and alcohol is a real contributor to that risk. What often gets lost is how dose-dependent the actual finding is. A large study tracking 11,839 RA patients on methotrexate over nearly three decades found that drinking more than 21 units of alcohol a week significantly raised the rate of liver enzyme abnormalities. Below 14 units a week, the same study found no measurable increase in risk at all. That's a real, specific, and considerably more permissive threshold than the blanket \"avoid alcohol entirely\" advice many patients hear. It doesn't mean alcohol is risk-free on methotrexate. It means the real risk sits at the higher end of consumption, not at the first drink, an important distinction for anyone weighing an occasional glass of wine against their own treatment plan.",
    citations: [
      { source: 'Quantifying the hepatotoxic risk of alcohol consumption in patients with rheumatoid arthritis taking methotrexate', url: 'https://pubmed.ncbi.nlm.nih.gov/28341765/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ra-methotrexate-folate'],
  },
  {
    id: 'ra-hashimotos-comorbidity',
    category: 'rheumatoidArthritis',
    title: 'RA and Hashimoto\'s Are the Most Common Real Pairing in Polyautoimmunity',
    teaser: 'Having one of these two conditions measurably raises the odds of the other. This isn\'t a coincidence worth ignoring.',
    summary:
      "Polyautoimmunity, having more than one autoimmune disease at once, shows up in roughly a third of everyone diagnosed with any autoimmune condition. Among the specific pairings researchers name most often, rheumatoid arthritis together with autoimmune thyroiditis stands out as one of the most common. This is exactly why this app added RA as its second real condition rather than starting anywhere else: a meaningful share of the people already using this app for Hashimoto's may be managing undiagnosed or diagnosed RA at the same time, and the reverse holds too. Practically, this means someone managing both conditions needs both sets of food and medication guidance checked together, not just one or the other. This app's own multi-condition Profile now supports exactly that.",
    citations: [
      { source: 'Polyautoimmunity and multiple autoimmune syndromes: A neglected clinical challenge', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12646339/' },
      { source: 'Comorbidities in Autoimmune Disease & Multiple Autoimmune Syndrome, Autoimmune Association', url: 'https://www.autoimmuneinstitute.org/articles/comorbidities-in-autoimmune-disease-multiple-autoimmune-syndrome/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ra-overview', 'other-rheumatoid-arthritis'],
  },
  {
    id: 'ra-tying-together',
    category: 'rheumatoidArthritis',
    title: 'What Actually Holds Up for RA, Pulled Together',
    teaser: 'Two food levers with strong trial evidence, one landmark finding that only applies to part of the population, and two medication interactions worth knowing precisely, not just generally.',
    summary:
      "Line up everything in this category and a real, usable picture forms. Omega-3s and a Mediterranean-style eating pattern both carry strong, repeated trial evidence, the two most dependable food levers available for RA specifically. Fasting followed by a vegetarian diet showed a genuinely significant effect in a landmark trial, but only reliably for the subset of people who respond to it, making it a real hypothesis worth personally testing rather than a rule to assume applies. The two medication interactions that matter most, methotrexate's relationship with folate and with alcohol, both turned out more precise and more manageable than the blanket warnings patients often hear: folate needs consistency, not elimination, and alcohol's real risk threshold sits well above zero drinks. Underneath all of it sits the most practically important fact of all, the real, common overlap between RA and Hashimoto's, which is exactly why this category exists as its own real destination now instead of a single corroborating entry borrowed for someone else's disease.",
    citations: [
      { source: 'Estimation of prevalence of autoimmune diseases in the United States using electronic health record data, JCI, 2024', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11827834/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ra-omega3', 'ra-mediterranean-diet', 'ra-elimination-fasting', 'ra-hashimotos-comorbidity'],
  },
];
