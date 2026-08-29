// A real, curated, per-condition "known concerns" registry -- 2026-08-14,
// the onboarding-review half of the "already-tested foods" feature. Mirrors
// lib/conditionStages.ts's own CONDITION_STAGING_MODELS registry shape
// rather than inventing a new pattern: a small, hand-curated list of real,
// named foods/food-groups per condition, each linked to a real, already-
// cited Digest entry rather than a new, unverified claim.
//
// Deliberately NOT a bulk scan of every flagged food in the reference
// database -- confirmed directly with the app's own creator, since a raw
// scan risks repeating the exact two performance incidents already found
// and fixed this same session in this neighborhood (the eager Safe Foods
// full-table scan; the Nutrient Ranking freeze). A curated list is small
// and bounded by construction.
//
// Real, honest scope: only Hashimoto's is seeded here, the condition with
// by far the deepest already-researched, already-cited material to draw
// from (and the app creator's own given example). Real, curated lists for
// the other 18 conditions are a genuine, separate research effort -- named
// here, not silently dropped, matching this whole project's own already-
// established "wire the mechanism now, defer full depth" pattern (the same
// choice already made once this session for general-health-guidance
// depth). Every screen reading this registry works identically for any
// condition the moment a real entry exists here -- adding one is a pure
// data change, no code change needed anywhere that reads it.
//
// A ConditionFoodConcern deliberately carries no reference-database
// foodId/source of its own -- several of these are real food GROUPS
// ("Raw Cruciferous Vegetables"), not one single row, and food_trials'
// own food_id/source columns are already nullable for exactly this
// free-text-only case (a trial can be "just a name," the original,
// still-fully-supported design).
export type ConditionFoodConcern = {
  id: string;
  label: string;
  shortNote: string;
  // Optional link to the real, already-cited Digest entry covering
  // this concern in full depth -- every id below was independently
  // confirmed to exist in the live lib/digest/*.ts source before being
  // written in here, not guessed.
  digestEntryId?: string;
};

export type ConditionFoodConcernModel = {
  conditionCode: string;
  concerns: ConditionFoodConcern[];
};

