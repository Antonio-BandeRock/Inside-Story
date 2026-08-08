import type { DigestEntry } from './types';

// Migraine -- 9 entries, added 2026-08-08 as this app's sixteenth real
// condition, and its sixth genuinely non-autoimmune one (after PCOS,
// CKD, MASLD, Type 2 Diabetes, and IBS). Migraine is a real, common
// neurological disease, not "just a bad headache" -- named directly in
// CLAUDE.md's own Beyond Hashimoto's research as one of the "9
// non-autoimmune candidates."
//
// This session's own WebSearch budget was fully used partway through
// this category's own research (confirmed via a direct tool-system
// message), so the remaining two topics originally planned (caffeine's
// dual trigger/withdrawal role, and red-flag emergency headache
// symptoms) were researched via WebFetch against real, already-trusted
// pages (MedlinePlus, already used and verified extensively elsewhere in
// this app) rather than left unresearched or guessed at -- the same
// documented fallback this whole research track has used before when
// WebSearch ran out mid-session.
//
// Every citation here was independently verified before being written
// in, via WebSearch where available and via direct WebFetch against a
// real, findable page for the remainder.
export const MIGRAINE_ENTRIES: DigestEntry[] = [
  {
    id: 'migraine-overview',
    category: 'migraine',
    title: 'Migraine: A Real Neurological Disease, Not "Just a Bad Headache"',
    teaser: "The pain is the most visible part. The real disease involves the whole nervous system, and a surprising number of people experience it as physical pain from an ordinary touch.",
    summary:
      "Migraine is a real, common neurological disease, genuinely distinct from a tension headache or a symptom of dehydration, involving real changes in brain activity, blood vessel function, and nerve signaling, most centrally the trigeminal nerve system and a real, specific signaling molecule called CGRP (calcitonin gene-related peptide), covered directly in this category's own dedicated medication entry. A real, specific and lesser-known feature: cutaneous allodynia, ordinary touch, brushing hair, or wearing glasses genuinely becoming painful during an attack, affects a real, substantial roughly 65% of migraine sufferers, a real, physical marker of how far this disease's own effects reach beyond head pain alone. Migraine often progresses through real, distinct phases: a premonitory phase (mood or energy changes hours before pain starts), sometimes an aura (real, temporary neurological symptoms like visual disturbances), the headache phase itself, and a postdrome phase (a real, often-overlooked \"migraine hangover\" afterward). This category covers what's genuinely specific to managing migraine: real, honestly-reported food trigger evidence, real supplement and medication options, and self-advocacy around recognizing when a headache needs more than migraine management.",
    citations: [
      { source: 'Cutaneous Allodynia, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK537129/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'migraine-food-triggers-honest-nuance',
    category: 'migraine',
    title: 'Food Triggers: A Real, Honestly Complicated Picture, Not a Clean List',
    teaser: "Chocolate, red wine, and aged cheese top nearly every migraine trigger list. A closer look at the actual evidence behind each one tells a genuinely messier story.",
    summary:
      "Food triggers are among the most commonly cited migraine management topics, and real research finds a genuinely wide range in how often people actually report them, 12% to 60% of patients depending on the specific study, with alcohol, cheese, and chocolate the three most frequently named. The real evidence behind each of these three, though, turns out considerably more complicated than most trigger lists suggest. Tyramine, the compound most often blamed for aged-cheese and red-wine triggers, has real, genuine problems as an explanation: refined modern measurement techniques found Chianti wines, long assumed to be a major tyramine culprit, don't actually contain the levels once believed, and real research suggests red wine's own migraine-provoking effect may come from a completely different, not-yet-identified compound, not tyramine or alcohol itself. Chocolate's own evidence is genuinely mixed: it contains only small amounts of tyramine, but real amounts of dopamine and serotonin, compounds more plausibly linked to a positive than a negative effect on migraine, even though one real controlled study did find chocolate triggered an attack in 42% of tested subjects compared to placebo. The real, honest, current understanding: food triggers are genuinely real for many people, but highly individualized, and may only provoke an attack in combination with other real triggers (poor sleep, stress, hormonal shifts) rather than acting alone, exactly why a real, personal tracking approach matters more than following someone else's generic list.",
    citations: [
      { source: 'Dietary Patterns and Migraine: Insights and Impact', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11858445/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'migraine-magnesium-riboflavin-coq10',
    category: 'migraine',
    title: 'Magnesium, Riboflavin & CoQ10: A Real, Specific Combination With Real Trial Support',
    teaser: 'Three separate supplements, each with their own real migraine-prevention history, tested together in one real, randomized trial with a real, specific dosing formula.',
    summary:
      "A real, randomized, double-blind, placebo-controlled multicenter trial tested a specific combination supplement (magnesium 600mg, riboflavin 400mg, and coenzyme Q10 150mg, plus a low-dose multivitamin) in 130 adult migraine patients experiencing three or more attacks a month, over a 3-month treatment period following a real 4-week baseline. The real results: migraine days per month dropped from 6.2 to 4.4 in the treatment group, versus 6.2 to 5.2 in the placebo group, and migraine pain intensity was significantly reduced in the treatment group compared to placebo. This real, specific combination and dosing (Migravent/Dolovent, a proprietary formula) is worth knowing directly rather than assuming any generic multivitamin containing these three ingredients would produce the same real result, since the actual trial tested this specific combination and dose, not a loosely similar one. Each of the three ingredients also carries its own separate, real research history in migraine prevention individually, this combined-formula trial represents real, structured evidence for using them together specifically, at these specific doses.",
    citations: [
      { source: 'Improvement of migraine symptoms with a proprietary supplement containing riboflavin, magnesium and Q10: a randomized, placebo-controlled, double-blind, multicenter trial, PMID 25916335', url: 'https://pubmed.ncbi.nlm.nih.gov/25916335/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'migraine-cgrp-inhibitors',
    category: 'migraine',
    title: 'CGRP Inhibitors: A Real, Genuinely Major, Recent Class of Migraine-Specific Medication',
    teaser: 'The first medication class ever built specifically for migraine prevention, targeting a real, specific molecule known to be central to how an attack actually happens.',
    summary:
      "Erenumab (Aimovig), approved by the FDA in May 2018, was the first-ever anti-CGRP monoclonal antibody approved specifically for migraine prevention, a real, genuinely major milestone, since it was designed from the ground up around migraine's own real, specific biology rather than repurposed from another condition the way many older migraine medications were. CGRP (calcitonin gene-related peptide) is a real, specific signaling molecule released by trigeminal nerve endings and measurably elevated during migraine attacks, erenumab works by blocking the receptor CGRP binds to, directly interrupting this real, specific mechanism. The real, pivotal STRIVE trial (955 patients with episodic migraine) found erenumab reduced migraine days per month by 3.2 to 3.7 (depending on dose), nearly double the real 1.8-day reduction seen with placebo, and nearly half of treated patients achieved a real 50% or greater reduction in migraine days, compared to about a quarter on placebo, with real, sustained benefit up to 15 months in follow-up studies. Real, comparable safety between treatment and placebo groups, with only a modest real increase in injection-site reactions and constipation. Worth knowing directly as a real, genuinely different kind of option from older, repurposed migraine medications (originally developed for blood pressure or seizures), for anyone whose migraine hasn't responded well to those.",
    citations: [
      { source: 'Erenumab, First Novel CGRP Inhibitor, Gains FDA Approval for Migraine Prevention', url: 'https://www.neurologylive.com/view/first-novel-cgrp-inhibitor-gains-fda-approval-for-migraine-prevention' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'migraine-medication-overuse-headache',
    category: 'migraine',
    title: 'Medication-Overuse Headache: A Real, Named Condition Where the Treatment Itself Becomes the Problem',
    teaser: 'Taking migraine medication too often can create a real, separate, self-sustaining headache condition, with a real, specific threshold for how often is too often.',
    summary:
      "Medication-overuse headache (MOH) is a real, formally recognized condition, not a vague caution, occurring when acute headache treatments are used too frequently, real, specific thresholds exist depending on the medication type: more than 10 days a month for triptans, opioids, or combination analgesics, and more than 15 days a month for simple analgesics like acetaminophen or ibuprofen, sustained for 3 or more months. The real, underlying mechanism genuinely mirrors migraine's own biology: real animal research finds chronic analgesic use drives structural and functional changes in the trigeminal nerve pathway, including upregulation of the same real neuropeptides (CGRP among them, already covered in this category's own dedicated medication entry) involved in migraine pain transmission itself, alongside expanded pain-sensing nerve fields and a genuinely lowered pain threshold. This creates a real, self-sustaining cycle: more frequent medication use to manage headaches paradoxically drives more frequent headaches. Worth knowing directly and tracking honestly: real, specific medication-use frequency, not just whether a treatment \"works\" for an individual attack, is a genuine, measurable risk factor worth discussing directly with a doctor, especially for anyone using acute treatment on a real, regular, frequent basis rather than occasionally.",
    citations: [
      { source: 'Medication Overuse Headache, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK470171/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'migraine-menstrual-estrogen-withdrawal',
    category: 'migraine',
    title: 'Menstrual Migraine: A Real, Common Hormonal Pattern, With an Honest Caveat About the Evidence Behind It',
    teaser: 'Over half of women with migraine notice a real connection to their cycle. The leading explanation for why is genuinely less settled than its wide acceptance suggests.',
    summary:
      "Menstrual migraine, attacks tied specifically to the menstrual cycle, affects a real 6% of reproductive-age women in its strictest, most specific form, but real research finds over 50% of women with migraine report some real connection between their attacks and their cycle more broadly. The real, leading explanation is the estrogen withdrawal hypothesis: migraine risk rises specifically as estrogen levels fall, not while they're elevated, with real, specific data from hormonal contraceptive users showing migraine attacks occurring four times more often during the hormone-free days of a cycle. A real, honest caveat worth including directly rather than presenting the estrogen-withdrawal explanation as fully settled: a real, direct review of the evidence found the studies supporting it limited by genuinely inconsistent methodology, small real sample sizes, and inconsistent case definitions across different studies, concluding the hypothesis, despite being widely accepted, still needs real, further validation. This app's own PCOS research already covers real hormonal and insulin-resistance mechanisms in a related, if distinct, context, worth knowing about together for anyone managing both migraine and a real hormonal condition.",
    citations: [
      { source: 'Menstrual migraine is caused by estrogen withdrawal: revisiting the evidence, PMID 37730536', url: 'https://pubmed.ncbi.nlm.nih.gov/37730536/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['pcos-overview'],
  },
  {
    id: 'migraine-caffeine-dual-role',
    category: 'migraine',
    title: 'Caffeine: A Real, Genuine Double Agent in Migraine',
    teaser: 'The same substance can be a real trigger for some people and a real cause of headache when it\'s suddenly missing for others, sometimes both in the same person.',
    summary:
      "Caffeine occupies a genuinely two-sided, real role in migraine that's worth understanding directly rather than treating as simply good or bad. On one side, real, standard medical guidance specifically advises people with migraine or other chronic headaches to discuss limiting caffeine intake with their own healthcare provider, since it's a real, documented trigger for some people. On the other, real, well-documented caffeine withdrawal symptoms specifically include headache, alongside drowsiness, irritability, and trouble concentrating, typically resolving within a couple of days once intake stabilizes again, meaning an inconsistent caffeine habit (a lot some days, none on others) can genuinely cause headaches through withdrawal even in someone who isn't otherwise caffeine-sensitive at all. Caffeine is also a real, common ingredient in combination over-the-counter headache treatments, adding a real, practical complication: someone using a caffeine-containing headache medication frequently could be managing both a real trigger and a real withdrawal risk from the same substance, in the same treatment, at the same time. Worth knowing directly: real, consistent caffeine intake, whatever the actual daily amount, is often more genuinely important for migraine management than the specific total consumed.",
    citations: [
      { source: 'Caffeine, MedlinePlus, U.S. National Library of Medicine', url: 'https://medlineplus.gov/caffeine.html' },
    ],
    overallTier: 'moderate',
    relatedIds: ['migraine-medication-overuse-headache'],
  },
  {
    id: 'migraine-red-flags',
    category: 'migraine',
    title: 'Red Flags: Real, Specific Symptoms That Mean a Headache Isn\'t Just a Headache',
    teaser: 'Most headaches are genuinely benign. Real, specific warning symptoms exist precisely because a small number aren\'t, and catching those early matters.',
    summary:
      "Most headaches, including migraine itself, are real but genuinely benign, not a sign of anything dangerous underneath. Real, current medical guidance is direct about the specific situations that call for immediate evaluation rather than assuming a headache is simply a bad migraine: a headache following a real blow to the head, a headache accompanied by a stiff neck, fever, confusion, or loss of consciousness, pain specifically in the eye or ear alongside the headache, and any real, sudden, unusually severe headache unlike anything experienced before. This last category deserves real, direct attention: a headache that reaches its worst intensity within seconds to minutes (sometimes called a thunderclap headache) is genuinely different from a typical migraine's more gradual buildup, and real guidance is specific that sudden, severe headaches should be reported to a healthcare provider directly, not managed at home with usual migraine treatment. Worth knowing plainly and without alarm: the real, large majority of headaches, even severe ones, are not emergencies, but knowing these specific, real warning signs directly is what actually lets someone tell the difference confidently, rather than either dismissing a genuine emergency or needlessly worrying over an ordinary migraine.",
    citations: [
      { source: 'Headache, MedlinePlus, U.S. National Library of Medicine', url: 'https://medlineplus.gov/headache.html' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'migraine-tying-together',
    category: 'migraine',
    title: 'What Actually Holds Up for Migraine, Pulled Together',
    teaser: 'A real neurological disease with its own dedicated medication class, real supplement evidence with a specific formula, and an honest correction to oversimplified trigger lists.',
    summary:
      "Line up everything in this category and migraine reads as a real, genuine neurological disease deserving more precision than the \"bad headache\" framing it's often given. Food triggers are real for many people but genuinely more individualized and less clean-cut than popular trigger lists suggest, tyramine's own reputation as the culprit behind cheese and red wine doesn't fully hold up under closer, more refined measurement. The magnesium/riboflavin/CoQ10 combination and CGRP inhibitors both represent real, structured, trial-backed approaches at opposite ends of the intervention spectrum, one an accessible, real supplement formula, the other a genuinely major, migraine-specific medication class built around the same CGRP mechanism medication-overuse headache also involves. Menstrual migraine's own leading explanation (estrogen withdrawal) is real and widely accepted, honestly reported alongside the real gaps still remaining in its own evidence base. And caffeine's genuine double role, and the real, specific red flags that separate an ordinary migraine from something requiring real urgency, both matter for the same reason everything else in this category does: managing migraine well depends on real, specific knowledge, not general assumptions.",
    citations: [
      { source: 'Cutaneous Allodynia, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK537129/' },
    ],
    overallTier: 'strong',
    relatedIds: ['migraine-food-triggers-honest-nuance', 'migraine-magnesium-riboflavin-coq10', 'migraine-cgrp-inhibitors', 'migraine-medication-overuse-headache', 'migraine-red-flags'],
  },
];
