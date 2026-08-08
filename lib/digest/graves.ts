import type { DigestEntry } from './types';

// Graves' Disease -- 10 entries, added 2026-08-08 as this app's fourth real
// condition, next in the same priority order RA and Psoriasis already
// followed. Built with the lesson from the Digest-wide restructure earlier
// the same day already applied from the start, rather than bolted on
// after: this file carries its own real, freshly-researched self-advocacy
// content directly (TRAb/TSI antibody testing, antithyroid-drug monitoring,
// bone density) instead of leaving it for a later pass.
//
// Graves' disease is autoimmune thyroid disease aimed the opposite
// direction from a gland-destroying attack -- the same organ, a different
// antibody, a different real physiology. 2026-08-08: reworded to stand on
// its own rather than lean on Hashimoto's as the reference point throughout
// (a real, standing correction -- every condition in this app now gets
// full, independent depth, not depth measured relative to whichever
// condition happened to be built first). Real cross-condition facts that
// genuinely matter for someone managing thyroid autoimmunity generally
// (smoking's opposite risk direction, iodine's differing role) stay, stated
// as real findings in their own right. Every citation was independently
// verified via WebSearch before being written in, the same discipline the
// rest of this Digest already holds to.
export const GRAVES_ENTRIES: DigestEntry[] = [
  {
    id: 'graves-overview',
    category: 'graves',
    title: "Graves' Disease: An Overactive Thyroid Driven by a Stimulating, Not Destructive, Antibody",
    teaser: 'The most common cause of an overactive thyroid, and a real, distinct disease with its own food and lifestyle evidence base.',
    summary:
      "Graves' disease is the most common cause of hyperthyroidism, an overactive thyroid, and it's autoimmune: the body's own immune system makes an antibody (called TSI or TRAb, covered in full below) that binds to and stimulates the same receptor TSH normally uses, driving the thyroid to overproduce hormone. That's a real, structurally different mechanism from an antibody that attacks and gradually destroys thyroid tissue, and it means several real findings here, smoking's effect, iodine's role, even some of the same nutrients, land differently for Graves' than they do for other thyroid conditions this app also covers. Diet won't cure Graves' disease, and nothing here replaces an endocrinologist's own treatment plan. What follows is what the actual research supports, kept honest about how strong each finding really is.",
    citations: [
      { source: "Graves' Disease, National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK)", url: 'https://www.niddk.nih.gov/health-information/endocrine-diseases/graves-disease' },
    ],
    overallTier: 'strong',
    relatedIds: ['graves-smoking', 'calcium-toxicity-hypercalcemia', 'calcium-deficiency-hypocalcemia'],
  },
  {
    id: 'graves-iodine',
    category: 'graves',
    title: "Iodine and Graves': A Real Trigger, and a Real Complication for Treatment Too",
    teaser: 'Excess iodine can trigger Graves\' in the first place, and separately can work against the very drugs used to treat it, two different reasons it matters here.',
    summary:
      "Iodine has a real, two-edged reputation for thyroid health generally, and it cuts its own specific way for Graves'. Excess iodine intake is a documented trigger for Graves' disease itself, and people previously treated with antithyroid drugs, or with a prior iodine deficiency, are especially prone to developing iodine-induced hyperthyroidism when iodine intake rises. Separately, and worth knowing directly if antithyroid drug treatment is already underway: excess iodine in someone actively being treated for Graves' can reduce how well those drugs actually work. The real nuance worth holding onto: this isn't a case for iodine avoidance at any cost. Research also finds adequate (not excessive, not deficient) iodine intake tracks with better remission rates and better long-term control than either too little or too much, making this a genuine Goldilocks nutrient here, not a simple \"avoid it\" rule.",
    citations: [
      { source: 'Excess iodine intake: sources, assessment, and effects on thyroid function', url: 'https://pubmed.ncbi.nlm.nih.gov/30891786/' },
      { source: "Effect of iodine nutritional status on the recurrence of hyperthyroidism and antithyroid drug efficacy in adult patients with Graves' disease: a systemic review", url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10600371/' },
    ],
    overallTier: 'strong',
    relatedIds: ['graves-radioactive-iodine-timing', 'iodine-toxicity-acute-chronic', 'iodine-tying-together'],
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
    title: 'Smoking Is One of the Strongest Documented Risk Factors for Graves\' Eye Disease',
    teaser: "A meta-analysis of 56 studies found smoking significantly raises the risk of thyroid eye disease, with the risk rising further for every additional cigarette.",
    summary:
      "Smoking is well-established as harmful in nearly every way, and for Graves' disease specifically it carries a real, well-documented, dose-dependent risk. A meta-analysis covering 56 studies found smoking (current or past) significantly raises the risk of thyroid eye disease, and an earlier, large meta-analysis found the association even sharper for Graves' ophthalmopathy than for Graves' disease alone. The risk rises with each additional cigarette smoked per day, and even partial smoking reduction appears to lower risk somewhat. Worth naming directly, since it lands differently for different thyroid conditions: this app's own Hashimoto's research documents a real, separate, genuinely counterintuitive finding that smoking tracks with LOWER risk of developing Hashimoto's thyroiditis specifically. The two findings aren't in tension with each other; they're two different diseases with two different real relationships to the same habit. This is one of the clearest, most direct reasons in this whole app that smoking-cessation counseling belongs as a real, named part of Graves' treatment, not just general health advice repeated out of habit.",
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
    teaser: 'A strong, dose-dependent smoking risk, a genuine Goldilocks nutrient, and three real self-advocacy numbers worth knowing precisely.',
    summary:
      "Line up everything in this category and Graves' reads as a real, distinct disease with its own directly useful evidence. Smoking is a strong, dose-dependent risk factor for Graves' eye disease specifically, one of the clearest reasons anywhere in this app that cessation counseling belongs as real, named part of treatment. Iodine is a genuine trigger, and separately can undermine antithyroid drug efficacy, with adequate (not excess, not deficient) intake genuinely giving the best real-world outcomes, a true Goldilocks nutrient here. Selenium carries strong trial evidence for mild eye disease, a real, usable finding, though not yet settled for more severe cases. The three self-advocacy entries in this category carry unusually precise, quantified numbers worth remembering directly: TRAb/TSI testing gives real percentage odds for both remission and relapse, antithyroid drugs need specific, named warning signs watched for rather than a vague sense of caution, and untreated hyperthyroidism's real, measured bone loss is worth a DEXA scan, not assumed to fully resolve just because thyroid levels normalize.",
    citations: [
      { source: "Graves' Disease, National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK)", url: 'https://www.niddk.nih.gov/health-information/endocrine-diseases/graves-disease' },
    ],
    overallTier: 'strong',
    relatedIds: ['graves-smoking', 'graves-iodine', 'graves-selenium-orbitopathy', 'graves-trab-tsi-testing', 'graves-bone-density'],
  },

  // -- Full-depth parity additions, 2026-08-08. Every citation
  // independently verified via WebSearch.
  {
    id: 'graves-remission-real-rates',
    category: 'graves',
    title: "Antithyroid Drug Remission: Real, Quantified Odds by Treatment Length and Real Risk Factors That Lower Them",
    teaser: 'A standard 12-18 month course puts remission odds around 30-40%. Extending treatment to 24-36 months raises that to roughly 50% -- a real, direct, actionable tradeoff.',
    summary:
      "Graves' disease has a real, quantified remission timeline worth knowing directly before starting antithyroid drug treatment. A standard 12-18 month course of methimazole or carbimazole (already covered in this app's own medication research) puts real remission (normal thyroid levels maintained for at least a year after stopping the drug) at roughly 30-40%. Extending treatment to 24-36 months raises real remission odds to roughly 50%, climbing further to 60% in people with smaller goiters. Real, specific risk factors independently lower those odds: smoking, being a young male, and having very high TSH-receptor antibody levels at diagnosis all track with remission rates falling below 20%. For anyone who relapses after a first course, real data shows a second course still carries genuine value, a 54.1% remission rate in one real cohort. Worth raising directly with an endocrinologist: how long a specific treatment course is planned for, and whether any of these real risk factors apply, since they meaningfully change the odds of avoiding radioactive iodine or surgery down the line.",
    citations: [
      { source: "Long-term follow-up result of antithyroid drug treatment of Graves' hyperthyroidism in a large cohort, European Thyroid Journal", url: 'https://etj.bioscientifica.com/view/journals/etj/12/2/ETJ-22-0226.xml' },
    ],
    overallTier: 'strong',
    relatedIds: ['graves-trab-tsi-testing'],
  },
  {
    id: 'graves-cardiac-thyroid-storm',
    category: 'graves',
    title: "Untreated Graves' Carries Real, Serious Cardiac Risk, Up to and Including a Rare but Genuinely Life-Threatening Emergency",
    teaser: 'Atrial fibrillation in up to 22% of hyperthyroid patients, and thyroid storm, rare but carrying a real 10-20% mortality rate even with hospital treatment.',
    summary:
      "Excess thyroid hormone has a real, direct, and serious effect on the heart, worth knowing beyond the general \"racing heart\" symptom most people associate with hyperthyroidism. Real research finds atrial fibrillation, an irregular heart rhythm carrying its own real stroke risk, occurs in 9-22% of hyperthyroid patients overall, and in 5-15% of those over 60 specifically. Left untreated long enough, Graves' can progress to high-output cardiac failure, the heart genuinely unable to keep pace with the metabolic demand excess thyroid hormone creates. The single most serious, rare real complication is thyroid storm, a sudden, massive release of thyroid hormone that is a genuine medical emergency: it affects roughly 1-2% of people hospitalized for thyrotoxicosis, and even with real, aggressive hospital treatment, carries a real 10-20% overall mortality rate, rising to roughly 75% specifically among those who don't survive to full recovery. Real, documented triggers include infection, surgery, and, notably, an actual COVID-19 infection in at least one recent case report. This is the real, direct reason Graves' disease genuinely isn't a condition to leave untreated or undertreated even when symptoms feel manageable day to day.",
    citations: [
      { source: "Graves' Disease, StatPearls, NCBI Bookshelf", url: 'https://www.ncbi.nlm.nih.gov/sites/books/NBK448195/' },
    ],
    overallTier: 'strong',
    relatedIds: ['graves-bone-density'],
  },
  {
    id: 'graves-history-milestones',
    category: 'graves',
    title: "Graves' Disease's Own Real History: Named After a Man Who Wasn't Actually First to Describe It",
    teaser: '1786, 1835, 1941 -- a real, quietly interesting historical footnote (the disease is named for the second person to report it, not the first), and a genuine wartime-era treatment breakthrough.',
    summary:
      "Graves' disease carries a real, slightly ironic naming history: Caleb Hillier Parry first documented a real case of hyperthyroidism with goiter in 1786, but his own report wasn't published until 1825, ten years after his death. Robert Graves published his own now-famous description in 1835 (palpitations, goiter, and exophthalmos, the bulging-eye sign, in three women), and the disease carries his name rather than Parry's purely because of real publication timing, not who actually saw it first. Early 20th-century treatment options were genuinely limited to surgery (initially crude: injecting hot water into the thyroid, then artery ligation, then partial removal) since neither antithyroid drugs nor radioactive iodine existed yet. The real, defining treatment breakthrough came in 1941, when Saul Hertz first used radioactive iodine (I-131) to treat Graves' patients, a real, direct outgrowth of nuclear-medicine research becoming available in that same wartime era; by 1946, radioactive iodine treatment was widely available, and remains one of the three real, standard treatment options (alongside antithyroid drugs and surgery) used today.",
    citations: [
      { source: "Management of Graves' Hyperthyroidism: More Than a Century of Progression", url: 'https://brieflands.com/journals/ijem/articles/103943' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'graves-pregnancy-fetal-thyrotoxicosis',
    category: 'graves',
    title: "A Real, Genuinely Counterintuitive Pregnancy Risk: A Mother's Own TRAb Antibodies Can Cause Fetal Thyrotoxicosis Even After SHE Has Become Hypothyroid",
    teaser: "TRAb antibodies cross the placenta independent of the mother's own current thyroid hormone level -- meaning a mother made hypothyroid by past radioactive-iodine treatment can still, rarely, cause her own baby's thyroid to run too fast.",
    summary:
      "This is a real, genuinely surprising finding worth knowing directly if pregnancy is being planned after any past Graves' treatment: TRAb (TSH-receptor antibody), the same real antibody already covered in this app's own self-advocacy research, crosses the placenta and can stimulate the FETUS's own thyroid independent of what the mother's own current thyroid hormone level actually is. That means even a mother made hypothyroid by earlier radioactive-iodine treatment or surgery can, in real, documented if rare cases, still carry high enough TRAb levels to cause fetal or neonatal thyrotoxicosis. Real research finds this happens in up to 5% of pregnancies in mothers with a Graves' history, with a real, serious 12-20% mortality rate when it occurs, mainly from fetal heart failure. TRAb crossing becomes most consequential in the second half of pregnancy, when placental passage increases and the fetal thyroid has matured enough to actually respond to it. The real, practical takeaway: TRAb levels, not just the mother's own TSH/T4, need real monitoring throughout a pregnancy with any Graves' history, and continued fetal surveillance (heart rate, ultrasound) is recommended regardless of how low a mother's own antibody titer currently reads.",
    citations: [
      { source: 'Thyroid-Stimulating Hormone Receptor Antibodies in Pregnancy: Clinical Relevance, PMC5491546', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5491546/' },
    ],
    overallTier: 'strong',
    relatedIds: ['graves-trab-tsi-testing'],
  },
];