export const CONDITION_FOOD_CONCERNS: ConditionFoodConcernModel[] = [
  {
    conditionCode: 'hashimotos',
    concerns: [
      {
        id: 'hashimotos-gluten',
        label: 'Gluten',
        shortNote: 'A real gut-permeability mechanism (gliadin/zonulin) this app already covers in depth.',
        digestEntryId: 'problem-gluten-grains',
      },
      {
        id: 'hashimotos-soy',
        label: 'Soy',
        shortNote: 'A real, condition-specific risk in people with existing subclinical hypothyroidism.',
        digestEntryId: 'problem-soy',
      },
      {
        id: 'hashimotos-raw-cruciferous',
        label: 'Raw Cruciferous Vegetables',
        shortNote: 'Raw goitrogenic vegetables (broccoli, cauliflower, cabbage, kale) can interfere with iodine uptake -- cooking mostly resolves it.',
        digestEntryId: 'problem-raw-cruciferous',
      },
      {
        id: 'hashimotos-kelp-iodine',
        label: 'Kelp / High-Iodine Sea Vegetables',
        shortNote: 'Iodine overload from kelp or sea-vegetable supplements can trigger or worsen a real Hashimoto’s flare.',
        digestEntryId: 'problem-excess-iodine-kelp',
      },
      {
        id: 'hashimotos-dairy',
        label: 'Dairy',
        shortNote: 'A real, commonly-flagged elimination-diet trigger food for autoimmune thyroid conditions.',
        digestEntryId: 'problem-conventional-dairy',
      },
      {
        id: 'hashimotos-alcohol',
        label: 'Alcohol',
        shortNote: 'A genuinely two-sided real evidence picture -- moderate intake isn’t clearly harmful, heavier/frequent intake carries real, cited concerns.',
        digestEntryId: 'lifestyle-alcohol-advisory',
      },
      {
        id: 'hashimotos-coffee-timing',
        label: 'Coffee (with levothyroxine)',
        shortNote: 'A real, documented absorption-timing interaction with levothyroxine -- a timing concern, not a strict avoid.',
        digestEntryId: 'problem-coffee-timing',
      },
    ],
  },
  // Prostate Health, 2026-08-29. Direct request, after this registry's own
  // Hashimoto's-only scope was surfaced by someone tracking Prostate
  // Health finding nothing here: "Do Prostate Health's Already tested
  // foods next."
  //
  // Every entry below links to a Digest entry that already exists and
  // already carries its own verified citation, confirmed by reading each
  // one rather than assumed from the id looking plausible. Nothing new was
  // claimed here.
  //
  // 2026-08-29, same day, direct follow-up: "Finish the spicy foods by
  // finding the appropriate information that the app does allow, and the
  // same for tomatoes/lycopene and cruciferous vegetables."
  //
  // Spicy food: the first pass excluded it for having no trial-level
  // evidence, which was true of the claim as usually stated ("spicy food
  // worsens BPH"). Searching properly for what DOES exist found the right
  // evidence at the right level: a validated 176-item food-sensitivity
  // questionnaire in chronic prostatitis/chronic pelvic pain syndrome
  // where 47.4% of respondents reported real aggravation, led by spicy
  // food, coffee, hot peppers, alcohol, tea and chili. That is not a claim
  // spicy food causes disease; it is documented individual sensitivity,
  // which is precisely what this tolerance-testing feature is for. Written
  // up as its own new Digest entry rather than asserted here.
  //
  // Tomatoes and cruciferous vegetables belong here too, framed honestly
  // for what they are: foods worth eating MORE of, where the useful
  // question is whether you actually tolerate them, not whether to avoid
  // them. Marking one "already avoid" is genuinely informative, since it
  // flags a well-evidenced protective food currently missing.
  {
    conditionCode: 'prostate_health',
    concerns: [
      {
        id: 'prostate-caffeine',
        label: 'Caffeine',
        shortNote:
          'Acts on the same alpha-1-adrenergic receptors in bladder-neck and prostate muscle that BPH medications target, plus its own diuretic effect. A documented association, and one people often find varies a lot person to person.',
        digestEntryId: 'prostate-alpha-adrenergic-stress-cold-caffeine',
      },
      {
        id: 'prostate-alcohol',
        label: 'Alcohol',
        shortNote:
          'Named directly in the behavioral-therapy trial that measurably reduced night-time waking, alongside caffeine, as an evening intake worth cutting back.',
        digestEntryId: 'prostate-behavioral-nocturia-reduction',
      },
      {
        id: 'prostate-evening-fluids',
        label: 'Fluids late in the evening',
        shortNote:
          'Not a food to avoid, a timing question: shifting total fluid earlier in the day is part of the structured program that beat both drug therapy and placebo for nocturia.',
        digestEntryId: 'prostate-behavioral-nocturia-reduction',
      },
      {
        id: 'prostate-choline-rich-foods',
        label: 'Choline-rich foods (eggs, red meat, organ meat)',
        shortNote:
          'A 47,896-man, 22-year study found the highest choline intake tracked with a 70% higher risk of lethal prostate cancer, with gut bacteria doing the actual chemistry. A long-term pattern question rather than a daily reaction.',
        digestEntryId: 'prostate-choline-tmao',
      },
      {
        id: 'prostate-selenium-vitamin-e-supplements',
        label: 'Selenium and vitamin E supplements',
        shortNote:
          'The 35,000-man SELECT trial found selenium does not prevent prostate cancer here, and that vitamin E may raise risk. Worth knowing before taking either, even though selenium is well evidenced for other conditions.',
        digestEntryId: 'prostate-selenium-select-trial-correction',
      },
      {
        id: 'prostate-spicy-food',
        label: 'Hot peppers and chili (capsaicin)',
        shortNote:
          'The specific items the evidence actually names, scoring -0.44 and -0.38 on a -2 to +2 scale in a validated 176-item survey. Note it is capsaicin-containing peppers, not spices generally: cinnamon, turmeric, cumin and black pepper were all on that questionnaire and none were flagged.',
        digestEntryId: 'prostate-food-sensitivity-cpps',
      },
      {
        id: 'prostate-tea',
        label: 'Tea',
        shortNote:
          'Appears alongside coffee among the most-reported aggravators in that same survey, and carries its own caffeine. Worth separating from coffee, since people often tolerate one and not the other.',
        digestEntryId: 'prostate-food-sensitivity-cpps',
      },
      {
        id: 'prostate-tomatoes-lycopene',
        label: 'Tomatoes and cooked tomato products',
        shortNote:
          'A food to eat more of, not less: a 42-study, 692,000-participant meta-analysis found lycopene tracks with roughly 12% lower prostate cancer risk, and cooked tomato makes it far more absorbable. Marked here so you can flag it if you are avoiding tomatoes.',
        digestEntryId: 'prostate-lycopene-tomatoes',
      },
      {
        id: 'prostate-soothing-fluids',
        label: 'Water and herbal (non-caffeinated) teas',
        shortNote:
          "The same survey asked what helped, not just what hurt, and these scored among the most soothing. Worth knowing that ordinary tea and herbal tea landed on opposite ends of it.",
        digestEntryId: 'prostate-food-sensitivity-cpps',
      },
      {
        id: 'prostate-psyllium-fiber',
        label: 'Psyllium and bulking fiber',
        shortNote:
          "Also among the items that measurably eased symptoms in that survey, alongside water and herbal tea.",
        digestEntryId: 'prostate-food-sensitivity-cpps',
      },
      {
        id: 'prostate-cruciferous',
        label: 'Cruciferous vegetables (broccoli, cauliflower, cabbage)',
        shortNote:
          'Also a food to eat more of: the sulforaphane research here is real and well cited. Worth marking if you avoid them, whether for taste, digestion, or a different condition that flags them raw.',
        digestEntryId: 'prostate-cruciferous-sulforaphane',
      },
    ],
  },
  // The remaining 17 conditions, 2026-08-29. Direct request: "Do the rest
  // of the conditions next."
  //
  // Built the same way Hashimoto's and Prostate Health were: every entry
  // links to a Digest entry that already exists in this app and already
  // carries its own verified citation. Candidates were surfaced by
  // scanning the live lib/digest sources for food-related titles rather
  // than recalled, and every link is verified again after writing.
  //
  // Lists are deliberately short and uneven. Migraine and Type 2 Diabetes
  // get two entries each because that is what this app has genuinely
  // cited food research for; padding them to match gout's six would mean
  // inventing concerns. Protective foods (dairy for gout, coffee for
  // fatty liver, xylitol for Sjogren's) are included on purpose: marking
  // one "already avoid" is real information, since it flags a
  // well-evidenced food currently missing.
  {
    conditionCode: "cardiovascular_disease",
    concerns: [
      {
        id: "cvd-salt",
        label: "Salt and high-sodium foods",
        shortNote:
          "The DASH-sodium trial built a whole eating pattern around blood pressure specifically. How much your own pressure moves with salt varies a lot person to person.",
        digestEntryId: "cvd-dash-sodium",
      },
      {
        id: "cvd-potassium-salt-substitute",
        label: "Potassium salt substitutes",
        shortNote:
          "A 21,000-person trial found swapping ordinary salt for a potassium substitute cut stroke and death. Worth checking with a doctor first if your kidneys are affected.",
        digestEntryId: "cvd-potassium-salt-substitute-real-trial",
      },
      {
        id: "cvd-binge-alcohol",
        label: "Alcohol, especially in larger sittings",
        shortNote:
          "A named pattern, holiday heart syndrome, where binge drinking triggers atrial fibrillation in otherwise healthy people.",
        digestEntryId: "cvd-holiday-heart-alcohol-afib",
      },
      {
        id: "cvd-omega3-oily-fish",
        label: "Oily fish and omega-3",
        shortNote:
          "Lowers triglycerides measurably, with an honest caveat about how far that carries into hard outcomes. A food to eat more of rather than avoid.",
        digestEntryId: "cvd-triglycerides-omega3-real-data",
      },
    ],
  },
  {
    conditionCode: "celiac",
    concerns: [
      {
        id: "celiac-gluten",
        label: "Gluten",
        shortNote:
          "The one condition where diet is the entire treatment. Not really a tolerance question, but listed so the rest of this list has context.",
        digestEntryId: "celiac-overview",
      },
      {
        id: "celiac-cross-contamination-foods",
        label: "Shared kitchens and cross-contamination",
        shortNote:
          "The 20ppm standard, and what actually breaks it in a real kitchen. This is where most accidental exposure comes from, not obvious gluten.",
        digestEntryId: "celiac-cross-contamination",
      },
      {
        id: "celiac-oats",
        label: "Oats",
        shortNote:
          "A genuine open question rather than a settled yes or no: a real subgroup reacts to oats even when certified gluten-free.",
        digestEntryId: "celiac-oats-controversy",
      },
      {
        id: "celiac-commercial-gf-products",
        label: "Packaged gluten-free products",
        shortNote:
          "Not automatically healthier, and a legal gap means gluten-free flour is almost never fortified the way wheat flour must be.",
        digestEntryId: "celiac-gf-product-fortification-gap",
      },
      {
        id: "celiac-dairy-persistent-symptoms",
        label: "Dairy",
        shortNote:
          "Worth testing separately when symptoms persist on a strict gluten-free diet, where IBS-type overlap is common.",
        digestEntryId: "celiac-persistent-symptoms-ibs-overlap",
      },
    ],
  },
  {
    conditionCode: "chronic_kidney_disease",
    concerns: [
      {
        id: "ckd-phosphate-additives-food",
        label: "Phosphate additives in processed food",
        shortNote:
          "Additive phosphorus absorbs far more efficiently than the same mineral in whole food, which is what makes label-reading worth it here.",
        digestEntryId: "ckd-phosphate-additives",
      },
      {
        id: "ckd-sodium",
        label: "Salt and high-sodium foods",
        shortNote:
          "Sodium restriction lowers blood pressure more in CKD than it does without kidney disease.",
        digestEntryId: "ckd-sodium-restriction-real-trial-data",
      },
      {
        id: "ckd-protein-load",
        label: "High-protein meals",
        shortNote:
          "A specific range, with evidence favouring plant-forward protein. Note this reverses once dialysis starts.",
        digestEntryId: "ckd-protein-restriction-plant-based",
      },
      {
        id: "ckd-high-potassium-foods",
        label: "High-potassium foods",
        shortNote:
          "Blanket potassium restriction is an honest correction target: much common advice here goes further than the evidence supports.",
        digestEntryId: "ckd-potassium-restriction-reconsidered",
      },
      {
        id: "ckd-fiber",
        label: "Dietary fiber",
        shortNote:
          "A food to eat more of: measured evidence behind the gut-toxin mechanism this condition already turns on.",
        digestEntryId: "ckd-fiber-intake-inflammation",
      },
    ],
  },
  {
    conditionCode: "fatty_liver_disease",
    concerns: [
      {
        id: "masld-fructose-sweetened-drinks",
        label: "Fructose and sweetened drinks",
        shortNote:
          "The general high-fructose research applies here with extra force, since the liver is where fructose is actually processed.",
        digestEntryId: "masld-hfcs-fructose",
      },
      {
        id: "masld-alcohol",
        label: "Alcohol",
        shortNote:
          "A contested threshold question rather than a clean line, and one that gets dramatically worse alongside a common gene variant.",
        digestEntryId: "masld-metald-alcohol-threshold",
      },
      {
        id: "masld-coffee",
        label: "Coffee",
        shortNote:
          "Consistently protective across multiple independent studies. A food to keep rather than cut.",
        digestEntryId: "masld-coffee-protective",
      },
      {
        id: "masld-vitamin-e-supplement",
        label: "High-dose vitamin E supplements",
        shortNote:
          "A landmark trial found it improved liver damage in non-diabetic NASH specifically. Dose and context matter, so worth raising with a doctor.",
        digestEntryId: "masld-vitamin-e-pivens-trial",
      },
    ],
  },
  {
    conditionCode: "gout",
    concerns: [
      {
        id: "gout-meat-seafood",
        label: "Red meat and seafood",
        shortNote:
          "Measured risk increase. Vegetable purines, notably, do not move the needle the same way.",
        digestEntryId: "gout-purine-foods-and-dairy",
      },
      {
        id: "gout-sugary-drinks",
        label: "Sugar-sweetened drinks",
        shortNote:
          "A dose-dependent risk. Diet soda does not carry it, which points at the fructose rather than the sweetness.",
        digestEntryId: "gout-fructose-sugar-drinks",
      },
      {
        id: "gout-beer-spirits",
        label: "Beer and spirits",
        shortNote:
          "Risk differs sharply by type of alcohol rather than by alcohol as a whole.",
        digestEntryId: "gout-alcohol-beer-vs-wine",
      },
      {
        id: "gout-dairy-protective",
        label: "Dairy",
        shortNote:
          "Lowers measured risk. A food to eat more of here, unlike in several other conditions this app covers.",
        digestEntryId: "gout-purine-foods-and-dairy",
      },
      {
        id: "gout-cherries-protective",
        label: "Cherries",
        shortNote:
          "A specific, well-studied food with trial-backed risk reduction.",
        digestEntryId: "gout-cherries",
      },
      {
        id: "gout-coffee-protective",
        label: "Coffee",
        shortNote:
          "A strong, consistent inverse association, and evidence it is not the caffeine doing the work.",
        digestEntryId: "gout-coffee-inverse",
      },
    ],
  },
  {
    conditionCode: "graves",
    concerns: [
      {
        id: "graves-iodine-rich-foods",
        label: "Iodine-rich foods and supplements (kelp, seaweed)",
        shortNote:
          "A real trigger here, and a complication for treatment. Directionally the opposite of what people often assume from general thyroid advice.",
        digestEntryId: "graves-iodine",
      },
      {
        id: "graves-iodine-before-rai",
        label: "Iodine before radioactive iodine treatment",
        shortNote:
          "A genuine timing question where diet actually matters before the procedure, not a permanent avoid.",
        digestEntryId: "graves-radioactive-iodine-timing",
      },
      {
        id: "graves-vitamin-d",
        label: "Vitamin D",
        shortNote:
          "A real association with mixed evidence on what to do about it, worth knowing before supplementing.",
        digestEntryId: "graves-vitamin-d-deficiency-risk",
      },
    ],
  },
  {
    conditionCode: "ibd",
    concerns: [
      {
        id: "ibd-fiber-during-flare",
        label: "Fiber during a flare",
        shortNote:
          "The standard low-fiber-during-a-flare advice has surprisingly thin evidence behind it, which makes this genuinely worth testing yourself.",
        digestEntryId: "ibd-fiber-flare-myth",
      },
      {
        id: "ibd-exclusion-diet-foods",
        label: "Foods excluded by the Crohn disease exclusion diet",
        shortNote:
          "A structured whole-food approach with real trial evidence alongside exclusive enteral nutrition.",
        digestEntryId: "ibd-crohns-disease-exclusion-diet",
      },
      {
        id: "ibd-iron-supplements",
        label: "Iron supplements",
        shortNote:
          "Iron deficiency anemia is the most common complication here, and oral iron is often poorly tolerated in an inflamed gut.",
        digestEntryId: "ibd-iron-deficiency-anemia",
      },
      {
        id: "ibd-vitamin-d",
        label: "Vitamin D",
        shortNote:
          "Deficiency is common and tracks directly with how active the disease actually is.",
        digestEntryId: "ibd-vitamin-d-deficiency-severity",
      },
    ],
  },
  {
    conditionCode: "ibs",
    concerns: [
      {
        id: "ibs-fodmaps",
        label: "High-FODMAP foods",
        shortNote:
          "The single best-evidenced dietary intervention for IBS, and explicitly meant to be tested then reintroduced, not followed forever.",
        digestEntryId: "ibs-low-fodmap-diet",
      },
      {
        id: "ibs-coffee",
        label: "Coffee",
        shortNote:
          "A documented trigger beyond FODMAPs, worth testing on its own.",
        digestEntryId: "ibs-non-fodmap-triggers",
      },
      {
        id: "ibs-alcohol",
        label: "Alcohol",
        shortNote:
          "Also documented as a trigger independent of FODMAP content.",
        digestEntryId: "ibs-non-fodmap-triggers",
      },
      {
        id: "ibs-artificial-sweeteners",
        label: "Artificial sweeteners",
        shortNote:
          "The third of the well-documented non-FODMAP triggers.",
        digestEntryId: "ibs-non-fodmap-triggers",
      },
      {
        id: "ibs-peppermint-oil",
        label: "Peppermint oil",
        shortNote:
          "Meta-analysis-backed, with an honest caveat. Something to try rather than avoid.",
        digestEntryId: "ibs-peppermint-oil",
      },
    ],
  },
  {
    conditionCode: "lupus",
    concerns: [
      {
        id: "lupus-alfalfa",
        label: "Alfalfa sprouts",
        shortNote:
          "A well-documented food that can trigger a lupus-like flare, through a specific amino acid it contains.",
        digestEntryId: "lupus-alfalfa-canavanine",
      },
      {
        id: "lupus-immune-herbs",
        label: "Echinacea and immune-boosting herbal supplements",
        shortNote:
          "A real caution: stimulating an already overactive immune system is the opposite of what is wanted here.",
        digestEntryId: "lupus-immune-stimulating-herbs",
      },
      {
        id: "lupus-omega3",
        label: "Omega-3 and fish oil",
        shortNote:
          "A meta-analysis finding benefit, alongside a different kind of study finding a complication. Worth knowing both halves.",
        digestEntryId: "lupus-omega3-fish-oil",
      },
      {
        id: "lupus-mediterranean-foods",
        label: "Mediterranean-pattern foods",
        shortNote:
          "A 280-patient study found this eating pattern tracks directly with lower disease activity.",
        digestEntryId: "lupus-mediterranean-diet-real-data",
      },
    ],
  },
  {
    conditionCode: "migraine",
    concerns: [
      {
        id: "migraine-food-triggers",
        label: "Commonly named trigger foods",
        shortNote:
          "An honestly complicated picture rather than a clean list, which is exactly why testing your own beats following a general one.",
        digestEntryId: "migraine-food-triggers-honest-nuance",
      },
      {
        id: "migraine-caffeine",
        label: "Caffeine",
        shortNote:
          "A double agent: it treats attacks and it causes them, depending on dose and consistency.",
        digestEntryId: "migraine-caffeine-dual-role",
      },
    ],
  },
  {
    conditionCode: "multiple_sclerosis",
    concerns: [
      {
        id: "ms-saturated-fat",
        label: "Saturated fat",
        shortNote:
          "The Swank diet is a decades-long natural experiment in exactly this, worth understanding for what it does and does not show.",
        digestEntryId: "ms-swank-diet-history",
      },
      {
        id: "ms-sodium",
        label: "Salt and high-sodium foods",
        shortNote:
          "A real mechanism and a contested human finding. Named honestly as unsettled rather than presented as established.",
        digestEntryId: "ms-sodium-th17-contested",
      },
      {
        id: "ms-vitamin-d",
        label: "Vitamin D",
        shortNote:
          "A large, negative trial sits against a strong background association, worth knowing before supplementing heavily.",
        digestEntryId: "ms-vitamin-d-mixed-evidence",
      },
      {
        id: "ms-b12",
        label: "Vitamin B12",
        shortNote:
          "Deficiency can mimic MS outright, making it an important thing to have actually ruled out.",
        digestEntryId: "ms-b12-deficiency-mimic",
      },
    ],
  },
  {
    conditionCode: "pcos",
    concerns: [
      {
        id: "pcos-dairy",
        label: "Dairy",
        shortNote:
          "Singled out here through a specific hormonal pathway rather than as a general diet trend.",
        digestEntryId: "pcos-dairy-igf1-hyperandrogenism",
      },
      {
        id: "pcos-spearmint-tea",
        label: "Spearmint tea",
        shortNote:
          "A randomized trial found a real anti-androgen effect. Something to try rather than avoid.",
        digestEntryId: "pcos-spearmint-tea",
      },
      {
        id: "pcos-vitamin-d",
        label: "Vitamin D",
        shortNote:
          "A striking majority run deficient, tracking with worse insulin resistance.",
        digestEntryId: "pcos-vitamin-d-deficiency-real-data",
      },
    ],
  },
  {
    conditionCode: "psoriasis",
    concerns: [
      {
        id: "psoriasis-alcohol",
        label: "Alcohol",
        shortNote:
          "An association that splits by sex, and a hard avoid if you are on acitretin, for years rather than days.",
        digestEntryId: "psoriasis-acitretin-alcohol",
      },
      {
        id: "psoriasis-gluten",
        label: "Gluten",
        shortNote:
          "There is a real gluten-responder subgroup here, traceable down to skin biology. Whether you are in it is an individual question.",
        digestEntryId: "psoriasis-gluten-mechanism",
      },
      {
        id: "psoriasis-nightshades",
        label: "Nightshades (tomato, potato, pepper, aubergine)",
        shortNote:
          "A pattern for some people, not a proven trigger for everyone, which makes it a genuine candidate for personal testing.",
        digestEntryId: "psoriasis-nightshades",
      },
      {
        id: "psoriasis-omega3",
        label: "Omega-3 and fish oil",
        shortNote:
          "Helps rheumatoid arthritis more reliably than it helps psoriasis. Reported at that honest strength.",
        digestEntryId: "psoriasis-omega3-mixed",
      },
    ],
  },
  {
    conditionCode: "rheumatoid_arthritis",
    concerns: [
      {
        id: "ra-omega3-foods",
        label: "Omega-3 and oily fish",
        shortNote:
          "The single best-evidenced food lever for RA, at a specific dose threshold.",
        digestEntryId: "ra-omega3",
      },
      {
        id: "ra-alcohol-methotrexate",
        label: "Alcohol, while on methotrexate",
        shortNote:
          "A real threshold rather than the blanket folk warning, and more forgiving than most people are told.",
        digestEntryId: "ra-alcohol-methotrexate",
      },
      {
        id: "ra-folate",
        label: "Folate intake",
        shortNote:
          "Methotrexate is an antifolate, so steady folate intake matters rather than being optional.",
        digestEntryId: "ra-methotrexate-folate",
      },
      {
        id: "ra-raw-high-risk-foods",
        label: "Raw and unpasteurised foods",
        shortNote:
          "On methotrexate plus a biologic, ordinary food-safety stakes are genuinely higher.",
        digestEntryId: "ra-biologics-infection-risk",
      },
    ],
  },
  {
    conditionCode: "sjogrens",
    concerns: [
      {
        id: "sjogrens-alcohol-caffeine",
        label: "Alcohol and caffeine",
        shortNote:
          "A direct, immediate drying effect rather than a long-term risk question.",
        digestEntryId: "sjogrens-alcohol-caffeine-dehydration",
      },
      {
        id: "sjogrens-sugar",
        label: "Sugary foods and drinks",
        shortNote:
          "Dry mouth already raises the risk of oral yeast infection and decay, which sugar compounds.",
        digestEntryId: "sjogrens-oral-candidiasis-risk",
      },
      {
        id: "sjogrens-xylitol",
        label: "Xylitol gum and sweets",
        shortNote:
          "A two-way fix for dry mouth, not just a sugar substitute. Something to add rather than avoid.",
        digestEntryId: "sjogrens-xylitol-saliva-stimulation",
      },
      {
        id: "sjogrens-omega3",
        label: "Omega-3 and fish oil",
        shortNote:
          "Recent trial evidence for dry eyes and dry mouth at once.",
        digestEntryId: "sjogrens-omega3-dry-eye-mouth",
      },
    ],
  },
  {
    conditionCode: "type_1_diabetes",
    concerns: [
      {
        id: "type1-high-carb-meals",
        label: "Hard-to-count carbohydrate meals",
        shortNote:
          "Carb counting accuracy is the single biggest everyday food lever here, and some meals are simply harder to estimate than others.",
        digestEntryId: "type1-carb-counting-accuracy",
      },
      {
        id: "type1-alcohol",
        label: "Alcohol",
        shortNote:
          "Can cause a blood-sugar crash up to 12 hours later, which is what makes it worth its own attention rather than general moderation advice.",
        digestEntryId: "type1-alcohol-nocturnal-hypoglycemia",
      },
      {
        id: "type1-gluten",
        label: "Gluten",
        shortNote:
          "An honestly mixed track record for T1D itself, separate from celiac disease, which genuinely does co-occur here.",
        digestEntryId: "type1-gluten-free-mixed-evidence",
      },
      {
        id: "type1-magnesium",
        label: "Magnesium",
        shortNote:
          "Runs low in T1D, and the timing suggests more than a simple diet gap.",
        digestEntryId: "type1-magnesium-glycemic-control",
      },
    ],
  },
  {
    conditionCode: "type_2_diabetes",
    concerns: [
      {
        id: "type2-high-carb-foods",
        label: "Higher-carbohydrate foods",
        shortNote:
          "Strong short-term evidence for cutting them, with an honest caveat about what remission actually means.",
        digestEntryId: "type2-low-carb-diet-evidence",
      },
      {
        id: "type2-late-eating",
        label: "Eating late in the day",
        shortNote:
          "A meta-analysis found a shorter eating window improves blood sugar, distinct from cutting carbohydrate.",
        digestEntryId: "type2-time-restricted-eating",
      },
    ],
  },
];

export function getConditionFoodConcerns(conditionCode: string): ConditionFoodConcern[] | null {
  return CONDITION_FOOD_CONCERNS.find((model) => model.conditionCode === conditionCode)?.concerns ?? null;
}
