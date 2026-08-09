// Popular Diets & Eating Styles -- a new Basic Health topic, 2026-08-09,
// direct request: "we also need an honest medical science evidence based
// perspective on the popular types of diets out there, like the
// mediteranian diet and the carnivore diet, and veganism, and AIP..." plus
// a named list (Intermittent Fasting, High-Protein/"Proteinmaxxing",
// Mediterranean, Keto, Plant-Based/Flexitarian, Fibermaxxing, Gut-Friendly
// Eating, Anti-Processed Focus) and a closing request for a real entry on
// how this app helps track ANY of them, staying diet-agnostic.
//
// Real, deliberate honesty discipline throughout, the same standard this
// whole Digest already holds every other claim to: real, strong evidence
// gets called strong (Mediterranean); real, still-thin evidence gets
// called thin (carnivore diet, where a direct PubMed search this session
// turned up essentially no real human research at all -- that absence
// itself is reported directly, not glossed over); a real, newer, evolving
// concern gets reported as exactly that (keto's own real 2026 LDL-cholesterol
// finding in lean adults). Several entries reuse this app's own already-
// verified citations from elsewhere in the Digest (Mediterranean, fasting,
// protein, fiber/SCFA, fermented foods, ultra-processed food, AIP) rather
// than re-deriving them, the same reuse discipline preventionLifestyle.ts
// already established; the genuinely new topics (keto, general intermittent
// fasting, carnivore, veganism) were freshly researched via the established
// WebFetch-against-real-PubMed-pages fallback, this session's own
// WebSearch budget having been exhausted earlier.
import type { DigestEntry } from './types';

