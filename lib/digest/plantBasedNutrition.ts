import type { DigestEntry } from './types';

// Plant-Based Nutrition and Heart Disease Reversal -- a new Basic Health
// topic added 2026-08-23, direct request: look up the "How Not to Die"
// documentary (2025, directed by Shaun Monson, based on Dr. Michael
// Greger's 2015 book, featuring Dean Ornish and Caldwell Esselstyn among
// its interviewed physicians) and fact-check its claims against the
// peer-reviewed literature. None of the documentary's own footage or
// narration is treated as a citable source itself; every claim below
// traces to the primary trial or study, independently verified via
// WebSearch, the same discipline every entry in this Digest already
// follows.
//
// Real overlap check done first, not assumed: this app's own cardiovascular
// research already covers TMAO as an independent cardiovascular risk
// marker (see cardiovascularDisease.ts's own cvd-tmao-gut-microbiome-real-
// data entry) and the IARC processed-meat/colorectal-cancer classification
// (see foodAdditives.ts), so neither is repeated here. What the documentary
// raises that this Digest didn't yet cover: the actual intervention trials
// behind its two most prominently featured physicians, Ornish and
// Esselstyn, testing whether a plant-based diet can measurably reverse
// existing coronary artery disease, not just correlate with lower risk.
//
// Checked directly against all 19 tracked conditions, in two passes, not
// force-fit onto every one. First pass (same day): Cardiovascular Disease
// (its own real home, see cardiovascularDisease.ts's own cvd-plant-based-
// diet-existing-disease entry) and, via Ornish's own separate prostate-
// cancer trial, Prostate Health (prostateHealth.ts's own prostate-ornish-
// lifestyle-trial entry). Second pass, same day, for full breadth: real,
// independently-verified condition-specific evidence also found for Type 2
// Diabetes (type2Diabetes.ts's own type2-low-fat-vegan-diet-rct), Chronic
// Kidney Disease (chronicKidneyDisease.ts's own ckd-plant-based-diet-
// incidence-risk, a genuinely different angle -- incidence risk -- from
// that category's own pre-existing protein-source-management entry), MASLD/
// Fatty Liver Disease (fattyLiverDisease.ts's own masld-vegetarian-diet-rct-
// weight-loss-mechanism, deliberately including a second trial that
// complicates the headline result rather than hiding it), and Gout (gout.ts's
// own gout-whole-food-plant-based-pilot-rct). The remaining conditions (the
// full autoimmune group -- Hashimoto's, Graves', RA, lupus, MS, psoriasis,
// Sjögren's, IBD -- plus Migraine, IBS, Celiac, PCOS, and Type 1 Diabetes)
// were checked and correctly left without an entry: this documentary's
// central claims run through cardiometabolic mechanisms (insulin
// resistance, dietary acid load, TMAO, saturated fat), not the autoimmune-
// trigger or single-nutrient mechanisms those conditions' own research is
// actually built on, and no direct, citable connection to this specific
// documentary's own content turned up for any of them.
export const PLANT_BASED_NUTRITION_ENTRIES: DigestEntry[] = [
  {
    id: 'pbn-ornish-lifestyle-heart-trial',
    category: 'basicHealth',
    title: 'A Randomized Trial Found Coronary Artery Blockages Regressed With Intensive Lifestyle Change, Including a Plant-Based Diet',
    teaser: "The Lifestyle Heart Trial randomly assigned people with real, angiogram-confirmed coronary artery disease to intensive lifestyle change or usual care. One group's arteries measurably improved. The other's measurably worsened.",
    summary:
      "The Lifestyle Heart Trial, led by Dean Ornish and published in The Lancet in 1990, randomly assigned 48 people with angiographically-confirmed coronary artery disease to one of two groups: an experimental group following a low-fat vegetarian diet, stopping smoking, practicing stress management, and moderate exercise, or a usual-care control group receiving standard medical advice. Both groups had their coronary arteries directly measured by quantitative angiography (195 lesions analyzed in total) at the start and again after one year. The result was a real, measured divergence in the same direction the intervention intended: average percent diameter stenosis (how much of the artery is blocked) regressed from 40.0% to 37.8% in the experimental group, while it progressed from 42.7% to 46.1% in the control group over the same year. A five-year follow-up of the same cohort found this gap widening further, the lifestyle group continuing to improve while the control group's disease kept advancing. This was one of the first randomized controlled trials to demonstrate that intensive lifestyle change, diet included, could measurably reverse an already-established, hard, objectively-measured disease process, not just lower a future risk estimate.",
    citations: [
      { source: 'Can lifestyle changes reverse coronary heart disease? The Lifestyle Heart Trial, Ornish D et al., The Lancet, 1990, PMID 1973470', url: 'https://pubmed.ncbi.nlm.nih.gov/1973470/' },
    ],
    overallTier: 'moderate',
    stageNote: 'A real randomized design with hard, objectively-measured angiographic outcomes, genuinely stronger evidence than an observational diet-pattern study. Tiered moderate rather than strong specifically because of its small size (48 people total, 28 in the experimental group), a real limitation on how confidently this one trial\'s exact numbers generalize, even though the direction and mechanism are well-supported elsewhere.',
    relatedIds: ['cvd-tmao-gut-microbiome-real-data', 'cvd-mediterranean-diet-predimed', 'pbn-esselstyn-cohort-longterm', 'cvd-plant-based-diet-existing-disease', 'prostate-ornish-lifestyle-trial', 'type2-low-fat-vegan-diet-rct', 'ckd-plant-based-diet-incidence-risk', 'masld-vegetarian-diet-rct-weight-loss-mechanism', 'gout-whole-food-plant-based-pilot-rct'],
  },
  {
    id: 'pbn-esselstyn-cohort-longterm',
    category: 'basicHealth',
    title: "An 18-Patient, Long-Term Case Series Reported Disease Arrest in Every Participant and Reversal in Nearly Half, With a Design Limitation",
    teaser: 'Caldwell Esselstyn tracked 18 patients with severe, already-progressing heart disease on a strict plant-based diet for over a decade. None had a cardiac event on the diet. The study had no control group.',
    summary:
      "Caldwell Esselstyn's long-running case series enrolled 18 patients with severe, angiographically-confirmed coronary artery disease, most of whom had been told by their doctors that little more could be done. In the 8 years before joining the study, this same group of patients had collectively experienced 49 cardiovascular events between them. Esselstyn placed them on a strict, fat-restricted, whole-food, plant-based diet and tracked them for over a decade, publishing updates at 5, 12, and beyond 20 years. Average cholesterol fell by roughly half, disease progression halted in every participant who stayed on the diet, and repeat angiography documented actual measured reversal of blockages in several of them. This is real, genuine, long-term data, and it's also a fundamentally different kind of evidence than the Ornish trial above: there was no control group, no randomization, and the 18 participants were a small, self-selected group of people motivated enough to sustain a very strict diet for years, meaning it's honestly not possible to fully separate the diet's effect from the characteristics of the people willing and able to follow it that strictly. Worth holding both things at once: this is a real, striking, long-term result in a group nothing else had worked for, and it's a design that can't, on its own, prove the diet caused the outcome the way a randomized trial can.",
    citations: [
      { source: 'Updating a 12-Year Experience With Arrest and Reversal Therapy for Coronary Heart Disease, Esselstyn CB, American Journal of Cardiology, 1999', url: 'https://www.dresselstyn.com/site/study03/' },
    ],
    overallTier: 'weak',
    stageNote: 'An uncontrolled case series, not a controlled trial, no comparison group means regression to the mean and self-selection can\'t be ruled out. Tiered weak on study design alone, despite genuinely long, real follow-up and objectively measured outcomes, the same honesty this app applies to every other uncontrolled case series.',
    relatedIds: ['pbn-ornish-lifestyle-heart-trial'],
  },
];
