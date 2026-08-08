import type { DigestEntry } from './types';

// PCOS (Polycystic Ovary Syndrome) -- 11 entries, added 2026-08-08 as this
// app's eleventh real condition, and the FIRST genuinely non-autoimmune
// condition built out in this whole session -- every condition before it
// (Hashimoto's, RA, Psoriasis, Graves', T1D, Celiac, IBD, MS, Lupus,
// Sjögren's) is a real autoimmune disease; PCOS is a real endocrine and
// metabolic disorder instead, named directly in CLAUDE.md's own Beyond
// Hashimoto's research as one of the "9 non-autoimmune candidates" this
// app was always meant to reach eventually, not autoimmune scope creep.
//
// PCOS is built with the same reuse-first, self-advocacy-from-day-one
// discipline as every autoimmune condition before it, but its own real
// central mechanism, insulin resistance, is genuinely metabolic rather
// than immune, which gives this category real, direct overlap with this
// app's own Type 1 Diabetes research (the carbohydrate/fiber
// sub-criterion built for T1D is a real, honest reuse candidate here too)
// and with the My Meds work's own already-built inositol/potassium
// reference data.
//
// Every citation here was independently verified via WebSearch before
// being written in.
export const PCOS_ENTRIES: DigestEntry[] = [
  {
    id: 'pcos-overview',
    category: 'pcos',
    title: 'PCOS: A Real, Common Hormone and Metabolism Disorder, Not an Autoimmune Disease',
    teaser: 'The most common hormonal condition in women of childbearing age, and a genuinely different kind of condition from every other one in this app.',
    summary:
      "Polycystic ovary syndrome (PCOS) is the most common endocrine disorder in women of childbearing age, affecting a real, substantial 8% to 13% of that population by the most widely used diagnostic standard. Diagnosis relies on the real, internationally used Rotterdam criteria: at least two of three features must be present -- irregular or absent ovulation, real clinical or lab-confirmed signs of excess androgens (male-pattern hormones), and polycystic ovarian appearance on ultrasound. Unlike every other condition built out in this app so far, PCOS is not an autoimmune disease, the immune system isn't attacking the body's own tissue here, it's a real, genuine hormone and metabolism disorder, with insulin resistance as its own central, driving mechanism (covered directly in this category's own next entry). Worth knowing plainly: PCOS looks different in different people, one person's most disruptive symptom (irregular periods, unwanted hair growth, acne, fertility difficulty, weight changes) can be genuinely mild or absent in someone else with the same real diagnosis.",
    citations: [
      { source: 'Polycystic Ovary Syndrome, MedlinePlus, U.S. National Library of Medicine', url: 'https://medlineplus.gov/polycysticovarysyndrome.html' },
    ],
    overallTier: 'strong',
    relatedIds: ['migraine-menstrual-estrogen-withdrawal'],
  },
  {
    id: 'pcos-insulin-resistance-mechanism',
    category: 'pcos',
    title: 'Insulin Resistance: The Real, Central Mechanism Driving Most of PCOS at Once',
    teaser: "Not just a common complication of PCOS. A real, documented driver of the hormone imbalance itself, in a majority of patients.",
    summary:
      "Insulin resistance is the real, central mechanism connecting most of what PCOS actually does to the body, not a separate, unrelated complication that happens to show up alongside it. A real, direct case-control study found insulin resistance in 42.6% of PCOS patients versus 17.1% of matched controls, roughly two and a half times more common. The real mechanism runs both directions: elevated insulin directly stimulates the ovaries' own hormone-producing cells to make more androgens, worsening the excess-hair-growth and acne symptoms PCOS is often first noticed for, while the resulting hyperandrogenism itself further disrupts normal ovulation. Real research also finds PCOS's own insulin resistance mechanistically distinct from the more familiar insulin resistance of obesity or type 2 diabetes, affecting muscle tissue through a genuinely different signaling defect. This directly explains why the two most consistently evidence-backed levers covered elsewhere in this category, modest weight loss and myo-inositol supplementation, both work primarily by improving insulin sensitivity rather than targeting hormones directly.",
    citations: [
      { source: 'A case-control observational study of insulin resistance and metabolic syndrome among the four phenotypes of polycystic ovary syndrome based on Rotterdam criteria', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4417246/' },
    ],
    overallTier: 'strong',
    relatedIds: ['pcos-myo-dchiro-inositol', 'pcos-weight-loss-modest', 'type2-overview', 'type2-metabolic-syndrome-cluster', 'pcos-dairy-igf1-hyperandrogenism', 'prostate-metabolic-syndrome-bph-link'],
  },
  {
    id: 'pcos-myo-dchiro-inositol',
    category: 'pcos',
    title: 'Myo-Inositol and D-Chiro-Inositol: A Real, Well-Studied 40:1 Ratio, Already in This App\'s Own Reference Data',
    teaser: 'One of the better-evidenced supplements in this app\'s whole research base for any condition, and this app already tracks the exact ratio a real trial found best.',
    summary:
      "Myo-inositol and D-chiro-inositol are two real, related compounds naturally present in the body, and PCOS supplementation research has converged on a specific, tested ratio between them. A real, direct comparison trial testing seven different myo-inositol-to-D-chiro-inositol ratios (56 PCOS patients, 3 months) found the 40:1 ratio worked best for restoring ovulation and normalizing hormone and metabolic measures, matching the real, natural physiological ratio the body itself maintains in blood plasma. The real, distinct mechanism behind each half of the pair: myo-inositol increases how well cells take up glucose, while D-chiro-inositol increases how efficiently the body stores that glucose as glycogen, together genuinely reducing insulin resistance, the same real mechanism this category's own previous entry names as PCOS's own central driver. Real research finds this combination, at 4g myo-inositol plus 100mg D-chiro-inositol daily for 3 to 6 months, associated with improved insulin sensitivity, more regular ovulation, lower androgen levels, and better fertility outcomes -- genuinely one of the better-evidenced supplements in this whole app's research base for any condition. This app's own My Meds supplement-tracking data (see \`supplement_forms\`/\`nutrient_timing\`, built for general inositol tracking) already carries this exact 40:1 ratio as a real, named form option.",
    citations: [
      { source: 'The 40:1 myo-inositol/D-chiro-inositol plasma ratio is able to restore ovulation in PCOS patients: comparison with other ratios, PMID 31298405', url: 'https://pubmed.ncbi.nlm.nih.gov/31298405/' },
    ],
    overallTier: 'strong',
    relatedIds: ['chromium-insulin-sensitivity-honest'],
  },
  {
    id: 'pcos-spearmint-tea',
    category: 'pcos',
    title: 'Spearmint Tea: A Real, Randomized Trial Found a Genuine Anti-Androgen Effect',
    teaser: 'A folk remedy with real trial backing, and a real, honest reason visible hair-growth improvement takes longer than the hormone change itself.',
    summary:
      "Spearmint tea has a real history as a folk remedy for excess hair growth in PCOS, and a real, randomized, placebo-controlled trial (42 women, 30 days, spearmint tea versus a placebo herbal tea, twice daily) found a genuine, measurable anti-androgen effect: free and total testosterone both dropped significantly in the spearmint group (testosterone reductions in the real range of 20% to 30% compared to placebo), while the placebo group's hormone levels stayed essentially flat. The real, likely mechanism involves rosmarinic acid and flavonoid compounds in spearmint that appear to genuinely reduce circulating androgens. A real, honest nuance worth knowing directly: the same 30-day trial found no significant change yet in the actual, visible hirsutism score (a standardized measure of excess hair growth), not because the treatment didn't work, but because hair follicles cycle slowly, real visible improvement in unwanted hair growth takes several months to show up even once the underlying hormone level has already genuinely changed. A real, low-risk, food-based option with genuine trial support, best understood with a realistic timeline rather than expected to work overnight.",
    citations: [
      { source: 'Grant P, Phytotherapy Research, 2010, "Spearmint herbal tea has significant anti-androgen effects in polycystic ovarian syndrome. A randomized controlled trial," PMID 19585478', url: 'https://pubmed.ncbi.nlm.nih.gov/19585478/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'pcos-weight-loss-modest',
    category: 'pcos',
    title: 'Modest Weight Loss: A Real, Specific, Quantified Threshold That Genuinely Moves the Needle',
    teaser: "Not a demand for dramatic change. A real, recent trial found each single percentage point of weight lost measurably raised the odds of a real outcome: ovulation actually returning.",
    summary:
      "Real, current PCOS treatment guidance recommends modest weight loss, just 5% to 10% of body weight, as a genuinely effective first step for those who are overweight, and the real evidence behind that specific, modest target is stronger than the number might suggest. The real, recent BAMBINI trial found ovulatory recovery at 52 weeks in 50.8% of participants overall, but the real, striking detail is the dose-response relationship within that: ovulatory recovery occurred in only 19% of participants who didn't lose weight, versus over 50% of those who did, and each single percentage point of body weight lost was associated with a real, measured 5.6% increase in the odds of ovulation actually returning. Real, broader research finds this same modest weight-loss range associated with genuine improvement across PCOS's own three main symptom domains at once, reproductive (ovulation, fertility), metabolic (insulin sensitivity), and psychological. This is worth knowing directly as a real, evidence-backed reason a first, modest, achievable goal, not a demand for dramatic transformation, is the actual recommended starting point.",
    citations: [
      { source: 'Ovulatory Recovery following weight loss in women with polycystic ovary syndrome and obesity: a post hoc analysis of the BAMBINI randomised controlled trial, PMID 41808368', url: 'https://pubmed.ncbi.nlm.nih.gov/41808368/' },
    ],
    overallTier: 'strong',
    relatedIds: ['pcos-insulin-resistance-mechanism'],
  },
  {
    id: 'pcos-endometrial-cancer-risk',
    category: 'pcos',
    title: "A Real, Elevated Cancer Risk Traced Directly Back to PCOS's Own Core Mechanism",
    teaser: 'Irregular ovulation isn\'t just a fertility inconvenience. Left unaddressed, it carries a real, measurable cancer risk.',
    summary:
      "PCOS carries a real, meaningfully elevated risk of endometrial cancer, roughly 2.7-fold higher in real population studies (with some estimates ranging from 2 to 6 times higher), and the real mechanism behind it traces directly back to PCOS's own defining feature: anovulation. When ovulation doesn't happen regularly, the uterine lining (endometrium) is exposed to estrogen without the real, balancing effect progesterone normally provides after a real ovulation cycle, a genuine, documented condition called unopposed estrogen exposure. Real research finds this estrogen-driven, unopposed proliferation can lead to endometrial hyperplasia (a real, overgrown lining) and, over enough uncorrected time, endometrial cancer itself. Real, standard surveillance for someone with prolonged irregular periods or abnormal bleeding includes transvaginal ultrasound and, when warranted, an endometrial biopsy. This is a real, direct, practical reason irregular or absent periods in PCOS deserve real medical attention beyond fertility planning alone, not treated as a symptom to simply live with indefinitely.",
    citations: [
      { source: 'Endocrine Risk Factors of Endometrial Cancer: Polycystic Ovary Syndrome, Oral Contraceptives, Infertility, Tamoxifen', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7408229/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'pcos-hashimotos-comorbidity',
    category: 'pcos',
    title: "PCOS and Hashimoto's: A Real, Bidirectional, Substantially Elevated Overlap",
    teaser: 'Each condition genuinely raises real risk of the other, not just a one-way association, with real numbers on both sides.',
    summary:
      "PCOS and Hashimoto's thyroiditis show a real, genuinely bidirectional overlap, each condition measurably raising the real risk of the other, not simply co-occurring by chance. Real population data finds the risk of PCOS increased 2.37-fold in people with Hashimoto's thyroiditis specifically, and separately, autoimmune thyroiditis and hypothyroidism run about three times more common in women with PCOS than in the general population. The real overlap's own strength varies meaningfully by population studied, real data showing it running highest in Asian populations (4.56-fold), somewhat lower in European populations (3.27-fold), and lower still in South American populations (1.86-fold) -- a real, honest reason not to treat this as one fixed, universal number. A further real, practical finding: people with both conditions together show real, additionally elevated rates of diabetes (2.48-fold), high cholesterol (2.05-fold), and coronary artery disease (2.63-fold) compared to people with neither. Worth knowing directly for anyone managing either condition alone: a real, standard thyroid panel (already covered in this app's own Hashimoto's self-advocacy research) is a genuinely reasonable thing to ask about even without other thyroid symptoms yet, and the reverse holds too.",
    citations: [
      { source: 'Ho CH, et al., Annals of Translational Medicine, "Hashimoto\'s thyroiditis might increase polycystic ovary syndrome and associated comorbidities risks in Asia"', url: 'https://atm.amegroups.org/article/view/43229/html' },
      { source: 'Increased Risk of Polycystic Ovary Syndrome and Its Comorbidities in Women with Autoimmune Thyroid Disease', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7177418/' },
    ],
    overallTier: 'strong',
    relatedIds: ['advocacy-core-thyroid-panel'],
  },
  {
    id: 'pcos-ogtt-screening',
    category: 'pcos',
    title: "Diabetes Screening in PCOS: Why a Simple Fasting Glucose Test Isn't Enough",
    teaser: 'The standard, simplest diabetes test misses more than half of real cases in PCOS specifically. A real, more involved test is the actual recommendation.',
    summary:
      "Given how central insulin resistance is to PCOS (see this category's own dedicated entry), real, standard diabetes screening deserves real, specific attention here rather than the general population's usual approach. A real, expert panel (the Androgen Excess Society) specifically recommends a 75-gram oral glucose tolerance test (OGTT), not a fasting glucose test alone, for exactly this reason: real research found fasting glucose alone missed real glucose intolerance in 58% of PCOS cases that an OGTT correctly caught. The OGTT itself involves a real, standard process: a baseline blood draw, drinking a real glucose solution, then a second blood draw two hours later, with a 2-hour value of 140 to 199 mg/dL indicating impaired glucose tolerance and 200 mg/dL or higher indicating diabetes itself. Real guidance particularly recommends this for anyone with PCOS and a BMI over 30, a strong family history of type 2 diabetes, or age over 40, though the underlying research found fasting glucose inadequate regardless of age, weight, or androgen levels. Worth asking directly for the full OGTT rather than assuming a normal fasting glucose result is the complete picture.",
    citations: [
      { source: 'Diagnosis of disorders of glucose tolerance in women with polycystic ovary syndrome (PCOS) at a tertiary care center: fasting plasma glucose or oral glucose tolerance test?, PMID 30710572', url: 'https://pubmed.ncbi.nlm.nih.gov/30710572/' },
    ],
    overallTier: 'strong',
    relatedIds: ['type1-hba1c-time-in-range'],
  },
  {
    id: 'pcos-lipid-panel-cardiometabolic',
    category: 'pcos',
    title: "A Real, Full Cardiometabolic Workup, Not Just a Reproductive-Health Checklist",
    teaser: "Up to 70% of PCOS patients carry real insulin resistance. A real, complete lab panel exists specifically because of that number.",
    summary:
      "Real clinical guidance recommends treating PCOS's own workup as a genuine, full cardiometabolic evaluation, not only a reproductive-health checklist, given that up to 70% of women with PCOS carry real insulin resistance. The real, recommended panel includes fasting insulin, fasting glucose, HbA1c, and a full fasting lipid panel (total cholesterol, LDL, HDL, and triglycerides), alongside the OGTT already covered in this category's own dedicated entry. This is worth knowing directly as a real, practical checklist to bring to an appointment, since PCOS is sometimes treated by a clinician as purely a fertility or menstrual-cycle issue, when the real, underlying metabolic picture genuinely deserves its own, separate, complete evaluation, not an afterthought to whatever brought someone in originally.",
    citations: [
      { source: 'Polycystic Ovarian Syndrome Workup, Medscape', url: 'https://emedicine.medscape.com/article/256806-workup' },
    ],
    overallTier: 'strong',
    relatedIds: ['cvd-overview', 'cvd-lipid-panel-self-advocacy'],
  },
  {
    id: 'pcos-spironolactone-potassium',
    category: 'pcos',
    title: 'Spironolactone: A Real Medication for Androgen Symptoms, With a Real Potassium Caution',
    teaser: 'A common PCOS medication works by blocking a hormone that manages potassium. That mechanism carries a real, specific dietary caution worth knowing.',
    summary:
      "Spironolactone is a real, commonly prescribed medication for PCOS's own androgen-driven symptoms (excess hair growth, acne), working by blocking aldosterone, the hormone that normally regulates the body's sodium and potassium balance. That same real mechanism carries a real, specific, practical caution: because spironolactone already reduces how much potassium the body clears, combining it with potassium-rich foods in large amounts, potassium supplements, or salt substitutes made from potassium chloride carries a real risk of the blood potassium level climbing too high, a genuine safety concern, not a minor nutrient-timing nuance. A real, separate and serious caution: spironolactone must be avoided entirely during pregnancy, since its anti-androgen effect carries a real, documented risk of feminizing a male fetus, which is exactly why it's typically paired with reliable contraception when prescribed for PCOS in someone who could become pregnant. Worth a real, direct conversation about both of these before starting, not assumptions either way.",
    citations: [
      { source: "Spironolactone's Role In Treating PCOS", url: 'https://healthmatch.io/pcos/spironolactone-for-pcos' },
    ],
    overallTier: 'strong',
    relatedIds: ['potassium-toxicity-hyperkalemia'],
  },
  {
    id: 'pcos-tying-together',
    category: 'pcos',
    title: 'What Actually Holds Up for PCOS, Pulled Together',
    teaser: "This app's first genuinely non-autoimmune condition, and one real mechanism, insulin resistance, that explains almost everything else in this category at once.",
    summary:
      "Line up everything in this category and PCOS reads as a condition where one real mechanism, insulin resistance, genuinely explains most of what else is happening, unlike the wider-ranging, multi-mechanism shape conditions like Lupus or Sjögren's showed. Myo-inositol's own well-studied 40:1 ratio and modest, 5-10% weight loss both work primarily by improving that same real insulin sensitivity, and both carry genuinely strong, specific trial evidence, myo-inositol among the better-evidenced supplements anywhere in this app's whole research base. Spearmint tea adds a real, separate, food-based lever specifically for androgen-driven symptoms, with an honest note about why visible results take longer than the hormone change itself. The endometrial cancer risk and the real, bidirectional Hashimoto's overlap both argue for taking PCOS seriously as a real, systemic condition reaching well past fertility and appearance, the same argument Sjögren's own lymphoma and kidney findings made for that condition. And the self-advocacy entries, the OGTT's real superiority over fasting glucose alone, the full cardiometabolic panel, and spironolactone's own real potassium caution, all trace back to that same central insulin-resistance mechanism this whole category is built around.",
    citations: [
      { source: 'Polycystic Ovary Syndrome, MedlinePlus, U.S. National Library of Medicine', url: 'https://medlineplus.gov/polycysticovarysyndrome.html' },
    ],
    overallTier: 'strong',
    relatedIds: ['pcos-insulin-resistance-mechanism', 'pcos-myo-dchiro-inositol', 'pcos-weight-loss-modest', 'pcos-hashimotos-comorbidity', 'pcos-endometrial-cancer-risk'],
  },

  // -- Full-depth parity additions, 2026-08-08. Every citation
  // independently verified via WebSearch.
  {
    id: 'pcos-rotterdam-phenotypes',
    category: 'pcos',
    title: "PCOS Isn't One Thing -- Four Real, Formally Named Phenotypes, With Genuinely Different Real Risk Levels",
    teaser: "The Rotterdam criteria split PCOS into four real phenotypes (A through D), and Phenotype A carries the real, highest metabolic and hormonal disruption while Phenotype D carries the lowest.",
    summary:
      "PCOS diagnosis runs on the Rotterdam criteria: two of three real features (irregular or absent ovulation, biochemical or clinical hyperandrogenism, and polycystic-appearing ovaries on ultrasound) confirm the diagnosis, but WHICH two matters, splitting PCOS into four real, formally named phenotypes. Phenotype A (all three features present, the \"classic\" form) carries the real, most severe metabolic and hormonal disruption, the highest rates of insulin resistance and androgen excess. Phenotype B (hyperandrogenism plus anovulation, without the ovarian-appearance criterion) and Phenotype C (hyperandrogenism plus the ovarian finding, but with regular ovulation) fall in between. Phenotype D (anovulation plus the ovarian finding, but WITHOUT hyperandrogenism) carries the real, lowest metabolic risk of the four, meaning the real, practical focus for that phenotype specifically shifts toward the ovulation problem itself rather than the insulin-resistance-driven complications this app's own PCOS research otherwise centers on. Worth knowing directly: not every PCOS diagnosis carries the same real risk profile, and knowing which phenotype applies changes which parts of this app's own PCOS research are most directly relevant.",
    citations: [
      { source: 'When one size does not fit all: Reconsidering PCOS etiology, diagnosis, clinical subgroups, and subgroup-specific treatments', url: 'https://www.sciencedirect.com/science/article/pii/S2666396124000037' },
    ],
    overallTier: 'strong',
    relatedIds: ['pcos-insulin-resistance-mechanism'],
  },
  {
    id: 'pcos-sleep-mental-health-real-data',
    category: 'pcos',
    title: "PCOS's Own Real Reach Beyond Fertility: Sleep Apnea in Over a Third of Patients, and Anxiety in Over Three-Quarters",
    teaser: 'Real, pooled data finds obstructive sleep apnea in 37% of PCOS patients (versus 6% without PCOS), and a real, striking connected web linking sleep, mental health, and liver fat together.',
    summary:
      "PCOS's own real reach extends well past fertility and metabolic labs. Real, pooled data finds obstructive sleep apnea (OSA) in 37% of women with PCOS overall (29% in adolescents, 40% in adults), compared to just 6% in women without PCOS, a genuinely large real gap that holds even after accounting for weight. Left untreated, that same real OSA independently worsens insulin resistance and glucose intolerance, a real, direct feedback loop with PCOS's own central mechanism already covered elsewhere in this app. Real mental-health data is similarly striking: median depression prevalence of 36.6%, and anxiety reported in as high as 76.7% of PCOS patients in real research, both independently tied to BMI and insulin resistance rather than existing in isolation. A real, third connected thread: PCOS carries a real 2-4-fold higher NAFLD (fatty liver) risk independent of BMI, and OSA specifically predisposes toward it further, a real, three-way connected web (sleep, mood, liver) worth managing together rather than as separate, unrelated complaints.",
    citations: [
      { source: 'Obstructive sleep apnea syndrome in polycystic ovary syndrome: a systematic review and meta-analysis, PMC12006010', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12006010/' },
    ],
    overallTier: 'strong',
    relatedIds: ['pcos-insulin-resistance-mechanism'],
  },
  {
    id: 'pcos-history-milestones',
    category: 'pcos',
    title: "PCOS's Own Real History: Named for Two Doctors, Redefined Three Real Times Since",
    teaser: '1935, the 1990s, 2003 -- a real, seven-woman case series became a named syndrome, then needed real, formal reworking twice more as understanding of the condition grew.',
    summary:
      "PCOS's own real modern description dates to 1935, when Irving Stein and Michael Leventhal presented a real case series of 7 women sharing menstrual irregularity, hirsutism, and infertility together, the first real, documented recognition that these features formed one connected condition rather than several unrelated complaints. For decades afterward, the condition carried their names, Stein-Leventhal Syndrome, and Stein's own 1958 claim that surgery could cure it (a real claim that hasn't held up against modern understanding of PCOS as a genuinely chronic, systemic condition). Real, formal diagnostic criteria didn't exist until an early-1990s NIH conference established the first agreed-upon definition; the Rotterdam criteria, already covered in this app's own phenotype research above, followed in 2003, expanding diagnosis to include ovarian ultrasound findings for the first time. Metformin's own real path to becoming a first-line PCOS treatment ran in parallel but separately: first synthesized in 1922, not approved for diabetes treatment (under the brand name Glucophage) until 1957, decades before its real, modern PCOS-specific use.",
    citations: [
      { source: 'The polycystic ovary syndrome: the first 150 years of study', url: 'https://www.sciencedirect.com/science/article/pii/S2666334122001398' },
    ],
    overallTier: 'strong',
    relatedIds: ['pcos-rotterdam-phenotypes'],
  },
  {
    id: 'pcos-pregnancy-real-complications-letrozole',
    category: 'pcos',
    title: 'PCOS Pregnancy Carries Real, Elevated Risk on Several Fronts -- and a Real, Newer Ovulation-Induction Drug That Genuinely Outperforms the Older Standard',
    teaser: 'Real, elevated gestational diabetes and preeclampsia risk, both tracing back to the same insulin-resistance mechanism already central to this category -- and letrozole, not clomiphene, is now the real, evidence-preferred first choice for inducing ovulation.',
    summary:
      "PCOS pregnancy carries real, elevated risk across several fronts, most tracing back to the same chronic inflammation, insulin resistance, and hyperandrogenism already central to this whole category: real, increased risk of implantation failure, early miscarriage, gestational diabetes, fetal growth restriction, preterm labor, and preeclampsia. The real, practical, actionable finding on how to actually get pregnant: letrozole, a real aromatase inhibitor, has become the real, evidence-preferred first-line ovulation-induction drug for PCOS, outperforming the older standard, clomiphene, on higher ovulation and live-birth rates, a lower real risk of multiple pregnancy, and a more favorable uterine-lining environment. Real, large trial data found no increase in congenital anomalies, miscarriage, or adverse perinatal outcomes in letrozole-conceived pregnancies, and, notably, real evidence that letrozole conception itself may REDUCE the incidence of gestational diabetes, hypertensive complications, and large-for-gestational-age infants compared to other conception routes, a genuinely reassuring finding for a medication choice that's already become the real, standard first option.",
    citations: [
      { source: 'Letrozole and clomiphene versus letrozole alone for ovulation induction in women with PCOS: a systematic review and meta-analysis, PMC12097446', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12097446/' },
    ],
    overallTier: 'strong',
    relatedIds: ['pcos-insulin-resistance-mechanism'],
  },

  // -- Second depth pass, 2026-08-08, extending full-parity work to the
  // first 10 non-Hashimoto's conditions. Every citation independently
  // verified via WebSearch.
  {
    id: 'pcos-gut-microbiome-hyperandrogenism',
    category: 'pcos',
    title: 'Real Research Now Directly Links Reduced Gut Microbial Diversity to Higher Testosterone Levels in PCOS',
    teaser: 'A real study of 73 PCOS patients found lower gut microbial diversity correlating directly with higher testosterone and hirsutism, and mouse studies show transplanting a PCOS gut microbiome alone can cause the same core disease features.',
    summary:
      "PCOS is genuinely tied to real, measurable gut microbiome changes that go beyond the already-covered insulin-resistance mechanism in this app's own PCOS research. Real research finds PCOS patients show a consistent pattern of gut dysbiosis, reduced overall microbial diversity, an altered ratio between two major bacterial groups (Firmicutes and Bacteroidetes), and abnormal metabolic byproducts. A real study of 73 PCOS patients and 48 healthy controls found reduced gut microbial diversity correlating directly and negatively with hyperandrogenemia, total testosterone levels, and hirsutism (excess hair growth), a real, specific, quantified link between the gut and PCOS's own hallmark hormonal symptoms. The real, proposed mechanisms include disrupted energy metabolism, altered lipid and bile acid processing, and chronic low-grade inflammation, mirroring the same gut-driven inflammatory pathway already covered elsewhere in this app for other autoimmune and metabolic conditions. Genuinely striking: real animal research found that transplanting fecal microbiota from PCOS patients into healthy mice actually reproduced core PCOS features, including anovulation and metabolic dysfunction, real evidence the gut microbiome isn't just a bystander marker but potentially a real, causal contributor. Worth knowing directly: this connects PCOS's own already-covered insulin-resistance mechanism to a second, real, gut-centered pathway, reinforcing why the whole-food, fiber-supportive dietary pattern already recommended elsewhere in this app's own PCOS and gut-microbiome research applies here too.",
    citations: [
      { source: 'Gut Microbial Diversity in Women With Polycystic Ovary Syndrome Correlates With Hyperandrogenism, PMID 29370410', url: 'https://pubmed.ncbi.nlm.nih.gov/29370410/' },
      { source: 'Unraveling the gut microbiota\'s role in PCOS: a new frontier in metabolic health, PMC11958223', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11958223/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['pcos-insulin-resistance-mechanism'],
  },

  // -- Volumetric depth pass, 2026-08-08, continuing toward genuine
  // volumetric parity with Hashimoto's own depth, per direct instruction
  // that all 18 non-Hashimoto's conditions deserve the same fully
  // encompassing treatment, individually and in combination. Every
  // citation independently verified via WebSearch.
  {
    id: 'pcos-nafld-comorbidity',
    category: 'pcos',
    title: 'Fatty Liver Disease Affects Over Half of Women With PCOS, a Real, Striking Comorbidity Driven by the Same Core Mechanism',
    teaser: 'Real, current worldwide data finds MASLD (fatty liver disease) in 51.56% of women with PCOS versus 29.64% of women without it, driven by the same insulin resistance and high androgen levels already central to PCOS itself.',
    summary:
      "PCOS carries a real, striking comorbidity with metabolic dysfunction-associated steatotic liver disease (MASLD, already covered in real depth in this app's own dedicated fatty-liver-disease research), worth knowing about directly rather than treating the two as unrelated diagnoses. Real, current, racially and ethnically diverse worldwide data finds MASLD in 51.56% of women with PCOS compared to 29.64% of women without it, with a real meta-analysis finding a pooled prevalence around 43% and a real, roughly 2.5-fold higher odds (odds ratio 2.54) of MASLD in PCOS. Genuinely important: real research finds this connection independent of body weight, high androgen levels and insulin resistance, PCOS's own real, already-covered core mechanisms, appear to drive liver injury directly, not merely through obesity as a middle step. Real research specifically finds women with PCOS who have hyperandrogenism (the classic phenotype) show a higher MASLD prevalence than PCOS without hyperandrogenism, even after accounting for other confounding factors. Worth knowing directly: this is a real, concrete, worth-raising reason for anyone with PCOS to ask about liver health as part of routine screening, since this app's own already-established MASLD research (weight-loss thresholds, exercise's independent benefit, the real FIB-4 fibrosis-screening tool) applies directly and usefully to this real, common PCOS comorbidity, not just to fatty liver disease encountered on its own.",
    citations: [
      { source: 'Nonalcoholic Fatty Liver Disease in Women and Girls With Polycystic Ovary Syndrome, Journal of Clinical Endocrinology & Metabolism', url: 'https://academic.oup.com/jcem/article/107/1/258/6365752' },
      { source: 'Non-Alcoholic Fatty Liver Disease in Patients with Polycystic Ovary Syndrome: A Systematic Review, Meta-Analysis, and Meta-Regression, PMC9917911', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9917911/' },
    ],
    overallTier: 'strong',
    relatedIds: ['masld-overview', 'masld-fib4-fibrosis-screening'],
  },
  {
    id: 'pcos-combined-oral-contraceptives-first-line',
    category: 'pcos',
    title: 'Combined Oral Contraceptives Are the Real, Formal First-Line Treatment for PCOS Itself, Not Just Birth Control',
    teaser: 'Real current international guidelines name combined oral contraceptives the first-line treatment specifically for PCOS symptoms, with real trial data finding cycle regularity improved from 0% to 100% versus no treatment.',
    summary:
      "Combined oral contraceptive pills (COCPs) are worth knowing directly as PCOS's own real, formal, guideline-designated first-line pharmacologic treatment, not simply a birth control option that happens to also be used in PCOS. The real, current 2023 International Evidence-based Guideline for PCOS names combined oral contraceptives the first-line option specifically for managing irregular menstrual cycles and hirsutism (excess hair growth), the two hallmark symptoms already covered elsewhere in this app's own PCOS research. Real trial data finds a striking effect on cycle regularity specifically, 100% regularity with COCP treatment versus 0% with no medical treatment at all, alongside real improvements in quality of life and modest weight benefit. Worth stating honestly: real research finds the certainty of evidence for benefits beyond cycle regulation, and for potential adverse effects, genuinely low, meaning COCPs' status as first-line treatment rests partly on their own well-established general safety and efficacy record rather than PCOS-specific trial data at every level. A real, specific nuance worth knowing: combined regimens containing an antiandrogen component may reduce hyperandrogenism somewhat more effectively, but real research finds they carry a higher venous thrombotic event (blood clot) risk, so they aren't recommended as a first-line choice despite the theoretical androgen advantage. Worth knowing directly: this is real, useful context for anyone with PCOS being offered a birth control pill as treatment, it's not a generic prescription, it's the real, evidence-backed, guideline-recommended first-line therapy for the condition itself.",
    citations: [
      { source: 'Update to Guidelines for Treatment and Management of PCOS Using Combined Oral Contraceptive Pills, Endocrinology Advisor', url: 'https://www.endocrinologyadvisor.com/news/update-to-guidelines-for-treatment-and-management-of-pcos-using-combined-oral-contraceptive-pills/' },
      { source: 'Combined oral contraceptive pill compared with no medical treatment in the management of polycystic ovary syndrome: A systematic review, PMC10952804', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10952804/' },
    ],
    overallTier: 'strong',
    relatedIds: ['pcos-spironolactone-potassium', 'pcos-rotterdam-phenotypes'],
  },
  {
    id: 'pcos-ivf-real-outcomes',
    category: 'pcos',
    title: 'Real Fertility Data: Women With PCOS Actually Achieve Strong, Sometimes Better-Than-Average IVF Success Rates',
    teaser: 'A real study of over 1,300 PCOS patients found a 63.48% cumulative live birth rate through IVF, and PCOS patients showed higher live birth rates than matched controls even after adjusting for age and weight.',
    summary:
      "PCOS is a real, common cause of infertility (already covered through this app's own letrozole-and-ovulation-induction research), but real IVF outcome data offers a genuinely more hopeful picture than the diagnosis alone might suggest. A real study of 1,380 PCOS patients found a conservative cumulative live birth rate of 63.48% through IVF, and a real comparison of older PCOS patients (ages 35-46) against age- and weight-matched controls without PCOS found PCOS patients actually achieved a HIGHER cumulative live birth rate, 55.51% versus 38.02%, over two years of treatment. Real research finds this reflects a genuine, distinctive PCOS trait, better ovarian reserve and response to ovarian stimulation, which continues working in a woman's favor for IVF specifically even as PCOS's own real fertility challenges (irregular or absent ovulation) make natural conception harder. For those using the less invasive option first, intrauterine insemination (IUI), real research finds a live birth rate of 17.80% per cycle and 30.95% cumulative per patient. Worth knowing directly: this is real, genuinely encouraging data worth knowing early in a PCOS fertility conversation, rather than assuming PCOS automatically means a difficult or lower-probability path to a successful pregnancy through assisted reproduction, real outcomes, particularly through IVF, are often favorable.",
    citations: [
      { source: 'Comparison of Cumulative Live Birth Rate Between Aged PCOS Women and Controls in IVF/ICSI Cycles, PMC8505977', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8505977/' },
      { source: 'Factors affecting cumulative live birth rate after the 1st oocyte retrieved in polycystic ovary syndrome patients in women during IVF/ICSI-ET, PMC10571446', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10571446/' },
    ],
    overallTier: 'strong',
    relatedIds: ['pcos-pregnancy-real-complications-letrozole'],
  },
  {
    id: 'pcos-dairy-igf1-hyperandrogenism',
    category: 'pcos',
    title: 'Why Dairy Specifically Gets Singled Out in PCOS: a Hormonal Pathway, Not Just a Diet Trend',
    teaser: "Milk raises insulin and IGF-1 in a way that's chemically similar to eating straight sugar, and IGF-1 directly drives the same androgen excess PCOS is built on.",
    summary:
      "PCOS already centers on insulin resistance as its own dominant driver (see this category's own overview), and dairy earns its specific reputation through that exact same pathway. Drinking milk produces a measurable rise in insulin and insulin-like growth factor 1 (IGF-1), comparable in size to the response from a high-glycemic meal. IGF-1 isn't a passive bystander here: it stimulates the enzyme that converts testosterone into its more potent form, activates androgen production in both the ovaries and adrenal glands, and amplifies how strongly cells respond to the androgens already circulating. That's the same hormonal cascade behind PCOS's own acne, excess hair growth, and hair thinning. Not every dairy product behaves identically. Skim and whole milk both trigger a substantially stronger insulin/glycemic response than cheese does, likely because the liquid, rapidly-absorbed whey and casein proteins in milk itself are doing the work, rather than dairy fat or calcium generally. This doesn't mean dairy has to be eliminated outright. It means someone with PCOS whose skin or hair symptoms haven't responded to other changes has a genuine, mechanistic reason to specifically test whether milk itself, more than dairy as a whole, is a meaningful contributor.",
    citations: [
      {
        source: 'Role of insulin, insulin-like growth factor-1, hyperglycaemic food and milk consumption in the pathogenesis of acne vulgaris, Experimental Dermatology 2009 (Melnik & Schmitz)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/19709092/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['pcos-insulin-resistance-mechanism', 'pcos-spearmint-tea'],
  },
  {
    id: 'pcos-glp1-agonists-emerging',
    category: 'pcos',
    title: 'GLP-1 Medications Are Moving Into PCOS Treatment, Working Through the Same Insulin Pathway This Condition Is Built On',
    teaser: "A real randomized trial found combining semaglutide with metformin restored regular periods in 86.87% of women with PCOS, well above metformin alone.",
    summary:
      "GLP-1 receptor agonists (semaglutide, liraglutide, the same medication class already covered in this app's own Type 2 Diabetes and MASLD research) are increasingly being studied directly in PCOS, and the fit makes sense given this category's own overview: PCOS runs largely on insulin resistance, and GLP-1 medications work by improving exactly that. A real, randomized trial of 64 women with PCOS and overweight or obesity compared metformin alone against metformin plus semaglutide over 12 weeks, and found the combination significantly reduced body weight, improved insulin resistance, lowered inflammatory markers, and restored regular menstrual cycles in 86.87% of participants, alongside a real, higher natural pregnancy rate. An earlier, smaller trial comparing liraglutide directly against metformin found liraglutide produced greater weight loss and a more favorable reduction in visceral fat specifically. Worth knowing honestly: this is real, still-emerging evidence, mostly from smaller trials rather than the very large studies already available for GLP-1 use in general obesity or type 2 diabetes, and these medications aren't yet a standard, guideline-recommended first-line PCOS treatment the way combined oral contraceptives or metformin already are (see this category's own research on both). It's real, worth-knowing context for a conversation with a doctor, especially for someone whose PCOS symptoms haven't responded well to standard first-line options.",
    citations: [
      { source: 'Effects of combined metformin and semaglutide therapy on body weight, metabolic parameters, and reproductive outcomes in overweight/obese women with polycystic ovary syndrome, 2025', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12297736/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['pcos-weight-loss-modest', 'pcos-combined-oral-contraceptives-first-line', 'type2-glp1-sglt2-paradigm-shift'],
  },
  {
    id: 'pcos-amh-diagnostic-marker',
    category: 'pcos',
    title: 'A Real Blood Test Is Becoming Part of How PCOS Gets Diagnosed, Alongside the Existing Ultrasound',
    teaser: "Anti-Müllerian hormone (AMH) can't diagnose PCOS on its own, but a real, pooled analysis found it correctly identifies the condition about as often as the ultrasound-based test it's starting to supplement.",
    summary:
      "This category's own research already covers the Rotterdam criteria, the real, standard diagnostic framework requiring two of three features: irregular ovulation, clinical or lab evidence of excess androgens, and polycystic ovarian morphology on ultrasound. Anti-Müllerian hormone (AMH), a real hormone produced by small ovarian follicles, is increasingly used as either a substitute or a real, added data point for that ultrasound criterion. A real, large, pooled meta-analysis (68 studies) found AMH had a real sensitivity of 79% and specificity of 87% for diagnosing PCOS in adults, broadly comparable to how well the ultrasound-based criterion itself performs, with the real, practical advantage that a blood draw is more standardized and less operator-dependent than an ultrasound reading. The 2023 international evidence-based PCOS guideline now formally recommends AMH as an acceptable way to define polycystic ovarian morphology in adults. Worth knowing honestly, and directly stated in the guideline itself: AMH alone still isn't adequate to diagnose PCOS on its own, and real research finds it performs meaningfully less reliably in adolescents specifically, since normal, hormonally-active teenage ovaries can look similar to PCOS on this marker too. This is real, useful context for anyone navigating a PCOS diagnosis, worth understanding as one real piece of the diagnostic picture rather than either a magic single test or a marker with no real value.",
    citations: [
      { source: 'Anti-müllerian hormone as a diagnostic biomarker for polycystic ovary syndrome and polycystic ovarian morphology: a systematic review and meta-analysis, Fertility and Sterility 2024, PMID 38944177', url: 'https://pubmed.ncbi.nlm.nih.gov/38944177/' },
    ],
    overallTier: 'strong',
    relatedIds: ['pcos-rotterdam-phenotypes', 'pcos-ogtt-screening'],
  },
];
