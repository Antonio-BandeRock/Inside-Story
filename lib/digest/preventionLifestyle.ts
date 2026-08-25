// Prevention & Lifestyle — a new Basic Health topic, 2026-08-08, direct request:
// "Include a category for any of them that it can apply to, how to avoid
// problems with this condition, and then explain what they would need to
// change in their life about what they eat and how they exercise and how
// they maintain their macro and micro nutrients, and balance in their life
// and eating habits." Every one of the 19 tracked conditions gets a real
// entry here — for the genuinely preventable/lifestyle-driven conditions
// (Type 2 Diabetes, MASLD, gout, CVD, PCOS) this is real primary-prevention
// guidance; for the autoimmune/genetic conditions (Hashimoto's, T1D, celiac,
// lupus, MS, RA, Graves', Sjögren's, psoriasis, IBD), where lifestyle can't
// prevent the underlying disease, it's real, honestly-framed flare- and
// complication-reduction guidance instead — the distinction is stated
// directly in each entry, never blurred. Deliberately a SYNTHESIS layer, not
// new primary research: each entry pulls together diet, exercise,
// macro/micronutrient balance, and life balance from this Digest's own
// already-verified, already-cited condition-specific research (reusing those
// same real citations, not inventing new unverified facts), plus the WHO's
// own real general physical-activity guideline where exercise volume is
// worth stating plainly. Tagged 'basicHealth' throughout, per the direct
// request that this "probably fits best in the Basic Health section" — a
// real, general how-to-live-well framework with condition-specific notes,
// not disease-specific medical management (which stays in each condition's
// own category, as this whole Digest has held to throughout).
import type { DigestEntry } from './types';

const WHO_EXERCISE_CITATION = {
  source: 'WHO Guidelines on Physical Activity and Sedentary Behaviour 2020, PMC7719906',
  url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7719906/',
};

