import type { DigestEntry } from './types';

// Lifestyle & Environment -- 21 entries. Folds in the app's own already-
// shipped alcohol/coffee/juice advisories (lib/alcoholAdvisory.ts,
// coffeeAdvisory.ts, juiceAdvisory.ts) as real digest content rather than
// leaving them only reachable as small in-builder tap-to-read rows, plus
// the broader environmental-exposure and daily-habit research those
// advisories were built alongside.
//
// 2026-08-07, same day, rewritten in the same narrative shape as the other
// categories already given this treatment -- every entry opens on a hook,
// develops the finding, and closes on why it matters. Every underlying
// fact and citation is unchanged from the original pass.
//
// 2026-08-07, same day, three more entries added as part of a real gap-fill
// pass: EBV as a viral trigger, COVID-19 and thyroiditis, and sleep apnea.
//
// 2026-08-08: content fields rewritten a second time to remove AI-writing
// tics flagged directly by the person -- em dashes as punctuation, "not X,
// it's Y" contrast, and overused words like "real"/"genuinely"/
// "honest(ly)"/"worth" -- see bigPicture.ts's own header comment for the
// full context. Every fact, number, and citation is unchanged.
export const LIFESTYLE_ENVIRONMENT_ENTRIES: DigestEntry[] = [
  {
    id: 'lifestyle-alcohol-advisory',
    category: 'lifestyleEnvironment',
    title: 'Alcohol: A Genuinely Two-Sided Case',
    teaser: 'Not simply "worse for Hashimoto\'s." Two population studies found the opposite at moderate intake.',
    summary:
      "The instinctive assumption is that alcohol can only make an autoimmune condition worse. Two population studies say the actual picture is more complicated, and more interesting, than that instinct suggests. Two peer-reviewed studies (a Danish population-based case-control study and a prospective Amsterdam autoimmune-thyroid-disease cohort) found moderate alcohol consumption is not linked to new thyroid-antibody development and tracks with lower risk of progressing to overt autoimmune hypothyroidism, mirroring alcohol's documented protective association with other autoimmune diseases. The dose-dependent concerns concentrate specifically at heavier and more frequent drinking: the liver's ~80% share of T4-to-T3 conversion competing with alcohol's own hepatic processing load, a small preliminary study linking chronic heavy drinking to gut permeability and inflammatory thyroid-axis effects, and alcohol's well-documented effect on HPA-axis and cortisol regulation. Not a green light to drink more, and not the blanket warning most people expect either. A dose-dependent picture worth understanding on its own terms.",
    citations: [
      {
        source: 'Carlé et al. 2012, European Journal of Endocrinology -- moderate alcohol consumption may protect against overt autoimmune hypothyroidism',
        url: 'https://pubmed.ncbi.nlm.nih.gov/22802427/',
      },
      {
        source: 'Effraimidis et al. 2012, European Thyroid Journal -- alcohol consumption as a risk factor for autoimmune thyroid disease, prospective Amsterdam AITD cohort',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3821464/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['lifestyle-chronic-stress-hpa'],
  },
  {
    id: 'lifestyle-coffee-milk-antioxidants',
    category: 'lifestyleEnvironment',
    title: "Coffee + Milk: A Genuinely Mixed Finding, Not the One-Sided Claim It's Often Presented As",
    teaser: 'The "milk cuts coffee\'s antioxidants by 50%" claim didn\'t hold up under a closer look.',
    summary:
      'A specific claim circulates confidently enough in health content that it rarely gets questioned: adding milk to coffee cuts its antioxidant benefit roughly in half. Checked directly, it doesn\'t hold up as stated. Some studies show roughly 28-40% less free chlorogenic acid because it binds to milk casein, but other studies show the resulting protein-polyphenol complex measuring higher antioxidant activity than the free compound alone. Presented honestly as an open, two-sided question rather than the one-sided claim it\'s usually stated as. An example of a popular health claim not surviving a direct check.',
    citations: [
      { source: 'Novel Insights into Milk Coffee Products: Component Interactions, Innovative Processing, and Healthier Product Features (Foods, 2025)', url: 'https://www.mdpi.com/2304-8158/14/23/4043' },
    ],
    overallTier: 'weak',
  },
  {
    id: 'lifestyle-coffee-filtered-cholesterol',
    category: 'lifestyleEnvironment',
    title: 'Filtered vs. Unfiltered Coffee & Cholesterol: A Real, Well-Established Difference Most People Never Think to Ask About',
    teaser: 'Two cups of coffee, same beans, wildly different cholesterol effect, depending entirely on how it was brewed.',
    summary:
      "Most coffee-and-health conversations treat \"coffee\" as one undifferentiated thing. The brewing method itself turns out to make a measurable difference nobody usually asks about. Unfiltered coffee (French press, Turkish, boiled or Scandinavian-style) retains cafestol and kahweol, two diterpene compounds that a consistent body of evidence, including AHA-cited trials, links to raised LDL cholesterol. Paper filters trap nearly all of both compounds, meaning drip and pour-over coffee are essentially free of this specific effect. A concrete, checkable brewing-method difference rather than a vague \"coffee is fine in moderation\" answer. The same beans, the same cup size, a genuinely different cholesterol outcome depending purely on the filter.",
    citations: [
      { source: 'Effect of Coffee Lipids (Cafestol and Kahweol) on Regulation of Cholesterol Metabolism (Arteriosclerosis, Thrombosis, and Vascular Biology, AHA journal)', url: 'https://www.ahajournals.org/doi/10.1161/01.atv.17.10.2140' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'lifestyle-coffee-arabica-robusta',
    category: 'lifestyleEnvironment',
    title: 'Arabica vs. Robusta: A Real Caffeine Difference',
    teaser: 'Two coffee species with a genuinely different caffeine content, confirmed, not folklore, and not about roast level at all.',
    summary:
      "Roast level gets blamed for caffeine differences between cups more often than the actual driver ever does. Robusta beans genuinely contain roughly double the caffeine of Arabica beans, a consistent food-science finding rather than a roast-level myth, worth knowing for anyone tracking caffeine intake specifically (see Labs & Medication Timing for the levothyroxine-spacing reason that matters). Bean species, not roast darkness, is the bigger driver of a given cup's caffeine content, a genuinely different variable than the one most people assume is responsible.",
    citations: [
      { source: 'Comprehensive Analysis of Metabolites in Brews Prepared from Naturally and Technologically Treated Coffee Beans', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9855040/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'lifestyle-juice-advisory',
    category: 'lifestyleEnvironment',
    title: 'Straight Fruit Juice: A Real, Carefully-Qualified Chain of Concerns',
    teaser: 'Population-level risk is real. The "guaranteed acute blood sugar spike" version of this claim is not.',
    summary:
      "Fruit juice occupies an odd space in nutrition advice, treated as healthy by some, as concentrated sugar by others. The research supports pieces of both views, in a more specific way than either side usually states. Three large prospective cohorts found daily juice intake tracks with up to 21% higher type 2 diabetes risk while whole fruit tracks with lower risk, but a 2025 randomized crossover trial in adults with type 2 diabetes found no real difference in glucose/insulin response between orange juice and whole orange pieces at matched sugar content eaten with a meal, meaning portion size (juice makes it easier to drink more sugar at once) is likely the more consistent driver than a fundamentally different absorption curve every time. The proposed juice-to-cortisol-to-thyroid-conversion chain is mechanistically plausible (a glucose crash after a spike triggers cortisol, and cortisol suppresses T4-to-T3 conversion enzymes) but hasn't been directly tested as one continuous chain. Presented as plausible, not proven. A carefully-qualified concern rather than a guaranteed acute effect every time a glass of juice is poured.",
    citations: [
      { source: 'Muraki et al. 2013, BMJ -- fruit consumption and risk of type 2 diabetes (3-cohort study)', url: 'https://pubmed.ncbi.nlm.nih.gov/23990623/' },
      {
        source: 'Acute glycaemic response of orange juice consumption with breakfast in individuals with type 2 diabetes: a randomized cross-over trial (2025)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/40628708/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['problem-sugar-sweetened-beverages'],
  },
  {
    id: 'lifestyle-edc-bpa-phthalates',
    category: 'lifestyleEnvironment',
    title: 'Endocrine Disruptors: BPA & Phthalates',
    teaser: 'Chemicals specifically named for disrupting hormone systems, with real, if still-developing, thyroid-specific data.',
    summary:
      "The name itself is direct: \"endocrine disruptor\" describes exactly what these chemicals are documented to do. The real question is how much everyday exposure actually matters. BPA, found in some plastics and can linings, and phthalates, found in many plastics and fragranced products, are both documented endocrine disruptors with research linking exposure to altered thyroid hormone levels, largely through interference with thyroid hormone receptor binding and transport proteins. Most of the strongest human data comes from occupational or high-exposure studies rather than typical consumer-level exposure. The mechanism is well-established. \"How much everyday exposure actually matters\" is the honest, still-less-settled question, worth knowing the difference between the two rather than assuming either extreme.",
    citations: [{ source: 'Bisphenols and Thyroid Hormone (Endocrinology and Metabolism, 2019)', url: 'https://pubmed.ncbi.nlm.nih.gov/31884733/' }],
    overallTier: 'moderate',
    relatedIds: ['problem-conventional-high-pesticide-produce'],
  },
  {
    id: 'lifestyle-edc-personal-care',
    category: 'lifestyleEnvironment',
    title: 'A Practical EDC Exposure Path: Personal Care Products',
    teaser: "Endocrine disruptors aren't only a food question. Daily lotion and fragrance are an everyday exposure route too.",
    summary:
      "Every entry so far about endocrine disruptors has been about what's eaten. There's a second, completely separate route into the body that has nothing to do with food at all. Parabens and certain fragrance compounds in lotion, shampoo, and cosmetics are absorbed through skin and have their own documented endocrine-disrupting properties, a genuinely separate exposure pathway from the food-focused EDC concern above. Reading ingredient lists and choosing fragrance-free or paraben-free options where practical is a low-effort reduction step, included here specifically because this app's own mission is food-focused, and it's worth naming directly that food isn't the only lever.",
    citations: [
      {
        source: 'Reducing Phthalate, Paraben, and Phenol Exposure from Personal Care Products in Adolescent Girls: the HERMOSA Intervention Study',
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5047791/',
      },
    ],
    overallTier: 'weak',
  },
  {
    id: 'lifestyle-ultra-processed-food',
    category: 'lifestyleEnvironment',
    title: 'Ultra-Processed Food: The Category-Level Concern Behind Many Single-Ingredient Ones',
    teaser: 'Several individual entries in Food Additives are really one symptom of this broader, category-level pattern.',
    summary:
      "Reading through this app's own Food Additives category one ingredient at a time can miss a bigger pattern sitting just underneath all of them. Ultra-processed food (NOVA classification group 4, industrially formulated products with ingredients rarely used in home cooking) is independently associated in large cohort studies with higher all-cause mortality and cardiometabolic risk, even after adjusting for the specific nutrients involved. That \"even after adjusting\" detail matters. It suggests something about the level of processing itself, not just individual additive exposure, may genuinely matter on its own. This is the category-level version of the same concern several individual Food Additives entries and the Commercial/Pre-Made Problem Foods entry each address one piece of at a time, worth seeing as one connected pattern, not several separate warnings.",
    citations: [
      {
        source: 'Association Between Ultra-processed Food Consumption and Mortality Among US Adults: Prospective Cohort Study (NHANES 2003-2018)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/39608567/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['problem-commercial-premade'],
  },
  {
    id: 'lifestyle-sleep-circadian',
    category: 'lifestyleEnvironment',
    title: 'Sleep & Circadian Disruption',
    teaser: "TSH's own real diurnal rhythm is one small piece of a much bigger picture most Hashimoto's food/diet content skips entirely.",
    summary:
      "Sleep rarely comes up in Hashimoto's-focused diet advice, despite a documented overlap with the same hormone pathways this whole category keeps returning to. Poor sleep and circadian disruption (shift work, irregular sleep timing) are independently linked in research to increased inflammatory markers and altered cortisol rhythms, the same HPA-axis pathway this category keeps returning to across alcohol, chronic stress, and thyroid hormone conversion. Sleep is genuinely under-covered in most Hashimoto's-specific food and diet content despite this overlap, worth treating as seriously as any dietary factor in this category, not an afterthought.",
    citations: [
      { source: 'Influence of sleep deprivation and circadian misalignment on cortisol, inflammatory markers, and cytokine balance', url: 'https://pubmed.ncbi.nlm.nih.gov/25640603/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'lifestyle-chronic-stress-hpa',
    category: 'lifestyleEnvironment',
    title: 'Chronic Stress & HPA-Axis Dysregulation',
    teaser: 'The same cortisol pathway named across alcohol, juice, and sleep, worth understanding once, on its own, rather than four separate times.',
    summary:
      "By this point in the category, cortisol has already come up repeatedly, in the alcohol entry, the juice entry, the sleep entry above. It's worth pausing to understand the actual mechanism once, directly. Chronic stress drives well-documented dysregulation of the hypothalamic-pituitary-adrenal (HPA) axis, the body's central stress-hormone regulation system, and cortisol, in turn, is documented to suppress the deiodinase enzymes responsible for converting inactive T4 into active T3, favoring inactive reverse T3 instead. This single mechanism is the common thread this app's own research keeps finding underneath several seemingly unrelated topics: alcohol, juice, sleep, high-intensity exercise. Worth understanding as one real pathway rather than several separate warnings repeated independently.",
    citations: [
      { source: 'Stephens & Wand 2012, Alcohol Research: Current Reviews -- stress and the HPA axis (NIAAA)', url: 'https://pubmed.ncbi.nlm.nih.gov/23584113/' },
    ],
    overallTier: 'strong',
    relatedIds: ['lifestyle-alcohol-advisory', 'mito-exercise-cortisol'],
  },
  {
    id: 'lifestyle-il6-deiodinase',
    category: 'lifestyleEnvironment',
    title: 'A Second Real Pathway From Inflammation to Low Thyroid Hormone, Not Just Cortisol',
    teaser: 'Cortisol isn\'t the only route from "inflamed" to "low active thyroid hormone." A specific immune messenger does the same thing, a completely different way.',
    summary:
      "This category has already named cortisol as the recurring thread connecting alcohol, chronic stress, sleep, and exercise intensity to reduced active thyroid hormone. There's a second, genuinely separate pathway that gets to the exact same destination. IL-6, an inflammatory signaling molecule the body produces during illness, infection, or chronic inflammation, directly suppresses the D1 and D2 deiodinase enzymes responsible for converting inactive T4 into active T3, and, in the same move, activates D3, the enzyme that breaks T3 down. Researchers found this happens through a specific mechanism: IL-6 triggers oxidative stress that depletes glutathione, a cofactor those conversion enzymes need to function, and restoring glutathione directly reversed the effect in the lab. This dual hit (less T3 being made, more T3 being destroyed) is the real biology behind \"non-thyroidal illness syndrome,\" where someone can look hypothyroid on paper during a real illness or major inflammatory episode without their thyroid gland itself being the cause. A second, independent reason, alongside cortisol, that general inflammation, not just direct thyroid autoimmunity, can suppress how much active thyroid hormone actually reaches the body's cells.",
    citations: [
      {
        source: 'Wajner SM, Goemann IM, Bueno AL, Larsen PR, Maia AL 2011, Journal of Clinical Investigation -- "IL-6 promotes nonthyroidal illness syndrome by blocking thyroxine activation while promoting thyroid hormone inactivation in human cells"',
        url: 'https://pubmed.ncbi.nlm.nih.gov/21540553/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['lifestyle-chronic-stress-hpa', 'organ-liver-t4t3-conversion'],
  },
  {
    id: 'lifestyle-smoking-paradox',
    category: 'lifestyleEnvironment',
    title: "Smoking: A Real, Counterintuitive Split Between Hashimoto's and Graves'",
    teaser: "One of the genuinely surprising findings in thyroid research: smoking's effect actually runs the opposite direction for Hashimoto's.",
    summary:
      "Smoking's health risks are about as well-established as anything in medicine. Its specific relationship with Hashimoto's is one of the genuinely stranger findings in this whole research base. Well-established endocrinology research shows smoking is a documented risk factor for Graves' disease, the hyperthyroid autoimmune condition, but is associated with lower risk of developing Hashimoto's thyroiditis specifically. A replicated, and genuinely counterintuitive split between two autoimmune thyroid conditions that are otherwise often lumped together. This is included as a finding worth knowing, not a suggestion to smoke. Smoking carries enough separately well-established harm, cardiovascular disease, cancer, to outweigh this one narrow thyroid-specific association many times over.",
    citations: [
      { source: 'Wiersinga -- Smoking and thyroid disorders: a meta-analysis (Clinical Endocrinology)', url: 'https://pubmed.ncbi.nlm.nih.gov/11834423/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'lifestyle-environmental-goitrogens-water',
    category: 'lifestyleEnvironment',
    title: 'Perchlorate & Other Water-Borne Goitrogens',
    teaser: 'The same NIS-blocking mechanism as dietary nitrate, arriving through drinking water instead of food.',
    summary:
      "Food Additives already covers how dietary nitrate can interfere with thyroid iodine uptake. The exact same mechanism has a second, completely different real-world source. Perchlorate, a rocket-fuel and industrial byproduct that has contaminated groundwater in some regions, competitively inhibits the sodium-iodide symporter (NIS) the exact same way dietary nitrate does. An environmental, not dietary, source of the identical mechanism. Most municipal water supplies test within regulatory limits, but this is a checkable exposure for anyone on well water in an area with a known industrial contamination history, worth knowing the mechanism is shared, even though the source is completely different.",
    citations: [
      {
        source: 'Perchlorate, nitrate, and thiocyanate: environmentally relevant NIS-inhibitor pollutants and their impact on thyroid function and human health',
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9633673/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['additive-nitrates-nitrites', 'nutrient-iodine'],
  },
  {
    id: 'lifestyle-air-pollution',
    category: 'lifestyleEnvironment',
    title: 'Air Pollution & Autoimmune Risk',
    teaser: "An emerging research area, genuinely less mature than most of this app's other environmental findings, and honestly labeled as such.",
    summary:
      "Not every entry in this app's own research base carries the same weight of evidence, and this one is an honest example of that difference. Fine particulate matter (PM2.5) exposure is an emerging area of autoimmune disease research, with some studies linking higher long-term exposure to increased autoimmune disease risk broadly, plausibly through systemic inflammatory pathways. This research area is genuinely less mature than most other entries in this category, included honestly as an emerging signal worth watching, not an established finding on the same footing as, say, the calcium-levothyroxine interaction.",
    citations: [
      { source: 'Systemic Autoimmune Rheumatic Disease Risk: Association With Long-Term Exposure to Fine Particulate Matter', url: 'https://pubmed.ncbi.nlm.nih.gov/40509744/' },
    ],
    overallTier: 'weak',
  },
  {
    id: 'lifestyle-nsaids-gut',
    category: 'lifestyleEnvironment',
    title: 'NSAIDs & Gut Permeability',
    teaser: 'A common over-the-counter medication with a documented gut-barrier effect, not just a food or lifestyle factor.',
    summary:
      "Everything in this category so far has been about food, drink, or environment. This entry is a reminder that a medicine cabinet is a real exposure source too. Nonsteroidal anti-inflammatory drugs (ibuprofen, naproxen, aspirin) are well-documented to increase intestinal permeability with regular use, a mechanistic side effect distinct from their better-known stomach-lining and ulcer risk. This is the same permeability increase zinc carnosine was shown to fully block in the RCT covered under Gut & Microbiome, worth knowing as an everyday medication with gut-barrier consequences, not just a food-focused topic.",
    citations: [
      { source: 'Effect of non-steroidal anti-inflammatory drugs and prostaglandins on the permeability of the human small intestine', url: 'https://pubmed.ncbi.nlm.nih.gov/3466837/' },
    ],
    overallTier: 'strong',
    relatedIds: ['gut-zinc-carnosine'],
  },
  {
    id: 'lifestyle-antibiotic-overuse',
    category: 'lifestyleEnvironment',
    title: 'Antibiotic Use & Long-Term Microbiome Disruption',
    teaser: 'A single course can measurably shift gut microbiota composition for months, sometimes longer than most people would expect.',
    summary:
      "A single course of antibiotics feels like a short-term interruption. The research on how long the gut actually takes to recover says otherwise, at least sometimes. A course of antibiotics reliably reduces gut microbial diversity, including documented declines in Bifidobacterium species specifically, covered under Fermented Foods, and while much of that diversity typically recovers within weeks to months, some studies find certain species never fully return to their pre-antibiotic baseline. Relevant context for anyone rebuilding gut diversity after a recent antibiotic course, not a reason to avoid antibiotics when they're genuinely needed. Knowing the real recovery timeline just makes the rebuilding effort make more sense.",
    citations: [
      { source: 'Incomplete recovery and individualized responses of the human distal gut microbiota to repeated antibiotic perturbation', url: 'https://pubmed.ncbi.nlm.nih.gov/20847294/' },
    ],
    overallTier: 'strong',
    relatedIds: ['fermented-bifidobacterium'],
  },
  {
    id: 'lifestyle-plastic-food-storage',
    category: 'lifestyleEnvironment',
    title: 'Heating Food in Plastic',
    teaser: 'A specific, everyday habit that measurably increases the exact exposure named earlier in this category.',
    summary:
      "The BPA and phthalate concerns named earlier in this category aren't just about which container a food happens to sit in. How that container gets used matters just as much. Microwaving food in plastic containers, or storing hot food in plastic immediately after cooking, measurably increases leaching of BPA and phthalates compared to the same container at room temperature, a specific, checkable behavior rather than a vague \"plastic is bad\" gesture. Glass or ceramic containers for reheating, and letting food cool before transferring it to plastic for storage, are both concrete, low-cost changes. A practical fix for a specific exposure, not a call to eliminate plastic containers entirely.",
    citations: [
      { source: 'Analysis of Phthalate Migration to Food Simulants in Plastic Containers during Microwave Operations', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3924457/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['lifestyle-edc-bpa-phthalates'],
  },
  {
    id: 'lifestyle-sedentary-behavior',
    category: 'lifestyleEnvironment',
    title: 'Sedentary Behavior & Baseline Inflammation',
    teaser: 'Included honestly as a real but comparatively modest finding. Not every entry needs to be alarming to be worth knowing.',
    summary:
      "This category has covered some genuinely striking findings: a 94% reduction in iron absorption elsewhere in this Digest, a counterintuitive smoking split, a drug in Phase III trials. This closing entry is a deliberately quieter one. Extended sedentary time is independently associated with modestly elevated inflammatory markers in observational research, separate from and additional to whatever formal exercise someone does elsewhere in the day, a real, if comparatively modest, finding. Included deliberately alongside this category's stronger entries as an honest example of a lower-confidence lifestyle factor, consistent with this app's standing practice of tiering every claim by its actual evidence strength rather than its intuitive plausibility.",
    citations: [
      { source: 'Sedentary time and markers of chronic low-grade inflammation in a high risk population', url: 'https://pubmed.ncbi.nlm.nih.gov/24205208/' },
    ],
    overallTier: 'weak',
  },
  {
    id: 'lifestyle-ebv-viral-trigger',
    category: 'lifestyleEnvironment',
    title: "Epstein-Barr Virus: A Real, Detected Presence Inside Hashimoto's Thyroid Tissue Itself",
    teaser: 'Not a correlation from a questionnaire. A virus actually found sitting inside the diseased tissue, in a majority of cases studied.',
    summary:
      "Most of this Digest's own viral/infectious research works by inference, a statistical association, a plausible mechanism. This finding is more direct than that. A study examined actual thyroid tissue samples from Hashimoto's thyroiditis patients and found genetic evidence of Epstein-Barr virus (EBV, the same virus behind mononucleosis, and one of the most common viral infections in adults worldwide) present in 80.7% of samples via one marker (EBER nuclear expression), and a second, more specific marker of active viral activity (LMP1) in 34.5% of Hashimoto's tissue, compared to 0% in Graves' disease tissue from the same study, a meaningful contrast between two different autoimmune thyroid diseases, not just \"virus present somewhere near the thyroid.\" The proposed mechanism is genuinely specific too. Rather than the molecular-mimicry route covered elsewhere in this Digest, the researchers suggest EBV's own active infection of thyroid follicular cells directly triggers local inflammatory signaling that recruits immune cells into the tissue, a real, if still theoretical, proposed first domino. Worth knowing not because there's currently anything actionable to do about a common, usually-dormant childhood/young-adult viral infection nearly everyone has already had, but because it's a concrete example of how a virus can end up physically present inside the exact tissue an autoimmune disease attacks, not just statistically associated with it from a distance.",
    citations: [
      { source: 'Janegova A, Janega P, Rychly B, et al. 2015 -- The role of Epstein-Barr virus infection in the development of autoimmune thyroid diseases', url: 'https://pubmed.ncbi.nlm.nih.gov/25931043/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['gut-molecular-mimicry'],
  },
  {
    id: 'lifestyle-covid19-thyroid-trigger',
    category: 'lifestyleEnvironment',
    title: 'COVID-19 and the Thyroid: A Real, Documented Trigger, and a Real Reason to Get Levels Checked After a Serious Infection',
    teaser: 'A systematic review found actual new-onset and reactivated thyroid autoimmunity following COVID-19 infection. Most cases resolved. Two, tragically, did not.',
    summary:
      "A systematic review specifically searched for documented cases of thyroid autoimmunity connected to COVID-19 infection and found a genuine, if still uncommon, pattern: 20 cases of new or reactivated autoimmune thyroid disease following COVID-19 (14 Graves' disease, 5 Hashimoto's thyroiditis, and 1 postpartum thyroiditis). A telling detail: 8 of those 14 Graves' cases had pre-existing, previously stable thyroid disease, suggesting COVID-19 can genuinely reactivate a dormant autoimmune process, not just trigger entirely new cases. The reassuring majority finding: most affected patients reached remission within 3 months. The sobering minority: two of the documented cases were fatal (one thyroid storm, one myxedema coma), both severe complications of thyroid dysfunction left unrecognized. The review's own practical recommendation is the actionable takeaway here: routinely checking thyroid function both during the acute phase of a serious COVID-19 infection and again during recovery, especially for anyone with pre-existing autoimmune thyroid disease. A real reason a bout of COVID-19 is worth a follow-up thyroid check, not just monitoring for the more commonly discussed respiratory or cardiovascular effects.",
    citations: [
      { source: 'Tutal E, Ozaras R, Leblebicioglu H 2022 -- Systematic review of COVID-19 and autoimmune thyroiditis (Travel Medicine and Infectious Disease)', url: 'https://pubmed.ncbi.nlm.nih.gov/35307540/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['advocacy-core-thyroid-panel'],
  },
  {
    id: 'lifestyle-sleep-apnea',
    category: 'lifestyleEnvironment',
    title: "Sleep Apnea and the Thyroid: A Real, Documented Association, With an Honest Admission the Mechanism Isn't Settled",
    teaser: "A connection shows up in the data. What's actually causing it is, honestly, still an open question.",
    summary:
      "This category already covers ordinary sleep disruption's link to inflammation elsewhere. Obstructive sleep apnea specifically deserves its own honest look, since it's a distinct, and often undiagnosed condition rather than just poor sleep habits. A recent review confirms genuine, significant epidemiological associations between obstructive sleep apnea and thyroid disorders, but states directly, in its own words, that \"discrepancies and contradictory results remain\" across the studies it reviewed, and that the specific underlying mechanism connecting the two \"is not clear.\" That's an honest admission worth respecting rather than papering over with a tidier-sounding explanation this app can't actually verify. What's worth knowing regardless of the unsettled mechanism: sleep apnea is both underdiagnosed and treatable (typically via a standard CPAP evaluation), and given how much this whole app's own research already ties poor sleep to measurable inflammation and thyroid-hormone-conversion effects, ruling out sleep apnea specifically, not just \"trying to sleep more,\" is a concrete step worth raising with a doctor for anyone with persistent fatigue, especially alongside snoring or witnessed breathing pauses, rather than assuming every sleep-related symptom is explained by Hashimoto's alone.",
    citations: [
      { source: 'Zhai L, Gao X 2025 -- Recent Advances in the Study of the Correlation Between Obstructive Sleep Apnea and Thyroid-Disorders (Sleep and Breathing)', url: 'https://pubmed.ncbi.nlm.nih.gov/40323542/' },
    ],
    overallTier: 'weak',
    relatedIds: ['lifestyle-sleep-circadian'],
  },
  {
    id: 'lifestyle-tying-together',
    category: 'lifestyleEnvironment',
    title: 'Tying It All Together: One Hormone Keeps Showing Up',
    teaser: 'Twenty-one entries spanning alcohol to air pollution, and cortisol runs through more of them than any other single factor.',
    summary:
      "Cortisol and the HPA axis show up, by name, across alcohol, chronic stress, sleep disruption, and high-intensity exercise (see Mitochondria & Metabolism), not as four separate warnings, but as one repeated pathway: cortisol suppresses the deiodinase enzymes that convert T4 into active T3. That single mechanism is worth understanding once, rather than as four unrelated lifestyle rules. Separately, this category's own honest corrections (the coffee-and-milk antioxidant claim, sedentary behavior's comparatively modest effect) are as much the point as its strongest findings, NSAIDs and gut permeability, antibiotic disruption. Not everything commonly repeated about lifestyle and Hashimoto's holds up equally well under a direct check. The practical shape of this whole category: a handful of everyday, non-food choices (how coffee gets brewed, how food gets reheated, how consistently sleep happens, how hard a workout runs) turn out to route through the same small set of hormonal and gut mechanisms this entire Digest keeps returning to.",
    citations: [
      { source: 'Stephens & Wand 2012, Alcohol Research: Current Reviews -- stress and the HPA axis (NIAAA)', url: 'https://pubmed.ncbi.nlm.nih.gov/23584113/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['lifestyle-chronic-stress-hpa', 'mito-exercise-cortisol'],
  },
];
