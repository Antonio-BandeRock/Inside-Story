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
    title: 'Migraine: A Neurological Disease, Not "Just a Bad Headache"',
    teaser: "The pain is the most visible part. The disease involves the whole nervous system, and a surprising number of people experience it as physical pain from an ordinary touch.",
    summary:
      "Migraine is a common neurological disease, distinct from a tension headache or a symptom of dehydration, involving changes in brain activity, blood vessel function, and nerve signaling, most centrally the trigeminal nerve system and a specific signaling molecule called CGRP (calcitonin gene-related peptide), covered directly in this category's dedicated medication entry. A specific and lesser-known feature: cutaneous allodynia, ordinary touch, brushing hair, or wearing glasses becoming painful during an attack, affects a substantial roughly 65% of migraine sufferers, a physical marker of how far this disease's effects reach beyond head pain alone. Migraine often progresses through distinct phases: a premonitory phase (mood or energy changes hours before pain starts), sometimes an aura (temporary neurological symptoms like visual disturbances), the headache phase itself, and a postdrome phase (an often-overlooked \"migraine hangover\" afterward). This category covers what's specific to managing migraine: honestly-reported food trigger evidence, supplement and medication options, and self-advocacy around recognizing when a headache needs more than migraine management.",
    citations: [
      { source: 'Cutaneous Allodynia, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK537129/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'migraine-food-triggers-honest-nuance',
    category: 'migraine',
    title: 'Food Triggers: A Honestly Complicated Picture, Not a Clean List',
    teaser: "Chocolate, red wine, and aged cheese top nearly every migraine trigger list. A closer look at the actual evidence behind each one tells a messier story.",
    summary:
      "Food triggers are among the most commonly cited migraine management topics, and research finds a wide range in how often people actually report them, 12% to 60% of patients depending on the specific study, with alcohol, cheese, and chocolate the three most frequently named. The evidence behind each of these three, though, turns out considerably more complicated than most trigger lists suggest. Tyramine, the compound most often blamed for aged-cheese and red-wine triggers, has problems as an explanation: refined modern measurement techniques found Chianti wines, long assumed to be a major tyramine culprit, don't actually contain the levels once believed, and research suggests red wine's migraine-provoking effect may come from a completely different, not-yet-identified compound, not tyramine or alcohol itself. Chocolate's evidence is mixed: it contains only small amounts of tyramine, but amounts of dopamine and serotonin, compounds more plausibly linked to a positive than a negative effect on migraine, even though one controlled study did find chocolate triggered an attack in 42% of tested subjects compared to placebo. The honest, current understanding: food triggers are for many people, but highly individualized, and may only provoke an attack in combination with other triggers (poor sleep, stress, hormonal shifts) rather than acting alone, exactly why a personal tracking approach matters more than following someone else's generic list.",
    citations: [
      { source: 'Dietary Patterns and Migraine: Insights and Impact', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11858445/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'migraine-magnesium-riboflavin-coq10',
    category: 'migraine',
    title: 'Magnesium, Riboflavin & CoQ10: A Specific Combination With Trial Support',
    teaser: 'Three separate supplements, each with their migraine-prevention history, tested together in one randomized trial with a specific dosing formula.',
    summary:
      "A randomized, double-blind, placebo-controlled multicenter trial tested a specific combination supplement (magnesium 600mg, riboflavin 400mg, and coenzyme Q10 150mg, plus a low-dose multivitamin) in 130 adult migraine patients experiencing three or more attacks a month, over a 3-month treatment period following a 4-week baseline. The results: migraine days per month dropped from 6.2 to 4.4 in the treatment group, versus 6.2 to 5.2 in the placebo group, and migraine pain intensity was significantly reduced in the treatment group compared to placebo. This specific combination and dosing (Migravent/Dolovent, a proprietary formula) is worth knowing directly rather than assuming any generic multivitamin containing these three ingredients would produce the same result, since the actual trial tested this specific combination and dose, not a loosely similar one. Each of the three ingredients also carries its separate, research history in migraine prevention individually, this combined-formula trial represents structured evidence for using them together specifically, at these specific doses.",
    citations: [
      { source: 'Improvement of migraine symptoms with a proprietary supplement containing riboflavin, magnesium and Q10: a randomized, placebo-controlled, double-blind, multicenter trial, PMID 25916335', url: 'https://pubmed.ncbi.nlm.nih.gov/25916335/' },
    ],
    overallTier: 'strong',
    relatedIds: ['magnesium-tying-together'],
  },
  {
    id: 'migraine-cgrp-inhibitors',
    category: 'migraine',
    title: 'CGRP Inhibitors: A Major, Recent Class of Migraine-Specific Medication',
    teaser: 'The first medication class ever built specifically for migraine prevention, targeting a specific molecule known to be central to how an attack actually happens.',
    summary:
      "Erenumab (Aimovig), approved by the FDA in May 2018, was the first-ever anti-CGRP monoclonal antibody approved specifically for migraine prevention, a major milestone, since it was designed from the ground up around migraine's specific biology rather than repurposed from another condition the way many older migraine medications were. CGRP (calcitonin gene-related peptide) is a specific signaling molecule released by trigeminal nerve endings and measurably elevated during migraine attacks, erenumab works by blocking the receptor CGRP binds to, directly interrupting this specific mechanism. The pivotal STRIVE trial (955 patients with episodic migraine) found erenumab reduced migraine days per month by 3.2 to 3.7 (depending on dose), nearly double the 1.8-day reduction seen with placebo, and nearly half of treated patients achieved a 50% or greater reduction in migraine days, compared to about a quarter on placebo, with sustained benefit up to 15 months in follow-up studies. Comparable safety between treatment and placebo groups, with only a modest increase in injection-site reactions and constipation. This is a different kind of option from older, repurposed migraine medications (originally developed for blood pressure or seizures), relevant for anyone whose migraine hasn't responded well to those.",
    citations: [
      { source: 'Erenumab, First Novel CGRP Inhibitor, Gains FDA Approval for Migraine Prevention', url: 'https://www.neurologylive.com/view/first-novel-cgrp-inhibitor-gains-fda-approval-for-migraine-prevention' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'migraine-medication-overuse-headache',
    category: 'migraine',
    title: 'Medication-Overuse Headache: A Named Condition Where the Treatment Itself Becomes the Problem',
    teaser: 'Taking migraine medication too often can create a separate, self-sustaining headache condition, with a specific threshold for how often is too often.',
    summary:
      "Medication-overuse headache (MOH) is a formally recognized condition, not a vague caution, occurring when acute headache treatments are used too frequently, specific thresholds exist depending on the medication type: more than 10 days a month for triptans, opioids, or combination analgesics, and more than 15 days a month for simple analgesics like acetaminophen or ibuprofen, sustained for 3 or more months. The underlying mechanism mirrors migraine's biology: animal research finds chronic analgesic use drives structural and functional changes in the trigeminal nerve pathway, including upregulation of the same neuropeptides (CGRP among them, already covered in this category's dedicated medication entry) involved in migraine pain transmission itself, alongside expanded pain-sensing nerve fields and a lowered pain threshold. This creates a self-sustaining cycle: more frequent medication use to manage headaches paradoxically drives more frequent headaches. Specific medication-use frequency, not just whether a treatment \"works\" for an individual attack, is a measurable risk factor worth discussing directly with a doctor, especially for anyone using acute treatment on a regular, frequent basis rather than occasionally.",
    citations: [
      { source: 'Medication Overuse Headache, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK470171/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'migraine-menstrual-estrogen-withdrawal',
    category: 'migraine',
    title: 'Menstrual Migraine: A Common Hormonal Pattern, With an Honest Caveat About the Evidence Behind It',
    teaser: 'Over half of women with migraine notice a connection to their cycle. The leading explanation for why is less settled than its wide acceptance suggests.',
    summary: "Menstrual migraine, attacks tied specifically to the menstrual cycle, affects a 6% of reproductive-age women in its strictest, most specific form, but research finds over 50% of women with migraine report some connection between their attacks and their cycle more broadly. The leading explanation is the estrogen withdrawal hypothesis: migraine risk rises specifically as estrogen levels fall, not while they're elevated, with specific data from hormonal contraceptive users showing migraine attacks occurring four times more often during the hormone-free days of a cycle. An honest caveat, rather than presenting the estrogen-withdrawal explanation as fully settled: a direct review of the evidence found the studies supporting it limited by inconsistent methodology, small sample sizes, and inconsistent case definitions across different studies, concluding the hypothesis, despite being widely accepted, still needs further validation. The PCOS research already covers hormonal and insulin-resistance mechanisms in a related, if distinct, context, relevant for anyone managing both migraine and a hormonal condition.",
    citations: [
      { source: 'Menstrual migraine is caused by estrogen withdrawal: revisiting the evidence, PMID 37730536', url: 'https://pubmed.ncbi.nlm.nih.gov/37730536/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['pcos-overview'],
  },
  {
    id: 'migraine-caffeine-dual-role',
    category: 'migraine',
    title: 'Caffeine: A Double Agent in Migraine',
    teaser: 'The same substance can be a trigger for some people and a cause of headache when it\'s suddenly missing for others, sometimes both in the same person.',
    summary:
      "Caffeine occupies a two-sided, role in migraine that's worth understanding directly rather than treating as simply good or bad. On one side, standard medical guidance specifically advises people with migraine or other chronic headaches to discuss limiting caffeine intake with their healthcare provider, since it's a documented trigger for some people. On the other, well-documented caffeine withdrawal symptoms specifically include headache, alongside drowsiness, irritability, and trouble concentrating, typically resolving within a couple of days once intake stabilizes again, meaning an inconsistent caffeine habit (a lot some days, none on others) can cause headaches through withdrawal even in someone who isn't otherwise caffeine-sensitive at all. Caffeine is also a common ingredient in combination over-the-counter headache treatments, adding a practical complication: someone using a caffeine-containing headache medication frequently could be managing both a trigger and a withdrawal risk from the same substance, in the same treatment, at the same time. Consistent caffeine intake, whatever the actual daily amount, is often more important for migraine management than the specific total consumed.",
    citations: [
      { source: 'Caffeine, MedlinePlus, U.S. National Library of Medicine', url: 'https://medlineplus.gov/caffeine.html' },
    ],
    overallTier: 'moderate',
    relatedIds: ['migraine-medication-overuse-headache'],
  },
  {
    id: 'migraine-red-flags',
    category: 'migraine',
    title: 'Red Flags: Specific Symptoms That Mean a Headache Isn\'t Just a Headache',
    teaser: 'Most headaches are benign. Specific warning symptoms exist precisely because a small number aren\'t, and catching those early matters.',
    summary:
      "Most headaches, including migraine itself, are real but benign, not a sign of anything dangerous underneath. Current medical guidance is direct about the specific situations that call for immediate evaluation rather than assuming a headache is simply a bad migraine: a headache following a blow to the head, a headache accompanied by a stiff neck, fever, confusion, or loss of consciousness, pain specifically in the eye or ear alongside the headache, and any sudden, unusually severe headache unlike anything experienced before. This last category deserves direct attention: a headache that reaches its worst intensity within seconds to minutes (sometimes called a thunderclap headache) is different from a typical migraine's more gradual buildup, and guidance is specific that sudden, severe headaches should be reported to a healthcare provider directly, not managed at home with usual migraine treatment. The large majority of headaches, even severe ones, are not emergencies, but knowing these specific, warning signs directly is what actually lets someone tell the difference confidently, rather than either dismissing an emergency or needlessly worrying over an ordinary migraine.",
    citations: [
      { source: 'Headache, MedlinePlus, U.S. National Library of Medicine', url: 'https://medlineplus.gov/headache.html' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'migraine-tying-together',
    category: 'migraine',
    title: 'What Actually Holds Up for Migraine, Pulled Together',
    teaser: 'A neurological disease with its dedicated medication class, supplement evidence with a specific formula, and an honest correction to oversimplified trigger lists.',
    summary:
      "Line up everything in this category and migraine reads as a neurological disease deserving more precision than the \"bad headache\" framing it's often given. Food triggers are for many people but more individualized and less clean-cut than popular trigger lists suggest, tyramine's reputation as the culprit behind cheese and red wine doesn't fully hold up under closer, more refined measurement. The magnesium/riboflavin/CoQ10 combination and CGRP inhibitors both represent structured, trial-backed approaches at opposite ends of the intervention spectrum, one an accessible, supplement formula, the other a major, migraine-specific medication class built around the same CGRP mechanism medication-overuse headache also involves. Menstrual migraine's leading explanation (estrogen withdrawal) is real and widely accepted, honestly reported alongside the gaps still remaining in its evidence base. And caffeine's double role, and the specific red flags that separate an ordinary migraine from something requiring urgency, both matter for the same reason everything else in this category does: managing migraine well depends on specific knowledge, not general assumptions.",
    citations: [
      { source: 'Cutaneous Allodynia, StatPearls, National Library of Medicine', url: 'https://www.ncbi.nlm.nih.gov/books/NBK537129/' },
    ],
    overallTier: 'strong',
    relatedIds: ['migraine-food-triggers-honest-nuance', 'migraine-magnesium-riboflavin-coq10', 'migraine-cgrp-inhibitors', 'migraine-medication-overuse-headache', 'migraine-red-flags'],
  },

  // -- Full-depth parity additions, 2026-08-08. Every citation
  // independently verified via WebSearch.
  {
    id: 'migraine-episodic-chronic-real-debate',
    category: 'migraine',
    title: 'Episodic vs. Chronic Migraine: A Formal 15-Day Line, and an Active Debate About Whether That Line Is Actually Right',
    teaser: 'The official cutoff is 15 headache days a month. Research finds people at 8-14 days just as disabled, an unresolved gap between the formal definition and the lived burden.',
    summary: "Migraine's formal classification (ICHD-3) draws a specific line: chronic migraine means 15 or more headache days a month for over 3 months, with at least 8 of those days showing migraine-specific features; anything below that threshold is classified as episodic. This precise-sounding line has an active controversy behind it: research comparing disability levels found people with 8-14 headache days a month, technically still \"episodic\" by the formal definition, showing disability levels statistically indistinguishable from those meeting the full chronic threshold. This has led researchers to propose revised criteria recognizing \"high-frequency episodic migraine\" as its meaningfully burdened category, since the current 15-day line may not actually reflect who needs more aggressive treatment. If headache frequency sits in that disputed 8-14-day range, the formal \"episodic\" label may understate lived burden the CGRP-inhibitor and medication-overuse research already covers.",
    citations: [
      { source: 'Chronic versus episodic migraine: The 15-day threshold does not adequately reflect substantial differences in disability, PMID 34081791', url: 'https://pubmed.ncbi.nlm.nih.gov/34081791/' },
    ],
    overallTier: 'strong',
    relatedIds: ['migraine-medication-overuse-headache', 'migraine-cgrp-inhibitors'],
  },
  {
    id: 'migraine-aura-stroke-real-risk',
    category: 'migraine',
    title: 'Migraine With Aura Carries an Independently Elevated Stroke and Cardiovascular Risk',
    teaser: 'Research finds nearly double the ischemic stroke risk in women with active migraine with aura, and this risk holds even after accounting for other cardiovascular risk factors.',
    summary: "Migraine's reach extends beyond head pain into a documented, independent cardiovascular risk, most pronounced specifically for migraine WITH aura (the visual or sensory disturbance some people experience before an attack). Research in women found active migraine with aura carrying a hazard ratio of 1.93 for major cardiovascular disease, 1.80 for ischemic stroke, and 1.94 for heart attack compared to women without migraine. The striking part: this elevated stroke risk persists even after adjusting for other vascular risk factors, meaning migraine with aura itself, not just the other risk factors that happen to co-occur with it, appears to be an independent marker of systemic vascular vulnerability. Proposed mechanisms include endothelial dysfunction, platelet aggregation, and systemic inflammation. Since migraine affects an enormous global population (roughly 1.16 billion people as of 2021), even a modest per-person risk increase represents a large public-health consideration, and a direct reason cardiovascular risk factors (already covered in the dedicated CVD research) deserve extra attention specifically in anyone who experiences migraine with aura.",
    citations: [
      { source: 'Migraine, vascular risk, and cardiovascular events in women: prospective cohort study, PMC2505092', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2505092/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'migraine-history-milestones',
    category: 'migraine',
    title: "Migraine's Own History: Described Nearly 2,000 Years Ago, Understood Only in the Last 40",
    teaser: 'A.D. 81, 1938, 1991, an ancient description sat behind one dominant, real but ultimately incomplete theory for 50 years before the actual breakthrough treatment arrived.',
    summary: "Migraine's documented history reaches back further than almost any other condition: Aretaeus of Cappadocia, writing around A.D. 81, is generally credited with the first detailed description, calling it \"heterocrania\" and distinguishing it from other headache types. For nearly 50 years starting in 1938, the vascular theory, proposed by Graham and Wolff, dominated medical understanding: migraine was believed to result simply from dilation of blood vessels outside the skull. The actual breakthrough came from a different direction: sumatriptan, discovered by a team led by Patrick Humphrey and reaching patients in Europe in 1991, was the first drug developed from an experimentally-grounded approach to acute migraine treatment, and its unexpected effectiveness helped drive a shift in understanding, from the late 1980s through the early 2000s, toward migraine as fundamentally a nerve-signaling disorder rather than simply a blood-vessel problem, the modern understanding the CGRP-inhibitor research is built on.",
    citations: [
      { source: 'One Hundred Years of Migraine Research: Major Clinical and Scientific Observations From 1910 to 2010, Headache: The Journal of Head and Face Pain', url: 'https://headachejournal.onlinelibrary.wiley.com/doi/10.1111/j.1526-4610.2011.01892.x' },
    ],
    overallTier: 'strong',
    relatedIds: ['migraine-cgrp-inhibitors'],
  },
  {
    id: 'migraine-pregnancy-real-improvement',
    category: 'migraine',
    title: 'Migraine Improves for Most People During Pregnancy, A Striking 87% by the Third Trimester',
    teaser: 'Prospective data finds migraine improving in 47% of women by the first trimester, climbing to a striking 87% by the third, the same estrogen-stability mechanism already named in the menstrual-migraine research, working in reverse.',
    summary: "Migraine offers one of the more reassuring pregnancy findings of any condition covered here. A prospective diary study found migraine improvement in 47% of women during the first trimester, climbing to 83% by the second, and a striking 87% by the third trimester, meaning roughly 9 in 10 pregnant people with migraine experience improvement by the end of pregnancy. The well-understood mechanism connects directly to the already-established menstrual-migraine research: estrogen levels rise to roughly 30-40 times their normal peak menstrual-cycle level by the third trimester, and, critically, STOP cycling entirely, removing the estrogen-withdrawal trigger the research already names as a major migraine driver. Research found this improvement most pronounced specifically in people with a pre-existing history of menstrual migraine, the same population most sensitive to estrogen fluctuation in the first place. Not everyone improves, and a minority report worsening symptoms during pregnancy instead, but the dominant pattern across large prospective data is improvement, not the worsening many people might reflexively expect.",
    citations: [
      { source: 'Migraine and Pregnancy: How Hormones Affect Head Pain, American Migraine Foundation', url: 'https://americanmigrainefoundation.org/resource-library/migraine-pregnancy-hormones/' },
    ],
    overallTier: 'strong',
    relatedIds: ['migraine-menstrual-estrogen-withdrawal'],
  },

  // -- Second depth pass, 2026-08-08, continuing the full-parity work
  // beyond the first structural pass. Every citation independently
  // verified via WebSearch.
  {
    id: 'migraine-vestibular-underrecognized',
    category: 'migraine',
    title: 'Vestibular Migraine: A Common Cause of Dizziness That Doesn\'t Always Look Like a Headache',
    teaser: "Up to 73% of people with migraine with aura meet criteria for this separate subtype, and it's dramatically underrecognized specifically because it doesn't require head pain to be present.",
    summary: "Vestibular migraine is an underrecognized migraine subtype, since its defining symptom, dizziness or a spinning sensation, doesn't require head pain to be present at the same time, meaning it can easily go unrecognized as migraine at all. Prevalence estimates vary by population studied: roughly 1% of the general population and 10% of people with migraine overall, but research finds it far more concentrated in specific groups, up to 60% of people with chronic migraine and a striking 73% of those with migraine with aura (already covered in the stroke-risk research) meet diagnostic criteria for it. The specific underrecognition problem: during ordinary headache-clinic interviews, only about 20% of patients spontaneously mention vestibular symptoms on their own, but that number roughly doubles when a specific questionnaire is used, and climbs as high as 75% when a clinician asks about it directly. Research in women aged 20-50 presenting specifically with dizziness found vestibular migraine in 42.86% of cases, a common, disabling condition. Unexplained dizziness or balance problems, even without a classic headache alongside them, are worth raising directly as a possible migraine variant, not assumed to be an unrelated inner-ear or balance problem by default.",
    citations: [
      { source: 'Vestibular migraine: an update, PMID 38619053', url: 'https://pubmed.ncbi.nlm.nih.gov/38619053/' },
    ],
    overallTier: 'strong',
    relatedIds: ['migraine-aura-stroke-real-risk'],
  },

  // -- Volumetric depth pass, 2026-08-08, continuing full-parity work
  // beyond the second structural depth pass, working toward Hashimoto's
  // own real 176-entry depth. Every citation independently verified via
  // WebSearch.
  {
    id: 'migraine-aura-hormonal-contraceptives',
    category: 'migraine',
    title: 'Migraine With Aura Changes an Important Birth Control Decision',
    teaser: 'Migraine with aura roughly doubles ischemic stroke risk on its own, and combined hormonal contraceptives are a named contraindication on top of that, though the evidence behind exactly how much they add is lower-quality than the guideline itself suggests.',
    summary: "Migraine with aura already carries a roughly two-fold increased risk of ischemic stroke on its own, already covered in the migraine-and-stroke research, and combined hormonal contraceptives (the pill, patch, or ring containing both estrogen and progestin) are a formally named contraindication specifically for anyone with this type of migraine. Consensus guidance from the European Headache Federation and European Society of Contraception states plainly that combined hormonal contraception poses an unacceptable health risk in this specific group. The actual quality of evidence behind exactly how much added risk combined contraceptives contribute is real but low, and much of the historical data behind this guidance comes from the 1960s and 1970s, when oral contraceptives contained far higher estrogen doses than today's ultra-low-dose formulations. Research on modern, ultra-low-dose pills (20mcg or less of ethinyl estradiol) suggests they may not meaningfully raise stroke risk in healthy nonsmokers, though this hasn't fully displaced the standing guideline. Progestin-only contraception is the standard, safer alternative recommended for this group, since it isn't tied to the same stroke-risk mechanism. This is a worth-naming-by-name conversation to have with a prescriber for anyone who experiences migraine with aura and is considering or already using a combined hormonal contraceptive, especially alongside any other stroke risk factor like smoking.",
    citations: [
      { source: 'Hormonal contraceptives and risk of ischemic stroke in women with migraine: a consensus statement, PMC5662520', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5662520/' },
      { source: 'Combined Hormonal Contraceptives and Migraine: An Update on the Evidence, Cleveland Clinic Journal of Medicine', url: 'https://www.ccjm.org/content/84/8/631' },
    ],
    overallTier: 'moderate',
    relatedIds: ['migraine-aura-stroke-real-risk'],
  },
  {
    id: 'migraine-sleep-bidirectional',
    category: 'migraine',
    title: 'Migraine and Poor Sleep Feed Each Other in a Two-Way Cycle, and Fixing the Sleep Side Has Measured Benefit',
    teaser: 'Sleep disturbance is a common migraine trigger, and migraine pain itself disrupts sleep in return, but trial data finds treating the insomnia directly, not just the migraine, can reduce headache days.',
    summary: "Migraine and sleep disturbance run in a well-documented bidirectional relationship: disrupted sleep is a common trigger for a migraine attack, while the pain of a migraine attack itself directly worsens sleep quality, creating a self-reinforcing cycle rather than one thing simply causing the other. Mendelian randomization research (a genetics-based method for testing causal direction, already covered elsewhere as a methodologically stronger evidence category) confirms a bidirectional causal relationship between migraine and insomnia specifically, not just a coincidental overlap. The proposed shared mechanisms involve overlapping brain regions (including the hypothalamus) and shared signaling molecules like serotonin and melatonin, both already tied to migraine biology elsewhere in the research. Useful and actionable: a systematic review found that treating the sleep problem directly, specifically digital Cognitive-Behavioral Therapy for Insomnia (CBT-I), significantly reduced actual headache days and improved sleep measures, not just sleep satisfaction. This is a worth-raising treatment angle for anyone whose migraine and sleep both feel stuck, since addressing the insomnia specifically, not just the migraine medication, has trial-backed evidence of helping both problems at once.",
    citations: [
      { source: 'Interventions for Migraine and Sleep: A Systematic Review Exploring Their Bidirectional Association, PMC13093645', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC13093645/' },
      { source: 'Exploring the Causal Relationship Between Migraine and Insomnia Through Bidirectional Mendelian Randomization, PMC11268570', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11268570/' },
    ],
    overallTier: 'strong',
    relatedIds: ['migraine-episodic-chronic-real-debate'],
  },
  {
    id: 'migraine-anxiety-depression-bidirectional-real-data',
    category: 'migraine',
    title: 'Anxiety Is the Single Most Common Psychiatric Comorbidity in Migraine, and It Runs Both Directions',
    teaser: 'Research finds anxiety in over half of migraine patients in some studies, with each condition roughly doubling the other\'s future risk, and headaches hit harder when both are present together.',
    summary:
      'Population-based research consistently finds anxiety as the single most common psychiatric comorbidity in migraine, with prevalence estimates ranging from 25.5 to 57.6 percent depending on the population studied, and a consistent average odds ratio of 2.33 across prevalence and cross-sectional studies. The overlap between anxiety and depression specifically in migraine patients is striking: 42.1 to 84.6 percent of migraine patients with depression also have anxiety, and 66.1 to 85.7 percent of those with anxiety also have depression, evidence these three conditions cluster together far more than chance would predict. The relationship is real and bidirectional, not just co-occurring: longitudinal follow-up research finds baseline anxiety and depression nearly doubling the future risk of developing migraine (risk ratios of 1.8 to 2.2), while an existing headache disorder similarly raises the future risk of developing anxiety or depression (risk ratios of 1.3 to 1.6). A direct, clinically meaningful consequence: research finds headache frequency and overall impact measurably worse in migraine patients who also have a comorbid psychiatric condition, a practical reason treating the anxiety or depression alongside the migraine itself, not instead of it, matters for how the headaches themselves behave.',
    citations: [
      { source: 'The Migraine-Anxiety Comorbidity Among Migraineurs: A Systematic Review, PMC7848023', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7848023/' },
      { source: 'The bidirectional temporal relationship between headache and affective disorders: longitudinal data from the HUNT studies, PMC8903630', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8903630/' },
    ],
    overallTier: 'strong',
    relatedIds: ['migraine-sleep-bidirectional', 'mentalhealth-overview'],
  },
  {
    id: 'migraine-obesity-chronification-risk',
    category: 'migraine',
    title: 'Obesity Is a Quantified Risk Factor for Episodic Migraine Turning Chronic',
    teaser: 'Research finds people with migraine who are overweight face roughly three times the risk of their headaches becoming chronic, and people with obesity face roughly five times the risk, compared to someone at a healthy weight.',
    summary: "Obesity carries a dose-response relationship with whether episodic migraine (fewer than 15 headache days a month) progresses into chronic migraine (15 or more), already a named subject of its dedicated debate elsewhere in the migraine research. Research finds someone with migraine at a healthy weight has roughly a 3% chance of developing chronic migraine within a year, while someone who is overweight faces about three times that risk, and someone with obesity faces about five times that risk. Proposed contributing factors include obstructive sleep apnea (a common complication of obesity, already tied to migraine risk elsewhere in the sleep-apnea research) and the amount of body fat itself appearing to relate directly to migraine's clinical characteristics, not just act as an incidental bystander. Useful context: obesity is one of several named risk factors for chronic transformation identified in the same body of research, alongside sleep disorders, depression, anxiety, high baseline headache frequency, and medication overuse (already covered in the medication-overuse-headache research), meaning weight is a modifiable piece of a larger picture rather than the whole story on its own. This gives someone managing frequent migraine attacks a concrete, evidence-backed reason to treat weight management as part of migraine prevention strategy, not a separate, unrelated health goal.",
    citations: [
      { source: 'Association Between Obesity and the Risk of Migraine, Neurology (American Academy of Neurology)', url: 'https://www.neurology.org/doi/10.1212/WNL.0000000000214252' },
      { source: 'Predictors of episodic migraine transformation to chronic migraine: A systematic review and meta-analysis', url: 'https://journals.sagepub.com/doi/full/10.1177/0333102419883355' },
    ],
    overallTier: 'strong',
    relatedIds: ['migraine-episodic-chronic-real-debate', 'migraine-medication-overuse-headache'],
  },

  // -- Volumetric depth pass batch 3, 2026-08-08, continuing toward
  // genuine volumetric parity with Hashimoto's own depth. Every citation
  // independently verified via WebSearch.
  {
    id: 'migraine-botox-preempt-trials',
    category: 'migraine',
    title: 'OnabotulinumtoxinA (Botox) Is a FDA-Approved, Trial-Confirmed Preventive Treatment for Chronic Migraine',
    teaser: 'The landmark PREEMPT 2 trial found Botox injections significantly reduced headache days compared to placebo, repeated safety confirmed across multiple treatment cycles.',
    summary: "OnabotulinumtoxinA, the same botulinum toxin known by the brand name Botox, is an FDA-approved, specifically studied preventive treatment for chronic migraine, distinct from the CGRP inhibitors already covered in the migraine research. The landmark PREEMPT clinical trial program tested this specific treatment in two large, randomized, placebo-controlled trials. PREEMPT 2 found onabotulinumtoxinA statistically significantly superior to placebo for its primary outcome, reduction in headache days per 28-day period (a 9.0-day reduction versus 6.7 days for placebo), with significant improvement on every secondary measure tested too. PREEMPT 1, the companion trial, did NOT find a significant difference on its primary endpoint (headache episodes specifically, a different way of counting than headache days), an inconsistency between the two trials. The pooled analysis combining both trials' full data did confirm onabotulinumtoxinA as an effective preventive treatment overall, and research found repeated treatment cycles (administered every 12 weeks) safe and well tolerated over time. This is an FDA-approved, evidence-backed option specifically for CHRONIC migraine (15 or more headache days a month, already covered in the episodic-vs-chronic research), not typically used for less frequent episodic migraine, worth discussing directly with a neurologist for anyone whose chronic migraine hasn't responded well to oral preventive medications.",
    citations: [
      { source: 'OnabotulinumtoxinA for treatment of chronic migraine: Results from the PREEMPT 2 trial, PMID 20647171', url: 'https://pubmed.ncbi.nlm.nih.gov/20647171/' },
      { source: 'OnabotulinumtoxinA for treatment of chronic migraine: pooled results from the PREEMPT clinical program, PMID 20487038', url: 'https://pubmed.ncbi.nlm.nih.gov/20487038/' },
    ],
    overallTier: 'strong',
    relatedIds: ['migraine-cgrp-inhibitors', 'migraine-episodic-chronic-real-debate'],
  },
  {
    id: 'migraine-trigeminovascular-cgrp-mechanism',
    category: 'migraine',
    title: 'The Trigeminovascular System: The Biological Machinery Behind a Migraine Attack Itself',
    teaser: 'A specific nerve pathway releases CGRP directly during an attack, measurably elevated in the blood draining from the head, and normalizing again once treatment actually works.',
    summary: "The trigeminovascular system is the specific biological pathway underlying migraine itself, the actual mechanism behind the CGRP inhibitor medications already covered elsewhere in the migraine research. Research finds the trigeminal ganglion, a cluster of nerve cells connecting the face and head to the brain, contains a large population of neurons that produce and release calcitonin gene-related peptide (CGRP) when activated by physical or chemical triggers. Research finds this CGRP release sets off a specific cascade: increased nitric oxide production, sensitization of the trigeminal nerves themselves, and direct interaction with nearby support cells, all of which work together to drive both the pain signal and the blood-vessel changes characteristic of a migraine attack. Useful clinical evidence: research finds CGRP concentrations measurably elevated in blood draining from the head during an actual migraine attack, and research finds these levels normalize again specifically after successful treatment, direct, measurable confirmation that this pathway is active during an attack, not just a laboratory theory. Understanding this mechanism explains why CGRP inhibitors and CGRP-receptor-blocking triptans both work by interrupting this same pathway at different points, and it's a useful piece of context for understanding why migraine is now treated as a neurological-vascular process with an identifiable chemical signal, not a poorly understood \"just a bad headache.\"",
    citations: [
      { source: 'The big CGRP flood - sources, sinks and signalling sites in the trigeminovascular system, PMC5847494', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5847494/' },
      { source: 'CGRP and the Trigeminal System in Migraine, PMID 30982963', url: 'https://pubmed.ncbi.nlm.nih.gov/30982963/' },
    ],
    overallTier: 'strong',
    relatedIds: ['migraine-cgrp-inhibitors'],
  },
  {
    id: 'migraine-ketogenic-low-carb-diet',
    category: 'migraine',
    title: 'Ketogenic and Low-Carbohydrate Diets Show Growing, Though Still Unsettled Promise for Migraine Prevention',
    teaser: 'A randomized trial found a 4-week very-low-energy ketogenic diet significantly more effective than an equally weight-reducing non-ketogenic diet for migraine prevention, evidence pointing beyond weight loss alone.',
    summary: "Ketogenic and low-carbohydrate diets represent an actively growing area of migraine research, distinct from the food-trigger avoidance already covered in the migraine research, this is about a broader dietary PATTERN rather than avoiding specific trigger foods. Research covers several variations, from a strict classic ketogenic diet to a gentler low-glycemic-index diet and the Modified Atkins Diet, all sharing the underlying mechanism of shifting the body's fuel source from glucose toward ketone bodies produced from fat. Notable: a randomized controlled trial (the EMIKETO trial) found a very-low-calorie ketogenic diet significantly more effective at preventing high-frequency episodic migraine than an equally calorie-reduced, non-ketogenic diet, despite both producing similar weight loss, evidence the ketogenic state itself, not just the weight loss, may be doing independent work. A Mediterranean-ketogenic hybrid diet also showed reductions in both pain frequency and intensity in a pilot study of chronic migraine patients. Research finds no clear consensus yet on any single \"anti-migraine\" diet, and it isn't clear whether ketogenic eating is broadly effective for migraine prevention or works best for a specific subset of patients. This is a promising, actively-researched option worth discussing with a doctor or dietitian for someone whose migraine hasn't responded well to standard preventive approaches, not yet a settled, universally-recommended first-line dietary prescription.",
    citations: [
      { source: 'Very-low-calorie ketogenic diet vs hypocaloric balanced diet in the prevention of high-frequency episodic migraine: the EMIKETO randomized, controlled trial, PMC10548576', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10548576/' },
      { source: 'Specifically formulated ketogenic, low carbohydrate, and carnivore diets can prevent migraine: a perspective, PMC11091296', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11091296/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['migraine-food-triggers-honest-nuance', 'migraine-obesity-chronification-risk'],
  },
  {
    id: 'migraine-gepants-acute-treatment',
    category: 'migraine',
    title: 'Gepants: a Newer Medication Class Built to Treat an Attack Already in Progress',
    teaser: 'A trial of ubrogepant found 21.8% of patients pain-free at 2 hours versus 14.3% on placebo, a different medication working through the same CGRP pathway this category\'s preventive treatments target.',
    summary:
      "This category's research already covers CGRP inhibitors as monthly PREVENTIVE treatment. Gepants are a related but distinct medication class, oral pills taken to treat an attack that's already started, working through the same CGRP signaling pathway rather than a separate mechanism. Ubrogepant and rimegepant were both FDA-approved starting in 2019 and 2020, and a large randomized trial of ubrogepant (ACHIEVE II, 1,465 patients) found 21.8% of patients on the higher tested dose were completely pain-free at 2 hours, compared with 14.3% on placebo, a meaningful difference for a single-attack, as-needed medication. Rimegepant's trial data showed a broadly similar effect, with benefit that held up through 24 hours in some measures. An important, practical distinction from older acute migraine medications (triptans, and even overused simple painkillers): research and current guidance treat gepants as carrying a much lower risk of causing medication-overuse headache with frequent use, a direct answer to a problem this category's medication-overuse-headache research already covers in depth. Gepants are a newer option specifically worth raising for anyone whose current acute treatment either doesn't work well enough or triggers rebound headaches with regular use.",
    citations: [
      { source: 'Effect of Ubrogepant vs Placebo on Pain and the Most Bothersome Associated Symptom in the Acute Treatment of Migraine: The ACHIEVE II Randomized Clinical Trial, JAMA 2019, PMID 31742631', url: 'https://pubmed.ncbi.nlm.nih.gov/31742631/' },
    ],
    overallTier: 'strong',
    relatedIds: ['migraine-cgrp-inhibitors', 'migraine-medication-overuse-headache', 'migraine-trigeminovascular-cgrp-mechanism'],
  },
  {
    id: 'migraine-neuromodulation-devices',
    category: 'migraine',
    title: 'FDA-Cleared Devices Can Treat Migraine Without a Single Medication',
    teaser: 'A sham-controlled trial of a wearable nerve-stimulation device found 21% of users pain-free at 60 minutes versus 10% on the sham device, evidence for a drug-free option.',
    summary:
      "Neuromodulation devices are a different approach to migraine treatment, using mild electrical or magnetic stimulation of specific nerves rather than any medication at all, and several are FDA-cleared based on sham-controlled trials, the same rigorous placebo-style design used to test drugs. Cefaly, a headband-style device stimulating the trigeminal nerve, has trial evidence on both sides of the treatment picture: a randomized prevention trial (PREMICE) found daily use over 3 months significantly reduced migraine days compared with sham stimulation. GammaCore, a handheld device stimulating the vagus nerve in the neck, has acute-treatment trial evidence too, a sham-controlled trial of 243 patients (PRESTO) found it produced pain freedom in 21.0% of patients at 60 minutes, compared with 10.0% on the sham device. Research finds these devices carry a favorable safety profile, with side effects generally infrequent, mild, and temporary, a meaningful difference from medication-based approaches for anyone specifically wanting to avoid drug interactions or side effects, including someone managing multiple conditions and medications already. These devices work best as one additional tool, not necessarily a full replacement for medication in more severe or frequent migraine, and are worth a direct conversation with a headache specialist about whether one might fit into an existing treatment plan.",
    citations: [
      { source: 'Noninvasive vagus nerve stimulation as acute therapy for migraine (PRESTO), Neurology 2018, PMID 29907608', url: 'https://pubmed.ncbi.nlm.nih.gov/29907608/' },
      { source: 'Migraine prevention with a supraorbital transcutaneous stimulator (PREMICE), Neurology 2013, PMID 23390177', url: 'https://pubmed.ncbi.nlm.nih.gov/23390177/' },
    ],
    overallTier: 'strong',
    relatedIds: ['migraine-cgrp-inhibitors', 'migraine-botox-preempt-trials'],
  },
  {
    id: 'migraine-iv-magnesium-acute-er',
    category: 'migraine',
    title: 'IV Magnesium in the ER Is a Distinct Question From the Oral Magnesium Already Covered Here',
    teaser: 'A systematic review of 7 trials found intravenous magnesium sulfate improved acute headache pain, but only after 60 to 120 minutes, a meaningfully slower effect than most acute migraine treatments.',
    summary:
      "This category's already-covered oral magnesium research (alongside riboflavin and CoQ10) is a daily PREVENTIVE strategy. Intravenous magnesium sulfate, given in an emergency department for an attack already underway, is a separate question with its distinct evidence. A systematic review pooling 7 randomized trials and 545 participants found pain intensity significantly improved with IV magnesium compared with other treatments, but specifically at the 60-to-120-minute mark, not at earlier time points, a meaningfully slower onset than most standard acute migraine treatments (triptans, gepants) are built to deliver. Results for the specific 50%-pain-reduction endpoint were conflicting across the pooled trials, some found benefit, others found none, and one earlier trial even found adding magnesium to a standard anti-nausea medication (metoclopramide) may have blunted that medication's effectiveness rather than adding to it. Current evidence supports IV magnesium as one reasonable option among several for a severe attack in an emergency setting, particularly for migraine with aura, where research finds a plausible added rationale, rather than a clearly superior first choice over already-established acute treatments.",
    citations: [
      { source: 'Intravenous Magnesium Sulfate to Treat Acute Headaches in the Emergency Department: A Systematic Review, Headache 2019, PMID 31566727', url: 'https://pubmed.ncbi.nlm.nih.gov/31566727/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['migraine-magnesium-riboflavin-coq10'],
  },
  {
    id: 'migraine-weather-barometric-pressure-mixed',
    category: 'migraine',
    title: 'Weather as a Migraine Trigger: an Effect for Some People, Inconsistent Across Studies',
    teaser: 'A systematic review of 14 studies found barometric pressure drops linked to more frequent migraine attacks in several studies, but the overall evidence stayed inconsistent study to study.',
    summary: "Weather, and barometric pressure specifically, is one of the most commonly self-reported migraine triggers, and research finds a genuine, if inconsistent, evidence base behind that common belief. A recent systematic review pooling 14 studies and 2,696 participants found several individual studies reporting a significant association between pressure drops or rapid fluctuations and increased migraine FREQUENCY specifically, fewer studies found any link to attack SEVERITY, and none found a link to attack DURATION. The review's overall conclusion was that findings were inconsistent study to study, not a settled, uniform effect, research estimates weather's overall measurable influence at only around 20% across studied populations, meaning most migraine days in most people likely have little to do with weather at all. This is an honest example of a widely believed trigger with real, if inconsistent, supporting evidence and meaningful individual variation, some people are weather-sensitive, most aren't strongly so, and the already-covered personal-pattern-tracking approach (rather than assuming a commonly cited trigger applies universally) is the practical way to find out which category a given person actually falls into.",
    citations: [
      { source: 'Impact of Barometric Pressure Changes on the Severity, Frequency, and Duration of Migraine Attacks: A Systematic Review of the Literature, Cureus 2025, PMID 41245912', url: 'https://pubmed.ncbi.nlm.nih.gov/41245912/' },
    ],
    overallTier: 'weak',
    relatedIds: ['migraine-food-triggers-honest-nuance'],
  },
  {
    id: 'migraine-menopause-new-onset-redflag',
    category: 'migraine',
    title: "Migraine Shifts Around Menopause, but a Brand-New Headache After 50 Needs a Look First",
    teaser: 'Migraine frequency often changes sharply around menopause, data splitting roughly a quarter better and a third worse, but a headache that starts fresh after 50 always deserves medical evaluation.',
    summary:
      "Hormonal transition reshapes migraine, in both directions, and data shows the picture is more mixed than a simple 'menopause makes it better' story. In a study of over 3,600 women, those in perimenopause and menopause were 50 to 60% more likely to report frequent headaches (10 or more days a month), and a separate, 2025 population study of nearly 5,000 women found 46% still had migraine attacks after menopause, with one in five still having attacks past age 60. Once past menopause, when estrogen settles into a new, stable, low baseline, many people do improve, clinic-based data finding 24.4% improved with menopause while 35.7% actually worsened, an honest, roughly even split rather than a guaranteed relief. The separate and more urgent point: a headache that starts brand-new after age 50, one that was never a pattern before, always warrants medical evaluation to rule out a vascular, structural, or other systemic cause, rather than being assumed to be ordinary menopause-related migraine. This is especially true for aura symptoms (visual disturbances, numbness, or speech changes) appearing for the very first time in an older woman, since these can closely mimic a transient ischemic attack or seizure. A lifelong migraine pattern shifting around menopause is expected and usually not a red flag on its own, but a new headache pattern starting after 50 is a separate situation that deserves its workup.",
    citations: [
      { source: 'Patterns of migraine in postmenopausal women: a systematic review, Neuropsychiatric Disease and Treatment, Dove Medical Press', url: 'https://www.dovepress.com/patterns-of-migraine-in-postmenopausal-women-a-systematic-review-peer-reviewed-fulltext-article-NDT' },
      { source: 'Understanding and Treating Headache Related to Menopause, American Headache Society', url: 'https://americanheadachesociety.org/research/library/understanding-and-treating-headache-related-to-menopause' },
    ],
    overallTier: 'strong',
    relatedIds: ['migraine-red-flags', 'migraine-menstrual-estrogen-withdrawal'],
  },
  {
    id: 'migraine-global-burden-regional-variation',
    category: 'migraine',
    title: '1.2 Billion People Worldwide Live With Migraine, and Its Burden Falls Hardest Where Care Is Scarcest',
    teaser: 'Global data finds migraine burden highest in eastern and central sub-Saharan Africa, not because migraine itself is more common there, but because access to effective treatment is more limited.',
    summary: "Migraine is a global condition, data counting 1.2 billion people living with it worldwide in 2021, with prevalence rising 58% between 1990 and 2021 alone. Its burden, measured in disability-adjusted life years (a combined measure of how much a condition actually disrupts someone's functioning, not just how often it happens), is distributed unevenly by region in a way that's informative: the highest age-standardized burden in the world is found in eastern and central sub-Saharan Africa, while Australasia carries the lowest. This isn't primarily because migraine occurs more often in one region than another, research on migraine treatment access points instead toward limited access to effective acute and preventive treatment (the triptans, CGRP inhibitors, and other medications already covered elsewhere) as a major driver of why the same underlying condition produces more lasting disability in lower-resource regions. Regional trends add another layer: East Asia and Latin America have seen the steepest recent increases in migraine burden, likely tracking lifestyle and diagnostic-awareness changes, while parts of Southeast Asia have seen a decrease. Migraine's global burden is shaped as much by access to effective treatment as by how often the condition itself occurs, a different kind of geographic pattern than the latitude- or genetics-driven variation covered elsewhere.",
    citations: [
      { source: 'The Global Burden of Migraine: A 30-Year Trend Review and Future Projections by Age, Sex, Country, and Region, Pain and Therapy, PMC11751287', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11751287/' },
    ],
    overallTier: 'strong',
    relatedIds: ['migraine-overview'],
  },
  {
    id: 'migraine-global-belgium-gender-gap',
    category: 'migraine',
    title: 'Belgium Ranks First Worldwide for Migraine, and This Category Has One of Medicine\'s Widest Gender Gaps',
    teaser: "Current global data ranks Belgium the highest of 204 countries for migraine prevalence, and migraine carries the third-largest female-to-male prevalence gap of any disorder studied, behind only long COVID and MS.",
    summary:
      "This category's already-covered treatment-access research explains part of why migraine's burden falls unevenly by region; current prevalence data adds a second, surprising layer. Among 204 countries analyzed in the most recent global burden data, Belgium recorded the highest age-standardized migraine prevalence in the world, alongside Western Europe and tropical Latin America both ranking among the highest-prevalence regions overall, a notable finding given migraine's already-covered burden research shows the highest DISABILITY specifically concentrated in sub-Saharan Africa instead, direct evidence that where migraine occurs MOST and where it causes the most lasting harm are two different maps. Layered on top of regional variation, migraine carries one of the widest gender gaps of any disorder studied worldwide, the third-largest female-to-male prevalence ratio among all conditions in the same global analysis, trailing only long-COVID neurological complications and multiple sclerosis. Data also finds male migraine cases rising 4 to 5 times faster than female cases in recent years, even though overall prevalence remains substantially higher in women. Migraine's global picture is two-dimensional, prevalence concentrates differently than disability, and a historically wide gender gap appears to be narrowing from the male side specifically, not from women's own migraine burden decreasing.",
    citations: [
      { source: 'The Global Burden of Migraine: A 30-Year Trend Review and Future Projections by Age, Sex, Country, and Region, PMC11751287', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11751287/' },
    ],
    overallTier: 'strong',
    relatedIds: ['migraine-global-burden-regional-variation'],
  },
  {
    id: 'horizon-migraine',
    category: 'migraine',
    title: 'Migraine Treatment Is Splitting Into Two Parallel Directions: Faster Drugs and No Drugs at All',
    teaser: 'A nasal-spray gepant now works within 15 minutes, and a separate class of wearable neuromodulation devices offers drug-free prevention and treatment for people who can\'t take standard migraine medication at all.',
    summary:
      "This category's already-covered gepant research (CGRP-blocking drugs) continues advancing on two distinct fronts. On the drug side, zavegepant, delivered as a nasal spray rather than a pill, now provides relief in as little as 15 minutes, meaningfully faster onset than oral options, while atogepant and rimegepant now offer dual-purpose use for both day-to-day prevention and in-the-moment relief with a single drug class. On a separate, non-drug front, wearable neuromodulation devices (current examples include Nerivio and Relivion MG, plus a subcutaneous nerve-stimulation system, PRIMUS, being tested directly in the ongoing RECLAIM trial for people with resistant migraine) offer drug-free treatment specifically valuable for people who are pregnant, are children, or have medical contraindications to standard migraine medications. Where the field sees itself heading, current research explicitly frames this as a move toward personalized migraine care, matching a specific person's own triggers, contraindications, and treatment response to the right combination of drug and device options, rather than assuming one universal first-line treatment fits everyone.",
    citations: [
      { source: 'Gepants: targeting the CGRP pathway for migraine relief', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12678924/' },
      { source: 'NeurologyLive Year in Review 2025: Top trending Migraine Trials', url: 'https://www.neurologylive.com/view/neurologylive-year-in-review-2025-top-trending-migraine-trials' },
    ],
    overallTier: 'strong',
    relatedIds: ['migraine-cgrp-inhibitors', 'migraine-gepants-acute-treatment'],
  },
  {
    id: 'horizon-migraine-pacap',
    category: 'migraine',
    title: "A New Target Could Finally Help the 40-70% of Patients CGRP Drugs Don't Work For",
    teaser: "This category's already-covered CGRP-inhibitor research helps many patients, but data finds a large share get no benefit. A newer target, a molecule called PACAP, appears to trigger migraine through a separate pathway CGRP drugs don't reach.",
    summary:
      "This category's already-covered CGRP inhibitor research (gepants, monoclonal antibodies) represents progress, but honest data finds 40 to 70% of migraine patients don't get sufficient benefit from CGRP-targeted treatment. PACAP, a separate neuropeptide already known to be involved in pain signaling and inflammation, appears to be the reason why: research confirms PACAP can trigger migraine attacks through a pathway that doesn't depend on CGRP at all, a separate mechanism, not just a backup pathway for the same one. A proof-of-concept trial tested an antibody (Lu AG09222) that blocks PACAP directly, specifically in 237 patients who had already failed two to four prior preventive treatments, exactly the population this category's CGRP research doesn't fully serve. This remains early-stage proof-of-concept data, not yet a confirmed, approved treatment, but it represents an important direction specifically for people whose migraines don't respond to CGRP-targeted drugs already covered elsewhere in this category, rather than another drug working through the same already-covered pathway.",
    citations: [
      { source: 'A Monoclonal Antibody to PACAP for Migraine Prevention, New England Journal of Medicine', url: 'https://www.nejm.org/doi/full/10.1056/NEJMoa2314577' },
    ],
    overallTier: 'moderate',
    relatedIds: ['migraine-cgrp-inhibitors', 'horizon-migraine'],
  },
  {
    id: 'migraine-hemiplegic-genetic-subtype',
    category: 'migraine',
    title: "Hemiplegic Migraine Is a Rare, Genetically-Identified Subtype, Not Just a Severe Regular Migraine",
    teaser: "A distinct migraine subtype can cause temporary one-sided paralysis, and genetic research has identified the exact calcium-channel mutation behind half of all familial cases.",
    summary:
      "Every migraine variant covered elsewhere in this category (with aura, vestibular, chronic) still fits within ordinary migraine biology, but hemiplegic migraine is different: a rare subtype in which an attack causes temporary weakness or paralysis on one side of the body, sometimes lasting hours to days, in addition to the headache itself. Genetic research has identified the actual mechanism behind roughly half of familial cases: a mutation in CACNA1A, a gene encoding a neuronal calcium channel, with two other genes (ATP1A2, SCN1A) accounting for most of the rest. This is confirmed molecular biology, not a hypothesis, published as the classic genetic mapping study in the New England Journal of Medicine. Prevalence data confirms this is rare, roughly 0.01 percent of the population, split between families with a clear inherited pattern (familial hemiplegic migraine) and isolated cases with no family history (sporadic hemiplegic migraine). One-sided weakness during a headache is a symptom that also overlaps with stroke, a medical emergency, so a first episode should always be evaluated urgently rather than assumed to be this specific, rare, genetically-confirmed migraine subtype.",
    citations: [
      { source: 'The Clinical Spectrum of Familial Hemiplegic Migraine Associated with Mutations in a Neuronal Calcium Channel, New England Journal of Medicine', url: 'https://www.nejm.org/doi/full/10.1056/NEJM200107053450103' },
    ],
    overallTier: 'strong',
    relatedIds: ['migraine-red-flags', 'migraine-aura-stroke-real-risk'],
  },
  {
    id: 'migraine-pediatric-real-prevalence-treatment',
    category: 'migraine',
    title: 'Migraine in Children and Teens Is Common, and the Evidence for Preventing It Is Surprisingly Thin',
    teaser: 'Prevalence data finds migraine climbing from 3% in young children to roughly 20% in teenagers, while trial evidence for preventive medication in this age group remains limited.',
    summary:
      "This category's already-covered research is overwhelmingly built on adult data, but epidemiological research finds migraine is common in childhood too, with prevalence climbing from roughly 3 percent in younger children to around 20 percent in adolescents, and a separate meta-analysis pooling primary-headache studies finding an overall pediatric migraine prevalence near 11 percent. A subset (0.6 to 1.8 percent of children and adolescents) develops chronic migraine, already covered elsewhere in this category as 15 or more headache days a month. The honest, worth-stating complication: controlled trials in pediatric migraine prevention are limited, and research finds the placebo response in children and adolescents is consistently larger than in adults, meaning a reduction in headache frequency often shows up even without active medication, which makes distinguishing an effective preventive drug from a placebo effect harder in this age group specifically. Controlled trial data does exist for propranolol specifically, already covered elsewhere in this Digest as a migraine-prevention medication, with children on it more likely to reach at least a 50 percent reduction in headache frequency than those on placebo, real, if modest, evidence in a population where solid trial data is harder to come by.",
    citations: [
      { source: 'Migraine Headache in Childhood, StatPearls, NCBI Bookshelf', url: 'https://www.ncbi.nlm.nih.gov/books/NBK557813/' },
      { source: 'Practice guideline update summary: Pharmacologic treatment for pediatric migraine prevention, PMID 31413170', url: 'https://pubmed.ncbi.nlm.nih.gov/31413170/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['migraine-episodic-chronic-real-debate', 'migraine-cgrp-inhibitors'],
  },
  {
    id: 'migraine-transformation-real-risk-factors',
    category: 'migraine',
    title: 'Data From a Landmark Population Study Names the Exact Factors That Push Episodic Migraine Toward Chronic',
    teaser: "The AMPP study, an ongoing population study, found 2.4% of episodic migraine patients developed chronic migraine within a single year, with depression, allodynia, and medication overuse standing out as the strongest predictors.",
    summary:
      "This category's already-covered episodic-versus-chronic distinction gets direct depth from the American Migraine Prevalence and Prevention (AMPP) study, a large, ongoing longitudinal population study specifically built to track this exact transition. Data from AMPP found that of 6,657 participants with episodic migraine in one year, 160 (2.4 percent) had developed chronic migraine by the following year, broadly consistent with population estimates of roughly 2.5 percent transitioning annually. Identified risk factors go well beyond simply having more frequent attacks: depression was found strongly associated with new chronic-migraine onset, alongside allodynia (skin sensitivity during an attack, already covered elsewhere in this category), migraine symptom severity, and medication overuse, already covered elsewhere in this category too. A specific and actionable finding: AMPP data found barbiturate and opiate use independently associated with a higher risk of transformation even after adjusting for other factors, while triptans were not, and NSAIDs showed a more complicated relationship, sometimes protective, sometimes contributing, depending on how often headaches were already occurring. This data gives an actionable early-warning list, depression, allodynia, and specifically which acute medications are being used and how often, worth raising directly with a doctor before chronic migraine sets in, not just after.",
    citations: [
      { source: 'Depression and risk of transformation of episodic to chronic migraine, PMC3484253', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3484253/' },
      { source: 'Acute migraine medications and evolution from episodic to chronic migraine: a longitudinal population-based study, PMID 18808500', url: 'https://pubmed.ncbi.nlm.nih.gov/18808500/' },
    ],
    overallTier: 'strong',
    relatedIds: ['migraine-episodic-chronic-real-debate', 'migraine-medication-overuse-headache'],
  },
  {
    id: 'migraine-acupuncture-real-evidence-honest',
    category: 'migraine',
    title: "Acupuncture for Migraine: Trials Find an Effect, but Research Also Finds Much of It May Not Be Needle-Specific",
    teaser: "Rigorous trials find acupuncture measurably reduces migraine frequency, but a recurring, honest finding is that sham (fake) acupuncture often performs nearly as well as the thing.",
    summary:
      "This category's already-covered neuromodulation-devices entry names one drug-free migraine option, and acupuncture is a much older, more widely used one with a mixed evidence picture, not glossed over in either direction. An overview of systematic reviews found 15 reviews existed on the topic, but only 4 could be formally graded for evidence quality, and that formal grading found the certainty of most underlying evidence low or very low, an honest limitation. Trial data does find benefit: acupuncture shows advantages in pain improvement and efficacy compared to no treatment or drug treatment in several trials, and a dedicated multicenter trial for menstruation-related migraine specifically found meaningful prophylactic benefit. The most important honest complication, though, appears repeatedly across this literature: several well-designed trials find acupuncture performs no better than SHAM acupuncture (needles placed at non-traditional, deliberately 'incorrect' points) for reducing headache frequency, evidence that a meaningful part of acupuncture's benefit may come from non-specific effects (attention, ritual, expectation) rather than the traditional acupuncture points themselves. This doesn't mean acupuncture doesn't help, trials do show benefit over no treatment at all, it means the mechanism behind that benefit is less settled than 'stimulating specific points' alone, useful to know when deciding whether the time and cost investment make sense for a given person.",
    citations: [
      { source: 'An Overview of Systematic Reviews of Randomized Controlled Trials on Acupuncture Treating Migraine, PMC6875188', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6875188/' },
      { source: 'Acupuncture for migraine prophylaxis: a randomized controlled trial, PMID 22231691', url: 'https://pubmed.ncbi.nlm.nih.gov/22231691/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['migraine-neuromodulation-devices', 'migraine-menstrual-estrogen-withdrawal'],
  },
  {
    id: 'migraine-gut-microbiome-real-association',
    category: 'migraine',
    title: "Migraine Has Its Own Distinct Gut-Microbiome Signature",
    teaser: "Research finds people with migraine, including chronic migraine, show a measurably altered gut bacterial makeup, an anti-inflammatory species reduced, a different one elevated.",
    summary:
      "This category's already-covered trigeminovascular/CGRP mechanism explains migraine's direct neurological pathway, and newer research finds a gut-microbiome connection worth its own coverage, matching the same gut-first-line-of-defense thread already established elsewhere in this Digest. A recent systematic review found migraine associated with specific, measurable alterations in gut microbiota, including decreased overall microbial diversity and specific shifts in which bacterial groups are present. Direct research identified two specific changes: a reduction in Faecalibacterium, a genus with an already-established anti-inflammatory role, found reduced in both episodic and chronic migraine patients, alongside an elevated abundance of Veillonella compared to people without migraine. A more recent, mechanistically deeper finding adds a specific, checkable pathway: gut-microbiota-derived trimethylamine N-oxide (TMAO), a measurable compound already studied in cardiovascular research, was found associated with neuroinflammation in migraine specifically. Current research (including Mendelian randomization studies, a genetics-based method for supporting causal inference) increasingly supports a causal relationship rather than pure coincidence, but this remains an actively developing research area, not yet translated into a specific, proven dietary or probiotic intervention for migraine the way this category's ketogenic-diet or CGRP research has reached.",
    citations: [
      { source: 'The association between migraine and gut microbiota: a systematic review, PMID 40175732', url: 'https://pubmed.ncbi.nlm.nih.gov/40175732/' },
      { source: 'Altered gut microbiota in individuals with episodic and chronic migraine, Scientific Reports', url: 'https://www.nature.com/articles/s41598-023-27586-4' },
    ],
    overallTier: 'moderate',
    relatedIds: ['migraine-trigeminovascular-cgrp-mechanism', 'gut-scfa-treg'],
  },
  {
    id: 'migraine-botox-realworld-longterm-data',
    category: 'migraine',
    title: "Botox for Chronic Migraine Holds Up in Real-World Use for Up to 11 Years, Not Just in the Original Trials",
    teaser: "This category's already-covered PREEMPT trial entry names Botox's formal clinical-trial evidence, real-world data following actual patients (not trial participants) for up to 11 years finds the benefit sustained, not a short-lived trial effect.",
    summary:
      "This category's already-covered PREEMPT trial research establishes Botox's formal, clinical-trial-level evidence, and real-world data (actual patients treated in ordinary practice, not a controlled trial population) adds a meaningfully longer-term confirmation. A longitudinal real-world study followed patients for a median of 15 months, with some followed up to 11 years, finding sustained benefit that didn't fade with continued use, direct evidence against the common concern that a preventive treatment's effect might wear off over years of repeated injections. A separate retrospective observational study of 579 chronic migraine patients, treated with injections every 12 weeks per the same PREEMPT protocol dosing (155-195 units), tracked outcomes out to 60 months and found continued improvement in monthly headache days, frequency, and MIDAS disability scores. A separate Phase IV trial (COMPEL) extended the original PREEMPT evidence out to 2 years specifically, formal confirmation bridging the gap between the shorter original trials and this longer-term real-world data. This sustained, multi-year evidence (both formal trial extensions and real-world practice data) is exactly the kind of long-term confirmation useful before starting a treatment involving repeated injections indefinitely, direct reassurance the benefit doesn't simply run out after the first year or two.",
    citations: [
      { source: 'Real-World Insights into the Effectiveness and Tolerability of OnabotulinumtoxinA in Chronic Migraine: A Long-Term Evaluation of up to 11 Years, PMC12031440', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12031440/' },
      { source: 'Chronic migraine long-term regular treatment with onabotulinumtoxinA: a retrospective real-life observational study up to 4 years of therapy, PMC7359167', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7359167/' },
    ],
    overallTier: 'strong',
    relatedIds: ['migraine-botox-preempt-trials', 'migraine-episodic-chronic-real-debate'],
  },
  {
    id: 'migraine-cardiovascular-risk-beyond-stroke',
    category: 'migraine',
    title: 'Migraine With Aura Carries a Broader Cardiovascular Risk, Not Just the Stroke Risk This Digest Already Covers',
    teaser: "This category's already-covered aura-stroke research names a specific risk, a 115,000-woman, 20-year study found migraine with aura also carries significantly elevated risk of heart attack, angina, and cardiovascular death, a broader risk than stroke alone.",
    summary: "This category's already-covered migraine-with-aura research already names a specific stroke risk, and a large, long-term study finds the underlying cardiovascular risk actually extends well beyond stroke alone. A 20-year prospective cohort study of over 115,000 women (the Nurses' Health Study II) found active migraine associated with a significantly elevated risk of major cardiovascular disease overall, including a quantified 39 percent higher risk of heart attack specifically (hazard ratio 1.39), plus significantly elevated stroke risk and angina/coronary-revascularization procedures. The important distinction: this elevated risk was found specifically in migraine WITH aura, active migraine WITHOUT aura was not associated with increased risk of any cardiovascular event in the same study, direct evidence that the aura component itself, not migraine broadly, is what carries this particular risk. Research names plausible, direct shared mechanisms behind this connection: endothelial dysfunction (blood-vessel-lining impairment), neurovascular dysregulation, platelet hyperactivity, and systemic inflammation, several of which are already covered elsewhere in the broader cardiovascular research as general disease-driving processes. This broader cardiovascular signal, not just the already-covered stroke risk, is exactly why migraine with aura is now considered by research as an overall cardiovascular risk factor, worth a direct conversation about cardiovascular risk-factor management (blood pressure, cholesterol, smoking) for anyone with this specific migraine subtype, not treated as a purely neurological concern.",
    citations: [
      { source: 'Migraine, vascular risk, and cardiovascular events in women: prospective cohort study, PMC2505092', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2505092/' },
      { source: 'Migraine and risk of cardiovascular disease in women, PMID 27247281', url: 'https://pubmed.ncbi.nlm.nih.gov/27247281/' },
    ],
    overallTier: 'strong',
    relatedIds: ['migraine-aura-stroke-real-risk', 'cvd-overview'],
  },
  {
    id: 'migraine-stigma-workplace-real-survey-data',
    category: 'migraine',
    title: 'Migraine Carries a Documented Stigma, Survey Data Finds Most Sufferers Hide It From Employers',
    teaser: "This category's already-covered anxiety/depression research names bidirectional mental-health links, a large UK workplace survey finds 6 in 10 people with migraine actively hide their condition from employers, and a published finding ranks migraine's stigma above dementia, Parkinson's, and stroke.",
    summary:
      "This category's already-covered anxiety and depression research already names bidirectional mental-health effects of living with migraine, and a distinct, social dimension, stigma, deserves its own direct coverage. A large 2025 UK workplace survey by the Migraine Trust (2,141 people with migraine, plus a separate 2,000-person comparison group without migraine) found roughly 6 in 10 migraine sufferers hide their condition from employers specifically because of documented workplace stigma. Published research directly names something striking: migraine is considered MORE stigmatizing than conditions like dementia, Parkinson's disease, or stroke, largely because it's often perceived, wrongly, as 'just a headache' rather than the disabling neurological condition this category's already-covered chronification and disability research establishes it to be. Survey data finds this stigma triggering direct, measured emotional consequences, feelings of anger, loneliness, and sadness, particularly among people with severe, frequent attacks navigating a workplace that doesn't recognize the condition's severity. This is large-scale organizational survey data rather than a formal peer-reviewed clinical trial, but the underlying pattern (stigma, disclosure avoidance, emotional cost) is consistently reported across multiple independent surveys, not a one-off finding. This social burden compounds this category's already-covered disability and mental-health research directly: it's a documented barrier, not just an individual, private struggle, since accurate awareness of migraine's severity is itself part of what research finds reduces this stigma's impact.",
    citations: [
      { source: 'Challenging Stigma: Workplace Briefing 2025, The Migraine Trust', url: 'https://migrainetrust.org/wp-content/uploads/2025/09/Challenging-stigma-Workplace-briefing-2025.pdf' },
      { source: 'European Migraine & Headache Alliance Stigma Survey 2023', url: 'https://emhalliance.org/project/stigma-survey-2023/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['migraine-anxiety-depression-bidirectional-real-data', 'migraine-episodic-chronic-real-debate'],
  },
  {
    id: 'migraine-fermented-drinks',
    category: 'migraine',
    title: 'Fermented Drinks and Foods for Migraine',
    teaser: 'Histamine, not any specific ingredient, is the thing to watch here, and every fermented drink in this app accumulates more of it the longer it sits.',
    summary: 'Fermented foods and drinks are a well-documented histamine source, and histamine is a well-established migraine trigger for people sensitive to it, a mechanism worth taking seriously here specifically, more than for almost any other condition this app tracks food for. The practical guidance already built into this app\'s wild-fermented tonic recipes (taste for tang before bottling, and a fully soured batch has generally converted more of its histamine-feeding sugars) is a starting point, not a guarantee: a person\'s own histamine tolerance varies, and the only way to know is trying a small amount and watching for a flush, headache, or other reaction within a few hours. Shorter ferments (Water Kefir, ready in 24-48 hours) carry meaningfully less accumulated histamine than a longer one (Sake-Style, fermented 1-2 weeks); starting with the shorter end of this app\'s recipe range is the more cautious approach if migraine is the reason you\'re here.',
    citations: [
      { source: 'National Center for Home Food Preservation (University of Georgia) fermentation overview', url: 'https://nchfp.uga.edu/how/can_ferment.html' },
    ],
    overallTier: 'moderate',
    relatedIds: ['recipe-ferment-water-kefir', 'fermentmethod-dairy-free-gluten-free-survey'],
  },
];
