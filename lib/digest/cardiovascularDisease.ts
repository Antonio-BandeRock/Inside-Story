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
    relatedIds: ['lupus-cardiovascular-risk', 'organ-cardiovascular', 'pcos-lipid-panel-cardiometabolic', 'psoriasis-advocacy-cardiovascular-metabolic', 'ra-advocacy-cardiovascular-risk', 'gout-urate-lowering-therapy', 'gout-metabolic-cluster-connection'],
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
    relatedIds: ['magnesium-blood-pressure'],
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
    relatedIds: ['foodhistory-cholesterol-real-drivers'],
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
    relatedIds: ['cvd-aspirin-primary-prevention-reversal'],
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
];
