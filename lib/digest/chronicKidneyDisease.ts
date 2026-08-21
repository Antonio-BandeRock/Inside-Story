import type { DigestEntry } from './types';

// Chronic Kidney Disease (CKD) -- 10 entries, added 2026-08-08 as this
// app's twelfth real condition, and its second genuinely non-autoimmune
// one (after PCOS). CKD is a real, progressive loss of kidney function,
// most commonly caused by diabetes and high blood pressure, named
// directly in CLAUDE.md's own Beyond Hashimoto's research as one of the
// "9 non-autoimmune candidates."
//
// CKD's own real dietary management is more directly food-restrictive
// than almost any other condition in this app -- potassium, phosphorus,
// sodium, and protein all carry real, specific management questions --
// but a genuinely important finding this category leads with is that one
// of the most commonly repeated pieces of CKD dietary advice, blanket
// potassium restriction, turns out to have surprisingly thin evidence
// behind it, the same kind of honest correction this app's own research
// has already made for other widely repeated claims (L-glutamine for gut
// permeability, low-fiber-during-a-flare in IBD).
//
// Distinct from organSystems.ts's own 'organ-kidney' entry, which covers
// real, measured hypothyroidism-driven kidney function decline for a
// Hashimoto's reader. This category cross-links to it and covers CKD as
// its own real, primary condition instead.
//
// Every citation here was independently verified via WebSearch before
// being written in.
export const CHRONIC_KIDNEY_DISEASE_ENTRIES: DigestEntry[] = [
  {
    id: 'ckd-overview',
    category: 'chronicKidneyDisease',
    title: 'Chronic Kidney Disease: A Staged Framework for Tracking Kidney Function Over Time',
    teaser: "Diabetes and high blood pressure are the most common causes. A five-category staging system exists specifically to track how far the damage has progressed.",
    summary:
      "Chronic kidney disease (CKD) is a progressive loss of kidney function over months to years, most commonly caused by diabetes and high blood pressure. Current KDIGO clinical guidelines diagnose CKD using two distinct measures together: estimated glomerular filtration rate (eGFR, how well the kidneys filter blood) and albuminuria (protein leaking into urine, measured as a urine albumin-to-creatinine ratio, or ACR). A diagnosis requires either an eGFR under 60 mL/min per 1.73m² or an ACR of 30 mg/g or higher, present for at least three months, distinguishing chronic disease from a temporary, resolving kidney issue. Staging runs from G1 (eGFR 90 or above, normal or high function but with other damage markers present) down through G3a, G3b, G4, to G5 (eGFR under 15, kidney failure). This category covers what's specific to actually managing CKD day to day, and one of its own most important findings directly challenges a piece of dietary advice repeated to nearly every CKD patient.",
    citations: [
      { source: 'Chronic Kidney Disease, MedlinePlus, U.S. National Library of Medicine', url: 'https://medlineplus.gov/chronickidneydisease.html' },
    ],
    overallTier: 'strong',
    relatedIds: ['organ-kidney', 'type2-overview', 'type2-metabolic-syndrome-cluster', 'gout-metabolic-cluster-connection', 'magnesium-toxicity-hypermagnesemia'],
  },
  {
    id: 'ckd-potassium-restriction-reconsidered',
    category: 'chronicKidneyDisease',
    title: 'Blanket Potassium Restriction: A Honest Correction to Some of the Most Common CKD Dietary Advice',
    teaser: "Nearly every CKD patient hears \"avoid bananas and oranges.\" A direct check of the evidence behind that advice found it surprisingly thin.",
    summary:
      "Restricting high-potassium foods (bananas, oranges, potatoes, tomatoes) is some of the most commonly repeated dietary advice given to CKD patients, and a direct check of the evidence behind it turns up an honest surprise: a 2017 review conducted for clinical guidelines found no actual trials evaluating dietary potassium restriction for managing hyperkalemia in CKD, and separate, more recent observational research found no association between dietary potassium intake and blood potassium levels in CKD populations at all. The 2020 KDIGO guidelines themselves went so far as to state the evidence was insufficient to support a graded recommendation either way. A emerging, more nuanced picture has taken its place: some research now suggests a liberalized, plant-based, high-fiber dietary pattern may actually support healthier potassium regulation, since dietary fiber and other food-matrix factors can help shift potassium into cells and increase its excretion through the bowel rather than the kidneys. This is not a claim that potassium never matters in CKD, hyperkalemia is a serious risk, especially in more advanced disease or when combined with certain medications (see this category's own dedicated entry). It's an honest correction: the specific, individual amount of dietary potassium restriction that's actually appropriate varies by person and by how advanced someone's CKD is, and a blanket \"avoid these foods\" list isn't well supported as a universal rule.",
    citations: [
      { source: 'Re-Thinking Hyperkalaemia Management in Chronic Kidney Disease, Beyond Food Tables and Nutrition Myths: An Evidence-Based Practice Review', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10780359/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['ckd-ace-arb-potassium-monitoring', 'potassium-deficiency-hypokalemia', 'potassium-toxicity-hyperkalemia'],
  },
  {
    id: 'ckd-phosphate-additives',
    category: 'chronicKidneyDisease',
    title: '"Hidden Phosphorus": Food Additives That Absorb Far More Efficiently Than the Same Mineral in Whole Food',
    teaser: 'Not all dietary phosphorus is created equal. The processed, additive form is absorbed at more than double the rate of the natural form, and it usually isn\'t listed on the label.',
    summary:
      "Phosphorus management is a central concern in CKD, since damaged kidneys can't clear excess phosphorus the way healthy ones do, and research finds an important distinction most general nutrition advice misses: not all dietary phosphorus behaves the same way in the body. Inorganic phosphate additives, used widely as preservatives in processed foods, fast food, canned and bottled drinks, and spreadable cheeses, are absorbed at over 90%, sometimes described as approaching 100%. Natural, organic phosphorus in whole plant foods, by contrast, is absorbed at only 20% to 50% (largely because it's bound in a form called phytate that the human digestive system can't fully break down), and even organic phosphorus in animal-based whole foods is absorbed at a more moderate 40% to 60%. The practical problem: unlike sodium, added phosphorus content isn't consistently required on nutrition labels, which is exactly why researchers describe it as \"hidden phosphorus.\" This is a meaningfully different concern from just \"how much phosphorus is in this food\", a minimally processed, naturally phosphorus-containing food and a processed food with additive phosphorus can carry a very different actual absorbed burden even at similar total phosphorus content on paper.",
    citations: [
      { source: 'Phosphate-based additives in processed foods: is excess exposure a cause for concern? A cross-sectional examination of the United States packaged food supply, American Journal of Clinical Nutrition', url: 'https://ajcn.nutrition.org/article/S0002-9165(25)00009-7/fulltext' },
    ],
    overallTier: 'strong',
    relatedIds: ['additive-phosphates'],
  },
  {
    id: 'ckd-protein-restriction-plant-based',
    category: 'chronicKidneyDisease',
    title: 'Low-Protein Diets in CKD: A Specific Range, With Evidence Favoring a Plant-Forward Approach',
    teaser: 'Not just "eat less protein." A specific gram-per-kilogram target, and an emerging reason where that protein comes from matters too.',
    summary:
      "Low-protein diets are an established cornerstone of managing moderate-to-advanced CKD, with research linking them to reduced proteinuria, better blood pressure control, and a slower decline in kidney function in both diabetic and non-diabetic CKD. The specific, commonly recommended range is 0.6 to 0.8 grams of protein per kilogram of body weight per day, a meaningful reduction from typical intake, not just a vague \"cut back\" suggestion. A more recent and specific finding adds a further layer: research comparing plant-based to animal-based low-protein diets finds plant-based approaches superior on several measured outcomes in advanced CKD, better nitrogen balance, better acid-base regulation, fewer uremic toxins produced, and a more favorable ratio of unsaturated to saturated fat. A ongoing randomized trial (the PLADO protocol) is specifically testing a plant-dominant low-protein diet (at least half of protein from plant sources) against standard renal-diet care in CKD stages 3 through 5. Worth knowing directly: a low-protein diet done well is a specific, structured intervention, best undertaken with a dietitian's guidance given the risk of malnutrition if protein is reduced without enough total calories or the right food choices to fill the gap.",
    citations: [
      { source: 'Plant-Based versus Animal-Based Low Protein Diets in the Management of Chronic Kidney Disease', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8621419/' },
    ],
    overallTier: 'strong',
    relatedIds: ['protein-toxicity-rabbit-starvation', 'protein-tying-together'],
  },
  {
    id: 'ckd-metabolic-acidosis-bicarbonate',
    category: 'chronicKidneyDisease',
    title: 'Metabolic Acidosis: A Less-Known CKD Complication, With a Simple, Evidence-Backed Fix',
    teaser: "Damaged kidneys lose some of their ability to keep the body's own acid-base balance steady. A inexpensive supplement helps.",
    summary:
      "As CKD progresses, the kidneys' own ability to properly balance the body's acid-base chemistry declines, producing a common complication called metabolic acidosis, which itself is linked to faster kidney function decline and muscle wasting. A meaningful body of trial evidence supports a simple, low-cost intervention: a review of 14 randomized controlled trials (2,037 patients total) found oral sodium bicarbonate supplementation improved measured kidney function (eGFR) and increased muscle mass in CKD patients with this complication. A dedicated trial (the UBI Study, CKD stages 3-5, 36 months) specifically tested whether correcting this acid-base imbalance preserved kidney function over the longer term, adding to the broader evidence base. This is worth knowing directly as an actionable, evidence-backed option, not experimental or fringe, worth asking a nephrologist about specifically if metabolic acidosis has been identified on labs, rather than assuming nothing more can be done once that finding shows up.",
    citations: [
      { source: 'Treatment of metabolic acidosis with sodium bicarbonate delays progression of chronic kidney disease: the UBI Study, Journal of Nephrology', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6821658/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'ckd-sglt2-inhibitors',
    category: 'chronicKidneyDisease',
    title: 'SGLT2 Inhibitors: A Major Recent Advance in Slowing CKD Itself',
    teaser: 'Originally built as a diabetes drug. Large trials found it directly protects the kidneys, in people with and without diabetes alike.',
    summary:
      "SGLT2 inhibitors (a class of medication originally developed to lower blood sugar in type 2 diabetes) turned out to carry an independent, significant kidney-protective effect of their own, one of the more important recent developments in CKD treatment. The CREDENCE trial found canagliflozin reduced the combined risk of kidney failure, doubling of creatinine, or kidney/cardiovascular death by 30% in CKD patients with type 2 diabetes, the first SGLT2 inhibitor trial specifically built around a kidney-disease outcome. The landmark DAPA-CKD trial then found dapagliflozin produced a 39% relative risk reduction in kidney-disease progression, and, notably, this benefit held in CKD patients without diabetes too, not just those with it, meaning the kidney-protective effect is real and independent of the drug's own original blood-sugar-lowering purpose. Further trials (EMPA-KIDNEY) have since confirmed this same kidney benefit with a second drug in the same class. Worth knowing directly as a major recent shift: this medication class is now recommended kidney-protective therapy in its own right for many CKD patients, not just a diabetes medication that happens to also help the kidneys as a side benefit.",
    citations: [
      { source: 'Dapagliflozin and prevention of adverse outcomes in chronic kidney disease (DAPA-CKD) trial: baseline characteristics', url: 'https://academic.oup.com/ndt/article/35/10/1700/5899227' },
    ],
    overallTier: 'strong',
    relatedIds: ['type2-glp1-sglt2-paradigm-shift', 'type1-sglt2-euglycemic-dka-risk'],
  },
  {
    id: 'ckd-anemia-erythropoietin',
    category: 'chronicKidneyDisease',
    title: "Anemia in CKD: A Dual Cause the Kidneys Themselves Are Responsible For",
    teaser: 'The kidneys make most of the hormone that signals red blood cell production. As they fail, that signal fades, and a second, separate deficiency often piles on.',
    summary:
      "Anemia in CKD has a dual cause, and the kidneys themselves are directly responsible for the first half of it: they produce roughly 90% of the body's own erythropoietin, the hormone that signals bone marrow to make red blood cells, so as kidney function declines, that signal weakens. Prevalence data tracks directly with disease stage: anemia affects about 17.4% of people in CKD stage 3, rising to 50.3% in stage 4, and 53.4% in stage 5. The second, separate contributing cause is iron deficiency, common on its own in CKD (present in a striking 68.6% of anemic female CKD patients and 53.8% of anemic male patients in one study), driven partly by impaired gut iron absorption. A honest gap worth knowing: despite how common and well-understood this complication is, treatment rates remain low, with one study finding only about 40% of anemic CKD patients receiving erythropoietin treatment and just 27% receiving iron. Worth asking directly whether both an iron panel and erythropoietin-related labs have been checked if fatigue or other anemia symptoms show up alongside a CKD diagnosis, rather than assuming one explains the other automatically.",
    citations: [
      { source: 'Anemia of Chronic Kidney Disease, A Narrative Review of Its Pathophysiology, Diagnosis, and Management', url: 'https://www.mdpi.com/2227-9059/12/6/1191' },
    ],
    overallTier: 'strong',
    relatedIds: ['iron-absorption-mechanism', 'iron-tying-together', 'ibd-iron-deficiency-anemia'],
  },
  {
    id: 'ckd-egfr-acr-monitoring',
    category: 'chronicKidneyDisease',
    title: "Tracking CKD Over Time: Why Both eGFR and Urine Albumin Matter, Together",
    teaser: 'One test alone tells an incomplete story. Current guidance tracks two different measures side by side.',
    summary:
      "Current KDIGO guidelines track CKD using two different measures together, not either one alone: eGFR (estimated glomerular filtration rate, from a blood creatinine test, reflecting how well the kidneys are actually filtering) and the urine albumin-to-creatinine ratio, or ACR (reflecting how much protein is leaking into urine, an early sign of kidney damage that can appear even when eGFR itself still looks normal). Guidance recommends using creatinine-based eGFR as the standard first approach, and, when available, combining creatinine with a second marker called cystatin C for a more precise estimate, since creatinine-based eGFR alone can be less accurate in some people (very muscular or very frail individuals, for example). Risk of CKD's own complications rises step by step with worse categories of both measures together, not just one, which is exactly why complete monitoring tracks both rather than either alone. Worth asking directly whether both numbers, not just one, are actually being checked and tracked over time at regular intervals, since either one alone can miss meaningful change the other would catch.",
    citations: [
      { source: 'KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease in Children and Adults', url: 'https://kdigo.org/wp-content/uploads/2024/03/KDIGO-2024-CKD-Guideline.pdf' },
    ],
    overallTier: 'strong',
    relatedIds: ['type2-sulfonylurea-hypoglycemia-ckd'],
  },
  {
    id: 'ckd-ace-arb-potassium-monitoring',
    category: 'chronicKidneyDisease',
    title: 'ACE Inhibitors and ARBs: Protective Medications With a Specific Monitoring Schedule',
    teaser: 'These first-line CKD medications are underused partly out of a fear that has a specific, manageable answer.',
    summary: "ACE inhibitors and ARBs are first-line medications for CKD, especially when protein is present in the urine, and carry kidney-protective benefit. They also carry a direct effect worth understanding clearly: both classes tend to raise blood potassium and can reduce eGFR somewhat when first started, a mechanism worth knowing alongside this category's own separate, honest correction on dietary potassium restriction, and the same broad hyperkalemia risk the PCOS research already covers for spironolactone. Current KDIGO guidance gives a specific, practical answer to managing that risk rather than avoiding these medications out of caution alone: check both eGFR and potassium within one week of starting or increasing the dose, regardless of the starting potassium level, then continue monitoring every three to six months under normal circumstances, and again during any acute illness. Research finds these medications underused in exactly the patients who'd benefit most, partly out of reluctance over this same manageable risk. Worth knowing directly: a brief rise in potassium or a modest early eGFR dip after starting one of these medications isn't automatically a reason to stop it, both are expected, trackable, and, per guidance, don't call for discontinuing the medication on their own.",
    citations: [
      { source: 'ACE inhibitors and ARBs: Managing potassium and renal function, Cleveland Clinic Journal of Medicine', url: 'https://www.ccjm.org/content/86/9/601' },
    ],
    overallTier: 'strong',
    relatedIds: ['ckd-potassium-restriction-reconsidered', 'potassium-toxicity-hyperkalemia', 'ckd-nsaid-kidney-injury-real-data'],
  },
  {
    id: 'ckd-tying-together',
    category: 'chronicKidneyDisease',
    title: 'What Actually Holds Up for CKD, Pulled Together',
    teaser: 'A honest correction to some of the most repeated dietary advice out there, a hidden additive worth knowing about, and a medication class that turned out to protect the kidneys directly, not just as a side effect.',
    summary:
      "Line up everything in this category and CKD reads as a condition where careful precision, not blanket restriction, is what the actual evidence supports. Blanket potassium restriction, some of the most commonly repeated CKD dietary advice anywhere, turns out to have surprisingly thin trial evidence behind it, while phosphate additives (\"hidden phosphorus,\" absorbed at over 90% versus 20-60% from whole food) deserve specific attention labels don't reliably provide. Protein restriction is real and evidence-backed, but works best at a specific gram-per-kilogram target, with evidence now favoring where that protein comes from, not just how much. Two medication-class stories round this out: SGLT2 inhibitors turned out to protect the kidneys directly, independent of their original diabetes purpose, and ACE inhibitors/ARBs remain first-line, protective medications whose own manageable potassium effect shouldn't be a reason to avoid them. And two quantified complications, metabolic acidosis (with a simple bicarbonate fix) and anemia (a dual kidney-hormone-and-iron cause), both argue for tracking CKD as the systemic condition it is, not narrowing the picture down to kidney function alone.",
    citations: [
      { source: 'Chronic Kidney Disease, MedlinePlus, U.S. National Library of Medicine', url: 'https://medlineplus.gov/chronickidneydisease.html' },
    ],
    overallTier: 'strong',
    relatedIds: ['ckd-potassium-restriction-reconsidered', 'ckd-phosphate-additives', 'ckd-protein-restriction-plant-based', 'ckd-sglt2-inhibitors', 'ckd-ace-arb-potassium-monitoring'],
  },

  // -- Full-depth parity additions, 2026-08-08. Every citation
  // independently verified via WebSearch.
  {
    id: 'ckd-g-a-staging-heat-map',
    category: 'chronicKidneyDisease',
    title: "CKD's Staging Grid: Two Numbers, Combined, Predict Risk Better Than Either Alone",
    teaser: "The KDIGO \"heat map\" combines a G-stage (1 through 5) with an A-stage (1 through 3) into a color-coded risk zone, worth knowing both numbers, not just one.",
    summary: "CKD's own staging goes further than the eGFR/ACR monitoring already covered in the self-advocacy content: KDIGO's classification combines a GFR category (G1: eGFR 90+; G2: 60-89; G3a: 45-59; G3b: 30-44; G4: 15-29; G5: under 15 or on dialysis) with an albuminuria category (A1: under 30 mg/g; A2: 30-300; A3: over 300) into a formal grid. The useful part is the KDIGO \"heat map\": rather than either number alone, the COMBINATION lands in a color-coded risk zone (green, yellow, orange, or red) that independently predicts all-cause mortality, cardiovascular mortality, kidney failure, and acute kidney injury risk better than eGFR alone. A practical example worth knowing: someone with a normal G1 eGFR but high A3 albuminuria already sits in the orange zone, elevated risk despite a filtration number that might otherwise look reassuring on its own, a direct reason both numbers matter together, not just the one more commonly discussed.",
    citations: [
      { source: 'Chronic Kidney Disease, StatPearls, NCBI Bookshelf', url: 'https://www.ncbi.nlm.nih.gov/books/NBK535404/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ckd-egfr-acr-monitoring'],
  },
  {
    id: 'ckd-mineral-bone-cardiovascular-real-data',
    category: 'chronicKidneyDisease',
    title: "CKD's Own Reach Into Bone and Heart: A 3-Fold Fracture Risk and a 10-Fold Cardiovascular Risk",
    teaser: 'A formally named syndrome (CKD-MBD) connects damaged kidneys to bone fragility and vascular calcification through one shared, disrupted hormone system.',
    summary: "CKD reaches well beyond the kidneys through a formally recognized syndrome called CKD-mineral and bone disorder (CKD-MBD), disrupted calcium, phosphate, parathyroid hormone, vitamin D, and FGF23 metabolism, already touched by the phosphate-additives research. Quantified consequences are substantial: people with CKD carry a 3-fold higher bone fracture risk and a striking 10-fold higher cardiovascular disease risk than the general population, with cardiovascular complications the leading cause of the elevated mortality CKD carries overall. The direct mechanism connecting the two: the same mineral dysregulation that weakens bone also drives vascular calcification, calcium deposits hardening blood vessels themselves, a physical link between bone fragility and heart disease that most people wouldn't intuitively connect. Additional documented symptoms (nausea, pruritus, bone pain, malnutrition) round out CKD-MBD's own wide systemic reach.",
    citations: [
      { source: 'Chronic Kidney Disease-Mineral Bone Disorder (CKD-MBD), StatPearls, NCBI Bookshelf', url: 'https://www.ncbi.nlm.nih.gov/books/NBK560742/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ckd-phosphate-additives', 'ckd-gut-derived-uremic-toxins'],
  },
  {
    id: 'ckd-history-milestones',
    category: 'chronicKidneyDisease',
    title: "CKD's Own History: A Machine Built From Sausage Casings and a Washing Machine, During Wartime Scarcity",
    teaser: "1943, 1960, before dialysis existed, a CKD diagnosis was a near-certain death sentence; Willem Kolff's own improvised wartime invention changed that.",
    summary:
      "Before 1943, advanced CKD was almost universally fatal, with no treatment able to do the kidneys' own job once they failed. Dutch physician Willem Kolff, after watching a young patient die slowly of kidney failure, spent the late 1930s developing an artificial kidney, and during wartime material scarcity, built his working device from improvised parts: sausage-casing cellophane tubing (20 meters of it), orange juice cans, and a washing-machine mechanism. In March 1943, using this improvised device, patient Janny Schroder became one of the first people treated, regaining consciousness from a uremic coma on April 4, 1943, the first documented recovery via hemodialysis. Kolff's own device still had a serious limitation: it required sacrificing a blood vessel for every single treatment, making repeated, ongoing dialysis impractical. That problem wasn't solved until 1960, when Wayne Quinton and Belding Scribner developed a reusable vascular access method in Seattle, the final piece that made CHRONIC (not just emergency) dialysis possible, opening the door to the ongoing kidney-replacement therapy still used today.",
    citations: [
      { source: 'Dr. Willem Kolff: The Father of the Artificial Kidney, PMC11466315', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11466315/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'ckd-pregnancy-preeclampsia-bidirectional',
    category: 'chronicKidneyDisease',
    title: "CKD and Preeclampsia in Pregnancy: A Bidirectional Risk That Runs Both Directions at Once",
    teaser: 'CKD raises preeclampsia risk as high as 79% in some studies, and preeclampsia itself then measurably accelerates long-term kidney decline afterward.',
    summary:
      "CKD and preeclampsia have a bidirectional relationship worth understanding as a two-way street, not a single risk running one direction. Research finds superimposed preeclampsia occurring in 21-79% of pregnancies with pre-existing CKD across different studies, with one cohort finding 55.8% affected, and risk running notably higher specifically in CKD stages 3-5 compared to stages 1-2. The less commonly discussed direction runs the other way: research found CKD patients who developed preeclampsia during pregnancy had a significantly higher rate of long-term eGFR decline (over 30%) or progression to end-stage kidney disease afterward, 42.72% versus 19.42% in those without preeclampsia, with EARLY-onset preeclampsia (before 34 weeks) carrying particularly elevated risk. This is a two-way relationship worth knowing directly before conception: existing CKD raises pregnancy risk, and a preeclampsia episode during that pregnancy can independently accelerate the underlying kidney disease afterward, a direct reason nephrology involvement matters both before and after delivery, not just during.",
    citations: [
      { source: 'The effect of preeclampsia on long-term kidney function among pregnant women with chronic kidney disease, PMID 39020253', url: 'https://pubmed.ncbi.nlm.nih.gov/39020253/' },
    ],
    overallTier: 'strong',
  },

  // -- Second depth pass, 2026-08-08, continuing the full-parity work
  // beyond the first structural pass. Every citation independently
  // verified via WebSearch.
  {
    id: 'ckd-dialysis-diet-reversal',
    category: 'chronicKidneyDisease',
    title: 'Starting Dialysis Reverses One of CKD\'s Own Core Dietary Rules, Protein Restriction Becomes Protein Requirement',
    teaser: 'The standard 0.6-0.8g/kg/day protein ceiling already covered for pre-dialysis CKD flips once dialysis starts, the treatment itself now strips protein out of the blood that has to be replaced.',
    summary: "This is an important shift worth knowing before it happens, not after: the already-established protein-restriction guidance (0.6-0.8g/kg/day, covered elsewhere in this category) applies specifically to PRE-dialysis CKD, protecting whatever kidney function still remains. Once dialysis actually starts, that logic reverses, since dialysis itself removes protein directly from the blood during each treatment, with peritoneal dialysis removing measurably more than hemodialysis. Current guidance for people on dialysis calls for MORE protein, not less, to replace what treatment itself takes out. Potassium and fluid restriction, by contrast, often intensify rather than reverse: someone on standard three-times-weekly hemodialysis has longer stretches between treatments for waste and fluid to build back up, meaning strict limits on both often become necessary in a way they weren't pre-dialysis. Worth knowing directly: a dietary plan that was correct for years of pre-dialysis CKD can become wrong once dialysis starts, a concrete reason this specific transition deserves its own direct conversation with a renal dietitian rather than assuming the old rules still apply.",
    citations: [
      { source: 'Healthy Eating for Adults with Chronic Kidney Disease, NIDDK', url: 'https://www.niddk.nih.gov/health-information/kidney-disease/chronic-kidney-disease-ckd/healthy-eating-adults-chronic-kidney-disease' },
    ],
    overallTier: 'strong',
    relatedIds: ['ckd-protein-restriction-plant-based', 'ckd-potassium-restriction-reconsidered'],
  },

  // -- Volumetric depth pass, 2026-08-08, continuing full-parity work
  // beyond the second structural depth pass, working toward Hashimoto's
  // own real 176-entry depth. Every citation independently verified via
  // WebSearch.
  {
    id: 'ckd-aristolochic-acid-herbal-nephrotoxin',
    category: 'chronicKidneyDisease',
    title: 'A Well-Documented Herbal Compound Can Cause Aggressive, Often Irreversible Kidney Failure',
    teaser: 'Aristolochic acid, found in some traditional Chinese herbal remedies and, historically, in a contaminated weight-loss supplement, causes a named kidney disease that can progress to failure and even urinary tract cancer, sometimes years after exposure stops.',
    summary:
      "Aristolochic acid nephropathy is an aggressive, and serious kidney disease caused by exposure to aristolochic acid, a compound found in some Aristolochia species used in certain traditional herbal remedies, and historically found as a contaminant in one infamous weight-loss supplement mix. Research finds it can cause both acute kidney injury (from a single high dose) and slower, progressive chronic kidney disease with interstitial fibrosis (from repeated lower-dose exposure), and close to 50% of documented cases required renal replacement therapy (dialysis or transplant). Alarming, and worth knowing directly: research finds kidney injury can continue progressing even AFTER the aristolochic acid source has been identified and removed, and the compound is also linked to an elevated risk of urothelial (urinary tract) cancer, not just kidney failure alone. Aristolochic acid is banned in most countries, but ongoing exposure still occurs through unregulated traditional medicine, unlicensed supplements, and, rarely, contaminated food. Worth knowing directly: this is a concrete reason for anyone with existing kidney disease, or anyone at all, to be cautious about unregulated herbal supplements specifically marketed for weight loss, joint pain, or \"detox,\" and to ask a doctor or pharmacist before starting any herbal product whose full ingredient sourcing isn't clearly verified.",
    citations: [
      { source: 'Chinese Herbs Containing Aristolochic Acid Associated with Renal Failure and Urothelial Carcinoma, PMC4241283', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4241283/' },
      { source: 'Experimental Aristolochic Acid Nephropathy: A Relevant Model to Study AKI-to-CKD Transition, PMC9115860', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9115860/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ckd-overview'],
  },
  {
    id: 'ckd-nsaid-kidney-injury-real-data',
    category: 'chronicKidneyDisease',
    title: 'NSAIDs Carry a Quantified Acute Kidney Injury Risk, Higher Still in Anyone Who Already Has CKD',
    teaser: 'A systematic review found current NSAID use raising acute kidney injury risk by about 73% in the general population and 63% in people who already have chronic kidney disease, an everyday-medication risk worth knowing by the numbers.',
    summary: "NSAIDs (ibuprofen, naproxen, and similar over-the-counter pain relievers) carry a quantified acute kidney injury (AKI) risk, not just a vague caution. A systematic review and meta-analysis found the pooled odds of AKI with current NSAID use in the general population at 1.73 (a 73% relative increase), rising to 2.51 in older adults specifically. In people who already have chronic kidney disease, the pooled risk was 1.63 (a 63% relative increase), with individual studies ranging as high as 5.25 depending on the population studied. Research finds NSAID-induced AKI itself is a strong, independent risk factor for the actual development and progression of chronic kidney disease, not just a temporary, reversible blip, meaning a single episode of NSAID-related kidney injury can have lasting consequences. The underlying mechanism involves NSAIDs blocking prostaglandins the kidneys depend on to maintain healthy blood flow, causing vasoconstriction and, in some cases, direct interstitial inflammation. Worth knowing directly: this connects straight to the already-covered diuretic/prescribing-cascade research for a different condition, since NSAIDs combined with diuretics or blood-pressure medications that affect the same kidney blood-flow pathway carry an additional, compounding risk, worth naming directly with a doctor or pharmacist for anyone managing CKD who reaches for an NSAID regularly.",
    citations: [
      { source: 'Non-steroidal anti-inflammatory drug induced acute kidney injury in the community dwelling general population and people with CKD: systematic review and meta-analysis, PMC5540416', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5540416/' },
      { source: 'NSAID-Induced acute kidney injury risk in patients on renin-angiotensin system inhibitors and diuretics: nationwide cohort study, PMC12359997', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12359997/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ckd-ace-arb-potassium-monitoring', 'gout-diuretics-prescribing-cascade', 'ra-nsaid-cardiovascular-risk'],
  },
  {
    id: 'ckd-gut-derived-uremic-toxins',
    category: 'chronicKidneyDisease',
    title: 'Gut Bacteria Directly Manufacture Two Toxins That Build Up as Kidney Function Declines',
    teaser: 'Indoxyl sulfate and p-cresyl sulfate, both made by gut bacteria breaking down protein, accumulate as kidneys lose the ability to clear them, driving oxidative stress, inflammation, and cardiovascular damage.',
    summary: "Chronic kidney disease has a direct gut-microbiome connection worth knowing about beyond diet alone: two specific compounds, indoxyl sulfate and p-cresyl sulfate, are gut-bacteria-manufactured uremic toxins, produced when certain gut bacteria (from families like Enterobacteriaceae and Clostridiaceae) ferment protein, and they accumulate in the blood as declining kidney function loses the ability to clear them. Research finds their accumulation directly promotes oxidative stress, systemic inflammation, and endothelial dysfunction, contributing to vascular damage and elevated cardiovascular risk in CKD, connecting directly to the already-covered CKD-cardiovascular-real-data research. A related finding worth knowing: CKD patients also show reduced levels of beneficial bacteria families, including Lactobacillaceae and Bifidobacteriaceae, the same bacterial families already covered favorably elsewhere in the gut-microbiome and fermented-foods research, alongside the rise in toxin-producing bacteria. Emerging interventions being studied to modulate this gut-kidney axis include dietary changes, prebiotics, probiotics, and fecal microbiota transplantation, though none are yet standard clinical practice. Worth knowing directly: this gives a mechanistic explanation for why the plant-forward, fiber-supportive dietary pattern already recommended elsewhere in the CKD protein-restriction research does double duty, supporting the same beneficial gut bacteria that compete against the toxin-producing ones, not just managing protein intake on its own.",
    citations: [
      { source: 'Gut-derived uremic toxins and cardiovascular health in chronic kidney disease, PMC12306874', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12306874/' },
      { source: 'The Gut-Kidney Axis in Chronic Kidney Diseases, PMC11719742', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11719742/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ckd-mineral-bone-cardiovascular-real-data', 'ckd-protein-restriction-plant-based'],
  },

  // -- Volumetric depth pass batch 4, 2026-08-08, continuing toward
  // genuine volumetric parity with Hashimoto's own depth. Every citation
  // independently verified via WebSearch.
  {
    id: 'ckd-contrast-induced-nephropathy',
    category: 'chronicKidneyDisease',
    title: 'Contrast Dye Used in CT Scans Carries a Manageable Kidney-Injury Risk for Anyone With CKD',
    teaser: 'Research finds contrast-induced kidney injury uncommon overall, developing in 3.7% of one large CKD cohort, but risk rises sharply below a specific eGFR threshold, worth flagging before any contrast scan.',
    summary: "Contrast dye, used to sharpen the images in a CT scan, carries a worth-knowing kidney injury risk specifically for anyone with existing chronic kidney disease, defined as a measurable worsening of kidney function within 24 to 48 hours of the procedure. Worth stating honestly first: research finds the overall risk of this happening is minimal for most people undergoing routine CT imaging, one study of 1,666 subjects found contrast-induced nephropathy developing in just 3.7% of cases, even among a CKD population. Research finds the risk concentrates specifically as kidney function drops further, rising noticeably once eGFR (already covered in the self-advocacy research) falls below roughly 36.8 mL/min/1.73m², with diabetes and low blood albumin identified as additional risk factors. Practical reassurance: a prophylaxis program (proper hydration protocols before and after the scan) run over 8 years found contrast-induced nephropathy manageable in stable CKD patients when this prevention step was followed. Worth knowing honestly: research finds contrast-induced nephropathy itself didn't increase mortality, but patients who did develop it were significantly more likely to need dialysis within the following 6 months. Worth knowing directly: this is a worth-raising conversation before any contrast-enhanced CT scan for someone with CKD, hydration protocols and, in some cases, choosing a non-contrast alternative imaging method are established ways to manage this risk rather than avoid necessary imaging altogether.",
    citations: [
      { source: 'Contrast-Induced Nephropathy After Computed Tomography in Stable CKD Patients With Proper Prophylaxis: 8-Year Experience, PMC4863791', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4863791/' },
      { source: 'Contrast-Induced Acute Kidney Injury Among Patients With CKD Undergoing Imaging Studies: A Meta-Analysis, AJR', url: 'https://ajronline.org/doi/10.2214/AJR.19.21309' },
    ],
    overallTier: 'strong',
    relatedIds: ['ckd-egfr-acr-monitoring'],
  },
  {
    id: 'ckd-cognitive-decline-dementia-risk',
    category: 'chronicKidneyDisease',
    title: 'CKD Is a Strong, Independent Risk Factor for Cognitive Decline, Worse as Kidney Function Falls Further',
    teaser: 'A study found cognitive-impairment risk more than doubled at the lowest kidney-function level tested, and a faster rate of eGFR decline carried over five times higher risk of developing vascular dementia.',
    summary: "Chronic kidney disease carries an independently documented risk for cognitive decline and dementia, worth knowing about directly beyond the more familiar cardiovascular and mineral-bone complications already covered elsewhere in the CKD research. Research finds CKD one of the strongest risk factors for mild cognitive impairment and dementia in large, population-based studies, with its impact exceeded only by stroke and chronic anti-anxiety medication use in one 6-year study. Dose-response data makes the pattern concrete: a study of 3,679 community-dwelling adults found new cognitive impairment rates of 5.8%, 9.9%, and 21.5% across three declining kidney-function groups, with the lowest-function group carrying a 2.14 times higher risk than the highest. Striking: research found people whose eGFR declined by 4 mL/min/1.73m² or more per year had a 5.35 times higher risk of developing vascular dementia over 7 years compared to those with a slower decline. Proposed mechanisms include uremia-driven chronic inflammation, oxidative stress, vitamin D deficiency, anemia (already covered in the CKD research), and impaired clearance of amyloid-beta, the same protein implicated in Alzheimer's disease. Worth knowing directly: this connection persists even after accounting for other established dementia risk factors like smoking, hypertension, and diabetes, meaning CKD itself deserves direct attention as a modifiable piece of long-term cognitive health, not just kidney health on its own.",
    citations: [
      { source: 'Kidney disease as a determinant of cognitive decline and dementia, PMC4360943', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4360943/' },
      { source: 'Kidney Function, Kidney Function Decline, and the Risk of Dementia in Older Adults, Neurology', url: 'https://www.neurology.org/doi/10.1212/WNL.0000000000012113' },
    ],
    overallTier: 'strong',
    relatedIds: ['ckd-mineral-bone-cardiovascular-real-data'],
  },
  {
    id: 'ckd-depression-underrecognized',
    category: 'chronicKidneyDisease',
    title: 'Depression Affects Roughly a Quarter of People With CKD, and Research Finds It Undertreated',
    teaser: 'Research finds depression tied directly to worse CKD progression, more hospitalizations, and higher mortality, yet clinical practice still gives it far less attention than the disease\'s own physical management.',
    summary:
      "Depression is a common, and underrecognized companion to chronic kidney disease, worth knowing about directly since it carries measurable consequences for the disease itself, not just quality of life. Research finds depression prevalence ranging from roughly a quarter to half of CKD patients depending on the study, with major depressive disorder specifically affecting about 20% of people with CKD or kidney failure. Research finds this burden rises with disease severity, one study found depression in 29.9% of people on chronic hemodialysis versus 18.5% in earlier, pre-dialysis stages. Important: research finds depressive symptoms an underrecognized but potentially modifiable risk factor independently associated with faster CKD progression, kidney transplant failure, more hospitalizations, more cardiovascular events, and higher mortality, a direct link between mental health and physical disease outcome, not a separate, parallel concern. Research finds a plausible, concrete mechanism behind part of this: depression can undermine a person's ability to stick with the dietary, fluid, and medication requirements CKD management demands. Worth knowing directly: clinical guidance explicitly calls depression a priority that current CKD management still doesn't give adequate attention to, someone with CKD experiencing persistent low mood, hopelessness, or loss of motivation for their own self-care has an evidence-backed reason to raise it directly with their nephrology team, not treat it as a separate issue for a different doctor.",
    citations: [
      { source: 'Global prevalence of depression in chronic kidney disease: a systematic review and meta-analysis, PMID 38954184', url: 'https://pubmed.ncbi.nlm.nih.gov/38954184/' },
      { source: 'A Practical Primer on How to Detect and Treat Depression in CKD, American Journal of Kidney Diseases', url: 'https://www.ajkd.org/article/S0272-6386(25)01158-8/fulltext' },
    ],
    overallTier: 'strong',
    relatedIds: ['ckd-overview'],
  },
  {
    id: 'ckd-sharp-trial-statins',
    category: 'chronicKidneyDisease',
    title: 'The Largest Trial of Cholesterol-Lowering in CKD Found a Benefit, With One Exception',
    teaser: 'A 9,270-patient trial found lowering LDL cholesterol cut major cardiovascular events by 17% in people with CKD, but the benefit didn\'t hold for people already on dialysis specifically.',
    summary:
      "Cardiovascular disease is a leading cause of death in CKD, well before kidney failure itself becomes the bigger threat, so a direct question worth answering is whether standard cholesterol-lowering treatment actually helps this specific population the way it helps the general population. The SHARP trial, the largest trial ever run on this question (9,270 participants, split between people with CKD not yet on dialysis and people already on it), tested simvastatin plus ezetimibe against placebo. The headline result: a 0.85 mmol/L average LDL reduction tracked with a 17% reduction in major atherosclerotic events (heart attack, stroke, and the need for an artery-opening procedure) across the trial as a whole. Worth knowing honestly, and directly relevant to anyone already on dialysis: subgroup analysis found the benefit was clearly present in the earlier-stage CKD group but less certain in the dialysis-dependent group specifically, an honest limitation this trial's own authors and later reviews have both noted rather than glossed over. This is large-scale evidence that cholesterol management remains a worthwhile part of CKD care for most people with the condition, while being honest that its own strength varies by how advanced the kidney disease already is, a concrete reason to ask directly where a specific treatment's own evidence is strongest for a given stage of CKD.",
    citations: [
      { source: 'The effects of lowering LDL cholesterol with simvastatin plus ezetimibe in patients with chronic kidney disease (Study of Heart and Renal Protection): a randomised placebo-controlled trial, The Lancet 2011, PMID 21663949', url: 'https://pubmed.ncbi.nlm.nih.gov/21663949/' },
    ],
    overallTier: 'strong',
    relatedIds: ['cvd-statin-evidence', 'ckd-mineral-bone-cardiovascular-real-data'],
  },
  {
    id: 'ckd-fiber-intake-inflammation',
    category: 'chronicKidneyDisease',
    title: 'Dietary Fiber Has Measured Evidence Behind the Gut-Toxin Mechanism This Category Already Names',
    teaser: 'Trials find fiber supplementation measurably lowers two specific gut-derived uremic toxins already covered in this category\'s own research, not just a general "eat more fiber" gesture.',
    summary: "This category's own research already covers how gut bacteria manufacture uremic toxins, indoxyl sulfate and p-cresyl sulfate specifically, that build up as kidney function declines. Controlled trial evidence gives a concrete, food-first lever against exactly that mechanism: a meta-analysis of randomized controlled trials found dietary fiber supplementation significantly reduced both indoxyl sulfate and p-cresyl sulfate levels in CKD patients, with a separate, broader systematic review also finding reductions in inflammatory markers (IL-6 most consistently, TNF-alpha in some studies) tracking with higher fiber intake. The underlying mechanism ties directly to the gut-microbiome research: fermentable fiber feeds beneficial gut bacteria that produce short-chain fatty acids instead of the protein-fermentation byproducts that become these same uremic toxins, shifting what the gut's own bacterial population is doing with a person's food. Worth knowing honestly: current, CKD nutrition guidelines don't yet include a formal fiber-intake recommendation, a gap between what the trial evidence already shows and what standard clinical guidance has caught up to codify. This is actionable, food-first context worth raising directly with a renal dietitian, especially alongside this category's own already-covered protein and potassium guidance, since fiber-rich foods and protein-restriction goals can be planned together rather than treated as separate concerns.",
    citations: [
      { source: 'The Role of Dietary Fiber Supplementation in Regulating Uremic Toxins in Patients With Chronic Kidney Disease: A Meta-Analysis of Randomized Controlled Trials, PMID 33741249', url: 'https://pubmed.ncbi.nlm.nih.gov/33741249/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ckd-gut-derived-uremic-toxins', 'gut-scfa-treg'],
  },
  {
    id: 'ckd-age-adapted-egfr-debate',
    category: 'chronicKidneyDisease',
    title: "A Unsettled Debate: Should 'Normal' Kidney Function Be Judged Differently by Age?",
    teaser: 'Large-cohort data finds a substantial share of otherwise healthy people over 65 already score below the standard CKD threshold, a reason some nephrologists argue CKD is being overdiagnosed in older adults.',
    summary:
      "This category's own already-covered G-A staging system uses one fixed eGFR threshold (60) to define CKD, regardless of age. Large-scale data finds a problem with that: kidney filtration rate declines as a normal, expected part of aging, even with no kidney disease present, and an analysis of over 1.5 million healthy Europeans found a substantial share of people over 65 already score below that same standard threshold, evidence the 90th percentile of eGFR at age 65 sits at only 90, meaning most healthy 65-year-olds are already well below what a younger adult would consider normal, let alone the CKD cutoff itself. Some nephrologists argue this leads to overdiagnosis in older adults, with a separate large study finding people over 65 with a mildly reduced eGFR (45-59) and little to no protein in their urine had a risk of death similar to, and higher than, their risk of ever actually reaching kidney failure, suggesting the label itself may carry more alarm than the actual biological reality warrants for many older adults. Worth knowing honestly: this is a still-unsettled debate, not a case with one clearly right answer, some proposals call for age-adjusted eGFR percentiles instead of one fixed number. Worth knowing directly: an older adult told they have 'CKD' based on eGFR alone, with no protein in the urine and no other red flag, has legitimate standing to ask whether that finding reflects disease or the normal, expected kidney aging this same research describes.",
    citations: [
      { source: 'Age-adapted versus age-independent eGFR thresholds to diagnose CKD: integrating the debate and charting a balanced path forward, Clinical Kidney Journal 2025', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12612672/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['ckd-g-a-staging-heat-map', 'ckd-egfr-acr-monitoring'],
  },
  {
    id: 'ckd-global-ckdu-central-america-sri-lanka',
    category: 'chronicKidneyDisease',
    title: 'A Distinct Kidney Disease Epidemic Strikes Agricultural Workers in Specific Hot Regions, With None of the Usual Causes',
    teaser: 'CKDu, a documented kidney disease striking sugarcane and rice farmworkers in Central America and Sri Lanka, shows up without diabetes, high blood pressure, or any other standard risk factor already covered in this category.',
    summary:
      "Nearly everything else in this category ties CKD to a familiar cause, diabetes, high blood pressure, or an autoimmune process. A distinct, regionally concentrated form doesn't. Chronic kidney disease of unknown origin (CKDu) is a documented epidemic striking agricultural communities specifically in Central America (El Salvador, Nicaragua, Costa Rica, often called Mesoamerican nephropathy when it affects Pacific-coast sugarcane workers) and Sri Lanka, and its defining feature is that it occurs WITHOUT the standard risk factors, no diabetes, no hypertension, no glomerulonephritis, a meaningfully different disease pattern from typical CKD. The damaged tissue pattern (chronic tubulointerstitial nephritis with scarring) also looks different under the microscope than typical diabetic or hypertensive kidney damage. Research points to a converging set of regional risk factors rather than one single cause: repeated heat stress from physical labor in a hot climate, dehydration, pesticide and other agrochemical exposure, and possibly heavy metals or contaminated drinking water, with poverty itself compounding the cumulative exposure. Worth knowing directly: for anyone doing sustained heavy outdoor labor in a hot climate, especially in these specific regions, standard CKD risk factors (diet, blood sugar, blood pressure) don't fully capture the picture, and adequate hydration and heat protection during work are themselves a genuine, if still-incompletely-understood, protective factor.",
    citations: [
      { source: 'Chronic kidney disease of unknown aetiology: A comprehensive review of a global public health problem, Tropical Medicine & International Health, Wiley', url: 'https://onlinelibrary.wiley.com/doi/full/10.1111/tmi.13913' },
      { source: 'What is CKDu?, International Society of Nephrology', url: 'https://www.theisn.org/initiatives/what-is-ckdu/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ckd-overview'],
  },
  {
    id: 'ckd-transplant-survival-benefit',
    category: 'chronicKidneyDisease',
    title: 'A Kidney Transplant Isn\'t Just a Convenience Over Dialysis, It\'s a Large Survival Advantage',
    teaser: 'Matched data finds kidney transplant recipients living measurably longer than people on dialysis, a roughly 55% lower mortality risk once the first several months pass.',
    summary:
      "For advanced kidney failure, dialysis and transplant are often framed as two roughly equal ways to manage the same disease. Matched survival data says otherwise. A analysis pooling multiple studies found kidney transplantation carrying a hazard ratio of 0.45 against dialysis, meaning a roughly 55% lower risk of death, and direct, matched comparisons confirm it in concrete numbers: 92% of transplant recipients were alive at 5 years and 87% at 10 years, against 88% and 74% for closely matched dialysis patients over the same periods. The honest complication worth knowing: this benefit isn't immediate. In the first months after surgery, transplant recipients actually face a higher short-term mortality risk than dialysis patients, driven mainly by infection risk from the immune-suppressing medications transplant requires, before the survival curves cross and transplant's large advantage takes over, typically becoming clearly apparent by around 9 months out. The benefit is even in older adults, one study of patients over 70 found 38% lower mortality and 80% five-year survival for transplant recipients versus 53% for those who stayed on dialysis. Worth knowing directly: this is concrete evidence for anyone evaluating their own treatment options as CKD progresses toward kidney failure, transplant, where medically eligible, carries a substantial survival advantage over remaining on dialysis long-term, not just a lifestyle preference.",
    chart: {
      title: 'Survival: kidney transplant vs. Dialysis',
      unit: '%',
      data: [
        { label: 'Transplant, 5-year survival', value: 92 },
        { label: 'Dialysis, 5-year survival', value: 88 },
        { label: 'Transplant, 10-year survival', value: 87 },
        { label: 'Dialysis, 10-year survival', value: 74 },
      ],
      sourceNote: 'Propensity Score-Matched Analysis of the Survival Benefit from Kidney Transplantation, PMC6262546',
    },
    citations: [
      { source: 'Propensity Score-Matched Analysis of the Survival Benefit from Kidney Transplantation in Patients with End-Stage Renal Disease, PMC6262546', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6262546/' },
      { source: 'Survival after kidney transplantation compared with ongoing dialysis for people over 70 years of age, American Journal of Transplantation', url: 'https://www.amjtransplant.org/article/S1600-6135(23)00578-6/fulltext' },
    ],
    overallTier: 'strong',
    relatedIds: ['ckd-egfr-acr-monitoring', 'ckd-dialysis-diet-reversal'],
  },
  {
    id: 'ckd-global-dialysis-access-africa',
    category: 'chronicKidneyDisease',
    title: 'This Category\'s Own Transplant/Dialysis Research Assumes Access That Most of the World Doesn\'t Have',
    teaser: 'Kidney replacement therapy access varies 200-fold between high-income regions and sub-Saharan Africa, where data finds only about 10% of adults who reach dialysis are still receiving it three months later.',
    summary: "This category's own already-covered kidney-transplant-survival research assumes something not true for most of the world: reliable access to dialysis or transplant at all. Current global data finds 88% of people unable to access kidney replacement therapy live in Africa or Asia, and the documented gap in access itself runs a striking 200-fold between high-income regions and low-income regions like sub-Saharan Africa. The human cost of this gap is stark: in sub-Saharan Africa, only roughly 10% of adults (and 35% of children) who manage to start dialysis are still receiving it three months later, and most cases of kidney failure in the region likely go completely undiagnosed and untreated, documented near-certain mortality for a condition the already-covered research treats as manageable. Structural causes include a severe shortage of nephrology specialists and dialysis capacity concentrated almost entirely in large cities, leaving rural populations effectively excluded, alongside catastrophic out-of-pocket costs relative to average income. Worth knowing directly: the CKD-management research (dialysis-diet reversal, transplant survival benefit, monitoring schedules) is accurate advice, but it's advice built on an assumption of access that a large share of the world's population simply doesn't have.",
    chart: {
      title: 'Kidney replacement therapy access, by world region',
      unit: 'relative scale (200x gap)',
      data: [
        { label: 'High-income regions', value: 200 },
        { label: 'Sub-Saharan Africa', value: 1 },
      ],
      sourceNote: 'The major global burden of chronic kidney disease, The Lancet Global Health',
    },
    citations: [
      { source: 'The major global burden of chronic kidney disease, The Lancet Global Health', url: 'https://www.thelancet.com/journals/langlo/article/PIIS2214-109X(24)00050-0/fulltext' },
      { source: 'Factors affecting access to dialysis for patients with end-stage kidney disease in Sub-Saharan Africa, PMC10495707', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10495707/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ckd-transplant-survival-benefit', 'ckd-egfr-acr-monitoring'],
  },
  {
    id: 'horizon-ckd',
    category: 'chronicKidneyDisease',
    title: 'A New Drug Class Blocks a Second Blood-Vessel Pathway This Category\'s Own ACE/ARB Research Doesn\'t Reach',
    teaser: 'Sparsentan, blocking both the endothelin and angiotensin pathways at once, reduced proteinuria a 40% more than a standard ACE/ARB-family drug alone in a Phase 3 trial, and finerenone is now being tested beyond its original diabetic-CKD approval.',
    summary:
      "This category's own already-covered ACE inhibitor and ARB research targets one blood-vessel pathway (angiotensin) already well-established in slowing CKD progression. Sparsentan represents a newer approach: a single drug blocking BOTH that same angiotensin pathway AND a second, separate one (endothelin), which research finds independently contributes to kidney damage. In a Phase 3 trial (PROTECT) in IgA nephropathy, sparsentan reduced protein leakage into urine by 40% more than irbesartan, an ARB-family drug, alone, and a separate Phase 2b trial (DUET) found it produced remission in 28% of a genetically-driven kidney disease (FSGS) versus 9% on irbesartan alone. A second, already-more-established drug, finerenone, works through yet another distinct pathway (blocking a hormone receptor tied to inflammation and scarring) and is already FDA-approved specifically for CKD in people who also have Type 2 diabetes, based on two large trials; it's now being tested in trials for non-diabetic CKD too, where it isn't yet approved. Worth knowing directly: both drugs represent this category's own active direction, combining or diversifying beyond the single angiotensin pathway most current CKD treatment still relies on.",
    citations: [
      { source: 'Endothelin receptor antagonists in chronic kidney disease, Nature Reviews Nephrology', url: 'https://www.nature.com/articles/s41581-024-00908-z' },
      { source: 'A comprehensive review of finerenone, a third-generation non-steroidal mineralocorticoid receptor antagonist', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11456546/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ckd-ace-arb-potassium-monitoring'],
  },
  {
    id: 'horizon-ckd-inaxaplin',
    category: 'chronicKidneyDisease',
    title: "The First Drug Aimed Directly at a Genetic Cause of CKD Common in People of West African Ancestry",
    teaser: 'Inaxaplin targets APOL1, a gene variant behind a substantial, often-overlooked share of CKD in this specific population, and an early trial already found it cutting protein leakage into urine by nearly half.',
    summary:
      "This category's own already-covered CKD research (potassium, protein, ACE inhibitors) applies broadly, but a specific, genetically-driven form of the disease has never had a treatment aimed at its actual cause until now. Two variants in the APOL1 gene, present almost exclusively in people of recent West African ancestry, drive a distinct form of kidney disease affecting an estimated 100,000 people in the US and Europe who carry two copies of the risk variant. Inaxaplin, a first-of-its-kind oral drug, is described directly by the field as the first genotype-targeted therapy in all of nephrology, working specifically to block the harmful protein the APOL1 variant produces. A early proof-of-concept trial found it reducing protein leakage into urine (a direct marker of kidney damage) by a statistically significant 47.6% after just 13 weeks. It's now in the Phase 3 portion of a global pivotal trial, expanded to include adolescents as young as 10. Worth knowing directly: this is novel precision medicine for a specific genetic cause of CKD this category's own general research doesn't otherwise address, not yet an approved treatment, but with a planned interim analysis that could lead to accelerated US approval if the results hold.",
    citations: [
      { source: 'Inaxaplin for Proteinuric Kidney Disease in Persons with Two APOL1 Variants, New England Journal of Medicine', url: 'https://pubmed.ncbi.nlm.nih.gov/36920755/' },
    ],
    overallTier: 'strong',
    relatedIds: ['horizon-ckd'],
  },
  {
    id: 'ckd-associated-pruritus',
    category: 'chronicKidneyDisease',
    title: "Persistent, Unexplained Itching Is a Common, Often-Dismissed CKD Symptom",
    teaser: "Chronic kidney disease-associated pruritus affects a large share of people with advanced CKD, and research finds it's far more than a minor annoyance.",
    summary:
      "Beyond the protein, sodium, and mineral concerns this category already covers, research finds a symptom that's common but often goes unrecognized as CKD-related at all: chronic kidney disease-associated pruritus, persistent, whole-body or localized itching with no other clear skin cause. Prevalence data finds it affecting roughly 20 percent of people with earlier-stage CKD, climbing to a 40 percent (and, in some studies, up to 80 percent) of people on hemodialysis, with roughly 40 percent of dialysis patients reporting the itching as moderate to severe rather than mild. The direct mechanism isn't fully settled, but it's now understood to involve systemic changes, an imbalance in the body's own opioid-receptor signaling, low-grade inflammation, and mineral/bone changes already covered elsewhere in this category, not simply dry skin. The practical stakes go beyond comfort: research directly links CKD-associated pruritus to worse sleep quality, and the itching itself is independently associated with a higher mortality risk in dialysis patients. Worth knowing directly: this is a name-able, discussable symptom, not something to quietly tolerate as an unavoidable part of kidney disease, and dedicated treatments (including a FDA-approved medication specifically for it) now exist.",
    citations: [
      { source: 'Epidemiology and burden of chronic kidney disease-associated pruritus, PMC8702817', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8702817/' },
      { source: 'CKD-Associated Pruritus: New Insights Into Diagnosis, Pathogenesis, and Management, Kidney International Reports', url: 'https://www.kireports.org/article/S2468-0249(20)31230-4/fulltext' },
    ],
    overallTier: 'strong',
    relatedIds: ['ckd-mineral-bone-cardiovascular-real-data', 'ckd-depression-underrecognized'],
  },
  {
    id: 'ckd-sodium-restriction-real-trial-data',
    category: 'chronicKidneyDisease',
    title: 'Dietary Sodium Restriction Lowers Blood Pressure in CKD, More Than It Does Without Kidney Disease',
    teaser: 'A controlled crossover trial found cutting dietary salt produced a bigger blood-pressure drop in CKD patients than the same restriction typically produces in people without kidney disease.',
    summary:
      "This category's own already-covered potassium research found blanket restriction thinner on evidence than assumed, sodium is a different story. A double-blind, placebo-controlled crossover trial in adults with stage 3-4 CKD and hypertension found that restricting dietary sodium produced a statistically significant average blood-pressure reduction of 10 systolic and 4 diastolic points, alongside measured reductions in fluid retention and albuminuria (protein leaking into urine, an already-covered marker of kidney damage). The worth-knowing detail: the study's own authors found this effect size larger than what's typically reported in sodium-restriction trials in people without CKD, direct evidence that CKD patients tend to be more salt-sensitive than the general population, not equally so. A separate self-management-support trial found a practical result too: coaching patients to manage their own sodium intake dropped systolic blood pressure from an average of 140 to 132 over three months. Worth stating plainly alongside this category's own potassium correction: unlike potassium, sodium-restriction evidence in CKD specifically is solid, not just extrapolated from general population data.",
    citations: [
      { source: 'A randomized trial of dietary sodium restriction in CKD, Journal of the American Society of Nephrology, PMID 24204003', url: 'https://pubmed.ncbi.nlm.nih.gov/24204003/' },
      { source: 'Sodium Restriction in Patients With CKD: A Randomized Controlled Trial of Self-management Support, PMID 27993433', url: 'https://pubmed.ncbi.nlm.nih.gov/27993433/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ckd-potassium-restriction-reconsidered', 'ckd-egfr-acr-monitoring'],
  },
  {
    id: 'ckd-secondary-hyperparathyroidism-vitamin-d',
    category: 'chronicKidneyDisease',
    title: "Failing Kidneys Disrupt Vitamin D Activation, Setting Off a Bone-Damaging Chain Reaction",
    teaser: 'CKD directly impairs the kidney\'s own role in activating vitamin D, and trial data finds treating the resulting hormone imbalance is more complicated than simply taking a supplement.',
    summary:
      "This category's own already-covered mineral and bone research names cardiovascular risk from mineral-bone disorder, and secondary hyperparathyroidism is the specific mechanism most directly driving it. Healthy kidneys perform the final activation step converting vitamin D into its active hormone form; as CKD progresses, that activation declines, and the resulting drop in active vitamin D and calcium triggers the parathyroid glands to release excess parathyroid hormone in compensation, itself a driver of bone loss and cardiovascular calcification over time. A large observational study of 376 patients across 15 US nephrology clinics compared real-world outcomes of extended-release calcifediol against other vitamin D therapies for this exact condition. A separate randomized trial found something more complicated than a straightforward fix: adding active vitamin D on top of extended-release calcifediol did further lower parathyroid hormone, but the same combination was also associated with a faster decline in kidney function itself over the 38-week trial period, a tradeoff between controlling one complication and protecting the kidney further. Worth knowing directly: this is an actively managed area of nephrology where the right vitamin D approach depends on where someone sits along this category's own already-covered CKD staging, not a one-size-fits-all supplement recommendation.",
    citations: [
      { source: 'Real-world assessment: effectiveness and safety of extended-release calcifediol and other vitamin D therapies for secondary hyperparathyroidism in CKD patients, PMC9650892', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9650892/' },
      { source: 'Adjunctive Active Vitamin D Decreases Kidney Function during Treatment of Secondary Hyperparathyroidism with Extended-Release Calcifediol in Non-Dialysis Chronic Kidney Disease in a Randomized Trial, PMC12342699', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12342699/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ckd-mineral-bone-cardiovascular-real-data', 'ckd-g-a-staging-heat-map'],
  },
  {
    id: 'ckd-iv-vs-oral-iron-real-trials',
    category: 'chronicKidneyDisease',
    title: 'For CKD-Related Anemia, IV Iron Outperforms Oral Iron in Controlled Trials',
    teaser: "This category's own already-covered anemia entry names iron deficiency as a common driver, head-to-head trials find intravenous iron correcting it faster and more reliably than oral iron pills in non-dialysis CKD.",
    summary:
      "This category's own already-covered anemia and erythropoietin research names iron deficiency as a common contributor, and controlled trials directly comparing how to correct it find a consistent gap between two delivery methods. The FIND-CKD trial, a 56-week, 626-patient randomized study, compared intravenous ferric carboxymaltose against oral iron in non-dialysis CKD patients with iron-deficiency anemia and found the IV group reached higher hemoglobin levels faster and required fewer additional treatments, evidence of an efficacy gap, not just a convenience difference. A separate 351-patient trial comparing iron isomaltoside against oral iron sulfate found the IV formulation not just non-inferior but superior in sustained hemoglobin increase from week 3 through the end of the 8-week study. The likely mechanism connects directly to this category's own already-covered gut research: CKD's own inflammatory state can impair how well the gut actually absorbs oral iron, meaning a pill that works fine for iron deficiency in a healthy gut may simply not be absorbed as reliably once kidney-disease-related inflammation is present. Worth stating honestly alongside this advantage: oral iron remains a reasonable, first option for milder deficiency given its lower cost and no infusion visit required, but trial evidence supports asking directly about IV iron when oral iron isn't correcting anemia as expected, rather than assuming a higher oral dose alone will eventually work.",
    citations: [
      { source: 'FIND-CKD: a randomized trial of intravenous ferric carboxymaltose versus oral iron in patients with chronic kidney disease and iron deficiency anaemia, PMID 24891437', url: 'https://pubmed.ncbi.nlm.nih.gov/24891437/' },
      { source: 'A randomized trial of iron isomaltoside 1000 versus oral iron in non-dialysis-dependent chronic kidney disease patients with anaemia, PMC4805129', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4805129/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ckd-anemia-erythropoietin', 'ckd-gut-derived-uremic-toxins'],
  },
  {
    id: 'ckd-potassium-binders-enabling-raas-inhibitors',
    category: 'chronicKidneyDisease',
    title: "New Potassium Binders Are Letting Doctors Keep People on the Kidney-Protective Drugs Hyperkalemia Used to Force Them Off",
    teaser: "This category's own already-covered ACE/ARB monitoring names potassium as a limiting side effect, newer drugs, patiromer and sodium zirconium cyclosilicate, are directly built to solve that problem so the protective medication can keep being used.",
    summary:
      "This category's own already-covered ACE-inhibitor and ARB research names hyperkalemia (dangerously high blood potassium) as a limiting side effect that sometimes forces reducing or stopping these otherwise kidney-protective drugs. Two newer medications, patiromer and sodium zirconium cyclosilicate (SZC), were built directly to solve this exact tradeoff: both are oral potassium binders working in the gastrointestinal tract to remove excess potassium, letting the underlying RAAS-inhibitor therapy (already covered elsewhere in this category) continue rather than being scaled back. A systematic review and meta-analysis found both drugs effective and reasonably safe for treating hyperkalemia, with evidence patiromer specifically associated with lower rates of recurrent hyperkalemia compared to standard care, and some research suggesting a possible mortality benefit in CKD patients with hyperkalemia. The NEUTRALIZE trial, testing SZC specifically in non-dialysis CKD patients with both hyperkalemia and metabolic acidosis (already covered elsewhere in this category), found direct evidence supporting its use in this exact overlapping population. Worth stating directly: this is a practical, structural solution to a clinical tension this category's own research already names, someone whose protective ACE-inhibitor or ARB dose was reduced due to potassium concerns now has an evidence-backed alternative worth asking about directly, rather than accepting a lower dose of kidney protection as the only option.",
    citations: [
      { source: 'Patiromer and Sodium Zirconium Cyclosilicate in Treatment of Hyperkalemia: A Systematic Review and Meta-Analysis', url: 'https://www.sciencedirect.com/science/article/pii/S0011393X21000138' },
      { source: 'Sodium Zirconium Cyclosilicate in CKD, Hyperkalemia, and Metabolic Acidosis: NEUTRALIZE Randomized Study, PMC11219110', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11219110/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ckd-ace-arb-potassium-monitoring', 'ckd-metabolic-acidosis-bicarbonate'],
  },
  {
    id: 'ckd-statin-starting-vs-continuing-dialysis',
    category: 'chronicKidneyDisease',
    title: "Starting a Statin ONCE Already on Dialysis Doesn't Help, Trials Find Continuing One Already Started Does",
    teaser: "This category's own already-covered SHARP trial names the dialysis exception, further trial and observational data finds a different, more specific distinction: it's about STARTING new vs. CONTINUING an existing statin.",
    summary:
      "This category's own already-covered SHARP trial found statin benefit not holding up once someone is already on dialysis, and further research finds a more specific, actionable distinction hiding underneath that finding. Two dedicated randomized trials, 4D and AURORA, both specifically tested STARTING a statin in patients already on dialysis and found no cardiovascular benefit from doing so, direct confirmation of the SHARP trial's own dialysis-specific null result. The more nuanced finding comes from separate research: observational data finds that CONTINUING a statin someone was ALREADY taking before starting dialysis is associated with improved cardiovascular and survival outcomes, a meaningfully different question from whether to start one fresh once dialysis has already begun. Research directly frames this as continuation mattering specifically, not just presence, worth stating plainly since it changes the practical question someone facing dialysis should actually ask: not 'should I start a statin now that I'm on dialysis' (evidence says no benefit), but 'should I stop the statin I'm already on now that I'm starting dialysis' (evidence increasingly says no, keep taking it). Worth stating directly: this is a meaningful, easy-to-miss distinction, worth confirming directly with a nephrologist rather than assuming the SHARP trial's own dialysis exception means all statin use should stop once dialysis begins.",
    citations: [
      { source: 'Statin Therapy Before Transition to End-Stage Renal Disease With Posttransition Outcomes, Journal of the American Heart Association', url: 'https://www.ahajournals.org/doi/10.1161/JAHA.118.011869' },
      { source: 'Statins in Chronic Kidney Disease and Dialysis: Clinical Trials, Mechanisms, Dosing, and Treatment Recommendations, National Lipid Association', url: 'https://www.lipid.org/lipid-spin/potpourri-2015/statins-chronic-kidney-disease-and-dialysis-clinical-trials-mechanisms' },
    ],
    overallTier: 'strong',
    relatedIds: ['ckd-sharp-trial-statins', 'ckd-dialysis-diet-reversal'],
  },
  {
    id: 'ckd-anxiety-pediatric-real-data',
    category: 'chronicKidneyDisease',
    title: "Anxiety Affects a Substantial Share of CKD Patients Too, and Children With CKD Show the Same Pattern",
    teaser: "This category's own already-covered depression entry names an underrecognized burden, research finds anxiety affecting 21-26% of CKD patients too, with the same measurable quality-of-life impact showing up even in children and adolescents.",
    summary:
      "This category's own already-covered depression research names a direct link to worse CKD progression and outcomes, and research finds anxiety carrying a similar, distinct burden worth its own coverage. Research finds anxiety prevalence ranging from 21 to 26 percent across CKD patient populations, substantial numbers in their own right, alongside depression rather than a lesser concern. Research names the same direct downstream risks already covered for depression, functional impairment, sleep disruption, and compromised nutritional status, evidence the two conditions travel together and compound each other's impact on disease management. A direct pediatric study found this same pattern extending to children and adolescents with CKD specifically, not just adults: standardized quality-of-life scores were significantly lower in children with CKD (63.3) compared with healthy controls (72.7), with elevated depression and anxiety measured directly in the affected children, and, worth noting separately, in their own primary caregivers too. Worth stating directly: clinical research explicitly names both depression and anxiety in CKD as commonly underdiagnosed and undertreated, direct reason to raise anxiety symptoms specifically, not just low mood, with a nephrology team, and reason a child's own CKD diagnosis is worth watching for the same mental-health burden this category's own adult research already establishes.",
    citations: [
      { source: 'Prevalence of depression and anxiety with their effect on quality of life in chronic kidney disease patients, Scientific Reports', url: 'https://www.nature.com/articles/s41598-022-21873-2' },
      { source: 'Quality of life, depression and anxiety in children and adolescents with CKD and their primary caregivers, PMID 36745054', url: 'https://pubmed.ncbi.nlm.nih.gov/36745054/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ckd-depression-underrecognized', 'ckd-cognitive-decline-dementia-risk'],
  },
  {
    id: 'ckd-restless-legs-syndrome-real-prevalence',
    category: 'chronicKidneyDisease',
    title: 'Restless Legs Syndrome Affects a Striking Share of Dialysis Patients, and Carries Its Own Mortality Link',
    teaser: "This category's own already-covered depression and anxiety research names common psychological burdens, restless legs syndrome is a distinct, physical complication affecting over a quarter of hemodialysis patients globally, with a direct link to worse cardiovascular outcomes.",
    summary:
      "This category's own already-covered depression and anxiety research names common psychological complications of CKD, and restless legs syndrome (RLS, an uncomfortable urge to move the legs, often worse at rest or at night) is a distinct, physical complication deserving its own direct coverage. A global systematic review and meta-analysis found a pooled RLS prevalence of 27.2 percent among hemodialysis patients, striking evidence this affects more than a quarter of that population, well above general-population estimates. The useful detail: prevalence varies meaningfully by measured factors, higher in women (29.7 percent) than men (23.5 percent), and by region (Africa 39.0 percent, Europe 29.8 percent, Asia 25.7 percent), population-level variation rather than one flat, universal number. The direct mechanism connects to this category's own already-covered anemia and iron research: reduced kidney clearance and inflammation elevate iron-regulating hormones in hemodialysis patients, direct evidence lowering serum iron levels and impairing how the brain itself uses iron, a plausible pathway to RLS specifically. The most serious finding, worth stating directly: RLS in this population isn't just an uncomfortable symptom, research links it to insomnia, fatigue, anxiety, and depression, and, more seriously, to an increased risk of cardiovascular events and death. Worth stating directly: this common, physically distinct complication is worth raising directly with a nephrology team, especially since this category's own already-covered iron research (IV versus oral iron) may address a shared underlying cause.",
    citations: [
      { source: 'Global prevalence of restless legs syndrome among hemodialysis patients: A systematic review and meta-analysis, PMC10784193', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10784193/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ckd-anemia-erythropoietin', 'ckd-iv-vs-oral-iron-real-trials'],
  },
  {
    id: 'ckd-inappropriate-drug-dosing-real-prevalence',
    category: 'chronicKidneyDisease',
    title: 'A Common Problem: Medications Prescribed Without Adjustment for Reduced Kidney Function',
    teaser: "This category's own already-covered NSAID and contrast-dye research names specific medication risks, a 49-study systematic review across 23 countries finds a much broader problem: renally-excreted drugs prescribed without proper dose adjustment, affecting up to 81% of hospitalized CKD patients in some settings.",
    summary:
      "This category's own already-covered NSAID and contrast-induced-nephropathy research already names specific medication risks, and a much broader problem, medications prescribed at a standard dose without accounting for reduced kidney clearance, deserves its own direct coverage. A systematic review of 49 studies across 23 countries found inappropriate prescribing of renally-excreted drugs (medications the kidneys are meant to clear, which can accumulate to dangerous levels when kidney function is reduced) common across every care setting studied: 9.4 to 81.1 percent in hospital settings, 13 to 80.5 percent in ambulatory (outpatient) care, and 16 to 37.9 percent in long-term care facilities. This is a wide range reflecting variation across different studies and populations, but even the low end represents a meaningful share of patients affected. The serious stakes: the same review found inappropriate prescribing associated with increased hospital stays and a 40 percent higher mortality risk, a serious consequence from something as preventable as a standard, unadjusted dose. Worth stating directly, and matching this category's own already-covered example (opioid accumulation in end-stage kidney disease requiring dose reduction): this is a systemic, common problem, not a rare prescribing mistake, worth directly and proactively asking any new prescriber whether a given medication's dose has been checked against current kidney function (eGFR, already covered elsewhere in this category's own self-advocacy research), rather than assuming every prescription automatically accounts for it.",
    citations: [
      { source: 'Inappropriate prescribing in chronic kidney disease: A systematic review of prevalence, associated clinical outcomes and impact of interventions, International Journal of Clinical Practice, PMID 28544106', url: 'https://pubmed.ncbi.nlm.nih.gov/28544106/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ckd-nsaid-kidney-injury-real-data', 'ckd-egfr-acr-monitoring'],
  },
  {
    id: 'ckd-fermented-drinks',
    category: 'chronicKidneyDisease',
    title: 'Fermented Drinks and Foods for Chronic Kidney Disease',
    teaser: 'This is the most caution-heavy condition in this app\'s whole fermented-drinks collection: most of these recipes lean on fruit, vegetables, or coconut water, all meaningful potassium sources a damaged kidney may not clear well.',
    summary: 'Beet Kvass, every drink in the Wild-Fermented Fruit Tonic family, and both coconut water-based drinks (Coconut Kefir, Coconut Palm Wine-Style) all carry meaningful potassium, a mineral advanced CKD often requires restricting since a damaged kidney can\'t clear it as reliably. Ayran and Sobia both carry deliberate added salt or a naturally sodium-bearing base. None of this means these drinks are automatically off-limits, kidney diets vary enormously by stage and lab values, but it does mean this is the one condition in this app where checking your own current potassium, sodium, and fluid targets with your care team before adding any of these matters more than any specific health claim a recipe makes. Water Kefir, built on plain sugar water rather than a mineral-dense base, is the lowest-risk starting point to ask about.',
    citations: [
      { source: 'National Center for Home Food Preservation (University of Georgia) fermentation overview', url: 'https://nchfp.uga.edu/how/can_ferment.html' },
    ],
    overallTier: 'moderate',
    relatedIds: ['recipe-ferment-water-kefir', 'recipe-ferment-beet-kvass', 'ckd-egfr-acr-monitoring'],
  },
  // 2026-08-21, added after fact-checking NOVA's "The Truth About Fat"
  // (2020) documentary against the peer-reviewed literature, direct
  // request. The documentary itself is not treated as a citable source;
  // this traces to the primary meta-analysis, independently verified via
  // WebSearch.
  {
    id: 'ckd-adiponectin-paradox',
    category: 'chronicKidneyDisease',
    title: 'The Adiponectin Paradox: A Hormone That Protects Elsewhere Predicts Worse Outcomes in CKD',
    teaser: 'Adiponectin is cardioprotective everywhere else in this app\'s research, but in CKD, higher levels are paradoxically linked to higher mortality, mainly because the kidneys can\'t clear it normally.',
    summary: 'The hormones research and the cardiovascular disease research both cover adiponectin as a protective hormone, higher levels linked to better insulin sensitivity and lower cardiovascular risk. Chronic kidney disease breaks that pattern in a well-documented way: CKD patients typically run 2 to 3 times normal adiponectin levels, mainly because the kidneys, which normally help clear it, no longer do so effectively, and a systematic review found that higher adiponectin was paradoxically associated with higher, not lower, all-cause mortality in this population. The most-supported explanation isn\'t that adiponectin itself turns harmful, it\'s that elevated adiponectin in CKD is likely a marker of an underlying process called protein-energy wasting (muscle and fat loss from illness), not a hormone actively causing harm. Worth knowing directly: a lab value that reads as reassuring in most other contexts in this app doesn\'t carry the same meaning here, one of several places general metabolic advice needs a CKD-specific adjustment.',
    citations: [
      { source: 'Yang HS et al. 2025, Metabolites: Adiponectin and All-Cause Mortality in Patients with Chronic Kidney Disease, a Systematic Review and Meta-Analysis (PMID 40278358)', url: 'https://pubmed.ncbi.nlm.nih.gov/40278358/' },
    ],
    overallTier: 'moderate',
    stageNote: 'Meta-analysis level evidence for the association itself; the protein-energy-wasting explanation is the leading proposed mechanism, not yet fully settled.',
    relatedIds: ['ckd-overview', 'adiponectin-overview', 'cvd-hypoadiponectinemia-independent-risk'],
  },
];
