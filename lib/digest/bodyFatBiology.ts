import type { DigestEntry } from './types';

// Body Fat Biology, a new Basic Health topic added 2026-08-21, direct
// request: look up NOVA's "The Truth About Fat" (2020) documentary,
// fact-check everything it covers against the peer-reviewed literature,
// and build Digest content from what actually holds up. None of the
// documentary's footage or narration is treated as a citable source
// itself; every claim below traces to the primary study or a review of
// that study the documentary's segment draws from, independently
// verified via WebSearch, the same discipline every entry in this Digest
// already follows. The leptin/adiponectin/lipodystrophy half of this same
// fact-check lives in hormones.ts instead, alongside the leptin/ghrelin
// entries already there, rather than duplicated here; this file covers
// the documentary's other throughlines: the genetics of body weight,
// how much daily activity actually changes total energy expenditure, and
// why where fat is stored matters as much as how much there is.
//
// Checked directly against all 19 tracked conditions, not force-fit onto
// every one: this material connects most directly to the metabolic-
// syndrome cluster already built out across Type 2 Diabetes, PCOS, MASLD,
// Chronic Kidney Disease, Gout, and Cardiovascular Disease (cross-linked
// below), and to the leptin-immune mechanism named directly in
// hormones.ts's leptin-autoimmune-inflammation entry for rheumatoid
// arthritis, lupus, multiple sclerosis, and Hashimoto's. Migraine, IBS,
// Celiac, Sjögren's, Prostate Health, and the remaining autoimmune
// conditions were checked and correctly left without a forced entry here,
// since no direct, citable connection to this specific documentary's
// content turned up for them.
export const BODY_FAT_BIOLOGY_ENTRIES: DigestEntry[] = [
  {
    id: 'bodyfat-heritability-twin-study',
    category: 'basicHealth',
    title: 'Body Weight Has a Documented Genetic Component',
    teaser: 'A study of twins raised in separate homes, some since infancy, found genetics explaining roughly 70% of the difference in adult body weight.',
    summary: "A study comparing identical twins raised apart, some separated in infancy, to identical twins raised together, and to fraternal twins in both situations, found that genetic factors accounted for as much as 70% of the variance in adult body-mass index, while the childhood environment twins shared growing up in the same household contributed little to none. This is a different kind of genetic evidence from the DNA-and-hormone story elsewhere in this category: it doesn't identify any specific gene, it measures how much of the outcome tracks with shared genetics regardless of upbringing. A strong genetic influence on where someone's weight tends to sit is not the same as genetics being the only thing that matters. It means genes set a range, and food, activity, sleep, and the rest of what this app tracks still determine where within that range someone actually lands. This is a different question from the genetics of autoimmune disease risk covered in the history research (a different trait, a different study), worth reading as a separate finding rather than the same one restated.",
    citations: [
      { source: 'Stunkard AJ et al. 1990, New England Journal of Medicine: The Body-Mass Index of Twins Who Have Been Reared Apart', url: 'https://pubmed.ncbi.nlm.nih.gov/2336075/' },
    ],
    overallTier: 'strong',
    stageNote: 'A well-replicated twin-study design; heritability figures like this describe population-level variance, not a fixed prediction for any one individual.',
    relatedIds: ['leptin-discovery-ob-mice', 'history-heritability-family-risk'],
  },
  {
    id: 'bodyfat-constrained-energy-expenditure',
    category: 'basicHealth',
    title: 'More Daily Activity Does Not Automatically Mean Burning More Total Calories',
    teaser: 'The Hadza, a hunter-gatherer population studied for over a decade, get five to ten times more daily physical activity than the average Westerner, yet burn about the same total calories per day once body size is accounted for.',
    summary: 'Researchers measured total daily energy expenditure directly, using the doubly-labeled water method, in the Hadza, a hunter-gatherer population in Tanzania studied for over a decade specifically for what their lifestyle might reveal about human metabolism. Despite dramatically higher daily physical activity than people in industrialized countries, the Hadza\'s average total daily energy expenditure, once adjusted for body size, was no different from that of sedentary Westerners. A follow-up study across a broader range of populations and activity levels found the same pattern: total energy expenditure rises with activity only up to a point, then plateaus, consistent with the body adapting its own energy use elsewhere (reducing energy spent on other physiological processes) rather than simply burning proportionally more with more movement. This directly complicates a common, simplified assumption: that exercising more reliably burns a large amount of extra total calories on top of a normal day. It does not mean exercise is unhelpful, the Hadza show separately documented cardiovascular benefits from all that activity (covered next), only that "more movement equals proportionally more total calories burned" is not the straightforward relationship it is often assumed to be. This constrained-energy-expenditure model is still an active area of research, not a fully settled consensus, and some researchers studying different populations and methods have reached different conclusions about how strong the constraint actually is.',
    citations: [
      { source: 'Pontzer H et al. 2012, PLOS ONE: Hunter-Gatherer Energetics and Human Obesity', url: 'https://pubmed.ncbi.nlm.nih.gov/22848382/' },
      { source: 'Pontzer H et al. 2016, Current Biology: Constrained Total Energy Expenditure and Metabolic Adaptation to Physical Activity in Adult Humans', url: 'https://pubmed.ncbi.nlm.nih.gov/26832439/' },
    ],
    overallTier: 'moderate',
    stageNote: 'Real, directly measured data from multiple populations, but the underlying model (that total energy expenditure is constrained rather than additive) is still actively debated within the research field, not a settled finding.',
    relatedIds: ['bodyfat-hadza-cardiovascular-health', 'type2-metabolic-syndrome-cluster'],
  },
  {
    id: 'bodyfat-hadza-cardiovascular-health',
    category: 'basicHealth',
    title: 'A Population With Very Low Rates of Heart Disease and Diabetes, Studied Directly',
    teaser: 'Researchers measured blood pressure and cardiovascular biomarkers directly in the Hadza and found essentially none of the risk factors common in industrialized populations, at any age.',
    summary: "A direct study of the Hadza measured blood pressure across nearly 200 people and cardiovascular biomarkers (C-reactive protein, cholesterol, triglycerides) in a smaller sample, alongside continuous heart-rate monitoring to quantify actual daily activity. The Hadza spend over two hours a day in moderate-to-vigorous physical activity on average, more than 14 times the amount typically measured in large United States epidemiological studies, and researchers found low blood pressure across every age group studied and consistently favorable levels on every cardiovascular biomarker measured. The honest limit here matters: this is an observational study of one population, not a controlled experiment, so it cannot cleanly separate how much of this protection comes from activity level specifically versus diet, body composition, or other lifestyle factors that all differ from industrialized populations at the same time. Still, it is a directly measured data point supporting a documented relationship between sustained physical activity and cardiovascular health, worth reading alongside the dedicated cardiovascular disease research rather than as an isolated documentary anecdote.",
    citations: [
      { source: 'Raichlen DA et al. 2017, American Journal of Human Biology: Physical activity patterns and biomarkers of cardiovascular disease risk in hunter-gatherers', url: 'https://pubmed.ncbi.nlm.nih.gov/27723159/' },
    ],
    overallTier: 'moderate',
    stageNote: 'Observational, one population; directly measured, but not a controlled experiment isolating activity from diet and other lifestyle differences.',
    relatedIds: ['bodyfat-constrained-energy-expenditure', 'cvd-overview'],
  },
  {
    id: 'bodyfat-visceral-vs-subcutaneous',
    category: 'basicHealth',
    title: 'Where Fat Is Stored Matters as Much as How Much There Is',
    teaser: 'Fat stored deep around the organs (visceral fat) carries a measurably different, worse metabolic risk than fat stored just under the skin (subcutaneous fat), even at the same total amount.',
    summary: "Not all body fat behaves the same way metabolically. Visceral fat, stored deep in the abdominal cavity around the organs, is consistently linked to glucose intolerance, unfavorable cholesterol levels, and high blood pressure, the specific classification of visceral fat obesity as its own distinct risk category, developed through direct CT-scan measurement, that this research traces back to. Subcutaneous fat, stored just under the skin, does not carry the same risk profile at a comparable amount. This distinction is the documented reason two people with a similar body-fat percentage, or even a similar total weight, can have meaningfully different metabolic health, and it's part of why the documentary highlighted sumo wrestlers specifically: despite very high total body fat, active wrestlers were reported to carry disproportionately more of it subcutaneously rather than viscerally, alongside favorable glucose and cholesterol levels while actively training. That specific sumo-wrestler comparison traces to the documentary and secondary science journalism rather than a dedicated peer-reviewed study found in this search, so it's kept here as an illustrative example rather than a citation on its own, clearly separate from the well-established general visceral-fat science above. Waist circumference (a rough proxy for visceral fat) is a more informative single number for metabolic risk than weight or body-fat percentage alone.",
    citations: [
      { source: 'Matsuzawa Y et al. 1995, Obesity Research: Pathophysiology and pathogenesis of visceral fat obesity', url: 'https://pubmed.ncbi.nlm.nih.gov/8581775/' },
    ],
    overallTier: 'strong',
    stageNote: 'The general visceral-fat-vs-subcutaneous-fat science is well established and widely replicated; the specific sumo-wrestler comparison is a documentary illustration, not independently verified here against a dedicated peer-reviewed study.',
    relatedIds: ['adiponectin-overview', 'mito-sugar-visceral-fat-cytokine-chain', 'glossary-visceral-fat', 'gout-metabolic-cluster-connection'],
  },
];
