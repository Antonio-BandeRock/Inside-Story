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
    title: 'Chronic Kidney Disease: A Real, Staged Framework for Tracking Kidney Function Over Time',
    teaser: "Diabetes and high blood pressure are the most common real causes. A real, five-category staging system exists specifically to track how far the damage has progressed.",
    summary:
      "Chronic kidney disease (CKD) is a real, progressive loss of kidney function over months to years, most commonly caused by diabetes and high blood pressure. Real, current KDIGO clinical guidelines diagnose CKD using two real, distinct measures together: estimated glomerular filtration rate (eGFR, how well the kidneys filter blood) and albuminuria (protein leaking into urine, measured as a urine albumin-to-creatinine ratio, or ACR). A real diagnosis requires either an eGFR under 60 mL/min per 1.73m² or an ACR of 30 mg/g or higher, present for at least three months, distinguishing genuine chronic disease from a temporary, resolving kidney issue. Real staging runs from G1 (eGFR 90 or above, normal or high function but with other damage markers present) down through G3a, G3b, G4, to G5 (eGFR under 15, kidney failure). This category covers what's specific to actually managing CKD day to day, and one of its own real, most important findings directly challenges a piece of dietary advice repeated to nearly every CKD patient.",
    citations: [
      { source: 'Chronic Kidney Disease, MedlinePlus, U.S. National Library of Medicine', url: 'https://medlineplus.gov/chronickidneydisease.html' },
    ],
    overallTier: 'strong',
    relatedIds: ['organ-kidney', 'type2-overview', 'type2-metabolic-syndrome-cluster', 'gout-metabolic-cluster-connection', 'magnesium-toxicity-hypermagnesemia'],
  },
  {
    id: 'ckd-potassium-restriction-reconsidered',
    category: 'chronicKidneyDisease',
    title: 'Blanket Potassium Restriction: A Real, Honest Correction to Some of the Most Common CKD Dietary Advice',
    teaser: "Nearly every CKD patient hears \"avoid bananas and oranges.\" A direct check of the real evidence behind that advice found it surprisingly thin.",
    summary:
      "Restricting high-potassium foods (bananas, oranges, potatoes, tomatoes) is some of the most commonly repeated dietary advice given to CKD patients, and a direct check of the real evidence behind it turns up a genuinely honest surprise: a 2017 review conducted for real clinical guidelines found no actual trials evaluating dietary potassium restriction for managing hyperkalemia in CKD, and separate, more recent observational research found no real association between dietary potassium intake and blood potassium levels in CKD populations at all. The 2020 KDIGO guidelines themselves went so far as to state the evidence was insufficient to support a graded recommendation either way. A real, emerging, more nuanced picture has taken its place: some real research now suggests a genuinely liberalized, plant-based, high-fiber dietary pattern may actually support healthier potassium regulation, since dietary fiber and other food-matrix factors can help shift potassium into cells and increase its excretion through the bowel rather than the kidneys. This is not a claim that potassium never matters in CKD, real hyperkalemia is a genuine, serious risk, especially in more advanced disease or when combined with certain real medications (see this category's own dedicated entry). It's a real, honest correction: the specific, individual amount of dietary potassium restriction that's actually appropriate genuinely varies by person and by how advanced someone's CKD is, and a blanket \"avoid these foods\" list isn't well supported as a universal rule.",
    citations: [
      { source: 'Re-Thinking Hyperkalaemia Management in Chronic Kidney Disease -- Beyond Food Tables and Nutrition Myths: An Evidence-Based Practice Review', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10780359/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['ckd-ace-arb-potassium-monitoring', 'potassium-deficiency-hypokalemia', 'potassium-toxicity-hyperkalemia'],
  },
  {
    id: 'ckd-phosphate-additives',
    category: 'chronicKidneyDisease',
    title: '"Hidden Phosphorus": Food Additives That Absorb Far More Efficiently Than the Same Mineral in Real Whole Food',
    teaser: 'Not all dietary phosphorus is created equal. The processed, additive form is absorbed at more than double the rate of the natural form, and it usually isn\'t listed on the label.',
    summary:
      "Phosphorus management is a real, central concern in CKD, since damaged kidneys can't clear excess phosphorus the way healthy ones do, and real research finds a genuinely important distinction most general nutrition advice misses: not all dietary phosphorus behaves the same way in the body. Inorganic phosphate additives, used widely as preservatives in processed foods, fast food, canned and bottled drinks, and spreadable cheeses, are absorbed at over 90%, sometimes described as approaching 100%. Natural, organic phosphorus in whole plant foods, by contrast, is absorbed at only 20% to 50% (largely because it's bound in a form called phytate that the human digestive system can't fully break down), and even organic phosphorus in animal-based whole foods is absorbed at a real, more moderate 40% to 60%. The real, practical problem: unlike sodium, added phosphorus content isn't consistently required on nutrition labels, which is exactly why real researchers describe it as \"hidden phosphorus.\" This is a real, meaningfully different concern from just \"how much phosphorus is in this food\" -- a minimally processed, naturally phosphorus-containing food and a processed food with additive phosphorus can carry a real, very different actual absorbed burden even at similar total phosphorus content on paper.",
    citations: [
      { source: 'Phosphate-based additives in processed foods: is excess exposure a cause for concern? A cross-sectional examination of the United States packaged food supply, American Journal of Clinical Nutrition', url: 'https://ajcn.nutrition.org/article/S0002-9165(25)00009-7/fulltext' },
    ],
    overallTier: 'strong',
    relatedIds: ['additive-phosphates'],
  },
  {
    id: 'ckd-protein-restriction-plant-based',
    category: 'chronicKidneyDisease',
    title: 'Low-Protein Diets in CKD: A Real, Specific Range, With Real Evidence Favoring a Plant-Forward Approach',
    teaser: 'Not just "eat less protein." A real, specific gram-per-kilogram target, and a real, emerging reason where that protein comes from matters too.',
    summary:
      "Low-protein diets are a real, established cornerstone of managing moderate-to-advanced CKD, with real research linking them to reduced proteinuria, better blood pressure control, and a genuinely slower decline in kidney function in both diabetic and non-diabetic CKD. The real, specific, commonly recommended range is 0.6 to 0.8 grams of protein per kilogram of body weight per day, a real, meaningful reduction from typical intake, not just a vague \"cut back\" suggestion. A real, more recent and specific finding adds a further layer: research comparing plant-based to animal-based low-protein diets finds plant-based approaches genuinely superior on several real, measured outcomes in advanced CKD, better nitrogen balance, better acid-base regulation, fewer uremic toxins produced, and a more favorable ratio of unsaturated to saturated fat. A real, ongoing randomized trial (the PLADO protocol) is specifically testing a plant-dominant low-protein diet (at least half of protein from plant sources) against standard renal-diet care in CKD stages 3 through 5. Worth knowing directly: a low-protein diet done well is a real, specific, structured intervention, best undertaken with a real dietitian's guidance given the genuine risk of malnutrition if protein is reduced without enough total calories or the right food choices to fill the gap.",
    citations: [
      { source: 'Plant-Based versus Animal-Based Low Protein Diets in the Management of Chronic Kidney Disease', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8621419/' },
    ],
    overallTier: 'strong',
    relatedIds: ['protein-toxicity-rabbit-starvation', 'protein-tying-together'],
  },
  {
    id: 'ckd-metabolic-acidosis-bicarbonate',
    category: 'chronicKidneyDisease',
    title: 'Metabolic Acidosis: A Real, Less-Known CKD Complication, With a Real, Simple, Evidence-Backed Fix',
    teaser: "Damaged kidneys lose some of their real ability to keep the body's own acid-base balance steady. A real, inexpensive supplement genuinely helps.",
    summary:
      "As CKD progresses, the kidneys' own real ability to properly balance the body's acid-base chemistry declines, producing a real, common complication called metabolic acidosis, which itself is linked to faster kidney function decline and real muscle wasting. A real, meaningful body of trial evidence supports a genuinely simple, low-cost intervention: a review of 14 randomized controlled trials (2,037 patients total) found oral sodium bicarbonate supplementation improved measured kidney function (eGFR) and increased muscle mass in CKD patients with this complication. A real, dedicated trial (the UBI Study, CKD stages 3-5, 36 months) specifically tested whether correcting this acid-base imbalance preserved kidney function over the longer term, adding to the real, broader evidence base. This is worth knowing directly as a real, actionable, evidence-backed option, not experimental or fringe, worth asking a nephrologist about specifically if metabolic acidosis has been identified on labs, rather than assuming nothing more can be done once that finding shows up.",
    citations: [
      { source: 'Treatment of metabolic acidosis with sodium bicarbonate delays progression of chronic kidney disease: the UBI Study, Journal of Nephrology', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6821658/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'ckd-sglt2-inhibitors',
    category: 'chronicKidneyDisease',
    title: 'SGLT2 Inhibitors: A Real, Genuinely Major Recent Advance in Slowing CKD Itself',
    teaser: 'Originally built as a diabetes drug. Real, large trials found it directly protects the kidneys, in people with and without diabetes alike.',
    summary:
      "SGLT2 inhibitors (a class of medication originally developed to lower blood sugar in type 2 diabetes) turned out to carry a real, independent, genuinely significant kidney-protective effect of their own, one of the more important recent developments in CKD treatment. The CREDENCE trial found canagliflozin reduced the real, combined risk of kidney failure, doubling of creatinine, or kidney/cardiovascular death by 30% in CKD patients with type 2 diabetes, the first SGLT2 inhibitor trial specifically built around a kidney-disease outcome. The real, landmark DAPA-CKD trial then found dapagliflozin produced a real 39% relative risk reduction in kidney-disease progression, and, genuinely notably, this benefit held in CKD patients without diabetes too, not just those with it, meaning the kidney-protective effect is real and independent of the drug's own original blood-sugar-lowering purpose. Real, further trials (EMPA-KIDNEY) have since confirmed this same kidney benefit with a second drug in the same class. Worth knowing directly as a real, genuinely major recent shift: this medication class is now recommended kidney-protective therapy in its own right for many CKD patients, not just a diabetes medication that happens to also help the kidneys as a side benefit.",
    citations: [
      { source: 'dapagliflozin and prevention of adverse outcomes in chronic kidney disease (DAPA-CKD) trial: baseline characteristics', url: 'https://academic.oup.com/ndt/article/35/10/1700/5899227' },
    ],
    overallTier: 'strong',
    relatedIds: ['type2-glp1-sglt2-paradigm-shift'],
  },
  {
    id: 'ckd-anemia-erythropoietin',
    category: 'chronicKidneyDisease',
    title: "Anemia in CKD: A Real, Dual Cause the Kidneys Themselves Are Responsible For",
    teaser: 'The kidneys make most of the hormone that signals red blood cell production. As they fail, that signal fades, and a second, separate deficiency often piles on.',
    summary:
      "Anemia in CKD has a real, genuinely dual cause, and the kidneys themselves are directly responsible for the first half of it: they produce roughly 90% of the body's own erythropoietin, the hormone that signals bone marrow to make red blood cells, so as kidney function declines, that signal genuinely weakens. Real prevalence data tracks directly with disease stage: anemia affects about 17.4% of people in CKD stage 3, rising to 50.3% in stage 4, and 53.4% in stage 5. The real, second, separate contributing cause is iron deficiency, genuinely common on its own in CKD (present in a real, striking 68.6% of anemic female CKD patients and 53.8% of anemic male patients in one real study), driven partly by impaired gut iron absorption. A real, honest gap worth knowing: despite how common and well-understood this complication is, real treatment rates remain genuinely low, with one real study finding only about 40% of anemic CKD patients receiving erythropoietin treatment and just 27% receiving iron. Worth asking directly whether both a real iron panel and erythropoietin-related labs have been checked if fatigue or other anemia symptoms show up alongside a CKD diagnosis, rather than assuming one explains the other automatically.",
    citations: [
      { source: 'Anemia of Chronic Kidney Disease -- A Narrative Review of Its Pathophysiology, Diagnosis, and Management', url: 'https://www.mdpi.com/2227-9059/12/6/1191' },
    ],
    overallTier: 'strong',
    relatedIds: ['iron-absorption-mechanism', 'iron-tying-together', 'ibd-iron-deficiency-anemia'],
  },
  {
    id: 'ckd-egfr-acr-monitoring',
    category: 'chronicKidneyDisease',
    title: "Tracking CKD Over Time: Why Both eGFR and Urine Albumin Matter, Together",
    teaser: 'One test alone tells an incomplete story. Real, current guidance tracks two real, different measures side by side.',
    summary:
      "Real, current KDIGO guidelines track CKD using two real, genuinely different measures together, not either one alone: eGFR (estimated glomerular filtration rate, from a blood creatinine test, reflecting how well the kidneys are actually filtering) and the urine albumin-to-creatinine ratio, or ACR (reflecting how much protein is leaking into urine, a real, early sign of kidney damage that can appear even when eGFR itself still looks normal). Real guidance recommends using creatinine-based eGFR as the standard first approach, and, when available, combining creatinine with a second real marker called cystatin C for a more precise estimate, since creatinine-based eGFR alone can be genuinely less accurate in some people (very muscular or very frail individuals, for example). Real risk of CKD's own complications rises step by step with worse categories of both measures together, not just one, which is exactly why real, complete monitoring tracks both rather than either alone. Worth asking directly whether both real numbers, not just one, are actually being checked and tracked over time at regular intervals, since either one alone can miss real, meaningful change the other would catch.",
    citations: [
      { source: 'KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease in Children and Adults', url: 'https://kdigo.org/wp-content/uploads/2024/03/KDIGO-2024-CKD-Guideline.pdf' },
    ],
    overallTier: 'strong',
    relatedIds: ['type2-sulfonylurea-hypoglycemia-ckd'],
  },
  {
    id: 'ckd-ace-arb-potassium-monitoring',
    category: 'chronicKidneyDisease',
    title: 'ACE Inhibitors and ARBs: Real, Genuinely Protective Medications With a Real, Specific Monitoring Schedule',
    teaser: 'These real, first-line CKD medications are underused partly out of a fear that has a real, specific, manageable answer.',
    summary:
      "ACE inhibitors and ARBs are real, first-line medications for CKD, especially when protein is present in the urine, and carry real, genuine kidney-protective benefit. They also carry a real, direct effect worth understanding clearly: both classes tend to raise blood potassium and can reduce eGFR somewhat when first started, a real mechanism worth knowing alongside this category's own separate, honest correction on dietary potassium restriction, and the same broad hyperkalemia risk this app's own PCOS research already covers for spironolactone. Real, current KDIGO guidance gives a specific, practical answer to managing that risk rather than avoiding these medications out of caution alone: check both eGFR and potassium within one week of starting or increasing the dose, regardless of the starting potassium level, then continue monitoring every three to six months under normal circumstances, and again during any acute illness. Real research finds these medications genuinely underused in exactly the patients who'd benefit most, partly out of reluctance over this same manageable risk. Worth knowing directly: a real, brief rise in potassium or a real, modest early eGFR dip after starting one of these medications isn't automatically a reason to stop it, both are expected, trackable, and, per real guidance, don't call for discontinuing the medication on their own.",
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
    teaser: 'A real, honest correction to some of the most repeated dietary advice out there, a hidden additive worth knowing about, and a medication class that turned out to protect the kidneys directly, not just as a side effect.',
    summary:
      "Line up everything in this category and CKD reads as a condition where real, careful precision, not blanket restriction, is what the actual evidence supports. Blanket potassium restriction, some of the most commonly repeated CKD dietary advice anywhere, turns out to have real, surprisingly thin trial evidence behind it, while phosphate additives (\"hidden phosphorus,\" absorbed at over 90% versus 20-60% from real whole food) deserve real, specific attention labels don't reliably provide. Protein restriction is real and evidence-backed, but works best at a real, specific gram-per-kilogram target, with real evidence now favoring where that protein comes from, not just how much. Two real medication-class stories round this out: SGLT2 inhibitors turned out to genuinely protect the kidneys directly, independent of their original diabetes purpose, and ACE inhibitors/ARBs remain real, first-line, protective medications whose own real, manageable potassium effect shouldn't be a reason to avoid them. And two real, quantified complications, metabolic acidosis (with a real, simple bicarbonate fix) and anemia (a real, dual kidney-hormone-and-iron cause), both argue for tracking CKD as the real, systemic condition it is, not narrowing the picture down to kidney function alone.",
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
    title: "CKD's Real Staging Grid: Two Numbers, Combined, Predict Real Risk Better Than Either Alone",
    teaser: "The real KDIGO \"heat map\" combines a G-stage (1 through 5) with an A-stage (1 through 3) into a real, color-coded risk zone -- worth knowing both numbers, not just one.",
    summary:
      "CKD's own real staging goes further than the eGFR/ACR monitoring already covered in this app's own self-advocacy content: KDIGO's real classification combines a GFR category (G1: eGFR 90+; G2: 60-89; G3a: 45-59; G3b: 30-44; G4: 15-29; G5: under 15 or on dialysis) with an albuminuria category (A1: under 30 mg/g; A2: 30-300; A3: over 300) into a real, formal grid. The genuinely useful part is the KDIGO \"heat map\": rather than either number alone, the COMBINATION lands in a real, color-coded risk zone (green, yellow, orange, or red) that independently predicts all-cause mortality, cardiovascular mortality, kidney failure, and acute kidney injury risk better than eGFR alone. A real, practical example worth knowing: someone with a normal G1 eGFR but high A3 albuminuria already sits in the orange zone, real, elevated risk despite a filtration number that might otherwise look reassuring on its own, a direct reason both numbers matter together, not just the one more commonly discussed.",
    citations: [
      { source: 'Chronic Kidney Disease, StatPearls, NCBI Bookshelf', url: 'https://www.ncbi.nlm.nih.gov/books/NBK535404/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ckd-egfr-acr-monitoring'],
  },
  {
    id: 'ckd-mineral-bone-cardiovascular-real-data',
    category: 'chronicKidneyDisease',
    title: "CKD's Own Real Reach Into Bone and Heart: A 3-Fold Fracture Risk and a 10-Fold Cardiovascular Risk",
    teaser: 'A real, formally named syndrome (CKD-MBD) connects damaged kidneys to real bone fragility and real vascular calcification through one shared, disrupted hormone system.',
    summary:
      "CKD reaches well beyond the kidneys through a real, formally recognized syndrome called CKD-mineral and bone disorder (CKD-MBD), disrupted calcium, phosphate, parathyroid hormone, vitamin D, and FGF23 metabolism, already touched by this app's own phosphate-additives research. Real, quantified consequences are substantial: people with CKD carry a real 3-fold higher bone fracture risk and a real, striking 10-fold higher cardiovascular disease risk than the general population, with cardiovascular complications the real, leading cause of the elevated mortality CKD carries overall. The real, direct mechanism connecting the two: the same mineral dysregulation that weakens bone also drives vascular calcification, calcium deposits hardening blood vessels themselves, a real, physical link between bone fragility and heart disease that most people wouldn't intuitively connect. Real, additional documented symptoms (nausea, pruritus, bone pain, malnutrition) round out CKD-MBD's own genuinely wide systemic reach.",
    citations: [
      { source: 'Chronic Kidney Disease-Mineral Bone Disorder (CKD-MBD), StatPearls, NCBI Bookshelf', url: 'https://www.ncbi.nlm.nih.gov/books/NBK560742/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ckd-phosphate-additives', 'ckd-gut-derived-uremic-toxins'],
  },
  {
    id: 'ckd-history-milestones',
    category: 'chronicKidneyDisease',
    title: "CKD's Own Real History: A Machine Built From Sausage Casings and a Washing Machine, During Wartime Scarcity",
    teaser: "1943, 1960 -- before dialysis existed, a CKD diagnosis was a real, near-certain death sentence; Willem Kolff's own real, improvised wartime invention changed that.",
    summary:
      "Before 1943, real, advanced CKD was almost universally fatal, with no real treatment able to do the kidneys' own job once they failed. Dutch physician Willem Kolff, after watching a young patient die slowly of kidney failure, spent the late 1930s developing an artificial kidney, and during real wartime material scarcity, built his working device from genuinely improvised parts: sausage-casing cellophane tubing (20 meters of it), orange juice cans, and a washing-machine mechanism. In March 1943, using this real, improvised device, patient Janny Schroder became one of the first people treated, regaining consciousness from a uremic coma on April 4, 1943, the first documented real recovery via hemodialysis. Kolff's own device still had a real, serious limitation: it required sacrificing a blood vessel for every single treatment, making repeated, ongoing dialysis impractical. That real problem wasn't solved until 1960, when Wayne Quinton and Belding Scribner developed a reusable vascular access method in Seattle, the real, final piece that made CHRONIC (not just emergency) dialysis genuinely possible, opening the door to the ongoing kidney-replacement therapy still used today.",
    citations: [
      { source: 'Dr. Willem Kolff: The Father of the Artificial Kidney, PMC11466315', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11466315/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'ckd-pregnancy-preeclampsia-bidirectional',
    category: 'chronicKidneyDisease',
    title: "CKD and Preeclampsia in Pregnancy: A Real, Genuinely Bidirectional Risk That Runs Both Directions at Once",
    teaser: 'CKD raises real preeclampsia risk as high as 79% in some real studies -- and preeclampsia itself then measurably accelerates real, long-term kidney decline afterward.',
    summary:
      "CKD and preeclampsia have a real, genuinely bidirectional relationship worth understanding as a two-way street, not a single risk running one direction. Real research finds superimposed preeclampsia occurring in 21-79% of pregnancies with pre-existing CKD across different studies, with one real cohort finding 55.8% affected, and risk running real, notably higher specifically in CKD stages 3-5 compared to stages 1-2. The real, less commonly discussed direction runs the other way: real research found CKD patients who developed preeclampsia during pregnancy had a significantly higher rate of real, long-term eGFR decline (over 30%) or progression to end-stage kidney disease afterward, 42.72% versus 19.42% in those without preeclampsia, with EARLY-onset preeclampsia (before 34 weeks) carrying real, particularly elevated risk. This is a genuinely two-way real relationship worth knowing directly before conception: existing CKD raises real pregnancy risk, and a preeclampsia episode during that pregnancy can independently accelerate the underlying kidney disease afterward, a real, direct reason nephrology involvement matters both before and after delivery, not just during.",
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
    title: 'Starting Dialysis Genuinely Reverses One of CKD\'s Own Core Dietary Rules -- Protein Restriction Becomes Protein Requirement',
    teaser: 'The real, standard 0.6-0.8g/kg/day protein ceiling this app already covers for pre-dialysis CKD flips once dialysis starts -- the treatment itself now strips real protein out of the blood that has to be replaced.',
    summary:
      "This is a real, genuinely important shift worth knowing before it happens, not after: this app's own real, already-established protein-restriction guidance (0.6-0.8g/kg/day, covered elsewhere in this category) applies specifically to PRE-dialysis CKD, protecting whatever kidney function still remains. Once dialysis actually starts, that real logic reverses, since dialysis itself removes real protein directly from the blood during each treatment, with peritoneal dialysis removing measurably more than hemodialysis. Real, current guidance for people on dialysis calls for MORE protein, not less, to replace what treatment itself takes out. Potassium and fluid restriction, by contrast, often intensify rather than reverse: someone on standard three-times-weekly hemodialysis has real, longer stretches between treatments for waste and fluid to build back up, meaning real, strict limits on both often become necessary in a way they weren't pre-dialysis. Worth knowing directly: a real dietary plan that was correct for years of pre-dialysis CKD can become genuinely wrong once dialysis starts, a real, concrete reason this specific transition deserves its own direct conversation with a renal dietitian rather than assuming the old rules still apply.",
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
    title: 'A Real, Well-Documented Herbal Compound Can Cause Aggressive, Often Irreversible Kidney Failure',
    teaser: 'Aristolochic acid, found in some traditional Chinese herbal remedies and, historically, in a contaminated weight-loss supplement, causes a real, named kidney disease that can progress to failure and even urinary tract cancer, sometimes years after exposure stops.',
    summary:
      "Aristolochic acid nephropathy is a real, aggressive, and genuinely serious kidney disease caused by exposure to aristolochic acid, a compound found in some Aristolochia species used in certain traditional herbal remedies, and historically found as a contaminant in one infamous weight-loss supplement mix. Real research finds it can cause both real acute kidney injury (from a single high dose) and slower, progressive chronic kidney disease with interstitial fibrosis (from repeated lower-dose exposure), and close to 50% of documented cases required renal replacement therapy (dialysis or transplant). Genuinely alarming, and worth knowing directly: real research finds kidney injury can continue progressing even AFTER the aristolochic acid source has been identified and removed, and the compound is also linked to a real, elevated risk of urothelial (urinary tract) cancer, not just kidney failure alone. Aristolochic acid is banned in most countries, but real, ongoing exposure still occurs through unregulated traditional medicine, unlicensed supplements, and, rarely, contaminated food. Worth knowing directly: this is a real, concrete reason for anyone with existing kidney disease, or anyone at all, to be genuinely cautious about unregulated herbal supplements specifically marketed for weight loss, joint pain, or \"detox,\" and to ask a doctor or pharmacist before starting any herbal product whose full ingredient sourcing isn't clearly verified.",
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
    title: 'NSAIDs Carry a Real, Quantified Acute Kidney Injury Risk, Higher Still in Anyone Who Already Has CKD',
    teaser: 'A real systematic review found current NSAID use raising acute kidney injury risk by about 73% in the general population and 63% in people who already have chronic kidney disease, a real, everyday-medication risk worth knowing by the numbers.',
    summary:
      "NSAIDs (ibuprofen, naproxen, and similar over-the-counter pain relievers) carry a real, quantified acute kidney injury (AKI) risk, not just a vague caution. A real systematic review and meta-analysis found the pooled odds of AKI with current NSAID use in the general population at 1.73 (a 73% relative increase), rising to 2.51 in older adults specifically. In people who already have chronic kidney disease, the real, pooled risk was 1.63 (a 63% relative increase), with individual studies ranging as high as 5.25 depending on the population studied. Real research finds NSAID-induced AKI itself is a strong, independent risk factor for the actual development and progression of chronic kidney disease, not just a temporary, reversible blip, meaning a single episode of NSAID-related kidney injury can have real, lasting consequences. The real, underlying mechanism involves NSAIDs blocking prostaglandins the kidneys depend on to maintain healthy blood flow, causing real vasoconstriction and, in some cases, direct interstitial inflammation. Worth knowing directly: this connects straight to this app's own already-covered diuretic/prescribing-cascade research for a different condition, since NSAIDs combined with diuretics or blood-pressure medications that affect the same kidney blood-flow pathway carry a real, additional, compounding risk, worth naming directly with a doctor or pharmacist for anyone managing CKD who reaches for an NSAID regularly.",
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
    title: 'Gut Bacteria Directly Manufacture Two Real Toxins That Build Up as Kidney Function Declines',
    teaser: 'Indoxyl sulfate and p-cresyl sulfate, both made by gut bacteria breaking down protein, accumulate as kidneys lose the ability to clear them, driving real oxidative stress, inflammation, and cardiovascular damage.',
    summary:
      "Chronic kidney disease has a real, direct gut-microbiome connection worth knowing about beyond diet alone: two specific compounds, indoxyl sulfate and p-cresyl sulfate, are real, gut-bacteria-manufactured uremic toxins, produced when certain gut bacteria (from families like Enterobacteriaceae and Clostridiaceae) ferment protein, and they accumulate in the blood as declining kidney function loses the ability to clear them. Real research finds their accumulation directly promotes oxidative stress, systemic inflammation, and endothelial dysfunction, contributing to real vascular damage and elevated cardiovascular risk in CKD, connecting directly to this app's own already-covered CKD-cardiovascular-real-data research. A real, related finding worth knowing: CKD patients also show reduced levels of beneficial bacteria families, including Lactobacillaceae and Bifidobacteriaceae, the same real bacterial families already covered favorably elsewhere in this app's own gut-microbiome and fermented-foods research, alongside the rise in toxin-producing bacteria. Real, emerging interventions being studied to modulate this gut-kidney axis include dietary changes, prebiotics, probiotics, and fecal microbiota transplantation, though none are yet standard clinical practice. Worth knowing directly: this gives a real, mechanistic explanation for why the plant-forward, fiber-supportive dietary pattern already recommended elsewhere in this app's own CKD protein-restriction research does double duty, supporting the same beneficial gut bacteria that compete against the toxin-producing ones, not just managing protein intake on its own.",
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
    title: 'Contrast Dye Used in CT Scans Carries a Real, Manageable Kidney-Injury Risk for Anyone With CKD',
    teaser: 'Real research finds contrast-induced kidney injury genuinely uncommon overall, developing in 3.7% of one large CKD cohort, but risk rises sharply below a real, specific eGFR threshold, worth flagging before any contrast scan.',
    summary:
      "Contrast dye, used to sharpen the images in a CT scan, carries a real, worth-knowing kidney injury risk specifically for anyone with existing chronic kidney disease, defined as a real, measurable worsening of kidney function within 24 to 48 hours of the procedure. Worth stating honestly first: real research finds the overall risk of this happening is genuinely minimal for most people undergoing routine CT imaging, one real study of 1,666 subjects found contrast-induced nephropathy developing in just 3.7% of cases, even among a CKD population. Real research finds the risk concentrates specifically as kidney function drops further, rising noticeably once eGFR (already covered in this app's own self-advocacy research) falls below roughly 36.8 mL/min/1.73m², with diabetes and low blood albumin identified as real, additional risk factors. Real, practical reassurance: a genuine prophylaxis program (proper hydration protocols before and after the scan) run over 8 real years found contrast-induced nephropathy manageable in stable CKD patients when this real prevention step was followed. Worth knowing honestly: real research finds contrast-induced nephropathy itself didn't increase mortality, but patients who did develop it were significantly more likely to need dialysis within the following 6 months. Worth knowing directly: this is a real, worth-raising conversation before any contrast-enhanced CT scan for someone with CKD, real hydration protocols and, in some cases, choosing a non-contrast alternative imaging method are real, established ways to manage this risk rather than avoid necessary imaging altogether.",
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
    title: 'CKD Is a Real, Strong, Independent Risk Factor for Cognitive Decline, Worse as Kidney Function Falls Further',
    teaser: 'A real study found cognitive-impairment risk more than doubled at the lowest kidney-function level tested, and a faster rate of eGFR decline carried over five times higher risk of developing vascular dementia.',
    summary:
      "Chronic kidney disease carries a real, independently documented risk for cognitive decline and dementia, worth knowing about directly beyond the more familiar cardiovascular and mineral-bone complications already covered elsewhere in this app's own CKD research. Real research finds CKD one of the strongest risk factors for mild cognitive impairment and dementia in large, population-based studies, with its impact exceeded only by stroke and chronic anti-anxiety medication use in one real 6-year study. Real, dose-response data makes the pattern concrete: a study of 3,679 community-dwelling adults found new cognitive impairment rates of 5.8%, 9.9%, and 21.5% across three declining kidney-function groups, with the lowest-function group carrying a real 2.14 times higher risk than the highest. Genuinely striking: real research found people whose eGFR declined by 4 mL/min/1.73m² or more per year had a real 5.35 times higher risk of developing vascular dementia over 7 years compared to those with a slower decline. Real, proposed mechanisms include uremia-driven chronic inflammation, oxidative stress, vitamin D deficiency, anemia (already covered in this app's own CKD research), and impaired clearance of amyloid-beta, the same protein implicated in Alzheimer's disease. Worth knowing directly: this real connection persists even after accounting for other real, established dementia risk factors like smoking, hypertension, and diabetes, meaning CKD itself deserves real, direct attention as a modifiable piece of long-term cognitive health, not just kidney health on its own.",
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
    title: 'Depression Affects Roughly a Quarter of People With CKD, and Real Research Finds It Genuinely Undertreated',
    teaser: 'Real research finds depression tied directly to worse CKD progression, more hospitalizations, and higher mortality, yet real clinical practice still gives it far less attention than the disease\'s own physical management.',
    summary:
      "Depression is a real, common, and genuinely underrecognized companion to chronic kidney disease, worth knowing about directly since it carries real, measurable consequences for the disease itself, not just quality of life. Real research finds depression prevalence ranging from roughly a quarter to half of CKD patients depending on the study, with major depressive disorder specifically affecting about 20% of people with CKD or kidney failure. Real research finds this burden rises with disease severity, one study found depression in 29.9% of people on chronic hemodialysis versus 18.5% in earlier, pre-dialysis stages. Genuinely important: real research finds depressive symptoms an underrecognized but potentially modifiable risk factor independently associated with faster CKD progression, kidney transplant failure, more hospitalizations, more cardiovascular events, and higher mortality, a real, direct link between mental health and physical disease outcome, not a separate, parallel concern. Real research finds a plausible, concrete mechanism behind part of this: depression can genuinely undermine a person's ability to stick with the real dietary, fluid, and medication requirements CKD management demands. Worth knowing directly: real clinical guidance explicitly calls depression a priority that current CKD management still doesn't give adequate attention to, someone with CKD experiencing persistent low mood, hopelessness, or loss of motivation for their own self-care has a real, evidence-backed reason to raise it directly with their nephrology team, not treat it as a separate issue for a different doctor.",
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
    title: 'The Largest Real Trial of Cholesterol-Lowering in CKD Found a Real Benefit, With One Real Exception',
    teaser: 'A real, 9,270-patient trial found lowering LDL cholesterol cut major cardiovascular events by 17% in people with CKD, but the benefit didn\'t hold for people already on dialysis specifically.',
    summary:
      "Cardiovascular disease is a real, leading cause of death in CKD, well before kidney failure itself becomes the bigger threat, so a real, direct question worth answering is whether standard cholesterol-lowering treatment actually helps this specific population the way it helps the general population. The SHARP trial, the largest real trial ever run on this question (9,270 participants, split between people with CKD not yet on dialysis and people already on it), tested simvastatin plus ezetimibe against placebo. The real, headline result: a real 0.85 mmol/L average LDL reduction tracked with a real 17% reduction in major atherosclerotic events (heart attack, stroke, and the need for an artery-opening procedure) across the trial as a whole. Worth knowing honestly, and directly relevant to anyone already on dialysis: real subgroup analysis found the benefit was clearly present in the earlier-stage CKD group but genuinely less certain in the dialysis-dependent group specifically, a real, honest limitation this trial's own authors and later reviews have both noted rather than glossed over. This is real, large-scale evidence that cholesterol management remains a real, worthwhile part of CKD care for most people with the condition, while being honest that its own strength varies by how advanced the kidney disease already is, a real, concrete reason to ask directly where a specific treatment's own evidence is strongest for a given stage of CKD.",
    citations: [
      { source: 'The effects of lowering LDL cholesterol with simvastatin plus ezetimibe in patients with chronic kidney disease (Study of Heart and Renal Protection): a randomised placebo-controlled trial, The Lancet 2011, PMID 21663949', url: 'https://pubmed.ncbi.nlm.nih.gov/21663949/' },
    ],
    overallTier: 'strong',
    relatedIds: ['cvd-statin-evidence', 'ckd-mineral-bone-cardiovascular-real-data'],
  },
  {
    id: 'ckd-fiber-intake-inflammation',
    category: 'chronicKidneyDisease',
    title: 'Dietary Fiber Has Real, Measured Evidence Behind the Gut-Toxin Mechanism This Category Already Names',
    teaser: 'Real trials find fiber supplementation measurably lowers two specific gut-derived uremic toxins already covered in this category\'s own research, not just a general "eat more fiber" gesture.',
    summary:
      "This category's own research already covers how gut bacteria manufacture real uremic toxins, indoxyl sulfate and p-cresyl sulfate specifically, that build up as kidney function declines. Real, controlled trial evidence gives a real, concrete, food-first lever against exactly that mechanism: a real meta-analysis of randomized controlled trials found dietary fiber supplementation significantly reduced both indoxyl sulfate and p-cresyl sulfate levels in CKD patients, with a separate, broader systematic review also finding real reductions in inflammatory markers (IL-6 most consistently, TNF-alpha in some studies) tracking with higher fiber intake. The real, underlying mechanism ties directly to this app's own gut-microbiome research: fermentable fiber feeds beneficial gut bacteria that produce short-chain fatty acids instead of the protein-fermentation byproducts that become these same uremic toxins, genuinely shifting what the gut's own bacterial population is doing with a person's food. Worth knowing honestly: current, real CKD nutrition guidelines don't yet include a formal fiber-intake recommendation, a genuine gap between what the trial evidence already shows and what standard clinical guidance has caught up to codify. This is real, actionable, food-first context worth raising directly with a renal dietitian, especially alongside this category's own already-covered protein and potassium guidance, since fiber-rich foods and protein-restriction goals can be planned together rather than treated as separate concerns.",
    citations: [
      { source: 'The Role of Dietary Fiber Supplementation in Regulating Uremic Toxins in Patients With Chronic Kidney Disease: A Meta-Analysis of Randomized Controlled Trials, PMID 33741249', url: 'https://pubmed.ncbi.nlm.nih.gov/33741249/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ckd-gut-derived-uremic-toxins', 'gut-scfa-treg'],
  },
];
