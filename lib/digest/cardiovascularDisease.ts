import type { DigestEntry } from './types';

// Cardiovascular Disease -- 9 entries, added 2026-08-08 as this app's
// seventeenth real condition, and its seventh genuinely non-autoimmune one
// (after PCOS, CKD, MASLD, Type 2 Diabetes, IBS, and Migraine). Named
// directly in CLAUDE.md's own Beyond Hashimoto's research, and already
// touched from five separate angles across this app's existing content
// before this category ever existed: lupus's own real 50-fold heart-attack
// risk in young women, Hashimoto's own organ-systems entry on hypothyroid
// heart effects, PCOS's own lipid-panel/cardiometabolic entry, and both
// psoriasis's and rheumatoid arthritis's own self-advocacy entries on
// elevated cardiovascular risk. This category is the first place any of
// those five threads gets its own dedicated, general cardiovascular-disease
// content to link back to.
//
// This session's own WebSearch budget was already exhausted before this
// category's research began (confirmed via a direct tool-system message),
// so every citation here was found via WebFetch against real, findable
// pages -- MedlinePlus (already proven reliable throughout this whole
// build) plus direct PubMed fetches against real PMIDs. Two real research
// limits worth naming directly rather than hiding: the PREDIMED trial's own
// exact reported hazard ratio could not be independently re-confirmed this
// session (the trial's own real, genuine 2018 retraction-and-republication
// is confirmed and cited, but the abstract's results section itself could
// not be successfully fetched, and two follow-up attempts at a direct
// primary source both failed), so this category's own PREDIMED entry
// describes the trial's real design and real retraction story honestly
// without stating an unverified specific number; and a dedicated apoB
// (apolipoprotein B) deep-dive was considered and deliberately folded into
// the lipid-panel self-advocacy entry as a brief, honestly-scoped mention
// rather than given its own entry, since a specific primary citation for it
// could not be independently confirmed this session either.
export const CARDIOVASCULAR_DISEASE_ENTRIES: DigestEntry[] = [
  {
    id: 'cvd-overview',
    category: 'cardiovascularDisease',
    title: "Cardiovascular Disease: A Real Category With Real, Modifiable Risk Factors",
    teaser: "Heart disease remains the leading cause of death, and a real, substantial share of its risk factors are modifiable, including several that already show up elsewhere in this app.",
    summary:
      "Cardiovascular disease covers a real, wide range of conditions affecting the heart and blood vessels, most seriously coronary artery disease, heart attack, and stroke, and it remains the leading cause of death. Real, standard medical guidance names a specific, modifiable set of risk factors: a diet high in saturated fat, refined carbohydrates, and salt, physical inactivity, excess alcohol use, smoking, and chronic stress. A real, specific, second category of risk factors matters directly for anyone using this app: standard medical guidance explicitly names autoimmune and inflammatory diseases, chronic kidney disease, and metabolic syndrome among the real medical conditions that raise cardiovascular risk, a direct, documented bridge to several conditions already built out here. Lupus carries a real, striking, independently documented risk (see this app's own lupus research, covering a real 50-fold increased heart attack risk in young women with lupus compared to their peers). Hashimoto's own hypothyroidism has real, documented cardiovascular effects (see this app's own organ-systems research). Rheumatoid arthritis and psoriasis both carry real, independently elevated cardiovascular risk of their own (see each condition's own self-advocacy research). PCOS's own insulin-resistance-driven lipid changes are a real, direct cardiometabolic link too (see this app's own PCOS research). This category covers what's genuinely general to cardiovascular risk and its real, food-first management: diet patterns with real trial evidence, medication evidence that's more nuanced than commonly assumed, and self-advocacy around the lab tests and symptoms that matter most.",
    citations: [
      { source: 'Heart Disease, MedlinePlus, U.S. National Library of Medicine', url: 'https://medlineplus.gov/heartdiseases.html' },
    ],
    overallTier: 'strong',
    relatedIds: ['lupus-cardiovascular-risk', 'organ-cardiovascular', 'pcos-lipid-panel-cardiometabolic', 'psoriasis-advocacy-cardiovascular-metabolic', 'ra-advocacy-cardiovascular-risk', 'gout-urate-lowering-therapy', 'gout-metabolic-cluster-connection', 'vitamind-vital-trial-non-skeletal'],
  },
  {
    id: 'cvd-mediterranean-diet-predimed',
    category: 'cardiovascularDisease',
    title: "The Mediterranean Diet: Real Trial Evidence, With an Honest Retraction Story Worth Knowing",
    teaser: "One of the most influential cardiovascular-prevention trials ever run was retracted and republished after a real, corrected error was found. The corrected version still supports the same real conclusion.",
    summary:
      "PREDIMED (PREvención con DIeta MEDiterránea) is a real, large, landmark randomized controlled trial testing a Mediterranean diet, supplemented with either extra-virgin olive oil or mixed nuts, against a low-fat control diet for primary cardiovascular disease prevention in people at high cardiovascular risk but without diagnosed cardiovascular disease at the start. The real, honest part of this story worth knowing directly: the original 2013 publication was formally retracted in 2018 after real, identified irregularities in how some study sites randomized participants, and the trial was re-analyzed and republished the same year in the same journal with corrected statistical methods. This is a genuine, documented correction to a real, influential trial, not a case where the underlying finding was overturned, the corrected, republished analysis reached the same real, substantive conclusion: a Mediterranean diet supplemented with olive oil or nuts reduced major cardiovascular events compared to the control diet. Worth knowing plainly for anyone encountering an older reference to the original 2013 paper: the real, correct version to trust is the 2018 corrected republication, a real, useful example of how legitimate science self-corrects rather than a reason to distrust the underlying Mediterranean-diet evidence base, which remains real and substantial across many other independent studies too.",
    citations: [
      { source: 'Primary Prevention of Cardiovascular Disease with a Mediterranean Diet Supplemented with Extra-Virgin Olive Oil or Nuts (corrected and republished), PMID 29897866', url: 'https://pubmed.ncbi.nlm.nih.gov/29897866/' },
    ],
    overallTier: 'strong',
    relatedIds: ['dietfat-saturated-monounsaturated-honest'],
  },
  {
    id: 'cvd-dash-sodium',
    category: 'cardiovascularDisease',
    title: "DASH and Sodium: A Real, Specific Dietary Pattern Built Directly Around Blood Pressure",
    teaser: "DASH stands for Dietary Approaches to Stop Hypertension, and its own real sodium targets are specific enough to plan a real day of eating around.",
    summary:
      "The DASH diet (Dietary Approaches to Stop Hypertension) is a real, specific eating pattern developed and studied directly for its effect on blood pressure, built around vegetables, fruits, whole grains, and low-fat dairy, with reduced saturated fat and reduced sodium. Real, current guidance from the National Heart, Lung, and Blood Institute sets a specific standard sodium target of under 2,300mg a day, with a lower, more effective target of 1,500mg a day named directly for anyone with existing high blood pressure or genuinely wanting a stronger effect. This is a real, food-first, specific-numbers approach rather than a vague \"eat less salt\" suggestion, and it's a real, direct, practical complement to the Mediterranean-diet evidence in this category's own PREDIMED entry, both are whole-food, plant-forward patterns with real, independent cardiovascular trial support, rather than competing approaches.",
    citations: [
      { source: 'DASH Eating Plan, National Heart, Lung, and Blood Institute', url: 'https://www.nhlbi.nih.gov/education/dash-eating-plan' },
    ],
    overallTier: 'strong',
    relatedIds: ['magnesium-blood-pressure', 'potassium-sodium-balance'],
  },
  {
    id: 'cvd-statin-evidence',
    category: 'cardiovascularDisease',
    title: "Statins: A Real, Large, Consistent Evidence Base Behind a Commonly Debated Medication",
    teaser: "Few medications attract as much online debate as statins. The real, pooled trial evidence behind them is unusually large and consistent.",
    summary:
      "Statins are among the most studied medications in cardiovascular medicine, and a real, major meta-analysis from the Cholesterol Treatment Trialists' Collaboration, pooling 14 randomized trials and 90,056 participants, found a real, specific, quantified benefit: each 1 mmol/L reduction in LDL cholesterol achieved with a statin tracked with a real 12% reduction in all-cause mortality and a real 21% reduction in major vascular events (heart attack, stroke, and the need for a real revascularization procedure). This same real, large pooled analysis found no real increase in cancer risk associated with statin use, directly addressing one of the most commonly repeated online concerns about this medication class. Worth knowing plainly: this is a real, large, consistent body of evidence, not a single small trial, and it's offered here as real information to bring into a real conversation with a prescriber, not as a substitute for one, since real, individual factors (existing liver disease, muscle-related side effects, personal risk level) genuinely affect whether a statin makes sense for any one person.",
    citations: [
      { source: 'Efficacy and safety of cholesterol-lowering treatment: prospective meta-analysis of data from 90,056 participants in 14 randomised trials of statins, PMID 16214597', url: 'https://pubmed.ncbi.nlm.nih.gov/16214597/' },
    ],
    overallTier: 'strong',
    relatedIds: ['foodhistory-cholesterol-real-drivers', 'masld-statin-safety-myth', 'ckd-sharp-trial-statins'],
  },
  {
    id: 'cvd-aspirin-primary-prevention-reversal',
    category: 'cardiovascularDisease',
    title: "Daily Aspirin for Prevention: A Real, Documented Shift in Medical Guidance",
    teaser: "Daily low-dose aspirin was once widely recommended for cardiovascular prevention. A real, large trial helped change that guidance, for an honest, quantified reason.",
    summary:
      "The real, large ASCEND trial (15,480 adults with diabetes but no diagnosed cardiovascular disease) tested daily low-dose aspirin specifically for primary prevention, meaning prevention in people who haven't yet had a cardiovascular event. Over a real 7.4-year follow-up, aspirin reduced serious vascular events from 9.6% to 8.5% of participants, a real, genuine benefit, but it also increased major bleeding events from 3.2% to 4.1% of participants. Converted into real, concrete numbers: aspirin prevented roughly 85 additional vascular events while causing roughly 90 additional major bleeding events per 10,000 people treated over that same period, the trial's own authors stated plainly that \"the absolute benefits were largely counterbalanced by the bleeding hazard.\" This real, quantified, roughly even trade-off is the actual reason current guidance has shifted away from routinely recommending daily aspirin for primary prevention in people without existing cardiovascular disease, it's a real, individual risk-versus-benefit decision, not a settled yes-or-no answer, and it's a real, direct, honest example of why a medication that helps one real outcome can simultaneously carry a real, comparable cost in another.",
    citations: [
      { source: 'Effects of Aspirin for Primary Prevention in Persons with Diabetes Mellitus (ASCEND), PMID 30146931', url: 'https://pubmed.ncbi.nlm.nih.gov/30146931/' },
    ],
    overallTier: 'strong',
    relatedIds: ['cvd-omega3-honest-null'],
  },
  {
    id: 'cvd-omega3-honest-null',
    category: 'cardiovascularDisease',
    title: "Omega-3 Supplements for Prevention: A Real, Honest Null Result From a Large Trial",
    teaser: "The same real trial that reshaped aspirin guidance tested omega-3 supplements too, in the same population, at the same time, with a genuinely different result.",
    summary:
      "The same real ASCEND trial covered in this category's own aspirin entry also tested a daily 1g omega-3 fatty acid supplement, in the same 15,480 adults with diabetes and no diagnosed cardiovascular disease, over the same real 7.4-year follow-up. The real result here is a genuine, honest null: 689 serious vascular events (8.9%) in the omega-3 group versus 712 (9.2%) in the placebo group, a real rate ratio of 0.97 that did not reach statistical significance. This is worth reporting exactly as directly as a positive finding would be, a real, large, well-designed trial found no meaningful cardiovascular prevention benefit from omega-3 supplementation in this population, a genuinely different and more sobering result than the popular reputation omega-3 supplements often carry for heart health. Worth knowing alongside real, separate evidence already covered elsewhere in this app connecting dietary omega-3 intake (not supplements specifically) to other real outcomes, a supplement pill and a real dietary pattern are not automatically interchangeable, and this trial's own honest null result is specific to supplementation for this specific population and outcome, not a blanket statement about omega-3s overall.",
    citations: [
      { source: 'Effects of n-3 Fatty Acid Supplements in Diabetes Mellitus (ASCEND), PMID 30146932', url: 'https://pubmed.ncbi.nlm.nih.gov/30146932/' },
    ],
    overallTier: 'strong',
    relatedIds: ['cvd-aspirin-primary-prevention-reversal', 'omega36-tying-together'],
    chart: {
      title: 'ASCEND Trial: Serious Vascular Events Over 7.4 Years',
      unit: '%',
      data: [
        { label: 'Omega-3 group', value: 8.9 },
        { label: 'Placebo group', value: 9.2 },
      ],
      sourceNote: 'ASCEND trial, PMID 30146932 (15,480 participants)',
    },
  },
  {
    id: 'cvd-lipid-panel-self-advocacy',
    category: 'cardiovascularDisease',
    title: "The Lipid Panel: Real, Specific Testing Intervals, and a Note on What Standard Cholesterol Numbers Don't Capture",
    teaser: "How often a lipid panel actually needs repeating depends on real, specific factors like age and sex, not one blanket schedule for everyone.",
    summary:
      "Real, standard cholesterol-testing guidance sets specific intervals by age and risk: a first test between ages 9 and 11, then every 5 years through adulthood for most people, shifting to every 1 to 2 years for men 45 to 65 and women 55 to 65, and annual testing for adults over 65. Worth knowing directly for anyone with a condition already covered in this app that carries its own elevated cardiovascular risk (lupus, rheumatoid arthritis, psoriasis, and PCOS all do, see this category's own cross-links), a real conversation with a prescriber about testing more often than the general schedule above is a reasonable, specific thing to raise, not an overreaction. A real, separate, worth-knowing concept for that same conversation: apolipoprotein B (apoB), a real, specific protein present on every atherogenic (artery-damaging) lipid particle, is a genuinely well-evidenced, more direct measure of cardiovascular risk than LDL cholesterol alone, since it counts particles rather than just their cholesterol content -- see this app's own dedicated Basic Health entry on why that distinction actually matters, backed by a real, large, 52-country study. Worth raising directly by name in a real conversation with a prescriber, especially for anyone whose standard LDL number looks normal but who still carries other real risk factors.",
    citations: [
      { source: 'Cholesterol Levels: What You Need to Know, MedlinePlus, U.S. National Library of Medicine', url: 'https://medlineplus.gov/cholesterollevelswhatyouneedtoknow.html' },
    ],
    overallTier: 'strong',
    relatedIds: ['pcos-lipid-panel-cardiometabolic', 'foodhistory-apob-particle-count'],
  },
  {
    id: 'cvd-heart-attack-red-flags',
    category: 'cardiovascularDisease',
    title: "Heart Attack Red Flags: Real, Specific Symptoms, Including a Real, Documented Pattern That Differs by Sex",
    teaser: "Chest pain is the symptom most people expect. Real, documented evidence shows women often experience a genuinely different, easier-to-miss pattern.",
    summary:
      "Real, standard emergency guidance names a specific set of heart attack warning symptoms: chest discomfort (pressure, squeezing, or pain), shortness of breath, discomfort spreading to the upper body (arms, back, neck, jaw, or stomach), and a real cluster of accompanying symptoms including nausea, vomiting, dizziness, or a cold sweat. A real, specific, documented pattern worth knowing directly: women are more likely than men to experience atypical symptoms during a heart attack, most notably real, unusual fatigue, rather than the classic crushing chest pain pattern more commonly described in men, a real, documented reason heart attacks in women are more often missed or delayed in diagnosis. Worth knowing plainly and acted on immediately rather than waited out: any of these symptoms, especially in combination, warrant real, immediate emergency evaluation, not a wait-and-see approach, since real treatment for a heart attack is significantly more effective the sooner it starts.",
    citations: [
      { source: 'Heart Attack, MedlinePlus, U.S. National Library of Medicine', url: 'https://medlineplus.gov/heartattack.html' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'cvd-tying-together',
    category: 'cardiovascularDisease',
    title: "What Actually Holds Up for Cardiovascular Disease, Pulled Together",
    teaser: "A real, whole-food dietary pattern with genuine trial support, a commonly debated medication class with unusually strong evidence behind it, and two honest examples of guidance changing because a large trial said so.",
    summary:
      "Line up everything in this category and cardiovascular disease reads as a condition where real, whole-food dietary patterns (the Mediterranean diet, DASH) carry genuinely strong, trial-backed evidence, where statins carry a real, large, consistent evidence base despite their commonly debated reputation, and where two of the most significant recent shifts in cardiovascular guidance, daily aspirin for primary prevention and omega-3 supplementation, both came from the same real, large, honest trial finding that the numbers simply didn't support the older, more routine recommendation. That's worth sitting with directly: real medical guidance changing because real trial evidence said so is the system working honestly, not a reason for distrust. And for anyone managing one of the several other conditions in this app that carry their own documented, elevated cardiovascular risk (lupus, rheumatoid arthritis, psoriasis, PCOS, and Hashimoto's own hypothyroid effects all do), this category's own real, specific self-advocacy content, on lipid testing intervals and on recognizing a real emergency immediately, is worth treating as directly relevant, not background reading.",
    citations: [
      { source: 'Heart Disease, MedlinePlus, U.S. National Library of Medicine', url: 'https://medlineplus.gov/heartdiseases.html' },
    ],
    overallTier: 'strong',
    relatedIds: ['cvd-mediterranean-diet-predimed', 'cvd-statin-evidence', 'cvd-aspirin-primary-prevention-reversal', 'cvd-omega3-honest-null', 'cvd-lipid-panel-self-advocacy'],
  },

  // -- Full-depth parity additions, 2026-08-08. Every citation
  // independently verified via WebSearch.
  {
    id: 'cvd-heart-failure-abcd-staging',
    category: 'cardiovascularDisease',
    title: "Heart Failure Has a Real, Formal 4-Stage System -- and Stage A Applies to Real, Common Risk Factors Before Any Heart Damage Has Actually Happened",
    teaser: 'Stage A means genuinely no heart damage yet, just real risk factors like hypertension or diabetes already present -- the real, formal system moves one direction only, and never back.',
    summary:
      "Heart failure runs on a real, formal ACC/AHA 4-stage classification, genuinely different from how most people think of \"stages\" of illness: Stage A (\"at risk\") applies to someone with real, common risk factors, hypertension, diabetes, metabolic syndrome, or a family history of cardiomyopathy, but with NO actual heart damage yet, meaning a real, large share of this app's own audience already sits somewhere in this staging system without a heart failure diagnosis at all. Stage B (\"pre-heart failure\") means real, structural heart changes or elevated cardiac biomarkers are present, but still no actual symptoms. Stage C is real, symptomatic heart failure, current or past. Stage D is real, advanced, refractory heart failure requiring specialized intervention. The real, important structural fact worth knowing: this staging system moves in only one direction, someone can progress from Stage A to B to C, but real, current guidance treats these stages as NOT reversible backward, distinct from the NYHA functional class (a separate real measure of current symptom severity) which genuinely can improve with treatment even as the underlying ACC/AHA stage itself doesn't move back.",
    citations: [
      { source: '2022 AHA/ACC/HFSA Guideline for the Management of Heart Failure, Circulation', url: 'https://www.ahajournals.org/doi/10.1161/CIR.0000000000001063' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'cvd-kidney-brain-pad-real-data',
    category: 'cardiovascularDisease',
    title: "CVD's Own Real Reach Into the Kidneys, Brain, and Legs -- One Shared Disease Process Showing Up in Three Different Places",
    teaser: 'Real research finds peripheral artery disease affecting over 200 million people worldwide, and a real, direct link between vascular disease and dementia risk -- all one shared atherosclerotic process, not three separate diseases.',
    summary:
      "Cardiovascular disease's own real, underlying process, atherosclerosis, doesn't confine itself to the heart. Peripheral artery disease (PAD), real, obstructive atherosclerosis reaching the legs specifically, affects an estimated 200+ million people worldwide, and real research treats it as a direct marker of the SAME systemic process already elevating heart attack and stroke risk, not a separate, unrelated leg problem. Real, documented brain effects are just as direct: vascular disease in the brain's own arteries is a real, established contributor to vascular dementia, and real research finds atherosclerotic vascular disease independently linked to cognitive impairment, particularly when it shows up as POLYVASCULAR disease (affecting multiple vessel territories at once) or occurs alongside chronic kidney disease specifically, already covered in this app's own CKD research. This three-way overlap (heart, brain, kidney) is a real, direct reason CVD risk factors matter well beyond the heart alone, the same shared vascular process simply showing up wherever a person's own particular vulnerability happens to be greatest.",
    citations: [
      { source: 'Cardiovascular Prognosis in Patients with Peripheral Artery Disease and Approach to Therapy, PMC10740501', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10740501/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ckd-mineral-bone-cardiovascular-real-data'],
  },
  {
    id: 'cvd-history-milestones',
    category: 'cardiovascularDisease',
    title: "CVD's Own Real History: A Single, Ongoing Town Study That Built Modern Cardiology's Whole Risk-Factor Framework",
    teaser: '1948, 1987 -- one real, still-running study named the risk factors this app\'s own research is built on, and a real fungal extract became the drug that transformed treating them.',
    summary:
      "CVD's own real, modern understanding traces to a single, remarkably influential real project: the Framingham Heart Study, launched in 1948 to follow a large group of initially healthy people over time and identify what actually drove cardiovascular disease, at a moment when real, basic causes were still largely unknown despite CVD deaths having climbed steadily for decades. Real, seminal findings from this same still-running study first established smoking and high cholesterol as real, documented cardiovascular risk factors, the actual scientific foundation this app's own lipid-panel and statin research builds on. The real, transformative treatment breakthrough came decades later: Japanese scientist Akira Endo discovered the first statin compound (compactin) from a real fungal extract in 1976, and on September 1, 1987, lovastatin became the first statin approved by the FDA, a real, genuine revolution in treating high cholesterol that reached over $1 billion in annual sales, with several more statins (simvastatin, pravastatin, atorvastatin, rosuvastatin, all still in use today) following through the 1990s and early 2000s.",
    citations: [
      { source: 'History, Framingham Heart Study', url: 'https://www.framinghamheartstudy.org/fhs-about/history/' },
    ],
    overallTier: 'strong',
    relatedIds: ['cvd-statin-evidence'],
  },
  {
    id: 'cvd-pregnancy-mwho-ppcm',
    category: 'cardiovascularDisease',
    title: "Heart Disease and Pregnancy: A Real, Formal Risk-Classification System, and a Real, Pregnancy-Specific Heart Failure That Can Strike Someone With No Prior Heart Disease at All",
    teaser: "The mWHO classification runs from real, no-added-risk conditions to real conditions where pregnancy itself may not be advisable -- and peripartum cardiomyopathy is a genuinely different, real risk that doesn't require any pre-existing heart condition to begin with.",
    summary:
      "Pre-existing heart disease and pregnancy carry a real, formal risk-stratification system worth knowing by name: the modified WHO (mWHO) classification, running from Class I (real, no detectable added maternal risk) through Class II (real, small added risk) and Class III (real, significant risk requiring expert counseling and intensive monitoring) to Class IV (real, extremely high risk, where pregnancy itself may not be medically advisable). A real, second tool, CARPREG II, adds further precision, factoring in functional class, prior cardiac events, and specific findings like a mechanical heart valve or reduced ejection fraction. The real, genuinely distinct risk worth knowing separately: peripartum cardiomyopathy (PPCM), real heart failure that develops specifically in the last month of pregnancy through 5 months postpartum, striking people with NO prior heart disease at all, affecting a real, estimated 1 in 1,000 to 1 in 4,000 pregnancies. Real, encouraging recovery data exists too: a measured ejection fraction of 52% or higher, or a specific strain measurement below a real threshold, is associated with low real risk of PPCM recurring in a future pregnancy, worth knowing directly for anyone who has recovered from a first episode and is considering another pregnancy.",
    citations: [
      { source: 'Risk stratification and management of women with cardiomyopathy/heart failure planning pregnancy or presenting during/after pregnancy, PMID 33609068', url: 'https://pubmed.ncbi.nlm.nih.gov/33609068/' },
    ],
    overallTier: 'strong',
  },

  // -- Second depth pass, 2026-08-08, continuing the full-parity work
  // beyond the first structural pass. Every citation independently
  // verified via WebSearch.
  {
    id: 'cvd-cantos-inflammation-hypothesis',
    category: 'cardiovascularDisease',
    title: 'A Real, Landmark Trial Proved Cardiovascular Risk Can Be Lowered by Fighting Inflammation Alone, With No Cholesterol Change at All',
    teaser: 'The real CANTOS trial gave a pure anti-inflammatory drug to 10,061 heart attack survivors and found real, significant risk reduction -- with zero effect on cholesterol, directly separating inflammation from lipids as two real, independent levers.',
    summary:
      "This is a real, genuinely landmark finding worth understanding directly: the CANTOS trial (10,061 people who had already survived a heart attack, all with elevated hs-CRP, the same real inflammatory marker already covered in this app's own self-advocacy research) tested canakinumab, a drug that blocks a specific inflammatory signaling molecule (IL-1beta) and does essentially nothing to cholesterol. Real results at the effective dose found a significant reduction in major cardiovascular events (hazard ratio 0.85 versus placebo), while hs-CRP and IL-6 both dropped significantly and LDL cholesterol did NOT change at all. This is the first real, phase 3 trial evidence that inflammation itself, independent of cholesterol, is a genuine, directly treatable driver of cardiovascular risk, not just a marker that happens to travel alongside it. Worth knowing the honest, real limits too: the effect size was genuinely modest, there was no significant reduction in overall mortality, and the drug carried a real increased risk of fatal infection, real reasons this specific drug hasn't become standard practice despite the finding's own real scientific significance. The real, lasting takeaway isn't the drug itself, it's the concept it proved: inflammation and cholesterol are two real, separate, independently treatable pathways to cardiovascular risk, not one and the same thing.",
    citations: [
      { source: 'Antiinflammatory Therapy with Canakinumab for Atherosclerotic Disease, New England Journal of Medicine', url: 'https://www.nejm.org/doi/full/10.1056/NEJMoa1707914' },
    ],
    overallTier: 'strong',
    relatedIds: ['cvd-lipid-panel-self-advocacy'],
  },

  // -- Volumetric depth pass, 2026-08-08, continuing full-parity work
  // beyond the second structural depth pass, working toward Hashimoto's
  // own real 176-entry depth. Every citation independently verified via
  // WebSearch.
  {
    id: 'cvd-lipoprotein-a-underrecognized',
    category: 'cardiovascularDisease',
    title: 'Lipoprotein(a) Is a Real, Common, Almost Entirely Genetic Cardiovascular Risk Most People Have Never Been Tested For',
    teaser: 'A real, largely inherited cholesterol-like particle affects roughly 1 in 5 people worldwide, carries a real, independent stroke and heart-disease risk, and current guidelines recommend testing for it just once in a lifetime.',
    summary:
      "Lipoprotein(a), usually written Lp(a), is a real, genetically determined, cholesterol-carrying particle that behaves differently from the LDL and HDL already covered in this app's own lipid-panel self-advocacy research, and it's genuinely underrecognized in routine care. Real research finds elevated Lp(a) affects an estimated 20% of the global population, roughly 1.4 billion people, and high-quality epidemiological and genetic evidence supports a real, independent, causal role in coronary artery disease, peripheral artery disease, ischemic stroke, calcific aortic valve disease, and atrial fibrillation, on top of whatever a person's own LDL or total cholesterol already shows. Unlike LDL, Lp(a) levels are set almost entirely by genetics and stay stable throughout adult life, meaning real, current European Society of Cardiology guidance recommends testing for it just once, ever, not repeatedly like a standard lipid panel. Worth knowing directly, and worth raising by name: a normal LDL result does not rule out a real, elevated Lp(a)-driven risk, and knowing an elevated Lp(a) can meaningfully reclassify someone's overall cardiovascular risk and justify more intensive management of the OTHER, modifiable risk factors already covered in this app's own cardiovascular research, since Lp(a) itself isn't something diet or exercise can substantially move.",
    citations: [
      { source: 'Lipoprotein(a) is a Prevalent yet Vastly Underrecognized Risk Factor for Cardiovascular Disease, PMC10959503', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10959503/' },
      { source: 'Lipoprotein(a): the underutilized risk factor for cardiovascular disease, PMC6865184', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6865184/' },
    ],
    overallTier: 'strong',
    relatedIds: ['cvd-lipid-panel-self-advocacy'],
  },
  {
    id: 'cvd-cardiac-rehabilitation-underused',
    category: 'cardiovascularDisease',
    title: 'Cardiac Rehabilitation Cuts Real Mortality by Roughly a Quarter, Yet Fewer Than 1 in 3 Eligible People Ever Enroll',
    teaser: 'A real, structured, supervised exercise-and-education program after a heart event lowers cardiovascular mortality by around 26-31% in real meta-analyses, but global enrollment sits under 30%.',
    summary:
      "Cardiac rehabilitation, a real, structured program combining supervised exercise, education, and risk-factor counseling after a heart attack, heart surgery, or a heart failure diagnosis, carries some of the strongest mortality-reduction evidence of any intervention covered in this app's own cardiovascular research, and it's genuinely underused. Real meta-analyses find a 26% reduction in cardiovascular mortality at longest follow-up, with one analysis specifically finding a 27% reduction in all-cause mortality and 31% reduction in cardiac deaths among participants. The benefit is real and dose-dependent too, more sessions attended tracks with lower mortality, with real research suggesting a minimum of around 36 sessions may be needed for the strongest measurable benefit. Despite this real, well-established evidence, global enrollment in cardiac rehabilitation programs remains under 30% of people who would actually qualify for one. Worth knowing directly: anyone who has had a heart attack, stent, bypass surgery, or a heart failure diagnosis has a real, concrete reason to ask specifically about a referral to cardiac rehabilitation, not just general exercise advice, since the structured, supervised program itself is what the real mortality data is actually measuring.",
    citations: [
      { source: 'Exercise-based cardiac rehabilitation for coronary heart disease: a meta-analysis, European Heart Journal (Oxford Academic)', url: 'https://academic.oup.com/eurheartj/article/44/6/452/7028725' },
      { source: 'The Effectiveness of Cardiac Rehabilitation Programs in Improving Cardiovascular Outcomes: Systematic Review and Meta-Analysis, PMC11588675', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11588675/' },
    ],
    overallTier: 'strong',
    relatedIds: ['cvd-overview'],
  },
  {
    id: 'cvd-holiday-heart-alcohol-afib',
    category: 'cardiovascularDisease',
    title: '"Holiday Heart Syndrome": A Real, Named Pattern of Binge Drinking Triggering Atrial Fibrillation in Otherwise Healthy Hearts',
    teaser: 'Real research finds binge drinking can trigger real atrial fibrillation even in people with no underlying heart disease, most often 12-36 hours after the drinking episode ends, in a real, well-documented, named clinical pattern.',
    summary:
      "Holiday heart syndrome is a real, formally named clinical pattern, first described after doctors noticed a cluster of otherwise healthy patients developing atrial fibrillation (AFib) after weekend binge-drinking episodes, and it remains real and common in emergency rooms today. Real research finds alcohol serving as the precipitating factor in 35% to 62% of AFib cases seen this way, typically appearing 12 to 36 hours after binge drinking stops, notably during the withdrawal period rather than while actively intoxicated. The real, proposed mechanisms include acute alcohol raising sympathetic nervous system activity while reducing vagal tone, and alcohol increasing activity of specific calcium channels tied to atrial electrical instability. Genuinely important to know directly: this can happen even in people who rarely or never drink otherwise, and even in hearts with no pre-existing disease, meaning a single binge-drinking episode carries a real, immediate arrhythmia risk independent of someone's long-term drinking pattern. This connects directly to this app's own already-covered alcohol advisory research, adding a real, acute, rhythm-specific risk to the more familiar long-term cardiovascular concerns already discussed there.",
    citations: [
      { source: 'Holiday Heart Syndrome: A Literature Review, PMC11955153', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11955153/' },
      { source: 'Holiday Heart Syndrome, StatPearls / NCBI Bookshelf', url: 'https://www.ncbi.nlm.nih.gov/books/NBK537185/' },
    ],
    overallTier: 'strong',
    relatedIds: ['cvd-overview'],
  },

  // -- Volumetric depth pass batch 3, 2026-08-08, continuing toward
  // genuine volumetric parity with Hashimoto's own depth. Every citation
  // independently verified via WebSearch.
  {
    id: 'cvd-triglycerides-omega3-real-data',
    category: 'cardiovascularDisease',
    title: 'Triglycerides Are a Real, Distinct Cardiovascular Risk Marker, and Omega-3 Genuinely Lowers Them, Though the Full Benefit May Run Deeper',
    teaser: 'A real, purified EPA formulation cut major cardiovascular events by 25% in a landmark trial, a benefit real research finds too large to be explained by its own triglyceride-lowering effect alone.',
    summary:
      "Triglycerides are a real, distinct blood fat marker from the LDL cholesterol already covered in this app's own lipid-panel research, and real, elevated triglycerides carry their own independent cardiovascular risk. Real research finds omega-3 fatty acids genuinely and substantially lower triglycerides, a real daily intake of 3-4g combined EPA+DHA reducing triglyceride levels by 20-50% in people with elevated baseline levels, with one real trial finding a 27% reduction at the higher dose tested. The real, landmark REDUCE-IT trial tested a purified, high-dose EPA formulation (icosapent ethyl) specifically and found a real, striking 25% reduction in major cardiovascular events, distinguishing it directly from the honest, null omega-3 supplement findings already covered elsewhere in this app's own CVD research (which typically tested lower-dose, mixed EPA/DHA formulations). Genuinely important and honestly complicated: real research finds the size of this cardiovascular benefit disproportionately large compared to the triglyceride reduction alone, suggesting omega-3, at least in this specific purified, high-dose form, may work through additional real mechanisms, reduced blood pressure, an antithrombotic (clot-preventing) effect, improved inflammatory status, and better endothelial (blood vessel lining) function. Worth knowing directly: this is a real, meaningful nuance to the existing omega-3-and-heart-disease conversation, dose and formulation genuinely matter, and someone with elevated triglycerides specifically has a real, different evidence picture to discuss with a doctor than the general omega-3 supplement question already covered elsewhere in this app.",
    citations: [
      { source: 'Rounding the corner on residual risk: Implications of REDUCE-IT for omega-3 polyunsaturated fatty acids treatment in secondary prevention of atherosclerotic cardiovascular disease, PMC6727875', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6727875/' },
      { source: 'Dose-response effects of omega-3 fatty acids on triglycerides, inflammation, and endothelial function, PMC3138218', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3138218/' },
    ],
    overallTier: 'strong',
    relatedIds: ['cvd-omega3-honest-null', 'cvd-lipid-panel-self-advocacy'],
  },
  {
    id: 'cvd-resistant-hypertension-adherence',
    category: 'cardiovascularDisease',
    title: '"Resistant" High Blood Pressure Is Real, But Real Research Finds Medication Nonadherence Hiding Underneath a Striking Share of Cases',
    teaser: 'Real, repeated blood-tests-for-drug-levels research finds up to a third of people believed to be taking their blood pressure medication faithfully actually weren\'t, a real, honest complication before assuming a treatment itself has failed.',
    summary:
      "Resistant hypertension, blood pressure that stays elevated despite three or more medications, is real and affects a real, substantial 4.3-29.7% of treated hypertension patients depending on the population studied. Genuinely important to know honestly: real research finds medication nonadherence hiding underneath a striking share of these cases, one real study found repeated measurements of actual drug levels in the blood revealed nonadherence in a full third of patients who had previously been judged adherent through less rigorous monitoring (directly observed therapy). Real-world data finds this pattern consistently: one study found only 42% overall adherence among newly treated hypertensive patients, another found 45% of resistant hypertension patients showing poor adherence at baseline, and among patients using three or more blood pressure medications, real research found only 34% adherent and just 13.7% actually reaching their blood pressure target. Worth knowing directly, and genuinely reassuring in one sense: real research finds patients who ARE adherent show real, meaningfully greater blood pressure reductions than nonadherent patients, meaning the medications themselves generally do work when actually taken as prescribed. Worth knowing directly: before assuming truly resistant, treatment-refractory hypertension, it's worth honestly examining real, practical barriers to taking medication consistently (cost, side effects, complicated dosing schedules, simply forgetting), since real research finds this explains a meaningful share of what initially looks like resistant disease, and addressing it directly can be more effective than adding yet another medication.",
    citations: [
      { source: 'Nonadherence by Serum Drug Analyses in Resistant Hypertension: 7-Year Follow-Up of Patients Considered Adherent by Directly Observed Therapy, PMC9683683', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9683683/' },
      { source: 'Medication Adherence and Treatment-Resistant Hypertension in Newly Treated Hypertensive Patients in the UAE, PMC8584664', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8584664/' },
    ],
    overallTier: 'strong',
    relatedIds: ['cvd-dash-sodium'],
  },
  {
    id: 'cvd-women-underdiagnosis-gender-gap',
    category: 'cardiovascularDisease',
    title: 'Women Are Real, Systematically More Likely to Have Their Heart Disease Missed, Dismissed, or Undertreated',
    teaser: 'Real research found women under 55 seven times more likely than men to be sent home from the ER without proper cardiac testing, with women\'s own real, different symptom pattern a genuine part of why.',
    summary:
      "Women face a real, well-documented gender gap in how heart disease is recognized and treated, worth knowing directly rather than assumed to be a fully solved problem. Real research published in the Journal of the American Heart Association found women under 55 were seven times more likely than men to be sent home from the emergency room without proper cardiac testing. Real research finds women also less likely to receive diagnostic imaging, artery-opening procedures (percutaneous coronary intervention), and statin therapy, even when presenting with clinically comparable symptoms to men. A real, genuine part of the explanation: women's heart attack symptoms real, often differ from the classic crushing-chest-pain picture most diagnostic training is built around, real research finds women more likely to experience generalized discomfort alongside nausea, fatigue, back pain, palpitations, and shortness of breath, sometimes as real, intermittent symptoms lasting hours, days, or even weeks before a full event. Real research finds these less \"classic\" presentations directly contribute to delayed or compromised diagnosis, and that women's symptoms are more likely to be dismissed or minimized, particularly when described in vague or emotionally-expressed terms. Worth knowing directly: this is real, worth-naming-by-name context for any woman experiencing unusual, hard-to-pin-down symptoms alongside real cardiovascular risk factors, real self-advocacy (already covered elsewhere in this app's own research) matters here specifically because the standard diagnostic pattern wasn't built around women's own real, more varied presentation.",
    citations: [
      { source: 'Gender Disparities in Ischemic Heart Disease Management: Underdiagnosis in Women and Differences in Treatment, PMC12425171', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12425171/' },
      { source: 'Women Acute Myocardial Infarction—Identifying and Understanding the Gender Gap (WAMy-GAP): A Study Protocol, PMC11121322', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11121322/' },
    ],
    overallTier: 'strong',
    relatedIds: ['cvd-heart-attack-red-flags', 'pcos-long-term-cardiovascular-risk'],
  },
  {
    id: 'cvd-coronary-calcium-score',
    category: 'cardiovascularDisease',
    title: 'A Coronary Calcium Score of Zero Is Real, Useful Information, but It Has an Expiration Date',
    teaser: 'A coronary calcium scan can spot plaque before any symptom shows up, and a score of zero genuinely lowers risk, but a large MESA analysis found it isn\'t a lifetime guarantee.',
    summary:
      "A coronary artery calcium (CAC) scan is a low-radiation CT scan that directly counts calcium deposits in the heart's own arteries, a real, physical measure of plaque rather than an estimate built from risk-factor questionnaires alone. Large cohort studies, most notably the Multi-Ethnic Study of Atherosclerosis (MESA), have repeatedly found CAC adds real, independent predictive value on top of standard risk calculators like the pooled cohort equations, and a score of zero is genuinely useful: it identifies people at very low near-term risk and can reasonably de-escalate a decision about starting a statin. The honest nuance worth knowing: a real MESA analysis following 3,116 people with a baseline score of zero found that score doesn't hold indefinitely. About 19% of the 10-year coronary events in that whole cohort happened to people who still scored zero the last time they were checked, and once a repeat scan found any new calcium at all, it came before 55% of the future events and marked a real, roughly three-fold higher risk group. The estimated 'warranty period' for a zero score ran 3 to 7 years depending on sex, race and ethnicity, and was shorter specifically for anyone with diabetes. Worth knowing directly for someone whose family history or other risk factors leave real uncertainty about their own cardiovascular risk: a CAC scan is a real, concrete test to ask about, and a favorable score today is genuinely reassuring without being a permanent answer.",
    citations: [
      { source: "Warranty Period of a Calcium Score of Zero: Comprehensive Analysis From MESA, JACC: Cardiovascular Imaging 2021, PMID 33129734", url: 'https://pubmed.ncbi.nlm.nih.gov/33129734/' },
    ],
    overallTier: 'strong',
    relatedIds: ['cvd-lipid-panel-self-advocacy', 'cvd-lipoprotein-a-underrecognized'],
  },
  {
    id: 'cvd-atrial-fibrillation-anticoagulation',
    category: 'cardiovascularDisease',
    title: 'Atrial Fibrillation Raises Stroke Risk Fivefold, and a Real, Well-Studied Treatment Cuts Most of It Back',
    teaser: 'A real, large pooled analysis of 29 trials found blood thinners cut stroke risk in atrial fibrillation by roughly 60%, one of the more decisive treatment effects in all of cardiovascular medicine.',
    summary:
      "Atrial fibrillation (AFib), an irregular, often rapid heart rhythm originating in the heart's upper chambers, raises stroke risk on its own, since blood can pool and clot inside a heart that isn't beating in its normal, coordinated rhythm. A real, large meta-analysis pooling 29 randomized trials and over 28,000 participants found adjusted-dose warfarin reduced stroke by roughly 60% compared with no treatment, one of the largest, most consistent treatment effects found anywhere in cardiovascular medicine, with newer direct oral anticoagulants (the 'NOAC' or 'DOAC' class) showing comparably strong protection in later trials and generally easier day-to-day management than warfarin's own diet-and-monitoring requirements. Real, current clinical practice uses a specific, points-based tool, CHA2DS2-VASc, to decide who genuinely needs this protection, counting age, sex, and a specific list of real medical conditions (heart failure, high blood pressure, diabetes, prior stroke or clot, vascular disease) toward an actual treatment threshold rather than a vague 'high risk' judgment call. Worth knowing directly: real-world data has repeatedly found a genuine gap between this clear guidance and actual practice, with a meaningful share of people who score high enough to clearly benefit from anticoagulation not receiving it, often out of an understandable but not always well-calibrated worry about bleeding risk. Anyone diagnosed with AFib has real, concrete standing to ask directly where their own CHA2DS2-VASc score lands and what it means for their own treatment plan.",
    citations: [
      { source: 'Meta-analysis: antithrombotic therapy to prevent stroke in patients who have nonvalvular atrial fibrillation, Annals of Internal Medicine 2007 (Hart, Pearce, Aguilar), PMID 17577005', url: 'https://pubmed.ncbi.nlm.nih.gov/17577005/' },
    ],
    overallTier: 'strong',
    relatedIds: ['cvd-holiday-heart-alcohol-afib', 'cvd-heart-failure-abcd-staging'],
  },
  {
    id: 'cvd-polypill-primary-prevention',
    category: 'cardiovascularDisease',
    title: 'A Single Combination Pill Cut Major Cardiovascular Events by a Real, Substantial Margin in Two Large Trials',
    teaser: 'A real, 5-year trial of over 50,000 people found a fixed-dose combination pill (blood pressure medication, a statin, and aspirin) reduced major cardiovascular events by a real 34% versus standard lifestyle advice alone.',
    summary:
      "The 'polypill' idea is genuinely simple: combine several already-proven, low-cost cardiovascular medications (a blood-pressure drug, a statin, and often low-dose aspirin) into one single daily pill, specifically to make consistent, real-world adherence easier than juggling several separate prescriptions. Real, large trials have now tested this directly. The PolyIran trial, a real, pragmatic cluster-randomized study nested within a cohort of over 50,000 people, found a four-component polypill (aspirin, atorvastatin, hydrochlorothiazide, and either enalapril or valsartan) reduced major cardiovascular events by a real 34% over 5 years compared with lifestyle advice alone (5.9% versus 8.8% of participants affected), with no real increase in bleeding-related adverse events. A separate, real trial (TIPS-3) found adding aspirin to a similar polypill combination reduced its own composite cardiovascular endpoint by a real 31%. Worth knowing directly: this is real, large-scale evidence that the SIMPLICITY of taking one pill, not just which specific medications it contains, appears to genuinely improve outcomes, most plausibly by improving how consistently people actually take their medication day to day. This app's own already-covered evidence for each individual component (statins, DASH-style blood pressure management, low-dose aspirin's own real, honest tradeoffs) still applies, the polypill strategy is a real, practical delivery method worth knowing about, not a different set of medications.",
    citations: [
      { source: 'Effectiveness of polypill for primary and secondary prevention of cardiovascular diseases (PolyIran): a pragmatic, cluster-randomised trial, The Lancet 2019, PMID 31448738', url: 'https://pubmed.ncbi.nlm.nih.gov/31448738/' },
    ],
    overallTier: 'strong',
    relatedIds: ['cvd-statin-evidence', 'cvd-dash-sodium', 'cvd-aspirin-primary-prevention-reversal'],
  },
  {
    id: 'cvd-air-pollution-pm25-real-data',
    category: 'cardiovascularDisease',
    title: 'Fine Particle Air Pollution Carries a Real, Quantified, Independent Heart Attack Risk',
    teaser: 'A real meta-analysis found short-term spikes in PM2.5 air pollution measurably raised heart attack risk within days, and long-term exposure carried a substantially larger real, cumulative effect.',
    summary:
      "Fine particulate air pollution (PM2.5, particles small enough to be inhaled deep into the lungs and cross into the bloodstream) carries real, independently documented cardiovascular risk, distinct from and additive to the diet, medication, and lifestyle factors already covered in this category. A real meta-analysis of 34 studies found each 10 microgram-per-cubic-meter rise in short-term PM2.5 exposure tracked with a real, measurable 2.5% increase in heart attack risk within days, and a separate real meta-analysis found long-term exposure carried a substantially larger cumulative effect, a real 18% increase in heart attack risk per the same 10 microgram increment sustained over time. The real, proposed mechanisms include direct vascular inflammation, oxidative stress, and effects on the autonomic nervous system's own regulation of heart rhythm and blood pressure. Worth knowing honestly and in real, practical proportion: any single day's individual relative risk increase is genuinely modest, but real research finds that because hundreds of millions of people are continuously exposed, short-term PM2.5 spikes alone account for up to a real 5% of all heart attacks worldwide, a real, population-level burden from a widely shared, mostly involuntary exposure. Worth knowing directly: real, practical steps (checking a local air-quality index on high-pollution days, an indoor air filter, reducing outdoor exertion during genuine spikes) are a real, concrete, if modest, addition to this category's own already-covered cardiovascular risk-reduction levers.",
    citations: [
      { source: 'Association between PM2.5 and risk of hospitalization for myocardial infarction: a systematic review and a meta-analysis, BMC Public Health 2020, PMID 32164596', url: 'https://pubmed.ncbi.nlm.nih.gov/32164596/' },
    ],
    overallTier: 'strong',
    relatedIds: ['cvd-resistant-hypertension-adherence'],
  },
  {
    id: 'cvd-elderly-atypical-mi-presentation',
    category: 'cardiovascularDisease',
    title: 'Heart Attacks in Older Adults Often Skip Chest Pain Entirely, a Real, Documented Age Effect',
    teaser: 'Silent or atypical heart attacks make up more than 60% of cases in adults over 60, presenting as confusion, weakness, or falling rather than classic chest pain.',
    summary:
      "The 'classic' heart attack picture, crushing chest pain radiating down the arm, is genuinely less reliable with age. Silent myocardial infarctions (heart attacks with no recognized symptoms at the time) make up as much as 54% of all heart attacks in the general population and more than 60% in adults over 60, and the real reasons compound with age: autonomic nerve changes, cumulative damage to the heart's own sensory nerves from prior ischemia, a higher pain threshold, and overlapping cognitive or neurological conditions all blunt the classic warning signal. When an older adult does have a recognized heart attack, dyspnea (shortness of breath) is frequently the dominant symptom rather than chest pressure, and geriatric medicine has a real, specific pattern worth knowing directly: new confusion, unusual weakness, loss of appetite, or an unexplained fall can all be the presenting sign of a heart attack in an older person, standing in for the chest pain a younger patient would report. Real autopsy data underscores how easily this gets missed: in one large elderly series, the correct heart attack diagnosis had been made in life in fewer than half of cases, especially among the oldest patients. Worth knowing directly for anyone caring for or checking in on an older adult: a sudden change in mental clarity, energy, or balance deserves the same real urgency a chest-pain complaint would get, not a slower, wait-and-see response.",
    citations: [
      { source: 'Atypical manifestation of myocardial ischemia in the elderly, Clinics in Geriatric Medicine, PMID 24714791', url: 'https://pubmed.ncbi.nlm.nih.gov/24714791/' },
    ],
    overallTier: 'strong',
    relatedIds: ['cvd-heart-attack-red-flags', 'cvd-women-underdiagnosis-gender-gap'],
  },
  {
    id: 'cvd-global-seven-countries-mediterranean',
    category: 'cardiovascularDisease',
    title: 'The Seven Countries Study Found Southern Europe at 2-10% Heart Disease Prevalence, Northern Europe at 10-18%',
    teaser: 'A real, foundational multi-decade study directly comparing seven countries found cardiovascular disease running roughly twice as common in Northern Europe and North America as in Mediterranean southern Europe and Japan.',
    summary:
      "This app's own already-cited Mediterranean-diet research traces directly back to a real, foundational piece of international epidemiology: the Seven Countries Study, the first major research effort to directly compare cardiovascular disease rates across different countries and diets. Its real, 25-year follow-up data found cardiovascular disease prevalence running 2-10% in southern European (Mediterranean) countries, compared with 10-18% in northern European countries, a real, roughly two-to-fivefold difference, with Japan showing a similarly low rate to southern Europe. The real, documented explanation centers on diet: cohorts following a Mediterranean-style diet (high in olive oil, legumes, vegetables, and fiber, low in saturated fat) showed measurably lower cardiovascular risk and death rate, while cohorts eating a diet higher in saturated fat and lower in these protective foods showed the reverse. Worth knowing as this app's own explicit international-scope commitment: real, current global burden data shows this picture has genuinely shifted since the original study, cardiovascular disease burden is now rising fastest in low- and middle-income countries as diets and lifestyles shift toward the same Western pattern already linked to higher risk in the original northern-Europe cohorts, meaning the real, historical 'low-risk' regions of this original study aren't a fixed, permanent category, but a real, moving target tied to what people are actually eating today.",
    citations: [
      { source: 'How the Seven Countries Study contributed to the definition and development of the Mediterranean diet concept: A 50-year journey, Nutrition, Metabolism and Cardiovascular Diseases', url: 'https://www.nmcd-journal.com/article/S0939-4753(14)00347-0/abstract' },
      { source: 'Ancel Keys, the Mediterranean Diet, and the Seven Countries Study: A Review, PMC12027923', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12027923/' },
    ],
    overallTier: 'strong',
    relatedIds: ['cvd-overview', 'cvd-mediterranean-diet-predimed'],
  },
  {
    id: 'cvd-global-russia-post-soviet-crisis',
    category: 'cardiovascularDisease',
    title: "Russia Saw the Highest Cardiovascular Death Rate Ever Recorded Anywhere, and It Wasn't Fully About Diet",
    teaser: 'Real, documented cardiovascular mortality in Russia reached levels nearly four times higher than the US, a real crisis conventional risk factors like diet and cholesterol could not fully explain.',
    summary:
      "This category's own already-covered Seven Countries Study ties cardiovascular risk directly to diet, and Russia's own real, documented mortality crisis shows that story isn't the whole picture. Real data found premature cardiovascular death among Russian men reaching nearly 500 per 100,000, a real level never before observed anywhere in the world, roughly twice as high as the peak the United States ever reached even in the 1960s, and almost four times the equivalent US rate. This tracked closely with the fall of the Soviet Union: cardiovascular mortality in Eastern Europe was genuinely low as recently as the early 1960s, rose steadily through the following decades, then spiked sharply after the real, severe economic and social disruption following 1990. The real, honest complication worth naming directly: research finds a substantial share of this excess mortality can't be explained by the usual, already-covered cardiovascular risk factors (diet, cholesterol, blood pressure) alone, with real, separate research pointing toward psychosocial stress, alcohol, and non-ischemic cardiac damage as real, additional contributors specific to this crisis. Worth knowing directly: this is a real, important complication to keep alongside this category's own diet-focused Mediterranean research, cardiovascular risk is real and largely food-driven in most contexts already covered in this app, but a real, documented historical crisis shows that severe social and economic upheaval can independently drive cardiovascular mortality to levels diet alone doesn't explain.",
    chart: {
      title: 'Premature cardiovascular mortality, men (per 100,000)',
      unit: 'per 100,000',
      data: [
        { label: 'Russia (post-Soviet peak)', value: 500 },
        { label: 'United States (equivalent era)', value: 125 },
      ],
      sourceNote: 'The Epidemic of Cardiovascular Disease in Eastern Europe, New England Journal of Medicine',
    },
    citations: [
      { source: 'The Epidemic of Cardiovascular Disease in Eastern Europe, New England Journal of Medicine', url: 'https://www.nejm.org/doi/full/10.1056/NEJM199706263362614' },
      { source: "Why does Russia have such high cardiovascular mortality rates?, PMC7577103", url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7577103/' },
    ],
    overallTier: 'strong',
    relatedIds: ['cvd-global-seven-countries-mediterranean'],
  },
  {
    id: 'horizon-cvd',
    category: 'cardiovascularDisease',
    title: 'This Category\'s Own Named Blind Spot, Lipoprotein(a), Finally Has Real Drugs Being Tested Against It',
    teaser: 'This category already names lipoprotein(a) as a largely genetic risk factor with no real treatment, and two real drugs now in late-stage trials cut it by up to 95%, with real cardiovascular-outcome results expected as soon as 2026.',
    summary:
      "This category's own already-covered lipoprotein(a) research names a real, genuine gap directly: it's a largely genetic, roughly 20%-of-the-population cardiovascular risk factor most people are never even tested for, and until recently, no real treatment existed to lower it the way statins lower LDL cholesterol. That's now changing. Pelacarsen, a real drug that blocks the genetic instructions for making Lp(a) in the first place, lowered Lp(a) levels by roughly 80% in real Phase 2 testing, and is now in a real Phase 3 trial (HORIZON) enrolling 8,323 people with existing cardiovascular disease and high Lp(a), with real outcome data expected as soon as the first half of 2026. A real, second, newer drug, olpasiran, showed even more striking real Phase 2 results, cutting Lp(a) levels by more than 95%, and is now in its own real Phase 3 outcomes trial with 7,297 participants. Worth knowing directly: both drugs currently lower the LEVEL of Lp(a) in the blood, real, measured, and dramatic, but neither has yet proven in a completed real outcomes trial that doing so actually reduces heart attacks and strokes, the real, final, still-pending question both of these late-stage trials exist specifically to answer.",
    citations: [
      { source: 'Emerging therapies targeting lipoprotein(a): the next frontier in cardiovascular risk reduction', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12756449/' },
      { source: 'Ongoing Clinical Trials Targeting Lipoprotein(a), Family Heart Foundation', url: 'https://familyheart.org/lpa-clinical-trials' },
    ],
    overallTier: 'strong',
    relatedIds: ['cvd-lipoprotein-a-underrecognized'],
  },
  {
    id: 'horizon-cvd-colchicine',
    category: 'cardiovascularDisease',
    title: "A Real, Cheap, Century-Old Gout Drug Just Became the First FDA-Approved Anti-Inflammatory Heart Drug",
    teaser: "This category's own already-covered CANTOS trial first proved inflammation itself independently drives heart attacks. A real, low-dose, already-cheap drug just became the first medication ever approved specifically to act on that finding directly.",
    summary:
      "This category's own already-covered CANTOS trial was the first real proof that treating inflammation itself, independent of cholesterol, reduces cardiovascular events. Low-dose colchicine, a real, already well-known, inexpensive drug most commonly used for gout (already covered in this Digest's own Gout research), turned out to be the real, practical drug that finally translated that finding into an approved treatment. A real, large trial (LoDoCo2), randomizing 5,522 people with existing cardiovascular disease to 0.5mg colchicine daily or placebo, found a real 31% reduction in major cardiovascular events, heart attack, stroke, and the need for an artery-opening procedure, over a real, median follow-up of 28.6 months. It received real FDA approval in June 2023, becoming the first-ever anti-inflammatory drug specifically approved to reduce cardiovascular risk, distinct from every cholesterol-lowering drug already covered in this category. Worth knowing directly and honestly: colchicine's own real anti-inflammatory effect (measurably lowering CRP, already covered elsewhere in this app) is well established, but the field itself states plainly that the exact mechanism connecting that effect to fewer heart attacks isn't yet fully understood, real, working evidence ahead of a complete real explanation for why it works.",
    citations: [
      { source: 'U.S. FDA Approves First Anti-Inflammatory Drug for Cardiovascular Disease', url: 'https://www.dicardiology.com/content/us-fda-approves-first-anti-inflammatory-drug-cardiovascular-disease' },
      { source: 'Potential Impact of Colchicine on Atherosclerotic Cardiovascular Disease in the United States, PMC11872516', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11872516/' },
    ],
    overallTier: 'strong',
    relatedIds: ['cvd-cantos-inflammation-hypothesis', 'horizon-cvd'],
  },
  {
    id: 'cvd-post-mi-depression-mortality',
    category: 'cardiovascularDisease',
    title: 'Depression After a Heart Attack Is Real, Common, and Carries a Real Mortality Risk -- One That Treatment Genuinely Improves',
    teaser: 'Roughly two-thirds of heart attack patients report real depressive symptoms -- and a real, striking finding: untreated depression carries up to 90% higher one-year mortality than treated depression or no depression at all.',
    summary:
      'Real research finds a genuinely high depression burden right after a heart attack: roughly 65 percent of acute myocardial infarction patients report real depressive symptoms, with major depression present in 15 to 22 percent. Real, pooled data finds post-MI depression associated with a real, roughly doubled risk of all-cause mortality (odds ratio 2.25), and someone who is both depressed and already has cardiovascular disease carries a real 3.5-fold higher death risk than someone with cardiovascular disease alone. The real, most actionable finding in this whole entry: patients with untreated depression showed a real 70 to 90 percent higher one-year mortality risk after their heart attack than patients who were either not depressed or whose depression was actually treated -- a real, direct, hopeful reason to treat post-MI depression seriously, not dismiss it as an understandable but ultimately separate reaction to a frightening diagnosis. A real, honest caveat worth including: some methodologically robust studies have failed to find depression independently raising cardiac death risk after MI, and the real relationship appears genuinely complex, possibly concentrated specifically in the period immediately following the event rather than a fixed, permanent risk factor.',
    citations: [
      { source: 'Depression Is a Risk Factor for Mortality After Myocardial Infarction: Fact or Artifact?, Journal of the American College of Cardiology', url: 'https://www.jacc.org/doi/10.1016/j.jacc.2007.01.075' },
      { source: 'Depression Treatment and 1-Year Mortality After Acute Myocardial Infarction, Circulation', url: 'https://www.ahajournals.org/doi/10.1161/circulationaha.116.025140' },
    ],
    overallTier: 'strong',
    relatedIds: ['mentalhealth-overview', 'mentalhealth-when-to-seek-help'],
  },
  {
    id: 'cvd-potassium-salt-substitute-real-trial',
    category: 'cardiovascularDisease',
    title: 'A Real, 21,000-Person Trial Found a Simple Salt Swap Cut Stroke and Death Risk',
    teaser: "The Salt Substitute and Stroke Study replaced regular table salt with a potassium-enriched version in high-risk adults and found real, significant reductions in stroke, major cardiac events, and death.",
    summary:
      "This category's own already-covered DASH/sodium research shows reducing sodium intake genuinely lowers blood pressure, and a real, large, cluster-randomized trial (SSaSS, published in the New England Journal of Medicine) tested a genuinely practical way to do it at scale: swapping regular salt (100 percent sodium chloride) for a salt substitute (75 percent sodium chloride, 25 percent potassium chloride) in 20,995 Chinese adults with a stroke history or older age plus uncontrolled hypertension. The real results were significant across every major outcome tracked: reduced systolic blood pressure, and real, statistically significant reductions in stroke, major cardiovascular events, and total mortality, all from what amounts to changing which container of salt sits on the table. A real, follow-up analysis found the benefit specifically traced to both halves of the swap, less sodium and more potassium, each independently contributing to the blood-pressure reduction observed. Worth knowing directly: this is genuinely one of the largest, most practical, most directly actionable cardiovascular prevention trials in recent years, real evidence that a small, low-cost dietary substitution, not a new drug, produced a real, measured reduction in stroke and death in a real, high-risk population -- though the same potassium increase this trial relied on is worth checking against any existing kidney disease or potassium-sensitive medication, already covered elsewhere in this Digest.",
    citations: [
      { source: 'Effect of Salt Substitution on Cardiovascular Events and Death, New England Journal of Medicine, PMID 34459569', url: 'https://www.nejm.org/doi/full/10.1056/NEJMoa2105675' },
      { source: 'The contribution of sodium reduction and potassium increase to the blood pressure lowering observed in the Salt Substitute and Stroke Study, PMC11001572', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11001572/' },
    ],
    overallTier: 'strong',
    relatedIds: ['cvd-dash-sodium', 'ckd-potassium-restriction-reconsidered'],
  },
  {
    id: 'cvd-statin-nocebo-muscle-pain',
    category: 'cardiovascularDisease',
    title: "Statin Muscle Pain Is a Real Patient Experience, but Real, Blinded Trials Find It's Usually Not the Drug",
    teaser: "A real, large individual-participant meta-analysis found muscle symptoms occurred at the same rate on statins and placebo, when neither the patient nor the doctor knew which was which.",
    summary:
      "This category's own already-covered statin evidence is strong on real mortality and cardiovascular-event benefit, but muscle pain remains the single most common reason people stop taking one, and real research finds something genuinely counterintuitive underneath it. A real, large individual-participant-data meta-analysis of double-blind, placebo-controlled trials found muscle symptoms occurred at essentially the same rate in the statin group and the placebo group, and calculated that only about 1 in 15 muscle-symptom reports among people actually taking a statin were genuinely caused by the drug itself. The real, direct explanation is the nocebo effect, the same real phenomenon as a placebo effect but working in reverse, where expecting a side effect genuinely increases the odds of reporting one. Real research confirms this directly: when patients don't know whether they're taking a statin or a placebo, muscle-symptom reports match; when they do know, statin-group reports rise. A real, separate finding backs this further: most patients previously labeled statin-intolerant in ordinary practice tolerate the same drug fine under blinded conditions. Worth stating honestly and carefully: this doesn't mean statin-related muscle pain is never real for a given individual, only that real, controlled evidence finds it's usually not the pharmacological cause most people assume, worth discussing directly with a doctor (including a real, blinded rechallenge) before abandoning a drug with this category's own well-documented mortality benefit.",
    citations: [
      { source: 'Effect of statin therapy on muscle symptoms: an individual participant data meta-analysis of large-scale, randomised, double-blind trials, PMC7613583', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7613583/' },
      { source: 'The nocebo effect in the context of statin intolerance, PMID 27578103', url: 'https://pubmed.ncbi.nlm.nih.gov/27578103/' },
    ],
    overallTier: 'strong',
    relatedIds: ['cvd-statin-evidence'],
  },
  {
    id: 'cvd-cardiac-rehab-real-barriers-completion',
    category: 'cardiovascularDisease',
    title: "Why So Few People Actually Finish Cardiac Rehab, Once They're Even Referred",
    teaser: "This category's own already-covered cardiac-rehab mortality benefit is real and strong, but real research finds the gap between being eligible and actually completing the program is even wider than the enrollment numbers alone suggest.",
    summary:
      "This category's own already-covered cardiac rehabilitation research shows a real, substantial mortality benefit sitting largely unused, and real research digs further into exactly why. A real study of 16,159 eligible patients found only 44.3 percent were even referred to cardiac rehabilitation in the first place, and of those, just 11.2 percent went on to actually complete it, a real, much steeper drop-off than the overall enrollment figures alone suggest. Real, identified barriers, drawn from qualitative and quantitative research together, include a genuine lack of medical referral (31 percent), other concurrent medical problems (28 percent), the patient declining (11 percent), and simple geographic distance from the facility (9 percent). A real, separate study of heart failure patients specifically found 65 percent had never been enrolled at all. Real research also identifies who's most at risk of not finishing once started: living alone, having diabetes, or having depression (already covered elsewhere in this Digest) all independently predicted non-completion, while older age and COPD predicted never enrolling in the first place. Worth stating plainly: given this category's own already-covered real mortality benefit, the single most actionable finding here is that a lack of referral is the single largest identified barrier, meaning directly asking a cardiologist for a cardiac rehab referral, rather than waiting to be offered one, is a real, concrete step someone can take themselves.",
    citations: [
      { source: 'Cardiac Rehabilitation Completion Study: Barriers and Potential Solutions, PMID 36044761', url: 'https://pubmed.ncbi.nlm.nih.gov/36044761/' },
      { source: 'Increasing Cardiac Rehabilitation Participation From 20% to 70%: A Road Map From the Million Hearts Cardiac Rehabilitation Collaborative, PMC5292280', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5292280/' },
    ],
    overallTier: 'strong',
    relatedIds: ['cvd-cardiac-rehabilitation-underused', 'mentalhealth-overview'],
  },
];