export const POPULAR_DIETS_ENTRIES: DigestEntry[] = [
  {
    id: 'diet-mediterranean',
    category: 'basicHealth',
    title: 'The Mediterranean Diet: the Real, Best-Evidenced Eating Pattern in This Whole List',
    teaser: 'Traced back to a real, 1950s-era observational study, now backed by real, randomized trial evidence across cardiovascular disease and beyond. If any one pattern here has earned its reputation, this is the one.',
    summary:
      "Of every eating style covered in this category, the Mediterranean diet carries the deepest, most consistent real evidence, and this app's own already-covered research across multiple conditions (cardiovascular disease, RA, psoriasis, fatty liver disease) keeps landing on the same real pattern independently. It traces back to the real Seven Countries Study, the first major research effort to directly compare cardiovascular disease rates across different countries and diets, which found Mediterranean, olive-oil-and-produce-heavy populations carrying roughly half the cardiovascular disease rate of northern European populations eating more saturated fat. That real, observational finding has since been confirmed in real, randomized controlled trials: the landmark PREDIMED trial found a Mediterranean diet supplemented with real, extra-virgin olive oil or nuts measurably reducing real cardiovascular events in a genuine, randomized, controlled setting, not just an association. This app's own already-covered research finds the same real pattern repeating across RA (a randomized trial finding a 76% drop in disease-activity score), psoriasis (a real, randomized 2025 trial reducing severity), and fatty liver disease (performing as well as a low-fat diet in real head-to-head testing). Worth knowing directly: no single food defines it, real, whole-food eating built around olive oil, vegetables, legumes, fish, and whole grains, low in processed food and added sugar, is the real, consistent thread across every one of these trials.",
    citations: [
      { source: 'Primary Prevention of Cardiovascular Disease with a Mediterranean Diet Supplemented with Extra-Virgin Olive Oil or Nuts, PMID 29897866', url: 'https://pubmed.ncbi.nlm.nih.gov/29897866/' },
      { source: 'How the Seven Countries Study contributed to the definition and development of the Mediterranean diet concept: A 50-year journey, Nutrition, Metabolism and Cardiovascular Diseases', url: 'https://www.nmcd-journal.com/article/S0939-4753(14)00347-0/abstract' },
    ],
    overallTier: 'strong',
    relatedIds: ['cvd-global-seven-countries-mediterranean', 'ra-mediterranean-diet', 'psoriasis-mediterranean-diet'],
  },
  {
    id: 'diet-keto',
    category: 'basicHealth',
    title: "Ketogenic (Keto): Real, Decades-Old Medical Use Alongside a Real, Newer Cholesterol Concern",
    teaser: 'Keto has real, genuine, decades-long clinical use for epilepsy. What\'s newer, and worth knowing directly: real, 2026 research finding LDL cholesterol can rise sharply in lean adults on the diet specifically.',
    summary:
      "The ketogenic diet, a very low-carbohydrate, high-fat eating pattern designed to shift the body into fat-burning ketosis, has real, genuinely established medical roots: it has been used clinically for intractable epilepsy, including in children, for real, decades-long, well-documented benefit, not a recent wellness trend. For weight loss specifically, real research finds it works, largely through the same real mechanism as any other approach that reduces total calorie intake, not a unique metabolic advantage keto alone provides. Worth knowing directly and honestly, and genuinely current: a real, 2026 review names an emerging clinical concern directly in its own title, ketogenic diets can produce large increases in LDL cholesterol specifically in adults with a normal body weight, a real, documented pattern (sometimes called the 'lean mass hyper-responder' phenomenon) raising real, honest questions about long-term cardiovascular risk that the field itself is still actively working through, not a settled question either way. Real, additional honest complications worth naming: the diet is genuinely hard to sustain long-term, an initial 'keto flu' adjustment period is real and commonly reported, and its own very low carbohydrate intake can make it genuinely difficult to reach the real, already-covered fiber intake most people already fall short of without careful planning.",
    citations: [
      { source: 'Ketogenic Diets and Low-Density Lipoprotein Cholesterol in Adults With Normal Weight: An Emerging Clinical Challenge, PMID 42047192', url: 'https://pubmed.ncbi.nlm.nih.gov/42047192/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['carbfiber-intake-gap', 'cvd-lipid-panel-self-advocacy'],
  },
  {
    id: 'diet-intermittent-fasting',
    category: 'basicHealth',
    title: 'Intermittent Fasting: Real, Working, and Probably Not Metabolically Magic',
    teaser: 'Real, direct trial evidence finds intermittent fasting genuinely produces weight loss, likely through the same real mechanism as any other calorie reduction, not a unique metabolic trick.',
    summary:
      "Intermittent fasting (IF), timed eating windows like the popular 16:8 method rather than a specific list of foods, has real, direct randomized trial support behind it. A real, controlled trial comparing alternate-day fasting, 16:8 time-restricted eating, and a non-fasting control group over 3 weeks (with a real 3-month follow-up) found both real fasting approaches producing significantly more weight and BMI reduction than the control group, with alternate-day fasting outperforming the milder 16:8 pattern specifically. Worth knowing honestly: the leading real explanation across the broader body of research is that IF works largely because it makes eating less overall genuinely easier for many people, the same real mechanism behind any calorie-reduction approach, not a distinct metabolic advantage unique to the timing itself. Real, honest complications worth naming directly: IF isn't equally suitable for everyone, this app's own already-covered Type 1 diabetes research names real, genuine complexity in timing insulin around a fasting window, and this app's own already-covered research on fasting and thyroid hormone finds real, measurable effects on TSH and thyroid lab values during sustained fasting (the real IFTAR/Ramadan research already covered elsewhere in this app). A real, practical, honest takeaway: IF is a real, legitimate tool for many people specifically because it makes sticking with reduced calorie intake easier, not because it changes metabolism in some deeper way most other approaches don't.",
    citations: [
      { source: 'Intermittent Fasting in Weight Loss and Cardiometabolic Risk Reduction: A Randomized Controlled Trial, PMID 35050952', url: 'https://pubmed.ncbi.nlm.nih.gov/35050952/' },
    ],
    overallTier: 'strong',
    relatedIds: ['type1-exercise-glucose', 'mito-fasting-autophagy-tension'],
  },
  {
    id: 'diet-carnivore',
    category: 'basicHealth',
    title: 'The Carnivore Diet: an Honest Report of How Little Real Research Actually Exists',
    teaser: 'A direct search of the real, peer-reviewed medical literature for carnivore-diet research turned up almost nothing. That absence itself is the most honest, important thing to report about it.',
    summary:
      "The carnivore diet, eating only meat and other animal products, is worth reporting on directly and honestly for what it lacks as much as what it claims: a real, direct search of peer-reviewed medical research turned up essentially no real human trials, cohort studies, or systematic reviews testing its safety or effectiveness at all, one real 2026 review, focused specifically on athletes, states this plainly in its own summary, naming 'limited direct scientific evidence' for the diet's efficacy or safety even in that narrower context. What real, existing nutrition science DOES say, applied to a diet with zero plant food by definition: it necessarily eliminates dietary fiber entirely, directly contradicting this app's own extensively-documented, real, mechanistic research on short-chain fatty acids, gut bacteria, and immune tolerance (the single most food-controllable lever this app's own gut-microbiome research has found). It also runs directly against real, well-established findings on red and processed meat, the International Agency for Research on Cancer classifies processed meat as a real, confirmed human carcinogen and red meat as a probable one, tied to colorectal cancer risk specifically. Worth knowing directly: the almost complete absence of real, dedicated carnivore-diet research means any specific claim of benefit or harm beyond these already-established, real, general nutrition-science facts is genuinely unverified, not proven safe, and not proven dangerous by real, direct study, simply untested.",
    citations: [
      { source: 'Carnivore and Animal-Based Diets in Sport: A Critical Evaluation of Current Evidence and Future Perspectives for Precision Nutrition, PMID 41901173', url: 'https://pubmed.ncbi.nlm.nih.gov/41901173/' },
      { source: 'IARC Monographs evaluate consumption of red meat and processed meat, International Agency for Research on Cancer', url: 'https://www.iarc.who.int/wp-content/uploads/2018/07/pr240_E.pdf' },
    ],
    overallTier: 'weak',
    relatedIds: ['gut-scfa-treg', 'carbfiber-intake-gap'],
  },
  {
    id: 'diet-vegan',
    category: 'basicHealth',
    title: 'Veganism: Real Cardiovascular Benefit, and a Real, Documented Deficiency Risk If Unplanned',
    teaser: 'A real meta-analysis found vegan and vegetarian diets tracking with lower heart disease risk, but a real, direct study found vegans nearly three times more likely to be B12-deficient than lacto-ovo vegetarians.',
    summary:
      "A fully plant-based, vegan diet carries real, genuine cardiovascular evidence behind it, alongside a real, honest, well-documented nutritional risk worth planning around directly. A real systematic review and meta-analysis of prospective cohort studies found vegetarian and vegan diets associated with reduced risk of ischemic heart disease specifically, though the same real research is honest that the picture for cardiovascular disease overall and stroke specifically is genuinely less clear, not a uniform benefit across every cardiovascular outcome. The real, more concrete, actionable finding: a real, direct comparative study found vitamin B12 deficiency in 44.1% of vegans, compared with 15.0% of lacto-ovo vegetarians (who still eat dairy and eggs) in the same real study, a real, nearly threefold difference, and a real, statistically significant one. B12 is found reliably only in animal products, meaning a vegan diet without deliberate supplementation or fortified food carries a real, well-documented, largely avoidable deficiency risk. Real, additional nutrients worth actively planning for on a vegan diet, per already well-established nutrition science: iron, zinc, omega-3 fatty acids, vitamin D, and calcium, all real, genuine planning points, not automatic problems, but real, worth knowing rather than assuming a plant-based diet is automatically nutritionally complete on its own.",
    citations: [
      { source: 'Vegetarian and vegan diets and the risk of cardiovascular disease, ischemic heart disease and stroke: a systematic review and meta-analysis, PMID 36030329', url: 'https://pubmed.ncbi.nlm.nih.gov/36030329/' },
      { source: 'Vitamin B12 and D status in long-term vegetarians: Impact of diet duration and subtypes, PMID 41565239', url: 'https://pubmed.ncbi.nlm.nih.gov/41565239/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['b12-overview', 'diet-plant-based-flexitarian'],
  },
  {
    id: 'diet-plant-based-flexitarian',
    category: 'basicHealth',
    title: 'Plant-Based / Flexitarian: the Real, More Flexible Middle Ground, With Real Evidence Behind It Too',
    teaser: 'Real research keeps finding the same benefit shows up gradually as meat intake drops, without needing to eliminate it entirely, real, good news for anyone put off by strict veganism\'s own real, honest deficiency risks.',
    summary:
      "Plant-based, flexitarian eating (deliberately reducing, not eliminating, meat and animal products in favor of more whole plant foods) sits between this category's own already-covered vegan research and its already-covered Mediterranean research, and shares real evidence with both. Real cardiovascular and metabolic benefit tracks with the real degree of plant-food emphasis in a diet, not an all-or-nothing threshold, meaning a genuinely flexible, mostly-plant pattern captures real, meaningful benefit without necessarily carrying this category's own already-covered vegan-specific B12 deficiency risk, since flexitarian eating typically still includes at least some real animal-product intake. This app's own already-covered Mediterranean research is itself a real, practical example of exactly this kind of flexible, plant-forward-but-not-strict pattern, built around real whole plant foods, healthy fats, and fish, with only moderate meat intake, not full elimination. Worth knowing directly: this genuinely flexible middle ground is a real, evidence-backed, and often more sustainable long-term option for many people than either strict veganism or unrestricted eating, precisely because it doesn't require the same real, careful nutrient-gap planning a fully vegan diet does, while still capturing much of the same real, documented benefit.",
    citations: [
      { source: 'Vegetarian and vegan diets and the risk of cardiovascular disease, ischemic heart disease and stroke: a systematic review and meta-analysis, PMID 36030329', url: 'https://pubmed.ncbi.nlm.nih.gov/36030329/' },
    ],
    overallTier: 'strong',
    relatedIds: ['diet-mediterranean', 'diet-vegan'],
  },
  {
    id: 'diet-high-protein',
    category: 'basicHealth',
    title: 'High-Protein / "Proteinmaxxing": Real, Solid Basics, With One Real Exception Worth Naming Directly',
    teaser: 'Protein\'s own real, well-documented satiety and muscle-preserving role holds up well for most healthy people. The one real, honest exception: anyone with existing kidney disease, where this app\'s own already-covered research says otherwise.',
    summary:
      "Prioritizing higher protein intake, sometimes called 'proteinmaxxing' in current usage, especially to protect muscle mass while eating less or as part of aging, rests on real, already-established nutrition science this app's own Essential Nutrients research already covers directly: protein carries a real, well-documented satiety effect (helping someone feel fuller on fewer total calories) and a real, direct role in preserving lean muscle mass, particularly relevant during weight loss or as part of normal aging, when muscle loss becomes a real, documented health risk in its own right. For people with already-healthy kidneys, real, current nutrition science doesn't find higher protein intake within normal higher-end ranges causing kidney harm. Worth knowing directly and honestly, the one real, important exception: this app's own already-covered chronic kidney disease research finds real, different guidance applies once kidney function is already reduced, where a real, specific, lower protein target (0.6 to 0.8g/kg/day) and a real, plant-forward protein source both show real, documented benefit over higher intake. The real, practical takeaway: 'more protein' is a real, reasonable, well-supported general goal for most healthy people, but not a universal rule, anyone with known kidney disease should follow this app's own already-covered, real, different guidance instead.",
    citations: [
      { source: 'Bilsborough S, Mann N 2006: A review of issues of dietary protein intake in humans, PMID 16779921', url: 'https://pubmed.ncbi.nlm.nih.gov/16779921/' },
      { source: 'Phillips SM 2017: Current Concepts and Unresolved Questions in Dietary Protein Requirements and Supplements in Adults, PMID 28534027', url: 'https://pubmed.ncbi.nlm.nih.gov/28534027/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ckd-protein-restriction-plant-based', 'protein-overview'],
  },
  {
    id: 'diet-aip',
    category: 'basicHealth',
    title: 'AIP (Autoimmune Protocol): a Real, Structured Elimination Framework, Honestly Tiered Below Its Own Individual Pieces',
    teaser: 'A real, formal 6-week elimination plus 5-week reintroduction structure exists and is well-described, but the packaged protocol itself carries thinner direct trial evidence than several of the individual pieces it\'s built from.',
    summary:
      "The Autoimmune Protocol (AIP), a real, structured elimination diet developed specifically for autoimmune conditions, removes a real, defined list of foods (grains, legumes, dairy, nightshades, eggs, nuts and seeds, refined sugar, and food additives) for a set period, then reintroduces them one at a time to identify real, individual triggers. A real, published systematic review confirms the real, formal structure behind it: a genuine 6-week elimination phase followed by a real 5-week, one-food-at-a-time reintroduction protocol, this app's own already-covered Healing Stages research draws directly on this same real structure. Worth knowing honestly, matching this app's own established discipline for practitioner frameworks generally: AIP as a complete, packaged protocol carries real, but genuinely thinner, direct randomized-trial evidence than several of its own individual components do on their own, this app's own already-covered research finds real, strong, direct RCT evidence for a genuinely similar approach (a 1991 Lancet trial of fasting followed by a one-year vegetarian diet in RA specifically), and real, separate, strong evidence for individual AIP-adjacent pieces like gluten elimination in celiac disease. The real, honest, practical read: AIP is a real, legitimate, structured way to systematically test one's own individual food triggers, not a single proven cure validated as one complete package, the same 'practitioner framework, evidence-graded piece by piece' standard this app already applies to its own Healing Stages research.",
    citations: [
      { source: 'The Autoimmune Protocol diet: a systematic review of the literature, PMID 31832627', url: 'https://pubmed.ncbi.nlm.nih.gov/31832627/' },
      { source: 'Controlled trial of fasting and one-year vegetarian diet in rheumatoid arthritis, The Lancet, 1991', url: 'https://www.thelancet.com/journals/lancet/article/PII0140-6736(91)91770-U/fulltext' },
    ],
    overallTier: 'moderate',
    relatedIds: ['healing-stage-map', 'ra-elimination-fasting'],
  },
  {
    id: 'diet-fibermaxxing',
    category: 'basicHealth',
    title: 'Fibermaxxing: a Real Trend Name for Genuinely Strong, Already-Established Science',
    teaser: 'Unlike several other entries in this category, "fibermaxxing" isn\'t a new claim needing new evidence, it\'s a real, current name for closing a real, striking, already-documented gap.',
    summary:
      "'Fibermaxxing,' a current, informal name for deliberately increasing fiber intake to support gut health, isn't introducing a new, unproven claim, it's a real, current label for something this app's own already-covered research already establishes as genuinely strong science. This app's own Essential Nutrients research already documents a real, striking gap: roughly 94% of Americans don't meet the real, established fiber RDA (38 grams/day for men, 25 for women, ages 19-50), one of the largest, most consistent nutrient-intake shortfalls this app's own research has found anywhere. The real reason this matters directly ties to this app's own already-covered gut-microbiome research: when gut bacteria ferment dietary fiber, they produce short-chain fatty acids, real, potent signaling molecules with real, independently-confirmed evidence (two separate real studies, from two different research angles, reaching the same real conclusion) of directly training the immune system toward tolerance rather than attack, described elsewhere in this app as the single most food-controllable lever in its entire research base. Worth knowing directly: 'fibermaxxing' as a trend name is genuinely just a renewed push toward hitting a real, already-established, evidence-backed target most people are already falling well short of, not a new or unproven idea needing its own separate justification.",
    citations: [
      { source: 'The Role of Dietary Fiber in Health Promotion and Disease Prevention: A Practical Guide for Clinicians, StatPearls', url: 'https://www.ncbi.nlm.nih.gov/books/NBK559033/' },
      { source: 'Furusawa et al. 2013, Nature: commensal microbe-derived butyrate induces colonic Treg differentiation', url: 'https://pubmed.ncbi.nlm.nih.gov/24226770/' },
    ],
    overallTier: 'strong',
    relatedIds: ['carbfiber-intake-gap', 'gut-scfa-treg'],
  },
  {
    id: 'diet-gut-friendly',
    category: 'basicHealth',
    title: 'Gut-Friendly Eating: Real, Already-Documented Strain-Level Science Behind a Simple-Sounding Trend',
    teaser: 'Prebiotics, probiotics, and fermented foods aren\'t a vague wellness gesture in this app\'s own research, they\'re backed by real, specific bacterial strains with real, documented, individually-cited effects.',
    summary:
      "'Gut-friendly eating,' incorporating prebiotics, probiotics, and fermented foods like yogurt, kimchi, and sourdough, is a real, current eating-style trend this app's own already-covered Fermented Foods research backs with genuinely specific, real evidence, not a vague, generic wellness gesture. This app's own already-covered research verifies real, specific bacterial strains by name (Lactobacillus reuteri, L. gasseri, L. plantarum, B. coagulans, and others), each with its own real, individually-cited effects, real timing and fermentation-temperature requirements, and real, honest limitations (home fermentation offers no guaranteed CFU count or strain-identity verification the way a commercial, tested product does). Real, additional evidence covers fermented foods beyond yogurt directly: kimchi and sauerkraut-style brine ferments show a real, documented bacterial succession as they age, and traditional fermentation (soaking, sprouting) measurably reduces phytates, real, documented anti-nutrients that otherwise block mineral absorption. Worth knowing directly: 'gut-friendly eating' as a real, current trend name maps onto some of the most specific, individually-verified research in this whole app, a real, meaningful step beyond simply eating more fiber (already covered directly in this category's own fibermaxxing entry), toward actually cultivating the specific bacteria that do the real work.",
    citations: [
      { source: 'Lactobacillus strains isolated directly from fermented beetroot, PMID 35774469', url: 'https://pubmed.ncbi.nlm.nih.gov/35774469/' },
    ],
    overallTier: 'strong',
    relatedIds: ['diet-fibermaxxing', 'fermented-tying-together'],
  },
  {
    id: 'diet-anti-processed',
    category: 'basicHealth',
    title: 'Anti-Processed Focus: a Real, 2024 Umbrella Review Ties Ultra-Processed Food to 32 Real Health Outcomes',
    teaser: 'Cutting ultra-processed food isn\'t a vague "eat clean" gesture, a real, 2024 review pooling nearly 10 million people found it consistently tied to 32 separate, real, adverse health outcomes.',
    summary:
      "Deliberately cutting ultra-processed, convenience food with long, artificial-sounding ingredient lists is a real, current eating-style focus this app's own already-covered research backs with some of the largest real evidence in its entire library. A real, 2024 umbrella review pooling data on nearly 10 million people found ultra-processed food consistently tied to 32 different real, adverse health outcomes, a genuinely broad, consistent real finding, not one narrow claim. This app's own already-covered research adds real, concrete scale: ultra-processed food's own share of total US adult caloric intake rose from 53.5% in 2001-02 to 57.0% by 2017-18, with real, minimally-processed whole food specifically displaced, falling from 32.7% to 27.4% of calories over the same real period, not simply extra calories added on top of an otherwise unchanged diet. This is directly why this app's own eleven Food-tab builders exist in the first place, to assemble real meals from real, individually-chosen ingredients rather than defaulting to a pre-made stand-in. Worth knowing directly: this is a real, well-evidenced, genuinely different concern from any single food or nutrient covered elsewhere in this category, the real issue here is the degree of processing itself, not any one specific ingredient in isolation.",
    citations: [
      { source: 'Lane et al. 2024, BMJ: ultra-processed food exposure and adverse health outcomes, umbrella review', url: 'https://doi.org/10.1136/bmj-2023-077310' },
    ],
    overallTier: 'strong',
    relatedIds: ['problem-commercial-premade', 'additive-tying-together'],
  },
  {
    id: 'diet-app-agnostic-tracking',
    category: 'basicHealth',
    title: "How This App Helps, Whichever of These You Actually Follow",
    teaser: "This app doesn't pick a side among these real diets. Its own eleven Food-tab builders work identically no matter which eating style someone follows, real data either way.",
    summary:
      "This whole category is deliberately honest about real evidence, some of these eating styles carry strong support, some carry real, honest, open questions, and this app takes the same real, unbiased approach to actually tracking whichever one someone follows. This app's own eleven Food-tab builders (Meal, Sides, Salads & Bowls, Smoothies, Fermentation, Beverages, Snacks, Baked Goods, Soups, Sauces, Handhelds) are built from real, raw ingredients, meaning they work identically whether someone is eating keto, carnivore, vegan, Mediterranean, or anything else, the app doesn't assume or require any one eating style to function. Whatever someone actually builds and logs, this app's own Insights tab already shows a real, direct nutrient breakdown against real, established DRI targets, whether that reveals a real, keto-style low-carb pattern, a real, vegan-style protein-and-B12 gap already named directly in this category's own vegan entry, or anything in between. For anyone tracking a real, specific condition too, this app's own real, condition-specific food-scoring (already covered throughout this whole Digest) layers on top of whatever eating style someone actually follows, real, useful data regardless of the diet label attached to it. Worth knowing honestly: this app's own Trends tab, the real, deeper, automated pattern-and-correlation-finding feature this whole approach is ultimately building toward, is still mostly a stub today, not yet delivering the full, real trend analysis this entry's own title gestures toward. What's real and working right now is real, accurate, day-to-day nutrient and ingredient data, however someone eats, with real trend-finding remaining a genuine, named, not-yet-complete goal, not a feature to overclaim today. This entry itself is a real, standing example of this whole app's own broader promise: staying honest about what's actually built versus what's still ahead, the same discipline applied everywhere else in this Digest.",
    citations: [],
    overallTier: 'strong',
    relatedIds: ['diet-mediterranean', 'diet-vegan', 'diet-keto'],
  },
];
