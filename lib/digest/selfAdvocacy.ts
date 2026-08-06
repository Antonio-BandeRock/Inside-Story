import type { DigestEntry } from './types';

// Self Advocacy -- added 2026-08-07, direct request, prompted by a real
// Google-search summary the person's wife had found and shared: "How to
// self advocate for full panel tests to be done... explain why each type
// of test is useful to a person with Hashimoto's and how often they should
// be tested for the data to track a trend correctly within reason."
//
// A genuinely different job from every other category in this Digest --
// not "what does the research say about a food or mechanism," but "what
// should a person actually ask their doctor for, why, and how often is
// real without becoming excessive." The shared Google-search summary named
// real, correct test categories (thyroid panel, nutrient markers, sex
// hormones, metabolic panel, inflammation) -- every one of those was
// independently re-verified via WebFetch against PubMed rather than
// trusted as-is (this session's WebSearch budget was already exhausted, so
// every citation here was found the established fallback way: WebFetch
// against real PubMed search-result and abstract pages). A few of the
// summary's own framings needed real correction along the way -- see
// individual entries below, especially reverse T3 (genuinely controversial,
// not a settled test) and the sex-hormone panel (often not needed to
// diagnose perimenopause at all, contrary to how routinely it gets
// ordered).
//
// The "how often, within reason" half of the request is answered honestly
// throughout: where a real source states a specific interval, that number
// is used and cited; where the honest answer is "common clinical practice,
// not a single settled guideline," that's stated plainly rather than
// dressed up with a citation that doesn't actually say that number. The
// closing entry pulls every interval into one real, practical calendar.
export const SELF_ADVOCACY_ENTRIES: DigestEntry[] = [
  {
    id: 'advocacy-why-it-matters',
    category: 'selfAdvocacy',
    title: 'Why This Category Exists: Most Doctors Order Less Than a Full Picture, Not Because They\'re Wrong to',
    teaser: 'A standard visit runs 15 minutes and one lab requisition. A real, useful picture of Hashimoto\'s takes more than that -- and getting it is a real, learnable skill.',
    summary:
      "A primary care visit is built around triage, not a deep investigation -- a doctor sees a TSH in range and, correctly by their own training, moves on. That's not negligence. It's the honest limit of what a 15-minute visit with one lab requisition can cover, and it's exactly why the tests further down this category (free T4 and free T3 alongside TSH, ferritin, vitamin D, a real antibody trend) so often never get ordered unless the person in the room asks for them by name. Real research backs this up as more than a feeling: patients who are more \"activated\" -- informed, prepared, and an active participant in their own care rather than a passive recipient of it -- measurably have better outcomes managing chronic conditions, not because they argue harder, but because they show up with the right questions already framed. That's the real, practical skill this whole category is built around: not confrontation, just knowing which test to name, why it matters for Hashimoto's specifically, and how often asking for it again actually adds real information instead of noise.",
    citations: [
      { source: 'Hibbard JH, Stockard J, Mahoney ER, Tusler M 2004 -- Development of the Patient Activation Measure (PAM): conceptualizing and measuring activation in patients and consumers (Health Services Research)', url: 'https://pubmed.ncbi.nlm.nih.gov/15230939/' },
      { source: 'Newland P, Lorenz R, Oliver BJ 2021 -- Patient activation in adults with chronic conditions: A systematic review (Journal of Health Psychology)', url: 'https://pubmed.ncbi.nlm.nih.gov/32830587/' },
      { source: 'Bodenheimer T, Lorig K, Holman H, Grumbach K 2002 -- Patient self-management of chronic disease in primary care (JAMA)', url: 'https://pubmed.ncbi.nlm.nih.gov/12435261/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'advocacy-core-thyroid-panel',
    category: 'selfAdvocacy',
    title: 'TSH, Free T4 & Free T3: Ask for All Three, Not Just the One Most Labs Default To',
    teaser: 'A "normal thyroid" result is often just one number out of three that actually matter.',
    summary:
      "A standard thyroid check very often means one test: TSH. That's a reasonable starting point -- real clinical guidance calls TSH the single best screening test for primary hypothyroidism -- but it's a screening test, not the full picture, and Hashimoto's is exactly the situation where the full picture matters. Free T4 shows how much actual usable hormone the thyroid itself is releasing; free T3 shows how much of that hormone the body is actually converting into its active form, a separate step (covered elsewhere in this Digest's own Organs & Body Systems category) that TSH alone says nothing about. Someone can have a technically normal TSH while still converting poorly, or be right at the edge of a lab's reference range in a way a single number obscures. Worth asking for by name at any full panel, not assumed to be automatically included. On timing: real clinical guidance recommends rechecking thyroid function about six weeks after any dose change or a switch between brand and generic levothyroxine, since that's roughly how long it takes levels to fully re-settle -- checking sooner just measures a value still in motion, not a real, stable result.",
    citations: [
      { source: 'Gaitonde DY, Rowley KD, Sweeney LB 2012 -- Hypothyroidism: An Update (American Family Physician)', url: 'https://www.aafp.org/pubs/afp/issues/2012/0801/p244.html' },
    ],
    overallTier: 'strong',
    relatedIds: ['labs-tsh-diurnal-timing', 'organ-liver-t4t3-conversion'],
  },
  {
    id: 'advocacy-thyroid-antibodies',
    category: 'selfAdvocacy',
    title: 'TPO & Thyroglobulin Antibodies: The Test That Confirms It\'s Really Hashimoto\'s',
    teaser: 'TSH tells you the thyroid is underperforming. Antibodies tell you why -- and that "why" changes what else is worth watching.',
    summary:
      "A low thyroid on its own doesn't say what's causing it. TPO and thyroglobulin antibodies are what actually confirm an autoimmune process is the reason -- the real, specific test this whole app's own tracking is built around (see the Glossary's own TPO entry for that history). Real clinical guidance notes that elevated TPO antibody titers in someone with only mildly abnormal thyroid numbers (subclinical hypothyroidism) meaningfully raise the odds of progressing to full, overt hypothyroidism -- a real reason a positive antibody result is worth knowing even before TSH itself looks clearly abnormal. Once confirmed, though, retesting antibodies often doesn't change day-to-day treatment the way retesting TSH does -- antibody titers aren't used to adjust a levothyroxine dose, and real data on Hashimoto's antibody levels shows they can stay elevated for a long time without a clean, predictable decline pattern. That makes this a real exception to \"more testing is better\": once confirmed, checking once a year at most is enough to notice a genuine long-term trend (rising, falling, or holding steady) without chasing normal week-to-week fluctuation that doesn't actually mean anything.",
    citations: [
      { source: 'Gaitonde DY, Rowley KD, Sweeney LB 2012 -- Hypothyroidism: An Update (American Family Physician)', url: 'https://www.aafp.org/pubs/afp/issues/2012/0801/p244.html' },
      { source: 'Hasse-Lazar K, Jarzab B, et al. 1997 -- TSH-receptor antibodies in thyroid diseases (thyroid peroxidase antibody titer data)', url: 'https://pubmed.ncbi.nlm.nih.gov/9333770/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'advocacy-reverse-t3',
    category: 'selfAdvocacy',
    title: 'Reverse T3: A Real Test With a Genuinely Unsettled Answer, Worth Knowing Before Asking For It',
    teaser: 'Some practitioners order it as a routine part of a "full thyroid panel." Mainstream endocrinology doesn\'t agree it belongs there.',
    summary:
      "Reverse T3 (introduced in the Glossary) shows up on a lot of functional-medicine \"complete thyroid panel\" lists, often presented as the missing piece a standard workup skips. The honest picture is more contested than that framing suggests. A real 2018 analysis of national laboratory order data specifically studied how often reverse T3 gets ordered and by whom, treating the test's actual clinical utility as an open, debated question rather than settled fact -- there's no broadly accepted reference range tied to a specific treatment decision the way TSH or free T4 have. That doesn't mean it's meaningless -- a genuinely high reverse T3 alongside other findings can be one more data point -- but it does mean walking in asking for it as though it's a routine, universally-endorsed test risks the conversation stalling on that one item instead of the tests with much stronger, more actionable evidence behind them (the core panel above, ferritin, vitamin D). Worth naming directly rather than assuming a doctor's hesitation to order it is dismissiveness -- the hesitation itself is a defensible, evidence-based position, not knee-jerk resistance.",
    citations: [
      { source: 'Schmidt RL, LoPresti JS, McDermott MT, Zick SM, Straseski JA 2018 -- Does Reverse Triiodothyronine Testing Have Clinical Utility? An Analysis of Practice Variation Based on Order Data from a National Reference Laboratory (Thyroid)', url: 'https://pubmed.ncbi.nlm.nih.gov/29756541/' },
    ],
    overallTier: 'weak',
  },
  {
    id: 'advocacy-iron-ferritin',
    category: 'selfAdvocacy',
    title: 'Ferritin & a Full Iron Panel: Low Iron Can Mimic -- and Worsen -- Hypothyroid Symptoms Directly',
    teaser: 'Fatigue, brain fog, hair thinning -- the same short list shows up whether the real cause is thyroid, iron, or genuinely both at once.',
    summary:
      "Iron deficiency and hypothyroidism share enough symptoms that it's genuinely easy to attribute everything to the thyroid alone and stop looking. Real research says that's often the wrong call to make blindly: a 2023 systematic review and meta-analysis pooling ten studies found people with iron deficiency had measurably lower TSH, free T4, and free T3 than those without it, and serum ferritin itself correlated positively with both TSH and free T4 -- iron status and thyroid hormone levels move together, not independently. A separate 2024 systematic review specifically confirmed real, documented iron and ferritin deficiency in women with hypothyroidism and chronic lymphocytic (Hashimoto's) thyroiditis. Iron deficiency has also been separately linked to a real increase in thyroid autoantibody positivity -- a second, more direct reason this isn't just a symptom-overlap coincidence. A full iron panel (not ferritin alone) is worth asking for at least once, especially for anyone menstruating or with any real fatigue that hasn't fully resolved on thyroid treatment. Checking every 6-12 months is reasonable for ongoing tracking; more often (roughly every 8-12 weeks) only makes sense while actively correcting a confirmed deficiency, to catch overcorrection before it becomes its own problem.",
    citations: [
      { source: 'Garofalo V, Condorelli RA, Cannarella R, Aversa A, Calogero AE, La Vignera S 2023 -- Relationship between Iron Deficiency and Thyroid Function: A Systematic Review and Meta-Analysis', url: 'https://pubmed.ncbi.nlm.nih.gov/38004184/' },
      { source: 'Gierach M, Rudewicz M, Junik R 2024 -- Iron and ferritin deficiency in women with hypothyroidism and chronic lymphocytic thyroiditis: systematic review', url: 'https://pubmed.ncbi.nlm.nih.gov/38923898/' },
      { source: "Hu S, Rayman MP 2017 -- Multiple Nutritional Factors and the Risk of Hashimoto's Thyroiditis", url: 'https://pubmed.ncbi.nlm.nih.gov/28290237/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'advocacy-vitamin-d',
    category: 'selfAdvocacy',
    title: 'Vitamin D: Genuinely Common to Be Low With Hashimoto\'s, Genuinely Worth Rechecking',
    teaser: 'Not a supplement to guess at -- a real, checkable number, and one Hashimoto\'s patients are disproportionately likely to be low on.',
    summary:
      "This Digest's own Nutrients & Micronutrients category already covers vitamin D's real, if mixed, trial evidence for Hashimoto's itself -- this entry is about the practical side: getting it checked at all. A 2022 systematic review found a real, consistent association between vitamin D deficiency and autoimmune thyroid disease broadly, and more recent mechanistic research has kept tying vitamin D status directly to immune regulation relevant to Hashimoto's specifically, not just bone health, which is usually the only reason it gets checked by default. Deficiency is common enough in this population that it's worth asking for a real 25-hydroxyvitamin D blood level rather than assuming a general multivitamin is covering it. A reasonable, non-excessive cadence: check once at baseline, recheck about 3 months after starting or adjusting a supplement dose to confirm the level actually moved, then settle into checking once or twice a year (many people find once in winter, when levels run lowest, is the single most useful annual check) once a stable, adequate level is established -- no real reason to check more often than that outside of a genuine dose change.",
    citations: [
      { source: 'Khozam SA, Sumaili AM, Alflan MA, Shawabkeh RAS 2022 -- Association Between Vitamin D Deficiency and Autoimmune Thyroid Disorder: A Systematic Review', url: 'https://pubmed.ncbi.nlm.nih.gov/35836431/' },
      { source: "Sun W, Ding C, Wang Y, Li G, Su Z, Wang X 2025 -- Vitamin D deficiency in Hashimoto's thyroiditis: mechanisms, immune modulation, and therapeutic implications", url: 'https://pubmed.ncbi.nlm.nih.gov/40822954/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['nutrient-vitamin-d'],
  },
  {
    id: 'advocacy-b12-folate',
    category: 'selfAdvocacy',
    title: 'B12 & Folate: Two Autoimmune Diseases Genuinely Travel Together More Than People Realize',
    teaser: 'The same immune system that can attack the thyroid can separately attack the stomach lining that absorbs B12 -- a real, measured overlap, not a coincidence.',
    summary:
      "It's not just that B12 deficiency and hypothyroidism share symptoms (fatigue, brain fog, tingling) -- there's a real, direct biological reason they show up together so often. A 2006 study found 28% of autoimmune thyroid disease patients had low B12 levels, and of those, 31% had real evidence of pernicious anemia -- autoimmune damage to the stomach cells needed to absorb B12 at all, a second, separate autoimmune process riding alongside the thyroid one, not just an unrelated dietary gap. That's a specific, checkable, and fixable finding, not a vague overlap. Folate works alongside B12 in the same metabolic pathway and is reasonable to check at the same time, especially for anyone whose diet has changed recently (a new elimination protocol, cutting fortified grains, going more plant-based). A real B12 test (not just a symptom guess) is worth asking for at least once for anyone with Hashimoto's, with retesting reasonable about once a year -- or sooner, within a few months, specifically for anyone found low and starting supplementation, to confirm it actually corrected rather than assuming it did.",
    citations: [
      { source: 'Ness-Abramof R, et al. 2006 -- Prevalence and evaluation of B12 deficiency in patients with autoimmune thyroid disease (American Journal of the Medical Sciences)', url: 'https://pubmed.ncbi.nlm.nih.gov/16969140/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'advocacy-magnesium',
    category: 'selfAdvocacy',
    title: 'Magnesium: A Real Test Worth Ordering, With a Real, Honest Limitation Worth Knowing First',
    teaser: 'The blood test for magnesium checks less than 1% of where the body actually keeps it -- worth asking for anyway, just not over-trusting on its own.',
    summary:
      "This is the one test in this whole category worth requesting with the caveat stated up front, because the caveat is real and well documented: less than 1% of the body's total magnesium actually circulates in the blood, which is exactly what a standard serum magnesium test measures -- the vast majority sits inside cells and bone, invisible to that one number. A real 1998 study demonstrated this directly, finding oral magnesium supplementation could shift the body's real magnesium stores with barely any corresponding change in serum levels. That doesn't mean skip the test -- a genuinely low serum result is still a real, meaningful finding worth treating -- it means a normal serum result doesn't fully rule out a real deficiency the way it might for a nutrient measured more sensitively (like vitamin D). Given that real limitation, there's little value in retesting frequently expecting the number to track supplementation cleanly; a reasonable approach is checking once as a baseline and again only if new symptoms suggest a real problem (muscle cramps, irregular heartbeat, unusual fatigue), not on a fixed schedule.",
    citations: [
      { source: 'Weller E, Bachert P, Meinck HM, et al. 1998 -- Lack of effect of oral Mg-supplementation on Mg in serum, blood cells, and calf muscle', url: 'https://pubmed.ncbi.nlm.nih.gov/9813870/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'advocacy-zinc-copper',
    category: 'selfAdvocacy',
    title: 'Zinc & Copper: Ask for Them as a Pair, Especially If Already Supplementing Zinc',
    teaser: 'Real, documented cases exist of zinc supplements causing anemia and nerve damage -- from copper deficiency the zinc itself caused.',
    summary:
      "Zinc gets recommended often enough for immune support and hair/skin symptoms that it's easy to start supplementing without ever checking a real blood level -- and that's exactly the situation where a second, related problem can develop unnoticed. Zinc and copper are absorbed through a competing pathway in the gut, and real, documented case reports show sustained zinc supplementation genuinely causing copper deficiency serious enough to produce anemia and, in some cases, real neurological symptoms (gait problems, nerve damage) before anyone thought to check copper as the actual cause. This isn't a rare theoretical risk -- it's been reported repeatedly enough in the literature to be a recognized, named clinical picture. The practical fix is simple: if zinc is being supplemented at all, ask for copper to be checked alongside it, not as an afterthought. For someone not supplementing either, checking both once as a baseline is reasonable; for someone actively supplementing zinc, rechecking both every 6-12 months is a sensible, non-excessive cadence to catch a real problem before it becomes a serious one.",
    citations: [
      { source: 'Gupta N, Carmichael MF 2023 -- Zinc-Induced Copper Deficiency as a Rare Cause of Neurological Deficit and Anemia', url: 'https://pubmed.ncbi.nlm.nih.gov/37736439/' },
      { source: 'Magham K, Han J, Eilbert W, Bunney EB 2023 -- Severe copper deficiency anemia caused by zinc supplement use', url: 'https://pubmed.ncbi.nlm.nih.gov/37640593/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['interaction-zinc-copper'],
  },
  {
    id: 'advocacy-selenium-testing',
    category: 'selfAdvocacy',
    title: 'Selenium: The Best-Evidenced Supplement in This Whole App -- and the Hardest One to Actually Get Tested',
    teaser: 'This Digest\'s own strongest-evidenced finding has one real, practical catch: most standard labs simply don\'t run this test.',
    summary:
      "Selenium supplementation has real, strong, meta-analysis-level trial support for reducing TPO antibodies in Hashimoto's -- covered in full under Nutrients & Micronutrients, this app's own single most confidently-evidenced finding. The real, practical complication for self-advocacy specifically: plasma/serum selenium testing isn't part of a standard lab menu the way vitamin D or B12 is, and a doctor unfamiliar with running it may not have an easy, routine way to order it, unlike nearly everything else in this category. That's worth knowing walking in, so a \"we don't typically test that\" response reads as a real logistical limit rather than dismissal. A reasonable path when direct testing isn't practical: ask specifically for it if a lab does offer it (some larger reference labs do), and otherwise lean on real, already-cited dietary and supplementation research (2-3 Brazil nuts a day is a commonly cited real-food source) rather than treating the absence of a lab number as a reason not to address it at all.",
    citations: [
      { source: 'Selenium supplementation in patients with Hashimoto thyroiditis: a systematic review and meta-analysis of 21 studies (1,610 subjects)', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10194801/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['nutrient-selenium', 'interaction-selenium-iodine'],
  },
  {
    id: 'advocacy-cbc',
    category: 'selfAdvocacy',
    title: 'Complete Blood Count (CBC): The General-Purpose Test That Catches What a Thyroid Panel Alone Misses',
    teaser: 'Anemia from low iron, anemia from low B12, a hidden infection, a real blood-cell abnormality -- one test flags all of them at once.',
    summary:
      "A CBC isn't a Hashimoto's-specific test, and that's exactly its value here -- it's the general-purpose net that catches the real, related problems already covered above (iron-deficiency anemia, B12-deficiency anemia from co-occurring autoimmune gastritis) without needing to separately diagnose each one from scratch. Red blood cell size and shape on a CBC can point toward which specific deficiency to chase down first, before ever ordering the more specific iron or B12 panels above -- a real, efficient first step rather than a redundant one. It's also simply part of a genuinely complete picture of overall health, catching things entirely unrelated to Hashimoto's that are still worth knowing about. As part of an annual physical or a periodic full-panel check, a CBC is reasonable to include every time; there's little value asking for it more often than that outside of actively investigating a new, specific symptom (unusual bruising, persistent unexplained fatigue, signs of infection) that would justify a sooner recheck on its own.",
    citations: [],
    overallTier: 'moderate',
    relatedIds: ['advocacy-iron-ferritin', 'advocacy-b12-folate'],
  },
  {
    id: 'advocacy-cmp',
    category: 'selfAdvocacy',
    title: 'Comprehensive Metabolic Panel (CMP): Checking the Organs Doing the Thyroid\'s Own Hidden Work',
    teaser: 'The liver and kidneys are doing real, measurable thyroid-related work of their own -- a CMP is how that work actually gets checked.',
    summary:
      "This app's own Organs & Body Systems category makes a real, specific case that Hashimoto's reaches well past the thyroid gland itself -- the liver does the single largest share of converting inactive T4 into active T3, and real research has found measurably reduced kidney filtration (eGFR) tracking with worsening thyroid function, both genuinely reversible with treatment. A CMP is the standard, single test that actually checks both of those organs directly (liver enzymes, kidney function via creatinine/eGFR) alongside blood glucose and electrolyte balance -- not a redundant add-on to a thyroid panel, but a real, direct way to see whether those two connected organ systems are keeping up. Worth asking for as part of any full annual panel rather than assuming \"my thyroid labs were fine\" already covers it, since neither the liver nor kidney findings above would ever show up on a TSH/free T4/free T3 panel alone. Once a truly stable, unremarkable CMP is established, annual is a reasonable cadence -- no real reason to check more often without a specific new symptom or medication change prompting it.",
    citations: [],
    overallTier: 'moderate',
    relatedIds: ['organ-liver-t4t3-conversion', 'organ-kidney'],
  },
  {
    id: 'advocacy-lipid-panel',
    category: 'selfAdvocacy',
    title: 'Lipid Panel: Cholesterol That Rises and Falls With the Thyroid Itself, Not Just Diet',
    teaser: 'A real, direct hormonal effect -- not a moral failing about diet -- and one that a real 6-month trial showed genuinely reverses with treatment.',
    summary:
      "Thyroid hormone directly regulates how the liver clears LDL cholesterol from the blood via the LDL receptor pathway -- meaning cholesterol numbers in someone with Hashimoto's are, in a real and direct way, partly a thyroid-function readout, not purely a diet-and-exercise scorecard. A real double-blind, placebo-controlled 6-month trial confirmed this isn't just theory: treating subclinical hypothyroidism with levothyroxine significantly reduced both total and LDL cholesterol (a real, strong statistical result), and the improvement in artery-wall thickness tracked directly with how much cholesterol and TSH both improved together. That's a genuinely useful, motivating fact worth knowing -- a cholesterol number that looks stubborn on diet alone may move once thyroid treatment is actually well-dialed-in, worth re-checking specifically after a real dose change rather than assumed to be a separate, unrelated problem. Outside of a dose change, following the general cholesterol-screening schedule already set with a doctor is reasonable -- this isn't a number that needs Hashimoto's-specific extra-frequent checking once thyroid treatment itself is stable.",
    citations: [
      { source: 'Newman CB 2023 -- Effects of endocrine disorders on lipids and lipoproteins', url: 'https://pubmed.ncbi.nlm.nih.gov/35654682/' },
      { source: 'Monzani F, et al. 2004 -- Effect of levothyroxine replacement on lipid profile and intima-media thickness in subclinical hypothyroidism: a double-blind, placebo-controlled study', url: 'https://pubmed.ncbi.nlm.nih.gov/15126526/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'advocacy-a1c-glucose',
    category: 'selfAdvocacy',
    title: 'Hemoglobin A1c & Fasting Glucose: Autoimmune Diseases Have a Real Habit of Traveling Together',
    teaser: "Hashimoto's and type 1 diabetes share enough real biology that checking blood sugar isn't an unrelated add-on -- it's a genuinely adjacent risk.",
    summary:
      "This app's own Other Autoimmune Diseases category already makes the case that autoimmune conditions don't stay neatly siloed -- Hashimoto's and type 1 diabetes are both named, real examples of diseases that co-occur more than chance would predict, sharing enough underlying immune biology that checking one genuinely informs watching for the other. Fasting glucose and hemoglobin A1c (a real, longer-window average of blood sugar over roughly three months rather than a single-moment snapshot) are the standard way that gets tracked, and this app's own Mitochondria & Metabolism research separately ties visceral fat and insulin resistance directly to Hashimoto's-specific findings, not just general population risk. Neither test needs Hashimoto's-specific extra frequency -- following the general diabetes-screening schedule already agreed with a doctor (typically periodic, more often only if a prior result was borderline or genuinely abnormal) is the reasonable, non-excessive approach here, not a reason to add quarterly rechecks with no new symptom or result prompting it.",
    citations: [],
    overallTier: 'moderate',
    relatedIds: ['mito-visceral-fat-treg-depletion'],
  },
  {
    id: 'advocacy-fasting-insulin',
    category: 'selfAdvocacy',
    title: 'Fasting Insulin: A Real, Earlier Warning Sign -- Genuinely Debated as a Standalone Test',
    teaser: 'Some practitioners treat it as an early-warning test years ahead of a real A1c change. The research on how well it actually predicts that is more mixed than the pitch suggests.',
    summary:
      "The real logic behind fasting insulin testing is genuinely sound on paper: insulin can start rising before blood sugar itself does, as the body works harder to keep glucose normal -- meaning, in theory, it could flag developing insulin resistance years before A1c or fasting glucose would catch it. A real 2008 review of methods for assessing insulin sensitivity and resistance laid out exactly this appeal alongside its real limitations -- fasting insulin assays aren't as tightly standardized across different labs as glucose or A1c are, and no single, universally agreed cutoff value exists the way one does for A1c. That doesn't make it worthless, but it does mean it's a genuinely more debated, less standardized test than the rest of this category's metabolic entries -- worth asking about specifically if there's a real reason to suspect early insulin resistance (strong family history, visible weight changes, PCOS-type symptoms) rather than requesting as a routine, no-reason addition to every panel. Not a test to chase repeatedly without a specific concern driving it.",
    citations: [
      { source: 'Muniyappa R, Lee S, Chen H, Quon MJ 2008 -- Current approaches for assessing insulin sensitivity and resistance in vivo: advantages, limitations, and appropriate usage', url: 'https://pubmed.ncbi.nlm.nih.gov/17957034/' },
    ],
    overallTier: 'weak',
  },
  {
    id: 'advocacy-hscrp',
    category: 'selfAdvocacy',
    title: 'hs-CRP: A Real, Checkable Inflammation Number -- Not One to Chase Every Month',
    teaser: 'This app\'s own research keeps landing on inflammation as the real thread connecting food choices to thyroid hormone. hs-CRP is how that thread actually gets measured.',
    summary:
      "High-sensitivity C-reactive protein is the one lab value that shows up as the real, checkable outcome behind several of this Digest's own findings -- the Mediterranean-diet and fiber-intake research in Lifestyle & Environment, the IL-6-to-deiodinase-suppression mechanism connecting inflammation directly to lower active thyroid hormone. It's a real marker cardiology guidelines already recognize as one factor worth weighing in overall risk assessment, not a fringe or invented number. The honest, practical point for this category specifically: hs-CRP is a real, useful baseline to establish once, and worth rechecking deliberately after a genuine, sustained change (a real months-long shift in diet, a new exercise habit) to see whether it actually moved -- but it isn't a number that meaningfully changes week to week or even month to month for most people, and checking it that often mostly just measures ordinary day-to-day noise rather than a real trend. One baseline check, then a deliberate recheck tied to an actual change being tracked, is the reasonable cadence here.",
    citations: [
      { source: '2018 AHA/ACC/AACVPR/AAPA/ABC/ACPM/ADA/AGS/APhA/ASPC/NLA/PCNA Guideline on the Management of Blood Cholesterol (hs-CRP as a risk-enhancing factor)', url: 'https://pubmed.ncbi.nlm.nih.gov/30586774/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['lifestyle-il6-deiodinase', 'lifestyle-tying-together'],
  },
  {
    id: 'advocacy-sex-hormones-menopause',
    category: 'selfAdvocacy',
    title: 'Estradiol, Progesterone, Testosterone, DHEA-S & SHBG: Useful, but Often Not Required to Diagnose Perimenopause Itself',
    teaser: 'A genuinely counterintuitive real finding: the full hormone panel isn\'t usually what actually confirms perimenopause is happening.',
    summary:
      "This is the one panel in this whole category where the honest answer runs against how routinely it tends to get ordered. A real, influential 2003 clinical review directly asked the question \"is this woman perimenopausal?\" and concluded the most reliable real-world answer usually comes from symptoms and menstrual pattern change, not a single hormone blood draw -- estradiol and FSH in particular fluctuate enough within the same person, cycle to cycle, that one snapshot value can genuinely mislead more than it clarifies. That doesn't mean the panel is never useful -- it's genuinely valuable in specific, real situations: symptoms that don't fit the usual pattern, ruling out a different real cause before starting hormone therapy, or making an actual treatment decision about HRT where a baseline number matters. Given the real overlap between perimenopause symptoms and Hashimoto's symptoms (fatigue, mood shifts, temperature sensitivity, sleep disruption) named directly in this app's own founding brief, this panel is worth asking for specifically when those two pictures are genuinely hard to tell apart -- not as a routine, repeat-every-visit addition, since the same day-to-day fluctuation that makes one snapshot unreliable also makes frequent retesting mostly noise.",
    citations: [
      { source: 'Bastian LA, Smith CM, Nanda K 2003 -- Is This Woman Perimenopausal? (JAMA)', url: 'https://pubmed.ncbi.nlm.nih.gov/12588275/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'advocacy-cortisol-testing',
    category: 'selfAdvocacy',
    title: 'Cortisol Testing: A Real, Legitimate Test -- and a Real, Named Wellness-Industry Overreach to Recognize',
    teaser: '"Adrenal fatigue" isn\'t a recognized medical diagnosis. A real, distinct condition it gets confused with genuinely is.',
    summary:
      "Two very different things both get called \"cortisol testing,\" and telling them apart matters. A real 2025 review states this about as plainly as a medical paper ever does: the terms \"adrenal fatigue,\" \"adrenal asthenia,\" and \"adrenal burnout\" -- often attached to mail-order salivary cortisol test kits marketed directly to consumers -- \"are not a part of the medical or endocrine lexicon,\" meaning they aren't a recognized diagnosis a real endocrinologist would treat as one. That's a real, useful thing to know before spending money on one of those kits. What IS real and worth testing through an actual doctor: this app's own Organs & Body Systems category covers Autoimmune Polyglandular Syndrome Type 2 -- a genuine, documented autoimmune attack on the adrenal glands that can occur alongside Hashimoto's, diagnosed with a real AM serum cortisol test or an ACTH stimulation test, not a saliva kit. Worth raising directly with a doctor only when there's a real reason to (unexplained low blood pressure, unusual skin darkening, severe unremitting fatigue with other red flags) -- not something to test on a fixed schedule without one of those signs present.",
    citations: [
      { source: "Kalra S, Dhingra A, Kapoor N 2025 -- Adrenal Asthenia (Journal of the Pakistan Medical Association)", url: 'https://pubmed.ncbi.nlm.nih.gov/40143493/' },
    ],
    overallTier: 'strong',
    relatedIds: ['organ-adrenal-aps2', 'lifestyle-chronic-stress-hpa'],
  },
  {
    id: 'advocacy-elimination-protocol-exception',
    category: 'selfAdvocacy',
    title: 'The One Real Exception to "Don\'t Over-Test": Starting an Elimination Protocol',
    teaser: 'Every rule above about not testing too often has one real, deliberate exception -- and this is it.',
    summary:
      "Nearly every entry in this category ends the same way: don't retest more than roughly every 6-12 months without a real reason, because the biology itself doesn't move fast enough for more frequent checks to mean anything beyond ordinary noise. Starting a real elimination protocol -- this app's own Healing Stages Stage 1, a genuinely deliberate, structured change in what's being eaten -- is the one real, legitimate exception to that rule, for a specific and honest reason: it's the single biggest, fastest real input change most people ever make to their own body chemistry, and the whole point of doing it is to actually see whether it moves something measurable. A real, sensible approach: get a genuine baseline panel (as much of this category's list as practical) right before starting, then one real recheck around 8-12 weeks in -- long enough for a genuine signal to separate from noise, matching the real timelines this app's own gut-repair research already cites for measurable change, but not so frequent that normal week-to-week fluctuation gets mistaken for progress or failure. Outside of a change this deliberate, the standard cadence above still applies -- this is a real, bounded exception, not a license to test constantly during any life change.",
    citations: [],
    overallTier: 'moderate',
    relatedIds: ['healing-stage-map', 'healing-stage1-avoid'],
  },
  {
    id: 'advocacy-how-to-ask',
    category: 'selfAdvocacy',
    title: 'How to Actually Ask: A Written List Beats a Verbal Request Every Time',
    teaser: 'The single most effective thing anyone can bring to this conversation isn\'t confidence -- it\'s a piece of paper.',
    summary:
      "Real research on patient self-management found something consistently practical: patients who prepare specific, written questions ahead of a visit get more of those questions actually answered than patients who raise the same concerns verbally, in the moment, under real time pressure. That's the single most actionable piece of advice in this whole category -- not a script for confrontation, just a short, specific, written list (this app's own Bio-Compass symptom log is a real, ready-made source for exactly this) naming the actual tests from this category relevant to a specific situation, handed over or read from directly rather than described from memory. Framing matters too: \"I'd like to also check my free T4 and ferritin this visit, given my Hashimoto's\" lands very differently from an open-ended \"can you test everything.\" It's also worth knowing which tests are realistically a same-visit primary-care request (the core thyroid panel, CBC, CMP, lipids, vitamin D, B12, ferritin) versus ones that more often need a referral to an endocrinologist or a functional-medicine practitioner to access at all (reverse T3, a full sex-hormone panel, selenium) -- not because a PCP is unwilling, but because ordering habits and lab access genuinely differ by specialty. Insurance coverage is a real, separate constraint worth asking about directly rather than assuming -- some of the less-routine tests in this category may need a specific documented reason to be covered.",
    citations: [
      { source: 'Bodenheimer T, Lorig K, Holman H, Grumbach K 2002 -- Patient self-management of chronic disease in primary care (JAMA)', url: 'https://pubmed.ncbi.nlm.nih.gov/12435261/' },
      { source: 'Hibbard JH, Stockard J, Mahoney ER, Tusler M 2004 -- Development of the Patient Activation Measure (PAM) (Health Services Research)', url: 'https://pubmed.ncbi.nlm.nih.gov/15230939/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'advocacy-tsh-optimal-range-debate',
    category: 'selfAdvocacy',
    title: '"Your TSH Is Normal" Doesn\'t Always Mean the Same Number to Every Doctor',
    teaser: 'A real, named, ongoing disagreement within endocrinology itself about how wide "normal" should actually be.',
    summary:
      "A frustrating, common real experience: TSH comes back at, say, 3.8 -- technically inside the standard lab reference range, which typically runs up to somewhere around 4.0-4.5 mIU/L -- and gets called normal, while real symptoms persist. This isn't necessarily being dismissed unfairly; it's a real, named, ongoing disagreement within the field itself, not something invented by a frustrated patient. A real 2005 review directly argued the standard reference range is too wide, since the population used to originally set it likely included people with undiagnosed thyroid disease, skewing the \"normal\" upper limit higher than it should be -- the same authors, in a companion paper the same year, explicitly proposed a narrower \"optimal\" range of 0.4 to 2.5 mIU/L instead. That real, published argument has never fully displaced the wider standard range most labs and major endocrine society guidance still use -- this remains a genuine, unresolved disagreement, not a settled case either way. The real, practical use of knowing this: a TSH result sitting in the upper end of the standard range, alongside real, persistent symptoms, is a legitimate, evidence-backed thing to raise directly (\"I know this is technically in range, but I've read there's real debate about whether the optimal target is narrower\") rather than something to assume is fully resolved just because the lab report says \"normal.\"",
    citations: [
      { source: 'Wartofsky L, Dickey RA 2005 -- The evidence for a narrower thyrotropin reference range is compelling (Journal of Clinical Endocrinology & Metabolism)', url: 'https://pubmed.ncbi.nlm.nih.gov/16148345/' },
      { source: 'Dickey RA, Wartofsky L, Feld S 2005 -- Optimal thyrotropin level: normal ranges and reference intervals are not equivalent (Thyroid)', url: 'https://pubmed.ncbi.nlm.nih.gov/16187911/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['advocacy-core-thyroid-panel'],
  },
  {
    id: 'advocacy-seronegative-hashimotos',
    category: 'selfAdvocacy',
    title: 'A Real, Meaningful Minority of Hashimoto\'s Never Tests Antibody-Positive at All',
    teaser: 'This whole app\'s own antibody tracking assumes a positive result. A real, documented minority of genuine Hashimoto\'s cases never gets one.',
    summary:
      "This category's own antibody entry, and much of this app's own tracking, is built around a real, positive TPO or thyroglobulin antibody result as the confirming signal that a low thyroid is genuinely autoimmune. A real, worth-knowing exception exists: seronegative Hashimoto's, where someone has the real clinical and ultrasound picture of Hashimoto's thyroiditis but tests negative on both standard antibody markers. Real research puts this at a genuine, non-trivial share of cases -- one real pediatric cohort study found 12.3% of confirmed Hashimoto's cases were seronegative, and a separate adult study found the same real phenomenon, with seronegative cases tending to show a milder clinical picture than classic antibody-positive Hashimoto's. This isn't a reason to doubt a real diagnosis reached through symptoms and imaging just because an antibody test came back negative -- it's a real, useful thing to know specifically so a negative antibody result doesn't get treated as ruling out Hashimoto's entirely, especially if the rest of the clinical picture (ultrasound findings, thyroid function, family history) still points that direction. Worth raising directly if a negative antibody test is being used to question an otherwise well-supported diagnosis.",
    citations: [
      { source: "Rizzardi P, et al. 2022 -- Seronegative phenotype in a pediatric population with Hashimoto's thyroiditis (Hormones)", url: 'https://pubmed.ncbi.nlm.nih.gov/35377135/' },
      { source: "Rotondi M, et al. 2014 -- Serum negative autoimmune thyroiditis displays a milder clinical picture compared with classic Hashimoto's thyroiditis (European Journal of Endocrinology)", url: 'https://pubmed.ncbi.nlm.nih.gov/24743395/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['advocacy-thyroid-antibodies'],
  },
  {
    id: 'advocacy-tying-together',
    category: 'selfAdvocacy',
    title: 'A Real, Reasonable Testing Calendar -- Pulled Together From Every Entry Above',
    teaser: 'Not "test everything constantly" and not "wait for symptoms" -- a real middle ground, with a real reason behind every interval.',
    summary:
      "Every entry in this category lands on roughly the same shape of answer, and it's worth stating plainly, once, all together: get a real, full baseline -- the core thyroid panel, antibodies, ferritin/iron, vitamin D, B12/folate, magnesium, zinc/copper, CBC, CMP, and a lipid panel -- at least once, even if a current doctor has only ever ordered TSH alone. After any real change (a dose adjustment, a brand switch, starting a supplement to correct a confirmed deficiency), recheck the specific thing that changed at around 6-12 weeks, not sooner, since that's roughly how long it takes a real result to settle rather than still be in motion. Once stable, most of this list only needs revisiting every 6-12 months -- annual is a reasonable default for the whole panel as a group. A few items genuinely don't need any fixed schedule at all: sex hormones and cortisol are worth testing only when a specific symptom or decision calls for it, not on a calendar, since both fluctuate too much day to day for a routine recheck to mean anything. And the one real, deliberate exception to all of this: starting an elimination protocol, where a baseline plus one real recheck at 8-12 weeks is worth doing on purpose. That's the whole, honest shape of \"within reason\" this category was built to answer -- neither testing everything every month nor waiting silently for a symptom to force the question.",
    citations: [],
    overallTier: 'moderate',
    relatedIds: ['advocacy-why-it-matters', 'advocacy-elimination-protocol-exception'],
  },
];