export const PREVENTION_LIFESTYLE_ENTRIES: DigestEntry[] = [
  {
    id: 'prevention-hashimotos',
    category: 'basicHealth',
    title: "Hashimoto's Can't Be Prevented Once Autoimmunity Has Started, but Choices Shape How Well It's Managed",
    teaser: "Hashimoto's levers: balanced (not excess, not deficient) iodine and selenium, medication timing, gut-supportive fiber, and avoiding the overtraining/under-eating patterns that suppress thyroid hormone.",
    summary: "Hashimoto's is autoimmune, genetic and environmental triggers set it in motion before any lifestyle choice comes into play, so this isn't about prevention in the way it might be for a purely diet-driven condition. What everyday choices DO shape is how well the condition is managed day to day. The already-covered research supports a few concrete changes: keep iodine intake balanced rather than chasing either extreme (both deficiency and excess can worsen thyroid autoimmunity, dose-dependent research already covers this directly); keep selenium intake adequate, since even mild deficiency tracks with worse autoimmune activity; take levothyroxine on an empty stomach, separated from calcium, iron, coffee, and high-fiber meals by the intervals the labs research already establishes; favor a whole-food, fiber-rich, moderately fermented diet that supports the gut barrier the microbiome research ties directly to autoimmune activity; and keep exercise real and moderate, rather than either sedentary or extreme, since both under-eating and overtraining can suppress T3 through the same cortisol/HPA-axis pathway already covered in the mitochondria research. The World Health Organization's general activity target, 150 to 300 minutes of moderate exercise weekly plus muscle-strengthening work twice a week, is a reasonable, unremarkable-feeling starting point, not an extreme one.",
    citations: [
      { source: "Iodine intake from universal salt iodization programs and Hashimoto's thyroiditis: a systematic review", url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12191997/' },
      WHO_EXERCISE_CITATION,
    ],
    overallTier: 'strong',
    relatedIds: ['nutrient-iodine', 'nutrient-selenium', 'labs-timing-master-rule'],
  },
  {
    id: 'prevention-ra',
    category: 'basicHealth',
    title: 'RA Flares Respond to Diet, Exercise, and One Modifiable Habit Above All Others',
    teaser: "RA's levers: a Mediterranean eating pattern, omega-3 dosing above 2.7g/day, moderate (not extreme) exercise, and smoking cessation, the single most consequential modifiable risk factor the RA research names.",
    summary:
      "Rheumatoid arthritis can't be prevented by diet alone once the underlying autoimmune process and genetic risk are in place, but this category's already-covered research gives concrete levers for reducing flares and slowing joint damage. Diet: a RCT-backed Mediterranean pattern (olive oil, legumes, vegetables, fish) measurably reduces disease activity, and omega-3 dosing above 2.7 grams daily for at least 3 months reduces NSAID reliance. Smoking cessation is the single most consequential change available, research ties smoking directly to the citrullination process that drives RA's antibody response, and quitting is one of the few RA risk factors a person can fully control. Exercise should be regular and moderate, not avoided out of fear of joint pain (research finds appropriate exercise reduces inflammation, not just maintains function) and not pushed to exhaustion. Bone protection matters directly: adequate calcium and vitamin D offset the fracture risk from glucocorticoid treatment already covered in this category. This category's own 'window of opportunity' research means acting on all of this EARLY, within the first few months of diagnosis, produces measurably better long-term outcomes than the same changes made later.",
    citations: [
      { source: 'Mediterranean Diet and Physical Activity Nudges versus Usual Care in Women with Rheumatoid Arthritis: the MADEIRA Randomized Controlled Trial', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9919932/' },
      WHO_EXERCISE_CITATION,
    ],
    overallTier: 'strong',
    relatedIds: ['ra-mediterranean-diet', 'ra-smoking-citrullination', 'ra-window-of-opportunity-early-treatment'],
  },
  {
    id: 'prevention-psoriasis',
    category: 'basicHealth',
    title: 'A Quantified Weight-Loss Threshold and Two Everyday Habits Move Psoriasis Severity',
    teaser: "Psoriasis's levers: even modest weight loss measurably reduces severity, alcohol and smoking both carry dose-dependent worsening effects, and skin trauma itself can trigger new patches.",
    summary:
      "Psoriasis has a genetic starting point (HLA-Cw6 and related markers), but this category's already-covered research finds several everyday factors that move how severe it runs. Weight loss carries RCT-backed benefit, even a modest reduction measurably lowers PASI severity scores, and a Mediterranean-pattern diet shows the same effect independently. Alcohol and smoking both carry dose-dependent worsening effects already covered in this category, quitting or cutting back on either is a direct lever, not just general health advice. A less obvious factor: physical trauma to the skin itself, a scratch, a sunburn, a tattoo, can trigger a brand-new psoriasis patch at that exact site (the Koebner phenomenon already covered here), so protecting skin from unnecessary injury is a practical habit. Regular, moderate exercise supports the same weight and cardiometabolic benefits already tied to lower severity, and stress management matters directly too, research already covered in this category ties stress to flare timing. Vitamin D's evidence is mixed for oral supplementation (an honest finding already covered here), so it isn't a guaranteed lever the way weight and alcohol are.",
    citations: [
      { source: 'Impact of weight-loss interventions on psoriasis severity: A systematic review and meta-analysis', url: 'https://pubmed.ncbi.nlm.nih.gov/41416383/' },
      WHO_EXERCISE_CITATION,
    ],
    overallTier: 'strong',
    relatedIds: ['psoriasis-weight-loss', 'psoriasis-alcohol', 'psoriasis-mediterranean-diet'],
  },
  {
    id: 'prevention-graves',
    category: 'basicHealth',
    title: "Graves' Disease Has One Dominant Modifiable Risk Factor, and Iodine Needs Care in Both Directions",
    teaser: "Graves' own levers: smoking cessation carries the single strongest evidence of any modifiable factor, iodine intake needs to stay balanced rather than excessive, and stress management has real, if newer, supporting evidence.",
    summary:
      "Graves' disease is autoimmune and can't be prevented by lifestyle once the underlying genetic and immune process is set in motion, but this category's already-covered research names one dominant modifiable factor above the rest: smoking. Meta-analysis-level evidence ties smoking directly to both a higher risk of developing Graves' disease and, more strongly, to worse thyroid eye disease specifically, making smoking cessation the single most consequential lifestyle change available. Iodine needs careful balance in the opposite direction from Hashimoto's: excess iodine can trigger or worsen Graves' disease in a genetically susceptible person, so avoiding high-dose iodine supplements and excessive seaweed/kelp intake matters directly, covered already in this category's iodine research. A newer body of evidence ties chronic stress to Graves' onset in genetically susceptible people, making stress management a legitimate, evidence-grounded lever, not just general advice. During an active, uncontrolled hyperthyroid phase, exercise needs caution, this category's already-covered cardiac research notes strain risk until heart rate and thyroid hormone levels are brought under control with treatment; once stabilized, the WHO's general activity guideline applies normally.",
    citations: [
      { source: 'Risk Factors of Thyroid Eye Disease, Endocrine Practice', url: 'https://pubmed.ncbi.nlm.nih.gov/33655885/' },
      WHO_EXERCISE_CITATION,
    ],
    overallTier: 'strong',
    relatedIds: ['graves-smoking', 'graves-iodine', 'graves-stress-trigger'],
  },
  {
    id: 'prevention-type1',
    category: 'basicHealth',
    title: "Type 1 Diabetes Can't Be Prevented by Diet, but Daily Choices Shape How Well It's Lived With",
    teaser: 'Type 1 diabetes carries no dietary or lifestyle prevention, the autoimmune process is already underway before diagnosis, but carb-counting accuracy, exercise timing, and bone-protective exercise all measurably shape day-to-day and long-term outcomes.',
    summary:
      "Type 1 diabetes results from an autoimmune destruction of insulin-producing cells that begins well before diagnosis, this category's already-covered staging research confirms it can be detected years earlier via antibody testing, but no known diet or lifestyle change stops or prevents that underlying process. What everyday choices DO shape is how well the condition is managed once it's here. Carbohydrate counting accuracy matters directly, this category's already-covered research finds an average 21% error rate in typical carb estimates, and closing that gap measurably improves glucose stability. Exercise carries complexity, aerobic exercise can drop glucose while resistance exercise can sometimes raise it, so timing and type both matter, not just volume, and this category's already-covered alcohol research adds a delayed-hypoglycemia risk to plan around specifically. Bone health deserves direct attention given this category's already-covered sevenfold hip-fracture-risk finding, weight-bearing and resistance exercise are a protective lever here specifically. Consistent meal timing, sick-day protocols, and awareness of this category's already-covered celiac comorbidity (screening for gluten sensitivity, not avoiding gluten preemptively) round out the practical picture.",
    citations: [
      { source: 'Carbohydrate counting accuracy and blood glucose variability in adults with type 1 diabetes', url: 'https://pubmed.ncbi.nlm.nih.gov/23146371/' },
      WHO_EXERCISE_CITATION,
    ],
    overallTier: 'strong',
    relatedIds: ['type1-carb-counting-accuracy', 'type1-bone-health-fracture-risk', 'type1-exercise-glucose'],
  },
  {
    id: 'prevention-celiac',
    category: 'basicHealth',
    title: "Celiac Disease Has Exactly One Prevention Strategy Once Diagnosed, and It's Complete, Not Partial",
    teaser: "Celiac's lever isn't moderation, it's strict, lifelong gluten avoidance, plus deliberate attention to the nutrients a gluten-free diet can quietly leave short.",
    summary:
      "Celiac disease is unusual in this Digest: it has exactly one effective prevention strategy, and it's binary rather than a spectrum of moderation. Once diagnosed, strict, lifelong avoidance of gluten, including attention to cross-contamination already covered in this category (shared cooking water, shared toasters, mislabeled products), is the only treatment that stops ongoing intestinal damage. What needs active management alongside that: this category's already-covered research finds commercial gluten-free products often run lower in protein and fiber and higher in sugar and cost than their gluten-containing equivalents, so a whole-food gluten-free pattern (naturally gluten-free grains, vegetables, lean protein) matters more than simply swapping in packaged gluten-free substitutes. Deliberate attention to iron, folate, B12, vitamin D, calcium, and zinc is worth building into a regular diet, since this category's already-covered research finds these can run short on a gluten-free diet if not actively managed. Bone-protective, weight-bearing exercise matters directly given this category's already-covered bone-density findings at diagnosis, and regular dental checkups are worth keeping given the documented enamel-defect risk already covered here.",
    citations: [
      { source: 'Nutritional quality and costs of gluten-free products: a case-control study of food products on the Norwegian market', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8009084/' },
      WHO_EXERCISE_CITATION,
    ],
    overallTier: 'strong',
    relatedIds: ['celiac-cross-contamination', 'celiac-gf-diet-nutritional-pitfalls', 'celiac-bone-density', 'diet-gluten-free'],
  },
  {
    id: 'prevention-ibd',
    category: 'basicHealth',
    title: "IBD's Own Levers Include a Direct Correction to the Common 'Avoid Fiber' Advice",
    teaser: "IBD's levers: smoking cessation matters, but works in OPPOSITE directions for Crohn's and ulcerative colitis, and evidence finds higher fiber intake tracking with LOWER flare risk, not the restriction many people are told.",
    summary: "Inflammatory bowel disease has genetic and environmental triggers already covered in this category, and while lifestyle can't prevent the underlying disease from developing, it shapes flare frequency and severity. Smoking needs careful, disease-specific framing: it's a documented risk factor for developing and worsening Crohn's disease, but carries a paradoxical protective effect specifically against ulcerative colitis, already covered in this category, meaning the right smoking-related guidance depends on which specific IBD diagnosis someone has. A direct correction: the common advice to restrict fiber during a flare has surprisingly thin evidence behind it, this category's already-covered research found no support for the restriction and, more strikingly, found higher fiber intake tracking with LOWER flare risk within six months. Vitamin D deficiency tracks directly with disease severity, adequate levels are a worthwhile target. Regular, moderate exercise, adequate hydration, and stress management all support the same gut-barrier and inflammation pathways already covered throughout the gut-microbiome research, and NSAIDs are worth avoiding given their documented flare-triggering potential.",
    citations: [
      { source: 'Dietary Strategies for Gut Barrier Integrity in Inflammatory Bowel Disease: The Impact of Fiber and Beyond', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12893188/' },
      WHO_EXERCISE_CITATION,
    ],
    overallTier: 'strong',
    relatedIds: ['ibd-fiber-flare-myth', 'ibd-smoking-paradox', 'ibd-vitamin-d-deficiency-severity'],
  },
  {
    id: 'prevention-ms',
    category: 'basicHealth',
    title: 'MS Risk Is Set Early in Life by Named Factors, and Diet/Exercise Choices Still Shape Life With It',
    teaser: "MS's levers: vitamin D and sun exposure before age 15 shape lifelong risk, smoking cessation matters at any age, and a lower-saturated-fat dietary pattern shows a quantified fatigue and quality-of-life benefit.",
    summary:
      "This category's already-covered latitude-gradient and EBV research shows MS risk is substantially set by factors (childhood sun exposure, viral history) that are largely out of anyone's later control, but meaningful levers still exist for both risk and day-to-day life with the condition. Smoking cessation carries direct evidence for reducing both onset risk and disease progression. Vitamin D deserves careful framing: it's strongly linked to MS risk in observational research, but this category's already-covered trial evidence for SUPPLEMENTATION specifically is honestly mixed, adequate levels are still a reasonable, low-risk target. Diet carries quantified benefit: the WAVES trial, already covered in this category, found both the Swank (very low saturated fat) and Wahls (nutrient-dense, plant-forward) diets produced clinically meaningful fatigue and quality-of-life improvement, sharing a common thread of whole-food, limited-processed-food eating. Exercise needs one MS-specific caution this category already covers, Uhthoff's phenomenon, temporary symptom worsening from overheating during exertion, meaning cooling strategies matter as much as exercise volume itself. Fasting-mimicking approaches show preliminary promise but remain honestly experimental rather than established guidance.",
    citations: [
      { source: 'Wahls TL, et al., Multiple Sclerosis Journal - Experimental, Translational and Clinical, 2021, "Impact of the Swank and Wahls elimination dietary interventions on fatigue and quality of life in relapsing-remitting multiple sclerosis: The WAVES randomized parallel-arm clinical trial"', url: 'https://journals.sagepub.com/doi/10.1177/20552173211035399' },
      WHO_EXERCISE_CITATION,
    ],
    overallTier: 'strong',
    relatedIds: ['ms-waves-trial', 'ms-uhthoffs-phenomenon-heat', 'ms-smoking-risk'],
  },
  {
    id: 'prevention-lupus',
    category: 'basicHealth',
    title: "Lupus's Own Levers Center on One Very Specific Environmental Trigger and Sun Protection",
    teaser: "Lupus's levers: sun protection is non-negotiable given photosensitivity's flare-triggering effect, alfalfa sprouts carry a named, avoidable risk, and occupational silica dust exposure is a modifiable factor.",
    summary:
      "Lupus has genetic and, per this category's already-covered research, ethnic risk factors that can't be changed through lifestyle, but several concrete, everyday levers matter for flare prevention. Sun protection is close to non-negotiable, this category's already-covered photosensitivity research finds sun exposure can trigger a full-body flare, making consistent sunscreen and sun avoidance a primary lever rather than a general skin-health suggestion. One specific, avoidable food deserves direct naming: alfalfa sprouts, already covered in this category, contain a compound (L-canavanine) documented to induce a lupus-like immune response. Omega-3 shows modest, low-certainty benefit per this category's already-covered meta-analysis. Smoking cessation matters directly, and anyone in mining, construction, sandblasting, or similar industrial work should know about the documented silica-dust exposure risk already covered in this category, a modifiable occupational factor. Vitamin D needs honest, careful framing given this category's already-covered catch-22 (sun protection reduces flare risk but also reduces the body's own vitamin D production), making dietary or supplemental vitamin D a more reliable lever than sun exposure for meeting needs. Exercise should stay moderate, especially during active flares.",
    citations: [
      { source: 'Vitamin D Status a Common Health Concern for People with Lupus, Though Not Linked to Disease Activity, Lupus Foundation of America', url: 'https://www.lupus.org/news/vitamin-d-status-a-common-health-concern-for-people-with-lupus-though-not-linked-to-disease' },
      WHO_EXERCISE_CITATION,
    ],
    overallTier: 'strong',
    relatedIds: ['lupus-photosensitivity-vitamin-d-catch22', 'lupus-alfalfa-canavanine', 'lupus-global-silica-occupational-clusters'],
  },
  {
    id: 'prevention-sjogrens',
    category: 'basicHealth',
    title: "Sjögren's Own Levers Center Directly on Hydration and Two Everyday Dehydrating Habits",
    teaser: "Sjögren's levers: alcohol and caffeine both carry a direct dehydrating effect that worsens core symptoms within hours, omega-3 shows trial-backed benefit for both dry eyes and dry mouth, and xylitol offers a two-way dental protection.",
    summary:
      "Sjögren's syndrome centers on immune-driven damage to moisture-producing glands, and while lifestyle can't reverse that underlying process, this category's already-covered research names everyday habits that measurably worsen or ease the core dryness symptoms. Alcohol and caffeine both carry a documented dehydrating effect that worsens dryness within hours, already covered in this category, making moderation a same-day lever rather than a long-term one. Omega-3 shows strong, randomized trial evidence here, more consistently positive than in several other conditions covered in this Digest, improving both dry eye symptoms and measured saliva flow in the same trial. Xylitol offers a two-way dental benefit already covered in this category, it stimulates saliva production while not feeding the cavity-causing bacteria sugar would, directly protecting against the rapid tooth decay risk this condition carries. Adequate, consistent hydration throughout the day matters more here than in most conditions in this Digest, given how directly and quickly it affects core symptoms. Regular dental and eye care, moderate exercise, and avoiding unnecessarily dry indoor environments round out the practical picture.",
    citations: [
      { source: "A Randomised Double-Blind Placebo-Controlled Clinical Trial of Fish Oil (Omega-3) in Sjögren's Syndrome Patients in Erbil-Iraq", url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12183441/' },
      WHO_EXERCISE_CITATION,
    ],
    overallTier: 'strong',
    relatedIds: ['sjogrens-alcohol-caffeine-dehydration', 'sjogrens-omega3-dry-eye-mouth', 'sjogrens-xylitol-saliva-stimulation'],
  },
  {
    id: 'prevention-pcos',
    category: 'basicHealth',
    title: "PCOS's Own Central Mechanism Means Diet and Exercise Aren't Just Helpful, They're the Primary Treatment",
    teaser: "PCOS's levers: even modest weight loss (each 1% lost tracks with a 5.6% higher chance of ovulation returning), a lower-glycemic-load diet, and combined aerobic-plus-resistance exercise all work through the same central insulin-resistance mechanism.",
    summary: "PCOS is different from most autoimmune conditions: its central mechanism, insulin resistance, is directly, powerfully responsive to diet and exercise, making lifestyle change closer to a primary treatment here than in almost any other condition covered. This category's already-covered BAMBINI trial found each single percentage point of body weight lost tracking with a 5.6% higher chance of ovulation returning, a direct, quantified, real-world benefit. A lower-glycemic-load diet pattern (favoring whole grains, legumes, and vegetables over refined carbohydrates) directly targets the same insulin-resistance mechanism. Exercise matters in both forms already covered in the general research, aerobic activity for cardiometabolic benefit and resistance training for insulin sensitivity specifically, making the WHO's combined aerobic-plus-strength guideline especially well-suited here. Specific supplements carry trial support in this category: myo-inositol and D-chiro-inositol at the 40:1 ratio already covered, and spearmint tea's anti-androgen effect. Sleep deserves direct attention too, given this category's already-covered sleep-apnea comorbidity, and stress management matters through the same cortisol-insulin interaction already covered elsewhere in the hormone research.",
    citations: [
      { source: 'Ovulatory Recovery following weight loss in women with polycystic ovary syndrome and obesity: a post hoc analysis of the BAMBINI randomised controlled trial', url: 'https://pubmed.ncbi.nlm.nih.gov/41808368/' },
      WHO_EXERCISE_CITATION,
    ],
    overallTier: 'strong',
    relatedIds: ['pcos-weight-loss-modest', 'pcos-myo-dchiro-inositol', 'pcos-insulin-resistance-mechanism'],
  },
  {
    id: 'prevention-ckd',
    category: 'basicHealth',
    title: "CKD's Own Levers Include a Direct, Honest Correction to the Standard 'Avoid Potassium' Advice",
    teaser: "CKD's levers: the standard blanket potassium-restriction advice has surprisingly thin evidence, a plant-forward protein pattern shows advantages over animal protein, and NSAIDs carry a quantified, largely avoidable injury risk.",
    summary:
      "Chronic kidney disease progression responds to everyday choices, and this category's already-covered research includes a direct correction: blanket potassium restriction, the 'avoid bananas and oranges' advice given to nearly every CKD patient, has surprisingly little trial evidence behind it, and emerging research points toward a liberalized, plant-based, high-fiber pattern as potentially more helpful than restriction. Protein source matters more than protein avoidance: this category's already-covered research finds a plant-forward low-protein pattern (0.6 to 0.8g/kg/day) superior to animal-based protein on several measured outcomes. Sodium moderation following a DASH-aligned pattern remains well-supported. NSAIDs deserve direct avoidance given this category's already-covered, quantified injury risk (73% general population, 63% in existing CKD). 'Hidden phosphorus,' the highly-absorbed additive form already covered in this category, is worth watching for on ingredient labels specifically, more than naturally-occurring phosphorus in whole foods. Adequate hydration, blood pressure control through the same DASH-style diet and regular moderate exercise, and avoiding documented nephrotoxic herbal supplements (aristolochic acid, already covered here) round out the practical picture.",
    citations: [
      { source: 'Re-Thinking Hyperkalaemia Management in Chronic Kidney Disease, Beyond Food Tables and Nutrition Myths: An Evidence-Based Practice Review', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10780359/' },
      WHO_EXERCISE_CITATION,
    ],
    overallTier: 'strong',
    relatedIds: ['ckd-potassium-restriction-reconsidered', 'ckd-protein-restriction-plant-based', 'ckd-nsaid-kidney-injury-real-data'],
  },
  {
    id: 'prevention-masld',
    category: 'basicHealth',
    title: 'A Graded Weight-Loss Staircase, Not an All-or-Nothing Target, Defines How to Reverse MASLD',
    teaser: 'MASLD\'s levers: weight loss works in distinct steps (3%+ improves histology, 7%+ improves inflammation, 10%+ can reverse fibrosis), and exercise independently reduces liver fat even without any weight change at all.',
    summary:
      "MASLD responds directly and measurably to everyday lifestyle change, more so than almost any other condition in this Digest, and this category's already-covered research maps out a graded staircase rather than one all-or-nothing target. Losing just 3% of body weight already tracks with measurably improved liver histology; 5% reduces liver fat; 7% improves inflammation; 10% can stabilize or reverse fibrosis, meaningful benefit at every step along the way, not only at an ambitious endpoint. A surprising finding: exercise reduces liver fat independently of any weight change at all, meaning movement itself matters even before the scale moves. A Mediterranean-pattern diet performs about as well as a plainer low-fat diet in head-to-head trials, weight loss and reduced ultra-processed food intake appear to be the driving mechanism more than any one specific diet label. Coffee carries consistently positive evidence (lower MASLD odds, slower fibrosis progression). Reducing added sugar and high-fructose corn syrup specifically, and resistance exercise to guard against the sarcopenic-obesity risk already covered in this category, round out the practical picture, alongside current medical options (semaglutide, resmetirom) for those who need more than lifestyle change alone provides.",
    citations: [
      { source: 'The Impact of Body Weight Change on Liver Histology in Metabolic Dysfunction-Associated Steatotic Liver Disease Across Various Histological Endpoints: A Systematic Review and Meta-Analysis', url: 'https://pubmed.ncbi.nlm.nih.gov/41510965/' },
      WHO_EXERCISE_CITATION,
    ],
    overallTier: 'strong',
    relatedIds: ['masld-weight-loss-thresholds', 'masld-exercise-independent-weight-loss', 'masld-coffee-protective'],
  },
  {
    id: 'prevention-type2',
    category: 'basicHealth',
    title: 'Type 2 Diabetes Shows Documented Remission, Not Just Management, Through Diet and Exercise Alone',
    teaser: "Type 2 diabetes's levers: the DiRECT trial found 46% of participants reached complete remission through structured weight management alone, and time-restricted eating shows an independent glucose benefit.",
    summary:
      "Type 2 diabetes carries some of the most striking evidence of lifestyle producing remission, not just management, of any condition in this Digest. This category's already-covered DiRECT trial found 46% of participants achieved complete diabetes remission at 12 months through a structured weight-management program alone, with some sustaining it 5 years out. Diet pattern matters directly: low-carbohydrate approaches showed strong short-term remission rates in this category's already-covered meta-analysis, and time-restricted eating independently improved fasting glucose and HbA1c in pooled trial data, a different, complementary lever from calorie or carbohydrate content alone. Exercise needs both forms already established in this Digest, aerobic activity and resistance training together, matching the WHO's combined guideline directly. Sleep deserves direct attention given this category's already-covered sleep-apnea research. A important complication: intensive glycemic control below the standard target doesn't improve outcomes and raises hypoglycemia risk, meaning the goal is an individualized target, not the tightest number achievable. Regular screening for retinopathy and neuropathy from the moment of diagnosis matters directly, given this category's already-covered finding that complications are often already present by then.",
    citations: [
      { source: 'Lean MEJ, et al., The Lancet, 2018, "Primary care-led weight management for remission of type 2 diabetes (DiRECT): an open-label, cluster-randomised trial"', url: 'https://pubmed.ncbi.nlm.nih.gov/29221645/' },
      WHO_EXERCISE_CITATION,
    ],
    overallTier: 'strong',
    relatedIds: ['type2-direct-remission-trial', 'type2-time-restricted-eating', 'type2-individualized-hba1c-targets'],
  },
  {
    id: 'prevention-ibs',
    category: 'basicHealth',
    title: "IBS's Own Levers Blend Structured Diet Change With the Brain-Gut Connection Directly",
    teaser: "IBS's levers: a structured, temporary low-FODMAP elimination, delayed-effect triggers (coffee, alcohol, artificial sweeteners) most people never connect to their symptoms, and brain-gut-axis therapies like CBT and gut-directed hypnotherapy.",
    summary:
      "IBS responds to a dual set of levers, this category's already-covered visceral-hypersensitivity research explains why both diet AND the brain-gut connection itself matter directly, not just one or the other. A structured, TEMPORARY low-FODMAP elimination, followed by systematic reintroduction (not permanent restriction), remains the best-evidenced dietary approach already covered in this category. A easy-to-miss finding: coffee, alcohol, and artificial sweeteners can all trigger symptoms on a DELAYED timeline (1 to 72 hours later per this category's already-covered research), meaning a same-day symptom diary can miss the trigger entirely. Soluble fiber tends to help more consistently than insoluble fiber. Regular meal timing and adequate hydration support gut motility directly. Brain-gut-axis therapies deserve equal weight to dietary change here, cognitive behavioral therapy and gut-directed hypnotherapy both carry trial evidence already covered in this category, since IBS's mechanism runs through the nervous system's processing of gut signals, not diet content alone. Regular, moderate exercise and stress management both work through this same pathway. Peppermint oil carries real, if imperfect, evidence as a targeted symptom-relief option.",
    citations: [
      { source: 'Efficacy of dietary interventions in irritable bowel syndrome: a systematic review and network meta-analysis', url: 'https://pubmed.ncbi.nlm.nih.gov/40258374/' },
      WHO_EXERCISE_CITATION,
    ],
    overallTier: 'strong',
    relatedIds: ['ibs-low-fodmap-diet', 'ibs-non-fodmap-triggers', 'ibs-cbt-brain-gut-therapy'],
  },
  {
    id: 'prevention-migraine',
    category: 'basicHealth',
    title: "Migraine's Own Levers Are Mostly About Consistency, Not Any One Specific Food",
    teaser: "Migraine's levers: consistent sleep and meal timing matter more than any specific 'trigger food' avoidance list, a specific magnesium/riboflavin/CoQ10 combination shows trial-backed prevention benefit, and caffeine needs consistency more than avoidance.",
    summary:
      "Migraine management centers on everyday consistency more than eliminating any one specific food, and this category's already-covered research includes an honest correction to some of the most common migraine advice: tyramine, the compound long blamed for aged-cheese and red-wine triggers, has documented problems as an explanation, and chocolate's evidence is mixed rather than a clear culprit. What evidence DOES support: a consistent sleep schedule and consistent meal timing (never skipping meals) both matter directly, since irregularity itself is a documented trigger. A specific combination, magnesium, riboflavin, and CoQ10 together, showed randomized trial benefit already covered in this category, reducing migraine days measurably more than either component alone might suggest. Caffeine carries complexity: it can be both a trigger for some people and a withdrawal-headache cause for others, sometimes through the very same medication, making CONSISTENCY (not necessarily elimination) the more reliable lever. Adequate hydration and regular, moderate (not suddenly intense) exercise both help, and stress-management techniques carry genuine, if modest, supporting evidence.",
    citations: [
      { source: 'Improvement of migraine symptoms with a proprietary supplement containing riboflavin, magnesium and Q10: a randomized, placebo-controlled, double-blind, multicenter trial', url: 'https://pubmed.ncbi.nlm.nih.gov/25916335/' },
      WHO_EXERCISE_CITATION,
    ],
    overallTier: 'strong',
    relatedIds: ['migraine-magnesium-riboflavin-coq10', 'migraine-food-triggers-honest-nuance', 'migraine-caffeine-dual-role'],
  },
  {
    id: 'prevention-cvd',
    category: 'basicHealth',
    title: 'CVD Risk Responds Directly to a Well-Proven Diet Pattern, Not a Long List of Individual Rules',
    teaser: "CVD's levers: a Mediterranean or DASH-style whole-food pattern, quantified exercise volume, smoking cessation, and sodium moderation all trace back to the same foundational Seven Countries Study already covered in this category.",
    summary:
      "Cardiovascular disease responds directly and substantially to everyday choices, this category's already-covered Seven Countries Study first established the connection at international scale, finding southern European, Mediterranean-diet-following populations carrying roughly half the cardiovascular disease rate of northern European populations. The practical version of that same finding: a whole-food pattern built around olive oil, legumes, vegetables, and fish, low in saturated fat and processed food, is the single best-evidenced dietary lever in this whole category. Exercise carries quantified benefit at the WHO's general 150 to 300 minute weekly target, and this category's already-covered cardiac-rehabilitation research finds a 26 to 31% mortality reduction from structured post-event exercise programs specifically. Smoking cessation and sodium moderation (the same DASH-aligned target already covered in this category) both carry strong, direct evidence. Alcohol needs honest framing given this category's already-covered research, cardiovascular risk exists, but the evidence doesn't support a single simple rule the way smoking cessation does. Regular blood pressure and lipid-panel monitoring (already covered in this category's self-advocacy research) matters directly, since much of the risk-reduction value of diet and exercise only becomes visible through actually tracking these numbers over time.",
    citations: [
      { source: 'How the Seven Countries Study contributed to the definition and development of the Mediterranean diet concept: A 50-year journey, Nutrition, Metabolism and Cardiovascular Diseases', url: 'https://www.nmcd-journal.com/article/S0939-4753(14)00347-0/abstract' },
      WHO_EXERCISE_CITATION,
    ],
    overallTier: 'strong',
    relatedIds: ['cvd-global-seven-countries-mediterranean', 'cvd-cardiac-rehabilitation-underused', 'cvd-dash-sodium'],
  },
  {
    id: 'prevention-gout',
    category: 'basicHealth',
    title: 'Gout Responds to a Specific Diet Pattern, Not the Generic "Avoid All Purines" Rule Most People Hear',
    teaser: "Gout's levers: research found meat and seafood raise risk while dairy is actually protective, sugar-sweetened drinks and beer both carry dose-dependent risk, and even modest weight loss shows a quantified benefit.",
    summary:
      "Gout responds directly to specific dietary choices, and this category's already-covered landmark cohort study found something more nuanced than the generic 'avoid all purines' advice most people hear: meat carried a 41% higher risk and seafood a 51% higher risk, while dairy carried a 44% LOWER risk in the very same study, a protective association, not just a neutral one. Purine-rich vegetables and total protein overall were NOT associated with increased risk at all in that same research, directly countering the assumption that all purines behave identically. Beer carries the strongest alcohol-related risk of any type studied (49% higher per daily serving), while wine showed no significant association. Sugar-sweetened beverages carry dose-dependent risk up to 85% higher at 2 or more daily servings. Weight loss shows quantified benefit across multiple intervention types already covered in this category. Three specific protective foods carry trial support: cherries, vitamin C (500mg/day in a RCT), and coffee (both caffeinated and decaf). Adequate hydration and avoiding known urate-lowering-therapy interactions (already covered in this category's medication research) round out the practical picture.",
    citations: [
      { source: 'Purine-Rich Foods, Dairy and Protein Intake, and the Risk of Gout in Men', url: 'https://pubmed.ncbi.nlm.nih.gov/15014182/' },
      WHO_EXERCISE_CITATION,
    ],
    overallTier: 'strong',
    relatedIds: ['gout-purine-foods-and-dairy', 'gout-cherries', 'gout-weight-loss-uric-acid'],
  },
  {
    id: 'prevention-prostate',
    category: 'basicHealth',
    title: "Prostate Health's Own Levers Are Backed by Some of Oncology's Strongest Migrant-Study Evidence",
    teaser: "Prostate health's levers: lycopene, cruciferous vegetables, and regular exercise all carry quantified benefit, and migrant studies already covered in this category prove diet change measurably shifts risk within one lifetime, not just across generations.",
    summary: "Prostate health responds to everyday choices backed by some of the strongest evidence in the that diet changes individual risk, not just population-level statistics. This category's already-covered migrant studies found men who moved from a low-incidence country to a high-incidence one saw their prostate cancer risk rise 4 to 12-fold within one generation, direct proof that environment and diet, not just genetics, drive most of the worldwide 30-fold incidence gap. Lycopene (concentrated in cooked tomatoes) and cruciferous vegetables (broccoli, cauliflower, the same sulforaphane compound already covered elsewhere) both carry dose-response trial support. Regular exercise carries a direct mortality benefit already covered in this category, not just a general fitness recommendation. Everyday choices: limiting processed and charred meat, moderating choline intake given the gut-bacteria-to-TMAO pathway already covered in this category, and keeping zinc intake adequate given the prostate's distinctive tissue concentration of it. Weight management and moderate alcohol both matter, and regular PSA and symptom monitoring (already covered in this category's self-advocacy research) is worth pursuing alongside diet and exercise, not instead of them.",
    citations: [
      { source: 'Increased dietary and circulating lycopene are associated with reduced prostate cancer risk: a systematic review and meta-analysis, Prostate Cancer and Prostatic Diseases', url: 'https://www.nature.com/articles/pcan201725' },
      WHO_EXERCISE_CITATION,
    ],
    overallTier: 'strong',
    relatedIds: ['prostate-global-incidence-migrant-studies', 'prostate-lycopene-tomatoes', 'prostate-exercise-cancer-mortality'],
  },
];
