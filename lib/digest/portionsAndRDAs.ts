import type { DigestEntry } from './types';

// Portions, Serving Sizes & Recommended (and Minimum) Daily Amounts -- new
// 2026-08-09, direct request: "information about portions, and recommended
// daily allowances and minimum amounts of anything." A real, condition-
// agnostic Basic Health topic, deliberately built to reuse rather than
// re-derive numbers: every RDA/AI/UL figure below is pulled directly from
// scripts/build_food_reference_db.py's own DIETARY_REFERENCE_INTAKES
// table, the exact same NASEM/NIH ODS data this app already loads into the
// bundled reference database and already shows as a percentage in Insights.
// Writing new, separately-sourced numbers here would risk this Digest
// disagreeing with what the app itself displays a page away -- reusing the
// same table guarantees they can't drift apart.
export const PORTIONS_AND_RDAS_ENTRIES: DigestEntry[] = [
  {
    id: 'portion-overview',
    category: 'basicHealth',
    title: 'Portion, Serving, and Amount Are Three Different Ideas, Not One',
    teaser: 'A "serving size" on a label, the portion actually on the plate, and the RDA a body needs are three separate numbers that rarely match.',
    summary: 'A nutrition label\'s "serving size" is a standardized measurement unit, not a recommendation. A "portion" is however much of a food a person actually eats in one sitting, which regularly runs two, three, or more servings for foods like pasta, cereal, or a restaurant entree. The Recommended Dietary Allowance (RDA) is a third, unrelated number: the daily total of a specific nutrient, from every food and drink combined across a whole day, that meets the needs of nearly everyone in a healthy population. Conflating these three has a measurable cost: someone can eat a "single serving" of something and still be nowhere near a day\'s worth of a given nutrient, or eat a modest-looking portion of a calorie-dense food and blow past a daily target in one sitting. The nutrient tracking (see Insights) works from the actual amount logged, converted against the RDA/AI tables below, specifically so this distinction stops being something a person has to do the math on themselves.',
    citations: [
      {
        source: 'National Academies of Sciences, Engineering, and Medicine (NASEM) Dietary Reference Intakes, as summarized by NIH Office of Dietary Supplements (ODS)',
        url: 'https://ods.od.nih.gov/HealthInformation/nutrientrecommendations.aspx',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['portion-rda-ai-ul-explained', 'portion-app-tracks-real-amounts', 'portion-calorie-needs-tdee'],
  },
  {
    id: 'portion-rda-ai-ul-explained',
    category: 'basicHealth',
    title: 'RDA, AI, and UL Aren\'t the Same Kind of Number',
    teaser: 'A Recommended Dietary Allowance, an Adequate Intake, and a Tolerable Upper Limit each answer a different question.',
    summary: 'The Recommended Dietary Allowance (RDA) is set high on purpose: NASEM builds it from the Estimated Average Requirement (the amount that covers half of a healthy population) plus a statistical safety margin, so the RDA itself covers roughly 97 to 98 percent of healthy people, not just the average person. When the underlying research isn\'t solid enough to calculate that full statistical picture, NASEM sets an Adequate Intake (AI) instead, a reasonable, evidence-based estimate rather than a formally derived allowance, fiber, potassium, and choline are all AI-based in the reference tables, not RDA. A Tolerable Upper Limit (UL) is a third, separate number: the highest daily amount unlikely to cause harm in almost anyone, not a target to aim for. Several ULs in the data apply only to concentrated supplement or fortified-food sources, not the same nutrient occurring naturally in whole food (vitamin E and magnesium both work this way), so a UL does not rule out eating a nutrient-rich food freely.',
    citations: [
      {
        source: 'NASEM 2005 DRI Macronutrients report, as summarized by NIH Office of Dietary Supplements (ODS)',
        url: 'https://ods.od.nih.gov/HealthInformation/nutrientrecommendations.aspx',
      },
    ],
    overallTier: 'strong',
    stageNote: 'Read this once, then the DRI-percentage display in Insights is the practical version of this same math.',
    relatedIds: ['portion-overview', 'glossary-tsh'],
  },
  {
    id: 'portion-protein-real-need',
    category: 'basicHealth',
    title: 'The Protein RDA Is Lower Than Most Popular Advice Suggests',
    teaser: 'The official RDA is 0.8 grams per kilogram of body weight, meaningfully less than the "high protein" targets common in fitness culture.',
    summary: 'NASEM\'s protein RDA works out to 56 grams a day for a reference 70-kilogram (about 154-pound) man, and 46 grams a day for a reference 57-kilogram (about 126-pound) woman, both based on the same 0.8 grams per kilogram of body weight formula, need scales with a person\'s own actual weight, not a flat number. This is the amount that prevents deficiency in nearly everyone, not necessarily the amount that optimizes muscle preservation, satiety, or athletic performance, and NASEM\'s guidance notes some research suggests older adults may benefit from higher intake, roughly 1.0 to 1.2 grams per kilogram, to help preserve muscle mass, a named exception to the general RDA rather than a reason to distrust it. The Essential Nutrients research goes deeper on both supported benefits and one toxicity risk (see the Protein & Amino Acids topic), this entry is the plain "how much" answer underneath that fuller picture.',
    citations: [
      {
        source: 'NASEM 2005 DRI Macronutrients report',
        url: 'https://ods.od.nih.gov/HealthInformation/nutrientrecommendations.aspx',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['portion-minimums-vs-optimal', 'portion-personalized-macro-targets'],
  },
  {
    id: 'portion-fiber-real-need',
    category: 'basicHealth',
    title: 'Fiber Has an Adequate Intake, Not a Formally Derived RDA, and Almost Everyone Falls Short of It',
    teaser: 'The target is 38 grams a day for younger men and 25 for younger women, and the research already found most Americans land well under half that.',
    summary: 'Fiber\'s daily target is set as an Adequate Intake (AI), not a full RDA, because NASEM concluded the evidence wasn\'t sufficient to calculate the formal statistical requirement the RDA method needs, 38 grams a day for men age 19 to 50, dropping to 30 grams past 50, and 25 grams a day for women 19 to 50, dropping to 21 grams past 50, tracking the general decline in calorie intake with age that fiber need is calculated against. The already-cited research found intake running well below this line for most people (see the Carbohydrates & Fiber entry in Essential Nutrients): the gap between the target and what a typical plate actually delivers is one of the largest of any nutrient in this whole table.',
    citations: [
      {
        source: 'NASEM 2005 DRI Macronutrients report',
        url: 'https://ods.od.nih.gov/HealthInformation/nutrientrecommendations.aspx',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['portion-rda-ai-ul-explained'],
  },
  {
    id: 'portion-sodium-ceiling',
    category: 'basicHealth',
    title: 'Sodium Is the One Nutrient in This Whole Table With a Ceiling, Not a Floor',
    teaser: 'There is no established minimum sodium requirement for a healthy adult, the 2,300 mg figure is a recommended maximum, not a target to reach.',
    summary: 'Every other nutrient in the reference tables is expressed as a minimum a person should reach. Sodium is the one exception: NASEM\'s 2,300 milligram-a-day figure is a Chronic Disease Risk Reduction intake, a recommended ceiling tied to blood pressure and cardiovascular risk, not a deficiency floor, there is no established RDA or AI for sodium in the general healthy adult population, because ordinary diets essentially never fall short of it. Confusing this with an RDA-style "hit this number" target gets the whole nutrient backwards. This distinction matters directly for reading the DRI-percentage display in Insights: for sodium specifically, a lower percentage is the good outcome, not a shortfall to correct.',
    citations: [
      {
        source: 'NASEM 2019 DRI Sodium/Potassium report',
        url: 'https://ods.od.nih.gov/HealthInformation/nutrientrecommendations.aspx',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['portion-rda-ai-ul-explained'],
  },
  {
    id: 'portion-minimums-vs-optimal',
    category: 'basicHealth',
    title: 'The RDA Already Has a Safety Margin Built In, It Isn\'t the Bare Minimum',
    teaser: 'By design, the RDA covers roughly 97 to 98 percent of healthy people, meaning the physiological minimum for most individuals sits below it, not at it.',
    summary: 'A common misreading of the RDA is treating it as the exact floor below which deficiency begins for everyone. It isn\'t, NASEM builds the RDA from the Estimated Average Requirement (the amount covering half a healthy population) plus roughly two standard deviations of statistical margin, specifically so the RDA itself already sits safely above what most individuals actually need. Someone eating consistently below their personal RDA for a given nutrient isn\'t automatically deficient; someone eating consistently below the much lower Estimated Average Requirement almost certainly is. This matters for how to read a single low day in the nutrient tracking: one day under target is a data point, not a diagnosis, the actionable signal is a sustained pattern over weeks, not a single logged meal falling short.',
    citations: [
      {
        source: 'NASEM 2005 DRI Macronutrients report, DRI methodology (EAR, RDA, AI, UL definitions)',
        url: 'https://ods.od.nih.gov/HealthInformation/nutrientrecommendations.aspx',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['portion-rda-ai-ul-explained', 'portion-protein-real-need'],
  },
  {
    id: 'portion-larger-portions-larger-intake',
    category: 'basicHealth',
    title: 'A Bigger Plate Changes How Much a Person Eats, Not Just How Much Looks Left Over',
    teaser: 'A large systematic review found people consistently eat more from larger portions, packages, and tableware, without reliably noticing it happening.',
    summary: 'A Cochrane systematic review pooling 61 studies and 6,711 participants found people consistently consume more food and drink when offered it in larger portions, packages, or on larger tableware than when offered smaller versions of the exact same food, an effect that held up regardless of sex, body mass index, hunger level, or how deliberately someone tries to control their eating. The review\'s modeling found that sustained exposure to smaller sizes across a whole diet could plausibly reduce average daily energy intake by roughly 12 to 16 percent in UK adults and 22 to 29 percent in US adults, entirely from portion and package size alone, with no other change. This is a practical lever independent of what food is actually being eaten: the same honest, home-cooked meal built in the Food-tab builders can still deliver very different totals depending on how much of it ends up on the plate in one sitting, which is exactly why every builder tracks a serving size and lets a "your share" fraction be logged, rather than assuming a whole prepared batch equals one serving.',
    citations: [
      {
        source: 'Hollands et al. 2015 Cochrane systematic review, 61 studies, 6,711 participants',
        url: 'https://pubmed.ncbi.nlm.nih.gov/26368271/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['portion-app-tracks-real-amounts'],
  },
  {
    id: 'portion-app-tracks-real-amounts',
    category: 'basicHealth',
    title: 'This App Already Does the Portion Math, The Point of Naming It Here Is Reading the Result Correctly',
    teaser: 'Every amount logged is already converted against the RDA/AI/UL tables above, knowing what those numbers actually mean is what makes the percentage in Insights worth trusting.',
    summary: 'Every food logged through the builders carries a specific quantity, not a generic "one serving" assumption, and Insights converts that amount against the exact NASEM/NIH ODS reference tables cited throughout this topic to show a percentage of daily need, not a guess. The value of this topic isn\'t new math this app doesn\'t already do, it\'s reading the resulting percentage correctly: knowing that most nutrients here are floors (aim to reach or exceed), that sodium is a ceiling (aim to stay under), that a single day under an RDA isn\'t automatically a deficiency, and that the RDA itself already carries a safety margin above the bare physiological minimum. A person who understands what these numbers actually represent gets meaningfully more out of the same percentage this app was already showing them.',
    citations: [
      {
        source: 'NASEM Dietary Reference Intakes, as summarized by NIH Office of Dietary Supplements (ODS)',
        url: 'https://ods.od.nih.gov/HealthInformation/nutrientrecommendations.aspx',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['portion-overview', 'portion-minimums-vs-optimal'],
  },
  {
    id: 'portion-calorie-needs-tdee',
    category: 'basicHealth',
    title: 'How Many Calories a Body Actually Needs Has a Real Formula Behind It',
    teaser: 'Resting energy needs (BMR) plus an activity-level multiplier produce Total Daily Energy Expenditure, the maintenance-calorie number this app\'s Energy & Portions lens is built around.',
    summary: 'The Mifflin-St Jeor equation estimates Basal Metabolic Rate, the calories a body burns at complete rest, from weight, height, age, and sex, a formula published in 1990 and still the default most clinical dietitians reach for over the older Harris-Benedict equation. Resting energy alone isn\'t the full picture, an inactive day and a physically demanding one burn very different totals from the same resting baseline, so BMR gets multiplied by a Physical Activity Level factor (Sedentary at 1.2 up to Extra Active at 1.9, following the same activity-level framework FAO/WHO/UNU published in 2001) to reach Total Daily Energy Expenditure, the number this app\'s Energy & Portions lens (see Insights) computes live from a person\'s own weight, height, age, sex, and Activity Level setting in Profile. This is a different kind of number from the RDA/AI tables in the rest of this topic: those are fixed population reference values pulled straight from NASEM\'s tables, while TDEE recomputes as a person\'s own real weight or activity level changes. TDEE by itself is a maintenance estimate, the calorie total that keeps current weight roughly steady, not a weight-loss or weight-gain target, this app deliberately doesn\'t build a calorie deficit or surplus on top of it yet, given real research already covered elsewhere in this app around aggressive restriction and thyroid/HPA-axis stress in an autoimmune population.',
    citations: [
      {
        source: 'Mifflin MD, St Jeor ST, et al. 1990, American Journal of Clinical Nutrition, "A new predictive equation for resting energy expenditure in healthy individuals"',
        url: 'https://pubmed.ncbi.nlm.nih.gov/2305711/',
      },
      {
        source: 'FAO/WHO/UNU, "Human Energy Requirements," Report of a Joint Expert Consultation, Rome, 2001',
        url: 'https://www.fao.org/4/y5686e/y5686e.pdf',
      },
    ],
    overallTier: 'strong',
    stageNote: 'Set sex, birth date, height, weight, and Activity Level in Profile to see your own real numbers in Insights\' Energy & Portions lens.',
    relatedIds: ['portion-overview', 'portion-personalized-macro-targets'],
  },
  {
    id: 'portion-personalized-macro-targets',
    category: 'basicHealth',
    title: 'Protein Scales With Real Body Weight, Fat and Carbohydrate Split the Rest',
    teaser: 'This app\'s macro targets set protein from actual weight and activity level, then divide whatever calories are left between fat and carbohydrate using NASEM\'s recommended range.',
    summary: 'Protein need scales with a person\'s own real body weight, not a flat percentage of calories, so this app\'s Energy & Portions lens starts there: 0.8 grams per kilogram at Sedentary (the same population RDA already covered in the Protein RDA entry above), rising toward 1.0 to 1.2 grams per kilogram at Lightly to Moderately Active (the same range a position paper from the PROT-AGE Study Group found useful for preserving muscle mass), up to 1.6 grams per kilogram at Very or Extra Active (within the 1.4 to 2.0 gram range the International Society of Sports Nutrition\'s position stand names for regularly exercising adults). Whatever calories remain once that real protein target is subtracted split between fat and carbohydrate using the midpoint of NASEM\'s Acceptable Macronutrient Distribution Range (fat 20 to 35 percent of calories, carbohydrate 45 to 65 percent), the same 2002/2005 DRI report already cited for fiber\'s AI figures elsewhere in this topic. A produce guide rides alongside these targets too, USDA MyPlate\'s published cup-equivalent amounts (2 cups fruit, 2.5 cups vegetables at the 2,000-calorie reference level) scaled to a person\'s own real calorie need rather than derived from a calorie percentage, which doesn\'t hold up for foods this calorie-sparse and variable. Where a tracked condition already has real, published staging with a documented protein number attached, that number takes over from the activity-based default instead, currently just Chronic Kidney Disease\'s pre-dialysis-versus-dialysis reversal (see that category in Digest), reused here rather than re-derived.',
    citations: [
      {
        source: 'Bauer J, et al. 2013, Journal of the American Medical Directors Association, "Evidence-based recommendations for optimal dietary protein intake in older people: a position paper from the PROT-AGE Study Group"',
        url: 'https://pubmed.ncbi.nlm.nih.gov/23867520/',
      },
      {
        source: 'Jäger R, et al. 2017, Journal of the International Society of Sports Nutrition, "International Society of Sports Nutrition Position Stand: protein and exercise"',
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5477153/',
      },
      {
        source: 'NASEM 2002/2005 DRI Macronutrients report, Acceptable Macronutrient Distribution Range (AMDR)',
        url: 'https://ods.od.nih.gov/HealthInformation/nutrientrecommendations.aspx',
      },
      {
        source: 'USDA MyPlate Plan, official cup-equivalent food group amounts by calorie level',
        url: 'https://www.myplate.gov/myplate-plan',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['portion-calorie-needs-tdee', 'portion-protein-real-need'],
  },
];
