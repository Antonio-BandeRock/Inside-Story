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
    teaser: 'The most common cause of an overactive thyroid, and a distinct disease with its food and lifestyle evidence base.',
    summary: "Graves' disease is the most common cause of hyperthyroidism, an overactive thyroid, and it's autoimmune: the body's own immune system makes an antibody (called TSI or TRAb, covered in full below) that binds to and stimulates the same receptor TSH normally uses, driving the thyroid to overproduce hormone. That's a structurally different mechanism from an antibody that attacks and gradually destroys thyroid tissue, and it means several findings here, smoking's effect, iodine's role, even some of the same nutrients, land differently for Graves' than they do for other thyroid conditions covered elsewhere. Diet won't cure Graves' disease, and nothing here replaces an endocrinologist's treatment plan. What follows is what the actual research supports, kept honest about how strong each finding really is.",
    citations: [
      { source: "Graves' Disease, National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK)", url: 'https://www.niddk.nih.gov/health-information/endocrine-diseases/graves-disease' },
    ],
    overallTier: 'strong',
    relatedIds: ['graves-smoking', 'calcium-toxicity-hypercalcemia', 'calcium-deficiency-hypocalcemia'],
  },
  {
    id: 'graves-iodine',
    category: 'graves',
    title: "Iodine and Graves': A Trigger, and a Complication for Treatment Too",
    teaser: 'Excess iodine can trigger Graves\' in the first place, and separately can work against the very drugs used to treat it, two different reasons it matters here.',
    summary:
      "Iodine has a two-edged reputation for thyroid health generally, and it cuts its specific way for Graves'. Excess iodine intake is a documented trigger for Graves' disease itself, and people previously treated with antithyroid drugs, or with a prior iodine deficiency, are especially prone to developing iodine-induced hyperthyroidism when iodine intake rises. Separately, if antithyroid drug treatment is already underway, excess iodine in someone actively being treated for Graves' can reduce how well those drugs actually work. The nuance: this isn't a case for iodine avoidance at any cost. Research also finds adequate (not excessive, not deficient) iodine intake tracks with better remission rates and better long-term control than either too little or too much, making this a Goldilocks nutrient here, not a simple \"avoid it\" rule.",
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
    title: 'Selenium Improved Mild Graves\' Eye Disease in a Landmark Trial',
    teaser: 'A double-blind, placebo-controlled trial in 159 patients found a measured improvement, with one limit.',
    summary:
      "A landmark randomized, double-blind, placebo-controlled trial gave 159 patients with mild Graves' orbitopathy (the eye disease that can accompany Graves') either sodium selenite (100 micrograms twice daily) or a placebo for six months, then followed everyone for another six months after stopping. The selenium group showed measured improvement in both eye-disease severity and disease-specific quality of life, and those gains held up even after supplementation ended. That's a strong result for a specific population: mild orbitopathy. The honest limit is: later trials across different selenium-status populations and disease severities have found inconsistent results, and what selenium actually does for moderate-to-severe orbitopathy specifically remains an open question the evidence hasn't settled yet.",
    citations: [
      { source: "Selenium and the Course of Mild Graves' Orbitopathy, New England Journal of Medicine", url: 'https://www.nejm.org/doi/full/10.1056/NEJMoa1012985' },
      { source: "Efficacy of Selenium Supplementation in Graves' Orbitopathy: A Systematic Review and Meta-Analysis of Randomized Controlled Trials with Trial Sequential Analysis", url: 'https://pubmed.ncbi.nlm.nih.gov/42355878/' },
    ],
    overallTier: 'strong',
    relatedIds: ['graves-selenium-orbitopathy-5year-honest-followup'],
  },
  {
    id: 'graves-smoking',
    category: 'graves',
    title: 'Smoking Is One of the Strongest Documented Risk Factors for Graves\' Eye Disease',
    teaser: "A meta-analysis of 56 studies found smoking significantly raises the risk of thyroid eye disease, with the risk rising further for every additional cigarette.",
    summary: "Smoking is well-established as harmful in nearly every way, and for Graves' disease specifically it carries a well-documented, dose-dependent risk. A meta-analysis covering 56 studies found smoking (current or past) significantly raises the risk of thyroid eye disease, and an earlier, large meta-analysis found the association even sharper for Graves' ophthalmopathy than for Graves' disease alone. The risk rises with each additional cigarette smoked per day, and even partial smoking reduction appears to lower risk somewhat. It lands differently for different thyroid conditions: the Hashimoto's research documents a separate, counterintuitive finding that smoking tracks with LOWER risk of developing Hashimoto's thyroiditis specifically. The two findings aren't in tension with each other; they're two different diseases with two different relationships to the same habit. This is one of the clearest, most direct reasons smoking-cessation counseling belongs as a named part of Graves' treatment, not just general health advice repeated out of habit.",
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
    title: 'Methimazole & PTU Need Specific Monitoring, Not Just a Watch-and-Wait',
    teaser: 'Two serious risks, agranulocytosis and liver injury, each with its specific warning signs before starting either drug.',
    summary:
      "Methimazole and propylthiouracil (PTU) are the two main antithyroid drugs used to control Graves' disease, and both carry two specific, if uncommon, serious risks. Agranulocytosis, a dangerous drop in infection-fighting white blood cells, occurs in an estimated 0.2 to 0.5% of patients on either drug, and for methimazole specifically the risk rises with dose: from about 0.13% at 10mg/day up to about 0.47% at 30mg/day. The actionable warning signs are sore throat, fever, chills, or infections of the gums or skin, reasons to stop the drug and seek care immediately, not wait it out. Liver injury is the second risk, and the two drugs differ here in an important way: methimazole's liver risk is generally lower and can be caught through routine liver-function monitoring, but PTU's liver injury can come on rapidly and unpredictably enough that routine bloodwork isn't reliably protective, meaning symptoms (fatigue, nausea, loss of appetite, fever, sore throat) are the trigger to stop PTU immediately and get liver function and a white blood cell count checked, not a scheduled lab visit.",
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
    title: 'TRAb & TSI Antibody Testing: Numbers That Predict Remission and Relapse',
    teaser: 'Not just a diagnostic checkbox. A single antibody level, tracked over time, gives quantified odds of what happens next.',
    summary: "TRAb (TSH-receptor antibody) and TSI (thyroid-stimulating immunoglobulin) testing does more in Graves' disease than most antibody tests do elsewhere: it doesn't just confirm the diagnosis, it carries quantified prognostic weight. At diagnosis, sensitivity and specificity for confirming Graves' run in the upper 90s. More useful for someone already being treated: a baseline TRAb level below 10 IU/L tracks with a 63% remission rate on antithyroid drugs, compared to 39% for people above that threshold, and higher levels (above 15 IU/L) track with a higher chance of the drug taking longer than six months to bring the disease under control. The single most actionable number in this whole entry: whether TSAb is still positive at the moment antithyroid drugs are stopped predicts relapse directly, 79% relapse with a positive result at withdrawal versus 33% with a negative one, a six-fold difference in risk. Ask for this test not just once at diagnosis, but specifically again before any conversation about stopping antithyroid drug treatment.",
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
    teaser: 'A quantified bone-density loss, and a documented reason it doesn\'t fully reverse the moment thyroid levels normalize.',
    summary:
      "Excess thyroid hormone speeds up the normal bone-remodeling cycle, tipping the balance toward faster bone breakdown than bone formation can keep up with. In untreated hyperthyroidism, this is a measured effect, not a theoretical one: bone mineral density can run 10 to 15% lower in the spine and hip compared to someone with normal thyroid function. This complicates the usual assumption that getting thyroid levels back to normal automatically fixes it: TRAb, the same antibody covered above, appears to keep driving bone loss on its own even after someone reaches a euthyroid (normal thyroid hormone) state, contributing to a further 8 to 12% reduction in bone density independent of hormone levels themselves. A DEXA (bone density) scan is the direct way this gets checked, a reasonable thing to ask for given a history of hyperthyroidism, not assumed unnecessary just because current labs look normal. For anyone with confirmed bone loss, bisphosphonate medications are an evidence-supported option worth discussing directly.",
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
    title: "Beta-Blockers: Symptom Relief While the Underlying Disease Is Still Being Treated",
    teaser: 'A racing heart, tremor, and anxiety from excess thyroid hormone can be controlled directly, on a completely separate timeline from the thyroid itself getting better.',
    summary:
      "Propranolol and similar beta-blockers don't treat Graves' disease itself, and don't lower thyroid hormone levels at all. What they do is real and useful in the meantime: they block many of the immediate, uncomfortable symptoms of excess thyroid hormone, rapid heart rate, tremor, anxiety, heat intolerance, while antithyroid drugs or another definitive treatment work on the actual underlying cause, which typically takes weeks to bring hormone levels down meaningfully. This is worth knowing as a deliberate two-track approach rather than confusion about why a second medication is needed at all: one drug (methimazole or PTU) treats the disease, the other (a beta-blocker) manages how it feels while that first drug takes effect. Beta-blockers are typically tapered off once thyroid hormone levels have normalized, not continued indefinitely once they're no longer doing work.",
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
    teaser: 'A practical food-timing fact for anyone actually scheduled for this common treatment option, not a hypothetical.',
    summary:
      "Radioactive iodine (RAI) is a common, often definitive treatment for Graves' disease, working because the thyroid naturally concentrates iodine, letting a radioactive form selectively target overactive thyroid tissue. That same mechanism is exactly why diet timing matters directly beforehand. A low-iodine diet in the days to weeks leading up to RAI treatment is a standard part of preparation, since a thyroid already saturated with dietary iodine has less room to take up the radioactive form, blunting how well the treatment actually works. This is a time-limited, medically-directed dietary step, not a general Graves' eating rule, and the specific timeline and restriction level should come directly from whoever is administering the treatment rather than assumed from general iodine-avoidance advice found elsewhere.",
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
    teaser: 'A strong, dose-dependent smoking risk, a Goldilocks nutrient, and three specific self-advocacy numbers.',
    summary: "Line up everything in this category and Graves' reads as a distinct disease with its directly useful evidence. Smoking is a strong, dose-dependent risk factor for Graves' eye disease specifically, one of the clearest reasons anywhere that cessation counseling belongs as named part of treatment. Iodine is a trigger, and separately can undermine antithyroid drug efficacy, with adequate (not excess, not deficient) intake giving the best real-world outcomes, a true Goldilocks nutrient here. Selenium carries strong trial evidence for mild eye disease, a usable finding, though not yet settled for more severe cases. The three self-advocacy entries in this category carry unusually precise, quantified numbers: TRAb/TSI testing gives percentage odds for both remission and relapse, antithyroid drugs need specific, named warning signs watched for rather than a vague sense of caution, and untreated hyperthyroidism's measured bone loss is worth a DEXA scan, not assumed to fully resolve just because thyroid levels normalize.",
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
    title: "Antithyroid Drug Remission: Quantified Odds by Treatment Length and Risk Factors That Lower Them",
    teaser: 'A standard 12-18 month course puts remission odds around 30-40%. Extending treatment to 24-36 months raises that to roughly 50%, a direct, actionable tradeoff.',
    summary: "Before starting antithyroid drug treatment, Graves' disease has a quantified remission timeline. A standard 12-18 month course of methimazole or carbimazole (already covered in the medication research) puts remission (normal thyroid levels maintained for at least a year after stopping the drug) at roughly 30-40%. Extending treatment to 24-36 months raises remission odds to roughly 50%, climbing further to 60% in people with smaller goiters. Specific risk factors independently lower those odds: smoking, being a young male, and having very high TSH-receptor antibody levels at diagnosis all track with remission rates falling below 20%. For anyone who relapses after a first course, data shows a second course still carries value, a 54.1% remission rate in one cohort. Worth raising directly with an endocrinologist: how long a specific treatment course is planned for, and whether any of these risk factors apply, since they meaningfully change the odds of avoiding radioactive iodine or surgery down the line.",
    citations: [
      { source: "Long-term follow-up result of antithyroid drug treatment of Graves' hyperthyroidism in a large cohort, European Thyroid Journal", url: 'https://etj.bioscientifica.com/view/journals/etj/12/2/ETJ-22-0226.xml' },
    ],
    overallTier: 'strong',
    relatedIds: ['graves-trab-tsi-testing'],
  },
  {
    id: 'graves-cardiac-thyroid-storm',
    category: 'graves',
    title: "Untreated Graves' Carries Serious Cardiac Risk, Up to and Including a Rare but Life-Threatening Emergency",
    teaser: 'Atrial fibrillation in up to 22% of hyperthyroid patients, and thyroid storm, rare but carrying a 10-20% mortality rate even with hospital treatment.',
    summary:
      "Excess thyroid hormone has a direct, and serious effect on the heart, beyond the general \"racing heart\" symptom most people associate with hyperthyroidism. Research finds atrial fibrillation, an irregular heart rhythm carrying its stroke risk, occurs in 9-22% of hyperthyroid patients overall, and in 5-15% of those over 60 specifically. Left untreated long enough, Graves' can progress to high-output cardiac failure, the heart unable to keep pace with the metabolic demand excess thyroid hormone creates. The single most serious, rare complication is thyroid storm, a sudden, massive release of thyroid hormone that is a medical emergency: it affects roughly 1-2% of people hospitalized for thyrotoxicosis, and even with aggressive hospital treatment, carries a 10-20% overall mortality rate, rising to roughly 75% specifically among those who don't survive to full recovery. Documented triggers include infection, surgery, and, notably, an actual COVID-19 infection in at least one recent case report. This is the direct reason Graves' disease isn't a condition to leave untreated or undertreated even when symptoms feel manageable day to day.",
    citations: [
      { source: "Graves' Disease, StatPearls, NCBI Bookshelf", url: 'https://www.ncbi.nlm.nih.gov/sites/books/NBK448195/' },
    ],
    overallTier: 'strong',
    relatedIds: ['graves-bone-density'],
  },
  {
    id: 'graves-history-milestones',
    category: 'graves',
    title: "Graves' Disease's Own History: Named After a Man Who Wasn't Actually First to Describe It",
    teaser: '1786, 1835, 1941, a quietly interesting historical footnote (the disease is named for the second person to report it, not the first), and a wartime-era treatment breakthrough.',
    summary:
      "Graves' disease carries a slightly ironic naming history: Caleb Hillier Parry first documented a case of hyperthyroidism with goiter in 1786, but his own report wasn't published until 1825, ten years after his death. Robert Graves published his own now-famous description in 1835 (palpitations, goiter, and exophthalmos, the bulging-eye sign, in three women), and the disease carries his name rather than Parry's purely because of publication timing, not who actually saw it first. Early 20th-century treatment options were limited to surgery (initially crude: injecting hot water into the thyroid, then artery ligation, then partial removal) since neither antithyroid drugs nor radioactive iodine existed yet. The defining treatment breakthrough came in 1941, when Saul Hertz first used radioactive iodine (I-131) to treat Graves' patients, a direct outgrowth of nuclear-medicine research becoming available in that same wartime era; by 1946, radioactive iodine treatment was widely available, and remains one of the three standard treatment options (alongside antithyroid drugs and surgery) used today.",
    citations: [
      { source: "Management of Graves' Hyperthyroidism: More Than a Century of Progression", url: 'https://brieflands.com/journals/ijem/articles/103943' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'graves-pregnancy-fetal-thyrotoxicosis',
    category: 'graves',
    title: "A Counterintuitive Pregnancy Risk: A Mother's Own TRAb Antibodies Can Cause Fetal Thyrotoxicosis Even After SHE Has Become Hypothyroid",
    teaser: "TRAb antibodies cross the placenta independent of the mother's own current thyroid hormone level, meaning a mother made hypothyroid by past radioactive-iodine treatment can still, rarely, cause her own baby's thyroid to run too fast.",
    summary: "This is a surprising finding, relevant if pregnancy is being planned after any past Graves' treatment: TRAb (TSH-receptor antibody), the same antibody already covered in the self-advocacy research, crosses the placenta and can stimulate the FETUS's thyroid independent of what the mother's own current thyroid hormone level actually is. That means even a mother made hypothyroid by earlier radioactive-iodine treatment or surgery can, in documented if rare cases, still carry high enough TRAb levels to cause fetal or neonatal thyrotoxicosis. Research finds this happens in up to 5% of pregnancies in mothers with a Graves' history, with a serious 12-20% mortality rate when it occurs, mainly from fetal heart failure. TRAb crossing becomes most consequential in the second half of pregnancy, when placental passage increases and the fetal thyroid has matured enough to actually respond to it. The practical takeaway: TRAb levels, not just the mother's own TSH/T4, need monitoring throughout a pregnancy with any Graves' history, and continued fetal surveillance (heart rate, ultrasound) is recommended regardless of how low a mother's own antibody titer currently reads.",
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
    title: 'A Twin Study Found Genetics Explains Roughly 80% of Who Develops Graves\' Disease',
    teaser: 'Family and twin research points to a strong inherited component behind Graves\', anchored around specific, named genes already tied to immune regulation, relevant for anyone with a close relative who has it.',
    summary: "Graves' disease carries a substantial inherited risk component, not just a loosely observed family tendency. A twin study found approximately 80% of susceptibility to Graves' disease attributable to genetic factors, with more recent estimates placing genetics at 60-80% of overall disease risk through a polygenic pattern rather than one single gene. The best-characterized genetic contributors involve the HLA immune-recognition complex, particularly the HLA-DR3 haplotype, alongside CTLA-4 (a gene that normally acts as a brake on T-cell activation) and PTPN22, both independently studied immune-regulation genes with a documented statistical association to Graves' risk. This connects directly to an already-established parallel already covered elsewhere: Hashimoto's heritability research draws on the same kind of twin-study and shared-gene evidence (including CTLA-4), and Graves' and Hashimoto's are themselves two opposite-direction autoimmune thyroid diseases that can run in the same families, sometimes even in the same person at different points in life. Having a close relative with Graves', or with another autoimmune thyroid condition, is a genetics-backed reason to watch for symptoms and consider a thyroid panel (already covered in the self-advocacy research) earlier rather than waiting for a family history to feel coincidental.",
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
    title: 'A Meta-Analysis Confirms Stressful Life Events Trigger Graves\' Disease Onset in Susceptible People',
    teaser: 'A 13-study meta-analysis of nearly 2,900 people found stressful life events tied to Graves\' onset, strongest in younger patients and in women, and one small study even found stress-relief training leading to disease remission.',
    summary: "Major life stress is an independently studied, and increasingly well-supported environmental trigger for Graves' disease onset, not just a folk belief. A current systematic review and meta-analysis (13 studies, 2,892 subjects across nine countries) found stressful life events associated with Graves' disease onset specifically in people already carrying the genetic susceptibility already covered in the genetic/family-risk research, evidence this is a gene-environment interaction rather than stress acting alone. The association was found stronger in samples with more female patients and in younger patients, matching Graves' disease's well-documented demographic pattern. A separate, smaller study found newly diagnosed Graves' patients reported significantly more stressful life events in the 12 months before diagnosis than matched controls. Striking: a small study (11 participants) whose Graves' disease developed after acute emotional distress found stress-relief training itself leading to disease remission in that group, a real, if preliminary, hint that addressing the stress response directly might have therapeutic value alongside standard antithyroid treatment, not proof of a stand-alone cure. This connects straight to the already-covered HPA-axis/cortisol research built for other conditions, additional evidence that chronic stress management belongs in a Graves' management plan, not just symptom control through medication alone.",
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
    title: 'Teprotumumab: A Targeted Biologic That Reverses Thyroid Eye Disease, Not Just Manages It',
    teaser: 'A landmark trial found teprotumumab produced a treatment response in 69% of patients versus 20% on placebo, with measured eye bulging (proptosis) shrinking by an average of 2.46mm, a structural reversal most prior treatments couldn\'t achieve.',
    summary: "Teprotumumab (brand name Tepezza) represents a different kind of treatment for thyroid eye disease (the same active Graves' orbitopathy already covered in the selenium-orbitopathy research) than anything available before it. Rather than just managing symptoms, landmark trial data found teprotumumab produced a treatment response, measured improvement in eye protrusion plus at least one other clinical marker, in 69% of patients at 24 weeks, compared to just 20% on placebo. The structural change was substantial: proptosis (the actual forward bulging of the eye) decreased by an average of 2.46mm in the treated group versus just 0.15mm on placebo, a measurable physical reversal rather than symptom masking. Longer-term follow-up across multiple trials confirmed the benefit held up over time, including in patients re-treated after their disease returned. This is a newer and more effective option, but it isn't risk-free, research finds a higher rate of adverse events with teprotumumab than placebo, including gastrointestinal reactions, muscle spasms, and documented cases of hearing changes, worth discussing directly and thoroughly with an ophthalmologist and endocrinologist together before starting. Anyone with active, moderate-to-severe thyroid eye disease not adequately controlled by the selenium and standard measures already covered elsewhere in the Graves' research has an evidence-backed reason to ask specifically about teprotumumab by name.",
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
    title: 'Block-and-Replace vs. Titration: Two Roughly Equally Effective Ways to Dose Antithyroid Medication',
    teaser: 'Research finds combining a fixed high-dose antithyroid drug with levothyroxine (block-and-replace) works about as well as the more common titrating-dose approach, with the practical benefit of fewer clinic visits and blood draws.',
    summary: "Antithyroid drug treatment for Graves' disease has two established dosing strategies, and comparative research finds them roughly equally effective at achieving a euthyroid (normal thyroid function) state, a useful thing to know when discussing treatment options with an endocrinologist. The titration regime, the more commonly used approach, involves gradually adjusting antithyroid drug dose alone based on frequent blood testing. The block-and-replace regime instead uses a fixed, higher dose of antithyroid drug combined with levothyroxine (already covered in the Hashimoto's medication research, used here for a different purpose) to prevent the person from becoming hypothyroid from the higher antithyroid dose. Research finds no statistically significant difference between the two in achieving euthyroid status, and no significant difference in the incidence of overt hypothyroidism or in rare serious side effects like agranulocytosis or liver toxicity. The practical, everyday-life difference: block-and-replace requires measurably fewer thyroid function tests and clinic visits per year than the titration regime, a convenience advantage for someone who finds frequent blood draws and appointments burdensome. Neither approach is definitively better, both are legitimate options, and this is a worth-raising conversation with a prescriber about which regimen better fits someone's own real-life logistics and testing tolerance, not just which one is more commonly defaulted to.",
    citations: [
      { source: 'Block-and-replace vs. Titration antithyroid drug regimen for Graves\' hyperthyroidism: two is not always better than one, PMID 33000387', url: 'https://pubmed.ncbi.nlm.nih.gov/33000387/' },
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
    title: 'Subclinical Hyperthyroidism: Meaningful Risk Even Before Symptoms Show Up',
    teaser: 'A low but not "zero" TSH with normal T4/T3 still carries a documented risk of atrial fibrillation, heart failure, higher mortality, and lower bone density, even without overt Graves\' symptoms.',
    summary: "Subclinical hyperthyroidism, a low TSH with T4 and T3 levels still testing within the normal range, is worth knowing about directly as a distinct risk category, not something to dismiss just because it hasn't progressed to the overt disease already covered in depth elsewhere in the Graves' research. Pooled research finds subclinical hyperthyroidism associated with coronary heart disease, total mortality, and CHD-specific mortality. Research finds this risk particularly pronounced at a specific threshold, a TSH at or below 0.1 mU/L carries the strongest documented association with atrial fibrillation, and research finds subclinical hyperthyroidism independently tied to increased risk of atrial fibrillation and heart failure in older adults specifically. Research finds a bone-health cost too, decreased bone mineral density, with a documented history of hyperthyroidism (even subclinical) an independent risk factor for hip and vertebral fracture (a 1.8-fold relative risk). Research finds emerging evidence supporting treatment specifically for TSH under 0.1 mIU/L, particularly in older adults and those at high cardiovascular or bone-fracture risk, though research also finds no long-term, definitive trial yet proving treatment itself reduces these downstream risks. This is a worth-raising conversation for anyone whose lab work shows a low TSH with otherwise \"normal\" thyroid hormone levels, ongoing monitoring and a risk-benefit conversation about treatment matter here, not just watching and waiting indefinitely.",
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
    title: 'High-Dose Biotin Can Fake a Positive Graves\' Antibody Test Result, a Documented Diagnostic Trap',
    teaser: 'Research finds biotin supplements can interfere with the exact TRAb/TSI antibody tests already covered in the Graves\' self-advocacy research, producing a misleading lab pattern identical to Graves\' disease itself.',
    summary: "High-dose biotin supplements carry a well-documented, and important risk of distorting the TRAb/TSI antibody testing already covered in the Graves' self-advocacy research, since it can lead to a misdiagnosed case of Graves' disease that isn't actually there. Research finds biotin specifically interferes with the detection of anti-thyrotropin (TSH-receptor) antibodies, and case reports document this producing a laboratory pattern that looks identical to Graves' disease. The underlying mechanism ties to how most commercial thyroid assays work: they rely on a biotin-streptavidin binding system, and excess biotin in the blood can either falsely lower or falsely raise a given test's result depending on the specific assay design, competitive assays (like T3/T4) tend to read falsely HIGH with excess biotin, while sandwich assays (like TSH itself) tend to read falsely LOW. Current American Thyroid Association guidance recommends stopping biotin supplementation for at least 2 days before any thyroid lab test, the Labs & Medication Timing category already covers this same interference for Hashimoto's; it applies with equal, direct relevance here for anyone on biotin considering testing for Graves' antibodies specifically. A surprising or unexpected positive TRAb/TSI result in someone taking high-dose biotin (common in hair/skin/nail supplements) is a real reason to retest after stopping the supplement before accepting the result as a Graves' diagnosis.",
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
    title: 'Long-Term Outcomes Compared: Surgery, Radioactive Iodine, and Antithyroid Drugs Aren\'t Interchangeable',
    teaser: 'A long-term study found patients treated with thyroidectomy as their first treatment had lower rates of death, heart disease, and diabetes over time than those treated with radioactive iodine or antithyroid drugs alone.',
    summary: "Graves' disease has three distinct first-line treatment paths, already covered individually across the research (antithyroid drugs, radioactive iodine, and thyroidectomy), and direct, long-term comparative research finds real differences in outcomes between them. A large comparative study found patients treated with surgery as their initial treatment had a lower long-term risk of all-cause mortality, cardiovascular disease, atrial fibrillation, psychological disease, diabetes, and hypertension compared to those treated first with antithyroid drugs or radioactive iodine. Separate cost-effectiveness research found total thyroidectomy more cost-effective than radioactive iodine specifically for patients who can't tolerate or don't respond to antithyroid drugs, quality-adjusted-life-year data favoring surgery (23.6 vs. 20.9 QALYs). Research finds radioactive iodine's overall success rate variable, 60.7% in one study of young adults, with larger thyroid size and longer disease duration both identified risk factors for treatment failure requiring a second round. Research also finds long-term, continuous antithyroid drug treatment (rather than the standard fixed-course approach) achieving substantially higher sustained remission, a real alternative to the usual time-limited course. This is comparative evidence worth bringing directly into a treatment-choice conversation with an endocrinologist, no single option is universally best, and the tradeoffs (surgical risk and recovery vs. Radioactive iodine's variable success rate vs. Antithyroid drugs' own relapse risk) deserve an individualized weighing rather than defaulting to whichever option is most commonly offered first.",
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
    title: 'Graves\' Eye Disease Can Show Up With Completely Normal Thyroid Labs',
    teaser: 'A pooled review found close to 1 in 10 people with thyroid eye disease have normal-functioning or even underactive thyroids, not the overactive one the disease is usually assumed to require.',
    summary:
      "Thyroid eye disease (Graves' orbitopathy) is usually assumed to travel together with overactive thyroid hormone levels, but research finds a genuine, if smaller, exception: a pooled systematic review found the global prevalence of thyroid eye disease broke down to 86.2% with hyperthyroidism, 10.36% with hypothyroidism, and 7.9% with completely normal thyroid function (euthyroid), meaning close to 1 in 10 cases occur without the overactive thyroid hormone levels the condition is usually assumed to require. Research defines this as a distinct entity, orbital inflammation occurring with no current or past thyroid hormone abnormality and no antithyroid treatment, and finds it's still frequently associated with high levels of the same thyroid-stimulating antibody driving Graves' disease itself, even when standard thyroid hormone levels look entirely normal. Euthyroid ophthalmopathy can represent an early stage, with thyroid dysfunction developing later, or it can stay euthyroid throughout. This matters plainly for self-advocacy: eye symptoms (bulging, dryness, double vision, pressure) shouldn't be dismissed as unrelated to Graves' disease just because a recent thyroid panel came back normal, the two don't always move together.",
    citations: [
      { source: 'Prevalence of hyperthyroidism, hypothyroidism, and euthyroidism in thyroid eye disease: a systematic review of the literature, Systematic Reviews 2020, PMID 32873324', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7465839/' },
    ],
    overallTier: 'strong',
    relatedIds: ['graves-teprotumumab-thyroid-eye-disease'],
  },
  {
    id: 'graves-vitamin-d-deficiency-risk',
    category: 'graves',
    title: 'Vitamin D and Graves\' Disease: an Association, With Mixed Evidence on What to Do About It',
    teaser: 'A meta-analysis found Graves\' patients over twice as likely to be vitamin D deficient as healthy controls, but a supplementation trial found no effect on preventing the disease from coming back.',
    summary: "Vitamin D deficiency shows up repeatedly across the autoimmune-disease research, and Graves' disease is no exception, but the evidence here is honestly more mixed than a simple 'take vitamin D' recommendation would suggest. A meta-analysis found people with Graves' disease significantly more likely to be vitamin D deficient than healthy controls (odds ratio 2.24), with one individual study finding a striking gap (64% deficient in Graves' patients versus 30% in controls). A separate prospective study found vitamin D deficiency was NOT associated with actually developing Graves' disease or its eye complications, and a supplementation trial found giving vitamin D didn't prevent Graves' disease from recurring after treatment. Put together, this is an association between having Graves' disease and running low on vitamin D, without solid, evidence yet that the deficiency causes the disease or that correcting it changes the disease's course, the same honest 'correlation, unproven intervention' pattern the research has already found repeating across several other autoimmune conditions. Checking vitamin D status remains reasonable, general health practice, just not, based on current evidence, a specific lever for preventing or reversing Graves' disease itself.",
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
    title: 'Antithyroid Drugs Work the Same Way in Children, but Remission Takes Longer',
    teaser: 'A pooled meta-analysis found remission rates in pediatric Graves\' disease climbing from a 15.5% under 2 years of treatment to 33.0% past 5 years, direct evidence that children need patience with this treatment that adults often don\'t.',
    summary:
      "This category's already-covered antithyroid-drug-monitoring and block-and-replace-versus-titration research is written largely around adult dosing and safety. Pooled evidence finds one important difference specific to children and adolescents: remission takes longer to reach. A pooled meta-analysis found remission rates of 15.5% for treatment courses under 2 years, rising to 24.1% for 2 to 5 years, and 33.0% for courses longer than 5 years, with each additional year of treatment adding a measurable 3.8% increase in the relative likelihood of remission. This is a meaningfully different pattern from adult Graves' treatment, where this category's general remission research already treats a much shorter initial course as standard. A well-documented practical implication follows directly from this data, extending antithyroid drug treatment well past the point an adult might stop is an evidence-backed strategy specifically in pediatric Graves', not simply a slower version of the same adult protocol. This is useful context for a parent or a pediatric endocrinology team weighing how long to continue medication before considering radioactive iodine or surgery, both already covered in this category's treatment-comparison research.",
    citations: [
      { source: "Effect of Antithyroid Drugs Treatment Duration on The Remission Rates of Graves' Disease in Children and Adolescents: A Single-Arm Meta-Analysis and Systematic Review, Clinical Endocrinology 2024, PMID 39501471", url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11694547/' },
    ],
    overallTier: 'strong',
    relatedIds: ['graves-block-replace-vs-titration', 'graves-remission-real-rates'],
  },
  {
    id: 'graves-global-iodine-iceland-denmark',
    category: 'graves',
    title: "A Denmark-vs-Iceland Study Directly Showed Iodine's Effect on Where Graves' Actually Shows Up",
    teaser: "A classic comparative study found Graves' disease in young people more than twice as common in iodine-sufficient Iceland as in iodine-deficient Denmark, while overall thyrotoxicosis ran the opposite direction.",
    summary:
      "A classic comparative study directly tested how iodine intake shapes which specific thyroid condition shows up in a population, comparing East-Jutland, Denmark (low average iodine intake) against Iceland (relatively high iodine intake) over the same period. Graves' disease incidence was measurably higher in iodine-sufficient Iceland (20 per 100,000 per year) than in iodine-deficient Denmark (15 per 100,000 per year), and this difference was most pronounced in younger people, where hyperthyroidism from Graves' disease was more than twice as common in Iceland. The opposite pattern showed up for a different cause of an overactive thyroid: multinodular toxic goiter and single toxic nodules, mostly in people over 50, were substantially more common in iodine-deficient Denmark, meaning total thyrotoxicosis of any cause actually ran higher in the low-iodine region even though Graves' disease specifically ran higher in the high-iodine one. This is direct evidence that a region's iodine status shapes not just how common thyroid disease is, but which specific thyroid disease shows up, and it's a practical reason population iodine intake shouldn't run meaningfully above what's needed to avoid deficiency.",
    citations: [
      { source: "High incidence of multinodular toxic goitre in the elderly population in a low iodine intake area vs. High incidence of Graves' disease in the young in a high iodine intake area, Journal of Internal Medicine, PMID 2040867", url: 'https://pubmed.ncbi.nlm.nih.gov/2040867/' },
    ],
    overallTier: 'strong',
    relatedIds: ['graves-overview', 'lifestyle-global-iodine-china-regional'],
  },
  {
    id: 'graves-dermopathy-pretibial-myxedema',
    category: 'graves',
    title: "Graves' Disease Can Also Show Up on the Skin, a Distinct, Often-Missed Sign",
    teaser: "Pretibial myxedema, a thickened, non-pitting skin change on the shins, affects a minority of Graves' patients overall but climbs to 15% in those who also have eye involvement.",
    summary:
      "Graves' disease is usually discussed for its effects on the thyroid gland and, in this category's already-covered content, the eyes. A third, distinct site is: the skin. Pretibial myxedema (also called Graves' dermopathy), a thickened, non-pitting swelling most often on the front of the shins, affects a 0.5 to 4.3% of Graves' patients overall, historically documented as high as 5% before modern early antithyroid treatment likely reduced how often it progresses to this stage. The meaningful pattern: this prevalence climbs substantially, to 15%, specifically in Graves' patients who also have eye involvement (ophthalmopathy), and a case series found the pretibial area involved in 99% of cases with 96% of patients also having coexisting eye disease, evidence that skin and eye involvement share much of the same underlying immune mechanism rather than occurring independently. A new, unexplained thickened or waxy patch of skin on the shins, especially alongside already-diagnosed Graves' eye disease, is a recognizable, named finding worth mentioning to a doctor directly by name, not a separate, unrelated skin condition.",
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
    teaser: "The US leans toward radioactive iodine as its default Graves' treatment; Europe and Japan both lean toward antithyroid drugs or surgery first, a documented difference in medical culture, not disease severity.",
    summary: "This category's already-covered antithyroid-drug-vs-radioactive-iodine-vs-surgery research assumes an active choice between three valid options, and international data finds that choice made very differently depending on where a person happens to be treated. Radioactive iodine has long been the most commonly used first-line treatment for Graves' disease in the United States, while clinical practice in Europe and Japan more often defaults to antithyroid drugs or surgery instead, a documented difference in medical culture and guideline emphasis, not a difference in how severe Graves' disease itself tends to be in each region. Japanese-specific research continues actively refining combined approaches (radioactive iodine alongside continued antithyroid drugs) rather than treating radioactive iodine as a stand-alone default the way US practice more often does. Someone outside the US reading the already-covered treatment-comparison research should expect their doctor's likely first recommendation to differ from what's most common in US-centered patient discussions, not because their case is different, but because the country they're being treated in has a different default starting point among three options this category already establishes are all valid choices.",
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
    title: "Early Trials Are Testing Whether Depleting the Cells That Make Graves' Antibodies Actually Works",
    teaser: "Rituximab, a B-cell-depleting drug already used elsewhere in the research, is being tested specifically for Graves' disease itself, targeting the exact cells that produce the antibody driving the condition.",
    summary: "This category's already-covered TRAb/TSI antibody research names exactly what drives Graves' disease: an antibody produced by B cells that mimics TSH and overstimulates the thyroid. The logical next step being actively tested: depleting those B cells directly with rituximab, an already-established drug used for other autoimmune conditions covered elsewhere. A Phase 2 trial in young people (ages 12 to 20) with Graves' hyperthyroidism found the treatment well tolerated over 12 months alongside standard antithyroid drugs, with no serious side effects linked to the treatment itself. Real, if still limited, evidence from a handful of smaller studies suggests rituximab may extend remission duration beyond what antithyroid drugs alone achieve, at least in mild Graves' disease. The field's researchers describe this specifically as experimental, reserved for patients who haven't responded to standard treatment while larger randomized trials are still awaited, and name it directly as likely just the first in a coming series of more precisely immune-targeted Graves' treatments, rather than a settled, ready-to-use option today.",
    citations: [
      { source: "Adjuvant Rituximab-Exploratory Trial in Young People With Graves Disease, Journal of Clinical Endocrinology & Metabolism", url: 'https://academic.oup.com/jcem/article/107/3/743/6409242' },
    ],
    overallTier: 'moderate',
    relatedIds: ['graves-trab-tsi-testing', 'graves-antithyroid-drug-monitoring'],
  },
  {
    id: 'horizon-graves-k170',
    category: 'graves',
    title: 'A Different Approach: Blocking the Exact Receptor the Antibody Attacks, Not the Antibody Itself',
    teaser: "This category's already-covered rituximab research tries to stop the antibody from being made. A newer drug, K1-70, works the opposite way: it physically occupies the TSH receptor first, so the antibody has nothing left to attack.",
    summary:
      "This category's already-covered TRAb/TSI research names the specific antibody driving Graves' disease, one that mimics TSH and overstimulates the thyroid. K1-70, a human monoclonal antibody now in early clinical testing, represents a different strategy from this category's already-covered rituximab research: rather than stopping the body from making that antibody, K1-70 binds the TSH receptor itself first, physically blocking both TSH and the harmful autoantibody from reaching it at all. A Phase 1 trial tested ascending doses in 18 Graves' patients already stable on antithyroid drugs, and found it well tolerated at every dose with no serious side effects and no significant immune reaction to the drug itself. At the higher doses tested, patients showed measurable symptom improvement, reduced tremor, better sleep, improved mental focus, and for patients with Graves' eye disease specifically, measured reductions in eye bulging and light sensitivity. This remains early Phase 1 safety data in a small number of patients, the drug's effect pushed thyroid hormone levels toward hypothyroid ranges at higher doses, meaning careful dosing will matter directly if this advances toward patient use.",
    citations: [
      { source: "TSH receptor specific monoclonal autoantibody K1-70 targeting of the TSH receptor in subjects with Graves' disease and Graves' orbitopathy, Clinical Endocrinology", url: 'https://onlinelibrary.wiley.com/doi/10.1111/cen.14681' },
    ],
    overallTier: 'moderate',
    relatedIds: ['graves-trab-tsi-testing', 'horizon-graves'],
  },
  {
    id: 'graves-psychiatric-disorders-nationwide',
    category: 'graves',
    title: 'A Large Nationwide Study Found Depression and Anxiety Risk Rising With a New Graves\' Diagnosis',
    teaser: 'A Korean national database study of over 20,000 Graves\' patients found significantly higher rates of depression, bipolar disorder, anxiety, and sleep disorder, persisting even two years after diagnosis.',
    summary:
      'A large, population-based study using Korea\'s National Health Insurance database (20,851 newly diagnosed Graves\' patients against 46,008 matched controls) found a significant association between Graves\' disease and increased risk of depression, bipolar disorder, anxiety disorder, and sleep disorder, with the elevated risk persisting even two years after the initial diagnosis. A separate Swedish national registry study offers a useful, more specific angle: it found no increased PRE-EXISTING psychiatric diagnosis history in Graves\' patients before their diagnosis, but significant increases in mental fatigue, depression, and anxiety specifically during the active hyperthyroid phase, with significant improvement by 15 months once treatment had brought hormone levels under control. Taken together, the honest, most likely read is that Graves\' own psychiatric symptom burden is substantially state-dependent, tied to the active disease itself rather than a fixed, pre-existing vulnerability, reassurance that these symptoms are an expected part of the disease process worth naming directly to a doctor, not evidence of an unrelated or permanent mental health condition.',
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
    teaser: 'Atrial fibrillation drops from 72% to 25% once antithyroid treatment starts, a dramatic improvement, but a 38% of patients still report cardiac symptoms months after hormone levels return to normal.',
    summary: "This category's already-covered cardiac-risk research names the acute danger of untreated Graves'; longer-term data adds an honest, important nuance about what happens AFTER treatment starts working. In one study, atrial fibrillation affected 72% of patients before antithyroid therapy began, dropping to 25% once treatment was underway, a substantial improvement. But treatment success measured by normal thyroid labs doesn't always mean the heart has fully caught up: a separate finding shows about 38% of Graves' patients still report cardiac symptoms months after their thyroid hormone levels have returned to normal. Research also confirms Graves' reach extends well past the heart alone, into skeletal muscle, the eyes, skin, bone, and liver, the same systemic, whole-body pattern the research keeps finding across nearly every condition it covers. A normal TSH doesn't automatically mean every symptom has resolved, and lingering cardiac symptoms after successful treatment are a documented pattern worth raising with a doctor rather than assuming they mean the treatment failed.",
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
    title: 'Roughly Half of Antithyroid-Drug Treatment Ends in Relapse, and Research Names Who Is Most at Risk',
    teaser: 'Studies find 30-50% of patients relapse within a year of stopping antithyroid drugs, with smoking, a large goiter, and stopping treatment before 12 months all named as independent risk factors.',
    summary: "This category's already-covered remission-rate research names the overall numbers; more specific predictor research answers the practical follow-up question, who is actually most likely to relapse. Studies place relapse within the first year after stopping antithyroid drugs at roughly 30-40% overall, with some cohorts finding it as high as 43-50%. Independently identified predictors include smoking (the already-covered Graves'-specific smoking research, now with a second reason to matter), a large goiter, elevated thyroid hormone (FT4) at the START of treatment, stopping the drug before completing a full 12 months, and a low TSH measured just 4 weeks after stopping, a practical early-warning signal a doctor can check for directly rather than waiting to see if symptoms return. Research has also found a genetic component (variation in immune costimulatory genes and TRAb levels) contributing to relapse risk, tied directly to the already-covered genetic/family-risk research. Relapse after stopping treatment is common enough that it should be treated as an expected possibility to actively watch for, not a sign that something went wrong with an otherwise successful first round of treatment.",
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
    title: "Radioactive Iodine Reliably Cures Graves' Hyperthyroidism, by Trading It for Hypothyroidism at a High Rate",
    teaser: "Data finds most people treated with radioactive iodine become hypothyroid within a year, an expected outcome of the treatment itself, not a complication.",
    summary: "This category's already-covered treatment landscape names radioactive iodine as a common first-line option for Graves' disease, and follow-up data shows exactly what it actually does to the thyroid over time. A retrospective study of 312 Graves' patients found 69.87 percent already evaluated as hypothyroid at just 6 months post-treatment, and longer-term data across multiple studies finds cumulative hypothyroidism rates ranging widely, from roughly 38.5 percent at a median 7.5 years in one cohort up to figures approaching 90 percent in others, depending on the radioactive dose used and how aggressively physicians target the thyroid. Research finds this variation isn't random: predictive factors identified across several studies include male sex, a shorter disease duration before treatment, a smaller thyroid gland, and lower iodine uptake on pre-treatment scanning, each independently associated with becoming hypothyroid sooner. The worth-understanding reframe: radioactive iodine isn't designed to preserve normal thyroid function while curing the overactivity, evidence finds most patients trade Graves' hyperthyroidism for a permanent need for levothyroxine replacement, already covered extensively elsewhere in the Hashimoto's research. This is a known, largely intentional tradeoff of the treatment, worth discussing directly and in advance with an endocrinologist rather than treated as a surprise complication after the fact.",
    citations: [
      { source: 'Predictive factors for early hypothyroidism following the radioactive iodine therapy in Graves’ disease patients, PMC7260835', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7260835/' },
      { source: "The Incidence of Hypothyroidism Following the Radioactive Iodine Treatment of Graves' Disease and the Predictive Factors Influencing its Development, PMID 26912976", url: 'https://pubmed.ncbi.nlm.nih.gov/26912976/' },
    ],
    overallTier: 'strong',
    relatedIds: ['graves-remission-real-rates'],
  },
  {
    id: 'graves-teprotumumab-hearing-real-data',
    category: 'graves',
    title: "Teprotumumab's Eye Benefit Comes With a Worth-Knowing Hearing Side Effect",
    teaser: "This category's already-covered teprotumumab entry names its structural eye-disease reversal, trial and follow-up data finds roughly 10% of patients also reported hearing-related symptoms, a real consideration before starting treatment.",
    summary:
      "This category's already-covered teprotumumab research names a structural reversal of thyroid eye disease, and dedicated follow-up research into a specific side effect deserves its own direct coverage. Clinical-trial data found hearing abnormalities reported by about 10 percent of patients receiving teprotumumab, with the pivotal trial documenting specific cases: hypoacusis (reduced hearing), one case of temporary deafness, autophony (hearing an echo of one's voice), and eustachian tube dysfunction, most of which resolved. More recent, dedicated research finds these symptoms often gradual in onset, affecting both ears, persistent, and impactful on quality of life while they last, with research finding the underlying mechanism involves both inner-ear and eustachian-tube dysfunction. A important, honest complication: a more recent formal comparison found a similar prevalence of hearing-related complaints in Graves'/thyroid-eye-disease patients who never received teprotumumab at all, evidence that baseline hearing issues in this population make it hard to know how much of any given case is caused by the drug itself versus the underlying disease. This is worth discussing directly with a doctor before starting treatment, alongside this category's already-covered benefit, not a reason to avoid an effective treatment outright.",
    citations: [
      { source: 'Assessment of Hearing Dysfunction in Patients With Graves’ Disease and Thyroid Eye Disease Without or With Teprotumumab, PMID 39138817', url: 'https://pubmed.ncbi.nlm.nih.gov/39138817/' },
      { source: 'Otologic Symptoms Following Teprotumumab Administration in Patients with Thyroid Eye Disease, PMID 39951668', url: 'https://pubmed.ncbi.nlm.nih.gov/39951668/' },
    ],
    overallTier: 'strong',
    relatedIds: ['graves-teprotumumab-thyroid-eye-disease'],
  },
  {
    id: 'graves-pregnancy-trimester-drug-choice',
    category: 'graves',
    title: "Which Antithyroid Drug to Use When: a Trimester-Specific Recommendation, Not a Fixed Choice",
    teaser: "This category's already-covered agranulocytosis/liver-risk entry names general antithyroid-drug risks, pregnancy adds a third, trimester-specific consideration: methimazole and PTU carry different risks to the developing fetus at different points.",
    summary:
      "This category's already-covered antithyroid-drug safety research names agranulocytosis and liver injury as risks shared by both methimazole and propylthiouracil (PTU), and pregnancy adds a third, different consideration specific to the developing fetus. Current guidance recommends PTU specifically during the first trimester, the most sensitive window for fetal organ development, because methimazole (and its close relative carbimazole) carries a documented risk of causing specific birth defects (embryopathy) when taken during this exact window, a risk PTU doesn't share to the same degree. The honest tradeoff: PTU itself carries its already-covered liver-injury risk, described elsewhere in this category as capable of coming on rapidly and unpredictably, meaning the first-trimester drug choice is a deliberate tradeoff between two different risks, not a simple 'safer drug' pick. Current practice guidance reflects this directly: switching from methimazole to PTU specifically upon confirming pregnancy, then often switching back to methimazole after the first trimester once the embryopathy-risk window has passed, since PTU's liver risk makes it less ideal for longer-term use. This trimester-specific switching strategy is worth confirming directly with an endocrinologist as soon as pregnancy is confirmed or being planned, since the right drug changes depending on exactly where in pregnancy someone is, not a single answer that holds throughout.",
    citations: [
      { source: 'Antithyroid drug treatment in pregnancy, PMID 22774211', url: 'https://pubmed.ncbi.nlm.nih.gov/22774211/' },
      { source: "Therapy insight: management of Graves' disease during pregnancy, PMID 17515891", url: 'https://pubmed.ncbi.nlm.nih.gov/17515891/' },
    ],
    overallTier: 'strong',
    relatedIds: ['graves-pregnancy-fetal-thyrotoxicosis'],
  },
  {
    id: 'graves-selenium-orbitopathy-5year-honest-followup',
    category: 'graves',
    title: "A 5-Year Follow-Up Adds an Honest Nuance to Selenium's Own Landmark Orbitopathy Trial",
    teaser: "This category's already-covered landmark selenium trial found gains held up through the original 12-month follow-up, a separate, much longer 5-year cohort study found the same early benefit didn't translate into a lasting long-term difference.",
    summary:
      "This category's already-covered landmark selenium trial found measured improvement in mild Graves' orbitopathy sustained through its 12-month follow-up window (6 months of treatment plus 6 months after stopping), and a separate, much longer 5-year prospective controlled cohort study (74 patients) adds an important nuance, the original trial's shorter-term finding doesn't extend indefinitely. The 5-year study found that six months of selenium supplementation did measurably change the EARLY course of mild-to-moderate orbitopathy, direct confirmation of the same short-term benefit already covered elsewhere in this category, but found the same regimen made no measurable difference in long-term outcomes at the full 5-year mark. This isn't a contradiction of the original landmark trial, both are accurate for the specific timeframe each actually measured, it's an extension showing that an early benefit doesn't automatically mean a lasting one. Matching this category's already-established caution about moderate-to-severe orbitopathy specifically: selenium's best-supported role remains a short-term aid during the active early phase of mild orbitopathy, not a proven long-term disease-modifying treatment, worth discussing directly with an endocrinologist about what a course of selenium can and can't realistically be expected to achieve.",
    citations: [
      { source: "Selenium in the treatment of mild-to-moderate Graves' orbitopathy: a 5-year prospective controlled cohort study, PMID 38200401", url: 'https://pubmed.ncbi.nlm.nih.gov/38200401/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['graves-selenium-orbitopathy'],
  },
  {
    id: 'graves-thyrotoxic-periodic-paralysis',
    category: 'graves',
    title: "Sudden Muscle Paralysis Can Be an Underrecognized First Sign of Graves', Especially in Asian Men",
    teaser: 'Thyrotoxic periodic paralysis strikes a striking male-to-female ratio of up to 70:1, the opposite of Graves\' own usual female predominance, and can be the very first symptom that leads to diagnosis.',
    summary:
      "Thyrotoxic periodic paralysis (TPP) is a dramatic Graves' complication this category hasn't yet covered directly: sudden, temporary muscle weakness or paralysis, most often in the legs, triggered by a sharp drop in blood potassium (hypokalemia) driven by excess thyroid hormone pushing potassium into cells. Epidemiological data finds it disproportionately affects Asian men (Chinese, Japanese, Vietnamese, Filipino, Korean populations), with an incidence around 2 percent of thyrotoxicosis cases in Asian populations, compared with just 0.1 to 0.2 percent in non-Asian populations. The striking demographic reversal: TPP shows a male-to-female ratio as high as 70:1, despite Graves' disease itself affecting women roughly 9 times more often than men, evidence this specific complication runs in the opposite direction from the disease's usual demographic pattern. Case data finds TPP most common in men aged 20 to 40, and frequently the very first, presenting symptom that leads to an undiagnosed Graves' diagnosis being made at all, sometimes before any other classic hyperthyroid symptom is even noticed. Sudden, unexplained leg weakness in a young man, especially of Asian descent, is worth prompt medical evaluation including thyroid function testing, not just assumed to be an isolated neurological event.",
    citations: [
      { source: "Thyrotoxic Periodic Paralysis in an Asian Male With Graves' Disease, PMC12676636", url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12676636/' },
      { source: "Thyrotoxic periodic paralysis as the first presentation of Graves' disease: A case report, PMC10183649", url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10183649/' },
    ],
    overallTier: 'strong',
    relatedIds: ['graves-global-iodine-iceland-denmark', 'graves-overview'],
  },
  {
    id: 'graves-cas-ophthalmopathy-staging',
    category: 'graves',
    title: "Graves' Eye Disease Has a Formal 7-Point Score Deciding Whether It's Actively Inflamed",
    teaser: "This category's already-covered thyroid eye disease research gets a concrete staging tool: the Clinical Activity Score, a standardized 7-item checklist that draws the line between active and inactive orbitopathy.",
    summary:
      "This category's already-covered teprotumumab and euthyroid-ophthalmopathy research treats thyroid eye disease as a clinically significant complication, and formal ophthalmology practice uses a specific, structured tool to decide exactly how active it currently is: the Clinical Activity Score (CAS), a 7-item checklist assigning one point each for spontaneous orbital pain, pain with eye movement, eyelid swelling from active inflammation, eyelid redness, conjunctival redness, chemosis (fluid swelling of the eye surface), and inflammation of the caruncle or plica. Standard clinical convention treats a CAS of 3 or below as inactive disease and 4 or above as active disease, a concrete threshold used directly to guide treatment decisions, since anti-inflammatory treatments (like the corticosteroids and biologics already covered elsewhere in this category) are generally most effective during the active phase. Practice also layers in other formal tools alongside CAS, including the NOSPECS severity classification and the EUGOGO severity system, together giving eye specialists a structured, not just subjective, way to track a disease course over time. Knowing this named scoring system exists gives a person a concrete way to understand and ask about exactly where their eye disease sits, active versus inactive, rather than relying on a vague sense of whether things seem better or worse.",
    citations: [
      { source: 'Advancements in imaging research in thyroid-associated ophthalmopathy, PMC12450699', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12450699/' },
      { source: "Age and Clinical Activity Score (CAS): Key Predictive Factors for Non-shrinking Extraocular Muscles in Graves' Ophthalmopathy After Retrobulbar Injection of Glucocorticoids, PMC12483698", url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12483698/' },
    ],
    overallTier: 'strong',
    relatedIds: ['graves-euthyroid-ophthalmopathy', 'graves-teprotumumab-thyroid-eye-disease'],
  },
  {
    id: 'graves-thyroidectomy-real-complication-rates',
    category: 'graves',
    title: "Surgery for Graves' Carries Quantified Risks, and Surgeon Experience Changes the Odds",
    teaser: 'A 594-patient case series found temporary hypocalcemia in over 40% and temporary vocal-cord-nerve injury in about 5% of Graves\' thyroidectomies, with evidence surgeon experience roughly halves both.',
    summary:
      "This category's already-covered treatment-comparison research names thyroidectomy as an option alongside antithyroid drugs and radioactive iodine, and surgical outcome data gives it its concrete numbers. A 594-patient case series of total thyroidectomy for Graves' disease found temporary recurrent laryngeal nerve palsy (a usually reversible voice-affecting nerve injury) in 5.2 percent of patients, with permanent injury in a rare 0.16 percent. Temporary low calcium (hypocalcemia, from the parathyroid glands being disturbed during surgery) occurred in a substantial 40.6 percent, though only 0.5 percent had a permanent version, broadly consistent with German national guideline figures citing 18 to 20 percent temporary and 3 to 7 percent permanent hypoparathyroidism rates. The single most actionable finding: a direct comparison found less experienced surgeons had meaningfully worse outcomes, 13 percent nerve-injury and 47.8 percent hypocalcemia rates, compared with 1.1 percent and 18.2 percent for more experienced surgeons operating on comparable patients. This is concrete evidence that asking specifically about a surgeon's thyroidectomy volume and experience is a meaningful, actionable question before choosing surgery as a Graves' treatment path, not just a formality.",
    citations: [
      { source: "The value of total thyroidectomy as the definitive treatment for Graves' disease: A single centre experience of 594 cases", url: 'https://www.sciencedirect.com/science/article/pii/S2214623718301261' },
      { source: "Accumulation of Experience and Newly Developed Devices Can Improve the Safety and Voice Outcome of Total Thyroidectomy for Graves' Disease, PMC8911351", url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8911351/' },
    ],
    overallTier: 'strong',
    relatedIds: ['graves-treatment-comparison-real-outcomes', 'graves-bone-density'],
  },
  {
    id: 'graves-atrial-fibrillation-real-risk',
    category: 'graves',
    title: "Graves' Disease Carries a Doubled Risk of Atrial Fibrillation, and the Treatment Chosen Appears to Matter",
    teaser: 'A 94,060-patient Korean cohort found a 2.2-fold higher atrial fibrillation risk in Graves\' disease, with a striking finding that surgery carried no added risk while drug and radioiodine treatment groups did.',
    summary:
      "This category's already-covered thyroid-storm entry names cardiac risk as an acute Graves' emergency, and large cohort data finds a more chronic, ongoing cardiac risk sitting alongside it. A 94,060-patient Korean national health insurance cohort study, compared against 470,300 matched controls, found people with Graves' disease carried a 2.2-fold higher risk of developing atrial fibrillation than the general population. A separate Mayo Clinic cohort of 1,371 Graves' patients found 139 developed atrial fibrillation, with distinct risk factors for early-onset AFib (age, more severe hyperthyroidism, male sex) versus late-onset AFib (age, COPD, heart failure), and found AFib in Graves' patients tracking with higher mortality and cardiac hospitalization risk. The striking finding from the Korean cohort: patients treated with surgery showed a similar AFib risk to the general population, while those treated with antithyroid drugs or radioactive iodine showed an increased risk, a worth-discussing signal about how the choice among this category's already-covered treatment options might carry a different long-term cardiac risk profile, not just a different remission rate. This elevated risk is a reason cardiac monitoring stays part of ongoing Graves' care even after hyperthyroidism itself is controlled.",
    citations: [
      { source: "Incidence, Risk Factors, and Outcomes of Incident Atrial Fibrillation in Patients With Graves Disease, PMID 36922268", url: 'https://pubmed.ncbi.nlm.nih.gov/36922268/' },
      { source: "Graves' disease, its treatments, and the risk of atrial fibrillation: A Korean population-based study, PMID 36387909", url: 'https://pubmed.ncbi.nlm.nih.gov/36387909/' },
    ],
    overallTier: 'strong',
    relatedIds: ['graves-cardiac-thyroid-storm', 'graves-treatment-comparison-real-outcomes'],
  },
  {
    id: 'graves-vitiligo-comorbidity',
    category: 'graves',
    title: "Vitiligo and Graves' Disease Overlap More Than Chance Alone Would Explain",
    teaser: "A meta-analysis found people with vitiligo carry nearly three times the odds of Graves' disease, part of a well-documented pattern of autoimmune thyroid disease clustering with this specific skin condition.",
    summary:
      "This category's already-covered dermopathy research names pretibial myxedema as Graves' own direct skin manifestation, and research finds a different skin condition, vitiligo (patchy loss of skin pigment from autoimmune destruction of melanocytes), showing up alongside Graves' disease far more often than chance would predict. A meta-analysis found people with vitiligo carry significantly higher odds of Graves' disease specifically, an odds ratio of 2.93, and research finds thyroid disease overall three to eight times more common among vitiligo patients than the general population, making it the single most common comorbidity associated with vitiligo. A separate bidirectional Mendelian randomization study, a genetic-evidence method already used elsewhere in this Digest to support causal inference beyond simple correlation, found shared causal pathways between vitiligo and autoimmune thyroid disease, not just an observed statistical pattern. This overlap is a practical reason someone diagnosed with vitiligo is worth screening for thyroid dysfunction, and someone with Graves' disease who notices new patches of pale, depigmented skin is worth mentioning it directly to a doctor rather than assuming it's unrelated.",
    citations: [
      { source: 'Prevalence and Association of Autoimmune Comorbidities Among Adults with Vitiligo: A Systematic Literature Review and Meta-analysis of USA-Based Studies, PMC12549480', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12549480/' },
      { source: 'The causal relationship between vitiligo and autoimmune thyroid diseases: A bidirectional two-sample Mendelian randomization analysis, PMC11133963', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11133963/' },
    ],
    overallTier: 'strong',
    relatedIds: ['graves-dermopathy-pretibial-myxedema', 'graves-genetic-family-risk'],
  },
  {
    id: 'graves-methimazole-embryopathy-real-data',
    category: 'graves',
    title: "Methimazole in the First Trimester Carries a Named Birth-Defect Pattern, Which Is Exactly Why Pregnancy Drug Choice Matters",
    teaser: "This category's already-covered trimester-specific-drug-choice entry gets concrete backing: methimazole taken during weeks 1-7 of pregnancy is linked to a specific, well-documented pattern of birth defects.",
    summary:
      "This category's already-covered pregnancy-trimester-drug-choice entry already recommends switching antithyroid drugs by trimester, and specific case data explains exactly why that recommendation exists. Methimazole exposure during the critical early window (roughly the first through seventh week of pregnancy) is linked to a defined, named pattern of birth defects called methimazole embryopathy, first formally characterized in 1999. Case data compiled across published reports found this pattern includes choanal atresia (blocked nasal passages, present in 65 percent of documented cases), aplasia cutis (a localized absence of skin, usually on the scalp, in 29 percent), nipple abnormalities (23 percent), esophageal atresia (13 percent), and developmental delay (16 percent), among other specific findings. This is precisely why current clinical guidance recommends using propylthiouracil (PTU) specifically during the first trimester despite its already-covered liver-toxicity risk, then switching to methimazole for the remainder of pregnancy once this critical embryonic window has passed, a tradeoff between two different risks rather than one drug being simply safer than the other. This specific pattern is rare in absolute terms, but it's precisely documented and precisely why trimester-specific drug switching, not just picking one antithyroid drug and continuing it, is the current standard of care.",
    citations: [
      { source: 'Methimazole embryopathy: delineation of the phenotype, PMID 10076883', url: 'https://pubmed.ncbi.nlm.nih.gov/10076883/' },
      { source: 'Teratogenic effects of antithyroid drugs, Nature Reviews Endocrinology', url: 'https://www.nature.com/articles/nrendo.2010.159' },
    ],
    overallTier: 'strong',
    relatedIds: ['graves-pregnancy-trimester-drug-choice', 'graves-pregnancy-fetal-thyrotoxicosis'],
  },
  {
    id: 'graves-longterm-low-dose-atd-maintenance',
    category: 'graves',
    title: "Staying on a Low Dose of Methimazole Long-Term Cuts Relapse Risk by Nearly Four-Fold",
    teaser: "This category's already-covered relapse-after-withdrawal research gets a direct answer: a randomized trial found continuing low-dose methimazole (2.5-5mg) dropped 3-year relapse from 41% down to 11%.",
    summary:
      "This category's already-covered recurrence-after-drug-withdrawal entry names relapse as a common outcome once antithyroid drugs stop, and a randomized, prospective controlled trial tested a direct, practical alternative to simply stopping the medication after a standard course. The trial enrolled 184 Graves' patients who had already been on methimazole for at least 18 months and had stable, normal thyroid levels on a low dose (2.5 to 5mg daily) for at least 6 months, then randomized them to either stop the drug entirely or continue that same low dose long-term. After 3 years of follow-up, relapse occurred in 41 percent of patients who stopped versus just 11 percent of those who continued the low dose, a nearly four-fold reduction in relapse risk from simply staying on a low, well-tolerated dose rather than discontinuing. Separate long-term safety data (a Danish multicenter study) found continued methimazole use over many years carried a low, manageable adverse-event profile, not an escalating danger from prolonged use. This is concrete evidence to raise directly with an endocrinologist as an alternative to the standard 12-to-18-month course-then-stop approach, especially for someone who has already experienced one relapse.",
    citations: [
      { source: "Benefits of Long-Term Continuation of Low-Dose Methimazole Therapy in the Prevention of Recurrent Hyperthyroidism in Graves' Hyperthyroid Patients: A Randomized Prospective Controlled Study, PMC9578883", url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9578883/' },
      { source: "Long-term methimazole therapy in Graves' hyperthyroidism and adverse reactions: a Danish multicenter study, PMC9175582", url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9175582/' },
    ],
    overallTier: 'strong',
    relatedIds: ['graves-recurrence-after-drug-withdrawal', 'graves-antithyroid-drug-monitoring'],
  },
  {
    id: 'graves-orbital-decompression-real-outcomes',
    category: 'graves',
    title: "Orbital Decompression Surgery Reverses Bulging Eyes, With Data on Exactly How Much and What It Risks",
    teaser: "This category's already-covered thyroid eye disease research gets a surgical option: decompression surgery reduced eye protrusion by a measured 3-4mm on average, with honest complication data included.",
    summary:
      "This category's already-covered teprotumumab research offers a drug-based option for reducing eye protrusion (proptosis) in thyroid eye disease, and orbital decompression surgery is the established surgical alternative, physically enlarging the eye socket to give swollen orbital tissue more room. Outcome data across multiple case series finds consistent, meaningful results: one study of 26 orbits found proptosis reduced by a mean of 3.85mm, and a separate series found a 2.9mm mean reduction alongside measured visual acuity improvement of about 2.2 lines on a standard eye chart in eyes with sight-threatening disease. Quality-of-life data backs this up directly, with significant improvement in both functional and appearance-related quality-of-life scores after surgery. The honest complication: a larger historical series found new double vision (diplopia) developing in 64 percent of patients who had none before decompression surgery, though longer-term follow-up found 77 percent of those cases resolved to single vision or were correctable with prism lenses by the final follow-up. This is an effective, well-documented surgical option for advanced thyroid eye disease, with a real tradeoff to weigh before deciding (a meaningful chance of new, usually resolving double vision), not a risk-free alternative to already-covered medical treatment.",
    citations: [
      { source: "Medial wall orbital decompression surgery for the treatment of Graves' ophthalmopathy: follow-up results in a single medical center, International Ophthalmology", url: 'https://link.springer.com/article/10.1007/s10792-025-03635-x' },
      { source: "Outcomes of endoscopic orbital decompression for graves' ophthalmopathy, PMID 31203506", url: 'https://pubmed.ncbi.nlm.nih.gov/31203506/' },
    ],
    overallTier: 'strong',
    relatedIds: ['graves-teprotumumab-thyroid-eye-disease', 'graves-cas-ophthalmopathy-staging'],
  },
  {
    id: 'graves-mediterranean-diet-real-trial',
    category: 'graves',
    title: "How Diet Affects Graves' Disease: A Randomized Trial Found a Mediterranean Pattern Helps",
    teaser: "Beyond this category's already-covered iodine and selenium findings, a 40-patient randomized trial found a Mediterranean diet naturally enriched with selenium measurably improved eye-disease activity and controlled weight gain better than a free diet.",
    summary:
      "This category's already-covered iodine and selenium research each covers one specific nutrient's role, and a randomized controlled trial answers the broader question directly: does an overall dietary PATTERN, not just one nutrient, affect Graves' disease. The trial randomized 40 patients with mild, active Graves' ophthalmopathy to either a Mediterranean diet naturally enriched with selenium (about 178 micrograms daily, largely from selenium-rich Mediterranean foods rather than a supplement pill) or a free, unstructured diet, over 24 weeks. Measured results favored the Mediterranean group directly: the Clinical Activity Score (this category's already-covered formal eye-disease staging tool) improved significantly more, soft tissue involvement improved more, and eyelid narrowing was significantly better controlled (9.3mm versus 10.5mm at 24 weeks). A separate, practical finding: weight gain, a common concern once hyperthyroidism resolves, was substantially lower in the Mediterranean group (2.5kg versus 5.1kg). Separate case-control research also finds newly diagnosed Graves' patients showing measurably different eating habits and body composition compared to matched healthy controls, before treatment even starts, suggesting diet's relevance here isn't only about managing the disease afterward. This is controlled trial evidence, not just correlation, that adopting a Mediterranean-style eating pattern is a useful, low-risk addition to standard Graves' treatment, not just a general wellness suggestion.",
    citations: [
      { source: "A Mediterranean diet naturally enriched with selenium improves outcomes in Graves' ophthalmopathy, PMID 40707809", url: 'https://pubmed.ncbi.nlm.nih.gov/40707809/' },
      { source: "Body Composition and Eating Habits in Newly Diagnosed Graves' Disease, PMID 41374040", url: 'https://pubmed.ncbi.nlm.nih.gov/41374040/' },
    ],
    overallTier: 'strong',
    relatedIds: ['graves-iodine', 'graves-selenium-orbitopathy', 'graves-selenium-orbitopathy-5year-honest-followup'],
  },
  {
    id: 'graves-eye-disease-quality-of-life-real-data',
    category: 'graves',
    title: "Thyroid Eye Disease Carries Its Own Distinct Mental-Health Burden, and Surgery Helps It",
    teaser: "This category's already-covered nationwide depression/anxiety finding covers Graves' disease broadly, specific data on thyroid eye disease patients finds an even wider range, and finds orbital decompression surgery measurably improving quality of life on top of the physical outcomes already covered.",
    summary:
      "This category's already-covered nationwide psychiatric research names depression and anxiety as state-dependent Graves' symptoms that improve once hyperthyroidism is treated, and dedicated research on thyroid eye disease (Graves' ophthalmopathy) specifically finds its distinct psychiatric burden layered on top. Pooled data finds depression affecting 18 to 33 percent and anxiety 26 to 41 percent of thyroid eye disease patients specifically, with broader ranges (depression 9 to 70 percent, anxiety 18 to 88 percent) reported across Graves' disease patients overall, evidence of higher psychiatric burden when thyroid autoimmunity is involved compared to non-autoimmune hyperthyroidism. A useful and specific finding: depression and anxiety were significantly linked to worse quality of life in thyroid eye disease, but specific eye symptoms themselves, bulging eyes (exophthalmos) or double vision, showed no direct correlation with mood, evidence the psychiatric burden isn't simply a reaction to how the eyes look or function. The most directly actionable finding, tying straight back to this category's already-covered orbital decompression research: data found surgical interventions, including decompression and eye-muscle (strabismus) surgery, improving quality of life outcomes, not just the physical measurements (proptosis, visual acuity) already covered elsewhere in this category. Mental health support is a legitimate, evidence-backed part of thyroid eye disease treatment, not a separate concern from the physical disease itself.",
    citations: [
      { source: "Psychological Aspects of Graves' Ophthalmopathy, PMID 39032509", url: 'https://pubmed.ncbi.nlm.nih.gov/39032509/' },
      { source: 'Quality of Life in Thyroid Eye Disease: A Systematic Review, PMID 31567783', url: 'https://pubmed.ncbi.nlm.nih.gov/31567783/' },
    ],
    overallTier: 'strong',
    relatedIds: ['graves-psychiatric-disorders-nationwide', 'graves-orbital-decompression-real-outcomes'],
  },
  {
    id: 'graves-hair-loss-honest-evidence-gap',
    category: 'graves',
    title: "Hair Loss Is a Common Hyperthyroidism Worry, Data Finds the Actual Evidence for It Thin",
    teaser: "A 500-patient retrospective study found hypothyroidism significantly tied to worse hair-loss severity, but found hyperthyroidism specifically showing no significant difference from normal thyroid function at all.",
    summary:
      "Hair thinning and shedding is a commonly reported worry among people with thyroid disease, and research finds the evidence splits by direction rather than confirming hyperthyroidism as an equal cause. A retrospective study of 500 women with telogen effluvium (a common pattern of diffuse hair shedding) found hypothyroidism, present in 30 percent of the studied patients, tied to a significantly worse hair-loss severity score than either normal thyroid function or hyperthyroidism. Hyperthyroidism, present in 20.4 percent of the same study population, showed no significant difference in hair-loss severity compared to patients with entirely normal thyroid function, a clear null finding, not one to assume away. This directly means the widely-repeated assumption that an overactive thyroid itself is a major, direct driver of hair loss doesn't hold up as cleanly in data as the parallel, better-supported finding for an underactive thyroid does. Formal thyroid testing remains a reasonable, low-cost part of any hair-loss workup given how common thyroid disease is overall, but someone with well-controlled Graves' disease experiencing hair loss has honest reason to also look at other more directly implicated causes (nutrient deficiency, stress, medication side effects) rather than assuming the thyroid itself is automatically the driving explanation.",
    citations: [
      { source: 'Is thyroid dysfunction a common cause of telogen effluvium?: A retrospective study, PMID 38181279', url: 'https://pubmed.ncbi.nlm.nih.gov/38181279/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['graves-overview', 'graves-subclinical-hyperthyroidism'],
  },
  {
    id: 'graves-fermented-drinks',
    category: 'graves',
    title: 'Fermented Drinks and Foods for Graves\' Disease',
    teaser: 'Graves\' own dietary flashpoint is iodine, not fermentation itself, and none of this app\'s fermented drinks lean on iodine-rich ingredients.',
    summary: 'Every drink in this app\'s Recipes category uses plain (non-iodized) salt in only the small amounts a handful of savory ferments call for, so none of them meaningfully intersect with Graves\' own need to avoid excess iodine intake. The Wild-Fermented Fruit Tonic family and Beet Kvass are reasonable, gut-supportive everyday choices for the same general reason they suit any autoimmune thyroid condition: dairy-free, low-sugar once fully fermented, and built around anti-inflammatory ginger and turmeric. The same casein caution named for Hashimoto\'s applies here too, autoimmune thyroid disease broadly, not one direction of it specifically, so Coconut Kefir or Water Kefir are the more cautious everyday probiotic choice over Milk Kefir or Ayran if dairy is a concern.',
    citations: [
      { source: 'National Center for Home Food Preservation (University of Georgia) fermentation overview', url: 'https://nchfp.uga.edu/how/can_ferment.html' },
    ],
    overallTier: 'moderate',
    relatedIds: ['recipe-ferment-beet-kvass', 'recipe-ferment-coconut-kefir', 'fermentmethod-wild-tonics'],
  },
  // 2026-08-21, added after fact-checking NOVA's "The Truth About Fat"
  // (2020) documentary against the peer-reviewed literature, direct
  // request. The documentary itself is not treated as a citable source;
  // this traces to the primary study, independently verified via
  // WebSearch. Deliberately paired with Hashimoto's own leptin entry
  // (mitochondriaMetabolism.ts): same study, same hormone, opposite
  // direction, since Graves' and Hashimoto's are opposite-direction
  // autoimmune thyroid diseases.
  {
    id: 'graves-leptin-lower-than-controls',
    category: 'graves',
    title: "Leptin Runs Lower in Graves' Disease, and Rises Once Treated, the Opposite of Hashimoto's",
    teaser: 'A direct comparison found leptin significantly lower in untreated Graves\' than in healthy controls, rising after treatment, a mirror image of what the same study found in Hashimoto\'s.',
    summary: "A direct comparison of leptin levels across Graves' disease, Hashimoto's thyroiditis, and healthy controls found a striking, opposite-direction pattern between the two autoimmune thyroid diseases. In untreated Graves' (hyperthyroid), leptin ran significantly lower than in healthy controls, and rose after treatment restored normal thyroid function. This fits the broader physiology already established: hyperthyroidism raises metabolic rate and tends to reduce fat mass, and leptin, produced by fat tissue, tracks with fat mass. Worth reading alongside Hashimoto's matching leptin finding (in the mitochondria & metabolism research), the same study measured both conditions and found leptin moving in the opposite direction there, elevated rather than reduced, a direct contrast between two diseases that attack the same organ from opposite metabolic directions.",
    citations: [
      { source: 'Alterations of Serum Leptin Levels in Patients with Autoimmune Thyroid Disorders (PMID 35505829)', url: 'https://pubmed.ncbi.nlm.nih.gov/35505829/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['leptin-discovery-ob-mice', 'mito-visceral-fat-treg-depletion'],
  },
  {
    id: 'graves-circadian-clock-disruption',
    category: 'graves',
    title: "The Same Clock-Gene Disruption Shows Up in Autoimmune Thyroiditis Broadly, Including Graves'",
    teaser: "The circadian research behind this finding studied autoimmune thyroiditis as a category, which includes both the gland-destroying and gland-stimulating forms.",
    summary: "A 2023 study comparing thyroid tissue from people with autoimmune thyroiditis against healthy controls found disrupted expression of core clock genes, including a measurable reduction in BMAL1 and PER2, in the affected tissue. The study's patient population and mouse model centered on the gland-destroying form of autoimmune thyroiditis, the mechanism behind Hashimoto's specifically, so its direct relevance to Graves' (a stimulating rather than destructive antibody) is inferred from the shared \"autoimmune thyroiditis\" category rather than confirmed in Graves' patients themselves. What does transfer cleanly: circadian rhythm and thyroid autoimmunity are mechanistically linked in general, and a chronically disrupted sleep-wake and eating schedule is a plausible aggravating factor for thyroid inflammation regardless of which direction the antibody pushes hormone levels.",
    citations: [
      { source: 'Circadian clock disruption in autoimmune thyroiditis, European Thyroid Journal', url: 'https://pubmed.ncbi.nlm.nih.gov/37548297/' },
    ],
    overallTier: 'weak',
    relatedIds: ['chrono-circadian-clock-biology', 'hashimoto-circadian-clock-disruption'],
  },
];
