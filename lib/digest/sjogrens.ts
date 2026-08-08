import type { DigestEntry } from './types';

// Sjögren's Syndrome -- 11 entries, added 2026-08-08 as this app's tenth
// real condition, next in the same priority order every condition before
// it followed. Built with real self-advocacy content included from the
// start, the same lesson already applied to every condition since Graves'.
//
// Sjögren's is defined by its own attack on the exocrine glands (the
// glands that make moisture) -- dry eyes and dry mouth are its hallmark,
// but the real disease reaches further: a genuinely elevated lymphoma
// risk, real extraglandular complications that can strike the kidneys
// and nerves, and a real, direct, everyday food/drink relationship most
// other conditions in this app don't share, since dryness itself is
// worsened or eased by what someone eats and drinks in a very immediate,
// mechanical way (not just an inflammatory one).
//
// Distinct from otherAutoimmune.ts's own 'other-sjogrens' entry, which
// stays exactly as it was: a real gut-microbiota systematic review plus a
// brief Hashimoto's comorbidity note, studied as corroborating evidence
// for a Hashimoto's reader. This category cross-links to it rather than
// repeating its content, and covers everything else specific to actually
// living with and managing Sjögren's on its own terms.
//
// Every citation here was independently verified via WebSearch before
// being written in.
export const SJOGRENS_ENTRIES: DigestEntry[] = [
  {
    id: 'sjogrens-overview',
    category: 'sjogrens',
    title: "Sjögren's Syndrome: When the Immune System Attacks the Body's Own Moisture-Making Glands",
    teaser: 'Dry eyes and a dry mouth sound minor. The disease behind them genuinely isn\'t, and reaches further than either symptom suggests.',
    summary:
      "Sjögren's syndrome is a chronic autoimmune disease in which the immune system attacks the exocrine glands, the glands responsible for producing moisture throughout the body, most visibly the tear glands and salivary glands. The real, hallmark result is dryness: dry, gritty-feeling eyes and a dry mouth that makes swallowing, speaking, and tasting genuinely harder, but the disease can also affect moisture-producing tissue elsewhere in the body. Sjögren's can occur on its own (primary Sjögren's) or alongside another autoimmune disease, most commonly rheumatoid arthritis or lupus, both already covered in this app's own research (secondary Sjögren's) -- covered directly in this category's own closing entries. This category covers what's specific to actually living with and managing Sjögren's on its own terms -- a genuinely direct, everyday relationship with food and drink most other conditions in this app don't share, since dryness itself is worsened or eased mechanically by what someone eats and drinks, not just through a slower inflammatory pathway.",
    citations: [
      { source: "Sjögren's Syndrome, MedlinePlus, U.S. National Library of Medicine", url: 'https://medlineplus.gov/sjogrenssyndrome.html' },
    ],
    overallTier: 'strong',
    relatedIds: ['other-sjogrens'],
  },
  {
    id: 'sjogrens-dental-caries-risk',
    category: 'sjogrens',
    title: "A Real, Direct Path From Dry Mouth to Rapid Tooth Decay",
    teaser: "Saliva does more than keep the mouth comfortable. Losing it removes a real, active layer of dental protection.",
    summary:
      "Saliva isn't just a comfort function -- it does real, active protective work in the mouth: lubrication, buffering acid, clearing food particles and bacterial plaque, and fighting bacteria directly. Sjögren's own damage to the salivary glands reduces both the amount and the composition of saliva, genuinely compromising all of these protective functions at once, not just causing dryness as a standalone symptom. The real, clinical result is a documented pattern of rapid, multifocal tooth decay, often starting at the roots and gumline (areas usually well protected in someone with normal saliva flow), along with a real, elevated risk of dental restoration failure and complications around dental implants. This is a genuine, well-documented mechanism, not just \"dry mouth is uncomfortable\" -- real dental guidance for Sjögren's specifically recommends a combined approach: dietary counseling, saliva stimulation (see this category's own separate entries on xylitol and medication options), and topical remineralization products like high-fluoride toothpaste, treating the real, structural loss of saliva's own protective role directly rather than only treating the dryness itself.",
    citations: [
      { source: "Oral Manifestations of Sjögren's Syndrome: Recognition, Management, and Interdisciplinary Care", url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12843269/' },
    ],
    overallTier: 'strong',
    relatedIds: ['sjogrens-xylitol-saliva-stimulation', 'sjogrens-pilocarpine-cevimeline'],
  },
  {
    id: 'sjogrens-alcohol-caffeine-dehydration',
    category: 'sjogrens',
    title: 'Alcohol and Caffeine: A Real, Direct, Immediate Effect on Dryness',
    teaser: "Not a slow inflammatory pathway this time. A real, mechanical dehydrating effect that makes the disease's own core symptom measurably worse.",
    summary:
      "Alcohol and caffeine both have a real, genuinely direct relationship to Sjögren's own core symptom, dryness, distinct from the slower, inflammation-mediated food relationships covered elsewhere in this app. Alcohol is a real, documented diuretic that promotes dehydration, directly worsening dry eyes, dry mouth, and dry skin, with beer and wine specifically flagged as also being locally irritating to an already-dry mouth. Caffeine works the same real way, as a stimulant with its own real dehydrating effect, on top of not counting toward a day's actual fluid needs the way plain water does. Real, patient-facing clinical guidance recommends limiting or avoiding both, and separately notes that reducing caffeine and alcohol can also help with the real, commonly reported \"brain fog\" and sleep problems that come with Sjögren's. This is a real, practical, same-day-effect finding, not a long-term dietary pattern, worth knowing as one of the more directly actionable pieces of guidance in this whole category.",
    citations: [
      { source: 'Nutrition to Improve Symptoms of Sjögren\'s, Sjögren\'s Foundation', url: 'https://sjogrens.org/blog/2021/nutrition-to-improve-symptoms-of-sjogrens' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'sjogrens-xylitol-saliva-stimulation',
    category: 'sjogrens',
    title: 'Xylitol: A Real, Two-Way Fix for Dry Mouth, Not Just a Sugar Substitute',
    teaser: "The same sweetener that doesn't feed cavity-causing bacteria also genuinely stimulates the saliva Sjögren's own dryness has taken away.",
    summary:
      "Sugar-free chewing gum and lozenges containing xylitol are a real, specifically recommended tool in official Sjögren's clinical practice guidelines, and they work through two real, distinct mechanisms at once. First, the physical act of chewing itself stimulates real, mechanical saliva flow, and xylitol has a real, direct additional effect on the salivary glands beyond that. Second, and just as real: xylitol doesn't feed the bacteria responsible for tooth decay the way ordinary sugar does, directly addressing the elevated cavity risk this category's own dental-caries entry covers. Real, practical guidance suggests using a xylitol product four to five times a day, for about five minutes after meals and snacks, to genuinely stimulate saliva production when it's needed most. One real, honest caveat worth knowing: excessive gum chewing can cause real jaw or TMJ fatigue in some people, worth watching for rather than assuming more is automatically better.",
    citations: [
      { source: "Sjögren's Foundation Clinical Practice Guidelines: Oral", url: 'https://sjogrens.org/sites/default/files/inline-files/SF_PCG-Oral_0.pdf' },
    ],
    overallTier: 'strong',
    relatedIds: ['sjogrens-dental-caries-risk'],
  },
  {
    id: 'sjogrens-omega3-dry-eye-mouth',
    category: 'sjogrens',
    title: 'Omega-3: Real, Recent Trial Evidence for Both Dry Eyes and Dry Mouth at Once',
    teaser: "A real, fairly large, recent trial found the same supplement genuinely helping both of Sjögren's own hallmark symptoms together.",
    summary:
      "A real, randomized, double-blind, placebo-controlled trial (104 patients, conducted in Erbil, Iraq) tested omega-3 supplementation specifically in Sjögren's patients and found a real, statistically significant improvement in dry eye symptom scores compared to placebo, along with a real, measured improvement in dry mouth, including actual normalization of saliva-flow testing (sialometry) in the omega-3 group. This adds real, specific weight to a broader, already-established body of research on omega-3 for dry eye syndrome generally (a real meta-analysis of multiple randomized trials also supports it), and a separate real trial testing a flaxseed-and-fish-oil blend specifically designed for Sjögren's found similarly positive results for both tear and saliva production. This is a genuinely encouraging, real finding: unlike many supplement questions this app's own research covers honestly as mixed or unresolved, omega-3 in Sjögren's specifically has real, fairly consistent, positive trial support across more than one independent study.",
    citations: [
      { source: "A Randomised Double-Blind Placebo-Controlled Clinical Trial of Fish Oil (Omega-3) in Sjögren's Syndrome Patients in Erbil-Iraq", url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12183441/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'sjogrens-lymphoma-risk',
    category: 'sjogrens',
    title: "A Real, Meaningfully Elevated Lymphoma Risk Worth Knowing Directly",
    teaser: "Sjögren's carries a real, genuinely elevated risk of a specific blood cancer, most often a slow-growing, treatable kind.",
    summary:
      "Sjögren's carries a real, well-documented, meaningfully elevated risk of non-Hodgkin lymphoma, occurring in roughly 2.7% to 9.8% of Sjögren's patients over time. Real risk-ratio estimates vary depending on the study, with earlier, smaller studies suggesting risk as high as 44 times the general population, while more recent, larger studies place the real, more reliable estimate closer to six to nine times higher, still a genuinely substantial elevation worth knowing about directly, not a minor statistical footnote. The real, more reassuring context: most lymphoma that does develop in Sjögren's patients is a specific, typically slow-growing type (MALT lymphoma) rather than a more aggressive form, and the most common associated types tend to have a real, favorable prognosis when caught and treated. This is included as a real, direct, honest fact someone managing Sjögren's deserves to know plainly, not to cause alarm but because real, informed self-advocacy (persistent swollen glands, unexplained weight loss, or night sweats are worth raising with a doctor directly) depends on actually knowing this risk exists.",
    citations: [
      { source: "Cancer Risk with Sjögren's, Arthritis Foundation", url: 'https://www.arthritis.org/health-wellness/about-arthritis/related-conditions/other-diseases/non-hodgkins-lymphoma-with-sjogrens-syndrome' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'sjogrens-renal-tubular-acidosis',
    category: 'sjogrens',
    title: 'A Real, Serious Kidney Complication That Can Show Up Before the Dryness Does',
    teaser: "Sjögren's doesn't always announce itself with dry eyes first. A real kidney complication can cause sudden muscle weakness before sicca symptoms are even recognized.",
    summary:
      "Roughly one-third of Sjögren's patients develop a real extraglandular complication, meaning the disease's own damage reaches beyond the eyes and mouth entirely. The kidneys are a real, documented site of this, affecting an estimated 5% to 14% of patients in most studies, most often as a specific kidney problem called distal renal tubular acidosis (RTA), where the kidneys lose their normal ability to properly regulate the body's acid-base balance. The real, genuinely striking part of this finding: renal tubular acidosis can cause a serious drop in blood potassium levels severe enough to cause sudden muscle weakness or even temporary paralysis, and real case reports document this happening as the very first noticeable sign of Sjögren's, before the disease's own more typical dry-eye and dry-mouth symptoms were ever recognized or diagnosed. This is worth knowing directly as a real, if uncommon, reason unexplained muscle weakness deserves a real medical workup, not an assumption it's unrelated to a Sjögren's diagnosis that hasn't been made yet.",
    citations: [
      { source: "Renal Tubular Acidosis in Patients with Primary Sjögren's Syndrome", url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5641498/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'sjogrens-secondary-ra-lupus-overlap',
    category: 'sjogrens',
    title: "Secondary Sjögren's: A Real, Substantial Overlap With Two Conditions This App Already Covers",
    teaser: "Sjögren's very often doesn't occur alone. Real numbers show just how often it rides alongside rheumatoid arthritis and lupus specifically.",
    summary:
      "Sjögren's frequently occurs as \"secondary\" Sjögren's, meaning alongside another autoimmune disease rather than on its own, and the real numbers for two specific conditions already covered in this app's own research are genuinely substantial. Real observational registry data finds Sjögren's overlapping with rheumatoid arthritis in as many as 30% of RA patients (with rheumatologist-diagnosed estimates running lower, around 8.7%, depending on which real diagnostic criteria are used), and the real prevalence of this overlap increases the longer someone has had RA. With lupus, real systematic reviews find a secondary Sjögren's prevalence of roughly 14% to 18%. Worth knowing directly for anyone managing RA or lupus already: real, persistent dry eyes or dry mouth symptoms are worth raising specifically as a possible sign of secondary Sjögren's, not just written off as a side effect of the primary diagnosis or its medications, since the real management specifics covered elsewhere in this category (dental protection, dryness triggers, lymphoma awareness) apply just as directly to secondary Sjögren's as to the primary form.",
    citations: [
      { source: "Prevalence of Sjögren's syndrome associated with rheumatoid arthritis in the USA: an observational study from the Corrona registry", url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7237400/' },
      { source: "Sjögren's syndrome and systemic lupus erythematosus: links and risks, PMID 30774485", url: 'https://pubmed.ncbi.nlm.nih.gov/30774485/' },
    ],
    overallTier: 'strong',
    relatedIds: ['other-rheumatoid-arthritis', 'other-lupus'],
  },
  {
    id: 'sjogrens-antibody-testing',
    category: 'sjogrens',
    title: "Diagnosing Sjögren's: The Real Antibody and Function Tests Behind a Confirmed Diagnosis",
    teaser: "Dry eyes and a dry mouth alone aren't a diagnosis. A real, specific set of blood and gland tests is what actually confirms it.",
    summary:
      "Sjögren's diagnosis relies on more than reported dryness alone, since dry eyes and dry mouth have many possible causes. Real, standard diagnostic tools include anti-SSA (also called anti-Ro) and anti-SSB (also called anti-La) antibody blood tests, real, specific autoantibodies found in most, though not all, Sjögren's patients; Schirmer's test, a real, simple, direct measurement of actual tear production using a small strip of paper placed at the edge of the eyelid; and, when the diagnosis is still unclear, a minor salivary gland biopsy (usually taken from inside the lower lip), which can directly show the real, characteristic immune-cell infiltration into the gland tissue that defines the disease. A real, honest limitation worth knowing directly: a negative antibody result doesn't fully rule out Sjögren's, since a real, meaningful minority of confirmed cases are seronegative, the same real pattern this app's own Hashimoto's self-advocacy research already documents for that disease's own antibody testing. Worth asking directly which of these real, specific tests were actually used before accepting either a Sjögren's diagnosis or a dismissal of one.",
    citations: [
      { source: 'Sjögren Syndrome, Merck Manual Professional Edition', url: 'https://www.merckmanuals.com/professional/musculoskeletal-and-connective-tissue-disorders/systemic-rheumatic-diseases/sj%C3%B6gren-syndrome' },
    ],
    overallTier: 'strong',
    relatedIds: ['advocacy-seronegative-hashimotos'],
  },
  {
    id: 'sjogrens-pilocarpine-cevimeline',
    category: 'sjogrens',
    title: 'Pilocarpine and Cevimeline: Real Medications That Genuinely Stimulate the Body\'s Own Moisture Production',
    teaser: "Rather than just replacing lost moisture, these two real medications work by getting the body's own glands producing again.",
    summary:
      "Pilocarpine and cevimeline are real, genuinely different medications from artificial tears or saliva substitutes -- both are muscarinic agonists that actively stimulate the body's own remaining gland function to produce more real saliva and tears, rather than just replacing what's missing from the outside. A real, specific and genuinely reassuring finding directly ties this back to this category's own dental-caries entry: real research found pilocarpine associated with a measurable reduction in dental caries risk in Sjögren's patients, a real, direct benefit beyond just symptom comfort. The two medications differ in a real, specific way: cevimeline has a higher real affinity for the specific receptor type found on salivary and tear glands, which in theory should mean fewer side effects than pilocarpine, though both share a real, overlapping side-effect profile, sweating, nausea, and increased urination among the most common, since pilocarpine in particular stimulates exocrine glands throughout the whole body, not just the mouth and eyes. Worth a real, direct conversation with a doctor about which of the two might suit a given person better, rather than assuming they're interchangeable.",
    citations: [
      { source: "The effect of pilocarpine on dental caries in patients with primary Sjögren's syndrome: a database prospective cohort study", url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6882320/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'sjogrens-tying-together',
    category: 'sjogrens',
    title: "What Actually Holds Up for Sjögren's, Pulled Together",
    teaser: 'A disease defined by dryness that reaches the kidneys and a real cancer risk, and a real, direct, same-day relationship with food and drink most other conditions in this app don\'t share.',
    summary:
      "Line up everything in this category and Sjögren's reads as a disease whose real reach genuinely exceeds its own reputation as \"just dryness.\" The dental-caries mechanism shows exactly how directly saliva loss translates into real, measurable physical damage, and the real fixes, xylitol and the medications pilocarpine and cevimeline, work by restoring the body's own real function rather than just masking the symptom. Alcohol and caffeine carry a genuinely immediate, same-day relationship to dryness, a more direct food-symptom link than most other conditions in this app show. The real lymphoma risk and the real renal tubular acidosis finding, which can strike before the disease's own hallmark dryness is even recognized, both argue for taking Sjögren's seriously as a systemic disease, not a cosmetic inconvenience. And the real, substantial overlap with rheumatoid arthritis and lupus, both already covered elsewhere in this app, is a direct, practical reason anyone managing either of those conditions should know this category exists at all.",
    citations: [
      { source: "Sjögren's Syndrome, MedlinePlus, U.S. National Library of Medicine", url: 'https://medlineplus.gov/sjogrenssyndrome.html' },
    ],
    overallTier: 'strong',
    relatedIds: ['sjogrens-dental-caries-risk', 'sjogrens-lymphoma-risk', 'sjogrens-renal-tubular-acidosis', 'sjogrens-secondary-ra-lupus-overlap'],
  },
];
