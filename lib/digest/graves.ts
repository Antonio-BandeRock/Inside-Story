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

  // -- Second depth pass, 2026-08-08, extending full-parity work to the
  // first 10 non-Hashimoto's conditions. Every citation independently
  // verified via WebSearch.
  {
    id: 'graves-genetic-family-risk',
    category: 'graves',
    title: 'A Real Twin Study Found Genetics Explains Roughly 80% of Who Develops Graves\' Disease',
    teaser: 'Real family and twin research points to a genuinely strong inherited component behind Graves\', anchored around specific, named genes already tied to immune regulation, worth knowing directly if a close relative has it.',
    summary:
      "Graves' disease carries a real, substantial inherited risk component, not just a loosely observed family tendency. A real twin study found approximately 80% of susceptibility to Graves' disease attributable to genetic factors, with more recent estimates placing genetics at 60-80% of overall disease risk through a real, polygenic pattern rather than one single gene. The best-characterized real genetic contributors involve the HLA immune-recognition complex, particularly the HLA-DR3 haplotype, alongside CTLA-4 (a gene that normally acts as a brake on T-cell activation) and PTPN22, both real, independently studied immune-regulation genes with a documented statistical association to Graves' risk. This connects directly to a real, already-established parallel already covered elsewhere in this app: Hashimoto's own heritability research draws on the same kind of twin-study and shared-gene evidence (including CTLA-4), and Graves' and Hashimoto's are themselves two real, opposite-direction autoimmune thyroid diseases that can run in the same families, sometimes even in the same person at different points in life. Worth knowing directly: having a close relative with Graves', or with another autoimmune thyroid condition, is a real, genetics-backed reason to watch for symptoms and consider a real thyroid panel (already covered in this app's own self-advocacy research) earlier rather than waiting for a family history to feel coincidental.",
    citations: [
      { source: 'Association between the CTLA-4 +49A/G polymorphism and Graves\' disease: A meta-analysis, PMC3503798', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3503798/' },
      { source: 'Screening of Graves\' disease susceptibility genes by whole exome sequencing in a three-generation family, BMC Medical Genomics', url: 'https://link.springer.com/article/10.1186/s12920-020-00865-z' },
    ],
    overallTier: 'strong',
    relatedIds: ['history-heritability-family-risk'],
  },

  // -- Volumetric depth pass, 2026-08-08, continuing full-parity work
  // beyond the second structural depth pass, working toward Hashimoto's
  // own real 176-entry depth. Every citation independently verified via
  // WebSearch.
  {
    id: 'graves-stress-trigger',
    category: 'graves',
    title: 'A Real Meta-Analysis Confirms Stressful Life Events Genuinely Trigger Graves\' Disease Onset in Susceptible People',
    teaser: 'A real, 13-study meta-analysis of nearly 2,900 people found stressful life events tied to Graves\' onset, strongest in younger patients and in women, and one small real study even found stress-relief training leading to disease remission.',
    summary:
      "Major life stress is a real, independently studied, and increasingly well-supported environmental trigger for Graves' disease onset, not just a folk belief. A real, current systematic review and meta-analysis (13 studies, 2,892 subjects across nine countries) found stressful life events genuinely associated with Graves' disease onset specifically in people already carrying the genetic susceptibility already covered in this app's own genetic/family-risk research, real evidence this is a gene-environment interaction rather than stress acting alone. The real association was found stronger in samples with more female patients and in younger patients, matching Graves' disease's own real, well-documented demographic pattern. A real, separate, smaller study found newly diagnosed Graves' patients reported significantly more stressful life events in the 12 months before diagnosis than matched controls. Genuinely striking, and worth knowing directly: a real, small study (11 participants) whose Graves' disease developed after acute emotional distress found stress-relief training itself leading to disease remission in that group, a real, if preliminary, hint that addressing the stress response directly might have therapeutic value alongside standard antithyroid treatment, not proof of a stand-alone cure. Worth knowing directly: this connects straight to this app's own already-covered HPA-axis/cortisol research built for other conditions, real, additional evidence that chronic stress management belongs in a real Graves' management plan, not just symptom control through medication alone.",
    citations: [
      { source: 'What is the impact of stress on the onset and anti-thyroid drug therapy in patients with Graves\' disease: a systematic review and meta-analysis, PMC10496195', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10496195/' },
      { source: 'Relationship between the number and impact of stressful life events and the onset of Graves\' disease and toxic nodular goitre, PMID 11453947', url: 'https://pubmed.ncbi.nlm.nih.gov/11453947/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['graves-genetic-family-risk'],
  },
  {
    id: 'graves-teprotumumab-thyroid-eye-disease',
    category: 'graves',
    title: 'Teprotumumab: A Real, Targeted Biologic That Genuinely Reverses Thyroid Eye Disease, Not Just Manages It',
    teaser: 'A real, landmark trial found teprotumumab produced a real treatment response in 69% of patients versus 20% on placebo, with measured eye bulging (proptosis) shrinking by an average of 2.46mm, a real structural reversal most prior treatments couldn\'t achieve.',
    summary:
      "Teprotumumab (brand name Tepezza) represents a real, genuinely different kind of treatment for thyroid eye disease (the same active Graves' orbitopathy already covered in this app's own selenium-orbitopathy research) than anything available before it. Rather than just managing symptoms, real, landmark trial data found teprotumumab produced a real treatment response, measured improvement in eye protrusion plus at least one other real clinical marker, in 69% of patients at 24 weeks, compared to just 20% on placebo. The real, structural change was substantial: proptosis (the actual forward bulging of the eye) decreased by an average of 2.46mm in the treated group versus just 0.15mm on placebo, a real, measurable physical reversal rather than symptom masking. Real, longer-term follow-up across multiple trials confirmed the benefit held up over time, including in patients re-treated after their disease returned. Worth knowing honestly: this is a real, genuinely newer and more effective option, but it isn't risk-free, real research finds a higher rate of adverse events with teprotumumab than placebo, including gastrointestinal reactions, muscle spasms, and documented cases of hearing changes, worth discussing directly and thoroughly with an ophthalmologist and endocrinologist together before starting. Worth knowing directly: anyone with active, moderate-to-severe thyroid eye disease not adequately controlled by the selenium and standard measures already covered elsewhere in this app's own Graves' research has a real, evidence-backed reason to ask specifically about teprotumumab by name.",
    citations: [
      { source: 'Teprotumumab for the Treatment of Active Thyroid Eye Disease, New England Journal of Medicine', url: 'https://www.nejm.org/doi/full/10.1056/NEJMoa1910434' },
      { source: 'The Efficacy and Safety of Teprotumumab in Thyroid Eye Disease: Evidence from Randomized Controlled Trials, PMC10427239', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10427239/' },
    ],
    overallTier: 'strong',
    relatedIds: ['graves-selenium-orbitopathy'],
  },
  {
    id: 'graves-block-replace-vs-titration',
    category: 'graves',
    title: 'Block-and-Replace vs. Titration: Two Real, Roughly Equally Effective Ways to Dose Antithyroid Medication',
    teaser: 'Real research finds combining a fixed high-dose antithyroid drug with levothyroxine (block-and-replace) works about as well as the more common titrating-dose approach, with the real, practical benefit of fewer clinic visits and blood draws.',
    summary:
      "Antithyroid drug treatment for Graves' disease has two real, established dosing strategies, and real comparative research finds them roughly equally effective at achieving a euthyroid (normal thyroid function) state, a genuinely useful thing to know when discussing treatment options with an endocrinologist. The titration regime, the more commonly used approach, involves gradually adjusting antithyroid drug dose alone based on frequent blood testing. The block-and-replace regime instead uses a fixed, higher dose of antithyroid drug combined with levothyroxine (already covered in this app's own Hashimoto's medication research, used here for a different purpose) to prevent the person from becoming hypothyroid from the higher antithyroid dose. Real research finds no statistically significant difference between the two in achieving euthyroid status, and no significant difference in the incidence of overt hypothyroidism or in rare serious side effects like agranulocytosis or liver toxicity. The real, practical, everyday-life difference: block-and-replace requires real, measurably fewer thyroid function tests and clinic visits per year than the titration regime, a genuine convenience advantage for someone who finds frequent blood draws and appointments burdensome. Worth knowing directly: neither approach is definitively better, both are real, legitimate options, and this is a real, worth-raising conversation with a prescriber about which regimen better fits someone's own real-life logistics and testing tolerance, not just which one is more commonly defaulted to.",
    citations: [
      { source: 'Block-and-replace vs. titration antithyroid drug regimen for Graves\' hyperthyroidism: two is not always better than one, PMID 33000387', url: 'https://pubmed.ncbi.nlm.nih.gov/33000387/' },
      { source: 'Block & replace regime versus titration regime of antithyroid drugs for the treatment of Graves\' disease: a retrospective observational study, Clinical Endocrinology', url: 'https://onlinelibrary.wiley.com/doi/10.1111/cen.12478' },
    ],
    overallTier: 'strong',
    relatedIds: ['graves-antithyroid-drug-monitoring'],
  },

  // -- Volumetric depth pass batch 4, 2026-08-08, continuing toward
  // genuine volumetric parity with Hashimoto's own depth. Every citation
  // independently verified via WebSearch.
  {
    id: 'graves-subclinical-hyperthyroidism',
    category: 'graves',
    title: 'Subclinical Hyperthyroidism: Real, Meaningful Risk Even Before Symptoms Show Up',
    teaser: 'A real, low but not "zero" TSH with normal T4/T3 still carries a genuine, documented risk of atrial fibrillation, heart failure, higher mortality, and lower bone density, worth taking seriously even without overt Graves\' symptoms.',
    summary:
      "Subclinical hyperthyroidism, a real, low TSH with T4 and T3 levels still testing within the normal range, is worth knowing about directly as a real, distinct risk category, not something to dismiss just because it hasn't progressed to the overt disease already covered in depth elsewhere in this app's own Graves' research. Real, pooled research finds subclinical hyperthyroidism genuinely associated with coronary heart disease, total mortality, and CHD-specific mortality. Real research finds this risk particularly pronounced at a real, specific threshold, a TSH at or below 0.1 mU/L carries the strongest documented association with atrial fibrillation, and real research finds subclinical hyperthyroidism independently tied to increased risk of atrial fibrillation and heart failure in older adults specifically. Real research finds a real bone-health cost too, decreased bone mineral density, with a documented history of hyperthyroidism (even subclinical) an independent risk factor for hip and vertebral fracture (a real 1.8-fold relative risk). Worth knowing honestly: real research finds genuine, emerging evidence supporting treatment specifically for TSH under 0.1 mIU/L, particularly in older adults and those at high cardiovascular or bone-fracture risk, though real research also finds no long-term, definitive trial yet proving treatment itself reduces these real downstream risks. Worth knowing directly: this is a real, worth-raising conversation for anyone whose lab work shows a low TSH with otherwise \"normal\" thyroid hormone levels, real, ongoing monitoring and a real risk-benefit conversation about treatment matter here, not just watching and waiting indefinitely.",
    citations: [
      { source: 'Subclinical Hyperthyroidism and Cardiovascular Disease, Thyroid (2024)', url: 'https://journals.sagepub.com/doi/10.1089/thy.2024.0291' },
      { source: 'Relationship between Subclinical Thyroid Dysfunction and the Risk of Cardiovascular Outcomes, PMC5610794', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5610794/' },
    ],
    overallTier: 'strong',
    relatedIds: ['graves-bone-density', 'graves-cardiac-thyroid-storm'],
  },
  {
    id: 'graves-biotin-antibody-interference',
    category: 'graves',
    title: 'High-Dose Biotin Can Fake a Positive Graves\' Antibody Test Result, a Real, Documented Diagnostic Trap',
    teaser: 'Real research finds biotin supplements can interfere with the exact TRAb/TSI antibody tests already covered in this app\'s own Graves\' self-advocacy research, producing a real, misleading lab pattern identical to Graves\' disease itself.',
    summary:
      "High-dose biotin supplements carry a real, well-documented, and genuinely important risk of distorting the TRAb/TSI antibody testing already covered in this app's own Graves' self-advocacy research, worth knowing about directly since it can lead to a real, misdiagnosed case of Graves' disease that isn't actually there. Real research finds biotin specifically interferes with the detection of anti-thyrotropin (TSH-receptor) antibodies, and real case reports document this producing a laboratory pattern that looks identical to genuine Graves' disease. The real, underlying mechanism ties to how most commercial thyroid assays work: they rely on a biotin-streptavidin binding system, and excess biotin in the blood can either falsely lower or falsely raise a given test's result depending on the specific assay design, competitive assays (like T3/T4) tend to read falsely HIGH with excess biotin, while sandwich assays (like TSH itself) tend to read falsely LOW. Worth knowing directly: real, current American Thyroid Association guidance recommends stopping biotin supplementation for at least 2 days before any thyroid lab test, this app's own Labs & Medication Timing category already covers this same real interference for Hashimoto's; it applies with equal, direct relevance here for anyone on biotin considering testing for Graves' antibodies specifically. Worth knowing directly: a surprising or unexpected positive TRAb/TSI result in someone taking high-dose biotin (common in hair/skin/nail supplements) is a real, worth-raising reason to retest after stopping the supplement before accepting the result as a genuine Graves' diagnosis.",
    citations: [
      { source: 'Biotin induced biochemical hyperthyroidism: a case report and review of the literature, PMC10304644', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10304644/' },
      { source: 'Significant Interference of Biotin in Thyroid Function Tests Using Beckman Analyzer', url: 'https://www.annclinlabsci.org/content/53/1/130.full' },
    ],
    overallTier: 'strong',
    relatedIds: ['graves-trab-tsi-testing', 'labs-biotin-interference'],
  },
  {
    id: 'graves-treatment-comparison-real-outcomes',
    category: 'graves',
    title: 'Real, Long-Term Outcomes Compared: Surgery, Radioactive Iodine, and Antithyroid Drugs Aren\'t Interchangeable',
    teaser: 'A real, long-term study found patients treated with thyroidectomy as their first treatment had lower rates of death, heart disease, and diabetes over time than those treated with radioactive iodine or antithyroid drugs alone.',
    summary:
      "Graves' disease has three real, distinct first-line treatment paths, already covered individually across this app's own research (antithyroid drugs, radioactive iodine, and thyroidectomy), and real, direct, long-term comparative research finds genuine differences in outcomes between them worth knowing about together. A real, large comparative study found patients treated with surgery as their initial treatment had a real, lower long-term risk of all-cause mortality, cardiovascular disease, atrial fibrillation, psychological disease, diabetes, and hypertension compared to those treated first with antithyroid drugs or radioactive iodine. Real, separate cost-effectiveness research found total thyroidectomy more cost-effective than radioactive iodine specifically for patients who can't tolerate or don't respond to antithyroid drugs, real quality-adjusted-life-year data favoring surgery (23.6 vs. 20.9 QALYs). Worth knowing honestly: real research finds radioactive iodine's own overall success rate genuinely variable, 60.7% in one real study of young adults, with larger thyroid size and longer disease duration both real, identified risk factors for treatment failure requiring a second round. Real research also finds long-term, continuous antithyroid drug treatment (rather than the standard fixed-course approach) achieving substantially higher sustained remission, a real, worth-knowing alternative to the usual time-limited course. Worth knowing directly: this is real, comparative evidence worth bringing directly into a treatment-choice conversation with an endocrinologist, no single option is universally best, and the real tradeoffs (surgical risk and recovery vs. radioactive iodine's own variable success rate vs. antithyroid drugs' own real relapse risk) deserve a real, individualized weighing rather than defaulting to whichever option is most commonly offered first.",
    citations: [
      { source: 'Outcomes of Graves\' Disease Patients Following Antithyroid Drugs, Radioactive Iodine, or Thyroidectomy as the First-line Treatment, PMID 33914484', url: 'https://pubmed.ncbi.nlm.nih.gov/33914484/' },
      { source: 'Total thyroidectomy is more cost-effective than radioactive iodine as an alternative to antithyroid medication for Graves\' disease', url: 'https://www.sciencedirect.com/science/article/abs/pii/S0039606022006742' },
    ],
    overallTier: 'strong',
    relatedIds: ['graves-radioactive-iodine-timing', 'graves-remission-real-rates'],
  },
  {
    id: 'graves-euthyroid-ophthalmopathy',
    category: 'graves',
    title: 'Graves\' Eye Disease Can Genuinely Show Up With Completely Normal Thyroid Labs',
    teaser: 'A real, pooled review found close to 1 in 10 people with thyroid eye disease have normal-functioning or even underactive thyroids, not the overactive one the disease is usually assumed to require.',
    summary:
      "Thyroid eye disease (Graves' orbitopathy) is usually assumed to travel together with overactive thyroid hormone levels, but real research finds a genuine, if smaller, exception worth knowing directly: a real, pooled systematic review found the global prevalence of thyroid eye disease broke down to 86.2% with hyperthyroidism, 10.36% with hypothyroidism, and 7.9% with completely normal thyroid function (euthyroid), meaning close to 1 in 10 cases occur without the overactive thyroid hormone levels the condition is usually assumed to require. Real research defines this as a genuine, distinct entity, real orbital inflammation occurring with no current or past thyroid hormone abnormality and no antithyroid treatment, and finds it's still frequently associated with high levels of the same real thyroid-stimulating antibody driving Graves' disease itself, even when standard thyroid hormone levels look entirely normal. Worth knowing directly: real euthyroid ophthalmopathy can represent an early stage, with real thyroid dysfunction developing later, or it can genuinely stay euthyroid throughout. This matters plainly for self-advocacy: real eye symptoms (bulging, dryness, double vision, pressure) shouldn't be dismissed as unrelated to Graves' disease just because a recent thyroid panel came back normal, the two don't always move together.",
    citations: [
      { source: 'Prevalence of hyperthyroidism, hypothyroidism, and euthyroidism in thyroid eye disease: a systematic review of the literature, Systematic Reviews 2020, PMID 32873324', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7465839/' },
    ],
    overallTier: 'strong',
    relatedIds: ['graves-teprotumumab-thyroid-eye-disease'],
  },
  {
    id: 'graves-vitamin-d-deficiency-risk',
    category: 'graves',
    title: 'Vitamin D and Graves\' Disease: a Real Association, With Genuinely Mixed Evidence on What to Do About It',
    teaser: 'A real meta-analysis found Graves\' patients over twice as likely to be vitamin D deficient as healthy controls, but a real supplementation trial found no effect on preventing the disease from coming back.',
    summary:
      "Vitamin D deficiency shows up repeatedly across this app's own autoimmune-disease research, and Graves' disease is no exception, but the real evidence here is honestly more mixed than a simple 'take vitamin D' recommendation would suggest. A real meta-analysis found people with Graves' disease significantly more likely to be vitamin D deficient than healthy controls (odds ratio 2.24), with one individual study finding a real, striking gap (64% deficient in Graves' patients versus 30% in controls). Worth knowing honestly, and directly relevant to what this actually means for treatment: a real, separate prospective study found vitamin D deficiency was NOT associated with actually developing Graves' disease or its eye complications, and a real supplementation trial found giving vitamin D didn't prevent Graves' disease from recurring after treatment. Put together, this is a real, genuine association between having Graves' disease and running low on vitamin D, without solid, real evidence yet that the deficiency causes the disease or that correcting it changes the disease's own course, the same honest 'real correlation, unproven intervention' pattern this app's own research has already found repeating across several other autoimmune conditions. Worth knowing directly: checking vitamin D status remains reasonable, general health practice, just not, based on real current evidence, a specific lever for preventing or reversing Graves' disease itself.",
    citations: [
      { source: "Vitamin D and Graves' Disease: A Meta-Analysis Update, Nutrients 2015, PMID 26007334", url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4446781/' },
      { source: "Vitamin D supplementation does not prevent the recurrence of Graves' disease, Scientific Reports 2019", url: 'https://www.nature.com/articles/s41598-019-55107-9' },
    ],
    overallTier: 'moderate',
    relatedIds: ['graves-bone-density'],
  },
  {
    id: 'graves-pediatric-lower-remission-real-data',
    category: 'graves',
    title: 'Antithyroid Drugs Work the Same Way in Children, but Remission Genuinely Takes Longer',
    teaser: 'A real, pooled meta-analysis found remission rates in pediatric Graves\' disease climbing from a real 15.5% under 2 years of treatment to 33.0% past 5 years, real, direct evidence that children need real patience with this treatment that adults often don\'t.',
    summary:
      "This category's own already-covered antithyroid-drug-monitoring and block-and-replace-versus-titration research is written largely around adult dosing and safety. Real, pooled evidence finds one real, important difference specific to children and adolescents worth knowing directly: remission takes genuinely longer to reach. A real, pooled meta-analysis found remission rates of 15.5% for treatment courses under 2 years, rising to 24.1% for 2 to 5 years, and 33.0% for courses longer than 5 years, with each additional year of treatment adding a real, measurable 3.8% increase in the relative likelihood of remission. This is a real, meaningfully different pattern from adult Graves' treatment, where this category's own real, general remission research already treats a much shorter initial course as standard. Worth knowing directly: a real, well-documented practical implication follows directly from this data, extending antithyroid drug treatment well past the point an adult might stop is a real, evidence-backed strategy specifically in pediatric Graves', not simply a slower version of the same adult protocol. This is real, useful context for a parent or a pediatric endocrinology team weighing how long to continue medication before considering radioactive iodine or surgery, both already covered in this category's own treatment-comparison research.",
    citations: [
      { source: "Effect of Antithyroid Drugs Treatment Duration on The Remission Rates of Graves' Disease in Children and Adolescents: A Single-Arm Meta-Analysis and Systematic Review, Clinical Endocrinology 2024, PMID 39501471", url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11694547/' },
    ],
    overallTier: 'strong',
    relatedIds: ['graves-block-replace-vs-titration', 'graves-remission-real-rates'],
  },
  {
    id: 'graves-global-iodine-iceland-denmark',
    category: 'graves',
    title: "A Real Denmark-vs-Iceland Study Directly Showed Iodine's Effect on Where Graves' Actually Shows Up",
    teaser: "A real, classic comparative study found Graves' disease in young people more than twice as common in iodine-sufficient Iceland as in iodine-deficient Denmark, while overall thyrotoxicosis ran the opposite direction.",
    summary:
      "A real, classic comparative study directly tested how iodine intake shapes which specific thyroid condition shows up in a population, comparing East-Jutland, Denmark (low average iodine intake) against Iceland (relatively high iodine intake) over the same period. Graves' disease incidence was measurably higher in iodine-sufficient Iceland (20 per 100,000 per year) than in iodine-deficient Denmark (15 per 100,000 per year), and this difference was most pronounced in younger people, where hyperthyroidism from Graves' disease was more than twice as common in Iceland. The real, opposite pattern showed up for a different cause of an overactive thyroid: multinodular toxic goiter and single toxic nodules, mostly in people over 50, were substantially more common in iodine-deficient Denmark, meaning total thyrotoxicosis of any cause actually ran higher in the low-iodine region even though Graves' disease specifically ran higher in the high-iodine one. Worth knowing directly: this is real, direct evidence that a region's own iodine status shapes not just how common thyroid disease is, but which specific thyroid disease shows up, and it's a real, practical reason population iodine intake shouldn't run meaningfully above what's needed to avoid deficiency.",
    citations: [
      { source: "High incidence of multinodular toxic goitre in the elderly population in a low iodine intake area vs. high incidence of Graves' disease in the young in a high iodine intake area, Journal of Internal Medicine, PMID 2040867", url: 'https://pubmed.ncbi.nlm.nih.gov/2040867/' },
    ],
    overallTier: 'strong',
    relatedIds: ['graves-overview', 'lifestyle-global-iodine-china-regional'],
  },
  {
    id: 'graves-dermopathy-pretibial-myxedema',
    category: 'graves',
    title: "Graves' Disease Can Also Show Up on the Skin, a Real, Distinct, Often-Missed Sign",
    teaser: "Pretibial myxedema, a real, thickened, non-pitting skin change on the shins, affects a real minority of Graves' patients overall but climbs to 15% in those who also have eye involvement.",
    summary:
      "Graves' disease is usually discussed for its effects on the thyroid gland and, in this category's own already-covered content, the eyes. A real, third, distinct site is worth knowing directly: the skin. Pretibial myxedema (also called Graves' dermopathy), a real, thickened, non-pitting swelling most often on the front of the shins, affects a real 0.5 to 4.3% of Graves' patients overall, historically documented as high as 5% before modern early antithyroid treatment likely reduced how often it progresses to this stage. The real, meaningful pattern worth knowing: this prevalence climbs substantially, to 15%, specifically in Graves' patients who also have eye involvement (ophthalmopathy), and a real case series found the pretibial area involved in 99% of cases with 96% of patients also having coexisting eye disease, evidence that skin and eye involvement share much of the same real underlying immune mechanism rather than occurring independently. Worth knowing directly: a new, unexplained thickened or waxy patch of skin on the shins, especially alongside already-diagnosed Graves' eye disease, is a real, recognizable, named finding worth mentioning to a doctor directly by name, not a separate, unrelated skin condition.",
    chart: {
      title: 'Pretibial myxedema prevalence in Graves’ disease',
      unit: '%',
      data: [
        { label: 'All Graves’ patients (typical range)', value: 4.3 },
        { label: 'Graves’ patients with eye disease', value: 15 },
      ],
      sourceNote: 'Update on pathophysiology and treatment of pretibial myxedema, JAAD Reviews; Dermopathy of Graves’ Disease, JCEM',
    },
    citations: [
      { source: "Update on pathophysiology and treatment of pretibial myxedema: A comprehensive review of the literature, JAAD Reviews", url: 'https://www.jaadreviews.org/article/S2950-1989(25)00035-2/fulltext' },
      { source: "Dermopathy of Graves' Disease (Pretibial Myxedema): Long-Term Outcome, Journal of Clinical Endocrinology & Metabolism", url: 'https://academic.oup.com/jcem/article/87/2/438/2846476' },
    ],
    overallTier: 'strong',
    relatedIds: ['graves-euthyroid-ophthalmopathy', 'graves-teprotumumab-thyroid-eye-disease'],
  },
  {
    id: 'graves-global-treatment-choice-by-country',
    category: 'graves',
    title: "Which Graves' Treatment a Person Actually Gets Often Depends More on Their Country Than Their Case",
    teaser: "The US leans toward radioactive iodine as its default Graves' treatment; Europe and Japan both lean toward antithyroid drugs or surgery first, a real, documented difference in medical culture, not disease severity.",
    summary:
      "This category's own already-covered antithyroid-drug-vs-radioactive-iodine-vs-surgery research assumes a real, active choice between three real, valid options, and real, international data finds that choice made very differently depending on where a person happens to be treated. Radioactive iodine has long been the most commonly used first-line treatment for Graves' disease in the United States, while real clinical practice in Europe and Japan more often defaults to antithyroid drugs or surgery instead, a real, documented difference in medical culture and guideline emphasis, not a difference in how severe Graves' disease itself tends to be in each region. Real Japanese-specific research continues actively refining combined approaches (radioactive iodine alongside continued antithyroid drugs) rather than treating radioactive iodine as a stand-alone default the way US practice more often does. Worth knowing directly: someone outside the US reading this app's own already-covered treatment-comparison research should expect their own doctor's real, likely first recommendation to differ from what's most common in US-centered patient discussions, not because their case is different, but because the country they're being treated in has a real, different default starting point among three options this category already establishes are all real, valid choices.",
    citations: [
      { source: 'Radioactive Iodine Therapy vs. Antithyroid Medications for Graves Disease, American Family Physician', url: 'https://www.aafp.org/pubs/afp/issues/2017/0301/p292.html' },
      { source: "Efficacy of radioactive iodine therapy with concomitant antithyroid drugs in Japanese patients with Graves' disease, PMC12613672", url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12613672/' },
    ],
    overallTier: 'strong',
    relatedIds: ['graves-block-replace-vs-titration', 'graves-treatment-comparison-real-outcomes'],
  },
  {
    id: 'horizon-graves',
    category: 'graves',
    title: "Real, Early Trials Are Testing Whether Depleting the Cells That Make Graves' Antibodies Actually Works",
    teaser: "Rituximab, a real B-cell-depleting drug already used elsewhere in this app's own research, is being tested specifically for Graves' disease itself, targeting the exact cells that produce the antibody driving the condition.",
    summary:
      "This category's own already-covered TRAb/TSI antibody research names exactly what drives Graves' disease: an antibody produced by B cells that mimics TSH and overstimulates the thyroid. The real, logical next step being actively tested: depleting those B cells directly with rituximab, a real, already-established drug used for other autoimmune conditions covered elsewhere in this app. A real Phase 2 trial in young people (ages 12 to 20) with Graves' hyperthyroidism found the treatment well tolerated over 12 months alongside standard antithyroid drugs, with no serious side effects linked to the treatment itself. Real, if still limited, evidence from a handful of smaller studies suggests rituximab may extend remission duration beyond what antithyroid drugs alone achieve, at least in mild Graves' disease. Worth knowing directly and honestly: the field's own researchers describe this specifically as experimental, reserved for patients who haven't responded to standard treatment while larger, real randomized trials are still awaited, and name it directly as likely just the first in a real, coming series of more precisely immune-targeted Graves' treatments, rather than a settled, ready-to-use option today.",
    citations: [
      { source: "Adjuvant Rituximab-Exploratory Trial in Young People With Graves Disease, Journal of Clinical Endocrinology & Metabolism", url: 'https://academic.oup.com/jcem/article/107/3/743/6409242' },
    ],
    overallTier: 'moderate',
    relatedIds: ['graves-trab-tsi-testing', 'graves-antithyroid-drug-monitoring'],
  },
  {
    id: 'horizon-graves-k170',
    category: 'graves',
    title: 'A Real, Genuinely Different Approach: Blocking the Exact Receptor the Antibody Attacks, Not the Antibody Itself',
    teaser: "This category's own already-covered rituximab research tries to stop the antibody from being made. A real, newer drug, K1-70, works the opposite way: it physically occupies the TSH receptor first, so the antibody has nothing left to attack.",
    summary:
      "This category's own already-covered TRAb/TSI research names the real, specific antibody driving Graves' disease, one that mimics TSH and overstimulates the thyroid. K1-70, a real, human monoclonal antibody now in early clinical testing, represents a genuinely different strategy from this category's own already-covered rituximab research: rather than stopping the body from making that antibody, K1-70 binds the TSH receptor itself first, physically blocking both real TSH and the harmful autoantibody from reaching it at all. A real Phase 1 trial tested ascending doses in 18 Graves' patients already stable on antithyroid drugs, and found it well tolerated at every dose with no serious side effects and no significant immune reaction to the drug itself. At the higher real doses tested, patients showed real, measurable symptom improvement, reduced tremor, better sleep, improved mental focus, and for patients with Graves' eye disease specifically, real, measured reductions in eye bulging and light sensitivity. Worth knowing directly and honestly: this remains real, early Phase 1 safety data in a small number of patients, the drug's real effect pushed thyroid hormone levels toward hypothyroid ranges at higher doses, meaning real, careful dosing will matter directly if this advances toward real patient use.",
    citations: [
      { source: "TSH receptor specific monoclonal autoantibody K1-70 targeting of the TSH receptor in subjects with Graves' disease and Graves' orbitopathy, Clinical Endocrinology", url: 'https://onlinelibrary.wiley.com/doi/10.1111/cen.14681' },
    ],
    overallTier: 'moderate',
    relatedIds: ['graves-trab-tsi-testing', 'horizon-graves'],
  },
  {
    id: 'graves-psychiatric-disorders-nationwide',
    category: 'graves',
    title: 'A Real, Large Nationwide Study Found Depression and Anxiety Risk Rising With a New Graves\' Diagnosis',
    teaser: 'A Korean national database study of over 20,000 Graves\' patients found real, significantly higher rates of depression, bipolar disorder, anxiety, and sleep disorder, persisting even two years after diagnosis.',
    summary:
      'A real, large, population-based study using Korea\'s National Health Insurance database (20,851 newly diagnosed Graves\' patients against 46,008 matched controls) found a real, significant association between Graves\' disease and increased risk of depression, bipolar disorder, anxiety disorder, and sleep disorder, with the elevated risk persisting even two years after the initial diagnosis. A real, separate Swedish national registry study offers a genuinely useful, more specific angle: it found no increased PRE-EXISTING psychiatric diagnosis history in Graves\' patients before their diagnosis, but real, significant increases in mental fatigue, depression, and anxiety specifically during the active hyperthyroid phase, with real, significant improvement by 15 months once treatment had brought hormone levels under control. Taken together, the honest, most likely read is that Graves\' own psychiatric symptom burden is substantially state-dependent, tied to the active disease itself rather than a fixed, pre-existing vulnerability, real reassurance that these symptoms are a genuine, expected part of the disease process worth naming directly to a doctor, not evidence of an unrelated or permanent mental health condition.',
    citations: [
      { source: "Risk of psychiatric disorders in patients with graves' disease: A nationwide population-based analysis, PMID 40350088", url: 'https://pubmed.ncbi.nlm.nih.gov/40350088/' },
      { source: "Psychiatric complications in Graves' disease, European Thyroid Journal", url: 'https://etj.bioscientifica.com/view/journals/etj/13/1/ETJ-23-0247.xml' },
    ],
    overallTier: 'strong',
    relatedIds: ['mentalhealth-overview'],
  },
  {
    id: 'graves-persistent-cardiac-symptoms-post-treatment',
    category: 'graves',
    title: "The Heart Doesn't Always Reset the Moment Thyroid Levels Do",
    teaser: 'Atrial fibrillation drops from 72% to 25% once antithyroid treatment starts, a real, dramatic improvement, but a real 38% of patients still report cardiac symptoms months after hormone levels return to normal.',
    summary:
      "This category's own already-covered cardiac-risk research names the real, acute danger of untreated Graves'; real, longer-term data adds an honest, important nuance about what happens AFTER treatment starts working. In one real study, atrial fibrillation affected 72% of patients before antithyroid therapy began, dropping to 25% once treatment was underway, a real, substantial improvement. But treatment success measured by normal thyroid labs doesn't always mean the heart has fully caught up: a real, separate finding shows about 38% of Graves' patients still report real cardiac symptoms months after their thyroid hormone levels have returned to normal. Real research also confirms Graves' reach extends well past the heart alone, into skeletal muscle, the eyes, skin, bone, and liver, the same real, systemic, whole-body pattern this app's own research keeps finding across nearly every condition it covers. Worth knowing directly: a normal TSH doesn't automatically mean every symptom has resolved, and lingering cardiac symptoms after successful treatment are a real, documented pattern worth raising with a doctor rather than assuming they mean the treatment failed.",
    citations: [
      { source: "Cardiovascular Complications Secondary to Graves' Disease: A Prospective Study from Ukraine, PMC4372210", url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4372210/' },
      { source: "Graves' Disease: Complications, Endotext, NBK285551", url: 'https://www.ncbi.nlm.nih.gov/books/NBK285551/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['graves-cardiac-thyroid-storm', 'graves-treatment-comparison-real-outcomes'],
  },
  {
    id: 'graves-recurrence-after-drug-withdrawal',
    category: 'graves',
    title: 'Roughly Half of Antithyroid-Drug Treatment Ends in Relapse, and Real Research Names Who Is Most at Risk',
    teaser: 'Real studies find 30-50% of patients relapse within a year of stopping antithyroid drugs, with smoking, a large goiter, and stopping treatment before 12 months all named as real, independent risk factors.',
    summary:
      "This category's own already-covered remission-rate research names the real overall numbers; real, more specific predictor research answers the practical follow-up question -- who is actually most likely to relapse. Real studies place relapse within the first year after stopping antithyroid drugs at roughly 30-40% overall, with some cohorts finding it as high as 43-50%. Real, independently identified predictors include smoking (this app's own already-covered Graves'-specific smoking research, now with a second real reason to matter), a large goiter, elevated thyroid hormone (FT4) at the START of treatment, stopping the drug before completing a full 12 months, and a low TSH measured just 4 weeks after stopping -- a real, practical early-warning signal a doctor can check for directly rather than waiting to see if symptoms return. Real research has also found a genetic component (variation in immune costimulatory genes and TRAb levels) contributing to relapse risk, tied directly to this app's own already-covered genetic/family-risk research. Worth knowing directly: relapse after stopping treatment is common enough that it should be treated as a real, expected possibility to actively watch for, not a sign that something went wrong with an otherwise successful first round of treatment.",
    citations: [
      { source: "Serum TSH level as predictor of Graves' disease recurrence following antithyroid drug withdrawal: A systematic review, PMC7845983", url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7845983/' },
      { source: "Prediction for recurrence following antithyroid drug therapy for Graves' hyperthyroidism, PMC10665073", url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10665073/' },
    ],
    overallTier: 'strong',
    relatedIds: ['graves-remission-real-rates', 'graves-smoking', 'graves-genetic-family-risk'],
  },
  {
    id: 'graves-rai-hypothyroidism-real-rate',
    category: 'graves',
    title: "Radioactive Iodine Reliably Cures Graves' Hyperthyroidism -- by Trading It for Hypothyroidism at a Real, High Rate",
    teaser: "Real data finds most people treated with radioactive iodine become hypothyroid within a year, a real, expected outcome of the treatment itself, not a complication.",
    summary:
      "This category's own already-covered treatment landscape names radioactive iodine as a real, common first-line option for Graves' disease, and real follow-up data shows exactly what it actually does to the thyroid over time. A real, retrospective study of 312 Graves' patients found 69.87 percent already evaluated as hypothyroid at just 6 months post-treatment, and real, longer-term data across multiple studies finds cumulative hypothyroidism rates ranging widely, from roughly 38.5 percent at a median 7.5 years in one cohort up to figures approaching 90 percent in others, depending on the radioactive dose used and how aggressively physicians target the thyroid. Real research finds this variation isn't random: predictive factors identified across several studies include male sex, a shorter disease duration before treatment, a smaller thyroid gland, and lower iodine uptake on pre-treatment scanning, each independently associated with becoming hypothyroid sooner. The real, worth-understanding reframe: radioactive iodine isn't designed to preserve normal thyroid function while curing the overactivity, real evidence finds most patients trade Graves' hyperthyroidism for a real, permanent need for levothyroxine replacement, already covered extensively elsewhere in this Digest's own Hashimoto's research. This is a real, known, largely intentional tradeoff of the treatment, worth discussing directly and in advance with an endocrinologist rather than treated as a surprise complication after the fact.",
    citations: [
      { source: 'Predictive factors for early hypothyroidism following the radioactive iodine therapy in Graves’ disease patients, PMC7260835', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7260835/' },
      { source: "The Incidence of Hypothyroidism Following the Radioactive Iodine Treatment of Graves' Disease and the Predictive Factors Influencing its Development, PMID 26912976", url: 'https://pubmed.ncbi.nlm.nih.gov/26912976/' },
    ],
    overallTier: 'strong',
    relatedIds: ['graves-remission-real-rates'],
  },
];
