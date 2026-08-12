import type { DigestEntry } from './types';

// Built 2026-08-13, a genuinely new Basic Health topic, direct request:
// "I don't see much about each individual organ, how they work together
// and interact with each other, and how being deficient or toxic with any
// specific macronutrient, micronutrient, or amino acids, or hormone, how
// does your diet relate to your bones and teeth, and lymphatic system,
// eyes, brain, your skin, your hair, and everything else about a person
// as people relate to the food nutrients and nourishment quality they
// ingest." Also asked for directly, and reflected in the WRITING STYLE of
// every entry below, not just its content: "I want this to be sort of the
// same kind of thing in how it's done as [a certain well-known
// regenerative-agriculture documentary series was made], or in that line
// of doing things that way, without mentioning any of them at all." That
// series' own real strength is weaving many separate, real facts (soil,
// water, carbon, microbes, farmers) into one connected, narratively-told
// system rather than a list of disconnected trivia -- this file applies
// the exact same approach to the human body: individual organs and
// systems, told with real, verified science, but constantly pointing at
// how they depend on each other, not treated as separate topics. No
// documentary is named anywhere in the content itself, per the request.
//
// Checked existing content first, rather than duplicating it: this app's
// own Essential Nutrients series already carries deep, real,
// deficiency/toxicity-focused coverage for most individual nutrients
// (calcium, iron, zinc, vitamin A, vitamin C, vitamin D, vitamin K,
// magnesium, potassium, protein, omega-3s, B12, and more). This file is
// deliberately NOT a second copy of that -- it's the missing organ/system-
// centered layer, naming what each organ or system actually does, cross-
// linking to the nutrient it needs rather than re-deriving that nutrient's
// own deficiency/toxicity data, and adding real, genuinely new organ-
// specific science (bone as an endocrine organ, the lymphatic system's own
// lack of a central pump, AREDS2's honest trial result, telogen
// effluvium's real biomarker profile, and more) that wasn't in this
// Digest anywhere before this file.
//
// Every citation independently verified via WebSearch/WebFetch before
// being written in, the same standing discipline this whole Digest runs
// on -- including one real correction caught mid-research: an initial
// aggregated search summary claimed DHA and arachidonic acid together make
// up "over 50% of the neuron cell membrane and over 70% of the myelin
// sheath," a real overstatement not actually supported by the primary
// review paper once directly fetched and read. The real figure used below
// (DHA+AA representing roughly 25% of total brain fatty acid content, and
// the large majority of the brain's own long-chain polyunsaturated fatty
// acids) is what that paper actually states.
//
// A real, deliberately bounded first batch: 13 entries covering the exact
// systems named directly in the request (bones and teeth, the lymphatic
// system, eyes, brain, skin, hair) plus the additional real systems needed
// to make "how organs interact with each other" genuinely true rather than
// a list of separate parts (muscles, the cardiovascular system's own
// electrolyte dependence, the digestive organs beyond the gut microbiome
// research already covered elsewhere, how the body's own hormone systems
// talk to each other, the kidneys and liver as general filtration organs,
// and general nutrition-immune function), closing with a real, narrative
// "tying it together" entry showing one nutrient's ripple effects across
// several systems at once.
//
// A second real batch, 2026-08-13, closing two of the three gaps the note
// above originally flagged, per direct request: "continue with the
// respiratory and reproductive systems next." Respiratory: the alveoli's
// own real gas-exchange surface area (cross-linked to this app's already-
// existing Iron research, since the entire point of that surface is
// loading oxygen onto hemoglobin) plus a real, honestly-reported vitamin D/
// respiratory-infection finding (a large individual-participant-data
// meta-analysis whose modest overall effect concentrates far more strongly
// in people who were genuinely deficient at baseline -- the same "targeted,
// not blanket" theme this app's own Vitamin D research already carries
// elsewhere); and a second, real, more honestly mixed entry on magnesium
// sulfate's genuine emergency-medicine use in severe asthma, where the
// calcium-antagonist mechanism is settled but independent systematic
// reviews genuinely disagree on the real clinical-outcome evidence.
// Reproductive: the real, striking asymmetry between a finite, front-loaded
// egg supply set before birth and continuous, ~65-day sperm production,
// including the real, direct physical reason (neural tube closure within
// 21-28 days of conception) this app's own Folate research treats adequate
// intake as something to have in place before conception rather than after;
// plus a second entry on zinc's real, mechanistic role in male fertility,
// again honestly reporting a genuinely mixed supplementation-trial verdict
// alongside the deficiency mechanism itself. Real, honest, still-not-yet-
// covered ground for a future pass: the adrenal glands in more depth,
// beyond the existing Hashimoto's-specific APS-2 entry already covered in
// this app's own Organ Systems research -- named directly rather than
// silently left out, matching this whole Digest's own standing practice.
export const BODY_SYSTEMS_ENTRIES: DigestEntry[] = [
  {
    id: 'body-systems-overview',
    category: 'basicHealth',
    title: 'The Body Is Not a List of Parts',
    teaser: "A textbook can describe the skeleton, the bloodstream, and the brain as three separate chapters. The body itself never reads them that way -- it runs all three at once, off the same shared supply of nutrients.",
    summary:
      "Every organ and system covered in this shelf shares one real, unifying fact: none of them work in isolation, and almost none of them have their own separate, dedicated food supply. A person eats one meal, and that same meal's calcium, protein, iron, and fat get distributed to bone, muscle, brain, skin, and blood all at once, competing for absorption and distributed according to the body's own real, hierarchical priorities. When a nutrient runs short, the body doesn't simply weaken every system equally -- it makes real, physiological trade-offs, often protecting one system by quietly borrowing from another. The clearest example, covered in full in its own entry below: when blood calcium runs low, the body pulls calcium directly out of bone to keep the blood level stable, protecting heart and nerve function at the bone's own real, long-term expense. This is the actual reason this shelf is organized by organ and system rather than by nutrient the way the rest of this app's Essential Nutrients research already is -- a single nutrient's story is usually told well one nutrient at a time, but a single organ's story usually depends on several nutrients working together, and on what several other organs are doing with the same shared resources at the same time.",
    citations: [],
    overallTier: 'moderate',
    stageNote: "A framing entry for the whole shelf, not a new external research claim of its own -- every specific fact it references is cited in full in its own dedicated entry below.",
    relatedIds: ['body-tying-together', 'nutrient-tying-together'],
  },
  {
    id: 'body-bones-teeth-skeleton',
    category: 'basicHealth',
    title: 'Bone Is a Living, Active Organ, Not a Fixed Scaffold',
    teaser: "Bone doesn't just hold you up. It's constantly being broken down and rebuilt, it's the body's largest mineral reserve, and, discovered only in 2007, it sends out its own real hormone that helps regulate blood sugar.",
    summary:
      "Bone tissue is genuinely alive, remodeled continuously by two real, opposing cell types (osteoclasts breaking old bone down, osteoblasts building new bone) in a real, lifelong cycle -- not a fixed structure laid down once and left unchanged. That remodeling depends directly on several nutrients working together: calcium and phosphorus provide the actual physical mineral content, vitamin D lets the gut absorb that calcium in the first place, and vitamin K2 activates the specific protein (osteocalcin) that helps direct calcium into bone rather than into soft tissue where it doesn't belong -- real deficiency in any one of the three genuinely undermines the other two, already covered in full, with real citations, in this app's own Calcium and Vitamin K deep-dives. A real, striking, comparatively recent discovery (Lee et al. 2007, Cell) found that same protein, osteocalcin, doesn't just help build bone -- once released into the bloodstream, it acts as a genuine hormone in its own right, stimulating insulin release from the pancreas and improving the body's own insulin sensitivity, establishing bone as a real endocrine organ, not just a structural one. Teeth share bone's own real mineral dependence (calcium, phosphorus, vitamin D) plus one more of their own: fluoride, incorporated directly into tooth enamel, making it measurably more resistant to the acid produced when mouth bacteria ferment sugar -- the real, direct reason dental cavities are, at their root, a diet-driven disease.",
    citations: [
      {
        source: 'Lee NK, et al. 2007, Cell: "Endocrine Regulation of Energy Metabolism by the Skeleton"',
        url: 'https://pubmed.ncbi.nlm.nih.gov/17693256/',
      },
    ],
    overallTier: 'strong',
    stageNote: 'The remodeling cycle and the calcium/vitamin D/K2 dependence are real, established, textbook physiology. The osteocalcin-as-hormone finding is a real, since-replicated discovery, genuinely newer to the field.',
    relatedIds: ['calcium-tying-together', 'vitamink-tying-together', 'body-tying-together', 'body-endocrine-crosstalk'],
  },
  {
    id: 'body-lymphatic-system',
    category: 'basicHealth',
    title: "The Lymphatic System Has No Pump of Its Own -- It Borrows Yours",
    teaser: "The circulatory system has the heart. The lymphatic system, carrying immune cells and excess fluid through the entire body, has no equivalent organ at all -- it moves only when you do.",
    summary:
      "The lymphatic system runs a real, second fluid-transport network throughout the body, alongside the blood vessels, doing two real jobs at once: draining excess fluid and leaked protein out of body tissue and back into the bloodstream (real, unmanaged buildup of that fluid is what edema and lymphedema actually are), and carrying immune cells and the pathogens or debris they've captured toward lymph nodes for filtering, a core part of how the immune system actually monitors the body. What makes this system genuinely unusual next to the blood's own circulatory system: it has no equivalent to the heart, no central pump moving fluid through it at all. Lymph moves instead through a real, physical reliance on ordinary muscle contraction (walking, breathing, any physical movement compresses the surrounding lymphatic vessels and pushes fluid along) and a network of one-way valves that keep it moving in the right direction once pushed. A real, direct, measured consequence: during steady-state exercise, lymph flow rises to roughly two to three times its resting rate, a real, physical demonstration that a genuinely sedentary lifestyle doesn't just fail to help this system, it actively under-uses the one real mechanism keeping it moving at all. Since lymph fluid itself carries a real, meaningful protein load, this is also where the lymphatic system connects directly back to diet: the same severe dietary protein deficiency that causes kwashiorkor's own hallmark swelling, covered fully in this app's own Protein research, works partly through this exact mechanism -- too little protein circulating in the blood lets fluid leak into tissue faster than an already-struggling lymphatic system can clear it.",
    citations: [
      {
        source: 'Lane K, Worsley D, McKenzie D 2005, Sports Medicine 35(6):461-71: "Exercise and the lymphatic system: implications for breast-cancer survivors"',
        url: 'https://pubmed.ncbi.nlm.nih.gov/15974632/',
      },
    ],
    overallTier: 'strong',
    stageNote: 'Real, established physiology -- the no-central-pump structure and the exercise-driven lymph-flow increase are both well documented.',
    relatedIds: ['protein-deficiency-kwashiorkor-marasmus', 'body-muscular-system', 'body-tying-together'],
  },
  {
    id: 'body-eyes-vision',
    category: 'basicHealth',
    title: "Vision Runs on Two Real, Separate Nutrient Stories -- One Settled, One Still Being Tested",
    teaser: "Vitamin A's link to blindness is one of the most settled facts in all of nutrition. A newer, more targeted supplement trial for a different eye disease told a real, more complicated story.",
    summary:
      "The first story is genuinely settled: vitamin A deficiency is described directly by global health authorities as the world's leading preventable cause of childhood blindness, affecting an estimated one-third of children aged six to fifty-nine months in parts of sub-Saharan Africa and South Asia, and is already covered in full, with real citations, in this app's own Vitamin A deep-dive. The second story is newer and more nuanced. A large, real randomized trial (AREDS2, 4,203 participants aged 50-85, run by the National Eye Institute) tested whether adding lutein and zeaxanthin, two real, specific carotenoid pigments concentrated directly in the retina's own macula, to an already-established supplement formula would slow age-related macular degeneration further. The real, direct result: no additional overall benefit for the trial's main measured outcome. What the same trial did find, honestly reported rather than buried under the headline result: lutein and zeaxanthin proved a real, safer substitute for the beta-carotene the older formula had used, since beta-carotene is separately, well documented to raise lung cancer risk in smokers, while lutein and zeaxanthin carried no similar signal -- and longer, ten-year follow-up data has since favored the lutein/zeaxanthin version specifically for reducing the risk that macular degeneration actually progresses to its advanced, vision-threatening stage. Vision, in other words, runs on one real nutrient whose deficiency effect is dramatic and long-proven, and a second whose supplemental benefit turned out to be real, but far more specific and modest than early hope suggested.",
    citations: [
      {
        source: 'Age-Related Eye Disease Study 2 Research Group 2013, JAMA: "Lutein + zeaxanthin and omega-3 fatty acids for age-related macular degeneration"',
        url: 'https://pubmed.ncbi.nlm.nih.gov/23644932/',
      },
    ],
    overallTier: 'moderate',
    stageNote: 'The vitamin A/blindness link is strong and settled (see the dedicated Vitamin A entry). The AREDS2 lutein/zeaxanthin finding is real and honestly reported here at its own, more modest, confidence level.',
    relatedIds: ['vitamina-deficiency-xerophthalmia', 'vitamina-toxicity-teratogenicity', 'body-tying-together'],
  },
  {
    id: 'body-brain-nervous-system',
    category: 'basicHealth',
    title: "The Brain Is Built Largely Out of Fat, and It Needs a Specific Kind",
    teaser: 'Roughly a quarter of the brain\'s own total fatty-acid content is one single fat this app already has a full deep-dive on -- and one mineral deficiency alone can cost a developing brain real, measurable IQ points.',
    summary:
      "Two real, separate nutrient stories define how diet shapes the brain, one structural and one developmental. Structurally: long-chain polyunsaturated fatty acids make up 40-45% of the adult brain's own total lipid content, and within that share, DHA (the same omega-3 fat already covered in full in this app's own Omega-3 & Omega-6 deep-dive) and arachidonic acid together represent roughly 25% of the brain's entire fatty-acid content -- DHA specifically is concentrated directly in the membranes of neurons and their synapses, where it keeps those membranes fluid enough for the rapid electrical signaling underneath every thought, memory, and decision. Developmentally, the story is iodine's, not fat's: the thyroid gland uses dietary iodine to build the T3 and T4 hormones that directly regulate a developing brain's own construction process, neuron growth, migration, and the myelin insulation wrapped around nerve fibers, and insufficient iodine during pregnancy and early infancy is described directly in the clinical literature as the world's leading preventable cause of impaired brain development. The real, measured cost in genuinely iodine-deficient communities: children lose an estimated 10 to 15 IQ points on average compared to similar, non-deficient populations, and an estimated 19 million babies are born every year still at real risk of this same preventable harm. Two entirely different real mechanisms, structural fat and a hormone-building mineral, both converging on the same organ.",
    citations: [
      {
        source: 'Sambra V, et al. 2021, Nutrients 13(3):986: "Docosahexaenoic and Arachidonic Acids as Neuroprotective Nutrients throughout the Life Cycle"',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8003191/',
      },
      {
        source: 'UNICEF: "Nearly 19 million newborns at risk of brain damage every year due to iodine deficiency"',
        url: 'https://www.unicef.org/press-releases/newborns-brain-damage-iodine-deficiency',
      },
    ],
    overallTier: 'strong',
    stageNote: 'Both the DHA/brain-lipid composition and the iodine/neurodevelopment findings are well-established, widely replicated science, not preliminary or contested.',
    relatedIds: ['omega36-tying-together', 'iodine-deficiency-global-real-data', 'body-tying-together'],
  },
  {
    id: 'body-skin-integumentary',
    category: 'basicHealth',
    title: "Skin Is the Body's Largest Organ, and It Does Real Manufacturing Work",
    teaser: "It's not just a covering. Skin makes vitamin D from sunlight, needs collagen to hold itself together, and can develop its own real, distinct rash from a deficiency this app already covers in a completely different context.",
    summary:
      "Skin is the body's largest organ by both weight and surface area, and it does more than simply cover everything underneath it. When ultraviolet light from the sun strikes a cholesterol-derived compound already present in skin cells, it triggers the first of several real steps converting that compound into active vitamin D, already covered in full, with real citations, in this app's own Vitamin D deep-dive -- meaning skin is directly, physically involved in a hormone-production chain that ultimately affects bone health, immune function, and more, a real, literal example of one organ manufacturing something another organ downstream depends on. Skin's own structural integrity depends heavily on collagen, a protein whose synthesis genuinely requires vitamin C as a direct chemical cofactor -- severe, prolonged vitamin C deficiency causes scurvy, whose real, classic skin signs (bleeding around hair follicles, poor wound healing, easy bruising) are already covered in this app's own Vitamin C deep-dive, and are a direct, visible consequence of collagen synthesis genuinely failing. Zinc deficiency produces its own real, distinct, and different skin picture: a real, named condition (acrodermatitis enteropathica, whether from a rare inherited zinc-transporter defect or from severe acquired deficiency) causes a real, classic triad of periorificial skin inflammation, diarrhea, and hair loss, tying this one nutrient directly to skin, gut, and hair all at once. Skin, in other words, is simultaneously an endocrine gland, a structural barrier, and a real, visible early warning sign for at least two separate nutrient deficiencies playing out elsewhere in the body.",
    citations: [
      {
        source: 'Genomics Education Programme, NHS England: "Acrodermatitis enteropathica"',
        url: 'https://www.genomicseducation.hee.nhs.uk/genotes/knowledge-hub/acrodermatitis-enteropathica/',
      },
    ],
    overallTier: 'strong',
    stageNote: 'Vitamin D skin synthesis and the vitamin C/collagen link are settled physiology. Acrodermatitis enteropathica is a real, well-documented condition, most classically described in its rarer, inherited form.',
    relatedIds: ['vitamind-overview', 'vitaminc-deficiency-scurvy', 'zinc-deficiency-symptoms-staged', 'body-hair-growth-cycle', 'body-tying-together'],
  },
  {
    id: 'body-hair-growth-cycle',
    category: 'basicHealth',
    title: "Hair Loss Has a Real Nutrient Signature, and It's Not the One Most Often Blamed",
    teaser: "Iron and zinc show up as real, measured predictors of nutrient-driven hair loss. A real, direct study found the one nutrient most commonly blamed for it, biotin, didn't.",
    summary:
      "Hair follicles cycle continuously through real, distinct growth phases (anagen, the active growth phase; telogen, a resting phase before the hair sheds), and a real, named condition, telogen effluvium, describes excessive shedding after an unusually large share of follicles are pushed prematurely into that resting phase at once, often following a real physical stressor -- illness, major blood loss, rapid weight change, or a genuine nutrient shortfall. A real, direct 2024 study systematically measured blood iron/ferritin, zinc, copper, selenium, vitamin B12, vitamin D, thyroid function, and biotin in people diagnosed with telogen effluvium against real, matched controls, to see which of these popularly-blamed nutrients actually showed a real, measurable difference. Low ferritin (the body's own iron-storage marker) and an abnormal zinc/copper ratio both came back as real, statistically significant predictors, physiologically sensible given iron's own role in transporting the oxygen hair follicles need to keep growing. Biotin, despite being the single most commonly marketed hair-growth supplement, showed no significant difference between the telogen effluvium group and the healthy controls -- a real, direct correction to a very widely repeated claim, not a reason to think biotin deficiency is never real (this app's own B-Vitamins deep-dive covers when it genuinely does matter), just a reason not to assume it's the default explanation for ordinary hair shedding.",
    citations: [
      {
        source: 'Durusu Turkoglu G, et al. 2024, Journal of Cosmetic Dermatology: "A comprehensive investigation of biochemical status in patients with telogen effluvium"',
        url: 'https://pubmed.ncbi.nlm.nih.gov/39107936/',
      },
    ],
    overallTier: 'moderate',
    stageNote: 'A real, direct clinical study with a real, honest null result for biotin specifically -- included precisely because it corrects a widely repeated claim rather than confirms it.',
    relatedIds: ['iron-deficiency-symptoms-staged', 'zinc-deficiency-symptoms-staged', 'body-skin-integumentary', 'body-tying-together'],
  },
  {
    id: 'body-muscular-system',
    category: 'basicHealth',
    title: "Muscle Is Something the Body Actively Decides Whether to Keep",
    teaser: "Real, measured data: older adults eating the most protein lost 40% less muscle over three years than those eating the least, at the exact same calorie level.",
    summary:
      "Skeletal muscle isn't a fixed amount of tissue the body simply maintains by default -- it's actively broken down and rebuilt in a real, ongoing balance, and that balance genuinely tips based on how much protein is actually available to rebuild it, especially with age. A real, large, well-designed study (Houston et al. 2008, tracking 2,066 community-dwelling adults aged 70-79 over three years with real DXA-scanned lean-mass measurements, not self-report) found people in the highest quintile of dietary protein intake lost roughly 40% less lean muscle mass over that period than people in the lowest quintile, independent of total calorie intake. This real, measurable, age-related muscle loss has its own name, sarcopenia, and its real, global prevalence climbs sharply with age -- roughly 5-13% of people in their 60s, rising to as high as 50% of the oldest adults in some populations -- with real, documented downstream consequences for falls, frailty, and mortality risk, not just strength or appearance. Muscle's own real dependence on nutrition doesn't stop at protein: potassium and magnesium are both required for the electrical signal that actually triggers a muscle fiber to contract in the first place, and vitamin D deficiency is separately, directly linked to real muscle weakness, connecting this system straight back to the same vitamin already covered for bone and skin.",
    citations: [
      {
        source: 'Houston DK, et al. 2008, American Journal of Clinical Nutrition: "Dietary protein intake is associated with lean mass change in older, community-dwelling adults"',
        url: 'https://pubmed.ncbi.nlm.nih.gov/18175749/',
      },
    ],
    overallTier: 'strong',
    stageNote: 'A real, large, well-designed prospective cohort with objectively measured (not self-reported) lean mass -- one of the more directly quantified findings in this whole shelf.',
    relatedIds: ['protein-tying-together', 'potassium-tying-together', 'magnesium-tying-together', 'body-tying-together'],
  },
  {
    id: 'body-cardiovascular-electrolytes',
    category: 'basicHealth',
    title: "The Heartbeat Itself Is an Electrical Event, Run on Two Minerals at Once",
    teaser: "Potassium and magnesium don't just each have their own separate effect on the heart. Real research finds the combination of low levels in both is a genuinely worse, more dangerous state than either alone.",
    summary:
      "Every real heartbeat is driven by an electrical signal moving through heart-muscle cells, generated by potassium, sodium, calcium, and magnesium ions physically moving across each cell's own membrane in a precise, repeating sequence -- not a metaphor, a literal electrical event this app's own Potassium and Magnesium deep-dives already cover the individual nutrient side of. What a real, dedicated 2022 review adds is the connective piece: magnesium is directly required to maintain normal intracellular potassium levels, meaning a real magnesium shortfall can produce functional potassium problems inside heart cells even when a standard blood potassium test still reads normal. Magnesium separately blocks excess calcium from flooding into heart cells and helps regulate the potassium channels responsible for the heart's own electrical reset between beats -- when magnesium runs low, both of those protective functions weaken at once, a real, documented reason low blood magnesium is associated with as much as a 50% higher risk of atrial fibrillation in some studied populations. Low potassium adds its own real, independent risk on top of that by directly increasing electrical instability in heart tissue. The clinical upshot, stated plainly by cardiology's own literature: a person genuinely low in both minerals at once sits in a real, measurably more dangerous state than either deficiency would produce alone -- exactly the kind of interaction this app's own Nutrient Interactions research already documents for other nutrient pairs, now shown to matter for the heart's own basic electrical rhythm.",
    citations: [
      {
        source: "Rafaqat S, Rafaqat S, Khurshid H, et al. 2022, International Journal of Arrhythmia 23:15: \"Electrolyte's imbalance role in atrial fibrillation: Pharmacological management\"",
        url: 'https://doi.org/10.1186/s42444-022-00065-z',
      },
    ],
    overallTier: 'strong',
    stageNote: 'Real, well-established cardiac electrophysiology, with a real, current review specifically quantifying the combined-deficiency risk.',
    relatedIds: ['potassium-tying-together', 'magnesium-tying-together', 'interaction-tying-together', 'body-tying-together'],
  },
  {
    id: 'body-digestive-organs',
    category: 'basicHealth',
    title: "Digestion Isn't Just the Stomach and the Gut -- Two More Organs Do Real Work Before Food Ever Gets There",
    teaser: 'This app already covers the gut microbiome in real depth. Two organs upstream of it -- the pancreas and the gallbladder -- are the reason food is even in a shape the microbiome can use by the time it arrives.',
    summary:
      "This app's own extensive Gut & Microbiome research already covers what happens once food reaches the intestines in real depth. Two accessory organs do essential, real work well before that point. The pancreas releases pancreatic juice directly into the small intestine, a real mixture of digestive enzymes (breaking down starches, fats, and proteins into pieces small enough to actually absorb) and bicarbonate, which neutralizes the strongly acidic fluid arriving straight from the stomach so the intestine's own tissue and enzymes aren't damaged by it. The gallbladder, meanwhile, stores and concentrates bile made by the liver, releasing it into the intestine in response to a real hormone (cholecystokinin) triggered specifically by fat arriving in the gut -- bile's own job is to physically emulsify large fat globules into much smaller droplets, the exact same physical principle dish soap uses on grease, without which dietary fat and the fat-soluble vitamins A, D, E, and K genuinely cannot be absorbed properly. Stomach acid itself does a third, separate, real job upstream of both of these: it's required to free vitamin B12 from the animal protein it's normally bound to, already covered in full in this app's own B12 deep-dive, meaning a person on long-term acid-suppressing medication is at real, documented risk of B12 deficiency for a reason that has nothing to do with how much B12 is actually in their diet. Three separate organs, three separate real mechanical or chemical jobs, all completed before food ever reaches the gut microbiome this app's own research already covers in such depth.",
    citations: [
      {
        source: 'Physiology, Gallbladder. StatPearls, National Library of Medicine',
        url: 'https://www.ncbi.nlm.nih.gov/books/NBK482488/',
      },
    ],
    overallTier: 'strong',
    stageNote: 'Standard, well-established digestive physiology.',
    relatedIds: ['b12-absorption-mechanism', 'gut-scfa-treg', 'omega36-tying-together', 'body-tying-together'],
  },
  {
    id: 'body-endocrine-crosstalk',
    category: 'basicHealth',
    title: "Hormones Don't Work in Separate Lanes -- They Constantly Talk to Each Other",
    teaser: "This app already has real, dedicated research on insulin, cortisol, thyroid hormones, and sex hormones individually. This entry is the wiring diagram showing how they actually influence each other.",
    summary:
      "This app's own Hormones deep-dive already covers insulin, cortisol, thyroid hormones, leptin and ghrelin, and estrogen and testosterone individually, each with its own real mechanism and citations. What that individual coverage doesn't fully capture on its own is how directly these systems lean on each other in real time. Chronic stress and elevated cortisol, already covered in this app's own Lifestyle & Environment research, directly suppresses the enzymes that convert inactive thyroid hormone (T4) into its active form (T3), meaning a genuinely stressed HPA axis can produce real thyroid-level symptoms even when the thyroid gland itself is working normally. Insulin resistance runs its own real crosstalk into the sex hormones: elevated insulin directly stimulates the ovaries to overproduce androgens, a real, central mechanism behind PCOS already covered in full in that condition's own Digest content. And bone's own hormone, osteocalcin, covered above, closes the loop the other direction -- a skeletal tissue most people never think of as hormonal directly influences how sensitive the rest of the body is to insulin. None of these systems has a truly separate, walled-off lane. A real disruption in one (chronic stress, insulin resistance, or a nutrient deficiency undermining any of them) has a real, documented tendency to show up as a symptom in a completely different system, which is exactly why this app tracks and cross-references so many of them together rather than treating any single hormone as the whole story.",
    citations: [],
    overallTier: 'moderate',
    stageNote: "A real synthesis connecting citations already given individually in this app's own Hormones, Lifestyle & Environment, and PCOS research, not a new external claim of its own.",
    relatedIds: ['thyroid-hormones-overview', 'lifestyle-il6-deiodinase', 'pcos-insulin-resistance-mechanism', 'body-bones-teeth-skeleton', 'body-tying-together'],
  },
  {
    id: 'body-kidneys-liver-filtration',
    category: 'basicHealth',
    title: 'The Kidneys and Liver Are the Body\'s Own Real Clearance System, Splitting the Work Between Them',
    teaser: 'Every nutrient the body takes in eventually has to be dealt with by one of these two organs. Which one matters -- get it backwards and a real toxicity risk goes unrecognized.',
    summary:
      "The kidneys and liver together do the real, essential work of clearing out what the body doesn't need, but they divide that labor in a specific, real way worth actually knowing. The kidneys filter blood continuously, a genuinely water-soluble system by nature -- which is exactly why water-soluble nutrients like vitamin C and most B vitamins carry a real, low toxicity risk in a person with normal kidney function: any real excess is simply filtered out in the urine, already covered honestly in this app's own Vitamin C and B-Vitamins deep-dives. The liver, by contrast, is the body's primary processing site for fat-soluble compounds, including fat-soluble vitamins A, D, E, and K, which the kidneys can't efficiently clear the same way -- this is the direct, physiological reason vitamin A toxicity is a real, documented risk in a way vitamin C toxicity essentially isn't, already covered in this app's own Vitamin A deep-dive. Both organs depend on adequate hydration and blood flow to do this filtering work correctly, and both are genuinely vulnerable to the same real, chronic strain from a diet high in ultra-processed food and added sugar, already covered in this app's own Fatty Liver Disease and Chronic Kidney Disease research for what happens when that strain becomes a diagnosed condition. Even in someone without either disease, though, the basic division of labor holds: know whether a nutrient is water-soluble or fat-soluble, and you know, in broad strokes, which of these two organs is actually doing the real work of clearing it.",
    citations: [],
    overallTier: 'moderate',
    stageNote: "A real synthesis connecting several already-cited nutrient-toxicity entries elsewhere in this app around one shared organ-level mechanism, not a new external research claim of its own.",
    relatedIds: ['vitamina-toxicity-teratogenicity', 'vitaminc-toxicity-honest', 'masld-overview', 'ckd-overview', 'body-tying-together'],
  },
  {
    id: 'body-immune-system-nutrition',
    category: 'basicHealth',
    title: "The Immune System Runs on a Real Nutrient Budget, Not Willpower",
    teaser: "Fighting off an infection is genuinely expensive, metabolically. A body running short on the raw materials immune cells need doesn't get a weaker immune response by choice -- it simply can't build a full one.",
    summary:
      "Mounting a real immune response, producing antibodies, generating new immune cells, sustaining inflammation long enough to actually clear a pathogen, is genuinely resource-intensive work, and several specific nutrients are directly required inputs for it, not just generally supportive. Zinc is required for normal immune-cell development and function, and this app's own Zinc deep-dive already covers real, controlled trial evidence for zinc lozenges shortening the common cold. Vitamin C is concentrated at real, notably higher levels inside white blood cells than in blood plasma generally, consistent with its own real, active role in immune-cell function, not just its more famous collagen-synthesis job covered above. Vitamin D receptors exist directly on immune cells, and vitamin D deficiency is separately linked to real, increased infection susceptibility. And protein-energy malnutrition, the same real deficiency state behind kwashiorkor and marasmus already covered in this app's own Protein deep-dive, directly impairs the body's own ability to produce antibodies and immune cells at all, since those cells are themselves built out of protein. None of this means any single supplement reliably prevents illness -- it means a body that's already running short on these specific raw materials is working from a genuinely smaller real toolkit the moment it actually needs one, a direct, practical reason chronic nutrient deficiency and increased infection risk keep showing up together across the research this app already cites for several individual conditions.",
    citations: [],
    overallTier: 'moderate',
    stageNote: "A real synthesis connecting citations already given individually in this app's own Zinc, Vitamin C, Vitamin D, and Protein research, not a new external claim of its own.",
    relatedIds: ['zinc-immune-common-cold', 'vitaminc-overview', 'protein-deficiency-kwashiorkor-marasmus', 'body-tying-together'],
  },
  {
    id: 'body-respiratory-gas-exchange',
    category: 'basicHealth',
    title: 'The Lungs Do Their Real Work Across a Surface Folded Small Enough to Fit in Your Chest',
    teaser: "Roughly 300 million tiny air sacs, unfolded, would cover close to 80 square meters -- and the entire point of that enormous surface is getting oxygen onto the same iron molecule already covered in this app's own Iron research.",
    summary:
      "The lung's real, functional surface, the alveoli where oxygen actually crosses into the bloodstream and carbon dioxide crosses back out, is genuinely enormous for how compactly it's packed: an adult human has roughly 300 million individual alveoli, together providing around 80 square meters of real gas-exchange surface, with the wall between air and blood only about one cell thick on each side, a gap roughly 1/1000th of a millimeter. That entire structure exists for one real, singular purpose: loading oxygen onto hemoglobin, the same iron-built protein already covered in full in this app's own Iron deep-dive, and unloading the carbon dioxide cellular metabolism produces everywhere else in the body. A second, real, separate nutrient story plays out in this same organ, and it's more specific than \"vitamin D is generally good for immunity.\" A large, real individual-participant-data meta-analysis (25 randomized trials) found vitamin D supplementation reduced the odds of at least one acute respiratory infection overall, but honestly, only modestly (adjusted odds ratio 0.88, number needed to treat 33). What the same analysis found underneath that modest headline number is the real, more useful part: among participants who were genuinely vitamin D deficient at the start of the trial, the effect was far stronger (odds ratio 0.58, NNT 8), and stronger again among deficient participants given daily or weekly dosing specifically (odds ratio 0.30, NNT just 4). The real lesson isn't \"take vitamin D to avoid catching a cold\" as a blanket rule -- it's the same, already-established theme this app's own Vitamin D research covers elsewhere: a real, genuinely deficient body benefits far more from correcting that deficiency than an already-sufficient one gains from adding more on top.",
    citations: [
      {
        source: 'Khan YS, Carey FJ 2025, Histology, Lung, StatPearls, National Library of Medicine',
        url: 'https://www.ncbi.nlm.nih.gov/books/NBK534789/',
      },
      {
        source: 'Martineau AR, Jolliffe DA, Hooper RL, et al. 2017, BMJ 356:i6583: "Vitamin D supplementation to prevent acute respiratory tract infections: systematic review and meta-analysis of individual participant data"',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5310969/',
      },
    ],
    overallTier: 'strong',
    stageNote: 'The alveolar surface-area figure is settled anatomy. The vitamin D finding is a real, large individual-participant-data meta-analysis -- honestly reported here at its true, modest overall size, with the much stronger deficient-subgroup effect broken out separately rather than blended into one flattering headline number.',
    chart: {
      title: 'Vitamin D and Respiratory Infection: Number Needed to Treat',
      unit: 'people',
      data: [
        { label: 'Everyone in the trial', value: 33 },
        { label: 'Baseline vitamin D deficient', value: 8 },
        { label: 'Deficient + daily/weekly dosing', value: 4 },
      ],
      sourceNote: 'Martineau et al. 2017, BMJ -- lower is a stronger effect; this is how many people need supplementing to prevent one infection.',
    },
    relatedIds: ['iron-overview', 'vitamind-2024-guideline-honest-correction', 'vitamind-deficiency-prevalence', 'body-cardiovascular-electrolytes', 'body-tying-together'],
  },
  {
    id: 'body-respiratory-magnesium-asthma',
    category: 'basicHealth',
    title: "Magnesium's Reach Extends to the Lungs Too -- With a Real Mechanism More Settled Than the Outcome Evidence",
    teaser: 'A mineral this app already covers for the heart, muscle, and bone has a genuine emergency-medicine use for severe asthma -- but real, honest systematic reviews disagree on how much it actually changes hospital admissions.',
    summary:
      "Magnesium's real, physical mechanism for relaxing airway smooth muscle is well understood pharmacology, not a contested idea: it acts as a real calcium antagonist, blocking excess calcium from entering the smooth-muscle cells lining the airways, the same basic calcium-blocking action already covered in this app's own cardiovascular electrolytes entry, here relaxing airway muscle instead of regulating heart rhythm. That real mechanism is why intravenous magnesium sulfate has a genuine, established place in emergency medicine as a real adjunct treatment for severe asthma exacerbations that haven't responded to first-line inhaled bronchodilators and steroids, a use British Thoracic Society guidance has directly recommended. What's genuinely less settled, and worth reporting honestly rather than smoothed over: real systematic reviews looking at hard outcomes, not just the underlying mechanism, disagree with each other. A 2023 review of nine studies found no statistically significant improvement in peak expiratory flow from IV magnesium, with only two of eight studies showing reduced hospital admission; nebulized magnesium showed a larger effect on lung-function measurements in the same review but not a clearer benefit on actual admission rates. A separate 2022 literature review states plainly that \"the usefulness of magnesium in the treatment of acute asthmatic episodes is unclear,\" while still noting some individual studies do show reduced admissions, and calls for real, better-designed trials rather than treating the question as closed. Magnesium's real reach into the lungs, in other words, is genuine, but it's a case where the mechanism is more settled than the clinical payoff -- one more real example of the same nutrient mattering to an organ well outside whatever its \"main job\" seems to be.",
    citations: [
      {
        source: 'Rovsing AH, Savran O, Ulrik CS 2023, Frontiers in Allergy: "Magnesium sulfate treatment for acute severe asthma in adults -- a systematic review and meta-analysis"',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10420062/',
      },
      {
        source: 'Bokhari SA, et al. 2022, Cureus: "Role of Intravenous Magnesium in the Management of Moderate to Severe Exacerbation of Asthma: A Literature Review"',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9543098/',
      },
    ],
    overallTier: 'moderate',
    stageNote: "Tagged at the honesty of its weakest real support, per this app's own standing rule: the calcium-antagonist mechanism is settled pharmacology, but the actual clinical-outcome evidence across independent systematic reviews is genuinely mixed, not just under-studied.",
    relatedIds: ['magnesium-tying-together', 'body-cardiovascular-electrolytes', 'body-muscular-system', 'body-tying-together'],
  },
  {
    id: 'body-reproductive-egg-supply-vs-sperm-production',
    category: 'basicHealth',
    title: 'One Reproductive System Starts With a Fixed Supply Before Birth. The Other Never Stops Manufacturing.',
    teaser: 'A real, striking asymmetry: the female body reaches its highest-ever egg count before it is even born, then only loses ground from there. The male body starts a brand-new, roughly 65-day production run continuously, for life.',
    summary:
      "The two halves of the human reproductive system don't just look physically different, they run on two genuinely different real production models. Oogenesis, egg development, is a real, finite, front-loaded process: the number of oocytes actually peaks before birth, reaching roughly 6-7 million by mid-gestation, then falls sharply through a real, natural process called atresia to approximately 2 million by the time of birth itself, and continues declining from there through childhood, puberty, and the entire reproductive lifespan, already covered in full for what that decline means hormonally in this app's own Estrogen & Progesterone and Perimenopause research. There is no real mechanism to make more eggs later -- the entire lifetime supply is set before a person is even born. Spermatogenesis runs on the opposite real model entirely: a continuous, ongoing manufacturing process, with a fresh cycle from stem cell to mature sperm taking roughly 65 days in humans, restarting indefinitely rather than drawing down a fixed reserve. That real, roughly two-month production cycle has a genuinely practical consequence worth naming directly: a semen sample taken today largely reflects diet, health, and lifestyle from the past two to three months, not yesterday's choices, the real reason fertility-focused nutrition changes (already covered in this app's own Zinc research below) take real time to show up in results. One more real, direct consequence of just how early and fast the female side of this system moves: the neural tube, the structure that becomes the brain and spinal cord, closes within the first 21 to 28 days after conception, a window that's often over before a pregnancy is even recognized. That single, narrow timing fact is the actual, physical reason this app's own Folate research treats adequate intake as something to already have in place before conception, not something to start once a pregnancy test comes back positive.",
    citations: [
      {
        source: 'Park SU, Walsh L, Berkowitz KM 2021, Reproduction 162(2):R19-R33: "Mechanisms of ovarian aging"',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9354567/',
      },
      {
        source: 'Gilbert SF, Developmental Biology, 6th edition, NCBI Bookshelf: "Spermatogenesis"',
        url: 'https://www.ncbi.nlm.nih.gov/books/NBK10095/',
      },
      {
        source: 'Singh R, Munakomi S 2023, Embryology, Neural Tube, StatPearls, National Library of Medicine',
        url: 'https://www.ncbi.nlm.nih.gov/books/NBK542285/',
      },
    ],
    overallTier: 'strong',
    stageNote: 'Settled, well-established developmental biology across all three claims -- the real value here is connecting facts this app already had scattered (perimenopause, folate timing) back to the underlying reproductive-biology mechanism driving both.',
    relatedIds: ['estrogen-progesterone-cycle', 'estrogen-progesterone-perimenopause', 'organ-reproductive-fertility', 'folate-neural-tube-defects', 'body-reproductive-zinc-fertility', 'body-tying-together'],
  },
  {
    id: 'body-reproductive-zinc-fertility',
    category: 'basicHealth',
    title: "Zinc's Reach Extends Into Fertility Too, With Real Mechanisms and a Genuinely Mixed Supplement Verdict",
    teaser: "This app's own Zinc research already covers immune function, skin, and wound healing. Add sperm production to that list -- along with an honest, real complication: does supplementing it actually help?",
    summary:
      "Zinc's real, direct role in male fertility runs deeper than a single mechanism: it's required for normal testicular development, sperm production itself, and protecting existing sperm from degradation, and a real, current 2025 review lays out the actual physiological damage genuine deficiency causes -- gonadal dysfunction, reduced testicular size, damage to the testosterone-producing Leydig cells, impaired spermatogenesis, and real oxidative stress that directly harms sperm DNA and membrane integrity. In men with clinically low seminal zinc specifically, the same real research found measurably lower semen volume, sperm count, motility, and normal sperm morphology, alongside lower testosterone, already covered for its own broader role in this app's own Testosterone research. Where the real, honest complication comes in: whether supplementing zinc actually fixes any of this in practice is genuinely less settled than the deficiency mechanism itself. The same 2025 review reports that one meta-analysis pooling eight separate studies found no significant improvement in sperm parameters from zinc supplementation, even as earlier, individual studies had reported real gains in sperm volume, motility, and morphology. That's not a contradiction to smooth over -- it's a real, honest picture already familiar from elsewhere in this app: a nutrient can be genuinely, mechanistically essential to an organ system, and still have supplementation trials that don't reliably confirm a benefit once someone's own zinc status is already adequate to begin with, the identical pattern this app's own vitamin D research already shows for respiratory infection risk, above.",
    citations: [
      {
        source: 'Zečević N, Veselinović A, Perović M, Stojsavljević A 2025, Antioxidants (Basel) 14(2):165: "Association Between Zinc Levels and the Impact of Its Deficiency on Idiopathic Male Infertility: An Up-to-Date Review"',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11851646/',
      },
    ],
    overallTier: 'moderate',
    stageNote: "The deficiency mechanism itself is well documented. Tagged at the honesty of the weaker, genuinely mixed supplementation-trial evidence, per this app's own standing rule for reporting a real null finding alongside a real mechanism rather than only the more flattering half.",
    relatedIds: ['zinc-overview', 'zinc-tying-together', 'testosterone-overview-function', 'body-reproductive-egg-supply-vs-sperm-production', 'body-tying-together'],
  },
  {
    id: 'body-tying-together',
    category: 'basicHealth',
    title: 'Putting It Together: One Deficiency, Told Across Five Organs at Once',
    teaser: "Pick almost any nutrient covered above and follow it. It rarely stays inside one organ's own story for long.",
    summary:
      "Take vitamin D as the clearest real example of how little this shelf's own organ-by-organ structure actually reflects how the body works. A person genuinely short on vitamin D doesn't experience one clean, isolated symptom. In bone, insufficient vitamin D means dietary calcium can't be absorbed properly, so the body compensates by pulling calcium out of bone itself to keep blood calcium stable, the real mechanism behind osteomalacia and, over years, real measurable bone loss. In muscle, the same deficiency is separately, directly linked to real weakness, since muscle tissue carries its own vitamin D receptors. In the immune system, vitamin D receptors on immune cells mean the same shortfall measurably raises infection risk. In the endocrine system, it can worsen insulin resistance, feeding directly into the same hormone crosstalk already covered above. And because skin is where vitamin D synthesis actually begins, a genuinely low-sun lifestyle can start this entire chain before diet is even the limiting factor. One nutrient. Five real, separately documented effects, in five different organs, all traceable back to the exact same shortfall. This is the real, practical reason this app tracks whole meals and whole days rather than single foods in isolation, and why its own Insights tab reports on dozens of nutrients together rather than one at a time: a body doesn't experience nutrition one organ at a time, it experiences it as one continuous, interconnected system, and the honest picture of anyone's own health has to be read the same way.",
    citations: [],
    overallTier: 'strong',
    stageNote: 'A closing synthesis drawing on the real, individually-cited vitamin D research already given in this app\'s own Vitamin D deep-dive and throughout this shelf, not a new claim of its own.',
    relatedIds: [
      'body-systems-overview',
      'body-bones-teeth-skeleton',
      'body-muscular-system',
      'body-immune-system-nutrition',
      'body-endocrine-crosstalk',
      'body-skin-integumentary',
      'vitamind-overview',
    ],
  },
];
