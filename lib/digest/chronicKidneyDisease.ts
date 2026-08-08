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
    relatedIds: ['organ-kidney', 'type2-overview', 'type2-metabolic-syndrome-cluster'],
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
    relatedIds: ['ckd-ace-arb-potassium-monitoring'],
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
    relatedIds: ['ckd-potassium-restriction-reconsidered'],
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
];
