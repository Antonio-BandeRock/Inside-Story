import type { DigestEntry } from './types';

// Lifestyle & Environment -- 17 entries. Folds in the app's own already-
// shipped alcohol/coffee/juice advisories (lib/alcoholAdvisory.ts,
// coffeeAdvisory.ts, juiceAdvisory.ts) as real digest content rather than
// leaving them only reachable as small in-builder tap-to-read rows, plus
// the broader environmental-exposure and daily-habit research those
// advisories were built alongside.
export const LIFESTYLE_ENVIRONMENT_ENTRIES: DigestEntry[] = [
  {
    id: 'lifestyle-alcohol-advisory',
    category: 'lifestyleEnvironment',
    title: 'Alcohol: A Genuinely Two-Sided Case',
    teaser: 'Not simply "worse for Hashimoto\'s" -- two real population studies found the opposite at moderate intake.',
    summary:
      'Two real peer-reviewed studies (a Danish population-based case-control study and a prospective Amsterdam autoimmune-thyroid-disease cohort) found moderate alcohol consumption is NOT linked to new thyroid-antibody development and tracks with LOWER risk of progressing to overt autoimmune hypothyroidism -- mirroring alcohol\'s documented protective association with other autoimmune diseases. The real, dose-dependent concerns concentrate specifically at heavier/more frequent drinking: the liver\'s ~80% share of T4-to-T3 conversion competing with alcohol\'s own hepatic processing load, a small preliminary study linking chronic heavy drinking to gut permeability/inflammatory thyroid-axis effects, and alcohol\'s well-documented effect on HPA-axis/cortisol regulation.',
    citations: [
      { source: 'Carle et al. 2013, European Journal of Endocrinology' },
      { source: 'Effraimidis et al., European Thyroid Journal' },
    ],
    overallTier: 'moderate',
    relatedIds: ['lifestyle-chronic-stress-hpa'],
  },
  {
    id: 'lifestyle-coffee-milk-antioxidants',
    category: 'lifestyleEnvironment',
    title: 'Coffee + Milk: A Genuinely Mixed Finding, Not the One-Sided Claim It\'s Often Presented As',
    teaser: 'The "milk cuts coffee\'s antioxidants by 50%" claim didn\'t hold up under a closer look.',
    summary:
      'A commonly repeated claim -- that milk cuts coffee\'s antioxidant absorption by half or more -- turned out to be genuinely mixed evidence when checked directly: some studies show roughly 28-40% less free chlorogenic acid because it binds to milk casein, but other studies show the resulting protein-polyphenol complex measuring HIGHER antioxidant activity than the free compound alone. Presented honestly as an open, two-sided question rather than the one-sided claim it\'s usually stated as.',
    citations: [{ source: 'Chlorogenic acid/milk casein binding studies, antioxidant activity comparisons' }],
    overallTier: 'weak',
  },
  {
    id: 'lifestyle-coffee-filtered-cholesterol',
    category: 'lifestyleEnvironment',
    title: 'Filtered vs. Unfiltered Coffee & Cholesterol',
    teaser: 'A real, well-established difference most people never think to ask about.',
    summary:
      'Unfiltered coffee (French press, Turkish, boiled/Scandinavian-style) retains cafestol and kahweol, two diterpene compounds that a real, consistent body of evidence (including AHA-cited trials) links to raised LDL cholesterol -- paper filters trap nearly all of both compounds, meaning drip and pour-over coffee are essentially free of this specific effect. A concrete, checkable brewing-method difference rather than a vague "coffee is fine in moderation" answer.',
    citations: [{ source: 'Cafestol/kahweol LDL cholesterol studies, AHA-cited trials' }],
    overallTier: 'strong',
  },
  {
    id: 'lifestyle-coffee-arabica-robusta',
    category: 'lifestyleEnvironment',
    title: 'Arabica vs. Robusta: A Real Caffeine Difference',
    teaser: 'Two coffee species with a genuinely different caffeine content -- confirmed, not folklore.',
    summary:
      'Robusta beans genuinely contain roughly double the caffeine of Arabica beans, a real, consistent food-science finding rather than a roast-level myth -- worth knowing for anyone tracking caffeine intake specifically (see Labs & Medication Timing for the levothyroxine-spacing reason that matters), since bean species, not roast darkness, is the bigger real driver of a given cup\'s caffeine content.',
    citations: [{ source: 'Arabica/Robusta caffeine content comparison, food science literature' }],
    overallTier: 'strong',
  },
  {
    id: 'lifestyle-juice-advisory',
    category: 'lifestyleEnvironment',
    title: 'Straight Fruit Juice: A Real, Carefully-Qualified Chain of Concerns',
    teaser: 'Population-level risk is real; the "guaranteed acute blood sugar spike" version of this claim is not.',
    summary:
      'Three large prospective cohorts found daily juice intake tracks with up to 21% higher type 2 diabetes risk while whole fruit tracks with lower risk -- but a 2025 randomized crossover trial in adults with type 2 diabetes found no real difference in glucose/insulin response between orange juice and whole orange pieces at matched sugar content eaten with a meal, meaning portion size (juice makes it easier to drink more sugar at once) is likely the more consistent real driver than a fundamentally different absorption curve every time. The proposed juice-to-cortisol-to-thyroid-conversion chain is mechanistically plausible (a glucose crash after a spike triggers cortisol, and cortisol suppresses T4-to-T3 conversion enzymes) but hasn\'t been directly tested as one continuous chain -- presented as plausible, not proven.',
    citations: [
      { source: 'Muraki et al. 2013, BMJ (3-cohort juice/whole fruit study)' },
      { source: '2025 randomized crossover trial, juice vs. whole fruit, type 2 diabetes' },
    ],
    overallTier: 'moderate',
    relatedIds: ['problem-sugar-sweetened-beverages'],
  },
  {
    id: 'lifestyle-edc-bpa-phthalates',
    category: 'lifestyleEnvironment',
    title: 'Endocrine Disruptors: BPA & Phthalates',
    teaser: 'Chemicals specifically named for disrupting hormone systems -- with real, if still-developing, thyroid-specific data.',
    summary:
      'BPA (found in some plastics and can linings) and phthalates (found in many plastics and fragranced products) are both documented endocrine disruptors with real research linking exposure to altered thyroid hormone levels, largely through interference with thyroid hormone receptor binding and transport proteins. Most of the strongest human data comes from occupational/high-exposure studies rather than typical consumer-level exposure, which is the real, honest caveat -- the mechanism is well-established, but "how much everyday exposure actually matters" is a less settled question.',
    citations: [{ source: 'BPA/phthalate thyroid hormone disruption reviews' }],
    overallTier: 'moderate',
    relatedIds: ['problem-conventional-high-pesticide-produce'],
  },
  {
    id: 'lifestyle-edc-personal-care',
    category: 'lifestyleEnvironment',
    title: 'A Practical EDC Exposure Path: Personal Care Products',
    teaser: 'Endocrine disruptors aren\'t only a food question -- daily lotion and fragrance are a real, everyday exposure route too.',
    summary:
      'Parabens and certain fragrance compounds in lotion, shampoo, and cosmetics are absorbed through skin and have their own documented endocrine-disrupting properties, a genuinely separate exposure pathway from the food-focused EDC concern above. Reading ingredient lists and choosing fragrance-free/paraben-free options where practical is a real, low-effort reduction step -- included here specifically because this app\'s own mission is food-focused, and it\'s worth naming that food isn\'t the only lever.',
    citations: [{ source: 'Paraben/fragrance compound endocrine activity studies' }],
    overallTier: 'weak',
  },
  {
    id: 'lifestyle-ultra-processed-food',
    category: 'lifestyleEnvironment',
    title: 'Ultra-Processed Food: The Category-Level Concern Behind Many Single-Ingredient Ones',
    teaser: 'Several individual entries in Food Additives are really one symptom of this broader pattern.',
    summary:
      'Ultra-processed food (NOVA classification group 4 -- industrially formulated products with ingredients rarely used in home cooking) is independently associated in large cohort studies with higher all-cause mortality and cardiometabolic risk, even after adjusting for the specific nutrients involved -- suggesting something about the level of processing itself, not just individual additive exposure, may matter. This is the category-level version of the same concern several individual Food Additives entries and the Commercial/Pre-Made Problem Foods entry each address one piece of at a time.',
    citations: [{ source: 'NOVA classification, ultra-processed food/mortality cohort studies' }],
    overallTier: 'moderate',
    relatedIds: ['problem-commercial-premade'],
  },
  {
    id: 'lifestyle-sleep-circadian',
    category: 'lifestyleEnvironment',
    title: 'Sleep & Circadian Disruption',
    teaser: 'TSH\'s own real diurnal rhythm (see Labs & Medication Timing) is one small piece of a much bigger picture.',
    summary:
      'Poor sleep and circadian disruption (shift work, irregular sleep timing) are independently linked in real research to increased inflammatory markers and altered cortisol rhythms -- the same HPA-axis pathway this category keeps returning to across alcohol, chronic stress, and thyroid hormone conversion. Sleep is genuinely under-covered in most Hashimoto\'s-specific food/diet content despite this real overlap.',
    citations: [{ source: 'Circadian disruption/inflammatory marker studies' }],
    overallTier: 'moderate',
  },
  {
    id: 'lifestyle-chronic-stress-hpa',
    category: 'lifestyleEnvironment',
    title: 'Chronic Stress & HPA-Axis Dysregulation',
    teaser: 'The same cortisol pathway named across alcohol, juice, and sleep -- worth understanding once, on its own.',
    summary:
      'Chronic stress drives well-documented dysregulation of the hypothalamic-pituitary-adrenal (HPA) axis, the body\'s central stress-hormone regulation system -- and cortisol, in turn, is documented to suppress the deiodinase enzymes responsible for converting inactive T4 into active T3, favoring inactive reverse T3 instead. This single mechanism is the common thread this app\'s own research keeps finding underneath several seemingly unrelated topics (alcohol, juice, sleep, high-intensity exercise) -- worth understanding as one real pathway rather than several separate warnings.',
    citations: [{ source: 'Stephens & Wand 2012, Alcohol Research: Current Reviews (HPA-axis/cortisol review)' }],
    overallTier: 'strong',
    relatedIds: ['lifestyle-alcohol-advisory', 'mito-exercise-cortisol'],
  },
  {
    id: 'lifestyle-smoking-paradox',
    category: 'lifestyleEnvironment',
    title: 'Smoking: A Real, Counterintuitive Split Between Hashimoto\'s and Graves\'',
    teaser: 'One of the genuinely surprising findings in thyroid research -- smoking\'s effect actually runs the OPPOSITE direction for Hashimoto\'s.',
    summary:
      'Well-established endocrinology research shows smoking is a documented RISK factor for Graves\' disease (the hyperthyroid autoimmune condition) but is associated with LOWER risk of developing Hashimoto\'s thyroiditis specifically -- a real, replicated, and genuinely counterintuitive split between two autoimmune thyroid conditions that are otherwise often lumped together. This is included as a real finding worth knowing, not a suggestion to smoke -- smoking carries enough separately well-established harm (cardiovascular, cancer) to outweigh this one narrow thyroid-specific association many times over.',
    citations: [{ source: 'Smoking and autoimmune thyroid disease risk, comparative epidemiology' }],
    overallTier: 'strong',
  },
  {
    id: 'lifestyle-environmental-goitrogens-water',
    category: 'lifestyleEnvironment',
    title: 'Perchlorate & Other Water-Borne Goitrogens',
    teaser: 'The same NIS-blocking mechanism as dietary nitrate -- but from drinking water, not food.',
    summary:
      'Perchlorate (a rocket-fuel and industrial byproduct that has contaminated groundwater in some regions) competitively inhibits the sodium-iodide symporter (NIS) the exact same way dietary nitrate does (see Food Additives) -- an environmental, not dietary, source of the identical mechanism. Most municipal water supplies test within regulatory limits, but this is a real, checkable exposure for anyone on well water in an area with known industrial contamination history.',
    citations: [{ source: 'Perchlorate/NIS inhibition, EPA drinking water assessments' }],
    overallTier: 'moderate',
    relatedIds: ['additive-nitrates-nitrites', 'nutrient-iodine'],
  },
  {
    id: 'lifestyle-air-pollution',
    category: 'lifestyleEnvironment',
    title: 'Air Pollution & Autoimmune Risk',
    teaser: 'A real, emerging research area -- genuinely less mature than most of this app\'s other environmental findings.',
    summary:
      'Fine particulate matter (PM2.5) exposure is an emerging area of autoimmune disease research, with some studies linking higher long-term exposure to increased autoimmune disease risk broadly, plausibly through systemic inflammatory pathways. This research area is genuinely less mature than most other entries in this category -- included honestly as an emerging signal worth watching, not an established finding on the same footing as, say, the calcium-levothyroxine interaction.',
    citations: [{ source: 'PM2.5 exposure and autoimmune disease incidence, emerging cohort research' }],
    overallTier: 'weak',
  },
  {
    id: 'lifestyle-nsaids-gut',
    category: 'lifestyleEnvironment',
    title: 'NSAIDs & Gut Permeability',
    teaser: 'A real, common over-the-counter medication with a documented gut-barrier effect -- not just a food or lifestyle factor.',
    summary:
      'Nonsteroidal anti-inflammatory drugs (ibuprofen, naproxen, aspirin) are well-documented to increase intestinal permeability with regular use, a real, mechanistic side effect distinct from their better-known stomach-lining/ulcer risk. This is the same permeability increase zinc carnosine was shown to fully block in the RCT covered under Gut & Microbiome -- worth knowing as a real, everyday medication with gut-barrier consequences, not just a food-focused topic.',
    citations: [{ source: 'NSAID-induced intestinal permeability studies' }],
    overallTier: 'strong',
    relatedIds: ['gut-zinc-carnosine'],
  },
  {
    id: 'lifestyle-antibiotic-overuse',
    category: 'lifestyleEnvironment',
    title: 'Antibiotic Use & Long-Term Microbiome Disruption',
    teaser: 'A single course can measurably shift gut microbiota composition for months, sometimes longer.',
    summary:
      'A course of antibiotics reliably reduces gut microbial diversity, including real, documented declines in Bifidobacterium species specifically (see Fermented Foods) -- and while much of that diversity typically recovers within weeks to months, some studies find certain species never fully return to their pre-antibiotic baseline. Relevant context for anyone rebuilding gut diversity after a recent antibiotic course, not a reason to avoid antibiotics when they\'re genuinely needed.',
    citations: [{ source: 'Antibiotic-induced gut microbiota diversity loss, longitudinal studies' }],
    overallTier: 'strong',
    relatedIds: ['fermented-bifidobacterium'],
  },
  {
    id: 'lifestyle-plastic-food-storage',
    category: 'lifestyleEnvironment',
    title: 'Heating Food in Plastic',
    teaser: 'A specific, everyday habit that measurably increases the exact exposure named earlier in this category.',
    summary:
      'Microwaving food in plastic containers, or storing hot food in plastic immediately after cooking, measurably increases leaching of BPA and phthalates (see the entries above) compared to the same container at room temperature -- a real, specific, checkable behavior rather than a vague "plastic is bad" gesture. Glass or ceramic containers for reheating, and letting food cool before transferring to plastic for storage, are both concrete, low-cost changes.',
    citations: [{ source: 'Heat-accelerated BPA/phthalate leaching studies, food-contact plastics' }],
    overallTier: 'moderate',
    relatedIds: ['lifestyle-edc-bpa-phthalates'],
  },
  {
    id: 'lifestyle-sedentary-behavior',
    category: 'lifestyleEnvironment',
    title: 'Sedentary Behavior & Baseline Inflammation',
    teaser: 'Included honestly as a real but comparatively modest finding -- not every entry needs to be alarming to be worth knowing.',
    summary:
      'Extended sedentary time is independently associated with modestly elevated inflammatory markers in observational research, separate from and additional to whatever formal exercise someone does elsewhere in the day -- a real, if comparatively modest, finding. Included deliberately alongside this category\'s stronger entries as an honest example of a real but lower-confidence lifestyle factor, consistent with this app\'s standing practice of tiering every claim by its actual evidence strength rather than its intuitive plausibility.',
    citations: [{ source: 'Sedentary time and inflammatory marker observational studies' }],
    overallTier: 'weak',
  },
];
