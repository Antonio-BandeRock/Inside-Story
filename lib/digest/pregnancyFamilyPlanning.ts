import type { DigestEntry } from './types';

// Pregnancy & Family Planning -- added 2026-08-07, a real gap named
// directly in a "what haven't we researched yet" pass: this app's own
// Organs & Body Systems category already covers real, documented
// miscarriage/fertility risk (organ-reproductive-fertility), but nothing
// anywhere in the app covered the rest of what pregnancy specifically
// changes about managing Hashimoto's -- trimester-specific TSH targets,
// postpartum thyroiditis as its own distinct, commonly-confused entity,
// breastfeeding safety, and pregnancy's own real, increased iodine need.
// Deliberately does not repeat the existing miscarriage-risk finding --
// see organ-reproductive-fertility for that, cross-linked from here rather
// than duplicated.
//
// Same narrative voice and citation discipline as the rest of this Digest.
// This session's WebSearch budget was already exhausted, so every citation
// here was found via the established WebFetch-against-real-PubMed fallback
// -- real papers read directly, nothing fabricated.
export const PREGNANCY_FAMILY_PLANNING_ENTRIES: DigestEntry[] = [
  {
    id: 'pregnancy-tsh-target',
    category: 'pregnancyFamilyPlanning',
    title: 'The Real TSH Target Changes Once Pregnancy Enters the Picture',
    teaser: 'The same TSH number that\'s perfectly fine outside pregnancy can be genuinely too high once it starts.',
    summary:
      "Pregnancy is one of the few real situations where the whole app's own standard testing cadence and targets get a real, deliberate exception -- not because the biology of Hashimoto's changes, but because a developing baby depends entirely on the parent's own thyroid hormone for its own brain development during the first trimester, before its own thyroid gland is even functional. Real, authoritative guidance (the American Thyroid Association's own 2017 pregnancy-specific guidelines) and real clinical review literature both converge on a TSH target of below 2.5 mIU/L for anyone already being treated for hypothyroidism who is pregnant or actively trying to conceive -- a real, meaningfully lower ceiling than the standard non-pregnant reference range this app's own Labs & Medication Timing category already covers. That real difference is exactly why this is worth planning for rather than discovering after the fact: a real, practical step is getting TSH checked and, if needed, adjusted BEFORE conceiving, and rechecking it as soon as pregnancy is confirmed, since real levothyroxine dose increases (often needed) take real time to show up as a stable, improved TSH -- not something to wait on until the next already-scheduled annual check this app's own Self Advocacy category would otherwise recommend.",
    citations: [
      { source: 'Alexander EK, et al. 2017 -- 2017 Guidelines of the American Thyroid Association for the Diagnosis and Management of Thyroid Disease During Pregnancy and the Postpartum', url: 'https://pubmed.ncbi.nlm.nih.gov/28056690/' },
      { source: 'Li SW, Chan SY 2020 -- Management of overt hypothyroidism during pregnancy', url: 'https://pubmed.ncbi.nlm.nih.gov/32616466/' },
    ],
    overallTier: 'strong',
    relatedIds: ['advocacy-core-thyroid-panel', 'organ-reproductive-fertility'],
  },
  {
    id: 'pregnancy-postpartum-thyroiditis',
    category: 'pregnancyFamilyPlanning',
    title: 'Postpartum Thyroiditis: A Real, Distinct Condition Often Mistaken for New-Onset Hashimoto\'s',
    teaser: 'A real, separate diagnosis that can look exactly like Hashimoto\'s starting up -- and, in over half of cases, genuinely becomes it.',
    summary:
      "New thyroid symptoms showing up in the months after childbirth get attributed, often correctly, to sleep deprivation and the sheer physical demands of a newborn -- but a real, distinct, and surprisingly common condition deserves to be on the list too. Postpartum thyroiditis is real inflammation of the thyroid gland triggered specifically by the immune system rebounding after pregnancy's own natural immune suppression -- a real prospective study of over 4,000 women found it developed in 3.9% of pregnancies overall, rising to 11.1% in women already known to be at higher thyroid risk versus 1.9% in lower-risk women. It typically runs a real, two-phase course: a thyrotoxic (overactive) phase in the first few months postpartum, often followed by a hypothyroid phase -- the same study found 82% of affected women experienced that hypothyroid phase within the first postpartum year. The genuinely important, less-appreciated finding: this isn't always temporary. 54% of women with postpartum thyroiditis in that same study still had persistent hypothyroidism at the one-year mark -- directly challenging the older, more reassuring assumption that most cases fully resolve on their own. A real, practical takeaway: any new thyroid symptom in the year after childbirth is worth a real TSH check specifically, not automatically written off as new-parent exhaustion -- and a persistent case genuinely can become the same real, ongoing thyroid management this whole app is built around, not just a temporary postpartum blip.",
    citations: [
      { source: 'Stagnaro-Green A, et al. 2011 -- High rate of persistent hypothyroidism in a large-scale prospective study of postpartum thyroiditis in southern Italy', url: 'https://pubmed.ncbi.nlm.nih.gov/21190974/' },
    ],
    overallTier: 'strong',
    relatedIds: ['advocacy-core-thyroid-panel'],
  },
  {
    id: 'pregnancy-breastfeeding-safety',
    category: 'pregnancyFamilyPlanning',
    title: 'Breastfeeding & Levothyroxine: A Real, Reassuring Answer, Not a Reason to Pause Treatment',
    teaser: 'One real worry worth putting to rest directly, since stopping thyroid treatment while nursing would genuinely be the wrong move.',
    summary:
      "It's a real, understandable instinct to wonder whether a daily medication is safe to keep taking while breastfeeding -- and for levothyroxine specifically, the real answer is reassuring enough that major medical guidance treats continuing it as the clearly correct choice, not a judgment call. The National Institutes of Health's own real Drugs and Lactation Database states plainly that limited data on real, replacement-dose levothyroxine during breastfeeding show no adverse effects in infants -- and for a real, biological reason: levothyroxine (T4) is itself a normal, naturally occurring component of human breast milk already, so a treated parent's own milk isn't introducing something foreign to a nursing infant's system, just restoring it to a normal level. Real thyroid-society guidance goes further, actively recommending that both subclinical and overt hypothyroidism be treated with levothyroxine in women who are nursing -- treatment is the recommended path, not a risk to be weighed against breastfeeding itself. Worth knowing directly: undertreated hypothyroidism during this period is the real risk, not the medication used to correct it.",
    citations: [
      { source: 'Levothyroxine. Drugs and Lactation Database (LactMed), National Institute of Child Health and Human Development', url: 'https://www.ncbi.nlm.nih.gov/books/NBK501200/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'pregnancy-iodine-needs',
    category: 'pregnancyFamilyPlanning',
    title: 'Iodine During Pregnancy: The Same Two-Edged Nutrient, With Real, Higher Stakes',
    teaser: 'This app\'s own Nutrients category already treats iodine as genuinely two-edged. Pregnancy raises both edges at once.',
    summary:
      "This Digest's own Nutrients & Micronutrients category already makes the case that iodine is a rare, genuine exception to \"more is always better\" -- too little causes real thyroid hormone deficiency, but too much can trigger real autoimmune thyroid flares in susceptible people. Pregnancy doesn't resolve that tension; it raises the real stakes on both sides at once. Real research confirms iodine requirements rise substantially during pregnancy and lactation specifically, since a developing baby depends entirely on the parent's own iodine intake to build its own thyroid hormone supply during the window before its own thyroid becomes functional -- meaning real deficiency during pregnancy carries a genuinely higher cost than the same deficiency outside of it. At the same time, the same real caution against mega-dosing (kelp, high-dose iodine supplements, already covered under Problem Foods & Swaps) applies with the same or greater force here, not less, since a sudden iodine surge remains a real, documented trigger for autoimmune thyroid flares regardless of pregnancy status. The real, practical takeaway: this is a genuine reason to discuss iodine intake specifically and directly with a doctor once pregnancy is being planned or confirmed, rather than either ignoring it or reaching for a high-dose supplement on the assumption that more can only help during a time the body needs more.",
    citations: [
      { source: 'Dold S, Zimmermann MB, Jukic T, et al. 2018 -- Universal Salt Iodization Provides Sufficient Dietary Iodine to Achieve Adequate Iodine Nutrition during the First 1000 Days', url: 'https://pubmed.ncbi.nlm.nih.gov/29659964/' },
      { source: 'Taylor PN, Prentice M, Bath S, et al. 2026 -- What Endocrinologists Should Know About Iodine: Population Deficiency, Individual Excess and Misinformation in the United Kingdom', url: 'https://pubmed.ncbi.nlm.nih.gov/42144726/' },
    ],
    overallTier: 'strong',
    relatedIds: ['nutrient-iodine', 'problem-excess-iodine-kelp'],
  },
  {
    id: 'pregnancy-tying-together',
    category: 'pregnancyFamilyPlanning',
    title: 'Tying It All Together: Pregnancy Isn\'t a Pause on Hashimoto\'s Management -- It\'s a Real, Temporary Change of Rules',
    teaser: 'Four real, separate facts in this category all point to the same one practical habit.',
    summary:
      "Every entry in this small category lands on a version of the same real point: pregnancy doesn't put Hashimoto's management on hold, it temporarily changes several of its real rules at once, and the biggest real risk is treating it like nothing has changed. The TSH target drops (below 2.5 mIU/L rather than the standard non-pregnant range), a real and common condition (postpartum thyroiditis) can newly appear in the year after childbirth even in someone with no prior thyroid history, iodine needs rise in a way that raises the real stakes of both too little and too much, and breastfeeding is a real non-issue for levothyroxine specifically, not a reason to hesitate on treatment. The one real, practical thread connecting all four: this is a genuine, time-limited window where the standard \"check every 6-12 months\" cadence this app's own Self Advocacy category recommends the rest of the time is deliberately too infrequent -- planning ahead, testing proactively, and treating any new postpartum symptom as worth a real TSH check are what actually make this window go well.",
    citations: [],
    overallTier: 'moderate',
    relatedIds: ['pregnancy-tsh-target', 'advocacy-tying-together'],
  },
];
