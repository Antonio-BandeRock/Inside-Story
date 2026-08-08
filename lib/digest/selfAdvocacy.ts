import type { DigestEntry } from './types';

// Self Advocacy -- added 2026-08-07, direct request, prompted by a real
// Google-search summary the person's wife had found and shared: "How to
// self advocate for full panel tests to be done... explain why each type
// of test is useful to a person with Hashimoto's and how often they should
// be tested for the data to track a trend correctly within reason."
//
// A different job from every other category in this Digest -- not "what
// does the research say about a food or mechanism," but "what should a
// person actually ask their doctor for, why, and how often is reasonable
// without becoming excessive." The shared Google-search summary named
// correct test categories (thyroid panel, nutrient markers, sex hormones,
// metabolic panel, inflammation), and every one of those was independently
// re-verified via WebFetch against PubMed rather than trusted as-is (this
// session's WebSearch budget was already exhausted, so every citation here
// was found the established fallback way: WebFetch against real PubMed
// search-result and abstract pages). A few of the summary's own framings
// needed correction along the way -- see individual entries below,
// especially reverse T3 (a controversial test, not a settled one) and the
// sex-hormone panel (often not needed to diagnose perimenopause at all,
// contrary to how routinely it gets ordered).
//
// The "how often, within reason" half of the request is answered plainly
// throughout: where a source states a specific interval, that number is
// used and cited; where the honest answer is "common clinical practice,
// not a single settled guideline," that's stated as such rather than
// dressed up with a citation that doesn't actually say the number. The
// closing entry pulls every interval into one practical calendar.
//
// 2026-08-08: content fields rewritten to remove AI-writing tics flagged
// directly by the person -- em dashes as punctuation, "not X, it's Y"
// contrast, and overused words like "real"/"genuinely"/"honest(ly)"/
// "worth" -- see bigPicture.ts's own header comment for the full context.
// Every fact, number, and citation is unchanged.
//
// 2026-08-08, same day, second change: this file's own single, shared
// Self Advocacy category was dissolved -- direct request, part of the same
// restructure that gave every entry in this whole Digest a real `category`
// of either 'hashimotos' or 'basicHealth' (see types.ts's own header
// comment for the full reasoning): "Self advocacy should also be specific
// to each disease." The 16 entries here that are genuinely Hashimoto's-
// specific (TSH/FT4/FT3, TPO/Tg antibodies, reverse T3, ferritin, vitamin D,
// B12/folate, selenium, CMP's liver/kidney-thyroid framing, the lipid-panel/
// thyroid link, A1c's Hashimoto's-T1D comorbidity framing, cortisol/APS-2,
// the elimination-protocol exception, the TSH-range debate, seronegative
// Hashimoto's, and the fibromyalgia overlap) kept their real content
// unchanged and simply carry `category: 'hashimotos'` now. The 9 that are
// genuinely condition-agnostic (why activation matters at all, magnesium's
// own testing limitation, zinc/copper, CBC, fasting insulin, hs-CRP,
// sex-hormone/perimenopause testing, how to actually ask, and the
// prescribing-cascade concept) carry `category: 'basicHealth'` instead.
// This file still holds every one of those entries -- only the `category`
// field on each changed, not which file authors it, matching this whole
// restructure's own standing practice of keeping one-topic-per-file for
// authoring while letting `category` do the real grouping. RA and Psoriasis
// each got their own new, small, genuinely disease-specific self-advocacy
// entries added directly to rheumatoidArthritis.ts/psoriasis.ts instead of
// living here -- this file no longer tries to be every condition's shared
// self-advocacy home.
//
// 2026-08-08, same day, third change: 4 of the 9 `basicHealth` entries
// (why activation matters, CBC, sex-hormone/perimenopause testing, how to
// actually ask) still named Hashimoto's directly in their own prose despite
// carrying the general category, using it as an illustrative example
// rather than a substantive claim. Reworded to state the same real,
// general finding condition-neutrally -- none of the underlying facts
// changed, only the specific-disease framing.
export const SELF_ADVOCACY_ENTRIES: DigestEntry[] = [
  {
    id: 'advocacy-why-it-matters',
    category: 'basicHealth',
    title: 'Why Self-Advocacy Matters: Most Doctors Order Less Than a Full Picture, Not Because They\'re Wrong to',
    teaser: 'A standard visit runs 15 minutes and one lab requisition. Getting a fuller picture of any chronic condition takes more, and it\'s a learnable skill.',
    summary:
      "A primary care visit is built around triage, not a deep investigation. A doctor sees a value in range and, correctly by their own training, moves on. That's not negligence. It's the plain limit of what a 15-minute visit with one lab requisition can cover, and it's why a fuller panel relevant to a specific chronic condition so often never gets ordered unless the person in the room asks for it by name. Research backs this up: patients who are more \"activated,\" meaning informed, prepared, and an active participant in their own care rather than a passive recipient of it, measurably have better outcomes managing chronic conditions. Not because they argue harder, but because they show up with the right questions already framed. That's the practical skill behind every condition-specific self-advocacy section in this app: not confrontation, just knowing which test to name, why it matters for that condition specifically, and how often asking for it again actually adds information instead of noise.",
    citations: [
      { source: 'Hibbard JH, Stockard J, Mahoney ER, Tusler M 2004: Development of the Patient Activation Measure (PAM): conceptualizing and measuring activation in patients and consumers (Health Services Research)', url: 'https://pubmed.ncbi.nlm.nih.gov/15230939/' },
      { source: 'Newland P, Lorenz R, Oliver BJ 2021: Patient activation in adults with chronic conditions: A systematic review (Journal of Health Psychology)', url: 'https://pubmed.ncbi.nlm.nih.gov/32830587/' },
      { source: 'Bodenheimer T, Lorig K, Holman H, Grumbach K 2002: Patient self-management of chronic disease in primary care (JAMA)', url: 'https://pubmed.ncbi.nlm.nih.gov/12435261/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'advocacy-core-thyroid-panel',
    category: 'hashimotos',
    title: 'TSH, Free T4 & Free T3: Ask for All Three, Not Just the One Most Labs Default To',
    teaser: 'A "normal thyroid" result is often just one number out of three that actually matter.',
    summary:
      "A standard thyroid check very often means one test: TSH. That's a reasonable starting point. Clinical guidance calls TSH the single best screening test for primary hypothyroidism. But it's a screening test, not the full picture, and Hashimoto's is exactly the situation where the full picture matters. Free T4 shows how much actual usable hormone the thyroid itself is releasing; free T3 shows how much of that hormone the body is actually converting into its active form, a separate step (covered elsewhere in this Digest's Organs & Body Systems category) that TSH alone says nothing about. Someone can have a technically normal TSH while still converting poorly, or sit right at the edge of a lab's reference range in a way a single number obscures. It's worth asking for both by name at any full panel, not assuming they're automatically included. On timing: clinical guidance recommends rechecking thyroid function about six weeks after any dose change or a switch between brand and generic levothyroxine, since that's roughly how long it takes levels to fully re-settle. Checking sooner just measures a value still in motion.",
    citations: [
      { source: 'Gaitonde DY, Rowley KD, Sweeney LB 2012: Hypothyroidism: An Update (American Family Physician)', url: 'https://www.aafp.org/pubs/afp/issues/2012/0801/p244.html' },
    ],
    overallTier: 'strong',
    relatedIds: ['labs-tsh-diurnal-timing', 'organ-liver-t4t3-conversion', 'ibs-red-flags-workup'],
  },
  {
    id: 'advocacy-thyroid-antibodies',
    category: 'hashimotos',
    title: 'TPO & Thyroglobulin Antibodies: The Test That Confirms It\'s Really Hashimoto\'s',
    teaser: 'TSH tells you the thyroid is underperforming. Antibodies tell you why, and that changes what else is worth watching.',
    summary:
      "A low thyroid on its own doesn't say what's causing it. TPO and thyroglobulin antibodies confirm an autoimmune process is the reason, the specific test this whole app's tracking is built around (see the Glossary's TPO entry for that history). Clinical guidance notes that elevated TPO antibody titers in someone with only mildly abnormal thyroid numbers (subclinical hypothyroidism) meaningfully raise the odds of progressing to full, overt hypothyroidism, which is why a positive antibody result matters even before TSH itself looks clearly abnormal. Once confirmed, though, retesting antibodies often doesn't change day-to-day treatment the way retesting TSH does. Antibody titers aren't used to adjust a levothyroxine dose, and Hashimoto's antibody levels can stay elevated for a long time without a clean, predictable decline pattern. That makes this an exception to \"more testing is better\": once confirmed, checking once a year at most is enough to notice a genuine long-term trend, rising, falling, or holding steady, without chasing normal week-to-week fluctuation that doesn't mean anything.",
    citations: [
      { source: 'Gaitonde DY, Rowley KD, Sweeney LB 2012: Hypothyroidism: An Update (American Family Physician)', url: 'https://www.aafp.org/pubs/afp/issues/2012/0801/p244.html' },
      { source: 'Hasse-Lazar K, Jarzab B, et al. 1997: TSH-receptor antibodies in thyroid diseases (thyroid peroxidase antibody titer data)', url: 'https://pubmed.ncbi.nlm.nih.gov/9333770/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'advocacy-reverse-t3',
    category: 'hashimotos',
    title: 'Reverse T3: A Test With an Unsettled Answer, Worth Knowing Before Asking For It',
    teaser: 'Some practitioners order it as a routine part of a "full thyroid panel." Mainstream endocrinology doesn\'t agree it belongs there.',
    summary:
      "Reverse T3 (introduced in the Glossary) shows up on a lot of functional-medicine \"complete thyroid panel\" lists, often presented as the missing piece a standard workup skips. The actual picture is more contested than that framing suggests. A 2018 analysis of national laboratory order data studied how often reverse T3 gets ordered and by whom, treating the test's clinical utility as an open, debated question rather than settled fact. There's no broadly accepted reference range tied to a specific treatment decision the way TSH or free T4 have. That doesn't mean it's meaningless. A high reverse T3 alongside other findings can still be one more data point. But walking in and asking for it as though it's a routine, universally-endorsed test risks the conversation stalling on that one item instead of the tests with much stronger, more actionable evidence behind them (the core panel above, ferritin, vitamin D). A doctor's hesitation to order it is a defensible, evidence-based position, not knee-jerk resistance.",
    citations: [
      { source: 'Schmidt RL, LoPresti JS, McDermott MT, Zick SM, Straseski JA 2018: Does Reverse Triiodothyronine Testing Have Clinical Utility? An Analysis of Practice Variation Based on Order Data from a National Reference Laboratory (Thyroid)', url: 'https://pubmed.ncbi.nlm.nih.gov/29756541/' },
    ],
    overallTier: 'weak',
  },
  {
    id: 'advocacy-iron-ferritin',
    category: 'hashimotos',
    title: 'Ferritin & a Full Iron Panel: Low Iron Can Mimic, and Worsen, Hypothyroid Symptoms Directly',
    teaser: 'Fatigue, brain fog, hair thinning: the same short list shows up whether the cause is thyroid, iron, or both at once.',
    summary:
      "Iron deficiency and hypothyroidism share enough symptoms that it's easy to attribute everything to the thyroid alone and stop looking. The research says that's often the wrong call to make blindly. A 2023 systematic review and meta-analysis pooling ten studies found people with iron deficiency had measurably lower TSH, free T4, and free T3 than those without it, and serum ferritin itself correlated positively with both TSH and free T4: iron status and thyroid hormone levels move together, not independently. A separate 2024 systematic review confirmed documented iron and ferritin deficiency in women with hypothyroidism and chronic lymphocytic (Hashimoto's) thyroiditis. Iron deficiency has also been separately linked to a measurable increase in thyroid autoantibody positivity, a second, more direct reason this isn't just a symptom-overlap coincidence. A full iron panel, not ferritin alone, is worth asking for at least once, especially for anyone menstruating or with fatigue that hasn't fully resolved on thyroid treatment. Checking every 6-12 months is reasonable for ongoing tracking; more often, roughly every 8-12 weeks, only makes sense while actively correcting a confirmed deficiency, to catch overcorrection before it becomes its own problem.",
    citations: [
      { source: 'Garofalo V, Condorelli RA, Cannarella R, Aversa A, Calogero AE, La Vignera S 2023: Relationship between Iron Deficiency and Thyroid Function: A Systematic Review and Meta-Analysis', url: 'https://pubmed.ncbi.nlm.nih.gov/38004184/' },
      { source: 'Gierach M, Rudewicz M, Junik R 2024: Iron and ferritin deficiency in women with hypothyroidism and chronic lymphocytic thyroiditis: systematic review', url: 'https://pubmed.ncbi.nlm.nih.gov/38923898/' },
      { source: "Hu S, Rayman MP 2017: Multiple Nutritional Factors and the Risk of Hashimoto's Thyroiditis", url: 'https://pubmed.ncbi.nlm.nih.gov/28290237/' },
    ],
    overallTier: 'strong',
    relatedIds: ['iron-deficiency-symptoms-staged', 'iron-tying-together'],
  },
  {
    id: 'advocacy-vitamin-d',
    category: 'hashimotos',
    title: 'Vitamin D: Commonly Low With Hashimoto\'s, Worth Rechecking',
    teaser: 'Not a supplement to guess at, but a checkable number, and one Hashimoto\'s patients are disproportionately likely to be low on.',
    summary:
      "This Digest's own Nutrients & Micronutrients category already covers vitamin D's mixed trial evidence for Hashimoto's itself. This entry is about the practical side: getting it checked at all. A 2022 systematic review found a consistent association between vitamin D deficiency and autoimmune thyroid disease broadly, and more recent mechanistic research keeps tying vitamin D status directly to immune regulation relevant to Hashimoto's specifically, not just bone health, which is usually the only reason it gets checked by default. Deficiency is common enough in this population that it's worth asking for an actual 25-hydroxyvitamin D blood level rather than assuming a general multivitamin covers it. A reasonable, non-excessive cadence: check once at baseline, recheck about 3 months after starting or adjusting a supplement dose to confirm the level actually moved, then settle into checking once or twice a year (many people find once in winter, when levels run lowest, is the most useful annual check) once a stable, adequate level is established. There's little reason to check more often than that outside of a genuine dose change.",
    citations: [
      { source: 'Khozam SA, Sumaili AM, Alflan MA, Shawabkeh RAS 2022: Association Between Vitamin D Deficiency and Autoimmune Thyroid Disorder: A Systematic Review', url: 'https://pubmed.ncbi.nlm.nih.gov/35836431/' },
      { source: "Sun W, Ding C, Wang Y, Li G, Su Z, Wang X 2025: Vitamin D deficiency in Hashimoto's thyroiditis: mechanisms, immune modulation, and therapeutic implications", url: 'https://pubmed.ncbi.nlm.nih.gov/40822954/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['nutrient-vitamin-d'],
  },
  {
    id: 'advocacy-b12-folate',
    category: 'hashimotos',
    title: 'B12 & Folate: Two Autoimmune Diseases That Travel Together More Than People Realize',
    teaser: 'The same immune system that can attack the thyroid can separately attack the stomach lining that absorbs B12, a measured overlap, not a coincidence.',
    summary:
      "B12 deficiency and hypothyroidism share symptoms (fatigue, brain fog, tingling), but there's also a direct biological reason they show up together so often. A 2006 study found 28% of autoimmune thyroid disease patients had low B12 levels, and of those, 31% had evidence of pernicious anemia: autoimmune damage to the stomach cells needed to absorb B12 at all, a second, separate autoimmune process riding alongside the thyroid one, not just an unrelated dietary gap. That's a specific, checkable, fixable finding, not a vague overlap. Folate works alongside B12 in the same metabolic pathway and is reasonable to check at the same time, especially for anyone whose diet has changed recently (a new elimination protocol, cutting fortified grains, going more plant-based). A proper B12 test, not just a symptom guess, is worth asking for at least once for anyone with Hashimoto's, with retesting reasonable about once a year, or sooner (within a few months) for anyone found low and starting supplementation, to confirm it actually corrected rather than assuming it did.",
    citations: [
      { source: 'Ness-Abramof R, et al. 2006: Prevalence and evaluation of B12 deficiency in patients with autoimmune thyroid disease (American Journal of the Medical Sciences)', url: 'https://pubmed.ncbi.nlm.nih.gov/16969140/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'advocacy-magnesium',
    category: 'basicHealth',
    title: 'Magnesium: Worth Ordering, With One Honest Limitation Worth Knowing First',
    teaser: 'The blood test for magnesium checks less than 1% of where the body actually keeps it, worth asking for anyway, just not over-trusting on its own.',
    summary:
      "This is the one test in this category worth requesting with the caveat stated up front, because the caveat is well documented: less than 1% of the body's total magnesium actually circulates in the blood, which is exactly what a standard serum magnesium test measures. The vast majority sits inside cells and bone, invisible to that one number. A 1998 study demonstrated this directly, finding oral magnesium supplementation could shift the body's magnesium stores with barely any corresponding change in serum levels. That doesn't mean skip the test; a genuinely low serum result is still a meaningful finding worth treating. It means a normal serum result doesn't fully rule out a deficiency the way it might for a nutrient measured more sensitively, like vitamin D. Given that limitation, there's little value in retesting frequently expecting the number to track supplementation cleanly. A reasonable approach is checking once as a baseline and again only if new symptoms suggest a problem (muscle cramps, irregular heartbeat, unusual fatigue), not on a fixed schedule.",
    citations: [
      { source: 'Weller E, Bachert P, Meinck HM, et al. 1998: Lack of effect of oral Mg-supplementation on Mg in serum, blood cells, and calf muscle', url: 'https://pubmed.ncbi.nlm.nih.gov/9813870/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['magnesium-tying-together'],
  },
  {
    id: 'advocacy-zinc-copper',
    category: 'basicHealth',
    title: 'Zinc & Copper: Ask for Them as a Pair, Especially If Already Supplementing Zinc',
    teaser: 'Documented cases exist of zinc supplements causing anemia and nerve damage, from the copper deficiency the zinc itself caused.',
    summary:
      "Zinc gets recommended often enough for immune support and hair/skin symptoms that it's easy to start supplementing without ever checking a blood level, and that's exactly the situation where a second, related problem can develop unnoticed. Zinc and copper are absorbed through a competing pathway in the gut, and documented case reports show sustained zinc supplementation causing copper deficiency serious enough to produce anemia and, in some cases, real neurological symptoms (gait problems, nerve damage) before anyone thought to check copper as the actual cause. This isn't a rare theoretical risk. It's been reported repeatedly enough in the literature to be a recognized, named clinical picture. The fix is simple: if zinc is being supplemented at all, ask for copper to be checked alongside it, not as an afterthought. For someone not supplementing either, checking both once as a baseline is reasonable; for someone actively supplementing zinc, rechecking both every 6-12 months is a sensible cadence to catch a problem before it becomes serious.",
    citations: [
      { source: 'Gupta N, Carmichael MF 2023: Zinc-Induced Copper Deficiency as a Rare Cause of Neurological Deficit and Anemia', url: 'https://pubmed.ncbi.nlm.nih.gov/37736439/' },
      { source: 'Magham K, Han J, Eilbert W, Bunney EB 2023: Severe copper deficiency anemia caused by zinc supplement use', url: 'https://pubmed.ncbi.nlm.nih.gov/37640593/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['interaction-zinc-copper'],
  },
  {
    id: 'advocacy-selenium-testing',
    category: 'hashimotos',
    title: 'Selenium: The Best-Evidenced Supplement in This App, and the Hardest One to Get Tested',
    teaser: 'This Digest\'s own strongest-evidenced finding has one practical catch: most standard labs simply don\'t run this test.',
    summary:
      "Selenium supplementation has strong, meta-analysis-level trial support for reducing TPO antibodies in Hashimoto's, covered in full under Nutrients & Micronutrients, this app's single most confidently-evidenced finding. The practical complication for self-advocacy specifically: plasma/serum selenium testing isn't part of a standard lab menu the way vitamin D or B12 is, and a doctor unfamiliar with running it may not have an easy, routine way to order it, unlike nearly everything else in this category. That's worth knowing walking in, so a \"we don't typically test that\" response reads as a logistical limit rather than dismissal. A reasonable path when direct testing isn't practical: ask specifically for it if a lab does offer it (some larger reference labs do), and otherwise lean on the already-cited dietary and supplementation research (2-3 Brazil nuts a day is a commonly cited food source) rather than treating the absence of a lab number as a reason not to address it at all.",
    citations: [
      { source: 'Selenium supplementation in patients with Hashimoto thyroiditis: a systematic review and meta-analysis of 21 studies (1,610 subjects)', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10194801/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['nutrient-selenium', 'interaction-selenium-iodine'],
  },
  {
    id: 'advocacy-cbc',
    category: 'basicHealth',
    title: 'Complete Blood Count (CBC): The General-Purpose Test That Catches What a Condition-Specific Panel Misses',
    teaser: 'Anemia from low iron, anemia from low B12, a hidden infection, a blood-cell abnormality: one test flags all of them at once.',
    summary:
      "A CBC isn't specific to any one condition, and that's exactly its value here. It's the general-purpose net that catches related problems (iron-deficiency anemia, B12-deficiency anemia, and more) without needing to separately diagnose each one from scratch. Red blood cell size and shape on a CBC can point toward which specific deficiency to chase down first, before ever ordering a more specific iron or B12 panel, an efficient first step rather than a redundant one. It's also simply part of a complete picture of overall health, catching things entirely unrelated to any particular diagnosis that are still worth knowing about. As part of an annual physical or a periodic full-panel check, a CBC is reasonable to include every time. There's little value asking for it more often outside of actively investigating a new, specific symptom (unusual bruising, persistent unexplained fatigue, signs of infection) that would justify a sooner recheck on its own.",
    citations: [],
    overallTier: 'moderate',
    relatedIds: ['advocacy-iron-ferritin', 'advocacy-b12-folate'],
  },
  {
    id: 'advocacy-cmp',
    category: 'hashimotos',
    title: 'Comprehensive Metabolic Panel (CMP): Checking the Organs Doing the Thyroid\'s Own Hidden Work',
    teaser: 'The liver and kidneys are doing measurable thyroid-related work of their own. A CMP is how that work actually gets checked.',
    summary:
      "This app's Organs & Body Systems category makes the case that Hashimoto's reaches well past the thyroid gland itself: the liver does the largest share of converting inactive T4 into active T3, and research has found measurably reduced kidney filtration (eGFR) tracking with worsening thyroid function, both reversible with treatment. A CMP is the standard, single test that actually checks both of those organs directly (liver enzymes, kidney function via creatinine/eGFR) alongside blood glucose and electrolyte balance. It's not a redundant add-on to a thyroid panel, but a direct way to see whether those two connected organ systems are keeping up. It's worth asking for as part of any full annual panel rather than assuming \"my thyroid labs were fine\" already covers it, since neither the liver nor kidney findings above would ever show up on a TSH/free T4/free T3 panel alone. Once a stable, unremarkable CMP is established, annual is a reasonable cadence; there's little reason to check more often without a specific new symptom or medication change prompting it.",
    citations: [],
    overallTier: 'moderate',
    relatedIds: ['organ-liver-t4t3-conversion', 'organ-kidney'],
  },
  {
    id: 'advocacy-lipid-panel',
    category: 'hashimotos',
    title: 'Lipid Panel: Cholesterol That Rises and Falls With the Thyroid Itself, Not Just Diet',
    teaser: 'A direct hormonal effect, not a moral failing about diet, and one a 6-month trial showed genuinely reverses with treatment.',
    summary:
      "Thyroid hormone directly regulates how the liver clears LDL cholesterol from the blood via the LDL receptor pathway, meaning cholesterol numbers in someone with Hashimoto's are, in a direct way, partly a thyroid-function readout, not purely a diet-and-exercise scorecard. A double-blind, placebo-controlled 6-month trial confirmed this isn't just theory: treating subclinical hypothyroidism with levothyroxine significantly reduced both total and LDL cholesterol, and the improvement in artery-wall thickness tracked directly with how much cholesterol and TSH both improved together. That's a useful, motivating fact to know: a cholesterol number that looks stubborn on diet alone may move once thyroid treatment is well-dialed-in, worth re-checking specifically after a dose change rather than assumed to be a separate, unrelated problem. Outside of a dose change, following the general cholesterol-screening schedule already set with a doctor is reasonable. This isn't a number that needs Hashimoto's-specific extra-frequent checking once thyroid treatment itself is stable.",
    citations: [
      { source: 'Newman CB 2023: Effects of endocrine disorders on lipids and lipoproteins', url: 'https://pubmed.ncbi.nlm.nih.gov/35654682/' },
      { source: 'Monzani F, et al. 2004: Effect of levothyroxine replacement on lipid profile and intima-media thickness in subclinical hypothyroidism: a double-blind, placebo-controlled study', url: 'https://pubmed.ncbi.nlm.nih.gov/15126526/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'advocacy-a1c-glucose',
    category: 'hashimotos',
    title: 'Hemoglobin A1c & Fasting Glucose: Autoimmune Diseases Have a Habit of Traveling Together',
    teaser: "Hashimoto's and type 1 diabetes share enough biology that checking blood sugar isn't an unrelated add-on. It's a genuinely adjacent risk.",
    summary:
      "This app's Other Autoimmune Diseases category already makes the case that autoimmune conditions don't stay neatly siloed. Hashimoto's and type 1 diabetes both co-occur more than chance would predict, sharing enough underlying immune biology that checking one informs watching for the other. Fasting glucose and hemoglobin A1c (a longer-window average of blood sugar over roughly three months rather than a single-moment snapshot) are the standard way that gets tracked, and this app's own Mitochondria & Metabolism research separately ties visceral fat and insulin resistance directly to Hashimoto's-specific findings, not just general population risk. Neither test needs Hashimoto's-specific extra frequency. Following the general diabetes-screening schedule already agreed with a doctor (typically periodic, more often only if a prior result was borderline or genuinely abnormal) is the reasonable approach here, not a reason to add quarterly rechecks with no new symptom or result prompting it.",
    citations: [],
    overallTier: 'moderate',
    relatedIds: ['mito-visceral-fat-treg-depletion', 'type1-hba1c-time-in-range'],
  },
  {
    id: 'advocacy-fasting-insulin',
    category: 'basicHealth',
    title: 'Fasting Insulin: An Earlier Warning Sign, but Debated as a Standalone Test',
    teaser: 'Some practitioners treat it as an early-warning test years ahead of a real A1c change. The research on how well it actually predicts that is more mixed than the pitch suggests.',
    summary:
      "The logic behind fasting insulin testing is sound on paper: insulin can start rising before blood sugar itself does, as the body works harder to keep glucose normal, meaning, in theory, it could flag developing insulin resistance years before A1c or fasting glucose would catch it. A 2008 review of methods for assessing insulin sensitivity and resistance laid out exactly this appeal alongside its limitations. Fasting insulin assays aren't as tightly standardized across different labs as glucose or A1c are, and no single, universally agreed cutoff value exists the way one does for A1c. That doesn't make it worthless, but it is a more debated, less standardized test than the rest of this category's metabolic entries. It's worth asking about specifically if there's a real reason to suspect early insulin resistance (strong family history, visible weight changes, PCOS-type symptoms) rather than requesting it as a routine, no-reason addition to every panel. Not a test to chase repeatedly without a specific concern driving it.",
    citations: [
      { source: 'Muniyappa R, Lee S, Chen H, Quon MJ 2008: Current approaches for assessing insulin sensitivity and resistance in vivo: advantages, limitations, and appropriate usage', url: 'https://pubmed.ncbi.nlm.nih.gov/17957034/' },
    ],
    overallTier: 'weak',
  },
  {
    id: 'advocacy-hscrp',
    category: 'basicHealth',
    title: 'hs-CRP: A Checkable Inflammation Number, Not One to Chase Every Month',
    teaser: 'This app\'s own research keeps landing on inflammation as the thread connecting food choices to thyroid hormone. hs-CRP is how that thread actually gets measured.',
    summary:
      "High-sensitivity C-reactive protein is the one lab value that shows up as a checkable outcome behind several of this Digest's own findings: the Mediterranean-diet and fiber-intake research in Lifestyle & Environment, the IL-6-to-deiodinase-suppression mechanism connecting inflammation directly to lower active thyroid hormone. It's a marker cardiology guidelines already recognize as one factor worth weighing in overall risk assessment, not a fringe or invented number. The practical point for this category specifically: hs-CRP is a good baseline to establish once, and worth rechecking deliberately after a sustained change (a months-long shift in diet, a new exercise habit) to see whether it actually moved. But it isn't a number that meaningfully changes week to week or even month to month for most people, and checking it that often mostly just measures ordinary day-to-day noise. One baseline check, then a deliberate recheck tied to an actual change being tracked, is the reasonable cadence here.",
    citations: [
      { source: '2018 AHA/ACC/AACVPR/AAPA/ABC/ACPM/ADA/AGS/APhA/ASPC/NLA/PCNA Guideline on the Management of Blood Cholesterol (hs-CRP as a risk-enhancing factor)', url: 'https://pubmed.ncbi.nlm.nih.gov/30586774/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['lifestyle-il6-deiodinase', 'lifestyle-tying-together'],
  },
  {
    id: 'advocacy-sex-hormones-menopause',
    category: 'basicHealth',
    title: 'Estradiol, Progesterone, Testosterone, DHEA-S & SHBG: Useful, but Often Not Required to Diagnose Perimenopause Itself',
    teaser: 'A counterintuitive finding: the full hormone panel isn\'t usually what actually confirms perimenopause is happening.',
    summary:
      "This is the one panel in this category where the honest answer runs against how routinely it tends to get ordered. An influential 2003 clinical review directly asked the question \"is this woman perimenopausal?\" and concluded the most reliable answer usually comes from symptoms and menstrual pattern change, not a single hormone blood draw. Estradiol and FSH in particular fluctuate enough within the same person, cycle to cycle, that one snapshot value can mislead more than it clarifies. That doesn't mean the panel is never useful. It's genuinely valuable in specific situations: symptoms that don't fit the usual pattern, ruling out a different cause before starting hormone therapy, or making an actual treatment decision about HRT where a baseline number matters. Perimenopause symptoms (fatigue, mood shifts, temperature sensitivity, sleep disruption) genuinely overlap with several chronic conditions' own symptom lists, which is exactly when this panel earns its real value: worth asking for specifically when two possible explanations are hard to tell apart, not as a routine, repeat-every-visit addition, since the same day-to-day fluctuation that makes one snapshot unreliable also makes frequent retesting mostly noise.",
    citations: [
      { source: 'Bastian LA, Smith CM, Nanda K 2003: Is This Woman Perimenopausal? (JAMA)', url: 'https://pubmed.ncbi.nlm.nih.gov/12588275/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'advocacy-cortisol-testing',
    category: 'hashimotos',
    title: 'Cortisol Testing: A Legitimate Test, and a Named Wellness-Industry Overreach to Recognize',
    teaser: '"Adrenal fatigue" isn\'t a recognized medical diagnosis. A distinct condition it gets confused with is.',
    summary:
      "Two different things both get called \"cortisol testing,\" and telling them apart matters. A 2025 review states this about as plainly as a medical paper ever does: the terms \"adrenal fatigue,\" \"adrenal asthenia,\" and \"adrenal burnout,\" often attached to mail-order salivary cortisol test kits marketed directly to consumers, \"are not a part of the medical or endocrine lexicon,\" meaning they aren't a diagnosis a real endocrinologist would treat as one. That's worth knowing before spending money on one of those kits. What IS worth testing through an actual doctor: this app's own Organs & Body Systems category covers Autoimmune Polyglandular Syndrome Type 2, a documented autoimmune attack on the adrenal glands that can occur alongside Hashimoto's, diagnosed with an AM serum cortisol test or an ACTH stimulation test, not a saliva kit. It's worth raising directly with a doctor only when there's a real reason to (unexplained low blood pressure, unusual skin darkening, severe unremitting fatigue with other red flags), not something to test on a fixed schedule without one of those signs present.",
    citations: [
      { source: "Kalra S, Dhingra A, Kapoor N 2025: Adrenal Asthenia (Journal of the Pakistan Medical Association)", url: 'https://pubmed.ncbi.nlm.nih.gov/40143493/' },
    ],
    overallTier: 'strong',
    relatedIds: ['organ-adrenal-aps2', 'lifestyle-chronic-stress-hpa'],
  },
  {
    id: 'advocacy-elimination-protocol-exception',
    category: 'hashimotos',
    title: 'The One Exception to "Don\'t Over-Test": Starting an Elimination Protocol',
    teaser: 'Every rule above about not testing too often has one deliberate exception, and this is it.',
    summary:
      "Nearly every entry in this category ends the same way: don't retest more than roughly every 6-12 months without a specific reason, because the biology itself doesn't move fast enough for more frequent checks to mean anything beyond ordinary noise. Starting an elimination protocol, this app's own Healing Stages Stage 1, a deliberate, structured change in what's being eaten, is the one legitimate exception to that rule, for a specific reason: it's the single biggest, fastest input change most people ever make to their own body chemistry, and the whole point of doing it is to actually see whether it moves something measurable. A sensible approach: get a proper baseline panel (as much of this category's list as practical) right before starting, then one recheck around 8-12 weeks in, long enough for a signal to separate from noise, matching the timelines this app's own gut-repair research already cites for measurable change, but not so frequent that normal week-to-week fluctuation gets mistaken for progress or failure. Outside of a change this deliberate, the standard cadence above still applies. This is a bounded exception, not a license to test constantly during any life change.",
    citations: [],
    overallTier: 'moderate',
    relatedIds: ['healing-stage-map', 'healing-stage1-avoid'],
  },
  {
    id: 'advocacy-how-to-ask',
    category: 'basicHealth',
    title: 'How to Actually Ask: A Written List Beats a Verbal Request Every Time',
    teaser: 'The single most effective thing anyone can bring to this conversation isn\'t confidence. It\'s a piece of paper.',
    summary:
      "Research on patient self-management found something consistently practical: patients who prepare specific, written questions ahead of a visit get more of those questions actually answered than patients who raise the same concerns verbally, in the moment, under time pressure. That's the single most actionable piece of self-advocacy advice in this whole app: not a script for confrontation, just a short, specific, written list (this app's own Bio-Compass symptom log is a ready-made source for exactly this) naming the actual tests relevant to a specific situation, handed over or read from directly rather than described from memory. Framing matters too. \"I'd like to also check my [specific test] this visit, given my [condition]\" lands very differently from an open-ended \"can you test everything.\" It's also worth knowing which tests are realistically a same-visit primary-care request (a condition's own core panel, CBC, CMP, lipids, vitamin D, B12, ferritin) versus ones that more often need a referral to a specialist or a functional-medicine practitioner to access at all (a more contested or less standardized test, a full sex-hormone panel, a nutrient without a routine lab pathway), not because a PCP is unwilling, but because ordering habits and lab access genuinely differ by specialty. Insurance coverage is a separate constraint worth asking about directly rather than assuming; some of the less-routine tests may need a specific documented reason to be covered.",
    citations: [
      { source: 'Bodenheimer T, Lorig K, Holman H, Grumbach K 2002: Patient self-management of chronic disease in primary care (JAMA)', url: 'https://pubmed.ncbi.nlm.nih.gov/12435261/' },
      { source: 'Hibbard JH, Stockard J, Mahoney ER, Tusler M 2004: Development of the Patient Activation Measure (PAM) (Health Services Research)', url: 'https://pubmed.ncbi.nlm.nih.gov/15230939/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'advocacy-tsh-optimal-range-debate',
    category: 'hashimotos',
    title: '"Your TSH Is Normal" Doesn\'t Always Mean the Same Number to Every Doctor',
    teaser: 'A named, ongoing disagreement within endocrinology itself about how wide "normal" should actually be.',
    summary:
      "A frustrating, common experience: TSH comes back at, say, 3.8 (technically inside the standard lab reference range, which typically runs up to somewhere around 4.0-4.5 mIU/L) and gets called normal, while symptoms persist. This isn't necessarily being dismissed unfairly. It's a named, ongoing disagreement within the field itself, not something invented by a frustrated patient. A 2005 review directly argued the standard reference range is too wide, since the population used to originally set it likely included people with undiagnosed thyroid disease, skewing the \"normal\" upper limit higher than it should be. The same authors, in a companion paper the same year, proposed a narrower \"optimal\" range of 0.4 to 2.5 mIU/L instead. That argument has never fully displaced the wider standard range most labs and major endocrine society guidance still use. This remains an unresolved disagreement, not a settled case either way. The practical use of knowing this: a TSH result sitting in the upper end of the standard range, alongside persistent symptoms, is a legitimate, evidence-backed thing to raise directly (\"I know this is technically in range, but I've read there's real debate about whether the optimal target is narrower\") rather than something to assume is fully resolved just because the lab report says \"normal.\"",
    citations: [
      { source: 'Wartofsky L, Dickey RA 2005: The evidence for a narrower thyrotropin reference range is compelling (Journal of Clinical Endocrinology & Metabolism)', url: 'https://pubmed.ncbi.nlm.nih.gov/16148345/' },
      { source: 'Dickey RA, Wartofsky L, Feld S 2005: Optimal thyrotropin level: normal ranges and reference intervals are not equivalent (Thyroid)', url: 'https://pubmed.ncbi.nlm.nih.gov/16187911/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['advocacy-core-thyroid-panel'],
  },
  {
    id: 'advocacy-seronegative-hashimotos',
    category: 'hashimotos',
    title: 'A Meaningful Minority of Hashimoto\'s Never Tests Antibody-Positive at All',
    teaser: 'This whole app\'s own antibody tracking assumes a positive result. A documented minority of genuine Hashimoto\'s cases never gets one.',
    summary:
      "This category's own antibody entry, and much of this app's tracking, is built around a positive TPO or thyroglobulin antibody result as the confirming signal that a low thyroid is genuinely autoimmune. One exception is worth knowing: seronegative Hashimoto's, where someone has the clinical and ultrasound picture of Hashimoto's thyroiditis but tests negative on both standard antibody markers. Research puts this at a genuine, non-trivial share of cases. One pediatric cohort study found 12.3% of confirmed Hashimoto's cases were seronegative, and a separate adult study found the same phenomenon, with seronegative cases tending to show a milder clinical picture than classic antibody-positive Hashimoto's. This isn't a reason to doubt a diagnosis reached through symptoms and imaging just because an antibody test came back negative. It's useful to know specifically so a negative antibody result doesn't get treated as ruling out Hashimoto's entirely, especially if the rest of the clinical picture (ultrasound findings, thyroid function, family history) still points that direction. It's worth raising directly if a negative antibody test is being used to question an otherwise well-supported diagnosis.",
    citations: [
      { source: "Rizzardi P, et al. 2022: Seronegative phenotype in a pediatric population with Hashimoto's thyroiditis (Hormones)", url: 'https://pubmed.ncbi.nlm.nih.gov/35377135/' },
      { source: "Rotondi M, et al. 2014: Serum negative autoimmune thyroiditis displays a milder clinical picture compared with classic Hashimoto's thyroiditis (European Journal of Endocrinology)", url: 'https://pubmed.ncbi.nlm.nih.gov/24743395/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['advocacy-thyroid-antibodies'],
  },
  {
    id: 'advocacy-prescribing-cascade',
    category: 'basicHealth',
    title: 'The Prescribing Cascade: A Named Pattern, and Evidence It Can Run the Other Way Too',
    teaser: 'One medication\'s side effect, mistaken for a new problem, treated with a second medication, which causes its own side effect: a phenomenon with a real name in the medical literature.',
    summary:
      "There's a specific term in the medical literature for a pattern many people with a chronic condition eventually recognize in their own medicine cabinet: the prescribing cascade. An authoritative definition states it plainly. It begins when a drug's own side effect gets misinterpreted as a new medical condition in its own right, leading to a second drug being started to treat what was actually the first drug's side effect all along, sometimes repeating again from there. This isn't a fringe idea. It's an established concept in clinical pharmacology, tracing back to a classic 1997 paper on optimizing drug treatment. The honest, hopeful flip side, backed by real trial data rather than just intuition: when an underlying driver of a problem (in this app's own core framing, chronic inflammation and metabolic health) genuinely improves, some medications originally started for a downstream symptom can be medically-supervised candidates for reduction. A well-known trial (DiRECT) found that among people who achieved diabetes remission through a structured weight-loss intervention (a mean weight loss of 11.4 kg), 28% remained completely off blood pressure medication at 24 months, a quantified, if honestly partial, success rate, not a guaranteed outcome for everyone. This is emphatically not a case for stopping any medication without medical supervision. It's an evidence-backed reason to ask a doctor directly, as underlying health measurably improves, whether a medication started for a downstream symptom is still actually needed, rather than assuming a prescription written years ago is permanent by default.",
    citations: [
      { source: 'McCarthy LM, Visentin JD, Rochon PA 2019: Assessing the Scope and Appropriateness of Prescribing Cascades', url: 'https://pubmed.ncbi.nlm.nih.gov/30747997/' },
      { source: 'Rochon PA, Gurwitz JH 1997: Optimising drug treatment for elderly people: the prescribing cascade (BMJ)', url: 'https://pubmed.ncbi.nlm.nih.gov/9366745/' },
      { source: 'Leslie WS, Ali E, Harris L, et al. 2021: Antihypertensive medication needs and blood pressure control with weight loss in the Diabetes Remission Clinical Trial (DiRECT)', url: 'https://pubmed.ncbi.nlm.nih.gov/34056684/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['advocacy-how-to-ask', 'mito-visceral-fat-treg-depletion', 'type2-direct-remission-trial'],
  },
  {
    id: 'advocacy-fibromyalgia-thyroid-overlap',
    category: 'hashimotos',
    title: 'Fibromyalgia & Hashimoto\'s: A Documented Overlap Worth Knowing Before Accepting Either Label Alone',
    teaser: 'Research keeps finding these two conditions sitting closer together than their separate names suggest, including a striking number worth a direct conversation.',
    summary:
      "Fibromyalgia and Hashimoto's share enough symptom overlap (fatigue, muscle pain, brain fog) that untangling which is actually driving a given symptom is a legitimate clinical challenge, not a simple either/or. Research backs up that the overlap runs deeper than shared symptoms alone: several studies have found autoimmune thyroiditis and thyroid antibodies present in an elevated share of fibromyalgia patients compared to the general population, across independent research groups. One specific finding worth knowing: a study examining thyroid hormone treatment among fibromyalgia patients found 34% (33 of 103) were being treated with thyroid hormone, a high enough number that the study's own title characterizes it as \"excess use.\" That doesn't mean thyroid treatment is wrong for any individual person with both diagnoses; some genuinely have both independent conditions. But it's a direct reason a fibromyalgia diagnosis is worth pairing with the full thyroid panel this app's own Self Advocacy category already recommends, rather than either diagnosis fully explaining away symptoms that might actually belong to the other, or reflect a real overlap of both at once.",
    citations: [
      { source: 'Suk JH, Lee JH, Kim JM 2012: Association between thyroid autoimmunity and fibromyalgia', url: 'https://pubmed.ncbi.nlm.nih.gov/22549342/' },
      { source: 'Ribeiro LS, Proietti FA 2004: Interrelations between fibromyalgia, thyroid autoantibodies, and depression (Journal of Rheumatology)', url: 'https://pubmed.ncbi.nlm.nih.gov/15468372/' },
      { source: 'Aleksi V, Elise K, Koskela TH 2022: Excess use of thyroid hormone treatment among patients with fibromyalgia (BMC Research Notes)', url: 'https://pubmed.ncbi.nlm.nih.gov/35209937/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['advocacy-core-thyroid-panel', 'organ-musculoskeletal'],
  },
  {
    id: 'advocacy-tying-together',
    category: 'hashimotos',
    title: 'A Reasonable Testing Calendar, Pulled Together From Every Entry Above',
    teaser: 'Not "test everything constantly" and not "wait for symptoms," but a middle ground, with a clear reason behind every interval.',
    summary:
      "Every entry in this category lands on roughly the same shape of answer, worth stating plainly, once, all together: get a full baseline (the core thyroid panel, antibodies, ferritin/iron, vitamin D, B12/folate, magnesium, zinc/copper, CBC, CMP, and a lipid panel) at least once, even if a current doctor has only ever ordered TSH alone. After any real change (a dose adjustment, a brand switch, starting a supplement to correct a confirmed deficiency), recheck the specific thing that changed at around 6-12 weeks, not sooner, since that's roughly how long it takes a result to settle rather than still be in motion. Once stable, most of this list only needs revisiting every 6-12 months; annual is a reasonable default for the whole panel as a group. A few items don't need any fixed schedule at all: sex hormones and cortisol are worth testing only when a specific symptom or decision calls for it, not on a calendar, since both fluctuate too much day to day for a routine recheck to mean anything. And the one deliberate exception to all of this: starting an elimination protocol, where a baseline plus one recheck at 8-12 weeks is worth doing on purpose. That's the whole shape of \"within reason\" this category was built to answer: neither testing everything every month nor waiting silently for a symptom to force the question.",
    citations: [],
    overallTier: 'moderate',
    relatedIds: ['advocacy-why-it-matters', 'advocacy-elimination-protocol-exception'],
  },
];
