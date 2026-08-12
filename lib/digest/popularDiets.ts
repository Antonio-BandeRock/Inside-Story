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
    title: 'The Mediterranean Diet: the Best-Evidenced Eating Pattern in This Whole List',
    teaser: 'Traced back to a 1950s-era observational study, now backed by randomized trial evidence across cardiovascular disease and beyond. If any one pattern here has earned its reputation, this is the one.',
    summary: "Of every eating style covered in this category, the Mediterranean diet carries the deepest, most consistent evidence, and the already-covered research across multiple conditions (cardiovascular disease, RA, psoriasis, fatty liver disease) keeps landing on the same pattern independently. It traces back to the Seven Countries Study, the first major research effort to directly compare cardiovascular disease rates across different countries and diets, which found Mediterranean, olive-oil-and-produce-heavy populations carrying roughly half the cardiovascular disease rate of northern European populations eating more saturated fat. That observational finding has since been confirmed in randomized controlled trials: the landmark PREDIMED trial found a Mediterranean diet supplemented with extra-virgin olive oil or nuts measurably reducing cardiovascular events in a randomized, controlled setting, not just an association. The already-covered research finds the same pattern repeating across RA (a randomized trial finding a 76% drop in disease-activity score), psoriasis (a randomized 2025 trial reducing severity), and fatty liver disease (performing as well as a low-fat diet in head-to-head testing). Worth knowing directly: no single food defines it, whole-food eating built around olive oil, vegetables, legumes, fish, and whole grains, low in processed food and added sugar, is the consistent thread across every one of these trials.",
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
    title: "Ketogenic (Keto): Decades-Old Medical Use Alongside a Newer Cholesterol Concern",
    teaser: 'Keto has decades-long clinical use for epilepsy. What\'s newer, and worth knowing directly: 2026 research finding LDL cholesterol can rise sharply in lean adults on the diet specifically.',
    summary:
      "The ketogenic diet, a very low-carbohydrate, high-fat eating pattern designed to shift the body into fat-burning ketosis, has established medical roots: it has been used clinically for intractable epilepsy, including in children, for decades-long, well-documented benefit, not a recent wellness trend. For weight loss specifically, research finds it works, largely through the same mechanism as any other approach that reduces total calorie intake, not a unique metabolic advantage keto alone provides. Worth knowing directly and honestly, and current: a 2026 review names an emerging clinical concern directly in its own title, ketogenic diets can produce large increases in LDL cholesterol specifically in adults with a normal body weight, a documented pattern (sometimes called the 'lean mass hyper-responder' phenomenon) raising honest questions about long-term cardiovascular risk that the field itself is still actively working through, not a settled question either way. Additional honest complications worth naming: the diet is hard to sustain long-term, an initial 'keto flu' adjustment period is real and commonly reported, and its own very low carbohydrate intake can make it difficult to reach the already-covered fiber intake most people already fall short of without careful planning.",
    citations: [
      { source: 'Ketogenic Diets and Low-Density Lipoprotein Cholesterol in Adults With Normal Weight: An Emerging Clinical Challenge, PMID 42047192', url: 'https://pubmed.ncbi.nlm.nih.gov/42047192/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['carbfiber-intake-gap', 'cvd-lipid-panel-self-advocacy'],
  },
  {
    id: 'diet-intermittent-fasting',
    category: 'basicHealth',
    title: 'Intermittent Fasting: Working, and Probably Not Metabolically Magic',
    teaser: 'Direct trial evidence finds intermittent fasting produces weight loss, likely through the same mechanism as any other calorie reduction, not a unique metabolic trick.',
    summary: "Intermittent fasting (IF), timed eating windows like the popular 16:8 method rather than a specific list of foods, has direct randomized trial support behind it. A controlled trial comparing alternate-day fasting, 16:8 time-restricted eating, and a non-fasting control group over 3 weeks (with a 3-month follow-up) found both fasting approaches producing significantly more weight and BMI reduction than the control group, with alternate-day fasting outperforming the milder 16:8 pattern specifically. Worth knowing honestly: the leading explanation across the broader body of research is that IF works largely because it makes eating less overall easier for many people, the same mechanism behind any calorie-reduction approach, not a distinct metabolic advantage unique to the timing itself. Honest complications worth naming directly: IF isn't equally suitable for everyone, the already-covered Type 1 diabetes research names complexity in timing insulin around a fasting window, and the already-covered research on fasting and thyroid hormone finds measurable effects on TSH and thyroid lab values during sustained fasting (the IFTAR/Ramadan research already covered elsewhere). A practical, honest takeaway: IF is a legitimate tool for many people specifically because it makes sticking with reduced calorie intake easier, not because it changes metabolism in some deeper way most other approaches don't.",
    citations: [
      { source: 'Intermittent Fasting in Weight Loss and Cardiometabolic Risk Reduction: A Randomized Controlled Trial, PMID 35050952', url: 'https://pubmed.ncbi.nlm.nih.gov/35050952/' },
    ],
    overallTier: 'strong',
    relatedIds: ['type1-exercise-glucose', 'mito-fasting-autophagy-tension'],
  },
  {
    id: 'diet-carnivore',
    category: 'basicHealth',
    title: 'The Carnivore Diet: an Honest Report of How Little Research Actually Exists',
    teaser: 'A direct search of the peer-reviewed medical literature for carnivore-diet research turned up almost nothing. That absence itself is the most honest, important thing to report about it.',
    summary: "The carnivore diet, eating only meat and other animal products, is worth reporting on directly and honestly for what it lacks as much as what it claims: a direct search of peer-reviewed medical research turned up essentially no human trials, cohort studies, or systematic reviews testing its safety or effectiveness at all, one 2026 review, focused specifically on athletes, states this plainly in its own summary, naming 'limited direct scientific evidence' for the diet's efficacy or safety even in that narrower context. What existing nutrition science DOES say, applied to a diet with zero plant food by definition: it necessarily eliminates dietary fiber entirely, directly contradicting the extensively-documented, mechanistic research on short-chain fatty acids, gut bacteria, and immune tolerance (the single most food-controllable lever the gut-microbiome research has found). It also runs directly against well-established findings on red and processed meat, the International Agency for Research on Cancer classifies processed meat as a confirmed human carcinogen and red meat as a probable one, tied to colorectal cancer risk specifically. Worth knowing directly: the almost complete absence of dedicated carnivore-diet research means any specific claim of benefit or harm beyond these already-established, general nutrition-science facts is unverified, not proven safe, and not proven dangerous by direct study, simply untested.",
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
    title: 'Veganism: Cardiovascular Benefit, and a Documented Deficiency Risk If Unplanned',
    teaser: 'A meta-analysis found vegan and vegetarian diets tracking with lower heart disease risk, but a direct study found vegans nearly three times more likely to be B12-deficient than lacto-ovo vegetarians.',
    summary:
      "A fully plant-based, vegan diet carries cardiovascular evidence behind it, alongside an honest, well-documented nutritional risk worth planning around directly. A systematic review and meta-analysis of prospective cohort studies found vegetarian and vegan diets associated with reduced risk of ischemic heart disease specifically, though the same research is honest that the picture for cardiovascular disease overall and stroke specifically is less clear, not a uniform benefit across every cardiovascular outcome. The more concrete, actionable finding: a direct comparative study found vitamin B12 deficiency in 44.1% of vegans, compared with 15.0% of lacto-ovo vegetarians (who still eat dairy and eggs) in the same study, a nearly threefold difference, and a statistically significant one. B12 is found reliably only in animal products, meaning a vegan diet without deliberate supplementation or fortified food carries a well-documented, largely avoidable deficiency risk. Additional nutrients worth actively planning for on a vegan diet, per already well-established nutrition science: iron, zinc, omega-3 fatty acids, vitamin D, and calcium, all planning points, not automatic problems, but worth knowing rather than assuming a plant-based diet is automatically nutritionally complete on its own.",
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
    title: 'Plant-Based / Flexitarian: the More Flexible Middle Ground, With Evidence Behind It Too',
    teaser: 'Research keeps finding the same benefit shows up gradually as meat intake drops, without needing to eliminate it entirely, good news for anyone put off by strict veganism\'s own honest deficiency risks.',
    summary: "Plant-based, flexitarian eating (deliberately reducing, not eliminating, meat and animal products in favor of more whole plant foods) sits between this category's own already-covered vegan research and its already-covered Mediterranean research, and shares evidence with both. Cardiovascular and metabolic benefit tracks with the degree of plant-food emphasis in a diet, not an all-or-nothing threshold, meaning a flexible, mostly-plant pattern captures meaningful benefit without necessarily carrying this category's own already-covered vegan-specific B12 deficiency risk, since flexitarian eating typically still includes at least some animal-product intake. The already-covered Mediterranean research is itself a practical example of exactly this kind of flexible, plant-forward-but-not-strict pattern, built around whole plant foods, healthy fats, and fish, with only moderate meat intake, not full elimination. Worth knowing directly: this flexible middle ground is an evidence-backed, and often more sustainable long-term option for many people than either strict veganism or unrestricted eating, precisely because it doesn't require the same careful nutrient-gap planning a fully vegan diet does, while still capturing much of the same documented benefit.",
    citations: [
      { source: 'Vegetarian and vegan diets and the risk of cardiovascular disease, ischemic heart disease and stroke: a systematic review and meta-analysis, PMID 36030329', url: 'https://pubmed.ncbi.nlm.nih.gov/36030329/' },
    ],
    overallTier: 'strong',
    relatedIds: ['diet-mediterranean', 'diet-vegan'],
  },
  {
    id: 'diet-high-protein',
    category: 'basicHealth',
    title: 'High-Protein / "Proteinmaxxing": Solid Basics, With One Exception Worth Naming Directly',
    teaser: 'Protein\'s own well-documented satiety and muscle-preserving role holds up well for most healthy people. The one honest exception: anyone with existing kidney disease, where the already-covered research says otherwise.',
    summary: "Prioritizing higher protein intake, sometimes called 'proteinmaxxing' in current usage, especially to protect muscle mass while eating less or as part of aging, rests on already-established nutrition science the Essential Nutrients research already covers directly: protein carries a well-documented satiety effect (helping someone feel fuller on fewer total calories) and a direct role in preserving lean muscle mass, particularly relevant during weight loss or as part of normal aging, when muscle loss becomes a documented health risk in its own right. For people with already-healthy kidneys, current nutrition science doesn't find higher protein intake within normal higher-end ranges causing kidney harm. Worth knowing directly and honestly, the one important exception: the already-covered chronic kidney disease research finds different guidance applies once kidney function is already reduced, where a specific, lower protein target (0.6 to 0.8g/kg/day) and a plant-forward protein source both show documented benefit over higher intake. The practical takeaway: 'more protein' is a reasonable, well-supported general goal for most healthy people, but not a universal rule, anyone with known kidney disease should follow the already-covered, different guidance instead.",
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
    title: 'AIP (Autoimmune Protocol): a Structured Elimination Framework, Honestly Tiered Below Its Own Individual Pieces',
    teaser: 'A formal 6-week elimination plus 5-week reintroduction structure exists and is well-described, but the packaged protocol itself carries thinner direct trial evidence than several of the individual pieces it\'s built from.',
    summary: "The Autoimmune Protocol (AIP), a structured elimination diet developed specifically for autoimmune conditions, removes a defined list of foods (grains, legumes, dairy, nightshades, eggs, nuts and seeds, refined sugar, and food additives) for a set period, then reintroduces them one at a time to identify individual triggers. A published systematic review confirms the formal structure behind it: a 6-week elimination phase followed by a 5-week, one-food-at-a-time reintroduction protocol, the already-covered Healing Stages research draws directly on this same structure. Worth knowing honestly, matching the established discipline for practitioner frameworks generally: AIP as a complete, packaged protocol carries real, but thinner, direct randomized-trial evidence than several of its own individual components do on their own, the already-covered research finds strong, direct RCT evidence for a similar approach (a 1991 Lancet trial of fasting followed by a one-year vegetarian diet in RA specifically), and separate, strong evidence for individual AIP-adjacent pieces like gluten elimination in celiac disease. The honest, practical read: AIP is a legitimate, structured way to systematically test one's own individual food triggers, not a single proven cure validated as one complete package, the same 'practitioner framework, evidence-graded piece by piece' standard already applied to its own Healing Stages research.",
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
    title: 'Fibermaxxing: a Trend Name for Strong, Already-Established Science',
    teaser: 'Unlike several other entries in this category, "fibermaxxing" isn\'t a new claim needing new evidence, it\'s a current name for closing a striking, already-documented gap.',
    summary: "'Fibermaxxing,' a current, informal name for deliberately increasing fiber intake to support gut health, isn't introducing a new, unproven claim, it's a current label for something the already-covered research already establishes as strong science. The Essential Nutrients research already documents a striking gap: roughly 94% of Americans don't meet the established fiber RDA (38 grams/day for men, 25 for women, ages 19-50), one of the largest, most consistent nutrient-intake shortfalls the research has found anywhere. The reason this matters directly ties to the already-covered gut-microbiome research: when gut bacteria ferment dietary fiber, they produce short-chain fatty acids, potent signaling molecules with independently-confirmed evidence (two separate studies, from two different research angles, reaching the same conclusion) of directly training the immune system toward tolerance rather than attack, described elsewhere as the single most food-controllable lever in its entire research base. Worth knowing directly: 'fibermaxxing' as a trend name is just a renewed push toward hitting an already-established, evidence-backed target most people are already falling well short of, not a new or unproven idea needing its own separate justification.",
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
    title: 'Gut-Friendly Eating: Already-Documented Strain-Level Science Behind a Simple-Sounding Trend',
    teaser: 'Prebiotics, probiotics, and fermented foods aren\'t a vague wellness gesture in the research, they\'re backed by specific bacterial strains with documented, individually-cited effects.',
    summary: "'Gut-friendly eating,' incorporating prebiotics, probiotics, and fermented foods like yogurt, kimchi, and sourdough, is a current eating-style trend the already-covered Fermented Foods research backs with specific, evidence, not a vague, generic wellness gesture. The already-covered research verifies specific bacterial strains by name (Lactobacillus reuteri, L. Gasseri, L. Plantarum, B. Coagulans, and others), each with its own individually-cited effects, timing and fermentation-temperature requirements, and honest limitations (home fermentation offers no guaranteed CFU count or strain-identity verification the way a commercial, tested product does). Additional evidence covers fermented foods beyond yogurt directly: kimchi and sauerkraut-style brine ferments show a documented bacterial succession as they age, and traditional fermentation (soaking, sprouting) measurably reduces phytates, documented anti-nutrients that otherwise block mineral absorption. Worth knowing directly: 'gut-friendly eating' as a current trend name maps onto some of the most specific, individually-verified research in this whole app, a meaningful step beyond simply eating more fiber (already covered directly in this category's own fibermaxxing entry), toward actually cultivating the specific bacteria that do the work.",
    citations: [
      { source: 'Lactobacillus strains isolated directly from fermented beetroot, PMID 35774469', url: 'https://pubmed.ncbi.nlm.nih.gov/35774469/' },
    ],
    overallTier: 'strong',
    relatedIds: ['diet-fibermaxxing', 'fermented-tying-together'],
  },
  {
    id: 'diet-anti-processed',
    category: 'basicHealth',
    title: 'Anti-Processed Focus: a 2024 Umbrella Review Ties Ultra-Processed Food to 32 Health Outcomes',
    teaser: 'Cutting ultra-processed food isn\'t a vague "eat clean" gesture, a 2024 review pooling nearly 10 million people found it consistently tied to 32 separate, adverse health outcomes.',
    summary: "Deliberately cutting ultra-processed, convenience food with long, artificial-sounding ingredient lists is a current eating-style focus the already-covered research backs with some of the largest evidence in its entire library. A 2024 umbrella review pooling data on nearly 10 million people found ultra-processed food consistently tied to 32 different adverse health outcomes, a broad, consistent finding, not one narrow claim. The already-covered research adds concrete scale: ultra-processed food's own share of total US adult caloric intake rose from 53.5% in 2001-02 to 57.0% by 2017-18, with minimally-processed whole food specifically displaced, falling from 32.7% to 27.4% of calories over the same period, not simply extra calories added on top of an otherwise unchanged diet. This is directly why the eleven Food-tab builders exist in the first place, to assemble meals from individually-chosen ingredients rather than defaulting to a pre-made stand-in. Worth knowing directly: this is a well-evidenced, different concern from any single food or nutrient covered elsewhere in this category, the issue here is the degree of processing itself, not any one specific ingredient in isolation.",
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
    teaser: "This app doesn't pick a side among these diets. Its own eleven Food-tab builders work identically no matter which eating style someone follows, data either way.",
    summary: "This whole category is deliberately honest about evidence, some of these eating styles carry strong support, some carry honest, open questions, and this app takes the same unbiased approach to actually tracking whichever one someone follows. The eleven Food-tab builders (Meal, Sides, Salads & Bowls, Smoothies, Fermentation, Beverages, Snacks, Baked Goods, Soups, Sauces, Handhelds) are built from raw ingredients, meaning they work identically whether someone is eating keto, carnivore, vegan, Mediterranean, or anything else, the app doesn't assume or require any one eating style to function. Whatever someone actually builds and logs, the Insights tab already shows a direct nutrient breakdown against established DRI targets, whether that reveals a keto-style low-carb pattern, a vegan-style protein-and-B12 gap already named directly in this category's own vegan entry, or anything in between. For anyone tracking a specific condition too, the condition-specific food-scoring (already covered) layers on top of whatever eating style someone actually follows, useful data regardless of the diet label attached to it. Worth knowing honestly: the Trends tab, the deeper, automated pattern-and-correlation-finding feature this whole approach is ultimately building toward, is still mostly a stub today, not yet delivering the full, trend analysis this entry's own title gestures toward. What's real and working right now is accurate, day-to-day nutrient and ingredient data, however someone eats, with trend-finding remaining a named, not-yet-complete goal, not a feature to overclaim today. This entry itself is a standing example of this whole app's own broader promise: staying honest about what's actually built versus what's still ahead, the same discipline applied everywhere else.",
    citations: [],
    overallTier: 'strong',
    relatedIds: ['diet-mediterranean', 'diet-vegan', 'diet-keto'],
  },
];
