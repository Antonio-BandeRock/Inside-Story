// "How This App Helps" -- a new, real, per-condition entry added to the
// existing "Prevention & Lifestyle by Condition" Basic Health topic,
// 2026-08-08/09, direct request: "include how this app helps a person who
// has their condition for each condition, and what it will do for them...
// this is how we advertize within the app so those who have these
// conditions will know and be interested in using it."
//
// A genuinely different kind of content from everything else in this
// Digest: every other entry cites real, external, independently-verified
// research; these 19 entries instead describe this app's own real, already
// -built features, condition by condition. Every specific claim below
// (which food-scoring dimensions exist for which condition, which real
// medications and interaction rules are tracked) was checked directly
// against the live reference database and the actual lib/digest/*.ts
// content before being written, not recalled from memory -- the same
// verify-before-claiming discipline this whole Digest already holds
// external research to, applied here to the app's own feature set instead.
// citations: [] throughout, matching the precedent already established for
// this Digest's own internal-reasoning entries (e.g. foodhistory-opinion-
// synthesis) -- these are factual descriptions of built app functionality,
// not external evidence needing a citation trail.
//
// A REAL, STANDING MAINTENANCE OBLIGATION, stated directly in the request
// and worth restating here for whoever picks this file up next: "What this
// app will do for them needs to continue to be updated as more features are
// added until the app is completed." Every one of these 19 entries
// describes the app's REAL, CURRENT feature set as of the date it was last
// touched -- when a new feature ships that changes what the app does for a
// given condition (a new food-scoring dimension, a new medication/
// interaction rule, a new Digest category, Trends/Reports finally being
// built out, cloud sync, etc.), the matching entry here needs a real update,
// not just the CLAUDE.md Status section. This is NOT optional background
// content -- it's the app's own in-app pitch to the exact people it's built
// for, and a stale, inaccurate pitch (overclaiming a feature that doesn't
// exist yet, or undercelling one that now does) undermines the whole
// point of it existing.
import type { DigestEntry } from './types';

