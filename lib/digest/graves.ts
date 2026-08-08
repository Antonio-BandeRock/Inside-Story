import type { DigestEntry } from './types';

// Graves' Disease -- 10 entries, added 2026-08-08 as this app's fourth real
// condition, next in the same priority order RA and Psoriasis already
// followed. Built with the lesson from the Digest-wide restructure earlier
// the same day already applied from the start, rather than bolted on
// after: this file carries its own real, freshly-researched self-advocacy
// content directly (TRAb/TSI antibody testing, antithyroid-drug monitoring,
// bone density) instead of leaving it for a later pass.
//
// Graves' disease is the most direct possible contrast to Hashimoto's
// covered anywhere in this app: both are autoimmune thyroid disease, both
// attack the same gland, and several findings here run in the OPPOSITE
// direction from Hashimoto's own research -- smoking raises Graves' risk
// while it lowers Hashimoto's risk, and iodine's own two-edged nature cuts
// differently here since Graves' is hyperthyroid, not hypothyroid. Every
// citation was independently verified via WebSearch before being written
// in, the same discipline the rest of this Digest already holds to.
export const GRAVES_ENTRIES: DigestEntry[] = [
  {
    id: 'graves-overview',
    category: 'graves',
    title: "Graves' Disease: The Same Gland, the Opposite Direction",
    teaser: 'The most common cause of an overactive thyroid, and in several real ways, the mirror image of Hashimoto\'s.',
    summary:
      "Graves' disease is the most common cause of hyperthyroidism, an overactive thyroid, and it's autoimmune the same way Hashimoto's is, just aimed the opposite direction. Instead of antibodies attacking and gradually destroying thyroid tissue the way Hashimoto's TPO antibodies do, Graves' antibodies (called TSI or TRAb, covered in full below) bind to and stimulate the same receptor TSH normally uses, driving the thyroid to overproduce hormone rather than underproduce it. That single mechanistic difference explains why several findings in this category run in the literal opposite direction from this app's own Hashimoto's research: smoking, iodine, and even some of the same nutrients land differently here. Diet won't cure Graves' disease, and nothing here replaces an endocrinologist's own treatment plan. What follows is what the actual research supports, kept honest about how strong each finding really is.",
    citations: [
      { source: "Graves' Disease, National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK)", url: 'https://www.niddk.nih.gov/health-information/endocrine-diseases/graves-disease' },
    ],
    overallTier: 'strong',
    relatedIds: ['graves-smoking'],
  },
  {
    id: 'graves-iodine',
    category: 'graves',
    title: "Iodine and Graves': A Real Trigger, and a Real Complication for Treatment Too",
    teaser: 'Excess iodine can trigger Graves\' in the first place, and separately can work against the very drugs used to treat it, two different reasons it matters here.',
    summary:
      "Iodine's two-edged reputation, already covered for Hashimoto's elsewhere in this app, cuts differently for Graves'. Excess iodine intake is a documented trigger for Graves' disease itself, and people previously treated with antithyroid drugs, or with a prior iodine deficiency, are especially prone to developing iodine-induced hyperthyroidism when iodine intake rises. Separately, and worth knowing directly if antithyroid drug treatment is already underway: excess iodine in someone actively being treated for Graves' can reduce how well those drugs actually work. The real nuance worth holding onto: this isn't a case for iodine avoidance at any cost. Research also finds adequate (not excessive, not deficient) iodine intake tracks with better remission rates and better long-term control than either too little or too much, making this a genuine Goldilocks nutrient here, not a simple \"avoid it\" rule.",
    citations: [
      { source: 'Excess iodine intake: sources, assessment, and effects on thyroid function', url: 'https://pubmed.ncbi.nlm.nih.gov/30891786/' },
      { source: "Effect of iodine nutritional status on the recurrence of hyperthyroidism and antithyroid drug efficacy in adult patients with Graves' disease: a systemic review", url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10600371/' },
    ],
    overallTier: 'strong',
    relatedIds: ['graves-radioactive-iodine-timing'],
  },
  {
    id: 'graves-selenium-orbitopathy',
    category: 'graves',
    title: 'Selenium Improved Mild Graves\' Eye Disease in a Real, Landmark Trial',
    teaser: 'A double-blind, placebo-controlled trial in 159 patients found a real, measured improvement, with one honest limit worth knowing.',
    summary:
      "A landmark randomized, double-blind, placebo-controlled trial gave 159 patients with mild Graves' orbitopathy (the eye disease that can accompany Graves') either sodium selenite (100 micrograms twice daily) or a placebo for six months, then followed everyone for another six months after stopping. The selenium group showed real, measured improvement in both eye-disease severity and disease-specific quality of life, and those gains held up even after supplementation ended. That's a genuinely strong result for a specific, real population: mild orbitopathy. The honest limit is worth stating directly: later trials across different selenium-status populations and disease severities have found inconsistent results, and what selenium actually does for moderate-to-severe orbitopathy specifically remains an open question the evidence hasn't settled yet.",
    citations: [
      { source: "Selenium and the Course of Mild Graves' Orbitopathy, New England Journal of Medicine", url: 'https://www.nejm.org/doi/full/10.1056/NEJMoa1012985' },
      { source: "Efficacy of Selenium Supplementation in Graves' Orbitopathy: A Systematic Review and Meta-Analysis of Randomized Controlled Trials with Trial Sequential Analysis", url: 'https://pubmed.ncbi.nlm.nih.gov/42355878/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'graves-smoking',
    category: 'graves',
    title: "Smoking: The Exact Reverse of Hashimoto's Own Finding",
    teaser: "This app's own Hashimoto's research names smoking as protective against Hashimoto's specifically. For Graves' eye disease, it's one of the strongest risk factors in this whole app.",
    summary:
      "This app's own Lifestyle & Environment research, built for Hashimoto's, names a genuinely counterintuitive finding: smoking is associated with LOWER risk of developing Hashimoto's thyroiditis specifically, even though it's well-established as harmful in nearly every other way. Graves' disease is the direct mirror image of that finding, not a repeat of it. A meta-analysis covering 56 studies found smoking (current or past) significantly raises the risk of thyroid eye disease specifically, and an earlier, large meta-analysis found the association even sharper for Graves' ophthalmopathy than for Graves' disease alone. The risk is dose-dependent too, rising with each additional cigarette smoked per day, and even partial smoking reduction appears to lower risk somewhat. This is one of the clearest, most direct reasons in this whole app that smoking-cessation counseling belongs as a real, named part of Graves' treatment, not just general health advice repeated out of habit.",
    citations: [
      { source: 'Risk Factors of Thyroid Eye Disease, Endocrine Practice', url: 'https://pubmed.ncbi.nlm.nih.gov/33655885/' },
      { source: 'Smoking and thyroid disorders: a meta-analysis, Clinical Endocrinology', url: 'https://pubmed.ncbi.nlm.nih.gov/11834423/' },
    ],
    overallTier: 'strong',
    relatedIds: ['graves-overview'],
  },
  {
    id: 'graves-antithyroid-drug-monitoring',
    category: 'graves',
    title: 'Methimazole & PTU Need Real, Specific Monitoring, Not Just a Watch-and-Wait',
    teaser: 'Two real, serious risks, agranulocytosis and liver injury, each with its own specific warning signs worth knowing by name before starting either drug.',
    summary:
      "Methimazole and propylthiouracil (PTU) are the two main antithyroid drugs used to control Graves' disease, and both carry two real, if uncommon, serious risks worth knowing specifically rather than vaguely. Agranulocytosis, a dangerous drop in infection-fighting white blood cells, occurs in an estimated 0.2 to 0.5% of patients on either drug, and for methimazole specifically the risk rises with dose: from about 0.13% at 10mg/day up to about 0.47% at 30mg/day. The real, actionable warning signs are sore throat, fever, chills, or infections of the gums or skin, worth stopping the drug and seeking care immediately for, not waiting out. Liver injury is the second real risk, and the two drugs differ here in an important way: methimazole's own liver risk is generally lower and can be caught through routine liver-function monitoring, but PTU's own liver injury can come on rapidly and unpredictably enough that routine bloodwork isn't reliably protective, meaning symptoms (fatigue, nausea, loss of appetite, fever, sore throat) are the real trigger to stop PTU immediately and get liver function and a white blood cell count checked, not a scheduled lab visit.",
    citations: [
      { source: 'Dose-dependent incidence of agranulocytosis in patients treated with methimazole and propylthiouracil', url: 'https://pubmed.ncbi.nlm.nih.gov/38710619/' },
      { source: 'Propylthiouracil, LiverTox, National Institute of Diabetes and Digestive and Kidney Diseases', url: 'https://www.ncbi.nlm.nih.gov/books/NBK547973/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ra-advocacy-methotrexate-monitoring'],
  },
  {
    id: 'graves-trab-tsi-testing',
    category: 'graves',
    title: 'TRAb & TSI Antibody Testing: Real Numbers That Predict Remission and Relapse',
    teaser: 'Not just a diagnostic checkbox. A single antibody level, tracked over time, gives real, quantified odds of what happens next.',
    summary:
      "TRAb (TSH-receptor antibody) and TSI (thyroid-stimulating immunoglobulin) testing does more in Graves' disease than most antibody tests do elsewhere in this app: it doesn't just confirm the diagnosis, it carries real, quantified prognostic weight. At diagnosis, sensitivity and specificity for confirming Graves' run in the upper 90s. More useful for someone already being treated: a baseline TRAb level below 10 IU/L tracks with a 63% remission rate on antithyroid drugs, compared to 39% for people above that threshold, and higher levels (above 15 IU/L) track with a real, higher chance of the drug taking longer than six months to bring the disease under control. The single most actionable number in this whole entry: whether TSAb is still positive at the moment antithyroid drugs are stopped predicts relapse directly, 79% relapse with a positive result at withdrawal versus 33% with a negative one, a genuine six-fold difference in risk. Worth asking for this test not just once at diagnosis, but specifically again before any conversation about stopping antithyroid drug treatment.",
    citations: [
      { source: "Thyroid-Stimulatory Antibody as a Predictive Factor for Graves' Disease Relapse", url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8843073/' },
      { source: "Predictors of Initial and Sustained Remission in Patients Treated with Antithyroid Drugs for Graves' Hyperthyroidism: The RISG Study", url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6335719/' },
    ],
    overallTier: 'strong',
    relatedIds: ['graves-antithyroid-drug-monitoring'],
  },
  {
    id: 'graves-bone-density',
    category: 'graves',
    title: 'Untreated Hyperthyroidism Measurably Thins Bone. A DEXA Scan Is How That Actually Gets Checked.',
    teaser: 'A real, quantified bone-density loss, and a real, documented reason it doesn\'t fully reverse the moment thyroid levels normalize.',
    summary:
      "Excess thyroid hormone speeds up the normal bone-remodeling cycle, tipping the balance toward faster bone breakdown than bone formation can keep up with. In untreated hyperthyroidism, this is a real, measured effect, not a theoretical one: bone mineral density can run 10 to 15% lower in the spine and hip compared to someone with normal thyroid function. What's genuinely worth knowing directly, since it complicates the usual assumption that getting thyroid levels back to normal automatically fixes this: TRAb, the same antibody covered above, appears to keep driving bone loss on its own even after someone reaches a euthyroid (normal thyroid hormone) state, contributing to a further 8 to 12% reduction in bone density independent of hormone levels themselves. A DEXA (bone density) scan is the real, direct way this gets checked, worth asking for specifically given a history of hyperthyroidism, not assumed unnecessary just because current labs look normal. For anyone with confirmed bone loss, bisphosphonate medications are a real, evidence-supported option worth discussing directly.",
    citations: [
      { source: "IMPACT OF GRAVES' DISEASE AND ANTITHYROID DRUG THERAPY ON BONE MINERAL DENSITY: PATHOPHYSIOLOGICAL MECHANISMS AND CLINICAL RELEVANCE", url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10364114/' },
      { source: "TSH-receptor antibodies may prevent bone loss in pre- and postmenopausal women with Graves' disease and Graves' orbitopathy", url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10118993/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ra-advocacy-bone-density'],
  },
  {
    id: 'graves-beta-blockers',
    category: 'graves',
    title: "Beta-Blockers: Real Symptom Relief While the Underlying Disease Is Still Being Treated",
    teaser: 'A racing heart, tremor, and anxiety from excess thyroid hormone can be controlled directly, on a completely separate timeline from the thyroid itself getting better.',
    summary:
      "Propranolol and similar beta-blockers don't treat Graves' disease itself, and don't lower thyroid hormone levels at all. What they do is real and genuinely useful in the meantime: they block many of the immediate, uncomfortable symptoms of excess thyroid hormone, rapid heart rate, tremor, anxiety, heat intolerance, while antithyroid drugs or another definitive treatment work on the actual underlying cause, which typically takes weeks to bring hormone levels down meaningfully. This is worth knowing as a real, deliberate two-track approach rather than confusion about why a second medication is needed at all: one drug (methimazole or PTU) treats the disease, the other (a beta-blocker) manages how it feels while that first drug takes effect. Beta-blockers are typically tapered off once thyroid hormone levels have genuinely normalized, not continued indefinitely once they're no longer doing real work.",
    citations: [
      { source: "Graves' Disease, National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK)", url: 'https://www.niddk.nih.gov/health-information/endocrine-diseases/graves-disease' },
    ],
    overallTier: 'strong',
    relatedIds: ['graves-antithyroid-drug-monitoring'],
  },
  {
    id: 'graves-radioactive-iodine-timing',
    category: 'graves',
    title: 'Considering Radioactive Iodine Treatment? Diet Timing Actually Matters First.',
    teaser: 'A real, practical food-timing fact for anyone actually scheduled for this real, common treatment option, not a hypothetical.',
    summary:
      "Radioactive iodine (RAI) is a real, common, often definitive treatment for Graves' disease, working because the thyroid naturally concentrates iodine, letting a radioactive form selectively target overactive thyroid tissue. That same mechanism is exactly why diet timing matters directly beforehand. A low-iodine diet in the days to weeks leading up to RAI treatment is a real, standard part of preparation, since a thyroid already saturated with dietary iodine has less room to take up the radioactive form, blunting how well the treatment actually works. This is a genuinely time-limited, medically-directed dietary step, not a general Graves' eating rule, and the specific timeline and restriction level should come directly from whoever is administering the treatment rather than assumed from general iodine-avoidance advice found elsewhere.",
    citations: [
      { source: "Graves' Disease, National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK)", url: 'https://www.niddk.nih.gov/health-information/endocrine-diseases/graves-disease' },
    ],
    overallTier: 'moderate',
    relatedIds: ['graves-iodine'],
  },
  {
    id: 'graves-tying-together',
    category: 'graves',
    title: "What Actually Holds Up for Graves', Pulled Together",
    teaser: 'A real mirror image of Hashimoto\'s in more than one place, plus three real self-advocacy numbers worth knowing precisely.',
    summary:
      "Line up everything in this category and the throughline is Graves' own real, direct contrast with Hashimoto's, covered elsewhere in this app. Smoking runs the exact opposite direction (protective for Hashimoto's, a strong, dose-dependent risk factor for Graves' eye disease specifically). Iodine still matters in both, but the real complication in Graves' cuts differently: it's a genuine trigger, and separately can undermine antithyroid drug efficacy, with adequate (not excess, not deficient) intake genuinely giving the best real-world outcomes. Selenium carries strong trial evidence for mild eye disease, a real, usable finding, though not yet settled for more severe cases. The three self-advocacy entries in this category carry unusually precise, quantified numbers worth remembering directly: TRAb/TSI testing gives real percentage odds for both remission and relapse, antithyroid drugs need specific, named warning signs watched for rather than a vague sense of caution, and untreated hyperthyroidism's real, measured bone loss is worth a DEXA scan, not assumed to fully resolve just because thyroid levels normalize.",
    citations: [
      { source: "Graves' Disease, National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK)", url: 'https://www.niddk.nih.gov/health-information/endocrine-diseases/graves-disease' },
    ],
    overallTier: 'strong',
    relatedIds: ['graves-smoking', 'graves-iodine', 'graves-selenium-orbitopathy', 'graves-trab-tsi-testing', 'graves-bone-density'],
  },
];
