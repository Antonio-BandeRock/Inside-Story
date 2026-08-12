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
    title: "Hashimoto's Can't Be Prevented Once Autoimmunity Has Started, but Real Choices Shape How Well It's Managed",
    teaser: "Hashimoto's own real levers: balanced (not excess, not deficient) iodine and selenium, medication timing, gut-supportive fiber, and avoiding the overtraining/under-eating patterns that suppress thyroid hormone.",
    summary: "Hashimoto's is autoimmune, real genetic and environmental triggers set it in motion before any lifestyle choice comes into play, so this isn't about prevention in the way it might be for a purely diet-driven condition. What real, everyday choices DO shape is how well the condition is managed day to day. The already-covered research supports a few real, concrete changes: keep iodine intake balanced rather than chasing either extreme (both deficiency and excess can worsen thyroid autoimmunity, real, dose-dependent research already covers this directly); keep selenium intake adequate, since even mild deficiency tracks with worse autoimmune activity; take levothyroxine on an empty stomach, separated from calcium, iron, coffee, and high-fiber meals by the real intervals the labs research already establishes; favor a whole-food, fiber-rich, moderately fermented diet that supports the gut barrier the microbiome research ties directly to autoimmune activity; and keep exercise real and moderate, rather than either sedentary or extreme, since both under-eating and overtraining can suppress T3 through the same cortisol/HPA-axis pathway already covered in the mitochondria research. The World Health Organization's own general activity target, 150 to 300 minutes of moderate exercise weekly plus muscle-strengthening work twice a week, is a real, reasonable, unremarkable-feeling starting point, not an extreme one.",
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
    title: 'RA Flares Genuinely Respond to Diet, Exercise, and One Real, Modifiable Habit Above All Others',
    teaser: "RA's own real levers: a Mediterranean eating pattern, real omega-3 dosing above 2.7g/day, moderate (not extreme) exercise, and smoking cessation, the single most consequential modifiable risk factor the RA research names.",
    summary:
      "Rheumatoid arthritis can't be prevented by diet alone once the underlying autoimmune process and genetic risk are in place, but this category's own already-covered research gives real, concrete levers for reducing flares and slowing joint damage. Diet: a real, RCT-backed Mediterranean pattern (olive oil, legumes, vegetables, fish) measurably reduces disease activity, and real omega-3 dosing above 2.7 grams daily for at least 3 months reduces NSAID reliance. Smoking cessation is the single most consequential change available, real research ties smoking directly to the citrullination process that drives RA's own antibody response, and quitting is one of the few RA risk factors a person can fully control. Exercise should be regular and moderate, not avoided out of fear of joint pain (real research finds appropriate exercise reduces inflammation, not just maintains function) and not pushed to exhaustion. Bone protection matters directly: adequate calcium and vitamin D offset the real fracture risk from glucocorticoid treatment already covered in this category. Worth knowing directly: this category's own real 'window of opportunity' research means acting on all of this EARLY, within the first few months of diagnosis, produces measurably better long-term outcomes than the same changes made later.",
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
    title: 'A Real, Quantified Weight-Loss Threshold and Two Everyday Habits Genuinely Move Psoriasis Severity',
    teaser: "Psoriasis's own real levers: even modest weight loss measurably reduces severity, alcohol and smoking both carry real dose-dependent worsening effects, and skin trauma itself can trigger new patches.",
    summary:
      "Psoriasis has a real, genetic starting point (HLA-Cw6 and related markers), but this category's own already-covered research finds several real, everyday factors that genuinely move how severe it runs. Weight loss carries real, RCT-backed benefit, even a modest reduction measurably lowers PASI severity scores, and a Mediterranean-pattern diet shows the same real effect independently. Alcohol and smoking both carry real, dose-dependent worsening effects already covered in this category, quitting or cutting back on either is a real, direct lever, not just general health advice. A less obvious real factor: physical trauma to the skin itself, a scratch, a sunburn, a tattoo, can trigger a brand-new psoriasis patch at that exact site (the Koebner phenomenon already covered here), so protecting skin from unnecessary injury is a real, practical habit. Regular, moderate exercise supports the same weight and cardiometabolic benefits already tied to lower severity, and stress management matters directly too, real research already covered in this category ties stress to flare timing. Vitamin D's own evidence is genuinely mixed for oral supplementation (a real, honest finding already covered here), so it isn't a guaranteed lever the way weight and alcohol are.",
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
    title: "Graves' Disease Has One Real, Dominant Modifiable Risk Factor, and Iodine Needs Care in Both Directions",
    teaser: "Graves' own real levers: smoking cessation carries the single strongest real evidence of any modifiable factor, iodine intake needs to stay balanced rather than excessive, and stress management has real, if newer, supporting evidence.",
    summary:
      "Graves' disease is autoimmune and can't be prevented by lifestyle once the underlying genetic and immune process is set in motion, but this category's own already-covered research names one real, dominant modifiable factor above the rest: smoking. Real, meta-analysis-level evidence ties smoking directly to both a higher risk of developing Graves' disease and, more strongly, to worse thyroid eye disease specifically, making smoking cessation the single most consequential lifestyle change available. Iodine needs real, careful balance in the opposite direction from Hashimoto's: excess iodine can trigger or worsen Graves' disease in a genetically susceptible person, so avoiding high-dose iodine supplements and excessive seaweed/kelp intake matters directly, covered already in this category's own iodine research. A real, newer body of evidence ties chronic stress to Graves' onset in genetically susceptible people, making real stress management a legitimate, evidence-grounded lever, not just general advice. During an active, uncontrolled hyperthyroid phase, exercise needs real caution, this category's own already-covered cardiac research notes real strain risk until heart rate and thyroid hormone levels are brought under control with treatment; once stabilized, the WHO's own general activity guideline applies normally.",
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
    title: "Type 1 Diabetes Can't Be Prevented by Diet, but Real, Daily Choices Shape How Well It's Lived With",
    teaser: 'Type 1 diabetes carries no real dietary or lifestyle prevention, the autoimmune process is already underway before diagnosis, but real carb-counting accuracy, exercise timing, and bone-protective exercise all measurably shape day-to-day and long-term outcomes.',
    summary:
      "Type 1 diabetes results from a real, autoimmune destruction of insulin-producing cells that begins well before diagnosis, this category's own already-covered staging research confirms it can be detected years earlier via antibody testing, but no known diet or lifestyle change stops or prevents that underlying process. What real, everyday choices DO shape is how well the condition is managed once it's here. Carbohydrate counting accuracy matters directly, this category's own already-covered research finds a real, average 21% error rate in typical carb estimates, and closing that gap measurably improves glucose stability. Exercise carries real, genuine complexity worth knowing plainly, aerobic exercise can drop glucose while resistance exercise can sometimes raise it, so timing and type both matter, not just volume, and this category's own already-covered alcohol research adds a real, delayed-hypoglycemia risk worth planning around specifically. Bone health deserves real, direct attention given this category's own already-covered sevenfold hip-fracture-risk finding, weight-bearing and resistance exercise are a real, protective lever here specifically. Consistent meal timing, real sick-day protocols, and awareness of this category's own already-covered celiac comorbidity (screening for gluten sensitivity, not avoiding gluten preemptively) round out the real, practical picture.",
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
    title: "Celiac Disease Has Exactly One Real Prevention Strategy Once Diagnosed, and It's Complete, Not Partial",
    teaser: "Celiac's own real lever isn't moderation, it's strict, lifelong gluten avoidance, plus real, deliberate attention to the nutrients a gluten-free diet can quietly leave short.",
    summary:
      "Celiac disease is genuinely unusual in this Digest: it has exactly one real, effective prevention strategy, and it's binary rather than a spectrum of moderation. Once diagnosed, strict, lifelong avoidance of gluten, including real attention to cross-contamination already covered in this category (shared cooking water, shared toasters, mislabeled products), is the only real treatment that stops ongoing intestinal damage. What genuinely needs active management alongside that: this category's own already-covered research finds commercial gluten-free products often run lower in protein and fiber and higher in sugar and cost than their gluten-containing equivalents, so a real, whole-food gluten-free pattern (naturally gluten-free grains, vegetables, lean protein) matters more than simply swapping in packaged gluten-free substitutes. Real, deliberate attention to iron, folate, B12, vitamin D, calcium, and zinc is worth building into a regular diet, since this category's own already-covered research finds these can run short on a gluten-free diet if not actively managed. Bone-protective, weight-bearing exercise matters directly given this category's own already-covered real bone-density findings at diagnosis, and regular dental checkups are worth keeping given the real, documented enamel-defect risk already covered here.",
    citations: [
      { source: 'Nutritional quality and costs of gluten-free products: a case-control study of food products on the Norwegian market', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8009084/' },
      WHO_EXERCISE_CITATION,
    ],
    overallTier: 'strong',
    relatedIds: ['celiac-cross-contamination', 'celiac-gf-diet-nutritional-pitfalls', 'celiac-bone-density'],
  },
  {
    id: 'prevention-ibd',
    category: 'basicHealth',
    title: "IBD's Own Real Levers Include a Direct Correction to the Common 'Avoid Fiber' Advice",
    teaser: "IBD's own real levers: smoking cessation matters, but works in OPPOSITE directions for Crohn's and ulcerative colitis, and real evidence finds higher fiber intake tracking with LOWER flare risk, not the restriction many people are told.",
    summary: "Inflammatory bowel disease has real genetic and environmental triggers already covered in this category, and while lifestyle can't prevent the underlying disease from developing, it genuinely shapes flare frequency and severity. Smoking needs real, careful, disease-specific framing: it's a real, documented risk factor for developing and worsening Crohn's disease, but carries a real, paradoxical protective effect specifically against ulcerative colitis, already covered in this category, meaning the right smoking-related guidance genuinely depends on which specific IBD diagnosis someone has. A real, direct correction worth stating plainly: the common advice to restrict fiber during a flare has surprisingly thin evidence behind it, this category's own already-covered research found no real support for the restriction and, more strikingly, found higher fiber intake tracking with LOWER flare risk within six months. Vitamin D deficiency tracks directly with disease severity, adequate levels are a real, worthwhile target. Regular, moderate exercise, adequate hydration, and real stress management all support the same gut-barrier and inflammation pathways already covered throughout the gut-microbiome research, and NSAIDs are worth avoiding given their own documented flare-triggering potential.",
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
    title: 'MS Risk Is Set Early in Life by Real, Named Factors, and Real Diet/Exercise Choices Still Shape Life With It',
    teaser: "MS's own real levers: vitamin D and sun exposure before age 15 shape lifelong risk, smoking cessation matters at any age, and a real, lower-saturated-fat dietary pattern shows a genuine, quantified fatigue and quality-of-life benefit.",
    summary:
      "This category's own already-covered latitude-gradient and EBV research shows MS risk is substantially set by factors (childhood sun exposure, viral history) that are largely out of anyone's later control, but real, meaningful levers still exist for both risk and day-to-day life with the condition. Smoking cessation carries real, direct evidence for reducing both onset risk and disease progression. Vitamin D deserves real, careful framing: it's genuinely, strongly linked to MS risk in observational research, but this category's own already-covered trial evidence for SUPPLEMENTATION specifically is honestly mixed, adequate levels are still a reasonable, low-risk target. Diet carries real, quantified benefit: the WAVES trial, already covered in this category, found both the Swank (very low saturated fat) and Wahls (nutrient-dense, plant-forward) diets produced real, clinically meaningful fatigue and quality-of-life improvement, sharing a real common thread of whole-food, limited-processed-food eating. Exercise needs one real, MS-specific caution this category already covers, Uhthoff's phenomenon, real, temporary symptom worsening from overheating during exertion, meaning cooling strategies matter as much as exercise volume itself. Fasting-mimicking approaches show real, preliminary promise but remain honestly experimental rather than established guidance.",
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
    title: "Lupus's Own Real Levers Center on One Very Specific Environmental Trigger and Real Sun Protection",
    teaser: "Lupus's own real levers: sun protection is genuinely non-negotiable given photosensitivity's own flare-triggering effect, alfalfa sprouts carry a real, named, avoidable risk, and occupational silica dust exposure is a real, modifiable factor.",
    summary:
      "Lupus has real genetic and, per this category's own already-covered research, ethnic risk factors that can't be changed through lifestyle, but several real, concrete, everyday levers genuinely matter for flare prevention. Sun protection is close to non-negotiable, this category's own already-covered photosensitivity research finds real sun exposure can trigger a full-body flare, making consistent sunscreen and sun avoidance a real, primary lever rather than a general skin-health suggestion. One real, specific, avoidable food deserves direct naming: alfalfa sprouts, already covered in this category, contain a real compound (L-canavanine) documented to induce a genuine lupus-like immune response. Omega-3 shows real, modest, low-certainty benefit per this category's own already-covered meta-analysis. Smoking cessation matters directly, and anyone in mining, construction, sandblasting, or similar industrial work should know about the real, documented silica-dust exposure risk already covered in this category, a genuinely modifiable occupational factor. Vitamin D needs real, honest, careful framing given this category's own already-covered catch-22 (sun protection reduces flare risk but also reduces the body's own vitamin D production), making dietary or supplemental vitamin D a more reliable lever than sun exposure for meeting real needs. Exercise should stay moderate, especially during active flares.",
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
    title: "Sjögren's Own Real Levers Center Directly on Hydration and Two Everyday Dehydrating Habits",
    teaser: "Sjögren's own real levers: alcohol and caffeine both carry a real, direct dehydrating effect that worsens core symptoms within hours, omega-3 shows real trial-backed benefit for both dry eyes and dry mouth, and xylitol offers a real, two-way dental protection.",
    summary:
      "Sjögren's syndrome centers on real, immune-driven damage to moisture-producing glands, and while lifestyle can't reverse that underlying process, this category's own already-covered research names real, everyday habits that measurably worsen or ease the core dryness symptoms. Alcohol and caffeine both carry a real, documented dehydrating effect that worsens dryness within hours, already covered in this category, making moderation a real, same-day lever rather than a long-term one. Omega-3 shows genuinely strong, randomized trial evidence here, more consistently positive than in several other conditions covered in this Digest, improving both dry eye symptoms and measured saliva flow in the same real trial. Xylitol offers a real, two-way dental benefit already covered in this category, it stimulates saliva production while not feeding the cavity-causing bacteria sugar would, directly protecting against the real, rapid tooth decay risk this condition carries. Adequate, consistent hydration throughout the day matters more here than in most conditions in this Digest, given how directly and quickly it affects core symptoms. Regular dental and eye care, moderate exercise, and avoiding unnecessarily dry indoor environments round out the real, practical picture.",
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
    title: "PCOS's Own Central Mechanism Means Diet and Exercise Aren't Just Helpful, They're the Real Primary Treatment",
    teaser: "PCOS's own real levers: even modest weight loss (each 1% lost tracks with a real 5.6% higher chance of ovulation returning), a lower-glycemic-load diet, and combined aerobic-plus-resistance exercise all work through the same real, central insulin-resistance mechanism.",
    summary: "PCOS is genuinely different from most autoimmune conditions: its own central mechanism, insulin resistance, is directly, powerfully responsive to diet and exercise, making lifestyle change closer to a real primary treatment here than in almost any other condition covered. This category's own already-covered BAMBINI trial found each single percentage point of body weight lost tracking with a real 5.6% higher chance of ovulation returning, a genuinely direct, quantified, real-world benefit. A lower-glycemic-load diet pattern (favoring whole grains, legumes, and vegetables over refined carbohydrates) directly targets the same insulin-resistance mechanism. Exercise matters in both real forms already covered in the general research, aerobic activity for cardiometabolic benefit and resistance training for insulin sensitivity specifically, making the WHO's own combined aerobic-plus-strength guideline especially well-suited here. Real, specific supplements carry genuine trial support in this category: myo-inositol and D-chiro-inositol at the real 40:1 ratio already covered, and spearmint tea's own real anti-androgen effect. Sleep deserves real, direct attention too, given this category's own already-covered sleep-apnea comorbidity, and stress management matters through the same cortisol-insulin interaction already covered elsewhere in the hormone research.",
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
    title: "CKD's Own Real Levers Include a Direct, Honest Correction to the Standard 'Avoid Potassium' Advice",
    teaser: "CKD's own real levers: the standard blanket potassium-restriction advice has surprisingly thin evidence, a plant-forward protein pattern shows real advantages over animal protein, and NSAIDs carry a real, quantified, largely avoidable injury risk.",
    summary:
      "Chronic kidney disease progression genuinely responds to real, everyday choices, and this category's own already-covered research includes a real, direct correction worth stating plainly: blanket potassium restriction, the 'avoid bananas and oranges' advice given to nearly every CKD patient, has surprisingly little trial evidence behind it, and real, emerging research points toward a genuinely liberalized, plant-based, high-fiber pattern as potentially more helpful than restriction. Protein source matters more than protein avoidance: this category's own already-covered research finds a real, plant-forward low-protein pattern (0.6 to 0.8g/kg/day) genuinely superior to animal-based protein on several measured outcomes. Sodium moderation following a real, DASH-aligned pattern remains well-supported. NSAIDs deserve real, direct avoidance given this category's own already-covered, quantified injury risk (73% general population, 63% in existing CKD). 'Hidden phosphorus,' the real, highly-absorbed additive form already covered in this category, is worth watching for on ingredient labels specifically, more than naturally-occurring phosphorus in whole foods. Adequate hydration, blood pressure control through the same DASH-style diet and regular moderate exercise, and avoiding real, documented nephrotoxic herbal supplements (aristolochic acid, already covered here) round out the real, practical picture.",
    citations: [
      { source: 'Re-Thinking Hyperkalaemia Management in Chronic Kidney Disease -- Beyond Food Tables and Nutrition Myths: An Evidence-Based Practice Review', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10780359/' },
      WHO_EXERCISE_CITATION,
    ],
    overallTier: 'strong',
    relatedIds: ['ckd-potassium-restriction-reconsidered', 'ckd-protein-restriction-plant-based', 'ckd-nsaid-kidney-injury-real-data'],
  },
  {
    id: 'prevention-masld',
    category: 'basicHealth',
    title: 'A Real, Graded Weight-Loss Staircase, Not an All-or-Nothing Target, Defines How to Reverse MASLD',
    teaser: 'MASLD\'s own real levers: weight loss works in real, distinct steps (3%+ improves histology, 7%+ improves inflammation, 10%+ can reverse fibrosis), and exercise independently reduces liver fat even without any weight change at all.',
    summary:
      "MASLD responds directly and measurably to real, everyday lifestyle change, more so than almost any other condition in this Digest, and this category's own already-covered research maps out a real, graded staircase rather than one all-or-nothing target. Losing just 3% of body weight already tracks with measurably improved liver histology; 5% reduces liver fat; 7% improves inflammation; 10% can stabilize or reverse fibrosis, real, meaningful benefit at every step along the way, not only at an ambitious endpoint. A genuinely surprising, real finding worth knowing directly: exercise reduces liver fat independently of any weight change at all, meaning movement itself matters even before the scale moves. A Mediterranean-pattern diet performs about as well as a plainer low-fat diet in real head-to-head trials, weight loss and reduced ultra-processed food intake appear to be the real driving mechanism more than any one specific diet label. Coffee carries real, consistently positive evidence (lower MASLD odds, slower fibrosis progression). Reducing added sugar and high-fructose corn syrup specifically, and resistance exercise to guard against the real sarcopenic-obesity risk already covered in this category, round out the real, practical picture, alongside real, current medical options (semaglutide, resmetirom) for those who need more than lifestyle change alone provides.",
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
    title: 'Type 2 Diabetes Shows Real, Documented Remission, Not Just Management, Through Diet and Exercise Alone',
    teaser: "Type 2 diabetes's own real levers: the DiRECT trial found 46% of participants reached real, complete remission through structured weight management alone, and time-restricted eating shows a real, independent glucose benefit.",
    summary:
      "Type 2 diabetes carries some of the most striking real evidence of lifestyle producing genuine remission, not just management, of any condition in this Digest. This category's own already-covered DiRECT trial found 46% of participants achieved real, complete diabetes remission at 12 months through a structured weight-management program alone, with some sustaining it 5 years out. Diet pattern matters directly: real, low-carbohydrate approaches showed strong short-term remission rates in this category's own already-covered meta-analysis, and time-restricted eating independently improved fasting glucose and HbA1c in real, pooled trial data, a genuinely different, complementary lever from calorie or carbohydrate content alone. Exercise needs both real forms already established in this Digest, aerobic activity and resistance training together, matching the WHO's own combined guideline directly. Sleep deserves real, direct attention given this category's own already-covered sleep-apnea research. A real, important complication worth knowing plainly: intensive glycemic control below the standard target doesn't improve outcomes and raises real hypoglycemia risk, meaning the goal is a real, individualized target, not the tightest number achievable. Regular screening for retinopathy and neuropathy from the moment of diagnosis matters directly, given this category's own already-covered finding that real complications are often already present by then.",
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
    title: "IBS's Own Real Levers Blend Structured Diet Change With the Brain-Gut Connection Directly",
    teaser: "IBS's own real levers: a structured, temporary low-FODMAP elimination, real delayed-effect triggers (coffee, alcohol, artificial sweeteners) most people never connect to their own symptoms, and real, brain-gut-axis therapies like CBT and gut-directed hypnotherapy.",
    summary:
      "IBS responds to a real, genuinely dual set of levers, this category's own already-covered visceral-hypersensitivity research explains why both diet AND the brain-gut connection itself matter directly, not just one or the other. A structured, TEMPORARY low-FODMAP elimination, followed by real, systematic reintroduction (not permanent restriction), remains the best-evidenced dietary approach already covered in this category. A real, easy-to-miss finding worth stating plainly: coffee, alcohol, and artificial sweeteners can all trigger real symptoms on a genuinely DELAYED timeline (1 to 72 hours later per this category's own already-covered research), meaning a same-day symptom diary can miss the real trigger entirely. Soluble fiber tends to help more consistently than insoluble fiber. Regular meal timing and adequate hydration support gut motility directly. Real, brain-gut-axis therapies deserve equal weight to dietary change here, cognitive behavioral therapy and gut-directed hypnotherapy both carry real, genuine trial evidence already covered in this category, since IBS's own real mechanism runs through the nervous system's processing of gut signals, not diet content alone. Regular, moderate exercise and real stress management both work through this same pathway. Peppermint oil carries real, if imperfect, evidence as a targeted symptom-relief option.",
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
    title: "Migraine's Own Real Levers Are Mostly About Consistency, Not Any One Specific Food",
    teaser: "Migraine's own real levers: consistent sleep and meal timing matter more than any specific 'trigger food' avoidance list, a real, specific magnesium/riboflavin/CoQ10 combination shows genuine trial-backed prevention benefit, and caffeine needs consistency more than avoidance.",
    summary:
      "Migraine management genuinely centers on real, everyday consistency more than eliminating any one specific food, and this category's own already-covered research includes a real, honest correction to some of the most common migraine advice: tyramine, the compound long blamed for aged-cheese and red-wine triggers, has real, documented problems as an explanation, and chocolate's own evidence is genuinely mixed rather than a clear culprit. What real evidence DOES support: a consistent sleep schedule and consistent meal timing (never skipping meals) both matter directly, since irregularity itself is a real, documented trigger. A real, specific combination, magnesium, riboflavin, and CoQ10 together, showed genuine, randomized trial benefit already covered in this category, reducing migraine days measurably more than either component alone might suggest. Caffeine carries real, genuine complexity worth knowing plainly: it can be both a trigger for some people and a withdrawal-headache cause for others, sometimes through the very same medication, making CONSISTENCY (not necessarily elimination) the more reliable real lever. Adequate hydration and regular, moderate (not suddenly intense) exercise both help, and real stress-management techniques carry genuine, if modest, supporting evidence.",
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
    title: 'CVD Risk Responds Directly to a Real, Well-Proven Diet Pattern, Not a Long List of Individual Rules',
    teaser: "CVD's own real levers: a genuine Mediterranean or DASH-style whole-food pattern, real, quantified exercise volume, smoking cessation, and sodium moderation all trace back to the same real, foundational Seven Countries Study already covered in this category.",
    summary:
      "Cardiovascular disease responds directly and substantially to real, everyday choices, this category's own already-covered Seven Countries Study first established the connection at real, international scale, finding southern European, Mediterranean-diet-following populations carrying roughly half the cardiovascular disease rate of northern European populations. The real, practical version of that same finding: a whole-food pattern built around olive oil, legumes, vegetables, and fish, low in saturated fat and processed food, is the single best-evidenced dietary lever in this whole category. Exercise carries real, quantified benefit at the WHO's own general 150 to 300 minute weekly target, and this category's own already-covered cardiac-rehabilitation research finds a real 26 to 31% mortality reduction from structured post-event exercise programs specifically. Smoking cessation and sodium moderation (the same DASH-aligned target already covered in this category) both carry strong, direct evidence. Alcohol needs real, honest framing given this category's own already-covered research, real cardiovascular risk exists, but the evidence doesn't support a single simple rule the way smoking cessation does. Real, regular blood pressure and lipid-panel monitoring (already covered in this category's own self-advocacy research) matters directly, since much of the real risk-reduction value of diet and exercise only becomes visible through actually tracking these numbers over time.",
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
    title: 'Gout Responds to a Real, Specific Diet Pattern, Not the Generic "Avoid All Purines" Rule Most People Hear',
    teaser: "Gout's own real levers: real research found meat and seafood raise risk while dairy is actually protective, sugar-sweetened drinks and beer both carry real, dose-dependent risk, and even modest weight loss shows a real, quantified benefit.",
    summary:
      "Gout responds directly to real, specific dietary choices, and this category's own already-covered landmark cohort study found something genuinely more nuanced than the generic 'avoid all purines' advice most people hear: meat carried a real 41% higher risk and seafood a real 51% higher risk, while dairy carried a real 44% LOWER risk in the very same study, a genuine protective association, not just a neutral one. Purine-rich vegetables and total protein overall were NOT associated with increased risk at all in that same real research, directly countering the assumption that all purines behave identically. Beer carries the real, strongest alcohol-related risk of any type studied (49% higher per daily serving), while wine showed no significant association. Sugar-sweetened beverages carry real, dose-dependent risk up to 85% higher at 2 or more daily servings. Weight loss shows real, quantified benefit across multiple real intervention types already covered in this category. Three real, specific protective foods carry genuine trial support: cherries, vitamin C (500mg/day in a real RCT), and coffee (both caffeinated and decaf). Adequate hydration and avoiding known urate-lowering-therapy interactions (already covered in this category's own medication research) round out the real, practical picture.",
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
    title: "Prostate Health's Own Real Levers Are Backed by Some of Oncology's Strongest Migrant-Study Evidence",
    teaser: "Prostate health's own real levers: lycopene, cruciferous vegetables, and regular exercise all carry real, quantified benefit, and real migrant studies already covered in this category prove diet change measurably shifts risk within one lifetime, not just across generations.",
    summary: "Prostate health responds to real, everyday choices backed by some of the strongest evidence in the that diet genuinely changes real, individual risk, not just population-level statistics. This category's own already-covered migrant studies found men who moved from a low-incidence country to a high-incidence one saw their own prostate cancer risk rise 4 to 12-fold within one generation, real, direct proof that environment and diet, not just genetics, drive most of the real, worldwide 30-fold incidence gap. Lycopene (concentrated in cooked tomatoes) and cruciferous vegetables (broccoli, cauliflower, the same sulforaphane compound already covered elsewhere) both carry real, dose-response trial support. Regular exercise carries a real, direct mortality benefit already covered in this category, not just a general fitness recommendation. Real, everyday choices worth naming directly: limiting processed and charred meat, moderating choline intake given the real gut-bacteria-to-TMAO pathway already covered in this category, and keeping zinc intake adequate given the prostate's own real, distinctive tissue concentration of it. Weight management and moderate alcohol both matter, and real, regular PSA and symptom monitoring (already covered in this category's own self-advocacy research) is worth pursuing alongside diet and exercise, not instead of them.",
    citations: [
      { source: 'Increased dietary and circulating lycopene are associated with reduced prostate cancer risk: a systematic review and meta-analysis, Prostate Cancer and Prostatic Diseases', url: 'https://www.nature.com/articles/pcan201725' },
      WHO_EXERCISE_CITATION,
    ],
    overallTier: 'strong',
    relatedIds: ['prostate-global-incidence-migrant-studies', 'prostate-lycopene-tomatoes', 'prostate-exercise-cancer-mortality'],
  },
];