export const APP_HELPS_ENTRIES: DigestEntry[] = [
  {
    id: 'apphelps-hashimotos',
    category: 'basicHealth',
    title: "How Inside Story Helps With Hashimoto's Specifically",
    teaser: "Hashimoto's is where this app started, and it shows: the deepest research library, the most complete food-scoring rubric, and a purpose-built interaction engine all exist because of it.",
    summary:
      "Hashimoto's is this app's own original focus, and its own depth reflects that directly. Every food you build or browse across the app's eleven Food-tab builders can be scored against the full 6 Dimensions of Food-Friendliness (6-DFF) rubric, goitrogenic load, gluten, additives, processing, fat quality, and more, each sub-criterion individually cited, not a black-box number. The app's own Digest carries a dedicated Hashimoto's category built out to depth: staging and disease progression, organ-by-organ effects beyond the thyroid itself, a history of how the disease has been understood, pregnancy and fertility guidance, and self-advocacy content naming exactly which labs to ask for and how often, plus this same Prevention & Lifestyle guidance and a running Research Horizon tracking experimental treatment. My Meds & Interactions already tracks levothyroxine directly, with cited timing rules for calcium, iron, coffee, soy, and high-fiber meals, plus an age-adjusted TSH-target note for anyone over 65. This list keeps growing as more of the app gets built, treat it as a current snapshot, not a fixed, final promise.",
    citations: [],
    overallTier: 'strong',
    relatedIds: ['prevention-hashimotos'],
  },
  {
    id: 'apphelps-ra',
    category: 'basicHealth',
    title: 'How Inside Story Helps With Rheumatoid Arthritis Specifically',
    teaser: 'RA-specific food scoring across five dimensions, methotrexate tracked with interaction rules, and a dedicated research library covering everything from remission criteria to the newest CAR-T trials.',
    summary:
      "Foods you build or browse in this app's own eleven builders can already be scored specifically for RA, five dimensions reused or built directly for this condition: anti-inflammatory fat profile, Mediterranean-pattern fit, gut and microbiome support, an elimination-trigger tag, and the same food-friendliness lens this app first built for Hashimoto's, now reapplied here rather than reinvented. My Meds & Interactions already tracks the medications most people with RA are prescribed, methotrexate, leflunomide, sulfasalazine, adalimumab, prednisone, with cited interaction rules (methotrexate and folate, methotrexate and alcohol, methotrexate combined with a biologic) built directly in, not a generic drug-database dump. The app's own Digest carries a full, dedicated RA category: remission criteria and the 'window of opportunity' evidence for early treatment, organ systems beyond the joints, a history of the disease, pregnancy guidance, self-advocacy content on which antibody tests and monitoring intervals actually matter, international/regional research, this same Prevention & Lifestyle guidance, and a running account of experimental treatments including CAR-T cell trials. This list keeps growing as more of the app gets built.",
    citations: [],
    overallTier: 'strong',
    relatedIds: ['prevention-ra'],
  },
  {
    id: 'apphelps-psoriasis',
    category: 'basicHealth',
    title: 'How Inside Story Helps With Psoriasis Specifically',
    teaser: 'Psoriasis-specific food scoring, systemic medications tracked with interaction rules for two of the trickiest real-world combinations (alcohol, grapefruit), and a full research library from staging to the newest approved biologics.',
    summary:
      "Foods you build or browse across this app's own eleven builders can already be scored specifically for psoriasis, dimensions covering whole-food and Mediterranean-pattern fit, individual elimination-diet triggers, and an honestly-labeled omega-3 dimension (the evidence here is mixed, and the app says so rather than overselling it). My Meds & Interactions tracks psoriasis-specific medications, acitretin, cyclosporine, apremilast, secukinumab, calcipotriene, with cited interaction guidance built directly in for two combinations that matter (acitretin and alcohol, cyclosporine and grapefruit). The app's own Digest carries a full, dedicated Psoriasis category: PASI/BSA severity staging, systemic comorbidities beyond the skin, a history of the disease, pregnancy guidance, self-advocacy content on cardiovascular and metabolic monitoring, international/regional research (including a latitude-driven prevalence pattern), this same Prevention & Lifestyle guidance, and a running Research Horizon covering newly-approved treatments like spesolimab and deucravacitinib. This list keeps growing as more of the app gets built.",
    citations: [],
    overallTier: 'strong',
    relatedIds: ['prevention-psoriasis'],
  },
  {
    id: 'apphelps-graves',
    category: 'basicHealth',
    title: "How Inside Story Helps With Graves' Disease Specifically",
    teaser: "Food scoring for Graves' own two two-edged nutrients (selenium, iodine), antithyroid medications tracked with safety-warning content, and an age-aware alert for an easy-to-miss presentation in older adults.",
    summary:
      "Foods you build or browse across this app's own eleven builders can already be scored specifically for Graves' disease, an honest, two-nutrient lens: selenium (with cited eye-disease-specific trial evidence) and iodine (framed for Graves' own excess-risk direction, the opposite emphasis from this app's own Hashimoto's research). My Meds & Interactions tracks methimazole, propylthiouracil, and propranolol, with cited reference content built directly in for the two warning signs that matter most (agranulocytosis, PTU-related liver injury) and how iodine intake can reduce antithyroid drug effectiveness. The app's own functional age-rules engine already flags an easy-to-miss presentation directly: 'apathetic thyrotoxicosis,' an atypical Graves' pattern more common after 60, checked against your own birth date in Profile. The app's own Digest carries a full, dedicated Graves' category: remission-rate data, cardiac risk, a history of the disease, pregnancy guidance, self-advocacy content on TRAb/TSI testing, international research (including a Denmark-vs-Iceland iodine study), this same Prevention & Lifestyle guidance, and a running Research Horizon. This list keeps growing as more of the app gets built.",
    citations: [],
    overallTier: 'strong',
    relatedIds: ['prevention-graves'],
  },
  {
    id: 'apphelps-type1',
    category: 'basicHealth',
    title: 'How Inside Story Helps With Type 1 Diabetes Specifically',
    teaser: 'A purpose-built carbohydrate-density food score, insulin tracked with a delayed-hypoglycemia alcohol warning, and a pediatric-specific DKA alert built directly into the app\'s own age-rules engine.',
    summary:
      "Foods you build or browse across this app's own eleven builders can already be scored specifically for T1D through a purpose-built sub-criterion this app created from scratch, Carbohydrate Density Relative to Fiber, computed directly from each food's own measured carb and fiber content, not a guess. My Meds & Interactions tracks insulin and glucagon, with a cited warning built directly in for alcohol's own delayed hypoglycemia risk, an easy-to-miss danger this app names explicitly. The app's own functional age-rules engine flags a serious risk directly: cerebral edema, an almost exclusively pediatric DKA complication, checked automatically against anyone under 18 in Profile. The app's own Digest carries a full, dedicated Type 1 Diabetes category: presymptomatic staging (detectable years before diagnosis), long-term complication data, a history of insulin's own discovery, pregnancy guidance, self-advocacy content on the 4-antibody diagnostic panel, international research (including Finland's own world-highest incidence), this same Prevention & Lifestyle guidance, and a running Research Horizon covering teplizumab, stem-cell islet therapy, and verapamil. This list keeps growing as more of the app gets built.",
    citations: [],
    overallTier: 'strong',
    relatedIds: ['prevention-type1'],
  },
  {
    id: 'apphelps-celiac',
    category: 'basicHealth',
    title: 'How Inside Story Helps With Celiac Disease Specifically',
    teaser: 'Celiac-specific food scoring that goes beyond a simple gluten flag, and an honest, direct answer about medication: there isn\'t one yet, the diet itself is still the treatment, and the app says so plainly.',
    summary:
      "Foods you build or browse across this app's own eleven builders can already be scored specifically for celiac disease across three dimensions: gluten content directly (the core concern), a whole-food-versus-processed-gluten-free-substitute lens (since this app's own research found commercial gluten-free products often run lower in fiber and protein than their gluten-containing equivalents), and fiber content specifically, countering a documented nutritional gap this app's own research names directly. Worth knowing honestly: My Meds & Interactions tracks no celiac-specific medication, because none currently exists, no FDA-approved drug treats celiac disease itself, strict gluten avoidance remains the only treatment, and the app doesn't pretend otherwise. The app's own Digest carries a full, dedicated Celiac category: Marsh histological staging, systemic effects reaching well beyond the gut, a history of the disease's own discovery, pregnancy and fertility data, self-advocacy content including exactly why first-degree relatives should be screened, international research (including Western Sahara's own striking prevalence), this same Prevention & Lifestyle guidance, and a running Research Horizon covering drug candidates (ZED1227, TAK-101, latiglutenase) still meant to sit alongside the diet, not replace it. This list keeps growing as more of the app gets built.",
    citations: [],
    overallTier: 'strong',
    relatedIds: ['prevention-celiac'],
  },
  {
    id: 'apphelps-ibd',
    category: 'basicHealth',
    title: 'How Inside Story Helps With Inflammatory Bowel Disease Specifically',
    teaser: 'IBD-specific food scoring built around this app\'s own direct correction to the "avoid fiber" advice, biologics and immunomodulators tracked with serious interaction rules, and a full research library.',
    summary:
      "Foods you build or browse across this app's own eleven builders can already be scored specifically for IBD across three dimensions: additive load (tied directly to a documented emulsifier mechanism), whole-food-versus-processed intake, and a nuanced fiber-and-roughage lens built around this app's own direct correction to the common 'avoid fiber during a flare' advice, research the app cites finding no support for that restriction at all. My Meds & Interactions tracks mesalamine, azathioprine, and vedolizumab (plus shared medications from this app's own RA research where applicable, adalimumab, prednisone, methotrexate), with cited interaction rules built directly in for two serious combinations, azathioprine with allopurinol, and azathioprine with a biologic. The app's own Digest carries a full, dedicated IBD category: Montdisease classification, extraintestinal effects, a history of the disease, pregnancy guidance emphasizing remission-at-conception data, self-advocacy content, international research (including a second-generation-migrant finding), this same Prevention & Lifestyle guidance, and a running Research Horizon covering precision-medicine biomarkers and stem-cell fistula therapy. This list keeps growing as more of the app gets built.",
    citations: [],
    overallTier: 'strong',
    relatedIds: ['prevention-ibd'],
  },
  {
    id: 'apphelps-ms',
    category: 'basicHealth',
    title: 'How Inside Story Helps With Multiple Sclerosis Specifically',
    teaser: 'MS-specific food scoring built directly from the Swank and Wahls diet trials, disease-modifying therapies tracked with a serious PML safety rule, and a full research library.',
    summary:
      "Foods you build or browse across this app's own eleven builders can already be scored specifically for MS across three dimensions, built directly from this app's own already-cited WAVES trial research: saturated fat (the core of the decades-long Swank diet evidence), omega-3 balance (a shared thread across both major MS diets), and whole-food-versus-processed intake, the one recommendation both competing diets agree on. My Meds & Interactions tracks natalizumab, fingolimod, dimethyl fumarate, and glatiramer acetate, with a serious, cited safety rule built directly in for natalizumab's own documented PML risk when combined with other immunosuppressants, plus a practical dietary-fat reminder for dimethyl fumarate's own flushing side effect. The app's own Digest carries a full, dedicated MS category: disease-course classification, bladder/bowel/cognitive effects beyond mobility, a history of the disease, pregnancy and postpartum-relapse data, self-advocacy content, international research (including the Sardinia exception to the latitude gradient), this same Prevention & Lifestyle guidance, and a running Research Horizon covering ocrelizumab, tolebrutinib, and clemastine. This list keeps growing as more of the app gets built.",
    citations: [],
    overallTier: 'strong',
    relatedIds: ['prevention-ms'],
  },
  {
    id: 'apphelps-lupus',
    category: 'basicHealth',
    title: 'How Inside Story Helps With Lupus (SLE) Specifically',
    teaser: "Lupus-specific food scoring for the one nutrient with positive trial evidence here, hydroxychloroquine tracked with a grapefruit-interaction rule, and a full research library naming a specific food to avoid by name.",
    summary:
      "Foods you build or browse across this app's own eleven builders can already be scored specifically for lupus through an honestly-scoped omega-3 dimension, this app's own research found cautious but positive trial evidence here, and doesn't force a broader food-scoring claim the underlying research doesn't support. My Meds & Interactions tracks hydroxychloroquine, belimumab, and mycophenolate mofetil (plus shared medications from this app's own research elsewhere, azathioprine, methotrexate, prednisone), with a cited interaction rule built directly in for hydroxychloroquine and grapefruit. The app's own Digest carries a full, dedicated Lupus category: SLEDAI disease-activity scoring, skin/blood/neurological effects, a history of the disease, pregnancy guidance covering congenital heart block risk, self-advocacy content, international research (including a documented occupational silica-dust risk factor), this same Prevention & Lifestyle guidance naming alfalfa sprouts directly as a specific food to avoid, and a running Research Horizon covering striking CAR-T remission data and litifilimab. This list keeps growing as more of the app gets built.",
    citations: [],
    overallTier: 'strong',
    relatedIds: ['prevention-lupus'],
  },
  {
    id: 'apphelps-sjogrens',
    category: 'basicHealth',
    title: "How Inside Story Helps With Sjögren's Syndrome Specifically",
    teaser: "Sjögren's-specific food scoring for the nutrient with this app's own most consistently positive trial evidence, saliva-stimulating medications tracked directly, and a full research library built around everyday hydration habits.",
    summary:
      "Foods you build or browse across this app's own eleven builders can already be scored specifically for Sjögren's through an omega-3 dimension, this app's own research found fairly consistent, positive trial evidence here, including measured improvement in both dry eye and dry mouth in the same trial. My Meds & Interactions tracks pilocarpine and cevimeline (plus hydroxychloroquine, shared from this app's own lupus research), both gland-stimulating medications rather than simple moisture replacements. The app's own Digest carries a full, dedicated Sjögren's category: primary-versus-secondary classification, lung and neurological effects beyond dryness, a history of the disease, pregnancy guidance covering congenital heart block risk, self-advocacy content on the labial salivary gland biopsy, international research (including documented geographic and ethnic variation in symptom presentation itself), this same Prevention & Lifestyle guidance built around same-day hydration habits, and a running Research Horizon covering dazodalibep and iscalimab, two drugs succeeding on exactly the core symptoms this app's own research found rituximab didn't move. This list keeps growing as more of the app gets built.",
    citations: [],
    overallTier: 'strong',
    relatedIds: ['prevention-sjogrens'],
  },
  {
    id: 'apphelps-pcos',
    category: 'basicHealth',
    title: 'How Inside Story Helps With PCOS Specifically',
    teaser: "PCOS-specific food scoring built around its own central insulin-resistance mechanism, spironolactone tracked with a potassium-safety rule, and a full research library covering quantified weight-loss thresholds.",
    summary:
      "Foods you build or browse across this app's own eleven builders can already be scored specifically for PCOS through a carbohydrate-and-fiber dimension, reusing the same purpose-built sub-criterion this app originally created for Type 1 diabetes, since PCOS's own central mechanism runs through the identical carbohydrate/insulin axis. My Meds & Interactions tracks spironolactone, letrozole, and clomiphene (plus metformin, shared from this app's own diabetes research), with a cited safety rule built directly in for spironolactone's own potassium risk. The app's own Digest carries a full, dedicated PCOS category: Rotterdam phenotype classification, cardiovascular and NAFLD comorbidities, a history of the diagnosis itself, pregnancy guidance covering letrozole-over-clomiphene evidence, self-advocacy content on why a full glucose tolerance test matters, international research (including a Gulf-region consanguinity finding), this same Prevention & Lifestyle guidance built around the quantified BAMBINI weight-loss trial, and a running Research Horizon covering fezolinetant, a drug correcting the actual brain signal driving PCOS. This list keeps growing as more of the app gets built.",
    citations: [],
    overallTier: 'strong',
    relatedIds: ['prevention-pcos'],
  },
  {
    id: 'apphelps-ckd',
    category: 'basicHealth',
    title: 'How Inside Story Helps With Chronic Kidney Disease Specifically',
    teaser: 'A purpose-built protein-density food score, ACE inhibitors and SGLT2 inhibitors tracked with a potassium-monitoring rule, and a full research library that corrects the standard "avoid potassium" advice directly.',
    summary:
      "Foods you build or browse across this app's own eleven builders can already be scored specifically for CKD through a purpose-built sub-criterion this app created from scratch, Protein Density, computed directly from each food's own measured protein content, since this app's own research found evidence against the standard blanket potassium-restriction advice most CKD patients are given, and built a more honest food score around what the evidence actually supports instead. My Meds & Interactions tracks lisinopril, losartan, dapagliflozin, sevelamer, and sodium bicarbonate, with a cited potassium-monitoring rule built directly in for ACE inhibitors and ARBs, plus an age-aware caution for anyone 65 and older. The app's own Digest carries a full, dedicated CKD category: G/A-stage heat-map staging, mineral-bone-cardiovascular effects, a history of dialysis itself, pregnancy guidance covering preeclampsia risk, self-advocacy content, international research (including a stark 200-fold global dialysis-access gap), this same Prevention & Lifestyle guidance, and a running Research Horizon covering sparsentan, finerenone, and inaxaplin, the first-ever genotype-targeted drug in nephrology. This list keeps growing as more of the app gets built.",
    citations: [],
    overallTier: 'strong',
    relatedIds: ['prevention-ckd'],
  },
  {
    id: 'apphelps-masld',
    category: 'basicHealth',
    title: 'How Inside Story Helps With Fatty Liver Disease (MASLD) Specifically',
    teaser: 'MASLD-specific food scoring for the two dimensions most directly tied to liver fat itself, newly-approved medications tracked directly, and a full research library built around a graded weight-loss staircase.',
    summary:
      "Foods you build or browse across this app's own eleven builders can already be scored specifically for MASLD across two dimensions this app's own research ties directly to the condition's own lipid-metabolism mechanism: fat processing, and additive load, a direct predictor of liver-fat change in MASLD specifically, not a generic processed-food warning borrowed from elsewhere. My Meds & Interactions tracks resmetirom, semaglutide, pioglitazone, and vitamin E, current medication options for a condition that, until recently, had no approved drug treatment at all. The app's own Digest carries a full, dedicated MASLD category: F0-F4 fibrosis staging, cardiovascular and kidney comorbidities, a history of the condition's own name changing twice, pregnancy guidance, self-advocacy content on the FIB-4 fibrosis-screening tool, international research (including a striking 'lean MASLD' pattern in Asian populations), this same Prevention & Lifestyle guidance built around a graded weight-loss staircase (3% helps, 10% can reverse fibrosis), and a running Research Horizon covering efruxifermin and survodutide. This list keeps growing as more of the app gets built.",
    citations: [],
    overallTier: 'strong',
    relatedIds: ['prevention-masld'],
  },
  {
    id: 'apphelps-type2',
    category: 'basicHealth',
    title: 'How Inside Story Helps With Type 2 Diabetes Specifically',
    teaser: 'T2D-specific food scoring built around the same carbohydrate mechanism this app first built for Type 1 diabetes, sulfonylureas tracked with a kidney-function safety rule, and a full research library built around a remission trial.',
    summary:
      "Foods you build or browse across this app's own eleven builders can already be scored specifically for T2D through the same purpose-built carbohydrate-and-fiber sub-criterion this app originally created for Type 1 diabetes, reused directly here since T2D's own central mechanism runs through the identical carbohydrate/insulin relationship. My Meds & Interactions tracks glipizide and glyburide (plus metformin, semaglutide, dapagliflozin, and insulin, shared across this app's own diabetes and kidney research), with a cited safety rule built directly in for sulfonylureas and reduced kidney function, plus an age-aware caution specifically naming glyburide for anyone 65 and older. The app's own Digest carries a full, dedicated Type 2 Diabetes category: prediabetes progression data, cognitive and liver effects, a history of metformin's own surprising origin, pregnancy guidance, self-advocacy content on individualized HbA1c targets, international research (including China and India's own combined share of the world's diabetes burden), this same Prevention & Lifestyle guidance built around the DiRECT remission trial, and a running Research Horizon covering retatrutide and orforglipron. This list keeps growing as more of the app gets built.",
    citations: [],
    overallTier: 'strong',
    relatedIds: ['prevention-type2'],
  },
  {
    id: 'apphelps-ibs',
    category: 'basicHealth',
    title: 'How Inside Story Helps With Irritable Bowel Syndrome Specifically',
    teaser: "IBS-specific food scoring matched directly to its own definition, rifaximin and linaclotide tracked directly, and a full research library naming delayed food triggers most people never connect to their own symptoms.",
    summary:
      "Foods you build or browse across this app's own eleven builders can already be scored specifically for IBS across two dimensions built directly around the condition's own actual mechanism: fiber load, matched to IBS's own digestive-tolerance sensitivity, and gut irritants, a direct match given how this app's own research defines the condition in the first place. My Meds & Interactions tracks rifaximin and linaclotide, the two medications this app's own IBS research covers directly. The app's own Digest carries a full, dedicated IBS category: Rome IV subtype classification, a fibromyalgia overlap, a history of how the diagnostic criteria themselves have evolved, pregnancy guidance, self-advocacy content on the red-flag symptoms that mean it isn't IBS after all, international research (including an honest complication in how diagnostic-criteria choice itself changes reported prevalence), this same Prevention & Lifestyle guidance naming delayed triggers like coffee and artificial sweeteners most people never connect to their own symptoms, and a running Research Horizon covering psychobiotics and a wearable vagus-nerve-stimulation device. This list keeps growing as more of the app gets built.",
    citations: [],
    overallTier: 'strong',
    relatedIds: ['prevention-ibs'],
  },
  {
    id: 'apphelps-migraine',
    category: 'basicHealth',
    title: 'How Inside Story Helps With Migraine Specifically',
    teaser: "An honest choice: no forced food score for migraine, since this app's own research found the old tyramine trigger-food theory doesn't hold up, but medications, trigger research, and a full library exist here instead.",
    summary:
      "Unlike most other conditions in this app, foods aren't yet given a migraine-specific score in the eleven Food-tab builders. This is a deliberate choice, not an oversight, this app's own already-covered research found the old tyramine explanation behind classic trigger foods (aged cheese, red wine) doesn't hold up under closer, more recent scrutiny, and rather than force a food score built on a theory the app's own research disputes, nothing was built at all until defensible data exists. What the app already does do: My Meds & Interactions tracks erenumab and sumatriptan (plus propranolol, shared from this app's own cardiovascular research), with a cited serotonin-syndrome safety rule built directly in for sumatriptan combined with SSRIs. The app's own Digest carries a full, dedicated Migraine category: episodic-versus-chronic classification, a history of migraine treatment, pregnancy guidance covering a striking 87% third-trimester improvement rate, self-advocacy content on red-flag headache symptoms, international research (including Belgium's own highest-in-the-world prevalence), this same Prevention & Lifestyle guidance built around consistency habits rather than a disputed trigger-food list, and a running Research Horizon covering CGRP gepants, neuromodulation devices, and a newer PACAP-targeted drug. This list keeps growing as more of the app gets built.",
    citations: [],
    overallTier: 'strong',
    relatedIds: ['prevention-migraine'],
  },
  {
    id: 'apphelps-cvd',
    category: 'basicHealth',
    title: 'How Inside Story Helps With Cardiovascular Disease Specifically',
    teaser: 'CVD-specific food scoring across three dimensions including a purpose-built sodium score, statins and aspirin tracked with interaction rules for two common combinations, and a full research library.',
    summary:
      "Foods you build or browse across this app's own eleven builders can already be scored specifically for cardiovascular risk across three dimensions: whole-food Mediterranean-pattern fit, a lipid-and-oxidative-stress profile, and a purpose-built Sodium Density score this app created from scratch, tiered using the same official DASH-aligned sodium thresholds public health guidance already uses. My Meds & Interactions tracks atorvastatin and aspirin (plus lisinopril, losartan, and propranolol, shared from this app's own kidney and thyroid research), with cited interaction rules built directly in for two common real-world combinations, aspirin taken too close to ibuprofen, and atorvastatin with grapefruit. The app's own Digest carries a full, dedicated CVD category: ACC/AHA heart-failure staging, kidney and brain effects tied to the same underlying disease process, a history rooted in the landmark Seven Countries Study, pregnancy guidance covering peripartum cardiomyopathy risk, self-advocacy content on lipid-panel testing intervals, international research (including Russia's own still-partially-unexplained post-Soviet mortality crisis), this same Prevention & Lifestyle guidance, and a running Research Horizon covering lipoprotein(a)-targeted drugs and colchicine's own newly-approved anti-inflammatory use. This list keeps growing as more of the app gets built.",
    citations: [],
    overallTier: 'strong',
    relatedIds: ['prevention-cvd'],
  },
  {
    id: 'apphelps-gout',
    category: 'basicHealth',
    title: 'How Inside Story Helps With Gout Specifically',
    teaser: 'Gout-specific food scoring built around a dietary-pattern finding, allopurinol and colchicine tracked with interaction rules for two serious combinations, and a full research library.',
    summary:
      "Foods you build or browse across this app's own eleven builders can already be scored specifically for gout through a processed-and-sugar-sweetened-food dimension, built directly around this app's own already-cited research tying sugar-sweetened beverages, not purine-rich vegetables or total protein, to measured gout risk. My Meds & Interactions tracks allopurinol, febuxostat, and colchicine (plus prednisone and ibuprofen, shared from this app's own broader medication research), with cited interaction rules built directly in for two serious combinations, allopurinol with azathioprine, and colchicine with atorvastatin. The app's own Digest carries a full, dedicated Gout category: a four-stage natural history, kidney and cardiovascular comorbidities, an over-4,000-year-old history of the disease, an honest note on pregnancy rarity, self-advocacy content on HLA-B*58:01 genetic screening before starting allopurinol, international research (including Oceania's own genetically-driven world-highest prevalence, and China's own diet-driven rising rate), this same Prevention & Lifestyle guidance built around a dairy-is-protective finding, and a running Research Horizon covering gut-microbiome-targeted urate therapy and pegloticase improvements. This list keeps growing as more of the app gets built.",
    citations: [],
    overallTier: 'strong',
    relatedIds: ['prevention-gout'],
  },
  {
    id: 'apphelps-prostate',
    category: 'basicHealth',
    title: 'How Inside Story Helps With Prostate Health Specifically',
    teaser: "Prostate-specific food scoring for zinc and whole-food eating, finasteride-class medications tracked directly, and a full research library built around some of oncology's strongest migrant-study evidence.",
    summary:
      "Foods you build or browse across this app's own eleven builders can already be scored specifically for prostate health across two dimensions: a direct prostate-tissue mineral-density lens (zinc), and a whole-food, anti-dysbiosis eating pattern tied to this app's own already-covered gut-microbiome-to-BPH research. My Meds & Interactions tracks finasteride, dutasteride, and tamsulosin, the medications this app's own prostate-health research covers directly. The app's own Digest carries a full, dedicated Prostate Health category: staging systems for both BPH and prostate cancer, untreated-BPH kidney and bladder risk, a history including the PSA test's own 1986 origin, self-advocacy content on age-specific PSA reference ranges, international research (including some of oncology's strongest evidence anywhere that diet, not just genetics, drives most of a 30-fold worldwide incidence gap), this same Prevention & Lifestyle guidance built around lycopene and exercise-mortality data, and a running Research Horizon covering PSMA-targeted radioligand therapy and PARP inhibitors for BRCA-mutated disease. This list keeps growing as more of the app gets built.",
    citations: [],
    overallTier: 'strong',
    relatedIds: ['prevention-prostate'],
  },
];
