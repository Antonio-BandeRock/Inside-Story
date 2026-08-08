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
    relatedIds: ['magnesium-tying-together'],
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

  // -- Full-depth parity additions, 2026-08-08. Every citation
  // independently verified via WebSearch.
  {
    id: 'migraine-episodic-chronic-real-debate',
    category: 'migraine',
    title: 'Episodic vs. Chronic Migraine: A Real, Formal 15-Day Line -- and a Real, Active Debate About Whether That Line Is Actually Right',
    teaser: 'The official real cutoff is 15 headache days a month. Real research finds people at 8-14 days genuinely just as disabled, a real, unresolved gap between the formal definition and the real lived burden.',
    summary:
      "Migraine's own real, formal classification (ICHD-3) draws a specific line: chronic migraine means 15 or more headache days a month for over 3 months, with at least 8 of those days showing real migraine-specific features; anything below that threshold is classified as episodic. This real, precise-sounding line has a genuine, active controversy behind it worth knowing directly: real research comparing disability levels found people with 8-14 headache days a month, technically still \"episodic\" by the formal definition, showing real disability levels statistically indistinguishable from those meeting the full chronic threshold. This has led real researchers to propose revised criteria recognizing \"high-frequency episodic migraine\" as its own real, meaningfully burdened category, since the current 15-day line may not actually reflect who needs more aggressive treatment. Worth knowing directly if headache frequency sits in that real, disputed 8-14-day range: the formal \"episodic\" label may understate real, lived burden this app's own CGRP-inhibitor and medication-overuse research already covers.",
    citations: [
      { source: 'Chronic versus episodic migraine: The 15-day threshold does not adequately reflect substantial differences in disability, PMID 34081791', url: 'https://pubmed.ncbi.nlm.nih.gov/34081791/' },
    ],
    overallTier: 'strong',
    relatedIds: ['migraine-medication-overuse-headache', 'migraine-cgrp-inhibitors'],
  },
  {
    id: 'migraine-aura-stroke-real-risk',
    category: 'migraine',
    title: 'Migraine With Aura Carries a Real, Independently Elevated Stroke and Cardiovascular Risk',
    teaser: 'Real research finds nearly double the ischemic stroke risk in women with active migraine with aura -- and this real risk holds even after accounting for other cardiovascular risk factors.',
    summary:
      "Migraine's own reach extends beyond head pain into a real, documented, independent cardiovascular risk, most pronounced specifically for migraine WITH aura (the visual or sensory disturbance some people experience before an attack). Real research in women found active migraine with aura carrying a hazard ratio of 1.93 for major cardiovascular disease, 1.80 for ischemic stroke, and 1.94 for heart attack compared to women without migraine. The real, striking part: this elevated stroke risk persists even after adjusting for other real vascular risk factors, meaning migraine with aura itself, not just the other risk factors that happen to co-occur with it, appears to be an independent marker of real, systemic vascular vulnerability. Real, proposed mechanisms include endothelial dysfunction, platelet aggregation, and systemic inflammation, worth knowing directly since migraine affects a real, enormous global population (roughly 1.16 billion people as of 2021), meaning even a modest per-person real risk increase represents a genuinely large real public-health consideration, and a real, direct reason cardiovascular risk factors (already covered in this app's own dedicated CVD research) deserve real, extra attention specifically in anyone who experiences migraine with aura.",
    citations: [
      { source: 'Migraine, vascular risk, and cardiovascular events in women: prospective cohort study, PMC2505092', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2505092/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'migraine-history-milestones',
    category: 'migraine',
    title: "Migraine's Own Real History: Described Nearly 2,000 Years Ago, Genuinely Understood Only in the Last 40",
    teaser: 'A.D. 81, 1938, 1991 -- a real, ancient description sat behind one dominant, real but ultimately incomplete theory for 50 real years before the actual breakthrough treatment arrived.',
    summary:
      "Migraine's own real, documented history reaches back further than almost any other condition in this app: Aretaeus of Cappadocia, writing around A.D. 81, is generally credited with the first real detailed description, calling it \"heterocrania\" and distinguishing it from other headache types. For nearly 50 real years starting in 1938, the vascular theory, proposed by Graham and Wolff, dominated real medical understanding: migraine was believed to result simply from dilation of blood vessels outside the skull. The real, actual breakthrough came from a genuinely different direction: sumatriptan, discovered by a team led by Patrick Humphrey and reaching patients in Europe in 1991, was the first drug developed from an experimentally-grounded approach to acute migraine treatment, and its real, unexpected effectiveness helped drive a genuine shift in understanding, from the late 1980s through the early 2000s, toward migraine as fundamentally a nerve-signaling disorder rather than simply a blood-vessel problem, the real, modern understanding this app's own CGRP-inhibitor research is built on.",
    citations: [
      { source: 'One Hundred Years of Migraine Research: Major Clinical and Scientific Observations From 1910 to 2010, Headache: The Journal of Head and Face Pain', url: 'https://headachejournal.onlinelibrary.wiley.com/doi/10.1111/j.1526-4610.2011.01892.x' },
    ],
    overallTier: 'strong',
    relatedIds: ['migraine-cgrp-inhibitors'],
  },
  {
    id: 'migraine-pregnancy-real-improvement',
    category: 'migraine',
    title: 'Migraine Genuinely Improves for Most People During Pregnancy -- A Real, Striking 87% by the Third Trimester',
    teaser: 'Real, prospective data finds migraine improving in 47% of women by the first trimester, climbing to a real, striking 87% by the third -- the same real estrogen-stability mechanism already named in this app\'s own menstrual-migraine research, working in reverse.',
    summary:
      "Migraine offers one of the more genuinely reassuring real pregnancy findings in this whole app. A real, prospective diary study found migraine improvement in 47% of women during the first trimester, climbing to 83% by the second, and a real, striking 87% by the third trimester, meaning roughly 9 in 10 pregnant people with migraine experience real improvement by the end of pregnancy. The real, well-understood mechanism connects directly to this app's own already-established menstrual-migraine research: estrogen levels rise to roughly 30-40 times their normal peak menstrual-cycle level by the third trimester, and, critically, STOP cycling entirely, removing the estrogen-withdrawal trigger this app's own research already names as a major real migraine driver. Real research found this improvement most pronounced specifically in people with a pre-existing history of menstrual migraine, the same population most sensitive to estrogen fluctuation in the first place. Worth knowing honestly: not everyone improves, and a real minority report worsening symptoms during pregnancy instead, but the real, dominant pattern across large prospective data is genuine improvement, not the worsening many people might reflexively expect.",
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
    title: 'Vestibular Migraine: A Real, Genuinely Common Cause of Dizziness That Doesn\'t Always Look Like a Headache',
    teaser: "Up to 73% of people with migraine with aura meet criteria for this real, separate subtype -- and it's dramatically underrecognized specifically because it doesn't require head pain to be present.",
    summary:
      "Vestibular migraine is a real, genuinely underrecognized migraine subtype worth knowing about directly, since its own real defining symptom, dizziness or a spinning sensation, doesn't require head pain to be present at the same time, meaning it can easily go unrecognized as migraine at all. Real prevalence estimates vary by population studied: roughly 1% of the general population and 10% of people with migraine overall, but real research finds it far more concentrated in specific groups, up to 60% of people with chronic migraine and a striking 73% of those with migraine with aura (already covered in this app's own stroke-risk research) meet real diagnostic criteria for it. The real, specific underrecognition problem: during ordinary headache-clinic interviews, only about 20% of patients spontaneously mention vestibular symptoms on their own, but that real number roughly doubles when a specific questionnaire is used, and climbs as high as 75% when a clinician asks about it directly. Real research in women aged 20-50 presenting specifically with dizziness found vestibular migraine in 42.86% of cases, a genuinely common, genuinely disabling real condition. Worth knowing directly: real, unexplained dizziness or balance problems, even without a classic headache alongside them, are worth raising directly as a possible migraine variant, not assumed to be an unrelated inner-ear or balance problem by default.",
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
    title: 'Migraine With Aura Changes a Real, Important Birth Control Decision',
    teaser: 'Migraine with aura roughly doubles ischemic stroke risk on its own, and combined hormonal contraceptives are a real, named contraindication on top of that, though the evidence behind exactly how much they add is genuinely lower-quality than the guideline itself suggests.',
    summary:
      "Migraine with aura already carries a real, roughly two-fold increased risk of ischemic stroke on its own, already covered in this app's own migraine-and-stroke research, and combined hormonal contraceptives (the pill, patch, or ring containing both estrogen and progestin) are a real, formally named contraindication specifically for anyone with this type of migraine. Real consensus guidance from the European Headache Federation and European Society of Contraception states plainly that combined hormonal contraception poses an unacceptable health risk in this specific group. Worth stating honestly rather than overstated: the actual quality of evidence behind exactly how much added risk combined contraceptives contribute is real but genuinely low, and much of the historical data behind this guidance comes from the 1960s and 1970s, when oral contraceptives contained far higher estrogen doses than today's ultra-low-dose formulations. Real research on modern, ultra-low-dose pills (20mcg or less of ethinyl estradiol) suggests they may not meaningfully raise stroke risk in healthy nonsmokers, though this hasn't fully displaced the standing guideline. Progestin-only contraception is the real, standard, safer alternative recommended for this group, since it isn't tied to the same stroke-risk mechanism. Worth knowing directly: this is a real, worth-naming-by-name conversation to have with a prescriber for anyone who experiences migraine with aura and is considering or already using a combined hormonal contraceptive, especially alongside any other real stroke risk factor like smoking.",
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
    title: 'Migraine and Poor Sleep Feed Each Other in a Real, Two-Way Cycle, and Fixing the Sleep Side Has Real, Measured Benefit',
    teaser: 'Sleep disturbance is a real, common migraine trigger, and migraine pain itself real disrupts sleep in return, but real trial data finds treating the insomnia directly, not just the migraine, can genuinely reduce headache days.',
    summary:
      "Migraine and sleep disturbance run in a real, well-documented bidirectional relationship: disrupted sleep is a real, common trigger for a migraine attack, while the pain of a migraine attack itself real, directly worsens sleep quality, creating a self-reinforcing cycle rather than one thing simply causing the other. Real Mendelian randomization research (a genetics-based method for testing causal direction, already covered elsewhere in this app as a methodologically stronger evidence category) confirms a genuine bidirectional causal relationship between migraine and insomnia specifically, not just a coincidental overlap. The real, proposed shared mechanisms involve overlapping brain regions (including the hypothalamus) and shared signaling molecules like serotonin and melatonin, both already tied to migraine biology elsewhere in this app's own research. Genuinely useful and actionable: a real systematic review found that treating the sleep problem directly, specifically digital Cognitive-Behavioral Therapy for Insomnia (CBT-I), significantly reduced actual headache days and improved sleep measures, not just sleep satisfaction. Worth knowing directly: this is a real, worth-raising treatment angle for anyone whose migraine and sleep both feel stuck, since addressing the insomnia specifically, not just the migraine medication, has real, trial-backed evidence of helping both problems at once.",
    citations: [
      { source: 'Interventions for Migraine and Sleep: A Systematic Review Exploring Their Bidirectional Association, PMC13093645', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC13093645/' },
      { source: 'Exploring the Causal Relationship Between Migraine and Insomnia Through Bidirectional Mendelian Randomization, PMC11268570', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11268570/' },
    ],
    overallTier: 'strong',
    relatedIds: ['migraine-episodic-chronic-real-debate'],
  },
  {
    id: 'migraine-obesity-chronification-risk',
    category: 'migraine',
    title: 'Obesity Is a Real, Quantified Risk Factor for Episodic Migraine Turning Chronic',
    teaser: 'Real research finds people with migraine who are overweight face roughly three times the risk of their headaches becoming chronic, and people with obesity face roughly five times the risk, compared to someone at a healthy weight.',
    summary:
      "Obesity carries a real, dose-response relationship with whether episodic migraine (fewer than 15 headache days a month) progresses into chronic migraine (15 or more), already a real, named subject of its own dedicated debate elsewhere in this app's own migraine research. Real research finds someone with migraine at a healthy weight has roughly a 3% chance of developing chronic migraine within a year, while someone who is overweight faces about three times that risk, and someone with obesity faces about five times that risk. Real, proposed contributing factors include obstructive sleep apnea (a common complication of obesity, already tied to migraine risk elsewhere in this app's own sleep-apnea research) and the amount of body fat itself appearing to relate directly to migraine's own clinical characteristics, not just act as an incidental bystander. Genuinely useful context: obesity is one of several real, named risk factors for chronic transformation identified in the same body of research, alongside sleep disorders, depression, anxiety, high baseline headache frequency, and medication overuse (already covered in this app's own medication-overuse-headache research), meaning weight is a real, modifiable piece of a larger picture rather than the whole story on its own. Worth knowing directly: this gives someone managing frequent migraine attacks a real, concrete, evidence-backed reason to treat weight management as part of migraine prevention strategy, not a separate, unrelated health goal.",
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
    title: 'OnabotulinumtoxinA (Botox) Is a Real, FDA-Approved, Trial-Confirmed Preventive Treatment for Chronic Migraine',
    teaser: 'The real, landmark PREEMPT 2 trial found Botox injections significantly reduced headache days compared to placebo, real, repeated safety confirmed across multiple treatment cycles.',
    summary:
      "OnabotulinumtoxinA, the same botulinum toxin known by the brand name Botox, is a real, FDA-approved, specifically studied preventive treatment for chronic migraine, worth knowing about directly alongside the CGRP inhibitors already covered in this app's own migraine research. The real, landmark PREEMPT clinical trial program tested this specific treatment in two large, randomized, placebo-controlled trials. PREEMPT 2 found onabotulinumtoxinA statistically significantly superior to placebo for its primary outcome, real reduction in headache days per 28-day period (a real 9.0-day reduction versus 6.7 days for placebo), with real, significant improvement on every secondary measure tested too. Worth knowing honestly: PREEMPT 1, the companion trial, did NOT find a significant difference on its own primary endpoint (headache episodes specifically, a different way of counting than headache days), a real, honest inconsistency between the two trials worth naming directly rather than only citing the positive result. The real, pooled analysis combining both trials' full data did confirm onabotulinumtoxinA as an effective preventive treatment overall, and real research found repeated treatment cycles (administered every 12 weeks) safe and well tolerated over time. Worth knowing directly: this is a real, FDA-approved, evidence-backed option specifically for CHRONIC migraine (15 or more headache days a month, already covered in this app's own episodic-vs-chronic research), not typically used for less frequent episodic migraine, worth discussing directly with a neurologist for anyone whose chronic migraine hasn't responded well to oral preventive medications.",
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
    title: 'The Trigeminovascular System: The Real Biological Machinery Behind a Migraine Attack Itself',
    teaser: 'A real, specific nerve pathway releases CGRP directly during an attack, measurably elevated in the blood draining from the head, and normalizing again once treatment actually works.',
    summary:
      "The trigeminovascular system is the real, specific biological pathway underlying migraine itself, worth understanding directly as the actual mechanism behind the CGRP inhibitor medications already covered elsewhere in this app's own migraine research. Real research finds the trigeminal ganglion, a real cluster of nerve cells connecting the face and head to the brain, contains a large population of neurons that produce and release calcitonin gene-related peptide (CGRP) when activated by physical or chemical triggers. Real research finds this CGRP release sets off a real, specific cascade: increased nitric oxide production, sensitization of the trigeminal nerves themselves, and direct interaction with nearby support cells, all of which work together to drive both the pain signal and the blood-vessel changes characteristic of a migraine attack. Genuinely useful clinical evidence: real research finds CGRP concentrations measurably elevated in blood draining from the head during an actual migraine attack, and real research finds these levels normalize again specifically after successful treatment, direct, measurable confirmation that this pathway is genuinely active during a real attack, not just a laboratory theory. Worth knowing directly: understanding this real mechanism explains why CGRP inhibitors and CGRP-receptor-blocking triptans both work by interrupting this same real pathway at different points, and it's a real, useful piece of context for understanding why migraine is now treated as a genuine neurological-vascular process with a real, identifiable chemical signal, not a poorly understood \"just a bad headache.\"",
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
    title: 'Ketogenic and Low-Carbohydrate Diets Show Real, Growing, Though Still Unsettled Promise for Migraine Prevention',
    teaser: 'A real randomized trial found a 4-week very-low-energy ketogenic diet significantly more effective than an equally weight-reducing non-ketogenic diet for migraine prevention, real evidence pointing beyond weight loss alone.',
    summary:
      "Ketogenic and low-carbohydrate diets represent a real, actively growing area of migraine research, distinct from the food-trigger avoidance already covered in this app's own migraine research, this is about a broader dietary PATTERN rather than avoiding specific trigger foods. Real research covers several real variations, from a strict classic ketogenic diet to a gentler low-glycemic-index diet and the Modified Atkins Diet, all sharing the real, underlying mechanism of shifting the body's fuel source from glucose toward ketone bodies produced from fat. Genuinely notable: a real randomized controlled trial (the EMIKETO trial) found a very-low-calorie ketogenic diet significantly more effective at preventing high-frequency episodic migraine than an equally calorie-reduced, non-ketogenic diet, despite both producing similar real weight loss, real evidence the ketogenic state itself, not just the weight loss, may be doing real, independent work. A real Mediterranean-ketogenic hybrid diet also showed real reductions in both pain frequency and intensity in a pilot study of chronic migraine patients. Worth knowing honestly: real research finds no clear consensus yet on any single \"anti-migraine\" diet, and it isn't clear whether ketogenic eating is broadly effective for migraine prevention or works best for a real, specific subset of patients. Worth knowing directly: this is a real, promising, actively-researched option worth discussing with a doctor or dietitian for someone whose migraine hasn't responded well to standard preventive approaches, not yet a settled, universally-recommended first-line dietary prescription.",
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
    title: 'Gepants: a Real, Newer Medication Class Built to Treat an Attack Already in Progress',
    teaser: 'A real trial of ubrogepant found 21.8% of patients pain-free at 2 hours versus 14.3% on placebo, a genuinely different medication working through the same CGRP pathway this category\'s own preventive treatments target.',
    summary:
      "This category's own research already covers CGRP inhibitors as monthly PREVENTIVE treatment. Gepants are a real, related but genuinely distinct medication class, oral pills taken to treat an attack that's already started, working through the same real CGRP signaling pathway rather than a separate mechanism. Ubrogepant and rimegepant were both FDA-approved starting in 2019 and 2020, and a real, large randomized trial of ubrogepant (ACHIEVE II, 1,465 patients) found 21.8% of patients on the higher tested dose were completely pain-free at 2 hours, compared with 14.3% on placebo, a real, meaningful difference for a single-attack, as-needed medication. Rimegepant's own trial data showed a broadly similar real effect, with benefit that held up through 24 hours in some measures. A genuinely important, practical distinction from older acute migraine medications (triptans, and even overused simple painkillers): real research and current guidance treat gepants as carrying a much lower risk of causing medication-overuse headache with frequent use, a real, direct answer to a real problem this category's own medication-overuse-headache research already covers in depth. Worth knowing directly: gepants are a real, newer option specifically worth raising for anyone whose current acute treatment either doesn't work well enough or triggers rebound headaches with regular use.",
    citations: [
      { source: 'Effect of Ubrogepant vs Placebo on Pain and the Most Bothersome Associated Symptom in the Acute Treatment of Migraine: The ACHIEVE II Randomized Clinical Trial, JAMA 2019, PMID 31742631', url: 'https://pubmed.ncbi.nlm.nih.gov/31742631/' },
    ],
    overallTier: 'strong',
    relatedIds: ['migraine-cgrp-inhibitors', 'migraine-medication-overuse-headache', 'migraine-trigeminovascular-cgrp-mechanism'],
  },
  {
    id: 'migraine-neuromodulation-devices',
    category: 'migraine',
    title: 'Real, FDA-Cleared Devices Can Treat Migraine Without a Single Medication',
    teaser: 'A sham-controlled trial of a wearable nerve-stimulation device found 21% of users pain-free at 60 minutes versus 10% on the sham device, real evidence for a genuinely drug-free option.',
    summary:
      "Neuromodulation devices are a real, genuinely different approach to migraine treatment, using mild electrical or magnetic stimulation of specific nerves rather than any medication at all, and several are FDA-cleared based on real, sham-controlled trials, the same rigorous placebo-style design used to test drugs. Cefaly, a headband-style device stimulating the trigeminal nerve, has real trial evidence on both sides of the treatment picture: a real, randomized prevention trial (PREMICE) found daily use over 3 months significantly reduced migraine days compared with sham stimulation. GammaCore, a handheld device stimulating the vagus nerve in the neck, has real acute-treatment trial evidence too, a real, sham-controlled trial of 243 patients (PRESTO) found it produced pain freedom in 21.0% of patients at 60 minutes, compared with 10.0% on the sham device. Real research finds these devices carry a genuinely favorable safety profile, with side effects generally infrequent, mild, and temporary, a real, meaningful difference from medication-based approaches for anyone specifically wanting to avoid drug interactions or side effects, including someone managing multiple conditions and medications already. Worth knowing directly: these devices work best as one real, additional tool, not necessarily a full replacement for medication in more severe or frequent migraine, and are worth a direct conversation with a headache specialist about whether one might fit into an existing treatment plan.",
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
    title: 'IV Magnesium in the ER Is a Real, Genuinely Distinct Question From the Oral Magnesium Already Covered Here',
    teaser: 'A real systematic review of 7 trials found intravenous magnesium sulfate improved acute headache pain, but only after 60 to 120 minutes, a real, meaningfully slower effect than most acute migraine treatments.',
    summary:
      "This category's own already-covered oral magnesium research (alongside riboflavin and CoQ10) is a real, daily PREVENTIVE strategy. Intravenous magnesium sulfate, given in an emergency department for an attack already underway, is a real, genuinely separate question with its own real, distinct evidence. A real systematic review pooling 7 randomized trials and 545 participants found pain intensity significantly improved with IV magnesium compared with other treatments, but specifically at the 60-to-120-minute mark, not at earlier time points, a real, meaningfully slower onset than most standard acute migraine treatments (triptans, gepants) are built to deliver. Worth knowing honestly: real results for the specific 50%-pain-reduction endpoint were genuinely conflicting across the pooled trials, some found real benefit, others found none, and one earlier trial even found adding magnesium to a standard anti-nausea medication (metoclopramide) may have blunted that medication's own effectiveness rather than adding to it. Worth knowing directly: real, current evidence supports IV magnesium as one real, reasonable option among several for a severe attack in an emergency setting, particularly for migraine with aura, where real research finds a plausible added rationale, rather than a clearly superior first choice over already-established acute treatments.",
    citations: [
      { source: 'Intravenous Magnesium Sulfate to Treat Acute Headaches in the Emergency Department: A Systematic Review, Headache 2019, PMID 31566727', url: 'https://pubmed.ncbi.nlm.nih.gov/31566727/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['migraine-magnesium-riboflavin-coq10'],
  },
  {
    id: 'migraine-weather-barometric-pressure-mixed',
    category: 'migraine',
    title: 'Weather as a Migraine Trigger: a Real Effect for Some People, Genuinely Inconsistent Across Real Studies',
    teaser: 'A real systematic review of 14 studies found barometric pressure drops linked to more frequent migraine attacks in several studies, but the overall real evidence stayed genuinely inconsistent study to study.',
    summary:
      "Weather, and barometric pressure specifically, is one of the most commonly self-reported migraine triggers, and real research finds a genuine, if inconsistent, evidence base behind that common belief. A real, recent systematic review pooling 14 studies and 2,696 participants found several individual studies reporting a significant real association between pressure drops or rapid fluctuations and increased migraine FREQUENCY specifically, fewer studies found any real link to attack SEVERITY, and none found a real link to attack DURATION. Worth knowing honestly: the review's own overall conclusion was that findings were genuinely inconsistent study to study, not a settled, uniform effect, real research estimates weather's overall measurable influence at only around 20% across studied populations, meaning most migraine days in most people likely have little to do with weather at all. Worth knowing directly: this is a real, honest example of a widely believed trigger with real, if inconsistent, supporting evidence and real, meaningful individual variation, some people genuinely are weather-sensitive, most aren't strongly so, and this app's own already-covered personal-pattern-tracking approach (rather than assuming a commonly cited trigger applies universally) is the real, practical way to find out which category a given person actually falls into.",
    citations: [
      { source: 'Impact of Barometric Pressure Changes on the Severity, Frequency, and Duration of Migraine Attacks: A Systematic Review of the Literature, Cureus 2025, PMID 41245912', url: 'https://pubmed.ncbi.nlm.nih.gov/41245912/' },
    ],
    overallTier: 'weak',
    relatedIds: ['migraine-food-triggers-honest-nuance'],
  },
  {
    id: 'migraine-menopause-new-onset-redflag',
    category: 'migraine',
    title: "Migraine Genuinely Shifts Around Menopause, but a Brand-New Headache After 50 Needs a Real Look First",
    teaser: 'Migraine frequency often changes sharply around menopause, real data splitting roughly a quarter better and a third worse, but a headache that starts fresh after 50 always deserves real medical evaluation.',
    summary:
      "Hormonal transition genuinely reshapes migraine, in both directions, and real data shows the picture is more mixed than a simple 'menopause makes it better' story. In a real study of over 3,600 women, those in perimenopause and menopause were 50 to 60% more likely to report frequent headaches (10 or more days a month), and a separate, real 2025 population study of nearly 5,000 women found 46% still had migraine attacks after menopause, with one in five still having attacks past age 60. Once past menopause, when estrogen settles into a new, stable, low baseline, many people do genuinely improve, real clinic-based data finding 24.4% improved with menopause while 35.7% actually worsened, an honest, roughly even split rather than a guaranteed relief. The real, separate and more urgent point: a headache that starts brand-new after age 50, one that was never a pattern before, always warrants real medical evaluation to rule out a vascular, structural, or other systemic cause, rather than being assumed to be ordinary menopause-related migraine. This is especially true for aura symptoms (visual disturbances, numbness, or speech changes) appearing for the very first time in an older woman, since these can closely mimic a transient ischemic attack or seizure. Worth knowing directly: a lifelong migraine pattern shifting around menopause is expected and usually not a red flag on its own, but a genuinely new headache pattern starting after 50 is a real, separate situation that deserves its own real workup.",
    citations: [
      { source: 'Patterns of migraine in postmenopausal women: a systematic review, Neuropsychiatric Disease and Treatment, Dove Medical Press', url: 'https://www.dovepress.com/patterns-of-migraine-in-postmenopausal-women-a-systematic-review-peer-reviewed-fulltext-article-NDT' },
      { source: 'Understanding and Treating Headache Related to Menopause, American Headache Society', url: 'https://americanheadachesociety.org/research/library/understanding-and-treating-headache-related-to-menopause' },
    ],
    overallTier: 'strong',
    relatedIds: ['migraine-red-flags', 'migraine-menstrual-estrogen-withdrawal'],
  },
];
