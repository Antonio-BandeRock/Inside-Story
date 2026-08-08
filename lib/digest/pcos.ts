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
    relatedIds: ['pcos-myo-dchiro-inositol', 'pcos-weight-loss-modest', 'type2-overview', 'type2-metabolic-syndrome-cluster'],
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
];
